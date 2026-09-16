/**
 * ============================================================================
 * 知识点：创建 Date 对象的各种方式 —— 月份从 0 开始的历史坑
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】入门
 * 【前置知识】无
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Date 是 JavaScript 内置的日期时间类型。它本质上是一个"时间戳的包装盒"：
 *    内部只存了一个数字——自 1970-01-01T00:00:00Z（Unix 纪元）以来经过的**毫秒数**。
 *    所谓"年月日时分秒"都是这个数字在当前时区下的**呈现**，而不是它存储的内容。
 *    创建 Date 共有 4 种语法形式：
 *      new Date()                          // 当前时刻
 *      new Date(毫秒时间戳)                  // 从时间戳
 *      new Date(日期字符串)                  // 从字符串解析
 *      new Date(年, 月, 日, 时, 分, 秒, 毫秒)  // 从"本地时间"的各个分量
 *
 * 2. 为什么需要
 *    只要程序里出现"记录创建时间""比较两个事件先后""按天统计""做过期判断"，
 *    就一定会用到 Date。它是 JSON、HTTP 头、数据库、日志系统之间通用的时间载体。
 *
 * 3. 核心语法要点
 *    (1) new Date() 不带参数得到的是"此刻"，它的值每次运行都不同，不可用于断言。
 *    (2) 只有 new Date(...) 才返回对象；直接 Date(...) 调用（不带 new）返回的是
 *        当前时间的**字符串**，这是个几乎没人想要的历史遗留行为。
 *    (3) 从分量构造时，**月份从 0 开始**：0 = 一月，11 = 十二月。
 *        而"日"从 1 开始：1 号就是 1。这种不一致来自 1995 年 Java 的
 *        java.util.Date 设计，JS 原样抄了过来，如今已无法修改（会破坏所有老代码）。
 *    (4) 从分量构造的时间被解释为**本地时区**时间；而纯日期字符串 "2024-01-01"
 *        被解释为 **UTC** 时间。两者规则不同，这是最阴险的坑。
 *    (5) 分量可以写"越界"的值（如 12 月、32 号、25 点），Date 会自动进位，
 *        这个特性常被用来做日期加减。
 *    (6) 所有参数都会被强制转换成数字；传入无法转成数字的值会得到 Invalid Date。
 *
 * 4. 常见陷阱
 *    (1) 把 1 当成一月：new Date(2024, 1, 1) 其实是 2024 年 2 月 1 日。
 *    (2) 以为 "2024-01-01" 和 new Date(2024, 0, 1) 相等：
 *        前者是 UTC 零点，后者是本地零点，在 UTC+8 时区整整差 8 小时。
 *    (3) 忘记 new：const d = Date(); 得到的是字符串，d.getTime() 会直接抛 TypeError。
 *    (4) Invalid Date 不会抛错，它会一路静默传播，直到 toISOString() 才抛
 *        RangeError，非常难定位。
 *    (5) 两位数的年份：new Date(99, 0, 1) 会被当成 1999 年（0~99 映射到 1900~1999）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/01_date_creation.js
 *
 * 【预期输出】
 *   分 7 个小节，展示 4 种构造方式、月份索引坑、本地时间与 UTC 的差异、
 *   自动进位、Invalid Date 的识别与处理。除"当前时刻"一节外输出均固定。
 * ============================================================================
 */

console.log('--- 1. 方式一：new Date() 取当前时刻 ---');

// 不带参数时，Date 会读取系统时钟。注意它的值每次运行都不同，
// 所以这里只打印"它是一个合法 Date""它大约在什么范围"，不做精确断言。
const now = new Date();
console.log('类型是 Date 吗：', now instanceof Date);
console.log('当前时间戳（每次运行都不同）：', now.getTime());
console.log('当前 UTC 时间的 ISO 表示（每次运行都不同）：', now.toISOString());
// 时间戳一定是正数且远大于 2020-01-01（1577836800000），可用来做事后校验。
console.log('是否晚于 2020-01-01：', now.getTime() > 1577836800000);

console.log('\n--- 2. 方式二：从毫秒时间戳构造 ---');

// 时间戳是"距 1970-01-01T00:00:00Z 的毫秒数"，是 Date 内部唯一存储的东西。
const epoch = new Date(0); // 纪元时刻
console.log('new Date(0).toISOString() =', epoch.toISOString());
console.log('new Date(0).getTime()    =', epoch.getTime());

// 负数表示纪元之前的时间。
console.log('new Date(-1).toISOString() =', new Date(-1).toISOString());

// 86400000 毫秒 = 24 小时 = 1 天，所以第 2 天就是 1 月 2 日。
console.log('new Date(86400000).toISOString() =', new Date(86400000).toISOString());

// Date 能表示的范围是 ±8.64e15 毫秒（约 ±1 亿天），超出即为 Invalid Date。
const MAX_TIME = 8640000000000000;
console.log('最大时刻 =', new Date(MAX_TIME).toISOString());
console.log('超出范围 =', new Date(MAX_TIME + 1).toString());

console.log('\n--- 3. 方式三：从字符串构造（详见 06_date_parsing.js） ---');

// ISO 8601 是唯一被规范强制要求支持的格式。
// 只写日期（YYYY-MM-DD）时，规范规定按 **UTC** 解释。
console.log('"2024-01-01"        ->', new Date('2024-01-01').toISOString());
// 写了日期和时间但**不带时区后缀**时，ES2016 起规定按 **本地时间** 解释。
// 为避免机器时区影响输出，这里改用带 Z 的写法固定为 UTC。
console.log('"2024-01-01T00:00Z" ->', new Date('2024-01-01T00:00:00Z').toISOString());

// 用本地分量读回只写日期的字符串，就能看到"日期错位"。
// 在 UTC+8 机器上它显示 1 月 1 日 08:00；在 UTC-5 机器上会显示 12 月 31 日 19:00。
const dateOnly = new Date('2024-01-01');
console.log(
  '本机读回的本地时间（随时区变化，仅作说明）：',
  `${dateOnly.getFullYear()}-${String(dateOnly.getMonth() + 1).padStart(2, '0')}-${String(dateOnly.getDate()).padStart(2, '0')}`,
  `${String(dateOnly.getHours()).padStart(2, '0')}:${String(dateOnly.getMinutes()).padStart(2, '0')}`,
);

console.log('\n--- 4. 方式四：从年月日等分量构造（月份从 0 开始！） ---');

// 语法：new Date(year, monthIndex, day, hours, minutes, seconds, ms)
// 除了前两个参数，其余都可以省略，默认值分别是 日=1、时=0、分=0、秒=0、毫秒=0。
const janFirst = new Date(2024, 0, 1); // 0 = 一月
const decThirtyFirst = new Date(2024, 11, 31); // 11 = 十二月
console.log('new Date(2024, 0, 1)  的月份分量 =', janFirst.getMonth(), '（0 代表一月）');
console.log('new Date(2024, 11, 31) 的月份分量 =', decThirtyFirst.getMonth(), '（11 代表十二月）');
console.log('这两个都是本地时间，所以年月日读回来一定一致：');
console.log('  janFirst   ->', janFirst.getFullYear(), janFirst.getMonth(), janFirst.getDate());
console.log('  dec31      ->', decThirtyFirst.getFullYear(), decThirtyFirst.getMonth(), decThirtyFirst.getDate());

// 只写年月，日默认 1。
console.log('只给年和月 new Date(2024, 5)      ->', new Date(2024, 5).getDate(), '号（默认 1 号）');
// 年月日都给，时分秒默认 0。
const midnight = new Date(2024, 5, 15);
console.log('不给时分秒 ->', midnight.getHours(), '时', midnight.getMinutes(), '分', midnight.getSeconds(), '秒');

// 记住月份口诀：1 月是 0，12 月是 11；而"日"是 1 号写 1。
console.log('\n记忆口诀：月份索引 = 实际月份 - 1；日 = 实际日期（不偏移）。');

console.log('\n--- 5. 越界分量会自动进位（可用来做加减） ---');

// 下面两行的"年 / 月"都直接打印 getMonth() 的**索引值**（再强调一次：索引 0 = 一月）。
// 13 月 = 次年 1 月（索引 0）；-1 月 = 上一年的 12 月（索引 11）。
console.log('new Date(2024, 12, 1)  ->', new Date(2024, 12, 1).getFullYear(), '年，月份索引', new Date(2024, 12, 1).getMonth());
console.log('new Date(2024, -1, 1)  ->', new Date(2024, -1, 1).getFullYear(), '年，月份索引', new Date(2024, -1, 1).getMonth());
// 1 月 32 日 = 2 月 1 日。注意 getMonth() 返回的是索引，
// 所以这里 +1 才是人类习惯的月份数字。
const overflowDay = new Date(2024, 0, 32);
console.log(
  'new Date(2024, 0, 32)  ->',
  overflowDay.getFullYear(),
  '年',
  overflowDay.getMonth() + 1,
  '月',
  overflowDay.getDate(),
  '日（索引 =', overflowDay.getMonth(), '）',
);
// 25 点 = 次日 1 点。
console.log('new Date(2024, 0, 1, 25) 的小时 =', new Date(2024, 0, 1, 25).getHours(), '（次日 1 点）');

console.log('\n--- 6. Date.UTC：用分量构造但要 UTC 解释 ---');

// 与 new Date(...) 参数完全一样，但按 UTC 解释，返回的是毫秒数而不是 Date 对象。
const utcMs = Date.UTC(2024, 0, 1, 0, 0, 0, 0);
console.log('Date.UTC(2024, 0, 1) =', utcMs, '（一个数字）');
console.log('再用它构造 Date    ->', new Date(utcMs).toISOString(), '（固定为 UTC 零点）');

console.log('\n--- 7. Invalid Date：不报错的"坏日期" ---');

// 无法解析的字符串、NaN 分量都会得到 Invalid Date。
const bad = new Date('这不是一个日期');
console.log('new Date("这不是一个日期") 的 getTime() =', bad.getTime(), '（NaN）');
console.log('Number.isNaN(bad.getTime()) =', Number.isNaN(bad.getTime()), '—— 这是判断 Invalid Date 的标准方式');
// 注意它本身仍是 Date 实例，instanceof 检查不出来。
console.log('bad instanceof Date =', bad instanceof Date, '（依然是 Date，所以 instanceof 不可靠）');
// 直接调用 toISOString() 会抛 RangeError，演示时必须 try/catch。
try {
  bad.toISOString();
} catch (err) {
  console.log('bad.toISOString() 抛错 ->', err.constructor.name + ':', err.message);
}
// 防御性写法：先转成数字看是不是 NaN。
function isValidDate(d) {
  // 注意要显式写 +d（等于 Number(d)，即 valueOf 得到的毫秒数），
  // 不能写 d && ...，因为 Invalid Date 是"真值"。
  return d instanceof Date && !Number.isNaN(+d);
}
console.log('isValidDate(bad)        =', isValidDate(bad));
console.log('isValidDate(new Date()) =', isValidDate(new Date()));

console.log('\n--- 8. 一个易踩的细节：不带 new 调用 Date() ---');

// 直接调用（不写 new）时，Date 作为普通函数返回"当前时间的字符串"，
// 这是 1995 年留下的兼容行为，几乎总是 bug 的来源。
const notADate = Date();
console.log('typeof Date()          =', typeof notADate, '（字符串，不是对象）');
console.log('Date() 的返回值开头     =', notADate.slice(0, 3), '（星期缩写，值随当前时间变化）');
console.log('\n本节结束：创建 Date 的四种方式已全部演示。');
