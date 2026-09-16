/**
 * ============================================================================
 * 知识点：闭包基础 —— 定义、形成条件、最简单的例子
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】进阶
 * 【前置知识】07_scope_and_closure/05_lexical_vs_dynamic_scope.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    闭包（closure）是"函数 + 它定义时所处的那份作用域"的组合。
 *    通俗地说：一个函数"记住"了它被定义时所在的环境，即使外层函数已经返回、
 *    外层作用域本该消失，它依然能读写那些变量。
 *    闭包不是 JS 独有的语法，而是"词法作用域 + 函数是一等公民"的自然结果：
 *    只要有嵌套函数，就有闭包。
 *
 * 2. 为什么需要
 *    闭包解决了两个核心问题：
 *      (1) 状态私有化：状态藏在函数里，外部只能通过函数读写，无法直接篡改；
 *      (2) 状态持久化：让局部变量"活过"外层函数的返回，实现计数器、缓存、
 *          配置固化、模块模式、防抖节流等大量实用功能。
 *    可以说：JS 里的"对象封装"用 class，而"数据 + 行为"的轻量封装用闭包。
 *
 * 3. 核心语法要点 —— 形成闭包需要同时满足三个条件
 *    ① 存在函数嵌套（内层函数定义在外层函数内部）；
 *    ② 内层函数引用了外层函数的变量；
 *    ③ 内层函数"逃逸"到外层函数之外（被返回、被赋值给外部变量、被当作回调注册等）。
 *    三条缺一不可：只有嵌套没有逃逸，外层返回时内层也就没人用了，引擎可以直接回收。
 *    (1) 闭包保存的是"变量本身"，不是"变量的值快照" —— 所以外层后续改动会体现在闭包里。
 *    (2) 每次调用外层函数，都会创建一套全新的外层变量，因此产生互相独立的闭包。
 *    (3) 闭包会阻止相关变量被垃圾回收（好处是状态持久，坏处是可能内存泄漏）。
 *
 * 4. 常见陷阱
 *    - 以为闭包捕获的是"当时的值"（其实是变量本身，见本文第 5 节）。
 *    - 在循环里创建闭包，全部共享同一个变量（var 陷阱）。
 *    - 误以为"函数返回了，里面的变量就没了"。
 *    - 为了用闭包而滥用闭包，导致代码难以阅读；能用参数传值就别依赖闭包。
 *
 * 【运行方法】
 *   node 07_scope_and_closure/06_closure_basics.js
 *
 * 【预期输出】
 *   从最简例子开始，逐条验证闭包的三个形成条件，演示闭包读写外层变量、
 *   每次调用产生独立闭包，以及"闭包捕获的是变量而不是值"这一关键结论。
 * ============================================================================
 */

console.log('--- 1. 最简单的闭包 ---');

function outer() {
  // outerVar 是 outer 的局部变量，按 02 号示例的结论，outer 返回后它就该消失了。
  const outerVar = 'outer 的局部变量';

  // 内层函数引用了 outerVar。
  function inner() {
    return `我读到了：${outerVar}`;
  }

  // 把 inner 返回出去 —— 这就是第 ③ 个条件：逃逸。
  return inner;
}

const gotInner = outer(); // outer 已经执行完毕并返回了
console.log('  outer() 的返回值类型 →', typeof gotInner);
console.log('  调用它 →', gotInner());
console.log('  结论：outer 早就执行完了，但 gotInner 依然能读到 outerVar —— 这就是闭包。');
console.log('        原因：outerVar 被 inner 引用着，引擎不能回收它，所以它活了下来。');

console.log('--- 2. 逐条验证闭包的三个形成条件 ---');

// 条件 ③ 缺失：内层函数没有逃逸 —— 外层返回后，闭包也就没有存在的意义了。
function noEscape() {
  const temp = '只在内层用一下';
  function innerOnly() {
    return temp.length;
  }
  // 只在这里用掉，没有返回出去、没有赋给外部变量、没有注册为回调。
  return innerOnly();
}
console.log('  缺少"逃逸"时 →', noEscape(), '（能算出结果，但这个闭包随即失去引用，可以被回收）');

// 条件 ② 缺失：内层函数没有引用外层变量 —— 那它就没什么可"记住"的。
function noReference() {
  const unused = '没人引用我';
  return function () {
    return '我没有引用任何外层变量';
  };
}
const freeFn = noReference();
console.log('  缺少"引用"时 →', freeFn(), '（技术上返回了函数，但没有任何变量需要被闭包保存）');

// 条件 ① 缺失：没有嵌套 —— 模块顶层定义的函数，作用域链上就是模块作用域。
function flat() {
  return '我定义在模块顶层，我的外层就是模块作用域，这不是闭包';
}
console.log('  缺少"嵌套"时 →', flat());
console.log('  三条齐备才是真正有意义的闭包：嵌套 + 引用外层变量 + 逃逸出去。');

console.log('--- 3. 闭包可以读写外层变量（不只是读）---');

function createBox() {
  let content = '初始内容';

  return {
    // 读
    get: () => content,
    // 写
    set: (value) => {
      content = value;
      return `已更新为：${content}`;
    },
    // 改（基于当前值）
    append: (suffix) => {
      content += suffix;
      return content;
    },
  };
}

const box = createBox();
console.log('  初始读取 →', box.get());
console.log('  写入     →', box.set('新内容'));
console.log('  写入后再读 →', box.get());
console.log('  追加     →', box.append(' + 追加的部分'));
console.log('  最终读取 →', box.get());
console.log('  直接在外部访问 content →', typeof content, '（拿不到，只能通过闭包提供的方法）');
console.log('  这就是闭包最核心的价值：状态私有 + 受控访问。');

console.log('--- 4. 每次调用外层函数，都会产生一套独立的闭包 ---');

function makeCounter() {
  // 每次调用 makeCounter 都会重新执行这一行，创建一份新的 count。
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}

const counterA = makeCounter();
const counterB = makeCounter();
console.log('  counterA() →', counterA());
console.log('  counterA() →', counterA());
console.log('  counterB() →', counterB(), '  ← 从 1 开始，说明两套闭包互不干扰');
console.log('  counterA() →', counterA());
console.log('  counterB() →', counterB());
console.log('  结论：闭包的"状态"属于某一次调用，而不是属于函数本身 —— 天然支持多实例。');

console.log('--- 5. 关键结论：闭包捕获的是"变量"，不是"值的快照" ---');

function captureWhat() {
  let value = '第一次赋值';

  const read = () => value;

  // 在返回之前先改掉 value。
  value = '在返回前被改成了第二次赋值';

  return read;
}
const readValue = captureWhat();
console.log('  ', readValue());
console.log('  ↑ 如果是"值快照"，这里应该输出「第一次赋值」；实际输出的是最后的值。');
console.log('    所以闭包保存的是"变量本身"，函数执行时读到的永远是该变量的当前值。');

// 利用这个特性（而不是踩坑），可以做成"可外部更新的状态"。
function createUpdatable() {
  let state = 0;
  const read = () => `当前 state = ${state}`;
  const bump = () => {
    state += 10;
  };
  return { read, bump };
}
const updatable = createUpdatable();
console.log('  ', updatable.read());
updatable.bump();
console.log('  ', updatable.read(), '  ← 闭包读到了最新的值');

console.log('--- 6. 闭包最常见的实用形态：把参数"固化"进函数 ---');

function makeGreeter(greeting) {
  // greeting 是外层函数的形参，也属于外层作用域，同样可以被闭包捕获。
  return function (name) {
    return `${greeting}，${name}！`;
  };
}
const sayHello = makeGreeter('你好');
const sayHi = makeGreeter('Hi');
console.log('  sayHello("小明")  →', sayHello('小明'));
console.log('  sayHi("Alice")    →', sayHi('Alice'));
console.log('  两个函数共用一个模板，各自的 greeting 被闭包固定住了。');

console.log('--- 7. 闭包与"函数工厂"：批量制造同族函数 ---');

function makeMultiplier(factor) {
  return (x) => x * factor;
}
const calculators = {
  翻倍: makeMultiplier(2),
  十倍: makeMultiplier(10),
  平方: makeMultiplier(1), // 占位，下面换成真正的平方
};
calculators.平方 = (x) => x * x;
for (const [name, fn] of Object.entries(calculators)) {
  console.log(`  ${name}(7) = ${fn(7)}`);
}

console.log('--- 8. 闭包的一个"看不见"的表现：回调也是闭包 ---');

function registerHandlers() {
  const results = [];
  // 这个箭头函数引用了外层的 results，它注册到数组里就"逃逸"了。
  const handler = (value) => {
    results.push(value * 2);
  };
  // 模拟事件触发：注册后由别人来调用。
  [1, 2, 3].forEach((v) => handler(v));
  return results;
}
console.log('  handler 处理结果 →', registerHandlers(), '（handler 闭包持有 results）');

// 也可以用一个普通的"事件总线"演示：回调注册时形成闭包，触发时才执行。
function createBus() {
  const handlers = [];
  return {
    on(fn) {
      handlers.push(fn);
      return `已注册第 ${handlers.length} 个处理器`;
    },
    emit(value) {
      return handlers.map((fn) => fn(value));
    },
  };
}
const bus = createBus();
const prefix = '事件：';
console.log(' ', bus.on((v) => `${prefix}收到 ${v}`));
console.log(' ', bus.on((v) => `长度是 ${String(v).length}`));
console.log('  触发 →', bus.emit('hello'));

console.log('--- 9. 闭包定义速查 ---');
const checklist = [
  ['① 嵌套', '内层函数定义在外层函数内部'],
  ['② 引用', '内层函数用到了外层函数的变量'],
  ['③ 逃逸', '内层函数被返回 / 赋给外部变量 / 注册为回调'],
  ['捕获内容', '变量本身（引用），不是当时的值的副本'],
  ['独立实例', '每次调用外层函数都产生一套全新的闭包'],
  ['代价', '被捕获的变量不会被回收，直到闭包本身失去引用'],
];
for (const [key, detail] of checklist) {
  console.log(`  ${key}：${detail}`);
}
