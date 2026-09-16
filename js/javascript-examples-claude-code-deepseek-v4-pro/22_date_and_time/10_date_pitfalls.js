/**
 * ============================================================================
 * 知识点：日期与时间常见陷阱汇总 —— 月份索引、时区错位、夏令时、可变性
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】进阶
 * 【前置知识】22_date_and_time/01~09 全部
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这是本目录的收官示例，把前面各节踩过的坑集中成一份"避坑清单"，
 *    每条都配一个可运行的正反对照。
 *
 * 2. 陷阱清单（共 12 条）
 *    (1)  月份索引从 0 开始：0 = 一月、11 = 十二月。
 *    (2)  年份分量 0~99 映射到 1900~1999：new Date(99, 0, 1) 是 1999 年。
 *    (3)  纯日期字符串 'YYYY-MM-DD' 按 UTC 解释，导致"日期错位"。
 *    (4)  斜线格式 'YYYY/MM/DD' 按本地解释，与横线格式行为不一致。
 *    (5)  非 ISO 格式（'March 15, 2024'）解析结果由引擎决定，不可移植。
 *    (6)  getTimezoneOffset() 的符号是"UTC 减本地"，与直觉相反。
 *    (7)  夏令时（DST）下存在"不存在的时刻"和"重复的时刻"。
 *    (8)  Date 是可变的，共享引用会被意外修改。
 *    (9)  用 === 比较两个 Date 比的是引用而不是时刻。
 *    (10) Invalid Date 会静默传播，直到 toISOString() 才抛 RangeError。
 *    (11) setMonth 在月末会溢出（1 月 31 日 + 1 月 = 3 月 2 日）。
 *    (12) 用 Date 做计时会被系统校时影响，应当用 performance.now()。
 *
 * 3. 核心防御策略
 *    - 输入：只接受带时区的 ISO 8601；用户输入先用正则校验分量。
 *    - 内部：统一用毫秒时间戳或 UTC 运算，避免任何"本地时间"参与计算。
 *    - 输出：展示时用 Intl + 显式时区；传输时用 toISOString()。
 *    - 工具：日期运算一律写成纯函数，绝不修改入参。
 *
 * 4. 常见陷阱
 *    见上文 12 条。本文件的每一节都给出"❌ 错误写法"与"✅ 正确写法"的对照。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/10_date_pitfalls.js
 *
 * 【预期输出】
 *   分 13 个小节，逐条演示陷阱与对策。所有需要确定性的结果都基于固定日期
 *   或显式时区，输出跨机器一致。
 * ============================================================================
 */

console.log('--- 1. 陷阱：月份从 0 开始 ---');
// ❌ 以为 1 是一月，结果得到 2 月。
console.log('❌ new Date(2024, 1, 1) 的月份 =', new Date(2024, 1, 1).getMonth() + 1, '月（本意是一月，实为二月）');
// ✅ 用常量或 +1/-1 换算保持清晰。
const MONTH = { JAN: 0, FEB: 1, MAR: 2, DEC: 11 };
console.log('✅ new Date(2024, MONTH.JAN, 1) =', new Date(2024, MONTH.JAN, 1).getMonth() + 1, '月');
console.log('✅ 展示时永远 +1：getMonth() + 1 =', new Date(2024, 0, 1).getMonth() + 1);

console.log('\n--- 2. 陷阱：两位年份被映射到 1900 年代 ---');
// ❌ 数字分量里的 0~99 会被加上 1900。
console.log('❌ new Date(99, 0, 1).getFullYear() =', new Date(99, 0, 1).getFullYear());
console.log('❌ new Date(24, 0, 1).getFullYear() =', new Date(24, 0, 1).getFullYear());
// ✅ 永远写完整的四位年份。
console.log('✅ new Date(1999, 0, 1).getFullYear() =', new Date(1999, 0, 1).getFullYear());
// 注意字符串解析是另一套规则：'01/01/24' 里的 24 会被当成 2024。
console.log('   字符串解析 "01/01/24" 的年份 =', new Date(Date.parse('01/01/24')).getFullYear(), '（两套规则不一致，更危险）');

console.log('\n--- 3. 陷阱：纯日期字符串按 UTC 解释，导致日期错位 ---');
const utcParsed = new Date('2024-03-15');
console.log('❌ new Date("2024-03-15").toISOString() =', utcParsed.toISOString(), '（这是 UTC 零点）');
console.log('   在 UTC-5 的机器上 getDate() 会得到 14（前一天），而 UTC+8 得到 15');
console.log('   本机 getDate() =', utcParsed.getDate(), '（数值随机器时区变化，这正是问题所在）');
// ✅ 想要"本地的那一天"，用分量构造。
const localDay = new Date(2024, 2, 15);
console.log('✅ new Date(2024, 2, 15).getDate() =', localDay.getDate(), '（任何时区都是 15）');
// ✅ 想要"UTC 的那一天"，就用 UTC getter 读。
console.log('✅ new Date("2024-03-15").getUTCDate() =', utcParsed.getUTCDate(), '（任何时区都是 15）');

console.log('\n--- 4. 陷阱：横线与斜线格式的时区规则不同 ---');
const dashFormat = new Date('2024-03-15');
const slashFormat = new Date('2024/03/15');
console.log('横线 "2024-03-15" UTC 零点，斜线 "2024/03/15" 本地零点');
console.log('  两者相差小时数 =', (slashFormat - dashFormat) / 3600000, '（= 本机 UTC 偏移小时数，随机器变化）');
console.log('  本机偏移（分钟）=', slashFormat.getTimezoneOffset());
console.log('✅ 结论：不要用斜线格式；要本地日期就从分量构造，要 UTC 就加 Z 后缀。');
console.log('✅ new Date("2024-03-15T00:00:00Z") =', new Date('2024-03-15T00:00:00Z').toISOString(), '（显式、无歧义）');

console.log('\n--- 5. 陷阱：非 ISO 格式解析不可移植 ---');
console.log('V8 能解析 "March 15, 2024"，但规范并未要求，其它引擎可能返回 Invalid Date。');
const nonIsoMs = Date.parse('March 15, 2024');
console.log('  在本次运行的环境里，Date.parse("March 15, 2024") =', nonIsoMs, '（不是 NaN 说明该引擎"额外支持"了它）');
console.log('  它被解释为**本地时间**而非 UTC，所以这里用本地分量读回来验证：');
const nonIsoDate = new Date(nonIsoMs);
console.log('  本地日期 =', `${nonIsoDate.getFullYear()}-${String(nonIsoDate.getMonth() + 1).padStart(2, '0')}-${String(nonIsoDate.getDate()).padStart(2, '0')}`);
console.log('  ⚠️ 换成 Safari 或别的 JS 引擎，这一行可能直接得到 NaN —— 这就是"不可移植"。');
console.log('✅ 结论：解析只用 ISO 8601，且必须带时区后缀。');
console.log('✅ "March 15, 2024" 的安全替代 =', new Date(Date.UTC(2024, 2, 15)).toISOString());

console.log('\n--- 6. 陷阱：getTimezoneOffset() 的符号与直觉相反 ---');
const offsetSample = new Date('2024-01-01T00:00:00Z');
const offsetValue = offsetSample.getTimezoneOffset();
console.log('定义：getTimezoneOffset() = UTC 时刻 - 本地时刻（分钟）');
console.log('  本机返回值 =', offsetValue, '（正数表示在 UTC 以西，负数表示在 UTC 以东）');
console.log('  UTC+8 机器上得到 -480，UTC-5 机器上得到 +300');
console.log('✅ 人类习惯的"UTC 偏移" = -getTimezoneOffset() =', -offsetValue, '分钟');
// 用确定性数据验证符号：某时区此刻在 UTC 以东还是以西。
function offsetOf(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return Math.round((Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second')) - (date.getTime() - date.getMilliseconds())) / 60000);
}
console.log('  参照：纽约 =', offsetOf(offsetSample, 'America/New_York'), '分钟（负）；上海 =', offsetOf(offsetSample, 'Asia/Shanghai'), '分钟（正）');

console.log('\n--- 7. 陷阱：夏令时下"不存在的时刻"与"重复的时刻" ---');

// 本节所有的时区实验都用**显式的 IANA 时区名**（America/New_York），不依赖本机时区，
// 因此无论你在哪个时区运行，下面这些数字都完全一致。
// 下面两个工具函数把"时区"这件事讲清楚：
/**
 * 读取某个 IANA 时区在某个时刻的墙上时间，形如 '2024-03-10 03:30'。
 * @param {string} timeZone IANA 时区名，如 'America/New_York'
 * @param {number} timestamp 毫秒时间戳
 * @returns {string} 该时区的墙上时间（不含秒）
 */
function wallClockIn(timeZone, timestamp) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).formatToParts(new Date(timestamp));
  const get = (type) => parts.find((p) => p.type === type).value;
  // en-US 的 hour12:false 在午夜会给出 '24'，取模 24 归一成 '00'
  const hour = String(Number(get('hour')) % 24).padStart(2, '0');
  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}`;
}
/**
 * 读取某个 IANA 时区在某个时刻的 **UTC 偏移分钟数**（人类习惯的符号）。
 * 与第 6 节的 offsetOf 正好差一个负号：那里返回的是"本地减 UTC"，这里返回"UTC 偏移"。
 * 例：UTC+8 得到 480，美东 EST 得到 -300，美东 EDT 得到 -240。
 * @param {string} timeZone IANA 时区名
 * @param {number} timestamp 毫秒时间戳
 * @returns {number} 偏移分钟数
 */
function utcOffsetMinutes(timeZone, timestamp) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(timestamp));
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return Math.round((asUtc - Math.floor(timestamp / 1000) * 1000) / 60000);
}
/**
 * 把 'HH:mm' 换算成"从零点起的分钟数"，方便做差值。
 * @param {string} hhmm 形如 '02:30'
 * @returns {number} 分钟数
 */
function hhmmToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

const DST_TZ = 'America/New_York';

// ---- 7.1 春季跳进：一整段"不存在"的墙上时间 ----
console.log('【春季跳进 gap】2024-03-10，美东 02:00 直接跳到 03:00，02:00~03:00 从未存在。');
console.log('先看偏移是怎么变的（两个固定 UTC 时刻，不依赖本机时区）：');
const beforeGap = Date.UTC(2024, 2, 10, 6, 0); // 06:00Z = 美东 01:00 EST
const afterGap = Date.UTC(2024, 2, 10, 8, 0); // 08:00Z = 美东 04:00 EDT
console.log('  06:00Z -> 纽约', wallClockIn(DST_TZ, beforeGap), '，偏移', utcOffsetMinutes(DST_TZ, beforeGap), '分钟（EST，UTC-5）');
console.log('  08:00Z -> 纽约', wallClockIn(DST_TZ, afterGap), '，偏移', utcOffsetMinutes(DST_TZ, afterGap), '分钟（EDT，UTC-4）');
console.log('  👆 物理时间只过了 2 小时，墙上时间却走了 3 小时 —— 中间那 1 小时被"跳过"了。');
console.log('');
console.log('❌ 错误写法：在某台美东的机器上用本地分量"猜"一个墙上时间');
console.log('     const d = new Date(2024, 2, 10, 2, 30);   // 本意是"当天凌晨 2:30"');
console.log('   而 02:30 那天在美东根本不存在，JS 不会报错，它**静默**把结果挪到了 03:30（EDT）。');
// 本机不一定在美东，所以用"固定 UTC 时刻 + 显式时区"把这个跳变复现出来：
const gapMoment = Date.UTC(2024, 2, 10, 7, 30); // 07:30Z
const requestedWallTime = '02:30';
const actualWallTime = wallClockIn(DST_TZ, gapMoment).slice(-5); // 取 'HH:mm' 部分
console.log('   复现：那一瞬间的 UTC 时刻是', new Date(gapMoment).toISOString());
console.log('   请求的墙上时间 =', requestedWallTime, '，实际得到的 =', actualWallTime,
  '，相差', hhmmToMinutes(actualWallTime) - hhmmToMinutes(requestedWallTime), '分钟');
console.log('   👆 "请求 02:30、拿到 03:30"—— 这就是"静默前进一小时"，全程没有任何警告。');
console.log('');
console.log('   在**本机**跑同样的构造会发生什么？（不做断言，因为本机时区不一定是美东）');
const localNaiveGap = new Date(2024, 2, 10, 2, 30);
const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('     本机时区 =', localTimeZone, '，new Date(2024, 2, 10, 2, 30).getHours() =', localNaiveGap.getHours());
if (localNaiveGap.getHours() === 2) {
  console.log('     -> 本机这一天没有跳变，构造结果与请求一致；换一台美东的机器结果就会变成 3。');
} else {
  console.log('     -> 本机这一天存在跳变，构造结果被**静默改写**，和请求值对不上。');
}
console.log('     👆 同一行代码，在不同时区的机器上得到不同结果 —— 这正是跨时区 bug 的温床。');

// ---- 7.2 秋季回拨：同一个墙上时间出现两次 ----
console.log('');
console.log('【秋季回拨 overlap】2024-11-03，美东 02:00 EDT 回拨到 01:00 EST，01:00~02:00 出现两次。');
const firstOneThirty = Date.UTC(2024, 10, 3, 5, 30); // 05:30Z = 01:30 EDT（第一次）
const secondOneThirty = Date.UTC(2024, 10, 3, 6, 30); // 06:30Z = 01:30 EST（第二次）
console.log('❌ 错误写法：以为"一个墙上时间"就能唯一确定"一个时刻"');
console.log('  两个相差整整 1 小时的物理时刻，在纽约的墙上时间完全相同：');
console.log('    ' + new Date(firstOneThirty).toISOString(), '-> 纽约', wallClockIn(DST_TZ, firstOneThirty),
  '（第一次，偏移', utcOffsetMinutes(DST_TZ, firstOneThirty), '分钟）');
console.log('    ' + new Date(secondOneThirty).toISOString(), '-> 纽约', wallClockIn(DST_TZ, secondOneThirty),
  '（第二次，偏移', utcOffsetMinutes(DST_TZ, secondOneThirty), '分钟）');
console.log('  墙上时间相等吗？', wallClockIn(DST_TZ, firstOneThirty) === wallClockIn(DST_TZ, secondOneThirty),
  '；两个时刻的时间戳相差', (secondOneThirty - firstOneThirty) / 60000, '分钟');
console.log('  👆 所以"纽约 2024-11-03 01:30"这个说法本身就是**有歧义的**。');
console.log('  ❌ 而 Date 内部只有"一个毫秒时间戳"，没有时区字段，它根本表达不了这种歧义：');
console.log('     你写 new Date(2024, 10, 3, 1, 30) 只会命中其中一个（命中哪一个由引擎决定），');
console.log('     另一个时刻**无法用 Date 表达出来**，只能靠额外的偏移量信息去区分。');

// ---- 7.3 正确做法 ----
console.log('');
console.log('✅ 正确写法一：内部计算全用 UTC 或毫秒时间戳，只在展示时才换算到某个时区');
console.log('   本节上半部分就是这么做的：所有时刻都用 Date.UTC(...) 构造，全程不碰本地分量。');
console.log('');
console.log('✅ 正确写法二：跨时区展示时显式指定 IANA 时区名，把跳变交给 Intl 处理');
const fixedMoment = Date.UTC(2024, 2, 10, 7, 30);
console.log('   同一个 UTC 时刻', new Date(fixedMoment).toISOString(), '在不同时区的呈现：');
for (const tz of ['America/New_York', 'Asia/Shanghai', 'UTC']) {
  console.log('     ' + tz.padEnd(18) + wallClockIn(tz, fixedMoment) + '（偏移 ' + utcOffsetMinutes(tz, fixedMoment) + ' 分钟）');
}
console.log('   👆 时刻只有一个，呈现随时区变化 —— 这就是"存时刻、显时区"的正确姿势。');
console.log('');
console.log('✅ 正确写法三：分清"物理 24 小时"和"日历上的下一天"');
// 两个固定 UTC 时刻，它们分别是纽约本地 3/9 和 3/10 的中午 12:00。
const nyNoonMar9 = Date.parse('2024-03-09T17:00:00Z'); // 纽约 2024-03-09 12:00 EST
const nyNoonMar10 = Date.parse('2024-03-10T16:00:00Z'); // 纽约 2024-03-10 12:00 EDT
console.log('   两个时刻在纽约的墙上时间都是 12:00：',
  wallClockIn(DST_TZ, nyNoonMar9), '/', wallClockIn(DST_TZ, nyNoonMar10));
console.log('   但它们的时间戳相差', (nyNoonMar10 - nyNoonMar9) / 3600000, '小时（不是 24 —— 跳变那天只有 23 小时）');
console.log('   要"整整 24 小时后"     -> 用时间戳 + 86400000');
console.log('   要"日历上的下一天"     -> 用日期分量运算（如 setDate(getDate() + 1)）');
console.log('   两者在夏令时那天**不是同一个结果**，用错就会差一小时。');
console.log('');
console.log('⚠️ 本节的结论都建立在运行环境的时区数据库（IANA tzdata）之上。');
console.log('   各国调整夏令时规则的频率比想象中高，所以永远用 IANA 时区名 + Intl，');
console.log('   不要在代码里硬编码 -5 / -4 这类偏移数字 —— 它们哪天就会被现实推翻。');

console.log('\n--- 8. 陷阱：Date 是可变的 ---');
const originalDate = new Date('2024-03-15T00:00:00Z');
const aliasDate = originalDate;
aliasDate.setUTCDate(20);
console.log('❌ 通过别名修改后，原变量也变了 =', originalDate.toISOString());
console.log('✅ 对策一：需要独立副本时显式复制 new Date(d.getTime())');
const copyA = new Date('2024-03-15T00:00:00Z');
const copyB = new Date(copyA.getTime());
copyB.setUTCDate(20);
console.log('   copyA =', copyA.toISOString(), '（未被影响）');
console.log('   copyB =', copyB.toISOString());
console.log('✅ 对策二：把日期运算写成纯函数（返回新对象，不改入参）');
/**
 * 纯函数：返回"加 n 天"后的新 Date。
 * @param {Date} d 原始日期
 * @param {number} n 天数
 * @returns {Date} 新对象
 */
const addDaysPure = (d, n) => new Date(d.getTime() + n * 86400000);
const pureBase = new Date('2024-03-15T00:00:00Z');
console.log('   addDaysPure(base, 5) =', addDaysPure(pureBase, 5).toISOString(), '，base 仍是', pureBase.toISOString());

console.log('\n--- 9. 陷阱：用 === 比较 Date ---');
const dateX = new Date('2024-03-15T00:00:00Z');
const dateY = new Date('2024-03-15T00:00:00Z');
console.log('❌ dateX === dateY  ->', dateX === dateY, '（比的是引用）');
console.log('⚠️  dateX == dateY   ->', dateX == dateY, '（同样比引用，不是比时间）');
console.log('⚠️  dateX < dateY    ->', dateX < dateY, '（关系运算符才会隐式转成时间戳）');
console.log('✅ dateX.getTime() === dateY.getTime() ->', dateX.getTime() === dateY.getTime());
console.log('✅ dateX - dateY === 0 ->', dateX - dateY === 0, '（相减得到毫秒差，可用于排序比较器）');
const unsorted = [new Date('2024-03-15T00:00:00Z'), new Date('2024-01-01T00:00:00Z')];
console.log('✅ 排序：arr.sort((a, b) => a - b) ->', unsorted.sort((a, b) => a - b).map((d) => d.toISOString()).join(' , '));

console.log('\n--- 10. 陷阱：Invalid Date 静默传播 ---');
const invalid = new Date('坏输入');
console.log('❌ invalid.getFullYear() =', invalid.getFullYear(), '（NaN，不报错）');
console.log('❌ invalid.getTime()     =', invalid.getTime(), '（NaN，不报错）');
console.log('❌ invalid.getTime() + 86400000 =', invalid.getTime() + 86400000, '（NaN，错误被吞掉继续往下传）');
console.log('   （注意别写成 invalid + 86400000 —— 加号会让 Date 先转成字符串，得到 "Invalid Date86400000"）');
console.log('   实际结果 =', String(invalid + 86400000), '（是字符串拼接，错误被更彻底地掩盖）');
try {
  invalid.toISOString();
} catch (err) {
  console.log('💥 直到这一刻才炸 ->', err.constructor.name + ':', err.message);
}
console.log('✅ 对策：入口处统一校验，用 Number.isNaN(d.getTime()) 判断');
/**
 * 断言一个 Date 是有效的，否则抛错（"快速失败"策略）。
 * @param {Date} d 待校验对象
 * @param {string} label 出错时显示的字段名
 * @returns {Date} 原对象，便于链式使用
 */
function assertValidDate(d, label) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) {
    throw new TypeError(`${label} 不是一个有效日期`);
  }
  return d;
}
try {
  assertValidDate(invalid, 'createdAt');
} catch (err) {
  console.log('   assertValidDate 抛错 ->', err.constructor.name + ':', err.message);
}
console.log('   assertValidDate(new Date("2024-03-15"), "x") 的 UTC 日 =', assertValidDate(new Date('2024-03-15'), 'x').getUTCDate());

console.log('\n--- 11. 陷阱：setMonth 在月末溢出 ---');
const endOfJan = new Date(2024, 0, 31);
const naiveAdd = new Date(endOfJan.getTime());
naiveAdd.setMonth(naiveAdd.getMonth() + 1);
console.log('❌ 2024-01-31 setMonth(+1) ->', naiveAdd.getMonth() + 1, '月', naiveAdd.getDate(), '日（应是 2 月，却跑到 3 月）');
// ✅ 对策：先退到 1 号再加，最后夹住。
/**
 * 纯函数：安全的"加 N 个月"。
 * @param {Date} date 原始日期
 * @param {number} months 月份数，可为负
 * @returns {Date} 新对象
 */
function addMonthsPure(date, months) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  // 目标月最后一天：把"下个月的第 0 天"当作目标月的最后一天。
  const lastDay = new Date(y, m + months + 1, 0).getDate();
  return new Date(y, m + months, Math.min(d, lastDay), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}
const safeAdd = addMonthsPure(endOfJan, 1);
console.log('✅ addMonthsPure(2024-01-31, +1) ->', safeAdd.getMonth() + 1, '月', safeAdd.getDate(), '日');
const safeAdd2 = addMonthsPure(new Date(2024, 2, 31), 1);
console.log('✅ addMonthsPure(2024-03-31, +1) ->', safeAdd2.getMonth() + 1, '月', safeAdd2.getDate(), '日（4 月只有 30 天，夹住）');

console.log('\n--- 12. 陷阱：用 Date 计时会被系统校时影响 ---');
console.log('❌ const t0 = new Date(); ...; const t1 = new Date(); t1 - t0');
console.log('   若期间 NTP 把系统时间回拨，结果可能是负数或巨大值。');
// 用两个固定时刻演示"回拨"的荒谬结果（不依赖真实时钟）。
const clockBefore = Date.parse('2024-01-01T00:00:00Z');
const clockAfterRollback = Date.parse('2023-12-31T23:59:59Z');
console.log('   模拟回拨 1 秒后的"耗时" =', clockAfterRollback - clockBefore, '毫秒（负数！）');
console.log('✅ 对策：计时用 performance.now()（单调时钟，不受校时影响）');
const perfStart = performance.now();
let acc = 0;
for (let i = 0; i < 100000; i++) acc += i;
const perfEnd = performance.now();
console.log('   performance.now() 差值 =', (perfEnd - perfStart).toFixed(3), '毫秒（值每次不同，但恒为非负数）');
console.log('   是否为非负数：', perfEnd - perfStart >= 0);
console.log('   累加结果（固定）=', acc);

console.log('\n--- 13. 避坑总清单 ---');
const checklist = [
  ['月份索引 0~11，展示时 +1', 'new Date(2024, 0, 1) 是一月'],
  ['年份写 4 位', 'new Date(24, 0, 1) 是 1924 年'],
  ['解析只用带时区的 ISO 8601', '"2024-03-15T08:00:00+08:00"'],
  ['本地日期用分量构造', 'new Date(2024, 2, 15)，不要解析字符串'],
  ['UTC 读写用 getUTC* / toISOString', '跨机器可复现'],
  ['展示用 Intl + 显式 timeZone', "toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })"],
  ['存储用时间戳或 ISO 字符串', '永不存本地时间字符串'],
  ['偏移取负号才是"UTC 偏移"', '-getTimezoneOffset()'],
  ['记时区名而不是偏移', 'Asia/Shanghai 自带夏令时规则'],
  ['运算写成纯函数', '返回新对象，别改入参'],
  ['比较用 getTime() 或相减', '别用 === 比 Date'],
  ['Invalid Date 用 Number.isNaN 检测', '入口处 fail fast'],
  ['加月要夹住溢出', '先退到 1 号再加'],
  ['计时用 performance.now()', '不要用两个 new Date() 相减'],
];
for (const [pitfall, fix] of checklist) {
  console.log(`  ${pitfall.padEnd(34)} -> ${fix}`);
}
console.log('\n本节结束。掌握这 14 条，绝大多数日期时间的坑都能避开。');
