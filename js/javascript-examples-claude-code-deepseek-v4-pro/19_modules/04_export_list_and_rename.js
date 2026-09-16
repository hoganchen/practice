/**
 * ============================================================================
 * 知识点：统一出口 export { }、导出时重命名、导入时重命名
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】入门
 * 【前置知识】19_modules/01_named_exports.js、19_modules/02_default_export.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    除了在声明前面写 export，ESM 还允许把导出集中写在模块末尾：
 *      const a = 1;
 *      function b() {}
 *      export { a, b };                  // 统一出口
 *    并且两种方向都可以改名：
 *      export { a as alpha };            // 导出时改名（导出的名字叫 alpha）
 *      import { alpha as a } from '...'; // 导入时改名（本地叫 a）
 *    还能导出别处拿到的名字（包括 default）：
 *      export { default as Cfg } from './_config.js';
 *
 * 2. 为什么需要
 *    (1) 把"哪些是本模块的公共 API"集中列在文件末尾，一眼看清对外契约，
 *        比在一堆声明里散落 export 更好维护。
 *    (2) 导出时改名可以把内部实现名（internalImpl）与对外 API 名（publicApi）
 *        解耦，重构内部名字不会破坏使用方。
 *    (3) 统一出口是"桶文件"（barrel）和库入口 index.js 的基础写法，见 05。
 *    (4) 还有一种实用场景：内部用短名，对外用带命名空间的长名，减少冲突。
 *
 * 3. 核心语法要点
 *    (1) export { a, b };               —— 从本模块已有的绑定里挑出来导出
 *    (2) export { a as x };             —— 导出时改名（左边是本地名，右边是对外名）
 *    (3) export { a as default };       —— 把某个具名绑定提升为默认导出！
 *    (4) export { default } from './m.js';        —— 转发别人的默认导出
 *        export { default as C } from './m.js';   —— 转发并改名
 *    (5) import { x as y } from '...'   —— 导入时改名（左边是导出名，右边是本地名）
 *    (6) export { } 里写的必须是"本模块已存在的绑定"，不能凭空造一个名字。
 *
 * 4. 常见陷阱
 *    (1) 方向容易记反：
 *          export { 本地名 as 对外名 };
 *          import { 对外名 as 本地名 };
 *        一个"由内向外"，一个"由外向内"，as 两边正好相反。
 *    (2) export { } 是**静态声明**，不是对象字面量，里面不能写 `a: b` 这种写法，
 *        也不能用变量拼名字（export { [k]: v } 是非法的；那要用 export ... from）。
 *    (3) export { x } 只导出绑定本身，不会把 x 的值"拷一份"出去；
 *        x 之后变了，外部看到的也变（实时绑定，见 07）。
 *    (4) export { x as default } 与 export default x 效果相同，
 *        但 export default x 是"值导出"语义更直观，团队里应统一风格。
 *    (5) 用 export { } 导出不存在的名字 = SyntaxError，整个文件跑不起来。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/04_export_list_and_rename.js
 *
 * 【预期输出】
 *   打印从本示例内置的"统一出口"演示模块导入的结果，
 *   展示导出改名 / 导入改名 / 提升为 default 三种效果。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 导入时改名：由外向内，左边是导出名，右边是本地名
// ---------------------------------------------------------------------------

// 导入 _math-utils.js 中的 add，本地叫 plus；
// 同时导入 multiply，本地叫 times。
import { add as plus, multiply as times, PI as pi } from './_math-utils.js';

console.log('--- 1. 导入时改名（导出名 as 本地名） ---');
console.log('plus(2, 3) =', plus(2, 3));
console.log('times(2, 3) =', times(2, 3));
console.log('pi =', pi);

// ---------------------------------------------------------------------------
// 2. 导入一个"使用统一出口 + 导出改名"的模块
// ---------------------------------------------------------------------------

// _barrel.js 里写的是：
//   export { add as sum, subtract as minus } from './_math-utils.js';
// 于是对外暴露的名字是 sum / minus（而不是 add / subtract）。
import { sum, minus } from './_barrel.js';

console.log('\n--- 2. 导入经过"导出改名"的名字 ---');
console.log('sum(1, 2) =', sum(1, 2), '（内部实现叫 add）');
console.log('minus(5, 2) =', minus(5, 2), '（内部实现叫 subtract）');

// 注意 sum 与 plus 是两个不同的本地绑定，但底层是同一个函数：
console.log('sum === plus ?', sum === plus, '（同一个函数对象，只是本地叫法不同）');

// ---------------------------------------------------------------------------
// 3. 导出时改名 + 提升为 default
// ---------------------------------------------------------------------------

// _barrel.js 里还有：
//   export { default as mathConfigDefault } from './_config.js';
// 这就是"转发别人的默认导出并改名"，本文件把它当作普通具名导出使用。
import { mathConfigDefault } from './_barrel.js';

console.log('\n--- 3. 转发 + 改名后的默认导出 ---');
console.log('mathConfigDefault.appName =', mathConfigDefault.appName);

// 另一种常见写法是把某个具名绑定提升成默认导出：
//   const thing = 1;
//   export { thing as default };      // 等价于 export default thing;
// 本文件第 5 节会通过 _config.js 的命名空间对象验证 default 与具名导出的关系。

// ---------------------------------------------------------------------------
// 4. 统一出口（export { } ）的样子
// ---------------------------------------------------------------------------

// 一个"统一出口 + 改名"的模块内部大致是这样写的（示意）：
//
//   // 内部实现，名字比较短、比较土
//   const _calc = (a, b) => a + b;
//   const _name = 'calc-lib';
//
//   // 文件末尾集中声明对外契约，并把内部名映射成对外名
//   export {
//     _calc as calc,
//     _name as LIB_NAME,
//   };
//
// 好处：内部随便改名，只要末尾这段映射不变，使用方就不受影响。

console.log('\n--- 4. 统一出口的写法 ---');
console.log('export { 本地名 as 对外名 };   // 由内向外');
console.log('import { 对外名 as 本地名 };   // 由外向内');

// ---------------------------------------------------------------------------
// 5. 用命名空间对象观察"统一出口"和"default"的关系
// ---------------------------------------------------------------------------

const ns = await import('./_config.js');
console.log('\n--- 5. default 是保留名，也是导出名 ---');
console.log('模块导出的所有名字：', Object.keys(ns).join(', '));
// export { x as default } 之后，外部读到的就是 ns.default。
// default 是保留字，所以只能通过 as 或 `import x from` 语法来使用它。
console.log('ns.default 就是那个默认导出的对象：', ns.default.appName);

// ---------------------------------------------------------------------------
// 6. 汇总对照表
// ---------------------------------------------------------------------------

console.log('\n--- 6. 三种改名方式对照 ---');
console.log('声明处改名： export function _internal() {}; export { _internal as publicApi };');
console.log('转发时改名： export { add as sum } from "./_math-utils.js";');
console.log('导入时改名： import { sum as add } from "./_barrel.js";');
console.log('小结：as 左边永远是"原来的名字"，右边永远是"新的名字"。');
