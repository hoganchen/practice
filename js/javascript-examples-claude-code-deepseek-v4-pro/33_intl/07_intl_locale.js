/**
 * ============================================================================
 * 知识点：Intl.Locale —— 解析、推导与协商 BCP 47 语言标签
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】进阶
 * 【前置知识】33_intl/01_intl_overview.js、33_intl/06_intl_display_names.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Intl.Locale 把"语言标签"从字符串变成一个**有结构的对象**。
 *    语言标签遵循 BCP 47 标准，形如：
 *        zh-Hans-CN-u-ca-chinese-nu-hanidec
 *        └┬┘ └─┬─┘└┬┘ └──────────┬──────────┘
 *        语言  文字  地区      扩展子标签（-u- 之后是 Unicode 扩展）
 *    它提供两类能力：
 *      (a) **解析**：把标签拆成 language / script / region / 各个扩展选项；
 *      (b) **推导**：maximize() / minimize() 按 CLDR 的"可能子标签"表补全或省略。
 *    另外还能查询"这个 locale 常用的日历、数字系统、时区、书写方向、一周第一天"。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 用户设置里存的是 'zh-Hans-CN' 这样的标签，代码里要判断
 *        "这是简体还是繁体""要不要走 RTL 布局""一周从周日还是周一开始"，
 *        靠字符串 startsWith 判断既脆弱又容易漏。
 *    (2) 语言协商：浏览器发来 Accept-Language: zh-Hant-HK,zh;q=0.9,en;q=0.8，
 *        你要在支持的语言列表里挑一个最合适的。Intl.Locale 让"匹配"变得可计算。
 *    (3) 日历系统：泰语用户默认用佛历（buddhist），选了之后日期年份要 +543。
 *        这个默认值要从 locale 里读，而不是写死。
 *    (4) 阿拉伯语界面要整站镜像（RTL），方向信息来自 locale 的 textInfo。
 *    (5) 排班表/日历控件需要知道"一周从周几开始"（getWeekInfo）。
 *
 * 3. 核心语法要点
 *    (1) new Intl.Locale(tag, options)：
 *          tag      BCP 47 字符串，如 'zh-Hans-CN'
 *          options  覆盖或补充各个子标签，如 { region: 'GB', hourCycle: 'h23' }
 *        无效标签抛 RangeError；标签是**大小写不敏感**的，内部会规范化。
 *    (2) 只读属性：
 *          language / script / region / baseName（不含扩展的"语言-文字-地区"部分）
 *          calendar / collation / hourCycle / caseFirst / numeric / numberingSystem
 *          （这些来自 -u- 扩展子标签，没写就是 undefined）
 *    (3) maximize()：补全成"最可能"的完整标签（en -> en-Latn-US，zh-TW -> zh-Hant-TW）。
 *        minimize() ：反向省略掉"可由语言推导出的"部分（zh-Hans-CN -> zh，en-Latn-US -> en）。
 *    (4) 信息查询方法（注意 getXxx 形式是新 API，属性形式已废弃）：
 *          getCalendars() / getCollations() / getHourCycles()
 *          getNumberingSystems() / getTimeZones() / getTextInfo() / getWeekInfo()
 *    (5) Intl.getCanonicalLocales(list)：批量规范化，并把废弃别名映射到新代码
 *        （iw -> he，in -> id，mo -> ro）。
 *    (6) 所有 Intl 构造器的 locales 参数都接受 Intl.Locale 实例。
 *
 * 4. 常见陷阱
 *    (1) 语言标签是**大小写不敏感**的：'ZH-hans-cn' 与 'zh-Hans-CN' 等价，
 *        但为了让日志和缓存 key 稳定，务必先经 Intl.getCanonicalLocales 规范化。
 *    (2) maximize() 是"猜测"而不是"事实"：en 补成 en-Latn-US，
 *        但英式用户可能是 en-GB。不要拿 maximize 的结果当用户的真实地区。
 *    (3) minimize() 是**不可逆**的：zh-Hans-CN 与 zh-Hans-SG 都 minimize 成 zh，
 *        原始信息会丢失，别把 minimize 的结果存进数据库。
 *    (4) 属性形式（locale.weekInfo / locale.textInfo / locale.calendars）已被标记废弃，
 *        新代码统一用 getWeekInfo() / getTextInfo() / getCalendars()。
 *        旧运行时可能只有属性形式，要写兼容取值。
 *    (5) script 与 region 的写法有严格规范：script 是 4 个字母且首字母大写（Hans、Latn），
 *        region 是 2 个大写字母（CN）或 3 位数字（419）。
 *    (6) 不要用 language 属性去代替完整标签做判断：
 *        zh-Hans 和 zh-Hant 的 language 都是 zh，但字体、日期、用词完全不同。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 33_intl/07_intl_locale.js
 *
 * 【预期输出】
 *   分 9 个小节：标签结构解析、扩展子标签、maximize/minimize、
 *   构造器 options、locale 元信息查询、规范化、语言协商、综合实战、陷阱。
 *   全部显式传 locale，输出固定。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 解析语言标签
// ---------------------------------------------------------------------------

console.log('--- 1. 解析 BCP 47 语言标签 ---');

const SAMPLE_TAGS = ['zh-Hans-CN', 'zh-Hant-TW', 'en-US', 'en', 'de-DE', 'sr-Cyrl-RS', 'ar-EG', 'zh-Hans-CN-u-ca-chinese-nu-hanidec'];

console.table(
  SAMPLE_TAGS.map((tag) => {
    const loc = new Intl.Locale(tag);
    return {
      '输入标签': tag,
      language: loc.language,
      script: loc.script ?? '(未指定)',
      region: loc.region ?? '(未指定)',
      baseName: loc.baseName,
      calendar: loc.calendar ?? '-',
      numberingSystem: loc.numberingSystem ?? '-',
    };
  }),
);

console.log('\n关键点：');
console.log('  1. language 是必须的，script / region 可选 —— 缺失就是 undefined，不是空串。');
console.log('  2. 标签大小写不敏感，但 Intl 会规范化成"标准写法"：');
for (const raw of ['ZH-hans-cn', 'EN-us', 'zh-HANT-tw']) {
  const loc = new Intl.Locale(raw);
  console.log(`     ${raw.padEnd(12)} -> ${loc.toString()}（language=${loc.language} script=${loc.script} region=${loc.region}）`);
}
console.log('     规范：language 小写、script 首字母大写、region 大写。');
console.log('  3. baseName 是不含扩展子标签的部分，适合当缓存 key。');

// ---------------------------------------------------------------------------
// 2. 扩展子标签（-u- 之后）
// ---------------------------------------------------------------------------

console.log('\n--- 2. 扩展子标签：把选项写进标签里 ---');

const EXTENDED = [
  ['zh-CN-u-ca-chinese', 'calendar', '用农历'],
  ['th-TH-u-ca-buddhist', 'calendar', '用佛历'],
  ['ar-EG-u-nu-latn', 'numberingSystem', '数字用拉丁数字而不是阿拉伯数字'],
  ['zh-CN-u-nu-hanidec', 'numberingSystem', '用汉字数字（一二三）'],
  ['de-DE-u-co-phonebk', 'collation', '用德语电话簿排序'],
  ['en-US-u-hc-h23', 'hourCycle', '24 小时制（0-23）'],
  ['en-US-u-kf-upper', 'caseFirst', '排序时大写在前'],
  ['en-US-u-kn-true', 'numeric', '自然排序（数字按数值比）'],
];

console.table(
  EXTENDED.map(([tag, prop, note]) => {
    const loc = new Intl.Locale(tag);
    return {
      标签: tag,
      属性: prop,
      值: String(loc[prop]),
      说明: note,
    };
  }),
);

console.log('\n两种写法完全等价（标签内 -u- vs options 对象）：');
const byTag = new Intl.Locale('de-DE-u-co-phonebk');
const byOption = new Intl.Locale('de-DE', { collation: 'phonebk' });
console.log('  标签写法 ->', byTag.toString(), '| collation =', byTag.collation);
console.log('  options  ->', byOption.toString(), '| collation =', byOption.collation);
console.log('  规范化后两者完全一致 —— 因为 -u- 扩展本质就是"打包进标签的 options"。');

console.log('\n扩展子标签可以直接喂给其他 Intl 构造器，效果与分开传 options 相同：');
console.log('  Collator("de-DE-u-co-phonebk") 的实际 locale =', new Intl.Collator('de-DE-u-co-phonebk').resolvedOptions().locale);
console.log('  Collator("de-DE", {collation:"phonebk"}) 的实际 locale =', new Intl.Collator('de-DE', { collation: 'phonebk' }).resolvedOptions().locale);
console.log('  NumberFormat("zh-CN-u-nu-hanidec").format(123) =', new Intl.NumberFormat('zh-CN-u-nu-hanidec').format(123));
console.log('  （反例：zh-CN 传 collation:"stroke" 时 resolvedOptions().locale 仍是 zh-CN，');
console.log('   因为该选项对 zh 而言"恰好等于默认值"以外的写法不会被回写进标签 —— ');
console.log('   判断实际生效的选项请看 resolvedOptions() 的各个字段，而不是只看 locale 字符串。）');

// ---------------------------------------------------------------------------
// 3. maximize / minimize
// ---------------------------------------------------------------------------

console.log('\n--- 3. maximize() 与 minimize() ---');

const MAX_MIN = ['en', 'en-Latn-US', 'zh-CN', 'zh-TW', 'zh-Hant-CN', 'ja', 'ko', 'ar', 'sr', 'sr-Latn', 'sr-Cyrl-RS', 'zh-Hant-HK'];
console.table(
  MAX_MIN.map((tag) => {
    const loc = new Intl.Locale(tag);
    return {
      输入: tag,
      maximize: loc.maximize().toString(),
      minimize: loc.minimize().toString(),
    };
  }),
);

console.log('\n怎么理解这两步：');
console.log('  maximize（最大化）：把"省略掉的、可以推断的"部分补全成 CLDR 认为最可能的组合。');
console.log('      en     -> en-Latn-US（英语最可能用拉丁字母、在美国）');
console.log('      zh-TW  -> zh-Hant-TW（台湾用繁体）');
console.log('      sr     -> sr-Cyrl-RS（塞尔维亚语默认西里尔字母）');
console.log('      sr-Latn-> sr-Latn-RS（显式写了拉丁就保留拉丁）');
console.log('  minimize（最小化）：把"能被推断出来"的部分删掉。');
console.log('      zh-Hans-CN -> zh（简体+中国大陆是中文的默认推断）');
console.log('      en-Latn-US -> en');
console.log('      zh-Hant-HK -> zh-HK（保留了 HK，因为繁体在香港是默认，但地区不能丢）');

console.log('\n两个必须记住的注意事项：');
console.log('  1. maximize 是"最可能的猜测"，不是事实：');
console.log('     en -> ' + new Intl.Locale('en').maximize().toString() + '，但英式用户的真实标签是 en-GB。');
console.log('     绝不能用 maximize 的结果去推断用户所在国家。');
console.log('  2. minimize 会丢信息且不可逆：');
const a = new Intl.Locale('zh-Hans-CN').minimize().toString();
const b = new Intl.Locale('zh-Hans-SG').minimize().toString();
console.log(`     zh-Hans-CN -> ${a}；zh-Hans-SG -> ${b}；两者撞成同一个值，原信息丢了。`);
console.log('     所以数据库、缓存 key 里永远存完整标签，minimize 只用于"展示"场景。');

// ---------------------------------------------------------------------------
// 4. 构造器 options：不动原标签地"改写"
// ---------------------------------------------------------------------------

console.log('\n--- 4. 用构造器 options 改写标签 ---');

const base = new Intl.Locale('en-US');
console.log('基础标签：' + base.toString());
const overrides = [
  [{ region: 'GB' }, '换地区'],
  [{ script: 'Latn' }, '显式指定文字'],
  [{ hourCycle: 'h23' }, '指定 24 小时制'],
  [{ calendar: 'gregory' }, '指定日历'],
  [{ caseFirst: 'upper' }, '排序时大写优先'],
];
for (const [opts, note] of overrides) {
  const loc = new Intl.Locale('en-US', opts);
  console.log(`  new Intl.Locale('en-US', ${JSON.stringify(opts).padEnd(28)}) -> ${loc.toString().padEnd(24)} （${note}）`);
}
console.log('\n注意：options 与标签同时写时，**options 优先**；两者会合并成一个规范化标签。');
console.log('  ' + new Intl.Locale('zh-Hans-CN-u-ca-chinese', { region: 'HK' }).toString());
console.log('  原标签的日历扩展被保留，地区被改写成 HK。');

// ---------------------------------------------------------------------------
// 5. locale 元信息查询
// ---------------------------------------------------------------------------

console.log('\n--- 5. 查询 locale 的元信息 ---');

const META_TAGS = ['zh-CN', 'zh-TW', 'en-US', 'de-DE', 'ar-EG', 'th-TH', 'ja-JP'];
console.table(
  META_TAGS.map((tag) => {
    const loc = new Intl.Locale(tag);
    const text = loc.getTextInfo();
    const week = loc.getWeekInfo();
    return {
      locale: tag,
      书写方向: text.direction,
      一周首日: week.firstDay,
      周末: week.weekend.join(','),
      常用日历: loc.getCalendars().join('/'),
      数字系统: loc.getNumberingSystems().join('/'),
      小时制: loc.getHourCycles().join('/'),
    };
  }),
);
console.log('图例：firstDay 1=周一、6=周六、7=周日（ISO 8601 的星期编号）。');

console.log('\n这三个查询各自解决什么问题：');
console.log('  1. getTextInfo().direction -> "ltr" / "rtl"。');
console.log('     阿拉伯语（ar-EG）是 rtl，界面要整站镜像：');
for (const tag of ['zh-CN', 'en-US', 'ar-EG']) {
  const dir = new Intl.Locale(tag).getTextInfo().direction;
  console.log(`       ${tag.padEnd(7)} -> ${dir}${dir === 'rtl' ? '（需要 dir="rtl" + 镜像布局）' : ''}`);
}
console.log('  2. getWeekInfo() -> 日历控件/排班表的"一周从哪天开始"。');
console.log('     中国和德国从周一开始，美国从周日开始，埃及从周六开始 —— 写死任何一种都是 bug。');

console.log('  3. getCalendars() -> 默认日历系统，决定日期渲染的默认值。');
console.log('     泰国用户默认佛历（buddhist），今年是 2567 年而不是 2024 年：');
const buddhist = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
  timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric',
}).format(new Date('2024-03-15T00:00:00Z'));
const gregorian = new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
  timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric',
}).format(new Date('2024-03-15T00:00:00Z'));
console.log(`       佛历 -> ${buddhist}`);
console.log(`       公历 -> ${gregorian}`);
console.log('     同一个日期，年份差了 543 —— 这就是"默认日历"的威力。');

console.log('\n  4. getTimeZones() -> 该语言/地区常用的时区列表（做下拉框时很有用）：');
console.log('     en-US 前 5 个 ->', new Intl.Locale('en-US').getTimeZones().slice(0, 5).join(', '));
console.log('     注意：只有 region 明确时才有值，' + "new Intl.Locale('en').getTimeZones() = " + String(new Intl.Locale('en').getTimeZones()));
console.log('\n  5. getCollations() -> 该语言可用的排序变体：');
console.log('     de-DE ->', new Intl.Locale('de-DE').getCollations().join(', '));
console.log('     zh-CN ->', new Intl.Locale('zh-CN').getCollations().join(', '));

// ---------------------------------------------------------------------------
// 6. 规范化：Intl.getCanonicalLocales
// ---------------------------------------------------------------------------

console.log('\n--- 6. Intl.getCanonicalLocales 规范化 ---');

console.log("Intl.getCanonicalLocales(['ZH-cn', 'EN-us', 'zh-hans-cn']) =");
console.log('  ', JSON.stringify(Intl.getCanonicalLocales(['ZH-cn', 'EN-us', 'zh-hans-cn'])));
console.log('\n它还会把废弃别名映射到现行代码：');
console.log("  ['iw', 'in', 'mo']（希伯来语/印尼语/摩尔多瓦语的旧代码）");
console.log('  ->', JSON.stringify(Intl.getCanonicalLocales(['iw', 'in', 'mo'])));
console.log('  这类旧代码在历史数据里很常见，入库前先规范化能省掉大量兼容代码。');

console.log('\n非法标签会抛 RangeError，需要 try/catch：');
for (const bad of ['!!!', 'not a locale', 'zh-CN-']) {
  try {
    Intl.getCanonicalLocales(bad);
    console.log(`  ${JSON.stringify(bad).padEnd(16)} -> 未抛错`);
  } catch (err) {
    console.log(`  ${JSON.stringify(bad).padEnd(16)} -> ${err.constructor.name}: ${err.message}`);
  }
}
console.log('\n但"结构合法、语言不存在"的标签不会报错：');
console.log("  Intl.getCanonicalLocales(['xx-YY']) ->", JSON.stringify(Intl.getCanonicalLocales(['xx-YY'])));
console.log('  存在性检查要用 supportedLocalesOf（见下一节）。');

// ---------------------------------------------------------------------------
// 7. 语言协商
// ---------------------------------------------------------------------------

console.log('\n--- 7. 语言协商：从用户偏好里挑一个我们支持的 ---');

// 模拟浏览器发来的 Accept-Language 解析结果（按优先级排序）。
const USER_PREFS = ['zh-Hant-HK', 'zh', 'en-GB', 'en'];
// 我们产品实际支持的语言。
const SUPPORTED = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'];

console.log('用户偏好：' + USER_PREFS.join(', '));
console.log('产品支持：' + SUPPORTED.join(', '));

console.log('\n第一步：先用 supportedLocalesOf 过滤掉"完全没有数据"的：');
console.log('  Intl.DateTimeFormat.supportedLocalesOf(' + JSON.stringify(USER_PREFS) + ')');
console.log('  ->', Intl.DateTimeFormat.supportedLocalesOf(USER_PREFS));
console.log('  注意：supportedLocalesOf 只看"运行时有没有数据"，不管你的产品支不支持。');

/**
 * 在"产品支持列表"里为用户偏好挑一个最合适的（三级匹配）。
 * 这正是 Intl.Locale.maximize() 最有价值的用法：把简写标签补全成完整标签后再比对，
 * 从而分辨出"简体中文"和"繁体中文"这种语言相同、文字不同的情况。
 *
 * 匹配优先级：
 *   1. 完全一致（大小写不敏感）
 *   2. language + script 都一致（靠 maximize() 补全后比较）
 *   3. 只要 language 一致
 *   4. 都不匹配 -> 返回调用方指定的兜底标签
 *
 * @param {string[]} prefs 用户偏好（按优先级降序）
 * @param {string[]} supported 产品支持列表
 * @param {string} fallback 兜底标签（产品默认语言）
 * @returns {string} 最终选中的受支持标签
 */
function negotiate(prefs, supported, fallback) {
  // 第一级：完全一致
  for (const pref of prefs) {
    const exact = supported.find((s) => s.toLowerCase() === pref.toLowerCase());
    if (exact) return exact;
  }
  // 第二级：语言 + 文字都一致（zh-Hant 要对上 zh-TW 而不是 zh-CN）
  for (const pref of prefs) {
    const want = new Intl.Locale(pref).maximize();
    const hit = supported.find((s) => {
      const have = new Intl.Locale(s).maximize();
      return have.language === want.language && have.script === want.script;
    });
    if (hit) return hit;
  }
  // 第三级：只要求语言一致
  for (const pref of prefs) {
    const lang = new Intl.Locale(pref).language;
    const hit = supported.find((s) => new Intl.Locale(s).language === lang);
    if (hit) return hit;
  }
  // 第四级：兜底（**必须显式指定**，绝不能依赖运行环境的默认 locale）
  return fallback;
}

console.log('\n第二步：三级匹配（用 maximize 补全后再比对）：');
const DEFAULT_LOCALE = 'zh-CN';
const chosen = negotiate(USER_PREFS, SUPPORTED, DEFAULT_LOCALE);
console.log('  negotiate(...) -> ' + chosen);
console.log('  用户首选 zh-Hant-HK 不在支持列表里；把它 maximize 成 ' +
  new Intl.Locale('zh-Hant-HK').maximize().toString() + '（已是完整标签，保持不变），');
console.log('  再和候选列表 maximize 后的结果比对：' +
  SUPPORTED.map((s) => `${s}=${new Intl.Locale(s).maximize().toString()}`).join('、'));
console.log('  只有 zh-TW 的 script 同为 Hant，所以选中 ' + chosen + '。');
console.log('  如果只按 language 匹配，就会错选成 zh-CN，繁体用户会看到简体界面。');

console.log('\n第三步：校验并兜底。用 Intl.Locale 把选中结果拆开做业务判断：');
const chosenLocale = new Intl.Locale(chosen);
console.log('  language =', chosenLocale.language, '| script =', chosenLocale.script, '| region =', chosenLocale.region);
console.log('  书写方向 =', chosenLocale.getTextInfo().direction);
console.log('  一周首日 =', chosenLocale.getWeekInfo().firstDay);
console.log('\n再对比几个候选，看三级匹配的效果：');
for (const prefs of [['zh-Hant-TW'], ['zh-Hans-CN'], ['en-GB'], ['fr-FR'], ['xx-YY'], ['ja'], ['ko-KR', 'en']]) {
  const result = negotiate(prefs, SUPPORTED, DEFAULT_LOCALE);
  const note = result === DEFAULT_LOCALE && !prefs.some((p) => new Intl.Locale(p).language === 'zh') ? '（无匹配，走兜底）' : '';
  console.log(`  ${JSON.stringify(prefs).padEnd(22)} -> ${result} ${note}`);
}
console.log('\n四个值得注意的结果：');
console.log('  zh-Hant-HK -> zh-TW ：文字（Hant）对上了，虽然地区不同。');
console.log('  en-GB      -> en-US ：语言一致，地区不同就用最接近的 en-US。');
console.log('  ko-KR,en   -> en-US ：第一个偏好（韩语）完全不支持，于是看下一个偏好。');
console.log('  xx-YY      -> zh-CN ：没有任何匹配，落到显式兜底值。');
console.log('\n千万不要把"兜底"交给运行环境：');
const naiveFallback = new Intl.DateTimeFormat(['xx-YY']).resolvedOptions().locale;
console.log('  new Intl.DateTimeFormat(["xx-YY"]).resolvedOptions().locale = [环境相关]', naiveFallback);
console.log('  这会返回**运行环境的默认 locale**，在 CI 或海外服务器上可能是 en-US / de-DE，');
console.log('  同一个用户在不同机器上看到不同语言 —— 必须像上面那样写死产品默认值。');

// ---------------------------------------------------------------------------
// 8. 综合实战：把用户设置序列化 / 反序列化
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战：用户语言设置的存取 ---');

/**
 * 把用户的语言设置规范化成"可以存进数据库/URL 的标准标签"。
 * @param {string} input 用户输入或系统给的标签
 * @returns {{ ok: true, tag: string } | { ok: false, reason: string }}
 */
function normalizeUserLocale(input) {
  try {
    const [tag] = Intl.getCanonicalLocales(input);
    // 再用 Intl.Locale 校验一次结构，并确认运行时确实有数据。
    const loc = new Intl.Locale(tag);
    const supported = Intl.DateTimeFormat.supportedLocalesOf([loc.toString()]);
    if (supported.length === 0) {
      return { ok: false, reason: `运行时没有 ${loc.toString()} 的语言数据` };
    }
    return { ok: true, tag: loc.toString() };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

for (const input of ['ZH-hans-cn', 'en-us', 'ar-eg', 'xx-YY', '!!!']) {
  const result = normalizeUserLocale(input);
  console.log(`  ${JSON.stringify(input).padEnd(16)} -> ${result.ok ? '✅ ' + result.tag : '❌ ' + result.reason}`);
}

console.log('\n存进去之后，用的时候再还原成 Locale 对象，按需读取元信息：');
/**
 * 根据存储的 locale 标签算出界面初始化需要的一堆开关。
 * @param {string} tag 存储的标签
 * @returns {object}
 */
function uiConfigFromLocale(tag) {
  const loc = new Intl.Locale(tag);
  const text = loc.getTextInfo();
  const week = loc.getWeekInfo();
  return {
    tag: loc.toString(),
    语言: loc.language,
    文字: loc.script ?? '(未指定)',
    地区: loc.region ?? '(未指定)',
    方向: text.direction,
    需要镜像布局: text.direction === 'rtl',
    一周首日: week.firstDay,
    日期格式化用的日历: loc.getCalendars()[0],
    数字系统: loc.getNumberingSystems()[0],
  };
}
for (const tag of ['zh-CN', 'zh-Hant-TW', 'ar-EG', 'en-US']) {
  console.log(`  ${tag.padEnd(10)} -> ` + JSON.stringify(uiConfigFromLocale(tag)));
}

// ---------------------------------------------------------------------------
// 9. 陷阱汇总
// ---------------------------------------------------------------------------

console.log('\n--- 9. 陷阱 ---');

console.log('陷阱一：属性形式已废弃，优先用 getXxx() 方法');
const zhLocale = new Intl.Locale('zh-CN');
console.log('  locale.weekInfo 存在吗？ ', typeof zhLocale.weekInfo, '（旧 API，已废弃）');
console.log('  locale.getWeekInfo() ->', JSON.stringify(zhLocale.getWeekInfo()));
console.log('  locale.textInfo ->', JSON.stringify(zhLocale.textInfo), '| getTextInfo() ->', JSON.stringify(zhLocale.getTextInfo()));
console.log('  写兼容代码：const week = loc.getWeekInfo ? loc.getWeekInfo() : loc.weekInfo;');

console.log('\n陷阱二：不要用 language 属性代替完整标签');
const hans = new Intl.Locale('zh-Hans');
const hant = new Intl.Locale('zh-Hant');
console.log(`  zh-Hans.language = ${hans.language}，zh-Hant.language = ${hant.language} —— 一样！`);
console.log('  但 script 不同，实际渲染结果就不同：');
const monthHans = new Intl.DateTimeFormat('zh-Hans', { timeZone: 'UTC', month: 'long' }).format(new Date('2024-03-15T00:00:00Z'));
const monthHant = new Intl.DateTimeFormat('zh-Hant', { timeZone: 'UTC', month: 'long' }).format(new Date('2024-03-15T00:00:00Z'));
console.log(`    月份 zh-Hans -> ${monthHans}    （CLDR 给简体中文配的月名写作"三月"）`);
console.log(`    月份 zh-Hant -> ${monthHant}    （繁体中文配的是"3月"，写法不同）`);
const fullHans = new Intl.DateTimeFormat('zh-Hans', { timeZone: 'UTC', dateStyle: 'full' }).format(new Date('2024-03-15T00:00:00Z'));
const fullHant = new Intl.DateTimeFormat('zh-Hant', { timeZone: 'UTC', dateStyle: 'full' }).format(new Date('2024-03-15T00:00:00Z'));
console.log(`    dateStyle:full zh-Hans -> ${JSON.stringify(fullHans)}`);
console.log(`    dateStyle:full zh-Hant -> ${JSON.stringify(fullHant)}   （日期与星期之间多一个空格）`);
console.log('  语言相同、文字不同，差异可以非常大 —— 塞尔维亚语是最极端的例子：');
console.log('    sr-Cyrl 说', JSON.stringify(new Intl.DisplayNames(['sr-Cyrl'], { type: 'region' }).of('RS')),
  '，sr-Latn 说', JSON.stringify(new Intl.DisplayNames(['sr-Latn'], { type: 'region' }).of('RS')));
console.log('  判断必须基于完整标签（或至少 language + script）。');

console.log('\n陷阱三：非法标签抛 RangeError，未知但合法的标签静默通过');
try {
  new Intl.Locale('!!!');
} catch (err) {
  console.log("  new Intl.Locale('!!!') ->", err.constructor.name + ':', err.message);
}
console.log("  new Intl.Locale('xx-YY').toString() ->", new Intl.Locale('xx-YY').toString(), '（合法但不存在的语言，不报错）');
console.log('  所以"能构造出 Locale 对象"不等于"这个语言有数据"，两件事要分开校验。');

console.log('\n陷阱四：options 会与标签合并，而不是替换整个标签');
console.log("  new Intl.Locale('ja-JP', { region: 'US' }).toString() =", new Intl.Locale('ja-JP', { region: 'US' }).toString());
console.log('  -> 得到"日语 + 美国"，语义是"在美国使用的日语"。');
console.log('     如果你本意是"改成英语（美国）"，正确写法是 new Intl.Locale("en-US")。');

console.log('\n本节结束。');
