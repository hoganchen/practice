/**
 * ============================================================================
 * 知识点：Node.js 与浏览器环境的差异
 * ============================================================================
 *
 * 【所属分类】00_hello_world —— 起步
 * 【难度等级】入门
 * 【前置知识】00_hello_world/01_hello_world.js、00_hello_world/03_hello_world_in_browser.html
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    同一门 JavaScript 语言，跑在两个不同的"宿主环境"里，能拿到的东西完全不同：
 *    浏览器注入了 DOM/BOM（window、document、location、alert…）；
 *    Node.js 注入了服务端能力（process、fs、path、Buffer、require…），
 *    并通过 V8 引擎把 JS 带出了浏览器。语言本身（语法、类型、闭包、原型链）
 *    是同一套，差异只体现在"宿主提供的 API"和"模块系统"上。
 *
 * 2. 为什么需要 / 解决什么问题
 *    初学者最常遇到的困惑就是："为什么这段代码在浏览器里能跑，在 Node 里报
 *    document is not defined？"根因就是搞不清哪些是语言的一部分、哪些是宿主给的。
 *    分清这条界线，才能写出既能在两边跑（同构代码）、又能快速定位环境错误的程序。
 *
 * 3. 核心语法要点
 *    （1）全局对象的差异
 *        浏览器：window（= self = globalThis），是页面窗口对象。
 *        Node.js：global（= globalThis），是一个纯粹的全局命名空间容器，没有窗口概念。
 *        ES2020 起，语言层面统一提供了 globalThis，两边都能拿到当前全局对象。
 *    （2）API 可用性的差异
 *        只有浏览器有：document、window、location、navigator、localStorage、alert、
 *                       fetch（浏览器原生，Node 18+ 才补上）、XMLHttpRequest、DOM 事件。
 *        只有 Node.js 有：process、__dirname、__filename、Buffer、require、module、
 *                       以及 node: 开头的内置模块（fs / path / os / http / crypto…）。
 *        两边都有：console、setTimeout / setInterval、fetch（Node 18+）、
 *                 URL、TextEncoder、AbortController、JSON、Math、Promise 等。
 *    （3）模块系统的差异
 *        浏览器：<script src> 全局共享作用域；现代写法是 <script type="module"> 用 ESM。
 *        Node.js：传统是 CommonJS（require / module.exports，文件后缀 .cjs）；
 *                 现代是 ES Module（import / export）。本仓库 package.json 里设了
 *                 "type": "module"，所以 .js 文件一律按 ESM 解析。
 *    （4）顶层 this
 *        非严格模式的 CommonJS 模块里，顶层 this === module.exports（一个空对象）；
 *        ESM 模块顶层 this === undefined。
 *
 * 4. 常见陷阱与注意事项
 *    - 用 typeof 检测宿主对象最安全：typeof document !== 'undefined' 不会因为
 *      document 不存在而抛 ReferenceError，而未声明的变量直接取值会抛错。
 *    - 在 ESM 里 __dirname / __filename 不存在，需用 import.meta.url 配合
 *      fileURLToPath 还原。
 *    - 浏览器里习惯的 alert / localStorage 在 Node 中不存在，别把调试代码直接搬过去。
 *    - Node 的 fetch 是 18 版本才内置的；更早的版本要用 https 模块或第三方库。
 *    - 本文件为了演示"未定义变量会抛错"，刻意用 try/catch 包住，避免进程非零退出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 00_hello_world/04_node_vs_browser.js
 *
 * 【预期输出】
 *   分节打印：当前环境判定、globalThis 对比、API 可用性探测表、
 *   模块系统探测、以及"浏览器专有对象在 Node 中不可用"的报错演示。
 * ============================================================================
 */

// 引入 Node 内置模块来辅助判断 —— 注意这一行在浏览器里会直接报错，
// 因为浏览器不认识 'node:path' 这个说明符。这本身就是环境差异的最好例证。
import path from 'node:path';
import { fileURLToPath } from 'node:url';

console.log('--- 1. 如何判断当前跑在哪个环境 ---');

// 最可靠的两个特征：
// 浏览器有 window 和 document；Node.js 有 process 和 process.versions.node。
// 用 typeof 而不是直接取值，因为对未声明的标识符用 typeof 不会抛错。
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
const isNode = typeof process !== 'undefined' && process.versions?.node != null;

console.log('是否浏览器环境：', isBrowser);
console.log('是否 Node.js 环境：', isNode);
console.log('Node 版本：', typeof process !== 'undefined' ? process.version : '（无 process）');

// 一种更通用的特征检测写法：不关心"我叫什么"，只关心"我要的能力在不在"。
// 这叫"鸭子类型"（duck typing）式探测，写同构代码时非常实用。
function hasFetch() {
  return typeof fetch === 'function';
}
console.log('当前环境是否有 fetch：', hasFetch());

console.log('\n--- 2. 全局对象：window vs global vs globalThis ---');

// globalThis 是 ES2020 引入的标准全局对象引用，
// 无论在浏览器还是 Node.js 中，它都指向"当前的全局对象"。
console.log('typeof globalThis：', typeof globalThis);

// Node.js 特有的全局对象叫 global。
console.log('typeof global：', typeof global);
console.log('global === globalThis ？', global === globalThis);

// 浏览器特有的全局对象叫 window（在 Worker 里叫 self）。
// 在 Node 中，这两者都未定义，用 typeof 探测才会安全返回 'undefined'。
console.log("typeof window：", typeof window, '（Node 中为 undefined）');
console.log("typeof document：", typeof document, '（Node 中为 undefined）');

// 在 Node 里往 global 上挂属性，等价于用 var 在顶层声明变量（后面章节会细讲）。
globalThis.myDemoFlag = '我挂在了 globalThis 上';
console.log('读回刚挂上的属性：', globalThis.myDemoFlag, '（通过 global 也能读到：', global.myDemoFlag, '）');
delete globalThis.myDemoFlag; // 清理干净，避免影响后续示例

console.log('\n--- 3. API 可用性探测表 ---');

// 把"环境专有 API"列出来逐个探测，用表格展示差异。
// 注意：这里只做 typeof 检测，不实际调用，所以不会有副作用。
const apiChecks = [
  // [API 名称, 属于哪个环境, 表达式]
  ['console', '公共', () => typeof console],
  ['setTimeout', '公共', () => typeof setTimeout],
  ['Promise', '公共', () => typeof Promise],
  ['JSON', '公共', () => typeof JSON],
  ['URL', '公共', () => typeof URL],
  ['TextEncoder', '公共', () => typeof TextEncoder],
  ['fetch', '公共（Node 18+）', () => typeof fetch],
  ['AbortController', '公共（Node 15+）', () => typeof AbortController],
  ['window', '仅浏览器', () => typeof window],
  ['document', '仅浏览器', () => typeof document],
  ['location', '仅浏览器', () => typeof location],
  // 注意：navigator 原本是浏览器专属，Node 21+ 也补上了一个精简版（只有 userAgent 等少量属性）。
  // 这说明"环境差异"不是一成不变的 —— 所以永远要用 typeof 探测，不要写死假设。
  ['navigator', '浏览器 / Node 21+', () => typeof navigator],
  ['localStorage', '仅浏览器', () => typeof localStorage],
  ['alert', '仅浏览器', () => typeof alert],
  ['XMLHttpRequest', '仅浏览器', () => typeof XMLHttpRequest],
  ['process', '仅 Node.js', () => typeof process],
  ['Buffer', '仅 Node.js', () => typeof Buffer],
  ['require', '仅 Node.js（CJS）', () => typeof require],
  ['module', '仅 Node.js（CJS）', () => typeof module],
  ['__dirname', '仅 Node.js（CJS）', () => typeof __dirname],
  ['__filename', '仅 Node.js（CJS）', () => typeof __filename],
];

// console.table 能把数组里的对象渲染成对齐的表格，非常适合做"差异对比"。
console.table(
  apiChecks.map(([name, scope, probe]) => {
    // 逐项求值，得到实际的 typeof 结果
    let actual;
    try {
      actual = probe();
    } catch (err) {
      actual = '取值报错';
    }
    return {
      API: name,
      归属环境: scope,
      本机结果: actual,
      存在: actual !== 'undefined' ? '✔' : '✘',
    };
  }),
);

console.log('\n--- 4. 模块系统：ESM vs CommonJS vs <script> ---');

// Node.js 支持两套模块系统，靠"文件后缀 + package.json 的 type 字段"决定用哪套：
//   .mjs / "type": "module" 的 .js  → ES Module：import / export
//   .cjs / "type": "commonjs" 的 .js → CommonJS：require / module.exports
// 本仓库的 package.json 写着 "type": "module"，所以本文件是 ES Module。
// 证据：ESM 里没有 require、module、__dirname 这些 CommonJS 变量。
console.log("本文件里 typeof require：", typeof require, '（ESM 中未定义）');
console.log("本文件里 typeof module：", typeof module, '（ESM 中未定义）');
console.log("本文件里 typeof __dirname：", typeof __dirname, '（ESM 中未定义）');

// ESM 用 import.meta 提供模块自身的元信息，.url 是当前文件的 file:// URL。
console.log('import.meta.url：', import.meta.url);

// 想拿到"当前文件所在目录"（等价于 CommonJS 的 __dirname），
// 标准做法是：把 file:// URL 转成路径，再用 path.dirname 取目录。
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
console.log('等价于 __filename：', currentFilePath);
console.log('等价于 __dirname ：', currentDirPath);
console.log('注意：这两个值在浏览器中毫无意义，浏览器里脚本没有"文件系统路径"的概念。');

console.log('\n--- 5. 顶层 this 的差异（顺带演示） ---');

// 在 ES Module 中，模块顶层作用域的 this 是 undefined（规范如此规定）。
// 对比：CommonJS 模块顶层 this === module.exports（一个空对象 {}）；
//       浏览器普通 <script> 顶层 this === window。
console.log('ESM 顶层 this：', this, ' → 值为 undefined 说明这确实是 ESM 模块');

console.log('\n--- 6. 浏览器专有对象在 Node 中不可用（报错演示） ---');

// 关键点：下面这段代码是"错的"，但必须在文件内部 try/catch 捕获，
// 绝不能让它把异常抛到顶层，否则进程会以非零退出码结束。
try {
  // 直接使用一个未声明的标识符，会抛出 ReferenceError。
  // 在浏览器里 document 是真实存在的全局对象，这行能正常返回元素；
  // 在 Node.js 里 document 从未被声明过，于是抛错。
  const el = document.getElementById('app');
  console.log('这行不会被执行到：', el);
} catch (err) {
  console.log('捕获到错误类型：', err.constructor.name);
  console.log('错误信息：', err.message);
  console.log('结论：浏览器专有 API 在 Node 中会抛 ReferenceError，必须先检测再使用。');
}

// 更稳妥的写法：先判断存在性，再决定要不要调用 —— 写同构代码的标准姿势。
if (typeof document !== 'undefined') {
  console.log('检测到 document，可以在页面里操作 DOM');
} else {
  console.log('未检测到 document，跳过所有 DOM 操作（当前正是这种情况）');
}

console.log('\n--- 7. 小结 ---');
console.log('· 语言（语法、类型、闭包、原型）两边完全一致；差异只在宿主注入的 API 与模块系统。');
console.log('· 用 typeof xxx !== "undefined" 检测环境，比硬编码假设安全得多。');
console.log('· 同一份代码要跑两边（同构），就把环境相关部分抽成适配层，其余写成纯逻辑。');
