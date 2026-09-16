/**
 * ============================================================================
 * 知识点：Intl.DisplayNames —— 语言、地区、货币等名称的本地化
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】入门
 * 【前置知识】33_intl/01_intl_overview.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Intl.DisplayNames 把**代码**翻译成**人话**：
 *      'en'      -> "英语" / "English"
 *      'CN'      -> "中国" / "China"
 *      'CNY'     -> "人民币" / "Chinese Yuan"
 *      'Hans'    -> "简体" / "Simplified"
 *      'gregory' -> "公历" / "Gregorian Calendar"
 *    它支持的 type 有：'language' | 'region' | 'script' | 'currency'
 *                     | 'calendar' | 'dateTimeField'。
 *    调用方式是 dn.of(code)，返回字符串（拿不到时按 fallback 策略返回原代码或 undefined）。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 语言切换下拉框：要显示"中文 / English / 日本語 / Deutsch"，
 *        而不是 "zh-CN / en-US / ja-JP / de-DE"。
 *        而且中文界面下应该写"英语"，英文界面下写 "English" —— 双向本地化。
 *    (2) 结算页展示货币名："¥1,234（人民币）"，换语言变成 "CNY 1,234 (Chinese Yuan)"。
 *    (3) 账号设置里的"国家/地区"，要显示"中国香港特别行政区"而不是 "HK"。
 *    (4) 字体/排版设置："简体 / 繁体 / 拉丁文"。
 *    (5) 日历偏好设置："公历 / 农历 / 伊斯兰历"。
 *    (6) 日期格式的字段说明文案："年 / 月 / 日 / 时区"。
 *    这些名称表如果手写，几百个国家和一百多种货币，维护成本极高且容易过时。
 *
 * 3. 核心语法要点
 *    (1) new Intl.DisplayNames(locales, { type, style, fallback, languageDisplay })。
 *        type 必填，取值见上；写错会抛 RangeError。
 *        style：'long'（默认）| 'short' | 'narrow'（不是所有 type 都支持）。
 *        fallback：'code'（默认，返回原代码）| 'none'（返回 undefined）。
 *        languageDisplay：'dialect'（"英式英语"）| 'standard'（"英语（英国）"）。
 *    (2) dn.of(code) 是唯一的取值方法，返回字符串或 undefined。
 *    (3) dn.resolvedOptions() 查看生效配置。
 *    (4) code 的写法是"BCP 47 子标签 / ISO 代码"：
 *        language 用 'en'、'zh-Hant'；region 用 'CN'、'HK'、'419'；
 *        currency 用 'CNY'、'USD'；script 用 'Hans'；calendar 用 'gregory'。
 *
 * 4. 常见陷阱
 *    (1) **月份名和星期名不属于 DisplayNames**：CLDR 把它们放在日期格式化里。
 *        本运行时（Node 24）传 type: 'month' / 'weekday' / 'dayPeriod' / 'timeZone'
 *        会抛 RangeError。要拿月份名请用 Intl.DateTimeFormat 配 month: 'long'。
 *        （这些 type 是较新的提案，不同运行时支持程度不同，用前务必探测。）
 *    (2) 代码格式不合法（如 '!!!'）抛 RangeError；
 *        格式合法但无数据（如 'xx-YY'）不抛错，按 fallback 返回原代码或 undefined。
 *    (3) fallback 默认是 'code'，会静默返回原代码 —— 界面上就会出现 "xx-YY" 这种
 *        原始标签，很容易漏测。要严格就设 fallback: 'none' 并在代码里处理 undefined。
 *    (4) 双向本地化：在中文界面下把 'en' 显示成 "English" 是**错误**的，
 *        正确结果是 "英语"。DisplayNames 会自动做这件事，前提是 locale 传对。
 *    (5) 'und'（未定义语言）会返回 'root' 之类的特殊值，界面上不该直接展示。
 *    (6) 和所有 Intl 对象一样，别在循环里 new，要缓存实例。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 33_intl/06_intl_display_names.js
 *
 * 【预期输出】
 *   分 8 个小节：language / region / currency / script / calendar / dateTimeField
 *   六种 type 的对照表、style 与 languageDisplay 的差异、fallback 策略、
 *   一个可直接用于语言切换下拉框的工具函数、以及陷阱演示。
 *   全部显式传 locale，输出固定。
 * ============================================================================
 */

const ZH = 'zh-CN';
const EN = 'en-US';

/**
 * 把一组代码批量翻译成指定语言的名称，返回"代码: 名称"的对照字符串。
 * @param {'language'|'region'|'script'|'currency'|'calendar'|'dateTimeField'} type 显示名类型
 * @param {string[]} codes 待翻译的代码
 * @param {string} locale 目标语言
 * @param {object} [options] 其他 options（style / languageDisplay / fallback）
 * @returns {string}
 */
function names(type, codes, locale, options = {}) {
  const dn = new Intl.DisplayNames([locale], { type, ...options });
  return codes.map((c) => `${c}:${dn.of(c)}`).join('  ');
}

// ---------------------------------------------------------------------------
// 1. type: 'language' —— 语言名
// ---------------------------------------------------------------------------

console.log('--- 1. type: "language" 语言名 ---');

const LANGS = ['zh', 'zh-Hans', 'zh-Hant', 'en', 'en-GB', 'ja', 'ko', 'de', 'fr', 'es', 'ar', 'ru', 'pt-BR'];
console.log('以中文展示：');
console.log('  ' + names('language', LANGS, ZH));
console.log('\n以英文展示（同一批代码，名称也换了语言）：');
console.log('  ' + names('language', LANGS, EN));
console.log('\n以日语展示（第三视角，验证"双向本地化"确实在起作用）：');
console.log('  ' + names('language', ['zh', 'en', 'ja', 'de'], 'ja-JP'));

console.log('\n真实场景——语言切换下拉框的两种错误做法：');
console.log('  ❌ 直接显示代码：zh-CN / en-US / ja-JP  （用户看不懂）');
console.log('  ❌ 用英文名写死：Chinese / English / Japanese（中文用户看不懂）');
console.log('  ✅ Intl.DisplayNames 按当前界面语言渲染：' + names('language', ['zh-CN', 'en-US', 'ja-JP'], ZH));

// ---------------------------------------------------------------------------
// 2. type: 'region' —— 地区名
// ---------------------------------------------------------------------------

console.log('\n--- 2. type: "region" 地区名 ---');

const REGIONS = ['CN', 'US', 'JP', 'DE', 'GB', 'FR', 'HK', 'TW', 'MO', 'SG', 'IN', 'BR'];
console.table(
  REGIONS.map((code) => ({
    code,
    'zh-CN 长': new Intl.DisplayNames([ZH], { type: 'region', style: 'long' }).of(code),
    'zh-CN 短': new Intl.DisplayNames([ZH], { type: 'region', style: 'short' }).of(code),
    'en-US 长': new Intl.DisplayNames([EN], { type: 'region', style: 'long' }).of(code),
    'en-US 短': new Intl.DisplayNames([EN], { type: 'region', style: 'short' }).of(code),
  })),
);
console.log('注意 GB 在英文里长名是 "United Kingdom"、短名是 "UK"；');
console.log('HK 在中文里长名是"中国香港特别行政区"、短名是"香港" —— 长名包含政治表述，');
console.log('界面上能放下就尽量用长名，短名更适合图标旁的窄标签。');

console.log('\nregion 不只有国家，还有"地区集合"这种代码：');
console.log('  ' + names('region', ['001', '419', 'EU', 'UN', 'AQ', 'XK'], ZH));
console.log('  001=世界、419=拉丁美洲、EU=欧盟、UN=联合国、AQ=南极洲、XK=科索沃。');
console.log('  这类代码在"选择地区"的下拉框里要单独归类，不要和普通国家混在一起排。');

// ---------------------------------------------------------------------------
// 3. type: 'currency' —— 货币名
// ---------------------------------------------------------------------------

console.log('\n--- 3. type: "currency" 货币名 ---');

const CURRENCIES = ['CNY', 'USD', 'EUR', 'JPY', 'GBP', 'KRW', 'RUB', 'BRL', 'INR', 'AED'];
console.table(
  CURRENCIES.map((code) => ({
    code,
    'zh-CN': new Intl.DisplayNames([ZH], { type: 'currency' }).of(code),
    'en-US': new Intl.DisplayNames([EN], { type: 'currency' }).of(code),
    'de-DE': new Intl.DisplayNames(['de-DE'], { type: 'currency' }).of(code),
  })),
);

console.log('真实场景——把货币名和金额拼在结算页上：');
/**
 * 渲染"金额 + 货币全名"（如 "¥1,234.56（人民币）"）。
 * @param {number} amount 金额
 * @param {string} currency ISO 4217 货币代码
 * @param {string} locale BCP 47 标签
 * @returns {string}
 */
function moneyWithName(amount, currency, locale) {
  const nf = new Intl.NumberFormat(locale, { style: 'currency', currency });
  const dn = new Intl.DisplayNames([locale], { type: 'currency' });
  const name = dn.of(currency);
  return `${nf.format(amount)}（${name}）`;
}
for (const locale of [ZH, EN, 'de-DE']) {
  console.log(`  ${locale.padEnd(6)} -> ${moneyWithName(1234.56, 'CNY', locale)}`);
}
console.log('  提示：中文用全角括号、英文该用半角括号并加空格，正式项目应把括号也放进文案表。');

console.log('\n注意 currency 的三种 style 在中文里输出相同：');
for (const style of ['long', 'short', 'narrow']) {
  const dn = new Intl.DisplayNames([ZH], { type: 'currency', style });
  console.log(`  ${style.padEnd(7)} -> ${dn.of('CNY')} / ${dn.of('USD')}`);
}
console.log('  style 的支持程度因 type 和语言而异，不能假设一定有区别。');

// ---------------------------------------------------------------------------
// 4. type: 'script' 与 'calendar'
// ---------------------------------------------------------------------------

console.log('\n--- 4. type: "script" 文字系统 ---');

console.log('  ' + names('script', ['Hans', 'Hant', 'Latn', 'Cyrl', 'Arab', 'Jpan', 'Kore', 'Deva', 'Thai'], ZH));
console.log('  ' + names('script', ['Hans', 'Hant', 'Latn', 'Cyrl'], EN));
console.log('\n英文的 script 名称更完整（"Simplified" 而不是"简体"）：');
console.log('  ' + names('script', ['Hans', 'Hant', 'Latn'], EN));
console.log("语言标签 'zh-Hans-CN' 中：zh 是语言、Hans 是文字（简体）、CN 是地区（中国大陆）。");

console.log('\n--- 5. type: "calendar" 日历系统 ---');

const CALENDARS = ['gregory', 'chinese', 'islamic', 'japanese', 'buddhist', 'hebrew', 'roc', 'persian'];
console.table(
  CALENDARS.map((code) => ({
    code,
    'zh-CN': new Intl.DisplayNames([ZH], { type: 'calendar' }).of(code),
    'en-US': new Intl.DisplayNames([EN], { type: 'calendar' }).of(code),
  })),
);
console.log('真实场景：账号设置里的"日历偏好"。选了 chinese 之后，');
console.log('Intl.DateTimeFormat 的 options.calendar 会真的把日期渲染成农历，');
console.log('所以这个下拉框的值可以直接透传给日期格式化器。');

// ---------------------------------------------------------------------------
// 5. type: 'dateTimeField' —— 日期字段名
// ---------------------------------------------------------------------------

console.log('\n--- 6. type: "dateTimeField" 日期字段名 ---');

const FIELDS = ['year', 'month', 'day', 'hour', 'minute', 'second', 'weekday', 'dayPeriod', 'timeZoneName'];
console.table(
  FIELDS.map((code) => ({
    field: code,
    'zh-CN long': new Intl.DisplayNames([ZH], { type: 'dateTimeField', style: 'long' }).of(code),
    'zh-CN short': new Intl.DisplayNames([ZH], { type: 'dateTimeField', style: 'short' }).of(code),
    'en-US long': new Intl.DisplayNames([EN], { type: 'dateTimeField', style: 'long' }).of(code),
  })),
);
console.log('中文里 "minute" 的长名是"分钟"，短名是"分" —— 表格列头用短名省空间，');
console.log('表单说明用长名更清楚。');

// ---------------------------------------------------------------------------
// 6. 陷阱：月份名和星期名不在 DisplayNames 里
// ---------------------------------------------------------------------------

console.log('\n--- 7. 陷阱：月份/星期名要走 DateTimeFormat ---');

for (const type of ['month', 'weekday', 'dayPeriod', 'timeZone']) {
  try {
    new Intl.DisplayNames([ZH], { type });
    console.log(`  type: "${type}" -> 本运行时支持`);
  } catch (err) {
    console.log(`  type: "${type}" -> ${err.constructor.name}: ${err.message}`);
  }
}
console.log('这些 type 是较新的提案，Node 24 尚未实现（浏览器 / 更新版本可能已支持），');
console.log('代码里必须用 try/catch 或能力探测，不能假设它一定可用。');

console.log('\n正确姿势：用 Intl.DateTimeFormat 取月份名与星期名。');
/**
 * 取某个月份的本地化名称。
 * 技巧：构造一个该月 15 号的 Date 再格式化，避免时区把它挤到上/下个月。
 * @param {number} monthIndex 0-11
 * @param {string} locale BCP 47 标签
 * @param {'long'|'short'|'narrow'} [style] 名称长度
 * @returns {string}
 */
function monthName(monthIndex, locale, style = 'long') {
  // timeZone 固定为 UTC，配合 Date.UTC 构造，确保不受机器时区影响。
  const fmt = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', month: style });
  return fmt.format(new Date(Date.UTC(2024, monthIndex, 15)));
}

console.log('\n月份名对照（1 月与 12 月）：');
console.table(
  [ZH, EN, 'de-DE', 'ja-JP', 'ar-EG'].map((locale) => ({
    locale,
    '1 月 long': monthName(0, locale, 'long'),
    '1 月 short': monthName(0, locale, 'short'),
    '1 月 narrow': monthName(0, locale, 'narrow'),
    '12 月 long': monthName(11, locale, 'long'),
  })),
);
console.log('注意 ar-EG 的月份名是阿拉伯文，narrow 形式也只有一个字母 —— 排版宽度差异极大。');

/**
 * 取星期几的本地化名称。
 * 2024-01-15 是星期一，用它作为基准，用 UTC 时区避免机器时区影响。
 * @param {number} weekdayIndex 0 = 周一，6 = 周日
 * @param {string} locale BCP 47 标签
 * @param {'long'|'short'|'narrow'} [style] 名称长度
 * @returns {string}
 */
function weekdayName(weekdayIndex, locale, style = 'long') {
  const fmt = new Intl.DateTimeFormat(locale, { timeZone: 'UTC', weekday: style });
  // 2024-01-15 是周一，往后推 weekdayIndex 天即可。
  return fmt.format(new Date(Date.UTC(2024, 0, 15 + weekdayIndex)));
}
console.log('\n星期名对照（周一 / 周日）：');
for (const locale of [ZH, EN, 'de-DE', 'ja-JP']) {
  console.log(`  ${locale.padEnd(6)} 周一: ${weekdayName(0, locale)} | 周日: ${weekdayName(6, locale)} | 短: ${weekdayName(0, locale, 'short')} | 极短: ${weekdayName(0, locale, 'narrow')}`);
}

console.log('\n时区名同理，用 DateTimeFormat 的 timeZoneName 选项：');
const tzFmt = (tz, style, locale) =>
  new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: style, hour: '2-digit', hour12: false }).format(new Date('2024-01-15T12:00:00Z'));
for (const tz of ['Asia/Shanghai', 'America/New_York', 'Europe/Berlin']) {
  console.log(`  ${tz.padEnd(18)} zh: ${tzFmt(tz, 'long', ZH)}  |  en: ${tzFmt(tz, 'short', EN)}`);
}

// ---------------------------------------------------------------------------
// 7. style 与 languageDisplay
// ---------------------------------------------------------------------------

console.log('\n--- 8. style 与 languageDisplay ---');

console.log("languageDisplay: 'dialect'（默认）—— 把地区差异写成形容词：");
console.log('  ' + names('language', ['en-GB', 'en-US', 'zh-Hant', 'zh-Hans', 'pt-BR', 'pt-PT'], ZH, { languageDisplay: 'dialect' }));
console.log("languageDisplay: 'standard' —— 写成 语言（地区） 的形式：");
console.log('  ' + names('language', ['en-GB', 'en-US', 'zh-Hant', 'zh-Hans', 'pt-BR', 'pt-PT'], ZH, { languageDisplay: 'standard' }));

console.log("\nstyle 的差异（以 en-GB 为例）：");
for (const style of ['long', 'short', 'narrow']) {
  console.log(`  中文 ${style.padEnd(7)} -> ${new Intl.DisplayNames([ZH], { type: 'language', style }).of('en-GB')}`);
}

// ---------------------------------------------------------------------------
// 8. fallback 策略与错误处理
// ---------------------------------------------------------------------------

console.log('\n--- 9. fallback 策略 ---');

const codeFb = new Intl.DisplayNames([ZH], { type: 'language', fallback: 'code' });
const noneFb = new Intl.DisplayNames([ZH], { type: 'language', fallback: 'none' });
console.log("fallback: 'code'（默认）:");
console.log('  of("zzz")   =', JSON.stringify(codeFb.of('zzz')), '（原样返回代码）');
console.log('  of("xx-YY") =', JSON.stringify(codeFb.of('xx-YY')), '（语言部分仍返回代码 xx，地区部分被拼成括号形式）');
console.log("fallback: 'none':");
console.log('  of("zzz")   =', String(noneFb.of('zzz')), '（undefined，需要调用方处理）');
console.log('  of("xx-YY") =', String(noneFb.of('xx-YY')));
console.log('\n为什么推荐 fallback: "none"？');
console.log('  默认行为会让 "xx-YY" 这种内部代码直接出现在用户界面上，');
console.log('  而且不会报错、测试也发现不了。设成 none 后，');
console.log('  用 `dn.of(code) ?? code` 或 `?? "未知语言"` 显式决定兜底文案。');

console.log('\n非法代码会抛错，必须 try/catch：');
for (const bad of ['!!!', 'not a code']) {
  try {
    new Intl.DisplayNames([ZH], { type: 'language' }).of(bad);
    console.log(`  of(${JSON.stringify(bad)}) -> 未抛错`);
  } catch (err) {
    console.log(`  of(${JSON.stringify(bad)}) -> ${err.constructor.name}: ${err.message}`);
  }
}
console.log('特殊值 "und"（未定义语言）会返回一个内部名称，同样不该直接展示：');
console.log('  of("und") =', JSON.stringify(codeFb.of('und')));

console.log('\n不支持的 type 会在构造时抛错：');
try {
  new Intl.DisplayNames([ZH], { type: 'color' });
} catch (err) {
  console.log('  type: "color" ->', err.constructor.name + ':', err.message);
}

// ---------------------------------------------------------------------------
// 9. 综合实战：语言切换下拉框 + 实例缓存
// ---------------------------------------------------------------------------

console.log('\n--- 10. 实战：语言切换下拉框 ---');

// 产品支持的语言清单（通常来自配置或后端接口）。
const SUPPORTED = ['zh-CN', 'zh-TW', 'en-US', 'en-GB', 'ja-JP', 'ko-KR', 'de-DE', 'fr-FR', 'es-ES', 'ar-EG'];

/**
 * 生成语言切换下拉框的数据（value + 展示文案）。
 * 展示规则：用"当前界面语言"来渲染"每个选项的语言名"，实现双向本地化。
 * @param {string[]} supported 支持的 locale 列表
 * @param {string} uiLocale 当前界面语言
 * @returns {Array<{ value: string, label: string }>}
 */
function buildLanguageOptions(supported, uiLocale) {
  // 只构造一次 DisplayNames，循环里复用（对比：每次 new 会慢一个数量级）。
  const dn = new Intl.DisplayNames([uiLocale], { type: 'language', fallback: 'none' });
  return supported.map((value) => ({
    value,
    // fallback: 'none' 时可能拿到 undefined，这里显式兜底，绝不让原始代码漏到界面上。
    label: dn.of(value) ?? value,
  }));
}

for (const uiLocale of [ZH, EN, 'ja-JP']) {
  console.log(`\n  界面语言 = ${uiLocale}`);
  const options = buildLanguageOptions(SUPPORTED, uiLocale);
  for (const opt of options.slice(0, 6)) {
    console.log(`    ${opt.value.padEnd(7)} -> ${opt.label}`);
  }
  console.log('    ...');
}
console.log('\n注意同一个选项 "de-DE"：');
for (const uiLocale of [ZH, EN, 'ja-JP']) {
  const dn = new Intl.DisplayNames([uiLocale], { type: 'language' });
  console.log(`  界面是 ${uiLocale.padEnd(6)} 时显示为 "${dn.of('de-DE')}"`);
}
console.log('这就是"双向本地化"：选项的代码不变，展示名称跟着界面语言走。');

console.log('\n性能提示（与 01 节同理）：DisplayNames 实例要缓存。');
const ITER = 5000;
const bench = (fn) => {
  fn();
  const t = process.hrtime.bigint();
  for (let i = 0; i < ITER; i++) fn();
  return Number(process.hrtime.bigint() - t) / 1e6;
};
const costNew = bench(() => SUPPORTED.map((c) => new Intl.DisplayNames([ZH], { type: 'language' }).of(c)));
const cachedDn = new Intl.DisplayNames([ZH], { type: 'language' });
const costCached = bench(() => SUPPORTED.map(cachedDn.of, cachedDn));
console.log(`  [环境相关] 每次 new  -> ${costNew.toFixed(1)} ms`);
console.log(`  [环境相关] 复用实例  -> ${costCached.toFixed(1)} ms`);
console.log(`  本机约快 ${Math.round(costNew / Math.max(costCached, 0.001))} 倍（绝对数值随机器变化）。`);

console.log('\n本节结束。');
