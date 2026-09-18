## 正则表达式（Regular Expressions）

### Regular expression（正则表达式）

一种用紧凑的元字符语法描述「字符串模式」的小型语言，JavaScript 通过内建的 `RegExp` 类型实现它。它的价值在于把「匹配 / 查找 / 提取 / 替换」这类文本处理从手写循环 + 下标运算，压缩成一句声明式的模式。关键细节：正则**不是**一个独立的解析引擎，而是被宿主语言包了一层接口——既可以直接写 `/abc/`，也可以 `new RegExp("abc")`。常见误解是把它当成万能解析器：正则只适合**正则语言**（无嵌套配对结构），解析 HTML、嵌套括号、JSON 这类需要「计数」的场景应当用真正的解析器。

示例：[`13_regexp/01_basics_and_literals.js`](13_regexp/01_basics_and_literals.js)

### Regex literal（正则字面量）

用一对斜杠 `/pattern/flags` 直接书写的正则，例如 `/\d+/g`。与 `new RegExp("\\d+", "g")` 相比，字面量在**词法分析阶段**就被编译：同一段字面量在循环里复用同一个 `RegExp` 对象（共享 `lastIndex`），且不需要对反斜杠做二次转义。这是它最重要的实践差异——动态构造的模式（拼用户输入、拼变量）只能用构造器，此时要小心**转义地狱**：字符串里 `\d` 会被吃成 `d`，必须写 `"\\d"`。也见 RegExp constructor（RegExp 构造器）。

示例：[`13_regexp/01_basics_and_literals.js`](13_regexp/01_basics_and_literals.js)

### RegExp constructor（RegExp 构造器）

`new RegExp(pattern, flags)` 用运行时字符串动态生成正则，是唯一能拼接变量的方式。它和字面量的差别不只是写法：每次调用都产生**全新的对象与全新的 `lastIndex`**（字面量在同一处代码重复执行时是同一个对象），这对带 `g` 标志的复用循环影响很大。关键细节：传入的字符串要写成转义后的形式，`new RegExp("\\w+")` 才等价于 `/\w+/`；ES6 起 `new RegExp(regexpObj, flags)` 可以基于已有正则换标志（此时 `source` 与 `flags` 会被复制，但 `lastIndex` 重置为 0）。也见 Regex literal（正则字面量）、Flags 修饰符。

示例：[`13_regexp/01_basics_and_literals.js`](13_regexp/01_basics_and_literals.js)

### test（test 方法）

`regex.test(str)` 返回布尔值，只回答「能不能匹配上」，是校验、条件判断最常用的入口。它的独特性在于**会推进 `lastIndex`**：对于带 `g` 或 `y` 标志的正则，每次成功匹配后 `lastIndex` 停在下一次搜索的起点。这意味着同一个正则对象连续 `test` 同一字符串会得到交替的 `true / false`——这是初学者最常踩的坑，因为「正则的行为取决于它上次用在哪」。解决办法：校验场景去掉 `g`，或者在复用前手动 `re.lastIndex = 0`。也见 `lastIndex` statefulness（`lastIndex` 状态性）。

示例：[`13_regexp/01_basics_and_literals.js`](13_regexp/01_basics_and_literals.js)

### exec（exec 方法）

`regex.exec(str)` 是功能最完整的匹配原语：命中时返回一个**类数组**（真实数组，带 `index`、`input`、`groups` 三个附加属性），元素 0 是整体匹配，1..n 是各捕获组；未命中返回 `null`。配合 `g` 标志时，它可以在 `while ((m = re.exec(s)) !== null)` 循环里逐次推进，把 `lastIndex` 当成游标遍历全部匹配——这正是 `matchAll` 出现之前的标准写法。注意：`exec` 从不返回空数组，判定必须写 `if (m)` 而不是 `if (m.length)`；忘记循环里的 `lastIndex` 归零还会导致死循环。

示例：[`13_regexp/05_groups_and_alternation.js`](13_regexp/05_groups_and_alternation.js)

### `lastIndex` statefulness（`lastIndex` 状态性）

`lastIndex` 是 `RegExp` 实例上的可读写数字属性，只在 `g`（全局）或 `y`（粘性）标志下被 `exec` / `test` 读写，表示「下一次从哪个下标开始找」。它的存在使正则对象成为**有状态的迭代器**：同一个对象用于不同字符串时，"下一个"位置会残留，导致漏匹配或交替匹配。这是 JS 正则最经典的陷阱，也解释了为什么 `String.prototype.match` 在带 `g` 时会一次性返回所有结果并**忽略/重置** `lastIndex`，而 `exec` 不会。实践建议：需要状态就别共享正则对象，不需要状态就在函数内部现造字面量。

示例：[`13_regexp/09_flags.js`](13_regexp/09_flags.js)

### Character class（字符类）

用 `[...]` 表示「此处可以是集合里的任意一个字符」，例如 `[aeiou]`、`[0-9a-fA-F]`。类内的元字符失去特殊含义——`[.]` 匹配的只是字面点号——只有 `\`、`]`、`^`（首位）和 `-`（中间）需要转义。关键细节：字符类匹配的永远是**单个字符**，`[abc]{2}` 才是两个字符；`[a-z]` 是范围而不是「a 或 - 或 z」。常见误解是把 `[12]` 写成 `[1,2]`（多出的逗号会让模式也接受 `,`）。

示例：[`13_regexp/02_character_classes.js`](13_regexp/02_character_classes.js)

### Shorthand character class（简写字符类）

`\d \w \s` 及其大写取反形式 `\D \W \S` 是常用字符类的缩写：`\d` = `[0-9]`，`\w` = `[A-Za-z0-9_]`，`\s` = 空白（空格、制表、换行、全角空格等 Unicode 空白）。它们让模式短而可读，但要注意三个陷阱：`\w` 的「单词」只含 ASCII 字母数字下划线，中文不会被算进去（需 `u` 标志配合 Unicode 属性转义 `\p{Letter}`）；`\s` 包含换行，用 `\s` 代替空格往往会跨行误匹配；`\D` 这类取反类**会匹配换行**，因为取反是相对于整个字符集而非行。也见 Negated character class（取反字符类）。

示例：[`13_regexp/02_character_classes.js`](13_regexp/02_character_classes.js)

### Negated character class（取反字符类）

`[^...]` 表示「不是这个集合里的任意字符」，`[^0-9]` 即「任意非数字字符」。它的实用价值在于配合量词的「吃到边界为止」语义：`[^"]*` 能一口气吃掉引号之间的所有内容，是解析 CSV、提取带引号片段时最常用的构造。关键细节：取反类**必匹配一个字符**，量词 `*` 只是让它可为零次，所以 `[^"]*` 永远不可能是「空匹配位置」以外的零宽；`^` 只有紧跟在 `[` 之后才是取反，写成 `[a^]` 就只是普通字符。注意 `[^]` 是一个合法且匹配任意字符（含换行）的模式，等价于 `[\s\S]`。

示例：[`13_regexp/02_character_classes.js`](13_regexp/02_character_classes.js)

### Quantifier（量词）

`*`（0 次以上）、`+`（1 次以上）、`?`（0 或 1 次）、`{n}`、`{n,}`、`{n,m}` 用来描述「重复多少次」，它们作用于**前面紧邻的一个单元**（单字符、转义序列或分组）。关键细节：量词绑定的是紧邻项，`ab+` 是 `a` 后跟一个以上 `b`，要表达「ab 重复」必须写 `(?:ab)+`；`?` 另有「可选」和「惰性修饰符」两种含义，取决于它是跟在量词之后还是单独出现。常见误解是把 `{2,}` 与 `{2, }`（带空格）写成同一个东西——量词里不允许空格。

示例：[`13_regexp/03_quantifiers.js`](13_regexp/03_quantifiers.js)

### Greedy vs lazy（贪婪与惰性）

默认量词是**贪婪**的：先尽可能多地吃字符，只有当后续模式匹配失败时才「吐回」一部分。在量词后加 `?` 变成**惰性**（`*?`、`+?`、`{n,m}?`），它先尽量少吃，只在需要时才扩张。这是理解匹配结果差异的关键：对 `"<a><b>"` 用 `/.*/` 得到整串，用 `/.*?/` 得到空串，用 `/<.*?>/` 得到 `<a>`。实践上惰性常用于「匹配到最近的分隔符」，但它不等于更快——惰性只是改变了尝试顺序，回溯依然可能发生，只是通常更少。

示例：[`13_regexp/03_quantifiers.js`](13_regexp/03_quantifiers.js)

### Backtracking（回溯）

正则引擎在尝试失败时「退回去换个选择」的机制，是正则能正确工作的核心，也是性能问题的根源。以 `/[ab]+c/` 匹配 `"abab"` 为例，引擎会先吃掉全部字符再发现缺 `c`，然后逐步回退重试——每退一步可能触发指数级的分支组合。关键认识：回溯是**深度优先**的，模式写法的微小差别（`[^"]*` 对比 `.*?`）会显著改变尝试次数；DFA 引擎（如 RE2）没有回溯所以不会爆炸，但 JS 的 `RegExp` 是回溯型引擎，因此必须自己写安全的模式。也见 Catastrophic backtracking（灾难性回溯）。

示例：[`13_regexp/13_catastrophic_backtracking.js`](13_regexp/13_catastrophic_backtracking.js)

### Catastrophic backtracking（灾难性回溯 / ReDoS）

当模式里存在**可重叠的重复**（尤其是嵌套量词，如 `/(a+)+b/`），失败的输入会让回溯次数呈指数增长，输入长度每加一个字符耗时翻倍——这就是 ReDoS（Regular Expression Denial of Service）。典型触发条件是「两个量词可以匹配同一段字符」加「匹配必定失败」，例如校验邮箱的 `/^(\w+\s?)*$/` 遇到长串非空格字符。防御原则：改写模式消除歧义（把 `(a+)+` 换成 `a+`）、用更精确的字符类代替 `.`、限制输入长度、给匹配设超时，或改用无回溯引擎。它不只是性能问题，在服务端处理用户输入时是真实的安全漏洞。

示例：[`13_regexp/13_catastrophic_backtracking.js`](13_regexp/13_catastrophic_backtracking.js)

### Anchor（锚点）

`^` 与 `$` 分别断言「位置在输入开头 / 结尾」，本身**不消耗字符**。它们的实际含义受多行标志影响：不加 `m` 时 `^` 只匹配整串的起点，加了 `m` 则同时匹配每个 `\n` 之后的位置。关键细节：`$` 默认匹配「字符串末尾」，但老规范中它还允许匹配「末尾换行之前」——所以 `/^\d+$/` 在部分场景会接受 `"123\n"`，严格校验应使用 `\z` 等价写法 `(?!)` 或配上 `\n` 排除。常见误解是以为 `^` `$` 就是「行的开始结束」，记得多行模式下才是。

示例：[`13_regexp/04_anchors_and_boundaries.js`](13_regexp/04_anchors_and_boundaries.js)

### Word boundary（单词边界）

`\b` 断言「当前位置的左边是 `\w` 而右边不是，或反之」，`\B` 则断言不是边界，两者都是零宽断言。它解决的是「按整词匹配」的需求：`/\bcat\b/` 能匹配 `"a cat."` 而不会命中 `"category"`，这比 `/[^a-z]cat[^a-z]/` 干净得多。关键细节：`\b` 的定义完全依赖 `\w` 的 ASCII 假设，因此中文/带重音的字母旁边**不存在**词边界，`\b` 在那里会失效——处理 Unicode 文本需要 Unicode 属性转义。也见 Zero-width assertion（零宽断言）。

示例：[`13_regexp/04_anchors_and_boundaries.js`](13_regexp/04_anchors_and_boundaries.js)

### Multiline mode（多行模式）

`m` 标志改变 `^` 和 `$` 的语义，让它们匹配每一行的开头和结尾（以 `\n` 为界）而非整串边界。没有 `m` 时 `/^b/` 只能匹配首字符是 `b` 的字符串；加上 `m` 后 `/^b/m` 能匹配多行文本中任何一行以 `b` 开头的位置。关键细节：`m` **不影响 `.` 是否匹配换行**——那是 `s` 标志的职责，两者常被混淆。另一个陷阱是 `\r\n` 换行：`$` 只会停在 `\n` 前，导致捕获结果带一个 `\r`，跨平台读取文本时要显式处理。

示例：[`13_regexp/09_flags.js`](13_regexp/09_flags.js)

### Capturing group（捕获组）

用 `(...)` 包裹的子模式，它同时做两件事：把子模式**作为一个单元**接受量词/选择，以及**把命中的内容记住**以便取用。结果数组里下标 1 开始就是各组内容，`exec` 返回值的 `index` 则指向整体匹配位置。关键细节：组可以嵌套，编号按**左括号出现顺序**而非嵌套层次；不匹配的可选组在结果里是 `undefined` 而不是空串，这是区分「没参与匹配」与「匹配到空」的唯一方式。也见 Non-capturing group（非捕获组）。

示例：[`13_regexp/05_groups_and_alternation.js`](13_regexp/05_groups_and_alternation.js)

### Non-capturing group（非捕获组）

`(?:...)` 提供分组的**结构性**能力但不占用编号、不产生捕获结果，是性能与可维护性上的默认选择。当你只想「让这段子模式整体接受量词或参与选择」时（`(?:ab)+`、`/(?:cat|dog)s/`），用捕获组会白白污染编号，让后面所有组的索引位移一位——这类偏移 bug 在插入新分组后极难定位。另外 `(?<name>...)` 是具名形式、`(?=...)` `(?<=...)` 是断言形式，它们也都不参与数字编号（具名组仍可从 `groups` 取）。实践建议：不需要取值就用 `(?:)`。

示例：[`13_regexp/05_groups_and_alternation.js`](13_regexp/05_groups_and_alternation.js)

### Alternation（选择分支）

`|` 表示「或」，例如 `/cat|dog/`，它的优先级**最低**——所以 `/(?:cat|dog)s/` 才能表达「cats 或 dogs」，写 `/cat|dogs/` 则等价于 `/cat|dogs/` 两个完整分支。关键细节：分支是从左到右**短路**尝试的，`/a|ab/` 匹配 `"ab"` 时只会得到 `"a"`，需要时把更长的分支写在前面。它在字符类内部无意义：`[a|b]` 匹配的是 `a`、`|`、`b` 三个字符之一，这是很常见的混淆点。也见 Non-capturing group（非捕获组）。

示例：[`13_regexp/05_groups_and_alternation.js`](13_regexp/05_groups_and_alternation.js)

### Backreference（反向引用）

`\1`、`\2`（或 `\k<name>`）在模式中**回指**前面某个捕获组已经匹配到的文本，用来表达「重复的内容必须相同」。典型用途是匹配成对的引号（`/["'](.*?)\1/`）、重复单词（`/\b(\w+)\s+\1\b/`）、或 HTML 开闭标签配对。关键细节：反向引用匹配的是**文本内容**而非模式本身——它比较的是字符序列是否相等，这与「再匹配一次同样的模式」有本质区别（后者可以匹配不同内容）。常见误解是在字符类里用 `\1`：`[\1]` 不表示反向引用，而是八进制转义。

示例：[`13_regexp/06_backreferences.js`](13_regexp/06_backreferences.js)

### Named capture group（具名捕获组）

`(?<name>...)` 给捕获组起名字，匹配后通过结果对象的 `groups.name` 按名取值，比 `match[3]` 这种魔数下标可读、可重构得多。组内的 `\k<name>` 可以在模式中反向引用该组，替换模板里则用 `$<name>` 取值。关键细节：同名组在**不同选择分支**里原本会报错，ES2025 起允许重复（「重复具名组」），未参与匹配的分支对应 `undefined`；ES2025 还补上了 `RegExp.escape` 用于安全地转义动态文本。常见误解是以为具名组不进数字下标——它们同时占用编号，只是多了一个名字入口。

示例：[`13_regexp/07_named_groups.js`](13_regexp/07_named_groups.js)

### `groups`（具名组结果对象）

`exec` / `match` / `matchAll` 返回值上挂的附加属性，是一个「组名 → 匹配文本（或 `undefined`）」的普通对象（原型为 `null`），没有具名组时为 `undefined`。它让取值脱离了位置依赖，是解析日志行、URL、结构化文本的首选方式。关键细节：用 `obj.groups?.name` 访问，因为无具名组时 `groups` 本身就不存在；`replace` 回调的参数里也有对应的 `groups`。也见 Named capture group（具名捕获组）。

示例：[`13_regexp/07_named_groups.js`](13_regexp/07_named_groups.js)

### Lookahead（前瞻）

`(?=...)` 是正向前瞻（要求后面是某模式），`(?!...)` 是负向前瞻（要求后面不是），它们**只检查不消耗**，因此被称为零宽断言。经典用途：用 `(?=...)` 做「重叠匹配」（`/\w(?=\w)/g` 能取到相邻字符组合），用 `(?!...)` 做密码规则「至少含一位数字」的 `/^(?=.*\d).{8,}$/`，或者在替换时「只看后面」定位插入点。关键细节：前瞻内部**可以有捕获组并真的捕获内容**，这一点容易被忽略；前瞻里也可以使用量词和完整的子模式。也见 Lookbehind（后顾）。

示例：[`13_regexp/08_lookahead_lookbehind.js`](13_regexp/08_lookahead_lookbehind.js)

### Lookbehind（后顾）

`(?<=...)` 与 `(?<!...)` 是 ES2018 加入的向后断言，检查「当前位置之前」是否匹配某模式，同样零宽不消耗。它让很多原本需要 `replace` 回调 + 手工判断的场景变得声明式，例如给数字加千分位（`/(?<=\d)(?=(\d{3})+$)/g`）、只替换某个前缀后的内容（`/(?<=id=)\d+/`）。关键细节：后顾模式的长度在传统实现中必须**定长**，虽然 JS 引擎（V8）已支持变长后顾，但为兼容性考虑宜用等长模式；另外它的性能开销略高于前瞻。

示例：[`13_regexp/08_lookahead_lookbehind.js`](13_regexp/08_lookahead_lookbehind.js)

### Zero-width assertion（零宽断言）

「断言一个位置成立但不吃掉任何字符」的一类构造，包括 `^ $ \b \B`、前后瞻 `(?=) (?!) (?<=) (?<!)`。它们的存在解释了为什么某些匹配能发生在**同一个下标**上、为什么全局替换不会漏掉相邻结果，以及为什么 `replace` 时断言匹配到的内容替换后会「原地插入」。关键细节：零宽匹配配合 `g` 时 `lastIndex` 若不推进就会死循环——ES2015 起 `String.prototype.replace`、`matchAll` 等对零宽匹配做了自动推进保护，但手写 `exec` 循环仍需自己防。也见 Lookahead（前瞻）、Word boundary（单词边界）。

示例：[`13_regexp/08_lookahead_lookbehind.js`](13_regexp/08_lookahead_lookbehind.js)

### Flags（修饰符）

紧跟在右斜杠后的字母，全局地改变匹配语义。`g` 全局查找、`i` 忽略大小写、`m` 多行、`s` 让 `.` 匹配换行、`u` 启用完整 Unicode 语义（码点匹配、`\p{...}`、代理对安全）、`y` 粘性、`d` 生成带下标的匹配信息、`v` 字符类集合运算。关键细节：标志是**正则对象固有的**，可以在 `re.flags` 上按规范顺序读回；`u` 和 `v` 互斥，同用会抛 `SyntaxError`；带 `g` 的正则是有状态的。常见误解是 `i` 会做 Unicode 大小写折叠——不加 `u` 时它只做简单的 ASCII/基本映射。

示例：[`13_regexp/09_flags.js`](13_regexp/09_flags.js)

### Sticky flag `y`（粘性标志）

`y` 让匹配必须**恰好从 `lastIndex` 处开始**，否则直接失败，而不是像 `g` 那样向后滑动寻找。这个「锚定在游标上」的语义正是手写词法分析器（tokenizer）需要的：你可以依次从当前位置尝试各类 token 模式，成功就推进游标，失败即报错。它也解释了为什么 `y` 和 `g` 共享 `lastIndex` 机制，以及为什么 `replace` 配合 `y` 能在每个位置尝试替换。常见误解是以为 `y` 只是「更严格的 g」——它真正的区别是**会不会跳过不匹配的字符**。

示例：[`13_regexp/09_flags.js`](13_regexp/09_flags.js)

### `v` flag and set operations（`v` 标志与集合运算）

ES2024 引入的 `v` 标志是 `u` 的超集，它把字符类升级成真正的**集合代数**：用 `[a-z&&[^aeiou]]` 求交集、用 `[\p{Letter}--[a-z]]` 求差集，并支持在类内嵌套类。它同时更严格地规定了类内哪些字符必须转义（如 `(`、`)`、`[`、`]`、`{`、`}` 在 `v` 模式下都得写成 `\(` 等），从而消除歧义。关键细节：`v` 与 `u` 不能同时使用；`\p{...}` 属性转义在 `v` 下功能更完整（支持字符串属性如 `\p{RGI_Emoji}`）。它能显著简化原本需要多个前瞻拼凑的字符过滤逻辑。

示例：[`13_regexp/14_v_flag_and_set_operations.js`](13_regexp/14_v_flag_and_set_operations.js)

### `match` / `matchAll`（字符串匹配方法）

`String.prototype.match` 在正则有 `g` 时返回所有整体匹配的字符串数组（**不含捕获组、不含 index**），无 `g` 时退化为 `exec` 的结果。`matchAll` 是 ES2020 的补充，它**始终**返回一个迭代器，逐个给出完整的 `exec` 式结果（含捕获组、`index`、`groups`），因此成为提取结构化数据的首选。关键细节：`matchAll` 要求正则带 `g`，否则抛 `TypeError`；它返回的是惰性迭代器，且**不改动原正则的 `lastIndex`**。常见误解是用 `match` + `g` 后试图取 `result[1]`——那是整体匹配的第 2 个字符。

示例：[`13_regexp/11_string_methods_with_regex.js`](13_regexp/11_string_methods_with_regex.js)

### `search` / `split`（search 与 split）

`str.search(re)` 只返回第一个匹配的下标（找不到返回 -1），且**忽略 `g` 标志与 `lastIndex`**，是纯查询。`str.split(re)` 按正则匹配到的位置切分字符串，并**会把捕获组的内容插入结果数组**——`"a1b".split(/(\d)/)` 得到 `["a","1","b"]`，这个行为常被当成 bug。关键细节：`split` 使用正则时会重置 `lastIndex`；`search` 是少数不受 `g` 状态影响的方法。替换操作用 `replace`/`replaceAll`，也见 Replacement template（替换模板）。

示例：[`13_regexp/11_string_methods_with_regex.js`](13_regexp/11_string_methods_with_regex.js)

### `replace` with function（函数式替换）

`str.replace(re, fn)` 的第二参数可以是回调函数，参数依次为 `(match, ...捕获组, offset, string, groups)`，返回值即替换文本。这是把正则从「纯文本替换」升级为「计算式改写」的关键能力：大小写转换、数值累加、把匹配结果映射为另一种表示都靠它。关键细节：参数个数随捕获组数量变化，因此取 `offset`/`groups` 时通常用剩余参数或具名组；回调里**不要**依赖 `this`（严格模式下是 `undefined`）。也见 Replacement template（替换模板）。

示例：[`13_regexp/10_replace_with_function.js`](13_regexp/10_replace_with_function.js)

### Replacement template（替换模板）

`replace` 第二参数为字符串时，其中以 `$` 开头的序列会被解释：`$&` 是整体匹配、`$'` 是匹配之后的文本、`$` 后紧跟一个反引号则是匹配之前的文本、`$1`..`$n` 是数字组、`$<name>` 是具名组、`$$` 表示字面量 `$`。它让「保留部分原文做重组」不必写回调，例如 `s.replace(/(\w+)@(\w+)/, "$2#$1")`。关键细节：不存在的组会被替换成**空串**（`$9` 无组时消失），而 `$1` 紧邻数字时可能被误解为组号（`$12` 优先当作第 12 组，需写成 `${1}2`）。当替换文本来自用户输入时，`$` 会被意外解释，这是模板注入类 bug 的常见来源。

示例：[`13_regexp/10_replace_with_function.js`](13_regexp/10_replace_with_function.js)

### Validation pattern（校验模式）

用正则做「整串是否合格」的断言式检查，例如邮箱、手机号、日期、强密码。书写要点是**两端必须加锚点** `^...$`，否则 `/\d{3}/` 会在 `"abc123xyz"` 上返回 `true`。强密码这类多条件需求通常用多个前瞻叠加：`/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`。关键细节：正则校验只能判断**形状**，不能判断语义（邮箱是否真实存在、手机号是否被分配）；对邮箱这类复杂格式，过度严格的正则往往误杀合法地址，业界共识是宽松匹配 + 发信验证。

示例：[`13_regexp/12_validation_patterns.js`](13_regexp/12_validation_patterns.js)

### Custom regexp protocol（自定义正则协议 / `Symbol.match` 等）

JavaScript 允许对象**伪装成正则**参与字符串方法：只要实现 `[Symbol.match]`、`[Symbol.matchAll]`、`[Symbol.replace]`、`[Symbol.search]`、`[Symbol.split]` 中的一个或多个，就能被 `String.prototype` 的对应方法接受。判定「是不是正则」的权威标准不是 `instanceof RegExp`，而是方法内部调用的 `IsRegExp` 抽象操作——它先看 `Symbol.match`，再看原型链。关键细节：把 `re[Symbol.match] = false` 设为假值能让 `String.prototype.startsWith` 把正则当普通字符串处理；`Symbol.replace` 的第一个参数是目标字符串、第二个是替换项，返回新字符串。这解释了「鸭子类型」如何穿透语言内建方法。

示例：[`13_regexp/15_custom_regexp_protocol.js`](13_regexp/15_custom_regexp_protocol.js)

## 面向对象：类、this 与原型（OOP: Classes, `this` & Prototypes）

### class（类）

ES2015 引入的 `class` 声明是**原型继承的语法糖**，不是新的对象模型：它统一了「构造函数 + `prototype` 方法 + 静态方法」的写法，并额外提供了私有字段、静态块、类字段等新能力。关键细节：类声明**不会提升**（存在 TDZ，只能在定义之后使用），类体内部自动运行在严格模式下，且**必须用 `new` 调用**（直接 `Person()` 会抛 `TypeError: Class constructor cannot be invoked without 'new'`），这两点都与构造函数写法不同。常见误解是把它当作 Java 式类——它依然基于原型与动态查找。也见 Constructor function（构造函数）、TDZ 之外的传统写法与 `new` operator（`new` 运算符）。

示例：[`14_classes/01_class_basics.js`](14_classes/01_class_basics.js)

### Constructor（构造函数 / 构造器方法）

类体里名为 `constructor` 的方法，是 `new` 时自动执行的初始化逻辑，负责给实例装初始状态。它有三个易错点：一个类只能有一个 `constructor`（重复定义直接 `SyntaxError`）；`constructor` 不是关键字，它是方法名，但**不能被当作普通方法调用**；在派生类中它必须在访问 `this` 之前调用 `super()`。如果类里没有显式写它，引擎会补一个默认构造器（派生类的默认构造器会自动转发全部参数给 `super`）。也见 class（类）、`super`。

示例：[`14_classes/01_class_basics.js`](14_classes/01_class_basics.js)

### Constructor function（构造函数：函数式写法）

用普通函数 + `new` 模拟类的 ES5 风格：`function Person(name) { this.name = name }`，方法挂在 `Person.prototype` 上。它与 `class` 的差异是实质性的：函数声明会提升、可以不加 `new` 直接调用（此时 `this` 指向 `undefined`/全局，会静默污染）、方法默认可枚举、也不强制严格模式。关键细节：`class` 本质就是这种写法的规范化包装，`typeof MyClass === "function"` 依然成立。也见 class（类）、`new` operator（`new` 运算符）。

示例：[`16_prototype/03_constructor_function.js`](16_prototype/03_constructor_function.js)

### instance（实例）

由构造函数或类通过 `new` 创建出来的具体对象，拥有自己的一份实例属性，并通过 `[[Prototype]]` 共享原型上的方法。判断「是不是某个类的实例」用 `instanceof` 或 `Object.prototype.isPrototypeOf`。关键细节：实例与原型是**活链接**，但实例自己的属性会遮蔽原型同名属性；`constructor` 属性是原型上的、可被改写，因此 `obj.constructor === Foo` 并不可靠。也见 Instance members（实例成员）、Prototype chain（原型链）。

示例：[`14_classes/01_class_basics.js`](14_classes/01_class_basics.js)

### `new` operator（`new` 运算符）

`new Foo(...)` 的执行分四步：创建空对象、把该对象的 `[[Prototype]]` 指向 `Foo.prototype`、以该对象为 `this` 调用 `Foo`、若函数返回对象则用返回值否则用新对象。真正标志「这是构造调用」的是引擎内部的 `[[Construct]]`，构造函数可通过 `new.target` 检测自己是否被 `new` 调用（用它可实现「忘了 new 也能工作」的兼容写法）。关键细节：箭头函数不能被 `new`（没有 `[[Construct]]`），`class` 必须被 `new`，内建函数如 `Date` 用 `new` 与否行为完全不同。

示例：[`15_this_and_context/05_new_binding.js`](15_this_and_context/05_new_binding.js)

### Instance members（实例成员）

定义在「实例自己身上」的成员，每个实例各持一份：构造器里 `this.x = ...` 赋的值、以及类字段 `x = 1` 都属于此类。它们的代价是**每实例一份内存**，好处是互不干扰、可被 `Object.hasOwn` 检出。与原型方法相对：方法通常放原型上共享，数据放实例上隔离。关键细节：如果用箭头函数写类字段（`handler = () => this.x`），每个实例都会得到一个新的函数对象——这是用内存换「this 永远绑定正确」的常见权衡。也见 Class field（类字段）、Lexical this（词法 this）。

示例：[`14_classes/02_instance_methods.js`](14_classes/02_instance_methods.js)

### Static members（静态成员）

用 `static` 修饰的成员，挂在**构造函数对象自身**上而非 `prototype`，因此只能通过 `ClassName.member` 访问，实例访问不到。典型用途是工厂方法（`User.fromJSON()`）、工具函数、常量与注册表。关键细节：静态方法里的 `this` 指向类本身（子类调用时指向子类，这使静态工厂能正确返回子类实例）；`static` 也能修饰 getter、字段与方法。常见误解是以为 `static` 属性会被实例继承——实例只能通过原型链找到原型上的东西，而静态成员在构造函数这条链上。

示例：[`14_classes/03_static_members.js`](14_classes/03_static_members.js)

### Static initialization block（静态初始化块）

`static { ... }` 是 ES2022 引入的类体语法，在类**定义时**执行一次，可用多条语句完成静态字段的复杂初始化。它填补了旧方案的三个缺口：可以在静态初始化里使用 `try/catch`、可以访问类的私有静态成员、可以声明只在初始化期间存在的局部变量（`var`/`let` 在块内是局部的，不会泄漏成类的静态属性）。关键细节：一个类可以有多个静态块，按出现顺序执行，且与静态字段的书写顺序交错生效；执行时机是类定义被求值时，早于任何实例创建。

示例：[`14_classes/03_static_members.js`](14_classes/03_static_members.js)

### Class field（类字段）

在类体顶层直接写 `x = 1` 声明的实例字段（`static x = 1` 则为静态字段），它等价于在构造函数里给 `this.x` 赋值，但初始化发生在构造器主体执行**之前**。关键细节：字段初始化时 `this` 已可用（派生类中在 `super()` 之后）；字段定义是「每次实例化都重新求值」，所以 `arr = []` 保证每个实例拿到独立数组，不像原型属性那样共享。常见误解是把类字段当作原型属性——它们的原型是 `undefined`，实例上才存在。也见 Instance members（实例成员）。

示例：[`14_classes/04_class_fields.js`](14_classes/04_class_fields.js)

### Private field（私有字段 `#x`）

以 `#` 开头的字段是**真正的词法私有**，而不是靠命名约定：只能在声明它的类体内部访问，外部访问直接抛 `SyntaxError`（编译期报错，不是 `undefined`）。实现上私有字段存在对象的「私有槽」里，不参与原型链查找，因此不会被属性遍历、`JSON.stringify`、`Object.keys` 看到，也**无法被 `Proxy` 拦截或劫持**——这是它比 `WeakMap` 方案更强的地方。关键细节：私有字段必须在类体里先声明才能用；`#x in obj` 是 ES2022 提供的唯一检测手段；子类无法访问父类的私有字段。也见 Private method（私有方法）。

示例：[`14_classes/05_private_fields.js`](14_classes/05_private_fields.js)

### Private method（私有方法）

`#method() {}` 与私有字段同理，只能从类体内部调用；同样支持 `static #m()` 与私有 getter/setter（`get #x()`）。私有方法常用于内部校验、状态变更逻辑，把「实现细节」与公开 API 彻底隔离。关键细节：私有方法访问时的 `this` 规则与普通方法一致（取决于调用方式），因此把它作为回调传递时要注意 `this` 丢失问题；由于不进入原型，每个实例共享的是同一份方法定义（引擎内部优化），但语义上是不可外取的。

示例：[`14_classes/05_private_fields.js`](14_classes/05_private_fields.js)

### getter / setter（访问器属性）

用 `get name() {}` / `set name(v) {}` 定义的属性，对外表现为**属性访问语法**，实际执行函数，用于计算值、校验输入、维护派生状态。定义在类体里会挂到 `prototype` 上被所有实例共享；也能用 `Object.defineProperty` 在普通对象上定义。关键细节：只有 getter 时属性只读（严格模式下赋值抛错）；setter 中给同名属性赋值会造成无限递归（要用 `this._x` 或私有字段存值）；访问器**不可枚举**（类体中的普通方法也不可枚举，这是与字面量对象的差异）。也见 Private field（私有字段）。

示例：[`14_classes/06_getters_setters.js`](14_classes/06_getters_setters.js)

### Accessor on prototype（原型上的访问器）

把 getter/setter 定义在原型（类体或 `Object.defineProperty(Foo.prototype, ...)`）上，全部实例共享同一对存取逻辑，访问时 `this` 指向触发访问的那个实例。它常用于把「存储字段」包装成「计算属性」：内部用 `this._name` 或 `#name` 存真值，对外暴露 `get name()` 做格式化、`set name()` 做校验。关键细节：原型上的访问器**不可枚举**，所以 `Object.keys(instance)` 看不到它们，`JSON.stringify` 也不会序列化（这是与类字段的一个重要差异）；若原型上的访问器只有 getter 没有 setter，那么实例上对该名字赋值会抛 `TypeError`（严格模式）或静默失败，而**不会**像普通数据属性那样新建一个遮蔽属性——因为赋值路径会在原型上找到访问器并调用它。也见 getter / setter（访问器属性）、Property shadowing（属性遮蔽）。

示例：[`16_prototype/06_getter_setter_prototype.js`](16_prototype/06_getter_setter_prototype.js)

### `extends`（继承）

`class Child extends Parent` 建立原型链双链：`Child.prototype.__proto__ === Parent.prototype`（实例方法可继承），且 `Child.__proto__ === Parent`（静态成员也可继承）。这就是为什么子类能直接调用父类的静态方法。关键细节：`extends` 右侧可以是**任意表达式**（返回构造函数的表达式），因此能实现混入（`extends mixin(Base)`）；派生类的构造器里不调用 `super()` 就用 `this` 会抛错。常见误解是以为 `extends` 会复制父类成员——它只是建立查找链路。也见 ES5 inheritance（ES5 继承）、Mixins（混入）。

示例：[`14_classes/07_inheritance_extends.js`](14_classes/07_inheritance_extends.js)

### Extending builtins（继承内建类型）

`class MyArray extends Array` 这类写法允许内建类型被继承，且内建方法会「感知」子类：`new MyArray(1,2).map(...)` 返回的是 `MyArray`，因为引擎会读构造函数的 `Symbol.species`。这带来的坑比便利多：内建方法内部会调用子类构造器，因此构造器签名一旦不兼容（比如自定义了参数含义）就会在 `map`/`slice`/`filter` 里静默出错；另一个经典问题是内建方法返回值失去子类的品牌检查能力。实践建议：需要扩展内建行为时优先**组合**（把数组作为私有字段）而非继承，除非明确需要 `Array.isArray` 之外的子类语义。也见 `Symbol.species`。

示例：[`14_classes/08_extends_builtins.js`](14_classes/08_extends_builtins.js)

### `super`（父类引用）

在派生类中 `super` 有两种形态：`super(...)` 在构造器中**调用父类构造器**（必须在访问 `this` 前执行，它负责创建并返回 `this`），`super.method()` / `super.prop` 则在方法中**沿父类原型查找**。关键细节：`super` 不是变量，它是关键字，其指向在**定义时**由 `[[HomeObject]]` 静态确定——因此把方法提取出来单独调用，`super` 依然有效，而 `this` 会丢（这是 `super` 比 `Parent.prototype.m.call(this)` 更可靠的原因）。常见误解是在箭头函数里以为 `super` 会随调用者变化。

示例：[`14_classes/07_inheritance_extends.js`](14_classes/07_inheritance_extends.js)

### `super.method()`（父类方法调用）

在子类方法中调用「上一级实现」，是方法重写里保留父类行为的标准手段。它的查找起点是**当前类的 `prototype` 的父级**，而不是 `this` 的原型，这一区别在多层继承中很关键（用 `this.__proto__.m()` 会在更深继承时出错）。关键细节：`super.method()` 调用时 `this` 仍是当前实例，所以父类方法里的 `this` 指向子类实例——这正是模板方法模式（父类定义流程、子类填空）能工作的原因。也见 Override（方法重写）、`super`。

示例：[`14_classes/07_inheritance_extends.js`](14_classes/07_inheritance_extends.js)

### Override（方法重写）

子类用同名方法覆盖父类实现。由于是**原型链查找**，重写只是「在更近的一层找到了同名属性」，并没有修改父类；父类的其他实例完全不受影响。关键细节：重写会**完全替换**行为，若还想保留父类逻辑必须显式调用 `super.method()`；字段也会发生类似覆盖但语义不同——父类字段在 `super()` 期间先被初始化，之后子类字段初始化会再次覆盖同名属性。也见 shadowing（属性遮蔽）、`super.method()`。

示例：[`14_classes/14_polymorphism.js`](14_classes/14_polymorphism.js)

### Abstract class pattern（抽象类模式）

JavaScript **没有** `abstract` 关键字，所谓抽象类是用约定模拟出来的：父类方法里直接 `throw new Error("必须由子类实现")`，或用一个未实现的私有标记做构造期检查（在父类构造器中判断 `this.constructor === Parent` 就抛错）。前者是「运行到才报错」的接口约定，后者能在实例化时就拦住直接 `new` 抽象类的行为。关键细节：TS 的 `abstract` 只在编译期检查，运行时的 JS 代码仍需这类运行时防护；也可以用 `new.target` 做更优雅的实现。也见 Polymorphism（多态）。

示例：[`14_classes/10_abstract_pattern.js`](14_classes/10_abstract_pattern.js)

### Polymorphism（多态）

「同一段调用代码，按对象的实际类型执行不同实现」的能力，在 JS 里由原型链动态查找天然提供——父类声明的流程调用 `this.speak()`，具体执行哪个 `speak` 取决于实例的原型链。它与「接口」无关（JS 没有接口，靠**鸭子类型**），也与重载无关（JS 无函数重载）。关键细节：多态是运行时决议的，因此可做开放封闭式的扩展——新增子类无需修改调用方代码。也见 Override（方法重写）、Duck typing 与 `instanceof`。

示例：[`14_classes/14_polymorphism.js`](14_classes/14_polymorphism.js)

### Mixins（混入）

由于 JS 只有单继承，需要「从多个来源组合能力」时用混入：定义一个接收基类、返回增强后子类的函数（`const Serializable = Base => class extends Base {...}`），再 `class X extends Serializable(Base)` 叠加。这套「类工厂 + `extends 表达式`」的组合是 JS 里最正统的 mixin 写法。关键细节：混入的方法在原型链上形成一条线性链条，多个混入的顺序会影响同名方法的解析（后者覆盖前者，`super` 指向链的上一环）；`Object.assign(proto, {...})` 那种「拷贝方法」的简易混入不会建立原型链，也不会触发 `super`。也见 Method resolution order（方法解析顺序）。

示例：[`14_classes/11_mixins.js`](14_classes/11_mixins.js)

### Instance branding（实例品牌检查）

用私有字段或 `WeakSet` 给实例打上「不可伪造的标记」，再通过 `#field in obj` 或 `WeakSet.has(obj)` 判断某个对象是否真由本类创建，而不是仅仅「长得像」。这是比 `instanceof` 更严格的类型检查：`instanceof` 可以被 `Object.create(Foo.prototype)` 或改 `Symbol.hasInstance` 绕过，而私有字段无法从外部伪造。关键细节：`#x in obj` 要求 `obj` 是对象（否则抛 `TypeError`），并且该私有名必须在当前类体作用域内。典型用途是库内部的方法参数校验。

示例：[`14_classes/09_instanceof_and_brands.js`](14_classes/09_instanceof_and_brands.js)

### `instanceof`（instanceof 运算符）

`a instanceof B` 检查 `B.prototype` 是否出现在 `a` 的原型链上——注意它查的是**原型**而非「谁创建的」，因此改原型或跨 `iframe`/多 realm 时会失效（不同 realm 的 `Array.prototype` 不同）。关键细节：它的实际算法是调用 `B[Symbol.hasInstance](a)`，所以可被自定义；原始值一律返回 `false`（`1 instanceof Number` 为假）。常见误解是用它做可靠的类型判断——实际工程中更稳的是品牌检查、`Array.isArray` 这类专用方法，或 `Object.prototype.toString.call`。也见 `Symbol.hasInstance`。

示例：[`14_classes/09_instanceof_and_brands.js`](14_classes/09_instanceof_and_brands.js)

### `Symbol.hasInstance`

`instanceof` 背后的钩子方法，定义为静态方法 `static [Symbol.hasInstance](obj) { ... }`，返回布尔值。它让类能自定义「什么算我的实例」，实现结构化判定而不仅是原型链判定（例如「任何带 `length` 和 `forEach` 的对象都算我的实例」）。关键细节：`Function.prototype[Symbol.hasInstance]` 上挂着默认实现（即原型链检查），自定义会**覆盖**它；`instanceof` 的规范算法优先取右操作数的 `Symbol.hasInstance`，取不到才回落。注意该钩子在 `Symbol.hasInstance` 为不可调用值时会抛 `TypeError`。

示例：[`14_classes/12_tostring_and_symbols.js`](14_classes/12_tostring_and_symbols.js)

### `Symbol.species`

一个**静态 getter**，用于指定「派生操作应当构造哪种类型」。典型场景：自定义的 `MyArray extends Array`，调用 `.map()` 时引擎会读取构造函数的 `Symbol.species`，用它决定新对象是 `MyArray` 还是普通 `Array`。默认行为是返回 `this`（即子类），这可能导致内建方法意外造出子类实例；返回 `Array` 即可「降级」。关键细节：由于读取的是 `constructor[Symbol.species]`，改 `constructor` 会影响结果；这是一个偏底层、少用但理解内建类继承时绕不开的钩子。

示例：[`14_classes/15_symbol_species.js`](14_classes/15_symbol_species.js)

### `Symbol.toPrimitive`

对象转原始值时的最高优先级钩子：`obj[Symbol.toPrimitive](hint)`，`hint` 为 `"number"`、`"string"` 或 `"default"`，决定了 `+`、`==`、模板字符串、`Number()`、`` `${obj}` `` 等场景如何取值。它优先于 `valueOf` / `toString`，是精确控制类型转换顺序的唯一手段（例如让 `Money + Money` 有意义、让日期类对象在 `+` 下走字符串）。关键细节：必须返回原始值，返回对象会抛 `TypeError`；`hint` 为 `"default"` 出现在 `+`、`==` 和 `Date` 之外的松散比较中。也见 `Symbol.toStringTag`。

示例：[`14_classes/12_tostring_and_symbols.js`](14_classes/12_tostring_and_symbols.js)

### `Symbol.toStringTag`

一个字符串值属性，用来定制 `Object.prototype.toString.call(obj)` 的输出（结果为 `"[object Xxx]"`）。它是**唯一**能在不改写 `toString` 的情况下影响这个「类型字符串」的方式，所以在做跨 realm 的类型判断库（如各版本 `is-plain-object`）里很常用。关键细节：它不改变 `typeof`（仍是 `"object"`），也不影响 `${obj}`（那走 `Symbol.toPrimitive`/`toString`）。类中可写 `get [Symbol.toStringTag]() { return "MyType" }`，内建对象（`Map`、`Promise` 等）都靠它标记自己。

示例：[`14_classes/12_tostring_and_symbols.js`](14_classes/12_tostring_and_symbols.js)

### Decorator pattern（类装饰器模式）

JavaScript 长期没有装饰器语法，实践中用**函数包装**实现：`const logged = Klass => class extends Klass { ... }`，或用 `Object.defineProperty` 给原型/静态成员加行为。它的价值是把日志、缓存、权限校验等横切关注点从业务类中剥离。关键细节：装饰器提案（stage 3）语法 `@decorator` 通过 `Symbol.metadata` 与新的 `addInitializer` 提供标准化能力，与转译器（旧 TS/Babel）的 `experimentalDecorators` 语义**不兼容**，这是实际项目中最容易踩的坑。也见 Mixins（混入）。

示例：[`14_classes/13_class_decorator_pattern.js`](14_classes/13_class_decorator_pattern.js)

### `this`

函数调用时由**调用方式**决定的隐式参数，指向「当前执行上下文相关的对象」，而不是函数自身或定义位置（箭头函数除外）。它存在的意义是让方法能操作「调用它的那个对象」，从而支持多态式的复用。关键细节：`this` 在**非严格模式**下默认指向 `globalThis`，在严格模式/模块/类体中默认是 `undefined`——同一个函数被不同方式调用 `this` 就不同。常见误解是以为 `this` 指向函数或指向「定义它的对象」；箭头函数里它又变成词法绑定。也见 `this` binding rules（`this` 绑定规则）。

示例：[`15_this_and_context/01_this_rules.js`](15_this_and_context/01_this_rules.js)

### Default binding（默认绑定）

四种 `this` 规则中最弱的一种：函数被**以裸调用形式**执行（`fn()`、无接收者）时，`this` 取默认值——非严格模式是 `globalThis`，严格模式是 `undefined`。它是最常导致「Cannot read properties of undefined」的原因，典型场景是把方法当普通函数传递（回调、`setTimeout`、事件处理器里的普通函数）。关键细节：模块顶层代码默认是严格模式，所以 Node/ESM 里裸调用的 `this` 是 `undefined` 而非全局对象。也见 `this` 丢失（方法提取）。

示例：[`15_this_and_context/01_this_rules.js`](15_this_and_context/01_this_rules.js)

### Implicit binding（隐式绑定）

调用写成 `obj.method()` 时，`this` 指向点号左边的对象——这是日常最常用的绑定方式。关键细节：只有**最后一层**接收者算数，`a.b.c()` 的 `this` 是 `b`；一旦把 `obj.method` 存进变量再调用（`const m = obj.method; m()`），接收者信息就丢了，退化为默认绑定，这就是著名的 this 丢失问题。另一种隐性陷阱是回调传参：`arr.forEach(obj.method)` 同样丢 `this`。也见 `this` 丢失（方法提取）、Explicit binding（显式绑定）。

示例：[`15_this_and_context/02_this_in_method.js`](15_this_and_context/02_this_in_method.js)

### Explicit binding（显式绑定）

用 `call` / `apply` / `bind` 手动指定 `this`，是四种规则中最直接的干预手段。`call(thisArg, ...args)` 与 `apply(thisArg, argsArray)` 只影响**本次调用**，`bind(thisArg, ...partial)` 返回一个**永久绑定**的新函数（后续再用 `call` 也无法改回，除了用 `new` 调用绑定函数时 `this` 会被忽略）。关键细节：把 `null` / `undefined` 作为 `thisArg` 时，非严格模式下会被替换为全局对象；`bind` 还能做偏函数（预置部分参数）。也见 Lexical this（词法 this）。

示例：[`15_this_and_context/04_explicit_binding.js`](15_this_and_context/04_explicit_binding.js)

### `new` binding（`new` 绑定）

用 `new Fn()` 调用时，`this` 指向**新建的那个对象**，其原型为 `Fn.prototype`。这是四条规则中优先级最高的一档（仅次于箭头函数的词法绑定）。关键细节：无论函数内部怎么写，`new` 调用都会创造一个全新的 `this`；如果构造函数显式 `return` 一个对象，那个返回值会取代新对象，但 `return` 原始值会被忽略（这是 `new` 绑定会被「返回对象」绕过的唯一情形）。也见 `new` operator（`new` 运算符）、Binding priority（绑定优先级）。

示例：[`15_this_and_context/05_new_binding.js`](15_this_and_context/05_new_binding.js)

### Binding priority（绑定优先级）

四条规则并非平级，判定顺序是：**箭头函数（词法 `this`）→ `new` 绑定 → 显式绑定（`call`/`apply`/`bind`）→ 隐式绑定（`obj.fn()`）→ 默认绑定**。记忆要点是 `new` 能压过 `bind`（`new boundFn()` 里 `bind` 指定的 `this` 被忽略）——这可以用 `bind` 一个空函数再 `new` 它来验证。关键细节：箭头函数不参与这套竞争，它的 `this` 在外层作用域就已锁定；在类字段里用箭头函数定义方法，等于用词法绑定永久「钉死」`this`。也见 Lexical this（词法 this）。

示例：[`15_this_and_context/06_this_priority.js`](15_this_and_context/06_this_priority.js)

### Losing `this`（this 丢失 / 方法提取）

把方法从对象上取下来传递（`const fn = obj.method`、`setTimeout(obj.method, 0)`、`arr.map(obj.method)`）后，调用时不再有接收者，`this` 退化为 `undefined` 或全局对象，导致运行时错误或静默写错对象。这是 JavaScript 最经典的一类 bug，也是「隐式绑定只在点号调用那一刻生效」的直接推论。三种修复：`bind` 固定、用箭头函数包装（`() => obj.method()`）、把方法改成箭头函数类字段（牺牲每实例一份函数的内存）。也见 Lexical this（词法 this）、Implicit binding（隐式绑定）。

示例：[`15_this_and_context/07_this_in_callbacks.js`](15_this_and_context/07_this_in_callbacks.js)

### Lexical `this`（词法 this / 箭头函数）

箭头函数**没有自己的 `this`**：它不参与任何绑定规则，`this` 直接取定义处外层作用域的 `this`（对类字段箭头函数而言就是实例 `this`）。这解决了回调里 `this` 丢失的问题，代价是**无法被 `call`/`apply`/`bind` 改变**，也不能作为构造函数。关键细节：这个特性让箭头函数非常适合 `setTimeout`、事件回调、`map`/`filter` 这类传递场景，但**不适合**对象方法定义（`{ handle: () => this.x }` 里的 `this` 是外层，不是对象）。也见 Binding priority（绑定优先级）、Losing `this`（this 丢失）。

示例：[`15_this_and_context/03_this_in_arrow.js`](15_this_and_context/03_this_in_arrow.js)

### Class body `this`（类中的 this）

类体中各位置的 `this` 需要分开看：静态方法里的 `this` 指向**类本身**（子类调用静态方法时指向子类，这使得 `static create()` 工厂能返回正确类型）；实例方法与实例字段里的 `this` 指向实例；而 `constructor` 中在派生类里必须 `super()` 之后才有 `this`。关键细节：类体默认严格模式，所以未绑定的方法提取出去后 `this` 是 `undefined` 而不是全局对象（比非严格模式更早暴露问题）；把方法作为回调传递必须提前绑定或用箭头函数字段。

示例：[`15_this_and_context/08_this_in_class.js`](15_this_and_context/08_this_in_class.js)

### `globalThis`

ES2020 引入的、跨环境统一的全局对象引用，取代了过去 `window` / `self` / `global` / `globalThis` 各写一套的兼容代码。它让「在任何环境都能拿到全局对象」成为语言级保证。关键细节：普通函数裸调用时非严格模式下的 `this` 就是它；在模块与类体中裸调用的 `this` 是 `undefined`，此时要用 `globalThis` 显式取全局。它的属性可以像普通全局变量一样访问，但用 `globalThis.foo = 1` 写入时注意别覆盖内建（如 `globalThis.Array`）。

示例：[`15_this_and_context/09_globalthis.js`](15_this_and_context/09_globalthis.js)

### prototype（原型属性）

**只有函数（以及类）才有**的 `prototype` 属性，它指向一个对象，内容将成为「用 `new` 创建的所有实例的原型」。注意它和「实例自己的原型」是两回事：`Foo.prototype` 是「将来实例的原型」，而 `instance.__proto__` 是「实例自己的原型」，满足 `instance.__proto__ === Foo.prototype`。关键细节：`prototype` 上的 `constructor` 默认指回函数本身；箭头函数没有 `prototype`（不能作构造器）；改写整个 `prototype` 对象会丢失原有的 `constructor` 指向。也见 `__proto__`（隐式原型）。

示例：[`16_prototype/02_proto_vs_prototype.js`](16_prototype/02_proto_vs_prototype.js)

### `__proto__` / `[[Prototype]]`（隐式原型）

**每个普通对象都有**的内部槽 `[[Prototype]]`，就是「我自己的原型」，属性查找失败时沿它继续找。访问它的标准 API 是 `Object.getPrototypeOf(obj)` / `Object.setPrototypeOf(obj, p)`，`__proto__` 只是历史遗留的访问器属性（在 `Object.prototype` 上，因此可以被遮蔽、在 `Object.create(null)` 的对象上不存在）。关键细节：`__proto__` 写在对象字面量里（`{ __proto__: p }`）是**设置原型**的特殊语法，而 `obj["__proto__"] = p` 是调用 setter；为性能与安全性考虑，优先用 `Object.create` 而非事后 `setPrototypeOf`。也见 prototype（原型属性）。

示例：[`16_prototype/02_proto_vs_prototype.js`](16_prototype/02_proto_vs_prototype.js)

### Prototype chain（原型链）

对象查找属性时，若自身没有就沿着 `[[Prototype]]` 一路往上找，直到 `null` 为止，这条路径就是原型链。它解释了 JS 的继承机制：`class` 只是原型继承的语法糖，方法定义在 `prototype` 上从而被所有实例共享。关键区分是**函数才有的 `prototype`** 与**每个对象都有的 `__proto__`** —— 前者是「将来实例的原型」，后者是「我自己的原型」。属性遮蔽（shadowing）就发生在这条链上。

示例：[`16_prototype/01_prototype_chain.js`](16_prototype/01_prototype_chain.js)

### Property shadowing（属性遮蔽）

当对象自身拥有与原型同名的属性时，查找会在**自身这一层就停下**，原型上的那份被「遮蔽」而不是被覆盖。这解释了为什么两个实例可以各自修改 `this.count` 而互不影响，也解释了为什么给一个实例赋值不会改变原型对象。关键细节：遮蔽只作用于**读**——写入总是写到自己身上，除非原型上的同名属性是一个 setter（此时赋值会把 setter 当函数调用而非新建属性）；`delete obj.x` 之后，被遮蔽的原型属性会「重新出现」。也见 Override（方法重写）、Prototype chain（原型链）。

示例：[`16_prototype/07_method_resolution_order.js`](16_prototype/07_method_resolution_order.js)

### Method resolution order（方法解析顺序）

同名方法出现在多个层级时「哪一个会被调用」的规则：沿原型链从**最近的一层**向后找，第一个命中者胜出。在单继承 + mixin 叠加的场景下，这意味着混入的顺序直接决定覆写关系；而 `super.method()` 会让查找从**当前类的上一层**开始，从而按链条依次回退，形成类似「责任链」的调用序列。关键细节：`super` 的起点由定义位置（`[[HomeObject]]`）静态决定，不受运行时 `this` 所属类影响。也见 Mixins（混入）、`super.method()`。

示例：[`16_prototype/07_method_resolution_order.js`](16_prototype/07_method_resolution_order.js)

### `Object.create`（Object.create）

`Object.create(proto, descriptors)` 以一个现成对象为原型创建新对象，是**唯一能直接创建「无原型对象」**（`Object.create(null)`）的方式。它带来两个重要用途：做真正的字典（没有 `toString`、`__proto__` 等继承属性，天然免疫原型污染），以及在不调用构造函数的前提下建立继承关系（ES5 继承链的核心步骤）。关键细节：第二个参数是属性描述符对象，不像普通赋值那样可枚举/可写；`Object.create(proto)` 与 `{ __proto__: proto }` 效果相同但更清晰、性能更可控。也见 ES5 inheritance（ES5 继承）。

示例：[`16_prototype/05_object_create.js`](16_prototype/05_object_create.js)

### ES5 inheritance（ES5 继承 / 寄生组合继承）

在 `class` 出现之前手工搭建继承链的套路：`Child.prototype = Object.create(Parent.prototype)` 建立原型链，`Child.prototype.constructor = Child` 修复构造器指向，再在子类构造器里 `Parent.call(this, ...args)` 复用父类初始化。这三步缺一不可，对应到 `class extends` 就是「原型链接 + super 调用 + constructor 归属」。关键细节：只写 `Child.prototype = new Parent()` 那种「原型式继承」会把父类实例属性错误地放到原型上（被所有子类实例共享），是经典错误写法。也见 `extends`（继承）、`Object.create`。

示例：[`16_prototype/04_inheritance_es5.js`](16_prototype/04_inheritance_es5.js)

### Prototype pollution（原型污染）

攻击者通过可控的键名（常见于 `JSON.parse` 后的对象合并、`obj[key] = value` 的深拷贝/递归赋值）往 `Object.prototype` 上写入属性，导致**整个程序**中所有对象都多出这个属性，从而绕过权限判断、篡改配置或造成拒绝服务。触发点是 `__proto__`、`constructor`、`prototype` 这三个特殊键名被当成普通键递归处理。防御手段：把用户输入与结构操作隔离、用 `Object.create(null)` 或 `Map` 存字典、合并时跳过危险键名、用 `Object.hasOwn` 判断而非 `in`、以及引入 `Object.freeze(Object.prototype)` 之类的加固。它属于原型继承机制被反向利用的安全问题，也见 `Object.create`。

示例：[`16_prototype/08_prototype_pollution_intro.js`](16_prototype/08_prototype_pollution_intro.js)
