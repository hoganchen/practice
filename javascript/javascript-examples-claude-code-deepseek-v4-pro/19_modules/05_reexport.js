/**
 * ============================================================================
 * 知识点：再导出（export ... from / export * from / export * as ns from）
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】进阶
 * 【前置知识】19_modules/04_export_list_and_rename.js、19_modules/06_namespace_import.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    再导出（re-export，也叫转发导出）指的是：一个模块把另一个模块的导出
 *    原样（或改名后）暴露成自己的导出，而**不经过本地变量**。
 *      export { add as sum } from './_math-utils.js';  // 挑着转发并改名
 *      export * from './_counter.js';                  // 全部具名导出转发
 *      export * as config from './_config.js';         // 打包成命名空间转发
 *      export { default as Cfg } from './_config.js';  // 转发别人的默认导出
 *
 * 2. 为什么需要
 *    (1) 统一入口：库的 index.js 把散落在 src/a.js、src/b.js 里的能力集中暴露，
 *        使用方只记一个路径：import { a, b } from 'my-lib'。
 *    (2) 隐藏内部目录结构：以后把 a.js 拆成 a/index.js，只要 index.js 里的
 *        再导出不变，使用方完全无感。
 *    (3) 控制 API 面：export * 转发全部，export { x } from 只转发你愿意公开的部分。
 *    (4) 不改名也不拷贝：再导出的是**绑定本身**，原模块里的值变了，
 *        顺着转发链一路都是最新的（实时绑定，见 07）。
 *
 * 3. 核心语法要点
 *    (1) export ... from 只能在模块顶层使用，语法上不接受变量拼接路径。
 *    (2) 再导出**不会**在当前模块创建同名局部变量：
 *        export { add } from './x.js' 之后，本模块里并不能直接写 add(1, 2)。
 *    (3) export * 转发所有具名导出，但**不转发 default**。
 *        default 名字太特殊，必须显式写 export { default } from './x.js'。
 *    (4) export * as ns from './x.js' 是把目标模块的命名空间对象当成一个
 *        具名导出 ns 转发出去（含它的 default 属性）。
 *    (5) 名字冲突规则：两条 export * 撞了同名导出，该名字会被"隐藏"，
 *        直接 import 它会报错；一旦你在本模块显式再导出一次（export { x } from ...），
 *        就相当于消歧，该名字重新可用。
 *
 * 4. 常见陷阱
 *    (1) 以为 export * 会把 default 一起带上 —— 不会。
 *    (2) 以为再导出能让本模块内部用上那些名字 —— 不能，那只是转发。
 *    (3) 深层再导出链（a → b → c → d）会拖慢启动时的模块解析，也会让
 *        报错栈里全是入口文件名，排查困难；层级不宜过深。
 *    (4) 循环再导出（a 转发 b，b 又转发 a）会造成难以理解的初始化顺序问题。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/05_reexport.js
 *
 * 【预期输出】
 *   通过 _barrel.js 这个"桶文件"使用被转发出来的具名导出、命名空间导出与默认导出，
 *   并验证 export * 不携带 default。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 使用被"选择性再导出 + 改名"的名字
// ---------------------------------------------------------------------------

// _barrel.js 里写的是：
//   export { add as sum, subtract as minus } from './_math-utils.js';
// 于是外部看到的名字是 sum / minus。
import { sum, minus } from './_barrel.js';

console.log('--- 1. 选择性再导出（export { x as y } from ...） ---');
console.log('sum(7, 5) =', sum(7, 5));
console.log('minus(7, 5) =', minus(7, 5));

// 这些名字来自 _math-utils.js，但本文件完全不需要知道 _math-utils.js 的存在。
// 这正是"桶文件"的价值：使用方只依赖一个入口路径。

// ---------------------------------------------------------------------------
// 2. 使用被 export * 转发的导出
// ---------------------------------------------------------------------------

// _barrel.js 里写的是：export * from './_counter.js';
// 于是 _counter.js 的所有具名导出都成了 _barrel.js 的导出。
import { count, increment, reset, getHistorySize, pushHistory } from './_barrel.js';

console.log('\n--- 2. export * from 转发的具名导出 ---');
console.log('初始 count =', count);
increment(3);
console.log('increment(3) 之后 count =', count, '（转发链上依然是实时绑定）');
pushHistory('from 05_reexport.js');
console.log('getHistorySize() =', getHistorySize());
reset();
console.log('reset() 之后 count =', count);

// ---------------------------------------------------------------------------
// 3. export * 不会转发 default
// ---------------------------------------------------------------------------

// 拿到 _barrel.js 的命名空间对象，看看它到底导出了些什么名字。
const barrelNs = await import('./_barrel.js');

console.log('\n--- 3. export * 不转发 default ---');
console.log('_barrel.js 导出的名字：', Object.keys(barrelNs).join(', '));
console.log('barrelNs 上有 default 吗？', 'default' in barrelNs);
console.log('（因为 _barrel.js 只用了 export * 转发 _counter.js，而 export * 会跳过 default）');

// 想转发别人的 default，必须显式写：
//   export { default } from './_config.js';
// 或者改名转发：
//   export { default as Cfg } from './_config.js';
// _barrel.js 里就是这么写的，所以下面能拿到：

// ---------------------------------------------------------------------------
// 4. export * as ns from：把整个模块打包成一个具名导出
// ---------------------------------------------------------------------------

// _barrel.js 里写的是：export * as config from './_config.js';
// 所以这里导入的 config 是一个"命名空间对象"，它的 default 属性才是默认导出。
import { config, mathConfigDefault } from './_barrel.js';

console.log('\n--- 4. export * as ns from 打包转发 ---');
console.log('config 的键：', Object.keys(config).join(', '));
console.log('config.default.appName =', config.default.appName);
console.log('config.CONFIG_VERSION =', config.CONFIG_VERSION);
console.log('mathConfigDefault（转发并改名后的默认导出） =', mathConfigDefault.appName);
console.log('config.default === mathConfigDefault ?', config.default === mathConfigDefault);

// ---------------------------------------------------------------------------
// 5. 再导出不会在当前模块产生局部变量
// ---------------------------------------------------------------------------

// _barrel.js 里 export { add as sum } from './_math-utils.js' 之后，
// _barrel.js 自己**不能**直接调用 add 或 sum —— 那只是"对外转发"，
// 并没有在 _barrel.js 内部建立绑定。若桶文件自己也要用，得另外写 import。
console.log('\n--- 5. 再导出不创建局部绑定 ---');
console.log('export { x } from "./m.js" 只对外转发，本模块内部拿不到 x；');
console.log('若桶文件自己也要用这些函数，需要额外写一行 import。');

// ---------------------------------------------------------------------------
// 6. 常见用法速查
// ---------------------------------------------------------------------------

console.log('\n--- 6. 再导出语法速查 ---');
console.log('export { a, b }        from "./m.js";  // 原样转发');
console.log('export { a as x }      from "./m.js";  // 转发并改名');
console.log('export { default }     from "./m.js";  // 转发别人的默认导出');
console.log('export { default as C } from "./m.js"; // 转发默认导出并改名');
console.log('export *               from "./m.js";  // 转发全部具名导出（不含 default）');
console.log('export * as ns         from "./m.js";  // 打包成命名空间转发（含 default）');
