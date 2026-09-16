/**
 * ============================================================================
 * 知识点：双包发布与 exports 条件导出 —— 库作者的第一大痛点
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】高级
 * 【前置知识】39_tooling_and_workflow/01_package_json_guide.js、
 *             06_bundlers_and_transpiling.js（打包与转译）、
 *             09_publishing_packages.js（发布流程）、19_modules（模块系统）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 现在有**两套模块系统**同时在用：
 *      · **CJS（CommonJS）**：`require()` / `module.exports`，Node 的原生模块系统；
 *      · **ESM（ES Modules）**：`import` / `export`，语言标准，浏览器与 Node 都支持。
 *    一个库想同时被两类用户使用，就得"**双包**"（dual package）：
 *    同一个包名，根据使用者是 `import` 还是 `require`，交给它对应的那份代码。
 *    而 `package.json` 里的 **`exports` 字段**就是这套分发的调度中心。
 *
 * 2. 为什么需要（真实项目场景）
 *    这是"库作者第一痛点"，因为它有**两个方向的坑**：
 *      · 不做双包 → 一半用户装不上，或者装上了却在 `require()` 时抛
 *        `ERR_REQUIRE_ESM`（Node 22.12 之前 ESM 包根本没法被 require）；
 *      · 做了双包但做得不对 → 用户同时用到两份代码，于是出现**最诡异的一类线上 bug**：
 *        `instanceof` 突然变成 false、单例变成两个、状态改了一份另一份不知道。
 *        这类 bug 的特征是"看起来完全不可能"，排查成本极高（见第 4 节）。
 *    另一件同样高频的事故是：**某次发版给 package.json 加上了 `exports`，
 *    结果所有 `import 'pkg/dist/xxx'` 的深路径导入全部报错**——
 *    `exports` 不只是"新增一个入口配置"，它是**一把锁**（见第 3 节）。
 *
 * 3. 核心语法要点（本文件怎么演示）
 *    本文件在 `os.tmpdir()` 里现搭一个**真实的 node_modules**，
 *    里面放十来个迷你包，每个包演示一个知识点，然后用**真实的
 *    `import` / `require` / `require.resolve` / `import.meta.resolve`** 去解析它们，
 *    把"Node 到底选了哪个文件"打印出来。结论不是我们写死的，是 Node 自己算的。
 *    最后在 finally 里把临时目录整个删掉。
 *
 * 4. 常见陷阱
 *    - 以为条件对象的书写顺序无所谓：**顺序就是优先级**，`default` 必须放最后。
 *    - 以为 `module` / `browser` 字段是给 Node 用的：它们**只是打包器的约定**，
 *      Node 根本不读（误以为写了 `module` 就等于支持 ESM 是很常见的误解）。
 *    - 以为 `sideEffects: false` 只是优化：包里真有副作用时，它会让打包器
 *      **把必须存在的代码删掉**，而且是只在生产构建里才暴露的那种删。
 *    - 以为"加了 exports 只是多一层映射"：它会立刻封死所有深路径导入，
 *      这是纯粹的破坏性变更，必须升 major。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/10_dual_package_and_exports.js
 *
 * 【预期输出】
 *   逐节打印：双包问题的由来、exports 的三种写法与条件匹配顺序（用真实解析结果证明）、
 *   十个迷你包的真实解析对照表、加了 exports 之后深路径被封死的报错现场、
 *   main/module/browser 与 exports 的优先级、**dual package hazard 的现场复现与三种修法**、
 *   sideEffects 与 tree-shaking 的关系、库作者自检清单。
 *   临时目录在结束时被删除。
 * ============================================================================
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

console.log('--- 0. 本文件的做法说明 ---');
console.log('本文件不联网、不装包、不改动仓库里的任何文件。');
console.log('它会在系统临时目录里搭一个真实的 node_modules 用来做实验，结束时删除。');
console.log(`Node 版本：${process.version}（本文件的部分结论与 Node 版本强相关，下面会逐条标注）`);
console.log();

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dual-pkg-demo-'));
console.log(`临时工作目录：${tmpRoot}`);
console.log();

/** 一次性把一批文件写进临时目录 */
function writeFiles(baseDir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(baseDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
}

try {
  // -------------------------------------------------------------------------
  // 1. 双包问题的由来
  // -------------------------------------------------------------------------
  console.log('--- 1. 为什么会有"双包"这个问题 ---');

  const timeline = [
    ['2009', 'Node.js 诞生，只有 CommonJS：require() / module.exports'],
    ['2015', 'ES Modules 进入 ECMAScript 标准（import / export）'],
    ['2017', 'Node 8/10 只能靠 .mjs + --experimental-modules 跑 ESM'],
    ['2019', 'Node 12/13 稳定支持 ESM；"库该怎么同时支持两边"成了普遍问题'],
    ['2021', 'package.json 的 exports 字段被广泛采用，成为双包的标准做法'],
    ['2023', 'Node 20.19 / 22.12 起，require() 可以直接加载 ESM（require(esm)），痛点明显缓解'],
  ];
  for (const [when, what] of timeline) console.log(`    ${when.padEnd(7)} ${what}`);
  console.log();
  console.log('  术语对齐（后面会一直用到）：');
  console.log('    · **CJS 消费者**：用 require() 的人（老项目、Node 脚本、Jest 默认环境）；');
  console.log('    · **ESM 消费者**：用 import 的人（新项目、Vite/webpack 的现代构建、浏览器）；');
  console.log('    · **双包**：同一个包名，对两类消费者分别给出各自的入口文件。');
  console.log();
  console.log('  「双包」的标准做法是两条路都指向同一份**源码**，只是包成两种外壳：');
  console.log('    源码（ESM 或 TypeScript）→ 打包器/转译器 → dist/index.mjs + dist/index.cjs');
  console.log('  这就是 06_bundlers_and_transpiling.js 里"构建产物"在库场景下的用途。');
  console.log();

  // -------------------------------------------------------------------------
  // 2. exports 的三种写法
  // -------------------------------------------------------------------------
  console.log('--- 2. exports 字段的三种写法 ---');

  const exportForms = [
    ['字符串', '"exports": "./dist/index.js"', '只暴露一个入口，最简单，也是最严格的锁'],
    [
      '子路径映射',
      '"exports": { ".": "./dist/index.js", "./utils": "./dist/utils.js" }',
      '键是"使用者写的路径"，值是"实际文件"。没列出来的路径一律不许进',
    ],
    [
      '条件对象',
      '"exports": { ".": { "import": "./dist/index.mjs", "require": "./dist/index.cjs", "default": "./dist/index.js" } }',
      '按"条件"分别给文件，双包就靠它',
    ],
  ];
  for (const [name, form, note] of exportForms) {
    console.log(`    【${name}】`);
    console.log(`      ${form}`);
    console.log(`      └─ ${note}`);
    console.log();
  }

  console.log('  条件对象里的"条件"（condition）是一个字符串键，常见的几个：');
  const conditions = [
    ['import', '✅ Node 会设置', '被 import / import() 加载时命中'],
    ['require', '✅ Node 会设置', '被 require() 加载时命中'],
    ['node', '✅ Node 会设置', '在 Node 环境下就命中（**import 和 require 都会命中**，所以它放在前面会吃掉后面）'],
    ['default', '✅ 兜底', '前面的条件都不匹配时用它，**必须写在最后一个**'],
    ['node-addons', '✅ Node 会设置', '仅当 Node 允许加载原生扩展时'],
    ['browser', '❌ Node 不设置', '浏览器打包器（webpack/vite）自己设置，Node 完全无视'],
    ['development / production', '❌ Node 不设置', '打包器的构建模式条件'],
    ['types', '⚠️ 由 TypeScript 读', '声明文件入口，运行时会被跳过（TypeScript 5+ 支持）'],
  ];
  console.log(`    ${'条件'.padEnd(24)} ${'Node 是否设置'.padEnd(16)} 说明`);
  for (const [cond, set, note] of conditions) {
    console.log(`    ${cond.padEnd(24)} ${set.padEnd(16)} ${note}`);
  }
  console.log();
  console.log('  ⚠️ 最重要的一条规则：**条件对象按书写顺序匹配，第一个命中的就赢。**');
  console.log('     所以 `node` 写在 `import`/`require` 之前，等于把两者合并成一个文件。');
  console.log('     下面第 3 节会用真实解析结果证明这一点（不是背书，是实测）。');
  console.log();

  // -------------------------------------------------------------------------
  // 3. 现场搭十个迷你包
  // -------------------------------------------------------------------------
  console.log('--- 3. 在临时目录里搭十个迷你包，然后真的解析它们 ---');

  // 宿主应用目录：所有迷你包都装在它的 node_modules 里
  const app = path.join(tmpRoot, 'app');

  writeFiles(tmpRoot, {
    // 宿主应用：没有任何 type 字段 → 默认 CJS，但 .mjs/.cjs 后缀各自生效
    'app/package.json': JSON.stringify({ name: 'demo-app', private: true, version: '1.0.0' }, null, 2),

    // ---- 包 1：标准双包（两份实现，各自一份状态）→ 会演示 dual package hazard
    'app/node_modules/dual-pkg/package.json': JSON.stringify(
      {
        name: 'dual-pkg',
        version: '1.0.0',
        type: 'module',
        exports: { '.': { import: './dist/index.mjs', require: './dist/index.cjs' } },
      },
      null,
      2,
    ),
    'app/node_modules/dual-pkg/dist/index.mjs': [
      '// ESM 实现（独立的一份状态）',
      'export class Counter { constructor() { this.n = 0; } }',
      'export const state = { hits: 0 };',
      'export const kind = "esm";',
    ].join('\n'),
    'app/node_modules/dual-pkg/dist/index.cjs': [
      '// CJS 实现（另一份独立的状态）',
      'class Counter { constructor() { this.n = 0; } }',
      'const state = { hits: 0 };',
      'exports.Counter = Counter;',
      'exports.state = state;',
      'exports.kind = "cjs";',
    ].join('\n'),

    // ---- 包 2：修法 A —— ESM 外壳 + CJS 内核（只有一份状态）
    'app/node_modules/wrapper-pkg/package.json': JSON.stringify(
      {
        name: 'wrapper-pkg',
        version: '1.0.0',
        type: 'module',
        exports: { '.': { import: './dist/index.mjs', require: './dist/index.cjs' } },
      },
      null,
      2,
    ),
    'app/node_modules/wrapper-pkg/dist/index.cjs': [
      '// 唯一的实现，状态只存在于这里',
      'class Counter { constructor() { this.n = 0; } }',
      'const state = { hits: 0 };',
      'exports.Counter = Counter;',
      'exports.state = state;',
      'exports.kind = "the-only-one";',
    ].join('\n'),
    'app/node_modules/wrapper-pkg/dist/index.mjs': [
      '// ESM 外壳：把 CJS 的实现原样转出去，自己不含任何状态',
      'import cjs from "./index.cjs";',
      'export const Counter = cjs.Counter;',
      'export const state = cjs.state;',
      'export const kind = cjs.kind;',
      'export default cjs;',
    ].join('\n'),

    // ---- 包 3：两条路指向同一个 CJS 文件（Node 会去重，天然安全）
    'app/node_modules/samefile-pkg/package.json': JSON.stringify(
      {
        name: 'samefile-pkg',
        version: '1.0.0',
        type: 'commonjs',
        exports: { '.': { import: './index.cjs', require: './index.cjs' } },
      },
      null,
      2,
    ),
    // 注意这个 CJS 文件里两种写法**故意混用**，第 4.3 节会用到：
    //   · `exports.X = ...` 能被 cjs-module-lexer 静态分析出来 → ESM 侧能看到命名导出
    //   · `Object.assign(exports, {...})` 分析不出来 → 只有走 default 才看得到
    'app/node_modules/samefile-pkg/index.cjs': [
      'class Counter { constructor() { this.n = 0; } }',
      'const state = { hits: 0 };',
      'exports.Counter = Counter;',
      'exports.state = state;',
      'exports.kind = "cjs-only";',
      'Object.assign(exports, { hiddenFromLexer: "静态分析看不到我" });',
    ].join('\n'),

    // ---- 包 4 / 5：条件顺序对照实验
    // 后缀刻意用 .mjs / .cjs，避免"type 字段是不是 module"干扰实验结论
    'app/node_modules/cond-node-first-pkg/package.json': JSON.stringify(
      {
        name: 'cond-node-first-pkg',
        version: '1.0.0',
        exports: { '.': { node: './node.cjs', import: './import.mjs', require: './require.cjs' } },
      },
      null,
      2,
    ),
    'app/node_modules/cond-node-first-pkg/node.cjs': 'module.exports = { picked: "node.cjs" };\n',
    'app/node_modules/cond-node-first-pkg/import.mjs': 'export const picked = "import.mjs";\n',
    'app/node_modules/cond-node-first-pkg/require.cjs': 'module.exports = { picked: "require.cjs" };\n',

    'app/node_modules/cond-io-first-pkg/package.json': JSON.stringify(
      {
        name: 'cond-io-first-pkg',
        version: '1.0.0',
        exports: { '.': { import: './import.mjs', require: './require.cjs', node: './node.cjs' } },
      },
      null,
      2,
    ),
    'app/node_modules/cond-io-first-pkg/node.cjs': 'module.exports = { picked: "node.cjs" };\n',
    'app/node_modules/cond-io-first-pkg/import.mjs': 'export const picked = "import.mjs";\n',
    'app/node_modules/cond-io-first-pkg/require.cjs': 'module.exports = { picked: "require.cjs" };\n',

    // ---- 包 6：只有 main，没有 exports → 深路径可以随便进
    'app/node_modules/main-only-pkg/package.json': JSON.stringify(
      { name: 'main-only-pkg', version: '1.0.0', main: './lib/entry.js' },
      null,
      2,
    ),
    'app/node_modules/main-only-pkg/lib/entry.js': 'module.exports = { name: "main-only-pkg/entry" };\n',
    'app/node_modules/main-only-pkg/lib/internal/deep.js':
      'module.exports = { name: "main-only-pkg/internal/deep（本来不该被外部依赖）" };\n',

    // ---- 包 7：有 exports → 深路径被封死；再用通配符开一个口子
    'app/node_modules/locked-pkg/package.json': JSON.stringify(
      {
        name: 'locked-pkg',
        version: '2.0.0',
        type: 'module',
        exports: { '.': './index.js' },
      },
      null,
      2,
    ),
    'app/node_modules/locked-pkg/index.js': 'export const name = "locked-pkg";\n',
    'app/node_modules/locked-pkg/lib/util.js': 'export const util = "locked-pkg/lib/util（被封死）";\n',

    'app/node_modules/wildcard-pkg/package.json': JSON.stringify(
      {
        name: 'wildcard-pkg',
        version: '2.0.0',
        type: 'module',
        exports: { '.': './index.js', './lib/*': './lib/*.js', './internal/*': null },
      },
      null,
      2,
    ),
    'app/node_modules/wildcard-pkg/index.js': 'export const name = "wildcard-pkg";\n',
    'app/node_modules/wildcard-pkg/lib/a.js': 'export const a = "wildcard-pkg/lib/a";\n',
    'app/node_modules/wildcard-pkg/internal/secret.js':
      'export const secret = "不该被外部 import 的内部实现";\n',

    // ---- 包 8：main + module + browser 三个都写，看 Node 到底读哪个
    'app/node_modules/legacy-fields-pkg/package.json': JSON.stringify(
      {
        name: 'legacy-fields-pkg',
        version: '1.0.0',
        main: './main.js',
        module: './module.mjs',
        browser: './browser.js',
      },
      null,
      2,
    ),
    'app/node_modules/legacy-fields-pkg/main.js': 'module.exports = { picked: "main.js（CJS）" };\n',
    'app/node_modules/legacy-fields-pkg/module.mjs': 'export const picked = "module.mjs";\n',
    'app/node_modules/legacy-fields-pkg/browser.js': 'module.exports = { picked: "browser.js" };\n',

    // ---- 包 9：纯 ESM 包（exports 是字符串形式）
    'app/node_modules/esm-only-pkg/package.json': JSON.stringify(
      { name: 'esm-only-pkg', version: '3.0.0', type: 'module', exports: './index.js' },
      null,
      2,
    ),
    'app/node_modules/esm-only-pkg/index.js': 'export const hello = "我是纯 ESM 包";\nexport default 42;\n',

    // ---- 包 10：browser 条件 —— Node 不认它
    'app/node_modules/browser-cond-pkg/package.json': JSON.stringify(
      {
        name: 'browser-cond-pkg',
        version: '1.0.0',
        type: 'module',
        exports: { '.': { browser: './b.js', default: './d.js' } },
      },
      null,
      2,
    ),
    'app/node_modules/browser-cond-pkg/b.js': 'export const env = "browser";\n',
    'app/node_modules/browser-cond-pkg/d.js': 'export const env = "default（Node 只能走这条）";\n',
  });

  console.log('  已创建 10 个迷你包：dual-pkg / wrapper-pkg / samefile-pkg / cond-node-first-pkg /');
  console.log('    cond-io-first-pkg / main-only-pkg / locked-pkg / wildcard-pkg / legacy-fields-pkg /');
  console.log('    esm-only-pkg / browser-cond-pkg（其中 cond-* 是两个对照包）');
  console.log();

  // 探针：一个放在 app/ 里的模块，用它来"从消费者的位置"发起真实的解析
  const probeSource = [
    "import { createRequire } from 'node:module';",
    '',
    'const require = createRequire(import.meta.url);',
    'const out = {};',
    '',
    '// 小工具：把"成功"和"失败（连错误码一起）"都变成可打印的数据',
    'const attempt = async (fn) => {',
    '  try {',
    '    return { ok: true, value: await fn() };',
    '  } catch (err) {',
    '    return { ok: false, code: err.code || err.name };',
    '  }',
    '};',
    '',
    'const resolveBoth = async (name) => ({',
    '  esm: await attempt(() => import.meta.resolve(name)),',
    '  cjs: await attempt(() => require.resolve(name)),',
    '});',
    '',
    '// ---------- 双包：两份实现 ----------',
    'const dualEsm = await import("dual-pkg");',
    'const dualCjs = require("dual-pkg");',
    'dualEsm.state.hits += 1;',
    'out.dual = {',
    '  kindSeenFromEsm: dualEsm.kind,',
    '  kindSeenFromCjs: dualCjs.kind,',
    '  sameClass: dualEsm.Counter === dualCjs.Counter,',
    '  instanceofOk: new dualCjs.Counter() instanceof dualEsm.Counter,',
    '  hitsSeenFromCjs: dualCjs.state.hits,',
    '  esmResolvedTo: (await resolveBoth("dual-pkg")).esm.value,',
    '  cjsResolvedTo: require.resolve("dual-pkg"),',
    '};',
    '',
    '// ---------- 修法 A：ESM 外壳 + CJS 内核 ----------',
    'const wrapEsm = await import("wrapper-pkg");',
    'const wrapCjs = require("wrapper-pkg");',
    'wrapEsm.state.hits += 1;',
    'out.wrapper = {',
    '  sameClass: wrapEsm.Counter === wrapCjs.Counter,',
    '  instanceofOk: new wrapCjs.Counter() instanceof wrapEsm.Counter,',
    '  hitsSeenFromCjs: wrapCjs.state.hits,',
    '};',
    '',
    '// ---------- 修法 B：两条路指向同一个 CJS 文件 ----------',
    'const sameEsm = await import("samefile-pkg");',
    'const sameCjs = require("samefile-pkg");',
    'sameEsm.state.hits += 1;',
    'out.samefile = {',
    '  sameClass: sameEsm.Counter === sameCjs.Counter,',
    '  instanceofOk: new sameCjs.Counter() instanceof sameEsm.Counter,',
    '  hitsSeenFromCjs: sameCjs.state.hits,',
    '  esmVisibleNames: Object.keys(sameEsm).filter((k) => k !== "default" && k !== "module.exports").sort(),',
    '  cjsVisibleNames: Object.keys(sameCjs).sort(),',
    '  hiddenFromLexerOnEsmSide: typeof sameEsm.hiddenFromLexer,',
    '  hiddenFromLexerOnCjsSide: typeof sameCjs.hiddenFromLexer,',
    '};',
    '',
    '// ---------- 条件顺序 ----------',
    'const nodeFirst = await import("cond-node-first-pkg");',
    'out.condNodeFirst = {',
    '  importPicked: nodeFirst.picked,',
    '  requirePicked: require("cond-node-first-pkg").picked,',
    '  esmResolvedTo: (await resolveBoth("cond-node-first-pkg")).esm.value,',
    '};',
    'const ioFirst = await import("cond-io-first-pkg");',
    'out.condIoFirst = {',
    '  importPicked: ioFirst.picked,',
    '  requirePicked: require("cond-io-first-pkg").picked,',
    '  esmResolvedTo: (await resolveBoth("cond-io-first-pkg")).esm.value,',
    '};',
    '',
    '// ---------- 深路径：没有 exports 的包 vs 有 exports 的包 ----------',
    'out.deep = {',
    '  mainOnlyAllowed: (await attempt(() => import("main-only-pkg/lib/internal/deep.js"))).ok,',
    '  mainOnlyViaRequire: (await attempt(() => require("main-only-pkg/lib/internal/deep.js"))).ok,',
    '  lockedBlockedImport: await attempt(() => import("locked-pkg/lib/util.js")),',
    '  lockedBlockedRequire: await attempt(() => require("locked-pkg/lib/util.js")),',
    '  wildcardExtensionless: await attempt(() => import("wildcard-pkg/lib/a")),',
    '  wildcardWithExtension: await attempt(() => import("wildcard-pkg/lib/a.js")),',
    '  wildcardNullBlocked: await attempt(() => import("wildcard-pkg/internal/secret.js")),',
    '  rootStillOk: (await attempt(() => import("wildcard-pkg"))).ok,',
    '};',
    '',
    '// ---------- main / module / browser ----------',
    'out.legacyFields = {',
    '  esmResolvedTo: (await resolveBoth("legacy-fields-pkg")).esm.value,',
    '  cjsResolvedTo: require.resolve("legacy-fields-pkg"),',
    '};',
    '',
    '// ---------- require(ESM) ----------',
    'out.esmOnly = {',
    '  importOk: (await attempt(() => import("esm-only-pkg"))).ok,',
    '  requireAttempt: await attempt(() => require("esm-only-pkg")),',
    '};',
    'if (out.esmOnly.requireAttempt.ok) {',
    '  out.esmOnly.requireKeys = Object.keys(out.esmOnly.requireAttempt.value).sort();',
    '  out.esmOnly.requireDefault = out.esmOnly.requireAttempt.value.default;',
    '}',
    '',
    '// ---------- browser 条件 ----------',
    'const browserCond = await import("browser-cond-pkg");',
    'out.browserCond = {',
    '  picked: browserCond.env,',
    '  esmResolvedTo: (await resolveBoth("browser-cond-pkg")).esm.value,',
    '};',
    '',
    'export default out;',
  ].join('\n');

  writeFiles(tmpRoot, { 'app/probe.mjs': probeSource });

  // 真正的解析发生在这里：动态 import 一个位于 app/ 里的模块，
  // 它内部的 import / require 都会以 app/ 为起点去找 node_modules。
  const probeUrl = pathToFileURL(path.join(app, 'probe.mjs')).href;
  const probe = (await import(probeUrl)).default;

  const fileOf = (urlOrPath) => (urlOrPath ? path.basename(String(urlOrPath).replace(/^file:\/\/\//, '')) : '(失败)');
  const ok = (v) => (v ? '✅' : '❌');

  console.log('  [3.1] 条件顺序实验：两个包只差"条件写的顺序"');
  console.log();
  console.log(`    ${'包名'.padEnd(22)} ${'import 选中的文件'.padEnd(16)} ${'require 选中的文件'.padEnd(16)} 说明`);
  const condRows = [
    [
      'cond-node-first-pkg',
      fileOf(probe.condNodeFirst.esmResolvedTo),
      probe.condNodeFirst.requirePicked,
      '"node" 写在最前 → 两种方式都被它吃掉',
    ],
    [
      'cond-io-first-pkg',
      fileOf(probe.condIoFirst.esmResolvedTo),
      probe.condIoFirst.requirePicked,
      '"import"/"require" 在前 → 各走各的，这就是双包',
    ],
  ];
  for (const [name, esmPick, cjsPick, note] of condRows) {
    console.log(`    ${name.padEnd(22)} ${esmPick.padEnd(16)} ${cjsPick.padEnd(16)} ${note}`);
  }
  console.log();
  console.log('    → 实测结论：`node` 条件对 import 和 require **都成立**，所以它放在前面时，');
  console.log('      两个消费者拿到的是同一个文件，双包就白做了。');
  console.log('    → 正确写法：把最具体的条件放最前，`default` 放最后。');
  console.log();

  console.log('  [3.2] 深路径导入：exports 是一把"锁"');
  console.log();
  console.log(`    main-only-pkg（没有 exports）：`);
  console.log(`      import 'main-only-pkg/lib/internal/deep.js'  → ${ok(probe.deep.mainOnlyAllowed)} 允许`);
  console.log(`      require('main-only-pkg/lib/internal/deep.js') → ${ok(probe.deep.mainOnlyViaRequire)} 允许`);
  console.log(`      ⚠️ 这就是问题：内部文件被当成了公开 API，作者再也不能安全地重构它。`);
  console.log();
  console.log(`    locked-pkg（只有 "exports": { ".": "./index.js" }）：`);
  console.log(`      import 'locked-pkg/lib/util.js'  → 🚫 被拒绝：${probe.deep.lockedBlockedImport.code}`);
  console.log(`      require('locked-pkg/lib/util.js') → 🚫 被拒绝：${probe.deep.lockedBlockedRequire.code}`);
  console.log(`      （本机 Node ${process.version} 的 require 报的也是 ERR_PACKAGE_PATH_NOT_EXPORTED。`);
  console.log(`        但报错信息里只有一句"Package subpath ... is not defined by exports"，`);
  console.log(`        对不熟悉 exports 的人来说和"文件不存在"几乎没法区分——这类事故难查就在这里。）`);
  console.log();
  console.log(`    wildcard-pkg（exports: { ".": "./index.js", "./lib/*": "./lib/*.js", "./internal/*": null }）：`);
  console.log(`      import 'wildcard-pkg'                    → ${ok(probe.deep.rootStillOk)} 正常（走 "."）`);
  console.log(`      import 'wildcard-pkg/lib/a'              → ${ok(probe.deep.wildcardExtensionless.ok)} 被 './lib/*' 放行（注意**不写后缀**）`);
  console.log(`      import 'wildcard-pkg/lib/a.js'           → 🚫 失败：${probe.deep.wildcardWithExtension.code}`);
  console.log(`        ↑ 这是通配符最反直觉的地方：通配符会把 "a.js" 整段接过去，`);
  console.log(`          映射结果是 './lib/a.js.js'，文件根本不存在。用户必须写 'pkg/lib/a'。`);
  console.log(`      import 'wildcard-pkg/internal/secret.js' → 🚫 被 './internal/*': null 显式封死：${probe.deep.wildcardNullBlocked.code}`);
  console.log();
  console.log('    📌 这一节是本文件最该记住的部分：');
  console.log('       **给 package.json 加 exports 的同一个 commit，就是一次破坏性变更。**');
  console.log('       所有 `import "pkg/dist/xxx"` 的下游都会在升级后报错。必须升 major。');
  console.log();

  console.log('  [3.3] main / module / browser：谁说话算数');
  console.log();
  console.log(`    一个包同时写了三个字段（main → main.js, module → module.mjs, browser → browser.js）：`);
  console.log(`      import 'legacy-fields-pkg' 实际解析到 → ${fileOf(probe.legacyFields.esmResolvedTo)}`);
  console.log(`      require('legacy-fields-pkg') 实际解析到 → ${fileOf(probe.legacyFields.cjsResolvedTo)}`);
  console.log();
  console.log('    实测结论：**Node 只读 main，完全无视 module 和 browser。**');
  console.log('    三个字段的归属：');
  const fieldOwner = [
    ['main', 'Node + 所有工具', '传统入口字段。**只有当包没有 exports 时** Node 才会用它'],
    ['module', '打包器（webpack/rollup/vite）', '社区约定，不是标准。Node 从来不读它'],
    ['browser', '打包器', '社区约定，用来把 Node 专用实现换成浏览器实现'],
    ['exports', 'Node 优先读它', '有 exports 时，`. ` 这条路径**完全由 exports 决定，main 被忽略**'],
  ];
  console.log(`      ${'字段'.padEnd(10)} ${'谁读它'.padEnd(28)} 说明`);
  for (const [f, who, note] of fieldOwner) console.log(`      ${f.padEnd(10)} ${who.padEnd(28)} ${note}`);
  console.log();
  console.log('    ⚠️ 常见误解："我写了 module 字段，所以我的包支持 ESM。" —— 不成立。');
  console.log('       Node 用 import 加载这个包时，走的仍然是 main 指向的 CJS 文件；');
  console.log('       只有打包器会去读 module。真正的 ESM 入口必须写在 exports 里。');
  console.log();

  // -------------------------------------------------------------------------
  // 4. dual package hazard
  // -------------------------------------------------------------------------
  console.log('--- 4. dual package hazard：同一份代码被加载了两次 ---');
  console.log();
  console.log('  当 exports 把 import 和 require 指向**两份不同的实现**时，');
  console.log('  Node 的模块缓存里就会有两个互不相干的模块实例。后果：');
  console.log();

  console.log('  [4.1] 现场复现（dual-pkg：import → index.mjs，require → index.cjs）');
  console.log();
  console.log(`    ESM 侧看到的实现标记 kind = ${probe.dual.kindSeenFromEsm}`);
  console.log(`    CJS 侧看到的实现标记 kind = ${probe.dual.kindSeenFromCjs}`);
  console.log(`    两边的 Counter 是同一个类吗？        ${ok(probe.dual.sameClass)} ${probe.dual.sameClass}`);
  console.log(`    new (CJS 的 Counter) instanceof (ESM 的 Counter)？ ${ok(probe.dual.instanceofOk)} ${probe.dual.instanceofOk}`);
  console.log(`    从 ESM 侧给 state.hits 加了 1，CJS 侧读到的值是 ${probe.dual.hitsSeenFromCjs}（期望 1）`);
  console.log();
  console.log('    这三行就是 dual package hazard 的全部症状：');
  console.log('      · **instanceof 失效** → 校验逻辑静默放行或误杀；');
  console.log('      · **单例变两个** → 缓存、连接池、事件总线全都变成两套；');
  console.log('      · **状态不同步** → 你以为改的是"那个"对象，其实改的是副本。');
  console.log();
  console.log('    最要命的是这类 bug **不会报错**，只是行为诡异，而且往往只在');
  console.log('    "某个依赖是 ESM、某段代码是 CJS"的特定组合下出现。');
  console.log();

  console.log('  [4.2] 三种修法（都实测了）');
  console.log();
  console.log('    修法 A：**ESM 外壳 + CJS 内核**（最通用，推荐）');
  console.log('      index.cjs 放唯一的实现，index.mjs 只是 `import cjs from "./index.cjs"` 再转发出去。');
  console.log(`      实测：两边是同一个类吗？${ok(probe.wrapper.sameClass)}   instanceof 正常？${ok(probe.wrapper.instanceofOk)}   状态共享？${probe.wrapper.hitsSeenFromCjs === 1 ? '✅ 是（读到 1）' : '❌ 否'}`);
  console.log('      代价：CJS 用户走的是原生路径，ESM 用户多一层包装；');
  console.log('            而且 ESM 用户拿不到"真正的 ESM 导出"（比如命名导出的静态分析会更差）。');
  console.log();
  console.log('    修法 B：**两条路指向同一个 CJS 文件**（最省事）');
  console.log('      exports 里 import 和 require 都写 "./index.cjs"。');
  console.log(`      实测：两边是同一个类吗？${ok(probe.samefile.sameClass)}   instanceof 正常？${ok(probe.samefile.instanceofOk)}   状态共享？${probe.samefile.hitsSeenFromCjs === 1 ? '✅ 是（读到 1）' : '❌ 否'}`);
  console.log('      Node 对同一个 CJS 文件只有一份缓存，所以天然没有双实例问题。');
  console.log('      代价：ESM 用户拿到的是 CJS 模块的 ESM 视图（命名导出的推导有局限）。');
  console.log();
  console.log('    修法 C：**纯 ESM，靠 require(esm) 兼容**（新方案，要看 Node 版本）');
  console.log('      Node 20.19 / 22.12 起，require() 可以直接加载 ESM 包。');
  console.log(`      本机 Node ${process.version} 实测：`);
  console.log(`        import 'esm-only-pkg'  → ${ok(probe.esmOnly.importOk)} 成功`);
  if (probe.esmOnly.requireAttempt.ok) {
    console.log(`        require('esm-only-pkg') → ✅ 成功，拿到 ${JSON.stringify(probe.esmOnly.requireKeys)}，default = ${probe.esmOnly.requireDefault}`);
    console.log('      → 所以"只发一个 ESM 包"在 2024 年之后重新变成了可行选项。');
  } else {
    console.log(`        require('esm-only-pkg') → ❌ 失败，错误码 ${probe.esmOnly.requireAttempt.code}`);
    console.log('      → 当前 Node 版本还不支持 require(ESM)，纯 ESM 包会让 CJS 用户直接装不上。');
  }
  console.log('      限制：模块图必须是**同步**的（不能有顶层 await），否则 require 仍然会报错。');
  console.log();
  console.log('    修法 D（不推荐但要认识）：**把状态挂到 globalThis 上**');
  console.log('      用一个 Symbol.for("pkg-name") 当键，把单例存进 globalThis，两份实现都去读它。');
  console.log('      它能解决"单例变两个"，但**解决不了 instanceof**，还引入了全局命名空间污染');
  console.log('      和"同一个包里出现两份代码"的体积浪费。属于兜底手段，不是设计。');
  console.log();

  console.log('  [4.3] 附带发现：从 ESM 侧看 CJS 包，命名导出是"猜"出来的');
  console.log();
  console.log('    Node 允许 `import` 一个 CJS 模块，但这时的"命名导出"并不是真实的，');
  console.log('    而是用 cjs-module-lexer 对源码做**静态分析**猜出来的。猜不出来就只剩 default。');
  console.log('    同一个 CJS 文件，两种写法的实测差别：');
  console.log();
  console.log(`      CJS 侧（require）看到的键： ${probe.samefile.cjsVisibleNames.join(', ')}`);
  console.log(`      ESM 侧（import）看到的键： ${probe.samefile.esmVisibleNames.join(', ')}`);
  console.log(`      hiddenFromLexer 在 CJS 侧是 ${probe.samefile.hiddenFromLexerOnCjsSide}，在 ESM 侧是 ${probe.samefile.hiddenFromLexerOnEsmSide}`);
  console.log();
  console.log('    原因是 CJS 文件里两种写法混用（见生成该包的代码）：');
  console.log('      exports.Counter = Counter          → ✅ 静态分析得到，ESM 侧可见');
  console.log('      Object.assign(exports, { x: 1 })   → ❌ 静态分析得不到，ESM 侧不可见');
  console.log('    **用户会看到"require 有、import 没有"，然后来提 issue。**');
  console.log();
  console.log('    实践结论（这条对库作者很实用）：');
  console.log('      · 双包场景下，CJS 那一侧请统一用 `exports.X = ...` 的写法；');
  console.log('      · 或者干脆接受"ESM 侧只给 default"，然后在文档里写清楚；');
  console.log('      · 最好的办法当然是修法 A：ESM 那一侧别转发 CJS，而是**自己写 ESM 导出**。');
  console.log();

  // -------------------------------------------------------------------------
  // 5. sideEffects 与 tree-shaking
  // -------------------------------------------------------------------------
  console.log('--- 5. sideEffects: false 与 tree-shaking ---');
  console.log();
  console.log('  【tree-shaking】打包器的一项能力：静态分析出"这个导出没人用"，');
  console.log('  于是把它连同它引出的代码一起从产物里删掉。它是打包产物变小的主要来源。');
  console.log('  但它有个前提：**删掉这段代码不会有任何可观察的影响。**');
  console.log('  打包器无法判断"有没有影响"，所以需要你告诉它 —— 这就是 sideEffects 字段。');
  console.log();
  const sideEffectForms = [
    ['不写 sideEffects', '默认"可能有副作用"', '最保守的默认值，最安全，但 tree-shaking 能力受限'],
    ['"sideEffects": false', '这个包里所有模块都没有副作用', 'tree-shaking 最激进，**标错了就会删掉不该删的代码**'],
    ['"sideEffects": ["*.css", "./src/polyfill.js"]', '只有这些文件有副作用', '最常见的折中写法：其余部分随便摇'],
  ];
  for (const [form, meaning, note] of sideEffectForms) {
    console.log(`    ${form}`);
    console.log(`      └─ 含义：${meaning}`);
    console.log(`      └─ 说明：${note}`);
  }
  console.log();
  console.log('  ⚠️ 什么算"副作用"（有这些的包**不能**写 false）：');
  console.log('    · import 时修改全局对象或原型（`Array.prototype.foo = ...`、注册 polyfill）；');
  console.log('    · import 时往某个注册表里塞东西（自定义元素、装饰器注册、i18n 词条）；');
  console.log('    · CSS 的 @import / import "./style.css"（样式本身就是要的副作用）；');
  console.log('    · 读环境变量并立刻抛错（比如"缺少 API KEY"的启动检查）。');
  console.log();
  console.log('  为什么标错很危险：**它删的是"看起来没人 import 的模块"**，');
  console.log('  而副作用恰恰发生在"没人 import 它也生效"的模块上。');
  console.log('  表现是：开发环境一切正常（没开摇树），生产构建里功能静默消失。');
  console.log();

  // -------------------------------------------------------------------------
  // 6. 库作者自检清单
  // -------------------------------------------------------------------------
  console.log('--- 6. 双包自检清单 ---');
  console.log();
  const finalChecklist = [
    ['入口', 'exports 里 import / require / default 三个条件都写了吗？default 在最后吗？'],
    ['入口', 'main 字段还在吗？（老工具、老 Node 仍然会读它，别删）'],
    ['入口', 'exports 里 "." 之外的路径都显式列出来了吗？还是留着深路径开放？'],
    ['入口', '加 exports 是不是一次破坏性变更？版本号升 major 了吗？'],
    ['一致性', 'import 和 require 拿到的类/单例是同一个吗？（用本文件第 4 节的方法验一次）'],
    ['一致性', '两条路的状态是共享的吗？（缓存、计数器、注册表都测一遍）'],
    ['一致性', 'ESM 入口文件的 package.json 里 type 是 module 吗？后缀对得上吗？'],
    ['体积', 'sideEffects 写对了吗？包里到底有没有副作用，逐个 import 检查过吗？'],
    ['体积', '有没有把测试、源码、sourcemap 一起发出去？（见 09_publishing_packages.js）'],
    ['类型', 'types / exports 里的 types 条件指向声明文件了吗？（TypeScript 用户看不到类型的报错最伤）'],
    ['验证', '用 `node --input-type=module -e "import("pkg")"` 和 `node -e "require("pkg")"` 各验一次'],
  ];
  let n = 0;
  for (const [group, item] of finalChecklist) {
    n++;
    console.log(`    ${String(n).padStart(2)}. [${group}] ${item}`);
  }
  console.log();
  console.log('  最后一句总结：');
  console.log('    **exports 决定了"用户能碰到什么"，双包的实现方式决定了"用户碰到几次"。**');
  console.log('    前者做错 → 升级时炸；后者做错 → 升级后行为诡异，且很难查。');
  console.log();
} finally {
  // 无论中间出什么错，临时目录都要清理干净
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  console.log(`--- 清理 ---`);
  console.log(`已删除临时目录：${tmpRoot}`);
  console.log(`（它还在吗？ ${fs.existsSync(tmpRoot) ? '在（清理失败）' : '不在了 ✅'}）`);
}
