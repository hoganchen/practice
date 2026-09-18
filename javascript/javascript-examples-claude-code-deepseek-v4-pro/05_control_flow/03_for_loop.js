/**
 * ============================================================================
 * 知识点：传统 for 循环 —— 三段式与循环变量作用域（let vs var）
 * ============================================================================
 *
 * 【所属分类】05_control_flow —— 流程控制
 * 【难度等级】入门
 * 【前置知识】05_control_flow/01_if_else.js、04_operators/01_arithmetic.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    传统 for 循环是"计数型循环"的标准写法，语法由三段组成：
 *      for (初始化; 条件; 更新) { 循环体 }
 *      ① 初始化：只在循环开始前执行一次，通常声明计数器
 *      ② 条件：每轮循环**开始前**求值，为真值才继续，为假值就结束循环
 *      ③ 更新：每轮循环体执行**结束后**执行，通常给计数器加一
 *    执行顺序是：初始化 → 条件 → 循环体 → 更新 → 条件 → 循环体 → 更新 → ...
 *
 * 2. 为什么需要
 *    当你需要"按次数循环"或"需要用下标访问多个数组"时，for 最直接：
 *      - 需要知道当前索引（如同时遍历两个平行数组）
 *      - 需要倒序遍历
 *      - 需要按固定步长跳跃（如只遍历偶数下标）
 *      - 需要在循环中修改数组元素（for...of 拿到的是值的拷贝）
 *
 * 3. 核心语法要点
 *    【作用域是重点】
 *      - 用 let 声明计数器：每一轮迭代都有**独立的绑定**，闭包能正确捕获每轮的值。
 *      - 用 var 声明计数器：整个循环只有一个变量，所有闭包捕获的是同一个变量，
 *        循环结束后它的值就是循环结束时的值（经典面试题）。
 *    【三段都可以省略】
 *      - 省略初始化：for (; i < n; i++)
 *      - 省略条件：for (;;) 是死循环（等价于 while (true)），必须内部 break
 *      - 省略更新：for (let i = 0; i < n; ) 需要在循环体里自己改 i，否则死循环
 *    【逗号表达式】
 *      初始化段和更新段可以用逗号写多条语句：for (let i = 0, j = 10; ...; i++, j--)
 *    【可以用 const 吗】
 *      初始化段可以用 const，但只能在循环体内部修改它指向的对象、不能自增，
 *      所以计数器必须有更新时，要写 let。
 *
 * 4. 常见陷阱
 *    - 差一错误（off-by-one）：`i <= arr.length` 会多跑一轮并访问到 undefined。
 *    - 死循环：忘记写更新表达式，或条件永远为真，程序会卡住（本文件用计数器 break 演示）。
 *    - 在循环体内修改循环变量，会让循环次数变得难以推理。
 *    - 在循环条件里做耗时计算（如每次都读 arr.length），现代引擎大多能优化，但可读性更重要。
 *    - var 声明的计数器在循环结束后仍然可访问（函数作用域），容易造成意外污染。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 05_control_flow/03_for_loop.js
 *
 * 【预期输出】
 *   依次打印最基本的 for 循环、执行顺序拆解、省略三段的写法、
 *   let 与 var 的作用域差异、常见变体（倒序/步长/嵌套），
 *   以及用计数器 break 安全模拟死循环的演示。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 最基本的 for 循环
// ---------------------------------------------------------------------------

console.log('--- 1. 最基本的 for 循环 ---');

// 三段依次是：初始化（i = 0）、条件（i < 5）、更新（i++）
for (let i = 0; i < 5; i++) {
  console.log(`  第 ${i + 1} 次循环，i = ${i}`);
}
console.log('  循环结束后 i 不可访问（let 只在循环内有效）');

// 遍历数组：用下标访问每个元素
const fruits = ['苹果', '香蕉', '橙子'];
for (let i = 0; i < fruits.length; i++) {
  console.log(`  fruits[${i}] = ${fruits[i]}`);
}

// ---------------------------------------------------------------------------
// 2. 执行顺序拆解
// ---------------------------------------------------------------------------

console.log('\n--- 2. 执行顺序拆解 ---');

// 把三段都写成带日志的形式，直观看清执行顺序
function traceForLoop() {
  const trace = [];
  let idx = 0; // 为了让初始化段能留下日志，把计数器声明提到外面
  for (
    trace.push('① 初始化段执行（仅一次）'); // 初始化段：可以写任意表达式
    trace.push(`② 条件判断：idx=${idx} < 3 ?`) , idx < 3;
    // 更新段用逗号运算符写两条语句
    idx++, trace.push(`④ 更新段执行：idx 变成 ${idx}`)
  ) {
    trace.push(`③ 循环体执行：idx=${idx}`);
  }
  trace.push('② 条件判断为假，循环结束');
  return trace;
}
for (const line of traceForLoop()) {
  console.log('  ' + line);
}

// 上面输出的顺序说明：
//   初始化 → 条件 → 循环体 → 更新 → 条件 → 循环体 → 更新 → 条件(假) → 结束

// ---------------------------------------------------------------------------
// 3. 省略三段的各种写法
// ---------------------------------------------------------------------------

console.log('\n--- 3. 省略三段 ---');

// 省略初始化：计数器在循环外声明（此时它可能是函数作用域里的变量）
let i = 0;
for (; i < 3; i++) {
  console.log(`  省略初始化，i = ${i}`);
}
console.log('  此时 i 在循环外仍可访问 =', i); // 3

// 省略更新：必须在循环体里自己改，否则会死循环
for (let j = 0; j < 3; ) {
  console.log(`  省略更新，手工自增前 j = ${j}`);
  j++; // 关键：自己推进，否则永远出不去
}

// 省略条件：等价于 while (true)，必须靠内部的 break 跳出
// 注意：本示例用一个安全计数器保证一定会在有限步内退出，绝不是真的死循环。
let safeCounter = 0;
for (;;) {
  safeCounter++;
  if (safeCounter >= 3) {
    console.log(`  省略条件的无限循环，已通过 break 在第 ${safeCounter} 轮退出`);
    break; // 没有这个 break 就是真正的死循环
  }
}

// 三段全省略 + break 是"永不自然结束的循环"的标准写法

// ---------------------------------------------------------------------------
// 4. 重点：let 与 var 的作用域差异
// ---------------------------------------------------------------------------

console.log('\n--- 4. let 与 var 的作用域差异 ---');

// let：每轮迭代都创建一个新的绑定，闭包捕获的是"当轮"的值
const letFns = [];
for (let k = 0; k < 3; k++) {
  letFns.push(() => k);
}
console.log('  用 let 声明时，闭包读到的值：', letFns.map((f) => f())); // [0, 1, 2]

// var：整个循环只有一个变量，所有闭包共享它，都在读循环结束后的最终值
const varFns = [];
for (var v = 0; v < 3; v++) {
  varFns.push(() => v);
}
console.log('  用 var 声明时，闭包读到的值：', varFns.map((f) => f())); // [3, 3, 3]

// 为什么？因为 var 是"函数作用域"，循环外仍能访问它
console.log('  var 声明的 v 在循环结束后仍然存在，v =', v); // 3

// 老时代用 var 想达到 let 的效果，必须借助 IIFE 造新作用域
const iifeFns = [];
for (var m = 0; m < 3; m++) {
  (function (captured) {
    iifeFns.push(() => captured);
  })(m);
}
console.log('  用 IIFE 模拟 let 的效果：', iifeFns.map((f) => f())); // [0, 1, 2]

// 另一种老办法：把值存进数组或对象再读
const dataFns = [];
for (var n = 0; n < 3; n++) {
  dataFns.push({ index: n });
}
console.log('  用数据对象保存每轮的值：', dataFns.map((o) => o.index)); // [0, 1, 2]

// 结论：新代码一律用 let（或 const），不要再用 var 写循环

// ---------------------------------------------------------------------------
// 5. 常见变体
// ---------------------------------------------------------------------------

console.log('\n--- 5. 常见变体 ---');

// 变体一：倒序遍历（从后往前，常用于"边遍历边删除"的安全场景）
const nums = [10, 20, 30];
for (let idx = nums.length - 1; idx >= 0; idx--) {
  console.log(`  倒序：nums[${idx}] = ${nums[idx]}`);
}

// 变体二：指定步长（只遍历偶数下标）
for (let idx = 0; idx < 6; idx += 2) {
  console.log(`  步长 2：idx = ${idx}`);
}

// 变体三：倒序删除元素（正序删除会跳过元素，倒序不会）
const toRemove = [1, 2, 3, 4, 5, 6];
for (let idx = toRemove.length - 1; idx >= 0; idx--) {
  if (toRemove[idx] % 2 === 0) {
    toRemove.splice(idx, 1); // 删除偶数
  }
}
console.log('  倒序删除偶数后 =', toRemove); // [1, 3, 5]

// 变体四：二维数组（嵌套循环）
const grid = [
  [1, 2, 3],
  [4, 5, 6],
];
for (let row = 0; row < grid.length; row++) {
  const cells = [];
  for (let col = 0; col < grid[row].length; col++) {
    cells.push(grid[row][col] * 2); // 每个元素乘以 2
  }
  console.log(`  第 ${row} 行乘 2 后 = [${cells.join(', ')}]`);
}

// 变体五：同时遍历两个平行数组（这是 for 相对 for...of 的优势）
const names = ['小明', '小红', '阿强'];
const scores = [90, 85, 77];
for (let idx = 0; idx < names.length && idx < scores.length; idx++) {
  console.log(`  ${names[idx]} 得分 ${scores[idx]}`);
}

// 变体六：用逗号表达式同时维护两个计数器
for (let left = 0, right = 4; left < right; left++, right--) {
  console.log(`  left = ${left}, right = ${right}`);
}

// 变体七：累加 / 累乘
let sum = 0;
for (let idx = 1; idx <= 100; idx++) {
  sum += idx; // 1+2+...+100
}
console.log('  1 到 100 的和 =', sum); // 5050

let factorial = 1;
for (let idx = 1; idx <= 5; idx++) {
  factorial *= idx;
}
console.log('  5! =', factorial); // 120

// ---------------------------------------------------------------------------
// 6. 陷阱与防御
// ---------------------------------------------------------------------------

console.log('\n--- 6. 陷阱 ---');

// 陷阱一：差一错误。i <= arr.length 会多跑一轮
const arr = ['a', 'b', 'c'];
console.log('  错误写法 i <= arr.length 会多访问一次：');
for (let idx = 0; idx <= arr.length; idx++) {
  const value = arr[idx];
  const mark = value === undefined ? ' ← 越界了，得到 undefined' : '';
  console.log(`    arr[${idx}] = ${value}${mark}`);
}
console.log('  正确写法是 i < arr.length');

// 陷阱二：遗忘更新导致死循环。这里用一个安全计数器模拟并强制退出
let infiniteGuard = 0;
const MAX_ITERATIONS = 5; // 安全上限
for (let idx = 0; idx < 3; ) {
  infiniteGuard++;
  if (infiniteGuard >= MAX_ITERATIONS) {
    console.log(`  检测到可能死循环，已在 ${MAX_ITERATIONS} 次迭代后强制退出（真实场景会卡死）`);
    break; // 关键：必须跳出，否则进程会一直卡住
  }
  // 故意不写 idx++，模拟"忘写更新"的错误
}

// 陷阱三：在循环体内修改循环变量，循环次数变得难以预测
const trace = [];
for (let idx = 0; idx < 5; idx++) {
  trace.push(idx);
  if (idx === 1) {
    idx += 2; // 手动跳跃，跳过了 2、3
  }
}
console.log('  循环体内修改循环变量的轨迹 =', trace); // [0,1,4]

// 陷阱四：性能敏感场景缓存长度（现代引擎已优化，这里只作为写法示意）
const bigArray = Array.from({ length: 5 }, (_, idx) => idx);
let totalBig = 0;
for (let idx = 0, len = bigArray.length; idx < len; idx++) {
  totalBig += bigArray[idx];
}
console.log('  缓存长度的写法结果 =', totalBig); // 0+1+2+3+4 = 10

// ---------------------------------------------------------------------------
// 7. 实战：冒泡排序与二分查找
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战 ---');

// 冒泡排序：典型的双层 for 循环
function bubbleSort(input) {
  const list = [...input]; // 不改动原数组
  for (let pass = 0; pass < list.length - 1; pass++) {
    let swapped = false;
    // 每一轮把当前最大的元素"冒"到末尾，所以内层可以少比一次
    for (let idx = 0; idx < list.length - 1 - pass; idx++) {
      if (list[idx] > list[idx + 1]) {
        [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]]; // 解构交换
        swapped = true;
      }
    }
    // 如果这一轮没有发生交换，说明已经有序，可以提前退出
    if (!swapped) break;
  }
  return list;
}
console.log('  bubbleSort([5, 2, 9, 1, 7]) =', bubbleSort([5, 2, 9, 1, 7]));

// 二分查找：体现 for 循环"用两个指针夹逼"的经典用法
function binarySearch(sortedList, target) {
  let low = 0;
  let high = sortedList.length - 1;
  // 这里用 while 更自然，但也可以写成 for (; low <= high; )
  for (; low <= high; ) {
    const mid = Math.floor((low + high) / 2);
    if (sortedList[mid] === target) {
      return mid; // 找到了，返回下标
    }
    if (sortedList[mid] < target) {
      low = mid + 1; // 目标在右半边
    } else {
      high = mid - 1; // 目标在左半边
    }
  }
  return -1; // 没找到
}
const sorted = [1, 3, 5, 7, 9, 11, 13];
for (const target of [7, 1, 13, 8]) {
  console.log(`  binarySearch(..., ${target}) = ${binarySearch(sorted, target)}`);
}

// 统计字符串中每个字符出现的次数：for + 对象累加
function countChars(text) {
  const counts = {};
  for (let idx = 0; idx < text.length; idx++) {
    const ch = text[idx];
    // 用 ?? 处理"第一次出现"，比 if 判断更紧凑
    counts[ch] = (counts[ch] ?? 0) + 1;
  }
  return counts;
}
console.log("  countChars('hello') =", countChars('hello'));

console.log('\n全部演示结束。');
