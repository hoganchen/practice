/**
 * ============================================================================
 * 知识点：为什么需要测试 —— 手工验证 vs 自动化，可回归与文档价值
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试基础
 * 【难度等级】入门
 * 【前置知识】06_functions（函数）、08_arrays（数组）中的基础内容
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "测试"就是把"我认为这段代码应该输出 X"这句心里话，写成机器能自己执行的代码。
 *    一段测试本质上是三件事：
 *      (1) 构造输入（Arrange / Given）
 *      (2) 调用被测代码（Act / When）
 *      (3) 断言结果符合预期（Assert / Then）
 *    这个三段式在业内叫 AAA 模式（Arrange-Act-Assert），几乎所有测试框架都围绕它设计。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    (a) 手工验证不可重复：改完代码在控制台里 console.log 看一眼，这次对了，
 *        下次再改别的地方时，没有任何东西会提醒你"上次那个功能坏了"。
 *    (b) 自动化测试可回归（regression）：一次写好，以后每次改动都能重跑。
 *        这是测试最大的价值 —— 它把"人肉记忆"变成了"可执行的记忆"。
 *    (c) 测试即文档：一个函数的用法、边界、错误行为，写在测试里比写在注释里更可靠，
 *        因为注释会过期，而测试一旦过期就会变红（失败）。
 *    (d) 支撑重构：没有测试时，重构等于赌博；有测试时，重构等于"改完跑一遍"。
 *
 * 3. 核心语法要点
 *    - 断言的本质是"比较 + 不满足就报错"。JS 里最原始的形式就是 throw。
 *    - 手写断言函数是理解测试框架的最好方式：所有框架（node:test / Jest / Vitest）
 *      的 assert/expect 都只是"更漂亮的 throw"。
 *    - 一个测试运行器（test runner）做三件事：收集测试、逐个执行、汇总通过/失败数量，
 *      并根据失败数量决定进程退出码（0 = 全通过，非 0 = 有失败）。
 *
 * 4. 常见陷阱
 *    - 只用 console.log 看输出，不用断言：人眼会漏看，且无法自动化。
 *    - 断言太弱：只断言"不报错"，不断言"结果正确"，等于没测。
 *    - 测试依赖执行顺序：测试之间应该互相独立，每个测试自己准备数据。
 *    - 把测试写成"实现镜像"：断言内部私有细节，导致重构时测试全红，
 *      应该断言"对外可见的行为"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/01_why_testing.js
 *
 * 【预期输出】
 *   先演示"没有断言的手工验证"有多脆弱，再演示手写断言函数如何自动报告失败，
 *   最后打印一份自制的极简测试报告（全部通过）。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 被测代码：一个真实项目中常见的价格计算模块
// ---------------------------------------------------------------------------

/**
 * 计算购物车总价。
 * 业务规则：
 *   - 商品单价 * 数量 累加得到小计
 *   - 满 100 减 10（简单促销）
 *   - 金额保留两位小数（避免浮点误差导致的 0.30000000000000004）
 *
 * @param {Array<{price: number, qty: number}>} items 购物车条目
 * @param {number} [discountThreshold=100] 满减门槛
 * @param {number} [discountAmount=10] 满减金额
 * @returns {number} 最终总价
 */
function calcTotal(items, discountThreshold = 100, discountAmount = 10) {
  // reduce 把数组"折叠"成一个值：累加每一条的 单价 * 数量
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  // 满减：只有达到门槛才减免
  const total = subtotal >= discountThreshold ? subtotal - discountAmount : subtotal;

  // 保留两位小数：先乘 100 再四舍五入再除 100，规避二进制浮点表示误差
  return Math.round(total * 100) / 100;
}

console.log('--- 1. 手工验证（没有断言的时代）---');

// 这是绝大多数人写代码时的第一反应：跑一下，用眼睛看结果对不对。
const demoCart = [
  { price: 19.9, qty: 2 },
  { price: 35.5, qty: 1 },
];

const manualResult = calcTotal(demoCart);
console.log('购物车：', JSON.stringify(demoCart));
console.log('手工计算：19.9 * 2 + 35.5 = 75.3，未满 100 不减，期望 75.3');
console.log('实际输出：', manualResult);
console.log('肉眼看是对的。但问题在于：');
console.log('  (1) 这个判断只存在于"我现在这一眼"里，没有留下任何可执行的记录；');
console.log('  (2) 明天别人改了 calcTotal，没有任何东西会提醒他 75.3 变成了别的数；');
console.log('  (3) 上线前有 300 个函数要验证时，人眼一定会漏。');

console.log('');
console.log('--- 2. 把"预期"写成机器可执行的断言 ---');

/**
 * 极简断言函数：所有测试框架的 assert 都是它的加强版。
 * 思路极其简单 —— 条件不成立就抛错（throw），成立了就什么都不做。
 *
 * @param {boolean} condition 断言条件
 * @param {string} message 断言失败时显示的说明
 */
function assert(condition, message) {
  if (!condition) {
    // 抛出异常是"报告失败"的唯一底层手段：调用方要么崩溃，要么捕获并记录
    throw new Error(`断言失败：${message}`);
  }
}

/**
 * 极简断言：比较两个值是否严格相等（===）。
 * 失败时把"期望值"和"实际值"都打印出来 —— 这是排错效率的关键，
 * 测试框架的 diff 输出就是在做这件事的豪华版。
 *
 * @param {unknown} actual 实际值
 * @param {unknown} expected 期望值
 * @param {string} message 说明
 */
function assertEqual(actual, expected, message) {
  if (!Object.is(actual, expected)) {
    throw new Error(`断言失败：${message}\n    期望：${String(expected)}\n    实际：${String(actual)}`);
  }
}

// 用断言重写上面的验证：这次"预期"变成了代码，而不是我脑子里的念头。
assertEqual(calcTotal(demoCart), 75.3, '未满 100 元时不应触发满减');
console.log('断言通过：calcTotal(75.3 的购物车) === 75.3');

// 边界：正好满 100 应该减 10
assertEqual(calcTotal([{ price: 100, qty: 1 }]), 90, '正好满 100 元应减 10');
console.log('断言通过：calcTotal(正好 100 的购物车) === 90');

// 边界：99.99 未达门槛
assertEqual(calcTotal([{ price: 99.99, qty: 1 }]), 99.99, '99.99 元未达门槛不减');
console.log('断言通过：calcTotal(99.99 的购物车) === 99.99');

// 浮点误差：0.1 + 0.2 在 IEEE 754 里不等于 0.3，这里验证我们做了两位小数处理
assertEqual(calcTotal([{ price: 0.1, qty: 1 }, { price: 0.2, qty: 1 }]), 0.3, '浮点累加后应四舍五入到两位小数');
console.log('断言通过：calcTotal(0.1 + 0.2 的购物车) === 0.3（原生 0.1 + 0.2 = ' + (0.1 + 0.2) + '）');

console.log('');
console.log('--- 3. 手工搭一个极简测试运行器（理解框架在做什么）---');

/**
 * 用例的数据结构：一个名字 + 一个"执行体"（函数）。
 * 执行体不抛错 = 通过，抛错 = 失败。
 */
const testCases = [
  {
    name: '空购物车总价为 0',
    // 每个测试自己准备数据，互不依赖 —— 这是测试独立性的最低要求
    fn: () => assertEqual(calcTotal([]), 0, '空数组应返回 0'),
  },
  {
    name: '多件商品累加正确',
    fn: () => assertEqual(calcTotal([{ price: 10, qty: 3 }, { price: 5, qty: 2 }]), 40, '30 + 10 = 40'),
  },
  {
    name: '满减门槛与减免金额可配置',
    fn: () =>
      assertEqual(
        calcTotal([{ price: 60, qty: 1 }], 50, 5),
        55,
        '门槛 50 减 5 时，60 元应付 55',
      ),
  },
  {
    name: '数量为 0 的商品不贡献金额',
    fn: () => assertEqual(calcTotal([{ price: 999, qty: 0 }, { price: 20, qty: 1 }]), 20, 'qty 为 0 应忽略'),
  },
];

/** 运行全部用例并统计结果，返回 { passed, failed, failures } */
function runAll(cases) {
  const failures = [];
  let passed = 0;

  for (const testCase of cases) {
    try {
      // 执行体正常返回 = 通过
      testCase.fn();
      passed += 1;
    } catch (error) {
      // 执行体抛错 = 失败，记录下来继续跑下一个（一个失败不该中断整轮）
      failures.push({ name: testCase.name, message: error.message });
    }
  }

  return { passed, failed: failures.length, failures, total: cases.length };
}

const result = runAll(testCases);

// 打印一份极简的测试报告 —— 这就是 Jest / node:test 输出格式的雏形
console.log(`共 ${result.total} 个用例，通过 ${result.passed} 个，失败 ${result.failed} 个`);
for (const failure of result.failures) {
  console.log(`  FAIL ${failure.name}\n    ${failure.message}`);
}

console.log('');
console.log('--- 4. 演示一个"会失败"的用例是怎么被发现的 ---');

// 故意写一个错误预期：满 100 减 10 后应该是 90，这里错误地写成 80。
// 在真实的 TDD 流程里，我们甚至会"先故意写错"来确认测试确实能捕获问题
// （业内叫 mutation testing 的思想：如果测试永远绿灯，它可能什么都没测）。
const wrongExpectation = runAll([
  {
    name: '（故意写错的预期）满 100 减 10 后应付 80',
    fn: () => assertEqual(calcTotal([{ price: 100, qty: 1 }]), 80, '这是一个错误的预期'),
  },
]);

console.log(`该用例结果：通过 ${wrongExpectation.passed} 个，失败 ${wrongExpectation.failed} 个（预期就是失败）`);
console.log('失败信息：');
for (const failure of wrongExpectation.failures) {
  console.log(`  ${failure.message}`);
}
console.log('这正是自动化测试的价值：它把"错了"变成了一句清晰、可复现、可追踪的报告。');

console.log('');
console.log('--- 5. 自动化测试的三个价值总结 ---');
console.log('  可回归：任何一次改动后重跑，立刻知道有没有破坏旧功能；');
console.log('  可文档化：测试用例就是"这个函数该怎么用"的可执行说明书；');
console.log('  可重构：有了安全网，才敢放心地改内部实现。');
console.log('');
console.log('演示结束。');
