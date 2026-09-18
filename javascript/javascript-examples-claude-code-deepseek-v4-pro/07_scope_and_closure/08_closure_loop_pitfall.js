/**
 * ============================================================================
 * 知识点：闭包在循环中的经典陷阱（var vs let）、IIFE 解法
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】进阶
 * 【前置知识】07_scope_and_closure/03_block_scope.js、07_scope_and_closure/06_closure_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    在循环里创建闭包（例如往数组里塞回调、给元素绑定事件、注册定时器）时，
 *    如果循环变量用 var 声明，所有闭包会共享同一个变量，
 *    循环结束后它们看到的都是"循环结束时"的最终值：
 *      for (var i = 0; i < 3; i++) fns.push(() => i);
 *      fns.map(f => f());   // [3, 3, 3]，而不是 [0, 1, 2]
 *    这就是 JS 最著名的"循环闭包陷阱"。
 *
 * 2. 为什么需要
 *    这个陷阱解释了无数"事件回调全部绑到最后一个元素""定时器输出的都是同一个值"
 *    的真实 bug。理解它，本质上是在理解两件事：
 *      ① 闭包捕获的是"变量"而不是"值"；
 *      ② var 只有函数作用域，整个循环只有一个 i。
 *    掌握它之后，才能正确写出"带下标的事件监听""按批次延迟执行"这类代码。
 *
 * 3. 核心语法要点 —— 四种解法
 *    解法一（现代首选）：把 var 换成 let。for 循环头部的 let 会为每一轮迭代
 *        创建一个新的绑定，因此每个闭包捕获到的是各自那一轮的变量。
 *    解法二（ES5 时代的正统解法）：用 IIFE 为每一轮创建一个函数作用域，
 *        把当前的循环变量当参数传进去。
 *    解法三：用数组的 forEach / map —— 回调本身就是一个新的函数作用域，
 *        参数天然是每轮独立的值。
 *    解法四：用 bind 把当前值"部分应用"进新函数里。
 *    另外还有"闭包工厂"：写一个 makeHandler(i) 返回一个捕获了参数的新函数。
 *
 * 4. 常见陷阱
 *    - 只记住"用 let 就行"，却不知道原理，遇到 var + 异步时依然会错。
 *    - 用 IIFE 时忘了把 i 当参数传进去（只是加了个括号，仍然共享外层 i）。
 *    - 循环里用了 let，但闭包捕获的是循环体内部"另一个 var"。
 *    - 在 while / do-while 里用 let（那里的 let 并不是"每轮一个新绑定"）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 07_scope_and_closure/08_closure_loop_pitfall.js
 *
 * 【预期输出】
 *   先复现 var 的陷阱，再逐一演示四种解法的正确结果；
 *   最后给出"什么时候该用哪种解法"的选择建议。
 * ============================================================================
 */

console.log('--- 1. 复现陷阱：var + 闭包 ---');

const varFns = [];
for (var i = 0; i < 3; i++) {
  // 这个箭头函数捕获的是"变量 i"，而不是"当轮 i 的值"。
  varFns.push(() => `第 ${i} 个`);
}
console.log('  var 版结果 →', varFns.map((f) => f()), '  ← 全是 3');
console.log('  原因：整个循环只有一个 var i，循环结束后 i 的值是 3（不满足 i<3 才停下）。');
console.log('        三个闭包看的是同一个 i，所以都读到最后的值。');

// 等价的"带延时"版本，更能体现真实场景（定时器 / 事件回调）。
const varTimers = [];
for (var t = 0; t < 3; t++) {
  varTimers.push(() => `定时器 ${t}`);
}
console.log('  var 版待执行任务 →', varTimers.map((f) => f()));

console.log('--- 2. 解法一（现代首选）：把 var 换成 let ---');

const letFns = [];
for (let j = 0; j < 3; j++) {
  // for 头部的 let 会为每一轮迭代创建一个全新的 j 绑定。
  letFns.push(() => `第 ${j} 个`);
}
console.log('  let 版结果 →', letFns.map((f) => f()), '  ← 正确的 0 1 2');
console.log('  原理：每一轮循环开始时，引擎把上一轮 j 的值复制进一个"新的 j"绑定，');
console.log('        三个闭包分别捕获了三个不同的变量。');

console.log('--- 3. 解法二（ES5 时代）：IIFE 创建独立作用域 ---');

const iifeFns = [];
for (var k = 0; k < 3; k++) {
  iifeFns.push(
    (function (captured) {
      // captured 是形参，属于这个 IIFE 自己的函数作用域，
      // 每一轮循环都会调用一次 IIFE，产生一份独立的 captured。
      return () => `第 ${captured} 个`;
    })(k), // ← 关键：把当前的 k 当参数传进去
  );
}
console.log('  IIFE 版结果 →', iifeFns.map((f) => f()), '  ← 正确的 0 1 2');

// 反例：IIFE 没传参数，等于白写。
const badIifeFns = [];
for (var m = 0; m < 3; m++) {
  badIifeFns.push(
    (function () {
      // 里面没有形参，闭包依然沿着作用域链找到了外层的 var m。
      return () => `第 ${m} 个`;
    })(), // ← 忘了传 m
  );
}
console.log('  忘记传参的 IIFE →', badIifeFns.map((f) => f()), '  ← 依然是 3 3 3');

console.log('--- 4. 解法三：用 forEach / map（回调自带新作用域）---');

const forEachFns = [];
[0, 1, 2].forEach((n) => {
  // n 是回调的形参，每次调用都是一份新绑定 —— 天然没陷阱。
  forEachFns.push(() => `第 ${n} 个`);
});
console.log('  forEach 版结果 →', forEachFns.map((f) => f()), '  ← 正确的 0 1 2');

// 处理真实数组时，for (const x of arr) 同样每轮一个新绑定。
const items = ['苹果', '香蕉', '橘子'];
const itemFns = [];
for (const item of items) {
  // for...of + const 是"每轮一个新绑定"的另一个典型形式。
  itemFns.push(() => `我喜欢${item}`);
}
console.log('  for...of 版结果 →', itemFns.map((f) => f()));

console.log('--- 5. 解法四：用 bind 把当前值固化进新函数 ---');

function describe(index) {
  return `第 ${index} 个`;
}
const bindFns = [];
for (var b = 0; b < 3; b++) {
  // bind 的第一个参数是 this，这里不关心，传 null；
  // 第二个参数 b 被"固定"成新函数的第一个实参 —— 相当于做了一个值快照。
  bindFns.push(describe.bind(null, b));
}
console.log('  bind 版结果 →', bindFns.map((f) => f()), '  ← 正确的 0 1 2');

console.log('--- 6. 解法五：闭包工厂（把值变成参数）---');

function makeHandler(index) {
  // index 是形参，每次调用 makeHandler 都是一份新绑定。
  return () => `第 ${index} 个`;
}
const factoryFns = [];
for (var c = 0; c < 3; c++) {
  factoryFns.push(makeHandler(c));
}
console.log('  闭包工厂版结果 →', factoryFns.map((f) => f()));

console.log('--- 7. 真实场景：异步任务里的循环闭包 ---');

// 场景：按顺序启动三个"延时任务"，每个任务要打印自己的编号。
// 错误写法（var）
const wrongTasks = [];
for (var w = 1; w <= 3; w++) {
  wrongTasks.push(() => `任务 ${w} 完成`);
}
await new Promise((resolve) => setTimeout(resolve, 0));
console.log('  var 版三个任务 →');
for (const task of wrongTasks) {
  console.log('    ', task());
}

// 正确写法（let）
const rightTasks = [];
for (let r = 1; r <= 3; r++) {
  rightTasks.push(() => `任务 ${r} 完成`);
}
await new Promise((resolve) => setTimeout(resolve, 0));
console.log('  let 版三个任务 →');
for (const task of rightTasks) {
  console.log('    ', task());
}

console.log('--- 8. 一个容易被忽略的坑：while 循环里的 let ---');

// while 循环没有"每轮一个新绑定"的机制（它不是 for 头部那种形式）。
const whileFns = [];
{
  let wi = 0;
  while (wi < 3) {
    // 这里捕获的是同一个 wi（它声明在 while 外面）。
    const captured = wi; // 想要每轮独立，必须像这样显式做一份"每轮副本"
    whileFns.push(() => `第 ${captured} 个`);
    wi += 1;
  }
}
console.log('  while + 显式副本 →', whileFns.map((f) => f()), '  ← 正确');
console.log('  如果直接把 wi 写进闭包（不留副本），结果依然会全是 3 —— 因为 wi 只有一个。');

console.log('--- 9. 五种解法对比与选择建议 ---');

const solutions = [
  ['let（for 头部）', '最简洁，一行改动搞定', '所有现代环境；首选'],
  ['IIFE 传参', 'ES5 时代的标准解法', '需要兼容老环境，或理解原理时'],
  ['forEach / map', '回调自带新作用域', '遍历数组时最自然'],
  ['bind', '把值固化成实参', '已有具名函数、想复用参数时'],
  ['闭包工厂', '意图最明确：值 → 函数', '需要给回调附加额外参数时'],
];
for (const [name, how, when] of solutions) {
  console.log(`  · ${name}`);
  console.log(`      做法：${how}`);
  console.log(`      场景：${when}`);
}

console.log('--- 10. 一句话记住本质 ---');
console.log('  陷阱的根源不是"循环"，而是"闭包捕获变量 + var 只创建了一个变量"。');
console.log('  只要保证"每一轮都有一个独立的变量"，问题就消失了 —— let、参数、副本都是这个思路。');
