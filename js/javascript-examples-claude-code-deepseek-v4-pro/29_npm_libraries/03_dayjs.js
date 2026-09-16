/**
 * ============================================================================
 * 知识点：dayjs —— 解析、格式化、加减、比较、插件（relativeTime），与原生 Date 对比
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】入门
 * 【前置知识】原生 Date 的基本概念（构造函数、getTime、时间戳）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    dayjs 是一个"极简版 Moment.js"。Moment.js 曾经是日期处理的事实标准，
 *    但它体积大（约 70KB gzip）、对象可变（容易出 bug）、已被官方宣布停止开发。
 *    dayjs 用 2KB 的体积提供了几乎相同的 API，且对象**不可变**（每次操作返回新对象）。
 *
 *    核心概念：
 *      - dayjs 对象是不可变的："值对象"语义，add/subtract 都返回新对象；
 *      - 所有能力通过插件扩展：核心只有解析/格式化/加减/比较，
 *        相对时间、UTC、时区、自定义解析格式等都按需引入；
 *      - .format() 用 token 占位符（YYYY-MM-DD 等），与 Moment 完全一致。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    原生 Date 有三类让人抓狂的问题，这正是 dayjs 存在的理由：
 *      (a) 格式化要手写：`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`
 *          还得自己补零；dayjs 一句 .format('YYYY-MM-DD') 搞定。
 *      (b) 月份从 0 开始：getMonth() 返回 0~11，是无数 off-by-one bug 的源头。
 *      (c) 加减日期要手动处理进位：跨月、跨年、闰年、夏令时全靠自己算；
 *          用 `new Date(d.getTime() + 30*24*3600*1000)` 加"一个月"会在跨月时出错。
 *    真实场景：订单列表显示"3 小时前"、报表按周/月聚合、表单日期选择器、
 *    接口时间戳转本地展示、定时任务的下次执行时间计算。
 *
 * 3. 核心语法要点
 *    import dayjs from 'dayjs';
 *    import relativeTime from 'dayjs/plugin/relativeTime.js';   // 注意 .js 后缀！
 *    dayjs.extend(relativeTime);                                 // 注册插件
 *    dayjs()                        当前时间
 *    dayjs('2026-09-16')            解析字符串（ISO 8601）
 *    dayjs(1757980800000)           解析毫秒时间戳
 *    dayjs(new Date())              解析原生 Date
 *    .format('YYYY-MM-DD HH:mm:ss') 格式化
 *    .add(7, 'day') / .subtract(1, 'month')   加减（返回新对象）
 *    .startOf('month') / .endOf('day')        取边界
 *    .diff(other, 'day')                      差值
 *    .isBefore(x) / .isAfter(x) / .isSame(x)  比较
 *    .unix() / .valueOf() / .toDate()         与原生互转
 *    .fromNow() / .from(x) / .toNow()         相对时间（需 relativeTime 插件）
 *    .isValid()                               解析失败时返回 false（不会抛错！）
 *    .clone()                                 显式复制（因为本来不可变，用得少）
 *
 * 4. 常见陷阱
 *    - 插件路径必须写全 .js 后缀（dayjs 是 CJS 包，ESM 里不能省略扩展名）：
 *      import relativeTime from 'dayjs/plugin/relativeTime' ❌
 *      import relativeTime from 'dayjs/plugin/relativeTime.js' ✅
 *    - dayjs 对象不可变：`d.add(1,'day')` 不会改变 d，必须接收返回值。
 *      这与原生 Date 的 setDate() 就地修改正好相反，从 Date 迁移时最容易错。
 *    - 解析失败不抛错：dayjs('乱七八糟') 是一个"Invalid Date"对象，
 *      后续 format() 会输出 'Invalid Date' 而不会报错。必须显式 .isValid() 校验。
 *    - 不引入插件就没有能力：不 extend(relativeTime) 时调用 .fromNow() 会直接抛错。
 *    - 'YYYY' 与 'yyyy' 的区别：dayjs **不区分大小写**（与 Moment 不同），
 *      YYYY 和 yyyy 都是年份；但 'MM'（月）与 'mm'（分）、'DD'（日）与 'dd'（星期几）
 *      的语义完全不同，务必按约定写大写。
 *    - 时区问题：dayjs 默认使用系统本地时区。跨时区展示必须引入 utc + timezone 插件。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/03_dayjs.js
 *   （注意：输出中的"相对时间"会随当前时间变化，这是预期行为）
 *
 * 【预期输出】
 *   逐节演示解析、格式化、加减、边界、比较、插件与原生 Date 的对比。退出码 0。
 * ============================================================================
 */

import dayjs from 'dayjs';

// 插件必须写完整的 .js 后缀。原因是 dayjs 发布的是 CommonJS 包，
// Node 的 ESM 解析器不会像打包工具那样自动补全扩展名。
import relativeTime from 'dayjs/plugin/relativeTime.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import duration from 'dayjs/plugin/duration.js';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';

// 语言包同样是"按需引入"的独立模块。不引入中文包时，
// relativeTime 插件会输出英文（"3 days ago"）而不是中文（"3 天前"）。
import 'dayjs/locale/zh-cn.js';

import assert from 'node:assert/strict';

// 注册插件：必须在调用对应能力之前执行。可以一次 extend 多个。
dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(weekOfYear);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(duration);
dayjs.extend(dayOfYear);

// 切换全局语言为简体中文。这一步必须在 extend(relativeTime) 之后、调用 fromNow() 之前。
// 也可以单次调用时指定：dayjs(x).locale('zh-cn').fromNow()
dayjs.locale('zh-cn');

console.log('--- 0. 环境信息 ---');
console.log(`dayjs 版本：${dayjs.version}`);
console.log(`当前语言：${dayjs.locale()}（已加载 dayjs/locale/zh-cn.js 并切换）`);
console.log('提示：本文件所有"当前时间"相关输出都会随运行时间变化，这是预期行为。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 1. 创建 dayjs 对象：五种来源 ---');

// 用一个固定的基准时间，保证示例输出稳定可读
const FIXED = '2026-09-16 14:30:45';

console.log(`  从字符串解析：dayjs('${FIXED}') -> ${dayjs(FIXED).format('YYYY-MM-DD HH:mm:ss')}`);
console.log(`  从 ISO 8601 解析（带时区）：dayjs('2026-09-16T14:30:45+08:00') -> ${dayjs('2026-09-16T14:30:45+08:00').toISOString()}`);
console.log(`  从毫秒时间戳解析：dayjs(1758000000000) -> ${dayjs(1758000000000).format('YYYY-MM-DD HH:mm:ss')}`);
console.log(`  从原生 Date 解析：${dayjs(new Date(2026, 8, 16)).format('YYYY-MM-DD')}（注意月份传 8 表示 9 月）`);
console.log(`  不传参数 = 当前时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);

// 解析失败不会抛错 —— 这是必须知道的陷阱
const invalid = dayjs('这不是一个日期');
console.log('');
console.log(`  陷阱：dayjs('这不是一个日期') -> isValid() = ${invalid.isValid()}`);
console.log(`  format() 输出 "${invalid.format('YYYY-MM-DD')}" 而不是抛错，容易被忽略到线上。`);
console.log(`  正确做法：if (!d.isValid()) 走兜底逻辑。`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 2. 格式化：token 占位符 ---');

const base = dayjs(FIXED);
// 最常用的格式
console.log(`  'YYYY-MM-DD'                 -> ${base.format('YYYY-MM-DD')}`);
console.log(`  'YYYY-MM-DD HH:mm:ss'        -> ${base.format('YYYY-MM-DD HH:mm:ss')}`);
console.log(`  'YYYY/MM/DD HH:mm'           -> ${base.format('YYYY/MM/DD HH:mm')}`);
// 带中文（需要给非 token 的字符加方括号 [ ] 转义）
console.log(`  'YYYY年MM月DD日'              -> ${base.format('YYYY年MM月DD日')}`);
console.log(`  '[今天是]YYYY年第DDD天'        -> ${base.format('[今天是]YYYY年第DDD天')}`);
// 常用 token 全览
console.log(`  YYYY=年 MM=月(补零) M=月 DD=日(补零) D=日`);
console.log(`    ${base.format('YYYY')} / ${base.format('MM')} / ${base.format('M')} / ${base.format('DD')} / ${base.format('D')}`);
console.log(`  HH=24小时制(补零) H=24小时制 hh=12小时制 A=AM/PM`);
console.log(`    ${base.format('HH')} / ${base.format('H')} / ${base.format('hh')} / ${base.format('A')}`);
console.log(`  mm=分 ss=秒 SSS=毫秒`);
console.log(`    ${base.format('mm')} / ${base.format('ss')} / ${base.format('SSS')}`);
console.log(`  ddd=星期缩写 dddd=星期全称（英文，中文需加载 locale 包）`);
console.log(`    ${base.format('ddd')} / ${base.format('dddd')}`);
console.log(`  MMM=月份缩写 MMMM=月份全称`);
console.log(`    ${base.format('MMM')} / ${base.format('MMMM')}`);
console.log(`  X=秒级时间戳 x=毫秒时间戳`);
console.log(`    ${base.format('X')} / ${base.format('x')}`);
console.log(`  DDD=一年中的第几天 do=序数日`);
console.log(`    ${base.format('DDD')} / ${base.format('do')}`);
// 转义：[文字] 里的内容原样输出
console.log(`  转义方括号：${base.format('[订单创建于]YYYY-MM-DD [at] HH:mm')}`);
console.log('');

// 与原生 Date 的格式化对比
console.log('  与原生 Date 对比 —— 格式化一个 YYYY-MM-DD HH:mm:ss：');
const nativeDate = new Date(2026, 8, 16, 14, 30, 45);
/** 原生手写格式化：注意 getMonth() 要 +1，每一项都要 padStart */
const pad = (n) => String(n).padStart(2, '0');
const nativeFormatted = `${nativeDate.getFullYear()}-${pad(nativeDate.getMonth() + 1)}-${pad(nativeDate.getDate())} ${pad(nativeDate.getHours())}:${pad(nativeDate.getMinutes())}:${pad(nativeDate.getSeconds())}`;
console.log(`    原生（7 行代码）：${nativeFormatted}`);
console.log(`    dayjs（1 行）：   ${dayjs(nativeDate).format('YYYY-MM-DD HH:mm:ss')}`);
console.log('    注意 getMonth() 从 0 开始 —— 这是原生 Date 最著名的坑。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 3. 不可变性：加减操作返回新对象 ---');

const original = dayjs(FIXED);

// 关键：add / subtract / startOf 都返回**新对象**，original 永远不变
const nextWeek = original.add(7, 'day');
const lastMonth = original.subtract(1, 'month');
const startOfMonth = original.startOf('month');

console.log(`  原始值 original           = ${original.format('YYYY-MM-DD HH:mm:ss')}`);
console.log(`  original.add(7, 'day')    = ${nextWeek.format('YYYY-MM-DD HH:mm:ss')}`);
console.log(`  original.subtract(1,'month') = ${lastMonth.format('YYYY-MM-DD HH:mm:ss')}`);
console.log(`  original.startOf('month') = ${startOfMonth.format('YYYY-MM-DD HH:mm:ss')}`);
console.log(`  操作之后 original 仍然是  = ${original.format('YYYY-MM-DD HH:mm:ss')}  <- 不可变！`);

// 对比原生 Date 的可变语义
const nativeMutable = new Date(2026, 8, 16);
const returned = nativeMutable.setDate(nativeMutable.getDate() + 7);
console.log('');
console.log('  对比原生 Date 的可变语义：');
console.log(`    const d = new Date(2026, 8, 16); d.setDate(d.getDate() + 7);`);
console.log(`    之后 d 变成了 ${dayjs(nativeMutable).format('YYYY-MM-DD')}（原对象被就地修改了！）`);
console.log(`    而 setDate() 的返回值是时间戳数字：${returned}，不是 Date 对象 —— 双重反直觉。`);

// 各种单位与常见加减
console.log('');
console.log('  各单位的加减（基于 2026-09-16 14:30:45）：');
const units = [
  ['day', 7],
  ['week', 2],
  ['month', 3],
  ['year', 1],
  ['hour', 6],
  ['minute', 30],
  ['second', 90],
];
for (const [unit, amount] of units) {
  console.log(`    add(${String(amount).padStart(2)}, '${unit}')`.padEnd(30) + `-> ${original.add(amount, unit).format('YYYY-MM-DD HH:mm:ss')}`);
}

// 跨月加法的正确性（原生写法最常出错的地方）
console.log('');
console.log('  跨月加法：1 月 31 日 + 1 个月');
const jan31 = dayjs('2026-01-31');
console.log(`    dayjs('2026-01-31').add(1, 'month') -> ${jan31.add(1, 'month').format('YYYY-MM-DD')}（自动钳制到 2 月最后一天）`);
/** 原生写法：给时间戳加固定毫秒数，跨月一定会错 */
const naiveAddMonth = new Date(new Date(2026, 0, 31).getTime() + 30 * 24 * 3600 * 1000);
console.log(`    原生 new Date(ts + 30*24*3600*1000) -> ${dayjs(naiveAddMonth).format('YYYY-MM-DD')}（"一个月"被当成 30 天，结果错了）`);

// 闰年
console.log('');
console.log('  闰年处理：2024-02-29 加一年');
console.log(`    dayjs('2024-02-29').add(1, 'year') -> ${dayjs('2024-02-29').add(1, 'year').format('YYYY-MM-DD')}（自动钳制到 2 月 28 日）`);
console.log(`    2024 是闰年吗？dayjs('2024-02-29').isValid() = ${dayjs('2024-02-29').isValid()}`);
console.log(`    2026 年的 2 月有几天？dayjs('2026-02-01').daysInMonth() = ${dayjs('2026-02-01').daysInMonth()}`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 4. 边界：startOf / endOf ---');

const t = dayjs('2026-09-16 14:30:45');
const boundaries = ['year', 'month', 'week', 'day', 'hour', 'minute'];
console.log('  单位'.padEnd(10) + 'startOf'.padEnd(26) + 'endOf');
console.log('  ' + '-'.repeat(62));
for (const unit of boundaries) {
  console.log(`  ${unit.padEnd(8)}${t.startOf(unit).format('YYYY-MM-DD HH:mm:ss.SSS').padEnd(26)}${t.endOf(unit).format('YYYY-MM-DD HH:mm:ss.SSS')}`);
}
console.log('');
console.log('  真实用途示例：');
console.log(`    本月第一天：${t.startOf('month').format('YYYY-MM-DD')}`);
console.log(`    本月最后一天：${t.endOf('month').format('YYYY-MM-DD')}`);
console.log(`    本周周一：${t.startOf('week').format('YYYY-MM-DD')}（dayjs 默认周日为一周第一天）`);
console.log(`    今年第几周：${t.week()} 周`);
console.log(`    今天是一年中第 ${t.dayOfYear()} 天`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 5. 比较与差值 ---');

const a = dayjs('2026-09-16');
const b = dayjs('2026-12-25');

console.log(`  a = ${a.format('YYYY-MM-DD')}，b = ${b.format('YYYY-MM-DD')}`);
console.log(`  a.isBefore(b) = ${a.isBefore(b)}`);
console.log(`  a.isAfter(b)  = ${a.isAfter(b)}`);
console.log(`  a.isSame(b)   = ${a.isSame(b)}`);
console.log(`  a.isSame('2026-09-16') = ${a.isSame('2026-09-16')}（可以直接和字符串比较）`);
// 精度参数：不传精度时，isSame 会比较到毫秒
console.log(`  a.isSame(b, 'year') = ${a.isSame(b, 'year')}（同一年，忽略月日）`);
console.log(`  a.isSame(b, 'month') = ${a.isSame(b, 'month')}`);

// 插件提供的"大于等于/小于等于"
console.log(`  isSameOrBefore（插件）a.isSameOrBefore(a) = ${a.isSameOrBefore(a)}`);
console.log(`  isSameOrAfter（插件） b.isSameOrAfter(a)  = ${b.isSameOrAfter(a)}`);

// diff：差值，第三个参数控制是否返回小数
console.log('');
console.log('  diff 差值（a 到 b）：');
console.log(`    diff(b, 'day')     = ${a.diff(b, 'day')}（默认向下取整）`);
console.log(`    diff(b, 'month')   = ${a.diff(b, 'month')}`);
console.log(`    diff(b, 'day', true) = ${a.diff(b, 'day', true).toFixed(4)}（第三参数 true 返回小数）`);
console.log(`    b.diff(a, 'hour')  = ${b.diff(a, 'hour')}`);

// 真实场景：计算两个日期之间的"年月日"差（例如工龄、账期）
const start = dayjs('2024-03-15');
const end = dayjs('2026-09-16');
const dur = dayjs.duration(end.diff(start));
console.log('');
console.log('  真实场景：算 2024-03-15 到 2026-09-16 的时长（duration 插件）');
console.log(`    总天数：${end.diff(start, 'day')} 天`);
console.log(`    换算成年月日：${dur.years()} 年 ${dur.months()} 个月 ${dur.days()} 天`);
console.log(`    人类可读：${dur.humanize()}`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 6. relativeTime 插件：把时间变成"多久以前" ---');

const now = dayjs();
console.log(`  当前时间：${now.format('YYYY-MM-DD HH:mm:ss')}`);
console.log('');
console.log('  时间点'.padEnd(28) + 'fromNow()');
console.log('  ' + '-'.repeat(56));
const relativeSamples = [
  ['刚刚', now.subtract(3, 'second')],
  ['几秒前', now.subtract(20, 'second')],
  ['1 分钟前', now.subtract(1, 'minute')],
  ['44 分钟前', now.subtract(44, 'minute')],
  ['1 小时前', now.subtract(1, 'hour')],
  ['23 小时前', now.subtract(23, 'hour')],
  ['1 天前', now.subtract(1, 'day')],
  ['6 天前', now.subtract(6, 'day')],
  ['1 个月前', now.subtract(1, 'month')],
  ['11 个月前', now.subtract(11, 'month')],
  ['1 年前', now.subtract(1, 'year')],
  ['5 年后（未来，显示为"内"）', now.add(5, 'year')],
];
for (const [label, time] of relativeSamples) {
  console.log(`  ${label.padEnd(26)}${time.fromNow()}`);
}
console.log('');
console.log('  观察两处"看似不准"的地方，它们都是 dayjs 的阈值规则，不是 bug：');
console.log('    - 23 小时前 显示为 "1 天前"：因为 dayjs 内部会先换算成天数再四舍五入（23h ≈ 0.96d -> 1d）；');
console.log('    - 11 个月前 显示为 "1 年前"：同理，11 个月已经接近 1 年，被归入"年"这一档。');
console.log('    需要精确到具体单位时，不要用 fromNow()，而是自己 diff 后格式化。');
console.log('');
console.log('  这是社交/订单/消息列表里最常见的展示方式 —— ');
console.log('  比"2026-09-16 14:30:45"对用户友好得多（用户关心的是"多久以前"而不是绝对时刻）。');
console.log('');
console.log('  from(x)：两个时间之间的相对描述（不带"前/后"的自动判断）');
console.log(`    3 天前的时间.from(now) = ${now.subtract(3, 'day').from(now)}`);
console.log('  toNow()：与 fromNow 相反的方向');
console.log(`    now.add(2, 'hour').toNow() = ${now.add(2, 'hour').toNow()}`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 7. customParseFormat 插件：解析非标准格式 ---');

// 原生/核心的 dayjs 只能可靠解析 ISO 8601。像 "16/09/2026" 这种
// 必须用 customParseFormat 明确告诉它格式，否则解析结果可能完全不同。
const ambiguous = '16/09/2026';
console.log(`  不加插件解析 '${ambiguous}'：${dayjs(ambiguous).isValid() ? dayjs(ambiguous).format('YYYY-MM-DD') : 'Invalid Date'}（不可靠）`);
const parsed = dayjs(ambiguous, 'DD/MM/YYYY');
console.log(`  用 customParseFormat 指定 'DD/MM/YYYY'：${parsed.format('YYYY-MM-DD')}`);

// 另一个高频场景：解析接口返回的 "20260916" 这种紧凑格式
console.log(`  紧凑格式：dayjs('20260916', 'YYYYMMDD') -> ${dayjs('20260916', 'YYYYMMDD').format('YYYY-MM-DD')}`);
// 带中文的格式
console.log(`  中文格式：dayjs('2026年09月16日', 'YYYY年MM月DD日') -> ${dayjs('2026年09月16日', 'YYYY年MM月DD日').format('YYYY-MM-DD')}`);
// 非标准但常见的分隔符
console.log(`  点分隔：dayjs('2026.09.16', 'YYYY.MM.DD') -> ${dayjs('2026.09.16', 'YYYY.MM.DD').format('YYYY-MM-DD')}`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 8. 与原生 Date / Intl 的互操作与分工 ---');

const d = dayjs('2026-09-16 14:30:45');

// dayjs -> 原生
console.log(`  dayjs -> Date：d.toDate() instanceof Date = ${d.toDate() instanceof Date}`);
console.log(`  dayjs -> ISO 字符串：d.toISOString() = ${d.toISOString()}`);
console.log(`  dayjs -> 毫秒时间戳：d.valueOf() = ${d.valueOf()}`);
console.log(`  dayjs -> 秒时间戳：d.unix() = ${d.unix()}（Unix 时间戳以秒为单位，后端常用）`);
console.log(`  dayjs -> JSON：JSON.stringify({ t: d }) = ${JSON.stringify({ t: d })}（toJSON 自动转 ISO）`);

// 原生 -> dayjs
console.log(`  Date -> dayjs：dayjs(new Date()).format() = ${dayjs(new Date(2026, 8, 16)).format('YYYY-MM-DD')}`);

// 哪些场景原生更好
console.log('');
console.log('  分工建议：');
console.log(`    - 本地化显示（"2026年9月16日 星期三"）：原生 Intl 更好，无需加载 locale 包`);
console.log(`      Intl.DateTimeFormat('zh-CN', {dateStyle:'full'}).format(d.toDate())`);
console.log(`      -> ${new Intl.DateTimeFormat('zh-CN', { dateStyle: 'full' }).format(d.toDate())}`);
console.log(`    - 相对时间（"3 小时前"）：原生 Intl.RelativeTimeFormat 也可以，但需要自己算差值单位；`);
console.log(`      Intl.RelativeTimeFormat('zh-CN').format(-3, 'hour') -> ${new Intl.RelativeTimeFormat('zh-CN').format(-3, 'hour')}`);
console.log('    - 复杂链式操作（解析 + 加减 + 边界 + 比较）：dayjs 明显更省心；');
console.log('    - 时区处理：dayjs 需要 utc + timezone 插件，或直接用原生 Intl + Temporal（未来标准）。');

// 用 Intl 展示原生能做到什么
console.log('');
console.log('  原生 Intl 的本地化能力（dayjs 需要额外加载 locale 文件才能做到）：');
const nativeD = d.toDate();
console.log(`    日期：${new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(nativeD)}`);
console.log(`    时间：${new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(nativeD)}`);
console.log(`    货币：${new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(1234.5)}`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 9. 真实项目场景串联：订单时间展示 ---');

/**
 * 把后端返回的订单对象转换成前端展示需要的字段。
 * 这是真实项目里最常见的一段"时间处理胶水代码"。
 * @param {{orderNo: string, createdAt: string, paidAt?: string}} order
 */
function formatOrderForDisplay(order) {
  const created = dayjs(order.createdAt);
  // 严格校验：解析失败时给出兜底展示，而不是把 "Invalid Date" 渲染到页面上
  if (!created.isValid()) {
    // 兜底返回必须和正常路径有相同的字段结构，否则调用方读 paidDuration 会拿到 undefined
    return { orderNo: order.orderNo, createdAtText: '时间未知', paidDuration: '未知', status: 'unknown' };
  }

  const now = dayjs();
  /** 一周内的订单显示相对时间，更久远的显示绝对日期 —— 社交产品通用的展示策略 */
  const createdAtText = now.diff(created, 'day') < 7
    ? created.fromNow()
    : created.format('YYYY-MM-DD HH:mm');

  const paidDuration = order.paidAt
    ? `${dayjs(order.paidAt).diff(created, 'minute')} 分钟`
    : '未支付';

  return { orderNo: order.orderNo, createdAtText, paidDuration, status: 'ok' };
}

const orders = [
  { orderNo: 'A001', createdAt: now.subtract(30, 'minute').toISOString(), paidAt: now.subtract(28, 'minute').toISOString() },
  { orderNo: 'A002', createdAt: now.subtract(3, 'day').toISOString() },
  { orderNo: 'A003', createdAt: now.subtract(40, 'day').toISOString(), paidAt: now.subtract(40, 'day').add(5, 'minute').toISOString() },
  { orderNo: 'A004', createdAt: '不是时间' },
];

for (const order of orders) {
  const display = formatOrderForDisplay(order);
  console.log(`  ${display.orderNo}  展示时间：${display.createdAtText.padEnd(16)} 支付耗时：${display.paidDuration}`);
}
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 10. 体积与选型 ---');
console.log('  dayjs 核心：约 2KB gzip（Moment.js 约 70KB，相差 30 倍以上）；');
console.log('  每个插件约 0.5~1KB，按需引入；');
console.log('  替代方案：');
console.log('    - 原生 Intl / Temporal（Temporal 是正在标准化的新日期 API，见 03/04 目录的日期示例）');
console.log('    - date-fns（函数式，tree-shaking 友好，但 API 更冗长）');
console.log('    - luxon（时区支持最好，体积约 20KB）');
console.log('  选择建议：只是格式化 + 简单加减 -> dayjs；重时区/国际化 -> luxon 或 Intl。');

// ---------------------------------------------------------------------------
// 自测断言
// ---------------------------------------------------------------------------
console.log('');
console.log('--- 11. 自测断言 ---');

assert.strictEqual(base.format('YYYY-MM-DD HH:mm:ss'), FIXED);
assert.strictEqual(original.format('YYYY-MM-DD HH:mm:ss'), FIXED, 'dayjs 对象必须不可变');
assert.strictEqual(original.add(1, 'day').format('YYYY-MM-DD'), '2026-09-17');
assert.strictEqual(dayjs('2026-01-31').add(1, 'month').format('YYYY-MM-DD'), '2026-02-28');
assert.strictEqual(dayjs('2024-02-29').add(1, 'year').format('YYYY-MM-DD'), '2025-02-28');
assert.strictEqual(dayjs('2026-02-01').daysInMonth(), 28);
assert.strictEqual(dayjs(FIXED).startOf('month').format('YYYY-MM-DD HH:mm:ss'), '2026-09-01 00:00:00');
assert.strictEqual(dayjs(FIXED).endOf('day').format('YYYY-MM-DD HH:mm:ss.SSS'), '2026-09-16 23:59:59.999');
assert.strictEqual(a.diff(b, 'day'), -100);
assert.strictEqual(a.isBefore(b), true);
assert.strictEqual(a.isSame(b, 'year'), true);
assert.strictEqual(dayjs(ambiguous, 'DD/MM/YYYY').format('YYYY-MM-DD'), '2026-09-16');
assert.strictEqual(dayjs('20260916', 'YYYYMMDD').format('YYYY-MM-DD'), '2026-09-16');
assert.strictEqual(dayjs('垃圾输入').isValid(), false, '解析失败应当 isValid() === false');
assert.ok(dayjs(now.subtract(3, 'day')).fromNow().includes('天'), '相对时间应包含"天"');
assert.ok(d.unix() > 1_700_000_000 && d.unix() < 2_000_000_000, 'unix 时间戳应为秒级');
console.log('  全部断言通过。');
console.log('');
console.log('演示结束。');
