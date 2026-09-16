/**
 * ============================================================================
 * 知识点：new 绑定 —— 构造函数调用时 this 指向新创建的实例
 * ============================================================================
 *
 * 【所属分类】15_this_and_context —— this 与执行上下文
 * 【难度等级】入门
 * 【前置知识】15_this_and_context/04_explicit_binding.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    用 new 调用一个函数时，this 会被绑定到一个"全新创建的对象"上。
 *    这是四种绑定规则里优先级最高的一种。
 *
 * 2. 为什么需要
 *    - 构造函数/类需要往新对象上写数据（this.name = ...）。
 *    - 理解 new 与 bind 的优先级，是理解很多库内部实现的前提。
 *
 * 3. 核心语法要点
 *    new 调用时引擎依次做四件事：
 *      ① 创建一个空对象；
 *      ② 把这个对象的 [[Prototype]] 指向 Fn.prototype；
 *      ③ 以这个新对象为 this 执行函数体；
 *      ④ 若函数体返回的是**对象**，则用它替换；否则返回这个新对象。
 *    - 优先级：new 绑定 > 显式绑定（bind）。
 *        const Bound = Fn.bind(obj);
 *        new Bound();   // this 是**新实例**，不是 obj
 *      原因是 new 会忽略 bind 传入的 thisArg（但 bind 预设的参数仍然生效）。
 *    - 用 new 调用普通函数、类、内置构造函数都遵循同样的规则。
 *    - 箭头函数与方法没有 [[Construct]]，不能 new（见 03 节 / 14 章 02 节）。
 *
 * 4. 常见陷阱
 *    - 忘记写 new：普通函数会被当普通调用，this 是 undefined（严格模式），
 *      在非严格模式下则会污染全局。
 *    - 构造函数里 return 一个对象会替换掉默认的 this（返回原始值则被忽略）。
 *    - 以为 bind 能阻止 new：bind 只能限制普通调用，对 new 无效。
 *    - 类必须用 new 调用，否则直接抛 TypeError（这是 class 相对函数的改进）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 15_this_and_context/05_new_binding.js
 *
 * 【预期输出】
 *   逐步演示 new 的四步、return 的影响、new 与 bind 的优先级、忘记 new 的后果。
 * ============================================================================
 */

console.log('--- 1. new 绑定：this 就是新创建的实例 ---');

function Person(name, age) {
  // 用 new 调用时，这里的 this 是一个全新的空对象
  console.log('  构造函数里 this 是全新的吗？', typeof this === 'object' && this !== null);
  this.name = name;
  this.age = age;
  // 没有 return 语句时，隐式返回 this
}

const p = new Person('张三', 28);
console.log('实例的属性：', p.name, p.age);
console.log('p instanceof Person =', p instanceof Person);
// 实例的"构造者"是 Person
console.log('p.constructor === Person =', p.constructor === Person);

console.log('--- 2. 手写一个 myNew，把四步拆开看 ---');

function myNew(Ctor, ...args) {
  // 第一步 + 第二步：创建一个对象，并让它继承 Ctor.prototype
  const obj = Object.create(Ctor.prototype);
  // 第三步：以 obj 为 this 执行构造函数
  const result = Ctor.apply(obj, args);
  // 第四步：若构造函数返回对象，就用它；否则用 obj
  const isObject = result !== null && (typeof result === 'object' || typeof result === 'function');
  return isObject ? result : obj;
}

const p2 = myNew(Person, '李四', 30);
console.log('手写 myNew 得到的实例：', p2.name, p2.age);
console.log('myNew 的实例 instanceof Person 吗？', p2 instanceof Person);

console.log('--- 3. 构造函数 return 的影响 ---');

function ReturnObject() {
  this.tag = '这是新实例上的属性';
  // 返回对象 → 替换掉 this
  return { replaced: true };
}
function ReturnPrimitive() {
  this.tag = '仍然保留';
  // 返回原始值 → 被忽略，仍然返回 this
  return 42;
}
function ReturnNull() {
  this.tag = 'null 也是原始值，被忽略';
  return null;
}

console.log('return 对象：', new ReturnObject());
console.log('return 数字：', new ReturnPrimitive());
console.log('return null：', new ReturnNull());

console.log('--- 4. new 与 bind 的优先级：new 赢 ---');

function Config(value) {
  this.value = value;
  this.kind = 'Config 实例';
}

const fakeThis = { kind: '假的 this', value: '假的 value' };
const BoundConfig = Config.bind(fakeThis);

// 普通调用：bind 生效，写入的是 fakeThis
BoundConfig('来自普通调用');
console.log('普通调用后 fakeThis =', JSON.stringify(fakeThis));

// new 调用：this 变成新实例，bind 的 thisArg 被忽略
const boundInstance = new BoundConfig('来自 new 调用');
console.log('new 调用得到的实例 =', JSON.stringify(boundInstance));
console.log('它是 Config 的实例吗？', boundInstance instanceof Config);
console.log('fakeThis 有没有被改？', JSON.stringify(fakeThis));
// 但 bind 预设的参数依然生效
const PreBound = Person.bind(null, '预设名字');
const preInstance = new PreBound(99);
console.log('bind 预设参数在 new 时仍生效：', preInstance.name, preInstance.age);

console.log('--- 5. 忘记写 new 会怎样（try/catch 演示） ---');

// 本文件是 ESM，函数体默认严格模式，所以 this 是 undefined。
function StrictCtor(name) {
  this.name = name;
}

try {
  StrictCtor('忘了 new');
} catch (err) {
  console.log('严格模式下忘记 new 报错：', err.constructor.name);
  console.log('  信息：', err.message);
}

// 非严格模式下，this 是全局对象 —— 于是悄悄污染了全局。
// 这里用 new Function 造一个非严格函数来演示。
const SloppyCtor = new Function('name', 'this.leakedName = name;');
SloppyCtor('被漏到全局的名字');
console.log('非严格模式漏到全局的值：', globalThis.leakedName);
delete globalThis.leakedName; // 清理

// 用 class 的话，忘记 new 会立刻报错，不存在"静默出错"
class ModernCtor {
  constructor(name) {
    this.name = name;
  }
}
try {
  ModernCtor('忘了 new');
} catch (err) {
  console.log('class 忘记 new 报错：', err.constructor.name, '—', err.message);
}

console.log('--- 6. 用 instanceof 做"忘了 new"的兼容保护 ---');

// 老式防御写法：如果调用时没有 new，就自动补一个 new。
function SafeCtor(name) {
  // new.target 为 undefined 说明不是用 new 调用的（细节见 14 章 10 节）
  if (!new.target) {
    return new SafeCtor(name);
  }
  this.name = name;
}

const safe1 = new SafeCtor('用了 new');
const safe2 = SafeCtor('没用 new 也能工作');
console.log('两种调用方式都能得到实例：', safe1.name, '/', safe2.name);
console.log('都是 SafeCtor 的实例吗？', safe1 instanceof SafeCtor, safe2 instanceof SafeCtor);

console.log('--- 7. new 一个带 prototype 方法的构造函数（ES5 风格） ---');

function Animal(name) {
  this.name = name;
}
// 方法放到 prototype 上，所有实例共享（这是 ES5 的"类"写法，详见 16 章）
Animal.prototype.speak = function speak() {
  // 调用时 this 由调用方式决定，obj.speak() 时就是 obj
  return `${this.name} 发出声音`;
};

const a1 = new Animal('猫');
const a2 = new Animal('狗');
console.log(a1.speak(), '/', a2.speak());
console.log('两个实例共享同一个方法吗？', a1.speak === a2.speak);

console.log('--- 8. 优先级小结（从高到低） ---');

const priority = [
  '① new 绑定：new Fn() → this 是新实例',
  '② 显式绑定：fn.call(obj) / fn.apply(obj) / fn.bind(obj)',
  '③ 隐式绑定：obj.fn() → this 是 obj',
  '④ 默认绑定：fn() → 严格模式 undefined，非严格模式 globalThis',
  '（箭头函数不参与以上规则，它的 this 由定义位置决定）',
];
for (const line of priority) console.log('  •', line);

console.log('\n全部演示完毕。');
