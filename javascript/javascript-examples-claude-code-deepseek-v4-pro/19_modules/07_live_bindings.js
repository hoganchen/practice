/**
 * ============================================================================
 * 知识点：模块导出是"实时绑定"而不是值拷贝
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】进阶
 * 【前置知识】19_modules/01_named_exports.js、19_modules/06_namespace_import.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ESM 的 import 拿到的不是"导出那一刻的值"，而是对模块内部变量的**绑定**
 *    （live binding，实时绑定）。模块内部之后修改了这个变量，
 *    所有导入方再读它时读到的就是新值。
 *      // _counter.js
 *      export let count = 0;
 *      export function increment() { count += 1; }
 *      // main.js
 *      import { count, increment } from './_counter.js';
 *      console.log(count);   // 0
 *      increment();
 *      console.log(count);   // 1 ← 不是 0！这就是实时绑定
 *
 * 2. 为什么需要
 *    CommonJS 的 require() 是"求值并返回 module.exports 对象"，
 *    如果你解构成局部变量，之后就与模块内部脱钩了：
 *      const { count } = require('./counter');  // 快照
 *      counter.increment();
 *      console.log(count);                     // 仍然是 0（旧值）
 *    这导致 CJS 里必须写成 counter.count 才能拿到最新值，非常反直觉。
 *    ESM 用实时绑定从根上解决了这个问题，也让**循环依赖**变得可预测：
 *    循环依赖时某个模块还没执行完，它导出的绑定依然可读，只是暂时是
 *    "尚未初始化"的状态（let/const 处于 TDZ，访问会抛 ReferenceError），
 *    一旦初始化完成，之前拿到绑定的模块就能看到正确的值。
 *
 * 3. 核心语法要点
 *    (1) 只有"读取"是实时的：每次用到的 count 都会去模块里取值。
 *    (2) 导出方必须用 let/var/函数声明这类可以重新赋值的绑定，
 *        才能体现"变"；用 const 导出的对象虽然引用不变，
 *        但改它的属性同样能被所有导入方看到（因为大家拿到的是同一个对象）。
 *    (3) 导入方的绑定是**只读**的：给 count 赋值会直接抛 TypeError，
 *        因为遵循"谁拥有、谁修改"的原则，修改必须通过模块导出的函数。
 *    (4) 命名空间对象（import * as ns）的每个属性也是实时绑定，
 *        但把它解构出来（const { count } = ns）就退化成快照了。
 *
 * 4. 常见陷阱
 *    (1) 以为 import 是"拷贝一份值进来"，然后在循环/异步里读到旧值。
 *    (2) 试图给导入的绑定赋值：`count = 10` 会抛
 *        TypeError: Assignment to constant variable.（不是静默失败）。
 *    (3) 用解构把命名空间对象拆开，破坏了实时性（见 06 第 5 节）。
 *    (4) 在 CommonJS 里做同样的事：解构 require 结果同样是快照，
 *        本文件第 4 节会用 _legacy-lib.cjs 实测给你看。
 *    (5) 循环依赖时读到的绑定在初始化前是 TDZ，抛 ReferenceError 而不是 undefined，
 *        所以循环依赖依然要尽量避免，实时绑定只是让行为可预测。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/07_live_bindings.js
 *
 * 【预期输出】
 *   依次打印：导入的计数器随模块内部修改而变化（实时绑定），
 *   命名空间读取同样是实时的，解构则退化为快照，
 *   最后用 CommonJS 模块对照演示快照的差异。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 静态具名导入：实时绑定
// ---------------------------------------------------------------------------

import { count, lastAction, increment, decrement, reset } from './_counter.js';

console.log('--- 1. 导入的绑定随模块内部变化 ---');
console.log('刚导入时 count =', count);
console.log('lastAction =', lastAction);

increment(2);
console.log('调用 increment(2) 之后 count =', count);
console.log('lastAction =', lastAction);

decrement(1);
console.log('调用 decrement(1) 之后 count =', count);

// 如果 import 是"值拷贝"，上面三次打印的 count 会永远是 0。
// 之所以会变，是因为 count 这个名字在本文件里始终指向 _counter.js 内部的那个 let 绑定。

reset();
console.log('调用 reset() 之后 count =', count);

// ---------------------------------------------------------------------------
// 2. 导出函数（函数声明）同样是绑定
// ---------------------------------------------------------------------------

// export function 导出的是函数对象本身，函数通常不会被整体替换，
// 所以"实时"这一点主要体现在变量导出上。但函数内部的闭包
// 依然能读写模块内的私有状态，这就是"模块级单例"的实现方式。
// 例如下面的 getHistorySize 读的就是模块内部的私有数组。
import { getHistorySize, pushHistory } from './_counter.js';

console.log('\n--- 2. 函数导出与模块私有状态 ---');
console.log('调用前 getHistorySize() =', getHistorySize());
pushHistory('在 07_live_bindings.js 里推入一条记录');
pushHistory('再推一条');
console.log('推入两条记录后 getHistorySize() =', getHistorySize());
console.log('history 数组本身没有被导出，外部只能通过函数间接读写它。');

// ---------------------------------------------------------------------------
// 3. 命名空间对象也是实时的，但解构会退化成快照
// ---------------------------------------------------------------------------

import * as counterNs from './_counter.js';

console.log('\n--- 3. 命名空间读取 vs 解构快照 ---');

// （1）每次都通过 ns 读，是实时的
increment(10);
console.log('counterNs.count（实时） =', counterNs.count);

// （2）解构出来的是一个普通局部变量，取的是那一刻的值
const { count: snapshot } = counterNs;
increment(10);
console.log('再 increment(10) 后，counterNs.count（实时） =', counterNs.count);
console.log('而 snapshot（解构出来的快照） =', snapshot);
console.log('结论：要保持实时性，就别解构，每次都写 ns.xxx。');

// ---------------------------------------------------------------------------
// 4. 对照实验：CommonJS 的"快照"问题
// ---------------------------------------------------------------------------

// 下面用 createRequire 在 ESM 文件里加载一个 CommonJS 模块。
// createRequire(import.meta.url) 会创建一个"以当前模块路径为基准"的 require 函数，
// 这是在 ESM 里使用 CJS 模块的标准办法之一（另一种是直接 import，见 12）。
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const legacy = require('./_legacy-lib.cjs');

console.log('\n--- 4. 对照：CommonJS 的快照语义 ---');
console.log('初始 legacy.cjsCount =', legacy.cjsCount);

// 通过属性读取：能看到最新值
legacy.cjsIncrement(5);
console.log('调用 cjsIncrement(5) 后，legacy.cjsCount =', legacy.cjsCount);

// 解构读取：拿到的是快照，不会再变
const { cjsCount } = legacy;
legacy.cjsIncrement(5);
console.log('再调用 cjsIncrement(5) 后，legacy.cjsCount =', legacy.cjsCount);
console.log('而解构出来的 cjsCount =', cjsCount);
console.log('这就是 CJS 的老毛病：解构 = 拍照留底，之后与模块脱钩。');

// ---------------------------------------------------------------------------
// 5. 导入的绑定是只读的
// ---------------------------------------------------------------------------

console.log('\n--- 5. 导入的绑定只读 ---');
// 下面这行如果取消注释，会抛出 TypeError: Assignment to constant variable.
//   count = 100;
// 想改状态只能走模块提供的函数（increment / decrement / reset），
// 这样"谁能改、怎么改"被收敛到模块内部，是良好的封装。
console.log('给导入的 count 赋值会抛 TypeError: Assignment to constant variable.');
console.log('修改状态的正确姿势：调用模块导出的 increment() / decrement() / reset()');

console.log('\n--- 6. 小结 ---');
console.log('ESM：import 得到的是绑定，读取永远是最新值（live binding）；');
console.log('CJS：require 得到的是对象，属性读取实时，但解构即快照。');
