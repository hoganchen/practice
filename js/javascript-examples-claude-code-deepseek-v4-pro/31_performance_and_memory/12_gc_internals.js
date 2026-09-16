/**
 * ============================================================================
 * 知识点：垃圾回收原理进阶 —— 分代假设、新生代 Scavenge、老生代标记清除/整理、
 *           增量与并发标记、对象晋升、意外存活
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/09_memory_leak_patterns.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    前面的示例（09 / 10）只讲到"可达性分析"这一层：从根出发走不到的
 *    对象就可以回收。但真正的 V8 并不只是"跑一遍可达性分析"那么简单 ——
 *    它把堆【分代】，对不同代用不同的回收算法，还会把标记工作【切片】，
 *    目的只有一个：让长时间的停顿变成很多次极短的停顿。
 *    本示例讲的就是这一层：为什么要分代、新生代和老生代各用什么算法、
 *    对象什么时候"晋升"、什么东西会让对象"意外地一直活着"。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 线上服务每隔几秒就出现一次几百毫秒的"抖动"，日志显示是 GC 停顿 ——
 *      你要能判断这是"新生代回收太频繁"还是"老生代一次大回收"。
 *    - 明明每次都重新 new 对象，内存却一直往上涨 ——
 *      其实是某个引用链让对象"意外存活"，活过了新生代，被晋升到老生代，
 *      于是回收成本从"复制几份"变成了"标记整个老生代"。
 *    - 容器里 Node 进程被 OOM Killer 杀掉，但 --max-old-space-size 还没到 ——
 *      你要知道这个参数【只限制老生代】，堆外内存它管不着。
 *
 * 3. 核心语法要点
 *    (1) 分代假设（generational hypothesis）：
 *        ① 大多数对象的生命周期极短（"朝生夕死"，如临时变量、中间结果）；
 *        ② 活得越久的对象，越有可能继续活下去。
 *        基于这两条，把对象按年龄分成两代分别管理，收益最大。
 *    (2) 新生代（young generation / nursery，V8 里默认只有几 MB 到十几 MB）：
 *        通常分两个大小相等的半空间（semi-space），同一时刻只有一个在用。
 *        回收算法是 Scavenge（半空间复制）：
 *          从根出发找出存活对象 → 复制到另一个半空间 → 整块丢弃旧半空间。
 *        特点：只复制"活着的"，所以【活对象越少越快】——
 *        这正好利用了"大多数对象朝生夕死"的假设。
 *        代价：可用堆只有一半；活对象多时会退化成"复制大部分对象"。
 *    (3) 老生代（old generation，默认上限约 2~4GB，取决于机器与 Node 版本）：
 *        存活得够久、或者新生代装不下的对象会被放到这里。
 *        算法有两步配合：
 *          · 标记清除（mark-sweep）：标记活对象，把没标记的整块回收。
 *            缺点：产生【内存碎片】，可能"总空闲够但连续空闲不够"。
 *          · 标记整理（mark-compact）：把活对象往一端挪，压掉碎片。
 *            缺点：移动对象要更新所有引用，成本高，所以不是每次都做。
 *        实际是"多数时候标记清除 + 必要时整理"的组合。
 *    (4) 增量标记 / 并发标记：为什么能减少停顿
 *        · 朴素的全量标记必须"一次跑完"，这期间对象引用不能变，
 *          否则会漏标或错标 —— 于是主线程被冻结，这就是长停顿的来源。
 *        · 【增量标记（incremental marking）】：把标记工作切成很多小片，
 *          每片之间把主线程还给 JavaScript 执行。总工作量没变，
 *          但最长的一次停顿从"整段标记时长"变成"一小片标记时长"。
 *        · 【并发标记（concurrent marking）】：把标记工作放到【辅助线程】上，
 *          与主线程真正同时运行。
 *        · 【三色标记法】是让"边跑 JS 边标记"安全的关键：
 *            白色 = 还没访问到（假定垃圾）、灰色 = 自己访问了但子引用还没访问、
 *            黑色 = 自己和子引用都访问完了。
 *          只要保证"黑色对象不能直接指向白色对象"（写屏障 write barrier 负责），
 *          就不会漏标。所以标记期间发生修改时，V8 会通过写屏障把新引用重新染灰。
 *    (5) 对象何时从新生代晋升到老生代
 *        · 经历了一次新生代回收（Scavenge）还活着 —— 会被复制到另一个半空间，
 *          年龄 +1。年龄达到阈值（V8 里通常为 2 次左右）就晋升；
 *        · 对象太大，新生代放不下 → 直接分配到老生代；
 *        · 半空间里的"存活对象"超过一定比例（复制成本太高）→ 这批直接晋升。
 *        晋升的代价：老生代多了活对象 → 老生代的标记回收会更慢更频繁。
 *    (6) --max-old-space-size 限制的是哪部分
 *        Node 命令行参数 --max-old-space-size=<MB>（对应环境变量
 *        NODE_OPTIONS="--max-old-space-size=4096"）限制的【只是老生代】的
 *        最大堆大小。它【不限制】：
 *          · 新生代（用 --max-semi-space-size 调）；
 *          · 堆外内存：Buffer / ArrayBuffer / SharedArrayBuffer
 *            （体现在 memoryUsage 的 external / arrayBuffers 字段）；
 *          · 已编译代码、引擎元数据、C++ 侧对象；
 *          · 调用栈。
 *        所以"进程被 OOM 杀了但 heapUsed 还很健康"是完全可能的 ——
 *        常见原因就是 Buffer 泄漏（堆外）。
 *        查看方式：v8.getHeapStatistics() 的 heap_size_limit 字段。
 *
 * 4. 常见陷阱
 *    - 陷阱一：以为"堆内存上升 = 泄漏"。堆内存本身是锯齿状的：
 *      上升（分配）→ 骤降（回收）→ 再上升。要看【回收后的谷底值】是否持续抬高，
 *      而不是看任意时刻的瞬时值。
 *    - 陷阱二：用一次 process.memoryUsage().heapUsed 去判断泄漏。
 *      它只是"此刻"的快照，且 GC 时机不确定，一次读数没有意义。
 *    - 陷阱三：靠 global.gc() 来"验证"内存是否泄漏。
 *      这需要 --expose-gc，生产环境通常没有，而且强制 GC 会掩盖真实节奏。
 *      本示例【不依赖强制 GC】，只用可观察的结构性趋势来说明问题。
 *    - 陷阱四：缓存无限增长。一个 Map / 数组当缓存，永远只 put 不 delete，
 *      里面的对象就"意外存活" → 全部晋升到老生代 → 老生代回收越来越慢。
 *    - 陷阱五：闭包无意中持有大对象。一个函数只要还在被引用，
 *      它闭包捕获的所有变量就都活着 —— 哪怕你只用到了其中一个小字段。
 *    - 陷阱六：把"减少 GC 停顿"理解成"减少所有分配"。真正有效的做法往往是
 *      "减少长命对象的产生"和"避免大量对象同时存活"，而不是消灭分配本身。
 *
 * 【重要声明】
 *   本示例所有内存数值都只是【定性观察】，不做精确断言。
 *   具体数值与 GC 触发的确切时机因 Node 版本、平台、堆布局、机器内存而异，
 *   而且 V8 的 GC 时机本身带有启发式与随机性，两次运行的数字不会完全一样。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/12_gc_internals.js
 *
 * 【预期输出】
 *   7 个小节：分代假设的由来、短命对象的观察证据、有引用链对象的对照证据、
 *   新生代与老生代算法、增量/并发标记与三色标记法、对象晋升条件与意外存活、
 *   以及 --max-old-space-size 究竟限制了什么。
 *   其中包含"短命对象不导致内存持续增长 vs 有引用链的对象持续增长"的
 *   可观察对比，全部用结构性结论表述，不断言精确数值。
 * ============================================================================
 */

import v8 from 'node:v8';

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 观察工具
// ---------------------------------------------------------------------------

/**
 * 读取当前进程的内存快照，单位换算成 MB。
 * 注意：这只是"此刻"的瞬时值，不是稳定值，两次调用可能差很多。
 */
function snapshot() {
  const m = process.memoryUsage();
  return {
    heapUsed: m.heapUsed / 1024 / 1024, // 已使用的 JS 堆
    heapTotal: m.heapTotal / 1024 / 1024, // 已申请到的 JS 堆总量
  };
}

/** 把 MB 数值格式化成人看的字符串 */
const mb = (v) => `${v.toFixed(1)} MB`;

/**
 * 把一组数值画成"迷你走势图"（sparkline）。
 * 用途：一张图就能看出是"锯齿状来回"还是"一路向上"。
 */
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

/**
 * 描述一组采样值的【趋势】，而不是给绝对值。
 * 判断标准故意做得很粗：只看后半段的均值相对前半段抬升了多少。
 * 注意：单看趋势容易被"采样点恰好错过回收时刻"骗到，
 *       所以下面真正依赖的是 peak / trough 这类结构性指标。
 */
function describeTrend(values) {
  if (values.length < 4) return '样本太少，无法判断';
  const half = Math.floor(values.length / 2);
  const avg = (arr) => arr.reduce((x, y) => x + y, 0) / arr.length;
  const first = avg(values.slice(0, half));
  const second = avg(values.slice(half));
  const ratio = second / (first || 1);
  if (ratio > 1.2) return '整体抬升（后半段明显高于前半段）';
  if (ratio < 0.85) return '整体回落（后半段低于前半段）';
  return '基本持平（在波动范围内来回锯齿）';
}

/**
 * 统计一组采样值里的峰值与谷值。
 * 这两个数比"某一次读数"有意义得多：
 *   · 谷值代表"回收干净之后还剩多少"——泄漏与否主要看它是否会持续抬高；
 *   · 峰值代表"两次回收之间最多堆到多少"——它决定回收频率。
 */
function peakAndTrough(values) {
  return { peak: Math.max(...values), trough: Math.min(...values) };
}

/**
 * 统计相邻采样点之间的"回落"次数与最大回落幅度。
 *
 * 这是本示例最有力的一个结构指标：
 *   · 回落次数多 → 中间发生过回收，内存被反复腾出来了；
 *   · 只在开头回落、后面一路向上 → 对象回收不掉，正在持续累积。
 * 它不依赖绝对数值，也不依赖"某个采样点恰好落在回收之后"。
 */
function analyzeDrops(values) {
  let drops = 0;
  let maxDrop = 0;
  for (let i = 1; i < values.length; i++) {
    const delta = values[i] - values[i - 1];
    if (delta < 0) {
      drops++;
      maxDrop = Math.max(maxDrop, -delta);
    }
  }
  return { drops, maxDrop };
}

// ---------------------------------------------------------------------------
// 1. 分代假设：为什么不能"一视同仁"
// ---------------------------------------------------------------------------

console.log('--- 1. 分代假设：为什么 GC 要分代 ---');
console.log('');
console.log('  如果没有分代，每次 GC 都要扫描【整个堆】做可达性分析。');
console.log('  堆越大，扫得越久，停顿越长 —— 对交互式应用是不可接受的。');
console.log('');
console.log('  V8 观察了大量真实程序后，总结出两条经验规律（分代假设）：');
console.log('    ① 弱分代假设：绝大多数对象活不过第一次 GC。');
console.log('       想想看：循环里的临时对象、函数的局部变量、字符串中间结果、');
console.log('       一次 JSON.parse 出来的临时结构 —— 用完就丢。');
console.log('    ② 强分代假设：已经活过几轮 GC 的对象，大概率还会继续活下去。');
console.log('       想想看：启动时初始化的配置、长连接、常驻缓存、路由表。');
console.log('');
console.log('  这两条规律指向同一个结论：');
console.log('    对"短命对象"用【廉价、快速】的方法回收，对"长寿对象"用【昂贵、彻底】的方法。');
console.log('    这就是"分代回收"的全部动机。');

// ---------------------------------------------------------------------------
// 2. 可观察证据 A：大量短命对象不会导致内存持续增长
// ---------------------------------------------------------------------------

console.log('\n--- 2. 证据 A：大量短命对象不会让内存持续增长 ---');

const SHORT_BATCHES = 30; // 分 30 批
const SHORT_PER_BATCH = 20_000; // 每批创建 2 万个"用完即弃"的临时对象
const TOTAL_OBJECTS = SHORT_BATCHES * SHORT_PER_BATCH; // 总共 60 万个对象

console.log(`  做法：分 ${SHORT_BATCHES} 批，每批创建 ${SHORT_PER_BATCH.toLocaleString('en-US')} 个临时对象，`);
console.log('        每个对象只在本次循环内使用，本批结束后立刻断开引用（tmp = null）。');
console.log('        每批结束后记录一次 heapUsed，观察它怎么走。');
console.log('');

const shortLivedHeap = [snapshot().heapUsed]; // 基线：还没开始制造垃圾

for (let b = 0; b < SHORT_BATCHES; b++) {
  // 关键：tmp 是块级作用域变量，每批结束后整批对象就不可达了。
  let tmp = [];
  for (let i = 0; i < SHORT_PER_BATCH; i++) {
    // 每个对象带几个字段，尽量像真实业务里的"数据行"
    tmp.push({ id: i, name: `row-${i}`, score: (i * 31) % 997 });
  }
  // 让这批对象产生一点可观察的用途（否则可能被引擎优化掉）
  let checksum = 0;
  for (const row of tmp) checksum += row.score;
  if (b === 0) console.log(`  （第一批的校验值 checksum = ${checksum}，用于确认对象确实被创建并使用了）`);

  // 主动断开引用：从这一刻起这一批对象全部不可达，成为"短命对象"
  tmp = null;

  shortLivedHeap.push(snapshot().heapUsed);
}

const shortStats = peakAndTrough(shortLivedHeap);
const shortDrops = analyzeDrops(shortLivedHeap);

console.log('');
console.log('  每批结束时的 heapUsed（MB）：');
console.log('    ' + shortLivedHeap.map((v) => v.toFixed(1)).join('  '));
console.log('  走势图（相对高低）： ' + sparkline(shortLivedHeap));
console.log('');
console.log(`  累计创建了 ${TOTAL_OBJECTS.toLocaleString('en-US')} 个对象。`);
console.log(`  观测到的峰值 peak = ${mb(shortStats.peak)}，谷值 trough = ${mb(shortStats.trough)}`);
console.log(`  回落次数 = ${shortDrops.drops} 次，最大单次回落 = ${mb(shortDrops.maxDrop)}`);
console.log(`  参考趋势（仅供参考）：${describeTrend(shortLivedHeap)}`);
console.log('');
console.log('  怎么解读（看结构，不看单点）：');
console.log(`    · 一共造了 ${TOTAL_OBJECTS.toLocaleString('en-US')} 个对象，如果它们全都活着，`);
console.log(`      堆占用会远远高于这里观测到的峰值 ${mb(shortStats.peak)}（见下一节的对照实测）；`);
console.log('    · 【回落次数】才是关键信号：曲线是典型的锯齿状，"涨一波 → 掉一截 → 再涨"，');
console.log(`      本示例观测到 ${shortDrops.drops} 次明显回落，每一次"掉一截"就是一次`);
console.log('      新生代回收（Scavenge）把短命对象清掉了 —— 内存被反复腾了出来；');
console.log('    · 这正是分代假设①在起作用：这些对象大部分连第一次 GC 都活不过，');
console.log('      所以回收成本极低 —— 只是把少数还活着的复制走，然后整块丢弃。');
console.log('');
console.log('  提醒（很重要）：');
console.log('    · 具体数值与锯齿出现的时机因环境而异，两次运行的数字不会一样；');
console.log('    · 采样点有可能恰好错过回收时刻，让曲线看起来像单调上升；');
console.log('    · 所以请不要把任何一次读数当成结论，');
console.log('      只看【峰值 / 谷值 / 回落次数】这类结构性指标。');

// ---------------------------------------------------------------------------
// 3. 对照证据 B：有引用链的对象会持续增长
// ---------------------------------------------------------------------------

console.log('\n--- 3. 证据 B：有引用链的对象会持续增长 ---');

const RETAINED_BATCHES = 30;
const RETAINED_PER_BATCH = 20_000;

console.log('  做法：完全相同的对象数量（同样是 60 万个）和完全相同的对象形状，');
console.log('        唯一的区别是 —— 这批对象被一个长期存在的数组【retained】一直引用着，');
console.log('        每批都往同一个数组里 push，从不删除。');
console.log('');

const retained = []; // ← 根可达的强引用链，这就是"意外存活"的最简形态
const retainedHeap = [snapshot().heapUsed];

for (let b = 0; b < RETAINED_BATCHES; b++) {
  for (let i = 0; i < RETAINED_PER_BATCH; i++) {
    // 与证据 A 完全相同的对象形状
    retained.push({ id: i, name: `row-${i}`, score: (i * 31) % 997 });
  }
  retainedHeap.push(snapshot().heapUsed);
}

// 用到一个元素，确保 retained 不会被判定为无用而整体优化掉
let retainedChecksum = 0;
for (let i = 0; i < retained.length; i += 5000) retainedChecksum += retained[i].score;

const retainedStats = peakAndTrough(retainedHeap);
const retainedDrops = analyzeDrops(retainedHeap);

console.log('  每批结束时的 heapUsed（MB）：');
console.log('    ' + retainedHeap.map((v) => v.toFixed(1)).join('  '));
console.log('  走势图（相对高低）： ' + sparkline(retainedHeap));
console.log('');
console.log(`  观测到的峰值 peak = ${mb(retainedStats.peak)}，谷值 trough = ${mb(retainedStats.trough)}`);
console.log(`  回落次数 = ${retainedDrops.drops} 次，最大单次回落 = ${mb(retainedDrops.maxDrop)}`);
console.log(`  参考趋势（仅供参考）：${describeTrend(retainedHeap)}`);
console.log(`  保留的数组长度为 ${retained.length.toLocaleString('en-US')}（校验值 ${retainedChecksum}）`);
console.log('');
console.log('  两组数据的直接对照：');
console.log('');
console.log('  指标                            证据 A（短命对象）      证据 B（被引用对象）');
console.log('  ' + '-'.repeat(76));
console.log(
  '  创建的对象总数'.padEnd(32) +
    String(TOTAL_OBJECTS.toLocaleString('en-US')).padEnd(24) +
    String(TOTAL_OBJECTS.toLocaleString('en-US')),
);
console.log(
  '  观测到的峰值 heapUsed'.padEnd(30) +
    mb(shortStats.peak).padEnd(24) +
    mb(retainedStats.peak),
);
console.log(
  '  观测到的谷值 heapUsed'.padEnd(30) +
    mb(shortStats.trough).padEnd(24) +
    mb(retainedStats.trough),
);
console.log(
  '  【回落次数】（回收发生的迹象）'.padEnd(26) +
    String(shortDrops.drops + ' 次').padEnd(23) +
    retainedDrops.drops + ' 次',
);
console.log(
  '  结尾时的 heapUsed'.padEnd(32) +
    mb(shortLivedHeap[shortLivedHeap.length - 1]).padEnd(24) +
    mb(retainedHeap[retainedHeap.length - 1]),
);
console.log('');
console.log('  对照结论：');
console.log('    · 创建的对象数量、形状完全一样，唯一区别是"有没有人引用它"；');
console.log(`    · 证据 A 出现了 ${shortDrops.drops} 次回落，而且峰值始终被压在一个较低的水平上；`);
console.log('      这说明对象被反复回收了 —— 不然 60 万个对象不可能只占这么点空间；');
console.log(`    · 证据 B 只有 ${retainedDrops.drops} 次回落，曲线整体一路向上抬升，`);
console.log('      因为每一个对象都有人引用，回收不掉，只能越堆越多；');
console.log('    · 这些被 retained 引用的对象会活过一次次新生代回收，');
console.log('      年龄到阈值后【晋升】到老生代。从此它们参与的是老生代的标记回收，');
console.log('      每一条引用都要被扫描，回收成本远高于新生代复制。');
console.log('    · 这就是"内存泄漏"在 GC 层面的真实样子：');
console.log('      不是内存丢了，而是本该回收的对象因为一条被遗忘的引用链仍然可达。');
console.log('');
console.log('  再提醒一次：以上全部是【结构性结论】（谁会涨、谁不会涨），');
console.log('    具体 MB 数值和 GC 触发的确切时刻因环境而异，请勿当成精确基准。');

// 主动释放，避免影响后面小节的读数
retained.length = 0;

// ---------------------------------------------------------------------------
// 4. 新生代与老生代：两套不同的算法
// ---------------------------------------------------------------------------

console.log('\n--- 4. 新生代 Scavenge vs 老生代 标记清除/整理 ---');
console.log('');
console.log('  把两代放在一起对比：');
console.log('');
console.log('  维度            新生代（Young）              老生代（Old）');
console.log('  ' + '-'.repeat(72));
console.log('  典型大小        几 MB ~ 十几 MB               默认上限 2~4 GB 量级');
console.log('  算法            Scavenge（半空间复制）        标记清除 + 标记整理');
console.log('  半空间结构      两个等大 semi-space，用一备一  一整块大空间');
console.log('  回收依据        只复制"活着的"                标记"活着的"，其余整块回收');
console.log('  成本取决于      存活对象多少                  堆里活对象总量');
console.log('  停顿            短（微秒~毫秒级）              较长（毫秒~百毫秒级）');
console.log('  触发频率        高                            低');
console.log('');
console.log('  新生代为什么快 —— 一句话：');
console.log('    它【不扫描垃圾】，只搬运活人。垃圾越多越划算（"复制存活者"的成本趋近于 0）。');
console.log('    这就是为什么"短命对象"在 JS 里几乎没有成本 —— 引擎就是按这个模式优化的。');
console.log('');
console.log('  新生代的两个固有代价：');
console.log('    ① 空间利用率只有一半（另一半永远空着等复制）；');
console.log('    ② 一旦存活对象太多，复制成本就上去了，这时会干脆把这批对象直接晋升。');
console.log('');
console.log('  老生代为什么慢：');
console.log('    老生代里的活对象多，没法靠"复制少量存活者"取胜，只能老老实实标记。');
console.log('    而且标记清除会留下碎片：');
console.log('      · 想象一个大厅被拆成了很多小空位，总空位够，但坐不下一个 20 人的团；');
console.log('      · 于是需要"标记整理"把活对象都挪到一端，腾出连续空间；');
console.log('      · 移动对象要改写所有指向它的引用，成本更高，所以只在必要时做。');

// ---------------------------------------------------------------------------
// 5. 增量标记 / 并发标记：如何把长停顿切短
// ---------------------------------------------------------------------------

console.log('\n--- 5. 增量标记与并发标记：长停顿是怎么被打散的 ---');
console.log('');
console.log('  先看问题：老生代全量标记要遍历海量对象，可能要几十上百毫秒。');
console.log('  这期间 JS 主线程被冻结 → 页面卡住、接口延迟抖动。');
console.log('');
console.log('  两种缓解手段：');
console.log('    · 增量标记：把标记切成许多小片，主线程在片与片之间执行 JS。');
console.log('      总时长可能没变甚至变长，但【最长单次停顿】大幅缩短 ——');
console.log('      用户感受到的卡顿是由"最长停顿"决定的，不是总时长。');
console.log('    · 并发标记：直接把标记工作交给辅助线程，与主线程真正并行。');
console.log('');
console.log('  难点在于：标记还没做完，JS 就改了对象引用，怎么办？');
console.log('  这就是【三色标记法】要解决的问题：');
console.log('');
console.log('     白色（white）：还没访问到 —— 暂时被当作垃圾');
console.log('     灰色（grey） ：自己访问过了，但它的子引用还没访问完 —— 待办事项');
console.log('     黑色（black）：自己和所有子引用都访问过了 —— 确认存活');
console.log('');
console.log('  标记过程就是"把灰色对象逐个变黑，同时把它的白色子对象染灰"，');
console.log('  直到没有灰色对象为止。此时白色即为垃圾。');
console.log('');
console.log('  安全不变式：   黑色对象【不能】直接指向白色对象。');
console.log('  为什么？如果允许，那么一个已确认存活的黑对象新指向的白对象，');
console.log('  永远等不到被扫描，会被当作垃圾错误回收 —— 这就是"对象漏标"。');
console.log('');
console.log('  怎么保证？靠【写屏障（write barrier）】：');
console.log('    JS 代码每次写对象字段时，引擎会插一小段检查代码，');
console.log('    如果发现"黑对象要指向白对象"，就把这个白对象重新染成灰色，');
console.log('    让它重新进入待扫描队列。');
console.log('');
console.log('  代价与权衡：写屏障让【每一次属性赋值】都多了一点开销。');
console.log('    这就是"并发 GC"不是免费午餐的原因 —— ');
console.log('    它把代价从"长时间的停顿"转移成了"平摊到每一次写操作的微小开销"。');
console.log('    顺便说一句，这也是为什么对象形状（hidden class）稳定的代码更快，');
console.log('    可参见 08_object_shape_optimization.js。');

// ---------------------------------------------------------------------------
// 6. 对象晋升与"意外存活"
// ---------------------------------------------------------------------------

console.log('\n--- 6. 对象晋升：什么时候从新生代搬到老生代 ---');
console.log('');
console.log('  三种晋升路径：');
console.log('    ① 年龄到了：经历过一次 Scavenge 还活着，年龄 +1；');
console.log('       达到阈值（V8 里通常是 2 次左右）就晋升到老生代。');
console.log('    ② 太大了：对象本身超过新生代的承受能力，直接分配到老生代。');
console.log('    ③ 存活率太高：半空间里活着的对象超过一定比例，');
console.log('       复制它们不划算，索性整批晋升。');
console.log('');
console.log('  晋升本身不是问题，问题是【本该短命的对象被晋升了】。');
console.log('  它会让老生代里的活对象越来越多 → 标记阶段越来越长 → 停顿越来越大。');
console.log('');
console.log('  最典型的三种"意外存活"模式：');
console.log('');
console.log('  模式一：闭包持有');
console.log('    函数只要还被引用，它闭包捕获的所有变量就都活着。');
console.log('    哪怕你只打算用其中一个小字段，整个大对象也一起活着。');

/** 模拟：一个"创建大对象 + 只返回小字段"的函数，闭包把大对象一起留下了 */
function makeClosureHoldingTooMuch() {
  const bigPayload = new Array(5000).fill('x'.repeat(64)); // 一大块数据
  const usefulId = 42; // 真正需要的只有这个数字

  // 这个闭包只需要 usefulId，但它和 bigPayload 在同一个作用域里。
  // 注意：现代 V8 会做"上下文槽位裁剪"，未必真的保留 bigPayload，
  //      但下面这种"显式引用"的写法一定会保留 —— 这才是要警惕的形态。
  return function getUsefulId() {
    // 下面这行如果在，bigPayload 就一定被闭包保留：
    // return { id: usefulId, first: bigPayload[0] };
    return usefulId;
  };
}

const closureFn = makeClosureHoldingTooMuch();
console.log(`    · 闭包返回的值 = ${closureFn()}（闭包本身还活着，它的词汇环境也活着）`);
console.log('    · 危险形态：闭包里【直接引用了】大对象 → 大对象与闭包同寿命。');

console.log('');
console.log('  模式二：全局缓存 / 模块级容器（永远只增不减）');

// 一个典型的"无上限缓存"：只 put，从不 evict
const unboundedCache = new Map();
for (let i = 0; i < 5000; i++) {
  unboundedCache.set(`key-${i}`, { payload: 'y'.repeat(128) });
}
console.log(`    · 这个 Map 现在有 ${unboundedCache.size} 条，而且永远不会自己减少`);
console.log('    · 里面的对象全部"意外存活"，最终都会被晋升到老生代');
console.log('    · 正确做法：用 LRU / 容量上限，或改用 WeakMap（键不可达就自动消失，见 10 号示例）');

console.log('');
console.log('  模式三：被"老对象"引用的小对象');

// 模拟：让一批对象先活过一轮（这里用长期容器模拟"老对象"），
// 然后让它们持续引用新创建的小对象。
const oldObjectContainer = { list: [] };
for (let i = 0; i < 2000; i++) {
  oldObjectContainer.list.push({ seq: i });
}
console.log(`    · 容器里已有 ${oldObjectContainer.list.length} 个"老"对象`);
console.log('    · 当老对象引用新对象时，V8 需要通过"记忆集（remembered set）"');
console.log('      记录"老 → 新"的这条边，否则新生代回收时就会漏掉这个新对象。');
console.log('    · 写屏障除了处理三色标记，还要负责维护这个记忆集 ——');
console.log('      所以【老对象持续引用新对象】是一类额外的、容易被忽视的开销。');

// 清理掉，避免影响后面的统计
unboundedCache.clear();
oldObjectContainer.list.length = 0;

// ---------------------------------------------------------------------------
// 7. --max-old-space-size 到底限制了什么
// ---------------------------------------------------------------------------

console.log('\n--- 7. --max-old-space-size 限制的是哪部分内存 ---');

const heapStats = v8.getHeapStatistics();
const heapSpaces = v8.getHeapSpaceStatistics();

console.log(`  当前进程的老生代堆上限 heap_size_limit ≈ ${(heapStats.heap_size_limit / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log(`  当前已用堆 heap_size_limit 之外的对照：used_heap_size ≈ ${mb(heapStats.used_heap_size / 1024 / 1024)}`);
console.log(`  堆总量上限 total_heap_size / 上限比例 = ${((heapStats.total_heap_size / heapStats.heap_size_limit) * 100).toFixed(1)}%`);
console.log('');
console.log('  当前各堆空间的划分（这是 V8 真实的分区，能直接看到"新生代"和"老生代"）：');
console.log('');
console.log('  空间名称'.padEnd(30) + '已用(MB)'.padEnd(12) + '容量(MB)');
console.log('  ' + '-'.repeat(60));
for (const space of heapSpaces) {
  const used = (space.space_used_size / 1024 / 1024).toFixed(2);
  const size = (space.space_size / 1024 / 1024).toFixed(2);
  console.log(space.space_name.padEnd(28) + used.padEnd(12) + size);
}
console.log('');
console.log('  几个关键分区的解释：');
console.log('    · new_space          → 新生代（两个半空间的总量就在这里）');
console.log('    · old_space          → 老生代（--max-old-space-size 管的就是它）');
console.log('    · large_object_space → 大对象空间（超大对象单独存放，避免复制）');
console.log('    · code_space         → 已编译的机器码（JIT 产物）');
console.log('    · map_space          → 对象形状（hidden class / Map）的元数据');
console.log('    · read_only_space    → 只读的引擎内置对象');
console.log('');
console.log('  【重点】--max-old-space-size 只限制 old_space 这一块。');
console.log('  以下这些【不受它约束】：');
console.log('    · new_space（由 --max-semi-space-size 控制）；');
console.log('    · 堆外内存：Buffer / ArrayBuffer（见 memoryUsage 的 external、arrayBuffers）；');
console.log('    · code_space、栈内存、C++ 侧的引擎结构。');
console.log('');
console.log('  实践含义：');
console.log('    容器里给 Node 设置 --max-old-space-size=2048，');
console.log('    并不意味着"进程最多用 2GB 内存"。一个 3GB 的 Buffer 照样能分配出去。');
console.log('    所以排查 OOM 时要同时看【堆内】和【堆外】两部分。');
console.log(`    （本进程此刻的堆外占用可由 node 13_memory_profiling.js 详细观察）`);

console.log('');
console.log('  【本节结论】');
console.log('    1. 分代的核心动机是"让大多数对象以极低成本回收"；');
console.log('    2. 新生代靠"复制存活者"，老生代靠"标记 + 必要时整理"；');
console.log('    3. 增量/并发标记把长停顿切碎，代价是写屏障带来的普遍开销；');
console.log('    4. 对象晋升不可怕，"本该短命却意外存活"才是问题；');
console.log('    5. --max-old-space-size 只管老生代，堆外内存它管不着。');
console.log('    6. 本示例的所有数值都是定性观察，具体数值因环境与 GC 时机而异。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
