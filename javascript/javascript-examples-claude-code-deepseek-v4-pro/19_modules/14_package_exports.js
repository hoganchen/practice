/**
 * ============================================================================
 * 知识点：package.json 的 exports 字段 —— 子路径导出与条件导出
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】高级
 * 【前置知识】19_modules/01_named_exports.js、19_modules/09_dynamic_import.js、
 *             19_modules/13_json_import.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "exports" 是 package.json 里的一个字段，它**定义了一个包对外暴露的入口清单**。
 *    在没有它之前，包只有 "main" 一个入口，包内任何文件都能被外面 require 到；
 *    有了它之后，包变成"**封闭**"的：只有 exports 里列出的路径才可解析，其余一律
 *    报错 ERR_PACKAGE_PATH_NOT_EXPORTED。
 *    它同时支持两个维度的映射：
 *      (1) 子路径导出（subpath exports）："."、"./feature/alpha" 映射到包内的具体文件；
 *      (2) 条件导出（conditional exports）：同一个子路径，按 "import" / "require" /
 *          "types" / "default" 等条件映射到不同文件（例如 ESM 一份、CJS 一份）。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 封装边界：以前 `require('lodash/internal/foo/bar')` 这类"深挖内部文件"的写法
 *        把库的内部结构变成了事实上的公开 API，作者一重构就集体炸锅。
 *        exports 让包作者能明确宣布"哪些是公开 API"。
 *    (2) 双格式发布：同一个包既要给 ESM 用户用，又要给 CJS 用户用，
 *        靠条件导出可以把 `import` 指向 .mjs、`require` 指向 .cjs，
 *        而且**只暴露这两个入口**，不去碰臭名昭著的"双包危险"（dual package hazard）
 *        以外的内部文件。
 *      (3) 类型声明：`"types"` 条件让 TypeScript 在不同解析模式下拿到对应的 .d.ts。
 *
 * 3. 核心语法要点
 *    (1) `"./sub": "./src/sub.js"` —— 精确子路径映射（注意必须以 "./" 开头）。
 *    (2) `"./feature/*": "./src/features/*.js"` —— 子路径模式，`*` 会被替换。
 *    (3) 条件对象 `{ "import": ..., "require": ..., "types": ..., "default": ... }`
 *        —— **从上到下逐个匹配，第一个匹配上的条件生效**，所以顺序即优先级，
 *        `"default"` 必须放在最后当兜底。
 *    (4) `"exports"` 存在时，`"main"` 只对**不支持 exports 的老工具**起作用，
 *        Node 自己完全忽略它。
 *    (5) 包根目录的 `"type": "module"` 决定该包内 `.js` 文件按 ESM 还是 CJS 解析；
 *        exports 只决定"解析到哪个文件"，不决定"这个文件怎么解析"。
 *
 * 4. 常见陷阱
 *    (1) **"本地明明能 require，发布后就不行"**：本地用相对路径 `./src/foo.js`
 *        当然没有任何限制；一旦变成包名 `mypkg/src/foo.js`，exports 就会把它挡下来。
 *    (2) 忘记把 `./package.json` 写进 exports —— 很多工具（打包器、版本检查）会
 *        尝试读它，然后拿到 ERR_PACKAGE_PATH_NOT_EXPORTED。
 *    (3) 条件顺序写反：把 `"default"` 写在 `"import"` 前面，import 永远拿不到 ESM 版本。
 *    (4) `"exports"` 与 `"main"` 同时存在且指向不同文件，导致老工具与新 Node 行为不一致。
 *    (5) 子路径键必须写全（或使用 `*` 模式），`"./feature/"` 这种"目录式"写法是无效的。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/14_package_exports.js
 *
 * 【预期输出】
 *   本文件**不会修改仓库的 package.json**。它会在系统临时目录下用 mkdtemp 现场搭出
 *   4 个演示包（各自带 package.json 与源文件），再启动一个子 Node 进程去解析这些包名，
 *   分别打印"成功解析到的文件"与"被 exports 拦下时的错误码"，最后删除临时目录。
 * ============================================================================
 */

import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

// ---------------------------------------------------------------------------
// 1. 为什么"本地能跑、发布后不行" —— 封闭性
// ---------------------------------------------------------------------------

console.log('--- 1. exports 的封闭性：这是新手最大的困惑来源 ---');
console.log('没有 exports 字段时：');
console.log('  require("some-pkg/src/internal/helper.js")  ->  能解析（包内任何文件都可达）');
console.log('  包作者一重构目录，所有这么写的人都炸了 —— 这就是 exports 要解决的问题。');
console.log('声明了 exports 字段后：');
console.log('  只有 exports 里列出的路径可解析，其余一律 ERR_PACKAGE_PATH_NOT_EXPORTED。');
console.log('  注意：报错原因是"没被导出"，而不是"文件不存在" —— 文件可能就在那儿。');
console.log('');
console.log('下面的实验会在临时目录里搭出真实的包，然后让 Node 亲自去解析它们。');

// ---------------------------------------------------------------------------
// 2. 在系统临时目录里搭出演示包
// ---------------------------------------------------------------------------
// 关键约定：绝不写进仓库目录。os.tmpdir() + mkdtemp 会给出一个进程独占的随机目录，
// 最后在 finally 里整棵删除。
// 目录结构（<tmp> 即临时根目录）：
//   <tmp>/package.json            <- 根，type: module（让 consumer.mjs 按 ESM 解析）
//   <tmp>/consumer.mjs            <- 子进程入口，所有裸包名解析都发生在它里面
//   <tmp>/node_modules/demo-pkg/  <- 演示包：条件导出 + 子路径模式 + 封闭性
//   <tmp>/node_modules/open-pkg/  <- 对照组：只有 main、没有 exports（不封闭）
//   <tmp>/node_modules/order-demo/   <- 条件顺序演示：default 写在 import 前面
//   <tmp>/node_modules/order-fixed/  <- 条件顺序演示：import 写在 default 前面

const tmpRoot = await mkdtemp(path.join(tmpdir(), 'js-exports-demo-'));

/**
 * 在临时目录里写一个文件（自动创建父目录）。
 * @param {string} rel 相对于临时根目录的路径
 * @param {string|object} body 字符串原样写入；对象则 JSON.stringify 后写入
 * @returns {Promise<string>} 绝对路径
 */
async function put(rel, body) {
  const full = path.join(tmpRoot, rel);
  await mkdir(path.dirname(full), { recursive: true });
  const text = typeof body === 'string' ? body : JSON.stringify(body, null, 2) + '\n';
  await writeFile(full, text, 'utf8');
  return full;
}

console.log('\n--- 2. 在临时目录里搭建演示包 ---');
console.log('临时根目录：', tmpRoot);

// (1) 临时根目录自己的 package.json —— 让 consumer.mjs 以 ESM 解析
await put('package.json', { name: 'exports-demo-root', private: true, type: 'module' });

// (2) demo-pkg —— 主角：同时演示条件导出、子路径模式、封闭性
//     注意 "main" 故意指向一个**没有被 exports 列出**的文件，
//     用来证明"有 exports 时 main 会被忽略"。
await put('node_modules/demo-pkg/package.json', {
  name: 'demo-pkg',
  version: '1.0.0',
  type: 'module',
  main: './src/legacy-entry.js',
  exports: {
    // "." 表示"包名本身"这个入口
    '.': {
      // 条件的顺序就是优先级：types -> import -> require -> default
      types: './types/index.d.ts',
      import: './src/esm/index.mjs',
      require: './src/cjs/index.cjs',
      default: './src/esm/index.mjs',
    },
    // 子路径模式：请求 ./feature/alpha 会替换掉 * 得到 ./src/features/alpha.js
    './feature/*': './src/features/*.js',
    // 显式把 package.json 也导出，否则工具读不到它
    './package.json': './package.json',
  },
});

// 每个被导入的模块都导出一个 MARK 常量，用来标识"到底是哪个文件被加载了"。
await put('node_modules/demo-pkg/src/esm/index.mjs', "export const MARK = 'demo-pkg/src/esm/index.mjs (import 条件)';\n");
await put('node_modules/demo-pkg/src/cjs/index.cjs', "module.exports = { MARK: 'demo-pkg/src/cjs/index.cjs (require 条件)' };\n");
await put('node_modules/demo-pkg/src/features/alpha.js', "export const MARK = 'demo-pkg/src/features/alpha.js';\n");
await put('node_modules/demo-pkg/src/features/beta.js', "export const MARK = 'demo-pkg/src/features/beta.js';\n");
// 下面两个文件**真实存在但不在 exports 里**，是"封闭性"的实验材料。
await put('node_modules/demo-pkg/src/secret.js', "export const MARK = 'demo-pkg/src/secret.js (本不该被外部访问)';\n");
await put('node_modules/demo-pkg/src/legacy-entry.js', "export const MARK = 'demo-pkg/src/legacy-entry.js (main 指向它，但 exports 没列出)';\n");
await put('node_modules/demo-pkg/types/index.d.ts', 'export declare const MARK: string;\n');

// (3) open-pkg —— 对照组：没有 exports，深层文件随便进
await put('node_modules/open-pkg/package.json', { name: 'open-pkg', version: '1.0.0', type: 'module', main: './index.js' });
await put('node_modules/open-pkg/index.js', "export const MARK = 'open-pkg/index.js';\n");
await put('node_modules/open-pkg/src/deep.js', "export const MARK = 'open-pkg/src/deep.js (无 exports，深层文件可达)';\n");

// (4) 条件顺序演示：两个包内容一样，只有 exports 里键的书写顺序不同
await put('node_modules/order-demo/package.json', {
  name: 'order-demo',
  version: '1.0.0',
  type: 'module',
  exports: { '.': { default: './src/plain.js', import: './src/special.js' } },
});
await put('node_modules/order-demo/src/plain.js', "export const MARK = 'order-demo/src/plain.js (default 写在前面 -> 先匹配到它)';\n");
await put('node_modules/order-demo/src/special.js', "export const MARK = 'order-demo/src/special.js (import 写在后面 -> 永远轮不到)';\n");

await put('node_modules/order-fixed/package.json', {
  name: 'order-fixed',
  version: '1.0.0',
  type: 'module',
  exports: { '.': { import: './src/special.js', default: './src/plain.js' } },
});
await put('node_modules/order-fixed/src/plain.js', "export const MARK = 'order-fixed/src/plain.js (兜底)';\n");
await put('node_modules/order-fixed/src/special.js', "export const MARK = 'order-fixed/src/special.js (import 写在前面 -> 正确命中)';\n");

console.log('已写入 4 个演示包。');

// ---------------------------------------------------------------------------
// 3. 生成子进程探针，并运行它
// ---------------------------------------------------------------------------
// 为什么必须开子进程？
//   包名解析是相对于"发起解析的那个文件"进行的。本文件位于仓库里，
//   所以 `import('demo-pkg')` 只会去仓库的 node_modules 里找，找不到临时包。
//   把探针文件写进临时目录再运行，Node 就会从临时目录向上找 node_modules。
// 探针把每条结果打成一行 "RESULT {json}"，父进程解析后排版输出。

const importProbes = [
  'demo-pkg', // 根入口，走 import 条件
  'demo-pkg/feature/alpha', // 子路径模式
  'demo-pkg/feature/beta', // 同一个模式，另一个文件
  'demo-pkg/secret', // 不在 exports 里（且文件也不在 src/secret.js）
  'demo-pkg/src/secret.js', // 文件真实存在，但不在 exports 里 -> 被拦
  'demo-pkg/src/legacy-entry.js', // main 指向它，但 main 被 exports 忽略 -> 被拦
  'open-pkg/src/deep.js', // 无 exports 的对照组 -> 放行
  'order-demo', // default 写在 import 前面
  'order-fixed', // import 写在前面
];

const requireProbes = [
  'demo-pkg', // 同一入口，走 require 条件 -> 拿到不同的文件
  'demo-pkg/pkg-version-probe', // 不存在的路径，看错误码
  'demo-pkg/package.json', // 显式导出的 package.json
  'demo-pkg/src/secret.js', // 同上，CJS 侧同样被拦
  'order-fixed', // require 时 import 条件不匹配，落到 default
];

const consumerSrc = `// 由 19_modules/14_package_exports.js 生成，位于临时目录中。
// 这里所有裸包名都相对于本文件解析，因此能找到同级的 node_modules。
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const IMPORTS = ${JSON.stringify(importProbes)};
const REQUIRES = ${JSON.stringify(requireProbes)};

function markOf(value) {
  if (value === null || value === undefined) return '(空)';
  if (typeof value === 'string') return value;
  if (typeof value.MARK === 'string') return value.MARK;
  if (value.default && typeof value.default.MARK === 'string') return value.default.MARK;
  if (typeof value.name === 'string' && typeof value.version === 'string') return value.name + '@' + value.version;
  if (typeof value.default === 'string') return value.default;
  return '(没有 MARK 导出)';
}

function brief(err) {
  return String(err && err.message ? err.message : err).split(/\\r?\\n/)[0];
}

async function probeImport(spec) {
  try {
    const ns = await import(spec);
    return { spec, via: 'import', ok: true, mark: markOf(ns) };
  } catch (err) {
    return { spec, via: 'import', ok: false, code: err.code || err.name, message: brief(err) };
  }
}

function probeRequire(spec) {
  try {
    return { spec, via: 'require', ok: true, mark: markOf(require(spec)) };
  } catch (err) {
    return { spec, via: 'require', ok: false, code: err.code || err.name, message: brief(err) };
  }
}

const results = [];
for (const spec of IMPORTS) results.push(await probeImport(spec));
for (const spec of REQUIRES) results.push(probeRequire(spec));

for (const r of results) console.log('RESULT ' + JSON.stringify(r));
`;

const consumerPath = await put('consumer.mjs', consumerSrc);

/**
 * 把 Node 的长错误信息压短，去掉临时目录的绝对路径，只留下有信息量的部分。
 * @param {string} message 原始错误信息
 * @returns {string} 压缩后的一行
 */
function shorten(message) {
  const cleaned = String(message).split(tmpRoot).join('').replace(/\\/g, '/');
  return cleaned.length > 120 ? cleaned.slice(0, 117) + '...' : cleaned;
}

/**
 * 解析探针输出的一行。
 * @param {object} r 探针结果对象
 * @returns {string} 人类可读的一行说明
 */
function render(r) {
  const via = r.via === 'import' ? 'await import' : 'require    ';
  if (r.ok) return `✅ ${via}(${r.spec})  ->  ${r.mark}`;
  return `❌ ${via}(${r.spec})  ->  [${r.code}] ${shorten(r.message)}`;
}

console.log('\n--- 3. 启动子进程解析这些包名（真实解析，不是模拟） ---');
console.log('探针文件：', path.relative(tmpRoot, consumerPath));
const child = spawnSync(process.execPath, [consumerPath], { cwd: tmpRoot, encoding: 'utf8' });
if (child.error) throw child.error;

const lines = String(child.stdout || '')
  .split(/\r?\n/)
  .filter((l) => l.startsWith('RESULT '))
  .map((l) => JSON.parse(l.slice('RESULT '.length)));

if (child.stderr && child.stderr.trim()) {
  console.log('子进程 stderr：', child.stderr.trim());
}
console.log(`子进程退出码 = ${child.status}，共 ${lines.length} 条解析结果。`);

const byVia = (via) => lines.filter((r) => r.via === via);

console.log('\n--- 4. 子路径导出与封闭性（import 侧） ---');
for (const r of byVia('import').slice(0, 6)) console.log('  ' + render(r));

console.log('\n--- 5. 条件导出：同一个包，import 与 require 拿到不同的文件 ---');
console.log('  包根 "." 的 exports 是 { types, import, require, default }，');
console.log('  解析方式不同 -> 命中的条件不同 -> 加载的文件不同：');
for (const r of lines.filter((x) => x.spec === 'demo-pkg')) console.log('  ' + render(r));

console.log('\n--- 6. 对照组：没有 exports 的包不封闭 ---');
for (const r of lines.filter((x) => x.spec.startsWith('open-pkg'))) console.log('  ' + render(r));
console.log('  结论：exports 的封闭性是"包作者主动声明"的，不是 Node 的默认行为。');

console.log('\n--- 7. 条件匹配顺序：从上到下，先匹配先用 ---');
for (const r of lines.filter((x) => x.spec.startsWith('order-'))) console.log('  ' + render(r));
console.log('  order-demo 的 exports = { default: ..., import: ... } —— default 在前，先命中，');
console.log('  于是 import 分支被"提前截胡"，哪怕发起方确实是 import 也一样。这就是顺序即优先级。');

console.log('\n--- 8. 错误码细节：为什么说它"不是文件不存在" ---');
const notExported = lines.find((r) => !r.ok && r.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED');
if (notExported) {
  console.log('  错误码：', notExported.code);
  console.log('  错误信息：', shorten(notExported.message));
  console.log('  这句话的关键是 "is not exported"（没被导出），而不是 "no such file"（文件不存在）。');
}
const missing = lines.find((r) => !r.ok && r.spec === 'demo-pkg/pkg-version-probe');
if (missing) {
  console.log('  对比：请求一个 exports 里根本没有的路径 ->', `[${missing.code}]`, shorten(missing.message));
  console.log('  可以看到：无论文件在不在，只要没写进 exports，错误码都是一样的。');
}

// ---------------------------------------------------------------------------
// 9. 把规则固化成代码：一个手写的 exports 解析器
// ---------------------------------------------------------------------------
// 上面是"让 Node 亲自解析"，下面把同一套规则用几十行代码复刻一遍。
// 好处是规则变得完全透明：你能一眼看出优先级、模式替换、封闭性各发生在哪一步。
// 注意：这是一个**教学用的模拟实现**，省略了 URL 转义、数组形式、
// "imports" 字段（# 开头的内部映射）、嵌套条件等细节，绝不能用于生产。

console.log('\n--- 9. 规则速查：手写一个 exports 解析器（模拟实现） ---');

/**
 * 模拟 Node 的 exports 解析。
 * @param {object} exportsField package.json 里的 exports 字段
 * @param {string} request 请求的子路径：'.' 表示包根，'./feature/alpha' 表示子路径
 * @param {string} condition 当前生效的条件，通常为 'import' 或 'require'
 * @returns {string} 解析到的包内相对路径
 * @throws {Error} 未命中任何导出时抛出，错误码同 Node
 */
function resolveExports(exportsField, request, condition) {
  // 第 1 步：取出该请求对应的映射（字符串或条件对象）
  let target = exportsField[request];

  if (target === undefined && request !== '.') {
    // 第 2 步：尝试子路径模式匹配，如 './feature/*' 配 './src/features/*.js'
    for (const key of Object.keys(exportsField)) {
      const star = key.indexOf('*');
      if (star === -1) continue;
      const prefix = key.slice(0, star);
      const suffix = key.slice(star + 1);
      if (request.startsWith(prefix) && request.endsWith(suffix) && request.length >= prefix.length + suffix.length) {
        const matched = request.slice(prefix.length, request.length - suffix.length);
        const pattern = exportsField[key];
        target = pattern.replaceAll('*', matched); // 模式里的 * 全部替换为匹配到的片段
        break;
      }
    }
  }

  if (target === undefined) {
    const err = new Error(`Package subpath '${request}' is not defined by "exports"`);
    err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
    throw err;
  }

  // 第 3 步：条件对象 —— 按书写顺序遍历，第一个命中的即最终结果
  if (target !== null && typeof target === 'object') {
    for (const key of Object.keys(target)) {
      if (key === 'default' || key === condition) return target[key];
    }
    const err = new Error(`No matching condition for '${request}' (condition=${condition})`);
    err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';
    throw err;
  }

  return target;
}

// 演示用的 exports 配置，与 demo-pkg 一致
const demoExports = {
  '.': { types: './types/index.d.ts', import: './src/esm/index.mjs', require: './src/cjs/index.cjs', default: './src/esm/index.mjs' },
  './feature/*': './src/features/*.js',
  './package.json': './package.json',
};

const resolverCases = [
  ['.', 'import'],
  ['.', 'require'],
  ['./feature/alpha', 'import'],
  ['./feature/beta', 'require'],
  ['./package.json', 'import'],
  ['./secret', 'import'], // 未导出 -> 抛错
  ['./src/secret.js', 'import'], // 未导出（"本地能跑，发布后不行"的元凶）-> 抛错
];

for (const [request, condition] of resolverCases) {
  try {
    console.log(`  resolveExports(${JSON.stringify(request)}, '${condition}') -> ${resolveExports(demoExports, request, condition)}`);
  } catch (err) {
    console.log(`  resolveExports(${JSON.stringify(request)}, '${condition}') -> [${err.code}] ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 10. 与 "type" / "main" 的关系
// ---------------------------------------------------------------------------

console.log('\n--- 10. exports 与 "type"、"main" 的分工 ---');
console.log('三者管的事完全不同，别混为一谈：');
console.log('  "exports"：决定"包名能解析到哪些文件"（路径解析层，本文件讲的就是它）');
console.log('  "type"   ：决定"包内的 .js 文件按 ESM 还是 CJS 解析"（语法解析层）');
console.log('             "type": "module" -> .js 当 ESM；缺省或 "commonjs" -> .js 当 CJS；');
console.log('             .mjs 永远是 ESM，.cjs 永远是 CJS，不受 type 影响。');
console.log('  "main"   ：exports 出现之前的老入口字段。有 exports 时 Node 完全忽略它，');
console.log('             只有不支持 exports 的老工具才回退到 main。');
console.log('  证据就在上面的实验里：demo-pkg 的 main 指向 ./src/legacy-entry.js，');
console.log('  但请求 demo-pkg/src/legacy-entry.js 依然被 ERR_PACKAGE_PATH_NOT_EXPORTED 拦下。');

console.log('\n--- 11. 检查清单 ---');
const checklist = [
  ['把 exports 当成"公开 API 清单"来写', '没列出的路径就是私有的'],
  ['"./package.json": "./package.json" 别忘', '大量工具依赖读取它'],
  ['条件顺序 = 优先级', '"default" 永远放最后'],
  ['"types" 放最前', 'TypeScript 按顺序挑第一个认得的条件'],
  ['子路径键必须以 "./" 开头', '"./feature/*" 而不是 "feature/*"'],
  ['目录式写法无效', '"./feature/" 不会匹配 "./feature/alpha"'],
  ['"main" 与 "exports" 保持指向一致', '否则新老工具行为分裂'],
  ['本地相对路径不受影响', '封闭性只在"通过包名解析"时生效'],
];
for (const [tip, why] of checklist) {
  console.log(`  ${tip.padEnd(38)} -> ${why}`);
}

// ---------------------------------------------------------------------------
// 12. 清理临时目录
// ---------------------------------------------------------------------------
// 放在 finally 里只是示意；本文件的语句是线性的，直接删除即可。
// 真实项目里凡是"创建了临时资源"的代码，都应该用 try/finally 兜底。
console.log('\n--- 12. 清理临时目录 ---');
try {
  await rm(tmpRoot, { recursive: true, force: true });
  console.log('已删除：', tmpRoot);
} finally {
  console.log('仓库的 package.json 自始至终没有被修改过。');
}
