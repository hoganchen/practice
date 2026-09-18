/**
 * ============================================================================
 * 知识点：防御式编程 —— 参数校验、类型守卫、Fail Fast 实践
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】进阶
 * 【前置知识】20_error_handling/05_custom_errors.js、20_error_handling/08_error_handling_patterns.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    防御式编程的核心思想是：**不信任任何来自外部的数据**。
 *    在数据进入系统的边界处（函数入口、接口入参、文件读取、用户输入）
 *    就把它检查干净，不合格立刻拒绝，让内部的代码可以放心地假设数据是合法的。
 *    三个关键手段：
 *      (1) 参数校验（validation）：检查类型、范围、格式、必填项
 *      (2) 类型守卫（type guard）：一个返回 boolean 的小函数，
 *          把"这个值是不是我要的形状"这一判断封装起来，可复用、可测试
 *      (3) Fail Fast：发现问题立刻抛错，绝不带着坏数据继续往下跑
 *
 * 2. 为什么需要
 *    (1) 错误越晚暴露，代价越高：在入口处拒绝一个坏参数只要 1 毫秒，
 *        等它在数据库里写坏了数据再排查要几小时。
 *    (2) 明确的错误信息胜过沉默的 NaN：NaN 会一路传播，最后在完全无关的地方爆炸，
 *        堆栈完全指不到真正的原因。
 *    (3) 校验逻辑写在一处（守卫函数），可以复用、可以被测试覆盖。
 *    (4) 边界清晰后，内部函数可以省略大量重复的 if 检查，可读性更好。
 *
 * 3. 核心语法要点
 *    (1) 常见类型检查手段：
 *          typeof x === 'string'            原始类型
 *          Number.isFinite(x)               有限数字（比 typeof 更严格，排除 NaN/Infinity）
 *          Number.isInteger(x)              整数
 *          Array.isArray(x)                 数组（instanceof Array 跨 realm 会失败）
 *          x instanceof Date                对象类型
 *          Object.prototype.toString.call(x) 精确类型（可区分 null 与 object）
 *          x === null / x !== undefined     空值
 *          可选链 x?.a?.b                   安全访问深层属性
 *          空值合并 x ?? 'default'          只在 null/undefined 时取默认值
 *    (2) 双向的类型守卫：既检查类型，也做"收窄"（normalize），
 *        例如 trim 字符串、把数字字符串转成数字。
 *    (3) Fail Fast 的写法：先校验，后执行；校验失败立即 throw（带清晰消息 + 自定义错误类）。
 *    (4) 用 Object.hasOwn / 'key' in obj 判断键是否存在，而不是 obj.key !== undefined。
 *
 * 4. 常见陷阱
 *    (1) typeof null === 'object' —— 判断"是对象"时必须额外排除 null。
 *    (2) 用 Number.isNaN 检查"是不是数字" —— 应该用 typeof + Number.isFinite。
 *    (3) 用 == 做比较，让 '0' == false 这类隐式转换溜进来。
 *    (4) 过度防御：内部函数之间也层层校验，代码被淹没。校验应集中在**边界**。
 *    (5) 只校验类型不校验范围：负数金额、超长字符串同样是坏数据。
 *    (6) 把校验结果丢掉：校验完却继续用原始（未规范化）的值。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/12_defensive_programming.js
 *
 * 【预期输出】
 *   演示类型守卫、参数校验函数、Fail Fast 的错误信息，
 *   以及"不防御 vs 防御"两种写法的对比。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基础类型守卫：为什么 typeof 不够用
// ---------------------------------------------------------------------------

console.log('--- 1. 基础类型检查的坑 ---');

console.log("typeof null          =", typeof null, '← 历史遗留 bug，它不是 object 语义上的对象');
console.log("typeof []            =", typeof [], '← 数组也是 object，要用 Array.isArray');
console.log("typeof NaN           =", typeof NaN, '← NaN 也是 number，要用 Number.isFinite');
console.log("typeof new Date()    =", typeof new Date(), '← 同样是 object，要用 instanceof');
console.log("Number.isFinite('1') =", Number.isFinite('1'), '← 不会隐式转换，字符串直接为 false');
console.log("Number.isNaN('abc')  =", Number.isNaN('abc'), "← 不会隐式转换（isNaN('abc') 会是 true）");
console.log("Object.hasOwn({}, 'toString') =", Object.hasOwn({}, 'toString'), '← 只看自有属性');

// ---------------------------------------------------------------------------
// 2. 编写可复用的类型守卫函数
// ---------------------------------------------------------------------------

console.log('\n--- 2. 类型守卫函数 ---');

/**
 * 判断是否是"真正可用的数字"（排除 NaN、Infinity、数字字符串）
 * @param {unknown} v
 * @returns {boolean}
 */
const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * 判断是否是非空字符串
 * @param {unknown} v
 * @returns {boolean}
 */
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/**
 * 判断是否是"普通对象"（排除 null、数组、Date 等）
 * @param {unknown} v
 * @returns {boolean}
 */
const isPlainObject = (v) =>
  typeof v === 'object' && v !== null && !Array.isArray(v) && Object.getPrototypeOf(v) === Object.prototype;

/**
 * 判断是否是整数
 * @param {unknown} v
 * @returns {boolean}
 */
const isInteger = (v) => Number.isInteger(v);

/**
 * 判断是否是合法的"类对象"（含数组、Date，但排除 null）
 * @param {unknown} v
 * @returns {boolean}
 */
const isObjectLike = (v) => typeof v === 'object' && v !== null;

const guardSamples = [
  ['isNumber(1)', () => isNumber(1)],
  ['isNumber(NaN)', () => isNumber(NaN)],
  ['isNumber("1")', () => isNumber('1')],
  ['isNonEmptyString("  ")', () => isNonEmptyString('  ')],
  ['isNonEmptyString("hi")', () => isNonEmptyString('hi')],
  ['isPlainObject({})', () => isPlainObject({})],
  ['isPlainObject([])', () => isPlainObject([])],
  ['isPlainObject(new Date())', () => isPlainObject(new Date())],
  ['isPlainObject(null)', () => isPlainObject(null)],
  ['isInteger(3)', () => isInteger(3)],
  ['isInteger(3.5)', () => isInteger(3.5)],
  ['isObjectLike(null)', () => isObjectLike(null)],
];

for (const [label, fn] of guardSamples) {
  console.log(`  ${label.padEnd(26)} → ${fn()}`);
}

// ---------------------------------------------------------------------------
// 3. 不防御 vs 防御：一个真实的反例
// ---------------------------------------------------------------------------

console.log('\n--- 3. 不防御 vs 防御 ---');

/**
 * 不防御的写法：坏数据会一路传播，最后在莫名其妙的地方爆炸
 * @param {unknown} price
 * @param {unknown} qty
 * @returns {number}
 */
function totalPriceNaive(price, qty) {
  return price * qty; // 如果 price 是字符串 'abc'，结果是 NaN，而且不会报错
}

console.log('  不防御：totalPriceNaive("abc", 3) =', totalPriceNaive('abc', 3));
console.log('  → 返回 NaN，没有报错。这个 NaN 会继续往上传，');
console.log('    最后可能在"渲染订单列表"或"写入数据库"时才炸，堆栈完全指不到根因。');

/** 参数错误：用于区分"调用方用错了"这一类错误 */
class ArgumentError extends Error {
  /**
   * @param {string} message
   * @param {string} [field]
   */
  constructor(message, field) {
    super(message);
    this.name = 'ArgumentError';
    this.field = field;
  }
}

/**
 * 防御式写法：入口处立刻校验，坏数据绝不往下传
 * @param {unknown} price 单价
 * @param {unknown} qty 数量
 * @returns {number} 总价
 */
function totalPriceSafe(price, qty) {
  if (!isNumber(price)) {
    throw new ArgumentError(`price 必须是有限数字，收到：${JSON.stringify(price)}`, 'price');
  }
  if (!isInteger(qty)) {
    throw new ArgumentError(`qty 必须是整数，收到：${JSON.stringify(qty)}`, 'qty');
  }
  if (price < 0 || qty < 0) {
    throw new ArgumentError('price 与 qty 都不能为负数', price < 0 ? 'price' : 'qty');
  }
  if (qty > 1_000_000) {
    throw new ArgumentError(`qty 超出上限（1000000），收到：${qty}`, 'qty');
  }
  return price * qty;
}

for (const [p, q] of [
  [19.9, 3],
  ['abc', 3],
  [19.9, 1.5],
  [-1, 3],
  [19.9, 9_999_999],
]) {
  try {
    console.log(`  totalPriceSafe(${JSON.stringify(p)}, ${JSON.stringify(q)}) = ${totalPriceSafe(p, q)}`);
  } catch (err) {
    console.log(`  totalPriceSafe(${JSON.stringify(p)}, ${JSON.stringify(q)}) → ${err.name} [${err.field}] ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 4. Fail Fast：在边界一次校验干净
// ---------------------------------------------------------------------------

console.log('\n--- 4. Fail Fast ---');

/**
 * 校验并"规范化"一个用户对象：既检查，也顺手做好清洗（trim、默认值）。
 * 返回的是**新对象**，不让调用方继续用那些没清洗过的原始数据。
 * @param {unknown} input
 * @returns {{ name: string, age: number, email: string|null }}
 */
function normalizeUser(input) {
  // Fail Fast：第一层，整体形状
  if (!isPlainObject(input)) {
    throw new ArgumentError(`user 必须是普通对象，收到：${Object.prototype.toString.call(input)}`);
  }

  // 第二层，逐字段校验 + 规范化
  if (!isNonEmptyString(input.name)) {
    throw new ArgumentError('name 必须是非空字符串', 'name');
  }
  if (!isInteger(input.age) || input.age < 0 || input.age > 150) {
    throw new ArgumentError(`age 必须是 0~150 的整数，收到：${JSON.stringify(input.age)}`, 'age');
  }

  const email = input.email ?? null; // 用 ?? 只对 null/undefined 兜底
  if (email !== null && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new ArgumentError(`email 格式不正确：${JSON.stringify(email)}`, 'email');
  }

  // 规范化：返回清洗后的新对象（注意 name 被 trim 过）
  return {
    name: input.name.trim(),
    age: input.age,
    email: email === null ? null : email.toLowerCase(),
  };
}

const userInputs = [
  { name: '  张三  ', age: 20, email: 'ZHANG@Example.COM' },
  { name: '李四', age: 30 },
  { name: '', age: 20 },
  { name: '王五', age: '20' },
  { name: '赵六', age: 20, email: 'not-an-email' },
  null,
  [],
];

for (const input of userInputs) {
  try {
    console.log('  ✓', JSON.stringify(normalizeUser(input)));
  } catch (err) {
    console.log(`  ✗ ${err.name}${err.field ? ` [${err.field}]` : ''}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 5. 安全访问：可选链与空值合并
// ---------------------------------------------------------------------------

console.log('\n--- 5. 安全访问深层属性 ---');

const responses = [
  { data: { user: { profile: { nickname: '小明' } } } },
  { data: { user: {} } },
  { data: null },
  {},
];

/** 不安全的写法：只要中间有一层是 null/undefined 就抛 TypeError */
function unsafeNickname(resp) {
  return resp.data.user.profile.nickname;
}

/** 安全的写法：可选链 + 空值合并 */
const safeNickname = (resp) => resp?.data?.user?.profile?.nickname ?? '(未设置昵称)';

for (const resp of responses) {
  let unsafeResult;
  try {
    unsafeResult = unsafeNickname(resp);
  } catch (err) {
    unsafeResult = `${err.name}`;
  }
  console.log(`  不安全写法：${String(unsafeResult).padEnd(12)} 安全写法：${safeNickname(resp)}`);
}

// ---------------------------------------------------------------------------
// 6. 守卫函数 + 断言的分工
// ---------------------------------------------------------------------------

console.log('\n--- 6. 校验策略该放在哪里 ---');
console.log('边界（外部输入）  ：完整校验 + 友好错误 + 规范化，用 if + throw（本文件的写法）');
console.log('内部函数之间      ：可以只做轻量断言（node:assert），甚至完全不校验；');
console.log('                    因为边界已经把关，内部再查一遍是重复劳动。');
console.log('                    （见 11_assertion.js 的"前置条件断言"一节）');
console.log('原则：校验一次，在离输入最近的地方；内部代码信任已校验的数据。');

// ---------------------------------------------------------------------------
// 7. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 7. 小结 ---');
console.log('1) 类型检查要成体系：typeof 查原始类型，Array.isArray 查数组，');
console.log('   Number.isFinite 查数字，Object.getPrototypeOf 查普通对象，且永远记得排除 null。');
console.log('2) 把判断封装成守卫函数，复用、可测、命名自解释；');
console.log('3) Fail Fast：边界处校验一次，不合格立刻抛带上下文的错误；');
console.log('4) 校验之后要做规范化（trim / 转小写 / 补默认值），并返回新对象；');
console.log('5) 精确的错误信息（含字段名与实际值）能省下大量排查时间。');
