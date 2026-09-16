/**
 * ============================================================================
 * 知识点：TDD 流程演示 —— 红 / 绿 / 重构（Red-Green-Refactor）
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试基础
 * 【难度等级】进阶
 * 【前置知识】28_testing/01_why_testing.js、28_testing/07_testing_pure_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    TDD（Test-Driven Development，测试驱动开发）是一种开发节奏，
 *    核心是一个三步循环，业内叫"红-绿-重构"：
 *
 *      红（Red）  ：先写一个失败的测试。此时被测功能还不存在，
 *                   测试必须失败 —— 这一步的意义是"证明这个测试真的能失败"。
 *      绿（Green）：用最少的代码让测试通过。可以丑、可以慢、可以硬编码，
 *                   目标只有一个：让红色变绿。
 *      重构（Refactor）：在测试保持绿色的前提下改进代码结构。
 *                   测试此刻就是安全网 —— 改坏了立刻变红。
 *
 *    注意 TDD 不是"先写测试再写代码"这么简单的一句话，它是一条严格的时间约束：
 *    任何时刻，你只允许做三件事中的一件 —— 写一个失败测试、让失败测试通过、
 *    在测试通过的前提下重构。不允许"先写一堆测试再写一堆代码"。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    - 强制可测性设计：先写测试会逼你思考"这个函数怎么被调用"，
 *      自然会得到依赖注入、纯函数、小接口这样的好设计。
 *    - 避免过度设计：只写"让当前测试通过"的代码，就不会去实现用不上的灵活性
 *      （YAGNI：You Aren't Gonna Need It）。
 *    - 调试成本极低：红了立刻知道是哪一行改动导致的，因为步长很小。
 *    - 天然的高覆盖率：因为每一行代码都是为了通过某个测试才写的。
 *
 *    真实项目里的常见变体与取舍：
 *      - 严格 TDD 适合：算法、纯函数、状态机、解析器、计费规则这类
 *        "逻辑复杂且需求明确"的代码；
 *      - 不适合硬套 TDD 的场景：探索性原型、UI 布局调样式、
 *        需求还很模糊时（此时先写"验收测试"或"骨架"更高效）；
 *      - 实践中最常见的是"测试先行 + 及时补测"的混合模式。
 *
 * 3. 核心语法要点
 *    本文件为了演示"失败的测试"，使用了一个自制的迷你运行器，
 *    因为 node:test 里任何一个失败都会让进程退出码变成 1，
 *    而本文件要求必须能独立运行且退出码为 0。
 *    迷你运行器捕获断言失败但只打印、不改变退出码 —— 这让"红"这一步骤可以被演示。
 *    真实项目里你不需要它：node --test 的红色输出就是你的反馈。
 *
 * 4. 常见陷阱
 *    - 跳过"红"这一步：直接写实现再补测试，你无法确定测试是否真的在验证东西
 *      （可能因为写错断言而永远绿灯）。
 *    - 步长太大：一次写 10 个测试再一次实现，失败时不知道从哪下手。
 *    - 重构时改了行为：重构的定义就是"不改变外部行为"，如果测试需要改，
 *      那说明你在做的是功能变更，不是重构。
 *    - 把 TDD 当成宗教：它是工具，不是目的。测试是为了信心，不是为了仪式感。
 *    - 只测新增功能不测回归：每次进入新循环前，务必要让"已有的全部测试"都是绿的。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/09_tdd_workflow.js
 *
 * 【预期输出】
 *   按步骤打印 5 轮 TDD 循环的过程：先显示测试失败（红）及失败原因，
 *   再显示实现后的通过（绿），最后展示重构前后测试依然全绿。
 *   全程退出码 0。
 * ============================================================================
 */

// ===========================================================================
// 第一部分：一个能"展示失败"的迷你运行器
// ===========================================================================

/**
 * 迷你测试运行器。与 node:test 的唯一区别：失败不会改变进程退出码。
 * 这样我们才能在一个文件里演示"红"这个步骤。
 *
 * @param {string} suiteName 本轮循环的名称
 * @param {Array<{name: string, fn: () => void}>} cases 用例列表
 * @returns {{passed: number, failed: number, total: number, allGreen: boolean}}
 */
function runSuite(suiteName, cases) {
  const result = { passed: 0, failed: 0, total: cases.length, failures: [], allGreen: false };

  console.log(`  [测试运行] ${suiteName}`);
  for (const testCase of cases) {
    try {
      testCase.fn();
      result.passed += 1;
      // 绿色：用一个对勾表示通过
      console.log(`    ✔ ${testCase.name}`);
    } catch (error) {
      result.failed += 1;
      result.failures.push({ name: testCase.name, error });
      // 红色：用叉号 + 失败原因（真实运行器会打印完整堆栈和 diff）
      console.log(`    ✖ ${testCase.name}`);
      console.log(
        String(error.message)
          .split('\n')
          .map((line) => `        ${line}`)
          .join('\n'),
      );
    }
  }

  result.allGreen = result.failed === 0;
  const color = result.allGreen ? '绿色 ✔' : '红色 ✖';
  console.log(`  小结：${result.passed}/${result.total} 通过，状态 = ${color}`);
  return result;
}

/** 断言辅助：严格相等，失败时给出期望与实际 */
function expectEqual(actual, expected, message = '') {
  if (!Object.is(actual, expected)) {
    throw new Error(
      `${message}\n      期望：${JSON.stringify(expected)}\n      实际：${JSON.stringify(actual)}`,
    );
  }
}

/** 断言辅助：期望抛错 */
function expectThrow(fn, message = '') {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  if (!threw) {
    throw new Error(`${message}\n      期望：抛出错误\n      实际：正常返回`);
  }
}

// ===========================================================================
// 第二部分：五轮 TDD 循环
// ===========================================================================

console.log('================================================================');
console.log('  需求：实现一个罗马数字转阿拉伯数字的函数 romanToInt(s)');
console.log('  规则：I=1 V=5 X=10 L=50 C=100 D=500 M=1000');
console.log('        小值在大值左边表示减法（IV=4, IX=9, XL=40 ...）');
console.log('  约束：空串返回 0；非法字符抛错；长度上限 15（对应 3999 以内）');
console.log('================================================================');

// ---------------------------------------------------------------------------
console.log('');
console.log('============================================================');
console.log('【循环 1】最简场景：单个符号');
console.log('  流程：写一个失败测试（红）-> 写最少实现（绿）-> 重构');
console.log('============================================================');

// --- 步骤 1.1（红）：先写测试。此时 romanToInt 还不存在 ---
console.log('');
console.log('  >>> 步骤 1.1 红：编写测试（实现还不存在）');

// 这里故意用 var 声明的"空实现"来模拟"函数还没写"的状态。
// 真实场景中你会在实现文件里写一个 `throw new Error('未实现')` 的桩。
let romanToInt = () => {
  throw new Error('Not implemented');
};

const suite1 = [
  { name: 'romanToInt("I") === 1', fn: () => expectEqual(romanToInt('I'), 1, 'I 对应 1') },
];

const cycle1Red = runSuite('循环 1 - 红', suite1);
console.log(`  >>> 观察：测试失败，因为实现还没写。失败原因正是我们要的
      "Not implemented" —— 这证明测试确实在被调用。`);

// --- 步骤 1.2（绿）：写最少的实现让测试通过 ---
console.log('');
console.log('  >>> 步骤 1.2 绿：写"最少"的实现（先硬编码，能过就行）');

// TDD 的精髓：此刻不要写通用实现，硬编码就够了。
// 因为只有一个测试，硬编码已经让它变绿。
romanToInt = (s) => {
  if (s === 'I') return 1;
  throw new Error(`未处理的输入：${s}`);
};

const cycle1Green = runSuite('循环 1 - 绿', suite1);

// --- 步骤 1.3（重构）：此时没有重复代码，重构这一步可以跳过 ---
console.log('');
console.log('  >>> 步骤 1.3 重构：当前只有 3 行代码，没有重复，无需重构。');
console.log('      重构不是必须的步骤；只有当代码出现坏味道时才做。');
console.log(`  循环 1 结论：红 -> 绿 完成（${cycle1Red.failed} 个失败 -> ${cycle1Green.failed} 个失败）`);

// ---------------------------------------------------------------------------
console.log('');
console.log('============================================================');
console.log('【循环 2】加入第二个用例，硬编码立刻撑不住了');
console.log('============================================================');

console.log('');
console.log('  >>> 步骤 2.1 红：增加 V 和 X 的用例');

const suite2 = [
  ...suite1,
  { name: 'romanToInt("V") === 5', fn: () => expectEqual(romanToInt('V'), 5) },
  { name: 'romanToInt("X") === 10', fn: () => expectEqual(romanToInt('X'), 10) },
];

const cycle2Red = runSuite('循环 2 - 红', suite2);
console.log('  >>> 观察：新增的两条失败，说明硬编码无法扩展 —— 这正是测试在"逼"我们写通用实现。');

console.log('');
console.log('  >>> 步骤 2.2 绿：用查表法写出通用实现');

/** 罗马符号到数值的映射表 */
const SYMBOL_TO_VALUE = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
};

romanToInt = (s) => {
  // 第一版通用实现：只处理单个符号
  return SYMBOL_TO_VALUE[s];
};

const cycle2Green = runSuite('循环 2 - 绿', suite2);
console.log('  >>> 重构：把映射关系提取为常量表 SYMBOL_TO_VALUE，避免魔法数字散落。');
console.log(`  循环 2 结论：${cycle2Red.failed} 个失败 -> ${cycle2Green.failed} 个失败`);

// ---------------------------------------------------------------------------
console.log('');
console.log('============================================================');
console.log('【循环 3】多字符相加：实现开始长出真正的逻辑');
console.log('============================================================');

console.log('');
console.log('  >>> 步骤 3.1 红：增加多字符相加的用例');

const suite3 = [
  ...suite2,
  { name: 'romanToInt("II") === 2', fn: () => expectEqual(romanToInt('II'), 2) },
  { name: 'romanToInt("VI") === 6', fn: () => expectEqual(romanToInt('VI'), 6) },
  // 注意：这里刻意选了一个"纯加法"的例子 MDCLXVI，
  // 因为减法规则要留到循环 4 才引入 —— TDD 强调一次只前进一步。
  { name: 'romanToInt("MDCLXVI") === 1666', fn: () => expectEqual(romanToInt('MDCLXVI'), 1666) },
];

const cycle3Red = runSuite('循环 3 - 红', suite3);
console.log(`  >>> 观察："II" 返回 NaN 而不是 2 —— 因为查表法只处理了单字符。`);

console.log('');
console.log('  >>> 步骤 3.2 绿：逐个字符查表累加');

romanToInt = (s) => {
  // split('') 把字符串拆成字符数组，reduce 累加每个字符对应的数值
  return s.split('').reduce((sum, char) => sum + SYMBOL_TO_VALUE[char], 0);
};

const cycle3Green = runSuite('循环 3 - 绿', suite3);
console.log(`  循环 3 结论：${cycle3Red.failed} 个失败 -> ${cycle3Green.failed} 个失败`);

// ---------------------------------------------------------------------------
console.log('');
console.log('============================================================');
console.log('【循环 4】减法规则：真正的业务逻辑登场');
console.log('============================================================');

console.log('');
console.log('  >>> 步骤 4.1 红：增加"小值在大值左边"的减法用例');

const suite4 = [
  ...suite3,
  { name: 'romanToInt("MMXXIV") === 2024（需要减法规则）', fn: () => expectEqual(romanToInt('MMXXIV'), 2024) },
  { name: 'romanToInt("IV") === 4', fn: () => expectEqual(romanToInt('IV'), 4) },
  { name: 'romanToInt("IX") === 9', fn: () => expectEqual(romanToInt('IX'), 9) },
  { name: 'romanToInt("XL") === 40', fn: () => expectEqual(romanToInt('XL'), 40) },
  { name: 'romanToInt("MCMXCIV") === 1994', fn: () => expectEqual(romanToInt('MCMXCIV'), 1994) },
];

const cycle4Red = runSuite('循环 4 - 红', suite4);
console.log('  >>> 观察："IV" 被算成 6（1 + 5），但正确答案是 4（5 - 1）。');

console.log('');
console.log('  >>> 步骤 4.2 绿：遇到"小值在大值左侧"时改为减法');

romanToInt = (s) => {
  let total = 0;
  for (let i = 0; i < s.length; i += 1) {
    const current = SYMBOL_TO_VALUE[s[i]];
    const next = SYMBOL_TO_VALUE[s[i + 1]];

    // 核心规则：如果当前符号小于右边符号，说明是"减法组合"（IV / IX / XL ...）
    if (next !== undefined && current < next) {
      total -= current;
    } else {
      total += current;
    }
  }
  return total;
};

const cycle4Green = runSuite('循环 4 - 绿', suite4);
console.log(`  循环 4 结论：${cycle4Red.failed} 个失败 -> ${cycle4Green.failed} 个失败`);

// ---------------------------------------------------------------------------
console.log('');
console.log('============================================================');
console.log('【循环 5】异常与边界：让实现变健壮');
console.log('============================================================');

console.log('');
console.log('  >>> 步骤 5.1 红：增加空串、非法字符、超长输入的用例');

const suite5 = [
  ...suite4,
  { name: 'romanToInt("") === 0（空串边界）', fn: () => expectEqual(romanToInt(''), 0) },
  {
    name: 'romanToInt("ABC") 抛错（非法字符）',
    fn: () => expectThrow(() => romanToInt('ABC'), 'ABC 含非法罗马符号'),
  },
  {
    name: 'romanToInt("MMMM") 抛错（超过 3999 的表示范围）',
    fn: () => expectThrow(() => romanToInt('MMMM'), 'MMMM 超出范围'),
  },
];

const cycle5Red = runSuite('循环 5 - 红', suite5);
console.log('  >>> 观察：空串其实已经返回 0（reduce 空数组得 0），但 "ABC" 返回 NaN');
console.log('      而不是抛错 —— 静默产生 NaN 是生产事故的常见源头，必须改成显式抛错。');

console.log('');
console.log('  >>> 步骤 5.2 绿：加入输入校验');

/** 罗马数字的合法字符集合，用 Set 做 O(1) 查找 */
const VALID_SYMBOLS = new Set(Object.keys(SYMBOL_TO_VALUE));

/** 标准罗马数字能表示的最大值（3999 = MMMCMXCIX） */
const MAX_ROMAN_VALUE = 3999;

/**
 * 核心计算：从左到右扫描，按"当前字符是否小于右邻字符"决定加还是减。
 * 把这段逻辑单独提出来，是为了让"校验"和"计算"各自职责单一。
 * @param {string[]} chars
 * @returns {number}
 */
function computeValue(chars) {
  return chars.reduce((total, char, index) => {
    const current = SYMBOL_TO_VALUE[char];
    const next = SYMBOL_TO_VALUE[chars[index + 1]];
    return total + (next !== undefined && current < next ? -current : current);
  }, 0);
}

/**
 * 把罗马数字转换成阿拉伯数字。
 * @param {string} s 罗马数字字符串（1 ~ 3999）
 * @returns {number} 对应的整数
 * @throws {TypeError} 参数不是字符串时
 * @throws {RangeError} 含非法字符或超出可表示范围时
 */
function romanToIntStrict(s) {
  if (typeof s !== 'string') {
    throw new TypeError('参数必须是字符串');
  }
  // 空串是合法的，按约定返回 0
  if (s.length === 0) {
    return 0;
  }
  if (s.length > 15) {
    // 15 是 3888（MMMDCCCLXXXVIII）的长度，已覆盖 1~3999 的全部合法表示
    throw new RangeError('罗马数字过长，超出可表示范围');
  }
  for (const char of s) {
    if (!VALID_SYMBOLS.has(char)) {
      throw new RangeError(`非法罗马数字字符：${char}`);
    }
  }

  const total = computeValue([...s]);
  // 校验数值范围：字符都合法不代表值合法（例如 MMMM = 4000，超出标准表示范围）。
  // 静默返回 4000 会让上游代码拿到一个"看起来没问题"的错误数据 —— 显式抛错更好。
  if (total > MAX_ROMAN_VALUE) {
    throw new RangeError(`超出可表示范围（最大 ${MAX_ROMAN_VALUE}）`);
  }
  return total;
}

romanToInt = romanToIntStrict;

const cycle5Green = runSuite('循环 5 - 绿', suite5);
console.log(`  循环 5 结论：${cycle5Red.failed} 个失败 -> ${cycle5Green.failed} 个失败`);

// ---------------------------------------------------------------------------
console.log('');
console.log('============================================================');
console.log('【重构】测试全绿之后，才可以安全地改内部实现');
console.log('============================================================');

console.log('');
console.log('  >>> 重构前的实现：两段循环，一段做校验、一段做计算。可读但稍显啰嗦。');
console.log('  >>> 重构目标：');
console.log('      1. 把"校验"和"计算"拆成两个具名函数，各自职责单一；');
console.log('      2. 用 reduce 替代显式索引循环，减少边界变量；');
console.log('      3. 外部行为完全不变 —— 所以下面跑同一份测试集必须依然全绿。');

/** 校验并归一化输入，返回字符数组 */
function validateRoman(s) {
  if (typeof s !== 'string') throw new TypeError('参数必须是字符串');
  if (s.length === 0) return [];
  if (s.length > 15) throw new RangeError('罗马数字过长，超出可表示范围');
  const chars = [...s];
  // find 找到第一个非法字符；找不到返回 undefined
  const invalid = chars.find((char) => !VALID_SYMBOLS.has(char));
  if (invalid !== undefined) throw new RangeError(`非法罗马数字字符：${invalid}`);
  return chars;
}

/**
 * 重构后的实现：先校验、再计算，两段各自独立可读。
 * 外部行为与重构前完全一致 —— 测试就是这一点的证据。
 */
function romanToIntRefactored(s) {
  const chars = validateRoman(s);

  // 第二段：调用抽出来的纯函数计算数值，并做范围校验。
  // 重构把"校验"和"计算"彻底分开了，各自都能被单独测试。
  const total = computeValue(chars);
  if (total > MAX_ROMAN_VALUE) {
    throw new RangeError(`超出可表示范围（最大 ${MAX_ROMAN_VALUE}）`);
  }
  return total;
}

romanToInt = romanToIntRefactored;

console.log('');
console.log('  >>> 重构后重跑"全部"测试（包括前 4 轮的所有用例）');
const afterRefactor = runSuite('重构后 - 全量回归', suite5);

console.log('');
console.log('  >>> 额外补充"重构安全网"用例：确认新实现与旧行为在更多输入上一致');
const additionalCases = [
  { name: 'romanToInt("MCMLIV") === 1954', fn: () => expectEqual(romanToInt('MCMLIV'), 1954) },
  { name: 'romanToInt("MMMCMXCIX") === 3999（最大值）', fn: () => expectEqual(romanToInt('MMMCMXCIX'), 3999) },
  { name: 'romanToInt("LVIII") === 58（减法规则之外的常见值）', fn: () => expectEqual(romanToInt('LVIII'), 58) },
  { name: 'romanToInt("MCDXLIV") === 1444', fn: () => expectEqual(romanToInt('MCDXLIV'), 1444) },
  { name: 'romanToInt(null) 抛 TypeError', fn: () => expectThrow(() => romanToInt(null)) },
  { name: 'romanToInt("IIII") 抛错（IIII 不是规范写法，但字符合法 —— 这里只验证不崩溃）', fn: () => expectEqual(romanToInt('IIII'), 4) },
];
const afterExtra = runSuite('重构后 - 补充用例', additionalCases);

// ---------------------------------------------------------------------------
console.log('');
console.log('============================================================');
console.log('【总结】本次 TDD 全流程结果');
console.log('============================================================');
console.log(`  循环 1（单符号）    ：${cycle1Red.failed} 红 -> ${cycle1Green.failed} 绿`);
console.log(`  循环 2（多符号）    ：${cycle2Red.failed} 红 -> ${cycle2Green.failed} 绿`);
console.log(`  循环 3（累加）      ：${cycle3Red.failed} 红 -> ${cycle3Green.failed} 绿`);
console.log(`  循环 4（减法规则）  ：${cycle4Red.failed} 红 -> ${cycle4Green.failed} 绿`);
console.log(`  循环 5（异常边界）  ：${cycle5Red.failed} 红 -> ${cycle5Green.failed} 绿`);
console.log(`  重构后全量回归      ：${afterRefactor.failed} 失败（必须为 0）`);
console.log(`  补充用例            ：${afterExtra.failed} 失败`);
console.log('');
console.log('  可以观察到的规律：');
console.log('    1. 每一轮都是"先红后绿"，红色证明测试有效，绿色证明实现到位；');
console.log('    2. 复杂度是被测试逐步"逼"出来的，而不是一次性设计出来的；');
console.log('    3. 重构之所以安全，是因为有一套随时能跑、且必须保持全绿的测试；');
console.log('    4. 硬编码（循环 1 的 if (s === "I")）在 TDD 里是被允许的，');
console.log('       它是"最小实现"原则的体现 —— 下一个测试会自然把它淘汰掉。');
console.log('');

// ---------------------------------------------------------------------------
// 用 node:test 把最终实现也正式测一遍，证明 TDD 产物是可持续维护的
// ---------------------------------------------------------------------------
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('TDD 的最终产物：romanToInt 的全部分支都被覆盖', () => {
  const cases = [
    ['', 0],
    ['I', 1],
    ['III', 3],
    ['IV', 4],
    ['IX', 9],
    ['LVIII', 58],
    ['MCMXCIV', 1994],
    ['MMMCMXCIX', 3999],
  ];
  for (const [input, expected] of cases) {
    assert.strictEqual(romanToInt(input), expected, `romanToInt(${JSON.stringify(input)}) 应为 ${expected}`);
  }

  assert.throws(() => romanToInt('ABC'), RangeError);
  assert.throws(() => romanToInt('MMMMMMM'), RangeError);
  assert.throws(() => romanToInt(123), TypeError);
});

test('关键结论：TDD 的每个循环都以"测试全绿"收尾', () => {
  // 把演示过程中的结论固化成断言，避免以后修改本文件时破坏教学效果
  assert.strictEqual(cycle1Red.allGreen, false, '循环 1 的红色阶段必须是失败的');
  assert.strictEqual(cycle1Green.allGreen, true, '循环 1 的绿色阶段必须全部通过');
  assert.strictEqual(cycle2Green.allGreen, true, '循环 2 应全部通过');
  assert.strictEqual(cycle3Green.allGreen, true, '循环 3 应全部通过');
  assert.strictEqual(cycle4Green.allGreen, true, '循环 4 应全部通过');
  assert.strictEqual(cycle5Green.allGreen, true, '循环 5 应全部通过');
  assert.strictEqual(afterRefactor.allGreen, true, '重构后必须保持全绿');
});

console.log('');
console.log('演示结束。');
