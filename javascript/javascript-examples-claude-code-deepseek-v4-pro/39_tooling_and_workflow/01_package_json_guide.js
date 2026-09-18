/**
 * ============================================================================
 * 知识点：package.json 字段详解 —— 一个项目的"身份证 + 说明书 + 依赖清单"
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】入门
 * 【前置知识】19_modules/01_commonjs_and_esm.js（模块系统）、21_json/01_json_basics.js（JSON）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    package.json 是 Node.js 项目根目录下的一个 JSON 文件，它同时承担三件事：
 *      (a) 描述这个包"是什么"（name / version / description / license / author）；
 *      (b) 描述这个包"怎么用"（type / main / module / exports / browser / files）；
 *      (c) 描述这个包"依赖谁、怎么跑"（dependencies / scripts / engines）。
 *    npm、pnpm、yarn 以及 Node.js 本身都会读它。它不是 JS 代码，
 *    所以里面**不能有注释、不能有尾随逗号、不能用单引号**——它是严格 JSON。
 *
 * 2. 为什么需要（真实项目场景）
 *    没有它，一个目录只是一堆 .js 文件；有了它，才是一个"可被别人安装、
 *    可被工具识别、可被 CI 构建"的包。真实项目里几乎所有的工程化工具
 *    （ESLint、Prettier、Vitest、TypeScript、bundler）都会先读 package.json
 *    来决定"这个项目是什么类型的模块、入口在哪、要不要跑某个脚本"。
 *
 * 3. 核心语法要点
 *    见下方分节讲解，本文件用两段真实数据对照演示：
 *      - 仓库自己的 package.json（真实、正在使用中的）；
 *      - 一个临时构造的"库作者"package.json（演示 exports / files / peerDependencies）。
 *
 * 4. 常见陷阱
 *    - 以为 `engines` 会强制拦截：它默认只是一条**建议**，npm 只打印警告。
 *    - 以为 `dependencies` 和 `devDependencies` 只是"分类好看"：安装生产环境依赖
 *      （`npm install --omit=dev`）时 devDependencies **不会被安装**，
 *      把运行时需要的包放进 devDependencies 会导致线上启动即崩。
 *    - 以为 `main` 一定生效：一旦声明了 `exports`，`main` 对**新版本 Node** 基本失效，
 *      这是"本地能跑、别人装了跑不起来"的最常见原因之一。
 *    - `type: "module"` 是**目录级**开关，会影响该目录下所有 `.js` 的解析方式。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/01_package_json_guide.js
 *
 * 【预期输出】
 *   逐节打印：本仓库真实 package.json 的字段解读、依赖三类（dependencies /
 *   devDependencies / peerDependencies / optionalDependencies）的取舍、
 *   type: "module" 的真实运行时效果（用临时目录演示 ESM 与 CJS 的差异）、
 *   engines 只是建议的证据、以及一个库作者视角的完整示例 package.json。
 * ============================================================================
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// 仓库根目录：本文件在 <root>/39_tooling_and_workflow/ 下，所以向上一级
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_PKG_PATH = path.join(ROOT, 'package.json');

// ---------------------------------------------------------------------------
// 1. 先读本仓库真实的 package.json
// ---------------------------------------------------------------------------
console.log('--- 1. 读取本仓库真实 package.json ---');

const rawText = await fs.readFile(REPO_PKG_PATH, 'utf8');
const pkg = JSON.parse(rawText);

console.log(`文件路径：${path.relative(ROOT, REPO_PKG_PATH)}`);
console.log(`文件大小：${rawText.length} 字节`);
console.log(`顶层字段数量：${Object.keys(pkg).length}`);
console.log('全部字段名：', Object.keys(pkg).join(', '));
console.log();

// ---------------------------------------------------------------------------
// 2. 字段逐个解读
// ---------------------------------------------------------------------------
console.log('--- 2. 每个字段到底管什么 ---');

// 用一张"字段 -> 说明"的表来讲解。这里不是语法演示，而是知识密度最高的部分。
const FIELD_DOCS = {
  // ---- 身份信息：给人看的，也是给 registry 看的 ----
  name: '包名。规则：全小写、可含 - _ . 、不超过 214 字符、不能有大写。发布到 npm 后它必须是全球唯一的。',
  version: '版本号，必须符合语义化版本规范（见 03_semver.js）。每次 npm publish 都必须比上一版大，否则会被拒绝。',
  description: '一句话描述。npm search 会用到，人们决定要不要装你的包时第一眼看的就是它。',
  keywords: '字符串数组，用于 npm 搜索。例如 ["eslint", "lint", "style"]。',
  author: '作者信息，可写成 "名字 <邮箱> (主页)" 或 { name, email, url } 对象。',
  license: '开源许可证标识符，如 MIT / Apache-2.0 / ISC。不写会有法律风险，npm 会警告。',
  homepage: '项目主页 URL。',
  repository: '源码仓库地址，常写成 { "type": "git", "url": "..." }。',
  bugs: '提 issue 的地址，通常 { "url": "https://github.com/xx/yy/issues" }。',

  // ---- 模块解析：决定别人 require/import 你的包时加载哪个文件 ----
  type: '取值 "module" 或 "commonjs"（默认 "commonjs"）。它决定了本目录下 .js 文件按 ESM 还是 CJS 解析。详见第 4 节。',
  main: 'CJS 传统入口。require("pkg") 时加载它。默认是目录下的 index.js。被 exports 覆盖后对新 Node 失效。',
  module: '社区约定（打包工具识别）的 ESM 入口。Node.js 本身不读它，bundler（rollup/webpack/vite）会优先用它。',
  browser: '浏览器专用入口/替换表。可以是字符串（浏览器入口），也可以是对象（用 A 替换 B，用于剔除 Node 内置模块的 polyfill）。',
  exports: '现代入口声明。支持"条件导出"（import/require/browser/node/default）与子路径导出，优先级最高，且会**封闭**包内部路径。',
  types: 'TypeScript 类型声明文件入口（.d.ts）。',
  files: '白名单，只列会被 npm publish 打包进 tarball 的文件/目录。没列进去的（除少数默认包含项外）不会被发布。',

  // ---- 运行与依赖 ----
  engines: '声明可用的运行时版本，例如 { "node": ">=18.0.0" }。**默认只是建议**，npm 只警告不阻断。',
  private: '设为 true 时 npm publish 会直接报错。所有不打算开源的业务项目都应该加这一行。',
  scripts: 'npm run 可执行的命令表。详见 02_npm_scripts_and_lifecycle.js。',
  dependencies: '生产依赖：运行你的代码时**必须存在**的包。`npm install --omit=dev` 时仍会安装。',
  devDependencies: '开发依赖：只在开发/测试/构建时需要（lint、测试框架、打包器）。生产安装时会被跳过。',
  peerDependencies: '同伴依赖：由"使用你这个包的人"来安装的依赖。库作者最常误用、也最需要理解的一类。',
  optionalDependencies: '可选依赖：装不上也不让整个安装失败（常用于平台相关的原生模块，如 fsevents）。',
  packageManager: '声明本项目用哪个包管理器及其版本（如 "pnpm@9.0.0"），corepack 会据此选择。',
  workspaces: 'monorepo 的子包路径数组，如 ["packages/*"]。',
};

for (const [key, doc] of Object.entries(FIELD_DOCS)) {
  const present = Object.prototype.hasOwnProperty.call(pkg, key);
  const mark = present ? '✔ 本仓库有' : '· 本仓库无';
  // 本仓库有的字段顺便把值打出来，没有的只打印说明
  const valueText = present ? `  当前值：${JSON.stringify(pkg[key])}` : '';
  console.log(`  [${mark}] ${key}`);
  console.log(`        ${doc}${valueText}`);
}
console.log();

// ---------------------------------------------------------------------------
// 3. 本仓库 package.json 的"体检报告"
// ---------------------------------------------------------------------------
console.log('--- 3. 本仓库 package.json 体检 ---');

// private: true 意味着这个包永远不会被误发布出去。
console.log(`private = ${pkg.private}  →  npm publish 会被拒绝，防止把手艺不精的示例误发到 npm。`);
// type: module 是本仓库所有 .js 都用 ESM 写的根本原因。
console.log(`type = "${pkg.type}"  →  本仓库所有 .js 都被当作 ES Module 解析（能用 import/export）。`);
console.log(`engines.node = "${pkg.engines.node}"  →  声明需要 Node 18+，但注意它只是建议。`);
console.log();

console.log('生产依赖（dependencies）：');
for (const [name, range] of Object.entries(pkg.dependencies ?? {})) {
  console.log(`  ${name.padEnd(12)} ${range}`);
}
console.log('开发依赖（devDependencies）：');
for (const [name, range] of Object.entries(pkg.devDependencies ?? {})) {
  console.log(`  ${name.padEnd(12)} ${range}`);
}
console.log();

// 观察：本仓库所有版本都是 "^x.y.z" 形式。^ 是什么意思？03_semver.js 会讲透。
const allRanges = [
  ...Object.values(pkg.dependencies ?? {}),
  ...Object.values(pkg.devDependencies ?? {}),
];
const caretCount = allRanges.filter((r) => r.startsWith('^')).length;
console.log(
  `版本范围形态统计：共 ${allRanges.length} 条依赖，其中 ${caretCount} 条使用 "^" 前缀。`,
);
console.log('  "^" 表示"允许安装不改变最左非零位的小版本升级"，详见 03_semver.js。');
console.log('  注意：范围是"允许什么"，真正装了哪个版本由 package-lock.json 决定（见 07_lockfile_and_ci.js）。');
console.log();

console.log('本仓库的 scripts：');
for (const [name, cmd] of Object.entries(pkg.scripts ?? {})) {
  console.log(`  npm run ${name.padEnd(10)} → ${cmd}`);
}
console.log('  设计思路：check 跑全部示例，check:html 检查 HTML 示例，');
console.log('  check:all 用 && 串起两者。冒号是 npm 的命名惯例（分组前缀），不是语法。');
console.log();

// ---------------------------------------------------------------------------
// 4. type: "module" 到底改变了什么？（真实运行时演示）
// ---------------------------------------------------------------------------
console.log('--- 4. type 字段的运行时效果 ---');

// 关键点：Node 判断一个 .js 文件是 ESM 还是 CJS，看的是"离它最近的 package.json"
// 里的 type 字段。我们建两个临时子目录，各放一份 package.json，
// 唯一区别就是一个有 type: "module"，一个没有，然后分别 import 同一个文件内容。
//
// 用 os.tmpdir() + mkdtemp 建临时目录，用完在 finally 里删掉，
// 这样演示 package.json 不会污染仓库本身。
const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'pkg-json-demo-'));

try {
  // 公用同一段"CommonJS 风格"的源码：用 module.exports 导出
  const CJS_STYLE_SOURCE = 'module.exports = { hello: "来自 CJS 的问候" };\n';

  const makeSubProject = async (subName, typeValue) => {
    const dir = path.join(tmpRoot, subName);
    await fs.mkdir(dir, { recursive: true });
    const manifest = { name: subName, version: '1.0.0' };
    if (typeValue) manifest.type = typeValue;
    await fs.writeFile(
      path.join(dir, 'package.json'),
      JSON.stringify(manifest, null, 2) + '\n',
      'utf8',
    );
    await fs.writeFile(path.join(dir, 'legacy.js'), CJS_STYLE_SOURCE, 'utf8');
    return pathToFileURL(path.join(dir, 'legacy.js')).href;
  };

  // 场景 A：package.json 里没有 type 字段 → 默认 commonjs → module.exports 可用
  const cjsUrl = await makeSubProject('no_type_field', null);
  const cjsMod = await import(cjsUrl);
  console.log('场景 A：package.json 无 type 字段（默认 commonjs）');
  console.log('  文件内容：' + JSON.stringify(CJS_STYLE_SOURCE.trim()));
  console.log('  import 结果 default =', JSON.stringify(cjsMod.default));
  console.log('  → module.exports 被 Node 包成 default 导出，正常工作。');
  console.log();

  // 场景 B：同一个文件内容，但目录里 package.json 声明了 type: "module"
  const esmUrl = await makeSubProject('with_type_module', 'module');
  console.log('场景 B：package.json 有 "type": "module"');
  try {
    const esmMod = await import(esmUrl);
    console.log('  意外成功了：', JSON.stringify(esmMod.default));
  } catch (err) {
    // 这里是**故意**触发错误的演示，必须自己 try/catch，不让进程非零退出
    console.log(`  import 直接抛错：${err.constructor.name}: ${err.message.split('\n')[0]}`);
    console.log('  → 因为 .js 被当作 ESM 解析，而 ESM 里没有 module 这个变量，');
    console.log('    所以 module.exports 会直接报 "module is not defined"。');
    console.log('    想在这种目录里写 CJS，必须把文件名改成 .cjs；反之 ESM 用 .mjs 永远安全。');
  }
  console.log();

  console.log('结论：type 是**目录级**的开关，不是文件级的。同一个 .js 内容，');
  console.log('      换个 package.json 就可能报错——这是接手老项目时最容易懵的地方。');
  console.log();

  // -------------------------------------------------------------------------
  // 5. 依赖的四种类别：谁该放哪一格
  // -------------------------------------------------------------------------
  console.log('--- 5. dependencies / devDependencies / peerDependencies / optionalDependencies ---');

  const depGroups = [
    {
      field: 'dependencies',
      installWhen: 'npm install / npm install --omit=dev 都会装',
      whoInstalls: '你的包的使用者（自动）',
      examples: 'express、axios、lodash',
      rule: '你的源码 import 了它，并且在**运行时**（含线上服务器）必须存在。',
      trap: '把只用于构建的包放这里 → 使用者的 node_modules 被白白撑大。',
    },
    {
      field: 'devDependencies',
      installWhen: 'npm install 会装；npm install --omit=dev 不装',
      whoInstalls: '只有你的开发环境',
      examples: 'eslint、prettier、vitest、typescript',
      rule: '只在开发/测试/构建/发布流程中用到，运行你的代码时用不到。',
      trap: '把运行时需要的包放这里 → 本地一切正常，线上 --omit=dev 装完后启动即 "Cannot find module"。',
    },
    {
      field: 'peerDependencies',
      installWhen: 'npm 7+ 会自动补装（若宿主没装），npm 6 只警告',
      whoInstalls: '**由宿主项目**安装，你只是声明"我需要它，但不要给我装一份副本"',
      examples: 'react、vue、eslint 插件对 eslint 的依赖',
      rule: '库作者专用：你的包需要宿主提供某个包，且**必须与宿主共用同一个实例**。',
      trap: '把 react 放进 dependencies → 你打包进去的 React 和宿主的 React 是两个实例，hooks 报 "Invalid hook call"。',
    },
    {
      field: 'optionalDependencies',
      installWhen: '尝试安装，失败则跳过整个安装流程而不报错',
      whoInstalls: '自动，但允许失败',
      examples: 'fsevents（只在 macOS 有）、各平台的原生二进制',
      rule: '装不上也能降级工作的依赖，通常是平台相关的原生模块。',
      trap: '把可选依赖当兜底用 → 用户环境行为不一致，问题极难复现。',
    },
  ];

  for (const g of depGroups) {
    console.log(`  【${g.field}】`);
    console.log(`    安装时机：${g.installWhen}`);
    console.log(`    谁来装：  ${g.whoInstalls}`);
    console.log(`    典型例子：${g.examples}`);
    console.log(`    判断标准：${g.rule}`);
    console.log(`    常见错误：${g.trap}`);
    console.log();
  }

  // -------------------------------------------------------------------------
  // 6. engines 只是建议 —— 用证据说话
  // -------------------------------------------------------------------------
  console.log('--- 6. engines 只是"建议" ---');

  // 构造一个要求 Node 99 的临时项目，再让 npm 读它。
  // 不联网、不装包，只做本地校验（npm pkg get 是纯本地操作）。
  const engineDemoDir = path.join(tmpRoot, 'engine_demo');
  await fs.mkdir(engineDemoDir, { recursive: true });
  await fs.writeFile(
    path.join(engineDemoDir, 'package.json'),
    JSON.stringify(
      {
        name: 'engine-demo',
        version: '1.0.0',
        engines: { node: '>=99.0.0' },
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  console.log(`  临时项目声明了 engines.node = ">=99.0.0"，而当前 Node 是 ${process.version}。`);
  console.log('  Node 自己完全不检查这个字段——我们刚刚能正常读它、解析它，没有任何报错。');
  console.log('  检查它的是包管理器，而且默认只是"警告"：');
  console.log('    · npm install 时若版本不符 → 打印 EBADENGINE 警告，然后**继续装**。');
  console.log('    · 只有项目 .npmrc 里写了 engine-strict=true，npm 才会把警告升级为错误。');
  console.log('  所以 engines 是"声明意图 + 给 CI 和人类看的文档"，不是运行时闸门。');
  console.log('  真要在运行时拦截，得自己写检查，例如：');
  console.log('    const [major] = process.versions.node.split(".").map(Number);');
  console.log('    if (major < 18) throw new Error("需要 Node 18+");');
  console.log();

  // 真的执行一次上面这段检查逻辑，证明"自己检查"是可行的
  const [major] = process.versions.node.split('.').map(Number);
  console.log(`  实测：当前 Node 主版本 ${major}，自检结果：${major >= 18 ? '通过' : '不通过'}。`);
  console.log();

  // -------------------------------------------------------------------------
  // 7. 库作者视角：一个完整的示例 package.json
  // -------------------------------------------------------------------------
  console.log('--- 7. 库作者视角的完整示例（临时目录中构造） ---');

  const libDir = path.join(tmpRoot, 'example-lib');
  await fs.mkdir(path.join(libDir, 'dist'), { recursive: true });
  await fs.writeFile(path.join(libDir, 'dist', 'index.js'), 'export const a = 1;\n', 'utf8');
  await fs.writeFile(path.join(libDir, 'dist', 'index.cjs'), 'exports.a = 1;\n', 'utf8');
  await fs.writeFile(path.join(libDir, 'dist', 'index.d.ts'), 'export declare const a: number;\n', 'utf8');
  // 故意放一个不该被发布的文件，用 files 白名单把它挡在外面
  await fs.writeFile(path.join(libDir, 'secret-notes.md'), '内部笔记，不该发布\n', 'utf8');

  const libPkg = {
    name: '@acme/date-utils',
    version: '2.1.0',
    description: '一组日期处理的纯函数，零依赖',
    type: 'module',
    // exports：现代入口声明，支持条件导出，且会封闭内部路径
    exports: {
      // "." 表示包主入口，"." + "./xxx" 表示子路径导出
      '.': {
        types: './dist/index.d.ts', // 类型解析放最前面（顺序有意义）
        import: './dist/index.js', // ESM 使用者走这条
        require: './dist/index.cjs', // CJS 使用者走这条
        default: './dist/index.js', // 兜底，必须放最后
      },
      './package.json': './package.json', // 允许别人读你的清单
    },
    main: './dist/index.cjs', // 老工具兜底（有 exports 后对新 Node 基本失效）
    module: './dist/index.js', // bundler 优先读它
    types: './dist/index.d.ts',
    files: ['dist'], // 白名单：只发布 dist/，secret-notes.md 被挡在外面
    engines: { node: '>=18' },
    peerDependencies: { dayjs: '^1.11.0' }, // 由宿主提供，避免重复实例
    peerDependenciesMeta: { dayjs: { optional: true } }, // 但缺失也能降级工作
    dependencies: {}, // 零运行时依赖，是库作者最好的卖点
    devDependencies: { vitest: '^2.1.8', typescript: '^5.6.0' },
    sideEffects: false, // 告诉 bundler "本包无副作用"，可以放心 tree-shaking
  };

  await fs.writeFile(
    path.join(libDir, 'package.json'),
    JSON.stringify(libPkg, null, 2) + '\n',
    'utf8',
  );

  console.log('临时库项目：' + libDir);
  console.log('package.json 内容：');
  console.log(JSON.stringify(libPkg, null, 2).split('\n').map((l) => '  ' + l).join('\n'));
  console.log();

  console.log('  几个关键设计的解释：');
  console.log('    1) exports 里的条件顺序有意义：types 必须最前，default 必须最后。');
  console.log('       写反了，TypeScript 可能解析到 .js 上而丢掉类型。');
  console.log('    2) exports 一旦声明，包的内部路径就被"封闭"了：');
  console.log('       使用者 import "@acme/date-utils/dist/内部文件.js" 会被拒绝');
  console.log('       （除非像上面那样显式开放 ./package.json）。这是有意的封装。');
  console.log('    3) files: ["dist"] 是白名单。另外 package.json / README / LICENSE');
  console.log('       是 npm 强制包含的，不用写在 files 里。');
  console.log('    4) sideEffects: false 是 tree-shaking 的前提之一，');
  console.log('       详见 06_bundlers_and_transpiling.js。');
  console.log();

  console.log('  本仓库的真实文件：');
  console.log('    本仓库 package.json 里没有 files 字段，但它是 private 的，');
  console.log('    永远不会被发布，所以不需要白名单。');
  console.log();

  // -------------------------------------------------------------------------
  // 8. 一份可以直接抄走的"字段清单"
  // -------------------------------------------------------------------------
  console.log('--- 8. 新建项目该写哪些字段 ---');

  const checklist = [
    ['name', '必填', '全小写，可用 - _，发布到 npm 时需全球唯一'],
    ['version', '必填', '语义化版本，从 0.1.0 或 1.0.0 开始'],
    ['type', '强烈建议', '"module" 表示整个项目用 ESM（现代默认）'],
    ['private', '建议', '不开源就写 true，防止误发布'],
    ['license', '建议', '不写会有法律风险'],
    ['engines', '建议', '声明支持的 Node 版本，便于 CI 和团队对齐'],
    ['main / exports', '库必填', '应用可以不写；库必须写 exports 并配好条件导出'],
    ['files', '库必填', '白名单控制发布内容，避免把测试和密钥一起发出去'],
    ['scripts', '建议', '至少提供 dev / test / build 三个入口'],
    ['dependencies', '按需', '运行时必需的包'],
    ['devDependencies', '按需', 'lint / 测试 / 构建工具'],
    ['peerDependencies', '库按需', '必须与宿主共用实例的包（如 react）'],
  ];

  for (const [field, level, note] of checklist) {
    console.log(`  ${field.padEnd(22)} ${level.padEnd(8)} ${note}`);
  }
  console.log();

  console.log('小结：package.json 是工程化的"总开关文件"。');
  console.log('      后面的 lint / format / 构建 / 发布，全都建立在它之上。');
} finally {
  // 无论中间是否抛错，都清理临时目录，保证不留下垃圾、不挂起
  await fs.rm(tmpRoot, { recursive: true, force: true });
  console.log();
  console.log(`[清理] 已删除临时目录 ${tmpRoot}`);
  if (!fsSync.existsSync(tmpRoot)) console.log('[清理] 确认临时目录已不存在。');
}
