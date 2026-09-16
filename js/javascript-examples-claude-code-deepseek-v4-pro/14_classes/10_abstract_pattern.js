/**
 * ============================================================================
 * 知识点：抽象基类的模拟 —— new.target 与"禁止直接实例化"
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】进阶
 * 【前置知识】14_classes/09_instanceof_and_brands.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    有些基类的职责只是"规定子类必须实现哪些方法"，本身不应该被直接 new。
 *    Java/C# 用 abstract 关键字表达这个意思，但 JavaScript 没有 abstract。
 *    本节的"抽象模式"就是用运行时的检查来模拟它。
 *
 * 2. 为什么需要
 *    - 防止误用：直接 new 一个只有骨架的基类，往往会在后续调用中才炸，
 *      错误发现得越早越好。在构造函数里就拦住，报错位置最清晰。
 *    - 强制实现契约：子类忘了实现某方法时，给出明确的错误提示，
 *      而不是运行时抛出难以理解的 "xxx is not a function"。
 *    - 自我文档化：看到基类构造函数里的检查，读者立刻明白"这是抽象基类"。
 *
 * 3. 核心语法要点
 *    - new.target：只能在函数/类体内部使用。用 new 调用时它指向"正在被构造的类"，
 *      普通函数调用时是 undefined。**在继承场景下它指向最末端的子类**，
 *      这正是判断"是不是直接实例化了基类"的关键。
 *         抽象基类里写：if (new.target === Base) throw new TypeError(...)
 *      因为当 new Sub() 时，new.target 是 Sub，不等于 Base，检查通过。
 *    - 也可以用 this.constructor 判断，但它会被实例自有属性影响，不如 new.target 可靠。
 *    - 另一种常见做法：基类方法内部统一抛"未实现"错误，由子类覆写。
 *      两者通常配合使用：构造时拦住直接实例化，调用时拦住漏实现。
 *    - 更严格的做法是用私有字段做品牌：基类构造时检查子类是否已设置某个标记。
 *    - 抽象基类也可以是"仅作为接口"：所有方法都抛错。
 *
 * 4. 常见陷阱
 *    - new.target 检查写成 new.target !== this.constructor，在多层继承时会误判。
 *    - 在箭头函数里不能用 new.target（语法错误）。
 *    - 只在基类方法里抛错而不检查构造，会导致 new Base() 成功但后续才炸。
 *    - 有些团队用"Symbol 标记 + 注册表"实现抽象类，复杂度高，通常不值得。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/10_abstract_pattern.js
 *
 * 【预期输出】
 *   演示 new.target 的取值规律、抽象基类拦截直接实例化、
 *   以及"未实现方法"的统一报错。
 * ============================================================================
 */

console.log('--- 1. new.target 是什么 ---');

class Basic {
  constructor() {
    // new.target 在"用 new 调用"时是正在构造的类；不是 new 调用时是 undefined。
    console.log('  Basic 构造函数里 new.target =', new.target ? new.target.name : undefined);
  }
}

class Derived extends Basic {}

console.log('new Basic() 时：');
new Basic();

console.log('new Derived() 时（注意 new.target 是 Derived，不是 Basic）：');
new Derived();

// 不用 new 调用类本身就会先报错（见 01 节），所以这里不能直接 Basic()。
// 但用 Reflect.construct 可以指定 newTarget，用来"伪造"调用者：
console.log('Reflect.construct(Basic, [], Derived) 时：');
Reflect.construct(Basic, [], Derived);

console.log('--- 2. 抽象基类：禁止直接实例化 ---');

class AbstractShape {
  constructor() {
    // 关键判断：只有当"正在构造的类"就是 AbstractShape 本身时才拦。
    // new Circle() 时 new.target 是 Circle，所以不会被拦。
    if (new.target === AbstractShape) {
      throw new TypeError('AbstractShape 是抽象基类，不能直接实例化，请使用它的子类');
    }
    // 也可以拦"没有真正实现抽象方法"的子类：
    // 用一个标记字段，子类必须显式声明自己实现了。
    if (this.constructor === AbstractShape) {
      throw new TypeError('同上：this.constructor 也是 AbstractShape');
    }
  }

  // 抽象方法：基类给一个统一的"未实现"实现，子类必须覆写。
  area() {
    throw new Error(`子类 ${this.constructor.name} 必须实现 area() 方法`);
  }

  perimeter() {
    throw new Error(`子类 ${this.constructor.name} 必须实现 perimeter() 方法`);
  }

  // 模板方法：基类定义算法骨架，具体步骤交给子类实现。
  describe() {
    // 这里调用的是子类覆写后的 area/perimeter（多态）
    return `${this.constructor.name}：周长 ${this.perimeter()}，面积 ${this.area()}`;
  }
}

console.log('直接 new 抽象基类（try/catch 演示）：');
try {
  new AbstractShape();
} catch (err) {
  console.log('  报错类型：', err.constructor.name);
  console.log('  报错信息：', err.message);
}

console.log('--- 3. 正常子类可以实例化 ---');

class Circle extends AbstractShape {
  constructor(radius) {
    super(); // 此时 new.target 是 Circle，通过了检查
    this.radius = radius;
  }

  // 覆写抽象方法
  area() {
    return Number((Math.PI * this.radius ** 2).toFixed(3));
  }

  perimeter() {
    return Number((2 * Math.PI * this.radius).toFixed(3));
  }
}

class Rectangle extends AbstractShape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }

  area() {
    return this.width * this.height;
  }

  perimeter() {
    return 2 * (this.width + this.height);
  }
}

const circle = new Circle(3);
const rect = new Rectangle(4, 5);
console.log('圆形：', circle.describe());
console.log('矩形：', rect.describe());

console.log('--- 4. 漏实现抽象方法时会报错（try/catch 演示） ---');

// 子类只实现了 area，没实现 perimeter。
class BrokenShape extends AbstractShape {
  area() {
    return 1;
  }
}

const broken = new BrokenShape();
console.log('构造时不会报错（因为只检查了 new.target）：已创建实例');
try {
  // 直到调用模板方法时才暴露问题 —— 虽然晚了一点，但错误信息很明确。
  broken.describe();
} catch (err) {
  console.log('调用 describe() 报错：', err.constructor.name);
  console.log('  信息：', err.message);
}

console.log('--- 5. 更早发现漏实现：在构造时校验 ---');

// 想让错误更早暴露，可以在基类构造函数里主动检查"必须实现的方法"是否被覆写。
class StrictAbstractShape {
  constructor() {
    if (new.target === StrictAbstractShape) {
      throw new TypeError('StrictAbstractShape 不能直接实例化');
    }
    // 从基类原型上取"抽象方法名"清单，逐个检查子类是否覆写了。
    const required = StrictAbstractShape.requiredMethods;
    for (const name of required) {
      // 如果子类原型上找不到"自己的"实现，说明它没覆写。
      if (!Object.hasOwn(Object.getPrototypeOf(this), name)) {
        throw new TypeError(
          `子类 ${this.constructor.name} 必须实现抽象方法 ${name}()`,
        );
      }
    }
  }
}
// 抽象方法清单（放在类定义之后再挂，避免类体里写数组字段的干扰）
StrictAbstractShape.requiredMethods = ['area', 'perimeter'];

class GoodShape extends StrictAbstractShape {
  constructor(size) {
    super();
    this.size = size;
  }
  area() {
    return this.size ** 2;
  }
  perimeter() {
    return this.size * 4;
  }
}

class StillBrokenShape extends StrictAbstractShape {
  constructor() {
    super(); // 这里就会抛错
  }
  area() {
    return 0;
  }
  // 故意不写 perimeter
}

console.log('完整实现的子类：', new GoodShape(3).area(), new GoodShape(3).perimeter());
try {
  new StillBrokenShape();
} catch (err) {
  console.log('构造时就报错：', err.constructor.name);
  console.log('  信息：', err.message);
}

console.log('--- 6. 另一种套路：用"实现标记"做抽象契约 ---');

// 有些代码库用"必须设置某个私有/受保护标记"来表达抽象契约。
// 这里用 Symbol 作为标记，比字符串更不容易撞名。
const IMPLEMENTED = Symbol('implemented');

class Plugin {
  constructor() {
    if (new.target === Plugin) {
      throw new TypeError('Plugin 是抽象基类，请继承后使用');
    }
    if (this[IMPLEMENTED] !== true) {
      throw new TypeError(`子类 ${this.constructor.name} 必须在构造函数末尾调用 super 并标记已实现`);
    }
  }

  name() {
    throw new Error('未实现 name()');
  }

  run() {
    throw new Error('未实现 run()');
  }
}

class LoggerPlugin extends Plugin {
  constructor() {
    super();
    // 故意在 super() 之后才标记 —— 但父类构造时就会检查，所以这个写法会失败。
    // 正确做法是让基类检查"方法是否覆写"，或者用静态注册表。
  }
  name() {
    return 'logger';
  }
  run() {
    return '日志已记录';
  }
}

try {
  new LoggerPlugin();
} catch (err) {
  console.log('标记式契约报错（演示该套路对初始化顺序很敏感）：', err.constructor.name);
  console.log('  信息：', err.message);
}

// 一个更实用的变体：不检查标记，只在调用时检查，并把检查集中在一个入口。
class SafePlugin {
  constructor() {
    if (new.target === SafePlugin) {
      throw new TypeError('SafePlugin 是抽象基类，请继承后使用');
    }
    // 只要子类覆写了 name()，就认为它是"具体实现"
    if (this.name === SafePlugin.prototype.name) {
      throw new TypeError(`子类 ${this.constructor.name} 必须实现 name()`);
    }
  }
  name() {
    return '(抽象)';
  }
  run() {
    return `${this.name()} 执行完毕`;
  }
}

class RealPlugin extends SafePlugin {
  name() {
    return 'real-plugin';
  }
}

console.log('具体子类正常运行：', new RealPlugin().run());

console.log('--- 7. 三个方案对比小结 ---');

const summary = [
  '方案一 new.target 检查构造：零成本、报错最早，推荐作为默认做法。',
  '方案二 抽象方法抛错：实现最简单，但报错发生在调用时而非构造时。',
  '方案三 构造时校验方法是否被覆写：报错最早，但依赖方法清单，维护成本略高。',
];
for (const line of summary) console.log('  •', line);

console.log('\n全部演示完毕。');
