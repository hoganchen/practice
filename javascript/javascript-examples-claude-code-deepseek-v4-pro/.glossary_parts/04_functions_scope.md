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
