/**
 * ============================================================================
 * 知识点：发布订阅模式 —— 完整 EventBus 实现（on/once/off/emit/clear）
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/05_observer.js（务必先看，两者是同一思想的两级形态）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    发布订阅（Publish-Subscribe）在发布者和订阅者之间插入一个"事件总线"（EventBus）：
 *      publisher.emit('order:paid', payload)
 *      subscriber.on('order:paid', handler)
 *    双方彼此不认识，只认识事件名。它是观察者模式的**解耦升级版**：
 *    把"观察者对象"换成"事件名字符串"，于是 1 对多升级成多对多，且跨模块可用。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 前端组件通信：兄弟组件、跨层级组件不想层层传 props 时，用事件总线。
 *    - Node 的 EventEmitter：几乎所有 Node 核心模块（http、stream、process）都基于它。
 *    - 埋点 / 消息队列：业务只负责"抛出事实"，谁消费、消费几次与它无关。
 *    - 插件系统：宿主提供 emit/on 钩子，插件挂上去即可，宿主不需要认识任何插件。
 *
 * 3. 核心语法要点
 *    - 数据结构选 Map<eventName, Set<handler>>：
 *        Map 而不是普通对象 —— 事件名可以是任意字符串，不怕与 Object.prototype
 *        上的键（toString、constructor）撞名，性能上也更适合频繁增删。
 *        Set 而不是数组 —— 天然去重（同一个函数注册两次只存一份）、
 *        O(1) 删除（数组要 indexOf + splice，是 O(n)）。
 *    - once 的实现：不能直接把原函数塞进去，要包一层 wrapper，
 *      并在 wrapper 里先 off 再调用。关键点：**必须在 wrapper 上记录原函数引用**
 *      （常见做法 wrapper.listener = fn），否则 off(fn) 找不到那个 wrapper。
 *    - emit 的异常隔离：每个 handler 单独 try/catch，
 *      一个订阅者抛错不能让其余订阅者收不到事件。
 *    - 通配符监听：'*' 监听所有事件；'order:*' 按前缀匹配。
 *      实现上是在 emit 时多做几轮匹配（见第 5 节）。
 *    - 快照遍历：emit 过程中有人 off 或 on，必须遍历 handler 的副本。
 *
 * 4. 常见陷阱
 *    - 事件名拼错：字符串没有类型检查，'oder:paid' 与 'order:paid' 是两个事件，
 *      而且**不会报错**，只是静默不触发。TS 里用字面量联合类型可缓解。
 *    - off 不生效：自己包了个箭头函数 `on('e', () => doSomething())`，
 *      之后想 off(doSomething) —— 不是同一个引用，删不掉。
 *    - 内存泄漏：组件卸载时忘记 off，EventBus 一直持有回调及其闭包变量。
 *    - once 的 off 时机：先 off 再调用，还是先调用再 off？
 *      若 handler 内部再次 emit 同一事件，顺序会影响行为（本文件先 off 后调用，更安全）。
 *    - "幽灵总线"：全局单例的 EventBus 谁都能 emit，事件名冲突 + 无法追踪。
 *      大型项目应该按领域拆分多个总线，或干脆用状态管理库。
 *    - handler 返回值被丢弃：emit 是单向通知，拿不到返回值（需要返回值就别用事件）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/06_pubsub.js
 *
 * 【预期输出】
 *   先给出完整 EventBus 实现与逐功能演示（on/off/once/emit/clear），
 *   再演示 off 的三种边界、异常隔离、通配符监听，最后用 setTimeout 模拟一个
 *   "异步事件"场景（定时器执行完即结束，进程可正常退出），
 *   并列出发布订阅的代价与不适用场景。
 * ============================================================================
 */

// ===========================================================================
// 1. 完整实现：EventBus
// ===========================================================================

console.log('--- 1. EventBus 完整实现 ---');

/**
 * 一个教学用的完整事件总线。
 * on / once / off / emit / clear / listenerCount 六个方法覆盖了 99% 的使用场景。
 */
class EventBus {
  /**
   * 事件名 -> 处理函数集合。
   * 选 Map + Set 的理由见文件头"核心语法要点"第 1 条。
   * 用 # 私有，防止外部直接改这个 Map 绕过所有校验。
   */
  #handlers = new Map();

  /**
   * 订阅一个事件。
   * @param {string} event 事件名
   * @param {Function} handler 处理函数
   * @returns {() => void} 返回一个"取消订阅"函数（方便调用方保存并调用，比记 event+handler 不易错）
   */
  on(event, handler) {
    assertEventName(event);
    if (typeof handler !== 'function') {
      throw new TypeError(`handler 必须是函数，收到 ${typeof handler}`);
    }
    if (!this.#handlers.has(event)) {
      this.#handlers.set(event, new Set());
    }
    this.#handlers.get(event).add(handler); // Set 自动去重：同一函数重复 on 只存一份
    // 返回退订函数是很好的 API 设计：调用方不用再记 event 名
    return () => this.off(event, handler);
  }

  /**
   * 订阅一个"只触发一次"的事件。
   * 实现要点：把原函数包进 wrapper，wrapper 里先退订再调用。
   */
  once(event, handler) {
    assertEventName(event);
    if (typeof handler !== 'function') {
      throw new TypeError('handler 必须是函数');
    }
    // 用变量接住 wrapper，这样 wrapper 内部可以引用自己
    const wrapper = (...args) => {
      // 关键顺序：先退订，再调用。
      // 这样即使 handler 内部再次 emit 同一事件，也不会重复触发。
      this.off(event, wrapper);
      return handler(...args);
    };
    // ★关键技巧：把原函数挂在 wrapper 上。
    //   否则 off(event, 原函数) 永远找不到这个 wrapper，once 就退订不掉了。
    wrapper.listener = handler;
    this.on(event, wrapper);
    return () => this.off(event, wrapper);
  }

  /**
   * 退订。
   * 实现细节：注册时如果用的是 once 的 wrapper，这里要能通过 wrapper.listener 找到原函数。
   */
  off(event, handler) {
    const set = this.#handlers.get(event);
    if (!set) return false; // 事件从未被订阅过：静默返回 false（幂等，见第 4 节）

    // 先尝试按原样删（普通 on 注册的情况）
    if (set.delete(handler)) {
      if (set.size === 0) this.#handlers.delete(event); // 空集合顺手清理，避免 Map 无限膨胀
      return true;
    }

    // 再尝试把 once 的 wrapper 找出来删掉
    for (const h of set) {
      if (h.listener === handler) {
        set.delete(h);
        if (set.size === 0) this.#handlers.delete(event);
        return true;
      }
    }
    return false; // 没找到，同样是静默
  }

  /**
   * 触发事件。
   * 三个实现要点：快照遍历、异常隔离、返回"被调用的处理函数个数"便于调试。
   */
  emit(event, ...args) {
    assertEventName(event);

    // 1) 收集本次要执行的 handler。
    //    每个目标记成 { handler, isWildcard }：
    //    精确匹配的订阅者拿到的参数就是 emit 时传的那些；
    //    通配符订阅者额外多拿一个 meta 参数（里面带事件名），
    //    否则它根本不知道自己是被哪个事件唤醒的。
    const targets = [];
    const exact = this.#handlers.get(event);
    if (exact) for (const h of exact) targets.push({ handler: h, isWildcard: false });

    // 通配符：'*' 匹配所有；'前缀:*' 匹配该前缀下的事件
    const star = this.#handlers.get('*');
    if (star) for (const h of star) targets.push({ handler: h, isWildcard: true });
    // 找出所有形如 'xxx:*' 的监听，检查 event 是否以其为前缀
    for (const [key, set] of this.#handlers) {
      if (key.length > 2 && key.endsWith(':*')) {
        const prefix = key.slice(0, -1); // 'order:*' -> 'order:'
        if (event.startsWith(prefix)) {
          for (const h of set) targets.push({ handler: h, isWildcard: true });
        }
      }
    }

    if (targets.length === 0) return 0;

    // 2) 遍历副本：handler 在回调里 on/off 都不会影响本轮遍历
    //    （Set 的迭代器在扩容/删除时行为复杂，复制成数组最稳）
    const snapshot = [...targets];
    let called = 0;
    for (const { handler, isWildcard } of snapshot) {
      try {
        if (isWildcard) {
          // 通配符订阅者：原始参数 + 一个 meta 对象
          handler(...args, { event });
        } else {
          handler(...args); // 精确订阅者：只拿原始参数，不多不少
        }
        called += 1;
      } catch (err) {
        // 3) 异常隔离：一个订阅者出错，不能影响其他订阅者
        console.log(`  ⚠ 事件 "${event}" 的某个订阅者抛错（已隔离）：${err.message}`);
      }
    }
    return called;
  }

  /** 清空：不传参数清空全部；传了事件名只清那一个 */
  clear(event) {
    if (event === undefined) {
      this.#handlers.clear();
      return this;
    }
    assertEventName(event);
    this.#handlers.delete(event);
    return this;
  }

  /** 调试用：某个事件当前有几个订阅者 */
  listenerCount(event) {
    return this.#handlers.get(event)?.size ?? 0;
  }

  /** 调试用：列出所有已注册的事件名 */
  eventNames() {
    return [...this.#handlers.keys()];
  }
}

/** 事件名校验：抽出来复用，避免每个方法里都写一遍 */
function assertEventName(event) {
  if (typeof event !== 'string' || event.trim() === '') {
    throw new TypeError('事件名必须是非空字符串');
  }
}

const bus = new EventBus();

// ---- on：基本订阅 ----
const logOrder = (order) => console.log(`  [订单服务] 收到支付成功事件：${order.id} / ¥${order.amount}`);
const logAudit = (order) => console.log(`  [审计服务] 记录：${order.id}`);
bus.on('order:paid', logOrder);
bus.on('order:paid', logAudit);
console.log('order:paid 的订阅者数量：', bus.listenerCount('order:paid'));

console.log('-- emit 一次 --');
console.log('本次实际调用了', bus.emit('order:paid', { id: 'A-1', amount: 299 }), '个处理函数');

// ---- Set 去重：同一个函数注册两次也只存一份 ----
bus.on('order:paid', logOrder);
console.log('重复 on 同一个函数后，订阅者数量仍为：', bus.listenerCount('order:paid'));

// ---- 返回的退订函数 ----
const unsubscribe = bus.on('user:login', (u) => console.log(`  [登录] ${u.name}`));
bus.emit('user:login', { name: '张三' });
unsubscribe(); // 不用记事件名，直接调返回值
console.log('退订后 user:login 订阅者数量：', bus.listenerCount('user:login'));

// ===========================================================================
// 2. once：只触发一次
// ===========================================================================

console.log('\n--- 2. once：只触发一次 ---');

let onceCallCount = 0;
bus.once('app:ready', (payload) => {
  onceCallCount += 1;
  console.log(`  [一次性初始化] 第 ${onceCallCount} 次被调用，payload =`, payload);
});

console.log('第 1 次 emit：', bus.emit('app:ready', { v: '1.0' }), '个函数被调用');
console.log('第 2 次 emit：', bus.emit('app:ready', { v: '1.1' }), '个函数被调用（once 已自动退订）');
console.log('结论：once 总共只执行了', onceCallCount, '次');

// once 与 off 配合：注册一个 once 后，用原函数就能退订掉它
const neverCalled = () => console.log('  （这行不应该出现）');
bus.once('never:event', neverCalled);
console.log('once 注册后，订阅者数量：', bus.listenerCount('never:event'));
console.log('用原函数 off 掉 once，返回值：', bus.off('never:event', neverCalled));
console.log('退订后订阅者数量：', bus.listenerCount('never:event'));
bus.emit('never:event'); // 不会打印任何东西

// ===========================================================================
// 3. once 的实现原理拆解（为什么需要 wrapper.listener）
// ===========================================================================

console.log('\n--- 3. once 的实现原理：为什么需要 wrapper.listener ---');

console.log(`如果 once 直接把原函数存进 Set，会发生什么？

  错误实现：
    once(event, fn) {
      const wrapper = (...a) => { this.off(event, fn); return fn(...a); };  // ✗ 删的是 fn
      this.on(event, wrapper);
    }
  问题：Set 里存的是 wrapper，off(event, fn) 要删的是 fn —— 永远删不掉，
        于是"只执行一次"失效（因为 fn 还在集合里）。

  正确实现：
    wrapper.listener = fn;              // ← 在 wrapper 上记录原函数
    once 里 off 传的是 wrapper（内部能拿到自己的引用）；
    对外暴露的 off(event, fn) 则遍历集合，找 h.listener === fn 的那个 wrapper。

  这也是为什么很多库的 off 实现里会有一段"遍历查找"的代码 ——
  统一处理"用户手里拿的是原函数，而集合里存的是包装函数"这种情况。`);

// ===========================================================================
// 4. off 的三个边界
// ===========================================================================

console.log('\n--- 4. off 的三个边界情况 ---');

// 边界 1：退订一个从未注册过的事件
console.log('[边界 1] off 未注册的事件，返回：', bus.off('nobody:listens', () => {}));
console.log('        设计选择：返回 false 而不是抛错。因为组件卸载时的清理代码');
console.log('        常常"无脑全调一遍 dispose()"，抛错会把清理变成新的崩溃点。');

// 边界 2：退订一个在该事件下没注册过的函数（但事件本身存在）
const stranger = () => {};
console.log('[边界 2] 事件存在但函数没注册过，返回：', bus.off('order:paid', stranger));
console.log('        同样是 false，不抛错 —— off 应当是幂等的。');

// 边界 3：用箭头函数注册，然后想用"长得一样"的另一个箭头函数退订
bus.on('trap:event', () => console.log('  （trap 回调）'));
bus.off('trap:event', () => {}); // 这是另一个函数对象！
console.log('[边界 3] 用"看起来一样"的新箭头函数退订，返回：', bus.off('trap:event', () => {}));
console.log('        当前 trap:event 订阅者数量：', bus.listenerCount('trap:event'), '（没删掉）');
console.log('        原因：JS 里函数按引用比较，(a)=>{} !== (a)=>{}。');
console.log('        正确做法：把回调存进变量，再 off 这个变量，或用 on 的返回值退订。');
bus.clear('trap:event'); // 收尾清理

// ===========================================================================
// 5. 通配符监听
// ===========================================================================

console.log('\n--- 5. 通配符监听 ---');

const wildcardBus = new EventBus();
// '*' 监听所有事件（适合做调试日志、埋点上报）
wildcardBus.on('*', (payload, meta) => {
  console.log(`  [全局日志] 任意事件：`, meta.event, '->', payload);
});
// '前缀:*' 监听某一族事件（适合做"订单相关的所有事件"这类聚合）
wildcardBus.on('order:*', (payload) => {
  console.log(`  [订单聚合] 订单族事件：`, payload);
});

// 注意通配符处理函数的签名：(...原始参数, meta)。
// meta = { event } 是 EventBus 额外追加的**最后一个参数**，
// 因为通配符订阅者必须知道"自己是被哪个事件唤醒的"。
// 而精确订阅者不会收到 meta —— 它已经知道自己订阅的是谁。
wildcardBus.emit('user:login', { name: '李四' });
wildcardBus.emit('order:created', { id: 'B-9' });
wildcardBus.emit('order:shipped', { id: 'B-9' });
console.log(`（实现细节：emit 内部把目标分成"精确匹配"和"通配符"两类，
  只给后者追加 meta。这也是为什么真实库的 emit 实现往往比看起来长一点。）`);

// ===========================================================================
// 6. 异常隔离：一个订阅者挂掉不能影响其他人
// ===========================================================================

console.log('\n--- 6. 异常隔离 ---');

const riskyBus = new EventBus();
riskyBus.on('data', () => console.log('  [A] 正常处理'));
riskyBus.on('data', () => {
  // 故意抛错：模拟业务代码里的 bug
  const config = undefined;
  return config.value.deep;
});
riskyBus.on('data', () => console.log('  [C] 依然被调用（没有被 B 的错误影响）'));
riskyBus.on('data', () => {
  throw new Error('另一个故意抛出的错误');
});
riskyBus.on('data', () => console.log('  [E] 也依然被调用'));

console.log(`调用了 ${riskyBus.emit('data', {})} 个成功返回的处理函数（共 5 个订阅者）`);
console.log(`对比：如果不做隔离，B 抛错会让 C、D、E 全部收不到事件 ——
  单个订阅者的问题会扩散成"整个事件静默失效"的全局故障。`);

// ===========================================================================
// 7. 异步事件：setTimeout 场景（进程可正常退出）
// ===========================================================================

console.log('\n--- 7. 异步事件（setTimeout 演示） ---');

/**
 * 真实项目里事件常常是异步到达的（网络回调、定时器、用户操作）。
 * 这里用 setTimeout 模拟"事件异步到达"，注意我们**不使用 setInterval**，
 * 因为未清理的 interval 会让 Node 进程永远不退出。
 * setTimeout 执行完就结束了，进程能正常退出。
 */
const asyncBus = new EventBus();
let received = 0;

asyncBus.on('tick', (n) => {
  received += 1;
  console.log(`  [异步订阅者] 收到 tick #${n}`);
});

// 用 Promise 包一层，把"异步事件"变成可 await 的流程，代码比回调嵌套清晰得多
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 顺序发出 3 个异步事件，每个间隔 0 毫秒（只是让出事件循环，不引入真实延时）
for (const n of [1, 2, 3]) {
  setTimeout(() => asyncBus.emit('tick', n), 0);
}
// 等待所有定时器跑完（这里用 setTimeout 本身的顺序保证：0ms 排在 4 个之后）
await wait(10);
console.log(`异步事件全部处理完毕，共收到 ${received} 次`);

// 退订后再发一个，验证异步场景下 off 依然生效
const offTick = asyncBus.on('tick', () => console.log('  [这个订阅者会被退订]'));
offTick();
setTimeout(() => asyncBus.emit('tick', 4), 0);
await wait(10);
console.log(`退订后总数仍为 ${received}（第 4 次没有被那个已退订的订阅者收到）`);

// ===========================================================================
// 8. 代价与什么时候不该用
// ===========================================================================

console.log('\n--- 8. 发布订阅的代价与不适用场景 ---');

console.log(`【代价】
  1) 事件名是"字符串契约"：拼错不报错、改名无提示、重构工具帮不上忙。
     TS 里用 'a' | 'b' 的联合类型能大幅缓解，但纯 JS 项目只能靠约定 + 常量表。
  2) 控制流被切断：emit 之后代码就往下走了，谁在处理、处理多久完全看不见。
     一个 5 层的事件链，排查问题要跨越 5 个文件。
  3) 顺序不可控：订阅顺序、同步/异步混用（一会儿同步 emit 一会儿 setTimeout emit）
     会让"看起来一样"的两段代码行为不同。
  4) 内存泄漏：忘记 off 的回调连同其闭包变量一起被总线持有，
     在单页应用里是"越用越卡"的经典原因。
  5) 全局总线是隐式的全局状态：谁都能 emit、谁都能 on，
     等于把耦合从"代码里看得见的 import"搬到了"运行时看不见的字符串"。

【什么时候不该用】
  1) 调用关系固定且只有一条路径：直接调用函数/方法，可读性高得多，
     还拿得到返回值。
  2) 需要返回值：事件是单向通知，天然拿不到结果；
     硬要回传就得"再发一个事件"，把简单调用变成两段式。
  3) 需要强一致的顺序与事务：事件是"尽力而为"的，
     要保证顺序/原子性请用队列 + 事务，而不是事件总线。
  4) 跨进程/跨服务：进程内的 EventBus 出了本进程就没了，
     那种场景要上真正的消息队列（Kafka/RabbitMQ/Redis Pub/Sub）。

判断口诀：当你发现自己在写
    bus.emit('a');  ... 50 行后 ...  bus.on('a', ...)
并且要靠注释才能说明"这两个是配套的"，就说明这个事件用错了地方 ——
  它们本来应该是**一次函数调用**。事件适合"一对多且消费者不确定"的场景。`);

console.log('\n全部演示完毕。');
