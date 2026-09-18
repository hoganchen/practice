/**
 * ============================================================================
 * 知识点：node:worker_threads —— 用多线程做真正的并行计算
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】高级
 * 【前置知识】26_node_core/11_timers.js、26_node_core/10_child_process.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:worker_threads 让一个 Node 进程可以拥有**多个 JS 执行线程**。
 *    每个 worker 是一个独立的线程，有自己独立的 V8 实例、独立的事件循环、
 *    独立的全局对象，但**共享同一份进程内存**。
 *
 *    它与 child_process 的关键区别：
 *      · 进程 vs 线程：child_process 开新进程（内存隔离，启动更重）；
 *        worker_threads 开新线程（共享内存，启动更轻，可以用 SharedArrayBuffer 直接共享数据）
 *      · 通信方式：进程间要序列化（IPC / 管道），线程间用 postMessage 传结构化克隆
 *      · 适用场景：进程适合"跑别的程序"，线程适合"并行跑自己写的 CPU 密集逻辑"
 *
 *    与异步 I/O 的关系也要说清楚：异步 I/O 解决的是"等待"（磁盘、网络），
 *    这些等待由操作系统完成，JS 线程本来就空闲。但**计算**不一样——
 *    一个 5 秒的 for 循环会把 JS 线程彻底占住，异步再多也没用。
 *    这时唯一的出路就是"再开一个线程去算"，这正是 worker_threads 的价值。
 *
 * 2. 为什么需要
 *    Node 常被说成"单线程"，准确说法是"单个 JS 执行线程 + 一个线程池"。
 *    这个模型对 I/O 密集的服务非常高效，但遇到 CPU 密集任务就会严重拖后腿：
 *      · 图片/视频转码、加密解密、压缩解压
 *      · 大 JSON 的解析与序列化、大数组的排序与聚合
 *      · 语法解析、模板编译、代码压缩
 *    这些任务放在主线程上，会让所有并发请求一起卡住（"一人卡死，全站等待"）。
 *    把这类任务丢给 worker，主线程就能继续响应请求。
 *
 * 3. 核心语法要点
 *    - new Worker(filename, { workerData })      从文件启动 worker
 *    - new Worker(codeString, { eval: true })    从代码字符串启动（本文件用这种方式，
 *                                                好处是示例只有一个文件，便于单文件运行）
 *    - workerData                                启动时传给 worker 的初始数据（结构化克隆）
 *    - parentPort                                worker 侧的"与主线程通话"的端口
 *    - worker.on('message', fn)                  主线程收 worker 发来的消息
 *    - worker.on('error', fn)                    worker 内抛出的未捕获异常
 *    - worker.on('exit', (code) => {})           worker 线程结束
 *    - worker.on('online') / 'messageerror'
 *    - worker.postMessage(value)                 主线程给 worker 发消息
 *    - worker.terminate()                        强制结束 worker，返回 Promise
 *    - worker.threadId                           线程 ID
 *    - isMainThread                              当前代码是跑在主线程还是 worker 里
 *    - MessageChannel / MessagePort              更灵活的双向通道，可转移给别的 worker
 *    - SharedArrayBuffer + Atomics               真正共享内存（本文件不展开）
 *    - 结构化克隆：postMessage 的值会被复制，函数、类实例的方法、Symbol 都不能传
 *
 * 4. 常见陷阱
 *    陷阱 1：把 I/O 密集任务丢给 worker。I/O 本来就由操作系统异步处理，
 *            用 worker 只会白白增加线程开销和复杂度。worker 只解决 CPU 密集问题。
 *    陷阱 2：忘了 terminate() 或忘了让 worker 自然结束，导致主进程挂起不退出。
 *            worker 活着就会撑住事件循环——本文件每个 worker 都会被明确收尾。
 *    陷阱 3：postMessage 传的不是引用而是"结构化克隆的副本"。
 *            改主线程的对象不会影响 worker 里的副本（反之亦然）。
 *            要共享内存必须用 SharedArrayBuffer。
 *    陷阱 4：postMessage 不能传函数、Promise、Symbol、类实例的原型方法。
 *            传了会抛 DataCloneError。跨线程只能传纯数据。
 *    陷阱 5：worker 里不能直接访问主线程的变量，也不能用主线程的模块实例状态。
 *            每个 worker 有自己的模块加载器与模块缓存，会独立执行一遍顶层代码。
 *    陷阱 6：worker 内未捕获的异常只会触发 'error' 事件，不会自动杀掉主进程；
 *            但如果不处理这个事件，Node 会把它抛成未捕获异常，进程仍会崩。
 *            所以 'error' 一定要监听。
 *    陷阱 7：线程数不是越多越好。每个 worker 有独立的 V8 实例，内存开销约几十 MB；
 *            而且线程数超过 CPU 物理核心数后，切换开销会让总吞吐反而下降。
 *            经验值是用 os.availableParallelism() 作为上限（见 12_os_and_util.js）。
 *    陷阱 8：eval: true 只适合示例和动态场景。生产代码应当写成独立文件，
 *            这样才有正常的模块解析、错误堆栈与 IDE 支持。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/14_worker_threads.js
 *
 * 【预期输出】
 *   用 workerData 传参、双向 postMessage 通信、CPU 密集任务不阻塞主线程的
 *   实测对比（主线程计时器在 worker 计算期间照常触发），
 *   以及 'error' 事件与 terminate() 的演示。所有 worker 都会被正确收尾。
 * ============================================================================
 */

import { Worker, isMainThread, threadId, parentPort, workerData } from 'node:worker_threads';
import os from 'node:os';
import { once } from 'node:events';

console.log('--- 0. 当前线程 ---');

// isMainThread 在两种环境下取不同的值：
//   · 主线程里是 true
//   · 任何 worker 里是 false
// 这是"同一份代码既能当主线程脚本、又能当 worker 脚本"的惯用写法。
console.log('  isMainThread =', isMainThread, '（主线程为 true）');
console.log('  当前 threadId =', threadId, '（主线程通常是 0）');
console.log('  可用并发度 =', os.availableParallelism(), '（这是 worker 数量的经验上限）');

// ---------------------------------------------------------------------------
// 1. 最小的 worker：启动、传参、通信、退出
// ---------------------------------------------------------------------------

console.log('--- 1. 最小 worker ---');

// 用 eval: true 从代码字符串创建 worker，好处是整个示例只依赖一个文件。
// 生产项目里更推荐写成独立文件：new Worker(new URL('./worker.js', import.meta.url))
const minimalCode = `
  // 下面这些标识符在 worker 线程里可用（从 node:worker_threads 导入）：
  //   parentPort  与主线程通信的端口
  //   workerData  主线程启动时传来的初始数据
  //   threadId    本线程的 ID
  //
  // 注意：worker 里的代码有**独立的模块作用域与全局对象**，
  // 主线程里的变量在这里是看不见的（陷阱 5）。
  const { parentPort, workerData, threadId } = require('node:worker_threads');

  parentPort.postMessage({
    from: threadId,
    // workerData 是主线程通过 new Worker(..., { workerData }) 传来的副本。
    received: workerData.message,
    // 证明 worker 有自己的独立环境：这里也能读到自己的线程 ID。
    pid: process.pid,
  });
`;

// workerData 会被"结构化克隆"后传给 worker（陷阱 3：是副本不是引用）。
const minimal = new Worker(minimalCode, {
  eval: true,
  workerData: { message: '来自主线程的问候' },
});

// 监听 worker 发回的消息。
minimal.on('message', (msg) => {
  console.log('  主线程收到 worker 消息：', msg);
  console.log('  worker 的 threadId =', msg.from, '，主线程是', threadId, '（不同线程）');
  console.log('  两者 pid 相同吗 =', msg.pid === process.pid, '（同进程，所以相同——这正是"线程"而非"进程"）');
});

// 'error' 事件必须监听（陷阱 6）：worker 里未捕获的异常会走到这里。
minimal.on('error', (err) => {
  console.error('  worker 出错：', err.message);
});

// 'exit' 在 worker 线程结束时触发，参数是退出码（正常结束为 0）。
// 用 once + await 把它变成可等待的 Promise，保证后续输出顺序正确。
const [minimalExitCode] = await once(minimal, 'exit');
console.log('  worker 已退出，退出码 =', minimalExitCode);
console.log('  => worker 的代码执行完、没有待处理任务时，线程会**自动结束**，不需要手动 terminate。');

// ---------------------------------------------------------------------------
// 2. 双向通信：多次往返
// ---------------------------------------------------------------------------

console.log('--- 2. 双向通信 ---');

// worker 侧：接收 'compute' 消息 -> 计算 -> 回发结果。
// 这样一个 worker 可以反复被复用，而不是每次任务都新建线程。
const echoCode = `
  const { parentPort } = require('node:worker_threads');

  // 监听主线程发来的每条消息。
  parentPort.on('message', (task) => {
    // 用 requestId 关联"请求"与"响应"。
    // 并发场景下响应顺序不保证，靠 ID 匹配才不会串号——这是跨线程 RPC 的标准做法。
    if (task.type === 'compute') {
      const result = task.n * task.n;   // 模拟一点计算
      parentPort.postMessage({ requestId: task.requestId, type: 'result', value: result });
    } else if (task.type === 'shutdown') {
      // 收到关闭指令：关闭端口，worker 随即自然结束。
      parentPort.close();
    }
  });
`;

const echoer = new Worker(echoCode, { eval: true });

// 收集响应用一个小表：requestId -> 处理函数
const pending = new Map();
echoer.on('message', (msg) => {
  if (msg.type === 'result') {
    // 用 requestId 把结果交还给对应的请求。
    const handler = pending.get(msg.requestId);
    if (handler) {
      pending.delete(msg.requestId);
      handler(msg.value);
    }
  }
});

// 把"发消息"包装成返回 Promise 的调用，用起来就像本地异步函数。
let requestSeq = 0;
function askWorker(n) {
  requestSeq += 1;
  const requestId = requestSeq;
  return new Promise((resolve) => {
    // 先登记回调，再发消息，避免响应比登记更早到达（与 09 节的陷阱 7 同理）。
    pending.set(requestId, resolve);
    echoer.postMessage({ type: 'compute', requestId, n });
  });
}

// 连续调用三次，观察 worker 被复用。
console.log('  发往同一个 worker 的三次计算：');
for (const n of [7, 12, 25]) {
  const value = await askWorker(n);
  console.log(`    ${n} 的平方 = ${value}`);
}
console.log('  => 三次调用复用的是同一个 worker 线程，不是每次都新建线程。');

// 发关闭指令，让 worker 自己优雅结束。
// 如果一直不关，这个 worker 会撑住事件循环，导致脚本不退出（陷阱 2）。
const echoerClosed = once(echoer, 'exit');
echoer.postMessage({ type: 'shutdown' });
const [echoCode2] = await echoerClosed;
console.log('  收到 shutdown 后 worker 自行退出，退出码 =', echoCode2);

// ---------------------------------------------------------------------------
// 3. 核心演示：CPU 密集任务不阻塞主线程
// ---------------------------------------------------------------------------

console.log('--- 3. CPU 密集任务：主线程 vs worker ---');

// 定义一个"需要认真算一会儿"的任务。
// 这里用累加平方和来消耗 CPU，并且刻意让编译器无法把它优化掉。
// 数据规模选得刚好让单次耗时在几十毫秒量级——足够看出差异，又不会拖慢示例。
function collectCpuWork(iterations) {
  let sum = 0;
  // 用 Math.sqrt 是为了让每轮都有实际计算，避免被 JIT 当作无效循环消除。
  for (let i = 0; i < iterations; i += 1) {
    sum += Math.sqrt(i) % 7;
  }
  return sum;
}

const ITERATIONS = 3_000_000;

// 先量一下这个任务在主线程上要花多久。
const calibStart = Date.now();
const calibrate = collectCpuWork(ITERATIONS);
const ITER_MS = Date.now() - calibStart;
console.log(`  基准：在主线程算 ${ITERATIONS} 次约需 ${ITER_MS}ms（结果 ${calibrate.toFixed(0)}）`);

// 为了做公平对比，两种方式都完成**完全相同**的总计算量：
// 一共 ROUNDS_TOTAL 轮，每轮 ITERATIONS 次。
const ROUNDS_TOTAL = 4;

// ---- 3.1 直接在主线程上算：定时器会被卡住 ----

console.log(`  [对比 A] 在主线程串行算完 ${ROUNDS_TOTAL} 轮：`);
{
  let timerTicks = 0;
  // 这个定时器每 5ms 想跑一次，用来当"主线程是否空闲"的探针。
  const probe = setInterval(() => {
    timerTicks += 1;
  }, 5);

  const startA = Date.now();
  // 主线程被这些循环独占，期间 event loop 一步都动不了。
  for (let r = 0; r < ROUNDS_TOTAL; r += 1) {
    collectCpuWork(ITERATIONS);
  }
  const elapsedA = Date.now() - startA;

  clearInterval(probe);
  console.log(`    总耗时 ${elapsedA}ms，期间探针定时器只触发了 ${timerTicks} 次`);
  console.log('    => 探针几乎没跑，因为事件循环被计算占死了（"一人卡死，全站等待"）。');
}

// ---- 3.2 交给 worker 算：主线程保持响应 ----

console.log(`  [对比 B] 把同样 ${ROUNDS_TOTAL} 轮的计算分给 worker，主线程等待期间保持响应：`);

// worker 代码：算完之后把结果和耗时一起发回来。
const cpuCode = `
  const { parentPort, workerData } = require('node:worker_threads');

  function collectCpuWork(iterations) {
    let sum = 0;
    for (let i = 0; i < iterations; i += 1) {
      sum += Math.sqrt(i) % 7;
    }
    return sum;
  }

  // workerData.jobs 是"要算几轮"，由主线程指定。
  const started = Date.now();
  const total = collectCpuWork(workerData.iterations * workerData.jobs);
  parentPort.postMessage({
    total,
    // worker 内部也会看自己的耗时，用来对比两边的时间是否重叠。
    workerMs: Date.now() - started,
  });
`;

// 用多个 worker 并行分摊同样多的活（ROUNDS_TOTAL 轮）。
// 每个 worker 分到 ROUNDS_TOTAL / workerCount 轮。
const workerCount = 2;
const jobsPerWorker = ROUNDS_TOTAL / workerCount;

const cpuWorkers = Array.from(
  { length: workerCount },
  () =>
    new Worker(cpuCode, {
      eval: true,
      workerData: { iterations: ITERATIONS, jobs: jobsPerWorker },
    }),
);

{
  let timerTicks = 0;
  const probe = setInterval(() => {
    timerTicks += 1;
  }, 5);

  const startedB = Date.now();

  // 等所有 worker 完成。用 Promise.all 并发等待，这才是真正的并行。
  const results = await Promise.all(
    cpuWorkers.map((w) => once(w, 'message').then(([msg]) => msg)),
  );

  const elapsedB = Date.now() - startedB;
  clearInterval(probe);

  // 每个 worker 自己报告的耗时，就是它真正花在计算上的时间。
  const maxWorkerMs = Math.max(...results.map((r) => r.workerMs));

  console.log(`    墙上总耗时 ${elapsedB}ms（${workerCount} 个 worker 各算 ${jobsPerWorker} 轮，共 ${ROUNDS_TOTAL} 轮）`);
  console.log(`    期间探针定时器触发了 ${timerTicks} 次 —— 主线程全程可用！`);
  results.forEach((r, i) => {
    console.log(`      worker ${i + 1}: 结果 ${r.total.toFixed(0)}，自身计算耗时 ${r.workerMs}ms`);
  });
  console.log(`    墙上耗时里约有 ${elapsedB - maxWorkerMs}ms 是 worker 线程的启动开销（一次性成本）`);
  console.log('  => 对比要点：');
  console.log('     · 总计算量完全一样（都是 4 轮），B 用两个线程并行，纯计算部分约为 A 的一半');
  console.log(`     · 更关键的是主线程：A 期间探针 0 次，B 期间探针 ${timerTicks} 次`);
  console.log('       在真实服务里，这些"探针"就是别的用户请求——A 会让所有人一起等。');
  console.log('     · B 多出的启动开销是一次性的；worker 复用后就没有这部分成本了。');
}

// 收尾：显式结束这两个 worker。
// 虽然它们的代码已经跑完、消息也发回来了，但按规范仍应确保线程被释放。
// terminate() 返回 Promise，await 它之后线程一定已经结束（陷阱 2）。
await Promise.all(cpuWorkers.map((w) => w.terminate()));
console.log('  两个 CPU worker 已 terminate()，线程资源已释放。');

// ---------------------------------------------------------------------------
// 4. 错误处理：worker 内部抛异常
// ---------------------------------------------------------------------------

console.log('--- 4. worker 错误处理 ---');

const errorCode = `
  const { parentPort } = require('node:worker_threads');
  parentPort.postMessage('准备抛错');
  // 未捕获的同步异常会触发主线程的 'error' 事件。
  throw new Error('worker 内部故意抛出的异常');
`;

const faulty = new Worker(errorCode, { eval: true });

// 先收一条正常消息，再收错误。
faulty.on('message', (msg) => {
  console.log('  收到 worker 的普通消息：', msg);
});

// 'error' 事件必须监听。不监听的话，Node 会把它当成未捕获异常，
// 直接让主进程崩溃（陷阱 6）。
//
// 这里**不能**用 events.once(faulty, 'exit')：那个工具函数在等待某个事件期间
// 若收到 'error'，会直接 reject 掉它返回的 Promise。而 worker 抛错后 'exit'
// 紧接着就会来，于是 await 会把原始错误当成"未捕获异常"重新抛出，主进程照样崩。
// 所以这里用 EventEmitter 自带的 .once() 方法，只监听 'exit' 这一个事件。
const faultyError = new Promise((resolve) => faulty.once('error', resolve));
const faultyExit = new Promise((resolve) => faulty.once('exit', (code) => resolve(code)));

// 注意两个监听器都在上面**同步**注册完毕，之后才 await，因此不会漏事件。
const workerErr = await faultyError;
console.log('  捕获到 worker 错误：', workerErr.message);
const faultyExitCode = await faultyExit;
console.log('  抛错后 worker 退出码 =', faultyExitCode, '（非 0 表示异常结束）');
console.log('  => 主进程安然无恙，这就是把危险计算隔离到 worker 的额外好处。');

// ---------------------------------------------------------------------------
// 5. terminate() 强制结束一个还在忙的 worker
// ---------------------------------------------------------------------------

console.log('--- 5. terminate() 强制结束 ---');

// 这个 worker 会一直循环下去——如果不 terminate，脚本永远不退出。
const busyCode = `
  const { parentPort } = require('node:worker_threads');
  parentPort.postMessage('开始长时间计算');
  // 故意写一个很长的循环，模拟"跑不完的任务"。
  let i = 0;
  while (true) { i += 1; }
`;
// 注意：上面这个 while(true) 无法被内部打断，只能从外部 terminate。

const busy = new Worker(busyCode, { eval: true });

// 等它发出"我开始忙了"的信号。
await once(busy, 'message');
console.log('  worker 已开始长时间计算。');

// 从外部强制结束它。terminate() 返回 Promise，resolve 出退出码。
const exitCode = await busy.terminate();
console.log('  terminate() 返回的退出码 =', exitCode, '（Node 文档规定为 1）');
console.log('  => 能强制结束的关键在于：线程虽然共享内存，但可以被宿主强制中断。');
console.log('     这也是 worker 相对"主线程里写死循环"的最大优势——后者只能杀进程。');

// ---------------------------------------------------------------------------
// 6. 选型：什么时候该用 worker_threads
// ---------------------------------------------------------------------------

console.log('--- 6. 选型建议 ---');
console.log('  用 worker_threads：CPU 密集的纯计算（转码、压缩、加密、大 JSON 解析）');
console.log('  用 child_process ：要跑别的程序、需要崩溃隔离、需要独立的依赖版本');
console.log('  用异步 I/O       ：读写文件、访问网络——本来就由操作系统异步完成，无需线程');
console.log('  用 cluster       ：想把 HTTP 服务铺满多核（每个核一个进程，各自监听同一端口）');
console.log(`  数量上限         ：本机 os.availableParallelism() = ${os.availableParallelism()}`);
console.log('  => 一句话：worker 是用来"并行计算"的，不是用来"并发等待"的。');
console.log('     把 I/O 丢给 worker 只会白增复杂度（陷阱 1）。');

console.log('--- 全部演示结束 ---');
