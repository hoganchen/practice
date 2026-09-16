/**
 * ============================================================================
 * 知识点：依赖注入（DI）与控制反转（IoC）—— 让依赖可替换、代码可测试
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计原则与架构基础
 * 【难度等级】高级
 * 【前置知识】30_design_patterns/03_factory.js、18_solid_principles.js（第 5 节 DIP）、
 *             19_modules（ESM 的导入导出）、28_testing（单元测试的基本形态）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    依赖注入（Dependency Injection）说的是：**一个对象需要的协作者，由外部传给它，
 *    而不是它自己去创建**。三句话概括：
 *      - 依赖：A 完成工作需要用到的 B（支付网关、日志器、仓储、时钟）；
 *      - 控制反转（IoC）："由谁创建 B"的决定权，从 A 自己手里**反转**给了外部；
 *      - 注入：外部把 B 交给 A 的三种方式 —— 构造器注入、参数注入、属性注入。
 *    所以 DI 不是什么框架、不是容器：**只是"把 new 搬到外面去"这一件事**。
 *    容器（Container）只是当依赖图变深时，帮你自动完成这件事的工具。
 *
 * 2. 为什么需要（真实项目场景）
 *    下面这些痛，全部来自同一个根源 —— 依赖被写死在对象内部：
 *      - 单元测试跑一次就真的调用了支付网关 / 发了邮件 / 连了数据库；
 *      - 测试要"改环境变量 + 连测试库 + 清数据"，一个断言跑 3 秒；
 *      - 想给同一段业务逻辑换一个渠道（邮件→短信），必须改业务类的源码；
 *      - 时间、随机数、当前用户这些"环境依赖"让测试结果不可复现；
 *      - 对象之间的依赖图越来越深，每个入口都要自己按顺序 new 一遍。
 *    注意 DI 的价值**首先是可测试性**，其次才是"可替换实现"。
 *    很多团队一辈子没换过数据库，但每天都在写测试 —— 对他们来说 DI 的全部回报来自测试。
 *
 * 3. 核心语法要点
 *    - 构造器注入：`new OrderService({ gateway, logger })`。最常用、最推荐。
 *      优点：依赖显式、创建后不可变、对象一旦创建就是"完整可用"的。
 *    - 参数注入（方法注入）：`service.pay(order, { clock, currentUser })`。
 *      适合"每次调用都可能不同、且只在这一次需要"的依赖。
 *    - 属性注入（Setter）：`service.gateway = g`。**通常不推荐**，因为对象可能处于
 *      "依赖还没装上"的半成品状态，错误会推迟到运行时才暴露。
 *    - 组合根（Composition Root）：整个程序里**只有一处**负责 new 所有对象
 *      （通常是入口文件 main/index），那一处就是组合根。其余代码一律不 new 外部依赖。
 *    - 容器：`register(name, { deps, lifetime, factory })` + `resolve(name)`。
 *      生命周期三件套：singleton（进程内一份）/ transient（每次新的）/ scoped（每个作用域一份）。
 *    - 循环依赖检测：resolve 时用一条"解析栈"记录正在解析的名字，
 *      再次遇到同一个名字就说明有环，直接抛出带完整路径的错误。
 *    - 与模块系统的关系（本文件第 6 节重点）：
 *      `import { X } from './x.js'` 也是一种依赖声明，但它是**静态、加载期绑定、
 *      不可在运行时替换**的。所以"用 ESM 管依赖"并不能替代 DI：
 *      ESM 解决"代码怎么组织"，DI 解决"运行时用哪一份实现"。
 *
 * 4. 常见陷阱
 *    - 服务定位器（Service Locator）反模式：在业务代码内部写
 *      `container.get('gateway')` —— 依赖变成隐式的（构造函数上看不出来），
 *      测试要先去配置全局容器，比直接 new 还难维护。**注入永远是更好的选择**。
 *    - 为了注入而注入：纯函数、纯数据对象、标准库（Math/JSON）不需要注入。
 *    - 为了"以后可能换数据库"而提前抽接口：那是 YAGNI；
 *      但"测试需要替换"是立刻成立的正当理由。
 *    - 容器滥用：5 个对象的项目引入一个 200 行的容器，收益为负。
 *    - 生命周期搞混：把"请求级"的数据注册成 singleton，会造成跨请求数据串味
 *      （这是真实项目里最危险的一类 bug）。
 *    - 依赖名用字符串：拼错只有运行时才发现。类型系统或"直接传对象"可以避免。
 *    - 忘了 DI 只是手段：DI 的目标是"可测试 + 可替换"，不是为了架构好看。
 *      如果注入之后测试还是连着真实外部资源，那说明注入点选错了。
 *    - 依赖注入 ≠ 依赖注入容器：99% 的项目只需要手工注入 + 一个组合根，
 *      剩下 1% 才需要容器。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/19_dependency_injection.js
 *
 * 【预期输出】
 *   1) 硬编码依赖的订单服务：演示"一测就真的调用外部网关"，
 *      并说明为什么它无法做单元测试；
 *   2) 构造器注入：注入假网关与假日志器，用迷你测试框架跑 5 条断言，
 *      在完全不碰外部资源的前提下验证业务行为；
 *   3) 参数注入：把"时钟/当前用户"这类环境依赖变成参数；
 *   4) 属性注入：演示它的危险（半成品对象）与少数适用场景；
 *   5) 简易容器：依赖声明 + 自动装配 + 三种生命周期 + 循环依赖检测；
 *   6) 与 ESM 模块系统的关系：静态导入无法替换、动态导入与注入如何配合、
 *      以及模块 mock 的代价；
 *   7) 代价、反模式（服务定位器）与什么时候不需要 DI。
 * ============================================================================
 */

import { isDeepStrictEqual } from 'node:util';
import { randomUUID } from 'node:crypto'; // 静态导入：加载期就绑定，运行时无法替换（第 6 节）

// ===========================================================================
// 0. 工具：极简测试框架（为了在本文件内演示"可测试性"的差别）
// ===========================================================================

function displayWidth(s) {
  return [...String(s)].reduce(
    (w, ch) => w + (/[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(ch) ? 2 : 1),
    0,
  );
}

function printTable(rows) {
  const cols = rows[0].length;
  const widths = Array.from({ length: cols }, (_, i) => Math.max(...rows.map((r) => displayWidth(r[i]))));
  const pad = (s, w) => String(s) + ' '.repeat(Math.max(0, w - displayWidth(s)) + 2);
  let sepWidth = 0;
  for (const [idx, row] of rows.entries()) {
    const line = row.map((c, i) => pad(c, widths[i])).join('');
    console.log('  ' + line);
    sepWidth = Math.max(sepWidth, displayWidth(line));
    if (idx === 0) console.log('  ' + '-'.repeat(sepWidth));
  }
}

const testResults = [];
function it(name, fn) {
  try {
    fn();
    testResults.push({ name, ok: true });
    console.log(`    ✓ ${name}`);
  } catch (err) {
    testResults.push({ name, ok: false, reason: err.message });
    console.log(`    ✗ ${name} -> ${err.message}`);
  }
}
function expect(actual) {
  return {
    toBe(expected) {
      if (!Object.is(actual, expected)) throw new Error(`期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
    },
    toEqual(expected) {
      if (!isDeepStrictEqual(actual, expected)) throw new Error(`期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
    },
    toThrow() {
      let threw = false;
      try {
        actual();
      } catch {
        threw = true;
      }
      if (!threw) throw new Error('期望抛出异常，但没有');
    },
  };
}

// ===========================================================================
// 1. 被依赖的"基础设施"（全部用内存模拟，绝不访问网络或文件）
// ===========================================================================

/** 支付网关：真实实现（会"访问网络"，用计数器模拟） */
class StripeGateway {
  constructor({ apiKey, baseUrl }) {
    if (!apiKey) throw new Error('StripeGateway 需要 apiKey');
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.networkCalls = 0;
  }
  charge({ orderId, amount, currency }) {
    this.networkCalls += 1; // 真实世界里这里是一次 HTTPS 请求
    if (amount <= 0) throw new RangeError('支付金额必须大于 0');
    return { ok: true, transactionId: `txn_stripe_${orderId}`, amount, currency };
  }
}

/** 日志器：真实实现 */
class ConsoleLogger {
  constructor(prefix = 'app') {
    this.prefix = prefix;
    this.lines = [];
  }
  info(message) {
    this.lines.push(`[${this.prefix}][INFO] ${message}`);
    return this.lines[this.lines.length - 1];
  }
  error(message) {
    this.lines.push(`[${this.prefix}][ERROR] ${message}`);
    return this.lines[this.lines.length - 1];
  }
}

/** 订单仓储：真实实现（内存） */
class InMemoryOrderRepository {
  constructor() {
    this.orders = new Map();
  }
  save(order) {
    this.orders.set(order.id, { ...order });
    return order.id;
  }
  findById(id) {
    return this.orders.get(id) ?? null;
  }
}

// ===========================================================================
// 2. 硬编码依赖：为什么它无法被单元测试
// ===========================================================================

console.log('=== 依赖注入（DI）与控制反转（IoC）===\n');
console.log('--- 1. 反面教材：依赖写死在对象内部 ---');

/**
 * ❌ 难测的写法：
 *   ① 在构造函数里 new 具体实现（依赖方向错了，见 18_solid_principles.js 的 DIP）；
 *   ② 配置从 process.env 直接读（测试时无法在不改环境变量的情况下替换）；
 *   ③ 想换成假实现？只能改这个类的源码。
 */
class OrderServiceHardcoded {
  constructor() {
    this.gateway = new StripeGateway({
      apiKey: process.env.STRIPE_SECRET_KEY ?? 'sk_live_hardcoded_demo', // ③ 硬编码配置来源
      baseUrl: 'https://api.stripe.com',
    });
    this.logger = new ConsoleLogger('hardcoded');
    this.repository = new InMemoryOrderRepository();
  }

  pay({ orderId, amount, currency = 'CNY' }) {
    this.logger.info(`开始支付订单 ${orderId}，金额 ${amount} ${currency}`);
    const result = this.gateway.charge({ orderId, amount, currency });
    this.repository.save({ id: orderId, amount, currency, status: '已付款', transactionId: result.transactionId });
    this.logger.info(`订单 ${orderId} 支付成功，流水号 ${result.transactionId}`);
    return result;
  }
}

const hardcoded = new OrderServiceHardcoded();
const hardcodedResult = hardcoded.pay({ orderId: 'SO-2001', amount: 299 });
console.log(`  调用成功：${JSON.stringify(hardcodedResult)}`);
console.log(`  ★注意：刚才这次调用**真的"访问了网络"**（gateway.networkCalls = ${hardcoded.gateway.networkCalls}）。
    在真实项目里，这意味着任何调用 OrderServiceHardcoded 的测试都会：
      · 打到真实支付网关（可能产生真实扣款！）；
      · 依赖网络可用性（测试因此变慢、变脆）；
      · 需要一份真实的 API Key（CI 环境里还得配密钥）；
      · 无法隔离验证"业务规则"，因为副作用全都发生了。
    想换成假网关？只能改 OrderServiceHardcoded 的源码 —— 这就是**不可测**。`);

console.log(`\n  日志器输出了 ${hardcoded.logger.lines.length} 行日志，但断言它非常别扭：
    "我付了 299 元" 这个业务事实，被混在"网络调用成功"这个基础设施事实里，
    测试想要的是前者，却不得不忍受后者。`);

// ===========================================================================
// 3. 构造器注入：最常用、最推荐的方式
// ===========================================================================

console.log('\n--- 2. 构造器注入：把依赖从构造函数传进来 ---');

/** 测试替身①：假网关（记录调用，不产生任何外部副作用） */
class FakeGateway {
  constructor({ failWith = null } = {}) {
    this.calls = [];
    this.failWith = failWith;
  }
  charge({ orderId, amount, currency }) {
    this.calls.push({ orderId, amount, currency });
    if (this.failWith) throw this.failWith;
    return { ok: true, transactionId: `txn_fake_${this.calls.length}`, amount, currency };
  }
}

/** 测试替身②：假日志器（把日志收集到数组里，便于断言） */
class SpyLogger {
  constructor() {
    this.lines = [];
  }
  info(message) {
    this.lines.push(message);
  }
  error(message) {
    this.lines.push(message);
  }
}

/** ✅ 可测的写法：依赖全部通过构造器注入，并且只依赖"契约"而不是具体类 */
class OrderService {
  /**
   * @param {{gateway: {charge: Function}, logger: {info: Function, error: Function},
   *          repository: {save: Function, findById: Function},
   *          clock?: () => string, newId?: () => string}} deps
   */
  constructor({ gateway, logger, repository, clock = () => new Date().toISOString(), newId = randomUUID }) {
    // 依赖注入的三个额外好处，就在这几行里：
    //  ① 依赖是**显式**的：看构造函数就知道这个类需要什么；
    //  ② 依赖是**只读**的：注入后再也换不掉，不会出现"用到一半依赖被换了"；
    //  ③ 默认值是可选的：clock / newId 这类环境依赖给了默认实现，测试可覆盖。
    this.gateway = gateway;
    this.logger = logger;
    this.repository = repository;
    this.clock = clock;
    this.newId = newId;
  }

  pay({ orderId, amount, currency = 'CNY' }) {
    if (!(amount > 0)) {
      this.logger.error(`订单 ${orderId} 支付失败：金额非法（${amount}）`);
      throw new RangeError('支付金额必须大于 0');
    }
    this.logger.info(`开始支付订单 ${orderId}，金额 ${amount} ${currency}`);
    const result = this.gateway.charge({ orderId, amount, currency });
    this.repository.save({
      id: orderId,
      amount,
      currency,
      status: '已付款',
      transactionId: result.transactionId,
      paidAt: this.clock(),
      paymentId: this.newId(),
    });
    this.logger.info(`订单 ${orderId} 支付成功，流水号 ${result.transactionId}`);
    return result;
  }
}

console.log('\n  用"构造器注入 + 测试替身"写的单元测试（全程不碰外部资源）：');

function runOrderServiceTests() {
  // 每个测试用例都自己组装依赖 —— 这就是"依赖注入让测试变简单"的最直接体现
  const gateway = new FakeGateway();
  const logger = new SpyLogger();
  const repository = new InMemoryOrderRepository();
  // 注入确定性的时钟与 ID 生成器，让断言可复现
  let seq = 0;
  const service = new OrderService({
    gateway,
    logger,
    repository,
    clock: () => '2026-01-15T09:00:00.000Z',
    newId: () => `pid-${++seq}`,
  });

  it('支付成功后，网关被调用恰好一次', () => {
    service.pay({ orderId: 'SO-3001', amount: 100 });
    expect(gateway.calls.length).toBe(1);
  });
  it('传给网关的金额与币种正确（业务参数没有被篡改）', () => {
    expect(gateway.calls[0]).toEqual({ orderId: 'SO-3001', amount: 100, currency: 'CNY' });
  });
  it('订单被持久化，且状态是"已付款"', () => {
    expect(repository.findById('SO-3001').status).toBe('已付款');
  });
  it('注入的确定性时钟生效（说明环境依赖被成功替换）', () => {
    expect(repository.findById('SO-3001').paidAt).toBe('2026-01-15T09:00:00.000Z');
    expect(repository.findById('SO-3001').paymentId).toBe('pid-1');
  });
  it('日志记录了开始与成功两条', () => {
    expect(logger.lines.length).toBe(2);
    expect(logger.lines[0]).toBe('开始支付订单 SO-3001，金额 100 CNY');
  });
  it('金额非法时抛错，且**不会**调用网关（事务边界守住了）', () => {
    const g2 = new FakeGateway();
    const l2 = new SpyLogger();
    const s2 = new OrderService({ gateway: g2, logger: l2, repository: new InMemoryOrderRepository() });
    expect(() => s2.pay({ orderId: 'SO-3002', amount: -1 })).toThrow();
    expect(g2.calls.length).toBe(0);
    expect(l2.lines[0]).toBe('订单 SO-3002 支付失败：金额非法（-1）');
  });
  it('网关抛错时，异常向上传播（业务层不吞掉基础设施错误）', () => {
    const gateway2 = new FakeGateway({ failWith: new Error('card_declined') });
    const s3 = new OrderService({ gateway: gateway2, logger: new SpyLogger(), repository: new InMemoryOrderRepository() });
    expect(() => s3.pay({ orderId: 'SO-3003', amount: 50 })).toThrow();
  });
}
runOrderServiceTests();

console.log(`\n  7 条断言全部在微秒级完成，没有网络、没有密钥、没有数据库。
  ★这就是依赖注入最实在的回报：**把"不可测"的代码变成"可测"的代码。**`);

console.log('\n  注入还能做的事：替换成另一种真实实现（不只是测试替身）');
class AlipayGateway {
  charge({ orderId, amount, currency }) {
    return { ok: true, transactionId: `txn_alipay_${orderId}`, amount, currency };
  }
}
const switched = new OrderService({
  gateway: new AlipayGateway(), // 换渠道：业务代码 OrderService 一行没改
  logger: new SpyLogger(),
  repository: new InMemoryOrderRepository(),
});
console.log(`    换成支付宝网关：${JSON.stringify(switched.pay({ orderId: 'SO-3004', amount: 88 }))}`);

console.log(`
【构造器注入的优点】
  1) 依赖显式：构造函数就是"这个类需要什么"的完整清单；
  2) 对象创建后即完整可用，不存在"半成品"状态（对比第 4 节的属性注入）；
  3) 不可变：注入后换不掉，避免运行中被偷偷替换导致的诡异 bug；
  4) 天然引导你遵守 DIP（18_solid_principles.js 第 5 节）：想注入就必须先有抽象。

【构造器注入的代价】
  1) 构造函数参数变多：依赖 6 个以上时，签名会很难看（这时该考虑拆类，而不是怪 DI）；
  2) "谁负责创建"成了新问题：答案就是**组合根**（整个程序只有一处负责 new），
     下一节与第 5 节的容器都在解决这个问题；
  3) 依赖图很深时，手工装配会变成 30 行样板代码（容器的用武之地）；
  4) 阅读时需要"跳到组合根"才知道运行时用的是哪个实现。`);

// ===========================================================================
// 4. 参数注入（方法注入）
// ===========================================================================

console.log('\n--- 3. 参数注入：只在这一次调用需要的依赖 ---');

/**
 * 有些依赖**不属于对象本身**，而是"这一次调用"的上下文：
 *   - 时钟（想拿到"现在"，但每次调用都可能不同）；
 *   - 当前用户 / 租户（来自请求上下文）；
 *   - 事务对象（一次事务只在一次调用里有效）；
 *   - 追踪 ID（每次请求不同）。
 * 把它们放进构造函数是错的（对象会长命，上下文是短命的），做成参数才对。
 */
class DiscountCalculator {
  /**
   * @param {object} order 订单
   * @param {{clock?: () => Date, currentUser?: {level: string, id: string}}} context 本次调用的上下文
   */
  calculate(order, context = {}) {
    const clock = context.clock ?? (() => new Date());
    const currentUser = context.currentUser ?? { level: 'normal', id: 'anonymous' };
    const now = clock();

    let rate = 0;
    // 会员折扣：依赖"当前用户"（短命上下文）
    if (currentUser.level === 'vip') rate += 0.1;
    // 大额折扣：与上下文无关的业务规则
    if (order.amount >= 1000) rate += 0.05;
    // 节日折扣：依赖"现在几点"（短命上下文）
    if (now.getUTCMonth() === 0 && now.getUTCDate() === 15) rate += 0.03;

    // 浮点相加会出现 0.15000000000000002 这类结果，对外暴露前先规整一下
    rate = Number(rate.toFixed(4));
    const discount = Number((order.amount * rate).toFixed(2));
    return { orderId: order.id, rate, discount, payable: Number((order.amount - discount).toFixed(2)), userId: currentUser.id };
  }
}

const discountCalc = new DiscountCalculator();
const orderSample = { id: 'SO-4001', amount: 1200 };
console.log('  同一个订单，只换"上下文"，结果就不同（不需要重建对象）：');
console.log(`    普通用户、平日：  ${JSON.stringify(discountCalc.calculate(orderSample))}`);
console.log(`    VIP、平日：       ${JSON.stringify(discountCalc.calculate(orderSample, { currentUser: { level: 'vip', id: 'U-1' } }))}`);
console.log(`    VIP、1 月 15 日： ${JSON.stringify(
  discountCalc.calculate(orderSample, { currentUser: { level: 'vip', id: 'U-1' }, clock: () => new Date(Date.UTC(2026, 0, 15, 12)) }),
)}`);
console.log(`  ★注意 clock 与 currentUser 都是**每次调用传进来的**：
    构造函数里注入的时钟通常是"这个对象生命周期的时钟"（比如服务启动时间），
    而"用户点下按钮的那一刻"必须由调用方提供。

  构造器注入 vs 参数注入 的选择标准：
    这个依赖的生命周期与**对象**一致 -> 构造器注入（仓储、网关、日志器）；
    这个依赖的生命周期与**这次调用**一致 -> 参数注入（时钟、当前用户、事务、追踪 ID）。
  把长命依赖做成参数（每次都要传一遍，容易漏）或把短命依赖做成字段
  （字段被上一个请求的上下文污染）都是错的 —— 后者是并发场景里的经典 bug。`);

// ===========================================================================
// 5. 属性注入（Setter 注入）与它的危险
// ===========================================================================

console.log('\n--- 4. 属性注入：为什么通常不推荐 ---');

class ReportServiceSetterStyle {
  constructor() {
    this.repository = null; // 依赖"稍后设置"
    this.logger = null;
  }
  setRepository(repository) {
    this.repository = repository;
    return this;
  }
  setLogger(logger) {
    this.logger = logger;
    return this;
  }
  generate(orderId) {
    // 每个方法都要防御"依赖没装上"的情况，或者接受运行时崩溃
    if (!this.repository) throw new Error('ReportService 尚未配置 repository');
    return `报告内容：${JSON.stringify(this.repository.findById(orderId))}`;
  }
}

const reportSvc = new ReportServiceSetterStyle();
reportSvc.setRepository(new InMemoryOrderRepository());
try {
  reportSvc.generate('SO-3001'); // 忘了一个 setLogger —— 幸好这里没用到
  console.log(`  忘记调用 setLogger 时，居然"没报错" —— 因为碰巧没用到它。`);
} catch (err) {
  console.log(`  ${err.message}`);
}

const incomplete = new ReportServiceSetterStyle();
try {
  incomplete.generate('SO-3001');
} catch (err) {
  console.log(`  但忘记 setRepository 时会炸：${err.name}: ${err.message}`);
  console.log(`  ★错误被推迟到了运行时的某个调用点，而不是在"创建对象"的那一刻 ——
    这是属性注入最大的问题：**对象可以处于"不完整"状态**，
    而编译器/调用方都无法知道"什么时候才算装好了"。`);
}

console.log(`
  【属性注入唯一合理的场景】
    可选协作者：比如可选的 metrics 上报器，不设置就静默不上报；
    循环依赖的兜底：A 需要 B、B 需要 A 时，先都构造出来再互相 set
      —— 但更好的做法是**重构掉这个环**（抽第三个对象，或者把其中一个方法改成参数注入）。
  【判断法】问自己："这个依赖如果不设，对象还能正常工作吗？"
    不能 -> 用构造器注入（缺了就应该创建失败）；
    能   -> 才考虑属性注入，并且要写清默认行为。`);

// ===========================================================================
// 6. 组合根、工厂与简易容器
// ===========================================================================

console.log('\n--- 5. 组合根 / 工厂 / 简易容器：解决"谁来组装" ---');

console.log(`  依赖注入把"创建"的责任推给了外部，于是产生了一个新问题：
    **那到底谁来创建？**
  答案是**组合根（Composition Root）**：整个程序里唯一负责 new 对象的地方，
  通常是入口文件（main.js / index.js / app.js）。其余所有模块一律只声明依赖，
  永远不 new 外部依赖。

  三种组装方式的演进：

  【① 手工装配】最直白，5 个对象以内首选：`);

function createOrderService({ apiKey, loggerPrefix = 'app' }) {
  // 这就是一个"工厂函数 + 组合根"的迷你版：所有 new 集中在这里
  const logger = new ConsoleLogger(loggerPrefix);
  const gateway = new StripeGateway({ apiKey, baseUrl: 'https://api.stripe.com' });
  const repository = new InMemoryOrderRepository();
  return new OrderService({ gateway, logger, repository });
}
const manual = createOrderService({ apiKey: 'sk_test_demo' });
console.log(`     手工装配：${JSON.stringify(manual.pay({ orderId: 'SO-5001', amount: 66 }))}`);
console.log(`     优点：一眼看懂谁依赖谁；缺点：依赖图深了以后，装配代码会变成几十行样板。`);

console.log('\n  【② 简易容器】依赖图深、或需要按生命周期管理时才有价值：');

/**
 * 一个 60 行的玩具容器，包含 DI 容器真正需要的最小能力：
 *   - register：声明"怎么造"与"活多久"；
 *   - deps：声明依赖了谁（这是"自动装配"的关键）；
 *   - resolve：递归解析依赖并按生命周期缓存；
 *   - 循环依赖检测：解析栈 + 清晰报错。
 * 真实容器（如 NestJS 的 IoC 容器、tsyringe、Awilix）做的事与此相同，只是更完备。
 */
class Container {
  #definitions = new Map();
  #singletons = new Map(); // 进程级缓存（记在根容器上）
  #scoped = new Map(); // 作用域级缓存（记在当前容器上）
  #resolving = []; // 解析栈，用于循环依赖检测
  #root;

  constructor(parent = null) {
    this.#root = parent ? parent.#root : this;
    this.parent = parent;
  }

  /**
   * @param {string} name
   * @param {{deps?: string[], lifetime?: 'singleton'|'transient'|'scoped', factory: Function}} definition
   */
  register(name, definition) {
    const { deps = [], lifetime = 'singleton', factory } = definition;
    if (typeof factory !== 'function') throw new TypeError(`注册 ${name} 时必须提供 factory 函数`);
    this.#definitions.set(name, { deps, lifetime, factory });
    return this;
  }

  /** 创建一个子作用域：scoped 生命周期在这里各有一份（典型场景：每个 HTTP 请求一个） */
  createScope() {
    return new Container(this);
  }

  #definitionOf(name) {
    const own = this.#definitions.get(name);
    if (own) return own;
    if (this.parent) return this.parent.#definitionOf(name); // 子作用域可以用父容器的注册
    return null;
  }

  resolve(name) {
    const def = this.#definitionOf(name);
    if (!def) {
      throw new ReferenceError(`未注册的依赖 "${name}"。已注册：${[...this.#definitions.keys()].join(', ')}`);
    }

    // ---- 生命周期命中缓存 ----
    if (def.lifetime === 'singleton' && this.#root.#singletons.has(name)) return this.#root.#singletons.get(name);
    if (def.lifetime === 'scoped' && this.#scoped.has(name)) return this.#scoped.get(name);

    // ---- 循环依赖检测 ----
    if (this.#resolving.includes(name)) {
      const path = [...this.#resolving, name].join(' -> ');
      throw new Error(`检测到循环依赖：${path}`);
    }

    this.#resolving.push(name);
    try {
      // ---- 自动装配：先递归解析所有 deps，再交给 factory ----
      const resolvedDeps = {};
      for (const depName of def.deps) {
        resolvedDeps[depName] = this.resolve(depName);
      }
      const instance = def.factory(resolvedDeps);

      if (def.lifetime === 'singleton') this.#root.#singletons.set(name, instance);
      if (def.lifetime === 'scoped') this.#scoped.set(name, instance);
      return instance;
    } finally {
      this.#resolving.pop(); // 保证无论成功失败都出栈（否则一次失败会污染后续所有解析）
    }
  }

  /** 调试用：打印当前的注册表与生命周期 */
  describe() {
    return [...this.#definitions.entries()].map(([name, d]) => `${name}(${d.lifetime}${d.deps.length ? ' <- ' + d.deps.join(',') : ''})`);
  }
}

/** 一个"假的"内存仓储，用来演示 scoped 生命周期 */
const container = new Container();
container
  .register('logger', { lifetime: 'singleton', factory: () => new ConsoleLogger('container') })
  .register('gateway', {
    lifetime: 'singleton',
    deps: ['logger'],
    factory: ({ logger }) => {
      logger.info('创建（单例）支付网关');
      return new StripeGateway({ apiKey: 'sk_test_from_container', baseUrl: 'https://api.stripe.com' });
    },
  })
  .register('repository', { lifetime: 'singleton', factory: () => new InMemoryOrderRepository() })
  .register('orderService', {
    // 生命周期：每次请求一个（这里用"作用域"模拟）
    lifetime: 'scoped',
    deps: ['gateway', 'logger', 'repository'],
    factory: ({ gateway, logger, repository }) => new OrderService({ gateway, logger, repository }),
  })
  .register('requestTrace', {
    // 每次解析都是新对象（transient）：适合"一次性"的东西
    lifetime: 'transient',
    factory: () => ({ traceId: randomUUID(), startedAt: Date.now() }),
  });

console.log(`     容器注册表：${container.describe().join('、')}`);

const svcFromContainer = container.resolve('orderService');
console.log(`     解析 orderService：${JSON.stringify(svcFromContainer.pay({ orderId: 'SO-6001', amount: 199 }))}`);

console.log('\n     生命周期验证：');
const scopeA = container.createScope();
const scopeB = container.createScope();
console.log(`       singleton gateway：跨作用域同一个实例 -> ${scopeA.resolve('gateway') === scopeB.resolve('gateway')}`);
console.log(`       scoped orderService：作用域 A 内两次解析相同 -> ${scopeA.resolve('orderService') === scopeA.resolve('orderService')}`);
console.log(`       scoped orderService：作用域 A 与 B 不同 -> ${scopeA.resolve('orderService') !== scopeB.resolve('orderService')}`);
console.log(`       transient requestTrace：每次解析都是新的 -> ${container.resolve('requestTrace') !== container.resolve('requestTrace')}`);
console.log(`       singleton logger 只被创建了一次（看上面"创建（单例）支付网关"只出现一次）`);

console.log('\n     循环依赖检测：');
const cyclic = new Container();
cyclic
  .register('orderService', { deps: ['orderRepository'], factory: () => ({}) })
  .register('orderRepository', { deps: ['orderService'], factory: () => ({}) });
try {
  cyclic.resolve('orderService');
} catch (err) {
  console.log(`       ${err.name}: ${err.message}`);
  console.log(`       ★注意报错信息里有**完整的路径**（orderService -> orderRepository -> orderService），
         这是循环依赖最难排查的地方，容器必须把它说清楚；手工装配时你会看到的是栈溢出。`);
}

const lifetimeTable = [
  ['生命周期', '含义', '典型用途', '用错时的后果'],
  ['singleton', '进程内只有一个实例', '配置、连接池、日志器、无状态服务', '请求级数据被共享 -> 用户 A 看到用户 B 的数据'],
  ['scoped', '每个作用域（如每次 HTTP 请求）一个', '请求上下文、事务对象、当前用户', '作用域泄漏 -> 请求结束后对象仍被引用（内存泄漏）'],
  ['transient', '每次解析都新建', '一次性任务、轻量值对象、追踪对象', '被当成 singleton 缓存起来 -> 状态污染'],
];
console.log();
printTable(lifetimeTable);

console.log(`\n  【③ 容器 vs 手工装配：怎么选】
    手工装配：依赖图 <= 10 个对象、没有作用域概念时，**永远优先**（显式、无魔法、好调试）；
    容器：依赖图深（几十个）、需要按作用域管理生命周期、需要按配置切换实现（多环境）时才有价值。
    容器的代价：
      · 依赖关系被"藏"进工厂函数里，读业务代码看不出来（要跳到注册处）；
      · 依赖名是字符串，拼错只有运行时才报错（TS 下可以用 token + 类型改善）；
      · "解析失败"的错误信息往往很难定位是哪个入口触发的；
      · 引入容器 = 引入一个需要学习的框架，团队要一起接受它。`);

// ===========================================================================
// 7. 与 ESM 模块系统的关系
// ===========================================================================

console.log('\n--- 6. 依赖注入与 ESM 模块系统：静态导入能不能替代 DI？ ---');

console.log(`  很多人会想："JS 有 import/export，不就是依赖管理吗？"
  答案是：**ESM 解决的是"代码怎么组织"，DI 解决的是"运行时用哪一份实现"**，两者不能互相替代。

  看本文件顶部那一行：
      import { randomUUID } from 'node:crypto';
  这是一条**静态导入**，它有三个特性让它无法替代 DI：
    ① 加载期绑定：模块在**加载时**就被求值并绑定，运行时无法把它换成别的实现；
    ② 全局共享：Node 的模块缓存保证同一模块只被求值一次，
       一旦被 mock，**同进程内所有用到它的代码**都会受影响（不是"只影响这个测试"）；
    ③ 隐式：依赖出现在文件顶部，但它是不是"可替换的业务依赖"完全靠人判断。

  所以用 ESM 时，有下面三条路（按推荐程度排序）：

  【路线 A（推荐）】把"需要替换的东西"从模块导入，改成**注入**。
    例如把"生成 ID"这件事从直接调用 randomUUID，改成构造函数注入 newId：`);

// 演示：同一段业务逻辑，分别用"写死的 randomUUID"与"注入的 newId"
class TicketService {
  constructor({ newId }) {
    this.newId = newId;
  }
  issue({ title }) {
    return { ticketId: this.newId(), title, issuedAt: '2026-01-15T09:00:00.000Z' };
  }
}
const prodTicket = new TicketService({ newId: () => randomUUID() }); // 生产：真随机
let counter = 0;
const testTicket = new TicketService({ newId: () => `TICKET-${++counter}` }); // 测试：可预测
console.log(`     生产（真 UUID）：${prodTicket.issue({ title: '登录失败' }).ticketId}`);
console.log(`     测试（计数器）：  ${testTicket.issue({ title: '登录失败' }).ticketId}`);
console.log(`     同一个 TicketService，两种行为 —— 差别只在注入的 newId。
     顶部那条 import { randomUUID } 只在"组装这一层"出现（组合根），
     业务类完全不知道 UUID 的存在，因此也就完全不受它影响。`);

console.log(`\n  【路线 B】动态 import()：当"用哪份实现"要到运行时才能决定时（按环境、按配置）。`);

// 动态导入：返回模块命名空间对象
const cryptoModule = await import('node:crypto');
const sameModuleObject = cryptoModule === (await import('node:crypto')); // 模块缓存：同一个对象
console.log(`     动态导入 node:crypto 成功，导出的成员数：${Object.keys(cryptoModule).length}`);
console.log(`     两次动态导入返回同一个模块对象（模块缓存）：${sameModuleObject}`);
console.log(`     注意：动态 import 仍然解析的是"模块标识符"，
     它能解决"运行时才知道用哪个模块"（如按环境加载 ./gateway.stripe.js 或 ./gateway.alipay.js），
     但它**不解决"测试时替换成假实现"** —— 因为假实现通常不在真实文件系统里。
     👉 所以：可替换的**业务依赖**用注入；只有"平台/环境级"的选择才用动态导入。`);

console.log(`\n  【路线 C】模块 mock（如 vitest 的 vi.mock('./gateway.js')）：`);

const moduleMockTable = [
  ['做法', '作用范围', '是否能类型检查', '主要代价'],
  ['构造器注入（路线 A）', '只影响这一个对象实例', '能（参数类型可见）', '要多写一层参数传递'],
  ['动态 import（路线 B）', '整个进程的解析结果', '部分', '异步、仍需真实模块存在'],
  ['模块 mock（路线 C）', '整个测试文件/进程（隐式全局替换）', '取决于工具', '隐式魔法、影响所有使用者、容易"测了个寂寞"'],
];
printTable(moduleMockTable);

console.log(`
  ★结论：
    ESM 的静态导入是一种**依赖声明**（比全局变量好得多），但它不是依赖注入 ——
    它把依赖固定在"模块路径"上，而 DI 把依赖固定在"参数"上。
    测试需要替换的依赖（网关、时钟、随机数、文件系统、HTTP），
    一律建议走**注入**；模块 mock 留给"实在无法注入"的第三方库
    （详见 28_testing 与 29_npm_libraries 里的 mock 章节）。`);

// ===========================================================================
// 8. 反模式：服务定位器
// ===========================================================================

console.log('\n--- 7. 反模式：服务定位器（Service Locator）---');

/** ❌ 服务定位器：业务代码自己去"要"依赖，而不是被"给"依赖 */
class OrderServiceLocatorStyle {
  constructor(container) {
    this.container = container; // 只拿到容器，具体依赖全靠运行时去要
  }
  pay({ orderId, amount }) {
    // ★依赖是隐式的：看构造函数只知道"它需要一个容器"，不知道具体要什么
    const gateway = this.container.resolve('gateway');
    const logger = this.container.resolve('logger');
    const repository = this.container.resolve('repository');
    logger.info(`支付 ${orderId}`);
    const result = gateway.charge({ orderId, amount, currency: 'CNY' });
    repository.save({ id: orderId, status: '已付款' });
    return result;
  }
}

const locatorVersion = new OrderServiceLocatorStyle(container);
console.log(`  服务定位器版本可以工作：${JSON.stringify(locatorVersion.pay({ orderId: 'SO-7001', amount: 10 }))}`);
console.log(`  但它有三个硬伤：
    ① 依赖隐式：构造函数签名看不出它需要 gateway/logger/repository，
       想知道它依赖什么，只能读方法体（甚至读到运行时才会发现）；
    ② 测试更麻烦：注入版只需要传 3 个假对象，
       定位器版要先搭一个**配置正确的容器**（少注册一个就报错）；
    ③ 隐藏失败：注册漏了要到**第一次调用**时才炸，而不是在创建对象时。
  ★一句话：服务定位器把"依赖"从参数搬回了全局状态，
    是把 GoF 的"控制反转"又反转了回去，因此被称为反模式。`);

// 对比：同样的测试，两种写法的成本
console.log('\n  同一个测试（"支付后订单状态是已付款"）的两种写法成本对比：');
console.log(`    注入版（本文件第 2 节）：
        const gateway = new FakeGateway();
        const service = new OrderService({ gateway, logger: new SpyLogger(), repository });
        service.pay({ orderId: 'X', amount: 1 });
        expect(repository.findById('X').status).toBe('已付款');   // 4 行，依赖一目了然
    定位器版：
        const c = new Container();                                // 要重新搭一遍容器
        c.register('logger', { factory: () => new SpyLogger() });
        c.register('gateway', { factory: () => new FakeGateway() });
        c.register('repository', { factory: () => new InMemoryOrderRepository() });
        const service = new OrderServiceLocatorStyle(c);
        ...（而且 FakeGateway 的"假"要通过容器注册才能生效，链条更长）`);

// ===========================================================================
// 9. 代价与什么时候不需要 DI
// ===========================================================================

console.log('\n--- 8. DI 的代价与"什么时候不用" ---');

console.log(`【DI 的收益（按重要性排序）】
  1) ★可测试：把"必须连外部资源"的代码变成"可以在内存里跑的代码"（本文件最大的篇幅给了它）；
  2) 可替换：换渠道/换数据库/换时钟 = 换一个注入对象，业务代码零改动；
  3) 依赖显式：构造函数即依赖清单，读代码不用猜；
  4) 生命周期可控：谁长谁短被写明白了，而不是靠"什么被缓存了"的运气；
  5) 支持 DIP（18_solid_principles.js）：想注入就必须先有抽象，两者互相成就。

【DI 的代价】
  1) 多一层"传递"：依赖要从组合根一路传到深处，中间层可能被迫"只是转手"
     （这叫"依赖的搬运"，参数穿透多层的痛感是真实的）；
  2) 组合根集中了所有 new，它会变长（但换来的是"系统装配关系一目了然"，值得）；
  3) 容器引入学习成本与"魔法"：注册漏了/名字拼错了，只有运行时才知道；
  4) 过度抽象风险：为了注入而给每个类抽接口，代码量翻倍（Java 后遗症）；
  5) 调试跳转变多：运行时到底用了哪个实现，要顺着组合根找。

【什么时候不需要 DI】
  1) 脚本、一次性任务、< 200 行的工具：直接在 main 里 new，成本更低；
  2) 纯函数与纯数据：没有协作者，就没有依赖可注入；
  3) 依赖是"语言/运行时本身"：Math、JSON、Array、console ——
     没有人会为 Math.abs 注入一个假实现（真需要替换就把调用包一层再注入那一层）；
  4) 依赖确定不会变、也永远不需要在测试里替换：直接 new 没问题，
     但要**写注释说明这是有意的决定**（否则后人会以为是疏忽）；
  5) 团队还没有测试文化时：先建立测试习惯，再谈 DI ——
     没有测试的项目里引入 DI，只会得到"更多参数的痛苦"，拿不到"可测试"的回报。

【决策清单（照着问自己）】
  □ 这个类需要访问外部资源（网络/文件/数据库/时钟/随机数）吗？
      否 -> 不需要 DI。
      是 -> 继续。
  □ 我需要在测试里替换它，或者它未来会换实现吗？
      否 -> 直接 new，并写注释说明；
      是 -> 用**构造器注入**，把协作对象作为参数传进来。
  □ 这个依赖只在**某一次调用**里有效（时钟、当前用户、事务）吗？
      是 -> 用**参数注入**，不要放进构造函数。
  □ 依赖图超过 10 个对象，或需要按作用域管理生命周期吗？
      否 -> 写一个 createApp() 组合根函数就够；
      是 -> 才考虑容器。`);

// ===========================================================================
// 收尾
// ===========================================================================

console.log('\n--- 9. 本文件的测试结果汇总 ---\n');
const resultTable = [['#', '测试用例', '结果']];
testResults.forEach((r, i) => resultTable.push([String(i + 1), r.name, r.ok ? '✓ 通过' : `✗ 失败：${r.reason}`]));
printTable(resultTable);
const passed = testResults.filter((r) => r.ok).length;
console.log(`\n  ${passed} / ${testResults.length} 通过。`);
console.log(`  ★这 ${testResults.length} 条测试没有访问任何外部资源 —— 它们能存在，只因为
    OrderService 把 gateway / logger / repository / clock / newId 全部做成了注入点。
    这就是依赖注入的全部意义：**让"业务规则"可以被单独验证。**`);

console.log('\n全部演示完毕。');
