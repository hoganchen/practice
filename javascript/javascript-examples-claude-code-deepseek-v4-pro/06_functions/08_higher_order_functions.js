/**
 * ============================================================================
 * 知识点：高阶函数 —— 函数作为参数、函数作为返回值
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】进阶
 * 【前置知识】06_functions/04_arrow_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    高阶函数（Higher-Order Function, HOF）是满足下面任意一条的函数：
 *      (1) 接收一个或多个函数作为参数；
 *      (2) 返回一个函数作为结果。
 *    换句话说：函数在 JS 里是"一等公民（first-class citizen）"——
 *    可以像数字、字符串一样被赋值、传参、返回。
 *    满足条件 (1) 的参数函数通常叫"回调函数"，满足条件 (2) 的返回值
 *    通常用来做"函数的工厂"。
 *
 * 2. 为什么需要
 *    高阶函数是"把行为参数化"的手段。写排序时你不想为每种比较规则
 *    复制一遍排序算法，于是把"怎么比较"抽成一个函数传进去；写网络请求时
 *    你不想为每种响应处理复制一遍请求逻辑，于是把"拿到数据后做什么"传进去。
 *    它的价值在于：把"做什么"（行为）从"怎么做"（流程）里剥离，
 *    让流程代码只写一次、行为可以无限扩展。这正是函数式编程的基础。
 *
 * 3. 核心语法要点
 *    (1) 函数作为参数：把函数名（不加括号）传进去。
 *          arr.map(fn)      ← 传的是函数本身
 *          arr.map(fn())    ← 传的是 fn() 的执行结果，通常是错的！
 *    (2) 函数作为返回值：外层函数执行后返回内层函数，内层函数会"记住"
 *        外层作用域的变量，这就是闭包的典型应用。
 *    (3) 内置的高阶函数很多：map / filter / reduce / forEach / sort / some /
 *        every / find，以及 setTimeout、Promise.then 等。
 *    (4) 高阶函数可以层层嵌套、组合，形成"管道式"的数据处理流程。
 *
 * 4. 常见陷阱
 *    - 传参时多写了括号，把"函数"变成了"函数的返回值"。
 *    - 在 map/filter 的回调里忘了 return（用了花括号就必须显式 return）。
 *    - 直接把有 this 需求的方法当回调传（会丢 this，需 bind 或箭头函数包裹）。
 *    - 返回函数时误用了"调用"（返回的是结果而不是函数本身）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/08_higher_order_functions.js
 *
 * 【预期输出】
 *   演示函数作为参数、作为返回值、内置高阶函数、以及用高阶函数
 *   对同一套数据做不同处理（行为参数化）的完整过程。
 * ============================================================================
 */

console.log('--- 1. 函数是一等公民：可以像值一样传 ---');

// 定义一个普通的"行为"函数。
function double(x) {
  return x * 2;
}
// 把函数赋值给变量（不带括号，传的是函数对象本身）。
const alias = double;
console.log('  double(21)      →', double(21));
console.log('  alias(21)       →', alias(21), '（同一个函数）');
console.log('  double === alias →', double === alias);

// 把函数放进数组、对象，是"策略表"的常见写法。
const strategies = { double, triple: (x) => x * 3, square: (x) => x * x };
console.log('  strategies.double(5) →', strategies.double(5));
console.log('  strategies.triple(5) →', strategies.triple(5));
console.log('  strategies.square(5) →', strategies.square(5));

console.log('--- 2. 函数作为参数：最基础的高阶函数 ---');

// applyTwice 自己不做具体计算，它只负责"执行两遍"，具体算什么由参数决定。
function applyTwice(fn, value) {
  return fn(fn(value));
}
console.log('  applyTwice(double, 5)              →', applyTwice(double, 5), '（5*2*2）');
console.log('  applyTwice((x) => x + 10, 5)       →', applyTwice((x) => x + 10, 5), '（5+10+10）');
console.log('  applyTwice((s) => s + "!", "哇")    →', applyTwice((s) => s + '!', '哇'));

// 传参时加不加括号，结果天差地别。
console.log('  传函数本身 applyTwice(double, 5) →', applyTwice(double, 5));
try {
  // double(5) 先被求值成 10，然后 applyTwice(10, 5) 里 fn 是数字 10，
  // 调用 10(10) 直接抛 TypeError。
  applyTwice(double(5), 5);
} catch (err) {
  console.log('  传函数调用结果 → 报错', err.constructor.name, ':', err.message);
}

console.log('--- 3. 内置高阶函数速览 ---');

const nums = [1, 2, 3, 4, 5, 6];
console.log('  原始数组           →', nums);
console.log('  map(x => x * 2)    →', nums.map((x) => x * 2), '  ← 映射：一对一转换');
console.log('  filter(x => x % 2) →', nums.filter((x) => x % 2), '  ← 过滤：保留满足条件的');
console.log('  reduce((a,b) => a+b, 0) →', nums.reduce((a, b) => a + b, 0), '  ← 归约：聚合成一个值');
console.log('  some(x => x > 5)   →', nums.some((x) => x > 5), '  ← 存在满足条件的吗');
console.log('  every(x => x > 0)  →', nums.every((x) => x > 0), '  ← 全部满足条件吗');
console.log('  find(x => x > 3)   →', nums.find((x) => x > 3), '  ← 找第一个满足条件的');

// 链式组合：先过滤、再映射、最后求和，把多个高阶函数串成流水线。
const pipelineResult = nums
  .filter((x) => x % 2 === 0) // 留下 2, 4, 6
  .map((x) => x * 10) // 变成 20, 40, 60
  .reduce((a, b) => a + b, 0); // 求和 120
console.log('  链式流水线：偶数 → 乘 10 → 求和 →', pipelineResult);

console.log('--- 4. 高阶函数的威力：行为参数化 ---');

// 同一套"处理订单"的流程，通过传入不同函数实现不同的折扣与筛选规则。
const orders = [
  { id: 'A001', amount: 1200, vip: true },
  { id: 'A002', amount: 300, vip: false },
  { id: 'A003', amount: 800, vip: true },
  { id: 'A004', amount: 150, vip: false },
];

// processOrders 只关心"流程"：筛选 → 打折 → 汇总。
// "怎么筛选""怎么打折"全部由参数决定，这就是行为参数化。
function processOrders(list, filterFn, discountFn) {
  return list.filter(filterFn).map((order) => ({
    ...order,
    finalAmount: Math.round(discountFn(order.amount) * 100) / 100,
  }));
}

// 规则一：只看 VIP 订单，VIP 打 8 折。
const planA = processOrders(
  orders,
  (o) => o.vip,
  (amount) => amount * 0.8,
);
console.log('  方案 A（VIP 8 折）：');
for (const o of planA) console.log(`    ${o.id} 原价 ${o.amount} → 折后 ${o.finalAmount}`);

// 规则二：只看满 500 的订单，满 1000 打 7 折、否则 9 折。
const planB = processOrders(
  orders,
  (o) => o.amount >= 500,
  (amount) => (amount >= 1000 ? amount * 0.7 : amount * 0.9),
);
console.log('  方案 B（满 500 参与，满 1000 打 7 折）：');
for (const o of planB) console.log(`    ${o.id} 原价 ${o.amount} → 折后 ${o.finalAmount}`);
console.log('  注意：processOrders 的代码一行没改，规则完全由传入的函数决定。');

console.log('--- 5. 函数作为返回值：函数工厂 ---');

// makeMultiplier 返回一个新函数，新函数"记住"了 factor。
function makeMultiplier(factor) {
  // 返回的是函数本身（不是调用结果），所以这里不能写 factor * x 的结果。
  return function (x) {
    return x * factor;
  };
}
const times2 = makeMultiplier(2);
const times10 = makeMultiplier(10);
console.log('  times2(21)       →', times2(21));
console.log('  times10(21)      →', times10(21));
console.log('  times2(3) + times10(3) →', times2(3) + times10(3), '（两个函数互不干扰，各有自己的 factor）');

// 用箭头函数写更紧凑，但可读性上"先写 function、再改箭头"更稳妥。
const makeAdder = (base) => (x) => x + base;
const add100 = makeAdder(100);
console.log('  add100(5)        →', add100(5));

console.log('--- 6. 实战：带日志的包装器（装饰器思想） ---');

// withLogging 接收一个函数，返回一个"加了日志"的新函数。
// 这是高阶函数最实用的形态之一：在不修改原函数的前提下增强它。
function withLogging(fn, label) {
  // 注意这里用的是 function，不是箭头函数，这样才能把调用时的 this 和参数原样转发。
  return function (...args) {
    const started = process.hrtime.bigint();
    const result = fn.apply(this, args);
    const costNs = Number(process.hrtime.bigint() - started);
    console.log(`    [日志] ${label}(${args.join(', ')}) → ${result}，耗时 ${costNs}ns`);
    return result;
  };
}

function slowAdd(a, b) {
  // 故意做一点计算，让耗时不为 0（这里是同步的纯计算，不涉及任何 I/O）。
  let s = 0;
  for (let i = 0; i < 100000; i++) s += i % 7;
  return a + b + (s - s); // s - s 恒为 0，保证结果只由 a、b 决定
}
const loggedAdd = withLogging(slowAdd, 'slowAdd');
console.log('  调用被包装后的函数：');
console.log('    返回值为', loggedAdd(3, 4));

console.log('--- 7. 实战：可配置的重试器（返回函数 + 闭包） ---');

// makeRetry 返回一个"会重试的函数"。重试次数固定在闭包里。
function makeRetry(fn, maxAttempts) {
  return function (...args) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return fn.apply(this, args);
      } catch (err) {
        lastError = err;
        console.log(`    第 ${attempt} 次尝试失败：${err.message}`);
      }
    }
    // 全部失败后把最后一个错误抛出去，由调用方决定怎么处理。
    throw lastError;
  };
}

let callCount = 0;
function flaky() {
  callCount++;
  if (callCount < 3) throw new Error('模拟的偶发失败');
  return `第 ${callCount} 次成功`;
}
const retried = makeRetry(flaky, 5);
console.log('  调用带重试的函数：');
console.log('    最终结果 →', retried());

console.log('--- 8. 高阶函数 vs 普通函数：判断标准 ---');

// 只做具体计算，不接收也不返回函数 → 不是高阶函数。
function notHof(a, b) {
  return a + b;
}
// 接收函数 → 是高阶函数。
function isHof1(fn) {
  return fn();
}
// 返回函数 → 也是高阶函数。
function isHof2() {
  return () => 'hi';
}
// 两者兼有 → 更是高阶函数。
function isHof3(before, after) {
  return (...args) => after(before(...args));
}
console.log('  notHof(1, 2)          →', notHof(1, 2), '（不是高阶函数）');
console.log('  isHof1(() => "hi")    →', isHof1(() => 'hi'), '（接收函数）');
console.log('  isHof2()()            →', isHof2()(), '（返回函数）');
console.log('  isHof3(x => x + 1, x => x * 2)(5) →', isHof3((x) => x + 1, (x) => x * 2)(5), '（先+1再*2 = 12）');
