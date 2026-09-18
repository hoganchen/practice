/**
 * ============================================================================
 * 知识点：数字的表示极限与精度丢失 —— MAX_SAFE_INTEGER、MIN_VALUE、EPSILON
 * ============================================================================
 *
 * 【所属分类】12_numbers_and_math —— 数字与数学运算
 * 【难度等级】高级
 * 【前置知识】12_numbers_and_math/05_number_methods.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 只有一种数字类型 Number，内部是 IEEE 754 双精度 64 位浮点数：
 *      1 位符号 + 11 位指数 + 52 位尾数
 *    这决定了它能精确表示的范围与精度：
 *      - 能精确表示的整数上限是 2^53 - 1 = 9007199254740991（MAX_SAFE_INTEGER）
 *      - 绝对值上限是约 1.7976931348623157e+308（MAX_VALUE），超过就是 Infinity
 *      - 最小的正数是 5e-324（MIN_VALUE），比它更小的正数会下溢成 0
 *      - 相邻可表示数字的"间距"（机器精度）在 1 附近约为 2.220446049250313e-16（EPSILON）
 *    超过安全整数范围后，整数运算会静默丢精度；十进制小数（如 0.1）本质上也无法精确表示。
 *
 * 2. 为什么需要
 *    - 后端返回的雪花算法 id（19 位数字）直接 JSON.parse 就会丢掉后几位，
 *      所以业界约定：大整数 id 在 JSON 里必须以字符串传输。
 *    - 金额计算用浮点会出错，所以要用"整数分"或 decimal 方案（见 08 号文件）。
 *    - 判断两个浮点数是否相等不能直接用 ===，要用 EPSILON 容差。
 *    - 知道 EPSILON 的大小，才能理解为什么 0.1 + 0.2 !== 0.3。
 *
 * 3. 核心语法要点
 *    - Number.isSafeInteger(x)：既判断是整数，又判断 |x| <= 2^53 - 1。
 *    - Number.MAX_SAFE_INTEGER = 9007199254740991（16 位数字）。
 *    - 精度丢失的判据：当 |x| >= 2^53 时，x + 1 可能等于 x 本身。
 *    - 浮点相等比较的标准写法：
 *        Math.abs(a - b) < Number.EPSILON
 *      但对较大的数要按相对误差比较：Math.abs(a - b) <= EPSILON * Math.max(|a|,|b|)。
 *    - 需要任意精度整数时用 BigInt（字面量加 n 后缀，如 9007199254740993n），
 *      代价是不能与 Number 混用算术运算，且不能用于 Math 方法。
 *    - 需要任意精度小数时应使用字符串/整数方案或成熟的 decimal 库。
 *
 * 4. 常见陷阱
 *    - 2 ** 53 === 2 ** 53 + 1 为 true —— 整数运算静默出错，不报任何警告。
 *    - 19 位的 id 存进 Number 后末尾几位会变成 0 或奇怪的数字，
 *      再转回字符串和原值就对不上了。
 *    - Number.MAX_SAFE_INTEGER 是"能安全做整数运算的上限"，
 *      不是"能表示的最大数"，后者是 MAX_VALUE。
 *    - Number.MIN_VALUE 是最小正数（5e-324），不是最小负数。
 *    - EPSILON 不是"最小的浮点间隔"，而是"1 与下一个可表示数之间的差"；
 *      对于量级远大于 1 的数，实际间隔会比 EPSILON 大得多。
 *    - BigInt 与 Number 不能直接相加：1n + 1 会抛 TypeError。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 12_numbers_and_math/06_number_limits.js
 *
 * 【预期输出】
 *   演示安全整数边界、精度丢失实例、EPSILON 比较法，以及 BigInt 的对比方案。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 安全整数范围
// ---------------------------------------------------------------------------

console.log('--- 1. 安全整数范围 ---');

console.log('Number.MAX_SAFE_INTEGER =', Number.MAX_SAFE_INTEGER); // 9007199254740991
console.log('Number.MIN_SAFE_INTEGER =', Number.MIN_SAFE_INTEGER); // -9007199254740991
console.log('它等于 2^53 - 1：', Number.MAX_SAFE_INTEGER === 2 ** 53 - 1); // true

// 2^53 本身还是能精确表示的，但它已经不是"安全"的了
console.log('\n2 ** 53 =', 2 ** 53); // 9007199254740992
console.log('Number.isSafeInteger(2 ** 53 - 1) =', Number.isSafeInteger(2 ** 53 - 1)); // true
console.log('Number.isSafeInteger(2 ** 53) =', Number.isSafeInteger(2 ** 53)); // false
console.log('Number.isSafeInteger(2 ** 53 + 1) =', Number.isSafeInteger(2 ** 53 + 1)); // false

// 精确性的边界：相邻整数开始"挤在一起"
console.log('\n2 ** 53 + 1 =', 2 ** 53 + 1); // 9007199254740992 ← 加 1 没变化
console.log('2 ** 53 + 2 =', 2 ** 53 + 2); // 9007199254740994 ← 跳过了 9007199254740993
console.log('2 ** 53 + 3 =', 2 ** 53 + 3); // 9007199254740996
console.log('结论：在 2^53 以上，相邻可表示整数之间的间隔变成了 2');

// 更直观的"加一无效"检测
function addOneChangesValue(x) {
  return x + 1 !== x;
}
console.log('\n1 + 1 !== 1：', addOneChangesValue(1)); // true
console.log('2 ** 53 + 1 !== 2 ** 53：', addOneChangesValue(2 ** 53)); // false ← 加一失效

// 找出第一个"加一失效"的整数
let boundary = 1;
while (boundary + 1 !== boundary) boundary *= 2;
console.log('\n第一个加一失效的 2 的幂：', boundary); // 9007199254740992

// ---------------------------------------------------------------------------
// 2. 精度丢失的真实案例
// ---------------------------------------------------------------------------

console.log('--- 2. 精度丢失案例 ---');

// 案例 1：经典浮点加法
console.log('0.1 + 0.2 =', 0.1 + 0.2); // 0.30000000000000004
console.log('0.1 + 0.2 === 0.3：', 0.1 + 0.2 === 0.3); // false
console.log('用 toPrecision(20) 看真值：', (0.1 + 0.2).toPrecision(20));

// 案例 2：大整数 id 被改写
const snowflakeId = 1234567890123456789; // 19 位
console.log('\n原始字面量：       1234567890123456789');
console.log('实际存进去的值：   ', snowflakeId); // 末尾被改写
console.log('转回字符串：       ', String(snowflakeId));
console.log('长度：             ', String(snowflakeId).length); // 19 位，但数字不对
console.log('末尾几位已经不可信：最后 3 位是', String(snowflakeId).slice(-3));

// 正确做法：让后端把大整数以字符串传输，前端全程当字符串处理
const idAsString = '1234567890123456789';
console.log('\n以字符串保存：', idAsString);
console.log('长度与内容都正确：', idAsString.length === 19 && idAsString === '1234567890123456789');

// 案例 3：循环累加导致误差堆积
let sum = 0;
for (let i = 0; i < 10; i++) {
  sum += 0.1;
}
console.log('\n0.1 累加 10 次：', sum); // 0.9999999999999999
console.log('是否等于 1：', sum === 1); // false
console.log('差值：', 1 - sum); // 1.1102230246251565e-16

// 案例 4：大数与小数的加法被吞掉
console.log('\n1e16 + 1 =', 1e16 + 1); // 10000000000000000，1 被完全吞掉
console.log('1e16 + 10 =', 1e16 + 10); // 10000000000000010
console.log('1e20 + 1 =', 1e20 + 1); // 1e20，加 1 完全没有影响

// 案例 5：超出 MAX_VALUE 变成 Infinity
console.log('\nNumber.MAX_VALUE =', Number.MAX_VALUE);
console.log('Number.MAX_VALUE * 2 =', Number.MAX_VALUE * 2); // Infinity
console.log('-Number.MAX_VALUE * 2 =', -Number.MAX_VALUE * 2); // -Infinity
console.log('Infinity - Infinity =', Infinity - Infinity); // NaN

// 案例 6：下溢成 0
console.log('\nNumber.MIN_VALUE =', Number.MIN_VALUE); // 5e-324
console.log('Number.MIN_VALUE / 2 =', Number.MIN_VALUE / 2); // 0，下溢
console.log('Number.MIN_VALUE > 0：', Number.MIN_VALUE > 0); // true

// ---------------------------------------------------------------------------
// 3. EPSILON —— 机器精度
// ---------------------------------------------------------------------------

console.log('--- 3. EPSILON ---');

console.log('Number.EPSILON =', Number.EPSILON); // 2.220446049250313e-16
console.log('它等于 2^-52：', Number.EPSILON === 2 ** -52); // true

// EPSILON 的含义：1 与"比 1 大的下一个可表示数"之间的差
console.log('\n1 + Number.EPSILON =', 1 + Number.EPSILON); // 1.0000000000000002
console.log('1 + EPSILON !== 1：', 1 + Number.EPSILON !== 1); // true
console.log('1 + EPSILON / 2 =', 1 + Number.EPSILON / 2); // 1，加太小了没有任何变化
console.log('1 + EPSILON / 2 === 1：', 1 + Number.EPSILON / 2 === 1); // true

// 重要认知：EPSILON 是"1 附近"的间隔，量级更大时间隔会成比例变大
console.log('\n不同量级下的"实际间隔"：');
for (const base of [1, 1e6, 1e12, 1e16]) {
  // 思路：从一个与 base 同量级的增量开始，不断减半，
  // 直到"加上去还能改变数值"——此时这个增量就近似等于该量级的最小间隔
  let step = base;
  while (base + step !== base) step /= 2;
  step *= 2;
  console.log(
    `  base = ${base.toExponential(0).padEnd(8)} 间隔约为 ${step.toExponential(3).padEnd(10)} 相当于 EPSILON 的 ${(step / Number.EPSILON).toExponential(2)} 倍`,
  );
}

// ---------------------------------------------------------------------------
// 4. 浮点数比较的正确写法
// ---------------------------------------------------------------------------

console.log('--- 4. 浮点数比较 ---');

/** 绝对误差比较：适合同量级、数值不大的情况 */
function nearlyEqualAbs(a, b, epsilon = Number.EPSILON) {
  return Math.abs(a - b) < epsilon;
}

/** 相对误差比较：适合数值量级不确定的情况（推荐作为通用工具） */
function nearlyEqualRel(a, b, epsilon = Number.EPSILON) {
  // 先处理完全相等（含 ±0）与特殊值
  if (a === b) return true;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const diff = Math.abs(a - b);
  const scale = Math.max(Math.abs(a), Math.abs(b));
  // 用相对误差判断，避免大数时"绝对差值看起来很大但其实很接近"
  return diff <= epsilon * scale;
}

/** 综合方案：相对误差 + 绝对误差兜底（可处理接近 0 的情况） */
function nearlyEqual(a, b, epsilon = Number.EPSILON) {
  const diff = Math.abs(a - b);
  // 差值小于绝对容差时直接判定相等（覆盖 a、b 都接近 0 的情形）
  if (diff <= epsilon) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b));
  return diff <= epsilon * scale;
}

console.log('0.1 + 0.2 与 0.3 的绝对差：', Math.abs(0.1 + 0.2 - 0.3));
console.log('Number.EPSILON =', Number.EPSILON);
// 这个差值（约 5.55e-17）比 EPSILON 还小，所以用 EPSILON 当绝对容差恰好能判定相等
console.log('差值 < EPSILON：', Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON); // true
console.log('nearlyEqualAbs(0.1 + 0.2, 0.3)：', nearlyEqualAbs(0.1 + 0.2, 0.3)); // true
console.log('nearlyEqual(0.1 + 0.2, 0.3)：', nearlyEqual(0.1 + 0.2, 0.3)); // true

// 但"刚好能过"是运气。换成量级更大的数，绝对容差立刻失效
const bigA = 1e16 + 1;
const bigB = 1e16;
console.log('\n大数绝对差：', Math.abs(bigA - bigB)); // 0，因为 1e16 + 1 本身就等于 1e16
console.log('换成 1e15 量级：');
const midA = 1e15 + 0.25;
const midB = 1e15;
console.log('绝对差：', Math.abs(midA - midB)); // 0.25
console.log('差值 < EPSILON：', Math.abs(midA - midB) < Number.EPSILON); // false
console.log('nearlyEqualAbs(midA, midB)：', nearlyEqualAbs(midA, midB)); // false ← 绝对容差失效
console.log('nearlyEqualRel(midA, midB, 1e-10)：', nearlyEqualRel(midA, midB, 1e-10)); // true ← 相对误差有效

// 相对误差的原理：容差随数值量级"放大"
console.log('\n相对容差 = EPSILON * max(|a|,|b|) =', Number.EPSILON * Math.abs(midB));

// 工程上更常见的做法是直接给出一个业务容差，例如"金额精确到分"。
// 注意：业务容差是"绝对容差"，应该用 nearlyEqualAbs，而不是带相对误差分支的 nearlyEqual。
const MONEY_TOLERANCE = 0.005; // 半分钱
console.log('\n金额场景的绝对容差 0.005：');
console.log('  nearlyEqualAbs(19.99, 20.0, 0.005) =', nearlyEqualAbs(19.99, 20.0, MONEY_TOLERANCE)); // true
console.log('  nearlyEqualAbs(19.98, 20.0, 0.005) =', nearlyEqualAbs(19.98, 20.0, MONEY_TOLERANCE)); // false

// 同一个容差喂给 nearlyEqual 会得到"看起来不对"的结果，因为它还有相对误差分支：
// scale = 20，相对容差变成 0.005 * 20 = 0.1，于是 0.02 的差值也被判为相等。
console.log('  nearlyEqual(19.98, 20.0, 0.005) =', nearlyEqual(19.98, 20.0, MONEY_TOLERANCE)); // true ← 意外
console.log('  原因：相对分支把它放大成了', MONEY_TOLERANCE * 20);
console.log('  结论：想表达"绝对容差"就用 nearlyEqualAbs，别用带相对分支的版本');

// 重要提醒：容差不是越大越好，太大会把"真的不相等"判成相等
console.log('\n容差过大的风险：', nearlyEqual(1, 1.0000001, 1e-3)); // true ← 明显不同却判等

// ---------------------------------------------------------------------------
// 5. 整数范围与 BigInt
// ---------------------------------------------------------------------------

console.log('--- 5. BigInt 对比 ---');

// BigInt 字面量以 n 结尾，可以精确表示任意大的整数
const bigIntId = 1234567890123456789n;
console.log('BigInt 字面量：', bigIntId);
console.log('typeof：', typeof bigIntId); // 'bigint'
console.log('转成字符串：', bigIntId.toString()); // 内容完全正确

// 与 Number 的对比
console.log('\nNumber 版本的同一个数：', String(snowflakeId));
console.log('BigInt 版本：          ', bigIntId.toString());
console.log('两者转成字符串后相等：', String(snowflakeId) === bigIntId.toString()); // false ← 精度已经丢了

// BigInt 支持超出安全范围的运算
console.log('\n2n ** 100n =', (2n ** 100n).toString());
console.log('(2n ** 100n + 1n) 精确：', (2n ** 100n + 1n).toString());

// 但 BigInt 与 Number 不能混用算术
console.log('\nBigInt 与 Number 混用：');
try {
  console.log('1n + 1 =', 1n + 1);
} catch (err) {
  console.log('  1n + 1 抛出：', err.constructor.name, '-', err.message);
}

// 显式转换后才能混用（BigInt(x) 对小数值安全；Number(big) 可能丢精度）
console.log('  1n + BigInt(1) =', 1n + BigInt(1)); // 2n
console.log('  Number(1n) + 1 =', Number(1n) + 1); // 2
console.log('  大 BigInt 转 Number 会丢精度：', Number(1234567890123456789n)); // 变成 ...789000 之类

// BigInt 的整除与取余
console.log('\n7n / 2n =', 7n / 2n); // 3n，整除（向 0 取整）
console.log('7n % 2n =', 7n % 2n); // 1n
console.log('不能与 Math 方法混用：');

try {
  Math.max(1n, 2n);
} catch (err) {
  console.log('  Math.max(1n, 2n) 抛出：', err.constructor.name);
}

// 从字符串安全解析大整数
function parseBigId(text) {
  // 先用正则确认是纯整数格式，再用 BigInt 解析，避免 Number 介入丢精度
  const s = String(text).trim();
  if (!/^-?\d+$/.test(s)) throw new TypeError(`不是合法的整数：${JSON.stringify(text)}`);
  return BigInt(s);
}
console.log('\nparseBigId("1234567890123456789") =', parseBigId('1234567890123456789').toString());
try {
  parseBigId('12.5');
} catch (err) {
  console.log('parseBigId("12.5") 抛出：', err.constructor.name, '-', err.message);
}

// 注意：JSON.stringify 不支持 BigInt，需要先转字符串
console.log('\nJSON 序列化 BigInt：');
try {
  JSON.stringify({ id: 1n });
} catch (err) {
  console.log('  直接序列化抛出：', err.constructor.name, '-', err.message);
}
console.log('  先转字符串：', JSON.stringify({ id: 1n.toString() }));

// ---------------------------------------------------------------------------
// 6. 判断与防护工具
// ---------------------------------------------------------------------------

console.log('--- 6. 实用防护工具 ---');

/**
 * 安全整数加法：结果超出安全范围时明确报错，而不是静默给错。
 */
function safeAdd(a, b) {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    throw new RangeError('参数必须是安全整数');
  }
  const result = a + b;
  // 加法结果超出安全范围时抛错，避免静默丢精度
  if (!Number.isSafeInteger(result)) {
    throw new RangeError(`结果 ${result} 超出安全整数范围`);
  }
  return result;
}

console.log('safeAdd(1, 2) =', safeAdd(1, 2));
for (const [a, b] of [
  [Number.MAX_SAFE_INTEGER, 1],
  [2 ** 53, 0],
]) {
  try {
    console.log(`safeAdd(${a}, ${b}) =`, safeAdd(a, b));
  } catch (err) {
    console.log(`safeAdd(${a}, ${b}) 抛出：`, err.constructor.name, '-', err.message);
  }
}

/** 把可能超出安全范围的数字（如来自 JSON 的 id）转成字符串并检验是否被改写 */
function idToSafeString(value) {
  const text = String(value);
  // 如果原值是数字且超出安全范围，返回时要把风险说清楚
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    return { text, safe: false, reason: '该数字已超出安全整数范围，内容可能已被改写' };
  }
  return { text, safe: true, reason: 'ok' };
}
console.log('\n安全 id：', JSON.stringify(idToSafeString(123)));
console.log('大 id：  ', JSON.stringify(idToSafeString(snowflakeId)));

/** 判断两个数是否在同一"可表示精度"内相等（用于排序稳定性检查等） */
function sameAtScale(a, b) {
  // 用较大值的量级构造容差，避免固定 EPSILON 在大数上失效
  const scale = Math.max(1, Math.abs(a), Math.abs(b));
  return Math.abs(a - b) < Number.EPSILON * scale;
}
console.log('\nsameAtScale(1e16 + 1, 1e16) =', sameAtScale(1e16 + 1, 1e16)); // true
console.log('sameAtScale(1, 2) =', sameAtScale(1, 2)); // false

console.log('\n全部演示完毕。');
