/**
 * ============================================================================
 * 知识点：AbortSignal 与流的取消贯通 —— 从 timeout 到 abort 的完整链路
 * ============================================================================
 *
 * 【所属分类】36_realtime_and_streams —— 实时通信与流式处理
 * 【难度等级】高级
 * 【前置知识】36_realtime_and_streams/04_web_streams_readable.js、36_realtime_and_streams/05_web_streams_transform.js、18_async/13_timeout_and_abort.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    18_async/13 讲了 AbortController 的基础用法，03 篇用 `abort()` 掐断过 SSE 连接，
 *    但它们都没有回答真正棘手的问题：**取消信号怎么一路传到流的最末端？**
 *    真实场景是"用户点了取消下载"：
 *      · 要停掉正在进行的 `fetch`；
 *      · 要停掉还没读完的 `response.body`（一个 ReadableStream）；
 *      · 要停掉正在把数据写进目标（文件、另一个流）的 `pipeTo`；
 *      · 还要保证**服务端知道我们走了**，否则它会继续产生数据（资源泄漏）。
 *    本篇把这条链路逐段接通，并打印每一段的实际表现。
 *
 *    完整链路（本文件按这个顺序逐段演示）：
 *
 *      AbortSignal.timeout(ms)        // 来源一：到点自动中止
 *      AbortSignal.any([s1, s2])      // 来源二：把多个 signal 合并成一个
 *      AbortController.abort(reason)  // 来源三：代码/用户主动触发
 *                 │
 *                 ▼
 *      fetch(url, { signal })         // ① 请求阶段：中止则 reject
 *                 │
 *                 ▼
 *      response.body  (ReadableStream)  // ② 读取阶段：reader.read() 会 reject
 *                 │
 *                 ▼
 *      pipeTo(dest, { signal })       // ③ 管道阶段：中止则 reject，且会调用 dest.abort()
 *                 │
 *                 ▼
 *      WritableStream.abort(reason)   // ④ 落地阶段：钩子里释放资源（关文件、回滚、发通知）
 *
 *    关键结论先说出来：**取消不是"让 Promise 别等了"，而是"把信号一路传下去，
 *    让每一层都能释放自己占用的资源"**。18_async/13 讲的 `Promise.race` 超时就是反面教材 ——
 *    它只是"不再等"，底层操作照样在跑。
 *
 * 2. 为什么需要（真实项目场景）
 *    · **用户主动取消**：大文件下载、AI 流式输出点了"停止生成"、上传中途取消。
 *      这是最直接的驱动力 —— 用户点了取消，浏览器却还在跑，等于白烧流量和电。
 *    · **超时保护**：接口必须有超时，否则一个卡住的请求会把连接池、内存、用户耐心全耗光。
 *      `AbortSignal.timeout()` 是标准库给的现成方案，比自己 `setTimeout + abort` 干净得多。
 *    · **总预算（deadline）**：一次业务操作给了 3 秒预算，中间可能调 5 个下游接口，
 *      必须共享同一个"总超时"信号，而不是每个接口各给 3 秒（那样最坏要 15 秒）。
 *      这就是 `AbortSignal.any([总预算, 用户取消])` 的用途。
 *    · **组件卸载 / 页面跳转**：React 的 `useEffect` 清理函数里取消未完成的请求，
 *      否则请求回来时会 `setState` 到已经卸载的组件上（内存泄漏 + 警告）。
 *    · **背压与限流**：消费者处理不过来时主动取消上游，而不是把内存撑爆。
 *
 * 3. 核心语法要点
 *    (a) **三种 signal 来源**：
 *          const ctrl = new AbortController();          // 手动控制
 *          ctrl.signal;                                  // 传给任何接受 signal 的 API
 *          ctrl.abort(reason);                           // 触发中止，reason 可自定义
 *          AbortSignal.timeout(1000);                    // 1 秒后自动中止（reason 是 TimeoutError）
 *          AbortSignal.any([s1, s2]);                    // 任一触发即触发（reason 用的是最先触发的那个）
 *        `signal.reason` 保存中止原因。默认是 `DOMException('...', 'AbortError')`；
 *        你自己 `abort(x)` 传什么，它就原样保存什么（可以是 Error、字符串、任意值）。
 *        `signal.aborted` 是一个布尔值，可以随时同步查询。
 *    (b) **fetch 阶段**：`fetch(url, { signal })` —— 信号中止时：
 *          · 若还没拿到响应头：fetch 的 Promise **reject**，reason 就是 `signal.reason`；
 *          · 若已经拿到响应头：fetch **不会** reject（它早就 resolve 了），
 *            但 `response.body` 这个流会被**以同一个 reason 作废**。
 *        这是最容易误判的一点："我明明 abort 了，为什么 fetch 没抛错？"——
 *        因为 fetch 只承诺到"响应头到达"为止。
 *    (c) **读取阶段**：`response.body.getReader().read()` 会因为流被作废而 **reject**，
 *        错误就是你传的 reason。`for await (const chunk of response.body)` 同理。
 *    (d) **管道阶段**：`await response.body.pipeTo(dest, { signal })`
 *        · signal 中止时，`pipeTo` 返回的 Promise **reject**（reason 同上）；
 *        · **同时**会调用目标流的 `dest.abort(reason)` —— 这是"把取消传下去"的关键一步，
 *          目标流可以在这个钩子里关文件、回滚事务、发通知。
 *        · 其它选项：`preventClose`（不自动 close 目标）、`preventCancel`（不取消源）、
 *          `preventAbort`（不中止目标）—— 传输"只读前 N 字节"这类场景会用到。
 *    (e) **WritableStream 的 abort 钩子**：
 *          new WritableStream({
 *            write(chunk) { ... },
 *            close()      { ... },   // 正常写完
 *            abort(reason) { ... },  // 被取消/出错 —— 资源释放写在这里
 *          })
 *        `abort()` 之后，该流进入 errored 终态：再 `write()` 会 reject、`writer.closed` 会 reject，
 *        而且**两个钩子最多只有一个会被调用**（abort 和 close 是互斥的）。
 *    (f) **`cancel` 与 `abort` 的语义差异**（最容易被混为一谈的一对概念）：
 *          · `reader.cancel(reason)` = **消费者主动放弃**。"我看够了/我不要了"，
 *            这是一个**正常**的结束方式，会调用源的 `cancel()` 钩子，之后 `read()` 返回 `done: true`
 *            （而不是抛错）。**它不会触发任何 signal 的 abort**。
 *          · `writer.abort(reason)` = **生产端出错或取消**。这是一个**异常**结束，
 *            reason 会作为"错误"传播给另一端（对端的 `read()` 会 reject），
 *            `writer.closed` 也会 reject。
 *          一句话：**cancel 是"我不要了"（正常），abort 是"出事了"（异常）**。
 *          上层要区分"用户主动停止"和"传输失败"，否则会把正常取消报成错误日志/告警。
 *
 * 4. 常见陷阱
 *    - **以为 abort 之后 fetch 一定会抛错**：如 (b) 所述，拿到响应头之后就不会了。
 *      正确做法是**同时**处理 fetch 的 reject 和 body 读取的 reject。
 *    - **只 abort 了 fetch，没管下游**：`await fetch(url, {signal})` 之后又
 *      `await response.body.pipeTo(fileStream)`，如果不给 `pipeTo` 也传 signal，
 *      中止后管道会继续把已经缓冲的数据写完（甚至卡在写文件上），文件句柄不释放。
 *    - **`cancel` 当成 `abort` 用**：用 `reader.cancel()` 表达"传输失败"，
 *      结果错误信息丢了（对端只看到 done: true），故障排查时一片空白。
 *      反过来用 `abort()` 表达"用户主动停止"，则会把用户行为记成错误告警，污染监控。
 *    - **取消后忘了清理自己的资源**：定时器、事件监听、临时文件、数据库连接都不归流管。
 *      流的 `cancel`/`abort` 钩子是你的"最后一个清理时机"。
 *    - **服务端不知道客户端走了**：客户端 abort 之后，服务端如果还在往 `res` 里写，
 *      会一路写进已关闭的 socket（触发 EPIPE），而且循环/定时器不会停。
 *      **服务端必须监听 `req.on('close')` / `res.on('close')` 并清理**（03 篇讲过同一点）。
 *    - **对同一个 signal 反复 abort**：第二次开始是空操作（`aborted` 已经是 true），
 *      `reason` 也不会被覆盖 —— 第一次的原因才是最终原因。排查时要注意这点。
 *    - **`AbortSignal.timeout` 的定时器不会被 unref**：Node 里一个 30 秒的 timeout signal
 *      会让进程至少活 30 秒。测试代码里尤其容易因此"跑不完"。
 *      需要提前退出时，记得把 signal 的持有者取消掉（用 `AbortSignal.any` 配一个自己的 controller）。
 *    - **`promise.finally()` 里放清理代码并期望它一定执行**：如果 promise 永远不 settle，
 *      finally 也不执行。清理逻辑要么放进流的钩子，要么用 `try/finally` 包裹同步控制流。
 *    - **把 signal 传给了 fetch，却在后面的 for await 里捕获并忽略异常**：
 *      于是"取消"被静默吞掉，程序继续往下走到一个不完整的处理结果上。
 *      正确姿势：捕获后**检查 `signal.aborted`**，是取消就正常返回，不是取消就继续抛出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 36_realtime_and_streams/08_stream_cancellation.js
 *   本示例只在 127.0.0.1 上自建 HTTP 服务并连接自己，**不访问外网**。
 *   服务端每 25ms 推一块数据且永不主动结束，所有演示都是"读到一半取消"。
 *   收尾时会调用 `server.closeAllConnections()` —— Node 内置 fetch（undici）用 keep-alive
 *   连接池，不强制断开的话 `server.close()` 的回调永远不触发，进程会挂住。
 *
 * 【预期输出】
 *   1) 三种 signal 来源的用法与 reason 的默认值；
 *   2) 演示 A：AbortSignal.timeout 到点自动中止 —— fetch 的 reject 与 body 读取的 reject 分别长什么样；
 *   3) 演示 B：用户主动取消并携带自定义 reason —— 观察 reason 如何一路传到读取层；
 *   4) 演示 C：pipeTo(dest, {signal}) —— 取消如何贯通到 WritableStream.abort()；
 *   5) 演示 D：AbortSignal.any —— "用户取消"与"总超时预算"任一触发即取消；
 *   6) 演示 E：cancel 与 abort 的语义差异对照（正常结束 vs 异常传播）；
 *   7) 每个演示都打印**服务端视角**：它什么时候发现客户端走了、清理了什么；
 *   8) 资源释放清单与小结。全程退出码 0。
 * ============================================================================
 */

import http from 'node:http';

const encoder = new TextEncoder();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 给 Promise 加超时保护，避免任何一步意外卡住导致进程挂起。 */
function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`超时保护触发：${label} 在 ${ms}ms 内没有完成`)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

/** 把"可能 reject"的异步步骤压成一个描述字符串，用于打印结果而不是让脚本崩掉。 */
async function describe(fn) {
  try {
    return `✓ 成功：${await fn()}`;
  } catch (err) {
    const name = err?.name ?? typeof err;
    const message = err?.message ?? String(err);
    return `✗ ${name}: ${message}`;
  }
}

/** 最外层兜底，保证脚本最坏情况下也能以退出码 0 结束。 */
setTimeout(() => {
  console.log('\n[安全兜底] 进程仍未退出，强制结束（正常流程不应触发）。');
  process.exit(0);
}, 15_000).unref();

// ===========================================================================
console.log('--- 1. 取消链路全貌 ---');
// ===========================================================================
console.log('  一次"用户点取消"要穿过四层，缺一层就会留下没释放的资源：');
console.log('');
console.log('    AbortController.abort(reason)        用户点了取消按钮 / 业务判定失败');
console.log('    AbortSignal.timeout(ms)              到点自动中止（本文件演示 A）');
console.log('    AbortSignal.any([a, b])              多个来源合并，任一触发即触发（演示 D）');
console.log('              │  signal（同一个对象一路传下去）');
console.log('              ▼');
console.log('    ① fetch(url, { signal })             请求阶段：中止则 reject');
console.log('              ▼');
console.log('    ② response.body  ReadableStream      读取阶段：reader.read() reject');
console.log('              ▼');
console.log('    ③ pipeTo(dest, { signal })           管道阶段：reject + 调用 dest.abort()');
console.log('              ▼');
console.log('    ④ WritableStream.abort(reason)       落地阶段：钩子里释放资源');
console.log('');
console.log('  记住一句话：**取消不是"让 Promise 别等了"，而是"把信号传下去，让每层都能收拾自己"。**');
console.log('  对比 18_async/13 里的 Promise.race 超时：那个只是不再等，底层操作照样在跑。');

console.log('\n  三种 signal 来源与它们的 reason 默认值：');
const bare = new AbortController();
console.log(`    new AbortController().signal.aborted            = ${bare.signal.aborted}（一开始是 false）`);
bare.abort();
console.log(`    不传参数 abort() 之后，reason 是                    ${bare.signal.reason?.name}: "${bare.signal.reason?.message}"`);
const typed = new AbortController();
typed.abort(new Error('业务校验失败：余额不足'));
console.log(`    abort(new Error('...')) 之后，reason 原样保留       ${typed.signal.reason?.name}: "${typed.signal.reason?.message}"`);
const strAbort = new AbortController();
strAbort.abort('用户点了返回');
console.log(`    abort('字符串') 也可以，reason 是什么类型就是什么   typeof = ${typeof strAbort.signal.reason}，值 = "${strAbort.signal.reason}"`);
const timedOut = AbortSignal.timeout(30);
console.log(`    AbortSignal.timeout(30).reason 目前是               ${timedOut.reason === undefined ? 'undefined（还没到点）' : timedOut.reason.name}`);
await sleep(50);
console.log(`    30ms 之后它的 reason 是                            ${timedOut.reason?.name}: "${timedOut.reason?.message}"`);
console.log('    —— TimeoutError 是一个 DOMException，name 为 TimeoutError，不是 AbortError。');
console.log('       捕获后据此区分"超时"和"用户取消"，才能给出不同的提示文案。');

// ===========================================================================
console.log('\n--- 2. 起一个"永不结束"的服务端，并让它能观察到客户端的离开 ---');
// ===========================================================================
// 这个服务端模拟"大文件下载 / 长连接推送"：每 25ms 写一块数据，自己不主动结束。
// 关键点是 res.on('close')：无论客户端是正常收完、超时中止还是点了取消，
// 这条连接被销毁时服务端都会收到通知 —— 这是服务端释放资源唯一的时机。
/** 服务端观测日志，每个演示前清空一次。 */
let serverLog = [];
const server = http.createServer((req, res) => {
  if (req.url !== '/stream') {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end('{"error":"not found"}');
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
  });
  let written = 0;
  const ticker = setInterval(() => {
    written += 1;
    if (!res.write(Buffer.from(`chunk-${String(written).padStart(4, '0')}\n`))) {
      // write() 返回 false = 内核缓冲区满了 = 客户端读得慢（这就是 HTTP 层的背压）。
      // 真实项目在这里应当暂停生产，而不是继续往里灌。
      serverLog.push(`  [服务端] 背压：write() 返回 false（第 ${written} 块），客户端读得慢`);
    }
  }, 25);

  /** 连接被销毁时的清理。这是服务端唯一可靠的"客户端走了"信号。 */
  const cleanup = (why) => {
    clearInterval(ticker); // 不清掉定时器，进程永远不会退出
    serverLog.push(`  [服务端] ${why} 触发：停止推送（共发出 ${written} 块），释放定时器`);
  };
  res.on('close', () => cleanup('res 的 close 事件'));
  req.on('close', () => cleanup('req 的 close 事件'));
  res.on('error', () => cleanup('res 的 error 事件'));
  // 注意：这里**没有** res.end() —— 响应会一直开着，直到客户端离开（与 03 篇的 SSE 同构）
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const PORT = server.address().port;
const STREAM_URL = `http://127.0.0.1:${PORT}/stream`;
console.log(`  服务端已监听 http://127.0.0.1:${PORT}`);
console.log('  端点 GET /stream：每 25ms 推一块数据，**永不自己结束**。');

// ===========================================================================
console.log('\n--- 3. 演示 A：AbortSignal.timeout —— 到点自动中止 ---');
// ===========================================================================
serverLog = [];
console.log('  fetch(url, { signal: AbortSignal.timeout(120) })：120ms 后自动中止。');
const timeoutSignal = AbortSignal.timeout(120);
let timeoutChunks = 0;
const timeoutOutcome = await describe(async () => {
  // fetch 本身会先 resolve（响应头在 1ms 内就回来了）
  const res = await fetch(STREAM_URL, { signal: timeoutSignal });
  console.log(`    fetch 已 resolve：status=${res.status}，Content-Type=${res.headers.get('content-type')}`);
  console.log('    —— 注意：**拿到响应头不代表请求完成**，此刻数据才刚开始流过来。');
  const reader = res.body.getReader();
  for (;;) {
    const { done } = await reader.read();
    if (done) break;
    timeoutChunks += 1;
  }
  return `流正常结束（读了 ${timeoutChunks} 块）`;
});
console.log(`    读取结果：${timeoutOutcome}`);
console.log(`    读了 ${timeoutChunks} 块之后被中止（每块 25ms，120ms 大约对应 4~5 块）。`);
console.log(`    signal.reason 是：${timeoutSignal.reason?.name} —— 可以用来区分"超时"和"用户取消"。`);
await sleep(60);
console.log('  服务端视角：');
for (const line of serverLog) console.log(`  ${line}`);
console.log('  —— 服务端**能感知**客户端走了（res 的 close 事件），于是停掉了定时器。');
console.log('     如果服务端不监听 close，这个 setTimeout/数据库游标会一直跑下去：');
console.log('     这是长连接服务最常见的内存泄漏来源（03 篇 SSE 里讲过同一个坑）。');

// ===========================================================================
console.log('\n--- 4. 演示 B：用户主动取消，并携带自定义 reason ---');
// ===========================================================================
serverLog = [];
const userController = new AbortController();
// 模拟 150ms 后用户点了"取消下载"
const cancelTimer = setTimeout(() => userController.abort(new Error('用户点击了「取消下载」')), 150);
console.log('  150ms 后调用 controller.abort(new Error("用户点击了「取消下载」"))。');

let cancelChunks = 0;
let receivedBytes = 0;
const cancelOutcome = await describe(async () => {
  const res = await fetch(STREAM_URL, { signal: userController.signal });
  const reader = res.body.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    cancelChunks += 1;
    receivedBytes += value.byteLength;
  }
  return `流正常结束`;
});
clearTimeout(cancelTimer);
console.log(`    读取结果：${cancelOutcome}`);
console.log(`    中止前读到 ${cancelChunks} 块、共 ${receivedBytes} 字节。`);
console.log(`    signal.reason 一路传到了读取层，内容原样保留："${userController.signal.reason?.message}"`);
console.log('    —— 这正是自定义 reason 的价值：上层可以据此打出"用户主动取消"而不是"未知错误"。');
console.log('       如果什么都不传，reason 会是 AbortError，和"超时"混在一起分不清。');

console.log('\n  一个重要细节：fetch 本身抛错了吗？');
const alreadyAborted = new AbortController();
alreadyAborted.abort(new Error('这个 signal 一开始就是中止状态'));
console.log(`    ${await describe(async () => {
  const res = await fetch(STREAM_URL, { signal: alreadyAborted.signal });
  return `fetch resolve 了，status=${res.status}`;
})}`);
console.log('    结论：**已经中止的 signal 会让 fetch 立刻 reject**（上一步的连接根本没建立）；');
console.log('          但"连接建立后中途中止"时，fetch 早就 resolve 过了，抛错发生在读 body 的时候。');
console.log('          所以两处都要 try/catch —— 只处理 fetch 是新手最常犯的错。');

await sleep(60);
console.log('  服务端视角：');
for (const line of serverLog) console.log(`  ${line}`);
console.log('  —— 客户端 abort 之后，服务端的这条连接立刻被销毁，写不进去的数据也不会变成僵尸连接。');

// ===========================================================================
console.log('\n--- 5. 演示 C：pipeTo(dest, { signal }) —— 把取消传到下游 ---');
// ===========================================================================
serverLog = [];
console.log('  这次不是手动读，而是把 response.body 用 pipeTo 接到一个自建的可写流：');
console.log('    await response.body.pipeTo(dest, { signal })');
console.log('  dest 的 abort() 钩子就是"下游释放资源"的地方（真实项目里是关文件、回滚事务）。');

/** 下游收集到的数据块；abort 钩子里会记录释放动作。 */
const sinkState = { chunks: 0, bytes: 0, released: false, abortReason: null, closed: false };
const sink = new WritableStream({
  async write(chunk) {
    // 模拟"写文件/写数据库"的耗时，让取消有机会发生在写入途中
    await sleep(10);
    sinkState.chunks += 1;
    sinkState.bytes += chunk.byteLength;
  },
  close() {
    sinkState.closed = true;
    console.log('    [dest.close] 上游正常结束，目标流被优雅关闭');
  },
  abort(reason) {
    // ★ 这一段就是"取消贯通"的终点：资源释放在这里做
    sinkState.released = true;
    sinkState.abortReason = reason;
    console.log(`    [dest.abort] 收到取消，reason = "${reason?.message ?? reason}"`);
    console.log('    [dest.abort] 真实项目在这里：关闭文件句柄 / 回滚事务 / 删除临时文件 / 落审计日志');
  },
});

const pipeController = new AbortController();
setTimeout(() => pipeController.abort(new Error('总耗时超过预算，中止传输')), 160);
const pipeOutcome = await describe(async () => {
  const res = await fetch(STREAM_URL, { signal: pipeController.signal });
  await res.body.pipeTo(sink, { signal: pipeController.signal });
  return '管道正常结束';
});
console.log(`    pipeTo 的结果：${pipeOutcome}`);
console.log(`    下游写入了 ${sinkState.chunks} 块 / ${sinkState.bytes} 字节；abort 钩子被调用：${sinkState.released}`);
console.log(`    close 钩子被调用了吗？ ${sinkState.closed}  <- **abort 与 close 互斥**，取消时只走 abort`);

console.log('\n  关键对比：pipeTo 不传 signal 时，取消还能不能贯通？');
console.log('  说明：这一轮 fetch 用的是**另一个** signal（模拟"取消信号不是挂在 fetch 上的"），');
console.log('        比如数据源是自己构造的流、或者上游是 TransformStream 的输出。');
console.log('  做法：两组参数完全相同的实验，唯一区别是 pipeTo 有没有传 signal；');
console.log('        都在 60ms 时中止，然后比较"下游一共被写入了多少块"。');

/** 造一个"会自然结束的长流"：每 6ms 产一块，共 30 块。 */
function makeEndlessSource() {
  let produced = 0;
  return new ReadableStream(
    {
      async pull(controller) {
        await sleep(6);
        produced += 1;
        if (produced > 30) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(`d${produced}`));
      },
    },
    new CountQueuingStrategy({ highWaterMark: 1 }),
  );
}

/** 跑一组实验，返回 { 下游写入块数, 管道结果, abort 钩子是否被调用 }。 */
async function runPipeExperiment(passSignal) {
  const state = { chunks: 0, released: false, abortReason: null };
  const dest = new WritableStream({
    async write() {
      await sleep(6);
      state.chunks += 1;
    },
    abort(reason) {
      state.released = true;
      state.abortReason = reason?.message ?? String(reason);
    },
  });
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(new Error('取消信号')), 60);
  let outcome;
  try {
    // 数据源与 ctrl 无关（模拟"signal 不挂在数据源上"）
    await makeEndlessSource().pipeTo(dest, passSignal ? { signal: ctrl.signal } : undefined);
    outcome = '管道正常跑完，没有中止';
  } catch (err) {
    outcome = `管道 reject：「${err.message}」`;
  }
  return { ...state, outcome, aborted: ctrl.signal.aborted };
}

const noSignalRun = await runPipeExperiment(false);
console.log(`\n    A. pipeTo **不传** signal：${noSignalRun.outcome}`);
console.log(`       下游最终写入 ${noSignalRun.chunks} 块；abort 钩子被调用：${noSignalRun.released}`);
console.log('       —— 60ms 时信号已经中止了，但管道**完全不知情**，一路把 30 块搬完。');
console.log('          用户点了取消，界面显示"已取消"，后台却还在读、还在写 —— 这就是漏传 signal 的后果。');

const withSignalRun = await runPipeExperiment(true);
console.log(`\n    B. pipeTo **传了** signal：${withSignalRun.outcome}`);
console.log(`       下游最终写入 ${withSignalRun.chunks} 块；abort 钩子被调用：${withSignalRun.released}`);
console.log(`       abort 钩子收到的 reason："${withSignalRun.abortReason}"`);
console.log('       —— 管道立刻停止，并且下游的 abort 钩子拿到了取消原因，可以据此释放资源。');
console.log('\n  两组的对比结论：**signal 不会自己"顺着管道流下去"，它只挂在你显式传了的那一环上。**');
console.log('  同样的道理适用于 `readableStream.pipeThrough(ts)`：pipeThrough 没有 signal 参数，');
console.log('  要中止就得靠上游 fetch 的 signal，或者用 `AbortSignal.any` 把信号合并进去。');

await sleep(60);
console.log('  服务端视角：');
for (const line of serverLog) console.log(`  ${line}`);

// ===========================================================================
console.log('\n--- 6. 演示 D：AbortSignal.any —— 用户取消 + 总超时预算 ---');
// ===========================================================================
// 场景：一次业务操作有 200ms 的**总预算**，同时也要支持用户随时点取消。
// 正确做法是把两个来源用 any() 合并成一个 signal，而不是串两个 try/catch。
serverLog = [];
const budgetController = new AbortController(); // 用来提前结束那个 timeout 定时器
const userCancelController = new AbortController();
const budgetSignal = AbortSignal.timeout(200); // 总预算：到点无论无何都中止
const combined = AbortSignal.any([userCancelController.signal, AbortSignal.timeout(200)]);
console.log('  AbortSignal.any([用户取消.signal, AbortSignal.timeout(200)])');
console.log('  —— 任一来源触发，combined 立刻中止，且 reason 用**最先触发的那个**。');

// 这一轮让"用户取消"先赢（100ms < 200ms）
setTimeout(() => userCancelController.abort(new DOMException('用户点了「停止生成」', 'AbortError')), 100);
let combinedChunks = 0;
const combinedOutcome = await describe(async () => {
  const res = await fetch(STREAM_URL, { signal: combined });
  const reader = res.body.getReader();
  for (;;) {
    const { done } = await reader.read();
    if (done) break;
    combinedChunks += 1;
  }
  return '流正常结束';
});
console.log(`    结果：${combinedOutcome}（读了 ${combinedChunks} 块）`);
console.log(`    combined.reason.name    = ${combined.reason?.name}`);
console.log(`    combined.reason.message = "${combined.reason?.message}"  <- 是**用户取消**赢的，不是超时`);
console.log(`    原始两个信号的状态：user=${userCancelController.signal.aborted}，timeout=${budgetSignal.aborted}`);
console.log('    —— 注意 timeout 的那个信号此刻还没到点，但 combined 已经中止了。');

// 再跑一轮，让"总预算"赢（用户不操作）
serverLog = [];
budgetController.abort(); // 这个 controller 在演示里没用到，只是演示"可以提前放弃 signal"的写法
const budgetOnly = AbortSignal.timeout(90);
console.log('\n  换成"只有总预算、用户没操作"的场景（90ms 预算）：');
let budgetChunks = 0;
const budgetOutcome = await describe(async () => {
  const res = await fetch(STREAM_URL, { signal: budgetOnly });
  const reader = res.body.getReader();
  for (;;) {
    const { done } = await reader.read();
    if (done) break;
    budgetChunks += 1;
  }
  return '流正常结束';
});
console.log(`    结果：${budgetOutcome}（读了 ${budgetChunks} 块）`);
console.log(`    这次 reason.name = ${budgetOnly.reason?.name}  <- 超时了，与上面的 AbortError 区分开`);
console.log('  —— 这就是为什么**必须检查 reason.name**：同样一个 catch 分支，');
console.log('     用户主动取消要给"已取消"的提示，超时要给"网络较慢，请重试"的提示，');
console.log('     而真正的网络错误要上报监控。三种情况处理方式完全不同。');

await sleep(60);
console.log('  服务端视角：');
for (const line of serverLog) console.log(`  ${line}`);

console.log('\n  补充：什么时候该用"总预算"而不是"每个请求各自的超时"？');
const budgetRows = [
  ['单请求超时', 'fetch(url, { signal: AbortSignal.timeout(3000) })', '适合互不相关的独立调用'],
  ['总预算（deadline）', '一个 signal 传遍所有下游调用', '适合一次用户操作要串/并多个下游：3 秒预算就是 3 秒，不会叠加成 15 秒'],
  ['两者结合', 'AbortSignal.any([总预算, 单次上限, 用户取消])', '生产环境的常规做法'],
];
for (const [name, how, why] of budgetRows) {
  console.log(`    ${name.padEnd(18)}${how}`);
  console.log(`    ${' '.repeat(18)}→ ${why}`);
}

// ===========================================================================
console.log('\n--- 7. 演示 E：cancel 与 abort 的语义差异 ---');
// ===========================================================================
// 这一节不碰网络，纯用内存流把两个概念摆在一起看，差异一眼就清楚。
console.log('  先看 `reader.cancel(reason)` —— **消费者主动放弃**：');
const producerCancelled = { hook: null };
const source = new ReadableStream(
  {
    pull(controller) {
      controller.enqueue(encoder.encode('数据块'));
    },
    cancel(reason) {
      // 消费者取消时调用：这里是释放上游资源的地方（关数据库游标、断开上游连接……）
      producerCancelled.hook = reason;
      console.log(`    [源.cancel 钩子] 被调用，reason = "${reason}"`);
    },
  },
  new CountQueuingStrategy({ highWaterMark: 1 }),
);
const sourceReader = source.getReader();
await sourceReader.read(); // 读一块
console.log('    读了一块之后调用 reader.cancel("够用了，不读了")');
await sourceReader.cancel('够用了，不读了');
const afterCancel = await sourceReader.read();
console.log(`    再 read() 的结果：done=${afterCancel.done}，value=${afterCancel.value}  <- **不是抛错，是正常结束**`);
console.log('    源侧的 cancel 钩子收到了 reason，说明上游也知道了。');
console.log('    注意：如果有对应的 AbortSignal，它**完全不受影响**（cancel 不会去动 signal）。');

console.log('\n  再看 `writer.abort(reason)` —— **生产端出错/取消**：');
const abortEvents = [];
// 注意 readableHighWaterMark 必须显式给，否则默认 0 会让 write() 永远挂着（见 05 篇的陷阱）
const ts = new TransformStream({}, { highWaterMark: 1 }, { highWaterMark: 2 });
const tsWriter = ts.writable.getWriter();
const tsReader = ts.readable.getReader();
await tsWriter.write('第一条');
console.log(`    先正常写一条，下游读到：${(await tsReader.read()).value}`);
// 先在下游挂上一次读取（并捕获它），否则错误会变成 unhandled rejection
const pendingRead = tsReader.read().then(
  (v) => ({ value: v.value }),
  (e) => ({ error: `${e.name}: ${e.message}` }),
);
await tsWriter.abort(new Error('生产端连接断了'));
const readResult = await pendingRead;
console.log(`    writer.abort(Error) 之后，**下游的 read() 收到**：${readResult.error ? `抛错「${readResult.error}」` : `数据 ${readResult.value}`}`);
abortEvents.push(`下游 read() -> ${readResult.error ?? readResult.value}`);
const writeAfterAbort = await tsWriter.write('第二条').then(
  () => '居然成功了',
  (e) => `抛错「${e.message}」`,
);
console.log(`    abort 之后再 write()：${writeAfterAbort}  <- 流已进入 errored 终态，无法再写`);
const closedState = await tsWriter.closed.then(
  () => 'resolve',
  (e) => `reject「${e.message}」`,
);
console.log(`    writer.closed 的状态：${closedState}`);
console.log('    —— abort 的 reason 是作为**错误**传播的：对端收到的是异常，不是"正常结束"。');

console.log('\n  两者的对照（这张表建议背下来）：');
const cancelVsAbort = [
  ['谁调用', 'reader.cancel(reason)', 'writer.abort(reason)'],
  ['语义', '消费者说"我不要了"', '生产端说"出事了 / 取消"'],
  ['是正常还是异常', '**正常**结束', '**异常**结束'],
  ['对端看到什么', 'read() 返回 { done: true }', '对端的 read() / write() **reject**'],
  ['触发哪个钩子', '源的 cancel(reason)', '目标流的 abort(reason)'],
  ['reason 的地位', '一个"说明"，不带错误语义', '就是错误对象，会一路向上传播'],
  ['会不会动 AbortSignal', '**不会**', '通常是 signal 中止引发的，也可能是手动调的'],
  ['典型场景', '"只看前 100 行"、用户看完就关', '传输失败、超时、用户取消下载'],
  ['日志级别', 'info（用户行为）', 'warn / error（需要关注）'],
];
for (const [dim, a, b] of cancelVsAbort) {
  console.log(`    ${dim.padEnd(22)}`);
  console.log(`        cancel : ${a}`);
  console.log(`        abort  : ${b}`);
}
console.log('  最实用的一条：**上游把"用户主动取消"上报成 error，是常见的告警噪音来源。**');
console.log('  在 catch 里检查 `err.name === "AbortError"` 或 `signal.reason`，就能把两者分开。');

// ===========================================================================
console.log('\n--- 8. 取消时，到底有哪些资源要释放 ---');
// ===========================================================================
serverLog = [];
// 最后一个综合演示：把整条链路串起来，看看一次"取消"到底触发了多少处清理
const releaseLog = [];
const demoController = new AbortController();
const demoSink = new WritableStream({
  write() {
    return sleep(8); // 模拟"写文件"，让取消有机会发生在写入途中
  },
  abort(reason) {
    releaseLog.push(`★ 下游 WritableStream.abort 钩子被调用（reason="${reason.message}"）—— 取消已传到最末端`);
  },
});
const pipelineResult = await describe(async () => {
  // 这次只发一个请求，从头到尾走 pipeTo 链路
  const res = await fetch(STREAM_URL, { signal: demoController.signal });
  releaseLog.push('① TCP 连接建立，fetch resolve（响应头已到，连接上挂好了 signal）');
  releaseLog.push('② response.body 交给 pipeTo（流被锁住），泵循环开始按块 read -> write');
  const pipePromise = res.body.pipeTo(demoSink, { signal: demoController.signal });
  await sleep(90); // 让它搬一会儿数据
  demoController.abort(new Error('用户点了「取消」'));
  releaseLog.push('★ controller.abort(reason) 被调用 —— 信号开始向下传播');
  await pipePromise; // 这里应当 reject
  return '管道正常结束';
});
console.log(`  综合演示的结果：${pipelineResult}`);
console.log('\n  一次取消实际触发的动作（按真实发生的先后顺序）：');
for (const line of releaseLog) console.log(`    ${line}`);
await sleep(60);
console.log('\n  服务端视角：');
for (const line of serverLog) console.log(`  ${line}`);

console.log('\n  完整的资源清单（每一项都要有对应的释放动作）：');
const resourceChecklist = [
  ['HTTP 连接 / socket', 'fetch 层的 abort 会销毁连接', '由 signal 自动完成'],
  ['response.body 流', '中止后自动作废，read() 抛出 reason', '由 signal 自动完成'],
  ['管道泵循环', 'pipeTo 的 Promise reject 并退订', '由 pipeTo 的 signal 完成'],
  ['WritableStream 目标', '走 abort() 钩子', '**你必须自己写**：关文件、回滚、删临时文件'],
  ['ReadableStream 源', '走 cancel() 钩子', '**你必须自己写**：关游标、断开上游'],
  ['定时器 / 心跳', '没有自动化，必须手动 clearInterval', '**你必须自己写**'],
  ['事件监听器', '取消后要 removeEventListener / off', '**你必须自己写**'],
  ['服务端侧资源', 'req/res 的 close 事件里清理', '**服务端必须自己写**（见 03 篇）'],
  ['UI 状态', '把 loading 置为 false、给出"已取消"提示', '**你必须自己写**'],
];
for (const [res, how, who] of resourceChecklist) {
  console.log(`    ${res.padEnd(24)}${how.padEnd(40)}${who}`);
}
console.log('\n  —— 规律很清楚：**流的传导是自动的，业务资源是你自己的责任。**');
console.log('     把清理逻辑集中放进 cancel/abort 钩子和 try/finally，才不会漏。');

// ===========================================================================
console.log('\n--- 9. 收尾 ---');
// ===========================================================================
// 关键：Node 内置 fetch（undici）默认使用 keep-alive 连接池。
// 即使所有请求都结束了，池里的连接仍然开着，server.close() 的回调**永远不会触发**，
// 进程会安静地挂在那里。必须显式调用 closeAllConnections() 强制断开。
console.log(`  最后一次演示里，服务端在客户端取消后观察到的清理事件：${serverLog.length} 条`);
console.log(`    ${serverLog.map((l) => l.trim()).join(' / ')}`);
server.closeAllConnections();
await withTimeout(new Promise((resolve) => server.close(resolve)), 3000, 'server.close');
console.log('  服务端已关闭。');
console.log('  注意顺序：先 closeAllConnections() 再 close()。');
console.log('  Node 内置 fetch（undici）默认用 keep-alive 连接池，池里的连接不主动断开，');
console.log('  server.close() 的回调就永远不会触发，进程会安静地挂住 —— 这是本仓库反复出现的坑。');

console.log('\n--- 10. 小结 ---');
const summary = [
  '1) 取消是一条**链路**：signal -> fetch -> response.body -> pipeTo -> WritableStream.abort。',
  '   同一个 signal 必须传给每一环，漏一环就会出现"用户以为取消了、其实还在传"。',
  '2) 三种信号来源：AbortController（手动）、AbortSignal.timeout（到点）、',
  '   AbortSignal.any([...])（多源合并，reason 用最先触发的那个）。',
  '3) **fetch 只在"还没拿到响应头"时才 reject**；拿到响应头之后中止，抛错发生在读 body 时。',
  '   所以 fetch 和 body 读取必须分别 try/catch。',
  '4) pipeTo(dest, { signal }) 中止时会 reject **并且**调用 dest.abort(reason) ——',
  '   这是把"取消"从传输层传到业务层的唯一通道。',
  '5) reason 会一路原样传递。默认是 AbortError；AbortSignal.timeout 给的是 TimeoutError。',
  '   **在 catch 里检查 reason.name**，才能把"用户取消 / 超时 / 真实网络故障"分开处理。',
  '6) **cancel ≠ abort**：reader.cancel 是"我不要了"（正常的 done: true，触发源的 cancel 钩子）；',
  '   writer.abort 是"出事了"（异常，对端 read()/write() reject，触发目标流的 abort 钩子）。',
  '   把用户取消记成 error 是常见的告警噪音来源。',
  '7) 流的传导是自动的，**业务资源要自己释放**：定时器、监听器、文件句柄、',
  '   数据库游标、临时文件、UI 状态 —— 全都不会有人替你管。',
  '8) 服务端必须监听 req/res 的 close 事件并清理，否则客户端走了它还在产生数据（03 篇的老坑）。',
  '9) 收尾提醒：用了 Node 内置 fetch 就必须配合 server.closeAllConnections()，',
  '   否则 keep-alive 连接池会让 server.close() 永远等下去。',
];
for (const line of summary) console.log(`  ${line}`);
