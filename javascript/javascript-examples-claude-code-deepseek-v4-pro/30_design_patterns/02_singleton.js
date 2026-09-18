/**
 * ============================================================================
 * 知识点：单例模式 —— 多种实现方式与 ESM 的天然单例
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/01_module_pattern.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    单例（Singleton）要保证两件事：
 *      (a) 一个类/模块在整个程序生命周期内最多只有一个实例；
 *      (b) 提供一个全局访问点拿到这个实例。
 *    它不是"能少 new 就少 new"的省内存技巧，而是"这份状态全程序只能有一份"
 *    的表达 —— 全局配置、日志器、数据库连接池、缓存、事件总线都属于这一类。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 全局配置：应用启动时读一次环境变量，之后全程序共享，不该有第二份。
 *    - 连接池 / 资源句柄：创建成本高、数量必须受控，多一份就多一份泄漏风险。
 *    - 日志器 / 埋点上报器：需要统一的缓冲区、统一的 level、统一的输出目标。
 *    - 缓存：多份缓存会各自失效、互相打架，命中率反而更差。
 *    在这些场景里，单例解决的问题是"状态一致性"，而不是"节省内存"。
 *
 * 3. 核心语法要点
 *    - 实现 A：模块级对象字面量。最简单，导出一个已经创建好的对象即可 ——
 *      在 ESM 里这本身就是单例，因为模块只求值一次。
 *    - 实现 B：class + 静态字段 + getInstance()。延迟创建（lazy），
 *      构造函数私有化的 JS 变通做法是"在 constructor 里拦截第二次 new"。
 *    - 实现 C：闭包版。用一个 IIFE 里的局部变量持有实例，
 *      外部只能通过返回的 get() 拿到它，连类都摸不到。
 *    - 实现 D（现代首选）：直接用 ESM。模块顶层代码只执行一次，
 *      之后所有 import 拿到的是同一个模块命名空间对象 —— 这是语言保证的单例。
 *
 * 4. 常见陷阱
 *    - 用 `new` 而不是 getInstance()，于是真的造出了第二个实例，状态分裂。
 *    - 懒加载 + 多线程/异步：JS 单线程不会有锁问题，但在两次 await 之间
 *      重复调用 getInstance() 若实现得不对，可能创建两次（需要"先赋值再返回"）。
 *    - 单例里存了可变状态，测试之间互相污染：测试 A 改了配置，测试 B 失败。
 *    - 循环依赖时单例可能拿到"尚未初始化完"的半个对象（ESM 的 live binding 能缓解，
 *      但仍可能读到 undefined）。
 *    - 把单例当万能全局变量用，任何东西都往里塞 —— 这其实是反模式（见第 8 节）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/02_singleton.js
 *
 * 【预期输出】
 *   依次演示四种单例实现，用 === 验证拿到的是同一个对象；调用 reset() 后会
 *   打印一条 reset 消息证明模块级状态确实被复用；最后列出单例的代价与替代方案。
 * ============================================================================
 */

// ===========================================================================
// 1. 实现 A：模块级对象字面量（最简单、也最常用）
// ===========================================================================

console.log('--- 1. 实现 A：模块级对象字面量 ---');

// 两次导入同一个模块（这里用内置的 node:path 举例，避免依赖仓库外的文件）。
// 规范保证：同一个模块只求值一次，所有导入方共享同一个模块命名空间对象。
import * as builtinNsA from 'node:path';
import * as builtinNsB from 'node:path';

/**
 * 配置单例：这个对象在模块求值时被创建一次，之后无论被 import 多少次都是同一个。
 */
const config = {
  appName: 'javascript-examples',
  env: 'development',
  logLevel: 'info',
  // 内存里也保存一份可变状态，用来演示"全程序共享"
  featureFlags: { newCheckout: false },
  setFlag(name, value) {
    this.featureFlags[name] = value;
  },
};

// 用它的人再多，拿到的都是同一个对象引用
const a1 = config;
const a2 = config;
console.log('a1 === a2 ?', a1 === a2);
a1.setFlag('newCheckout', true);
console.log('通过 a1 改的开关，a2 也看得到：', a2.featureFlags);

// 缺点很直白：这个对象是"活的"，任何人都能改，
// 没有任何机制阻止别人 config.logLevel = 'debug' 一把梭。

// ===========================================================================
// 2. 实现 B：class + 静态实例 + getInstance()
// ===========================================================================

console.log('\n--- 2. 实现 B：class + 静态实例 + 延迟创建 ---');

class Logger {
  // 静态私有字段：存放唯一实例
  static #instance = null;
  // 静态计数器：只用于演示"构造函数真的只跑了 N 次"
  static #constructed = 0;

  constructor() {
    if (Logger.#instance) {
      // 关键技巧：JS 没有真正的"私有构造函数"，
      // 所以在构造函数里拦截第二次 new，直接把已有实例还回去。
      // 注意：此时构造函数仍会执行完毕，所以下面要立刻 return。
      Logger.#constructed += 1;
      return Logger.#instance;
    }
    Logger.#constructed += 1;
    this.name = 'Logger';
    this.lines = [];
    // 先赋值、再返回：避免在构造函数里出现递归调用 getInstance() 的死循环
    Logger.#instance = this;
  }

  static getInstance() {
    // 延迟创建（lazy）：第一次真正需要时才创建
    if (!Logger.#instance) {
      Logger.#instance = new Logger();
    }
    return Logger.#instance;
  }

  static get constructedCount() {
    return Logger.#constructed;
  }

  log(msg) {
    this.lines.push(msg);
    console.log(`  [${this.name}] ${msg}`);
    return this;
  }

  size() {
    return this.lines.length;
  }
}

const l1 = Logger.getInstance();
const l2 = Logger.getInstance();
const l3 = new Logger(); // 即使调用方误用了 new，也拿到同一个实例

console.log('l1 === l2 ?', l1 === l2);
console.log('l1 === l3 ?', l1 === l3, '（new 也被拦下了）');
l1.log('第一条日志');
l2.log('第二条日志（通过另一个引用写入）');
console.log('l1.size() =', l1.size(), '说明共享同一份内部数组');
console.log(
  'constructor 被进入的次数：',
  Logger.constructedCount,
  '（共 3 次 new/getInstance 调用，但只有第 1 次真正完成了初始化，后 2 次都提前 return 了已有实例）',
);

// ===========================================================================
// 3. 实现 C：闭包版单例
// ===========================================================================

console.log('\n--- 3. 实现 C：闭包版（连类都摸不到） ---');

/**
 * 用 IIFE 把实例藏在闭包里，外部只有一个 createCounter()。
 * 相比 class 版的好处：
 *   - 没有"忘记调用 getInstance 而 new 出新对象"的可能（构造函数根本不对外）；
 *   - 可以彻底阻止外部改状态，只能走暴露出来的 API。
 */
const Counter = (function () {
  let instance = null; // 私有：唯一实例
  let createdTimes = 0; // 私有：创建次数统计

  function build() {
    let value = 0; // 每个实例自己的私有状态
    return {
      inc(step = 1) {
        value += step;
        return this;
      },
      get value() {
        return value;
      },
      dec(step = 1) {
        value -= step;
        return this;
      },
    };
  }

  return {
    get() {
      if (instance === null) {
        createdTimes += 1;
        instance = build();
      }
      return instance;
    },
    get createdTimes() {
      return createdTimes;
    },
    /**
     * 仅供测试/演示使用：销毁单例，让下一次 get() 重新创建。
     * 真实项目里单例通常不提供 reset，因为"谁有权销毁全局状态"很难回答。
     */
    resetForDemo() {
      instance = null;
    },
  };
})();

const c1 = Counter.get().inc(5);
const c2 = Counter.get();
console.log('c1 === c2 ?', c1 === c2);
c2.inc(3);
console.log('共享状态，累计值 =', c1.value);
console.log('创建次数 =', Counter.createdTimes);

// ===========================================================================
// 4. 实现 D：ESM 的天然单例
// ===========================================================================

console.log('\n--- 4. 实现 D：ESM 模块本身就是单例 ---');

/**
 * ES 模块规范保证：一个模块无论被 import 多少次，求值（evaluate）只发生一次。
 * 因此"模块顶层导出的东西"天然就是单例，不需要任何 getInstance 技巧。
 *
 * 下面这段代码就是"造一个模块级单例"的最小形态：
 * 我们把它封装成 makeSingletonModule()，只是为了在同一个文件里演示
 * "多次 import 拿到同一个对象"这一事实 —— 在真实项目里它就是另一个 .js 文件。
 */
function makeSingletonModule() {
  // 模拟"模块顶层的求值"：只跑一次
  const state = { bootedAt: Date.now(), hits: 0 };
  return {
    hit() {
      state.hits += 1;
      return state.hits;
    },
    snapshot() {
      return { ...state };
    },
  };
}
const registryModuleValue = makeSingletonModule(); // 相当于模块求值一次

// 模拟两个不同的使用方分别 import 同一个模块
const consumerA = { registry: registryModuleValue };
const consumerB = { registry: registryModuleValue };
console.log('两个使用方拿到的是同一个模块对象？', consumerA.registry === consumerB.registry);
consumerA.registry.hit();
consumerA.registry.hit();
console.log('B 看到的命中数（A 累加的）：', consumerB.registry.snapshot().hits);

// 更硬的证据：ESM 的模块缓存（module cache）由规范保证。
// 下面这种写法在语法上"导入了两次 node:path"，但引擎只会求值一次，
// 两次拿到的命名空间对象是同一个（=== 为 true）。
// 注意：不要用 import('./02_singleton.js') 自己导入自己 ——
// 那会形成循环依赖，模块自身永远等不到求值完成，进程会以非零码退出。
console.log('两次导入同一个内置模块，命名空间对象相同？', builtinNsA === builtinNsB);
console.log('命名空间对象是"活的"且唯一的，例如都指向同一个 join：', builtinNsA.join === builtinNsB.join);

// ===========================================================================
// 5. 单例的代价：四个真实痛点
// ===========================================================================

console.log('\n--- 5. 单例的代价 ---');

console.log(`[代价 1] 全局可变状态
    单例本质上是一个"谁都能拿到的全局变量"。任意一处代码改了它，
    影响范围是整程序，而改动点和出错点常常隔着几千行。

[代价 2] 难以测试
    测试要求"每个用例从干净状态开始"。单例的状态会跨用例存活：
    用例 A 把 logLevel 改成 'debug'，用例 B 断言默认值是 'info' 就会莫名其妙地失败。
    更糟的是失败顺序依赖 —— 单独跑 B 通过、一起跑就红。

[代价 3] 隐式依赖
    function doWork() { config.logLevel ... } —— 光看签名，
    你完全看不出它依赖全局配置。依赖没有写在参数里，就无法被替换、
    无法被静态分析、也无法在阅读时被察觉。

[代价 4] 并发 / 多实例场景直接失效
    一个进程里只有一个单例，但同一份代码可能在多个 worker、
    多个微服务实例里跑。这时"全局唯一"是假的，真正的唯一性
    要靠数据库唯一索引、分布式锁、Redis 原子操作来保证。`);

// 演示"隐式依赖"有多隐蔽：下面这个函数签名看不出它依赖 config
function describeEnvImplicitly() {
  // 读者必须看完函数体才知道它依赖模块级 config
  return `env=${config.env}, level=${config.logLevel}`;
}
function describeEnvExplicitly(cfg) {
  // 依赖写在参数里：一眼可见，可替换，可测试
  return `env=${cfg.env}, level=${cfg.logLevel}`;
}
console.log('隐式依赖写法：', describeEnvImplicitly());
console.log('显式依赖写法：', describeEnvExplicitly({ env: 'test', logLevel: 'silent' }));

// ===========================================================================
// 6. 替代方案：依赖注入（DI）
// ===========================================================================

console.log('\n--- 6. 替代方案：依赖注入 ---');

/**
 * 把"单例"换成"一个实例在组合根（composition root）创建一次，然后显式传下去"。
 * 效果几乎一样（全程序共享同一份），但没有全局访问点，
 * 依赖关系全部写在参数里，测试时随手换掉。
 */
class RealClock {
  now() {
    return Date.now();
  }
}

class FakeClock {
  // 测试替身：时间可控
  #t = 0;
  advance(ms) {
    this.#t += ms;
    return this;
  }
  now() {
    return this.#t;
  }
}

class OrderService {
  // 依赖通过构造参数注入，而不是在内部 import 一个单例
  constructor(clock, logger) {
    this.clock = clock;
    this.logger = logger;
    this.orders = [];
  }

  place(id) {
    const at = this.clock.now();
    this.orders.push({ id, at });
    this.logger.log(`下单 ${id} @ ${at}`);
    return at;
  }
}

// 生产环境：一个 clock 实例传下去，效果等同单例
const prodClock = new RealClock();
const prodService = new OrderService(prodClock, Logger.getInstance());
prodService.place('A-1001');

// 测试环境：换成假 clock，行为完全可控，且不需要重置任何全局状态
const testClock = new FakeClock().advance(1000);
const testService = new OrderService(testClock, { log: () => {} });
const t1 = testService.place('T-1');
const t2 = testService.place('T-2');
console.log('假时钟推进后，两单时间可控：', t1, t2, t1 === t2);

// ===========================================================================
// 7. 什么时候不该用单例
// ===========================================================================

console.log('\n--- 7. 什么时候不该用单例 ---');

console.log(`不该用的信号：
  1) 这个类只是"碰巧现在只需要一个"：需求一变就要两个，
     改造成本远高于一开始就写成普通 class + 注入。
  2) 单例里装的是"数据"而不是"能力"：数据会变、会增长、要隔离，
     应该交给状态管理或显式的数据容器。
  3) 需要按请求/按用户隔离的状态：Web 服务里每个请求一份的东西，
     写成单例会造成用户 A 看到用户 B 的数据（真实事故级别的问题）。
  4) 纯粹为了"省内存"：一个普通对象的内存开销可忽略，
     单例带来的耦合成本远大于那点内存。
  5) 需要被 mock 的依赖：只要它在 import 里被直接引用，
     测试替换就得依赖模块 mock 机制，脆弱且难读。

判断口诀：问自己"如果明天需要两个，改造要多久？"
答案超过半小时，就别用单例，把实例的创建权交给调用方。`);

// 导出一点东西，供第 4 节的动态 import 验证使用
export const moduleMarker = 'module evaluated once';
export { config, Logger, Counter, OrderService, RealClock, FakeClock };

console.log('\n全部演示完毕。');
