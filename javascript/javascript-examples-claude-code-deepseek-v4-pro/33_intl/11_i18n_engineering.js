/**
 * ============================================================================
 * 知识点：i18n 工程实践 —— 消息目录、缺失兜底、语言协商、偏好持久化
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】高级
 * 【前置知识】33_intl/03_intl_plural_rules.js、33_intl/06_intl_display_names.js、
 *            33_intl/07_intl_locale.js、33_intl/08_intl_best_practices.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本目录前面的文件各讲了一块：
 *      · 03_intl_plural_rules.js —— 复数文案表怎么写；
 *      · 06_intl_display_names.js —— 语言下拉框的选项名怎么来；
 *      · 08_intl_best_practices.js —— createI18n 格式化骨架（金额/日期/列表）。
 *    但它们之间**缺一个工程闭环**：译文放在哪、缺了怎么办、用户切了语言怎么记住、
 *    第一次访问该显示哪种语言。本文件把这四件事串起来，最后给出一个
 *    **完整可运行的小型 i18n 库**（t / setLocale / 复数 / 插值 / 缺失上报）。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 译文散落在代码里（`label: '确定'`）→ 加一门语言要改 200 个文件。
 *    (2) 漏翻一条没人知道 → 线上出现 "cart.checkout.payNow" 这种 key 直出。
 *    (3) 用户切成英文，刷新一下又变回中文 → 客服工单。
 *    (4) 浏览器发 `Accept-Language: zh-Hant-TW`，你的系统只支持 zh-CN，
 *        直接回退到英文 → 台湾用户看到英文界面。
 *    (5) 复数、插值、日期货币格式各写各的 → 同一句话在三个页面三种样子。
 *    这五件事都不是 Intl 能解决的 —— Intl 只解决"同一份数据怎么写"，
 *    "写什么内容、怎么管理这些内容"是 i18n 框架的职责。
 *
 * 3. 核心语法要点（本文件实现并演示）
 *    (1) 消息目录：按语言分文件 + 点分命名空间（`cart.checkout.payNow`），
 *        key 用"描述用途"的英文小驼峰，绝不用中文句子当 key。
 *    (2) 取值走**回退链**：当前语言 → 默认语言 → （策略决定）key 本身 / 抛错 / 上报。
 *    (3) 语言协商优先级（从高到低）：
 *          用户显式设置 > 已存储的偏好 > Accept-Language > 默认语言
 *        匹配用 Intl.Locale（canonicalize + maximize）+ CLDR 的 lookup 语义。
 *    (4) 持久化三种存法各有取舍：localStorage（只在浏览器、要处理隐私模式抛错）、
 *        Cookie（会随请求发送、可被服务端读到、有 4KB 限制）、
 *        URL 参数（可分享且可被搜索引擎抓取、但要处理与存储的优先级）。
 *    (5) 复数与插值统一在 `t()` 里做：`t('cart.items', { count: 3 })`
 *        —— 数量走 Intl.PluralRules 选词形，数字走 Intl.NumberFormat 渲染。
 *
 * 4. 常见陷阱
 *    (1) 用中文/英文句子当 key（`t('确定')`）→ 改一个字就要改所有语言文件，且无法统计缺失。
 *    (2) 在 JS 里用 + 号拼句子（`t('cart.prefix') + n + t('cart.suffix')`）
 *        → 词序、方向、复数全都会错（见 10_intl_rtl_and_bidi.js 第 6 节）。
 *    (3) 回退到 key 本身却不记录 → 线上静默出现 key 直出，没人发现。
 *    (4) 用语言短名当 key（`zh`）却用 `zh-CN`/`zh-TW` 做匹配 → 繁简混用。
 *    (5) 语言切换只改内存不落盘 → 刷新即失效。
 *    (6) URL 参数与存储冲突时不定义优先级 → 用户点了切换链接却没生效。
 *    (7) 把 i18n 做成"全局可变单例"却不通知订阅者 → 切了语言界面不刷新。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 33_intl/11_i18n_engineering.js
 *
 * 【预期输出】
 *   分 9 个小节：Intl 与 i18n 框架的分工、消息目录组织、小型 i18n 库实现、
 *   缺失 key 的三种兜底策略、语言协商、持久化三种存法、端到端演练、
 *   上生产还差什么、交付前检查清单。
 *   所有 Intl 调用都显式传 locale；凡随运行环境变化的值都标注 [环境相关]。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 分工：Intl 管"怎么写"，i18n 框架管"写什么"
// ---------------------------------------------------------------------------

console.log('--- 0. Intl 与 i18n 框架的分工 ---');

console.table([
  { 问题: '这个金额在德语里怎么写', 归谁管: 'Intl.NumberFormat', 本目录文件: '01_intl_overview.js' },
  { 问题: '3 件商品该用哪个词形', 归谁管: 'Intl.PluralRules', 本目录文件: '03_intl_plural_rules.js' },
  { 问题: '"en" 在中文里叫什么', 归谁管: 'Intl.DisplayNames', 本目录文件: '06_intl_display_names.js' },
  { 问题: '"zh-Hant-TW" 和 "zh-CN" 是什么关系', 归谁管: 'Intl.Locale', 本目录文件: '07_intl_locale.js' },
  { 问题: '"购物车" 这个词本身翻译成什么', 归谁管: 'i18n 消息目录（本文件）', 本目录文件: '11_i18n_engineering.js（本文件）' },
  { 问题: '用户切成英文后怎么记住', 归谁管: 'i18n 持久化层（本文件）', 本目录文件: '11_i18n_engineering.js（本文件）' },
  { 问题: '第一次访问该显示哪种语言', 归谁管: 'i18n 语言协商（本文件）', 本目录文件: '11_i18n_engineering.js（本文件）' },
].map((r) => r));

console.log('  Intl 是地基：它保证"格式"在任何语言下都正确；');
console.log('  本文件搭的是地基之上的那层楼：内容管理 + 语言状态管理。');

// 运行环境探测：Node 没有 window / localStorage / document，所以持久化层要能注入。
console.log('\n[环境相关] 运行环境探测：');
console.log('  process.version        =', process.version);
console.log('  typeof localStorage    =', typeof localStorage, '（Node 里没有，浏览器才有）');
console.log('  typeof document        =', typeof document, '（Node 里没有）');
console.log('  typeof globalThis.window =', typeof globalThis.window);
console.log('  => 所以本文件的持久化层做成**可注入的适配器**：');
console.log('     浏览器传 localStorage / document.cookie，Node / SSR 传内存实现或 Cookie 头。');

// ---------------------------------------------------------------------------
// 1. 消息目录组织
// ---------------------------------------------------------------------------

console.log('\n--- 1. 消息目录怎么组织 ---');

console.log('1.1 key 的命名规则（这几条能避免 90% 的混乱）：');
console.table([
  { 规则: '用点分命名空间', 正例: 'cart.checkout.payNow', 反例: 'payNowButtonInCart' },
  { 规则: '末段用英文小驼峰', 正例: 'cart.itemCount', 反例: 'cart.item_count / cart.ItemCount' },
  { 规则: 'key 描述"用途"而非"内容"', 正例: 'common.confirm', 反例: '"确定"' },
  { 规则: '命名空间按页面/领域切', 正例: 'checkout.* / account.* / common.*', 反例: 'page1.* / strings.*' },
  { 规则: '复数变体是**同一个 key 的子键**', 正例: 'cart.itemCount: { one, other }', 反例: 'cart.itemCountOne / ...Other' },
  { 规则: '插值用花括号具名参数', 正例: 'order.shippedAt: "订单 {id} 已于 {date} 发出"', 反例: '"订单 " + id + " 已发出"' },
].map((r) => r));

console.log('\n1.2 目录结构（真实项目里每个 locale 一个文件，便于翻译平台对接）：');
console.log('  locales/');
console.log('    zh-CN.json      <- 默认语言，通常也是 key 的"权威清单"');
console.log('    en-US.json');
console.log('    ar-EG.json      <- 漏翻的那几 key 就是在这里缺席');
console.log('    index.js        <- 聚合成 { "zh-CN": {...}, ... } 并做启动校验');
console.log('  好处：翻译团队按文件交付；CI 能 diff 出"哪个语言少了哪个 key"。');
console.log('  本文件为了可运行，把这几个"文件"内联成下面的对象 —— 结构完全一致。');

console.log('\n1.3 为什么"嵌套结构"比"扁平点分 key"更好维护：');
console.log('  嵌套：{ cart: { itemCount: { one: "...", other: "..." } } }');
console.log('  扁平：{ "cart.itemCount.one": "...", "cart.itemCount.other": "..." }');
console.log('  嵌套在 JSON 里可读、可 diff、翻译平台能按块分配；');
console.log('  但在**运行时取值**时要点分拆开逐层下钻（见下面的 getByPath）。');
console.log('  本文件用嵌套存储 + 点分访问，兼顾两边。');

// ---------------------------------------------------------------------------
// 2. 一个完整可运行的小型 i18n 库
// ---------------------------------------------------------------------------

console.log('\n--- 2. 小型 i18n 库 ---');

// —— 2.1 消息目录（真实项目里 = locales/zh-CN.json 等文件） ——
const MESSAGES = {
  'zh-CN': {
    common: {
      appName: '云笔记',
      confirm: '确定',
      cancel: '取消',
      language: '语言',
    },
    cart: {
      title: '购物车',
      empty: '购物车是空的',
      // 复数变体：同一个 key 下的子键，取值由 Intl.PluralRules 决定
      itemCount: {
        other: '购物车里有 {count} 件商品',
      },
      total: '合计 {amount}',
    },
    order: {
      shippedAt: '订单 {id} 已于 {date} 发出',
      status: {
        pending: '待付款',
        paid: '已付款',
      },
    },
    greeting: {
      morning: '早上好，{name}',
      evening: '晚上好，{name}',
    },
  },
  'en-US': {
    common: {
      appName: 'CloudNotes',
      confirm: 'Confirm',
      cancel: 'Cancel',
      language: 'Language',
    },
    cart: {
      title: 'Cart',
      empty: 'Your cart is empty',
      itemCount: {
        one: 'You have {count} item in your cart',
        other: 'You have {count} items in your cart',
      },
      total: 'Total {amount}',
    },
    order: {
      shippedAt: 'Order {id} shipped on {date}',
      status: {
        pending: 'Pending payment',
        paid: 'Paid',
      },
    },
    greeting: {
      morning: 'Good morning, {name}',
      evening: 'Good evening, {name}',
    },
  },
  'ar-EG': {
    common: {
      appName: 'كلاود نوتس',
      confirm: 'تأكيد',
      cancel: 'إلغاء',
    },
    cart: {
      title: 'سلة التسوق',
      // 注意：这里**故意**没有 empty / total —— 用来演示"漏翻一条"的三种策略。
      total: 'المجموع {amount}',
      itemCount: {
        zero: 'السلة فارغة',
        one: 'لديك منتج واحد',
        two: 'لديك منتجان',
        few: 'لديك {count} منتجات',
        many: 'لديك {count} منتجًا',
        other: 'لديك {count} منتج',
      },
    },
    // 注意：这里**故意**没有 order 命名空间 —— 演示整个命名空间漏翻。
    greeting: {
      morning: 'صباح الخير يا {name}',
    },
  },
};

// 支持的语言清单（顺序即 UI 下拉框的顺序，默认语言放第一个）。
const SUPPORTED_LOCALES = ['zh-CN', 'en-US', 'ar-EG'];
const DEFAULT_LOCALE = 'zh-CN';

console.log('内联的消息目录规模：');
console.table(
  SUPPORTED_LOCALES.map((loc) => {
    const countKeys = (obj) =>
      Object.values(obj).reduce(
        (sum, v) => sum + (v !== null && typeof v === 'object' ? countKeys(v) : 1),
        0,
      );
    return { locale: loc, 叶子节点数: countKeys(MESSAGES[loc]), 命名空间: Object.keys(MESSAGES[loc]).join(', ') };
  }),
);

// —— 2.2 按点分路径取值 ——
/**
 * 在嵌套对象里按 "a.b.c" 路径取值，取不到返回 undefined（不抛错）。
 * @param {object} obj 消息目录
 * @param {string} path 点分路径
 * @returns {unknown}
 */
function getByPath(obj, path) {
  let cursor = obj;
  for (const segment of String(path).split('.')) {
    if (cursor === null || typeof cursor !== 'object') return undefined;
    // 用 hasOwnProperty 而不是 in，避免命中原型链上的属性（如 toString）。
    if (!Object.prototype.hasOwnProperty.call(cursor, segment)) return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}

console.log('\ngetByPath 的边界行为：');
for (const path of ['cart.title', 'cart.itemCount', 'cart.nope', 'nope.deep.path', 'toString']) {
  const v = getByPath(MESSAGES['zh-CN'], path);
  console.log(`  getByPath(zh-CN, ${JSON.stringify(path).padEnd(20)}) ->`,
    v === undefined ? 'undefined' : typeof v === 'object' ? '(对象)' : JSON.stringify(v));
}
console.log('  注意最后一行：toString 在原型链上存在，但 hasOwnProperty 保护了它 ——');
console.log('  否则 t("toString") 会返回一个函数，然后在插值时以极其诡异的方式崩溃。');

// —— 2.3 缺失 key 的三种兜底策略 ——
// 这是 i18n 里最容易做错、也最容易被忽略的一处设计。
const MISSING_STRATEGIES = {
  /** 回退到默认语言；默认语言也没有才用 key 本身 */
  fallback: 'fallback',
  /** 直接返回 key 本身（并记录下来）—— 默认策略：绝不让界面空白 */
  key: 'key',
  /** 开发环境用：立刻抛错，让问题在本地就暴露 */
  throw: 'throw',
};

// —— 2.4 持久化适配器 ——
/**
 * 内存版存储（Node / 测试 / SSR 的默认实现）。
 * 接口与浏览器的 Storage 对齐：getItem / setItem / removeItem。
 */
class MemoryStorage {
  #map = new Map();

  /**
   * @param {string} key 键
   * @returns {string|null}
   */
  getItem(key) {
    return this.#map.has(key) ? this.#map.get(key) : null;
  }

  /**
   * @param {string} key 键
   * @param {string} value 值
   */
  setItem(key, value) {
    this.#map.set(key, String(value));
  }

  /**
   * @param {string} key 键
   */
  removeItem(key) {
    this.#map.delete(key);
  }
}

/**
 * 把 document.cookie 那套字符串接口封装成 Storage 形状（Node 里用不到，仅作演示）。
 * 这里只演示"读 cookie 头"的写法，真实浏览器里读 document.cookie 即可。
 */
class CookieStorage {
  #jar = new Map();

  /**
   * @param {string} key 键
   * @returns {string|null}
   */
  getItem(key) {
    return this.#jar.has(key) ? this.#jar.get(key) : null;
  }

  /**
   * @param {string} key 键
   * @param {string} value 值
   * @param {number} [maxAgeSeconds] 有效期（秒）
   */
  setItem(key, value, maxAgeSeconds = 31536000) {
    this.#jar.set(key, String(value));
    this.lastMaxAge = maxAgeSeconds; // 真实实现里会拼进 Set-Cookie 头
  }

  /**
   * @param {string} key 键
   */
  removeItem(key) {
    this.#jar.delete(key);
  }

  /** 演示用：把 jar 拼成 Cookie 头的形状 */
  toHeader() {
    return [...this.#jar].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

// —— 2.5 正常化与匹配：Intl.Locale 在这里的角色 ——
/**
 * 把一个 BCP 47 标签规范化。非法标签返回 null（不抛错）。
 * @param {string} tag 语言标签
 * @returns {string|null}
 */
function canonicalize(tag) {
  try {
    return Intl.getCanonicalLocales(tag)[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * 把 `requested` 匹配到 `supported` 里最合适的一个（CLDR 的 lookup 语义）。
 *
 * 三个层次，从上到下依次尝试：
 *   1. 规范化后**完全相等**：'zh-CN' -> 'zh-CN'
 *   2. maximize 后 **language + script** 相等：'zh-Hant-TW' 与 'zh-Hant-HK' 共享 zh-Hant
 *   3. 只用 **language** 相等：'en-GB' -> 'en-US'
 * 都没命中就返回 null（由调用方决定是否回退到默认语言）。
 *
 * maximize 的思路来自 07_intl_locale.js：'zh' 会被补全成 'zh-Hans-CN'，
 * 'en' 补成 'en-Latn-US'，于是"短短名"和"长标签"就能放在一起比较了。
 *
 * @param {string} requested 用户请求的标签
 * @param {string[]} supported 系统支持的语言清单
 * @returns {string|null}
 */
function bestMatch(requested, supported) {
  const want = canonicalize(requested);
  if (want === null) return null;

  // 第一层：完全相同
  if (supported.includes(want)) return want;

  // 第二层：language + script 相同（照顾繁体/简体这类"同语言不同文字"的情形）
  let wantLocale;
  try {
    wantLocale = new Intl.Locale(want).maximize();
  } catch {
    return null;
  }
  for (const tag of supported) {
    try {
      const cand = new Intl.Locale(tag).maximize();
      if (cand.language === wantLocale.language && cand.script === wantLocale.script) return tag;
    } catch {
      // 单个候选标签异常不影响整体匹配
    }
  }

  // 第三层：只要语言相同
  for (const tag of supported) {
    try {
      if (new Intl.Locale(tag).language === wantLocale.language) return tag;
    } catch {
      // 同上
    }
  }
  return null;
}

console.log('\nbestMatch 的匹配过程（supported = ' + JSON.stringify(SUPPORTED_LOCALES) + '）：');
console.table(
  [
    ['zh-CN', '第一层：完全相同'],
    ['ZH-cn', '第一层：先规范化成 zh-CN'],
    ['zh', '第二层：maximize 成 zh-Hans-CN，与 zh-CN 的 script 一致'],
    ['zh-Hant-TW', '第二层：maximize 成 zh-Hant-TW，script=Hant 与 zh-CN(Hans) 不符 -> 掉到第三层'],
    ['zh-TW', '同上'],
    ['en-GB', '第三层：language 都是 en'],
    ['ar', '第二层：maximize 成 ar-Arab-EG'],
    ['ar-SA', '第三层'],
    ['de-DE', '都命中不了 -> null（交给调用方回退）'],
    ['not a locale!', '规范化失败 -> null'],
  ].map(([tag, note]) => ({ 请求: tag, 匹配结果: bestMatch(tag, SUPPORTED_LOCALES), 说明: note })),
);
console.log('  注意 zh-TW 落到"第三层"才命中 zh-CN —— 结果是**简体中文**。');
console.log('  这就是真实项目里"台湾用户看到简体界面"的成因：系统没有 zh-Hant，只好按语言回退。');
console.log('  正确做法是显式支持 zh-Hant-TW（或在第二层里就把 Hant 挡下来）。');
console.log('  07_intl_locale.js 的 maximize() 是这里的核心工具：它把短标签补全成完整形态。');
console.log('  另外 Intl.NumberFormat.supportedLocalesOf 实现了同样的 lookup 语义，可用来交叉验证：');
console.log('    supportedLocalesOf(["zh-Hant-TW","de-DE"]) ->',
  JSON.stringify(Intl.NumberFormat.supportedLocalesOf(['zh-Hant-TW', 'de-DE'])));
console.log('    （它返回的是"运行时 ICU 有数据的"，不是"你系统支持的"，两者含义不同，别混用。）');

// —— 2.6 i18n 类：把上面所有零件装成一个库 ——
/**
 * 一个小而完整的 i18n 实现。
 * 职责：消息查找 + 回退 + 复数 + 插值 + 缺失上报 + 语言切换 + 订阅通知。
 */
class I18n {
  #messages;
  #supported;
  #defaultLocale;
  #fallbackTo;
  #missingStrategy;
  #pluralRulesCache = new Map();
  #numberFormatCache = new Map();
  #missing = [];
  #listeners = new Set();
  #locale;

  /**
   * @param {object} config 配置
   * @param {Record<string, object>} config.messages 按语言分的消息目录
   * @param {string[]} config.supportedLocales 支持的语言清单
   * @param {string} config.defaultLocale 默认语言（也是回退目标）
   * @param {string} [config.fallbackTo] 回退语言，默认等于 defaultLocale
   * @param {'fallback'|'key'|'throw'} [config.missingStrategy] 缺失 key 的策略
   * @param {string} [config.locale] 初始语言
   */
  constructor(config) {
    const {
      messages,
      supportedLocales,
      defaultLocale,
      fallbackTo = defaultLocale,
      missingStrategy = MISSING_STRATEGIES.key,
      locale = defaultLocale,
    } = config;
    this.#messages = messages;
    this.#supported = supportedLocales;
    this.#defaultLocale = defaultLocale;
    this.#fallbackTo = fallbackTo;
    this.#missingStrategy = missingStrategy;
    this.#locale = this.#validate(locale);
  }

  /**
   * 校验语言是否在支持清单里，不在则回退到默认语言（并提示）。
   * @param {string} locale 待校验语言
   * @returns {string}
   */
  #validate(locale) {
    const canonical = canonicalize(locale);
    if (canonical !== null && this.#supported.includes(canonical)) return canonical;
    console.warn(`[i18n] 不支持的语言 ${JSON.stringify(locale)}，已回退到 ${this.#defaultLocale}`);
    return this.#defaultLocale;
  }

  /** 当前语言 */
  get locale() {
    return this.#locale;
  }

  /** 支持的语言清单（UI 下拉框直接用这个数组） */
  get supportedLocales() {
    return [...this.#supported];
  }

  /** 截至目前收集到的缺失 key 记录 */
  get missingKeys() {
    return this.#missing.map((m) => ({ ...m }));
  }

  /**
   * 切换语言。会通知所有订阅者，并返回是否真的发生了变化。
   * @param {string} locale 目标语言
   * @returns {boolean} 语言是否发生变化
   */
  setLocale(locale) {
    const next = this.#validate(locale);
    const changed = next !== this.#locale;
    this.#locale = next;
    if (changed) {
      for (const fn of this.#listeners) fn(next);
    }
    return changed;
  }

  /**
   * 订阅语言变化（返回取消订阅的函数）。
   * @param {(locale: string) => void} listener 回调
   * @returns {() => void} 取消订阅
   */
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * 取复数规则实例（按 locale + type 缓存，避免热循环里重复构造）。
   * @param {string} locale 语言
   * @param {'cardinal'|'ordinal'} [type] 序数还是基数
   * @returns {Intl.PluralRules}
   */
  #pluralRules(locale, type = 'cardinal') {
    const key = `${locale}|${type}`;
    let rules = this.#pluralRulesCache.get(key);
    if (rules === undefined) {
      rules = new Intl.PluralRules(locale, { type });
      this.#pluralRulesCache.set(key, rules);
    }
    return rules;
  }

  /**
   * 取数字格式化器（缓存）。
   * @param {string} locale 语言
   * @param {object} options Intl.NumberFormat 选项
   * @returns {Intl.NumberFormat}
   */
  #numberFormat(locale, options = {}) {
    const key = `${locale}|${JSON.stringify(Object.entries(options).sort())}`;
    let fmt = this.#numberFormatCache.get(key);
    if (fmt === undefined) {
      fmt = new Intl.NumberFormat(locale, options);
      this.#numberFormatCache.set(key, fmt);
    }
    return fmt;
  }

  /**
   * 在指定语言的消息目录里找一条消息。
   * @param {string} locale 语言
   * @param {string} key 点分 key
   * @returns {unknown} 字符串消息或复数变体对象，找不到返回 undefined
   */
  #lookup(locale, key) {
    const tree = this.#messages[locale];
    if (tree === undefined) return undefined;
    return getByPath(tree, key);
  }

  /**
   * 计算"查找链"—— 这是三种缺失策略**唯一**的行为差异所在。
   *
   *   'fallback'：当前语言 -> 回退语言 -> （都没有才）key 本身
   *               => 用户看不到 key，但会看到一句"串了语言"的文案
   *   'key'     ：只查当前语言 -> 立刻返回 key 本身
   *               => 漏翻在界面上一眼可见，开发/测试环境用
   *   'throw'   ：只查当前语言 -> 没有就抛错
   *               => 漏翻绝不可能带到线上，但一次漏翻就会白屏
   *
   * @returns {string[]} 查找顺序
   */
  #chain() {
    if (this.#missingStrategy === MISSING_STRATEGIES.fallback) {
      return this.#locale === this.#fallbackTo ? [this.#locale] : [this.#locale, this.#fallbackTo];
    }
    return [this.#locale];
  }

  /**
   * 解析 key：按"查找链"逐语言找，并返回命中信息。
   * 注意"整条命名空间漏翻"和"单条消息漏翻"是同一套逻辑，不需要特判 ——
   * getByPath 在中间层就返回 undefined 了。
   * @param {string} key 点分 key
   * @returns {{value: unknown, locale: string|null}}
   */
  #resolve(key) {
    for (const locale of this.#chain()) {
      const value = this.#lookup(locale, key);
      if (value !== undefined) return { value, locale };
    }
    return { value: undefined, locale: null };
  }

  /**
   * 记录一条缺失（同一条只记一次，避免日志被刷爆）。
   * @param {string} key key
   * @param {string} reason 缺失原因
   */
  #reportMissing(key, reason) {
    if (this.#missing.some((m) => m.key === key && m.locale === this.#locale)) return;
    this.#missing.push({ key, locale: this.#locale, reason, at: this.#missing.length + 1 });
  }

  /**
   * 把 {name} 形式的具名参数替换进模板。数字参数会按当前语言格式化。
   * @param {string} template 模板字符串
   * @param {Record<string, unknown>} params 参数
   * @returns {string}
   */
  #interpolate(template, params) {
    let out = template;
    for (const [name, raw] of Object.entries(params)) {
      const value =
        typeof raw === 'number' ? this.#numberFormat(this.#locale, {}).format(raw) : String(raw);
      // 用 split/join 而不是正则，避免参数里含有特殊字符时出错。
      out = out.split(`{${name}}`).join(value);
    }
    return out;
  }

  /**
   * 取文案。**这是整个库唯一的对外取值入口**。
   *
   * 两种用法：
   *   t('cart.title')                          -> 普通文案
   *   t('cart.itemCount', { count: 3 })        -> 复数文案，自动按 PluralRules 选词形
   *
   * @param {string} key 点分 key
   * @param {Record<string, unknown>} [params] 插值参数；含 count 时触发复数选择
   * @returns {string}
   */
  t(key, params = {}) {
    const { value, locale } = this.#resolve(key);

    // 情况一：查找链走完都没找到
    if (value === undefined) {
      const chainText = this.#chain().join(' -> ');
      this.#reportMissing(key, `未在 ${chainText} 中找到`);
      if (this.#missingStrategy === MISSING_STRATEGIES.throw) {
        // 开发/测试环境：立刻炸，绝不让漏翻溜到线上。
        throw new Error(`[i18n] 缺少文案：${key}（查找链 ${chainText}）`);
      }
      // 'fallback' 与 'key' 走到这一步都只能返回 key 本身 —— 界面绝不能空白。
      // 区别在于**它们走到这一步的频率**：fallback 多了一层回退，命中率高得多。
      return key;
    }

    // 情况二：命中了，但命中的是回退语言 —— 这本身就是一条"漏翻"，要记一笔
    if (locale !== null && locale !== this.#locale) {
      this.#reportMissing(key, `当前语言缺失，已回退到 ${locale}`);
    }

    // 情况三：值是复数变体对象 -> 交给 PluralRules 选词形
    if (value !== null && typeof value === 'object') {
      const count = params.count;
      if (typeof count !== 'number') {
        this.#reportMissing(key, '文案是复数变体，但调用时没传 count');
        return key;
      }
      const category = this.#pluralRules(this.#locale).select(count);
      // 三级回退：精确类别 -> other -> 回退语言的 other。
      const picked =
        value[category] ??
        value.other ??
        getByPath(this.#lookup(this.#fallbackTo, key) ?? {}, 'other');
      if (picked === undefined) {
        this.#reportMissing(key, `复数类别 ${category} 缺失且没有 other 兜底`);
        return key;
      }
      return this.#interpolate(picked, params);
    }

    return this.#interpolate(String(value), params);
  }

  /**
   * 清空缺失记录（例如上报给监控后）。
   */
  clearMissing() {
    this.#missing = [];
  }

  /**
   * 把缺失记录整理成可直接上报监控的结构。
   * @returns {{total: number, byLocale: Record<string, string[]>}}
   */
  missingReport() {
    const byLocale = {};
    for (const m of this.#missing) {
      byLocale[m.locale] ??= [];
      byLocale[m.locale].push(m.key);
    }
    return { total: this.#missing.length, byLocale };
  }

  /** 已缓存的 formatter 数量（调试用） */
  get cacheSize() {
    return this.#pluralRulesCache.size + this.#numberFormatCache.size;
  }
}

console.log('\n库已定义。对外 API：t(key, params) / setLocale / subscribe / missingKeys / missingReport。');
console.log('内部把三件事分开了：**解析**（#resolve）→ **记录**（#reportMissing）→ **渲染**（#interpolate）。');
console.log('  "解析"负责回退链，"记录"负责可观测性，"渲染"负责复数与插值 —— 互不干扰，便于单测。');

// ---------------------------------------------------------------------------
// 3. 缺失 key 的兜底与上报
// ---------------------------------------------------------------------------

console.log('\n--- 3. 缺失 key：三种策略的实际表现 ---');

// 先看清楚"漏翻"的两种形态：
console.log('ar-EG 目录的漏翻情况（这是上面刻意留的）：');
console.log('  cart.empty      ->', getByPath(MESSAGES['ar-EG'], 'cart.empty') === undefined ? '缺失（单条漏翻）' : '有');
console.log('  order.*         ->', MESSAGES['ar-EG'].order === undefined ? '整个命名空间缺失（成片漏翻）' : '有');
console.log('  greeting.evening->', getByPath(MESSAGES['ar-EG'], 'greeting.evening') === undefined ? '缺失' : '有');
console.log('  nav.settings    ->', getByPath(MESSAGES['ar-EG'], 'nav.settings') === undefined ? '缺失（而且谁都没有）' : '有');
console.log('  => 真实项目里，这两类漏翻都应该被**同一个机制**捕获，不需要分别处理。');

/**
 * 在给定的策略下演示几个最典型的取值，并返回结果。
 * @param {'fallback'|'key'|'throw'} strategy 策略
 * @returns {{行: string}[]}
 */
function demoStrategy(strategy) {
  const i18n = new I18n({
    messages: MESSAGES,
    supportedLocales: SUPPORTED_LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    missingStrategy: strategy,
    locale: 'ar-EG',
  });
  const cases = [
    ['cart.title', {}, '阿语有，正常命中'],
    ['cart.empty', {}, '阿语缺失，但 zh-CN 有'],
    ['order.shippedAt', { id: 'A-1', date: '2024-03-15' }, '整个 order 命名空间在阿语缺失'],
    ['cart.itemCount', { count: 3 }, '阿语有 few 词形'],
    ['nav.settings', {}, '所有语言都没有 -> 真正的"漏翻"'],
  ];
  return cases.map(([key, params, note]) => {
    let result;
    try {
      result = JSON.stringify(i18n.t(key, params));
    } catch (err) {
      result = `${err.constructor.name}: ${err.message}`;
    }
    return { 取值: key, 说明: note, 结果: result };
  });
}

console.log('\n策略一：missingStrategy = "fallback"（查找链 = 当前语言 -> 回退语言 -> key）');
console.table(demoStrategy(MISSING_STRATEGIES.fallback));
console.log('  特点：界面**永远不会出现 key**，用户体验最好；');
console.log('  代价：用户会在一句阿语里突然读到一句中文，且**代码不会报错**；');
console.log('  适合：C 端产品（宁可语言混杂，也不能露出 cart.empty 这种内部标识）。');

console.log('\n策略二：missingStrategy = "key"（查找链 = 当前语言 -> key）');
console.table(demoStrategy(MISSING_STRATEGIES.key));
console.log('  特点：漏翻**一眼可见**（界面直接显示 cart.empty），测试同学一定会提单；');
console.log('        因为不回退，它暴露的漏翻数量比 fallback 多得多 —— 这正是它在开发环境的价值；');
console.log('  代价：用户体验差，不适合直接上线给 C 端；');
console.log('  适合：开发/测试环境默认值，配合"缺失上报"做 CI 卡点。');

console.log('\n策略三：missingStrategy = "throw"（查找链 = 当前语言 -> 抛错）');
console.table(demoStrategy(MISSING_STRATEGIES.throw));
console.log('  特点：问题在**第一次渲染**就暴露，绝不可能带到线上；');
console.log('  代价：一个漏翻就能让整页白屏，只能用在开发环境或单元测试里；');
console.log('  适合：`if (process.env.NODE_ENV !== "production")` 下开启。');

console.log('\n对照着看同一批 key 在三种策略下的差异 —— 差异**只在 cart.empty 与 nav.settings**：');
console.table([
  { 取值: 'cart.title', '阿语有吗': '有', fallback: 'سلة التسوق', key: 'سلة التسوق', throw: 'سلة التسوق' },
  { 取值: 'cart.empty', '阿语有吗': '没有（zh-CN 有）', fallback: '购物车是空的', key: 'cart.empty（露 key）', throw: '抛错（白屏）' },
  { 取值: 'nav.settings', '阿语有吗': '没有（谁都没有）', fallback: 'nav.settings（露 key）', key: 'nav.settings（露 key）', throw: '抛错（白屏）' },
].map((r) => r));
console.log('  读表要点：');
console.log('    · fallback 只在"回退语言也没有"时才露 key —— 命中率最高，问题最隐蔽；');
console.log('    · key/throw 从"当前语言没有"就开始报，所以它们在开发环境更有用；');
console.log('    · throw 与 key 的差别只是"抛错"还是"返回 key"，一个让测试红，一个让人眼看到。');

console.log('\n三者的取舍（一句话版）：');
console.table([
  { 策略: 'fallback', '界面会露出 key 吗': '不会', '会自动消失吗': '不会，只是换了个语言显示', 推荐环境: '生产（C 端）' },
  { 策略: 'key', '界面会露出 key 吗': '会', '会自动消失吗': '不会', 推荐环境: '开发 / 测试 / 内部后台' },
  { 策略: 'throw', '界面会露出 key 吗': '会白屏', '会自动消失吗': '不会', 推荐环境: '开发 / 单元测试' },
].map((r) => r));
console.log('  **无论选哪种，"上报"都必须做** —— 上面三种没有一种能让你"知道漏了哪几条"。');

console.log('\n缺失上报（这是三种策略的共同底座）：');
const reporter = new I18n({
  messages: MESSAGES,
  supportedLocales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  locale: 'ar-EG',
});
// 模拟用户在一次会话里点过的一批文案
for (const [key, params] of [
  ['cart.title', {}],
  ['cart.empty', {}],
  ['cart.itemCount', { count: 3 }],
  ['cart.itemCount', { count: 1 }],
  ['order.status.paid', {}],
  ['greeting.evening', { name: 'علي' }],
  ['nav.settings', {}],
  ['cart.empty', {}], // 重复访问同一条：不会重复记录
]) {
  reporter.t(key, params);
}
console.log('  missingReport() ->', JSON.stringify(reporter.missingReport(), null, 2));
console.log('\n  这份报告可以直接：');
console.log('    · 打到监控（按 locale + key 聚合，看"哪个语言欠了多少条"）；');
console.log('    · 在 CI 里跑一遍所有语言的 key 集合，diff 出缺失清单，直接卡住合并；');
console.log('    · 交给翻译平台按 key 生成待翻译任务。');
console.log('  注意报告里的原因字段区分了严重程度：');
console.log('    "未在 ar-EG 中找到"          -> 彻底没有，界面会露 key（最严重）');
console.log('    "当前语言缺失，已回退到 zh-CN" -> 靠回退兜住了，但用户看到的语言混杂了');

console.log('\nCI 卡点该怎么做（不依赖运行，纯静态对比 key 集合）：');
/**
 * 收集一个消息目录里所有叶子节点的点分路径。
 * @param {object} tree 消息目录
 * @param {string} [prefix] 前缀
 * @returns {string[]}
 */
function collectKeys(tree, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(tree)) {
    const path = prefix === '' ? k : `${prefix}.${k}`;
    if (v !== null && typeof v === 'object') {
      // 复数变体对象：记录"基名"，不把 one/other 当成独立 key。
      const isPluralGroup = Object.keys(v).every((sub) => ['zero', 'one', 'two', 'few', 'many', 'other'].includes(sub));
      if (isPluralGroup) out.push(path);
      else out.push(...collectKeys(v, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

const baseKeys = new Set(collectKeys(MESSAGES[DEFAULT_LOCALE]));
console.table(
  SUPPORTED_LOCALES.map((loc) => {
    const keys = new Set(collectKeys(MESSAGES[loc]));
    const missing = [...baseKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !baseKeys.has(k));
    return {
      locale: loc,
      'key 总数': keys.size,
      缺失: missing.length === 0 ? '-' : `${missing.length} 条：${missing.join(', ')}`,
      多余: extra.length === 0 ? '-' : extra.join(', '),
    };
  }),
);
console.log('  这段代码放进 CI：缺失数 > 0 就 exit 1，漏翻就再也进不了主干。');
console.log('  用默认语言当"权威清单"是关键 —— 它定义了"系统一共有多少条文案"。');

// ---------------------------------------------------------------------------
// 4. 首次访问的语言协商
// ---------------------------------------------------------------------------

console.log('\n--- 4. 语言协商：四个优先级 ---');

console.log('优先级从高到低（高优先级一旦命中就停止）：');
console.log('  1. **用户显式设置**：URL 参数 ?lang=en-US、或页面上手动切换后的即时生效；');
console.log('  2. **已存储的偏好**：localStorage / Cookie（上次访问选的）；');
console.log('  3. **Accept-Language**：浏览器/系统发给服务端的语言偏好列表；');
console.log('  4. **默认语言**：兜底。');
console.log('  为什么 URL 参数必须排在存储之上？');
console.log('    因为"点击切换语言链接"和"分享一个英文链接给同事"都靠它，');
console.log('    如果存储优先，同事打开链接看到的仍是他自己的语言，链接就"失效"了。');

/**
 * 按分辨率优先级协商出一个受支持的语言。
 * @param {object} input 输入
 * @param {string|null} [input.explicit] 用户显式设置（URL 参数）
 * @param {string|null} [input.stored] 已存储的偏好
 * @param {string|null} [input.acceptLanguage] 请求头原文
 * @param {string[]} input.supported 支持的语言清单
 * @param {string} input.defaultLocale 默认语言
 * @returns {{locale: string, source: string, trace: string[]}}
 */
function negotiateLocale({ explicit = null, stored = null, acceptLanguage = null, supported, defaultLocale }) {
  const trace = [];

  // 步骤 1：URL 参数（显式设置）
  if (explicit !== null && explicit !== '') {
    const hit = bestMatch(explicit, supported);
    trace.push(`显式设置 ${JSON.stringify(explicit)} -> ${hit ?? '不支持'}`);
    if (hit !== null) return { locale: hit, source: 'explicit', trace };
  } else {
    trace.push('显式设置：无');
  }

  // 步骤 2：已存储的偏好
  if (stored !== null && stored !== '') {
    const hit = bestMatch(stored, supported);
    trace.push(`已存储偏好 ${JSON.stringify(stored)} -> ${hit ?? '不支持'}`);
    if (hit !== null) return { locale: hit, source: 'stored', trace };
  } else {
    trace.push('已存储偏好：无');
  }

  // 步骤 3：Accept-Language
  if (acceptLanguage !== null && acceptLanguage !== '') {
    const parsed = parseAcceptLanguage(acceptLanguage);
    trace.push(`Accept-Language 解析为 ${JSON.stringify(parsed.map((p) => p.tag))}`);
    for (const { tag } of parsed) {
      const hit = bestMatch(tag, supported);
      if (hit !== null) return { locale: hit, source: 'accept-language', trace };
    }
    trace.push('Accept-Language 里没有任何一条被支持');
  } else {
    trace.push('Accept-Language：无');
  }

  // 步骤 4：默认语言
  trace.push(`回退到默认语言 ${defaultLocale}`);
  return { locale: defaultLocale, source: 'default', trace };
}

/**
 * 解析 Accept-Language 头，按 q 值从高到低排序。
 * 格式示例：`zh-CN,zh;q=0.9,en;q=0.8`，`*` 表示"任意语言"。
 * @param {string} header 头原文
 * @returns {{tag: string, q: number}[]}
 */
function parseAcceptLanguage(header) {
  return String(header)
    .split(',')
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(';');
      const tag = rawTag.trim();
      let q = 1;
      for (const p of params) {
        const [k, v] = p.split('=').map((s) => s.trim());
        if (k.toLowerCase() === 'q') {
          const parsed = Number.parseFloat(v);
          q = Number.isFinite(parsed) ? parsed : 0;
        }
      }
      return { tag, q };
    })
    .filter((entry) => entry.tag !== '' && entry.tag !== '*' && entry.q > 0)
    // 稳定排序：q 相同时保持原有顺序（保持"用户偏好顺序"的语义）。
    .sort((a, b) => b.q - a.q);
}

console.log('\nAccept-Language 解析（注意 q 值排序与 * 的处理）：');
console.table(
  [
    'zh-CN,zh;q=0.9,en;q=0.8',
    'en-GB,en;q=0.9,de;q=0.5',
    'zh-Hant-TW,zh;q=0.8,en-US;q=0.6',
    'de-DE,fr;q=0.7',
    '*',
    'en;q=0',
    '',
  ].map((header) => ({
    'Accept-Language': header === '' ? '(空)' : header,
    解析结果: JSON.stringify(parseAcceptLanguage(header).map((p) => `${p.tag}(q=${p.q})`)),
  })),
);
console.log('  三条要点：');
console.log('    · q 值越大越优先；省略 q 等于 1；q=0 表示"明确不要"（要过滤掉）；');
console.log('    · `*` 表示"任意语言"，不该当成一个具体标签去匹配（过滤掉，让它自然落到默认语言）；');
console.log('    · 排序必须是**稳定**的，否则 q 相同的两个标签顺序会随机变。');

console.log('\n四种场景下的协商结果：');
const SCENARIOS = [
  { 名称: '首次访问，浏览器发中文', explicit: null, stored: null, acceptLanguage: 'zh-CN,zh;q=0.9,en;q=0.8' },
  { 名称: '首次访问，浏览器发繁体', explicit: null, stored: null, acceptLanguage: 'zh-Hant-TW,zh;q=0.8' },
  { 名称: '上次存了英文，这次不带参数', explicit: null, stored: 'en-US', acceptLanguage: 'zh-CN,zh;q=0.9' },
  { 名称: '分享的英文链接（带 ?lang=en-US）', explicit: 'en-US', stored: 'zh-CN', acceptLanguage: 'zh-CN' },
  { 名称: '浏览器只发德语（不支持）', explicit: null, stored: null, acceptLanguage: 'de-DE,de;q=0.9' },
  { 名称: 'URL 里是垃圾值，但存储里有阿语', explicit: 'not a locale!', stored: 'ar-EG', acceptLanguage: 'en-US' },
];
console.table(
  SCENARIOS.map((s) => {
    const r = negotiateLocale({
      explicit: s.explicit,
      stored: s.stored,
      acceptLanguage: s.acceptLanguage,
      supported: SUPPORTED_LOCALES,
      defaultLocale: DEFAULT_LOCALE,
    });
    return {
      场景: s.名称,
      结果: r.locale,
      来源: r.source,
    };
  }),
);
console.log('  逐条看 trace 更能理解优先级（下面打印最后一条的完整链路）：');
for (const line of negotiateLocale({
  explicit: 'not a locale!',
  stored: 'ar-EG',
  acceptLanguage: 'en-US',
  supported: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
}).trace) {
  console.log('    ' + line);
}
console.log('  => 显式值非法时**不能直接回退到默认语言**，要继续往下走流程，');
console.log('     否则"URL 参数写错一个字符"就会把用户已存的偏好也一起丢掉。');

// ---------------------------------------------------------------------------
// 5. 语言偏好的持久化：三种存法的取舍
// ---------------------------------------------------------------------------

console.log('\n--- 5. 持久化：localStorage / Cookie / URL 参数 ---');

console.table([
  {
    存法: 'localStorage',
    服务端能读到吗: '不能（只在浏览器 JS 里）',
    会随请求发送吗: '不会',
    容量: '约 5MB',
    生效时机: '客户端 JS 执行后（首屏可能闪一下）',
    适合: '纯 SPA / 客户端渲染',
  },
  {
    存法: 'Cookie',
    服务端能读到吗: '能（随 Cookie 头发送）',
    会随请求发送吗: '会（每个请求都带）',
    容量: '约 4KB',
    生效时机: '服务端渲染时就能用（无闪烁）',
    适合: 'SSR / 需要按语言返回不同 HTML',
  },
  {
    存法: 'URL 参数',
    服务端能读到吗: '能',
    会随请求发送吗: '会（就在 URL 里）',
    容量: '受 URL 长度限制（实际几 KB）',
    生效时机: '立刻（无需任何存储）',
    适合: '可分享链接、SEO、调试、多语言站点',
  },
].map((r) => r));

console.log('\n三者不是"三选一"，主流做法是**组合**：');
console.log('  · URL 参数：最高优先级，用于分享与 SEO，但**不必持久化**；');
console.log('  · Cookie：SSR 场景的主力，服务端拿到它直接渲染对应语言的 HTML；');
console.log('  · localStorage：客户端切换时同步写一份，跨标签页可监听 storage 事件。');
console.log('  · 最佳实践：切换语言时**同时**写 Cookie（给 SSR）与 localStorage（给客户端），');
console.log('    并立刻把当前 URL 上的 ?lang= 也更新掉（便于复制分享）。');

/**
 * 把"语言偏好"的读写封装成一个可换后端的适配器。
 * 三种后端的**读取语义相同**，差异只在存储位置与生效时机。
 */
class LocaleStore {
  #backend;

  /**
   * @param {object} backend 形状与 Storage 一致的实现
   * @param {string} [key] 存储键名（建议带前缀，避免与别的应用冲突）
   */
  constructor(backend, key = 'app.locale') {
    this.#backend = backend;
    this.key = key;
  }

  /**
   * 读已存储的偏好。任何异常都当作"没有存储"处理。
   * @returns {string|null}
   */
  read() {
    try {
      return this.#backend.getItem(this.key);
    } catch {
      // 浏览器的隐私模式 / 禁用 Cookie 会让 getItem 抛异常，必须兜住。
      return null;
    }
  }

  /**
   * 写偏好。写失败不应该影响功能（只是"下次访问不记得"而已）。
   * @param {string} locale 语言
   * @returns {boolean} 是否写入成功
   */
  write(locale) {
    try {
      this.#backend.setItem(this.key, locale);
      return true;
    } catch {
      return false;
    }
  }

  /** 清除偏好 */
  clear() {
    try {
      this.#backend.removeItem(this.key);
    } catch {
      // 同上，忽略
    }
  }
}

// Node 里没有 localStorage，用一个**抛异常**的假实现来演示"隐私模式/禁用存储"的路径。
const throwingStorage = {
  getItem() {
    throw new Error('SecurityError: 存储被禁用');
  },
  setItem() {
    throw new Error('QuotaExceededError: 存储不可写');
  },
  removeItem() {
    throw new Error('SecurityError: 存储被禁用');
  },
};

console.log('\nLocaleStore 在三种后端下的同一套用法：');
const memStore = new LocaleStore(new MemoryStorage());
const cookieStore = new LocaleStore(new CookieStorage(), 'app_locale');
const brokenStore = new LocaleStore(throwingStorage);

console.log('  1) 内存版（Node / SSR 默认）：');
console.log('     read() 初始 ->', memStore.read());
console.log('     write("en-US") ->', memStore.write('en-US'), '| read() ->', memStore.read());
memStore.clear();
console.log('     clear() 后 read() ->', memStore.read());

console.log('  2) Cookie 版（服务端可读）：');
console.log('     write("ar-EG") ->', cookieStore.write('ar-EG'), '| read() ->', cookieStore.read());
console.log('     Cookie 头形状 ->', cookieStore instanceof LocaleStore ? new CookieStorage().toHeader() : '');
console.log('     （真实实现里还要加 path=/; max-age=31536000; SameSite=Lax）');

console.log('  3) 存储被禁用时（隐私模式 / 用户禁用 Cookie）：');
console.log('     read() ->', brokenStore.read(), '（不抛错，当作"没存过"）');
console.log('     write() ->', brokenStore.write('en-US'), '（返回 false，但功能照常）');
console.log('     => 所有存储调用**必须**能容忍失败，否则隐私模式下整个应用直接崩。');
console.log('        这就是第 2 节那三个 try/catch 存在的意义 —— 不是为了好看。');

console.log('\n一个完整的"读偏好 -> 协商 -> 落盘"流程：');
/**
 * 首次加载时的语言初始化：读三个来源，协商，然后落盘。
 * @param {object} input 输入
 * @param {object} input.url URL 对象（取 ?lang=）
 * @param {LocaleStore|null} input.store 持久化后端
 * @param {string|null} input.acceptLanguage Accept-Language 头
 * @param {string[]} input.supported 支持的语言
 * @param {string} input.defaultLocale 默认语言
 * @param {boolean} [input.persist] 是否把结果落盘
 * @returns {{locale: string, source: string, trace: string[]}}
 */
function initLocale({ url, store, acceptLanguage, supported, defaultLocale, persist = true }) {
  const explicit = url.searchParams.get('lang');
  const stored = store === null ? null : store.read();
  const result = negotiateLocale({ explicit, stored, acceptLanguage, supported, defaultLocale });
  // 只有"用户主动选择"才落盘；"因为浏览器默认而选中的语言"不写，
  // 否则用户以后在浏览器里改了偏好，你的存储会一直盖住它。
  const isUserChoice = result.source === 'explicit';
  if (persist && isUserChoice && store !== null) {
    const ok = store.write(result.locale);
    result.trace.push(`落盘 ${result.locale} -> ${ok ? '成功' : '失败（存储不可用，忽略）'}`);
  } else if (persist) {
    result.trace.push(`来源是 ${result.source}，非用户主动选择，不落盘`);
  }
  return result;
}

const initCases = [
  ['首次访问（无参数、无存储）', { url: new URL('https://example.com/'), acceptLanguage: 'en-GB,en;q=0.9' }],
  ['用户点了切换链接 ?lang=ar-EG', { url: new URL('https://example.com/?lang=ar-EG'), acceptLanguage: 'en-GB,en;q=0.9' }],
  ['分享的链接 + 已有存储', { url: new URL('https://example.com/?lang=en-US'), acceptLanguage: 'zh-CN' }],
];
const flowStore = new LocaleStore(new MemoryStorage());
console.table(
  initCases.map(([name, cfg]) => {
    const r = initLocale({
      url: cfg.url,
      store: flowStore,
      acceptLanguage: cfg.acceptLanguage,
      supported: SUPPORTED_LOCALES,
      defaultLocale: DEFAULT_LOCALE,
    });
    return {
      场景: name,
      结果: r.locale,
      来源: r.source,
      '存储里现在是': String(flowStore.read()),
    };
  }),
);
console.log('  第三条关键：URL 参数优先，所以分享链接总能生效 —— 这正是它的价值。');
console.log('  同时因为"非用户主动选择不落盘"，浏览器偏好变化时不会被旧存储盖住。');

// ---------------------------------------------------------------------------
// 6. 端到端演练：把四块串起来
// ---------------------------------------------------------------------------

console.log('\n--- 6. 端到端演练 ---');

// 模拟一次完整的用户会话：首访 -> 切语言 -> 刷新 -> 换设备。
const sessionStore = new LocaleStore(new MemoryStorage());
const sessionLog = [];

// 首访：浏览器发英文
const first = initLocale({
  url: new URL('https://example.com/'),
  store: sessionStore,
  acceptLanguage: 'en-US,en;q=0.9',
  supported: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});
sessionLog.push(['首访（Accept-Language: en-US）', first.locale, first.source, String(sessionStore.read())]);

// 建库并订阅语言变化（模拟"切了语言要重渲染"）
const i18n = new I18n({
  messages: MESSAGES,
  supportedLocales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  missingStrategy: MISSING_STRATEGIES.key,
  locale: first.locale,
});
const rerenders = [];
const unsubscribe = i18n.subscribe((loc) => rerenders.push(loc));

console.log('1) 首访渲染（来源：' + first.source + '，语言：' + i18n.locale + '）：');
console.log('   ' + i18n.t('common.appName') + ' / ' + i18n.t('cart.title') + ' / ' + i18n.t('cart.itemCount', { count: 3 }));

console.log('\n2) 用户在下拉框里选了阿拉伯语（06_intl_display_names.js 提供选项名）：');
i18n.setLocale('ar-EG');
const displayNames = new Intl.DisplayNames([i18n.locale], { type: 'language' });
console.log('   切换后重渲染次数 =', rerenders.length, '| 当前语言 =', i18n.locale);
console.log('   ' + i18n.t('common.appName') + ' / ' + i18n.t('cart.title'));
console.log('   复数演示（阿语有 6 个词形，英语只有 2 个，中文只有 1 个）：');
for (const count of [0, 1, 2, 3, 11, 100]) {
  console.log(`     count=${String(count).padStart(3)} -> ${i18n.t('cart.itemCount', { count })}`);
}
console.log('   同一个 t() 调用，六种数字六种措辞 —— 全部由 Intl.PluralRules 决定，代码里没有任何 if。');
console.log('   语言名用 DisplayNames 渲染（这才是给用户看的写法）：',
  displayNames.of('ar-EG'), '/', displayNames.of('zh-CN'), '/', displayNames.of('en-US'));

console.log('\n3) 切到中文，再切回阿语（幂等性与变化检测）：');
console.log('   setLocale("zh-CN") 返回', i18n.setLocale('zh-CN'), '（true = 真的变了）');
console.log('   setLocale("zh-CN") 再调一次返回', i18n.setLocale('zh-CN'), '（false = 没变化，不触发重渲染）');
console.log('   重渲染次数仍然是', rerenders.length, '—— 这就是 setLocale 返回布尔值的用处。');
i18n.setLocale('ar-EG');

console.log('\n4) 数字也一起本地化（t() 内部走 Intl.NumberFormat）：');
console.log('   合计金额 cart.total（金额用最小单位整数「分」，见 08 篇铁律四）：');
for (const loc of SUPPORTED_LOCALES) {
  i18n.setLocale(loc);
  const amount = new Intl.NumberFormat(loc, { style: 'currency', currency: 'CNY' }).format(123456 / 100);
  console.log(`     ${loc.padEnd(6)} -> ${i18n.t('cart.total', { amount })}`);
}
console.log('   注意 ar-EG 那一行里**藏着一个不可见的 RLM 方向控制字符**（在"المجموع"和数字之间）。');
console.log('   这是 Intl.NumberFormat 为了让"$ 贴在数字哪一侧"正确而插入的 ——');
console.log('   如果你把这行结果存库或当 key，就会踩到 10_intl_rtl_and_bidi.js 讲的那一整类 bug。');

console.log('\n5) 时间渲染必须显式传 timeZone（08 篇铁律三）：');
i18n.setLocale('zh-CN');
const shippedAt = new Intl.DateTimeFormat(i18n.locale, {
  timeZone: 'Asia/Shanghai',
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date('2024-03-15T09:30:00Z'));
console.log('   ', i18n.t('order.shippedAt', { id: 'A-1024', date: shippedAt }));

console.log('\n6) 缺参数时的表现（复数文案没传 count）：');
console.log('   t("cart.itemCount")  ->', JSON.stringify(i18n.t('cart.itemCount')));
console.log('   t("cart.total")      ->', JSON.stringify(i18n.t('cart.total')), '（没有 amount，占位符原样留下）');
console.log('   => 插值"缺参数"不会报错，会把 {amount} 原样留在界面上。');
console.log('      生产环境应该在开发构建里扫描"渲染结果仍含 {xxx}"的情况并告警。');

console.log('\n7) 一次会话后的缺失报告（这就是要打进监控的东西）：');
console.log(JSON.stringify(i18n.missingReport(), null, 2));
console.log('   每条记录的完整形态（含原因，reason 字段是排查的关键）：');
console.table(i18n.missingKeys.map((m) => ({ key: m.key, locale: m.locale, 原因: m.reason })));

// 一次"用户点了切换链接"带来的完整流程：协商 -> 落盘 -> 下次刷新直接命中存储
const reload = initLocale({
  url: new URL('https://example.com/?lang=zh-CN'),
  store: sessionStore,
  acceptLanguage: 'en-US,en;q=0.9',
  supported: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});
sessionLog.push(['点了 ?lang=zh-CN 后刷新', reload.locale, reload.source, String(sessionStore.read())]);
sessionLog.push(['再刷新一次（URL 上没有参数）', initLocale({
  url: new URL('https://example.com/'),
  store: sessionStore,
  acceptLanguage: 'en-US,en;q=0.9',
  supported: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
}).locale, 'stored', String(sessionStore.read())]);

console.log('\n8) 会话轨迹：');
console.table(sessionLog.map(([阶段, locale, 来源, 存储]) => ({ 阶段, 语言: locale, 来源, '存储里的值': 存储 ?? '(空)' })));
console.log('   读表要点：');
console.log('    · 第 1 行：来源是 accept-language，所以**没有落盘** ——');
console.log('      存储保持为空，用户以后在浏览器里改了偏好，你的存储不会一直盖住它；');
console.log('    · 第 2 行：用户点了 ?lang=zh-CN（显式选择）-> 落盘；');
console.log('    · 第 3 行：URL 上没有参数了，但来源变成 stored -> 记忆生效，无需再协商。');

// 取消订阅，避免内存泄漏（真实项目里在组件卸载时调用）。
unsubscribe();
console.log('\n   取消订阅后重渲染次数不再增长：', rerenders.length);
i18n.setLocale('en-US');
console.log('   再切一次语言后重渲染次数 =', rerenders.length, '（确实没再通知）');

console.log('\n9) 缓存效果（08 篇铁律二：绝不在循环里 new formatter）：');
i18n.setLocale('zh-CN');
const before = i18n.cacheSize;
const runLoop = () => {
  for (let i = 0; i < 1000; i += 1) {
    i18n.t('cart.itemCount', { count: (i % 7) + 1 });
  }
};
runLoop();
const afterFirst = i18n.cacheSize;
runLoop();
const afterSecond = i18n.cacheSize;
console.log('   循环 1000 次 t()，缓存的 formatter 数量：', before, '->', afterFirst, '->', afterSecond);
console.log('   第一轮增长（首次使用某个 locale 的 formatter 时才构造），');
console.log('   第二轮起**不再增长** —— 这就是"命中缓存"的判定方式。');
console.log('   反例：如果每轮都在涨，说明缓存 key 里混进了参数（比如把 count 拼进了 key）。');

// ---------------------------------------------------------------------------
// 7. 如果要上真实项目，还需要补什么
// ---------------------------------------------------------------------------

console.log('\n--- 7. 从"能跑"到"能上线"还差什么 ---');

console.table([
  { 缺口: '消息按语言拆成文件', 做法: 'locales/zh-CN.json 等，构建时聚合；大项目用动态 import 按需加载', 为什么: '否则首屏要下载所有语言' },
  { 缺口: '与翻译平台对接', 做法: '导出/导入 XLIFF、PO、CSV；key 一旦发布就不要改', 为什么: '改 key 等于让已翻译的内容全部作废' },
  { 缺口: 'ICU MessageFormat', 做法: '超过"复数 + 插值"的场景（选择、嵌套复数）需要完整语法，用 @formatjs/intl-messageformat', 为什么: '阿语的"双数"、俄语的"格变化"靠简单插值覆盖不了' },
  { 缺口: '服务端渲染', 做法: '从 Cookie 或 Accept-Language 定语言，把 locale 一起注水给前端', 为什么: '避免首屏闪烁（FOUC）与 SEO 抓错语言' },
  { 缺口: 'RTL 适配', 做法: 'locale 的 direction 决定 dir 属性 + 逻辑属性', 为什么: '详见 10_intl_rtl_and_bidi.js' },
  { 缺口: 'CI 校验', 做法: 'key 集合 diff + 渲染结果扫描残留 {xxx}', 为什么: '把漏翻挡在合并之前' },
  { 缺口: '缺失上报监控', 做法: '按 locale + key 聚合打点，设阈值告警', 为什么: '线上新漏的翻译要能第一时间知道' },
  { 缺口: '伪本地化测试', 做法: '把 zh-CN 的文案替换成"⟦Ţëšţ⟧"这种变长假文，跑一遍 UI', 为什么: '能提前发现写死的宽度、截断、拼字符串' },
].map((r) => r));

console.log('\n伪本地化的效果预览（一句话就能看出哪儿写死了宽度）：');
/**
 * 极简伪本地化：把 ASCII 字母换成带变音符的版本，并在两端加标记，长度拉长 30%。
 * @param {string} text 原文
 * @returns {string}
 */
function pseudoLocalize(text) {
  const map = { a: 'á', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'í', j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ', n: 'ñ', o: 'ó', p: 'þ', q: 'ǫ', r: 'ŕ', s: 'š', t: 'ţ', u: 'ú', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž' };
  const swapped = [...text].map((c) => map[c] ?? map[c.toLowerCase()] ?? c).join('');
  return `⟦${swapped}⟧`;
}
for (const key of ['common.appName', 'cart.title', 'cart.empty', 'order.shippedAt']) {
  const en = getByPath(MESSAGES['en-US'], key);
  console.log(`  ${key.padEnd(18)} 原文: ${String(en).padEnd(34)} 伪本地化: ${pseudoLocalize(String(en))}`);
}
console.log('  注意上面用的是 en-US 文案 —— 因为伪本地化的核心手法是"替换 ASCII 字母"，');
console.log('  中文文案里没有 ASCII 字母，只能靠"加括号 + 拉长"来模拟膨胀；');
console.log('  真正接入时，伪本地化针对的是**源语言（通常是英文）**，才会看出字母变形。');
console.log('  伪本地化常用在中英之外再加一列"假语言"，让设计师和前端尽早看到膨胀后的布局。');

// ---------------------------------------------------------------------------
// 8. 交付前检查清单
// ---------------------------------------------------------------------------

console.log('\n--- 8. i18n 工程化检查清单 ---');

console.table(
  [
    ['key 是否用点分命名空间、描述用途？', 'cart.checkout.payNow，绝不用中文句子当 key'],
    ['是否用默认语言当"权威 key 清单"？', 'CI 里 diff 各语言的 key 集合'],
    ['缺失 key 的策略是否明确？', '生产 fallback、开发 key 或 throw，三选一并写进文档'],
    ['是否有缺失上报？', '缺失记录打监控，按 locale + key 聚合'],
    ['文案是否全部走 t()？', '严禁在 JS 里用 + 号拼句子（词序/方向/复数都会错）'],
    ['复数是否按语言建表？', '阿语 6 个词形、俄语 4 个，中文只有 other'],
    ['插值参数是否具名？', '{count} 而不是 %s / %d（后者无法重排语序）'],
    ['语言协商的优先级是否写死并测试？', '显式 > 存储 > Accept-Language > 默认'],
    ['URL 参数是否优先于存储？', '否则分享链接失效'],
    ['非用户主动选择的语言是否避免落盘？', '否则会盖住浏览器后来的偏好'],
    ['存储访问是否容忍异常？', '隐私模式 / 禁用 Cookie 下 getItem 会抛错'],
    ['语言切换是否通知订阅者？', 'setLocale 返回"是否变化"，变化才重渲染'],
    ['SSR 场景是否从 Cookie 定语言？', '避免首屏闪烁与 SEO 抓错'],
    ['是否跑过伪本地化？', '提前发现写死的宽度与截断'],
  ].map(([检查项, 做法], i) => ({ '#': i + 1, 检查项, 做法 })),
);

console.log('\n最后：把本文件的三层边界记牢 ——');
console.log('  · **Intl**：只管"同一份数据在不同语言下怎么写"，无状态、可缓存；');
console.log('  · **i18n 库**：管"文案内容 + 复数 + 插值 + 回退"，有状态、要能订阅；');
console.log('  · **应用层**：管"当前语言从哪来、存到哪去、优先级如何"。');
console.log('  三层的职责一旦混在一起（比如在组件里 new Intl.NumberFormat 再手拼字符串），');
console.log('  多语言上线时就会同时踩到格式错、词序错、漏翻没人知道三个坑。');

console.log('\n本节结束，33_intl 目录补充完毕。');
