/**
 * ============================================================================
 * 知识点：node:events —— EventEmitter 事件模型与发布订阅
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】进阶
 * 【前置知识】26_node_core/05_fs_callback.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:events 模块导出 EventEmitter 类，它是 Node.js 事件驱动架构的地基。
 *    核心只有两件事：
 *      · on(name, listener)  订阅：登记"当 name 事件发生时，请调用这个函数"
 *      · emit(name, ...args) 发布：触发 name 事件，依次调用所有登记的监听器
 *    这种"一方只管发、另一方只管收、彼此不认识"的模式叫发布订阅（pub/sub），
 *    它让模块之间可以解耦：HTTP 服务器不需要知道谁在监听请求，
 *    只需要在收到请求时 emit('request') 就够了。
 *
 *    打开 Node 的任意核心模块，几乎都能看到它的身影：
 *      · http.Server  emit('request') / emit('listening')
 *      · net.Socket   emit('data')    / emit('close')
 *      · stream.Readable emit('data') / emit('end')
 *      · process      emit('exit')    / emit('uncaughtException')
 *    它们全部继承自 EventEmitter。
 *
 * 2. 为什么需要
 *    回调只能表达"一件事完成后调用一个函数"，是一对一的。
 *    而现实需求常常是一对多、多对多：
 *      · 用户注册成功后，要发欢迎邮件、写日志、送优惠券、埋点统计
 *      · 一个文件变化要通知多个监听者
 *    用回调就要在注册逻辑里硬编码调用四个函数，加一个需求就得改一次注册逻辑。
 *    用事件则变成"注册逻辑只 emit('user:registered')"，其他模块各自订阅，
 *    新增需求时只加订阅者，不改发布方——这就是"开闭原则"的落地。
 *
 * 3. 核心语法要点
 *    - emitter.on(name, fn)              订阅（别名 addListener）
 *    - emitter.once(name, fn)            只触发一次的订阅，触发后自动移除
 *    - emitter.off(name, fn)             取消订阅（别名 removeListener），必须传**同一个函数引用**
 *    - emitter.emit(name, ...args)       发布事件，返回布尔值表示"有没有监听器被调用"
 *    - emitter.prependListener(name, fn) 插到监听器队列最前面（先执行）
 *    - emitter.removeAllListeners(name?) 移除全部（或某事件的）监听器
 *    - emitter.listenerCount(name)       某个事件的监听器数量
 *    - emitter.listeners(name)           监听器数组的**副本**
 *    - emitter.eventNames()              已注册事件名数组
 *    - emitter.setMaxListeners(n)        调整泄漏告警阈值（默认 10，0 表示不限制）
 *    - events.once(emitter, name)        返回 Promise 的工具函数，await 一个事件
 *    - events.getEventListeners(emitter, name)  静态方法，取监听器副本
 *    - events.errorMonitor              特殊事件名，可在 'error' 触发时抢先介入
 *    - new EventEmitter({ captureRejections: true })  自动捕获 async 监听器的拒绝
 *
 * 4. 常见陷阱
 *    陷阱 1：忘记移除监听器造成内存泄漏。尤其"每次请求都 on 一次"的写法，
 *            监听器会无限增长。Node 在单个事件超过 10 个监听器时会打印
 *            MaxListenersExceededWarning 来提醒你。
 *    陷阱 2：off 必须传**同一个函数引用**。写 emitter.off('x', () => {}) 是无效的，
 *            因为那是一个新函数，身份不同。所以订阅时要把函数存进变量。
 *    陷阱 3：'error' 事件是特殊的。若没有任何监听器，emit('error') 会**直接抛出**异常，
 *            通常导致进程崩溃。这是 Node 的刻意设计：让错误不被静默吞掉。
 *    陷阱 4：emit 是**同步**调用监听器的。emit 返回时所有监听器都已经执行完毕，
 *            因此在监听器里做耗时计算会阻塞 emit 的调用方。
 *    陷阱 5：监听器抛出的异常会中断后续监听器的执行，并向上冒泡到 emit 调用处。
 *    陷阱 6：once 注册的监听器在触发时会先被移除再调用，因此监听器内部再 emit
 *            同一事件不会造成无限递归。
 *    陷阱 7：监听器是按**注册顺序**执行的，但不要依赖这个顺序实现业务逻辑——
 *            那是隐式耦合，一旦有人用 prependListener 就会被打乱。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/07_events_eventemitter.js
 *
 * 【预期输出】
 *   演示订阅/发布、once 只触发一次、off 取消订阅、监听器按序执行、
 *   'error' 事件无监听器时抛异常、监听器泄漏告警的实测，
 *   以及 events.once() 把事件转成 Promise 的用法。
 * ============================================================================
 */

// EventEmitter 既是具名导出，也是默认导出的一部分。
// 这里用具名导入，因为它本身就是这个模块的主角。
import { EventEmitter, once, getEventListeners, listenerCount, errorMonitor } from 'node:events';

// ---------------------------------------------------------------------------
// 1. 最小可用的发布订阅
// ---------------------------------------------------------------------------

console.log('--- 1. 最小可用的发布订阅 ---');

// 直接实例化一个 emitter。
// 实际项目中更常见的做法是让业务类继承 EventEmitter：
//   class OrderService extends EventEmitter { ... }
class OrderService extends EventEmitter {}

const orders = new OrderService();

// on(name, listener)：订阅。可以给同一个事件注册任意多个监听器。
// 事件名只是一个字符串，用 'noun:verb' 的命名风格能避免命名冲突。
orders.on('created', (orderId, amount) => {
  console.log(`  [邮件服务] 订单 ${orderId} 创建成功，金额 ${amount} 元`);
});

orders.on('created', (orderId, amount) => {
  console.log(`  [库存服务] 为订单 ${orderId} 锁定商品，金额 ${amount} 元`);
});

// emit(name, ...args)：发布。后面的参数会原样传给每个监听器。
// 返回值是布尔值：true 表示至少有一个监听器被调用了。
const hasListener = orders.emit('created', 'A1001', 199);
console.log('emit 的返回值 =', hasListener, '（true 表示有监听器被调用）');

// 也可以传任意多个参数、任意类型（对象、数组、函数都行）。
orders.on('shipped', (payload) => {
  console.log(`  [物流服务] 订单 ${payload.id} 已发货，运单号 ${payload.trackingNo}`);
});
orders.emit('shipped', { id: 'A1001', trackingNo: 'SF1234567890' });

// 触发一个没人监听的事件：不报错，只是返回 false。
const noListener = orders.emit('refunded', 'A1001');
console.log('emit 无人监听的事件返回值 =', noListener, '（false，但不会报错）');

// ---------------------------------------------------------------------------
// 2. once —— 只触发一次
// ---------------------------------------------------------------------------

console.log('--- 2. once 只触发一次 ---');

const app = new EventEmitter();

// once 注册的监听器在第一次触发后会自动移除。
app.once('ready', () => {
  console.log('  [once] 初始化完成，这行只会打印一次');
});

// 连续触发三次，但只有第一次会调用到 once 注册的监听器。
app.emit('ready');
app.emit('ready');
app.emit('ready');

// 验证：触发后监听器数量已经变回 0。
console.log('  触发三次后 ready 事件的监听器数量 =', app.listenerCount('ready'));

// once 的经典用途：进程退出前只执行一次的清理、连接建立后的首次握手。
// 另外，once 的监听器在触发时会**先移除再调用**，
// 所以监听器内部再 emit 同一事件也不会无限递归（见陷阱 6）。
app.once('ping', () => {
  console.log('  [once 内部递归] ping 触发，我在监听器里又 emit 了一次 ping');
  // 这个 emit 不会再次调用本监听器，因为它已经被移除了。
  app.emit('ping');
});
app.emit('ping');
console.log('  递归 emit 后没有堆栈溢出，说明 once 的移除发生在调用之前。');

// ---------------------------------------------------------------------------
// 3. off —— 取消订阅必须传同一个函数引用
// ---------------------------------------------------------------------------

console.log('--- 3. off 取消订阅 ---');

const bus = new EventEmitter();

// 订阅时把函数存进变量，这是能正确取消订阅的前提。
const onMessage = (text) => console.log('  [常驻监听]', text);

bus.on('message', onMessage);
bus.on('message', (text) => console.log('  [临时监听]', text));

console.log('  订阅后有', bus.listenerCount('message'), '个监听器');
bus.emit('message', '第一次广播');

// 正确取消订阅：传的是同一个函数引用 onMessage。
bus.off('message', onMessage);
console.log('  off 之后还有', bus.listenerCount('message'), '个监听器');
bus.emit('message', '第二次广播（常驻监听已退订）');

// 反面演示：想用"看起来一样"的新函数取消订阅——无效，因为函数身份不同。
bus.on('message', onMessage);
const before = bus.listenerCount('message');
bus.off('message', (text) => console.log('  [常驻监听]', text)); // 这是一个全新的函数
console.log(`  用新函数 off 前后的监听器数量：${before} -> ${bus.listenerCount('message')}（没有变化）`);
console.log('  => 结论：取消订阅必须持有当初登记的那个函数引用。');

// 如果确实只能拿到新函数，可以用 removeAllListeners 或按引用过滤。
bus.removeAllListeners('message');
console.log('  removeAllListeners 后监听器数量 =', bus.listenerCount('message'));

// ---------------------------------------------------------------------------
// 4. 监听器的执行顺序与调度
// ---------------------------------------------------------------------------

console.log('--- 4. 监听器按注册顺序同步执行 ---');

const seq = new EventEmitter();

seq.on('go', () => console.log('  监听器 A'));
seq.on('go', () => console.log('  监听器 B'));
// prependListener 会把监听器插到队列最前面，所以它先执行。
seq.prependListener('go', () => console.log('  监听器 C（prepend，排到了最前面）'));

console.log('  注册顺序是 A、B，然后 prepend 了 C，实际执行顺序：');
seq.emit('go');

// 同步性验证：emit 返回时，监听器已经全部执行完了。
let executed = false;
const sync = new EventEmitter();
sync.on('tick', () => {
  executed = true;
});
sync.emit('tick');
// 这一行紧跟 emit，此时 executed 已经是 true——说明监听器是同步调用的。
console.log('  emit 返回后 executed =', executed, '（emit 是同步的，不是"稍后执行"）');

// 想看监听器清单，用 listeners()（返回的是副本，改它不影响 emitter）
// 或静态方法 getEventListeners。
const eventNames = seq.eventNames();
console.log('  seq 上已注册的事件名：', eventNames.map(String).join(', '));
console.log('  go 事件的监听器个数（静态函数） =', listenerCount(seq, 'go'));
console.log('  getEventListeners 返回的是数组吗：', Array.isArray(getEventListeners(seq, 'go')));

// 一个小陷阱：listeners() 返回的是**副本**，对它做 push 不会增加监听器。
const copies = seq.listeners('go');
copies.pop();
console.log('  对 listeners() 的副本做 pop 后，真实监听器个数仍是：', seq.listenerCount('go'));

// ---------------------------------------------------------------------------
// 5. 'error' 事件：必须有人监听
// ---------------------------------------------------------------------------

console.log("--- 5. 'error' 事件是特殊的 ---");

const risky = new EventEmitter();

// 关键规则：如果没有任何监听器，emit('error') 会**抛出参数里的那个错误**。
// 这是 Node 刻意的设计——错误不应该被静默忽略。
// 因此必须用 try/catch 包住（或者给它加一个监听器）。
try {
  risky.emit('error', new Error('这个错误没有被任何监听器接住'));
} catch (err) {
  console.log('  无监听器时 emit("error") 抛出：', err.message);
  console.log('  => 生产代码里如果不监听 error，这类异常会直接让进程崩溃。');
}

// 加上监听器之后，同样的 emit 就不会抛了。
risky.on('error', (err) => {
  console.log('  [error 监听器] 捕获到：', err.message);
});
const errorHandled = risky.emit('error', new Error('这次有人接住了'));
console.log('  有监听器时 emit("error") 返回值 =', errorHandled, '（没有抛异常）');

// errorMonitor 是一个特殊的事件名常量（从 node:events 导出）：
// 用 emitter.on(errorMonitor, fn) 注册的监听器会在 'error' 监听器**之前**被调用，
// 而且它**不会**消耗错误——'error' 事件照常派发给普通监听器。
// 用途：要统一上报所有错误，又不想干扰业务方的 'error' 处理逻辑。
const monitored = new EventEmitter();
monitored.on('error', (err) => console.log('  [业务监听器] 处理错误：', err.message));
monitored.on(errorMonitor, (err) => console.log('  [监控监听器] 旁路上报：', err.message));
monitored.emit('error', new Error('演示 errorMonitor 的旁路能力'));
console.log('  => 监控监听器先执行，业务监听器随后照常收到同一个错误。');

// ---------------------------------------------------------------------------
// 6. 监听器泄漏警告：MaxListenersExceededWarning
// ---------------------------------------------------------------------------

console.log('--- 6. 监听器泄漏警告 ---');

// Node 无法自动判断"这么多监听器是不是泄漏"，所以设了一个经验阈值：
// 同一个事件超过 10 个监听器时，打印一条 MaxListenersExceededWarning。
// 下面我们主动触发它，并用自己的监听器把警告内容接住。
// 注意：process 的 'warning' 事件是在**稍后**异步派发的，所以要用 Promise 等它。
const warningCaught = new Promise((resolve) => {
  // 只接一次就够了。Node 的默认行为仍会把警告打印到 **stderr**
  //（这也是为什么警告信息会出现在下面的输出里）——这正好说明：
  // 警告走 stderr 而不是 stdout，不会被当成正常输出。
  process.once('warning', (warning) => resolve(warning));
});

const leaky = new EventEmitter();
for (let i = 1; i <= 11; i += 1) {
  // 每次都注册一个**新函数**，模拟"每次请求都 on 一次"的泄漏写法。
  leaky.on('data', () => {});
}
console.log('  已注册 11 个 data 监听器，数量 =', leaky.listenerCount('data'));

// 等警告到达（加一个超时兜底，保证脚本在任何情况下都不会卡住）。
const warning = await Promise.race([
  warningCaught,
  // 300ms 足够警告派发；超时则返回 null 而不是永久等待。
  new Promise((resolve) => setTimeout(() => resolve(null), 300)),
]);

if (warning) {
  console.log('  接到警告：name =', warning.name);
  console.log('  警告摘要：', warning.message.split('\n')[0]);
} else {
  // 理论上不会走到这里，留作兜底。
  console.log('  未收到警告（可能被运行参数过滤了，例如 --no-warnings）。');
}

// 正确的处理方式有两种：
//   1) 真的泄漏了 -> 修代码，别用 setMaxListeners 掩盖问题
//   2) 确实需要很多监听器（如事件总线）-> 显式提高上限
leaky.setMaxListeners(0); // 0 表示不限制
console.log('  setMaxListeners(0) 后上限解除，再多的监听器也不会告警。');

// 用 removeAllListeners 清干净，避免残留影响后续演示。
leaky.removeAllListeners();
console.log('  removeAllListeners 后数量 =', leaky.listenerCount('data'));

// ---------------------------------------------------------------------------
// 7. events.once() —— 把事件变成 Promise
// ---------------------------------------------------------------------------

console.log('--- 7. events.once() 把事件转成 Promise ---');

const server = new EventEmitter();

// once(emitter, name) 返回一个 Promise，等到该事件第一次触发时 resolve。
// resolve 出的是监听器收到的所有参数组成的数组。
// 这样就能用 await 语法处理事件，比回调更符合现代写法。
setTimeout(() => {
  // 模拟"100ms 后服务器就绪"，并带上两个参数。
  server.emit('listening', { port: 3000 }, 'localhost');
}, 50);

// 顶层 await 在这里非常好用：直接等事件，无需嵌套回调。
// 注意 events.once 还有一个很实用的附加行为：
// 如果在等待期间触发了 'error' 事件，这个 Promise 会**拒绝**（reject），
// 所以能用 try/catch 一并处理错误，不需要单独监听 error。
const [info, host] = await once(server, 'listening');
console.log('  await once(server, "listening") 得到：', info, host);

// 演示"等待期间出错会 reject"：这里让 error 在 listening 之前触发。
const failing = new EventEmitter();
setTimeout(() => {
  failing.emit('error', new Error('端口被占用'));
}, 20);

try {
  await once(failing, 'listening'); // 永远不会触发 listening
  console.log('  这行不会被执行');
} catch (err) {
  console.log('  等待中触发 error，await once 抛出：', err.message);
  console.log('  => 这让"等一个事件"也能用 try/catch 干净地处理失败路径。');
}

// ---------------------------------------------------------------------------
// 8. captureRejections —— 让 async 监听器的异常有着落
// ---------------------------------------------------------------------------

console.log('--- 8. captureRejections 捕获 async 监听器异常 ---');

// 监听器可以是 async 函数。但 emit 是同步的，它**不会**等 async 监听器完成，
// 于是 async 监听器里抛出的错误就变成了"没人处理的 Promise 拒绝"。
// 默认情况下这会触发 unhandledRejection，通常让进程崩溃。
//
// new EventEmitter({ captureRejections: true }) 可以让 EventEmitter 自动
// 捕获 async 监听器的拒绝，并把它转成 'error' 事件派发出去。
const safeEmitter = new EventEmitter({ captureRejections: true });

// 记得给 'error' 事件加监听器，否则捕获到的错误会以异常形式抛出（见第 5 节）。
safeEmitter.on('error', (err) => {
  console.log('  [error 监听器] 接住了 async 监听器抛出的错误：', err.message);
});

safeEmitter.on('work', async () => {
  // 模拟一个异步任务失败
  await Promise.resolve();
  throw new Error('异步任务失败了');
});

safeEmitter.emit('work');
console.log('  emit 立刻返回（不等 async 监听器），错误稍后由 error 事件送达。');

// 给事件循环一个机会把上面那个异步拒绝处理掉。
// 用 setTimeout(..., 10) 只等一小会儿，最多让脚本多花 10ms，不影响整体耗时。
await new Promise((resolve) => setTimeout(resolve, 10));
console.log('  => 若没有 captureRejections，这个拒绝会变成未处理的 Promise 拒绝。');

// ---------------------------------------------------------------------------
// 9. 实战：一个最小的事件总线
// ---------------------------------------------------------------------------

console.log('--- 9. 实战：解耦的订单流程 ---');

// 这个例子的重点是：OrderService 完全不知道谁在监听它的内部事件。
// 新增一个"发优惠券"的需求，只需要再 on 一次，不必改动 OrderService 的任何代码。
class OrderWorkflow extends EventEmitter {
  place(order) {
    console.log(`  下单：${order.id}，金额 ${order.amount}`);
    // 把"发生了什么"广播出去，而不是"要做什么"。
    this.emit('order:placed', order);
  }

  cancel(orderId, reason) {
    console.log(`  取消订单：${orderId}`);
    this.emit('order:cancelled', { orderId, reason });
  }
}

const workflow = new OrderWorkflow();

// 订阅方 1：写审计日志
workflow.on('order:placed', (order) => {
  console.log(`    [审计] 记录订单 ${order.id} 于 ${new Date().toISOString().slice(0, 10)}`);
});

// 订阅方 2：给大额订单打标
workflow.on('order:placed', (order) => {
  if (order.amount >= 1000) {
    console.log(`    [风控] 订单 ${order.id} 金额较大，标记为待复核`);
  } else {
    console.log(`    [风控] 订单 ${order.id} 金额正常`);
  }
});

// 订阅方 3：用 once 表示"只关心第一单"的场景（比如首单优惠）
workflow.once('order:placed', (order) => {
  console.log(`    [营销] ${order.id} 是本次会话首单，发放新人券`);
});

// 取消订单的监听器
workflow.on('order:cancelled', ({ orderId, reason }) => {
  console.log(`    [通知] 订单 ${orderId} 已取消，原因：${reason}`);
});

workflow.place({ id: 'B2001', amount: 199 });
console.log('  （注意上面的"首单券"只发一次）');
workflow.place({ id: 'B2002', amount: 2500 });
workflow.cancel('B2002', '用户主动取消');

// 收尾：清理监听器。
// 在长生命周期对象（服务器、连接池）上不清理监听器，是内存泄漏的经典来源。
workflow.removeAllListeners();
console.log('  流程演示结束后已清理全部监听器，数量 =', workflow.eventNames().length);

console.log('--- 全部演示结束 ---');
