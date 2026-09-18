/**
 * ============================================================================
 * 知识点：动态规划入门 —— 从递归到记忆化到递推，以及经典问题
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】高级
 * 【前置知识】38_algorithms_and_data_structures/06_heap_and_priority_queue.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    动态规划（Dynamic Programming，DP）解决的是这样一类问题：
 *    一个大问题可以拆成一堆【重叠的子问题】，而大问题的最优解可以由子问题的最优解拼出来。
 *
 *    它的核心动作只有两个：
 *      · 把子问题的答案【记下来】（避免重复计算）；
 *      · 用子问题的答案【推出】大问题的答案（状态转移）。
 *
 *    DP 的演进路径（本示例用斐波那契完整演示）：
 *
 *      朴素递归          记忆化搜索            递推（自底向上）
 *      ┌────────┐       ┌────────┐          ┌────────┐
 *      │ f(5)   │       │ f(5)   │          │ f(1)   │
 *      │ f(4)   │       │ f(4)   │          │ f(2)   │
 *      │ f(3)   │       │ f(3)   │          │ f(3)   │
 *      └────────┘       └────────┘          └────────┘
 *      指数级爆炸       每个只算一次          每个只算一次
 *      O(2ⁿ)            O(n) 时间/O(n)空间    O(n) 时间/O(1)空间
 *
 *    三个名词的关系（很多人被它们绕晕）：
 *      · 动态规划 = 一类思想（用"记录子问题答案"来避免重复计算）；
 *      · 记忆化搜索（自顶向下）= 递归 + 缓存，写法最贴近暴力递归；
 *      · 递推（自底向上）= 用循环按顺序填表，通常更快、更省空间。
 *      后两者都是实现 DP 的具体手段，不是另外两种算法。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 文本比较：git diff 怎么找出两个文件的差异？答案是 LCS（最长公共子序列）；
 *    - 输入纠错：编辑器/搜索引擎的拼写纠错用编辑距离，本质也是 DP；
 *    - 资源分配：预算有限时怎么选商品让总价值最大（0-1 背包）；
 *    - 找零 / 凑单：用最少的硬币数凑出金额，电商满减凑单就是这个问题；
 *    - 撤销 / 版本回退的最少操作次数、DNA 序列比对、路径规划、股票买卖的最优时机……
 *    - 面试里 DP 是出现频率最高的题型，也是最能区分"背过题"和"真会想"的题型。
 *
 * 3. 核心语法要点 / 算法思想
 *    DP 能用的【两个前提】（缺一不可）：
 *
 *      ① 最优子结构：大问题的最优解，一定由某个子问题的最优解推出。
 *         例：到第 10 级台阶的最短路径 = min(到第 9 级, 到第 8 级) + 1 步。
 *
 *      ② 重叠子问题：不同的分支会反复遇到同一个子问题。
 *         例：算 f(5) 时要算 f(4) 和 f(3)，而 f(4) 里面又要算 f(3) —— f(3) 被算了两次。
 *         如果没有重叠（比如归并排序的每个子数组都不同），那就用分治，不需要 DP。
 *
 *    解题四步法（照这个顺序想，能解决大多数 DP 题）：
 *      第 1 步：确定【状态】—— 用一个（或几个）变量描述"子问题是什么"。
 *      第 2 步：确定【转移方程】—— 大状态怎么由小状态算出来。
 *      第 3 步：确定【初始条件】和【边界】—— 最小的子问题答案是什么。
 *      第 4 步：确定【遍历顺序】—— 保证算大状态时，它依赖的小状态已经算好了。
 *
 * 4. 常见陷阱
 *    - 陷阱一：以为"用了递归就是 DP"。没有缓存、没有重叠子问题，那就只是分治。
 *    - 陷阱二：状态定义不清就开始写转移方程。DP 卡住 90% 是因为状态没定义对。
 *      好状态的标准是：它能唯一确定一个子问题，且能从小状态推到大状态。
 *    - 陷阱三：遍历顺序反了。二维 DP 里，如果 dp[i][j] 依赖 dp[i-1][j]（上一行）
 *      和 dp[i][j-1]（左边），那就必须【从上到下、从左到右】遍历。
 *    - 陷阱四：0-1 背包用一维数组优化时，容量必须【从大到小】遍历。
 *      从小到大遍历会让同一件物品被放进多次，那就变成了"完全背包"。
 *    - 陷阱五：忘记初始化。dp 数组默认是 0，但求"最小值"时应该初始化为 Infinity，
 *      否则 0 会冒充一个合法答案。
 *    - 陷阱六：记忆化时用数组下标当 key，但状态是负数或很大。
 *      这时要用 Map 而不是数组，或者给状态做偏移。
 *    - 陷阱七：递归太深爆栈。状态数上百万时，递归的记忆化可能爆栈，
 *      要改写成自底向上的循环。
 *    - 陷阱八：以为 DP 一定比暴力快。状态数 × 每个状态的转移代价才是 DP 的复杂度；
 *      如果状态设计得不好（比如状态数本身是 O(n²) 而每个状态又是 O(n) 的转移），
 *      那总复杂度可能是 O(n³)，未必划算。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/10_dynamic_programming.js
 *
 * 【预期输出】
 *   打印 8 个小节：斐波那契的朴素递归（含调用次数实测）、记忆化、递推三种写法对比、
 *   两个前提的说明、爬楼梯、0-1 背包（打印 dp 表）、最长公共子序列（打印 dp 表）、
 *   零钱兑换、以及"状态定义与转移方程怎么想"的方法论和复杂度对照表。
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

/**
 * 打印一张二维 DP 表。
 * 这是理解 DP 最有效的工具 —— 把表画出来，转移方程就一目了然了。
 */
function printTable(dp, rowLabels, colLabels, rowHeader = 'i\\j') {
  const width = 6;
  const pad = (v) => {
    const s = v === Infinity ? '∞' : v === -Infinity ? '-∞' : String(v);
    return s.padStart(width);
  };
  console.log('  ' + rowHeader.padEnd(8) + colLabels.map((c) => String(c).padStart(width)).join(''));
  console.log('  ' + '-'.repeat(8 + width * colLabels.length));
  for (let i = 0; i < dp.length; i++) {
    console.log('  ' + String(rowLabels[i]).padEnd(8) + dp[i].map(pad).join(''));
  }
}

// ---------------------------------------------------------------------------
// 1. 斐波那契：朴素递归的指数爆炸
// ---------------------------------------------------------------------------

console.log('--- 1. 起点：朴素递归的指数爆炸 ---');
console.log('');
console.log('  斐波那契数列：f(0)=0, f(1)=1, f(n)=f(n-1)+f(n-2)');
console.log('  它的定义本身就是递推式，所以是讲 DP 最经典的例子。');
console.log('');
console.log('  直接照抄定义写出来的递归：');
console.log('    function fib(n) {');
console.log('      if (n <= 1) return n;');
console.log('      return fib(n - 1) + fib(n - 2);   // ← 这里算了两次！');
console.log('    }');
console.log('');
console.log('  问题就在最后一行。看看算 f(5) 时到底发生了什么：');
console.log('');
console.log('                        f(5)');
console.log('                      /      \\');
console.log('                   f(4)      f(3)        ← f(3) 第一次出现');
console.log('                  /    \\     /   \\');
console.log('               f(3)   f(2) f(2)  f(1)    ← f(3) 又算了一遍！f(2) 也重复了');
console.log('              /   \\   /  \\  /  \\');
console.log('           f(2) f(1) f(1) f(0) f(1) f(0)');
console.log('           /  \\');
console.log('        f(1) f(0)');
console.log('');
console.log('  同一棵子树被反复计算，而且越往下重复越夸张 ——');
console.log('  f(3) 算了 2 次、f(2) 算了 3 次、f(1) 算了 5 次……');
console.log('  这就是"重叠子问题"：它不是坏事，但【不记录】就是灾难。');

/** 朴素递归版斐波那契，顺便统计调用次数 */
let naiveCallCount = 0;
function fibNaive(n) {
  naiveCallCount += 1;
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

console.log('');
console.log('  实测：不同 n 下的调用次数（这个数字比耗时更能说明问题）');
console.log('');
console.log('  n'.padEnd(8) + 'f(n)'.padEnd(14) + '递归调用次数'.padEnd(18) + '相对上一个 n 的倍数');
console.log('  ' + '-'.repeat(64));
let prevCalls = 0;
for (const n of [10, 15, 20, 25, 30, 32]) {
  naiveCallCount = 0;
  const value = fibNaive(n);
  const calls = naiveCallCount;
  console.log(
    '  ' +
      String(n).padEnd(8) +
      String(value).padEnd(14) +
      calls.toLocaleString('en-US').padEnd(18) +
      (prevCalls === 0 ? '（基准）' : `${(calls / prevCalls).toFixed(2)}x`),
  );
  prevCalls = calls;
}
console.log('');
console.log('  注意 n 只增加 5，调用次数就涨了 10 倍以上（每 +1 约 ×1.6，每 +5 约 ×11）。');
console.log('  这是典型的【指数增长】O(2ⁿ)：');
console.log('    n=30  约 270 万次调用，还能忍；');
console.log('    n=40  约 3.3 亿次，要好几秒；');
console.log('    n=50  约 400 亿次，几分钟都算不完；');
console.log('    n=100 计算机跑一百年也算不完。');
console.log('');
console.log('  而这个问题明明只需要算 100 个数 —— 差距如此悬殊，');
console.log('  原因只有一个：同一件事被重复做了无数次。');
console.log('');
console.log('  复杂度：时间 O(2ⁿ)（准确说是 O(φⁿ)，φ≈1.618），空间 O(n)（递归栈深度）。');

// ---------------------------------------------------------------------------
// 2. 记忆化：自顶向下
// ---------------------------------------------------------------------------

console.log('\n--- 2. 记忆化搜索：给递归加一个"记事本"（自顶向下）---');
console.log('');
console.log('  最直接的修复：算过的答案就记下来，下次直接查表，不再递归。');
console.log('');
console.log('    const memo = new Map();');
console.log('    function fib(n) {');
console.log('      if (n <= 1) return n;');
console.log('      if (memo.has(n)) return memo.get(n);   // ★ 查记事本，命中就返回');
console.log('      const result = fib(n - 1) + fib(n - 2);');
console.log('      memo.set(n, result);                    // ★ 记下来');
console.log('      return result;');
console.log('    }');
console.log('');
console.log('  这个改动只有两行，却把复杂度从 O(2ⁿ) 降到了 O(n)。');
console.log('  为什么？因为每个 n 只会被【真正计算】一次，第二次遇到就直接查表。');
console.log('  调用次数的量级从"指数级"变成"线性级"—— 这就是 DP 的威力。');

/** 记忆化版斐波那契 */
function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}

// 统计记忆化版的真实计算次数
let memoComputeCount = 0;
function fibMemoCounted(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  memoComputeCount += 1;
  const result = fibMemoCounted(n - 1, memo) + fibMemoCounted(n - 2, memo);
  memo.set(n, result);
  return result;
}

console.log('');
console.log('  对比实测（相同 n，调用次数 vs 真实计算次数）：');
console.log('');
console.log('  n'.padEnd(8) + '朴素递归调用次数'.padEnd(22) + '记忆化的真实计算次数'.padEnd(24) + '倍数');
console.log('  ' + '-'.repeat(76));
for (const n of [20, 25, 30, 32]) {
  naiveCallCount = 0;
  fibNaive(n);
  const naive = naiveCallCount;
  memoComputeCount = 0;
  fibMemoCounted(n);
  const memoed = memoComputeCount;
  console.log(
    '  ' +
      String(n).padEnd(8) +
      naive.toLocaleString('en-US').padEnd(22) +
      `${memoed} 次（约等于 n）`.padEnd(26) +
      `${(naive / memoed).toFixed(0)}x`,
  );
}
console.log('');
console.log('  记忆化版的真实计算次数几乎就等于 n —— 因为它给每个子问题只算了一次。');
console.log('');
console.log('  复杂度：时间 O(n)（每个状态算一次，转移是 O(1)）');
console.log('          空间 O(n)（memo 表）+ O(n)（递归栈深度）');

const memoMs = medianMs(() => {
  sink.value = fibMemo(75);
});
console.log('');
console.log(`  记忆化算 f(75)（一个朴素递归永远算不完的数）：耗时约 ${memoMs.toFixed(4)} ms`);
console.log(`  f(75) = ${fibMemo(75)}`);
console.log('  （超过 f(78) 就会超出 JS 的安全整数范围 2⁵³-1，需要改用 BigInt。）');
console.log('');
console.log('  记忆化的优雅之处：它几乎是"暴力递归的直接翻译"，');
console.log('  只需要加"查表 + 记表"两行，不需要重新组织代码结构。');
console.log('  所以当你面对一道新题时，推荐先写出暴力递归，再加记忆化 —— 这是最稳的路径。');
console.log('');
console.log('  但它也有两个缺点：');
console.log('    · 递归有调用开销，深度大时还可能爆栈（状态数上万就要小心）；');
console.log('    · 需要额外维护递归栈空间。');
console.log('  这就引出了下一种写法。');

// ---------------------------------------------------------------------------
// 3. 递推：自底向上
// ---------------------------------------------------------------------------

console.log('\n--- 3. 递推：自底向上填表 ---');
console.log('');
console.log('  换个方向思考：既然 f(n) 只依赖 f(n-1) 和 f(n-2)，');
console.log('  那我不如【从小到大】依次算出来，摆在那里等着被用 —— 不用递归了。');
console.log('');
console.log('    const dp = [0, 1];');
console.log('    for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];');
console.log('    return dp[n];');
console.log('');
console.log('  填表过程（n=8）：');
console.log('');
{
  const dp = [0, 1];
  const n = 8;
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  console.log('    下标 i:  ' + Array.from({ length: n + 1 }, (_, i) => String(i).padStart(6)).join(''));
  console.log('    dp[i]:  ' + dp.map((v) => String(v).padStart(6)).join(''));
  console.log('');
  console.log('    箭头表示依赖关系：dp[i] = dp[i-1] + dp[i-2]');
  console.log('    dp[2] = dp[1] + dp[0] = 1 + 0 = 1');
  console.log('    dp[3] = dp[2] + dp[1] = 1 + 1 = 2');
  console.log('    dp[4] = dp[3] + dp[2] = 2 + 1 = 3');
  console.log('    ...');
  console.log(`    dp[${n}] = dp[${n - 1}] + dp[${n - 2}] = ${dp[n - 1]} + ${dp[n - 2]} = ${dp[n]}`);
}
console.log('');
console.log('  ★ 关键观察：算 dp[i] 时，我【只需要】dp[i-1] 和 dp[i-2] 两个值！');
console.log('    前面的 dp[0..i-3] 再也用不到了 —— 所以整个数组根本不必保存。');
console.log('');
console.log('    let prev2 = 0;   // f(0)');
console.log('    let prev1 = 1;   // f(1)');
console.log('    for (let i = 2; i <= n; i++) {');
console.log('      const cur = prev1 + prev2;');
console.log('      prev2 = prev1;   // 整体往前滚动一格');
console.log('      prev1 = cur;');
console.log('    }');
console.log('');
console.log('  这个技巧叫【滚动数组】/【状态压缩】：');
console.log('    当转移方程只依赖前几个状态时，可以用固定几个变量代替整个数组，');
console.log('    把空间复杂度从 O(n) 降到 O(1)。');

/** 递推版（数组） */
function fibIterative(n) {
  if (n <= 1) return n;
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  return dp[n];
}

/** 递推版（滚动变量，O(1) 空间） */
function fibRolling(n) {
  if (n <= 1) return n;
  let prev2 = 0;
  let prev1 = 1;
  for (let i = 2; i <= n; i++) {
    const cur = prev1 + prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}

console.log('');
console.log('  三种写法横向对比（n = 75）：');
console.log('');
console.log('  写法'.padEnd(34) + '时间'.padEnd(16) + '空间'.padEnd(20) + '耗时(ms)');
console.log('  ' + '-'.repeat(88));
console.log('朴素递归 f(75)'.padEnd(32) + 'O(2ⁿ)'.padEnd(16) + 'O(n) 递归栈'.padEnd(20) + '算不完');
console.log(
  '记忆化搜索（自顶向下）'.padEnd(32) + 'O(n)'.padEnd(16) + 'O(n) 表 + O(n) 栈'.padEnd(22) + memoMs.toFixed(4),
);
const iterMs = medianMs(() => {
  sink.value = fibIterative(75);
});
const rollingMs = medianMs(() => {
  sink.value = fibRolling(75);
});
console.log(
  '递推（自底向上，数组）'.padEnd(32) + 'O(n)'.padEnd(16) + 'O(n) 表'.padEnd(20) + iterMs.toFixed(4),
);
console.log(
  '递推（滚动变量）'.padEnd(32) + 'O(n)'.padEnd(16) + 'O(1) ★'.padEnd(20) + rollingMs.toFixed(4),
);
console.log('');
console.log(`  结果一致性：三种可运行的写法结果都相同 = ${
  fibMemo(75) === fibIterative(75) && fibIterative(75) === fibRolling(75)
}`);
console.log('');
console.log('  自底向上通常比记忆化快一点（没有递归调用开销），');
console.log('  而且能很自然地做"状态压缩"。代价是"必须自己想清楚填表顺序"。');

console.log('');
console.log('  自顶向下 vs 自底向上：该选哪个？');
console.log('');
console.log('  对比项'.padEnd(24) + '记忆化（自顶向下）'.padEnd(38) + '递推（自底向上）');
console.log('  ' + '-'.repeat(96));
for (const [item, topDown, bottomUp] of [
  ['写法来源', '暴力递归 + 两行缓存，改动最小', '需要自己确定填表顺序'],
  ['是否要算所有状态', '✓ 只算真正用到的状态（可能有剪枝）', '✗ 通常要把整张表填满'],
  ['递归开销', '有（函数调用 + 栈）', '无（纯循环）'],
  ['爆栈风险', '有（状态数大时）', '无'],
  ['状态压缩', '较难', '容易（滚动数组）'],
  ['调试友好度', '高（顺着递归看很直观）', '中（要脑内模拟填表顺序）'],
  ['推荐场景', '状态空间大但实际可达状态少', '状态空间规整、要求性能时'],
]) {
  console.log('  ' + item.padEnd(22) + topDown.padEnd(40) + bottomUp);
}
console.log('');
console.log('  实用建议：先写记忆化（因为它容易从暴力递归改出来、不容易错），');
console.log('  如果性能或栈深不够，再改写成自底向上 + 滚动数组。');

// ---------------------------------------------------------------------------
// 4. 两个前提
// ---------------------------------------------------------------------------

console.log('\n--- 4. DP 的两个前提：缺一不可 ---');
console.log('');
console.log('  前提一：【最优子结构】—— 大问题的最优解能由子问题的最优解拼出来');
console.log('');
console.log('    正面例子（可以用 DP）：');
console.log('      从 A 到 C 的最短路径经过 B，那 A→B 这段也一定是最短的。');
console.log('      因为如果 A→B 还有更短的路，换上去整体就更短了，矛盾。');
console.log('');
console.log('    反面例子（不能用 DP）：');
console.log('      求"最长简单路径"（不重复经过顶点）。');
console.log('      A→B→C 是最长的，但 A→B 这段本身未必是"A 到 B 的最长简单路径"，');
console.log('      因为那条最长路径可能经过 C，而 C 又要留到后面用 —— 子问题之间打架了。');
console.log('      这类问题没有最优子结构，是 NP 难的。');
console.log('');
console.log('  前提二：【重叠子问题】—— 不同的分支会反复用到同一个子问题');
console.log('');
console.log('    有重叠 → 用 DP 才有意义（记录答案，避免重复计算）；');
console.log('    没重叠 → 那是分治，记录反而白费内存。');
console.log('');
console.log('    对比两个经典算法：');
console.log('      归并排序：左边排好、右边排好，两边的子数组完全不同 → 无重叠 → 分治');
console.log('      斐波那契：f(5) 要 f(3)，f(4) 也要 f(3)          → 有重叠 → DP');
console.log('');
console.log('  一句话判断法：');
console.log('    画一下暴力递归的调用树。如果树里【出现了重复的节点】，那就是重叠子问题，');
console.log('    可以用 DP；如果每个节点只出现一次（像归并排序那样），那就不用。');
console.log('');
console.log('  只有最优子结构 + 重叠子问题同时成立，DP 才是对的工具。');

// ---------------------------------------------------------------------------
// 5. 爬楼梯
// ---------------------------------------------------------------------------

console.log('\n--- 5. 经典问题一：爬楼梯（DP 的入门题）---');
console.log('');
console.log('  题目：每次可以爬 1 级或 2 级台阶，爬到第 n 级有多少种不同的方法？');
console.log('');
console.log('  第 1 步：定义状态');
console.log('    dp[i] = 爬到第 i 级台阶的方法数');
console.log('');
console.log('  第 2 步：找转移方程（关键是"最后一步"是怎么来的）');
console.log('    要到第 i 级，最后一步只可能是两种情况：');
console.log('      · 从第 i-1 级爬 1 级上来 → 有 dp[i-1] 种方法');
console.log('      · 从第 i-2 级爬 2 级上来 → 有 dp[i-2] 种方法');
console.log('    所以：dp[i] = dp[i-1] + dp[i-2]');
console.log('');
console.log('  第 3 步：初始条件');
console.log('    dp[1] = 1（只能爬 1 级）');
console.log('    dp[2] = 2（1+1 或 2）');
console.log('');
console.log('  第 4 步：遍历顺序');
console.log('    dp[i] 依赖 dp[i-1] 和 dp[i-2]，都是更小的下标 → 从小到大遍历');
console.log('');
console.log('  看出来了吗？它和斐波那契是同一个递推式（只是初始值不同）。');
console.log('  这不是巧合 —— 很多 DP 题剥掉"业务外衣"后，骨子里都是同一套转移。');

/** 爬楼梯：返回 { ways, dp } */
function climbStairs(n) {
  if (n <= 0) return { ways: 0, dp: [0] };
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1; // 站在地面，算 1 种"什么都不做"的方案
  dp[1] = 1;
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
  return { ways: dp[n], dp };
}

console.log('');
console.log('  填表过程（n = 10）：');
{
  const { ways, dp } = climbStairs(10);
  console.log('    台阶 i:  ' + dp.map((_, i) => String(i).padStart(7)).join(''));
  console.log('    dp[i]:   ' + dp.map((v) => String(v).padStart(7)).join(''));
  console.log('');
  console.log(`    答案：爬到第 10 级有 ${ways} 种方法。`);
  console.log('');
  console.log('    手工验证几个值：');
  console.log('      dp[3] = dp[2] + dp[1] = 2 + 1 = 3   （111, 12, 21）');
  console.log('      dp[4] = dp[3] + dp[2] = 3 + 2 = 5   （1111, 112, 121, 211, 22）');
  console.log(`      dp[10] = ${dp[10]} 种 —— 暴力枚举的话要试 2¹⁰ 种组合，DP 只算 10 步。`);
}

console.log('');
console.log('  【变体】如果一次可以爬 1、2 或 3 级呢？');
console.log('    只需改转移方程：dp[i] = dp[i-1] + dp[i-2] + dp[i-3]');
console.log('    —— 这就是 DP 的好处：改一个业务规则，往往只需要改转移方程的一行。');
{
  const n = 10;
  const dp = new Array(n + 1).fill(0);
  dp[0] = 1;
  for (let i = 1; i <= n; i++) {
    dp[i] = dp[i - 1] + (i >= 2 ? dp[i - 2] : 0) + (i >= 3 ? dp[i - 3] : 0);
  }
  console.log('    台阶 i:  ' + dp.map((_, i) => String(i).padStart(7)).join(''));
  console.log('    dp[i]:   ' + dp.map((v) => String(v).padStart(7)).join(''));
  console.log(`    可以爬 1/2/3 级时，爬到第 ${n} 级有 ${dp[n]} 种方法（比只能爬 1/2 级多了不少）。`);
}

console.log('');
console.log('  【变体】如果相邻两步不能相同（不能连爬两次 1 级或两次 2 级）呢？');
console.log('    状态就不够用了 —— 因为"下一步能爬几级"取决于"上一步爬了几级"，');
console.log('    所以要把状态升级成 dp[i][last]：爬到第 i 级、且最后一步爬了 last 级。');
console.log('    ★ 这正是 DP 的核心难点：状态定义得够不够"信息完整"。');
console.log('      如果转移时需要某个信息，而状态里没有，那答案就会算错。');

console.log('');
console.log('  复杂度：时间 O(n)，空间 O(n)；');
console.log('          用滚动变量可优化到 O(1) 空间（只保留 dp[i-1] 和 dp[i-2]）。');

// ---------------------------------------------------------------------------
// 6. 0-1 背包
// ---------------------------------------------------------------------------

console.log('\n--- 6. 经典问题二：0-1 背包（二维 DP 的代表）---');
console.log('');
console.log('  题目：有 n 件物品，第 i 件重 w[i]、价值 v[i]；背包容量为 C。');
console.log('        每件物品只能选或不选（这就是"0-1"的含义），求能装下的最大总价值。');
console.log('');
console.log('  为什么不能贪心（"优先拿单位价值最高的"）？看这组数据：');
console.log('');
console.log('    物品 A：重 6，价值 12（性价比 2.0）← 性价比最高');
console.log('    物品 B：重 5，价值  9（性价比 1.8）');
console.log('    物品 C：重 5，价值  9（性价比 1.8）');
console.log('    背包容量：10');
console.log('');
console.log('    贪心的走法：先拿性价比最高的 A（重 6），剩余容量 4，');
console.log('                而 B、C 都要重 5 —— 一个都装不下。总价值 = 12。');
console.log('    最优解：    拿 B + C（重 5+5 = 10，正好装满），总价值 = 18。');
console.log('');
console.log('    贪心拿了"最划算"的那个，反而堵死了后面的路 —— 它的致命伤是【不能反悔】。');
console.log('    DP 会把所有可能都算一遍再取最优，所以不会犯这个错。');
console.log('');
console.log('  第 1 步：定义状态');
console.log('    dp[i][c] = 只考虑前 i 件物品、背包容量为 c 时，能获得的最大价值');
console.log('');
console.log('  第 2 步：转移方程（对第 i 件物品，只有"不拿"和"拿"两种选择）');
console.log('    不拿：dp[i][c] = dp[i-1][c]                    （容量不变，物品少一件）');
console.log('    拿：  dp[i][c] = dp[i-1][c - w[i]] + v[i]      （要腾出 w[i] 的容量）');
console.log('    取两者最大值：dp[i][c] = max(不拿, 拿)');
console.log('    注意：拿的前提是 c >= w[i]，容量不够就只可能"不拿"。');
console.log('');
console.log('  第 3 步：初始条件');
console.log('    dp[0][c] = 0（一件物品都不考虑，价值当然是 0）');
console.log('    dp[i][0] = 0（容量为 0，什么都装不下）');
console.log('');
console.log('  第 4 步：遍历顺序');
console.log('    dp[i][c] 依赖 dp[i-1][...]（上一行），所以 i 必须从小到大；');
console.log('    c 也从小到大（因为左边已经算好了）→ 从上到下、从左到右填表。');

/**
 * 0-1 背包
 * @param {number[]} weights 每件物品的重量
 * @param {number[]} values 每件物品的价值
 * @param {number} capacity 背包容量
 * @returns {{maxValue:number, dp:number[][], picked:number[]}}
 *
 * 时间 O(n × C)，空间 O(n × C)（可优化到 O(C)，见下面的一维版本）
 */
function knapsack01(weights, values, capacity) {
  const n = weights.length;
  // dp[i][c]：前 i 件物品、容量 c 的最大价值
  const dp = new Array(n + 1);
  for (let i = 0; i <= n; i++) dp[i] = new Array(capacity + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    const w = weights[i - 1];
    const v = values[i - 1];
    for (let c = 0; c <= capacity; c++) {
      dp[i][c] = dp[i - 1][c]; // 选择一：不拿第 i 件
      if (c >= w) {
        // 选择二：拿第 i 件（前提是容量够）
        const take = dp[i - 1][c - w] + v;
        if (take > dp[i][c]) dp[i][c] = take;
      }
    }
  }

  // 回溯出具体拿了哪些物品：从右下角往回走
  const picked = [];
  let c = capacity;
  for (let i = n; i >= 1; i--) {
    // 如果 dp[i][c] 和 dp[i-1][c] 不同，说明第 i 件被拿了
    if (dp[i][c] !== dp[i - 1][c]) {
      picked.push(i - 1); // 记录物品下标（0 基）
      c -= weights[i - 1];
    }
  }
  picked.reverse();

  return { maxValue: dp[n][capacity], dp, picked };
}

const kWeights = [2, 3, 4, 5];
const kValues = [3, 4, 5, 8];
const kCapacity = 8;

console.log('');
console.log(`  物品：${kWeights.map((w, i) => `#${i + 1}(重${w},值${kValues[i]})`).join('  ')}`);
console.log(`  背包容量：${kCapacity}`);

const kResult = knapsack01(kWeights, kValues, kCapacity);
console.log('');
console.log('  完整的 dp 表（行 = 考虑前 i 件物品，列 = 容量 c）：');
console.log('');
printTable(
  kResult.dp,
  Array.from({ length: kWeights.length + 1 }, (_, i) => (i === 0 ? '0件' : `前${i}件`)),
  Array.from({ length: kCapacity + 1 }, (_, c) => c),
  'i \\ c',
);
console.log('');
console.log('  读表说明：');
console.log(`    右下角的 dp[${kWeights.length}][${kCapacity}] = ${kResult.maxValue} 就是答案。`);
console.log('    每一行只能从【上一行】和【本行左边】推导出来 —— 这就是填表顺序的依据。');
console.log('');
console.log('  手推几个格子，验证转移方程：');
console.log(`    dp[1][2]：只有物品 #1（重2值3）。容量 2 刚好放下 → dp[0][0] + 3 = 3`);
console.log(`    dp[1][1]：容量 1 放不下重 2 的物品 → 只能不拿 → dp[0][1] = 0`);
console.log(`    dp[4][8]：考虑全部物品、容量 8。`);
console.log(`      不拿 #4 → dp[3][8] = ${kResult.dp[3][8]}`);
console.log(`      拿 #4（重5值8）→ dp[3][3] + 8 = ${kResult.dp[3][3]} + 8 = ${kResult.dp[3][3] + 8}`);
console.log(`      取最大 → ${kResult.maxValue} ✓`);
console.log('');
console.log(`  最优方案拿了：${kResult.picked.map((i) => `#${i + 1}`).join(', ')}` +
  `（总重 ${kResult.picked.reduce((s, i) => s + kWeights[i], 0)}，总价值 ${kResult.maxValue}）`);
console.log('');
console.log('  复杂度：时间 O(n × C)，空间 O(n × C)。');
console.log('    注意：C 是【容量的数值大小】，不是物品数量！');
console.log('    如果容量是 10⁹，这个算法就跑不动了 —— 这叫"伪多项式时间"，');
console.log('    也就是说它的复杂度取决于容量这个"数字"有多大，而不是输入有多少个元素。');

console.log('');
console.log('  【空间优化】一维数组版本（把空间从 O(n×C) 降到 O(C)）');
console.log('');
console.log('  观察：dp[i][c] 只依赖【上一行】的 dp[i-1][...]。');
console.log('  如果我在原地更新一个一维数组，需要保证读到的是"上一行"的值。');
console.log('  ★ 关键：容量 c 必须【从大到小】遍历！');
console.log('');
console.log('    从大到小：dp[c] 用到 dp[c-w]，而 c-w < c 还没被更新过 → 是上一行的值 ✓');
console.log('    从小到大：dp[c] 用到 dp[c-w]，而 c-w 已经在本轮被更新了 → 是【本行】的值 ✗');
console.log('              这就导致同一件物品被放了多次，变成了"完全背包"！');

/** 0-1 背包的一维优化版本 */
function knapsack01Optimized(weights, values, capacity) {
  const dp = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    const v = values[i];
    // ★ 从大到小遍历，保证用的是"上一轮"的值
    for (let c = capacity; c >= w; c--) {
      const take = dp[c - w] + v;
      if (take > dp[c]) dp[c] = take;
    }
  }
  return dp[capacity];
}

/** 故意写错：容量从小到大遍历（这其实变成了"完全背包"） */
function knapsackWrongOrder(weights, values, capacity) {
  const dp = new Array(capacity + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i];
    const v = values[i];
    for (let c = w; c <= capacity; c++) {
      // ★ 错：从小到大，同一件物品会被重复放
      const take = dp[c - w] + v;
      if (take > dp[c]) dp[c] = take;
    }
  }
  return dp[capacity];
}

console.log('');
console.log('  三种实现的对比（同一组数据）：');
console.log('');
console.log('  实现'.padEnd(38) + '结果'.padEnd(12) + '空间'.padEnd(16) + '说明');
console.log('  ' + '-'.repeat(92));
console.log(
  '二维 dp 表（标准写法）'.padEnd(36) +
    String(kResult.maxValue).padEnd(12) +
    'O(n×C)'.padEnd(16) +
    '最直观，能回溯出方案',
);
const optVal = knapsack01Optimized(kWeights, kValues, kCapacity);
console.log(
  '一维 dp（容量从大到小）'.padEnd(36) +
    String(optVal).padEnd(12) +
    'O(C)'.padEnd(16) +
    (optVal === kResult.maxValue ? '✓ 结果正确' : '✗ 结果错误'),
);
const wrongVal = knapsackWrongOrder(kWeights, kValues, kCapacity);
console.log(
  '一维 dp（容量从小到大）✗'.padEnd(36) +
    String(wrongVal).padEnd(12) +
    'O(C)'.padEnd(16) +
    (wrongVal === kResult.maxValue ? '结果碰巧对了' : '完全背包的结果，偏大'),
);
console.log('');
console.log(`  从小到大那个算出来是 ${wrongVal}，比正确答案 ${kResult.maxValue} 大 ——`);
console.log('  因为它允许同一件物品被重复放入。这个错误很隐蔽：');
console.log('  代码只差一个循环方向，结果却是另一道题的答案，而且通常不会报错。');

console.log('');
console.log('  【用代码验证上面那个贪心反例】');
{
  // 把开头讲的那组数据交给代码跑一遍，确认贪心真的会失败
  const gw = [6, 5, 5];
  const gv = [12, 9, 9];
  const gc = 10;

  /** 按性价比（价值/重量）降序贪心 */
  const greedyResult = (() => {
    const items = gw
      .map((w, i) => ({ w, v: gv[i], ratio: gv[i] / w }))
      .sort((a, b) => b.ratio - a.ratio);
    let cap = gc;
    let total = 0;
    const taken = [];
    for (const it of items) {
      if (it.w <= cap) {
        cap -= it.w;
        total += it.v;
        taken.push(`重${it.w}值${it.v}`);
      }
    }
    return { total, taken, left: cap };
  })();

  const optResult = knapsack01(gw, gv, gc);

  console.log('');
  console.log(`    物品：${gw.map((w, i) => `#${i + 1}(重${w},值${gv[i]},性价比${(gv[i] / w).toFixed(1)})`).join('  ')}`);
  console.log(`    容量：${gc}`);
  console.log('');
  console.log(`    贪心（按性价比降序）：拿了 ${greedyResult.taken.join(' + ')}`);
  console.log(`                          总价值 ${greedyResult.total}，剩余容量 ${greedyResult.left}（浪费了）`);
  console.log(`    动态规划：            拿了 ${optResult.picked.map((i) => `#${i + 1}`).join(' + ')}`);
  console.log(`                          总价值 ${optResult.maxValue}，剩余容量 ${gc - optResult.picked.reduce((s, i) => s + gw[i], 0)}（刚好装满）`);
  console.log('');
  console.log(
    `    结论：贪心拿到 ${greedyResult.total}，最优是 ${optResult.maxValue}，` +
      `差了 ${optResult.maxValue - greedyResult.total}。`,
  );
  console.log('    贪心先拿了"性价比最高"的 #1（重 6），结果剩下的 4 格容量');
  console.log('    连重 5 的 #2、#3 都装不下，白白浪费；');
  console.log('    而最优解是两个"看起来没那么划算"的 #2+#3 加起来刚好填满 10。');
  console.log('');
  console.log('    ★ 这就是 0-1 背包不能用贪心的原因：贪心【不能反悔】，');
  console.log('      而 DP 会把"拿/不拿"的所有组合都考虑一遍再取最优。');
  console.log('      （注意：如果是【分数背包】——物品可以切开来拿——');
  console.log('        那贪心就是对的，因为可以拿半件来填满剩余容量。');
  console.log('        "能不能切分"这一个条件，决定了同一道题该用贪心还是 DP。）');
}

// ---------------------------------------------------------------------------
// 7. 最长公共子序列
// ---------------------------------------------------------------------------

console.log('\n--- 7. 经典问题三：最长公共子序列 LCS（二维 DP 的又一代表）---');
console.log('');
console.log('  题目：给定两个字符串，求它们最长的公共子序列（不需要连续，但顺序不能乱）。');
console.log('    "ABCBDAB" 和 "BDCABA" 的 LCS 是 "BCBA"（长度为 4）');
console.log('');
console.log('  真实用途：git diff / 文件比对 / 代码合并 / 查重，底层都是 LCS 的变体。');
console.log('  为什么不是"最长公共子串"？因为子串要求连续，而代码改动往往是插入删除，');
console.log('  所以需要"允许跳过字符"的子序列。');
console.log('');
console.log('  第 1 步：定义状态');
console.log('    dp[i][j] = A 的前 i 个字符 与 B 的前 j 个字符 的 LCS 长度');
console.log('');
console.log('  第 2 步：转移方程（看 A[i] 和 B[j] 是否相等）');
console.log('    相等：dp[i][j] = dp[i-1][j-1] + 1        （这个字符可以接在 LCS 后面）');
console.log('    不等：dp[i][j] = max(dp[i-1][j], dp[i][j-1])');
console.log('           （A 的最后一个字符没用，或者 B 的最后一个字符没用，取较好的那种）');
console.log('');
console.log('  第 3 步：初始条件：dp[0][*] = 0, dp[*][0] = 0（空串和任何串的 LCS 都是空）');
console.log('  第 4 步：遍历顺序：i、j 都从小到大（依赖左上、上、左三个方向）');

/**
 * 最长公共子序列
 * @returns {{length:number, dp:number[][], lcs:string}}
 * 时间 O(m × n)，空间 O(m × n)
 */
function longestCommonSubsequence(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = new Array(m + 1);
  for (let i = 0; i <= m; i++) dp[i] = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // 回溯还原出具体的 LCS：从右下角往左上角走
  let i = m;
  let j = n;
  const chars = [];
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      chars.push(a[i - 1]);
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1; // 往上走
    } else {
      j -= 1; // 往左走
    }
  }
  chars.reverse();

  return { length: dp[m][n], dp, lcs: chars.join('') };
}

const lcsA = 'ABCBDAB';
const lcsB = 'BDCABA';
const lcsResult = longestCommonSubsequence(lcsA, lcsB);

console.log('');
console.log(`  A = "${lcsA}"（长度 ${lcsA.length}）`);
console.log(`  B = "${lcsB}"（长度 ${lcsB.length}）`);
console.log('');
console.log('  dp 表（行 = A 的前缀，列 = B 的前缀）：');
console.log('');
printTable(
  lcsResult.dp,
  ['∅', ...lcsA.split('').map((c) => `+${c}`)],
  ['∅', ...lcsB.split('')],
  'A\\B',
);
console.log('');
console.log('  读表说明：');
console.log(`    右下角 dp[${lcsA.length}][${lcsB.length}] = ${lcsResult.length} 就是 LCS 的长度。`);
console.log(`    还原出来的 LCS = "${lcsResult.lcs}"（长度 ${lcsResult.lcs.length}）`);
console.log('');
console.log('  手推几个格子，理解转移方程：');
console.log('    dp[1][1]：A="A" vs B="B"，不等 → max(dp[0][1], dp[1][0]) = max(0,0) = 0');
console.log('    dp[2][2]：A="AB" vs B="BD"，末字符 B==B 相等 → dp[1][1] + 1 = 0 + 1 = 1');
console.log('    dp[2][4]：A="AB" vs B="BDCA"，末字符 B≠A 不等 →');
console.log(`             max(dp[1][4], dp[2][3]) = max(${lcsResult.dp[1][4]}, ${lcsResult.dp[2][3]}) = ${lcsResult.dp[2][4]}`);
console.log('');
console.log('  注意 dp 表的两个性质：');
console.log('    ① 每一行/列都是【单调不减】的 —— 前缀越长，LCS 只可能更长或不变；');
console.log('    ② 每个格子只依赖【左上、上、左】三个邻居，所以填表顺序必须从上到下、从左到右。');
console.log('');
console.log('  复杂度：时间 O(m × n)，空间 O(m × n)。');
console.log('    空间可以优化到 O(min(m,n))：因为每个格子只依赖上一行，');
console.log('    但【回溯方案】需要完整的表，所以要么牺牲空间，要么牺牲"还原具体方案"的能力。');
console.log('    这就是"优化空间"和"保留信息"之间的经典权衡。');

console.log('');
console.log('  实际效果演示（这就是 git diff 的思路）：');
{
  const before = 'const a = 1;';
  const after = 'const a = 2;';
  const r = longestCommonSubsequence(before, after);
  console.log(`    改动前：${before}`);
  console.log(`    改动后：${after}`);
  console.log(`    公共部分："${r.lcs}"（长度 ${r.length}）`);
  console.log('    有了 LCS，"哪些字符变了"就一目了然了 —— 剩下的就是新增/删除的部分。');
}

// ---------------------------------------------------------------------------
// 8. 零钱兑换
// ---------------------------------------------------------------------------

console.log('\n--- 8. 经典问题四：零钱兑换（求"最小"的 DP）---');
console.log('');
console.log('  题目：给定若干种面额的硬币（每种数量无限），凑出金额 amount，');
console.log('        求【最少】需要几枚硬币。凑不出来返回 -1。');
console.log('    例：硬币 [1, 2, 5]，amount = 11 → 最少 3 枚（5 + 5 + 1）');
console.log('');
console.log('  为什么贪心不行？举个反例：硬币 [1, 3, 4]，amount = 6。');
console.log('    贪心（每次拿最大的）：4 + 1 + 1 = 3 枚；');
console.log('    最优解：3 + 3 = 2 枚。');
console.log('    贪心拿了大硬币之后"没法反悔"，DP 会把所有可能都试一遍。');
console.log('');
console.log('  第 1 步：定义状态');
console.log('    dp[i] = 凑出金额 i 所需的【最少硬币数】');
console.log('');
console.log('  第 2 步：转移方程（枚举"最后一枚硬币"用的是哪种面额）');
console.log('    dp[i] = min( dp[i - coin] + 1 )   对所有满足 coin <= i 的面额 coin');
console.log('    含义：如果最后一枚是 coin，那前面要凑出 i-coin，再加这一枚。');
console.log('');
console.log('  第 3 步：初始条件');
console.log('    dp[0] = 0（凑 0 元需要 0 枚）');
console.log('    dp[i] = Infinity（先假设凑不出来，这也是"求最小"型 DP 的常见初始化）');
console.log('');
console.log('  第 4 步：遍历顺序：i 从小到大（dp[i] 依赖更小的金额）');
console.log('');
console.log('  ★ 注意这个"求最小"型 DP 和前面"求最大/方案数"的一个关键区别：');
console.log('    初始化必须用 Infinity，不能用 0！');
console.log('    如果初始化为 0，那些"凑不出来"的金额会显示需要 0 枚硬币，');
console.log('    然后这个错误的 0 会沿着转移方程一路污染下去，最后答案就错了。');

/**
 * 零钱兑换：返回 { count, dp, coins }
 * 时间 O(amount × 硬币种数)，空间 O(amount)
 */
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
      }
    }
  }

  if (dp[amount] === Infinity) return { count: -1, dp, coins: [] };

  // 回溯出用了哪些硬币
  const used = [];
  let rest = amount;
  while (rest > 0) {
    for (const coin of coins) {
      if (coin <= rest && dp[rest - coin] + 1 === dp[rest]) {
        used.push(coin);
        rest -= coin;
        break;
      }
    }
  }

  return { count: dp[amount], dp, coins: used };
}

const coinDenoms = [1, 2, 5];
const coinAmount = 11;

console.log('');
console.log(`  硬币面额：[${coinDenoms.join(', ')}]，目标金额：${coinAmount}`);
console.log('');
console.log('  dp 表：');
{
  const { dp } = coinChange(coinDenoms, coinAmount);
  const fmt = (v) => (v === Infinity ? '∞' : String(v));
  console.log('    金额 i:  ' + dp.map((_, i) => String(i).padStart(6)).join(''));
  console.log('    dp[i]:   ' + dp.map((v) => fmt(v).padStart(6)).join(''));
  console.log('');
  console.log('  手推几个格子，理解转移方程：');
  console.log('    dp[0] = 0（凑 0 元，0 枚）');
  console.log(`    dp[1] = min(dp[1-1]+1) = dp[0]+1 = 1（只能拿 1 元硬币）`);
  console.log(`    dp[2] = min(dp[2-1]+1, dp[2-2]+1) = min(${fmt(dp[1])}+1, ${fmt(dp[0])}+1) = 1（直接拿 2 元）`);
  console.log(`    dp[3] = min(dp[2]+1, dp[1]+1) = min(${fmt(dp[2])}+1, ${fmt(dp[1])}+1) = 2（2+1）`);
  console.log(`    dp[11] = min(dp[10]+1, dp[9]+1, dp[6]+1) = ${fmt(dp[11])}`);
  console.log(`    验证：${coinChange(coinDenoms, coinAmount).coins.join(' + ')} = ${coinAmount}，共 ${coinChange(coinDenoms, coinAmount).count} 枚`);
}
console.log('');
console.log('  几个不同金额的结果：');
console.log('');
console.log('  金额'.padEnd(10) + '最少硬币数'.padEnd(14) + '一种最优组合');
console.log('  ' + '-'.repeat(52));
for (const amt of [0, 1, 3, 6, 7, 11, 13, 27]) {
  const r = coinChange(coinDenoms, amt);
  console.log(
    '  ' +
      String(amt).padEnd(10) +
      (r.count === -1 ? '凑不出来' : String(r.count)).padEnd(16) +
      (r.count === -1 ? '—' : r.coins.join(' + ')),
  );
}
console.log('');
console.log('  【凑不出来的情况】换个面额看看：');
{
  const c2 = [3, 5];
  const a2 = 7;
  const r = coinChange(c2, a2);
  const { dp } = coinChange(c2, a2);
  console.log(`    硬币 [${c2.join(', ')}]，目标 ${a2}`);
  console.log('    金额 i:  ' + dp.map((_, i) => String(i).padStart(6)).join(''));
  console.log('    dp[i]:   ' + dp.map((v) => (v === Infinity ? '∞' : String(v)).padStart(6)).join(''));
  console.log(`    结果：${r.count === -1 ? '-1（凑不出来）' : r.count}`);
  console.log('');
  console.log('    注意 dp[1]、dp[2]、dp[4] 都是 ∞ —— 它们确实凑不出来。');
  console.log('    如果没有把 dp 初始化为 Infinity 而是用 0，');
  console.log('    这些位置就会显示"0 枚硬币"，然后 dp[3] 会算出 dp[0]+1=1，');
  console.log('    dp[6] 会算出 dp[3]+1=2…… 整个表全错。');
  console.log('    ★ 这就是"求最小型 DP 必须用 Infinity 初始化"的原因。');
}
console.log('');
console.log('  复杂度：时间 O(amount × 硬币种数)，空间 O(amount)。');

console.log('');
console.log('  【对比：求方案数的版本】把 min 改成加法');
console.log('    dp[i] = Σ dp[i - coin]    （凑出金额 i 的方案总数）');
console.log('    初始条件也变成 dp[0] = 1（凑 0 元有 1 种方案：什么都不拿）');
console.log('    —— 同一道题，问"最少几枚"和问"有几种凑法"，转移方程只差一个 min/Σ。');
console.log('       这说明 DP 的"状态定义"往往比"转移方程"更关键：');
console.log('       状态定义好了，转移方程几乎是自然而然写出来的。');

// ---------------------------------------------------------------------------
// 9. 方法论
// ---------------------------------------------------------------------------

console.log('\n--- 9. 状态定义与转移方程该怎么想 ---');
console.log('');
console.log('  大多数人觉得 DP 难，难在"想不到状态定义"。这里给一套可操作的方法。');
console.log('');
console.log('  【第一步：确定"最后一步"是什么】');
console.log('    这是最有效的破题入口。问自己：');
console.log('      "最优解的最后一步，有哪几种可能？"');
console.log('    爬楼梯：最后一步是爬 1 级还是 2 级 → 两种可能 → 转移方程有两个来源；');
console.log('    背包：  最后一件物品是拿还是不拿 → 两种可能；');
console.log('    零钱：  最后一枚硬币是哪种面额 → 枚举所有面额；');
console.log('    LCS：   两个串的最后一个字符相不相等 → 两种情况。');
console.log('    ★ 想清楚"最后一步"，转移方程基本就出来了。');
console.log('');
console.log('  【第二步：确定状态要包含哪些信息】');
console.log('    状态 = "描述一个子问题所需的最少信息"。');
console.log('    判断标准：如果知道了状态，能不能唯一确定"接下来能做什么"？');
console.log('    常见状态维度：');
console.log('      · 一维：dp[i] —— 处理到第 i 个位置 / 金额为 i / 爬到第 i 级');
console.log('      · 二维：dp[i][j] —— 两个序列的前 i、前 j 个 / 前 i 件物品容量 j');
console.log('      · 带额外维度：dp[i][0/1] —— 第 i 天"持有/不持有"股票');
console.log('    维度不够的典型症状：转移时发现"少了一个信息"，只能瞎凑 ——');
console.log('    这时就该加维度（比如爬楼梯的"相邻两步不能相同"变体，需要 dp[i][last]）。');
console.log('');
console.log('  【第三步：写转移方程，然后立刻验算】');
console.log('    把方程写出来后，【手工算几个小值】，看是否合理。');
console.log('    本示例每个问题都做了这件事 —— 这是检验 DP 最快的方法。');
console.log('');
console.log('  【第四步：确定遍历顺序】');
console.log('    规则只有一条：【算 dp[大] 时，它依赖的 dp[小] 必须已经算好了】。');
console.log('    所以：依赖"上方/左方" → 从上到下、从左到右；');
console.log('          依赖"更小的下标" → 从小到大；');
console.log('          依赖"更大的下标" → 从大到小（0-1 背包的一维优化就是这样）。');
console.log('');
console.log('  【卡住时的三个自救手段】');
console.log('    ① 先写暴力递归 —— 别一上来就想 DP。写完递归，重叠子问题自然浮现，');
console.log('       加个 memo 就是记忆化，再加个循环就是递推；');
console.log('    ② 画一张表 —— 拿笔在纸上填几个格子，转移方程往往就自己冒出来了；');
console.log('    ③ 从小数据开始 —— 手算 n=1、2、3 的答案，观察规律，再反推状态定义。');
console.log('');
console.log('  【DP 题的四类常见问法】（看到就知道大概怎么设状态）');
console.log('');
console.log('    问法'.padEnd(24) + '典型转移'.padEnd(38) + '例子');
console.log('    ' + '-'.repeat(96));
for (const [kind, trans, example] of [
  ['求方案数', 'dp[i] = Σ dp[i-...]', '爬楼梯、零钱兑换（方案数版）'],
  ['求最大值', 'dp[i] = max(dp[...] + value)', '0-1 背包、打家劫舍'],
  ['求最小值', 'dp[i] = min(dp[...] + cost)', '零钱兑换（最少硬币）、编辑距离'],
  ['求可行性', 'dp[i] = dp[...] || ...', '分割等和子集、单词拆分'],
]) {
  console.log('    ' + kind.padEnd(22) + trans.padEnd(40) + example);
}

// ---------------------------------------------------------------------------
// 10. 复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 10. 复杂度对照表 ---');

console.log('');
console.log('问题'.padEnd(26) + '时间'.padEnd(22) + '空间'.padEnd(18) + '空间优化后');
console.log('-'.repeat(92));
for (const [name, time, space, opt] of [
  ['斐波那契（朴素递归）', 'O(2ⁿ)', 'O(n) 递归栈', '—'],
  ['斐波那契（记忆化/递推）', 'O(n)', 'O(n)', 'O(1) 滚动变量'],
  ['爬楼梯', 'O(n)', 'O(n)', 'O(1) 滚动变量'],
  ['0-1 背包（二维）', 'O(n × C)', 'O(n × C)', 'O(C)（容量倒序遍历）'],
  ['最长公共子序列', 'O(m × n)', 'O(m × n)', 'O(min(m,n))（但无法回溯方案）'],
  ['零钱兑换', 'O(amount × k)', 'O(amount)', 'O(amount)（已是最终形态）'],
  ['编辑距离', 'O(m × n)', 'O(m × n)', 'O(min(m,n))'],
]) {
  console.log(name.padEnd(24) + time.padEnd(22) + space.padEnd(18) + opt);
}
console.log('');
console.log('  查表说明：');
console.log('    · n 是物品数/台阶数，C 是背包容量，m、n 是两个字符串长度，k 是硬币种数；');
console.log('    · 背包的复杂度是 O(n × C) —— 注意 C 是【数值大小】不是元素个数，');
console.log('      所以容量特别大时背包问题是"伪多项式时间"，会跑不动。');

console.log('');
console.log('  DP vs 其他算法思想：');
console.log('');
console.log('  思想'.padEnd(18) + '适用特征'.padEnd(44) + '典型代表');
console.log('  ' + '-'.repeat(92));
for (const [name, feature, example] of [
  ['分治', '子问题不重叠，各自独立', '归并排序、快排'],
  ['贪心', '每步都取局部最优，且不回退（需要证明）', '活动选择、霍夫曼编码'],
  ['动态规划', '子问题重叠 + 最优子结构', '背包、LCS、编辑距离'],
  ['回溯', '要枚举所有方案（DP 只求"最优值"，回溯能给出"所有方案"）', '八皇后、全排列'],
  ['记忆化搜索', 'DP 的自顶向下实现方式', '本质还是 DP'],
]) {
  console.log('  ' + name.padEnd(16) + feature.padEnd(46) + example);
}

console.log('');
console.log('  怎么在【贪心 / DP / 分治】之间选？');
console.log('    ① 先问"能不能贪心" —— 如果每一步的局部最优一定能推出全局最优（且你能证明），');
console.log('       那贪心是 O(n) 的，比 DP 快得多。证明不了就别用贪心。');
console.log('    ② 再问"子问题重叠吗" —— 画一下递归树，有重复节点就是 DP；');
console.log('       没有重复就是纯分治，直接递归即可。');
console.log('    ③ 最后问"要不要具体方案" —— DP 通常只能给"最优值"，');
console.log('       （本示例的背包和 LCS 都通过【回溯 dp 表】把方案还原了出来）');
console.log('       如果需要枚举【全部】符合条件的方案，那要用回溯。');

console.log('');
console.log('  最后三句话：');
console.log('');
console.log('  1. 动态规划不神秘，它就是把"重复计算"换成"查表" ——');
console.log('     从朴素递归到记忆化只加两行，就是这个思想最纯粹的体现。');
console.log('');
console.log('  2. 学 DP 的路径应该是：');
console.log('     先写暴力递归 → 发现重复 → 加记忆化 → 改成递推 → 再想能不能压缩空间。');
console.log('     一上来就硬想递推和状态压缩，是最容易放弃的路径。');
console.log('');
console.log('  3. DP 的核心竞争力是【状态定义】而不是【写代码】。');
console.log('     状态定义对了，转移方程往往是自然而然写出来的；');
console.log('     状态定义错了，怎么调都是错的。拿不准时就用纸笔画表 —— ');
console.log('     本示例打印的所有 dp 表，就是这个习惯的体现。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
