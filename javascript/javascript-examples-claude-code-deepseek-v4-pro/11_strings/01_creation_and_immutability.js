/**
 * ============================================================================
 * 知识点：字符串的创建方式与不可变性 —— 字面量、String()、new String()、基本包装类型
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】入门
 * 【前置知识】00_hello_world/01_hello_world.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    字符串（String）是 JS 的 7 种原始类型之一，表示一串 UTF-16 编码单元的序列。
 *    它可以通过字面量、String() 函数、模板字符串、String.fromCharCode 等多种方式创建。
 *    与此相关的一个概念叫"基本包装类型"：原始字符串本身没有属性和方法，
 *    但当你写 str.length 或 str.toUpperCase() 时，JS 引擎会临时把它包装成
 *    一个 String 对象（内部称为 ToObject），调用完方法后再丢弃。
 *
 * 2. 为什么需要
 *    文本处理是编程中最常见的任务之一：用户输入、日志、JSON、HTML、SQL……
 *    全部都是字符串。理解"原始值 vs 包装对象"的差别，能解释很多诡异现象，
 *    比如 typeof 'abc' 是 'string' 而 typeof new String('abc') 是 'object'，
 *    以及为什么 new String('a') === 'a' 为 false。
 *
 * 3. 核心语法要点
 *    - 字面量：'单引号'、"双引号"、`反引号（模板字符串）`，三者都是原始值。
 *    - 单引号与双引号在 JS 里**完全等价**，没有语义差别，也不影响性能 ——
 *      这一点和 PHP / Shell / Perl 不同，那些语言里两种引号是真的有区别的。
 *      选哪种只影响"字符串内部含引号时要不要写转义"，以及团队风格约定。
 *    - 真正功能不同的是反引号（模板字符串）：支持 ${} 插值、可跨行。
 *    - String(x)：转换函数，把任意值转成原始字符串（不加 new 时）。
 *    - new String(x)：构造函数，创建一个 String 包装对象（几乎永远不该用）。
 *    - 不可变性：字符串一旦创建就不能被修改。所有"修改"方法都返回新字符串，
 *      原字符串保持不变。s[0] = 'x' 在非严格模式下静默失败，严格模式下抛 TypeError
 *      （本仓库的 .js 都是 ES 模块，默认就是严格模式，所以会抛错）。
 *    - 长度为 0 的字符串是唯一"假值"的字符串：Boolean('') === false。
 *
 * 4. 常见陷阱
 *    - 误以为单引号 / 双引号有语义差别（没有）。真正会翻车的是 **JSON 只认双引号**：
 *      JSON.parse("{'a': 1}") 直接抛 SyntaxError，因为 JSON 规范不是 JS 语法。
 *    - 字符串里出现引号却忘了转义：'don't' 是语法错误（不是"得到 don't"），
 *      要么改用另一种引号包裹 "don't"，要么写成 'don\'t'。
 *    - 用 new String() 创建对象会导致 === 比较失败、typeof 出错、JSON 序列化异常。
 *    - 以为 s.toUpperCase() 会改变 s 本身（不会，必须重新赋值）。
 *    - 字符串索引赋值 s[0] = 'X' 无效且不报错（非严格模式）。
 *    - 空字符串 '' 是假值，但 '0' 和 'false' 都是真值（非空字符串都是真值）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/01_creation_and_immutability.js
 *
 * 【预期输出】
 *   打印各创建方式的 typeof / valueOf / 相等性结果，并用实例演示不可变性。
 *   第 1 节还会对比单引号 / 双引号 / 反引号的等价性与差异，并演示 JSON 对单引号的报错。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 三种字面量写法
// ---------------------------------------------------------------------------

console.log('--- 1. 三种字面量写法 ---');

// 单引号、双引号完全等价，选哪种只是风格问题（内部有引号时可省去转义）
const single = 'hello';
const double = "hello";
// 反引号是模板字符串，支持 ${} 插值和换行，后面 02 文件会专门讲
const backtick = `hello`;

// 三者都是原始值，用 typeof 检测都返回 'string'
console.log('单引号值：', JSON.stringify(single), '| typeof：', typeof single);
console.log('双引号值：', JSON.stringify(double), '| typeof：', typeof double);
console.log('反引号值：', JSON.stringify(backtick), '| typeof：', typeof backtick);

// 原始字符串比较的是"内容"，只要字符序列相同就相等
console.log('single === double：', single === double); // true
console.log('double === backtick：', double === backtick); // true

// ---------------------------------------------------------------------------
// 1.1 单引号 vs 双引号：没有任何语义差别
// ---------------------------------------------------------------------------

console.log('\n--- 1.1 单引号与双引号等价 ---');

// 结论先放这里：两种写法创建出的字符串是同一个值。
// 没有性能差别、没有编码差别、不影响 typeof、不影响 === —— 引擎眼里完全一样。
console.log('两种写法相等吗：', 'hello' === "hello"); // true
// 连"字符串里本来就有另一种引号"这种情况，结果也照样相等（下面 1.2 讲怎么写）
console.log('带引号的内容也相等：', "it's ok" === 'it\'s ok'); // true

// 对比一下别的语言，就知道"没区别"这件事在 JS 里其实是特例：
//   · PHP：'a\nb' 不转义（字面反斜杠 + n），"a\nb" 才转义成换行 —— 语义真的不同
//   · Shell：'$HOME' 原样输出，\"$HOME\" 才做变量展开 —— 语义真的不同
//   · SQL：'文本' 是字符串字面量，"列名" 是标识符 —— 用途都不一样
// JS 里没有这类坑，两种引号纯粹是"你喜欢哪个"。

// ---------------------------------------------------------------------------
// 1.2 唯一的实际差别：内部含引号时要不要转义
// ---------------------------------------------------------------------------

console.log('\n--- 1.2 转义取舍 ---');

// 唯一的实际差别在这儿：字符串内部本身带引号时，用另一种引号包裹最省事，
// 不用写反斜杠，可读性也最好。
const apostrophe = "it's ok"; // 双引号包裹，撇号直接写
const quoted = 'say "hi"'; // 单引号包裹，双引号直接写

console.log('含单引号（用双引号包裹）：', JSON.stringify(apostrophe));
console.log('含双引号（用单引号包裹）：', JSON.stringify(quoted));

// 用同一种引号包裹也行，但必须转义：反斜杠是"给解析器看"的，不进入字符串内容
console.log('双引号里的双引号转义：', "say \"hi\""); // 内容和上面 quoted 完全一样
console.log('单引号里的单引号转义：', 'it\'s ok'); // 内容和上面 apostrophe 完全一样

// 反斜杠是转义符，\\ 表示一个字面反斜杠，\n 表示换行
console.log('转义字符：', JSON.stringify('第一行\n第二行\t制表符\\反斜杠'));

// 陷阱：字符串里有撇号却用单引号包裹、又忘了转义 —— 这是彻头彻尾的语法错误，
// 不是"少了个字符"这种小问题：解析阶段就报 SyntaxError，整个文件都跑不起来。
// 取消下面这行的注释即可复现（错误信息形如：SyntaxError: Invalid or unexpected token）
// const broken = 'don't';

// ---------------------------------------------------------------------------
// 1.3 反引号才是功能不同的那个
// ---------------------------------------------------------------------------

console.log('\n--- 1.3 反引号（模板字符串）---');

// 单/双引号只能靠 + 拼接，也不能跨行（要写 \n）；反引号两样都支持。
const myName = '小明';
console.log('加号拼接：', '你好 ' + myName);
console.log('模板插值：', `你好 ${myName}`);

// 反引号可以直接换行，这一点是单/双引号做不到的
console.log('反引号跨行：', JSON.stringify(`第一行
第二行`));
// 上面等价于单引号写法：JSON.stringify('第一行\n第二行')

// 代价：反引号里出现反引号要转义成 \`，出现 ${ 要转义成 \${
//（不过这两种字符在正常文本里极少见，所以反引号的实际成本很低）
console.log('反引号里写反引号：', `这个符号叫 \`反引号\``);
console.log('美元符号后跟花括号：', `转义后原样输出 \${name}`);

// 插值、跨行、标签模板的完整讲解见 02_template_literals.js 与 10_tagged_templates.js

// ---------------------------------------------------------------------------
// 1.4 唯一会打破"两种引号等价"的场合：JSON
// ---------------------------------------------------------------------------

console.log('\n--- 1.4 JSON 只认双引号 ---');

// 在 JS 源码里两种引号等价，但 **JSON 不是 JS** —— JSON 规范硬性规定
// 字符串必须用双引号。这是"两种引号没区别"这个印象最容易被打破的地方。
console.log('合法 JSON 可以解析：', JSON.stringify(JSON.parse('{"a": 1}')));

// 单引号的 JSON 会直接抛错，而且这个错和"语法错误"是同一类，不是运行时才发现的
try {
  JSON.parse("{'a': 1}");
  console.log('没有报错（不可能走到这里）');
} catch (err) {
  console.log('单引号 JSON 解析失败：', err.constructor.name, '-', err.message);
}

// 实践中的分工：
//   · 往外写 JSON（接口响应、配置文件、localStorage）：JSON.stringify() 自动产出双引号，不用操心；
//   · 手写 JSON 时（照着接口文档敲、改 config.json）：必须写双引号，单引号是最常见的手写错误。
// JSON 的完整规则见 21_json/。

// ---------------------------------------------------------------------------
// 1.5 那到底用哪种？—— 本仓库的约定
// ---------------------------------------------------------------------------

console.log('\n--- 1.5 本仓库的引号约定 ---');

// 既然等价，就需要一条团队约定来避免"同一个文件里两种混着用"。
// 本仓库统一用单引号，由 .prettierrc 里的 "singleQuote": true 保证。
console.log('本仓库风格（单引号）：', 'hello');
console.log('例外（内容含撇号时用双引号）：', "it's ok");
// 另外 eslint.config.js 顶部注释明确写了"不配置任何纯格式规则"：
// 引号风格归 Prettier 管，ESLint 不插手，否则两边会互相打架。

// ---------------------------------------------------------------------------
// 2. String() 转换函数 —— 得到原始值
// ---------------------------------------------------------------------------

console.log('--- 2. String() 转换函数 ---');

// 不加 new 时，String 是一个普通函数，返回原始字符串
console.log('String(123)：', JSON.stringify(String(123)), '| typeof：', typeof String(123));
console.log('String(true)：', JSON.stringify(String(true)));
console.log('String(null)：', JSON.stringify(String(null)));
console.log('String(undefined)：', JSON.stringify(String(undefined)));

// 注意：String(Symbol()) 是允许的，但 '' + Symbol() 会抛错，这是少见的不对称
console.log('String(Symbol("s"))：', JSON.stringify(String(Symbol('s'))));

// 对象转字符串会调用它的 toString()
console.log('String([1, 2, 3])：', JSON.stringify(String([1, 2, 3]))); // 数组用逗号连接
console.log('String({})：', JSON.stringify(String({}))); // 普通对象是 [object Object]

// ---------------------------------------------------------------------------
// 3. new String() —— 包装对象（反面教材）
// ---------------------------------------------------------------------------

console.log('--- 3. new String() 包装对象 ---');

const primitive = 'abc';
// new String(...) 返回的是一个"对象"，不是原始值
const boxed = new String('abc');

console.log('typeof 原始值：', typeof primitive); // 'string'
console.log('typeof 包装对象：', typeof boxed); // 'object'  ← 关键差异

// 严格相等失败：一个是原始值，一个是对象，类型不同
console.log("'abc' === new String('abc')：", primitive === boxed); // false
// 宽松相等成功：== 会把对象拆箱成原始值再比较
console.log("'abc' == new String('abc')：", primitive == boxed); // true（不建议依赖）

// 包装对象是真值，即使内容为空字符串
console.log("Boolean(new String(''))：", Boolean(new String(''))); // true
console.log("Boolean('')：", Boolean('')); // false，空字符串是唯一的假值字符串

// JSON.stringify 对 String 包装对象做了特殊处理，会先拆箱成原始值再序列化，
// 所以这里 outputs 的是 "abc" 而不是 {"0":"a","1":"b","2":"c"}。
// 这是 JSON 规范对包装对象的特例，不代表它是原始值。
console.log('JSON.stringify(包装对象)：', JSON.stringify(boxed));
console.log('JSON.stringify(原始值)：', JSON.stringify(primitive));

// 显式拆箱可以用 valueOf()，得到的是原始字符串
console.log('boxed.valueOf() 的类型：', typeof boxed.valueOf()); // 'string'
// 用 Object() 包装一个原始值，也同样得到包装对象（等价于 new String）
console.log('Object("abc") 的类型：', typeof Object('abc')); // 'object'

// 结论：永远用字面量或 String()，不要写 new String()

// ---------------------------------------------------------------------------
// 4. 基本包装类型：原始值为什么能调用方法
// ---------------------------------------------------------------------------

console.log('--- 4. 基本包装类型 ---');

// 'abc' 是原始值，按理说没有属性。但下面的写法完全合法，
// 因为 JS 引擎在取值时自动做了 ToObject 包装：临时 new String('abc')，
// 拿到方法调用后立刻丢弃这个临时对象。
console.log('原始值调用方法：', primitive.toUpperCase());
console.log('原始值访问属性 length：', primitive.length);

// 但"修改"是做不到的：字符串的索引属性是只读的。
// 本仓库的 .js 文件都是 ES 模块（package.json 里 "type": "module"），
// 而 ES 模块的代码默认就是严格模式（strict mode）。
// 严格模式下给只读属性赋值会直接抛 TypeError，所以必须 try/catch 包起来演示。
try {
  primitive[0] = 'X'; // 抛 TypeError: Cannot assign to read only property '0'
  console.log('没有报错（不可能走到这里）');
} catch (err) {
  console.log('修改字符串索引抛出：', err.constructor.name, '-', err.message);
}

// 即使不抛错，结果也一样：原字符串不可能被改动
console.log('尝试修改之后 primitive 仍是：', JSON.stringify(primitive));

// 想让首字母变大写，只能生成一个新字符串
console.log('生成新串：', JSON.stringify('X' + primitive.slice(1)));

// ---------------------------------------------------------------------------
// 5. 不可变性：所有"修改"都返回新字符串
// ---------------------------------------------------------------------------

console.log('--- 5. 字符串不可变性 ---');

const original = 'Hello';
// toUpperCase() 返回的是全新的字符串，original 本身没有被动过
const upper = original.toUpperCase();

console.log('original：', JSON.stringify(original));
console.log('upper：', JSON.stringify(upper));
console.log('两者相等吗：', original === upper); // false

// 字符串内容相同就共享内存（引擎内部的字符串驻留优化），但这属于实现细节，
// 语言层面只需要记住：字符串是值类型语义，赋值即复制引用（内容不可变所以安全）
const a = 'shared';
const b = 'shared';
console.log('a === b：', a === b); // true

// 拼接也不会修改原串，而是生成新串
const c = a + '!';
console.log('拼接后 a：', JSON.stringify(a), '| 新串 c：', JSON.stringify(c));

// 实战含义：在循环里反复 += 拼接大字符串，每次都会生成新串，
// 大量拼接时用数组 push + join 效率更高（见 06_split_and_join.js）
let acc = '';
const parts = [];
for (let i = 0; i < 5; i++) {
  acc += i; // 每次都产生一个新字符串
  parts.push(i); // 只改数组，不产生新字符串
}
console.log('用 += 累加：', JSON.stringify(acc));
console.log('用数组 join：', JSON.stringify(parts.join('')));

// ---------------------------------------------------------------------------
// 6. 空字符串与假值
// ---------------------------------------------------------------------------

console.log('--- 6. 空字符串与假值 ---');

// 字符串的假值只有一种：长度 0 的字符串
console.log("Boolean('')：", Boolean('')); // false
console.log("Boolean(' ')：", Boolean(' ')); // true，含一个空格所以非空
console.log("Boolean('0')：", Boolean('0')); // true，非空字符串都是真值
console.log("Boolean('false')：", Boolean('false')); // true

// 判断"用户是否真的输入了内容"时，通常要先 trim 再判空
const userInput = '   ';
console.log('原始输入是否为空：', userInput.length === 0); // false
console.log('trim 后是否为空：', userInput.trim().length === 0); // true

console.log('\n全部演示完毕。');
