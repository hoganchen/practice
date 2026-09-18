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
