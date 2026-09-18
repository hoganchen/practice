/**
 * ============================================================================
 * 知识点：词法作用域 vs 动态作用域，为什么 JS 是词法作用域
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】进阶
 * 【前置知识】07_scope_and_closure/04_scope_chain.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    两种作用域模型的分歧点是：一个函数里的自由变量（不是自己声明的、
 *    也不是参数的变量）到底按什么规则去找？
 *    · 词法作用域（lexical scope，又称静态作用域）：
 *        按"函数定义时所在的代码位置"去找 —— 写在哪里，就认哪里的外层。
 *    · 动态作用域（dynamic scope）：
 *        按"函数被调用时的调用栈"去找 —— 谁调用我，我就用谁的作用域。
 *    JavaScript 采用的是词法作用域；Bash、早期的 Lisp、部分模板语言采用动态作用域。
 *
 * 2. 为什么需要
 *    词法作用域的最大好处是"可预测"：读代码时只要看函数的定义位置，
 *    就知道它里面的每个变量从哪来，完全不需要关心它被谁调用。
 *    这让编译器/引擎可以在解析阶段就确定变量的位置（性能好），
 *    也让开发者做静态分析、重构、IDE 跳转成为可能。
 *    动态作用域则相反：同一个函数的含义会随调用者变化，极难维护。
 *
 * 3. 核心语法要点
 *    (1) JS 的变量查找 100% 由定义位置决定，与调用位置无关。
 *    (2) 但 JS 里有一处是"动态"的：this 的指向由调用方式决定（详见下面的对比）。
 *        所以可以这样记：变量是词法的，this 是动态的。
 *    (3) 严格模式下的 eval 会创建自己的作用域，不会污染调用者的作用域；
 *        非严格模式的 eval 和 with 语句会动态修改作用域链，是性能与可读性的毒药。
 *    (4) 闭包能"记住"外层变量，正是词法作用域的直接产物。
 *
 * 4. 常见陷阱
 *    - 以为函数能访问"调用它的那个函数"的局部变量（这是把 JS 当动态作用域）。
 *    - 混淆 this 与变量查找：this 是动态的，变量不是。
 *    - 使用 with / 非严格模式 eval 导致作用域链在运行时被改写，静态分析失效。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 07_scope_and_closure/05_lexical_vs_dynamic_scope.js
 *
 * 【预期输出】
 *   用同一个例子分别在"词法作用域解释"和"假如是动态作用域"下推演结果，
 *   展示实际输出与动态作用域的差异，最后用 this 展示 JS 中"动态"的一面。
 * ============================================================================
 */

console.log('--- 1. 最经典的判定实验 ---');

const x = '模块层的 x';

function printX() {
  // 这个函数里没有声明 x，所以要去外层找。
  // 它定义在模块顶层，外层就是模块作用域 —— 于是永远打印 "模块层的 x"。
  console.log('  printX 里看到的 x →', x);
}

function callPrintX() {
  // 这个函数内部声明了一个同名的 x。
  const x = 'callPrintX 内部的 x';
  // 现在调用 printX。
  printX();
  console.log('  （callPrintX 自己看到的 x →', x, '）');
}

callPrintX();
console.log('  结论：结果是「模块层的 x」，不是「callPrintX 内部的 x」。');
console.log('        → printX 的 x 由它"定义在哪里"决定，与"谁调用它"无关。');
console.log('        如果 JS 是动态作用域，这里会打印「callPrintX 内部的 x」。');

console.log('--- 2. 把两种模型的推演过程写清楚 ---');

// 词法作用域（JS 的真实行为）：
//   printX 定义在模块顶层 → 它的外层作用域是模块作用域 → 找到模块层的 x。
// 动态作用域（假设的模型）：
//   调用栈是 callPrintX → printX，所以 printX 会先去 callPrintX 的作用域找 x
//   → 找到 "callPrintX 内部的 x"。
console.log('  两种模型的查找路径：');
console.log('    词法（JS 实际）：printX 的作用域 → 模块作用域 → 全局  ⇒ 模块层的 x');
console.log('    动态（假设模型）：printX 的作用域 → callPrintX 的作用域 → 模块作用域 ⇒ callPrintX 内部的 x');

console.log('--- 3. 再换一个角度：调用位置怎么变都不影响 ---');

function reportColor() {
  return `我看到的 color 是「${color}」`;
}

function callerOne() {
  const color = 'callerOne 的红色';
  return reportColor();
}

function callerTwo() {
  const color = 'callerTwo 的绿色';
  return reportColor();
}

const color = '模块层的蓝色';

// 同一个函数被两个不同的调用者调用，输出的却是同一个结果。
console.log('  callerOne() →', callerOne());
console.log('  callerTwo() →', callerTwo());
console.log('  直接调用    →', reportColor());
console.log('  结论：调用者换了三次，结果完全一样 —— 这就是词法作用域的可预测性。');

console.log('--- 4. 把函数"带出去"执行，也依然是词法作用域 ---');

function makeReporter() {
  const fromMaker = 'makeReporter 的局部变量';
  // 返回一个函数，它引用了 fromMaker。
  return () => `我在别处被调用，但我依然看到「${fromMaker}」`;
}
const reporter = makeReporter();
// 这个函数被拿到了模块顶层执行（调用栈里早就没有 makeReporter 了），
// 但它依然能读到 makeReporter 的局部变量 —— 这就是闭包，也是词法作用域的铁证。
console.log(' ', reporter());
console.log('  如果 JS 是动态作用域，这里会找不到 fromMaker（调用栈里已经没有 makeReporter）。');

console.log('--- 5. JS 中"动态"的那一面：this ---');

// 变量查找是词法的，但 this 的指向确实是动态的（由调用方式决定）。
const alice = { name: 'Alice', whoAmI() { return `this.name = ${this.name}`; } };
const bob = { name: 'Bob', whoAmI() { return `this.name = ${this.name}`; } };

// 同一个函数对象，换一个调用者，this 就变了。
const sharedMethod = alice.whoAmI;
console.log('  alice.whoAmI()      →', alice.whoAmI());
console.log('  bob.whoAmI()        →', bob.whoAmI());
console.log('  sharedMethod.call(bob) →', sharedMethod.call(bob), '  ← this 随调用方式变化（动态）');
console.log('  记忆口诀：变量是词法的（看定义位置），this 是动态的（看调用方式）。');
console.log('  箭头函数是例外：它的 this 也被"词法化"了，取定义时外层的 this。');

console.log('--- 6. 为什么 JS 选择词法作用域 ---');

const reasons = [
  ['可预测性', '读代码时只看定义位置就知道每个变量从哪来，不用追调用栈'],
  ['性能', '引擎在解析阶段就能确定变量的位置，不需要运行时沿着调用栈查表'],
  ['静态分析', 'IDE 的跳转、重命名、静态类型检查都依赖"作用域可以静态确定"'],
  ['闭包的基础', '闭包之所以能"记住"外层变量，正是因为这份绑定由定义位置决定'],
  ['模块化的基础', '模块之间的隔离也建立在词法作用域上'],
];
for (const [reason, detail] of reasons) {
  console.log(`  · ${reason}：${detail}`);
}

console.log('--- 7. 动态作用域的"残留"：with 与非严格模式 eval ---');

// 这两个特性会让作用域链在运行时被改写，是动态作用域的思路。
// 在严格模式（本仓库的 ESM 默认严格模式）下，with 语句直接是语法错误，
// 所以下面这行只能注释掉：
// with (obj) { console.log(key); }

// 严格模式下的 eval 有自己独立的作用域，不会污染调用者。
function strictEvalDemo() {
  const local = '函数内的 local';
  // 严格模式下，eval 里声明的变量不会泄漏到外层函数。
  eval('var fromEval = "eval 里声明的变量";');
  return typeof local !== 'undefined' ? `eval 执行后，函数内 typeof fromEval = ${typeof fromEval}` : '';
}
console.log(' ', strictEvalDemo());
console.log('  说明：严格模式下 eval 不会给调用者偷偷加变量；');
console.log('        非严格模式下 `eval("var x = 1")` 会在调用者的作用域里创建 x —— 这就是"动态改作用域"。');
console.log('        结论：永远不要用 with；eval 也几乎总是有更好的替代品（JSON.parse、new Function 等）。');

console.log('--- 8. 用一张表固化结论 ---');
const table = [
  ['变量查找依据', '函数定义的位置（写在哪）', '函数被调用的位置（谁调用）'],
  ['何时能确定', '代码解析阶段（静态）', '运行时（动态）'],
  ['同函数不同调用者', '结果完全一样', '结果可能不同'],
  ['闭包能否成立', '能，这是闭包的基础', '不能（调用栈早已消失）'],
  ['代表语言', 'JavaScript、Java、C、Python、Go', 'Bash、Perl 的 local、早期 Lisp'],
  ['可维护性', '高（可静态分析）', '低（必须追调用链）'],
];
for (const [item, lexical, dynamic] of table) {
  console.log(`  · ${item}`);
  console.log(`      词法作用域：${lexical}`);
  console.log(`      动态作用域：${dynamic}`);
}

console.log('--- 9. 一句话总结 ---');
console.log('  JavaScript 的变量查找是词法作用域（看定义位置）；');
console.log('  唯一动态的是 this（看调用方式），可以用 call/apply/bind 或箭头函数来控制它。');
