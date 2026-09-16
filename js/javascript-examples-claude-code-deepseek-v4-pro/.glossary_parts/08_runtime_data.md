## 日期与时间（22_date_and_time）

### Date（Date 对象）

JavaScript 内置的日期时间类型，本质是**一个毫秒数**（自 Unix 纪元起的毫秒偏移量），范围约为 ±1 亿天（±8.64e15 毫秒）。它的所有「年月日时分秒」方法都是在这个数值和「某个时区下的墙上时间」之间来回换算，`Date` 自身不存储时区信息。它同时承担了「绝对时刻」和「墙上时间」两套语义，这正是绝大多数日期 bug 的根源。`Date` 是**可变对象**，`setXxx()` 会就地修改自己；比较两个 `Date` 必须比 `getTime()` 而不是用 `===`（后者比的是引用）。也见 [Timestamp（时间戳）](#timestamp时间戳)、[Date Mutability（Date 的可变性）](#date-mutabilitydate-的可变性)。

示例：[`22_date_and_time/01_date_creation.js`](22_date_and_time/01_date_creation.js)

### Timestamp（时间戳）

在本仓库语境下「时间戳」通常指 **Unix 毫秒时间戳**，即 `Date.now()` / `date.getTime()` 返回的那个数；它是**无时区**的绝对量，因此是跨时区传输和存储日期的首选形式。关键细节：`Date.now()` 是**墙上时钟**，会被 NTP 校时、用户改系统时间、闰秒调整影响，可能「倒流」；做性能测量必须换成单调的 `performance.now()`。常见误解是把「时间戳」当成秒 —— 后端接口（如 JWT 的 `exp`、Unix `mtime`）多数字段是**秒**，混用会导致日期差出几十年（2024 年的秒级时间戳约 1.7e9，毫秒级约 1.7e12）。也见 [Milliseconds vs Seconds（毫秒与秒）](#milliseconds-vs-seconds毫秒与秒)、[Monotonic Clock（单调时钟）](#monotonic-clock单调时钟)。

示例：[`22_date_and_time/02_timestamp.js`](22_date_and_time/02_timestamp.js)

### Unix Epoch（Unix 纪元）

时间戳的零点，定义为 **1970-01-01T00:00:00Z**（UTC），即 `new Date(0).toISOString() === '1970-01-01T00:00:00.000Z'`。选这个日期是 Unix 早期工程上的约定，与 1970 年本身没有任何语义。关键细节：`Date` 的时间戳是**毫秒**，而经典 Unix `time_t` 是**秒**，所以在 JS 和 C/后端之间转换要乘除 1000，并且要用 `Math.floor`/`Math.trunc` 取整而不是 `| 0`（`| 0` 会截断成 32 位，1970-01-25 之后的日期就全错了）。也见 [Timestamp（时间戳）](#timestamp时间戳)。

示例：[`22_date_and_time/02_timestamp.js`](22_date_and_time/02_timestamp.js)

### Milliseconds vs Seconds（毫秒与秒）

JS 原生只有毫秒精度（历史上 V8 甚至把 `Date.now()` 粗化到 1ms 以上以对抗 Spectre），需要微秒/纳秒必须靠 `performance.now()`（小数毫秒）或 `process.hrtime.bigint()`（纳秒 BigInt）。工程上最容易出错的一步就是混淆两者的量纲：把秒当毫秒会得到 1970 年，把毫秒当秒会得到公元 5 万年并触发 `Invalid Date`（超出 ±8.64e15）。**约定命名**（`createdAtMs` / `expiresInSec`）是最好的防御。也见 [Unix Epoch（Unix 纪元）](#unix-epochunix-纪元)。

示例：[`22_date_and_time/02_timestamp.js`](22_date_and_time/02_timestamp.js)

### UTC（Coordinated Universal Time，协调世界时）

全世界统一的时刻基准，`Date` 内部按它存储，`toISOString()` 与所有 `getUTC*()` 方法都按它输出。注意 UTC 不等于 GMT（格林尼治平时）：GMT 是一个时区名，UTC 是一套原子钟时间标准，日常使用中二者数值相同可以互换，但精确表述上不应混用。关键细节：**没有任何 JS API 能得到「服务器时区」或「用户真实位置时区」** —— `Date` 的「本地时间」永远只是**运行环境**的时区，服务端渲染与客户端渲染会得到不同结果，这就是 SSR 水合（hydration）时「日期差一天」警告的来源。也见 [Timezone（时区）](#timezone时区)。

示例：[`22_date_and_time/07_timezone_basics.js`](22_date_and_time/07_timezone_basics.js)

### Local Time（本地时间）

「本地时间」= UTC 时刻 + 运行环境当前生效的 UTC 偏移，由 `getFullYear()`/`getHours()` 等方法给出。它是一个**换算结果而不是存储的状态**：同一次 `Date.now()` 在中国读出 `09:30`、在伦敦读出 `01:30`。常见误解是以为 `new Date()` 会「记住你的时区」——它不会，`Date` 对象没有时区字段，时区是调用方法那一刻从系统（或 `Intl` 的 `timeZone` 选项）现取的。因此单元测试里断言本地时间几乎必然在 CI 上挂掉（容器常设为 UTC）。也见 [UTC（协调世界时）](#utccoordinated-universal-time协调世界时)。

示例：[`22_date_and_time/07_timezone_basics.js`](22_date_and_time/07_timezone_basics.js)

### Timezone（时区）

同一个时刻在不同地区显示不同的墙上时间，`Date` 对象内部**只存一个 UTC 时间戳**，所谓「本地时间」是按运行环境时区即时算出来的。因此两个最容易踩的坑是：(1) `new Date('2025-01-01')`（只有日期）按 **UTC** 解析，而 `new Date('2025/01/01')` 按**本地时区**解析，同一份代码在不同机器上结果可能差一天；(2) `getHours()` 这类方法的结果依赖机器时区，写测试时必须换成 `getUTCHours()` 或显式指定时区，否则换台机器就挂。要按**任意指定的 IANA 时区**（如 `'America/New_York'`）格式化，只能借助 `Intl.DateTimeFormat` 的 `timeZone` 选项或 `toLocaleString`，`Date` 自己做不到。也见 [UTC Offset（UTC 偏移）](#utc-offsetutc-偏移)、[tzdata（时区数据库）](#tzdata时区数据库)。

示例：[`22_date_and_time/07_timezone_basics.js`](22_date_and_time/07_timezone_basics.js)

### UTC Offset（UTC 偏移）

某地墙上时间与 UTC 的固定差值，写法形如 `+08:00`、`-05:00`、`Z`（等于 `+00:00`）。关键细节：偏移在 ISO 字符串里是**唯一能消除歧义**的信息，`'2025-03-15T09:30:45+08:00'` 是确定时刻，`'2025-03-15T09:30:45'` 不是（规范按本地时区解释）。偏移和时区**不是一回事**：`Asia/Shanghai` 永远 `+08:00`，但 `America/New_York` 一年里在 `-05:00` 和 `-04:00` 之间来回切换 —— 所以存储时应当存 IANA 时区名（`Asia/Shanghai`）而不是偏移。也见 [DST（夏令时）](#dstdaylight-saving-time夏令时)。

示例：[`22_date_and_time/07_timezone_basics.js`](22_date_and_time/07_timezone_basics.js)

### getTimezoneOffset（时区偏移方法）

`date.getTimezoneOffset()` 返回本地时间与 UTC 的差值，单位**分钟**，符号是 **UTC 减本地** —— 所以中国（UTC+8）返回 `-480`，而不是 `480`，这个反直觉的符号是本册最经典的坑之一。第二个坑是它**依赖调用时刻**：美国东部夏令时返回 `300`，冬令时返回 `240`，同一个程序冬天夏天输出不同。要用它把本地时间转成时间戳，正确姿势是 `utcMs = localDate.getTime() + offset * 60 * 1000`，但更稳妥的做法是干脆不要用它，全程用 UTC 运算。也见 [UTC Offset（UTC 偏移）](#utc-offsetutc-偏移)。

示例：[`22_date_and_time/07_timezone_basics.js`](22_date_and_time/07_timezone_basics.js)

### DST（Daylight Saving Time，夏令时）

部分时区在夏季把时钟拨快一小时的制度，它给编程带来两类「坏时刻」：(1) **不存在的时刻** —— 春季拨快时 02:00~03:00 被跳过，`new Date(2024, 2, 10, 2, 30)` 在 `America/New_York` 会得到 03:30，程序里约定的「凌晨 2 点跑任务」当天会静默偏移；(2) **重复的时刻** —— 秋季拨回时 01:00~02:00 出现两次，同一段墙上时间对应两个不同的时间戳，JS 规范规定按「较早的那个」消除歧义。中国自 1991 年起不再实行夏令时，所以国内开发者常常意识不到这些问题的存在，但用户一旦在欧美就会大面积暴露。设计上应当**按 UTC 存储和计算、只在展示层本地化**，并避免把定时任务定在凌晨的整点区间。

示例：[`22_date_and_time/10_date_pitfalls.js`](22_date_and_time/10_date_pitfalls.js)

### ISO 8601（ISO 8601 日期时间格式）

国际标准化组织定义的日期时间书写格式，形如 `2025-03-15`（日期）、`2025-03-15T09:30:45.123Z`（UTC 时刻）、`2025-03-15T09:30:45+08:00`（带偏移）。`date.toISOString()` 是 JS 里唯一**保证格式与长度稳定**的序列化方法（固定 24 或 25 个字符，永远以 `Z` 结尾），所以 API 传输一律用它。关键细节：`Date.parse` 对日期部分格式（`YYYY-MM-DD`）**强制按 UTC** 解释，对日期时间部分（`YYYY-MM-DDTHH:mm:ss`）**不带时区时按本地**解释，这个不一致是「差一天」问题的元凶；而 `toISOString()` 遇到 `Invalid Date` 会抛 `RangeError`（这是 `Invalid Date` 唯一的报错出口，其余运算都静默返回 `NaN`）。也见 [RFC 2822](#rfc-2822rfc-2822-日期格式)、[Date Parsing Pitfalls（解析字符串的陷阱）](#date-parsing-pitfalls解析字符串的陷阱)。

示例：[`22_date_and_time/05_date_formatting.js`](22_date_and_time/05_date_formatting.js)

### ISO Week Date（ISO 周历）

把日期表达成「年 + 第几周 + 星期几」的一套规则，用于欧洲日历、财务周期、排课表与周报系统。三条规则：一周从**周一**开始；第 1 周是**包含 1 月 4 日**的那一周（等价于包含当年第一个周四的那一周）；因此一年的第一周可能从上一年 12 月开始。JS **没有** `getWeek()`，`Intl.DateTimeFormat` 也不提供周数，必须手写。最大的坑是 **week-year ≠ calendar-year**：`2025-12-29` 是周一，它所在周的周四是 `2026-01-01`，所以它属于「2026 年第 1 周」，按自然年分组会把同一周劈成两半。也见 [ISO 8601](#iso-8601iso-8601-日期时间格式)。

示例：[`22_date_and_time/11_iso_week.js`](22_date_and_time/11_iso_week.js)

### RFC 2822（RFC 2822 日期格式）

电子邮件头部使用的日期格式，形如 `Tue, 15 Mar 2024 09:30:45 +0800`：星期与月份是英文缩写、偏移不写冒号、可以带时区缩写名（`GMT`、`EST`）。`Date.prototype.toString()` 和 `toUTCString()` 产出的正是这一族格式，规范要求 `Date.parse` 必须能解析自己 `toString()` 的输出，所以在 JS 里解析 RFC 2822 是**可移植**的。陷阱在于它允许省略时区和星期，缺时区时按本地解释，且时区缩写（如 `CST`）有歧义（中国标准时间 / 美国中部时间）。也见 [ISO 8601](#iso-8601iso-8601-日期时间格式)。

示例：[`22_date_and_time/06_date_parsing.js`](22_date_and_time/06_date_parsing.js)

### Date Parsing Pitfalls（解析字符串的陷阱）

`Date.parse` / `new Date(str)` 只**强制**支持 ISO 8601 格式，其余格式（`'March 15, 2024'`、`'2024/03/15'`、`'15-03-2024'`）属于实现自定义行为，V8、JavaScriptCore、SpiderMonkey 各有各的解释，同一份代码换引擎就可能得到不同结果甚至 `Invalid Date`。实用结论只有一条：**只把带完整时区的 ISO 8601 字符串喂给 `Date`**，其余一律自己用正则拆出年份、月份等分量，再用 `new Date(y, m - 1, d)` 或 `Date.UTC(...)` 构造。也见 [ISO 8601](#iso-8601iso-8601-日期时间格式)、[RFC 2822](#rfc-2822rfc-2822-日期格式)。

示例：[`22_date_and_time/06_date_parsing.js`](22_date_and_time/06_date_parsing.js)

### Date Mutability（Date 的可变性）

`Date` 不是值类型而是可变对象：把 `Date` 传进函数、放进对象、存进 `Map`，拿到的都是同一个引用，任何一处调用 `setHours()` 都会影响所有持有者。与之配套的两个陷阱是：`const d = new Date()` 里的 `const` 只锁住变量绑定，`d.setFullYear(2030)` 照样生效；`d1 === d2` 比较的是引用而非时刻，必须写 `d1.getTime() === d2.getTime()`（或 `+d1 === +d2`）。防御方式是**把日期运算写成纯函数，绝不修改入参**，需要副本时用 `new Date(d)` 或 `new Date(d.getTime())`。也见 [Date（Date 对象）](#datedate-对象)。

示例：[`22_date_and_time/10_date_pitfalls.js`](22_date_and_time/10_date_pitfalls.js)

### Date Constructor Pitfalls（构造函数的两个经典陷阱）

第一，**月份从 0 开始**：`new Date(2024, 1, 1)` 是 2 月 1 日而不是 1 月 1 日，`getMonth()` 返回的也永远要 `+1` 才是人类月份；这是从 Java `java.util.Date` 继承下来的历史包袱，无法修复。第二，**年份分量 0~99 会被映射到 1900~1999**：`new Date(99, 0, 1).getFullYear()` 是 `1999`，`new Date(24, 0, 1)` 是 `1924` —— 处理「24 年」这样的两位数年份输入时必须先补成四位。`Date.UTC()` 同样继承这两条规则。也见 [Date Mutability（Date 的可变性）](#date-mutabilitydate-的可变性)。

示例：[`22_date_and_time/01_date_creation.js`](22_date_and_time/01_date_creation.js)

### Date Arithmetic（日期运算）

推荐做法是**把日期转成时间戳做加减，再转回 `Date`**：时间戳运算是纯数值运算，不受时区与夏令时干扰，且天然是纯函数。两个反例：直接加 `24 * 3600 * 1000` 毫秒来「加一天」在夏令时切换日会得到 23 或 25 小时的偏移；`setMonth(getMonth() + 1)` 在月末会**溢出进位**（1 月 31 日 + 1 个月 = 3 月 2 日或 3 日，因为 2 月 31 日被规范化到 3 月）。真正的「加一个日历月」需要自己钳制日号，`Temporal` 的 `add({ months: 1 })` 才有内建的 `overflow: 'constrain'` 语义。也见 [Timestamp（时间戳）](#timestamp时间戳)。

示例：[`22_date_and_time/04_date_arithmetic.js`](22_date_and_time/04_date_arithmetic.js)

### tzdata（时区数据库）

操作系统或运行时内置的「时区规则表」，记录了每个 IANA 时区（`Asia/Shanghai`、`Europe/Berlin`）历史上所有的 UTC 偏移与夏令时起止时间。JS 引擎（V8）通过 ICU 使用它，因此 `Intl.DateTimeFormat().resolvedOptions().timeZone` 才能给出 IANA 名字。关键影响：**各国会临时修改时区规则**（如 2022 年墨西哥取消夏令时），旧版 Node 内置的 tzdata 是旧的，同一份代码在升级前后的输出可能不同；Docker 镜像若未装 `tzdata`，容器里可能只有 UTC。也见 [Timezone（时区）](#timezone时区)。

示例：[`22_date_and_time/07_timezone_basics.js`](22_date_and_time/07_timezone_basics.js)

### getters / setters 家族（读取与修改日期分量）

`getFullYear`/`getMonth`/`getDate`/`getDay`/`getHours`/`getMinutes`/`getSeconds`/`getMilliseconds` 读本地分量，加 `UTC` 前缀（`getUTCHours`）读 UTC 分量；`setXxx()` 同名系列就地修改对象并返回新的时间戳。三个易踩点：`getDay()` 返回 **0=周日**（与 ISO 周历的「周一为一周之始」冲突，写周历时必须换算）；`getMonth()` 从 0 开始；`setXxx()` 都支持**越界值**并自动进位（`setDate(32)` 会滚到下个月，`setHours(-1)` 会退到前一天 23:00），这既是便利也是 bug 来源。也见 [Date Constructor Pitfalls（构造函数的两个经典陷阱）](#date-constructor-pitfalls构造函数的两个经典陷阱)。

示例：[`22_date_and_time/03_date_getters_setters.js`](22_date_and_time/03_date_getters_setters.js)

### Intl.DateTimeFormat（国际化日期格式化）

`Intl` 命名空间下的本地化日期格式化器，按 locale 输出各国的日期写法（`en-US` 的 `3/15/2024`、`de-DE` 的 `15.3.2024`、`zh-CN` 的 `2024/3/15`），并支持 `timeZone`、`dateStyle`、`hour12`、`calendar` 等选项。它比手写 `YYYY-MM-DD` 拼接**更正确**（自动处理语言、月份名、序数），也是 `Date` 生态里**唯一能按任意 IANA 时区展示**的官方手段（`new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Tokyo' })`）。性能提示：`Intl` 对象构造昂贵，应当**复用实例**而不是在循环里 `new`。本册只讲它与日期的交叉，语言区域细节请见国际化分册 [`33_intl/01_intl_overview.js`](33_intl/01_intl_overview.js)。也见 [Intl.RelativeTimeFormat（相对时间格式化）](#intlrelativetimeformat相对时间格式化)。

示例：[`22_date_and_time/08_intl_datetimeformat.js`](22_date_and_time/08_intl_datetimeformat.js)

### Intl.RelativeTimeFormat（相对时间格式化）

把「3 天前」「in 2 hours」这类**相对时间**本地化的格式化器：`new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' }).format(-3, 'day')` 得到「3天前」。关键细节：它**不做计算**，只做措辞 —— 「几天前」必须你自己用时间戳相减、再决定用什么单位（秒/分/时/天/月/年）并且处理单复数与阈值。常见误解是以为它能自动选单位；实际项目中通常要写一个「按差值大小挑选单位」的辅助函数。也见 [Intl.DateTimeFormat（国际化日期格式化）](#intldatetimeformat国际化日期格式化)。

示例：[`22_date_and_time/08_intl_datetimeformat.js`](22_date_and_time/08_intl_datetimeformat.js)

### Temporal API（Temporal 日期时间 API）

TC39 设计的 `Date` 替代品（已进入 Stage 3，V8 需要 `--harmony-temporal` 或 polyfill），用一套职责单一的不可变类型彻底解决 `Date` 的混乱：`Temporal.Instant`（绝对时刻，纳秒精度）、`Temporal.ZonedDateTime`（时刻 + IANA 时区，自带夏令时规则）、`Temporal.PlainDateTime`/`PlainDate`/`PlainTime`（不带时区的墙上时间）、`Temporal.Duration`（时间段）、`Temporal.Now`（带时区取当前）。它的对象**全部不可变**，`add`/`subtract` 返回新对象，显式区分「日历运算」和「时刻运算」，并且内置 `withCalendar`、`until`、`round` 等 `Date` 完全没有的能力。迁移提示：`Temporal` 尚未在所有运行时可用，写库时必须特性检测（`typeof Temporal === 'undefined'`）或引入 polyfill，注意 polyfill 体积较大。也见 [Date（Date 对象）](#datedate-对象)。

示例：[`22_date_and_time/09_date_temporal_api.js`](22_date_and_time/09_date_temporal_api.js)

### Monotonic Clock（单调时钟）

只保证**单调不减**、不受系统校时影响的计时来源，浏览器与 Node 里的实现是 `performance.now()`（返回自 `timeOrigin` 起的毫秒小数）。它和 `Date.now()` 的分工是：**测耗时用 `performance.now()`，表达时刻用 `Date.now()`**。关键细节：`Date.now()` 可能因为 NTP 回拨而变小，用两段 `Date.now()` 相减甚至能算出负数；`performance.now()` 的分辨率会被引擎有意粗化（Spectre 缓解），跨进程比较无意义（各进程 `timeOrigin` 不同）；需要绝对时刻时可以算 `performance.timeOrigin + performance.now()`。也见 [Monotonic vs Wall Clock（单调时钟与墙上时钟）](#monotonic-clock单调时钟)。

示例：[`22_date_and_time/02_timestamp.js`](22_date_and_time/02_timestamp.js)

## 集合类型（23_collections）

### Map（映射 / 键值集合）

键可以是**任意类型**（对象、函数、`NaN`、`Symbol`）的键值集合，按**插入顺序**迭代，用 `size` 取元素个数，增删查平均 O(1)。它和 `Object` 的核心分歧在于：`Object` 的键只能是字符串或 Symbol（其余会被 `String()` 强转，`obj[{a:1}]` 实际存在 `"[object Object]"` 下），且 `Object` 会继承原型上的属性、需要用 `Object.create(null)` 或 `hasOwnProperty` 才能安全当字典用。判断键存在必须用 `map.has(k)` 而不是 `map.get(k) !== undefined` —— 因为值本身可能就是 `undefined`。也见 [Map vs Object（Map 与 Object 的取舍）](#map-vs-objectmap-与-object-的取舍)、[SameValueZero（SameValueZero 相等算法）](#samevaluezerosamevaluezero-相等算法)。

示例：[`23_collections/01_map_basics.js`](23_collections/01_map_basics.js)

### Set（集合 / 唯一值集合）

只存**不重复**元素的可迭代集合，同样按插入顺序迭代（注意：这不是数学集合的「无序」语义，`Set` 明确保证顺序）。最常用的场景是数组去重：`[...new Set(arr)]`，比 `filter + indexOf` 的 O(n²) 快得多。三个易错点：`new Set([1, 1, 2])` 的 `size` 是 `2`，但含对象的 `Set` 不会去重内容相同的不同对象（引用比较）；`Set` 没有索引，取第 n 个元素要 `[...set][n]`（O(n)，频繁按下标访问说明该用数组）；`NaN` 会被去重成一个（`SameValueZero` 的功劳），而 `+0` 与 `-0` 被视为同一个元素。也见 [Set vs Array（Set 与 Array 的取舍）](#set-vs-arrayset-与-array-的取舍)、[SameValueZero（SameValueZero 相等算法）](#samevaluezerosamevaluezero-相等算法)。

示例：[`23_collections/03_set_basics.js`](23_collections/03_set_basics.js)

### WeakMap（弱键映射）

键**必须是对象**（ES2023 起也允许非注册的 Symbol），值是任意类型；它对键持**弱引用**，键对象没有其他强引用时会被垃圾回收，对应条目**自动消失**。代价是它**不可遍历、没有 `size`、没有 `clear`、没有 `keys()`**，因为你无法安全地枚举一个随时会变的集合。典型用途：给对象挂「私有数据」（不想暴露成属性）、DOM 节点的元数据、以对象为键的缓存（对象死了缓存自动清理，天然不泄漏）。注意 ES2023 之前用 Symbol 当键会抛 `TypeError`，旧环境需要特性检测。也见 [Map（映射 / 键值集合）](#map映射-键值集合)、[Weak Reference（弱引用）](#weak-reference弱引用)。

示例：[`23_collections/05_weakmap.js`](23_collections/05_weakmap.js)

### WeakSet（弱引用集合）

元素**必须是对象**的集合，对元素持弱引用，同样不可遍历、没有 `size`。它的语义是「给对象打一个不阻止回收的临时标记」，典型用途有：图遍历的「已访问」集合（遍历结束集合自动清空，不会因为 visited 集合而泄漏整张图）、「这个对象已经初始化过」的一次性标记、事件去重。常见误解是把它当「可以自动清理的 `Set`」来存业务数据 —— 由于不可遍历也不可计数，你**无法知道里面有什么**，只能回答 `has()`；需要读取内容就应该用 `Map`/`Set` 配合显式清理。也见 [WeakMap（弱键映射）](#weakmap弱键映射)。

示例：[`23_collections/06_weakset.js`](23_collections/06_weakset.js)

### SameValueZero（SameValueZero 相等算法）

`Map`/`Set`/`WeakMap`/`WeakSet` 判定键是否相同的内部算法：在 `===` 的基础上做两处修改 —— **`NaN` 等于自身**，且 **`+0` 与 `-0` 视为同一个值**。三条实用推论：(1) `new Set([NaN, NaN]).size === 1`，`new Map().set(NaN, 1).get(NaN) === 1`；(2) `new Set([+0, -0]).size === 1`；(3) 它不同于 `Object.is`（`Object.is(NaN, NaN)` 为 `true`，但 `Object.is(+0, -0)` 为 `false`），也不同于 `indexOf` 用的严格相等（所以 `[NaN].indexOf(NaN)` 是 `-1`，而 `[NaN].includes(NaN)` 是 `true`，因为 `includes` 用的是 SameValueZero）。也见 [Map（映射 / 键值集合）](#map映射-键值集合)。

示例：[`23_collections/01_map_basics.js`](23_collections/01_map_basics.js)

### Set Operations（集合运算：并集/交集/差集/对称差集）

ES2025 为 `Set` 增加了原生方法：`a.union(b)`、`a.intersection(b)`、`a.difference(b)`、`a.symmetricDifference(b)`，以及谓词 `a.isSubsetOf(b)`、`a.isSupersetOf(b)`、`a.isDisjointFrom(b)`。在旧环境里只能手写，惯用写法是 `new Set([...a, ...b])`（并集）、`new Set([...a].filter(x => b.has(x)))`（交集）。关键细节：**所有运算都返回新 `Set`，不修改任何操作数**（这是最常被误解的一点）；`union`/`intersection`/`difference` 的结果顺序遵循**接收者**的插入顺序，`symmetricDifference` 则是「先 a 后 b」拼接。旧 Node 上用之前要先 `typeof Set.prototype.union === 'function'` 检测。

示例：[`23_collections/04_set_operations.js`](23_collections/04_set_operations.js)

### Set-like Protocol（类集合协议）

ES2025 集合运算方法的参数**不要求是 `Set`**，只要求符合「类集合（set-like）」形状：拥有 `size` 属性、`has(v)`、`keys()`（返回可迭代对象）三个成员。这带来很强的互操作性：`set.union(map)` 可以直接拿 `Map` 当集合用（`Map` 的 `keys()` 就是键集合），也可以传入自定义的 `SetLike` 对象、甚至用 `Set.prototype.union.call(自定义对象, other)` 借用。要注意的是**接收者**（`this`）必须是真正的 `Set`，只有**参数**才允许是任意类集合对象。

示例：[`23_collections/04_set_operations.js`](23_collections/04_set_operations.js)

### Map vs Object（Map 与 Object 的取舍）

选 `Map` 当**字典/缓存**：键是动态的、可能不是字符串、需要频繁增删、需要 `size`、需要稳定插入顺序。选 `Object` 当**结构体/记录**：字段名在写代码时就已知、需要 JSON 序列化（`JSON.stringify` 对 `Map` 输出 `{}`，必须先用 `Object.fromEntries(map)`）、需要字面量语法与解构、需要属性描述符与原型机制。性能上二者在现代 V8 里都是哈希表，差距不大，但 `Object` 在「固定形状（hidden class）」的热路径上更快；反过来说，把 `Object` 当无界缓存会导致 key 爆炸并退化成字典模式。三个额外差异：`Object` 键会被强转为字符串、`Object` 有原型链污染风险（`__proto__`）、`Object` 的整数键会**自动升序**排在字符串键前面，而 `Map` 严格按插入顺序。也见 [Map（映射 / 键值集合）](#map映射-键值集合)。

示例：[`23_collections/07_map_vs_object.js`](23_collections/07_map_vs_object.js)

### Set vs Array（Set 与 Array 的取舍）

`Array` 有序、有索引、允许重复，`indexOf`/`includes` 是 O(n)；`Set` 无索引、元素唯一，`has` 是 O(1)。因此「去重」「判断存在」「集合运算」用 `Set`，而「按下标随机访问」「需要 `map`/`filter`/`sort` 等变换」「需要 JSON 数组形态」用 `Array`。实战里二者经常配合：`[...new Set(arr)]` 去重后再排序；或者先用 `Set` 建立索引加速，再回到数组遍历。常见误解是以为 `Set` 的迭代顺序是「无序」的 —— 规范明确保证**插入顺序**，`delete` 后重新 `add` 会排到末尾（这正是 LRU 实现的基础）。

示例：[`23_collections/08_set_vs_array.js`](23_collections/08_set_vs_array.js)

### Insertion Order（插入顺序）

`Map`/`Set` 的迭代顺序**严格等于插入顺序**，并且覆盖写（`set` 已存在的键）**不会**改变原有位置，而「先 `delete` 再 `set`」会把它挪到末尾。这条性质是实现 LRU 缓存的关键：命中时 `delete + set` 把条目移到队尾，淘汰时取 `map.keys().next().value` 就是最久未使用的键。对比之下，普通 `Object` 的顺序是三段式：整数样式的键升序在前，然后是字符串键按插入顺序，最后是 Symbol 键。也见 [LRU Cache（LRU 缓存）](#lru-cachelru-缓存)。

示例：[`23_collections/02_map_iteration.js`](23_collections/02_map_iteration.js)

### Map Iteration（Map 遍历与数组互转）

`Map` 的 `keys()`/`values()`/`entries()` 都返回迭代器，`entries()` 是默认迭代器（所以 `for (const [k, v] of map)` 直接可用）；转为数组用 `[...map]`（得到 `[k, v]` 数组的数组）、`[...map.keys()]`、`Object.fromEntries(map)`；从数组构造用 `new Map([[k, v], ...])`。关键细节：遍历时**删除**当前或未访问的条目是安全的，但遍历中**新增**的条目可能被访问到（规范规定新增条目「同一轮迭代中不保证被访问」），所以不要在遍历里修改集合结构 —— 需要修改时先 `[...map]` 快照。也见 [Iterable（可迭代协议）](#iterable可迭代协议)。

示例：[`23_collections/02_map_iteration.js`](23_collections/02_map_iteration.js)

### Iterable（可迭代协议）

对象实现 `Symbol.iterator` 方法、返回一个带 `next()` 的迭代器，就能被 `for...of`、展开运算符 `...`、解构、`Array.from`、`Promise.all` 消费。`Map`/`Set`/`Array`/`String`/定型数组/生成器都是可迭代的，因此它们能直接互换使用（`new Map(anotherMap)`、`new Set(array)`、`[...set]`）。关键细节：`Map`/`Set` 是**一次性迭代器**（`map[Symbol.iterator]() === map` 返回自身，迭代器就是集合本身，多个 `for...of` 会各自从头开始，因为每次都调用 `Symbol.iterator` 拿到新迭代器），而生成器对象是**一次性**的（迭代完就 `done`，不能重来）。`Object` **不是**可迭代的，这正是不引入 `Object.entries` 就没法 `for...of` 遍历对象的原因。详细协议见 [`17_iterators_and_generators/01_iterable_protocol.js`](17_iterators_and_generators/01_iterable_protocol.js)。也见 [Map Iteration（Map 遍历与数组互转）](#map-iterationmap-遍历与数组互转)。

示例：[`23_collections/02_map_iteration.js`](23_collections/02_map_iteration.js)

### Weak Reference（弱引用）

一种**不阻止垃圾回收**的引用：只要有强引用链存在，对象就活着；一旦只剩弱引用，对象就可以被回收。JS 里表达弱引用的手段有三种：`WeakMap` 的键、`WeakSet` 的元素、`WeakRef` 的 `deref()`。它们的共同点是**不可观测**——你不能枚举、不能计数、不能知道回收发生的时刻，因为「知道」本身就要求一条强引用。也因此规范允许引擎在对象明明还可达的情况下也不回收（活性只是「可能」而非「必然」）。也见 [WeakRef](#weakref弱引用对象)、[FinalizationRegistry（终结注册表）](#finalizationregistry终结注册表)。

示例：[`23_collections/05_weakmap.js`](23_collections/05_weakmap.js)

### WeakRef（弱引用对象）

ES2021 引入的「把弱引用变成一等值」的 API：`new WeakRef(target)` 创建一个不阻止回收的引用，唯一读取方式是 `ref.deref()` —— 目标还活着就返回它，已被回收就返回 `undefined`。它和 `WeakMap` 的区别是：`WeakMap` 的弱引用**隐式**绑定在键上，`WeakRef` 让弱引用本身可以传来传去、放进数组、当参数。硬性限制：目标必须是对象（原始值抛 `TypeError`）；对象上**没有** `target` 属性，绕不过 `deref()`；`deref()` 返回 `undefined` **不等于**「刚被回收」，也可能只是还没被回收。最重要的纪律是：**绝不能把业务逻辑建立在「回收一定会发生」之上**，`WeakRef` 只适合做「可选加速」（缓存、索引），不能做「必须命中」的数据源。也见 [Weak Reference（弱引用）](#weak-reference弱引用)。

示例：[`23_collections/10_weakref_and_finalization.js`](23_collections/10_weakref_and_finalization.js)

### FinalizationRegistry（终结注册表）

ES2021 引入的「对象被回收之后执行回调」机制：`new FinalizationRegistry(heldValue => {...})` 创建注册表，`registry.register(target, heldValue)` 登记，`registry.unregister(token)` 取消（`token` 是 `register` 的返回值）。回调参数是登记时传入的 `heldValue`，**不能是 `target` 本身**（否则形成强引用，对象永远不回收）；`heldValue` 可以是原始值或另一个独立对象。最关键的一条纪律：**触发时机完全由引擎决定** —— 规范不保证回调会执行、不保证顺序、允许进程结束前一次都不执行，所以它只能作为「尽力而为」的兜底（比如内存泄漏告警），真正的资源释放必须靠显式的 `try...finally` / `close()` / `dispose()`。也见 [WeakRef](#weakref弱引用对象)。

示例：[`23_collections/10_weakref_and_finalization.js`](23_collections/10_weakref_and_finalization.js)

### LRU Cache（LRU 缓存）

「最近最少使用」淘汰策略的缓存，用 `Map` 可以在十几行内实现：`get` 命中时先 `delete` 再 `set` 把键移到末尾（标记为最近使用），`set` 时若 `map.size > capacity` 就删掉 `map.keys().next().value`（队首 = 最久未使用）。之所以能这么简洁，是因为 `Map` 同时提供了 **O(1) 的删除**和**严格插入顺序的迭代**这两件事，普通 `Object` 做不到（整数键会被重排）。常见误解是把它当成「按时间过期」的缓存 —— LRU 只按访问顺序淘汰，与元素年龄无关。其他相关实战（频次统计、邻接表、缓存）见同目录示例。也见 [Insertion Order（插入顺序）](#insertion-order插入顺序)。

示例：[`23_collections/09_map_practical.js`](23_collections/09_map_practical.js)

## 二进制数据（24_typed_arrays）

### ArrayBuffer（字节缓冲区）

一块**定长、原始、不可直接读写**的内存区域，构造时 `new ArrayBuffer(byteLength)` 指定字节数，只能通过 `byteLength`、`slice()`（**复制**）、`isView()` 等少数接口操作。要读写内容必须**在其上建一个「视图」**（定型数组或 `DataView`），这是 JS 二进制模型「缓冲区与视图分离」的核心设计。ES2024 新增了可调整大小的缓冲区：`new ArrayBuffer(n, { maxByteLength })` + `buffer.resize(m)`，以及 `buffer.transfer()` 把内存所有权移走（原缓冲区变成 **detached**，`byteLength` 变 0，再建视图会抛 `TypeError`）。也见 [View vs Buffer（视图与缓冲区的分离）](#view-vs-buffer视图与缓冲区的分离)、[TypedArray（定型数组）](#typedarray定型数组)。

示例：[`24_typed_arrays/01_arraybuffer_basics.js`](24_typed_arrays/01_arraybuffer_basics.js)

### TypedArray（定型数组）

一族共享同一套方法但元素类型不同的构造函数，一共 **11 个**：`Int8Array`、`Uint8Array`、`Uint8ClampedArray`、`Int16Array`、`Uint16Array`、`Int32Array`、`Uint32Array`、`Float32Array`、`Float64Array`、`BigInt64Array`、`BigUint64Array`。它们本身**不拥有内存**，只是 `ArrayBuffer` 上的视图（`ta.buffer` 拿到缓冲区、`ta.byteOffset` 拿到起始偏移、`ta.length` 是元素个数、`ta.BYTES_PER_ELEMENT` 是元素字节宽度）。与普通数组的关键差异：**长度固定**（不能 `push`）、**写入时按类型回绕或舍入**（不是报错）、`sort()` 默认就是**数值排序**（普通数组默认按字符串排）、`map`/`filter`/`slice` 返回**新的定型数组**而不是普通数组、越界读取返回 `undefined` 但越界写入**静默丢弃**（不报错，这是极常见的排查黑洞）。`Uint8Array` 和普通数组还有一个重要区别：`new Uint8Array(arr)` 会**复制**，而 `new Uint8Array(ta.buffer)` 是**共享**。也见 [Overflow Wraparound（溢出回绕）](#overflow-wraparound溢出回绕)、[Endianness（字节序）](#endianness字节序)。

示例：[`24_typed_arrays/03_typed_array_types.js`](24_typed_arrays/03_typed_array_types.js)

### TypedArray Methods（定型数组的方法）

大部分数组方法在定型数组上都可用，但返回类型不同：`map`/`filter`/`slice`/`subarray` 中前三个返回**新的定型数组**（同类型，`filter` 的结果长度可能变短），而 `subarray(a, b)` 返回**共享同一块内存的子视图**（改它会改原数组，`slice` 才是复制）。`set(source, offset)` 把另一个数组/定型数组的数据**复制**进来，是视图间搬数据最快的方式（比逐个赋值快得多）。因为长度固定，`push`/`pop`/`shift`/`splice` 一律不存在；`concat` 也返回普通数组。也见 [View vs Buffer（视图与缓冲区的分离）](#view-vs-buffer视图与缓冲区的分离)。

示例：[`24_typed_arrays/04_typed_array_methods.js`](24_typed_arrays/04_typed_array_methods.js)

### DataView（数据视图）

`ArrayBuffer` 上的另一种视图，与定型数组互补：它不是「同类型元素的数组」，而是一组**显式指定字节偏移和字节序**的读写方法 —— `getInt16(offset, littleEndian)`、`getUint32`、`getFloat64`、`getBigInt64` 及对应的 `setXxx`。它有两个定型数组给不了的能力：**逐次指定字节序**（定型数组只能用平台原生字节序，实际上永远是**小端**，读网络序/大端文件就会错）和**在任意偏移读写**（不需要满足对齐，定型数组的偏移必须是 `BYTES_PER_ELEMENT` 的整数倍）。因此解析二进制文件格式、网络协议包时首选 `DataView`；需要高性能批量数值运算时才换成定型数组。也见 [Endianness（字节序）](#endianness字节序)。

示例：[`24_typed_arrays/02_dataview.js`](24_typed_arrays/02_dataview.js)

### Byte（字节）

8 位（bit）一组的存储单位，是二进制数据处理的基本粒度；1 字节可表示 `0~255` 的无符号数或 `-128~127` 的有符号数。JS 里最常用的字节视图是 `Uint8Array`（同时也是 `Buffer` 的基类），单位换算要注意：`1 KB = 1024 字节`（JS 语境）与十进制的 `1000` 之间的差异是很多「文件大小对不上」的来源。也见 [Bit（位）](#bit位)、[TypedArray（定型数组）](#typedarray定型数组)。

示例：[`24_typed_arrays/01_arraybuffer_basics.js`](24_typed_arrays/01_arraybuffer_basics.js)

### Bit（位）

二进制的最小单位，取值为 0 或 1。JS 用位运算（`&`、`|`、`^`、`<<`、`>>`、`>>>`）操作 32 位整数，因此**位运算是处理「按位标志」（flags / bitmask）的标准手段**：`READ | WRITE` 组合权限、`flags & READ` 检测、`flags | READ` 置位、`flags & ~READ` 清位。两个坑：普通位运算会先把操作数转成**32 位有符号整数**，超过 2^31 的数值会被截断（大数据要用 `BigInt` 的位运算）；`>>>` 是无符号右移（结果非负），`>>` 是带符号右移（负数会补 1）。

示例：[`24_typed_arrays/09_binary_file_parsing.js`](24_typed_arrays/09_binary_file_parsing.js)

### Endianness（字节序）

多字节数值在内存/文件里的字节排列顺序：**大端（big-endian）**把最高有效字节放前面（`0x0102` 存成 `01 02`，网络字节序与许多文件格式用它），**小端（little-endian）**把最低有效字节放前面（`0x0102` 存成 `02 01`，x86/ARM 等主流 CPU 用它）。这是二进制解析里最容易静默出错的地方：读出来的数不对但程序不报错，只是数值荒谬（比如长度字段变成 16777216）。JS 的规则是：**定型数组一律用平台原生字节序**（现实中都是小端），**只有 `DataView` 的 `littleEndian` 参数能逐次指定**；所以凡是格式文档写了「big-endian」的数据，就必须用 `DataView` 或手动倒字节。也见 [DataView（数据视图）](#dataview数据视图)。

示例：[`24_typed_arrays/02_dataview.js`](24_typed_arrays/02_dataview.js)

### View vs Buffer（视图与缓冲区的分离）

JS 二进制模型的核心抽象：`ArrayBuffer` 是**内存**（不关心怎么解释），视图是**解读方式**（不关心内存从哪来）。由此产生三条必须记住的语义：(1) 在同一个 `ArrayBuffer` 上建多个视图，它们**共享内存、互相可见**，写一个另一个立刻变（多视图共享是零拷贝解析的基础）；(2) `new Uint8Array(ta)` 是**复制**，`new Uint8Array(ta.buffer, byteOffset, len)` 才是**共享** —— 只差一个 `.buffer`，行为完全不同；(3) 缓冲区被 `transfer` 或结构化克隆转移后会变成 **detached**，此时 `byteLength === 0`，在它上面建视图会抛 `TypeError`。也见 [ArrayBuffer（字节缓冲区）](#arraybuffer字节缓冲区)、[SharedArrayBuffer（共享内存缓冲区）](#sharedarraybuffersab共享内存缓冲区)。

示例：[`24_typed_arrays/05_multiple_views.js`](24_typed_arrays/05_multiple_views.js)

### SharedArrayBuffer（SAB，共享内存缓冲区）

一种可以在多个「代理（agent）」（主线程与各个 Worker）之间**真正共享**的内存，而不像普通 `ArrayBuffer` 那样只能转移（转移是「给出去」而不是「一起用」）。它是 `Atomics`（原子操作）存在的理由：并发读写同一块内存会产生**数据竞争**，必须靠 `Atomics.load`/`store`/`add`/`wait`/`notify` 或 `Atomics.Mutex` 类模式来同步。使用限制：浏览器里需要跨源隔离头（`Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`）才会把 `SharedArrayBuffer` 暴露给页面，Node 里则直接可用；它**不能**被 transfer/detach，`slice()` 是复制。Node 侧的 worker + 共享内存 + Atomics 示例见 [`26_node_core/17_shared_memory_and_atomics.js`](26_node_core/17_shared_memory_and_atomics.js)。也见 [View vs Buffer（视图与缓冲区的分离）](#view-vs-buffer视图与缓冲区的分离)。

示例：[`24_typed_arrays/05_multiple_views.js`](24_typed_arrays/05_multiple_views.js)

### Overflow Wraparound（溢出回绕）

定型数组写入超出类型范围的值时，**不报错也不夹紧**，而是按 2 的位宽取模回绕：`new Uint8Array(1)[0] = 256` 得到 `0`、`= 257` 得到 `1`、`= -1` 得到 `255`；`Int8Array` 同理（`= 128` 得到 `-128`）。浮点类型例外：`Float32Array` 溢出得到 `±Infinity`，精度不足则舍入。这个行为极易造成静默 bug（比如从颜色分量 `-1` 算出来的 `255` 看起来「还挺合理」），所以**写入前先自己钳制**是必要的防御；而 `Uint8ClampedArray` 正是规范为图像场景提供的「不回绕」版本。也见 [Uint8ClampedArray（夹紧型 8 位无符号数组）](#uint8clampedarray夹紧型-8-位无符号数组)。

示例：[`24_typed_arrays/03_typed_array_types.js`](24_typed_arrays/03_typed_array_types.js)

### Uint8ClampedArray（夹紧型 8 位无符号数组）

`Uint8Array` 的变体，写入时把值**夹紧（clamp）**到 `0~255` 而不是按 256 取模，并且小数部分用**四舍六入五取偶**（round-half-to-even，即「银行家舍入」）：`300 → 255`、`-5 → 0`、`1.5 → 2`、`2.5 → 2`、`128.5 → 128`。它是 `Canvas` 的 `ImageData.data` 的类型，也是 `WebGL`/`WebGPU` 常用的像素缓冲类型 —— 因为像素分量天然要求「越界的亮/暗被截断」而不是「亮到极致反而变黑」。注意它**只影响写入**，读出来永远是 `0~255` 的整数。也见 [Overflow Wraparound（溢出回绕）](#overflow-wraparound溢出回绕)。

示例：[`24_typed_arrays/03_typed_array_types.js`](24_typed_arrays/03_typed_array_types.js)

### TextEncoder / TextDecoder（文本编解码器）

`TextEncoder` 把字符串编码成 `Uint8Array`（**只支持 UTF-8，且不接受编码参数**），`TextDecoder` 把字节解码回字符串（支持 `'utf-8'`、`'utf-16le'`、`'gbk'`、`'iso-8859-1'` 等多种标签，取决于运行时是否带完整 ICU）。三个关键点：(1) 解码非法字节序列时默认**不抛错**，而是插入替换字符 `U+FFFD`（`�`），需要严格模式要传 `{ fatal: true }`；(2) 处理**分块数据**（网络流、大文件）时必须用 `decoder.decode(chunk, { stream: true })`，否则一个多字节字符被切成两半时会解成 `�`；(3) `TextEncoder` 遇到孤立代理项（lone surrogate）会编码成 `U+FFFD`，不是原样保留。也见 [UTF-8](#utf-8utf-8-编码)、[Code Unit（码元）](#code-unit码元)。

示例：[`24_typed_arrays/06_textencoder_decoder.js`](24_typed_arrays/06_textencoder_decoder.js)

### UTF-8（UTF-8 编码）

Unicode 的一种**变长**编码：ASCII 字符 1 字节，拉丁/希腊/西里尔字母 2 字节，中日韩汉字 3 字节，emoji 等补充平面字符 4 字节。它是 Web 与 Node 的默认文本编码（HTTP、JSON、HTML 默认都是 UTF-8），且与 ASCII 向后兼容。与 JS 字符串的差异是最大的坑：**JS 字符串是 UTF-16 码元序列**，所以 `'😀'.length === 2`（两个代理项）而 `new TextEncoder().encode('😀').length === 4`（四个字节），`'中'.length === 1` 而字节长度是 3。处理二进制协议里的「长度字段」时，一定要明确它数的是**字节**还是**字符**。也见 [Code Unit（码元）](#code-unit码元)。

示例：[`24_typed_arrays/06_textencoder_decoder.js`](24_typed_arrays/06_textencoder_decoder.js)

### Code Unit（码元）

**码点**是 Unicode 给每个字符的编号（`U+1F600`），**码元**是编码里用于存储的最小单位：UTF-16 的码元是 16 位，所以基本平面外的字符（码点 > `U+FFFF`）需要**一对代理项（surrogate pair）**表示，这也是 JS 里 `'😀'.length === 2`、`str[0]` 拿到半个字符、`slice()` 可能切碎 emoji 的根本原因。安全遍历字符应使用 `for...of`、展开运算符或 `Array.from(str)`（它们按**码点**迭代），更严谨的字素簇切分则要 `Intl.Segmenter`。字符串侧细节见 [`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)。也见 [UTF-8](#utf-8utf-8-编码)。

示例：[`24_typed_arrays/06_textencoder_decoder.js`](24_typed_arrays/06_textencoder_decoder.js)

### Buffer（Node.js 的字节缓冲区）

Node.js 的二进制主力类型，**是 `Uint8Array` 的子类**，因此定型数组的所有方法都能用，同时还带来一套链式、支持编码参数的独有 API（`toString('base64')`、`writeUInt32BE`、`equals`、`indexOf` 等）。三种创建方式语义完全不同：`Buffer.from(...)` 从字符串/数组/`ArrayBuffer` 创建（**从定型数组拷贝，从 `ArrayBuffer` 共享**），`Buffer.alloc(n)` 分配并**清零**（安全），`Buffer.allocUnsafe(n)` 分配但**不清零**（更快，可能读到进程之前用过的内存，属于安全风险）。`Buffer.from('中文')` 默认按 UTF-8 编码，`Buffer.concat([...])` 拼接多个 Buffer。也见 [Uint8Array 与 Buffer 的关系](#uint8array-与-buffer-的关系)、[Memory Pool（内存池）](#memory-pool内存池)。

示例：[`24_typed_arrays/07_node_buffer.js`](24_typed_arrays/07_node_buffer.js)

### Uint8Array 与 Buffer 的关系

`Buffer` 继承自 `Uint8Array`，所以 `buf instanceof Uint8Array === true`，两者可以互相传递（Web API 如 `fetch`、`Blob`、`crypto.subtle` 都接受 `Buffer`）。差异在**边角**：`Buffer` 有 `toString('hex')`、`writeUInt32BE` 这类编码感知方法，`Uint8Array` 有 `Symbol.iterator` 之外的完整定型数组语义；`Buffer.from(arrayBuffer)` **共享**内存，而 `Buffer.from(uint8Array)` **复制**数据；`new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)` 是零拷贝互转的常用手法（注意漏掉 `byteOffset` 会读到池子开头）。写跨环境库时推荐内部统一用 `Uint8Array`，只在 Node 专属路径上用 `Buffer` 的编码方法。也见 [Buffer（Node.js 的字节缓冲区）](#buffernodejs-的字节缓冲区)。

示例：[`24_typed_arrays/07_node_buffer.js`](24_typed_arrays/07_node_buffer.js)

### Memory Pool（内存池）

Node 为了减少系统调用，会在启动时准备一块 **8 KiB** 的内存池（`Buffer.poolSize`，默认 `8192`），凡是 `Buffer.allocUnsafe(n)` 且 `n < poolSize / 2`（即 4 KiB）的请求都从池子里**切一块**出来，而不是单独向系统申请。这带来两个可观测的后果：(1) 小 Buffer 的 `buf.buffer` 是一整块 8 KiB 大内存、`buf.byteOffset` 不为 0 —— 所以 `new Uint8Array(buf.buffer)` 会多出一堆无关字节，正确写法必须带上 `byteOffset` 和 `byteLength`；(2) `allocUnsafe` 拿到的内存可能残留**上一次使用**的数据（包括敏感信息），这就是它「unsafe」的含义，必须立刻 `fill(0)` 或改用 `Buffer.alloc`。也见 [Buffer（Node.js 的字节缓冲区）](#buffernodejs-的字节缓冲区)。

示例：[`24_typed_arrays/07_node_buffer.js`](24_typed_arrays/07_node_buffer.js)

### Base64（Base64 编码）

把任意字节流映射到 64 个可打印字符（`A-Z a-z 0-9 + /`）的编码，**每 3 字节变成 4 个字符**（体积膨胀约 4/3 = 33%），不足 3 字节的末尾用 `=` 补齐。用途是让二进制数据能安全地穿过只支持文本的通道（JSON 字段、HTML 属性、邮件正文、`data:` URL）。两条最容易误解的地方：**Base64 不是加密**，它不提供任何机密性，只是「换个写法」，拿来存密码等同于明文；**它也不是压缩**，体积只会变大。浏览器侧是 `btoa`/`atob`，但它们**只接受 Latin-1** —— 编码含中文的字符串必须先 `new TextEncoder().encode(s)` 拿到字节再转；Node 侧直接 `Buffer.from(s).toString('base64')`。也见 [base64url](#base64urlurl-安全的-base64)、[Hex（十六进制）](#hex十六进制)。

示例：[`24_typed_arrays/08_binary_encoding.js`](24_typed_arrays/08_binary_encoding.js)

### base64url（URL 安全的 Base64）

Base64 的 URL 安全变体：把 `+` 换成 `-`、`/` 换成 `_`，并**去掉末尾的 `=` 填充**，因为 `+`、`/`、`=` 在 URL 和文件名里需要百分号转义，放进 JWT、`data:` URI 或查询参数会出问题。转换本身不改变数据，只是换字符表，两种表示可以无损互转（Node 里 `buf.toString('base64url')` 直接支持）。实战中 JWT 的三段（header/payload/signature）用的就是 base64url，解析时要用支持 base64url 的解码器而不是普通 `atob`（否则 `-`/`_` 会解码失败）。也见 [Base64（Base64 编码）](#base64base64-编码)。

示例：[`24_typed_arrays/08_binary_encoding.js`](24_typed_arrays/08_binary_encoding.js)

### Hex（十六进制）

用两个字符（`0-9a-f`）表示一个字节的文本化写法，体积正好是字节数的 2 倍，因为与二进制**一位对四位**的天然对应关系，是人读字节最方便的格式（调试输出、哈希值、颜色值、dump）。转换方法：`buf.toString('hex')`、`Buffer.from(hexStr, 'hex')`、`Uint8Array.from(hexStr.match(/../g), b => parseInt(b, 16))`。三个坑：`parseInt('0x10')` 与 `parseInt('10', 16)` 结果不同（前者靠前缀自动识别进制，会被 `parseInt('08')` 这类历史行为坑）；十六进制字符串**大小写不敏感**，比较时先 `toLowerCase()`；奇数长度的 hex 字符串无法还原成完整字节。也见 [Base64（Base64 编码）](#base64base64-编码)。

示例：[`24_typed_arrays/08_binary_encoding.js`](24_typed_arrays/08_binary_encoding.js)

### Blob（Binary Large Object，二进制大对象）

Web 平台对「一块**不可变**的二进制数据」的抽象，构造方式 `new Blob(parts, { type })`，`parts` 可以是字符串、`ArrayBuffer`、任何 `ArrayBufferView`（含 `Uint8Array`、`DataView`、`Buffer`）或另一个 `Blob`；`type` 是 MIME 类型。关键特征：读取方法是**异步**的（`await blob.arrayBuffer()`、`await blob.text()`、`await blob.bytes()`），因为大 Blob 可能被浏览器落到磁盘上；`blob.slice(a, b)` 返回**新的 Blob 视图**（不复制底层数据，支持负数下标）；`blob.size` 与 `blob.type` 是元数据。它同时是 `fetch`、`FormData`、`File`、`Response`、`URL.createObjectURL` 的通用「二进制信封」。两个常见误解：`new Blob([u8])` 会把字节**拷贝**进 Blob（之后改 `u8` 不影响 Blob，这其实是好事，避免了竞态）；`blob.text()` 对非 UTF-8 字节不报错，而是插入 `U+FFFD`。Node 18+ 也全局提供了 `Blob`。也见 [File（文件对象）](#file文件对象)、[Object URL（对象 URL）](#object-url对象-url)。

示例：[`24_typed_arrays/11_blob_and_binary_interop.js`](24_typed_arrays/11_blob_and_binary_interop.js)

### File（文件对象）

`File` 是 `Blob` 的**子类**，只多了三个元数据：`name`（文件名）、`lastModified`（毫秒时间戳）、`type`（MIME 类型）。因此**凡是接受 `Blob` 的 API 都能接受 `File`**（`FormData.append`、`fetch` body、`URL.createObjectURL`），反过来不成立。典型来源是 `<input type="file">` 的 `files` 列表和拖拽事件的 `dataTransfer.files`。注意 `File` 的内容只能异步读（继承自 `Blob`），而且用户选择的文件**不会**自动上传到任何地方，必须显式放进 `FormData` 或 `fetch`。也见 [Blob（二进制大对象）](#blobbinary-large-object二进制大对象)。

示例：[`24_typed_arrays/11_blob_and_binary_interop.js`](24_typed_arrays/11_blob_and_binary_interop.js)

### Object URL（对象 URL）

`URL.createObjectURL(blob)` 生成的一个形如 `blob:https://example.com/uuid` 的伪 URL，指向内存中的 Blob，可直接喂给 `<img src>`、`<video src>`、`<a href download>` 等只接受 URL 的地方。它比 `FileReader.readAsDataURL` 快得多，也省内存（不生成 base64 字符串）。**最经典的坑是内存泄漏**：这个 URL 会**一直持有 Blob 的强引用**，直到页面卸载或你显式调用 `URL.revokeObjectURL(url)`，所以每次 `createObjectURL` 都要配对一次 `revoke`（通常在图片 `onload` 后、组件卸载时）。另外它只在**同源**的当前文档内有效，不能跨标签页/跨进程传递。也见 [Blob（二进制大对象）](#blobbinary-large-object二进制大对象)。

示例：[`24_typed_arrays/11_blob_and_binary_interop.js`](24_typed_arrays/11_blob_and_binary_interop.js)

### CompressionStream / DecompressionStream（压缩流）

Web 标准提供的压缩/解压 API，本质是一对 `TransformStream`，把 `uint8array` 流进 `writable`、从 `readable` 读出压缩后的 `uint8array`；支持的格式只有 `'gzip'`、`'deflate'`、`'deflate-raw'` 三种（**不含 brotli**）。用法是管道式的：`stream.pipeThrough(new CompressionStream('gzip'))`。Node 侧另有功能更强的 `node:zlib`（`gzipSync`/`gunzipSync`/`brotliCompressSync`/`zstdCompressSync`、以及流式版本），常用于 HTTP 响应压缩与文件打包。安全提示：解压是**解压炸弹**的入口 —— 几 KB 的输入可以解出几十 GB，服务端必须限制解压后的总大小或设置超时。也见 [Blob（二进制大对象）](#blobbinary-large-object二进制大对象)。

示例：[`24_typed_arrays/10_compression.js`](24_typed_arrays/10_compression.js)

### Binary Format Parsing（二进制格式解析）

从字节流里按约定的布局读出结构化数据的过程，典型步骤是：先读**魔数（magic number）**校验文件类型，再读版本号、字段数、可变长字段的长度等头部信息，然后按偏移逐条解析记录，最后校验尾部。实现要点：**用 `DataView` 明确指定字节序**（格式文档写 big-endian 时必须显式传 `littleEndian = false`），用 `TextDecoder` 解字符串字段，并且**对每一个来自文件的长度/偏移做边界检查** —— 恶意的长度字段会让解析器越界读取或分配巨大内存（DoS）。实战中还要考虑对齐、可变长记录的循环终止条件，以及解析失败时给出「第几字节出错」的诊断信息。也见 [DataView（数据视图）](#dataview数据视图)、[Endianness（字节序）](#endianness字节序)。

示例：[`24_typed_arrays/09_binary_file_parsing.js`](24_typed_arrays/09_binary_file_parsing.js)

## 元编程：Proxy 与 Reflect（25_proxy_and_reflect）

### Metaprogramming（元编程）

编写「操作程序本身」的程序：反射（`Reflect`、`Object.getOwnPropertyDescriptor`）、动态生成代码（`eval`、`new Function`）、拦截并改写语言内置行为（`Proxy`）、装饰器与宏等都属于此列。JS 的元编程有两条腿：**内省（introspection）** —— 读取对象的结构与属性描述符；**拦截（intercession）** —— 改写属性访问、函数调用等基本操作的默认行为。`Proxy` + `Reflect` 是 ES2015 为「拦截」提供的官方机制：`Proxy` 定义拦截逻辑，`Reflect` 提供被拦截操作原本的默认实现，两者成对出现才能写出正确的代理。也见 [Proxy](#proxy代理对象)、[Reflect](#reflect反射对象)。

示例：[`25_proxy_and_reflect/01_proxy_basics.js`](25_proxy_and_reflect/01_proxy_basics.js)

### Proxy（代理对象）

`new Proxy(target, handler)` 创建的**包装对象**，它把对自身的操作转发到 `handler` 里对应的陷阱函数，未定义陷阱的操作则直接落到 `target` 上（这叫「默认透传」）。关键点：`proxy` **不是** `target` 的克隆，它自己几乎没有状态（内部只有 `[[ProxyTarget]]` 与 `[[ProxyHandler]]` 两个槽），所有读写最终都作用在 `target` 上，所以 `proxy !== target` 但 `proxy.x = 1` 之后 `target.x === 1`。代理可以包裹对象、数组、函数（此时 `typeof proxy === 'function'`、`proxy()` 会走 `apply` 陷阱）、甚至另一个代理。典型用途：数据校验、日志/埋点、响应式系统（Vue 3）、访问控制、虚拟对象（负索引、默认值）、按需加载。也见 [Trap（陷阱）](#trap陷阱)、[Invariant（不变量）](#invariant不变量)、[Proxy 的局限](#proxy-limitationsproxy-的局限)。

示例：[`25_proxy_and_reflect/01_proxy_basics.js`](25_proxy_and_reflect/01_proxy_basics.js)

### Handler（处理器）

传给 `Proxy` 构造函数的第二个参数，是一个普通对象（也可以是 `Proxy` 或 `Object.create(null)`），其属性名对应各种陷阱、属性值是陷阱函数。它**不需要穷举**所有陷阱：没写的操作会自动走 `target` 的默认行为（等价于 `Reflect.xxx(target, ...)`）。规范要求它是对象（传 `null` 会抛 `TypeError`，想表达「全默认」应传 `{}`），并且陷阱函数是从 handler 上**逐次读取**的 —— 因此 handler 自己也可以是代理，不过这会让性能成倍下降。也见 [Trap（陷阱）](#trap陷阱)。

示例：[`25_proxy_and_reflect/01_proxy_basics.js`](25_proxy_and_reflect/01_proxy_basics.js)

### Trap（陷阱）

`handler` 上拦截某个内部方法的函数，名字与 `Reflect` 的静态方法**一一对应**，一共 13 个：`get`、`set`、`has`、`deleteProperty`、`ownKeys`、`getOwnPropertyDescriptor`、`defineProperty`、`getPrototypeOf`、`setPrototypeOf`、`isExtensible`、`preventExtensions`、`apply`、`construct`。每个陷阱都接收 `target` 作为第一个参数（`apply`/`construct` 略有不同），并通常把剩余参数原样转交给同名的 `Reflect` 方法以保留默认语义。陷阱里抛出的异常会直接冒泡给调用方，因此在 `set` 里做类型校验可以把「静默写入错误值」变成「立刻报错」。也见 [Reflect（反射对象）](#reflect反射对象)、[get trap](#get-trapget-陷阱)。

示例：[`25_proxy_and_reflect/02_get_set_traps.js`](25_proxy_and_reflect/02_get_set_traps.js)

### get trap（get 陷阱）

拦截**读取属性**（`proxy.x`、`proxy['x']`、解构、`in` 之外的几乎所有读取路径，包括方法调用时先取属性这一步），签名是 `get(target, key, receiver)`。三个要点：(1) `key` 可能是 `Symbol`（比如 `Symbol.toPrimitive`、`Symbol.iterator`、`Symbol.toStringTag`），所以陷阱里不要假设它是字符串；(2) `receiver` 是**最初接收访问的对象**，通常就是代理本身，把它传给 `Reflect.get(target, key, receiver)` 才能让继承来的 getter 里的 `this` 指向代理（响应式系统靠这一点实现深层追踪）；(3) 如果直接返回 `Reflect.get(target, key)` 而不传 `receiver`，getter 里的 `this` 会变回 `target`，嵌套属性就不会被追踪。也见 [Reflect（反射对象）](#reflect反射对象)、[Reactive（响应式）](#reactive响应式原理)。

示例：[`25_proxy_and_reflect/02_get_set_traps.js`](25_proxy_and_reflect/02_get_set_traps.js)

### set trap（set 陷阱）

拦截**写入属性**（`proxy.x = v`、`++proxy.n`、`Object.assign` 写入等），签名是 `set(target, key, value, receiver)`。它**必须返回布尔值**：返回 `false`（或在严格模式下被调用时）会让赋值抛 `TypeError`；返回 `undefined` 等同 `false`，这是「代理一创建就写不进任何东西」的经典原因（忘记 `return true`）。标准写法是 `return Reflect.set(target, key, value, receiver)`，让默认语义（包括 setter 调用、`receiver` 的传递、只读属性拒绝）原样保留；不要写成 `target[key] = value`，那样会绕过 setter 并把 `receiver` 丢掉。校验型代理就靠在这里比较新旧值并抛错来实现「拒绝非法写入」。也见 [get trap](#get-trapget-陷阱)、[Validation Proxy（校验型代理）](#validation-proxy校验型代理)。

示例：[`25_proxy_and_reflect/05_validation_proxy.js`](25_proxy_and_reflect/05_validation_proxy.js)

### has / deleteProperty traps（has 与 deleteProperty 陷阱）

`has(target, key)` 拦截 `key in proxy`（注意它**不拦截**读取，也不被 `Object.keys` 使用）；`deleteProperty(target, key)` 拦截 `delete proxy.key`，且必须返回布尔值表示是否删除成功。两者最常见的组合用途是「隐藏字段」：让 `'secret' in proxy` 返回 `false`、`delete` 之后连读取也返回 `undefined`，从而实现软删除/遮蔽。陷阱约束来自不变量：如果 `target` 有对应的**不可配置**自有属性，`has` 就必须返回 `true`，如果 `target` 不可扩展则不能凭空报告存在，`deleteProperty` 也不能删掉不可配置属性。注意 `for...in`、`Object.keys`、`JSON.stringify` 走的是 `ownKeys` + `getOwnPropertyDescriptor`，**不是** `has`，所以「隐藏」要在多处配合。也见 [ownKeys trap](#ownkeys-trapownkeys-陷阱)。

示例：[`25_proxy_and_reflect/03_has_delete_traps.js`](25_proxy_and_reflect/03_has_delete_traps.js)

### ownKeys trap（ownKeys 陷阱）

拦截**枚举自有键**，签名 `ownKeys(target)`，必须返回一个**数组**（元素是字符串或 Symbol），它是 `Object.keys`、`Object.getOwnPropertyNames`、`Object.getOwnPropertySymbols`、`for...in`、`JSON.stringify`、`Object.assign`、展开运算等一大票操作的第一步。不变量很严格：返回的列表必须包含 `target` 上**所有不可配置**的自有键；如果 `target` 不可扩展，则必须**恰好等于** `target` 的自有键（不能多也不能少）。常见坑是「不该出现的键」：只做 `ownKeys: () => ['a', 'b']` 却忘了 `target` 上还有别的可配置属性时行为正常，但一旦 `target` 被 `Object.freeze()`，代理就会开始抛 `TypeError`。另外，`JSON.stringify(proxy)` 还需要 `getOwnPropertyDescriptor` 配合返回**可枚举**的描述符，否则键会被过滤掉。也见 [has / deleteProperty traps](#has-deleteproperty-trapshas-与-deleteproperty-陷阱)。

示例：[`25_proxy_and_reflect/03_has_delete_traps.js`](25_proxy_and_reflect/03_has_delete_traps.js)

### apply / construct traps（apply 与 construct 陷阱）

当 `target` 是**函数**时，`apply(target, thisArg, argsList)` 拦截 `proxy(...)`、`proxy.call/apply`、`Reflect.apply`；`construct(target, argsList, newTarget)` 拦截 `new proxy(...)` 与 `Reflect.construct`。`apply` 里标准写法是 `return Reflect.apply(target, thisArg, args)`，`construct` 里是 `return Reflect.construct(target, args, newTarget)` —— 注意 `newTarget` 的传递，它决定了新对象用哪个 `prototype`（`Reflect.construct` 允许 `newTarget` 与 `target` 不同，这是 `Function.prototype.bind` 之外唯一能做到「借构造函数但换原型」的手段）。实用场景：给函数加缓存/节流/参数校验/埋点、把 `class` 包装成必须用 `new` 调用的形式、或者给构造函数做参数归一化。也见 [Trap（陷阱）](#trap陷阱)。

示例：[`25_proxy_and_reflect/04_apply_construct_traps.js`](25_proxy_and_reflect/04_apply_construct_traps.js)

### Invariant（不变量）

规范对每个陷阱施加的**强制约束**：代理不能对「不可配置 / 不可写 / 不可扩展」的目标说出与之矛盾的话，一旦违反就抛 `TypeError`。典型例子：`get` 不能为不可配置且不可写的自有数据属性返回不同的值；`has` 不能对不可配置的自有属性返回 `false`；`getPrototypeOf` 与 `setPrototypeOf` 在 `target` 不可扩展时被锁死；`isExtensible`/`preventExtensions` 不能与 `target` 的实际状态矛盾（所以 `preventExtensions` 必须先 `Reflect.preventExtensions(target)` 再返回 `true`）。设计意图是保住「代理不会打破 JS 对象模型的基本一致性」这一承诺。实践中的两个陷阱：`Object.freeze(proxy)` 或 `Object.preventExtensions(proxy)` 之后，之前宽松的陷阱会**突然开始抛错**；用 `Object.getOwnPropertyDescriptor` 校验型代理时，忘记处理不可配置属性会做出「看起来随机」的失败。也见 [Proxy（代理对象）](#proxy代理对象)。

示例：[`25_proxy_and_reflect/03_has_delete_traps.js`](25_proxy_and_reflect/03_has_delete_traps.js)

### Proxy.revocable（可撤销代理）

`Proxy.revocable(target, handler)` 返回 `{ proxy, revoke }` 两个字段，调用 `revoke()` 之后代理被**永久作废** —— 此后对它做任何操作（读、写、`in`、调用）都会抛 `TypeError`（"Cannot perform 'get' on a proxy that has been revoked"），但 `target` 本身不受影响，仍可正常使用。这是「能力回收」的经典实现：把代理交给第三方代码（插件、回调、`postMessage` 的另一端），需要时一句 `revoke()` 就能让它的所有句柄同时失效，比你手动维护一堆 `if (disposed)` 判断更可靠。注意 `revoke` 是**幂等**的（多次调用不报错），并且撤销后 `target` 若没有其他引用就会一起被回收（代理对 target 是强引用，但代理自己是弱可达的）。也见 [Proxy（代理对象）](#proxy代理对象)。

示例：[`25_proxy_and_reflect/05_validation_proxy.js`](25_proxy_and_reflect/05_validation_proxy.js)

### Proxy Limitations（Proxy 的局限）

代理不是「万能透明包装」，有四类硬性边界：(1) **性能开销** —— 每次属性访问都要多走一层陷阱函数，热路径上代价显著，陷阱越多越慢；(2) **内部槽（internal slots）** —— `Map`/`Set`/`Date`/`RegExp`/`Promise`/定型数组/`ArrayBuffer` 的状态不在属性里，方法内部会用「品牌检查（brand check）」确认 `this` 真的拥有那个内部槽，代理没有，于是调用即抛 `TypeError: Method Map.prototype.get called on incompatible receiver`；(3) **私有字段（`#field`）** —— 私有字段的可见性检查认的是「是不是声明它的那个类」，代理对象不是，一读就抛；(4) **透明性漏洞** —— `proxy !== target`、`structuredClone(proxy)` 抛 `DataCloneError`、Node 的 `util.types.isProxy` 能一眼识别。常见的临时解法是在 `get` 陷阱里把方法 `bind` 回 `target`，代价是 `proxy.fn === proxy.fn` 变成 `false`。也见 [Internal Slot（内部槽）](#internal-slot内部槽)、[Private Field and Proxy（私有字段与代理）](#private-field-and-proxy私有字段与代理)。

示例：[`25_proxy_and_reflect/10_proxy_limitations.js`](25_proxy_and_reflect/10_proxy_limitations.js)

### Transparent Proxy（代理的透明性）

「代理能否被当成目标本身使用」的问题，答案是**不能完全透明**：`proxy !== target`（引用不同）、`proxy === proxy` 但 `Object.getPrototypeOf(proxy) === Object.getPrototypeOf(target)` 只是因为在陷阱里转发了、`Object.prototype.toString.call(proxy)` 也未必一致、`structuredClone` 会因为「无法克隆代理」而抛错、Node 的 `util.types.isProxy(proxy)` 直接返回 `true`（浏览器没有对应手段，这正是它「不可检测」的另一面）。另一方面，有些操作**会穿透代理**：`Array.isArray(proxy)` 对数组目标的代理返回 `true`（它看的是目标的内部槽）。实践结论：代理适合「我自己可控的包装层」，不适合伪装成目标穿越不能控制边界的 API（`structuredClone`、`postMessage`、第三方库的 `instanceof` 检查等）。也见 [Proxy Limitations（Proxy 的局限）](#proxy-limitationsproxy-的局限)。

示例：[`25_proxy_and_reflect/10_proxy_limitations.js`](25_proxy_and_reflect/10_proxy_limitations.js)

### Reflect（反射对象）

ES2015 引入的全局对象，提供 **13 个静态方法**，与 13 个 `Proxy` 陷阱**严格一一对应**：`Reflect.get/set/has/deleteProperty/ownKeys/getOwnPropertyDescriptor/defineProperty/getPrototypeOf/setPrototypeOf/isExtensible/preventExtensions/apply/construct`。它存在的意义就是「把语言内部方法（internal methods）暴露成普通函数」，因此 `Proxy` 陷阱里调用 `Reflect.get(target, key, receiver)` 就等于「执行这一步的默认行为」，这是写代理的标准姿势。另外它是**工具函数集合而不是构造函数**（不能 `new Reflect()`，没有 `prototype`），方法都挂在对象本身上。也见 [Reflect vs Object](#reflect-vs-objectreflect-与-object-的差异)、[Internal Method（内部方法）](#internal-method内部方法)。

示例：[`25_proxy_and_reflect/08_reflect_api.js`](25_proxy_and_reflect/08_reflect_api.js)

### Internal Method（内部方法）

规范用 `[[Xxx]]` 记号描述对象上「引擎内部才有的操作与状态」：内部方法如 `[[Get]]`、`[[Set]]`、`[[HasProperty]]`、`[[Delete]]`、`[[OwnPropertyKeys]]`、`[[Call]]`、`[[Construct]]`、`[[GetPrototypeOf]]`；内部槽（internal slot）则是内部状态，如 `[[MapData]]`、`[[DateValue]]`、`[[PromiseState]]`、`[[TypedArrayName]]`。普通对象和代理**实现了同一套内部方法**，所以可以用同样的语法操作（这正是代理能生效的机制）；但**内部槽不同** —— 代理没有 `target` 的内部槽，所以 `Map.prototype.get` 这类方法在代理上会因为品牌检查失败而抛错。`Reflect` 的每个方法恰好对应一个内部方法，这就是「`Reflect` 和陷阱一一对应」的由来。也见 [Internal Slot（内部槽）](#internal-slot内部槽)、[Proxy Limitations（Proxy 的局限）](#proxy-limitationsproxy-的局限)。

示例：[`25_proxy_and_reflect/08_reflect_api.js`](25_proxy_and_reflect/08_reflect_api.js)

### Internal Slot（内部槽）

对象上**不可通过属性访问**的内部状态，只有对应的内置方法才能读到，例如 `Map` 的 `[[MapData]]`、`Date` 的 `[[DateValue]]`、`RegExp` 的 `[[RegExpMatcher]]`、`Promise` 的 `[[PromiseState]]`、定型数组的 `[[ViewedArrayBuffer]]`。它的存在解释了代理的第三类局限：`Map.prototype.get.call(proxyMap, k)` 会先做「品牌检查」确认 `this` 拥有 `[[MapData]]`，代理只有 `[[ProxyTarget]]`，于是立刻抛 `TypeError: Method Map.prototype.get called on incompatible receiver #<Map>`。绕法只有两条：在 `get` 陷阱里把方法 `bind(target)`（代价是函数身份每次都变），或者干脆别代理这类对象、改成手写包装类显式转发几个方法（更推荐）。也见 [Internal Method（内部方法）与内部槽](#internal-method内部方法)。

示例：[`25_proxy_and_reflect/10_proxy_limitations.js`](25_proxy_and_reflect/10_proxy_limitations.js)

### Private Field and Proxy（私有字段与代理）

类的私有字段 `#x` 的访问检查只认「当前执行的代码所属的类是否在 `receiver` 上声明了这个私有名」：代理对象的 `[[PrivateElements]]` 为空，所以在 `get` 陷阱里只要返回 `target` 上的方法（这些方法内部会读 `this.#x`，而 `this` 是代理），调用时就会抛 `TypeError: Cannot read private member #x from an object whose class did not declare it`。实用结论：**类实例上有私有字段时，不能直接代理该实例并转发它的方法**。可行的应对是：让方法在陷阱里 `bind(target)`、把私有数据改用 `WeakMap` 存放（WeakMap 的键是对象，代理和 target 是两个不同对象，仍要注意用哪个当键）、或者不代理实例而只在类的外部包一层显式的适配器。也见 [Proxy Limitations（Proxy 的局限）](#proxy-limitationsproxy-的局限)。

示例：[`25_proxy_and_reflect/10_proxy_limitations.js`](25_proxy_and_reflect/10_proxy_limitations.js)

### Reflect vs Object（Reflect 与 Object 的差异）

同名方法的两组 API，差异集中在四点：(1) **失败时的行为** —— `Object.defineProperty` / `Object.freeze` / `Object.getPrototypeOf` 失败会**抛错**，而 `Reflect.defineProperty` / `Reflect.preventExtensions` 返回**布尔值**，`Reflect.deleteProperty` 也返回布尔值（`delete` 在严格模式下会抛错），这让「探测而不中断」的写法成为可能，也是代理陷阱必须返回布尔值的原因；(2) **返回值** —— `Object.defineProperty` 返回**对象本身**，`Reflect.defineProperty` 返回 `true/false`；(3) **接收者参数** —— 只有 `Reflect.get/set` 有 `receiver` 参数，`Object` 版本没有；(4) **类型强转与键的覆盖范围** —— `Reflect.getPrototypeOf(1)` 抛 `TypeError` 而 `Object.getPrototypeOf(1)` 会强转成包装对象，`Reflect.ownKeys` 返回**字符串 + Symbol + 不可枚举**的全部自有键，而 `Object.keys` 只返回可枚举的字符串键。也见 [Reflect（反射对象）](#reflect反射对象)。

示例：[`25_proxy_and_reflect/09_reflect_vs_object.js`](25_proxy_and_reflect/09_reflect_vs_object.js)

### Reactive（响应式原理）

用 `Proxy` 实现「数据变化自动触发视图更新」的机制，是 Vue 3 等框架的核心：`get` 陷阱在读取时**收集依赖**（把当前正在运行的副作用函数记录到「目标对象 → 属性 → 副作用集合」的三级结构里，通常用 `WeakMap<target, Map<key, Set<effect>>>`），`set` 陷阱在写入时**触发依赖**（把该属性的副作用都重新执行一遍）。两个关键细节：(1) `get` 里必须用 `Reflect.get(target, key, receiver)` 并传 `receiver`，否则嵌套对象的读取不会被追踪；(2) 只有**被访问过**的属性才被追踪（惰性深层代理），所以 `obj.newField = 1` 这种新增属性不会自动变成响应式（Vue 3 里靠 `reactive()` 重新包裹解决，`Vue 2` 的 `Object.defineProperty` 方案则完全无法侦测新增/删除）。此外 `WeakMap` 的弱引用保证「对象被回收时依赖表也自动清理」。也见 [get trap](#get-trapget-陷阱)、[set trap](#set-trapset-陷阱)。

示例：[`25_proxy_and_reflect/06_observable_proxy.js`](25_proxy_and_reflect/06_observable_proxy.js)

### Validation Proxy（校验型代理）

在 `set`/`deleteProperty`/`defineProperty` 陷阱里做**运行时约束**的代理写法，能表达「类型不对就抛错」「未知字段一律拒绝」「对象创建后只读」这类普通对象做不到的语义。典型实现是维护一份 `schema`（字段 → 校验函数或类型），`set` 时先校验再决定抛错还是 `Reflect.set` 转发；只读包装则直接 `throw new TypeError(...)` 或返回 `false`。要注意三个边界：校验只覆盖**经过代理**的访问（有 `target` 引用的人可以绕过），不能防住 `Object.defineProperty(target, ...)` 之类的直接操作；`set` 必须返回布尔值；深层结构需要递归代理，而递归代理会带来性能与身份（`proxy.a !== proxy.a`）问题。也见 [set trap](#set-trapset-陷阱)、[Invariant（不变量）](#invariant不变量)。

示例：[`25_proxy_and_reflect/05_validation_proxy.js`](25_proxy_and_reflect/05_validation_proxy.js)

### Negative Array Index（负索引数组）

用 `Proxy` 给数组补上 Python 风格的负下标（`arr[-1]` 取最后一个元素）的常见练习：在 `get` 和 `set` 陷阱里判断 `key` 是否为负数字符串，先用 `Number(key)` 转换，再换算成 `target.length + n`，其余键交给 `Reflect` 透传。三个必须处理的细节：(1) 属性键是**字符串**（`-1` 不是数字 `-1`），必须显式转换，而 `'-0'`、`'1e2'`、`' 1 '` 这些形式要用 `Number.isInteger` 之类的判据挡掉，否则会把普通属性名误当成下标；(2) `has`、`deleteProperty`、`ownKeys` 也要考虑，否则 `-1 in arr`、`delete arr[-1]`、`JSON.stringify` 会不一致；(3) 支持负索引就等于放弃了「所有属性都是合法下标」的假设，要防止用户写出让 `length` 语义混乱的代码。同类技巧还包括「默认值对象」（读不存在的键返回默认值）—— 但要注意 `'x' in proxy` 与 `Object.keys` 不会自动跟着变。也见 [get trap](#get-trapget-陷阱)。

示例：[`25_proxy_and_reflect/07_negative_array_index.js`](25_proxy_and_reflect/07_negative_array_index.js)
