/**
 * ============================================================================
 * 知识点：构建打包（bundling）与转译（transpiling）
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】高级
 * 【前置知识】19_modules/（模块系统）、39_tooling_and_workflow/01_package_json_guide.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    · **打包（bundling）**：把成百上千个源码模块，合并成浏览器能直接加载的
 *      少数几个文件。做这件事的工具叫 bundler（打包器）。
 *    · **转译（transpiling）**：把新语法改写成旧语法，让老环境也能跑。
 *      做这件事的工具叫 transpiler（转译器），典型是 Babel 和 TypeScript 的 tsc。
 *    两者经常由同一个工具链一起完成，但**是两件不同的事**：
 *    打包关心"文件怎么组合"，转译关心"语法怎么写"。
 *
 * 2. 为什么需要（真实项目场景）
 *    浏览器从 2018 年起就原生支持 `import`，那为什么还要打包？三个现实原因：
 *      (a) **请求瀑布**：一个 200 个模块的应用，浏览器要发 200 次请求，
 *          每次都要等上一层的 import 被解析出来才能发下一层，首屏会明显变慢；
 *      (b) **裸模块名**：浏览器**不认** `import _ from 'lodash'`，
 *          它只认 URL。而 npm 生态里所有包都用裸模块名互相 import；
 *      (c) **npm 包大量仍是 CommonJS**：`require` / `module.exports` 浏览器完全不认。
 *    另外还有压缩体积、tree-shaking、按需分块等收益。
 *
 * 3. 核心语法要点
 *    本文件**不 import 任何打包器**（仓库里也确实只有作为传递依赖被装上的
 *    rollup / vite / esbuild）。我们改为：
 *      · 用一张数字表说明请求瀑布；
 *      · 用 process 里已有的信息说明裸模块名与 URL 的差别；
 *      · **自己写一个 60 行的迷你 tree-shaker**，真跑一遍"哪些代码会被摇掉"；
 *      · 用 `new Function` 探测当前引擎支持哪些语法，说明"要不要转译"取决于目标环境。
 *
 * 4. 常见陷阱
 *    - 以为"用 ESM 写就一定能 tree-shaking"：还要 `sideEffects` 标记正确，
 *      且模块里不能有"看起来像副作用"的顶层代码。
 *    - 以为 tree-shaking 能摇掉一切没用的代码：
 *      它只做**静态可达性分析**，动态属性访问（`obj[key]`）会让分析全部失效。
 *    - 以为 `target: "esnext"` 更先进：它意味着"不转译"，
 *      老浏览器打开就白屏。target 选错是"本地好好的、用户白屏"的头号原因。
 *    - 在 Node 后端项目里也上一套 bundler：除了增加构建时间没有任何收益，
 *      服务端不需要减少请求数。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/06_bundlers_and_transpiling.js
 *
 * 【预期输出】
 *   逐节打印：为什么需要打包（含请求瀑布数字表）、bundler 的五步工作流、
 *   主流工具的定位对比、tree-shaking 的三个前提、
 *   自研迷你 tree-shaker 的完整分析与输出对比（可摇 / 不可摇）、
 *   转译要解决什么、当前引擎语法支持探测表、
 *   以及"什么时候不需要打包"的判断清单。
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('--- 0. 环境信息 ---');
console.log(`Node 版本：${process.version}`);
console.log(`V8 引擎版本：${process.versions.v8}`);
console.log('本文件不 import 任何打包器，全部内容离线讲解 + 自研迷你实现。');
console.log();

// ---------------------------------------------------------------------------
// 1. 为什么需要打包
// ---------------------------------------------------------------------------
console.log('--- 1. 为什么需要打包 ---');

console.log('  [1.1] 理由一：请求瀑布');
console.log('        浏览器解析到 import 才知道要请求哪个文件，所以模块是"一层一层"发现的。');
console.log('        假设每个模块平均 1.5KB，深度 5 层，来算一笔账：');
console.log();
console.log(`    ${'模块数量'.padEnd(10)} ${'原生 ESM 请求数'.padEnd(16)} ${'串行等待时间(按 30ms RTT)'.padEnd(26)} 打包后`);
const waterfall = [
  [10, 10, 10 * 30],
  [50, 50, 50 * 30],
  [200, 200, 200 * 30],
  [1000, 1000, 1000 * 30],
];
for (const [mods, reqs, ms] of waterfall) {
  // 打包后：1 个入口 bundle（或按路由分块），请求数基本与模块数无关
  console.log(
    `    ${String(mods).padEnd(10)} ${String(reqs).padEnd(16)} ${(ms + 'ms').padEnd(26)} 1~3 个文件`,
  );
}
console.log('        → HTTP/2 能缓解但不能消除：瓶颈不是带宽，而是"发现依赖的轮次"。');
console.log('          打包把"运行时才发现"变成"构建时就确定"，这是它最大的价值。');
console.log();

console.log('  [1.2] 理由二：浏览器只认 URL，不认裸模块名');
const bareResolved = import.meta.resolve('semver');
const relResolved = import.meta.resolve('./03_semver.js');
console.log(`        import 'semver'          → Node 解析成 ${bareResolved}`);
console.log(`        import './03_semver.js'  → Node 解析成 ${relResolved}`);
console.log('        裸模块名的解析规则是"往上找 node_modules"，这是 **Node 的规则**，');
console.log('        浏览器没有这个概念。浏览器看到 `import x from "lodash"` 只会报错。');
console.log('        解决方式有两种：');
console.log('          · 打包器：在构建时把裸模块名替换成实际文件内容（最主流）；');
console.log('          · import maps：在 HTML 里声明 "lodash" → "/vendor/lodash.js"（见 27_web_apis）。');
console.log();

console.log('  [1.3] 理由三：npm 上大量包仍是 CommonJS');
console.log('        CJS 用 require() 同步读取并动态执行 module.exports，');
console.log('        而浏览器里没有 require / module / exports 这三个全局量。');
console.log('        打包器要负责把它们翻译成浏览器能懂的代码（这叫 CJS→ESM 互操作）。');
console.log();
console.log('        本仓库的 package.json 是 type: module，仓库源码几乎全是 ESM；');
console.log('        但 node_modules 里的包未必都是。我们直接扫一遍真实安装的包看看：');
const nmDir = path.join(ROOT, 'node_modules');
let esmCount = 0; // 显式 "type": "module"
let cjsCount = 0; // 显式 "type": "commonjs"
let unsetCount = 0; // 没写 type → .js 默认按 CJS 解析
let dualCount = 0; // 同时提供 import/require 条件导出（双格式包）
let total = 0;
for (const entry of fs.readdirSync(nmDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
  // 只统计顶层目录里第一层包，scoped 包（@xxx/yyy）单独展开
  const candidates = entry.name.startsWith('@')
    ? fs
        .readdirSync(path.join(nmDir, entry.name), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => path.join(entry.name, e.name))
    : [entry.name];

  for (const rel of candidates) {
    try {
      const info = JSON.parse(fs.readFileSync(path.join(nmDir, rel, 'package.json'), 'utf8'));
      if (info.private === true && !info.version) continue;
      total++;
      if (info.type === 'module') esmCount++;
      else if (info.type === 'commonjs') cjsCount++;
      else unsetCount++;
      const ex = info.exports;
      if (ex && typeof ex === 'object') {
        const rootExport = ex['.'] ?? ex;
        if (rootExport && typeof rootExport === 'object' && rootExport.import && rootExport.require) dualCount++;
      }
    } catch {
      // 没有 package.json 或不是合法 JSON 的目录直接跳过
    }
  }
}
console.log(`          node_modules 顶层的 ${total} 个包中：`);
console.log(`            显式 "type": "module"          ${String(esmCount).padStart(4)} 个`);
console.log(`            显式 "type": "commonjs"        ${String(cjsCount).padStart(4)} 个`);
console.log(`            未声明 type（默认按 CJS 解析） ${String(unsetCount).padStart(4)} 个`);
console.log(`            用 exports 同时提供 import/require 的"双格式"包：${dualCount} 个`);
console.log('          → 未声明 type 的占大多数，它们的 .js 会被当成 CommonJS。');
console.log('            这就是打包器必须在同一个依赖图里同时处理 ESM 和 CJS 的原因；');
console.log('            而"双格式包"正是库作者为了同时伺候两种使用者而付出的额外成本。');
console.log();

console.log('  [1.4] 其他收益');
const otherBenefits = [
  ['压缩体积', '删掉空格、注释，把局部变量重命名为 a/b/c', '通常能减少 40%~70% 的传输体积'],
  ['tree-shaking', '静态分析后删掉没被用到的导出', '库越大收益越明显（lodash 常能减 60%+）'],
  ['代码分割', '按路由/动态 import 拆成多个 chunk，按需加载', '首屏只加载真正需要的代码'],
  ['资源处理', '把 CSS / 图片 / 字体一起纳入依赖图并做优化', '一个入口搞定整站资源'],
  ['环境变量替换', '把 process.env.NODE_ENV 替换成 "production"', '让框架能"编译期"去掉开发分支'],
  ['统一语法', '把 TS / JSX / Vue SFC 编译成标准 JS', '浏览器只认识 JS'],
];
console.log(`    ${'收益'.padEnd(14)} ${'做什么'.padEnd(48)} 效果`);
for (const [benefit, what, effect] of otherBenefits) {
  console.log(`    ${benefit.padEnd(14)} ${what.padEnd(48)} ${effect}`);
}
console.log();

// ---------------------------------------------------------------------------
// 2. bundler 的工作流程
// ---------------------------------------------------------------------------
console.log('--- 2. bundler 的工作流程（五个阶段） ---');

const pipeline = [
  ['① 入口解析', '从 entry（如 src/main.js）开始，把文件路径解析成绝对路径', '遇到裸模块名就去 node_modules 找'],
  ['② 依赖图构建', '解析每个文件里的 import/require，递归收集所有依赖，形成有向图', '这是 bundler 最核心的数据结构；循环依赖在这里被处理'],
  ['③ 转换（transform）', '对每个模块执行 loader/plugin：TS→JS、JSX→JS、Sass→CSS……', '每个模块变成一段"标准 JS"'],
  ['④ 优化与分块', 'tree-shaking、压缩、按规则切分 chunk（入口/异步/公共依赖）', '决定最终产出几个文件'],
  ['⑤ 输出与哈希', '生成 bundle 文件，文件名带内容哈希（如 main.a1b2c3.js）以利用长期缓存', '配合 HTML 注入 script 标签'],
];
for (const [stage, what, note] of pipeline) {
  console.log(`  ${stage}`);
  console.log(`      做什么：${what}`);
  console.log(`      要点：  ${note}`);
}
console.log();

console.log('  一个直觉性的理解：bundler 是"把模块图压平"的编译器。');
console.log('  它把 `import` 语句换成"变量引用"，把多个文件拼成一段作用域隔离的代码。');
console.log('  下面第 4 节的迷你 tree-shaker 就实现了其中的②④两步，跑一遍就懂了。');
console.log();

// ---------------------------------------------------------------------------
// 3. 主流工具的定位差异（离线讲解）
// ---------------------------------------------------------------------------
console.log('--- 3. rollup / webpack / vite / esbuild 的定位差异 ---');

const tools = [
  {
    name: 'rollup',
    tag: '库作者首选',
    strength: '产物体积最小、tree-shaking 最彻底、输出格式干净（ESM/CJS/UMD 都支持）',
    weakness: '开发期没有 dev server；HMR 需自行搭建；插件生态比 webpack 小',
    scene: '发布 npm 包（React、Vue、Svelte 自身的构建都用它）',
  },
  {
    name: 'webpack',
    tag: '老牌全能选手',
    strength: '功能最全、插件生态最大、loader 能处理任何资源、配置能力极强',
    weakness: '配置复杂（要理解 loader/plugin/tapable 钩子）、冷启动慢',
    scene: '大型企业应用、需要高度定制构建流程的历史项目',
  },
  {
    name: 'vite',
    tag: '现代应用默认选择',
    strength: '开发期用浏览器原生 ESM + 按需编译（启动几乎瞬时）；生产用 rollup 打包',
    weakness: '开发与生产的模块行为有细微差异（需注意"开发能跑生产报错"）',
    scene: '绝大多数新项目（Vue/React/Svelte 官方脚手架都是它）',
  },
  {
    name: 'esbuild',
    tag: '极致速度',
    strength: '用 Go 写成，比 JS 实现的打包器快 10~100 倍，只有单文件可执行程序',
    weakness: 'tree-shaking 与代码分割能力弱于 rollup，插件 API 有限',
    scene: '作为"转译+压缩"引擎嵌在别人体内（vite 开发期的依赖预构建就是 esbuild）',
  },
];
for (const t of tools) {
  console.log(`  【${t.name}】 ${t.tag}`);
  console.log(`    优势：${t.strength}`);
  console.log(`    短板：${t.weakness}`);
  console.log(`    典型场景：${t.scene}`);
  console.log();
}

// 顺带看一眼本仓库 node_modules 里实际存在哪些（它们是 vitest 带进来的传递依赖）
console.log('  本仓库 node_modules 里实际存在的构建相关工具（只读版本号，不 import）：');
const installed = ['rollup', 'vite', 'esbuild', 'webpack', 'typescript', '@babel/core', 'terser'];
for (const name of installed) {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', name, 'package.json'), 'utf8')).version;
    console.log(`    ${name.padEnd(14)} ${v}   ← 作为 vitest 的传递依赖被装上，仓库源码并不直接使用它`);
  } catch {
    console.log(`    ${name.padEnd(14)} （未安装）`);
  }
}
console.log();
console.log('  → 这正是"幽灵依赖"（phantom dependency）的活例子：');
console.log('    能用、能 require 到，但 package.json 里并没有声明它。');
console.log('    详见 07_lockfile_and_ci.js。');
console.log();

// ---------------------------------------------------------------------------
// 4. tree-shaking 的前提与迷你实现
// ---------------------------------------------------------------------------
console.log('--- 4. tree-shaking 的前提 ---');

const preconditions = [
  ['模块必须是 ESM', 'import/export 是静态语法，打包器能"读出来"用了什么', 'CJS 的 require() 可以写在 if 里、路径可以是变量 → 无法静态分析'],
  ['没有副作用污染', '模块顶层不能有"被引入就发生的事"，否则打包器不敢删', '顶层 console.log、修改全局、注册定时器都算副作用'],
  ['package.json 标记 sideEffects', '"sideEffects": false 告诉打包器"这个包里的模块删了也没关系"', '不标记时打包器只能保守处理，宁可不删'],
];
for (const [cond, why, counter] of preconditions) {
  console.log(`  【前提】${cond}`);
  console.log(`    为什么：${why}`);
  console.log(`    反例：  ${counter}`);
}
console.log();

console.log('  下面我们**自己实现一个迷你 tree-shaker**，把上面三条前提跑一遍看效果。');
console.log('  它只做两件事：解析 import/export 的静态结构 → 从入口做可达性分析。');
console.log();

/**
 * 极简 tree-shaker
 * ----------------------------------------------------------------------------
 * 只支持本示例用到的语法形态（每个顶层语句占一行），以便把重点放在算法思路上。
 * 真实打包器的解析用的是完整的 AST，但"可达性分析"这一步本质是一样的。
 *
 * @param {Record<string, string>} modules 模块路径 → 源码
 * @param {string} entry 入口模块路径
 * @returns {{ keptExports: Record<string, string[]>, output: string, report: string[] }}
 */
function treeShake(modules, entry) {
  const report = [];

  /** 解析一个模块：抽出它的导出表、导入表、以及"仅副作用导入" */
  function parse(source) {
    const exports = new Map(); // 导出名 → 源码行
    const imports = []; // { names: string[], from: string }
    const sideEffectImports = []; // 只为副作用而 import 的模块路径
    const topLevel = []; // 非 export 的顶层语句（可能有副作用）

    for (const line of source.split('\n')) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('//')) continue;

      // export function foo / export const foo / export class Foo
      let m = trimmed.match(/^export\s+(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/);
      if (m) {
        exports.set(m[1], trimmed);
        continue;
      }

      // import { a, b } from './x.js'
      m = trimmed.match(/^import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/);
      if (m) {
        imports.push({
          names: m[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()).filter(Boolean),
          from: m[2],
        });
        continue;
      }

      // import './polyfill.js'  ← 纯副作用导入，没有任何绑定
      m = trimmed.match(/^import\s*['"]([^'"]+)['"]/);
      if (m) {
        sideEffectImports.push(m[1]);
        continue;
      }

      topLevel.push(trimmed);
    }

    return { exports, imports, sideEffectImports, topLevel };
  }

  const parsed = Object.fromEntries(Object.entries(modules).map(([k, v]) => [k, parse(v)]));

  // 从入口开始做广度优先的可达性分析
  const usedNames = {}; // 模块 → 被用到的导出名集合
  const included = new Set(); // 被包含进来的模块
  const queue = [entry];
  included.add(entry);

  while (queue.length > 0) {
    const current = queue.shift();
    const mod = parsed[current];
    if (!mod) continue;
    usedNames[current] ??= new Set();

    for (const imp of mod.imports) {
      usedNames[imp.from] ??= new Set();
      for (const name of imp.names) usedNames[imp.from].add(name);
      if (!included.has(imp.from)) {
        included.add(imp.from);
        queue.push(imp.from);
      }
    }

    // 纯副作用导入：整个模块必须原样保留
    for (const from of mod.sideEffectImports) {
      if (!included.has(from)) {
        included.add(from);
        queue.push(from);
      }
      usedNames[from] ??= new Set();
      usedNames[from].add('*'); // 特殊标记：全部保留
    }
  }

  // 生成输出
  const keptExports = {};
  const outputLines = [];
  for (const modName of [...included].sort()) {
    const mod = parsed[modName];
    const keepAll = usedNames[modName]?.has('*');
    const keep = usedNames[modName] ?? new Set();
    const kept = [];

    for (const [name, line] of mod.exports) {
      if (keepAll || keep.has(name)) {
        kept.push(name);
        outputLines.push(line);
      }
    }
    // 顶层非导出语句（如 console.log）必须保留：它们可能有副作用
    for (const line of mod.topLevel) outputLines.push(line);

    keptExports[modName] = kept;
    report.push(
      `${modName}：导出共 ${mod.exports.size} 个（${[...mod.exports.keys()].join(', ')}），` +
        `保留 ${kept.length} 个（${kept.join(', ') || '无'}）`,
    );
  }

  return { keptExports, output: outputLines.join('\n'), report };
}

// --- 4.1 可摇的例子：ESM + 无副作用
console.log('  [4.1] 可摇的例子（ESM + 纯函数 + 无副作用）');
const SHAKABLE = {
  '/entry.js': [
    "import { add } from '/math.js';",
    "import { formatMoney } from '/format.js';",
    "console.log(add(1, 2));",
    "console.log(formatMoney(100));",
  ].join('\n'),
  '/math.js': [
    'export function add(a, b) { return a + b; }',
    'export function subtract(a, b) { return a - b; }',
    'export function multiply(a, b) { return a * b; }',
    'export function divide(a, b) { return a / b; }',
  ].join('\n'),
  '/format.js': [
    "export function formatMoney(n) { return '¥' + n.toFixed(2); }",
    "export function formatDate(d) { return d.toISOString().slice(0, 10); }",
    "export function formatPercent(n) { return (n * 100).toFixed(1) + '%'; }",
  ].join('\n'),
};

console.log('    模块图：entry.js 只用了 add 和 formatMoney');
console.log('    源码：');
for (const [name, src] of Object.entries(SHAKABLE)) {
  for (const line of src.split('\n')) console.log(`      ${name.padEnd(12)} | ${line}`);
}
console.log();

const shakableResult = treeShake(SHAKABLE, '/entry.js');
console.log('    分析结果：');
for (const line of shakableResult.report) console.log(`      ${line}`);
console.log();
console.log('    tree-shaking 后的产物：');
for (const line of shakableResult.output.split('\n')) console.log(`      ${line}`);
const totalExports = Object.values(SHAKABLE).reduce((n, s) => n + (s.match(/^export /gm) ?? []).length, 0);
const keptCount = Object.values(shakableResult.keptExports).reduce((n, arr) => n + arr.length, 0);
console.log();
console.log(`    原始导出 ${totalExports} 个 → 保留 ${keptCount} 个，摇掉 ${totalExports - keptCount} 个。`);
console.log('    → subtract / multiply / divide / formatDate / formatPercent 全部消失。');
console.log('      它们从来没被执行到，所以删掉**不改变任何行为**——这就是 tree-shaking 的本质。');
console.log();

// --- 4.2 摇不动的情况一：CommonJS
console.log('  [4.2] 摇不动的情况一：CommonJS + 动态属性访问');
const CJS_CASE = `// 打包器看到的是这样的代码：
const math = require('./math');
// 注意：属性名是变量，不是字面量
const result = math[operationName](1, 2);
`;
console.log('    代码：');
for (const line of CJS_CASE.split('\n')) if (line) console.log(`      ${line}`);
console.log('    → require() 是**运行时函数调用**，返回的是一个对象。');
console.log('      打包器无法知道 operationName 运行时是 "add" 还是 "multiply"，');
console.log('      只能保守地把 math 模块**整体**塞进产物。');
console.log('      同理，下面这些形态都会让 tree-shaking 失效：');
const shakeBreakers = [
  ['const m = require("./math")', 'CJS 没有静态导出结构'],
  ['import * as m from "./math"', '命名空间对象可能被动态访问'],
  ['obj[key] 动态属性访问', 'key 是变量 → 无法静态确定'],
  ['export default { add, multiply }', '默认导出是对象 → 整体不可分割'],
  ['顶层有副作用（console.log / 改全局）', '打包器不敢删，怕少了行为'],
  ['模块内 eval() / 动态 import(变量)', '代码内容是运行时才确定的'],
];
for (const [form, why] of shakeBreakers) {
  console.log(`        · ${form.padEnd(44)} ${why}`);
}
console.log();

// --- 4.3 摇不动的情况二：副作用
console.log('  [4.3] 摇不动的情况二：模块顶层有副作用');
const SIDE_EFFECT_CASE = {
  '/entry.js': ["import { helper } from '/side-effect.js';", 'console.log(helper());'].join('\n'),
  '/side-effect.js': [
    'export function helper() { return 1; }',
    "console.log('模块被加载时就会执行的副作用');",
  ].join('\n'),
};
console.log('    side-effect.js 里有一行顶层 console.log：');
for (const line of SIDE_EFFECT_CASE['/side-effect.js'].split('\n')) console.log(`      | ${line}`);
const seResult = treeShake(SIDE_EFFECT_CASE, '/entry.js');
console.log('    分析结果：');
for (const line of seResult.report) console.log(`      ${line}`);
console.log('    产物：');
for (const line of seResult.output.split('\n')) console.log(`      ${line}`);
console.log('    → 注意 helper 被保留了（因为被用到），而顶层那行 console.log **也必须保留**：');
console.log('      它不是"没用的代码"，删掉它就改变了程序行为。');
console.log('      这就是为什么打包器需要 sideEffects 字段——它只能靠**你**告诉它"安全"。');
console.log();

console.log('  sideEffects 字段的三种取值：');
const sideEffectValues = [
  ['（不写）', '保守假设"所有模块都有副作用"', '只做最基础的摇，效果差'],
  ['false', '所有模块都无副作用，没用到的整个文件都可以删', '纯工具库（lodash-es、date-fns）的标准配置'],
  ['["*.css", "*.global.js"]', '只有这些文件有副作用，其余都可以删', '应用项目里最常见的精确配置'],
];
for (const [value, meaning, effect] of sideEffectValues) {
  console.log(`    ${value.padEnd(26)} ${meaning.padEnd(40)} ${effect}`);
}
console.log();

// --- 4.4 循环依赖
console.log('  [4.4] 顺带一提：循环依赖');
console.log('    a.js import b.js，b.js 又 import a.js —— 打包器必须能处理这种情况。');
console.log('    ESM 的处理方式是"提升导出（hoisting）+ 暂时性死区"，');
console.log('    结果是：循环依赖里如果一方在模块顶层就使用另一方还没初始化的绑定，');
console.log('    会得到 ReferenceError 或 undefined，而且**取决于加载顺序**。');
console.log('    这也是为什么有些 bug "本地不复现、线上必现"——打包器的分块顺序变了。');
console.log();

// ---------------------------------------------------------------------------
// 5. 转译：把新语法改成旧语法
// ---------------------------------------------------------------------------
console.log('--- 5. 转译（transpiling） ---');

console.log('  转译要解决的核心问题："我写的语法，目标环境不认识。"');
console.log('  两件事必须同时确定，缺一不可：');
console.log('    1) 我用了哪些语法/API —— 由**代码**决定；');
console.log('    2) 目标环境支持到哪 —— 由 **target / browserslist** 决定。');
console.log('    只有两者取差集，才知道"需要转译什么"。');
console.log();

console.log('  target / browserslist 是什么：');
const targets = [
  ['browserslist（Babel / Autoprefixer / postcss 共用）', '写在 package.json 的 "browserslist" 字段或 .browserslistrc 里', '"> 0.5%, last 2 versions, not dead"'],
  ['esbuild 的 target', 'CLI 参数或配置项', 'target: ["chrome90", "firefox88", "node18"]'],
  ['TypeScript 的 target/lib', 'tsconfig.json', 'target: "ES2019"；lib 决定能用哪些内置类型'],
  ['Node 的 engines', 'package.json（见 01 文件）', '声明"我支持到哪个 Node"，但**不会自动转译**'],
];
for (const [where, how, sample] of targets) {
  console.log(`    ${where}`);
  console.log(`      配在哪：${how}`);
  console.log(`      长这样：${sample}`);
}
console.log();
console.log('    关键区别：target 决定"转译成什么"，engines 只是"声明支持谁"。');
console.log('    两者写得不一致（比如 target 是 ES5 但 engines 要求 Node 18），');
console.log('    就会产出又大又慢、还多了一堆无用 polyfill 的产物。');
console.log();

console.log('  Babel 与 TypeScript 的分工：');
const transpilers = [
  ['Babel', '@babel/core + 若干 preset / plugin', '只转语法，不做类型检查；插件式，能跟进最新提案', '需要兼容老浏览器、需要实验性语法'],
  ['TypeScript (tsc)', '编译器自带', '转语法 **+ 类型检查**，但只能转 TS 自己的语法，不能转提案', '项目本身用 TS'],
  ['SWC / esbuild', 'Rust / Go 实现', '速度极快，但插件能力弱，通常只做"降级 + 压缩"', '追求构建速度'],
];
console.log(`    ${'工具'.padEnd(18)} ${'形态'.padEnd(36)} ${'能力'.padEnd(52)} 适用场景`);
for (const [name, form, ability, scene] of transpilers) {
  console.log(`    ${name.padEnd(18)} ${form.padEnd(36)} ${ability.padEnd(52)} ${scene}`);
}
console.log();
console.log('  重要观念：**转译语法 ≠ 补齐 API**。');
console.log('    Babel 能把 `a?.b` 改写成 `a === null || a === void 0 ? void 0 : a.b`，');
console.log('    但它**不会**给你补 Array.prototype.flat、Promise.allSettled 这些内置方法。');
console.log('    那些要靠 polyfill（core-js / es-shims）。而 polyfill 会增大体积，');
console.log('    所以"少用 polyfill，多用新语法"通常是更划算的取舍。');
console.log();

// ---------------------------------------------------------------------------
// 6. 实测：当前引擎支持哪些语法
// ---------------------------------------------------------------------------
console.log('--- 6. 实测：当前引擎的语法支持情况 ---');

// 用 new Function 编译一段代码：能编译通过说明当前引擎认识这个语法。
// 注意这是**语法**探测，不是 API 探测——API 要用 typeof 判断。
// 另外 new Function 创建的是普通函数而非模块，所以顶层 await 这类
// 模块专属语法**测不了**，这是这种探测方法的局限。
const syntaxProbes = [
  ['可选链 a?.b', () => new Function('a', 'return a?.b;')],
  ['空值合并 a ?? b', () => new Function('a', 'return a ?? b;')],
  ['逻辑赋值 a ??= 1', () => new Function('a', 'a ??= 1; return a;')],
  ['类私有字段 #x', () => new Function('class A { #x = 1; get() { return this.#x; } } return A;')],
  ['类静态初始化块', () => new Function('class A { static { this.x = 1; } } return A;')],
  ['正则 d 标志（匹配索引）', () => new Function('return /a/d;')],
  ['数字分隔符 1_000_000', () => new Function('return 1_000_000;')],
  ['顶层 await', () => new Function('await 1;')],
];

console.log(`  ${'语法'.padEnd(28)} ${'本机结果'.padEnd(10)} 说明`);
for (const [name, probe] of syntaxProbes) {
  let ok = true;
  let errMsg = '';
  try {
    probe();
  } catch (err) {
    ok = false;
    errMsg = err.message;
  }
  const note = ok
    ? '本机引擎直接支持，target 若也是现代环境就无需转译'
    : name === '顶层 await'
      ? 'new Function 造的不是模块，测不了模块级语法（探测方法的局限）'
      : errMsg;
  console.log(`  ${name.padEnd(28)} ${(ok ? '支持' : '不支持').padEnd(10)} ${note}`);
}
console.log();

console.log('  API（不是语法）的探测方式要用 typeof：');
const apiProbes = [
  ['Array.prototype.findLast', () => typeof [].findLast === 'function'],
  ['Object.hasOwn', () => typeof Object.hasOwn === 'function'],
  ['Promise.allSettled', () => typeof Promise.allSettled === 'function'],
  ['structuredClone', () => typeof structuredClone === 'function'],
  ['Array.prototype.group', () => typeof [].group === 'function'],
  ['RegExp.escape（很新的提案）', () => typeof RegExp.escape === 'function'],
];
for (const [name, probe] of apiProbes) {
  console.log(`    ${name.padEnd(30)} ${probe() ? '本机可用' : '本机不可用 → 需要 polyfill'}`);
}
console.log();
console.log('  实践要点：**是否转译取决于你的目标用户**，而不是取决于"新语法酷不酷"。');
console.log('    · 面向企业内网 Chrome（可强制升级）→ target 可以很新，几乎不用转译；');
console.log('    · 面向公众网站（可能有人用几年前的手机）→ 保守 target + polyfill；');
console.log('    · 面向 Node 后端 → 只需要保证"engines 里的最低 Node 版本"能跑，');
console.log('      通常**完全不需要转译**，连打包都不需要。');
console.log();

// ---------------------------------------------------------------------------
// 7. 什么时候不需要打包
// ---------------------------------------------------------------------------
console.log('--- 7. 什么时候**不需要**打包 ---');

const noBundle = [
  ['Node.js 后端服务', '不需要减少请求数；Node 原生支持 ESM 和解析 node_modules', '仍然可能用 tsc / swc 做 TS 转译'],
  ['面向现代浏览器的内部工具', '用 import maps 或直接相对路径 import，浏览器原生 ESM 够用', '见 27_web_apis 里关于浏览器的示例'],
  ['CLI 工具 / 脚本', '用户装到本地就有完整 node_modules，没有网络加载成本', 'chalk / commander 这类包直接用就行'],
  ['npm 库的源码仓库', '发布时产出 ESM + CJS 双格式即可，不需要打进一个 bundle', '但库作者**必须**发布可被摇的形态（ESM + sideEffects: false）'],
  ['学习与原型阶段', '构建配置本身就是负担，先跑起来再说', '本仓库就是这类：只用 node 直接跑 .js'],
];
console.log(`  ${'场景'.padEnd(28)} ${'为什么不打包'.padEnd(44)} 备注`);
for (const [scene, why, note] of noBundle) {
  console.log(`  ${scene.padEnd(28)} ${why.padEnd(44)} ${note}`);
}
console.log();

console.log('  判断的口诀：');
console.log('    **"产物要在别人的浏览器里跑吗？"**');
console.log('      要 → 大概率需要打包（请求瀑布 + 裸模块名 + CJS 三个问题都得解决）。');
console.log('      不要 → 先别急着上 bundler，收益可能是负的（构建时间 + 配置复杂度 + 调试难度）。');
console.log();

// ---------------------------------------------------------------------------
// 8. 一张决策图
// ---------------------------------------------------------------------------
console.log('--- 8. 该不该打包：决策清单 ---');

const decision = [
  ['产物跑在浏览器里？', '是 → 继续第 2 问；否 → **不需要打包**'],
  ['需要支持 IE 或 5 年前的老浏览器？', '是 → 需要转译（target 设低 + polyfill）；否 → 可以 target 很新'],
  ['用户里有慢网络/移动端？', '是 → 打包 + 代码分割收益明显；否 → 打包收益一般，但仍推荐'],
  ['用了 TS / JSX / Vue SFC？', '是 → 必须有构建步骤（至少是转译）；否 → 可以考虑不构建'],
  ['要发布 npm 包？', '是 → 用 rollup 产出 ESM+CJS 双格式，别打进一个 umd；否 → 应用项目用 vite 即可'],
];
for (const [q, a] of decision) {
  console.log(`  Q: ${q}`);
  console.log(`     A: ${a}`);
}
console.log();

console.log('小结：打包解决"文件怎么组合"，转译解决"语法要不要降级"。');
console.log('      两者都是**为目标环境服务的工程手段**，不是"现代项目必须有的仪式"。');
console.log('      先问目标环境，再决定要不要引入它们。');
