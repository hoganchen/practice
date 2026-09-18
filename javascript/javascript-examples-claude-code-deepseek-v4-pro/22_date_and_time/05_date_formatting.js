/**
 * ============================================================================
 * 知识点：日期格式化 —— 手工补零、ISO 8601 与 toLocaleDateString
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】入门
 * 【前置知识】22_date_and_time/03_date_getters_setters.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 的 Date 没有 Java 那样的 SimpleDateFormat，也没有内置的 strftime。
 *    把 Date 变成人看的字符串，只有三条路：
 *      (A) 手工拼接分量 + padStart 补零 —— 完全可控，输出稳定
 *      (B) toISOString() —— 机器可读的 UTC 标准格式（ISO 8601）
 *      (C) toLocaleDateString / toLocaleString / Intl.DateTimeFormat —— 本地化
 *    另有 toDateString() / toString() / toTimeString() 等，但格式由引擎决定，
 *    不推荐用于正式输出。
 *
 * 2. 为什么需要
 *    日志、报表、文件名、界面展示、和第三方 API 对接，
 *    每一种场景需要的日期格式都不同。JSON 传输用 ISO，给人看用本地化格式。
 *
 * 3. 核心语法要点
 *    (1) 补零：String(n).padStart(2, '0')。注意 padStart 是字符串方法，
 *        数字要先转字符串。不要用 slice(-2) 那种"0" + n 的偏方，负数会出错。
 *    (2) 常用模板：
 *        YYYY-MM-DD          -> 数据库 DATE 字段、<input type="date">
 *        YYYY-MM-DDTHH:mm:ss -> 本地时间，无时区（容易被误读）
 *        ISO + Z             -> 带时区的绝对时刻，跨系统交换必须用这个
 *    (3) toISOString() 永远是 UTC + 毫秒 + Z 后缀，形如
 *        2024-03-15T09:30:45.123Z。它是 JSON.stringify(Date) 的默认行为。
 *    (4) toLocaleDateString(locale, options) 按指定语言/区域输出。
 *        options 里要显式写 timeZone，否则结果依赖运行机器的时区。
 *    (5) 需要"零填充的本地时间"时，用 getFullYear/getMonth 等本地 getter；
 *        需要"稳定的 UTC 字符串"时，用 getUTC* 系列。
 *
 * 4. 常见陷阱
 *    (1) 忘了 padStart 导致 '2024-1-5' 这种对不齐、无法排序的字符串。
 *    (2) 直接输出 toISOString() 给用户看：用户看到的是 UTC 时间，不是他的本地时间。
 *    (3) 用 toLocaleDateString() 不带 timeZone，同一份数据在不同机器上渲染出不同日期。
 *    (4) 以为 'YYYY-MM-DD HH:mm:ss'（带空格）是标准格式：它不是 ISO 8601，
 *        Date.parse 对它的支持在不同引擎里并不一致。
 *    (5) 手工拼接时用了本地 getter 却当 UTC 用，或反之，造成时区错位。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/05_date_formatting.js
 *
 * 【预期输出】
 *   分 7 个小节，展示补零函数、本地时间模板、UTC 模板、toISOString、
 *   toLocaleDateString 与 Intl 的用法。所有格式串输出固定。
 * ============================================================================
 */

console.log('--- 1. padStart 补零：一切手工格式化的基础 ---');

// padStart(目标长度, 填充字符)：不足长度时在**左侧**补字符。
console.log("String(7).padStart(2, '0')   =", String(7).padStart(2, '0'));
console.log("String(12).padStart(2, '0')  =", String(12).padStart(2, '0'), '（已够长则不补）');
console.log("String(5).padStart(3, '0')   =", String(5).padStart(3, '0'));
console.log("String(2024).padStart(4, '0')=", String(2024).padStart(4, '0'));
// 常见误区：对数字直接调用会报错（数字没有 padStart）。
try {
  // @ts-expect-error 故意演示类型错误
  (7).padStart(2, '0');
} catch (err) {
  console.log('对数字直接 padStart 会抛错 ->', err.constructor.name + ':', err.message);
}

console.log('\n--- 2. 手工格式化"本地时间"（本地构造 + 本地读取，跨机器一致） ---');

// 用本地分量构造，读也用本地分量，无论机器在哪个时区，得到的格式串都一样。
const local = new Date(2024, 2, 4, 5, 6, 7, 8); // 2024-03-04 05:06:07.008（本地）

/**
 * 把 Date 按给定模板格式化成字符串。
 * 模板里可用的占位符：YYYY MM DD HH mm ss SSS。
 * 只使用**本地时间**分量，所以同一台机器上输出稳定。
 * @param {Date} date 要格式化的日期
 * @param {string} pattern 模板字符串
 * @returns {string}
 */
function formatLocal(date, pattern) {
  // 各个分量先各自补零，再整体替换，避免"先替换 YYYY 又被 MM 规则命中"之类的问题。
  const map = {
    YYYY: String(date.getFullYear()).padStart(4, '0'),
    MM: String(date.getMonth() + 1).padStart(2, '0'), // 月份索引 0~11，展示要 +1
    DD: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
    SSS: String(date.getMilliseconds()).padStart(3, '0'),
  };
  // 用一次正则替换完成，回调里查表；查不到就原样返回。
  return pattern.replace(/YYYY|MM|DD|HH|mm|ss|SSS/g, (token) => map[token]);
}

console.log('原始本地分量 = 2024 年 3 月 4 日 05:06:07.008');
console.log("formatLocal(d, 'YYYY-MM-DD')          =", formatLocal(local, 'YYYY-MM-DD'));
console.log("formatLocal(d, 'YYYY-MM-DD HH:mm:ss') =", formatLocal(local, 'YYYY-MM-DD HH:mm:ss'));
console.log("formatLocal(d, 'YYYY/MM/DD')          =", formatLocal(local, 'YYYY/MM/DD'));
console.log("formatLocal(d, 'HH:mm:ss.SSS')        =", formatLocal(local, 'HH:mm:ss.SSS'));
console.log("formatLocal(d, 'YYYY年MM月DD日')       =", formatLocal(local, 'YYYY年MM月DD日'));

// 对比：去掉补零会得到什么（对不齐、无法字符串排序）。
console.log('\n不补零的后果：');
console.log("  '2024-3-4' 与 '2024-11-20' 按字符串排序：", ['2024-3-4', '2024-11-20'].sort().join(' < '), '（顺序是错的）');
console.log("  '2024-03-04' 与 '2024-11-20' 按字符串排序：", ['2024-03-04', '2024-11-20'].sort().join(' < '), '（顺序正确）');

console.log('\n--- 3. UTC 分量格式化：输出与机器时区完全无关 ---');

const instant = new Date('2024-03-15T09:30:45.123Z');

/**
 * 使用 UTC 分量格式化的版本。同样模板，结果在任何机器上都一样。
 * @param {Date} date
 * @param {string} pattern
 * @returns {string}
 */
function formatUTC(date, pattern) {
  const map = {
    YYYY: String(date.getUTCFullYear()).padStart(4, '0'),
    MM: String(date.getUTCMonth() + 1).padStart(2, '0'),
    DD: String(date.getUTCDate()).padStart(2, '0'),
    HH: String(date.getUTCHours()).padStart(2, '0'),
    mm: String(date.getUTCMinutes()).padStart(2, '0'),
    ss: String(date.getUTCSeconds()).padStart(2, '0'),
    SSS: String(date.getUTCMilliseconds()).padStart(3, '0'),
  };
  return pattern.replace(/YYYY|MM|DD|HH|mm|ss|SSS/g, (token) => map[token]);
}
console.log('时刻 =', instant.toISOString());
console.log("formatUTC(d, 'YYYY-MM-DD HH:mm:ss.SSS') =", formatUTC(instant, 'YYYY-MM-DD HH:mm:ss.SSS'), '（固定）');

console.log('\n--- 4. toISOString()：跨系统交换的标准格式 ---');

// ISO 8601 的扩展格式：YYYY-MM-DDTHH:mm:ss.sssZ，永远是 UTC。
console.log('toISOString()          =', instant.toISOString());
// 注意年份可能超过 4 位，此时会带 +/- 号前缀（扩展年份）。
const farFuture = new Date('+010000-01-01T00:00:00.000Z');
console.log('远期年份的 toISOString =', farFuture.toISOString(), '（6 位年份带 + 号）');
// JSON.stringify 遇到 Date 会自动调用 toJSON()，而 toJSON 就是 toISOString。
console.log('JSON.stringify({ d })  =', JSON.stringify({ d: instant }));
// Invalid Date 调 toISOString 会抛 RangeError，必须 try/catch。
try {
  new Date('坏日期').toISOString();
} catch (err) {
  console.log('Invalid Date.toISOString() 抛错 ->', err.constructor.name + ':', err.message);
}
// 对应的反向操作是 Date.prototype.toJSON / Date.parse，二者配合可以无损往返。
console.log('往返是否无损：', new Date(instant.toISOString()).getTime() === instant.getTime());

console.log('\n--- 5. 内置的 toString 系列：格式由引擎决定，仅供调试 ---');
console.log('toString()     =', instant.toString(), '（本机时区 + 本机语言，随机器变化）');
console.log('toUTCString()  =', instant.toUTCString(), '（RFC 1123 格式，固定）');
console.log('toDateString() =', new Date(2024, 2, 4).toDateString(), '（只有日期部分，星期缩写随语言）');
console.log('注意：这三个的格式由引擎和系统区域设置决定，不要用于正式输出或解析。');

console.log('\n--- 6. toLocaleDateString / toLocaleString：本地化输出 ---');

// 关键：显式传 timeZone，否则输出随机器时区变化。
const SHANGHAI = { timeZone: 'Asia/Shanghai' };
console.log('同一时刻在不同时区的"日期"（显式指定时区，输出固定）：');
console.log('  zh-CN / Asia/Shanghai  =', instant.toLocaleDateString('zh-CN', SHANGHAI));
console.log('  en-US / Asia/Shanghai  =', instant.toLocaleDateString('en-US', SHANGHAI));
console.log('  en-US / America/New_York =', instant.toLocaleDateString('en-US', { timeZone: 'America/New_York' }), '（还是 3 月 15 日）');
console.log('  en-US / Pacific/Honolulu =', instant.toLocaleDateString('en-US', { timeZone: 'Pacific/Honolulu' }), '（UTC-10，已经退回 3 月 14 日）');

// 带时间的本地化输出：dateStyle / timeStyle 是 ES2020 的简洁写法。
console.log('\ntoLocaleString 的 dateStyle / timeStyle（ES2020+）：');
for (const style of ['short', 'medium', 'long', 'full']) {
  console.log(`  ${style.padEnd(6)} =`, instant.toLocaleString('zh-CN', { ...SHANGHAI, dateStyle: style, timeStyle: style }));
}

// 逐个字段自定义：比 dateStyle 更细粒度。
console.log('\n自定义字段（weekday + 年月日 + 24 小时制时间）：');
console.log(
  '  ',
  instant.toLocaleString('zh-CN', {
    ...SHANGHAI,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24 小时制
  }),
);

console.log('\n--- 7. 实战：为不同场景选择格式 ---');

const businessDate = new Date('2024-03-15T09:30:45.123Z');
const formats = {
  '数据库 DATE 字段（UTC 日期）': formatUTC(businessDate, 'YYYY-MM-DD'),
  '接口传输（ISO 8601，带时区）': businessDate.toISOString(),
  '日志时间（UTC，精确到毫秒）': formatUTC(businessDate, 'YYYY-MM-DD HH:mm:ss.SSS') + ' UTC',
  '文件名（无冒号，避免 Windows 限制）': formatUTC(businessDate, 'YYYY-MM-DD_HH-mm-ss'),
  'ISO 8601 基本格式（无分隔符）': formatUTC(businessDate, 'YYYYMMDD') + 'T' + formatUTC(businessDate, 'HHmmss') + 'Z',
  '界面展示（中文本地化）': businessDate.toLocaleString('zh-CN', { ...SHANGHAI, dateStyle: 'long', timeStyle: 'short' }),
};
for (const [scene, value] of Object.entries(formats)) {
  console.log(`  ${scene.padEnd(30)} -> ${value}`);
}

console.log('\n选择原则：');
console.log('  存进数据库 / 传给其它系统 -> toISOString()（绝对时刻 + 时区信息）');
console.log('  展示给用户               -> toLocaleString(locale, { timeZone, ... })');
console.log('  固定格式的报表 / 文件名    -> 手工 formatLocal / formatUTC + padStart');
console.log('  调试打印                 -> 随便，但记得它不跨平台一致');
console.log('\n本节结束。');
