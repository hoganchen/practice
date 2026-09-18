/**
 * ============================================================================
 * 知识点：内存剖析实操 —— memoryUsage 各字段、堆统计 API、堆快照三步分析法、
 *           DevTools 保留大小与支配树、泄漏与正常波动的区分
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/12_gc_internals.js
 *
 * 【也见】37_debugging_and_profiling/05_memory_diagnostics.js —— 同一套诊断方法在「调试与性能剖析」章节里也完整讲了一遍。
 *        本文件是「内存剖析」的主场，侧重剖析方法论（三步分析法、支配树、波动与泄漏的区分）；
 *        那篇侧重诊断清单与 --max-old-space-size 这类堆上限调参。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    内存剖析（memory profiling）就是"用工具把内存的去向看清楚"：
 *    现在用了多少、用在哪一块、谁持有它、增长是正常的还是异常的。
 *    它包含三种粒度：
 *      · 宏观：process.memoryUsage() —— 进程级的总量快照；
 *      · 中观：v8.getHeapStatistics() / getHeapSpaceStatistics() —— 堆的分区统计；
 *      · 微观：堆快照（heap snapshot）—— 每一个对象的完整引用图，
 *        可以用来回答"到底是谁在引用这个对象，让它回收不掉"。
 *
 * 2. 为什么需要（真实项目场景）
 *    - "服务跑了一天内存涨到 3GB" —— 先看是哪一块涨了：
 *      heapUsed（JS 对象）还是 external / arrayBuffers（Buffer 等堆外内存）？
 *      这两类的排查手段完全不同。
 *    - "代码里明明每次都新建对象，怎么还是泄漏" ——
 *      快照对比能直接告诉你新增的对象是被谁持有的，而不是靠猜。
 *    - "内存抖动很厉害，是不是泄漏" —— 需要区分【锯齿状波动】与
 *      【谷底值持续抬高】，前者是正常现象，后者才是泄漏。
 *
 * 3. 核心语法要点
 *
 *    (1) process.memoryUsage() 的五个字段（单位都是字节）
 *
 *        rss（Resident Set Size）
 *          操作系统实际分配给这个进程的物理内存总量。
 *          包含：JS 堆 + 已编译代码 + 栈 + C++ 侧对象 + 各种堆外缓冲区。
 *          它是"进程占了多少内存"最接近真实答案的数字，
 *          但也最粗糙 —— 它包含了所有东西，反而不能用来定位问题。
 *          注意：rss 只会涨得很积极、降得很慢，因为 V8 回收后不一定立刻把
 *          内存还给操作系统。所以 rss 高不等于是泄漏。
 *
 *        heapTotal
 *          V8 已向操作系统申请的 JS 堆总量（含新生代 + 老生代）。
 *          它是"已拿到手的地皮面积"，不是"已盖满的房子"。
 *
 *        heapUsed
 *          JS 堆里【真正装着对象】的那部分。
 *          这是排查 JS 层内存问题最常看的字段 ——
 *          但它只是瞬时快照，单次读数没有意义。
 *
 *        external
 *          绑定在 JS 对象上、但内存由 C++ 侧管理的那部分。
 *          典型来源：Buffer、ArrayBuffer 的内容、部分原生模块的分配。
 *          关键点：【它不计入 heapUsed】—— 所以 Buffer 泄漏时，
 *          你会看到进程内存一路涨，而 heapUsed 却一片祥和。
 *
 *        arrayBuffers
 *          external 里"专属于 ArrayBuffer / SharedArrayBuffer 数据区"的部分，
 *          Buffer 的实现基于 ArrayBuffer，所以 Buffer 也算在这里。
 *          排查 Buffer 泄漏直接盯这个字段。
 *
 *    (2) v8.getHeapStatistics()
 *        比 memoryUsage 更细，常用字段：
 *          · heap_size_limit  —— 堆的上限（受 --max-old-space-size 影响）
 *          · used_heap_size    —— 已用堆
 *          · total_heap_size   —— 已申请的堆总量
 *          · total_available_size —— 还能用多少才会触发 OOM
 *          · malloced_memory / external_memory —— 堆外部分
 *          · number_of_native_contexts —— 原生上下文个数，泄漏时会持续增长
 *
 *    (3) v8.getHeapSpaceStatistics()
 *        返回数组，逐项给出每个堆空间的 space_name / space_size /
 *        space_used_size / space_available_size。
 *        可以直接看到 new_space（新生代）和 old_space（老生代）的实时占用。
 *
 *    (4) 堆快照（heap snapshot）的生成方法与【三步分析法】
 *
 *        生成方式（三选一）：
 *          · Node 代码里：import v8 from 'node:v8'; v8.writeHeapSnapshot('x.heapsnapshot');
 *          · 对运行中的进程发信号：node --heapsnapshot-signal=SIGUSR2 app.js
 *            然后 kill -SIGUSR2 <pid>，目录下会生成 .heapsnapshot 文件；
 *          · Chrome DevTools：node --inspect app.js，
 *            打开 chrome://inspect 连接后，在 Memory 面板点 "Take snapshot"。
 *
 *        三步分析法（这是重点，方法比工具重要）：
 *          第一步【拍基线快照】：在"问题还没显现"的状态下拍一张。
 *          第二步【复现问题】：让程序做那段可疑的操作若干次
 *            （比如"打开再关闭弹窗 20 次"、"处理 1000 个请求"）。
 *          第三步【再拍一张快照，做对比（Comparison）】：
 *            在 DevTools 的 Memory 面板把第二张快照的视图切成 "Comparison"，
 *            选第一张作基线，按 "# Delta"（新增对象数）或 "Size Delta" 排序。
 *            —— 重点看那些【本该被回收、却还活着】的对象，
 *            然后展开它的 "Retainers"（持有者链）面板，
 *            一层层往上找"是谁在引用它"，那个最上层的、不属于框架内部的对象
 *            就是泄漏源。
 *
 *        为什么必须"对比"：
 *          单张快照里绝大多数对象都是正常的（框架、运行时、模块）。
 *          只有对比才能把"新增的、且没被回收的"这一小撮挑出来。
 *          一般建议做完一次可疑操作后连续拍两张，先确认对象确实【没有被回收】。
 *
 *    (5) 保留大小（retained size）与支配树（dominator tree）
 *
 *        · 浅层大小（shallow size）：对象自身占用的字节数，不含它引用的东西。
 *          一个 Map 的 shallow size 很小，但它引用的值可能非常大。
 *        · 保留大小（retained size）：把这个对象删掉后，
 *          【能连带释放掉】的总字节数（即它独占支配的那些对象之和）。
 *          排查泄漏要看保留大小 —— 泄漏的往往是"一个小对象霸占着一大片内存"。
 *        · 支配树（dominator tree）：若从根到对象 B 的每一条路径都必经对象 A，
 *          就说 A 支配 B。按支配关系组织起来就是支配树。
 *          在 DevTools 里切换视图为 "Dominators"，
 *          能直接看到"哪些对象实际控制着最多内存"。
 *          ——这比在几万个对象里翻找有效率得多。
 *
 *    (6) --inspect 与 --heapsnapshot-signal 的用法（本示例【只演示命令文本】）
 *        · node --inspect app.js         启动调试，监听 127.0.0.1:9229
 *        · node --inspect-brk app.js     启动并停在第一行，等调试器接上
 *        · 连上后在 Chrome 打开 chrome://inspect 即可用 DevTools 的 Memory 面板
 *        · node --heapsnapshot-signal=SIGUSR2 app.js
 *          之后 kill -SIGUSR2 <pid> 就能在不重启进程的情况下抓快照，
 *          这是线上排查的标准姿势。
 *        · 注意：抓快照会让进程短暂停顿（毫秒到秒级，取决于堆大小），
 *          线上高频抓取会影响服务，务必谨慎。
 *        ⚠ 本节只打印命令文本，不会真的启动调试器或挂起进程。
 *
 * 4. 常见陷阱
 *    - 陷阱一：看到 rss 涨就以为泄漏。rss 包含堆外内存、代码、碎片，
 *      而且 V8 回收后不会立刻还给操作系统，rss 长期不降是正常的。
 *    - 陷阱二：只看 heapUsed 就下结论。Buffer 泄漏不会体现在 heapUsed 上。
 *    - 陷阱三：不看趋势只看单点。必须看多次采样形成的曲线。
 *    - 陷阱四：把"锯齿波动"当泄漏。分配 → 回收 → 再分配本来就该是锯齿状。
 *      判断标准是【回收后的谷底值】会不会一次次抬高。
 *    - 陷阱五：抓了单张快照就找泄漏。没有基线对比，你无法分辨
 *      "本来就该有的对象"和"新泄漏出来的对象"。
 *    - 陷阱六：在生产环境频繁抓快照。抓快照本身是重操作，会明显影响服务。
 *    - 陷阱七：忘了 --expose-gc 的 global.gc() 只在加了该参数时存在。
 *      本示例不依赖它，也不会调用它。
 *
 * 【重要声明】
 *   本示例的内存数值只做【定性说明】，不断言任何精确值。
 *   具体数值因 Node 版本、平台、机器内存、GC 时机而异，两次运行不会相同。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/13_memory_profiling.js
 *
 * 【预期输出】
 *   7 个小节：memoryUsage 五字段逐一实测、堆统计 API、
 *   external / arrayBuffers 与 heapUsed 的分离现象（Buffer 例子）、
 *   用"谷底值"区分泄漏与正常波动、堆快照的生成方式与三步分析法、
 *   保留大小与支配树、以及 --inspect / --heapsnapshot-signal 命令说明。
 *   全程不启动调试器、不写快照文件、不强制 GC，进程正常退出。
 * ============================================================================
 */

import v8 from 'node:v8';

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用工具
// ---------------------------------------------------------------------------

const MB = 1024 * 1024;
const fmt = (bytes) => `${(bytes / MB).toFixed(2)} MB`;
const fmtInt = (n) => n.toLocaleString('en-US');

/** 把一组数值画成迷你走势图，方便一眼看出趋势 */
function sparkline(values) {
  if (values.length === 0) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const blocks = '▁▂▃▄▅▆▇█';
  return values
    .map((v) => blocks[Math.min(blocks.length - 1, Math.floor(((v - min) / range) * blocks.length))])
    .join('');
}

// ---------------------------------------------------------------------------
// 1. process.memoryUsage() 的五个字段
// ---------------------------------------------------------------------------

console.log('--- 1. process.memoryUsage() 五个字段逐一实测 ---');
console.log('');

const mu = process.memoryUsage();

console.log('  字段'.padEnd(16) + '当前值'.padEnd(14) + '含义');
console.log('  ' + '-'.repeat(88));
console.log(
  '  rss'.padEnd(16) + fmt(mu.rss).padEnd(14) + '操作系统给这个进程的物理内存总量（含堆外的一切）',
);
console.log(
  '  heapTotal'.padEnd(16) + fmt(mu.heapTotal).padEnd(14) + 'V8 已向系统申请的 JS 堆总量（地皮面积）',
);
console.log(
  '  heapUsed'.padEnd(16) + fmt(mu.heapUsed).padEnd(14) + 'JS 堆里真正装着对象的部分（最常看的字段）',
);
console.log(
  '  external'.padEnd(16) + fmt(mu.external).padEnd(14) + '绑定在 JS 对象上、但由 C++ 侧管理的内存',
);
console.log(
  '  arrayBuffers'.padEnd(16) + fmt(mu.arrayBuffers).padEnd(14) + 'external 中属于 ArrayBuffer / Buffer 数据区的部分',
);
console.log('');
console.log('  几个必须记住的关系：');
console.log('    ① rss  ≥ heapTotal + external + 代码 + 栈 + 各种碎片');
console.log('       —— rss 是"最大的一圈"，它总是包含其它所有东西；');
console.log('    ② heapUsed ≤ heapTotal');
console.log('       —— 已用的永远不该超过已申请的；');
console.log('    ③ arrayBuffers ≤ external');
console.log('       —— 前者是后者的一个子集；');
console.log('    ④ 【external 不计入 heapUsed】 —— 这是最容易踩的认知坑，下一节专门演示。');
console.log('');
console.log(`  校验：rss(${fmt(mu.rss)}) >= heapTotal(${fmt(mu.heapTotal)}) ? ${mu.rss >= mu.heapTotal}`);
console.log(`  校验：heapUsed(${fmt(mu.heapUsed)}) <= heapTotal(${fmt(mu.heapTotal)}) ? ${mu.heapUsed <= mu.heapTotal}`);
console.log(`  校验：arrayBuffers <= external ? ${mu.arrayBuffers <= mu.external}`);
console.log('');
console.log('  ⚠ 这些值都是【瞬时快照】。下一次调用就会不一样。');
console.log('    拿一次读数去判断"有没有泄漏"，在方法上就是错的。');

// ---------------------------------------------------------------------------
// 2. v8 的堆统计 API
// ---------------------------------------------------------------------------

console.log('\n--- 2. v8.getHeapStatistics()：比 memoryUsage 更细的堆视图 ---');

const stats = v8.getHeapStatistics();

// 挑几个最实用的字段讲，不把几十个字段全列出来
const interestingStats = [
  ['heap_size_limit', '堆的上限（受 --max-old-space-size 影响）'],
  ['used_heap_size', '已使用堆大小'],
  ['total_heap_size', '已申请的堆总量'],
  ['total_available_size', '还能再分配多少才会 OOM'],
  ['malloced_memory', '当前通过 malloc 分配的堆外内存'],
  ['external_memory', '外部（堆外）内存'],
  ['number_of_native_contexts', '原生上下文个数（泄漏时会持续增长）'],
  ['number_of_detached_contexts', '已脱离但未释放的上下文（【大于 0 就是泄漏信号】）'],
];

console.log('');
console.log('  字段'.padEnd(32) + '值'.padEnd(18) + '说明');
console.log('  ' + '-'.repeat(94));
for (const [key, desc] of interestingStats) {
  const raw = stats[key];
  const shown = key.startsWith('number_of_') ? fmtInt(raw) : fmt(raw);
  console.log(`  ${key}`.padEnd(32) + shown.padEnd(18) + desc);
}
console.log('');
console.log('  值得特别注意的两个字段：');
console.log('    · number_of_native_contexts：每个 iframe / 每个 Node 的 vm 上下文都会+1。');
console.log('      如果它随着业务反复执行而持续增长，几乎可以确定是上下文没被释放。');
console.log('    · number_of_detached_contexts：已经和主流程脱钩、但内存还没被回收的上下文。');
console.log('      【正常情况下它应该是 0】—— 大于 0 就是明确的泄漏信号。');
console.log(`    · 本进程此刻 detached_contexts = ${stats.number_of_detached_contexts}（正常应为 0）`);

console.log('');
console.log('  getHeapStatistics 与 memoryUsage 的区别：');
console.log('    · memoryUsage 给的是"进程视角"的字节数，粗但快；');
console.log('    · getHeapStatistics 给的是"V8 堆管理器视角"的细节，');
console.log('      包含上限、可用量、上下文计数等 memoryUsage 没有的信息。');

console.log('\n--- 2b. v8.getHeapSpaceStatistics()：逐分区查看 ---');

const spaces = v8.getHeapSpaceStatistics();

console.log('');
console.log('  分区名'.padEnd(34) + '已用'.padEnd(12) + '容量'.padEnd(12) + '可用');
console.log('  ' + '-'.repeat(78));
for (const s of spaces) {
  console.log(
    s.space_name.padEnd(32) +
      fmt(s.space_used_size).padEnd(12) +
      fmt(s.space_size).padEnd(12) +
      fmt(s.space_available_size),
  );
}
console.log('');
console.log('  怎么用这张表：');
console.log('    · 想看新生代压力 → 盯 new_space（它满了就会触发 Scavenge）；');
console.log('    · 想看老生代压力 → 盯 old_space（它涨上去就是长命对象在累积）；');
console.log('    · large_object_space 里出现大块内容 → 说明有超大对象，值得关注；');
console.log('    · code_space 持续增长 → 可能有大量动态生成的函数（eval / new Function）。');
console.log('    ⚠ 各分区的容量会随 V8 的启发式策略动态调整，不是固定值。');

// ---------------------------------------------------------------------------
// 3. 关键演示：external / arrayBuffers 与 heapUsed 是分开的
// ---------------------------------------------------------------------------

console.log('\n--- 3. 关键演示：Buffer 占用的是 external，不是 heapUsed ---');

const before = process.memoryUsage();

// 分配 8 个 8MB 的 Buffer，共 64MB。
// Buffer 的数据区在堆外（external / arrayBuffers），
// JS 侧只留一个很小的"壳对象"在堆里。
const bufferSize = 8 * MB;
const buffers = [];
for (let i = 0; i < 8; i++) {
  const buf = Buffer.alloc(bufferSize, i);
  buffers.push(buf);
}

const after = process.memoryUsage();

console.log('');
console.log(`  分配了 ${buffers.length} 个 ${fmt(bufferSize)} 的 Buffer，合计理论占用 ${fmt(buffers.length * bufferSize)}`);
console.log('');
console.log('  字段'.padEnd(18) + '分配前'.padEnd(14) + '分配后'.padEnd(14) + '变化');
console.log('  ' + '-'.repeat(70));
for (const key of ['rss', 'heapTotal', 'heapUsed', 'external', 'arrayBuffers']) {
  const delta = after[key] - before[key];
  const sign = delta >= 0 ? '+' : '';
  console.log(key.padEnd(16) + fmt(before[key]).padEnd(14) + fmt(after[key]).padEnd(14) + `${sign}${fmt(delta)}`);
}
console.log('');
console.log('  看到了什么：');
console.log('    · arrayBuffers 大幅增长 —— Buffer 的数据区确实被分配了；');
console.log('    · external 同步增长（arrayBuffers 是它的子集）；');
console.log('    · 【heapUsed 几乎没动】—— 因为 64MB 的数据根本不在 JS 堆里，');
console.log('      JS 堆里只有 8 个指向外部内存的小壳对象。');
console.log('');
console.log('  为什么这一点极其重要：');
console.log('    如果你只用 heapUsed 监控内存，一个持续泄漏 Buffer 的服务');
console.log('    在监控面板上会显示得【完全健康】，直到被 OOM Killer 杀掉。');
console.log('    排查 Buffer 类问题，必须看 external / arrayBuffers 或 rss。');
console.log('');
console.log('  正确释放 Buffer 的方式：解除对它的引用（buffers.length = 0），');
console.log('    让 GC 回收那个壳对象，外部内存才会随之释放。');

// 主动释放，避免影响后续小节的读数
buffers.length = 0;

// ---------------------------------------------------------------------------
// 4. 区分"泄漏"与"正常波动"
// ---------------------------------------------------------------------------

console.log('\n--- 4. 怎么区分"内存泄漏"和"正常波动" ---');

const SAMPLES = 40;
const heapCurve = [];

console.log('');
console.log('  做法：模拟一段"正常工作"的代码 —— 反复创建一批临时对象并丢掉，');
console.log(`        在整个过程中采样 ${SAMPLES} 次 heapUsed，画出一条曲线。`);
console.log('');

let checksumSink = 0; // 防止计算被优化掉
for (let s = 0; s < SAMPLES; s++) {
  // 每轮制造一批短命对象
  let tmp = [];
  for (let i = 0; i < 8_000; i++) {
    tmp.push({ step: s, i, text: `payload-${s}-${i}` });
  }
  for (const o of tmp) checksumSink += o.i;
  tmp = null;

  // 采样点密集一些，才能看到锯齿
  heapCurve.push(process.memoryUsage().heapUsed / MB);
}
console.log(`  （校验值 checksumSink = ${fmtInt(checksumSink)}，确保对象真的被创建和使用）`);
console.log('');
console.log('  曲线（MB）：');
console.log('    ' + heapCurve.map((v) => v.toFixed(1)).join(' '));
console.log('  走势图： ' + sparkline(heapCurve));

// 关键：比较"下半段的最小值"和"上半段的最小值"
// 最小值（谷底）才代表"回收干净之后还剩多少"，它才是判断泄漏的依据。
const half = Math.floor(heapCurve.length / 2);
const troughOf = (arr) => Math.min(...arr);
const troughEarly = troughOf(heapCurve.slice(0, half));
const troughLate = troughOf(heapCurve.slice(half));

console.log('');
console.log('  【分析方法】不要看峰值，要看【谷底】：');
console.log('    · 峰值 = 两次回收之间最多堆到多少 → 决定回收频率，会随业务波动；');
console.log('    · 谷底 = 回收干净之后还剩多少 → 【只有它持续抬高才是泄漏】。');
console.log('');
console.log(`  前半段的最小值（谷底）= ${troughEarly.toFixed(2)} MB`);
console.log(`  后半段的最小值（谷底）= ${troughLate.toFixed(2)} MB`);

const troughRatio = troughLate / (troughEarly || 1);
console.log(`  后半段谷底 / 前半段谷底 = ${troughRatio.toFixed(2)}`);
console.log('');
if (troughRatio < 1.5) {
  console.log('  结论：谷底值基本稳定（比值 < 1.5）→ 这是【正常波动】，不是泄漏。');
} else {
  console.log('  结论：谷底值明显抬高（比值 >= 1.5）→ 出现了【疑似泄漏】的迹象。');
}
console.log('');
console.log('  为什么这种方法可靠：');
console.log('    · 它不依赖绝对数值，只看"同一个指标随时间是否持续恶化"；');
console.log('    · 谷底值不受"采样时刻恰好落在回收前后"的影响那么大 ——');
console.log('      因为在一个足够长的窗口里，总会采到接近谷底的时刻；');
console.log('    · 真实的泄漏会让谷底单调抬高，因为每一轮都有一批对象永远回不来。');
console.log('');
console.log('  线上怎么落地：');
console.log('    · 定时（比如每 10 分钟）采样一次 heapUsed / rss / external；');
console.log('    · 在监控上看【一段时间窗口内的最小值】，而不是瞬时值；');
console.log('    · 观察这个"滑动窗口最小值"是否在几天尺度上持续抬高；');
console.log('    · 只有它持续抬高，才值得去抓堆快照深入分析。');
console.log('');
console.log('  ⚠ 本示例的比值与数值因环境而异，甚至可能因为 GC 恰好没触发而偏大。');
console.log('    这里展示的是【方法】，不是一个可以照抄的阈值。');

// ---------------------------------------------------------------------------
// 5. 堆快照：生成方式与三步分析法
// ---------------------------------------------------------------------------

console.log('\n--- 5. 堆快照（heap snapshot）的生成方式与三步分析法 ---');
console.log('');
console.log('  堆快照是"某一时刻整个堆的完整引用图"：');
console.log('  每一个对象、它的类型、大小，以及【谁引用了它】都在里面。');
console.log('  它是回答"到底是谁让它回收不掉"的终极手段。');
console.log('');
console.log('  5.1 三种生成方式');
console.log('');
console.log('  方式一：在代码里主动生成');
console.log("      import v8 from 'node:v8';");
console.log("      v8.writeHeapSnapshot('./snapshot.heapsnapshot');");
console.log('      · 会把当前堆写成一个 .heapsnapshot 文件，可用 DevTools 打开；');
console.log('      · 只有在你确实需要时才调用它 —— 写快照是重操作。');
console.log(`      · 本进程是否提供该 API：${typeof v8.writeHeapSnapshot === 'function' ? '是' : '否'}`);
console.log('      · （本示例【不会真的调用它】，避免生成大文件影响仓库）');
console.log('');
console.log('  方式二：对运行中的进程发信号（线上排查的标准姿势）');
console.log('      # 启动时声明用哪个信号触发');
console.log('      node --heapsnapshot-signal=SIGUSR2 app.js');
console.log('      # 之后在需要的时候发信号，进程不用重启');
console.log('      kill -SIGUSR2 <pid>');
console.log('      · 优点：不中断服务、不需要提前改代码；');
console.log('      · 注意：抓快照期间进程会短暂停顿，且文件可能很大（数百 MB）。');
console.log('      · Windows 上没有 SIGUSR2，需要用其它方式（如代码里定时写快照）。');
console.log('');
console.log('  方式三：用 Chrome DevTools 交互式抓取');
console.log('      node --inspect app.js          # 启动并监听 127.0.0.1:9229');
console.log('      node --inspect-brk app.js      # 启动后停在第一行，等调试器连接');
console.log('      然后在 Chrome 地址栏打开：chrome://inspect');
console.log('      连上目标进程后，切到 Memory 面板 → 点 "Take snapshot"。');
console.log('      · 交互式操作，能看到最丰富的信息，适合本地排查。');
console.log('');
console.log('  5.2 三步分析法（方法比工具重要）');
console.log('');
console.log('    第一步【拍基线快照】');
console.log('      在问题尚未显现的干净状态下拍一张，记为 Snapshot 1。');
console.log('');
console.log('    第二步【复现问题】');
console.log('      执行那段可疑操作若干次，例如：');
console.log('        · "打开弹窗 → 关闭弹窗"，重复 20 次；');
console.log('        · 处理 1000 个请求；');
console.log('        · 切换路由来回 50 次。');
console.log('      次数要够多，这样泄漏的增量才能从噪声里浮出来。');
console.log('');
console.log('    第三步【再拍一张，做对比（Comparison）】');
console.log('      拍下 Snapshot 2，在 Memory 面板把视图切换为 "Comparison"，');
console.log('      以 Snapshot 1 为基线，按 "# Delta"（新增对象数）排序。');
console.log('      然后回答两个问题：');
console.log('        Q1：新增的是哪一类对象？（看 Constructor 列）');
console.log('        Q2：这些对象【本该被回收却没有】吗？');
console.log('            —— 再执行一次相同的操作、再拍第三张快照，');
console.log('               如果这类对象的数量【只增不减】，泄漏就确认了。');
console.log('');
console.log('    最后一步【顺着 Retainers 找持有者】');
console.log('      点开可疑对象，展开 "Retainers"（持有者）面板，');
console.log('      它会显示"谁在引用这个对象"。一层层往上展开，');
console.log('      直到找到那个"本不该长期存在的引用"—— 那就是泄漏的源头。');
console.log('');
console.log('  为什么必须"对比"而不是"看单张"：');
console.log('    单张快照里绝大多数对象都是正常的（框架、运行时、模块、缓存）。');
console.log('    只看单张，你根本分不清哪些是新泄漏的。对比才能把');
console.log('    "新增的、且没被回收的"这一小撮对象单独挑出来。');

// ---------------------------------------------------------------------------
// 6. 保留大小与支配树
// ---------------------------------------------------------------------------

console.log('\n--- 6. 保留大小（retained size）与支配树（dominator tree） ---');
console.log('');
console.log('  6.1 两种"大小"，含义完全不同');
console.log('');
console.log('  浅层大小 shallow size');
console.log('    对象【自己】占用的字节数，不含它引用的任何东西。');
console.log('    例：一个只有一个属性的对象，shallow size 就只有几十字节。');
console.log('');
console.log('  保留大小 retained size');
console.log('    把这个对象删掉之后，【能连带释放掉的】总字节数。');
console.log('    也就是说：它"独占支配"的那些对象的总和。');
console.log('');
console.log('  用一个具体例子说明差别：');

// 造一个"小壳 + 大数据"的结构，这正是泄漏最常见的形态
const leakLikeContainer = {
  meta: 'a tiny wrapper', // 壳本身非常小
  rows: new Array(20_000).fill(null).map((_, i) => ({ i, text: `row-${i}` })), // 真正的大头
};
console.log(`    · leakLikeContainer.meta = "${leakLikeContainer.meta}"（壳很小，几十字节）`);
console.log(`    · leakLikeContainer.rows 有 ${fmtInt(leakLikeContainer.rows.length)} 个对象（真正的大头）`);
console.log('');
console.log('    这个容器对象的【浅层大小】可能只有几十字节，');
console.log('    但它的【保留大小】是它 + 那 20000 个对象的总和，可能是几 MB。');
console.log('');
console.log('  【结论】排查泄漏一定要看【保留大小】，不要看浅层大小。');
console.log('    泄漏的典型形态就是"一个看起来微不足道的小对象，');
console.log('    却独占支配着一大片内存"。');

// 释放它，避免影响后续统计
leakLikeContainer.rows.length = 0;

console.log('');
console.log('  6.2 支配树（dominator tree）');
console.log('');
console.log('  定义：如果从根出发到达对象 B 的【每一条】引用路径都必经对象 A，');
console.log('        就说 A 支配（dominates）B。');
console.log('  所有对象按这种支配关系组织起来，就构成一棵支配树。');
console.log('');
console.log('  为什么它有用：');
console.log('    · 一个对象可能被几百个地方引用，"谁能释放它"很反直觉；');
console.log('    · 支配树直接给出答案：只要那个【支配者】被释放，');
console.log('      整棵子树都会随之释放；');
console.log('    · 在 DevTools Memory 面板把视图切成 "Dominators"，');
console.log('      按 retained size 排序，就能看到"实际控制着最多内存的是谁"。');
console.log('      ——这比在几万个对象里逐个翻找高效得多。');
console.log('');
console.log('  三个视图的用途速查：');
console.log('    · Summary（概要）    → 按构造函数分组，看"哪类对象最多"；');
console.log('    · Comparison（对比） → 和基线快照比较，看"新增了什么"← 找泄漏主战场；');
console.log('    · Containment（包含）→ 按原有的引用层次展示，看"对象结构长什么样"；');
console.log('    · Dominators（支配） → 按保留大小排序，看"谁霸占了最多内存"；');
console.log('    · Retainers（持有者）→ 单个对象的引用链，看"到底是谁在引用它"。');

// ---------------------------------------------------------------------------
// 7. --inspect 系列命令速查
// ---------------------------------------------------------------------------

console.log('\n--- 7. --inspect / --heapsnapshot-signal 命令速查 ---');
console.log('');
console.log('  ⚠ 下面全部只是【命令文本说明】，本示例不会启动调试器、不会挂起进程。');
console.log('');
console.log('  命令'.padEnd(58) + '用途');
console.log('  ' + '-'.repeat(104));
const commands = [
  ['node --inspect app.js', '启动调试，监听 127.0.0.1:9229，立即执行代码'],
  ['node --inspect-brk app.js', '启动并停在第一行，等调试器连接（适合调启动流程）'],
  ['node --inspect=0.0.0.0:9229 app.js', '允许外部机器连接（仅在安全网络中使用）'],
  ['node --heapsnapshot-signal=SIGUSR2 app.js', '声明收到 SIGUSR2 时自动抓堆快照'],
  ['kill -SIGUSR2 <pid>', '对运行中的进程触发一次堆快照'],
  ['node --max-old-space-size=4096 app.js', '把老生代上限设为 4GB'],
  ['node --report-on-signal --report-signal=SIGUSR1 app.js', '收到信号时生成诊断报告（含内存摘要）'],
];
for (const [cmd, use] of commands) {
  console.log(cmd.padEnd(56) + use);
}
console.log('');
console.log('  连接上调试器后：');
console.log('    · 在 Chrome 地址栏打开 chrome://inspect；');
console.log('    · 找到你要调试的目标，点 "inspect"；');
console.log('    · 切到 "Memory" 面板即可抓快照、做对比、看保留大小与支配树。');
console.log('');
console.log('  线上使用的注意事项：');
console.log('    · 抓快照会让进程停顿（堆越大停得越久），务必避开流量高峰；');
console.log('    · 打开 --inspect 等于开放了一个可执行任意代码的端口，');
console.log('      【绝不能】暴露到公网，只能在受控的内网/本机使用；');
console.log('    · 长期运行的服务更适合用"监控指标 + 定时轻量采样"，');
console.log('      快照只在确认有问题后才抓取。');

// ---------------------------------------------------------------------------
// 8. 一页速查
// ---------------------------------------------------------------------------

console.log('\n--- 8. 内存排查速查表 ---');
console.log('');
console.log('  现象'.padEnd(34) + '先看哪里');
console.log('  ' + '-'.repeat(88));
const cheats = [
  ['怀疑 JS 对象泄漏', 'heapUsed 的滑动窗口最小值是否持续抬高'],
  ['怀疑 Buffer / 二进制泄漏', 'external、arrayBuffers、rss'],
  ['进程内存高但 heapUsed 健康', '外部内存（Buffer、原生模块）或内存碎片'],
  ['堆内存抖动厉害', '先确认是锯齿波动还是谷底抬高，多数是正常现象'],
  ['想知道"谁持有它"', '堆快照 → Comparison → Retainers'],
  ['想知道"谁最占内存"', '堆快照 → Dominators → 按 retained size 排序'],
  ['想知道"哪类对象最多"', '堆快照 → Summary → 按构造函数分组'],
  ['怀疑上下文泄漏', 'getHeapStatistics 的 number_of_detached_contexts'],
];
for (const [symptom, where] of cheats) {
  console.log(symptom.padEnd(32) + where);
}
console.log('');
console.log('  三条最重要的原则：');
console.log('    1. 永远看【趋势】，不看单点读数；');
console.log('    2. 判断泄漏看【谷底值是否抬高】，不看峰值；');
console.log('    3. 找原因靠【快照对比 + 保留者链】，不靠猜。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
