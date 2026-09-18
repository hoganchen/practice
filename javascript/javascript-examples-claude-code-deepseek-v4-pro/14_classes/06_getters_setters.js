/**
 * ============================================================================
 * 知识点：类的 get / set 访问器 —— 把方法伪装成属性
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】入门
 * 【前置知识】14_classes/04_class_fields.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    get / set 是"访问器属性"（accessor property）的语法。写在类体里的
 *    "get 名字() {}" 定义读取逻辑，"set 名字(值) {}" 定义写入逻辑。
 *    使用方按**属性**的方式读写（obj.x），实际执行的是函数。
 *
 * 2. 为什么需要
 *    - 计算属性：fullName 由 firstName + lastName 拼出来，不必存两份。
 *    - 数据校验：赋值时检查范围、类型，非法值直接抛错或忽略。
 *    - 只读属性：只写 get 不写 set，外部赋值会静默失败（严格模式抛错）。
 *    - 副作用：赋值时同步更新别的数据（缓存失效、日志）。
 *    - 保持兼容：先有公开字段，后来想加逻辑，改成 get/set 后调用方无需改动。
 *
 * 3. 核心语法要点
 *    - 定义：get name() {} / set name(v) {}，一个类可以只定义其中一个。
 *    - 不加 get/set 的写法是普通方法，调用时要写括号：obj.name()。
 *    - 访问器定义在原型上（原型访问器），所以实例自身没有该属性，
 *      这与 04 节讲的"实例字段"是两种完全不同的存在形式。
 *    - 访问器可以配合私有字段使用：外部读 get，内部存 #field。
 *    - set 只有一个参数，写多个参数是语法错误。
 *    - get/set 也可以 static：static get foo() {}。
 *    - 可以在 set 里再次访问同名属性吗？不行 —— 会无限递归（见陷阱部分）。
 *
 * 4. 常见陷阱
 *    - 无限递归：set x(v) { this.x = v; } 会不断调用自己，最终栈溢出。
 *      解决办法是引入一个真正存储数据的字段（如 this.#x 或 this._x）。
 *    - 只定义 get 时，赋值在严格模式（类体默认严格）下抛 TypeError；
 *      在非严格模式（如普通对象字面量里的 get）下静默失败。
 *    - 访问器不是方法，instance.method 的 typeof 结果区分不出它是不是访问器，
 *      要用 Object.getOwnPropertyDescriptor(...).get 来判断。
 *    - Object.assign 复制对象时会"读取"源对象的 getter 再"写入"目标对象的 setter，
 *      不一定得到你想要的结果。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/06_getters_setters.js
 *
 * 【预期输出】
 *   演示访问器的读写、校验、只读、静态访问器，以及递归陷阱的报错。
 * ============================================================================
 */

console.log('--- 1. 基础：get 把计算变成属性读取 ---');

class Person {
  constructor(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
  }

  // get：读取时执行，不需要括号
  get fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  // set：赋值时执行
  set fullName(value) {
    // 用空格拆分赋值内容，实现"反向写入"
    const parts = String(value).trim().split(/\s+/);
    if (parts.length < 2) {
      throw new TypeError('fullName 需要"名 姓"两段');
    }
    [this.firstName, this.lastName] = parts;
  }

  // 对比：普通方法，调用时要写括号
  getFullNameMethod() {
    return `${this.firstName} ${this.lastName}`;
  }
}

const p = new Person('三', '张');
// 读访问器：不加括号
console.log('p.fullName =', p.fullName);
// 写访问器：赋值语法
p.fullName = '四 李';
console.log('赋值后 firstName/lastName =', p.firstName, '/', p.lastName);
// 普通方法必须加括号
console.log('普通方法 getFullNameMethod() =', p.getFullNameMethod());
console.log('不加括号会得到函数本身：', typeof p.getFullNameMethod);

console.log('--- 2. 访问器在原型上，不在实例上 ---');

console.log('实例自己有 fullName 吗？', Object.hasOwn(p, 'fullName'));
console.log('原型上有 fullName 吗？', Object.hasOwn(Person.prototype, 'fullName'));
// 用属性描述符看真相：这是"访问器描述符"，有 get/set 而没有 value
const desc = Object.getOwnPropertyDescriptor(Person.prototype, 'fullName');
console.log('原型上 fullName 描述符的键：', Object.keys(desc).join(', '));
console.log('get 是函数吗？', typeof desc.get, '| set 是函数吗？', typeof desc.set);

console.log('--- 3. 数据校验：set 的主要用途 ---');

class Product {
  #price = 0; // 私有字段做真正的存储

  constructor(name, price) {
    this.name = name;
    // 走 set，所以构造函数里也能享受校验
    this.price = price;
  }

  get price() {
    return this.#price;
  }

  set price(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError('价格必须是有限数字');
    }
    if (value < 0) {
      throw new RangeError('价格不能为负');
    }
    if (value > 1_000_000) {
      throw new RangeError('价格超出上限');
    }
    // 存进私有字段。#price 与 price 是两个不同的名字，不会递归。
    this.#price = value;
  }

  // 派生只读属性：不写 set，外部无法直接赋值
  get priceWithTax() {
    return Number((this.#price * 1.13).toFixed(2));
  }
}

const prod = new Product('键盘', 199);
console.log('价格 =', prod.price, '| 含税 =', prod.priceWithTax);
prod.price = 299;
console.log('改价后 =', prod.price, '| 含税 =', prod.priceWithTax);

try {
  prod.price = -1;
} catch (err) {
  console.log('设为负数报错：', err.constructor.name, '—', err.message);
}

try {
  prod.price = '很贵';
} catch (err) {
  console.log('设为字符串报错：', err.constructor.name, '—', err.message);
}

console.log('--- 4. 只读属性：只写 get 不写 set ---');

// 类体内的代码始终是严格模式，所以给只读属性赋值会抛 TypeError。
try {
  prod.priceWithTax = 1;
} catch (err) {
  console.log('严格模式下给只读访问器赋值报错：', err.constructor.name);
  console.log('  信息：', err.message);
}

// 对比：非严格模式下同样的操作"静默失败" —— 不报错，但值也没改。
const readonlyObj = {
  get value() {
    return 42;
  },
};

// 注意：本文件是 ESM 模块，模块代码**始终**是严格模式，
// 直接写 readonlyObj.value = 100 同样会抛 TypeError。
// 所以这里用 Function 构造函数把赋值语句放进"非严格"的函数体里执行，
// 以此演示老式脚本（非严格模式）下的静默失败行为。
const sloppyAssign = new Function('obj', 'obj.value = 100; return obj.value;');
const afterAssign = sloppyAssign(readonlyObj);
console.log('非严格模式下赋值返回/读到的值：', afterAssign, '（赋值被静默忽略）');
console.log('对象的值依然没变：', readonlyObj.value);

console.log('--- 5. 无限递归陷阱（try/catch 演示） ---');

class Recursive {
  constructor(v) {
    this.value = v;
  }

  get value() {
    return this.value; // 读自己 → 无限递归
  }

  set value(v) {
    this.value = v; // 写自己 → 无限递归
  }
}

try {
  const r = new Recursive(1);
  console.log(r.value);
} catch (err) {
  console.log('递归报错类型：', err.constructor.name);
  // RangeError: Maximum call stack size exceeded
  console.log('错误信息（截断）：', err.message.slice(0, 60));
}

// 正确的写法：用另一个名字（通常加下划线或私有 #）真正存数据
class Correct {
  #value;
  constructor(v) {
    this.value = v;
  }
  get value() {
    return this.#value;
  }
  set value(v) {
    this.#value = v * 2; // 举例：写入时统一加倍
  }
}
const correct = new Correct(21);
console.log('正确写法：传入 21，读到的 value =', correct.value);

console.log('--- 6. 静态访问器与访问器的副作用 ---');

class Circle {
  static #pi = 3.141592653589793;

  // 静态 get：通过类名访问
  static get PI() {
    return Circle.#pi;
  }

  constructor(radius) {
    this.radius = radius;
  }

  get area() {
    return Number((Circle.#pi * this.radius ** 2).toFixed(2));
  }

  get diameter() {
    return this.radius * 2;
  }

  set diameter(d) {
    // 设直径时同步改半径 —— 典型的"带副作用的写入"
    this.radius = d / 2;
  }
}

console.log('Circle.PI =', Circle.PI);
const circle = new Circle(5);
console.log('r=5 时 area =', circle.area, '| diameter =', circle.diameter);
circle.diameter = 20;
console.log('设 diameter=20 后 radius =', circle.radius, '| area =', circle.area);

console.log('--- 7. 遍历与拷贝时的注意点 ---');

// 访问器属性在原型上，不可枚举（和类方法一样），
// 所以 for...in / Object.keys 在实例上不会看到它。
console.log('Object.keys(circle) =', JSON.stringify(Object.keys(circle)));

// JSON.stringify 和展开运算符都只处理"对象自有的可枚举属性"，
// 而类的访问器定义在原型上，所以它们不会出现在结果里。
console.log('JSON.stringify(circle) =', JSON.stringify(circle), '（area/diameter 被忽略）');
console.log('{...circle} =', JSON.stringify({ ...circle }), '（同上）');

// 但若访问器是"实例自有的"，JSON.stringify 就会调用 getter 把值取出来。
const withOwnAccessor = { name: '自有访问器示例' };
Object.defineProperty(withOwnAccessor, 'computed', {
  get() {
    return '我在 getter 里算出来的';
  },
  enumerable: true, // 只有可枚举才会被序列化
});
console.log('JSON.stringify(withOwnAccessor) =', JSON.stringify(withOwnAccessor));

console.log('\n全部演示完毕。');
