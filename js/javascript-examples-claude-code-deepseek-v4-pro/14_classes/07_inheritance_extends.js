/**
 * ============================================================================
 * 知识点：继承 —— extends、super()、super.method()、继承链
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】进阶
 * 【前置知识】14_classes/06_getters_setters.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    extends 让一个类继承另一个类：子类自动获得父类的所有实例方法与原型属性，
 *    并可以增加或重写自己的成员。JavaScript 的继承基于原型链，extends 只是
 *    把"子类.prototype 的原型指向父类.prototype"这一步自动化了。
 *
 * 2. 为什么需要
 *    - 复用：公共行为写在父类，子类只写差异部分。
 *    - 多态：以父类型编写的代码可以处理任意子类型（见 14_polymorphism.js）。
 *    - 语义建模："狗是一种动物"，代码结构与领域模型对应。
 *
 * 3. 核心语法要点
 *    - class Child extends Parent { ... }
 *    - super(...)：在子类构造函数里调用父类构造函数。规则很硬：
 *        ① 派生类（有 extends 的类）如果写了 constructor，就必须调用 super()，
 *           否则创建实例时抛 ReferenceError；
 *        ② 而且必须在访问 this 之前调用，因为 this 是 super() 创建出来的；
 *        ③ 不写 constructor 时引擎自动补一个 constructor(...args) { super(...args); }
 *    - super.method()：调用父类原型上的同名方法，常用于"扩展而非替换"父类行为。
 *    - 静态方法里也可以用 super.method()，此时沿的是"类与类之间的原型链"。
 *    - 访问器（get/set）同样会被继承，可以在子类重写。
 *    - 构造函数可以被重写，也可以定义同名字段覆盖父类字段。
 *
 * 4. 常见陷阱
 *    - 在 super() 之前使用 this：抛 ReferenceError。
 *    - 派生类构造函数里没调用 super()：抛 ReferenceError。
 *    - 认为"原型链是 Child.prototype → Parent"：少了一层，实际是
 *      child 实例 → Child.prototype → Parent.prototype → Object.prototype → null。
 *    - 字段覆盖：子类用同名字段会遮蔽父类字段，且初始化顺序是"父类字段先、子类字段后"
 *      （详见 04 节）。
 *    - 私有字段不被继承，子类无法访问父类的 #field（详见 05 节）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/07_inheritance_extends.js
 *
 * 【预期输出】
 *   演示三层继承链、super 的两种用法、自动补全构造函数，以及常见报错。
 * ============================================================================
 */

console.log('--- 1. 第一层继承：extends 与 super() ---');

class Animal {
  constructor(name, sound) {
    this.name = name;
    this.sound = sound;
  }

  speak() {
    return `${this.name} 发出「${this.sound}」`;
  }

  toString() {
    return `[Animal ${this.name}]`;
  }
}

class Dog extends Animal {
  constructor(name) {
    // super(...) 调用父类构造函数，由它来给 this 装 name/sound。
    // 这一句同时也"创建"了 this —— 在此之前 this 不可用。
    super(name, '汪汪');
    // 之后才能访问 this，追加子类特有的数据。
    this.legs = 4;
  }

  // 新增方法：父类没有
  fetch() {
    return `${this.name} 把球叼回来了`;
  }

  // 重写（override）：同签名的方法会遮盖父类的版本
  speak() {
    // super.method() 调用父类的同名实现，做到"在父类行为上追加"
    return `${super.speak()}（而且很开心）`;
  }
}

const d = new Dog('旺财');
// speak 走的是 Dog 的版本
console.log('d.speak() =', d.speak());
// fetch 只有子类有
console.log('d.fetch() =', d.fetch());
// 父类的属性照样在
console.log('d.name =', d.name, '| d.legs =', d.legs);

console.log('--- 2. 不写 constructor 时会被自动补全 ---');

class Cat extends Animal {
  // 没有写 constructor，引擎自动补成：
  //   constructor(...args) { super(...args); }
  // 所以可以直接透传参数。
  purr() {
    return `${this.name} 咕噜咕噜`;
  }
}

const cat = new Cat('咪咪', '喵');
console.log('cat.speak() =', cat.speak());
console.log('cat.purr() =', cat.purr());

console.log('--- 3. 继承链到底长什么样 ---');

// 从上往下看：实例 → 子类原型 → 父类原型 → Object.prototype → null
console.log('Object.getPrototypeOf(d) === Dog.prototype ？', Object.getPrototypeOf(d) === Dog.prototype);
console.log(
  'Object.getPrototypeOf(Dog.prototype) === Animal.prototype ？',
  Object.getPrototypeOf(Dog.prototype) === Animal.prototype,
);
console.log(
  'Object.getPrototypeOf(Animal.prototype) === Object.prototype ？',
  Object.getPrototypeOf(Animal.prototype) === Object.prototype,
);
console.log('原型链的终点：', Object.getPrototypeOf(Object.prototype));

// 类与类之间也有一条原型链（用于继承静态成员）
console.log('Object.getPrototypeOf(Dog) === Animal ？', Object.getPrototypeOf(Dog) === Animal);

// 沿链查找一个方法，能在哪一层找到？
console.log('speak 在 Dog.prototype 上吗？', Object.hasOwn(Dog.prototype, 'speak'));
console.log('speak 在 Animal.prototype 上吗？', Object.hasOwn(Animal.prototype, 'speak'));
console.log('fetch 在 Animal.prototype 上吗？', Object.hasOwn(Animal.prototype, 'fetch'));
console.log('toString 在哪一层？Object.prototype 上：', Object.hasOwn(Object.prototype, 'toString'));

console.log('--- 4. 三层继承 ---');

class Puppy extends Dog {
  constructor(name, ageInMonths) {
    // 这一句会一路往上：Puppy → Dog → Animal
    super(name);
    this.ageInMonths = ageInMonths;
  }

  speak() {
    // super.speak() 调用 Dog 的 speak，Dog 内部又 super.speak() 调到 Animal 的，
    // 所以一次调用串起了三层实现。
    return `${super.speak()}（幼犬 ${this.ageInMonths} 个月大）`;
  }
}

const puppy = new Puppy('小豆', 3);
console.log('puppy.speak() =', puppy.speak());
console.log('puppy.fetch() 继承自 Dog：', puppy.fetch());
console.log('puppy instanceof Puppy/Dog/Animal：', puppy instanceof Puppy, puppy instanceof Dog, puppy instanceof Animal);

console.log('--- 5. 访问器也会被继承与重写 ---');

class Shape {
  constructor(kind) {
    this.kind = kind;
  }
  get area() {
    return 0;
  }
  get description() {
    return `${this.kind}，面积 ${this.area}`;
  }
}

class Square extends Shape {
  constructor(side) {
    super('正方形');
    this.side = side;
  }
  get area() {
    // 覆盖父类的 area；父类的 description 里读 this.area 时会走到这里（多态）
    return this.side ** 2;
  }
}

const sq = new Square(4);
// description 定义在父类，但它内部读的 this.area 是子类实现 —— 这就是多态的基础
console.log('sq.area =', sq.area);
console.log('sq.description =', sq.description);

console.log('--- 6. 静态方法的继承与 super ---');

class Base {
  static identify() {
    return `我是 ${this.name}`; // this 是调用方那个类
  }
  static info() {
    return 'Base 的静态信息';
  }
}

class Sub extends Base {
  static info() {
    // 静态方法里的 super 沿"类之间的原型链"找，即 Sub.__proto__ === Base
    return `Sub 扩展：${super.info()}`;
  }
}

console.log('Base.identify() =', Base.identify());
console.log('Sub.identify() =', Sub.identify());
console.log('Sub.info() =', Sub.info());

console.log('--- 7. super() 使用错误会报错（try/catch 演示） ---');

// 7.1 在 super() 之前访问 this
class BadOrder extends Animal {
  constructor(name) {
    try {
      // 这一行会抛错，this 还不存在
      this.early = true;
    } catch (err) {
      // 把错误信息暂存起来，稍后打印（不能在 catch 里 return 之外访问 this）
      BadOrder.lastError = err;
    }
    super(name, '咕');
  }
}
const badOrder = new BadOrder('测试');
console.log('super() 之前用 this 报错：', BadOrder.lastError.constructor.name);
console.log('  信息：', BadOrder.lastError.message);
console.log('修正后对象仍能正常创建：', badOrder.speak());

// 7.2 派生类构造函数里完全不调用 super()
class NoSuper extends Animal {
  constructor(name) {
    // 故意不写 super()，用 try/catch 包住 new 来演示
    this.name = name;
  }
}
try {
  new NoSuper('张三');
} catch (err) {
  console.log('不调用 super() 报错：', err.constructor.name);
  console.log('  信息：', err.message);
}

console.log('--- 8. 子类覆盖字段时的初始化顺序 ---');

class FieldBase {
  type = 'base';
  label = `label(${this.type})`;
}
class FieldChild extends FieldBase {
  // 同名字段会覆盖父类的同名属性，且子类字段在父类之后初始化。
  type = 'child';
}

const fc = new FieldChild();
console.log('type =', fc.type);
// label 是父类字段初始化器算出来的，那时 this.type 还是 'base'
console.log('label =', fc.label, '（父类初始化时读到的是旧值）');

console.log('\n全部演示完毕。');
