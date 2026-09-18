/**
 * ============================================================================
 * 知识点：void 运算符 —— 求值后丢弃结果，只返回 undefined
 * ============================================================================
 *
 * 【所属分类】04_operators —— 运算符
 * 【难度等级】入门
 * 【前置知识】04_operators/08_ternary_and_comma.js、04_operators/10_operator_precedence.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    void 是 JavaScript 里**优先级最高**的一元运算符之一（和 typeof、delete、
 *    ! 、+ - 同类），写法是：
 *
 *        void 表达式
 *
 *    它的语义只有一句话：
 *        **先把表达式求值（该有的副作用照常发生），然后丢弃这个值，返回 undefined。**
 *
 *    对照记忆（这三个一元运算符放在一起最好理解）：
 *        typeof x   -> 求值 x，返回它的"类型字符串"
 *        delete o.k -> 求值 o.k，返回"是否删除成功"的布尔值
 *        void  x    -> 求值 x，**永远返回 undefined**
 *
 *    void 是 04_operators 目录里唯一一个此前没被单独讲过的运算符 ——
 *    它虽然冷门，但老代码里到处都有它，读不懂就会写出奇怪的 bug。
 *
 * 2. 为什么需要它（真实项目场景）
 *    (1) 历史刚需：安全地得到 undefined。
 *        ES5 之前，undefined 只是全局对象的一个**普通可写属性**，
 *        任何代码都能写 `undefined = 123`（或者局部作用域里 `var undefined`），
 *        于是 `x === undefined` 这种判断会被悄悄破坏。
 *        而 `void 0` 是**语法层面**保证返回 undefined 的表达式，
 *        谁都改不了它，所以在老库里被大量使用：
 *            if (value === void 0) { ... }
 *        ES5 起 undefined 变成了不可写、不可配置的全局属性（在严格模式下更是
 *        连赋值都会抛错），所以**今天的代码直接用 undefined 就好**，
 *        `void 0` 属于"读老代码必须认识、写新代码不必再用"的知识。
 *    (2) 写法上让解析器明确知道"这是一个表达式语句"。
 *        函数声明 `function f(){}` 出现在语句开头时是**声明**不是表达式，
 *        后面直接跟 `()` 会解析失败。用 `void`（或 `!`、`+`）把它变成表达式，
 *        就得到 IIFE 的经典写法：
 *            void (function () { ... })();
 *        本仓库 06_functions/06_iife.js 里就有这种写法。
 *    (3) 明确表达"我故意不要这个返回值"。
 *        这是 void 在现代代码里**唯一还站得住脚的用途**：
 *            void doSomething();   // 告诉读代码的人：这里有意忽略返回值
 *        它比 `;` 开头更有意图，比 `undefined;` 更诚实（后者看起来像写错了）。
 *        一些 lint 规则（如 no-void 的反向用途、no-unused-expressions）
 *        正好需要这种显式标记。
 *    (4) 老式 HTML 里的 `javascript:void(0)`。
 *        在那个年代用 `<a href="javascript:void(0)" onclick="...">` 是为了
 *        "让链接可点击但不跳转"。原因：`href="javascript:..."` 里的代码
 *        **其返回值会被当作新页面的内容**——如果表达式返回字符串，
 *        浏览器会用这个字符串**替换整个页面**（返回数字等非字符串值的行为
 *        在各浏览器间并不一致，属于不该依赖的灰色地带）。
 *        于是用 void 把返回值"确定地"变成 undefined，页面就不会被替换、也不会跳转 ——
 *        大家图的就是这份确定。这一节讲的是**当年的动机**，浏览器不会在本例中
 *        被真的触发导航，所以本文件用的是模拟。
 *        现在不该用的原因：可访问性差（读屏软件）、无法在新标签打开、
 *        与 CSP 冲突、SEO 不友好。正确替代品是 `<button type="button">`
 *        或 `<a href="#" role="button">` + `event.preventDefault()`。
 *
 * 3. 核心语法要点
 *    (1) 语法形式：`void 一元表达式`（也可以写 `void(表达式)`，二者等价，
 *        括号只是普通的分组括号，不是 void 的一部分）。
 *    (2) 优先级：void 属于一元运算符（优先级 14，和 ! ~ + - typeof delete 同级），
 *        **高于**所有二元运算符（+ - * / && 等）。
 *        所以 `void 0 + 1` 会被解析成 `(void 0) + 1`，结果是 `undefined + 1` = NaN，
 *        而**不是** `void (0 + 1)` = undefined。这是本节最容易搞错的地方。
 *        想要后者必须显式加括号：`void (0 + 1)`。
 *    (3) 结合性：一元运算符是**从右向左**的，所以 `void void 0` 合法，
 *        结果是 undefined（内层已返回 undefined，外层再丢掉一次）。
 *    (4) 求值副作用保留：`void f()` 会**真的调用 f**，只是不要它的返回值。
 *        void 不会跳过求值，这一点常被误解。
 *    (5) void 的结果永远是 undefined，与操作数是什么**完全无关**：
 *        void 123 -> undefined、void 'abc' -> undefined、void null -> undefined、
 *        void (() => 1)() -> undefined（但箭头函数确实被执行了）。
 *    (6) 与 01_syntax_basics/05 的关系：那节把 void 列在"关键字/保留字"清单里。
 *        准确地说，void 是**运算符关键字**（operator keyword）：
 *        它不能用作变量名（`let void = 1` 是 SyntaxError），
 *        但可以用作对象属性名（`obj.void` 合法，因为属性名走 IdentifierName 这套更宽的语法）。
 *
 * 4. 常见陷阱
 *    - 【优先级搞错】`void 0 + 1` 是 NaN 而不是 undefined（见上）。
 *      保险写法：永远给 void 的操作数加括号 `void (0 + 1)`。
 *    - 【以为 void 会"不执行"】它的重点是"丢弃返回值"，不是"跳过执行"。
 *    - 【在现代代码里用 void 0 代替 undefined】没有必要，反而降低可读性。
 *      用 `void 0` 只在两种情形下合理：需要"表达式"而非"标识符"时，
 *      或者要与老代码风格保持一致时。
 *    - 【写 `javascript:void(0)`】现代项目不要这么做（可访问性 / CSP / SEO）。
 *    - 【误以为是函数】void 是运算符不是函数，`void(0)` 里的括号只是分组括号，
 *      逗号运算符能给"多个参数"的错觉：`void (a, b)` 其实是先算逗号表达式
 *      得到 b，再 void 掉 —— 结果还是 undefined。
 *    - 【在箭头函数里踩坑】`() => void doSomething()` 会把返回值变成 undefined，
 *      如果你本意是"返回 doSomething 的结果"，那 void 在这里就是帮倒忙。
 *    - 【delete / typeof 与 void 的优先级同级】，混用时不要靠记忆，直接加括号。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 04_operators/11_void_operator.js
 *
 * 【预期输出】
 *   逐段打印：void 的基本语义、它保留副作用、优先级实验（`void 0 + 1` = NaN）、
 *   `void 0` 作为历史安全写法、void IIFE、`javascript:void(0)` 的返回值语义模拟、
 *   void 作为保留字（用 try/catch 捕获动态解析的 SyntaxError，不会真的崩溃），
 *   以及 void 与现代写法的对比。全程退出码 0。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本语义：求值 -> 丢弃 -> 返回 undefined
// ---------------------------------------------------------------------------

console.log('--- 1. void 的基本语义 ---');

// void 的结果永远是 undefined，与操作数是什么类型完全无关。
console.log('void 123          =', void 123);
console.log("void 'abc'        =", void 'abc');
console.log('void null         =', void null);
console.log('void {}           =', void {});
console.log('void []           =', void []);

// 用 typeof 再看一眼：无论操作数是什么，结果都是 'undefined'。
console.log("typeof (void 'abc') =", typeof void 'abc');
console.log("typeof (void {})    =", typeof void {});

// 对比三个同类的一元运算符，差异一目了然：
console.log('--- 对比 typeof / delete / void 三个一元运算符 ---');
const demo = { k: 1 };
console.log("typeof demo.k  =", typeof demo.k, "  // 返回类型字符串");
console.log('delete demo.k  =', delete demo.k, ' // 返回是否删除成功（布尔）');
console.log('void demo      =', void demo, ' // 永远返回 undefined（注意 demo 对象本身毫发无损）');
console.log('delete 之后 demo =', JSON.stringify(demo), '// 属性真的被删掉了');
console.log('void 之后 demo   =', JSON.stringify({ k: 1 }), '// void 不会改动任何东西，只是丢掉值');

// ---------------------------------------------------------------------------
// 2. 关键点：void 会保留副作用（它只是"丢弃返回值"）
// ---------------------------------------------------------------------------

console.log('--- 2. void 保留副作用（会真的执行！） ---');

// 定义一个带副作用的函数：它把计数加一，并返回计数。
let callCount = 0;
function incrementAndReturn() {
  callCount += 1;
  console.log('    （incrementAndReturn 被真实调用了，当前计数 =', callCount, '）');
  return callCount;
}

// 用 void 包住调用：副作用照常发生，返回值被丢弃。
const resultOfVoid = void incrementAndReturn();
console.log('  void incrementAndReturn() 的返回值 =', resultOfVoid);
console.log('  函数实际被调用的次数 callCount =', callCount, ' <- 说明副作用保留');
console.log('  ^ 常见误解是"void 会跳过执行"，这是错的：void 只是把返回值扔掉。');

// 再验证一次：void 不影响对象的可变操作
const list = [1];
void list.push(2); // push 真的执行了
console.log('  void list.push(2) 之后 list =', JSON.stringify(list), '// push 生效');

// ---------------------------------------------------------------------------
// 3. 优先级实验：void 0 + 1 到底等于什么？
// ---------------------------------------------------------------------------

console.log('--- 3. 优先级：void 0 + 1 是 NaN 而不是 undefined ---');

// void 是一元运算符，优先级高于二元运算符 +，所以：
//     void 0 + 1   ===   (void 0) + 1   ===   undefined + 1   ===   NaN
console.log('  void 0 + 1        =', void 0 + 1);
console.log('  ^ 解析成 (void 0) + 1 -> undefined + 1 -> NaN');
console.log('  验证 typeof      ：', typeof (void 0 + 1), '（是 number，不是 undefined）');

// 想要"先算 0 + 1 再丢掉"，必须显式加括号：
console.log('  void (0 + 1)      =', void (0 + 1), ' <- 加括号才是"丢掉整个表达式的结果"');

// 更直观的对照：字符串拼接也会被 void 的"早早返回 undefined"打乱
console.log("  void 0 + 'x'      =", void 0 + 'x', "  // (void 0) + 'x' -> undefined 转成字符串 'undefined'");
console.log("  void (0 + 'x')    =", void (0 + 'x'), " <- 丢掉 '0x'，返回 undefined");
console.log("  ^ 一个得到字符串 'undefinedx'，一个得到 undefined，差别极大。");

// 与其它一元运算符混用：一元运算符从右往左结合
console.log('  void void 0       =', void void 0, '  // 内层先返回 undefined，外层再丢一次');
console.log('  void !0           =', void !0, '  // !0 是 true，被 void 丢掉 -> undefined');
console.log('  typeof void 0     =', typeof void 0, ' // 注意：是 typeof (void 0)，得到 "undefined"');

// 加括号的写法与不加括号完全等价（括号只是分组，void 不是函数）
console.log('  void 0            =', void 0);
console.log('  void(0)           =', void (0));
console.log('  二者相等吗：', void 0 === void (0), '<- void 不是函数，(0) 只是分组括号');

// ---------------------------------------------------------------------------
// 4. 用途一：void 0 —— 获取 undefined 的历史安全写法
// ---------------------------------------------------------------------------

console.log('--- 4. 用途一：void 0 作为"安全 undefined"的历史写法 ---');

// 【背景】ES5 之前 undefined 是全局对象的**可写属性**，能被改掉：
//     undefined = 123;      // 老引擎里合法，且真的改了
//     甚至在函数作用域里 var undefined = 123; 也能遮蔽全局的 undefined
// 于是 `x === undefined` 变得不可靠。
// 而 `void 0` 不依赖任何变量，是纯语法，**任何代码都改不了它**，所以老库里遍地都是。
console.log('  void 0 === undefined        ：', void 0 === undefined);
console.log('  typeof void 0               ：', typeof void 0);

// 现代情况：undefined 已经是不可写、不可配置的全局属性。
try {
  // 在 ESM（严格模式）里对 undefined 赋值会抛 TypeError。
  // 这里必须用 try/catch：我们就是要演示"它会报错"，但不能让程序崩掉。
  // （注意：直接写 `undefined = 1` 这种赋值在严格模式下就是运行时报错，
  //   而 `let undefined = 1` 这种声明则是**语法错误**，语法错误无法用 try/catch 捕获，
  //   所以下面在 4.1 节用 eval 的方式单独演示。）
  undefined = 123;
  console.log('  （非严格模式下这里不会抛错，但赋值也不会生效）');
} catch (err) {
  console.log('  给 undefined 赋值的结果：抛出', err.constructor.name, '-', err.message);
}
console.log('  undefined 现在的值仍然是：', undefined, '- 说明它已经不可被改写了');

// 顺便验证一下 undefined 的属性描述符（不可写、不可枚举、不可配置）
console.log('  undefined 的属性描述符：', JSON.stringify(Object.getOwnPropertyDescriptor(globalThis, 'undefined')));
console.log('  ^ writable: false —— 这正是 void 0 退役的原因：现代环境里 undefined 已经很安全了。');

// 现代建议：直接用 undefined。只有在"必须是表达式而不能是标识符"的场合
// （例如作为函数参数的默认值占位写法、或某些元编程场景）才用 void 0。
console.log('  现代写法对比：');
console.log('    老代码： if (v === void 0) { ... }');
console.log('    新代码： if (v === undefined) { ... }   <- 两者行为完全一致，优先写这个');

// ---------------------------------------------------------------------------
// 5. 用途二：void 让 IIFE 变成"表达式语句"
// ---------------------------------------------------------------------------

console.log('--- 5. 用途二：void (function(){})() 形式的 IIFE ---');

// 【背景】语句开头出现 function 关键字时，解析器认为那是"函数声明"，
// 声明后面直接跟 () 会解析失败。解决办法是让解析器看出"这是表达式"：
//     !function () {}();      // 用 ! 把函数变成表达式
//     +function () {}();      // 同理
//     (function () {})();     // 最常见的做法：用括号包起来
//     void function () {}();  // 用 void —— 意图最明确：我不需要返回值
// 本仓库 06_functions/06_iife.js 里就有这种写法。

// 下面这个 IIFE 用 void 开头，它的返回值（这里是字符串）被 void 丢弃。
void (function iifeName() {
  console.log('  IIFE 被执行了（void 只是丢掉了它的返回值）');
  return '这个返回值会被 void 丢弃';
})();

// 用一个变量接住 void IIFE 的结果，证明它确实是 undefined。
const iifeResult = void (function () {
  console.log('  第二个 IIFE 也执行了');
  return '同样被丢弃';
})();
console.log('  接住 void IIFE 的结果 =', iifeResult, '（typeof:', typeof iifeResult, '）');

// 为什么 IIFE 需要"包一层"？下面用动态解析把这个区别演示出来。
// 直接把 `function f(){}()` 写进源码会**整个文件解析失败**（语法错误无法 try/catch），
// 所以必须用 new Function 把它推迟到运行时，才能安全地观察这个语法错误。
console.log('  用动态解析验证"函数声明不能直接调用"：');
try {
  new Function('function f() {}();'); // 解析阶段就会失败
  console.log('    （本机居然解析通过了，这不符合预期）');
} catch (err) {
  console.log('    解析失败 ->', err.constructor.name, ':', err.message);
  console.log('    ^ 这就是必须把函数变成"表达式"的原因，void/!/+/() 都是在做这件事。');
}
// 反过来，合法的表达式形式能正常解析：
try {
  new Function('void function f() {}();');
  console.log('    而 `void function f() {}();` 解析正常 —— 说明 void 确实起了"变表达式"的作用。');
} catch (err) {
  console.log('    意外的解析失败：', err.message);
}

// 同一件事，用括号包一层也能做到（本仓库 06_functions/06_iife.js 用的就是这个）：
(function () {
  console.log('  用括号包起来的 IIFE 同样有效（更常见，也更推荐）');
})();

// 小结：void IIFE 与括号 IIFE 效果一样，区别只在于"读代码的人怎么理解意图"。
// 括号版更常见，void 版更明确地表达"这个返回值我不要"。
// 现代代码里其实更该用块级作用域 + ESM 模块：IIFE 主要是老代码的遗产。

// ---------------------------------------------------------------------------
// 6. 用途三：javascript:void(0) 链接的老写法
// ---------------------------------------------------------------------------

console.log('--- 6. 用途三：javascript:void(0)（历史写法，现在不该用） ---');

// 【原理】在 `href="javascript:代码"` 里，这段代码被求值后，
// **它的返回值会被当成新页面的内容**。若返回值是字符串，浏览器会用它替换整个页面！
//    · href="javascript:0"        -> 返回数字 0 -> 不替换（但语义含糊）
//    · href="javascript:void(0)"  -> 返回 undefined -> 明确不替换、也不跳转
//    · href="javascript:'hi'"     -> 返回字符串 'hi' -> **页面内容被替换成 'hi'**
// 下面用普通函数模拟这套规则（浏览器里的导航是不可逆的，示例中不能真做）。

console.log('  【模拟】把 javascript: 表达式的返回值当作"页面内容"：');
function simulateJavascriptHref(label, expressionResult) {
  // 规则（这是本示例为了教学而定的简化规则，真实浏览器在此处有实现差异）：
  //   · 返回 undefined -> 明确不导航，页面不动
  //   · 返回字符串     -> 这段字符串成为新页面的内容（页面被替换）
  //   · 返回其它值     -> 各浏览器的处理不一致，属于"不要依赖"的灰色地带
  if (expressionResult === undefined) {
    console.log(`    ${label} -> 返回 undefined，页面不动（这正是 void(0) 想要的效果）`);
  } else if (typeof expressionResult === 'string') {
    console.log(`    ${label} -> 返回字符串 ${JSON.stringify(expressionResult)}，页面会被替换成这个内容！`);
  } else {
    console.log(`    ${label} -> 返回 ${JSON.stringify(expressionResult)}（非字符串/非 undefined），`
      + '浏览器实现不一致，行为不可依赖');
  }
}
simulateJavascriptHref('href="javascript:void(0)"', void 0); // 唯一明确的"页面不动"
simulateJavascriptHref('href="javascript:0"', 0); // 返回数字，落到"实现不一致"的灰色地带
simulateJavascriptHref('href="javascript:\'hello\'"', 'hello'); // 危险：页面被替换
console.log('  ^ 关键结论：只有 void 能把返回值"确定地"变成 undefined，从而确定地不导航。');
console.log('    数字/对象等返回值在各浏览器上的表现并不一致，所以当年大家宁愿用 void(0) 图个确定。');
console.log('    注：上面这条规则是本示例的简化模型，真实的导航行为由各浏览器实现，');
console.log('        本文件不联网也无法真实触发导航 —— 所以这里讲的是"为什么当年这么写"的历史动机。');

// 现在不该用它的原因：
console.log('  现在不该用 javascript:void(0) 的原因：');
console.log('    1) 可访问性：读屏软件会把它读成一个链接，但用户按回车却什么都不发生；');
console.log('    2) 无法用"在新标签页打开"、无法复制链接、右键菜单行为异常；');
console.log('    3) 与内容安全策略（CSP）冲突，很多现代站点直接禁止 javascript: URL；');
console.log('    4) 搜索引擎会把它当成低质量链接，影响 SEO；');
console.log('    5) 阻止默认行为这件事本身有更清晰的 API。');
console.log('  现代替代方案：');
console.log('    用 <button type="button"> 代替 —— 它天生就是"可点击但不跳转"，语义最正确；');
console.log('    或者保留真实链接 <a href="/real-page"> 再用 event.preventDefault() 拦截，');
console.log('    这样"渐进增强"：JS 失效时链接依然可用。');

// ---------------------------------------------------------------------------
// 7. 与 01_syntax_basics/05 的呼应：void 是保留字
// ---------------------------------------------------------------------------

console.log('--- 7. void 是运算符关键字（保留字） ---');

// 01_syntax_basics/05_identifiers_and_naming.js 把 void 列在关键字清单里。
// 准确的说法：void 是"运算符关键字"，因此**不能用作标识符**。
// 但语法错误无法用 try/catch 直接捕获（它在解析期就发生了），
// 所以这里用 eval / new Function 把代码推迟到运行时，才能安全地观察这个错误。
const reservedWordAttempts = [
  { name: "let void = 1", src: 'let void = 1;' },
  { name: 'var void = 1', src: 'var void = 1;' },
  { name: 'function void() {}', src: 'function void() {}' },
  { name: 'void 作为函数形参名', src: 'function f(void) { return void; }' },
];
console.log('  尝试把 void 当成标识符（用动态解析观察语法错误）：');
for (const { name, src } of reservedWordAttempts) {
  try {
    new Function(src); // 只解析，不执行
    console.log(`    ${name}  -> 居然合法（不符合预期）`);
  } catch (err) {
    console.log(`    ${name}  -> ${err.constructor.name}: ${err.message}`);
  }
}
console.log('  ^ 全部是 SyntaxError，证明 void 是保留字，不能当变量名。');

// 但作为**对象属性名**是合法的：属性名走的是更宽松的 IdentifierName 语法。
const objWithVoidKey = { void: 'ok', typeof: 'ok', class: 'ok' };
console.log('  作为属性名却完全合法：obj.void =', objWithVoidKey.void,
  '| obj.class =', objWithVoidKey.class);
console.log('  ^ 这正是 01_syntax_basics/05 里讲的"属性名比标识符宽松"的实例。');

// 严格模式（含 ESM）下用 void 当变量名同样是 SyntaxError，
// 因为 void 从来就不是"未来保留字"，它一直是关键字，与严格模式无关。
console.log('  补充：void 与 let 不同 —— let 只在严格模式下是保留字，');
console.log('        而 void 从 ES1 起就是关键字，任何模式下都不能用作标识符。');

// ---------------------------------------------------------------------------
// 8. 现代用法小结与取舍
// ---------------------------------------------------------------------------

console.log('--- 8. 现代用法小结 ---');

// 唯一还推荐的用法：显式表达"我故意忽略这个返回值"。
// 它给读代码的人（和 lint 工具）一个明确信号，而不是看起来像漏写了赋值。
function fireAndForget() {
  return '这个返回值我不关心';
}
void fireAndForget(); // 有意的"丢弃"：一眼看出不是漏写
console.log('  void fireAndForget() 执行完毕，返回值被有意丢弃（可用 eslint 的 no-void 规则管控）');

// 反例：把 void 用在赋值里只会制造困惑
const confusing = void 0; // 等价于 const confusing = undefined;
console.log('  const confusing = void 0 等价于 const confusing = undefined ->', confusing);
console.log('  ^ 现代代码请直接写 undefined，别炫技。');

// 与 void 语义相近、但更明确的两个现代替代品：
console.log('  语义相近的现代替代品：');
console.log('    · 想表达"忽略返回值"      -> 直接调用并加注释，或用 void（有 lint 支撑时）');
console.log('    · 想表达"我不需要这个参数" -> 用下划线占位或省略尾部形参，例如 arr.map((_, i) => i)');
console.log('    · 想表达"立即执行一次"     -> 直接用块级作用域 + ESM 顶层代码，不必写 IIFE');

console.log('  三句话总结：');
console.log('    1) void 表达式 -> 先求值（副作用照常），再返回 undefined；');
console.log('    2) 优先级：`void 0 + 1` 是 (void 0) + 1 = NaN，不是 undefined；');
console.log('    3) 老代码里到处都是 void 0 / void IIFE / javascript:void(0)，');
console.log('       新代码里它只剩"显式表示忽略返回值"这一个合理用途。');

console.log('  以上演示全部执行完毕。');
