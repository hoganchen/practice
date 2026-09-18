/**
 * ============================================================================
 * 知识点：长任务与主线程调度 —— 50ms 长任务、INP 影响、分片让出、
 *           setTimeout/setImmediate/queueMicrotask 的让出差异、
 *           requestIdleCallback 与 scheduler.yield()
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/05_loop_performance.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 在浏览器里是【单线程】的：渲染、样式计算、布局、
 *    事件回调、你的业务代码，全都排在同一条主线程上。
 *    所谓"长任务（long task）"，就是【连续占用主线程超过 50ms 而不归还】的
 *    一段执行过程。只要它在跑，其它任何事情都只能等：
 *    点击没反应、输入框打不出字、动画掉帧、页面像卡死了一样。
 *    调度（scheduling）就是主动把长任务切碎、在片段之间把主线程还回去。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 一次性渲染 5000 条数据 → 页面白屏 2 秒，用户以为崩了；
 *    - 一个大的 JSON 解析 / 排序 / 加解密同步执行 → 输入框输入时明显卡顿；
 *    - 页面加载时同步执行一堆初始化 → 首屏可见时间被推迟；
 *    - 用户点了按钮，界面 800ms 后才给出反馈 → 用户会重复点击；
 *      INP（Interaction to Next Paint）指标就是这么被拉高的。
 *    这些问题在开发机上常常感觉不到（机器快、数据少），
 *    一到低端手机或大数据量场景就集中爆发。
 *
 * 3. 核心语法要点
 *
 *    (1) 长任务的判定与危害
 *        · 阈值 50ms 来自 RAIL 模型与 Long Tasks API：
 *          浏览器认为一次交互在 100ms 内给出反馈，用户就感觉是"即时"的；
 *          而这 100ms 里要留出渲染时间，于是留给 JS 的预算大约是 50ms。
 *        · 超过 50ms 的任务会被 PerformanceObserver 的 'longtask' 类型观察到
 *          （仅浏览器支持）。
 *        · 危害不是"总耗时"，而是【最长单次阻塞】——
 *          用户感受到的卡顿由最长的那一次阻塞决定。
 *
 *    (2) INP（Interaction to Next Paint）
 *        INP 衡量的是：用户的一次交互（点击/按键/点按）到页面【下一次绘制】
 *        之间的时间。它包含三部分：
 *          输入延迟（主线程正忙，事件排队等着）+ 事件处理耗时 + 渲染呈现。
 *        其中"输入延迟"往往是大头，而输入延迟的直接来源就是【长任务】。
 *        所以降低 INP 最有效的办法之一，就是把长任务拆短。
 *
 *    (3) 让出主线程的几种方式（本示例的核心对比）
 *
 *        queueMicrotask / Promise.then  —— 【不让出主线程】
 *          微任务在当前宏任务结束后、【同一个事件循环轮次内】立刻清空。
 *          它比下一个宏任务更早执行，但它【不会】让浏览器有机会去渲染。
 *          结论：用微任务做分片是【无效】的 —— 用户依然会卡。
 *          它适合"尽快执行，但不希望阻塞太久"的场景，不适合让出。
 *
 *        setTimeout(fn, 0)  —— 【让出主线程】
 *          把 fn 排进定时器队列，作为一个新的【宏任务】。
 *          浏览器/Node 有机会在这一轮和下一轮之间做别的事（浏览器里就是渲染）。
 *          注意：0 不是"立刻"，有最小延迟（浏览器通常被钳制到约 4ms，
 *          Node 里是约 1ms），而且本身有排队开销。
 *
 *        setImmediate(fn)  —— 【让出主线程】（Node 特有）
 *          在事件循环的 check 阶段执行，也就是"本轮 I/O 之后"。
 *          它的设计目的就是"让出当前轮次"，通常比 setTimeout(0) 更快返回，
 *          但它【只有 Node 有】，浏览器里不存在。
 *
 *        MessageChannel / postMessage  —— 浏览器里让出的经典技巧，
 *          比 setTimeout(0) 更快（不受 4ms 钳制），但本仓库运行在 Node，
 *          这里只提一下不演示。
 *
 *        scheduler.yield()  —— 【新标准，最推荐】
 *          专门为"让出主线程"设计的 API，返回一个 Promise，
 *          并且在让出后【优先恢复】自己的续体（避免被其它任务插队太久）。
 *          目前只有 Chromium 系支持，必须做特性检测。Node 里没有。
 *
 *        requestIdleCallback(cb)  —— 【在帧末空闲时执行】
 *          浏览器 API，回调里拿到一个 IdleDeadline，可以问"还剩多少空闲时间"。
 *          适合"不重要、可以延后"的工作（埋点上报、预取、缓存清理）。
 *          三大局限（务必记住）：
 *            ① 【可能永远不触发】：只要主线程一直忙，空闲时间就不会出现；
 *            ② 只在浏览器有，Node 里不存在；
 *            ③ 执行时机不可控，绝不能用来做对时效有要求的事情。
 *          所以它必须配一个 setTimeout 兜底（本示例演示这个模式）。
 *
 *    (4) 分片（chunking）的通用模式
 *        把一个 N 次循环拆成"每片 M 次"，片与片之间让出：
 *
 *          async function chunkedProcess(items, chunkSize, onProgress) {
 *            for (let i = 0; i < items.length; i += chunkSize) {
 *              const end = Math.min(i + chunkSize, items.length);
 *              for (let j = i; j < end; j++) { ... }   // 一片的工作
 *              await yieldToMain();                     // 把主线程还回去
 *            }
 *          }
 *
 *        片大小的选择是个权衡：
 *          · 太大 → 仍然是长任务，等于没拆；
 *          · 太小 → 让出次数暴增，调度开销反过来拖慢总时长。
 *        经验值：每片控制在【5ms 以内】的工作量，而不是固定条数 ——
 *        条数对应的时间取决于每条有多重。
 *
 * 4. 常见陷阱
 *    - 陷阱一：以为 await Promise.resolve() 就是"让出主线程"。
 *      它只是让出【当前函数】，事件循环轮次没变，渲染依然没机会发生。
 *      这是最常见的错误认知。
 *    - 陷阱二：以为 setTimeout(fn, 0) 的 0 是真的 0。
 *      实际有最小延迟和排队成本，滥用会让总耗时显著变长。
 *    - 陷阱三：把大任务切得太碎。让出本身有成本，
 *      切成一万片可能比不切还慢。
 *    - 陷阱四：用 requestIdleCallback 做有时效要求的事。
 *      它可能永远不触发 —— 必须有兜底。
 *    - 陷阱五：只在开发机上验证。开发机快，50ms 的预算根本用不完，
 *      必须在低端设备或降低 CPU 倍率下测试。
 *    - 陷阱六：以为分片能"让总耗时变短"。
 *      分片几乎总是让【总耗时变长】（多了调度开销），
 *      它的目标是让【最长阻塞变短】，改善的是响应性，不是吞吐量。
 *      这个取舍必须先想清楚。
 *
 * 【关于运行环境的重要说明】
 *   本示例运行在 Node.js 中，因此：
 *     · setTimeout / setImmediate / queueMicrotask 都可以真实演示；
 *     · requestIdleCallback 和 scheduler.yield() 【在 Node 中不存在】，
 *       本示例会做特性检测并打印检测结果，同时给出浏览器端的用法代码，
 *       但不会假装它们可用；
 *     · 浏览器特有的"渲染/掉帧"无法在 Node 里演示，
 *       本示例用"定时器能否按时执行"作为主线程是否被阻塞的【代理指标】。
 *       ——这正是一个实用技巧：主线程忙时，连 setTimeout 都会被推迟。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/14_long_tasks_and_scheduling.js
 *
 * 【预期输出】
 *   8 个小节：长任务的产生与观测、长任务如何推迟定时器（阻塞的实证）、
 *   三种让出原语的对比、微任务不让出的反例、
 *   完整的分片处理演示（观察片与片之间的让出）、
 *   requestIdleCallback 的用法与局限、scheduler.yield() 的特性检测、
 *   以及长任务优化的实践清单。
 *   全程使用 await 顺序执行，不挂起，一秒内结束。
 * ============================================================================
 */

const scriptStart = performance.now();

// ---------------------------------------------------------------------------
// 0. 通用工具
// ---------------------------------------------------------------------------

/** 让出主线程：把续体排成一个新的宏任务（Node 用 setImmediate，浏览器退回 setTimeout） */
function yieldToMain() {
  return new Promise((resolve) => {
    if (typeof setImmediate === 'function') {
      setImmediate(resolve); // Node：check 阶段，本轮 I/O 之后
    } else {
      setTimeout(resolve, 0); // 浏览器：退回宏任务
    }
  });
}

/**
 * 用一段纯计算模拟"忙碌工作"，参数是迭代次数。
 *
 * 设计要点（这直接决定了"按时间切分片"准不准）：
 *   1) 每次迭代的运算量必须【恒定】，不能随 i 变大而变贵。
 *      如果写成 (i * 31) % 7，当 i * 31 超过 Smi（小整数）表示范围后，
 *      V8 会改用双精度浮点表示，单次迭代成本突然变高好几倍 ——
 *      于是"用 20 万次迭代校准出来的速度"根本代表不了"1 亿次迭代的速度"。
 *      这里用 i % 256 把值域钉死在 0~255，保证每次迭代成本一致。
 *   2) 结果必须返回并被外部使用，否则可能被死代码消除整个删掉
 *      （参见 11_benchmark_basics.js 里讲的死代码消除陷阱）。
 */
function busyWork(iterations) {
  let acc = 0;
  for (let i = 0; i < iterations; i++) {
    acc = (acc + ((i % 256) * 3)) & 0xffffff; // 值域恒定，成本稳定
  }
  return acc;
}

/** 汇总变量：让校准和分片的计算结果都有"可观察的用途"，防止被优化掉 */
let workSink = 0;

/**
 * 校准：测出"多少次迭代大约等于 1 毫秒"。
 * 这样才能按【时间】而不是按【条数】来切分片 —— 这才是正确的切法。
 *
 * 注意这里做了两件在基准测试里必须做的事（见 11_benchmark_basics.js）：
 *   · 先【预热】：第一次调用 busyWork 时 V8 还在解释执行，测出来偏慢；
 *   · 把结果累加进 workSink：否则整段循环可能被死代码消除优化掉，
 *     于是"最小值"会小得离谱，校准出来的速度虚高好几倍。
 *
 * ⚠ 但必须诚实地说：这种校准【只能给出一个粗略的初值】。
 *   实测会发现，同一台机器上"跑 1000 万次的单次速度"和
 *   "跑 1 亿次的单次速度"可以差出 30%~50%，因为循环规模不同会
 *   影响 V8 的优化决策、寄存器分配与缓存行为，再加上机器本身的抖动。
 *   所以本示例并不指望校准值一次就准，而是在分片过程中【自适应修正】——
 *   见第 5 节的正例演示。
 */
function calibrateIterationsPerMs() {
  const probe = 10_000_000; // 探测规模要够大，单次耗时才有统计意义

  // 预热：先跑几轮，让 V8 完成编译优化
  for (let i = 0; i < 2; i++) workSink += busyWork(probe);

  // 正式测量：取 5 轮的中位数（抗离群值）
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    const r = busyWork(probe);
    const elapsed = performance.now() - t0;
    workSink += r; // ← 关键：结果被使用，循环不能被优化掉
    if (elapsed > 0) samples.push(elapsed);
  }
  if (samples.length === 0) return probe; // 兜底：极快的机器上可能全测成 0
  samples.sort((a, b) => a - b);
  return probe / samples[Math.floor(samples.length / 2)];
}

const ITER_PER_MS = calibrateIterationsPerMs();
const ms2iter = (ms) => Math.max(1, Math.round(ms * ITER_PER_MS));

console.log('--- 0. 环境校准 ---');
console.log(`  本机约 ${Math.round(ITER_PER_MS).toLocaleString('en-US')} 次简单循环迭代 ≈ 1 毫秒`);
console.log('  （这个数字因机器而异；下面的分片按【时间】切，而不是按固定条数切。）');
console.log(`  Node 版本：${process.version}`);

// ---------------------------------------------------------------------------
// 1. 什么是长任务
// ---------------------------------------------------------------------------

console.log('\n--- 1. 什么是长任务（long task）---');
console.log('');
console.log('  定义：连续占用主线程【超过 50ms】而不归还的一段执行过程。');
console.log('');
console.log('  50ms 这个数字是怎么来的（RAIL 模型）：');
console.log('    用户感觉"即时响应"的阈值大约是 100ms；');
console.log('    这 100ms 里要给渲染留时间，于是留给 JS 的预算就是约 50ms。');
console.log('    所以超过 50ms 的任务，就有明显概率让用户感觉到卡。');
console.log('');
console.log('  危害的关键：【最长的那一次阻塞】决定用户的体感，');
console.log('    而不是所有阻塞的总和。所以优化的目标是"削峰"，不是"降总量"。');
console.log('');

// 制造一个明显的长任务
const LONG_MS = 80;
const longStart = performance.now();
const longResult = busyWork(ms2iter(LONG_MS));
const longElapsed = performance.now() - longStart;

console.log(`  实测：一个约 ${LONG_MS}ms 的计算任务，实际耗时 ${longElapsed.toFixed(1)} ms`);
console.log(`    ${longElapsed > 50 ? '→ 超过 50ms，这是一个典型的长任务。' : '→ 未超过 50ms（本机很快，属于正常波动）。'}`);
console.log(`    （校验值 ${longResult}，确保计算真的发生了）`);
console.log('');
console.log('  在这段时间里，主线程完全被占住：');
console.log('    · 用户的点击事件只能排队等着，不会有任何反馈；');
console.log('    · 定时器回调会被推迟；');
console.log('    · 浏览器无法进行样式计算与渲染 → 页面冻结；');
console.log('    · 动画直接掉帧（因为绘制也没机会执行）。');

// ---------------------------------------------------------------------------
// 2. 实证：长任务会推迟定时器（用定时器延迟作为"主线程被占"的探针）
// ---------------------------------------------------------------------------

console.log('\n--- 2. 实证：长任务期间，定时器会被明显推迟 ---');
console.log('');
console.log('  思路：主线程忙的时候，连 setTimeout 都无法按时执行 ——');
console.log('        所以"定时器实际触发的延迟"就是一个很好的主线程繁忙探针。');
console.log('        （在浏览器里，这个被推迟的东西本来会是"渲染"。）');
console.log('');

// 先测量"空闲状态下"定时器的基准延迟
async function measureTimerDelayWhileIdle() {
  const t0 = performance.now();
  await new Promise((resolve) => setTimeout(resolve, 0));
  return performance.now() - t0;
}

// 再测量"长任务进行中"定时器的延迟
async function measureTimerDelayDuringLongTask() {
  const t0 = performance.now();
  // 先排一个 0ms 定时器，然后立刻开始一段长任务
  const timerDone = new Promise((resolve) => setTimeout(resolve, 0));
  busyWork(ms2iter(LONG_MS)); // ← 长任务：定时器只能干等
  await timerDone;
  return performance.now() - t0;
}

const idleDelay = await measureTimerDelayWhileIdle();
const busyDelay = await measureTimerDelayDuringLongTask();

console.log(`  空闲时，setTimeout(0) 的触发延迟 ≈ ${idleDelay.toFixed(1)} ms`);
console.log(`  长任务进行中，同一个 setTimeout(0) 的延迟 ≈ ${busyDelay.toFixed(1)} ms`);
console.log('');
console.log(`  被推迟了约 ${(busyDelay - idleDelay).toFixed(1)} ms —— 这正是"主线程被占住"的直接证据。`);
console.log('');
console.log('  换算到浏览器里：');
console.log('    这段时间里本来应该发生的【渲染】也被同样推迟了。');
console.log('    用户看到的就是"点了没反应"、"页面卡住不动"。');
console.log('');
console.log('  ⚠ 具体数值因环境而异，这里看的是"被推迟"这个结构性事实，不是精确值。');

// ---------------------------------------------------------------------------
// 3. 让出主线程的三种原语
// ---------------------------------------------------------------------------

console.log('\n--- 3. 三种让出原语的执行顺序对比 ---');
console.log('');

// 用一个精心构造的顺序实验来说明差异
const order = [];

async function primitiveOrderExperiment() {
  order.length = 0;
  order.push('① 同步开始');

  // 微任务：会在【当前宏任务结束】后立刻执行，不让出事件循环轮次
  queueMicrotask(() => order.push('③ queueMicrotask（微任务）'));
  Promise.resolve().then(() => order.push('③b Promise.then（微任务）'));

  // 定时器：新的宏任务
  setTimeout(() => order.push('⑤ setTimeout(0)（宏任务/定时器阶段）'), 0);

  // setImmediate：Node 特有，事件循环的 check 阶段
  if (typeof setImmediate === 'function') {
    setImmediate(() => order.push('⑥ setImmediate（宏任务/check 阶段）'));
  }

  order.push('② 同步继续');
  // 这里 await 一个已 resolve 的 Promise，续体本身也是微任务
  await null;
  order.push('④ await null 之后的续体（也是微任务）');
}

await primitiveOrderExperiment();

// 等所有宏任务跑完，再打印顺序
await new Promise((resolve) => setTimeout(resolve, 10));

console.log('  实际执行顺序：');
for (const step of order) console.log(`    ${step}`);
console.log('');
console.log('  怎么读这个顺序：');
console.log('    · 微任务（③④）紧跟在当前同步代码之后、【同一轮】执行完 ——');
console.log('      整段过程是一个连续的宏任务，【中间没有把主线程还回去】；');
console.log('    · 宏任务（⑤⑥）各自是【新的一轮】，中间才是真正让出的位置。');
console.log('');
console.log('  【结论一】想让出主线程，必须使用【宏任务】，不能用微任务。');
console.log('  【结论二】await 本身不等于让出 —— await 一个已 resolve 的值，');
console.log('            它的续体只是被排成了微任务，事件循环轮次没有变化。');
console.log('            这是本节最容易被误解的一点。');
console.log('  【补充】setImmediate(⑥) 排在 setTimeout(0)(⑤) 前面，是 Node 特有的顺序：');
console.log('            setImmediate 在本轮事件循环的 check 阶段执行，');
console.log('            而 setTimeout 要到下一轮的 timers 阶段。');
console.log('            在浏览器里两者顺序可能相反，所以【不要依赖这个顺序】。');

// ---------------------------------------------------------------------------
// 4. 反例：用微任务分片是无效的
// ---------------------------------------------------------------------------

console.log('\n--- 4. 反例：用微任务分片"看似让出"，实际毫无用处 ---');
console.log('');

const microChunks = 6;
const microChunkMs = 12;

// 分片版本，但用 microtask 让出（错误示范）
const microStart = performance.now();
const microGaps = []; // 「让出」之后到下一次开始干活之间的间隔
const microChunkTimes = []; // 每一片自身的工作耗时
let microPrev = performance.now();
for (let c = 0; c < microChunks; c++) {
  const chunkStart = performance.now();
  busyWork(ms2iter(microChunkMs)); // 每片约 20ms 的工作量
  microChunkTimes.push(performance.now() - chunkStart);

  await null; // ← 让出方式：微任务（错误做法）

  const now = performance.now();
  microGaps.push(now - microPrev);
  microPrev = now;
}
const microTotal = performance.now() - microStart;

console.log(`  用 await null（微任务）分片 ${microChunks} 片，每片按校准值估算约 ${microChunkMs}ms：`);
console.log('');
console.log('  片号'.padEnd(8) + '本片耗时(ms)'.padEnd(18) + '「让出」后到下一片的间隔(ms)');
console.log('  ' + '-'.repeat(56));
for (let c = 0; c < microChunks; c++) {
  console.log(`  ${String(c + 1).padEnd(6)}${microChunkTimes[c].toFixed(1).padEnd(18)}${microGaps[c].toFixed(1)}`);
}
console.log('');
console.log(`    总耗时 ${microTotal.toFixed(1)} ms`);
console.log('');
console.log('  关键看最后一列：它【等于本片耗时加上下一片耗时】——');
console.log('  也就是说，"让出"之后立刻又继续干活了，中间没有任何空隙，');
console.log('  主线程从头到尾没被还回去过，用户依然会看到一整个卡顿期。');
console.log('');
console.log('  为什么：微任务队列会在当前宏任务结束后【一次性全部清空】，');
console.log('  中间不会插入渲染，也不会处理其它宏任务。');
console.log('  所以：微任务适合"尽快做完的小事"，绝不能用来做分片让出。');

// ---------------------------------------------------------------------------
// 5. 正例：用宏任务分片，观察真实的让出间隙
// ---------------------------------------------------------------------------

console.log('\n--- 5. 正例：用宏任务分片，主线程真正被让出 ---');
console.log('');

const MACRO_CHUNKS = 8;
const MACRO_CHUNK_MS = 12; // 每片的目标耗时
const TOTAL_ITER = MACRO_CHUNKS * ms2iter(MACRO_CHUNK_MS);

console.log(`  任务：处理总共约 ${MACRO_CHUNKS * MACRO_CHUNK_MS}ms 的计算量。`);
console.log('  方式一：一口气跑完（不切）');
console.log(`  方式二：切成 ${MACRO_CHUNKS} 片，每片目标约 ${MACRO_CHUNK_MS}ms，片间用 setImmediate 让出`);
console.log('');

// 5.1 一口气跑完
const solidStart = performance.now();
busyWork(TOTAL_ITER);
const solidElapsed = performance.now() - solidStart;
console.log(`  【方式一】一口气跑完：`);
console.log(`    总耗时 ${solidElapsed.toFixed(1)} ms`);
console.log(`    最长连续阻塞 ≈ ${solidElapsed.toFixed(1)} ms`);
console.log(`    ${solidElapsed > 50 ? '→ 这是一个长任务，期间用户交互全部被卡住。' : '→ 未超过 50ms（本机很快）。'}`);

// 5.2 分片跑完，并记录片间间隙
console.log('');
console.log('  【方式二】分片跑完，观察每一片之间的让出：');

const chunkGaps = [];
const chunkDurations = [];
const chunkIterations = []; // 记录每一片实际做了多少次迭代（用于展示自适应过程）
let sink = workSink; // 从校准累积的 sink 继续，确保所有中间结果都是"被使用的"

// 用一个变量保存"下一片打算做多少次迭代"，初始值来自校准。
// 后面每一片跑完，都会用实测耗时反过来修正它 —— 这就是【自适应分片】。
let iterPerChunk = ms2iter(MACRO_CHUNK_MS);

for (let c = 0; c < MACRO_CHUNKS; c++) {
  const before = performance.now();
  sink += busyWork(iterPerChunk);
  const afterChunk = performance.now();
  const duration = afterChunk - before;

  chunkDurations.push(duration);
  chunkIterations.push(iterPerChunk);

  // 【自适应修正】根据这一片的实测耗时，调整下一片的迭代次数。
  // 用 0.5 的阻尼系数做平滑，避免因为单次抖动来回震荡。
  if (duration > 0.05 && c < MACRO_CHUNKS - 1) {
    const ideal = iterPerChunk * (MACRO_CHUNK_MS / duration);
    const smoothed = iterPerChunk * 0.5 + ideal * 0.5;
    iterPerChunk = Math.max(1, Math.round(smoothed));
  }

  // ← 这里才是真正的"让出主线程"：续体被排成新的宏任务
  await yieldToMain();

  const afterYield = performance.now();
  chunkGaps.push(afterYield - afterChunk);
}

const chunkTotal = chunkDurations.reduce((a, b) => a + b, 0) + chunkGaps.reduce((a, b) => a + b, 0);
const maxChunk = Math.max(...chunkDurations);

console.log('');
console.log(
  '  片号'.padEnd(8) +
    '本片迭代次数'.padEnd(18) +
    '本片耗时(ms)'.padEnd(18) +
    '与目标偏差'.padEnd(16) +
    '让出间隙(ms)',
);
console.log('  ' + '-'.repeat(78));
for (let c = 0; c < MACRO_CHUNKS; c++) {
  const dev = chunkDurations[c] - MACRO_CHUNK_MS;
  const devStr = `${dev >= 0 ? '+' : ''}${dev.toFixed(1)} ms`;
  console.log(
    `  ${String(c + 1).padEnd(6)}` +
      chunkIterations[c].toLocaleString('en-US').padEnd(18) +
      chunkDurations[c].toFixed(1).padEnd(18) +
      devStr.padEnd(16) +
      chunkGaps[c].toFixed(1),
  );
}
console.log('');
console.log(`  校验值 sink = ${sink}（确保所有分片的工作确实执行了）`);
console.log('');
console.log('  看"本片迭代次数"这一列：它在【自己调整】。');
console.log(`    第一片用的是校准值 ${chunkIterations[0].toLocaleString('en-US')} 次，`);
console.log('    如果实测偏慢（耗时超过目标），下一片就减少迭代次数；');
console.log('    如果实测偏快，下一片就增加迭代次数。几片之后基本就收敛到目标附近了。');
console.log('');
console.log('  这就是【自适应分片】，也是实际项目里应该采用的写法：');
console.log('    不要相信一次校准就能得到准确的"每毫秒多少次迭代"——');
console.log('    同一台机器上，循环规模不同、JIT 状态不同、机器负载不同，');
console.log('    单次迭代的成本可以差出几十个百分点（本示例的实测就印证了这一点）。');
console.log('    正确做法是：用一个粗初值起步，然后【按实测耗时持续修正】。');
console.log('');
console.log('  完整写法（可以直接抄）：');
console.log('');
console.log('      let iter = 初始估算值;');
console.log('      for (let c = 0; c < 总片数; c++) {');
console.log('        const t0 = performance.now();');
console.log('        doWork(iter);');
console.log('        const dur = performance.now() - t0;');
console.log('        if (dur > 0.05) {');
console.log('          // 用 0.5 的阻尼系数平滑，避免单次抖动造成震荡');
console.log('          iter = Math.round(iter * 0.5 + iter * (目标ms / dur) * 0.5);');
console.log('        }');
console.log('        await yieldToMain();   // ← 让出必须用宏任务');
console.log('      }');
console.log('');
console.log('  两种方式的对比：');
console.log('');
console.log('  指标'.padEnd(26) + '一口气跑完'.padEnd(20) + '分片跑完');
console.log('  ' + '-'.repeat(66));
console.log('  总耗时(ms)'.padEnd(24) + solidElapsed.toFixed(1).padEnd(20) + chunkTotal.toFixed(1));
console.log('  最长连续阻塞(ms)'.padEnd(20) + solidElapsed.toFixed(1).padEnd(20) + maxChunk.toFixed(1));
console.log('  让出次数'.padEnd(25) + String(0).padEnd(20) + String(MACRO_CHUNKS));
console.log('');
console.log('  关键结论（这个取舍必须先想清楚）：');
console.log(`    · 分片后【总耗时基本持平或略长】（${solidElapsed.toFixed(1)}ms → ${chunkTotal.toFixed(1)}ms），`);
console.log('      因为每次让出都有调度开销 —— 分片不会让计算变快；');
console.log(`    · 但【最长连续阻塞从 ${solidElapsed.toFixed(1)}ms 降到了约 ${maxChunk.toFixed(1)}ms】，`);
console.log('      这才是分片真正买到的东西：响应性。');
console.log('    · 用户不再需要等一整段跑完才能得到反馈，');
console.log('      每两片之间，浏览器都有机会处理输入和渲染一帧。');
console.log('');
console.log('  片大小怎么选：');
console.log('    · 目标是"每片控制在 5ms 以内"，这样留给渲染的预算才够；');
console.log('    · 不要按"固定条数"切，因为每条数据的处理成本可能差很多；');
console.log('    · 按【时间】切，并且用【上一片的实测耗时】动态修正下一片的大小；');
console.log('    · 也不要切得太碎 —— 让出本身有成本，片太小会让总耗时明显上升。');
console.log('');
console.log('  ⚠ 本示例的数值因机器与运行状态而异，请只看"最长阻塞大幅下降"这个结构事实。');

// ---------------------------------------------------------------------------
// 6. requestIdleCallback：用法与三大局限
// ---------------------------------------------------------------------------

console.log('\n--- 6. requestIdleCallback：帧末空闲时执行 ---');
console.log('');

const hasRIC = typeof globalThis.requestIdleCallback === 'function';
console.log(`  当前环境是否支持 requestIdleCallback：${hasRIC ? '支持' : '不支持'}`);
console.log('');
if (!hasRIC) {
  console.log('  Node.js 里【没有】这个 API —— 它是浏览器特有的，');
  console.log('  因为它依赖"帧"和"渲染"这两个概念，而 Node 没有渲染。');
  console.log('  所以本节只讲用法，不做真实执行。');
}
console.log('');
console.log('  浏览器里的基本用法：');
console.log('');
console.log('      // 请求一段空闲时间来做不紧急的工作');
console.log('      const handle = requestIdleCallback((deadline) => {');
console.log('        // deadline.timeRemaining() 返回"这一帧还剩多少空闲毫秒"');
console.log('        // deadline.didTimeout  表示是否因为超时被强制调用');
console.log('        while (deadline.timeRemaining() > 1 && tasks.length > 0) {');
console.log('          doSmallTask(tasks.shift());   // 只做"还剩时间"的那部分');
console.log('        }');
console.log('        if (tasks.length > 0) {');
console.log('          requestIdleCallback(processTasks);   // 还有剩就下一帧继续');
console.log('        }');
console.log('      }, { timeout: 2000 });   // timeout：最多等 2000ms 就强制执行');
console.log('');
console.log('      // 需要时可以取消');
console.log('      cancelIdleCallback(handle);');
console.log('');
console.log('  适合用它做的事（共同点：不紧急、可延后、可被打断）：');
console.log('    · 埋点/日志的批量上报；');
console.log('    · 预取下一步可能要用的数据；');
console.log('    · 清理过期的缓存条目；');
console.log('    · 渐进式地渲染次要内容。');
console.log('');
console.log('  【三大局限】必须记住：');
console.log('    ① 可能永远不触发 —— 只要主线程一直有活干，就永远没有"空闲时间"。');
console.log('       所以【必须有 setTimeout 兜底】，否则这段逻辑可能永远不执行；');
console.log('    ② 只有浏览器有，Node / Worker 之外的很多环境都没有；');
console.log('    ③ 执行时机完全不可控，绝不能用来做对时效有要求的事');
console.log('       （比如"用户点击后必须 100ms 内响应"）。');
console.log('');
console.log('  兜底模式（实际项目里应该这么写）：');
console.log('');
console.log('      let done = false;');
console.log('      function runOnce() {');
console.log('        if (done) return;');
console.log('        done = true;');
console.log('        doTheWork();');
console.log('      }');
console.log('      if (typeof requestIdleCallback === "function") {');
console.log('        requestIdleCallback(runOnce, { timeout: 1000 });');
console.log('      }');
console.log('      setTimeout(runOnce, 1000);   // ← 兜底：保证最多等 1 秒一定会执行');
console.log('');
console.log('  顺带一提：timeout 选项本身也能起到兜底作用，');
console.log('  但显式再加一个 setTimeout 更直观，也更容易在不同环境间移植。');

// ---------------------------------------------------------------------------
// 7. scheduler.yield()：新标准
// ---------------------------------------------------------------------------

console.log('\n--- 7. scheduler.yield()：为"让出"专门设计的 API ---');
console.log('');

const hasSchedulerYield = typeof globalThis.scheduler?.yield === 'function';
console.log(`  当前环境是否支持 scheduler.yield()：${hasSchedulerYield ? '支持' : '不支持'}`);
console.log('');
if (!hasSchedulerYield) {
  console.log('  Node 里没有 scheduler API（它属于浏览器的 Prioritized Task Scheduling）。');
  console.log('  本示例用特性检测确认了这一点，并回退到 setImmediate ——');
  console.log('  这正是实际项目里应该采用的可移植写法。');
}
console.log('');
console.log('  它解决什么问题：');
console.log('    用 setTimeout(0) / setImmediate 让出时，你的续体要重新排队，');
console.log('    很可能被后续涌入的其它任务【插队】，导致自己的任务迟迟跑不完。');
console.log('    scheduler.yield() 让出的续体享有【更高的恢复优先级】，');
console.log('    不会被后到的任务无限期插队 —— 这被称为"不被饿死的让出"。');
console.log('');
console.log('  用法（返回 Promise，可以直接 await）：');
console.log('');
console.log('      async function processInChunks(items) {');
console.log('        for (let i = 0; i < items.length; i += CHUNK) {');
console.log('          const end = Math.min(i + CHUNK, items.length);');
console.log('          for (let j = i; j < end; j++) handle(items[j]);');
console.log('');
console.log('          // 优先用 scheduler.yield()，不支持则回退');
console.log('          if (globalThis.scheduler?.yield) {');
console.log('            await scheduler.yield();');
console.log('          } else {');
console.log('            await new Promise((r) => setTimeout(r, 0));');
console.log('          }');
console.log('        }');
console.log('      }');
console.log('');
console.log('  scheduler 上还有两个相关 API：');
console.log('    · scheduler.postTask(fn, { priority }) —— 按优先级调度任务，');
console.log('      priority 可取 "user-blocking" / "user-visible" / "background"；');
console.log('    · scheduler.wait(ms) —— 可被优先调度的 sleep。');
console.log('');
console.log('  现状提醒：scheduler.yield 目前主要是 Chromium 系支持，');
console.log('    Firefox / Safari 与 Node 都还没有，所以【必须做特性检测】。');

// 演示本示例实际使用的可移植让出函数
console.log('');
console.log('  本示例实际使用的可移植让出函数（见文件开头的 yieldToMain）：');
console.log('    它优先使用 setImmediate（Node），否则回退到 setTimeout（浏览器）。');
console.log('    在浏览器项目里，更稳妥的写法是三级回退：');
console.log('      scheduler.yield()  →  MessageChannel  →  setTimeout(0)');
const t0Portable = performance.now();
await yieldToMain();
console.log(`    实测一次让出耗时 ≈ ${(performance.now() - t0Portable).toFixed(1)} ms（约等于调度开销）`);

// ---------------------------------------------------------------------------
// 8. 实践清单
// ---------------------------------------------------------------------------

console.log('\n--- 8. 长任务优化的实践清单 ---');
console.log('');
console.log('  检查项'.padEnd(46) + '说明');
console.log('  ' + '-'.repeat(100));
const checklist = [
  ['先测量，再优化', '用 Performance 面板 / longtask 观察，找到真正的长任务'],
  ['按时间切片，不按条数切片', '每条数据成本不同，固定条数切出来的片时长会很不均匀'],
  ['每片控制在 5ms 以内', '给渲染留够预算，超过 50ms 就又变成新的长任务了'],
  ['让出必须用宏任务', 'await null / queueMicrotask 只是微任务，不会让出主线程'],
  ['不要在分片里做 console.log', 'I/O 开销可能比被测工作还大，会严重扭曲结果'],
  ['分片后必须重新测量总耗时', '分片会让总耗时变长，要确认这个代价可以接受'],
  ['requestIdleCallback 一定要有兜底', '它可能永远不触发'],
  ['scheduler.yield 必须特性检测', '兼容性有限，要有回退路径'],
  ['大数据量分页/虚拟化优先', '能不处理的数据就别处理，胜过任何调度技巧（见 15 号示例）'],
  ['在低端设备上验证', '开发机上 10ms 的任务，低端手机上可能变成 200ms'],
];
for (const [item, note] of checklist) {
  console.log(item.padEnd(44) + note);
}
console.log('');
console.log('  最重要的三条原则：');
console.log('    1. 长任务的危害看【最长阻塞】，优化目标是削峰，不是降总量；');
console.log('    2. 分片是用【总耗时】换【响应性】，这个取舍要明确；');
console.log('    3. 最好的优化是"不干活"—— 虚拟列表、分页、懒加载都优于调度技巧。');
console.log('');
console.log('  相关示例：');
console.log('    · 31_performance_and_memory/15_virtual_list.js —— 从源头减少工作量；');
console.log('    · 31_performance_and_memory/16_web_vitals.js   —— 测量 INP / 长任务；');
console.log('    · 31_performance_and_memory/07_batch_dom_updates.js —— 批量更新减少重排。');

console.log(`\n本示例总耗时约 ${(performance.now() - scriptStart).toFixed(0)} ms。`);
console.log('示例结束。');
