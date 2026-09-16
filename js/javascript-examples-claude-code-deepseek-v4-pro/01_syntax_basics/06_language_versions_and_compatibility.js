/**
 * ============================================================================
 * 知识点：目标环境的特性可用性判断与降级策略（特性检测 / polyfill / 转译）
 * ============================================================================
 *
 * 【所属分类】01_syntax_basics —— 语法基础
 * 【难度等级】进阶
 * 【前置知识】01_syntax_basics/05_identifiers_and_naming.js、04_operators/06_optional_chaining.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 是**由宿主环境决定能力**的语言：语言规范（ECMAScript）只规定
 *    "语法长什么样、内置对象该有什么方法"，而"你的代码到底能用到哪些东西"
 *    取决于它跑在哪个引擎、什么版本、开了什么开关。浏览器还额外受限于**用户装的是哪个版本**。
 *
 *    注意：本仓库的 34_modern_es_features/01~03 讲的是"哪一版 ES 新增了哪些特性"
 *    的**清单**；本文件讲的是另一件事 —— **方法论**：
 *        · 怎么判断某个特性在当前环境里能不能用（特性检测）
 *        · 不能用的时候怎么办（优雅降级 / 渐进增强）
 *        · 补齐手段该选哪一种（polyfill / 转译 / 干脆不用）
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 同一个页面要在 Chrome 130、Safari 16、某个国产浏览器的"兼容模式"里都跑起来。
 *    (2) 同一个 npm 包要被 Node 18 / 20 / 22 / 24 的项目安装使用。
 *    (3) 公司的内网还有 IE 内核的旧系统（是的，2026 年了还有）。
 *    在这些场景下，"我本机能跑"完全不能作为依据。你必须：
 *        先检测 -> 再决定走哪条路 -> 而不是祈祷。
 *
 *    ★ 最容易踩的坑来自**从 Java / Python 过来的人**：
 *      Java 有 `java -version`、`--release 17`，"语言版本"是一个你可以查询、
 *      可以声明、可以依赖的**明确事实**；
 *      Python 有 `sys.version_info`、`python_requires`，同样明确。
 *      但 **JavaScript 没有这回事**：不存在"这门语言是 ES2022 版"的说法。
 *      一个引擎可以只实现 ES2022 的一部分（比如 Safari 支持 A 不支持 B），
 *      也可以提前实现某个还在提案阶段的特性。**没有"版本号"可以依赖。**
 *      所以"用版本号判断"在 JS 里从根上就是错的思路，必须换成"逐个特性检测"。
 *
 * 3. 核心语法要点
 *    (1) 特性检测（feature detection）的四种正确写法
 *        a. 检测**全局函数/全局对象**是否存在：
 *              typeof structuredClone === 'function'
 *           为什么用 typeof 而不是直接 `if (structuredClone)`？
 *             直接读一个未声明的标识符会抛 ReferenceError（`in` 不会，见下），
 *             而 `typeof 未声明变量` 是唯一安全的写法，返回 'undefined' 不报错。
 *        b. 检测**对象上的属性**是否存在（含原型链）：
 *              'toSorted' in Array.prototype
 *              'groupBy' in Object
 *           `in` 的优点：不会因为值是 undefined 而误判；缺点：会沿原型链找。
 *        c. 检测**方法并确认它可调用**（最严谨）：
 *              typeof Array.prototype.toSorted === 'function'
 *           同时确认"存在"且"是函数"，避免别人给它赋了个非函数的值。
 *        d. 检测**构造函数的能力**（如私有字段、新语法）只能靠 try/eval：
 *              新**语法**（可选链、私有字段、顶层 await）是无法用 typeof 检测的，
 *              因为解析失败会直接抛 SyntaxError，必须用 try { new Function(...) } 包起来。
 *    (2) 为什么**不能**靠 User-Agent / 版本号判断
 *        - UA 字符串可以被用户或插件随意篡改，是出了名的不可信。
 *        - 浏览器版本号与特性支持**不是一对一**的：同一版本在不同平台上支持度不同，
 *          厂商还会各自实现不同的提案。
 *        - 大量"兼容模式""套壳浏览器"的 UA 看起来像 Chrome，实际内核是旧的。
 *        - 反过来，特性检测是**当下的、真实的、无法作弊的**事实：
 *          函数在不在，一试便知。
 *        结论：**UA 可以用于统计上报，绝不能用于功能分支。**
 *    (3) 优雅降级（graceful degradation） vs 渐进增强（progressive enhancement）
 *        - 优雅降级：先做最完整的功能，检测到环境不行时**减掉**一部分。
 *          思路是"从完整出发往回退"。
 *        - 渐进增强：先保证最基础的功能一定能用，检测到环境更强时**加上**更多体验。
 *          思路是"从能跑出发往上加"。**这是更推荐的思路**，
 *          因为它保证了"任何环境下核心功能都可用"。
 *        本文件的演示按渐进增强组织：核心结果用降级实现保证一定能算出来，
 *        能用的高级特性只用来"做得更好/更快/更简洁"。
 *    (4) 三种补齐手段，什么时候用哪个
 *        ┌────────────┬──────────────────────────────┬───────────────────────────┐
 *        │ 手段        │ 做什么                        │ 什么时候用                  │
 *        ├────────────┼──────────────────────────────┼───────────────────────────┤
 *        │ polyfill   │ **运行时**往全局补上缺失的实现   │ 缺的是**内置对象/方法**，     │
 *        │            │ （改的是运行环境本身）          │ 且改动全局是可接受的          │
 *        ├────────────┼──────────────────────────────┼───────────────────────────┤
 *        │ 转译        │ **构建期**把新语法改写成老语法   │ 缺的是**语法**（因为老引擎     │
 *        │ transpile  │ （改的是你的源码，产出新文件）    │ 根本解析不了，polyfill 救不了）│
 *        ├────────────┼──────────────────────────────┼───────────────────────────┤
 *        │ 直接不用    │ 换一种实现方式，或只降级体验      │ 用一次要背上整个 polyfill、   │
 *        │            │                              │ 收益抵不过成本时 —— 最常见     │
 *        └────────────┴──────────────────────────────┴───────────────────────────┘
 *        关键区别：**语法缺失只能靠转译，API 缺失只能靠 polyfill。**
 *        老浏览器解析不了 `a?.b`，你写多少个 polyfill 都没用，因为它连解析都过不了；
 *        反过来 `Array.prototype.at` 这种缺的是"方法"，polyfill 一行就能补上。
 *    (5) polyfill 的代价（别无脑引 core-js）
 *        - **体积**：core-js 全量引入 200KB+，比你的业务代码还大，直接拖慢首屏。
 *        - **性能**：polyfill 是纯 JS 实现，通常比原生慢（比如手写 groupBy 要比
 *          原生慢好几倍），而且是在**运行时**逐个打补丁。
 *        - **语义漂移**：polyfill 很难 100% 复刻规范细节（比如 structuredClone
 *          支持循环引用和 Map/Set，JSON 版完全不支持）。用了错的 polyfill 比
 *          没有 polyfill 更危险，因为代码"能跑"会掩盖问题。
 *        - **全局污染**：改 Array.prototype / Object 属于动别人的地盘，
 *          可能与其它库冲突，也会让"你到底能依赖什么"变得难以推理。
 *        - **可维护性**：几年后没人记得为什么要引这个 polyfill，也没人敢删。
 *    (6) 配套的工程手段（只讲概念，本文件不联网、不读配置文件）
 *        - package.json 的 `engines` 字段：**只是建议**。npm 默认只打印一条
 *          warning（除非使用者开了 engine-strict），**不会**阻止安装在老 Node 上。
 *          所以它不能当作"运行时保证"，只能当作"文档"。
 *        - browserslist：一份"我要支持哪些浏览器"的声明（写在 package.json
 *          或 .browserslistrc 里）。Babel / PostCSS / autoprefixer / terser 等工具
 *          都读它，从而**自动决定**转译到哪个语法级别、要不要打前缀。
 *          命令行里执行 `npx browserslist` 可以打印出"你这套配置实际覆盖了哪些浏览器版本"，
 *          用来验证"我以为我支持了，其实没有"这类问题。
 *        - caniuse.com（以及 node.green / MDN 的兼容性表）：查"某个特性在
 *          各环境的最低支持版本"。用途是**决定工程量**：
 *          是直接不用、还是要转译/polyfill。注意它给的是"最低版本"，
 *          而你的判断依据永远是运行时检测，两者互补而不是替代。
 *        - 本仓库的 engines 声明是 `node >= 18`，这属于"约定 + CI 检查"，
 *          不是语言层面的强制。
 *
 * 4. 常见陷阱
 *    - 【把版本号当能力】`if (nodeVersion >= 20) 用 Object.groupBy` ——
 *      同一个 Node 大版本的不同小版本、不同构建参数、不同平台都可能有差异；
 *      而且这段代码到了浏览器里根本没有 nodeVersion 可读。
 *    - 【直接 if (someNewGlobal) 会 ReferenceError】未声明的标识符必须用 typeof 探测。
 *    - 【用 `in window` / `window.xxx` 判断】在 Node.js 里没有 window，
 *      跨环境代码要用 `typeof globalThis` 系列写法。
 *    - 【以为 polyfill 能救语法】`a?.b` 在老引擎里是 SyntaxError，
 *      这是**解析阶段**的错误，任何运行时补齐都来不及执行。
 *    - 【in 会沿原型链】`'toString' in obj` 永远为 true；要只查自身用
 *      Object.hasOwn / Object.prototype.hasOwnProperty.call。
 *    - 【检测了就一定安全？】请检查的对象本身可能就是 undefined
 *      （`Object.groupBy` 里 Object 一定存在，但 `window.foo.bar` 就不一定了）；
 *      链式检测要先确认上一层存在，或用可选链。
 *    - 【检测结果被缓存后环境变了】浏览器插件在页面加载后注入 polyfill、
 *      或者你引的库晚一步改了原型 —— 所以检测要放在**使用前**，而不是模块顶层算一次就永远相信。
 *    - 【降级路径没人测】降级分支往往写了就再也没被执行过，属于"死代码"。
 *      本文件的做法是：**把降级实现单独抽成函数并直接调用测试**，
 *      这样它在任何环境（哪怕是不需要降级的现代 Node）上都能被验证到。
 *    - 【检测到了，却用错了】把静态方法赋值给变量会**解绑 this**。
 *      例如 `const w = Promise.withResolvers; w();` 会抛
 *      "TypeError: Promise.withResolvers called on non-object"，
 *      而 `const g = Object.groupBy; g(...)` 却能正常工作 —— 因为前者依赖 this、
 *      后者不依赖。所以"特性检测通过"只保证函数存在，不保证怎么调都对。
 *      （本文件在第 4 节用注释标出了这个真实的坑。）
 *
 * 【运行方法】
 *   在仓库根目录执行：node 01_syntax_basics/06_language_versions_and_compatibility.js
 *
 * 【预期输出】
 *   1) 打印本机 Node 版本（仅作参考，不作为判断依据）；
 *   2) 对 Object.groupBy、Array.prototype.toSorted、Promise.withResolvers、
 *      Array.prototype.at、structuredClone 五个特性逐个做特性检测并打印支持情况；
 *   3) 用"能用的就用原生、不能用的用降级实现"的统一接口跑一遍真实用例，
 *      打印结果 —— 因此在**任何** Node 版本上都能跑通并退出码 0；
 *   4) 演示三种特性检测写法的区别（typeof / in / 版本号反例）；
 *   5) 演示语法缺失无法用 polyfill 补救（用 try/catch 包住动态解析）。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 先看清"环境信息"，但记住：这些信息只能参考，不能作为功能分支的依据
// ---------------------------------------------------------------------------

console.log('--- 0. 参考信息（不是判断依据！） ---');

// process 是 Node.js 提供的全局对象，浏览器里没有（浏览器里是 window）。
// 用 typeof 保护一下，让这段代码在浏览器里也不会崩。
const isNode = typeof process !== 'undefined' && process.versions != null;
console.log('  当前运行时        ：', isNode ? 'Node.js' : '非 Node 环境（如浏览器）');
if (isNode) {
  console.log('  process.version   ：', process.version);
  console.log('  V8 引擎版本        ：', process.versions.v8);
}
// 再次强调：下面所有功能分支**都不会**去读 process.version。
// 它不是"语言版本"，只是一串字符串，且浏览器里根本不存在。

// ---------------------------------------------------------------------------
// 1. 五个真实特性的特性检测
// ---------------------------------------------------------------------------

console.log('--- 1. 特性检测：五个真实特性 ---');

// 统一的检测写法：
//   · 全局函数 -> typeof xxx === 'function'
//   · 原型方法 -> typeof X.prototype.yyy === 'function'（同时确认存在且可调用）
//   · 静态方法 -> typeof X.yyy === 'function'
// 全部包在函数里，保证在缺少这些特性的老环境里**不会**抛异常。
const support = {
  // ES2024：Object.groupBy（静态方法）
  objectGroupBy: typeof Object.groupBy === 'function',
  // ES2023：Array.prototype.toSorted（原型方法，非破坏性排序）
  arrayToSorted: typeof Array.prototype.toSorted === 'function',
  // ES2024：Promise.withResolvers（静态方法）
  promiseWithResolvers: typeof Promise.withResolvers === 'function',
  // ES2022：Array.prototype.at（原型方法，支持负数下标）
  arrayAt: typeof Array.prototype.at === 'function',
  // 结构化克隆：全局函数（最初来自 HTML 规范，现已在 Node 17+ / 现代浏览器可用）
  structuredClone: typeof structuredClone === 'function',
  // 顺带检测一个"老特性"作为对照：ES2015 的 Array.from 现在几乎总是有的
  arrayFrom: typeof Array.from === 'function',
};

// 用 console.table 打印一张清爽的对照表
console.table(
  Object.entries(support).map(([feature, ok]) => ({
    特性: feature,
    本机是否支持: ok ? '支持' : '不支持',
  })),
);

// 也可以用 `in` 来检测（注意：它会沿原型链查找）
console.log("  用 in 检测（注意会沿原型链）：'toSorted' in Array.prototype =",
  'toSorted' in Array.prototype);
console.log("  'groupBy' in Object =", 'groupBy' in Object);
// `in` 与 typeof 的取舍：`in` 只回答"有没有这个属性"，
// 若有人把它赋成了非函数（比如 undefined），`in` 仍返回 true，typeof 才更严谨。

// ---------------------------------------------------------------------------
// 2. 为什么不能靠版本号 / User-Agent 判断？（反例演示）
// ---------------------------------------------------------------------------

console.log('--- 2. 反例：版本号判断为什么不可靠 ---');

// 反例写法一：用 Node 大版本号决定用不用 Object.groupBy。
// 问题：a) 浏览器里没有 process.version，这行直接崩；
//       b) 版本号与"是否实现了某特性"没有强绑定关系（小版本、flag、平台都可能不同）；
//       c) 未来 Node 版本号涨上去，这段判断的语义却不会自动更新。
const nodeMajor = isNode ? Number.parseInt(process.version.slice(1), 10) : 0;
const byVersion = nodeMajor >= 21; // 假设"Node 21+ 就有 Object.groupBy"
console.log('  版本号判断的结论："有 Object.groupBy" =', byVersion);
console.log('  特性检测的结论  ："有 Object.groupBy" =', support.objectGroupBy);
console.log('  ^ 本次恰好一致，但这只是巧合 —— 判断依据本身是错的。');
console.log('    正确做法：直接问环境"你有没有这个函数"，而不是猜"你几岁了"。');

// 反例写法二：浏览器里靠 navigator.userAgent 判断。
// 这里只做"字符串展示"，不执行任何分支逻辑。
if (typeof navigator !== 'undefined' && navigator.userAgent) {
  console.log('  （浏览器环境）UA 示例：', navigator.userAgent.slice(0, 60), '...');
  console.log('  ^ UA 可以被用户/插件随意改写，也解释不了"套壳浏览器"的真实内核。');
} else {
  console.log('  （Node 环境）没有 navigator.userAgent —— 这也说明基于 UA 的代码');
  console.log('    天然无法在服务端复用，而特性检测的代码天然跨环境。');
}

// ---------------------------------------------------------------------------
// 3. 降级实现（polyfill 风格）—— 并**直接测试降级实现本身**
// ---------------------------------------------------------------------------

console.log('--- 3. 降级实现（并主动测试它们，避免成为死代码） ---');

// 每个降级实现都写成具名函数，好处是：
//   1) 可以被单独调用测试（这是关键：降级代码也必须被验证过）
//   2) 不污染全局（真正的 polyfill 会挂到 Object / Array.prototype 上，
//      这里为了教学安全选择"函数式"的局部降级）

// (a) Object.groupBy 的降级：按回调返回值分组
// 规范行为：返回一个"无原型对象"（null prototype），键来自回调的返回值，
// 值是"匹配该键的元素数组"。
function groupByFallback(items, keyFn) {
  const result = Object.create(null); // 规范用的是无原型对象，避免 __proto__ 之类的键造成意外
  for (let i = 0; i < items.length; i += 1) {
    const key = keyFn(items[i], i); // 规范里回调也是 (元素, 下标)
    if (result[key] === undefined) {
      result[key] = []; // 第一次遇到这个键，先建空数组
    }
    result[key].push(items[i]);
  }
  return result;
}
// 小提醒：真正的 Object.groupBy 支持 Symbol 作为键，这里的简化版用字符串键足够演示。

// (b) Array.prototype.toSorted 的降级：复制一份再排序（不修改原数组）
function toSortedFallback(arr, compareFn) {
  // 先复制（slice() 不传参即浅拷贝），再在副本上排序 —— 这就是 toSorted 与 sort 的唯一区别
  const copy = arr.slice();
  // 注意：sort 的默认比较器是"按字符串排序"，toSorted 保持一致，所以这里原样透传
  return copy.sort(compareFn);
}

// (c) Promise.withResolvers 的降级：把 resolve/reject 暴露到外面
function withResolversFallback() {
  // 经典"延迟对象"模式：先在 Promise 构造器里把两个函数抓出来，再连同 promise 一起返回
  let resolveFn;
  let rejectFn;
  const promise = new Promise((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });
  return { promise, resolve: resolveFn, reject: rejectFn };
}

// (d) Array.prototype.at 的降级：支持负数下标
function arrayAtFallback(arr, index) {
  // 核心公式：负下标从末尾往前数。例如 length=3 时，-1 -> 2，-3 -> 0
  const i = index < 0 ? arr.length + index : index;
  // 越界（包括负数越界后仍为负）返回 undefined，与原生一致
  if (i < 0 || i >= arr.length) {
    return undefined;
  }
  return arr[i];
}
// 注意 at 与 arr[index] 的区别：arr[-1] 是读"名为 -1 的属性"，永远是 undefined。

// (e) structuredClone 的降级：JSON 往返（一个**不完整**的降级）
function structuredCloneFallback(value) {
  // 这是最著名的"错误 polyfill"示例：JSON 往返会丢掉 undefined、函数、Date 变成字符串、
  // Map/Set 变成空对象、循环引用直接抛错。
  // 这里保留它作为反面教材，用来演示"polyfill 的语义漂移"。
  return JSON.parse(JSON.stringify(value));
}

// ---- 主动测试降级实现（关键：降级代码必须是被执行过、被验证过的） ----

console.log('  直接调用降级实现，验证它们本身是正确的（无论本机是否支持原生）：');

const demoItems = [
  { name: 'apple', kind: 'fruit' },
  { name: 'carrot', kind: 'veg' },
  { name: 'banana', kind: 'fruit' },
];

console.log('  groupByFallback  ->', JSON.stringify(groupByFallback(demoItems, (x) => x.kind)));

const demoNums = [3, 1, 2];
const fallbackSorted = toSortedFallback(demoNums);
console.log('  toSortedFallback ->', JSON.stringify(fallbackSorted), '| 原数组未被修改：',
  JSON.stringify(demoNums));

await (async () => {
  const deferred = withResolversFallback();
  deferred.resolve('降级版 withResolvers 已 resolve');
  console.log('  withResolversFallback ->', await deferred.promise);
})();

console.log('  arrayAtFallback   -> at(-1) =', arrayAtFallback(demoNums, -1),
  '| at(-3) =', arrayAtFallback(demoNums, -3),
  '| at(99) =', arrayAtFallback(demoNums, 99));

console.log('  structuredCloneFallback（注意它丢了什么）->');
const cloneSource = { a: 1, b: undefined, when: new Date('2020-01-01'), fn: () => 1 };
console.log('    原对象 key：', Object.keys(cloneSource).join(', '));
console.log('    JSON 降级后：', JSON.stringify(structuredCloneFallback(cloneSource)));
console.log('    ^ undefined 和函数直接消失了，Date 变成了字符串 —— 这就是"语义漂移"。');

// ---------------------------------------------------------------------------
// 4. 渐进增强：统一接口 —— 有原生用原生，没有就用降级
// ---------------------------------------------------------------------------

console.log('--- 4. 渐进增强：统一接口（任何 Node 版本都能跑通） ---');

// 思路：把"用哪个实现"的决策收敛到一处，业务代码只调用这个统一接口。
// 这样业务逻辑里没有 if/else，也没有"某台机器能跑某台不能"的分裂。

// 这是**教学用**的写法（在每个调用点做检测）。
// 真实项目里更常见的做法是在入口处**一次性**装 polyfill，
// 之后业务代码直接调用，不必到处判断 —— 代价是污染全局。

const groupBy = support.objectGroupBy
  ? Object.groupBy // 原生可用：直接用。Object.groupBy 内部不使用 this，所以裸传是安全的
  : groupByFallback; // 降级：用自己的实现
// 对比：Object.groupBy 可以裸传，但 Promise.withResolvers 不行（见下），
// 因为前者不依赖 this、后者依赖。这个差别只能靠实测或查规范得知 ——
// 说明"特性可用"和"用对"是两件事。

const toSorted = support.arrayToSorted
  ? (arr, cmp) => arr.toSorted(cmp) // 原生版需要正确的 this（数组），所以用箭头函数包一层
  : toSortedFallback;

// 【这里有个真实的坑，本文件开发时就踩到了】不能写 `Promise.withResolvers`，
// 因为它是静态方法，内部会检查 `this` 是不是 Promise 构造函数；
// 直接把它赋给一个变量再调用（相当于解绑了 this）会抛
//   TypeError: Promise.withResolvers called on non-object
// 必须用箭头函数包一层，让调用时 `this` 仍然指向 Promise。
// （顺带说明：这就是"检测到了特性可用"之后，还得**用对**它。）
const withResolvers = support.promiseWithResolvers
  ? () => Promise.withResolvers()
  : withResolversFallback;

const at = support.arrayAt
  ? (arr, i) => arr.at(i) // 同样，包一层保证 this 正确
  : arrayAtFallback;

const clone = support.structuredClone
  ? (v) => structuredClone(v) // 全局函数，包一层是为了和统一接口签名一致
  : structuredCloneFallback;

// 打印每个特性这次实际走的是哪条路（原生 or 降级）
console.table([
  { 特性: 'Object.groupBy', 本次实际使用: support.objectGroupBy ? '原生' : '降级实现' },
  { 特性: 'Array.prototype.toSorted', 本次实际使用: support.arrayToSorted ? '原生' : '降级实现' },
  { 特性: 'Promise.withResolvers', 本次实际使用: support.promiseWithResolvers ? '原生' : '降级实现' },
  { 特性: 'Array.prototype.at', 本次实际使用: support.arrayAt ? '原生' : '降级实现' },
  { 特性: 'structuredClone', 本次实际使用: support.structuredClone ? '原生' : '降级实现' },
]);

// ---- 用统一接口写真正的业务逻辑（这段代码在任何 Node 版本上都能跑） ----

// (1) 分组：把商品按品类分组
const products = [
  { sku: 'A1', category: 'book', price: 30 },
  { sku: 'B2', category: 'food', price: 12 },
  { sku: 'C3', category: 'book', price: 55 },
  { sku: 'D4', category: 'food', price: 8 },
];
const byCategory = groupBy(products, (p) => p.category);
console.log('  groupBy 结果：');
console.log('    book ->', JSON.stringify(byCategory.book.map((p) => p.sku)));
console.log('    food ->', JSON.stringify(byCategory.food.map((p) => p.sku)));
// 这是"每个品类的总价"，写起来就是一次分组 + 一次求和
for (const [category, list] of Object.entries(byCategory)) {
  const total = list.reduce((sum, p) => sum + p.price, 0);
  console.log(`    ${category} 总价 = ${total}`);
}

// (2) 非破坏性排序：原数组必须保持不变（这是 toSorted 存在的全部意义）
const prices = [30, 12, 55, 8];
const sortedPrices = toSorted(prices, (a, b) => a - b);
console.log('  toSorted：原数组 =', JSON.stringify(prices),
  '| 排序后副本 =', JSON.stringify(sortedPrices),
  '| 原数组是否被改动 =', JSON.stringify(prices) !== JSON.stringify(sortedPrices) ? '否（正确）' : '是（错误）');

// (3) 延迟对象：把 resolve 拿到外面，常用于"手动控制异步流程"
//     例如把回调式 API 包装成 Promise，或者实现"等待某个事件"。
const gate = withResolvers();
// 注意这里用 queueMicrotask 只是为了演示"resolve 稍后才被调用"，逻辑上等价于
// 在某个事件到来时调用 gate.resolve(...)。它不访问外网、不依赖定时器。
queueMicrotask(() => {
  gate.resolve('异步流程已放行');
});
console.log('  withResolvers：', await gate.promise);
// 注意：Promise.withResolvers 的返回对象里 promise 就是那个 promise 本身，
// 拿到的 resolve/reject 是"外部遥控器"，这是它相对 new Promise 的唯一便利。

// (4) 负数下标：at 让"取最后一个元素"不必再写 arr[arr.length - 1]
const queue = ['first', 'second', 'last'];
console.log('  at：at(-1) =', at(queue, -1), '| at(0) =', at(queue, 0),
  '| at(99) =', at(queue, 99), '（越界得到 undefined）');

// (5) 深拷贝：structuredClone 支持循环引用、Date、Map、Set，JSON 往返都不支持
const nested = { id: 1, tags: new Set(['a', 'b']), meta: { createdAt: new Date('2024-05-01') } };
const cloned = clone(nested);
console.log('  深拷贝后 id =', cloned.id, '| tags 类型 =',
  cloned.tags instanceof Set ? 'Set（保住了）' : '其它（降级后丢了）',
  '| createdAt 类型 =', cloned.meta.createdAt instanceof Date ? 'Date（保住了）' : '其它（降级后丢了）');
console.log('  ^ 支持原生 structuredClone 的环境下会显示"保住了"；');
console.log('    走 JSON 降级的环境下会显示"丢了" —— 这就是降级带来的能力差异，必须提前知道。');

// 安全性提示：这里刻意**不做**任何"绕过限制"的操作，只用只读的方式观察结果。

// ---------------------------------------------------------------------------
// 5. 语法缺失无法用 polyfill 补救（只能转译）
// ---------------------------------------------------------------------------

console.log('--- 5. 语法 vs API：为什么 polyfill 救不了语法 ---');

// 特性检测能覆盖"API 存在与否"，但**覆盖不了语法**：
// 老引擎在看到 `a?.b` 的那一刻就解析失败了，整段脚本根本不会开始执行，
// 也就是说没有任何"运行时的机会"让你去补救。
// 演示方法：用动态解析把"可能会失败"的代码推迟到运行时，再用 try/catch 观察它。
// （直接写在源码里的话，本文件在旧引擎上会整个加载失败，连打印都做不了。）

// 用 Function 构造器动态编译一段使用了可选链的代码。
// 注意：在现代引擎里它能正常编译，所以这里演示的是"检测手段"本身。
function canParseSource(sourceText) {
  try {
    // new Function 只做"解析 + 编译"，不执行；解析失败会抛 SyntaxError
    new Function(sourceText);
    return true;
  } catch {
    // 语法错误在运行时是可以被 catch 的 —— 这是唯一能"探测语法"的办法
    return false;
  }
}

const syntaxChecks = [
  { name: '可选链 a?.b（ES2020）', src: 'return ({})?.b;' },
  { name: '空值合并 a ?? b（ES2020）', src: 'return 1 ?? 2;' },
  { name: '逻辑赋值 a ||= b（ES2021）', src: 'let a = 0; a ||= 1; return a;' },
  { name: '类私有字段 #x（ES2022）', src: 'class C { #x = 1; get v(){ return this.#x; } } return new C().v;' },
  { name: '类静态块 static {}（ES2022）', src: 'class C { static x = 0; static { C.x = 1; } } return C.x;' },
  {
    name: '故意写错的反例（用来证明检测真的有效）',
    src: 'return 1 +++ ;',
  },
];

console.table(
  syntaxChecks.map(({ name, src }) => ({
    语法特性: name,
    '本机能否解析（等价于"能不能用它"）': canParseSource(src) ? '能' : '不能',
  })),
);
console.log('  ^ 语法检测只能靠"试着解析"，而 API 检测可以靠 typeof —— 这是两类问题的本质差别。');
console.log('    结论：语法缺失 -> 转译（构建期改写成老语法）；API 缺失 -> polyfill（运行时补齐）。');
console.log('  注意上面这个检测手法的边界：new Function 里创建的是"普通函数体"，');
console.log('    所以像"顶层 await"这类只允许出现在模块顶层的语法，用这种办法检测不了；');
console.log('    它需要单独用 import() 动态加载一个 .mjs 文件来探测。');
console.log('    （本文件自己在模块顶层就用了 await —— 它在老引擎上同样会直接解析失败，');
console.log('      这也正说明：本仓库的示例默认运行在支持 ESM + 顶层 await 的 Node 18+ 上。）');

// ---------------------------------------------------------------------------
// 6. 决策清单（把方法论压缩成一张可以照着做的表）
// ---------------------------------------------------------------------------

console.log('--- 6. 决策清单 ---');
console.log('  第 1 步：这个特性是"语法"还是"API"？');
console.log('           语法 -> 只能靠构建期转译，检测手段是 try 解析。');
console.log('           API  -> 可以运行时检测 + polyfill。');
console.log('  第 2 步：用 typeof / in 做特性检测（放在**使用前**，不要靠版本号/UA）。');
console.log('  第 3 步：问"这个特性是核心功能还是增强体验？"');
console.log('           核心 -> 渐进增强：必须有可用的降级实现。');
console.log('           增强 -> 优雅降级：没有就跳过，不要为它引入 200KB 的 polyfill。');
console.log('  第 4 步：算成本。polyfill 的代价 = 体积 + 性能 + 语义漂移 + 全局污染。');
console.log('           成本 > 收益时，最专业的答案是"这次不用"。');
console.log('  第 5 步：把降级实现也纳入测试（本文件第 3 节就是干这个的），否则它是死代码。');
console.log('  第 6 步：工程配套：engines 只是建议，browserslist 决定转译目标，');
console.log('           caniuse / MDN 兼容表用来评估工程量。');

console.log('  以上演示全部执行完毕（本文件在任何 Node 版本上都会以退出码 0 结束）。');
