/**
 * ============================================================================
 * 知识点：内存诊断 —— memoryUsage、v8 堆统计、堆快照与 --max-old-space-size
 * ============================================================================
 *
 * 【所属分类】37_debugging_and_profiling —— 调试与性能剖析
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/09_memory_leak_patterns.js
 *
 * 【也见】31_performance_and_memory/13_memory_profiling.js —— 同一套诊断方法在「性能与内存」章节里也完整讲了一遍
 *        （memoryUsage 五字段、v8 堆统计、堆快照）。本文件从「调试」主线讲诊断清单与堆上限调参，
 *        那篇侧重剖析方法论（三步分析法、支配树、波动与泄漏的区分）。两文互补。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    内存诊断 = "看懂进程现在占了多少内存、这些内存分别属于谁、
 *    有没有哪一块在不受控地增长"。Node 侧的工具链分三层：
 *      · 概览层：process.memoryUsage()、v8.getHeapStatistics()
 *      · 结构层：v8.getHeapSpaceStatistics()（V8 各内存空间的用量）
 *      · 现场层：Heap Snapshot（堆快照），能精确到"哪个对象被谁引用着"
 *    再加上一条"限制层"的开关：--max-old-space-size。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 服务运行几小时后 RSS 涨到几个 GB 然后 OOM 被重启；
 *    - 容器里内存超限被 OOM Killer 干掉，但 heapUsed 看起来很正常
 *      （这种情况往往是堆外内存/ArrayBuffer 的问题）；
 *    - 想在 CI 里加一条"内存回归"检查，需要先知道哪些指标值得看；
 *    - 想知道"到底该给这个服务配多大内存"，需要理解堆上限是怎么定的。
 *
 * 3. 核心语法要点
 *    (1) process.memoryUsage()：五个字段，回答"进程现在占了多少内存"。
 *        rss           操作系统视角的常驻内存（含堆、栈、代码、堆外）
 *        heapUsed      V8 堆里"活着的对象"占用的字节数（最常看的指标）
 *        heapTotal     V8 已经向系统申请到的堆空间
 *        external      堆外的 C++ 对象内存（典型：Buffer、部分原生模块）
 *        arrayBuffers  external 里属于 ArrayBuffer/Buffer 的那部分
 *        关系：rss ≥ heapTotal + external + 其他；heapTotal ≥ heapUsed。
 *    (2) v8.getHeapStatistics()：堆的"总量视角"，关键字段有
 *        used_heap_size / total_heap_size / heap_size_limit（堆上限）
 *        malloced_memory（引擎内部 malloc 的内存）
 *        number_of_native_contexts（有多少个"上下文"，正常应该是 1，
 *          随着时间增长通常意味着有东西在重复创建上下文，是泄漏信号）
 *        number_of_detached_contexts（已经被放弃但还没回收的上下文，>0 是警报）
 *    (3) v8.getHeapSpaceStatistics()：按 V8 内部的内存空间拆分，常见的有
 *        new_space（新生代，短命对象）、old_space（老生代，长寿对象）、
 *        code_space（JIT 后的机器码）、large_object_space（大于阈值的大对象）。
 *        它是"看不到对象、但看得到分布"的中间层工具。
 *    (4) --max-old-space-size=N（单位 MB）：限制【老生代】的上限，
 *        是控制 Node 进程内存最常用的一个开关。
 *        注意：它设定的是老生代，不是整个堆；v8 的 heap_size_limit
 *        会比它大（还要加上新生代、代码空间等），且有一个下限。
 *    (5) 堆快照（Heap Snapshot）：把"当前堆里所有对象及其引用关系"导出成
 *        .heapsnapshot 文件，用 Chrome DevTools 的 Memory 面板打开分析。
 *        生成方式有三种（见第 3 节），代价是【会暂停服务若干秒 + 文件很大】。
 *
 * 4. 常见陷阱
 *    - 陷阱一：只看 heapUsed。RSS 高而 heapUsed 正常时，问题不在 V8 堆里，
 *      要去看 external / arrayBuffers（典型的：忘了释放 Buffer、缓存了图片二进制）。
 *    - 陷阱二：看到内存数字不下降就断定"泄漏了"。GC 什么时候跑由引擎决定，
 *      单次观测到的数字既不能证明有泄漏、也不能证明没有。
 *      判断泄漏的正确方法是【观察趋势】和【对比可达性】。
 *    - 陷阱三：把不同机器/不同 Node 版本的内存数字互相比较。默认堆上限
 *      与机器总内存有关，heap_size_limit 在不同机器上能差好几倍。
 *    - 陷阱四：在生产环境随手调用 v8.writeHeapSnapshot()。它会暂停主线程
 *      并把整个堆写盘（可能几百 MB），在高峰期等同于一次事故。
 *    - 陷阱五：把 --max-old-space-size 设得比容器内存上限还大。
 *      结果是进程还没到 V8 的限，就先被操作系统的 OOM Killer 杀掉了，
 *      而且看不到任何 JS 层的报错。经验值：容器内存的 70%~80%。
 *    - 陷阱六：以为堆快照能看出"哪段代码泄漏"。它只给你对象和引用关系，
 *      从"某个对象被一个全局 Map 引用着"到"是哪一行代码写进去的"，
 *      仍然需要你自己结合业务去判断。
 *
 * 【关于本示例的数字】
 *    内存数值会随机器、Node 版本、负载而变化，因此：
 *    · 涉及"当前占用"的地方只打印【大致量级】并注明因环境而异；
 *    · 涉及"增长了多少"的地方按"分配了多少就约增长多少"的【结构性结论】表述；
 *    · 只有 --max-old-space-size 那一节会打印具体数字，因为它演示的是
 *      "开关改变 → 上限改变"这个确定的因果关系。
 *    本示例【不会生成堆快照文件】（那会产生几百 MB 的磁盘占用并造成停顿），
 *    相关内容以代码与步骤的形式给出，并标记为【需手动操作】。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 37_debugging_and_profiling/05_memory_diagnostics.js
 *
 * 【预期输出】
 *   打印 7 个小节：memoryUsage 五个字段、v8 堆统计与内存空间、
 *   --max-old-space-size 实测、内存增长与释放的观察、
 *   堆快照的三种生成方式、用 Chrome DevTools 分析内存泄漏的完整步骤、检查清单。
 * ============================================================================
 */

import v8 from 'node:v8';
import { spawnSync } from 'node:child_process';

const SCRIPT_START = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用小工具
// ---------------------------------------------------------------------------

function section(n, title) {
  console.log(`\n--- ${n}. ${title} ---`);
}

const toMB = (bytes) => bytes / 1024 / 1024;

/** 打印"约 N MB"——刻意取整，避免让人误以为这些数字可以精确比较 */
const approxMB = (bytes) => `约 ${Math.round(toMB(bytes))} MB`;

// ---------------------------------------------------------------------------
// 1. process.memoryUsage()：五个字段各管什么
// ---------------------------------------------------------------------------

section(1, 'process.memoryUsage() 的五个字段');

const mu = process.memoryUsage();
console.log('本进程此刻的内存快照（数值因环境而异，这里只看结构和量级）：');
console.log('');
console.log('  字段'.padEnd(16) + '本次读数'.padEnd(14) + '含义');
console.log('  ' + '-'.repeat(92));
console.log(
  '  ' +
    'rss'.padEnd(14) +
    approxMB(mu.rss).padEnd(14) +
    '操作系统看到的常驻内存：堆 + 栈 + 代码 + 堆外，全都算在内',
);
console.log(
  '  ' +
    'heapUsed'.padEnd(14) +
    approxMB(mu.heapUsed).padEnd(14) +
    'V8 堆里【活着的对象】占用多少（排查泄漏最常盯的就是它）',
);
console.log(
  '  ' +
    'heapTotal'.padEnd(14) +
    approxMB(mu.heapTotal).padEnd(14) +
    'V8 已经向系统申请下来的堆空间（≥ heapUsed，多出来的是余量）',
);
console.log(
  '  ' +
    'external'.padEnd(14) +
    approxMB(mu.external).padEnd(14) +
    '绑定到 JS 对象的 C++ 侧内存（Buffer、原生插件的对象等）',
);
console.log(
  '  ' +
    'arrayBuffers'.padEnd(14) +
    approxMB(mu.arrayBuffers).padEnd(14) +
    'external 中属于 ArrayBuffer / Buffer 的那部分',
);
console.log('');
console.log('几个必须记住的结构关系：');
console.log(`  heapTotal ≥ heapUsed ?            ${mu.heapTotal >= mu.heapUsed}`);
console.log(`  external ≥ arrayBuffers ?         ${mu.external >= mu.arrayBuffers}`);
console.log(`  rss ≥ heapTotal ?                 ${mu.rss >= mu.heapTotal}`);
console.log('');
console.log('排查时的判断路径（这是本节最实用的部分）：');
console.log('  · heapUsed 持续上涨 → 怀疑 JS 对象泄漏（闭包、全局缓存、监听器）；');
console.log('  · heapUsed 正常但 rss 很高 → 怀疑【堆外内存】：');
console.log('      Buffer / ArrayBuffer 没释放、原生插件的分配、线程栈；');
console.log('  · heapTotal 涨得比 heapUsed 快很多 → 只是 V8 提前预留了空间，');
console.log('      不代表泄漏，看趋势而不是看瞬时值；');
console.log('  · 容器里被 OOM 杀掉却没有任何 JS 报错 → 基本可以确定是 rss 超了容器限额。');
console.log('');
console.log('常见误区：把 rss 当成"我的程序用了多少内存"。');
console.log('  一个刚启动的 Node 进程 rss 就有几十 MB（引擎本身、内置模块、V8 堆的初始预留），');
console.log('  业务代码真正占用的往往只是其中一小部分。');

// ---------------------------------------------------------------------------
// 2. v8.getHeapStatistics / getHeapSpaceStatistics
// ---------------------------------------------------------------------------

section(2, 'v8.getHeapStatistics()：堆的总量与上限');

const stats = v8.getHeapStatistics();
const statRows = [
  ['used_heap_size', '堆里活着的对象大小（≈ memoryUsage().heapUsed）'],
  ['total_heap_size', '堆当前的总容量（≈ memoryUsage().heapTotal）'],
  ['total_available_size', '还能再分配多少才会触发"接近上限"的处理'],
  ['heap_size_limit', 'V8 允许这个进程使用的堆上限（超过就 OOM 崩溃）'],
  ['malloced_memory', 'V8 引擎自身通过 malloc 申请的内存（不属于 JS 堆）'],
  ['peak_malloced_memory', '上面那项的历史峰值'],
  ['number_of_native_contexts', '当前活跃的"上下文"个数，正常应为 1'],
  ['number_of_detached_contexts', '已分离但未回收的上下文，正常应为 0'],
  ['external_memory', '堆外内存总量（对应 memoryUsage().external）'],
  ['does_zap_garbage', '是否开启"用 0xDD 填充已回收内存"（调试用）'],
];

console.log('  ' + '字段'.padEnd(30) + '本次读数'.padEnd(14) + '含义');
console.log('  ' + '-'.repeat(104));
for (const [key, desc] of statRows) {
  const value = stats[key];
  const shown = key.startsWith('number_of') ? String(value) : key === 'does_zap_garbage' ? String(value) : approxMB(value);
  console.log(`  ${key.padEnd(28)}${shown.padEnd(14)}${desc}`);
}
console.log('');
console.log('这三个字段值得单独盯住：');
console.log('  · heap_size_limit：它决定了"什么时候崩"。涨到接近它就会抛');
console.log('    "JavaScript heap out of memory" 然后进程直接退出；');
console.log(`  · number_of_native_contexts = ${stats.number_of_native_contexts}：它是"当前活跃的执行上下文个数"。`);
console.log('    这个数字没有"必须是 1"的说法（Node 自身也要用掉一两个），');
console.log('    关键是它【应当长期保持不变】。持续增长说明有代码在反复创建');
console.log('    独立的执行上下文（历史上 vm 模块与一些测试框架踩过这个坑）；');
console.log(`  · number_of_detached_contexts = ${stats.number_of_detached_contexts}：正常是 0。大于 0 就是明确的泄漏信号。`);

// 2.2 按"空间"看堆的构成
console.log('');
console.log('v8.getHeapSpaceStatistics()：把堆拆成 V8 内部的空间来看');
const spaces = v8.getHeapSpaceStatistics();
const mainSpaces = ['read_only_space', 'new_space', 'old_space', 'code_space', 'large_object_space'];
console.log('  ' + '空间'.padEnd(24) + '已用'.padEnd(12) + '容量'.padEnd(12) + '说明');
console.log('  ' + '-'.repeat(100));
const spaceNotes = {
  read_only_space: '只读区：引擎内置的对象，创建后不再变化',
  new_space: '新生代：短命对象在这里诞生，回收极快（Scavenger）',
  old_space: '老生代：活过几轮 GC 的对象搬到这里，--max-old-space-size 管的就是它',
  code_space: 'JIT 编译后的机器码',
  map_space: '隐藏类（对象形状）的元数据',
  large_object_space: '大对象区：超过阈值的对象直接分配在这里，不参与新生代回收',
};
for (const space of spaces) {
  if (!mainSpaces.includes(space.space_name)) continue;
  console.log(
    `  ${space.space_name.padEnd(22)}${approxMB(space.space_used_size).padEnd(12)}${approxMB(space.space_size).padEnd(12)}${spaceNotes[space.space_name] ?? ''}`,
  );
}
console.log(`  （本环境下 V8 一共划分了 ${spaces.length} 个空间，其余是共享堆/信任区等细分区域。）`);
console.log('');
console.log('为什么要按空间看？');
console.log('  · new_space 反复涨落是【正常】的——那正是"短命对象被快速回收"的表现；');
console.log('  · old_space 持续单边上涨才是要警惕的信号；');
console.log('  · large_object_space 增长通常意味着有超大对象（大数组、大字符串被拼接）。');

// ---------------------------------------------------------------------------
// 3. --max-old-space-size：把堆上限握在自己手里
// ---------------------------------------------------------------------------

section(3, '--max-old-space-size 实测：开关如何改变上限');

/**
 * 起一个子进程，打印它的 heap_size_limit（MB）。
 * 用子进程是因为这个开关必须在进程启动时给定，运行中改不了。
 */
function heapLimitMB(oldSpaceMB) {
  const code = "console.log(Math.round(require('node:v8').getHeapStatistics().heap_size_limit / 1048576))";
  const args = oldSpaceMB ? [`--max-old-space-size=${oldSpaceMB}`, '-e', code] : ['-e', code];
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 15_000 });
  if (result.status !== 0) return `(子进程失败：${result.stderr.trim().split('\n')[0]})`;
  return Number(result.stdout.trim());
}

console.log(' 启动参数'.padEnd(34) + 'heap_size_limit');
console.log(' ' + '-'.repeat(60));
const noFlag = heapLimitMB(null);
const flag64 = heapLimitMB(64);
const flag128 = heapLimitMB(128);
console.log(` ${'（默认，不加参数）'.padEnd(32)}${noFlag} MB`);
console.log(` ${'--max-old-space-size=64'.padEnd(32)}${flag64} MB`);
console.log(` ${'--max-old-space-size=128'.padEnd(32)}${flag128} MB`);
console.log('');
console.log('从这三行能读出两个重要事实：');
console.log('  ① 默认上限是"跟机器有关"的（本环境约 ' + noFlag + ' MB，换台机器就不一样），');
console.log('     所以"我们服务默认能用多少内存"这个问题，必须实测而不是猜；');
console.log('  ② heap_size_limit ≠ max-old-space-size：');
console.log(`     传 64 得到的是 ${flag64} MB，传 128 得到的是 ${flag128} MB ——`);
console.log('     两者差值不是线性的固定值，因为除了老生代，V8 还要给新生代、');
console.log('     代码空间、只读区等留位置，而且整体还有一个下限。');
console.log('     结论：这个开关调的是"老生代"，不是"整个堆"。');
console.log('');
console.log('怎么在项目里用（都是启动参数，不是代码）：');
console.log('  $ node --max-old-space-size=512 dist/server.js');
console.log('  $ node --max-old-space-size=512 --heapsnapshot-near-heap-limit=3 dist/server.js');
console.log('      ↑ 接近上限时自动导出 3 份堆快照，用于事后分析 OOM 现场');
console.log('  容器里的经验值：把上限设成【容器内存上限的 70%~80%】，');
console.log('  给堆外内存、线程栈、原生库留出余量；设得比容器限额还大，');
console.log('  结果就是进程被 OOM Killer 直接杀掉，连 JS 的报错都看不到。');
console.log('');
console.log('【需手动操作】想看"堆被打满"的真实现场，可以自己跑这个（别在本示例里跑）：');
console.log('  node --max-old-space-size=64 -e "const a=[]; for(;;) a.push(new Array(1e6).fill(0))"');
console.log('  你会看到 "JavaScript heap out of memory" 和一份崩溃报告。');

// ---------------------------------------------------------------------------
// 4. 观察"增长"与"释放"：怎么读这些数字
// ---------------------------------------------------------------------------

section(4, '观察内存增长与释放：怎样才算"有问题"');

// 4.1 堆外内存：分配 10MB 的 ArrayBuffer，看 external / arrayBuffers 怎么变
const beforeOutOfHeap = process.memoryUsage();
const buffers = [];
const ALLOC_MB = 10;
for (let i = 0; i < ALLOC_MB; i++) {
  buffers.push(new Uint8Array(1024 * 1024)); // 每个 1MB，共 10MB
}
const afterOutOfHeap = process.memoryUsage();

console.log(`分配 ${ALLOC_MB} 个 1MB 的 Uint8Array（一共 ${ALLOC_MB} MB）之后：`);
console.log(`  arrayBuffers 增长了约 ${Math.round(toMB(afterOutOfHeap.arrayBuffers - beforeOutOfHeap.arrayBuffers))} MB`);
console.log(`  external     增长了约 ${Math.round(toMB(afterOutOfHeap.external - beforeOutOfHeap.external))} MB`);
console.log(`  heapUsed     增长了约 ${Math.round(toMB(afterOutOfHeap.heapUsed - beforeOutOfHeap.heapUsed))} MB`);
console.log('');
console.log('关键观察：ArrayBuffer 的内容【不在 V8 堆里】，所以 heapUsed 几乎没变，');
console.log('  但 external / arrayBuffers 涨了整整 10MB。');
console.log('  这就是"heapUsed 正常但 rss 很高"这一类问题的典型来源——');
console.log('  排查时必须把 external 和 arrayBuffers 一起看。');
console.log('');
console.log('Uint8Array 与 Buffer 的关系：Buffer 是 Uint8Array 的子类，');
console.log('  同样走 external 计量。读文件、图片、压缩包时的内存都在这里。');

// 4.2 堆内对象：分配一批对象，heapUsed 会增长
const beforeHeap = process.memoryUsage();
const objects = [];
for (let i = 0; i < 50_000; i++) {
  objects.push({ index: i, label: `item-${i}`, payload: 'x'.repeat(16) });
}
const afterHeap = process.memoryUsage();
console.log('');
console.log('往堆里塞 5 万个带字符串的小对象之后：');
console.log(`  heapUsed 增长了约 ${Math.round(toMB(afterHeap.heapUsed - beforeHeap.heapUsed))} MB`);
console.log('  （具体数值因对象布局、字符串驻留和 GC 时机而异，看量级即可）');
console.log(`  这 5 万个对象的总数校验：${objects.length}`);
console.log('');
console.log('把引用切断，再观察一次：');
objects.length = 0;
const afterRelease = process.memoryUsage();
console.log(`  切断引用后 heapUsed 变化约 ${Math.round(toMB(afterRelease.heapUsed - afterHeap.heapUsed))} MB`);
console.log('  ——这个数字【很可能接近 0】，因为 GC 并不保证此刻就跑。');
console.log('');
console.log('这正是内存诊断最容易误判的地方，务必记住：');
console.log('  ① 内存数字不立刻下降，不代表泄漏；GC 何时执行由引擎决定；');
console.log('  ② 内存数字下降，只能证明"这一次真的回收了"，不能证明"以后不会再涨"；');
console.log('  ③ 判断泄漏要看【趋势】：在相同业务量下反复做同一件事，');
console.log('     如果堆的"基线"（每次 GC 之后的最低点）持续抬高，才是泄漏；');
console.log('  ④ 想强制验证可达性，可以加 --expose-gc 启动，然后调用 global.gc()：');
console.log('     $ node --expose-gc 37_debugging_and_profiling/05_memory_diagnostics.js');
console.log('       然后在代码里 process.memoryUsage() 前后各调一次 global.gc()。');
console.log('     注意：--expose-gc 只用于本地诊断，不要带到生产环境。');

// ---------------------------------------------------------------------------
// 5. 堆快照：唯一能"看到对象和引用关系"的工具
// ---------------------------------------------------------------------------

section(5, '【需手动操作】堆快照的三种生成方式');

console.log('堆快照（.heapsnapshot）是一个包含"堆里所有对象 + 它们之间的引用关系"的文件，');
console.log('  用 Chrome DevTools 的 Memory 面板打开，就能回答"这个对象为什么没被回收"。');
console.log('  代价：生成过程会【暂停主线程】（几百毫秒到几十秒），文件大小与堆同量级。');
console.log('  所以本节只给方法，不在示例里真的执行。');
console.log('');
console.log('方式一：进程内主动导出（适合本地排查、测试环境）');
console.log('  import v8 from "node:v8";');
console.log('  const file = v8.writeHeapSnapshot();   // 返回写出的文件路径');
console.log('  // 也可以指定路径：v8.writeHeapSnapshot("/tmp/app.heapsnapshot")');
console.log('  ⚠ 它会同步暂停主线程，高峰期调用等同于一次故障。');
console.log('');
console.log('方式二：收到信号时导出（适合预发环境复现问题）');
console.log('  $ node --heapsnapshot-signal=SIGUSR2 dist/server.js');
console.log('  $ kill -USR2 <pid>        # Linux/macOS 上按需触发');
console.log('  Windows 没有 SIGUSR2，可以用方式一或方式三。');
console.log('');
console.log('方式三：用 inspector 会话流式导出（对服务影响最小，可控性最好）');
console.log('  import inspector from "node:inspector";');
console.log('  const session = new inspector.Session();');
console.log('  session.connect();');
console.log('  session.post("HeapProfiler.enable");');
console.log('  session.post("HeapProfiler.takeHeapSnapshot", { reportProgress: false });');
console.log('  // 通过 session 的 "HeapProfiler.addHeapSnapshotChunk" 事件接收数据块并写文件');
console.log('  ⚠ 这仍然是全量快照，只是把"写盘"从主线程挪开了。');
console.log('');
console.log('相关的还有这些启动参数（都能直接生成分析文件）：');
console.log('  --heap-prof                  生成堆分配采样文件（.heapprofile），看"谁在分配"');
console.log('  --cpu-prof                   生成 CPU 采样文件（.cpuprofile），看"时间花在哪"');
console.log('  --diagnostic-dir=<dir>       指定上面这些文件的输出目录');
console.log('  --heapsnapshot-near-heap-limit=<n>  接近堆上限时自动导出 n 份快照');
console.log('');
console.log('一个很关键的取舍：堆快照是"点"数据，只能告诉你"此刻谁占着内存"。');
console.log('  要看"一直在涨"的过程，就用分配采样（--heap-prof / Allocation sampling），');
console.log('  它们记录的是"一段时间内谁分配得多"，代价小得多，适合长时间开着。');

// ---------------------------------------------------------------------------
// 6. 用 Chrome DevTools 分析内存泄漏：完整步骤
// ---------------------------------------------------------------------------

section(6, '【需手动操作】用 Chrome DevTools 分析内存泄漏');

console.log('前置：Node 的快照可以直接拖进浏览器 DevTools 分析，不需要额外的界面：');
console.log('  ① 打开 Chrome → F12 → Memory 面板；');
console.log('  ② 左侧选择 "Heap snapshot"；');
console.log('  ③ 把 .heapsnapshot 文件【拖到面板上】（或用底部的 Load 按钮）；');
console.log('  ④ 之后就是下面这套流程。');
console.log('');
console.log('分析内存泄漏的标准流程（三步快照法）：');
const steps = [
  '让服务/页面进入"稳定态"：预热完成、缓存填满、没有任何正在进行的请求',
  '手动触发一次 GC（DevTools 左上角的垃圾桶图标；Node 侧用 --expose-gc + global.gc()）',
  '拍【快照 1】作为基线',
  '执行可疑操作 N 次（比如"打开详情页 100 次并关闭"）',
  '再触发一次 GC，拍【快照 2】',
  '再执行同样的操作 N 次，触发 GC，拍【快照 3】',
  '在快照 3 的视图里把比较对象选为【快照 2】，看 "Delta" 列 —— 两次操作之间仍在增长的对象就是泄漏嫌疑',
  '切到 Comparison 视图，按 "# Delta" 或 "Size Delta" 排序，找到增长最快的构造函数',
  '点开该构造函数 → 看 Retainers（引用者）面板 → 顺着引用链一路向上找到 GC 根',
  '确认根因后回到代码里修，重复上面流程验证 Delta 归零',
];
steps.forEach((s, i) => console.log(`  ${String(i + 1).padStart(2)}. ${s}`));
console.log('');
console.log('为什么是"三次"而不是"两次"：');
console.log('  快照 1 → 快照 2 之间新出现的对象里，有一部分是正常的缓存/懒加载；');
console.log('  再看 快照 2 → 快照 3 之间仍然存在的那些，才是"只增不减"的真泄漏。');
console.log('');
console.log('视图与关键列的含义：');
console.log('  · Summary：按构造函数聚合，最常用；');
console.log('  · Comparison：两个快照的差异，排查泄漏必用；');
console.log('  · Containment：按"谁包含谁"的树形展示，适合看 DOM/作用域；');
console.log('  · Statistics：按类型统计总览；');
console.log('  · Shallow Size：对象自身占的字节（不含它引用的对象）；');
console.log('  · Retained Size：回收这个对象后能释放的总字节（含它独占的子图）——');
console.log('      【按 Retained Size 排序】是最快找到"大块头"的办法；');
console.log('  · Distance：从 GC 根到这个对象经过了多少层引用。');
console.log('');
console.log('前端场景的两个专用技巧（Node 侧用不到，但值得知道）：');
console.log('  · 在筛选框里输入 "Detached"，找出"已经脱离 DOM 树但 JS 还引用着"的节点，');
console.log('    这是单页应用最经典的一类泄漏；');
console.log('  · 用 "Allocation instrumentation on timeline" 录制一段时间，');
console.log('    能直接看到"内存被分配后一直没被回收"的时间段和调用栈。');
console.log('');
console.log('最后一条经验：');
console.log('  快照能回答"谁占着内存"，但回答不了"是哪段业务逻辑写进去的"。');
console.log('  拿到可疑对象之后，通常是回到代码里 grep 这个类名/变量名，');
console.log('  找到那个"只增不减的全局 Map / 数组 / 事件监听器"——');
console.log('  具体模式见 31_performance_and_memory/09_memory_leak_patterns.js。');

// 收尾：把大数组释放掉，避免影响后续观察
buffers.length = 0;
console.log('');
console.log('（本示例已释放前面分配的对象；本进程即将退出，内存会被操作系统回收。）');

// ---------------------------------------------------------------------------
// 7. 检查清单
// ---------------------------------------------------------------------------

section(7, '内存诊断检查清单');

const checklist = [
  ['先看趋势，不看瞬时值', 'GC 时机由引擎决定，单点读数没有诊断价值'],
  ['heapUsed 与 rss 一起看', '两者背离时，问题多在堆外（Buffer / 原生模块）'],
  ['external 和 arrayBuffers 别漏掉', '数组缓冲区不占堆，但实实在在占内存'],
  ['number_of_detached_contexts 必须为 0', '大于 0 就是明确的泄漏信号'],
  ['容器限额配 --max-old-space-size', '经验值取容器上限的 70%~80%，留出堆外余量'],
  ['生产环境不要随手做全量堆快照', '会暂停主线程并写几百 MB 文件，等于一次故障'],
  ['优先用分配采样替代全量快照', '--heap-prof 的代价小得多，适合长时间开启'],
  ['用三次快照法区分"缓存"与"泄漏"', '只看两次快照会把正常缓存误判成泄漏'],
  ['按 Retained Size 排序找大块头', '比按 Shallow Size 更能定位真正的内存占用者'],
  ['定位到对象后回代码里找"只增不减"', '全局缓存、监听器、定时器是最高频的三类根因'],
];

console.log('要点'.padEnd(44) + '说明');
console.log('-'.repeat(100));
for (const [item, reason] of checklist) {
  console.log(item.padEnd(42) + reason);
}

console.log('');
console.log('一句话总结：memoryUsage 告诉你"用了多少"，堆统计告诉你"用在哪一层"，');
console.log('  堆快照告诉你"被谁占着"——三者配合，才能从"内存涨了"走到"哪一行代码涨的"。');
console.log(`\n本示例总耗时约 ${Date.now() - SCRIPT_START} ms。`);
console.log('示例结束。');
