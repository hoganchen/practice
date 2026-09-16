/**
 * ============================================================================
 * 知识点：CPU 性能剖析 —— --cpu-prof / --prof / inspector Profiler 与火焰图
 * ============================================================================
 *
 * 【所属分类】37_debugging_and_profiling —— 调试与性能剖析
 * 【难度等级】高级
 * 【前置知识】37_debugging_and_profiling/04_perf_hooks.js、31_performance_and_memory/13_memory_profiling.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    CPU 性能剖析 = "在这段时间里，CPU 的时间到底被哪些函数吃掉了"。
 *    Node 用的是**采样剖析器**（sampling profiler）：引擎每隔一小段时间
 *    （默认 1ms）中断一次执行，把当前的调用栈拍个快照。跑一段时间后，
 *    "被拍到的次数"就近似等于"占用的 CPU 时间"。它不是插桩，不需要改代码，
 *    开销只有百分之几，所以可以开在生产上。
 *    产物是一棵**调用树**，树上每个节点有两组关键数字：
 *      · self time（自 time）：采样点**正好停在这个函数自己身上**的时间；
 *      · total time（总 time）：这个函数**以及它调用的所有东西**加起来的时间。
 *    把调用树按"宽度 = 时间占比、高度 = 调用深度"画出来，就是**火焰图**。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 线上告警：CPU 打到 100%，但日志一切正常 —— 需要知道是哪个函数在打转；
 *    - 压测后吞吐上不去，怀疑有 O(n²) 的循环、正则回溯、或者 JSON 反复序列化；
 *    - 想确认某个"优化"到底有没有用：先采一份基准 profile，改完再采一份对照；
 *    - 内存问题常常伴随 GC 压力，而 GC 在 CPU profile 里是**看得见**的（见第 6 节）。
 *    一句话：日志告诉你"出错了"，profile 告诉你"时间花在哪"。
 *
 * 3. 核心语法要点
 *    (1) --cpu-prof：启动时加这个开关，退出时在磁盘上留下一个 .cpuprofile 文件
 *          $ node --cpu-prof app.js
 *        配套开关：
 *          --cpu-prof-dir=<dir>       指定输出目录（默认当前目录，或 --diagnostic-dir）
 *          --cpu-prof-name=<name>     指定文件名
 *          --cpu-prof-interval=<us>   采样间隔，默认 1000（微秒）
 *        默认文件名形如 CPU.20260101.120000.12345.0.001.cpuprofile
 *        （时间戳 + pid + 序号，所以多次运行不会互相覆盖）。
 *    (2) --prof + --prof-process：老牌的两步法，产出**纯文本**热点排行
 *          $ node --prof app.js                    # 生成 isolate-0x…-<pid>-v8.log
 *          $ node --prof-process isolate-0x…-v8.log > report.txt
 *        优点：纯文本，可以直接贴进 issue、可以 grep、可以在没有浏览器的机器上看。
 *    (3) node:inspector 的 Profiler 域：**编程式**采集，可以在进程运行中途开始/结束
 *          session.post('Profiler.enable')
 *          session.post('Profiler.setSamplingInterval', { interval })  # 微秒
 *          session.post('Profiler.start')
 *          ... 跑被测代码 ...
 *          session.post('Profiler.stop')   # 回调里拿到 { profile }
 *        这是唯一能"按需采集"的办法：APM 工具、定时采样、收到信号才采一次，
 *        靠的都是它（配合 process.on('SIGUSR1') 或一个内部 HTTP 端点）。
 *    (4) .cpuprofile 的 JSON 结构（Chrome 也认这个格式）：
 *          {
 *            "nodes":      [ { id, callFrame: { functionName, scriptId, url,
 *                                              lineNumber, columnNumber },
 *                              hitCount, children: [id, ...] }, ... ],
 *            "startTime":  <微秒，进程启动到采集开始的偏移>,
 *            "endTime":    <微秒>,
 *            "samples":    [nodeId, nodeId, ...],   // 每次采样命中的节点
 *            "timeDeltas": [微秒, ...]              // 与上一次采样的时间差
 *          }
 *        自己算热点的方法（第 5 节真的算一遍）：
 *          · self time ：把 samples[i] 对应的 timeDeltas[i] 累加到该节点上；
 *          · total time：在 children 上递归，self + 所有后代之和。
 *    (5) 打开 .cpuprofile 的方式：
 *          · Chrome / Edge DevTools → Performance 面板 → 左上角的"加载配置文件"
 *            （一个向上箭头的图标，Load profile）→ 选中 .cpuprofile 文件；
 *          · 或拖到 https://www.speedscope.app（纯前端，不用装东西）。
 *
 * 4. 常见陷阱
 *    陷阱 1：**只看 total time 找热点**。框架的 dispatch/中间件/包装函数永远排在
 *            total time 第一，因为它们的"总时间"包含了所有子调用。改它们没用。
 *            真正要改的是**self time 高**的那些帧（火焰图上的"平顶"）。
 *    陷阱 2：把火焰图的横轴当成墙钟时间轴。火焰图是**按字母/调用关系聚合并排序**的，
 *            一根很宽的矩形只说明"占的时间比例大"，不代表"它发生在最开始"。
 *            想看真实时间顺序要用 DevTools 的 Timeline 录制视图。
 *    陷阱 3：profile 里找不到你怀疑的那个函数。可能是：被内联了（热点会被算到
 *            调用者头上）、代码根本没执行、或者被采样漏掉了（采样是概率性的，
 *            跑得太快的函数可能一次都没被采到）。**把工作负载放大再采**是标准做法。
 *    陷阱 4：把采集工具自身的开销当成业务热点。Profiler.start/stop、日志、JSON
 *            序列化这些"测量动作"都会出现在 profile 里（本文件第 5 节就能看到
 *            node:inspector 的帧）。读 profile 第一步永远是分清"被测"与"测量"。
 *    陷阱 5：在生产上采太久 / 采太细。采样间隔越小、时长越长，文件越大、
 *            开销越高。定位问题一般 10~30 秒、间隔 500~1000 微秒就够。
 *    陷阱 6：以为 CPU 高一定是"有段代码在死循环"。大量对象分配导致的频繁 GC
 *            同样能把 CPU 打满，而它在 profile 里表现为 "(garbage collector)"
 *            或 "(program)" 占了大头 —— 这时该去看内存，不是找循环。
 *
 * 【关于本示例的运行方式（重要）】
 *    1) 本示例**只真的执行第 5、6 节**：用 node:inspector 在本进程内采集一小段
 *       自己构造的计算，并把结果（热点排行、self/total 对照、文字版火焰图）打出来。
 *    2) 第 2~4 节的 --cpu-prof / --prof / --inspect 等内容一律**只打印命令与步骤**，
 *       不会 spawn 子进程、不会启动调试端口、不会等待任何外部连接。
 *    3) 涉及耗时的数字只给**占比**与**量级**（"约几毫秒""占百分之几十"），
 *       因为具体微秒数会随机器、Node 版本、JIT 状态剧烈波动，不具备可比性。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 37_debugging_and_profiling/07_cpu_profiling.js
 *
 * 【预期输出】
 *   打印 8 个小节：CPU 100% 的分类与排查路径、--cpu-prof 的用法与打开方式、
 *   .cpuprofile 文件结构、--prof/--prof-process 的文本版热点、
 *   **真实执行的 inspector 采集与热点排行**、self 与 total 的对照、
 *   文字版火焰图的读法、常见 CPU 大户清单与检查清单。
 * ============================================================================
 */

import inspector from 'node:inspector';

const SCRIPT_START = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用小工具
// ---------------------------------------------------------------------------

function section(n, title) {
  console.log(`\n--- ${n}. ${title} ---`);
}

function command(cmd, why) {
  console.log(`  $ ${cmd}`);
  if (why) console.log(`      ↳ ${why}`);
}

const pct = (part, whole) => `${((part / whole) * 100).toFixed(1)}%`;
const ms = (micros) => `${(micros / 1000).toFixed(1)}ms`;

// ---------------------------------------------------------------------------
// 1. 线上 CPU 100%：先分类，再决定用哪个工具
// ---------------------------------------------------------------------------

section(1, '线上 CPU 100% 时的排查路径');

console.log('看到 CPU 100%，先别急着翻代码，按下面三步走：');
console.log('');
console.log('  第 1 步：确认是"谁的 CPU"');
console.log('    · 整个机器忙，还是只有你的 node 进程忙？（top / ps 看进程级 CPU）');
console.log('    · 是不是容器 CPU 配额被跑满、或者被同宿主的别的容器抢了？');
console.log('    · 是不是下游（数据库、外部 API）变慢，导致请求堆积、CPU 反而空转？');
console.log('      —— 这类问题的特征是 CPU 高但 profile 里没什么业务函数，先查外部依赖。');
console.log('');
console.log('  第 2 步：确认是"哪个线程"');
console.log('    · node 主线程忙 = JS 代码或 GC 在烧 CPU（本篇要解决的）；');
console.log('    · libuv 线程池忙 = 文件/加密/DNS 之类的线程池任务太多（UV_THREADPOOL_SIZE）；');
console.log('    · 用 top -H（Linux）看各线程的 CPU 分布，能立刻分清这两类。');
console.log('');
console.log('  第 3 步：对"主线程忙"做 CPU 剖析');
console.log('    · 常用三种拿数据的方式（下面的第 2~5 节分别展开）：');
console.log('        ① 启动时就加 --cpu-prof，退出后拿到 .cpuprofile 文件（最省事）；');
console.log('        ② 启动时加 --prof，事后用 --prof-process 出文本报告（无浏览器环境）；');
console.log('        ③ 运行中用 node:inspector 按需采集（生产上"出问题才采一下"的正解）。');
console.log('');
console.log('  ⚠ 采样剖析是**统计**不是**记账**：它回答"时间大致花在哪些函数上"，');
console.log('    不回答"这个函数被调用了多少次"。要计数请用 04_perf_hooks.js 里的 timerify。');
console.log('  ⚠ 采样有开销（通常个位数百分比），生产环境建议：');
console.log('    用较大的采样间隔（1000 微秒）、只采 10~30 秒、避开业务最高峰。');

// ---------------------------------------------------------------------------
// 2. --cpu-prof：最省事的采样方式
// ---------------------------------------------------------------------------

section(2, '--cpu-prof：启动开关 + 一个 .cpuprofile 文件');

console.log('用法（本示例不会真的执行这些命令）：');
command('node --cpu-prof dist/server.js', '进程退出时生成 CPU.<时间戳>.<pid>.<序号>.cpuprofile');
command('node --cpu-prof --cpu-prof-dir=./profiles dist/server.js', '指定输出目录');
command('node --cpu-prof --cpu-prof-name=before.cpuprofile dist/server.js', '指定文件名，便于"改前/改后"对照');
command('node --cpu-prof --cpu-prof-interval=250 dist/server.js', '把采样间隔压到 250 微秒，短任务也能采到足够样本');
console.log('');
console.log('默认文件名长这样：CPU.20260101.120000.12345.0.001.cpuprofile');
console.log('  拆开看：CPU + 年月日 + 时分秒 + pid + 序号 + 后缀。');
console.log('  带 pid 和序号是为了多次运行不互相覆盖 —— 长跑的服务每次重启都会留一份。');
console.log('');
console.log('⚠ 只有进程**正常退出**时才会落盘。被 kill -9 或者崩溃的话，文件就没了。');
console.log('  生产上更常用第 5 节的编程式采集：不依赖进程退出，想采就采。');
console.log('');
console.log('拿到文件之后怎么打开：');
console.log('  方式一（最常用）：Chrome / Edge 打开 DevTools → Performance 面板');
console.log('    → 左上角那个"向上箭头的图标"（Load profile）→ 选择 .cpuprofile 文件。');
console.log('  方式二：打开 https://www.speedscope.app，把文件拖进去（纯前端，不上传）。');
console.log('  方式三：VS Code 装 "JavaScript Profiler" 之类的插件，在编辑器里看。');
console.log('');
console.log('DevTools 里重点看三处：');
console.log('  · 火焰图（Flame chart）：哪一块最宽，时间就在哪；');
console.log('  · Bottom-Up 视图的 Self Time 列：真正的热点排行（第 6 节详细讲）；');
console.log('  · Top-Down / Call Tree 视图：从入口往下逐层展开，适合看"调用链长什么样"。');

// ---------------------------------------------------------------------------
// 3. .cpuprofile 文件的结构
// ---------------------------------------------------------------------------

section(3, '.cpuprofile 文件的结构：五个字段就讲完了');

console.log('它就是一个 JSON 文件，顶层只有五个字段：');
console.log('');
console.log('  {');
console.log('    "nodes": [ {');
console.log('        "id": 7,');
console.log('        "callFrame": {');
console.log('          "functionName": "checksum",');
console.log('          "scriptId": "88",');
console.log('          "url": "file:///app/src/digest.js",   // 哪个文件');
console.log('          "lineNumber": 9,                       // 第几行（0 基）');
console.log('          "columnNumber": 0');
console.log('        },');
console.log('        "hitCount": 25,        // 采样命中这个节点的次数（近似值，别太当真）');
console.log('        "children": [8, 9]     // 它调用了哪些节点 —— 这就是调用树的边');
console.log('      }, ... ],');
console.log('    "startTime": 1217899352740,  // 微秒：采样开始的时间戳');
console.log('    "endTime":   1217899389085,  // 微秒：采样结束');
console.log('    "samples":    [5, 6, 2, 2, 2, 7, ...],  // 每次采样落在哪个 node 上');
console.log('    "timeDeltas": [12771, 733, 549, 632, ...] // 与上一次采样差了多少微秒');
console.log('  }');
console.log('');
console.log('三个必须理解的细节：');
console.log('  ① samples 与 timeDeltas **按位置一一对应**，长度也一样。');
console.log('     samples[i] 是"第 i 次采样落在哪个节点"，timeDeltas[i] 是"第 i 次采样');
console.log('     距上一次过了多久"。把 timeDeltas[i] 记在 samples[i] 头上，就得到 self time。');
console.log('  ② timeDeltas[0] 是"从 startTime 到第一次采样"的时间（通常偏大，因为');
console.log('     采集启动本身要花点时间），算占比时记得把它一起算进总时长，否则分母偏小。');
console.log('  ③ 同一个函数**可能出现多个节点**：不同的调用路径（A→C、B→C）在调用树里');
console.log('     是两个 node，id 不同但 functionName 一样。按函数名统计时要自己合并。');
console.log('');
console.log('总时长 = endTime - startTime（微秒），也约等于 sum(timeDeltas)。');

// ---------------------------------------------------------------------------
// 4. --prof + --prof-process：文本版热点排行
// ---------------------------------------------------------------------------

section(4, '--prof + --prof-process：不用浏览器的文本版');

console.log('两步法，适合容器里、CI 里、或者想把报告直接贴进 issue 的场合：');
command('node --prof dist/server.js', '运行结束后在当前目录生成 isolate-0x<地址>-<pid>-v8.log');
command('node --prof-process isolate-0x*-v8.log > profile.txt', '把日志加工成人类可读的文本报告');
command('node --prof-process --preprocess isolate-0x*-v8.log > profile.json', '输出中间格式，便于自己二次处理');
console.log('');
console.log('报告里几个关键小节（名字就叫这些）：');
console.log('  [Summary]                 总览：ticks 总数，以及 JavaScript / C++ / GC /');
console.log('                            共享库各占多少。先看这里判断"是不是 JS 的锅"。');
console.log('  [JavaScript]              按 tick 排序的 **JS 函数**排行 —— 就是文本版热点榜。');
console.log('  [C++]                     原生代码的排行（JSON、加密、压缩这些内置实现）。');
console.log('  [Bottom up (heavy) profile]  自底向上看调用链：');
console.log('                            它回答"这个热点是被谁调用的"，用来找入口。');
console.log('');
console.log('列的含义：ticks = 采样命中次数，total = 占全部 tick 的比例，');
console.log('          nonlib = 占"非库代码"的比例（库代码的干扰被排除后的占比）。');
console.log('');
console.log('--prof 与 --cpu-prof 怎么选：');
console.log('  · 用 --cpu-prof：能开浏览器，想看火焰图、看得更直观；');
console.log('  · 用 --prof   ：只有 shell，或者要把报告贴到工单里当证据。');
console.log('  两者底层是同一个采样器，数据是等价的，只是呈现形式不同。');

// ---------------------------------------------------------------------------
// 5. 【真实执行】用 node:inspector 编程式采集
// ---------------------------------------------------------------------------

section(5, '【真实执行】用 node:inspector 采集本进程的 CPU');

// ---- 5.1 被测代码：三个"干实事"的函数 + 一个"只转手"的包装函数 ----

// 热点一：纯计算。循环体里的运算够多，属于"真的在烧 CPU"的那类函数。
function checksum(values) {
  let h = 0;
  for (let i = 0; i < values.length; i += 1) {
    h = (h * 31 + (values[i] % 4294967296)) % 2147483647;
  }
  return h;
}

// 热点二：同样是循环，但每轮多做了几次数学运算与一次数组写入。
function normalize(values) {
  const out = new Array(values.length);
  for (let i = 0; i < values.length; i += 1) {
    out[i] = Math.sqrt(Math.abs(values[i])) * 1.000001;
  }
  return out;
}

// 热点三：把活儿转交给原生实现（JSON.stringify 是 C++ 写的）。
function encodeRecords(rows) {
  return JSON.stringify(rows).length;
}

// 包装函数：自己几乎不干活，只负责"调用别人"。
// 它正是第 6 节要用的对照组 —— total time 高，self time 相对低。
function processBatch(raw) {
  const normalized = normalize(raw);
  return { digest: checksum(normalized), size: encodeRecords(normalized.slice(0, 2000)) };
}

// 数据准备。刻意放在采集区间**之外**：造 80 万个元素本身也要花时间，
// 把它算进 profile 只会污染热点榜（这也是"分清被测与测量"的一部分）。
function makeData(size) {
  return Array.from({ length: size }, (_, i) => i * 1.5);
}

const DATA = makeData(800_000);
const ROUNDS = 8;

// ---- 5.2 采集 ----

// Node 允许同一进程里创建 inspector 会话并连到自己的 V8。
// 注意：这只连"本进程"，不监听端口、不需要 --inspect，所以不会挂起等调试器。
const session = new inspector.Session();
session.connect();

// session.post(method, params, callback)：向 V8 Inspector 协议发一条命令。
// 回调风格不好用，先用 Promise 包一层。
function post(method, params = {}) {
  return new Promise((resolve, reject) => {
    session.post(method, params, (err, result) => (err ? reject(err) : resolve(result)));
  });
}

await post('Profiler.enable');

// 采样间隔单位是**微秒**。默认 1000（即 1ms）；
// 这里压到 300，是因为示范用的负载只有几十毫秒，默认间隔采不到几个点。
// 生产环境建议还是用默认值 —— 间隔越小开销越大。
await post('Profiler.setSamplingInterval', { interval: 300 });

// 先跑一次预热，让相关函数被 JIT 编译好。
// 不预热的话，profile 里会混进一堆"解释执行/编译"的噪声，热点会失真。
const warmup = processBatch(DATA);

const wallStart = Date.now();
await post('Profiler.start');

// 采集区间：反复跑同一批处理。
// 注意这里把循环写在**模块顶层**，而不是再包一层 runWorkload ——
// 每多一层包装函数，火焰图上就多一根"只转手"的条，反而更难看清。
let workloadResult = 0;
for (let round = 0; round < ROUNDS; round += 1) {
  const out = processBatch(DATA);
  workloadResult += out.digest + out.size;
}

const { profile } = await post('Profiler.stop');
const wallMs = Date.now() - wallStart;

session.disconnect();

// ---- 5.3 把 profile 算成"谁占了多少时间" ----

// node id -> node，方便按 id 反查。
const nodeById = new Map(profile.nodes.map((n) => [n.id, n]));

// 每个节点的 self time（微秒）：把第 i 次采样的时间差记到 samples[i] 头上。
// 这是 .cpuprofile 最核心的一步换算。
const selfMicros = new Map();
for (let i = 0; i < profile.samples.length; i += 1) {
  const id = profile.samples[i];
  selfMicros.set(id, (selfMicros.get(id) ?? 0) + (profile.timeDeltas[i] ?? 0));
}

// 总时长：直接加所有 timeDeltas（它把首次采样之前的那段也包含在内）。
const totalMicros = profile.timeDeltas.reduce((a, b) => a + b, 0);

// total time：在 children 上递归，self + 所有后代之和。
function totalTimeOf(node) {
  let sum = selfMicros.get(node.id) ?? 0;
  for (const childId of node.children ?? []) {
    const child = nodeById.get(childId);
    if (child) sum += totalTimeOf(child);
  }
  return sum;
}

// 展示用的名字与分类。
const nameOf = (node) => node.callFrame.functionName || '(匿名/模块顶层)';
function kindOf(node) {
  const url = node.callFrame.url ?? '';
  if (url.startsWith('node:')) return '运行时/工具';
  if (url === '') return 'V8 内部或原生实现';
  return '被测代码';
}

console.log(`本次采集：墙上耗时约 ${wallMs}ms，采样点 ${profile.samples.length} 个，`);
console.log(`          节点 ${profile.nodes.length} 个，总时长约 ${ms(totalMicros)}（量级，因机器而异）`);
console.log(`          预热 1 轮、正式采集 ${ROUNDS} 轮，负载结果非零 = ${warmup !== 0 && workloadResult !== 0}（顺便确认代码真的跑了）`);
console.log('');

// ---- 5.4 热点排行（按 self time 聚合到函数名） ----

// 同一个函数可能有多个 node（多条调用路径），所以按"函数名 + 文件"合并。
const byFunction = new Map();
for (const [id, micros] of selfMicros) {
  const node = nodeById.get(id);
  if (!node) continue;
  const key = `${nameOf(node)} @ ${node.callFrame.url}`;
  byFunction.set(key, (byFunction.get(key) ?? 0) + micros);
}

console.log('按 self time 排序的热点函数（self time = 采样点正好停在这个函数自己身上的时间）：');
console.log('');
console.log('  ' + 'self 占比'.padEnd(10) + 'self 时间'.padEnd(11) + '分类'.padEnd(18) + '函数');
console.log('  ' + '-'.repeat(96));
const hotList = [...byFunction.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [key, micros] of hotList) {
  const [name, url] = key.split(' @ ');
  const node = profile.nodes.find((n) => `${nameOf(n)} @ ${n.callFrame.url}` === key);
  const category = kindOf(node);
  const shortUrl = url.startsWith('node:') ? url : url.split(/[/\\]/).pop() || '(内置)';
  console.log(
    `  ${pct(micros, totalMicros).padEnd(10)}${ms(micros).padEnd(11)}${category.padEnd(18)}${name}  ${shortUrl}`,
  );
}
console.log('');
console.log('读这张表要注意两件事：');
console.log('  · 分类那一列会混进"运行时/工具"——本示例里 node:inspector 的帧就是');
console.log('    Profiler.stop 这次调用自身的开销。真实排查时先把它划掉，再看业务函数。');
console.log('  · 没上过榜的函数不代表没被调用（陷阱 3）。下面直接验证一下这一点：');
console.log('');

// 被内联的函数在 profile 里**根本不会出现**，这比"没被采样到"更彻底。
// 这里逐个检查我们明确调用过的函数有没有在 profile 里露过面。
const expected = ['checksum', 'normalize', 'encodeRecords', 'processBatch'];
for (const name of expected) {
  const nodes = profile.nodes.filter((n) => n.callFrame.functionName === name);
  const selfSum = nodes.reduce((a, n) => a + (selfMicros.get(n.id) ?? 0), 0);
  console.log(
    `    ${name.padEnd(16)}出现在 profile 里 = ${String(nodes.length > 0).padEnd(6)}` +
      `（节点 ${nodes.length} 个，self ${pct(selfSum, totalMicros)}）`,
  );
}
console.log('');
console.log('如果某个你**确定被调用过**的函数显示"没有出现在 profile 里"，那不是它没跑，');
console.log('而是被 V8 **内联**进了调用者 —— 它的耗时被算到调用者头上了。');
console.log('内联是引擎的优化手段，但会让 profile"看不见"某些函数，属于读图时必须知道的坑。');
console.log('对策：把负载放大、或者干脆给那个函数单独写一段最小复现来采。');

const missing = expected.filter((name) => !profile.nodes.some((n) => n.callFrame.functionName === name));
if (missing.length > 0) {
  console.log('');
  console.log(`  本次被内联掉的是：${missing.join('、')}。`);
  console.log('  所以热点榜上排在它调用者名下的那部分时间，其实有一部分是它贡献的 ——');
  console.log('  真要优化，得回到调用者里去看那几行"调用它"的代码做了什么。');
} else {
  console.log('');
  console.log('  本次四个函数都独立出现了 —— 说明这份 profile 里没有被内联隐藏的函数。');
}

// ---------------------------------------------------------------------------
// 6. self time 与 total time：只看总时间会误判热点
// ---------------------------------------------------------------------------

section(6, 'self time vs total time：为什么只看总时间会误判');

console.log('· self time  —— 采样点**正好停在这个函数自己**身上，它真的在烧 CPU；');
console.log('· total time —— 它**以及它下面所有子调用**的时间之和。');
console.log('');
console.log('推论：谁在最外层，谁的 total time 就最大。框架的 dispatch、路由中间件、');
console.log('      你写的 handleRequest —— 这些"只会转手"的函数永远霸占 total 榜第一，');
console.log('      但改它们毫无意义。**要找的是 self 高、且在调用树里足够深的那些"平顶"**。');
console.log('');

// 拿同一份 profile，把两种口径都算出来对照。
// '(模块顶层)' 那一行是模块顶层代码本身：它是永远的"最外层"，
// total 接近 100%，self 却很小，正好是"转手者"的典型。
const interesting = ['(模块顶层)', ...expected];
console.log('  ' + '函数'.padEnd(20) + 'total 占比'.padEnd(12) + 'self 占比'.padEnd(12) + '说明');
console.log('  ' + '-'.repeat(98));
const rows = [];
for (const name of interesting) {
  // 模块顶层的 functionName 是空串，单独匹配。
  const nodes = profile.nodes.filter((n) =>
    name === '(模块顶层)'
      ? n.callFrame.functionName === '' && n.callFrame.url !== ''
      : n.callFrame.functionName === name,
  );
  if (nodes.length === 0) continue;
  // 同一个名字的多个节点在这里直接相加（真实的调用树里它们本是分开的）。
  const selfSum = nodes.reduce((a, n) => a + (selfMicros.get(n.id) ?? 0), 0);
  const totalSum = nodes.reduce((a, n) => a + totalTimeOf(n), 0);
  rows.push({ name, selfSum, totalSum });
}
// 按 self 排序，让"真热点"自然浮到上面。
rows.sort((a, b) => b.selfSum - a.selfSum);

for (const { name, selfSum, totalSum } of rows) {
  const selfShare = selfSum / totalMicros;
  const totalShare = totalSum / totalMicros;
  let note;
  if (totalShare > 0.2 && selfShare < totalShare / 4) note = 'total 高但 self 很低 → 它只是个"转手的"，改它没用';
  else if (selfShare > 0.1) note = 'self 高 → 时间真的花在它自己身上，优化从这里下手';
  else note = '占比不高（可能是被内联了，或负载太轻）';
  console.log(`  ${name.padEnd(20)}${pct(totalSum, totalMicros).padEnd(12)}${pct(selfSum, totalMicros).padEnd(12)}${note}`);
}

// 下面这句结论按**本次真实数据**生成，避免写死一个不成立的例子。
const topSelf = rows[0];
const topWrapper = rows.filter((r) => r.totalSum / totalMicros > 0.5 && r.selfSum / totalMicros < 0.1)[0];
console.log('');
console.log('对照结论（这正是大多数人第一次看 profile 会踩的坑）：');
if (topWrapper) {
  console.log(`  · ${topWrapper.name} 的 total 占 ${pct(topWrapper.totalSum, totalMicros)}，`);
  console.log(`    self 却只有 ${pct(topWrapper.selfSum, totalMicros)} —— 它是"调用链"，不是"工作本身"；`);
}
console.log(`  · 本次 self 占比最高的是 ${topSelf?.name ?? '(无)'}（${pct(topSelf?.selfSum ?? 0, totalMicros)}）——`);
console.log('    它就是需要动手的地方：换算法、减数据量、加缓存、或者挪到 worker 里去。');
console.log('  · 补充：total time 相加以后可以**超过 100%**，因为同一个函数可能在多条');
console.log('    调用路径、甚至递归里出现多次。占比永远是"相对谁"而言，别当绝对值看。');

// ---------------------------------------------------------------------------
// 7. 火焰图怎么读
// ---------------------------------------------------------------------------

section(7, '火焰图怎么读（下面这张是用刚才的真实数据画的）');

console.log('火焰图的三条规则：');
console.log('  ① **宽度 = 时间占比**：一根矩形越宽，它（含其子调用）占用的时间越多；');
console.log('  ② **高度 = 调用深度**：下面的是被调用的，上面的是调用者；同一层左右不是时间顺序；');
console.log('  ③ **平顶 = 真热点**：一根很宽、但上面再没有子矩形的矩形，说明时间就花在它自己身上');
console.log('     （self time 高）。反过来，又高又窄的"尖塔"只是调用链深，时间在更上面。');
console.log('');
console.log('下面这张用真实 profile 的数据画的（宽度按 total 占比，只画占比 > 3% 的分支）：');

// 用真实数据渲染一张"文字版火焰图"：从根节点出发，只跟随占比足够大的分支。
const rootNode = profile.nodes[0];
const BAR_WIDTH = 40;
const visibleNodes = [];

function renderFlame(node, depth) {
  const total = totalTimeOf(node);
  const ratio = total / totalMicros;
  if (depth > 0 && ratio < 0.03) return; // 太小的分支不画，避免刷屏
  const barLength = Math.max(1, Math.round(ratio * BAR_WIDTH));
  const bar = '█'.repeat(barLength);
  const self = selfMicros.get(node.id) ?? 0;
  const label = depth === 0 ? '(root)' : nameOf(node);
  console.log(
    `  ${'  '.repeat(depth)}${bar} ${label}  (total ${pct(total, totalMicros)} / self ${pct(self, totalMicros)})`,
  );
  visibleNodes.push({ node, depth, self });
  // 只画前 3 个最重的子节点，避免输出失控。
  const children = (node.children ?? [])
    .map((id) => nodeById.get(id))
    .filter(Boolean)
    .sort((a, b) => totalTimeOf(b) - totalTimeOf(a))
    .slice(0, 3);
  for (const child of children) renderFlame(child, depth + 1);
}

renderFlame(rootNode, 0);

// 找出图里"self 占比最高"的那一根，它就是平顶 —— 结论按真实数据生成。
const flattened = visibleNodes
  .filter((entry) => entry.depth > 0)
  .sort((a, b) => b.self - a.self)[0];

console.log('');
console.log('怎么看这张图：');
console.log('  · 越靠上的条越是"调用链"：它们通常很宽，但 self 很低，改它们没用；');
if (flattened) {
  console.log(
    `  · 本次 self 最高的那一根是 **${nameOf(flattened.node)}**（self ${pct(flattened.self, totalMicros)}）——`,
  );
} else {
  console.log('  · 本次没有占比超过 3% 的分支 —— 负载太轻，把 ROUNDS 调大再采一次；');
}
console.log('    它在图里就是"平顶"：很宽、上面不再有子条，时间实实在在花在它自己身上；');
console.log('  · 如果某天看到 "(garbage collector)" 或 "(program)" 占了一大块，');
console.log('    那说明瓶颈是**内存分配**而不是算法（陷阱 6），该去 05_memory_diagnostics.js；');
console.log('  · 真实排查时要在**入口那一层**往下找平顶 —— 而不是停在最宽的那根上。');

// ---------------------------------------------------------------------------
// 8. 常见的 CPU 大户清单 + 检查清单
// ---------------------------------------------------------------------------

section(8, '常见的 CPU 大户，以及一份检查清单');

const suspects = [
  ['O(n²) 及以上的循环', '嵌套遍历、每轮都在数组里 indexOf/includes/splice'],
  ['正则回溯', '嵌套量词 (a+)+ 遇上不匹配输入会指数级爆炸'],
  ['大对象的 JSON 序列化', 'JSON.parse/stringify 大 payload，在请求路径上反复做'],
  ['同步加密/压缩', 'pbkdf2、gzip 跑在主线程上，既不异步也不分片'],
  ['深拷贝', 'structuredClone / JSON 往返 / 手写递归 clone 大对象'],
  ['频繁分配与 GC', '循环里 new 对象/拼字符串，profile 里表现为 GC 占大头'],
  ['字符串拼接', '在循环里用 += 拼大数据（见 31 章 06 节）'],
  ['对象形状被打乱', '动态增删属性导致隐藏类退化（见 31 章 08 节）'],
  ['错误栈的采集', '高频路径上 new Error() 只为拿 stack'],
  ['同步日志', '每条请求都同步写磁盘 / 格式化大对象'],
  ['在请求路径上做重活', '启动时就能算好的东西，偏要每次请求算一遍'],
  ['worker 用错地方', '把纯 I/O 丢给 worker_threads，反而更慢（见 26 章 14 节）'],
];

console.log('  ' + '可疑点'.padEnd(28) + '典型表现');
console.log('  ' + '-'.repeat(96));
for (const [item, how] of suspects) {
  console.log('  ' + item.padEnd(26) + how);
}

console.log('');
console.log('CPU 剖析检查清单：');
const checklist = [
  ['先用 top -H 分清主线程忙还是线程池忙', '线程池忙是 I/O/加密任务堆积，不是 JS 代码的问题'],
  ['先排除外部依赖变慢', '下游慢会导致请求堆积、CPU 空转，profile 里看不到业务热点'],
  ['生产采集用大间隔、短时长', '1000 微秒 + 10~30 秒，开销可控；不要长期开着'],
  ['采完先划掉测量工具的帧', 'node:inspector 的 post/dispatch、日志、序列化都算"测量"'],
  ['按 self time 找热点，不看 total time', 'total 榜第一永远是"转手的"框架函数'],
  ['找不到可疑函数就放大负载重采', '可能被内联了、或者跑太快没被采到'],
  ['GC/program 占大头就转去查内存', '那是分配压力问题，不是算法问题'],
  ['改完再采一份对照', '用 --cpu-prof-name 固定文件名，两份 profile 直接比 self 占比'],
];

console.log('  ' + '要点'.padEnd(38) + '说明');
console.log('  ' + '-'.repeat(96));
for (const [item, why] of checklist) {
  console.log('  ' + item.padEnd(36) + why);
}

console.log('');
console.log('一句话总结：CPU 剖析回答的是"时间花在哪些函数上"，');
console.log('  而**只有 self time 高的那些"平顶"才值得动手** —— total time 只是用来');
console.log('  帮你把那根平顶从"入口"一路找下去的路线图。');
console.log(`\n本示例总耗时约 ${Date.now() - SCRIPT_START} ms。`);
console.log('示例结束。');
