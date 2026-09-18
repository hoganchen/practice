/**
 * ============================================================================
 * 知识点：模块模式 —— IIFE + 闭包实现私有成员
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】06_functions（函数与作用域）、14_classes/05_private_fields.js（# 私有字段）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    模块模式（Module Pattern）是 ES6 模块出现之前，JavaScript 社区用来实现
 *    "一个文件只暴露该暴露的东西、其余全部藏起来"的标准手法。它的公式只有一行：
 *
 *        var 模块名 = (function () { 私有代码…; return { 公开 API }; })();
 *
 *    拆开看就是三件事的叠加：
 *      (a) 立即调用函数表达式 IIFE —— 造一个"一次性"的函数作用域；
 *      (b) 闭包 —— 内部函数记住了 IIFE 作用域里的变量，函数返回后这些变量依然活着；
 *      (c) 返回一个对象字面量 —— 只有被返回的东西才对外可见，这就是"公共 API"。
 *    把 (c) 的形式改成"先在内部定义好所有函数，最后统一 return 这些函数的引用"，
 *    就是"揭示模块模式"（Revealing Module Pattern）。
 *
 * 2. 为什么需要（真实项目场景）
 *    在 2015 年之前，浏览器里加载多个 <script> 标签，所有顶层 var / function 声明
 *    都挂在同一个全局对象（window）上，于是带来两个灾难：
 *      - 全局变量污染：任何一段代码都可能覆盖别人的变量，比如两个库都定义了 $。
 *      - 命名冲突 / 依赖顺序敏感：A.js 必须在 B.js 之前加载，否则 B 里读到的
 *        是 undefined，而且报错信息通常出现在"使用处"而不是"加载处"，极难排查。
 *    模块模式让每个模块把自己的变量关进 IIFE 的私有作用域，只把一个命名空间对象
 *    挂到全局上（早期常写成 window.MyApp = {...}），冲突面从"每个变量"缩小到
 *    "每个模块一个名字"，这就是 jQuery、Backbone、Underscore 那个时代的写法。
 *
 * 3. 核心语法要点
 *    - IIFE 的两种等价写法：(function(){...})() 与 (function(){...}());，
 *      外层括号的作用是把 function 关键字变成"函数表达式"，否则解析器会把它当
 *      "函数声明"，而函数声明后面直接跟 () 是语法错误。
 *    - 用一元运算符也能强制变成表达式：!function(){...}()、void function(){...}()。
 *    - 传参给 IIFE：把全局对象、jQuery 等作为参数传进去（依赖显式化），
 *      这既是"依赖注入"的雏形，也让压缩工具能安全地把参数名压成一个字母。
 *    - 揭示模块模式：先在闭包里用普通变量/函数写实现，最后 return 一个对象把它们
 *      暴露出去，好处是"实现和导出在同一处对照着看"，而且可以随时改变暴露的粒度。
 *    - 现代替代品：ESM 的 import/export，以及类里的 #privateField（语言级私有）。
 *
 * 4. 常见陷阱
 *    - 忘记 return：模块变成"只执行一次然后什么都不留下"，外部拿到的永远是 undefined。
 *    - 用箭头函数写 IIFE 时忽略 this：箭头函数没有自己的 this，在需要注入 this 的场景会踩坑。
 *    - 在 IIFE 里 return 一个"内部函数"时没有绑定 this，之后被解构出来调用会丢失上下文。
 *    - 把可变对象直接 return 出去：外部能改内部状态，私有性被破坏（要返回副本或用 getter）。
 *    - 误以为模块模式能解决"重复加载"：它只解决命名冲突，不解决按需加载（那是 ESM 的动态 import）。
 *    - 一个 IIFE 里塞几千行：模块边界形同虚设，应该拆成多个模块再组合。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/01_module_pattern.js
 *
 * 【预期输出】
 *   先演示没有模块模式时的全局污染，再拆解 IIFE，然后给出经典模块模式、
 *   揭示模块模式、依赖注入式模块三个完整实现，最后对比 ESM 与 #私有字段。
 * ============================================================================
 */

// ===========================================================================
// 1. 时代背景：没有模块模式时会发生什么
// ===========================================================================

console.log('--- 1. 时代背景：全局污染与命名冲突 ---');

// 在浏览器里，下面这种写法会让 counter 直接挂到 window 上。
// 在 Node 的 ESM 里没有 window，我们用 globalThis 模拟"共享的全局作用域"。
// 注意：这里只做演示，演示完立刻清理，避免污染本文件后续代码。
globalThis.counter = 0; // A.js：某个统计脚本
globalThis.counter = 100; // B.js：另一个脚本，把 A 的变量覆盖了
console.log('两个脚本都叫 counter，后加载的覆盖前一个：', globalThis.counter);

// 这就是"全局命名冲突"的最小复现：没有报错，只是静默地错。
// 传统的补救办法：约定一个命名空间，把所有东西挂到它下面。
globalThis.MyApp = globalThis.MyApp || {}; // 不存在就创建，存在就复用
globalThis.MyApp.counter = 0;
globalThis.MyApp.format = (n) => `#${n}`;
console.log('命名空间折中方案：', globalThis.MyApp.format(globalThis.MyApp.counter));

// 用完清理，不影响后续小节
delete globalThis.counter;
delete globalThis.MyApp;

// ===========================================================================
// 2. IIFE 语法拆解：为什么外面那对括号是必须的
// ===========================================================================

console.log('\n--- 2. IIFE 语法拆解 ---');

// 函数声明（Function Declaration）：以 function 开头，必须带名字。
function namedDecl() {
  return '我是一条函数声明';
}
console.log('函数声明：', namedDecl());

// 如果直接写 function () {}()，解析器看到行首是 function 就按"函数声明"解析，
// 而函数声明必须带名字，于是报 SyntaxError。下面用 try/catch 演示（不会抛到顶层）。
try {
  // 使用 new Function 来构造这段非法代码，从而在不影响本文件解析的前提下观察报错
  // eslint-disable-next-line no-new-func
  new Function('function () {}()');
  console.log('（本不该执行到这里）');
} catch (err) {
  console.log('裸写 function(){}() 的报错：', err.name, '-', err.message);
}

// 加上外层括号后，function 处在"表达式位置"，解析器就把它当函数表达式，可以立刻调用。
const iifeResult = (function () {
  return '我是 IIFE，定义完立刻被执行';
})();
console.log('IIFE 的返回值被赋给变量：', iifeResult);

// 两种等价写法：外层括号包住整体，或者包住函数部分
console.log('写法 A（包整体）：', (function () { return 'A'; })());
console.log('写法 B（包函数）：', (function () { return 'B'; }()));

// 一元运算符强制表达式化，社区里也能见到
console.log('前置 ! 写法：', !(function () { return false; })());

// IIFE 传参：把外部依赖作为参数传进去（依赖显式化的雏形）
const withDeps = (function (global, name) {
  // 参数 global / name 是 IIFE 内的局部变量，外部同名变量再多也不冲突
  return `${name} 运行在 ${typeof global.setTimeout === 'function' ? '有定时器的环境' : '未知环境'}`;
})(globalThis, 'dependency-injection');
console.log('带参数的 IIFE：', withDeps);

// ===========================================================================
// 3. 经典模块模式：闭包形成私有成员
// ===========================================================================

console.log('\n--- 3. 经典模块模式（IIFE + 闭包） ---');

/**
 * 一个"购物车"模块。
 * 关键点：`items` 和 `total` 定义在 IIFE 的作用域里，外部任何代码都无法直接访问，
 * 但它们不会被垃圾回收 —— 因为 return 出去的方法形成了闭包，一直引用着它们。
 */
const ShoppingCart = (function () {
  // ---- 私有状态：外部不可见 ----
  let items = []; // 只在本 IIFE 内部可见
  let total = 0;

  // ---- 私有函数：同样是外部不可见的实现细节 ----
  function recalc() {
    // 每次改动后统一重算，保证 total 永远和 items 一致（单一数据来源）
    total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  }

  // ---- 公共 API：只有这里列出的东西才对外可见 ----
  return {
    add(name, price, qty = 1) {
      items.push({ name, price, qty });
      recalc();
      // 返回 this 以便链式调用（这个 return 的是外部对象本身）
      return this;
    },
    remove(name) {
      items = items.filter((it) => it.name !== name);
      recalc();
      return this;
    },
    get total() {
      return Number(total.toFixed(2));
    },
    get count() {
      // 只返回数字，不返回内部数组的引用
      return items.length;
    },
    // 需要给外部看列表时，返回"副本"，而不是内部数组本身，
    // 否则外部 push 一下就绕过了 recalc()，破坏了一致性。
    list() {
      return items.map((it) => ({ ...it }));
    },
  };
})();

ShoppingCart.add('键盘', 199).add('鼠标', 89, 2);
console.log('购物车条目数：', ShoppingCart.count);
console.log('总价（getter 计算）：', ShoppingCart.total);
console.log('列表副本：', ShoppingCart.list());

// 尝试从外部访问私有变量：拿不到，只得到 undefined
console.log('外部读 ShoppingCart.items =', ShoppingCart.items);
console.log('外部读 ShoppingCart.total =', ShoppingCart.total, '（这个 total 是 getter）');

// 尝试改写内部列表：改不到，因为 list() 返回的是副本
const snapshot = ShoppingCart.list();
snapshot.push({ name: '黑客注入的条目', price: 0, qty: 99 });
console.log('改副本之后，真实条目数仍是：', ShoppingCart.count);

// ===========================================================================
// 4. 揭示模块模式（Revealing Module Pattern）
// ===========================================================================

console.log('\n--- 4. 揭示模块模式 ---');

/**
 * 揭示模块模式：是经典模块模式的一种"写法整理"。
 * 区别只有一点：所有函数都先在闭包里用普通声明写好（能互相直接按名字调用），
 * 最后在 return 里"揭示"哪些对外公开，甚至可以对同一个实现起不同的公开名。
 * 好处：实现与导出对照清晰，改公开/私有只需增删 return 里的一行。
 */
const Temperature = (function () {
  // 私有常量
  const ABSOLUTE_ZERO_C = -273.15;

  // 私有函数之间可以互相按名字调用，不需要 this，也不会被解构破坏
  function assertValid(c) {
    if (typeof c !== 'number' || Number.isNaN(c)) {
      throw new TypeError('温度必须是数字');
    }
    if (c < ABSOLUTE_ZERO_C) {
      throw new RangeError(`温度不能低于绝对零度（${ABSOLUTE_ZERO_C}°C）`);
    }
  }

  function toCelsius(value, unit) {
    return unit === 'F' ? ((value - 32) * 5) / 9 : value;
  }

  function toFahrenheit(c) {
    return (c * 9) / 5 + 32;
  }

  // 内部工作函数（不打算暴露，但揭示模块模式允许你随时把它加进 return）
  function describe(c) {
    return c < 0 ? `${c.toFixed(1)}°C（冰点以下）` : `${c.toFixed(1)}°C`;
  }

  // ---- 揭示：决定哪些名字对外可见 ----
  return {
    // 把内部函数换个更好听的公开名（这也叫"重命名揭示"）
    toF: toFahrenheit,
    describe,
    from(unit) {
      return {
        value: 0,
        toCelsius() {
          return toCelsius(this.value, unit);
        },
      };
    },
    // 公开入口：内部做了完整的合法性校验
    create(value, unit = 'C') {
      const c = toCelsius(value, unit);
      assertValid(c);
      return { celsius: c, fahrenheit: toFahrenheit(c), text: describe(c) };
    },
    // 把内部函数"包装"后暴露，顺手改掉它的异常类型（演示揭示的灵活性）
    parse(text) {
      const num = Number.parseFloat(text);
      if (Number.isNaN(num)) throw new TypeError(`无法解析温度：${text}`);
      return num;
    },
  };
})();

console.log('25°C 转华氏：', Temperature.toF(25));
console.log('由华氏构造：', Temperature.create(212, 'F'));
console.log('由摄氏构造：', Temperature.create(-10, 'C'));

// 演示内部校验：抛出异常被我们在这里 catch，不会让进程非零退出
try {
  Temperature.create(-300, 'C');
} catch (err) {
  console.log('低于绝对零度被拦下：', err.name, '-', err.message);
}

// 私有函数 assertValid 并没有被揭示，外部拿不到
console.log('外部读 Temperature.assertValid =', Temperature.assertValid);

// ===========================================================================
// 5. 依赖注入式模块（IIFE 传参的实战用法）
// ===========================================================================

console.log('\n--- 5. 依赖注入式模块 ---');

/**
 * 把依赖作为 IIFE 的参数传入，是模块模式在大型项目里的标准形态。
 * 好处有三：
 *   1) 依赖"写在开头"，一眼能看出这个模块依赖谁（可读性）；
 *   2) 传进来的参数是局部变量，压缩工具可以安全地把它压成一个字母（体积）；
 *   3) 测试时可以换一个假实现传进去（可测性）—— 这就是后来 DI 容器的思想源头。
 */
const Logger = (function (consoleRef, prefix) {
  let seq = 0; // 私有：调用序号

  function stamp() {
    seq += 1;
    // padStart 让序号对齐，输出好看一些
    return `[${String(seq).padStart(2, '0')}]`;
  }

  return {
    info: (msg) => consoleRef.log(`${prefix} ${stamp()} ${msg}`),
    warn: (msg) => consoleRef.log(`${prefix} ${stamp()} ⚠ ${msg}`),
  };
  // 注意：这里用箭头函数，是因为箭头函数不绑定 this，
  // 而本模块的公开方法不依赖 this，所以可以安全地被解构出来单独调用。
})(console, '[APP]');

Logger.info('依赖注入式模块初始化完成');
Logger.warn('这是被注入进来的 console 在输出');
const { info } = Logger; // 解构出来单独调用也不会丢失上下文（因为不是 this.xxx）
info('解构后依然可用，说明没有隐式依赖 this');

// ===========================================================================
// 6. 代价与边界：模块模式的三大成本
// ===========================================================================

console.log('\n--- 6. 代价：模块模式的三大成本 ---');

console.log(`[成本 1] 无法 tree-shaking：
    模块模式对外是一个"运行时构造出来的对象"，打包工具在静态分析阶段
    看不到它到底用了哪些成员，只能整个保留。而 ESM 的 export 是静态声明，
    没用到的导出可以在打包时被删除（tree-shaking）。`);

console.log(`[成本 2] 依赖顺序敏感：
    <script src="a.js"> 必须排在 b.js 之前，因为 a.js 执行时就要把
    全局对象准备好。ESM 的 import 由引擎负责依赖图与加载顺序，
    循环依赖也有明确的处理规则，不需要人肉排顺序。`);

console.log(`[成本 3] 每个模块一个 IIFE：
    每个模块都多一层函数调用与一层作用域，调试时调用栈里多一层匿名帧，
    堆栈信息可读性下降；同时它天然是"单例"的 —— 想造第二个实例很别扭
    （要么把 IIFE 改成"工厂函数返回闭包"，要么改用 class）。`);

// ===========================================================================
// 7. 现代对比：ESM 的 import/export 与 # 私有字段
// ===========================================================================

console.log('\n--- 7. 现代对比：ESM 与 # 私有字段 ---');

// ESM 是语言级模块系统：顶层变量天然是模块私有的，
// 只有被 export 的才对外可见 —— 这正好覆盖了模块模式的核心诉求。
const modulePrivate = '我相当于 IIFE 里的私有变量';
export const modulePublic = '我是被 export 出去的，外部可以 import 我';
export function moduleHelper() {
  // 注意：这个函数能读到 modulePrivate，外部却读不到，效果等同闭包
  return `ESM 也能形成私有作用域：${modulePrivate}`;
}
console.log(moduleHelper());

// 类里的 # 私有字段：语言级私有，比闭包更"硬"
class Counter {
  #count = 0; // 真私有：外部访问是语法错误，不是 undefined

  increment() {
    this.#count += 1;
    return this;
  }

  get value() {
    return this.#count;
  }
}

const c = new Counter();
c.increment().increment();
console.log('class + # 私有字段：', c.value);
console.log('外部读 c.#count 是语法错误，读 c.count 得到：', c.count);

// 三种私有化手段的对照表（用对齐的表格打印）
// 注意：中日韩字符在等宽字体里占 2 个字符宽，所以要按"显示宽度"补空格，
// 否则中英混排的表格一定会歪。下面这个 displayWidth 是后续多个文件复用的技巧。
const displayWidth = (s) =>
  [...String(s)].reduce((w, ch) => w + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1), 0);

const rows = [
  ['手段', '私有强度', '多实例', 'tree-shaking'],
  ['IIFE 模块模式', '闭包级（外部读不到）', '否（天然单例）', '不支持'],
  ['ESM 模块作用域', '模块级（语言保证）', '否（天然单例）', '支持'],
  ['class + #私有字段', '类级（语言保证）', '可以', '支持'],
];
const widths = [0, 1, 2, 3].map((i) => Math.max(...rows.map((r) => displayWidth(r[i]))));
const pad = (s, w) => String(s) + ' '.repeat(Math.max(0, w - displayWidth(s)) + 2);
for (const [idx, row] of rows.entries()) {
  console.log(row.map((cell, i) => pad(cell, widths[i])).join(''));
  if (idx === 0) console.log('-'.repeat(widths.reduce((a, w) => a + w + 2, 0)));
}

// ===========================================================================
// 8. 什么时候不该用模块模式
// ===========================================================================

console.log('\n--- 8. 什么时候不该用模块模式 ---');

console.log(`不该用的信号：
  1) 项目已经用打包器 + ESM：再写 IIFE 只会让静态分析失效，
     打包体积变大、IDE 跳转失效、类型推导变差。新代码请直接用 export。
  2) 需要多个实例：模块模式是天然单例。要造 N 个购物车时，
     正确做法是 class，或者写成工厂函数 (function makeCart(){ ... return {...} })()。
  3) 只有一两个工具函数：包一层 IIFE 属于过度设计，
     一个 export function 就够了，别为了"像模块"而模块。
  4) 需要类型检查：TS 对 IIFE 返回的对象能推导，但跨模块的
     依赖关系、循环引用分析远不如 ESM 清晰。

一句话总结：模块模式解决的是"没有模块系统时如何假装有模块"，
而今天我们已经真的有模块系统了。它的价值在于"读懂老代码，
以及理解闭包如何制造私有作用域"这一课。`);

console.log('\n全部演示完毕。');
