/**
 * ============================================================================
 * 知识点：时区基础 —— UTC 偏移、getTimezoneOffset 与 IANA 时区
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】进阶
 * 【前置知识】22_date_and_time/03_date_getters_setters.js、06_date_parsing.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    时刻（instant）是绝对的：全世界只有一条时间轴。
 *    时区（time zone）只是"把这条时间轴上的同一点，显示成几点几分"的一套规则。
 *    把两者分清楚，日期时间的坑就少了一半：
 *      绝对时刻  -> toISOString() / getTime()，永远不含时区歧义
 *      本地表现  -> getHours() / toLocaleString()，必须配上"哪个时区"才有意义
 *
 * 2. 三个必须分清的概念
 *    (1) UTC（协调世界时）：全球计时基准，写作 ...Z 或 +00:00。
 *    (2) UTC 偏移（offset）：某个时区此刻比 UTC 快/慢多少，
 *        如 +08:00、-05:00。它是**时刻相关**的——同一地区冬夏的偏移可能不同（夏令时）。
 *    (3) IANA 时区名：如 Asia/Shanghai、America/New_York。
 *        它比"偏移"更完整，因为它自带夏令时规则和历史变更。
 *        在 JS 里通过 Intl 的 timeZone 选项使用，**必须用它而不是偏移**，
 *        否则夏令时切换日会算错一小时。
 *
 * 3. 核心语法要点
 *    (1) date.getTimezoneOffset()：返回 (UTC - 本地) 的分钟数。
 *        东八区得到 -480，西五区得到 +300 —— **符号与直觉相反**。
 *        要得到人类习惯的"UTC 偏移"，需取负号：-getTimezoneOffset()。
 *    (2) 该偏移是"这个 Date 所在时刻"的偏移，跨夏令时切换点时同一个 Date 不同、
 *        偏移也不同。
 *    (3) Node 读取运行环境的 TZ 环境变量来决定"本地"是哪个时区
 *        （Windows 下则读系统时区设置）。
 *    (4) Intl.DateTimeFormat 的 timeZone 选项是用 IANA 名做时区换算的**唯一**标准手段，
 *        无需任何第三方库。
 *    (5) 时区换算公式：某时区的本地时间 = 该时刻 + 该时区的 UTC 偏移。
 *
 * 4. 常见陷阱
 *    (1) 用 getTimezoneOffset() 的正负号搞反（记住它返回 UTC 减本地）。
 *    (2) 只存"偏移"不存"时区名"：用户跨夏令时后，历史数据的偏移就错了。
 *    (3) 认为"服务器时区 = 用户时区"：服务器通常是 UTC，用户遍布全球。
 *    (4) 把 'YYYY-MM-DD HH:mm:ss' 这种不带时区的字符串存进数据库，
 *        不同服务读出来会差好几个小时。
 *    (5) 忘记 Intl 的 timeZone 选项，toLocaleString 就会用机器时区，
 *        导致"测试环境对、生产环境错"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/07_timezone_basics.js
 *
 * 【预期输出】
 *   分 7 个小节，演示 UTC 偏移的符号、同一时刻在不同时区的显示、
 *   夏令时造成的偏移变化、以及用 Intl 做时区换算的标准做法。
 *   所有需要确定性的结果都显式传入了时区。输出固定。
 * ============================================================================
 */

console.log('--- 1. 绝对时刻 vs 本地表现 ---');

// 带 Z 的 ISO 字符串描述的是一个**绝对时刻**。
const instant = new Date('2024-07-01T12:00:00Z');
console.log('绝对时刻（任何机器上都一样）=', instant.toISOString());
console.log('时间戳     （任何机器上都一样）=', instant.getTime());
// 而"本地表现"要看在哪个时区。用 Intl 显式指定，结果就是确定的：
for (const tz of ['UTC', 'Asia/Shanghai', 'America/New_York', 'Europe/London']) {
  const text = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).format(instant);
  console.log(`  ${tz.padEnd(18)} -> ${text}`);
}
console.log('同一个时刻，四个时区显示四个样子 —— 但它们描述的是同一件事。');

console.log('\n--- 2. getTimezoneOffset() 的符号规则 ---');

const sample = new Date('2024-07-01T12:00:00Z');
const off = sample.getTimezoneOffset();
console.log('本机 getTimezoneOffset() =', off, '分钟');
console.log('定义：返回值 = (UTC 时刻 - 本机显示的本地时刻)，单位分钟');
console.log('等价地：(本机本地时刻) = (UTC 时刻) - offset  分钟');
console.log('所以：东半球（快于 UTC）得到负数，西半球得到正数，符号与直觉相反。');
console.log('人类习惯的"UTC 偏移" = -getTimezoneOffset() =', -off, '分钟 =', -off / 60, '小时');
// 技巧：把"本地分量"原样搬进 Date.UTC()，就得到一个"墙上时间"对象，
// 它的 getUTC* 系列恰好等于原对象的 get* 系列。这个恒等式与机器时区无关，恒为 true。
function wallClockAsUTC(date) {
  return new Date(Date.UTC(
    date.getFullYear(), date.getMonth(), date.getDate(),
    date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds(),
  ));
}
const sysTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
console.log('本机时区名 =', sysTz, '（随机器变化，仅用于说明）');
const wall = wallClockAsUTC(sample);
console.log('把本地分量当作 UTC 读出的小时 =', wall.getUTCHours(), '，与 getHours() =', sample.getHours(), '相等：', wall.getUTCHours() === sample.getHours());
// 而 wall 与真实时刻的差，正好是本机与 UTC 的差值。
console.log('"墙上时间"与真实时刻相差', (wall - sample) / 3600000, '小时（= -offset/60，随机器时区变化）');
console.log('两者恒定的关系：wall - sample === -getTimezoneOffset()*60000 =>', (wall - sample) === -sample.getTimezoneOffset() * 60000);

console.log('\n--- 3. 用 Intl 求任意时区的 UTC 偏移（跨夏令时也正确） ---');

/**
 * 求某个 IANA 时区在指定时刻的 UTC 偏移（分钟）。
 * 思路：把该时刻在这两个"渲染口径"下的分量都凑成 UTC 时间戳再相减。
 * @param {Date} date 目标时刻
 * @param {string} timeZone IANA 时区名，如 'Asia/Shanghai'
 * @returns {number} 偏移分钟数，东区为正
 */
function utcOffsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date);
  const get = (type) => Number(parts.find((p) => p.type === type).value);
  // hour 在 hour12:false 下偶尔返回 24（表示午夜），取模归一。
  const asIfUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  // 渲染出的"墙上时间"比真实时刻快多少，就是偏移多少。
  return Math.round((asIfUTC - (date.getTime() - date.getMilliseconds())) / 60000);
}

const winter = new Date('2024-01-15T12:00:00Z');
const summer = new Date('2024-07-15T12:00:00Z');
console.log('时区                       冬季(1月)偏移    夏季(7月)偏移');
for (const tz of ['UTC', 'Asia/Shanghai', 'Asia/Kolkata', 'Europe/London', 'America/New_York', 'Australia/Sydney']) {
  const w = utcOffsetMinutes(winter, tz);
  const s = utcOffsetMinutes(summer, tz);
  console.log(
    `  ${tz.padEnd(20)} ${String(w).padStart(7)} 分    ${String(s).padStart(7)} 分`,
    w !== s ? '<- 有夏令时' : '',
  );
}
console.log('说明：中国不使用夏令时，所以冬夏都是 +480；');
console.log('      伦敦冬 +0 夏 +60，纽约冬 -300 夏 -240，悉尼在南半球，方向相反。');

console.log('\n--- 4. 夏令时（DST）切换日：偏移在几小时内跳变 ---');

// 2024-03-10 美国东部时间 02:00 从 EST(-5) 跳到 EDT(-4)。
// 用 UTC 时刻标注切换前后各一分钟，可以看到偏移的变化。
const beforeSwitch = new Date('2024-03-10T06:59:00Z'); // 美东 01:59 EST
const afterSwitch = new Date('2024-03-10T07:01:00Z'); // 美东 03:01 EDT
console.log('切换前 2024-03-10T06:59Z 的美东偏移 =', utcOffsetMinutes(beforeSwitch, 'America/New_York'), '分钟 (EST)');
console.log('切换后 2024-03-10T07:01Z 的美东偏移 =', utcOffsetMinutes(afterSwitch, 'America/New_York'), '分钟 (EDT)');
console.log('真实世界只过了 2 分钟，本地墙上时间却是 01:59 -> 03:01，跳过了 02:00 这一小时。');
for (const t of ['2024-03-10T06:30:00Z', '2024-03-10T07:00:00Z', '2024-03-10T07:30:00Z']) {
  console.log(
    `  ${t} -> 美东 `,
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false, hour: '2-digit', minute: '2-digit' }).format(new Date(t)),
  );
}
console.log('这段"02:00 不存在"的时段，是日期计算 bug 的高发区。');

console.log('\n--- 5. 用偏移手工换算时区 ---');

// 用固定的偏移（不依赖机器时区）做一次完整换算演示。
const baseUTC = new Date('2024-07-01T12:00:00Z');
const OFFSETS = { 'UTC+8（北京）': 480, 'UTC+5:30（印度）': 330, 'UTC-5（纽约夏令时）': -300 };
console.log('基准 UTC 时刻 =', baseUTC.toISOString());
for (const [name, offsetMin] of Object.entries(OFFSETS)) {
  // 该地区的墙上时间 = UTC 时刻 + 偏移。
  const wall = new Date(baseUTC.getTime() + offsetMin * 60000);
  const text = `${wall.getUTCFullYear()}-${String(wall.getUTCMonth() + 1).padStart(2, '0')}-${String(wall.getUTCDate()).padStart(2, '0')} ` +
    `${String(wall.getUTCHours()).padStart(2, '0')}:${String(wall.getUTCMinutes()).padStart(2, '0')}`;
  console.log(`  ${name.padEnd(18)} ${text}（用 getUTC* 读出"墙上时间"，避免机器时区干扰）`);
}
console.log('技巧：把"墙上时间"当成 UTC 分量读，就能在不改变机器时区的前提下表示任意时区的时间。');

console.log('\n--- 6. 本机时区名与运行环境 ---');
console.log('Intl 解析出的本机时区 =', Intl.DateTimeFormat().resolvedOptions().timeZone, '（随机器变化）');
console.log('本机时区偏移（分钟）   =', new Date().getTimezoneOffset(), '（随机器和当前日期变化）');
console.log('Node 读取 TZ 环境变量决定"本地"时区，例如：');
console.log('  Windows (cmd):  set TZ=UTC && node 22_date_and_time/07_timezone_basics.js');
console.log('  Linux/macOS :   TZ=America/New_York node 22_date_and_time/07_timezone_basics.js');
console.log('生产环境建议把服务器时区统一设为 UTC，避免"本地时间"带来的歧义。');

console.log('\n--- 7. 三条实践原则 ---');
console.log('1) 存储与传输一律用 UTC：toISOString() 或毫秒时间戳，永不存本地时间字符串。');
console.log('2) 只在"展示给用户"的那一刻做时区换算，用 IANA 时区名 + Intl。');
console.log('3) 需要记住用户时区时，存"时区名"（Asia/Shanghai），不要存"偏移"（+08:00），');
console.log('   因为偏移会随夏令时变化，而时区名不会。');
console.log('\n本节结束。');
