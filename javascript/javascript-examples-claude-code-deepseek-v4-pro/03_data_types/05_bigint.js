/**
 * ============================================================================
 * 知识点：BigInt —— 任意精度整数与"不能与 Number 混算"的约束
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】进阶
 * 【前置知识】03_data_types/04_number_type.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    BigInt 是 ES2020 引入的第 7 种原始类型，用来表示"任意精度"的整数。
 *    number 只有 53 位有效整数范围（约 ±9e15），BigInt 没有这个上限，
 *    内存允许就能表示任意大的整数，代价是运算比 number 慢。
 *    它的 typeof 结果是 'bigint'。
 *
 * 2. 为什么需要
 *    · 数据库里的 BIGINT 主键（雪花 ID、Twitter Snowflake）动辄 19 位十进制，
 *      用 number 存会丢精度，JSON 往返后 ID 就变了。
 *    · 金融、密码学、大数计算（阶乘、斐波那契、RSA）都会超出安全整数范围。
 *
 * 3. 核心语法要点
 *    【创建方式】
 *      - 字面量：在整数后面加 n，如 9007199254740993n、0x1Fn、0b1010n、0o17n。
 *        注意 n 只能跟在整数字面量后面，1.5n 是语法错误。
 *      - 构造函数：BigInt(10)、BigInt('9007199254740993')。传入小数会抛 RangeError。
 *    【运算规则】
 *      - + - * / % ** 都支持，但"两侧必须都是 BigInt"。
 *        BigInt 与 number 混算会抛 TypeError: Cannot mix BigInt and other types。
 *      - 除法 / 会向零截断，丢弃余数（没有小数概念）：7n / 2n === 3n。
 *      - 除以 0n 会抛 RangeError: Division by zero（而 number 的 1/0 是 Infinity）。
 *      - 一元 +（正号）不支持 BigInt，会抛 TypeError；-n 可以。
 *    【比较】
 *      - 关系比较 < > <= >= 允许 BigInt 与 number 混用，按数学值比较。
 *      - 松散相等 == 允许混用：1n == 1 为 true。
 *      - 严格相等 === 不允许：1n === 1 为 false（类型不同）。
 *      - 与 NaN 比较永远是 false；1n < NaN 也是 false。
 *    【转换】
 *      - BigInt → Number：Number(1n) 可行，但超出安全范围会丢精度。
 *      - Number → BigInt：必须是整数值，且不能用 new BigInt()。
 *      - String(bigint) 直接可用，bigint.toString(16) 可取任意进制。
 *      - JSON.stringify 遇到 BigInt 会抛 TypeError，需要自定义 replacer。
 *    【假值】0n 是 8 个假值之一，Boolean(0n) === false。
 *
 * 4. 常见陷阱
 *    · BigInt 不能与 Number 直接相加 —— 必须显式统一类型（这是有意设计的，
 *      以免像隐式转换那样悄悄丢精度）。
 *    · Math 上的所有方法都不接受 BigInt：Math.max(1n, 2n) 会抛 TypeError。
 *    · JSON 序列化会抛错，跨网络传输前要么转字符串，要么用 replacer。
 *    · BigInt 与 number 混用时 ===、Object.is 都判为不等，比较要选对运算符。
 *    · bigint 与 number 可以用 < 比较，但排序时要小心两者混排在数组里。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/05_bigint.js
 *
 * 【预期输出】
 *   打印 BigInt 的创建、大整数运算、溢出对比、混算报错（try/catch 捕获）、
 *   JSON 序列化处理方案。所有报错都在文件内捕获，进程退出码 0。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 创建 BigInt 的几种方式
// ---------------------------------------------------------------------------

console.log('--- 1. 创建 BigInt ---');

const fromLiteral = 123n; // 十进制字面量 + n 后缀
const fromHex = 0x1fn; // 十六进制也支持 n 后缀
const fromBin = 0b1010n; // 二进制
const fromOct = 0o17n; // 八进制
const fromCtor = BigInt(123); // 由 number 构造
const fromString = BigInt('9007199254740993'); // 由字符串构造，最安全
const fromZero = 0n;

console.log('123n                        =', fromLiteral, ' typeof =', typeof fromLiteral);
console.log('0x1fn                       =', fromHex);
console.log('0b1010n                     =', fromBin);
console.log('0o17n                       =', fromOct);
console.log('BigInt(123)                 =', fromCtor);
console.log("BigInt('9007199254740993')  =", fromString);
console.log('0n                          =', fromZero);

// BigInt 有 toString 方法，可以直接转成字符串，避免 JSON 报错。
console.log('fromString.toString()       =', fromString.toString());
console.log('类型比较：typeof 123n === "bigint" →', typeof 123n === 'bigint');

// ---------------------------------------------------------------------------
// 2. 为什么需要它：number 的超界丢精度
// ---------------------------------------------------------------------------

console.log('--- 2. number 超界的丢精度问题 ---');

// Twitter Snowflake ID 是 19 位十进制数，远超 2^53-1。
const snowflakeId = 1234567890123456789;
console.log('number 存雪花 ID：      ', snowflakeId);
console.log('BigInt 存同一个 ID：    ', 1234567890123456789n);
console.log('两者相等吗？', BigInt(snowflakeId) === 1234567890123456789n, '← number 已经丢精度了');

// 两个不同的数字被 number 表示成同一个值：
console.log('9007199254740993 存成 number =', 9007199254740993);
console.log('9007199254740992 存成 number =', 9007199254740992);
console.log('用 BigInt 区分：', 9007199254740993n === 9007199254740992n, '← false，BigInt 保真');

// ---------------------------------------------------------------------------
// 3. 大整数运算
// ---------------------------------------------------------------------------

console.log('--- 3. BigInt 的四则运算 ---');

console.log('100n + 200n      =', 100n + 200n);
console.log('100n - 300n      =', 100n - 300n, '（可以有负数）');
console.log('2n ** 64n        =', 2n ** 64n, '（指数也支持）');
console.log('10n * 20n        =', 10n * 20n);
console.log('7n / 2n          =', 7n / 2n, '（向零截断，没有小数部分）');
console.log('-7n / 2n         =', -7n / 2n, '（截断而非向下取整）');
console.log('7n % 2n          =', 7n % 2n);

// 阶乘：结果会远超 number 的表示范围，但 BigInt 毫无压力。
function factorial(n) {
  let result = 1n;
  for (let i = 2n; i <= n; i++) result *= i;
  return result;
}
console.log('20!  =', factorial(20n));
console.log('100! =', factorial(100n));

// 对比：用 number 算 21! 就已经不精确了。
let numFact = 1;
for (let i = 2; i <= 21; i++) numFact *= i;
console.log('用 number 算 21! =', numFact, '← 是个近似值');

// ---------------------------------------------------------------------------
// 4. 混算会报错 —— 这是有意设计
// ---------------------------------------------------------------------------

console.log('--- 4. BigInt 与 Number 不能混算 ---');

// 加号：直接抛 TypeError。设计意图是逼迫程序员显式选择精度策略。
try {
  console.log(1n + 1);
} catch (err) {
  console.log('1n + 1        →', err.name + ':', err.message);
}

try {
  console.log(10n * 2.5);
} catch (err) {
  console.log('10n * 2.5     →', err.name + ':', err.message);
}

// 一元正号也不支持 BigInt（因为 +x 在规范里等价于 Number(x)）。
try {
  console.log(+1n);
} catch (err) {
  console.log('+1n           →', err.name + ':', err.message);
}

// 一元负号可以正常使用。
console.log('-1n           =', -1n);

// 除以 0n 抛 RangeError，而不是得到 Infinity。
try {
  console.log(1n / 0n);
} catch (err) {
  console.log('1n / 0n       →', err.name + ':', err.message);
}
console.log('对比：number 的 1 / 0 =', 1 / 0, '（不报错，得到 Infinity）');

// Math 方法不接受 BigInt。
try {
  console.log(Math.max(1n, 2n));
} catch (err) {
  console.log('Math.max(1n,2n) →', err.name + ':', err.message);
}

// 正确做法：先显式统一类型，再运算。
console.log('正确做法：1n + BigInt(1) =', 1n + BigInt(1));
console.log('正确做法：Number(1n) + 1 =', Number(1n) + 1);

// ---------------------------------------------------------------------------
// 5. 比较：关系比较可以混用，严格相等不行
// ---------------------------------------------------------------------------

console.log('--- 5. BigInt 与 Number 的比较 ---');

console.log('1n == 1        =', 1n == 1, '（松散相等允许混用，按数学值比）');
console.log('1n === 1       =', 1n === 1, '（严格相等要求类型一致）');
console.log('Object.is(1n, 1) =', Object.is(1n, 1));
console.log('2n > 1         =', 2n > 1, '（关系比较允许混用）');
console.log('1n < 1.5       =', 1n < 1.5, '（可以和 number 小数比较）');
console.log('1n < NaN       =', 1n < NaN, '（与 NaN 比较永远 false）');
console.log('0n == false    =', 0n == false);
console.log('Boolean(0n)    =', Boolean(0n), '（0n 是假值）');
console.log('Boolean(1n)    =', Boolean(1n));

// ---------------------------------------------------------------------------
// 6. 类型转换
// ---------------------------------------------------------------------------

console.log('--- 6. BigInt 的类型转换 ---');

console.log('Number(123n)            =', Number(123n));
console.log('String(123n)            =', String(123n));
console.log('(255n).toString(16)     =', (255n).toString(16));
console.log('(255n).toString(2)      =', (255n).toString(2));
console.log('BigInt("0x1F")          =', BigInt('0x1F'), '（字符串支持 0x 前缀）');
console.log('BigInt(1.5) 会报错：');
try {
  console.log(BigInt(1.5));
} catch (err) {
  console.log('  BigInt(1.5) →', err.name + ':', err.message);
}

// 从 number 转 BigInt 时，若原值已超出安全范围，转换结果同样是错的。
console.log('BigInt(9007199254740993)  =', BigInt(9007199254740993), '← 源头就错了');
console.log('BigInt("9007199254740993") =', BigInt('9007199254740993'), '← 用字符串才对');

// ---------------------------------------------------------------------------
// 7. JSON 序列化：BigInt 会抛错，需要处理
// ---------------------------------------------------------------------------

console.log('--- 7. JSON 与 BigInt ---');

const record = { id: 1234567890123456789n, name: '订单' };

try {
  console.log(JSON.stringify(record));
} catch (err) {
  console.log('JSON.stringify 含 BigInt 的对象 →', err.name + ':', err.message);
}

// 方案一：自定义 replacer，把 BigInt 转成字符串。
const withReplacer = JSON.stringify(record, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value,
);
console.log('replacer 方案：', withReplacer);

// 方案二：序列化前手动转换字段。
const manual = JSON.stringify({ ...record, id: record.id.toString() });
console.log('手动转换方案：', manual);

// 反向解析时用 BigInt() 或 JSON.parse 的 reviver 还原。
const parsed = JSON.parse(manual);
console.log('解析回来是字符串：', parsed.id, ' typeof =', typeof parsed.id);
console.log('还原为 BigInt：', BigInt(parsed.id));

console.log('--- 完成：BigInt 的精度优势与混算约束 ---');
