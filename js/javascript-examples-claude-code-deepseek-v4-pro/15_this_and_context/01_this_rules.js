/**
 * ============================================================================
 * 知识点：this 的默认绑定 —— 严格模式下是 undefined，非严格模式下是 globalThis
 * ============================================================================
 *
 * 【所属分类】15_this_and_context —— this 与执行上下文
 * 【难度等级】入门
 * 【前置知识】06_functions/01_declaration_vs_expression.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    this 是函数被调用时自动获得的一个"隐式参数"，它的值由**调用方式**决定，
 *    而不是由函数定义的位置决定（箭头函数除外，见 03 节）。
 *    "默认绑定"是四种绑定规则里最基础的一种：函数被当作普通函数直接调用时的绑定。
 *
 * 2. 为什么需要
 *    - 理解默认绑定是理解其它三种规则（隐式、显式、new）的基线。
 *    - 大量诡异 bug 都源于"函数被提取出来后 this 变了"，
 *      而提取后调用走的正是默认绑定。
 *
 * 3. 核心语法要点
 *    - 四种绑定规则（按优先级从低到高）：
 *        ① 默认绑定：独立调用 fn()；
 *        ② 隐式绑定：obj.fn()；
 *        ③ 显式绑定：fn.call(obj) / fn.apply(obj) / fn.bind(obj)；
 *        ④ new 绑定：new Fn()。
 *    - 默认绑定的结果取决于**函数体是否处于严格模式**：
 *        - 严格模式：this 为 undefined；
 *        - 非严格（sloppy）模式：this 为全局对象（浏览器里是 window，
 *          Node.js 的 CommonJS/脚本里是 global，跨环境统一用 globalThis）。
 *    - 严格模式由函数自身的 'use strict' 指令或所在环境决定：
 *        - ES 模块（.mjs / "type": "module" 的 .js）中所有代码始终是严格模式；
 *        - class 体内的代码始终是严格模式；
 *        - 用 new Function(...) 创建的函数体默认是**非严格**的（除非自己写 'use strict'）。
 *    - 所以在本仓库这类 ESM 示例中，直接 fn() 时 this 就是 undefined；
 *      要演示非严格模式，需要用 new Function 动态创建函数。
 *
 * 4. 常见陷阱
 *    - 误以为"this 指向函数自己"。不是，函数对象要用函数名引用。
 *    - 从旧资料抄来的例子假设 this 是 window，在现代模块化环境里会变成 undefined。
 *    - 在非严格模式下给 this 添加属性会污染全局对象（经典事故来源）。
 *    - 回调被"裸调用"时同样走默认绑定，this 丢失（见 07 节）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 15_this_and_context/01_this_rules.js
 *
 * 【预期输出】
 *   对比严格模式与非严格模式下普通函数调用的 this，并演示全局污染。
 * ============================================================================
 */

console.log('--- 1. 本文件是 ESM，所以所有代码都在严格模式下 ---');

// 严格模式下，独立调用函数时 this 是 undefined。
function strictCall() {
  return this;
}
console.log('严格模式：strictCall() 的 this =', strictCall());

// 用 typeof 检查比直接打印更安全（打印 undefined 看不出区别）
console.log('typeof this =', typeof strictCall(), '（说明是 undefined，不是全局对象）');

// 对比：模块顶层的 this 也是 undefined！
// 这是 ESM 与 CommonJS 的一个重要差别：
//   - CommonJS 模块顶层 this === module.exports
//   - ESM 模块顶层 this === undefined
console.log('模块顶层的 this =', typeof this === 'undefined' ? 'undefined' : this);

console.log('--- 2. 非严格模式下的默认绑定：this 是全局对象 ---');

// 用 Function 构造函数创建的函数，其函数体默认是"非严格模式"。
// 这让我们能在 ESM 里演示老式脚本的行为。
const sloppyFn = new Function('return this;');
const sloppyThis = sloppyFn();
console.log('非严格模式：this === globalThis ？', sloppyThis === globalThis);
console.log('它的类型 =', typeof sloppyThis);
if (typeof sloppyThis === 'object' && sloppyThis !== null) {
  // 在 Node 里这个对象有一些可辨识的属性
  console.log('能读到全局的 process 吗？', typeof sloppyThis.process);
  console.log('能读到全局的 console 吗？', typeof sloppyThis.console);
}

// 函数体里显式写 'use strict' 后，行为立刻变回严格模式
const explicitStrictFn = new Function("'use strict'; return this;");
console.log("加了 'use strict' 之后：", explicitStrictFn());

console.log('--- 3. 严格模式标志写在函数内部与外部的区别 ---');

function outerStrictSignature() {
  // 这个函数在 ESM 里本来就是严格的
  function inner() {
    return this;
  }
  return inner();
}
console.log('嵌套函数仍然严格：', outerStrictSignature());

// 用 new Function 造一个非严格的外层，再在内部定义一个普通函数
const sloppyNested = new Function(`
  function inner() { return this; }
  return inner();
`);
console.log('非严格外层里的内层函数：this === globalThis ？', sloppyNested() === globalThis);

console.log('--- 4. 全局污染：非严格模式下的经典事故 ---');

// 真正危险的用法是"往 this 上写东西"。
// 在严格模式下会抛 TypeError；在非严格模式下会悄悄写到全局对象上。
function dangerousGood() {
  this.leaked = '被漏到全局的值';
}
const dangerousBad = new Function('this.leaked = "被漏到全局的值";');

// 严格模式：this 是 undefined，写属性直接报错
try {
  dangerousGood();
} catch (err) {
  console.log('严格模式下写 this 属性报错：', err.constructor.name, '—', err.message);
}

console.log('全局上有 leaked 吗（严格模式尝试之后）？', 'leaked' in globalThis);

// 非严格模式：静默写到 globalthis 上
dangerousBad();
console.log('非严格模式下成功写入了吗？', 'leaked' in globalThis);
console.log('全局上的 leaked 值 =', globalThis.leaked);

// 清理掉这个"污染"，避免影响其它演示
delete globalThis.leaked;
console.log('清理后还有吗？', 'leaked' in globalThis);

console.log('--- 5. 谁决定严格模式：类体与模块 ---');

// class 体内的代码无条件严格，即使外层是非严格环境。
const makeClassFn = new Function(`
  class Probe {
    constructor() { this.tag = 'class'; }
    show() { return this; }
  }
  const p = new Probe();
  return p.show();
`);
const probeInstance = makeClassFn();
console.log('类方法里的 this 是实例吗？', probeInstance.tag === 'class');
console.log('类方法里的 this 是全局对象吗？', probeInstance === globalThis);

console.log('--- 6. 默认绑定的 this 与"函数自身"无关 ---');

function notSelf() {
  // 想引用函数自己，得用函数名，不能用 this
  return {
    isThisTheFunction: this === notSelf,
    isThisUndefined: this === undefined,
  };
}
console.log('this === 函数自己 ？', notSelf().isThisTheFunction);
console.log('this === undefined ？', notSelf().isThisUndefined);

console.log('--- 7. 现实建议 ---');

const tips = [
  '永远不要依赖非严格模式的默认绑定，那是历史包袱。',
  '所有新代码用 ESM / class / strict 模式，让 this 错误尽早暴露。',
  '需要"全局对象"时显式写 globalThis，语义清晰且跨环境一致。',
  '回调函数里需要外层 this 时，用箭头函数或 bind（下一节开始逐一讲解）。',
];
for (const tip of tips) console.log('  •', tip);

console.log('\n全部演示完毕。');
