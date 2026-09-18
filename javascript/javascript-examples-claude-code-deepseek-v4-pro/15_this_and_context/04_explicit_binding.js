/**
 * ============================================================================
 * 知识点：显式绑定 —— call / apply / bind 与硬绑定
 * ============================================================================
 *
 * 【所属分类】15_this_and_context —— this 与执行上下文
 * 【难度等级】入门
 * 【前置知识】15_this_and_context/03_this_in_arrow.js
 *
 * 【也见】06_functions/07_call_apply_bind.js —— 同一批要点在「函数」章节里也完整讲了一遍。
 *        本文件是 this 绑定规则的主场（硬绑定是四条规则之一）；那篇是函数主线的主场，
 *        侧重借用方法与部分应用。两文互补。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    显式绑定指由调用者主动指定 this 的值，靠三个方法实现：
 *      - fn.call(thisArg, arg1, arg2, ...)：参数逐个传；
 *      - fn.apply(thisArg, [arg1, arg2, ...])：参数用数组（或类数组）传；
 *      - fn.bind(thisArg, arg1, ...)：**不立即调用**，返回一个绑定了 this 的新函数。
 *
 * 2. 为什么需要
 *    - 借用方法：让一个对象用另一个对象的方法（如数组方法作用于类数组）。
 *    - 修复回调里的 this 丢失：把 obj.method 传出去前先 bind(obj)。
 *    - 部分应用（偏函数）：bind 除了 this 还能预设一部分参数。
 *    - 手写实现工具函数：如 Function.prototype.bind 的 polyfill。
 *
 * 3. 核心语法要点
 *    - call 与 apply 的区别只有"参数怎么传"；现代代码里 apply 用得少，
 *      因为展开运算符可以替代：fn.apply(o, arr) 等价于 fn.call(o, ...arr)。
 *    - bind 返回的是**新函数**，可反复调用；原函数不受影响。
 *    - bind 的 thisArg 一旦绑定就**无法再被改变**，这叫"硬绑定"：
 *        const bound = fn.bind(a);
 *        bound.call(b);   // this 仍然是 a
 *        new bound();     // 见 05 节：new 优先级更高，this 仍是新实例
 *    - bind 也可以预设参数：fn.bind(null, 1)(2) → fn(1, 2)。
 *    - thisArg 传 null / undefined 时，严格模式下 this 就是 null / undefined，
 *      非严格模式下会被替换为全局对象。
 *    - bind 得到的函数没有 prototype 属性（不能当构造函数用，除非原函数可以）。
 *    - 箭头函数的 this 无法被 call/apply/bind 改变（见 03 节）。
 *
 * 4. 常见陷阱
 *    - 反复 bind：fn.bind(a).bind(b) 里第二次 bind 无效，this 仍是 a。
 *    - 忘记 bind 返回的是新函数：写了 fn.bind(obj) 却不接收返回值。
 *    - 用 bind 处理箭头函数，完全无效。
 *    - 把 null 当 thisArg 时误以为能报错（其实只会让 this 变成 undefined 或全局对象）。
 *    - bind 过的函数在事件监听器里无法用 removeEventListener 移除
 *      （每次 bind 都产生新函数），需要保存引用。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 15_this_and_context/04_explicit_binding.js
 *
 * 【预期输出】
 *   对比 call / apply / bind 的用法、参数传递形式、硬绑定效果与常见错误。
 * ============================================================================
 */

console.log('--- 1. call：立刻调用并指定 this ---');

function introduce(greeting, punctuation) {
  return `${greeting}，我是 ${this.name}${punctuation}`;
}

const alice = { name: 'Alice' };
const bob = { name: 'Bob' };

// call(thisArg, ...args)：参数逐个列出
console.log('introduce.call(alice, "你好", "。") =', introduce.call(alice, '你好', '。'));
console.log('introduce.call(bob, "Hi", "!") =', introduce.call(bob, 'Hi', '!'));

console.log('--- 2. apply：参数用数组传 ---');

// apply(thisArg, argsArray)
const args = ['早上好', '～'];
console.log('introduce.apply(alice, ["早上好", "～"]) =', introduce.apply(alice, args));

// 现代替代写法：用展开运算符 + call
console.log('introduce.call(alice, ...args) =', introduce.call(alice, ...args), '（等价写法）');

// apply 最经典的用途：把数组"摊开"传给需要多个参数的函数
const numbers = [5, 2, 9, 1, 7];
console.log('Math.max.apply(null, numbers) =', Math.max.apply(null, numbers));
console.log('Math.max(...numbers) =', Math.max(...numbers), '（现代写法）');

// apply 传 null 时，严格模式下 this 就是 null
function showThis() {
  return this;
}
console.log('在严格模式下 call(null) 的 this =', showThis.call(null), '（严格模式保留 null）');

console.log('--- 3. bind：返回新函数，不立即执行 ---');

// bind 不会调用原函数，只是"造"出一个新函数
const introduceAlice = introduce.bind(alice);
console.log('bind 的返回值类型 =', typeof introduceAlice);
console.log('introduceAlice("你好", "。") =', introduceAlice('你好', '。'));

// 原函数完全不受影响
console.log('原函数仍然可用：', introduce.call(bob, 'Hey', '.'));

// bind 也可以预设参数（偏函数 / 部分应用）
const greetAlice = introduce.bind(alice, '你好');
console.log('预设第一个参数后：', greetAlice('。'));
console.log('预设两个参数后：', introduce.bind(alice, '你好', '。')());

console.log('--- 4. 硬绑定：bind 之后的 this 无法再改 ---');

const boundToAlice = introduce.bind(alice);

// 用 call / apply 强行改 this —— 无效
console.log('bound.call(bob) 仍然指向 alice：', boundToAlice.call(bob, '你好', '。'));
console.log('bound.apply(bob, [...]) 也无效：', boundToAlice.apply(bob, ['你好', '。']));

// 再次 bind 也无效：第二次 bind 的 thisArg 被忽略
const doubleBound = boundToAlice.bind(bob);
console.log('二次 bind 后仍然指向 alice：', doubleBound('你好', '。'));

// 显式绑定优先级高于隐式绑定
const wrapped = { name: '包装对象', fn: boundToAlice };
console.log('即使挂到别的对象上调用：', wrapped.fn('你好', '。'));

console.log('--- 5. bind 与事件监听器的实际用法 ---');

// 模拟一个极简的事件系统，用来演示 bind 的经典场景
class MiniEmitter {
  #listeners = new Map();

  on(event, handler) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, []);
    this.#listeners.get(event).push(handler);
    return this;
  }

  off(event, handler) {
    const list = this.#listeners.get(event) ?? [];
    // 注意：必须传入与 on 时**完全相同**的函数引用，否则删不掉。
    // 这也是 bind 的坑：on 时用 bind 生成了新函数，off 时再 bind 一次就是另一个函数。
    const next = list.filter((h) => h !== handler);
    this.#listeners.set(event, next);
    return this;
  }

  emit(event, ...args) {
    const list = this.#listeners.get(event) ?? [];
    for (const handler of list) handler(...args);
    return this;
  }
}

class Panel {
  constructor(name) {
    this.name = name;
    this.clicks = 0;
    // 关键技巧：在构造函数里 bind 一次并保存引用，
    // 这样 on 和 off 用的是同一个函数，才能正确移除。
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.clicks += 1;
    return `${this.name} 被点击了 ${this.clicks} 次`;
  }
}

const emitter = new MiniEmitter();
const panel = new Panel('侧边栏');

emitter.on('click', panel.handleClick);
emitter.emit('click');
emitter.emit('click');
console.log('两次点击后 clicks =', panel.clicks);

// 直接传一个"没经过 bind"的方法引用会怎样？
const rawPanel = {
  name: '工具栏',
  clicks: 0,
  handleClick() {
    this.clicks += 1;
    return `${this.name} 被点击了 ${this.clicks} 次`;
  },
};
emitter.on('click', rawPanel.handleClick);
try {
  emitter.emit('click');
} catch (err) {
  // 回调被裸调用 → this 是 undefined → 访问 this.clicks 抛错
  console.log('未 bind 的方法报错：', err.constructor.name, '—', err.message);
}
// 正确做法：传出去之前先 bind
emitter.off('click', rawPanel.handleClick);
const boundRaw = rawPanel.handleClick.bind(rawPanel);
emitter.on('click', boundRaw);
emitter.emit('click');
console.log('bind 之后 clicks =', rawPanel.clicks);

// 也可以用 off 移除 —— 前提是传的是"同一个函数引用"
emitter.off('click', boundRaw);
emitter.emit('click');
console.log('移除监听后再次 emit，rawPanel.clicks 仍为：', rawPanel.clicks);
console.log('（此时只有 panel 那个绑定监听器还在工作，clicks =', panel.clicks, '）');

console.log('--- 6. 无 bind 也能"借用"：call/apply 的经典用途 ---');

// 把类数组对象（arguments / NodeList）转成真数组的老写法
function toArrayOld() {
  return Array.prototype.slice.call(arguments);
}
console.log('slice.call(arguments) =', JSON.stringify(toArrayOld(1, 2, 3)));

// 现代写法
function toArrayNew(...args) {
  return args;
}
console.log('现代 rest 参数写法 =', JSON.stringify(toArrayNew(1, 2, 3)));

// 判断类型时借 Object.prototype.toString
function typeOf(value) {
  return Object.prototype.toString.call(value).slice(8, -1);
}
for (const v of [null, undefined, [], {}, new Date(), /re/, 1, 'a']) {
  console.log(`  typeOf(${String(v).padStart(10)}) = ${typeOf(v)}`);
}

console.log('--- 7. 手写一个 bind 的简化实现 ---');

// 理解 bind 的最好方式是实现它。这里是简化版（不处理 new 的边界，见 05 节）。
Function.prototype.myBind = function myBind(thisArg, ...presetArgs) {
  // 保存原函数（this 就是被调用的那个函数）
  const original = this;
  // 返回一个新函数：调用时才真正执行原函数，并把 this 替换成 thisArg
  return function boundFn(...laterArgs) {
    return original.call(thisArg, ...presetArgs, ...laterArgs);
  };
};

const myIntroduce = introduce.myBind(bob, 'Hi');
console.log('myBind 的效果：', myIntroduce('~'));

console.log('--- 8. 常见错误（try/catch 演示） ---');

// 错误 1：忘记接收 bind 的返回值
const obj = { name: '目标' };
obj.getName = function getName() {
  return this.name;
};
// 下面这行"没用"：bind 造出的新函数被丢弃了
obj.getName.bind({ name: '错误目标' });
console.log('忘记接收返回值时仍然用 obj：', obj.getName());
console.log('正确写法：', obj.getName.bind({ name: '正确目标' })());

// 错误 2：对箭头函数 bind 无效
const arrow = () => (typeof this === 'undefined' ? '(仍是最外层 this)' : this);
console.log('给箭头函数 bind：', arrow.bind({ name: '无效' })(), '→ bind 完全不起作用');

// 错误 3：thisArg 为 null 时在严格模式下就是 null，访问属性会报错
function readName() {
  return this.name;
}
try {
  readName.call(null);
} catch (err) {
  console.log('call(null) 后访问属性报错：', err.constructor.name, '—', err.message);
}

console.log('--- 9. 三者对照表 ---');

const table = [
  ['call', '立即调用', '参数逐个传', 'fn.call(obj, a, b)'],
  ['apply', '立即调用', '参数用数组传', 'fn.apply(obj, [a, b])'],
  ['bind', '不调用，返回新函数', '可预设参数', 'const f = fn.bind(obj, a); f(b)'],
];
console.log('  方法    是否立即调用        参数形式       示例');
for (const [name, immediate, argStyle, example] of table) {
  console.log(`  ${name.padEnd(6)} ${immediate.padEnd(18)} ${argStyle.padEnd(14)} ${example}`);
}

console.log('\n全部演示完毕。');
