/**
 * ============================================================================
 * 辅助模块：_cycle-good-a.js —— "安全的" ESM 循环依赖 A 侧
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【说明】
 *   本文件以 _ 开头，是辅助模块，批量校验脚本会跳过它（不单独运行它）。
 *   它与 _cycle-good-b.js 互相 import，构成一个**真实**的循环依赖，
 *   被 19_modules/15_circular_dependencies.js 导入。
 *
 * 【这个循环为什么是安全的】
 *   1. B 在**自己的顶层代码里**从不读取 A 的任何绑定；
 *      它只在函数体内引用 A 的 whoAmI / KIND。
 *   2. ESM 的导入是"实时绑定"（live binding），不是值拷贝。
 *      B 里那个函数被调用时，A 早已初始化完毕，绑定里自然有值。
 *   3. A 在顶层读取 B_NAME 也是安全的 —— 原因见下面的求值顺序。
 *
 * 【求值顺序（关键）】
 *   main 导入 A -> 引擎先递归求值 A 的依赖 B -> B 的依赖 A 正在求值中，跳过
 *   -> **B 的主体先执行完** -> 回到 A，A 的主体才执行。
 *   所以 A 顶层能安全读到 B_NAME；反过来 B 顶层读 A 的东西就会撞上 TDZ。
 * ============================================================================
 */

import { B_NAME, describeA } from './_cycle-good-b.js';

// A 的具名导出：KIND 与 whoAmI
export const KIND = 'good-a';

// ✅ 安全：按上面的求值顺序，B 的主体已经跑完了，B_NAME 里有值。
export const bNameSeenFromA = B_NAME;

/**
 * 返回 A 的自我描述。KIND 是 A 自己的绑定，随时可读。
 * @returns {string} 例如 "A(good-a)"
 */
export function whoAmI() {
  return `A(${KIND})`;
}

// 顺手把 B 的函数再导出一次，方便调用方只 import 一个文件。
export { describeA };
