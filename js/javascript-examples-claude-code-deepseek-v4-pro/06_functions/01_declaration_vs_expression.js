/**
 * ============================================================================
 * 知识点：函数声明与函数表达式的区别（提升行为、调用时机）
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】入门
 * 【前置知识】00_hello_world/01_hello_world.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    在 JavaScript 里"创建一个函数"有两条路：
 *      (1) 函数声明（Function Declaration）：`function foo() { ... }`
 *          —— 它是一条"语句"，直接写在代码块里，以 function 关键字开头。
 *      (2) 函数表达式（Function Expression）：`const foo = function () { ... }`
 *          —— 它是一个"表达式"，产生一个函数值，然后被赋值给变量/属性/参数。
 *    两者的写法只差一个变量名，但在"什么时候可以被调用"上差异巨大。
 *
 * 2. 为什么需要
 *    因为 JS 引擎在执行代码前有一个"创建阶段"，会先把函数声明整体"提升"到
 *    当前作用域顶部，而函数表达式走的是普通变量的规则——变量被提升了，
 *    但赋值动作还留在原地。理解这一点，才能解释"为什么有的函数能提前调用，
 *    有的提前调用就报错"，也才能看懂老代码里"把函数声明写在下边"的写法。
 *
 * 3. 核心语法要点
 *    (1) 函数声明会被完整提升（函数对象在创建阶段就被造好），因此
 *        "先调用、后定义"完全合法。
 *    (2) 函数表达式只是把函数"当成一个值"，提升的只有变量本身：
 *          - 用 var 声明：变量提升为 undefined，提前调用 → TypeError。
 *          - 用 let/const 声明：变量处于"暂时性死区(TDZ)"，提前调用 → ReferenceError。
 *    (3) 函数声明必须有名字；函数表达式可以匿名，也可以命名（命名函数表达式），
 *        命名函数表达式的名字只在该函数体内部可见。
 *    (4) 在 ESM / 严格模式下，函数声明只在它所在的作用域内提升，不会泄漏到全局。
 *
 * 4. 常见陷阱
 *    - 以为 `const f = function () {}` 也能提前调用。
 *    - 在 if 分支里写函数声明（块级函数声明），不同环境下行为不一致，应改用函数表达式。
 *    - 命名函数表达式的名字（如 `const f = function g() {}` 里的 g）在外层拿不到。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/01_declaration_vs_expression.js
 *
 * 【预期输出】
 *   依次打印函数声明可提前调用、函数表达式不可提前调用的三类结果，
 *   最后打印命名函数表达式名字可见性的对比。
 * ============================================================================
 */

console.log('--- 1. 函数声明：可以在定义之前调用 ---');

// 注意看：这一行调用了 sayHi，但 sayHi 的定义在下面 3 行之后。
// 之所以不报错，是因为 JS 引擎在"创建阶段"就把整个函数声明提到了作用域顶部，
// 这个行为叫做"函数提升（hoisting）"。
console.log('提前调用 sayHi("小明") →', sayHi('小明'));

// 这才是函数声明本体。它被"物理地"写在这里，但逻辑上等价于写在本文件最前面。
function sayHi(name) {
  return `你好，${name}！我是函数声明。`;
}

console.log('--- 2. 函数表达式（let/const）：不能提前调用 ---');

// 下面这段 try/catch 演示了"报错"的场景。
// 要求：所有报错必须在文件内部捕获打印，绝不允许抛到顶层导致进程非零退出。
try {
  // 此刻 sayBye 处于 let 的"暂时性死区"（Temporal Dead Zone，TDZ）中，
  // 引擎知道这个变量存在、但还没初始化，因此访问它会抛 ReferenceError。
  sayBye('小红');
} catch (err) {
  console.log('提前调用 sayBye 报错类型：', err.constructor.name);
  console.log('错误信息：', err.message);
}

// 函数表达式：把匿名函数当作一个值赋给 const 变量。
const sayBye = function (name) {
  return `再见，${name}！我是函数表达式。`;
};

// 定义之后再调用就一切正常。
console.log('定义之后调用 sayBye("小红") →', sayBye('小红'));

console.log('--- 3. 函数表达式（var）：提前调用报 TypeError ---');

try {
  // var 声明的变量会在创建阶段被初始化为 undefined，
  // 所以这里读到的其实是 undefined，把 undefined 当函数调用 → TypeError。
  sayHello();
} catch (err) {
  console.log('提前调用 sayHello 报错类型：', err.constructor.name);
  console.log('错误信息：', err.message);
}

var sayHello = function () {
  return 'hello';
};

console.log('定义之后调用 sayHello() →', sayHello());

console.log('--- 4. 命名函数表达式：名字只在函数内部可见 ---');

// `function factorialInner` 里的这个名字只在函数体内部有效，
// 好处是可以在函数内部递归地引用自己，而不依赖外层变量名。
const factorial = function factorialInner(n) {
  if (n <= 1) return 1;
  return n * factorialInner(n - 1); // 内部用名字自引用，安全
};

console.log('factorial(5) →', factorial(5)); // 120
console.log('factorial.name →', factorial.name); // 名字被推断为 factorialInner

// 外部拿不到 factorialInner 这个名字：
console.log('外部 typeof factorialInner →', typeof factorialInner, '（名字不外泄，声明不存在）');
try {
  factorialInner(3);
} catch (err) {
  console.log('外部调用 factorialInner 报错类型：', err.constructor.name);
  console.log('错误信息：', err.message);
}

console.log('--- 5. 块级作用域中的函数声明 ---');

// 在严格模式（ESM 默认严格模式）下，块内函数声明被限制在块内。
// 推荐做法：需要条件定义函数时，统一用 const + 函数表达式。
{
  function blockScoped() {
    return '我是块内的函数声明';
  }
  console.log('块内调用 →', blockScoped());
}

// 块外这个名字是不可见的：typeof 一个不存在的标识符返回 'undefined'（不报错），
// 但真正去"调用"它就会抛 ReferenceError。
console.log('块外 typeof blockScoped →', typeof blockScoped);
try {
  blockScoped();
} catch (err) {
  console.log('块外调用 blockScoped 报错类型：', err.constructor.name);
  console.log('错误信息：', err.message);
}

console.log('--- 6. 小结：调用时机对比表 ---');

// 用一个小表格把结论固化下来。
const summary = [
  { 写法: 'function f() {}', 提升内容: '整个函数对象', 能提前调用: '能' },
  { 写法: 'var f = function () {}', 提升内容: '变量（值 undefined）', 能提前调用: '不能 → TypeError' },
  { 写法: 'let/const f = function () {}', 提升内容: '变量（TDZ）', 能提前调用: '不能 → ReferenceError' },
];
for (const row of summary) {
  console.log(`${row.写法.padEnd(28)} 提升：${row.提升内容.padEnd(20)} 提前调用：${row.能提前调用}`);
}
