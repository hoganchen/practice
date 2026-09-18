/**
 * ============================================================================
 * 知识点：状态模式 —— 行为随内部状态改变而改变（与策略模式的本质区别）
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/07_strategy.js（结构与它几乎一样，务必对照阅读）、
 *             30_design_patterns/11_command.js（历史记录思想）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    状态模式（State）让一个对象在**内部状态改变时改变它的行为**，
 *    从调用方看过去，就好像这个对象换了一个类。
 *    三个角色：
 *      Context（上下文）：对外暴露业务方法（pay/ship/...），内部持有一个状态对象；
 *      State（状态接口）：声明该状态下每种操作的行为；
 *      ConcreteState（具体状态）：实现自己的行为，并**决定下一个状态是谁**。
 *    最关键的一行动作是：状态方法执行完，**返回下一个状态对象**。
 *    于是"状态迁移规则"被分散到各个状态类里，而不是集中在一个巨大的 switch 里。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 订单/工单/审批流：待付款→已付款→已发货→已完成/已取消，每一步允许的操作都不同。
 *    - 连接/会话生命周期：未连接→连接中→已连接→断开中。
 *    - 播放器：停止→播放→暂停→停止。
 *    - 交通灯、电梯、自动售货机、Promise 的 pending/fulfilled/rejected。
 *    - 异步请求的 UI 状态：idle/loading/success/error（前端状态机库 xstate 就是它）。
 *    真实项目里的信号是：**同一个 `status` 字段被 `if/switch` 判断了 10 次以上，
 *    而且每次改状态都要回头检查所有判断点有没有漏改**。
 *    加一个"部分退款"状态时，你要改 7 个文件 —— 这就是该用状态模式的时刻。
 *
 * 3. 核心语法要点
 *    - 状态对象遵循统一接口：同样的方法名、同样的签名，各自返回"下一个状态"。
 *    - 非法操作的处理必须**统一口径**，三选一：
 *        ① 抛错（本文件的选择，最不容易漏 bug）；
 *        ② 返回 `{ ok:false, reason }`（适合面向用户的接口，不想让异常穿透）；
 *        ③ 静默忽略（最危险，bug 会静默发生）。
 *      选一个并写进文档，不要三种混用。
 *    - Context 只做委托，**决策权在状态对象手里**。如果 Context 里出现
 *      `if (this.state === '待付款')`，模式就已经退化成 switch 了。
 *    - 状态对象应当**无状态**（本身不含可变字段），因此可以做成单例常量复用；
 *      所有可变数据（订单号、金额、时间线）都放在 Context 上，通过参数传进去。
 *    - 状态之间不要互相 `new`：容易写出循环引用、也不好做单元测试。
 *      用一个注册表（对象/Map）按名字取状态实例。
 *    - 可以给状态加"进入/退出"钩子（onEnter/onExit），这是 switch 很难优雅做到的：
 *      比如"进入已付款状态时记录付款时间并发送通知"。
 *    - 迁移日志：把 `从哪来 → 做什么 → 到哪去` 记下来，调试、审计、事件溯源都靠它。
 *
 * 4. 常见陷阱
 *    - 把迁移逻辑写在 Context 里（那只是换了写法的 switch）。
 *    - 状态对象持有可变字段并复用：一个订单改状态会"串味"到另一个订单。
 *    - 忘记赋值 `this.state = next`：状态永远不变，操作被重复允许。
 *    - 状态爆炸：N 个状态 × M 个操作 = N×M 个方法，其中大部分是"不支持"。
 *      解法：模板方法/基类给默认的"拒绝"实现，子类只覆盖支持的操作（本文件的做法）。
 *    - 迁移表与代码不同步：文档写着"已发货可取消"、代码里不允许。
 *      解法：让迁移表**由代码生成**，再用断言自动校验（见第 6 节）。
 *    - 与策略模式混淆（见第 7 节，这是本节最重要的部分）。
 *    - 只有 2 个状态、3 个操作时硬上状态机：一个 `switch` 就够了，
 *      模式带来的 5 个类反而是负担。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/14_state.js
 *
 * 【预期输出】
 *   先展示"status 字符串 + switch"的坏味道与 6 条问题，再用状态模式重构订单状态机，
 *   打印状态 × 操作的迁移合法性矩阵、走完一条正常流程与两条异常流程，
 *   自动校验"迁移表与代码行为一致"，最后用表格对比状态模式与策略模式，
 *   并说明它的代价与不该用的场景。
 * ============================================================================
 */

// ===========================================================================
// 0. 工具：中英混排表格对齐（与 13_pattern_selection.js 同款）
// ===========================================================================

/** 中日韩字符在等宽字体里占 2 列，按显示宽度补空格才能对齐 */
function displayWidth(s) {
  return [...String(s)].reduce(
    (w, ch) => w + (/[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(ch) ? 2 : 1),
    0,
  );
}

/** 打印一张对齐的表格，第一行视为表头 */
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

// ===========================================================================
// 1. 坏味道：用 status 字符串 + switch 管理状态
// ===========================================================================

console.log('--- 1. 坏味道：status 字符串散落各处 ---');

/**
 * 朴素版订单：所有规则都挤在两个大 switch 里。
 * 这段代码"能跑"，问题在于它会随着业务增长而急剧腐化。
 */
const LEGACY_STATUS = {
  PENDING: '待付款',
  PAID: '已付款',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
};

/** 朴素版：这个操作在当前状态下允许吗？ */
function legacyCanDo(order, action) {
  switch (action) {
    case 'pay':
      return order.status === LEGACY_STATUS.PENDING;
    case 'ship':
      return order.status === LEGACY_STATUS.PAID;
    case 'confirm':
      return order.status === LEGACY_STATUS.SHIPPED;
    case 'cancel':
      // 坑：这里的规则和 doAction 里的规则是"两份真相"
      return order.status === LEGACY_STATUS.PENDING || order.status === LEGACY_STATUS.PAID;
    default:
      return false;
  }
}

/** 朴素版：执行这个操作 */
function legacyDoAction(order, action) {
  if (!legacyCanDo(order, action)) return `${action} 被拒绝`;
  switch (action) {
    case 'pay':
      order.status = LEGACY_STATUS.PAID;
      break;
    case 'ship':
      order.status = LEGACY_STATUS.SHIPPED;
      break;
    case 'confirm':
      order.status = LEGACY_STATUS.COMPLETED;
      break;
    case 'cancel':
      order.status = LEGACY_STATUS.CANCELLED;
      break;
    default:
      return '未知操作';
  }
  return `执行 ${action} 成功，当前状态：${order.status}`;
}

const legacyOrder = { id: 'SO-1001', status: LEGACY_STATUS.PENDING };
console.log('  ' + legacyDoAction(legacyOrder, 'pay'));
console.log('  ' + legacyDoAction(legacyOrder, 'ship'));
console.log('  ' + legacyDoAction(legacyOrder, 'pay'), ' <- 已付款后再付款被正确拒绝');

// ===========================================================================
// 2. 上面那种写法的问题（为什么需要状态模式）
// ===========================================================================

console.log('\n--- 2. 朴素写法的问题清单 ---');

const legacyProblems = [
  ['#', '问题', '真实后果'],
  ['1', '规则有两份真相', 'canDo 说允许、doAction 忘了改 -> 校验通过但状态没变'],
  ['2', '状态与行为不在一起', '加一个状态要改 5 处 switch，漏一处就是线上 bug'],
  ['3', '开放封闭原则被破坏', '新增"部分退款中"必须修改已有函数，回归风险高'],
  ['4', '没有"进入状态"的时机', '想记录付款时间只能写 switch 里，容易漏'],
  ['5', '无法回答"现在能做什么"', '前端想置灰按钮，只能再写一份 canDo 逻辑'],
  ['6', '状态机不可视化', '产品问"有哪些状态、怎么流转"，只能靠读代码'],
];
printTable(legacyProblems);

// ===========================================================================
// 3. 状态模式：把"每个状态允许什么、迁移到哪"放进状态对象
// ===========================================================================

console.log('\n--- 3. 状态模式实现：订单状态机 ---');

/** 非法迁移异常：状态模式推荐的"统一口径"之①（抛错） */
class IllegalTransitionError extends Error {
  constructor(fromStatus, actionLabel) {
    super(`订单处于「${fromStatus}」时不允许执行「${actionLabel}」`);
    this.name = 'IllegalTransitionError';
    this.fromStatus = fromStatus;
    this.actionLabel = actionLabel;
  }
}

/**
 * 状态基类。
 * 基类为**所有操作**提供"拒绝"的默认实现，子类只覆盖当前状态真正允许的操作。
 * 这就是"模板方法"的思想（见 15_template_method.js）：把公共的默认行为提到父类，
 * 避免 N×M 个方法里大部分是重复的"不支持"。
 */
class OrderState {
  constructor(name) {
    this.name = name;
  }

  /** 当前状态允许的操作 -> 目标状态（供打印迁移表 + 自动校验使用） */
  transitions() {
    return {};
  }

  /** 允许的操作名列表（给前端置灰按钮用） */
  availableActions() {
    return Object.keys(this.transitions()).map((k) => ACTION_BY_KEY[k].label);
  }

  /** 该状态的一句话说明 */
  describe() {
    return '（无说明）';
  }

  /** 进入该状态时的钩子，子类可覆盖 */
  onEnter(_order) {}

  /** 退出该状态时的钩子，子类可覆盖 */
  onExit(_order) {}

  // --- 四个操作的默认实现：一律拒绝 ---
  // 注意：默认实现是"拒绝"，子类覆盖成"允许"，这样新增操作时不会漏掉任何状态。
  pay(order) {
    throw this.deny('pay', order);
  }
  ship(order) {
    throw this.deny('ship', order);
  }
  confirm(order) {
    throw this.deny('confirm', order);
  }
  cancel(order) {
    throw this.deny('cancel', order);
  }

  /** 生成一个带上下文的非法迁移错误（便于日志里定位） */
  deny(actionKey, _order) {
    return new IllegalTransitionError(this.name, ACTION_BY_KEY[actionKey].label);
  }
}

// ---- 动作的统一定义：key 是方法名，label 是中文名 ----
const ACTIONS = [
  { key: 'pay', label: '付款' },
  { key: 'ship', label: '发货' },
  { key: 'confirm', label: '确认收货' },
  { key: 'cancel', label: '取消' },
];
const ACTION_BY_KEY = Object.fromEntries(ACTIONS.map((a) => [a.key, a]));

// ---- 五个具体状态 ----
// 每个状态都是无状态对象（不含可变字段），所以可以安全地全局复用同一份实例。

class PendingState extends OrderState {
  constructor() {
    super(LEGACY_STATUS.PENDING);
  }
  transitions() {
    return { pay: PAID_STATE, cancel: CANCELLED_STATE };
  }
  describe() {
    return '等待买家付款，30 分钟未付款将自动取消';
  }
  pay(order) {
    // ★状态对象只做决策与副作用，不直接改 Context 的 status ——
    //   状态切换由 Context 统一执行（这样迁移日志一定不会漏记）。
    order.record(`买家支付 ¥${order.amount.toFixed(2)}`);
    return PAID_STATE;
  }
  cancel(order) {
    order.record('买家主动取消订单（未付款，无需退款）');
    return CANCELLED_STATE;
  }
}

class PaidState extends OrderState {
  constructor() {
    super(LEGACY_STATUS.PAID);
  }
  transitions() {
    return { ship: SHIPPED_STATE, cancel: CANCELLED_STATE };
  }
  describe() {
    return '已收款，等待仓库发货；可整单取消并原路退款';
  }
  onEnter(order) {
    order.record(`记录付款时间 ${order.now()}，通知仓库备货`);
  }
  ship(order) {
    order.record(`仓库已出库，运单号 SF-${order.id.slice(-4)}`);
    return SHIPPED_STATE;
  }
  cancel(order) {
    order.record(`整单取消，原路退款 ¥${order.amount.toFixed(2)}`);
    return CANCELLED_STATE;
  }
}

class ShippedState extends OrderState {
  constructor() {
    super(LEGACY_STATUS.SHIPPED);
  }
  transitions() {
    return { confirm: COMPLETED_STATE };
  }
  describe() {
    return '运输中，只能确认收货；要退货请走售后流程（不能直接取消）';
  }
  onEnter(order) {
    order.record('已通知买家发货信息');
  }
  confirm(order) {
    order.record('买家确认收货，订单完成');
    return COMPLETED_STATE;
  }
}

class CompletedState extends OrderState {
  constructor() {
    super(LEGACY_STATUS.COMPLETED);
  }
  transitions() {
    return {};
  }
  describe() {
    return '终态：交易完成，售后服务另行处理';
  }
  onEnter(order) {
    order.record('结算货款给商家，写入统计报表');
  }
}

class CancelledState extends OrderState {
  constructor() {
    super(LEGACY_STATUS.CANCELLED);
  }
  transitions() {
    return {};
  }
  describe() {
    return '终态：订单已取消，不可再变更';
  }
  onEnter(order) {
    order.record('释放库存占用');
  }
}

// ---- 状态注册表：避免状态之间互相 new，也便于按名字查找 / 做可视化 ----
// 先声明变量，再实例化，最后组装成注册表（解决"状态之间互相引用"的顺序问题）。
let PENDING_STATE;
let PAID_STATE;
let SHIPPED_STATE;
let COMPLETED_STATE;
let CANCELLED_STATE;

PENDING_STATE = new PendingState();
PAID_STATE = new PaidState();
SHIPPED_STATE = new ShippedState();
COMPLETED_STATE = new CompletedState();
CANCELLED_STATE = new CancelledState();

const ORDER_STATES = new Map([
  [PENDING_STATE.name, PENDING_STATE],
  [PAID_STATE.name, PAID_STATE],
  [SHIPPED_STATE.name, SHIPPED_STATE],
  [COMPLETED_STATE.name, COMPLETED_STATE],
  [CANCELLED_STATE.name, CANCELLED_STATE],
]);

// ---- Context：订单 ----
class Order {
  #state;
  #timeline = [];
  #tick = 0;

  /**
   * @param {object} deps 依赖注入：时钟由外部提供（见 19_dependency_injection.js），
   *   这样测试里就能得到完全确定的时间线，而不用去 mock 全局 Date。
   */
  constructor({ id, amount, customer }, deps = {}) {
    this.id = id;
    this.amount = amount;
    this.customer = customer;
    this.#state = PENDING_STATE;
    this.clock = deps.clock ?? (() => new Date().toISOString());
    this.#timeline.push(`[${this.now()}] 创建订单 ${id}，金额 ¥${amount.toFixed(2)}，状态「${this.#state.name}」`);
    this.#state.onEnter(this);
  }

  /** 供状态对象使用：返回一个"确定但递增"的时间戳 */
  now() {
    this.#tick += 1;
    return this.clock(this.#tick);
  }

  /** 供状态对象使用：追加一条时间线记录 */
  record(message) {
    this.#timeline.push(`[${this.now()}] ${message}`);
  }

  get status() {
    return this.#state.name;
  }

  get timeline() {
    return [...this.#timeline];
  }

  /** 当前允许的操作（给 UI 置灰按钮用，不需要 UI 再抄一份规则） */
  availableActions() {
    return this.#state.availableActions();
  }

  /** 当前状态说明 */
  describe() {
    return this.#state.describe();
  }

  // -------------------------------------------------------------------------
  // ★模式的核心：Context 只负责"委托 + 记录迁移"，决策全在状态对象里
  // -------------------------------------------------------------------------
  #dispatch(actionKey) {
    const action = ACTION_BY_KEY[actionKey];
    const from = this.#state;
    // 状态对象返回下一个状态；如果它抛 IllegalTransitionError，就说明这次操作非法。
    const to = from[actionKey](this);

    if (!(to instanceof OrderState)) {
      // 防御性检查：状态方法必须返回状态对象，否则就是写错了。
      throw new TypeError(`状态「${from.name}」的 ${actionKey} 必须返回下一个状态，实际返回 ${to}`);
    }

    if (to !== from) {
      from.onExit(this);
      this.#state = to; // ★忘记这一行 = 状态永远不变，是本节最常见的 bug
      to.onEnter(this);
      this.record(`状态迁移：${from.name} --${action.label}--> ${to.name}`);
    } else {
      // 自迁移（动作作用于同一状态）：如"部分退款"仍停留在已付款
      this.record(`状态保持：${from.name} --${action.label}--> ${from.name}`);
    }
    return { ok: true, from: from.name, to: this.#state.name, action: action.label };
  }

  // 对外暴露的业务方法：只是对 #dispatch 的薄封装
  pay() {
    return this.#dispatch('pay');
  }
  ship() {
    return this.#dispatch('ship');
  }
  confirm() {
    return this.#dispatch('confirm');
  }
  cancel() {
    return this.#dispatch('cancel');
  }
}

// ===========================================================================
// 4. 迁移合法性矩阵：由代码生成，而不是手写文档
// ===========================================================================

console.log('\n--- 4. 状态 × 操作 迁移合法性矩阵（由状态对象的 transitions() 生成）---\n');

const matrix = [['当前状态', ...ACTIONS.map((a) => a.label)]];
for (const state of ORDER_STATES.values()) {
  const t = state.transitions();
  const row = [state.name];
  for (const action of ACTIONS) {
    row.push(t[action.key] ? `→ ${t[action.key].name}` : '✗ 拒绝');
  }
  matrix.push(row);
}
printTable(matrix);

console.log('\n  每个状态的说明：');
for (const state of ORDER_STATES.values()) {
  console.log(`    「${state.name}」${state.describe()}`);
  console.log(`        允许的操作：${state.availableActions().join('、') || '（终态，无）'}`);
}

// ===========================================================================
// 5. 走一遍真实流程
// ===========================================================================

console.log('\n--- 5. 真实流程演示 ---');

/** 一个确定性的假时钟：让每次输出完全一致（这也是依赖注入的好处） */
function makeDemoClock() {
  return (tick) => {
    const d = new Date(Date.UTC(2026, 0, 15, 9, 0, 0));
    d.setUTCSeconds(d.getUTCSeconds() + tick * 30);
    return d.toISOString().replace('T', ' ').slice(0, 19);
  };
}

/** 安全执行：把非法迁移就地打印出来，而不是让整个示例崩溃 */
function tryAction(order, actionKey) {
  const label = ACTION_BY_KEY[actionKey].label;
  try {
    const r = order[actionKey]();
    console.log(`  ✅ ${label} 成功：${r.from} → ${r.to}`);
  } catch (err) {
    if (err instanceof IllegalTransitionError) {
      console.log(`  ⛔ ${label} 被拒绝：${err.message}`);
    } else {
      throw err;
    }
  }
}

console.log('\n【场景 A】正常流程：下单 → 付款 → 发货 → 确认收货');
const orderA = new Order({ id: 'SO-20260115-0001', amount: 299.0, customer: '张三' }, { clock: makeDemoClock() });
console.log(`  初始状态：${orderA.status}（${orderA.describe()}）`);
console.log(`  可执行操作：${orderA.availableActions().join('、')}`);
tryAction(orderA, 'pay');
console.log(`  可执行操作：${orderA.availableActions().join('、')}`);
tryAction(orderA, 'ship');
console.log(`  可执行操作：${orderA.availableActions().join('、')}`);
tryAction(orderA, 'confirm');
console.log(`  最终状态：${orderA.status}；可执行操作：${orderA.availableActions().join('、') || '（无）'}`);
console.log('\n  订单时间线：');
for (const line of orderA.timeline) console.log(`    ${line}`);

console.log('\n【场景 B】待付款时取消（不需要退款）');
const orderB = new Order({ id: 'SO-20260115-0002', amount: 88.5, customer: '李四' }, { clock: makeDemoClock() });
tryAction(orderB, 'ship'); // 先来一次非法操作
tryAction(orderB, 'cancel');
console.log(`  最终状态：${orderB.status}`);

console.log('\n【场景 C】已付款时取消（要退款）；已发货就不许取消了');
const orderC = new Order({ id: 'SO-20260115-0003', amount: 1299.0, customer: '王五' }, { clock: makeDemoClock() });
tryAction(orderC, 'pay');
tryAction(orderC, 'cancel'); // 这个订单先取消了
const orderD = new Order({ id: 'SO-20260115-0004', amount: 66.0, customer: '赵六' }, { clock: makeDemoClock() });
tryAction(orderD, 'pay');
tryAction(orderD, 'ship');
tryAction(orderD, 'cancel'); // ★已经发货了，这里必须被拒绝
console.log('\n  已发货订单的时间线（看到"不能取消"是状态自己的规则）：');
for (const line of orderD.timeline) console.log(`    ${line}`);

// ===========================================================================
// 6. 自动校验：迁移表与实际行为必须一致
// ===========================================================================

console.log('\n--- 6. 自动校验：transitions() 声明的规则 == 代码的真实行为 ---');

console.log(`  做法：对每个状态 × 每个操作，
    如果 transitions() 里声明了，调用就必须成功；没声明，调用就必须抛 IllegalTransitionError。
    这是一次"契约测试"—— 它把文档和代码绑在一起，防止迁移表腐化。\n`);

let checked = 0;
const mismatches = [];
for (const state of ORDER_STATES.values()) {
  const declared = state.transitions();
  for (const action of ACTIONS) {
    checked += 1;
    // 用一个一次性订单来试跑；状态对象是无状态的，所以不会互相干扰
    const probeOrder = new Order({ id: 'PROBE', amount: 1, customer: 'probe' }, { clock: () => 'T' });
    let threw = false;
    try {
      state[action.key](probeOrder);
    } catch (err) {
      if (err instanceof IllegalTransitionError) threw = true;
      else throw err;
    }
    const shouldThrow = !declared[action.key];
    if (threw !== shouldThrow) {
      mismatches.push(`${state.name} × ${action.label}：声明${shouldThrow ? '拒绝' : '允许'}，实际${threw ? '拒绝' : '允许'}`);
    }
  }
}
console.log(`  共校验 ${checked} 个组合，发现不一致：${mismatches.length} 处`);
if (mismatches.length > 0) {
  for (const m of mismatches) console.log(`    ✗ ${m}`);
  process.exitCode = 1; // 迁移表与代码不一致属于真正的 bug，让 CI 能发现
} else {
  console.log('  ✓ 全部一致。这意味着前端可以直接信任 availableActions() 去置灰按钮。');
}

// ===========================================================================
// 7. 与策略模式的区别（本节最重要的一节）
// ===========================================================================

console.log('\n--- 7. 状态模式 vs 策略模式：结构几乎一样，意图正好相反 ---');

console.log(`  两者的类图长得几乎一模一样：
    Context 持有一个"可替换的对象"，把请求委托给它。
  但**谁来决定用哪一个**、以及**对象会不会自己变**，是本质区别。\n`);

const compareTable = [
  ['对比维度', '策略模式 Strategy', '状态模式 State'],
  ['由谁选择实现', '外部（调用方/配置/工厂）选好传进来', '内部（上一个状态的方法返回下一个状态）'],
  ['实现会不会自己变', '不会。选定后一直用它，替换要外部再调一次', '会。一次操作之后 Context 可能已经换了状态'],
  ['对象之间是否知道彼此', '策略之间互不相识，也不关心谁来用自己', '状态之间要认识"下一步是谁"（迁移是它的职责）'],
  ['调用方是否知道当前用哪个', '通常知道（我选了"按重量计费"）', '通常不知道，也不该关心（我只"付款"，状态自己流转）'],
  ['数量是否会爆炸', '策略条数 = 算法种类，稳定', '状态数 × 操作数，容易膨胀，需基类兜底'],
  ['典型代码特征', 'strategies[key](input)', 'this.state = this.state.pay()'],
  ['一句话意图', '同一件事，换一种做法', '同一个对象，随着阶段改变做法'],
  ['真实例子', '运费计算、支付渠道、压缩算法', '订单状态机、连接生命周期、播放器'],
  ['怎么选', '需求是"用户/配置决定用哪种算法" -> 策略', '需求是"操作导致对象进入下一阶段" -> 状态'],
];
printTable(compareTable);

console.log(`
  一个便于记忆的判断法：
    问"是谁按下了切换的按钮？"
      - 是**外部**（用户在界面上选了某种计费方式）-> 策略
      - 是**这次操作本身**（付款之后当然就进入已付款）-> 状态

  反过来说：如果你把状态模式和策略模式写出来之后，发现两者代码几乎一样、
  只是命名不同，那通常说明 —— **这个场景其实用哪一个都行，选命名更贴切的那个**。
  模式的名字首先服务于沟通（见 13_pattern_selection.js 的"模式是沟通词汇"），
  不必为"我到底用的哪个模式"纠结。`);

// 用同一个场景写一个"策略版"对照，证明结构确实一样、差别在意图
console.log('\n  同一个订单场景，用策略模式改写会长这样（仅示意，突出差别）：');
const shippingStrategies = {
  standard: (weight) => 5 + weight * 0.5,
  express: (weight) => 15 + weight * 1.2,
};
/** 策略版的"上下文"：只有外部选中的策略，没有内部迁移 */
class ShippingCalculator {
  constructor(strategyKey) {
    this.strategyKey = strategyKey;
  }
  switchTo(strategyKey) {
    // ★策略的切换必须由外部显式调用 —— 它不会"自己变"
    this.strategyKey = strategyKey;
  }
  cost(weight) {
    return shippingStrategies[this.strategyKey](weight);
  }
}
const calc = new ShippingCalculator('standard');
console.log(`    按标准快递算 2kg：¥${calc.cost(2)}`);
calc.switchTo('express'); // 必须外部主动切
console.log(`    改按顺丰算 2kg：¥${calc.cost(2)}（切换动作来自外部，这就是策略）`);
console.log('    而订单状态机里，`order.pay()` 之后状态**自动**变成已付款 —— 切换来自内部。');

// ===========================================================================
// 8. 代价与什么时候不该用
// ===========================================================================

console.log('\n--- 8. 状态的代价与不适用场景 ---');

console.log(`【收益】
  1) 每个状态的规则聚在一处，改一个状态的规则只动一个类，回归面小；
  2) 新增状态 = 新增一个类 + 在相关状态的 transitions() 里加一条，符合开闭原则；
  3) 可以回答"现在能做什么"（availableActions），UI 不必抄一份规则；
  4) onEnter/onExit 钩子天然表达"进入某状态时要做的事"；
  5) 迁移日志免费得到，审计与排查都有据可依。

【代价】
  1) 类的数量增加：5 个状态 = 5 个类（JS 里可以用对象字面量减轻到"5 个对象"）；
  2) 间接层变多：读 order.cancel() 要跳到 Cancel 对应状态才知道会发生什么，
     调试时要多看一层；
  3) 状态之间的跳转关系分散在各处，整体流程不如一张 switch 一目了然
     （解法：像第 4 节那样**由代码生成**一张全局迁移图）；
  4) 迁移表与代码可能不同步（解法：第 6 节的契约测试）；
  5) 状态对象之间的共享数据必须全部放到 Context 上，容易出现"上帝 Context"。

【什么时候不该用】
  1) 状态只有 2~3 个、操作只有 2~3 种，且规则不会再变：
     一个 switch 或一张小的迁移表函数就够了（见下面的对照）。
  2) 状态迁移是纯粹的数据变换、没有"每个状态不同的行为"：
     那只需要一张 Map<状态, Map<事件, 目标状态>> 的**表驱动状态机**，
     不需要为每个状态写一个类。
  3) 状态之间没有真正的行为差异（只是标签不同）：用枚举 + 校验函数即可。
  4) 团队完全没接触过状态机：先上"表驱动 + 一张图"，比 5 个类更好沟通。

【更轻的替代方案：表驱动状态机】
  如果每个状态的行为差异很小，只需要"允不允许 + 迁移到哪"，
  下面这 10 行代码就能替代整个模式（很多真实项目就停在这一步，足够了）：`);

const TRANSITION_TABLE = new Map([
  [LEGACY_STATUS.PENDING, { pay: LEGACY_STATUS.PAID, cancel: LEGACY_STATUS.CANCELLED }],
  [LEGACY_STATUS.PAID, { ship: LEGACY_STATUS.SHIPPED, cancel: LEGACY_STATUS.CANCELLED }],
  [LEGACY_STATUS.SHIPPED, { confirm: LEGACY_STATUS.COMPLETED }],
  [LEGACY_STATUS.COMPLETED, {}],
  [LEGACY_STATUS.CANCELLED, {}],
]);

/** 表驱动版：不需要 5 个类，但也没有 onEnter/onExit 与可扩展的行为差异 */
function tableDrivenApply(order, actionKey) {
  const allowed = TRANSITION_TABLE.get(order.status) ?? {};
  const next = allowed[actionKey];
  if (!next) return `⛔ ${ACTION_BY_KEY[actionKey].label} 被拒绝（当前 ${order.status}）`;
  const from = order.status;
  order.status = next;
  return `✅ ${ACTION_BY_KEY[actionKey].label} 成功：${from} → ${next}`;
}

const tableOrder = { id: 'SO-T1', status: LEGACY_STATUS.PENDING };
console.log('    ' + tableDrivenApply(tableOrder, 'pay'));
console.log('    ' + tableDrivenApply(tableOrder, 'ship'));
console.log('    ' + tableDrivenApply(tableOrder, 'cancel'));
console.log(`
  对比结论：
    表驱动版：10 行、一眼看清所有流转、没有类；
             代价是"每个状态的行为"只能是数据，做不了"进入已付款时发通知"这类动作，
             也无法给不同状态定制不同的返回结构。
    状态模式版：类的数量多，但每个状态可以有自己的行为、钩子与返回值。

  选择标准就一条：**各状态的"行为"只是数据，还是有真正的逻辑？**
    是数据 -> 表驱动；有逻辑 -> 状态模式。`);

console.log('\n全部演示完毕。');
