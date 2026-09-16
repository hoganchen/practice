/**
 * ============================================================================
 * 知识点：node:perf_hooks —— mark/measure、PerformanceObserver 与分位数统计
 * ============================================================================
 *
 * 【所属分类】37_debugging_and_profiling —— 调试与性能剖析
 * 【难度等级】进阶
 * 【前置知识】31_performance_and_memory/11_benchmark_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:perf_hooks 是 Node 对 W3C User Timing / Performance Timeline 规范的
 *    实现，核心是三样东西：
 *      · performance（高精度、单调递增的计时器 + 打点 API）
 *      · PerformanceObserver（异步订阅性能条目，跨模块收集数据）
 *      · 若干运行时指标（事件循环延迟、GC 事件、计时器化函数）
 *    它解决的不是"这段代码快不快"（那是 31 章基准测试的事），
 *    而是"这个系统在真实运行时，各个阶段分别花了多久"。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 一个 HTTP 请求进来，想拆开看"解析参数 / 查数据库 / 调外部服务 / 序列化"
 *      各占多少时间 —— 用 mark/measure 打点，一眼看出瓶颈在哪一段；
 *    - 想把耗时指标送进监控系统，但不希望业务代码里到处 console.log ——
 *      用 PerformanceObserver 统一订阅，业务代码只管打点；
 *    - 生产环境排查"偶发卡顿"：monitorEventLoopDelay 记录事件循环延迟分布，
 *      能证明"是同步阻塞而不是下游慢"；
 *    - 制定 SLO：要的是 p95/p99 而不是平均值，需要自己会算分位数。
 *
 * 3. 核心语法要点
 *    (1) performance.now()：返回相对 performance.timeOrigin（进程启动时刻）
 *        的高精度毫秒数，【单调递增】，不受系统时间调整影响。
 *        Date.now() 是墙上时钟，可读、但可能跳变，且只有毫秒分辨率。
 *    (2) performance.mark(name[, { detail }])：在时间轴上插一个命名标记，
 *        产生一条 entryType 为 'mark' 的条目。
 *    (3) performance.measure(name, startMark, endMark)：测量两个标记之间的
 *        时间差，产生 entryType 为 'measure' 的条目；也可以传
 *        [startMark, endMark] 数组，或 { start, end, duration, detail } 对象。
 *    (4) performance.getEntriesByName / getEntriesByType / getEntries：
 *        查询已产生的条目；clearMarks / clearMeasures 清理，防止数组无限增长。
 *    (5) PerformanceObserver：订阅条目，回调【异步】触发（微任务之后），
 *        所以观测到的数据要等一拍才能读到；takeRecords() 可以手动取出队列。
 *    (6) performance.timerify(fn)：把函数包一层，自动产生 'function' 条目，
 *        免去手工打点。它也能测 async 函数（实测：会覆盖到 await 期间的耗时）。
 *    (7) monitorEventLoopDelay({ resolution })：以直方图形式统计事件循环延迟，
 *        是判断"服务卡顿是不是自己同步代码阻塞的"最直接证据。
 *
 * 4. 常见陷阱
 *    - 陷阱一：拿 performance.now() 的绝对值当时间戳用。它相对进程启动，
 *      两个进程之间没有可比性；要绝对时间用 performance.timeOrigin + now。
 *    - 陷阱二：只统计平均值。延迟类数据几乎总是长尾分布，平均值会被
 *      少数慢请求拉高，掩盖"1% 的用户慢 20 倍"这个真正的问题。
 *    - 陷阱三：以为 PerformanceObserver 的回调是同步的。它是异步的，
 *      打完点立刻读回调里的数组往往是空的，要等一个 setImmediate。
 *    - 陷阱四：只打点不清空。measure/mark 条目会一直存在内存里，
 *      长期运行的服务需要在收集后 clear，否则就是一条稳定的内存增长曲线。
 *    - 陷阱五：把 timerify 用在每秒几万次的热点函数上。包装本身有开销，
 *      而且每条 entry 都要分配对象，观测行为本身会显著影响被测对象。
 *    - 陷阱六：混淆 duration 与"墙上时钟耗时"。如果期间进程被挂起
 *      （休眠、被调试器暂停），performance.now() 仍然会走——它测的是
 *      "时钟流逝"而不是"CPU 占用"。
 *
 * 【关于本示例的数字】
 *    涉及真实测量的地方，本示例只打印"量级分档"和结构性结论
 *    （如"毫秒级""是否超过标称值"），不打印具体耗时——因为具体数值
 *    会随机器、负载、Node 版本剧烈波动，不具备可比性。
 *    只有在【完全确定性】的数据集上（自己构造的分布），才打印精确分位数。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 37_debugging_and_profiling/04_perf_hooks.js
 *
 * 【预期输出】
 *   打印 7 个小节：单调时钟、mark/measure 基础、PerformanceObserver、
 *   测量异步操作与 timerify、分位数与直方图、事件循环延迟监控、陷阱清单。
 * ============================================================================
 */

import { performance, PerformanceObserver, timerify, createHistogram, monitorEventLoopDelay } from 'node:perf_hooks';

const SCRIPT_START = Date.now();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// 0. 通用小工具
// ---------------------------------------------------------------------------

function section(n, title) {
  console.log(`\n--- ${n}. ${title} ---`);
}

/**
 * 把耗时归到"量级分档"里。
 * 刻意不打印具体毫秒数：绝对耗时随机器和负载剧烈波动，没有可比性；
 * "属于哪个量级"才是稳定、可讨论的信息。
 */
function magnitude(ms) {
  if (ms < 1) return '亚毫秒级（< 1ms）';
  if (ms < 10) return '毫秒级（1 ~ 10ms）';
  if (ms < 100) return '十毫秒级（10 ~ 100ms）';
  if (ms < 1000) return '百毫秒级（100ms ~ 1s）';
  return '秒级以上（> 1s）';
}

// ---------------------------------------------------------------------------
// 1. 单调时钟：performance.now() 与 Date.now() 的根本区别
// ---------------------------------------------------------------------------

section(1, '单调时钟：performance.now() vs Date.now()');

console.log('三个关键量：');
console.log(`  performance.now()      = ${performance.now().toFixed(3)}  ← 相对"进程启动"的毫秒数`);
console.log(`  performance.timeOrigin = ${performance.timeOrigin}  ← 进程启动那一刻的 Unix 时间戳`);
console.log(`  Date.now()             = ${Date.now()}  ← 当前的墙上时钟`);
console.log('');
const skewMs = Date.now() - (performance.timeOrigin + performance.now());
console.log('结构关系永远成立：timeOrigin + now ≈ Date.now()');
console.log(`  本次实测两者相差 ${Math.round(skewMs)} 毫秒（接近 0 即符合预期；`);
console.log('  若期间系统时钟被 NTP 校正过，这个差值就会是那个校正量）。');
console.log('');
console.log('两者的分工：');
console.log('  计时（测量耗时）→ 一律用 performance.now()，原因有二：');
console.log('    ① 分辨率高：微秒/纳秒级，而 Date.now() 只有毫秒且常被系统调低精度；');
console.log('    ② 单调递增：即使系统时间被 NTP 或用户改动，它也只会向前走，');
console.log('       所以"结束时间 - 开始时间"永远不会算出负数；');
console.log('  表达"某个时刻"→ 用 Date.now()/new Date()，因为人看得懂、能跨进程比较。');
console.log('');
console.log('正因为 performance.now() 是"相对进程启动"的，它的绝对值本身没有意义：');
console.log('  两个进程的 performance.now() 不能互相比较，只能各自做差。');
console.log('  要跨进程对齐时间，就用 timeOrigin + now 换算成 Unix 时间戳。');
console.log('');
console.log('（微基准里"为什么不能用 Date.now()、为什么必须预热"见');
console.log('  31_performance_and_memory/11_benchmark_basics.js，这里不重复。）');

// ---------------------------------------------------------------------------
// 2. mark / measure 基础
// ---------------------------------------------------------------------------

section(2, 'mark / measure：给代码打点');

// 2.1 基本用法：名字 + 可选的 detail（任意值，用于携带上下文）
performance.mark('phase:parse:start', { detail: { phase: 'parse', requestId: 'req-001' } });

// 模拟一段工作
let parsedSum = 0;
for (let i = 0; i < 200_000; i++) parsedSum += i % 7;

performance.mark('phase:parse:end');
// 测量两个标记之间的距离；命名建议 <阶段>:<对象>:<动作>，方便后续聚合
performance.measure('phase:parse', 'phase:parse:start', 'phase:parse:end');

const parseEntry = performance.getEntriesByName('phase:parse', 'measure')[0];
console.log('打点之后，performance 里多了一条 measure 条目，它的字段是：');
console.log(`  name       = ${parseEntry.name}`);
console.log(`  entryType  = ${parseEntry.entryType}`);
console.log(`  startTime  = 一个相对进程启动的毫秒数（具体值随运行时刻变化，这里不打印）`);
console.log(`  duration   = 一个毫秒级小数，本示例只归到量级：${magnitude(parseEntry.duration)}`);
console.log(`  detail     = ${JSON.stringify(parseEntry.detail)}`);
console.log('');
console.log('注意：duration 的具体数值本示例刻意少看——它在不同机器上能差几倍。');
console.log('  有意义的是【量级】和【各阶段之间的相对占比】。');
console.log('');

// 2.2 mark 可以带 detail，measure 也可以；detail 是排查时的重要上下文
performance.mark('phase:fetch:start', { detail: { url: '/api/users' } });
await sleep(5); // 模拟一次 I/O
performance.mark('phase:fetch:end');
performance.measure('phase:fetch', 'phase:fetch:start', 'phase:fetch:end');

// 2.3 measure 的另一种合法写法：传一个"选项对象"
performance.measure('phase:fetch（对象写法）', {
  start: 'phase:fetch:start',
  end: 'phase:fetch:end',
  detail: { note: '这次调用是通过对象形式创建的' },
});

console.log('同一个区间可以用两种写法创建 measure：');
const fetchMeasures = performance
  .getEntriesByType('measure')
  .filter((e) => e.name.startsWith('phase:fetch'));
for (const e of fetchMeasures) {
  console.log(`  ${e.name.padEnd(26)} entryType=${e.entryType}，startTime/endTime 都是绝对时间点`);
}
const fetchDurations = fetchMeasures.map((e) => e.duration);
const sameInterval = Math.max(...fetchDurations) - Math.min(...fetchDurations) < 1e-6;
console.log(`  两种写法指向同一对标记，duration 完全一致吗？ ${sameInterval}（差值 < 0.000001 毫秒）`);
console.log('  （这里刻意比较"是否一致"而不是打印具体毫秒数：');
console.log('    真实测量的绝对值会随机器和负载波动，不具备可比性。）');
console.log('');

// 2.4 【实测陷阱】传数组不会报错，但结果完全不是你想要的
//     因为数组也是"对象"，会被当成 PerformanceMeasureOptions 解析，
//     而它没有 start / end 字段 → 退化成"从时间 0 到现在"。
const trapEntry = performance.measure('一个踩坑的 measure', ['phase:fetch:start', 'phase:fetch:end']);
console.log('陷阱演示：performance.measure(name, [startMark, endMark])');
console.log(`  这条 measure 的 startTime = ${trapEntry.startTime}  ← 不是标记的时间，而是 0！`);
console.log(`  它的 duration ≈ 进程启动到现在（约 ${Math.round(trapEntry.duration)} ms）`);
console.log('  原因：Node 把第二个参数当【选项对象】解析（数组也是对象），');
console.log('        而 ["a","b"] 上没有 start / end 属性，于是区间变成了 "0 → 现在"。');
console.log('  它【不会抛错】，只是悄悄给出错误的结果——这类问题最难排查。');
console.log('  结论：要测区间，就用 measure(name, startMark, endMark) 或');
console.log('        measure(name, { start, end })，不要传数组。');
console.log('  另外：如果 start/end 指向一个不存在的标记，Node 会抛出');
console.log('        "The \\"xxx\\" performance mark has not been set"，这一点倒是很安全。');
console.log('');
console.log('查询与清理的三个 API：');
console.log(`  getEntries().length              = ${performance.getEntries().length}  ← 全部条目`);
console.log(`  getEntriesByType('measure').length = ${performance.getEntriesByType('measure').length}`);
console.log(`  getEntriesByName('phase:parse').length = ${performance.getEntriesByName('phase:parse').length}`);
console.log('');
console.log('重要：这些条目会一直留在内存里。长期运行的服务必须定期清理：');
performance.clearMarks('phase:parse:start');
performance.clearMarks('phase:parse:end');
performance.clearMeasures('phase:parse');
console.log(`  clearMarks / clearMeasures 之后，measure 条目数 = ${performance.getEntriesByType('measure').length}`);
console.log('  （不清的话，每秒处理 1000 个请求 × 每个 5 条打点 = 每天 4 亿条对象，');
console.log('    这本身就是一条教科书级的内存泄漏曲线。）');

// ---------------------------------------------------------------------------
// 3. PerformanceObserver：把"打点"和"收集"解耦
// ---------------------------------------------------------------------------

section(3, 'PerformanceObserver：订阅条目而不是到处 console.log');

const observedEntries = [];

// 观察者一：订阅 measure 条目
const measureObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    observedEntries.push({
      type: entry.entryType,
      name: entry.name,
      magnitude: magnitude(entry.duration),
    });
  }
});
// 注意：必须在产生条目【之前】开始观察，否则收不到
measureObserver.observe({ entryTypes: ['measure'] });

// 观察者二：订阅 timerify 产生的 function 条目（下一节会用到）
const functionEntries = [];
const functionObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    functionEntries.push({ name: entry.name, duration: entry.duration, args: entry.detail });
  }
});
functionObserver.observe({ entryTypes: ['function'] });

// 产生几条 entry 给观察者
performance.mark('observed:start');
for (let i = 0; i < 50_000; i++) parsedSum += i;
performance.mark('observed:end');
performance.measure('observed.work', 'observed:start', 'observed:end');

console.log('刚打完点，回调里收到的条目数（异步回调还没执行）：');
console.log(`  observedEntries.length = ${observedEntries.length}`);
console.log('  这就是最容易踩的坑：PerformanceObserver 的回调是【异步】的。');
console.log('');

// 让事件循环走一拍，回调才会被调用
await new Promise((resolve) => setImmediate(resolve));

console.log('等一个 setImmediate 之后：');
console.log(`  observedEntries.length = ${observedEntries.length}`);
for (const e of observedEntries) {
  console.log(`    [${e.type}] ${e.name} → ${e.magnitude}`);
}
console.log('');
console.log('为什么值得用观察者，而不是在业务代码里直接上报：');
console.log('  ① 解耦：业务代码只负责 performance.mark/measure，不关心"数据去哪"；');
console.log('  ② 统一出口：可以在这一处做采样、脱敏、批量上报、聚合；');
console.log('  ③ 可选开关：观察者不注册，打点的额外开销就只剩 mark 本身，');
console.log('     上线/下线观测能力不用改业务代码；');
console.log('  ④ 能观测"不是你自己打的点"：浏览器里的 resource、Node 里的 gc 等');
console.log('     都是引擎产生的条目，用同一个观察者就能拿到。');
console.log('');
console.log('补充：observer.takeRecords() 可以手动把队列里的条目立刻取出来（同步）；');
console.log('      不再需要观察时调用 observer.disconnect()，否则回调会一直挂着。');

// ---------------------------------------------------------------------------
// 4. 测量异步操作：await 前后打点 + timerify
// ---------------------------------------------------------------------------

section(4, '测量异步操作耗时');

// 4.1 分阶段测量一次"请求处理"
async function handleRequest(payload) {
  // 阶段一：解析
  performance.mark('req:parse:start');
  const parsed = JSON.parse(payload);
  performance.mark('req:parse:end');
  performance.measure('req.parse', 'req:parse:start', 'req:parse:end');

  // 阶段二：查数据库（异步）
  performance.mark('req:db:start');
  await sleep(10); // 模拟一次网络往返
  performance.mark('req:db:end');
  performance.measure('req.db', 'req:db:start', 'req:db:end');

  // 阶段三：序列化返回（异步函数的尾部同步代码）
  performance.mark('req:serialize:start');
  const body = JSON.stringify({ id: parsed.id, ok: true });
  performance.mark('req:serialize:end');
  performance.measure('req.serialize', 'req:serialize:start', 'req:serialize:end');

  return body;
}

// 整个请求的总耗时：前后各打一个点
performance.mark('req:total:start');
const responseBody = await handleRequest(JSON.stringify({ id: 42, items: [1, 2, 3] }));
performance.mark('req:total:end');
performance.measure('req.total', 'req:total:start', 'req:total:end');

console.log(`处理一次请求（响应体长度 ${responseBody.length} 字节），各阶段量级：`);
console.log('  阶段'.padEnd(24) + '量级');
console.log('  ' + '-'.repeat(56));
for (const name of ['req.parse', 'req.db', 'req.serialize', 'req.total']) {
  const entry = performance.getEntriesByName(name, 'measure').at(-1);
  console.log(`  ${name.padEnd(22)}${magnitude(entry.duration)}`);
}
console.log('');
console.log('分阶段打点的价值就在这张表里：total 被 db 阶段占满了（我们故意 sleep 了 10ms），');
console.log('  如果只测 total，你只知道"慢"，知道不了"慢在哪一步"。');
console.log('  真实项目里通常还会在 total 之外补一个"进程外时间"——');
console.log('  比如下游服务自己上报的耗时，用来区分"是下游慢"还是"我们等得久"。');

// 4.2 timerify：不想手工打点，就让包装器自动测
const timedParse = timerify(
  function timedParse(json) {
    return JSON.parse(json);
  },
  { detail: { op: 'json.parse' } },
);

const timedSum = timerify(function timedSum(n) {
  let s = 0;
  for (let i = 0; i < n; i++) s += i % 11;
  return s;
});

timedParse('{"a":1,"b":2}');
timedSum(100_000);

// timerify 也能包 async 函数，且实测能覆盖到 await 期间的整段耗时
const timedIo = timerify(async function timedIo() {
  await sleep(20);
  return 'ok';
});
await timedIo();

await new Promise((resolve) => setImmediate(resolve));
console.log('');
console.log('performance.timerify() 自动产生的 function 条目：');
console.log('  函数名'.padEnd(16) + '参数'.padEnd(16) + '量级');
console.log('  ' + '-'.repeat(56));
for (const e of functionEntries) {
  console.log(`  ${e.name.padEnd(14)}${JSON.stringify(e.args ?? []).padEnd(16)}${magnitude(e.duration)}`);
}
console.log('');
console.log('关于 timerify 的几个事实：');
console.log('  · 它返回一个包装后的新函数，原函数不变；');
console.log('  · 条目的 detail 是【调用时传入的参数数组】——方便区分不同入参的耗时，');
console.log('    但这也意味着参数会被 entry 强引用，传大对象时要留意内存；');
console.log('  · async 函数也能包（上表中 timedIo 的耗时覆盖了整个 await 期间）；');
console.log('  · 每条调用都会产生一个 entry 对象，热点函数上使用要谨慎，');
console.log('    或者用 { histogram } 选项让它直接记进直方图而不产生 entry。');

// ---------------------------------------------------------------------------
// 5. 分位数与直方图：为什么平均值会骗你
// ---------------------------------------------------------------------------

section(5, '分位数与直方图：延迟数据不能用平均值描述');

/**
 * 构造一个【完全确定性】的延迟数据集（用固定种子的伪随机数），
 * 这样分位数结果是稳定的、可复现的、可以放心打印精确值。
 * 分布形状：大部分请求在 15ms 左右，少数请求很慢（长尾），贴近真实服务。
 */
function buildLatencyDataset(size) {
  let seed = 20240916; // 固定种子 → 每次运行结果完全一致
  const nextUnit = () => {
    // 线性同余伪随机数，返回 [0,1)
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const values = [];
  for (let i = 0; i < size; i++) {
    const u = nextUnit();
    // 用 u^4 制造长尾：u 很小时结果接近基准值，u 接近 1 时出现少量大值
    values.push(Math.round(15 + 220 * u ** 4));
  }
  return values;
}

/** 最近秩（nearest-rank）法求分位数，也是监控系统里最常用的定义 */
function percentile(sortedValues, p) {
  const rank = Math.ceil((p / 100) * sortedValues.length);
  const index = Math.min(sortedValues.length - 1, Math.max(0, rank - 1));
  return sortedValues[index];
}

const SIZE = 2000;
const latencies = buildLatencyDataset(SIZE);
const sortedLatencies = [...latencies].sort((a, b) => a - b);
const sumLatency = latencies.reduce((a, b) => a + b, 0);
const meanLatency = sumLatency / SIZE;

console.log(`构造 ${SIZE} 个请求的延迟数据（确定性数据，结果可复现，单位毫秒）：`);
console.log(`  最小      = ${sortedLatencies[0]}`);
console.log(`  p50（中位数）= ${percentile(sortedLatencies, 50)}`);
console.log(`  p90       = ${percentile(sortedLatencies, 90)}`);
console.log(`  p95       = ${percentile(sortedLatencies, 95)}`);
console.log(`  p99       = ${percentile(sortedLatencies, 99)}`);
console.log(`  最大      = ${sortedLatencies[SIZE - 1]}`);
console.log(`  平均值    = ${meanLatency.toFixed(1)}`);
console.log('');
console.log('读这张表的三个要点：');
console.log('  ① 平均值（' + meanLatency.toFixed(1) + '）明显大于中位数（' + percentile(sortedLatencies, 50) + '）——');
console.log('     因为长尾把平均值拉高了；只报平均值的监控面板，');
console.log('     会让人以为"用户平均体验还行"，而实际上最慢的 1% 用户慢了十几倍。');
console.log('  ② p99 / p50 的比值才是"长尾有多严重"的度量：');
console.log(`     本例 p99/p50 = ${(percentile(sortedLatencies, 99) / percentile(sortedLatencies, 50)).toFixed(2)} 倍。`);
console.log('  ③ 分位数要"从同一批样本"里算。把两次不同时段的样本混在一起算 p99，');
console.log('     得到的是两个分布的混合，没有意义。');

// 用归一化的条形图看形状：把区间切成若干"相对 p50 的倍数"档
const p50 = percentile(sortedLatencies, 50);
const buckets = [
  { label: '≤ 1× p50', test: (v) => v <= p50 },
  { label: '1~2× p50', test: (v) => v > p50 && v <= p50 * 2 },
  { label: '2~5× p50', test: (v) => v > p50 * 2 && v <= p50 * 5 },
  { label: '> 5× p50', test: (v) => v > p50 * 5 },
];
console.log('');
console.log('分布形状（按"相对于 p50 的倍数"分档）：');
for (const bucket of buckets) {
  const count = latencies.filter(bucket.test).length;
  const pct = (count / SIZE) * 100;
  const bar = '█'.repeat(Math.round(pct / 2));
  console.log(`  ${bucket.label.padEnd(10)}${String(count).padStart(5)} 个 (${pct.toFixed(1).padStart(5)}%) ${bar}`);
}
console.log('');
console.log('这就是"延迟直方图"。它比任何单一数字都更能说明问题：');
console.log('  你能一眼看出"绝大多数请求都在 p50 附近，但有一小撮特别慢"。');

// 用 perf_hooks 自带的直方图做同样的统计
const hist = createHistogram();
for (const v of latencies) hist.record(v); // 注意：必须传整数，传小数会抛 ERR_OUT_OF_RANGE
console.log('');
console.log('performance.createHistogram()（Node 内置）给出的统计量：');
console.log(`  count=${hist.count} min=${hist.min} max=${hist.max} mean=${hist.mean.toFixed(1)}`);
console.log(`  p50=${hist.percentile(50)} p95=${hist.percentile(95)} p99=${hist.percentile(99)}`);
console.log('  （注意：内置直方图用的是另一种分位数定义，且只接受整数（最小值 1），');
console.log('    所以它和上面手算的最近秩结果可能有出入——');
console.log('    跨系统比较 SLO 时，一定要先对齐"分位数是怎么算的"。）');
console.log('');
console.log('timerify 的 histogram 选项也用的是同一套机制：');
console.log('  const fn = timerify(work, { histogram: createHistogram() });');
console.log('  跑一段时间后读 fn.histogram.percentile(99) 即可，不产生 entry 对象。');

// ---------------------------------------------------------------------------
// 6. 事件循环延迟：判断"卡顿是不是自己造成的"
// ---------------------------------------------------------------------------

section(6, 'monitorEventLoopDelay：事件循环延迟监控');

// 原理：定时器按 resolution 的频率应该准时被唤醒；
// 实际唤醒时间与预期时间的差，就是"事件循环被占用/阻塞了多久"。
const loopDelay = monitorEventLoopDelay({ resolution: 10 });
loopDelay.enable();

// 【重要】先让监控跑一小会儿，完成第一次采样、建立基准点。
// 实测发现：enable() 之后如果立刻阻塞（还没等到第一次采样），
// 这次阻塞有可能整个被漏掉——因为"延迟"是相邻两次采样的时间差，
// 基准点如果落在阻塞之后，这段阻塞就不在统计区间里了。
await sleep(50);

// 故意制造一次明显的同步阻塞，看看监控能不能抓到
const BLOCK_MS = 150;
const blockStart = performance.now();
while (performance.now() - blockStart < BLOCK_MS) {
  // 忙等 150ms，模拟一段"忘了异步化"的同步计算
}
// 【重要】阻塞期间，监控自己的定时器也被卡住了，它的回调要等循环空出来才会执行，
// 所以必须再等一会儿（让好几个采样周期过去）才能读到那次阻塞的记录。
await sleep(120);
await sleep(120);

loopDelay.disable();

const observedMaxMs = loopDelay.max / 1e6; // 直方图单位是纳秒
console.log('监控方式：每 10ms 期望被唤醒一次，记录"实际晚了多久"。');
console.log('  分辨率                     = 10 ms');
console.log(`  观测到明显阻塞吗（最长延迟 > 10ms）？ ${observedMaxMs > 10}`);
console.log(`  延迟达到"人为阻塞"的量级吗（> 100ms）？ ${observedMaxMs > 100}`);
console.log('  （本示例故意同步忙等了 150ms，所以答案是肯定的：');
console.log('    理论上界 = 阻塞时长，理论下界 ≈ 阻塞时长 − 分辨率。');
console.log('    具体延迟数值因机器而异，这里只看"能不能抓到"这个结构性问题。）');
console.log('');
console.log('这里藏着两个很容易踩的坑：');
console.log('  坑一：阻塞发生时，监控自己的定时器回调也被卡住了，那条"迟到了 150ms"');
console.log('        的记录要等事件循环空出来才会被写进直方图。所以读指标必须');
console.log('        【等几个采样周期之后】再读，否则会得到"一切正常"的假象；');
console.log('  坑二：enable() 之后如果立刻阻塞、还没等到第一次采样，这次阻塞可能');
console.log('        完全不被记录（本示例因此先 sleep(50) 让监控建立基准点）。');
console.log('  这两条合起来说明一件事：性能监控工具本身也需要"被观测的对象是活的"，');
console.log('  刚启动、刚开启监控的那一瞬间，数据是不可信的。');
console.log('');
console.log('事件循环延迟指标怎么用：');
console.log('  · 它测的是"Node 有没有被同步代码长时间占住"，与下游慢无关；');
console.log('  · 延迟高 + 接口慢 → 先怀疑自己代码里的同步阻塞（大循环、');
console.log('    同步 I/O、巨型 JSON.parse、复杂正则回溯）；');
console.log('  · 延迟正常 + 接口慢 → 问题在外部（下游服务、数据库、网络）；');
console.log('  · 生产环境把它作为常驻指标上报（p99 的 loop delay），');
console.log('    比 CPU 使用率更早地预警"服务要开始卡了"。');
console.log('');
console.log('还有一个常被忽略的细节：monitorEventLoopDelay 返回的是直方图对象，');
console.log('  它的单位是【纳秒】，和 performance.now() 的毫秒不是一个量纲，');
console.log('  换算时要除以 1e6。这个坑在真实项目里非常常见。');

// ---------------------------------------------------------------------------
// 7. 陷阱与清单
// ---------------------------------------------------------------------------

section(7, '陷阱与检查清单');

const checklist = [
  ['计时一律用 performance.now()', '单调时钟，不受系统时间调整影响，分辨率也更高'],
  ['performance.now() 只做差，不比绝对值', '它相对进程启动，跨进程比较没有意义'],
  ['打点后记得 clear', 'measure/mark 会累积在内存里，长期服务必须定期清理'],
  ['观察者回调是异步的', '打完点立刻读数组是空的，要等一个 setImmediate'],
  ['延迟指标看 p95/p99，不看平均', '长尾分布下平均值会掩盖少数极慢的请求'],
  ['分位数要锁定定义与样本窗口', '不同工具的算法不同，混用会得出错误结论'],
  ['明确直方图的单位', 'monitorEventLoopDelay 是纳秒，performance.now() 是毫秒'],
  ['createHistogram.record 只收整数', '传小数会抛 ERR_OUT_OF_RANGE，先 Math.round'],
  ['timerify 别用在超热点函数上', '包装与 entry 分配的开销会污染被测对象'],
  ['生产环境让观测开销可控', '采样、批量上报、必要时才启用观察者'],
];

console.log('要点'.padEnd(40) + '说明');
console.log('-'.repeat(94));
for (const [item, reason] of checklist) {
  console.log(item.padEnd(38) + reason);
}

// 收尾：清理观察者，避免回调悬挂
measureObserver.disconnect();
functionObserver.disconnect();

console.log('');
console.log('一句话总结：mark/measure 负责"在哪里打点"，');
console.log('  PerformanceObserver 负责"数据怎么收"，');
console.log('  分位数与直方图负责"收上来怎么读"——三者缺一不可。');
console.log(`\n本示例总耗时约 ${Date.now() - SCRIPT_START} ms。`);
console.log('示例结束。');
