/**
 * ============================================================================
 * 知识点：用闭包实现私有状态与计数器（模块模式）
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】进阶
 * 【前置知识】07_scope_and_closure/06_closure_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "模块模式（module pattern）"是 ES6 之前最流行的封装手法：
 *    用一个 IIFE（立即调用函数表达式）创建一个私有作用域，把状态藏在里面，
 *    只返回一组"特权方法"来读写这些状态。
 *      const counter = (function () {
 *        let count = 0;                 // 私有变量，外部拿不到
 *        return { inc() { count++; } };  // 特权方法，外部只能通过它操作
 *      })();
 *    这里用到的核心机制就是闭包：返回的方法"记住"了 IIFE 里的 count。
 *
 * 2. 为什么需要
 *    JS 在很长一段时间里没有真正的"私有字段"（ES2022 才有 #private）。
 *    而"公开属性"意味着任何人都能写 obj.count = -999，数据完整性无从保证。
 *    闭包提供了一种语言层面就能实现的私有性：
 *      - 外部无法直接读/写私有变量，只能走你提供的方法；
 *      - 所有校验逻辑集中在方法里，不可能绕过；
 *      - 天然支持"每个实例一份状态"（每次调用工厂函数都产生新闭包）。
 *    今天虽然有了 class + #私有字段，模块模式依然是轻量、无 this 陷阱的好选择。
 *
 * 3. 核心语法要点
 *    (1) 私有变量写在 IIFE / 工厂函数内部，用 let 声明（需要修改）或 const。
 *    (2) 返回的对象里放方法，这些方法形成闭包，可以读写私有变量。
 *    (3) 工厂函数每次被调用都会产生一套全新的私有状态 —— 天然多实例。
 *    (4) 想在外部"读"私有变量，必须显式提供 getter；不提供就真的读不到。
 *    (5) 现代替代方案：class + #private 字段（真正的语言级私有）；
 *        但 #private 只能是类的字段，不能像闭包那样自由地做"工厂函数"。
 *
 * 4. 常见陷阱
 *    - 把私有变量写成对象属性，以为别人访问不到（obj.count 依然可写）。
 *    - 特权方法里用箭头函数 vs 普通函数：对象方法用普通函数简写时 this 才正确。
 *    - 无意中泄漏了内部对象的引用（返回内部数组本身，外部依然能改）。
 *    - 用闭包保存"大量"数据却不清理，导致内存长期占用（见 10_closure_memory.js）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 07_scope_and_closure/07_closure_private_state.js
 *
 * 【预期输出】
 *   从最简单的计数器开始，逐步演进出带校验的私有状态模块，
 *   演示外部无法直接访问私有变量、只能通过特权方法操作，
 *   并对比"公开属性写法"与"闭包写法"的差别。
 * ============================================================================
 */

console.log('--- 1. 反面教材：开放的计数器，谁都能改坏 ---');

const openCounter = {
  count: 0, // 完全公开
  inc() {
    this.count += 1;
  },
};
openCounter.inc();
console.log('  正常使用 →', openCounter.count);
openCounter.count = -999; // 外部随意篡改，没有任何保护
openCounter.count = '我偏要存字符串';
console.log('  被外部改坏 →', openCounter.count);
console.log('  结论：公开属性没有数据完整性可言 —— 这正是闭包要解决的问题。');

console.log('--- 2. 最简单方案：用闭包实现计数器 ---');

function makeCounter() {
  // 私有状态：只有返回的方法能访问它。
  let count = 0;

  return {
    // 每个方法都是闭包，共享同一个 count。
    increase() {
      count += 1;
      return count;
    },
    decrease() {
      count -= 1;
      return count;
    },
    // 显式提供读接口（不提供就真的读不到）。
    get value() {
      return count;
    },
    // 显式提供重置接口。
    reset() {
      count = 0;
      return '已重置';
    },
  };
}

const counter = makeCounter();
console.log('  初始值 →', counter.value);
console.log('  increase() →', counter.increase());
console.log('  increase() →', counter.increase());
console.log('  decrease() →', counter.decrease());
console.log('  当前值 →', counter.value);
// 尝试直接访问私有变量：外部根本没有这个名字。
console.log('  直接访问 counter.count →', counter.count, '（undefined，因为它根本不在对象上）');
console.log('  对象自身可枚举的属性 →', Object.keys(counter), '（里面只有方法，没有私有状态 count）');
// 尝试从外部"写入"同名属性：这只是给返回的对象加了一个新属性，与私有 count 无关。
counter.count = 999;
console.log('  写入 counter.count = 999 后再读 counter.value →', counter.value, '（私有状态毫发无损）');
console.log('  不过此时对象上确实多了一个同名的干扰属性 →', Object.keys(counter));
console.log('  结论：外部只能"另起炉灶"，永远碰不到闭包里的那份私有状态。');
console.log('  reset() →', counter.reset(), '；当前值 →', counter.value);

console.log('--- 3. 加上校验：私有状态 + 受控修改 ---');

function createBankAccount(initialBalance = 0, owner = '匿名') {
  // 私有状态
  let balance = initialBalance;
  // 私有方法：外部也访问不到
  function isValidAmount(amount) {
    return typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
  }
  // 私有的操作流水，外部同样看不到
  const history = [];

  return {
    get owner() {
      return owner;
    },
    get balance() {
      return balance;
    },
    deposit(amount) {
      if (!isValidAmount(amount)) {
        // 校验失败就抛错，由调用方处理；本示例在外部 try/catch 中捕获。
        // 注意：这里用 String() 而不是 JSON.stringify()，
        // 因为 JSON.stringify(NaN) 和 JSON.stringify(Infinity) 都会变成 "null"，不便排查。
        throw new TypeError(`存款金额必须是正数，收到：${String(amount)}（类型 ${typeof amount}）`);
      }
      balance += amount;
      history.push(`存入 ${amount}`);
      return balance;
    },
    withdraw(amount) {
      if (!isValidAmount(amount)) {
        throw new TypeError(`取款金额必须是正数，收到：${String(amount)}（类型 ${typeof amount}）`);
      }
      if (amount > balance) {
        throw new RangeError(`余额不足：当前 ${balance}，尝试取出 ${amount}`);
      }
      balance -= amount;
      history.push(`取出 ${amount}`);
      return balance;
    },
    // 返回副本，而不是内部数组本身 —— 否则外部依然能改到私有数据。
    getHistory() {
      return [...history];
    },
  };
}

const account = createBankAccount(100, '小明');
console.log(`  账户所有者：${account.owner}，初始余额：${account.balance}`);
console.log('  存入 50 → 余额', account.deposit(50));
console.log('  取出 30 → 余额', account.withdraw(30));
console.log('  流水 →', account.getHistory());

// 各种非法操作都被拦住了。
const badOperations = [
  ['存入负数', () => account.deposit(-10)],
  ['存入字符串', () => account.deposit('一百')],
  ['存入 NaN', () => account.deposit(NaN)],
  ['存入 Infinity', () => account.deposit(Infinity)],
  ['超额取出', () => account.withdraw(100000)],
];
for (const [label, operation] of badOperations) {
  try {
    operation();
    console.log(`  ${label} → 不该成功`);
  } catch (err) {
    console.log(`  ${label} → 被拦截：${err.constructor.name}: ${err.message}`);
  }
}
console.log('  余额始终没有被非法操作破坏 →', account.balance);

// 试图从外部篡改私有流水：拿到的是副本，改不动内部数据。
const historyCopy = account.getHistory();
historyCopy.push('伪造的流水记录');
console.log('  篡改副本后，真实流水 →', account.getHistory(), '（副本是独立的）');

console.log('--- 4. 每次调用工厂函数 = 一套独立的私有状态 ---');

const accA = createBankAccount(0, 'A');
const accB = createBankAccount(1000, 'B');
accA.deposit(10);
accB.withdraw(100);
console.log(`  账户 A：${accA.owner}，余额 ${accA.balance}`);
console.log(`  账户 B：${accB.owner}，余额 ${accB.balance}`);
console.log('  两个账户的状态完全隔离，因为每次调用都产生一套新的闭包。');

console.log('--- 5. 完整形态：模块模式（IIFE + 闭包）---');

// 一个"日志模块"：内部维护计数器与配置，对外只暴露必要的方法。
const LoggerModule = (function () {
  // 私有状态
  const logs = [];
  let level = 'info';
  const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

  // 私有函数
  function shouldLog(messageLevel) {
    return LEVELS[messageLevel] >= LEVELS[level];
  }
  function format(messageLevel, message) {
    return `[${messageLevel.toUpperCase()}] ${message}`;
  }

  // 对外暴露的接口（只暴露这几个）
  return {
    setLevel(newLevel) {
      if (!(newLevel in LEVELS)) {
        // 返回错误信息而不是抛错，演示另一种错误处理风格（本示例两种都展示了）。
        return `未知级别：${newLevel}，可用级别：${Object.keys(LEVELS).join(' / ')}`;
      }
      level = newLevel;
      return `日志级别已设为 ${level}`;
    },
    log(messageLevel, message) {
      if (!(messageLevel in LEVELS)) return `未知级别：${messageLevel}`;
      if (!shouldLog(messageLevel)) return null; // 低于当前级别，直接丢弃
      const entry = format(messageLevel, message);
      logs.push(entry);
      return entry;
    },
    // 只暴露"数量"和"摘要"，不暴露内部数组本体
    get count() {
      return logs.length;
    },
    dump() {
      return [...logs];
    },
    clear() {
      logs.length = 0;
      return '日志已清空';
    },
  };
})();

console.log('  默认级别下：');
console.log('   ', LoggerModule.log('debug', '这条不会被记录'));
console.log('   ', LoggerModule.log('info', '服务启动'));
console.log('   ', LoggerModule.log('error', '连接失败'));
console.log('  当前日志条数 →', LoggerModule.count);
console.log('  调整级别 →', LoggerModule.setLevel('debug'));
console.log('  再记一条 debug →', LoggerModule.log('debug', '现在能记录了'));
console.log('  全部日志 →', LoggerModule.dump());
console.log('  非法级别 →', LoggerModule.setLevel('verbose'));
console.log('  内部 logs 数组能被外部访问吗？LoggerModule.logs →', LoggerModule.logs, '（undefined）');

console.log('--- 6. 闭包私有 vs class 的 #私有字段 ---');

// ES2022 起，class 支持真正的私有字段（# 开头），也是一条路。
class ClassCounter {
  // #count 是语言层面的私有字段，外部访问会直接是语法/运行时错误。
  #count = 0;
  increase() {
    this.#count += 1;
    return this.#count;
  }
  get value() {
    return this.#count;
  }
}
const classCounter = new ClassCounter();
classCounter.increase();
console.log('  class 版计数器 →', classCounter.value);
console.log('  class 版能直接读到 #count 吗？', classCounter.count, '（读不到，需要专门的语法 #count 且必须在类内）');
try {
  // 在类外部用 #count 语法会直接抛 SyntaxError（此处用字符串形式无法演示，故用属性名探测）。
  const key = Object.getOwnPropertyNames(classCounter);
  console.log('  实例上的属性名 →', key, '（#count 不可枚举、不可外部访问）');
} catch (err) {
  console.log('  探测失败：', err.message);
}

// 两者的选择建议：
const comparison = [
  ['闭包工厂', '每次调用产生独立状态', '无 this 陷阱、不需要 new、可返回任意结构'],
  ['class + #private', '用 new 创建实例', '语法更直观、性能更好、支持继承'],
];
for (const [way, how, why] of comparison) {
  console.log(`  · ${way}：${how} —— ${why}`);
}

console.log('--- 7. 实战：用闭包做"一次性初始化"的配置中心 ---');

const Config = (function () {
  let instance = null; // 私有：用于实现单例

  function build() {
    // 私有的默认配置
    const defaults = { timeout: 3000, retries: 2, baseUrl: '/api' };
    return {
      get(key) {
        return defaults[key];
      },
      set(key, value) {
        defaults[key] = value;
        return `已设置 ${key} = ${JSON.stringify(value)}`;
      },
      all() {
        return { ...defaults };
      },
    };
  }

  return {
    // 单例：无论调用多少次 getInstance，拿到的都是同一个对象。
    getInstance() {
      if (instance === null) {
        instance = build();
      }
      return instance;
    },
  };
})();

const configA = Config.getInstance();
const configB = Config.getInstance();
console.log('  两次 getInstance 是同一个对象吗？', configA === configB);
configA.set('timeout', 5000);
console.log('  通过 A 修改后，用 B 读取 →', configB.get('timeout'), '（同一份私有状态）');
console.log('  当前全部配置 →', configB.all());
console.log('  单例的"能力"也来自闭包：instance 变量被 getInstance 捕获，跨调用存活。');

console.log('--- 8. 小结 ---');
const summary = [
  ['私有状态怎么来', '写在 IIFE / 工厂函数内部，用 let/const 声明'],
  ['外部怎么访问', '只能通过返回对象上的方法（特权方法）'],
  ['怎么保证不被绕过', '所有校验写在方法内部，不暴露内部数据本体（返回副本）'],
  ['多实例怎么做', '工厂函数每次调用都产生一套新闭包'],
  ['单例怎么做', '闭包里放一个 instance 变量做惰性初始化'],
  ['现代替代', 'class + #私有字段；但"函数工厂"场景闭包依然更灵活'],
];
for (const [question, answer] of summary) {
  console.log(`  · ${question}`);
  console.log(`      → ${answer}`);
}
