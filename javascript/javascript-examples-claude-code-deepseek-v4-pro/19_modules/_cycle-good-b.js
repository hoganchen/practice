/**
 * ============================================================================
 * 辅助模块：_cycle-good-b.js —— "安全的" ESM 循环依赖 B 侧
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【说明】
 *   本文件以 _ 开头，是辅助模块，批量校验脚本会跳过它。
 *   它与 _cycle-good-a.js 互相 import，构成"安全的循环依赖"。
 *
 * 【安全的秘诀：推迟到调用时再读】
 *   `import { whoAmI, KIND } from './_cycle-good-a.js'` 这一行**不会**去读 A 的值，
 *   它只是在 B 的模块作用域里建立两个"指向 A 的绑定的引用"。
 *   只要不在 B 的顶层代码里真的去读它们，就不会碰到"绑定还没初始化"的 TDZ 错误。
 *   describeA() 是函数，调用它的时候（main 里）A 早就初始化完了。
 * ============================================================================
 */

import { whoAmI, KIND } from './_cycle-good-a.js';

// B 自己的具名导出
export const B_NAME = 'good-b';

/**
 * 通过实时绑定读取 A 的状态。
 * 注意函数体内引用了 A 的 whoAmI 与 KIND —— 只有被调用时才真的去读。
 * @returns {string} 描述文本
 */
export function describeA() {
  return `B 通过实时绑定读到 A -> ${whoAmI()}，KIND = ${KIND}`;
}

// 证明 B 的主体确实执行过了。
export const B_LOADED = true;
