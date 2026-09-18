/**
 * ============================================================================
 * 知识点：观察者模式 —— Subject / Observer 双向直连的推模型
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/04_builder.js、14_classes（类的语法）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    观察者模式定义一对多的依赖：一个"被观察者"（Subject）状态变化时，
 *    自动通知所有登记在册的"观察者"（Observer）。
 *    它的标志性特征是**双向直连**：
 *      - Subject 里存着一份 observers 列表，知道都有谁在听；
 *      - Observer 里存着一个指向 subject 的引用（或在 attach 时把自己注册进去），
 *        知道自己听的是谁。
 *    这就是它和"发布订阅"最本质的区别（见第 6 节详细对比）。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 数据模型变化 → 多个视图自动刷新（MVC/MVVM 的原始形态）。
 *    - 股票行情：一个价格源，多个看板/告警器/记录器同时消费。
 *    - 表单联动：省市区三级联动，选省后自动拉市列表。
 *    - Node 的 EventEmitter、浏览器的 addEventListener、Vue 的响应式依赖收集，
 *      骨子里都是观察者模式（有的加了事件名做二级分发，就变成发布订阅了）。
 *
 * 3. 核心语法要点
 *    - Subject 的三个必备方法：attach（订阅）、detach（退订）、notify（通知）。
 *    - 通知时的两种模型：
 *        推模型（push）：notify 时把数据直接塞给观察者 `update(data)`；
 *        拉模型（pull）：只告诉观察者"我变了"，观察者自己回头 `subject.getState()` 取。
 *        推模型简单、耦合数据形状；拉模型灵活、但要求观察者持有 subject 引用。
 *    - 退订的经典陷阱：**遍历时修改数组**。观察者在 update 里 detach 自己，
 *      会导致 forEach 跳过下一个元素。解决办法：遍历副本 `[...observers]`。
 *    - 观察者应当实现统一接口（都有 update 方法），否则 Subject 需要写类型判断。
 *
 * 4. 常见陷阱
 *    - 内存泄漏：观察者已经不用了却没 detach，Subject 一直持有它的引用，
 *      导致它无法被回收（长时间运行的单页应用里非常常见）。
 *    - 通知风暴：一个观察者 update 里又改了 Subject 状态，触发再次 notify，
 *      形成无限递归或"一次改动通知 N 轮"。要加"正在通知中"的标志位。
 *    - 顺序依赖：观察者的执行顺序影响结果 —— 这是设计味道，说明观察者之间
 *      不该有依赖，它们应当可以任意顺序执行。
 *    - 异常隔离：一个观察者 update 抛错，后面的观察者就收不到通知了，
 *      单个订阅者的问题会扩散成全局故障。
 *    - 把观察者模式当事件总线用：当你不希望 Subject 知道有谁在听时，
 *      应该换成发布订阅（06_pubsub.js）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/05_observer.js
 *
 * 【预期输出】
 *   先演示最朴素的观察者实现（股票价格源 + 多个看板），再演示拉模型、
 *   退订陷阱、异常隔离，最后用对齐表格对比观察者模式与发布订阅的差异，
 *   并给出该模式的代价与不适用场景。
 * ============================================================================
 */

// ===========================================================================
// 1. 最小可用实现：股票价格源 + 两个看板
// ===========================================================================

console.log('--- 1. 最小可用实现：股票价格源 ---');

/**
 * 观察者接口（JS 没有 interface，这里用基类约定 + 运行时校验来表达"契约"）。
 * 子类必须实现 update(subject, data)。
 */
class Observer {
  // eslint-disable-next-line no-unused-vars
  update(subject, data) {
    throw new Error('观察者必须实现 update(subject, data)');
  }
}

/**
 * 被观察者（Subject）：维护观察者列表 + 在状态变化时广播。
 * 同时支持推模型（直接传 data）与拉模型（观察者自己回头取 getState()）。
 */
class Subject {
  #observers = new Set(); // 用 Set：天然去重，避免同一个观察者被注册两次
  #notifying = false; // 防止"通知过程中再次触发通知"造成递归

  /** 订阅：登记一个观察者 */
  attach(observer) {
    if (typeof observer?.update !== 'function') {
      throw new TypeError('观察者必须提供 update 方法');
    }
    this.#observers.add(observer);
    return this;
  }

  /** 退订：移除一个观察者。未注册时静默返回 false（不抛错，见第 5 节说明） */
  detach(observer) {
    return this.#observers.delete(observer);
  }

  /** 当前观察者数量（便于验证内存是否泄漏） */
  get observerCount() {
    return this.#observers.size;
  }

  /**
   * 通知所有观察者。
   * 两个关键实现细节：
   *   (1) 遍历的是**副本**，这样观察者在 update 里调用 detach 也不会漏掉别人；
   *   (2) 每个观察者单独 try/catch，一个坏掉的观察者不能拖垮其他观察者。
   */
  notify(data) {
    if (this.#notifying) {
      // 观察者不应该在 update 里反过来改状态触发再次通知（重入保护）
      throw new Error('检测到重入通知：观察者的 update 中不应再次触发 notify');
    }
    this.#notifying = true;
    try {
      // 关键：先复制一份再遍历，避免"遍历中修改集合"导致的跳过
      const snapshot = [...this.#observers];
      for (const observer of snapshot) {
        try {
          observer.update(this, data);
        } catch (err) {
          // 异常隔离：把错误记下来但不中断广播
          console.log(`  ⚠ 观察者 ${observer.constructor.name} 抛错被隔离：${err.message}`);
        }
      }
    } finally {
      // 用 finally 保证即使广播中抛错也能复位标志位
      this.#notifying = false;
    }
  }
}

/** 具体的被观察者：一个股票价格源 */
class StockTicker extends Subject {
  #prices = new Map();

  /** 改价并广播（这是唯一会触发通知的入口） */
  setPrice(symbol, price) {
    const prev = this.#prices.get(symbol);
    this.#prices.set(symbol, price);
    // 推模型：把这次变化的数据直接塞给观察者
    this.notify({ symbol, price, prev, change: prev === undefined ? 0 : price - prev });
  }

  /** 拉模型用：观察者自己来取当前快照 */
  getPrice(symbol) {
    return this.#prices.get(symbol);
  }

  getState() {
    // 返回副本，防止观察者改到内部 Map
    return new Map(this.#prices);
  }
}

/** 观察者 A：价格看板 —— 只关心显示 */
class PriceBoard extends Observer {
  constructor(name) {
    super();
    this.name = name;
    this.lastSeen = null;
  }

  // 推模型：直接用参数里的 data，不回头问 subject
  update(subject, data) {
    this.lastSeen = data.price;
    const arrow = data.change > 0 ? '↑' : data.change < 0 ? '↓' : '—';
    console.log(`  [${this.name}] ${data.symbol} = ${data.price} ${arrow}${Math.abs(data.change)}`);
  }
}

/** 观察者 B：涨跌告警器 —— 只关心阈值 */
class AlertRule extends Observer {
  constructor(symbol, threshold) {
    super();
    this.symbol = symbol;
    this.threshold = threshold;
    this.triggered = 0;
  }

  update(subject, data) {
    if (data.symbol !== this.symbol) return; // 不关心的标的直接忽略
    if (data.price >= this.threshold) {
      this.triggered += 1;
      console.log(`  [告警] ${this.symbol} 突破 ${this.threshold}，当前 ${data.price}`);
    }
  }
}

/** 观察者 C：拉模型示例 —— 只在被通知时自己去 subject 取数据 */
class Dashboard extends Observer {
  update(subject) {
    // 注意这里不需要 data 参数：它持有 subject 引用，自己回头取
    const all = subject.getState();
    const summary = [...all.entries()].map(([s, p]) => `${s}:${p}`).join('  ');
    console.log(`  [Dashboard 拉取] ${summary}`);
  }
}

const ticker = new StockTicker();
const boardA = new PriceBoard('主板看板');
const boardB = new PriceBoard('移动端看板');
const alert = new AlertRule('AAPL', 180);
const dashboard = new Dashboard();

// attach 的顺序就是通知顺序（这是实现细节，不是契约 —— 观察者之间不应互相依赖）
ticker.attach(boardA).attach(boardB).attach(alert).attach(dashboard);
console.log('已注册观察者数量：', ticker.observerCount);

ticker.setPrice('AAPL', 175);
console.log('  --- 价格继续变化 ---');
ticker.setPrice('AAPL', 181);
ticker.setPrice('MSFT', 420);

// ===========================================================================
// 2. 观察者持有 subject 引用：setSubject / 反向链接
// ===========================================================================

console.log('\n--- 2. 观察者持有 subject 引用的两种方式 ---');

console.log(`【方式 1】attach 时由 Subject 记录观察者（本文件采用）
    subject.attach(observer) —— Subject 单向持有 observer。
    观察者想在 update 里回访，就用回调参数里的 subject（框架帮你传）。
    优点：观察者不需要在构造时就认识 Subject，可复用于多个 Subject。

【方式 2】观察者构造时传入 Subject，自己完成注册（观察者主动持有）
    典型写法：
      class MyObserver {
        constructor(subject) { this.subject = subject; subject.attach(this); }
        destroy() { this.subject.detach(this); }   // 必须提供销毁入口
      }
    优点：调用方少写一行 attach；缺点：构造函数的副作用（偷偷注册）不易察觉，
    且观察者与 Subject 强绑定，无法复用。

【结论】现代实践更推荐方式 1（注册与构造分离），
    并且**一定要提供 destroy/dispose 方法**来解除注册。`);

/** 演示方式 2：构造即注册，并自带销毁入口 */
class SelfRegisteringLogger extends Observer {
  constructor(subject, label) {
    super();
    this.subject = subject; // 观察者持有 subject 引用
    this.label = label;
    subject.attach(this); // ← 构造函数里的副作用：调用方看不到这行，却发生了注册
  }

  update(subject, data) {
    // 既可以用参数里的 subject，也可以用自己的 this.subject（同一个对象）
    console.log(`  [${this.label}] 收到 ${data.symbol}，引用一致：${subject === this.subject}`);
  }

  /** 销毁：解除注册，切断双向引用，让对象可以被 GC 回收 */
  destroy() {
    this.subject.detach(this);
    this.subject = null; // 关键：把反向引用也清掉，否则两边互相持有
  }
}

const selfLogger = new SelfRegisteringLogger(ticker, '自注册日志器');
ticker.setPrice('AAPL', 182);
selfLogger.destroy();
console.log('销毁后观察者数量：', ticker.observerCount);
ticker.setPrice('AAPL', 183); // 已退订，不会再打印该观察者的日志

// ===========================================================================
// 3. 退订陷阱：遍历时修改集合
// ===========================================================================

console.log('\n--- 3. 陷阱：观察者在 update 中退订自己 ---');

/**
 * 反面实现：直接 forEach 原数组，观察者一旦在 update 里 detach 自己，
 * 后面的元素就会被"跳过"（数组变短了，索引却继续前进）。
 */
class BuggySubject {
  observers = [];

  attach(o) {
    this.observers.push(o);
    return this;
  }
  detach(o) {
    const i = this.observers.indexOf(o);
    if (i >= 0) this.observers.splice(i, 1);
    return this;
  }
  notify(data) {
    const delivered = [];
    // BUG：这里遍历的是原数组
    this.observers.forEach((o) => {
      o.update(this, data); // 若 o 在 update 里 detach 了自己，数组长度会变
      delivered.push(o.name);
    });
    return delivered;
  }
}

const buggy = new BuggySubject();
// 三个观察者，其中第二个在被通知后会立刻退订自己（典型的"一次性监听"）
const mk = (name, selfDetach) => ({
  name,
  update(subject) {
    if (selfDetach) subject.detach(this);
  },
});
const o1 = mk('第一个', false);
const o2 = mk('第二个（会自我退订）', true);
const o3 = mk('第三个', false);
buggy.attach(o1).attach(o2).attach(o3);

const deliveredByBuggy = buggy.notify({ v: 1 });
console.log('有 bug 的实现，实际被通知到的：', deliveredByBuggy);
console.log('期望是三个都收到，实际漏掉了：', ['第一个', '第二个（会自我退订）', '第三个'].filter((n) => !deliveredByBuggy.includes(n)));

// 正确实现：先复制再遍历（本文件 Subject 类采用的做法）
console.log('本文件 Subject 类的做法是 [...this.#observers] 复制后再遍历，因此不会漏。');
let hits = 0;
class CountingSubject extends Subject {}
const safe = new CountingSubject();
const tmp = { update: () => { hits += 1; safe.detach(tmp); } };
safe.attach(tmp);
const other1 = { update: () => { hits += 1; } };
const other2 = { update: () => { hits += 1; } };
safe.attach(other1).attach(other2);
safe.notify({ v: 1 });
console.log('安全实现本轮命中次数：', hits, '（3 个观察者都收到了）');

// ===========================================================================
// 4. 异常隔离与重入保护
// ===========================================================================

console.log('\n--- 4. 异常隔离与重入保护 ---');

const s2 = new StockTicker();
s2.attach(new PriceBoard('正常看板'));
s2.attach({
  // 一个"手滑"的观察者：update 里访问了 undefined 的属性
  update() {
    const nothing = null;
    return nothing.boom.value;
  },
});
s2.attach(new PriceBoard('另一个正常看板'));
console.log('广播中，其中一个观察者抛错：');
s2.setPrice('TSLA', 250); // 我们会看到错误被隔离，前后两个看板仍然正常打印

// 重入保护演示：观察者在 update 里反过来触发 notify
console.log('-- 重入保护演示（观察者反过来驱动 Subject） --');
const s3 = new StockTicker();
s3.attach({
  update(subject) {
    // 这是典型的错误用法：观察者不该驱动 Subject 变化
    subject.setPrice('LOOP', 1);
  },
});
try {
  s3.setPrice('LOOP', 0);
} catch (err) {
  console.log('重入被拦下：', err.message, '（该错误同样被观察者隔离机制转成了告警）');
}
console.log('（说明：s3 的观察者抛出的重入错误会被 Subject 的 try/catch 隔离，');
console.log(' 所以这里的 try/catch 捕获不到 —— 这本身就是"异常隔离"的证据）');

// ===========================================================================
// 5. detach 未注册的观察者：为什么选择"静默返回 false"
// ===========================================================================

console.log('\n--- 5. detach 一个没注册过的观察者 ---');

const ghost = new PriceBoard('幽灵看板');
console.log('未注册就 detach，返回值：', ticker.detach(ghost));
console.log(`为什么选择静默而不是抛错？
  因为"重复退订"在真实代码里太常见了：组件卸载时统一调 dispose()，
  而该组件可能因为异常从未注册成功。此时抛错会把"清理流程"变成新的崩溃点。
  设计原则：**清理操作应当幂等**（做多少次结果都一样），
  而对外的"业务操作"才需要严格校验。`);

// ===========================================================================
// 6. 观察者模式 vs 发布订阅：一张对照表
// ===========================================================================

console.log('\n--- 6. 观察者模式 vs 发布订阅 ---');

console.log(`【观察者模式：双向直连】
    Subject ──持有列表──> Observer
    Observer ──引用──> Subject
    双方互相知道对方的存在。Subject 必须知道"观察者长什么样"（要有 update）。

【发布订阅：通过事件总线解耦】
    Publisher ──emit('event')──> EventBus ──分发──> Subscriber
    Publisher 不知道订阅者是谁，Subscriber 也不知道发布者是谁，
    双方只认识 EventBus 和"事件名"这个字符串。
    （发布订阅 = 观察者模式 + 一个中间人，把"认识对象"降级成"认识字符串"）`);

const rows = [
  ['对比维度', '观察者模式', '发布订阅模式'],
  ['通信方式', '双向直连', '经事件总线中转'],
  ['耦合关系', '互相知道对方', '互不知道，只认识事件名'],
  ['通知粒度', '整个对象的状态变化', '按事件名分类，可多对多'],
  ['能否多对多', '可（一个观察者订阅多个 Subject）', '天然支持，且跨模块'],
  ['生产者需否知道消费者', '需要（要维护列表）', '不需要'],
  ['典型实现', 'addEventListener / Vue 依赖收集', 'EventEmitter / Redux / MQ'],
  ['主要风险', '内存泄漏、重入、顺序依赖', '事件名拼错、全局状态泛滥'],
];
// 中英混排按显示宽度对齐：CJK 字符占 2 列
const dw = (s) =>
  [...String(s)].reduce((w, ch) => w + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1), 0);
const ws = [0, 1, 2].map((i) => Math.max(...rows.map((r) => dw(r[i]))));
const padTo = (s, w) => String(s) + ' '.repeat(w - dw(s) + 2);
for (const [idx, row] of rows.entries()) {
  console.log(row.map((c, i) => padTo(c, ws[i])).join(''));
  if (idx === 0) console.log('-'.repeat(ws.reduce((a, w) => a + w + 2, 0)));
}

// ===========================================================================
// 7. 代价与什么时候不该用
// ===========================================================================

console.log('\n--- 7. 观察者模式的代价与不适用场景 ---');

console.log(`【代价】
  1) 内存泄漏风险：Subject 强引用所有观察者，忘记 detach 就永远回收不掉。
     长生命周期对象（全局 store、resize 监听）上的订阅是重灾区。
  2) 执行顺序不明确：观察者的调用顺序是实现细节，一旦业务依赖这个顺序，
     代码就变得脆弱（加一个观察者可能改变结果）。
  3) 调试困难：一次 setState 触发多少 update、谁改的、谁又被改，
     在链路深的时候很难追踪（"事件地狱"）。
  4) 隐式控制流：从 notify 到 update 之间的跳跃，让"读代码"无法线性理解流程。
  5) 重入与循环：A 改状态触发 B，B 又改状态触发 A，需要额外机制兜底。

【什么时候不该用】
  1) 只有一个消费者、且调用关系固定：直接调用方法最清楚，
     加一层观察者是纯粹的多余间接。
  2) 需要"请求-响应"式的同步返回：观察者是单向通知，
     拿不到返回值，硬要做就得塞回调，不如直接调函数。
  3) 跨模块、跨越"发布者不该认识订阅者"的边界时：用发布订阅（06 文件）。
  4) 消费者需要严格控制生命周期（比如必须在本帧内完成）：
     观察者的执行时机不可控，容易与渲染/事务时序打架。

判断口诀：如果"谁在听"是发布者**不该关心**的事 —— 用发布订阅；
  如果"谁在听"是发布者**业务上必须知道**的（比如模型知道自己有哪些视图），
  才用观察者。区别不在写法，而在**依赖方向的设计意图**。`);

console.log('\n全部演示完毕。');
