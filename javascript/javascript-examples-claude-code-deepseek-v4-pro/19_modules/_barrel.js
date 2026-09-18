/**
 * ============================================================================
 * 辅助模块：_barrel.js —— 再导出（re-export）汇总模块，也叫"桶文件"
 * ============================================================================
 *
 * 【说明】
 *   本文件以 _ 开头，是辅助模块，批量校验脚本会跳过它。
 *   它被 05_reexport.js 导入，用来演示"再导出"语法。
 *
 *   所谓的 barrel（桶）文件，就是把多个子模块的导出集中到一处再统一对外暴露，
 *   这样使用方只需要 import 一个路径，这就是"入口文件"（index.js）的常见写法。
 *
 * 【本文件演示的三件事】
 *   1. export { a, b } from './x.js'   —— 选择性再导出，顺带改名
 *   2. export * from './x.js'          —— 全部再导出（不含 default）
 *   3. export * as ns from './x.js'    —— 把整个模块打包成一个命名空间再导出
 * ============================================================================
 */

// 1. 选择性再导出 + 重命名导出
//    注意：本模块并没有"先 import 进来再 export 出去"，
//    而是用 export ... from 语法直接转发，导入的绑定不会在本模块内产生局部变量。
export { add as sum, subtract as minus } from './_math-utils.js';

// 2. 全部再导出（星号再导出）
//    export * 会转发被指向模块的所有"具名导出"，但不会转发它的 default 导出。
//    如果两个 export * 之间存在同名导出，就会产生歧义：
//    该名字会被"隐藏"起来不可用，直到你在本模块显式再导出一次来消歧。
export * from './_counter.js';

// 3. 命名空间再导出
//    把 _config.js 的所有导出（含 default）打包成一个名为 config 的对象再导出。
//    导入方写：import { config } from './_barrel.js'，
//    然后用 config.default 拿到 _config.js 的默认导出值。
export * as config from './_config.js';

// 4. 把默认导出改名后再导出
//    default 也是一个导出名，所以可以像普通具名导出一样被重命名转发。
export { default as mathConfigDefault } from './_config.js';
