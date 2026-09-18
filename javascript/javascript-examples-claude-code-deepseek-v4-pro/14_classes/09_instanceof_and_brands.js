/**
 * ============================================================================
 * 知识点：instanceof、Object.getPrototypeOf 与 Symbol.hasInstance
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】进阶
 * 【前置知识】14_classes/07_inheritance_extends.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - instanceof：判断"某个构造函数的 prototype 是否出现在对象的原型链上"。
 *    - Object.getPrototypeOf(obj)：取对象的原型（即 [[Prototype]]，旧写法是 obj.__proto__）。
 *    - Symbol.hasInstance：一个"钩子"方法，允许某个对象自定义 instanceof 的判定逻辑。
 *
 * 2. 为什么需要
 *    - 类型判定是运行时多态的基础：拿到一个值，先判断它是什么，再决定怎么处理。
 *    - 跨 iframe / 跨 realm 时，instanceof 会失效（两边构造器不同），
 *      此时需要更可靠的"品牌检测"手段，例如 Symbol.hasInstance、Array.isArray、
 *      鸭子类型判断或 #私有字段品牌。
 *    - Symbol.hasInstance 让"类型判断"可以按业务语义定制，
 *      例如"凡是有 then 方法的都算 Thenable"。
 *
 * 3. 核心语法要点
 *    - 判定规则：obj instanceof C 大致等价于
 *      C.prototype 是否在 Object.getPrototypeOf 链上（每层都查一次）。
 *    - 右边的值必须"可调用"（函数/类）；若不可调用，抛 TypeError。
 *    - 但若右边是一个带 Symbol.hasInstance 方法的对象，则会调用它，
 *      此时右边不必是函数。这是唯一能让 instanceof 右侧不是函数的办法。
 *    - instanceof 用的是"原型链归属"，不看"是谁创建的" ——
 *      用 Object.create(SomeClass.prototype) 造出来的对象也 instanceof SomeClass。
 *    - Object.getPrototypeOf(obj) === C.prototype 是比 instanceof 更"精确"的
 *      一层判断（只查最近一层）。
 *    - Object.prototype.isPrototypeOf 也是同类工具：
 *      C.prototype.isPrototypeOf(obj) 与 obj instanceof C 等价（无自定义钩子时）。
 *
 * 4. 常见陷阱
 *    - 原始值（数字、字符串、布尔）不是对象，instanceof 一律为 false：
 *      123 instanceof Number → false，而 new Number(123) instanceof Number → true。
 *    - null / undefined 用 instanceof 不报错（直接返回 false），
 *      但 Object.getPrototypeOf(null) 会抛 TypeError。
 *    - 修改过 prototype 后旧的实例会"失忆"：改 C.prototype 的指向不影响
 *      已创建实例的原型链，但对**之后**的判定有影响。
 *    - 自定义 Symbol.hasInstance 会破坏 instanceof 的直觉，慎用。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/09_instanceof_and_brands.js
 *
 * 【预期输出】
 *   打印多组 instanceof 判定结果、原型链遍历结果，并实现一个自定义的
 *   Symbol.hasInstance 类型守卫。
 * ============================================================================
 */

console.log('--- 1. instanceof 的基本规则 ---');

class Animal {}
class Dog extends Animal {}
class Cat extends Animal {}

const d = new Dog();
console.log('d instanceof Dog =', d instanceof Dog);
console.log('d instanceof Animal =', d instanceof Animal, '（继承链上找到了 Animal.prototype）');
console.log('d instanceof Cat =', d instanceof Cat);
console.log('d instanceof Object =', d instanceof Object);
console.log('d instanceof Function =', d instanceof Function);

console.log('--- 2. instanceof 到底在查什么：自己实现一遍 ---');

// 手写一个 myInstanceOf，把判定逻辑显式化，就能彻底理解 instanceof。
function myInstanceOf(obj, ctor) {
  // 原始值不是对象，直接 false
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return false;
  }
  // 从对象的原型开始，一层层往上走
  let proto = Object.getPrototypeOf(obj);
  const target = ctor.prototype;
  while (proto !== null) {
    if (proto === target) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

console.log('myInstanceOf(d, Dog) =', myInstanceOf(d, Dog));
console.log('myInstanceOf(d, Animal) =', myInstanceOf(d, Animal));
console.log('myInstanceOf(d, Cat) =', myInstanceOf(d, Cat));
console.log('myInstanceOf(Date, Function) =', myInstanceOf(Date, Function));

console.log('--- 3. 原型链逐层打印 ---');

// 用一个循环把整条链"看"出来，直观感受查找过程。
function protoChain(obj) {
  const names = [];
  let cur = Object.getPrototypeOf(obj);
  while (cur !== null) {
    // 构造函数有 name 就用名字，否则退化为 "(匿名原型对象)"
    names.push(cur.constructor ? cur.constructor.name : '(匿名)');
    cur = Object.getPrototypeOf(cur);
  }
  names.push('null');
  return names.join(' → ');
}
console.log('d 的原型链：', protoChain(d));

// 对比 Object.getPrototypeOf 只查最近一层，比 instanceof 更严格。
console.log('最近一层是 Dog.prototype 吗？', Object.getPrototypeOf(d) === Dog.prototype);
console.log('最近一层是 Animal.prototype 吗？', Object.getPrototypeOf(d) === Animal.prototype);

// isPrototypeOf 是同一件事的另一个方向的说法
console.log('Dog.prototype.isPrototypeOf(d) =', Dog.prototype.isPrototypeOf(d));
console.log('Animal.prototype.isPrototypeOf(d) =', Animal.prototype.isPrototypeOf(d));

console.log('--- 4. 陷阱：原始值与 instanceof ---');

// 包装对象 vs 原始值
console.log('123 instanceof Number =', 123 instanceof Number, '（原始值永远是 false）');
console.log('new Number(123) instanceof Number =', new Number(123) instanceof Number);
console.log("'abc' instanceof String =", 'abc' instanceof String, '（原始值永远是 false）');
console.log('null instanceof Object =', null instanceof Object);
console.log('undefined instanceof Object =', undefined instanceof Object);

// typeof 对原始值更好用，instanceof 只适合对象
console.log('typeof 123 =', typeof 123, '| typeof "abc" =', typeof 'abc');

// Object.getPrototypeOf 对 null / undefined 会抛错
try {
  Object.getPrototypeOf(null);
} catch (err) {
  console.log('Object.getPrototypeOf(null) 报错：', err.constructor.name, '—', err.message);
}

// 右侧不是可调用对象时抛 TypeError
try {
  d instanceof 42;
} catch (err) {
  console.log('d instanceof 42 报错：', err.constructor.name, '—', err.message);
}

console.log('--- 5. 陷阱：只用 Object.create 冒充实例也能骗过 instanceof ---');

class Real {}
const fake = Object.create(Real.prototype);
console.log('fake instanceof Real =', fake instanceof Real, '（constructor 根本没执行）');
console.log('fake 没有任何自有属性吗？', Object.keys(fake).length === 0);

console.log('--- 6. 更可靠的品牌检测：私有字段 ---');

// instanceof 可以被 Object.create 或改原型骗过；私有字段品牌则骗不了，
// 因为只有真正执行了构造函数、安装了私有字段的对象才通过检测。
class Branded {
  #brand = true;

  static isBranded(obj) {
    // 语法层面的品牌检测：#brand in obj 只在类体内合法
    return #brand in obj;
  }
}

const realBranded = new Branded();
const fakeBranded = Object.create(Branded.prototype);
console.log('realBranded 通过品牌检测吗？', Branded.isBranded(realBranded));
console.log('fakeBranded 通过品牌检测吗？', Branded.isBranded(fakeBranded));
console.log('但两者都被 instanceof 认为是实例：', realBranded instanceof Branded, fakeBranded instanceof Branded);

console.log('--- 7. Symbol.hasInstance：自定义 instanceof 行为 ---');

class Thenable {
  // Symbol.hasInstance 定义在类上（静态方法形式）。
  // 它接收一个值，返回布尔值，instanceof 会直接采用这个结果。
  static [Symbol.hasInstance](value) {
    // 语义："任何有 then 方法的对象都算 Thenable" —— 这是典型的鸭子类型判断。
    return value !== null
      && (typeof value === 'object' || typeof value === 'function')
      && typeof value.then === 'function';
  }
}

// 一个普通对象，只要带 then 方法就被认作 Thenable
const promiseLike = {
  then(onFulfilled) {
    return onFulfilled(42);
  },
};
console.log('普通对象带 then → instanceof Thenable：', promiseLike instanceof Thenable);
console.log('真正的 Promise → instanceof Thenable：', Promise.resolve() instanceof Thenable);
console.log('普通对象 → instanceof Thenable：', {} instanceof Thenable);
console.log('数字 → instanceof Thenable：', 1 instanceof Thenable);

console.log('--- 8. 让 instanceof 右侧不是函数 ---');

// 只要对象带 Symbol.hasInstance，instanceof 的右侧就不必是函数。
const StringOrNumber = {
  [Symbol.hasInstance](value) {
    return typeof value === 'string' || typeof value === 'number';
  },
};

console.log("'abc' instanceof StringOrNumber：", 'abc' instanceof StringOrNumber);
console.log('123 instanceof StringOrNumber：', 123 instanceof StringOrNumber);
console.log('true instanceof StringOrNumber：', true instanceof StringOrNumber);

console.log('--- 9. 检查是否有自定义 hasInstance ---');

// Function.prototype[Symbol.hasInstance] 是默认实现，
// 类上如果没自定义，就会用到它（不可写、不可配置，是内置的"防篡改"设计）。
console.log(
  'Dog 自己有 Symbol.hasInstance 吗？',
  Object.hasOwn(Dog, Symbol.hasInstance),
);
console.log(
  'Thenable 自己有 Symbol.hasInstance 吗？',
  Object.hasOwn(Thenable, Symbol.hasInstance),
);
const hasInstanceDesc = Object.getOwnPropertyDescriptor(Function.prototype, Symbol.hasInstance);
console.log('默认实现的 writable =', hasInstanceDesc.writable, ', configurable =', hasInstanceDesc.configurable);

console.log('--- 10. 实用函数：安全地做类型判断 ---');

function typeName(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  // 对象用 constructor.name；原始值用 typeof
  if (typeof value === 'object' || typeof value === 'function') {
    return value.constructor ? value.constructor.name : 'Unknown';
  }
  return typeof value;
}

for (const v of [null, undefined, 1, 'a', true, [], {}, new Date(), Promise.resolve(), () => {}]) {
  console.log(`  ${String(v).slice(0, 24).padEnd(26)} → ${typeName(v)}`);
}

console.log('\n全部演示完毕。');
