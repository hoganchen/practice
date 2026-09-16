/**
 * ============================================================================
 * 辅助模块：_cycle-cjs-mut-a.cjs —— CJS 循环依赖 A 侧（原地挂属性）
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【说明】
 *   本文件以 _ 开头，是辅助模块，批量校验脚本会跳过它。
 *   它与 _cycle-cjs-mut-b.cjs 互相 require。
 *
 * 【和 _cycle-cjs-a.cjs 的唯一区别】
 *   这里**不替换** module.exports，而是用 `module.exports.xxx = ...` 逐个挂属性。
 *   后果是：B 在初始化阶段拿到的那个对象，和 A 最终对外导出的是**同一个对象**。
 *   于是 B 手里那个"半成品"会在 A 执行完之后悄悄"长出属性来" ——
 *   这就是 CJS 循环依赖最迷惑人的"假象"：
 *     同一行 `a.A_NAME`，在 B 的初始化阶段读是 undefined，
 *     等到 main 里再读就变成 'cjs-mut-a' 了。
 *
 *   正因为结果取决于"你什么时候读它"，CJS 循环依赖才这么难排查。
 * ============================================================================
 */

// 顶层 require B：此刻 module.exports 还是一个空对象 {}。
const b = require('./_cycle-cjs-mut-b.cjs');

// ✅ 原地挂属性：对象引用保持不变，B 手里的引用会同步看到这些新属性。
module.exports.A_NAME = 'cjs-mut-a';

/**
 * 乘法函数。注意它是 A 执行到这一行之后才挂上去的，
 * 而 B 在自己的初始化阶段就试图调用它 —— 那一次必然失败。
 * @param {number} x 被乘数
 * @param {number} y 乘数
 * @returns {number} 乘积
 */
module.exports.mul = function mul(x, y) {
  return x * y;
};

// B 已经完整加载，能安全读到它的导出。
module.exports.sawB = b.B_NAME;

console.log('[cjs-mut-a] 初始化完成：原地挂属性，导出对象的引用始终没变');
