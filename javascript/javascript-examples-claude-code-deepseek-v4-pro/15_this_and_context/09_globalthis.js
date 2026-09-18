/**
 * ============================================================================
 * 知识点：globalThis —— 跨环境访问全局对象的统一方式
 * ============================================================================
 *
 * 【所属分类】15_this_and_context —— this 与执行上下文
 * 【难度等级】入门
 * 【前置知识】15_this_and_context/08_this_in_class.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    globalThis 是 ES2020 引入的标准全局属性，它**始终指向当前环境的全局对象**，
 *    无论代码跑在浏览器、Node.js、Web Worker 还是其它 JS 运行时里。
 *
 * 2. 为什么需要
 *    在 globalThis 出现之前，不同环境访问全局对象的方式各不相同：
 *      - 浏览器主线程：window（也可以用 self、frames）
 *      - Web Worker：self
 *      - Node.js CommonJS：global
 *      - 严格模式 / ESM 模块：this 是 undefined，拿不到全局对象
 *      - 非严格模式脚本：this 是全局对象
 *    于是大家写出各种兼容代码：
 *        const g = typeof window !== 'undefined' ? window : global;
 *    这种代码冗长、容易漏掉新环境（如 Deno、Worker、小程序）。
 *    globalThis 用一个名字解决了全部问题。
 *
 * 3. 核心语法要点
 *    - 语法：globalThis 就是全局对象本身，直接读即可，不需要声明。
 *    - 等价性（在 Node.js 里验证）：
 *        globalThis === global          // true（CommonJS 里）
 *        globalThis.console === console // true
 *        globalThis === window          // 浏览器里为 true
 *    - 任何"全局变量"和"全局函数"其实都是它的属性：
 *        var x = 1;  → globalThis.x === 1
 *        但 let / const / class 声明的顶层绑定**不会**成为它的属性。
 *    - 在 ESM 里，顶层 this 是 undefined，但 globalThis 依然可用。
 *    - 添加东西：globalThis.myThing = 1，任何地方都能读到。
 *    - 判断代码运行环境时，通常只检查某个环境**特有**的全局属性，
 *      而不是直接比较 globalThis 与某个名字。
 *
 * 4. 常见陷阱
 *    - 以为 let/const 声明的顶层变量会挂到 globalThis 上 —— 不会。
 *    - 在浏览器里写 globalThis.window 是安全的，但在 Node 里 window 不存在。
 *    - 用 globalThis 挂工具函数是常见的做法，但会造成"隐式全局状态"，
 *      污染运行环境，测试时互相干扰；正式项目请用 ES 模块导出。
 *    - globalThis 是只读的引用（不可重新赋值），但它的属性可以增删。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 15_this_and_context/09_globalthis.js
 *
 * 【预期输出】
 *   验证 globalThis 的等价关系、全局绑定规则，以及跨环境检测的推荐写法。
 * ============================================================================
 */

console.log('--- 1. globalThis 与各环境名字的等价关系 ---');

// 在 Node.js 里，global 就是全局对象
console.log('globalThis === global ？', globalThis === global);
// 内置对象其实都是全局对象的属性
console.log('globalThis.console === console ？', globalThis.console === console);
console.log('globalThis.Object === Object ？', globalThis.Object === Object);
console.log('globalThis.Math === Math ？', globalThis.Math === Math);

// 下面这些是 Node 特有的全局对象，浏览器里不存在
console.log('有 process 吗？', typeof globalThis.process);
console.log('有 Buffer 吗？', typeof globalThis.Buffer);
console.log('有 window 吗？', typeof globalThis.window, '（Node 里没有）');
console.log('有 self 吗？', typeof globalThis.self, '（Node 里也没有，浏览器/Worker 才有）');
console.log('有 document 吗？', typeof globalThis.document, '（Node 里没有）');

// 模块顶层的 this 与 globalThis 的关系
console.log('模块顶层 this === globalThis ？', this === globalThis, '（ESM 里顶层 this 是 undefined）');

console.log('--- 2. 哪些声明会变成 globalThis 的属性 ---');

// 用 var 在模块顶层声明 —— 注意：在 ESM 里 var 也是模块作用域，不会挂到 globalThis。
var varDeclaration = 'var 声明的顶层变量';
let letDeclaration = 'let 声明的顶层变量';
const constDeclaration = 'const 声明的顶层变量';

console.log('var 声明出现在 globalThis 上吗？', 'varDeclaration' in globalThis, '（ESM 里不会）');
console.log('let 声明出现在 globalThis 上吗？', 'letDeclaration' in globalThis);
console.log('const 声明出现在 globalThis 上吗？', 'constDeclaration' in globalThis);

// 造一个"老式非严格脚本"环境来对比。
// 关键在于用**间接 eval**（把 eval 赋值给变量后再调用）：
// 间接 eval 的代码在**全局作用域**、非严格模式下求值，
// 因此 var 声明与未声明赋值都会真的挂到全局对象上。
const globalEval = eval;
globalEval("var scriptVar = '脚本里的 var';");
globalEval("scriptUndeclared = '未声明的赋值';");

console.log('（脚本环境）var 挂到全局对象上了吗？', 'scriptVar' in globalThis);
console.log('（脚本环境）未声明赋值会挂上去吗？', 'scriptUndeclared' in globalThis, '（这也是全局污染）');
console.log('（脚本环境）直接读全局变量：', globalThis.scriptVar);

// 清理脚本环境留下的痕迹
delete globalThis.scriptVar;
delete globalThis.scriptUndeclared;
console.log('清理后还残留吗？', 'scriptVar' in globalThis, 'scriptUndeclared' in globalThis);

console.log('--- 3. 显式往 globalThis 上挂东西 ---');

// 这是"显式"的全局变量，语义清楚，但应当谨慎使用。
globalThis.__demoCounter = 0;
globalThis.__demoTick = function demoTick() {
  globalThis.__demoCounter += 1;
  return globalThis.__demoCounter;
};

// 模块内直接用名字也能访问（因为 globalThis 的属性就是全局绑定）
console.log('直接读 __demoCounter =', __demoCounter);
__demoTick();
__demoTick();
console.log('调用两次后 __demoCounter =', __demoCounter);

// 用完清理，避免污染运行环境（测试之间会互相影响）
delete globalThis.__demoCounter;
delete globalThis.__demoTick;
console.log('清理后还存在吗？', '__demoCounter' in globalThis);

console.log('--- 4. 判断运行环境的推荐写法 ---');

// 只检查"某环境特有"的东西，而不是比较 globalThis 的名字。
function detectRuntime() {
  // Node.js：有 process.versions.node
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return `Node.js ${process.versions.node}`;
  }
  // Web Worker：有 importScripts，但没有 document
  if (typeof importScripts === 'function' && typeof document === 'undefined') {
    return 'Web Worker';
  }
  // 浏览器主线程：有 document
  if (typeof document !== 'undefined') {
    return '浏览器';
  }
  return '未知环境';
}
console.log('当前运行环境：', detectRuntime());

console.log('--- 5. 特性检测 vs 环境检测 ---');

// 更好的做法是"检测能力"而不是"检测环境"：能跑就用。
function supportsFeature() {
  const features = {
    'globalThis': typeof globalThis !== 'undefined',
    'Array.prototype.at': typeof [].at === 'function',
    'Object.hasOwn': typeof Object.hasOwn === 'function',
    'structuredClone': typeof globalThis.structuredClone === 'function',
    'fetch': typeof globalThis.fetch === 'function',
    'AbortController': typeof globalThis.AbortController === 'function',
  };
  return features;
}

const features = supportsFeature();
for (const [name, ok] of Object.entries(features)) {
  console.log(`  ${name.padEnd(22)} ${ok ? '可用' : '不可用'}`);
}

console.log('--- 6. globalThis 上值得认识的内置成员 ---');

// 全局对象上挂着语言与宿主提供的全部内置能力
const groups = {
  '语言内置': ['Object', 'Array', 'Map', 'Set', 'Promise', 'Symbol', 'Reflect', 'Proxy'],
  '数值与文本': ['Math', 'Number', 'BigInt', 'String', 'JSON', 'Intl'],
  '错误类型': ['Error', 'TypeError', 'RangeError', 'SyntaxError'],
  '宿主能力(Node)': ['process', 'console', 'setTimeout', 'setInterval', 'queueMicrotask', 'structuredClone'],
};

for (const [group, names] of Object.entries(groups)) {
  const present = names.filter((n) => typeof globalThis[n] !== 'undefined');
  const missing = names.filter((n) => typeof globalThis[n] === 'undefined');
  console.log(`  ${group}：`);
  console.log(`    存在：${present.join(', ')}`);
  if (missing.length > 0) console.log(`    缺失：${missing.join(', ')}`);
}

console.log('--- 7. 一个实际场景：跨环境的"全局配置" ---');

// 有些库会把版本号、运行标记挂在 globalThis 上供其它模块读取。
// 这里演示"如何做得更安全"：用 Symbol 作为键，避免与别人的名字冲突。
const APP_INFO = Symbol.for('demo.app.info');

globalThis[APP_INFO] = { version: '1.0.0', env: 'demo' };
// Symbol.for 注册的 Symbol 是全局共享的，同一个 key 拿到同一个 Symbol
console.log('用 Symbol 键读取：', JSON.stringify(globalThis[Symbol.for('demo.app.info')]));

// 用 Symbol 作键的属性不会被 for...in / Object.keys 枚举出来
console.log('会被 Object.keys 扫到吗？', Object.keys(globalThis).includes('Symbol(demo.app.info)'));
delete globalThis[APP_INFO];

console.log('--- 8. 小结 ---');

const summary = [
  'globalThis 是唯一跨环境的全局对象引用，优先使用它。',
  'ESM 里顶层 this 是 undefined，想拿全局对象就用 globalThis。',
  'var 在脚本里会挂到全局对象，在 ESM 里不会；let/const 永远不会。',
  '往 globalThis 上写东西等于制造隐式全局状态，正式代码请用模块导出。',
  '检测环境时优先"特性检测"，而不是"比较 globalThis 的名字"。',
];
for (const line of summary) console.log('  •', line);

console.log('\n全部演示完毕。');
