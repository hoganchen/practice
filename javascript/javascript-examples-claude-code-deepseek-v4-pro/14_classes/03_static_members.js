/**
 * ============================================================================
 * 知识点：静态成员 —— static 方法、static 属性、static {} 静态块
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】入门
 * 【前置知识】14_classes/02_instance_methods.js
 *
 * 【也见】34_modern_es_features/02_es2022_features.js —— ES2022 特性综述里也讲了静态块。
 *        本文件是 static 成员的主场（专文）；那篇只给最小示例，细节以本文为准。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    用 static 关键字修饰的成员属于"类本身"，而不属于实例。
 *    调用方式是把类名当对象用：Foo.bar()、Foo.count；实例上访问不到。
 *
 * 2. 为什么需要
 *    - 工具函数：与具体实例无关的计算，例如 Math.max 就是静态方法。
 *    - 工厂方法：User.fromJSON(obj) 这类"用别的形式造实例"的入口。
 *    - 类级别的状态：实例总数统计、全局配置、缓存。
 *    - static {} 静态块：需要在类定义时执行一段初始化逻辑（可以带 try/catch、
 *      可以访问类内的私有字段），这是 ES2022 引入的语法。
 *
 * 3. 核心语法要点
 *    - static 方法：static foo() {}，写在类体里，this 指向类本身（不是实例）。
 *    - static 字段：static bar = 1，属于类对象的自有属性。
 *    - static 块：static { ... }，类定义时按书写顺序执行一次；
 *      一个类可以写多个 static 块，它们与 static 字段按出现顺序依次执行。
 *    - 继承时：静态成员会沿"类与类之间的原型链"被继承，
 *      即 Child.__proto__ === Parent，所以 Child.foo() 能找到 Parent 的 static foo。
 *    - class 的静态成员可以用 super 在子类静态方法中调用（super.foo()）。
 *
 * 4. 常见陷阱
 *    - 在静态方法里把 this 当成实例：this 其实是类本身。
 *    - 在实例方法里直接写 this.静态属性：拿不到，因为静态成员不在原型链上。
 *    - static 字段的初始化顺序：按书写顺序，且父类静态块先于子类静态块执行。
 *    - 静态方法里的 this 是"动态"的：Child.method() 中的 this 是 Child 而不是 Parent，
 *      这一点在写工厂方法时非常有用（见下方 from 的例子）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/03_static_members.js
 *
 * 【预期输出】
 *   演示静态方法与静态字段的调用方式，并用静态块完成一次注册与校验。
 * ============================================================================
 */

console.log('--- 1. 静态方法：属于类，不属于实例 ---');

class MathUtil {
  // 静态方法：调用时写成 MathUtil.add(1, 2)
  static add(a, b) {
    // 注意：这里的 this 是 MathUtil 这个"类对象"，而不是某个实例。
    // 因此不能在静态方法里访问 this.someInstanceField。
    return a + b;
  }

  static clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // 对比：普通实例方法
  instanceOnly() {
    return '我是实例方法';
  }
}

console.log('MathUtil.add(1, 2) =', MathUtil.add(1, 2));
console.log('MathUtil.clamp(15, 0, 10) =', MathUtil.clamp(15, 0, 10));

// 静态方法不在原型上，所以实例访问不到。
const mu = new MathUtil();
console.log('实例上能拿到 add 吗？', typeof mu.add);
console.log('实例方法可以正常调用：', mu.instanceOnly());

console.log('--- 2. 静态字段：类对象自己的属性 ---');

class Counter {
  // 静态字段：属于类本身的数据，全类共享一份。
  // 用 # 前缀就是静态私有字段（见 05_private_fields.js）。
  static total = 0;

  // 也可以有静态常量
  static DEFAULT_STEP = 1;

  constructor(step = Counter.DEFAULT_STEP) {
    this.step = step;
    this.value = 0;
    // 每创建一个实例，就把类级别的计数器加一。
    // 这里访问静态字段必须写 类名.字段名，写 this.total 会得到 undefined。
    Counter.total += 1;
  }

  add() {
    this.value += this.step;
    return this;
  }
}

const a = new Counter();
const b = new Counter(5);
const c = new Counter(10);
console.log('创建了 3 个实例后 Counter.total =', Counter.total);
console.log('实例自己的值：', a.value, b.add().value, c.add().value);

// 证明静态字段不在实例上：
console.log('a 自己有 total 吗？', Object.hasOwn(a, 'total'));
console.log('Counter 自己有 total 吗？', Object.hasOwn(Counter, 'total'));

console.log('--- 3. 静态方法中的 this 指向"当前类" ---');

class Animal {
  static category = '动物';
  // 这个静态字段只有父类有，子类没有自己的版本，用来演示"静态成员继承"。
  static kingdom = '动物界';

  // 工厂方法：根据描述创建实例。
  // 注意这里用 this 而不是 Animal，这样在子类上调用时 this 就是子类，
  // new this(...) 会创建出正确子类型的实例 —— 这是静态方法最实用的技巧之一。
  static create(name) {
    return new this(name, this.category);
  }

  constructor(name, category = '动物') {
    this.name = name;
    this.category = category;
  }

  describe() {
    return `${this.name} 属于「${this.category}」`;
  }
}

class Dog extends Animal {
  static category = '犬科';

  bark() {
    return `${this.name}：汪汪！`;
  }
}

const generic = Animal.create('某种生物');
const dog = Dog.create('旺财'); // this 是 Dog，所以创建出 Dog 实例

console.log(generic.describe());
console.log(dog.describe(), '|', dog.bark());
console.log('Dog.create 返回的是 Dog 实例吗？', dog instanceof Dog);

console.log('--- 4. 静态成员会被继承（沿类与类的原型链） ---');

// 子类的 [[Prototype]] 指向父类，所以子类可以"看见"父类的静态成员。
console.log('Object.getPrototypeOf(Dog) === Animal ？', Object.getPrototypeOf(Dog) === Animal);
// kingdom 只在 Animal 上定义，Dog 自己没有 —— 但 Dog.kingdom 依然能读到，
// 说明静态成员确实沿"类之间的原型链"被继承了。
console.log('Dog.kingdom 读到的值（继承自父类）：', Dog.kingdom);
console.log('Dog 自己有 kingdom 吗？', Object.hasOwn(Dog, 'kingdom'));
console.log('沿原型链能找到吗？', 'kingdom' in Dog);
// 对比：category 被子类自己重新定义了一份，这叫静态成员遮蔽。
console.log('Dog.category =', Dog.category, '，Dog 自己有 category 吗？', Object.hasOwn(Dog, 'category'));
console.log('Animal.category =', Animal.category);

console.log('--- 5. static {} 静态块 ---');

// 静态块在"类定义求值"时执行一次，可以写复杂逻辑、可以 try/catch、
// 也能访问类的私有成员（这是它相对"类外赋值"的主要优势）。
const initLog = [];

class Config {
  static values = {};

  // 第一个静态块
  static {
    initLog.push('静态块 1 开始');
    // 需要容错的初始化逻辑放在这里非常合适，不会把整个模块搞崩。
    try {
      // 模拟读取一份配置
      Config.values = { host: 'localhost', port: 8080 };
      initLog.push('配置加载成功');
    } catch (err) {
      Config.values = {};
      initLog.push(`配置加载失败：${err.message}`);
    }
  }

  // 可以写多个静态块，它们按书写顺序执行。
  static {
    initLog.push('静态块 2 开始');
    // 静态块与静态字段按出现顺序执行，所以这里能读到上面的 values。
    Config.values.port += 1;
    initLog.push(`端口自增后为 ${Config.values.port}`);
  }

  static describe() {
    return `host=${Config.values.host}, port=${Config.values.port}`;
  }
}

console.log('静态块执行轨迹：');
for (const line of initLog) console.log('  •', line);
console.log('最终配置：', Config.describe());

console.log('--- 6. 静态块与实例数量的配合 ---');

class Registry {
  static #items = []; // 静态私有字段，外部无法直接访问

  static {
    // 静态块可以访问私有静态字段
    Registry.#items.push({ name: '默认条目', builtin: true });
    console.log('静态块已预置 1 条默认数据');
  }

  static register(name) {
    // 静态方法同样可以访问私有静态字段
    Registry.#items.push({ name, builtin: false });
    return this;
  }

  static list() {
    return Registry.#items.map((it) => `${it.name}${it.builtin ? '(内置)' : ''}`).join(', ');
  }
}

Registry.register('第一项').register('第二项');
console.log('注册表内容：', Registry.list());
console.log('外部能读 #items 吗？', '#items' in Registry);

console.log('\n全部演示完毕。');
