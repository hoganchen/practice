/**
 * ============================================================================
 * 知识点：算法复杂度与大 O 记号 —— 用实测计时验证增长趋势
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】入门
 * 【前置知识】无（本目录的起点，后续所有文件都建立在本文的概念上）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    大 O 记号（Big-O notation）描述的是：当输入规模 n 不断增大时，
 *    算法的耗时（时间复杂度）或额外内存（空间复杂度）的【增长趋势】。
 *    它不关心具体跑了多少毫秒，只关心"n 翻倍时，耗时大约变成几倍"。
 *
 *    三条约定，缺一不可：
 *    (1) 只保留最高阶项：3n² + 100n + 5000  →  O(n²)
 *        因为 n 足够大时，n² 项会彻底压过其余项。
 *    (2) 忽略常数因子：2n 和 100n 都是 O(n)，因为它们"增长趋势相同"。
 *    (3) 区分最好/最坏/平均情况：同一个算法，输入不同复杂度可能不同。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 一次线上事故：列表页对 5000 条数据做"两两比对去重"，写成双重循环
 *      O(n²)，本地测 100 条毫无感觉，上线后接口从 20ms 变成 8 秒。
 *    - 选型决策：同样是"查一个 ID 在不在集合里"，用数组是 O(n)，
 *      用 Set/Map 是 O(1)；数据量一万以上，性能差 3 个数量级。
 *    - 容量规划：分页接口单页 20 条时一切正常，改成"导出全量 10 万条"
 *      才发现排序 + 过滤是 O(n log n)，报表导出超时。
 *    - 它也是面试语言：说得出"这个操作为什么是 O(1) 均摊"，
 *      比背下"链表插入快"更能体现你真的理解。
 *
 * 3. 核心语法要点 / 算法思想
 *    - 常见增长阶（从好到坏）：
 *      O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)
 *    - 怎么从代码看复杂度：
 *      · 没有循环、没有递归 → O(1)
 *      · 循环里每一步把问题规模【减半】 → O(log n)
 *      · 一层循环遍历 n 个元素 → O(n)
 *      · 分治 + 每层合并 O(n)，共 log n 层 → O(n log n)
 *      · 两层嵌套循环、每层都跑 n 次 → O(n²)
 *      · 每个元素都有"选/不选"两种可能并全部枚举 → O(2ⁿ)
 *    - 空间复杂度：只数【额外】开辟的空间，输入本身不计。
 *      · 原地交换（swap）→ O(1)
 *      · 新建一个和输入等长的数组 → O(n)
 *      · 递归调用栈的深度也要算进去 → 递归版遍历二叉树是 O(h)
 *    - 均摊分析（amortized analysis）：单次操作偶尔很贵，但把总代价
 *      平摊到每一次操作上仍然是常数，这就是"均摊 O(1)"。
 *      动态数组 push 就是最经典的例子（见第 6 节）。
 *
 * 4. 常见陷阱
 *    - 陷阱一：把大 O 当绝对速度。O(1) 也有常数开销：算哈希、查表、函数调用。
 *      n 很小（比如 8 个元素）时，数组线性扫描常常比 Set.has 更快。
 *    - 陷阱二：常数因子在 n 小时说了算。1000n 的算法在 n=100 时比 n² 慢，
 *      但 n=10000 时快 100 倍。大 O 是"长期趋势"，不是"短期排名"。
 *    - 陷阱三：忽略隐藏的循环。array.includes / filter / map / splice /
 *      String 的字符串拼接，每一个都是 O(n)，写在循环里就变成 O(n²)。
 *    - 陷阱四：只看平均忘了最坏。哈希表平均 O(1)，最坏 O(n)；
 *      快速排序平均 O(n log n)，最坏 O(n²)。
 *    - 陷阱五：把"循环次数"当成"复杂度"。循环 1 亿次但每次都 O(1)，是 O(n) 不是 O(1)；
 *      递归 30 层的二分查找只循环 30 次，却是 O(log n)。
 *    - 陷阱六：实测时忽略 JIT 与缓存。第一次运行包含编译开销，
 *      必须预热；数组连续内存对 CPU 缓存友好，链表跳跃访问会 cache miss，
 *      这会让"理论更快"的结构在实测中未必更快。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/01_big_o_and_complexity.js
 *
 * 【预期输出】
 *   打印 7 个小节：大 O 的三条约定、常见增长阶对照表、
 *   "规模翻倍"实测实验（O(1)/O(log n)/O(n)/O(n log n)/O(n²) 逐一验证）、
 *   同规模下不同增长阶的横向对比、空间复杂度、均摊分析（动态数组 push）、
 *   以及常见误区总结。所有实测数据只做定性说明，不断言绝对数值。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用计时工具
// ---------------------------------------------------------------------------

/** 计算中位数（不改动入参数组） */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * 跑 rounds 轮取中位数耗时（毫秒）。
 * 先预热 1 轮，避免把 JIT 编译开销算进来；
 * 取中位数而不是平均值，是为了抗住偶发的系统调度抖动。
 */
function medianMs(fn, rounds = 5) {
  fn(); // 预热
  const samples = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return median(samples);
}

/** 构造 n 个元素的数组 */
function rangeArr(n) {
  const a = new Array(n);
  for (let i = 0; i < n; i++) a[i] = i;
  return a;
}

/**
 * 构造一个"确定性的乱序数组"。
 * 用 Lehmer 线性同余生成器而不是 Math.random()，是为了让每次运行结果可复现，
 * 也让"排序"这个被测任务每次面对的是同一份输入。
 */
function shuffledRange(n, seed = 20240916) {
  const a = rangeArr(n);
  let s = seed;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

const sink = { value: 0 }; // 汇总变量：防止计算结果被 V8 当成死代码消除

// ---------------------------------------------------------------------------
// 1. 三种算法实现，分别代表不同增长阶
// ---------------------------------------------------------------------------

/** O(1)：按下标访问数组，耗时与 n 无关（第 3 节的实测会直接内联这个操作） */
function accessAt(arr, i) {
  return arr[i];
}

/** O(log n)：二分查找，每比较一次就把搜索范围减半 */
function binarySearch(arr, target) {
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = lo + ((hi - lo) >> 1); // 这样写避免 (lo+hi) 溢出（详见 09_searching_algorithms.js）
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

/** O(n)：一次遍历求和，每个元素恰好碰一次 */
function sumAll(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) total += arr[i];
  return total;
}

/**
 * O(n²)：朴素查重。外层第 i 个元素要和它后面的每个元素比一次。
 * 比较次数 = (n-1) + (n-2) + ... + 1 = n(n-1)/2 ≈ n²/2。
 */
function hasDuplicateNaive(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 1. 大 O 的三条约定
// ---------------------------------------------------------------------------

console.log('--- 1. 大 O 记号的三条约定 ---');
console.log('');
console.log('约定一：只保留最高阶项');
console.log('  代价函数 f(n) = 3n² + 100n + 5000');
console.log('  n=10      时：3*100 + 1000 + 5000 = 6300      ← 常数项还占大头');
console.log('  n=1000    时：3000000 + 100000 + 5000 ≈ 3105000  ← n² 项已占 96%');
console.log('  n=1000000 时：n² 项占 99.99% 以上');
console.log('  → 所以写成 O(n²)：n 足够大时，其余项可以忽略。');

// 用数字把上面这段话算出来，读者可以自己核对
for (const n of [10, 1000, 100000]) {
  const quadratic = 3 * n * n;
  const linear = 100 * n;
  const constant = 5000;
  const total = quadratic + linear + constant;
  const share = ((quadratic / total) * 100).toFixed(2);
  console.log(
    `  n=${String(n).padEnd(8)} 3n²=${String(quadratic).padEnd(16)} 100n=${String(linear).padEnd(10)} ` +
      `+5000  → n² 项占比 ${share}%`,
  );
}
console.log('');
console.log('约定二：忽略常数因子');
console.log('  2n 与 100n 都是 O(n) —— 因为 n 翻倍时两者都翻倍，趋势完全相同。');
console.log('  这也是"实测耗时"和"大 O"不能互相替代的原因：');
console.log('  大 O 说的是趋势，实测说的是这台机器上此刻的真实速度。');
console.log('');
console.log('约定三：区分最好/最坏/平均情况');
console.log('  二分查找：最好 1 次命中 O(1)；最坏 log₂n 次 O(log n)；平均也接近 O(log n)');
console.log('  快速排序：平均 O(n log n)；最坏（每次分区都极不均匀）O(n²)');
console.log('  哈希查找：平均 O(1)；最坏（所有键都撞进同一个桶）O(n)');
console.log('  工程上必须关注【最坏情况】，因为线上真的会遇到恶意构造的输入。');

// ---------------------------------------------------------------------------
// 2. 常见增长阶对照表
// ---------------------------------------------------------------------------

console.log('\n--- 2. 常见增长阶对照表（假设 O(n) 的算法在 n=1000 时耗时 1 微秒）---');
console.log('');

const BASE_OPS = 1000;

// 每个增长阶在 n 下的"操作次数"，用同一把尺子换算成耗时便于直观比较
const growthFns = [
  ['O(1)        常数阶', () => 1],
  ['O(log n)    对数阶', (n) => Math.log2(n)],
  ['O(n)        线性阶', (n) => n],
  ['O(n log n)  线性对数阶', (n) => n * Math.log2(n)],
  ['O(n²)       平方阶', (n) => n * n],
  ['O(2ⁿ)       指数阶', (n) => Math.pow(2, n)],
];

const sizes = [10, 100, 1000, 10000, 1000000];

// 计算 O(n) 这一行在 n=1000 时的操作数，作为换算基准（1 微秒 = 1000 纳秒）
const baseline = BASE_OPS;

/** 把操作次数换算成人类可读的时间字符串 */
function humanTime(ops) {
  const ns = ops * (1000 / baseline); // ops 次操作，按"1000 次操作 = 1 微秒"换算
  if (ns < 1e3) return `${ns.toFixed(2)} ns`;
  if (ns < 1e6) return `${(ns / 1e3).toFixed(2)} μs`;
  if (ns < 1e9) return `${(ns / 1e6).toFixed(2)} ms`;
  if (ns < 1e9 * 60) return `${(ns / 1e9).toFixed(2)} s`;
  if (ns < 1e9 * 3600) return `${(ns / 1e9 / 60).toFixed(2)} 分`;
  if (ns < 1e9 * 86400) return `${(ns / 1e9 / 3600).toFixed(2)} 小时`;
  if (ns < 1e9 * 86400 * 365) return `${(ns / 1e9 / 86400).toFixed(2)} 天`;
  return `${(ns / 1e9 / 86400 / 365).toFixed(2)} 年`;
}

console.log('复杂度'.padEnd(24) + sizes.map((s) => `n=${s}`.padEnd(16)).join(''));
console.log('-'.repeat(24 + 16 * sizes.length));
for (const [name, fn] of growthFns) {
  const cells = sizes.map((n) => {
    const ops = fn(n);
    // 指数阶在 n=1000000 时是 Infinity，单独处理
    if (!Number.isFinite(ops) || ops > 1e30) return '天文数字'.padEnd(16);
    return humanTime(ops).padEnd(16);
  });
  console.log(name.padEnd(22) + cells.join(''));
}
console.log('');
console.log('读表要点：');
console.log('  · O(1) 一行永远不变 —— 这就是"常数时间"的含义；');
console.log('  · O(log n) 增长极慢：n 从 10 涨到 100 万（10 万倍），耗时只从 3.3 涨到 20（6 倍）；');
console.log('  · O(n²) 在 n=100 万时约 16.7 分钟 —— 这就是"双重循环处理全量数据"为什么会炸；');
console.log('  · O(2ⁿ) 在 n=100 时已经是天文数字 —— 暴力枚举所有子集的算法不可用于稍大的输入。');

// ---------------------------------------------------------------------------
// 3. 实测：规模翻倍实验（验证增长趋势）
// ---------------------------------------------------------------------------

console.log('\n--- 3. 实测：把 n 翻倍，耗时应该变成几倍？ ---');
console.log('');
console.log('理论预期：');
console.log('  O(1)        → n 翻倍，耗时不变，比值 ≈ 1');
console.log('  O(log n)    → n 翻倍，只多一次比较，比值 ≈ 1.05~1.2（增长极慢）');
console.log('  O(n)        → n 翻倍，耗时翻倍，比值 ≈ 2');
console.log('  O(n log n)  → 比值 ≈ 2 略多一点（2 × log2(2n)/log2(n)）');
console.log('  O(n²)       → n 翻倍，耗时变 4 倍，比值 ≈ 4');
console.log('');
console.log('测量纪律（详见 31_performance_and_memory/11_benchmark_basics.js）：');
console.log('  ① 数据在计时区间【之外】预先构造好，否则测到的是"造数据"的时间；');
console.log('  ② 先预热一轮，避开 JIT 编译开销；');
console.log('  ③ 每个用例跑多轮取【中位数】，抗住系统调度抖动；');
console.log('  ④ 结果累加到 sink 并最终打印，避免被死代码消除。');

// 预先构造好所有输入数据（全部在计时区间之外）
const DATA = {
  arr1k: rangeArr(1000),
  arr100k: rangeArr(100000),
  arr1k_sorted: rangeArr(1024),
  arr1m_sorted: rangeArr(1048576),
  arr200k: rangeArr(200000),
  arr400k: rangeArr(400000),
  shuffled50k: shuffledRange(50000),
  shuffled100k: shuffledRange(100000),
  arr4k: rangeArr(4000), // 全不重复 → 查重跑满最坏情况
  arr8k: rangeArr(8000),
};

const O1_OPS = 500_000; // O(1) 用例固定"操作次数"，只改变数组规模
const LOG_OPS = 100_000; // O(log n) 用例固定"查询次数"
const SUM_REPEAT = 10; // O(n) 用例把同一个数组重复求和若干遍，放大到可测量

const cases = [
  {
    name: 'O(1) 按下标访问',
    theory: '≈ 1',
    smallN: 1000,
    largeN: 100000,
    small: () => {
      let acc = 0;
      const a = DATA.arr1k;
      for (let i = 0; i < O1_OPS; i++) acc += accessAt(a, i % 1000);
      sink.value = acc;
    },
    large: () => {
      let acc = 0;
      const a = DATA.arr100k;
      for (let i = 0; i < O1_OPS; i++) acc += accessAt(a, i % 1000);
      sink.value = acc;
    },
  },
  {
    name: 'O(log n) 二分查找',
    theory: '≈ 2（含缓存影响）',
    smallN: 1024,
    largeN: 1048576,
    small: () => {
      let acc = 0;
      const a = DATA.arr1k_sorted;
      for (let i = 0; i < LOG_OPS; i++) acc += binarySearch(a, (i * 7) % 1024);
      sink.value = acc;
    },
    large: () => {
      let acc = 0;
      const a = DATA.arr1m_sorted;
      for (let i = 0; i < LOG_OPS; i++) acc += binarySearch(a, (i * 7) % 1048576);
      sink.value = acc;
    },
  },
  {
    name: 'O(n) 遍历求和',
    theory: '≈ 2',
    smallN: 200000,
    largeN: 400000,
    small: () => {
      let acc = 0;
      for (let r = 0; r < SUM_REPEAT; r++) acc += sumAll(DATA.arr200k);
      sink.value = acc;
    },
    large: () => {
      let acc = 0;
      for (let r = 0; r < SUM_REPEAT; r++) acc += sumAll(DATA.arr400k);
      sink.value = acc;
    },
  },
  {
    name: 'O(n log n) 排序',
    theory: '≈ 2.1',
    smallN: 50000,
    largeN: 100000,
    small: () => {
      const a = [...DATA.shuffled50k]; // 复制一份，保证每次排序的都是同一份乱序输入
      a.sort((x, y) => x - y);
      sink.value = a[0] + a[a.length - 1];
    },
    large: () => {
      const a = [...DATA.shuffled100k];
      a.sort((x, y) => x - y);
      sink.value = a[0] + a[a.length - 1];
    },
  },
  {
    name: 'O(n²) 双重循环查重',
    theory: '≈ 4',
    smallN: 4000,
    largeN: 8000,
    small: () => {
      sink.value = hasDuplicateNaive(DATA.arr4k);
    },
    large: () => {
      sink.value = hasDuplicateNaive(DATA.arr8k);
    },
  },
];

const ROUNDS = 3; // 每项采样 3 轮取中位数（再多会增加总耗时，收益有限）

console.log('');
console.log('用例'.padEnd(24) + 'n(小)'.padEnd(9) + 'n(大)'.padEnd(9) + '小n(ms)'.padEnd(11) + '大n(ms)'.padEnd(11) + '实测比值'.padEnd(11) + '理论');
console.log('-'.repeat(94));

for (const c of cases) {
  const smallMs = medianMs(c.small, ROUNDS);
  const largeMs = medianMs(c.large, ROUNDS);
  const ratio = largeMs / smallMs;
  console.log(
    c.name.padEnd(22) +
      String(c.smallN).padEnd(9) +
      String(c.largeN).padEnd(9) +
      smallMs.toFixed(4).padEnd(11) +
      largeMs.toFixed(4).padEnd(11) +
      ratio.toFixed(2).padEnd(11) +
      c.theory,
  );
}

console.log('');
console.log('怎么读这张表（请务必读完再下结论）：');
console.log('  · 实测比值【不会】精确等于理论值 —— JIT 优化、CPU 缓存、GC、常数开销都会干扰；');
console.log('  · 关键是看【档位】，而不是小数点：');
console.log('      O(1)     比值在 1 附近  → 规模翻倍跟它没关系');
console.log('      O(log n) 比值在 2 附近（但绝对耗时极小）→ 几乎不随 n 增长');
console.log('      O(n)     比值在 2 附近');
console.log('      O(n²)    比值在 4 附近  → 这才是"危险信号"');
console.log('  · 注意 O(log n) 与 O(n) 的比值看起来都在 2 附近，但它们的【绝对耗时】');
console.log('    差了 2~3 个数量级：比较增长趋势要看比值，比较快慢要看绝对耗时，两者不能混用；');
console.log('  · O(log n) 那一行的比值常常高于理论值 1.1，原因是 CPU 缓存：');
console.log('    n=1024 的数组整个装进 L1 缓存，n=1048576 的数组每一步都可能 cache miss，');
console.log('    这正是"大 O 只描述趋势，真实速度还取决于内存层级"的活证据；');
console.log('  · O(n²) 那一行的比值会围绕 4 上下浮动，原因是 V8 在更大规模下把热点编译得更激进。');
console.log('    这类"实测偏离理论"的现象本身就是重要的工程知识：理论给方向，实测定结论。');

// ---------------------------------------------------------------------------
// 4. 实测：同一个任务的三种实现（这才是选型时真正会遇到的对比）
// ---------------------------------------------------------------------------

console.log('\n--- 4. 同一个任务的三种实现：哪个值在不在集合里 ---');
console.log('');
console.log('任务：在 n 个整数的集合中，查询 Q 次"某个值是否存在"。');
console.log('三种实现（都解决同一个问题，所以可以直接横向比较）：');
console.log('  A. 线性查找 Array.includes      —— 每次 O(n)');
console.log('  B. 先排序 + 二分查找            —— 每次 O(log n)，但排序本身要一次性 O(n log n)');
console.log('  C. 哈希表 Set.has               —— 每次 O(1)');
console.log('');

const QUERIES = 150;

/** 构造查询目标：一半命中、一半不命中，模拟真实场景 */
function buildProbeTargets(n, count) {
  const targets = new Array(count);
  let s = 777;
  for (let i = 0; i < count; i++) {
    s = (s * 48271) % 2147483647;
    const v = s % n;
    targets[i] = i % 2 === 0 ? v : v + n; // 偶数下标命中，奇数下标一定不命中
  }
  return targets;
}

/** A. 线性查找 */
function queryByIncludes(arr, targets) {
  let hit = 0;
  for (const t of targets) if (arr.includes(t)) hit += 1;
  return hit;
}

/** B. 排序 + 二分查找 */
function queryByBinarySearch(sortedArr, targets) {
  let hit = 0;
  for (const t of targets) if (binarySearch(sortedArr, t) !== -1) hit += 1;
  return hit;
}

/** C. 哈希查找 */
function queryBySet(set, targets) {
  let hit = 0;
  for (const t of targets) if (set.has(t)) hit += 1;
  return hit;
}

console.log('规模 n'.padEnd(12) + 'A.includes(ms)'.padEnd(18) + 'B.二分查找(ms)'.padEnd(18) + 'C.Set.has(ms)'.padEnd(16) + 'A/C 倍数');
console.log('-'.repeat(78));

for (const n of [20000, 200000]) {
  const arr = rangeArr(n);
  const sorted = arr.slice(); // 已有序，二分查找直接可用
  const set = new Set(arr);
  const targets = buildProbeTargets(n, QUERIES);

  // 三种实现的命中数必须完全一致，否则就不是"同一个任务"
  const hA = queryByIncludes(arr, targets);
  const hB = queryByBinarySearch(sorted, targets);
  const hC = queryBySet(set, targets);

  const msA = medianMs(() => {
    sink.value = queryByIncludes(arr, targets);
  }, ROUNDS);
  const msB = medianMs(() => {
    sink.value = queryByBinarySearch(sorted, targets);
  }, ROUNDS);
  const msC = medianMs(() => {
    sink.value = queryBySet(set, targets);
  }, ROUNDS);

  console.log(
    String(n).padEnd(12) +
      msA.toFixed(4).padEnd(18) +
      msB.toFixed(4).padEnd(18) +
      msC.toFixed(4).padEnd(16) +
      (msA / msC).toFixed(1),
  );

  // 把一致性检查放进循环体内，每行规模都验证一次
  console.log(
    `  ↳ 正确性检查：三种实现命中数 A=${hA} B=${hB} C=${hC}，结果一致 = ${hA === hB && hB === hC}`,
  );
}

console.log('');
console.log('另外单独测一次"一次性投入"：把 n 个元素排好序需要多久（B 方案的隐藏成本）');
const t0sort = performance.now();
const sortedOnce = [...DATA.shuffled100k].sort((x, y) => x - y);
const sortMs = performance.now() - t0sort;
sink.value = sortedOnce[0];
console.log(`  n=100000 排序耗时约 ${sortMs.toFixed(3)} ms（一次性成本，可复用多次查询）`);

console.log('');
console.log('结论：');
console.log('  1. 三种实现结果完全相同，差别只在速度 —— 这就是"选数据结构"的全部意义；');
console.log('  2. n 从 2 万涨到 20 万（10 倍），A 方案的耗时约涨 10 倍；');
console.log('     B、C 方案几乎不变 —— 因为它们的复杂度不随 n 线性增长；');
console.log('  3. B 方案要额外付一次排序成本，如果只查一两次，排序反而不划算；');
console.log('     查得越多次，这次排序摊得越薄 —— 这又是"均摊"的思想；');
console.log('  4. C 方案代码最短、最快，但它会额外占用 O(n) 内存，且元素必须可哈希。');
console.log('     选型的本质是：拿时间、空间、可读性三者做取舍。');

// ---------------------------------------------------------------------------
// 5. 空间复杂度
// ---------------------------------------------------------------------------

console.log('\n--- 5. 空间复杂度：额外开了多少内存 ---');

// O(1) 空间：只用两个临时变量就完成交换
function swapInPlace(arr, i, j) {
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
  return arr;
}

// O(n) 空间：新建了一个和输入等长的数组
function doubleAll(arr) {
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) out[i] = arr[i] * 2;
  return out;
}

// O(n) 空间（递归栈）：朴素递归求阶乘，调用栈深度为 n
function factorialRecursive(n) {
  if (n <= 1) return 1;
  return n * factorialRecursive(n - 1);
}

const demo = [1, 2, 3, 4, 5];
console.log('操作前：', JSON.stringify(demo));
swapInPlace(demo, 0, 4);
console.log('原地交换后（额外空间 O(1)）：', JSON.stringify(demo));
console.log('翻倍结果（额外空间 O(n)，原数组不动）：', JSON.stringify(doubleAll(demo)));
console.log(`factorialRecursive(10) = ${factorialRecursive(10)}（调用栈深度 10，额外空间 O(n)）`);
console.log('');
console.log('空间复杂度速查：');
console.log('  · 只用了固定几个变量            → O(1)，叫「原地算法」in-place');
console.log('  · 新建了和输入等长的数组/对象   → O(n)');
console.log('  · 二维表格 / 矩阵               → O(n²)，比如动态规划的 dp 表');
console.log('  · 递归调用栈                   → O(递归深度)，这一步最容易被忽略');
console.log('  · 链表每个节点都要存 next 指针  → 同样是 O(n) 数据，链表的内存开销比数组大');
console.log('');
console.log('工程取舍：');
console.log('  · 归并排序 O(n log n) 时间 / O(n) 空间；堆排序 O(n log n) 时间 / O(1) 空间');
console.log('    时间一样时，内存紧张的嵌入式环境会选堆排序（哪怕它常数更大）；');
console.log('  · 用 Map 做缓存换时间，本质就是拿空间换时间 —— 一定要设上限，否则就是内存泄漏。');

// ---------------------------------------------------------------------------
// 6. 均摊分析：动态数组 push 为什么是 O(1)（均摊）
// ---------------------------------------------------------------------------

console.log('\n--- 6. 均摊分析：动态数组 push 为什么是「O(1) 均摊」---');
console.log('');
console.log('问题：数组满了要扩容，扩容必须把老元素全部搬到新内存 —— 这不是 O(n) 吗？');
console.log('答案：是，但扩容不是每次都发生。把总代价摊到每次 push 上，平均还是 O(1)。');
console.log('');
console.log('扩容策略：满了就把容量【翻倍】。下面用计数模拟来证明这一点。');

/**
 * 模拟动态数组：只关心"容量"和"搬移次数"，不真正存数据。
 * 每次 push：
 *   - 若 size < capacity，直接放，代价 0 次搬移；
 *   - 若 size === capacity，容量翻倍，把已有 size 个元素搬过去，代价 size 次搬移。
 */
function simulateDynamicArray(pushCount) {
  let capacity = 1;
  let size = 0;
  let totalCopies = 0; // 累计搬移次数
  const copyPerPush = []; // 记录每次 push 的搬移代价，用于展示

  for (let i = 0; i < pushCount; i++) {
    if (size === capacity) {
      // 扩容：搬移 size 个元素，容量翻倍
      totalCopies += size;
      copyPerPush.push(size);
      capacity *= 2;
    } else {
      copyPerPush.push(0);
    }
    size += 1;
  }
  return { capacity, size, totalCopies, copyPerPush };
}

const PUSH_N = 1024; // 1024 = 2^10，方便观察翻倍
const sim = simulateDynamicArray(PUSH_N);

console.log('');
console.log(`连续 push ${PUSH_N} 次的结果：`);
console.log(`  最终 size      = ${sim.size}`);
console.log(`  最终 capacity  = ${sim.capacity}`);
console.log(`  累计搬移次数   = ${sim.totalCopies}`);
console.log(`  平均每次 push  = ${(sim.totalCopies / PUSH_N).toFixed(4)} 次搬移`);
console.log(`  放大到 ${PUSH_N} 次 push，最坏一次搬移了 ${Math.max(...sim.copyPerPush)} 个元素`);
console.log('');
console.log('哪几次 push 是"贵"的（发生了扩容搬移）：');
const expensive = [];
sim.copyPerPush.forEach((c, i) => {
  if (c > 0) expensive.push(`第 ${i + 1} 次 push（搬移 ${c} 个）`);
});
console.log('  ' + expensive.join('\n  '));
console.log('');
console.log('数学证明：');
console.log('  扩容发生在 size = 1, 2, 4, 8, ..., n/2 时，搬移代价分别是 1, 2, 4, ..., n/2。');
console.log('  总搬移次数 = 1 + 2 + 4 + ... + n/2 = n - 1 < n。');
console.log('  摊到 n 次 push 上，平均每次不到 1 次搬移 → 【均摊 O(1)】。');
console.log('');
console.log('为什么是"均摊"而不是"最坏"？');
console.log('  · 单次 push 的最坏复杂度是 O(n)（正好赶上扩容的那一次）；');
console.log('  · 连续 n 次 push 的总复杂度是 O(n)，平均每次 O(1)，这叫均摊复杂度；');
console.log('  · 工程含义：偶尔一次卡顿可以接受，但绝不能每次都卡 ——');
console.log('    如果扩容策略改成"每次 +1"，总搬移就变成 n²/2，均摊退化到 O(n)，性能直接崩。');
console.log('  · 同样的道理适用于：Map/Set 的扩容 rehash、String 拼接、');
console.log('    以及任何"容量翻倍 + 批量搬迁"的设计。');

// 对比：每次只加 1 的糟糕扩容策略（只算数学，不实际跑，避免慢）
const badCopies = (() => {
  let total = 0;
  for (let size = 1; size < PUSH_N; size++) total += size; // 每次只加 1 格，每次都要搬
  return total;
})();
console.log('');
console.log(`对比实验（纯数学计算，不实际执行）：`);
console.log(`  翻倍扩容策略：push ${PUSH_N} 次共搬移 ${sim.totalCopies} 次`);
console.log(`  每次 +1 策略：push ${PUSH_N} 次共搬移 ${badCopies} 次`);
console.log(`  慢了约 ${(badCopies / sim.totalCopies).toFixed(0)} 倍 —— 这就是扩容策略的重要性。`);

// ---------------------------------------------------------------------------
// 7. 常见误区总结
// ---------------------------------------------------------------------------

console.log('\n--- 7. 常见误区总结 ---');

const pitfalls = [
  ['把大 O 当绝对速度', 'O(1) 也有常数开销；n 很小时 O(n) 的数组扫描常常比 O(1) 的 Set.has 更快'],
  ['忽略常数因子', '1000n 在 n 很小时比 n² 慢，但在 n 很大时快几百倍；大 O 只描述长期趋势'],
  ['看不见的循环', 'includes / indexOf / filter / splice / 字符串 += 都是 O(n)，写在循环里就成 O(n²)'],
  ['只看平均忘了最坏', '哈希表最坏 O(n)，快排最坏 O(n²)；线上会遇到恶意构造的输入'],
  ['忽略递归栈空间', '递归版遍历是 O(h) 额外空间，深度过大还会栈溢出；迭代写法是 O(1)'],
  ['忘记均摊 vs 最坏', 'push 最坏 O(n)、均摊 O(1)；说"数组插入是 O(n)"也不完全准确，要看插在哪'],
  ['微基准结论外推', 'JIT、CPU 缓存、GC 都会影响实测；微基准的小循环放大了循环本身的开销'],
  ['过早优化', '先写对、再测量、最后才优化；可读性差而收益小于噪声的优化是负收益'],
];

console.log('误区'.padEnd(26) + '说明');
console.log('-'.repeat(100));
for (const [p, reason] of pitfalls) {
  console.log(p.padEnd(24) + reason);
}

console.log('');
console.log('一句话总结：');
console.log('  大 O 是【趋势的语言】，实测是【当下的证据】。');
console.log('  做选型时先用大 O 排除掉量级不对的方案，再用实测确认常数因子能否接受。');
console.log('  本目录后续每个文件都会给出对应数据结构/算法的复杂度表，可以反复回来对照。');

// 把 sink 打印出来，确保所有计算都不会被当成死代码消除
console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
