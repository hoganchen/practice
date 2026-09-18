/**
 * ============================================================================
 * 知识点：构造函数 + prototype 的老式"类"写法（理解 ES5 遗产）
 * ============================================================================
 *
 * 【所属分类】16_prototype —— 原型与原型链
 * 【难度等级】入门
 * 【前置知识】16_prototype/02_proto_vs_prototype.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES6 之前没有 class，大家用"构造函数 + prototype"来模拟类：
 *      - 构造函数负责给实例装数据（this.xxx = ...）；
 *      - prototype 负责装共享方法；
 *      - new 负责把两者连起来。
 *    这套模式今天仍然重要：class 就是它的语法糖，读懂老代码与库源码必须掌握。
 *
 * 2. 为什么需要
 *    - 维护老项目、读老库（很多 npm 包仍有 ES5 代码）。
 *    - 理解 class 背后发生了什么，从而明白为什么"类方法不可枚举"、
 *      "类不能不用 new 调用"等设计。
 *
 * 3. 核心语法要点
 *    - 构造函数的约定：首字母大写；只应该用 new 调用。
 *    - 实例属性：写在构造函数里（this.x = ...），每个实例一份。
 *    - 共享方法：写在 Fn.prototype 上，所有实例共享。
 *    - 默认的 prototype 对象自带 constructor 属性指回构造函数。
 *    - new 的四步：建对象 → 挂原型 → 执行函数体 → 返回对象（详见 15 章 05 节）。
 *    - 用 defineProperty 定义的方法是"不可枚举"的，
 *      这正是 class 里方法的行为；直接赋值则是可枚举的。
 *    - 判断构造函数的可靠方式是 `obj instanceof Fn` 或 obj.constructor === Fn，
 *      但两者都可以被伪造，最可靠的是私有字段品牌（见 14 章 09 节）。
 *
 * 4. 常见陷阱
 *    - 忘记 new：严格模式报错，非严格模式污染全局（用 'use strict' 或
 *      new.target 检查来防）。
 *    - 把方法写进构造函数里：每个实例都会新建一份函数，浪费内存。
 *    - 整体替换 prototype 后忘记补 constructor。
 *    - 在 prototype 上放引用类型（数组/对象）当"默认值"：
 *      所有实例会共享同一个，互相污染。
 *    - 用 typeof 判断"是不是这个类的实例"—— typeof 对对象永远返回 'object'。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 16_prototype/03_constructor_function.js
 *
 * 【预期输出】
 *   用老式写法实现一个完整的"类"，并与 class 版本逐项对比行为差异。
 * ============================================================================
 */

console.log('--- 1. 最小可用的老式"类" ---');

function Person(name, age) {
  // 实例属性：每个实例各自一份
  this.name = name;
  this.age = age;
}

// 共享方法：挂在 prototype 上，所有实例共享同一份
Person.prototype.greet = function greet() {
  return `你好，我是 ${this.name}，${this.age} 岁`;
};

// 再挂一个
Person.prototype.birthday = function birthday() {
  this.age += 1;
  return this.age;
};

const p1 = new Person('张三', 28);
const p2 = new Person('李四', 30);

console.log('p1.greet() =', p1.greet());
console.log('p2.greet() =', p2.greet());
console.log('两个实例共享 greet 吗？', p1.greet === p2.greet);
console.log('p1 自己有 greet 吗？', Object.hasOwn(p1, 'greet'), '（没有，在原型上）');
console.log('生日后年龄：', p1.birthday(), '| p2 的年龄不受影响：', p2.age);

console.log('--- 2. class 版本对比：一模一样的东西 ---');

class PersonClass {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  greet() {
    return `你好，我是 ${this.name}，${this.age} 岁`;
  }
  birthday() {
    this.age += 1;
    return this.age;
  }
}

const c1 = new PersonClass('王五', 25);
console.log('行为一致：', c1.greet());
console.log('共享方法：', c1.greet === new PersonClass('x', 1).greet);
console.log('实例自有属性一致吗？',
  JSON.stringify(Object.keys(p1)) === JSON.stringify(Object.keys(c1)));
console.log('原型上方法的 enumerable 一致吗？',
  Object.getOwnPropertyDescriptor(Person.prototype, 'greet').enumerable ===
  Object.getOwnPropertyDescriptor(PersonClass.prototype, 'greet').enumerable);

// class 的真正差别
const differences = [
  'class 必须用 new 调用（否则 TypeError）；老式构造函数不会拦。',
  'class 体内始终严格模式；老式构造函数要看外层是否严格。',
  'class 声明不提升（TDZ）；函数声明会提升。',
  'class 方法默认不可枚举；直接赋值到 prototype 上的是可枚举的。',
  'class 不能把整个 prototype 换掉（实际上可以，但没有意义）。',
];
for (const line of differences) console.log('  •', line);

console.log('--- 3. 可枚举性的差别（容易被忽略） ---');

console.log('老式 prototype 上 greet 的 enumerable：',
  Object.getOwnPropertyDescriptor(Person.prototype, 'greet').enumerable);
console.log('class 的 greet 的 enumerable：',
  Object.getOwnPropertyDescriptor(PersonClass.prototype, 'greet').enumerable);

// 这直接影响 for...in 的结果
const p1Keys = [];
for (const k in p1) p1Keys.push(k);
const c1Keys = [];
for (const k in c1) c1Keys.push(k);
console.log('for...in 老式实例：', p1Keys.join(', '), '（方法也被遍历出来了）');
console.log('for...in class 实例：', c1Keys.join(', '), '（只有数据属性）');

// 让老式写法也变成不可枚举 —— 这正是 class 内部做的事
function ModernPerson(name) {
  this.name = name;
}
Object.defineProperty(ModernPerson.prototype, 'greet', {
  value: function greet() {
    return `你好，${this.name}`;
  },
  // 关键：三个特性与 class 保持一致
  writable: true,
  enumerable: false,
  configurable: true,
});
const mp = new ModernPerson('赵六');
const mpKeys = [];
for (const k in mp) mpKeys.push(k);
console.log('用 defineProperty 后 for...in：', mpKeys.join(', '), '（只剩数据属性）');
console.log('仍可正常调用：', mp.greet());

console.log('--- 4. 陷阱：方法写进构造函数里 ---');

function Wasteful(name) {
  this.name = name;
  // 反例：每个实例都会新建一份函数
  this.greet = function greet() {
    return `你好，${this.name}`;
  };
}

const w1 = new Wasteful('甲');
const w2 = new Wasteful('乙');
console.log('浪费写法：两个实例共享方法吗？', w1.greet === w2.greet, '（各有一份）');
console.log('浪费写法：实例自有属性有 greet 吗？', Object.hasOwn(w1, 'greet'));
console.log('正确写法：共享吗？', p1.greet === p2.greet, '（共享一份）');

console.log('--- 5. 陷阱：prototype 上放引用类型当默认值 ---');

function BuggyList() {
  // 故意留空，假装"默认值是空数组"
}
// 严重错误：所有实例共享同一个数组
BuggyList.prototype.items = [];
BuggyList.prototype.add = function add(item) {
  this.items.push(item);
  return this.items;
};

const b1 = new BuggyList();
const b2 = new BuggyList();
b1.add('b1 的项');
console.log('b1.items =', JSON.stringify(b1.items));
console.log('b2.items =', JSON.stringify(b2.items), '（被污染了！）');
console.log('是同一个数组吗？', BuggyList.prototype.items === b1.items);

// 正确做法：把引用类型放进构造函数，每个实例一份
function GoodList() {
  this.items = [];
}
GoodList.prototype.add = function add(item) {
  this.items.push(item);
  return this.items;
};
const g1 = new GoodList();
const g2 = new GoodList();
g1.add('g1 的项');
console.log('正确写法：g1.items =', JSON.stringify(g1.items), '| g2.items =', JSON.stringify(g2.items));

console.log('--- 6. 防止"忘记 new"：老代码的两种防御 ---');

// 写法一：new.target 检查（现代做法，见 14 章 10 节）
function SafeA(name) {
  if (!new.target) {
    return new SafeA(name);
  }
  this.name = name;
}

// 写法二：instanceof 检查（老代码常见）
function SafeB(name) {
  if (!(this instanceof SafeB)) {
    return new SafeB(name);
  }
  this.name = name;
}

console.log('SafeA 不用 new 也能工作：', SafeA('甲').name, SafeA('乙') instanceof SafeA);
console.log('SafeB 不用 new 也能工作：', SafeB('丙').name, SafeB('丁') instanceof SafeB);

// 写法二的缺陷：用 Object.create 冒充时会误判
const fake = Object.create(SafeB.prototype);
console.log('Object.create 出来的对象 instanceof SafeB 吗？', fake instanceof SafeB);

console.log('--- 7. 判断实例的真实性 ---');

const list = [p1, c1, {}, null];
for (const v of list) {
  // instanceof 只在右侧是函数时可用，且 null/原始值一律 false
  const isPerson = v instanceof Person;
  const isPersonClass = v instanceof PersonClass;
  console.log(`  ${String(v).slice(0, 20).padEnd(22)} Person? ${String(isPerson).padEnd(6)} PersonClass? ${isPersonClass}`);
}

// typeof 无法区分具体类型
console.log('typeof p1 =', typeof p1, '（对对象永远是 object）');
// constructor.name 更直观，但可被伪造
console.log('p1.constructor.name =', p1.constructor.name);
console.log('c1.constructor.name =', c1.constructor.name);

console.log('--- 8. 为什么推荐新代码直接用 class ---');

const reasons = [
  '语法更集中：字段、方法、静态成员都在一个块里。',
  '更安全：忘记 new 直接报错，不会静默污染全局。',
  '默认更合理：方法不可枚举、类体严格模式。',
  '支持私有字段 #x、static 块等现代特性。',
  '但读懂老式写法依然必要 —— 它就是 class 的底层。',
];
for (const line of reasons) console.log('  •', line);

console.log('\n全部演示完毕。');
