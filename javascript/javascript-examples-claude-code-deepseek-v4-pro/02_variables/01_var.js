/**
 * ============================================================================
 * 知识点：var —— 函数作用域、变量提升、可重复声明
 * ============================================================================
 *
 * 【所属分类】02_variables —— 变量与作用域
 * 【难度等级】入门
 * 【前置知识】01_syntax_basics/01_statements_and_expressions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    var 是 JS 最古老的变量声明方式（ES1 就有）。它的行为由三条特性定义：
 *    （a）**函数作用域**：var 声明的变量属于"最近的函数体"，而不是"最近的花括号"。
 *        也就是说 if / for / while 的花括号**不构成** var 的作用域边界。
 *    （b）**变量提升（hoisting）**：声明会被"提到"函数体最顶部，但赋值留在原地。
 *        提升后、赋值前的这段时间里，变量的值是 undefined（不是报错）。
 *    （c）**可重复声明**：同一个作用域里可以 var 同一个名字多次，不会报错，
 *        后面声明的"声明部分"被忽略，赋值照常执行。
 *
 * 2. 为什么需要 / 解决什么问题
 *    今天写新代码基本不需要 var（用 let/const）。但 var 必须学，原因有两个：
 *    - 大量存量代码（尤其是 2015 年前的项目、老库、复制粘贴来的片段）仍是 var，
 *      不读懂它的行为就没法维护；
 *    - 面试与原理层面，理解 var 才能理解"为什么会有 let/const"，
 *      也才能理解闭包捕获变量时的经典陷阱。
 *
 * 3. 核心语法要点
 *    （1）函数作用域
 *          function f() { if (true) { var x = 1; } return x; }  // x 在 if 外仍可访问
 *        因为 var 属于函数 f，不属于 if 的块。
 *    （2）变量提升
 *          console.log(a); // undefined（不报错！）
 *          var a = 1;
 *        等价于：
 *          var a;          // 声明被提到顶部，值初始化为 undefined
 *          console.log(a); // undefined
 *          a = 1;          // 赋值留在原地
 *    （3）可重复声明
 *          var a = 1; var a = 2;  // 合法，a 最终是 2
 *    （4）顶层 var 会成为全局对象（globalThis）的属性，且**不可删除**。
 *        这是 var 全局与"隐式全局变量"的重要区别（见 06_global_variables.js）。
 *    （5）在 for 循环里用 var 声明计数器，循环变量在循环结束后依然存在，
 *        而且所有回调共享同一个变量 —— 这是最著名的 var 陷阱。
 *
 * 4. 常见陷阱与注意事项
 *    - "提升"只提升声明，不提升赋值。所以会出现"变量存在但值是 undefined"的状态，
 *      这类 bug 不会报错，只会默默算出 NaN 或 undefined，非常难查。
 *    - var 没有块级作用域，`if` / `for` / `try` 里声明的变量会"泄漏"到外面，
 *      容易造成命名冲突。
 *    - 在循环里用 var 创建闭包（尤其是 setTimeout、事件回调）时，
 *      所有闭包捕获的是**同一个**变量，循环结束后它的值是最后那次的值。
 *    - 用 var 重复声明会把之前的值覆盖掉，而且**不报错**，
 *      所以在大型文件里很容易把别人的变量改掉。
 *    - 函数声明（function f(){}）也会提升，而且提升得比 var 更"彻底"
 *      （连函数体一起提升，可以在声明前调用）。
 *    - 本文件中所有"会报错 / 会得到意外结果"的演示，都在 try/catch 内或使用
 *      new Function 隔离，保证文件本身能正常退出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 02_variables/01_var.js
 *
 * 【预期输出】
 *   分节演示：函数作用域、变量提升（含"先读后写得到 undefined"）、
 *   可重复声明、块语句不构成边界、for 循环里的共享变量陷阱及其修复方法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 函数作用域：var 属于"最近的函数"
// ---------------------------------------------------------------------------

console.log('--- 1. var 是函数作用域 ---');

function scopeDemo() {
  // 下面这个 var 写在 if 的花括号里，但它属于函数 scopeDemo，而不是 if。
  if (true) {
    var insideIf = '我在 if 里被声明';
  }
  // 所以出了 if 依然能访问到 —— 这在 let/const 下会直接抛 ReferenceError。
  return insideIf;
}
console.log('出了 if 依然能访问：', scopeDemo());

function loopScopeDemo() {
  for (var i = 0; i < 3; i++) {
    var loopBodyVar = 'i = ' + i;
  }
  // 循环结束后，i 和 loopBodyVar 都还在。
  return { afterLoopI: i, afterLoopVar: loopBodyVar };
}
console.log('循环结束后循环变量的值：', loopScopeDemo());

// 对照：在模块（ESM）顶层，用 var 声明的变量其实是"模块级"的，
// 不会挂到 globalThis 上（因为模块有自己的作用域）。这个区别在第 6 节详展。
var moduleLevelVar = '我是模块顶层的 var';
console.log('模块顶层的 var 可以正常访问：', moduleLevelVar);

// ---------------------------------------------------------------------------
// 2. 变量提升：声明被提前，赋值留在原地
// ---------------------------------------------------------------------------

console.log('\n--- 2. 变量提升（hoisting） ---');

// 关键演示：在声明语句之前就读取变量。
// 这行**不会抛 ReferenceError**（对比 let/const 会是 TDZ 错误），
// 而是打印 undefined —— 因为声明被提升到了顶部，但赋值还留在下面。
console.log('在 var 声明之前读取 hoistedVar：', hoistedVar);
var hoistedVar = '赋值发生在这里';
console.log('赋值之后读取 hoistedVar：', hoistedVar);

// 用 new Function 看"引擎眼中的等价代码"，帮助建立直觉。
const desugared = new Function(`
  // 引擎实际看到的样子：
  var a;                 // ← 声明被提升到函数体最顶部，自动初始化为 undefined
  const log1 = a;        // 此时自然是 undefined
  a = 1;                 // ← 赋值留在原来的位置
  return { beforeAssign: log1, afterAssign: a };
`);
console.log('提升后的等价形式：', desugared());

// 提升的一个真实危害：函数里先用了变量，看起来像"引用了外部变量"，
// 其实是在用自己内部那个被提升的 undefined。
const outerValue = '外部的值';
function hoistingHazard() {
  const before = typeof innerValue; // 此时函数内部的 innerValue 已提升，值为 undefined
  var innerValue = '内部的值';
  return { beforeDeclaring: before, afterDeclaring: innerValue };
}
console.log('函数内部变量提升遮蔽了外部同名变量：', hoistingHazard());
console.log('外部同名的 outerValue 依然没被影响：', outerValue);

// 函数声明提升得更彻底：连函数体一起提升，所以可以在声明前调用。
console.log('在函数声明之前调用它：', declaredLater());
function declaredLater() {
  return '函数声明被完整提升，可以在定义之前调用';
}

// ---------------------------------------------------------------------------
// 3. 可重复声明：不报错，后写覆盖先写
// ---------------------------------------------------------------------------

console.log('\n--- 3. 可重复声明 ---');

// 同一作用域里 var 同一个名字多次，是完全合法的。
var duplicated = '第一次赋值';
console.log('第一次赋值后：', duplicated);
var duplicated = '第二次赋值'; // 不报错！第二个 var 的"声明"被忽略，赋值照常执行
console.log('第二次赋值后：', duplicated);

// 在函数里重复声明也是合法的。
function redeclareInFunction() {
  var n = 1;
  var n = 2;
  var n = 3;
  return n; // 返回 3
}
console.log('函数内重复声明三次：', redeclareInFunction());

// 对照演示：let/const 会直接报 SyntaxError（解析期错误，用 new Function 捕获）。
try {
  new Function("let x = 1; let x = 2; return x;");
  console.log('let 重复声明：居然通过了（不符合预期）');
} catch (err) {
  console.log('let 重复声明 →', err.constructor.name + '：' + err.message);
}
console.log('结论：var 的"可重复声明"看似方便，实则是命名冲突的温床，let/const 修复了它。');

// ---------------------------------------------------------------------------
// 4. 块语句不构成作用域边界
// ---------------------------------------------------------------------------

console.log('\n--- 4. 块语句 / try-catch 都不构成 var 的边界 ---');

{
  var declaredInBareBlock = '我在一个独立的花括号块里';
}
console.log('裸块里声明的 var，出了块依然在：', declaredInBareBlock);

try {
  var declaredInTry = '我在 try 块里';
  throw new Error('演示用');
} catch (err) {
  var declaredInCatch = '我在 catch 块里';
}
console.log('try 块里的 var：', declaredInTry, '| catch 块里的 var：', declaredInCatch);
console.log('注意：这些"泄漏"会让变量的生命周期比你以为的长得多，也让代码更难推理。');

// ---------------------------------------------------------------------------
// 5. 最著名的 var 陷阱：循环里创建闭包
// ---------------------------------------------------------------------------

console.log('\n--- 5. for 循环 + var 的共享变量陷阱 ---');

// 用 var 声明循环变量时，所有的 i 是**同一个变量**。
const varHandlers = [];
for (var v = 0; v < 3; v++) {
  // 这里的函数体在循环执行时并不会运行，只是把函数"存起来"。
  // 等到真正调用它们时（循环早已结束），它们读到的都是同一个 v 的最终值 3。
  varHandlers.push(function () {
    return v;
  });
}
console.log('var 版：三个函数返回值 =', varHandlers.map((fn) => fn()));
console.log('  → 全是 3，而不是期望的 0 1 2。因为三个闭包共享同一个变量 v。');

// 修复方案一：用 let —— 每次循环迭代都会创建一个新的绑定。
const letHandlers = [];
for (let l = 0; l < 3; l++) {
  letHandlers.push(function () {
    return l;
  });
}
console.log('let 版：三个函数返回值 =', letHandlers.map((fn) => fn()), '（符合预期）');

// 修复方案二：如果要坚持用 var，就必须用 IIFE 把当前值"锁"进一个新的作用域。
const iifeHandlers = [];
for (var k = 0; k < 3; k++) {
  iifeHandlers.push(
    (function (captured) {
      // 参数 captured 是每次调用 IIFE 时新建的变量，值被"快照"了下来
      return function () {
        return captured;
      };
    })(k),
  );
}
console.log('var + IIFE 版：', iifeHandlers.map((fn) => fn()), '（用函数参数完成快照）');

// 修复方案三：把值存到"每次新建的对象/数组元素"里。
const boxedHandlers = [];
for (var b = 0; b < 3; b++) {
  const box = { value: b }; // const 在循环体内 → 每次迭代都是新的 box
  boxedHandlers.push(() => box.value);
}
console.log('var + 循环体内 const 快照：', boxedHandlers.map((fn) => fn()));

// 一个直观的补充演示：循环变量的最终值
function loopVarLivesOn() {
  for (var i = 0; i < 3; i++) {
    // 空循环体
  }
  return '循环结束后 i = ' + i + '（let 版在这里会抛 ReferenceError）';
}
console.log(loopVarLivesOn());

// ---------------------------------------------------------------------------
// 6. var 的"好"用法：几乎没有了
// ---------------------------------------------------------------------------

console.log('\n--- 6. 那 var 还有用吗？ ---');

// 在同一个函数体内声明多个变量时，把 var 全部提到函数开头是"老派风格"，
// 目的是让"提升"这件事在视觉上显式化。现代代码可以用一个 let 语句声明多个变量。
let alpha = 1,
  beta = 2,
  gamma = 3;
console.log('用一条 let 声明多个变量：', alpha, beta, gamma);

// 真正还需要 var 的场景非常少，通常只有：
//   1. 维护遗留代码、需要与老风格保持一致；
//   2. 需要"变量挂在 globalThis 上"这一特性时（这通常也不是好主意）；
//   3. 需要在同一作用域内重复声明（同样不是好主意）。
console.log('现代建议：新代码一律 let / const，需要块级作用域和 TDZ 的保护。');
console.log('理由：var 的三条特性（函数作用域、提升、可重复声明）在今天的视角下都是缺陷。');

console.log('\n--- 7. 小结 ---');
console.log('· var 是函数作用域：if / for / 裸块的花括号都不是它的边界。');
console.log('· var 会提升：声明提前（值为 undefined），赋值留在原地，不报错。');
console.log('· var 可重复声明：不报错、后写覆盖先写，是命名冲突的主要来源。');
console.log('· 循环 + var + 闭包 = 所有回调共享同一个变量，用 let 或 IIFE 修复。');
console.log('· 新代码请不要再用 var。');
