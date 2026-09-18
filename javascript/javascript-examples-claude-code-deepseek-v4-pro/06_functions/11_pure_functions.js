/**
 * ============================================================================
 * 知识点：纯函数 —— 定义、副作用、引用透明、为什么重要
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】进阶
 * 【前置知识】06_functions/08_higher_order_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    纯函数（pure function）必须同时满足两个条件：
 *      (1) 相同输入永远得到相同输出（确定性 / 引用透明）；
 *      (2) 没有任何可观察的副作用——不修改外部状态、不改动传入的参数、
 *          不做 I/O（打印、读写文件、发请求）、不依赖会变化的外部状态。
 *    简单判断法：把这个函数调用一万遍，除了"返回值"之外，程序的其他部分
 *    应该和只调用一次完全一样。
 *
 * 2. 为什么需要
 *    (1) 易测试：不用准备环境、不用 mock，给参数、比结果就行。
 *    (2) 可缓存：输入一样结果就一定一样，天然适合 memoize。
 *    (3) 可并行/可重排：没有共享状态，先算后算都一样（React、Redux、
 *        多线程/Worker 场景都靠这个性质）。
 *    (4) 易推理：读代码时只看函数体就知道它在干什么，不用追全局变量。
 *    一句话：纯函数把"不可控"变成"可控"，是函数式编程的基石。
 *
 * 3. 核心语法要点
 *    (1) 不修改参数：用展开运算符 / Object.assign / map 等"复制后修改"。
 *    (2) 不用外部可变变量：需要的值一律从参数进来。
 *    (3) 不用 Math.random / Date.now / new Date() —— 它们让输出不可预测。
 *    (4) 不用 console.log —— 打印本身也是副作用（教学示例为了演示才打印，
 *        真正的纯函数应该是"静默"的）。
 *    (5) 纯函数不等于"没有副作用"，而是"不产生副作用"；
 *        副作用本身并不邪恶，只是应该被推到程序边界上集中处理。
 *
 * 4. 常见陷阱
 *    - 参数是对象/数组时，"修改属性"会连调用方的数据一起改掉（引用共享）。
 *    - 用 sort 直接排序传入的数组：sort 会原地修改，破坏纯性（应用 [...arr].sort()）。
 *    - 用了 Math.random 之后还以为它是纯函数。
 *    - 依赖闭包外的可变变量（比如模块级 let），调用顺序不同结果就不同。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/11_pure_functions.js
 *
 * 【预期输出】
 *   对比纯函数与非纯函数的行为差异，演示"改参数"造成的意外副作用，
 *   并给出把非纯函数改造成纯函数的几种手法。
 * ============================================================================
 */

console.log('--- 1. 纯函数：相同输入 → 相同输出 ---');

// 彻底的纯函数：只看参数，只返回结果。
function add(a, b) {
  return a + b;
}
console.log('  add(2, 3) 第一次 →', add(2, 3));
console.log('  add(2, 3) 第二次 →', add(2, 3));
console.log('  add(2, 3) 第三次 →', add(2, 3), '（永远一样）');

// 稍微复杂的纯函数：数组 → 新数组。
function doubleAll(numbers) {
  // map 返回新数组，不改原数组，所以它是纯的。
  return numbers.map((n) => n * 2);
}
const source = [1, 2, 3];
const doubledTwice = [doubleAll(source), doubleAll(source)];
console.log('  原数组 →', source, '（没被改动）');
console.log('  doubleAll 调用两次 →', doubledTwice, '（结果完全一致）');

console.log('--- 2. 非纯函数之一：依赖外部可变状态 ---');

let taxRate = 0.1; // 模块级可变变量

// 同样的参数，taxRate 变了结果就变 —— 违反"确定性"。
function priceWithTaxImpure(price) {
  return price * (1 + taxRate);
}
console.log('  taxRate = 0.1 时，priceWithTaxImpure(100) →', priceWithTaxImpure(100));
taxRate = 0.2; // 外部状态被改动
console.log('  taxRate = 0.2 时，priceWithTaxImpure(100) →', priceWithTaxImpure(100), '  ← 输入没变，输出变了');

// 改造成纯函数：把税率变成参数。
function priceWithTaxPure(price, rate) {
  return price * (1 + rate);
}
console.log('  priceWithTaxPure(100, 0.1) →', priceWithTaxPure(100, 0.1), '（末尾的 0000001 是 IEEE 754 浮点误差，与纯不纯无关）');
console.log('  priceWithTaxPure(100, 0.2) →', priceWithTaxPure(100, 0.2), '  ← 输入确定，输出确定');

console.log('--- 3. 非纯函数之二：副作用（修改函数外部的东西） ---');

let total = 0;
function accumulateImpure(n) {
  total += n; // 修改了外部变量：副作用
  return total;
}
console.log('  accumulateImpure(1) →', accumulateImpure(1), '（此时 total =', total, '）');
console.log('  accumulateImpure(1) →', accumulateImpure(1), '（同样的输入，结果变成', total, '了）');

// 纯函数版：用累加器参数把状态"显式化"。
function accumulatePure(list) {
  return list.reduce((acc, n) => acc + n, 0);
}
console.log('  accumulatePure([1])   →', accumulatePure([1]));
console.log('  accumulatePure([1])   →', accumulatePure([1]), '（结果稳定）');
console.log('  accumulatePure([1, 1]) →', accumulatePure([1, 1]), '（状态通过参数传入，不再藏在外部）');

console.log('--- 4. 最隐蔽的副作用：修改传入的参数 ---');

// 看起来像纯函数，实际上改了调用方的数组。
function sortImpure(arr) {
  return arr.sort((a, b) => a - b); // sort 是原地排序！
}
const original = [3, 1, 2];
const returned = sortImpure(original);
console.log('  调用前 original →', [3, 1, 2]);
console.log('  调用后 original →', original, '  ← 被改掉了！');
console.log('  返回值与 original 是同一个数组吗？', returned === original);

// 纯函数版：先复制再排序。
function sortPure(arr) {
  return [...arr].sort((a, b) => a - b); // 展开运算符做浅拷贝
}
const original2 = [3, 1, 2];
const sorted2 = sortPure(original2);
console.log('  纯函数版：original2 →', original2, '（纹丝不动）');
console.log('  纯函数版：sorted2   →', sorted2);

// 对象同理：直接改属性也是副作用。
function setNameImpure(user, name) {
  user.name = name; // 改了传入对象的属性
  return user;
}
function setNamePure(user, name) {
  return { ...user, name }; // 返回新对象，原对象不动
}
const userA = { name: '小明', age: 18 };
const userB = setNamePure(userA, '小红');
console.log('  纯函数改对象：userA →', userA, '（没变）');
console.log('  纯函数改对象：userB →', userB, '（新对象）');
const userC = setNameImpure(userA, '小刚');
console.log('  非纯函数改对象：userA →', userA, '  ← 被污染了');
console.log('  userC === userA 吗？', userC === userA, '（是同一个对象）');

console.log('--- 5. 非纯函数之三：不确定性来源（随机、时间）---');

function makeIdImpure() {
  return Math.random().toString(36).slice(2);
}
function nowImpure() {
  return Date.now();
}
// 两次调用结果不同 —— 不是纯函数。
console.log('  makeIdImpure() 第一次 →', makeIdImpure());
console.log('  makeIdImpure() 第二次 →', makeIdImpure(), '（每次都不同）');
console.log('  nowImpure() 第一次 →', typeof nowImpure(), '（时间每次都不同）');

// 纯函数版：把"不确定性"变成参数注入。
function makeIdPure(seed, length = 8) {
  // 一个确定性的伪随机（只做演示，不具备密码学安全性）。
  let x = seed;
  let out = '';
  for (let i = 0; i < length; i++) {
    x = (x * 1103515245 + 12345) % 2147483648; // 线性同余
    out += 'abcdefghijklmnopqrstuvwxyz0123456789'[x % 36];
  }
  return out;
}
console.log('  makeIdPure(42) →', makeIdPure(42));
console.log('  makeIdPure(42) →', makeIdPure(42), '（同样的 seed 永远得到同样的结果）');

console.log('--- 6. 引用透明（referential transparency） ---');

// 引用透明的意思是：一个表达式可以被它的"结果值"替换，而程序行为不变。
// 这对纯函数成立：
console.log('  add(2, 3) + add(2, 3) →', add(2, 3) + add(2, 3));
console.log('  （等价于把 add(2,3) 全部替换成 5：5 + 5 =', 5 + 5, '）');

// 对非纯函数不成立：
console.log('  accumulateImpure(1) + accumulateImpure(1) →', accumulateImpure(1) + accumulateImpure(1));
console.log('  （若替换成同一个值就会算错，所以它不满足引用透明）');

console.log('--- 7. 纯函数的第一个红利：天然可缓存（memoize）---');

// 因为"输入相同结果必相同"，所以可以放心用缓存。
function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    // 用参数的 JSON 字符串当缓存键（够用即可，真实项目会考虑更严谨的键）。
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const value = fn(...args);
    cache.set(key, value);
    return value;
  };
}

let heavyCallCount = 0;
function heavyCompute(n) {
  heavyCallCount++;
  let s = 0;
  for (let i = 0; i < n; i++) s += i;
  return s;
}
const memoHeavy = memoize(heavyCompute);
console.log('  第 1 次 memoHeavy(100000) →', memoHeavy(100000), '（真实计算次数：', heavyCallCount, '）');
console.log('  第 2 次 memoHeavy(100000) →', memoHeavy(100000), '（真实计算次数：', heavyCallCount, '，命中缓存）');
console.log('  换成 memoHeavy(1000)     →', memoHeavy(1000), '（真实计算次数：', heavyCallCount, '，参数变了才重算）');
console.log('  前提：只有纯函数才敢这么缓存，非纯函数缓存后结果会过时或错误。');

console.log('--- 8. 纯函数的第二个红利：易测试 ---');

// 纯函数的测试不需要任何准备和清理，直接断言输入输出。
function assertEqual(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`  ${ok ? '✓' : '✗'} ${label}：期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
}
assertEqual(add(2, 3), 5, 'add(2,3)');
// 注意：浮点运算 100 * (1 + 0.1) 的结果是 110.00000000000001，所以先四舍五入到两位小数。
assertEqual(Number(priceWithTaxPure(100, 0.1).toFixed(2)), 110, 'priceWithTaxPure(100, 0.1)');
assertEqual(sortPure([3, 1, 2]), [1, 2, 3], 'sortPure([3,1,2])');
assertEqual(sortPure([3, 1, 2]), [1, 2, 3], 'sortPure 再跑一次（仍然一致）');
console.log('  注意最后两行：想验证"不修改原数组"，只要在断言后检查入参即可，无需任何 mock。');

console.log('--- 9. 实战对比：一段"顺手写"的代码如何变纯 ---');

const cart = [
  { name: '键盘', price: 300, qty: 1 },
  { name: '鼠标', price: 150, qty: 2 },
];

// 非纯版：往全局里塞变量，还把结果写进外部数组。
const reportImpure = [];
function checkoutImpure(items) {
  let sum = 0;
  for (const item of items) {
    item.price = item.price * 0.9; // 改了原数据（副作用一）
    sum += item.price * item.qty;
  }
  reportImpure.push(sum); // 修改外部数组（副作用二）
  return sum;
}
console.log('  非纯版结果 →', checkoutImpure(cart));
console.log('  此时 cart 已经被改了 →', cart, '  ← 商品价格被永久打折了');
console.log('  外部数组也被塞了东西 →', reportImpure);

// 纯函数版：输入 → 输出，别的什么都不碰。
function checkoutPure(items, discount = 0) {
  const total = items.reduce((acc, item) => acc + item.price * item.qty * (1 - discount), 0);
  // 只返回一个全新的结果对象，不修改任何外部状态。
  return { total: Math.round(total * 100) / 100, itemCount: items.length };
}
const freshCart = [
  { name: '键盘', price: 300, qty: 1 },
  { name: '鼠标', price: 150, qty: 2 },
];
console.log('  纯函数版（无折扣）→', checkoutPure(freshCart));
console.log('  纯函数版（9 折）  →', checkoutPure(freshCart, 0.1));
console.log('  再跑一次原参数     →', checkoutPure(freshCart), '（结果稳定，freshCart 也没被改）');
console.log('  现在 freshCart →', freshCart);

console.log('--- 10. 小结 ---');
console.log('  纯函数 = 确定性 + 无副作用；好处 = 好测试、可缓存、可并行、易推理。');
console.log('  实践建议：核心业务逻辑尽量写成纯函数，');
console.log('            把副作用（打印、读写、请求、随机、时间）集中到程序的最外层处理。');
