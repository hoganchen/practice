/**
 * ============================================================================
 * 辅助模块：_legacy-lib.cjs —— 一个用 CommonJS 写法的"老式"模块
 * ============================================================================
 *
 * 【说明】
 *   本文件以 _ 开头，是辅助模块，批量校验脚本会跳过它。
 *   注意扩展名是 .cjs：在 package.json 设置了 "type": "module" 的仓库里，
 *   .js 一律被当作 ESM，想写 CommonJS 必须显式使用 .cjs 扩展名。
 *
 *   它被 11_cjs_require.cjs、12_esm_vs_cjs.cjs、04_export_list_and_rename.js
 *   等示例使用。
 *
 * 【核心要点】
 *   1. CommonJS 里没有 export 关键字，导出靠 module.exports 这个对象。
 *   2. exports 只是 module.exports 的初始别名，重新给 exports 赋值不会生效。
 *   3. require() 是同步的、运行时执行的，返回的是"值的快照"（对象引用）。
 * ============================================================================
 */

'use strict';

// ---------------------------------------------------------------------------
// 1. module.exports 与 exports 的关系
// ---------------------------------------------------------------------------

// Node 在包装一个 CJS 模块时，大致做了这件事：
//   (function (exports, require, module, __filename, __dirname) { ... })
// 并且在进入函数体之前，先让 exports 与 module.exports 都指向同一个空对象。
// 所以初始状态下 exports 和 module.exports 指向同一个对象。

// 给 exports 挂属性 == 给 module.exports 挂属性（因为指向同一个对象）
exports.toolName = 'legacy-lib';
exports.version = '0.0.1';

/**
 * 一个老式函数：两数相加
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
exports.legacyAdd = function legacyAdd(a, b) {
  return a + b;
};

/**
 * 一个老式类（CJS 时代常见的函数构造器写法）
 * @param {string} name
 */
function LegacyLogger(name) {
  this.name = name;
  this.records = [];
}

LegacyLogger.prototype.log = function log(message) {
  this.records.push(`[${this.name}] ${message}`);
  return this.records.length;
};

// 把构造函数也挂到 exports 上
exports.LegacyLogger = LegacyLogger;

// ---------------------------------------------------------------------------
// 2. 危险操作演示（默认注释掉）
// ---------------------------------------------------------------------------

// 下面这一行如果取消注释，就会"切断" exports 与 module.exports 的联系：
//   exports = { broken: true }
// 结果是：外部 require 到的仍然是最初那个对象，看不到 broken 这个属性。
// 这是 CJS 最经典的陷阱之一，具体演示见 11_cjs_require.cjs。

// ---------------------------------------------------------------------------
// 3. 提供一点点私有状态，演示 CJS 模块也是单例
// ---------------------------------------------------------------------------

let loadCounter = 0;

/**
 * 记录一次调用
 * @returns {number}
 */
exports.tick = function tick() {
  loadCounter += 1;
  return loadCounter;
};

// ---------------------------------------------------------------------------
// 4. 一个会变化的原始值导出：用来对比 CJS 的"值快照"与 ESM 的"实时绑定"
// ---------------------------------------------------------------------------

// 注意这里的写法：exports.cjsCount 是一个属性，
// 通过 require() 拿到对象后读 obj.cjsCount 能读到最新值，
// 但如果解构成局部变量 const { cjsCount } = require(...)，那就是一份快照了。
exports.cjsCount = 0;

/**
 * 让 cjsCount 自增
 * @param {number} step
 * @returns {number} 自增后的值
 */
exports.cjsIncrement = function cjsIncrement(step = 1) {
  exports.cjsCount += step;
  return exports.cjsCount;
};
