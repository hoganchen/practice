/**
 * ============================================================================
 * 知识点：时间戳 —— Date.now()、getTime()、秒与毫秒、performance.now()
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】入门
 * 【前置知识】22_date_and_time/01_date_creation.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "时间戳"在 JS 语境里指 **Unix 时间戳的毫秒形式**：从
 *    1970-01-01T00:00:00 UTC（纪元 / epoch）到目标时刻经过的毫秒数。
 *    Date 对象内部就只存这一个数字，其余 API 都是围绕它的格式化与解析。
 *
 * 2. 为什么需要
 *    时间戳是"时间"最便于计算的表示：它就是一个普通数字，
 *    可以直接比较大小、相减求间隔、加减做偏移、存进数据库、通过 JSON 传输。
 *    凡是"计算"时间的场合，都应先把 Date 变成时间戳再运算。
 *
 * 3. 核心语法要点
 *    (1) Date.now()          —— 静态方法，返回当前时刻的毫秒时间戳，不创建对象，最快。
 *    (2) date.getTime()      —— 实例方法，返回该 Date 的毫秒时间戳。
 *    (3) date.valueOf()      —— 与 getTime() 完全等价；因此 +date、Number(date)、
 *        date - 0 也都得到时间戳（隐式调用 valueOf）。
 *    (4) Date.parse(字符串)   —— 解析字符串为时间戳，失败返回 NaN。
 *    (5) 秒 vs 毫秒：JS 一律用**毫秒**；而 Unix/Linux、许多后端 API、JWT 的 exp、
 *        Redis 的 EXPIRE 用**秒**。换算：秒 = Math.floor(毫秒 / 1000)。
 *    (6) performance.now()   —— 返回页面/进程启动以来的毫秒数（带小数），
 *        它是**单调时钟**：不受系统时间被校准、NTP 回拨的影响，专用于计时。
 *        Node 中还有更精确的 process.hrtime.bigint()（纳秒级 BigInt）。
 *
 * 4. 常见陷阱
 *    (1) 把秒当毫秒用：new Date(1704067200) 得到的是 1970-01-20，不是 2024 年。
 *    (2) 混淆 Date.now() 与 performance.now()：前者是"绝对时刻"，后者是
 *        "进程启动至今的相对时长"，两者的数值差着几十年，不能混算。
 *    (3) 用 new Date() 相减来计时：系统时间若被调整，可能算出负数或巨大值。
 *    (4) 浮点精度：毫秒数约 1.7e12，远小于 Number.MAX_SAFE_INTEGER（约 9e15），
 *        所以毫秒时间戳在 JS 里是安全整数，但**微秒/纳秒时间戳就不安全了**。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/02_timestamp.js
 *
 * 【预期输出】
 *   分 6 个小节，展示 4 种取时间戳的方式、秒与毫秒的换算、时间差计算、
 *   以及 performance.now() 这一类单调时钟的用法。除计时结果外输出固定。
 * ============================================================================
 */

console.log('--- 1. 四种取时间戳的方式（对同一个 Date 应当完全相等） ---');

// 用一个固定时刻做基准，保证输出可复现。
const fixed = new Date('2024-01-01T00:00:00.000Z');

console.log('date.getTime()   =', fixed.getTime());
console.log('date.valueOf()   =', fixed.valueOf(), '（与 getTime 完全相同）');
console.log('+date            =', +fixed, '（一元加号触发 valueOf）');
console.log('Number(date)     =', Number(fixed));
console.log('date - 0         =', fixed - 0, '（减法也会触发 valueOf）');

// Date.parse 是"从字符串直接到时间戳"，不经过 Date 对象。
console.log('Date.parse(同字符串) =', Date.parse('2024-01-01T00:00:00.000Z'));
console.log('上面 5 个数字是否全部相等：', new Set([
  fixed.getTime(),
  fixed.valueOf(),
  +fixed,
  Number(fixed),
  Date.parse('2024-01-01T00:00:00.000Z'),
]).size === 1);

// Date.now() 取"此刻"，每次运行都不同，所以只做范围断言。
const nowMs = Date.now();
console.log('Date.now()（每次运行都不同）=', nowMs);
console.log('它比 2024-01-01 更晚吗：', nowMs > fixed.getTime());

console.log('\n--- 2. 秒 vs 毫秒：最容易搞错的一处 ---');

const ONE_SECOND_MS = 1000;
const ONE_MINUTE_MS = 60 * ONE_SECOND_MS;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
console.log('一天 =', ONE_DAY_MS, '毫秒');

// 正确：把毫秒换算成秒要除以 1000。
console.log('1704067200000 毫秒 =', 1704067200000 / ONE_SECOND_MS, '秒');
// floor 用于向下取整，避免出现小数秒（Unix 秒通常是整数）。
console.log('Math.floor(1704067200999 / 1000) =', Math.floor(1704067200999 / ONE_SECOND_MS), '秒');

// ❌ 反面示范：把"秒"直接塞给 Date，结果差了一千倍。
const wrongFromSeconds = new Date(1704067200);
console.log('❌ new Date(1704067200).toISOString() =', wrongFromSeconds.toISOString());
console.log('   （本意是 2024-01-01，实际却落在 1970-01-20）');

// ✅ 正确示范：秒 -> 毫秒要乘 1000。
const rightFromSeconds = new Date(1704067200 * ONE_SECOND_MS);
console.log('✅ new Date(1704067200 * 1000).toISOString() =', rightFromSeconds.toISOString());

// 两个便捷的换算函数，实际项目里很常用。
const toSeconds = (ms) => Math.floor(ms / ONE_SECOND_MS);
const fromSeconds = (s) => new Date(s * ONE_SECOND_MS);
console.log('toSeconds(1704067200999)          =', toSeconds(1704067200999));
console.log('fromSeconds(1704067200).toISOString() =', fromSeconds(1704067200).toISOString());
console.log('两个函数互为逆运算：', fromSeconds(toSeconds(1704067200999)).getTime() === 1704067200000);

console.log('\n--- 3. 时间差：相减即毫秒数 ---');

// 时间戳相减得到毫秒间隔，这是最常用、也最不容易出错的日期运算。
const start = new Date('2024-01-01T00:00:00Z');
const end = new Date('2024-03-01T00:00:00Z');
const diffMs = end - start; // 隐式 valueOf，等价于 end.getTime() - start.getTime()
console.log('2024-01-01 到 2024-03-01 相差', diffMs, '毫秒');
console.log('  = ', diffMs / ONE_DAY_MS, '天（2024 是闰年，1 月 31 天 + 2 月 29 天 = 60 天）');
console.log('  = ', diffMs / ONE_HOUR_MS, '小时');

// 反过来，由间隔推新时刻：直接做加法即可。
console.log('起点 + 7 天 =', new Date(start.getTime() + 7 * ONE_DAY_MS).toISOString());

console.log('\n--- 4. 时间戳的大小比较 ---');

// 时间戳是数字，比较符可直接用；Date 对象用 < > 也可以（隐式转数字），
// 但用 === 比较两个 Date 对象比的是"是不是同一个对象"，永远为 false！
const a = new Date('2024-01-01T00:00:00Z');
const b = new Date('2024-01-01T00:00:00Z');
console.log('a < b            =', a < b, '（两个 Date 的 < 会转成时间戳比较）');
console.log('a.getTime() === b.getTime() =', a.getTime() === b.getTime(), '✅ 推荐写法');
console.log('a === b          =', a === b, '❌ 比的是引用，不是时间');

console.log('\n--- 5. 安全整数边界 ---');

// JS 的 Number 能精确表示的最大整数是 2^53 - 1。
console.log('Number.MAX_SAFE_INTEGER =', Number.MAX_SAFE_INTEGER);
console.log('毫秒时间戳量级 ≈ 1.7e12，安全：', Date.now() < Number.MAX_SAFE_INTEGER);
// 微秒时间戳 ≈ 1.7e15，仍然安全；纳秒 ≈ 1.7e18，已经超出。
console.log('微秒时间戳 ≈ 1.7e15，仍安全：', 1.7e15 < Number.MAX_SAFE_INTEGER);
console.log('纳秒时间戳 ≈ 1.7e18，超出安全范围：', 1.7e18 < Number.MAX_SAFE_INTEGER);
console.log('Date 能表示的最大毫秒数 =', 8640000000000000, '（约 1e13 量级，安全）');

console.log('\n--- 6. 计时专用：performance.now() 与 process.hrtime ---');

// performance.now() 返回"进程启动至今"的毫秒数，带小数，通常是微秒级分辨率。
// 它是**单调递增**的：即使系统时间被 NTP 回拨，它也不会倒退。
const t0 = performance.now();
// 做一点可测量的工作（累加，避免被引擎优化掉）。
let sum = 0;
for (let i = 0; i < 300000; i++) sum += i;
const t1 = performance.now();
console.log('累加结果 sum =', sum, '（结果固定）');
console.log('performance.now() 起始值 t0 >= 0：', t0 >= 0);
console.log('本次耗时（毫秒，每次运行略有不同）=', (t1 - t0).toFixed(3));
console.log('耗时为有限数且非负：', Number.isFinite(t1 - t0) && t1 - t0 >= 0);

// process.hrtime.bigint() 是 Node 提供的纳秒级单调时钟，返回 BigInt。
const h0 = process.hrtime.bigint();
let sum2 = 0;
for (let i = 0; i < 300000; i++) sum2 += i;
const h1 = process.hrtime.bigint();
console.log('process.hrtime.bigint() 差值（纳秒，每次不同）=', (h1 - h0).toString());
console.log('纳秒差值 >= 0：', h1 - h0 >= 0n);
console.log('换算成毫秒的方法：(h1 - h0) / 1000000n =', ((h1 - h0) / 1000000n).toString(), 'ms');

console.log('\n--- 7. 计时该用哪个？ ---');
console.log('测代码耗时        -> performance.now() 或 process.hrtime.bigint()（单调，不受校时影响）');
console.log('记录事件发生时刻  -> Date.now()（绝对时刻，可跨进程比较、可持久化）');
console.log('❌ 反例：用两个 new Date() 相减测耗时，系统校时会导致结果为负数。');

// 用固定值演示"系统时间回拨"会造成的荒谬结果，不依赖真实时钟。
const tBefore = new Date('2024-01-01T00:00:00Z').getTime();
const tAfterNtpRollback = new Date('2023-12-31T23:59:59Z').getTime();
console.log('模拟系统时间被回拨 1 秒后的差值 =', tAfterNtpRollback - tBefore, '毫秒（负数，计时就废了）');
console.log('\n本节结束。');
