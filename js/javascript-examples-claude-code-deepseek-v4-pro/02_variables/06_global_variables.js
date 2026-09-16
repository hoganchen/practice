/**
 * ============================================================================
 * 知识点：全局变量 —— globalThis、顶层 var/let 的区别、隐式全局变量
 * ============================================================================
 *
 * 【所属分类】02_variables —— 变量与作用域
 * 【难度等级】进阶
 * 【前置知识】02_variables/01_var.js、02_variables/02_let.js、02_variables/04_hoisting_and_tdz.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    全局变量是"在程序任何地方都能访问到"的变量。JS 里可以从两个层次理解它：
 *    （a）**全局对象**：宿主环境提供的那个"最外层对象"。浏览器里是 window，
 *        Node.js 里是 global，Web Worker 里是 self。ES2020 起，
 *        标准提供了统一的引用方式 globalThis，两边都能拿到它。
 *    （b）**全局作用域里的绑定**：写在最外层的 var / let / const / function 声明。
 *        它们和"全局对象的属性"并不完全等同 —— 这正是本节的核心。
 *    另外还有一种"隐式全局变量"：在非严格模式下给一个从未声明的名字赋值，
 *    引擎会悄悄在全局对象上创建一个属性。它是 bug 的常见来源。
 *
 * 2. 为什么需要 / 解决什么问题
 *    全局变量在浏览器早期是唯一的"模块间通信方式"，于是产生了大量互相踩踏的代码。
 *    ES6 之后有了模块作用域，全局变量就成了"能不用就不用"的东西：
 *    它无法被垃圾回收、任何地方都能改、名字冲突无法察觉。
 *    理解全局变量的机制，才能：
 *    - 知道为什么在 ESM 里写顶层 var 拿不到 globalThis.xxx；
 *    - 知道为什么"忘记声明"的变量会变成全局变量（严格模式下会直接报错）；
 *    - 知道在 Node 里怎样安全地共享少量全局配置（通常用模块导出，而不是挂 global）。
 *
 * 3. 核心语法要点 —— 顶层声明的四种归宿
 *    在**普通 <script> 脚本**里：
 *      var x = 1;        → 成为全局对象（window）的属性，且**不可删除**
 *      function f() {}   → 同上，成为全局对象的属性
 *      let y = 2;        → 存在于"全局词法环境"，**不是**全局对象的属性
 *      const z = 3;      → 同 let
 *      x2 = 4;（未声明）  → 隐式全局变量，成为全局对象的属性，且**可删除**
 *    在 **ES Module** 里：
 *      以上四种声明都只存在于"模块作用域"，一个都不会成为全局对象的属性。
 *      只有显式写 `globalThis.x = 1;` 才会真正挂到全局对象上。
 *
 * 4. 常见陷阱与注意事项
 *    - 隐式全局变量只在**非严格模式**下产生。ESM、class 体、'use strict' 下都会抛
 *      ReferenceError，这也是严格模式最有价值的保护之一。
 *    - `var` 创建的全局属性是"不可配置"的，所以 `delete window.x` 会失败（严格模式抛错）；
 *      而隐式全局变量是可配置的，可以删掉。这是区分两者的实用判据。
 *    - 用 `let` 声明的顶层变量虽然不在全局对象上，但依然在全局作用域里，
 *      所以"不挂全局对象"≠"不污染全局命名空间"。
 *    - Node.js 的 CommonJS 模块（.cjs）里，顶层 var 也不会挂到 global 上，
 *      因为模块被包在一个函数里执行。只有真正的全局代码才会。
 *    - 用 `globalThis` 而不是 `window`/`global`/`self`，代码在两种环境下都能跑。
 *    - 判断"某个名字是不是已存在的全局变量"，用 `'name' in globalThis` 更可靠。
 *    - 本文件用 Node 内置的 `node:vm` 模块创建"沙箱全局对象"，
 *      模拟浏览器普通脚本的执行环境，从而安全地演示这些差异 ——
 *      这样演示代码不会污染本进程真正的全局对象。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 02_variables/06_global_variables.js
 *
 * 【预期输出】
 *   分节演示：globalThis 与 global/window 的关系、模块作用域下顶层声明不会挂到全局、
 *   用 vm 模拟脚本环境对比 var/let/function/隐式全局变量的归宿与可删除性、
 *   严格模式如何拦截隐式全局变量、以及共享跨模块状态的正确做法。
 * ============================================================================
 */

import vm from 'node:vm';

// ---------------------------------------------------------------------------
// 1. globalThis：跨环境访问全局对象的统一入口
// ---------------------------------------------------------------------------

console.log('--- 1. globalThis 与 global / window ---');

// globalThis 是 ES2020 引入的标准全局对象引用：浏览器里它就是 window，
// Node.js 里它就是 global，Web Worker 里它就是 self。
console.log('typeof globalThis：', typeof globalThis);
console.log('typeof global（Node 专有）：', typeof global);
console.log('globalThis === global ？', globalThis === global);
console.log('typeof window（浏览器专有）：', typeof window, '→ 在 Node 中不存在');

// 用 globalThis 写跨环境代码，不需要判断"我现在是在浏览器还是 Node"。
function getEnvName() {
  // 特征检测：有 window 且有 document 就是浏览器
  if (typeof globalThis.window !== 'undefined' && typeof globalThis.document !== 'undefined') {
    return '浏览器';
  }
  // 有 process.versions.node 就是 Node.js
  if (typeof globalThis.process !== 'undefined' && globalThis.process.versions?.node) {
    return 'Node.js';
  }
  return '未知环境';
}
console.log('通过 globalThis 检测到的当前环境：', getEnvName());

// 通过 globalThis 读写属性，等价于读写全局对象上的属性。
// 生产代码里请避免这样做（会污染全局），这里只是演示机制。
globalThis.__demoGlobalFlag = '我通过 globalThis 挂上去的值';
console.log('读回：', globalThis.__demoGlobalFlag, '/ 用 global 读也一样：', global.__demoGlobalFlag);
console.log("用 in 判断是否存在于全局对象上：", '__demoGlobalFlag' in globalThis);
delete globalThis.__demoGlobalFlag; // 显式挂上去的属性是可配置的，能删掉
console.log("删除后再判断：", '__demoGlobalFlag' in globalThis);

// ---------------------------------------------------------------------------
// 2. 模块作用域：ESM 顶层声明不会成为全局对象的属性
// ---------------------------------------------------------------------------

console.log('\n--- 2. ESM 模块顶层的声明只在模块作用域里 ---');

// 本文件是 ESM 模块，模块有自己的作用域（规范称之为 Module Environment Record）。
// 因此下面四种声明**都**不会成为 globalThis 的属性。
var moduleVar = '模块顶层的 var';
let moduleLet = '模块顶层的 let';
const moduleConst = '模块顶层的 const';
function moduleFunction() {
  return '模块顶层的函数声明';
}

console.log('模块内可正常访问：', moduleVar, '/', moduleLet, '/', moduleConst, '/', moduleFunction());
console.log('globalThis.moduleVar：', globalThis.moduleVar, '（不是全局属性！）');
console.log('globalThis.moduleLet：', globalThis.moduleLet);
console.log('globalThis.moduleConst：', globalThis.moduleConst);
console.log('globalThis.moduleFunction：', globalThis.moduleFunction);
console.log('结论：模块顶层声明只是"在模块内可访问"，与"挂在全局对象上"是两件事。');
console.log('      想让别人通过全局对象访问，必须显式写 globalThis.x = ...（不推荐）。');

// 那模块之间怎么共享数据？正确做法是"显式导出 + 显式导入"。
// 这里用一小段注释说明，因为跨文件演示需要额外的辅助模块：
//   在其他文件里：export const sharedState = { count: 0 };
//   在本文件里：  import { sharedState } from './_shared-state.js';
console.log('模块间共享状态的正确姿势：export / import，而不是挂在 globalThis 上。');

// ---------------------------------------------------------------------------
// 3. 用 node:vm 模拟"普通脚本"环境，观察四种声明的归宿
// ---------------------------------------------------------------------------

console.log('\n--- 3. 模拟普通脚本环境：四种声明的归宿 ---');

// vm.createContext() 会创建一个"沙箱全局对象"。在它里面运行的代码，
// 顶层声明的作用就相当于浏览器里普通 <script> 的顶层声明。
// 这样我们既能演示差异，又不会污染本进程真实的 globalThis。
const sandbox = vm.createContext({});

// 在沙箱里执行一段"非严格模式的普通脚本"
const scriptSource = `
  var scriptVar = '脚本里的 var';
  let scriptLet = '脚本里的 let';
  const scriptConst = '脚本里的 const';
  function scriptFunction() { return '脚本里的函数声明'; }
  implicitGlobal = '我是忘记声明就被创建出来的';
`;
vm.runInContext(scriptSource, sandbox);

// 逐项检查：哪些成了"全局对象"（沙箱）的属性，哪些没有。
// 这里的判断都写成沙箱内部的表达式，用 `name in globalThis` 来问
// "这个名字是不是全局对象的属性" —— 这是最标准的判据写法。
const probe = (expr) => vm.runInContext(expr, sandbox);

const sandboxRows = [
  { 声明形式: 'var scriptVar', 是全局对象的属性: probe(`'scriptVar' in globalThis`), 值: String(sandbox.scriptVar) },
  { 声明形式: 'function scriptFunction', 是全局对象的属性: probe(`'scriptFunction' in globalThis`), 值: '（函数对象）' },
  { 声明形式: 'implicitGlobal = ...（未声明）', 是全局对象的属性: probe(`'implicitGlobal' in globalThis`), 值: String(sandbox.implicitGlobal) },
  { 声明形式: 'let scriptLet', 是全局对象的属性: probe(`'scriptLet' in globalThis`), 值: String(sandbox.scriptLet) },
  { 声明形式: 'const scriptConst', 是全局对象的属性: probe(`'scriptConst' in globalThis`), 值: String(sandbox.scriptConst) },
];
console.log('  另外验证：在沙箱内 var 声明的变量能被读到 →', probe('scriptVar'), '（函数也能调用 →）', probe('scriptFunction()'));
console.log('  沙箱内 let/const 依然可用（只是不在全局对象上）→', probe('scriptLet'), '/', probe('scriptConst'));
console.table(sandboxRows);
console.log('结论：var 与函数声明会成为全局对象的属性；let/const 不会（它们在全局词法环境里）；');
console.log('      而"忘记声明"的赋值会**悄悄**变成全局对象的属性 —— 这就是隐式全局变量。');

// ---------------------------------------------------------------------------
// 4. 隐式全局变量 vs var 全局变量：一个实用的区分判据
// ---------------------------------------------------------------------------

console.log('\n--- 4. 隐式全局变量与 var 全局变量的区别 ---');

// 判据：能否被 delete 掉。
// - var / function 创建的是"不可配置（configurable: false）"的属性 → delete 失败（返回 false）
// - 隐式赋值创建的是"可配置"属性 → delete 成功（返回 true）
// delete 的返回值规则：成功（或删除一个本来就不存在的属性）返回 true，失败返回 false。
//
// 注意：所有探测表达式都写在 vm.runInContext 里，让它们**在沙箱内部**求值。
// 因为沙箱对象的属性访问会被 vm 的代理层拦截，从外部用 `in` 或
// getOwnPropertyDescriptor 探测，得到的结果可能与规范行为不一致。
const sandbox2 = vm.createContext({});
vm.runInContext(
  `
  var declaredWithVar = 'var 声明';
  undeclaredAssignment = '隐式全局';
`,
  sandbox2,
);

console.log('删除前，沙箱内的 typeof：',
  vm.runInContext('typeof declaredWithVar', sandbox2), '/',
  vm.runInContext('typeof undeclaredAssignment', sandbox2));

console.log('delete declaredWithVar 的返回值：', vm.runInContext('delete declaredWithVar;', sandbox2), '（false = 删不掉）');
console.log('delete undeclaredAssignment 的返回值：', vm.runInContext('delete undeclaredAssignment;', sandbox2), '（true = 删掉了）');

console.log('删除后，沙箱内的 typeof：',
  vm.runInContext('typeof declaredWithVar', sandbox2), '/',
  vm.runInContext('typeof undeclaredAssignment', sandbox2));
console.log('结论：var 声明"删不掉、活得久"，隐式全局变量"能被随手删掉、状态更不可靠"。');

// ---------------------------------------------------------------------------
// 5. 严格模式如何拦截隐式全局变量
// ---------------------------------------------------------------------------

console.log('\n--- 5. 严格模式拦截隐式全局变量 ---');

// 非严格模式：静默创建全局变量
const sloppySandbox = vm.createContext({});
vm.runInContext('sloppyImplicit = 1;', sloppySandbox);
console.log('非严格模式：赋值成功，sloppyImplicit =', sloppySandbox.sloppyImplicit);

// 严格模式：直接抛 ReferenceError
const strictSandbox = vm.createContext({});
try {
  vm.runInContext("'use strict'; strictImplicit = 1;", strictSandbox);
  console.log('严格模式：居然没报错（不符合预期）');
} catch (err) {
  console.log('严格模式：', err.constructor.name + '：' + err.message);
}
console.log('严格模式沙箱里有没有被创建出 strictImplicit？', vm.runInContext(`'strictImplicit' in globalThis`, strictSandbox));
console.log('结论：严格模式从源头阻止了"忘记声明"变成全局变量，这就是它最有价值的保护之一。');

// 在本文件（ESM，天然严格）里也同样会被拦截。
try {
  // @ts-expect-error 故意制造错误以演示
  moduleImplicitGlobal = '我不会被创建出来';
  console.log('居然没报错（不符合预期）');
} catch (err) {
  console.log('在 ESM 模块里做同样的事：', err.constructor.name + '：' + err.message);
}
console.log('并且全局对象上确实没有留下痕迹：', 'moduleImplicitGlobal' in globalThis);

// ---------------------------------------------------------------------------
// 6. 全局变量真正的危害与正确替代方案
// ---------------------------------------------------------------------------

console.log('\n--- 6. 为什么不该用全局变量，那该用什么 ---');

// 用一个"被意外覆盖"的场景说明危害：两个模块都想用同一个好名字。
const pollutionSandbox = vm.createContext({});
vm.runInContext(
  `
  var appConfig = { debug: false };   // 模块 A 想要的配置
  var appConfig = { debug: true };    // 模块 B 也用了同名 var —— 静默覆盖
`,
  pollutionSandbox,
);
console.log('两个模块都用 var appConfig 的后果：', pollutionSandbox.appConfig, '（后写覆盖先写，没有任何提示）');

// 正确做法一：模块化 —— 显式导出、显式导入。
// 正确做法二：如果确实是"全局配置"，用一个容器的对象统一管理，并且冻结它。
const globalConfig = Object.freeze({
  appName: 'javascript-examples',
  maxRetries: 3,
});
console.log('用一个冻结的配置对象代替散落的全局变量：', globalConfig);
try {
  // @ts-expect-error 故意制造错误以演示
  globalConfig.maxRetries = 99;
} catch (err) {
  console.log('想改配置 →', err.constructor.name + '：' + err.message);
}

// 正确做法三：如果一定要在全局对象上放东西（例如浏览器里给第三方脚本用的钩子），
// 也要用"命名空间对象"包起来，减少撞名概率，并且显式声明。
globalThis.__MY_APP__ = { version: '1.0.0', ready: false };
console.log('用命名空间减少撞名：', globalThis.__MY_APP__);
console.log("检查它是否存在：", '__MY_APP__' in globalThis, '→ 这就是生产代码里检测钩子的常见写法');
delete globalThis.__MY_APP__; // 演示完清理掉

// ---------------------------------------------------------------------------
// 7. 一张速查表
// ---------------------------------------------------------------------------

console.log('\n--- 7. 顶层声明归宿速查表 ---');
console.table([
  { 声明方式: 'var x', 普通脚本: '成为全局对象属性（不可删）', ES模块: '仅模块作用域' },
  { 声明方式: 'function f(){}', 普通脚本: '成为全局对象属性（不可删）', ES模块: '仅模块作用域' },
  { 声明方式: 'let x', 普通脚本: '仅在全局词法环境（非全局对象属性）', ES模块: '仅模块作用域' },
  { 声明方式: 'const x', 普通脚本: '仅在全局词法环境（非全局对象属性）', ES模块: '仅模块作用域' },
  { 声明方式: 'x = 1（未声明）', 普通脚本: '隐式全局对象属性（可删！）', ES模块: 'ReferenceError' },
  { 声明方式: 'globalThis.x = 1', 普通脚本: '成为全局对象属性（可删）', ES模块: '成为全局对象属性（可删）' },
]);

console.log('\n--- 8. 小结 ---');
console.log('· globalThis 是跨环境访问全局对象的标准入口；浏览器叫 window，Node 叫 global。');
console.log('· 普通脚本里 var/function 会变成全局对象属性，let/const 不会；');
console.log('  而 ESM 模块里四种声明都只属于模块作用域，一个都不挂全局对象。');
console.log('· 隐式全局变量（未声明就赋值）只在非严格模式产生，可被 delete，极其危险。');
console.log('· 严格模式（含所有 ESM）会把隐式全局变量变成 ReferenceError，从源头拦截。');
console.log('· 优先用 export/import 共享状态；确实需要全局钩子时，用命名空间对象 + 冻结。');
