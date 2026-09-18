/**
 * ============================================================================
 * 知识点：.npmrc 与 registry 配置 —— 四个层级的优先级、私有源与 CI 认证
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】进阶
 * 【前置知识】39_tooling_and_workflow/01_package_json_guide.js、
 *             07_lockfile_and_ci.js（CI 与可复现）、09_publishing_packages.js（发布与凭据）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    `.npmrc` 是 npm 的**配置文件**，ini 格式（`key = value`），用来存放
 *    "这台机器/这个项目该怎么和 registry 打交道"的所有设置：
 *    下载源、私有源、认证 token、安装策略、代理、证书……
 *    它不是一个文件，而是**一叠文件**：npm 会按固定的优先级把多层配置
 *    **叠加**成一份最终配置（merge，不是覆盖整个文件）。
 *    本项目要讲清楚的就是这个叠加规则。
 *
 * 2. 为什么需要（真实项目场景）
 *    现实中"npm 装不上/发不出去"的故障，绝大多数根因都在这一叠文件里，而且是
 *    这类描述：
 *      · "**在我电脑上是好的**，CI 上一装就 401"；
 *      · "**换了个镜像源**，之后 lockfile 里的地址全变了，别人装不上了"；
 *      · "私有包在本地能装，同事那边 404"；
 *      · "我们明明配了私有源，怎么还是去公网找了？"
 *    这些问题的共同点是：**npm 的配置来自四个地方，而你看不到它最后用了哪一份。**
 *    本文件要给你的正是那个"看不到的东西"：一份**合并后的最终配置 + 每一层的来源**。
 *
 * 3. 核心语法要点（本文件怎么演示）
 *    第 3 节自己实现一个**配置合并器**：在临时目录里造出六层配置，
 *    按优先级叠加，把"最终生效值"和"哪一层赢了、哪些层被覆盖了"全部打印出来；
 *    第 4 节则直接读**本机真实的 npm 配置**（`npm config list`，纯本地命令，不联网），
 *    把 npm 自己报告的层顺序与我们模拟的顺序对照。
 *    第 5 节演示 scoped registry 的**按包名选源**逻辑（这是私有包 404 的根因所在）。
 *
 * 4. 常见陷阱
 *    - 以为"离得近的文件优先级高"：项目 .npmrc 确实高于用户级，但
 *      **环境变量 `npm_config_*` 又高于项目 .npmrc**，命令行参数最高。
 *      所以"我明明在项目里配了"经常败给 CI 里一个环境变量。
 *    - 以为 token 是"账号级"的：token 与 **registry 主机名绑定**
 *      （写法是 `//registry.example.com/:_authToken=...`），换了 host 就不认。
 *    - 以为 token 可以随便查：npm 把 `_authToken` 标成 **protected**，
 *      `npm config get` 会直接拒绝输出，`npm config list` 只显示 `(protected)`。
 *      这是"认证问题特别难查"的直接原因。
 *    - 把 `.npmrc` 提交进仓库：等于把 token 公开。**它必须被 .gitignore 忽略。**
 *    - 用镜像源装了依赖却不小心把改写过的 lockfile 提交了：别人在别的网络下装不上。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/12_npmrc_and_registry.js
 *
 * 【预期输出】
 *   逐节打印：.npmrc 的四个层级与优先级顺序（含实测说明）、ini 语法要点、
 *   **自研配置合并器的完整输出**（最终值 + 生效层 + 被覆盖的来源）、
 *   本机真实 npm 配置的层结构（与模拟结果对照）、
 *   protected 配置项与 token 绑定的原理、scoped registry 的选源逻辑、
 *   CI 里注入 token 的三种方式、常用配置项速查表、
 *   五类真实事故的根因与固定排查顺序、以及针对本仓库 .gitignore 的实际检查结果。
 * ============================================================================
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('--- 0. 本文件的做法说明 ---');
console.log('本文件不联网。它对系统做的唯一一次"提问"是执行 `npm config list`（纯本地命令，');
console.log('用来读取本机已有的配置），不安装任何东西、不访问 registry。');
console.log('临时文件全部放在系统临时目录，结束时删除；仓库里的文件只读不写。');
console.log(`Node 版本：${process.version}`);
console.log();

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'npmrc-demo-'));

/** 一次性写一批文件 */
function writeFiles(baseDir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(baseDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
}

try {
  // -------------------------------------------------------------------------
  // 1. 四个层级
  // -------------------------------------------------------------------------
  console.log('--- 1. .npmrc 不是"一个文件"，而是"一叠文件" ---');
  console.log();
  console.log('  npm 按下面的顺序**从低到高**读取配置，后读到的同名键覆盖先读到的：');
  console.log();
  const LAYER_ORDER = [
    ['1', '内置 builtin', '随 npm 一起安装的 npmrc（在 npm 自己的安装目录里）', '几乎不用管，也不该改'],
    ['2', '全局 global', '$PREFIX/etc/npmrc（Linux/macOS）或 npm 安装目录（Windows）', '机器级默认值，比如公司统一设置的镜像'],
    ['3', '用户 user', '~/.npmrc —— `npm login` 写的就是这里', '个人凭证与偏好，**绝不能进仓库**'],
    ['4', '项目 project', '项目根目录的 ./.npmrc', '团队共享的配置，**要提交进仓库**（但不能含 token）'],
    ['5', '环境变量 env', '所有 npm_config_开头的环境变量', 'CI 里最常用的一层'],
    ['6', '命令行 cli', '`npm install --registry=...` 这类参数', '一次有效，优先级最高'],
  ];
  console.log(`    ${'优先级'.padEnd(6)} ${'层级'.padEnd(14)} ${'文件位置'.padEnd(52)} 说明`);
  for (const [rank, name, where, note] of LAYER_ORDER) {
    console.log(`    ${rank.padEnd(6)} ${name.padEnd(14)} ${where.padEnd(52)} ${note}`);
  }
  console.log();
  console.log('  ⚠️ 两个最容易被搞错的地方：');
  console.log('    ① **环境变量比项目 .npmrc 更高**。很多人的心智模型是"越靠近项目越优先"，');
  console.log('       这在"四个文件"内部是对的（项目 > 用户 > 全局 > 内置），');
  console.log('       但环境变量是**整个文件层之上**的另一层。');
  console.log('       所以 CI 里一个 `npm_config_registry` 就能悄悄盖掉你项目里的配置。');
  console.log('    ② 合并是**按键**做的，不是按文件：项目里只写了一个键，');
  console.log('       其余键仍然来自用户级/全局/内置。**不存在"项目配了就全用项目的"。**');
  console.log();
  console.log('  本节第 5 条（环境变量覆盖项目 .npmrc）我们实测过：');
  console.log('    项目 .npmrc 写 registry=https://project.example.com/');
  console.log('    带环境变量 npm_config_registry=https://env.example.com/ 执行 npm config get registry');
  console.log('    结果 → https://env.example.com/   ← 环境变量赢了');
  console.log();

  // -------------------------------------------------------------------------
  // 2. ini 语法要点
  // -------------------------------------------------------------------------
  console.log('--- 2. .npmrc 的 ini 语法（比你想的少，但坑不少）---');
  console.log();
  const syntax = [
    ['key = value', '基本形式。等号两边可以有空格，也可以没有'],
    ['# 注释 / ; 注释', '两种注释符都行'],
    ['key', '只写键名等于把布尔值设为 true：`save-exact` 等价于 `save-exact=true`'],
    ['//host/:_authToken=xxx', 'token 的写法：**必须带主机名**，斜杠和冒号一个都不能少'],
    ['@scope:registry=url', '给某个 scope 单独指定 registry（私有包的命门，见第 5 节）'],
    ['${ENV_VAR}', '**变量插值**：读取环境变量。CI 里注入 token 的标准姿势'],
    ['key[]=a', '数组型配置要带中括号（很少用到）'],
  ];
  console.log(`    ${'写法'.padEnd(28)} 说明`);
  for (const [form, note] of syntax) console.log(`    ${form.padEnd(28)} ${note}`);
  console.log();
  console.log('  ⚠️ `${ENV_VAR}` 插值的两个细节：');
  console.log('    · 环境变量**不存在**时，npm 会把它当作空字符串（而不是报错），');
  console.log('      于是 token 变成空 → 服务端回 401。**"CI 里 401"十有八九就是这里。**');
  console.log('    · 插值只发生在 npmrc 文件里；命令行参数和环境变量本身不做插值。');
  console.log();

  // -------------------------------------------------------------------------
  // 3. 自己实现一个配置合并器
  // -------------------------------------------------------------------------
  console.log('--- 3. 自己写一个配置合并器 ---');
  console.log();
  console.log('  目标：把多层配置**按键合并**，并且记住"每个键最后是谁赢的、哪些层被盖掉了"。');
  console.log('  这正是 npm 内部做的事（@npmcli/config 的 load 流程）。');
  console.log();

  /** 解析 ini 文本 → Map<键, 值>。这是 .npmrc 语法的子集实现。 */
  function parseNpmrc(text) {
    const out = new Map();
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith(';')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) {
        out.set(line, 'true'); // 只写键名 = true
        continue;
      }
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      // 去掉可选的引号
      if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
        value = value.slice(1, -1);
      }
      out.set(key, value);
    }
    return out;
  }

  /** 敏感键的判定：这些值在打印时要打码 */
  const isSecretKey = (key) => /_authToken|_auth\b|_password|token/i.test(key);
  const mask = (key, value) => (isSecretKey(key) ? `****（${value.length} 个字符）` : value);

  /**
   * 把多层配置合并成一份。
   * @param {Array<{id:string,label:string,source:string,data:Map<string,string>}>} layers 从低到高
   */
  function mergeConfig(layers) {
    /** key → { value, winner, overridden: [层 id] } */
    const merged = new Map();
    for (const layer of layers) {
      for (const [key, value] of layer.data) {
        const prev = merged.get(key);
        if (!prev) {
          merged.set(key, { value, winner: layer.id, winnerLabel: layer.label, overridden: [] });
        } else {
          prev.overridden.push(`${prev.winner}(${mask(key, prev.value)})`);
          prev.value = value;
          prev.winner = layer.id;
          prev.winnerLabel = layer.label;
        }
      }
    }
    return merged;
  }

  // ---- 造一个"模拟公司"的四层配置 ----
  const fakeConfigs = {
    'fake/etc/npmrc': [
      '# 全局：公司统一把默认源指向内网镜像',
      'registry=https://mirror.corp.example.com/',
      'fund=false',
      'audit=false',
    ].join('\n'),
    'fake/home/.npmrc': [
      '# 用户级：本人在自己机器上的偏好 + 自己的 token',
      'registry=https://registry.npmmirror.com/',
      'save-exact=true',
      'legacy-peer-deps=true',
      '@corp:registry=https://npm.corp.example.com/',
      '//npm.corp.example.com/:_authToken=${CORP_NPM_TOKEN}',
    ].join('\n'),
    'fake/project/.npmrc': [
      '# 项目级：跟着仓库走，团队共享（**不含任何 token**）',
      'registry=https://registry.npmjs.org/',
      'engine-strict=true',
      '//registry.npmjs.org/:_authToken=${NPM_TOKEN}',
    ].join('\n'),
    'fake/builtin/npmrc': ['# 内置层：npm 自带的默认值', 'audit=true', 'fund=true', 'progress=true'].join('\n'),
  };
  writeFiles(tmpRoot, fakeConfigs);

  // 环境变量层：npm 会抓取所有 npm_config_ 开头的变量
  const fakeEnv = {
    npm_config_registry: 'https://ci-mirror.example.com/',
    npm_config_loglevel: 'warn',
  };
  // 命令行层：一次有效的参数
  const fakeCli = { registry: 'https://cli-override.example.com/' };

  const layers = [
    { id: 'builtin', label: '内置 builtin', source: '随 npm 安装', data: parseNpmrc(fakeConfigs['fake/builtin/npmrc']) },
    { id: 'global', label: '全局 global', source: 'fake/etc/npmrc', data: parseNpmrc(fakeConfigs['fake/etc/npmrc']) },
    { id: 'user', label: '用户 user', source: 'fake/home/.npmrc', data: parseNpmrc(fakeConfigs['fake/home/.npmrc']) },
    { id: 'project', label: '项目 project', source: 'fake/project/.npmrc', data: parseNpmrc(fakeConfigs['fake/project/.npmrc']) },
    {
      id: 'env',
      label: '环境变量 env',
      source: 'npm_config_*',
      data: new Map(Object.entries(fakeEnv).map(([k, v]) => [k.replace(/^npm_config_/, '').replace(/_/g, '-'), v])),
    },
    { id: 'cli', label: '命令行 cli', source: '--key=value', data: new Map(Object.entries(fakeCli)) },
  ];

  console.log('  [3.1] 参与合并的六层（从低到高）');
  console.log();
  for (const l of layers) {
    console.log(`    ${l.label.padEnd(16)} ${l.source.padEnd(28)} ${l.data.size} 个键：${[...l.data.keys()].join(', ')}`);
  }
  console.log();

  const merged = mergeConfig(layers);

  console.log('  [3.2] 合并结果：每个键最终用了谁的值');
  console.log();
  console.log(`    ${'键'.padEnd(34)} ${'最终值'.padEnd(38)} ${'生效层'.padEnd(14)} 被这些层写过但没赢`);
  for (const [key, info] of [...merged.entries()].sort()) {
    const value = mask(key, info.value);
    const overridden = info.overridden.length === 0 ? '（只有这一层写过）' : info.overridden.join(' → ');
    console.log(`    ${key.padEnd(34)} ${String(value).padEnd(38)} ${info.winner.padEnd(14)} ${overridden}`);
  }
  console.log();
  console.log('  从这张表能读出几件事：');
  console.log('    · `registry` 被六层里的四层写过，最后赢的是**命令行**；去掉命令行则是环境变量；');
  console.log('      这正是"我明明在项目 .npmrc 里配了，怎么不生效"的完整解释链。');
  console.log('    · `save-exact` 只有用户层写过 → 它生效了，**项目层没写并不会把它清空**。');
  console.log('      合并是按键的：**没写 ≠ 设为默认值，而是"沿用下层"。**');
  console.log('    · `@corp:registry` 这种带 scope 的键是**独立的一行配置**，');
  console.log('      和 `registry` 互不影响（第 5 节讲它怎么生效）。');
  console.log();

  // 插值：把 ${VAR} 换成环境变量的值，并报告缺失情况
  console.log('  [3.3] ${ENV_VAR} 插值：这是 CI 认证最容易出事的地方');
  console.log();
  const envForInterpolation = { NPM_TOKEN: '', CORP_NPM_TOKEN: 'corp-secret-value' }; // 故意让 NPM_TOKEN 缺失
  console.log(`    假设 CI 环境里 CORP_NPM_TOKEN 存在，但 NPM_TOKEN **忘了配**：`);
  console.log();
  for (const [key, info] of [...merged.entries()].sort()) {
    if (!info.value.includes('${')) continue;
    const varName = info.value.match(/\$\{(\w+)\}/)[1];
    const present = Object.prototype.hasOwnProperty.call(envForInterpolation, varName) && envForInterpolation[varName] !== '';
    const resolved = info.value.replace(/\$\{(\w+)\}/g, (_, name) => envForInterpolation[name] ?? '');
    console.log(`    ${key}`);
    console.log(`      原始写法：${info.value}`);
    console.log(`      插值之后：${mask(key, resolved)}`);
    console.log(`      环境变量 ${varName}：${present ? '✅ 存在' : '❌ **不存在** → 被替换成空字符串，npm 不会报错'}`);
    console.log(`      后果：${present ? '正常带上了 token' : '请求里没有 Authorization 头 → registry 回 401 Unauthorized'}`);
    console.log();
  }
  console.log('    📌 记住这条：**"401" 和 "403" 的含义完全不同**');
  console.log('       401 = 没认证（token 没带上/是空串）→ 先查环境变量有没有注入进去；');
  console.log('       403 = 认证了但没权限（token 有效但无权发布这个 scope）→ 查 token 的权限范围。');
  console.log();

  // -------------------------------------------------------------------------
  // 4. 读本机真实的 npm 配置
  // -------------------------------------------------------------------------
  console.log('--- 4. 读一读本机真实的 npm 配置（对照一下顺序） ---');
  console.log();
  console.log('  下面执行的是 `npm config list`（**纯本地命令**，只读文件、不联网）。');
  console.log('  它会按层分组列出配置，每组的标题就写着"这一层来自哪个文件"。');
  console.log();

  const npmEnv = { ...process.env, NO_UPDATE_NOTIFIER: '1', npm_config_update_notifier: 'false' };
  /**
   * 执行一条 npm 只读子命令。
   * 用 execSync 传"整条命令字符串"而不是 execFileSync + shell：
   * 前者在 Windows 上会交给 cmd.exe 解析，正好能识别 npm.cmd；
   * 后者配 shell:true 会触发 DEP0190 警告（参数拼接有注入风险）。
   * 这里命令是写死的常量，没有任何外部输入参与拼接。
   */
  const runNpm = (args) =>
    execSync(`npm ${args}`, { encoding: 'utf8', timeout: 20_000, env: npmEnv, stdio: ['ignore', 'pipe', 'pipe'] });

  let npmListOutput = null;
  try {
    npmListOutput = runNpm('config list');
  } catch (err) {
    console.log(`  ⚠️ 没能执行 npm config list（${err.code || err.message}）——跳过本节，不影响其他结论。`);
  }

  if (npmListOutput) {
    const lines = npmListOutput.split(/\r?\n/);
    const sections = [];
    let current = null;
    for (const line of lines) {
      const m = line.match(/^;\s*"([^"]+)"\s+config from\s+(.*)$/);
      if (m) {
        current = { layer: m[1], source: m[2].trim(), keys: [] };
        sections.push(current);
        continue;
      }
      const kv = line.match(/^([^;\s][^=]*?)\s*=\s*(.*)$/);
      if (kv && current) current.keys.push([kv[1].trim(), mask(kv[1].trim(), kv[2].trim())]);
    }

    console.log('  [4.1] npm 自己报告的层顺序（从低到高，就是它内部 load 的顺序）');
    console.log();
    const knownOrder = ['builtin', 'global', 'user', 'project', 'env', 'cli'];
    for (const [i, sec] of sections.entries()) {
      const rank = knownOrder.indexOf(sec.layer);
      console.log(`    ${String(i + 1).padStart(2)}. ${sec.layer.padEnd(10)} ${sec.source}`);
      console.log(`        在标准六层里排第 ${rank === -1 ? '?' : rank + 1} 层，本层提供了 ${sec.keys.length} 个键`);
      if (sec.keys.length > 0 && sec.keys.length <= 8) {
        for (const [k, v] of sec.keys) console.log(`          ${k} = ${v}`);
      } else if (sec.keys.length > 8) {
        console.log(`          （${sec.keys.length} 个键，太多就不逐个列了，例如 ${sec.keys[0][0]} = ${sec.keys[0][1]}）`);
      }
    }
    console.log();
    // 把"本机实际存在哪些层"和标准顺序对照一下
    const observed = sections.map((s) => s.layer);
    const missing = knownOrder.filter((l) => !observed.includes(l));
    console.log(`    本机实际存在的层：${observed.join(' → ')}`);
    console.log(`    标准六层里本机**没有**的：${missing.join(', ') || '（一个都不缺）'}`);
    console.log(`      （"没有"是指那份 .npmrc 文件在本机不存在 —— 不存在就没有键，自然也不参与合并）`);
    console.log();
    console.log('    → 关键看的是**相对顺序**：存在的这几层里，builtin 一定在 env 之前。');
    console.log('      这与第 1 节那张表一致：文件层内部是 内置 → 全局 → 用户 → 项目，然后才是 env、cli。');
    console.log('      npm 把"后读到的"排在后面，也就是**后面的赢**。');
    console.log(`    → 而第 3 节的模拟里六层齐全，所以能看到 registry 被四层依次覆盖的完整链条。`);
    console.log();

    // 顺带把几个关键路径打出来，方便读者知道"文件到底在哪"
    const pathKeys = ['userconfig', 'globalconfig', 'prefix', 'cache'];
    console.log('  [4.2] 本机这几个关键路径（知道了才不会改错文件）');
    console.log();
    for (const key of pathKeys) {
      try {
        const v = runNpm(`config get ${key}`).trim();
        console.log(`    npm config get ${key.padEnd(14)} → ${v}`);
      } catch {
        console.log(`    npm config get ${key.padEnd(14)} → （读取失败）`);
      }
    }
    console.log();
    console.log('    `userconfig` 就是"用户级 .npmrc"的真实位置。');
    console.log('    `globalconfig` 是全局层。这两条路径**因操作系统和安装方式而异**，');
    console.log('    所以排查问题时不要靠记忆，直接 `npm config get userconfig`。');
    console.log();

    console.log('  [4.3] protected 配置项：为什么认证问题这么难查');
    console.log();
    const protectedLines = lines.filter((l) => /\(protected\)/.test(l));
    console.log(`    本机 npm config list 里被标记为 (protected) 的项：${protectedLines.length} 个`);
    for (const l of protectedLines) console.log(`      ${l.trim()}`);
    if (protectedLines.length === 0) {
      console.log('      （本机没有配任何 token，所以看不到 protected 项 ——');
      console.log('        但只要你在 .npmrc 里写过 `//host/:_authToken=...`，它就会变成这样一行：');
      console.log('          //registry.npmjs.org/:_authToken = (protected)）');
    }
    console.log();
    console.log('    npm 把任何看起来像凭据的键（`_authToken` / `_auth` / `_password`）标成 protected：');
    console.log('      · `npm config list` 只给你看 `(protected)`，看不到值；');
    console.log('      · `npm config get //registry.npmjs.org/:_authToken` 会**直接报错拒绝**：');
    console.log('          npm error The //registry.npmjs.org/:_authToken option is protected,');
    console.log('          npm error and cannot be retrieved in this way');
    console.log('    这是刻意设计（防止 CI 日志里泄漏 token），代价是"token 到底有没有生效"');
    console.log('    没法用 `get` 直接验证。可用的替代手段：');
    console.log('      · `npm whoami --registry=https://registry.npmjs.org/`');
    console.log('        能返回用户名 = token 有效且带上了；返回 401 = token 没生效。**这是最快的验证。**');
    console.log('      · 或者用 `npm ping` 看能不能连通（也是只读操作）。');
    console.log();
  }

  // -------------------------------------------------------------------------
  // 5. 私有 registry 与 scoped registry
  // -------------------------------------------------------------------------
  console.log('--- 5. 私有源与 scoped registry ---');
  console.log();
  console.log('  最实用的模式是"**混合源**"：公司的包走内网，其他包走公网。');
  console.log('  靠的就是带 scope 的配置项：');
  console.log();
  console.log('    # 默认走公网');
  console.log('    registry=https://registry.npmjs.org/');
  console.log('    # 只有 @corp 开头的包去内网找');
  console.log('    @corp:registry=https://npm.corp.example.com/');
  console.log('    # 内网那台服务器的认证 token（注意 host 要和上一行的 host 完全一致）');
  console.log('    //npm.corp.example.com/:_authToken=${CORP_NPM_TOKEN}');
  console.log();
  console.log('  为什么不用"整个 registry 都指到内网镜像"？因为内网镜像往往不能及时同步公网，');
  console.log('  scope 分流让"公司的私有包"和"公网依赖"各走各的，是最稳的形态。');
  console.log();

  console.log('  [5.1] 按包名选源：npm 的判定只有两步');
  console.log();
  /**
   * 判断一个包名该用哪个 registry。
   * npm 的规则极简：包名带 scope 且配了 @scope:registry → 用那个；否则用 registry。
   */
  function registryFor(packageName, config) {
    if (packageName.startsWith('@')) {
      const scope = packageName.split('/')[0];
      const key = `${scope}:registry`;
      if (config.has(key)) {
        return { registry: config.get(key).value, reason: `命中 ${key}`, authKey: authKeyOf(config.get(key).value) };
      }
      return {
        registry: config.get('registry').value,
        reason: `是 scoped 包，但没有配 ${key} → 退回默认源`,
        authKey: authKeyOf(config.get('registry').value),
      };
    }
    return { registry: config.get('registry').value, reason: '普通包名 → 用默认源', authKey: authKeyOf(config.get('registry').value) };
  }
  /** token 的键名：把 registry 的 URL 变成 //host/path/:_authToken 的形式 */
  function authKeyOf(registryUrl) {
    const noProto = registryUrl.replace(/^https?:/, '');
    return `//${noProto.replace(/\/?$/, '/')}:_authToken`;
  }

  const probePackages = ['lodash', '@corp/utils', '@acme/ui', 'express'];
  console.log(`    ${'包名'.padEnd(16)} ${'会去哪个源'.padEnd(40)} ${'用哪个 token'.padEnd(40)} 判定依据`);
  for (const name of probePackages) {
    const r = registryFor(name, merged);
    const hasToken = merged.has(r.authKey);
    console.log(
      `    ${name.padEnd(16)} ${r.registry.padEnd(40)} ${(hasToken ? r.authKey : `${r.authKey} ❌ 没配`).padEnd(40)} ${r.reason}`,
    );
  }
  console.log();
  console.log('    ⚠️ 注意 `@acme/ui` 那一行：**它是 scoped 包，但没人给 @acme 配 registry**，');
  console.log('       所以它落到了默认源上。如果 @acme 是公司的私有 scope，');
  console.log('       这一行就是"私有包 404"的完整根因（npm 会去公网找，然后告诉你没找到）。');
  console.log();
  console.log('    📌 顺带解释一个高频困惑：**为什么私有包 404 而不是 401？**');
  console.log('       因为请求根本没发到内网服务器上去 —— 它发到了公网 registry，');
  console.log('       那边当然找不到这个包名，于是回 404。**先看 404 还是 401，能省一半排查时间。**');
  console.log();
  console.log('  [5.2] token 与 host 绑定：换源之后 token 就失效了');
  console.log();
  console.log('    token 的键里**必须**包含 host：`//npm.corp.example.com/:_authToken=xxx`。');
  console.log('    这带来两个非常真实的坑：');
  console.log('      · 把 registry 从 `https://npm.corp.example.com/` 改成 `https://npm.corp.example.com/api/`，');
  console.log('        host 变了 → 上面那行 token **不再被使用** → 401；');
  console.log('      · 从 npmmirror 切回官方源，但 token 是配在 npmmirror 的 host 上的 → 401。');
  console.log('    记住写法里的三个斜杠和冒号：`//` + host + `/` + `:_authToken`。写错了不会报错，只会 401。');
  console.log();

  // -------------------------------------------------------------------------
  // 6. CI 里注入 token 的三种方式
  // -------------------------------------------------------------------------
  console.log('--- 6. CI 里注入 token：三种方式与它们的区别 ---');
  console.log();
  const ciWays = [
    [
      '① 环境变量 + npmrc 插值',
      '仓库里放 `.npmrc` 写 `//registry.npmjs.org/:_authToken=${NPM_TOKEN}`，CI 里设 NPM_TOKEN',
      'token 不进仓库；但**必须记得在 CI 里加这个变量**，漏了就静默 401',
    ],
    [
      '② NODE_AUTH_TOKEN',
      'npm 生态的约定名，setup-node / 各种 action 会用它写一份临时 .npmrc',
      '最省事；但它是**工具层的约定**，不是 npm 本身的机制，脱离了工具就不生效',
    ],
    [
      '③ OIDC trusted publishing',
      '不给任何 token，CI 用自己的一次性身份证明换取发布权限（GitHub Actions + npm）',
      '**最安全**：没有可泄漏的长期凭据，还能自动生成 provenance（见 09 文件第 8 节）',
    ],
  ];
  for (const [name, how, note] of ciWays) {
    console.log(`    ${name}`);
    console.log(`      └─ 怎么做：${how}`);
    console.log(`      └─ 注意：${note}`);
    console.log();
  }
  console.log('    排查 CI 认证的固定顺序（从最可能的原因开始）：');
  console.log('      1. 变量到底有没有注进去？在 CI 里加一行 `env | grep -i npm` 看一眼；');
  console.log('      2. `.npmrc` 里写的变量名和 CI 里设的**名字一模一样**吗？（大小写敏感）');
  console.log('      3. token 的 host 和实际请求的 registry host 对得上吗？');
  console.log('      4. `npm whoami --registry=<那个源>` 能不能通过？（验证 token 本身有没有过期）');
  console.log('      5. 是 401 还是 403？401 是没认证，403 是没权限（scope 不对 / token 是只读的）');
  console.log();

  // -------------------------------------------------------------------------
  // 7. 常用配置项速查
  // -------------------------------------------------------------------------
  console.log('--- 7. 常用配置项速查表 ---');
  console.log();
  const configTable = [
    ['save-exact', 'false', '装包时把 `^1.2.3` 写成精确的 `1.2.3`。供应链要求严的项目会开'],
    ['legacy-peer-deps', 'false', '退回 npm 6 的 peer 依赖处理方式。npm 7+ 的严格检查会让老项目装不上时的应急开关'],
    ['strict-peer-deps', 'false', '比上一条更严：peer 冲突直接失败。CI 里开这个能提前发现问题'],
    ['package-lock', 'true', '**不要关**。关掉就不再生成锁文件，等于放弃可复现（见 07 文件）'],
    ['engine-strict', 'false', '开着时 package.json 的 engines 不满足就拒绝安装。CI 上很有用，本地有时太烦'],
    ['audit / fund', 'true', '安装后自动跑安全审计 / 打印赞助信息。很多团队关掉它来提速'],
    ['prefer-offline', 'false', '优先用缓存，减少网络请求。CI 上配合缓存目录效果明显'],
    ['registry', '官方源', '默认下载源'],
    ['@scope:registry', '无', '给某个 scope 单独指定源（私有包必配）'],
    ['//host/:_authToken', '无', '认证 token，**与 host 绑定**'],
    ['proxy / https-proxy', '无', '公司网络要走代理时设置'],
    ['strict-ssl', 'true', '**不要关**。关掉等于放弃对 HTTPS 证书的校验，是供应链攻击的入口'],
    ['cafile', '无', '公司自签证书时指定 CA 文件（比关掉 strict-ssl 正确得多的做法）'],
    ['fetch-timeout', '5 分钟', '网络慢时调大，避免大依赖装到一半超时'],
    ['loglevel', 'notice', '调试时临时设成 `silly` 能看到 npm 到底请求了哪个 URL'],
  ];
  console.log(`    ${'配置项'.padEnd(22)} ${'默认'.padEnd(10)} 什么时候需要它`);
  for (const [key, def, note] of configTable) {
    console.log(`    ${key.padEnd(22)} ${def.padEnd(10)} ${note}`);
  }
  console.log();
  console.log('  ⚠️ `loglevel=silly` 是排查"到底请求了哪个地址"的终极手段，值得记住：');
  console.log('     `npm install --loglevel=silly` 会把每一次 HTTP 请求的完整 URL 打出来，');
  console.log('     "私有包 404"能立刻看出是发去了公网还是内网。');
  console.log();

  // -------------------------------------------------------------------------
  // 8. 本仓库的实际检查
  // -------------------------------------------------------------------------
  console.log('--- 8. 检查本仓库：.npmrc 会不会被误提交 ---');
  console.log();

  const gitignorePath = path.join(ROOT, '.gitignore');
  const gitignore = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const hasNpmrcFile = fs.existsSync(path.join(ROOT, '.npmrc'));
  const npmrcIgnored = /^\s*\.npmrc\s*$/m.test(gitignore) || /^\s*\*\.npmrc\s*$/m.test(gitignore);

  console.log(`    仓库根目录存在 .npmrc 吗？      ${hasNpmrcFile ? '⚠️ 存在' : '没有（✅ 目前没有可泄漏的东西）'}`);
  console.log(`    .gitignore 里有 .npmrc 规则吗？  ${npmrcIgnored ? '✅ 有' : '❌ 没有'}`);
  console.log();
  if (!npmrcIgnored) {
    console.log('    ⚠️ **这是一个真实存在的隐患**：本仓库的 .gitignore 忽略了 .env，但没有忽略 .npmrc。');
    console.log('       任何人只要在本仓库根目录跑一次 `npm login`，或者手动建一个带 token 的 .npmrc，');
    console.log('       它就是"未跟踪文件"，`git add .` 会**静默地把它加进去**。');
    console.log('       建议在 .gitignore 里补一行：');
    console.log();
    console.log('           # npm 认证配置（可能含 authToken，绝不提交）');
    console.log('           .npmrc');
    console.log();
    console.log('       注意：npm **不会**把 .npmrc 打进发布的 tarball（它在默认忽略清单里，');
    console.log('       见 09_publishing_packages.js），所以这条只关乎 git，不关乎发布。');
    console.log('       但 git 泄漏比 registry 泄漏常见得多。');
    console.log();
  }
  console.log('    一个可以立刻照做的团队约定：');
  console.log('      · 提交进仓库的那份 `.npmrc` 只放 registry、scope 之类的非敏感项，');
  console.log('        token 一律通过环境变量注入，绝不落盘；');
  console.log('      · 或者干脆把带 token 的那份放在用户级（~/.npmrc），项目里只放公共配置。');
  console.log();

  // -------------------------------------------------------------------------
  // 9. 五类真实事故的根因速查
  // -------------------------------------------------------------------------
  console.log('--- 9. 五类真实事故：现象 → 根因 → 先查什么 ---');
  console.log();
  const incidents = [
    [
      'CI 里 401 Unauthorized',
      '环境变量没注入，或 .npmrc 里的变量名和 CI 里的对不上 → 插值成空字符串',
      '在 CI 里打印 `env | grep -i npm`，再 `npm whoami --registry=<源>`',
    ],
    [
      '私有包 404 Not Found',
      '没配 @scope:registry，请求发到了公网源；或 scope 名字拼错',
      '`npm config get @corp:registry`，再看 `--loglevel=silly` 里的请求 URL',
    ],
    [
      '换了镜像源之后 lockfile 里的 resolved 全变了',
      '镜像源会把 tarball 地址改写成自己的域名，提交后别人在别的网络装不上',
      'CI 用 `npm ci`（严格按锁文件）；换源时单独提交、并说明原因',
    ],
    [
      '本地能装，同事装了报 engines 不满足',
      '这台机器配了 engine-strict / 或 node 版本不同',
      '`npm config get engine-strict`，并核对 .nvmrc 与 CI 的 node 版本',
    ],
    [
      '装依赖时冒出奇怪的 peer 冲突',
      'npm 7+ 默认严格处理 peerDependencies，老生态里有大量没跟上的包',
      '临时用 `--legacy-peer-deps` 绕过，长期靠升级依赖或 `overrides` 解决',
    ],
  ];
  for (const [symptom, cause, action] of incidents) {
    console.log(`    现象：${symptom}`);
    console.log(`      根因：${cause}`);
    console.log(`      先查：${action}`);
    console.log();
  }

  console.log('  最后总结：');
  console.log('    npm 的配置是**六层叠加 + 按键覆盖**的结果，不是单一文件的内容。');
  console.log('    遇到"装不上/发不出去"，永远先问三个问题：');
  console.log('      ① 最终生效的是哪一层？（本文件第 3、4 节的方法）');
  console.log('      ② 请求发去了哪个 host？（--loglevel=silly）');
  console.log('      ③ 是 401 还是 403 还是 404？（三种错误的含义完全不同）');
  console.log('    这三个问题能定位绝大多数 registry 相关的故障。');
  console.log();
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  console.log('--- 清理 ---');
  console.log(`已删除临时目录：${tmpRoot}`);
  console.log(`（它还在吗？ ${fs.existsSync(tmpRoot) ? '在（清理失败）' : '不在了 ✅'}）`);
}
