/**
 * ============================================================================
 * 知识点：为纯函数写测试 —— 边界值、等价类划分、参数化测试
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试基础
 * 【难度等级】进阶
 * 【前置知识】28_testing/03_assert_module.js、28_testing/04_test_structure.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    纯函数 = 相同输入永远得到相同输出 + 不产生副作用。它是最好测的一类代码：
 *    不需要 mock、不需要异步、不需要清理，喂输入、看输出就行。
 *    但也正因为"输入空间可能无限"，怎么挑选要测的输入就成了方法论问题：
 *
 *      (a) 等价类划分（Equivalence Partitioning）
 *          把输入空间切成若干"行为相同"的区间，每个区间只挑一个代表值测试。
 *          比如"年龄"字段：负数 / 0~17 / 18~65 / 66 以上，这 4 类各测一个即可，
 *          没必要测 1、2、3、4…… 这是用最少的用例覆盖最多逻辑分支的方法。
 *
 *      (b) 边界值分析（Boundary Value Analysis）
 *          大量 bug 长在边界上：`>` 写成 `>=`、数组索引差一（off-by-one）。
 *          所以每个等价类的"边界点"要专门测：
 *          对区间 [18, 65] 应测 17、18、65、66 四个点（下边界外、下边界、
 *          上边界、上边界外）。
 *
 *      (c) 参数化测试（Parameterized / Table-driven Test）
 *          把"输入 -> 期望输出"做成一张表，循环生成用例。
 *          好处：加一个用例只需加一行数据；失败信息里每条用例有独立名字。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    真实项目里的钱、权限、状态机、格式化逻辑几乎都是纯函数。
 *    这些代码一旦出错就是生产事故，而它们的输入空间又极大。
 *    用等价类 + 边界值把"无穷的输入"压缩成"十几个精心挑选的用例"，
 *    是性价比最高的测试策略。参数化测试则让这些用例可维护 ——
 *    产品经理说"免运费门槛从 99 改成 199"，你只需要改表格里一个数字。
 *
 * 3. 核心语法要点
 *    - 参数化在 node:test 里的两种写法：
 *        (1) 循环 + test()：`for (const c of cases) test(c.name, () => ...)`
 *            每条用例在报告里独立一行，失败定位最清晰 —— 推荐。
 *        (2) 循环 + 断言：`for (const c of cases) assert.strictEqual(...)`
 *            报告里只有一行，失败后要靠消息区分 —— 简单但定位差。
 *    - 用例名里带上输入与期望值，失败时不用点开看代码就知道哪条挂了。
 *    - 边界值用常量表达意图：MIN_AGE、MAX_AGE，而不是散落的魔法数字。
 *
 * 4. 常见陷阱
 *    - 只测"正常路径"（happy path）：真实 bug 90% 在边界和异常输入上。
 *    - 等价类划分过粗：把"空数组"和"单元素数组"混在一类，会漏掉初始值 bug。
 *    - 用随机数据测试：失败不可复现。如果确实要用随机（property-based testing），
 *      必须固定随机种子并打印种子。
 *    - 浮点数直接相等比较：0.1 + 0.2 !== 0.3，金额计算应使用整数分或容差比较。
 *    - 测试里重复实现了被测逻辑：`assert.strictEqual(calc(a), a * 2 / 100)` ——
 *      如果被测代码的公式本来就写错了，你的"复算"也错得一样，测试永远绿。
 *      期望值应该是"独立算出来的、硬编码的具体数字"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/07_testing_pure_functions.js
 *
 * 【预期输出】
 *   打印 TAP 结果，展示等价类划分、边界值、参数化三种手法，全部通过，退出码 0。
 * ============================================================================
 */

import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// 被测代码：三个真实项目里常见的纯函数
// ---------------------------------------------------------------------------

/**
 * 1) 运费计算 —— 典型的"分段计价"，等价类和边界值分析的最佳教学案例。
 * 规则：
 *   订单金额 < 0        -> 抛错（非法输入，属于异常等价类）
 *    0 <= 金额 < 99     -> 运费 10 元
 *   99 <= 金额 < 199    -> 运费 5 元
 *   金额 >= 199         -> 免运费
 *
 * @param {number} amount 订单金额（元）
 * @returns {number} 运费（元）
 */
function calcShippingFee(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    throw new TypeError('订单金额必须是数字');
  }
  if (amount < 0) {
    throw new RangeError('订单金额不能为负数');
  }
  if (amount < 99) return 10; // 边界：99 不属于这一档
  if (amount < 199) return 5; // 边界：199 不属于这一档
  return 0;
}

/**
 * 2) 字符串首字母缩写 —— 练习"空输入/单元素/多空格"等边界。
 * @param {string} name
 * @returns {string} 例如 "john ronald reuel tolkien" -> "JRRT"
 */
function initials(name) {
  if (typeof name !== 'string') {
    throw new TypeError('name 必须是字符串');
  }
  // 用正则按"一个或多个空白"切分，能同时处理多余空格和制表符
  const parts = name.trim().split(/\s+/).filter(Boolean);
  // 空字符串处理：trim 后 split 会得到 ['']，filter(Boolean) 把它过滤掉
  return parts.map((word) => word[0].toUpperCase()).join('');
}

/**
 * 3) 分页计算 —— 数组类纯函数，边界极多（空数组、页码越界、最后一页不满）。
 * @param {Array<any>} items
 * @param {number} page 页码，从 1 开始
 * @param {number} pageSize 每页条数
 */
function paginate(items, page, pageSize) {
  if (!Array.isArray(items)) throw new TypeError('items 必须是数组');
  if (!Number.isInteger(page) || page < 1) throw new RangeError('page 必须是 >= 1 的整数');
  if (!Number.isInteger(pageSize) || pageSize < 1) throw new RangeError('pageSize 必须是 >= 1 的整数');

  const start = (page - 1) * pageSize;
  return {
    data: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    // Math.ceil(0 / 10) 是 0，但"空数据也应有 0 页"，所以这里保持 0 更符合直觉；
    // 如果产品要求"至少 1 页"，就在这里改成 Math.max(1, ...)。这种细节正是要靠测试锁定的。
    totalPages: Math.ceil(items.length / pageSize),
  };
}

// ---------------------------------------------------------------------------
console.log('--- 1. 等价类划分：把无穷输入压缩成有限的几类 ---');

// 思路：不逐个测 0,1,2,...,500，而是按"行为相同"划分区间，每类取一个代表。
// 运费函数的等价类：
//   A. 异常类：非数字、NaN、负数
//   B. 低价区（0 <= x < 99）
//   C. 中价区（99 <= x < 199）
//   D. 免运费区（x >= 199）
describe('calcShippingFee —— 等价类划分', () => {
  it('等价类 A：非法输入应抛错', () => {
    assert.throws(() => calcShippingFee('100'), TypeError, '字符串不是数字');
    assert.throws(() => calcShippingFee(NaN), TypeError, 'NaN 不是有效金额');
    assert.throws(() => calcShippingFee(-1), RangeError, '负数金额非法');
  });

  it('等价类 B：0 <= 金额 < 99，运费 10 元（代表值：50）', () => {
    assert.strictEqual(calcShippingFee(50), 10);
  });

  it('等价类 C：99 <= 金额 < 199，运费 5 元（代表值：150）', () => {
    assert.strictEqual(calcShippingFee(150), 5);
  });

  it('等价类 D：金额 >= 199，免运费（代表值：300）', () => {
    assert.strictEqual(calcShippingFee(300), 0);
  });
});

// ---------------------------------------------------------------------------
console.log('--- 2. 边界值分析：bug 最爱藏的地方 ---');

describe('calcShippingFee —— 边界值', () => {
  // 用常量表达边界，避免魔法数字散落在断言里
  const FREE_THRESHOLD = 199;
  const CHEAP_THRESHOLD = 99;

  it('下边界：0 元（最小合法值）', () => {
    assert.strictEqual(calcShippingFee(0), 10);
  });

  it('门槛 99 的两侧：98.99 收 10 元，99 收 5 元', () => {
    // 这一对断言专治 `<$` 写成 `<=$` 的 off-by-one bug
    assert.strictEqual(calcShippingFee(CHEAP_THRESHOLD - 0.01), 10);
    assert.strictEqual(calcShippingFee(CHEAP_THRESHOLD), 5);
  });

  it('门槛 199 的两侧：198.99 收 5 元，199 免运费', () => {
    assert.strictEqual(calcShippingFee(FREE_THRESHOLD - 0.01), 5);
    assert.strictEqual(calcShippingFee(FREE_THRESHOLD), 0);
  });

  it('极大值不应溢出或改变行为', () => {
    assert.strictEqual(calcShippingFee(Number.MAX_SAFE_INTEGER), 0);
    assert.strictEqual(calcShippingFee(Infinity), 0, 'Infinity 也 >= 199，免运费');
  });
});

describe('initials —— 边界值', () => {
  it('空字符串 -> 空字符串（最容易漏的边界）', () => {
    assert.strictEqual(initials(''), '');
  });

  it('纯空白字符串 -> 空字符串', () => {
    // 如果不做 trim + filter，'   '.split(/\s+/) 会产出空串元素并导致崩溃
    assert.strictEqual(initials('   '), '');
    assert.strictEqual(initials('\t\n '), '');
  });

  it('单个单词 -> 单个首字母', () => {
    assert.strictEqual(initials('alice'), 'A');
  });

  it('多个单词（含多余空格、制表符、前后空白）', () => {
    assert.strictEqual(initials('john ronald reuel tolkien'), 'JRRT');
    assert.strictEqual(initials('  john   ronald\ttoLkien  '), 'JRT');
  });

  it('非字符串输入 -> 抛错', () => {
    assert.throws(() => initials(null), TypeError);
    assert.throws(() => initials(42), TypeError);
  });
});

describe('paginate —— 边界值', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1); // [1..25]

  it('空数组：data 为空，totalPages 为 0', () => {
    assert.deepStrictEqual(paginate([], 1, 10), {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
  });

  it('第一页：取满一页', () => {
    assert.deepStrictEqual(paginate(items, 1, 10).data, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('最后一页不满：只返回剩余元素（25 条 / 每页 10 -> 第 3 页只有 5 条）', () => {
    assert.deepStrictEqual(paginate(items, 3, 10).data, [21, 22, 23, 24, 25]);
    assert.strictEqual(paginate(items, 3, 10).totalPages, 3);
  });

  it('页码越界：返回空数组而不是抛错', () => {
    // 这是"契约"问题：越界到底该抛错还是返回空？产品决策后由测试锁定下来
    assert.deepStrictEqual(paginate(items, 99, 10).data, []);
  });

  it('pageSize 大于总数：一页装下全部', () => {
    const result = paginate(items, 1, 100);
    assert.strictEqual(result.data.length, 25);
    assert.strictEqual(result.totalPages, 1);
  });

  it('pageSize = 1 的极端情况：totalPages 等于元素个数', () => {
    assert.strictEqual(paginate(items, 1, 1).totalPages, 25);
    assert.deepStrictEqual(paginate(items, 25, 1).data, [25]);
  });

  it('非法参数应抛错', () => {
    assert.throws(() => paginate('not-array', 1, 10), TypeError);
    assert.throws(() => paginate(items, 0, 10), RangeError, 'page 从 1 开始');
    assert.throws(() => paginate(items, 1.5, 10), RangeError, 'page 必须是整数');
    assert.throws(() => paginate(items, 1, 0), RangeError, 'pageSize 至少为 1');
  });
});

// ---------------------------------------------------------------------------
console.log('--- 3. 参数化测试：把用例写成表格 ---');

// 一张"输入 -> 期望输出"的表。加用例 = 加一行数据。
// 每条数据带上 name 字段，这样失败时报告里能直接看出是哪条挂了。
const shippingCases = [
  // --- 边界值：门槛两侧 ---
  { name: '金额 0 -> 运费 10（下边界）', input: 0, expected: 10 },
  { name: '金额 98.99 -> 运费 10（99 门槛内侧）', input: 98.99, expected: 10 },
  { name: '金额 99 -> 运费 5（99 门槛外侧）', input: 99, expected: 5 },
  { name: '金额 198.99 -> 运费 5（199 门槛内侧）', input: 198.99, expected: 5 },
  { name: '金额 199 -> 运费 0（199 门槛外侧，免运费）', input: 199, expected: 0 },
  // --- 等价类代表值 ---
  { name: '金额 50 -> 运费 10（低价区代表值）', input: 50, expected: 10 },
  { name: '金额 150 -> 运费 5（中价区代表值）', input: 150, expected: 5 },
  { name: '金额 1000 -> 运费 0（免运费区代表值）', input: 1000, expected: 0 },
  // --- 小数与精度 ---
  { name: '金额 0.01 -> 运费 10（最小正数）', input: 0.01, expected: 10 },
  { name: '金额 98.999999 -> 运费 10（浮点边界内侧）', input: 98.999999, expected: 10 },
];

// 写法一（推荐）：循环 + test()，每条用例在 TAP 报告里独立一行。
// 优点：失败定位精准到具体数据行，且可以单独重跑某一条。
describe('calcShippingFee —— 参数化（循环 + test，每条独立报告）', () => {
  for (const testCase of shippingCases) {
    test(testCase.name, () => {
      assert.strictEqual(
        calcShippingFee(testCase.input),
        testCase.expected,
        `金额 ${testCase.input} 的运费应为 ${testCase.expected}`,
      );
    });
  }
});

// 写法二：循环 + 断言，报告里只有一行。
// 优点：代码短；缺点：失败要先看消息才知道是哪条。
// 适合"一个函数 + 十几条同质数据"的快速覆盖。
describe('calcShippingFee —— 参数化（循环 + 断言，报告只有一行）', () => {
  it('全部 10 条数据一次断言完', () => {
    for (const testCase of shippingCases) {
      assert.strictEqual(
        calcShippingFee(testCase.input),
        testCase.expected,
        `失败于用例「${testCase.name}」`,
      );
    }
  });
});

// ---------------------------------------------------------------------------
console.log('--- 4. 参数化：initials 的表格 ---');

const initialsCases = [
  { input: '', expected: '', note: '空字符串' },
  { input: '   ', expected: '', note: '纯空白' },
  { input: 'a', expected: 'A', note: '单字符' },
  { input: 'alice', expected: 'A', note: '单词首字母大写' },
  { input: 'alice bob', expected: 'AB', note: '两个单词' },
  { input: 'john ronald reuel tolkien', expected: 'JRRT', note: '四个单词' },
  { input: '  padded  name  ', expected: 'PN', note: '前后空白应被忽略' },
  { input: 'multi\tseparator\nname', expected: 'MSN', note: '制表符与换行也是分隔符' },
  { input: '中文 name', expected: '中N', note: '注意：中文取首字符而不是拼音首字母' },
];

describe('initials —— 参数化', () => {
  for (const testCase of initialsCases) {
    test(`${testCase.note}：${JSON.stringify(testCase.input)} -> ${JSON.stringify(testCase.expected)}`, () => {
      assert.strictEqual(initials(testCase.input), testCase.expected);
    });
  }
});

// ---------------------------------------------------------------------------
console.log('--- 5. 反面教材：这些"测试"写了等于没写 ---');

describe('测试反模式', () => {
  it('反模式一：重复实现被测逻辑（公式错了会一起错）', () => {
    const amount = 150;
    // 坏：期望值由"我再算一遍同样的公式"得出。
    // 一旦需求变成"99~199 收 8 元"，把实现改错成 8 元，这个测试依然通过。
    // 好：期望值应该是独立确定的硬编码数字（下面这种写法）。
    assert.strictEqual(calcShippingFee(amount), 5);
    // 说明一下错在哪
    assert.notStrictEqual(calcShippingFee(amount), 8, '如果这条挂了，说明实现被改成了错误的 8 元');
  });

  it('反模式二：只断言"不抛错"，不断言结果', () => {
    // 坏：这个断言几乎永远通过，哪怕函数返回了错误的值
    assert.doesNotThrow(() => calcShippingFee(150));
    // 好：必须断言具体返回值
    assert.strictEqual(calcShippingFee(150), 5);
  });

  it('反模式三：浮点金额用严格相等（应改用整数分或容差）', () => {
    // 0.1 + 0.2 !== 0.3，这是 IEEE 754 的固有特性，不是 bug
    assert.notStrictEqual(0.1 + 0.2, 0.3);
    // 正确做法一：用整数"分"参与计算，最后再除以 100
    const cents = (amount) => Math.round(amount * 100);
    assert.strictEqual(cents(0.1) + cents(0.2), cents(0.3));
    // 正确做法二：用容差比较
    const approxEqual = (a, b, epsilon = Number.EPSILON) => Math.abs(a - b) < epsilon;
    assert.ok(approxEqual(0.1 + 0.2, 0.3, 1e-9));
  });
});

// ---------------------------------------------------------------------------
console.log('--- 6. 纯函数测试方法论小结 ---');
console.log('  1. 先列等价类（输入空间有哪些"行为不同"的区间）；');
console.log('  2. 再对每个等价类的两端取值（下边界外、下边界、上边界、上边界外）；');
console.log('  3. 别忘了异常等价类（null / NaN / 负数 / 错误类型）；');
console.log('  4. 把用例做成表格，用循环生成测试，失败时名字自带输入与期望；');
console.log('  5. 期望值必须独立可信（硬编码的具体数字），不要复算被测公式；');
console.log('  6. 浮点用整数分或容差，不要用 ===。');
console.log('');
console.log('演示结束。');
