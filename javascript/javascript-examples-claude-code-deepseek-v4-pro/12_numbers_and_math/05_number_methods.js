/**
 * ============================================================================
 * 知识点：Number 的静态方法与实例方法 —— toFixed / toPrecision / toExponential / toString(radix)
 * ============================================================================
 *
 * 【所属分类】12_numbers_and_math —— 数字与数学运算
 * 【难度等级】进阶
 * 【前置知识】12_numbers_and_math/04_parseint_parsefloat.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Number 既是"装箱构造函数"，也是"静态方法集合"。分两类使用：
 *      静态（写在 Number 上）：
 *        Number.isInteger / isSafeInteger / isFinite / isNaN
 *        Number.parseInt / parseFloat（与全局版本相同）
 *        Number.EPSILON / MAX_SAFE_INTEGER / MIN_SAFE_INTEGER
 *        Number.MAX_VALUE / MIN_VALUE / POSITIVE_INFINITY / NEGATIVE_INFINITY / NaN
 *      实例（写在数字上，会触发装箱）：
 *        toFixed(n)      保留 n 位小数 → 字符串
 *        toPrecision(n)  保留 n 位有效数字 → 字符串（可能返回科学计数法）
 *        toExponential(n) 用科学计数法表示，保留 n 位小数 → 字符串
 *        toString(radix) 按指定进制转成字符串
 *        toLocaleString  按本地习惯格式化（见 09 号文件）
 *        valueOf()       取回原始数值
 *
 * 2. 为什么需要
 *    - 校验：判断一个值是不是"真正安全的整数"，必须用 Number.isSafeInteger。
 *    - 展示：金额、比率、大数都要转成指定精度的字符串。
 *    - 调试：想看一个数的原始二进制精度就用 toPrecision(20)。
 *    - 进制转换：颜色值、位掩码、Base36 短链接 id 都会用到 toString(radix)。
 *
 * 3. 核心语法要点
 *    - 静态 isXxx 方法（Number.isInteger 等）不做类型转换，
 *      而全局的 isFinite / isNaN 会先把参数转成数字，这是关键区别：
 *        isNaN('abc')          → true（先 Number('abc') 再判断）
 *        Number.isNaN('abc')   → false（'abc' 根本不是数字类型）
 *        isFinite('42')        → true
 *        Number.isFinite('42') → false
 *    - Number.isInteger(3.0) 是 true（3.0 与 3 是同一个值），
 *      Number.isInteger(3.5) 是 false。
 *    - toPrecision(n) 的 n 是"有效数字位数"（含整数部分），与 toFixed 完全不同。
 *    - toString(radix) 的 radix 取 2~36；超出范围会抛 RangeError。
 *    - 数字字面量直接调用方法时要注意语法：1.toString() 会被当成小数点解析，
 *      必须写 (1).toString() 或 1..toString() 或 1 .toString()。
 *
 * 4. 常见陷阱
 *    - 用全局 isNaN 判断"用户输入是否是数字"，会把 'abc' 判为 NaN，
 *      但它其实"不是数字类型"；语义不同，应优先用 Number.isNaN。
 *    - toFixed 与 toPrecision 都返回字符串，直接参与算术会触发隐式转换，
 *      偶尔产生意外（如 '1.5' + 1 === '1.51'）。它们的具体取舍见 02 号文件。
 *    - Number.MIN_VALUE 是"最小的正数"（约 5e-324），不是"最小的负数"；
 *      最小负数是 -Number.MAX_VALUE。
 *    - 浮点数没有负的 MIN_VALUE，别把它当成 -(MAX_VALUE)。
 *    - 对 NaN 调用任何实例方法都得到 NaN 或 'NaN'，需要提前判断。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 12_numbers_and_math/05_number_methods.js
 *
 * 【预期输出】
 *   分组演示静态判断方法、进制转换与三种格式化方法的行为差异。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 静态判断方法
// ---------------------------------------------------------------------------

console.log('--- 1. 静态判断方法 ---');

// Number.isInteger：不转换类型，只有真正的整数值才返回 true
console.log('Number.isInteger(5) =', Number.isInteger(5)); // true
console.log('Number.isInteger(5.0) =', Number.isInteger(5.0)); // true，5.0 就是 5
console.log('Number.isInteger(5.5) =', Number.isInteger(5.5)); // false
console.log("Number.isInteger('5') =", Number.isInteger('5')); // false ← 不做类型转换
console.log('Number.isInteger(NaN) =', Number.isInteger(NaN)); // false
console.log('Number.isInteger(Infinity) =', Number.isInteger(Infinity)); // false
console.log('Number.isInteger(-0) =', Number.isInteger(-0)); // true

// Number.isFinite：既要是数字类型，又要不是 ±Infinity / NaN
console.log('\nNumber.isFinite(42) =', Number.isFinite(42)); // true
console.log('Number.isFinite(Infinity) =', Number.isFinite(Infinity)); // false
console.log('Number.isFinite(NaN) =', Number.isFinite(NaN)); // false
console.log("Number.isFinite('42') =", Number.isFinite('42')); // false ← 类型不同

// 与全局版本对比：全局版本会先做类型转换
console.log('\n全局 isFinite("42") =', isFinite('42')); // true ← 被转成了数字
console.log('全局 isFinite("") =', isFinite('')); // true ← 空串转成 0，也是有限的
console.log("全局 isFinite(null) =", isFinite(null)); // true ← null 转成 0

// Number.isNaN：只有真正的 NaN 才是 true
console.log('\nNumber.isNaN(NaN) =', Number.isNaN(NaN)); // true
console.log("Number.isNaN('abc') =", Number.isNaN('abc')); // false ← 它不是数字类型
console.log("全局 isNaN('abc') =", isNaN('abc')); // true ← 转成数字后是 NaN
console.log("全局 isNaN('42') =", isNaN('42')); // false
console.log("全局 isNaN('') =", isNaN('')); // false ← '' 转成了 0

// NaN 是唯一不等于自己的值，这是老式判断法的原理
console.log('\nNaN === NaN =', NaN === NaN); // false
console.log('x !== x 判断法：', (() => {
  const x = NaN;
  return x !== x;
})()); // true

// 结论：判断"某个值是不是数字"用 Number.isFinite；判断"是不是 NaN"用 Number.isNaN
function isValidNumber(v) {
  // 一次性排除：非数字类型、NaN、±Infinity
  return Number.isFinite(v);
}
console.log('\nisValidNumber(0) =', isValidNumber(0)); // true
console.log('isValidNumber(NaN) =', isValidNumber(NaN)); // false
console.log("isValidNumber('0') =", isValidNumber('0')); // false

// ---------------------------------------------------------------------------
// 2. 常量
// ---------------------------------------------------------------------------

console.log('--- 2. Number 常量 ---');

console.log('Number.EPSILON =', Number.EPSILON); // 约 2.22e-16
console.log('Number.MAX_SAFE_INTEGER =', Number.MAX_SAFE_INTEGER); // 2^53 - 1
console.log('Number.MIN_SAFE_INTEGER =', Number.MIN_SAFE_INTEGER); // -(2^53 - 1)
console.log('Number.MAX_VALUE =', Number.MAX_VALUE); // 最大的有限正数
console.log('Number.MIN_VALUE =', Number.MIN_VALUE); // 最小的正数（不是最小负数！）
console.log('Number.POSITIVE_INFINITY =', Number.POSITIVE_INFINITY);
console.log('Number.NEGATIVE_INFINITY =', Number.NEGATIVE_INFINITY);
console.log('Number.NaN =', Number.NaN);

// MIN_VALUE 的真相：它是最接近 0 的正数
console.log('\nNumber.MIN_VALUE > 0：', Number.MIN_VALUE > 0); // true
console.log('最小的负数是 -Number.MAX_VALUE：', -Number.MAX_VALUE);
console.log('MIN_VALUE 与 MIN_SAFE_INTEGER 完全不是一回事');

// 是否在安全整数范围内
console.log('\nNumber.isSafeInteger(Number.MAX_SAFE_INTEGER) =', Number.isSafeInteger(Number.MAX_SAFE_INTEGER)); // true
console.log('Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 1) =', Number.isSafeInteger(Number.MAX_SAFE_INTEGER + 1)); // false
console.log('Number.isSafeInteger(2 ** 53) =', Number.isSafeInteger(2 ** 53)); // false

// 超过安全范围的整数运算会静默出错（详见 06 号文件）
console.log('\n2 ** 53 === 2 ** 53 + 1：', 2 ** 53 === 2 ** 53 + 1); // true ← 精度丢失

// 静态的 parseInt / parseFloat 与全局版本是同一个函数
console.log('\nNumber.parseInt === parseInt：', Number.parseInt === parseInt); // true
console.log('Number.parseFloat === parseFloat：', Number.parseFloat === parseFloat); // true

// ---------------------------------------------------------------------------
// 3. toString(radix) 进制转换
// ---------------------------------------------------------------------------

console.log('--- 3. toString(radix) ---');

const n = 255;
console.log('n =', n);
console.log('toString(2)  =', n.toString(2)); // '11111111'
console.log('toString(8)  =', n.toString(8)); // '377'
console.log('toString(10) =', n.toString(10)); // '255'
console.log('toString(16) =', n.toString(16)); // 'ff'
console.log('toString(36) =', n.toString(36)); // '73'
console.log('toString() 默认 10 进制 =', n.toString());

// 字面量直接调用方法：第一个点会被当成小数点，需要额外处理
console.log('\n(255).toString(16) =', (255).toString(16)); // 加括号
console.log('255..toString(16) =', (255).toString(16)); // 两个点也行（第一个是小数点）
console.log('255 .toString(16) =', (255).toString(16)); // 空格隔开也可以
// 下面这行会报错，仅作说明：255.toString(16) → SyntaxError

// 返回的都是字符串
console.log('\ntypeof =', typeof n.toString(2)); // string

// 进制转换对小数同样有效
console.log('\n(10.5).toString(2) =', (10.5).toString(2)); // 二进制小数

// 负数
console.log('(-255).toString(16) =', (-255).toString(16)); // '-ff'

// 实战 1：十进制颜色转十六进制 CSS 颜色
function rgbToHex(r, g, b) {
  // 每段转 16 进制并补足两位，再拼起来
  const part = (v) => {
    // 夹到 0~255 并取整，防止越界值产生非法颜色
    const clamped = Math.min(255, Math.max(0, Math.round(v)));
    return clamped.toString(16).padStart(2, '0');
  };
  return `#${part(r)}${part(g)}${part(b)}`;
}
console.log('\nrgbToHex(255, 128, 0) =', rgbToHex(255, 128, 0));
console.log('rgbToHex(0, 0, 0) =', rgbToHex(0, 0, 0));
console.log('rgbToHex(300, -5, 16) =', rgbToHex(300, -5, 16)); // 越界被夹住

// 实战 2：把自增 id 转成短字符串（Base36 短链接思路）
function toShortId(id) {
  return Number(id).toString(36);
}
function fromShortId(code) {
  // parseInt 指定 36 进制即可还原
  return parseInt(code, 36);
}
console.log('\ntoShortId(1234567890) =', toShortId(1234567890));
console.log('还原：', fromShortId(toShortId(1234567890)));
console.log('toShortId(1000000) =', toShortId(1000000));

// 实战 3：查看整数的二进制位（位掩码调试）
function toBinary(value, width = 8) {
  // 用 padStart 补齐到固定宽度，负数用其补码形式不方便展示，这里只演示正数
  return Math.trunc(value).toString(2).padStart(width, '0');
}
console.log('\ntoBinary(5) =', toBinary(5)); // '00000101'
console.log('toBinary(0b1010, 8) =', toBinary(0b1010, 8)); // '00001010'

// 进制超出 2~36 会抛 RangeError
for (const radix of [1, 37]) {
  try {
    console.log(`n.toString(${radix}) =`, n.toString(radix));
  } catch (err) {
    console.log(`n.toString(${radix}) 抛出：`, err.constructor.name, '-', err.message);
  }
}

// ---------------------------------------------------------------------------
// 4. toFixed / toPrecision / toExponential
// ---------------------------------------------------------------------------

console.log('--- 4. 三种格式化方法 ---');

const value = 1234.5678;
console.log('原值：', value);

// toFixed(n)：保留 n 位小数
console.log('\ntoFixed(0) =', JSON.stringify(value.toFixed(0))); // "1235"
console.log('toFixed(1) =', JSON.stringify(value.toFixed(1))); // "1234.6"
console.log('toFixed(2) =', JSON.stringify(value.toFixed(2))); // "1234.57"
console.log('toFixed(6) =', JSON.stringify(value.toFixed(6))); // "1234.567800"

// toPrecision(n)：保留 n 位有效数字（含整数部分）
console.log('\ntoPrecision(1) =', JSON.stringify(value.toPrecision(1))); // "1e+3"
console.log('toPrecision(3) =', JSON.stringify(value.toPrecision(3))); // "1.23e+3"
console.log('toPrecision(6) =', JSON.stringify(value.toPrecision(6))); // "1234.57"
console.log('toPrecision(8) =', JSON.stringify(value.toPrecision(8))); // "1234.5678"
console.log('toPrecision(10) =', JSON.stringify(value.toPrecision(10))); // "1234.567800"
console.log('不传参数时等价于 toString()：', JSON.stringify(value.toPrecision()));

// toExponential(n)：科学计数法，n 是小数位数
console.log('\ntoExponential(0) =', JSON.stringify(value.toExponential(0))); // "1e+3"
console.log('toExponential(2) =', JSON.stringify(value.toExponential(2))); // "1.23e+3"
console.log('toExponential(5) =', JSON.stringify(value.toExponential(5))); // "1.23457e+3"
console.log('不传参数时保留全部精度：', JSON.stringify(value.toExponential()));

// 一个直观的对照表
console.log('\n 值         toFixed(2)     toPrecision(2)   toExponential(2)');
for (const v of [0.00123, 1.5, 42, 3.14159, 123456]) {
  console.log(
    `  ${String(v).padEnd(11)}${JSON.stringify(v.toFixed(2)).padEnd(15)}` +
      `${JSON.stringify(v.toPrecision(2)).padEnd(17)}${JSON.stringify(v.toExponential(2))}`,
  );
}

// 用 toPrecision(20) 看穿浮点数的真实内部值（调试利器）
console.log('\n调试技巧：');
console.log('(0.1).toPrecision(20) =', (0.1).toPrecision(20));
console.log('(0.2).toPrecision(20) =', (0.2).toPrecision(20));
console.log('(0.1 + 0.2).toPrecision(20) =', (0.1 + 0.2).toPrecision(20));
console.log('(1/3).toPrecision(20) =', (1 / 3).toPrecision(20));

// 参数超出范围时的异常
console.log('\n参数越界：');
for (const [name, fn] of [
  ['toFixed(101)', () => (1).toFixed(101)],
  ['toPrecision(0)', () => (1).toPrecision(0)],
  ['toPrecision(101)', () => (1).toPrecision(101)],
  ['toExponential(101)', () => (1).toExponential(101)],
]) {
  try {
    console.log(`  ${name} =`, fn());
  } catch (err) {
    console.log(`  ${name} 抛出：`, err.constructor.name);
  }
}

// toFixed 与 toPrecision 都返回字符串，参与算术时要小心
console.log('\n返回值类型：');
console.log('  typeof (1.5).toFixed(2) =', typeof (1.5).toFixed(2)); // string
console.log("  '1.50' + 1 =", JSON.stringify('1.50' + 1)); // 字符串拼接，不是 2.5
console.log('  Number((1.5).toFixed(2)) + 1 =', Number((1.5).toFixed(2)) + 1); // 2.5

// ---------------------------------------------------------------------------
// 5. 实例方法与装箱
// ---------------------------------------------------------------------------

console.log('--- 5. 实例方法与装箱 ---');

// 数字是原始值，调用方法时会被临时装箱成 Number 对象
const num = 42;
console.log('num.valueOf() =', num.valueOf(), '| typeof =', typeof num.valueOf());
console.log('num.toString() =', JSON.stringify(num.toString()));
console.log('typeof num =', typeof num); // 'number'，没有被永久装箱

// 用 Object() 显式装箱会得到对象
const boxed = Object(42);
console.log('\ntypeof Object(42) =', typeof boxed); // 'object'
console.log('boxed === 42：', boxed === 42); // false
console.log('boxed == 42：', boxed == 42); // true，宽松相等会拆箱
console.log('boxed.valueOf() === 42：', boxed.valueOf() === 42); // true

// new Number() 是反面教材，和 new String() 一样不该使用
const badBoxed = new Number(42);
console.log('\ntypeof new Number(42) =', typeof badBoxed); // 'object'
console.log('Boolean(new Number(0)) =', Boolean(new Number(0))); // true ← 对象永远是真值

// NaN 与 Infinity 也能调用实例方法（结果是字符串形式的自己）
console.log('\n(NaN).toString() =', JSON.stringify(NaN.toString())); // "NaN"
console.log('(Infinity).toFixed(2) =', JSON.stringify(Infinity.toFixed(2))); // "Infinity"

console.log('\n全部演示完毕。');
