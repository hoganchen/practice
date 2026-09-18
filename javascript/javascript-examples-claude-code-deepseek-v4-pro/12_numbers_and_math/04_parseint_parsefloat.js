/**
 * ============================================================================
 * 知识点：parseInt 与 parseFloat —— 解析规则、基数参数、与 Number() 的区别
 * ============================================================================
 *
 * 【所属分类】12_numbers_and_math —— 数字与数学运算
 * 【难度等级】进阶
 * 【前置知识】12_numbers_and_math/01_math_object.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 有三条"把值变成数字"的路径，行为差别很大：
 *      Number(x)      严格转换：整个字符串必须是合法数字，否则得到 NaN
 *      parseInt(s, r) 解析：从左往右读，读到不能组成数字为止，返回已解析的整数
 *      parseFloat(s)  解析：同上，但保留小数部分
 *      另外还有一元加号 +x，行为与 Number(x) 完全一致。
 *
 * 2. 为什么需要
 *    处理表单输入、URL 查询参数、配置文件里的 "12px" 这类带单位的值时，
 *    解析型方法能从"不干净"的字符串里榨出数字；严格型方法则适合校验。
 *    选择错误的工具会造成两类 bug：
 *      该报错的地方静默得到 0（如 'abc' → 0，用了位运算或 parseInt 后继续计算）
 *      该容错的地方直接 NaN（如 '12px' 用 Number 转换）
 *
 * 3. 核心语法要点
 *    - parseInt(string, radix)：
 *        • 先转成字符串，再跳过开头的空白
 *        • 读取可选的正负号
 *        • 按 radix 进制读取数字字符，遇到第一个非数字字符就停止
 *        • radix 省略时按前缀推断（0x → 16 进制），否则默认 10
 *        • 一个字符都读不出时返回 NaN
 *    - parseFloat(string)：
 *        • 规则类似，但会读取小数点、指数部分（e/E）
 *        • 不认识 0x 前缀（parseFloat('0x10') === 0）
 *        • 只支持十进制
 *    - Number(x)：
 *        • 处理字符串时会先 trim，空字符串得到 0（这是最反直觉的一点）
 *        • 支持 0x/0o/0b 前缀、Infinity、科学计数法
 *        • 任何不合法内容整体判为 NaN
 *    - 一元 +x 与 Number(x) 等价，是最简洁的写法。
 *
 * 4. 常见陷阱
 *    - parseInt('08') 在 ES5 之后是 8（早期实现会当成八进制），
 *      但为了可读性和确定性，永远显式写 parseInt(s, 10)。
 *    - parseInt('12px') === 12，但 Number('12px') === NaN。
 *    - Number('') === 0 而 parseInt('') === NaN，判空逻辑容易写错。
 *    - Number(null) === 0 而 Number(undefined) === NaN，两者不对称。
 *    - parseInt('1e3') === 1（e 不是数字字符），parseFloat('1e3') === 1000。
 *    - parseInt(0.0000005) === 5，因为小数先被转成了科学计数法字符串 "5e-7"。
 *    - 位运算（| 0、~~）能把值截成 32 位整数，但会丢掉超出范围的高位。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 12_numbers_and_math/04_parseint_parsefloat.js
 *
 * 【预期输出】
 *   用表格对比 Number / parseInt / parseFloat 在各类输入下的返回值。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. parseInt 的解析规则
// ---------------------------------------------------------------------------

console.log('--- 1. parseInt 解析规则 ---');

// 从左往右读，遇到第一个不能构成数字的字符就停
console.log("parseInt('42') =", parseInt('42'));
console.log("parseInt('42px') =", parseInt('42px')); // 42，后面的被忽略
console.log("parseInt('42.9') =", parseInt('42.9')); // 42，小数点处停止
console.log("parseInt('abc') =", parseInt('abc')); // NaN，一个字符都读不出
console.log("parseInt('') =", parseInt('')); // NaN，空串没有任何数字

// 开头的空白会被跳过
console.log("\nparseInt('   42') =", parseInt('   42')); // 42
console.log("parseInt('\\t\\n42') =", parseInt('\t\n42')); // 42

// 正负号会被识别（但只能出现在开头）
console.log("\nparseInt('-42') =", parseInt('-42')); // -42
console.log("parseInt('+42') =", parseInt('+42')); // 42
console.log("parseInt('4-2') =", parseInt('4-2')); // 4，中间的负号不被识别，直接停止

// 不认识小数点与指数
console.log("\nparseInt('3.99') =", parseInt('3.99')); // 3
console.log("parseInt('1e3') =", parseInt('1e3')); // 1，e 不是数字字符

// ---------------------------------------------------------------------------
// 2. parseInt 的基数参数（radix）
// ---------------------------------------------------------------------------

console.log('--- 2. radix 基数 ---');

// 第二个参数指定进制，取值 2~36
console.log("parseInt('101', 2) =", parseInt('101', 2)); // 5（二进制）
console.log("parseInt('777', 8) =", parseInt('777', 8)); // 511（八进制）
console.log("parseInt('ff', 16) =", parseInt('ff', 16)); // 255（十六进制）
console.log("parseInt('zz', 36) =", parseInt('zz', 36)); // 1295（36 进制）

// 显式传 10 是最佳实践：避免历史实现的八进制歧义
console.log("\nparseInt('08') =", parseInt('08')); // 8（现代实现）
console.log("parseInt('08', 10) =", parseInt('08', 10)); // 8，语义明确
console.log("parseInt('010') =", parseInt('010')); // 10（现代实现不再是八进制）
console.log("parseInt('010', 8) =", parseInt('010', 8)); // 8，显式八进制

// 省略 radix 时，0x 前缀会被自动识别为 16 进制
console.log("\nparseInt('0x1f') =", parseInt('0x1f')); // 31
console.log("parseInt('0x1f', 16) =", parseInt('0x1f', 16)); // 31，显式指定也一样
console.log("parseInt('0x1f', 10) =", parseInt('0x1f', 10)); // 0，十进制下 0 之后 x 就停了
// 注意：ES5 之后 0 开头不再被当作八进制，所以 '010' 就是 10

// 基数超出范围时，解析行为会退化
console.log("\nparseInt('10', 1) =", parseInt('10', 1)); // NaN，基数 1 无意义
console.log("parseInt('10', 37) =", parseInt('10', 37)); // NaN，基数上限是 36
console.log("parseInt('10', 0) =", parseInt('10', 0)); // 10，0 表示"按前缀自动判断"

// 基数本身也会被转成整数
console.log("parseInt('10', 16.9) =", parseInt('10', 16.9)); // 16
console.log("parseInt('10', '16') =", parseInt('10', '16')); // 16，字符串基数也认

// ---------------------------------------------------------------------------
// 3. parseFloat 的解析规则
// ---------------------------------------------------------------------------

console.log('--- 3. parseFloat 解析规则 ---');

console.log("parseFloat('3.14') =", parseFloat('3.14')); // 3.14
console.log("parseFloat('3.14abc') =", parseFloat('3.14abc')); // 3.14
console.log("parseFloat('abc') =", parseFloat('abc')); // NaN
console.log("parseFloat('') =", parseFloat('')); // NaN

// 支持指数记法
console.log("\nparseFloat('1e3') =", parseFloat('1e3')); // 1000
console.log("parseFloat('1.5e-2') =", parseFloat('1.5e-2')); // 0.015
console.log("parseFloat('1e') =", parseFloat('1e')); // 1，e 后面没有数字，回退到 1

// 不认识 0x 前缀
console.log("\nparseFloat('0x1f') =", parseFloat('0x1f')); // 0
console.log("parseFloat('0b101') =", parseFloat('0b101')); // 0

// 只认一个小数点：第二个点之后停止
console.log("\nparseFloat('1.2.3') =", parseFloat('1.2.3')); // 1.2
console.log("parseFloat('.5') =", parseFloat('.5')); // 0.5
console.log("parseFloat('5.') =", parseFloat('5.')); // 5
console.log("parseFloat('Infinity') =", parseFloat('Infinity')); // Infinity

// ---------------------------------------------------------------------------
// 4. Number() 与一元加号
// ---------------------------------------------------------------------------

console.log('--- 4. Number() 严格转换 ---');

// 整个字符串必须是合法数字，否则一律 NaN
console.log("Number('42') =", Number('42'));
console.log("Number('42px') =", Number('42px')); // NaN ← 与 parseInt 的关键区别
console.log("Number(' 42 ') =", Number(' 42 ')); // 42，首尾空白会被去掉
console.log("Number('') =", Number('')); // 0 ← 最反直觉的一点
console.log("Number('   ') =", Number('   ')); // 0，全是空白也是 0

// 支持各种进制前缀与科学计数法
console.log("\nNumber('0x1f') =", Number('0x1f')); // 31
console.log("Number('0o17') =", Number('0o17')); // 15
console.log("Number('0b101') =", Number('0b101')); // 5
console.log("Number('1e3') =", Number('1e3')); // 1000
console.log("Number('Infinity') =", Number('Infinity')); // Infinity

// null / undefined / 布尔值 的转换
console.log('\nNumber(null) =', Number(null)); // 0
console.log('Number(undefined) =', Number(undefined)); // NaN ← 两者不对称
console.log('Number(true) =', Number(true)); // 1
console.log('Number(false) =', Number(false)); // 0

// 一元加号与 Number() 完全等价
console.log("\n+'42' === Number('42')：", +'42' === Number('42')); // true
console.log("+'42px' =", +'42px'); // NaN

// ---------------------------------------------------------------------------
// 5. 三者对照表
// ---------------------------------------------------------------------------

console.log('--- 5. 对照表 ---');

const inputs = [
  '42',
  '42px',
  '3.14',
  '1e3',
  '  7  ',
  '',
  '  ',
  'abc',
  '0x1f',
  '08',
  '-12.5',
  'Infinity',
  null,
  undefined,
  true,
  3.9,
];

console.log(' 输入          Number       parseInt     parseFloat');
for (const input of inputs) {
  // 统一成显示用的标签，null/undefined 要单独标注出来才看得清
  const label = input === null ? 'null' : input === undefined ? 'undefined' : JSON.stringify(input);
  const num = String(Number(input));
  const pInt = String(parseInt(input, 10));
  const pFloat = String(parseFloat(input));
  console.log(`  ${label.padEnd(14)}${num.padEnd(13)}${pInt.padEnd(13)}${pFloat}`);
}

// ---------------------------------------------------------------------------
// 6. 经典陷阱
// ---------------------------------------------------------------------------

console.log('--- 6. 经典陷阱 ---');

// 陷阱 1：小数被转成科学计数法字符串后再解析
console.log('parseInt(0.0000005) =', parseInt(0.0000005)); // 5 ← 因为 String(5e-7) === '5e-7'
console.log('  中间过程：String(0.0000005) =', JSON.stringify(String(0.0000005)));
console.log('  正确做法（取整）：Math.floor(0.0000005) =', Math.floor(0.0000005));
console.log('  正确做法（截断）：Math.trunc(0.0000005) =', Math.trunc(0.0000005));

// 陷阱 2：'abc' 用位运算变 0，错误被吞掉
console.log("\n'abc' | 0 =", 'abc' | 0); // 0，不报错也不给 NaN
console.log("parseInt('abc', 10) =", parseInt('abc', 10)); // NaN，至少能发现异常
console.log("Number('abc') =", Number('abc')); // NaN，最明确

// 陷阱 3：Number('') === 0，导致"空输入"被当成 0 参与计算
function sumBad(values) {
  return values.reduce((acc, v) => acc + Number(v), 0);
}
function sumGood(values) {
  return values.reduce((acc, v) => {
    const n = Number(v);
    // 只有真正合法的数字才累加，空串/非法值按 0 处理但会单独报警
    if (Number.isNaN(n)) return acc;
    return acc + n;
  }, 0);
}
console.log('\nsumBad(["1", "", "2"]) =', sumBad(['1', '', '2'])); // 3，但 '' 被当成 0 混进去了
console.log('sumGood(["1", "", "2"]) =', sumGood(['1', '', '2'])); // 3，语义更清晰

// 陷阱 4：位运算截断到 32 位
console.log('\n2147483648 | 0 =', 2147483648 | 0); // -2147483648，溢出
console.log("'1234567890123' | 0 =", '1234567890123' | 0); // 完全错误的值
console.log("parseInt('1234567890123', 10) =", parseInt('1234567890123', 10)); // 正确

// 陷阱 5：parseInt 会忽略前导零，但不会忽略前导空格之后的内容边界
console.log("\nparseInt('  0x10  ', 10) =", parseInt('  0x10  ', 10)); // 0
console.log("parseInt('  0x10  ') =", parseInt('  0x10  ')); // 16

// ---------------------------------------------------------------------------
// 7. 实战：安全的数字解析工具
// ---------------------------------------------------------------------------

console.log('--- 7. 实战工具 ---');

/**
 * 严格解析整数：非法输入返回默认值，绝不静默变成 0。
 * 适合处理表单、查询参数、配置项。
 */
function toInt(value, defaultValue = 0) {
  // 先用 Number 做严格校验，避免 parseInt 的"部分解析"行为
  const n = Number(value);
  if (!Number.isFinite(n)) return defaultValue;
  return Math.trunc(n);
}
console.log('toInt("42") =', toInt('42')); // 42
console.log('toInt("42px") =', toInt('42px', -1)); // -1，非法输入走默认值
console.log('toInt("") =', toInt('', -1)); // 0 ← 注意 Number('') 是 0
console.log('toInt(null) =', toInt(null, -1)); // 0 ← Number(null) 也是 0
console.log('toInt("abc") =', toInt('abc', -1)); // -1

/**
 * 从"带单位/带前后缀"的字符串里提取数字，例如 CSS 的 '12px'、'1.5rem'。
 * 这类场景才是 parseInt / parseFloat 的正确用武之地。
 */
function parseLeadingNumber(value, defaultValue = NaN) {
  // parseFloat 会跳过前导空白并读到第一个非法字符为止
  const n = parseFloat(value);
  // parseFloat 可能返回 Infinity，这里一并当作非法
  return Number.isFinite(n) ? n : defaultValue;
}
console.log('\nparseLeadingNumber("12px") =', parseLeadingNumber('12px')); // 12
console.log('parseLeadingNumber("1.5rem") =', parseLeadingNumber('1.5rem')); // 1.5
console.log('parseLeadingNumber("-3.2em") =', parseLeadingNumber('-3.2em')); // -3.2
console.log('parseLeadingNumber("auto") =', parseLeadingNumber('auto', 0)); // 0

/**
 * 严格解析浮点数（含小数），用于金额输入。
 */
function toFloat(value, defaultValue = NaN) {
  const n = Number(value);
  return Number.isFinite(n) ? n : defaultValue;
}
console.log('\ntoFloat("3.14") =', toFloat('3.14'));
console.log('toFloat("3,14") =', toFloat('3,14', -1)); // -1，逗号不是合法分隔符
console.log('toFloat("1e3") =', toFloat('1e3')); // 1000

/** 判断一个字符串能否被安全地当作整数使用 */
function isIntegerString(value) {
  const s = String(value).trim();
  // 用正则限定格式，再交给 Number 转换，避免 Number('') 是 0 的坑
  if (!/^[+-]?\d+$/.test(s)) return false;
  const n = Number(s);
  // 超出安全整数范围时也不算"能安全使用"
  return Number.isSafeInteger(n);
}
console.log('\nisIntegerString("42") =', isIntegerString('42')); // true
console.log('isIntegerString("42.0") =', isIntegerString('42.0')); // false
console.log('isIntegerString("") =', isIntegerString('')); // false ← 不会误判成 0
console.log('isIntegerString("1e3") =', isIntegerString('1e3')); // false
console.log('isIntegerString("99999999999999999999") =', isIntegerString('99999999999999999999')); // false

console.log('\n全部演示完毕。');
