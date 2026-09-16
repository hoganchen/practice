/**
 * ============================================================================
 * 知识点：call / apply / bind —— 显式绑定 this 与部分应用
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】进阶
 * 【前置知识】06_functions/05_arrow_vs_regular.js
 *
 * 【也见】15_this_and_context/04_explicit_binding.js —— 同一批要点在「this 与执行上下文」章节里也完整讲了一遍。
 *        那篇是 this 绑定规则的主场（显式绑定是四条规则之一）；本文件是函数主线的主场，
 *        侧重"借用方法"与"部分应用"这两个函数视角的用途。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这三个方法都定义在 Function.prototype 上，用来"手动指定函数执行时的 this"，
 *    区别只在两点：传参形式和是否立即执行。
 *      fn.call(thisArg, a, b)     立即执行，参数逐个传
 *      fn.apply(thisArg, [a, b])  立即执行，参数用数组/类数组传
 *      fn.bind(thisArg, a, b)     不执行，返回一个"已绑定 this 和新函数"
 *    记忆口诀：call 是 Call 逗号（逐个）、apply 是 Array（数组）、bind 是 Bind 返回（绑定后返回）。
 *
 * 2. 为什么需要
 *    (1) 复用别人的方法：数组方法可以"借"给类数组对象用（Array.prototype.slice.call(arguments)）。
 *    (2) 部分应用（partial application）：固定前几个参数，得到一个更专用的新函数。
 *    (3) 修复回调里的 this：setTimeout(obj.method.bind(obj), 100)。
 *    (4) 借用构造函数的初始化逻辑（ES5 的继承写法）。
 *
 * 3. 核心语法要点
 *    (1) thisArg 传 null / undefined 时，严格模式下 this 就是 null/undefined，
 *        非严格模式下会被替换成全局对象（Node 里是 globalThis）。
 *    (2) apply 的第二个参数可以是数组或"类数组"（有 length 就行），传 null 表示不传参。
 *    (3) bind 不会改变原函数，它返回一个新函数（称为"绑定函数"）。
 *    (4) 绑定函数的 this 再也改不动：对它再 call/apply/bind 都无效。
 *    (5) 用 new 调用绑定函数时，this 会被"新建的实例"覆盖，绑定的 this 被忽略，
 *        但 bind 时预置的参数依然生效。
 *    (6) 箭头函数的 this 由词法决定，三者都改不了它。
 *
 * 4. 常见陷阱
 *    - 以为 bind 会立即执行（它只返回新函数，不会调用）。
 *    - 把 apply 的第二个参数写成散列（必须是数组）。
 *    - 对 bind 后的函数再 bind，以为能改 this（改不了，只多包一层）。
 *    - 忘记 bind 出来的是新函数，原来的 obj.method 依然没有绑定。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/07_call_apply_bind.js
 *
 * 【预期输出】
 *   演示 call/apply/bind 三者的用法与差异、方法借用、部分应用、
 *   绑定后再绑定无效、new 覆盖绑定 this，以及箭头函数不受影响。
 * ============================================================================
 */

console.log('--- 1. 三者最直观的差异 ---');

function introduce(greeting, punctuation) {
  return `${greeting}，我是 ${this.name}${punctuation}`;
}

const person = { name: '小明' };

// call：立即执行，参数逐个列出。
console.log('  call   →', introduce.call(person, '你好', '！'));
// apply：立即执行，参数放进数组。
console.log('  apply  →', introduce.apply(person, ['你好', '！']));
// bind：不执行，返回新函数，需要再手动调用一次。
const boundIntroduce = introduce.bind(person, '你好');
console.log('  bind（未调用）→', typeof boundIntroduce, '（是一个新函数，还没执行）');
console.log('  bind（调用后）→', boundIntroduce('！'));

console.log('--- 2. 代码等价性：call 与 apply 只差参数形式 ---');

function sum3(a, b, c) {
  return a + b + c;
}
console.log('  sum3.call(null, 1, 2, 3)      →', sum3.call(null, 1, 2, 3));
console.log('  sum3.apply(null, [1, 2, 3])   →', sum3.apply(null, [1, 2, 3]));
// 现代写法：用展开运算符实现 apply 的效果，可读性更好。
console.log('  sum3(...[1, 2, 3])（现代写法） →', sum3(...[1, 2, 3]));

console.log('--- 3. 经典用法：借用数组方法处理类数组 ---');

function listArgs() {
  // arguments 是类数组，没有 slice；借数组的 slice 来用。
  // 注意：ES6 之后更推荐 Array.from(arguments) 或直接用剩余参数。
  const arr1 = Array.prototype.slice.call(arguments);
  const arr2 = Array.prototype.slice.apply(arguments);
  const arr3 = Array.from(arguments);
  const arr4 = [...arguments];
  return { arr1, arr2, arr3, arr4, 都是真数组: [arr1, arr2, arr3, arr4].every(Array.isArray) };
}
console.log(' ', listArgs('a', 'b', 'c'));

// 更实用的借用案例：Math.max 接收的是"参数列表"而不是数组，
// 用 apply / 展开运算符把数组"摊开"传进去。
const numbers = [3, 17, 8, 42, 5];
console.log('  Math.max.apply(null, numbers) →', Math.max.apply(null, numbers));
console.log('  Math.max(...numbers)（现代）   →', Math.max(...numbers));

console.log('--- 4. thisArg 传 null / undefined 时的行为 ---');

function showThis() {
  // 本文件是 ESM，默认严格模式，所以 this 保持传入的 null/undefined。
  if (this === undefined) return 'undefined';
  if (this === null) return 'null';
  if (this === globalThis) return 'globalThis';
  return `其他对象：${this.name ?? '(无 name)'}`;
}
console.log('  showThis.call(null)      →', showThis.call(null));
console.log('  showThis.call(undefined) →', showThis.call(undefined));
console.log('  showThis.call(globalThis) →', showThis.call(globalThis));
console.log('  提示：非严格模式下，null/undefined 会被自动替换成全局对象，这是老代码里 this 难以预测的根源。');

console.log('--- 5. bind 做"部分应用"（partial application） ---');

// 预置参数：bind 时传进去的参数会被"记住"，调用时排在最前面。
function makeUrl(protocol, host, path) {
  return `${protocol}://${host}${path}`;
}
// 固定协议，得到一个新函数。
const httpsUrl = makeUrl.bind(null, 'https');
// 再固定主机，得到更专用的函数。
const myApi = httpsUrl.bind(null, 'api.example.com');
console.log('  makeUrl("https","a.com","/x") →', makeUrl('https', 'a.com', '/x'));
console.log('  httpsUrl("a.com", "/x")       →', httpsUrl('a.com', '/x'));
console.log('  myApi("/users")               →', myApi('/users'), '  ← 链式 bind 逐层预置参数');

// 实用场景：日志函数预设级别前缀。
function log(level, message, extra) {
  return `[${level}] ${message}${extra ? ' | ' + extra : ''}`;
}
const info = log.bind(null, 'INFO');
const error = log.bind(null, 'ERROR');
console.log('  info("服务启动")            →', info('服务启动'));
console.log('  error("连接超时", "重试中") →', error('连接超时', '重试中'));

console.log('--- 6. 绑定后的 this 再也改不动 ---');

function whoAmI() {
  return this === undefined ? 'undefined' : this.name;
}
const alice = { name: 'Alice' };
const bob = { name: 'Bob' };

const boundToAlice = whoAmI.bind(alice);
console.log('  boundToAlice()                 →', boundToAlice());
console.log('  boundToAlice.call(bob)         →', boundToAlice.call(bob), '  ← call 无效');
console.log('  boundToAlice.apply(bob)        →', boundToAlice.apply(bob), '  ← apply 无效');
const doubleBound = boundToAlice.bind(bob);
console.log('  boundToAlice.bind(bob)()       →', doubleBound(), '  ← 再 bind 也无效（只多包了一层）');
console.log('  doubleBound === boundToAlice？  →', doubleBound === boundToAlice, '（是新函数，不是同一个）');

console.log('--- 7. 用 new 调用绑定函数：绑定的 this 会被实例覆盖 ---');

function Point(x, y) {
  // 注意：这里期望 this 是 new 出来的新对象。
  this.x = x;
  this.y = y;
  this.owner = this.name ?? '实例自己';
}

// 先把 x 预置为 0，并绑定 this 为 target 对象。
const target = { name: '被绑定的对象' };
const PointOnXAxis = Point.bind(target, 0);

// 普通调用：this 是绑定的对象 target（x 被预置为 0，y 由实参给出）。
PointOnXAxis(5);
console.log('  普通调用后 target →', target, '（this 就是 target）');

// 换一个对象再 call 一次，观察 target 是否被改变。
const another = { name: '另一个对象' };
PointOnXAxis.call(another, 9);
console.log('  call(another, 9) 之后 another →', another, '（完全没被写入，call 改不了绑定）');
console.log('  call(another, 9) 之后 target  →', target, '（被改的依然是 target）');

// new 调用：this 变成新实例，绑定的 this 被忽略，但预置参数 x=0 依然生效。
const onAxis = new PointOnXAxis(7);
console.log('  new PointOnXAxis(7) →', onAxis, '  ← owner 是实例自己，说明绑定的 this 被覆盖');
console.log('  onAxis instanceof Point →', onAxis instanceof Point);

console.log('--- 8. 箭头函数的 this 不受三者影响 ---');

const arrowWho = () => (this === undefined ? 'undefined（模块顶层的 this）' : this.name);
console.log('  arrowWho()              →', arrowWho());
console.log('  arrowWho.call(alice)    →', arrowWho.call(alice));
console.log('  arrowWho.apply(bob)     →', arrowWho.apply(bob));
console.log('  arrowWho.bind(alice)()  →', arrowWho.bind(alice)());
console.log('  结论：箭头函数的 this 在定义时就锁死了，call/apply/bind 全部失效。');

console.log('--- 9. 什么时候不该用 bind ---');

// 反例：为每个对象都 bind 一次，会创建大量新函数对象，浪费内存。
// 正例：共享同一个函数，靠"隐式绑定"（obj.method()）让 this 自然正确。

// 一个工厂函数，所有实例共享同一个 increase 方法（挂在共享的原型对象上）。
const counterProto = {
  increase() {
    this.value += 1;
    return `${this.name}: ${this.value}`;
  },
};
function createCounter(name) {
  // Object.create 让新对象以 counterProto 为原型，方法只需定义一次。
  return Object.assign(Object.create(counterProto), { name, value: 0 });
}

const c1 = createCounter('计数器一');
const c2 = createCounter('计数器二');
console.log('  c1.increase() →', c1.increase());
console.log('  c2.increase() →', c2.increase());
console.log('  c1.increase === c2.increase →', c1.increase === c2.increase, '（方法共享，无需 bind）');

// 只有当方法被"传出去"（脱离对象调用）时，才需要 bind。
const detached = c1.increase;
try {
  detached();
} catch (err) {
  console.log('  直接调用脱离对象的方法 → 报错', err.constructor.name, ':', err.message);
}
const safe = c1.increase.bind(c1);
console.log('  bind 之后再脱离调用 →', safe());

// bind 的代价：每次都返回一个全新的函数对象。
const boundA = c1.increase.bind(c1);
const boundB = c1.increase.bind(c1);
console.log('  同一个方法 bind 两次是否相等？', boundA === boundB, '（不相等，一次 bind 一个新函数）');
