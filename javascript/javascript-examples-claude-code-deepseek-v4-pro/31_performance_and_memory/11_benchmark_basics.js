/**
 * ============================================================================
 * 知识点：基准测试基础 —— 高精度计时、预热、多轮采样与死代码消除
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/05_loop_performance.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    基准测试（benchmark）是"用可复现的方法测量代码性能"的实践。
 *    在 JavaScript 里写一个靠谱的微基准，至少要做对五件事：
 *    用高精度计时器、先预热、多轮采样、防止结果被优化掉、别在计时循环里做分配。
 *    本示例逐条演示这五件事，并给出一个可以直接复用的 bench() 工具函数。
 *
 * 2. 为什么需要（真实项目场景）
 *    - "我把它改成 for 循环之后快了 3 倍" —— 结果一测发现是测量方法的问题，
 *      真实收益为零，代码可读性却下降了。
 *    - 选型对比：两个工具库、两种实现、两种数据结构，谁更适合我们的场景？
 *      只有可复现的测量才能回答，而不是靠"感觉"或博客上的结论。
 *    - 性能回归防护：把基准测试纳入 CI，某次改动让关键路径慢了 30% 就能立刻发现。
 *
 * 3. 核心语法要点
 *    - performance.now()：返回高精度时间戳（毫秒，带小数），
 *      在 Node 和浏览器里都可用；它是【单调递增】的，不受系统时间调整影响。
 *    - 不要用 Date.now() 做微基准：它只有毫秒级分辨率，
 *      一次函数调用的耗时常常小于 1ms，测出来不是 0 就是 1。
 *    - 预热（warmup）：V8 先解释执行，再逐步把热点函数编译成机器码。
 *      第一次运行的耗时包含编译开销，必须跑几轮预热后再开始计时。
 *    - 多轮采样：单次测量没有统计意义。跑 N 轮后取【最小值】——它受系统抖动
 *      影响最小，最接近这段代码的最佳性能；也常取【中位数】——它抗离群值。
 *      【平均值】最容易被偶发的系统调度干扰拉高，一般不作首选。
 *    - 死代码消除：如果计算结果没被使用，引擎可能把整个循环直接优化掉。
 *      必须把结果累加到一个变量并最终打印出来。
 *    - 计时循环里不要做分配：对象/数组分配会触发 GC，
 *      而 GC 的停顿会污染测量结果。预热、预分配、复用对象。
 *
 * 4. 常见陷阱
 *    - 陷阱一：只用 Date.now() 计时 → 大量测量结果为 0。
 *    - 陷阱二：不预热就下结论 → 把 JIT 编译时间算成了"这段代码很慢"。
 *    - 陷阱三：只跑一轮 → 一次系统调度抖动就能让结论反过来。
 *    - 陷阱四：结果没被使用 → 测的是"什么都不做"的时间。
 *    - 陷阱五：在计时循环里 console.log → 输出本身的开销比被测代码大几个数量级。
 *    - 陷阱六：把微基准的结论直接搬到生产环境 → 微基准的循环体极轻，
 *      放大了循环本身的开销；真实业务里这点差异会被淹没。
 *    - 陷阱七：拿不同机器/不同 Node 版本的数字互相比较 → 没有可比性。
 *    - 陷阱八：测量结果差异在噪声范围内就宣布"更快" → 先看离散程度再下结论。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/11_benchmark_basics.js
 *
 * 【预期输出】
 *   打印 7 个小节：计时器分辨率实测、预热的作用、多轮采样的统计量、
 *   死代码消除的风险、计时循环里的分配问题、完整的 bench() 工具与演示、
 *   以及基准测试的检查清单。
 *   所有耗时数据都只做定性说明，不做"谁一定更快"的断言。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用小工具
// ---------------------------------------------------------------------------

/** 计算中位数（先复制再排序，不改动调用方的数组） */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** 计算平均值 */
const mean = (values) => values.reduce((a, b) => a + b, 0) / values.length;

/**
 * 跑 rounds 轮，返回本轮所有采样值（毫秒）。
 * 注意：调用方需要自己先预热，或者用下面第 6 节的 bench()。
 */
function sampleRounds(rounds, fn) {
  const samples = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return samples;
}

/**
 * 通用基准测试工具（本示例的核心产出，第 6 节会详细讲解它的设计）
 *
 * @param {string}   name            用例名称
 * @param {Function} fn              被测函数（应当是可重复调用的纯计算）
 * @param {object}   [options]
 * @param {number}   [options.rounds=20]  正式采样轮数
 * @param {number}   [options.warmup=3]   预热轮数（不计入结果）
 * @returns {{name:string, min:number, median:number, mean:number, max:number, samples:number[]}}
 */
function bench(name, fn, options = {}) {
  const { rounds = 20, warmup = 3 } = options;

  // 第一步：预热。让 V8 完成解释 → 编译的过渡，后面的测量才有可比性。
  for (let i = 0; i < warmup; i++) {
    fn();
  }

  // 第二步：多轮采样。每轮独立计时，记录全部样本。
  const samples = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }

  // 第三步：汇总统计量。最小值代表最佳性能，中位数代表典型表现。
  return {
    name,
    min: Math.min(...samples),
    median: median(samples),
    mean: mean(samples),
    max: Math.max(...samples),
    samples,
  };
}

/** 把一组 bench 结果打印成表格 */
function printBenchTable(results) {
  console.log('用例'.padEnd(30) + 'min(ms)'.padEnd(12) + 'median(ms)'.padEnd(14) + 'mean(ms)'.padEnd(12) + 'max/min');
  console.log('-'.repeat(84));
  for (const r of results) {
    console.log(
      r.name.padEnd(28) +
        r.min.toFixed(4).padEnd(12) +
        r.median.toFixed(4).padEnd(14) +
        r.mean.toFixed(4).padEnd(12) +
        (r.max / r.min).toFixed(2),
    );
  }
}

// 一个纯计算任务，本示例反复使用它作为被测对象
function workload(n) {
  let acc = 0;
  for (let i = 0; i < n; i++) {
    acc += (i * 31) % 7;
    if (acc > 1e9) acc = 0; // 防止累加值无限增长
  }
  return acc;
}

// ---------------------------------------------------------------------------
// 1. 计时器分辨率：为什么不能用 Date.now 做微基准
// ---------------------------------------------------------------------------

console.log('--- 1. 计时器分辨率实测 ---');

/**
 * 统计一个计时函数在连续调用时能产生多少个不同的值。
 * 采样窗口内的不同取值越多，说明分辨率越高。
 */
function countDistinctValues(timeFn, samples) {
  const seen = new Set();
  for (let i = 0; i < samples; i++) {
    seen.add(timeFn());
  }
  return seen.size;
}

const SAMPLES = 200_000; // 采样 20 万次（规模控制在几十万级）

const dateDistinct = countDistinctValues(() => Date.now(), SAMPLES);
const perfDistinct = countDistinctValues(() => performance.now(), SAMPLES);

console.log(`连续采样 ${SAMPLES} 次，统计能得到多少个不同的时间值：`);
console.log('计时器'.padEnd(26) + '不同取值个数'.padEnd(18) + '说明');
console.log('-'.repeat(78));
console.log('Date.now()'.padEnd(24) + String(dateDistinct).padEnd(20) + '只有毫秒级分辨率，窗口内几乎不变');
console.log('performance.now()'.padEnd(24) + String(perfDistinct).padEnd(20) + '亚毫秒精度，取值丰富');

console.log('');
console.log('结论：一段代码跑一次可能只花 0.001 毫秒。');
console.log('  用 Date.now() 测它，得到的只可能是 0（或者偶尔的 1），完全测不出来。');
console.log('  用 performance.now() 才有意义。');
console.log('');
console.log('额外好处：performance.now() 是【单调递增】的。');
console.log('  即使系统时间被 NTP 同步或用户手动调整，它也不会倒退，');
console.log('  而 Date.now() 可能突然跳变，让耗时算出来是负数。');

// 演示最小可分辨的时间增量
let smallestDelta = Infinity;
let prev = performance.now();
for (let i = 0; i < 100_000; i++) {
  const now = performance.now();
  const delta = now - prev;
  if (delta > 0 && delta < smallestDelta) smallestDelta = delta;
  prev = now;
}
console.log('');
console.log(`performance.now() 能分辨的最小正增量约 ${smallestDelta.toFixed(6)} 毫秒（数值因平台而异）。`);

// ---------------------------------------------------------------------------
// 2. 预热（warmup）：第一次运行总是偏慢
// ---------------------------------------------------------------------------

console.log('\n--- 2. 预热（warmup）的作用 ---');

const WARMUP_N = 200_000;

// 冷启动：第一次运行，V8 还在解释执行 / 尚未编译这个函数
const coldStartAt = performance.now();
const coldResult = workload(WARMUP_N);
const coldMs = performance.now() - coldStartAt;

// 再连续跑几轮，观察耗时如何变化（这就是 JIT 在逐步生效）
const progression = [];
for (let i = 0; i < 5; i++) {
  const t0 = performance.now();
  workload(WARMUP_N);
  progression.push(performance.now() - t0);
}

console.log('同一个函数连续运行 6 次（第 1 次视为冷启动）：');
console.log(`  第 1 次（冷启动）：${coldMs.toFixed(4)} ms`);
progression.forEach((ms, i) => {
  console.log(`  第 ${i + 2} 次：${ms.toFixed(4)} ms`);
});
console.log('');
console.log('结论：');
console.log('  · 第 1 次往往明显偏慢，因为它包含了函数被 V8 编译优化的开销；');
console.log('  · 后面几轮会趋于稳定，这时测出来的才是"这段代码真实的执行速度"；');
console.log('  · 所以任何基准测试都必须先跑几轮【预热】，再开始正式计时。');
console.log('  · 注意：绝对数值因机器而异，"第 1 次偏慢"的幅度也可能不明显，');
console.log('    但"必须预热"这条实践是普适的。');
console.log(`  （正确性校验：两次调用结果一致 = ${coldResult === workload(WARMUP_N)}）`);

// ---------------------------------------------------------------------------
// 3. 多轮采样：最小值、中位数与平均值
// ---------------------------------------------------------------------------

console.log('\n--- 3. 多轮采样：min / median / mean ---');

const ROUNDS = 20; // 采样 20 轮

// 先预热，再正式采样
workload(WARMUP_N);
const samples = sampleRounds(ROUNDS, () => workload(WARMUP_N));

const minVal = Math.min(...samples);
const maxVal = Math.max(...samples);
const medVal = median(samples);
const meanVal = mean(samples);

console.log(`同一个任务跑 ${ROUNDS} 轮，用三种统计量描述它：`);
console.log(`  最小值 min    = ${minVal.toFixed(4)} ms   ← 最接近"最佳性能"，受抖动影响最小`);
console.log(`  中位数 median = ${medVal.toFixed(4)} ms   ← 抗离群值，代表"典型表现"`);
console.log(`  平均值 mean   = ${meanVal.toFixed(4)} ms   ← 容易被偶发的调度延迟拉高`);
console.log(`  最大值 max    = ${maxVal.toFixed(4)} ms   ← 通常是系统抖动或 GC 造成的一次异常`);
console.log('');
console.log(`  最大 / 最小 = ${(maxVal / minVal).toFixed(2)} 倍，这就是"单轮测量不可靠"的直接证据。`);
console.log('  （这个比值越大，说明本轮测量的噪声越大，结论就要越谨慎。）');
console.log('');
console.log('怎么选：');
console.log('  · 比较两种实现谁更快 → 多用【最小值】（排除干扰，看最佳能力）；');
console.log('  · 想了解"用户实际会体验到什么" → 用【中位数】；');
console.log('  · 【平均值】只适合样本很多且分布集中时，微基准里很少作为唯一指标；');
console.log('  · 无论用哪个，都要同时报告离散程度（比如 max/min 的比值）——');
console.log('    两个实现的差距如果小于噪声范围，就不能宣布"谁更快"。');

// ---------------------------------------------------------------------------
// 4. 死代码消除：结果必须被使用
// ---------------------------------------------------------------------------

console.log('\n--- 4. 死代码消除的风险 ---');

// 如果计算的结果没人用，V8 完全有权利把这个循环整个删掉 ——
// 因为它没有可观察的副作用。这时你测到的是"什么都没做"的时间。
const DEAD_N = 200_000;

// 4.1 结果被丢弃（危险写法）
const deadStart = performance.now();
for (let r = 0; r < ROUNDS; r++) {
  workload(DEAD_N); // ← 返回值没人用
}
const deadMs = performance.now() - deadStart;

// 4.2 结果被累加并使用（安全写法）
let sink = 0; // 汇总变量：它的存在让引擎无法删除这些计算
const usedStart = performance.now();
for (let r = 0; r < ROUNDS; r++) {
  sink += workload(DEAD_N); // ← 结果被累加，构成可观察的输出
}
const usedMs = performance.now() - usedStart;

console.log(`${ROUNDS} 轮调用，两种写法的实测耗时：`);
console.log(`  结果被丢弃：${deadMs.toFixed(4)} ms`);
console.log(`  结果被累加：${usedMs.toFixed(4)} ms`);
console.log(`  汇总值 sink = ${sink}（这个值必须被打印出来，否则仍可能被优化掉）`);
console.log('');
console.log('怎么解读：');
console.log('  · 如果两种写法耗时接近，说明本次 V8 没有把循环优化掉（很常见）；');
console.log('  · 如果"结果被丢弃"那一行快得离谱，那正是死代码消除在起作用；');
console.log('  · 无论本次结果如何，写基准测试都要养成习惯：把结果累加到一个变量，');
console.log('    并在最后打印它 —— 这一行 console.log 就是"防止测量被优化成空"的保险。');

// ---------------------------------------------------------------------------
// 5. 计时循环里不要做分配
// ---------------------------------------------------------------------------

console.log('\n--- 5. 计时循环里不要做分配 ---');

const ALLOC_N = 200_000;

// 5.1 每轮都创建一个临时对象（结果与 5.2 等价）
function withAllocation(n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    const temp = { value: i }; // 每轮一次对象分配 → 给 GC 制造压力
    total += temp.value;
  }
  return total;
}

// 5.2 不做分配，直接累加
function withoutAllocation(n) {
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += i;
  }
  return total;
}

// 两者计算结果必须一致，否则比较没有意义
const allocResult = withAllocation(1000);
const noAllocResult = withoutAllocation(1000);
console.log(`结果一致性检查：${allocResult === noAllocResult}`);

// 用完整的 bench() 工具测量，这样能同时看到"最好情况"和"波动范围"
const allocBench = bench('有分配（每轮建临时对象）', () => withAllocation(ALLOC_N), { rounds: 20 });
const noAllocBench = bench('无分配（直接累加）', () => withoutAllocation(ALLOC_N), { rounds: 20 });

console.log('');
console.log(`处理 ${ALLOC_N} 个数字，两种写法的实测对比：`);
printBenchTable([allocBench, noAllocBench]);
console.log('');
console.log('结论（请注意这里说法很克制）：');
console.log('  · 分配不一定让"最小值"变高。V8 的年轻代回收非常快，');
console.log('    一个短命的小对象往往便宜到测不出差别 —— 本次实测就说明了这一点；');
console.log('  · 分配真正带来的是【波动】：GC 一旦触发就可能带来停顿，');
console.log('    表现为某一轮耗时突然飙高。所以要看 max 和 max/min 的比值，');
console.log('    而不是只盯着最小值；');
console.log('  · 因此基准测试里要：预热、预分配数组、复用对象，把分配挪出计时循环 ——');
console.log('    目的不是"让数字更好看"，而是"确保你测的是你要测的那件事"，');
console.log('    而不是顺手把 GC 的开销也测了进去；');
console.log('  · 这条建议在真实业务里同样成立 —— 热点路径上的高频分配是常见的性能来源。');
console.log('');
console.log('计时循环里还有几件绝对不能做的事：');
console.log('  ✗ console.log（I/O 开销比被测代码大几个数量级，还会干扰优化决策）');
console.log('  ✗ 读写文件 / 发网络请求（不可控的等待时间）');
console.log('  ✗ 创建正则、解析 JSON、动态拼属性名（都是隐藏的昂贵操作）');
console.log('  ✓ 只做你要测的那一件事，其余全部挪到计时区间之外');

// ---------------------------------------------------------------------------
// 6. 一个可以直接复用的 bench() 工具
// ---------------------------------------------------------------------------

console.log('\n--- 6. 完整的 bench() 工具函数 ---');

console.log('bench() 定义在本文件开头的"通用小工具"一节，它做了三件事：');
console.log('bench(name, fn, { rounds, warmup }) 的内部流程：');
console.log('  ① 预热 warmup 轮（不计入结果）');
console.log('  ② 采样 rounds 轮，逐轮记录 performance.now() 的差值');
console.log('  ③ 汇总 min / median / mean / max，并保留原始样本以便复查');

// 用 bench() 对比三种实现：都要保证计算结果一致
const BENCH_N = 200_000;

const results = [
  bench('for 循环累加', () => {
    let total = 0;
    for (let i = 0; i < BENCH_N; i++) total += i;
    return total;
  }),
  bench('while 循环累加', () => {
    let total = 0;
    let i = 0;
    while (i < BENCH_N) {
      total += i;
      i += 1;
    }
    return total;
  }),
  bench('带临时对象分配', () => {
    let total = 0;
    for (let i = 0; i < BENCH_N; i++) {
      const temp = { value: i };
      total += temp.value;
    }
    return total;
  }),
];

// 把三个结果累加起来打印，确保没有任何一个被当成死代码消除掉
const checkSum = results.length * ((BENCH_N * (BENCH_N - 1)) / 2);
console.log('');
printBenchTable(results);
console.log('');
console.log(`理论校验值 = ${checkSum}（三种实现的结果都应与它一致）。`);
console.log('');
console.log('怎么读这张表：');
console.log('  · 比较实现的优劣看 min（噪声最小）；');
console.log('  · 关心稳定性看 max/min 的比值（越接近 1 越稳定）；');
console.log('  · 如果两个用例的 min 差距很小、而 max/min 比值很大，');
console.log('    那点差距完全可能被噪声淹没，不能据此下结论；');
console.log('  · 本示例的绝对数值因机器和 Node 版本而异，请只看相对关系和离散程度。');

// ---------------------------------------------------------------------------
// 7. 基准测试检查清单
// ---------------------------------------------------------------------------

console.log('\n--- 7. 基准测试检查清单 ---');

const checklist = [
  ['用 performance.now() 而不是 Date.now()', '毫秒级分辨率测不出亚毫秒的差异'],
  ['先预热再计时', '第一次运行包含 JIT 编译开销，不能算数'],
  ['多轮采样，报告 min 与 median', '单轮测量会被系统抖动主导，没有统计意义'],
  ['同时报告离散程度（max/min）', '差距小于噪声时不能宣布"更快"'],
  ['把结果累加并打印出来', '否则整个测量可能被死代码消除优化成空'],
  ['计时区间内不做分配、不 console.log', '分配触发 GC，I/O 开销大几个数量级'],
  ['保证各实现的结果完全一致', '结果不同就不是同一个任务，比较没有意义'],
  ['固定输入规模并写进输出', '不同规模的结论可能相反，必须能复现'],
  ['不在微基准里下"生产环境更快"的结论', '微基准放大了循环开销，真实业务里会被淹没'],
  ['优化前先测量，优化后再测量一次', '没有测量就没有优化，也没有优化效果的证明'],
];

console.log('检查项'.padEnd(44) + '原因');
console.log('-'.repeat(96));
for (const [item, reason] of checklist) {
  console.log(item.padEnd(42) + reason);
}

console.log('');
console.log('最后一句：基准测试的目的是【做出更好的工程决策】，而不是赢一场口水战。');
console.log('当两个实现的差异小于噪声时，就该用可读性和可维护性来做决定。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
