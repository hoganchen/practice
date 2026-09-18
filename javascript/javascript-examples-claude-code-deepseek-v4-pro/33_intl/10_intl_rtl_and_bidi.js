/**
 * ============================================================================
 * 知识点：RTL 与双向文本（bidi）—— 排版方向、逻辑属性、以及 Intl 输出里的隐形字符
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】高级
 * 【前置知识】33_intl/07_intl_locale.js、33_intl/08_intl_best_practices.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    RTL（Right-To-Left，从右往左）是阿拉伯语、希伯来语、波斯语、乌尔都语等
 *    约 4 亿人的书写方向。但真实界面里从来不是"整页只有一种方向"：
 *    阿拉伯语页面里必然嵌着英文品牌名、URL、电话号码、代码片段，
 *    这些内容是从左往右的。**同一行文字里两种方向并存**，就是"双向文本（bidi）"。
 *    Unicode 为此定义了一套完整的排版算法（UAX #9，Unicode Bidi Algorithm，UBA），
 *    由操作系统 / 浏览器 / 字体排版引擎实现 —— **JS 语言本身不提供这个算法**。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 界面镜像：RTL 语言下，返回按钮要跑到右边、进度条要从右往左走、
 *        侧边栏要换到另一侧。用 margin-left 会写死方向，用 margin-inline-start 才自动翻转。
 *    (2) 字符串比较失效：Intl 的某些输出会夹带**不可见的方向控制字符**
 *        （U+200F RLM / U+200E LRM / U+061C ALM / U+2066..U+2069 隔离符）。
 *        把它们写进 JSON 或数据库再取出来，"看起来一模一样"的两个字符串 `===` 却是 false。
 *    (3) 排查困难：控制字符在日志、控制台、调试器里都不可见，
 *        两个字符串打出来完全一样，肉眼根本无法定位差异。
 *    (4) 拼写/匹配失败：用 `includes` / `startsWith` / 数据库 LIKE 做匹配时，
 *        多出来的一个隐形字符就足以让匹配失败，且不报错。
 *    (5) 数字与括号错位：在 RTL 段落里，`(123) 456` 的视觉位置与逻辑顺序不同，
 *        不加隔离符会渲染成 `456 (123)` 之类的错觉。
 *
 * 3. 核心语法要点
 *    (1) 判断方向：Intl.Locale.prototype.getTextInfo() 返回 { direction: 'ltr'|'rtl' }。
 *        注意它是**新增方法**，旧运行时上没有，用前要探测（见第 1 节）。
 *    (2) 方向控制字符分三类（都是"默认不可见"的格式字符）：
 *        · 标记类：U+200E LRM（从左往右标记）、U+200F RLM（从右往左标记）、
 *                  U+061C ALM（阿拉伯字母标记）
 *        · 嵌入/覆盖类（老式，已被隔离符取代）：U+202A LRE / U+202B RLE /
 *                  U+202D LRO / U+202E RLO，用 U+202C PDF 结束
 *        · 隔离类（现代推荐）：U+2066 LRI / U+2067 RLI / U+2068 FSI，用 U+2069 PDI 结束
 *          对应的 HTML 是 <bdi> / dir 属性 / unicode-bidi: isolate。
 *    (3) 逻辑顺序 vs 视觉顺序：**字符串里存的永远是逻辑顺序**（按输入/阅读的字符顺序），
 *        视觉顺序由排版引擎在渲染时计算。所以你永远不要自己 reverse 字符串。
 *    (4) 逻辑属性（CSS）：margin-inline-start / padding-inline-end / border-inline-start /
 *        inset-inline-start / text-align: start|end 会随 dir 自动翻转；
 *        margin-left / padding-right / left / text-align: left 则写死物理方向。
 *    (5) 清洗方法：`str.replace(/[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069]/g, '')`
 *        或更严格的 `\p{Cf}`（Unicode 格式字符类，ES2018 起支持 \p{} 转义）。
 *        **但清洗要分场景**：给人看的展示可以清，用于存储/比较的必须**统一策略**。
 *
 * 4. 常见陷阱
 *    (1) 以为 Intl 输出是"纯文本"：它是给人看的**富文本**，可能带控制字符。
 *        绝对不要拿它当数据库主键、缓存 key、去重依据、相等判断依据。
 *    (2) `trim()` 清不掉方向控制字符 —— 它们不是空白字符（不属于 WhiteSpace 属性）。
 *    (3) `JSON.stringify` 不会转义它们（它们是合法字符），所以 JSON 往返会**原样保留**，
 *        问题会一直被带到前端和数据库里。
 *    (4) `encodeURIComponent` 会把它们编成 %E2%80%8F，所以 URL 往返后依然存在。
 *    (5) `normalize('NFC')` 也不会去掉它们 —— 它们是格式字符，不是组合字符。
 *    (6) 手动 reverse 字符串"修方向"是错的：字符顺序变了，字符串就不相等了，
 *        而且数字会被拆开（"123" 变成 "321"）。
 *    (7) 只判断 `direction === 'rtl'` 就镜像整个界面：数字、代码块、图表坐标轴
 *        在 RTL 页面里通常仍要保持 LTR，需要局部隔离。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 33_intl/10_intl_rtl_and_bidi.js
 *
 * 【预期输出】
 *   分 8 个小节：方向控制字符清单、方向探测（Intl.Locale.getTextInfo）、
 *   逻辑属性 vs 物理属性、隐形字符扫描实证、"看起来一样但 === 不相等"实验、
 *   JSON/数据库/URL 往返与清洗策略取舍、数字与括号的混排问题、交付前检查清单。
 *   所有 Intl 调用都显式传 locale；随 ICU 版本变化的结果标注 [环境相关]。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 方向控制字符清单（后面反复用）
// ---------------------------------------------------------------------------

console.log('--- 0. 方向控制字符清单 ---');

// 这些字符都是 Unicode 的 Cf（Format，格式）类别：有语义、有宽度但不显形。
// 它们的存在本身就是"排版指令"，渲染器读取后不显示。
const BIDI_CONTROLS = {
  // 码点: [名字, 用途]
  0x200e: ['LRM  LEFT-TO-RIGHT MARK', '标记：强制此处按从左往右处理'],
  0x200f: ['RLM  RIGHT-TO-LEFT MARK', '标记：强制此处按从右往左处理'],
  0x061c: ['ALM  ARABIC LETTER MARK', '标记：阿拉伯语环境下的方向标记'],
  0x202a: ['LRE  LEFT-TO-RIGHT EMBEDDING', '嵌入（老式）：开始一段 LTR 嵌入'],
  0x202b: ['RLE  RIGHT-TO-LEFT EMBEDDING', '嵌入（老式）：开始一段 RTL 嵌入'],
  0x202c: ['PDF  POP DIRECTIONAL FORMATTING', '嵌入（老式）：结束最近一次嵌入/覆盖'],
  0x202d: ['LRO  LEFT-TO-RIGHT OVERRIDE', '覆盖（老式）：强制 LTR，忽略字符自身方向'],
  0x202e: ['RLO  RIGHT-TO-LEFT OVERRIDE', '覆盖（老式）：强制 RTL —— 常被用于文件名伪装攻击'],
  0x2066: ['LRI  LEFT-TO-RIGHT ISOLATE', '隔离（现代）：开始一段 LTR 隔离区'],
  0x2067: ['RLI  RIGHT-TO-LEFT ISOLATE', '隔离（现代）：开始一段 RTL 隔离区'],
  0x2068: ['FSI  FIRST STRONG ISOLATE', '隔离（现代）：开始隔离区，方向由首个强方向字符决定'],
  0x2069: ['PDI  POP DIRECTIONAL ISOLATE', '隔离（现代）：结束最近一次隔离'],
};

console.table(
  Object.entries(BIDI_CONTROLS).map(([cp, [name, purpose]]) => ({
    码点: `U+${Number(cp).toString(16).toUpperCase().padStart(4, '0')}`,
    名称: name,
    用途: purpose,
  })),
);

// 汇总成一条正则，供后面反复使用。注意这是"方向控制字符"的完整集合。
const BIDI_RE = /[\u200E\u200F\u061C\u202A-\u202E\u2066-\u2069]/g;

console.log('提示：HTML/CSS 里有 <bdi> 元素、dir 属性、unicode-bidi: isolate 三种等价手段，');
console.log('      它们对应的正是 LRI/RLI/FSI/PDI 这一组"隔离符"。');

// ---------------------------------------------------------------------------
// 1. 方向探测：Intl.Locale.getTextInfo()
// ---------------------------------------------------------------------------

console.log('\n--- 1. 判断语言的书写方向 ---');

// 07_intl_locale.js 只打印过一行 getTextInfo().direction，这里把它讲透。
// 注意 getTextInfo 是较新的方法（Node 18+），旧运行时上是 undefined，必须先探测。
const HAS_TEXT_INFO = typeof Intl.Locale.prototype.getTextInfo === 'function';
const HAS_WEEK_INFO = typeof Intl.Locale.prototype.getWeekInfo === 'function';
console.log('Intl.Locale.prototype.getTextInfo 可用吗 =', HAS_TEXT_INFO);
console.log('Intl.Locale.prototype.getWeekInfo 可用吗 =', HAS_WEEK_INFO, '（顺带看看，同理）');

/**
 * 探测某个 locale 的书写方向。无 getTextInfo 时用一段兜底逻辑：
 * 判断该语言是否属于 RTL 语言族（这属于"实在没有 API 时的最后手段"）。
 * @param {string} tag BCP 47 标签
 * @returns {'ltr'|'rtl'|'unknown'}
 */
function textDirection(tag) {
  if (HAS_TEXT_INFO) {
    try {
      return new Intl.Locale(tag).getTextInfo().direction;
    } catch {
      return 'unknown';
    }
  }
  // 降级：RTL 语言的短名清单（ISO 639-1）。真实项目里应该引入 CLDR 数据，别手写这张表。
  const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 'dv', 'ku', 'ckb']);
  const lang = String(tag).toLowerCase().split(/[-_]/)[0];
  return RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';
}

// 挑一批有代表性的语言：RTL 三巨头 + 少数 RTL 语言 + 常见 LTR 语言做对照。
const LOCALES_BY_DIRECTION = [
  'ar-EG', // 阿拉伯语（埃及）
  'ar-SA', // 阿拉伯语（沙特）
  'he-IL', // 希伯来语
  'fa-IR', // 波斯语
  'ur-PK', // 乌尔都语
  'ckb-IQ', // 中库尔德语
  'zh-CN', // 中文
  'en-US', // 英语
  'de-DE', // 德语
  'ja-JP', // 日语
];

console.table(
  LOCALES_BY_DIRECTION.map((tag) => ({
    locale: tag,
    方向: textDirection(tag),
    '该 locale 有数据吗': Intl.DateTimeFormat.supportedLocalesOf([tag]).length > 0,
    '本地化语言名（zh-CN）': (() => {
      try {
        return new Intl.DisplayNames(['zh-CN'], { type: 'language' }).of(tag);
      } catch {
        return '(DisplayNames 不可用)';
      }
    })(),
  })),
);
console.log('  => 界面镜像的判断依据是**方向**，不是"语言是不是阿拉伯语"。');
console.log('     例如 ckb-IQ（库尔德语）和 he-IL（希伯来语）同样要 RTL，别只盯 ar-*。');

console.log('\n注意：一个 locale 里也可能混用方向。例如阿语区的数字、URL 仍是 LTR：');
// 用一段"阿语 + 英文 URL"的混合文本来演示（下面第 8 节会详讲混排）。
const mixedSample = `الرابط هو https://example.com/a/b  للمزيد`;
console.log('  样本（逻辑顺序） =', JSON.stringify(mixedSample));
console.log('  含方向控制字符吗 =', BIDI_RE.test(mixedSample), '（没有 —— 这段混排完全靠 Unicode 的隐式算法）');
BIDI_RE.lastIndex = 0; // 带 g 标志的正则会被 test 推进 lastIndex，必须复位
console.log('  => 混合方向**不需要**手写控制字符，算法会自动处理；');
console.log('     只有在"自动结果不符合预期"时才需要显式加隔离符（见第 8 节）。');

// ---------------------------------------------------------------------------
// 2. 逻辑属性 vs 物理属性
// ---------------------------------------------------------------------------

console.log('\n--- 2. 逻辑属性 vs 物理属性 ---');

// 这是 RTL 适配里最容易做错、也最容易做对的一块：
// 物理属性写死"左/右"，逻辑属性写"起始/结束"，由 dir 决定实际落到哪一侧。
const CSS_MAPPING = [
  ['margin-left: 8px', 'margin-inline-start: 8px', '左边距 -> 起始侧边距'],
  ['margin-right: 8px', 'margin-inline-end: 8px', '右边距 -> 结束侧边距'],
  ['padding-left', 'padding-inline-start', '左内边距 -> 起始侧内边距'],
  ['border-right', 'border-inline-end', '右边框 -> 结束侧边框'],
  ['left: 0', 'inset-inline-start: 0', '定位偏移 -> 起始侧偏移'],
  ['right: 0', 'inset-inline-end: 0', '定位偏移 -> 结束侧偏移'],
  ['text-align: left', 'text-align: start', '文本左对齐 -> 起始侧对齐'],
  ['text-align: right', 'text-align: end', '文本右对齐 -> 结束侧对齐'],
  ['width / height', 'inline-size / block-size', '宽高 -> 行内尺寸 / 块尺寸'],
  ['float: left', 'float: inline-start', '浮动 -> 起始侧浮动'],
];

console.table(CSS_MAPPING.map(([物理, 逻辑, 说明]) => ({ 物理属性: 物理, 逻辑属性: 逻辑, 说明 })));

console.log('同样的思想在别处也有对应物：');
console.table([
  { 场景: 'HTML 元素方向', 物理写法: '（无，靠 CSS 反向）', 逻辑写法: '<div dir="rtl"> / <bdi> / <html dir>', 说明: 'dir 属性是整套逻辑属性的"开关"' },
  { 场景: '图标方向', 物理写法: 'arrow-left.svg', 逻辑写法: 'arrow-start.svg + CSS 镜像', 说明: 'RTL 下"返回"箭头要朝右' },
  { 场景: '动画进度', 物理写法: 'translateX(-100%)', 逻辑写法: 'translateX(calc(-100% * var(--dir)))', 说明: '进度条方向要跟着翻转' },
  { 场景: '文本截断', 物理写法: 'text-overflow: ellipsis', 逻辑写法: '同左 + dir 感知的截断侧', 说明: '省略号该出现在哪一侧由方向决定' },
  { 场景: '数据表格', 物理写法: 'align="left"', 逻辑写法: 'align="start"', 说明: '表头对齐要跟随语言' },
].map((r) => r));

console.log('\n一条实用规则：**新代码里不要出现 left / right，只写 start / end**。');
console.log('  例外（必须用物理属性的场合）：');
console.log('    · 数字、代码块、图表坐标轴 —— 这些内容在 RTL 页面里通常仍保持 LTR；');
console.log('    · 与物理世界绑定的东西（蓝牙图标位置、摄像头取景框）；');
console.log('    · 与第三方组件库对接、它只认物理属性时的桥接层。');
console.log('  这时用 dir="ltr" 或 isolation（U+2066/U+2069）把内容**局部隔离**，而不是整页反转。');

console.log('\n一个 JS 层面最直接的体现：字符串的"起点"没有物理含义。');
const rtlText = 'مرحبا';
const ltrText = 'hello';
console.log('  阿语 "مرحبا" 的**逻辑**首字符 =', JSON.stringify(rtlText[0]),
  '，但它在屏幕上显示在最**右**边。');
console.log('  英语 "hello" 的逻辑首字符 =', JSON.stringify(ltrText[0]), '，显示在最左边。');
console.log('  => 所以 `str[0]` 是"逻辑首字符"，不是"视觉最左边的字符"。');
console.log('     做"显示前 N 个字符"这类需求时，必须让排版引擎处理，不要自己按索引切。');

// ---------------------------------------------------------------------------
// 3. 核心实证：Intl 的输出会夹带不可见的方向控制字符
// ---------------------------------------------------------------------------

console.log('\n--- 3. 实证：Intl 输出里的隐形字符 ---');

/**
 * 扫描一个字符串里所有方向控制字符。
 * @param {string} s 待扫描字符串
 * @returns {{index:number, codePoint:string, name:string}[]} 命中列表
 */
function findBidiControls(s) {
  const hits = [];
  let i = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (BIDI_CONTROLS[cp] !== undefined) {
      hits.push({ index: i, codePoint: `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`, name: BIDI_CONTROLS[cp][0].split(' ')[0] });
    }
    i += ch.length;
  }
  return hits;
}

/**
 * 把不可见字符替换成可见标签，便于在日志里肉眼排查。
 * @param {string} s 待处理字符串
 * @returns {string}
 */
function escapeBidi(s) {
  return s.replace(BIDI_RE, (ch) => `⟦${(BIDI_CONTROLS[ch.codePointAt(0)] ?? ['?'])[0].split(' ')[0]}⟧`);
}

const FIXED_INSTANT = new Date('2024-03-15T09:30:00Z');

// 批量扫描：同一批 Intl 调用，看哪些会带出控制字符。
// 结果与 ICU 版本强相关（本机 ICU 78.3），所以整体标注 [环境相关]。
const SCAN_CASES = [
  ['DateTimeFormat ar-EG dateStyle:full', () => new Intl.DateTimeFormat('ar-EG', { timeZone: 'UTC', dateStyle: 'full' }).format(FIXED_INSTANT)],
  ['DateTimeFormat ar-EG dateStyle:short+timeStyle:short', () => new Intl.DateTimeFormat('ar-EG', { timeZone: 'UTC', dateStyle: 'short', timeStyle: 'short' }).format(FIXED_INSTANT)],
  ['NumberFormat ar-EG currency USD', () => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'USD' }).format(1234.5)],
  ['NumberFormat ar-EG currency ILS', () => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'ILS' }).format(1234.5)],
  ['NumberFormat ar-EG percent', () => new Intl.NumberFormat('ar-EG', { style: 'percent' }).format(0.25)],
  ['NumberFormat ar-EG 普通数字', () => new Intl.NumberFormat('ar-EG').format(1234567.89)],
  ['NumberFormat he-IL currency USD', () => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'USD' }).format(1234.5)],
  ['NumberFormat fa-IR currency USD', () => new Intl.NumberFormat('fa-IR', { style: 'currency', currency: 'USD' }).format(1234.5)],
  ['NumberFormat fa-IR unit km/h', () => new Intl.NumberFormat('fa-IR', { style: 'unit', unit: 'kilometer-per-hour' }).format(12.5)],
  ['ListFormat fa-IR', () => new Intl.ListFormat('fa-IR', { type: 'conjunction' }).format(['الف', 'ب', 'ج'])],
  ['RelativeTimeFormat ar-EG -1 day', () => new Intl.RelativeTimeFormat('ar-EG').format(-1, 'day')],
  ['DurationFormat ar-EG long', () => new Intl.DurationFormat('ar-EG', { style: 'long' }).format({ hours: 1, minutes: 30 })],
  ['DateTimeFormat zh-CN dateStyle:full', () => new Intl.DateTimeFormat('zh-CN', { timeZone: 'UTC', dateStyle: 'full' }).format(FIXED_INSTANT)],
  ['NumberFormat zh-CN currency USD', () => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'USD' }).format(1234.5)],
  ['NumberFormat en-US currency USD', () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(1234.5)],
  ['NumberFormat en-US percent', () => new Intl.NumberFormat('en-US', { style: 'percent' }).format(0.25)],
];

console.log('[环境相关] 以下扫描结果由运行时的 ICU 数据决定（本机 ICU ' + process.versions.icu + '）：');
const scanRows = SCAN_CASES.map(([label, make]) => {
  let value;
  try {
    value = make();
  } catch (err) {
    value = '';
    label += ` [${err.constructor.name}]`;
  }
  const hits = findBidiControls(value);
  return {
    调用: label,
    '隐形字符数': hits.length,
    明细: hits.map((h) => h.name).join(', ') || '-',
    '长度 / 可见字符数': `${value.length} / ${value.length - hits.length}`,
  };
});
console.table(scanRows);

const hitRows = scanRows.filter((r) => r['隐形字符数'] > 0);
console.log(`  命中 ${hitRows.length} / ${scanRows.length} 项。观察到的规律：`);
console.log('  · **货币格式**几乎必然带方向标记：阿拉伯语/希伯来语的 "$" 在 RTL 里是"中性字符"，');
console.log('    ICU 会插入 RLM/LRM 告诉渲染器它该贴在哪一侧；');
console.log('  · **短日期 + 时间**（short+short）带 RLM，因为其中的 "/" 与 ":" 是中性字符，');
console.log('    不加标记就会在 RTL 上下文里"跳位"；');
console.log('  · 中文（zh-CN）与英语（en-US）的输出**一个都没有** —— 所以这个 bug 只在');
console.log('    多语言上线后才暴露，本地开发（zh-CN）永远测不出来；');
console.log('  · 同一种语言的 full 日期风格可能没有、short 风格却有 —— 取决于 ICU 的具体实现。');
console.log('  => 结论：**不要靠记忆判断哪一段有没有隐形字符，要在代码里探测**。');

console.log('\n把其中两项打印出来看看（注意：下面这些方括号是"看得见的"，原字符串里没有）：');
for (const [label, make] of [SCAN_CASES[2], SCAN_CASES[1]]) {
  const value = make();
  console.log(`  ${label}`);
  console.log(`    原样输出   : ${value}`);
  console.log(`    转义后输出 : ${escapeBidi(value)}`);
  console.log(`    码点序列   : ${[...value].map((c) => c.codePointAt(0).toString(16).padStart(4, '0')).join(' ')}`);
}

// ---------------------------------------------------------------------------
// 4. "看起来一样，但 === 不相等"
// ---------------------------------------------------------------------------

console.log('\n--- 4. 看起来一样，=== 却是 false ---');

// 先做一组**与运行环境无关**的确定性实验：手工造出带控制字符的字符串。
const RLM = '\u200F';
const plain = '1,234.50';
const withRlm = `${RLM}1,234.50${RLM}`;

console.log('构造两个字符串：');
console.log(`  plain    = ${plain}`);
console.log(`  withRlm  = ${withRlm}      <- 屏幕上和上面完全一样`);
console.log('  相等吗？           ', plain === withRlm);
console.log('  length 分别是      ', plain.length, '/', withRlm.length, '  <- 长度已经暴露了差异');
console.log('  JSON 后相等吗？    ', JSON.stringify(plain) === JSON.stringify(withRlm));
console.log('  trim() 后相等吗？  ', plain.trim() === withRlm.trim(), ' <- trim 清不掉，它们不是空白字符');
console.log('  NFC 规范化后相等？ ', plain.normalize('NFC') === withRlm.normalize('NFC'), ' <- 它们不是组合字符');
console.log('  去空格去零宽后相等？', plain.replace(/\s/g, '').replace(/\u200B/g, '') === withRlm.replace(/\s/g, '').replace(/\u200B/g, ''), ' <- 换个清理正则就露馅');
console.log('  用 stripBidi 清洗后相等？', plain === stripBidi(withRlm), ' <- 唯一正确的做法');

/**
 * 去掉所有方向控制字符。**只用于"给人看"或"做比较"**，不要无条件用于存储。
 * @param {string} s 待清洗字符串
 * @returns {string}
 */
function stripBidi(s) {
  if (typeof s !== 'string') return s;
  // reset lastIndex：带 g 标志的正则对象在 replace 里不受影响，但为保险起见统一复位。
  BIDI_RE.lastIndex = 0;
  return s.replace(BIDI_RE, '');
}

console.log('\n再拿**真实的 Intl 输出**做一遍（结果依赖 ICU 版本，标注 [环境相关]）：');
const arCurrency = new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'USD' }).format(1234.5);
const arCurrencyClean = stripBidi(arCurrency);
console.log('  Intl 输出     :', arCurrency);
console.log('  清洗后        :', arCurrencyClean);
console.log('  相等吗？      ', arCurrency === arCurrencyClean, '  <- 视觉上完全一样');
console.log('  length 分别是 ', arCurrency.length, '/', arCurrencyClean.length);
console.log('  用清洗后的去查"清洗后"当然是 true：', arCurrencyClean === stripBidi(arCurrency));
console.log('  但混用（一边清洗一边没清洗）就一定失败：', arCurrency === arCurrencyClean);

console.log('\n这在工程上会以什么形式爆炸：');
// 场景一：Set / Map 去重
const seen = new Set([arCurrency]);
console.log('  场景一 Set 去重：new Set([Intl输出]).has(清洗后的同一段文本) ->', seen.has(arCurrencyClean));
// 场景二：startsWith / includes —— 边界上的隐形字符让"前缀匹配"直接失败
console.log('  场景二 startsWith：Intl输出.startsWith(清洗后的同一段文本) ->', arCurrency.startsWith(arCurrencyClean));
console.log('          includes  ：Intl输出.includes(清洗后的同一段文本)   ->', arCurrency.includes(arCurrencyClean),
  '（这里是 true —— 因为多出来的字符只在前缀，子串匹配不受影响）');
console.log('          所以"隐形字符在开头/结尾"时，includes 会给你一个**看似正常**的结果，');
console.log('          但 startsWith / 数据库前缀索引 / 排序键全都会失败 —— 更难排查。');
// 场景三：两套"相等性"给出相反答案 —— 这是最阴的一类 bug
const collatorSays = new Intl.Collator('ar-EG').compare(arCurrency, arCurrencyClean);
console.log('  场景三 相等比较：Collator.compare(Intl输出, 清洗后的文本) ->', collatorSays);
console.log('    Collator 说 0（排序上等价）：方向标记是可忽略字符，排序时被跳过；');
console.log('    但 === 说是 false（字符串不同）。');
console.log('    => 同一对字符串，**排序 API 与相等 API 给出相反答案**：');
console.log('       用 Set 去重会留下两条，用 Collator 排序又认为它们并列 —— 排序结果不稳定。');
// 场景四：数据库唯一索引
console.log('  场景四 唯一索引：INSERT 两条"看起来一样"的记录 -> 数据库认为是两行，产生重复数据。');
console.log('  场景五 用户搜索：用户复制粘贴出来的文本通常**已经丢掉了**控制字符，');
console.log('         于是"复制粘贴搜索不到"成为客服工单里最经典的一类问题。');

// ---------------------------------------------------------------------------
// 5. JSON / 数据库 / URL 往返：它们都不会帮你清掉
// ---------------------------------------------------------------------------

console.log('\n--- 5. 各种"往返"对隐形字符的态度 ---');

console.log('结论先行：JSON、URL、数据库、文件，**全都原样保留**这些字符。');
console.log('');

// JSON 往返：完全保留。
const jsonRoundTrip = JSON.parse(JSON.stringify(arCurrency));
console.log('  JSON.stringify -> JSON.parse 后还相等吗？',
  jsonRoundTrip === arCurrency,
  '（JSON 里它们就是普通字符，不会被转义成 \\u200f）');
console.log('  JSON 文本长这样（注意看不见的部分）:', JSON.stringify(JSON.stringify(arCurrency)));
console.log('  转义给日志看:', JSON.stringify(escapeBidi(jsonRoundTrip)));

// URL 往返：编码成百分号序列，原样回来。
const urlEncoded = encodeURIComponent(arCurrency);
console.log('');
console.log('  encodeURIComponent 后会变成 %E2%80%8F:', urlEncoded.includes('%E2%80%8F'),
  '（即 U+200F 的 UTF-8 编码）');
console.log('  decodeURIComponent 往返后还相等吗？', decodeURIComponent(urlEncoded) === arCurrency);

// CSV / 日志：肉眼不可见。
console.log('');
console.log('  写进 CSV 后再读回来：字节完全一致，肉眼对比两行文本时都是"一模一样"。');
console.log('  写进日志后 grep：grep 用的也是字节匹配，所以要搜"UI\u200F/"这种带标记的串会搜不到。');

console.log('\n正确的做法是把"清洗"放在**边界**上，并且全局统一：');
const COMPARE_RULES = [
  ['作为展示文本', '可以保留', '渲染引擎需要这些标记才能正确换行/贴边，清掉反而会显示错位'],
  ['作为比较 / 去重 / 缓存 key', '必须清洗', '统一用 canonicalKey()，且输入输出两侧都用'],
  ['作为数据库字段', '看用途', '展示字段可保留；做业务主键/唯一索引的字段必须清洗'],
  ['作为日志', '推荐清洗', '否则排查时"看起来一样的两行"永远对不上'],
  ['作为 URL 参数', '推荐清洗', '体积更小，且避免复制粘贴时被中间层剥掉造成不一致'],
];

/**
 * 生成"用于比较"的规范形式：清洗方向控制字符 + 去除首尾空白 + NFC 规范化。
 * 这是做 key / 索引 / 去重的推荐入口。
 * @param {string} s 原始字符串
 * @returns {string}
 */
function canonicalKey(s) {
  return stripBidi(String(s)).trim().normalize('NFC');
}

console.table(COMPARE_RULES.map(([场景, 策略, 理由]) => ({ 场景, 策略, 理由 })));
console.log('  canonicalKey(Intl输出) === canonicalKey(清洗后的文本) ->',
  canonicalKey(arCurrency) === canonicalKey(arCurrencyClean));
console.log('  canonicalKey 内部顺序很重要：先清洗再 trim 再 NFC，');
console.log('  否则"控制字符 + 空格"的组合会残留（trim 不认识控制字符，见第 4 节）。');

console.log('\n顺带一个同样常见的"隐形字符家族"（成因不同，但症状一模一样）：');
console.table([
  { 码点: 'U+200B', 名称: 'ZWSP 零宽空格', 典型来源: '从网页/PDF 复制文本', 清理方式: '显式列入黑名单' },
  { 码点: 'U+FEFF', 名称: 'ZWNBSP / BOM', 典型来源: 'Windows 记事本存的 UTF-8 文件、Excel 导出的 CSV', 清理方式: '读文件时 strip 首字符' },
  { 码点: 'U+00A0', 名称: 'NBSP 不换行空格', 典型来源: '网页复制、法语排版、Intl 货币格式', 清理方式: '· 替换成普通空格' },
  { 码点: 'U+2028/2029', 名称: '行分隔符 / 段分隔符', 典型来源: 'JSON 里的多行文本、富文本编辑器', 清理方式: '· 替换成 \\n' },
  { 码点: 'U+00AD', 名称: 'SHY 软连字符', 典型来源: '排版引擎的自动断词', 清理方式: '· 显式去除' },
].map((r) => r));
console.log('  统一思路：**凡是"有语义但不显形"的字符，都会造成同类 bug**。');
console.log('  要一次扫干净可以用 Unicode 类别：/\\p{Cf}/gu（格式字符，ES2018 起支持）。');
const allControlDemo = `${RLM}1\u200B2\uFEFF3\u00A04\u00AD5`;
console.log('  样本:', JSON.stringify(escapeBidi(allControlDemo)));
console.log('  只清方向控制 /[\\u200E\\u200F\\u061C\\u202A-\\u202E\\u2066-\\u2069]/g ->', JSON.stringify(allControlDemo.replace(BIDI_RE, '')));
BIDI_RE.lastIndex = 0;
console.log('  \\p{Cf}（同时清掉 ZWSP 与 BOM，但保留 NBSP 软连字符）         ->', JSON.stringify(allControlDemo.replace(/\p{Cf}/gu, '')));
console.log('  再叠一次 [\\s\\u00A0\\u00AD] ->', JSON.stringify(allControlDemo.replace(/\p{Cf}/gu, '').replace(/[\s\u00A0\u00AD]+/g, '')));
console.log('  => 没有"万能清洗函数"：要先想清楚"哪些字符对业务是有意义的"。');
console.log('     例如 NBSP 在法语排版里是**必须**的（"12 000" 的千分位就是 NBSP），清掉会破坏排版。');

// ---------------------------------------------------------------------------
// 6. 数字与括号的混排问题
// ---------------------------------------------------------------------------

console.log('\n--- 6. RTL 下的数字 / 标点 / 括号混排 ---');

// 这是 bidi 里最反直觉的部分。核心事实有三条：
//   (1) 数字（欧洲数字 0-9）在 UBA 里是 **EN（European Number）**，属于"弱方向"，
//       它在视觉上**永远从左往右排**，但它在整行中的**位置**由上下文段落方向决定。
//   (2) 标点（. , : / ( ) 等）大多是 **中性字符（Neutral）**，
//       它们最终偏向哪一侧，取决于它左右两边的强方向字符 —— 这叫"中性字符的解析"。
//   (3) 括号（( ) [ ] { } < > « »）除了是中性字符，还带 **Bidi_Mirrored 属性**：
//       在 RTL 段落里渲染器会把字形**镜像**显示，U+0028 "(" 画成 ")"。
console.log('事实一：数字是"弱方向"字符 —— 它自己从左往右排，但整体位置听段落方向。');
console.log('  逻辑顺序 "العنصر 123 من"：数字 123 内部仍是 1-2-3，不会被倒过来。');
console.log('  这就是为什么"手动反转整个字符串"必然出错：');
const logical = 'العنصر 123 من';
const reversed = [...logical].reverse().join('');
console.log('    逻辑顺序:', JSON.stringify(logical));
console.log('    手动反转:', JSON.stringify(reversed));
console.log('    两者相等吗？', logical === reversed, ' <- 字符集合一样，顺序完全不同，比较必然失败');
console.log('    数字也毁了:', JSON.stringify(reversed.match(/\d+/)?.[0]), '（123 变成了 321）');
console.log('  => 绝对不要用 reverse() 来"修方向"。视觉顺序由排版引擎计算，不由你计算。');

console.log('\n事实二：标点是"中性字符"，位置由左右的强方向字符决定。');
console.log('  经典现象：RTL 段落末尾的句号会"跑到左边"。');
const rtlSentence = 'هذا نص عربي.'; // 逻辑顺序：阿语文本 + 句点
console.log('    逻辑顺序:', JSON.stringify(rtlSentence), '（句点在最后）');
console.log('    视觉上，句点会显示在这一行的**最左端** —— 因为 RTL 段落里"行尾"在左边。');
console.log('    这不是 bug，是 UBA 的正确行为；但会让"拼接字符串"的人算错位置。');

console.log('\n事实三：括号带 Bidi_Mirrored 属性，在 RTL 里字形会被镜像。');
// 这里用一个手写的镜像表来演示"哪个字符会被画成什么"。
// 注意：**码点是同一个**，镜像只发生在渲染阶段 —— 这也是为什么字符串比较不会报错，
// 但人眼看到的和代码里写的不一样，沟通与排查会极其困难。
const MIRROR_PAIRS = [
  ['(', ')'],
  ['[', ']'],
  ['{', '}'],
  ['<', '>'],
  ['«', '»'],
  ['‹', '›'], // ‹ ›
];
/**
 * 演示"在 RTL 上下文里，这个字符会被画成哪一个字形"。
 * @param {string} ch 单个字符
 * @returns {string} 视觉上呈现的字符（无镜像属性则返回自身）
 */
function mirroredGlyph(ch) {
  for (const [a, b] of MIRROR_PAIRS) {
    if (ch === a) return b;
    if (ch === b) return a;
  }
  return ch;
}
console.table(
  MIRROR_PAIRS.flatMap(([a, b]) => [
    { 逻辑字符: a, 码点: `U+${a.codePointAt(0).toString(16).toUpperCase()}`, 'LTR 里显示为': a, 'RTL 里显示为': mirroredGlyph(a) },
    { 逻辑字符: b, 码点: `U+${b.codePointAt(0).toString(16).toUpperCase()}`, 'LTR 里显示为': b, 'RTL 里显示为': mirroredGlyph(b) },
  ]),
);
console.log('  => 结论：在 RTL 页面里，逻辑字符串 "(1)" 画出来是 "(1)"（括号互换成 )1( 的视觉位置），');
console.log('     代码里写的一对括号，在人眼里是"反的"。所以：');
console.log('     · 给 RTL 用户看的字符串，**不要自己拼括号**，用 Intl 或文案表；');
console.log('     · 排查问题时**不要靠肉眼比对括号**，要靠码点（第 3 节的 escapeBidi / 码点序列）。');

console.log('\n实践：混排数据要用隔离符"保护"起来。');
// 场景：阿语界面上显示一个英文文件名 / 电话号码 / 订单号。
// 不加隔离符时，前后的阿语文字会把中性字符（"-" "." "(" ")"）吸到自己那一边，
// 导致整个号码在视觉上被拆散/换位。
const orderId = 'AB-1234(56)';
const arLabel = 'رقم الطلب:';
const naive = `${arLabel} ${orderId}`;
const isolated = `${arLabel} \u2068${orderId}\u2069`; // FSI ... PDI
console.log('  朴素拼接   :', JSON.stringify(naive));
console.log('  加隔离符后 :', JSON.stringify(isolated));
console.log('  差异只在两个不可见字符上 —— 但视觉结果完全不同：');
console.log('    朴素版：号码里的 "-" 与括号是中性字符，会被两侧的 RTL 文本"拉"过去，');
console.log('            视觉上可能出现 "AB-1234(56)" 与标签错位、或括号贴到标签一侧。');
console.log('    隔离版：U+2068 FSI ... U+2069 PDI 把号码声明为一个**独立方向单元**，');
console.log('            它的内部排版与外部完全隔离，视觉上一定是一个整体、且顺序正确。');
console.log('  这就是 HTML 里 <bdi>AB-1234(56)</bdi> 的等价写法（<bdi> 默认就是 FSI/PDI）。');
console.log('  三种隔离符的取舍：');
console.table([
  { 隔离符: 'U+2068 FSI + U+2069 PDI', 'HTML 等价': '<bdi>', 适用: '方向不确定的嵌入内容（用户输入、ID、文件名）—— 最常用' },
  { 隔离符: 'U+2066 LRI + U+2069 PDI', 'HTML 等价': '<bdi dir="ltr">', 适用: '已知是 LTR 的嵌入内容（URL、代码、英文品牌名）' },
  { 隔离符: 'U+2067 RLI + U+2069 PDI', 'HTML 等价': '<bdi dir="rtl">', 适用: '已知是 RTL 的嵌入内容' },
].map((r) => r));

console.log('\n完整例子：阿语界面里的英文 URL 与数字，一律套 LRI...PDI（或 <bdi dir="ltr">）：');
for (const item of ['https://example.com/a(b)', 'v2.1.0-beta+3', '13800138000']) {
  const wrapped = `\u2066${item}\u2069`;
  console.log(`  ${wrapped}  <- 逻辑: ${JSON.stringify(wrapped)}`);
}
console.log('  在浏览器里把上面三段放进 <div dir="rtl"> 就能看到隔离效果；');
console.log('  命令行里看不到渲染结果，但至少能看到"字符顺序被固定住了"这件事本身。');

console.log('\n最后一条硬规则：**能不在 JS 里拼句子，就不要在 JS 里拼句子**。');
console.log('  RTL 混排的正确解法是：整句交给文案表（把变量作为整体参数插入），');
console.log('  而不是 "中文前缀" + 变量 + "中文后缀" 这样用 + 号拼出来。');
console.log('  证据：下面两句在英语里等价，在阿语里第二种才正确：');
// 用变量而不是字面量写 "${" ，避免 ESLint 的 no-template-curly-in-string 规则误报。
const DOLLAR = String.fromCharCode(36);
console.log('    ❌ 拼接:  `رقم الطلب: ' + DOLLAR + '{orderId}`  -> 变量成了孤立的一段，方向由上下文决定');
console.log('    ✅ 参数:  文案表里的 "رقم الطلب: {id}" -> 整句方向统一，变量用隔离符包裹');
console.log('  这条规则的详细落地方式（消息目录 + 插值 + 复数）见 11_i18n_engineering.js。');

// ---------------------------------------------------------------------------
// 7. 交付前检查清单
// ---------------------------------------------------------------------------

console.log('\n--- 7. RTL / bidi 检查清单 ---');

console.table(
  [
    ['界面方向是否由 locale 的 direction 决定，而不是硬编码？', '用 Intl.Locale.getTextInfo().direction（记得探测 API）'],
    ['CSS 里是否还在用 left/right 等物理属性？', '换成 margin-inline-start 等逻辑属性；例外见第 2 节'],
    ['Intl 的输出是否被直接当成"纯文本"存库 / 当 key？', '先 canonicalKey() 清洗，再用于比较或索引'],
    ['比较字符串前是否统一清洗过？', '两侧必须用同一个清洗策略，否则一边干净一边脏必然不等'],
    ['日志里是否打印了不可见字符的可见形式？', '用 escapeBidi() 或直接打码点序列'],
    ['是否用 trim() 或 NFC 去除过隐形字符？', '它们清不掉 —— 必须显式列出码点或用 \\p{Cf}'],
    ['嵌入的用户内容（ID、文件名、URL）是否做了方向隔离？', '<bdi> 或 FSI/LRI + PDI',
    ],
    ['是否有人用 reverse() 或按索引切分来"修方向"？', '删掉它 —— 视觉顺序由排版引擎计算'],
    ['文案是否用 + 号拼出来的？', '改成消息目录 + 具名插值'],
    ['RTL 语言下数字、代码块、图表坐标轴是否被错误镜像了？', '用 dir="ltr" 或 isolation 局部隔离'],
    ['测试是否覆盖了 RTL 语言？', '至少加一个 ar-EG / he-IL 的用例，并断言输出不含方向控制字符'],
  ].map(([检查项, 做法], i) => ({ '#': i + 1, 检查项, 做法 })),
);

console.log('\n一句话总结：');
console.log('  RTL 是"排版方向"的问题，交给 dir / 逻辑属性 / 文案表；');
console.log('  隐形字符是"字符串同一性"的问题，交给 canonicalKey / escapeBidi。');
console.log('  两者症状都是"看起来一样但行为不对"，所以只能靠工具，不能靠肉眼。');

console.log('\n本节结束。');
