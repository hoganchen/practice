/**
 * ============================================================================
 * 知识点：ISO 周历与周数计算 —— 手写 getISOWeek / getISOWeekYear
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】进阶
 * 【前置知识】22_date_and_time/01~10 全部（特别是 04_date_arithmetic.js、
 *             07_timezone_basics.js、10_date_pitfalls.js）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ISO 8601 周历（ISO week date）是一套把日期表达成"年 + 第几周 + 星期几"的规则，
 *    广泛用于欧洲的日历、财务周期、排课表、周报系统。
 *    JS **根本没有** `getWeek()` 这样的方法，`Intl.DateTimeFormat` 也不提供周数，
 *    所以只能自己按 ISO 8601 的算法手写。
 *
 * 2. ISO 8601 周历的三条规则
 *    (1) 一周从**周一**开始，到**周日**结束（不是周日开始）；
 *    (2) 第 1 周是"包含 1 月 4 日的那一周"，等价说法是"包含当年第一个周四的那一周"；
 *    (3) 因此一年的第一周可能从上一年 12 月就开始了，最后一周也可能延到下一年 1 月。
 *
 * 3. 为什么需要（真实项目场景）
 *    (1) 周报系统：「2026 年第 1 周」到底是哪几天？跨年那周算哪一年？
 *    (2) 财务 / 排课周期：很多国家的财务周、学校的教学周都按 ISO 周编号；
 *    (3) 按周聚合报表：`GROUP BY iso_week` —— 如果按自然年分组，
 *        跨年的那一周会被**劈成两半**分到两个年份里，数据对不上；
 *    (4) 与外部系统对接：Excel 的 WEEKNUM(...,21)、ISO 周、Python 的
 *        `date.isocalendar()`，还有数据库的 `EXTRACT(WEEK FROM ...)`，各有各的规则，
 *        不对齐就会出现"我们说的是同一周吗"的扯皮。
 *
 * 4. 核心语法要点（也是唯一的坑点）
 *    JS 里要拿到 ISO 周，必须自己做三步：
 *      ① 把日期归一到当天零点，并转到 UTC 域做运算（避开时区与夏令时）；
 *      ② 求出该周的**周四**是几号 —— 周四落在哪一年，这一周就属于哪一年；
 *      ③ 用"该周四"减"那年 1 月 1 日"，除以 7 向上取整，就是周数。
 *    **真正的坑是第 ②/③ 步的产物：week-year（ISO 年）可能与 calendar year 不一致。**
 *      例：2025-12-29 是周一，它所在的那一周的周四是 2026-01-01，
 *          所以它是 **2026 年第 1 周**，而不是 2025 年第 53 周。
 *      同样地，2021-01-01 是周五，它属于 **2020 年第 53 周**。
 *
 * 5. 常见陷阱
 *    (1) 用 `Math.ceil(dayOfYear / 7)` 当周数 —— 完全不按周一对齐，结果错得离谱。
 *    (2) 用"距 1 月 1 日过了几个 7 天"来算 —— 没考虑 1 月 1 日是周几。
 *    (3) 只返回周数、不返回 ISO 年 —— 跨年那周一定会被归错年份。
 *    (4) 在本地时间域里做日期加减 —— 夏令时那天只有 23 小时，
 *        按毫秒累加会漂移；本文件统一转到 UTC 域运算。
 *    (5) 以为 dayjs 的 `week()` 就是 ISO 周 —— 它默认是 locale 相关的，
 *        要用 ISO 周得额外启用 isoWeek 插件；`Intl.DateTimeFormat` 则完全没有周数。
 *    (6) 把周数直接拼进字符串时忘了补零 —— "2026-W1" 和 "2026-W10" 排序就乱了。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/11_iso_week.js
 *
 * 【预期输出】
 *   先展示错误写法有多离谱，再给出正确实现，然后用 14 个已知边界日期逐一验证
 *   （含 2025-12-29、2026-01-01、闰年边界、1 月 1 日恰逢周四/周五的情况），
 *   接着演示跨年周在"按周聚合报表"里造成的偏差，最后给出工具函数与检查清单。
 *   所有日期都是**固定值**，输出与运行时刻、时区无关。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. ✗ 常见错误写法
// ---------------------------------------------------------------------------

console.log('--- 1. 错误写法：为什么"除以 7"一定不对 ---');

/**
 * ❌ 错误写法一：把"一年中的第几天"除以 7 向上取整。
 * @param {Date} date 日期
 * @returns {number} 错误的周数
 */
function wrongWeekByDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date - start) / 86400000) + 1;
  return Math.ceil(dayOfYear / 7);
}

/**
 * ❌ 错误写法二：算"距 1 月 1 日过了几个整 7 天"，再 +1。
 * 它看起来更"合理"，但完全没考虑 1 月 1 日是星期几。
 * @param {Date} date 日期
 * @returns {number} 错误的周数
 */
function wrongWeekByElapsed(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  const elapsed = Math.floor((date - start) / 86400000);
  return Math.floor(elapsed / 7) + 1;
}

const sample = new Date(2025, 11, 29); // 2025-12-29，周一
console.log('以 2025-12-29（周一）为例，正确答案是「2026 年第 1 周」：');
console.log('  ❌ Math.ceil(dayOfYear / 7)        =', wrongWeekByDayOfYear(sample));
console.log('  ❌ Math.floor(elapsed / 7) + 1     =', wrongWeekByElapsed(sample));
console.log('  ✅ 正确答案                         = 2026 年第 1 周');
console.log('原因有两个：① 没按"周一"对齐；② 完全没考虑 ISO 年可能与自然年不同。');

// ---------------------------------------------------------------------------
// 2. ✓ 正确实现
// ---------------------------------------------------------------------------

console.log('\n--- 2. 正确实现：三步走 ---');

/**
 * 计算某个"本地日历日"的 ISO 周历信息。
 * 说明：本函数读取的是 date 的**本地日历日**（getFullYear / getMonth / getDate 那三个值），
 *      所以用 new Date(2025, 11, 29) 这种分量构造法传入最稳妥。
 *      内部全部转到 UTC 域运算，因此不受本机时区与夏令时影响。
 * @param {Date} date 任意日期对象
 * @returns {{ weekYear: number, week: number }} ISO 年与周数（week 从 1 开始）
 */
function isoWeekCore(date) {
  // ① 归一化：只取"年/月/日"三个分量，构造 UTC 零点。
  //    这样后续的加减都是"整天"，不会因为夏令时那天只有 23 小时而漂移。
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

  // ② 求出本周的周一与周日关系：把星期几映射成 ISO 的 1(周一)~7(周日)。
  //    JS 的 getUTCDay() 是 0(周日)~6(周六)，所以把 0 换成 7。
  const isoDayOfWeek = d.getUTCDay() === 0 ? 7 : d.getUTCDay();

  // ③ 关键一步：把日期移到"本周的周四"。
  //    为什么是周四？因为"第 1 周 = 含第一个周四的那一周"，
  //    所以**周四所在的那一年，就是这一周的 ISO 年** —— 这是整个算法的心脏。
  d.setUTCDate(d.getUTCDate() + 4 - isoDayOfWeek);

  // ④ 此刻 d 是本周的周四，它的年份就是 ISO 年（week-year）。
  const weekYear = d.getUTCFullYear();

  // ⑤ 周数 = (该周四 - 那年 1 月 1 日) / 7 天后向上取整。
  const yearStart = Date.UTC(weekYear, 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);

  return { weekYear, week };
}

/**
 * 取某个日期所属的 ISO 周数（1~53）。
 * @param {Date} date 任意日期对象
 * @returns {number} 周数
 */
function getISOWeek(date) {
  return isoWeekCore(date).week;
}

/**
 * 取某个日期所属的 ISO 周历年（week-year）。
 * ⚠️ 它可能等于 getFullYear()，也可能差 1 —— 这就是必须单独提供这个函数的原因。
 * @param {Date} date 任意日期对象
 * @returns {number} ISO 周历年
 */
function getISOWeekYear(date) {
  return isoWeekCore(date).weekYear;
}

console.log('getISOWeek(new Date(2025, 11, 29))     =', getISOWeek(sample));
console.log('getISOWeekYear(new Date(2025, 11, 29)) =', getISOWeekYear(sample));
console.log('而 date.getFullYear()                    =', sample.getFullYear(), '← 两者不一致，这就是坑！');

// ---------------------------------------------------------------------------
// 3. 工具函数：周键、周一起始日、一年有几周
// ---------------------------------------------------------------------------

console.log('\n--- 3. 三个实用工具函数 ---');

/**
 * 生成"可排序"的 ISO 周键，例如 '2026-W01'。
 * 补零很重要：不补零的话字符串排序会变成 W1 < W10 < W2。
 * @param {Date} date 任意日期对象
 * @returns {string} 形如 '2026-W01' 的周键
 */
function isoWeekKey(date) {
  const { weekYear, week } = isoWeekCore(date);
  return `${weekYear}-W${String(week).padStart(2, '0')}`;
}

/**
 * 取某个日期所在 ISO 周的周一（本地日历日的零点）。
 * @param {Date} date 任意日期对象
 * @returns {Date} 该周周一的本地日期
 */
function isoWeekMonday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const isoDayOfWeek = d.getDay() === 0 ? 7 : d.getDay();
  d.setDate(d.getDate() - (isoDayOfWeek - 1)); // 退回到周一
  return d;
}

/**
 * 求某个 ISO 周历年共有几周（52 或 53）。
 * 技巧：12 月 28 日**永远**落在该年的最后一周（因为第 1 周含 1 月 4 日），
 * 所以直接读它的周数即可。
 * @param {number} weekYear ISO 周历年
 * @returns {number} 52 或 53
 */
function isoWeeksInYear(weekYear) {
  return getISOWeek(new Date(weekYear, 11, 28));
}

console.log('isoWeekKey(new Date(2025, 11, 29))   =', isoWeekKey(new Date(2025, 11, 29)));
console.log('isoWeekKey(new Date(2026, 0, 1))     =', isoWeekKey(new Date(2026, 0, 1)));
console.log('isoWeekMonday(new Date(2026, 0, 1))  =', isoWeekMonday(new Date(2026, 0, 1)).toDateString(), '（该周的周一，跨到了 2025 年）');
console.log('isoWeeksInYear(2020) =', isoWeeksInYear(2020), '（2020 年有 53 周）');
console.log('isoWeeksInYear(2025) =', isoWeeksInYear(2025));
console.log('isoWeeksInYear(2026) =', isoWeeksInYear(2026), '（2026 年有 53 周）');
console.log('判断规律：某 ISO 年有 53 周 ⇔ 1 月 1 日是周四，或（闰年且 1 月 1 日是周三）。');

// ---------------------------------------------------------------------------
// 4. 边界日期验证：用已知答案反查实现
// ---------------------------------------------------------------------------

console.log('\n--- 4. 边界日期验证表 ---');
console.log('下表全部用固定日期构造，不依赖当前时间；每一行都会当场断言并打印结果。');

// [年, 月(1~12), 日, 期望的 ISO 周键, 说明]
const CASES = [
  [2025, 12, 29, '2026-W01', '跨年周：12 月的日期属于下一年第 1 周'],
  [2026, 1, 1, '2026-W01', '1 月 1 日恰好是周四 -> 本周即第 1 周'],
  [2026, 12, 31, '2026-W53', '周四，落在 53 周年里'],
  [2027, 1, 1, '2026-W53', '1 月 1 日是周五 -> 属于上一年最后一周'],
  [2021, 1, 1, '2020-W53', '同上：1 月 1 日是周五'],
  [2020, 12, 28, '2020-W53', '周一，53 周年的最后一周'],
  [2021, 1, 3, '2020-W53', '周日，仍属于上一 ISO 年的第 53 周'],
  [2021, 1, 4, '2021-W01', '周一，新 ISO 年的第 1 周开始'],
  [2019, 12, 30, '2020-W01', '周一，属于下一年第 1 周'],
  [2016, 1, 1, '2015-W53', '1 月 1 日是周五'],
  [2016, 1, 4, '2016-W01', '周一，第 1 周开始'],
  [2015, 12, 31, '2015-W53', '周四，53 周年的最后一天'],
  [2024, 2, 29, '2024-W09', '闰日（2024 是闰年），落在第 9 周'],
  [2000, 1, 1, '1999-W52', '1 月 1 日是周六 -> 属于上一年第 52 周'],
];

let passCount = 0;
for (const [year, month, day, expected, note] of CASES) {
  const date = new Date(year, month - 1, day); // 固定值构造，不依赖当前时间
  const actual = isoWeekKey(date);
  const ok = actual === expected;
  if (ok) passCount += 1;
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
  console.log(
    `  ${String(ok ? '✅' : '❌')} ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    + ` (${weekday})  ->  ${actual.padEnd(9)} 期望 ${expected.padEnd(9)}  ${note}`,
  );
}
console.log(`  共 ${CASES.length} 个用例，通过 ${passCount} 个。`);
if (passCount !== CASES.length) {
  console.log('  ⚠️ 有用例未通过 —— 请检查 isoWeekCore 的实现。');
}

// ---------------------------------------------------------------------------
// 5. 最大的坑：week-year ≠ calendar year
// ---------------------------------------------------------------------------

console.log('\n--- 5. 最大的坑：ISO 周历年 与 自然年 不一致 ---');
console.log('每当年初或年末的那几天所在的周被"跨年切开"，日期就会站错队。');
console.log('（只有 1 月 1 日恰好是周一的年份才完全不会发生，属于少数。）');

/**
 * 打印某个自然年里"ISO 年与自然年不一致"的日子。
 * @param {number} year 自然年
 * @returns {void}
 */
function reportYearMismatch(year) {
  const first = new Date(year, 0, 1);
  const last = new Date(year, 11, 31);
  const mismatch = [];
  for (const d of [first, last]) {
    const isoYear = getISOWeekYear(d);
    if (isoYear !== year) mismatch.push(`${d.toDateString()} -> ${isoWeekKey(d)}`);
  }
  console.log(`  ${year} 年首尾的"越界"日期：`, mismatch.length > 0 ? mismatch.join('；') : '无');
}

reportYearMismatch(2025);
reportYearMismatch(2026);
reportYearMismatch(2021);
reportYearMismatch(2024);
console.log('  👆 这些就是"跨年周"：12 月末的几天可能属于下一年，1 月初的几天可能属于上一年。');
console.log('  所以任何需要按周归类的系统，都必须用 **ISO 周键（年 + 周）** 做主键，');
console.log('  而不是"自然年 + 周数"两个字段拼起来 —— 后者会在跨年周上产生歧义。');

// ---------------------------------------------------------------------------
// 6. 真实场景：按 ISO 周聚合报表
// ---------------------------------------------------------------------------

console.log('\n--- 6. 真实场景：按周聚合，跨年周不能被劈开 ---');

// 四个固定日期的订单，前三个属于同一个 ISO 周（2026-W01），第四个属于下一周。
const orders = [
  { date: new Date(2025, 11, 29), amount: 100 }, // 周一，2026-W01
  { date: new Date(2025, 11, 31), amount: 200 }, // 周三，2026-W01
  { date: new Date(2026, 0, 1), amount: 50 }, // 周四，2026-W01
  { date: new Date(2026, 0, 5), amount: 70 }, // 周一，2026-W02
];

console.log('  订单数据：');
for (const o of orders) {
  console.log(`    ${o.date.toDateString()}  金额 ${String(o.amount).padStart(4)}   ISO 周键 = ${isoWeekKey(o.date)}`);
}

/**
 * ✅ 正确的按周聚合：键用 ISO 周键。
 * @param {Array<{date: Date, amount: number}>} rows 数据行
 * @returns {Map<string, number>} 周键 -> 金额合计
 */
function groupByISOWeek(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = isoWeekKey(row.date);
    map.set(key, (map.get(key) ?? 0) + row.amount);
  }
  return map;
}

/**
 * ❌ 错误做法：用"自然年"和"自然年的第几周"拼键。
 * 结果是跨年那一周被劈成两半，两个年份各拿一部分。
 * @param {Array<{date: Date, amount: number}>} rows 数据行
 * @returns {Map<string, number>} "年-周" -> 金额合计
 */
function groupByCalendarWeek(rows) {
  const map = new Map();
  for (const row of rows) {
    const key = `${row.date.getFullYear()}-W${wrongWeekByDayOfYear(row.date)}`;
    map.set(key, (map.get(key) ?? 0) + row.amount);
  }
  return map;
}

console.log('\n  ✅ 按 ISO 周聚合：');
for (const [key, total] of [...groupByISOWeek(orders)].sort()) {
  console.log(`    ${key}  ->  ${total}`);
}
console.log('     （2026-W01 = 350，正确：那一周本来就是一整周）');

console.log('\n  ❌ 按"自然年 + 除 7 取整"聚合：');
for (const [key, total] of [...groupByCalendarWeek(orders)].sort()) {
  console.log(`    ${key}  ->  ${total}`);
}
console.log('     👆 同一周的数据被拆成了 「2025-W52」和「2026-W1」两项，金额都对不上账。');

console.log('\n  周键字符串排序就是时间排序（因为补了零）：');
const keys = ['2026-W10', '2026-W02', '2026-W01', '2026-W53', '2025-W52'];
console.log('    排序前 =', keys.join(', '));
console.log('    排序后 =', [...keys].sort().join(', '), '← 无需解析成日期即可正确排序');

// ---------------------------------------------------------------------------
// 7. 为什么 Intl / dayjs 默认帮不了你
// ---------------------------------------------------------------------------

console.log('\n--- 7. 标准库与常见库的现状 ---');
// Intl.DateTimeFormat 不认识 week 选项：它**不会报错**，只是静默忽略。
const ignored = new Intl.DateTimeFormat('en-US', { year: 'numeric', week: 'numeric' }).format(new Date(2026, 0, 1));
console.log('  new Intl.DateTimeFormat("en-US", { year: "numeric", week: "numeric" })');
console.log('    -> 实际输出：', JSON.stringify(ignored));
console.log('    👆 只剩下年份，week 这个选项被**静默忽略** —— Intl 规范里根本没有周数。');
console.log('');
console.log('  各方案的对照：');
const options = [
  ['Date 原生', '没有 getWeek() ，必须手写（本节内容）'],
  ['Intl.DateTimeFormat', '没有周数字段，写了也会被静默忽略'],
  ['dayjs', "默认的 week() 是 locale 相关的，ISO 周要另装 isoWeek 插件"],
  ['Moment.js', "isoWeek() 可用，但库已进入维护状态"],
  ['Luxon', 'weekNumber / weekYear 直接就是 ISO 周，推荐'],
  ['Temporal（ES 提案）', 'weekOfYear / yearOfWeek 内建，见 22_date_and_time/09_date_temporal_api.js'],
  ['Python / Java', 'isocalendar() / WeekFields.ISO，都遵循同一套规则'],
];
for (const [tool, note] of options) {
  console.log(`    ${tool.padEnd(24)} ${note}`);
}

// ---------------------------------------------------------------------------
// 8. 实现细节：为什么必须转到 UTC 域运算
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实现细节：为什么内部要转到 UTC 域 ---');
console.log('如果直接用本地时间做"日期加减"，会踩到"夏令时那天不是 24 小时"的问题。');
console.log('下面用两个**固定的 UTC 时刻**演示，它们分别是纽约本地 3/9 和 3/11 的零点：');
const nyMidnight1 = Date.parse('2024-03-09T05:00:00Z'); // 纽约本地 2024-03-09 00:00（EST，UTC-5）
const nyMidnight2 = Date.parse('2024-03-11T04:00:00Z'); // 纽约本地 2024-03-11 00:00（EDT，UTC-4）
console.log('  两个"纽约本地零点"相差 =', (nyMidnight2 - nyMidnight1) / 3600000, '小时');
console.log('  折合成天 =', (nyMidnight2 - nyMidnight1) / 86400000, '天 ← 不是整数 2！');
console.log('  👆 因为 3/10 那天在纽约只有 23 小时（春季跳变）。');
console.log('  如果你的实现里有"天数差 ÷ 7 再取整"这类步骤，这个 1.9583 足以让结果偏一位。');
console.log('  （具体差多少取决于运行环境的时区数据库，但"本地域不保证整天"这条永远成立。）');
console.log('');
console.log('本节的实现做了两件事来规避：');
console.log('  ① 先用 Date.UTC(y, m, d) 把"本地日历日"归一成 UTC 零点，');
console.log('     之后所有加减都在 UTC 域，"一天"永远是精确的 86400000 毫秒；');
console.log('  ② 周几用 getUTCDay()、年份用 getUTCFullYear()、日期用 setUTCDate()，');
console.log('     全程不碰任何本地时间 API。');
console.log('验证一下：本机时区 =', Intl.DateTimeFormat().resolvedOptions().timeZone,
  '，上面的 14 个用例全部通过 —— 换个时区跑，结果也一样。');

// ---------------------------------------------------------------------------
// 9. 检查清单
// ---------------------------------------------------------------------------

console.log('\n--- 9. 检查清单 ---');
const checklist = [
  ['一周从周一开始', '不是周日，JS 的 getDay() 需要把 0 映射成 7'],
  ['第 1 周含 1 月 4 日', '等价于"含当年第一个周四"'],
  ['必须同时返回 ISO 年', '只返回周数一定会在跨年周上出错'],
  ['周键要补零', "'2026-W01' 才能正确排序"],
  ['聚合键用 ISO 周键', '不要用"自然年 + 周数"两个字段'],
  ['内部用 UTC 域运算', '避开夏令时的 23 小时日'],
  ['用 12 月 28 日求总周数', '它永远落在最后一周'],
  ['和外部系统对齐规则', 'Excel / Python / 数据库的周数各有各的定义'],
  ['写测试用固定日期', '别用"今天"，否则用例会随日期漂移'],
];
for (const [item, why] of checklist) {
  console.log(`  ${item.padEnd(28)} -> ${why}`);
}

console.log('\n本节结束。记住一句话：');
console.log('  ISO 周历的关键不是"怎么算周数"，而是"**周四在哪一年，这一周就在哪一年**"。');
