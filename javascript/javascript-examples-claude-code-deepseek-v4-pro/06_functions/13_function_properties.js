/**
 * ============================================================================
 * 知识点：函数的属性 —— name、length、toString、自定义属性
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】进阶
 * 【前置知识】06_functions/04_arrow_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    在 JavaScript 里，函数是对象——它有属性、有原型链，也能像普通对象一样
 *    被赋值、被传递。函数自带的几个属性非常有用：
 *      fn.name      —— 函数名（字符串）
 *      fn.length    —— 函数"声明的形参个数"
 *      fn.toString()—— 函数的源码字符串
 *      fn.prototype —— 只有普通函数才有（用作 new 时的原型）
 *      fn.caller / fn.arguments —— 已废弃，严格模式下访问会报错，不要用
 *    除此之外，还可以给函数挂任意自定义属性（常用于记录状态、缓存等）。
 *
 * 2. 为什么需要
 *    (1) name 常用于日志、调试、错误信息，也常被框架用来做依赖注入/自动注册。
 *    (2) length 是"函数签名"的机器可读形式，通用 curry、自动柯里化框架
 *        都靠它判断"还需要几个参数"。
 *    (3) toString 可以用来做简单的源码分析（如读取默认参数、参数名），
 *        也常用于打印调试与依赖分析工具。
 *    (4) 自定义属性让函数既能"被调用"又能"携带数据"，
 *        是缓存、计数器、标记位的最轻量实现方式。
 *
 * 3. 核心语法要点
 *    (1) name 的推断规则：
 *          - 函数声明/具名函数表达式 → 用声明时的名字；
 *          - 赋值给变量 `const f = function () {}` → 推断为变量名 "f"；
 *          - 对象属性 `{ m() {} }` → 推断为 "m"；
 *          - 传参时的匿名函数 → 可能是空字符串或推断的上下文名；
 *          - fn.bind(...) 产生的新函数 → "bound 原名"；
 *          - new Function() 构造的 → "anonymous"。
 *    (2) length 的计数规则：
 *          - 只数"第一个带默认值的形参之前"的普通形参；
 *          - 剩余参数（...args）不计入；
 *          - 解构形参（{a, b}）算 1 个。
 *    (3) toString() 返回的源码在"源码文本可用"的前提下才有效；
 *         引擎内置函数返回 "function x() { [native code] }"。
 *    (4) 函数是对象，所以 `fn.自定义属性 = 值` 完全合法，且不参与调用逻辑。
 *
 * 4. 常见陷阱
 *    - 以为 length 是"实参个数"（那是 arguments.length）。
 *    - 以为写了默认值不影响 length（其实会影响）。
 *    - 用 fn.caller / fn.arguments（严格模式下直接抛 TypeError）。
 *    - 用函数的自定义属性保存状态，在并发/多实例场景下互相污染。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/13_function_properties.js
 *
 * 【预期输出】
 *   逐一演示 name 的推断规则、length 的计数规则、toString 的输出形态，
 *   以及自定义属性的读写与注意事项。
 * ============================================================================
 */

console.log('--- 1. name：函数名的各种推断规则 ---');

function declaredFn() {}
const assignedFn = function () {};
const namedExpr = function innerName() {};
const arrowAssigned = () => {};
const obj = {
  methodShorthand() {},
  arrowProp: () => {},
};
const boundFn = declaredFn.bind(null);
const constructedFn = new Function('return 1'); // 等价于 function anonymous() { return 1 }

console.log('  函数声明        declaredFn.name        →', JSON.stringify(declaredFn.name));
console.log('  赋值匿名函数    assignedFn.name        →', JSON.stringify(assignedFn.name), '（自动推断为变量名）');
console.log('  命名函数表达式  namedExpr.name         →', JSON.stringify(namedExpr.name), '（用自己写的名字）');
console.log('  箭头函数赋值    arrowAssigned.name     →', JSON.stringify(arrowAssigned.name), '（同样推断变量名）');
console.log('  对象方法简写    obj.methodShorthand.name →', JSON.stringify(obj.methodShorthand.name));
console.log('  对象箭头属性    obj.arrowProp.name     →', JSON.stringify(obj.arrowProp.name));
console.log('  bind 之后的函数 boundFn.name           →', JSON.stringify(boundFn.name), '（加了 bound 前缀）');
console.log('  new Function    constructedFn.name     →', JSON.stringify(constructedFn.name));

// 匿名回调作为参数时，name 的推断受限。
function takeCallback(cb) {
  return cb.name;
}
console.log('  箭头回调传参    takeCallback(() => {})  →', JSON.stringify(takeCallback(() => {})), '（匿名，名字为空）');
console.log('  具名回调传参    takeCallback(function foo() {}) →', JSON.stringify(takeCallback(function foo() {})), '（保留自己的名字）');

console.log('--- 2. name 的实用场景：日志与自省 ---');

// 常见做法：用函数名做"操作标识"，避免手写字符串标错。
const operations = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
};

function runOperation(name, a, b) {
  const fn = operations[name];
  if (!fn) return `未知操作：${name}`;
  // 用 fn.name 记录实际执行的函数名，比手写字符串更可信。
  return `${fn.name}(${a}, ${b}) = ${fn(a, b)}`;
}
console.log(' ', runOperation('add', 3, 4));
console.log(' ', runOperation('multiply', 3, 4));
console.log(' ', runOperation('divide', 3, 4));

console.log('--- 3. length：形参个数的机器可读形式 ---');

function zero() {}
function one(a) {}
function three(a, b, c) {}
function withDefault(a, b = 1, c) {}
function withRest(a, ...rest) {}
function withDestructure({ x, y }) {}
function allDefault(a = 1, b = 2) {}

const lengthRows = [
  ['function zero()', zero],
  ['function one(a)', one],
  ['function three(a, b, c)', three],
  ['function withDefault(a, b = 1, c)', withDefault],
  ['function withRest(a, ...rest)', withRest],
  ['function withDestructure({ x, y })', withDestructure],
  ['function allDefault(a = 1, b = 2)', allDefault],
];
for (const [label, fn] of lengthRows) {
  console.log(`  ${label.padEnd(36)} length = ${fn.length}`);
}
console.log('  规则：① 从第一个带默认值的形参开始，后面的全部不计入；');
console.log('        ② 剩余参数不计入；③ 解构形参算 1 个。');

// 对比：length 是"声明了几个"，arguments.length 是"实际传了几个"。
function compareLength(a, b, c) {
  return `length（声明）= ${compareLength.length}，arguments.length（实传）= ${arguments.length}`;
}
console.log('  compareLength(1)         →', compareLength(1));
console.log('  compareLength(1, 2)      →', compareLength(1, 2));
console.log('  compareLength(1, 2, 3, 4) →', compareLength(1, 2, 3, 4));

console.log('--- 4. length 的实用场景：自动柯里化 ---');

// 前面 12 号文件里的 curry 就是靠 length 判断"参数够了没"。
function curryByLength(fn) {
  return function curried(...args) {
    // 参数个数达到 length 就执行，否则继续收集。
    if (args.length >= fn.length) return fn(...args);
    return (...rest) => curried(...args, ...rest);
  };
}
const curriedAdd3 = curryByLength((a, b, c) => a + b + c);
console.log('  curryByLength((a,b,c) => a+b+c)(1)(2)(3) →', curriedAdd3(1)(2)(3));
// 因为 withDefault 的 length 是 1，所以柯里化会"提前触发"，这是 length 规则带来的副作用。
const curriedProblem = curryByLength(withDefault);
console.log('  curryByLength(withDefault)(1) →', curriedProblem(1), '（length=1 导致只收一个参数就执行了）');
console.log('  提醒：给"要柯里化的函数"加默认值时，一定要意识到 length 会因此变小。');

console.log('--- 5. toString：拿到函数的源码文本 ---');

function sampleSource(a, b = 10) {
  return a + b;
}
console.log('  自定义函数的 toString：');
console.log(
  sampleSource
    .toString()
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n'),
);

const arrowSource = (x) => x * 2;
console.log('  箭头函数的 toString →', JSON.stringify(arrowSource.toString()));

// 内置函数（由 C++ 实现）拿不到源码。
console.log('  内置函数 Math.max.toString() →', Math.max.toString());

// 简单自省：从源码里把默认参数抠出来（仅作演示，真实项目请用 AST 解析）。
const defaultParamPattern = /=\s*(\d+)/;
const matched = sampleSource.toString().match(defaultParamPattern);
console.log('  用正则在源码里找默认值 →', matched ? matched[1] : '没找到', '（演示用，生产环境请用 AST 工具）');

// 用 toString 做简单的"函数类型判断"（也可以直接判断是不是 async 函数）。
async function asyncFn() {}
function* genFn() {}
const isAsync = (fn) => fn.constructor.name === 'AsyncFunction';
const isGenerator = (fn) => fn.constructor.name === 'GeneratorFunction';
console.log('  async 函数判定 asyncFn →', isAsync(asyncFn));
console.log('  async 函数判定 sampleSource →', isAsync(sampleSource));
console.log('  generator 函数判定 genFn →', isGenerator(genFn));
console.log('  generator 函数判定 sampleSource →', isGenerator(sampleSource));
// 注意：这些函数只是被定义、没有被调用，不会产生额外输出。

console.log('--- 6. 自定义属性：函数也是对象 ---');

function counter() {
  // 每次调用都读/写挂在函数自己身上的属性。
  counter.count = (counter.count ?? 0) + 1;
  return counter.count;
}
console.log('  第 1 次调用 →', counter());
console.log('  第 2 次调用 →', counter());
console.log('  第 3 次调用 →', counter());
console.log('  直接读取属性 counter.count →', counter.count);
console.log('  函数也是对象吗？typeof counter →', typeof counter, '；counter instanceof Object →', counter instanceof Object);

// 自定义属性的常见形态：把缓存/配置挂在函数上。
function fibonacci(n) {
  // 把缓存挂在函数身上，不用额外声明全局变量。
  fibonacci.cache ??= new Map();
  if (n < 2) return n;
  if (fibonacci.cache.has(n)) return fibonacci.cache.get(n);
  const value = fibonacci(n - 1) + fibonacci(n - 2);
  fibonacci.cache.set(n, value);
  return value;
}
console.log('  fibonacci(30) →', fibonacci(30), '（用了函数自带缓存）');
console.log('  缓存里存了多少项？→', fibonacci.cache.size);
console.log('  fibonacci(30) 再算一次 →', fibonacci(30), '（直接命中缓存）');

// 可以像普通对象一样列出函数的属性。
console.log('  函数自身的可枚举属性 →', Object.keys(fibonacci));
// 注意 name / length 是不可枚举的，所以不在 Object.keys 里。
console.log('  但直接访问依然拿得到：name =', fibonacci.name, '，length =', fibonacci.length);
console.log('  hasOwnProperty("length") →', Object.prototype.hasOwnProperty.call(fibonacci, 'length'));

console.log('--- 7. 自定义属性的注意事项 ---');

// 问题一：挂在函数上的状态是"全局共享"的，多实例会互相污染。
function makeCounter() {
  // 正确做法：用闭包保存状态，每个实例各有一份（详见 07_scope_and_closure）。
  let count = 0;
  const instance = () => ++count;
  // 顺便演示：把状态挂在闭包变量上，而不是函数属性上。
  instance.reset = () => {
    count = 0;
  };
  return instance;
}
const c1 = makeCounter();
const c2 = makeCounter();
console.log('  c1() →', c1(), '；c1() →', c1(), '；c2() →', c2(), '（两个实例互不影响）');
c1.reset();
console.log('  c1.reset() 之后 c1() →', c1(), '；c2 仍然是 →', c2());

// 问题二：caller / arguments 这两个属性在严格模式下被禁用了。
function strictCheck() {
  try {
    // 访问 fn.caller 在严格模式下会抛 TypeError。
    return typeof strictCheck.caller;
  } catch (err) {
    return `访问 caller 报错 ${err.constructor.name}：${err.message}`;
  }
}
console.log(' ', strictCheck());
console.log('  （本仓库为 ESM，默认严格模式，所以 caller/arguments 属性不可用，请改用其他方案。）');

console.log('--- 8. 属性速查表 ---');

// 注意：这一节只打印说明，不访问已废弃属性。
const props = [
  ['name', 'string', '函数名，可被推断', '日志、自省、框架自动注册'],
  ['length', 'number', '声明的形参个数（避开默认值/剩余参数）', '自动柯里化、参数校验'],
  ['prototype', 'object | undefined', '只有普通函数才有', 'new 时作为实例的原型'],
  ['toString()', 'string', '源码文本或 [native code]', '调试、简单的源码分析'],
  ['自定义属性', '任意', '函数也是对象，可任意挂载', '缓存、计数器、配置'],
];
for (const [prop, type, desc, usage] of props) {
  console.log(`  · ${prop}（${type}）`);
  console.log(`      说明：${desc}`);
  console.log(`      用途：${usage}`);
}
