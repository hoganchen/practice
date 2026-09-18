/**
 * ============================================================================
 * 知识点：形参与实参、参数默认值、arguments 对象、实参多余/缺失
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】入门
 * 【前置知识】06_functions/01_declaration_vs_expression.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    形参（parameter）是函数定义时括号里写的"占位变量名"；
 *    实参（argument）是调用时真正传进去的值。
 *    JS 的函数对参数个数几乎不做检查：传多了不报错，传少了也不报错。
 *
 * 2. 为什么需要
 *    JS 是动态类型语言，函数签名只是一个"建议"。这种松散设计让函数更灵活
 *    （比如可变参数、可选参数），但也要求开发者自己处理"没传"和"多传"的情况。
 *    默认参数（ES6 引入）就是为此而生的官方语法糖。
 *
 * 3. 核心语法要点
 *    (1) 缺少实参 → 对应形参的值是 undefined（不是 null）。
 *    (2) 多传实参 → 多出来的部分被"静默忽略"，但可以在 arguments 里拿到。
 *    (3) 默认值语法：`function f(a = 1) {}`，触发条件是该参数严格等于 undefined。
 *        传 null 不会触发默认值！这是最常见的坑。
 *    (4) arguments 是"类数组对象"（有 length 和索引，但没有数组方法），
 *        它是函数内部自动可用的隐式变量，箭头函数里没有。
 *    (5) arguments 会实时反映实参的变化，而且和"非严格模式的形参"互相联动。
 *
 * 4. 常见陷阱
 *    - 用 `a = a || 1` 当默认值：传 0、'' 或 false 时会被错误地替换掉。
 *    - 以为传 null 会走默认值。
 *    - 在箭头函数里用 arguments：会直接报 ReferenceError（或拿到外层的）。
 *    - 形参与 arguments 的双向联动（非严格模式下）导致难以排查的 bug。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/02_parameters.js
 *
 * 【预期输出】
 *   分别演示实参缺失、实参多余、默认值触发条件、arguments 的类数组特性，
 *   以及默认参数必须写在末尾等结论。
 * ============================================================================
 */

console.log('--- 1. 形参与实参的基本对应关系 ---');

// 形参 a、b；实参是 1、2。
function add(a, b) {
  return a + b;
}
console.log('add(1, 2) →', add(1, 2));

console.log('--- 2. 实参缺失：对应形参是 undefined ---');

function describe(name, age) {
  // age 没有传，所以是 undefined；undefined 参与字符串拼接会变成字符串 "undefined"。
  console.log(`  name = ${name}（类型 ${typeof name}）`);
  console.log(`  age  = ${age}（类型 ${typeof age}）`);
  // 注意：是 undefined 而不是 null，两者含义不同：
  //   undefined = "调用方没给值"；null = "调用方明确给了个空值"。
  console.log(`  age 是 undefined 吗？${age === undefined}`);
  console.log(`  age 是 null 吗？${age === null}`);
}
describe('小明');

console.log('--- 3. 实参多余：多余的被忽略，但 arguments 拿得到 ---');

function onlyTwo(a, b) {
  // arguments 是函数内部自动存在的隐式变量，包含本次调用的全部实参。
  console.log(`  形参 a = ${a}, b = ${b}`);
  console.log(`  arguments.length = ${arguments.length}`);
  console.log(`  全部实参 = ${Array.from(arguments).join(', ')}`);
}
onlyTwo(1, 2, 3, 4, 5);

console.log('--- 4. arguments 是"类数组"而不是真数组 ---');

function checkArguments() {
  console.log('  Array.isArray(arguments) →', Array.isArray(arguments)); // false
  console.log('  arguments.length →', arguments.length);
  console.log('  arguments[0] →', arguments[0]);
  // 没有数组方法，直接调用会报错，必须在内部 try/catch。
  try {
    arguments.map((x) => x);
  } catch (err) {
    console.log('  直接调用 arguments.map 报错类型：', err.constructor.name);
    console.log('  错误信息：', err.message);
  }
  // 正确做法：转成真数组后再用数组方法。
  const real = Array.from(arguments);
  console.log('  Array.from(arguments).map(x => x * 2) →', real.map((x) => x * 2));
}
checkArguments(10, 20, 30);

console.log('--- 5. 默认参数：语法与触发条件 ---');

// 默认值只在"实参严格等于 undefined"时才生效。
function greet(name = '游客', greeting = '你好') {
  return `${greeting}，${name}！`;
}
console.log('  greet()                    →', greet());
console.log('  greet("小明")              →', greet('小明'));
console.log('  greet(undefined, "Hi")     →', greet(undefined, 'Hi'));
// 关键坑：传 null 不会触发默认值，因为 null !== undefined。
console.log('  greet(null)                →', greet(null) + '   ← null 不触发默认值！');

console.log('--- 6. 用 || 做默认值的陷阱 ---');

// 老写法：看起来能用，但 0 / '' / false / NaN 都是"假值"，会被误替换。
function oldWay(count = 0) {}
function badDefault(count) {
  count = count || 10; // 只要 count 是假值就替换
  return count;
}
function goodDefault(count) {
  count = count === undefined ? 10 : count; // 只有 undefined 才替换
  return count;
}
function modernDefault(count = 10) {
  return count;
}
for (const v of [0, '', false, undefined]) {
  console.log(
    `  传入 ${String(v).padEnd(9)} → || : ${String(badDefault(v)).padEnd(5)}` +
      ` 三目 : ${String(goodDefault(v)).padEnd(5)} 默认参数 : ${modernDefault(v)}`,
  );
}
void oldWay;

console.log('--- 7. 默认参数不会改变 length，但影响 arguments 长度 ---');

// 注意：从第一个带默认值的形参开始（含它）之后的形参都不计入 function.length。
function lengthDemo(a, b = 1, c) {}
console.log('  function lengthDemo(a, b = 1, c) 的 length →', lengthDemo.length, '（只数到第一个默认值之前）');

function argCount() {
  return arguments.length;
}
console.log('  argCount()      →', argCount());
console.log('  argCount(1)     →', argCount(1));
console.log('  argCount(1,2,3) →', argCount(1, 2, 3));
console.log('  结论：arguments.length 反映调用方实际传了几个，与形参个数无关。');

console.log('--- 8. 默认参数求值时机：每次调用都重新求值 ---');

let counter = 0;
function withDynamicDefault(value = ++counter) {
  return value;
}
console.log('  第 1 次调用 →', withDynamicDefault(), '（counter =', counter, '）');
console.log('  第 2 次调用 →', withDynamicDefault(), '（counter =', counter, '）');
console.log('  第 3 次调用传了值 →', withDynamicDefault(99), '（counter 不变 =', counter, '）');
console.log('  结论：默认值表达式在"每次调用且该参数缺省"时才求值，不是定义时求值一次。');
