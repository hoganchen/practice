/**
 * ============================================================================
 * 知识点：__proto__ 与 prototype 的区别 —— 实例 vs 函数
 * ============================================================================
 *
 * 【所属分类】16_prototype —— 原型与原型链
 * 【难度等级】入门
 * 【前置知识】16_prototype/01_prototype_chain.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这两个名字长得像，但说的是完全不同的东西：
 *      - [[Prototype]]（旧式访问器写作 __proto__）：**每个对象**都有，
 *        指向"我的原型是谁"，用来沿链查找属性。
 *      - prototype：**只有函数**（含类）才有，是函数对象的一个普通属性，
 *        值是一个对象，用途是"当我把这个函数用作构造函数时，
 *        新实例的 [[Prototype]] 将指向它"。
 *
 * 2. 为什么需要
 *    混淆这两者是初学原型时最大的障碍。一句话记住：
 *        obj.__proto__ === 它的构造函数的 prototype
 *        Fn.prototype 是"给未来实例用的原型模板"，不是 Fn 自己的原型。
 *
 * 3. 核心语法要点
 *    - 谁有谁没有：
 *        普通对象：有 __proto__，没有 prototype；
 *        函数（含箭头函数？）：函数都有 prototype —— 但**箭头函数没有**！
 *        箭头函数、方法简写、async 函数、生成器函数：
 *          - 箭头函数与方法简写：没有 prototype；
 *          - 普通函数/class：有 prototype；
 *          - async 函数、生成器函数：有 prototype，但不能用 new。
 *    - 两条独立的关系线：
 *        ① 实例 → 构造函数.prototype       （obj.__proto__）
 *        ② 函数 → Function.prototype       （fn.__proto__，因为函数也是对象）
 *      注意 Fn.prototype 的 __proto__ 通常指向 Object.prototype（除非有继承）。
 *    - 构造函数的 prototype 是一个普通对象，它自带一个 constructor 属性
 *      指回构造函数：Fn.prototype.constructor === Fn（默认情况下）。
 *    - Object.getPrototypeOf / Object.setPrototypeOf 是操作 [[Prototype]] 的
 *      标准 API，__proto__ 只是历史遗留的访问器（虽然被标准化了）。
 *    - 用 Object.create(null) 创建的对象连 __proto__ 都没有。
 *
 * 4. 常见陷阱
 *    - 写成 obj.prototype 想拿原型 —— 普通对象根本没这个属性（是 undefined）。
 *    - 写成 Fn.__proto__ 以为是"实例的原型" —— 那其实是 Function.prototype。
 *    - 给 Fn.prototype 整体重新赋值会丢掉原有的 constructor 属性，
 *      需要手动补回 Fn.prototype.constructor = Fn。
 *    - __proto__ 可以被对象自己的属性遮蔽（如果对象有名为 __proto__ 的自有属性）。
 *    - 箭头函数没有 prototype，用不了 new（见 15 章 03 节）。
 *    - 在生产代码里性能敏感处避免用 __proto__ 读写原型，用标准 API。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 16_prototype/02_proto_vs_prototype.js
 *
 * 【预期输出】
 *   逐项验证 __proto__ 与 prototype 的归属与指向关系，并演示常见混淆点。
 * ============================================================================
 */

console.log('--- 1. 谁有 prototype，谁有 __proto__ ---');

function normalFn() {}
class SomeClass {}
const arrowFn = () => {};
const objLiteral = {};
const arr = [];

const inventory = [
  ['普通函数', normalFn],
  ['类', SomeClass],
  ['箭头函数', arrowFn],
  ['普通对象', objLiteral],
  ['数组', arr],
];

console.log('  对象        有 prototype 吗    有 __proto__ 吗');
for (const [name, value] of inventory) {
  const hasPrototype = typeof value.prototype !== 'undefined';
  const hasProto = typeof value.__proto__ !== 'undefined';
  console.log(`  ${name.padEnd(10)}  ${String(hasPrototype).padEnd(18)} ${hasProto}`);
}
console.log('小结：prototype 只有"函数"才有，而且箭头函数没有；__proto__ 所有对象都有。');

console.log('--- 2. 两条关系线 ---');

function Person(name) {
  this.name = name;
}
const p = new Person('张三');

// 关系线①：实例的 __proto__ 指向构造函数的 prototype
console.log('p.__proto__ === Person.prototype ？', p.__proto__ === Person.prototype);
console.log('用标准 API 验证：', Object.getPrototypeOf(p) === Person.prototype);

// 关系线②：函数的 __proto__ 指向 Function.prototype（因为函数也是对象）
console.log('Person.__proto__ === Function.prototype ？', Person.__proto__ === Function.prototype);
console.log('Person.__proto__ === Person.prototype ？', Person.__proto__ === Person.prototype, '（完全不同）');

// 而 Person.prototype 自己的原型是 Object.prototype
console.log('Person.prototype.__proto__ === Object.prototype ？',
  Object.getPrototypeOf(Person.prototype) === Object.prototype);

console.log('--- 3. prototype 自带 constructor 指回构造函数 ---');

console.log('Person.prototype.constructor === Person ？', Person.prototype.constructor === Person);
console.log('p.constructor === Person ？', p.constructor === Person, '（沿原型链找到的）');
console.log('p 自己有 constructor 吗？', Object.hasOwn(p, 'constructor'), '（没有，是继承来的）');

console.log('--- 4. 混淆点一：普通对象没有 prototype ---');

console.log('objLiteral.prototype =', objLiteral.prototype, '（undefined）');
console.log('objLiteral.__proto__ === Object.prototype ？', Object.getPrototypeOf(objLiteral) === Object.prototype);
console.log('空数组的 prototype =', arr.prototype, '（也是 undefined）');
console.log('arr.__proto__ === Array.prototype ？', Object.getPrototypeOf(arr) === Array.prototype);

console.log('--- 5. 混淆点二：函数的 __proto__ 不是它的 prototype ---');

console.log('normalFn.prototype 是：', typeof normalFn.prototype, '（一个对象）');
console.log('normalFn.__proto__ 是：', normalFn.__proto__ === Function.prototype ? 'Function.prototype' : '其它');
console.log('两者相等吗？', normalFn.__proto__ === normalFn.prototype);
console.log('一句话：prototype 是"给实例用的模板"，__proto__ 是"我自己继承谁"。');

console.log('--- 6. prototype 的作用：共享方法 ---');

function Animal(name) {
  this.name = name;
}
// 方法放在 prototype 上 → 所有实例共享同一个函数
Animal.prototype.speak = function speak() {
  return `${this.name} 发出声音`;
};

const a1 = new Animal('猫');
const a2 = new Animal('狗');
console.log('a1.speak() =', a1.speak());
console.log('a1 自己有 speak 吗？', Object.hasOwn(a1, 'speak'), '（没有，在原型上）');
console.log('两个实例共享同一个 speak 吗？', a1.speak === a2.speak);

// 往原型上加方法，已存在的实例立刻可用
Animal.prototype.run = function run() {
  return `${this.name} 在跑`;
};
console.log('给原型加方法后，老实例也能用：', a1.run());

console.log('--- 7. 整体重写 prototype 的坑 ---');

function Legacy() {}
Legacy.prototype.greet = function greet() {
  return 'hello';
};
console.log('重写前 constructor：', new Legacy().constructor === Legacy);

// 整体赋值会丢掉默认的 constructor 指向
Legacy.prototype = {
  greet() {
    return 'hi';
  },
};
console.log('重写后 constructor 还是 Legacy 吗？', new Legacy().constructor === Legacy);
console.log('重写后 constructor 实际是：', new Legacy().constructor.name);
console.log('修正办法：手动补回 constructor');
Legacy.prototype.constructor = Legacy;
console.log('补回后：', new Legacy().constructor === Legacy);

// 注意：重写 prototype 之前创建的实例仍然指向旧的原型对象
function Split() {}
const before = new Split();
Split.prototype = { tag: '新的原型' };
const after = new Split();
console.log('重写前创建的实例还能用新原型上的东西吗？', before.tag);
console.log('重写后创建的实例：', after.tag);

console.log('--- 8. 箭头函数与方法简写没有 prototype ---');

console.log('箭头函数的 prototype：', arrowFn.prototype);
const objWithMethod = {
  method() {
    return 'method';
  },
};
console.log('方法简写的 prototype：', objWithMethod.method.prototype);
console.log('class 有 prototype 吗？', typeof SomeClass.prototype);

// 箭头函数不能 new（缺 [[Construct]]）
try {
  new arrowFn();
} catch (err) {
  console.log('new 箭头函数报错：', err.constructor.name, '—', err.message);
}

console.log('--- 9. 标准 API 与 __proto__ 的取舍 ---');

const standard = {};
const legacy = {};

// 读原型：两种方式等价
console.log('读原型：getPrototypeOf === __proto__ ？',
  Object.getPrototypeOf(standard) === standard.__proto__);

// 写原型：建议用标准 API
const newProto = { fromStandard: true };
Object.setPrototypeOf(standard, newProto);
legacy.__proto__ = newProto;
console.log('两种写法结果一致：', standard.fromStandard === legacy.fromStandard);

// Object.create 是"创建时就指定原型"的高效做法（不必先建再改）
const created = Object.create(newProto);
console.log('Object.create 一步到位：', created.fromStandard);

// 无原型对象连 __proto__ 访问器都没有
const bare = Object.create(null);
console.log('Object.create(null).__proto__ =', bare.__proto__);
console.log('它连 hasOwnProperty 都没有：', typeof bare.hasOwnProperty);

console.log('--- 10. 速查表 ---');

const table = [
  ['属性名', '属于谁', '指向什么', '用途'],
  ['__proto__', '所有对象', '我的原型对象', '沿链查找属性'],
  ['prototype', '函数（箭头函数除外）', '一个普通对象（默认带 constructor）', '作为 new 出来的实例的原型'],
];
for (const [a, b, c, d] of table) {
  console.log(`  ${a.padEnd(12)} ${b.padEnd(22)} ${c.padEnd(34)} ${d}`);
}

console.log('\n全部演示完毕。');
