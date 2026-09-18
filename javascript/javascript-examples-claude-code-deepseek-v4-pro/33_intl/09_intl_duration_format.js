/**
 * ============================================================================
 * 知识点：Intl.DurationFormat —— 时长本地化（视频进度 / 任务耗时 / 倒计时）
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】进阶
 * 【前置知识】33_intl/01_intl_overview.js、22_date_and_time/08_intl_datetimeformat.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Intl.DurationFormat 是 ECMA-402 里**最年轻的构造器之一**：它把"一段时长"
 *    （1 小时 30 分、2 天 3 小时、1 分 5 秒）渲染成目标语言的写法。
 *    它和 01_intl_overview.js 里列出的其他构造器是同一族人：
 *      new Intl.DurationFormat(locales, options) -> { format, formatToParts, resolvedOptions }
 *    它是 01_intl_overview.js 的构造器清单里**唯一被列出却零演示**的那个
 *    —— 本文件把它补齐。关键区分：它处理的是 **Duration（时长 / 时间间隔）**，
 *    不是 **Instant（时刻）**。所以它**没有 timeZone 属性** —— 时区是"时刻"的属性，
 *    与"时长"无关。这与 08_intl_best_practices.js 的"铁律三：涉及时区就显式传 timeZone"
 *    并不冲突：铁律针对的是 DateTimeFormat，DurationFormat 根本不需要时区。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 视频播放器：把 5425 秒显示成「1:30:25」还是「1 小时 30 分 25 秒」，
 *        中英阿三种语言写法完全不同，自己拼字符串必然出错。
 *    (2) 任务耗时 / 计时器：构建日志里的「耗时 2 分 13 秒」，俄语要按复数变格。
 *    (3) 倒计时：距离开售还有「2 天 3 小时」，阿拉伯语需要阿拉伯-印度数字且从右往左。
 *    (4) 播客进度：「还剩 12 分钟」，德语用逗号分隔、阿语用连接词，规则都在 CLDR 里。
 *    这些规则随 CLDR 版本更新（措辞、单位缩写、数字系统都会变），
 *    自己维护一张单位表会持续腐化，交给 Intl 才跟得上。
 *
 * 3. 核心语法要点
 *    (1) 入参是一个**普通对象**（Duration Record），键就是单位名，全部可选：
 *        years / months / weeks / days / hours / minutes / seconds /
 *        milliseconds / microseconds / nanoseconds
 *    (2) style 决定整体风格，共四个值：
 *        'long'    -> 1 hour, 30 minutes, 5 seconds   / 1小时30分钟5秒钟
 *        'short'   -> 1 hr, 30 min, 5 sec             / 1小时30分钟5秒
 *        'narrow'  -> 1h 30m 5s                       / 1小时30分钟5秒
 *        'digital' -> 1:30:05                         （只适合"钟表式"展示）
 *    (3) 每个单位还能单独配 `<unit>Display`（'always' | 'auto'）控制"0 值是否出现"，
 *        digital 风格下常用 hoursDisplay: 'always' 固定显示成 01:30:00。
 *    (4) formatToParts() 返回带 type / unit 的分片，便于只替换其中一段（如把数字高亮）。
 *    (5) **数值必须是整数**，且**所有非零单位必须同号** —— 违反则抛 RangeError。
 *    (6) 与 Intl.RelativeTimeFormat 的分工（最容易用错的一点）：
 *        DurationFormat      -> "持续多久"    ：「1 小时 30 分钟」
 *        RelativeTimeFormat  -> "多久以前/以后"：「1 小时前」「3 天后」
 *        一个描述**长度**（无参照点），一个描述**相对位置**（必须有参照点）。
 *        "视频时长 1:30:00" 用前者；"你上次登录是 2 小时前" 用后者。
 *
 * 4. 常见陷阱
 *    (1) 不传 locale：和所有 Intl 构造器一样，会跟随运行环境默认 locale，
 *        CI 与客户机器结果不同。**永远显式传 locale**（本文件全部显式传）。
 *    (2) 是较新 API：旧 Node / 旧浏览器上 Intl.DurationFormat 是 undefined，
 *        直接 new 会抛 TypeError。**用前必须探测**，本文件第 1 节给出完整降级实现。
 *    (3) 传小数会抛 RangeError（Temporal 内部按整数处理），
 *        1.5 秒要先自己决定舍入方向再传秒/毫秒。
 *    (4) 混合正负号会抛 RangeError；全负号会被渲染成 "-1 hour, 30 minutes"
 *        （一个负号 + 绝对值序列），需要精确控制排版时建议自己拼 "-" 前缀。
 *    (5) 传入空对象 {} 会抛 TypeError；全 0 则返回**空字符串**（UI 上会空白）。
 *    (6) 拼错键名（如 minute 少个 s）**不报错**，只是静默少显示一段 —— 最隐蔽的坑。
 *    (7) digital 风格**不做单位换算**：{minutes:90} 得到 "0:90:00" 而不是 "1:30:00"。
 *    (8) 格式不合法（style: 'bogus'）抛 RangeError。
 *    (9) DurationFormat 的输出**不带"还剩"、"耗时"这类措辞**，也不带方向；
 *        那是你的文案表的职责，Intl 只负责"这段长度怎么写"。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 33_intl/09_intl_duration_format.js
 *
 * 【预期输出】
 *   分 10 个小节：特性探测、手写降级实现、基本用法、四种 style 对照表、formatToParts、
 *   与 RelativeTimeFormat 的分工、陷阱实证、原生 vs 降级逐项对照、
 *   实战封装（毫秒 -> 时长）、交付前检查清单。
 *   所有 Intl 调用都显式传 locale；凡随运行环境变化的值都标注 [环境相关]。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 特性探测：新 API 必须先问"在不在"
// ---------------------------------------------------------------------------

console.log('--- 0. 特性探测 ---');

// Intl.DurationFormat 是较新的构造器，Node 22 起才逐步可用（本机 Node 24 已支持）。
// 本目录 01_intl_overview.js 的构造器清单里列出了它，08_intl_best_practices.js 的
// OPTIONAL_APIS 表也只做了 typeof 探测 —— 本文件把它真正用起来，并补上完整降级路径。
const HAS_DURATION_FORMAT = typeof Intl.DurationFormat === 'function';
const HAS_RELATIVE_TIME = typeof Intl.RelativeTimeFormat === 'function';

console.log('[环境相关] Node 版本             =', process.version);
console.log('[环境相关] ICU 版本              =', process.versions.icu);
console.log('Intl.DurationFormat 可用吗       =', HAS_DURATION_FORMAT);
console.log('Intl.RelativeTimeFormat 可用吗   =', HAS_RELATIVE_TIME, '（对照组，见第 5 节）');

/**
 * 探测某个 DurationFormat 选项是否被当前运行时接受。
 * 同一个 API 的选项集合会随版本扩大（如 hoursDisplay 是后来加的），
 * 所以"构造器在"不等于"这个选项在"，要按选项探测（08 篇铁律五）。
 * @param {object} options 待测 options
 * @returns {boolean}
 */
function supportsDurationOptions(options) {
  if (!HAS_DURATION_FORMAT) return false;
  try {
    new Intl.DurationFormat('zh-CN', options);
    return true;
  } catch {
    return false;
  }
}

console.table([
  { 选项: '不传 options（默认 long）', 支持: supportsDurationOptions({}) },
  { 选项: 'style: "digital"', 支持: supportsDurationOptions({ style: 'digital' }) },
  { 选项: 'hoursDisplay: "always"', 支持: supportsDurationOptions({ hoursDisplay: 'always' }) },
  { 选项: 'fractionalDigits: 2', 支持: supportsDurationOptions({ fractionalDigits: 2 }) },
  { 选项: 'style: "bogus"（预期不支持）', 支持: supportsDurationOptions({ style: 'bogus' }) },
]);

/**
 * 安全构造 DurationFormat。不支持该 API（或选项非法）时返回 null，绝不抛错。
 * @param {string} locale BCP 47 语言标签（**必须显式传**）
 * @param {object} [options] DurationFormat 选项
 * @returns {Intl.DurationFormat|null}
 */
function safeDurationFormat(locale, options = {}) {
  if (!HAS_DURATION_FORMAT) return null;
  try {
    return new Intl.DurationFormat(locale, options);
  } catch (err) {
    console.log(`  构造 ${locale} ${JSON.stringify(options)} 失败：${err.constructor.name}: ${err.message}`);
    return null;
  }
}

if (HAS_DURATION_FORMAT) {
  console.log('\n本运行时支持 Intl.DurationFormat。resolvedOptions() 的完整内容：');
  console.log(JSON.stringify(safeDurationFormat('zh-CN', { style: 'long' }).resolvedOptions()));
  console.log('注意：返回的选项里**没有 timeZone** —— 时长不是时刻，不需要时区。');
} else {
  console.log('\n本运行时没有 Intl.DurationFormat —— 下列所有演示会自动走第 1 节的降级实现。');
}

// ---------------------------------------------------------------------------
// 1. 降级实现（先备好兜底，后面每一处调用都能安全回退）
// ---------------------------------------------------------------------------

console.log('\n--- 1. 手写降级实现 ---');

// 降级思路：**不要自己维护单位文案表**，而是借用已经有广泛支持的
// Intl.NumberFormat({ style: 'unit' })。它同样来自 CLDR，
// 能给出本地化的单位名（含复数变化）与本地数字系统，正好补上 DurationFormat 缺的那块。
// 于是降级实现 = "NumberFormat(unit) + 按语言拼接"。
//
// 各语言的"列表连接符"不同，而且**同一个语言在不同 style 下还会变**
// （en-US 的 narrow 是空格、short/long 是逗号）。这是唯一需要写死的一小块。
const LIST_SEPARATORS = {
  // locale: [long 风格, short 风格, narrow 风格]
  'zh-CN': ['', '', ''], // 中文：所有风格都直接连写「1小时30分钟」
  'ja-JP': ['', ' ', ''],
  'en-US': [', ', ', ', ' '], // narrow 只用空格：1h 30m 5s
  'de-DE': [', ', ', ', ', '],
  'fr-FR': [' ', ', ', ' '],
  'ar-EG': ['، و', '، و', ' و'], // 阿语：逗号 + 连接词；narrow 只剩连接词
  'he-IL': [' ו', ' ו', ' ו'],
  'fa-IR': [' و', ' و', ' و'],
};

/**
 * 取某个 locale 在某个 style 下的列表连接符，未知 locale 退回到 ', '/' '。
 * @param {string} locale BCP 47 标签
 * @param {'long'|'short'|'narrow'} [style] 风格
 * @returns {string}
 */
function separatorFor(locale, style = 'long') {
  const byStyle = LIST_SEPARATORS[locale];
  if (byStyle === undefined) return style === 'narrow' ? ' ' : ', ';
  return byStyle[{ long: 0, short: 1, narrow: 2 }[style] ?? 0];
}

// 单位顺序：从大到小，与 Intl 的输出顺序一致。
const UNIT_ORDER = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
  'nanoseconds',
];

// 单位名的单数形式（Intl.NumberFormat 的 unit 选项只接受单数）。
const UNIT_SINGULAR = {
  years: 'year',
  months: 'month',
  weeks: 'week',
  days: 'day',
  hours: 'hour',
  minutes: 'minute',
  seconds: 'second',
  milliseconds: 'millisecond',
  microseconds: 'microsecond',
  nanoseconds: 'nanosecond',
};

// style -> Intl.NumberFormat 的 unitDisplay。digital 走另一条分支。
const UNIT_DISPLAY = { long: 'long', short: 'short', narrow: 'narrow' };

/**
 * 从 Duration Record 里挑出"要显示的单位"（整数且非 0），按从大到小排序。
 * @param {object} duration 时长对象
 * @returns {string[]}
 */
function activeUnits(duration) {
  return UNIT_ORDER.filter((u) => Number.isInteger(duration[u]) && duration[u] !== 0);
}

/**
 * 手写的 DurationFormat 降级实现。
 * 与原生实现的差别只有"列表连接符"：单位文案与数字系统都来自 CLDR（NumberFormat）。
 * @param {object} duration 时长对象（整数、同号）
 * @param {string} locale BCP 47 标签（**必须显式传**）
 * @param {'long'|'short'|'narrow'|'digital'} [style] 风格
 * @returns {string}
 */
function formatDurationFallback(duration, locale, style = 'long') {
  // digital 风格：拼成 时:分:秒.毫秒，**不做单位换算**（与原生行为一致）。
  if (style === 'digital') {
    const pad = (n, w) => String(n).padStart(w, '0');
    const h = duration.hours ?? 0;
    const m = duration.minutes ?? 0;
    const s = duration.seconds ?? 0;
    const ms = duration.milliseconds ?? 0;
    let out = `${h}:${pad(m, 2)}:${pad(s, 2)}`;
    if (ms !== 0) out += `.${pad(ms, 3)}`;
    // 数字系统交给 NumberFormat：阿语要显示成 ١:٣٠:٠٥，而不是 1:30:05。
    const digit = new Intl.NumberFormat(locale, { useGrouping: false });
    return out.replace(/\d/g, (d) => digit.format(Number(d)));
  }

  const units = activeUnits(duration);
  if (units.length === 0) return '';

  const unitDisplay = UNIT_DISPLAY[style] ?? 'long';
  const pieces = units.map((u) =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: UNIT_SINGULAR[u],
      unitDisplay,
      useGrouping: false,
    }).format(duration[u]),
  );
  return pieces.join(separatorFor(locale, unitDisplay));
}

/**
 * 降级实现的 formatToParts 版本：产出与原生一致结构的 {type, unit, value} 数组。
 * @param {object} duration 时长对象
 * @param {string} locale BCP 47 标签
 * @param {'long'|'short'|'narrow'} [style] 风格
 * @returns {{type:string, unit?:string, value:string}[]}
 */
function formatDurationFallbackParts(duration, locale, style = 'long') {
  if (style === 'digital') {
    return [{ type: 'literal', value: formatDurationFallback(duration, locale, 'digital') }];
  }
  const unitDisplay = UNIT_DISPLAY[style] ?? 'long';
  const parts = [];
  activeUnits(duration).forEach((u, i) => {
    if (i > 0) parts.push({ type: 'literal', value: separatorFor(locale, unitDisplay) });
    for (const p of new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: UNIT_SINGULAR[u],
      unitDisplay,
      useGrouping: false,
    }).formatToParts(duration[u])) {
      if (p.type === 'unit') {
        parts.push({ type: 'unit', unit: u, value: p.value });
      } else if (p.type === 'literal') {
        parts.push({ type: 'literal', unit: u, value: p.value });
      } else {
        parts.push({ type: 'integer', unit: u, value: p.value });
      }
    }
  });
  return parts;
}

/**
 * 统一的渲染入口：有原生实现就用原生，没有就降级。
 * 这样调用方永远只写一行，不需要到处 if。
 * @param {object} duration 时长对象
 * @param {string} locale BCP 47 标签
 * @param {'long'|'short'|'narrow'|'digital'} [style] 风格
 * @returns {string}
 */
function renderDuration(duration, locale, style = 'long') {
  const fmt = safeDurationFormat(locale, { style });
  if (fmt) {
    try {
      return fmt.format(duration);
    } catch (err) {
      return `<${err.constructor.name}: ${err.message}>`;
    }
  }
  return formatDurationFallback(duration, locale, style);
}

console.log('降级实现的输出（缺少 DurationFormat 的运行时就是靠它工作的）：');
for (const locale of ['zh-CN', 'en-US', 'ar-EG']) {
  for (const style of ['long', 'short', 'narrow', 'digital']) {
    console.log(`  ${locale.padEnd(6)} ${style.padEnd(8)} -> ${formatDurationFallback({ hours: 1, minutes: 30, seconds: 5 }, locale, style)}`);
  }
}
console.log('  单位文案、复数形式、数字系统全部来自 Intl.NumberFormat（同源 CLDR），');
console.log('  唯一手写的是各语言的列表连接符 —— 这也是降级实现与原生唯一的差距来源。');

// ---------------------------------------------------------------------------
// 2. 基本用法：时长对象 + format
// ---------------------------------------------------------------------------

console.log('\n--- 2. 基本用法 ---');

const BASIC_LOCALES = ['zh-CN', 'en-US', 'ar-EG'];

// Duration Record 就是一个普通对象，键是单位名，值是该单位的**整数**个数。
// 没写的键当作"不存在"（不显示）。
const VIDEO_DURATION = { hours: 1, minutes: 30, seconds: 25 };

for (const locale of BASIC_LOCALES) {
  console.log(`  ${locale.padEnd(6)} long   -> ${renderDuration(VIDEO_DURATION, locale, 'long')}`);
}
console.log('  同一个 {hours:1,minutes:30,seconds:25}：中文直接连写、英文用逗号、阿语用连接词。');

for (const locale of BASIC_LOCALES) {
  console.log(`  ${locale.padEnd(6)} narrow -> ${renderDuration(VIDEO_DURATION, locale, 'narrow')}`);
}

// ---------------------------------------------------------------------------
// 3. 四种 style 的差异
// ---------------------------------------------------------------------------

console.log('\n--- 3. 四种 style 对照 ---');

const STYLES = ['long', 'short', 'narrow', 'digital'];
const DURATION = { hours: 1, minutes: 30, seconds: 5 };

console.log('时长 = {hours:1, minutes:30, seconds:5}');
console.table(
  STYLES.flatMap((style) =>
    BASIC_LOCALES.map((locale) => ({ style, locale, 结果: renderDuration(DURATION, locale, style) })),
  ),
);

console.log('读表要点：');
console.log('  long    -> 单位写全（"1 hour"），适合正文与提示文案');
console.log('  short   -> 单位缩写（"1 hr"），适合表格与卡片');
console.log('  narrow  -> 最短（"1h"），适合播放器角落、图标旁');
console.log('  digital -> "1:30:05"，只适合"钟表式"展示');
console.log('  阿拉伯语 ar-EG 四列都用**阿拉伯-印度数字**（١ ٢ ٣）：');
console.log('  这不是"格式错了"，而是该 locale 的默认数字系统，见 01 篇的 numberingSystem。');

console.log('\ndigital 的两条限制：');
// 限制一：不做单位换算。
console.log('  {minutes:90} ->', renderDuration({ minutes: 90 }, 'en-US', 'digital'),
  ' <- 90 分钟 = 1 小时 30 分，但 digital **不会自动进位**！');
console.log('  它只按你给的字段拼钟表，进位/换算是**你自己**的责任（见第 8 节 msToDuration）。');

// 限制二：小时位默认不补 0，要用 hours: '2-digit' 才补成 01:30:00。
console.log('  {hours:1,minutes:30} 默认             ->', renderDuration({ hours: 1, minutes: 30 }, 'en-US', 'digital'));
const digital2Digit = safeDurationFormat('en-US', { style: 'digital', hours: '2-digit' });
console.log('  {hours:1,minutes:30} hours:"2-digit"  ->',
  digital2Digit ? digital2Digit.format({ hours: 1, minutes: 30 }) : '01:30:00（降级实现可用 padStart 自己补）');
console.log('  {minutes:30} 默认                     ->', renderDuration({ minutes: 30 }, 'en-US', 'digital'),
  '（分钟、秒永远补 0，因为钟表要定宽）');

console.log('\n<unit>Display: "always" 让 0 值也出现（long 风格）：');
const minutesAlways = safeDurationFormat('en-US', { style: 'long', minutesDisplay: 'always' });
console.log('  {hours:1} 默认                 ->', renderDuration({ hours: 1 }, 'en-US', 'long'));
console.log('  {hours:1} minutesDisplay:always ->',
  minutesAlways ? minutesAlways.format({ hours: 1 }) : '1 hour, 0 minutes（降级实现可用 duration.minutes ?? 0 模拟）');

console.log('\n各大单位的完整渲染（long 风格）：');
const ALL_UNITS = {
  years: 1,
  months: 2,
  weeks: 3,
  days: 4,
  hours: 5,
  minutes: 6,
  seconds: 7,
  milliseconds: 8,
};
for (const locale of ['en-US', 'zh-CN']) {
  console.log(`  ${locale.padEnd(6)} -> ${renderDuration(ALL_UNITS, locale, 'long')}`);
}
console.log('  亚秒单位也能用（narrow，en-US）：',
  renderDuration({ milliseconds: 1, microseconds: 2, nanoseconds: 3 }, 'en-US', 'narrow'),
  '（μs / ns 取决于运行时的 CLDR 数据）');

// ---------------------------------------------------------------------------
// 4. formatToParts：把时长拆成可单独处理的片段
// ---------------------------------------------------------------------------

console.log('\n--- 4. formatToParts ---');

if (HAS_DURATION_FORMAT) {
  const fmt = safeDurationFormat('zh-CN', { style: 'long' });
  const parts = fmt.formatToParts({ hours: 1, minutes: 30 });
  console.log('formatToParts({hours:1,minutes:30}) @ zh-CN long =');
  console.table(parts.map((p, i) => ({ '#': i, type: p.type, unit: p.unit ?? '(无)', value: p.value })));
  console.log('  各片拼回去等于 format() 的结果吗？',
    parts.map((p) => p.value).join('') === fmt.format({ hours: 1, minutes: 30 }));

  // 实战：只把数字包上 <b> —— 单位文案交给 Intl，自己绝不拼单位。
  const highlighted = parts.map((p) => (p.type === 'integer' ? `<b>${p.value}</b>` : p.value)).join('');
  console.log('  只给数字加粗 ->', highlighted);

  console.log('\n  阿语的分片（unit 字段是英文 API 名，value 才是本地化文案）：');
  console.log('   ', JSON.stringify(safeDurationFormat('ar-EG', { style: 'long' }).formatToParts({ hours: 1, minutes: 30 })));
} else {
  console.log('  本运行时没有 Intl.DurationFormat，改用降级实现的 parts：');
  console.log('   ', JSON.stringify(formatDurationFallbackParts({ hours: 1, minutes: 30 }, 'zh-CN', 'long')));
  console.log('  结构与原生完全一致（type / unit / value），所以调用方代码不用改。');
}

// ---------------------------------------------------------------------------
// 5. 与 Intl.RelativeTimeFormat 的分工（最容易用错的邻居）
// ---------------------------------------------------------------------------

console.log('\n--- 5. DurationFormat vs RelativeTimeFormat ---');

// 一句话记住分工：
//   DurationFormat     = "**持续多久**"      —— 一个长度，不需要参照点
//   RelativeTimeFormat = "**多久以前/以后**" —— 一个位置，必须有参照点（现在 / 某个时刻）
console.log('对比一：刚看完的视频');
console.log('  视频时长     -> DurationFormat     "', renderDuration({ hours: 1, minutes: 30 }, 'zh-CN', 'long'), '"');
if (HAS_RELATIVE_TIME) {
  const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
  console.log('  上次观看时间 -> RelativeTimeFormat "', rtf.format(-1, 'day'), '" / "', rtf.format(-3, 'hour'), '"');
}

console.log('\n对比二：同一个数字 90，两个 API 说的话完全不同');
if (HAS_RELATIVE_TIME) {
  const rtfZh = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });
  const rtfEn = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  console.log('  DurationFormat     {minutes:90}  ->', renderDuration({ minutes: 90 }, 'zh-CN', 'long'), '（"90 分钟"这个长度）');
  console.log('  RelativeTimeFormat -90,"minute"  ->', rtfZh.format(-90, 'minute'), '（"90 分钟前"这个位置）');
  console.log('  RelativeTimeFormat  90,"minute"  ->', rtfZh.format(90, 'minute'), '（"90 分钟后"）');
  console.log('  en-US 同两条                     ->', rtfEn.format(-90, 'minute'), '/', rtfEn.format(90, 'minute'));
}

console.log('\n选错 API 的典型症状：');
console.log('  · 用 RelativeTimeFormat 做视频进度 -> 会得到"1 小时前"，而你想要的是"1 小时"。');
console.log('  · 用 DurationFormat 做"上次登录"   -> 会得到"2 天"，丢掉"前/后"这个关键信息。');
console.log('  · RelativeTimeFormat 负数=过去、正数=未来；DurationFormat 的方向靠你自己表达。');
console.log('  · 两者的单位名完全一致（"hour"/"minute"/"day"...），互相迁移时不用改单位名。');
console.log('  · 决定用哪个，只问一句话：这句话里有没有"相对于某个时刻"？有 -> RelativeTimeFormat。');

console.log('\nRelativeTimeFormat 的 numeric 选项（"昨天"还是"1 天前"）：');
if (HAS_RELATIVE_TIME) {
  for (const numeric of ['always', 'auto']) {
    const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric });
    console.log(`  numeric: '${numeric.padEnd(6)}' -> -1 day = ${rtf.format(-1, 'day')}, -2 day = ${rtf.format(-2, 'day')}`);
  }
  console.log('  numeric: "auto" 只在能被自然语言覆盖的值上换成词（昨天/明天），其余仍用数字。');
}

// ---------------------------------------------------------------------------
// 6. 陷阱实证：把每一类错误都跑一遍
// ---------------------------------------------------------------------------

console.log('\n--- 6. 陷阱实证 ---');

/**
 * 跑一次 format 并把结果或异常转成可读文本（演示报错必须 try/catch）。
 * @param {Intl.DurationFormat} fmt formatter
 * @param {object} duration 时长对象
 * @returns {string}
 */
function tryFormat(fmt, duration) {
  try {
    return `成功 -> ${JSON.stringify(fmt.format(duration))}`;
  } catch (err) {
    return `${err.constructor.name}: ${err.message}`;
  }
}

if (HAS_DURATION_FORMAT) {
  const probe = safeDurationFormat('en-US', { style: 'long' });

  console.log('陷阱一：小数抛 RangeError（内部按整数处理）');
  for (const d of [{ seconds: 1.5 }, { hours: 0.5 }, { minutes: 2.0001 }]) {
    console.log(`  ${JSON.stringify(d).padEnd(22)} -> ${tryFormat(probe, d)}`);
  }
  console.log('  正确做法：先自己决定舍入方向，再传整数。见第 8 节的 msToDuration()。');

  console.log('\n陷阱二：非零单位必须同号，混号抛 RangeError');
  for (const d of [{ hours: 1, minutes: -30 }, { hours: -1, minutes: 30 }]) {
    console.log(`  ${JSON.stringify(d).padEnd(26)} -> ${tryFormat(probe, d)}`);
  }
  console.log(`  ${JSON.stringify({ hours: -1, minutes: -30 })} -> ${tryFormat(probe, { hours: -1, minutes: -30 })}`);
  console.log('  全负号时 Intl 只输出一个 "-" 加绝对值序列，负号位置不保证符合你的排版；');
  console.log('  需要精确控制时建议：format(绝对值) 之后自己拼前缀。');

  console.log('\n陷阱三：一个单位都不给 -> TypeError；全 0 -> 空字符串');
  for (const d of [{}, undefined, null]) {
    console.log(`  format(${String(d)}) -> ${tryFormat(probe, d)}`);
  }
  console.log(`  format({hours:0,minutes:0}) -> ${tryFormat(probe, { hours: 0, minutes: 0 })}  <- 空字符串！`);
  console.log('  空字符串意味着界面上会出现一块空白，业务层要自己兜底（如换成"0 秒"）。');
  console.log(`  显式传 undefined 的键等价于"不传该键"：${tryFormat(probe, { hours: undefined, minutes: 30 })}`);

  console.log('\n陷阱四：Infinity 抛 RangeError，NaN 被当成 0');
  console.log(`  {hours: Infinity} -> ${tryFormat(probe, { hours: Infinity })}`);
  console.log(`  {hours: NaN}      -> ${tryFormat(probe, { hours: NaN })}`);

  console.log('\n陷阱五：非法的 style 抛 RangeError');
  try {
    new Intl.DurationFormat('en-US', { style: 'bogus' });
  } catch (err) {
    console.log(`  style: 'bogus' -> ${err.constructor.name}: ${err.message}`);
  }

  console.log('\n陷阱六：拼错的键名被静默忽略（不报错、只是少显示一段）');
  console.log(`  {hours:1, minute:30}（少了 s） -> ${tryFormat(probe, { hours: 1, minute: 30 })}`);
  console.log('  这是最隐蔽的一类 bug：数据没问题、代码不报错、界面上就是少一块。');
  console.log('  => 在接收后端数据的边界上用白名单校验键名，见第 8 节的 validateDuration()。');
} else {
  console.log('本运行时没有 Intl.DurationFormat，无法演示原生的报错行为。');
  console.log('降级实现的行为：小数会被 NumberFormat 四舍五入显示，空对象返回空字符串 ——');
  console.log('这正是"降级实现不会替你报错"的代价：错误被推迟到了肉眼检查。');
  console.log('  示例：', JSON.stringify(formatDurationFallback({}, 'en-US', 'long')), '（空对象 -> 空字符串）');
  console.log('  示例：', formatDurationFallback({ seconds: 1.5 }, 'en-US', 'long'), '（小数被静默保留成 1.5）');
}

console.log('\n陷阱七（与 API 无关，但最常见）：不传 locale');
console.log('  new Intl.DurationFormat(undefined, {style:"long"}) 会跟随运行环境默认 locale。');
console.log('  [环境相关] 本机默认 locale =', Intl.DateTimeFormat().resolvedOptions().locale);
console.log('  本文件所有调用都显式写了 locale，所以上面每一行的输出在任何机器上都一致。');

// ---------------------------------------------------------------------------
// 7. 与原生实现的逐项对照
// ---------------------------------------------------------------------------

console.log('\n--- 7. 原生 vs 降级：逐项对照 ---');

if (HAS_DURATION_FORMAT) {
  const rows = [];
  for (const locale of BASIC_LOCALES) {
    for (const style of STYLES) {
      const native = safeDurationFormat(locale, { style }).format(DURATION);
      const fallback = formatDurationFallback(DURATION, locale, style);
      rows.push({ locale, style, 原生: native, 降级: fallback, 一致: native === fallback ? '✓' : '差异' });
    }
  }
  console.table(rows);
  const same = rows.filter((r) => r.一致 === '✓').length;
  console.log(`  ${same}/${rows.length} 项完全一致。`);
  const diffs = rows.filter((r) => r.一致 !== '✓');
  if (diffs.length === 0) {
    console.log('  没有差异项 —— 因为**单位文案、复数变化、数字系统**都交给同源的');
    console.log('  Intl.NumberFormat 了，降级实现唯一自己写的是列表连接符（第 1 节那张小表）。');
  } else {
    console.log('  不一致的全部落在"列表连接符"上：');
    console.log('  原生用 CLDR 的列表模式（中文连写、英文 ", "、阿语 "، و"），');
    console.log('  降级实现用的是第 1 节那张手写的 LIST_SEPARATORS 表 —— 唯一无法靠 Intl 补齐的小块。');
  }
  console.log('  结论：降级实现覆盖绝大多数场景，且**单位文案与复数变化依然正确**，');
  console.log('        因为它把本地化工作转交给了同源的 Intl.NumberFormat，而不是自己维护文案表。');
} else {
  console.log('  本运行时没有原生 DurationFormat，无法对照。');
  console.log('  在支持的环境（Node 22+ / 新版浏览器）重跑本文件即可看到对照表。');
}

console.log('\n降级实现的数字系统也正确（阿语阿拉伯-印度数字）：');
console.log('  降级 digital @ ar-EG ->', formatDurationFallback(DURATION, 'ar-EG', 'digital'));
console.log('  降级 long    @ ar-EG ->', formatDurationFallback(DURATION, 'ar-EG', 'long'));

// ---------------------------------------------------------------------------
// 8. 实战封装：毫秒 <-> Duration Record，以及倒计时
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战封装 ---');

/**
 * 把毫秒数拆成 Duration Record（**整数**，向上取整到秒，避免小数抛错）。
 * @param {number} ms 毫秒数（非负）
 * @param {{ maxUnit?: 'days'|'hours'|'minutes'|'seconds', roundUp?: boolean }} [opts] 配置
 * @returns {object} Duration Record
 */
function msToDuration(ms, opts = {}) {
  const { maxUnit = 'hours', roundUp = false } = opts;
  if (!Number.isFinite(ms) || ms < 0) throw new RangeError(`毫秒数必须是非负有限数，收到：${ms}`);
  // 先整体量化到秒：这才是"自己决定舍入方向"的地方，而不是把它丢给 Intl 去抛错。
  let rest = (roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000)) * 1000;
  const out = {};
  let enabled = false;
  for (const [unit, size] of [
    ['days', 86400000],
    ['hours', 3600000],
    ['minutes', 60000],
    ['seconds', 1000],
  ]) {
    if (unit === maxUnit) enabled = true;
    if (!enabled) continue;
    const value = Math.floor(rest / size);
    if (value > 0) out[unit] = value;
    rest -= value * size;
  }
  return out;
}

/**
 * 校验一个对象是不是"干净的" Duration Record：只允许白名单键、值必须是整数、非零值同号。
 * 用来堵住第 6 节"陷阱六"（键名拼错被静默忽略）那个洞。
 * @param {object} duration 待校验对象
 * @param {string[]} [allowed] 允许的单位
 * @returns {string[]} 问题列表，空数组表示通过
 */
function validateDuration(duration, allowed = UNIT_ORDER) {
  if (duration === null || typeof duration !== 'object') return ['不是对象'];
  const problems = [];
  const keys = Object.keys(duration).filter((k) => duration[k] !== undefined);
  if (keys.length === 0) problems.push('至少要有一个单位（否则原生 format 抛 TypeError）');
  for (const key of keys) {
    if (!allowed.includes(key)) {
      problems.push(`未知单位 "${key}"（允许：${allowed.join(', ')}）`);
      continue;
    }
    if (!Number.isInteger(duration[key])) {
      problems.push(`"${key}" 必须是整数，收到 ${duration[key]}`);
    }
  }
  const values = keys.filter((k) => allowed.includes(k)).map((k) => duration[k]);
  if (values.some((v) => v > 0) && values.some((v) => v < 0)) problems.push('非零单位必须同号');
  return problems;
}

/**
 * 生产可用的时长格式化：校验 + 特性探测 + 降级全部封装在内。
 * @param {number|object} input 毫秒数，或已经是 Duration Record 的对象
 * @param {string} locale BCP 47 标签（**必须显式传**）
 * @param {'long'|'short'|'narrow'|'digital'} [style] 风格
 * @returns {string}
 */
function formatDuration(input, locale, style = 'short') {
  const duration = typeof input === 'number' ? msToDuration(input, { roundUp: true }) : input;
  // 全 0（空对象）要**先于校验**兜底：原生 format({}) 会抛 TypeError，
  // 而且空时长直接交给 Intl 也只会得到空字符串（见陷阱三）。
  if (duration !== null && typeof duration === 'object' && Object.keys(duration).length === 0) {
    return new Intl.NumberFormat(locale, { style: 'unit', unit: 'second', unitDisplay: 'short' }).format(0);
  }
  const problems = validateDuration(duration);
  if (problems.length > 0) throw new RangeError(`非法时长：${problems.join('；')}`);
  return renderDuration(duration, locale, style);
}

console.log('毫秒 -> Duration Record：');
for (const ms of [0, 1000, 90000, 5425000, 200000000]) {
  console.log(`  ${String(ms).padStart(10)} ms -> ${JSON.stringify(msToDuration(ms))}`);
}
console.log('  5425000ms ->', JSON.stringify(msToDuration(5425000)), '（正是 1 小时 30 分 25 秒）');
console.log('  0ms -> {} -> 交给 formatDuration 兜底成"0 秒"：', JSON.stringify(formatDuration(0, 'zh-CN')));

console.log('\n端到端：视频时长 / 任务耗时 / 播客剩余（roundUp 保证不会显示成 0）');
console.table(
  [
    ['视频总时长', 5425000],
    ['任务耗时', 133000],
    ['播客剩余', 725000],
  ].flatMap(([name, ms]) =>
    BASIC_LOCALES.map((locale) => ({
      场景: name,
      locale,
      long: formatDuration(ms, locale, 'long'),
      narrow: formatDuration(ms, locale, 'narrow'),
      digital: formatDuration(ms, locale, 'digital'),
    })),
  ),
);

console.log('\n倒计时场景：时长 + 目标时刻 一起展示');
// 这里同时用到 DurationFormat（还剩多久）与 DateTimeFormat（什么时候到）。
// DateTimeFormat **必须**显式传 timeZone，否则跨机器结果不同（08 篇铁律三）。
const NOW = new Date('2024-03-15T09:30:00Z');
const LAUNCH = new Date('2024-03-17T12:45:30Z');
const remainMs = LAUNCH.getTime() - NOW.getTime();
for (const [locale, timeZone] of [
  ['zh-CN', 'Asia/Shanghai'],
  ['en-US', 'America/New_York'],
  ['ar-EG', 'Africa/Cairo'],
]) {
  const remain = formatDuration(remainMs, locale, 'long');
  const at = new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'medium', timeStyle: 'short' }).format(LAUNCH);
  console.log(`  ${locale.padEnd(6)} 距开售还有 ${remain}（开售时间 ${at}）`);
}
console.log('  时长用 DurationFormat（不需要 timeZone），时刻用 DateTimeFormat（必须传 timeZone）。');

console.log('\n校验器拦住了这些坏数据（把静默错误变成明确报错）：');
for (const bad of [{ hour: 1, minutes: 30 }, { hours: 1.5 }, { hours: 1, minutes: -30 }, {}, null]) {
  console.log(`  ${JSON.stringify(bad).padEnd(30)} -> ${validateDuration(bad).join('；') || '通过'}`);
}
try {
  formatDuration({ hour: 1 }, 'zh-CN');
} catch (err) {
  console.log(`  formatDuration({hour:1}) -> ${err.constructor.name}: ${err.message}`);
}

// ---------------------------------------------------------------------------
// 9. 交付前检查清单
// ---------------------------------------------------------------------------

console.log('\n--- 9. Intl.DurationFormat 检查清单 ---');

console.table(
  [
    ['是否做了 typeof Intl.DurationFormat 探测？', '旧运行时会抛 TypeError，必须有降级分支'],
    ['是否显式传了 locale？', '绝不依赖运行环境默认值'],
    ['是否确认过"它不需要 timeZone"？', '时长与时区无关；同屏的 DateTimeFormat 则必须传'],
    ['传入的数值是否都是整数？', '小数抛 RangeError，先自己决定舍入'],
    ['非零单位是否同号？', '混号抛 RangeError；负号建议自己拼前缀'],
    ['是否处理了"全 0 -> 空字符串"？', 'UI 上要兜底成"0 秒"之类的文案'],
    ['键名是否经过白名单校验？', '拼错的键会被静默忽略，少显示且不报错'],
    ['需要"多久以前/以后"时是否换用了 RelativeTimeFormat？', '别把"位置"当"长度"来说'],
    ['digital 是否只用于时间单位？', '它不做单位换算，天/月/年混进去会得到奇怪的钟表'],
    ['降级实现是否仍走 Intl.NumberFormat(unit)？', '不要自己维护单位文案表，那会随 CLDR 腐化'],
  ].map(([检查项, 做法], i) => ({ '#': i + 1, 检查项, 做法 })),
);

console.log('\n本节结束。');
