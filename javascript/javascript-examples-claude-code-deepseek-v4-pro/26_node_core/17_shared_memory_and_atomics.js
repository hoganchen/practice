/**
 * ============================================================================
 * 知识点：SharedArrayBuffer 与 Atomics —— 真正的多线程共享内存
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】高级
 * 【前置知识】26_node_core/14_worker_threads.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    · SharedArrayBuffer（简称 SAB）是一块**可以被多个线程同时读写**的内存。
 *      普通 ArrayBuffer 传给 worker 时会被"结构化克隆"复制一份，
 *      而 SharedArrayBuffer 传过去的是**同一块物理内存的引用**——
 *      任何一个线程写入，其他线程立刻就能读到。
 *    · Atomics 是一组**原子操作**函数。所谓原子，是指"读-改-写"这三步
 *      作为一个不可分割的整体完成，别的线程不可能插到中间。
 *      没有它，多个线程同时 `view[0] += 1` 就会丢更新（本文件第 1 节有实测）。
 *
 *    一句话总结：SAB 提供"能共享的内存"，Atomics 提供"能安全共享的规则"。
 *    两者必须成对使用——只有 SAB 而没有 Atomics，等于埋了一颗数据竞争的雷。
 *
 * 2. 为什么需要
 *    14_worker_threads.js 里已经看到，postMessage 走的是**结构化克隆**：
 *    数据被完整复制一份。这对"发一次任务、回一个结果"足够，
 *    但遇到下面两类场景就撑不住了：
 *
 *      · 高频、小块的通信。比如游戏物理引擎每帧要同步几千个坐标，
 *        用 postMessage 每帧序列化/反序列化一遍，克隆开销比计算本身还大。
 *      · 大块数据的原地共享。比如一块 100MB 的图像缓冲区，
 *        复制一次就是 100MB 的内存与时间；共享则两个线程看同一份。
 *
 *    典型真实场景：
 *      · 多线程图像/视频处理：worker 直接往共享的像素缓冲区里写
 *      · 音视频编解码的环形缓冲区
 *      · 高频数据采集（行情、传感器）：生产者写、消费者读，零拷贝
 *      · 并行计算的结果汇总：几十个 worker 往同一个累加器里 Atomics.add
 *
 * 3. 核心语法要点
 *    - new SharedArrayBuffer(byteLength)            创建共享内存
 *    - new SharedArrayBuffer(n, { maxByteLength })  可增长版本 + buffer.grow(n)
 *    - sab.byteLength / sab.growable / sab.maxByteLength
 *    - new Int32Array(sab) / new Uint8Array(sab, offset, len)
 *                                                   在同一块内存上建"视图"
 *    - Atomics.load(ta, i) / Atomics.store(ta, i, v)      原子读 / 原子写
 *    - Atomics.add / sub / and / or / xor(ta, i, v)       原子运算，**返回操作前的旧值**
 *    - Atomics.exchange(ta, i, v)                          原子换值，返回旧值
 *    - Atomics.compareExchange(ta, i, expected, replacement)
 *                                                   旧值等于 expected 才换，返回旧值
 *                                                   —— CAS，无锁算法的基石
 *    - Atomics.isLockFree(size)                     该字节宽度是否可无锁实现
 *    - Atomics.wait(ta, i, expectedValue[, timeout])  阻塞等待，**只有 worker 侧才该用**
 *                                                   返回 'ok' | 'not-equal' | 'timed-out'
 *    - Atomics.notify(ta, i[, count])               唤醒等待者，返回被唤醒的个数
 *    - Atomics 只接受**整数类型化数组**（Int8/Uint8/…/Int32/Uint32/BigInt64/BigUint64）
 *    - Atomics.wait 额外要求底层必须是 SharedArrayBuffer
 *
 * 4. 常见陷阱
 *    陷阱 1：以为有了 SAB 就万事大吉，仍然用普通 `view[0] += 1` 自增。
 *            读和写之间有窗口，多线程同时执行必然丢更新。必须用 Atomics.add。
 *    陷阱 2：Atomics.wait 不传超时。一旦对方因为异常/逻辑分支没有 notify，
 *            调用线程就**永久阻塞**，进程再也不会退出。本文件所有 wait 都带超时。
 *    陷阱 3：Atomics.wait 的第二个参数不是"我想等的值"，而是
 *            "我期望内存里现在还是这个值"。值已经变了就直接返回 'not-equal'，
 *            因此必须同时处理三种返回值，不能只写 if (ok)。
 *    陷阱 4：以为 notify 会"存起来"。notify 只唤醒**此刻正在等待**的线程；
 *            如果对方还没进入 wait，这次 notify 就丢了（但它随后 wait 时
 *            会因为值已经变化而返回 'not-equal'，所以并不会死等）。
 *            真正的死等只发生在"值没变、也没人 notify"的时候。
 *    陷阱 5：把通知标志位重置得太早。worker 被唤醒后要先读完数据，
 *            主线程才能把标志位清 0，否则会出现"读到一半被人清标志"的错乱。
 *            这类"生产者-消费者先后顺序"是共享内存编程里最常见的 bug。
 *    陷阱 6：在浏览器主线程调用 Atomics.wait —— 直接抛 TypeError，
 *            因为它会冻结 UI。Node 主线程**允许**调用（本文件在 Node 里演示），
 *            但同样会冻结当前线程的事件循环（第 4.4 节有实测），生产代码里要避免。
 *    陷阱 7：共享内存没有"所有权"概念，也没有生命周期管理。
 *            传给第三方库等于把进程内一块内存的读写权限交给它，
 *            要像对待 eval 一样谨慎。
 *    陷阱 8：SAB 的数量不是越多越好。每个 SAB 至少要占一页内存，
 *            且跨线程共享会带来缓存一致性开销。小数据用 postMessage 反而更快。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/17_shared_memory_and_atomics.js
 *
 * 【预期输出】
 *   1) 非原子自增的数据竞争实测（4 个线程各加 2000 次，总数却小于 8000）
 *      与 Atomics.add 的正确结果对比；
 *   2) SharedArrayBuffer 的创建、可增长特性、多视图共享同一块内存；
 *   3) Atomics 全部原子操作的语义演示（重点：都返回旧值）与 CAS 自旋锁；
 *   4) Atomics.wait / notify 的三种返回值，以及"不传超时 = 永久阻塞"的危害演示；
 *   5) 主线程与 worker 通过共享内存通信的完整示例（带超时保护）；
 *   6) 浏览器端 SharedArrayBuffer 的安全上下文与跨源隔离要求。
 *   所有 worker 都会被正确收尾，Atomics.wait 全部带超时，脚本不会挂起。
 * ============================================================================
 */

import { Worker } from 'node:worker_threads';
import { once } from 'node:events';

// ---------------------------------------------------------------------------
// 0. 环境与能力检测
// ---------------------------------------------------------------------------

console.log('--- 0. 环境与能力检测 ---');

// SharedArrayBuffer 在 Node.js 里是**内置且默认可用**的，不需要任何实验性开关。
// 它与浏览器不同：浏览器出于 Spectre 侧信道攻击的考虑默认禁用了它（见第 6 节），
// Node.js 则认为"文件系统/网络本来就在进程手里"，进程边界就是信任边界。
const HAS_SAB = typeof SharedArrayBuffer === 'function';
const HAS_ATOMICS = typeof Atomics === 'object' && typeof Atomics.wait === 'function';

console.log('  SharedArrayBuffer 是否可用：', HAS_SAB);
console.log('  Atomics 是否可用：', HAS_ATOMICS);
console.log('  当前进程是否处于"跨源隔离"环境（crossOriginIsolated）：', globalThis.crossOriginIsolated);
console.log('  Node 版本：', process.version, '（SAB 无需任何 --experimental 开关）');

if (!HAS_SAB || !HAS_ATOMICS) {
  // 降级路径：极老的运行时或特殊裁剪的构建可能没有这两个特性。
  // 教学示例必须能在这种情况下"优雅退出"而不是崩溃。
  console.log('  当前环境不支持 SharedArrayBuffer 或 Atomics，后续演示全部跳过。');
  console.log('  降级建议：改用 worker_threads 的 postMessage 传结构化克隆副本（见 14_worker_threads.js）。');
  console.log('--- 全部演示结束 ---');
} else {
  await main();

  console.log('--- 全部演示结束 ---');
}

async function main() {
  // -------------------------------------------------------------------------
  // 1. 为什么"普通的多线程共享内存"危险：数据竞争实测
  // -------------------------------------------------------------------------

  console.log('--- 1. 数据竞争实测：4 个线程各加 2000 次，结果却不是 8000 ---');

  // 先摆出结论，再看实验：
  //   JS 里 `view[0] = view[0] + 1` 在 CPU 层面是三条指令：
  //     ① LOAD  把内存值读进寄存器
  //     ② ADD   寄存器加一
  //     ③ STORE 把寄存器写回内存
  //   两个线程如果交错成 ①① ②② ③③，就会得到同一个结果：
  //   两边都读到 5，都写回 6，本该是 7 却只有 6 —— 这就是"丢更新"。
  //
  //   单线程里这件事永远不会发生（JS 是单线程执行模型），
  //   但 SharedArrayBuffer 把内存交给了多个线程，危险就出现了。

  const WORKER_COUNT = 4; // 4 个线程同时抢同一块内存
  const ITERATIONS = 2000; // 每个线程加多少次
  const SPIN = 60; // 竞争窗口放大系数（仅用于让演示可复现，见下方说明）

  // 非原子版本：读 -> 空转 -> 写回。
  // 中间那段空转是**故意**加进去的：真实代码里读和写之间只有几纳秒，
  // 竞争存在但难以稳定复现；这里人为把窗口拉长，让演示每次都能看到丢更新。
  // 请记住：放大窗口只是为了让现象可见，**窗口本身就存在于普通写法里**。
  const racyWorkerCode = `
    const { parentPort, workerData } = require('node:worker_threads');

    // 每个线程都自己 new 一个视图对象，但它们指向**同一块内存**。
    // 视图对象本身不共享，共享的是它背后的字节。
    const view = new Int32Array(workerData.sab);

    // 空转函数：累加一个局部变量，防止 JIT 把循环当成无用代码消除掉。
    let sink = 0;
    function burn(n) {
      for (let i = 0; i < n; i += 1) {
        sink += i & 1;
      }
    }

    // 起跑线屏障：先告诉主线程"我准备好了"，再在这里阻塞等待放行。
    // Atomics.wait(视图, 下标, 期望值, 超时)：
    //   内存里 [1] 号位置如果还是 0，就睡过去；变成非 0 就立刻醒来。
    // 这里同样给了 1000ms 超时兜底，绝不允许永久阻塞。
    parentPort.postMessage('ready');
    Atomics.wait(view, 1, 0, 1000);

    for (let i = 0; i < workerData.iterations; i += 1) {
      const cur = view[0];          // ① 读（普通读，不是原子读）
      burn(workerData.spin);        // ② 人为拉长的竞争窗口
      view[0] = cur + 1;            // ③ 写回（普通写，不是原子写）
    }

    // 用一个永远不成立的比较"消费"掉 sink，避免它被优化掉。
    if (sink === -1) parentPort.postMessage('never');

    parentPort.postMessage('done');
  `;

  // 原子版本：把"读-改-写"整体交给 Atomics.add。
  // 它由 CPU 的原子指令（如 x86 的 LOCK XADD）实现，
  // 执行期间其他核心无法访问这块内存，因此不可能交错。
  const atomicWorkerCode = `
    const { parentPort, workerData } = require('node:worker_threads');
    const view = new Int32Array(workerData.sab);

    parentPort.postMessage('ready');
    Atomics.wait(view, 1, 0, 1000);

    for (let i = 0; i < workerData.iterations; i += 1) {
      // Atomics.add(视图, 下标, 增量)：原子地加上增量，返回**加之前的旧值**。
      // 这里不需要返回值，只取副作用。
      Atomics.add(view, 0, 1);
    }

    parentPort.postMessage('done');
  `;

  const expected = WORKER_COUNT * ITERATIONS;
  console.log(`  预期正确结果：${WORKER_COUNT} 个线程 × ${ITERATIONS} 次 = ${expected}`);

  const racyTotal = await runRaceScenario(racyWorkerCode, WORKER_COUNT, ITERATIONS, SPIN);
  console.log(`  [非原子] view[0] = ${racyTotal}  ->  丢失了 ${expected - racyTotal} 次更新`);
  console.log('  => 丢失的次数每次运行都不同（这正是"竞争"的特征：结果不可预测）。');

  const atomicTotal = await runRaceScenario(atomicWorkerCode, WORKER_COUNT, ITERATIONS, SPIN);
  console.log(`  [原子]   view[0] = ${atomicTotal}  ->  分毫不差`);
  console.log('  => Atomics.add 把"读-改-写"变成了一个不可分割的整体。');
  console.log('  => 结论：SharedArrayBuffer 本身不安全，必须配合 Atomics 使用。');

  /**
   * 跑一轮竞争实验：启动 N 个 worker，用屏障让它们同时开始，最后收集结果。
   * 这个函数同时演示了共享内存编程里的两个固定套路：
   *   ① 起跑线屏障（barrier）：保证所有线程同时冲进临界区，否则先启动的线程早跑完了
   *   ② 共享内存 + 消息通道分工：数据走共享内存，控制信号走 postMessage
   */
  async function runRaceScenario(code, workerCount, iterations, spin) {
    // 8 字节 = 2 个 Int32 槽位：
    //   view[0] -> 计数器（被多个线程争抢的那个）
    //   view[1] -> 起跑线标志（0 = 未放行，1 = 放行）
    const sab = new SharedArrayBuffer(8);
    const view = new Int32Array(sab);

    const readyList = [];
    const exitList = [];
    const workers = [];

    for (let i = 0; i < workerCount; i += 1) {
      const worker = new Worker(code, {
        eval: true,
        // workerData 里放 SAB：跨线程传递时共享同一块内存，
        // 而放普通对象/数组则是复制副本（对比 14_worker_threads.js 的陷阱 3）。
        workerData: { sab, iterations, spin },
      });
      workers.push(worker);

      // 'error' 必须监听，否则 worker 内未捕获异常会让主进程崩掉。
      worker.on('error', (err) => console.error('  worker 出错：', err.message));

      // 每个 worker 的第一条消息是 'ready'，表示它已经准备就绪。
      readyList.push(once(worker, 'message'));
      exitList.push(new Promise((resolve) => worker.once('exit', resolve)));
    }

    // 等所有线程都就位。这一步是"事件驱动"的——不用 sleep，不用猜时间。
    await Promise.all(readyList);

    // 放行：先把标志位置 1，再 notify 唤醒所有在 Atomics.wait 里的线程。
    // 顺序很重要——必须先改值再通知，否则被唤醒的线程可能看到的还是旧值。
    Atomics.store(view, 1, 1);
    // notify(视图, 下标) 的第三个参数是"最多唤醒几个"，省略表示唤醒全部。
    Atomics.notify(view, 1);

    await Promise.all(exitList);

    // 实验结束后显式 terminate()，确保线程资源被释放。
    // worker 已经跑完了，terminate() 会立刻 resolve，不会报错。
    await Promise.all(workers.map((w) => w.terminate()));

    // 从共享内存里读回最终计数。
    return Atomics.load(view, 0);
  }

  // -------------------------------------------------------------------------
  // 2. SharedArrayBuffer 基础
  // -------------------------------------------------------------------------

  console.log('--- 2. SharedArrayBuffer 基础 ---');

  // 创建：参数是字节数，不是元素个数。
  const buffer = new SharedArrayBuffer(16);
  console.log('  新建 16 字节的 SAB，byteLength =', buffer.byteLength);

  // 与普通 ArrayBuffer 的第一个区别：SAB 可以"可增长"。
  // 第二个参数 maxByteLength 一旦给出，这块内存将来就能用 grow() 扩容。
  const growable = new SharedArrayBuffer(8, { maxByteLength: 32 });
  console.log('  可增长 SAB：byteLength =', growable.byteLength, '，maxByteLength =', growable.maxByteLength, '，growable =', growable.growable);
  growable.grow(24);
  console.log('  调用 grow(24) 之后：byteLength =', growable.byteLength);
  try {
    // 超过 maxByteLength 会抛 RangeError（这里只是演示，不扩到那么大）。
    growable.grow(64);
  } catch (err) {
    console.log('  grow 超过上限时抛错：', err.constructor.name, '-', err.message);
  }

  // 在同一个 SAB 上可以建多个不同类型的"视图"。
  // 视图对象是**每线程各自持有的普通 JS 对象**，只有它们指向的字节是共享的。
  // 这一点很关键：sharing 发生在字节层面，不在对象层面。
  const asInt32 = new Int32Array(buffer);
  const asUint8 = new Uint8Array(buffer);

  asInt32[0] = 0x01020304;
  console.log('  往 Int32 视图写 0x01020304 后，同一个 SAB 的 Uint8 视图读出：', Array.from(asUint8.slice(0, 4)));
  console.log('  => 同一块内存的两种解读方式（小端序：低位字节在前）');
  console.log('  => 两个视图对象互不相同，但 asInt32[0] 和 asUint8[0..3] 描述的是同一片字节。');

  // 视图还可以带偏移和长度，用来把一块大内存切成若干"字段区"。
  // 格式：new TypedArray(sab, byteOffset, elementCount)
  const sliceView = new Uint8Array(buffer, 4, 4);
  sliceView[0] = 0xff;
  console.log('  偏移 4 字节开始的 Uint8 视图，写入 0xff 后 asUint8[4] =', asUint8[4], '（同一个字节）');

  console.log('  SAB 与普通 ArrayBuffer 的关键差异：');
  console.log('    · ArrayBuffer：传给 worker 会被结构化克隆**复制**一份');
  console.log('    · SharedArrayBuffer：传过去的是**同一块内存**，谁写谁都能立刻看到');
  console.log('    · SharedArrayBuffer 无法被 detach（因为可能还有别的线程在用）');
  console.log('    · SharedArrayBuffer 一旦创建，大小固定（除非用了 maxByteLength 可增长模式）');

  // -------------------------------------------------------------------------
  // 3. Atomics 原子操作
  // -------------------------------------------------------------------------

  console.log('--- 3. Atomics 原子操作 ---');

  // 下面这些演示都是单线程的，目的是先看清**语义**（尤其是返回值），
  // 第 1 节已经证明过它们在多线程下的必要性。
  const cell = new Int32Array(new SharedArrayBuffer(64));

  Atomics.store(cell, 0, 10);
  console.log('  store(cell,0,10) 之后，load(cell,0) =', Atomics.load(cell, 0));

  // 重点：add / sub / and / or / xor / exchange / compareExchange
  //       **全部返回"操作之前的旧值"**，而不是新值。这是最容易记反的一点。
  console.log('  add(5)     返回旧值 ->', Atomics.add(cell, 0, 5), '，之后的值 =', Atomics.load(cell, 0));
  console.log('  sub(3)     返回旧值 ->', Atomics.sub(cell, 0, 3), '，之后的值 =', Atomics.load(cell, 0));

  Atomics.store(cell, 0, 0b1100);
  console.log('  当前值 = 0b1100（12）');
  console.log('  and(0b1010) 返回旧值 ->', Atomics.and(cell, 0, 0b1010), '，之后的值 =', Atomics.load(cell, 0).toString(2));
  console.log('  or(0b0001)  返回旧值 ->', Atomics.or(cell, 0, 0b0001), '，之后的值 =', Atomics.load(cell, 0).toString(2));
  console.log('  xor(0b1111) 返回旧值 ->', Atomics.xor(cell, 0, 0b1111), '，之后的值 =', Atomics.load(cell, 0).toString(2));

  console.log('  exchange(77) 返回旧值 ->', Atomics.exchange(cell, 0, 77), '，之后的值 =', Atomics.load(cell, 0));

  // compareExchange（CAS，Compare-And-Swap）是无锁数据结构的基石。
  // 语义："如果内存里现在恰好是 expected，就换成 replacement"，
  //       返回值永远是"换之前内存里的实际值"，据此可以判断自己有没有抢到。
  Atomics.store(cell, 0, 100);
  console.log('  当前值 = 100');
  console.log('  compareExchange(expected=100, replacement=200) 返回 ->', Atomics.compareExchange(cell, 0, 100, 200), '，之后的值 =', Atomics.load(cell, 0));
  console.log('  compareExchange(expected=100, replacement=300) 返回 ->', Atomics.compareExchange(cell, 0, 100, 300), '，之后的值 =', Atomics.load(cell, 0), '（预期值不匹配，什么都没换）');

  // 用 CAS 实现一个自旋锁，只需要看语义，不需要真的并发：
  //   lock[0] === 0 表示空闲，=== 1 表示已占用。
  //   compareExchange(lock, 0, 0, 1) 返回 0 说明"原来是空闲的，我成功锁上了"。
  const lock = new Int32Array(new SharedArrayBuffer(4));
  const tryAcquire = () => Atomics.compareExchange(lock, 0, 0, 1) === 0;
  const release = () => Atomics.store(lock, 0, 0);
  console.log('  自旋锁：第一次抢锁 =', tryAcquire(), '（成功）');
  console.log('  自旋锁：第二次抢锁 =', tryAcquire(), '（已被占用，失败）');
  release();
  console.log('  自旋锁：release() 之后再抢 =', tryAcquire(), '（成功）');
  console.log('  => 这就是互斥锁的核心。真实的自旋锁会配合 Atomics.wait 避免空转烧 CPU。');

  // isLockFree(size)：询问某种字节宽度在当前平台能否真正"无锁"实现。
  // 不能无锁时（比如某些 32 位平台上的 8 字节访问）引擎会用内部锁兜底，
  // 这时 Atomics 仍然正确，但性能会明显下降。
  console.log('  isLockFree：1 字节 =', Atomics.isLockFree(1), '，2 字节 =', Atomics.isLockFree(2), '，4 字节 =', Atomics.isLockFree(4), '，8 字节 =', Atomics.isLockFree(8));

  // 类型限制：Atomics 只接受**整数**类型化数组。
  // 浮点数没有原子的读-改-写语义（IEEE 754 的位模式不能做加法），所以直接被拒绝。
  try {
    const floats = new Float64Array(new SharedArrayBuffer(16));
    Atomics.load(floats, 0);
    console.log('  对 Float64Array 调用 Atomics.load -> 竟然成功了（不符合预期）');
  } catch (err) {
    console.log('  对 Float64Array 调用 Atomics.load 抛错：', err.message);
  }

  // -------------------------------------------------------------------------
  // 4. Atomics.wait / notify —— 线程间同步原语
  // -------------------------------------------------------------------------

  console.log('--- 4. Atomics.wait / notify ---');

  const waitBuf = new Int32Array(new SharedArrayBuffer(64));

  // 4.1 语法讲解
  console.log('  [4.1] 语法：');
  console.log('    Atomics.wait(视图, 下标, 期望值[, 超时毫秒])');
  console.log('      • 如果内存里该下标的值 === 期望值 -> 当前线程睡过去，等待被别人 notify');
  console.log('      • 如果值 !== 期望值              -> 立刻返回 "not-equal"，一秒都不等');
  console.log('      • 睡满超时时间还是没人叫醒       -> 返回 "timed-out"');
  console.log('      • 被 Atomics.notify 成功唤醒     -> 返回 "ok"');
  console.log('    Atomics.notify(视图, 下标[, 最多唤醒几个]) -> 返回实际被唤醒的线程数');
  console.log('    关键约束：wait 要求底层必须是 SharedArrayBuffer（普通 ArrayBuffer 会抛错）');

  // 4.2 超时返回
  console.log('  [4.2] 没人 notify 时，超时保护返回 timed-out：');
  {
    const started = Date.now();
    const status = Atomics.wait(waitBuf, 0, 0, 200);
    console.log(`    期望值 0、实际值 0、超时 200ms -> 返回 ${JSON.stringify(status)}，实际等了 ${Date.now() - started}ms`);
    console.log('    => 如果不传第四个参数，这一行会**永久卡住**，进程再也不会退出。');
  }

  // 4.3 值已经变了 -> not-equal 立刻返回
  console.log('  [4.3] 值已经变了，wait 立刻返回 not-equal：');
  {
    Atomics.store(waitBuf, 0, 42);
    const started = Date.now();
    const status = Atomics.wait(waitBuf, 0, 0, 200);
    console.log(`    期望值 0、实际值 42 -> 返回 ${JSON.stringify(status)}，只花了 ${Date.now() - started}ms`);
    console.log('    => 这个特性让"通知早于等待"也不会死锁：晚到的线程会看到值已变，直接放行。');
  }

  // 4.4 wait 会冻结整个线程（包括事件循环）
  console.log('  [4.4] wait 是"真阻塞"，会冻结当前线程的事件循环：');
  {
    let ticks = 0;
    // 每 5ms 想跑一次的探针，用来观察事件循环是否还在转。
    const probe = setInterval(() => {
      ticks += 1;
    }, 5);

    const started = Date.now();
    // 阻塞 150ms。注意这里的 5 号槽位没人会去改，所以必然走超时分支。
    Atomics.wait(waitBuf, 5, 0, 150);
    const blockedMs = Date.now() - started;
    clearInterval(probe);
    console.log(`    阻塞 ${blockedMs}ms 期间，5ms 的探针定时器触发了 ${ticks} 次`);
    console.log('    => 事件循环完全停摆。在服务端，这意味着这期间**所有**并发请求都被卡住。');

    // 解除阻塞后事件循环立刻恢复：重新挂一个同样的探针，它又能正常触发了。
    // 注意必须**重新** setInterval 一个探针——上面那个已经被 clearInterval 清掉了。
    let ticksAfter = 0;
    const probeAfter = setInterval(() => {
      ticksAfter += 1;
    }, 5);
    await new Promise((resolve) => setTimeout(resolve, 30));
    clearInterval(probeAfter);
    console.log(`    解除阻塞后，同样的探针在 30ms 内触发了 ${ticksAfter} 次 -> 事件循环已恢复`);
    console.log('    => Node 主线程允许调用 Atomics.wait（不像浏览器会抛 TypeError），');
    console.log('       但正因为它会冻结事件循环，主线程应尽量只用"带超时且极短"的 wait，');
    console.log('       长时间等待应当放到 worker 里做（见第 5 节）。');
  }

  // 4.5 类型限制：wait 只认共享内存
  try {
    // 普通 ArrayBuffer 上的视图：Atomics.load 允许，Atomics.wait 不允许。
    // 原因是"等待/唤醒"需要引擎管理一张跨线程的等待者队列，
    // 而普通 ArrayBuffer 可能被复制给别的线程，队列无从对应。
    const notShared = new Int32Array(new ArrayBuffer(16));
    console.log('  [4.5] 对普通 ArrayBuffer，Atomics.load 是允许的：', Atomics.load(notShared, 0));
    Atomics.wait(notShared, 0, 0, 10);
    console.log('    对普通 ArrayBuffer 调用 Atomics.wait -> 竟然成功了（不符合预期）');
  } catch (err) {
    console.log('  [4.5] 对普通 ArrayBuffer 调用 Atomics.wait 抛错：', err.message);
  }

  // -------------------------------------------------------------------------
  // 5. 完整示例：主线程与 worker 通过共享内存通信
  // -------------------------------------------------------------------------

  console.log('--- 5. 完整示例：共享内存 + Atomics.wait/notify 的跨线程通信 ---');

  // 内存布局设计（共享内存编程的第一步永远是"先定协议再写代码"）：
  //   字节偏移 0  (Int32[0]) -> READY   ：worker 写完结果后置 1
  //   字节偏移 4  (Int32[1]) -> RESULT  ：计算结果
  //   字节偏移 8  (Int32[2]) -> PROGRESS：进度百分比（本例中简单演示）
  // 用命名常量代替魔法数字，是避免"改了一处忘了另一处"的基本功。
  const INDEX = { READY: 0, RESULT: 1, PROGRESS: 2 };

  const sharedCode = `
    const { parentPort, workerData } = require('node:worker_threads');
    const ctrl = new Int32Array(workerData.sab);
    const I = workerData.index;

    function heavySum(seed) {
      let acc = 0;
      for (let i = 0; i < 400000; i += 1) {
        acc = (acc + Math.sqrt(i + seed)) % 1000000;
      }
      return acc;
    }

    parentPort.postMessage('worker 已启动，开始计算');

    // 用一小段延迟模拟"真正耗时的计算"，让主线程确实需要等待。
    setTimeout(() => {
      const value = heavySum(workerData.seed);

      // 发布顺序至关重要：**先写数据，再写标志位**。
      // 这里全部用 Atomics.store（而不是普通赋值），有两个好处：
      //   1. 写入本身是原子的，不会被别的线程看到"写了一半"的值
      //   2. 同一线程内的多个 Atomics 操作之间有全序关系，不会被重排
      Atomics.store(ctrl, I.RESULT, Math.round(value) % 1000000);
      Atomics.store(ctrl, I.PROGRESS, 100);
      Atomics.store(ctrl, I.READY, 1);

      // 唤醒正在等待的线程。count 省略 = 唤醒全部等待者。
      // notify 必须在**另一个线程**里调用才能唤醒对方——
      // 已经在 wait 中的线程自己是没有机会执行任何代码的。
      Atomics.notify(ctrl, I.READY);

      parentPort.postMessage('worker 已写入结果并发出 notify');
    }, workerData.delayMs);
  `;

  const sharedSab = new SharedArrayBuffer(64);
  const ctrl = new Int32Array(sharedSab);

  const sharedWorker = new Worker(sharedCode, {
    eval: true,
    workerData: { sab: sharedSab, index: INDEX, seed: 7, delayMs: 100 },
  });

  // 先把事件监听全部登记好，再进入阻塞等待。
  // 原因：主线程一旦进入 Atomics.wait，事件循环就停了，
  //       这期间 worker 发来的消息**不会被投递**，会排队等到解除阻塞之后。
  const workerEvents = [];
  sharedWorker.on('message', (msg) => workerEvents.push(`message: ${msg}`));
  sharedWorker.on('error', (err) => workerEvents.push(`error: ${err.message}`));
  const sharedExit = new Promise((resolve) => sharedWorker.once('exit', (code) => resolve(code)));

  console.log('  主线程：准备进入 Atomics.wait（带 2000ms 超时兜底）');
  const waitStarted = Date.now();
  // 三个参数分别是：视图、下标、期望值；第四个是超时。
  // 期望值写 0，意思是"如果 READY 还是 0（worker 还没写完），我就睡过去"。
  const waitStatus = Atomics.wait(ctrl, INDEX.READY, 0, 2000);
  const waitedMs = Date.now() - waitStarted;
  console.log(`  主线程：Atomics.wait 返回 ${JSON.stringify(waitStatus)}，等待了 ${waitedMs}ms`);

  if (waitStatus === 'ok' || waitStatus === 'not-equal') {
    // 两种"成功"路径：
    //   'ok'        -> 被 worker 的 notify 唤醒
    //   'not-equal' -> 进 wait 之前 worker 就已经写完了（通知早于等待）
    // 无论哪种，READY 都已经非 0，可以直接安全地读结果。
    const result = Atomics.load(ctrl, INDEX.RESULT);
    const progress = Atomics.load(ctrl, INDEX.PROGRESS);
    console.log(`  主线程：从共享内存读到 RESULT = ${result}，PROGRESS = ${progress}%`);
    console.log('  => 结果是通过共享内存直接读的，没有经过任何序列化/反序列化。');
  } else {
    console.log('  主线程：等待超时（timed-out），worker 可能出问题了。');
  }

  // 现在事件循环恢复，之前排队的消息会被投递出来。
  const exitCode = await sharedExit;
  console.log(`  worker 退出码 = ${exitCode}`);
  console.log('  主线程在此期间收到的事件（注意它们都是"解除阻塞之后"才被投递的）：');
  for (const line of workerEvents) {
    console.log('    ·', line);
  }
  console.log('  => 这说明：Atomics.wait 阻塞的这段时间，主线程连自己的消息队列都处理不了。');

  // 收尾：worker 代码已经跑完，terminate() 保证线程资源被释放。
  await sharedWorker.terminate();

  // 5.1 对比：同样的事情用 postMessage 做需要什么
  console.log('  [5.1] 共享内存 vs postMessage 的取舍：');
  console.log('    共享内存：零拷贝，但你要自己设计内存布局、标志位、同步协议，还要防竞争');
  console.log('    postMessage：自动处理同步，但每次通信都要序列化+反序列化（结构化克隆）');
  console.log('    经验法则：数据在 1KB 以下 -> 用 postMessage 更省心；');
  console.log('              数据很大或通信极频繁 -> 用 SharedArrayBuffer，并保证所有读写都走 Atomics');

  // -------------------------------------------------------------------------
  // 6. 安全上下文与跨源隔离（浏览器）
  // -------------------------------------------------------------------------

  console.log('--- 6. 为什么浏览器默认禁用 SharedArrayBuffer ---');

  console.log('  本进程（Node）的 crossOriginIsolated =', globalThis.crossOriginIsolated, '（Node 环境没有这个概念）');
  console.log('  Node 里 SAB 一直可用，因为"进程边界 = 信任边界"，共享内存没有跨信任域泄漏的问题。');
  console.log('');
  console.log('  但浏览器里完全是另一回事，这是本知识点最容易被忽略的一节：');
  console.log('    1. 2018 年 1 月，Spectre 漏洞公开。它的核心是"基于时间的侧信道攻击"：');
  console.log('       攻击者用高精度计时反复测量某段内存的访问快慢，');
  console.log('       就能推断出本该无权访问的数据内容。');
  console.log('    2. 高精度计时器 + 共享内存 = 完美的攻击工具。');
  console.log('       因此 Chrome / Firefox / Safari 在 2018 年 1 月一起**默认禁用**了 SharedArrayBuffer，');
  console.log('       同时也把 performance.now() 的精度调粗。');
  console.log('    3. 同年 7 月，规范给出了恢复方案：**跨源隔离（Cross-Origin Isolation）**。');
  console.log('       页面必须同时声明两个响应头，才被认定为"隔离"的：');
  console.log('         Cross-Origin-Opener-Policy: same-origin      （COOP）');
  console.log('         Cross-Origin-Embedder-Policy: require-corp   （COEP）');
  console.log('       前者切断与其它源的 window.opener 引用，后者要求所有子资源显式声明 CORS/CORP。');
  console.log('       两者合力，就能保证这个页面里没有"别源的代码"能一起跑，从而安全地拿回 SAB。');
  console.log('    4. 页面里用 globalThis.crossOriginIsolated 判断是否拿到了权限。');
  console.log('       Node 里它是 undefined —— 所以同一段代码在两端的行为并不一致。');
  console.log('    5. 工程上的连带影响很实际：开了 COEP: require-corp 之后，');
  console.log('       所有 `<img>`、`<script>`、字体、iframe 都必须带跨源头，');
  console.log('       否则会直接加载失败。用第三方 CDN 资源前一定要先确认。');
  console.log('');
  console.log('  小结：写同构代码（浏览器 + Node 共用）时，必须对 SAB 做特性检测，');
  console.log('        并准备一条"降级成 postMessage"的路径，不能假设它一定存在。');

  // -------------------------------------------------------------------------
  // 7. 心智模型总结
  // -------------------------------------------------------------------------

  console.log('--- 7. 心智模型与选型总结 ---');
  console.log('  1. SharedArrayBuffer = 能共享的内存；Atomics = 让共享变安全的规则。两者缺一不可。');
  console.log('  2. 只有 Atomics 方法（以及通过 Atomics.wait/notify 建立的顺序关系）才能保证跨线程正确性；');
  console.log('     普通读写即使在 SAB 上也依然会竞争。');
  console.log('  3. 共享内存编程的三条铁律：');
  console.log('       ① 先定内存布局协议，再写代码（用命名常量，别用魔法下标）');
  console.log('       ② 一个标志位只由一个线程负责写，其他线程只读（单一写者原则）');
  console.log('       ③ 所有 Atomics.wait 都必须带超时，宁可超时后报错，也不要永久挂起');
  console.log('  4. 优先选择"不共享"的方案：postMessage 的结构化克隆虽然慢，但不会写出数据竞争。');
  console.log('     只有在实测确认通信/拷贝开销成为瓶颈时，才引入 SharedArrayBuffer。');
}
