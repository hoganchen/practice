/**
 * ============================================================================
 * 辅助模块：_cycle-tdz-a.js —— "会炸的" ESM 循环依赖 A 侧
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【说明】
 *   本文件以 _ 开头，是辅助模块，批量校验脚本会跳过它。
 *   它与 _cycle-tdz-b.js 互相 import，B 在**顶层**读取 A 的绑定，
 *   因此导入本模块时必定抛出：
 *     ReferenceError: Cannot access 'A_VALUE' before initialization
 *
 *   ⚠️ 这是**故意**制造的崩溃，用来演示 ESM 循环依赖里最典型的 TDZ 错误。
 *   调用方（19_modules/15_circular_dependencies.js）必须用动态 import + try/catch
 *   接住它，否则整个进程会以非零退出码结束。
 *
 * 【为什么是 TDZ 而不是 undefined】
 *   A 的执行顺序是：先求值依赖 B -> B 顶层读 A_VALUE -> 此时 A 的 `const A_VALUE`
 *   还处在"已创建但未初始化"的状态（暂时性死区）-> 读它直接抛 ReferenceError。
 *   ESM 在这里选择"大声报错"而不是"给个 undefined"，正是为了避免 CJS 那种
 *   "拿到半成品却在很远的地方才炸"的隐蔽问题。
 * ============================================================================
 */

import { B_VALUE } from './_cycle-tdz-b.js';

// 这一行永远执行不到 —— 因为导入 B 的时候 B 就炸了。
export const A_VALUE = 'a-已初始化';

// 同上，也执行不到。
export const A_SAW_B = B_VALUE;
