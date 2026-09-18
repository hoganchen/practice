/**
 * ============================================================================
 * 知识点：块级作用域 {}、let/const 的块级特性
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】入门
 * 【前置知识】07_scope_and_closure/02_function_scope.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    块级作用域（block scope）指的是：每一对花括号 {} 都会形成一个新的作用域，
 *    用 let / const 声明的变量只在这个块内可见。常见的块有：
 *      - if / else 的分支体
 *      - for / while 的循环体（还有 for 语句的头部）
 *      - switch 的 case（整个 switch 是一个块）
 *      - try / catch / finally（catch 的参数是独立的块级变量）
 *      - 单独写的一对 {}（"裸块"）
 *      - 函数体（函数体本身也是一个块，只不过还叠加了函数作用域）
 *
 * 2. 为什么需要
 *    ES6 之前只有函数作用域，导致两个大问题：
 *      (1) 循环里的 var 只有一个变量，所有回调共享它（经典陷阱）；
 *      (2) 临时变量会"泄漏"到整个函数，容易撞名。
 *    块级作用域把变量的"可见范围"压缩到你真正需要的那几行里，
 *    让代码更容易推理，也让引擎更容易判断变量什么时候可以回收。
 *
 * 3. 核心语法要点
 *    (1) let / const 遵守块级作用域；var 无视块，只认函数。
 *    (2) 块级作用域可以嵌套，内层可以访问外层，反之不行。
 *    (3) for 循环的头部（let i）会为"每一轮迭代"创建一个新的 i 绑定，
 *        所以每轮循环里的 i 都是独立的 —— 这是 for + let 能解决闭包陷阱的原因。
 *    (4) 函数声明在块内（严格模式）也只在该块内可见。
 *    (5) 同一作用域内 let/const 不允许重复声明（var 允许）。
 *
 * 4. 常见陷阱
 *    - 以为 if 块里的 var 外面不能用（其实能用，会"泄漏"）。
 *    - 在 switch 的 case 里用 let 而不加花括号，导致整个 switch 只有一个作用域。
 *    - 在同一个块里既用 var 又用 let 声明同名变量 → SyntaxError。
 *    - 循环里用 var 生成回调，回调拿到的都是循环结束后的最终值。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 07_scope_and_closure/03_block_scope.js
 *
 * 【预期输出】
 *   演示 if / for / switch / try / 裸块五类块级作用域的表现，
 *   并对比 var 与 let 在循环中的巨大差异。
 * ============================================================================
 */

console.log('--- 1. if 块：let 出不去，var 漏出来 ---');

if (true) {
  // let / const 属于这个 if 块
  let insideLet = 'if 块内的 let';
  const insideConst = 'if 块内的 const';
  // var 属于外层函数（模块顶部就是模块作用域）
  var leakedVar = '用 var 声明，会漏到块外';
  console.log('  块内：', insideLet, '/', insideConst, '/', leakedVar);
}
console.log('  块外 typeof insideLet   →', typeof insideLet, '（let 被限制在块内）');
console.log('  块外 typeof insideConst →', typeof insideConst);
console.log('  块外 typeof leakedVar   →', typeof leakedVar, '  ← var 泄漏了！值：', leakedVar);

console.log('--- 2. 裸块 {}：就是纯粹的作用域隔离 ---');

// 一对不加任何语句的花括号，就是一个块，可以单独用来隔离变量。
{
  const temp = '我只活在这对花括号里';
  console.log('  裸块内 →', temp);
}
console.log('  裸块外 typeof temp →', typeof temp, '（干净，不留痕迹）');
console.log('  用途：需要几个临时变量又不想到处起名字时，用裸块最省事。');

console.log('--- 3. for 循环：每轮迭代一个独立的绑定 ---');

// 这是块级作用域最有价值的场景。
const varCallbacks = [];
for (var i = 0; i < 3; i++) {
  // var 的 i 只有一个，所有回调共享它。
  varCallbacks.push(() => i);
}
console.log('  var 版：[0,1,2] 的循环结束后收集回调 →', varCallbacks.map((f) => f()), '  ← 全是 3');

const letCallbacks = [];
for (let j = 0; j < 3; j++) {
  // let 的 j 在每一轮迭代都是一份新的绑定。
  letCallbacks.push(() => j);
}
console.log('  let 版：[0,1,2] 的循环结束后收集回调 →', letCallbacks.map((f) => f()), '  ← 正确的 0 1 2');

// 用直接输出看得更直观：循环体内的 let 变量每轮都是"新"的。
for (let k = 0; k < 3; k++) {
  // 在循环体里再声明一个 let，每轮都是全新的变量。
  let perIteration = `第 ${k} 轮`;
  if (k === 1) {
    setTimeout(() => console.log('  延迟打印（第 2 轮的变量）→', perIteration), 0);
  }
}
console.log('  上面那行延迟打印会在同步代码跑完之后才出现（见文件末尾）。');

console.log('--- 4. for 循环头部的 let 到底特殊在哪 ---');

// 等价的手工展开，帮助理解"每轮一个新绑定"的含义：
{
  // 引擎对 `for (let x = 0; ...)` 的处理近似于：
  //   每一轮开始时，把上一轮的 x 的值复制到一个新的 x 绑定里。
  let x = 0; // 第 1 轮的 x
  console.log('  手工展开第 1 轮：x =', x);
  x += 1; // 第 1 轮结束
  let x2 = x; // 第 2 轮拿到一个新的绑定，值是上一轮的结果
  console.log('  手工展开第 2 轮：x2 =', x2, '（值从上一轮复制过来，但是新变量）');
}
console.log('  所以 for + let 既能"记住上一轮的值"，又能"每轮独立" —— 两个需求同时满足。');

console.log('--- 5. switch 块：整个 switch 是一个作用域 ---');

function switchDemo(value) {
  switch (value) {
    case 1:
      // 这里声明的 let 属于整个 switch 块，不是"只属于 case 1"。
      const message = '选择了 1';
      return message;
    case 2:
      // 如果这里再写 const message，会因重复声明报错（同一个块内不能重名）。
      return '选择了 2';
    default:
      return '其他';
  }
}
console.log('  switchDemo(1) →', switchDemo(1));
console.log('  switchDemo(2) →', switchDemo(2));
console.log('  switchDemo(9) →', switchDemo(9));

// 想让每个 case 有自己的作用域，就把 case 的内容用花括号包起来。
function switchWithBraces(value) {
  switch (value) {
    case 1: {
      const message = 'case 1 自己的 message';
      return message;
    }
    case 2: {
      // 因为上面的 message 在独立的块里，这里可以放心再用同名变量。
      const message = 'case 2 自己的 message';
      return message;
    }
    default: {
      const message = 'default 自己的 message';
      return message;
    }
  }
}
console.log('  switchWithBraces(1) →', switchWithBraces(1));
console.log('  switchWithBraces(2) →', switchWithBraces(2), '（同名变量互不冲突，因为各自在独立的块里）');

console.log('--- 6. try / catch 的块 ---');

try {
  const insideTry = 'try 块里的变量';
  console.log('  try 块内 →', insideTry);
  throw new Error('故意抛一个错，用来演示 catch 的作用域');
} catch (err) {
  // catch 的参数 err 只在 catch 块内有效，也是一个块级绑定。
  console.log('  catch 块内 err.message →', err.message);
} finally {
  const insideFinally = 'finally 块里的变量';
  console.log('  finally 块内 →', insideFinally);
}
console.log('  try 块外 typeof insideTry →', typeof insideTry);
console.log('  catch 块外 typeof err     →', typeof err, '（catch 参数出不了 catch 块）');
console.log('  finally 块外 typeof insideFinally →', typeof insideFinally);

console.log('--- 7. 块内函数声明（严格模式）---');

{
  function blockOnlyFunction() {
    return '我只在这个块里可见';
  }
  console.log('  块内调用 →', blockOnlyFunction());
}
console.log('  块外 typeof blockOnlyFunction →', typeof blockOnlyFunction, '（严格模式下不会泄漏到块外）');
try {
  // typeof 不报错，真正调用才报错 —— 这正好验证了"名字确实不存在"。
  blockOnlyFunction();
} catch (err) {
  console.log('  块外调用 → 报错', err.constructor.name, ':', err.message);
}

console.log('--- 8. 重复声明：var 允许，let/const 禁止 ---');

// var 可以重复声明（后者覆盖前者的值）。
var repeatable = '第一次';
var repeatable = '第二次';
console.log('  var 重复声明 →', repeatable, '（合法，容易造成困惑）');

// let 在同一个作用域里重复声明是 SyntaxError（语法阶段就报错，无法用 try/catch 捕获），
// 所以下面这行只能注释掉：
// let noRepeat = 1; let noRepeat = 2;

// 但"内层块里再声明一次"是完全合法的（那是遮蔽，不是重复声明）。
let shadowable = '外层的值';
{
  let shadowable = '内层块的值';
  console.log('  内层块看到 →', shadowable);
}
console.log('  外层看到   →', shadowable, '（没有被内层改动）');

console.log('--- 9. 小结 ---');
const summary = [
  ['{} 裸块', '需要临时变量又不想起名字时最省事'],
  ['if / else 块', '分支里的临时变量不会泄漏到函数其他部分'],
  ['for 循环（let）', '每轮一个独立绑定，是解决闭包陷阱的现代方案'],
  ['switch 块', '所有 case 共享一个作用域，需要隔离就用 {} 包住 case'],
  ['try/catch/finally', '三个块互相独立，catch 参数也是块级绑定'],
];
for (const [block, usage] of summary) {
  console.log(`  · ${block}：${usage}`);
}

// 让前面那个 setTimeout 回调在最后执行，保证输出顺序看起来完整。
await new Promise((resolve) => setTimeout(resolve, 10));
console.log('--- 程序结束 ---');
