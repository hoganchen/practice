/**
 * ============================================================================
 * 知识点：日期读取与修改 —— get/set 全家桶与 getUTC* 系列
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】入门
 * 【前置知识】22_date_and_time/01_date_creation.js、02_timestamp.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Date 内部只存一个毫秒时间戳，但提供了两套"分量读写法"把它翻译成人类概念：
 *      get*() / set*()      —— 按**本机时区**解释
 *      getUTC*() / setUTC*() —— 按 **UTC** 解释
 *    这两套方法名一一对应，读出的数值只有在 UTC 时区下才相同。
 *
 * 2. 为什么需要
 *    格式化展示、按"天"做分组、把日期存进表单、判断是不是周末、取当年第几天……
 *    这些都需要把时间戳拆成"年、月、日"等分量来读写。
 *
 * 3. 核心语法要点
 *    (1) 读取方法全表：
 *        getFullYear()  四位年份（没有 getYear()，那个已废弃且返回 年份-1900）
 *        getMonth()     月份 **0~11**（0 = 一月）
 *        getDate()      日 **1~31**
 *        getDay()       星期 **0~6**（0 = 星期日，注意是"星期"不是"几号"）
 *        getHours()     0~23
 *        getMinutes()   0~59
 *        getSeconds()   0~59
 *        getMilliseconds() 0~999
 *        getTime()      毫秒时间戳
 *        getTimezoneOffset() 本机与 UTC 的分钟差（注意符号，见下）
 *    (2) 修改方法同名前缀改成 set，参数多出的部分不会影响到更高位
 *        （setDate 改日不会改月，即使越界也会自动进位）。
 *    (3) set* 会**就地修改**原对象并返回新的时间戳；Date 是可变对象。
 *    (4) getDay() 只读，没有 setDay()；要改星期几请用 setDate 做加减。
 *    (5) 本机时区相关的方法在同一台机器上自洽，但输出不能跨机器断言；
 *        因此本示例对"本地时间"用本地分量构造 + 本地分量读取（必定一致），
 *        对"需要确定性"的部分用 UTC 方法。
 *
 * 4. 常见陷阱
 *    (1) 把 getDay() 当成"几号"，把 getDate() 当成"星期几"——名字反直觉。
 *    (2) getMonth() 从 0 开始，展示时必须 +1。
 *    (3) setMonth(0) 会把"日"保留下来，1 月 31 日 setMonth(1) 会溢出到 3 月 2 日。
 *    (4) getTimezoneOffset() 的符号是反的：它返回 (UTC - 本地)，
 *        东八区得到 -480，西五区得到 +300。要得到"UTC 偏移"需取负号。
 *    (5) 误以为有 setUTC* 的全套：确实有 setUTCFullYear 等，但**没有**
 *        setUTCDay / setUTCTime（时间戳统一用 setTime / setUTCTime 不存在）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/03_date_getters_setters.js
 *
 * 【预期输出】
 *   分 6 个小节，演示全部 get 方法、星期与月份的取值规律、set 方法与自动进位、
 *   本地与 UTC 的差异、getTimezoneOffset 的符号陷阱。输出固定。
 * ============================================================================
 */

console.log('--- 1. get 全家桶：用一个固定时刻读全部字段 ---');

// 用带 Z 的 ISO 字符串构造，得到的是一个**确定的**时刻。
const d = new Date('2024-03-15T09:30:45.123Z');
console.log('原始时刻 =', d.toISOString());
// 注意：下面这一组 get*() 是"本机时区"版本，数值会随运行机器的时区变化；
// 真正跨机器稳定的是下一组的 getUTC*()。这里之所以保留，是为了让读者在
// 自己机器上直观看到"同一时刻、两套读法差了多少"。
console.log('getFullYear()     =', d.getFullYear(), '（本机时区下的年份）');
console.log('getMonth()        =', d.getMonth(), '（本机时区下的月份索引）');
console.log('getDate()         =', d.getDate(), '（本机时区下的日）');
console.log('getDay()          =', d.getDay(), '（本机时区下的星期索引）');
console.log('getHours()        =', d.getHours());
console.log('getMinutes()      =', d.getMinutes());
console.log('getSeconds()      =', d.getSeconds());
console.log('getMilliseconds() =', d.getMilliseconds());
console.log('getTime()         =', d.getTime(), '（时间戳，与时区无关）');
console.log('');
console.log('同一时刻的 UTC 分量（与机器时区无关，输出固定）：');
console.log('getUTCFullYear()     =', d.getUTCFullYear());
console.log('getUTCMonth()        =', d.getUTCMonth(), '（3 = 四月）');
console.log('getUTCDate()         =', d.getUTCDate());
console.log('getUTCDay()          =', d.getUTCDay(), '（5 = 星期五）');
console.log('getUTCHours()        =', d.getUTCHours());
console.log('getUTCMinutes()      =', d.getUTCMinutes());
console.log('getUTCSeconds()      =', d.getUTCSeconds());
console.log('getUTCMilliseconds() =', d.getUTCMilliseconds());
console.log('两个版本的时间戳当然一样：', d.getTime() === d.getTime());

console.log('\n--- 2. getDay()：0 是星期日；getMonth()：0 是一月 ---');

// 2024-03-15 是星期五。为避免本机时区把日期挪走，这里用本地分量构造。
const localFriday = new Date(2024, 2, 15); // 2 = 三月
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
console.log('new Date(2024, 2, 15).getDay() =', localFriday.getDay(), '-> 星期' + WEEKDAYS[localFriday.getDay()]);
// 用 getMonth() 当下标取月份名，是常见写法（因为索引 0 对应一月）。
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
console.log('getMonth() =', localFriday.getMonth(), '->', MONTHS[localFriday.getMonth()]);

// 连续观察一周，验证 getDay() 的循环规律。
const dayNames = [];
for (let i = 0; i < 7; i++) {
  const day = new Date(2024, 2, 10 + i); // 2024-03-10 是星期日
  dayNames.push(`${day.getDate()}日=周${WEEKDAYS[day.getDay()]}`);
}
console.log('2024-03-10 起连续七天：');
console.log('  ' + dayNames.join('  '));

console.log('\n--- 3. set 方法：就地修改，返回新时间戳 ---');

const mutable = new Date(2024, 0, 1, 0, 0, 0, 0); // 2024-01-01 本地零点
console.log('初始 =', mutable.getFullYear(), mutable.getMonth(), mutable.getDate(), mutable.getHours());

const returned = mutable.setFullYear(2025);
console.log('setFullYear(2025) 的返回值 =', returned, '（等于新的时间戳）');
console.log('原对象被就地改掉了 =', mutable.getFullYear(), '（Date 是可变对象）');
console.log('返回值 === mutable.getTime()：', returned === mutable.getTime());

// 链式：每个 set 都返回时间戳，但时间戳没有 set 方法，所以不能链式调用 set。
mutable.setMonth(5);
mutable.setDate(20);
mutable.setHours(13);
mutable.setMinutes(14);
mutable.setSeconds(15);
mutable.setMilliseconds(16);
console.log(
  '连续 set 之后 =',
  `${mutable.getFullYear()}-${String(mutable.getMonth() + 1).padStart(2, '0')}-${String(mutable.getDate()).padStart(2, '0')}`,
  `${String(mutable.getHours()).padStart(2, '0')}:${String(mutable.getMinutes()).padStart(2, '0')}:${String(mutable.getSeconds()).padStart(2, '0')}.${String(mutable.getMilliseconds()).padStart(3, '0')}`,
  '（本地分量构造 + 本地分量读取，任何时区下都一致）',
);

// setTime 直接改时间戳。
const viaSetTime = new Date('2024-01-01T00:00:00Z');
viaSetTime.setTime(0);
console.log('setTime(0) 之后 =', viaSetTime.toISOString());

console.log('\n--- 4. set 的自动进位与溢出陷阱 ---');

// 2024 年 1 月 31 日 + 1 个月：2 月没有 31 日，于是溢出到 3 月 2 日（2024 是闰年）。
const overflow = new Date(2024, 0, 31);
console.log('起点 =', overflow.getMonth() + 1, '月', overflow.getDate(), '日');
overflow.setMonth(1);
console.log('setMonth(1) 之后 =', overflow.getMonth() + 1, '月', overflow.getDate(), '日（溢出了，不是 2 月 29 日！）');

// 对比：非闰年 1 月 31 日 + 1 个月 = 3 月 3 日。
const overflowNonLeap = new Date(2023, 0, 31);
overflowNonLeap.setMonth(1);
console.log('2023 年同样操作 =', overflowNonLeap.getMonth() + 1, '月', overflowNonLeap.getDate(), '日');

// 想"加一个月但不溢出"，标准做法是先把日改成 1，加完再夹回来。
function addMonthClamped(date, n) {
  const day = date.getDate();
  const copy = new Date(date.getTime()); // 先复制，避免污染入参
  copy.setDate(1); // 先退到 1 号，杜绝溢出
  copy.setMonth(copy.getMonth() + n);
  // 目标月可能比原月份短，取两者较小值即可"夹住"。
  const lastDay = new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate();
  copy.setDate(Math.min(day, lastDay));
  return copy;
}
const jan31 = new Date(2024, 0, 31);
const plusOneMonth = addMonthClamped(jan31, 1);
console.log(
  '夹住写法 + 1 个月 =',
  plusOneMonth.getMonth() + 1, '月', plusOneMonth.getDate(), '日（得到 2 月 29 日，符合直觉）',
);
// 顺带一提：new Date(y, m + 1, 0).getDate() 是"求某月最后一天"的经典技巧，
// 因为"下个月的第 0 天"会被自动归一为"这个月的最后一天"。

console.log('\n--- 5. 本地 get 与 UTC get 的差异 ---');

// 同一个时刻，在 UTC 下和在本机时区下读出的分量通常不同。
// 为避免依赖机器时区，这里不打印本机数值，只打印"两者之差"这种结构性事实。
const instant = new Date('2024-06-01T12:00:00Z');
const offsetMinutes = instant.getTimezoneOffset(); // UTC - 本地，单位分钟
// UTC 分量是确定的：12:00。
console.log('getUTCHours() =', instant.getUTCHours(), '（固定 12）');
// 本机小时 = UTC 小时 - 偏移分钟/60（因为 offset = UTC - 本地）。
const localHourDerived = instant.getUTCHours() - offsetMinutes / 60;
console.log('由 UTC 分量和偏移推算的本地小时 =', localHourDerived, '（与 getHours() 一致，但数值随时区变化）');
console.log('两者自洽：', instant.getHours() === localHourDerived);
// 关键结论：本地值与 UTC 值的差，正好是本机时区偏移；UTC 方法才是跨机器可复现的。
console.log('差值（分钟）=', instant.getHours() * 60 + instant.getMinutes() - (instant.getUTCHours() * 60 + instant.getUTCMinutes()));

console.log('\n--- 6. getTimezoneOffset() 的符号陷阱 ---');

// 它返回 (UTC - 本地)，所以：东半球得到负数，西半球得到正数。
const sample = new Date('2024-01-01T00:00:00Z');
const off = sample.getTimezoneOffset();
console.log('本机 getTimezoneOffset() =', off, '分钟（注意：每次在不同机器上运行值不同）');
console.log('UTC 偏移（人类习惯的写法）=', -off, '分钟 = UTC' + (off <= 0 ? '+' : '-') + Math.abs(off / 60));
// 用固定的 Intl 计算两个确定城市的偏移作对照，输出与机器时区无关。
// 辅助函数：求某时区在某一时刻的 UTC 偏移（分钟）。
function zoneOffset(isoString, timeZone) {
  const date = new Date(isoString);
  // 思路：把同一时刻分别按"目标时区"和"UTC"渲染成年月日时分秒，
  // 再把两组分量都当成 UTC 时刻相减，差值就是该时区此刻的 UTC 偏移。
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date);
  const get = (type) => Number(parts.find((x) => x.type === type).value);
  // hour 在 hour12:false 下可能返回 24，取模归一。
  const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return (asUTC - date.getTime()) / 60000;
}
console.log('固定时刻 2024-01-01T00:00:00Z 在各时区的 UTC 偏移（分钟）：');
console.log('  亚洲/上海      =', zoneOffset('2024-01-01T00:00:00Z', 'Asia/Shanghai'), '（+480，即 UTC+8）');
console.log('  美洲/纽约      =', zoneOffset('2024-01-01T00:00:00Z', 'America/New_York'), '（-300，冬季标准时）');
console.log('  UTC            =', zoneOffset('2024-01-01T00:00:00Z', 'UTC'), '（0）');
console.log('本机偏移与之对比：', off, '（-480 表示 UTC+8；符号与直觉相反）');

console.log('\n本节结束：get/set 与 UTC 系列已全部演示。');
