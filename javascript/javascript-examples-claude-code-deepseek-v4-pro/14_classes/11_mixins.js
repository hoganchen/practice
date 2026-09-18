/**
 * ============================================================================
 * 知识点：混入（mixin）—— 用 Object.assign 给原型"装配"能力
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】高级
 * 【前置知识】14_classes/10_abstract_pattern.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    混入（mixin）是一种"把一组方法复制到另一个类/对象上"的复用手段。
 *    JavaScript 的 class 只支持单继承（一个 extends），但现实中的能力
 *    常常是"横切"的：可序列化、可比较、可缓存、可打日志……
 *    混入用"复制方法"代替"继承"，从而绕开单继承的限制。
 *
 * 2. 为什么需要
 *    - 单继承不够用：class Dog extends Animal 之后，还想让它"可序列化"，
 *      但序列化能力不属于动物这条继承链。
 *    - 组合优于继承：能力可以自由拼装，不必为了复用而制造牵强的父类。
 *    - 避免"钻石问题"：多继承在 C++ 里带来歧义，混入采用"按顺序覆盖"的简单规则。
 *
 * 3. 核心语法要点
 *    - 最简形式：Object.assign(Target.prototype, mixinObject)
 *      —— 把混入对象上的所有**自有可枚举**属性（含方法）拷到目标原型上。
 *    - 函数式写法（推荐）：const Serializable = (Base) => class extends Base { ... }
 *      —— 返回"继承自 Base 并带上新方法"的新类，可以链式叠加：
 *          class Model extends Serializable(Comparable(Base)) {}
 *      这种写法叫"子类工厂"或"高阶类"，能用 super、能访问私有字段（在同一函数内）。
 *    - 混入只复制方法、不复制数据：不要把"共享状态"放进混入对象，
 *      否则所有使用者会共享同一份数据（应改用实例字段，见下方陷阱）。
 *    - 冲突处理：后混入的同名方法覆盖先混入的（Object.assign 的覆盖语义）。
 *    - 可以用 Object.defineProperty + getOwnPropertyDescriptors 保留
 *      getter/setter 等描述符信息（Object.assign 会把 getter 求值成普通值！）。
 *
 * 4. 常见陷阱
 *    - Object.assign 复制 getter 会"立即求值"，结果是共享的静态值而非访问器。
 *      正确做法：Object.defineProperties(target, Object.getOwnPropertyDescriptors(src))。
 *    - 混入对象里写了数组/对象字面量，所有实例共享同一份（经典污染）。
 *    - 混入的方法无法用 super 访问"原类的父类"，所以复杂场景应优先用子类工厂写法。
 *    - 混入链过深会让调试困难，方法来源难以追踪 —— 适度使用。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/11_mixins.js
 *
 * 【预期输出】
 *   演示 Object.assign 式混入、子类工厂式混入、能力叠加与冲突覆盖规则。
 * ============================================================================
 */

console.log('--- 1. 最简混入：Object.assign 到原型 ---');

// 混入对象：只放方法，不放数据（这是最重要的纪律）
const SerializableMixin = {
  toJSON() {
    // 遍历实例自有属性，生成普通对象
    const plain = {};
    for (const key of Object.keys(this)) {
      plain[key] = this[key];
    }
    return plain;
  },
  serialize() {
    // JSON.stringify 会调用对象上的 toJSON（如果存在）
    return JSON.stringify(this);
  },
};

class User {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  greet() {
    return `你好，${this.name}`;
  }
}

// 把混入的方法装配到 User.prototype 上
Object.assign(User.prototype, SerializableMixin);

const u = new User('张三', 28);
console.log('原本的能力：', u.greet());
console.log('混入的能力 toJSON() =', JSON.stringify(u.toJSON()));
console.log('混入的能力 serialize() =', u.serialize());
// 混入的方法就在原型上，和类自己的方法没有区别
console.log('toJSON 在 User.prototype 上吗？', Object.hasOwn(User.prototype, 'toJSON'));

console.log('--- 2. 混入里的数据会被所有实例共享（陷阱演示） ---');

const BuggyMixin = {
  // 严重错误示范：对象字面量会被"复制引用"，所有使用者共用同一个数组
  logs: [],
  addLog(entry) {
    this.logs.push(entry);
    return this;
  },
};

class ServiceA {}
class ServiceB {}
Object.assign(ServiceA.prototype, BuggyMixin);
Object.assign(ServiceB.prototype, BuggyMixin);

const sa = new ServiceA();
const sb = new ServiceA();
sa.addLog('A 的日志');
console.log('sa.logs =', JSON.stringify(sa.logs));
// sb 一个字都没记，却"看到"了 A 的日志 —— 因为它们在原型上共享同一个数组
console.log('sb.logs =', JSON.stringify(sb.logs));
console.log('是同一个数组吗？', ServiceA.prototype.logs === ServiceB.prototype.logs);

// 正确姿势：混入只提供方法，数据交给各实例自己的字段。
const CorrectMixin = {
  initLogs() {
    // 在实例上创建"自己的一份"
    this.logs = [];
    return this;
  },
  addLog(entry) {
    // 若实例还没初始化，就先补上
    if (!Object.hasOwn(this, 'logs')) this.logs = [];
    this.logs.push(entry);
    return this;
  },
};

class ServiceC {
  constructor(name) {
    this.name = name;
    this.initLogs();
  }
}
Object.assign(ServiceC.prototype, CorrectMixin);
const sc1 = new ServiceC('C1');
const sc2 = new ServiceC('C2');
sc1.addLog('只有 C1 有');
console.log('sc1.logs =', JSON.stringify(sc1.logs));
console.log('sc2.logs =', JSON.stringify(sc2.logs), '（互不影响）');

console.log('--- 3. 子类工厂式混入（推荐写法） ---');

// 这是 "mixin 作为函数" 的经典模式：
// 接收一个基类，返回一个继承了它、并额外带上方法的新类。
const Flyable = (Base) => class extends Base {
  fly() {
    return `${this.name} 在飞`;
  }
  land() {
    return `${this.name} 降落了`;
  }
};

const Swimmable = (Base) => class extends Base {
  swim() {
    return `${this.name} 在游`;
  }
};

class Creature {
  constructor(name) {
    this.name = name;
  }
  describe() {
    return `我是 ${this.name}`;
  }
}

// 能力叠加：把混入像积木一样嵌套组合
class Duck extends Swimmable(Flyable(Creature)) {
  quack() {
    return `${this.name}：嘎嘎`;
  }
}

const duck = new Duck('唐老鸭');
console.log(duck.describe());
console.log(duck.fly());
console.log(duck.swim());
console.log(duck.quack());
// instanceof 依然成立，因为混入是通过 extends 串起来的真实继承链
console.log('duck instanceof Duck =', duck instanceof Duck);
console.log('duck instanceof Creature =', duck instanceof Creature);
// 注意：每次调用 Flyable(Creature) 都会**新建一个匿名类**，
// 所以不能写成 duck instanceof Flyable(Creature) —— 那是另一条原型链。
console.log('再次调用 Flyable(Creature) 造出的类与本次不同吗？', Flyable(Creature) !== Flyable(Creature));

console.log('--- 4. 能力叠加链上的方法解析顺序 ---');

// 子类工厂会形成一个类链：Duck → Swimmable(..) → Flyable(..) → Creature
console.log('原型链：', (() => {
  const names = [];
  let cur = Object.getPrototypeOf(duck);
  while (cur !== null && cur !== Object.prototype) {
    names.push(cur.constructor.name || '(匿名混入类)');
    cur = Object.getPrototypeOf(cur);
  }
  names.push('Object.prototype');
  return names.join(' → ');
})());

console.log('--- 5. 冲突：同名方法谁赢 ---');

const MixinX = {
  whoAmI() {
    return '我来自 MixinX';
  },
  onlyX() {
    return '只有 X 有';
  },
};

const MixinY = {
  whoAmI() {
    return '我来自 MixinY';
  },
  onlyY() {
    return '只有 Y 有';
  },
};

class Target {
  whoAmI() {
    return '我来自类自身';
  }
}

console.log('类自身定义的方法优先：', new Target().whoAmI());

// 先混入 X，再混入 Y：Y 覆盖 X
Object.assign(Target.prototype, MixinX);
console.log('混入 X 之后：', new Target().whoAmI());
Object.assign(Target.prototype, MixinY);
console.log('再混入 Y 之后（Y 覆盖 X）：', new Target().whoAmI());
// 不冲突的方法都保留
const t = new Target();
console.log('不冲突的方法都可用：', t.onlyX(), '/', t.onlyY());

// 想保留被覆盖的版本，可以在覆盖前先存起来
const savedWhoAmI = Target.prototype.whoAmI;
Object.assign(Target.prototype, {
  whoAmI() {
    // 这里不能用 super（普通函数没有 [[HomeObject]]），改用"保存的引用"
    return `[Y 增强] ${savedWhoAmI.call(this)}`;
  },
});
console.log('手动保存旧版并增强：', new Target().whoAmI());

console.log('--- 6. getter/setter 混入：Object.assign 的陷阱 ---');

const WithAccessor = {
  _n: 0,
  get doubled() {
    return this._n * 2;
  },
};

// 错误做法：Object.assign 会"读取"getter，把访问器降级成普通数据属性。
// 而且读取时 getter 的 this 是**源对象** WithAccessor（_n 为 0），
// 不是目标对象，所以连值都是错的。
const badTarget = { _n: 21 };
Object.assign(badTarget, WithAccessor);
const badDesc = Object.getOwnPropertyDescriptor(badTarget, 'doubled');
console.log('assign 后 doubled 还是访问器吗？', typeof badDesc.get === 'function');
console.log('它变成数据属性了，值为：', badTarget.doubled, '（以源对象 WithAccessor._n=0 求值）');
badTarget._n = 100;
console.log('改变 _n 后 doubled 会变吗？', badTarget.doubled, '（不会，已固化成数据属性）');

// 正确做法：用描述符复制，访问器保持为访问器
const goodTarget = { _n: 21 };
Object.defineProperties(goodTarget, Object.getOwnPropertyDescriptors(WithAccessor));
const goodDesc = Object.getOwnPropertyDescriptor(goodTarget, 'doubled');
console.log('描述符复制后是访问器吗？', typeof goodDesc.get === 'function');
goodTarget._n = 100;
console.log('改变 _n 后 doubled 会跟着变吗？', goodTarget.doubled);

console.log('--- 7. 组合优于继承：一个更真实的小例子 ---');

// 三个独立能力
const Timestamped = (Base) => class extends Base {
  touch() {
    this.updatedAt = '刚刚';
    return this;
  }
  get touched() {
    return this.updatedAt !== undefined;
  }
};

const SoftDeletable = (Base) => class extends Base {
  remove() {
    this.deleted = true;
    return this;
  }
  restore() {
    this.deleted = false;
    return this;
  }
  get isDeleted() {
    return this.deleted === true;
  }
};

const Validatable = (Base) => class extends Base {
  validate() {
    // 简单的必填校验：子类通过 static required 声明必填字段
    const required = this.constructor.required || [];
    const missing = required.filter((f) => this[f] === undefined || this[f] === '');
    this.errors = missing.map((f) => `${f} 不能为空`);
    return this.errors.length === 0;
  }
};

class Document extends Validatable(SoftDeletable(Timestamped(Object))) {
  static required = ['title'];

  constructor(title) {
    super();
    this.title = title;
  }
  get summary() {
    return `${this.title}${this.isDeleted ? '（已删除）' : ''}`;
  }
}

const doc = new Document('季度报告');
console.log('初始：', doc.summary, '| 时间戳已打？', doc.touched);
doc.touch();
console.log('touch 之后 touched =', doc.touched);
console.log('校验通过吗？', doc.validate(), '| errors =', JSON.stringify(doc.errors));
doc.remove();
console.log('删除后：', doc.summary, '| isDeleted =', doc.isDeleted);
doc.restore();
console.log('恢复后：', doc.summary, '| isDeleted =', doc.isDeleted);

const emptyDoc = new Document('');
console.log('空标题校验：', emptyDoc.validate(), '| errors =', JSON.stringify(emptyDoc.errors));

// 每个能力都来自不同的"层"，互不干扰 —— 这就是组合优于继承的具体体现。
console.log('doc instanceof Document =', doc instanceof Document);
console.log('doc instanceof Object =', doc instanceof Object);

console.log('\n全部演示完毕。');
