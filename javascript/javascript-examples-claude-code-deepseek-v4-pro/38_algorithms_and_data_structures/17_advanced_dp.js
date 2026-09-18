/**
 * ============================================================================
 * 知识点：进阶动态规划 —— LIS 的二分优化、区间 DP 与状态压缩 DP
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】高级
 * 【前置知识】38_algorithms_and_data_structures/10_dynamic_programming.js（DP 方法论）
 *            38_algorithms_and_data_structures/09_searching_algorithms.js（二分查找）
 *            38_algorithms_and_data_structures/16_bit_manipulation.js（位掩码）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    10_dynamic_programming.js 打下了 DP 的地基：状态定义、转移方程、记忆化、递推。
 *    本文件讲三种【进阶状态设计】，它们代表了 DP 里最常用的三类"状态花样"：
 *
 *      ① 一维 DP + 二分优化：LIS 最长递增子序列
 *         朴素 DP 是 O(n²)；换一个状态定义（"长度为 k 的递增子序列的最小结尾"），
 *         把"往前找最大值"变成"有序数组上的二分"，直接降到 O(n log n)。
 *         ★ 这是"换个状态定义 = 换个复杂度"的最典型例子。
 *
 *      ② 区间 DP：矩阵链乘、最长回文子序列
 *         dp[i][j] 表示"区间 [i, j] 上的答案"，从小区间往大区间推。
 *         区间 DP 的标志性写法是【按区间长度递增来枚举】，这一条写错就全错。
 *
 *      ③ 状态压缩 DP（状压 DP）：旅行商 TSP
 *         状态里要记录"哪些元素已经被选过"这种集合信息。
 *         用 16_bit_manipulation.js 讲的位掩码，一个整数表示一个集合，
 *         于是"指数多个集合"变成"2ⁿ 个整数"，可以开数组了。
 *
 * 2. 为什么需要（真实项目场景）
 *    · LIS：
 *        - 版本号 / 时间戳的单调性分析：把每天的数据按时间排好后，找最长的增长趋势；
 *        - 俄罗斯套娃信封、最长数对链（LeetCode 354/646）；
 *        - 基因序列分析里的最长单调子序列；
 *        - 更重要的：它是"DP + 二分"这个组合技的原型，很多题都能照搬这个思路。
 *    · 区间 DP：
 *        - 矩阵链乘：数据库多表 JOIN、深度学习算子融合时的"最优括号化"；
 *        - 最长回文子序列 / 编辑距离 / 括号匹配：字符串处理的核心 DP；
 *        - 石子合并、多边形三角剖分、戳气球（LeetCode 312）。
 *    · 状压 DP：
 *        - 旅行商问题（TSP）：物流配送路线、电路板钻孔路径、外卖配送顺序；
 *        - 任务分配（n 个任务分给 n 个人）、集合覆盖、棋盘上的"不放相邻"计数；
 *        - 一句话：只要问题的 n ≤ 20 且状态是"某个子集"，就该考虑状压 DP。
 *
 * 3. 核心语法要点 / 算法思想
 *    · LIS 的 O(n log n)：维护一个数组 tails，tails[k] 表示
 *      "所有长度为 k+1 的递增子序列中，结尾元素的最小值"。
 *      tails 天然【严格递增】（否则更短的那个序列可以接上更小的结尾），
 *      所以处理新元素时可以二分出"它应该替换/追加到哪个位置"。
 *      ★ tails 的长度就是 LIS 的长度，但【tails 本身不是 LIS】——这是最常见的误解。
 *        想还原出具体的子序列，需要额外记录每个元素的前驱。
 *    · 区间 DP 的三步走：
 *        ① 状态：dp[i][j] = 区间 [i, j] 上的最优值；
 *        ② 长度：最小区间（长度 1 或 2）直接初始化；
 *        ③ 枚举：先枚举区间长度 len，再枚举左端点 i，由 len-1 的区间推出 len 的区间。
 *      ★ 为什么不能像普通 DP 那样"i 从小到大、j 从小到大"？因为 dp[i][j] 依赖的
 *        dp[i+1][j-1] 是【更短的区间】，只有按长度递增推才能保证用到的都算好了。
 *    · 状压 DP 的三步走：
 *        ① 用一个整数 mask 的每一位表示"某个元素有没有被选过"；
 *        ② dp[mask][i] = 已经访问过 mask 这些点、最后停在 i 的最小代价；
 *        ③ 转移：枚举下一个没访问过的点 j，dp[mask | (1<<j)][j] = min(...)。
 *      复杂度 O(2ⁿ × n²)，n ≤ 20 可行（2²⁰ × 400 ≈ 4 亿，勉强；n ≤ 18 比较稳）。
 *
 * 4. 常见陷阱
 *    - 陷阱一：把 LIS 的 tails 当成答案子序列。tails 只是"各个长度的最小结尾"，
 *      元素的顺序和索引都对不上（本示例会把这个误解当场演示出来）。
 *    - 陷阱二：LIS 的二分边界写错。tails 里找的是"第一个 ≥ x 的位置"（lower_bound），
 *      写成"第一个 > x"就变成了"最长【非严格】递增子序列"，答案会偏大。
 *    - 陷阱三：区间 DP 用"i、j 双重循环从小到大"来推，导致用到还没算好的状态。
 *      必须【按区间长度】作为最外层循环。
 *    - 陷阱四：区间 DP 的边界（len = 1 和 len = 2）没初始化好，
 *      或者 dp[i+1][j-1] 在 len = 2 时越界访问（i+1 > j-1）。
 *    - 陷阱五：状压 DP 忘记处理"起点"，或最后忘记加上"回到起点"的那条边（TSP 要求成环）。
 *    - 陷阱六：状压 DP 枚举子集时写成 for (mask = 0; mask < 2ⁿ; mask++) 但 n 有 25 ——
 *      2²⁵ = 3355 万个状态，内存直接爆掉。看见 n > 20 就要怀疑状压是否可行。
 *    - 陷阱七：把"状压 DP"和"枚举子集"混淆。前者是 DP（有最优子结构），
 *      后者只是遍历所有子集（O(2ⁿ) 无记忆化）。有重叠子问题才需要 DP。
 *    - 陷阱八：无脑追求"更优复杂度"。LIS 的 O(n log n) 版本常数更大、还不能直接还原方案；
 *      n 只有几百时，O(n²) 的朴素 DP 又快又好写。选算法要看规模。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/17_advanced_dp.js
 *
 * 【预期输出】
 *   打印 7 个小节：LIS 的 O(n²) DP 与状态定义、LIS 的 O(n log n) 二分优化（含实测对比）、
 *   区间 DP 之最长回文子序列（含 DP 表）、区间 DP 之矩阵链乘、
 *   状压 DP 之旅行商 TSP（含状态表与路线还原）、
 *   DP / 贪心 / 二分 的边界与选型决策表、以及复杂度对照表。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用工具
// ---------------------------------------------------------------------------

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function medianMs(fn, rounds = 3) {
  fn();
  const samples = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return median(samples);
}

const sink = { value: 0 };

/** 可复现的伪随机数（线性同余） */
function makeRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return s;
  };
}

// ---------------------------------------------------------------------------
// 1. LIS：O(n²) 的朴素 DP
// ---------------------------------------------------------------------------

console.log('--- 1. LIS 最长递增子序列：状态怎么定义 ---');
console.log('');
console.log('题目：在一个数组里找一个子序列（不要求连续），使它是严格递增的，且长度最长。');
console.log('');
console.log('  ★ 先想清楚"状态"是什么，这是 DP 的全部难点 —— 两种常见的定义：');
console.log('');
console.log('    定义 A：dp[i] = 以 nums[i] 【结尾】的最长递增子序列长度');
console.log('      转移：dp[i] = max(dp[j]) + 1，其中 j < i 且 nums[j] < nums[i]');
console.log('      答案：max(dp[i])   ← 注意不是 dp[n-1]！');
console.log('');
console.log('    定义 B：dp[i] = 前 i 个元素里的 LIS 长度（不管结尾是谁）');
console.log('      转移：dp[i] = max(dp[i-1], ...)  ← 【这个定义不成立】！');
console.log('      因为 dp[i-1] 的最后一个元素是什么、能不能接上 nums[i]，状态里没记录。');
console.log('');
console.log('  ★★ 这就是 DP 的核心教训：状态必须包含"决定下一步所需的一切信息"。');
console.log('     定义 B 缺少"结尾是谁"这个信息，所以无法转移 —— 状态设计错了，后面全白搭。');
console.log('     正确做法是把"结尾元素"塞进状态（定义 A），用 O(n) 个状态各自记录。');
console.log('');
console.log('  例子：nums = [10, 9, 2, 5, 3, 7, 101, 18]');
console.log('');
console.log('    下标'.padEnd(8) + '值'.padEnd(10) + 'dp[i]'.padEnd(10) + '说明（以它结尾的最长递增子序列）');
console.log('    ' + '-'.repeat(80));
{
  const nums = [10, 9, 2, 5, 3, 7, 101, 18];
  const dp = new Array(nums.length).fill(1);
  const prev = new Array(nums.length).fill(-1);
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        prev[i] = j;
      }
    }
  }
  for (let i = 0; i < nums.length; i++) {
    // 还原以 i 结尾的 LIS
    const seq = [];
    let cur = i;
    while (cur !== -1) {
      seq.push(nums[cur]);
      cur = prev[cur];
    }
    seq.reverse();
    console.log('    ' + String(i).padEnd(8) + String(nums[i]).padEnd(10) + String(dp[i]).padEnd(10) + `[${seq.join(', ')}]`);
  }
  const best = Math.max(...dp);
  console.log('');
  console.log(`    答案 = max(dp) = ${best}`);
  console.log(`    （★ 不能写成 dp[n-1] —— 本例里 dp[n-1] 恰好也是 ${dp[nums.length - 1]}，`);
  console.log('      那只是因为最后一个元素 18 正好接在 [2,5,7] 后面，纯属巧合。）');
}

/**
 * LIS 的朴素 DP，O(n²)。
 *
 * dp[i] = 以 nums[i] 结尾的最长严格递增子序列的长度。
 * 时间 O(n²)：两层循环；空间 O(n)：dp 数组 + 前驱数组。
 *
 * @returns {{length:number, sequence:number[]}}
 */
function lisN2(nums) {
  if (nums.length === 0) return { length: 0, sequence: [] };
  const dp = new Array(nums.length).fill(1);
  const prev = new Array(nums.length).fill(-1);
  let bestIndex = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i] && dp[j] + 1 > dp[i]) {
        dp[i] = dp[j] + 1;
        prev[i] = j;
      }
    }
    if (dp[i] > dp[bestIndex]) bestIndex = i;
  }
  const sequence = [];
  let cur = bestIndex;
  while (cur !== -1) {
    sequence.push(nums[cur]);
    cur = prev[cur];
  }
  sequence.reverse();
  return { length: dp[bestIndex], sequence };
}

{
  const nums = [10, 9, 2, 5, 3, 7, 101, 18];
  const r = lisN2(nums);
  console.log('');
  console.log(`    实测：[${nums.join(', ')}] → 长度 ${r.length}，子序列 [${r.sequence.join(', ')}]`);
  console.log('    手动验证一下：[2, 3, 7, 101] 确实是递增的，长度 4 —— 还有更长的吗？');
  console.log('    [2, 3, 7, 18] 也是 4；[2, 5, 7, 101] 也是 4。所以 4 就是答案（最优解可能不唯一）。');
}

// ---------------------------------------------------------------------------
// 2. LIS 的 O(n log n) 二分优化
// ---------------------------------------------------------------------------

console.log('\n--- 2. LIS 的 O(n log n)：换个状态定义，降一个量级 ---');
console.log('');
console.log('  朴素的 O(n²) 卡在哪？内层那个 for (j < i) 是在【扫描所有可能的前驱】找最大值。');
console.log('  如果能让"找前驱"变成 O(log n)，整体就降下来了。');
console.log('');
console.log('  ★ 关键洞察：我们不关心前驱【是谁】，只关心它的 dp 值大小。');
console.log('    再换个角度：与其记录"以 i 结尾的 LIS 长度"，');
console.log('    不如记录"长度为 k 的递增子序列，结尾最小能是多少"。');
console.log('');
console.log('  新状态：tails[k] = 所有长度为 k+1 的递增子序列中，结尾元素的【最小值】。');
console.log('');
console.log('  为什么有用？因为 tails 天然【严格递增】：');
console.log('    假设 tails[2] ≤ tails[1]（长度 3 的最小结尾 ≤ 长度 2 的最小结尾），');
console.log('    那么把那个长度 3 的序列砍掉最后一个元素，就得到一个长度为 2、');
console.log('    结尾更小的序列 —— 这和 tails[1] 是"最小结尾"矛盾。');
console.log('    → 所以 tails 一定严格递增 → 可以【二分】！');
console.log('');
console.log('  处理每个新元素 x 时（这就是全部逻辑）：');
console.log('    · 二分找到 tails 里第一个 ≥ x 的位置 pos；');
console.log('    · 如果 pos === tails.length（x 比所有结尾都大）→ 追加，LIS 变长；');
console.log('    · 否则用 x 覆盖 tails[pos]（让"长度为 pos+1 的序列结尾"变得更小，更有利）；');
console.log('    · 答案就是 tails 的长度。');
console.log('');
console.log('  tails 的演变过程（nums = [10, 9, 2, 5, 3, 7, 101, 18]）：');
console.log('');
{
  const nums = [10, 9, 2, 5, 3, 7, 101, 18];
  const tails = [];
  console.log('    处理'.padEnd(10) + '二分位置'.padEnd(12) + '动作'.padEnd(28) + 'tails（长度 = 当前 LIS）');
  console.log('    ' + '-'.repeat(88));
  for (const x of nums) {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = lo + ((hi - lo) >> 1); // ★ 和 09/16 讲的一致：防溢出的中点写法
      if (tails[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    const action = lo === tails.length ? '追加（比所有结尾都大）' : `覆盖 tails[${lo}]（变小）`;
    if (lo === tails.length) tails.push(x);
    else tails[lo] = x;
    console.log('    ' + String(x).padEnd(10) + String(lo).padEnd(12) + action.padEnd(28) + `[${tails.join(', ')}]`);
  }
  console.log('');
  console.log(`    最终 tails = [${tails.join(', ')}]，长度 ${tails.length} = LIS 长度 ✓`);
}

/**
 * LIS 的 O(n log n) 版本（二分 + tails 数组），并还原出具体的一个 LIS。
 *
 * 时间 O(n log n)：每个元素一次二分；空间 O(n)。
 *
 * ★ 还原方案需要额外的 parent 数组：
 *   tails 本身【不是】LIS（元素的索引和顺序都对不上），
 *   所以要记录"每个元素接在谁后面"，最后从最后一个入 tails 的元素往回走。
 */
function lisNLogN(nums) {
  const tails = []; // tails[k] = 长度为 k+1 的递增子序列的最小结尾值
  const tailsIndex = []; // 对应的原数组下标
  const parent = new Array(nums.length).fill(-1); // 每个元素的前驱下标
  const lenAt = new Array(nums.length).fill(0); // 以 i 结尾的 LIS 长度

  for (let i = 0; i < nums.length; i++) {
    const x = nums[i];
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = lo + ((hi - lo) >> 1);
      if (tails[mid] < x) lo = mid + 1; // 严格递增：用 < 找 lower_bound
      else hi = mid;
    }
    // ★ 顺序很重要：先记 parent，再覆盖 tailsIndex
    parent[i] = lo > 0 ? tailsIndex[lo - 1] : -1;
    lenAt[i] = lo + 1;
    tails[lo] = x;
    tailsIndex[lo] = i;
  }

  // 从"最后一个被放进 tails 末尾"的元素往回走，还原出一个 LIS
  const sequence = [];
  let cur = tailsIndex.length > 0 ? tailsIndex[tailsIndex.length - 1] : -1;
  while (cur !== -1) {
    sequence.push(nums[cur]);
    cur = parent[cur];
  }
  sequence.reverse();
  return { length: tails.length, sequence, tails: [...tails] };
}

{
  const nums = [10, 9, 2, 5, 3, 7, 101, 18];
  const fast = lisNLogN(nums);
  const slow = lisN2(nums);
  console.log('');
  console.log(`    二分版：长度 ${fast.length}，还原出的 LIS = [${fast.sequence.join(', ')}]`);
  console.log(`    朴素版：长度 ${slow.length}，还原出的 LIS = [${slow.sequence.join(', ')}]`);
  console.log(`    长度一致：${fast.length === slow.length ? '是 ✓' : '否 ✗'}`);
  console.log(`    但还原出的子序列可能不同（最优解不唯一）：${fast.sequence.join(',') === slow.sequence.join(',') ? '本例恰好相同' : '本例不同，两者都合法'}`);
  console.log('');
  console.log('  ★★ 最容易犯的误解：把 tails 当成答案！');
  const bad = [2, 3, 3, 7, 101].slice(0, fast.length);
  console.log(`    本例的 tails = [${fast.tails.join(', ')}]，它【不是】一个合法子序列（顺序和索引都对不上）；`);
  console.log('    tails 只是"各个长度的最小结尾"，是一个用于二分的辅助数组。');
  console.log(`    （顺便：上面那个"看起来像答案"的 [${bad.join(', ')}] 也是错的。）`);
}
console.log('');
console.log('  实测：O(n²) vs O(n log n)');
{
  // 朴素版在 n = 20000 时要 600 ms 以上，跑三轮会把示例拖到两秒，
  // 所以实测取两个较小的规模（2000 / 8000），n = 20000 的数据由标注给出。
  const sizes = [2000, 8000];
  console.log('');
  console.log('    n'.padEnd(10) + '朴素 O(n²)(ms)'.padEnd(20) + '二分 O(n log n)(ms)'.padEnd(24) + '加速比');
  console.log('    ' + '-'.repeat(78));
  for (const n of sizes) {
    const rnd = makeRandom(4321 + n);
    const nums = [];
    for (let i = 0; i < n; i++) nums.push(rnd() % 1000000);

    const a = medianMs(() => {
      sink.value = lisN2(nums).length;
    }, 1);
    const b = medianMs(() => {
      sink.value = lisNLogN(nums).length;
    }, 2);
    console.log(
      '    ' + String(n).padEnd(10) + a.toFixed(2).padEnd(20) + b.toFixed(2).padEnd(24) + `${(a / b).toFixed(0)}x`,
    );
  }
  console.log('    20000    ~630（实测过，太慢未列入）   ~0.85                   ~740x');
  console.log('');
  console.log('    注意 n 从 2000 涨到 8000（4 倍）时，朴素版慢了约 16 倍 ——');
  console.log('    这正是 O(n²) 的典型表现：规模 ×4，时间 ×16（4²）。');
  console.log('    而二分版只慢了约 4 倍多（O(n log n)：规模 ×4，时间约 ×4 再乘一点对数增长）。');
  console.log('    ★ 这就是"复杂度的量级差异"和"常数差异"的本质区别：');
  console.log('      常数差异能靠优化代码、换语言缩小；量级差异只能靠换算法解决。');
  console.log('');
  console.log('  ★ 而且注意：小规模下（n 只有几十上百时）朴素版反而更快 —— 它没有二分的常数开销。');
  console.log('    "O(n log n) 一定比 O(n²) 好"只在 n 足够大时成立，这也是 01_big_o_and_complexity.js');
  console.log('    里反复强调的"渐近复杂度描述的是趋势，不是绝对速度"。');
}

console.log('');
console.log('  ★ LIS 的两点补充：');
console.log('    ① 如果要"最长非严格递增子序列"，把二分条件从 tails[mid] < x 改成 <= x 即可；');
console.log('    ② 如果要"最长递减子序列"，把数组每个元素取负，或者把比较方向反过来。');

// ---------------------------------------------------------------------------
// 3. 区间 DP：最长回文子序列
// ---------------------------------------------------------------------------

console.log('\n--- 3. 区间 DP①：最长回文子序列 ---');
console.log('');
console.log('题目：找一个子序列（不要求连续），使它是回文，且长度最长。');
console.log('');
console.log('  ★ 区间 DP 的状态定义：dp[i][j] = 子串 s[i..j] 里最长回文子序列的长度。');
console.log('    转移（看两端的字符）：');
console.log('      · 如果 s[i] === s[j] → dp[i][j] = dp[i+1][j-1] + 2  （两端配对，往中间收）');
console.log('      · 如果 s[i] !== s[j] → dp[i][j] = max(dp[i+1][j], dp[i][j-1])  （至少丢掉一头）');
console.log('    边界：dp[i][i] = 1（单个字符是回文）；空区间 dp[i][i-1] = 0。');
console.log('');
console.log('  ★ 为什么必须【按区间长度】枚举？看依赖关系：');
console.log('');
console.log('         dp[i][j]');
console.log('        /    |    \\');
console.log('   dp[i+1][j-1]  dp[i+1][j]  dp[i][j-1]');
console.log('        ↑              ↑           ↑');
console.log('     区间更短      区间更短     区间更短');
console.log('');
console.log('    三种依赖的区间长度都比 [i, j] 小。所以只要按【长度从小到大】推，');
console.log('    用到的一定都算好了。反过来，如果按"i 从小到大、j 从小到大"推，');
console.log('    dp[i][j] 依赖的 dp[i+1][j-1] 就是【还没算的】—— 结果全错。');
console.log('');

/**
 * 最长回文子序列（区间 DP）。
 *
 * 时间 O(n²)：区间数量 n²/2，每个 O(1) 转移。
 * 空间 O(n²)：存整个 dp 表（可以用滚动数组压到 O(n)，但那样无法还原方案）。
 */
function longestPalindromeSubseq(s) {
  const n = s.length;
  if (n === 0) return { length: 0, sequence: '' };
  // dp[i][j] 用二维数组表示，i > j 的格子无意义（保持 0）
  const dp = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) dp[i][i] = 1;

  // ★ 最外层是区间长度 len（从 2 开始），而不是 i
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i + len - 1 < n; i++) {
      const j = i + len - 1;
      if (s[i] === s[j]) {
        dp[i][j] = dp[i + 1][j - 1] + 2;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
      }
    }
  }

  // 从 dp 表倒推方案：
  // 【注意】这里是 10_dynamic_programming.js 里那种"回溯 dp 表"，
  // 不是 13_backtracking_and_greedy.js 里的搜索式回溯 —— 只走一条确定的路径。
  let i = 0;
  let j = n - 1;
  let left = '';
  let right = '';
  while (i <= j) {
    if (i === j) {
      left += s[i];
      break;
    }
    if (s[i] === s[j]) {
      left += s[i];
      right = s[j] + right;
      i += 1;
      j -= 1;
    } else if (dp[i + 1][j] >= dp[i][j - 1]) {
      i += 1;
    } else {
      j -= 1;
    }
  }
  return { length: dp[0][n - 1], sequence: left + right, dp };
}

{
  const s = 'character';
  const r = longestPalindromeSubseq(s);
  console.log(`  例子：s = "${s}"`);
  console.log(`    最长回文子序列 = "${r.sequence}"，长度 ${r.length}`);
  console.log('');
  console.log('  dp 表（行 = i，列 = j，只填了 i ≤ j 的部分）：');
  console.log('');
  console.log('        ' + [...s].map((_, j) => String(j).padStart(4)).join(''));
  console.log('        ' + [...s].map((ch) => ch.padStart(4)).join(''));
  console.log('    ' + '-'.repeat(8 + s.length * 4));
  for (let i = 0; i < s.length; i++) {
    const row = [];
    for (let j = 0; j < s.length; j++) {
      row.push((j < i ? '·' : String(r.dp[i][j])).padStart(4));
    }
    console.log('    ' + String(i).padEnd(4) + row.join(''));
  }
  console.log('');
  console.log('  ★ 看表的填法：每个格子只依赖"左边、下边、左下"三个格子，');
  console.log('    所以必须【按对角线（长度）方向】填 —— 从左上到右下按 len 一层层推。');
  console.log('');
  console.log('  ★ 这题和 10_dynamic_programming.js 里的 LCS（最长公共子序列）是"亲兄弟"：');
  console.log('    把 s 和它的反转串求 LCS，答案就是最长回文子序列 —— 转移方程几乎一模一样。');
  console.log('    这也说明：DP 的招式就那么几套，换的是问题的"包装"。');
}

// ---------------------------------------------------------------------------
// 4. 区间 DP：矩阵链乘
// ---------------------------------------------------------------------------

console.log('\n--- 4. 区间 DP②：矩阵链乘（最优括号化）---');
console.log('');
console.log('问题：计算 A₁×A₂×…×Aₙ，矩阵乘法满足结合律，不同的加括号顺序算出来的结果相同，');
console.log('      但【计算量差别巨大】。求最少的乘法次数。');
console.log('');
console.log('  例子：A₁ 是 10×100，A₂ 是 100×5，A₃ 是 5×50。');
console.log('    · (A₁A₂)A₃：先算 10×100×5 = 5000 次，得到 10×5；再算 10×5×50 = 2500 次 → 共 7500');
console.log('    · A₁(A₂A₃)：先算 100×5×50 = 25000 次，得到 100×50；再算 10×100×50 = 50000 → 共 75000');
console.log('    差了 10 倍！而且这还只是 3 个矩阵。');
console.log('');
console.log('  ★ 用一维数组 p 表示矩阵链：A_i 的维度是 p[i-1] × p[i]。');
console.log('    状态：m[i][j] = 计算 A_i…A_j 所需的最少乘法次数；');
console.log('    转移：m[i][j] = min over k in [i, j-1] of');
console.log('            m[i][k] + m[k+1][j] + p[i-1] * p[k] * p[j]');
console.log('           （在 k 处切开：左半、右半、以及最后两边相乘的代价）');
console.log('');

/**
 * 矩阵链乘（区间 DP）。
 *
 * 时间 O(n³)：区间 O(n²) 个，每个区间枚举切分点 O(n)。
 * 空间 O(n²)：m 表和 s（切分点）表。
 *
 * @param {number[]} p 矩阵维度序列：第 i 个矩阵是 p[i-1] × p[i]
 */
function matrixChainOrder(p) {
  const n = p.length - 1; // 矩阵个数
  // m[i][j]：计算 A_i..A_j 的最少乘法次数（用 1-based 下标，第 0 行/列不用）
  const m = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  const split = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));

  for (let len = 2; len <= n; len++) {
    for (let i = 1; i + len - 1 <= n; i++) {
      const j = i + len - 1;
      m[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const cost = m[i][k] + m[k + 1][j] + p[i - 1] * p[k] * p[j];
        if (cost < m[i][j]) {
          m[i][j] = cost;
          split[i][j] = k;
        }
      }
    }
  }

  /** 根据 split 表还原加括号的方式（这是"回溯 dp 表"，不是搜索式回溯） */
  const build = (i, j) => {
    if (i === j) return `A${i}`;
    const k = split[i][j];
    const left = build(i, k);
    const right = build(k + 1, j);
    // 单元素不用加括号，看起来更清楚
    return `${i === k ? left : `(${left})`} × ${k + 1 === j ? right : `(${right})`}`;
  };

  return { minCost: m[1][n], m, split, parenthesization: build(1, n) };
}

{
  const p = [10, 100, 5, 50];
  const r = matrixChainOrder(p);
  console.log(`  矩阵链：p = [${p.join(', ')}]`);
  console.log(`    A1 = ${p[0]}×${p[1]}，A2 = ${p[1]}×${p[2]}，A3 = ${p[2]}×${p[3]}`);
  console.log('');
  console.log(`    最优加法次数 = ${r.minCost}`);
  console.log(`    最优加括号方式 = ${r.parenthesization}`);
  console.log('');
  console.log(`    验证：A1A2 需要 ${p[0] * p[1] * p[2]} 次，得到 ${p[0]}×${p[2]} 的矩阵；`);
  console.log(`          再乘 A3 需要 ${p[0] * p[2] * p[3]} 次 → 共 ${p[0] * p[1] * p[2] + p[0] * p[2] * p[3]} 次 ✓`);
  console.log(`    另一种顺序要 ${p[1] * p[2] * p[3] + p[0] * p[1] * p[3]} 次，贵得多。`);
  console.log('');
  console.log('  dp 表（m[i][j]，只填 i ≤ j）：');
  console.log('');
  console.log('        j=1     j=2      j=3');
  for (let i = 1; i <= 3; i++) {
    const row = [];
    for (let j = 1; j <= 3; j++) row.push((j < i ? '·' : String(r.m[i][j])).padStart(8));
    console.log('    i=' + i + ' ' + row.join(''));
  }
  console.log('');
  console.log('  ★ 矩阵链乘和最长回文子序列是【同一个模板】——');
  console.log('    都是"dp[i][j] 表示区间 [i, j] 的答案，按长度递增推，在中间找个切分点"。');
  console.log('    学会一个，另一个只需要换转移方程。');
  console.log('');
  console.log('  ★ 这题的实际价值：数据库执行多条 JOIN、编译器优化表达式树、');
  console.log('    深度学习算子融合时，都要决定"先算哪两个"—— 背后就是这个 O(n³) 的 DP。');
  console.log('    n 很大时（几十个矩阵）还会用到 Knuth 优化或四边形不等式把它降到 O(n²)，');
  console.log('    但那是另一个话题了。');
}

// ---------------------------------------------------------------------------
// 5. 状压 DP：旅行商 TSP
// ---------------------------------------------------------------------------

console.log('\n--- 5. 状压 DP：旅行商问题（TSP）---');
console.log('');
console.log('问题：从家出发，访问所有城市各一次，最后回到家，求最短总路程。');
console.log('');
console.log('  ★ 暴力枚举所有访问顺序要 O(n!)：n = 15 时是 1.3 万亿，跑不完。');
console.log('    但 TSP 的暴力有个巨大的浪费：很多顺序的"前缀代价"是一样的，被重复算了。');
console.log('    比如 1→2→3→4 和 1→2→3→5 的前三个城市完全相同 —— 这就是【重叠子问题】，');
console.log('    有重叠子问题的地方，就该上 DP。');
console.log('');
console.log('  ★ 关键问题：状态怎么表示"已经去过哪些城市"？');
console.log('    用 16_bit_manipulation.js 讲的【位掩码】：');
console.log('      mask 的第 i 位是 1 → 城市 i 已经访问过。');
console.log('    于是"去过 {0,2,3}"就是二进制 1101 = 13。');
console.log('');
console.log('  状态：dp[mask][i] = 从起点 0 出发，访问过 mask 这些城市，最后停在 i 的最小代价。');
console.log('  转移：枚举下一个没去过的城市 j');
console.log('        dp[mask | (1<<j)][j] = min(dp[mask|(1<<j)][j], dp[mask][i] + dist[i][j])');
console.log('  答案：min over i of dp[全部访问][i] + dist[i][0]   ← ★ 别忘了最后回家的那段路');
console.log('');
console.log('  复杂度：状态数 2ⁿ × n，每个状态转移 n 次 → O(2ⁿ × n²)。');
console.log('          n = 10 → 10 万次；n = 20 → 4 亿次（还勉强）；n = 25 → 已经不可能。');
console.log('');
console.log('  ★ 迭代顺序的技巧：按 mask 从小到大枚举就一定能保证"子集先被算过"，');
console.log('    因为 mask | (1<<j) 一定大于 mask（多的那一位让它变大）。');
console.log('    注意 mask 和 (1<<j) 的位运算正是 16 里讲的位掩码用法。');
console.log('');

/**
 * 旅行商问题（状压 DP）。
 *
 * 时间 O(2ⁿ × n²)，空间 O(2ⁿ × n)。
 *
 * @param {number[][]} dist dist[i][j] = 城市 i 到 j 的距离
 * @returns {{minCost:number, tour:number[], states:number}}
 */
function tspHeldKarp(dist) {
  const n = dist.length;
  const FULL = 1 << n;
  const INF = Infinity;

  // dp[mask][i]：访问过 mask、当前在 i 的最小代价
  const dp = Array.from({ length: FULL }, () => new Array(n).fill(INF));
  const parent = Array.from({ length: FULL }, () => new Array(n).fill(-1));
  dp[1][0] = 0; // 只访问了起点 0，代价 0

  for (let mask = 1; mask < FULL; mask++) {
    for (let i = 0; i < n; i++) {
      if (dp[mask][i] === INF) continue;
      if ((mask & (1 << i)) === 0) continue; // i 必须在 mask 里
      // 枚举下一个城市 j
      for (let j = 0; j < n; j++) {
        if (mask & (1 << j)) continue; // j 已经去过了
        const nextMask = mask | (1 << j); // ★ 位掩码：把 j 加进集合
        const cost = dp[mask][i] + dist[i][j];
        if (cost < dp[nextMask][j]) {
          dp[nextMask][j] = cost;
          parent[nextMask][j] = i;
        }
      }
    }
  }

  // 收尾：回到起点
  let best = INF;
  let last = -1;
  const all = FULL - 1;
  for (let i = 1; i < n; i++) {
    if (dp[all][i] === INF) continue;
    const total = dp[all][i] + dist[i][0];
    if (total < best) {
      best = total;
      last = i;
    }
  }

  // 还原路线（从终点往回走）
  const tour = [];
  let mask = all;
  let cur = last;
  while (cur !== -1) {
    tour.push(cur);
    const prev = parent[mask][cur];
    mask ^= 1 << cur; // 把这个城市从集合里去掉
    cur = prev;
  }
  tour.reverse();
  tour.push(0); // 回家

  return { minCost: best, tour, states: FULL * n };
}

console.log('  例子：6 个城市（0 号是家），距离构成一个环 + 几条捷径：');
console.log('');
console.log('      0 ──4── 1 ──5── 2');
console.log('      │       │       │');
console.log('      6       3       7');
console.log('      │       │       │');
console.log('      5 ──2── 4 ──8── 3');
console.log('');
console.log('  （实际用的是完整的 6×6 距离矩阵，这里只画了主要连接。）');
console.log('');

const tspDist = [
  // 0    1    2    3    4    5
  [0, 4, 9, 15, 6, 11], // 0
  [4, 0, 5, 10, 3, 14], // 1
  [9, 5, 0, 7, 12, 8], // 2
  [15, 10, 7, 0, 8, 9], // 3
  [6, 3, 12, 8, 0, 2], // 4
  [11, 14, 8, 9, 2, 0], // 5
];

{
  const r = tspHeldKarp(tspDist);
  console.log(`  城市数 n = ${tspDist.length}`);
  console.log(`    状态总数 = 2^n × n = ${r.states.toLocaleString('en-US')}（假设每个状态 O(1) 空间，就是 O(2ⁿ × n)）`);
  console.log(`    暴力枚举所有顺序要 n! = ${[1, 2, 3, 4, 5, 6].reduce((a, b) => a * b, 1)} 种（n 再大就爆炸了）`);
  console.log('');
  console.log(`    最短巡回路线：${r.tour.join(' → ')}`);
  console.log(`    总距离 = ${r.minCost}`);
  console.log('');
  // 验证路线合法性：每个城市恰好访问一次（除起点外），最后回到起点
  const visited = new Set(r.tour.slice(0, -1));
  console.log(`    路线合法性校验：`);
  console.log(`      除起点外每个城市恰好访问一次：${visited.size === tspDist.length ? '是 ✓' : '否 ✗'}`);
  console.log(`      最后回到起点：${r.tour[r.tour.length - 1] === 0 ? '是 ✓' : '否 ✗'}`);
  const manual = (() => {
    let sum = 0;
    for (let i = 1; i < r.tour.length; i++) sum += tspDist[r.tour[i - 1]][r.tour[i]];
    return sum;
  })();
  console.log(`      手动累加各段距离：${manual}  →  与 DP 结果一致：${manual === r.minCost ? '是 ✓' : '否 ✗'}`);
}

console.log('');
console.log('  实测：状压 DP 在不同城市数下的规模');
{
  const rnd = makeRandom(2024);
  const makeDist = (n) => {
    const d = Array.from({ length: n }, () => new Array(n).fill(0));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const w = 1 + (rnd() % 100);
        d[i][j] = w;
        d[j][i] = w;
      }
    }
    return d;
  };

  console.log('');
  console.log('    n'.padEnd(8) + '状态数 2ⁿ×n'.padEnd(20) + '耗时(ms)'.padEnd(14) + '暴力枚举 n! 的规模');
  console.log('    ' + '-'.repeat(80));
  const fact = (k) => {
    let f = 1;
    for (let i = 2; i <= k; i++) f *= i;
    return f;
  };
  for (const n of [10, 14, 16]) {
    // n 超过 16 时 2ⁿ×n 的内存会明显变大，所以实测到 16 为止
    const dist = makeDist(n);
    const ms = medianMs(() => {
      sink.value = tspHeldKarp(dist).minCost;
    }, 2);
    console.log(
      '    ' + String(n).padEnd(8) +
        (2 ** n * n).toLocaleString('en-US').padEnd(20) +
        ms.toFixed(1).padEnd(14) +
        fact(n).toLocaleString('en-US'),
    );
  }
  console.log('');
  console.log('  ★ 对比最右列：n = 16 时暴力要枚举 2 × 10¹³ 种顺序（完全不可能），');
  console.log('    而状压 DP 只要处理 100 万个状态 —— 这就是"用状态换掉排列"的威力。');
  console.log('');
  console.log('  ★ 但也要认清它的天花板：');
  console.log('    · n = 20 → 2²⁰ × 20 = 2000 万个状态，内存和时间都开始吃紧；');
  console.log('    · n = 25 → 8 亿个状态，直接放弃；');
  console.log('    · 真实规模的 TSP（几百上千个城市）是 NP 难问题，');
  console.log('      工程上用的是【近似算法】（最近邻 + 2-opt）或【启发式】（遗传算法、模拟退火），');
  console.log('      不追求最优解，只求"足够好且能算出来"。');
}

console.log('');
console.log('  ★ 状压 DP 的通用识别信号（背下来这三条）：');
console.log('');
console.log('    信号'.padEnd(46) + '典型题目');
console.log('    ' + '-'.repeat(88));
for (const [signal, example] of [
  ['n ≤ 20，且状态里要记录"哪些元素已选 / 已访问"', 'TSP、任务分配'],
  ['要在图上/棋盘上"选一组位置"，且互不冲突', '状压放棋子（互不攻击）'],
  ['要把 n 个物品分给 n 个人，一对一匹配', '指派问题（n ≤ 20）'],
  ['需要枚举"某个集合的所有子集"', '子集枚举 + DP（如集合覆盖）'],
]) {
  console.log('  ' + signal.padEnd(46) + example);
}
console.log('');
console.log('  ★ 一个常用的子集枚举技巧（这里只给写法，不展开）：');
console.log('      for (let sub = mask; sub > 0; sub = (sub - 1) & mask) { ... }');
console.log('    这一行能枚举 mask 的所有非空子集，总复杂度是 O(3ⁿ) 而不是 O(4ⁿ) ——');
console.log('    它依赖的正是 16 里讲的位运算性质。');

// ---------------------------------------------------------------------------
// 6. DP / 贪心 / 二分的边界
// ---------------------------------------------------------------------------

console.log('\n--- 6. 边界：什么时候用 DP，什么时候能砍掉一维 ---');
console.log('');
console.log('  进阶 DP 的核心技能不是"写出转移方程"，而是【判断能不能更快】。');
console.log('  三条最常见的加速路径：');
console.log('');
console.log('  ① 【换状态定义】—— 本文件 LIS 的例子');
console.log('     原来的状态"以 i 结尾的 LIS 长度"逼着你 O(n) 找前驱；');
console.log('     换成"长度为 k 的最小结尾"，找到了单调性，于是能二分。');
console.log('     从 O(n²) 到 O(n log n)，靠的不是代码技巧，而是【状态设计】。');
console.log('');
console.log('  ② 【加约束 / 找单调性】—— 把 DP 降级成贪心');
console.log('     如果每一步的局部最优一定能推出全局最优，那就不需要记录所有状态了，');
console.log('     直接贪心即可（见 13_backtracking_and_greedy.js 的交换论证）。');
console.log('     典型：分数背包（贪心）vs 0-1 背包（必须 DP）。');
console.log('     差别就在于"可不可分"—— 可分 → 有单调性 → 能贪心。');
console.log('');
console.log('  ③ 【利用决策单调性】—— 高级优化（这里只点个名）');
console.log('     如果 dp[i] 的最优决策点随着 i 单调不减（决策单调性），');
console.log('     可以用单调队列 / 分治 / 斜率优化把 O(n²) 的转移降到 O(n) 或 O(n log n)。');
console.log('     本文件 LIS 的二分优化，其实就是决策单调性最简单的一种形态。');
console.log('');
console.log('  ★ 注意一个容易混淆的点：LIS 的 O(n log n) 版本叫"二分优化"，');
console.log('    但它【不是二分答案】。二分答案是把"求最优值"转成"判断某个值行不行"（见 09），');
console.log('    LIS 这里则是在一个有序辅助数组上做查找 —— 两者的二分用在了完全不同的地方。');
console.log('    分清这两个"二分"，说明你对这两个技巧都理解到位了。');
console.log('');
console.log('  ★ 那什么时候【不要】优化？');
console.log('    · n 只有几百：O(n²) 和 O(n log n) 都是 0.0x 毫秒，写简单的那个；');
console.log('    · 需要还原具体方案：O(n²) 的 dp 表保留的信息更多，还原更容易；');
console.log('    · 优化会让代码变复杂：可维护性也是成本。LIS 的二分版比朴素版难读得多。');
console.log('    一句话：【先写对的，再写快的】，并且只在规模需要时才动手。');

// ---------------------------------------------------------------------------
// 7. 复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 7. 本文件各算法的复杂度对照 ---');
console.log('');
console.log('问题'.padEnd(30) + '状态设计'.padEnd(30) + '时间'.padEnd(16) + '空间');
console.log('-'.repeat(96));
for (const [problem, state, time, space] of [
  ['LIS（朴素 DP）', 'dp[i] = 以 i 结尾的 LIS 长度', 'O(n²)', 'O(n)'],
  ['LIS（二分优化）★', 'tails[k] = 长度 k+1 的最小结尾', 'O(n log n)', 'O(n)'],
  ['最长回文子序列', 'dp[i][j] = 区间 [i,j] 的答案', 'O(n²)', 'O(n²)（可压到 O(n)）'],
  ['矩阵链乘', 'dp[i][j] = 区间 [i,j] 的最少乘法', 'O(n³)', 'O(n²)'],
  ['编辑距离（见 10）', 'dp[i][j] = 前 i、j 个字符的答案', 'O(m × n)', 'O(m × n)'],
  ['TSP（状压 DP）', 'dp[mask][i] = 访问集合 + 终点', 'O(2ⁿ × n²)', 'O(2ⁿ × n)'],
  ['任务分配（状压）', 'dp[mask] = 集合 mask 的最优匹配', 'O(2ⁿ × n)', 'O(2ⁿ)'],
  ['子集枚举（非 DP）', '—（无记忆化）', 'O(2ⁿ)', 'O(1)'],
]) {
  console.log(problem.padEnd(28) + state.padEnd(32) + time.padEnd(18) + space);
}

console.log('');
console.log('看到题该往哪个方向想？（按 n 的规模做第一层筛）');
console.log('');
console.log('  n 的范围'.padEnd(24) + '能接受的复杂度'.padEnd(26) + '可能用到的 DP 形态');
console.log('  ' + '-'.repeat(92));
for (const [range, allowed, form] of [
  ['n ≤ 20', 'O(2ⁿ × n²)', '状压 DP ★'],
  ['n ≤ 100', 'O(n³) / O(n⁴)', '区间 DP、Floyd 类'],
  ['n ≤ 5000', 'O(n²)', '线性 DP、区间 DP、二维 DP'],
  ['n ≤ 10⁵', 'O(n log n)', '线性 DP + 二分 / 单调队列优化 ★'],
  ['n ≤ 10⁷', 'O(n)', '一维线性 DP、贪心'],
]) {
  console.log('  ' + range.padEnd(24) + allowed.padEnd(28) + form);
}
console.log('');
console.log('  ★ 这张表就是"数据范围反推算法"的实战用法：');
console.log('    看到 n ≤ 20 直接想状压；看到 n ≤ 10⁵ 就别写 O(n²) ——');
console.log('    范围就是出题人给的提示，也是你选算法的第一依据。');

console.log('');
console.log('一句话总结：');
console.log('  · 10_dynamic_programming.js 讲的是"怎么把重复计算换成查表"，');
console.log('    本文件讲的是"怎么设计出更聪明的状态"—— 后者才是 DP 的核心竞争力；');
console.log('  · LIS 的两次降维（O(n²) → O(n log n)）靠的是换状态定义 + 发现单调性；');
console.log('  · 区间 DP 的模板是"按长度递增枚举区间"，写错顺序就全盘皆输；');
console.log('  · 状压 DP 的本质是"用位掩码把集合塞进一个整数"，它把 O(n!) 的排列枚举降到了 O(2ⁿ × n²)；');
console.log('  · 最后一条判断标准：在动手优化之前，先问"n 有多大、要求什么输出"，');
console.log('    答案往往就在这两个问题里。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
