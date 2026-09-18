/**
 * ============================================================================
 * 知识点：Intl 最佳实践与陷阱汇总 —— locale、缓存、时区、解析、ICU 差异
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】高级
 * 【前置知识】本目录 01~07 全部文件（尤其 01_intl_overview.js）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这是 33_intl 目录的收束篇：把前面各篇踩过的坑收敛成**五条铁律 + 一份检查清单**，
 *    并给出一个可以直接抄进项目的工具模块骨架。
 *
 * 2. 为什么需要（真实项目场景）
 *    Intl 本身的 API 不多，难的是"用对"：
 *      - 本地跑得好好的，上 CI 就变英文；
 *      - 平时飞快，压测时 _format 成了 CPU 热点；
 *      - 用户跨零点下单，日期差了一天；
 *      - 把格式化后的字符串又解析回去，金额少了 1 分钱；
 *      - 开发机支持中文，客户的精简版 Node 不支持，界面直接退化。
 *    这些问题都有统一的解法，逐条固化下来即可。
 *
 * 3. 核心语法要点（收敛为五条铁律）
 *    铁律一：**永远显式传 locale**，绝不依赖运行环境的默认值。
 *    铁律二：**缓存 Intl 实例**，绝不在循环/渲染函数里 new。
 *    铁律三：**涉及时区就显式传 timeZone**（IANA 名），并理解 UTC 与夏令时。
 *    铁律四：**Intl 只负责格式化，不负责解析** —— 解析永远走固定协议。
 *    铁律五：**运行时能力要探测** —— Node 与浏览器、不同 ICU 构建差异巨大。
 *
 * 4. 常见陷阱（清单见文件末尾第 8 节）
 *
 * 【运行方法】
 *   在仓库根目录执行：node 33_intl/08_intl_best_practices.js
 *
 * 【预期输出】
 *   分 8 个小节：逐条演示五条铁律、汇总其他陷阱、给出工具模块骨架与检查清单。
 *   凡涉及环境差异或性能数值的行都标注了 [环境相关]；其余输出固定。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 铁律一：永远显式传 locale
// ---------------------------------------------------------------------------

console.log('--- 1. 铁律一：永远显式传 locale ---');

// 不传 locale 时，Intl 用"宿主环境的默认 locale"。
// 这一行是**环境相关**的：开发机是 zh-CN、CI 可能是 en-US、客户服务器可能是 de-DE。
const envLocale = new Intl.NumberFormat().resolvedOptions().locale;
console.log('[环境相关] 本机默认 locale =', envLocale);
console.log('[环境相关] 本机时区       =', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('[环境相关] TZ 环境变量    =', String(process.env.TZ));

const AMOUNT = 1234567.89;
console.log('\n同一个金额，不传 locale 与传 locale 的结果：');
console.log('  new Intl.NumberFormat().format(1234567.89)          -> [环境相关] ' + new Intl.NumberFormat().format(AMOUNT));
for (const loc of ['zh-CN', 'en-US', 'de-DE', 'fr-FR', 'ar-EG']) {
  console.log(`  new Intl.NumberFormat(${JSON.stringify(loc).padEnd(7)}).format(...) -> ${new Intl.NumberFormat(loc).format(AMOUNT)}`);
}
console.log('\n为什么这是"必须"而不是"建议"：');
console.log('  1. 单元测试会在不同机器上给出不同快照，CI 与本地结果不一致。');
console.log('  2. 服务端渲染（SSR）的内容会随部署机器变化，缓存/SEO 全部受影响。');
console.log('  3. 同一份数据在邮件、报表、页面三处由不同服务生成，格式不统一。');
console.log('\n什么时候可以传 undefined（即不传）？');
console.log('  只有一种情况：产品明确要求"跟随用户操作系统设置"的终端用户界面，');
console.log('  而且你接受"同一用户换设备就看到不同格式"。');

console.log('\n配套要求：把 locale 规范化后再当缓存 key / 数据库字段。');
console.log('  Intl.getCanonicalLocales(["ZH-cn", "iw"]) =', JSON.stringify(Intl.getCanonicalLocales(['ZH-cn', 'iw'])));
console.log('  用规范化结果当 key，"zh-CN" 与 "ZH-cn" 才不会各建一份缓存。');

// ---------------------------------------------------------------------------
// 铁律二：缓存 Intl 实例
// ---------------------------------------------------------------------------

console.log('\n--- 2. 铁律二：缓存 Intl 实例 ---');

const ITER = 20000;
/**
 * 简易计时器：先预热一次，再跑 n 次，返回毫秒数。
 * @param {() => unknown} fn 被测函数
 * @param {number} n 迭代次数
 * @returns {number}
 */
function bench(fn, n) {
  fn();
  const t = process.hrtime.bigint();
  for (let i = 0; i < n; i++) fn();
  return Number(process.hrtime.bigint() - t) / 1e6;
}

const cacheDemos = [
  {
    场景: 'NumberFormat 格式化金额',
    反例: () => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.5),
    正例: (() => {
      const f = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
      return () => f.format(1234.5);
    })(),
  },
  {
    场景: 'DateTimeFormat 格式化日期',
    反例: () => new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'medium' }).format(new Date(0)),
    正例: (() => {
      const f = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'medium' });
      return () => f.format(new Date(0));
    })(),
  },
  {
    场景: 'Collator 比较字符串',
    反例: () => new Intl.Collator('zh-CN').compare('张三', '李四'),
    正例: (() => {
      const c = new Intl.Collator('zh-CN');
      return () => c.compare('张三', '李四');
    })(),
  },
  {
    场景: 'DisplayNames 查语言名',
    反例: () => new Intl.DisplayNames(['zh-CN'], { type: 'language' }).of('en'),
    正例: (() => {
      const d = new Intl.DisplayNames(['zh-CN'], { type: 'language' });
      return () => d.of('en');
    })(),
  },
];

console.table(
  cacheDemos.map(({ 场景, 反例, 正例 }) => {
    const bad = bench(反例, ITER);
    const good = bench(正例, ITER);
    return {
      场景,
      '反例 ms [环境相关]': bad.toFixed(1),
      '正例 ms [环境相关]': good.toFixed(1),
      '倍数 [环境相关]': 'x' + Math.round(bad / Math.max(good, 0.001)),
    };
  }),
);
console.log(`（迭代 ${ITER} 次；绝对毫秒数随机器变化，但"差 1~2 个数量级"在任何环境都成立）`);

console.log('\n标准做法：写一个带缓存的工厂函数，key 用 locale + 选项的稳定序列化。');
/**
 * Intl 实例缓存池：同一种"locale + 选项组合"只构造一次。
 */
class IntlCache {
  #pool = new Map();

  /**
   * 取一个（可能是缓存的）Intl 实例。
   * @param {string} kind 构造器名，如 'NumberFormat'
   * @param {string} locale BCP 47 标签（调用方保证已规范化）
   * @param {object} options options 对象
   * @returns {object} Intl 实例
   */
  get(kind, locale, options = {}) {
    // key 的稳定性很关键：把 options 的键排序后再序列化，避免 {a,b} 与 {b,a} 生成两个缓存。
    const sortedOptions = Object.fromEntries(Object.entries(options).sort(([a], [b]) => (a < b ? -1 : 1)));
    const key = `${kind}|${locale}|${JSON.stringify(sortedOptions)}`;
    let instance = this.#pool.get(key);
    if (instance === undefined) {
      const Ctor = Intl[kind];
      if (typeof Ctor !== 'function') throw new Error(`当前运行时没有 Intl.${kind}`);
      instance = new Ctor(locale, options);
      this.#pool.set(key, instance);
    }
    return instance;
  }

  /** 当前缓存了多少个实例 */
  get size() {
    return this.#pool.size;
  }
}

const intlCache = new IntlCache();
console.log('  连续取 4 次同配置的 NumberFormat：');
for (let i = 0; i < 4; i++) {
  intlCache.get('NumberFormat', 'zh-CN', { style: 'currency', currency: 'CNY' });
}
console.log('    缓存池大小 =', intlCache.size, '（只构造了 1 个实例）');
console.log('  再取一个不同 currency 的：');
intlCache.get('NumberFormat', 'zh-CN', { style: 'currency', currency: 'USD' });
console.log('    缓存池大小 =', intlCache.size);
console.log('  options 键顺序不同也不会重复构造：');
const a = intlCache.get('DateTimeFormat', 'en-US', { year: 'numeric', month: 'long' });
const b = intlCache.get('DateTimeFormat', 'en-US', { month: 'long', year: 'numeric' });
console.log('    两次拿到同一个实例吗？', a === b, '| 缓存池大小 =', intlCache.size);

// ---------------------------------------------------------------------------
// 铁律三：涉及时区就显式传 timeZone
// ---------------------------------------------------------------------------

console.log('\n--- 3. 铁律三：涉及时区就显式传 timeZone ---');

const INSTANT = new Date('2024-03-15T23:30:00Z');
console.log('固定时刻 = 2024-03-15T23:30:00Z');
console.log('  不传 timeZone（跟随机器）-> [环境相关]', new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short' }).format(INSTANT));
console.log('  显式 UTC               ->', new Intl.DateTimeFormat('zh-CN', { timeZone: 'UTC', dateStyle: 'short' }).format(INSTANT));
console.log('  显式 Asia/Shanghai     ->', new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', dateStyle: 'short' }).format(INSTANT));
console.log('  同一个瞬间，UTC 是 15 日、上海是 16 日 —— 差一天。');
console.log('  这个"差一天"在"跨零点下单""月末结账""考试截止时间"里都是真实事故。');

console.log('\ntimeZone 必须写 IANA 名称，写错会抛 RangeError：');
for (const tz of ['Asia/Shangai', 'UTC+8', 'GMT+8']) {
  try {
    new Intl.DateTimeFormat('zh-CN', { timeZone: tz });
    console.log(`  ${JSON.stringify(tz).padEnd(14)} -> 未抛错`);
  } catch (err) {
    console.log(`  ${JSON.stringify(tz).padEnd(14)} -> ${err.constructor.name}: ${err.message}`);
  }
}
console.log('  合法写法是 "Asia/Shanghai"（地区/城市），不是 "UTC+8" 这种偏移量。');
console.log('  "UTC" 是特例，可以直接用。');
console.log('  合法值清单：Intl.supportedValuesOf("timeZone")，共', Intl.supportedValuesOf('timeZone').length, '个 [环境相关]。');

console.log('\n夏令时（DST）是第二个大坑：');
const nyFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  dateStyle: 'short',
  timeStyle: 'short',
  hour12: false,
});
console.log('  纽约 2024-03-10 进入夏令时（当地 02:00 直接跳到 03:00）：');
for (const iso of ['2024-03-10T06:30:00Z', '2024-03-10T07:30:00Z', '2024-03-10T08:30:00Z']) {
  console.log(`    ${iso} -> ${nyFormatter.format(new Date(iso))}`);
}
console.log('    06:30Z 是 01:30 EST，07:30Z 就已经是 03:30 EDT —— 当地 02:30 这一刻不存在。');
console.log('  纽约 2024-11-03 退出夏令时（当地 01:00 到 02:00 走了两遍）：');
for (const iso of ['2024-11-03T05:30:00Z', '2024-11-03T06:30:00Z']) {
  console.log(`    ${iso} -> ${nyFormatter.format(new Date(iso))}`);
}
console.log('    两个不同的瞬间渲染出同一个当地时刻 —— 这一小时是"歧义时刻"。');

console.log('\n正确的心智模型：');
console.log('  Date 内部永远是"UTC 毫秒数"（绝对瞬间），不带时区信息；');
console.log('  timeZone 只在**渲染的那一刻**参与计算。所以：');
console.log('    存储 -> 永远用 UTC 或 ISO 8601 字符串；');
console.log('    传输 -> ISO 8601（带 Z 或带偏移）；');
console.log('    展示 -> 让 Intl 带上目标时区去渲染。');
console.log('  绝不要把"本地格式化后的字符串"存回数据库。');

// ---------------------------------------------------------------------------
// 铁律四：Intl 只格式化，不解析
// ---------------------------------------------------------------------------

console.log('\n--- 4. 铁律四：Intl 只负责格式化，不负责解析 ---');

console.log('所有 Intl 构造器都没有 parse 方法：');
for (const api of ['NumberFormat', 'DateTimeFormat', 'PluralRules', 'ListFormat', 'Collator']) {
  console.log(`  Intl.${api}.prototype.parse = ${typeof Intl[api].prototype.parse}`);
}
console.log('  格式化是"多对一"的（很多内部状态渲染成同一个字符串），');
console.log('  所以解析在数学上就不可能唯一 —— 这不是"还没实现"，而是"做不到"。');

console.log('\n反例：把格式化结果解析回去会怎样');
const raw = 1234.56;
const deText = new Intl.NumberFormat('de-DE').format(raw);
const enText = new Intl.NumberFormat('en-US').format(raw);
console.log(`  原始值     : ${raw}`);
console.log(`  de-DE 渲染 : ${JSON.stringify(deText)}`);
console.log(`  en-US 渲染 : ${JSON.stringify(enText)}`);
console.log(`  Number(deText)     = ${Number(deText)}  （NaN，至少会立刻暴露问题）`);
console.log(`  parseFloat(deText) = ${parseFloat(deText)}  <-- 静默截断成 1.234，比 NaN 更危险`);
console.log(`  Number(enText)     = ${Number(enText)}  （同样 NaN —— 带千分位的字符串谁都解析不了）`);
console.log(`  parseFloat(enText) = ${parseFloat(enText)}  <-- 遇到逗号就停，直接截成 1，同样错得离谱`);
console.log('  两个 locale 都会出错，只是错法不同：Number 给你 NaN（会 crash，还算好事），');
console.log('  parseFloat 给你一个"看起来像数字"的错误值（最危险，因为它不会报错）。');

console.log('\n反例：日期格式化再解析');
const d = new Date('2024-03-05T00:00:00Z');
const usDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', dateStyle: 'short' }).format(d);
console.log(`  en-US 渲染 2024-03-05 -> ${JSON.stringify(usDate)} （3/5/24 = 3 月 5 日）`);
console.log('  如果按"日/月/年"理解会读成 5 月 3 日 —— 歧义无法从字符串本身消除。');

console.log('\n正确做法：解析走固定协议，格式化只给人看。');
/**
 * 金额在系统里的正确表示：**最小单位整数**（分），而不是浮点数或字符串。
 * 展示时才交给 Intl 格式化。
 * @param {number} cents 以"分"为单位的整数
 * @param {string} locale BCP 47 标签
 * @param {string} currency ISO 4217 代码
 * @returns {string}
 */
function formatCents(cents, locale, currency) {
  if (!Number.isInteger(cents)) throw new TypeError('金额必须是最小单位整数（分）');
  // 用 divide 时可以先乘再除，但更稳妥的是直接构造一个"分为单位"的数值再格式化。
  const amount = cents / 100;
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
}
console.log('  存储 123456（分）->');
for (const loc of ['zh-CN', 'en-US', 'de-DE', 'ja-JP']) {
  console.log(`    ${loc.padEnd(6)} -> ${formatCents(123456, loc, 'CNY')}`);
}
console.log('  解析方向则用固定的机器格式：JSON 里的数字、ISO 8601 日期串、最小单位整数。');

console.log('\n日期同理：');
/**
 * 把"机器格式"（ISO 8601）转成"给人看的格式"。
 * @param {string} iso ISO 8601 字符串
 * @param {string} locale BCP 47 标签
 * @param {string} timeZone IANA 时区名
 * @returns {string}
 */
function renderIsoDate(iso, locale, timeZone) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new RangeError(`无法解析的 ISO 字符串：${iso}`);
  return new Intl.DateTimeFormat(locale, { timeZone, dateStyle: 'long', timeStyle: 'short' }).format(date);
}
console.log('  输入统一是 ISO：2024-03-15T09:30:00Z');
for (const [loc, tz] of [['zh-CN', 'Asia/Shanghai'], ['en-US', 'America/New_York'], ['de-DE', 'Europe/Berlin']]) {
  console.log(`    ${loc.padEnd(6)} @ ${tz.padEnd(18)} -> ${renderIsoDate('2024-03-15T09:30:00Z', loc, tz)}`);
}
console.log('  解析只有一个入口（new Date(iso)），格式化只有一个出口（Intl），职责清晰。');

// ---------------------------------------------------------------------------
// 铁律五：运行时能力要探测
// ---------------------------------------------------------------------------

console.log('\n--- 5. 铁律五：Node 与浏览器的 ICU 差异 ---');

console.log('[环境相关] Node 版本        =', process.version);
console.log('[环境相关] ICU 是否为精简版 =', process.config.variables.icu_small, '（false 表示 full-icu）');
console.log('[环境相关] ICU 主版本      =', process.config.variables.icu_ver_major);
console.log('[环境相关] 支持的时区数量  =', Intl.supportedValuesOf('timeZone').length);
console.log('[环境相关] 支持的货币数量  =', Intl.supportedValuesOf('currency').length);

console.log('\n差异来源有三个，每一个都会导致"本地能跑、线上不行"：');
console.log('  1. **ICU 数据是否精简**：Node 可以用 --with-intl=small-icu 构建，');
console.log('     此时只有英文数据，中文/阿拉伯语等会静默回退到 en-US。');
console.log('  2. **ICU 版本不同**：CLDR 数据随版本更新（国家更名、货币改版、复数规则调整），');
console.log('     Node 18 与 Node 24 格式化同一个数字可能得到不同结果。');
console.log('  3. **浏览器 vs Node**：浏览器内核的 ICU 版本与 Node 不同，');
console.log('     而且同一个"新提案"API 在两边落地时间可能差一两年。');

console.log('\n必须探测的两种"存在性"：');

// 探测方式一：构造器本身是否存在。
const OPTIONAL_APIS = ['Segmenter', 'DisplayNames', 'ListFormat', 'PluralRules', 'RelativeTimeFormat', 'DurationFormat', 'Locale'];
console.table(
  OPTIONAL_APIS.map((name) => ({
    API: `Intl.${name}`,
    存在: typeof Intl[name] === 'function',
    引入版本: { Segmenter: 'Node 16+', DisplayNames: 'Node 14+', ListFormat: 'Node 13+', PluralRules: 'Node 10+', RelativeTimeFormat: 'Node 12+', DurationFormat: '较新，Node 22+ 起逐步可用', Locale: 'Node 12+' }[name],
  })),
);

// 探测方式二：构造器的某个**选项值**是否被支持（同一 API 的选项集合会随版本扩大）。
/**
 * 探测某个构造器是否接受给定的 options。
 * @param {string} kind 构造器名
 * @param {object} options 待测 options
 * @returns {boolean}
 */
function supportsOptions(kind, options) {
  try {
    new Intl[kind]('zh-CN', options);
    return true;
  } catch {
    return false;
  }
}
console.log('\n同一个 API，选项集合也会变 —— 必须按选项探测：');
const optionProbes = [
  ['DisplayNames', { type: 'language' }, '基础语言名'],
  ['DisplayNames', { type: 'currency' }, '货币名'],
  ['DisplayNames', { type: 'month' }, '月份名（新提案）'],
  ['DisplayNames', { type: 'weekday' }, '星期名（新提案）'],
  ['DisplayNames', { type: 'timeZone' }, '时区名（新提案）'],
  ['PluralRules', { type: 'ordinal' }, '序数词'],
];
console.table(
  optionProbes.map(([kind, options, note]) => ({
    构造器: `Intl.${kind}`,
    options: JSON.stringify(options),
    说明: note,
    支持: supportsOptions(kind, options),
  })),
);
console.log('  本运行时对 DisplayNames 的 month/weekday/timeZone 不支持 —— 这正是"新提案"');
console.log('  在不同运行时落地时间不同的典型例子。要拿月份名必须退回 DateTimeFormat（见 06 篇）。');

console.log('\n推荐的降级写法（示例：月份名，优先用新 API，不支持就退回旧方案）：');
/**
 * 取月份名：优先用 Intl.DisplayNames 的新 type，不支持则退回 DateTimeFormat。
 * @param {number} monthIndex 1-12
 * @param {string} locale BCP 47 标签
 * @param {'long'|'short'|'narrow'} style 名称长度
 * @returns {string}
 */
function getMonthName(monthIndex, locale, style = 'long') {
  if (supportsOptions('DisplayNames', { type: 'month' })) {
    // 有 type: 'month' 的运行时可以少构造一个 Date。
    return new Intl.DisplayNames([locale], { type: 'month', style }).of(monthIndex);
  }
  // 退回 DateTimeFormat：用一个确定的日期取月名，timeZone 固定 UTC 避免时区漂移。
  const fmt = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', month: style });
  return fmt.format(new Date(Date.UTC(2024, monthIndex - 1, 15)));
}
for (const loc of ['zh-CN', 'en-US']) {
  const names = [1, 6, 12].map((m) => getMonthName(m, loc));
  console.log(`  ${loc.padEnd(6)} -> ${names.join(' / ')}`);
}
console.log('  两条分支在本运行时都返回相同结果，线上无论跑哪个版本都不会缺功能。');

console.log('\n还有一条更强的兜底：确认某个 locale 真的有数据。');
/**
 * 检查运行时是否真的支持某个 locale（而不是会静默回退到默认值）。
 * @param {string} tag BCP 47 标签
 * @returns {boolean}
 */
function hasLocaleData(tag) {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([tag]).length > 0;
  } catch {
    return false;
  }
}
console.table(
  ['zh-CN', 'zh-Hant-TW', 'en-US', 'ar-EG', 'xx-YY'].map((tag) => ({
    locale: tag,
    '有数据': hasLocaleData(tag),
    '实际生效的 locale': hasLocaleData(tag) ? new Intl.DateTimeFormat(tag).resolvedOptions().locale : '(会静默回退)',
  })),
);
console.log('  上线前用这段代码跑一遍所有支持的 locale，就能提前发现"精简 ICU"问题。');

// ---------------------------------------------------------------------------
// 6. 其他陷阱合集
// ---------------------------------------------------------------------------

console.log('\n--- 6. 其他陷阱合集 ---');

console.log('陷阱一：dateStyle/timeStyle 与细粒度字段不能混用');
try {
  new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', year: 'numeric' });
} catch (err) {
  console.log('  {dateStyle, year} ->', err.constructor.name + ':', err.message);
}
console.log('  两组选项互斥，只能二选一。');

console.log('\n陷阱二：回退链要检查 resolvedOptions，否则"以为生效了其实没生效"');
const fallbackChain = new Intl.DateTimeFormat(['xx-XX', 'zh-CN'], { timeZone: 'UTC', dateStyle: 'short' });
console.log('  ["xx-XX","zh-CN"] 实际生效 ->', fallbackChain.resolvedOptions().locale);
const silently = new Intl.DateTimeFormat('xx-XX', { timeZone: 'UTC', dateStyle: 'short' });
console.log('  ["xx-XX"] 单独一个      -> [环境相关]', silently.resolvedOptions().locale, '（静默回退到默认 locale）');
console.log('  => 启动时断言 resolvedOptions().locale 属于你的支持列表，可以及早暴露问题。');

console.log('\n陷阱三：排序必须用 Collator，不能用默认 sort 也不能比较格式化结果');
const names = ['张三', '李四', '王五', 'Alice', 'bob'];
console.log('  默认 sort     ->', [...names].sort().join(' '));
console.log('  Collator 排序 ->', [...names].sort(new Intl.Collator('zh-CN').compare).join(' '));
console.log('  更不要"先格式化再排序"：');
console.log('    1234.5 与 999 在 de-DE 下是 "1.234,5" 与 "999" —— 字符串比较会得出 999 更小，纯属巧合。');
console.log('    正确顺序是"先按数值排好序，再逐个格式化"。');

console.log('\n陷阱四：不要把格式化结果当数据用于比较或相等判断');
const nf = new Intl.NumberFormat('de-DE');
console.log('  de-DE 下：1 和 1.0000001 分别渲染成',
  JSON.stringify(nf.format(1)), '与', JSON.stringify(nf.format(1.0000001)),
  '-> 相等吗？', nf.format(1) === nf.format(1.0000001));
console.log('  两个不同的数（1 与 1.0000001）渲染成了完全相同的字符串（默认最多 3 位小数）。');
console.log('  反过来，同一个 1234.5 在 de-DE 与 en-US 下渲染成 "1.234,5" 与 "1,234.5"，也不相等。');
console.log('  结论：要比较就比原始数值，要展示才用格式化结果。');

console.log('\n陷阱五：缓存的 key 里必须包含 locale 和全部 options');
console.log('  只按"功能名"缓存（如 cache["date"]）会导致：切换到英文后仍显示中文日期。');
console.log('  推荐 key 形如：`DateTimeFormat|zh-CN|{"dateStyle":"short","timeZone":"Asia/Shanghai"}`。');

console.log('\n陷阱六：Intl 是"格式化"而非"翻译"');
console.log('  Intl 能告诉你 "3 items" 该用 items 还是 item（复数类别），');
console.log('  但 "items" 这个词本身要靠你的文案表。别指望 Intl 帮你翻译句子。');

console.log('\n陷阱七：性能敏感路径上，连"取已缓存实例"都可能成为开销');
const hotPathCost = bench(() => {
  // 模拟最坏情况：连 key 拼装都放进热循环。
  JSON.stringify(Object.entries({ style: 'currency', currency: 'CNY' }).sort());
}, ITER);
console.log(`  [环境相关] 每万次拼 key 约 ${(hotPathCost * 10000 / ITER).toFixed(2)} ms —— 量级远小于 new 一个 formatter。`);
console.log('  结论：缓存工厂是划算的；若追求极致，可在模块顶层直接声明常量 formatter。');

// ---------------------------------------------------------------------------
// 7. 工具模块骨架
// ---------------------------------------------------------------------------

console.log('\n--- 7. 可直接抄走的工具模块骨架 ---');

// ISO 8601 的宽松匹配：日期部分必填，时间/时区部分可选。
const ISO_8601 = /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * 生产级 i18n 工具：把五条铁律落成代码。
 * 用法：
 *   const i18n = createI18n({ locale: 'zh-CN', timeZone: 'Asia/Shanghai' });
 *   i18n.currency(123456);              // ¥1,234.56
 *   i18n.dateTime('2024-03-15T09:30:00Z');
 *   i18n.list(['张三', '李四', '王五']);  // 张三、李四和李四
 * @param {{ locale: string, timeZone: string, currency: string, fallbackLocale: string }} config 配置
 * @returns {object}
 */
function createI18n(config) {
  const { locale, timeZone, currency, fallbackLocale } = config;

  // 启动时就把 locale 规范化 + 校验，问题在启动阶段暴露，而不是在用户请求里。
  const canonical = Intl.getCanonicalLocales(locale)[0] ?? fallbackLocale;
  if (!hasLocaleData(canonical)) {
    // 真实项目里这里应该打日志/上报监控，而不是静默继续。
    console.warn(`[i18n] 运行时缺少 ${canonical} 的语言数据，已回退到 ${fallbackLocale}`);
  }
  const effective = hasLocaleData(canonical) ? canonical : fallbackLocale;

  // 所有 formatter 在这里构造一次，永久复用。
  const cache = new IntlCache();
  const numberFmt = cache.get('NumberFormat', effective, { style: 'currency', currency });
  const listFmt = cache.get('ListFormat', effective, { type: 'conjunction', style: 'long' });
  const pluralRules = cache.get('PluralRules', effective, {});
  const collator = cache.get('Collator', effective, { numeric: true });

  return {
    locale: effective,
    timeZone,

    /**
     * 金额：入参是"分"，出参是本地化字符串。
     * @param {number} cents 最小单位整数
     * @returns {string}
     */
    currency(cents) {
      if (!Number.isInteger(cents)) throw new TypeError('金额必须是最小单位整数（分）');
      return numberFmt.format(cents / 100);
    },

    /**
     * 普通数字（带千分位）。
     * @param {number} value 数值
     * @returns {string}
     */
    number(value) {
      return new Intl.NumberFormat(effective).format(value);
    },

    /**
     * 日期时间：入参必须是 ISO 8601，展示时带上配置的时区。
     * @param {string|Date} input ISO 字符串或 Date
     * @param {'short'|'medium'|'long'|'full'} [dateStyle] 日期长度
     * @returns {string}
     */
    dateTime(input, dateStyle = 'medium') {
      // 只接受 ISO 8601，显式拒绝 "2024/03/15" 之类会被引擎"猜"出含义的写法。
      // 因为 new Date('2024/03/15') 在 V8 里按**本地时区**解析，
      // 而 new Date('2024-03-15') 按 **UTC** 解析 —— 同一天的两个不同瞬间，极易出错。
      if (typeof input === 'string' && !ISO_8601.test(input)) {
        throw new RangeError(`日期必须是 ISO 8601 格式，收到：${JSON.stringify(input)}`);
      }
      const date = input instanceof Date ? input : new Date(input);
      if (Number.isNaN(date.getTime())) throw new RangeError(`无法解析的日期：${String(input)}`);
      return cache
        .get('DateTimeFormat', effective, { timeZone, dateStyle, timeStyle: 'short' })
        .format(date);
    },

    /**
     * 把数组连成一句话（"张三、李四和王五"）。
     * @param {string[]} items 元素
     * @returns {string}
     */
    list(items) {
      return listFmt.format(items);
    },

    /**
     * 数量文案：由 PluralRules 选词形，由文案表提供句子。
     * @param {number} count 数量
     * @param {Record<string, string>} forms 形如 { other: '{n} 件商品' }
     * @returns {string}
     */
    count(count, forms) {
      const category = pluralRules.select(count);
      const template = forms[category] ?? forms.other;
      if (template === undefined) throw new Error(`缺少复数类别 ${category} 的文案且没有 other 兜底`);
      return template.replaceAll('{n}', new Intl.NumberFormat(effective).format(count));
    },

    /**
     * 排序比较器（按当前语言排序，支持自然数字序）。
     * @returns {(a: string, b: string) => number}
     */
    compare() {
      return collator.compare;
    },

    /** 已缓存的 formatter 数量（用于监控/调试） */
    get cacheSize() {
      return cache.size;
    },
  };
}

const i18n = createI18n({
  locale: 'zh-CN',
  timeZone: 'Asia/Shanghai',
  currency: 'CNY',
  fallbackLocale: 'en-US',
});
console.log('  locale =', i18n.locale, '| timeZone =', i18n.timeZone);
console.log('  currency(123456)                ->', i18n.currency(123456));
console.log('  number(1234567.891)             ->', i18n.number(1234567.891));
console.log('  dateTime("2024-03-15T23:30:00Z")->', i18n.dateTime('2024-03-15T23:30:00Z'));
console.log('  dateTime(..., "full")           ->', i18n.dateTime('2024-03-15T23:30:00Z', 'full'));
console.log('  list(["张三","李四","王五"])       ->', i18n.list(['张三', '李四', '王五']));
console.log('  count(1, {other:"购物车有 {n} 件商品"}) ->', i18n.count(1, { other: '购物车有 {n} 件商品' }));
console.log('  ["第10名","第2名","第1名"].sort(i18n.compare()) ->', ['第10名', '第2名', '第1名'].sort(i18n.compare()));
console.log('  已缓存 formatter 数量 =', i18n.cacheSize);
console.log('\n  再创建一个不同 locale 的实例，缓存互不干扰：');
const enI18n = createI18n({ locale: 'en-US', timeZone: 'America/New_York', currency: 'USD', fallbackLocale: 'en-US' });
console.log('  en: currency(123456) ->', enI18n.currency(123456), '| dateTime ->', enI18n.dateTime('2024-03-15T23:30:00Z'));
console.log('  en: list(["A","B","C"]) ->', enI18n.list(['A', 'B', 'C']));

console.log('\n  错误用法会被显式拒绝（而不是静默出错）：');
for (const bad of [() => i18n.currency(12.345), () => i18n.dateTime('2024/03/15'), () => i18n.count(1, { one: 'x' })]) {
  try {
    bad();
    console.log('    未抛错');
  } catch (err) {
    console.log(`    ${err.constructor.name}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 8. 交付前检查清单
// ---------------------------------------------------------------------------

console.log('\n--- 8. 交付前检查清单 ---');

const CHECKLIST = [
  ['传给 Intl 的 locale 是否全部显式书写？', '搜索源码里的 new Intl 与 toLocaleString，确认没有裸调用'],
  ['locale 是否经过 getCanonicalLocales 规范化？', '缓存 key 与数据库字段都应存规范化结果'],
  ['Intl 实例是否在循环/渲染函数外构造？', '用工厂 + Map 缓存，或模块顶层常量'],
  ['是否有断言捕获"静默回退到默认 locale"？', '启动时校验 resolvedOptions().locale 属于支持列表'],
  ['所有涉及时区的格式化是否显式传了 timeZone？', 'IANA 名称，不是 UTC+8'],
  ['存储/传输是否只用 ISO 8601 与最小单位整数？', '绝不存格式化后的字符串'],
  ['是否存在"把格式化结果解析回去"的代码？', '有则改为解析固定协议'],
  ['金额是否用最小单位整数而非浮点数？', '避免 0.1+0.2 与舍入误差'],
  ['排序是否统一用 Intl.Collator？', '中文/德语/自然数字序都靠它'],
  ['复数文案是否按 PluralRules 的类别建表？', '每种语言都要有 other 兜底'],
  ['是否对可选 API 与选项做了能力探测？', 'Intl.DurationFormat、DisplayNames 的新 type 等'],
  ['CI 是否在"精简 ICU"或不同 Node 版本上跑过？', '覆盖真实部署环境'],
  ['是否有针对 RTL 语言与"一周首日"的处理？', '来自 Locale.getTextInfo / getWeekInfo'],
];
console.table(CHECKLIST.map(([item, how], i) => ({ '#': i + 1, 检查项: item, 做法: how })));

console.log('\n最后记住一句话：');
console.log('  Intl 解决的是"同一份数据、不同文化下怎么写"的问题，');
console.log('  它不解决"翻译文案""切换语言""管理翻译流程"—— 那些是 i18n 框架的职责。');
console.log('  Intl 是这类框架的地基，用对了地基，上层才稳。');

console.log('\n本节结束，33_intl 目录到此完结。');
