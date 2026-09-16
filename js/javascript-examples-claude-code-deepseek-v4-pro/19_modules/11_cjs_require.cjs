/**
 * ============================================================================
 * 知识点：CommonJS 的 require / module.exports / exports 三者关系与陷阱
 * ============================================================================
 *
 * 【所属分类】19_modules —— 模块化（ESM / CommonJS）
 * 【难度等级】进阶
 * 【前置知识】19_modules/01_named_exports.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    CommonJS（简称 CJS）是 Node.js 最早、也是至今仍在大量使用的模块规范。
 *    它没有 export / import 关键字，而是靠三个"注入"的变量工作：
 *      require(id)      加载一个模块，返回它的 module.exports
 *      module.exports   本模块对外导出的东西（默认是空对象 {}）
 *      exports          指向 module.exports 的初始别名
 *    本文件扩展名是 .cjs，因为 package.json 里设置了 "type": "module"，
 *    .js 会被当成 ESM 解析；写 CommonJS 必须显式用 .cjs。
 *
 * 2. 为什么需要
 *    (1) 历史：Node 诞生时（2009）还没有 ESM，CJS 是被设计出来的服务端模块方案。
 *    (2) 生态：npm 上仍有海量 CJS 包，读懂它才能排查 require 相关的问题。
 *    (3) 特点：require 是同步的、运行时执行的函数调用 —— 可以写条件加载、
 *        可以拼路径、可以在函数里调用，这是静态 import 做不到的。
 *    (4) 它的"缓存"机制让模块天然是单例。
 *
 * 3. 核心语法要点
 *    Node 在加载一个 CJS 文件时，会把文件内容包进一个函数里执行：
 *      (function (exports, require, module, __filename, __dirname) { ...你的代码... })
 *    因此：
 *      (1) __filename / __dirname 随处可用（它们是包装函数的参数）。
 *      (2) 顶层 this === module.exports（普通函数调用时 this 是 undefined，
 *          但 Node 用 .call(module.exports, ...) 调用包装函数）。
 *      (3) 顶层声明的 var/let/const 是包装函数内的局部变量，不污染全局。
 *      (4) require 返回的是 module.exports 的值；同一个路径第二次 require
 *          直接返回缓存对象，模块体不会重新执行。
 *
 * 4. 常见陷阱（本文件会实测前两条）
 *    (1) 给 exports 整体赋值：`exports = { a: 1 }` 只是把局部变量指向了新对象，
 *        module.exports 还是原来的空对象，外部 require 到的是 {}。
 *        正确写法是 `module.exports = { a: 1 }` 或 `exports.a = 1`。
 *    (2) 混用 module.exports = {...} 之后再写 exports.x = 1：
 *        此时 exports 已经和 module.exports 脱钩，exports.x 挂在旧对象上，
 *        外部看不到。（要么一路用 module.exports，要么一路用 exports。）
 *    (3) 解构 require 的结果会拿到"值快照"，不像 ESM 那样是实时绑定。
 *    (4) CJS 不支持顶层 await（会直接 SyntaxError），也不存在 import.meta。
 *    (5) require 的路径解析规则很宽松（自动补 .js、找 index.js、找 node_modules），
 *        容易误加载到同名的第三方包。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/11_cjs_require.cjs
 *
 * 【预期输出】
 *   打印 CommonJS 的导出对象、模块包装变量、exports 陷阱的实测结果、
 *   require 缓存行为，以及在 CJS 里加载 ESM 模块的兼容情况。
 * ============================================================================
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// ---------------------------------------------------------------------------
// 1. require 的基本用法
// ---------------------------------------------------------------------------

// require 的路径相对于**本文件**解析，写法上可以省略扩展名（.js/.cjs/.json/.node）。
// 这里为了明确，写全了 .cjs。
const legacy = require('./_legacy-lib.cjs');

console.log('--- 1. require 一个 CommonJS 模块 ---');
console.log('typeof legacy =', typeof legacy);
console.log('legacy 的键：', Object.keys(legacy).join(', '));
console.log('legacy.toolName =', legacy.toolName);
console.log('legacy.legacyAdd(2, 3) =', legacy.legacyAdd(2, 3));

// 内置模块直接写名字（也可以写 node: 前缀，更明确且不会和第三方包同名）
const pathAgain = require('node:path');
console.log('require("node:path") === require("path") ?', pathAgain === path);

// ---------------------------------------------------------------------------
// 2. CommonJS 里被注入的五个"魔法"变量
// ---------------------------------------------------------------------------

console.log('\n--- 2. CJS 模块包装函数注入的变量 ---');
console.log('__filename =', __filename);
console.log('__dirname  =', __dirname);
console.log('typeof module  =', typeof module);
console.log('typeof exports =', typeof exports);
console.log('typeof require =', typeof require);

// 顶层 this 就是 module.exports（Node 用 module.exports 作为 this 调用包装函数）
console.log('顶层 this === module.exports ?', this === module.exports);
console.log('顶层 this === globalThis ?', this === globalThis);

// 顶层声明的变量是包装函数里的局部变量，不会变成全局
const cjsLocalVar = '我是 CJS 模块里的局部变量';
console.log('globalThis.cjsLocalVar =', globalThis.cjsLocalVar, '（没污染全局）');

// ---------------------------------------------------------------------------
// 3. module.exports 与 exports 的关系
// ---------------------------------------------------------------------------

// 进入模块时 Node 执行了：exports = module.exports = {}
// 所以初始状态两者指向同一个对象，此时给谁挂属性都一样。
console.log('\n--- 3. module.exports 与 exports 的关系 ---');
console.log('exports === module.exports ?', exports === module.exports);
console.log('（初始时它们指向同一个空对象）');

// 本文件自己也是个模块，可以看看自己导出了什么
exports.demoName = '11_cjs_require.cjs';
exports.demoPurpose = '演示 CommonJS 的导出机制';
console.log('挂到 exports 上之后：');
console.log('  Object.keys(module.exports) =', Object.keys(module.exports).join(', '));
console.log('  因为 exports 与 module.exports 是同一个对象，所以两边都看得到');

// ---------------------------------------------------------------------------
// 4. 陷阱一：给 exports 整体赋值无效
// ---------------------------------------------------------------------------

console.log('\n--- 4. 陷阱：给 exports 整体赋值 ---');

// 为了真实还原"另一个文件里写错了"的场景，这里在系统临时目录动态生成两个小模块。
// 注意：临时文件一律放在 os.tmpdir() 下，不污染仓库目录，用完即删。
const tmpDir = os.tmpdir();
const brokenPath = path.join(tmpDir, `demo_exports_trap_${process.pid}.cjs`);
const correctPath = path.join(tmpDir, `demo_exports_ok_${process.pid}.cjs`);

try {
  // 错误写法：exports = {...} 只改了局部变量
  fs.writeFileSync(brokenPath, "exports = { broken: true };\n", 'utf8');
  // 正确写法：module.exports = {...}
  fs.writeFileSync(correctPath, "module.exports = { ok: true };\n", 'utf8');

  const broken = require(brokenPath);
  const correct = require(correctPath);

  console.log('错误写法模块导出的内容：', JSON.stringify(broken), '← 空的！');
  console.log('正确写法模块导出的内容：', JSON.stringify(correct));
  console.log('原因：exports = {...} 只是让局部变量 exports 指向了新对象，');
  console.log('     而 require 返回的始终是 module.exports 指向的那个对象。');
} finally {
  // 清理临时文件，保持系统干净
  for (const p of [brokenPath, correctPath]) {
    try {
      fs.unlinkSync(p);
    } catch {
      /* 文件可能不存在，忽略 */
    }
  }
  console.log('已清理临时文件。');
}

// ---------------------------------------------------------------------------
// 5. require 的缓存：同一个模块只执行一次
// ---------------------------------------------------------------------------

console.log('\n--- 5. require 的缓存 ---');

const again = require('./_legacy-lib.cjs');
console.log('第二次 require 拿到的是同一个对象吗？', again === legacy);

// 用模块内部的计数器验证"模块体没有再次执行"：
const t1 = legacy.tick();
const t2 = legacy.tick();
const t3 = again.tick();
console.log('连续 tick() 的结果：', t1, t2, t3, '（状态是连续的，说明模块只被加载了一次）');

// require.cache 里保存着所有已加载模块，可以通过删除缓存来"重新加载"
console.log('require.cache 里是否有这个模块？',
  Object.keys(require.cache).some((k) => k.endsWith('_legacy-lib.cjs')));

const legacyPath = require.resolve('./_legacy-lib.cjs');
delete require.cache[legacyPath]; // 删掉缓存
const reloaded = require('./_legacy-lib.cjs');
console.log('删除缓存后再 require，是同一个对象吗？', reloaded === legacy);
console.log('再调用 tick()，计数器从头开始了：', reloaded.tick());
console.log('（这说明模块体被重新执行了一次，缓存是"只执行一次"的关键）');

// ---------------------------------------------------------------------------
// 6. require 是运行时同步调用：可以条件化、可以拼路径
// ---------------------------------------------------------------------------

console.log('\n--- 6. require 是运行时函数调用 ---');

/**
 * 根据名字加载不同的内置模块（静态 import 做不到这一点）
 * @param {string} name
 * @returns {object}
 */
function loadBuiltin(name) {
  const map = {
    fs: 'node:fs',
    path: 'node:path',
    os: 'node:os',
    url: 'node:url',
  };
  const id = map[name];
  if (!id) throw new Error(`未知的内置模块：${name}`);
  return require(id); // 路径是变量，运行时才决定
}

const url = loadBuiltin('url');
console.log('动态加载 node:url 成功，它有 fileURLToPath 吗？', typeof url.fileURLToPath);

// 也可以写在 if / 函数里（静态 import 只能写在模块顶层）
if (process.platform === 'win32') {
  const osModule = require('node:os');
  console.log('当前是 Windows，os.release() =', osModule.release());
} else {
  console.log('当前不是 Windows 平台。');
}

// ---------------------------------------------------------------------------
// 7. CJS 与 ESM 的差异（本文件里能观察到的部分）
// ---------------------------------------------------------------------------

console.log('\n--- 7. CJS 与 ESM 的差异 ---');
console.log('1) CJS 没有 import.meta：typeof import.meta 在 CJS 里是语法错误，无法写出来');
console.log('2) CJS 没有顶层 await：顶层写 await 会 SyntaxError');
console.log('3) CJS 用 require（运行时、同步、可条件化），ESM 用 import（静态、可提升）');
console.log('4) CJS 的解构是快照，ESM 的导入是实时绑定');

// 在 CJS 里加载 ESM 模块：Node 22.12+ 支持 require(esm)，更早的版本会抛 ERR_REQUIRE_ESM。
// 这里用 try/catch 兼容两种情况，保证示例在任何版本上都能跑通。
try {
  const mathEsm = require('./_math-utils.js');
  console.log('\n在 CJS 里 require 一个 ESM 模块（Node 22.12+ 支持）：');
  console.log('  拿到的对象键：', Object.keys(mathEsm).join(', '));
  console.log('  mathEsm.add(1, 2) =', mathEsm.add(1, 2));
  console.log('  注意这里没有 __esModule 标记，拿到的是模块的命名空间视图。');
} catch (err) {
  console.log('\n当前 Node 版本不支持 require(ESM)：', err.code || err.name);
  console.log('  旧版本需要改用动态 import()（返回 Promise）来加载 ESM。');
}

// 无论哪种情况，动态 import() 在 .cjs 里都能用（只是没有顶层 await，要放进 async 函数）
async function loadEsmViaDynamicImport() {
  const ns = await import('./_config.js');
  return ns.default.appName;
}

loadEsmViaDynamicImport().then((appName) => {
  console.log('用动态 import() 在 CJS 里加载 ESM，拿到 appName =', appName);

  console.log('\n--- 8. 小结 ---');
  console.log('module.exports 是本模块真正的导出对象，exports 只是它的初始别名；');
  console.log('想导出"一个整体"用 module.exports = {...}；想挂零散属性用 exports.x = ...；');
  console.log('两者不要混着改，最容易出现"导出是空对象"的诡异 bug。');
});
