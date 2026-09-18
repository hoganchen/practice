/**
 * ============================================================================
 * 知识点：class 基础 —— 定义、实例化、constructor、方法与 typeof
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】入门
 * 【前置知识】09_objects/01_object_literal.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    class 是 ES2015（ES6）引入的语法糖，用来创建"构造函数 + 原型方法"这一整套结构。
 *    ES6 之前我们用 function 加 prototype 手动搭建（见 16_prototype/03 与 04），
 *    class 把同样的语义写得更清晰、更不容易出错。
 *
 * 2. 为什么需要
 *    - 语义清晰：一眼能看出这是"模板"，而不是普通函数。
 *    - 强制 new：类只能用 new 调用，忘了 new 会直接报错（老式构造函数会静默出错）。
 *    - 方法默认不可枚举：写在类体里的方法自动是原型上的不可枚举属性，
 *      不会在 for...in 里冒出来，也不会被 JSON.stringify 带上。
 *    - 严格模式：类体内部代码始终运行在严格模式下，无需 'use strict'。
 *
 * 3. 核心语法要点
 *    - 声明：class 类名 { ... }，类名习惯用大驼峰（PascalCase）。
 *    - constructor：构造函数，new 时自动调用；一个类只能有一个；
 *      不写时引擎会自动补一个空的 constructor(...args) { super(...args) }。
 *    - 方法：直接写 方法名() {}，不要写 function 关键字，方法之间不用逗号分隔。
 *    - new：创建实例，做四件事 —— 建空对象、挂原型、执行 constructor、返回该对象。
 *    - typeof 一个类的结果是 'function'，因为类本质上仍然是一个函数对象。
 *    - 类不存在变量提升（TDZ）：声明之前使用会抛 ReferenceError。
 *
 * 4. 常见陷阱
 *    - 类声明不提升：必须"先声明后使用"，与函数声明不同。
 *    - 方法之间不能加逗号（对象字面量里要加逗号，类里不能加）。
 *    - 类体里不能写 "键: 值" 这种属性初始化（那属于 04 的"类字段"写法）。
 *    - constructor 里 return 一个对象会替换掉默认的 this（见下方演示）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/01_class_basics.js
 *
 * 【预期输出】
 *   打印类的类型、实例的属性与方法调用结果、类不可提升的现象等。
 * ============================================================================
 */

console.log('--- 1. 定义一个最简单的类 ---');

// class 关键字 + 大驼峰类名 + 花括号类体。
// 类体里可以放三类成员：constructor（构造器）、方法、以及后续章节讲的
// 字段 / static / get / set。
class Person {
  // 构造器：new Person('张三', 18) 时被调用，this 指向刚创建的新对象。
  // 参数即 new 时传入的实参。
  constructor(name, age) {
    // 把参数写进实例自身：这两个属性属于"每个实例各有各的一份"。
    this.name = name;
    this.age = age;
  }

  // 方法：不写 function 关键字，方法之间没有逗号。
  // 这个方法会被放到 Person.prototype 上（下一节会证明）。
  sayHi() {
    // 方法里的 this 指向"调用它的那个实例"。
    console.log(`你好，我是 ${this.name}，今年 ${this.age} 岁。`);
  }

  // 另一个方法：即使不访问 this 也照样能写。
  describe() {
    return `${this.name}(${this.age})`;
  }
}

console.log('--- 2. typeof 一个类得到的是 function ---');

// 类没有创造新的语言类型，它只是函数对象的一种特殊形态。
// 所以 typeof 的结果是 'function'，而不是 'class' 或 'object'。
console.log('typeof Person =', typeof Person);

// 类的 name 属性来自声明的类名。
console.log('Person.name =', Person.name);

// 类本质是函数，所以也有 length（形参个数，不包含剩余参数与默认值）。
console.log('Person.length =', Person.length);

// 类的 prototype 属性指向它的原型对象，方法就挂在这里。
console.log('Person.prototype 的类型 =', typeof Person.prototype);

console.log('--- 3. 用 new 实例化 ---');

// new 做了四件事：
//   1) 创建一个空对象；
//   2) 把该对象的 [[Prototype]] 指向 Person.prototype；
//   3) 以该对象为 this 执行 constructor；
//   4) 若 constructor 没返回对象，则返回这个新对象。
const p1 = new Person('张三', 18);
const p2 = new Person('李四', 20);

// 两个实例各自持有自己的属性数据。
console.log('p1.name =', p1.name, '| p2.name =', p2.name);
console.log('p1 instanceof Person =', p1 instanceof Person);

// 调用实例方法，this 自动绑定到 p1 / p2。
p1.sayHi();
p2.sayHi();
console.log('p1.describe() =', p1.describe());

console.log('--- 4. 方法定义在原型上，不是每个实例一份 ---');

// hasOwnProperty 检查"属性是否属于实例自己"。
// name / age 是实例自己的，sayHi 不是 —— 它在原型上。
console.log('p1 自己有 name 吗？', Object.hasOwn(p1, 'name'));
console.log('p1 自己有 sayHi 吗？', Object.hasOwn(p1, 'sayHi'));
console.log('原型上有 sayHi 吗？', Object.hasOwn(Person.prototype, 'sayHi'));

// 类里定义的方法默认是不可枚举的（enumerable: false），
// 这是 class 与"手动给 prototype 赋值方法"的一个重要区别。
console.log(
  '原型方法的 enumerable =',
  Object.getOwnPropertyDescriptor(Person.prototype, 'sayHi').enumerable,
);

console.log('--- 5. 忘记 new 会报错（try/catch 演示） ---');

// 类只能用 new 调用。直接当成普通函数调用会抛 TypeError。
// 这是 class 相对老式构造函数的一大优势：错误立刻暴露，而不是静默写坏全局对象。
try {
  Person('王五', 30);
} catch (err) {
  console.log('直接调用报错类型：', err.constructor.name);
  console.log('错误信息：', err.message);
}

console.log('--- 6. 类声明不提升（try/catch 演示） ---');

// 函数声明会提升，可以在声明之前调用；
// 但类声明存在"暂时性死区"（TDZ），声明之前访问会抛 ReferenceError。
try {
  // eslint-disable-next-line no-use-before-define
  const early = new NotYetDeclared();
  console.log(early);
} catch (err) {
  console.log('提前使用报错类型：', err.constructor.name);
  console.log('错误信息：', err.message);
}

class NotYetDeclared {
  constructor() {
    this.ok = true;
  }
}

// 声明之后就能正常使用了。
console.log('声明之后实例化：', new NotYetDeclared().ok);

console.log('--- 7. constructor 返回对象会替换 this（少见但要知道） ---');

class Weird {
  constructor() {
    this.normal = true;
    // 若返回一个对象，new 的结果就是这个对象，this 被丢弃。
    return { replaced: true };
  }
}

class WeirdNumber {
  constructor() {
    this.normal = true;
    // 返回原始值（数字/字符串/布尔/null/undefined）会被忽略，仍然返回 this。
    return 123;
  }
}

console.log('返回对象时：', new Weird());
console.log('返回原始值时：', new WeirdNumber());

console.log('\n全部演示完毕。');
