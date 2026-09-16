/**
 * ============================================================================
 * 知识点：私有成员 —— #私有字段、#私有方法、私有静态成员
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】进阶
 * 【前置知识】14_classes/04_class_fields.js
 *
 * 【也见】34_modern_es_features/02_es2022_features.js —— ES2022 特性综述里也讲了私有字段与方法。
 *        本文件是私有成员的主场（专文）；那篇只给最小示例，细节以本文为准。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    以 # 开头的类成员是"真私有"的：只能在声明它的类体内部访问，
 *    类外部、子类、甚至同一文件的其它代码都读不到。ES2022 起正式标准化。
 *
 * 2. 为什么需要
 *    - ES6 时代没有真正的私有，大家靠约定（_name 下划线）或 WeakMap + 闭包模拟，
 *      前者只是"君子协定"，后者写法繁琐且影响调试。
 *    - # 私有字段由语言层面保证：外部访问直接语法错误 / 运行时抛 TypeError，
 *      不可能被绕过（不像下划线约定那样能被随手读写）。
 *    - 支持"内部实现自由重构"：只要公开接口不变，私有成员的改名不影响使用者。
 *
 * 3. 核心语法要点
 *    - 私有实例字段：#count = 0;  必须在类体里声明后才能用。
 *    - 私有方法：#validate() {}
 *    - 私有 getter/setter：get #value() {} / set #value(v) {}
 *    - 私有静态字段与方法：static #instances = 0; / static #create() {}
 *    - 访问方式：类体内部一律写 this.#count 或 类名.#staticField。
 *    - 未声明的私有名不能使用：写 this.#nope 是语法错误（SyntaxError），
 *      而不是运行时 undefined —— 引擎在解析阶段就能查出。
 *    - 私有字段同样遵循"字段初始化顺序"（见 04 节）。
 *    - 可以用 #x in obj 语法在类内部检测某个对象是否拥有该私有字段（ES2022）。
 *
 * 4. 常见陷阱
 *    - 子类无法访问父类的私有字段：即使子类实例继承了父类的构造逻辑，
 *      this.#parentPrivate 在子类类体里也是语法错误。
 *    - 私有字段不能通过 this['#name'] 这种字符串下标访问。
 *    - 把私有字段写在构造函数里赋值之前就去读，会抛 TypeError（未初始化）。
 *    - 从外部"测试"私有成员只能通过公开方法间接验证。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/05_private_fields.js
 *
 * 【预期输出】
 *   演示私有字段/方法/静态私有成员的正常用法，并 try/catch 展示几种越权访问的报错。
 * ============================================================================
 */

console.log('--- 1. 私有实例字段与私有方法 ---');

class BankAccount {
  // 私有实例字段：必须以 # 开头，且在类体中声明
  #balance = 0;
  // 私有字段也可以没有初始值（此时初始为 undefined）
  #owner;

  constructor(owner, initial) {
    this.#owner = owner;
    // 通过私有方法做校验，外部无法绕过
    if (!BankAccount.#isValidAmount(initial)) {
      throw new RangeError('初始金额必须是非负有限数');
    }
    this.#balance = initial;
  }

  // 私有方法：只能在类体内调用
  #format(amount) {
    return `¥${amount.toFixed(2)}`;
  }

  // 私有静态方法：只能通过类名在类体内调用
  static #isValidAmount(n) {
    return typeof n === 'number' && Number.isFinite(n) && n >= 0;
  }

  // 公开接口：存款
  deposit(amount) {
    if (!BankAccount.#isValidAmount(amount)) {
      // 抛错交给调用方处理，不在这里吞掉
      throw new RangeError('存款金额非法');
    }
    this.#balance += amount;
    return this;
  }

  // 公开接口：取款，内部用私有方法生成日志
  withdraw(amount) {
    if (!BankAccount.#isValidAmount(amount) || amount > this.#balance) {
      throw new RangeError('余额不足或金额非法');
    }
    this.#balance -= amount;
    return this;
  }

  // 公开的只读视图：外部通过它间接读余额
  get balanceText() {
    return this.#format(this.#balance);
  }

  // 用 #field in obj 语法在类内部做"品牌检测"
  static isAccount(obj) {
    return #balance in obj;
  }
}

const acc = new BankAccount('张三', 100);
acc.deposit(50).withdraw(30);
console.log('账户所有者的公开只读余额：', acc.balanceText);
console.log('BankAccount.isAccount(acc) =', BankAccount.isAccount(acc));
console.log('BankAccount.isAccount({}) =', BankAccount.isAccount({}));

console.log('--- 2. 私有成员在外部完全不可见 ---');

// 列出实例的所有自有属性：私有字段不会出现在这里。
console.log('Object.keys(acc) =', JSON.stringify(Object.keys(acc)));
console.log('Object.getOwnPropertyNames(acc) =', JSON.stringify(Object.getOwnPropertyNames(acc)));
// 私有字段在"内部槽"里，连 getOwnPropertySymbols 也看不到。
console.log('Object.getOwnPropertySymbols(acc) =', JSON.stringify(Object.getOwnPropertySymbols(acc)));
console.log('#balance 是 acc 的键吗？', '#balance' in acc);

console.log('--- 3. 越权访问会报错（try/catch 演示） ---');

// 注意：下面用 eval 来演示，是因为"在类外部写 acc.#balance"属于**语法错误**，
// 一旦直接写在源码里，整个文件在解析阶段就会失败，根本跑不起来：
//
//     acc.#balance
//     ^^^^^^^^^^^
//     SyntaxError: Private field '#balance' must be declared in an enclosing class
//
// 把这段代码放进 eval，就能把它变成可捕获的运行时异常来演示。

// 3.1 在类外部用点号读私有字段：解析阶段就被拒绝
try {
  eval('acc.#balance');
} catch (err) {
  console.log('读 acc.#balance 报错：', err.constructor.name);
  console.log('  信息：', err.message);
}

// 3.2 用字符串下标读：私有名不是普通字符串属性，读到 undefined
console.log("acc['#balance'] =", acc['#balance'], '（不是报错，是根本没有这个键）');

// 3.3 调用私有方法：同样是解析期错误
try {
  eval('acc.#format(1)');
} catch (err) {
  console.log('调用 acc.#format(1) 报错：', err.constructor.name);
  console.log('  信息：', err.message);
}

// 3.4 构造器内部的校验也会抛错，属于正常业务报错
try {
  new BankAccount('李四', -5);
} catch (err) {
  console.log('非法初始金额报错：', err.constructor.name, '—', err.message);
}

console.log('--- 4. 子类无法访问父类的私有成员 ---');

class SavingAccount extends BankAccount {
  #interestRate = 0.03;

  constructor(owner, initial, rate) {
    // 调用父类构造函数，父类自己会初始化它自己的私有字段
    super(owner, initial);
    this.#interestRate = rate;
  }

  // 子类只能用父类暴露的公开接口；访问 this.#balance 会是语法错误，
  // 所以下面这行被注释掉了（取消注释后整个文件都无法解析）：
  // showParentBalance() { return this.#balance; }

  addInterest() {
    // 用公开只读接口估算，而不是去碰父类私有字段
    const current = Number(this.balanceText.replace(/[^\d.]/g, ''));
    this.deposit(current * this.#interestRate);
    return this;
  }

  showRate() {
    return `利率 ${(this.#interestRate * 100).toFixed(1)}%`;
  }
}

const saving = new SavingAccount('王五', 1000, 0.05);
saving.addInterest();
console.log(saving.showRate());
console.log('增加利息后余额：', saving.balanceText);
// 父类的私有字段检测对子类实例同样成立
console.log('父类的品牌检测能识别子类实例吗？', BankAccount.isAccount(saving));

console.log('--- 5. 私有静态字段：实例计数与单例 ---');

class Singleton {
  // 私有静态字段保存唯一实例
  static #instance = null;
  static #createdCount = 0;

  #id;

  constructor() {
    // 私有静态字段在类体内用 "类名.#名字" 访问
    Singleton.#createdCount += 1;
    this.#id = Singleton.#createdCount;
  }

  static get() {
    // 惰性创建：第一次调用才 new
    if (this.#instance === null) {
      this.#instance = new this();
    }
    return this.#instance;
  }

  static get createdCount() {
    return this.#createdCount;
  }

  get id() {
    return this.#id;
  }
}

const s1 = Singleton.get();
const s2 = Singleton.get();
console.log('两次 get 是同一个实例吗？', s1 === s2);
console.log('实例 id =', s1.id);
console.log('累计构造次数 =', Singleton.createdCount);
console.log('外部能读 #instance 吗？', '#instance' in Singleton);

console.log('--- 6. 私有 getter / setter ---');

class Temperature {
  #celsius = 0;

  // 私有访问器：只能被类体内的其它成员使用
  get #fahrenheit() {
    return this.#celsius * 9 / 5 + 32;
  }

  set #fahrenheit(f) {
    this.#celsius = (f - 32) * 5 / 9;
  }

  // 公开访问器，内部转调私有访问器，保持数据只有一个来源
  get celsius() {
    return this.#celsius;
  }

  set celsius(v) {
    this.#celsius = v;
  }

  get fahrenheit() {
    return this.#fahrenheit;
  }

  set fahrenheit(v) {
    this.#fahrenheit = v;
  }

  toString() {
    return `${this.#celsius.toFixed(1)}°C / ${this.#fahrenheit.toFixed(1)}°F`;
  }
}

const t = new Temperature();
t.celsius = 25;
console.log('设为 25°C 后：', String(t));
t.fahrenheit = 212;
console.log('设为 212°F 后：', String(t));

console.log('\n全部演示完毕。');
