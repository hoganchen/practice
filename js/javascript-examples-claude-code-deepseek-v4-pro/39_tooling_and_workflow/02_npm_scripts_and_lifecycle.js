/**
 * ============================================================================
 * 知识点：npm scripts 与生命周期钩子 —— 项目的"命令行入口表"
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】入门
 * 【前置知识】39_tooling_and_workflow/01_package_json_guide.js（package.json 字段）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    package.json 里的 `scripts` 字段是一张"命令名 → shell 命令"的映射表。
 *    执行 `npm run <名字>` 时，npm 会：
 *      (a) 先把 <名字> 对应的命令交给系统 shell（Windows 是 cmd.exe，macOS/Linux 是 sh）；
 *      (b) 在环境变量 PATH 最前面插入本项目及各级父目录的 node_modules/.bin；
 *      (c) 注入一批 npm_ 开头的环境变量（npm_package_name、npm_lifecycle_event 等）；
 *      (d) 自动按 pre<名字> → <名字> → post<名字> 的顺序执行。
 *    所以 scripts 不是"npm 的新语法"，它只是"带 PATH 注入和钩子的 shell 命令别名"。
 *
 * 2. 为什么需要（真实项目场景）
 *    团队里每个人的系统 shell、路径、环境变量都不一样。scripts 把这些差异
 *    收敛成一份**写进仓库、所有人共用**的命令清单：
 *      · 新人不用问"这个项目怎么跑测试"，看 package.json 就知道；
 *      · CI 不用猜命令，直接 `npm test`；
 *      · 工具升级换实现时，只改 scripts 一处，所有人自动跟着变。
 *    换句话说：scripts 是项目对外的"命令行 API"。
 *
 * 3. 核心语法要点
 *    见下方分节。本文件的特别之处是**真的去跑**：我们会在 os.tmpdir() 下建一个
 *    临时项目，真跑 `npm run`（纯本地，不联网、不装包），再在 finally 里删掉它。
 *
 * 4. 常见陷阱
 *    - 以为 `&&` 在所有 shell 里都是"前一条成功才执行后一条"：
 *      POSIX sh 里 `&&` 是逻辑与，`&` 是"放到后台"；cmd.exe 里 `&&` 也是逻辑与，
 *      但 `&` 是"无条件顺次执行"。语义不同，跨平台脚本必须只用 `&&`。
 *    - 在 scripts 里写 `NODE_ENV=production node app.js`：
 *      POSIX 能跑，**Windows cmd.exe 会直接报错**（"不是内部或外部命令"）。
 *      要么用 cross-env，要么在 JS 里设置。
 *    - 以为 `npm run x -- --flag` 里的 `--` 可有可无：没有 `--`，
 *      参数会被 npm 自己吃掉（当成 npm 的参数）。
 *    - 把 `pre`/`post` 当成"只能用于 build/test"：它们对**任何**脚本名都生效，
 *      包括你自己起的名字。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js
 *
 * 【预期输出】
 *   逐节打印：本仓库 scripts 的设计讲解、临时项目中真实执行的 pre/post 钩子链、
 *   PATH 中 node_modules/.bin 的注入证据、手写的 .bin 可执行文件被直接调用、
 *   环境变量的两种设置方式及 Windows 下的失败演示、npm run 与 npx 的区别、
 *   脚本失败时退出码如何传播、以及跨平台写法对照表。
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IS_WINDOWS = process.platform === 'win32';

// ---------------------------------------------------------------------------
// 工具函数：在指定目录执行一条命令，返回 { status, stdout, stderr }
// ---------------------------------------------------------------------------
/**
 * 用 shell 执行命令。
 * 注意：Windows 上 npm 的可执行文件是 npm.cmd，且 Node 出于安全考虑
 * （CVE-2024-27980）禁止在 shell:false 时直接 spawn .cmd/.bat，
 * 所以跨平台跑 npm 必须用 shell: true + 单个命令字符串。
 */
function run(command, cwd, timeout = 60_000) {
  const r = spawnSync(command, {
    cwd,
    encoding: 'utf8',
    shell: true,
    timeout,
  });
  return {
    status: r.status,
    stdout: (r.stdout ?? '').trim(),
    stderr: (r.stderr ?? '').trim(),
  };
}

/** 打印一段缩进后的输出 */
function dump(label, text) {
  if (!text) {
    console.log(`    ${label}：(空)`);
    return;
  }
  console.log(`    ${label}：`);
  for (const line of text.split('\n')) console.log(`      | ${line}`);
}

// ---------------------------------------------------------------------------
// 1. 先看本仓库真实 scripts 的设计
// ---------------------------------------------------------------------------
console.log('--- 1. 本仓库 scripts 的设计思路 ---');

const repoPkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
for (const [name, cmd] of Object.entries(repoPkg.scripts)) {
  console.log(`  "${name}": "${cmd}"`);
}
console.log();
console.log('  逐条解读：');
console.log('    check       = node scripts/run-all.js');
console.log('                  把仓库里所有示例跑一遍，任一失败则整体失败。');
console.log('                  它是"质量闸门"——CI 上唯一必须通过的命令。');
console.log('    check:list  = node scripts/run-all.js --list');
console.log('                  同一脚本的不同模式（--list 只列出会有哪些文件被跑）。');
console.log('                  冒号 check:list 只是**命名惯例**（分组前缀），');
console.log('                  npm 不解析冒号，它就是一个普通字符串名字。');
console.log('    check:html  = node scripts/check-html.js');
console.log('                  HTML 示例无法在 Node 里跑，所以单独用脚本做静态检查。');
console.log('    check:all   = node scripts/run-all.js && node scripts/check-html.js');
console.log('                  用 && 串联：前一步失败，后一步**不会**执行。');
console.log();
console.log('  设计上的三个要点：');
console.log('    1) 每个 script 只调用一个 node 脚本，逻辑写在 JS 里而不是塞进一行 shell。');
console.log('       这样没有跨平台引号地狱，逻辑也能被测试和复用。');
console.log('    2) 用 ":" 分组命名，让 npm run（不带参数）打印出的列表自带层次感。');
console.log('    3) 提供 check:all 这样的"聚合入口"，CI 只需要记住一条命令。');
console.log();

console.log('  npm run 不带参数时，npm 会列出所有可用脚本（下面是本仓库的名字）：');
const listed = run('npm run', ROOT);
console.log(`    npm run 退出码 = ${listed.status}`);
for (const line of listed.stdout.split('\n')) {
  if (line.trim()) console.log(`      | ${line}`);
}
console.log();

// ---------------------------------------------------------------------------
// 2. 临时项目：真实执行 pre / post 钩子链
// ---------------------------------------------------------------------------
console.log('--- 2. pre / post 钩子：真实执行一次 ---');

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'npm-scripts-demo-'));

try {
  const demoDir = path.join(tmpRoot, 'lifecycle-demo');
  await fs.mkdir(demoDir, { recursive: true });

  // 每个钩子只做一件事：打印自己的名字。这样执行顺序一目了然。
  // 用 node -e 而不是 echo，是为了让输出跨平台完全一致（echo 在 cmd 与 sh 里行为不同）。
  const sayCmd = (who) => `node -e "console.log('[${who}] 执行了')"`;

  const demoPkg = {
    name: 'lifecycle-demo',
    version: '1.0.0',
    private: true,
    scripts: {
      // pre/post 的命名规则：在任意脚本名前后加上 pre / post 前缀即可
      prebuild: sayCmd('prebuild'),
      build: sayCmd('build'),
      postbuild: sayCmd('postbuild'),
      // 自定义名字同样支持 pre/post，不只是 build/test 这种标准名
      predeploy: sayCmd('predeploy'),
      deploy: sayCmd('deploy'),
      // 失败传播演示：exit 1
      fail: 'node -e "process.exit(1)"',
      // && 短路演示：fail 失败 → 后一条不执行
      failThen: `${'node -e "process.exit(1)"'} && ${sayCmd('不该执行')}`,
      // npm 注入的环境变量
      showenv:
        'node -e "console.log(\'npm_package_name=\' + process.env.npm_package_name); console.log(\'npm_lifecycle_event=\' + process.env.npm_lifecycle_event)"',
    },
  };

  await fs.writeFile(
    path.join(demoDir, 'package.json'),
    JSON.stringify(demoPkg, null, 2) + '\n',
    'utf8',
  );

  console.log(`  临时项目：${demoDir}`);
  console.log('  scripts：' + Object.keys(demoPkg.scripts).join(', '));
  console.log();

  // --- 2.1 执行 build，观察 pre → build → post
  console.log('  [2.1] 执行 npm run build，观察钩子链：');
  const buildRun = run('npm run build --silent', demoDir);
  dump('输出', buildRun.stdout);
  console.log(`    退出码 = ${buildRun.status}`);
  console.log('    → npm 自动按 prebuild → build → postbuild 执行，一次命令触发三步。');
  console.log();

  // --- 2.2 自定义名字的钩子
  console.log('  [2.2] 自定义脚本名 deploy 同样触发 predeploy：');
  const deployRun = run('npm run deploy --silent', demoDir);
  dump('输出', deployRun.stdout);
  console.log('    → pre/post 是**命名约定**，对任何脚本名都成立。');
  console.log();

  // --- 2.3 失败如何传播
  console.log('  [2.3] 脚本失败时，退出码如何传播：');
  const failRun = run('npm run fail --silent', demoDir);
  console.log(`    npm run fail 退出码 = ${failRun.status}`);
  if (failRun.stderr) dump('stderr（截断）', failRun.stderr.split('\n').slice(0, 3).join('\n'));
  console.log('    → 脚本里的退出码会原样成为 npm 的退出码，CI 据此判断成败。');
  console.log();

  const shortRun = run('npm run failThen --silent', demoDir);
  console.log(`    "exit(1) && 打印" 的退出码 = ${shortRun.status}`);
  dump('输出', shortRun.stdout);
  console.log('    → 输出里只有失败，没有"不该执行"，说明 && 成功短路。');
  console.log('      这是把多个步骤串成一条流水线的关键：任何一步失败就立刻停。');
  console.log();

  // --- 2.4 npm 注入的环境变量
  console.log('  [2.4] npm 自动注入的环境变量：');
  const envRun = run('npm run showenv --silent', demoDir);
  dump('输出', envRun.stdout);
  console.log('    → 脚本里可以读到当前包的信息和正在执行哪个脚本，');
  console.log('      这让"一个脚本根据调用名做不同事"成为可能。');
  console.log();

  // --- 2.5 PATH 注入：npm run 会把 node_modules/.bin 放到 PATH 最前面
  console.log('  [2.5] node_modules/.bin 自动加入 PATH 的证据：');

  // 先在项目里手写一个可执行文件放进 node_modules/.bin。
  // npm 平时是安装依赖时自动为每个包生成这里的"快捷方式"，
  // 我们手写一个，等价于模拟了一次 npm install 的产物。
  const binDir = path.join(demoDir, 'node_modules', '.bin');
  await fs.mkdir(binDir, { recursive: true });
  // POSIX 版本：带 shebang 的 shell 脚本
  await fs.writeFile(path.join(binDir, 'mytool'), '#!/bin/sh\necho hello-from-.bin\n', 'utf8');
  // Windows 版本：cmd.exe 认识的批处理。npm 在 Windows 上也是这样成对生成的。
  await fs.writeFile(path.join(binDir, 'mytool.cmd'), '@echo hello-from-.bin\r\n', 'utf8');

  demoPkg.scripts.showbin = 'mytool';
  demoPkg.scripts.showpath =
    'node -e "const path=require(\'path\');const hits=process.env.PATH.split(path.delimiter).filter(p=>p.endsWith(path.join(\'node_modules\',\'.bin\')));console.log(hits.slice(0,3).join(\'\\n\'))"';
  await fs.writeFile(
    path.join(demoDir, 'package.json'),
    JSON.stringify(demoPkg, null, 2) + '\n',
    'utf8',
  );

  const binRun = run('npm run showbin --silent', demoDir);
  console.log(`    调用 "mytool"（没有写路径，也没有写 node）：退出码 = ${binRun.status}`);
  dump('输出', binRun.stdout);
  console.log('    → 说明 node_modules/.bin 真的在 PATH 里，所以 eslint / vitest / prettier');
  console.log('      这些命令在 script 里可以直接写名字，不用写 node_modules/.bin/eslint。');
  console.log();

  const pathRun = run('npm run showpath --silent', demoDir);
  console.log('    从脚本内部看到的 PATH 里，以 node_modules/.bin 结尾的条目（前 3 条）：');
  dump('PATH 片段', pathRun.stdout);
  console.log('    → npm 会把当前项目**以及每一级父目录**的 node_modules/.bin 都加进 PATH，');
  console.log('      这是 monorepo 里子包能直接用根目录安装的工具的原因。');
  console.log();

  // --- 2.6 传参：-- 的作用
  console.log('  [2.6] 给脚本传参必须用 --：');

  // 这里必须用"真实的脚本文件"而不是 node -e：
  // node -e "..." --port 3000 会被 node 自己当成非法选项（bad option）。
  await fs.writeFile(
    path.join(demoDir, 'argreporter.js'),
    '// 把收到的命令行参数原样打印出来\nconsole.log(JSON.stringify(process.argv.slice(2)));\n',
    'utf8',
  );
  demoPkg.scripts.args = 'node argreporter.js';
  await fs.writeFile(
    path.join(demoDir, 'package.json'),
    JSON.stringify(demoPkg, null, 2) + '\n',
    'utf8',
  );

  const withDashDash = run('npm run args --silent -- --port 3000', demoDir);
  dump('npm run args -- --port 3000  →  脚本收到', withDashDash.stdout);
  const noDashDash = run('npm run args --silent --port 3000', demoDir);
  dump('npm run args --port 3000     →  脚本收到', noDashDash.stdout);
  console.log('    → 不加 -- 时，"--port" 被 npm 自己当成 npm 的参数吃掉了，');
  console.log('      脚本只收到剩下的 "3000"；加了 -- 才能原样收到 "--port 3000"。');
  console.log('      规则：`npm run <script> -- <参数>` 中，-- 之后的内容原样追加到命令尾部。');
  console.log();

  // -------------------------------------------------------------------------
  // 3. 环境变量：为什么需要 cross-env
  // -------------------------------------------------------------------------
  console.log('--- 3. 环境变量传递与跨平台陷阱 ---');

  const envPkgScripts = {
    // POSIX 写法：直接前置赋值
    posixStyle: 'NODE_ENV=production node -e "console.log(process.env.NODE_ENV)"',
    // 显式由 Node 自己设置，跨平台都可行
    nodeStyle:
      'node -e "process.env.NODE_ENV=\'production\';console.log(process.env.NODE_ENV)"',
  };
  demoPkg.scripts = { ...demoPkg.scripts, ...envPkgScripts };
  await fs.writeFile(
    path.join(demoDir, 'package.json'),
    JSON.stringify(demoPkg, null, 2) + '\n',
    'utf8',
  );

  console.log(`  当前平台：${process.platform}（${IS_WINDOWS ? 'Windows / cmd.exe' : 'POSIX / sh'}）`);
  console.log();
  console.log('  [3.1] POSIX 风格 "KEY=value node app.js"：');
  const posixRun = run('npm run posixStyle --silent', demoDir);
  console.log(`    退出码 = ${posixRun.status}`);
  if (posixRun.status === 0) {
    dump('输出', posixRun.stdout);
    console.log('    → 在 sh 里这是合法语法：临时给这一条命令设置环境变量。');
  } else {
    // 注意：cmd.exe 的报错文本是本地化且按 GBK 码页输出的，
    // 在 UTF-8 的终端里读回来会变成乱码，所以这里只描述含义、不回显原文。
    console.log('    脚本失败了，cmd.exe 的报错本意是"\'NODE_ENV\' 不是内部或外部命令"。');
    console.log('    （原文是系统本地化文本，编码与终端不一致时会显示为乱码，故不回显。）');
    console.log('    → 在 Windows 的 cmd.exe 里，开头的 "NODE_ENV=production" 不是合法命令，');
    console.log('      会被当成"要执行的程序名"，于是直接报错。');
    console.log('      这就是 cross-env 存在的唯一理由：它把同一份写法翻译成各平台都能跑的形态。');
  }
  console.log();

  console.log('  [3.2] 用 node 自己设置（跨平台都可行）：');
  const nodeEnvRun = run('npm run nodeStyle --silent', demoDir);
  console.log(`    退出码 = ${nodeEnvRun.status}`);
  dump('输出', nodeEnvRun.stdout);
  console.log('    → 不需要额外依赖，缺点是"环境变量必须由 JS 代码设置"，');
  console.log('      对"必须在 Node 启动前生效"的变量（如 NODE_OPTIONS）无效。');
  console.log();

  console.log('  三种跨平台方案对比：');
  const envTable = [
    ['KEY=value node app.js', '仅 POSIX', 'Windows cmd.exe 直接报错', '不推荐'],
    ['cross-env KEY=value node app.js', '全平台', '需要多装一个开发依赖', '最常用'],
    ['JS 代码里 process.env.KEY = ...', '全平台', '仅对该进程内生效', '够用时优先'],
  ];
  for (const [way, scope, cost, advice] of envTable) {
    console.log(`    ${way.padEnd(40)} ${scope.padEnd(8)} ${cost.padEnd(26)} ${advice}`);
  }
  console.log();

  // -------------------------------------------------------------------------
  // 4. npm run 与 npx 的区别
  // -------------------------------------------------------------------------
  console.log('--- 4. npm run 与 npx 的区别 ---');

  const runVsNpx = [
    [
      'npm run <name>',
      '执行 package.json 里 scripts 表登记过的命令',
      '只能跑已登记的名字',
      'PATH 会注入 node_modules/.bin',
      '项目统一入口，可复现',
    ],
    [
      'npx <cmd>',
      '直接执行一个可执行文件，可来自 node_modules/.bin，也可来自远端 registry',
      '任意命令名都能跑',
      '同样会注入 node_modules/.bin',
      '临时试工具、跑一次性命令',
    ],
  ];
  for (const [tool, what, limit, pathNote, use] of runVsNpx) {
    console.log(`  ${tool}`);
    console.log(`    是什么：  ${what}`);
    console.log(`    限制：    ${limit}`);
    console.log(`    PATH：    ${pathNote}`);
    console.log(`    适用场景：${use}`);
    console.log();
  }

  console.log('  一句话记忆：npm run 是"读表执行"，npx 是"按名字找可执行文件"。');
  console.log('  npx 若在本地找不到，会去 npm registry 下载——**这是联网行为**，');
  console.log('  在 CI 或受限网络里可能直接失败，所以正式流程一律用 npm run。');
  console.log();

  // -------------------------------------------------------------------------
  // 5. 跨平台写法对照表
  // -------------------------------------------------------------------------
  console.log('--- 5. 跨平台写法对照（写 scripts 前必看） ---');

  const crossPlatform = [
    ['串联多条命令', 'a && b', 'a && b', '两边语义一致，安全'],
    ['"前一条失败也继续"', 'a ; b', 'a & b', '语义不同，**不要用**'],
    ['删除目录', 'rm -rf dist', 'rd /s /q dist', '各写各的；或用 rimraf / node:fs'],
    ['拷贝文件', 'cp a b', 'copy a b', '改用 node:fs 的 cp 更省心'],
    ['设置环境变量', 'KEY=v node x.js', 'set KEY=v && node x.js', '改用 cross-env'],
    ['引用变量', '$VAR', '%VAR%', '改用 JS 读取 process.env'],
    ['通配符', 'src/*.js（shell 展开）', 'cmd.exe 不展开', '改用 node 脚本处理文件'],
    ['路径分隔符', '/', '\\', 'JS 里一律用 path.join / path.resolve'],
  ];
  for (const [scene, posix, win, advice] of crossPlatform) {
    console.log(`  ${scene}`);
    console.log(`    POSIX: ${posix}`);
    console.log(`    Windows: ${win}`);
    console.log(`    建议: ${advice}`);
  }
  console.log();

  console.log('  本仓库的做法：scripts 里**只写** "node scripts/xxx.js"，');
  console.log('  所有与平台相关的逻辑都交给 JS 的 node:path / node:fs 处理。');
  console.log('  这是最省事的跨平台策略——把平台差异关进 JS 这一个笼子里。');
  console.log();

  // -------------------------------------------------------------------------
  // 6. 生命周期全景
  // -------------------------------------------------------------------------
  console.log('--- 6. npm 生命周期全景 ---');

  const lifecycle = [
    ['pre<script>', '自定义', '任何脚本执行前自动跑'],
    ['<script>', '自定义', '脚本本体'],
    ['post<script>', '自定义', '任何脚本执行后自动跑'],
    ['preinstall', 'npm 内置', 'npm install 开始时；此时依赖还没装好，几乎什么都做不了'],
    ['postinstall', 'npm 内置', '依赖装完后；常用于编译原生模块、生成产物（慎用，会拖慢安装且容易被滥用）'],
    ['prepare', 'npm 内置', '本地 npm install 后、npm publish 前都跑；是"构建产物"最合适的位置'],
    ['prepublishOnly', 'npm 内置', '只在 npm publish 前跑；放"发布前必须通过"的检查，如测试'],
    ['prepack / postpack', 'npm 内置', 'npm pack / publish 打包前后'],
    ['pretest / posttest', 'npm 内置', 'npm test 前后的钩子（test 是内置脚本名，默认是报错占位）'],
  ];
  for (const [name, kind, note] of lifecycle) {
    console.log(`  ${name.padEnd(22)} ${kind.padEnd(10)} ${note}`);
  }
  console.log();
  console.log('  实践建议：只在 pre/post 里放"轻量、确定、快"的事情，');
  console.log('  重活（lint、测试、构建）应该显式写成一个具名脚本由 CI 调用，');
  console.log('  否则任何人跑一次 npm install 都会被动触发一长串构建，');
  console.log('  既慢又难排查。');
} finally {
  await fs.rm(tmpRoot, { recursive: true, force: true });
  console.log();
  console.log(`[清理] 已删除临时目录 ${tmpRoot}`);
}
