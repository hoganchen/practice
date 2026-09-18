/**
 * ============================================================================
 * 知识点：number 类型 —— 双精度浮点、安全整数、NaN / Infinity
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】入门
 * 【前置知识】03_data_types/03_type_conversion.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 只有一种数字类型 number（ES2020 起增加了 bigint 作为补充）。
 *    它遵循 IEEE 754 双精度 64 位浮点标准：1 位符号 + 11 位指数 + 52 位尾数。
 *    也就是说整数和小数共用同一个类型，都是"浮点数"。
 *
 * 2. 为什么会有精度问题
 *    因为 64 位里只有 52 位用于表示有效数字（约 15~17 位十进制），
 *    而且二进制无法精确表示 0.1、0.2 这类十进制小数（类似十进制无法精确
 *    表示 1/3）。所以 0.1 + 0.2 得到 0.30000000000000004 而不是 0.3。
 *    同理，超过 2^53 - 1 的整数无法保证唯一，需要 bigint。
 *
 * 3. 核心语法要点
 *    · 安全整数范围：Number.MIN_SAFE_INTEGER = -(2^53 - 1) = -9007199254740991，
 *      Number.MAX_SAFE_INTEGER = 2^53 - 1 = 9007199254740991。
 *      在此区间内，整数与浮点数一一对应；超出后相邻两个整数可能映射到同一个值。
 *    · Number.isSafeInteger(v) 判断是否为安全整数。
 *    · 三个特殊值：
 *        NaN       —— Not a Number，"无效的数值运算结果"，与任何值都不相等（含自身）。
 *        Infinity  —— 正无穷，如 1/0；-Infinity 为负无穷。
 *        -0        —— 负零，与 +0 在 === 下相等，但 Object.is 能区分。
 *    · Number.isNaN(v) 只对"真正的 NaN"返回 true；
 *      全局 isNaN(v) 会先做 Number(v) 转换，所以 isNaN('abc') 也是 true。
 *    · Number.isFinite(v) 只对有限数字返回 true，不做类型转换；
 *      全局 isFinite('123') 会先转成 123 再判断。
 *    · 比较浮点数不要在 === 上做，应该比较差值是否小于一个极小量（Number.EPSILON）。
 *    · 所有 number 都可以调用方法：toFixed / toPrecision / toString(radix)。
 *
 * 4. 常见陷阱
 *    · 0.1 + 0.2 !== 0.3；1 - 0.9 !== 0.1。
 *    · 大整数相加丢精度：9007199254740992 + 1 仍是 9007199254740992。
 *    · parseInt('08') 在某些旧环境下按八进制解析，务必传第二个参数 10。
 *    · toFixed 返回的是字符串，且采用银行家式近似的边界可能不合直觉。
 *    · 除以 0 不抛错，得到 Infinity（与很多语言不同）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/04_number_type.js
 *
 * 【预期输出】
 *   打印浮点精度实验、安全整数边界、NaN / Infinity / -0 行为、
 *   Number.isNaN 与全局 isNaN 的差异对比。全部为确定输出，退出码 0。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 双精度浮点与经典精度问题
// ---------------------------------------------------------------------------

console.log('--- 1. 双精度浮点的精度问题 ---');

console.log('0.1 + 0.2        =', 0.1 + 0.2);
console.log('0.1 + 0.2 === 0.3 ?', 0.1 + 0.2 === 0.3, '← 经典坑');
console.log('1 - 0.9          =', 1 - 0.9);
console.log('0.3 - 0.2        =', 0.3 - 0.2);
console.log('0.1 * 3          =', 0.1 * 3);
console.log('(0.1 + 0.2).toFixed(2) =', (0.1 + 0.2).toFixed(2), '（toFixed 返回字符串）');

// 正确比较方式：判断差值是否小于一个足够小的容差。
console.log('Number.EPSILON   =', Number.EPSILON);
const nearlyEqual = (a, b) => Math.abs(a - b) < Number.EPSILON;
console.log('nearlyEqual(0.1 + 0.2, 0.3) =', nearlyEqual(0.1 + 0.2, 0.3), '← 推荐做法');

// 涉及金额时更稳妥的方案：全部转成"分"用整数运算。
console.log('金额方案：(0.1 * 100 + 0.2 * 100) / 100 =', (0.1 * 100 + 0.2 * 100) / 100);

// ---------------------------------------------------------------------------
// 2. 安全整数范围
// ---------------------------------------------------------------------------

console.log('--- 2. 安全整数范围 ---');

console.log('Number.MAX_SAFE_INTEGER =', Number.MAX_SAFE_INTEGER);
console.log('Number.MIN_SAFE_INTEGER =', Number.MIN_SAFE_INTEGER);
console.log('2 ** 53                 =', 2 ** 53, '（超出安全范围的那个边界值）');

console.log('Number.isSafeInteger(9007199254740991)  =', Number.isSafeInteger(9007199254740991));
console.log('Number.isSafeInteger(9007199254740992)  =', Number.isSafeInteger(9007199254740992));

// 超出安全范围后，加 1 不再改变数值 —— 精度已经丢失。
console.log('9007199254740992 + 1 =', 9007199254740992 + 1, '← 没能加 1！');
console.log('9007199254740993 字面量实际存成 =', 9007199254740993);
console.log('9007199254740993n 用 BigInt 才准确 =', 9007199254740993n);

// ---------------------------------------------------------------------------
// 3. NaN：不是数字的"数字"
// ---------------------------------------------------------------------------

console.log('--- 3. NaN ---');

console.log('0 / 0            =', 0 / 0);
console.log("Number('abc')    =", Number('abc'));
console.log('Math.sqrt(-1)    =', Math.sqrt(-1));
console.log("parseInt('xyz')  =", parseInt('xyz', 10));
console.log('undefined + 1    =', undefined + 1);

// NaN 最大的特征：不等于任何值，包括它自己。
console.log('NaN === NaN      =', NaN === NaN, '← 连自己都不等于');
console.log('NaN !== NaN      =', NaN !== NaN);

// 正确的判断方式：Number.isNaN。它只对真正的 NaN 返回 true。
console.log('Number.isNaN(NaN)       =', Number.isNaN(NaN));
console.log('Number.isNaN("abc")     =', Number.isNaN('abc'), '（不做类型转换）');
console.log('Number.isNaN(undefined) =', Number.isNaN(undefined));

// 全局 isNaN 会先做 Number() 转换，因此会把"非数字的值"也判为 true。
console.log('isNaN("abc")       =', isNaN('abc'), '← 转成 NaN，于是 true');
console.log('isNaN("123")       =', isNaN('123'), '← 转成 123，于是 false');
console.log('isNaN("")          =', isNaN(''), '← "" 转成 0，于是 false');
console.log('isNaN(null)        =', isNaN(null));
console.log('isNaN([])          =', isNaN([]), '（[] → "" → 0 → false）');
console.log('Number.isNaN("")   =', Number.isNaN(''), '← 对比：更严格');

// 结论：判断"值是不是 NaN"用 Number.isNaN；
//       判断"值能不能当数字用"更适合用 typeof v === 'number' && !Number.isNaN(v)
//       或者 Number.isFinite(v)。

// ---------------------------------------------------------------------------
// 4. Infinity 与 -Infinity
// ---------------------------------------------------------------------------

console.log('--- 4. Infinity ---');

console.log('1 / 0          =', 1 / 0);
console.log('-1 / 0         =', -1 / 0);
console.log('Infinity + 1   =', Infinity + 1);
console.log('Infinity * 0   =', Infinity * 0, '（NaN）');
console.log('Infinity - Infinity =', Infinity - Infinity);
console.log('Number.MAX_VALUE * 2 =', Number.MAX_VALUE * 2, '（溢出成 Infinity）');

// 判断是否有限：
console.log('Number.isFinite(1e308)   =', Number.isFinite(1e308));
console.log('Number.isFinite(Infinity) =', Number.isFinite(Infinity));
console.log('Number.isFinite("123")    =', Number.isFinite('123'), '（不做类型转换）');
console.log('isFinite("123")           =', isFinite('123'), '（全局版会先转换）');
console.log('isFinite("abc")           =', isFinite('abc'));

// ---------------------------------------------------------------------------
// 5. 正零与负零
// ---------------------------------------------------------------------------

console.log('--- 5. +0 与 -0 ---');

console.log('0 === -0        =', 0 === -0, '（=== 认为相等）');
console.log('Object.is(0, -0) =', Object.is(0, -0), '（Object.is 能区分）');
console.log('1 / 0           =', 1 / 0);
console.log('1 / -0          =', 1 / -0, '（负零参与除法会暴露符号）');
console.log('-0 转字符串     =', String(-0), '（显示为 "0"）');
console.log('Object.is(-0, -0) =', Object.is(-0, -0));

// ---------------------------------------------------------------------------
// 6. 常用数字工具方法
// ---------------------------------------------------------------------------

console.log('--- 6. 常用数字 API ---');

console.log('Number.isInteger(5)     =', Number.isInteger(5));
console.log('Number.isInteger(5.0)   =', Number.isInteger(5.0), '（5.0 就是整数 5）');
console.log('Number.isInteger(5.5)   =', Number.isInteger(5.5));
console.log('Number.parseInt("0x1F", 16) =', Number.parseInt('0x1F', 16));
console.log('Number.parseFloat("3.5")    =', Number.parseFloat('3.5'));
console.log('(255).toString(2)       =', (255).toString(2), '（转二进制字符串）');
console.log('(255).toString(16)      =', (255).toString(16), '（转十六进制）');
console.log('(3.14159).toFixed(2)    =', (3.14159).toFixed(2));
console.log('(1234.5678).toPrecision(6) =', (1234.5678).toPrecision(6));
console.log('Math.round(2.5) =', Math.round(2.5), ' Math.round(-2.5) =', Math.round(-2.5));
console.log('Math.trunc(-2.7) =', Math.trunc(-2.7), ' Math.floor(-2.7) =', Math.floor(-2.7));

// ---------------------------------------------------------------------------
// 7. 小练习：一个安全的"字符串转数字"函数
// ---------------------------------------------------------------------------

console.log('--- 7. 实战：安全转数字 ---');

/** 把输入安全地转为有限数字，失败则返回 fallback */
function toFiniteNumber(input, fallback = 0) {
  // 先统一转成数字，再排除 NaN / Infinity 这类"看起来是 number 但不能用"的值。
  const n = Number(input);
  return Number.isFinite(n) ? n : fallback;
}

console.log("toFiniteNumber('42')      =", toFiniteNumber('42'));
console.log("toFiniteNumber('abc')     =", toFiniteNumber('abc'));
console.log("toFiniteNumber('')        =", toFiniteNumber(''));
console.log("toFiniteNumber(null)      =", toFiniteNumber(null));
console.log("toFiniteNumber(Infinity)  =", toFiniteNumber(Infinity));
console.log("toFiniteNumber('abc', -1) =", toFiniteNumber('abc', -1));

console.log('--- 完成：number 类型的精度、边界与特殊值 ---');
