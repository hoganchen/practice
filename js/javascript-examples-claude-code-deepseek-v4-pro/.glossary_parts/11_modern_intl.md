## 国际化与本地化（Intl）

### Internationalization（国际化，i18n）

国际化是**让代码具备适配多种语言与文化的能力**的工程活动：把界面文案从代码里抽出来，把所有随文化而变的格式（数字、日期、货币、姓名顺序、复数词形、排序规则）交给运行时规则决定，而不是硬编码。名称 i18n 取自「internationalization」首尾字母之间恰好 18 个字母。关键细节：国际化是**开发期做一次、长期受益**的架构工作，它不等于翻译，翻译只是其中一环；本仓库所有 `Intl` 示例都是「用内置能力替代手写规则」的示范。判定标准很简单——代码里只要出现 `toFixed(2)`、`'YYYY-MM-DD'`、裸 `arr.sort()` 或手写的 `'元'`，它就还没国际化。

也见 [Localization（本地化，l10n）](#localization本地化l10n)、[Locale（区域设置）](#locale区域设置)。

示例：[`33_intl/01_intl_overview.js`](33_intl/01_intl_overview.js)、[`33_intl/08_intl_best_practices.js`](33_intl/08_intl_best_practices.js)

### Localization（本地化，l10n）

本地化是国际化的**落地执行**：为某个具体 locale 提供译文、日期格式偏好、货币符号、图片与文案语气，产出一份「该地区能直接用」的版本。l10n 取自「localization」首尾之间的 10 个字母。关键区分：i18n 是**改代码结构**（一次性架构投入），l10n 是**加资源内容**（每个 locale 一份，持续维护）；把两者混为一谈会导致「以为多写几份翻译文件就国际化了」，而实际上日期还是 `toLocaleString()` 依赖默认 locale 输出的。**常见误解**：以为 l10n 只是翻译——同一个词在德语里可能比英语长 30%，界面布局被撑破同样属于本地化失败。

也见 [Internationalization（国际化，i18n）](#internationalization国际化i18n)、[Locale（区域设置）](#locale区域设置)。

示例：[`33_intl/08_intl_best_practices.js`](33_intl/08_intl_best_practices.js)

### Locale（区域设置）

Locale 是「语言 + 文化约定」的标识，比如 `zh-CN`、`de-DE`、`ar-EG`，它决定数字怎么分组、日期怎么排、复数用哪种词形、字符串怎么排序。它**不是地理位置**，也不是「语言」本身——`de-DE`（德国德语）和 `de-CH`（瑞士德语）语言相同，但数字千分位和日期习惯不同。关键细节：`Intl` 的所有构造器签名统一为 `new Intl.Xxx(locales, options)`，`locales` 可以是字符串或数组（数组表示按顺序回退），省略时使用**宿主环境默认 locale**——这在开发机、CI、客户服务器上各不相同，是「本地跑得好好的，上线就变英文」的根因。

也见 [BCP 47 Language Tag（BCP 47 语言标签）](#bcp-47-language-tagbcp-47-语言标签)、[Locale Fallback Chain（locale 回退链）](#locale-fallback-chainlocale-回退链)、[Intl Instance Caching（Intl 实例缓存）](#intl-instance-cachingintl-实例缓存)。

示例：[`33_intl/01_intl_overview.js`](33_intl/01_intl_overview.js)、[`33_intl/07_intl_locale.js`](33_intl/07_intl_locale.js)

### BCP 47 Language Tag（BCP 47 语言标签）

BCP 47 是 IETF 定义的语言标签标准（BCP = Best Current Practice），也是 `Intl` 接受的所有 locale 字符串的语法来源：`zh-Hans-CN-u-nu-hanidec-co-pinyin`。结构上由**子标签**用连字符拼成：语言、书写系统、地区、变体、扩展。其中 `-u-` 是 Unicode 扩展，把 locale 相关的选项直接写进标签（`-nu-hanidec` 指定使用汉字数字，`-co-pinyin` 指定拼音排序），效果等同于在 `options` 里传 `{ numberingSystem: 'hanidec' }`。关键细节：标签**大小写不敏感**但规范写法是语言小写、书写系统首字母大写、地区全大写。

也见 [Intl.Locale（Locale 对象）](#intllocalelocale-对象)。

示例：[`33_intl/07_intl_locale.js`](33_intl/07_intl_locale.js)

### Language, Script and Region Subtags（语言、书写系统与地区子标签）

一个标签的三段核心信息：**语言**（`zh`、`en`、`sr`）、**书写系统**（`Latn` 拉丁、`Hans` 简体、`Hant` 繁体、`Cyrl` 西里尔）、**地区**（`CN`、`US`、`TW`）。三者相互独立，组合会产生实质差异：`sr-Cyrl-RS` 与 `sr-Latn-RS` 是同一种语言的两套字母，`zh-Hans-SG` 与 `zh-Hant-TW` 的用词和字形都不同。关键细节：**书写系统子标签是防止「中文排序/字体出错」的关键**——只写 `zh` 时运行时只能靠地区去猜，写全 `zh-Hant` 才明确表达「繁体」。

也见 [BCP 47 Language Tag（BCP 47 语言标签）](#bcp-47-language-tagbcp-47-语言标签)、[CLDR（Unicode 通用语言环境数据库）](#cldrunicode-通用语言环境数据库)。

示例：[`33_intl/07_intl_locale.js`](33_intl/07_intl_locale.js)

### Locale Fallback Chain（locale 回退链）

当请求的 locale 在运行时数据里没有对应实现时，`Intl` 会按**确定性的顺序**逐级降级：先去掉扩展子标签，再去掉地区，最后到语言，仍无匹配则用宿主默认 locale。例如请求 `zh-Hant-TW-u-nu-hanidec`，可能实际退到 `zh-Hant-TW` → `zh-Hant` → `zh` → `en-US`。关键细节：回退是**静默**的——`new Intl.NumberFormat('xx-XX')` 这类「格式合法但不存在」的标签**不报错**，只在 `resolvedOptions().locale` 里暴露真相；而 `'not a locale!'` 这种语法非法的才会抛 `RangeError`。因此线上排查「格式不对」的第一步永远是打印 `resolvedOptions()`。

也见 [Intl Namespace（Intl 命名空间）](#intl-namespaceintl-命名空间)、[Language Negotiation（语言协商）](#language-negotiation语言协商)。

示例：[`33_intl/07_intl_locale.js`](33_intl/07_intl_locale.js)、[`33_intl/08_intl_best_practices.js`](33_intl/08_intl_best_practices.js)

### CLDR（Unicode 通用语言环境数据库）

CLDR（Common Locale Data Repository）是 Unicode 联盟维护的**语言环境规则数据库**：每个 locale 的日期图案、月份名、货币符号、复数规则、排序表、周起始日都在里面。它是 `Intl` 的数据源——JavaScript 语言本身只规定 API 形状（ECMA-402），具体「俄语的 2 是 few 还是 many」来自 CLDR。关键细节：CLDR 会随国家改名、货币改版、时区调整而**持续更新**，而 `Intl` 跟随运行时更新，这正是「不要手写这些规则、不要长期依赖第三方翻译包」的根本理由。

也见 [ICU and tzdata（ICU 与时区数据库）](#icu-and-tzdataicu-与时区数据库)。

示例：[`33_intl/01_intl_overview.js`](33_intl/01_intl_overview.js)

### ICU and tzdata（ICU 与时区数据库）

ICU（International Components for Unicode）是把 CLDR 数据**编译成可查询的库**的实现，Node 与浏览器都靠它提供 `Intl` 的数据；tzdata（IANA 时区数据库）则提供「每个地区历史上偏移多少小时、哪年改过夏令时」的信息。二者是分开打包的，所以会出现「ICU 里有时区名字，但 tzdata 版本旧导致 2023 年某国取消夏令时的变更没生效」这种问题。关键细节：Node 的 `Intl` **只在有 ICU 时才完整**，而 tzdata 版本决定了跨零点、跨夏令时计算的正确性——这类 bug 通常在一年中特定几天才复现。

也见 [full-icu and small-icu（完整 ICU 与精简 ICU）](#full-icu-and-small-icu完整-icu-与精简-icu)。

示例：[`33_intl/08_intl_best_practices.js`](33_intl/08_intl_best_practices.js)

### full-icu and small-icu（完整 ICU 与精简 ICU）

Node 可以按三种方式构建：`full-icu`（内置全部 locale 数据）、`small-icu`（只内置 `en-US`）、`system-icu`（链接系统库）。官方二进制发行版默认是 full-icu，但**嵌入式设备、Alpine 容器、自编译版本常是 small-icu**。后果是：代码在开发机输出「1,234.56 元」，到客户环境退化成「1,234.56」甚至英文月份，而且**不报任何错**。关键细节：检测手段就是 `new Intl.NumberFormat('zh-CN').resolvedOptions().locale` 是否为 `zh-CN`，或 `Intl.supportedValuesOf('timeZone').length` 是否正常；必要时可通过 `NODE_ICU_DATA` 或 `--icu-data-dir` 外挂数据。

也见 [ICU and tzdata（ICU 与时区数据库）](#icu-and-tzdataicu-与时区数据库)、[Locale Fallback Chain（locale 回退链）](#locale-fallback-chainlocale-回退链)。

示例：[`33_intl/08_intl_best_practices.js`](33_intl/08_intl_best_practices.js)

### Intl Namespace（Intl 命名空间）

`Intl` 是 ECMA-402 在语言里暴露的全局命名空间，把国际化能力做成**语言内置**而非第三方库。它是一个**普通对象，不是构造函数**——`Intl()` 会抛 `TypeError`。成员包括全部构造器（`NumberFormat`、`DateTimeFormat`、`Collator`、`PluralRules`、`ListFormat`、`Segmenter`、`DisplayNames`、`Locale`、`RelativeTimeFormat`）和静态工具（`Intl.supportedValuesOf`、各构造器的 `supportedLocalesOf`）。所有实例都遵循同一套契约：一个核心方法（`format` / `compare` / `select`）+ `resolvedOptions()` 返回**实际生效**的选项。

也见 [Locale Fallback Chain（locale 回退链）](#locale-fallback-chainlocale-回退链)、[Intl Instance Caching（Intl 实例缓存）](#intl-instance-cachingintl-实例缓存)。

示例：[`33_intl/01_intl_overview.js`](33_intl/01_intl_overview.js)

### Intl.NumberFormat（数字格式化）

`Intl.NumberFormat` 按 locale 规则格式化数字：小数位、千分位、货币符号与位置、百分号、单位、紧凑记数法（`compactDisplay` 的「1.2 万」/「1.2M」）。它是替代 `toFixed(2)` 的正确工具——`toFixed` 只保证小数位，分组符和货币位置全靠自己拼，必然出错。关键细节：同一份选项在不同 locale 下差异巨大（德语 `1.234,56` 与英语 `1,234.56` 的点和逗号正好相反）；**格式化结果不可逆**，`format()` 出来的字符串不能再 `parseInt` 回去，金额解析必须走固定协议。

也见 [Intl Instance Caching（Intl 实例缓存）](#intl-instance-cachingintl-实例缓存)、[Encoding, Encryption and Hashing（编码、加密与哈希）](#encoding-encryption-and-hashing编码加密与哈希)。

示例：[`33_intl/01_intl_overview.js`](33_intl/01_intl_overview.js)、[`33_intl/06_intl_display_names.js`](33_intl/06_intl_display_names.js)

### Intl.DateTimeFormat（日期时间格式化）

`Intl.DateTimeFormat` 把时间戳渲染成 locale 习惯的日期时间串：`2024/3/5`、`3/5/2024`、`٥‏/٣‏/٢٠٢٤` 都在同一个 API 下产生，还包括月份全名、星期、相对时间（`Intl.RelativeTimeFormat`）等形式。关键细节：它**默认使用宿主时区**，同一时间戳在开发机（Asia/Shanghai）和服务器（UTC）会输出不同日期——跨零点的订单、账单日、打卡记录都会因此差一天，所以涉及时间必须显式传 `timeZone: 'Asia/Shanghai'` 这类 IANA 名称，并理解 UTC 与夏令时。另外 `Intl` **只格式化不解析**，把展示串再 `new Date()` 回去是典型的错误做法。

也见 [ICU and tzdata（ICU 与时区数据库）](#icu-and-tzdataicu-与时区数据库)、[Intl Instance Caching（Intl 实例缓存）](#intl-instance-cachingintl-实例缓存)。

示例：[`33_intl/01_intl_overview.js`](33_intl/01_intl_overview.js)、[`33_intl/08_intl_best_practices.js`](33_intl/08_intl_best_practices.js)

### Intl.Collator（本地化比较器）

`Intl.Collator` 提供 `compare(a, b)` 方法，用某个 locale 的规则比较字符串，专供 `Array.prototype.sort()` 和 `localeCompare` 使用。它的行为与 `<`/`>` 完全不同：后者按 UTF-16 码元逐位比较，结果对人不友好也不正确（`'Z' < 'a'` 为真、`'10' < '9'` 为真）。关键选项有：`sensitivity`（base/ accent / case 是否参与比较）、`numeric`（自然排序）、`collation`（指定排序变体）、`ignorePunctuation`、`caseFirst`。关键细节：`new Intl.Collator(...).compare` 是一个**绑定函数**，可以直接 `arr.sort(collator.compare)` 传出去，不需要再包一层箭头函数。

也见 [Collation（排序规则）](#collation排序规则)、[Pinyin Collation（拼音排序）](#pinyin-collation拼音排序)、[Natural Sort（自然排序）](#natural-sort自然排序)。

示例：[`33_intl/02_intl_collator.js`](33_intl/02_intl_collator.js)

### Collation（排序规则）

Collation 是「字符串如何排序」的规则集，由 CLDR 按 locale 提供：拼音、笔画、注音、德语电话簿序（`phonebk`，把 `ö` 当作 `oe`、`ß` 当作 `ss`）等都是不同 collation。它决定了「张三」和「李四」谁在前——不是字符编码决定的，是文化约定决定的。关键细节：可以用 `-u-co-` 扩展写进标签（`'zh-CN-u-co-pinyin'`），也可以走 `options.collation`；CLDR 对 `zh` 的**默认值就是 pinyin**，所以 `zh-CN` 下不传 `collation` 也已是拼音序。**常见误解**：以为「排序规则是全局的」——同一个 `Intl.Collator` 实例不能跨 locale 复用结论，服务端按 `en-US` 排的结果不能直接拿来给中文用户看。

也见 [Pinyin Collation（拼音排序）](#pinyin-collation拼音排序)、[Intl.Collator（本地化比较器）](#intlcollator本地化比较器)。

示例：[`33_intl/02_intl_collator.js`](33_intl/02_intl_collator.js)

### Pinyin Collation（拼音排序）

拼音排序是中文场景最常用的 collation，写作 `'zh-CN-u-co-pinyin'` 或 `{ collation: 'pinyin' }`，效果是「按汉语拼音字母顺序排汉字」：`阿` 在 `包` 前，`包` 在 `陈` 前。它是 `zh` 的默认排序规则，但**与笔画序（`stroke`）、注音序兼容序（`zhuyin`）结果完全不同**，中文通讯录、城市列表、字典索引对排序方式有明确要求。关键细节：拼音排序在**同音字之间**仍然需要一套内部规则（CLDR 用字形/笔画近似），所以「拼音序」不等于「严格按拼音」；对排序结果有硬性要求时应把结果与预期表比对，而不是假设。

也见 [Collation（排序规则）](#collation排序规则)。

示例：[`33_intl/02_intl_collator.js`](33_intl/02_intl_collator.js)

### Natural Sort（自然排序）

自然排序（又叫 numeric sort）是让「含数字的字符串」按人预期排序的模式，通过 `{ numeric: true }` 开启：`['file1','file2','file10']` 而不是字典序的 `['file1','file10','file2']`。它的核心是**在比较的当前位置把连续数字当数值比较**，而不是逐个字符比码点。关键细节：`numeric` 只在「同位置都是数字串」时生效，`'a1'` 与 `'a01'` 在 `en-US` 下会被视为**相等**（`compare` 返回 0），这会让依赖稳定排序的代码产生意料之外的顺序；版本号、文件名、章节号（`第2章` 与 `第10章`）是最典型的受益场景。

也见 [Intl.Collator（本地化比较器）](#intlcollator本地化比较器)。

示例：[`33_intl/02_intl_collator.js`](33_intl/02_intl_collator.js)

### Intl.PluralRules（复数规则）

`Intl.PluralRules` 回答的问题是「这个数字该配哪种词形」：`select(1)` 返回 `'one'`、`select(3)` 返回 `'other'`，中文永远返回 `'other'`，俄语可能返回 `'one'`/`'few'`/`'many'`。它**不做翻译**，只返回类别名，你的文案表再按类别取词。关键选项是 `type: 'cardinal'`（默认，基数「1 个」）与 `type: 'ordinal'`（序数「第 1 个」）。关键细节：`selectRange(start, end)` 用于「1–2 件」这类范围文案，且**结果不一定等于两端 select 的结果**——`en-US` 里 `select(1)` 是 `'one'`，但 `selectRange(1,1)` 是 `'other'`。

也见 [Plural Category（复数类别）](#plural-category复数类别)、[Ordinal（序数词）](#ordinal序数词)。

示例：[`33_intl/03_intl_plural_rules.js`](33_intl/03_intl_plural_rules.js)

### Plural Category（复数类别）

复数类别是 CLDR 定义的六个取值：`zero`、`one`、`two`、`few`、`many`、`other`。不同语言用到的子集不同：英语只用 `one`/`other`，阿拉伯语六个全用，中文只用 `other`，俄语用 `one`/`few`/`many`/`other`。**`other` 是必需的最后兜底**——规范保证 `select()` 一定会返回一个类别，但你的文案表必须至少提供 `other`，否则运行时会取到 `undefined` 并渲染出 `undefined 件商品`。关键细节：类别是按**规则**算出来的，不是按数字大小简单划分的：俄语里 11 属于 `many`，而 21 又回到 `one`。

也见 [Intl.PluralRules（复数规则）](#intlpluralrules复数规则)。

示例：[`33_intl/03_intl_plural_rules.js`](33_intl/03_intl_plural_rules.js)

### Ordinal（序数词）

序数词是「第几」的表达（英语 1st / 2nd / 3rd / 4th），与基数词「几个」是**两套独立的规则**，用 `new Intl.PluralRules(locale, { type: 'ordinal' })` 获取类别。英语的序数规则很反直觉：`1 → one`、`2 → two`、`3 → few`、`4 → other`，但 `11/12/13 → other`，`21 → one`。关键细节：**中文没有序数词的词形变化**，「第 1 个」直接拼即可，所以中文项目里序数规则常被忽略，一旦做多语言（英语、法语 `1er`、德语 `1.`）就会暴露；用 `type` 而不是另写一套判断表，是唯一可维护的写法。

也见 [Plural Category（复数类别）](#plural-category复数类别)。

示例：[`33_intl/03_intl_plural_rules.js`](33_intl/03_intl_plural_rules.js)

### Intl.ListFormat（列表格式化）

`Intl.ListFormat` 把数组连接成符合 locale 习惯的自然语言列表：中文 `「张三、李四和王五」`，英文 `"Alice, Bob, and Carol"`，并支持 `type: 'disjunction'` 的「或者」形式（`A、B 或 C`）。它是替代 `arr.join('、')` 或 `join(', ')` 的正确工具——后者在英文里会漏掉最后的 and，在中文里会漏掉「和」。关键细节：`style` 有 `long`/`short`/`narrow` 三档，影响连接词的长度与标点；`format()` 接收的是**可迭代对象**，元素会被当作字符串原样使用，所以列表里的名称要自己先格式化好。

也见 [Intl Instance Caching（Intl 实例缓存）](#intl-instance-cachingintl-实例缓存)。

示例：[`33_intl/04_intl_list_format.js`](33_intl/04_intl_list_format.js)

### Intl.Segmenter（分词器）

`Intl.Segmenter` 是「按语言规则切分字符串」的构造器，通过 `granularity` 选择三种粒度：`'grapheme'`（字素簇，用户感知的一个字符）、`'word'`（词，带 `isWordLike` 标记）、`'sentence'`（句子）。它是**唯一**能正确完成「按用户感知切字」「按词统计」「句级断行」的标准工具，`split('')`、`split(' ')`、正则 `\b` 全都做不到。关键细节：`segment()` 返回的是**可迭代对象**，每一项形如 `{ segment, index, input, isWordLike }`；`isWordLike` 只在 `word` 粒度存在（标点、空格、emoji 为 `false`）；`containing(index)` 可以反查某个下标属于哪一段。

也见 [Grapheme Cluster（字素簇）](#grapheme-cluster字素簇)、[Word Boundary（词边界）](#word-boundary词边界)。

示例：[`33_intl/05_intl_segmenter.js`](33_intl/05_intl_segmenter.js)

### Grapheme Cluster（字素簇）

用户眼中「一个字符」的实际单位，可能由多个码点组合而成：`'👨‍👩‍👧‍👦'.length` 是 11（UTF-16 码元），`[...str].length` 是 7（码点），而字素簇只有 **1**。国旗、带变音符的字母、emoji 组合序列都属于这种情况。凡是需要「按用户感知的字符」做计数、截断或光标移动的地方（如输入框字数统计、摘要截断），都必须用 `Intl.Segmenter` 按字素簇切分，否则会把一个 emoji 拦腰截断成乱码。

也见 [Intl.Segmenter（分词器）](#intlsegmenter分词器)、[Code Point and Code Unit（码点与码元）](#code-point-and-code-unit码点与码元)。

示例：[`33_intl/05_intl_segmenter.js`](33_intl/05_intl_segmenter.js)

### Word Boundary（词边界）

词边界是「一个词从哪里开始、到哪里结束」的位置，中文、日文、泰文**没有空格分隔**，所以正则的 `\b` 与 `split(' ')` 在这些语言上完全失效（`\b` 只认 ASCII 词字符与非词字符的交界）。`Intl.Segmenter` 的 `word` 粒度用 CLDR 的分词规则（含词典）给出正确的词边界，并区分「实词」与「标点/空白」。关键细节：做关键词提取、高亮、字数统计时必须过滤 `isWordLike === false` 的段，否则标点和空格也会被算成词；中文分词结果与专业 NLP 分词器相比粒度较粗，`Intl` 的目标是「符合语言习惯」，而不是「语言学最细」。

也见 [Intl.Segmenter（分词器）](#intlsegmenter分词器)、[Grapheme Cluster（字素簇）](#grapheme-cluster字素簇)。

示例：[`33_intl/05_intl_segmenter.js`](33_intl/05_intl_segmenter.js)

### Intl.DisplayNames（名称显示）

`Intl.DisplayNames` 把**代码**翻译成人类可读的本地化名称：语言（`'zh'` → 「中文」）、地区（`'CN'` → 「中国」）、货币（`'CNY'` → 「人民币」）、书写系统、日期字段（`'month'` → 「月」）。它是「把数据库里存的 `de-DE` 渲染给用户看」的标准做法，避免了在代码里维护一张「语言代码 → 中文名」的静态表（那张表必然过时，而且反过来还要维护「中文名 → 代码」）。关键细节：必须传 `type` 参数，`fallback` 决定查不到时返回原代码还是 `undefined`；`of()` 对非法代码会返回 `undefined` 而不抛错，调用处要兜底。

也见 [BCP 47 Language Tag（BCP 47 语言标签）](#bcp-47-language-tagbcp-47-语言标签)。

示例：[`33_intl/06_intl_display_names.js`](33_intl/06_intl_display_names.js)

### Intl.Locale（Locale 对象）

`Intl.Locale` 把语言标签解析成**结构化对象**并做推导：`new Intl.Locale('zh-Hans-CN-u-nu-hanidec')` 后可以读 `language`、`script`、`region`、`numberingSystem`、`calendar`，也可以通过 `getCalendars()` / `getTimeZones()` / `getWeekInfo()`（取代已废弃的属性形式）拿到该 locale 的约定，例如「一周从周几开始」。它还提供两个关键推导方法：`maximize()` 补全成 CLDR 认为最可能的完整标签（`en` → `en-Latn-US`），`minimize()` 反向省略可推导的部分。**常见误解**：`maximize()` 是**猜测不是事实**（英式用户也可能是 `en-GB`）；`minimize()` **不可逆**（`zh-Hans-CN` 与 `zh-Hans-SG` 都变成 `zh`），所以推导结果不要写进数据库。

也见 [Language Negotiation（语言协商）](#language-negotiation语言协商)。

示例：[`33_intl/07_intl_locale.js`](33_intl/07_intl_locale.js)

### Language Negotiation（语言协商）

语言协商是在多个候选 locale 之间**选出实际使用哪一个**的过程：拿到浏览器的 `Accept-Language`（如 `zh-CN,zh;q=0.9,en;q=0.8`）或 `navigator.languages` 数组后，从前到后找出第一个你的应用真正支持的 locale，找不到就走默认值。关键细节：**不要自己做字符串前缀匹配**（`startsWith('zh')` 会把 `zh-Hant` 当成 `zh-Hans`、把 `zh-TW` 匹配到简体资源），正确做法是 `Intl.Xxx.supportedLocalesOf(candidates)` 批量探测，或借助 `new Intl.Locale(tag).maximize()` 做标签级的近似匹配。协商结果要**固定下来**（存 cookie/用户配置），否则用户换设备、换浏览器语言时界面语言会突变。

也见 [Locale Fallback Chain（locale 回退链）](#locale-fallback-chainlocale-回退链)、[Intl.Locale（Locale 对象）](#intllocalelocale-对象)。

示例：[`33_intl/07_intl_locale.js`](33_intl/07_intl_locale.js)、[`33_intl/08_intl_best_practices.js`](33_intl/08_intl_best_practices.js)

### RTL（从右到左布局）

RTL（right-to-left）指阿拉伯语、希伯来语、波斯语等语言的书写方向，整个界面的布局需要**镜像**：导航栏、图标方向、进度条、表格列序都要翻转。在 Web 上的正确实现方式是 CSS 逻辑属性（`margin-inline-start`、`padding-inline-end`、`text-align: start`）配合 `<html dir="rtl">`，让同一份 CSS 自动适配两个方向。关键细节：**语言方向是有数据的**，不该靠语言代码硬编码判断——可以通过 `Intl.Locale` 的 `textInfo`/`getTextInfo()` 拿到 `direction`，让新增语言时不改代码。**常见误解**：以为 RTL 只是「文字右对齐」——嵌在 RTL 文本里的数字和拉丁字母仍然保持 LTR，这是 Unicode 双向算法（bidi）负责的，`dir` 只负责块级布局。

也见 [Intl.Locale（Locale 对象）](#intllocalelocale-对象)、[Locale（区域设置）](#locale区域设置)。

示例：[`33_intl/07_intl_locale.js`](33_intl/07_intl_locale.js)

### Intl Instance Caching（Intl 实例缓存）

`Intl` 的每个构造器在 `new` 的时候都要做一次「locale 协商 + 数据装配 + 选项解析」，代价远高于后续的 `format()` 调用；在循环或渲染函数里反复 `new Intl.NumberFormat(...)` 会直接变成 CPU 热点（本仓库实测约慢 60 倍）。正确做法是**按 `(locale, options)` 组合建立模块级缓存**，把实例复用到进程结束。关键细节：缓存的 key 必须包含全部影响输出的选项（locale、`timeZone`、`currency`、`numberingSystem`……），只按 locale 缓存会导致「同一个 locale 不同货币格式串味」；另外缓存实例是**线程/请求安全**的，因为 `format()` 是无状态的纯函数。

也见 [Intl Namespace（Intl 命名空间）](#intl-namespaceintl-命名空间)。

示例：[`33_intl/08_intl_best_practices.js`](33_intl/08_intl_best_practices.js)、[`33_intl/01_intl_overview.js`](33_intl/01_intl_overview.js)

## 现代 ES 特性（ECMAScript 演进）

### ECMAScript（ECMAScript 标准）

ECMAScript 是 JavaScript 的**语言标准**（规范编号 ECMA-262），由 Ecma International 发布；「JavaScript」是实现该标准的语言的习惯叫法，还包含宿主环境（浏览器/Node）提供的额外 API（DOM、`fs` 等）。规范本身**不定义** `console.log`、`setTimeout`、`document`，这些属于宿主或 WHATWG/W3C 标准。关键细节：讲「ES 特性」时指的是语言层面的语法与内置对象（`Array.prototype.at`、类字段、`Promise.try`），而 `Web Crypto`、`ReadableStream` 属于 Web 平台标准，二者发布节奏不同、兼容性策略也不同。

也见 [TC39（TC39 委员会）](#tc39tc39-委员会)、[ES Release Year（ES 年度版本）](#es-release-yeares-年度版本)。

示例：[`34_modern_es_features/01_es2021_features.js`](34_modern_es_features/01_es2021_features.js)

### TC39（TC39 委员会）

TC39 是 Ecma 下属、负责**制定 ECMAScript 标准**的技术委员会，成员来自各家浏览器厂商与社区。它的产出不是「浏览器实现」而是**规范文本**，浏览器与 Node 再按规范实现。关键细节：TC39 的运作是**共识制**（consensus），任何提案都必须让所有成员「不反对」才能推进，因此流程保守、周期长；规范文本比实现更权威，遇到「Chrome 能跑、Firefox 不行」的差异时，判断谁对要看规范而不是工具。日常开发中与 TC39 打交道的方式就是——看提案处于哪个 Stage。

也见 [Proposal Process（提案流程与 Stage 0–4）](#proposal-process提案流程与-stage-04)、[ECMAScript（ECMAScript 标准）](#ecmascriptecmascript-标准)。

示例：[`34_modern_es_features/05_es2025_iterator_helpers.js`](34_modern_es_features/05_es2025_iterator_helpers.js)

### Proposal Process（提案流程与 Stage 0–4）

TC39 用五级 Stage 描述一个提案的成熟度，是**判断「能不能在生产环境用」的唯一可靠依据**：Stage 0（想法）、Stage 1（问题与方向被认可，可能大改）、Stage 2（规范草案成形，语法基本定型）、Stage 2.7（规范文本与测试就绪）、Stage 3（规范完成、等待实现与反馈，此时引擎开始实现）、Stage 4（两个独立实现通过测试，正式并入规范）。关键细节：**Stage 3 是「可以谨慎使用、需要 polyfill 或转译」的分界线**，Stage 4 才是「已进标准」；Stage 2 及以前的语法随时可能改名或删除，绝对不要在生产代码里用。

也见 [ES Release Year（ES 年度版本）](#es-release-yeares-年度版本)、[Polyfill（垫片）](#polyfill垫片)。

示例：[`34_modern_es_features/05_es2025_iterator_helpers.js`](34_modern_es_features/05_es2025_iterator_helpers.js)、[`34_modern_es_features/07_promise_try_and_regexp_escape.js`](34_modern_es_features/07_promise_try_and_regexp_escape.js)

### ES Release Year（ES 年度版本）

从 ES2015（即 ES6，2015 年发布，是史上最大的一次改版）开始，ECMAScript **改为每年发布一版**，用年份命名：ES2016、ES2017……一直到 ES2025。命名上 `ES6` = `ES2015`，`ES7` 之类的旧叫法在 ES2015 之后就废弃了（因为没有 ES7 这个正式版本号）。关键细节：**特性属于哪一版，与浏览器什么时候支持它是两件事**——一个特性可能 ES2022 进规范、Chrome 2020 就先实现了；反之某个 ES2023 特性在某些环境至今缺失，所以判断可用性永远要**特性检测**而不是「查版本号」。

也见 [Feature Detection（特性检测）](#feature-detection特性检测)、[ECMAScript（ECMAScript 标准）](#ecmascriptecmascript-标准)。

示例：[`34_modern_es_features/02_es2022_features.js`](34_modern_es_features/02_es2022_features.js)、[`34_modern_es_features/04_es2024_features.js`](34_modern_es_features/04_es2024_features.js)

### Polyfill（垫片）

Polyfill 是**在运行时**用纯 JavaScript 补上当前环境缺失的**内置对象或方法**，例如给老环境补一个 `Array.prototype.at` 或 `Object.groupBy`。它适用于「API 缺失」的场景，通常做法是 `if (!Array.prototype.at) { Array.prototype.at = function (n) { ... } }`。关键细节：polyfill 有三重代价——**性能**（纯 JS 实现通常比原生慢，`groupBy` 尤其明显）、**语义漂移**（很难 100% 复刻规范细节，例如用 JSON 深拷贝冒充 `structuredClone` 会不支持循环引用与 Map/Set，代码还能跑但结果错了）、**可维护性**（几年后没人敢删）。引 polyfill 要按需，而不是无脑 `import 'core-js'`。

也见 [Transpile（转译）](#transpile转译)、[Syntax Feature vs API Feature（语法特性与 API 特性）](#syntax-feature-vs-api-feature语法特性与-api-特性)。

示例：[`01_syntax_basics/06_language_versions_and_compatibility.js`](01_syntax_basics/06_language_versions_and_compatibility.js)

### Transpile（转译）

转译是**在构建期**把新语法改写成老语法（如 `a?.b` → `a === null || a === void 0 ? void 0 : a.b`），产出一份能在旧引擎运行的新文件。术语本身是 transform + compile 的合成词，与「编译」（编译到机器码）不同——它仍是源码到源码（source-to-source）。关键细节：**polyfill 救不了语法**，旧引擎连解析都过不了可选链，所以你写多少运行时垫片都没用，只能靠转译；反过来 `Array.prototype.at` 这种「方法缺失」转译也帮不上忙，必须靠 polyfill。两者职责不重叠，需要哪个取决于缺的是语法还是 API。

也见 [Polyfill（垫片）](#polyfill垫片)、[Compiler and Bundler（编译器与打包器）](#compiler-and-bundler编译器与打包器)、[Source Map（源码映射）](#source-map源码映射)。

示例：[`01_syntax_basics/06_language_versions_and_compatibility.js`](01_syntax_basics/06_language_versions_and_compatibility.js)

### Compiler and Bundler（编译器与打包器）

现代前端工具链里，**打包器**（bundler，如 webpack / Rollup / Vite / esbuild）负责从入口出发解析模块图、合并与拆分产物、处理资源；**编译器 / 转译器**（如 Babel / SWC / TypeScript 编译器）负责把单个文件从一种语法变成另一种。两者常集成在同一个工具里，但从职责上要分清：打包解决「模块怎么组织成文件」，转译解决「语法怎么降到目标环境能懂」。关键细节：它们都会**改写代码**，所以产物的行号与源码不再对应，必须配合 Source Map 才能调试；目标环境的语法级别通常由 `browserslist` 之类的配置决定。

也见 [Transpile（转译）](#transpile转译)、[Source Map（源码映射）](#source-map源码映射)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Feature Detection（特性检测）

特性检测是**在运行时直接问环境「这个能力在不在」**，而不是猜「版本号够不够新」：`typeof Array.prototype.at === 'function'`、`'groupBy' in Object`、`typeof Intl.Segmenter !== 'undefined'`。它是唯一可靠的兼容性判断方式，因为版本号与实际能力之间没有稳定对应（同一个浏览器不同版本、同一版本不同平台、Node 不同构建的 ICU 都可能不一样）。关键细节：检测要**检测到真正用到的那一层**（检测 `Intl` 存在不等于 `Intl.Segmenter` 存在）；对于 API 检测到缺失后再决定 polyfill、降级还是直接不用。

也见 [Graceful Degradation（优雅降级）](#graceful-degradation优雅降级)、[Polyfill（垫片）](#polyfill垫片)。

示例：[`01_syntax_basics/06_language_versions_and_compatibility.js`](01_syntax_basics/06_language_versions_and_compatibility.js)、[`34_modern_es_features/03_es2023_features.js`](34_modern_es_features/03_es2023_features.js)

### Graceful Degradation（优雅降级）

优雅降级指「在新环境用新能力，在旧环境**退到一个仍然可用**的形态，而不是直接崩掉」：`Intl.Segmenter` 不存在时退回按码点切分并提示「当前环境不支持精确计数」；`structuredClone` 不存在时退回受限的深拷贝实现。它与**渐进增强**是一对互补视角：渐进增强从「最小可用基线」出发往上加能力，优雅降级从「新能力」出发向下兜底，实际项目里两者都要有。关键细节：降级必须是**有意识的、被记录的**，需要日志或上报把「发生了降级」暴露出来，否则降级会悄悄变成长期的正确性缺陷。**常见误解**：以为套个 `try/catch` 就是降级——捕捉到错误后继续用错误的结果往下跑，比抛错更危险。

也见 [Feature Detection（特性检测）](#feature-detection特性检测)。

示例：[`01_syntax_basics/06_language_versions_and_compatibility.js`](01_syntax_basics/06_language_versions_and_compatibility.js)

### Syntax Feature vs API Feature（语法特性与 API 特性）

这是判断「该怎么兼容」的分水岭：**语法特性**改变的是代码的书写形式（可选链 `?.`、类字段 `x = 1`、`using` 声明、`#private`），旧引擎的**解析器**读不懂，会直接抛 `SyntaxError`；**API 特性**是新增的内置对象或方法（`Array.prototype.at`、`Object.groupBy`、`Intl.Segmenter`），语法上完全合法，只是运行时报 `undefined is not a function`。结论很硬：**语法缺失只能转译，API 缺失只能 polyfill**，二者不可互换。关键细节：语法特性是最容易被忽略的兼容性来源——你用 `using` 写得好好的，打包工具的老解析器直接报错，而这时候任何 polyfill 都无济于事。

也见 [Transpile（转译）](#transpile转译)、[Polyfill（垫片）](#polyfill垫片)。

示例：[`01_syntax_basics/06_language_versions_and_compatibility.js`](01_syntax_basics/06_language_versions_and_compatibility.js)、[`34_modern_es_features/08_explicit_resource_management.js`](34_modern_es_features/08_explicit_resource_management.js)

### Logical Assignment Operators（逻辑赋值运算符）

ES2021 引入的 `&&=`、`||=`、`??=` 把「先判断再赋值」合并成一个运算符，且**只在必要时才求值右侧**：`a ||= b` 等价于「`a` 为假值时把 `b` 赋给它」，`a ??= b` 只在 `a` 为 `null`/`undefined` 时赋值。关键区别在于 `??=` 与 `||=`：`0`、`''`、`false` 对 `||=` 算「假」会被覆盖，而 `??=` 只认 `null`/`undefined`，所以「配置项缺省值」要用 `??=`，否则用户显式填的 `0` 会被悄悄改掉。关键细节：右侧表达式**惰性求值**，`a ||= expensive()` 在 `a` 已为真时不会执行 `expensive()`，这既是性能优势也是副作用陷阱。

也见 [ES Release Year（ES 年度版本）](#es-release-yeares-年度版本)。

示例：[`34_modern_es_features/01_es2021_features.js`](34_modern_es_features/01_es2021_features.js)

### Numeric Separators（数字分隔符）

数字分隔符允许在数字字面量里插入下划线提高可读性：`1_000_000`、`0xFF_FF`、`1_234.567_8`，下划线**不改变数值**，纯粹是视觉分组。它解决的是「大额常量靠数零」的问题——`const TIMEOUT_MS = 30_000` 一眼能看出是三万毫秒，而 `30000` 要看两遍。关键细节：下划线只能出现在**数字之间**，`_1000`、`1000_`、`1__0`、`1_.0` 都是语法错误；也不能出现在 `BigInt` 的 `n` 前后。

也见 [ES Release Year（ES 年度版本）](#es-release-yeares-年度版本)。

示例：[`34_modern_es_features/01_es2021_features.js`](34_modern_es_features/01_es2021_features.js)

### Class Fields and Private Methods（类字段与私有方法）

类字段让实例属性可以**直接写在类体里**（`count = 0`），不必再在构造函数里逐个赋值；私有字段与方法用 `#` 前缀声明（`#secret`、`#compute()`），是**语言级的硬私有**——外部访问是语法错误，连 `Object.keys` 也看不到，而不是靠 `_` 下划线约定。关键细节：实例字段是**每次构造时按声明顺序初始化**的，因此会**遮蔽**原型上的同名属性，而且初始化发生在 `super()` 之后；私有成员不能被继承链外部访问，也不能用 `this['#x']` 绕过。**常见误解**：以为 `#` 字段能被反射列出——它根本不在普通属性表里，这也是它比 `Symbol` 或弱引用表更可靠的原因。

也见 [Static Initialization Block（静态初始化块）](#static-initialization-block静态初始化块)。

示例：[`34_modern_es_features/02_es2022_features.js`](34_modern_es_features/02_es2022_features.js)

### Static Initialization Block（静态初始化块）

静态块 `static { ... }` 提供了一段**在类定义时执行一次**的代码块，用来做需要多语句、需要 `try/catch`、或需要访问私有静态成员的静态初始化。在此之前只能用类外的一次性代码（拿不到 `#` 私有成员）或 `static x = (() => {...})()` 这类别扭写法。关键细节：静态块与静态字段**按书写顺序依次求值**，`static { }` 里可以访问同类中已声明的私有静态成员；块内的 `this` 指向类本身；抛错会导致整个类定义失败。

也见 [Class Fields and Private Methods（类字段与私有方法）](#class-fields-and-private-methods类字段与私有方法)。

示例：[`34_modern_es_features/02_es2022_features.js`](34_modern_es_features/02_es2022_features.js)

### Array.prototype.at（负索引取值）

`at(i)` 是 `arr[i]` 的补充：`i` 为**负数时从末尾倒数**（`arr.at(-1)` 是最后一个元素），越界返回 `undefined` 而不抛错，`String.prototype.at` 与 TypedArray 上同样存在。它替代了 `arr[arr.length - 1]` 这种又长又容易写错的写法，也让「倒数第 n 个」的意图在代码里直接可见。关键细节：**它不认识 Unicode**——`'👨‍👩‍👧‍👦'.at(-1)` 取到的是最后一个 UTF-16 码元而不是最后一个字素簇，按「用户感知字符」取值仍要用 `Intl.Segmenter`。

也见 [Grapheme Cluster（字素簇）](#grapheme-cluster字素簇)、[Non-destructive Array Methods（非破坏性数组方法）](#non-destructive-array-methods非破坏性数组方法)。

示例：[`34_modern_es_features/02_es2022_features.js`](34_modern_es_features/02_es2022_features.js)

### Non-destructive Array Methods（非破坏性数组方法）

ES2023 为数组补上了一组**返回新数组、不改原数组**的方法：`toSorted()`、`toReversed()`、`toSpliced()` 和 `with(index, value)`，对应原本会就地修改的 `sort`、`reverse`、`splice` 与下标赋值。它们的价值在于**可预测性**——调用方一眼就能看出原数组不会被改动，这对 React 之类依赖引用比较的框架尤其重要（就地 `sort` 会让 `useMemo` 的依赖判断失效）。关键细节：它们都是**浅拷贝**，元素本身如果是对象仍是共享引用；`with` 支持负索引，越界会抛 `RangeError`；这些方法在 TypedArray 上也存在。**常见误解**：以为 `toSorted` 是 `sort` 的别名而随手替换——原来的代码如果依赖「就地修改」（后续代码读同一数组），替换后行为会变。

也见 [Array.prototype.at（负索引取值）](#arrayprototypeat负索引取值)。

示例：[`34_modern_es_features/03_es2023_features.js`](34_modern_es_features/03_es2023_features.js)

### Object.groupBy and Map.groupBy（原生分组）

ES2024 引入两个静态方法做原生分组：`Object.groupBy(items, keyFn)` 返回一个**无原型对象**，键是函数返回的字符串，值是元素数组；`Map.groupBy(items, keyFn)` 返回 `Map`，键可以是**任意值**（对象、数字、布尔）。它们替代了过去那段几乎一模一样的 `reduce((acc, item) => { (acc[k] ??= []).push(item); return acc; }, {})`，语义更直白。关键细节：`Object.groupBy` 的返回值是 **null 原型对象**，`result.hasOwnProperty`、`result.toString` 都不存在，要判断键存在请用 `Object.hasOwn(result, key)`；`Map.groupBy` 用对象当键时是**引用相等**，两个内容相同的对象会被分成两组。

也见 [Iterator Helpers（迭代器助手）](#iterator-helpers迭代器助手)。

示例：[`34_modern_es_features/04_es2024_features.js`](34_modern_es_features/04_es2024_features.js)

### Iterator Helpers（迭代器助手）

迭代器助手（ES2025）把 `map`、`filter`、`take`、`drop`、`flatMap`、`reduce`、`toArray` 等方法**直接挂在迭代器原型上**，让迭代器也能链式调用，并且**全程惰性**：`iter.map(f).filter(g).take(3).toArray()` 只会从源头取到足够满足 `take(3)` 的元素，不会先把整个序列物化。这与数组的 `map/filter` 有本质区别——后者每一步都创建完整的新数组。关键细节：`Iterator.from(x)` 可以把任意可迭代对象转成迭代器助手；`Iterator.prototype` 上的方法是**通用的**，所以能消费无限序列（配合 `take` 使用）；`toArray()` 是终结操作，在无限迭代器上调用会挂死。

也见 [Lazy Evaluation（惰性求值）](#lazy-evaluation惰性求值)、[Set Methods（Set 集合运算方法）](#set-methodsset-集合运算方法)。

示例：[`34_modern_es_features/05_es2025_iterator_helpers.js`](34_modern_es_features/05_es2025_iterator_helpers.js)

### Lazy Evaluation（惰性求值）

惰性求值指「**只在真正需要结果时才计算**」，迭代器与生成器是 JavaScript 里最基本的实现方式：`function*` 里的代码在你调用 `next()` 之前一行都不会执行，因此可以表达无限序列、按需读取大文件、边拉取边处理。它与数组方法的**及早求值**（eager）形成对照，也是迭代器助手、`Array.fromAsync`、Streams 的 `pull` 背压模型共享的思想。关键细节：惰性带来两个副作用——**副作用发生时机后移**（`map` 里的日志可能在你以为之后的位置才打印）、**迭代器只能消费一次**（消费完再遍历得到空结果）。

也见 [Iterator Helpers（迭代器助手）](#iterator-helpers迭代器助手)、[highWaterMark and Backpressure（highWaterMark 与背压）](#highwatermark-and-backpressurehighwatermark-与背压)。

示例：[`34_modern_es_features/05_es2025_iterator_helpers.js`](34_modern_es_features/05_es2025_iterator_helpers.js)

### Set Methods（Set 集合运算方法）

ES2025 为 `Set` 补上了七个原生集合运算方法：`union`、`intersection`、`difference`、`symmetricDifference`（对称差，并集减去交集）、`isSubsetOf`、`isSupersetOf`、`isDisjointFrom`（是否有交集）。在此之前每个项目都要自己写一遍「用 `new Set([...a].filter(x => b.has(x)))` 求交集」的代码，容易写出 O(n²) 的实现或漏掉去重。关键细节：所有方法都**返回新的 `Set`，不修改原集合**（`isXxxOf` 系列返回布尔值）；它们按 SameValueZero 比较，因此 `NaN` 视为相等、`+0`/`-0` 视为相等；`difference` 是**单向**的，`a.difference(b)` 与 `b.difference(a)` 不同。

也见 [Iterator Helpers（迭代器助手）](#iterator-helpers迭代器助手)。

示例：[`34_modern_es_features/06_es2025_set_methods.js`](34_modern_es_features/06_es2025_set_methods.js)、[`23_collections/04_set_operations.js`](23_collections/04_set_operations.js)

### Promise.withResolvers（延迟兑现的 Promise 三件套）

`Promise.withResolvers()` 一次返回 `{ promise, resolve, reject }` 三件套，把 `resolve`/`reject` 暴露到 `executor` 之外使用。它解决的是经典的「**Promise 构造函数反模式**」——过去必须写 `let resolve; const p = new Promise(r => { resolve = r; })` 这种先声明再赋值的别扭代码。典型场景是把回调式 API 包成 Promise、或在事件回调里手动兑现一个等待中的 Promise。关键细节：它**只是语法糖**，没有增加取消能力；忘记在异常路径上调用 `reject` 会让这个 Promise **永远悬挂**（`await` 卡住、`.finally` 不执行），这是它最常见的误用。

也见 [Promise.try（同步执行并转成 Promise）](#promisetry同步执行并转成-promise)、[Error.cause（错误原因链）](#errorcause错误原因链)。

示例：[`34_modern_es_features/04_es2024_features.js`](34_modern_es_features/04_es2024_features.js)

### Promise.try（同步执行并转成 Promise）

`Promise.try(fn, ...args)` **同步调用** `fn` 并把结果统一包成 Promise：如果 `fn` 返回 Promise 就沿用它的状态，如果 `fn` **同步抛错**，则把异常转成 rejected Promise。它解决的是「混合错误源」问题——一个函数可能同步抛 `TypeError`、也可能返回 rejected Promise，调用方用 `try/catch` 只能接住前者、用 `.catch()` 只能接住后者，写起来必须两层都套。关键细节：`Promise.try` 里 `fn` 是**同步执行**的（不是排进微任务后才执行），所以调用时的副作用仍然立即发生；这让「不确定是否异步的清理/校验逻辑」有了统一的错误处理路径。

也见 [Promise.withResolvers（延迟兑现的 Promise 三件套）](#promisewithresolvers延迟兑现的-promise-三件套)、[AggregateError and SuppressedError（聚合错误与抑制错误）](#aggregateerror-and-suppressederror聚合错误与抑制错误)。

示例：[`34_modern_es_features/07_promise_try_and_regexp_escape.js`](34_modern_es_features/07_promise_try_and_regexp_escape.js)

### Array.fromAsync（异步可迭代对象转数组）

`Array.fromAsync(iterable)` 是 `Array.from` 的异步版本：它接受**异步可迭代对象**（async generator）或**元素是 Promise 的可迭代对象**，逐个等待后收集成一个数组并返回 Promise。它替代了 `for await (const x of src) out.push(x)` 这段样板代码，让「分页拉取全部数据」「把异步流读成数组」有一行写法。关键细节：它是**串行**消费的（依次 `await` 每个元素），源是无限异步迭代器时会永远不结束；对「元素是 Promise」的情况它会逐个等待，与 `Promise.all` 的并发语义不同——不要指望它提速。

也见 [Iterator Helpers（迭代器助手）](#iterator-helpers迭代器助手)、[Promise.try（同步执行并转成 Promise）](#promisetry同步执行并转成-promise)。

示例：[`34_modern_es_features/07_promise_try_and_regexp_escape.js`](34_modern_es_features/07_promise_try_and_regexp_escape.js)

### RegExp.escape（正则字面量转义）

`RegExp.escape(str)` 把任意字符串转义成**可以安全放进正则字面量**的形式：`'a.b*c'` → `'a\\.b\\*c'`。它解决的是「把用户输入（搜索关键词、文件名、标签）当字面量拼进 `new RegExp(...)`」时的注入与误匹配问题——用户输入里的 `.`、`*`、`(`、`\` 会让正则语义完全变样，甚至构成 ReDoS 风险。关键细节：它转义的**只是正则元字符**，转义结果仍应通过构造函数使用（`new RegExp(RegExp.escape(input))`），而不是指望它做 HTML 转义或 SQL 转义；首字符是数字等情况它也会按需处理，保证结果可直接嵌入。

也见 [RegExp v Flag（v 标志）](#regexp-v-flagv-标志)。

示例：[`34_modern_es_features/07_promise_try_and_regexp_escape.js`](34_modern_es_features/07_promise_try_and_regexp_escape.js)

### RegExp v Flag（v 标志）

`v` 标志（规范里叫 `unicodeSets`）是 ES2024 对 `u` 标志的增强，核心是让字符类支持**集合运算**：并集 `/[\p{Letter}\p{Number}]/v`、交集 `/[[a-z]&&[^aeiou]]/v`、差集 `/[\p{Letter}--[aeiou]]/v`，还能用 `\q{...}` 做多字符字符串匹配。它补上了 `u` 标志无法表达的「字母里去掉元音」这类需求，也让语法高亮、模板引擎、字符白名单校验的正则从几十行缩到一行。关键细节：`u` 与 `v` **互斥**，同时写是语法错误；`v` 模式下字符类的转义规则更严格（例如 `[()]` 需要写成 `[\(\)]`），迁移时要测试。

也见 [RegExp.escape（正则字面量转义）](#regexpescape正则字面量转义)。

示例：[`34_modern_es_features/04_es2024_features.js`](34_modern_es_features/04_es2024_features.js)

### JSON.rawJSON（原样输出的 JSON 片段）

`JSON.rawJSON(text)` 包出一个**原样输出**的标记对象，`JSON.stringify` 遇到它会直接写入 `text` 而不再做转义或数值转换。它是为「超出 IEEE 754 双精度的大整数 / 高精度小数」准备的：`JSON.stringify({ id: 12345678901234567890n })` 会抛错（BigInt 不可序列化），而 `JSON.rawJSON('12345678901234567890')` 可以原样写进结果，服务端仍收到精确数值。关键细节：传给它的字符串必须是**合法 JSON 片段**否则抛 `SyntaxError`；它**只能用于序列化方向**——`JSON.parse` 读回来仍是普通数值并可能丢精度，配套的 `JSON.isRawJSON()` 用于判断一个值是不是这种标记对象。

也见 [Reviver source Parameter（reviver 的 source 参数）](#reviver-source-parameterreviver-的-source-参数)。

示例：[`21_json/09_raw_json_and_big_numbers.js`](21_json/09_raw_json_and_big_numbers.js)

### Reviver source Parameter（reviver 的 source 参数）

`JSON.parse` 的 reviver 函数过去只拿到 `(key, value)`，而 `value` 是**已经转换过的结果**，因此无法知道原文写的是 `1.0` 还是 `1`、`1e2` 还是 `100`。新的 `source` 参数（`JSON.parse(text, (key, value, source) => ...)`，ES2025）把**该值的原始 JSON 片段**一并传进来，让「需要原文的解析」成为可能：大整数保持字符串形式、日期格式严格校验、保留小数位写法。关键细节：`source` 是**原始文本**而非重新序列化的结果，数组与对象的 `source` 也在；reviver 的 `this` 仍是当前容器，返回 `undefined` 会删除该键。

也见 [JSON.rawJSON（原样输出的 JSON 片段）](#jsonrawjson原样输出的-json-片段)。

示例：[`21_json/10_parse_source_context.js`](21_json/10_parse_source_context.js)

### Explicit Resource Management（显式资源管理）

显式资源管理（ES2025）引入了 `using x = expr` 与 `await using x = expr` 两种声明，让资源在**离开块作用域时自动释放**，等价于 C# 的 `using` / Python 的 `with` / Java 的 try-with-resources。它把「打开—使用—关闭」从「必须记得写 `finally`」变成声明式，也顺带解决了多个资源时 `finally` 嵌套的问题：清理按**声明的逆序**执行。关键细节：`using` 是**声明不是表达式**，不能放在表达式位置；初始值必须有 `[Symbol.dispose]`（异步版需 `[Symbol.asyncDispose]`），否则在**初始化那一刻**就抛 `TypeError`；`using x = null/undefined` 合法，表示「无资源」。这套语法很新，打包工具的解析器与旧运行时可能直接报错，属于典型的**语法特性**兼容问题。

也见 [Symbol.dispose and Symbol.asyncDispose（资源释放协议符号）](#symboldispose-and-symbolasyncdispose资源释放协议符号)、[Syntax Feature vs API Feature（语法特性与 API 特性）](#syntax-feature-vs-api-feature语法特性与-api-特性)。

示例：[`34_modern_es_features/08_explicit_resource_management.js`](34_modern_es_features/08_explicit_resource_management.js)

### Symbol.dispose and Symbol.asyncDispose（资源释放协议符号）

这是显式资源管理协议的两个**内置 Symbol**：一个对象只要有 `[Symbol.dispose]()` 方法，就是「可被 `using` 管理」的；有 `[Symbol.asyncDispose]()` 则可被 `await using` 管理。它们是「鸭子类型 + 约定方法名」的规范化——不再需要各库自定义 `close()`/`destroy()`/`release()` 的名字。关键细节：如果对象**同时**有 `asyncDispose` 与 `dispose`，`await using` **优先用 `asyncDispose`**；`dispose()` 本身是**同步**的，内部要异步完成清理必须用 `await using`；`using` 声明里显式传入 `null`/`undefined` 是合法的「空资源」。**常见误解**：普通对象、数组、Promise 都没有 `[Symbol.dispose]`，直接 `using` 会立刻报错。

也见 [Explicit Resource Management（显式资源管理）](#explicit-resource-management显式资源管理)、[SuppressedError（抑制错误）](#aggregateerror-and-suppressederror聚合错误与抑制错误)。

示例：[`34_modern_es_features/08_explicit_resource_management.js`](34_modern_es_features/08_explicit_resource_management.js)

### Error.cause（错误原因链）

`new Error(msg, { cause })` 允许在抛出新错误时**保留底层错误对象**：`throw new Error('加载用户失败', { cause: originalError })`。它解决的是「层层包装导致原始错误被吃掉」——过去只能把堆栈塞进 `message` 字符串（污染文案、丢失结构），现在通过 `err.cause` 可以一路访问到根因。关键细节：`cause` 是**普通属性**，不参与 `Error` 的默认字符串化，`err.toString()` 不会显示它，调试时要主动打印或递归遍历；`cause` 可以是任何值（不限于 Error），做错误上报时应把它一并序列化上传。它与显式资源管理中的 `SuppressedError` 一起构成了「错误链」的两条路径：主动包装用 `cause`，自动清理失败用 `suppressed`。

也见 [AggregateError and SuppressedError（聚合错误与抑制错误）](#aggregateerror-and-suppressederror聚合错误与抑制错误)。

示例：[`34_modern_es_features/02_es2022_features.js`](34_modern_es_features/02_es2022_features.js)、[`20_error_handling/06_error_cause.js`](20_error_handling/06_error_cause.js)

### AggregateError and SuppressedError（聚合错误与抑制错误）

`AggregateError` 把**多个错误打包成一个**抛出，通过 `err.errors` 拿到数组，典型场景是 `Promise.any` 全部失败时把每一个失败原因都带上；`SuppressedError` 用于**清理期间发生的错误覆盖了原有错误**的场景——`using` 块在退出时 `dispose()` 抛错，而块内本来就有一个异常，于是新错误作为 `suppressed`、原错误通过 `cause` 关联，保证**原始错误不丢失**。关键细节：`AggregateError` 的 `message` 需要自己写清楚，`errors` 的顺序与提交顺序一致；`SuppressedError` 同样有 `error`（被抑制的）与 `suppressed` 两个属性，打印时容易漏掉其中一个。

也见 [Error.cause（错误原因链）](#errorcause错误原因链)、[Explicit Resource Management（显式资源管理）](#explicit-resource-management显式资源管理)。

示例：[`34_modern_es_features/08_explicit_resource_management.js`](34_modern_es_features/08_explicit_resource_management.js)、[`20_error_handling/07_aggregate_error.js`](20_error_handling/07_aggregate_error.js)

### Top-Level await（顶层 await）

顶层 await 允许在**模块顶层**直接写 `await`，让模块的求值本身变成异步的：`const config = await loadConfig()` 之后，所有 `import` 这个模块的模块都会**等待它完成**再继续。它替代了「包一层 async IIFE」或「导出一个 Promise 让调用方自己 await」的写法，让模块初始化（读配置、连数据库、动态 import）的依赖关系由模块系统自动串起来。关键细节：它**只在 ESM 模块里可用**（CJS 里是语法错误）；会阻塞依赖它的模块图，用多了会让应用启动变慢甚至产生**循环依赖死锁**（A 等 B、B 等 A）；本仓库 `package.json` 设了 `type: module`，因此 `.js` 文件天然可用。

也见 [ES Release Year（ES 年度版本）](#es-release-yeares-年度版本)、[Explicit Resource Management（显式资源管理）](#explicit-resource-management显式资源管理)。

示例：[`34_modern_es_features/02_es2022_features.js`](34_modern_es_features/02_es2022_features.js)、[`19_modules/08_module_scope.js`](19_modules/08_module_scope.js)

### structuredClone（结构化克隆）

`structuredClone(value)` 是**内置的深拷贝**，支持循环引用、`Map`、`Set`、`Date`、`RegExp`、`ArrayBuffer`、`Blob` 等结构化可克隆类型，并且会正确复制嵌套结构而非共享引用。它取代了 `JSON.parse(JSON.stringify(x))` 这种漏洞百出的写法——后者会丢 `undefined`、把 `Date` 变成字符串、遇到循环引用直接抛错、无法处理 `Map`/`Set`。关键细节：它**不能克隆函数、类实例的方法、DOM 节点、`Symbol` 属性、`WeakMap`**，遇到会抛 `DataCloneError`；原型链上的自定义类会退化成普通对象（`instanceof` 失效），需要保留类型时应自己实现拷贝方法。

也见 [Lazy Evaluation（惰性求值）](#lazy-evaluation惰性求值)。

示例：[`09_objects/12_deep_clone.js`](09_objects/12_deep_clone.js)、[`03_data_types/11_mutable_vs_immutable.js`](03_data_types/11_mutable_vs_immutable.js)

### isWellFormed and toWellFormed（良构字符串与孤立代理项）

JavaScript 字符串是 UTF-16 码元序列，可能出现**孤立代理项**（lone surrogate）——只写了代理对的一半（如 `'\uD800'`），这种字符串**不是合法的 Unicode 文本**，在 `encodeURIComponent`、写入文件、发给服务端时可能抛错或产生乱码。ES2024 补上两个方法：`str.isWellFormed()` 检测是否良构，`str.toWellFormed()` 把孤立代理项替换成 `U+FFFD`（替换字符）从而修复。关键细节：`'abc'.length` 之类的长度统计不受影响，但**跨语言边界**（写文件、HTTP 传输、`TextEncoder`）时非法序列的行为是实现相关的，所以来自外部（用户输入、截断的 JSON）的字符串在传出前应做一次 `toWellFormed()`。**常见误解**：以为「截断字符串不会出问题」——按码元截断恰恰最容易切出孤立代理项。

也见 [Grapheme Cluster（字素簇）](#grapheme-cluster字素簇)。

示例：[`34_modern_es_features/04_es2024_features.js`](34_modern_es_features/04_es2024_features.js)

### Code Point and Code Unit（码点与码元）

补一个常与本册多个术语纠缠的基础概念：**码元**（code unit）是 UTF-16 的最小单位（16 位），`'a'.length` 数的是码元；**码点**（code point）是 Unicode 的字符编号，超出 `U+FFFF` 的字符（如 emoji）需要**两个码元**（代理对）表示，所以 `'😀'.length === 2` 而 `[...'😀'].length === 1`；**字素簇**则是用户感知的一个字符，还可能由多个码点组合。三者的关系是「码元 ≥ 码点 ≥ 字素簇」，`.length`、`[...str]`、`Intl.Segmenter` 分别对应这三层，做计数与截断前先想清楚要用哪一层。

也见 [Grapheme Cluster（字素簇）](#grapheme-cluster字素簇)、[Word Boundary（词边界）](#word-boundary词边界)。

示例：[`33_intl/05_intl_segmenter.js`](33_intl/05_intl_segmenter.js)

## Web 加密（Web Crypto API）

### Cryptography（密码学）

密码学是研究「在不安全信道上安全通信」的学科，落到工程上主要是四件事：**保密性**（加密，别人看不懂）、**完整性**（哈希/认证码，内容被改能发现）、**真实性**（签名/MAC，确认是谁发的）、**不可否认性**（只有你能生成、但任何人都能验证的签名）。关键细节：工程中用密码学最常见的错误不是「算法选得不够强」，而是**用错了类别**——拿哈希当加密存口令、拿编码当加密传输数据、拿签名当加密保护内容。牢记一条铁律：**不要自己发明协议，也不要用非标准库**，能用 `crypto.subtle` 就用它。

也见 [Encoding, Encryption and Hashing（编码、加密与哈希）](#encoding-encryption-and-hashing编码加密与哈希)。

示例：[`35_web_crypto/01_crypto_overview.js`](35_web_crypto/01_crypto_overview.js)

### Web Crypto API（Web 加密 API）

Web Crypto API 是浏览器与 Node（`globalThis.crypto`）共有的**标准加密接口**，分两层：`crypto.getRandomValues()` 提供同步的安全随机数，`crypto.subtle` 提供摘要、签名、加解密、密钥派生等异步能力。它相对第三方库的核心优势是**由运行时实现**：不增加包体积、密钥不经过 JS 层（可标记为不可导出）、常量时间比较由底层保证。关键细节：所有 `subtle` 方法都返回 Promise 且**只在安全上下文可用**（HTTPS 或 localhost），`file://` 页面与普通 HTTP 页面上 `crypto.subtle` 是 `undefined`；Node 侧另有 `node:crypto` 模块，两者算法互操作但 API 风格不同。

也见 [SubtleCrypto（crypto.subtle）](#subtlecryptocryptosubtle)、[Randomness（随机数）](#randomness随机数)。

示例：[`35_web_crypto/01_crypto_overview.js`](35_web_crypto/01_crypto_overview.js)

### SubtleCrypto（crypto.subtle）

`crypto.subtle` 是 Web Crypto 的**异步加密接口对象**（名字里的 subtle 取自「subtle algorithm」，暗示用错会静默失效），提供 `digest`、`sign`/`verify`、`encrypt`/`decrypt`、`deriveBits`/`deriveKey`、`generateKey`/`importKey`/`exportKey` 等方法。它与大多数 JS API 的最大不同是：**参数不是字符串而是算法对象与 `CryptoKey` 对象**，且所有方法都是 Promise。关键细节：`CryptoKey` 是**不可直接读出字节**的句柄，需要 `exportKey` 才能取出；`extractable: false` 可以防止密钥被导出到 JS 层，这是它比「字符串密钥」更安全的地方。

也见 [Key（密钥）](#key密钥)、[Key Format（密钥格式）](#key-format密钥格式)。

示例：[`35_web_crypto/01_crypto_overview.js`](35_web_crypto/01_crypto_overview.js)

### Randomness（随机数）

密码学里「随机」有三档质量：**可预测的伪随机**（`Math.random()`，种子可反推，绝不可用于安全场景）、**密码学安全伪随机**（CSPRNG，`crypto.getRandomValues`）、**真随机**（硬件熵源，最终仍由 CSPRNG 输出）。关键细节：`Math.random()` 的**任何**安全用途都是漏洞——用它生成令牌、盐值、IV、会话 ID、邀请码都会导致可预测或碰撞，而这类 bug 上线后极难发现，因为功能「看起来是好的」。判断标准很简单：只要这个随机值和「谁能访问什么」有关，就必须用 `crypto.getRandomValues`。

也见 [CSPRNG（密码学安全伪随机数生成器）](#csprng密码学安全伪随机数生成器)、[getRandomValues（安全随机数填充）](#getrandomvalues安全随机数填充)。

示例：[`35_web_crypto/01_crypto_overview.js`](35_web_crypto/01_crypto_overview.js)

### CSPRNG（密码学安全伪随机数生成器）

CSPRNG（Cryptographically Secure Pseudo-Random Number Generator）是「输出不可预测」的伪随机数生成器：即使攻击者知道全部历史输出，也无法推算下一个输出。它由操作系统熵源播种（Linux 的 `getrandom`、Windows 的 `BCryptGenRandom`），并由运行时包装成 `crypto.getRandomValues`。关键细节：CSPRNG 的**代价是慢**（相比 `Math.random()` 有数量级差距），所以热路径上应一次取够（如一次性填充一个 `Uint8Array`）而不是循环调用；它**不是**用来做统计模拟或游戏动画的，那些场景用 `Math.random()` 就够了。

也见 [Randomness（随机数）](#randomness随机数)。

示例：[`35_web_crypto/01_crypto_overview.js`](35_web_crypto/01_crypto_overview.js)

### getRandomValues（安全随机数填充）

`crypto.getRandomValues(typedArray)` 把随机字节**原地填进**传入的整数 TypedArray（`Uint8Array`、`Uint32Array` 等），返回同一个数组。它同时担当「CSPRNG 入口」与「通用随机字节来源」两个角色，是生成盐、IV、令牌、密钥材料的标准手段。关键细节：它是**同步**的，但**有配额限制**（每次调用最多 65536 字节，超出抛 `QuotaExceededError`）；它只接受整数 TypedArray，传普通数组或 `Float64Array` 会抛 `TypeError`；它**不能**直接生成任意范围的整数——需要 `[0, n)` 的随机数时要自己做拒绝采样，直接 `% n` 会引入取模偏差。

也见 [CSPRNG（密码学安全伪随机数生成器）](#csprng密码学安全伪随机数生成器)、[Initialization Vector（初始化向量）](#initialization-vector初始化向量)。

示例：[`35_web_crypto/01_crypto_overview.js`](35_web_crypto/01_crypto_overview.js)

### Hash and Digest（哈希与摘要）

哈希（散列）把任意长度的输入映射成固定长度的**摘要**（digest），且满足：同一输入必得同一输出、不同输入极难得到同一输出（抗碰撞）、从摘要无法反推输入（单向）。它**不加密、不保密**——任何人都能对同一份数据算出同样的摘要，所以哈希提供的是**完整性**而不是**机密性**。关键细节：密码学哈希（SHA-2 系列）与「非密码学哈希」（如 Java 的 `hashCode`、某些字符串散列）完全不同，后者可以被轻易构造碰撞，**绝不能**用于安全目的；摘要长度与抗碰撞强度也不是线性关系（SHA-256 的碰撞强度约为 2^128）。

也见 [Encoding, Encryption and Hashing（编码、加密与哈希）](#encoding-encryption-and-hashing编码加密与哈希)、[Avalanche Effect（雪崩效应）](#avalanche-effect雪崩效应)、[MAC（消息认证码）](#mac消息认证码)。

示例：[`35_web_crypto/02_digest_hashing.js`](35_web_crypto/02_digest_hashing.js)

### SHA-256（SHA-256 摘要算法）

SHA-256 是 SHA-2 家族中最常用的摘要算法，输出 256 位（32 字节）摘要，写法是 `crypto.subtle.digest('SHA-256', data)`。它是文件校验、内容寻址（如 Git 的对象名）、口令存储的盐值哈希、JWT 的 `HS256` 签名等场景的默认选择，与 SHA-384/512（更长摘要）并列。关键细节：`digest` 接收 `BufferSource`（`ArrayBuffer`、`Uint8Array` 等），返回的是 `ArrayBuffer`，要比较时**必须先转成十六进制或 Base64 再比**（直接比较两个 ArrayBuffer 对象永远不相等）；一次性摘要要求数据全在内存，大文件应分块计算。

也见 [Hash and Digest（哈希与摘要）](#hash-and-digest哈希与摘要)。

示例：[`35_web_crypto/02_digest_hashing.js`](35_web_crypto/02_digest_hashing.js)

### Avalanche Effect（雪崩效应）

雪崩效应是密码学哈希与分组密码的理想性质：**输入的微小变化（翻转一位）会让输出发生约一半比特的变化**，且无法从中反推「哪里变了」。它让「靠局部猜测逐位逼近输入」的攻击不可行——这正是「哈希值不能用来做模糊匹配」的原因：`'password'` 与 `'password1'` 的摘要毫无相似性。关键细节：雪崩效应也是**判断一个哈希实现是否靠谱**的快速试金石（改一位看输出是否大面积变化），但通过这个测试并不等于安全，仍应使用标准算法而不是自创的混合哈希。

也见 [Hash and Digest（哈希与摘要）](#hash-and-digest哈希与摘要)。

示例：[`35_web_crypto/02_digest_hashing.js`](35_web_crypto/02_digest_hashing.js)

### One-way Function（单向性与不可逆性）

不可逆性指「从摘要反推原文在计算上不可行」，这是哈希与加密的**根本区别**：加密是可逆的（有密钥就能还原），哈希是单向的（没有「反哈希」这回事，只能穷举）。因此「解密 MD5」是错误说法——那些「MD5 解密」网站其实是在比对预先算好的字典表。关键细节：不可逆不等于「不可破解」——弱口令（`123456`）的摘要可以直接查表得到，这就是**彩虹表**攻击，防御手段是**加盐**；同理，哈希值本身也不该被当作「加密后的敏感数据」写进日志或直接当主键用。

也见 [Rainbow Table（彩虹表）](#rainbow-table彩虹表)、[Salt（盐值）](#salt盐值)、[Hash and Digest（哈希与摘要）](#hash-and-digest哈希与摘要)。

示例：[`35_web_crypto/02_digest_hashing.js`](35_web_crypto/02_digest_hashing.js)

### Rainbow Table（彩虹表）

彩虹表是**预先算好的「哈希值 → 明文」查找表**（用时间换空间的链式压缩技巧），用来破解未加盐的弱口令：攻击者拿到一列 `MD5(password)` 就能直接反查出几十万个常见口令。它的存在说明「口令的裸哈希等于明文」——很多系统在库被拖走后才意识到这一点。关键细节：防御手段有两层且效果叠加——**加盐**（同一口令在不同用户处产生不同哈希，彩虹表失效）与**慢哈希**（用 PBKDF2 / bcrypt / Argon2 让每次计算都很贵，使穷举成本不可承受）；只加盐而不加迭代次数，仍挡不住针对特定盐的定向穷举。

也见 [Salt（盐值）](#salt盐值)、[PBKDF2（基于口令的密钥派生函数）](#pbkdf2基于口令的密钥派生函数)。

示例：[`35_web_crypto/05_key_derivation_pbkdf2.js`](35_web_crypto/05_key_derivation_pbkdf2.js)

### Salt（盐值）

盐是**每个用户或每次操作都不同的一段随机数据**，与输入一起参与哈希，使相同输入产生不同摘要：`hash(salt + password)`。它不需要保密（通常与摘要一起存库，或随密文一起传输），作用只是**破坏「预先算好的表」**，让彩虹表与批量比对失效。关键细节：盐必须**随机且足够长**（推荐 16 字节以上，用 `crypto.getRandomValues` 生成），绝不能是用户名、时间戳这类可预测值；在口令存储场景下**盐不能替代慢哈希**——盐挡住了查表，却挡不住针对单个用户的暴力穷举，两者必须同时上。

也见 [Rainbow Table（彩虹表）](#rainbow-table彩虹表)、[PBKDF2（基于口令的密钥派生函数）](#pbkdf2基于口令的密钥派生函数)。

示例：[`35_web_crypto/05_key_derivation_pbkdf2.js`](35_web_crypto/05_key_derivation_pbkdf2.js)

### HMAC（基于哈希的消息认证码）

HMAC（Hash-based Message Authentication Code）是「用哈希 + 密钥」计算出的**消息认证码**，写作 `HMAC(key, message)`，用于同时验证消息的**完整性**与**来源**（只有持同一密钥的人能算出同样的值）。典型用途是 Webhook 签名校验、API 请求签名、JWT 的 `HS256`。关键细节：HMAC **不是加密**，消息本身是明文可见的（要保密还得再加密）；它的安全性依赖**密钥保密**而非算法保密；验证时**必须用常量时间比较**，用 `===` 逐字节比较会泄露信息从而被逐位猜测。**常见误解**：把 `sha256(secret + message)` 当作 HMAC——这种「前缀拼接」构造存在长度扩展攻击，必须使用标准 HMAC。

也见 [MAC（消息认证码）](#mac消息认证码)、[Digital Signature and Verification（数字签名与签名验证）](#digital-signature-and-verification数字签名与签名验证)、[Timing-safe Comparison（常量时间比较）](#timing-safe-comparison常量时间比较)。

示例：[`35_web_crypto/03_hmac_signing.js`](35_web_crypto/03_hmac_signing.js)

### MAC（消息认证码）

MAC（Message Authentication Code）是「带密钥的完整性校验值」这一**类**技术的统称，HMAC 是基于哈希的实现，CMAC 是基于分组密码的实现。它解决的问题是：只用哈希的话任何人都能重算摘要并篡改内容；加上共享密钥后，**没有密钥就无法伪造出正确的校验值**。关键细节：MAC 使用**对称密钥**，因此**发送方与接收方必须共享同一个密钥**——这也决定了它无法提供「不可否认性」（接收方自己也能造出 MAC），需要不可否认性时必须改用非对称的**数字签名**。**常见误解**：把 MAC 当成签名——两者验证动作相似，但信任模型完全不同。

也见 [HMAC（基于哈希的消息认证码）](#hmac基于哈希的消息认证码)、[Digital Signature and Verification（数字签名与签名验证）](#digital-signature-and-verification数字签名与签名验证)。

示例：[`35_web_crypto/03_hmac_signing.js`](35_web_crypto/03_hmac_signing.js)

### Key（密钥）

密钥是加解密与签名中**唯一需要保密**的那份数据，安全界有一句话：「算法是公开的，安全性全在密钥上」（柯克霍夫原则）。在 Web Crypto 里密钥被抽象成 `CryptoKey` 对象，带有 `algorithm`、`usages`（能做什么，如 `['sign','verify']`）与 `extractable`（能否导出）三个关键元信息。关键细节：`usages` 是**强约束**——用只授权了 `encrypt` 的密钥去 `decrypt` 会直接抛错，这能防止密钥被挪作他用；`extractable: false` 的密钥无法被 `exportKey` 取出明文，适合放在不可信的前端环境。**常见误解**：以为「密钥越长越安全」——用错算法、或用 `Math.random()` 生成密钥，再长也不安全。

也见 [Key Format（密钥格式）](#key-format密钥格式)、[Symmetric Encryption（对称加密）](#symmetric-encryption对称加密)、[Asymmetric Encryption（非对称加密）](#asymmetric-encryption非对称加密)。

示例：[`35_web_crypto/01_crypto_overview.js`](35_web_crypto/01_crypto_overview.js)、[`35_web_crypto/06_ecdsa_keypair.js`](35_web_crypto/06_ecdsa_keypair.js)

### Symmetric Encryption（对称加密）

对称加密指**加密与解密用同一把密钥**（如 AES），优点是快（可加密大流量数据），缺点是「怎么把密钥安全地给对方」——密钥分发本身成了难题。工程上的常见解法是**混合加密**：用非对称加密（或密钥协商）传一把临时对称密钥，再用它加密实际数据（TLS 就是这么做的）。关键细节：对称加密只提供**机密性，不提供完整性**——密文被翻转一位，解密出来就是垃圾数据而不会报错，所以实际使用时要选认证加密模式（AES-GCM）或额外加 MAC。**常见误解**：以为「加密了就安全」——ECB 模式下相同明文块产生相同密文块，能直接看出图片轮廓，属于不该使用的模式。

也见 [AES（高级加密标准）](#aes高级加密标准)、[Asymmetric Encryption（非对称加密）](#asymmetric-encryption非对称加密)、[AEAD（带关联数据的认证加密）](#aead带关联数据的认证加密)。

示例：[`35_web_crypto/04_aes_gcm_encryption.js`](35_web_crypto/04_aes_gcm_encryption.js)

### Asymmetric Encryption（非对称加密）

非对称加密使用**一对数学上关联的密钥**：公钥可公开，私钥必须保密；用公钥加密的只有私钥能解，用私钥签名的只有公钥能验。它解决了对称加密的密钥分发问题，代价是**慢几个数量级**，所以几乎从不用于加密大量数据。关键细节：非对称密钥的用途是**分离的**——同一对密钥通常只用于「加密」或只用于「签名」其中之一，混用会带来安全风险；Web Crypto 里生成密钥对用 `generateKey`，且必须显式声明 `usages` 与 `namedCurve` 等参数。

也见 [Public and Private Key（公钥与私钥）](#public-and-private-key公钥与私钥)、[Digital Signature and Verification（数字签名与签名验证）](#digital-signature-and-verification数字签名与签名验证)。

示例：[`35_web_crypto/06_ecdsa_keypair.js`](35_web_crypto/06_ecdsa_keypair.js)

### Public and Private Key（公钥与私钥）

密钥对里的两半：**公钥**可自由分发（放服务器、写进前端、放进证书），**私钥**只应存在于生成它的那一方且永不外传（服务端私钥泄露等于身份被完全冒充）。它们的对应关系决定了核心性质：公钥能验证私钥的签名，但**无法**从公钥推算出私钥。关键细节：在浏览器里生成密钥对可以把私钥留在用户设备上（WebAuthn、端到端加密），而服务端签发 JWT 时**只把公钥给验证方**（JWKS 端点），私钥永远不下发。**常见误解**：以为「前端不能放密钥」就等于「前端不能有公钥」——公钥本来就是设计成公开的。

也见 [Asymmetric Encryption（非对称加密）](#asymmetric-encryption非对称加密)、[ECDSA（椭圆曲线数字签名算法）](#ecdsa椭圆曲线数字签名算法)。

示例：[`35_web_crypto/06_ecdsa_keypair.js`](35_web_crypto/06_ecdsa_keypair.js)

### AES（高级加密标准）

AES（Advanced Encryption Standard）是当今使用最广的对称分组密码，分组长度固定 128 位，密钥长度可选 128/192/256 位，在 Web Crypto 里写作 `{ name: 'AES-GCM', length: 256 }`。它是「行业默认答案」——选它不需要理由，不选它才需要。关键细节：AES 本身只定义了「怎么把一块 128 位数据搅乱」，多块数据怎么连起来由**工作模式**决定（GCM、CBC、CTR…），模式选错比密钥长度不足更致命；128 位密钥在可预见的未来已足够，256 位主要是应对将来的量子计算与合规要求。

也见 [AES-GCM（AES-GCM 认证加密）](#aes-gcmaes-gcm-认证加密)、[CBC Mode（CBC 密码块链接模式）](#cbc-modecbc-密码块链接模式)。

示例：[`35_web_crypto/04_aes_gcm_encryption.js`](35_web_crypto/04_aes_gcm_encryption.js)

### AES-GCM（AES-GCM 认证加密）

AES-GCM 是 AES 的 **Galois/Counter Mode**，属于认证加密（AEAD）：一次调用同时产出**密文与认证标签**，解密时如果密文或附加数据被改动过，`decrypt` 会**抛错**而不是返回垃圾数据。它因此成为 Web 上的推荐默认模式，`crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData }, key, data)` 一行搞定加密加完整性校验。关键细节：GCM **绝对不能复用 IV**（同一密钥下重复 IV 会直接泄露密钥流乃至认证密钥），IV 推荐 12 字节并用 `crypto.getRandomValues` 生成；`additionalData` 用于认证「不加密但要防篡改」的元数据（如消息类型、用户 ID）。**常见误解**：以为 GCM 能防重放——它只保证内容没被改，攻击者原样重放整段密文仍然有效，防重放要自己加序号或时间戳。

也见 [Authentication Tag（认证标签）](#authentication-tag认证标签)、[AEAD（带关联数据的认证加密）](#aead带关联数据的认证加密)、[Initialization Vector（初始化向量）](#initialization-vector初始化向量)。

示例：[`35_web_crypto/04_aes_gcm_encryption.js`](35_web_crypto/04_aes_gcm_encryption.js)

### CBC Mode（CBC 密码块链接模式）

CBC（Cipher Block Chaining）是 AES 的一种传统工作模式：每个明文块先与前一个密文块**异或**再加密，因此需要 IV，且相同明文块会产生不同密文块。它本身**不提供完整性**——攻击者可以通过翻转密文比特来可控地翻转解密结果的对应比特（比特翻转攻击），因此使用 CBC 时必须额外加 MAC，且**验证顺序必须是「先验 MAC 再解密」**。关键细节：CBC 无法并行加密、需要填充（PKCS#7），而填充机制又引出 padding oracle 攻击；因此新项目应直接选 AES-GCM，只有需要与遗留系统互通时才用 CBC。

也见 [AES-GCM（AES-GCM 认证加密）](#aes-gcmaes-gcm-认证加密)。

示例：[`35_web_crypto/04_aes_gcm_encryption.js`](35_web_crypto/04_aes_gcm_encryption.js)

### Initialization Vector（初始化向量）

初始化向量（IV，在计数器类模式里也叫 nonce）是每次加密都要**重新生成**的一段随机数据，与密钥一起参与运算，保证「同一密钥加密同一明文两次」得到不同密文。关键细节：IV **不需要保密**（通常与密文一起传输），但**绝对不能在同一密钥下重复使用**；推荐长度 12 字节（GCM 的标准长度）、用 `crypto.getRandomValues` 生成。**IV 复用攻击**是最致命的一类密码学误用：GCM 里同一 (key, IV) 出现两次，攻击者可异或两段密文抵消密钥流、直接恢复明文，并可伪造认证标签——这正是「不要用固定 IV、不要手工拼计数器 IV」的原因。

也见 [AES-GCM（AES-GCM 认证加密）](#aes-gcmaes-gcm-认证加密)、[Salt（盐值）](#salt盐值)。

示例：[`35_web_crypto/04_aes_gcm_encryption.js`](35_web_crypto/04_aes_gcm_encryption.js)

### Authentication Tag（认证标签）

认证标签是认证加密模式在加密时额外产出的**短校验值**（GCM 默认 16 字节），它由密钥与密文共同决定，只有持密钥的人才能验证。解密时 `crypto.subtle.decrypt` 会自动核对标签，不匹配就抛错——这就是「篡改可被检测」的实现方式。关键细节：标签**不是签名**（不提供不可否认性，因为双方都知道密钥）；标签长度可以截短以省空间，但截得越短伪造成功率越高（一般不要低于 12 字节）；标签必须与密文**一起传输**，丢了标签就无法解密。

也见 [AEAD（带关联数据的认证加密）](#aead带关联数据的认证加密)、[MAC（消息认证码）](#mac消息认证码)。

示例：[`35_web_crypto/04_aes_gcm_encryption.js`](35_web_crypto/04_aes_gcm_encryption.js)

### AEAD（带关联数据的认证加密）

AEAD（Authenticated Encryption with Associated Data）是一类**同时保证机密性与完整性**的加密模式统称，AES-GCM 与 ChaCha20-Poly1305 是代表。它把输入分成两部分：需要**既保密又完整**的明文，和只需要**完整**（不加密但要防篡改）的关联数据（AAD），后者用于绑定协议头、用户 ID、序号这类元数据——改动任何一个字节都会导致解密失败。关键细节：AEAD 让你不再需要「加密后自己拼 HMAC」这种容易出错的手工组合（顺序搞反、只验部分数据都是常见漏洞），所以**新代码一律用 AEAD**；但 AEAD 不防重放、也不解决密钥分发，这两件事仍需上层协议处理。

也见 [AES-GCM（AES-GCM 认证加密）](#aes-gcmaes-gcm-认证加密)、[Authentication Tag（认证标签）](#authentication-tag认证标签)。

示例：[`35_web_crypto/04_aes_gcm_encryption.js`](35_web_crypto/04_aes_gcm_encryption.js)

### Key Derivation Function（密钥派生函数）

密钥派生函数（KDF）从「较弱的输入材料」（口令、共享秘密）**确定性地派生出可以当密钥用的比特串**，并刻意让每次计算都变慢，以此抵抗暴力穷举。常见 KDF 有 PBKDF2（基于迭代哈希）、bcrypt/scrypt（额外消耗内存）、HKDF（从已有的高熵秘密派生多个密钥）、Argon2（抗 GPU）。关键细节：**口令绝不能直接当密钥用**——用户口令熵极低（往往不到 40 位），而 AES 密钥是 128/256 位的均匀随机串，直接拿来当密钥等于把密钥空间缩小到字典大小。KDF 输出的才是「看起来随机的固定长度密钥」。

也见 [PBKDF2（基于口令的密钥派生函数）](#pbkdf2基于口令的密钥派生函数)、[Iteration Count（迭代次数）](#iteration-count迭代次数)。

示例：[`35_web_crypto/05_key_derivation_pbkdf2.js`](35_web_crypto/05_key_derivation_pbkdf2.js)

### PBKDF2（基于口令的密钥派生函数）

PBKDF2（Password-Based Key Derivation Function 2）是最普及的口令派生算法：把「口令 + 盐」反复做 HMAC 若干轮，得到固定长度的密钥比特，在 Web Crypto 里由 `deriveBits` / `deriveKey` 暴露，参数是 `{ name: 'PBKDF2', salt, iterations, hash: 'SHA-256' }`。关键细节：**盐与迭代次数必须一起存储**（否则无法重现派生结果）；相同的（口令、盐、迭代次数、哈希算法）必然得到相同的密钥，这正是可以校验口令的原因；PBKDF2 只消耗 CPU 不消耗内存，因此对 GPU/ASIC 攻击的抵抗力弱于 Argon2，但在 Web Crypto 可用的算法里它是标准选择。

也见 [Salt（盐值）](#salt盐值)、[Iteration Count（迭代次数）](#iteration-count迭代次数)、[Key Derivation Function（密钥派生函数）](#key-derivation-function密钥派生函数)。

示例：[`35_web_crypto/05_key_derivation_pbkdf2.js`](35_web_crypto/05_key_derivation_pbkdf2.js)

### Iteration Count（迭代次数）

迭代次数是 PBKDF2 里「把哈希运算重复多少轮」的参数，它直接决定破解成本：迭代 10 万次意味着攻击者每试一个口令都要付出 10 万次哈希的代价。选值的依据是**性能预算**而不是固定数字——常见做法是调参到「服务端校验一次约 100ms」，或参考 OWASP 的当前推荐值；硬件每年都在变快，所以这个值需要随年份上调。关键细节：迭代次数**不是密钥的一部分，但必须与盐一起存储并参与重算**，改了它旧口令就验不过；对用户体验的影响在于校验延迟，所以登录接口要做限流，而不是靠把迭代次数堆到几秒来防爆破。

也见 [PBKDF2（基于口令的密钥派生函数）](#pbkdf2基于口令的密钥派生函数)。

示例：[`35_web_crypto/05_key_derivation_pbkdf2.js`](35_web_crypto/05_key_derivation_pbkdf2.js)

### ECDSA（椭圆曲线数字签名算法）

ECDSA（Elliptic Curve Digital Signature Algorithm）是基于椭圆曲线的数字签名算法，Web Crypto 里用 `{ name: 'ECDSA', namedCurve: 'P-256' }` 声明，密钥短（256 位即可提供约 128 位安全强度）而签名快，是 TLS 证书、JWT 的 `ES256`、代码签名的常见选择。关键细节：`generateKey` 时**必须传入 `['sign','verify']` 作为 usages**（ECDSA 密钥不能用于加密）；签名结果在 Web Crypto 里是 IEEE P1363 格式的定长 `r||s`，与其他库常见的 DER 编码不同，跨系统互验时需要转换——这是「本地验得过、对方的 JWT 库验不过」的典型原因；签名是**随机化**的，同一消息两次签名结果不同，属于正常现象。

也见 [Digital Signature and Verification（数字签名与签名验证）](#digital-signature-and-verification数字签名与签名验证)、[Public and Private Key（公钥与私钥）](#public-and-private-key公钥与私钥)。

示例：[`35_web_crypto/06_ecdsa_keypair.js`](35_web_crypto/06_ecdsa_keypair.js)

### Digital Signature and Verification（数字签名与签名验证）

数字签名是**用私钥对消息签名、任何人用公钥验证**的机制，提供完整性、真实性与不可否认性（签名者事后无法抵赖，因为只有他持有私钥）。它比 MAC 更强的地方正在于**不需要共享密钥**：验证者只拿到公钥，因此无法伪造签名。关键细节：签名**不加密消息**（消息仍是明文，要保密需另行加密，常见做法是先签名后加密或反过来）；验证方必须用**完全相同的字节**去验（多一个空格、序列化字段顺序不同都会失败），所以跨语言互验时要约定规范化方式（如 JWT 的 base64url 规则）；工程上要**先验签再解析内容**，绝不能反过来。

也见 [HMAC（基于哈希的消息认证码）](#hmac基于哈希的消息认证码)、[ECDSA（椭圆曲线数字签名算法）](#ecdsa椭圆曲线数字签名算法)。

示例：[`35_web_crypto/06_ecdsa_keypair.js`](35_web_crypto/06_ecdsa_keypair.js)

### Key Format（密钥格式）

同一把密钥可以有不同的**表示格式**，Web Crypto 的 `importKey`/`exportKey` 用 `format` 参数区分，跨系统交互时格式写错是最高频的踩坑点：`raw`（裸密钥字节，仅对称密钥与公钥可用）、`pkcs8`（私钥的标准容器）、`spki`（公钥的标准容器，即 SubjectPublicKeyInfo）、`jwk`（JSON 形式，字段化，便于嵌入 JSON 文档，但**包含私钥字段时就是明文私钥**，不要外传）、`PEM`（Base64 + 头尾标记的文本形式，通常需要在 PKCS#8/SPKI 与 PEM 之间自行转换）。关键细节：`raw` 导出的 ECDSA 公钥同样遵循 P1363 定长格式，与 DER 编码不同；导出公钥用于发布、导出私钥用于备份，两者用途不同，代码里要写清楚以免误传。

也见 [Key（密钥）](#key密钥)、[ECDSA（椭圆曲线数字签名算法）](#ecdsa椭圆曲线数字签名算法)。

示例：[`35_web_crypto/06_ecdsa_keypair.js`](35_web_crypto/06_ecdsa_keypair.js)

### Timing-safe Comparison（常量时间比较）

常量时间比较指**比较耗时与「匹配了多少字节」无关**的比较方式：普通字符串比较（`===`、`Buffer.equals`）会在第一个不同的字节处提前返回，攻击者通过反复请求并测量耗时，就能**逐字节猜出** HMAC 或令牌的正确值（时序攻击）。正确做法是用 `crypto.timingSafeEqual`（Node）或自行对全部字节做累积异或后统一判断。关键细节：**长度不等时也要小心处理**——`timingSafeEqual` 在长度不等时直接抛错，会泄露长度信息，通常做法是先比较长度再比较内容，或把长度也纳入累积计算；这类漏洞不产生任何错误日志，只能靠代码审计发现。

也见 [HMAC（基于哈希的消息认证码）](#hmac基于哈希的消息认证码)。

示例：[`35_web_crypto/03_hmac_signing.js`](35_web_crypto/03_hmac_signing.js)

### Encoding, Encryption and Hashing（编码、加密与哈希）

三者最容易被混为一谈，但目的完全不同：**编码**（Base64、URL 编码、UTF-8）是「换一种表示形式」，**无密钥、可逆、不提供任何安全性**，只是为了让数据能安全地放进文本协议；**加密**是「用密钥隐藏内容」，**可逆，保密性是目的**；**哈希**是「生成固定长度指纹」，**不可逆，完整性是目的**。判断一个操作属于哪一类，只需问两个问题：需要密钥吗？能还原吗？Base64 两个答案分别是「否」和「是」，所以它**绝对不是加密**——把 Base64 当成加密来保护敏感数据是典型的安全事故。

也见 [Hash and Digest（哈希与摘要）](#hash-and-digest哈希与摘要)、[One-way Function（单向性与不可逆性）](#one-way-function单向性与不可逆性)、[Symmetric Encryption（对称加密）](#symmetric-encryption对称加密)。

示例：[`35_web_crypto/01_crypto_overview.js`](35_web_crypto/01_crypto_overview.js)、[`35_web_crypto/02_digest_hashing.js`](35_web_crypto/02_digest_hashing.js)

## 实时通信与流（WebSocket / SSE / Streams）

### WebSocket（WebSocket 协议）

WebSocket 是浏览器与服务器之间的**持久双向通信协议**（`ws:`/`wss:`），一次连接建立后双方可以随时互发消息，不再受 HTTP「请求—响应」模型的限制。它的 API 很简洁：`const ws = new WebSocket(url)`，之后监听 `open`、`message`、`error`、`close` 四个事件，用 `send()` 发送。关键细节：它**没有内置的自动重连**（连接断了要自己重建，且要配合退避策略），也**没有内置的分组/房间概念**（广播、房间都是应用层协议自己定义的）；消息是**按消息边界投递**的（不像 TCP 是字节流），但 `send()` 不会等待对端收到，所以业务层仍需自己做 ACK 与幂等。

也见 [Handshake（握手）](#handshake握手)、[Server-Sent Events（服务器发送事件，SSE）](#server-sent-events服务器发送事件sse)、[Heartbeat（心跳保活）](#heartbeat心跳保活)。

示例：[`36_realtime_and_streams/01_websocket_basics.js`](36_realtime_and_streams/01_websocket_basics.js)、[`36_realtime_and_streams/02_websocket_broadcast.js`](36_realtime_and_streams/02_websocket_broadcast.js)

### Handshake（握手）

WebSocket 的握手复用了 **HTTP 的第一次请求**：客户端发一个带 `Upgrade: websocket`、`Connection: Upgrade`、`Sec-WebSocket-Key`（随机 Base64）的 GET 请求，服务端回 `101 Switching Protocols` 并附上由 Key 与固定 GUID 拼出 SHA-1 摘要的 `Sec-WebSocket-Accept`，之后这条 TCP 连接就脱离 HTTP 语义，开始传 WebSocket 帧。关键细节：正因为握手是 HTTP，所以**能复用 HTTP 的认证与路由**（Cookie、`Authorization`、路径参数、反向代理规则都能用），这也是它比裸 TCP 更容易部署的原因；但**握手只能携带头部，不能在握手后改认证身份**，需要「连接期内的身份切换」要自己在协议里做。

也见 [HTTP Upgrade（HTTP 协议升级）](#http-upgradehttp-协议升级)。

示例：[`36_realtime_and_streams/01_websocket_basics.js`](36_realtime_and_streams/01_websocket_basics.js)

### HTTP Upgrade（HTTP 协议升级）

HTTP Upgrade 是 HTTP/1.1 定义的机制：客户端在请求头里声明「我想换用别的协议」，服务端若同意就回 `101 Switching Protocols`，此后同一条 TCP 连接上的字节由新协议解释。WebSocket 是它最著名的使用者，但同一机制也被用于 HTTP/2 的 `h2c` 等场景。关键细节：升级**只能发生在一次完整的 HTTP 请求之后**，且中间的反向代理、负载均衡**必须显式支持并转发 Upgrade 头**——很多「本地能连上、上线就 404/400」的 WebSocket 问题都是 nginx 缺少 `proxy_set_header Upgrade $http_upgrade` 与 `proxy_http_version 1.1` 造成的。

也见 [Handshake（握手）](#handshake握手)。

示例：[`36_realtime_and_streams/01_websocket_basics.js`](36_realtime_and_streams/01_websocket_basics.js)

### Full-duplex（全双工）

全双工指**同一条连接上双方可以同时发送和接收**，是 WebSocket 相对 HTTP 轮询最本质的优势。半双工（如对讲机式的一问一答）在实时协作、IM、多人游戏、行情推送里会造成无法接受的延迟与请求开销。关键细节：全双工是**协议层能力**，不等于应用层不需要流控——服务端给一个慢客户端狂推消息仍会撑爆发送缓冲，所以生产级 WebSocket 服务要做**每连接发送队列上限 + 丢弃最旧消息或断开**的策略；这与 Streams 里的背压是同一个问题在不同层次的表现。

也见 [WebSocket（WebSocket 协议）](#websocketwebsocket-协议)、[highWaterMark and Backpressure（highWaterMark 与背压）](#highwatermark-and-backpressurehighwatermark-与背压)。

示例：[`36_realtime_and_streams/01_websocket_basics.js`](36_realtime_and_streams/01_websocket_basics.js)

### Heartbeat（心跳保活）

心跳是双方**定期互发一个空消息**来确认连接仍然活着、并阻止中间设备（NAT、负载均衡、云厂商空闲连接回收）把长时间没数据的连接悄悄切断。它在应用层的典型做法是服务端每 30 秒发一次 `{ type: 'ping' }`、客户端回 `{ type: 'pong' }`，若连续 N 次没收到回应就主动关闭并按重连策略重连。关键细节：**TCP 层面的 keepalive 通常不够**（默认两小时才探测一次，且中间代理可能不转发），所以应用层心跳几乎必需；心跳间隔要小于最严格的空闲超时（常见 60 秒），否则连接会在你睡着的间隙被掐断，而客户端直到下一次 `send()` 才发现。

也见 [Ping and Pong（ping/pong 帧）](#ping-and-pongpingpong-帧)、[Auto-reconnect（断线重连）](#auto-reconnect断线重连)。

示例：[`36_realtime_and_streams/02_websocket_broadcast.js`](36_realtime_and_streams/02_websocket_broadcast.js)

### Ping and Pong（ping/pong 帧）

WebSocket 协议本身定义了两种**控制帧**：`ping` 与 `pong`，它们由协议栈自动处理（收到 ping 必须回 pong），不占用应用层的消息编号，也不暴露给 `onmessage`。浏览器端的 `WebSocket` API **不允许 JS 主动发送 ping 帧**，因此浏览器场景只能靠应用层的心跳消息模拟；Node 侧则可以通过 `ws` 库的 `ws.ping()` 使用真正的协议帧。关键细节：协议级 ping 的好处是**不打扰业务消息队列**、也不会被应用层解析逻辑影响；若同时用了协议 ping 与应用层心跳，要注意别让两套超时策略互相打架。

也见 [Heartbeat（心跳保活）](#heartbeat心跳保活)。

示例：[`36_realtime_and_streams/02_websocket_broadcast.js`](36_realtime_and_streams/02_websocket_broadcast.js)

### Server-Sent Events（服务器发送事件，SSE）

SSE 是「服务器单向、持续向浏览器推送文本事件」的 Web 标准：本质上就是**一条永不结束的 HTTP 响应**，Content-Type 为 `text/event-stream`，服务端不断写入 `data:` 行，浏览器通过 `EventSource` 或 `fetch` 读取。它适合行情、通知、日志流、AI 逐字回复这类「只需服务端推、客户端很少发」的场景，实现比 WebSocket 简单得多（无需 Upgrade、走普通 HTTP、天然兼容 CDN 与代理）。关键细节：SSE 是**单向**的（客户端要发消息得另发请求）、基于**文本**（二进制要 Base64）、在 HTTP/1.1 下每个域名**约 6 条连接上限**（HTTP/2 下多路复用则不受此限）。

也见 [EventSource（EventSource 接口）](#eventsourceeventsource-接口)、[WebSocket（WebSocket 协议）](#websocketwebsocket-协议)、[Event Stream Format（事件流格式）](#event-stream-format事件流格式)。

示例：[`36_realtime_and_streams/03_server_sent_events.js`](36_realtime_and_streams/03_server_sent_events.js)

### EventSource（EventSource 接口）

`EventSource` 是浏览器读取 SSE 的标准接口：`new EventSource('/events')` 之后监听 `message`、`open`、`error` 以及自定义事件名（服务端用 `event: foo` 指定），并且**自动处理重连与事件 ID**。关键细节：它**不能自定义请求头**（无法加 `Authorization`），所以带鉴权的 SSE 要么把令牌放查询串（有泄露进日志的风险）、要么改用 `fetch` + `ReadableStream` 自己解析事件流；它**不做跨域限制之外的额外防护**（需要服务端设置 CORS）；服务端返回的响应若被中间层缓冲（如某些网关默认开启响应缓冲），事件会被攒着一起发，必须显式关闭缓冲。

也见 [Server-Sent Events（服务器发送事件，SSE）](#server-sent-events服务器发送事件sse)、[Auto-reconnect（断线重连）](#auto-reconnect断线重连)。

示例：[`36_realtime_and_streams/03_server_sent_events.js`](36_realtime_and_streams/03_server_sent_events.js)

### Event Stream Format（事件流格式）

SSE 的线上格式是**纯文本、按行、以空行分隔事件**：`data:` 是负载（可多行拼接）、`event:` 是事件名、`id:` 是事件 ID、`retry:` 是重连间隔毫秒数，以 `:` 开头的行是注释（常用来做心跳）。关键细节：`data:` 行**只支持 UTF-8 文本**，换行必须用多个 `data:` 行表达，不能塞裸 `\n`；**空行才是事件的分隔符**，服务端少写一个空行就会导致事件被挂起不投递（这是「本地 curl 看得到、浏览器收不到」的典型原因）；用 `fetch` 手写 SSE 客户端时，需要自己实现这个解析状态机。

也见 [Server-Sent Events（服务器发送事件，SSE）](#server-sent-events服务器发送事件sse)。

示例：[`36_realtime_and_streams/03_server_sent_events.js`](36_realtime_and_streams/03_server_sent_events.js)

### Auto-reconnect（断线重连）

SSE 的重连是**协议内置**的：连接断开后浏览器会自动重连，重连间隔由服务端 `retry:` 或默认值决定。WebSocket **没有**这个能力，必须自己实现，且要遵循两条经验：**指数退避 + 抖动**（`1s, 2s, 4s…` 加随机量，避免服务端重启后所有客户端同时重连造成惊群）、**区分断开原因**（网络抖动可重连，认证失败/协议错误不该无脑重连，否则会打出无限循环的失败请求）。关键细节：重连后必须考虑**消息补发**——断线期间错过的消息用 `Last-Event-ID` 或业务侧游标补齐，否则前端会出现状态空洞。

也见 [Last-Event-ID（最后事件 ID）](#last-event-id最后事件-id)、[Heartbeat（心跳保活）](#heartbeat心跳保活)。

示例：[`36_realtime_and_streams/03_server_sent_events.js`](36_realtime_and_streams/03_server_sent_events.js)

### Last-Event-ID（最后事件 ID）

`Last-Event-ID` 是 SSE 断线重连时浏览器**自动带上**的请求头，值是客户端收到的最后一个 `id:` 字段。服务端据此就能只补发「这条之后」的事件，让重连对用户完全无感。关键细节：它是 SSE 相对手写轮询最实用的一个设计——**「断点续传」的语义被标准化了**；但服务端必须自己维护事件缓冲区（按 ID 可检索），且**缓冲区长度有限**，如果客户端离线太久、ID 已被淘汰，服务端应主动回一个「从头开始」的信号（如自定义事件）让客户端做全量刷新，而不是静默地丢事件。WebSocket 场景下等价机制要靠自己在消息协议里实现。

也见 [Auto-reconnect（断线重连）](#auto-reconnect断线重连)、[Event Stream Format（事件流格式）](#event-stream-format事件流格式)。

示例：[`36_realtime_and_streams/03_server_sent_events.js`](36_realtime_and_streams/03_server_sent_events.js)

### Polling（轮询）

轮询是「客户端定时发请求问有没有新数据」的方案：`setInterval(() => fetch('/updates'), 3000)`。它实现最简单、兼容性最好、天然走标准 HTTP 语义（缓存、鉴权、代理都无痛），但代价是**延迟与开销的矛盾无法调和**——间隔短则请求量大（且绝大多数是空响应）、间隔长则消息延迟高。关键细节：轮询适合「更新频率低、实时性要求不高」的场景（如每 5 分钟同步一次配置）；一旦需求变成「秒级以内」，就应该在 SSE / WebSocket / 长轮询之间选型，而不是继续把间隔调小。

也见 [Long Polling（长轮询）](#long-polling长轮询)、[Server-Sent Events（服务器发送事件，SSE）](#server-sent-events服务器发送事件sse)。

示例：[`36_realtime_and_streams/03_server_sent_events.js`](36_realtime_and_streams/03_server_sent_events.js)

### Long Polling（长轮询）

长轮询是轮询的改良版：客户端发起请求后，服务端**把请求挂住不立即返回**，直到有新数据或超时才响应；客户端收到响应后立刻再发一个请求，从而形成「近似推送」的效果。它把空轮询的开销消掉、延迟降到接近实时，同时仍然是标准 HTTP（不需要 Upgrade，代理友好）。关键细节：长轮询会**长时间占用一个连接与一个服务端处理资源**（每个客户端一条挂起请求），并发上万时需要异步框架支撑，且要设置**小于中间设备超时的挂起时间**（常见 30–60 秒）以免连接被静默切断；相比之下 SSE 是「一次连接持续推」，语义更清晰、开销更小，能用 SSE 就不要用长轮询。

也见 [Polling（轮询）](#polling轮询)、[Server-Sent Events（服务器发送事件，SSE）](#server-sent-events服务器发送事件sse)、[WebSocket（WebSocket 协议）](#websocketwebsocket-协议)。

示例：[`36_realtime_and_streams/03_server_sent_events.js`](36_realtime_and_streams/03_server_sent_events.js)

### Web Streams API（Web 流 API）

Web Streams API 是「分块处理数据」的标准抽象，包含 `ReadableStream`、`WritableStream`、`TransformStream` 三个核心接口，浏览器与 Node 都内置（`globalThis.ReadableStream`）。它解决的是「数据太大不能一次读进内存」与「生产速度与消费速度不匹配」这两个问题：前者靠分块（chunk），后者靠背压。关键细节：它**不是**「更快的数组」——每个 chunk 都会经过一层 Promise 与队列调度，对小数据量的性能不如直接处理数组；它的真正价值在于**可组合**（`pipeThrough` 串起多个转换）与**跨平台**（同一份代码在浏览器和 Node 都能跑）。

也见 [ReadableStream（可读流）](#readablestream可读流)、[highWaterMark and Backpressure（highWaterMark 与背压）](#highwatermark-and-backpressurehighwatermark-与背压)。

示例：[`36_realtime_and_streams/04_web_streams_readable.js`](36_realtime_and_streams/04_web_streams_readable.js)

### ReadableStream（可读流）

`ReadableStream` 表示**一个可以逐块读取的数据源**，构造时传入 `start(controller)` / `pull(controller)` / `cancel(reason)` 三个可选回调：`pull` 只在消费者需要数据时被调用，这正是**背压**的实现位置——消费者慢，`pull` 就自然少被调用。典型来源包括 `fetch` 的 `response.body`、文件读流、`new ReadableStream({ start(c) { c.enqueue(...) } })` 手工构造的流。关键细节：一个流**只能被消费一次**（读完就 locked/closed），需要多处读取必须先 `tee()` 分流；`fetch` 的响应体只有在 `response.body` 被读取时才真正开始下载，直接 `await response.json()` 等于放弃了流式处理。

也见 [Reader（读取器）](#reader读取器)、[Controller（控制器）](#controller控制器)、[Web Streams API（Web 流 API）](#web-streams-apiweb-流-api)。

示例：[`36_realtime_and_streams/04_web_streams_readable.js`](36_realtime_and_streams/04_web_streams_readable.js)

### WritableStream（可写流）

`WritableStream` 表示**一个可以逐块写入的目的地**，构造时传入 `write(chunk, controller)`、`close()`、`abort(reason)`；它保证 `write()` 返回的 Promise 在**数据真正被接受后**才兑现，因此写入方可以通过 `await` 自然感知下游是否跟得上（这是「可写流的背压反馈」）。典型用途是把上游数据落到文件、HTTP 响应、日志收集器。关键细节：`write()` 返回的 Promise 若 reject，流会进入 error 状态，后续写入都会被拒绝——所以**错误必须在上游处理**，否则一处写失败会静默吃掉后面所有数据；`getWriter()` 拿到 writer 后同样要记得 `releaseLock()` 或 `close()`。

也见 [Controller（控制器）](#controller控制器)、[pipeThrough（管道传输）](#pipethrough管道传输)。

示例：[`36_realtime_and_streams/05_web_streams_transform.js`](36_realtime_and_streams/05_web_streams_transform.js)

### TransformStream（转换流）

`TransformStream` 是「一边读一边写」的中间环节：它自带一个 `readable` 和一个 `writable`，构造时提供 `transform(chunk, controller)`（把输入块加工成零个或多个输出块）、`flush(controller)`（输入结束后收尾，如补齐最后一行）、`start`。典型用途是逐块解析文本（按行切分 NDJSON / SSE）、解压缩、加解密、格式转换。关键细节：`transform` 里可以 `enqueue` **多个或零个**块（例如「攒够一行再输出」的缓冲逻辑），因此输入块数与输出块数不必一一对应；`flush` 是很多人漏掉的钩子，没有它最后一行的数据会滞留在缓冲区里被丢掉。

也见 [pipeThrough（管道传输）](#pipethrough管道传输)、[highWaterMark and Backpressure（highWaterMark 与背压）](#highwatermark-and-backpressurehighwatermark-与背压)。

示例：[`36_realtime_and_streams/05_web_streams_transform.js`](36_realtime_and_streams/05_web_streams_transform.js)

### Reader（读取器）

读取器是**消费可读流的入口对象**：`stream.getReader()` 返回 `ReadableStreamDefaultReader`，用 `await reader.read()` 拿到 `{ value, done }`，或者用 `for await (const chunk of stream)` 直接异步迭代（内部自动加锁）。关键细节：调用 `getReader()` 之后流会被**加锁**（`stream.locked === true`），此时再调用 `getReader()` 或在别处消费会抛 `TypeError`，必须 `reader.releaseLock()` 才能交还；`read()` 的 `value` 在流正常结束时最后一次是 `undefined`（且 `done` 为 `true`），把 `undefined` 当数据块处理是常见 bug 来源。需要「流中途退出但仍要排空」时用 `reader.cancel()` 并注意其语义差异。

也见 [ReadableStream（可读流）](#readablestream可读流)、[Controller（控制器）](#controller控制器)。

示例：[`36_realtime_and_streams/04_web_streams_readable.js`](36_realtime_and_streams/04_web_streams_readable.js)

### Controller（控制器）

控制器是**流内部用来操作流的句柄**，由流实现传给 `start`/`pull`/`transform` 回调。可读流的 `ReadableStreamDefaultController` 提供 `enqueue(chunk)`（送出一块）、`close()`（正常结束）、`error(err)`（以错误终止）；可写流的控制器提供 `error()` 与 `signal`（用于响应取消）。关键细节：**`enqueue` 的次数受队列水位限制**——当内部队列长度超过 `highWaterMark` 时，`pull` 不会被再次调用，这就是背压的落点；`controller.error()` 之后流进入 errored 状态，消费者会**在下一次 read 时收到该错误**（而不是立刻抛），忘记处理这个错误会导致未捕获的 rejection。

也见 [ReadableStream（可读流）](#readablestream可读流)、[highWaterMark and Backpressure（highWaterMark 与背压）](#highwatermark-and-backpressurehighwatermark-与背压)。

示例：[`36_realtime_and_streams/04_web_streams_readable.js`](36_realtime_and_streams/04_web_streams_readable.js)

### pipeThrough（管道传输）

`readable.pipeThrough(transformStream)` 把可读流接到一个转换流上并返回**转换后的新可读流**，是流式处理的组合方式：`response.body.pipeThrough(new TextDecoderStream()).pipeThrough(parseLines()).pipeTo(writer)`。它替代了手写的「读一块 → 转换 → 写一块」循环，并把**背压自动串起来**：下游慢，`transform` 的 `enqueue` 就会阻塞，进而让上游的 `pull` 不再被调用。关键细节：`pipeThrough` 返回的是新流，**原流已被占用**（不能再直接读）；`pipeTo` 是终结操作，返回 Promise 并在出错或取消时把错误传递到两端，但 **`pipeTo` 默认不会在失败时自动中止上游**（需要 `preventCancel`/`preventAbort` 相关选项配合）。

也见 [TransformStream（转换流）](#transformstream转换流)、[WritableStream（可写流）](#writablestream可写流)。

示例：[`36_realtime_and_streams/05_web_streams_transform.js`](36_realtime_and_streams/05_web_streams_transform.js)

### highWaterMark and Backpressure（highWaterMark 与背压）

`highWaterMark`（水位线）是流的**内部缓冲区容量上限**（可读流默认 1 块、可写流默认 1 块、一般为 0 表示「不缓冲」），它与**背压**（backpressure）是一体两面：缓冲区写满后就停止向上游索取数据，压力自然沿着管道传回数据源。背压的意义在于**防止内存被撑爆**——没有背压时，快生产 + 慢消费的结果就是队列无限增长，最终 OOM。关键细节：`ReadableStream` 的 `pull` 只在缓冲区低于水位线时被调用，这是背压的机制来源；`TransformStream` 的 `writableHighWaterMark`/`readableHighWaterMark` 需要分开设置，调大只会增加内存占用不会提升吞吐。**常见误解**：以为「加了 Streams 就有背压」——忽略 `pull` 返回值、或在 `start` 里循环 `enqueue` 会把背压绕过。

也见 [Controller（控制器）](#controller控制器)、[Web Streams API（Web 流 API）](#web-streams-apiweb-流-api)、[Full-duplex（全双工）](#full-duplex全双工)。

示例：[`36_realtime_and_streams/04_web_streams_readable.js`](36_realtime_and_streams/04_web_streams_readable.js)、[`36_realtime_and_streams/05_web_streams_transform.js`](36_realtime_and_streams/05_web_streams_transform.js)

### Web Streams and Node Streams（Web 流与 Node 流）

两套流 API 同时存在：**Node Streams**（`node:stream`，`Readable`/`Writable`/`Transform`，基于 EventEmitter、有 `pipe`、区分对象模式与字节模式）是 Node 生态的历史核心；**Web Streams** 是标准 API，浏览器与 Node 都有，也是 `fetch`、`Response.body`、`CompressionStream` 等新 API 的通用语言。二者语义相近但**接口不兼容**——Node 流靠事件与 `pipe`，Web 流靠 reader/writer 与 Promise，且背压的表达方式不同。互转由 `stream.Readable.fromWeb()` / `readable.toWeb()` 等适配器完成。关键细节：互转会有**性能开销**（每块数据要跨一层适配与 Promise 调度），在高吞吐场景应尽量让整条链路用同一套 API。

也见 [Web Streams API（Web 流 API）](#web-streams-apiweb-流-api)。

示例：[`36_realtime_and_streams/06_web_streams_vs_node_streams.js`](36_realtime_and_streams/06_web_streams_vs_node_streams.js)

## 调试与性能剖析

### Call Stack（调用栈）

调用栈是运行时维护的「**当前执行到哪、以及是谁调用到这里**」的后进先出结构：每进入一个函数就压入一帧，返回时弹出。它是判断错误发生路径的第一手资料，也是 `RangeError: Maximum call stack size exceeded`（栈溢出，通常由无限递归造成）背后的那个「栈」。关键细节：调用栈是**运行时状态**而非静态结构，异步代码里的「栈」会在每个 `await`/回调处断开，所以默认打印的栈往往只显示最后一段（这就是需要异步栈追踪的原因）；栈深度**有上限**（引擎相关，通常上万帧），递归深度过大的算法应改成显式栈或迭代。

也见 [Stack Frame（栈帧）](#stack-frame栈帧)、[Async Stack Traces（异步栈追踪）](#async-stack-traces异步栈追踪)。

示例：[`37_debugging_and_profiling/01_stack_traces.js`](37_debugging_and_profiling/01_stack_traces.js)

### Stack Frame（栈帧）

栈帧是调用栈里的**一项**，描述「某个函数的某次调用」：函数名、源文件与行列号、有时还有 `this` 与局部变量。`Error.stack` 字符串就是按「帧从近到远」排列的多行文本，每行一帧。关键细节：**帧上的位置是「调用点」而不是「定义点」**（对你定位问题时这通常正是想要的）；经过转译/压缩的代码里帧会显示为 `at a (bundle.js:1:23456)` 这种无意义位置，必须靠 Source Map 还原；帧顺序不能靠字符串解析来依赖（不同引擎格式不同），要结构化处理应使用 `Error.prepareStackTrace` 或 `error.captureStackTrace`。

也见 [Error.stack（错误堆栈）](#errorstack错误堆栈)、[Source Map（源码映射）](#source-map源码映射)。

示例：[`37_debugging_and_profiling/01_stack_traces.js`](37_debugging_and_profiling/01_stack_traces.js)

### Error.stack（错误堆栈）

`err.stack` 是错误对象上一个**非标准但被普遍支持**的字符串属性，内容是「错误消息 + 换行 + 各栈帧」，在构造 `Error` 时由引擎采集。它是排查线上问题最有价值的信息（能直接看到调用链），因此错误上报系统的核心字段就是它。关键细节：`stack` 是**惰性采集**且**只在创建错误那一刻准确**——如果把错误存起来稍后再读，采集时机由引擎决定，可能已经丢失上下文；跨语言/跨运行时序列化时 `stack` 可能丢失（`JSON.stringify(err)` 会得到 `{}`，因为消息与栈都不可枚举，必须手动挑字段）。

也见 [Stack Frame（栈帧）](#stack-frame栈帧)、[stackTraceLimit（堆栈深度上限）](#stacktracelimit堆栈深度上限)。

示例：[`37_debugging_and_profiling/01_stack_traces.js`](37_debugging_and_profiling/01_stack_traces.js)

### stackTraceLimit（堆栈深度上限）

V8 默认只采集**10 帧**栈信息（`Error.stackTraceLimit = 10`），超出的部分被丢弃——这是性能与信息量的折中，因为采集每一帧都有成本。它的实际影响是：一个深层调用链的报错在日志里只显示最后 10 层，看不到「最初的入口」。关键细节：可以在采集前临时调大（`Error.stackTraceLimit = 50`），也可以设为 `0` 关闭采集以提升热路径性能（在频繁创建错误的代码里这是有效的优化）；它是**全局设置**，修改会影响整个进程，所以应在入口处统一配置而不是散落在业务代码里。`Error.captureStackTrace(target, ctorOpt)` 则用于自定义错误类时把构造函数自身从栈里排除，让栈的第一帧指向真正的调用者。

也见 [Error.stack（错误堆栈）](#errorstack错误堆栈)。

示例：[`37_debugging_and_profiling/01_stack_traces.js`](37_debugging_and_profiling/01_stack_traces.js)

### Async Stack Traces（异步栈追踪）

异步栈追踪让跨越 `await`、回调、定时器的调用链**也能出现在同一个栈里**，显示为 `await` 之间的「async」分段。它解决了异步代码报错时「栈只有最后一段、看不到谁发起的」这一根本痛点——没有它，排查一个 Promise 链深处的错误几乎只能靠猜。关键细节：V8 通过 `Error.stackTraceLimit` 与「异步栈」机制实现，**默认行为随版本变化**（有时需要 `--async-stack-traces` 或 DevTools 的 Async 选项），且异步栈在**跨越事件循环边界**（如 `setTimeout` 回调里抛错）时可能断开；错误上报系统应把每一层的 `cause` 一起采集，才能补上异步断点。

也见 [Call Stack（调用栈）](#call-stack调用栈)、[Error.cause（错误原因链）](#errorcause错误原因链)。

示例：[`37_debugging_and_profiling/01_stack_traces.js`](37_debugging_and_profiling/01_stack_traces.js)

### Breakpoint（断点）

断点是调试器里「**执行到这一行就停下来**」的标记，暂停后可以查看局部变量、`this`、调用栈，并逐步执行（step over / step into / step out）。它比 `console.log` 强的地方在于**能观察完整的运行时状态并随时试探**（在控制台里改值、调用函数），但代价是需要交互式环境，因此无法用于线上。关键细节：断点有几种形态，除了行断点还有**条件断点**（满足表达式才停）、**日志断点**（不停，只打印，等于不用改代码的 `console.log`）、**DOM/事件/XHR 断点**（某类事件触发时停）；在 DevTools 的 Sources 面板设置即可，且**源码经 Source Map 映射后可以直接在原始 TS/JSX 文件上打断点**。

也见 [Conditional Breakpoint（条件断点）](#conditional-breakpoint条件断点)、[debugger Statement（debugger 语句）](#debugger-statementdebugger-语句)。

示例：[`37_debugging_and_profiling/02_debugger_and_inspect.js`](37_debugging_and_profiling/02_debugger_and_inspect.js)

### Conditional Breakpoint（条件断点）

条件断点是带**触发条件**的断点：只有表达式为真时才暂停。它解决的是「循环第一万次才出问题」的场景——普通断点会让你按一万次继续，而条件断点直接停在出问题的那一次。关键细节：条件表达式是在被调试的进程中求值的，因此**表达式本身有副作用或开销**（例如调用了一个会改状态的函数，或在每秒执行百万次的循环里做了昂贵计算）会影响被调试程序的时序甚至行为；排查偶发问题时，日志断点（不改代码的打印）往往比条件断点更安全，因为它完全不打断执行。

也见 [Breakpoint（断点）](#breakpoint断点)。

示例：[`37_debugging_and_profiling/02_debugger_and_inspect.js`](37_debugging_and_profiling/02_debugger_and_inspect.js)

### debugger Statement（debugger 语句）

`debugger;` 是一条**写在代码里的断点**：当开发者工具（或 Node 的调试器）处于连接状态时，执行到它就暂停；没有调试器时它是**空操作**，不影响生产运行。它适合「问题只在某个特定分支出现、不方便提前设断点」的场景：先把 `debugger` 放在可疑位置，等它命中再往里走。关键细节：它必须**清理**——留在生产代码里虽然没有功能影响，但一旦有人打开 DevTools 就会莫名其妙地中断，还会让打包产物带上一句无意义的语句；配合 `--inspect-brk` 时，`debugger` 语句是「非交互式调试」中最方便的下钻手段（Node 的 `node inspect` 也可以用它配合 `cont` 命令）。

也见 [Node Inspector（Node 调试器）](#node-inspectornode-调试器)、[Breakpoint（断点）](#breakpoint断点)。

示例：[`37_debugging_and_profiling/02_debugger_and_inspect.js`](37_debugging_and_profiling/02_debugger_and_inspect.js)

### Node Inspector（Node 调试器）

Node 通过 `--inspect`（启动并监听调试端口）、`--inspect-brk`（**在第一行暂停**，适合调试启动阶段）、`--inspect-port` 等参数开启内置调试器，之后可以用 Chrome DevTools（`chrome://inspect`）或 `node inspect` 命令行客户端连接。关键细节：`--inspect` **默认监听 127.0.0.1 的 9229 端口**，直接暴露到公网等于把任意代码执行权限交出去，远程调试必须走 SSH 隧道；`--inspect-brk` 是「调试只在启动时出现的问题」（如配置加载、模块初始化顺序）的关键手段，因为普通 `--inspect` 挂上调试器时启动早就跑完了；调试器附加时进程会被暂停，生产环境慎用。

也见 [Inspector Protocol（调试协议）](#inspector-protocol调试协议)、[debugger Statement（debugger 语句）](#debugger-statementdebugger-语句)。

示例：[`37_debugging_and_profiling/02_debugger_and_inspect.js`](37_debugging_and_profiling/02_debugger_and_inspect.js)

### Inspector Protocol（调试协议）

Inspector Protocol（也叫 Chrome DevTools Protocol）是**调试器与运行时之间的 JSON-RPC 协议**：调试器发送 `Debugger.setBreakpoint`、`Runtime.evaluate`、`Profiler.start` 等命令，运行时回事件（暂停、控制台输出、性能数据）。DevTools、VS Code 的调试器、`node inspect`、以及各种 APM 采集器本质上都是这个协议的客户端。关键细节：理解它的意义在于**「调试能力可以被程序化使用」**——你可以写脚本自动 attach 到进程、抓取 CPU profile、在指定位置取变量快照，这也是线上性能采样的实现基础；它默认无认证，因此端口暴露等同于远程代码执行。

也见 [Node Inspector（Node 调试器）](#node-inspectornode-调试器)、[CPU Profile and Flame Chart（CPU 剖析与火焰图）](#cpu-profile-and-flame-chartcpu-剖析与火焰图)。

示例：[`37_debugging_and_profiling/02_debugger_and_inspect.js`](37_debugging_and_profiling/02_debugger_and_inspect.js)

### Source Map（源码映射）

Source Map 是一份 **JSON 文件**（`.map` 或内联的 base64 data URL），记录「**生成代码的某个位置对应原始源码的哪个位置**」，让浏览器/Node 在调试时把压缩转译后的代码还原成原始文件与行号。没有它，生产环境的报错栈全是 `bundle.js:1:483729` 这种无用信息。关键字段包括 `version`、`sources`（原始文件列表）、`sourcesContent`（可内联原始内容，便于私有部署）、`mappings`（编码后的位置映射）、`file`、`sourceRoot`。关键细节：**Source Map 只在「生成位置 → 原始位置」方向可用**，反向（从源码行找到产物位置）需要额外索引；产物与 map 必须**版本对应**，发布了新版本却挂着旧 map 会让栈解析出错误的行号，比没有 map 更难排查。

也见 [mappings Field（mappings 映射表）](#mappings-fieldmappings-映射表)、[VLQ Encoding（VLQ 编码）](#vlq-encodingvlq-编码)。

示例：[`37_debugging_and_profiling/03_source_maps.js`](37_debugging_and_profiling/03_source_maps.js)

### mappings Field（mappings 映射表）

`mappings` 是 Source Map 里**唯一真正承载映射关系**的字段，格式是一串用 `,` 和 `;` 分隔的变长整数序列：`;` 表示「进入产物的下一行」，`,` 表示「同一行里的下一个映射段」，每段通常含四个数（生成列、源文件索引、原始行、原始列）。为了压缩体积，所有数字都相对**前一个同类型数字取增量**再编码。关键细节：`mappings` 的设计目标是**紧凑**而非可读（一个几十 KB 的 map 里 `mappings` 常占 90% 以上体积）；因为数字是增量编码的，**任何一位解码错误都会让后续所有映射错位**，所以自己写解析器时务必严格按规范实现 VLQ。

也见 [VLQ Encoding（VLQ 编码）](#vlq-encodingvlq-编码)、[Source Map（源码映射）](#source-map源码映射)。

示例：[`37_debugging_and_profiling/03_source_maps.js`](37_debugging_and_profiling/03_source_maps.js)

### VLQ Encoding（VLQ 编码）

VLQ（Variable Length Quantity，可变长数量编码）是 Source Map 里把整数压成 Base64 字符的编码方式：每个字符携带 6 位，**最高位是「续位」标记**（1 表示「还有后续字符」），最低位是符号位（负数标记），其余是数值位。它让「小的增量」只占一个字符，「大的数字」按需扩展，兼顾紧凑与通用。关键细节：解码时必须**区分「续位」与「符号位」**（常见的手写实现错误就是忘了符号位，导致负增量被解成正数、行号全乱）；同一个 VLQ 序列解码出的整数要**累加**到前一值上才是绝对位置，因此不能随机访问中间某段——必须从头顺序解码。

也见 [mappings Field（mappings 映射表）](#mappings-fieldmappings-映射表)。

示例：[`37_debugging_and_profiling/03_source_maps.js`](37_debugging_and_profiling/03_source_maps.js)

### Profiling（性能剖析）

性能剖析是「**测量程序把时间花在哪里**」的活动，与「凭感觉优化」相对：先量出热点（占时间最多的函数），再优化，再量一次确认有效。两种主流采集方式：**采样**（sample，每隔固定时间抓一次调用栈，开销小、适合线上）与**插桩**（instrumentation，记录每次函数进出、精确但开销大）。关键细节：剖析必须**先建基线**——没有基线数字，「优化后快了」只是感觉；同时要**在接近真实负载的条件下测**（开发机上的小数据量往往测不出真实热点，JIT 还会因为预热不足给出误导性结果）；剖析结果受采样频率与随机性影响，一次采样不足以下结论。

也见 [CPU Profile and Flame Chart（CPU 剖析与火焰图）](#cpu-profile-and-flame-chartcpu-剖析与火焰图)、[perf_hooks（性能钩子模块）](#perf_hooks性能钩子模块)。

示例：[`37_debugging_and_profiling/04_perf_hooks.js`](37_debugging_and_profiling/04_perf_hooks.js)

### CPU Profile and Flame Chart（CPU 剖析与火焰图）

CPU Profile 是一次采样剖析的原始结果（每个采样点记录当时的调用栈），火焰图则把它**可视化**：横轴是时间占比（宽度越大越耗时）、纵轴是调用深度，底部是入口函数、越往上是被调用的子函数。读图规则很实用：**宽的才是热点**（窄而高的火焰通常是「调用次数多但每次都很快」，未必值得优化）、**「平顶」表示叶子函数自身耗时**、**同一层重复出现的宽块**往往是循环或重复计算。关键细节：火焰图里会出现 `(anonymous)`、`(program)`、`(idle)` 这类合成帧，`(garbage collector)` 与 `(compiled code)` 帧则提示瓶颈可能来自 GC 或 JIT 编译；只看火焰图不看输入规模容易误判。

也见 [Profiling（性能剖析）](#profiling性能剖析)、[Inspector Protocol（调试协议）](#inspector-protocol调试协议)。

示例：[`37_debugging_and_profiling/04_perf_hooks.js`](37_debugging_and_profiling/04_perf_hooks.js)

### perf_hooks（性能钩子模块）

`node:perf_hooks` 是 Node 暴露性能计时能力的模块，核心成员是 `performance`（与浏览器同名的 Performance API 实现，Node 16+ 也挂在全局）、`PerformanceObserver`、`PerformanceEntry` 系列类型，以及 `monitorEventLoopDelay()` 这类 Node 特有的度量。它让「服务端哪个环节慢」可以被结构化测量，而不是靠 `console.time` 打日志。关键细节：`performance.now()` 返回**高精度单调时钟**（不受系统时间调整影响，这是它与 `Date.now()` 的关键区别——用 `Date.now()` 测耗时会在 NTP 校时或夏令时切换时得到负值或跳变）；`perf_hooks` 的所有时间单位都是**毫秒**（浮点）。

也见 [performance.mark and measure（标记与测量）](#performancemark-and-measure标记与测量)、[User Timing API（用户计时 API）](#user-timing-api用户计时-api)。

示例：[`37_debugging_and_profiling/04_perf_hooks.js`](37_debugging_and_profiling/04_perf_hooks.js)

### performance.mark and measure（标记与测量）

`performance.mark('name')` 在时间线上打一个**命名时间点**，`performance.measure('label', 'startMark', 'endMark')` 计算两个标记之间的时长并生成一条 `PerformanceMeasure` 条目，之后可以用 `performance.getEntriesByType('measure')` 取出分析。相比手写 `const t0 = performance.now()`，它的优势是**标记是全局可查询的命名锚点**（不同模块、不同库打的标记可以互相配对测量），也能与浏览器 DevTools 的 Performance 面板对齐。关键细节：`measure` 的参数是**标记名**而不是时间值，名字写错或标记未定义会抛错；标记会**累积在内存里**，长跑服务应定期 `clearMarks()`/`clearMeasures()`，否则会造成缓慢的内存增长。

也见 [User Timing API（用户计时 API）](#user-timing-api用户计时-api)、[PerformanceObserver（性能观察器）](#performanceobserver性能观察器)。

示例：[`37_debugging_and_profiling/04_perf_hooks.js`](37_debugging_and_profiling/04_perf_hooks.js)

### User Timing API（用户计时 API）

User Timing API 是 `mark`/`measure` 这套接口的规范名称（区别于 Navigation Timing、Resource Timing 等自动采集的时机），它把**业务自定义的性能数据**接入浏览器/Node 统一的性能时间线，从而能被 `PerformanceObserver`、DevTools 与真实用户监控（RUM）系统统一采集。关键细节：它只提供**测点**，不提供「该测什么」——有效的做法是围绕用户可感知的关键路径打点（首屏渲染完成、搜索出结果、支付提交成功），而不是给每个函数都打上；标记名建议带命名空间前缀（如 `app:checkout:start`），避免与第三方库的标记冲突。

也见 [performance.mark and measure（标记与测量）](#performancemark-and-measure标记与测量)。

示例：[`37_debugging_and_profiling/04_perf_hooks.js`](37_debugging_and_profiling/04_perf_hooks.js)

### PerformanceObserver（性能观察器）

`PerformanceObserver` 是**订阅性能条目**的统一入口：用 `observe({ entryTypes: ['measure', 'longtask', 'resource', ...] })` 注册，之后每产生一条符合条件的条目就触发回调，**不产生轮询开销**。它比「定时 `getEntries` 再对比」高效得多，也是采集长任务、资源加载、自定义测量、布局偏移的标准方式。关键细节：回调里拿到的条目**必须立刻处理或拷贝**——为节省内存，条目会被从缓冲区回收，把 `entry` 引用存到数组里稍后再读可能读到已失效的对象；采集应使用 `buffered: true` 以便拿到注册之前已产生的条目（否则注册前的数据会永久丢失）。

也见 [performance.mark and measure（标记与测量）](#performancemark-and-measure标记与测量)。

示例：[`37_debugging_and_profiling/04_perf_hooks.js`](37_debugging_and_profiling/04_perf_hooks.js)、[`31_performance_and_memory/16_web_vitals.js`](31_performance_and_memory/16_web_vitals.js)

### Memory Diagnostics（内存诊断）

内存诊断是定位「内存为什么一直涨」的系统方法，基本步骤是：先用 `process.memoryUsage()` / `performance.memory` 看**趋势**（是稳定在高位还是持续增长），再用堆快照（heap snapshot）做**对象级归因**（哪种对象最多、是谁持有的），最后对照常见泄漏模式修正（全局变量、未清理的定时器、闭包持有的外部引用、无上限的缓存、已移除但被引用的 DOM 节点）。关键细节：判断「泄漏」的关键不是**当前占用高**而是**经过多次 GC 后仍单调上升**；堆快照体积大且会让进程短暂停顿（生产环境慎用），通常做法是在 staging 环境复现或用采样堆剖析（heap sampling）替代全量快照。

也见 [process.memoryUsage（进程内存用量）](#processmemoryusage进程内存用量)、[Heap Statistics（堆统计）](#heap-statistics堆统计)。

示例：[`37_debugging_and_profiling/05_memory_diagnostics.js`](37_debugging_and_profiling/05_memory_diagnostics.js)、[`31_performance_and_memory/13_memory_profiling.js`](31_performance_and_memory/13_memory_profiling.js)

### process.memoryUsage（进程内存用量）

`process.memoryUsage()` 返回进程内存的分项统计，字段含义要分清才不会误判：`heapUsed`（V8 堆中**活跃对象**占用，通常是最该关注的指标）、`heapTotal`（V8 向系统申请的堆总量）、`rss`（Resident Set Size，进程实际占用的物理内存，包含堆外内存）、`external`（`Buffer`、`ArrayBuffer` 等由 C++ 层分配但由 JS 对象引用的内存）、`arrayBuffers`（`external` 中 ArrayBuffer 部分）。关键细节：**`rss` 高不等于内存泄漏**——`heapTotal` 涨上去后常常不会立刻归还系统；反过来 **`heapUsed` 稳定但 `rss` 一直涨**往往指向堆外/原生内存问题（如未释放的 Buffer、原生插件分配），`--max-old-space-size` 也管不住这部分。

也见 [Memory Diagnostics（内存诊断）](#memory-diagnostics内存诊断)、[Heap Statistics（堆统计）](#heap-statistics堆统计)。

示例：[`37_debugging_and_profiling/05_memory_diagnostics.js`](37_debugging_and_profiling/05_memory_diagnostics.js)

### Heap Statistics（堆统计）

堆统计由 `v8.getHeapStatistics()` / `v8.getHeapSpaceStatistics()` 提供，比 `process.memoryUsage()` 更细：能看到堆的**上限**（`heap_size_limit`，受 `--max-old-space-size` 影响）、各**分代空间**（new space、old space、code space、large object space）的容量与使用量。它是回答「还能撑多久」「该不该调大堆」的直接依据。关键细节：**`large object space` 的占用值得单独关注**——大于一定尺寸的对象直接进大对象空间，频繁创建大对象很容易把内存推高；`heap_size_limit` 与容器内存限制要对齐（容器 limit 1GB 而 Node 默认堆上限按宿主机内存推算时，进程会被 OOM Killer 杀掉而不是抛 JS 堆溢出错误）。

也见 [Memory Diagnostics（内存诊断）](#memory-diagnostics内存诊断)。

示例：[`37_debugging_and_profiling/05_memory_diagnostics.js`](37_debugging_and_profiling/05_memory_diagnostics.js)

### Production Error Reporting（生产环境错误上报）

生产环境错误上报是把线上发生的错误**采集、聚合、归因**的工程实践：在前端用 `window.onerror`、`unhandledrejection`、`ErrorBoundary` 兜底，在 Node 用 `process.on('uncaughtException')`、`unhandledRejection`（注意 `uncaughtException` 之后进程状态已不可信，正确做法是记录后**优雅退出**重启），再把错误连同上下文（用户 ID、版本、路由、设备、请求 ID、Source Map 解析后的真实栈）上报到 Sentry 这类系统。关键细节：**必须脱敏**（令牌、手机号、密码字段、URL 里的 query 参数都会不小心进入消息或栈），**必须做聚合**（按指纹归并同类错误，否则同一 bug 会产生海量条目），并且要上报**版本与 Source Map**，否则线上栈无法还原。

也见 [Error Severity and Alerting（错误分级与告警）](#error-severity-and-alerting错误分级与告警)、[Source Map（源码映射）](#source-map源码映射)。

示例：[`37_debugging_and_profiling/06_production_error_reporting.js`](37_debugging_and_profiling/06_production_error_reporting.js)

### Error Boundary（错误边界）

错误边界是「**把错误限制在局部、不让它炸掉整个界面或整个请求**」的结构：React 里用 `componentDidCatch`/`static getDerivedStateFromError` 实现，捕获子树的渲染错误并渲染降级 UI；Node 服务端则体现为每个请求独立的 try/catch 与错误中间件（一个请求失败不应影响其他请求），以及「非关键功能失败时降级为无此功能」的容错设计。关键细节：错误边界**捕获不到**事件处理器里的错误、异步回调里的错误、服务端渲染的错误与边界自身的错误——这些仍需全局兜底；错误边界的作用是**隔离**而不是**吞掉**，捕获后一定要上报，否则会变成「用户看到空白、监控一片绿」的最坏情况。

也见 [Production Error Reporting（生产环境错误上报）](#production-error-reporting生产环境错误上报)。

示例：[`37_debugging_and_profiling/06_production_error_reporting.js`](37_debugging_and_profiling/06_production_error_reporting.js)

### Error Severity and Alerting（错误分级与告警）

错误分级是按**影响面与可恢复性**给错误定级（如 fatal / error / warning / info），并据此决定「立刻打电话叫人」「进日报」「只记日志」；告警则是在错误率或关键错误出现时触发通知。分级的核心价值是**让告警保持可信**——如果所有错误都发告警，团队会很快学会忽略它，真正的事故就被淹没了。关键细节：分级要基于**用户影响**而不是异常类型（「支付回调验签失败」比「某个 `TypeError`」严重得多），并设置**阈值与抑制**（如「5 分钟内同类错误超过 N 次才告警」「同一错误 1 小时只告警一次」）；每个告警都应绑定**明确的处理动作与负责人**，没有动作的告警等于噪音。**常见误解**：以为「告警越多越安全」——告警疲劳是可靠性事故的直接诱因之一。

也见 [Production Error Reporting（生产环境错误上报）](#production-error-reporting生产环境错误上报)。

示例：[`37_debugging_and_profiling/06_production_error_reporting.js`](37_debugging_and_profiling/06_production_error_reporting.js)
