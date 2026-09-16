/**
 * ============================================================================
 * 知识点：浏览器端 ES 模块（Node 中同样的 ESM 用法对比）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】进阶
 * 【前置知识】27_web_apis/07_canvas_basics.js、06_functions/06_iife.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES 模块（ESM，ECMAScript Modules）是 JavaScript 语言层面标准化的模块系统：
 *    用 export 导出、用 import 导入，每个文件是一个独立模块，拥有自己的作用域。
 *    浏览器里用 <script type="module" src="..."> 或内联 <script type="module"> 启用；
 *    Node.js 里 .mjs 文件、或 package.json 写了 "type": "module" 时的 .js 文件就是 ESM。
 *    本仓库的 package.json 里就有 "type": "module"，所以所有 .js 都是 ESM。
 *
 * 2. 为什么需要
 *    在 ESM 之前，浏览器只能靠多个 <script> 标签拼代码，所有顶层变量都挤在全局
 *    作用域里，命名冲突、加载顺序、循环依赖全靠人肉维护（早期用 IIFE 和
 *    CommonJS 缓解）。ESM 解决了三件事：
 *      a) 作用域隔离：模块内的变量不会污染 window；
 *      b) 显式依赖：import 写清楚了"我这个文件依赖谁"；
 *      c) 静态分析：import/export 必须在顶层、名字是字面量，
 *         所以打包工具能在不运行代码的前提下画出依赖图，做 tree-shaking。
 *
 * 3. 核心语法要点
 *    导出：
 *      export const a = 1;           导出变量
 *      export function f() {}        导出函数
 *      export class C {}             导出类
 *      export { x, y as z };         批量导出 / 重命名导出
 *      export default ...            默认导出（一个模块只能有一个）
 *      export * from './other.js'    再导出（转发，不引入本地名字）
 *    导入：
 *      import { a, b as c } from './m.js';   具名导入
 *      import def from './m.js';             默认导入（名字随便取）
 *      import * as ns from './m.js';         命名空间导入（ns.a）
 *      import './m.js';                      只为副作用导入（不取任何名字）
 *      const m = await import('./m.js');     动态导入（返回 Promise）
 *    模块特性：
 *      - 模块顶层是严格模式（不需要写 'use strict'）。
 *      - 模块有自己的作用域，顶层的 this 是 undefined（不是 window）。
 *      - 模块只会被求值一次，无论被 import 多少次（单例）。
 *      - 导出的是"实时活绑定"：模块内部改变量，导入方看到的是新值。
 *      - 导入的绑定是只读的，导入方不能给它赋值。
 *      - import/export 只能写在顶层，不能写在 if 或函数里（静态结构）。
 *    浏览器特有的限制：
 *      - <script type="module"> 自动 defer、自动严格模式、有独立作用域。
 *      - 路径必须写全扩展名，且必须带 ./ 或 ../（不能像 Node 那样省略）。
 *      - 服务器返回的 MIME 类型必须是 JS，否则会被拒绝执行。
 *      - 受同源/CORS 限制：file:// 下外部 .js 模块会被拦，必须用 HTTP 服务器。
 *
 * 4. 常见陷阱
 *    - Node 的 CommonJS 里 require 可以写在任意位置、可以动态拼路径；
 *      ESM 的 import 是静态的，做不到。需要动态加载就用 import()。
 *    - 循环依赖时，先被求值的模块拿到的是"未初始化"的绑定，
 *      访问会抛 ReferenceError（TDZ），比 CommonJS 的"拿到半个对象"更严格。
 *    - 同一份代码在 Node 里跑得好好的，放到浏览器里可能因为路径少写 .js 而 404。
 *    - 默认导出和具名导出混用容易混乱，团队里通常约定"要么全用具名，要么全用默认"。
 *    - 模块路径是"相对于当前模块"，不是相对于 HTML 页面。
 *
 * 【本文件在 Node 中如何演示】
 *    Node.js 与浏览器支持的是同一套 ESM 语法，本文件直接用 ESM 写：
 *    导入同目录的辅助模块 _esm_shared_module.js，演示全部导出/导入写法、
 *    活绑定、单例语义、循环依赖、动态 import()、import.meta，
 *    并用 createRequire 对比 CommonJS 的 require。
 *    与浏览器的差别只在"怎么加载"（打包器/HTTP 服务器 vs node 命令），
 *    语法层面完全一致——这正是 ESM 成为统一标准的价值。
 *
 * 【运行方法】
 *   node 27_web_apis/08_browser_modules.js
 *
 * 【预期输出】
 *   打印模块的求值时机、各种导入方式的结果、活绑定的效果、
 *   单例证明、动态导入、以及 ESM 与 CommonJS 的对比。
 * ============================================================================
 */

// ===========================================================================
// 第 1 部分：具名导入
// ===========================================================================

console.log('--- 1. 具名导入：import { 名字 } from "路径" ---');

// 注意：这行 import 会在文件开始执行之前就被"提升"并求值，
// 所以辅助模块的 "模块求值" 日志会出现在本行之前（见输出）。
import {
  VERSION, // 直接按名字导入
  callCount, // 导入的是"活绑定"，后面会看到它跟着变
  greet,
  Counter,
  shout,
  version as renamedVersion, // 重命名导入：as 后面是本地名字
  __debugHelper,
} from './_esm_shared_module.js';

console.log('  VERSION =', VERSION);
console.log('  version（重命名导入的同一个值）=', renamedVersion);
console.log('  greet("小明") →', greet('小明'));
console.log('  shout("  hello modules  ") →', shout('  hello modules  '), '（内部调用了未导出的私有函数）');
console.log('  __debugHelper("  trim me  ") →', __debugHelper('  trim me  '), '（重命名导出的内部函数）');

const counter = new Counter();
counter.increment(3).increment(4); // 链式调用
console.log('  new Counter().increment(3).increment(4).value =', counter.value, '（私有字段 #value 外部读不到）');
console.log('');

// ===========================================================================
// 第 2 部分：默认导入
// ===========================================================================

console.log('--- 2. 默认导入：名字随便取 ---');

// 默认导出在导入时可以任意命名，这也是一把双刃剑：
// 灵活，但不同文件里同一个东西可能叫不同名字，影响可读性。
import createGreeter from './_esm_shared_module.js';

const greeter = createGreeter('【默认导出】');
console.log('  createGreeter("【默认导出】")("小红") →', greeter('小红'));
console.log('');

// ===========================================================================
// 第 3 部分：命名空间导入
// ===========================================================================

console.log('--- 3. 命名空间导入：import * as ns ---');

// 把模块的所有具名导出收集成一个对象（类似 CommonJS 的 module.exports）
import * as shared from './_esm_shared_module.js';

console.log('  命名空间对象上的键 =', Object.keys(shared).sort());
console.log('  shared.VERSION =', shared.VERSION);
console.log('  shared.default 是默认导出 =', typeof shared.default);
console.log('  注意：命名空间对象是"密封"的，不能给它加新属性，也不能改已有属性。', 'dim');
try {
  shared.NEW_KEY = 1; // 严格模式下会抛错
  console.log('  给命名空间加属性：没有报错（非严格模式下会静默失败）');
} catch (err) {
  console.log('  给命名空间加属性：抛错 →', err.name + ': ' + err.message);
}
console.log('');

// ===========================================================================
// 第 4 部分：活绑定（live binding）
// ===========================================================================

console.log('--- 4. 活绑定：导出的是"引用"，不是"快照" ---');

console.log('  调用 greet 之前的 callCount =', callCount);
greet('小刚');
greet('小美');
console.log('  调用 2 次 greet 之后的 callCount =', callCount, '← 导入方看到的是模块内部的最新值');
console.log('  这正是 ES 模块与 CommonJS 的一个关键区别：');
console.log('    CommonJS 的 require 拿到的是"值的拷贝"（对基本类型而言），');
console.log('    ES 模块的 import 拿到的是"活的绑定"，永远指向模块内部的那个变量。');
console.log('');

// ===========================================================================
// 第 5 部分：模块只被求值一次（单例）
// ===========================================================================

console.log('--- 5. 模块只求值一次：无论被 import 多少次 ---');
console.log('  本文件里 import 了 _esm_shared_module.js 三次（具名/默认/命名空间），');
console.log('  但输出里那句 "[模块求值]" 只出现了一次，说明它只被执行了一遍。');
console.log('  意义：模块天然是单例，模块内部的状态在所有导入者之间共享。');
console.log('');
// 用对象身份验证"是同一个实例"
console.log('  shared.Counter === Counter？', shared.Counter === Counter, '（同一个类对象）');
{
  // 动态 import 也拿到同一个已缓存的模块实例
  const again = await import('./_esm_shared_module.js');
  console.log('  await import() 再次导入，是否同一个命名空间对象？', again === shared, '（模块缓存生效，不会重新执行）');
}
console.log('');

// ===========================================================================
// 第 6 部分：动态导入（import()）
// ===========================================================================

console.log('--- 6. 动态导入：import() 是"表达式"，可以在任何地方调用 ---');

// import() 返回 Promise，可以按需加载（代码分割、按路由懒加载）
const moduleUrl = new URL('./_esm_shared_module.js', import.meta.url).href;
console.log('  动态导入的地址 =', moduleUrl);
const dynamic = await import(moduleUrl);
console.log('  dynamic.greet("动态导入") →', dynamic.greet('动态导入'));
console.log('');

console.log('  也可以用条件来决定加载哪个模块：');
const useDetail = true;
if (useDetail) {
  // 真实项目里这行会触发一次网络请求，只在需要时才下载对应文件
  const mod = await import('./_esm_shared_module.js');
  console.log('    已按需加载 detail 模块，VERSION =', mod.VERSION);
}
console.log('  注意：动态导入仍然会被模块缓存，重复 import() 同一个文件不会重复执行。');
console.log('');

// ===========================================================================
// 第 7 部分：import.meta
// ===========================================================================

console.log('--- 7. import.meta：模块自己的元信息 ---');

// import.meta.url 是当前模块的 file:// URL。浏览器与 Node 都有。
console.log('  import.meta.url =', import.meta.url);
console.log('  它对应的属性：');
console.log('    import.meta.url        → 当前模块的完整 URL（浏览器里是 http(s)://，Node 里是 file://）');
console.log('    import.meta.resolve()  → 把相对路径解析成绝对 URL（Node 20+ / 部分浏览器支持）');
if (typeof import.meta.resolve === 'function') {
  console.log('    import.meta.resolve("./x.js") =', import.meta.resolve('./x.js'));
} else {
  console.log('    当前运行时没有 import.meta.resolve，可以用 new URL(相对路径, import.meta.url) 代替');
}
console.log('  CommonJS 里对应的是 __filename 和 __dirname，ESM 里它们不存在。', 'dim');
console.log('');

// ===========================================================================
// 第 8 部分：模块作用域
// ===========================================================================

console.log('--- 8. 模块作用域：模块内的变量不会泄漏到全局 ---');

// 在 ESM 里，顶层 this 是 undefined（CommonJS 里是 module.exports，普通脚本里是 window）
console.log('  ESM 顶层的 this =', this, '（严格模式下模块顶层 this 是 undefined）');

// 定义一个顶层变量
const modulePrivate = '我是本模块的私有变量';
console.log('  modulePrivate =', modulePrivate);
console.log('  globalThis.modulePrivate =', globalThis.modulePrivate, '← 没有挂到全局对象上');
console.log('  在浏览器里对应的是 window.modulePrivate，同样是 undefined。');
console.log('  对比：普通 <script>（非 module）里的顶层 var 会挂到 window 上，这正是要避免的污染。');
console.log('');

// ===========================================================================
// 第 9 部分：与 CommonJS 的对比
// ===========================================================================

console.log('--- 9. 对比 CommonJS：require / module.exports ---');

// Node 提供了 createRequire，可以在 ESM 里加载 CommonJS 模块
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
console.log('  createRequire(import.meta.url) 造出的 require 可以加载 CJS 模块：');
// 用内置模块演示（不访问网络、不依赖 node_modules）
const os = require('node:os');
console.log('    require("node:os").platform() =', os.platform(), '（CJS 与 ESM 都能加载内置模块）');

// 同目录下的 _cjs_like_module.cjs 是一个真正的 CommonJS 模块，
// 用 require 加载它，对比两种模块系统的导出形态。
const cjsLike = require('./_cjs_like_module.cjs');
console.log('    require("./_cjs_like_module.cjs") =', cjsLike);
console.log('    它是用 module.exports 导出的：整个对象就是导出物，没有"具名/默认"之分。');
console.log('    而 ESM 的命名空间对象上，默认导出会挂在 default 属性上。');
console.log('');

console.log('  CommonJS 与 ES 模块的关键区别：');
console.log('    ┌────────────────┬──────────────────────────┬──────────────────────────┐');
console.log('    │                │ CommonJS (require)       │ ES Module (import)       │');
console.log('    ├────────────────┼──────────────────────────┼──────────────────────────┤');
console.log('    │ 语法           │ 函数调用，可在任意位置   │ 静态声明，只能在顶层     │');
console.log('    │ 加载时机       │ 运行时同步加载           │ 静态解析 + 异步求值      │');
console.log('    │ 绑定方式       │ 值的拷贝（基本类型）     │ 实时活绑定               │');
console.log('    │ 是否严格模式   │ 默认非严格               │ 始终严格模式             │');
console.log('    │ 顶层 this      │ module.exports           │ undefined                │');
console.log('    │ 循环依赖       │ 拿到"半个"导出对象       │ 可能触发 TDZ 报错        │');
console.log('    │ 动态加载       │ require(任意字符串)      │ 需用 import() 表达式     │');
console.log('    │ tree-shaking   │ 难（依赖运行时分析）     │ 容易（静态结构）         │');
console.log('    └────────────────┴──────────────────────────┴──────────────────────────┘');
console.log('');

console.log('  最后的结论：语法完全一致，差别只在"怎么加载"：');
console.log('    Node   ：node 命令直接按文件路径加载；.js 是 ESM 还是 CJS 由 package.json 的 type 决定');
console.log('    浏览器 ：通过 <script type="module" src="./x.js"> 加载，路径要写全扩展名、');
console.log('             受 HTTP 与 CORS 约束，file:// 下会被拦截（详见同名 .html）');
console.log('');

console.log('  另外：CommonJS 里可以写 require(动态拼出来的字符串)，');
console.log('        ES 模块的 import 做不到，但可以用 await import(动态字符串) 代替。');
console.log('');

console.log('程序结束。');
console.log('小结：本文件与同名 .html 里的语法完全一致，');
console.log('      区别只在于"谁来加载这个模块"：node 命令，还是浏览器的 type="module"。');
