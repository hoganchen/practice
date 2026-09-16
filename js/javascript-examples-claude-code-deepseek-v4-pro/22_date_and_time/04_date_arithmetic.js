/**
 * ============================================================================
 * 知识点：日期加减与间隔计算 —— 为什么时间戳运算优于 Date 运算
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】进阶
 * 【前置知识】22_date_and_time/01_date_creation.js、02_timestamp.js、03_date_getters_setters.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "日期加减"有两套完全不同的做法：
 *      (A) 时间戳运算：把日期转成毫秒数做加减，再转回 Date。
 *          1 天的毫秒数固定为 86400000，跨月跨年都不会出错。
 *      (B) 分量运算：用 setDate / setMonth 让 Date 自己进位。
 *          好处是"语义上算一个月"更贴近人的直觉，坏处是月末会溢出。
 *    "间隔计算"则是把两个时刻相减得到毫秒数，再按需换算成天/小时/分钟。
 *
 * 2. 为什么需要
 *    "三天后提醒""会员到期还有几天""两个事件相隔多久""按周分组统计"——
 *    这些需求在业务代码里随处可见。用错方法会导致月末、年末、闰年出现错位。
 *
 * 3. 核心语法要点
 *    (1) 常量：SECOND=1000，MINUTE=60000，HOUR=3600000，DAY=86400000（毫秒）。
 *        注意 **DAY 是固定 24 小时**，不含夏令时因素；在有夏令时的时区里
 *        "本地时间的一天"可能是 23 或 25 小时，这是 B 方案更稳的地方。
 *    (2) 加减天数（推荐）：new Date(ts + n * DAY)。
 *    (3) 加减月/年（推荐用分量法）：setMonth(getMonth()+n)、setFullYear(getFullYear()+n)，
 *        但月末会溢出，需要"夹住"（见 03 号示例的 addMonthClamped）。
 *    (4) 间隔：end - start 得到毫秒差；天数 = 毫秒差 / DAY，可能不是整数，
 *        取整方式要按业务选 Math.floor / Math.round / Math.ceil。
 *    (5) 只关心"日期"时，先把两端的时分秒毫秒清零（setHours(0,0,0,0)），
 *        得到的才是"整天数"。
 *    (6) Date 是可变对象，任何原地 set 都会污染调用的地方；做运算前先复制。
 *
 * 4. 常见陷阱
 *    (1) 用 setMonth 做"每月加一"导致 1 月 31 日 -> 3 月 2 日。
 *    (2) 忽略"时间部分"：2024-01-01T23:00 与 2024-01-02T01:00 相差 2 小时，
 *        若按"日"相减会得到 1 天，若不清零则会得到 0.08 天。
 *    (3) 用 Math.round 算天数，跨 DST 时 23 小时的"一天"会被算成 1 天（碰巧对），
 *        而 25 小时的"一天"会被算成 1 天（也碰巧对），但 12 小时会被算成 1 天（错）。
 *    (4) 直接修改传入的 Date 参数，导致调用方的时间被悄悄改掉。
 *    (5) 毫秒相减得到的是"物理时长"，而人对"差几天"的理解是"日历天数"，
 *        两者在跨夏令时/跨时区时不一致。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/04_date_arithmetic.js
 *
 * 【预期输出】
 *   分 7 个小节，演示时间戳加减、分量加减、月末溢出与夹住、间隔计算、
 *   整天数计算、纯函数式日期工具。输出全部基于固定日期，跨机器一致。
 * ============================================================================
 */

// 时间常量（毫秒）
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

console.log('--- 1. 时间常量 ---');
console.log('1 秒  =', SECOND, '毫秒');
console.log('1 分  =', MINUTE, '毫秒');
console.log('1 时  =', HOUR, '毫秒');
console.log('1 天  =', DAY, '毫秒');

console.log('\n--- 2. 时间戳加减：最稳的做法 ---');

// 用 UTC 时刻做基准，保证结果可复现。
const base = new Date('2024-01-31T12:00:00Z');
console.log('基准 =', base.toISOString());

// 加 1 天、7 天、30 天，都只是加法，绝不会出现"溢出到 3 月 2 日"这种事。
console.log('+1 天  =', new Date(base.getTime() + 1 * DAY).toISOString());
console.log('+7 天  =', new Date(base.getTime() + 7 * DAY).toISOString());
console.log('+30 天 =', new Date(base.getTime() + 30 * DAY).toISOString());
console.log('+1 年（365 天）=', new Date(base.getTime() + 365 * DAY).toISOString());
// 减法就是把系数写成负数。
console.log('-1 天  =', new Date(base.getTime() - 1 * DAY).toISOString());
// 小时、分钟同样适用。
console.log('+90 分钟 =', new Date(base.getTime() + 90 * MINUTE).toISOString());

// 跨年验证：12 月 31 日 + 1 天 = 次年 1 月 1 日。
const newYearEve = new Date('2024-12-31T00:00:00Z');
console.log('2024-12-31 + 1 天 =', new Date(newYearEve.getTime() + DAY).toISOString(), '（自动跨年）');
// 闰年验证：2024-02-28 + 1 天 = 02-29。
console.log('2024-02-28 + 1 天 =', new Date(Date.parse('2024-02-28T00:00:00Z') + DAY).toISOString(), '（闰年）');
console.log('2023-02-28 + 1 天 =', new Date(Date.parse('2023-02-28T00:00:00Z') + DAY).toISOString(), '（平年）');

console.log('\n--- 3. 分量加减：语义更贴近人，但月末会溢出 ---');

// 用"本地分量构造 + 本地分量读取"，结果在任何时区下都一样。
const jan31 = new Date(2024, 0, 31);
console.log('起点 =', jan31.getFullYear(), '年', jan31.getMonth() + 1, '月', jan31.getDate(), '日');
const addOneMonth = new Date(jan31.getTime());
addOneMonth.setMonth(addOneMonth.getMonth() + 1);
console.log(
  'setMonth(+1) 后 =',
  addOneMonth.getFullYear(), '年', addOneMonth.getMonth() + 1, '月', addOneMonth.getDate(), '日',
  '❌ 溢出到了 3 月',
);

// 加年份的溢出例子：2024-02-29（闰日）+ 1 年 -> 2025-03-01。
const leapDay = new Date(2024, 1, 29);
const addOneYear = new Date(leapDay.getTime());
addOneYear.setFullYear(addOneYear.getFullYear() + 1);
console.log(
  '2024-02-29 setFullYear(+1) 后 =',
  addOneYear.getFullYear(), '年', addOneYear.getMonth() + 1, '月', addOneYear.getDate(), '日',
  '❌ 溢出到了 3 月',
);

console.log('\n--- 4. 夹住溢出：安全的"加 N 个月" ---');

/**
 * 某年某月的最后一天。技巧：下个月的第 0 天会被归一为本月最后一天。
 * @param {number} year 四位年份（这里直接用 getFullYear() 的结果）
 * @param {number} monthIndex 月份索引 0~11
 */
function lastDayOfMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}
console.log('2024 年 2 月最后一天 =', lastDayOfMonth(2024, 1), '（闰年 29 天）');
console.log('2023 年 2 月最后一天 =', lastDayOfMonth(2023, 1), '（平年 28 天）');
console.log('2024 年 4 月最后一天 =', lastDayOfMonth(2024, 3), '（30 天）');
console.log('2024 年 12 月最后一天 =', lastDayOfMonth(2024, 11), '（跨年时 +1 月变成次年 1 月，第 0 天仍是 12-31）');

/**
 * 安全的"加 n 个月"：先把日退到 1 号避免溢出，加完再夹回目标月的合法日期。
 * 函数是纯的——先复制入参，绝不修改调用方的 Date。
 * @param {Date} date 原始日期
 * @param {number} n 要加的月份数，可为负
 * @returns {Date} 新对象
 */
function addMonths(date, n) {
  const result = new Date(date.getTime()); // 复制，保护入参
  const day = result.getDate();
  result.setDate(1); // 退到 1 号，杜绝"31 号加一个月"的溢出
  result.setMonth(result.getMonth() + n);
  // 目标月可能更短，取 min 就是"夹住"。
  const last = lastDayOfMonth(result.getFullYear(), result.getMonth());
  result.setDate(Math.min(day, last));
  return result;
}
const jan31b = new Date(2024, 0, 31);
const r1 = addMonths(jan31b, 1);
console.log('addMonths(2024-01-31, +1) =', r1.getMonth() + 1, '月', r1.getDate(), '日 ✅');
const r2 = addMonths(new Date(2024, 2, 31), 1); // 3-31 + 1 个月 -> 4 月只有 30 天
console.log('addMonths(2024-03-31, +1) =', r2.getMonth() + 1, '月', r2.getDate(), '日 ✅');
const r3 = addMonths(new Date(2024, 0, 15), -1); // 往前一个月，跨年
console.log('addMonths(2024-01-15, -1) =', r3.getFullYear(), '年', r3.getMonth() + 1, '月', r3.getDate(), '日 ✅（自动跨年）');
console.log('入参没有被修改：', jan31b.getMonth() + 1 === 1 && jan31b.getDate() === 31);

console.log('\n--- 5. 间隔计算：相减得到毫秒，再换算单位 ---');

const startDate = new Date('2024-01-01T00:00:00Z');
const endDate = new Date('2024-03-01T00:00:00Z');
const gapMs = endDate.getTime() - startDate.getTime();
console.log('2024-01-01 -> 2024-03-01');
console.log('  毫秒 =', gapMs);
console.log('  秒   =', gapMs / SECOND);
console.log('  分钟 =', gapMs / MINUTE);
console.log('  小时 =', gapMs / HOUR);
console.log('  天   =', gapMs / DAY, '（2024 是闰年：1 月 31 天 + 2 月 29 天 = 60 天）');

// 不满一天的间隔。
const a = new Date('2024-01-01T10:00:00Z');
const b = new Date('2024-01-01T15:30:00Z');
const shortGap = b.getTime() - a.getTime();
console.log('10:00 -> 15:30 相差', shortGap / MINUTE, '分钟 =', shortGap / HOUR, '小时');
// 把毫秒差拆成"时分秒"的经典写法。
function breakdown(ms) {
  const totalSeconds = Math.floor(ms / SECOND);
  return {
    小时: Math.floor(totalSeconds / 3600),
    分钟: Math.floor((totalSeconds % 3600) / 60),
    秒: totalSeconds % 60,
  };
}
console.log('拆成时分秒 =', JSON.stringify(breakdown(shortGap)));

console.log('\n--- 6. "相差几天"：先清零时间部分，再取整 ---');

// 说明：若程序只处理本地时间，归零可以写成 d.setHours(0, 0, 0, 0)；
// 这里为了不让输出随机器时区变化，改用按 UTC 归零的版本。
/**
 * 把 Date 归零到"UTC 当天 00:00:00.000"，返回新对象（不修改入参）。
 * @param {Date} d 任意日期
 * @returns {Date} 归零后的新 Date
 */
function utcStartOfDay(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// 场景：2024-01-01T23:00 与 2024-01-02T01:00，物理只差 2 小时，
// 但日历上跨了 1 天。业务上到底算几天，取决于需求。
const nearMidnightA = new Date('2024-01-01T23:00:00Z');
const nearMidnightB = new Date('2024-01-02T01:00:00Z');
const rawDiffDays = (nearMidnightB - nearMidnightA) / DAY;
console.log('物理时长换算 =', rawDiffDays, '天（远小于 1）');

// 用 UTC 零点归一来演示"日历天数"，避免本机时区影响。
const calendarDiffDays = (utcStartOfDay(nearMidnightB) - utcStartOfDay(nearMidnightA)) / DAY;
console.log('日历天数（UTC 归一）=', calendarDiffDays, '天 ✅ 符合"跨了一天"的直觉');

// 一个通用的"求整天数"函数。
/**
 * @param {Date} from 起始日期
 * @param {Date} to 结束日期
 * @returns {number} 两者相隔的整天数（按 UTC 日历日计算）
 */
function diffInDays(from, to) {
  const s = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const e = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((e - s) / DAY);
}
console.log('diffInDays(2024-01-01, 2024-03-01) =', diffInDays(new Date('2024-01-01T00:00:00Z'), new Date('2024-03-01T00:00:00Z')), '天');
console.log('diffInDays(2024-01-01, 2024-01-01) =', diffInDays(new Date('2024-01-01T00:00:00Z'), new Date('2024-01-01T23:59:59Z')), '天（同一天）');
console.log('diffInDays(2024-12-30, 2025-01-02) =', diffInDays(new Date('2024-12-30T00:00:00Z'), new Date('2025-01-02T00:00:00Z')), '天（跨年）');

console.log('\n--- 7. 用固定"现在"模拟常见业务计算 ---');

// 业务代码常写 new Date()，那样输出不可复现。这里把"现在"固定下来，
// 演示的公式和真实项目里一模一样，只是把时钟换成了常量。
const NOW = new Date('2024-06-15T08:00:00Z');
const expiryDate = new Date('2024-09-15T08:00:00Z');

const remainMs = expiryDate.getTime() - NOW.getTime();
const remainDays = Math.ceil(remainMs / DAY); // 不足一天也算一天，业务上常用 ceil
console.log('现在（固定值）=', NOW.toISOString());
console.log('到期时间      =', expiryDate.toISOString());
console.log('剩余毫秒      =', remainMs);
console.log('剩余天数      =', remainDays, '（Math.ceil，不足一天按一天算）');
console.log('是否已过期    =', remainMs <= 0);

// 反过来：从"现在"推"30 天后"。
console.log('30 天后 =', new Date(NOW.getTime() + 30 * DAY).toISOString());
// 以及"最近 7 天的起点"。
const sevenDaysAgo = new Date(NOW.getTime() - 7 * DAY);
console.log('7 天前  =', sevenDaysAgo.toISOString());

// 最后总结一句选择原则。
console.log('\n选择原则：');
console.log('  天 / 小时 / 分钟 / 秒 的加减  -> 用时间戳运算（new Date(ts + n * DAY)）');
console.log('  月 / 年 的加减               -> 用分量运算 + 夹住溢出（addMonths）');
console.log('  求间隔                       -> 先相减得毫秒，再按需换算并取整');
console.log('  求"日历天数"                 -> 先把两端归零到当天 0 点，再用 Math.round');
console.log('\n本节结束。');
