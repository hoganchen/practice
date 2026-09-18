/**
 * ============================================================================
 * 知识点：严格模式（'use strict'）与 ESM 的默认严格性
 * ============================================================================
 *
 * 【所属分类】01_syntax_basics —— 语法基础
 * 【难度等级】进阶
 * 【前置知识】01_syntax_basics/01_statements_and_expressions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    严格模式是 ES5 引入的一种"更严格的解析与执行规则"。开启后，
 *    一批历史上被默许的"静默失败"行为会变成明确报错，一些设计缺陷会被禁用。
 *    开启方式有两种：
 *      （a）脚本/函数开头写一条指令序言：'use strict';（必须是最早的语句，
 *           且写完整的字符串，不能是变量或拼接出来的字符串）；
 *      （b）使用 ES Module —— 规范规定**所有 ESM 模块都自动是严格模式**，
 *           不需要也不该再写 'use strict'。
 *    本仓库 package.json 设了 "type": "module"，因此所有 .js 文件天然严格。
 *
 * 2. 为什么需要 / 解决什么问题
 *    早期 JS 为了"容错"把很多错误设计成静默忽略：
 *    写错变量名不会报错（悄悄创建了一个全局变量）、给 NaN 赋值不报错、
 *    函数参数重名不报错……这些是 bug 的温床。严格模式把它们变成响亮的报错，
 *    让问题在开发阶段就暴露，而不是在生产环境以诡异数据的形式出现。
 *    现代 JS 的类体、箭头函数在 ESM 中、以及绝大多数构建产物都处于严格模式。
 *
 * 3. 核心语法要点 —— 严格模式下的主要行为差异
 *    （1）未声明就赋值 → ReferenceError（非严格：静默创建全局变量）
 *    （2）给不可写属性赋值（NaN / undefined / Infinity / 只读属性）→ TypeError
 *    （3）删除不可配置的属性（如 delete Object.prototype）→ TypeError
 *    （4）函数参数重名 → SyntaxError（解析期）
 *    （5）with 语句 → SyntaxError（被完全禁用）
 *    （6）八进制字面量 `0123` → SyntaxError（必须写 0o123）
 *    （7）普通函数调用中的 this → undefined（非严格：全局对象）
 *        call/apply 传入 null/undefined → 保持原样，不做"装箱替换"
 *    （8）arguments.callee / caller → TypeError
 *    （9）把 eval / arguments 当作变量名或赋值 → SyntaxError
 *    （10）eval 的声明不再"泄漏"到外层作用域（获得独立词法环境）
 *    （11）保留字（implements / interface / let / package / private /
 *         protected / public / static / yield）不能用作标识符 → SyntaxError
 *    （12）不能对不可扩展对象新增属性 → TypeError
 *
 * 4. 常见陷阱与注意事项
 *    - 'use strict' 必须是**指令序言**：位于脚本或函数体的最前面，且是完整字符串。
 *      前面有任何一条其它语句（哪怕是 `var x;`）都会让它失效，变成一条普通表达式语句。
 *    - 严格模式**不能**通过"拼接字符串"开启：'use ' + 'strict' 无效。
 *    - 指令序言的作用范围是"整个脚本"或"整个函数体"。写在函数里只影响该函数
 *      （包括它内部嵌套的函数）。
 *    - 类（class）体内部自动是严格模式，与文件是否严格无关。
 *    - 在 ESM 中再写 'use strict' 是冗余的（但无害），主流风格是不写。
 *    - 本文件为了对比两种模式，用 `new Function` 动态构造函数体：
 *      **函数体默认是非严格的**，除非在里面显式写 'use strict'。
 *      这正好给了我们一个"同一段代码、两种模式"的实验台。
 *    - 演示报错的代码必须包在 try/catch 里，否则进程会非零退出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 01_syntax_basics/04_strict_mode.js
 *
 * 【预期输出】
 *   分节对比非严格模式与严格模式在：隐式全局变量、只读属性赋值、
 *   重复参数名、with 语句、八进制字面量、this 绑定、arguments.callee
 *   等方面的行为差异，并证明 ESM 默认就是严格模式。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 先证明：本文件（ESM）本身就是严格模式
// ---------------------------------------------------------------------------

console.log('--- 0. 证据：ESM 模块自动进入严格模式 ---');

// 证据一：ESM 顶层 this 是 undefined。非严格脚本的顶层 this 是全局对象，
// 非严格 CommonJS 模块的顶层 this 是 module.exports。
console.log('本模块顶层 this：', this, ' → undefined 表示处于严格模式');

// 证据二：直接给未声明的变量赋值，在严格模式下会抛 ReferenceError。
// 这在非严格模式下会悄悄创建一个全局变量（下面第 1 节会对比演示）。
try {
  // @ts-expect-error 故意制造错误以演示
  totallyUndeclaredVariable = 123;
  console.log('居然没报错？说明当前不是严格模式');
} catch (err) {
  console.log('未声明就赋值 →', err.constructor.name, '：', err.message);
  console.log('注意：没有写 ' + "'use strict'" + '，本文件依然是严格模式，因为它是 ESM。');
}

// 用来把"动态构造的函数"跑起来的小工具，统一处理异常，避免进程非零退出。
/**
 * 分别在非严格 / 严格模式下运行同一段代码，返回可比较的结果。
 *
 * @param {string} code 要执行的代码（函数体文本）
 * @param {boolean} strict 是否在函数体开头插入 'use strict'
 * @returns {{ok: boolean, value?: string, error?: string}} 执行结果
 */
function runInMode(code, strict) {
  const body = (strict ? "'use strict';\n" : '') + code;
  try {
    const fn = new Function(body);
    const value = fn();
    return { ok: true, value: String(value) };
  } catch (err) {
    // SyntaxError 会在 new Function 构造阶段抛出，TypeError/ReferenceError 在调用阶段抛出，
    // 两种情况都统一在这里接住。
    return { ok: false, error: err.constructor.name + ' — ' + err.message };
  }
}

/** 把两种模式的结果并排打印，方便肉眼对比 */
function compare(title, code) {
  console.log('\n【' + title + '】');
  console.log('  演示代码：' + JSON.stringify(code.trim()));
  // 注意执行顺序：先跑严格模式，再跑非严格模式。
  // 因为非严格模式可能会创建"隐式全局变量"，如果先跑它，第二轮严格模式里
  // 那个变量已经存在于 globalThis 上了，赋值就不会再报错，对比结果会被污染。
  const strict = runInMode(code, true);
  const sloppy = runInMode(code, false);
  console.log('  非严格模式：', sloppy.ok ? '正常返回 ' + sloppy.value : '抛错 ' + sloppy.error);
  console.log('  严格模式  ：', strict.ok ? '正常返回 ' + strict.value : '抛错 ' + strict.error);
}

// ---------------------------------------------------------------------------
// 1. 未声明变量赋值：静默创建全局 vs 立刻报错
// ---------------------------------------------------------------------------

console.log('\n--- 1. 未声明就赋值 ---');

compare('未声明就赋值', `
  accidentalGlobal = '我是被悄悄创建出来的全局变量';
  return '赋值成功，值是 ' + accidentalGlobal;
`);

// 补充说明：非严格模式下那个隐式全局变量会挂到 globalThis 上，
// 而且用 delete 能删掉（这是它和正常全局变量的一大区别，见 02_variables/06）。
console.log('  说明：非严格模式下这个变量会挂到 globalThis 上，可以 delete 掉；');
console.log('        严格模式下连赋值这一步都过不去，从源头杜绝了变量名写错的 bug。');

// 验证一下：非严格模式那一轮确实在 globalThis 上留下了一个属性。
console.log('  globalThis.accidentalGlobal 现在存在吗？', 'accidentalGlobal' in globalThis);
delete globalThis.accidentalGlobal; // 顺手清理，避免污染后续示例
console.log('  已清理。删除前后对比也说明：隐式全局变量是"可配置"的，能 delete。');

// ---------------------------------------------------------------------------
// 2. 给只读属性赋值：静默失败 vs TypeError
// ---------------------------------------------------------------------------

console.log('\n--- 2. 给只读属性赋值（NaN / undefined）---');

compare('给 NaN 赋值', `
  NaN = 123;
  return '赋值后 NaN 依然是 ' + NaN;
`);

compare('给 undefined 赋值', `
  undefined = 456;
  return '赋值后 undefined 依然是 ' + undefined;
`);

compare('给只读对象属性赋值', `
  const frozen = Object.freeze({ x: 1 });
  frozen.x = 999;
  return '冻结对象的 x 依然是 ' + frozen.x;
`);

// ---------------------------------------------------------------------------
// 3. 函数参数重名：允许 vs 解析期 SyntaxError
// ---------------------------------------------------------------------------

console.log('\n--- 3. 函数参数重名 ---');

// 非严格模式允许参数重名，后出现的参数覆盖前面的（arguments 里两个都存在，容易混淆）
console.log('演示代码：function f(a, a) { return a; }');
const dupSloppy = runInMode(
  `
  const f = function (a, a) { return 'a 的值是 ' + a + '，arguments.length = ' + arguments.length; };
  return f(1, 2);
`,
  false,
);
console.log('  非严格模式：', dupSloppy.ok ? dupSloppy.value : '抛错 ' + dupSloppy.error);

const dupStrict = runInMode(
  `
  const f = function (a, a) { return a; };
  return f(1, 2);
`,
  true,
);
console.log('  严格模式  ：', dupStrict.ok ? dupStrict.value : '抛错 ' + dupStrict.error);
console.log('  注意：严格模式下这是**解析期**错误，代码根本没机会运行。');

// ---------------------------------------------------------------------------
// 4. with 语句：非严格可用（但不推荐）vs 严格禁用
// ---------------------------------------------------------------------------

console.log('\n--- 4. with 语句被严格模式禁用 ---');

compare('with 语句', `
  const scope = { a: 1, b: 2 };
  let result;
  with (scope) {
    result = a + b;
  }
  return 'with 里的 a + b = ' + result;
`);

console.log('  说明：with 会让"变量到底来自哪里"变得不可预测，性能也很差，');
console.log('        所以严格模式直接把它列为 SyntaxError，彻底封杀。');

// ---------------------------------------------------------------------------
// 5. 八进制字面量：允许 vs SyntaxError
// ---------------------------------------------------------------------------

console.log('\n--- 5. 八进制字面量 0123 ---');

compare('旧式八进制字面量', `
  const octal = 0123;
  return '0123 被解析为十进制 ' + octal;
`);

console.log('  说明：`0123` 在非严格模式下是八进制（等于十进制 83），');
console.log('        严格模式禁止这种写法，必须写成 0o123。');
console.log('        标准写法 0o123 在两种模式下都合法：', 0o123);

// ---------------------------------------------------------------------------
// 6. 普通函数调用中的 this：全局对象 vs undefined
// ---------------------------------------------------------------------------

console.log('\n--- 6. 普通函数调用里的 this ---');

compare('普通调用的 this', `
  function whoAmI() {
    if (this === undefined) return 'this 是 undefined';
    if (this === globalThis) return 'this 是全局对象';
    return 'this 是 ' + Object.prototype.toString.call(this);
  }
  return whoAmI();
`);

compare('call(null) 的 this', `
  function whoAmI() {
    if (this === null) return 'this 严格保持了 null';
    if (this === globalThis) return 'this 被替换成了全局对象';
    return 'this 是 ' + typeof this;
  }
  return whoAmI.call(null);
`);

console.log('  实战意义：把 this 用作"是否被当作方法调用"的判据时，');
console.log('            严格模式下 this === undefined 更可靠；非严格模式会把 this 变成全局对象，');
console.log('            于是 this.someGlobalFn 之类的误用不会报错，反而更难查。');

// ---------------------------------------------------------------------------
// 7. arguments.callee：可用 vs TypeError
// ---------------------------------------------------------------------------

console.log('\n--- 7. arguments.callee ---');

compare('arguments.callee', `
  function f(n) {
    return n <= 1 ? 1 : n * arguments.callee(n - 1);
  }
  return '5! = ' + f(5);
`);

console.log('  说明：callee 破坏了引擎的优化（无法内联），严格模式禁用。');
console.log('        替代方案：给函数表达式起个名字（具名函数表达式），用名字递归。');

// ---------------------------------------------------------------------------
// 8. delete 变量 / eval、arguments 做标识符
// ---------------------------------------------------------------------------

console.log('\n--- 8. delete 变量、把 eval/arguments 当标识符 ---');

compare('delete 一个变量', `
  const local = 1;
  delete local;
  return '删除后仍可访问：' + local;
`);

compare('把 eval 当变量名', `
  const eval = 1;
  return '居然可以用 eval 当变量名：' + eval;
`);

compare('保留字作标识符（interface）', `
  const interface = 'oops';
  return interface;
`);

console.log('  说明：这三条在严格模式下都是解析期 SyntaxError，代码根本不会运行。');

// ---------------------------------------------------------------------------
// 9. 严格模式下 eval 的隔离性
// ---------------------------------------------------------------------------

console.log('\n--- 9. eval 里的声明是否泄漏到外层 ---');

compare('eval 声明泄漏', `
  let leaked = '原始值';
  eval("var leakedFromEval = '我在 eval 里被声明'; leaked = '被 eval 改过了';");
  // 非严格模式下 var 声明会泄漏到 eval 所在的作用域；
  // 严格模式下 eval 有自己的词法环境，外层拿不到 leakedFromEval。
  return typeof leakedFromEval + ' / leaked = ' + leaked;
`);

console.log('  说明：严格模式下 eval 不再往调用者的作用域里注入变量，');
console.log('        这让"代码从哪来"更容易推理，也避免了变量被意外覆盖。');

// ---------------------------------------------------------------------------
// 10. class 体与函数体：严格模式的"局部生效"
// ---------------------------------------------------------------------------

console.log('\n--- 10. 严格模式的生效范围 ---');

// 类（class）体内部永远是严格模式，哪怕外层文件是非严格脚本也一样。
class StrictByDefault {
  method() {
    // 在方法里给未声明变量赋值，会抛 ReferenceError
    try {
      // @ts-expect-error 故意制造错误以演示
      classScopedAccidental = 1;
      return '没报错';
    } catch (err) {
      return err.constructor.name + ' — ' + err.message;
    }
  }
}
console.log('class 方法内部：', new StrictByDefault().method());
console.log('结论：类体天生严格，与文件是否严格无关。');

// 指令序言只影响它所在的那个函数体（含其内部嵌套函数）。
// 注意：本模块本身是严格模式，所以要用 new Function 造一个"非严格"的环境来对比。
const outerDirective = new Function(`
  function outer() {
    'use strict';           // 只对 outer 这个函数体生效
    function inner() {
      innerAccidental = 1;  // inner 是被 outer 嵌套定义的，同样继承严格模式
    }
    try {
      inner();
      return '嵌套函数不严格（不符合预期）';
    } catch (err) {
      return '嵌套函数同样严格 → ' + err.constructor.name + '：' + err.message;
    }
  }
  return outer();
`);
console.log('函数体内写指令序言的效果：', outerDirective());

// 陷阱演示：'use strict' 若不是第一条语句，就只是一条普通的字符串表达式语句，完全无效。
// 这里同样要用 new Function 造非严格环境 —— 因为在严格模块里，
// 函数无论如何都是严格的，根本看不出"指令失效"的差别。
const invalidDirective = new Function(`
  const notFirst = true;   // 这条语句出现在 'use strict' 之前
  'use strict';            // 已经太晚了，它不会开启严格模式
  lateAccidental = 1;      // 非严格模式下静默创建全局变量，不会报错
  return '指令序言失效：赋值没报错，意外创建的全局变量 lateAccidental = ' + globalThis.lateAccidental
    + '（notFirst = ' + notFirst + '）';
`);
console.log(invalidDirective());
delete globalThis.lateAccidental; // 清理掉刚被意外创建的全局变量，保持环境干净

console.log('\n--- 11. 小结 ---');
console.log('· 严格模式把"静默失败"变成"响亮报错"，是 ES5 以来最重要的质量改进之一。');
console.log('· ESM 模块、class 体自动严格；本仓库所有 .js 都属于这种情况。');
console.log('· 指令序言必须是函数体/脚本的第一条语句，且是完整的字符串字面量。');
console.log('· 写新代码时默认就在严格模式下，无需再写 use strict，直接享受它的保护。');
