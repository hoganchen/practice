/**
 * ============================================================================
 * 知识点：立即调用函数表达式 IIFE —— 语法、作用、现代替代方案
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】进阶
 * 【前置知识】06_functions/04_arrow_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    IIFE = Immediately Invoked Function Expression，立即调用函数表达式。
 *    定义完马上执行，一次性的、没有名字的函数：
 *      (function () { ... })();
 *    它的关键点有两个：① 是"表达式"而不是"声明"；② 定义后立刻用 () 调用。
 *
 * 2. 为什么需要
 *    ES6 之前，JS 只有"函数作用域"和"全局作用域"，没有块级作用域。
 *    想造一个私有空间、不往全局扔变量，只能靠函数：
 *      - 避免全局命名污染（一个页面引入多个库时尤其重要）；
 *      - 配合闭包保存私有状态（模块模式的雏形）；
 *      - 避免循环中 var 的经典陷阱。
 *    现代 JS 有了块级作用域、let/const、ESM 模块之后，IIFE 的必要性大大降低，
 *    但仍有两个场景离不开它：① 需要 await 的顶层（async IIFE）；② 只想用一次、
 *    不想污染命名空间的临时逻辑。
 *
 * 3. 核心语法要点
 *    (1) 必须让引擎把 function 关键字解析成"表达式"。常见写法：
 *          (function () {}())    // 括号包住整体再调用
 *          (function () {})()    // 括号包住函数再调用（最常用）
 *          !function () {}()     // 一元运算符把声明变表达式
 *          void function () {}()
 *          +function () {}()
 *    (2) 如果直接写 `function foo() {}()`，引擎按"函数声明"解析，
 *        声明后面跟 () 是语法错误，所以必须加包装。
 *    (3) 箭头函数也能做 IIFE：`(() => { ... })();`
 *    (4) IIFE 可以带参数和返回值：`const r = (function (a) { return a * 2; })(21);`
 *    (5) async IIFE：`(async () => { await ...; })();`，用于在非 async 上下文里用 await。
 *
 * 4. 常见陷阱
 *    - 忘记最外层括号：`function () {}()` 直接 SyntaxError。
 *    - 上一行没写分号，导致 IIFE 和前一行"粘"在一起被当成函数调用：
 *        const a = 1
 *        (function () {})()      // 被解析成 1(function(){})()
 *      这是"ASI 分号陷阱"的经典案例，所以本仓库统一显式写分号。
 *    - 以为 IIFE 里的变量外面能访问（其实完全隔离）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/06_iife.js
 *
 * 【预期输出】
 *   演示 IIFE 的多种写法、私有作用域效果、返回值与传参、async IIFE，
 *   最后对比现代替代方案（块级作用域 / ESM 模块）。
 * ============================================================================
 */

console.log('--- 1. 最基础的 IIFE ---');

// 外层圆括号把 function 关键字变成"表达式"，末尾的 () 立刻调用它。
(function () {
  console.log('  我是一个立即执行的匿名函数');
})();

// 另一种等价的括号位置：把调用括号也包进外层括号里。
(function () {
  console.log('  我是另一种括号写法的 IIFE');
})();

console.log('--- 2. IIFE 的核心作用：造一个私有作用域 ---');

// 这个变量写在 IIFE 内部，外部完全访问不到，不会污染全局。
(function () {
  const privateVar = '我是 IIFE 内部的私有变量';
  var alsoPrivate = '我用 var 声明，同样出不去';
  console.log('  内部可以看到：', privateVar, '/', alsoPrivate);

  // 顺带挂一个"出口"到全局，这是老式库暴露 API 的标准做法。
  globalThis.myLibrary = { version: '1.0.0' };
})();

console.log('  globalThis.myLibrary →', globalThis.myLibrary, '（显式挂出去的出口）');
// typeof 一个不存在的标识符不会报错，返回 'undefined'，正好用来验证"确实拿不到"。
console.log('  typeof privateVar   →', typeof privateVar, '（外部拿不到，不污染全局）');
console.log('  typeof alsoPrivate  →', typeof alsoPrivate);

console.log('--- 3. IIFE 的其他包装写法（一元运算符法） ---');

// 感叹号把后面的函数当成表达式，效果等同于外层括号。
// 缺点：可读性差，且一旦漏写分号极易与前一行粘连，不推荐在业务代码里使用。
!function () {
  console.log('  我是用 ! 包装的 IIFE');
}();

+function () {
  console.log('  我是用 + 包装的 IIFE');
}();

void (function () {
  console.log('  我是用 void 包装的 IIFE');
})();

console.log('--- 4. 带参数和返回值的 IIFE ---');

// IIFE 本质上就是一个普通函数调用，所以能传参、能接收返回值。
const doubled = (function (n) {
  return n * 2;
})(21);
console.log('  带参数/返回值的 IIFE：(function (n) { return n * 2; })(21) →', doubled);

// 常见用途：用 IIFE 包住一段"初始化逻辑"，把结果赋给一个变量。
const config = (function () {
  const defaults = { host: 'localhost', port: 8080 };
  const overrides = { port: 3000 };
  // 内部可以随便用临时变量，外面看不见。
  return { ...defaults, ...overrides };
})();
console.log('  用 IIFE 初始化配置 →', config);

console.log('--- 5. 箭头函数版 IIFE ---');

// 箭头函数本身就是表达式，语法更短。
(() => {
  console.log('  我是箭头函数 IIFE');
})();

// 单表达式可以直接隐式返回。
const tripled = ((n) => n * 3)(7);
console.log('  箭头函数 IIFE 带返回值：((n) => n * 3)(7) →', tripled);

console.log('--- 6. IIFE 的历史用途：解决循环里的 var 陷阱 ---');

// 老代码（ES5 时代）的经典问题：var 没有块级作用域，三个回调共享同一个 i。
const varFns = [];
for (var i = 0; i < 3; i++) {
  varFns.push(function () {
    return i;
  });
}
console.log('  不用 IIFE（var）：', varFns.map((f) => f()), '  ← 全是 3，因为共享同一个 i');

// 解法一（ES5 时代）：用 IIFE 为每一轮循环造一个独立作用域，把 i 当参数传进去。
const iifeFns = [];
for (var j = 0; j < 3; j++) {
  iifeFns.push(
    (function (captured) {
      // captured 是每一轮独立的形参，被闭包保存下来。
      return function () {
        return captured;
      };
    })(j),
  );
}
console.log('  用 IIFE 包裹（var）：', iifeFns.map((f) => f()), '  ← 每轮独立，0 1 2');

// 解法二（现代）：直接用 let，每轮循环自动生成新的绑定，不需要 IIFE。
const letFns = [];
for (let k = 0; k < 3; k++) {
  letFns.push(() => k);
}
console.log('  用 let（现代写法）：', letFns.map((f) => f()), '  ← 同样是 0 1 2，代码更短');

console.log('--- 7. IIFE 的现代替代方案一：块级作用域 {} ---');

// 只想隔离几个变量时，一对花括号就够了，不用函数。
{
  const scopedA = '块内的 a';
  const scopedB = '块内的 b';
  console.log('  块内可以访问：', scopedA, '/', scopedB);
}
console.log('  块外 typeof scopedA →', typeof scopedA, '（let/const 有块级作用域，等价于 IIFE 的隔离效果）');

console.log('--- 8. IIFE 的现代替代方案二：ESM 模块 ---');

// 本仓库所有文件都是 ESM 模块，模块本身就是"自带作用域"的：
// 文件里声明的顶层变量不会挂到 globalThis 上，也不会和其他文件冲突。
// 这正是当年 IIFE 想解决的问题 —— 现在由语言层面的模块系统直接解决了。
const moduleScoped = '我只属于这个模块';
console.log('  模块顶层变量 moduleScoped →', moduleScoped);
console.log('  它出现在 globalThis 上吗？', 'moduleScoped' in globalThis, '（不会，模块天然隔离）');

console.log('--- 9. IIFE 至今仍然不可替代的场景：async IIFE ---');

// 问题：模块顶层可以直接用 await（ESM 的顶层 await），
// 但普通函数体内不能。想在普通函数里用 await，就要把逻辑包进 async IIFE。
function runTask() {
  const results = [];
  // 这里没有用真的异步（不访问外网、不依赖计时器），
  // 用 Promise.resolve 模拟微任务，保证输出顺序稳定、退出码为 0。
  return (async () => {
    results.push(await Promise.resolve('第一步：读取配置'));
    results.push(await Promise.resolve('第二步：连接服务'));
    results.push(await Promise.resolve('第三步：处理完成'));
    return results;
  })();
}

const taskResult = await runTask();
console.log('  async IIFE 的结果 →');
for (const line of taskResult) {
  console.log('    ·', line);
}

console.log('--- 10. 小结：什么时候还需要 IIFE ---');
console.log('  需要：① 在普通函数内使用 await（async IIFE）；');
console.log('        ② 只想执行一次的、带私有变量的初始化逻辑；');
console.log('        ③ 需要把一段代码的结果赋给变量的"小计算"（本质是立即调用的函数）。');
console.log('  不需要：只是为了隔离变量 → 用 {} 块级作用域；');
console.log('          只是为了不污染全局 → 用 ESM 模块。');
