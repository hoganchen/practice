/**
 * ============================================================================
 * 知识点：行为型模式补充 —— 中介者 Mediator、备忘录 Memento、访问者 Visitor、桥接 Bridge
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】高级
 * 【前置知识】30_design_patterns/05_observer.js、11_command.js、13_pattern_selection.js、
 *             14_classes/14_polymorphism.js（多态是访问者的基础）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    行为型模式解决的是"**对象之间怎么通信、职责怎么分配**"。本文件补齐四个此前没讲的：
 *      - 中介者 Mediator：把 N 个对象之间的"多对多"通信收敛成"星型"，
 *        对象只认识中介者，不认识彼此。
 *      - 备忘录 Memento：在不破坏封装的前提下，保存对象某一时刻的内部状态，
 *        之后可以恢复它（撤销功能的基石）。
 *      - 访问者 Visitor：在不修改对象结构（节点类）的前提下，给这组对象添加新操作。
 *        靠"双重分发"实现，是编译器/AST/linter 的标准做法。
 *      - 桥接 Bridge：把"抽象"与"实现"两个维度拆开，让它们可以各自独立地扩展，
 *        避免"两个维度相乘"造成的类爆炸。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 中介者：空中交通管制（飞机之间不直接通话）、聊天室（消息不必点对点）、
 *      前端组件间通信（用 store 而不是组件互相引用）、微服务的 API 网关 / 消息总线。
 *    - 备忘录：编辑器的撤销、表单的"草稿恢复"、游戏存档、
 *      数据库事务里的 savepoint、React 的 state 时间旅行调试。
 *    - 访问者：Babel 插件、TypeScript 编译器、ESLint 规则、Prisma 的查询 AST、
 *      对同一棵语法树做"求值/格式化/检查/统计/导出"多套操作。
 *    - 桥接：跨平台 UI（抽象=窗口/控件，实现=Windows/macOS 渲染）、
 *      JDBC 的 Driver（抽象=SQL 执行流程，实现=各数据库协议）、
 *      报表系统（抽象=报表种类，实现=导出格式）、支付 SDK（抽象=业务动作，实现=渠道协议）。
 *
 * 3. 核心语法要点
 *    - 中介者：同事对象（Colleague）只持有一个 mediator 引用，
 *      所有跨对象协作都变成"向中介者发消息"；中介者持有全局视图，负责调度。
 *    - 备忘录：三个角色必须分清 ——
 *        Originator（原发器）：拥有状态，能 `snapshot()` 与 `restore(memento)`；
 *        Memento（备忘录）：状态的载体，对 Caretaker **不透明**（不能读、不能改）；
 *        Caretaker（管理者）：只负责存放与按顺序取回，从不解读内容。
 *      JS 里用 `#私有字段` 或模块内的 `Symbol` 键实现"不透明"。
 *    - 快照必须做**深拷贝**：浅拷贝（Object.assign / 展开）只是复制了第一层，
 *      嵌套数组与对象仍与原状态共享，撤销会失效（本文件会演示这个 bug）。
 *    - 访问者：节点类提供 `accept(visitor)`，方法体里调用
 *      `visitor.visitXxx(this)` —— 两次派发（先按节点类型、再按访问者类型），
 *      这就是"双重分发"。JS 没有重载，只能靠**约定的方法名**（visitXxx）。
 *    - 访问者的返回值：可以是结果值（求值），也可以是空（副作用型，如导出/检查）。
 *    - 桥接：抽象层持有实现层的引用，而不是继承它。
 *      "抽象"和"实现"这两个词是 GoF 的术语，不要按日常语义理解 ——
 *      抽象=高层控制部分（会继承扩展），实现=底层平台/渲染部分（也会继承扩展）。
 *
 * 4. 常见陷阱
 *    - 中介者变成上帝对象：所有逻辑都堆进塔台/总线上，它就成了最难改的类。
 *      症状是"任何需求都要改中介者"。对策：按业务域拆多个中介者。
 *    - 中介者与观察者混淆：观察者是"一对多广播"（发布者不必知道订阅者做什么），
 *      中介者是"多对多收敛 + 集中决策"（中介者要知道每个人的状态并做判断）。
 *    - 备忘录存了对象引用（浅拷贝）：撤销时"越撤越乱"，且非常难排查（本文件演示）。
 *    - 备忘录没有上限：每次编辑存一份完整快照，大文档会吃掉几百 MB。
 *    - 备忘录泄露内部结构：Caretaker 能读到快照内容，就说明封装被破坏了，
 *      一旦内部结构变化，Caretaker 的代码也要跟着改。
 *    - 访问者与节点类互相依赖：新增节点类型要改所有访问者，
 *      所以访问者适合"节点类型稳定、操作种类经常增加"的场景，反之就不要用。
 *    - 访问者里用 `instanceof` 或 `switch (node.type)` 兜底：
 *      那说明双重分发没做对，等于放弃了访问者最大的价值。
 *    - 桥接用成"只有两个实现"的策略：那就用策略，别叫桥接（见第四部分的对照表）。
 *    - 为未来可能的第二个维度提前桥接：只有一个变化维度时，桥接纯属多余。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/17_behavioral_patterns_extra.js
 *
 * 【预期输出】
 *   第一部分：用空中交通管制演示中介者（对比 N² 直连的坏味道，并处理紧急插队）；
 *   第二部分：用简历编辑器演示备忘录撤销、浅拷贝陷阱、快照上限与不透明性；
 *   第三部分：用表达式 AST 演示访问者（求值/打印/统计/导出四种操作），
 *             并说明"表达式问题"的取舍；
 *   第四部分：用报表 × 导出格式演示桥接，对比类数量，
 *             并给出桥接 / 策略 / 适配器的区别表；
 *   最后给出四个模式的横向对照表。
 * ============================================================================
 */

// ===========================================================================
// 0. 工具
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

// ===========================================================================
// 第一部分：中介者 Mediator —— 把多对多通信收敛成星型
// ===========================================================================

console.log('=== 第一部分：中介者 Mediator（空中交通管制）===\n');
console.log('--- 1.1 坏味道：每架飞机都认识其他所有飞机 ---');

/**
 * 朴素版：飞机自己持有"其他飞机"的列表，每次要降落都要挨个问一遍。
 * 于是有了 N 架飞机就有 N×(N-1) 条引用 —— 这就是"多对多"，也叫 N² 耦合。
 */
class NaiveAircraft {
  constructor(callsign, fuel) {
    this.callsign = callsign;
    this.fuel = fuel;
    this.peers = []; // ← 坏味道：直接持有其他飞机
    this.onRunway = false;
  }
  /** 必须在所有飞机创建完之后手工接线（顺序错了就漏） */
  connectWith(others) {
    this.peers = others.filter((p) => p !== this);
  }
  requestLanding() {
    // 每架飞机都必须自己实现一遍"跑道是否空闲"的判断逻辑
    const occupied = this.peers.filter((p) => p.onRunway).map((p) => p.callsign);
    if (occupied.length > 0) {
      return `${this.callsign} 无法降落：跑道被 ${occupied.join('、')} 占用`;
    }
    this.onRunway = true;
    return `${this.callsign} 开始降落（自己判断跑道空闲）`;
  }
}

const naivePlanes = [new NaiveAircraft('CA1501', 42), new NaiveAircraft('MU5102', 8), new NaiveAircraft('CZ3305', 65)];
for (const p of naivePlanes) p.connectWith(naivePlanes);
for (const p of naivePlanes) console.log(`  ${p.requestLanding()}`);

console.log(`
  这段代码的问题：
    ✗ N 架飞机 = N×(N-1) 条互相引用；新增第 4 架，前三架都要重新接线；
    ✗ "跑道空闲"的判断逻辑被复制到每架飞机里，改规则要改 N 处；
    ✗ 飞机之间直接耦合：想加个"高度层分配"就要让所有飞机互相知道对方高度；
    ✗ 无法实现需要**全局视角**的规则，例如"油量低于 10 的优先降落"
      —— 单架飞机看不到全局，做不了排序。

  一句话：**当协作规则需要全局信息时，把规则放在某个对象手里，比放在每个对象里更合理。**
  那个"某个对象"就是中介者。`);

console.log('\n--- 1.2 塔台（中介者）：飞机只跟塔台说话 ---');

/** 同事对象（Colleague）：只认识塔台，不认识其他飞机 */
class Aircraft {
  constructor(callsign, fuel, tower) {
    this.callsign = callsign;
    this.fuel = fuel; // 剩余油量（分钟），塔台用它做优先级判断
    this.tower = tower;
    this.state = '航行中';
    this.altitude = 8000;
    this.log = [];
  }

  // ---- 所有对外交互都只是"给塔台发一条消息" ----
  requestLanding() {
    return this.tower.requestLanding(this);
  }
  landed() {
    return this.tower.confirmLanded(this);
  }
  requestTakeoff() {
    return this.tower.requestTakeoff(this);
  }
  reportEmergency(reason) {
    return this.tower.declareEmergency(this, reason);
  }

  /** 塔台回调：同事对象自己不判断优先级，只接收指令 */
  receiveInstruction(instruction) {
    this.state = instruction.state ?? this.state;
    if (instruction.altitude !== undefined) this.altitude = instruction.altitude;
    this.log.push(instruction.message);
    return instruction.message;
  }
}

/**
 * 中介者：管制塔台。
 * 它持有全局视图（跑道、等待队列、每架飞机的油量），
 * 因此能做出单个同事对象无法做出的**全局决策**（比如按油量排序放行）。
 */
class ControlTower {
  constructor() {
    this.runwayOccupant = null;
    this.waitingQueue = []; // 等待降落的飞机（按优先级排序）
    this.fleet = new Map();
    this.eventLog = [];
  }

  register(aircraft) {
    this.fleet.set(aircraft.callsign, aircraft);
  }

  #record(message) {
    this.eventLog.push(message);
    return message;
  }

  /**
   * 全局决策：油量少的优先。
   * 这是**只有中介者才做得到**的事 —— 单架飞机不知道别人的油量。
   */
  #sortByPriority() {
    this.waitingQueue.sort((a, b) => a.fuel - b.fuel);
  }

  requestLanding(aircraft) {
    if (this.runwayOccupant === null) {
      this.runwayOccupant = aircraft;
      return this.#record(aircraft.receiveInstruction({ state: '降落中', message: `${aircraft.callsign} 允许降落，跑道已清空` }));
    }
    if (!this.waitingQueue.includes(aircraft)) this.waitingQueue.push(aircraft);
    this.#sortByPriority();
    return this.#record(
      aircraft.receiveInstruction({
        state: '盘旋等待',
        altitude: 6000,
        message: `${aircraft.callsign} 跑道被 ${this.runwayOccupant.callsign} 占用，` +
          `进入等待队列（第 ${this.waitingQueue.indexOf(aircraft) + 1} 位，油量 ${aircraft.fuel} 分钟）`,
      }),
    );
  }

  confirmLanded(aircraft) {
    if (this.runwayOccupant !== aircraft) {
      return this.#record(`${aircraft.callsign} 并未占用跑道，忽略本次确认`);
    }
    this.runwayOccupant = null;
    const landedMessage = aircraft.receiveInstruction({ state: '已落地', message: `${aircraft.callsign} 已落地，跑道释放` });
    // ★中介者的第二个职责：状态变化后主动通知/推进其他同事对象
    const next = this.waitingQueue.shift();
    if (next) {
      this.runwayOccupant = next;
      next.receiveInstruction({ state: '降落中', message: `${next.callsign} 可以降落了（自动叫号）` });
      this.#record(`跑道自动交给等待最久的 ${next.callsign}`);
    }
    return landedMessage;
  }

  requestTakeoff(aircraft) {
    if (this.runwayOccupant !== null) {
      return this.#record(aircraft.receiveInstruction({ state: '等待起飞', message: `${aircraft.callsign} 等待起飞：跑道被 ${this.runwayOccupant.callsign} 占用` }));
    }
    this.runwayOccupant = aircraft;
    return this.#record(aircraft.receiveInstruction({ state: '起飞中', message: `${aircraft.callsign} 允许起飞` }));
  }

  /**
   * 紧急情况：**插队**。
   * 注意这是"规则集中在中介者里"的直接收益 —— 只改这一处，
   * 所有飞机立刻获得新行为，没有一架飞机需要改代码。
   */
  declareEmergency(aircraft, reason) {
    this.#record(`⚠ ${aircraft.callsign} 宣布紧急情况：${reason}`);
    // 把正在占用跑道的飞机赶去复飞，紧急飞机优先
    if (this.runwayOccupant && this.runwayOccupant !== aircraft) {
      const bumped = this.runwayOccupant;
      this.runwayOccupant = null;
      if (!this.waitingQueue.includes(bumped)) this.waitingQueue.push(bumped);
      bumped.receiveInstruction({ state: '复飞', altitude: 9000, message: `${bumped.callsign} 请复飞让出跑道，优先保障 ${aircraft.callsign}` });
    }
    const idx = this.waitingQueue.indexOf(aircraft);
    if (idx !== -1) this.waitingQueue.splice(idx, 1);
    this.runwayOccupant = aircraft;
    return this.#record(aircraft.receiveInstruction({ state: '紧急降落中', message: `${aircraft.callsign} 获得跑道优先权` }));
  }

  /** 塔台视角的快照：这才是"全局信息" */
  status() {
    return {
      跑道占用: this.runwayOccupant ? this.runwayOccupant.callsign : '空闲',
      等待队列: this.waitingQueue.map((a) => `${a.callsign}(油量${a.fuel})`),
      全体状态: [...this.fleet.values()].map((a) => `${a.callsign}=${a.state}`),
    };
  }
}

console.log('--- 1.3 演示：三架飞机 + 一次紧急插队 ---');
const tower = new ControlTower();
const ca1501 = new Aircraft('CA1501', 42, tower);
const mu5102 = new Aircraft('MU5102', 8, tower); // 油量最少
const cz3305 = new Aircraft('CZ3305', 65, tower);
[ca1501, mu5102, cz3305].forEach((a) => tower.register(a));

console.log('  ① 三架飞机同时请求降落（注意每架飞机都不知道别人，只有塔台做决策）：');
for (const a of [ca1501, mu5102, cz3305]) console.log(`     · ${a.requestLanding()}`);
console.log(`     塔台视角：${JSON.stringify(tower.status(), null, 0)}`);

console.log('\n  ② CA1501 落地，塔台自动叫号 —— 油量最少的 MU5102 先上：');
console.log(`     · ${ca1501.landed()}`);
console.log(`     塔台视角：${JSON.stringify(tower.status())}`);

console.log('\n  ③ CZ3305 宣布紧急情况（燃油泄漏），插队获得跑道：');
console.log(`     · ${cz3305.reportEmergency('右侧发动机失效')}`);
console.log(`     塔台视角：${JSON.stringify(tower.status())}`);

console.log('\n  ④ CZ3305 落地后，被复飞的 MU5102 自动接上跑道：');
console.log(`     · ${cz3305.landed()}`);
console.log(`     塔台视角：${JSON.stringify(tower.status())}`);

console.log('\n  塔台事件日志（中介者的集中审计能力，同事对象自己做不到）：');
for (const line of tower.eventLog) console.log(`     ${line}`);

console.log(`\n  接线数量对比：
    朴素版（N=3）：3×2 = 6 条互相引用，且判断逻辑重复 3 份；
    中介者版：3 条"飞机 -> 塔台"引用，判断逻辑 1 份。
    N=10 时：朴素版 90 条引用 vs 中介者版 10 条。`);

const couplingTable = [
  ['规模', '互相直连（N²）', '中介者（N）', '节省'],
  ['3 架飞机', '6 条引用', '3 条引用', '50%'],
  ['10 架飞机', '90 条引用', '10 条引用', '89%'],
  ['100 架飞机', '9,900 条引用', '100 条引用', '99%'],
];
printTable(couplingTable);

console.log('\n--- 1.4 中介者的代价、不适用与辨析 ---');
console.log(`【收益】
  1) 通信从 N² 降到 N：同事对象只依赖中介者，新增一个同事不必改其他人；
  2) 协作规则集中一处：需要全局信息的决策（优先级、配额、限流）天然可做；
  3) 集中审计/日志/监控：所有交互都过中介者，埋点只写一处；
  4) 同事对象变得极简，好测（给它一个假塔台就能测）。

【代价】
  1) ★中介者最容易变成上帝对象：所有协作逻辑堆在一起，任何改动都要碰它，
     最后它变成全系统最复杂、最不敢改的类；
  2) 单点故障：中介者挂了，全体失联（分布式系统里这一点尤其致命）；
  3) 多一层间接：一次交互要经过跳转，调试链路变长；
  4) 中介者的接口容易"为每个人定制"而膨胀（每个同事需要的中介者方法都不同）。

【什么时候不该用】
  1) 只有两三个对象、协作规则简单：直接互相调用更清楚；
  2) 规则是纯广播、不需要中介者做决策：那是观察者/发布订阅（05、06 号文件）；
  3) 同事对象之间本来就不需要通信：别为了"解耦"而硬造一个中心。

【辨析：中介者 vs 观察者 vs 外观】
  观察者：被观察者**广播**给订阅者，被观察者不知道订阅者会做什么，也不做决策；
  中介者：中介者**知道所有人的状态并做决策**，交互是双向的（飞机也能给塔台发消息）；
  外观：调用方 -> 子系统的**单向**简化，子系统之间本来不通信（见 16 号文件）。
  记忆法：观察者是"喊话"，中介者是"调度"，外观是"代办"。`);

// ===========================================================================
// 第二部分：备忘录 Memento —— 不破坏封装的保存与恢复
// ===========================================================================

console.log('\n\n=== 第二部分：备忘录 Memento（撤销功能）===\n');
console.log('--- 2.1 三个角色 ---');
console.log(`  Originator（原发器）  ：拥有"当前状态"，能 snapshot() 出快照、能 restore() 回去；
  Memento（备忘录）     ：状态的载体，对管理者**不透明**（管理者读不到也改不了）；
  Caretaker（管理者）   ：只负责把快照按顺序存起来、按需取回，从不解读内容。
  ★关键约束：Caretaker 不解读快照，所以原发器内部结构如何变化，Caretaker 都不用改。`);

/**
 * 用模块内的 Symbol 做"只有原发器能打开的钥匙"。
 * 不在模块外导出这个 Symbol，因此其它模块拿不到快照里的状态。
 * （真实项目里 Memento 与原发器放同一模块，Caretaker 放另一个模块，
 *   于是"不透明"是结构上保证的，而不只是口头约定。）
 */
const SNAPSHOT_KEY = Symbol('snapshot.payload');

/** 备忘录：对外只暴露"标签与时间"这类元数据，真正的内容藏在 Symbol 键里 */
class ResumeSnapshot {
  constructor(payload, label) {
    this[SNAPSHOT_KEY] = payload;
    this.label = label; // 元数据：给撤销菜单显示"撤销到：添加技能"用
    this.createdAt = payload.updatedAt;
    Object.freeze(this); // 备忘录本身不可变，防止被误改
  }
  describe() {
    return `${this.label}（${this.createdAt}）`;
  }
}

/** 原发器：简历编辑器 */
class ResumeEditor {
  #state;
  #version = 0;

  constructor(owner) {
    this.owner = owner;
    this.#state = { owner, name: '', skills: [], summary: '', updatedAt: 'v0' };
  }

  /** 对外的只读视图：返回深拷贝，避免外部直接改内部状态 */
  get state() {
    return structuredClone(this.#state);
  }

  #touch() {
    this.#version += 1;
    this.#state.updatedAt = `v${this.#version}`;
  }

  setName(name) {
    this.#state.name = name;
    this.#touch();
    return this;
  }
  addSkill(skill) {
    // ★这里改的是嵌套数组 —— 正是"浅拷贝快照"会翻车的地方
    this.#state.skills.push(skill);
    this.#touch();
    return this;
  }
  setSummary(text) {
    this.#state.summary = text;
    this.#touch();
    return this;
  }

  /** 生成快照：必须深拷贝，否则快照会跟着内部状态一起变 */
  snapshot(label) {
    return new ResumeSnapshot(structuredClone(this.#state), label);
  }

  /** 从快照恢复：只有原发器知道 SNAPSHOT_KEY，也只有它能读回内容 */
  restore(snapshot) {
    this.#state = structuredClone(snapshot[SNAPSHOT_KEY]);
    this.#version += 1;
    return this;
  }

  render() {
    const s = this.#state;
    return `简历[${s.updatedAt}] 姓名=${s.name || '（空）'} 技能=[${s.skills.join('、')}] 简介="${s.summary || '（空）'}"`;
  }
}

/** 管理者：一个带上限的历史栈，它**完全不知道**快照里装的是什么 */
class HistoryCaretaker {
  #stack = [];
  #limit;
  #dropped = 0;
  constructor(limit = 20) {
    this.#limit = limit; // ★上限很重要：没有上限的快照栈就是内存泄漏
  }
  push(snapshot) {
    this.#stack.push(snapshot);
    while (this.#stack.length > this.#limit) {
      this.#stack.shift();
      this.#dropped += 1;
    }
    return this;
  }
  undo() {
    return this.#stack.pop() ?? null;
  }
  get size() {
    return this.#stack.length;
  }
  get dropped() {
    return this.#dropped;
  }
  /** 只暴露标签，不暴露内容 —— 这就是"窄接口" */
  listLabels() {
    return this.#stack.map((s) => s.describe());
  }
}

console.log('\n--- 2.2 撤销演示 ---');
const editor = new ResumeEditor('张三');
const history = new HistoryCaretaker(20);

editor.setName('张三').addSkill('JavaScript');
history.push(editor.snapshot('填写姓名 + 1 项技能'));
console.log(`  ${editor.render()}`);

editor.addSkill('Node.js').addSkill('React');
history.push(editor.snapshot('添加 2 项技能'));
console.log(`  ${editor.render()}`);

editor.setSummary('五年后端开发，关注可维护性');
history.push(editor.snapshot('补充个人简介'));
console.log(`  ${editor.render()}`);

// 拍完快照后继续编辑（但不再拍快照）—— 这样"撤销"才有真实的变化可看
editor.addSkill('Docker');
console.log(`  ${editor.render()}   ← 这次编辑没有拍快照，撤销应当把它丢掉`);

console.log(`\n  历史栈（Caretaker 只认识标签，不认识内容）：${JSON.stringify(history.listLabels())}`);

let undoCount = 0;
while (history.size > 0) {
  const snap = history.undo();
  editor.restore(snap);
  undoCount += 1;
  console.log(`  撤销 #${undoCount}（回到"${snap.describe()}"）：${editor.render()}`);
}

console.log(`\n--- 2.3 陷阱：浅拷贝快照（最常见的撤销 bug）---`);

/**
 * ❌ 反面教材：用"浅拷贝"拍快照的编辑器。
 * 注意它把状态放在**公开字段**上、且 snapshot 里用 {...this.state} —— 两处都是坑。
 */
class NaiveShallowEditor {
  constructor() {
    this.state = { name: '', skills: [], summary: '' };
  }
  setName(name) {
    this.state.name = name;
    return this;
  }
  addSkill(skill) {
    this.state.skills.push(skill); // 改的是嵌套数组
    return this;
  }
  /** ❌ 浅拷贝快照：第一层是新的，嵌套的数组/对象仍与原状态**共享** */
  snapshot(label) {
    return { label, payload: { ...this.state } };
  }
  restore(snap) {
    this.state = { ...snap.payload };
    return this;
  }
  render() {
    return `姓名=${this.state.name} 技能=[${this.state.skills.join('、')}]`;
  }
}

const buggy = new NaiveShallowEditor();
buggy.setName('李四').addSkill('Java');
const shallowSnap = buggy.snapshot('添加 Java 之后');
console.log(`  拍快照时：${buggy.render()}`);
console.log(`  快照里的技能（故意直接查看 payload）：${JSON.stringify(shallowSnap.payload.skills)}`);

buggy.addSkill('Spring');
console.log(`\n  拍完快照后又加了一项技能：${buggy.render()}`);
console.log(`  ★快照里的技能居然也变了：${JSON.stringify(shallowSnap.payload.skills)}`);
console.log(`    原因：{...this.state} 只复制了第一层，skills 数组仍是**同一个引用**，
    原发器 push 进数组时，快照看到的也是同一个数组。
    演示"撤销失效"：`);
buggy.restore(shallowSnap);
console.log(`      执行 restore(那个快照) 之后：${buggy.render()}`);
console.log(`      ← 期望回到"只有 Java"，实际 Spring 还在。撤销功能"偶尔失灵"，就此复现。
    这类 bug 只在"修改的是嵌套结构"时出现，是最难排查的一类。
    而前面 ResumeEditor 的两个设计正好避开了它：
      ① state 的 getter 返回 structuredClone（对外只读）；
      ② snapshot() 里做 structuredClone（深拷贝）。

  三种正确做法：
    ① structuredClone(state)          —— 现代 Node/浏览器原生，支持循环引用（本文件用的是它）；
    ② JSON.parse(JSON.stringify(s))   —— 简单但会丢 Date/Map/Set/undefined，且不支持循环引用；
    ③ 不可变更新（每次修改都产生新对象）—— 函数式风格，快照只需存引用，最省内存。

  ★判断口诀：快照里有没有"嵌套的可变结构"？有 -> 必须深拷贝或不可变。`);

console.log('\n--- 2.4 快照上限与内存 ---');
const bounded = new HistoryCaretaker(5);
for (let i = 1; i <= 12; i += 1) {
  editor.addSkill(`技能${i}`);
  bounded.push(editor.snapshot(`第 ${i} 次编辑`));
}
console.log(`  上限 5 的快照栈：push 了 12 次，当前保留 ${bounded.size} 个，被丢弃 ${bounded.dropped} 个`);
console.log(`  保留的快照标签：${JSON.stringify(bounded.listLabels())}`);
console.log(`  权衡：上限越小越省内存，但用户能撤销的步数越少。
    真实编辑器常用组合策略：
      - 完整快照（每隔 N 次编辑或每隔 M 秒拍一次）；
      - 增量快照（只存与上一版的差异），适合大文档；
      - 不可变数据结构（结构共享），让"完整快照"本身几乎不占额外内存。`);

const snapshotTable = [
  ['策略', '内存占用', '实现复杂度', '适用场景'],
  ['浅拷贝快照', '低（但错误）', '极低', '❌ 永远不该用（嵌套结构必然出错）'],
  ['深拷贝快照', '高（状态大小的 N 倍）', '低（structuredClone）', '中小文档/表单，编辑步数有限'],
  ['增量快照（diff）', '低', '高（要写 diff/patch）', '大文档、协同编辑（OT/CRDT 的基础）'],
  ['不可变数据结构', '低（结构共享）', '中（要遵守不可变约定）', 'React/Redux 生态，时间旅行调试'],
];
printTable(snapshotTable);

console.log(`\n--- 2.5 备忘录 vs 命令模式，以及代价 ---`);
console.log(`【与 11_command.js 的区别 —— 这是最常被问的问题】
  命令模式记录的是"**操作**"（插入了什么、在哪插入），撤销靠执行反向操作；
  备忘录模式记录的是"**状态**"（某一刻的完整样子），撤销靠整体回滚。
  对比：
    - 命令的 undo 需要为每个命令写一个逆操作（对称性容易写错，但省内存）；
    - 备忘录不需要写逆操作（简单可靠），但快照占内存。
  实践中常常**混用**：命令对象里带一个小备忘录，用于存"被覆盖掉的旧值"
  （11 号文件里的 TextEditor 就是这么做的）。

【收益】
  1) 撤销/重做/时间旅行调试的基础设施；
  2) 封装不被破坏：状态的内部结构只有原发器知道，管理者拿到的是一团"黑盒"；
  3) 恢复是"整体回滚"，不需要为每种修改写逆操作。

【代价】
  1) 内存：深拷贝快照的成本与状态大小成正比，必须设上限或改用增量方案；
  2) 深拷贝的性能：大对象（几千个字段）每次编辑都克隆一遍，会明显卡顿；
  3) 不透明的实现要额外设计（#私有字段 / Symbol / 闭包），比"直接存对象"麻烦；
  4) 无法表达"合并多个快照"这类复杂语义（协同编辑要另请高明：OT/CRDT）。

【什么时候不该用】
  1) 不需要撤销：绝大多数 CRUD 页面都不需要（表单草稿用"定期自动保存"更简单）；
  2) 状态很小且改动可逆：直接记录旧值就够了，不必上快照框架；
  3) 状态大到无法整体拷贝，且没有不可变数据结构支撑：改用增量/事件溯源方案。`);

// ===========================================================================
// 第三部分：访问者 Visitor —— 不修改对象结构就添加新操作
// ===========================================================================

console.log('\n\n=== 第三部分：访问者 Visitor（对表达式 AST 做多种操作）===\n');
console.log('--- 3.1 节点结构：每个节点只提供一个 accept(visitor) ---');

/** 节点基类 */
class ExprNode {
  accept(_visitor) {
    throw new Error(`${this.constructor.name} 必须实现 accept(visitor)`);
  }
}

class NumberLiteral extends ExprNode {
  constructor(value) {
    super();
    this.value = value;
  }
  accept(visitor) {
    // ★第一重分发：由**节点的类型**决定调用访问者的哪个方法
    return visitor.visitNumberLiteral(this);
  }
}

class StringLiteral extends ExprNode {
  constructor(value) {
    super();
    this.value = value;
  }
  accept(visitor) {
    return visitor.visitStringLiteral(this);
  }
}

class Identifier extends ExprNode {
  constructor(name) {
    super();
    this.name = name;
  }
  accept(visitor) {
    return visitor.visitIdentifier(this);
  }
}

class BinaryExpression extends ExprNode {
  constructor(operator, left, right) {
    super();
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
  accept(visitor) {
    return visitor.visitBinaryExpression(this);
  }
}

class CallExpression extends ExprNode {
  constructor(callee, args) {
    super();
    this.callee = callee;
    this.args = args;
  }
  accept(visitor) {
    return visitor.visitCallExpression(this);
  }
}

// ---- 构造一棵真实业务含义的表达式树 ----
// 对应代码：total = price * quantity + tax(price) + 0.05 * price
// 这里直接给出表达式部分：price * quantity + tax(price) + 0.05 * price
const price = new Identifier('price');
const quantity = new Identifier('quantity');
const ast = new BinaryExpression(
  '+',
  new BinaryExpression('*', price, quantity),
  new BinaryExpression(
    '+',
    new CallExpression('tax', [price]),
    new BinaryExpression('*', new NumberLiteral(0.05), price),
  ),
);
console.log('  表达式树（对应源码：price * quantity + tax(price) + 0.05 * price）：');
console.log('           +');
console.log('         /   \\');
console.log('        *     +');
console.log('       / \\   / \\');
console.log('  price  qty  tax  *');
console.log('               / \\');
console.log('             0.05 price');
console.log('  再次强调：节点类里**只有 accept()**，没有任何"求值""打印""统计"的方法。');
console.log(`  变量取值：price = 299, quantity = 3`);

console.log('\n--- 3.2 四个访问者：同一个结构，四种操作 ---');

/** 访问者 1：求值 */
class Evaluator {
  constructor(scope) {
    this.scope = scope;
    this.steps = [];
  }
  visitNumberLiteral(node) {
    return node.value;
  }
  visitStringLiteral(node) {
    return node.value;
  }
  visitIdentifier(node) {
    if (!(node.name in this.scope)) throw new ReferenceError(`未定义的变量 ${node.name}`);
    return this.scope[node.name];
  }
  visitBinaryExpression(node) {
    // ★第二重分发：递归调用子节点的 accept，回到第一重分发
    const l = node.left.accept(this);
    const r = node.right.accept(this);
    const result = BINARY_OPS[node.operator](l, r);
    this.steps.push(`${this.describe(node)} = ${formatNum(result)}`);
    return result;
  }
  visitCallExpression(node) {
    const args = node.args.map((a) => a.accept(this));
    if (!(node.callee in this.scope.functions)) throw new ReferenceError(`未定义的函数 ${node.callee}()`);
    const result = this.scope.functions[node.callee](args);
    this.steps.push(`${node.callee}(${args.map(formatNum).join(', ')}) = ${formatNum(result)}`);
    return result;
  }
  describe(node) {
    return `${node.left.accept(new Printer())} ${node.operator} ${node.right.accept(new Printer())}`;
  }
}

const BINARY_OPS = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => a / b,
};
const formatNum = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

/** 运算符优先级：数字越大越"紧" */
const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2 };

/**
 * 访问者 2：还原成源码字符串。
 * 这里顺带演示一个"只有打印器才需要知道"的知识：**括号最少化**。
 * 为了让"父节点的优先级"能传下去，访问者对象需要携带状态（this.parentPrecedence）——
 * 这正是"访问者也是对象、可以带状态"的价值所在（如果是普通函数就得靠额外参数）。
 */
class Printer {
  constructor() {
    this.parentPrecedence = 0; // 当前打印位置要求的最低优先级
  }

  #withParens(text, precedence) {
    return precedence < this.parentPrecedence ? `(${text})` : text;
  }

  visitNumberLiteral(node) {
    return this.#withParens(String(node.value), Infinity); // 原子表达式，永远不需要括号
  }
  visitStringLiteral(node) {
    return this.#withParens(JSON.stringify(node.value), Infinity);
  }
  visitIdentifier(node) {
    return this.#withParens(node.name, Infinity);
  }
  visitBinaryExpression(node) {
    const precedence = PRECEDENCE[node.operator];
    const saved = this.parentPrecedence;

    // 左操作数：左结合，同优先级不必加括号
    this.parentPrecedence = precedence;
    const left = node.left.accept(this);
    // 右操作数：'-' 与 '/' 不满足结合律，同优先级必须加括号（a - (b - c) ≠ a - b - c）
    this.parentPrecedence = node.operator === '-' || node.operator === '/' ? precedence + 1 : precedence;
    const right = node.right.accept(this);

    this.parentPrecedence = saved; // 还原上下文，再决定"我自己"要不要括号
    return this.#withParens(`${left} ${node.operator} ${right}`, precedence);
  }
  visitCallExpression(node) {
    return this.#withParens(`${node.callee}(${node.args.map((a) => a.accept(this)).join(', ')})`, Infinity);
  }
}

/** 访问者 3：统计（节点数、深度、各类型分布）—— 纯副作用型访问者 */
class MetricsCollector {
  constructor() {
    this.counts = {};
    this.maxDepth = 0;
    this.nodeCount = 0;
  }
  #count(kind) {
    this.counts[kind] = (this.counts[kind] ?? 0) + 1;
    this.nodeCount += 1;
  }
  #depth(node) {
    if (node instanceof BinaryExpression) return 1 + Math.max(this.#depth(node.left), this.#depth(node.right));
    if (node instanceof CallExpression) return 1 + Math.max(0, ...node.args.map((a) => this.#depth(a)));
    return 0;
  }
  visitNumberLiteral() {
    this.#count('数字字面量');
    return null;
  }
  visitStringLiteral() {
    this.#count('字符串字面量');
    return null;
  }
  visitIdentifier() {
    this.#count('变量引用');
    return null;
  }
  visitBinaryExpression(node) {
    this.#count(`二元运算 ${node.operator}`);
    this.maxDepth = Math.max(this.maxDepth, this.#depth(node));
    node.left.accept(this);
    node.right.accept(this);
    return null;
  }
  visitCallExpression(node) {
    this.#count('函数调用');
    node.args.forEach((a) => a.accept(this));
    return null;
  }
}

/** 访问者 4：导出成纯数据 —— 演示"不改任何节点类就新增了一个操作" */
class AstJsonExporter {
  visitNumberLiteral(node) {
    return { type: 'Number', value: node.value };
  }
  visitStringLiteral(node) {
    return { type: 'String', value: node.value };
  }
  visitIdentifier(node) {
    return { type: 'Identifier', name: node.name };
  }
  visitBinaryExpression(node) {
    return { type: 'Binary', op: node.operator, left: node.left.accept(this), right: node.right.accept(this) };
  }
  visitCallExpression(node) {
    return { type: 'Call', callee: node.callee, args: node.args.map((a) => a.accept(this)) };
  }
}

const scope = {
  price: 299,
  quantity: 3,
  functions: { tax: ([amount]) => Number((amount * 0.06).toFixed(2)) },
};

const evaluator = new Evaluator(scope);
const value = ast.accept(evaluator);
console.log(`  ① Evaluator 求值结果：${formatNum(value)}`);
console.log(`     求值过程（自底向上）：`);
for (const step of evaluator.steps) console.log(`       ${step}`);

console.log(`\n  ② Printer 还原源码：${ast.accept(new Printer())}`);
console.log(`     验证括号规则 —— "打印出来再求值，结果必须与原始语义一致"：`);
const parenCases = [
  ['(10 - 4) * 3', new BinaryExpression('*', new BinaryExpression('-', new NumberLiteral(10), new NumberLiteral(4)), new NumberLiteral(3))],
  ['10 - (4 - 3)', new BinaryExpression('-', new NumberLiteral(10), new BinaryExpression('-', new NumberLiteral(4), new NumberLiteral(3)))],
  ['20 / (5 / 2)', new BinaryExpression('/', new NumberLiteral(20), new BinaryExpression('/', new NumberLiteral(5), new NumberLiteral(2)))],
  ['2 * 3 + 4 * 5', new BinaryExpression('+', new BinaryExpression('*', new NumberLiteral(2), new NumberLiteral(3)), new BinaryExpression('*', new NumberLiteral(4), new NumberLiteral(5)))],
];
const evalOnly = () => new Evaluator({ functions: {} });
for (const [expected, tree] of parenCases) {
  const printed = tree.accept(new Printer());
  const original = tree.accept(evalOnly());
  // 打印结果在 JS 里重新求值一次，验证"打印是保义的"。
  // ⚠ 这里用 Function 只是为了"把字符串再算一遍"做对照，输入完全由本文件自己构造；
  //   绝不代表可以对用户输入用 eval/Function（那正是 32_security_and_best_practices.js 的内容）。
  const reparsed = Function(`"use strict"; return (${printed});`)();
  const ok = original === reparsed;
  console.log(`       ${ok ? '✓' : '✗'} 原始值=${original}，打印为 "${printed}"，重新求值=${reparsed}` +
    (printed === expected ? '（括号最少）' : ''));
}
console.log(`     关键点：'*' 的左操作数如果是 '+'/'-' 表达式**必须**加括号，
     否则 (10-4)*3 会被打印成 10 - 4 * 3（值从 18 变成 -2）。`);

const metrics = new MetricsCollector();
ast.accept(metrics);
console.log(`\n  ③ MetricsCollector 统计：共 ${metrics.nodeCount} 个节点，最大深度 ${metrics.maxDepth}`);
console.log(`     类型分布：${JSON.stringify(metrics.counts)}`);

const exported = ast.accept(new AstJsonExporter());
console.log(`\n  ④ AstJsonExporter 导出（前 120 字符）：${JSON.stringify(exported).slice(0, 120)}...`);
console.log(`     ★注意：以上四个操作，**一个节点类都没有改过**。
     新增"导出成 JSON"只写了一个新类 AstJsonExporter，这就是访问者的全部价值。`);

console.log('\n--- 3.3 双重分发（double dispatch）到底发生了什么 ---');
console.log(`  ast.accept(evaluator)
    -> ① 按**节点类型**分发：BinaryExpression.accept 调用 evaluator.visitBinaryExpression
    -> ② 递归子节点：node.left.accept(this) 又重新走一次 ①
  两次派发的参与方分别是"节点类型"和"访问者类型"，所以叫双重分发。
  JS 没有方法重载、也没有多方法（multimethod），只能用**约定好的方法名** visitXxx；
  写错名字不会报错，只会在运行时抛 "visitor.visitXxx is not a function" ——
  这是访问者在动态语言里的主要风险。`);
try {
  ast.accept({}); // 传入一个什么都没实现的"访问者"
} catch (err) {
  console.log(`  验证这个风险：${err.name}: ${err.message}`);
}

console.log('\n--- 3.4 表达式问题（Expression Problem）与代价 ---');
console.log(`  访问者把"扩展的难易"做了如下取舍：

    操作种类增加（求值 -> 再加打印 -> 再加统计 -> 再加导出）：
      访问者：★只需新增一个访问者类，**不动任何节点类**（本文件就是这样加了 4 个操作）
      普通多态方法：要给**每个节点类**都加一个方法（改 N 个文件）
    节点种类增加（再加 If / Lambda / 数组字面量）：
      访问者：❌要改**所有**访问者（漏一个就是运行时错误）
      普通多态方法：★只需新增一个节点类 + 一个方法

  所以选择标准非常明确：
    节点类型**稳定**、操作种类**经常增加** -> 访问者（编译器、linter、查询引擎都是这种形态）
    操作稳定、节点类型经常增加       -> 普通多态方法（虚函数）
    两者都经常变                     -> 考虑用模式匹配/联合类型（TS 的 discriminated union）+ 穷尽检查`);

const exprProblemTable = [
  ['实现方式 \\ 要扩展什么', '新增一种"操作"', '新增一种"节点"'],
  ['多态方法（虚函数）', '要改 N 个节点类', '只加 1 个新类'],
  ['访问者 Visitor', '只加 1 个访问者类', '要改全部 M 个访问者'],
  ['真实例子', 'Babel 插件、ESLint 规则、TS 检查器', '编译器新增语法节点'],
];
printTable(exprProblemTable);

console.log(`\n【收益】
  1) 操作与结构分离：节点类只关心"我是什么"，操作集中在访问者里，各自演化；
  2) 新增操作零侵入：不碰已有的节点类，符合开闭原则；
  3) 访问者本身是对象，可以携带状态（统计器、符号表、作用域链）；
  4) 相关操作聚在一起，比"散在 8 个节点类里"更好读、更好测。

【代价】
  1) 新增节点类型成本高：要改所有访问者（这是访问者最大的软肋）；
  2) 破坏封装：访问者需要访问节点的内部字段，节点等于把内部结构公开了；
  3) 约定式方法名在 JS 里没有编译期检查，写错只能运行时暴露；
  4) 代码总量变多：4 个操作 × 5 种节点 = 20 个 visitXxx 方法；
  5) 递归控制流被拆散：读代码要在节点与访问者之间来回跳。

【什么时候不该用】
  1) 节点类型还在频繁变化（早期设计阶段）：先用多态方法，稳定后再重构为访问者；
  2) 只有一两种操作：直接写两个函数 / 用多态方法，别造访问者框架；
  3) 操作需要修改节点结构（比如"常量折叠"要替换节点）：访问者只能读，
     需要"返回新树"的变体（很多编译器用 transform 而非 visit 就是这个原因）。`);

// ===========================================================================
// 第四部分：桥接 Bridge —— 抽象与实现分离，避免类爆炸
// ===========================================================================

console.log('\n\n=== 第四部分：桥接 Bridge（报表 × 导出格式）===\n');
console.log('--- 4.1 坏味道：两个维度相乘 ---');

console.log(`  需求：有 3 种报表（销售明细、地区汇总、库存），要能导出成 3 种格式（CSV / HTML / JSON）。
  用传统的多继承/多态方式，需要的类数量是**相乘**的：`);
const explosionTable = [
  ['报表种类 \\ 格式', 'CSV', 'HTML', 'JSON', '小计'],
  ['销售明细', 'SalesReportCsv', 'SalesReportHtml', 'SalesReportJson', '3 个类'],
  ['地区汇总', 'RegionReportCsv', 'RegionReportHtml', 'RegionReportJson', '3 个类'],
  ['库存', 'StockReportCsv', 'StockReportHtml', 'StockReportJson', '3 个类'],
  ['新增 1 种格式 / 1 种报表', '×3 个类', '×3 个类', '×3 个类', '+3 或 +9'],
];
printTable(explosionTable);
console.log(`  3 × 3 = 9 个类。若再加"邮件报表"（第 4 种格式），就要再写 3 个类 ——
  **两个维度都在变化时，类的数量是 M × N，而不是 M + N。** 桥接就是来解决这个的。`);

console.log('\n--- 4.2 桥接重构：把两个维度拆开 ---');

// ---- 维度一：实现层（Implementor）—— 怎么渲染，只关心 title/columns/rows 这样的中性数据 ----
class Exporter {
  get formatName() {
    return 'unknown';
  }
  /**
   * @abstract
   * @param {{title:string, columns:string[], rows:Array<Array<any>>, footer?:Array<any>}} model
   */
  export(_model) {
    throw new Error(`${this.constructor.name} 必须实现 export(model)`);
  }
}

class CsvExporter extends Exporter {
  get formatName() {
    return 'CSV';
  }
  export({ title, columns, rows, footer }) {
    const lines = [columns.join(',')];
    for (const row of rows) lines.push(row.join(','));
    if (footer) lines.push(footer.join(','));
    return `# ${title}\n${lines.join('\n')}`;
  }
}

class HtmlExporter extends Exporter {
  get formatName() {
    return 'HTML';
  }
  export({ title, columns, rows, footer }) {
    const head = `    <tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr>`;
    const body = rows.map((r) => `    <tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('\n');
    const foot = footer ? `\n    <tr class="total">${footer.map((c) => `<td>${c}</td>`).join('')}</tr>` : '';
    return `<table>\n  <caption>${title}</caption>\n${head}\n${body}${foot}\n</table>`;
  }
}

class JsonExporter extends Exporter {
  get formatName() {
    return 'JSON';
  }
  export({ title, columns, rows, footer }) {
    return JSON.stringify({ title, columns, rows, ...(footer ? { footer } : {}) });
  }
}

// ---- 维度二：抽象层（Abstraction）—— 报表是什么，只关心"数据长什么样" ----
class Report {
  /**
   * @param {Exporter} exporter 实现层对象 —— 这就是"桥"：
   *   抽象层通过**组合**持有实现层，而不是继承它。
   */
  constructor(exporter, source) {
    this.exporter = exporter;
    this.source = source;
  }

  /** 子类实现：把原始数据变成中性模型（title/columns/rows/footer） */
  buildModel() {
    throw new Error(`${this.constructor.name} 必须实现 buildModel()`);
  }

  /** 抽象层负责"业务"，实现层负责"渲染"，桥接点就是这一行 */
  render() {
    return this.exporter.export(this.buildModel());
  }

  /**
   * ★桥接的灵活性：实现层可以在运行时替换。
   * 同一个报表对象先导 CSV、再导 HTML，不需要新建任何对象。
   */
  switchExporter(exporter) {
    this.exporter = exporter;
    return this;
  }
}

/** 抽象层的第一种实现：明细报表 */
class DetailReport extends Report {
  buildModel() {
    const rows = this.source.map((o) => [o.id, o.region, o.amount, o.status]);
    return { title: '销售明细报表', columns: ['订单号', '地区', '金额', '状态'], rows };
  }
}

/** 抽象层的第二种实现：地区汇总报表（同样的桥，但业务逻辑完全不同） */
class RegionSummaryReport extends Report {
  buildModel() {
    const byRegion = new Map();
    for (const o of this.source) {
      byRegion.set(o.region, (byRegion.get(o.region) ?? 0) + o.amount);
    }
    const rows = [...byRegion.entries()].sort((a, b) => b[1] - a[1]);
    const total = rows.reduce((s, [, amount]) => s + amount, 0);
    return {
      title: '地区销售汇总（含合计行）',
      columns: ['地区', '销售额'],
      rows,
      footer: ['合计', total],
    };
  }
}

/** 抽象层的第三种实现：库存报表（数据源不同，仍然复用同一套导出器） */
class StockReport extends Report {
  buildModel() {
    return {
      title: '库存预警报表',
      columns: ['SKU', '名称', '剩余', '是否预警'],
      rows: this.source.map((s) => [s.sku, s.name, s.stock, s.stock < 20 ? '⚠ 需要补货' : '正常']),
    };
  }
}

// ---- 数据源 ----
const orders = [
  { id: 'SO-1001', region: '华东', amount: 299, status: '已完成' },
  { id: 'SO-1002', region: '华南', amount: 1280, status: '已发货' },
  { id: 'SO-1003', region: '华东', amount: 88, status: '待付款' },
  { id: 'SO-1004', region: '华北', amount: 450, status: '已完成' },
];
const stocks = [
  { sku: 'SKU-A1', name: '机械键盘', stock: 12 },
  { sku: 'SKU-B2', name: '人体工学椅', stock: 64 },
];

console.log('--- 4.3 自由组合：3 种报表 × 3 种导出，共 3 + 3 = 6 个类 ---');
const exporters = { csv: new CsvExporter(), html: new HtmlExporter(), json: new JsonExporter() };
const reportFactories = {
  明细报表: () => new DetailReport(exporters.csv, orders),
  地区汇总: () => new RegionSummaryReport(exporters.csv, orders),
  库存报表: () => new StockReport(exporters.csv, stocks),
};

console.log(`  可组合数量：${Object.keys(reportFactories).length} × ${Object.keys(exporters).length} = ` +
  `${Object.keys(reportFactories).length * Object.keys(exporters).length} 种组合，` +
  `但只需要 ${Object.keys(reportFactories).length} + ${Object.keys(exporters).length} = 6 个类。\n`);

for (const [reportName, make] of Object.entries(reportFactories)) {
  for (const [fmtName, exporter] of Object.entries(exporters)) {
    const report = make().switchExporter(exporter); // 运行时换实现 —— 桥接的核心能力
    const output = report.render();
    const preview = output.replace(/\n/g, ' ⏎ ');
    console.log(`  [${reportName} × ${fmtName.toUpperCase().padEnd(4)}] ${preview.length > 96 ? preview.slice(0, 96) + '…' : preview}`);
  }
}

console.log('\n  地区汇总报表的完整 HTML 输出：');
console.log(
  new RegionSummaryReport(new HtmlExporter(), orders)
    .render()
    .split('\n')
    .map((l) => '    ' + l)
    .join('\n'),
);

console.log('\n--- 4.4 桥接 vs 策略 vs 适配器 ---');
const bridgeCompare = [
  ['对比项', '桥接 Bridge', '策略 Strategy', '适配器 Adapter'],
  ['目的', '让两个维度**各自独立**演化', '在同一维度里换一种算法', '让不兼容的**已有**接口能一起工作'],
  ['维度数量', '两个（抽象层 + 实现层），两层都可能有继承', '一个', '一个'],
  ['谁变化', '抽象层新增子类、实现层也新增子类', '只新增策略实现', '被适配方通常是第三方，改不了'],
  ['典型标志', '有 M 个抽象 × N 个实现，希望只写 M+N 个类', '一个 Context + 若干互斥算法', '接口形状的转换（参数/返回值/方法名）'],
  ['设计时机', '事前设计（一开始就知道有两个维度）', '事中重构（发现分支爆炸时提取）', '事后补救（对接外部系统时）'],
  ['真实案例', 'JDBC Driver、跨平台 UI、报表×格式', '运费计算、压缩算法、排序比较器', '旧日志库适配新日志接口、支付 SDK 适配层'],
];
printTable(bridgeCompare);

console.log(`\n  桥接与策略的结构几乎一样（都是"持有一个对象并委托"），
  区别在**意图**：策略的目标是"换算法"，桥接的目标是"让两个继承体系各自扩展"。
  所以判断方法也简单：如果你发现"抽象层也需要再分出子类"（像本节的三种报表），
  那它就是桥接；如果只有一层在变，那叫策略就好。

【收益】
  1) 类的数量从 M × N 降到 M + N（3 种报表 × 3 种格式：9 -> 6；5 × 5 时是 25 -> 10）；
  2) 两个维度可以独立演化：新增格式不动报表，新增报表不动格式；
  3) 实现层可以在运行时替换（switchExporter 就是证明）；
  4) 抽象层可以专注业务（数据怎么算），实现层专注渲染（怎么展示），职责清晰。

【代价】
  1) 多了一层间接与一套接口约定，小规模场景下明显是过度设计；
  2) 需要事先识别出"两个维度"—— 这需要经验，判断错了会得到一套别扭的抽象；
  3) 实现层的接口设计很难：它必须"中立"到能被所有抽象层使用
     （本节的 export(model) 用的是 title/columns/rows，而不是"订单数组"，
      一旦设计成后者，库存报表就复用不了了）；
  4) 调试链路变长：report.render() -> exporter.export() -> 具体格式逻辑。

【什么时候不该用】
  1) 只有一个变化维度：用策略，别叫桥接；
  2) 维度组合数量很少（比如 2×2）：直接写 4 个类更直白，别为 4 个类引入桥接；
  3) 两个维度其实高度相关（换了报表就要换格式，永远成对出现）：
     那它们本就是一个维度，强行拆开只会增加跳转。`);

// ===========================================================================
// 小结
// ===========================================================================

console.log('\n--- 小结：四个行为型模式横向对照 ---\n');
const finalTable = [
  ['模式', '一句话解决什么', '核心机制', '典型信号', '主要代价'],
  ['中介者 Mediator', '把多对多通信收敛成星型，集中做全局决策', '同事只认识中介者', '对象之间互相引用成网、规则需要全局信息', '中介者易变上帝对象、单点故障'],
  ['备忘录 Memento', '不破坏封装地保存/恢复状态', '深拷贝快照 + 黑盒管理器', '需要撤销、草稿恢复、时间旅行调试', '内存与拷贝成本、需设上限'],
  ['访问者 Visitor', '不改节点类就给结构添加新操作', '双重分发 accept/visitXxx', '语法树、文档树要做多种分析与导出', '新增节点类型要改所有访问者'],
  ['桥接 Bridge', '拆分两个维度，避免类数量相乘', '抽象组合实现（而非继承）', 'M 种抽象 × N 种实现，且两者都会增长', '多一层间接、实现层接口难设计中立'],
];
printTable(finalTable);

console.log(`
  四个模式的共同主题，其实都是同一句话：
    **把"变化的部分"从"稳定的部分"里搬出去，搬到只有一处的地方。**

    中介者搬走的是"对象之间的连接关系"（连接是变化的，每个对象本身是稳定的）；
    备忘录搬走的是"时间维度上的状态"（当前状态是稳定的，历史是变化的）；
    访问者搬走的是"作用于结构上的操作"（结构相对稳定，操作是变化的）；
    桥接搬走的是"平台/渲染细节"（业务是稳定的，渲染方式是多变的）。

  也正因如此，它们都有同一个代价：**多了一层间接**。
  判断要不要用的标准仍然是 13_pattern_selection.js 里那句话 ——
  "它消除的痛苦，是否大于它引入的间接"。
  如果回答不了这个问题，说明现在还不是用它们的时候。`);

console.log('\n全部演示完毕。');
