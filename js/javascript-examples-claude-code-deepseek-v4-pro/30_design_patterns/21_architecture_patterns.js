/**
 * ============================================================================
 * 知识点：应用架构模式 —— 分层、Repository、Service、DTO、MVC/MVVM、服务端韧性
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 架构模式（本仓库此前无任何项目分层内容）
 * 【难度等级】高级
 * 【前置知识】30_design_patterns/03_factory.js、07_strategy.js、
 *             18_solid_principles.js（DIP/ISP 是分层的理论基础）、
 *             19_dependency_injection.js（分层靠注入把各层接起来）、
 *             11_command.js（DTO 与命令对象的关系）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    设计模式解决"几个类怎么协作"，架构模式解决"**整个应用怎么切分**"。
 *    本文件覆盖六个主题，它们回答的是同一个问题的不同侧面：
 *      「一段需求进来，代码应该在哪一层被处理？边界在哪？」
 *      (a) 分层架构：表现层 / 业务层 / 数据访问层各自的职责与边界；
 *      (b) Repository 模式：把数据访问抽象成"集合式接口"，隔离存储细节；
 *      (c) Service 层：编排用例、划定事务边界；
 *      (d) DTO 与领域模型：为什么不能把它们合成一个；
 *      (e) MVC / MVVM：表现层内部的职责划分；
 *      (f) 服务端韧性模式：重试、熔断、降级、限流的概念定位与相互关系。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 需求要加一个"批量导入订单"的接口，结果发现业务规则写在 HTTP 路由处理函数里，
 *      只能把 30 行 if-else 复制一遍（→ 需要 Service 层）；
 *    - 要从 MySQL 换成 PostgreSQL，发现 SQL 散落在 40 个文件里（→ 需要 Repository）；
 *    - 接口返回的用户对象里带出了 passwordHash，被安全扫描通报（→ 需要 DTO）；
 *    - 一个下单流程要同时扣库存、写订单、发通知，扣库存成功但写订单失败，
 *      数据对不上账（→ 需要事务边界，通常由 Service 层划定）；
 *    - 下游报价服务抖动，前端页面大面积 500，其实"用 5 分钟前的缓存价格"完全可以接受
 *      （→ 需要重试/熔断/降级/限流这些韧性模式）；
 *    - 前端页面状态逻辑与 DOM 操作搅在一起，改一个交互要动五处
 *      （→ 需要 MVC/MVVM 的职责划分）。
 *
 * 3. 核心语法要点（这里的"语法"是**分层规则**与**接口契约**）
 *    - 依赖方向必须是单向的：表现层 → 业务层 → 数据访问层。
 *      反向需要（业务层要通知表现层用事件；数据层要回调业务规则用接口倒置）。
 *    - 每一层只依赖"下一层的**接口/契约**"，不依赖具体实现（18_solid_principles.js 的 DIP）。
 *      JS 没有 interface，所以契约靠"抽象基类抛错 + 文档"或 TypeScript 的 interface 表达。
 *    - Repository 是**集合式接口**（collection-like）：像操作内存集合一样操作领域对象
 *      （findById / findByCustomer / save / remove），而不是"表操作"（insertRow/updateColumn）。
 *    - Service 层的方法应当**一个方法对应一个用例**（placeOrder / cancelOrder），
 *      方法内部是"编排"：调仓储、调领域模型、调外部服务，并划定事务边界。
 *    - DTO 是**跨边界的数据形状**：只有数据、没有行为、可序列化、字段可枚举且受控。
 *      领域模型是**有行为与不变量的对象**：它保证"订单不可能处于非法状态"。
 *    - 同步/异步是契约的一部分：Repository 的方法签名一旦从"返回值"变成"返回 Promise"，
 *      上层必须同步修改 —— 所以在可能换成远程实现时，**一开始就定义成异步**更安全。
 *    - 韧性模式的层叠顺序（本文件的实现）：
 *        限流（保护自己不被压垮）-> 熔断（快速失败，别打垮下游）->
 *        重试（对抗偶发抖动）-> 真实调用；降级包在最外层做兜底。
 *
 * 4. 常见陷阱
 *    - 贫血模型 + 胖服务：领域模型退化成只有 getter/setter 的数据袋，
 *      所有规则都写在 Service 里，最终 Service 变成 2000 行的上帝类。
 *    - 表现层泄漏业务：Controller 里写"VIP 打九折"这类规则，
 *      换个入口（定时任务、CLI、MQ 消费者）就得抄一遍。
 *    - 业务层泄漏 HTTP：Service 里出现 req/res、状态码、header，
 *      导致它无法被非 HTTP 入口复用，也无法单测。
 *    - DTO 与领域模型混用：直接把实体返回（泄露内部字段）、
 *      直接把请求体绑定到实体（攻击者可以改 isAdmin 这类字段）。
 *    - Repository 退化成 DAO：每个方法对应一条 SQL，业务层拼装查询条件，
 *      换存储依然要改一大堆代码 —— 那 Repository 就白抽象了。
 *    - 过度分层：小脚本、一次性任务、纯 CRUD 后台，硬套五层只会让
 *      "一个查询"要跳 6 个文件（本文件最后一节专门讲这个）。
 *    - 韧性模式用错顺序：把重试放在熔断外面，会让"重试风暴"绕过熔断保护；
 *      无上限重试会把下游彻底打垮；不区分"可重试错误"会重试到永远失败。
 *    - 熔断参数照抄：阈值/超时要根据自己的流量与下游恢复时间调，没有万能值。
 *    - 降级返回的数据必须"业务上可接受"：降级返回脏数据比报错更危险。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/21_architecture_patterns.js
 *
 * 【预期输出】
 *   第 1 节：一个"什么都写在一起"的下单接口，列出 6 条真实问题；
 *   第 2 节：三层架构的职责/边界/变化原因对照表与依赖方向；
 *   第 3 节：Repository 模式（两个实现 + 一个审计装饰器），验证可替换性；
 *   第 4 节：Service 层与事务边界（库存预留失败时自动回滚）；
 *   第 5 节：DTO 与领域模型（字段白名单、防止越权修改、领域不变量）；
 *   第 6 节：MVC 与 MVVM 的可运行对照（含一个 20 行的数据绑定演示）；
 *   第 7 节：韧性四件套（重试/熔断/降级/限流）的可运行组合演示；
 *   第 8 节：迷你三层应用的端到端用例 + 单元测试 + 异步契约变更的代价；
 *   第 9 节：什么时候**不需要**分层（过度分层同样是负债）。
 * ============================================================================
 */

import { isDeepStrictEqual } from 'node:util';

// ===========================================================================
// 0. 工具：表格、迷你测试框架、可注入的假时钟
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

/** 可注入的假时钟：让"重试退避""熔断冷却""限流补充"这些时间相关逻辑完全可复现 */
function createFakeClock(startIso = '2026-01-15T09:00:00.000Z') {
  let ms = Date.parse(startIso);
  return {
    now: () => ms,
    iso: () => new Date(ms).toISOString(),
    advance: (deltaMs) => {
      ms += deltaMs;
      return ms;
    },
  };
}

// ===========================================================================
// 1. 坏味道：所有事情挤在一个"接口处理函数"里
// ===========================================================================

console.log('=== 应用架构模式 ===\n');
console.log('--- 1. 坏味道：一个函数承担了四层的工作 ---');

/** 假装这是"内存数据库"，用来演示坏味道 */
const naiveTables = { orders: [], inventory: { 'SKU-KB': 10, 'SKU-CHAIR': 2 }, seq: 0 };

/**
 * ❌ 典型的"路由处理函数什么都干"：
 * 它同时是表现层（解析请求、拼响应）、业务层（折扣规则、库存判断）、
 * 数据访问层（直接操作表），还顺手做了 DTO（直接把内部结构返回）。
 */
function naiveCreateOrderHandler(requestBody) {
  // ① 表现层职责：解析协议 —— 但它连字段白名单都没有
  const body = JSON.parse(JSON.stringify(requestBody));

  // ② 业务层职责：规则散落在这里
  if (!body.customerId) return { status: 400, body: { error: '缺少客户' } };
  if (!Array.isArray(body.items) || body.items.length === 0) return { status: 400, body: { error: '没有商品' } };

  // ③ 数据访问层职责：直接操作"表"，换存储要改这里（而且散落在每个接口里）
  // ④ 没有事务：边检查边扣减，第二个商品库存不足时直接 return，
  //    **第一个商品已经扣掉的库存永远不会被归还** —— 这就是"缺少事务边界"的经典后果。
  for (const item of body.items) {
    const stock = naiveTables.inventory[item.sku];
    if (stock === undefined) return { status: 400, body: { error: `未知商品 ${item.sku}` } };
    if (stock < item.qty) return { status: 409, body: { error: `${item.sku} 库存不足` } };
    naiveTables.inventory[item.sku] -= item.qty;
  }

  const order = {
    id: `ORD-${++naiveTables.seq}`,
    customerId: body.customerId,
    items: body.items,
    status: '待付款',
    // ⑤ 内部字段与业务字段混在一起，直接返回给前端
    _internalAuditTrail: ['created'],
    internalRiskScore: 0,
  };
  naiveTables.orders.push(order);
  return { status: 201, body: order };
}

const naiveResult = naiveCreateOrderHandler({ customerId: 'C-1', items: [{ sku: 'SKU-CHAIR', qty: 2 }] });
console.log(`  调用结果：HTTP ${naiveResult.status}`);
console.log(`  返回体（注意内部字段一起被吐出去了）：${JSON.stringify(naiveResult.body)}`);
console.log(`  此时库存：${JSON.stringify(naiveTables.inventory)}`);

// 演示"没有事务"的后果：第二个商品库存不足时，第一个商品已经被扣掉的库存不会归还
const stockBefore = naiveTables.inventory['SKU-KB'];
const partialFailure = naiveCreateOrderHandler({
  customerId: 'C-2',
  items: [
    { sku: 'SKU-KB', qty: 1 }, // 这一项会被扣掉
    { sku: 'SKU-CHAIR', qty: 5 }, // 这一项库存不足，整个请求失败
  ],
});
console.log(`\n  第二次调用（第二个商品库存不足，整个请求应当失败）：`);
console.log(`    返回：HTTP ${partialFailure.status} ${JSON.stringify(partialFailure.body)}`);
console.log(`    但 SKU-KB 的库存已经被扣掉了：${stockBefore} -> ${naiveTables.inventory['SKU-KB']}（期望仍是 ${stockBefore}）`);
console.log(`    ★失败是"部分生效"的 —— 这类脏数据在真实项目里要靠人工对账才能发现。`);

const naiveProblems = [
  ['#', '问题', '真实后果'],
  ['1', '业务规则与 HTTP 协议耦合', '加一个"定时任务下单"入口就要把规则抄一遍'],
  ['2', 'SQL/表结构散落在每个接口里', '换数据库要改 N 个文件，且必然漏改'],
  ['3', '没有事务边界', '中途失败留下脏数据（上面 SKU-KB 就被误扣了）'],
  ['4', '没有字段白名单', '攻击者可以提交 isAdmin 之类的字段（批量赋值漏洞）'],
  ['5', '内部字段直接外泄', 'internalRiskScore 出现在接口返回里'],
  ['6', '无法单元测试', '想测"库存不足要拒绝"必须构造 HTTP 请求体并真的改内存表'],
];
console.log();
printTable(naiveProblems);

// ===========================================================================
// 2. 三层架构：职责、边界与依赖方向
// ===========================================================================

console.log('\n\n--- 2. 三层架构的职责与边界 ---\n');

const layerTable = [
  ['层', '职责', '应该有的东西', '绝对不能有的东西', '它变化的原因'],
  ['表现层 Presentation', '协议转换与编排响应', 'HTTP/CLI/MQ 入口、DTO 校验、错误码映射、鉴权', '业务规则、SQL、事务控制', '接口协议变了、前端要新字段、加新入口'],
  ['业务层 Application/Service', '用例编排与事务边界', '一个方法一个用例、编排仓储与领域对象、发事件', 'req/res、状态码、SQL、JSON 细节', '业务规则变了、流程变了'],
  ['领域层 Domain', '业务不变量与规则', '实体/值对象、领域方法、领域异常', '仓储实现、框架注解、IO', '业务规则变了'],
  ['数据访问层 Persistence', '存储细节的隔离', 'Repository 实现、SQL/ORM 映射、连接管理', '业务判断（比如"VIP 打折"）', '换数据库、加缓存、改表结构'],
];
printTable(layerTable);

console.log(`
  依赖方向（箭头只允许朝一个方向）：
      表现层  ──>  业务层  ──>  领域层  <──  数据访问层
                                   ▲
                          两者都依赖"领域层定义的契约"

  要点说明：
    ① 业务层依赖的是**仓储接口**（由业务/领域这一侧定义），
       数据访问层去**实现**这个接口 —— 这就是 DIP（18_solid_principles.js 第 5 节），
       也是"依赖倒置"在架构上的最大价值：换数据库时业务层一行不改。
    ② 领域层不认识任何外部东西：它不知道有 HTTP，也不知道有 SQL。
       所以它最好写测试，也最好被复用（CLI、定时任务、MQ 消费者都能用同一套规则）。
    ③ 允许的跨层例外只有一个：表现层可以直接用 DTO 做校验，
       但**不允许**表现层直接访问数据库（那是"抄近路"，会在半年后变成维护灾难）。
    ④ 分层的本质是"**控制依赖方向**"，而不是"文件夹分三个目录"。
       只要依赖方向乱了，目录再多也只是把意大利面装进三个盘子。`);

// ===========================================================================
// 3. 领域层：有行为与不变量的模型（不是数据袋）
// ===========================================================================

console.log('\n\n--- 3. 领域层：领域模型、领域异常与不变量 ---\n');

/** 领域异常：业务规则被违反。注意它**不含** HTTP 状态码 —— 那是表现层的事 */
class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DomainError';
  }
}
/** 找不到资源（表现层会把它映射成 404） */
class NotFoundError extends DomainError {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}
/** 状态冲突（表现层会把它映射成 409） */
class ConflictError extends DomainError {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}

const ORDER_STATUS = Object.freeze({
  PENDING: '待付款',
  PAID: '已付款',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
});

/**
 * 领域模型（充血模型）：它**自己**保证"订单不可能处于非法状态"。
 * 注意三个细节：
 *   ① 私有字段：外部只能通过 getter 读，通过领域方法改；
 *   ② 不变量在构造函数里校验：非法对象根本创建不出来；
 *   ③ 状态迁移规则写在模型里（与 14_state.js 同源，但这里不引入状态类，
 *      因为订单状态的规则简单且稳定 —— 这正是"什么时候不该用状态模式"的例子）。
 */
class Order {
  #id;
  #customerId;
  #items;
  #status = ORDER_STATUS.PENDING;
  #createdAt;
  #paidAt = null;
  #cancelReason = null;

  constructor({ id, customerId, items, createdAt }) {
    if (!id) throw new DomainError('订单号不能为空');
    if (!customerId) throw new DomainError('客户不能为空');
    if (!Array.isArray(items) || items.length === 0) throw new DomainError('订单必须至少包含一个商品');
    for (const item of items) {
      if (!item.sku) throw new DomainError('商品编码不能为空');
      if (!Number.isInteger(item.qty) || item.qty <= 0) throw new DomainError(`商品 ${item.sku} 的数量必须是正整数`);
      if (!(item.unitPrice >= 0)) throw new DomainError(`商品 ${item.sku} 的价格必须是非负数`);
    }
    this.#id = id;
    this.#customerId = customerId;
    // 防御性拷贝：避免外部拿到 items 后改掉订单内容
    this.#items = items.map((item) => Object.freeze({ sku: item.sku, qty: item.qty, unitPrice: item.unitPrice }));
    this.#createdAt = createdAt;
  }

  get id() {
    return this.#id;
  }
  get customerId() {
    return this.#customerId;
  }
  get status() {
    return this.#status;
  }
  get createdAt() {
    return this.#createdAt;
  }
  get paidAt() {
    return this.#paidAt;
  }
  get cancelReason() {
    return this.#cancelReason;
  }
  /** 只读视图：返回拷贝，外部改不动内部数组 */
  get items() {
    return this.#items.map((item) => ({ ...item }));
  }
  /** 派生属性：金额永远由明细算出来，不可能与明细不一致 */
  get totalAmount() {
    return Number(this.#items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0).toFixed(2));
  }

  // ---- 领域行为：每个方法都维护不变量 ----
  pay(paidAt) {
    if (this.#status !== ORDER_STATUS.PENDING) throw new ConflictError(`订单处于「${this.#status}」，不能付款`);
    this.#status = ORDER_STATUS.PAID;
    this.#paidAt = paidAt;
    return this;
  }
  ship() {
    if (this.#status !== ORDER_STATUS.PAID) throw new ConflictError(`订单处于「${this.#status}」，不能发货`);
    this.#status = ORDER_STATUS.SHIPPED;
    return this;
  }
  complete() {
    if (this.#status !== ORDER_STATUS.SHIPPED) throw new ConflictError(`订单处于「${this.#status}」，不能确认收货`);
    this.#status = ORDER_STATUS.COMPLETED;
    return this;
  }
  cancel(reason) {
    if (this.#status === ORDER_STATUS.SHIPPED || this.#status === ORDER_STATUS.COMPLETED) {
      throw new ConflictError(`订单处于「${this.#status}」，不能取消`);
    }
    if (this.#status === ORDER_STATUS.CANCELLED) throw new ConflictError('订单已经取消过了');
    this.#status = ORDER_STATUS.CANCELLED;
    this.#cancelReason = reason;
    return this;
  }
}

console.log('  领域模型的不变量保护（非法状态根本构造不出来）：');
const invariantProbes = [
  ['商品数量为 0', () => new Order({ id: 'ORD-1', customerId: 'C-1', items: [{ sku: 'S', qty: 0, unitPrice: 1 }], createdAt: 'T' })],
  ['订单没有任何商品', () => new Order({ id: 'ORD-1', customerId: 'C-1', items: [], createdAt: 'T' })],
  ['缺少客户', () => new Order({ id: 'ORD-1', customerId: '', items: [{ sku: 'S', qty: 1, unitPrice: 1 }], createdAt: 'T' })],
];
for (const [label, build] of invariantProbes) {
  try {
    build();
    console.log(`    ✗ ${label}：居然创建成功了（不应该）`);
  } catch (err) {
    console.log(`    ✓ ${label} -> 被拒绝：${err.name}: ${err.message}`);
  }
}

const demoOrder = new Order({
  id: 'ORD-1001',
  customerId: 'C-1',
  items: [
    { sku: 'SKU-KB', qty: 1, unitPrice: 299 },
    { sku: 'SKU-MOUSE', qty: 2, unitPrice: 129 },
  ],
  createdAt: '2026-01-15T09:00:00.000Z',
});
console.log(`\n  合法订单：${demoOrder.id}，状态=${demoOrder.status}，金额=${demoOrder.totalAmount}（由明细派生，不可能不一致）`);
console.log('  状态迁移保护（与 14_state.js 的"非法操作要拒绝"是同一个思想）：');
try {
  demoOrder.ship(); // 还没付款就发货
} catch (err) {
  console.log(`    ✓ 未付款就发货 -> ${err.name}: ${err.message}`);
}
console.log(`    ✓ 正常付款: ${(() => { demoOrder.pay('2026-01-15T09:05:00.000Z'); return demoOrder.status; })()}`);

// ===========================================================================
// 4. Repository 模式：把数据访问抽象成集合式接口
// ===========================================================================

console.log('\n\n--- 4. Repository 模式：集合式接口 + 可替换的实现 ---\n');
console.log(`  Repository 的定位：让业务层觉得"领域对象都在一个内存集合里"，
  从而完全不知道背后是 MySQL、MongoDB、HTTP 还是内存。
  契约由**业务侧**定义（依赖倒置），实现在数据访问层。`);

/**
 * 仓储契约（抽象基类）。
 * JS 没有 interface，所以用"抽象方法 + 抛错"表达契约，并在注释里写清语义。
 * 注意方法名是**领域语言**（findById / findByCustomer），不是表操作语言（selectOne）。
 */
class OrderRepository {
  /** @abstract 生成新的订单号（真实项目里可能是数据库自增或 UUID 生成器） */
  nextId() {
    throw new Error(`${this.constructor.name} 必须实现 nextId()`);
  }
  /** @abstract @returns {Order|null} 返回**领域对象**，而不是数据库行 */
  findById(_id) {
    throw new Error(`${this.constructor.name} 必须实现 findById(id)`);
  }
  /** @abstract @returns {Order[]} */
  findByCustomer(_customerId) {
    throw new Error(`${this.constructor.name} 必须实现 findByCustomer(customerId)`);
  }
  /** @abstract 新增或更新（upsert）—— 集合式接口不区分 insert/update */
  save(_order) {
    throw new Error(`${this.constructor.name} 必须实现 save(order)`);
  }
  /** @abstract @returns {number} */
  count() {
    throw new Error(`${this.constructor.name} 必须实现 count()`);
  }
}

/** 实现一：内存仓储（测试、本地开发、演示用） */
class InMemoryOrderRepository extends OrderRepository {
  #byId = new Map();
  #seq = 1000;
  /** 允许注入"从哪个号开始"，便于测试断言 */
  constructor({ startSeq = 1000 } = {}) {
    super();
    this.#seq = startSeq;
  }
  nextId() {
    this.#seq += 1;
    return `ORD-${this.#seq}`;
  }
  findById(id) {
    // 注意：返回的是**同一个领域对象**（内存实现天然如此）。
    // 真实实现每次都要"把数据库行重新组装成领域对象"，这正是仓储要封装的事情。
    return this.#byId.get(id) ?? null;
  }
  findByCustomer(customerId) {
    return [...this.#byId.values()].filter((order) => order.customerId === customerId);
  }
  save(order) {
    this.#byId.set(order.id, order);
    return order;
  }
  count() {
    return this.#byId.size;
  }
}

/** 实现二（装饰器风格）：包住任意仓储，记录所有访问 —— 演示"可叠加" */
class AuditingOrderRepository extends OrderRepository {
  constructor(inner, { logger = console, now = () => new Date().toISOString() } = {}) {
    super();
    this.inner = inner;
    this.logger = logger;
    this.now = now;
    this.auditTrail = [];
  }
  #record(operation, detail) {
    this.auditTrail.push({ at: this.now(), operation, detail });
  }
  nextId() {
    const id = this.inner.nextId();
    this.#record('nextId', id);
    return id;
  }
  findById(id) {
    const found = this.inner.findById(id);
    this.#record('findById', `${id} -> ${found ? '命中' : '未命中'}`);
    return found;
  }
  findByCustomer(customerId) {
    const list = this.inner.findByCustomer(customerId);
    this.#record('findByCustomer', `${customerId} -> ${list.length} 条`);
    return list;
  }
  save(order) {
    const saved = this.inner.save(order);
    this.#record('save', `${order.id} 状态=${order.status}`);
    return saved;
  }
  count() {
    const n = this.inner.count();
    this.#record('count', String(n));
    return n;
  }
}

console.log(`  仓储契约的方法：nextId / findById / findByCustomer / save / count`);
console.log(`  ★集合式接口的两个特征：
    ① 方法用**领域语言**（findByCustomer），而不是数据库语言（selectWhereCustomerEq）；
    ② save 不区分 insert/update —— 因为在"集合"的心智模型里，放进去就是放进去。
    这是 Repository 与 DAO 的关键区别：DAO 面对表，Repository 面对领域对象集合。`);

// ===========================================================================
// 5. Service 层：用例编排与事务边界
// ===========================================================================

console.log('\n\n--- 5. Service 层：一个方法就是一个用例，并划定事务边界 ---\n');

/**
 * 事务边界的最小模拟（类似 UnitOfWork 的雏形）。
 * 真实项目里由数据库事务或框架（Spring 的 @Transactional）完成；
 * 这里用"撤销日志"模拟"要么全成功、要么全回滚"的语义。
 */
class TransactionScope {
  #compensations = [];
  /** 注册一个补偿动作（回滚时按注册顺序的**逆序**执行） */
  onRollback(compensate) {
    this.#compensations.push(compensate);
    return this;
  }
  run(work) {
    try {
      const result = work();
      this.#compensations = []; // 提交：丢弃补偿日志
      return result;
    } catch (err) {
      // 回滚：逆序补偿（先做的后撤，与 11_command.js 里宏命令的 undo 同理）
      for (const compensate of [...this.#compensations].reverse()) {
        try {
          compensate();
        } catch (rollbackError) {
          // ★真实项目里"回滚失败"是最危险的情况，必须告警而不是吞掉
          console.error(`  ⚠ 回滚失败：${rollbackError.message}`);
        }
      }
      this.#compensations = [];
      throw err;
    }
  }
}

/** 库存仓储（另一个聚合的仓储，用来说明"一个用例要协调多个仓储"） */
class InventoryRepository {
  #stock = new Map();
  constructor(initialStock = {}) {
    for (const [sku, qty] of Object.entries(initialStock)) this.#stock.set(sku, qty);
  }
  available(sku) {
    return this.#stock.get(sku) ?? 0;
  }
  reserve(sku, qty) {
    const left = this.available(sku);
    if (left < qty) throw new ConflictError(`商品 ${sku} 库存不足：需要 ${qty}，仅剩 ${left}`);
    this.#stock.set(sku, left - qty);
    return left - qty;
  }
  release(sku, qty) {
    this.#stock.set(sku, this.available(sku) + qty);
  }
  snapshot() {
    return Object.fromEntries([...this.#stock.entries()].sort());
  }
}

/** 商品目录（查询价格：领域模型只接收"算好的价格"，不负责查价） */
class ProductCatalog {
  #prices = new Map();
  constructor(prices = {}) {
    for (const [sku, price] of Object.entries(prices)) this.#prices.set(sku, price);
  }
  priceOf(sku) {
    const price = this.#prices.get(sku);
    if (price === undefined) throw new DomainError(`未知商品：${sku}`);
    return price;
  }
}

/** 入参/出参的 DTO 转换（下一节详述） */
const ORDER_DTO_FIELDS = ['id', 'customerId', 'status', 'items', 'totalAmount', 'createdAt', 'paidAt', 'cancelReason'];

/**
 * 把领域对象转成 DTO。
 * 为什么要有这个函数？因为它是一个**白名单**：
 * 以后领域模型加了内部字段（风险分、审计轨迹、内部备注），
 * 只要不写进这个函数，就绝不会外泄。
 */
function toOrderDTO(order) {
  const dto = {
    id: order.id,
    customerId: order.customerId,
    status: order.status,
    items: order.items,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    cancelReason: order.cancelReason,
  };
  // 自检：保证 DTO 的字段集合永远是受控的白名单（防止有人 later 随手加了字段）
  const unexpected = Object.keys(dto).filter((key) => !ORDER_DTO_FIELDS.includes(key));
  if (unexpected.length > 0) throw new Error(`DTO 出现了未登记的字段：${unexpected.join(', ')}`);
  return dto;
}

/**
 * 业务层（应用服务）：一个方法 = 一个用例。
 * 它的职责只有三件事：**校验入参 -> 编排（仓储/领域/外部服务）-> 返回 DTO**。
 * 注意它 import 不到任何 HTTP 或 SQL 相关的东西（这正是它能被复用与单测的原因）。
 */
class OrderApplicationService {
  constructor({ orders, inventory, catalog, notifications, clock = () => new Date().toISOString(), logger = console }) {
    this.orders = orders;
    this.inventory = inventory;
    this.catalog = catalog;
    this.notifications = notifications;
    this.clock = clock;
    this.logger = logger;
  }

  /** 用例 1：下单 */
  placeOrder(command) {
    // ① 入参校验（属于应用层职责：它知道"这次调用"的上下文，但不含业务规则）
    if (!command || typeof command !== 'object') throw new DomainError('请求体必须是对象');
    if (!command.customerId) throw new DomainError('缺少 customerId');
    if (!Array.isArray(command.items) || command.items.length === 0) throw new DomainError('items 必须是非空数组');

    const tx = new TransactionScope();
    return tx.run(() => {
      // ② 用目录补全价格（领域模型不查库，只接收算好的数据）
      const items = command.items.map((item) => ({
        sku: item.sku,
        qty: item.qty,
        unitPrice: this.catalog.priceOf(item.sku),
      }));

      // ③ 建领域对象（不变量校验发生在领域层）
      const order = new Order({
        id: this.orders.nextId(),
        customerId: command.customerId,
        items,
        createdAt: this.clock(),
      });

      // ④ 预留库存：逐个预留，并登记"回滚时释放"
      for (const item of order.items) {
        const left = this.inventory.reserve(item.sku, item.qty);
        // ★这就是事务边界的价值：如果后面的步骤失败，这里是自动补偿的
        tx.onRollback(() => this.inventory.release(item.sku, item.qty));
        this.logger.log(`      [service] 预留 ${item.sku} × ${item.qty}，剩余 ${left}`);
      }

      // ⑤ 持久化
      this.orders.save(order);

      // ⑥ 旁路副作用：通知失败不应该让下单失败（这是有意的设计决策，要写清楚）
      try {
        this.notifications.orderPlaced(order);
      } catch (err) {
        this.logger.log(`      [service] 通知发送失败，已忽略（不影响下单）：${err.message}`);
      }

      return toOrderDTO(order);
    });
  }

  /** 用例 2：付款 */
  payOrder({ orderId, paidAt }) {
    const order = this.orders.findById(orderId);
    if (!order) throw new NotFoundError(`订单不存在：${orderId}`);
    order.pay(paidAt ?? this.clock()); // 状态规则在领域模型里，服务层不重复判断
    this.orders.save(order);
    return toOrderDTO(order);
  }

  /** 用例 3：取消（要归还库存 —— 说明"取消"不只是改个状态） */
  cancelOrder({ orderId, reason }) {
    const tx = new TransactionScope();
    return tx.run(() => {
      const order = this.orders.findById(orderId);
      if (!order) throw new NotFoundError(`订单不存在：${orderId}`);
      order.cancel(reason ?? '客户取消');
      for (const item of order.items) {
        this.inventory.release(item.sku, item.qty);
        tx.onRollback(() => this.inventory.reserve(item.sku, item.qty));
      }
      this.orders.save(order);
      return toOrderDTO(order);
    });
  }

  /** 用例 4：查询（没有事务，没有写操作） */
  getOrder(orderId) {
    const order = this.orders.findById(orderId);
    if (!order) throw new NotFoundError(`订单不存在：${orderId}`);
    return toOrderDTO(order);
  }
}

/** 通知服务（外部系统，用内存模拟） */
class NotificationService {
  constructor() {
    this.sent = [];
  }
  orderPlaced(order) {
    this.sent.push({ channel: 'sms', text: `订单 ${order.id} 已创建，金额 ${order.totalAmount}` });
  }
}

console.log(`  Service 层的三个判据（本文件的 OrderApplicationService 全部满足）：
    ① 方法名是**用例名**（placeOrder / payOrder / cancelOrder），不是"表操作名"；
    ② 方法体是**编排**：调仓储、调领域模型、调外部服务，自己不写业务规则；
    ③ 一个方法内划定**事务边界**（这里的 TransactionScope）；`);

// ===========================================================================
// 6. 表现层：协议转换与错误码映射
// ===========================================================================

console.log('\n\n--- 6. 表现层：只做协议转换，不含业务规则 ---\n');

/**
 * 表现层（这里是一个"控制器"）。
 * 它做四件事，且只做四件事：
 *   ① 把协议输入（HTTP body / CLI argv / MQ 消息）转成 Command（DTO）；
 *   ② 调用应用服务；
 *   ③ 把结果或异常映射成协议输出（状态码 + body）；
 *   ④ 记录访问日志。
 * 它**不判断**"库存够不够""能不能取消" —— 那些是业务层与领域层的事。
 */
class OrderController {
  constructor({ orderService, logger = console }) {
    this.orderService = orderService;
    this.logger = logger;
  }

  /** 请求体白名单：只接受这三个字段，其余一律丢弃（防批量赋值攻击） */
  static #ALLOWED_COMMAND_FIELDS = ['customerId', 'items'];
  static #ALLOWED_ITEM_FIELDS = ['sku', 'qty'];

  #toCommand(body) {
    if (!body || typeof body !== 'object') throw new DomainError('请求体必须是 JSON 对象');
    const command = {};
    for (const field of OrderController.#ALLOWED_COMMAND_FIELDS) {
      if (field in body) command[field] = body[field];
    }
    if (Array.isArray(command.items)) {
      command.items = command.items.map((item) => {
        const clean = {};
        for (const field of OrderController.#ALLOWED_ITEM_FIELDS) {
          if (item && field in item) clean[field] = item[field];
        }
        return clean;
      });
    }
    return command;
  }

  /** 异常 -> HTTP 状态码的映射，只在这一处发生 */
  #toHttpStatus(err) {
    if (err instanceof NotFoundError) return 404;
    if (err instanceof ConflictError) return 409;
    if (err instanceof DomainError) return 400;
    return 500; // 未预期错误：记日志 + 500，绝不把内部堆栈返回给客户端
  }

  /** 一个"HTTP 入口"的等价物：输入请求 -> 输出响应 */
  handle(method, path, body) {
    this.logger.log(`    [controller] ${method} ${path}`);
    try {
      if (method === 'POST' && path === '/orders') {
        const dto = this.orderService.placeOrder(this.#toCommand(body));
        return { status: 201, body: dto };
      }
      if (method === 'GET' && /^\/orders\/[^/]+$/.test(path)) {
        const orderId = path.split('/')[2];
        return { status: 200, body: this.orderService.getOrder(orderId) };
      }
      if (method === 'POST' && /^\/orders\/[^/]+\/pay$/.test(path)) {
        const orderId = path.split('/')[2];
        return { status: 200, body: this.orderService.payOrder({ orderId, paidAt: body?.paidAt }) };
      }
      if (method === 'DELETE' && /^\/orders\/[^/]+$/.test(path)) {
        const orderId = path.split('/')[2];
        return { status: 200, body: this.orderService.cancelOrder({ orderId, reason: body?.reason }) };
      }
      return { status: 404, body: { error: '路由不存在' } };
    } catch (err) {
      const status = this.#toHttpStatus(err);
      // ★未预期错误（500）必须记录完整堆栈，但**不返回给客户端**
      if (status === 500) this.logger.log(`    [controller] 未预期错误：${err.stack ?? err.message}`);
      return { status, body: { error: err.message, type: err.name } };
    }
  }
}

// ===========================================================================
// 7. DTO 与领域模型：为什么必须分开
// ===========================================================================

console.log('\n\n--- 7. DTO 与领域模型：为什么要分成两套 ---\n');

const dtoVsModel = [
  ['对比项', '领域模型（Domain Model）', 'DTO（数据传输对象）'],
  ['存在的目的', '保证业务规则与不变量', '定义"跨边界的数据形状"'],
  ['有没有行为', '有：pay() / cancel() / totalAmount', '没有：纯数据，只有字段'],
  ['可变性', '通过领域方法受控地修改', '通常是不可变的普通对象，可自由序列化'],
  ['字段', '可以有私有字段与内部状态', '只包含"这个边界需要暴露的字段"'],
  ['生命周期', '长期存活，可能被多次修改', '一次请求/一次调用即弃'],
  ['依赖方向', '不依赖任何框架与 IO', '不依赖领域（它只是一个数据结构）'],
  ['何时变化', '业务规则变了', '接口协议变了（前端要新字段、换版本）'],
];
printTable(dtoVsModel);

console.log(`
  如果**不分开**，会发生三类真实事故：

  【事故一：内部字段外泄】
    直接 return order 会把 riskScore、internalNotes、审计轨迹一起返回。
    本文件的 toOrderDTO() 就是那个"白名单"，并且加了一条自检：
    任何未登记的字段都会抛错（把"不小心多返回字段"变成提交时就发现的错误）。

  【事故二：批量赋值攻击（Mass Assignment）】
    如果直接把请求体塞进实体或直接 delete 更新，
    攻击者可以提交 {"isAdmin": true} 或 {"totalAmount": 0} 这类字段。
    本文件的做法：表现层的 #toCommand() 是**双层白名单**（命令字段 + 明细字段）。

  【事故三：领域模型被协议绑架】
    一旦前端要求"金额用字符串以避免精度问题"，如果直接返回实体，
    你就会在领域模型里加 toJSON()、加格式化逻辑 —— 领域层开始依赖协议。
    正确做法：在 DTO 层做适配（加一个 amountText 字段），领域模型保持不变。

  【代价】多一层映射代码（手写 mapper 或引入自动映射库），
    字段改动要改两处，新同事常常忘记同步。
    所以在"没有外部边界"的地方（内部函数之间传值）不必事事造 DTO ——
    DTO 的价值恰恰在于**边界**：HTTP、MQ、RPC、文件、跨团队接口。`);

// ===========================================================================
// 8. 端到端：把三层串起来跑
// ===========================================================================

console.log('\n\n--- 8. 迷你三层应用：端到端跑通 ---\n');

/** 组装根（Composition Root）：整个程序唯一负责 new 的地方（见 19_dependency_injection.js） */
function createApplication({ orderRepository, startSeq, logger } = {}) {
  const inventory = new InventoryRepository({ 'SKU-KB': 10, 'SKU-MOUSE': 5, 'SKU-CHAIR': 2 });
  const catalog = new ProductCatalog({ 'SKU-KB': 299, 'SKU-MOUSE': 129, 'SKU-CHAIR': 1280 });
  const notifications = new NotificationService();
  const clock = createFakeClock();
  const orders = orderRepository ?? new InMemoryOrderRepository({ startSeq });
  const log = logger ?? { log: () => {} }; // 默认静音；需要观察某一层时把 logger 传进来

  const orderService = new OrderApplicationService({
    orders,
    inventory,
    catalog,
    notifications,
    clock: () => clock.iso(),
    logger: log,
  });
  const controller = new OrderController({ orderService, logger: log });
  return { orders, inventory, catalog, notifications, clock, orderService, controller };
}

const app = createApplication();

console.log('【场景 1】正常下单（201）');
const created = app.controller.handle('POST', '/orders', {
  customerId: 'C-1',
  items: [{ sku: 'SKU-KB', qty: 2 }, { sku: 'SKU-MOUSE', qty: 1 }],
});
console.log(`  HTTP ${created.status}  ${JSON.stringify(created.body)}`);
console.log(`  库存变化：${JSON.stringify(app.inventory.snapshot())}（KB 10->8，MOUSE 5->4）`);

console.log('\n【场景 2】查询订单（200）');
console.log(`  HTTP ${app.controller.handle('GET', `/orders/${created.body.id}`, null).status}`);
console.log(`  DTO 字段清单（受控白名单）：${JSON.stringify(Object.keys(created.body))}`);
console.log(`  确认内部字段没有外泄：${!('internalRiskScore' in created.body) && !('_internalAuditTrail' in created.body)}`);

console.log('\n【场景 3】库存不足（409）—— 重点看"事务回滚"');
// 换一个把日志打开的应用实例，以便观察"预留 -> 回滚释放"的完整过程
const tracedApp = createApplication({ logger: console });
const before = tracedApp.inventory.snapshot();
console.log(`  调用前的库存：${JSON.stringify(before)}`);
const failed = tracedApp.controller.handle('POST', '/orders', {
  customerId: 'C-2',
  items: [{ sku: 'SKU-MOUSE', qty: 1 }, { sku: 'SKU-CHAIR', qty: 99 }], // 第二项必然失败
});
console.log(`  HTTP ${failed.status}  ${JSON.stringify(failed.body)}`);
console.log(`  调用后的库存：${JSON.stringify(tracedApp.inventory.snapshot())}`);
console.log(`  ★第一个商品的库存被**自动释放**了（看上面日志里"预留 4"之后又被回滚）——
    这就是 Service 层划定事务边界的效果；`);
console.log(`    对比第 1 节的朴素版本：那里 SKU-KB 被误扣且永远不会归还。`);
console.log(`  订单也没有落库（订单数 ${tracedApp.orders.count()}），失败是**原子**的。`);

console.log('\n【场景 4】入参非法（400）与字段白名单');
const badQty = app.controller.handle('POST', '/orders', { customerId: 'C-3', items: [{ sku: 'SKU-KB', qty: 0 }] });
console.log(`  数量为 0：HTTP ${badQty.status}  ${JSON.stringify(badQty.body)}`);
const massAssign = app.controller.handle('POST', '/orders', {
  customerId: 'C-3',
  items: [{ sku: 'SKU-KB', qty: 1 }],
  totalAmount: 0, // ← 攻击者想直接指定金额
  isAdmin: true, // ← 攻击者想提权
  status: '已完成', // ← 攻击者想跳过流程
});
console.log(`  批量赋值攻击：HTTP ${massAssign.status}，订单金额 = ${massAssign.body.totalAmount}（不是 0，攻击失败）`);
console.log(`  新订单状态 = ${massAssign.body.status}（不是"已完成"，攻击失败）`);
console.log(`  这些字段之所以进不来，是因为表现层的 #toCommand() 只放行白名单字段。`);

console.log('\n【场景 5】状态机保护与错误码映射');
const orderId = created.body.id;
console.log(`  未付款直接取消：HTTP ${app.controller.handle('DELETE', `/orders/${orderId}`, { reason: '不想要了' }).status}（允许）`);
console.log(`  已取消再付款：  HTTP ${app.controller.handle('POST', `/orders/${orderId}/pay`, {}).status}（409 冲突）`);
console.log(`  查询不存在的订单：HTTP ${app.controller.handle('GET', '/orders/ORD-9999', null).status}（404）`);
console.log(`  未知路由：      HTTP ${app.controller.handle('GET', '/nope', null).status}（404）`);
console.log(`  ★注意 404/409/400 的**判定都不在控制器里**：控制器只是把领域异常翻译成状态码。`);

// ===========================================================================
// 9. 分层的收益一：可替换性（同一个服务层换仓储实现）
// ===========================================================================

console.log('\n\n--- 9. 分层的收益一：可替换性 ---\n');

/** 同一套端到端用例，对任意仓储实现都必须得到**完全相同**的结果 */
function runAcceptanceSuite(repositoryFactory, label) {
  const localApp = createApplication({ orderRepository: repositoryFactory() });
  const results = [];
  results.push(localApp.controller.handle('POST', '/orders', { customerId: 'C-1', items: [{ sku: 'SKU-KB', qty: 1 }] }));
  results.push(localApp.controller.handle('POST', '/orders', { customerId: 'C-1', items: [{ sku: 'SKU-MOUSE', qty: 2 }] }));
  const first = results[0].body.id;
  results.push(localApp.controller.handle('POST', `/orders/${first}/pay`, {}));
  results.push(localApp.controller.handle('GET', `/orders/${first}`, null));
  results.push(localApp.controller.handle('POST', '/orders', { customerId: 'C-2', items: [{ sku: 'SKU-CHAIR', qty: 99 }] }));
  results.push(localApp.controller.handle('GET', '/orders/ORD-4040', null));
  console.log(`  [${label}] 6 个用例的状态码：${results.map((r) => r.status).join(', ')}`);
  return {
    codes: results.map((r) => r.status),
    bodies: results.map((r) => r.body),
    count: localApp.orders.count(),
    stock: localApp.inventory.snapshot(),
  };
}

const plainRun = runAcceptanceSuite(() => new InMemoryOrderRepository({ startSeq: 2000 }), '内存仓储');

// 换成"审计仓储 + 内存仓储"（装饰器叠加），业务代码一行不改
let auditRef = null;
const auditClock = createFakeClock('2026-01-15T09:00:00.000Z');
const auditedRun = runAcceptanceSuite(() => {
  auditRef = new AuditingOrderRepository(new InMemoryOrderRepository({ startSeq: 2000 }), {
    // 注入确定性时钟，让审计时间戳在演示输出里可复现
    now: () => {
      auditClock.advance(1000);
      return auditClock.iso();
    },
  });
  return auditRef;
}, '审计仓储（装饰器）');

console.log(`\n  两次运行的状态码是否完全一致：${JSON.stringify(plainRun.codes) === JSON.stringify(auditedRun.codes)}`);
console.log(`  两次运行的响应体是否完全一致：${isDeepStrictEqual(plainRun.bodies, auditedRun.bodies)}`);
console.log(`  两次运行的订单数：${plainRun.count} / ${auditedRun.count}；库存：${JSON.stringify(plainRun.stock)} / ${JSON.stringify(auditedRun.stock)}`);
console.log(`  审计仓储额外产生的记录条数：${auditRef.auditTrail.length}`);
console.log(`  前 4 条审计记录：`);
for (const record of auditRef.auditTrail.slice(0, 4)) {
  console.log(`    ${record.at} ${record.operation}(${record.detail})`);
}
console.log(`\n  ★结论：**业务层与表现层完全不知道自己用的是哪个仓储实现**。
    要加缓存，就再套一层 CachingOrderRepository；
    要换成数据库，就写 MySqlOrderRepository —— 上层的代码与测试都不用动。
    这就是"依赖倒置 + Repository"在架构层面最大的收益。`);

// ===========================================================================
// 10. 分层的收益二：可测试性（不用数据库、不用 HTTP、不用时钟）
// ===========================================================================

console.log('\n\n--- 10. 分层的收益二：可测试性 ---\n');

/** 假仓储：只记录调用，完全在内存里，零外部依赖 */
class FakeOrderRepository extends OrderRepository {
  constructor({ failOnSave = false } = {}) {
    super();
    this.saved = [];
    this.seq = 5000;
    this.failOnSave = failOnSave;
  }
  nextId() {
    this.seq += 1;
    return `FAKE-${this.seq}`;
  }
  findById(id) {
    return this.saved.find((order) => order.id === id) ?? null;
  }
  findByCustomer(customerId) {
    return this.saved.filter((order) => order.customerId === customerId);
  }
  save(order) {
    if (this.failOnSave) throw new Error('模拟数据库写入失败');
    if (!this.saved.includes(order)) this.saved.push(order);
    return order;
  }
  count() {
    return this.saved.length;
  }
}

function buildTestableService(overrides = {}) {
  const orders = overrides.orders ?? new FakeOrderRepository();
  const inventory = overrides.inventory ?? new InventoryRepository({ 'SKU-KB': 3 });
  const logs = [];
  const service = new OrderApplicationService({
    orders,
    inventory,
    catalog: new ProductCatalog({ 'SKU-KB': 299 }),
    notifications: new NotificationService(),
    clock: () => '2026-01-15T09:00:00.000Z', // ← 注入确定性时钟，断言可复现
    logger: { log: (m) => logs.push(m) },
  });
  return { service, orders, inventory, logs };
}

console.log('  下面 6 条测试没有数据库、没有 HTTP、没有真实时间：');
it('下单成功时返回 201 等价的 DTO，金额由目录价格算出', () => {
  const { service } = buildTestableService();
  const dto = service.placeOrder({ customerId: 'C-9', items: [{ sku: 'SKU-KB', qty: 2 }] });
  expect(dto.totalAmount).toBe(598);
  expect(dto.status).toBe('待付款');
  expect(dto.createdAt).toBe('2026-01-15T09:00:00.000Z');
});
it('库存不足时抛出 ConflictError，且库存不被扣减（事务回滚生效）', () => {
  const { service, inventory } = buildTestableService();
  expect(() => service.placeOrder({ customerId: 'C-9', items: [{ sku: 'SKU-KB', qty: 99 }] })).toThrow();
  expect(inventory.available('SKU-KB')).toBe(3);
});
it('多商品场景：第二个商品库存不足时，第一个商品的预留被回滚', () => {
  const inventory = new InventoryRepository({ 'SKU-KB': 5, 'SKU-MOUSE': 0 });
  const { service } = buildTestableService({ inventory });
  expect(() =>
    service.placeOrder({ customerId: 'C-9', items: [{ sku: 'SKU-KB', qty: 2 }, { sku: 'SKU-MOUSE', qty: 1 }] }),
  ).toThrow();
  expect(inventory.available('SKU-KB')).toBe(5); // ← 关键断言：第一项被归还了
});
it('未知商品会被目录拒绝（400 等价）', () => {
  const { service } = buildTestableService();
  expect(() => service.placeOrder({ customerId: 'C-9', items: [{ sku: 'SKU-NOPE', qty: 1 }] })).toThrow();
});
it('查询不存在的订单抛 NotFoundError（404 等价）', () => {
  const { service } = buildTestableService();
  expect(() => service.getOrder('NOPE')).toThrow();
});
it('取消订单会归还库存，并且取消两次会冲突', () => {
  const { service, inventory } = buildTestableService();
  const dto = service.placeOrder({ customerId: 'C-9', items: [{ sku: 'SKU-KB', qty: 2 }] });
  expect(inventory.available('SKU-KB')).toBe(1);
  service.cancelOrder({ orderId: dto.id, reason: '测试取消' });
  expect(inventory.available('SKU-KB')).toBe(3);
  expect(() => service.cancelOrder({ orderId: dto.id, reason: '再来一次' })).toThrow();
});

// ===========================================================================
// 11. 契约的代价：仓储从同步变异步时，上层要跟着改
// ===========================================================================

console.log('\n\n--- 11. 契约的代价：同步仓储 vs 异步仓储 ---\n');
console.log(`  真实项目里最常见的架构级变更之一：本地内存/数据库是同步的，
  但一旦某天换成一个"远程仓储"（HTTP / gRPC / 另一个微服务），
  方法签名就必须变成返回 Promise —— 而**契约的同步/异步是契约的一部分**，
  上层（业务层、表现层）会被迫一起改。本节目的是让你亲眼看到这个代价。`);

/** 远程仓储：语义与内存仓储相同，但每个方法都返回 Promise（模拟网络往返） */
class RemoteOrderRepository extends OrderRepository {
  #inner;
  #networkCalls = 0;
  constructor(inner) {
    super();
    this.#inner = inner;
  }
  get networkCalls() {
    return this.#networkCalls;
  }
  // ★注意：这些方法全部返回 Promise，与父类的同步契约**不兼容**
  async nextId() {
    this.#networkCalls += 1;
    return this.#inner.nextId();
  }
  async findById(id) {
    this.#networkCalls += 1;
    return this.#inner.findById(id);
  }
  async findByCustomer(customerId) {
    this.#networkCalls += 1;
    return this.#inner.findByCustomer(customerId);
  }
  async save(order) {
    this.#networkCalls += 1;
    return this.#inner.save(order);
  }
  async count() {
    this.#networkCalls += 1;
    return this.#inner.count();
  }
}

/**
 * 异步版应用服务：逻辑与同步版**一字不差**，只是每个仓储调用都加了 await。
 * 代码量增加不多，但它证明了"契约变更会一路渗透到业务层"。
 */
class AsyncOrderApplicationService {
  constructor({ orders, inventory, catalog, notifications, clock }) {
    this.orders = orders;
    this.inventory = inventory;
    this.catalog = catalog;
    this.notifications = notifications;
    this.clock = clock;
  }
  async placeOrder(command) {
    if (!command?.customerId) throw new DomainError('缺少 customerId');
    if (!Array.isArray(command.items) || command.items.length === 0) throw new DomainError('items 必须是非空数组');

    const id = await this.orders.nextId(); // ← 唯一的差别：await
    const items = command.items.map((item) => ({ sku: item.sku, qty: item.qty, unitPrice: this.catalog.priceOf(item.sku) }));
    const order = new Order({ id, customerId: command.customerId, items, createdAt: this.clock() });

    const reserved = [];
    try {
      for (const item of order.items) {
        this.inventory.reserve(item.sku, item.qty);
        reserved.push(item);
      }
      await this.orders.save(order);
      return toOrderDTO(order);
    } catch (err) {
      for (const item of reserved.reverse()) this.inventory.release(item.sku, item.qty); // 手动回滚
      throw err;
    }
  }
  async getOrder(orderId) {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundError(`订单不存在：${orderId}`);
    return toOrderDTO(order);
  }
}

const remoteRepo = new RemoteOrderRepository(new InMemoryOrderRepository({ startSeq: 7000 }));
const asyncService = new AsyncOrderApplicationService({
  orders: remoteRepo,
  inventory: new InventoryRepository({ 'SKU-KB': 10 }),
  catalog: new ProductCatalog({ 'SKU-KB': 299 }),
  notifications: new NotificationService(),
  clock: () => '2026-01-15T09:00:00.000Z',
});

// 顶层 await 是 ESM 的能力（见 18_async 章节）
const asyncDto = await asyncService.placeOrder({ customerId: 'C-7', items: [{ sku: 'SKU-KB', qty: 1 }] });
const asyncFetched = await asyncService.getOrder(asyncDto.id);
console.log(`  异步仓储下单成功：${JSON.stringify(asyncDto)}`);
console.log(`  异步仓储查询一致：${isDeepStrictEqual(asyncDto, asyncFetched)}`);
console.log(`  网络往返次数（每个仓储方法算一次）：${remoteRepo.networkCalls}`);
console.log(`
  ★两个必须记住的工程结论：
    ① 同步/异步是**契约的一部分**：RemoteOrderRepository 虽然"继承了"OrderRepository，
       但它返回 Promise，对调用方而言这就是一个**不兼容**的实现
       （按里氏替换原则，它其实违反了契约 —— 见 18_solid_principles.js 第 3 节）。
    ② 因此：**如果你不确定未来会不会有远程实现，就一开始把仓储契约定义成异步的。**
       前期多写几个 await 的成本，远小于后期"全链路改签名 + 所有测试跟着改"的成本。
       这条经验在真实项目里被反复验证：只要系统会长大，就一定会遇到远程调用。`);

// ===========================================================================
// 12. MVC 与 MVVM：表现层内部的职责划分
// ===========================================================================

console.log('\n\n--- 12. MVC 与 MVVM：表现层内部的再划分 ---\n');
console.log(`  重要前提：**MVC/MVVM 是"表现层内部"的划分方式，与三层架构不冲突。**
  三层里的"表现层"在 Web 应用里通常就是 MVC 的那一组角色。`);

const mvcTable = [
  ['角色', 'MVC 的职责', 'MVVM 的对应物', '关键约束'],
  ['Model', '数据 + 业务规则（本文件的领域模型与服务）', 'Model（同一份）', '不依赖 View，也不知道自己被怎么展示'],
  ['View', '把数据渲染成界面（模板 / DOM）', 'View（模板 + 绑定）', '只做展示与"把用户操作转成命令"，不含业务规则'],
  ['Controller', '接收输入、调用 Model、选择 View、准备展示数据', '（被 ViewModel 取代）', '不写业务规则，只做"流程调度"'],
  ['ViewModel', '—（MVC 里没有这一层）', '把 Model 转成"视图状态 + 命令"，可观察', '不引用 View；View 订阅它'],
];
printTable(mvcTable);

/**
 * ---- MVC 形态的可运行演示 ----
 * View 是一个纯函数：DTO -> 字符串（真实项目里是模板引擎或组件）。
 */
class OrderView {
  /** 只负责"把数据变成界面"，不做任何判断与计算 */
  render(dto) {
    const items = dto.items.map((item) => `      · ${item.sku} × ${item.qty} = ¥${(item.qty * item.unitPrice).toFixed(2)}`).join('\n');
    return [
      `    订单 ${dto.id}（${dto.status}）`,
      `      客户：${dto.customerId}`,
      items,
      `      合计：¥${dto.totalAmount.toFixed(2)}`,
    ].join('\n');
  }
}

/** MVC 的 Controller：接收动作 -> 调 Model（服务层）-> 选 View -> 输出 */
class OrderMvcController {
  constructor({ orderService, view, logger = console }) {
    this.orderService = orderService;
    this.view = view;
    this.logger = logger;
  }
  /** 用户点击"查看订单" */
  showOrder(orderId) {
    try {
      const dto = this.orderService.getOrder(orderId); // Model 层（服务 + 领域）
      return this.view.render(dto); // View 层
    } catch (err) {
      return `    展示错误页面：${err.message}`; // 另一个 View
    }
  }
}

const mvcApp = createApplication();
const mvcCreated = mvcApp.controller.handle('POST', '/orders', { customerId: 'C-1', items: [{ sku: 'SKU-KB', qty: 1 }, { sku: 'SKU-CHAIR', qty: 1 }] });
const mvcController = new OrderMvcController({ orderService: mvcApp.orderService, view: new OrderView() });
console.log('  【MVC】Controller 调 Model、选 View，View 只做渲染：');
console.log(mvcController.showOrder(mvcCreated.body.id));
console.log(mvcController.showOrder('ORD-NOT-EXIST'));

/**
 * ---- MVVM 形态的可运行演示 ----
 * ViewModel：暴露"可观察的状态"与"命令"，**不引用 View**。
 * View：订阅 ViewModel 的变化并重新渲染（这就是"数据绑定"的本质）。
 */
class OrderViewModel {
  #orderService;
  #listeners = [];
  #state = { loading: false, error: null, orderText: '' };

  constructor({ orderService }) {
    this.#orderService = orderService;
  }

  /** 视图状态：外部只读 */
  get state() {
    return { ...this.#state };
  }

  /** 订阅：View 通过它实现"状态变了就重绘" */
  subscribe(listener) {
    this.#listeners.push(listener);
    listener(this.state); // 立即推一次初始状态
    return () => {
      const i = this.#listeners.indexOf(listener);
      if (i !== -1) this.#listeners.splice(i, 1);
    };
  }

  /** 私有：状态变更的唯一出口 —— 所有订阅者都会收到通知 */
  #setState(patch) {
    this.#state = { ...this.#state, ...patch };
    for (const listener of this.#listeners) listener(this.state);
  }

  /** 命令（Command）：View 只能通过调用命令来改变状态 */
  async loadOrder(orderId) {
    this.#setState({ loading: true, error: null });
    try {
      const dto = this.#orderService.getOrder(orderId);
      this.#setState({
        loading: false,
        orderText: `${dto.id} / ${dto.status} / ¥${dto.totalAmount.toFixed(2)}`,
      });
    } catch (err) {
      this.#setState({ loading: false, error: err.message });
    }
  }
}

/** View：只做"订阅 + 渲染 + 把用户操作转成命令" */
class OrderBoundView {
  constructor(viewModel) {
    this.rendered = [];
    this.unsubscribe = viewModel.subscribe((state) => this.render(state)); // 数据绑定
  }
  render(state) {
    const text = state.loading ? '加载中…' : state.error ? `错误：${state.error}` : `订单：${state.orderText}`;
    this.rendered.push(text);
    console.log(`      [View 重绘] ${text}`);
  }
  destroy() {
    this.unsubscribe();
  }
}

console.log('\n  【MVVM】ViewModel 暴露状态与命令，View 订阅它（双向绑定的本质就是订阅）：');
const vmApp = createApplication();
const vmCreated = vmApp.controller.handle('POST', '/orders', { customerId: 'C-1', items: [{ sku: 'SKU-MOUSE', qty: 3 }] });
const viewModel = new OrderViewModel({ orderService: vmApp.orderService });
const boundView = new OrderBoundView(viewModel);
await viewModel.loadOrder(vmCreated.body.id); // 调用命令 -> 状态变化 -> View 自动重绘
await viewModel.loadOrder('ORD-NOT-EXIST'); // 失败路径同样会自动重绘
boundView.destroy();
console.log(`      View 一共重绘了 ${boundView.rendered.length} 次，全部由"状态变化"驱动，View 里没有任何业务判断。`);

console.log(`
  【MVC vs MVVM 的一句话区别】
    MVC：Controller 主动"选一个 View 并喂数据"（控制流在 Controller 手里）；
    MVVM：View 订阅 ViewModel 的状态，状态一变视图自动更新（控制流由状态变化驱动）。
    前端框架的对应关系（务实版）：
      Vue / Angular：标准的 MVVM（模板 + 双向绑定 + ViewModel/组件实例）；
      React：更接近"View + 状态容器"（useState/Redux 扮演 ViewModel 的角色，
             但更新是显式的 setState + 重渲染，而不是双向绑定）；
      服务端渲染（本文件的 OrderView）：典型 MVC。
  【最常见的两种退化】
    胖控制器：业务规则写进 Controller/组件里 -> 换个入口（CLI/定时任务）就要抄一遍；
    贫血模型：Model 只剩字段和 getter，规则全跑到 Service —— 两边都不好维护。`);

// ===========================================================================
// 13. 服务端韧性模式：重试、熔断、降级、限流
// ===========================================================================

console.log('\n\n--- 13. 服务端韧性模式：概念定位与相互关系 ---\n');

const resilienceTable = [
  ['模式', '解决的问题', '核心机制', '关键参数', '用错的后果'],
  ['重试 Retry', '偶发抖动（网络丢包、瞬时超时）', '失败后按退避策略再试，次数有上限', '最大次数、退避策略、抖动、可重试错误白名单', '重试风暴打垮下游；非幂等操作被重复执行'],
  ['熔断 Circuit Breaker', '下游持续故障时不要继续打它', '失败率超阈值就"跳闸"，快速失败；冷却后半开探测', '失败阈值、冷却时长、半开探测数', '阈值太灵敏导致误跳闸；冷却太长导致恢复慢'],
  ['降级 Fallback', '故障时仍要给用户"可接受的答案"', '返回缓存值/默认值/简化功能', '降级数据的可接受性、降级开关', '返回脏数据比报错更危险；降级路径从未被测试'],
  ['限流 Rate Limit', '保护自己不被压垮、防雪崩', '令牌桶/漏桶/固定窗口计数', '容量、补充速率、被拒后的提示', '限得太紧误伤正常用户；限得太松等于没有'],
];
printTable(resilienceTable);

console.log(`
  它们的**相互关系**（这是本节最重要的一张图，本文件的实现也遵循它）：

      调用方
        │
        ▼
   ① 限流 ──拒绝──> 直接快速失败（保护自己，别把请求放进系统里排队）
        │ 放行
        ▼
   ② 熔断 ──打开──> 直接快速失败（保护下游，别再打它）
        │ 关闭/半开
        ▼
   ③ 重试 ──循环──> 每次尝试都真实调用
        │
        ▼
   ④ 真实调用（HTTP / RPC / 数据库）
        │
        └──最终失败──> ⑤ 降级（返回缓存值或默认值）

  三条设计要点：
    ① **限流在最外层**：被限流的请求不进入后续环节，避免"排队把系统拖死"；
    ② **熔断在重试之外**（熔断"包住"重试循环）：
       这样"一次逻辑调用"（可能包含 3 次重试）只算熔断器的一次失败，
       否则重试会以 3 倍速度把熔断器推向打开状态，且打开后重试仍在打下游；
    ③ **降级在最外层兜底**：无论前面哪个环节失败，都能给出可接受的答案。
  还有两条实践共识：
    · 重试必须区分**可重试错误**（超时、5xx、连接重置）与不可重试错误（参数错误、401、业务拒绝）；
    · 重试必须配**退避 + 抖动**（backoff + jitter），否则重试的流量会像海浪一样同步拍下去。`);

console.log('\n--- 13.1 限流：令牌桶 ---');

/**
 * 令牌桶（Token Bucket）：桶里最多 capacity 个令牌，按固定速率补充；
 * 每个请求消耗 1 个令牌，没令牌就拒绝。
 * 它同时限制"平均速率"（补充速率）与"突发流量"（桶容量），比固定窗口计数更平滑。
 */
class TokenBucketRateLimiter {
  #tokens;
  #lastRefillAt;
  #stats = { allowed: 0, rejected: 0 };
  constructor({ capacity, refillPerSecond, now }) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
    this.now = now;
    this.#tokens = capacity;
    this.#lastRefillAt = now();
  }
  #refill() {
    const elapsedSeconds = (this.now() - this.#lastRefillAt) / 1000;
    if (elapsedSeconds <= 0) return;
    this.#tokens = Math.min(this.capacity, this.#tokens + elapsedSeconds * this.refillPerSecond);
    this.#lastRefillAt = this.now();
  }
  tryAcquire(cost = 1) {
    this.#refill();
    if (this.#tokens >= cost) {
      this.#tokens -= cost;
      this.#stats.allowed += 1;
      return true;
    }
    this.#stats.rejected += 1;
    return false;
  }
  get stats() {
    // 只暴露"整数令牌数"给外部看（浮点令牌是内部实现细节）
    return { ...this.#stats, tokens: Number(this.#tokens.toFixed(3)) };
  }
}

const limiterClock = createFakeClock();
const limiter = new TokenBucketRateLimiter({ capacity: 3, refillPerSecond: 1, now: limiterClock.now });
console.log('  桶容量 3、每秒补充 1 个令牌，连续打 5 个请求：');
for (let i = 1; i <= 5; i += 1) {
  console.log(`    第 ${i} 个请求：${limiter.tryAcquire() ? '放行' : '被限流'}（剩余令牌 ${limiter.stats.tokens}）`);
}
limiterClock.advance(2000); // 时间前进 2 秒
console.log(`  等待 2 秒后，令牌补到 ${limiter.stats.tokens} 个，再打 1 个：${limiter.tryAcquire() ? '放行' : '被限流'}`);
console.log(`  统计：放行 ${limiter.stats.allowed}，拒绝 ${limiter.stats.rejected}`);

console.log('\n--- 13.2 熔断：三态状态机 ---');

/** 熔断器打开时的错误类型 —— 让上层能区分"下游故障"与"被熔断保护" */
class CircuitOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

/**
 * 熔断器（Circuit Breaker）：三态状态机。
 *   closed   ：正常放行，连续失败达到阈值 -> open
 *   open     ：直接快速失败，冷却时间到 -> half-open
 *   halfOpen ：只放**一个**探测请求，成功 -> closed，失败 -> open（并重新计时）
 * ★半开期"只放一个探测"是关键：否则下游刚恢复就被瞬间打满（惊群）。
 */
class CircuitBreaker {
  #state = 'closed';
  #failureCount = 0;
  #openedAt = 0;
  #probing = false;
  #stats = { success: 0, failure: 0, rejected: 0, stateChanges: [] };
  constructor({ failureThreshold, resetTimeoutMs, now, onStateChange }) {
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.now = now;
    this.onStateChange = onStateChange ?? (() => {});
  }
  get state() {
    return this.#state;
  }
  get stats() {
    return { ...this.#stats, state: this.#state, failureCount: this.#failureCount };
  }
  #transition(next, reason) {
    if (this.#state === next) return;
    const from = this.#state;
    this.#state = next;
    this.#stats.stateChanges.push(`${from} -> ${next}（${reason}）`);
    this.onStateChange({ from, to: next, reason });
  }
  async execute(operation) {
    if (this.#state === 'open') {
      if (this.now() - this.#openedAt >= this.resetTimeoutMs) {
        this.#transition('halfOpen', '冷却时间到，允许一次探测');
        this.#probing = false;
      } else {
        this.#stats.rejected += 1;
        throw new CircuitOpenError(`熔断器打开中，${this.resetTimeoutMs - (this.now() - this.#openedAt)}ms 后允许探测`);
      }
    }
    if (this.#state === 'halfOpen') {
      if (this.#probing) {
        this.#stats.rejected += 1;
        throw new CircuitOpenError('半开状态下已有探测请求在进行，其余请求快速失败');
      }
      this.#probing = true; // ★只放一个探测
    }
    try {
      const result = await operation();
      this.#stats.success += 1;
      this.#failureCount = 0;
      if (this.#state === 'halfOpen') {
        this.#probing = false;
        this.#transition('closed', '探测成功');
      }
      return result;
    } catch (err) {
      this.#stats.failure += 1;
      this.#failureCount += 1;
      if (this.#state === 'halfOpen') {
        this.#probing = false;
        this.#openedAt = this.now();
        this.#transition('open', '探测失败');
      } else if (this.#failureCount >= this.failureThreshold) {
        this.#openedAt = this.now();
        this.#transition('open', `连续失败 ${this.#failureCount} 次达到阈值`);
      }
      throw err;
    }
  }
}

console.log('\n--- 13.3 重试：只重试可重试错误 + 指数退避 + 抖动 ---');

class RetryableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RetryableError';
    this.retryable = true;
  }
}
class NonRetryableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NonRetryableError';
    this.retryable = false;
  }
}

/**
 * 退避策略：指数增长 + 抖动（jitter）。
 * 抖动为什么必要：如果 1000 个客户端同时失败、同时按同样的退避重试，
 * 它们会"齐步走"地反复冲击下游（这就是"重试风暴"）。
 * 加一个随机偏移就能把流量摊开。
 */
function backoffDelay(attempt, { baseMs = 100, factor = 2, maxMs = 2000, jitterRatio = 0.3, random = Math.random } = {}) {
  const raw = Math.min(maxMs, baseMs * factor ** (attempt - 1));
  const jitter = raw * jitterRatio * (random() * 2 - 1); // ±jitterRatio
  return Math.max(0, Math.round(raw + jitter));
}

/**
 * 重试包装器。
 * @param {Function} operation 被包装的异步操作
 * @param {object} options sleep 可注入（本文件用假时钟，测试里连 sleep 都不用等）
 */
function withRetry(operation, { maxAttempts = 3, isRetryable = (err) => err?.retryable === true, sleep = () => Promise.resolve(), onRetry = () => {}, random } = {}) {
  return async function retrying(...args) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await operation(...args);
      } catch (err) {
        lastError = err;
        if (attempt === maxAttempts || !isRetryable(err)) break;
        const delay = backoffDelay(attempt, { random });
        onRetry({ attempt, delay, error: err });
        await sleep(delay);
      }
    }
    throw lastError;
  };
}

// 用确定性随机数演示"抖动"：random 固定为 0.75 / 0.25 两种，输出可复现
const deterministicRandom = (() => {
  const values = [0.75, 0.25, 0.9, 0.1];
  let i = 0;
  return () => values[i++ % values.length];
})();
console.log(`  退避序列（base=100ms，factor=2，抖动 ±30%，用固定随机序列演示）：`);
for (let attempt = 1; attempt <= 4; attempt += 1) {
  console.log(`    第 ${attempt} 次重试前等待 ${backoffDelay(attempt, { random: deterministicRandom })}ms`);
}
console.log(`  ★没有抖动时，所有客户端都会在同一毫秒重试；有抖动后请求被摊开到一段时间里。`);

console.log('\n--- 13.4 把四件套组装起来：一个"韧性网关" ---');

/** 降级：返回上一次成功拿到的值（真实项目里常常是缓存或默认值） */
class CachedFallback {
  #cache = new Map();
  constructor() {
    this.hits = 0;
  }
  remember(key, value) {
    this.#cache.set(key, { value, at: Date.now() });
  }
  get(key, { reason }) {
    const hit = this.#cache.get(key);
    this.hits += 1;
    if (!hit) return { ok: false, source: '降级-无缓存', reason, value: null };
    return { ok: true, source: '降级-缓存值', reason, value: hit.value };
  }
}

/**
 * 韧性网关：把限流/熔断/重试/降级按正确的顺序组合起来。
 * 这一层属于**基础设施层**，业务层只调用它暴露的 fetchQuote()，
 * 完全不知道背后有四道防线（这也体现了分层：横切能力下沉到基础设施）。
 */
class ResilientGateway {
  constructor({ remote, limiter, breaker, fallback, sleep, logger = console, maxAttempts = 3 }) {
    this.remote = remote;
    this.limiter = limiter;
    this.breaker = breaker;
    this.fallback = fallback;
    this.sleep = sleep;
    this.logger = logger;
    this.maxAttempts = maxAttempts;
    this.attempts = 0;
  }

  async fetchQuote(payload) {
    // ① 限流：被拒绝就不进入后面的环节
    if (!this.limiter.tryAcquire()) {
      this.logger.log(`    [限流] 请求被拒绝，未触达下游`);
      return this.fallback.get(payload.sku, { reason: '被限流' });
    }

    // ② 熔断包住重试循环：一次逻辑调用 = 熔断器的一次成功/失败
    try {
      const value = await this.breaker.execute(() =>
        withRetry(
          async () => {
            this.attempts += 1;
            return this.remote.fetchQuote(payload); // ④ 真实调用
          },
          {
            maxAttempts: this.maxAttempts,
            sleep: this.sleep,
            random: deterministicRandom,
            onRetry: ({ attempt, delay, error }) => {
              this.logger.log(`    [重试] 第 ${attempt} 次失败（${error.message}），${delay}ms 后重试`);
            },
          },
        )(),
      );
      this.fallback.remember(payload.sku, value); // 成功时记下缓存，供降级使用
      return { ok: true, source: '远程', value };
    } catch (err) {
      // ⑤ 降级
      this.logger.log(`    [降级] 原因：${err.name}: ${err.message}`);
      return this.fallback.get(payload.sku, { reason: `${err.name}: ${err.message}` });
    }
  }
}

/** 被调用的下游：按剧本依次给出成功/失败，保证演示可复现 */
class ScriptedQuoteService {
  constructor(plan) {
    this.plan = [...plan];
    this.calls = 0;
  }
  async fetchQuote({ sku }) {
    this.calls += 1;
    const outcome = this.plan.length > 0 ? this.plan.shift() : 'ok';
    if (outcome === 'ok') return { sku, price: 299, servedAt: `第 ${this.calls} 次调用` };
    if (outcome === 'nonretryable') throw new NonRetryableError('参数不合法（不可重试）');
    throw new RetryableError(`下游超时（第 ${this.calls} 次调用）`);
  }
}

const resilienceClock = createFakeClock();
const gatewayLogger = { messages: [], log: (m) => gatewayLogger.messages.push(m) };

// 剧本（按"下游被真实调用的次数"排布，保证演示可复现）：
//   第 1~2 次调用：成功（步骤 1 用掉）
//   第 3~8 次调用：失败（步骤 2、3 各自重试 3 次，形成两次"逻辑失败"，第二次触发熔断）
//   第 9 次调用：成功（步骤 5 的半开探测）
const scriptedRemote = new ScriptedQuoteService(['ok', 'ok', 'fail', 'fail', 'fail', 'fail', 'fail', 'fail', 'ok', 'ok']);
const gateway = new ResilientGateway({
  remote: scriptedRemote,
  limiter: new TokenBucketRateLimiter({ capacity: 100, refillPerSecond: 100, now: resilienceClock.now }),
  breaker: new CircuitBreaker({
    failureThreshold: 2,
    resetTimeoutMs: 5000,
    now: resilienceClock.now,
    onStateChange: ({ from, to, reason }) => gatewayLogger.log(`    [熔断] ${from} -> ${to}（${reason}）`),
  }),
  fallback: new CachedFallback(),
  sleep: async (ms) => {
    resilienceClock.advance(ms);
    return Promise.resolve();
  },
  logger: gatewayLogger,
  maxAttempts: 3,
});

async function driveScenario(title, steps) {
  console.log(`\n  【${title}】`);
  for (const [label, sku] of steps) {
    const result = await gateway.fetchQuote({ sku });
    const value = result.value ? `price=${result.value.price}` : 'null';
    console.log(`    ${label} -> 来源=${result.source}，${value}${result.reason ? `，原因=${result.reason}` : ''}`);
    gatewayLogger.messages.length = 0; // 每个步骤单独展示日志
  }
}

console.log('\n  --- 13.5 端到端场景：正常 -> 抖动 -> 熔断 -> 恢复 ---');
console.log(`  剧本：下游前 2 次调用成功，随后连续失败，冷却 5 秒后恢复。
  熔断阈值 = 2 次"逻辑失败"，重试上限 = 3 次（所以一次逻辑调用最多打下游 3 次）。`);
await driveScenario('步骤 1：正常调用（成功并写入降级缓存）', [
  ['第 1 次调用', 'SKU-KB'],
  ['第 2 次调用', 'SKU-KB'],
]);
console.log(`    当前熔断状态：${gateway.breaker.state}`);
console.log(`    下游真实被调用次数：${scriptedRemote.calls}`);

await driveScenario('步骤 2：下游开始抖动 —— 重试全部失败，熔断计数 +1', [['第 3 次调用（下游失败 3 次）', 'SKU-KB']]);
console.log(`    熔断状态：${gateway.breaker.state}（失败 1 次，未达阈值 2）`);
console.log(`    下游真实被调用次数：${scriptedRemote.calls}（本次共尝试 3 次）`);

await driveScenario('步骤 3：再次失败 —— 达到阈值，熔断打开，并降级返回缓存价', [['第 4 次调用（下游失败 3 次）', 'SKU-KB']]);
console.log(`    熔断状态：${gateway.breaker.state}`);
console.log(`    ★注意：这次调用返回的是"降级-缓存值"，正是步骤 1 成功时记下的价格。`);

const callsBeforeOpen = scriptedRemote.calls;
await driveScenario('步骤 4：熔断打开期间 —— 快速失败，一次都没有打下游', [['第 5 次调用', 'SKU-KB']]);
console.log(`    熔断状态：${gateway.breaker.state}`);
console.log(`    下游调用次数变化：${callsBeforeOpen} -> ${scriptedRemote.calls}（本次新增 ${scriptedRemote.calls - callsBeforeOpen} 次，期望 0 —— 这就是熔断的价值）`);
console.log(`    返回来源仍为降级缓存：业务方拿到了 5 分钟前的价格，而不是一个 500。`);

resilienceClock.advance(5000); // 冷却时间到
console.log(`\n  时间前进 5 秒（冷却时间到）。`);
await driveScenario('步骤 5：半开探测 —— 只放一个请求，下游已恢复，于是熔断关闭', [['第 6 次调用（探测）', 'SKU-KB']]);
console.log(`    熔断状态：${gateway.breaker.state}`);
console.log(`    下游调用次数：${scriptedRemote.calls}（探测成功）`);

console.log(`\n  熔断器的状态迁移记录：`);
for (const change of gateway.breaker.stats.stateChanges) console.log(`    · ${change}`);
console.log(`  熔断器统计：${JSON.stringify(gateway.breaker.stats)}`);
console.log(`  限流器统计：${JSON.stringify({ allowed: gateway.limiter.stats.allowed, rejected: gateway.limiter.stats.rejected })}`);

console.log('\n  再演示一次限流（把桶换小）：');
const tinyLimiter = new TokenBucketRateLimiter({ capacity: 1, refillPerSecond: 0.001, now: resilienceClock.now });
const limitedGateway = new ResilientGateway({
  remote: scriptedRemote,
  limiter: tinyLimiter,
  breaker: new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 1000, now: resilienceClock.now }),
  fallback: new CachedFallback(),
  sleep: async () => Promise.resolve(),
  logger: { log: () => {} },
});
limitedGateway.fallback.remember('SKU-KB', { sku: 'SKU-KB', price: 299, servedAt: '缓存' });
for (let i = 1; i <= 3; i += 1) {
  const r = await limitedGateway.fetchQuote({ sku: 'SKU-KB' });
  console.log(`    第 ${i} 次：来源=${r.source}${r.reason ? `，原因=${r.reason}` : ''}`);
}
console.log(`  ★限流拒绝的请求**没有触达下游**（下游调用次数仍为 ${scriptedRemote.calls}），
    并且同样走了降级 —— 用户看到的是缓存价，而不是"服务不可用"。`);

console.log(`\n【韧性模式的代价与什么时候不该用】
  代价：
    1) 每加一层都增加延迟与调试难度（"为什么这个请求慢了 3 秒？"——可能是在重试）；
    2) 参数难调：阈值、超时、冷却时间都需要基于真实流量与下游恢复能力来定，没有万能值；
    3) 重试会**放大流量**（3 次重试 = 最坏 3 倍请求量），下游本来就过载时雪上加霜；
    4) 降级返回的数据必须"业务上可接受"，否则比直接报错更危险
       （比如降级返回一个过期的价格并让用户下单，事后要赔差价）；
    5) 熔断/降级是"有状态"的，多实例部署时要考虑状态是本地还是要共享（Redis）。
  什么时候不该用：
    1) 内网、同进程、低延迟的调用：加这些只是徒增复杂度；
    2) 非幂等操作（下单、扣款）**不能盲目重试** ——
       要么先实现幂等（请求去重 ID），要么把重试限制在"只读查询"；
    3) 错误是**业务错误**（参数错、余额不足）时重试毫无意义，还可能重复扣款；
    4) 系统还没有可观测性（日志/指标/链路追踪）时先别上熔断 ——
       你会不知道它为什么跳闸，也不知道该调哪个参数。
  一句话：**韧性模式是"承认下游一定会坏"之后的设计，而不是"让下游别坏"的手段。**`);

// ===========================================================================
// 14. 什么时候不需要分层
// ===========================================================================

console.log('\n\n--- 14. 什么时候不需要分层：过度分层同样是负债 ---\n');

console.log(`  先看一个"分层过度"的真实样子：
    需求：读一个 JSON 文件并打印其中某个字段。一共 3 行的活。
    过度分层版可能是：
      JsonFileReaderFactory -> JsonFileReader -> JsonParserAdapter
      -> DataMapperFactory -> DataMapper -> ValueObjectAssembler
      -> PrintService -> PrintController        （8 个类、6 个文件、200 行）
    结果是：新人要读 6 个文件才知道"这就是读个 JSON 然后 console.log"，
    改一个字段要动 4 个文件，写一个测试要造 3 个假对象。

  【分层的成本是"每一次阅读都要多跳几层"。所以它只在下面这些条件下才划算：】`);

const whenToLayer = [
  ['信号', '说明', '该不该分层'],
  ['这段代码会活过一个月吗', '一次性脚本、数据迁移、临时排查：写完就删', '不该'],
  ['有第二个入口吗', '同一个业务要被 HTTP + 定时任务 + CLI 调用', '该（Service 层立刻回本）'],
  ['存储会换吗 / 需要假仓储做测试吗', '只要"测试要替换存储"这一条成立就够', '该（Repository）'],
  ['有跨表/跨服务的写操作吗', '需要事务边界：要么全成功、要么全回滚', '该（Service 层划事务）'],
  ['数据要跨边界吗', 'HTTP/MQ/RPC/文件：需要字段白名单与防泄漏', '该（DTO）'],
  ['调用链有外部依赖吗', '下游会抖动、会挂：需要重试/熔断/降级', '该（基础设施层）'],
  ['团队只有 1~2 人、项目 < 5000 行', '沟通成本低，抽象收益也低', '偏向不分层'],
  ['需求还在剧烈探索期', '业务规则每天变，过早分层会锁死错误的边界', '先不分层，等边界稳定'],
];
printTable(whenToLayer);

console.log(`
  【三条务实忠告】

    ① **分层是"发现"出来的，不是"设计"出来的。**
       第一版就分五层，通常会把边界切错。更稳的路径是：
       先写能跑的朴素版（第 1 节那样）-> 痛点出现（要加第二个入口、要换存储、
       要写测试）-> 再把层"抽"出来。这与 13_pattern_selection.js 的
       "先写能跑的代码，再重构出模式"是同一条建议。

    ② **一个模块的层次要有"厚度差"。**
       如果某个 Service 的方法只是把参数原样传给 Repository（findById -> findById），
       那它是纯粹的转发层 —— 这种"薄如纸"的层应该删掉。
       只有当一层**真的有内容**（编排、事务、校验、转换、韧性）时才保留它。

    ③ **不要为了"整齐"而让每层都齐平。**
       小项目里"Controller + Service + Repository"三层，而 Service 只有 3 个方法是合理的；
       不要为了对称硬给它加上"领域层 + DTO 层 + 适配层"。
       目录结构的整齐度与代码质量无关 —— 能否说清"这段代码为什么在这里"才是关键。

  【回到最初的问题：什么时候该分层？】
      当"变化"真的发生在不同的维度上时（协议会变、规则会变、存储会变），
      把它们分开就是在保护彼此；
      当它们其实是一回事时，分开只是在制造隔阂。
      这仍然是 13_pattern_selection.js 那句话：
      **分层的价值 = 它隔离的变化 - 它引入的间接。**`);

// ===========================================================================
// 收尾
// ===========================================================================

console.log('\n--- 15. 本文件的测试结果汇总 ---\n');
const resultTable = [['#', '测试用例', '结果']];
testResults.forEach((r, i) => resultTable.push([String(i + 1), r.name, r.ok ? '✓ 通过' : `✗ 失败：${r.reason}`]));
printTable(resultTable);
const passed = testResults.filter((r) => r.ok).length;
console.log(`\n  ${passed} / ${testResults.length} 通过。`);
console.log(`  这 ${testResults.length} 条测试运行在内存里，没有数据库、没有 HTTP、没有真实时间 ——
    它们能做到这一点，正是因为业务规则在领域层、存储细节在仓储层、
    编排在应用层、协议转换在表现层，各层之间靠注入的契约连接（19_dependency_injection.js）。`);

console.log(`
  【本文件的知识地图】
    分层架构  —— 控制依赖方向，把"变化的原因"隔离开
      ├── Repository —— 让业务层以为数据在内存集合里（隔离存储细节）
      ├── Service    —— 一个方法一个用例，划定事务边界（隔离业务编排）
      ├── DTO        —— 定义跨边界的数据形状（隔离协议变化 + 防泄漏）
      └── MVC/MVVM   —— 表现层内部的职责划分（隔离界面与模型）
    韧性模式  —— 承认下游一定会坏：重试/熔断/降级/限流按正确顺序叠加
    ★而"什么时候不用"与"怎么用"同样重要 —— 过度分层与不分层，都是负债。`);

console.log('\n全部演示完毕。');
