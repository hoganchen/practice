/**
 * ============================================================================
 * 辅助模块：_cycle-cjs-a.cjs —— CommonJS 循环依赖 A 侧（整体替换 exports）
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【说明】
 *   本文件以 _ 开头，是辅助模块，批量校验脚本会跳过它。
 *   它与 _cycle-cjs-b.cjs 互相 require，构成真正的 CJS 循环依赖。
 *   扩展名用 .cjs，因为仓库根 package.json 是 "type": "module" ——
 *   .js 会被当成 ESM，只有 .cjs 才强制按 CommonJS 解析。
 *
 * 【核心现象：CJS 的循环依赖拿到的是"值快照"】
 *   main -> require(A) -> A 顶层 require(B) -> B 顶层 require(A)
 *   此时 A 的 module.exports 还是**最初那个空对象**（A 一行都还没写完），
 *   于是 B 拿到的是一个"半成品模块"：a.A_NAME 是 undefined。
 *
 *   更关键的是：A 最后用 `module.exports = {...}` **整体替换**了导出对象，
 *   而 B 手里攥着的仍然是那个旧对象 —— 所以 B 看到的 A 永远是空的，
 *   哪怕等到进程结束也不会变。这就是"值快照"最硬的形态。
 *
 *   （对比 _cycle-cjs-mut-a.cjs：那里改用原地挂属性的写法，
 *     B 手里的引用就会"后来突然有值了"，那个更迷惑人。）
 * ============================================================================
 */

// 顶层就 require B —— 循环依赖的入口就在这一行。
const b = require('./_cycle-cjs-b.cjs');

const A_NAME = 'cjs-a';

/**
 * @returns {string} 描述文本
 */
const aFn = () => `aFn(${A_NAME})`;

// B 此刻已经完整加载，所以能读到 B_NAME。
const sawB = b.B_NAME;

// 整体替换 module.exports（注意：B 手里持有的是替换前的旧对象）
module.exports = { A_NAME, aFn, sawB };

console.log('[cjs-a] 初始化完成：module.exports 被整体替换为新对象');
