/**
 * ============================================================================
 * 知识点：多态 —— 父类引用指向子类实例、方法重写、鸭子类型
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】进阶
 * 【前置知识】14_classes/07_inheritance_extends.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    多态（polymorphism）指"同一段代码，作用在不同类型的对象上，产生不同的行为"。
 *    JavaScript 里主要有两条实现路径：
 *      - 基于继承的**子类型多态**：以父类型编写代码，运行时传入任意子类实例，
 *        调用的方法由实例的真实类型决定（动态分派）；
 *      - 基于结构的**鸭子类型**（duck typing）：不关心对象的类型，只关心它
 *        "有没有这个方法"，有就调用。
 *
 * 2. 为什么需要
 *    - 消除长长的 if/else 分支：新增类型时只加一个类，不必改老代码（开闭原则）。
 *    - 依赖抽象而非具体：调用方只依赖接口（一组方法名），实现可以随便换。
 *    - 便于测试：可以传入一个"假的"实现（stub）替换真实对象。
 *
 * 3. 核心语法要点
 *    - 动态分派：obj.method() 时，引擎从 obj 开始沿原型链找方法，
 *      找到最先出现的那个 —— 所以子类的重写会"赢过"父类。
 *    - 关键点：**方法在哪里定义不重要，重要的是 this 指向谁**。
 *      父类方法内部调用 this.other() 时，走的也是子类的实现。
 *    - 模板方法模式：父类定义流程骨架（内部调用若干 this.xxx()），
 *      子类只实现其中几步。这是继承式多态最常见、最有用的形态。
 *    - 鸭子类型：只要对象满足"方法名与签名"，就能被当作该类型使用，
 *      不需要 extends，也不需要 instanceof 通过。
 *    - 接口的模拟：JS 没有 interface，靠约定 + 文档 + 运行时检查来表达。
 *
 * 4. 常见陷阱
 *    - 在父类构造函数里调用会被子类重写的方法（见 04 节的初始化顺序陷阱）。
 *    - 用 instanceof 分支代替多态，等于把类型判断散落各处，新增类型要改很多地方。
 *    - 鸭子类型不做校验时会拿到 "xxx is not a function" 这种难懂的报错，
 *      需要主动加友好的检查。
 *    - 箭头函数字段无法被 super 调用（不是原型方法），也无法用 super.method 重写链。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/14_polymorphism.js
 *
 * 【预期输出】
 *   演示继承式多态、模板方法、运行时替换实现，以及鸭子类型的使用与检查。
 * ============================================================================
 */

console.log('--- 1. 最直观的多态：同一个调用，不同结果 ---');

class Payment {
  constructor(amount) {
    this.amount = amount;
  }

  // 抽象方法：子类必须覆写
  pay() {
    throw new Error(`${this.constructor.name} 未实现 pay()`);
  }

  // 通用逻辑放在父类，复用给所有子类
  receipt() {
    // 注意：这里调用的是 this.pay() —— 运行时会走到子类实现，这就是动态分派
    return `【${this.constructor.name}】${this.pay()}，金额 ${this.amount} 元`;
  }
}

class Alipay extends Payment {
  pay() {
    return '扫码支付成功';
  }
}

class WechatPay extends Payment {
  pay() {
    return '微信支付成功';
  }
}

class CreditCard extends Payment {
  // 子类自己多加一层状态处理
  constructor(amount, cardNo) {
    super(amount);
    this.cardNo = cardNo;
  }
  pay() {
    return `信用卡 ${this.cardNo.slice(-4)} 扣款成功`;
  }
}

// 调用方只依赖父类 Payment 的接口（receipt / pay），
// 完全不知道具体是哪种支付方式 —— 这就是"面向抽象编程"。
const payments = [new Alipay(100), new WechatPay(200), new CreditCard(300, '6222****1234')];

console.log('用同一个循环处理所有支付方式：');
for (const p of payments) {
  // 同一行代码，三种不同行为
  console.log('  •', p.receipt());
}

console.log('--- 2. 动态分派：方法是从实例开始沿原型链找的 ---');

const ali = new Alipay(50);
// pay 在 Alipay.prototype 上找到，就不会再去 Payment.prototype 找
console.log('ali.pay() =', ali.pay());
console.log('AliPay.prototype 上有 pay 吗？', Object.hasOwn(Alipay.prototype, 'pay'));
console.log('Payment.prototype 上也有 pay 吗？', Object.hasOwn(Payment.prototype, 'pay'));
console.log('找的是最近的一个，所以子类版本生效。');

console.log('--- 3. 运行时替换实现：多态的真正威力 ---');

class Notifier {
  send(message) {
    return `[默认通道] ${message}`;
  }
}

const notifier = new Notifier();
console.log('原实现：', notifier.send('部署完成'));

// 直接在实例上放一个同名方法，就会"遮蔽"原型上的实现。
// 这正是控制反转 / 依赖注入的朴素形态：调用方代码一行都不用改。
notifier.send = function customSend(message) {
  return `[测试替身] 记录到数组：${message}`;
};
console.log('替换实例方法后：', notifier.send('部署完成'));

// 也可以替换整个原型的实现，影响所有实例
const originalSend = Notifier.prototype.send;
Notifier.prototype.send = function loggedSend(message) {
  return `[带日志] ${originalSend.call(this, message)}`;
};
console.log('替换原型方法后（新实例）：', new Notifier().send('部署完成'));
// 刚才那个实例的自有方法仍然优先
console.log('之前那个实例仍用自己的实现：', notifier.send('部署完成'));

console.log('--- 4. 模板方法模式：父类定流程，子类填细节 ---');

class DataImporter {
  // 模板方法：定义固定流程，子类无法轻易改变顺序
  import(rawText) {
    const steps = [];
    steps.push(`① 解析：${this.parse(rawText)}`);
    steps.push(`② 校验：${this.validate() ? '通过' : '失败'}`);
    steps.push(`③ 转换：${this.transform()}`);
    steps.push(`④ 保存：${this.save()}`);
    return steps.join('\n    ');
  }

  // 以下方法由子类实现（这里给出兜底实现，便于提示）
  parse() {
    throw new Error('parse() 未实现');
  }
  validate() {
    return true; // 默认通过，子类可覆盖
  }
  transform() {
    throw new Error('transform() 未实现');
  }
  save() {
    throw new Error('save() 未实现');
  }
}

class CsvImporter extends DataImporter {
  #rows = [];

  parse(text) {
    this.#rows = text.trim().split('\n').map((line) => line.split(','));
    return `${this.#rows.length} 行 CSV`;
  }
  validate() {
    // 每行必须有 2 列
    return this.#rows.every((row) => row.length === 2);
  }
  transform() {
    return JSON.stringify(
      this.#rows.map(([name, age]) => ({ name, age: Number(age) })),
    );
  }
  save() {
    return '已写入 CSV 目标表';
  }
}

class JsonImporter extends DataImporter {
  #data = null;

  parse(text) {
    // 解析失败时用 try/catch 兜底，不让整个流程崩掉
    try {
      this.#data = JSON.parse(text);
      return `对象，含 ${Object.keys(this.#data).length} 个键`;
    } catch {
      this.#data = null;
      return 'JSON 解析失败';
    }
  }
  validate() {
    return this.#data !== null;
  }
  transform() {
    return JSON.stringify(this.#data);
  }
  save() {
    return '已写入 JSON 目标表';
  }
}

console.log('CSV 导入流程：');
console.log('    ', new CsvImporter().import('张三,28\n李四,32'));
console.log('JSON 导入流程：');
console.log('    ', new JsonImporter().import('{"a":1,"b":2}'));
console.log('JSON 解析失败的流程：');
console.log('    ', new JsonImporter().import('这不是 JSON'));

console.log('--- 5. 鸭子类型：不看类型，只看能力 ---');

// 这个函数不接受任何"类型"约束，只要对象有 area() 就能用。
function printArea(shapeLike) {
  // 主动做一次友好检查，避免难懂的报错
  if (typeof shapeLike?.area !== 'function') {
    throw new TypeError('参数必须提供 area() 方法');
  }
  return `面积 = ${shapeLike.area()}`;
}

// 1) 类的实例
class Circle {
  constructor(r) {
    this.r = r;
  }
  area() {
    return Number((Math.PI * this.r ** 2).toFixed(2));
  }
}
// 2) 一个普通对象字面量 —— 没有继承任何类，照样能用
const squareLike = {
  side: 4,
  area() {
    return this.side ** 2;
  },
};
// 3) 一个"动态生成"的对象
const triangleLike = {};
triangleLike.area = function area() {
  return 0.5 * 3 * 4;
};

console.log('类的实例：', printArea(new Circle(2)));
console.log('普通对象字面量：', printArea(squareLike), '| instanceof Circle =', squareLike instanceof Circle);
console.log('动态拼装的对象：', printArea(triangleLike));

try {
  printArea({ name: '没有 area 的对象' });
} catch (err) {
  console.log('缺少方法时报错：', err.constructor.name, '—', err.message);
}

console.log('--- 6. 多态 + 鸭子类型：一个可插拔的处理器注册表 ---');

// 用"注册表"模式代替 switch：新增类型只需要注册一次。
class EventBus {
  #handlers = new Map();

  on(eventName, handler) {
    // 只要求 handler "能干活"：
    //   - 直接传函数：函数本身就是处理器；
    //   - 传对象：只要它有 handle() 方法就行（鸭子类型）。
    if (typeof handler === 'function') {
      this.#handlers.set(eventName, handler);
    } else if (handler !== null && typeof handler?.handle === 'function') {
      // 把 handle 绑定到对象本身，确保方法内的 this 正确
      this.#handlers.set(eventName, handler.handle.bind(handler));
    } else {
      throw new TypeError(`事件 ${eventName} 的处理器必须是函数，或提供 handle() 方法的对象`);
    }
    return this;
  }

  emit(eventName, payload) {
    const fn = this.#handlers.get(eventName);
    if (!fn) {
      console.log(`  (没有处理 ${eventName} 的处理器，忽略)`);
      return undefined;
    }
    return fn(payload);
  }
}

const bus = new EventBus();

// 处理器 1：普通函数
bus.on('user.created', (user) => `给 ${user.name} 发送欢迎邮件`);

// 处理器 2：带 handle() 的对象（鸭子类型）—— 没继承任何类，照样能用
const auditLogger = {
  handle(event) {
    return `审计日志：收到事件 ${JSON.stringify(event)}`;
  },
};
bus.on('user.updated', auditLogger);

// 处理器 3：类实例（有 handle 方法）
class MetricsCollector {
  constructor(prefix) {
    this.prefix = prefix;
  }
  handle(event) {
    return `${this.prefix} 计数 +1（事件：${Object.keys(event).join('/')}）`;
  }
}
bus.on('user.deleted', new MetricsCollector('[指标]'));

console.log('触发 user.created（处理器是普通函数）：', bus.emit('user.created', { id: 1, name: '张三' }));
console.log('触发 user.updated（处理器是普通对象）：', bus.emit('user.updated', { id: 1, name: '张三' }));
console.log('触发 user.deleted（处理器是类实例）：', bus.emit('user.deleted', { id: 2 }));
console.log('触发未注册事件：');
bus.emit('order.paid', { id: 3 });

console.log('--- 7. 反例：用 instanceof 分支代替多态 ---');

// 反面写法：每加一种形状，都要回来改这个函数。
function badArea(shape) {
  if (shape instanceof Circle) return shape.area();
  if (shape.type === 'square') return shape.side ** 2;
  // 再加一个类型就要再加一个分支……
  throw new Error('未知形状');
}

// 正面写法：调用方只调用 area()，新增类型无需改这里。
function goodArea(shape) {
  return shape.area();
}

console.log('反面写法：', badArea(new Circle(1)), badArea({ type: 'square', side: 3 }));
console.log('正面写法：', goodArea(new Circle(1)), goodArea(squareLike));
console.log('正面写法对"未来新增的类型"同样开箱即用。');

console.log('--- 8. 继承式多态与鸭子类型的取舍 ---');

const tradeoffs = [
  '继承式多态：有 instanceof 与类型提示，IDE 友好；但被继承链绑住。',
  '鸭子类型：组合自由、易于替换与测试；但缺少编译期/静态约束，需运行时校验。',
  '实践建议：内部实现优先多态；跨模块边界提供清晰的方法契约与友好报错。',
];
for (const line of tradeoffs) console.log('  •', line);

console.log('\n全部演示完毕。');
