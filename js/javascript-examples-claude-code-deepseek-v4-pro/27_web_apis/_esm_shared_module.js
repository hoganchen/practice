/**
 * ============================================================================
 * 知识点：ES 模块的导出写法（供 08_browser_modules.js 导入的辅助模块）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】进阶
 * 【前置知识】无（本文件是辅助模块，配合 27_web_apis/08_browser_modules.js 阅读）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    一个 ES 模块文件：通过 export 把内部的名字暴露给其它模块使用。
 *
 * 2. 为什么需要
 *    演示 export 的各种写法，供 08_browser_modules.js 导入并对照说明。
 *
 * 3. 核心语法要点
 *    1) export const / let  —— 导出变量（导出的是"绑定"而不是"快照"）
 *    2) export function     —— 导出函数
 *    3) export class        —— 导出类
 *    4) export { a, b }     —— 批量导出
 *    5) export { x as y }   —— 重命名导出
 *    6) export default      —— 默认导出（一个模块只能有一个）
 *    7) 模块顶层的代码只在**第一次被导入时执行一次**（单例语义）
 *
 * 4. 常见陷阱
 *    导入方拿到的是"实时活绑定"，不能给导入的名字重新赋值；
 *    以 _ 开头的文件会被 scripts/run-all.js 视为辅助模块，不会被单独运行。
 *
 * 【运行方法】
 *   本文件不能单独运行（它是被导入的辅助模块）。请运行：
 *   node 27_web_apis/08_browser_modules.js
 *
 * 【预期输出】
 *   被导入时会打印一行"模块求值"日志，证明模块只会被执行一次。
 * ============================================================================
 */

// 模块顶层的代码：只在模块被首次求值（evaluate）时执行一次。
// 之后无论有多少个文件 import 它，都不会再执行第二遍。
console.log('  [模块求值] _esm_shared_module.js 正在被加载（这行只会出现一次）');

/** 导出的常量 */
export const VERSION = '1.0.0';

/** 导出的变量——注意 ES 模块导出的是"实时绑定"，外部看到的是最新值 */
export let callCount = 0;

/** 导出的函数：修改了模块内部的变量，外部能立刻看到变化 */
export function greet(name) {
  callCount += 1; // 内部状态变化会通过"活绑定"同步给所有导入者
  return `你好，${name}！这是本模块第 ${callCount} 次被调用。`;
}

/** 导出的类 */
export class Counter {
  #value = 0; // 私有字段，外部改不了（模块内部细节的另一种封装）

  increment(step = 1) {
    this.#value += step;
    return this;
  }

  get value() {
    return this.#value;
  }
}

/** 模块内部的"私有"函数：没有 export，外部无法访问 */
function internalHelper(text) {
  return text.trim().toUpperCase();
}

/** 只有被导出的那个函数才能调用内部函数 —— 这是模块封装的基本形态 */
export function shout(text) {
  return internalHelper(text);
}

/** 默认导出：一个模块只能有一个。导入时名字可以随便取 */
export default function createGreeter(prefix = '默认前缀') {
  return (name) => `${prefix}：${name}`;
}

// 批量导出 + 重命名导出：'as' 后面的名字是外部看到的名字
export { VERSION as version, internalHelper as __debugHelper };
