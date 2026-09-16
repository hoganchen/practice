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
