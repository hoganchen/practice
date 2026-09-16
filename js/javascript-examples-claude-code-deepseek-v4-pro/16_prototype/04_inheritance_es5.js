/**
 * ============================================================================
 * 知识点：ES5 原型继承 —— 借用构造函数 + 原型链，并与 class 对比
 * ============================================================================
 *
 * 【所属分类】16_prototype —— 原型与原型链
 * 【难度等级】进阶
 * 【前置知识】16_prototype/03_constructor_function.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES6 之前实现继承要同时做两件事：
 *      ① "借用构造函数"（Constructor Stealing）：在子类构造函数里
 *         用 Parent.call(this, ...) 把父类的**实例属性**装到子类实例上；
 *      ② "原型链继承"：让 Child.prototype 的原型指向 Parent.prototype，
 *         从而继承父类的**原型方法**。
 *    只做①，方法继承不到；只做②，实例属性会共享。两者缺一不可，
 *    这种组合叫"组合继承"（Combination Inheritance），是最常用的 ES5 方案。
 *
 * 2. 为什么需要
 *    - 读懂大量历史代码与库源码。
 *    - 理解 Object.create 的用途，以及 class extends 背后做了什么。
 *
 * 3. 核心语法要点
 *    - 关键一行（设置原型链）：
 *        Child.prototype = Object.create(Parent.prototype);
 *        Child.prototype.constructor = Child;   // 修复 constructor
 *      ES5 里更老的写法是 `Child.prototype = new Parent()`，缺点是会
 *      多执行一次父类构造函数、且可能带上多余的实例属性，不推荐。
 *    - 借用构造函数的写法：Parent.call(this, ...args)
 *      （或 apply，用展开/arguments 传参）。
 *    - 修复 constructor 的原因：整体替换 prototype 后，constructor 会
 *      指向 Object（见 02 节）。
 *    - 调用父类方法：Parent.prototype.method.call(this, ...)
 *      对应 class 里的 super.method()。
 *    - 判断继承关系：child instanceof Child / Parent 都为 true。
 *    - 完整的"寄生组合继承"还会再加一层 Object.create 来避免重复调用父类
 *      构造函数 —— 但现代代码直接用 class 即可。
 *
 * 4. 常见陷阱
 *    - 忘记 Object.create 那一步：导致只有借用构造函数，方法继承不到。
 *    - 忘记修 constructor：导致 obj.constructor.name 变成 Object。
 *    - 用 Child.prototype = new Parent() ：父类构造函数被多跑一次，
 *      而且父类的引用类型属性会成为原型属性被所有实例共享。
 *    - 在借用构造函数之前访问 this（其实没问题，但 super() 是有顺序要求的）。
 *    - 父类方法内部再调用别的方法时，必须保证 this 正确传递
 *      （所以要用 .call(this) 而不是直接 Parent.prototype.m()）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 16_prototype/04_inheritance_es5.js
 *
 * 【预期输出】
 *   分步演示 ES5 继承的实现过程，逐步对照 class 版本，并演示常见错误做法。
 * ============================================================================
 */

console.log('--- 1. 先看不做原型链的后果 ---');

function Animal(name, sound) {
  this.name = name;
  this.sound = sound;
}
Animal.prototype.speak = function speak() {
  return `${this.name} 发出「${this.sound}」`;
};

// 反例：只借用构造函数，没连原型链
function DogBroken(name) {
  Animal.call(this, name, '汪汪');
  this.legs = 4;
}
// 注意：这里**没有**设置 DogBroken.prototype 的原型

const broken = new DogBroken('破狗');
console.log('实例属性正常：', broken.name, '|', broken.legs);
console.log('继承来的方法可用吗？', typeof broken.speak, '（继承不到，是 undefined）');
try {
  broken.speak();
} catch (err) {
  console.log('调用 speak 报错：', err.constructor.name, '—', err.message);
}

console.log('--- 2. 正式实现：两步走 ---');

function Dog(name) {
  // 第一步：借用构造函数，把父类的实例属性装到当前 this 上
  Animal.call(this, name, '汪汪');
  this.legs = 4;
}

// 第二步：让 Dog.prototype 的原型指向 Animal.prototype
// 用 Object.create 而不是 new Animal()，避免多跑一次父类构造函数
Dog.prototype = Object.create(Animal.prototype);
// 修复 constructor（整体替换 prototype 会丢掉它）
Dog.prototype.constructor = Dog;

// 子类自己的方法，要加在替换 prototype 之后
Dog.prototype.fetch = function fetch() {
  return `${this.name} 把球叼回来`;
};

// 重写父类方法，并在其中调用父类实现（对应 class 的 super.speak()）
Dog.prototype.speak = function speak() {
  const base = Animal.prototype.speak.call(this);
  return `${base}（而且很兴奋）`;
};

const dog = new Dog('旺财');
console.log('实例属性：', dog.name, '|', dog.sound, '| legs =', dog.legs);
console.log('继承的方法：', Animal.prototype.speak.call(dog));
console.log('重写后的方法：', dog.speak());
console.log('子类自己的方法：', dog.fetch());

console.log('--- 3. 验证继承关系 ---');

console.log('dog instanceof Dog ？', dog instanceof Dog);
console.log('dog instanceof Animal ？', dog instanceof Animal);
console.log('dog instanceof Object ？', dog instanceof Object);
console.log('Dog.prototype.constructor === Dog ？', Dog.prototype.constructor === Dog);
console.log('Object.getPrototypeOf(Dog.prototype) === Animal.prototype ？',
  Object.getPrototypeOf(Dog.prototype) === Animal.prototype);
console.log('原型链：dog → Dog.prototype → Animal.prototype → Object.prototype → null');

console.log('--- 4. 对照 class 版本：完全等价 ---');

class AnimalClass {
  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
  }
  speak() {
    return `${this.name} 发出「${this.sound}」`;
  }
}

class DogClass extends AnimalClass {
  constructor(name) {
    super(name, '汪汪');
    this.legs = 4;
  }
  speak() {
    return `${super.speak()}（而且很兴奋）`;
  }
  fetch() {
    return `${this.name} 把球叼回来`;
  }
}

const classDog = new DogClass('旺财');
console.log('实例属性：', classDog.name, '|', classDog.sound, '| legs =', classDog.legs);
console.log('方法结果与 ES5 版一致吗？',
  classDog.speak() === dog.speak() && classDog.fetch() === dog.fetch());
console.log('instanceof 行为一致吗？',
  (classDog instanceof DogClass) === (dog instanceof Dog) &&
  (classDog instanceof AnimalClass) === (dog instanceof Animal));

console.log('--- 5. 一步步对照表 ---');

const mapping = [
  ['Animal.call(this, name, sound)', 'super(name, sound)'],
  ['Dog.prototype = Object.create(Animal.prototype)', 'class Dog extends Animal'],
  ['Dog.prototype.constructor = Dog', '（class 自动处理）'],
  ['Animal.prototype.speak.call(this)', 'super.speak()'],
  ['Dog.prototype.fetch = function () {}', '类体里直接写 fetch() {}'],
];
console.log('  ES5 写法                                               class 写法');
for (const [es5, cls] of mapping) {
  console.log(`  ${es5.padEnd(52)} ${cls}`);
}

console.log('--- 6. 三层继承 ---');

function Puppy(name, months) {
  // 借用构造函数可以一层层往上借
  Dog.call(this, name);
  this.months = months;
}
Puppy.prototype = Object.create(Dog.prototype);
Puppy.prototype.constructor = Puppy;
Puppy.prototype.speak = function speak() {
  return `${Dog.prototype.speak.call(this)}（幼犬 ${this.months} 个月）`;
};

const puppy = new Puppy('小豆', 3);
console.log('三层继承的结果：', puppy.speak());
console.log('能继承到 fetch 吗？', puppy.fetch());
console.log('instanceof 全为 true 吗？',
  puppy instanceof Puppy, puppy instanceof Dog, puppy instanceof Animal);

console.log('--- 7. 常见错误做法对比 ---');

// 错误做法一：Child.prototype = Parent.prototype（共享原型，会互相覆盖）
function BadShared(name) {
  Animal.call(this, name, '咕');
}
BadShared.prototype = Animal.prototype; // 危险！两个类共用一个原型对象
BadShared.prototype.badMethod = function badMethod() {
  return '我污染了 Animal.prototype';
};
console.log('用 Parent.prototype 直接赋值后，Animal 也被污染了：',
  typeof Animal.prototype.badMethod);
// 清理掉，避免影响后续演示
delete Animal.prototype.badMethod;
delete BadShared.prototype.badMethod;

// 错误做法二：Child.prototype = new Parent()（多跑一次父类构造函数）
let parentCallCount = 0;
function Counted(name) {
  parentCallCount += 1;
  this.name = name;
  // 引用类型会被放到 this 上，如果 this 是原型对象，就变成了共享属性
  this.tags = [];
}
Counted.prototype.describe = function describe() {
  return `我是 ${this.name}`;
};

function ChildUsingNew(name) {
  Counted.call(this, name);
}
// 反例：这一次 new 会让 parentCallCount 加一
ChildUsingNew.prototype = new Counted('占位');
ChildUsingNew.prototype.constructor = ChildUsingNew;

console.log('创建 ChildUsingNew.prototype 时父类构造函数被调用了', parentCallCount, '次');
const cu = new ChildUsingNew('真正的子类');
console.log('父类构造函数总调用次数 =', parentCallCount, '（多了一次浪费）');
console.log('子类实例上能看到原型上的 tags 吗？', JSON.stringify(cu.tags), '（原型属性，所有实例共享）');

// 用 Object.create 就不会多调用
let count2 = 0;
function Counted2(name) {
  count2 += 1;
  this.name = name;
}
Counted2.prototype.describe = function describe() {
  return `我是 ${this.name}`;
};
function ChildUsingCreate(name) {
  Counted2.call(this, name);
}
ChildUsingCreate.prototype = Object.create(Counted2.prototype);
ChildUsingCreate.prototype.constructor = ChildUsingCreate;
console.log('用 Object.create 时，创建原型对象阶段父类构造函数调用次数 =', count2, '（0 次，更优）');

console.log('--- 8. 为什么现在还值得学 ---');

const why = [
  '读懂老库：很多成熟的 npm 包仍用 ES5 继承。',
  '理解本质：class 只是语法糖，底层就是这两步。',
  '排错能力：遇到"方法找不到"或"属性被共享"时，能立刻定位到原型链问题。',
  '面试与源码阅读：原型链是 JS 的核心机制之一。',
];
for (const line of why) console.log('  •', line);

console.log('\n全部演示完毕。');
