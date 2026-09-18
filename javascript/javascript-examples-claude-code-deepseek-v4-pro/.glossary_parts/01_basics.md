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
