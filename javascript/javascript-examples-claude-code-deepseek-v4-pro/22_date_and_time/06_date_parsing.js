/**
 * ============================================================================
 * 知识点：解析日期字符串 —— Date.parse 的格式兼容性与时区歧义
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】进阶
 * 【前置知识】22_date_and_time/01_date_creation.js、05_date_formatting.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "解析"是把字符串变成时刻（Date 对象或时间戳）的过程。相关入口有四个：
 *      new Date(str)        —— 返回 Date 对象
 *      Date.parse(str)      —— 返回毫秒时间戳（NaN 表示失败）
 *      Date.UTC(...)        —— 从**数字分量**构造，不是解析字符串
 *      str -> Date 的反向才是格式化（见 05）
 *    ES 规范只强制要求支持一种字符串格式：ISO 8601 的简化版。
 *    其它格式（如 "March 5, 2024"、"01/02/2024"）属于"引擎自行实现"，
 *    行为不保证跨浏览器、跨 Node 版本一致。
 *
 * 2. 为什么需要
 *    用户输入、CSV 导入、第三方接口返回的时间字段，往往不是标准 ISO 格式，
 *    必须知道哪些能安全解析、哪些必须自己写解析器。
 *
 * 3. 核心语法要点
 *    (1) 规范强制支持的 ISO 格式：
 *          仅日期：YYYY-MM-DD          -> 按 **UTC** 解释
 *          日期+时间：YYYY-MM-DDTHH:mm  -> 不带时区后缀时按 **本地时间** 解释
 *          带时区后缀：...Z 或 ...+08:00 / -05:00 -> 按显式偏移解释
 *        分隔符 T 可以换成空格（规范允许，但不要依赖）。
 *    (2) 完整形态：YYYY-MM-DDTHH:mm:ss.sss±HH:mm，除年、月、日外都可省略。
 *    (3) 两位年份：'24' 会被当成 2024；new Date(24, 0, 1) 则被当成 1924
 *        （数字分量里 0~99 映射到 1900~1999）。两个规则不一样，都要小心。
 *    (4) 解析失败**不抛错**，返回 NaN / Invalid Date。
 *    (5) 带 Z 或带 ±HH:mm 偏移的字符串，其解析结果与运行机器的时区无关；
 *        不带时区后缀的纯日期（按 UTC）也与时区无关（但读本地分量时会错位）。
 *        真正危险的是"日期+时间但不带时区"和"非 ISO 格式"。
 *
 * 4. 常见陷阱
 *    (1) 'YYYY-MM-DD' 按 UTC 解释，在中国凌晨 0~8 点会显示成前一天。
 *    (2) 'YYYY/MM/DD' 被大多数引擎按**本地时间**解释，与横线版本行为不同。
 *    (3) 非 ISO 的英文月份格式在 V8 里能用，但在别的引擎里可能是 Invalid Date。
 *    (4) '2024-02-30' 这种不存在的日期，V8 会"宽容"地滚动到 3 月 1 日，
 *        而规范其实要求超出月份的日期判为 Invalid —— 各引擎实现不一致。
 *    (5) 只写时间不写日期（'10:30'）会被解析成 Invalid Date。
 *    (6) 用 new Date('...') 之后再 toISOString()，一旦是 Invalid Date 就抛错。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/06_date_parsing.js
 *
 * 【预期输出】
 *   分 6 个小节，展示 ISO 格式的解析规则、时区歧义、非法输入的识别、
 *   非 ISO 格式的不确定性，以及一份"安全解析"的实践建议。
 * ============================================================================
 */

console.log('--- 1. 规范保证可解析的 ISO 8601 格式 ---');

// 只写日期：按 UTC 解释，toISOString() 的结果固定。
console.log("'2024-03-15'         ->", new Date('2024-03-15').toISOString(), '（UTC 零点）');
console.log("'2024-03-15T00:00Z'  ->", new Date('2024-03-15T00:00:00Z').toISOString());
// 只写年、年+月，其余部分默认补零。
console.log("'2024'               ->", new Date('2024').toISOString());
console.log("'2024-03'            ->", new Date('2024-03').toISOString());
// 带显式偏移：+08:00 表示"本地时间比 UTC 快 8 小时"，所以 UTC 就是减 8 小时。
console.log("'2024-03-15T08:00+08:00' ->", new Date('2024-03-15T08:00+08:00').toISOString());
console.log("'2024-03-15T08:00-05:00' ->", new Date('2024-03-15T08:00-05:00').toISOString());
// 毫秒和小数秒都可以有。
console.log("'2024-03-15T08:00:00.5Z' ->", new Date('2024-03-15T08:00:00.5Z').toISOString(), '（0.5 秒 = 500 毫秒）');
// Date.parse 直接给数字，失败给 NaN。
console.log("Date.parse('2024-03-15T00:00:00Z') =", Date.parse('2024-03-15T00:00:00Z'));

console.log('\n--- 2. 时区歧义：这是解析里最大的一类坑 ---');

// 情况 A：纯日期 -> UTC。下面这个断言与机器时区无关，恒为 true。
const dateOnly = new Date('2024-03-15');
console.log('纯日期解析后的小时（UTC）=', dateOnly.getUTCHours(), '（一定是 0）');
console.log('纯日期解析后是不是 UTC 零点：', dateOnly.toISOString() === '2024-03-15T00:00:00.000Z');
// 但在 UTC+8 的机器上读本地日，会变成 15 日 08:00；
// 在 UTC-5 的机器上则变成 14 日 19:00 —— 这就是"日期错位"。
console.log('本机偏移（分钟）=', dateOnly.getTimezoneOffset(), '（随机器变化）');
console.log('本机读出的"日"= ', dateOnly.getDate(), '（在 UTC 以西的时区会变成 14，即前一天）');

// 情况 B：日期+时间，不带时区后缀 -> 本地时间。
// 为避免依赖机器时区，这里只比较"是不是本地零点"，不打印绝对值。
const dateTimeLocal = new Date('2024-03-15T00:00:00');
console.log('"2024-03-15T00:00:00"（无后缀）的本地小时 =', dateTimeLocal.getHours(), '（一定是 0，按本地解释）');
console.log('它的 UTC 小时 =', dateTimeLocal.getUTCHours(), '（= -偏移/60，随机器变化）');
console.log('结论：写清楚时区后缀，才能让解析结果跨机器一致。');
console.log("带 Z 的版本解析出的 UTC 小时 =", new Date('2024-03-15T00:00:00Z').getUTCHours(), '（固定 0）');

console.log('\n--- 3. 横线与斜线的差异 ---');

// 'YYYY-MM-DD' -> UTC（规范规定）；'YYYY/MM/DD' -> 本地（规范未规定，V8 按本地处理）。
const dash = new Date('2024-03-15');
const slash = new Date('2024/03/15');
console.log('横线版是 UTC 零点，斜线版是本地零点，两者相差', (slash - dash) / 3600000, '小时（恰好等于本机 UTC 偏移，数值随机器变化）');
console.log('本机偏移（分钟）=', slash.getTimezoneOffset(), '（在不同机器上这个差值会不同）');
console.log('两者互不相等（除非本机正好在 UTC）：', slash.getTime() !== dash.getTime());
console.log('⚠️ 斜线格式属于"实现相关"，规范并不保证，请勿在生产代码里依赖。');

console.log('\n--- 4. 解析失败的识别与处理 ---');

const badInputs = [
  '这不是日期',
  '2024-13-01', // 13 月
  '10:30', // 只有时间
  '2024-03-15T25:00:00Z', // 25 点
  '', // 空串（注意：空串会被当成无效，但 null 会被当成 0！）
];
for (const input of badInputs) {
  console.log(`  Date.parse(${JSON.stringify(input)}) =`, Date.parse(input));
}
// 特例：null 与 undefined 的转换规则不同，务必注意。
console.log('new Date(null)      ->', new Date(null).toISOString(), '（null 被当作 0，即纪元时刻！）');
console.log('new Date(undefined) ->', new Date(undefined).toString(), '（undefined 才是 Invalid Date）');

// 安全的解析封装：失败时返回 null，永不抛错。
/**
 * 安全解析日期字符串。
 * @param {string} input 待解析字符串
 * @returns {Date|null} 成功返回 Date，失败返回 null
 */
function parseSafe(input) {
  const ms = Date.parse(input);
  return Number.isNaN(ms) ? null : new Date(ms);
}
console.log('\nparseSafe 的返回值：');
for (const input of ['2024-03-15T00:00:00Z', '这不是日期']) {
  const r = parseSafe(input);
  console.log(`  ${JSON.stringify(input).padEnd(24)} ->`, r === null ? 'null' : r.toISOString());
}

console.log('\n--- 5. 宽容解析：不存在的日期会被"滚动" ---');

// V8 对 '2024-02-30' 的反应是滚动到 3 月 1 日，而不是判为非法。
// 规范其实要求这是 Invalid Date，所以不同引擎可能不同 —— 不要依赖。
const rolled = new Date('2024-02-30');
console.log("new Date('2024-02-30') ->", rolled.toISOString(), '（V8 滚动为 3 月 1 日，而非报错）');
console.log("new Date('2024-04-31') ->", new Date('2024-04-31').toISOString(), '（4 月只有 30 天，滚动为 5 月 1 日）');
// 因此"校验用户输入"绝不能只靠 new Date()，要自己比对分量。
/**
 * 严格校验 'YYYY-MM-DD' 是否为真实存在的日期。
 * @param {string} text 输入字符串
 * @returns {boolean}
 */
function isRealDate(text) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return false; // 格式不符
  const [, y, mo, d] = m.map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  // 如果引擎做了滚动，读回来的分量就对不上了。
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}
console.log('\nisRealDate 严格校验：');
for (const t of ['2024-02-29', '2023-02-29', '2024-02-30', '2024-13-01']) {
  console.log(`  ${t} ->`, isRealDate(t));
}

console.log('\n--- 6. 非 ISO 格式：能跑不代表安全 ---');

// V8（Node / Chrome）能解析下面这些"人类友好"的格式，但规范并未要求，
// 换一个引擎（如 Safari 的 JavaScriptCore）结果可能完全不同。
const nonIso = [
  'March 15, 2024',
  'Mar 15 2024',
  '15 Mar 2024',
  '03/15/2024', // 美式 月/日/年
  '2024年3月15日',
];
console.log('以下解析结果由引擎决定，跨引擎不保证一致：');
for (const text of nonIso) {
  const ms = Date.parse(text);
  if (Number.isNaN(ms)) {
    console.log(`  ${JSON.stringify(text).padEnd(22)} -> NaN（Invalid Date）`);
  } else {
    // 这些非 ISO 格式在 V8 里按**本地时间**解释，所以这里打印本地分量；
    // 若能解析成功，本地分量在任何时区下读出来都是同一个日历日。
    const d = new Date(ms);
    const localText = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    console.log(`  ${JSON.stringify(text).padEnd(22)} -> 本地日期 ${localText}（注意：这是本地时间，不是 UTC）`);
  }
}

// 两位年份的两种不同规则，放在一起对比更容易记住。
console.log('\n两位年份的两种规则（注意它们并不一致）：');
console.log("  字符串解析 '01/01/24' 的年份 ->", new Date(Date.parse('01/01/24')).getFullYear(), '（字符串里的 24 当作 2024）');
console.log('  new Date(24, 0, 1).getFullYear() ->', new Date(24, 0, 1).getFullYear(), '（数字分量：24 当作 1924）');

console.log('\n--- 7. 实践建议 ---');
console.log('1) 输入只接受 ISO 8601，且**必须带时区**：2024-03-15T08:00:00+08:00');
console.log('2) 需要"本地日期"时，用 new Date(y, m-1, d) 从分量构造，不要解析字符串');
console.log('3) 解析一律用 Date.parse + Number.isNaN 判断，不要靠异常');
console.log('4) 用户输入的日期先用正则校验格式，再校验分量是否真实存在');
console.log('5) 不要依赖任何非 ISO 格式（"March 15, 2024"、"2024/03/15" 等）');
console.log('\n本节结束。');
