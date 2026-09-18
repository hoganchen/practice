/**
 * ============================================================================
 * 知识点：Intl.DateTimeFormat —— 本地化日期格式化与相对时间
 * ============================================================================
 *
 * 【所属分类】22_date_and_time —— 日期与时间
 * 【难度等级】进阶
 * 【前置知识】22_date_and_time/05_date_formatting.js、07_timezone_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Intl.DateTimeFormat 是 ECMAScript 国际化 API（ECMA-402）的一部分，
 *    它把"某时刻 + 某时区 + 某语言"渲染成符合当地习惯的文本，
 *    是全平台通用的、无需第三方库的格式化方案（内部使用 ICU 数据）。
 *    同族的还有 Intl.RelativeTimeFormat（"3 天前"）、Intl.NumberFormat、
 *    Intl.Collator、Intl.ListFormat 等。
 *
 * 2. 为什么需要
 *    同样是 2024-03-15，美国人写 3/15/2024，德国人写 15.3.2024，
 *    中国人写 2024/3/15。手写这些规则既繁琐又容易出错
 *    （阿拉伯语还有从右到左和回历、泰语用佛历）。
 *    Intl 一行就能搞定，并且能正确渲染时区名、星期名、序数词。
 *
 * 3. 核心语法要点
 *    (1) 构造：new Intl.DateTimeFormat(locales, options)
 *        locales 可以是字符串（'zh-CN'）或数组（['zh-CN', 'en-US']）作为回退链。
 *    (2) 两步走 vs 一步走：
 *          const fmt = new Intl.DateTimeFormat(...);  fmt.format(date);  // 可复用，推荐
 *          date.toLocaleString(locales, options);                        // 等价，一次性
 *        循环里反复调用 toLocaleString 会重复构造 formatter，性能更差。
 *    (3) 两组互斥的 options：
 *          dateStyle/timeStyle（'full' | 'long' | 'medium' | 'short'）——粗粒度
 *          year/month/day/weekday/hour/minute/second/timeZoneName/hour12/hourCycle —— 细粒度
 *        两组**不能混用**，混用会抛 TypeError。
 *    (4) timeZone 必须写 IANA 名（Asia/Shanghai），不写就跟随运行环境的本地时区。
 *    (5) formatToParts() 返回分量数组，拿到"数字"再做自定义排版。
 *    (6) formatRange() 渲染时间段（如 "2024/3/15 – 2024/3/20"），自动去重相同部分。
 *    (7) resolvedOptions() 可以查看实际生效的选项（locale 可能被回退）。
 *    (8) Intl.RelativeTimeFormat 渲染"昨天/3 天后"这类相对时间：
 *        numeric: 'always'（"1 天前"）或 'auto'（"昨天"）。
 *
 * 4. 常见陷阱
 *    (1) 忘写 timeZone：结果跟随机器时区，测试机与服务器可能不一样。
 *    (2) dateStyle 和 year 混用 -> TypeError: Invalid option。
 *    (3) 以为 'zh-CN' 一定被支持：极小化 ICU 的 Node 构建可能缺失数据，
 *        此时会静默回退到默认 locale，应当用 resolvedOptions().locale 校验。
 *    (4) hour12: false 时，某些 locale 会渲染出 "24:00" 而不是 "00:00"。
 *    (5) 用 Intl 输出做解析（反向操作）：输出的文本是给人看的，不该被程序解析。
 *    (6) 相对时间需要自己算"差多少单位"，Intl 只负责措辞，不负责计算。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 22_date_and_time/08_intl_datetimeformat.js
 *
 * 【预期输出】
 *   分 8 个小节，演示多语言格式化、粗细两种 options、时区渲染、
 *   formatToParts、formatRange、Intl.RelativeTimeFormat 与性能提示。输出固定。
 * ============================================================================
 */

// 全局统一用这两个固定量，确保输出可复现。
const INSTANT = new Date('2024-03-15T09:30:45.123Z');
const SHANGHAI = 'Asia/Shanghai';

console.log('--- 1. 同一时刻、多语言渲染 ---');

console.log('固定时刻 =', INSTANT.toISOString());
for (const locale of ['zh-CN', 'en-US', 'en-GB', 'de-DE', 'ja-JP', 'fr-FR', 'ru-RU']) {
  const text = INSTANT.toLocaleString(locale, {
    timeZone: SHANGHAI,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  console.log(`  ${locale.padEnd(7)} -> ${text}`);
}
console.log('注意：同一个时刻，只是"写法"不同；真正的差异来自当地习惯，不是时区。');

console.log('\n--- 2. dateStyle / timeStyle：粗粒度写法 ---');
console.log('locale = zh-CN，timeZone = Asia/Shanghai');
for (const style of ['short', 'medium', 'long', 'full']) {
  console.log(`  ${style.padEnd(6)} -> ${INSTANT.toLocaleString('zh-CN', { timeZone: SHANGHAI, dateStyle: style, timeStyle: style })}`);
}

console.log('\n--- 3. 细粒度字段：逐个控制 ---');

// 只给日期
console.log('year+month+day            ->', INSTANT.toLocaleDateString('zh-CN', { timeZone: SHANGHAI, year: 'numeric', month: '2-digit', day: '2-digit' }));
console.log('month: "long"             ->', INSTANT.toLocaleDateString('zh-CN', { timeZone: SHANGHAI, month: 'long' }));
console.log('month: "short"（en-US）    ->', INSTANT.toLocaleDateString('en-US', { timeZone: SHANGHAI, month: 'short' }));
console.log('month: "narrow"（en-US）   ->', INSTANT.toLocaleDateString('en-US', { timeZone: SHANGHAI, month: 'narrow' }));
console.log('year: "2-digit"           ->', INSTANT.toLocaleDateString('zh-CN', { timeZone: SHANGHAI, year: '2-digit' }));
console.log('weekday: "long"           ->', INSTANT.toLocaleDateString('zh-CN', { timeZone: SHANGHAI, weekday: 'long' }));
console.log('weekday: "short"          ->', INSTANT.toLocaleDateString('zh-CN', { timeZone: SHANGHAI, weekday: 'short' }));
console.log('weekday: "narrow"         ->', INSTANT.toLocaleDateString('zh-CN', { timeZone: SHANGHAI, weekday: 'narrow' }));
console.log('era: "long"               ->', INSTANT.toLocaleDateString('zh-CN', { timeZone: SHANGHAI, era: 'long', year: 'numeric' }));
// 12 / 24 小时制
console.log('hour12: true              ->', INSTANT.toLocaleTimeString('en-US', { timeZone: SHANGHAI, hour: 'numeric', minute: '2-digit', hour12: true }));
console.log('hour12: false             ->', INSTANT.toLocaleTimeString('en-US', { timeZone: SHANGHAI, hour: '2-digit', minute: '2-digit', hour12: false }));
console.log('timeZoneName: "short"     ->', INSTANT.toLocaleTimeString('en-US', { timeZone: SHANGHAI, timeZoneName: 'short', hour: '2-digit', minute: '2-digit' }));
console.log('timeZoneName: "long"      ->', INSTANT.toLocaleTimeString('en-US', { timeZone: SHANGHAI, timeZoneName: 'long', hour: '2-digit', minute: '2-digit' }));
console.log('timeZoneName: "shortOffset" ->', INSTANT.toLocaleTimeString('en-US', { timeZone: SHANGHAI, timeZoneName: 'shortOffset', hour: '2-digit', minute: '2-digit' }));

console.log('\n--- 4. 陷阱：dateStyle 与细粒度字段不能混用 ---');
try {
  // 这两组选项互斥，混用会抛 TypeError。
  INSTANT.toLocaleString('zh-CN', { dateStyle: 'short', year: 'numeric' });
} catch (err) {
  console.log('混用抛错 ->', err.constructor.name + ':', err.message);
}

console.log('\n--- 5. formatToParts：把结果拆成分量，自定义排版 ---');

const formatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: SHANGHAI,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit',
  hour12: false,
});
console.log('formatter.format(INSTANT) =', formatter.format(INSTANT));
const parts = formatter.formatToParts(INSTANT);
console.log('formatToParts 的分量：');
for (const p of parts) {
  console.log(`  type=${p.type.padEnd(8)} value=${JSON.stringify(p.value)}`);
}
// 从分量里挑出数字，按自己的格式拼装。
const pick = (type) => parts.find((p) => p.type === type).value;
console.log('自定义拼装 =', `${pick('year')}年${Number(pick('month'))}月${Number(pick('day'))}日 ${pick('hour')}时${pick('minute')}分`);
console.log('注意：hour 在 hour12:false 下可能是 "24"，用它做运算前先取模 24。');

console.log('\n--- 6. 复用 formatter 与回退链 ---');

// 推荐的写法：formatter 建一次，循环里反复用。
const reused = new Intl.DateTimeFormat('zh-CN', { timeZone: SHANGHAI, dateStyle: 'short' });
console.log('复用同一个 formatter 渲染三个时刻：');
for (const iso of ['2024-01-01T00:00:00Z', '2024-06-15T12:00:00Z', '2024-12-31T23:59:59Z']) {
  console.log(`  ${iso} ->`, reused.format(new Date(iso)));
}
// locales 传数组表示回退链：找不到第一个就用第二个。
const chain = new Intl.DateTimeFormat(['xx-XX', 'zh-CN'], { timeZone: SHANGHAI, dateStyle: 'long' });
console.log('回退链 [xx-XX, zh-CN] 的实际 locale =', chain.resolvedOptions().locale, '（xx-XX 不存在，回退到 zh-CN）');
console.log('resolvedOptions().timeZone =', chain.resolvedOptions().timeZone);
console.log('resolvedOptions().calendar =', chain.resolvedOptions().calendar);

console.log('\n--- 7. formatRange 与 Intl.RelativeTimeFormat ---');

// formatRange 渲染时间段，会自动省略重复的部分。
const rangeFmt = new Intl.DateTimeFormat('zh-CN', { timeZone: SHANGHAI, year: 'numeric', month: '2-digit', day: '2-digit' });
console.log('同日不同时段的 range：');
console.log('  2024-03-15 ~ 2024-03-15 ->', rangeFmt.formatRange(new Date('2024-03-15T00:00:00Z'), new Date('2024-03-15T12:00:00Z')));
console.log('  2024-03-15 ~ 2024-03-20 ->', rangeFmt.formatRange(new Date('2024-03-15T00:00:00Z'), new Date('2024-03-20T00:00:00Z')));
console.log('  2024-03-15 ~ 2025-01-01 ->', rangeFmt.formatRange(new Date('2024-03-15T00:00:00Z'), new Date('2025-01-01T00:00:00Z')));

// Intl.RelativeTimeFormat：把"相差多少单位"翻译成自然语言。
// 注意它**只负责措辞**，"差多少"要自己先算好。
const rtfZh = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
const rtfEn = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
console.log('\nIntl.RelativeTimeFormat（numeric: "auto"）：');
const relSamples = [[-1, 'day'], [-3, 'day'], [0, 'day'], [1, 'day'], [7, 'day'], [-2, 'week'], [3, 'month'], [-1, 'year'], [5, 'minute']];
for (const [value, unit] of relSamples) {
  console.log(`  ${String(value).padStart(3)} ${unit.padEnd(7)} -> zh: ${rtfZh.format(value, unit).padEnd(10)} en: ${rtfEn.format(value, unit)}`);
}
// numeric: 'always' 的对比（不再出现"昨天"这种词）。
const rtfAlways = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'always' });
console.log('\nnumeric 两种取值的区别：');
console.log('  auto   ->', rtfZh.format(-1, 'day'));
console.log('  always ->', rtfAlways.format(-1, 'day'));

// 实战：算好差值再交给 Intl 措辞。
const NOW_FIXED = new Date('2024-06-15T08:00:00Z');
/**
 * 用 Intl.RelativeTimeFormat 渲染"某时刻相对此刻"的措辞。
 * 按"秒/分/时/天"从细到粗挑一个合适的单位（超过 7 天就换成周）。
 * @param {Date} target 目标时刻
 * @param {Intl.RelativeTimeFormat} rtf 已构造好的 formatter
 * @returns {string}
 */
function relativeFromNow(target, rtf) {
  const diffMs = target.getTime() - NOW_FIXED.getTime();
  const absSec = Math.abs(diffMs) / 1000;
  if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), 'second');
  if (absSec < 3600) return rtf.format(Math.round(diffMs / 60000), 'minute');
  if (absSec < 86400) return rtf.format(Math.round(diffMs / 3600000), 'hour');
  if (absSec < 86400 * 7) return rtf.format(Math.round(diffMs / 86400000), 'day');
  if (absSec < 86400 * 30) return rtf.format(Math.round(diffMs / (86400000 * 7)), 'week');
  if (absSec < 86400 * 365) return rtf.format(Math.round(diffMs / (86400000 * 30)), 'month');
  return rtf.format(Math.round(diffMs / (86400000 * 365)), 'year');
}
console.log('\n相对固定"现在"（2024-06-15T08:00:00Z）的措辞：');
for (const iso of ['2024-06-15T07:59:30Z', '2024-06-15T07:30:00Z', '2024-06-15T05:00:00Z', '2024-06-14T08:00:00Z', '2024-06-01T08:00:00Z', '2024-03-15T08:00:00Z', '2022-06-15T08:00:00Z']) {
  console.log(`  ${iso} ->`, relativeFromNow(new Date(iso), rtfZh));
}

console.log('\n--- 8. 性能提示：不要把 formatter 建在循环里 ---');
console.log('❌ 循环里 date.toLocaleString(...) 每次都重新构造 formatter，慢几十倍');
console.log('✅ const fmt = new Intl.DateTimeFormat(...) 建一次，循环里 fmt.format(date)');
console.log('   也可以用 Intl.DateTimeFormat.prototype.format 取出的绑定函数缓存起来：');
const boundFormat = new Intl.DateTimeFormat('zh-CN', { timeZone: SHANGHAI, dateStyle: 'short' }).format;
console.log('   boundFormat(INSTANT) =', boundFormat(INSTANT), '（可直接当回调传给 map/forEach，无需 this）');
console.log('\n本节结束。');
