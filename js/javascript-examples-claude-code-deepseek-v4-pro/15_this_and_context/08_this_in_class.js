/**
 * ============================================================================
 * 知识点：类中的 this —— 类方法、类字段箭头函数、私有方法
 * ============================================================================
 *
 * 【所属分类】15_this_and_context —— this 与执行上下文
 * 【难度等级】进阶
 * 【前置知识】15_this_and_context/07_this_in_callbacks.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    class 里的 this 同样遵循 four 规则，但有几点是类特有的：
 *      - 类体无条件严格模式，所以默认绑定下 this 是 undefined；
 *      - 类方法定义在原型上，调用时 this 由"谁调用"决定，容易在提取后丢失；
 *      - 类字段（实例字段）中的箭头函数在**实例创建时**求值，
 *        this 固定为新实例，且每个实例各有一份；
 *      - 派生类构造函数必须 super() 之后才能用 this。
 *
 * 2. 为什么需要
 *    - React 类组件时代，"把方法当回调传给 onClick"是最常见的 this 事故来源，
 *      箭头函数字段就是为解决它而普及的。
 *    - 理解原型方法与箭头字段的内存差异，有助于在大型应用中做取舍。
 *
 * 3. 核心语法要点
 *    - 原型方法：method() {} → 在 Class.prototype 上，所有实例共享一份。
 *    - 箭头函数字段：method = () => {} → 在实例自身上，每个实例一份，
 *      this 永远是创建它的那个实例（无法被 call/apply/bind 改变）。
 *    - 私有方法：#method() {} → 在类体外不可见，但 this 规则与普通方法相同；
 *      私有方法提取后同样会丢 this，需要用箭头私有字段或 bind 修复。
 *    - 静态方法中的 this 是"类本身"（且是动态的，子类调用时是子类）。
 *    - 构造函数中 super() 之前访问 this 会抛 ReferenceError。
 *    - 类字段初始化器里的 this 就是正在构造的实例（可用于箭头函数字段）。
 *
 * 4. 常见陷阱
 *    - 把原型方法直接传出去（setTimeout / 事件 / 数组回调）→ this 丢失。
 *    - 以为箭头函数字段会共享 —— 实际每个实例一份，实例多时内存开销明显。
 *    - 用箭头函数字段去重写父类方法：**不能调用 super**（箭头函数没有 [[HomeObject]]），
 *      会导致父类实现无法复用。
 *    - 私有方法被传出去后 this 丢失，且报错信息不如公有方法直观。
 *    - 在字段初始化器里访问尚未初始化的其它字段（顺序问题，见 14 章 04 节）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 15_this_and_context/08_this_in_class.js
 *
 * 【预期输出】
 *   对比原型方法与箭头字段在"提取后调用"时的表现，并演示私有方法、
 *   静态方法中的 this 以及内存占用的差异。
 * ============================================================================
 */

console.log('--- 1. 原型方法：this 由调用方式决定 ---');

class Counter {
  constructor(label) {
    this.label = label;
    this.value = 0;
  }

  // 原型方法（所有实例共享一份）
  increment() {
    this.value += 1;
    return this.value;
  }

  describe() {
    return `${this.label} = ${this.value}`;
  }
}

const c = new Counter('计数器');
// 正常调用：this 是实例
console.log('c.increment() →', c.increment());
console.log('c.describe() →', c.describe());

// 提取后调用：this 丢失
const inc = c.increment;
try {
  inc();
} catch (err) {
  console.log('提取 increment 后调用报错：', err.constructor.name, '—', err.message);
}

// 证明所有实例共享同一个方法函数
const c2 = new Counter('计数器2');
console.log('两个实例共享 increment 吗？', c.increment === c2.increment);

console.log('--- 2. 箭头函数字段：this 在创建时被固定 ---');

class SafeCounter {
  value = 0;

  constructor(label) {
    this.label = label;
  }

  // 箭头函数字段：在实例创建时求值，this 就是该实例
  increment = () => {
    this.value += 1;
    return this.value;
  };

  // 对比：原型方法
  describe() {
    return `${this.label} = ${this.value}`;
  }
}

const sc = new SafeCounter('安全计数器');
console.log('直接调用 →', sc.increment());
const detachedInc = sc.increment; // 提取出来
console.log('提取后调用 →', detachedInc(), '（依然正常）');
console.log('用 call 强行改 this 也无效 →', detachedInc.call({ value: 999 }));
console.log('实例没有被改坏：', sc.describe());

// 每个实例各有一份箭头函数
const sc2 = new SafeCounter('安全计数器2');
console.log('两个实例共享 increment 吗？', sc.increment === sc2.increment, '（各有一份）');
console.log('increment 是实例自有属性吗？', Object.hasOwn(sc, 'increment'));
console.log('原型上有 increment 吗？', Object.hasOwn(SafeCounter.prototype, 'increment'));

console.log('--- 3. 内存差异：什么时候该用哪一种 ---');

// 用一个粗略的对比说明"每实例一份函数"的开销
function sizeOfInstance(instance) {
  // 只统计自有属性名（函数对象本身的大小无法精确测量，这里看数量）
  return Object.getOwnPropertyNames(instance).length;
}
const protoStyle = new Counter('原型风格');
const fieldStyle = new SafeCounter('字段风格');
console.log('原型风格的实例自有属性数：', sizeOfInstance(protoStyle), '（只有 label、value）');
console.log('字段风格的实例自有属性数：', sizeOfInstance(fieldStyle), '（多了 increment 函数）');
console.log('结论：实例数量大时优先用原型方法；需要独立传递的少量回调用箭头字段。');

console.log('--- 4. 私有方法：this 规则与公有方法一致 ---');

class Wallet {
  #balance = 0;

  constructor(owner) {
    this.owner = owner;
  }

  // 私有方法（this 逻辑与普通原型方法相同）
  #format(amount) {
    return `¥${amount.toFixed(2)}`;
  }

  // 私有箭头函数字段：this 固定为实例
  #log = (action) => {
    // 可以直接访问其它私有字段
    this.history = this.history ?? [];
    this.history.push(`${action} → 余额 ${this.#balance}`);
    return this.history.length;
  };

  deposit(amount) {
    this.#balance += amount;
    this.#log(`存入 ${amount}`);
    return this.#format(this.#balance);
  }

  // 把私有方法暴露出去（演示丢 this 的问题）
  getFormatter() {
    return this.#format;
  }
}

const wallet = new Wallet('张三');
console.log('存款后余额：', wallet.deposit(100));
console.log('再存一次：', wallet.deposit(50));
console.log('私有箭头字段记录的日志条数 =', wallet.history.length);
console.log('日志内容：', wallet.history.join(' | '));

// 私有方法被传出去后同样丢 this
const formatter = wallet.getFormatter();
try {
  formatter(1);
} catch (err) {
  console.log('提取私有方法后调用报错：', err.constructor.name, '—', err.message);
}
// 用 call 手动补 this 就能工作（说明它本身没问题，只是丢了绑定）
console.log('用 call 补回 this 后：', formatter.call(wallet, 888));

console.log('--- 5. 静态方法里的 this：是"当前类" ---');

class Factory {
  static kind = 'Factory';

  static describe() {
    // 静态方法里 this 是类本身，且是动态的：子类调用时 this 是子类
    return `kind = ${this.kind}, name = ${this.name}`;
  }

  static create(...args) {
    // 用 this 而不是 Factory，这样在子类上调用会创建子类实例
    return new this(...args);
  }

  constructor(tag) {
    this.tag = tag;
  }
}

class SubFactory extends Factory {
  static kind = 'SubFactory';
}

console.log('Factory.describe() →', Factory.describe());
console.log('SubFactory.describe() →', SubFactory.describe(), '（this 变成子类）');
const created = SubFactory.create('子类实例');
console.log('SubFactory.create 造出的类型：', created.constructor.name, '| tag =', created.tag);

// 静态方法提取后 this 也会丢
const describe = Factory.describe;
try {
  describe();
} catch (err) {
  console.log('提取静态方法后调用报错：', err.constructor.name, '—', err.message);
}
console.log('用 call 绑定类名：', describe.call(Factory));

console.log('--- 6. 箭头函数字段与 super 的关系 ---');

class Base {
  greet() {
    return 'Base 的问候';
  }
}

// 原型方法里用 super：最常见的写法
class GoodChild extends Base {
  greet() {
    return `GoodChild 扩展：${super.greet()}`;
  }
}

// 箭头函数字段里**也可以**用 super.greet()：
// 类字段初始化器有自己的 [[HomeObject]]，箭头函数会沿词法作用域继承它。
// 但注意：super() 这个"调用父类构造函数"的形式是绝对不能在
// 箭头函数里使用的（只能在派生类的 constructor 里）。
class FieldChild extends Base {
  greet = () => `FieldChild 扩展：${super.greet()}`;
}

console.log('原型方法 + super →', new GoodChild().greet());
console.log('箭头字段 + super.method() →', new FieldChild().greet());

// 真正会出问题的是"父类把方法写成箭头字段"这种情况。
// 因为箭头字段在**实例**上，不在原型上，会带来两个后果：

class ArrowBase {
  greet = () => 'ArrowBase 的箭头字段问候';
}

// 后果一：子类在原型上定义的同名方法会被父类的实例字段**遮蔽**。
// 实例自有属性优先于原型属性，所以下面这个 greet 根本不会被调用。
class ArrowChild extends ArrowBase {
  greet() {
    return 'ArrowChild 的方法（但被父类字段遮蔽了，看不到这个结果）';
  }
}
const arrowChild = new ArrowChild();
console.log('调用结果是 →', arrowChild.greet());
console.log('greet 是实例自有属性吗？', Object.hasOwn(arrowChild, 'greet'), '（在实例上，遮蔽了原型方法）');

// 后果二：子类方法里用 super.greet() 会失败，
// 因为 super 只沿"父类原型"查找，而父类原型上没有 greet。
class ArrowBase2 {
  greet = () => 'ArrowBase2 的箭头字段问候';
}
class ArrowChild2 extends ArrowBase2 {
  describe() {
    try {
      // 沿 ArrowBase2.prototype → Object.prototype 查找，都找不到 greet
      return super.greet();
    } catch (err) {
      return `super.greet() 失败：${err.constructor.name} — ${err.message}`;
    }
  }
}
console.log('子类对父类的箭头字段用 super →', new ArrowChild2().describe());
console.log(
  '父类原型上有 greet 吗？',
  Object.hasOwn(ArrowBase2.prototype, 'greet'),
  '（没有，它在实例上）',
);

console.log('--- 7. super() 之前不能用 this（try/catch 演示） ---');

class Parent {
  constructor(name) {
    this.name = name;
  }
}

class Child extends Parent {
  constructor(name) {
    // 用 try/catch 包住"提前访问 this"的错误，程序不会崩
    try {
      this.earlyAccess = true;
    } catch (err) {
      Child.earlyError = err;
    }
    super(name);
    this.afterSuper = true;
  }
}

const child = new Child('测试');
console.log('提前访问 this 的错误：', Child.earlyError.constructor.name, '—', Child.earlyError.message);
console.log('super() 之后一切正常：', child.name, '| afterSuper =', child.afterSuper);

console.log('--- 8. 决策表 ---');

const table = [
  ['原型方法', '所有实例共享，省内存', '会被作为回调传出去时容易丢 this'],
  ['箭头函数字段', 'this 固定、可安全传递', '每个实例一份；父类用它会让子类 super 失效'],
  ['私有方法', '外部不可见，封装好', '传出去同样丢 this，需 bind 或改成私有箭头字段'],
  ['静态方法', 'this 是当前类，可做工厂', '提取后丢 this，子类调用时 this 是子类'],
];
console.log('  成员类型           优点                        注意点');
for (const [kind, pro, con] of table) {
  console.log(`  ${kind.padEnd(16)} ${pro.padEnd(26)} ${con}`);
}

console.log('\n全部演示完毕。');
