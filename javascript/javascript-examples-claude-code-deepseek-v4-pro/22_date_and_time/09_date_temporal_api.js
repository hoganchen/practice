/**
 * ============================================================================
 * 知识点：Temporal API 简介 —— 下一代日期时间 API（含特性检测）
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】高级
 * 【前置知识】22_date_and_time/01_date_creation.js、04_date_arithmetic.js、07_timezone_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Temporal 是 TC39 历时多年设计的 Date 替代品（提案已进入 Stage 3，浏览器与
 *    Node 正在陆续落地）。它不是给 Date 打补丁，而是重新设计了一整套类型：
 *      Temporal.Instant            —— 绝对时刻（相当于时间戳，精度到纳秒）
 *      Temporal.ZonedDateTime      —— 时刻 + IANA 时区（带夏令时规则）
 *      Temporal.PlainDateTime      —— 墙上时间，不带时区（日历 + 钟表读数）
 *      Temporal.PlainDate          —— 只有日期（2024-03-15）
 *      Temporal.PlainTime          —— 只有时间（09:30:45）
 *      Temporal.PlainYearMonth     —— 年月（2024-03）
 *      Temporal.PlainMonthDay      —— 月日（03-15，可表示生日）
 *      Temporal.Duration           —— 时间段（P1Y2M3DT4H5M6S）
 *      Temporal.Now                —— 取当前时刻/当前日期（可指定时区）
 *      Temporal.Calendar           —— 非公历日历（如农历、回历）
 *    核心设计原则是"**类型区分** + **不可变** + **显式时区**"。
 *
 * 2. 为什么需要 —— Date 的四大原罪
 *    (1) 可变：任何 set* 都会改掉所有引用它的地方，无法安全共享。
 *    (2) 只支持本地时区和 UTC 两种口径，没法指定"纽约时间"。
 *    (3) 月份从 0 开始，日期从 1 开始，规则不统一。
 *    (4) 解析规则由引擎实现决定，非 ISO 格式行为不一致；
 *        夏令时不存在的时间、重复的时间也没有明确表示法。
 *    Temporal 用一个"只有纯函数式运算"的对象模型彻底解决了这些问题。
 *
 * 3. 核心语法要点（前瞻）
 *    (1) 绝对时刻：Temporal.Instant.from('2024-03-15T09:30:45Z').epochMilliseconds
 *    (2) 带时区：Temporal.ZonedDateTime.from('2024-03-15T09:30:45+08:00[Asia/Shanghai]')
 *    (3) 加减：zdt.add({ days: 1 }) 返回**新对象**，原对象不变。
 *    (4) 取差：zdt1.since(zdt2, { largestUnit: 'day' }) 返回 Duration，含日历单位。
 *    (5) 格式化：zdt.toLocaleString('zh-CN')，与 Intl 无缝衔接。
 *    (6) 取值范围比 Date 大得多：年份可到 ±271821 年。
 *
 * 4. 常见陷阱 / 使用注意
 *    (1) **不要在生产环境直接依赖**：截至 Node 24 默认仍不可用（Node 24.16 实测
 *        typeof Temporal === 'undefined'）。可开启实验标志：
 *          node --harmony-temporal 22_date_and_time/09_date_temporal_api.js
 *        但该标志可能随版本变动而失效，且不适用于所有部署环境。
 *    (2) Temporal 对象是**不可变**的，add/subtract 返回新对象，
 *        老代码里 d.setDate(...) 的习惯写法在这里不成立。
 *    (3) Plain* 系列没有时区，跨时区换算必须先转成 Instant/ZonedDateTime，
 *        否则会得到"看起来对、实际差几小时"的结果。
 *    (4) 包体积：polyfill（如 @js-temporal/polyfill）体积较大，
 *        在老浏览器场景要评估成本。
 *    (5) 必须做特性检测再使用，否则在旧环境会直接 ReferenceError。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/09_date_temporal_api.js
 *   （如你的 Node 已支持 Temporal，可尝试：node --harmony-temporal 22_date_and_time/09_date_temporal_api.js）
 *
 * 【预期输出】
 *   分 6 个小节：先做特性检测报告环境情况，再用"用 Date 手工模拟 Temporal 语义"
 *   的方式演示核心概念，并给出若 Temporal 可用时的等价代码。
 *   无论环境是否支持 Temporal，脚本都正常退出（退出码 0）。
 * ============================================================================
 */

console.log('--- 1. 特性检测：当前环境支持 Temporal 吗？ ---');

// 标准做法：用 typeof 判断，typeof 对未声明的标识符不会抛错。
const hasTemporal = typeof globalThis.Temporal !== 'undefined';
console.log('Node 版本            =', process.version);
console.log('typeof Temporal      =', typeof globalThis.Temporal);
console.log('当前环境支持 Temporal：', hasTemporal);
if (!hasTemporal) {
  console.log('提示：Node 24 默认仍未开启 Temporal。可尝试运行：');
  console.log('  node --harmony-temporal 22_date_and_time/09_date_temporal_api.js');
  console.log('提示：也可安装 polyfill —— npm i @js-temporal/polyfill 后：');
  console.log("  import { Temporal } from '@js-temporal/polyfill';");
}
console.log('本示例不会因为不支持而报错退出，后面的演示会自动走"模拟"分支。');

console.log('\n--- 2. Date 的四大痛点（Temporal 要解决的问题） ---');

console.log('痛点 1：可变对象 —— 共享引用时会被意外改掉');
const shared = new Date('2024-03-15T00:00:00Z');
const alsoShared = shared; // 同一个引用
const snapshot = shared.toISOString();
alsoShared.setUTCFullYear(2030); // 通过另一个变量改
console.log('  改之前 =', snapshot);
console.log('  改之后 shared =', shared.toISOString(), '（shared 也被改了，因为它们是同一个对象）');
// Temporal 的做法（若可用）：所有运算返回新对象。
//   const t1 = Temporal.PlainDate.from('2024-03-15');
//   const t2 = t1.add({ years: 6 });   // t1 保持不变
console.log('  Temporal 的对应写法（伪代码）：t2 = t1.add({ years: 6 }); 而 t1 不变');

console.log('\n痛点 2：月份索引 0 起、日期 1 起，规则不统一');
console.log('  new Date(2024, 2, 15) 是 3 月 15 日（月份 2 = 三月），getDate() 却是 15');
console.log('  Temporal 的对应写法（伪代码）：Temporal.PlainDate.from({ year: 2024, month: 3, day: 15 })');
console.log('  —— 月份直接从 1 开始，与人类写法一致');

console.log('\n痛点 3：无法表达"某个时区的墙上时间"');
console.log('  Date 只有"本机本地"和"UTC"两套 get/set，想直接得到"纽约的今天"必须借 Intl');
const nyToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date('2024-03-15T03:00:00Z'));
console.log('  用 Intl 绕道求"纽约日期" =', nyToday, '（凌晨 UTC 时刻在纽约还是前一天）');
console.log('  Temporal 的对应写法（伪代码）：Temporal.Now.plainDateISO("America/New_York")');

console.log('\n痛点 4：夏令时下"不存在"和"重复"的时间没有表示法');
console.log('  2024-03-10T02:30 在纽约并不存在（当天 02:00 直接跳到 03:00）');
console.log('  Date 解析这种时间只能靠引擎自行决定，没有 API 让你声明想要的策略');
console.log('  Temporal 的对应写法（伪代码）：');
console.log('    zdt = Temporal.ZonedDateTime.from("2024-03-10T02:30[America/New_York]", { disambiguation: "compatible" })');

console.log('\n--- 3. Temporal 类型体系一览（对照 Date 的能力） ---');

const typeTable = [
  ['Temporal.Instant', '绝对时刻（纳秒精度）', 'Date + getTime()'],
  ['Temporal.ZonedDateTime', '时刻 + 时区 + 日历', '无对应（需 Intl 绕道）'],
  ['Temporal.PlainDateTime', '墙上日期时间（无时区）', '无对应'],
  ['Temporal.PlainDate', '只有日期', '无对应'],
  ['Temporal.PlainTime', '只有时间', '无对应'],
  ['Temporal.PlainYearMonth', '年 + 月', '无对应'],
  ['Temporal.PlainMonthDay', '月 + 日（如生日）', '无对应'],
  ['Temporal.Duration', '时间段（年/月/日/时/分/秒）', '只用毫秒差近似'],
  ['Temporal.Now', '取当前时刻/日期（可指定时区）', 'new Date()'],
  ['Temporal.Calendar', '非公历日历', 'Intl 的 calendar 选项'],
];
console.log('  ' + 'Temporal 类型'.padEnd(26) + '作用'.padEnd(26) + 'Date 里的对应物');
console.log('  ' + '-'.repeat(70));
for (const [name, desc, dateEquivalent] of typeTable) {
  console.log('  ' + name.padEnd(24) + desc.padEnd(24) + dateEquivalent);
}

console.log('\n--- 4. 用 Date 手工模拟 Temporal 的"不可变"语义 ---');

// Temporal 的关键设计之一：运算返回新对象。我们可以用纯函数在 Date 上模拟。
/**
 * 不可变地"加上 N 天"：返回新对象，入参绝不修改。
 * @param {Date} date 原始日期
 * @param {number} days 天数，可为负
 * @returns {Date} 新日期
 */
function addDaysImmutable(date, days) {
  return new Date(date.getTime() + days * 86400000);
}
const original = new Date('2024-03-15T00:00:00Z');
const plusTenDays = addDaysImmutable(original, 10);
console.log('原始对象 =', original.toISOString(), '（始终不变）');
console.log('加 10 天  =', plusTenDays.toISOString(), '（一个新对象）');
console.log('是同一个对象吗：', original === plusTenDays, '（false，符合 Temporal 的语义）');

console.log('\n--- 5. 用 Date 手工模拟 Temporal.Duration 的"日历单位"概念 ---');

// Temporal.Duration 能表达"1 个月"这种长度不固定的单位；Date 只能用毫秒近似。
// 下面演示"毫秒近似"和"日历精确"的区别。
const from = new Date(Date.UTC(2024, 0, 31)); // 1 月 31 日
const msApprox = new Date(from.getTime() + 30 * 86400000); // "30 天"当作 1 个月
console.log('起点 =', from.toISOString());
console.log('加 30 天（毫秒近似）=', msApprox.toISOString(), '-> 3 月 1 日');

// 日历精确的做法：月份 +1 并把日夹住。
function addMonthsImmutableUTC(date, months) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  // Date.UTC 会自动归一越界的月份；把日设成 0 可求目标月天数。
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}
console.log('加 1 个日历月（夹住）=', addMonthsImmutableUTC(from, 1).toISOString(), '-> 2 月 29 日（闰年）');
console.log('结论：Temporal.Duration 能区分 "P1M"（1 个月）和 "P30D"（30 天），');
console.log('      Date 只能用毫秒，永远区分不了这两者。');

console.log('\n--- 6. 若 Temporal 可用，等价代码长什么样（本节在支持时真正执行） ---');

if (hasTemporal) {
  try {
    const T = globalThis.Temporal;
    // 绝对时刻
    const instant = T.Instant.from('2024-03-15T09:30:45Z');
    console.log('Instant.epochMilliseconds =', instant.epochMilliseconds);
    // 带时区的时间
    const zdt = T.ZonedDateTime.from('2024-03-15T09:30:45+08:00[Asia/Shanghai]');
    console.log('ZonedDateTime.toString()  =', zdt.toString());
    // 不可变加减
    const next = zdt.add({ days: 1 });
    console.log('add({days:1}) 后 =', next.toString());
    console.log('原对象未被修改    =', zdt.toString());
    // 求差（含日历单位）
    const dur = next.since(zdt, { largestUnit: 'day' });
    console.log('Duration.toString()       =', dur.toString());
    // 纯日期
    console.log('PlainDate.from({y,m,d})   =', T.PlainDate.from({ year: 2024, month: 3, day: 15 }).toString());
  } catch (err) {
    // 即便 API 存在，也可能因实现不完整而抛错，这里兜底保证不崩溃。
    console.log('Temporal 存在但调用失败（实现可能不完整）：', err.constructor.name + ':', err.message);
  }
} else {
  console.log('当前环境没有 Temporal，下面是等价的 Date 写法（可正常运行）：');
  // 等价 1：绝对时刻
  const instantLike = new Date('2024-03-15T09:30:45Z');
  console.log('  Instant.epochMilliseconds  ≈ Date.getTime() =', instantLike.getTime());
  // 等价 2：带时区的时间
  const zdtLike = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZoneName: 'longOffset',
  }).format(instantLike);
  console.log('  ZonedDateTime.toString()   ≈ Intl 渲染    =', zdtLike);
  // 等价 3：不可变加减（用纯函数实现）
  console.log('  add({days:1})              ≈ addDaysImmutable =', addDaysImmutable(instantLike, 1).toISOString());
  console.log('  （原对象保持 =', instantLike.toISOString(), '，未被修改）');
  // 等价 4：纯日期
  console.log('  PlainDate.from({y:2024,m:3,d:15}) ≈ new Date(Date.UTC(2024, 2, 15)) =', new Date(Date.UTC(2024, 2, 15)).toISOString());
}

console.log('\n--- 7. 现在该怎么写代码？ ---');
console.log('1) 短期内仍以 Date + Intl 为主：它们是所有环境的基线能力。');
console.log('2) 涉及夏令时、跨时区、日历运算时，最省心的现成方案是第三方库');
console.log('   （如 Temporal polyfill、Luxon、date-fns-tz），而不是硬啃 Date。');
console.log('3) 从今天起就可以养成 Temporal 的好习惯：');
console.log('   - 日期运算写成纯函数，不修改入参');
console.log('   - 时间数据一律带时区名，不用裸的本地时间字符串');
console.log('   - 月份用 1~12 表达，只在调用 Date 构造函数时才减 1');
console.log('4) 使用前务必特性检测，并准备好"不支持时"的降级路径。');
console.log('\n本节结束。');
