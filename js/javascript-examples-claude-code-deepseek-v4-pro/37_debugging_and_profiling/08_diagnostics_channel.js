/**
 * ============================================================================
 * 知识点：node:diagnostics_channel —— 库与使用方之间的"按需诊断通道"
 * ============================================================================
 *
 * 【所属分类】37_debugging_and_profiling —— 调试与性能剖析
 * 【难度等级】高级
 * 【前置知识】26_node_core/07_events_eventemitter.js、18_async/05_async_local_storage.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:diagnostics_channel 是一条**按名字寻址的、单向的、可选的**消息通道：
 *      · 库（发布方）只管往某个**名字**上 publish 诊断事件；
 *      · 使用方（订阅方）只管按**同一个名字** subscribe；
 *      · 双方**互不认识**，不需要在 API 上做任何约定，也不需要互相 import。
 *    名字是全局字符串命名空间，习惯写成 `<库名>:<对象>:<动作>`，
 *    例如 `undici:request:create`、`db.query:start`。
 *    它是 Node 从 15.1 起就内置的模块，**零依赖**。
 *
 * 2. 为什么需要（真实项目场景）
 *    库的作者会遇到一个两难：这个库内部有很多值得观测的时刻（一次请求、一次
 *    查询、一次序列化），但：
 *      · 用 console.log 打？库不该决定使用方的日志策略，线上还关不掉；
 *      · 暴露一个 EventEmitter？就得给使用方一个对象、一套 API、一份文档，
 *        而 99% 的使用方根本不关心 —— 这是纯粹的 API 污染；
 *      · 加个 onQuery 回调参数？侵入业务 API，而且只能挂一个监听者；
 *      · 依赖某个 APM SDK？库不该替使用方选监控厂商。
 *    diagnostics_channel 的答案是：**发布方按名字广播，谁想听谁自己订阅**。
 *    真实案例：
 *      · undici（Node 内置 fetch 的底层实现）：undici:request:create /
 *        :headers / :complete 等一整套通道，让你能观测每一条 HTTP 请求；
 *      · mysql2、pg 等数据库驱动：连接、查询相关的事件；
 *      · Node 自身的 http / net / worker 内部也大量使用它。
 *    一句话：**它把"可观测性"从库的公开 API 里彻底解耦出去。**
 *
 * 3. 核心语法要点
 *    (1) 取通道
 *          import dc from 'node:diagnostics_channel';
 *          const channel = dc.channel('db.query');
 *        同名通道**全局唯一**：任何地方 dc.channel('db.query') 拿到的都是同一个
 *        对象（内部用弱引用缓存，没人引用时会被 GC 回收）。
 *    (2) 订阅 / 退订 / 发布
 *          channel.subscribe((message, name) => {})   // 同步回调，参数是消息与通道名
 *          channel.unsubscribe(listener)              // 必须传**同一个函数引用**
 *          channel.publish(message)                   // 同步地把消息发给所有订阅者
 *          channel.hasSubscribers                     // 布尔：这个通道当前"活跃"吗
 *        模块级简写（不必先拿通道对象）：
 *          dc.subscribe(name, listener) / dc.unsubscribe(name, listener)
 *          dc.hasSubscribers(name)
 *    (3) hasSubscribers —— 整个模块**最重要**的一个属性：
 *        发布方在**构造消息对象之前**先问一句"有人在听吗"，没人听就整段跳过。
 *        这才是"零开销"的真正含义：不是 publish 便宜，而是你可以连
 *        "为发布而做的准备工作"都省掉（序列化、取时间戳、拼字符串、算长度……）。
 *        没有它，库就得先把诊断数据构造好，再发现没人要 —— 那是纯浪费。
 *    (4) bindStore / runStores —— 与 AsyncLocalStorage 配合，让追踪 ID 自动贯穿异步链：
 *          channel.bindStore(store[, transform])
 *          channel.runStores(context, fn)     // 让 fn 及它的异步延续都处在 store 上下文里
 *        典型用法：门面层（或追踪组件）把 requestId 放进上下文，库内部的深层代码
 *        以及订阅者都能用 store.getStore() 取到它，不必一层层当参数传。
 *    (5) tracingChannel(name) —— 把"开始/结束/异步开始/异步结束/出错"打包成一组：
 *          const tc = dc.tracingChannel('db.query');
 *          tc.subscribe({ start, end, asyncStart, asyncEnd, error })
 *          tc.traceSync(fn, context) / tracePromise(fn, context) / traceCallback(...)
 *        undici 用的就是这套；它比手写两个通道更不容易漏事件。
 *
 * 4. 常见陷阱（★ 的几条是读 Node 源码 + 实测确认过的，文档里往往没写）
 *    陷阱 1：**订阅者抛异常会变成未捕获异常**（默认直接把进程干掉）。publish 内部
 *            用 try/catch 抓住后丢给 triggerUncaughtException，**不会**影响发布方
 *            这一次调用，但最终会让进程崩溃。订阅者必须自己 try/catch。
 *    陷阱 2：**publish 是同步的**。订阅者做的每一件事都算在发布方（你的业务请求）
 *            的耗时里。别在订阅者里做磁盘 I/O、网络请求、或者 console.log 大对象。
 *    陷阱 3：以为"没人订阅时 publish 也很快，所以随便发"。真正的开销在**你为发布
 *            准备数据的那段代码**，一定要用 hasSubscribers 包起来。
 *    陷阱 4：unsubscribe 传了一个"长得一样"的新函数。监听器按引用比较，传新函数
 *            等于没退订（还会一直持有旧闭包）。而且 subscribe **不去重**：
 *            同一个函数订阅两次，publish 时会被调用两次。
 *    陷阱 5：★ 给通道 **bindStore 之后，hasSubscribers 就不再表示"有人订阅"了**。
 *            Node 把"绑定了 store"也计入活跃计数（因为它需要让通道保持激活状态，
 *            runStores 才能生效），于是这个通道的 hasSubscribers 恒为 true。
 *            后果：同一个通道上"先绑 store、再用 hasSubscribers 省开销"是不成立的。
 *    陷阱 6：★ **runStores 会把 context 对象本身 publish 出去**（源码里就是
 *            `run = () => { this.publish(data); return fn(...) }`）。所以订阅者会
 *            额外收到一条"上下文消息"，你的消息处理器必须能容忍不认识的形状。
 *    陷阱 7：把诊断通道当成业务事件总线。它没有背压、没有重试、没有送达保证
 *            （没人订阅就什么都没有），而且全进程同名共享。
 *    陷阱 8：在订阅者里对同一个通道再 publish（自己触发自己）—— 同步递归，
 *            很容易爆栈。要转发就换个通道名。
 *    陷阱 9：runStores 的回调**不接收任何参数**（实测 arg 是 undefined），
 *            上下文只在 store.getStore() 里。
 *    陷阱 10：订阅后忘了 unsubscribe。长生命周期对象（连接池、定时器）被闭包一直
 *            引用着，就是一条稳定的内存泄漏曲线。
 *
 * 【关于本示例的运行方式（重要）】
 *    全程在**单文件内**完成：自己写一个"模拟数据库客户端"当作第三方库，自己写
 *    订阅方。不发任何网络请求、不写磁盘；所有"数据库往返"都用 setImmediate /
 *    setTimeout 模拟，延迟写死，因此输出稳定可复现。
 *    "零开销"用**构造次数计数器**证明而不是计时 —— 计数是确定性的，计时不是。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 37_debugging_and_profiling/08_diagnostics_channel.js
 *
 * 【预期输出】
 *   打印 7 个小节：诊断通道解决的问题与方案对比、基础 API 实操、
 *   hasSubscribers 的零开销证明、模拟数据库客户端的慢查询订阅演示、
 *   bindStore + AsyncLocalStorage 让追踪 ID 贯穿异步链（含两个实测陷阱）、
 *   tracingChannel 五件套、常见陷阱与检查清单。
 * ============================================================================
 */

import dc from 'node:diagnostics_channel';
import { AsyncLocalStorage } from 'node:async_hooks';

const SCRIPT_START = Date.now();

function section(n, title) {
  console.log(`\n--- ${n}. ${title} ---`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ===========================================================================
// 以下整块扮演"**第三方库**"的角色。
// 请想象它写在 node_modules/some-db-client/index.js 里 ——
// 它不知道、也不关心谁会订阅自己的诊断通道。
// ===========================================================================

const QUERY_CHANNEL_NAME = 'demo-db:query';

// dc.channel(name)：拿到（必要时创建）这个全局唯一的通道对象。
// 通道对象本身极便宜 —— Node 内部先给它一个"全是空操作"的壳，
// 直到真有订阅者/真有 store 绑定，才把它换成真正的实现（源码里的
// ActiveChannel / Channel 两个类 + markActive/maybeMarkInactive 切换）。
const queryChannel = dc.channel(QUERY_CHANNEL_NAME);

// 异步上下文容器。**先声明、第 5 节才绑定到通道上** ——
// 没绑定之前，它只是个普通的 AsyncLocalStorage，runStores 完全不碰它。
const queryChannelStore = new AsyncLocalStorage();

// 库内部的两个计数器 —— 只为教学演示，真实的库不会有它们。
let traceSeq = 0;
let detailBuildCount = 0; // 统计"为了发布而构造过多少次诊断对象"

/** 模拟一次数据库往返。
 *  · delayMs <= 0：用 setImmediate，实测约 0.1ms —— 代表走了索引的快查询；
 *  · delayMs > 0 ：用 setTimeout。⚠ Windows 上定时器粒度约 15.6ms，
 *    传 5 也会实打实等上 15ms —— 这正是下面把慢查询阈值定在 30ms 的原因。 */
function simulateIo(delayMs) {
  return delayMs > 0 ? sleep(delayMs) : new Promise((resolve) => setImmediate(resolve));
}

/** 创建一个客户端。返回的对象就是"库的公开 API"，注意它一个诊断相关的参数都没有。 */
function createDbClient() {
  return {
    /**
     * @param {string} sql        要执行的 SQL
     * @param {number} latencyMs  模拟的数据库往返耗时（真实场景由数据库决定）
     */
    async query(sql, latencyMs = 0) {
      const startedAt = performance.now();
      const traceId = `req-${(traceSeq += 1)}`;

      // 查询主体。包成函数是为了让 runStores 能把整个异步过程纳入上下文。
      const runQuery = async () => {
        // ★ 核心模式：先问"有人在听吗"，再决定要不要为发布做准备工作。
        //   少了这一行，下面拼对象、取时间戳全都白干。
        if (queryChannel.hasSubscribers) {
          detailBuildCount += 1;
          queryChannel.publish({ phase: 'start', sql, traceId, startedAt });
        }

        await simulateIo(latencyMs); // 模拟一次数据库往返

        const durationMs = performance.now() - startedAt;
        // 结尾再问一次：中途被退订了就不再发（真实库也是这么做的）
        if (queryChannel.hasSubscribers) {
          detailBuildCount += 1;
          queryChannel.publish({
            phase: 'end',
            sql,
            traceId,
            startedAt,
            durationMs,
            rowCount: sql.length, // 假装返回了这么多行
          });
        }
        return { rowCount: sql.length };
      };

      // runStores(context, fn)：让 { traceId, sql } 成为这次异步过程的上下文。
      // 注意：**没有任何 store 被绑定时，这一行就是一个普通函数调用**（零成本）；
      // 一旦有 store 绑上来，它就成了"追踪 ID 自动贯穿"的关键。
      return queryChannel.runStores({ traceId, sql }, runQuery);
    },
  };
}

// ===========================================================================
// 主流程：扮演"使用方"
// ===========================================================================

// ---------------------------------------------------------------------------
section(1, '它解决的问题：库想发诊断事件，又不该绑架使用方');
// ---------------------------------------------------------------------------

console.log('假设你写了一个数据库客户端库，想让使用方能够观测每条 SQL 的耗时。');
console.log('可选方案只有下面几种，各有各的代价：');
console.log('');
console.log('  方案                    库要付出什么                使用方要付出什么          没人用时');
console.log('  ' + '-'.repeat(98));
console.log('  打 console.log          自己决定日志格式与级别      只能忍受或改库源码        白打印，线上关不掉');
console.log('  暴露 EventEmitter       公开一个对象 + 一套事件名   必须拿到那个对象          事件机制本身的开销');
console.log('  API 上加 onQuery 回调   侵入业务 API               只能挂一个监听者          回调判断的开销');
console.log('  依赖某个 APM SDK        替使用方选了监控厂商       必须用同一个 SDK          依赖成本');
console.log('  diagnostics_channel     往一个**名字**上发          按同一个名字订阅          一次布尔判断');
console.log('');
console.log('它和 EventEmitter 最本质的区别是**耦合方向**：');
console.log('  · EventEmitter 是"库给你一个对象，你去挂监听" —— 对象与 API 绑定；');
console.log('  · diagnostics_channel 是"库往全局名字空间广播，你去订阅这个名字" ——');
console.log('    双方连面都不用见，库的 API 上一个字都不用改。');
console.log('');
console.log('业界已经在用的例子：');
console.log('  · undici（内置 fetch 的底层）：undici:request:create / :headers / :complete …');
console.log('  · mysql2 / pg 等驱动：连接、查询相关通道；');
console.log('  · Node 自身的 http / net / worker 内部模块也在发，多数没写进文档。');

// ---------------------------------------------------------------------------
section(2, '基础 API：channel / subscribe / unsubscribe / publish');
// ---------------------------------------------------------------------------

const demoChannel = dc.channel('demo-basic:ping');
console.log(`dc.channel('demo-basic:ping').name = ${demoChannel.name}`);
console.log(`同名拿到的是同一个对象吗 = ${dc.channel('demo-basic:ping') === demoChannel}`);
console.log(`刚创建时 hasSubscribers = ${demoChannel.hasSubscribers}（没人订阅）`);
console.log(`没人订阅时 publish() 会报错吗 = 不会，它就是把消息丢掉`);

// 订阅者签名是 (message, name)：第一个是发布方给的消息，第二个是通道名。
// 一个通道可以有多个订阅者，publish 时**按订阅顺序**依次同步调用。
const received = [];
const firstListener = (message, name) => {
  received.push(`[订阅者 A] 通道=${name} 收到=${JSON.stringify(message)}`);
};
const secondListener = (message) => {
  received.push(`[订阅者 B] 收到=${JSON.stringify(message)}`);
};

demoChannel.subscribe(firstListener);
demoChannel.subscribe(secondListener);
console.log(`订阅两个监听器后 hasSubscribers = ${demoChannel.hasSubscribers}`);
demoChannel.publish({ n: 1 });
demoChannel.publish({ n: 2 });
received.forEach((line) => console.log('  ' + line));
console.log('  => 两次 publish，每个订阅者各收到 2 条；回调是**同步**执行的（陷阱 2）。');

// 退订：必须传**同一个函数引用**（陷阱 4）；退订成功返回 true，没找到返回 false。
demoChannel.unsubscribe(firstListener);
demoChannel.publish({ n: 3 });
console.log(`  退订 A 后再 publish：A 收到 ${received.filter((l) => l.startsWith('[订阅者 A]')).length} 条，B 收到 3 条`);
console.log('  => 按引用比较，传一个"长得一样"的新函数是退不掉的。');
console.log(`  退订 B 的返回值 = ${demoChannel.unsubscribe(secondListener)}，此时 hasSubscribers = ${demoChannel.hasSubscribers}`);

// 模块级简写：不拿通道对象也能订阅，适合"我只想临时看一眼"的场景。
const moduleLevelSeen = [];
dc.subscribe('demo-basic:ping', (message, name) => {
  moduleLevelSeen.push(`${name} -> ${JSON.stringify(message)}`);
  console.log(`  [模块级订阅] ${moduleLevelSeen[moduleLevelSeen.length - 1]}`);
});
dc.channel('demo-basic:ping').publish({ viaModuleLevel: true });
console.log(`  dc.hasSubscribers('demo-basic:ping') = ${dc.hasSubscribers('demo-basic:ping')}`);
// 反面教材：退订时传了一个新的函数引用，什么都没退掉。
dc.unsubscribe('demo-basic:ping', () => {});
console.log(`  传错引用后 hasSubscribers 仍然是 ${dc.hasSubscribers('demo-basic:ping')}（这就是陷阱 4）`);
console.log('  （后面不再使用这个通道，留着它带着一个订阅者不影响其它演示。）');

// ---------------------------------------------------------------------------
section(3, 'hasSubscribers：为什么它比 EventEmitter 更适合库');
// ---------------------------------------------------------------------------

console.log('"零开销"不是指 publish 本身快，而是指**发布方可以跳过所有准备工作**：');
console.log('');
console.log('  没有 hasSubscribers 时，库只能这么写：');
console.log('      const detail = { sql, params, 时间戳, 耗时, 行数, 连接信息, ... };  // 先花钱构造');
console.log('      channel.publish(detail);                                          // 再发现没人要');
console.log('');
console.log('  有了 hasSubscribers：');
console.log('      if (channel.hasSubscribers) channel.publish({ ... });             // 一次布尔判断');
console.log('');
console.log('  差别在"构造"这一步：真实场景里它可能是 JSON 序列化、protobuf 编码、');
console.log('  取连接池状态、算哈希 —— 都很贵，而且是每条 SQL 都要做一次。');
console.log('  下面用**计数器**证明（不用计时 —— 计数是确定性的，计时不是）：');

const client = createDbClient();
const QUIET_QUERIES = [
  'select 1',
  'select * from users where id = ?',
  'select count(*) from orders',
];

for (const sql of QUIET_QUERIES) {
  await client.query(sql);
}
console.log('');
console.log(`  无订阅者时跑了 ${QUIET_QUERIES.length} 条查询，诊断对象的构造次数 = ${detailBuildCount}`);
console.log('  => 一次都没有构造，库只付出了一个 hasSubscribers 的判断。');
console.log('');
console.log('更彻底的是：**连通道对象本身都是懒加载的**。Node 源码里，一个从没被订阅过、');
console.log('也没绑定过 store 的通道，拿到的只是一个"所有方法都是空操作"的壳；');
console.log('直到真的有订阅者出现，才会被换成真正的实现（markActive）。');

// ---------------------------------------------------------------------------
section(4, '完整演示：模拟数据库客户端发布查询事件，使用方订阅慢查询');
// ---------------------------------------------------------------------------

console.log(`库发布的通道名是 "${QUERY_CHANNEL_NAME}"，每条查询发两个事件：`);
console.log('  · phase = "start"：查询开始，带 sql / traceId / 起始时间');
console.log('  · phase = "end"  ：查询结束，额外带 durationMs / rowCount');
console.log('使用方只要订阅这一个通道，就能同时拿到"开始"和"结束"。');
console.log('');

const SLOW_MS = 30; // 慢查询阈值（真实项目从配置读；这里定在 30ms，见下文说明）

const report = { startCount: 0, endCount: 0, totalMs: 0, unknown: 0, slow: [] };

// 订阅者：只做**轻量**的事 —— 累加计数、存进数组。
// 绝不在这里写日志文件、发 HTTP、或者 console.log 大对象（陷阱 2）。
function onQuery(message) {
  if (message.phase === 'start') {
    report.startCount += 1;
    return;
  }
  if (message.phase !== 'end') {
    // 第 5 节会解释：runStores 会把上下文对象也发过来，订阅者要能容忍这种消息。
    report.unknown += 1;
    return;
  }

  report.endCount += 1;
  report.totalMs += message.durationMs;
  if (message.durationMs >= SLOW_MS) {
    // 从异步上下文里取追踪 ID —— 第 5 节的主角，这里先让它露个面。
    const ctx = queryChannelStore.getStore();
    report.slow.push({
      traceId: ctx?.traceId ?? '(无上下文)',
      sql: message.sql,
      durationMs: message.durationMs,
    });
  }
}

queryChannel.subscribe(onQuery);
console.log(`  已订阅。此刻 hasSubscribers = ${queryChannel.hasSubscribers}`);
console.log('');

// 打一批查询。延迟写死，保证每次运行的结论都一样：
// 其中 "select * from big_table" 故意慢，会命中慢查询阈值。
const WORKLOAD = [
  ['select 1', 0],
  ['select * from users where id = ?', 0],
  ['select * from big_table order by created_at desc', 60], // 故意慢
  ['insert into audit_log values (...)', 0],
  ['select count(*) from orders', 0],
];

for (const [sql, latency] of WORKLOAD) {
  await client.query(sql, latency);
}

console.log('  使用方收到的报告：');
console.log(`    start 事件 ${report.startCount} 条，end 事件 ${report.endCount} 条`);
console.log(`    平均耗时约 ${(report.totalMs / report.endCount).toFixed(1)}ms（量级，与机器有关）`);
console.log(`    慢查询（>= ${SLOW_MS}ms）${report.slow.length} 条：`);
for (const item of report.slow) {
  console.log(`      ${item.traceId}  ${item.durationMs.toFixed(1)}ms  ${item.sql}`);
}
console.log('');
console.log(`  为什么阈值取 ${SLOW_MS}ms：快查询走 setImmediate（亚毫秒），慢查询走`);
console.log('  setTimeout(60)。Windows 的定时器粒度约 15.6ms，阈值取小了会被粒度噪声误伤。');
console.log('  traceId 此刻还是"(无上下文)" —— 因为还没人绑定 store，下一节补上。');

// 退订：验证"退订之后事件真的不再产生"。
console.log('');
queryChannel.unsubscribe(onQuery);
const constructedBefore = detailBuildCount;
const endsBefore = report.endCount;
await client.query('select 1');
console.log('  已退订，再跑一条查询：');
console.log(`    诊断对象构造次数 ${constructedBefore} -> ${detailBuildCount}（没变）`);
console.log(`    订阅者收到的 end 事件数 ${endsBefore} -> ${report.endCount}（也没变）`);
console.log('  => 退订之后发布方立刻回到"零开销"状态。');
console.log(`  此时 hasSubscribers = ${queryChannel.hasSubscribers}`);

// ---------------------------------------------------------------------------
section(5, '进阶：bindStore + AsyncLocalStorage —— 追踪 ID 自动贯穿异步链');
// ---------------------------------------------------------------------------

console.log('问题：你希望"这条请求触发的所有 SQL 日志都带上 requestId"。');
console.log('传统做法是把 requestId 一层层当参数传下去 —— 库的内部实现凭什么要');
console.log('接受一个它自己用不上的参数？');
console.log('');
console.log('diagnostics_channel 的答案是把它接到异步上下文上：');
console.log('  ① 谁关心上下文，谁来绑定一个 AsyncLocalStorage：');
console.log('       channel.bindStore(store[, transform])');
console.log('     · 不带 transform：store 的值就是 runStores 的第一个参数本身；');
console.log('     · 带 transform：store 的值是 transform(那个参数) 的返回值（本示例用它）；');
console.log('  ② 库在"处理一次查询"的外层调用 runStores：');
console.log('       channel.runStores(context, fn)');
console.log('     让 context 成为 fn **以及它 await 出来的一切**的异步上下文；');
console.log('  ③ 于是库内部、中间件、订阅者都能读：store.getStore()。');
console.log('');
console.log('注意谁绑 store 很自由：通道是全局的，所以**追踪组件/APM 可以自己绑**，');
console.log('完全不用改库的代码 —— 这正是这套设计想要的效果。');

console.log('');
console.log(`  绑定前：hasSubscribers = ${queryChannel.hasSubscribers}（刚退订过，所以是 false）`);

// 使用方（这里扮演追踪组件）把自己关心的字段映射成上下文对象。
queryChannel.bindStore(queryChannelStore, (context) => ({
  traceId: context.traceId,
  sql: context.sql,
}));

console.log(`  绑定后：hasSubscribers = ${queryChannel.hasSubscribers} ← ★ 注意这里`);
console.log('');
console.log('  ★ 陷阱 5（实测 + 读源码确认）：**绑定了 store 也算"活跃"**。');
console.log('    Node 把 store 也计入活跃计数（因为只有活跃通道上的 runStores 才生效），');
console.log('    所以这个通道的 hasSubscribers 从此恒为 true，哪怕一个订阅者都没有。');
console.log('    后果：**在同一个通道上"先绑 store、再用 hasSubscribers 省开销"是不成立的**。');
console.log('    要保留那个优化，就把 store 绑到另一个专用通道上去。');
console.log('');

// 重新订阅一个"把上下文也打出来"的监听器，观察真实收到的消息。
const rawMessages = [];
const probeListener = (message) => {
  const ctx = queryChannelStore.getStore();
  rawMessages.push({ message, ctx });
};
queryChannel.subscribe(probeListener);

console.log('  绑定 store 后再跑两条查询，看订阅者到底收到了什么：');
await client.query('select * from products where id = ?', 0);
await client.query('select * from big_table where x = ?', 60);

for (const entry of rawMessages) {
  console.log(`    消息 = ${JSON.stringify(entry.message)}`);
  console.log(`      订阅者此刻的 getStore() = ${JSON.stringify(entry.ctx)}`);
}
console.log('');
console.log('  ★ 陷阱 6（读源码确认）：**runStores 会把 context 对象本身 publish 出去**。');
console.log('    源码里就是 `run = () => { this.publish(data); return fn(...) }`。');
console.log('    所以订阅者会额外收到一条"没有 phase、只有 traceId 和 sql"的消息 ——');
console.log('    消息处理器必须能容忍不认识的形状（上面 onQuery 里的 unknown 分支干的就是这件事）。');
console.log('');
console.log('  两条关键观察：');
console.log('    · start/end 消息里的 traceId 来自库自己构造的对象；');
console.log('    · 而"订阅者此刻的 getStore()"能拿到同一个 traceId —— 它不是参数，');
console.log('      是 runStores 建立的异步上下文，在 await 之后依然有效。');

// 直接验证上下文在异步链里的存活范围。
console.log('');
const seen = [];
await queryChannel.runStores({ traceId: 'manual-1', sql: 'manual' }, async () => {
  seen.push(`刚进入时：${JSON.stringify(queryChannelStore.getStore())}`);
  await sleep(5);
  seen.push(`await 之后：${JSON.stringify(queryChannelStore.getStore())}`);
  await (async () => {
    await sleep(5);
    seen.push(`嵌套异步里：${JSON.stringify(queryChannelStore.getStore())}`);
  })();
});
seen.forEach((line) => console.log('    ' + line));
console.log(`  走出 runStores 之后：${JSON.stringify(queryChannelStore.getStore())}（undefined = 上下文只活在那一小段里）`);
console.log('');
console.log('  另一点（陷阱 9）：runStores 的回调**不接收参数**，上下文只在 getStore() 里。');
console.log('  再一点：多个 store 绑定到同一个通道时，runStores 会把它们**嵌套**起来');
console.log('  （源码里对每个 store 各包一层 store.run），所以每个 store 都能读到自己的值。');

// 收尾：退订 + 解绑，把通道还原成"没人关心"的状态。
queryChannel.unsubscribe(probeListener);
console.log('');
console.log(`  退订监听器后：hasSubscribers = ${queryChannel.hasSubscribers}（仍然是 true）`);
const unbound = queryChannel.unbindStore(queryChannelStore);
console.log(`  再 unbindStore 之后：hasSubscribers = ${queryChannel.hasSubscribers}（这才是真正的"没人关心"）`);
console.log(`  unbindStore 的返回值 = ${unbound}（解绑成功返回 true，没绑过返回 false）`);

// ---------------------------------------------------------------------------
section(6, '进阶：tracingChannel —— "开始/结束/异步/出错"五件套');
// ---------------------------------------------------------------------------

console.log('手动发 start + end 两个通道很容易漏（异常分支尤其容易漏）。');
console.log('tracingChannel 把一组相关通道打包成一个对象：');
console.log('  · 五个子通道：start / end / asyncStart / asyncEnd / error');
console.log('  · 一次订阅全部：tc.subscribe({ start, end, asyncStart, asyncEnd, error })');
console.log('  · 三个包装器：traceSync(fn, context) / tracePromise(fn, context) / traceCallback(...)');
console.log('    它们负责在正确的时机替你发事件，出错时补发 error 事件，然后**把错误继续抛出去**。');
console.log('undici 用的就是这套。下面跑一个小例子：');

const batchChannel = dc.tracingChannel('demo-db:batch');
const traceEvents = [];
batchChannel.subscribe({
  start: (message) => traceEvents.push(`start(batchSize=${message.batchSize})`),
  end: (message) => traceEvents.push(`end(batchSize=${message.batchSize}, result=${message.result})`),
  error: (message) => traceEvents.push(`error(batchSize=${message.batchSize}, ${message.error.message})`),
});

// traceSync：把 context 对象发出去，返回值原样返回；出错则补发 error 事件再抛出。
const batchResult = batchChannel.traceSync(() => 42, { batchSize: 3 });
console.log(`  traceSync 的返回值 = ${batchResult}`);
try {
  batchChannel.traceSync(
    () => {
      throw new Error('模拟批次执行失败');
    },
    { batchSize: 1 },
  );
} catch (err) {
  console.log(`  traceSync 把错误照样抛回给了调用者：${err.message}`);
}
console.log(`  订阅者依次收到：${traceEvents.join(' -> ')}`);
console.log('');
console.log('  两个细节：');
console.log('    · context 对象会被**就地补充** —— 正常结束时加 result，出错时加 error，');
console.log('      所以订阅者在 end 事件里能直接读到结果；');
console.log('    · 异步场景用 tracePromise（或 traceCallback），它会额外产生');
console.log('      asyncStart / asyncEnd，把"跨过 await 的那段"也标出来。');
console.log(`  hasSubscribers = ${batchChannel.hasSubscribers}（订阅了它的五个子通道之一即为 true）`);

// ---------------------------------------------------------------------------
section(7, '常见陷阱与检查清单');
// ---------------------------------------------------------------------------

const pitfalls = [
  ['订阅者抛异常 = 未捕获异常', 'publish 会抓住它、但只是延后抛成 uncaughtException，默认把进程干掉'],
  ['publish 是同步的', '订阅者做的事算在发布方的耗时里，只做内存里的轻量收集'],
  ['忘了先判断 hasSubscribers', '真正的开销在"为发布做准备"那一段，不判断就省不掉'],
  ['★ bindStore 让 hasSubscribers 恒为 true', '绑了 store 的通道要另想办法省开销（或者把 store 绑到别的通道）'],
  ['★ runStores 会把 context 也 publish 出去', '订阅者会收到没有业务字段的"上下文消息"，处理器要能容忍'],
  ['unsubscribe 传了新的函数引用', '按引用比较；传错等于没退订，还会一直持有旧闭包'],
  ['subscribe 不去重', '同一个函数订两次，publish 时会被调用两次'],
  ['runStores 回调没有参数', '上下文只能从 store.getStore() 取'],
  ['把诊断通道当业务事件总线', '没有背压/重试/送达保证，且全进程同名共享'],
  ['订阅者里再 publish 同一通道', '同步递归，容易爆栈；要转发就换个通道名'],
  ['订阅后忘了 unsubscribe', '长生命周期对象被闭包一直引用着，就是稳定的内存泄漏'],
  ['通道名随手起', '它是全局命名空间，用 <库名>:<对象>:<动作> 这样的稳定前缀'],
];

console.log('  ' + '坑'.padEnd(40) + '说明');
console.log('  ' + '-'.repeat(98));
for (const [item, why] of pitfalls) {
  console.log('  ' + item.padEnd(38) + why);
}

console.log('');
console.log('什么时候该用它（判断标准很清晰）：');
console.log('  ✅ 库/框架内部"值得观测但默认不需要"的时刻：请求、查询、连接、序列化、重试；');
console.log('  ✅ 你想让使用方**按需**打开观测，而打开前不付任何代价；');
console.log('  ✅ 你想给生态提供一个统一接入点（APM 厂商都去订阅同一批通道名）；');
console.log('  ❌ 业务逻辑事件流（用 EventEmitter）；');
console.log('  ❌ 需要可靠送达、重试、背压的场景（用消息队列）；');
console.log('  ❌ 需要"一定被执行到、甚至能改写行为"的钩子（它不是拦截器）。');
console.log('');
console.log('一句话总结：diagnostics_channel 是**给库作者的可观测性出口**，');
console.log('  它把"要不要观测"的决定权交给使用方，并让没观测时的代价接近于零。');
console.log(`\n本示例总耗时约 ${Date.now() - SCRIPT_START} ms。`);
console.log('示例结束。');
