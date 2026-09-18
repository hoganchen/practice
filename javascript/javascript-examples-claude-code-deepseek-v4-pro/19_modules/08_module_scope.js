/**
 * ============================================================================
 * 知识点：模块作用域 —— 顶层变量不是全局、this 是 undefined、模块只执行一次
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】进阶
 * 【前置知识】19_modules/01_named_exports.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    每个 ESM 文件都是一个独立的模块作用域，它有自己的顶层环境：
 *      (1) 文件顶层声明的 var / let / const / function / class **都只属于本模块**，
 *          不会变成 globalThis 上的属性，也不会和其它模块冲突。
 *      (2) 模块顶层的 `this` 是 undefined（不是全局对象，也不是 exports）。
 *      (3) 一个模块无论被 import 多少次，**只会被求值一次**，
 *          之后所有导入方共享同一份模块实例与其中的状态。
 *
 * 2. 为什么需要
 *    (1) 隔离：脚本时代所有 <script> 共用一个全局作用域，foo 重名就互相覆盖；
 *        模块作用域让每个文件自成一体，只能通过 import/export 显式交互。
 *      (2) 可预测：只执行一次的保证，让模块很适合承载"单例状态"，
 *        比如数据库连接池、全局配置、缓存，不需要再写一堆 if (!globalThis.x)。
 *      (3) 依赖先行：模块的执行顺序由 import 图决定，被依赖的模块先求值，
 *        这使得模块顶层代码可以安全地做初始化（但要小心循环依赖）。
 *      (4) 与 this 相关：顶层的 this 不是宿主对象，减少了"this 指向谁"的心智负担；
 *        对比之下 CJS 里顶层 this 恰好是 module.exports。
 *
 * 3. 核心语法要点
 *    (1) 模块顶层 var a = 1 之后，globalThis.a 是 undefined；
 *        如果你真的想要全局变量，得显式写 globalThis.a = 1。
 *    (2) 模块顶层 this === undefined。注意：箭头函数沿用外层的 this，
 *        普通函数里的 this 则取决于调用方式。
 *    (3) "只执行一次"包括：顶层语句、import 语句触发的依赖求值、顶层 await。
 *    (4) 模块的执行顺序：深度优先，先求值所有 import 的依赖，再执行本模块体。
 *        所以上面 import 的模块里 export 的值，在本模块体里一定已经准备好了。
 *    (5) 顶层 await 只在 ESM 里可用（CJS 不支持），它会阻塞依赖它的模块的求值。
 *
 * 4. 常见陷阱
 *    (1) 误以为模块顶层声明的函数是全局函数（在浏览器控制台里直接敲函数名找不到）。
 *    (2) 误以为模块里的 this 指向 globalThis（在浏览器里是 window）。
 *    (3) 想用"模块只执行一次"来做热重载会发现改代码得重启进程。
 *    (4) 顶层 await 会让模块变成异步模块：某些老工具链/打包器处理不了，
 *        循环依赖 + 顶层 await 甚至可能造成死锁（Node 会直接报错）。
 *    (5) 模块里的变量虽然不污染全局，但**模块实例是进程级共享**的，
 *        一处改了模块内部状态，全进程都能感知到（这正是单例的实现方式）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/08_module_scope.js
 *
 * 【预期输出】
 *   演示模块顶层变量不在 globalThis 上、顶层 this 为 undefined、
 *   以及反复导入同一模块只求值一次（用时间戳与状态留存验证）。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 模块顶层声明不会泄漏到全局
// ---------------------------------------------------------------------------

const secretValue = '我只存在于这个模块里';
var legacyStyleVar = '用了 var 也一样在模块作用域里';
let anotherLet = 42;
function moduleLevelFunction() {
  return '我是模块内的函数';
}
class ModuleLevelClass {}

console.log('--- 1. 模块顶层变量不是全局变量 ---');
console.log('本模块内可以读到 secretValue =', secretValue);
console.log('本模块内可以调用 moduleLevelFunction() =', moduleLevelFunction());
console.log('但它们在 globalThis 上都不存在：');
console.log('  globalThis.secretValue        =', globalThis.secretValue);
console.log('  globalThis.legacyStyleVar     =', globalThis.legacyStyleVar);
console.log('  globalThis.anotherLet         =', globalThis.anotherLet);
console.log('  globalThis.moduleLevelFunction=', globalThis.moduleLevelFunction);
console.log('  globalThis.ModuleLevelClass   =', globalThis.ModuleLevelClass);
console.log('用 typeof 检查更直白：typeof globalThis.secretValue =', typeof globalThis.secretValue);

// 真的想创建全局变量，必须显式写 globalThis.xxx
globalThis.__demoGlobalFlag = '这是我显式挂到全局的';
console.log('显式挂载的 globalThis.__demoGlobalFlag =', globalThis.__demoGlobalFlag);
console.log('（演示完就删掉，避免污染运行环境）');
delete globalThis.__demoGlobalFlag;

// 对比：在浏览器 <script> 里用 var 声明的顶层变量会成为 window 的属性；
// 在 CJS 里顶层声明的变量其实是包装函数内的局部变量，同样不会全局污染；
// 只有"没有任何包装的全局脚本"才会污染全局，ESM 永远不会。

// ---------------------------------------------------------------------------
// 2. 模块顶层的 this 是 undefined
// ---------------------------------------------------------------------------

console.log('\n--- 2. 模块顶层的 this ---');
console.log('顶层 this 的值 =', this);
console.log('顶层 this === undefined ?', this === undefined);
console.log('顶层 this === globalThis ?', this === globalThis);
// 对比：
//   浏览器普通 <script>  顶层 this === window
//   CommonJS 模块        顶层 this === module.exports
//   ES Module            顶层 this === undefined
console.log('对比：浏览器脚本里是 window，CJS 模块里是 module.exports，ESM 里是 undefined。');

// 普通函数里的 this 依然由调用方式决定，与模块作用域无关：
function showThis() {
  return this === undefined ? 'undefined（严格模式下的普通调用）' : typeof this;
}
console.log('模块内普通函数直接调用时的 this：', showThis());
// ESM 里的代码永远是严格模式（严格模式是 ESM 规范内置的），
// 所以普通函数直接调用时 this 是 undefined，而不是 globalThis。

// ---------------------------------------------------------------------------
// 3. 模块只执行一次
// ---------------------------------------------------------------------------

// 先看一眼被导入模块的"加载时间戳"。它是 _math-utils.js 顶层求值时记录的。
import { LOADED_AT, PI } from './_math-utils.js';
import { count, increment } from './_counter.js';

const afterImportTime = Date.now();

console.log('\n--- 3. 模块只被求值一次 ---');
console.log('_math-utils.js 的加载时间戳 LOADED_AT =', LOADED_AT);
console.log('本模块体开始执行的时间            =', afterImportTime);
console.log('LOADED_AT <= 本模块体执行时间 ?', LOADED_AT <= afterImportTime);
console.log('（说明被依赖的模块先于本模块求值，这是 ESM 的执行顺序保证）');

// 等一会儿，再动态导入一次同一个模块
await new Promise((resolve) => setTimeout(resolve, 30));

const again = await import('./_math-utils.js');
const counterAgain = await import('./_counter.js');

console.log('\n30ms 后再次 import 同一个模块：');
console.log('  LOADED_AT 变了吗？', again.LOADED_AT, '（与之前相同：', again.LOADED_AT === LOADED_AT, '）');
console.log('  两次导入拿到的是同一个命名空间对象吗？', again === (await import('./_math-utils.js')));
console.log('  命名空间对象身份相同 → 模块只求值了一次，没有重新执行顶层的 Date.now()');

// ---------------------------------------------------------------------------
// 4. "只执行一次"带来的共享状态（模块级单例）
// ---------------------------------------------------------------------------

// 通过两次动态导入拿到的是同一份模块状态：
increment(3);
console.log('\n--- 4. 模块状态是共享的 ---');
console.log('通过第一次导入的 count =', count);
console.log('通过第二次导入的 counterAgain.count =', counterAgain.count);
console.log('同一个绑定，读出来当然一样：', count === counterAgain.count);

// 这就是"模块级单例"：把状态藏在模块内部，
// 任何导入它的文件访问到的都是同一份数据，不需要额外的单例模式代码。

// ---------------------------------------------------------------------------
// 5. import 声明是静态的，不能写在条件或函数里
// ---------------------------------------------------------------------------

// 下面这样写是语法错误（import 只能出现在模块顶层）：
//   if (someCondition) {
//     import { add } from './_math-utils.js';   // ✗ SyntaxError
//   }
// 原因是 import 在编译阶段就要确定整个依赖图。
// 需要条件加载时请使用动态 import()，它返回 Promise，可以写在任何地方，
// 详见 09_dynamic_import.js。
console.log('\n--- 5. 静态 import 不能条件化 ---');
console.log('import 声明只能写在模块顶层；条件加载请用 await import()（见 09）。');

// ---------------------------------------------------------------------------
// 6. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 6. 小结 ---');
console.log('1) 模块顶层变量只属于本模块，不在 globalThis 上；想全局可见要显式挂 globalThis。');
console.log('2) 模块顶层 this 是 undefined（浏览器脚本是 window，CJS 是 module.exports）。');
console.log('3) 一个模块只被求值一次，多次 import 共享同一份实例与状态。');
console.log('4) ESM 代码始终是严格模式。');
