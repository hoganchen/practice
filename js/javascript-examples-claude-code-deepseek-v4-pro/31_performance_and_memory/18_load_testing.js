/**
 * ============================================================================
 * 知识点：负载测试 —— 接口级并发基准（吞吐、延迟分位数与错误率）
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/11_benchmark_basics.js、26_node_core/15_http_server_client.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    负载测试（load testing）是"**在并发压力下**测量一个系统每秒能提供多少服务、
 *    这些服务的延迟分布如何"的实践。它和 11_benchmark_basics.js 讲的微基准是两件事：
 *      · 微基准（函数级）：测"这段代码执行一次要多久"，输出是微秒到毫秒级的耗时。
 *        它回答"哪个实现更快"。
 *      · 负载测试（系统级）：测"这个服务在 N 个并发请求下每秒能处理多少、延迟多少"。
 *        输入里包含网络往返、事件循环调度、排队、连接池、GC……
 *        它回答"扛不扛得住、瓶颈在哪、容量该配多少"。
 *    一句话：微基准测**代码**，负载测试测**系统**。前者的结论不能直接外推到后者 ——
 *    微基准里快 3 倍的函数，在真实接口里可能只占 1% 的时间。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 容量规划：要几台机器、几个数据库连接？只能靠压测数据说话。
 *    - SLO 定档："p99 延迟 < 200ms"这类承诺，必须先知道当前基线是多少。
 *    - 上线前验收：加了索引、加了缓存、换了框架，到底有没有用？跑一轮就知道。
 *    - 找瓶颈：压力上来后延迟从哪一级开始恶化，是 CPU、连接池还是下游依赖？
 *    - 防事故：大促、发布会、批量任务启动前，先确认系统能承受预期峰值。
 *
 * 3. 核心语法要点（本示例全部手写，零依赖 —— 不用 autocannon / k6）
 *    - 关键指标：
 *        · 吞吐量（RPS/QPS）：每秒完成的请求数。系统"能扛多少"。
 *        · 延迟分位数 p50 / p95 / p99：**负载测试最重要的指标**。
 *          p95 = 95% 的请求比它快。p99 描述长尾 —— 长尾才是用户抱怨的来源。
 *          分位数用**最近秩法**：排序后取第 ceil(p/100 × N) 个样本
 *          （监控系统里最常见的定义，更细的讨论见 37_debugging_and_profiling/04_perf_hooks.js）。
 *        · 错误率：失败请求 / 总请求。**脱离错误率的吞吐量毫无意义** ——
 *          服务端快速返回 500 时 RPS 反而会"变好看"。
 *        · 并发数：同一时刻"在飞"的请求数。它不等于用户数：真实用户有思考时间，
 *          100 个在线用户可能只有 2~3 个并发请求。
 *        · Little 定律：平均并发数 ≈ 吞吐（RPS） × 平均延迟（秒）。
 *          排队论的恒等式，本示例用"Little 定律交叉验证"一节实测它。
 *    - 为什么平均值会骗人：延迟分布是**长尾**的（不是正态分布）。
 *      100 个请求里 99 个花 1ms、1 个花 200ms，平均值只有 3ms —— 听起来很好，
 *      但每 100 个用户里就有 1 个要等 200ms。平均值把长尾"平均"掉了，
 *      而长尾决定了用户体感与投诉量。所以延迟必须看分位数。
 *    - 压测器的做法（本示例的实现）：固定并发数 C 与总请求数 N，
 *      开 C 个"工人"循环取任务，每个工人同一时刻只有一个请求在飞 ——
 *      并发数因此是**精确可控**的。用 http.Agent({ keepAlive: true,
 *      maxSockets: C }) 复用连接，避免把 TCP 握手算进被测路径。
 *    - 并发数与吞吐的关系：并发从 1 升上去，吞吐先上升（等待被重叠了：
 *      一个请求在等 I/O 时事件循环可以去处理别的请求），到某个点后**饱和**
 *      （CPU、连接池等真实资源用满），此后吞吐不再增长、延迟继续飙升。
 *      平台期的位置就是系统的**容量上限**，是压测要找到的核心答案。
 *    - 定时的精度下限：`setTimeout(fn, ms)` 的实际延迟受系统时钟节拍限制，
 *      **Windows 上实测约 15.6ms 一格**（本示例在注释里标出了这个事实），
 *      所以用 setTimeout 模拟"1ms 的 I/O 等待"是不可能的，只会得到 15ms。
 *      这是压测必须知道的一条：你的测量工具本身有分辨率下限。
 *
 * 4. 常见陷阱
 *    陷阱 1：**忘了预热**。连接池要建立、V8 要 JIT、服务端缓存要填充，
 *            第一轮数字一定偏悲观。本示例"预热的作用"一节实测：全新连接的第一个请求
 *            比复用连接时慢好几倍。
 *    陷阱 2：客户端先成为瓶颈。压测器自己也要烧 CPU；当客户端与服务端跑在同一台
 *            机器上，测出来的是"两个进程抢同一个 CPU"的结果。看到吞吐上不去时，
 *            先确认到底是谁满了（分别看两边的 CPU 占用）。
 *    陷阱 3：把 localhost 压到端口耗尽。不开 keep-alive 时每个请求都要新建连接，
 *            操作系统的临时端口会被 TIME_WAIT 占满，报 EADDRINUSE / EADDRNOTAVAIL。
 *            压测必须复用连接（本示例用 keepAlive Agent）。
 *    陷阱 4：测量本身的开销。每次请求调两次 performance.now()、把延迟压进数组、
 *            序列化 JSON、打日志……都在挤占被测系统的资源。尤其别在压测循环里
 *            console.log —— I/O 开销比被测代码大几个数量级。
 *    陷阱 5：只看平均值。见上文 —— 平均值会掩盖长尾。
 *    陷阱 6：只看吞吐不看错误率。100% 的错误率也能跑出很高的 RPS。
 *    陷阱 7：把压测结果跨机器比较。CPU 型号、核数、Node 版本、其他进程的干扰
 *            都会显著改变数字，只能和"同一环境的历史基线"比。
 *    陷阱 8：**对别人的服务压测**。未经授权的大流量压测就是 DoS 攻击，
 *            有法律风险。只在本地或获得明确授权的环境、用克制的规模进行。
 *    陷阱 9：把并发数当成在线用户数。真实流量模型是"到达率 + 思考时间"，
 *            不是"恒定并发"。
 *    陷阱 10：压完不复盘。压测的价值在于"找到瓶颈并解决它"，而非得到一个好看的数字。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/18_load_testing.js
 *   本示例在 127.0.0.1 上自建被测服务（listen(0) 由系统分配端口），
 *   并在同一文件内手写并发压测器，**不访问外网、零依赖**。
 *   压测规模刻意克制（每轮几十到几百个请求，总量在千级），绝不涉及真实 DoS；
 *   所有连接用完即销毁，进程自然退出、不会挂起。
 *
 * 【预期输出】
 *   依次打印：被测服务启动 / 一轮完整的负载测试（吞吐 + p50/p95/p99 + 直方图）/
 *   长尾与平均值骗人的实测 / 确定性错误注入 / 预热的作用（冷热连接对比）/
 *   两组并发扫描（I/O 密集：吞吐随并发上升；CPU 密集：吞吐饱和、延迟上升）/
 *   Little 定律交叉验证 / 瓶颈归因 / 压测陷阱清单。
 *   **所有绝对值都因机器而异，只做结构性判断（如 p99 ≥ p50、吞吐存在平台期），
 *   不做任何"必须达到多少 RPS"的断言。**
 * ============================================================================
 */

import http from 'node:http';
import { once } from 'node:events';

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用小工具
// ---------------------------------------------------------------------------

/** 最近秩法求分位数：排序后取第 ceil(p/100 × N) 个样本 */
function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return Number.NaN;
  const rank = Math.ceil((p / 100) * sortedValues.length);
  const index = Math.min(Math.max(rank - 1, 0), sortedValues.length - 1);
  return sortedValues[index];
}

/** 平均值 —— 这里特意提供它，是为了在第 4 节展示它有多会骗人 */
const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;

/** 保留两位小数的字符串，打印用 */
const fx = (n, digits = 2) => (Number.isFinite(n) ? n.toFixed(digits) : 'N/A');

/** 打印统计表头与数据行 */
function printStatsHeader(label = '用例') {
  console.log(
    '  ' +
      label.padEnd(18) +
      '请求数'.padEnd(9) +
      'RPS'.padEnd(11) +
      'p50(ms)'.padEnd(10) +
      'p95(ms)'.padEnd(10) +
      'p99(ms)'.padEnd(10) +
      '平均值(ms)'.padEnd(12) +
      '错误率',
  );
  console.log('  ' + '-'.repeat(96));
}

function printStatsRow(label, r) {
  console.log(
    '  ' +
      label.padEnd(18) +
      String(r.total).padEnd(9) +
      fx(r.rps, 0).padEnd(11) +
      fx(r.p50).padEnd(10) +
      fx(r.p95).padEnd(10) +
      fx(r.p99).padEnd(10) +
      fx(r.meanLatency).padEnd(12) +
      `${(r.errorRate * 100).toFixed(1)}%`,
  );
}

/**
 * 打印 ASCII 直方图。
 * 直方图是延迟数据最好的"第一眼"呈现方式：单峰、双峰、长尾一眼可辨，
 * 而它们分别对应完全不同的系统问题（稳定、缓存命中/未命中两条路径、GC 或下游抖动）。
 */
function printHistogram(values, bucketCount = 10, barWidth = 34) {
  if (values.length === 0) {
    console.log('    （无样本）');
    return;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = max - min;

  if (width === 0) {
    // 所有样本完全相同时特殊处理，避免除以 0
    console.log(`    全部 ${values.length} 个样本都落在 ${fx(min)} ms`);
    console.log(`    ${'█'.repeat(barWidth)} ${values.length}`);
    return;
  }

  const buckets = new Array(bucketCount).fill(0);
  for (const v of values) {
    // 把样本映射到等宽的桶上；最大值归入最后一个桶
    const idx = Math.min(Math.floor(((v - min) / width) * bucketCount), bucketCount - 1);
    buckets[idx] += 1;
  }
  const peak = Math.max(...buckets);

  for (let i = 0; i < bucketCount; i++) {
    const from = min + (width / bucketCount) * i;
    const to = min + (width / bucketCount) * (i + 1);
    const bars = Math.round((buckets[i] / peak) * barWidth);
    console.log(
      `    ${from.toFixed(1).padStart(7)} ~ ${to.toFixed(1).padStart(7)} ms | ${'█'.repeat(bars).padEnd(barWidth)} ${buckets[i]}`,
    );
  }
}

/** 结构断言：只做"必然成立"或"教科书结论"级别的判断；失败只提示，不改退出码 */
let checkPassed = 0;
const checkFailed = [];

function check(label, condition, detail = '') {
  if (condition) {
    checkPassed += 1;
    console.log(`  ✓ ${label}${detail ? '  —— ' + detail : ''}`);
  } else {
    checkFailed.push(label);
    console.log(`  ✗ ${label}${detail ? '  —— ' + detail : ''}`);
  }
}

/**
 * 一小段同步 CPU 计算，用来模拟"每个请求都要做的一点计算"
 * （参数校验、序列化、模板渲染、加解密……）。
 * 关键特性：它**阻塞事件循环**，所以无论并发多高都无法被重叠 ——
 * 这正是"CPU 密集端点加并发没用"的根源。
 */
function burnCpu(intensity) {
  const n = Math.max(1, Math.floor(intensity * 20_000));
  let acc = 0;
  for (let i = 0; i < n; i++) acc += (i * 7) % 13;
  return acc;
}

// ---------------------------------------------------------------------------
// 1. 被测服务：一个有可变延迟的接口服务器
// ---------------------------------------------------------------------------

console.log('--- 1. 启动被测服务 ---');

/**
 * 模拟 I/O 等待的时长。
 *
 * 这里特意写 1ms，然后**测出**它实际等了多久 —— 因为 `setTimeout` 的精度受
 * 操作系统时钟节拍限制：Windows 上实测约 15.6ms 一格（本机 setTimeout(1)
 * 实际要等 15ms 左右，setTimeout(16) 要等 31ms 左右）。
 * 也就是说，"用 setTimeout 模拟 1ms 的 I/O 等待"根本做不到 —— 你只会得到 15ms。
 * 这是"测量工具有分辨率下限"的活例子：想测更小的差异就得换工具
 * （用真正的 I/O、或者干脆用 CPU 密集任务）。
 * （在时钟节拍为 1ms 的系统上，下面测出来的数字会小得多，脚本照样能跑。）
 */
const IO_DELAY_MS = 1;

/** 慢路径的等待时长（长尾演示用）。90ms 在任何系统上都远大于时钟节拍，稳稳地"慢" */
const SLOW_DELAY_MS = 90;

/**
 * 实测本机定时器的精度下限：连续请求 1ms 定时，取实际延迟的中位数。
 * 这本身就是一条压测常识 —— **先搞清楚你的测量工具能分辨多小的差异**。
 */
async function measureTimerTick() {
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now();
    await new Promise((resolve) => {
      setTimeout(resolve, 1);
    });
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}

/** 服务端请求计数器：用于**确定性**地注入慢路径与错误，让错误率可预测、可断言 */
let serverRequestSeq = 0;

/** 统计每个端点被真实命中多少次，用于和压测器的统计互相印证 */
const serverHits = new Map();

/**
 * 被测服务。它把"一个接口的耗时"拆成两种性质完全不同的成分，这是本示例的核心设计：
 *   ① 同步 CPU 计算 —— 阻塞事件循环，**不能**被并发重叠；
 *   ② 异步 I/O 等待 —— 不占 CPU，事件循环可以去处理别的请求，**可以**被并发重叠。
 * 一个系统的吞吐能不能靠加并发提上去，取决于这两者的比例。
 *
 * 端点：
 *   GET /api/work?ms=N   N 毫秒 I/O 等待 + 少量 CPU（I/O 密集，并发有效）
 *   GET /api/cpu         只有 CPU 计算，没有等待（CPU 密集，并发无效）
 *   GET /api/slowpath    97.5% 快（一个定时器刻度）、2.5% 慢（90ms+）—— 长尾演示
 *   GET /api/flaky       每第 5 个请求返回 500 —— 确定性错误率演示
 *   GET /api/health      立即返回 —— 预热演示用（延迟足够小，能看清连接建立的成本）
 */
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const path = url.pathname;
  serverRequestSeq += 1;
  serverHits.set(path, (serverHits.get(path) ?? 0) + 1);

  // 统一的响应出口：显式写 Content-Length，客户端才知道响应体在哪结束
  const send = (status, payload) => {
    const body = JSON.stringify(payload);
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(body, 'utf8'),
    });
    res.end(body);
  };

  if (path === '/api/health') {
    send(200, { ok: true });
    return;
  }

  if (path === '/api/work') {
    const ms = Number(url.searchParams.get('ms') ?? IO_DELAY_MS);
    // ① 同步 CPU 部分：阻塞事件循环，并发再高也只能排队
    const acc = burnCpu(0.2);
    // ② 异步 I/O 部分：不占 CPU，等待期间事件循环可以服务别的请求
    //    —— 正因为它能被"重叠"，加并发才有效果
    setTimeout(() => send(200, { ok: true, ms, acc }), ms);
    return;
  }

  if (path === '/api/cpu') {
    // 纯 CPU：没有等待，所以加并发完全不会提高吞吐
    const acc = burnCpu(10);
    send(200, { ok: true, acc });
    return;
  }

  if (path === '/api/slowpath') {
    // 用服务端自己的序号决定走快路径还是慢路径，保证慢请求的比例是**确定**的
    const slow = serverRequestSeq % 40 === 0;
    const ms = slow ? SLOW_DELAY_MS : IO_DELAY_MS;
    burnCpu(0.2);
    setTimeout(() => send(200, { ok: true, slow, ms }), ms);
    return;
  }

  if (path === '/api/flaky') {
    // 每第 5 个请求失败 —— 错误率 20%，且总数是可预测的
    if (serverRequestSeq % 5 === 0) {
      send(500, { error: 'INTERNAL_ERROR', message: '我故意失败的（每 5 个请求错 1 个）' });
    } else {
      send(200, { ok: true });
    }
    return;
  }

  send(404, { error: 'NOT_FOUND', path });
});

server.listen(0, '127.0.0.1');
await once(server, 'listening');
const PORT = server.address().port;
console.log(`  被测服务已启动：http://127.0.0.1:${PORT}（端口由系统分配，每次运行都不同）`);
console.log('  端点：/api/work(可变 I/O 等待) /api/cpu(纯 CPU) /api/slowpath(长尾) /api/flaky(错误) /api/health');

// 先量一下本机定时器的实际精度 —— 这直接决定了"模拟 I/O 等待"的最小刻度
const timerTick = await measureTimerTick();
console.log(`\n  先测一下测量工具本身的分辨率：请求 setTimeout(1) 的定时，实际要等 ${fx(timerTick)} ms。`);
console.log('  这不是代码写错了，而是操作系统的时钟节拍决定的（Windows 上约 15.6ms 一格）。');
console.log(`  所以本示例里"模拟一次 I/O 等待"的实际耗时就是约 ${fx(timerTick)} ms（还会在一个节拍内上下浮动）——`);
console.log('  这也解释了为什么下面所有延迟数字都以十几毫秒为起点：**你测不出比工具精度更小的差异**。');

// ---------------------------------------------------------------------------
// 2. 手写并发压测器（本示例的核心产出）
// ---------------------------------------------------------------------------

console.log('\n--- 2. 并发压测器（手写，零依赖）---');

/**
 * 发一个请求并测量它的往返耗时。
 * 几个刻意的设计：
 *   · 必须把响应体读完（'data' 收字节数 + 'end' 表示读完），否则连接无法复用；
 *   · 失败也 resolve（而不是 reject）：压测里"失败"是一个**数据点**，
 *     连接被拒、超时、重置都要计入错误率，而不是让压测脚本崩掉；
 *   · 计时区间 = 从发起请求到响应读完，包含服务端处理 + 网络往返 + 客户端解析，
 *     这正是"用户/调用方实际感受到的延迟"。
 */
function requestOnce(port, path, agent) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const req = http.request({ host: '127.0.0.1', port, path, agent }, (res) => {
      let bytes = 0;
      res.on('data', (chunk) => {
        bytes += chunk.length;
      });
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          ms: performance.now() - t0,
          bytes,
        });
      });
    });
    req.on('error', (err) => {
      // 连接层面的错误（ECONNREFUSED / ECONNRESET / socket hang up…）
      resolve({ ok: false, status: 0, ms: performance.now() - t0, bytes: 0, error: err.code ?? err.message });
    });
    req.end();
  });
}

/**
 * 核心压测函数：固定并发数跑完 N 个请求，统计吞吐与延迟分位数。
 *
 * @param {object} opts
 * @param {number} opts.port          目标端口
 * @param {string} opts.path          请求路径
 * @param {number} opts.total         统计口径内的请求总数
 * @param {number} opts.concurrency   并发数（同时在飞的请求数上限）
 * @param {number} [opts.warmup=0]    预热请求数（不计入统计）
 * @returns {Promise<object>}         统计结果
 */
async function loadTest({ port, path, total, concurrency, warmup = 0 }) {
  // 关键：keepAlive + maxSockets = concurrency
  //   · keepAlive：复用连接，避免把 TCP 握手算进被测路径，也避免端口耗尽
  //   · maxSockets：把"同时在飞的请求数"精确限制在 concurrency 上
  const agent = new http.Agent({ keepAlive: true, maxSockets: concurrency });

  try {
    // ---- 预热：结果直接丢弃，只为让连接池 / JIT / 服务端缓存热起来 ----
    if (warmup > 0) {
      let next = 0;
      const worker = async () => {
        while (true) {
          const i = next++;
          if (i >= warmup) return;
          await requestOnce(port, path, agent);
        }
      };
      await Promise.all(Array.from({ length: concurrency }, worker));
    }

    // ---- 正式测量 ----
    const latencies = [];
    const statusCounts = new Map();
    let okCount = 0;
    let errorCount = 0;
    let bytesTotal = 0;

    // 任务分发：next 是共享游标。JS 单线程，`next++` 之间不会被抢占，所以不需要锁
    // —— 这是用 JS 写压测器比多线程语言省事的地方。
    let next = 0;
    const worker = async () => {
      while (true) {
        const i = next++;
        if (i >= total) return;
        const r = await requestOnce(port, path, agent);
        latencies.push(r.ms);
        statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);
        bytesTotal += r.bytes;
        if (r.ok) okCount += 1;
        else errorCount += 1;
      }
    };

    const wallStart = performance.now();
    await Promise.all(Array.from({ length: concurrency }, worker));
    const wallMs = performance.now() - wallStart;

    // 分位数必须在**排序后**的样本上算
    const sorted = [...latencies].sort((a, b) => a - b);

    return {
      path,
      concurrency,
      total,
      wallMs,
      rps: (total / wallMs) * 1000,
      min: sorted[0],
      p50: percentile(sorted, 50),
      p90: percentile(sorted, 90),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      max: sorted[sorted.length - 1],
      meanLatency: mean(latencies),
      okCount,
      errorCount,
      errorRate: errorCount / total,
      statusCounts,
      bytesTotal,
      latencies,
    };
  } finally {
    // ★ 必须销毁连接池：keep-alive 的长连接不会自己消失，
    //   不销毁的话事件循环里始终有存活的 socket，进程会一直挂住。
    //   （用内置 fetch（undici）时对应的是 closeAllConnections()，道理完全一样。）
    agent.destroy();
  }
}

// ---------------------------------------------------------------------------
// 3. 第一轮：一次完整的负载测试
// ---------------------------------------------------------------------------

console.log('\n--- 3. 第一次负载测试：/api/work（一次 I/O 等待），并发 8，统计 72 个请求 ---');

const first = await loadTest({ port: PORT, path: `/api/work?ms=${IO_DELAY_MS}`, total: 72, concurrency: 8, warmup: 16 });

printStatsHeader();
printStatsRow('并发 8 / 一次 I/O', first);
console.log('');
console.log(`  墙钟耗时 = ${fx(first.wallMs, 1)} ms，完成 ${first.total} 个请求，成功 ${first.okCount}，失败 ${first.errorCount}`);
console.log(`  吞吐 RPS = 总请求数 / 墙钟秒数 = ${first.total} / ${fx(first.wallMs / 1000, 3)} = ${fx(first.rps, 0)}`);
console.log(`  服务端 /api/work 共收到 ${serverHits.get('/api/work')} 次请求（含预热），与客户端统计对得上。`);
console.log(`  平均每个响应 ${fx(first.bytesTotal / first.total, 0)} 字节。`);

console.log('\n  延迟分位数（负载测试的主角）：');
console.log(`    min  = ${fx(first.min)} ms   <- 最快的那一批，说明服务端本身能做多快`);
console.log(`    p50  = ${fx(first.p50)} ms   <- 一半请求比它快：**典型用户的体感**`);
console.log(`    p90  = ${fx(first.p90)} ms`);
console.log(`    p95  = ${fx(first.p95)} ms   <- 常见的 SLO 口径`);
console.log(`    p99  = ${fx(first.p99)} ms   <- 长尾：每 100 个请求里有 1 个比它慢`);
console.log(`    max  = ${fx(first.max)} ms   <- 最坏情况，常由 GC、调度抖动或排队造成`);

check('p99 ≥ p50（分位数的定义决定，必然成立）', first.p99 >= first.p50, `p99=${fx(first.p99)} p50=${fx(first.p50)}`);
check('p50 ≥ min（同理必然成立）', first.p50 >= first.min, `p50=${fx(first.p50)} min=${fx(first.min)}`);
check(
  'p50 不小于服务端请求的 I/O 等待（说明测的确实是这个端点）',
  first.p50 >= IO_DELAY_MS,
  `p50=${fx(first.p50)} ms，服务端只请求了 ${IO_DELAY_MS}ms 的定时（实际受时钟节拍限制约 ${fx(timerTick)}ms）`,
);
check('错误率为 0（这个端点不该失败）', first.errorCount === 0, `${first.okCount}/${first.total} 成功`);

console.log('\n  延迟直方图（一眼看出分布形状）：');
printHistogram(first.latencies);
console.log('');
console.log('  注意这个直方图铺开了十几毫秒，而不是一条竖线 —— 服务端明明只请求了 1ms 的定时。');
console.log('  原因：定时器只能落在**时钟节拍的边界**上。请求恰好落在节拍刚过处，就要多等接近一整格；');
console.log('  落在节拍前夕，几乎立刻就被唤醒。这份"抖动"来自测量工具，而不是来自业务逻辑。');
console.log('  教训：当你要测的差异比工具的精度还小时，应该先换工具，而不是硬解读数据。');

// ---------------------------------------------------------------------------
// 4. 长尾：平均值为什么骗人
// ---------------------------------------------------------------------------

console.log('\n--- 4. 长尾演示：/api/slowpath（97.5% 走快路径，2.5% 走一条慢得多的路径）---');

const tail = await loadTest({ port: PORT, path: '/api/slowpath', total: 48, concurrency: 8, warmup: 8 });

printStatsHeader();
printStatsRow('并发 8 / 长尾', tail);
console.log('');
console.log('  把三个数字放在一起看：');
console.log(`    平均值 = ${fx(tail.meanLatency)} ms   <- "我们的接口平均只要 ${fx(tail.meanLatency)} 毫秒"，听起来还行`);
console.log(`    p50    = ${fx(tail.p50)} ms   <- 大多数用户感受到的是这个`);
console.log(`    p95    = ${fx(tail.p95)} ms   <- 95% 的用户都没问题……`);
console.log(`    p99    = ${fx(tail.p99)} ms   <- ⚠️ 每 100 个用户里就有 1 个要等这么久`);
console.log('  结论：平均值**把长尾平均掉了**。只看平均值，你会以为这个接口很稳定；');
console.log('        而实际上有 2.5% 的请求走了慢路径（缓存未命中、慢查询、下游抖动……）。');
console.log('        用平均值定 SLO，得到的是一个"大多数时候达标、但总有人骂你慢"的系统。');

console.log('\n  双峰直方图（左边一堆是快路径、右边一小撮是慢路径）：');
printHistogram(tail.latencies);

check(
  'p99 明显高于 p50（长尾被分位数捕捉到了）',
  tail.p99 > tail.p50 * 3,
  `p99=${fx(tail.p99)} ms 是 p50=${fx(tail.p50)} ms 的 ${fx(tail.p99 / tail.p50, 1)} 倍`,
);
check(
  '平均值掩盖了长尾：平均值远小于 p99',
  tail.meanLatency < tail.p99 / 2,
  `平均值 ${fx(tail.meanLatency)} ms，p99 ${fx(tail.p99)} ms`,
);

// ---------------------------------------------------------------------------
// 5. 错误率：错误也能跑出高吞吐
// ---------------------------------------------------------------------------

console.log('\n--- 5. 错误率：/api/flaky（每第 5 个请求返回 500）---');

const flaky = await loadTest({ port: PORT, path: '/api/flaky', total: 100, concurrency: 4, warmup: 0 });

printStatsHeader();
printStatsRow('并发 4 / 注入错误', flaky);
console.log('');
console.log(`  状态码分布：${[...flaky.statusCounts.entries()].map(([s, c]) => `${s} × ${c}`).join('，')}`);
console.log(`  吞吐高达 ${fx(flaky.rps, 0)} RPS，p50 只有 ${fx(flaky.p50)} ms —— 看起来非常"高性能"。`);
console.log('  原因：失败的请求没做真实业务就直接返回了，所以又快又"高产"。');
console.log('  这正说明：**脱离错误率的吞吐量毫无意义**。只盯 RPS 的话，');
console.log('  一个 500 风暴的接口会显得比正常服务还优秀。');

check('存在失败请求（确定性注入）', flaky.errorCount > 0, `错误率 = ${(flaky.errorRate * 100).toFixed(1)}%`);
check(
  '错误率明显高于 0 且低于 50%',
  flaky.errorRate > 0.05 && flaky.errorRate < 0.5,
  `实测 ${(flaky.errorRate * 100).toFixed(1)}%（每 5 个请求错 1 个）`,
);
check('成功 + 失败 = 总请求数（统计守恒）', flaky.okCount + flaky.errorCount === flaky.total, `${flaky.okCount} + ${flaky.errorCount} = ${flaky.total}`);

// ---------------------------------------------------------------------------
// 6. 预热：冷连接与热连接的差别
// ---------------------------------------------------------------------------

console.log('\n--- 6. 预热的作用（冷连接 vs 复用连接）---');

// 用一个"立即返回"的端点来做这件事：它的单次耗时足够小，
// 才能看清"建立 TCP 连接"这点成本 —— 在 15ms 的端点上，这点成本会被完全淹没。
const coldSamples = [];
for (let i = 0; i < 20; i++) {
  // 每次都用全新的 Agent = 每次都要重新建立 TCP 连接
  const freshAgent = new http.Agent({ keepAlive: true, maxSockets: 4 });
  coldSamples.push((await requestOnce(PORT, '/api/health', freshAgent)).ms);
  freshAgent.destroy();
}
// 热：同一个 Agent 连续请求，连接会被复用
const warmAgent = new http.Agent({ keepAlive: true, maxSockets: 4 });
await requestOnce(PORT, '/api/health', warmAgent); // 先建立连接（预热）
await requestOnce(PORT, '/api/health', warmAgent);
const warmSamples = [];
for (let i = 0; i < 20; i++) warmSamples.push((await requestOnce(PORT, '/api/health', warmAgent)).ms);
warmAgent.destroy();

const coldMed = percentile([...coldSamples].sort((a, b) => a - b), 50);
const warmMed = percentile([...warmSamples].sort((a, b) => a - b), 50);
console.log(`  /api/health 的延迟（20 次采样的中位数）：`);
console.log(`    冷（每次新建连接） = ${fx(coldMed, 3)} ms   最大值 ${fx(Math.max(...coldSamples), 3)} ms <- 进程的第一个请求最慢`);
console.log(`    热（复用连接）     = ${fx(warmMed, 3)} ms`);
console.log(`    差距 = ${fx(coldMed / warmMed, 1)} 倍`);
console.log('  这个端点的"业务逻辑"几乎为零，所以这里测出来的差异**几乎全是连接建立成本**。');
console.log('  在真实系统里，预热还包括：V8 对热点函数做 JIT 编译、服务端缓存填充、');
console.log('  数据库连接池建立、TLS 握手、DNS 缓存……这些成本都集中在**前若干个请求**里。');
console.log('  所以压测的第一批数据必须丢掉，否则你测的是"启动过程"而不是"稳态性能"。');

check('冷连接的延迟高于复用连接', coldMed > warmMed, `${fx(coldMed, 3)} ms vs ${fx(warmMed, 3)} ms`);

// 再来一轮完整的负载测试，对比"无预热"与"有预热"
const coldRun = await loadTest({ port: PORT, path: `/api/work?ms=${IO_DELAY_MS}`, total: 32, concurrency: 16, warmup: 0 });
const warmRun = await loadTest({ port: PORT, path: `/api/work?ms=${IO_DELAY_MS}`, total: 32, concurrency: 16, warmup: 64 });
printStatsHeader();
printStatsRow('冷启动（无预热）', coldRun);
printStatsRow('预热 64 个后', warmRun);
console.log('');
console.log('  注意这两轮的吞吐在本机回环上基本被噪声淹没了（甚至可能反过来）—— 因为连接建立');
console.log('  只要零点几毫秒，在十几毫秒的等待面前微不足道，而且每轮只有几十个请求。');
console.log('  这本身就是个教训：**样本太少时，不要急着对差异下结论**。');
console.log('  但它不代表预热不重要 —— 换成真实网络（握手几十毫秒、还要过 TLS 和 DNS），');
console.log('  冷启动的差别会非常明显。"先预热、再统计"是一条与环境无关的纪律。');

check('两轮请求数一致（口径一致才能比较）', coldRun.total === warmRun.total, `${coldRun.total} vs ${warmRun.total}`);

// ---------------------------------------------------------------------------
// 7. 并发数扫描之一：I/O 密集端点 —— 吞吐随并发上升
// ---------------------------------------------------------------------------

console.log('\n--- 7. 并发扫描 A：I/O 密集端点（/api/work，每个请求都要等一次 I/O）---');
console.log('  同一端点、同样的请求数，只改变并发数。并发数用 Agent 的 maxSockets 精确控制。\n');

const sweepLevels = [1, 4, 16, 32];
const IO_TOTAL = 32;

printStatsHeader();
const ioRuns = [];
for (const c of sweepLevels) {
  const r = await loadTest({ port: PORT, path: `/api/work?ms=${IO_DELAY_MS}`, total: IO_TOTAL, concurrency: c, warmup: 4 });
  ioRuns.push(r);
  printStatsRow(`并发 ${c}`, r);
}

const ioSlow = ioRuns[0];
const ioFast = ioRuns.reduce((a, b) => (b.rps > a.rps ? b : a)); // 吞吐最高的那一档
console.log('\n  吞吐曲线（每个请求都要等一次 I/O，而这段等待**可以被重叠**）：');
const ioPeakRps = Math.max(...ioRuns.map((r) => r.rps));
for (const r of ioRuns) {
  console.log(`    并发 ${String(r.concurrency).padStart(2)} | ${'█'.repeat(Math.round((r.rps / ioPeakRps) * 40)).padEnd(40)} ${fx(r.rps, 0)} RPS`);
}
console.log('');
console.log(`    并发 ${ioSlow.concurrency} -> ${fx(ioSlow.rps, 0)} RPS：一次只能等一个请求，等待期间事件循环无事可做；`);
console.log(`    并发 ${ioFast.concurrency} -> ${fx(ioFast.rps, 0)} RPS：多个请求的等待被**重叠**在同一段时间里，吞吐提高了约 ${fx(ioFast.rps / ioSlow.rps, 0)} 倍。`);
console.log('    这就是"加并发能提高吞吐"的本质：**让等待重叠**，而不是让 CPU 跑得更快。');
console.log('    I/O 密集（等数据库、等下游、等磁盘）的服务，加并发/加连接池通常立竿见影。');
console.log('    （注意本组数据里最高并发那一档的吞吐反而可能略低 —— 那是小样本下的抖动，');
console.log('      再叠加"客户端和服务端在同一台机器上抢 CPU"的干扰。样本这么少时不要急着下结论。）');

check(
  '并发提高后吞吐明显上升（等待被重叠）',
  ioFast.rps > ioSlow.rps * 2,
  `并发 ${ioSlow.concurrency}: ${fx(ioSlow.rps, 0)} RPS -> 并发 ${ioFast.concurrency}: ${fx(ioFast.rps, 0)} RPS`,
);
check(
  'I/O 密集端点的 p50 基本不随并发变化（等待没有变长）',
  ioFast.p50 < ioSlow.p50 * 4,
  `p50 ${fx(ioSlow.p50)} ms -> ${fx(ioFast.p50)} ms`,
);

// ---------------------------------------------------------------------------
// 8. 并发数扫描之二：CPU 密集端点 —— 吞吐饱和
// ---------------------------------------------------------------------------

console.log('\n--- 8. 并发扫描 B：CPU 密集端点（/api/cpu，纯计算无等待）---');
console.log('  同样的并发梯度，换成纯 CPU 端点。先预测一下会发生什么：');
console.log('    同步计算会阻塞事件循环，多出来的请求只能**排队** ——');
console.log('    所以吞吐应该几乎不涨，而延迟会随并发线性上升。\n');

const CPU_TOTAL = 120;

printStatsHeader();
const cpuRuns = [];

// 顺便量一下这一整轮扫描消耗了多少 CPU 时间（第 10 节用）：
// process.cpuUsage() 返回进程自启动以来累计的 user/system 微秒数，差值就是这段区间的开销。
const cpuBefore = process.cpuUsage();
for (const c of sweepLevels) {
  const r = await loadTest({ port: PORT, path: '/api/cpu', total: CPU_TOTAL, concurrency: c, warmup: 24 });
  cpuRuns.push(r);
  printStatsRow(`并发 ${c}`, r);
}
const cpuAfter = process.cpuUsage();
const cpuMs = (cpuAfter.user - cpuBefore.user + (cpuAfter.system - cpuBefore.system)) / 1000;
const cpuHandled = (CPU_TOTAL + 24) * sweepLevels.length;

const cpuMin = Math.min(...cpuRuns.map((r) => r.rps));
const cpuMax = Math.max(...cpuRuns.map((r) => r.rps));
const cpuFirst = cpuRuns[0];
const cpuLast = cpuRuns[cpuRuns.length - 1];

console.log('\n  吞吐曲线（对比上一节的 I/O 端点）：');
for (const r of cpuRuns) {
  console.log(`    并发 ${String(r.concurrency).padStart(2)} | ${'█'.repeat(Math.round((r.rps / cpuMax) * 40)).padEnd(40)} ${fx(r.rps, 0)} RPS`);
}
console.log('\n  延迟曲线（p95）：');
const cpuMaxP95 = Math.max(...cpuRuns.map((r) => r.p95));
for (const r of cpuRuns) {
  console.log(`    并发 ${String(r.concurrency).padStart(2)} | ${'█'.repeat(Math.round((r.p95 / cpuMaxP95) * 40)).padEnd(40)} ${fx(r.p95)} ms`);
}

console.log('\n  两条曲线讲的是同一件事的两面：');
console.log(`    · 吞吐：并发从 ${cpuFirst.concurrency} 涨到 ${cpuLast.concurrency}，RPS 只从 ${fx(cpuMin, 0)} 变到 ${fx(cpuMax, 0)}（相差 ${fx(cpuMax / cpuMin, 2)} 倍）—— **饱和了**。`);
console.log('      原因：CPU 密集的任务无法被重叠，加并发只是让更多请求排在队列里。');
console.log(`    · 延迟：p95 从 ${fx(cpuFirst.p95)} ms 涨到 ${fx(cpuLast.p95)} ms —— **排队的代价全部由用户承担**。`);
console.log('    这就是"饱和"的教科书形态：**吞吐到顶 + 延迟继续爬升**。');
console.log('    此时再加并发（或加机器上的负载）是有害无益的：吞吐不会提高，');
console.log('    只是把延迟推得更高、超时更多，最终雪崩。');
console.log('');
console.log('  把两节放在一起看，就得到了压测里最重要的一条判断：');
console.log('    加并发之前先问 —— 这个接口的时间花在**等待**上还是**计算**上？');
console.log('    等待为主 -> 加并发有效（但要小心连接池/下游被打爆）；');
console.log('    计算为主 -> 加并发无效，该做的是优化算法、减少计算、或者加机器（横向扩展）。');

check(
  'CPU 密集端点：吞吐几乎不随并发增长（存在平台期）',
  cpuMax < cpuMin * 2,
  `最低 ${fx(cpuMin, 0)} RPS，最高 ${fx(cpuMax, 0)} RPS`,
);
check(
  'CPU 密集端点：并发越高延迟越大（排队的代价）',
  cpuLast.p95 > cpuFirst.p95 * 1.5,
  `p95 ${fx(cpuFirst.p95)} ms -> ${fx(cpuLast.p95)} ms`,
);
check('所有轮次错误率都是 0', [...ioRuns, ...cpuRuns].every((r) => r.errorCount === 0), '这两个端点不注入错误');

// ---------------------------------------------------------------------------
// 9. Little 定律交叉验证
// ---------------------------------------------------------------------------

console.log('\n--- 9. 用 Little 定律交叉验证测量结果 ---');

console.log('  Little 定律：平均并发数 ≈ 吞吐（RPS） × 平均延迟（秒）。');
console.log('  它是排队论的恒等式（不是经验公式），可以用来检查"我们的测量是否自洽"：');
console.log('  如果算出来的隐含并发数与配置的并发数相差很远，说明测量方法有问题。');
console.log('');
console.log('  以 I/O 端点那组数据为例：');
console.log(
  '  ' +
    '配置并发'.padEnd(12) +
    '吞吐(RPS)'.padEnd(14) +
    '平均延迟(ms)'.padEnd(16) +
    'RPS × 延迟'.padEnd(16) +
    '相对误差',
);
console.log('  ' + '-'.repeat(72));
const impliedRatios = [];
for (const r of ioRuns) {
  const implied = r.rps * (r.meanLatency / 1000);
  const err = ((implied - r.concurrency) / r.concurrency) * 100;
  impliedRatios.push(implied / r.concurrency);
  console.log(
    '  ' +
      String(r.concurrency).padEnd(12) +
      fx(r.rps, 0).padEnd(14) +
      fx(r.meanLatency).padEnd(16) +
      fx(implied, 2).padEnd(16) +
      `${err >= 0 ? '+' : ''}${err.toFixed(1)}%`,
  );
}
console.log('');
console.log('  解读：最后一列的隐含并发数应该接近配置的并发数。');
console.log('  低并发时能对得比较准；高并发或样本很少时会有偏差 —— 因为测量窗口的起止边界、');
console.log('  以及"统计完最后一个请求就退出"带来的头尾效应，都会引入误差。');
console.log('  数量级能对上，就说明这套测量是自洽的（没有漏算某段耗时）。');

check(
  'Little 定律的隐含并发数与配置并发数在同一量级',
  impliedRatios.every((r) => r > 0.4 && r < 2.5),
  `比值范围 ${fx(Math.min(...impliedRatios), 2)} ~ ${fx(Math.max(...impliedRatios), 2)}`,
);

// ---------------------------------------------------------------------------
// 10. 瓶颈归因：客户端还是服务端？
// ---------------------------------------------------------------------------

console.log('\n--- 10. 谁是瓶颈：客户端还是服务端？---');

console.log('  本示例的压测器和被测服务跑在**同一个 Node 进程**里（为省事这么做的），');
console.log('  所以只能给出"两边加起来"的 CPU 开销。刚才那一轮 CPU 端点扫描总共：');
console.log(`    ${cpuHandled} 个请求（含预热）消耗约 ${fx(cpuMs, 1)} ms CPU 时间，`);
console.log(`    平均每个请求 ${fx(cpuMs / cpuHandled, 3)} ms 的 CPU —— 服务端计算 + 客户端收发 + 压测器本身的开销都在里面。`);
console.log(`    这也解释了 CPU 端点为什么有吞吐上限：单核只能提供约 ${fx(1000 / (cpuMs / cpuHandled), 0)} RPS 的算力。`);
console.log('');
console.log('  真实压测中客户端与服务端是分开部署的，应当**分别**观察两边的 CPU：');
console.log('    · 客户端 CPU 先跑满 -> 你测到的是**压测器**的上限，不是系统的上限。');
console.log('      对策：降低压测器的记录开销、用更轻的客户端、或分布式多机加压。');
console.log('    · 服务端 CPU 跑满 -> 真正的容量瓶颈在应用本身，该优化或加机器。');
console.log('    · 两边都没满但吞吐上不去 -> 瓶颈在别处：连接池上限、文件描述符、');
console.log('      下游依赖、锁竞争、GC、容器 CPU 配额……');

check('压测本身也在消耗 CPU（说明客户端确实是潜在的瓶颈）', cpuMs > 0, `每个请求约 ${fx(cpuMs / cpuHandled, 3)} ms CPU`);

// ---------------------------------------------------------------------------
// 11. 压测陷阱清单
// ---------------------------------------------------------------------------

console.log('\n--- 11. 负载测试陷阱清单 ---');

const pitfalls = [
  ['忘了预热', '连接池/JIT/缓存都要预热；冷启动数字不可复现，也不代表稳态性能'],
  ['客户端先成为瓶颈', '压测器自己也在烧 CPU；分不清两边就等于在测压测器'],
  ['不关 keep-alive 地压 localhost', '每请求新建连接会耗尽临时端口（TIME_WAIT），报 EADDRINUSE'],
  ['把测量开销算进被测路径', '两次 performance.now()、存数组、打日志；尤其别在循环里 console.log'],
  ['只看平均值', '长尾会被平均掉，p95/p99 才是用户体感的来源'],
  ['只看吞吐不看错误率', '500 风暴能跑出很漂亮的 RPS；吞吐必须与错误率一起看'],
  ['忽略工具的分辨率下限', '定时器精度（Windows 约 15.6ms）决定了你测不出比它更小的差异'],
  ['用固定并发模拟真实用户', '真实流量是"到达率 + 思考时间"，不是恒定并发'],
  ['测试环境与生产不一致', '机器规格、数据量、网络拓扑不同，结论无法照搬'],
  ['跨机器比较数字', 'CPU 型号与版本差异能让同一段代码快慢差几倍，只能和自己的基线比'],
  ['压测别人家的服务', '未经授权的压测就是 DoS，有法律风险；只在本地或获授权的环境做'],
  ['压完不复盘', '压测的目的是找到瓶颈并解决它，而不是得到一个好看的数字'],
];

console.log('  陷阱'.padEnd(30) + '后果与对策');
console.log('  ' + '-'.repeat(96));
for (const [name, reason] of pitfalls) {
  console.log('  ' + name.padEnd(28) + reason);
}

console.log('');
console.log('压测的正确定位（与 11_benchmark_basics.js 结尾是同一个意思）：');
console.log('  它是用来**做工程决策**的 —— 定容量、定 SLO、验证优化效果、发现瓶颈，');
console.log('  而不是用来生产一串能在群里炫耀的数字。');
console.log('  数字只有在"同一环境、同一方法、同一口径"下才有意义。');

// ---------------------------------------------------------------------------
// 12. 收尾
// ---------------------------------------------------------------------------

console.log('\n--- 12. 结构断言小结与服务关闭 ---');

console.log(`  结构性断言通过 ${checkPassed} 项，未通过 ${checkFailed.length} 项。`);
if (checkFailed.length > 0) {
  console.log('  未通过的项：');
  for (const name of checkFailed) console.log(`    · ${name}`);
  console.log('  （性能类断言未通过，通常只是说明这台机器的表现与典型情况不同 ——');
  console.log('    比如核数少、机器正忙、并发区间没覆盖到拐点。它不影响本示例的正确性。）');
}
console.log('  说明：本示例刻意**不断言**任何绝对数值（如"必须达到 X RPS"），');
console.log('       因为那取决于机器、Node 版本和当时的系统负载，换个环境必然不成立。');

console.log('\n  服务端各端点被真实命中的次数（可与压测器的统计对照）：');
for (const [path, count] of [...serverHits.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(count).padStart(5)} 次  ${path}`);
}

// 关闭：close() 只是不再接受新连接；压测器已用 agent.destroy() 销毁了所有客户端连接，
// 这里再用 closeAllConnections() 兜底，确保进程不会因为残留的 keep-alive 连接而挂住。
server.close();
server.closeAllConnections();

const closed = await Promise.race([
  once(server, 'close').then(() => 'closed'),
  new Promise((resolve) => setTimeout(() => resolve('timeout'), 500)),
]);
console.log(
  closed === 'closed'
    ? "  收到 'close' 事件，服务器已完全关闭，端口已释放。"
    : '  等待 close 事件超时（连接释放较慢），但监听套接字已关闭。',
);

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
