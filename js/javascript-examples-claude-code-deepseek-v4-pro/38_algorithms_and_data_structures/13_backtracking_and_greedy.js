/**
 * ============================================================================
 * 知识点：回溯与贪心 —— 搜索式回溯的通用框架、剪枝，以及贪心的正确性条件与反例
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】高级
 * 【前置知识】38_algorithms_and_data_structures/07_graph_traversal.js（DFS 递归）
 *            38_algorithms_and_data_structures/10_dynamic_programming.js（DP 方法论）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    回溯和贪心都是【解题思想】而不是某种具体数据结构。它们共同面对的问题是：
 *    "在一个巨大的解空间里找答案"，但走的是两个极端：
 *
 *      回溯：我全都要试 —— 系统地枚举所有可能，走错了就退回来（一定有正确答案，但可能很慢）
 *      贪心：我不想回头 —— 每一步都选当下看起来最好的，选了就不改（很快，但常常错）
 *
 *    回溯的通用框架只有三句话（本示例反复出现这三句话）：
 *
 *        选择 → 递归 → 撤销
 *
 *      做选择（path.push）        在决策树上往前走一步
 *      递归进入下一层             继续做下一个决策
 *      撤销选择（path.pop）       退回来，换一个选择再试
 *
 *    ASCII 示意（求 [1,2,3] 的全排列，决策树："这一位放谁"）：
 *
 *                          根（空）
 *              ┌─────────────┼─────────────┐
 *              1             2             3          ← 第 1 位放谁
 *           ┌──┴──┐       ┌──┴──┐       ┌──┴──┐
 *           2     3       1     3       1     2      ← 第 2 位放谁（不能重复用）
 *           │     │       │     │       │     │
 *           3     2       3     1       2     1      ← 第 3 位放谁
 *         [123] [132]   [213] [231]   [312] [321]
 *
 *      树的每条"根 → 叶子"路径就是一个解，一共 3! = 6 个叶子。
 *      回溯做的事情就是【深度优先地走完这棵树】，而"撤销"就是"从树枝上退回到岔路口"。
 *
 *    ⚠ 术语澄清：「回溯」在这门课里有两个完全不同的意思，本仓库两个都用到了：
 *
 *      · 【搜索式回溯】（backtracking）—— 本文件讲的东西：
 *        在决策树上做深度优先搜索，选择 → 递归 → 撤销。它是【求解】的方法，
 *        典型代表是八皇后、全排列、数独、组合总和。
 *
 *      · 【从 DP 表倒推方案】（也有人叫"回溯 dp 表"）—— 10_dynamic_programming.js 里的用法：
 *        DP 已经算出了最优【值】，现在想还原"最优【方案】是什么"，
 *        于是从 dp 表的右下角往回走，看每一步是从哪个状态转移来的。
 *        它本身【不是搜索】，只是顺着已知的 DP 表走一条确定的路径（复杂度 O(n+m)，不含枚举）。
 *
 *      两者的区别可以用一句话概括：
 *        搜索式回溯 = 在【未知】的决策树上找答案（可能要走遍整棵树）；
 *        倒推 DP 表 = 在【已知】的数字表格上走一条路（只走一条路，不回头）。
 *      它们唯一的共同点是"都从终点往回退着看"这个动作的感觉很像 —— 但动机和代价完全不同。
 *      10_dynamic_programming.js 里出现"回溯"字样的地方（比如背包方案还原、LCS 还原）
 *      说的都是第二种，本文件说的是第一种，请务必分清。
 *
 * 2. 为什么需要（真实项目场景）
 *    · 搜题/数独/填字游戏：解数独、猜数字、扫雷推断，本质都是回溯搜索；
 *    · 排班与调度：给员工排班、给考场分配监考，回溯找出满足所有约束的方案；
 *    · 组合优化：从一堆候选里挑出满足预算的组合（推荐系统的搭配、优惠券组合）；
 *    · 编译原理：正则表达式匹配引擎（回溯式）、语法分析器的回溯实现；
 *    · 自动化测试：从状态空间里搜索一条能复现 bug 的操作序列；
 *    · 贪心的战场：活动选择（会议室预定、课程表排程）、
 *      Huffman 编码、Dijkstra、最小生成树、文件压缩、缓存淘汰（LRU 的近似）；
 *    · 面试与比赛：回溯题考"代码组织能力"，贪心题考"你能不能证明自己对"。
 *
 * 3. 核心语法要点 / 算法思想
 *    · 回溯 = DFS + 状态恢复。它的正确性来自"穷举了所有可能"；
 *      它的速度来自"剪枝"—— 发现当前分支不可能产生解时立刻返回。
 *    · 剪枝的两种典型：
 *        可行性剪枝：当前状态已经违反约束（比如皇后互相攻击了）→ 立刻返回；
 *        最优性剪枝：当前代价已经超过已知最优解 → 不可能更好，立刻返回。
 *      剪枝不改变最坏复杂度，但常常把实际耗时降几个数量级。
 *    · 回溯的复杂度通常是【指数级】的：子集 2ⁿ、排列 n!、n 皇后约 n!。
 *      所以回溯只适合 n 很小的场景（一般 n ≤ 20）。
 *      如果 n 很大，要么找到多项式算法（DP / 贪心），要么问题本身就是 NP 难的。
 *    · 贪心的两个正确性条件（缺一不可，且都必须【证明】）：
 *        ① 贪心选择性质：每一步的局部最优选择，一定包含在某个全局最优解里；
 *        ② 最优子结构：做完这次选择后，剩下的子问题仍然可以用同样的贪心策略解决。
 *      工程上的做法通常是【交换论证】：假设存在最优解与贪心选择不同，
 *      把它俩交换一下，证明解不会变差 —— 于是"存在一个含贪心选择的最优解"。
 *    · 贪心不成立时的反例构造思路（本示例会实操一遍）：
 *        局部最优的选择会"占掉"更好的组合机会 —— 也就是"重量"这个约束
 *        让"单位价值最高"不等于"整体价值最高"。
 *
 * 4. 常见陷阱
 *    - 陷阱一：忘记"撤销"。路径数组 push 了却没 pop，下一个分支会看到脏状态。
 *      症状是答案里出现重复元素或者长度不对 —— 回溯题 90% 的 bug 都在这里。
 *    - 陷阱二：结果里存了【引用】。result.push(path) 存的是同一个数组的引用，
 *      后面 path 变了结果也跟着变了。必须 result.push([...path]) 拷一份。
 *    - 陷阱三：排列问题忘记 used 数组，或者子集/组合问题误用 used 数组导致重复枚举。
 *      记住：组合用【起始下标 start】防重复，排列用【used 数组】防重复，两者不能混。
 *    - 陷阱四：有重复元素时不做去重（排序 + 跳过"和上一个相同且上一个没被用过"的元素）。
 *    - 陷阱五：把贪心当万能药。贪心写起来最短，但"能过样例"和"正确"是两件事 ——
 *      本示例会构造一个样例，让"看起来最合理"的贪心策略当场翻车。
 *    - 陷阱六：以为剪枝能改变复杂度量级。剪枝只是让常数和实际规模变小，
 *      最坏情况依然是指数级 —— 不能靠剪枝把 NP 难问题变成多项式算法。
 *    - 陷阱七：递归深度。回溯的递归深度等于"决策层数"（比如 n 皇后是 n 层），
 *      n 很大时会爆栈 —— 这时要么改迭代，要么承认这个 n 本来就跑不了回溯。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/13_backtracking_and_greedy.js
 *
 * 【预期输出】
 *   打印 8 个小节：回溯的通用框架与决策树、子集/组合/排列的完整枚举与剪枝、
 *   组合总和（剪枝实战）、N 皇后（含剪枝效果实测）、贪心的正确性条件与活动选择、
 *   贪心反例构造（0-1 背包与找零钱）、回溯/贪心/DP 的选型决策表、以及复杂度对照表。
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
// 1. 回溯的通用框架
// ---------------------------------------------------------------------------

console.log('--- 1. 回溯的通用框架：选择 → 递归 → 撤销 ---');
console.log('');
console.log('所有回溯题的代码长成同一个样子，只有"选择是什么"和"合法性怎么判断"在变：');
console.log('');
console.log('    function backtrack(路径, 可选列表) {');
console.log('      if (满足结束条件) {');
console.log('        结果.push([...路径]);   // ★ 必须拷贝，否则存的是引用');
console.log('        return;');
console.log('      }');
console.log('      for (const 选择 of 可选列表) {');
console.log('        if (!合法(选择)) continue;   // ← 剪枝：走不通就别走');
console.log('        路径.push(选择);             // ① 做选择');
console.log('        backtrack(路径, 新的可选列表); // ② 递归进入下一层');
console.log('        路径.pop();                  // ③ 撤销选择（回溯的精髓）');
console.log('      }');
console.log('    }');
console.log('');
console.log('  这三步中，第 ③ 步最容易被漏掉，也最难在出错时看出来 ——');
console.log('  因为漏掉撤销时，程序往往【还能跑】，只是答案会多几个、或者多一堆重复。');
console.log('');
console.log('  ★ 为什么"撤销"是必须的？因为整棵树共用【同一个 path 数组】。');
console.log('    回溯的每一个节点都代表"走到这里为止的选择序列"，');
console.log('    而 path 始终表示【当前所在节点】的那条路径。');
console.log('    从子节点退回父节点时，路径当然要跟着退一步 —— 这就是 path.pop()。');
console.log('    如果你给每个节点都复制一份新数组，那就不用撤销了，代价是空间爆炸。');
console.log('    "共享一份路径 + 用完恢复"是回溯在空间与时间之间的经典取舍。');
console.log('');
console.log('  ★ 决策树的三要素（画出来题就做对了一半）：');
console.log('      · 节点代表什么状态？（已经选了哪些东西）');
console.log('      · 有哪些分支？（这一步能做什么选择）');
console.log('      · 什么时候是叶子？（选够了 / 满足条件了）');
console.log('    本节的三个例子就是同一棵树的三种形状，请对照着看。');

// ---------------------------------------------------------------------------
// 2. 子集、组合、排列
// ---------------------------------------------------------------------------

console.log('\n--- 2. 三种经典枚举：子集 / 组合 / 排列 ---');
console.log('');
console.log('它们是最基础的回溯题，区别只在"下一步能选什么"：');
console.log('');
console.log('  问题'.padEnd(18) + '决策树的分支规则'.padEnd(44) + '解的个数');
console.log('  ' + '-'.repeat(84));
for (const [name, rule, count] of [
  ['子集', '对每个元素：选它 / 不选它（二叉树）', '2ⁿ'],
  ['组合 C(n,k)', '从 start 往后选，只准往后（避免重复）', 'C(n, k)'],
  ['排列 A(n,n)', '每一位都可以放没用过的任何元素（用 used 标记）', 'n!'],
]) {
  console.log('  ' + name.padEnd(16) + rule.padEnd(46) + count);
}
console.log('');

/**
 * 求所有子集（幂集）。
 *
 * 决策：对第 i 个元素，"选"或者"不选" —— 一棵二叉决策树，共 2ⁿ 个叶子。
 * 复杂度：时间 O(n × 2ⁿ)（每个子集都要拷贝一份，长度平均 n/2），空间 O(n) 递归深度。
 */
function subsets(nums) {
  const result = [];
  const path = [];
  const backtrack = (i) => {
    if (i === nums.length) {
      result.push([...path]); // ★ 拷一份，不能直接 push(path)
      return;
    }
    // 分支一：不选 nums[i]
    backtrack(i + 1);
    // 分支二：选 nums[i]
    path.push(nums[i]); // ① 选择
    backtrack(i + 1); // ② 递归
    path.pop(); // ③ 撤销
  };
  backtrack(0);
  return result;
}

console.log('【子集】nums = [1, 2, 3]，决策树如下（左边 = 不选，右边 = 选）：');
console.log('');
console.log('                      []                      第 1 个元素 1');
console.log('              ┌───────┴───────┐');
console.log('             []               [1]');
console.log('          ┌───┴───┐       ┌───┴───┐           第 2 个元素 2');
console.log('         []      [2]     [1]    [1,2]');
console.log('        ┌─┴─┐   ┌─┴─┐   ┌─┴─┐   ┌─┴─┐        第 3 个元素 3');
console.log('       [] [3] [2] [2,3] [1] [1,3] [1,2] [1,2,3]');
console.log('');
{
  const result = subsets([1, 2, 3]);
  console.log(`  得到 ${result.length} 个子集（2³ = 8）：`);
  console.log(`    ${result.map((s) => `[${s.join(',')}]`).join('  ')}`);
  console.log('');
  console.log('  注意输出顺序：空集、[3]、[2]、[2,3]、[1]、[1,3]、[1,2]、[1,2,3]。');
  console.log('  这是"先走完不选的分支"得到的顺序 —— 回溯的访问顺序由分支顺序决定，');
  console.log('  换个分支顺序就会得到另一种合法排列方式（题目一般不要求特定顺序）。');
}
console.log('');

/**
 * 求组合数 C(n, k)：从 nums 里挑 k 个。
 *
 * 关键：用【start 下标】保证"只往后选"。
 * 如果不用 start，[1,2] 和 [2,1] 会被当成两个答案（那是排列，不是组合）。
 * 难度：这个 start 是组合类问题的通用钥匙。
 */
function combinations(nums, k) {
  const result = [];
  const path = [];
  const backtrack = (start) => {
    if (path.length === k) {
      result.push([...path]);
      return;
    }
    // 剪枝：剩下的元素不够凑满 k 个，就没必要继续了
    // （剩余可选个数 = nums.length - i，需要凑 = k - path.length）
    for (let i = start; i < nums.length; i++) {
      if (nums.length - i < k - path.length) break; // ★ 剪枝
      path.push(nums[i]);
      backtrack(i + 1); // ★ 传 i+1 而不是 start+1：从"下一个元素"继续，保证不回头
      path.pop();
    }
  };
  backtrack(0);
  return result;
}

console.log('【组合】从 [1,2,3,4] 里挑 2 个：');
console.log('');
{
  const result = combinations([1, 2, 3, 4], 2);
  console.log(`  共 ${result.length} 种（C(4,2) = 6）：${result.map((c) => `[${c.join(',')}]`).join('  ')}`);
  console.log('');
  console.log('  ★ time 剪枝那一行的作用：以 C(4,2) 为例，当已经选了 1 个、');
  console.log('    而剩下可选的元素不足 1 个时，再往下走也凑不齐 2 个，直接 break。');
  console.log('    这个剪枝让 n 很大、k 很小时的运行时间从"枚举全部 2ⁿ"降到"只枚举 C(n,k)"。');
}
console.log('');

/**
 * 求全排列。
 *
 * 和组合的区别：每一位都【可以】用任何没用过的元素（不需要 start），
 * 所以要用 used 数组记录"谁已经被用掉了"。
 * 复杂度：时间 O(n × n!)（n! 个叶子，每个叶子拷贝长度 n 的路径），空间 O(n)。
 */
function permutations(nums) {
  const result = [];
  const path = [];
  const used = new Array(nums.length).fill(false);
  const backtrack = () => {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }
    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue; // ← 剪枝：这一位已经被占了
      used[i] = true; // ① 选择
      path.push(nums[i]);
      backtrack(); // ② 递归
      path.pop(); // ③ 撤销（两个状态都要还原！）
      used[i] = false;
    }
  };
  backtrack();
  return result;
}

console.log('【排列】[1, 2, 3] 的全排列：');
console.log('');
{
  const result = permutations([1, 2, 3]);
  console.log(`  共 ${result.length} 种（3! = 6）：${result.map((p) => p.join('')).join('  ')}`);
  console.log('');
  console.log('  ★ 撤销时【要还原两样东西】：path.pop() 和 used[i] = false。');
  console.log('    只还原一个是最经典的回溯 bug：');
  console.log('      · 只 pop 不还原 used → 后面的分支会以为元素"已经被用过"，解会变少；');
  console.log('      · 还原 used 但忘了 pop → path 越来越长，解会变多且错乱。');
  console.log('    写回溯时建议养成习惯：凡是"进入递归前改过的状态"，出递归后逐一还原。');
}
console.log('');

console.log('【指数增长有多可怕】回溯的复杂度是乘法级的，规模稍微大一点就跑不动了：');
console.log('');
{
  const stats = [10, 15, 18, 20];
  console.log('    n'.padEnd(8) + '子集个数 2ⁿ'.padEnd(26) + '排列个数 n!'.padEnd(30) + 'n 皇后的解数');
  console.log('    ' + '-'.repeat(88));
  const fact = (k) => {
    let f = 1;
    for (let i = 2; i <= k; i++) f *= i;
    return f;
  };
  for (const n of stats) {
    const sub = 2 ** n;
    console.log(
      '    ' + String(n).padEnd(8) +
        sub.toLocaleString('en-US').padEnd(26) +
        fact(n).toLocaleString('en-US').padEnd(30) +
        '—',
    );
  }
  console.log('');
  console.log('    n = 20 时子集有 104 万，n = 25 就变成 3355 万，n = 30 已经 10 亿 ——');
  console.log('    所以回溯题的 n 一般不超过 20。看到 n ≤ 20 的题目，第一反应就该是"回溯或状压 DP"。');
}
console.log('');
console.log('  实测：三种枚举在中等规模下的耗时（只统计个数，不保存结果）');
{
  const countSubsets = (n) => {
    let count = 0;
    const rec = (i) => {
      if (i === n) {
        count += 1;
        return;
      }
      rec(i + 1);
      rec(i + 1);
    };
    rec(0);
    return count;
  };
  const countPerms = (n) => {
    let count = 0;
    const used = new Array(n).fill(false);
    let depth = 0;
    const rec = () => {
      if (depth === n) {
        count += 1;
        return;
      }
      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        used[i] = true;
        depth += 1;
        rec();
        depth -= 1;
        used[i] = false;
      }
    };
    rec();
    return count;
  };
  const subMs = medianMs(() => {
    sink.value = countSubsets(20);
  });
  const permMs = medianMs(() => {
    sink.value = countPerms(9);
  });
  console.log('');
  console.log(`    子集 n = 20（2²⁰ = 1,048,576 个叶子）    耗时 ${subMs.toFixed(2)} ms`);
  console.log(`    排列 n = 9（9! = 362,880 个叶子）        耗时 ${permMs.toFixed(2)} ms`);
  console.log('');
  console.log(`    把排列换成 n = 10（10! = 3,628,800，叶子数约 3.5 倍）耗时会涨到 100 ms 以上 ——`);
  console.log('    注意排列 n = 9 和子集 n = 20 的叶子数在同一量级，耗时也差不多，');
  console.log('    回溯的耗时基本只由"决策树有多少个节点"决定，与题目本身无关。');
  console.log('    所以估算回溯能不能跑，就看决策树的规模：10⁶~10⁷ 一般没问题，10⁸ 就得剪枝了。');
}

// ---------------------------------------------------------------------------
// 3. 带剪枝的回溯：组合总和
// ---------------------------------------------------------------------------

console.log('\n--- 3. 剪枝实战：组合总和（LeetCode 39 的简化版）---');
console.log('');
console.log('题目：从 candidates 里挑数字（可重复使用），使它们的和等于 target，列出所有组合。');
console.log('');
console.log('  例子：candidates = [2, 3, 6, 7]，target = 7');
console.log('  答案：[[2,2,3], [7]]');
console.log('');
console.log('  决策树（每个节点选一个数往后加，和超过 target 就剪枝）：');
console.log('');
console.log('                        剩余 7');
console.log('        ┌──────────┬──────────┬──────────┐');
console.log('       +2         +3         +6         +7');
console.log('        剩 5       剩 4       剩 1       剩 0 ✓ → [7]');
console.log('     ┌──┼──┐    ┌──┼──┐    （已无解，剪掉）');
console.log('    +2 +3 +6  +2 +3 +6');
console.log('    剩3 剩2 超  剩2 剩1 超');
console.log('     │   ✗  ✗   │   ✗  ✗');
console.log('    +2         +2');
console.log('    剩1         剩0 ✓ → [3,2,2]');
console.log('     ✗');
console.log('');
console.log('  两条剪枝规则（都要先把数组【排序】才好用）：');
console.log('    ① 和已经超过 target → 整个子树都不可能有解，直接 return（可行性剪枝）；');
console.log('    ② 因为数组有序，当前数已经让和超标 → 后面的数只会更大，直接 break。');

/**
 * 组合总和（数字可重复使用）。
 *
 * prune = true ：先排序，循环里发现 v > remain 就 break（整轮都停）—— 剪枝版
 * prune = false：不排序，也不在循环里拦，而是"先加进去、递归进去之后再发现超了"
 *                —— 这是最朴素的写法，也是绝大多数人第一次写出来的版本
 *
 * 两种写法的答案完全一样，但访问的节点数差别很大：剪枝版【根本不会创建】
 * 那些"和已经超标"的子节点，而不剪枝版会老老实实把它们创建出来再回头。
 *
 * @param {number[]} candidates 候选数字
 * @param {number} target 目标和
 * @param {boolean} prune 是否启用剪枝（用于对比剪枝的效果）
 */
function combinationSum(candidates, target, prune = true) {
  const result = [];
  const path = [];
  const sorted = prune ? [...candidates].sort((a, b) => a - b) : [...candidates];
  let nodes = 0; // 统计访问了多少个决策树节点，用来量化剪枝效果

  const backtrack = (start, remain) => {
    nodes += 1;
    if (remain === 0) {
      result.push([...path]);
      return;
    }
    if (remain < 0) return; // 不剪枝时只能靠这里"事后发现"—— 节点已经创建出来了
    for (let i = start; i < sorted.length; i++) {
      const v = sorted[i];
      // ★ 剪枝：数组已经有序，v 都超标了，后面的数只会更大 → 整轮都可以停
      if (prune && v > remain) break;
      path.push(v);
      backtrack(i, remain - v); // ★ 传 i（不是 i+1）：同一个数字可以重复使用
      path.pop();
    }
  };
  backtrack(0, target);
  return { result, nodes };
}

{
  const candidates = [2, 3, 6, 7];
  const target = 7;
  const on = combinationSum(candidates, target, true);
  const off = combinationSum(candidates, target, false);
  console.log('');
  console.log(`  candidates = [${candidates.join(', ')}], target = ${target}`);
  console.log(`  启用剪枝：${on.result.map((c) => `[${c.join(',')}]`).join('  ')}   访问了 ${on.nodes} 个节点`);
  console.log(`  关闭剪枝：${off.result.map((c) => `[${c.join(',')}]`).join('  ')}   访问了 ${off.nodes} 个节点`);
  console.log(`  两者结果一致：${JSON.stringify(on.result) === JSON.stringify(off.result) ? '是 ✓' : '否 ✗'}`);
  console.log('');
  console.log('  ★ 注意"传 i 还是 i+1"这个细节：');
  console.log('    · 组合总和（数字可重复用）→ 传 i，下一层还能再选自己；');
  console.log('    · 普通组合（每个元素只能用一次）→ 传 i+1。');
  console.log('    这是回溯题最常见的"一字之差，答案全错"。');
}

console.log('');
console.log('  剪枝的效果到底有多大？换一组更"极端"的数据实测：');
{
  const candidates = [];
  for (let i = 1; i <= 25; i++) candidates.push(i);
  const target = 40;
  const pruneMs = medianMs(() => {
    sink.value = combinationSum(candidates, target, true).nodes;
  });
  const noPruneMs = medianMs(() => {
    sink.value = combinationSum(candidates, target, false).nodes;
  });
  const pruneNodes = combinationSum(candidates, target, true).nodes;
  const noPruneNodes = combinationSum(candidates, target, false).nodes;
  console.log('');
  console.log(`    candidates = [1..25]，target = 40`);
  console.log('');
  console.log('    做法'.padEnd(26) + '访问的节点数'.padEnd(20) + '耗时(ms)');
  console.log('    ' + '-'.repeat(64));
  console.log('    不剪枝'.padEnd(24) + noPruneNodes.toLocaleString('en-US').padEnd(20) + noPruneMs.toFixed(2));
  console.log('    剪枝（排序 + break）'.padEnd(18) + pruneNodes.toLocaleString('en-US').padEnd(20) + pruneMs.toFixed(2));
  console.log('');
  console.log(`    剪枝把访问的节点数从 ${noPruneNodes.toLocaleString('en-US')} 降到 ${pruneNodes.toLocaleString('en-US')}`);
  console.log(`    （约 ${(noPruneNodes / pruneNodes).toFixed(1)} 分之一），耗时降到约 ${(noPruneMs / pruneMs).toFixed(1)} 分之一。`);
  console.log('');
  console.log('  ★ 两个降幅不一致很正常：被剪掉的那些节点【本来就是最浅的节点】');
  console.log('    （刚超标的叶子），访问它们的代价很轻。所以"节点数少了 12 倍"');
  console.log('    通常只换来"耗时少了 2~3 倍"。这也提醒我们：');
  console.log('    优化要看【省掉的代价】而不只是【省掉的次数】。');
  console.log('');
  console.log('  ★ 但请记住：剪枝改变的是【常数和实际规模】，不改变复杂度的量级。');
  console.log('    上面两种情况的最坏复杂度都是指数级的 —— 只是剪枝让指数底数变小了。');
  console.log('    如果 n 继续变大，剪枝过的版本一样会跑不动。');
}

// ---------------------------------------------------------------------------
// 4. N 皇后
// ---------------------------------------------------------------------------

console.log('\n--- 4. N 皇后：回溯的"毕业设计" ---');
console.log('');
console.log('在 N×N 的棋盘上放 N 个皇后，要求任意两个都不在同一行、同一列、同一对角线。');
console.log('');
console.log('  4 皇后问题的一个解（Q = 皇后，· = 空格）：');
console.log('');
console.log('       列: 0 1 2 3');
console.log('    行 0:  · Q · ·');
console.log('    行 1:  · · · Q');
console.log('    行 2:  Q · · ·');
console.log('    行 3:  · · Q ·');
console.log('');
console.log('  ★ 关键建模技巧：我们【一行一行地放】。');
console.log('    既然每行只能有一个皇后，"同一行冲突"这个约束就自动满足了 ——');
console.log('    于是决策树的第 i 层就是"第 i 行的皇后放在哪一列"，每层最多 N 个分支。');
console.log('    这就是"如何用更聪明的建模把约束消掉一个"的典型案例。');
console.log('');
console.log('  剩下的两个约束用三个集合来判：');
console.log('    · cols[c]      —— 第 c 列有没有被占');
console.log('    · diag1[r+c]   —— 主对角线（↘ 方向）有没有被占');
console.log('    · diag2[r-c+n] —— 副对角线（↙ 方向）有没有被占（加 n 是为了避免负下标）');
console.log('');
console.log('  为什么是 r+c 和 r-c？因为在同一条 ↘ 对角线上的格子，行列之和是常数；');
console.log('  在同一条 ↙ 对角线上的格子，行列之差是常数：');
console.log('');
console.log('     ↘ 对角线（r+c 相同）              ↙ 对角线（r-c 相同）');
console.log('       0 1 2 3                          0 -1 -2 -3');
console.log('       1 2 3 4                          1  0 -1 -2');
console.log('       2 3 4 5                          2  1  0 -1');
console.log('       3 4 5 6                          3  2  1  0');
console.log('');

/**
 * N 皇后求解器。
 *
 * @param {number} n 棋盘大小
 * @param {boolean} collect 是否保存棋盘的完整布局（只要计数时可以关掉，省内存）
 */
function solveNQueens(n, collect = true) {
  const solutions = [];
  const queens = new Array(n).fill(-1); // queens[r] = 第 r 行皇后所在的列
  const cols = new Array(n).fill(false);
  const diag1 = new Array(2 * n).fill(false); // r + c
  const diag2 = new Array(2 * n).fill(false); // r - c + n
  let nodes = 0;

  const backtrack = (row) => {
    nodes += 1;
    if (row === n) {
      if (collect) solutions.push([...queens]);
      else solutions.push(null);
      return;
    }
    for (let col = 0; col < n; col++) {
      const d1 = row + col;
      const d2 = row - col + n;
      // ← 这里就是剪枝：任何一个约束不满足，这个分支立刻砍掉
      if (cols[col] || diag1[d1] || diag2[d2]) continue;

      queens[row] = col; // ① 选择
      cols[col] = true;
      diag1[d1] = true;
      diag2[d2] = true;

      backtrack(row + 1); // ② 递归

      queens[row] = -1; // ③ 撤销（四个状态逐一还原）
      cols[col] = false;
      diag1[d1] = false;
      diag2[d2] = false;
    }
  };
  backtrack(0);
  return { solutions, nodes };
}

console.log('');
console.log('  4 皇后的全部解：');
{
  const { solutions } = solveNQueens(4);
  console.log(`  共 ${solutions.length} 个解（这个问题著名的答案是 2）：`);
  for (const sol of solutions) {
    console.log('');
    for (let r = 0; r < 4; r++) {
      let line = '      ';
      for (let c = 0; c < 4; c++) line += sol[r] === c ? 'Q ' : '· ';
      console.log(line);
    }
  }
  console.log('');
  console.log('  注意两个解互为【镜像】—— 题目通常把它们算作不同的解。');
}
console.log('');
console.log('  各规模下的解数与实测耗时（含剪枝）：');
console.log('');
{
  console.log('    N'.padEnd(8) + '解的个数'.padEnd(14) + '搜索树节点数'.padEnd(18) + '耗时(ms)');
  console.log('    ' + '-'.repeat(56));
  for (const n of [4, 6, 8, 10, 11]) {
    const { solutions, nodes } = solveNQueens(n, false);
    const ms = medianMs(() => {
      sink.value = solveNQueens(n, false).solutions.length;
    });
    console.log(
      '    ' + String(n).padEnd(8) + String(solutions.length).padEnd(14) + String(nodes).padEnd(18) + ms.toFixed(3),
    );
  }
  console.log('');
  console.log('  ★ 看 N=8 那一行：8! = 40320 种"每行放一个"的摆法，');
  console.log('    但实际只访问了 2000 个出头的节点 —— 绝大多数分支在"第 2、3 行"就被剪掉了。');
  console.log('    这就是约束满足问题的典型形态：搜索树的【上界】是指数级，');
  console.log('    但剪枝让实际访问的节点数远小于上界。');
  console.log('');
  console.log('  ★ 但注意 N 继续变大时增长依然很快（N=11 要访问 16 万个节点，耗时两位数毫秒）：');
  console.log('    N 皇后是"约束满足"问题，最坏复杂度仍然是指数级的，剪枝只是让它能撑到 N=12 左右。');
  console.log('    真要提高规模得用位运算加速（见 16_bit_manipulation.js：用一个整数的每一位表示一列/一条对角线），');
  console.log('    或者用舞蹈链（Dancing Links）这类专门结构。');
}

// ---------------------------------------------------------------------------
// 5. 贪心：活动选择（区间调度）
// ---------------------------------------------------------------------------

console.log('\n--- 5. 贪心：每一步都选当下最好的 ---');
console.log('');
console.log('贪心的代码往往比回溯短十倍，代价是【必须能证明它对】。');
console.log('');
console.log('  题目：给你一堆活动，每个活动有开始和结束时间。');
console.log('        一个人同一时间只能参加一个活动，问【最多能参加几个】？');
console.log('');
console.log('  活动列表（按开始时间）：');
console.log('');
console.log('    时间轴:  0  1  2  3  4  5  6  7  8  9 10 11');
console.log('    A [1,4)  ███████');
console.log('    B [3,5)        ██████');
console.log('    C [0,6)  █████████████');
console.log('    D [5,7)              █████');
console.log('    E [3,9)        ██████████████');
console.log('    F [5,9)              ██████████');
console.log('    G [6,10)                 █████████');
console.log('    H [8,11)                       ███████');
console.log('');
console.log('  贪心策略的选择就是这道题的全部难点。有三种"看起来都很合理"的策略：');
console.log('');
console.log('    ① 选【开始时间最早】的 → 先选 C[0,6)，后面 6 点前的全废了 → 得 2 个 ✗');
console.log('    ② 选【持续时间最短】的 → 先选 A[1,4)，接着 D[5,7)、H[8,11) → 得 3 个');
console.log('    ③ 选【结束时间最早】的 → 选 A[1,4)，再选 D[5,7)，再选 H[8,11) → 得 3 个 ✓');
console.log('');
console.log('  ② 和 ③ 在这组数据上打平，但 ② 是【可以】被反例击倒的 —— 而且只要 4 个活动：');
console.log('');
console.log('    活动：C[0,1)   D[3,4)   B[1,3)   A[0,4)      （时长分别是 1、1、2、4）');
console.log('');
console.log('    按时长贪心的处理顺序：C(1) → D(1) → B(2) → A(4)');
console.log('      选 C[0,1) ✓ → 下一个 D[3,4)：start 3 ≥ 1 ✓ 选上 → 再看 B[1,3)：start 1 < 4 ✗ 冲突');
console.log('      结果只有 2 个，B 被 D 挡住了。');
console.log('');
{
  const tricky = [
    { name: 'C', start: 0, end: 1 },
    { name: 'D', start: 3, end: 4 },
    { name: 'B', start: 1, end: 3 },
    { name: 'A', start: 0, end: 4 },
  ];
  // 策略②：按持续时间最短贪心
  const byDuration = [...tricky].sort((a, b) => a.end - a.start - (b.end - b.start));
  const picked = [];
  let last = -Infinity;
  for (const act of byDuration) {
    if (act.start >= last) {
      picked.push(act.name);
      last = act.end;
    }
  }
  const greedyCount = picked.length;
  const optimalCount = bruteForceMaxActivities(tricky);
  const correctGreedy = activitySelection(tricky);

  console.log('    三种做法在同一组数据上的结果：');
  console.log('');
  console.log('      做法'.padEnd(34) + '选中的活动'.padEnd(20) + '个数');
  console.log('      ' + '-'.repeat(70));
  console.log('      ' + '策略② 按持续时长最短（错）'.padEnd(32) + picked.join(', ').padEnd(20) + greedyCount);
  console.log('      ' + '穷举所有子集（基准）'.padEnd(32) + '—'.padEnd(20) + optimalCount);
  console.log(
    '      ' + '策略③ 按结束时间最早（对）'.padEnd(32) +
      correctGreedy.map((a) => a.name).join(', ').padEnd(20) +
      correctGreedy.length,
  );
  console.log('');
  console.log(`    策略② 得到 ${greedyCount} 个，最优是 ${optimalCount} 个 → 反例成立 ✗；`);
  console.log(`    策略③ 得到 ${correctGreedy.length} 个，与最优一致 → 再次验证它是对的 ✓。`);
  console.log('');
  console.log('    ★ 为什么"结束最早"能赢，而"时长最短"会输？');
  console.log('      · 时长最短只看【自己占多久】，不管自己挡住了别人什么；');
  console.log('      · 结束最早看的是【留给后面的空间】—— 结束得越早，后面能塞的活动越多。');
  console.log('      一句话：贪心策略要选"对后续影响最有利"的那个指标，而不是"自己最划算"的指标。');
  console.log('      这也是 13 文件开头说的"构造反例的套路"：让局部最优占掉本可以更好的组合机会。');
}
console.log('');

/**
 * 活动选择（区间调度）—— 贪心解法。
 *
 * 策略：按【结束时间】升序排序，依次选择"开始时间不早于上一个选中活动结束时间"的活动。
 *
 * 正确性（交换论证，这是必须能说清楚的部分）：
 *   设贪心选出的第一个活动是 g（结束时间最早的活动），
 *   设某个最优解的第一个活动是 o。因为 g 的结束时间最早，所以 end(g) ≤ end(o)。
 *   现在把最优解里的 o 换成 g：g 和最优解里第二个活动冲突吗？
 *   不会 —— 因为 end(g) ≤ end(o) ≤ start(最优解第二个活动)，所以 g 与它们都不冲突。
 *   于是我们得到了一个"同样大、且第一个活动就是 g"的最优解。
 *   对剩余的区间重复同样的论证，就证明了贪心选择的每一步都包含在某个最优解里。
 *
 * 复杂度：时间 O(n log n)（排序主导），空间 O(n)（存结果）或 O(1)（只计数）。
 */
function activitySelection(activities) {
  const sorted = [...activities].sort((a, b) => a.end - b.end || a.start - b.start);
  const chosen = [];
  let lastEnd = -Infinity;
  for (const act of sorted) {
    if (act.start >= lastEnd) {
      // 和上一个选中的活动不冲突
      chosen.push(act);
      lastEnd = act.end;
    }
  }
  return chosen;
}

const demoActivities = [
  { name: 'A', start: 1, end: 4 },
  { name: 'B', start: 3, end: 5 },
  { name: 'C', start: 0, end: 6 },
  { name: 'D', start: 5, end: 7 },
  { name: 'E', start: 3, end: 9 },
  { name: 'F', start: 5, end: 9 },
  { name: 'G', start: 6, end: 10 },
  { name: 'H', start: 8, end: 11 },
];

console.log('  用策略 ③ 走一遍（先按结束时间排序）：');
console.log('');
{
  const sorted = [...demoActivities].sort((a, b) => a.end - b.end);
  console.log('    排序后：' + sorted.map((a) => `${a.name}[${a.start},${a.end})`).join('  '));
  console.log('');
  let lastEnd = -Infinity;
  console.log('    活动'.padEnd(12) + '开始时间'.padEnd(12) + '上一个结束'.padEnd(14) + '决定');
  console.log('    ' + '-'.repeat(70));
  for (const act of sorted) {
    const ok = act.start >= lastEnd;
    console.log(
      '    ' + `${act.name}[${act.start},${act.end})`.padEnd(12) +
        String(act.start).padEnd(12) +
        (lastEnd === -Infinity ? '-∞' : String(lastEnd)).padEnd(14) +
        (ok ? '✓ 选它（不冲突）' : `✗ 跳过（与上一个冲突）`),
    );
    if (ok) lastEnd = act.end;
  }
  const chosen = activitySelection(demoActivities);
  console.log('');
  console.log(`    最多能参加 ${chosen.length} 个：${chosen.map((a) => a.name).join(' → ')}`);
}

console.log('');
console.log('  ★ 但"能过这组数据"不等于正确。真正确认它对，靠的是上面注释里的【交换论证】：');
console.log('    "结束最早的活动"一定可以被换进某个最优解，所以先选它永远不会错。');
console.log('    这是贪心算法和"启发式猜测"的分界线 —— 后者只能靠测试，前者有证明。');
console.log('');

/**
 * 穷举所有子集，找出最大的互不冲突的活动集合（2ⁿ 暴力）。
 * 只用来在小规模上验证贪心的正确性 —— n 稍微大一点就跑不动了。
 */
function bruteForceMaxActivities(activities) {
  let best = 0;
  const total = 1 << activities.length;
  for (let mask = 0; mask < total; mask++) {
    const picked = [];
    for (let i = 0; i < activities.length; i++) {
      if (mask & (1 << i)) picked.push(activities[i]);
    }
    picked.sort((a, b) => a.start - b.start);
    let ok = true;
    for (let i = 1; i < picked.length; i++) {
      if (picked[i].start < picked[i - 1].end) {
        ok = false;
        break;
      }
    }
    if (ok && picked.length > best) best = picked.length;
  }
  return best;
}

console.log('  用穷举（枚举全部子集）验证贪心的正确性：');
{
  const n = 18;
  const rnd = makeRandom(31337);
  const acts = [];
  for (let i = 0; i < n; i++) {
    const s = rnd() % 100;
    acts.push({ name: `#${i}`, start: s, end: s + 1 + (rnd() % 20) });
  }

  const greedyResult = activitySelection(acts).length;
  const bruteResult = bruteForceMaxActivities(acts);
  console.log('');
  console.log(`    ${n} 个随机活动，穷举 2^${n} = ${(2 ** n).toLocaleString('en-US')} 个子集：`);
  console.log(`      贪心的答案 = ${greedyResult}`);
  console.log(`      穷举的答案 = ${bruteResult}`);
  console.log(`      一致：${greedyResult === bruteResult ? '是 ✓（贪心确实最优）' : '否 ✗'}`);
  console.log('');
  console.log('  ★ 注意这个验证方式的局限：穷举验证只能证明"在这组数据上贪心是对的"。');
  console.log('    要证明算法【总是】对的，只有数学证明（交换论证 / 归纳法）。');
  console.log('    工程实践里的做法是：先用证明说服自己，再用穷举在小规模上做回归测试。');
}

console.log('');
console.log('  实测：贪心 O(n log n) vs 穷举 O(2ⁿ)');
{
  const rnd = makeRandom(999);
  const makeActs = (count) => {
    const out = [];
    for (let i = 0; i < count; i++) {
      const s = rnd() % 100000;
      out.push({ name: `#${i}`, start: s, end: s + 1 + (rnd() % 100) });
    }
    return out;
  };
  const small = makeActs(16);
  const big = makeActs(50000);

  const greedySmallMs = medianMs(() => {
    sink.value = activitySelection(small).length;
  });
  const greedyBigMs = medianMs(() => {
    sink.value = activitySelection(big).length;
  });
  // 穷举版很慢，只采一个样本（预热一次 + 采样一次）
  const bruteSmallMs = medianMs(() => {
    sink.value = bruteForceMaxActivities(small);
  }, 1);
  console.log('');
  console.log('    算法'.padEnd(30) + 'n = 16'.padEnd(18) + 'n = 50000'.padEnd(18) + '复杂度');
  console.log('    ' + '-'.repeat(88));
  console.log(
    '    穷举枚举子集'.padEnd(28) + `${bruteSmallMs.toFixed(2)} ms`.padEnd(18) + '不可能完成'.padEnd(18) + 'O(2ⁿ)',
  );
  console.log(
    '    贪心（按结束时间排序）'.padEnd(22) +
      `${greedySmallMs.toFixed(3)} ms`.padEnd(18) +
      `${greedyBigMs.toFixed(2)} ms`.padEnd(18) +
      'O(n log n)',
  );
  console.log('');
  console.log(`    即便在 n = 16 这么小的规模上，贪心也比穷举快约 ${(bruteSmallMs / greedySmallMs).toFixed(0)} 倍；`);
  console.log(`    而 n 涨到 50000（约 3125 倍）时，贪心只用 ${greedyBigMs.toFixed(2)} ms，穷举则连 2ⁿ 个子集都枚举不完。`);
  console.log('    这就是多项式算法和指数算法的分水岭：一个还在慢慢涨，另一个早已彻底不可用。');
}

// ---------------------------------------------------------------------------
// 6. 贪心什么时候错：0-1 背包与找零钱
// ---------------------------------------------------------------------------

console.log('\n--- 6. 构造反例：证明贪心不成立 ---');
console.log('');
console.log('要否定一个贪心策略，只需要【一个反例】。构造反例有个通用套路：');
console.log('');
console.log('    让"局部最优"的选择占掉一个位置，而这个位置如果留给别的组合会更好。');
console.log('');
console.log('【反例一】0-1 背包：每个物品只能拿或不拿，背包有承重上限，求价值最大。');
console.log('');
console.log('  物品（重量, 价值, 单位价值 = 价值/重量）：');
console.log('');
console.log('    物品'.padEnd(10) + '重量'.padEnd(8) + '价值'.padEnd(8) + '单位价值');
console.log('    ' + '-'.repeat(44));
for (const [name, w, v] of [
  ['金块', 10, 60],
  ['银块', 20, 100],
  ['铜块', 30, 120],
]) {
  console.log('    ' + name.padEnd(8) + String(w).padEnd(8) + String(v).padEnd(8) + (v / w).toFixed(2));
}
console.log('');
console.log('  背包容量 = 50。最自然的贪心策略是"先拿单位价值最高的"（金块 6.00 最划算）：');
console.log('');
console.log('    贪心：先拿金块(10,60) → 剩容量 40 → 再拿银块(20,100) → 剩容量 20，铜块放不下');
console.log('          总价值 = 60 + 100 = 160，用掉容量 30');
console.log('');
console.log('    最优：拿银块 + 铜块 = 100 + 120 = 220，正好用满容量 50');
console.log('');
console.log('  ★ 贪心拿的 160 < 最优的 220 —— 贪心当场翻车！');
console.log('    原因：金块虽然"每千克最值钱"，但它占了 10 的容量却只贡献 60 的价值，');
console.log('    而这个容量如果留给"银+铜"的组合，整体会多赚 60。');
console.log('    ★ 这就是 0-1 背包和"分数背包"的分水岭 —— 见下面的对比。');
console.log('');

/** 0-1 背包：穷举所有子集（2ⁿ），用于构造/验证反例 */
function knapsackBruteForce(items, capacity) {
  let bestValue = 0;
  let bestSet = [];
  const total = 1 << items.length;
  for (let mask = 0; mask < total; mask++) {
    let w = 0;
    let v = 0;
    const picked = [];
    for (let i = 0; i < items.length; i++) {
      if (mask & (1 << i)) {
        w += items[i].weight;
        v += items[i].value;
        picked.push(items[i].name);
      }
    }
    if (w <= capacity && v > bestValue) {
      bestValue = v;
      bestSet = picked;
    }
  }
  return { bestValue, bestSet };
}

/** 0-1 背包：按"单位价值"贪心（错误示范） */
function knapsackGreedyByRatio(items, capacity) {
  const sorted = [...items].sort((a, b) => b.value / b.weight - a.value / a.weight);
  let w = 0;
  let v = 0;
  const picked = [];
  for (const item of sorted) {
    if (w + item.weight <= capacity) {
      w += item.weight;
      v += item.value;
      picked.push(item.name);
    }
  }
  return { bestValue: v, bestSet: picked, usedWeight: w };
}

/** 分数背包：物品可以切开拿（这时"单位价值"贪心就是对的） */
function fractionalKnapsack(items, capacity) {
  const sorted = [...items].sort((a, b) => b.value / b.weight - a.value / a.weight);
  let remain = capacity;
  let v = 0;
  const picked = [];
  for (const item of sorted) {
    if (remain <= 0) break;
    const take = Math.min(item.weight, remain);
    v += (item.value / item.weight) * take;
    picked.push(`${item.name}×${take}`);
    remain -= take;
  }
  return { value: v, picked };
}

{
  const items = [
    { name: '金块', weight: 10, value: 60 },
    { name: '银块', weight: 20, value: 100 },
    { name: '铜块', weight: 30, value: 120 },
  ];
  const capacity = 50;
  const greedy = knapsackGreedyByRatio(items, capacity);
  const optimal = knapsackBruteForce(items, capacity);
  const frac = fractionalKnapsack(items, capacity);

  console.log('  用程序实测这三件事：');
  console.log('');
  console.log(`    ① 贪心（按单位价值）：${greedy.bestSet.join(' + ')} → 价值 ${greedy.bestValue}，用容量 ${greedy.usedWeight}`);
  console.log(`    ② 穷举（2³ = 8 种拿法）：${optimal.bestSet.join(' + ')} → 价值 ${optimal.bestValue}   ★ 这才是 0-1 背包的最优解`);
  console.log(`    ③ 同一组数据，若物品【可以切开】（分数背包），贪心得：${frac.picked.join(', ')} → 价值 ${frac.value}`);
  console.log('');
  console.log(`    0-1 背包里贪心比最优少了 ${optimal.bestValue - greedy.bestValue} 的价值 —— 反例成立 ✗`);
  console.log(`    分数背包里贪心拿到了 ${frac.value} —— 这已经是理论最优，贪心成立 ✓`);
  console.log('');
  console.log('  ★★ 这是本文件最值得记住的一个对照：');
  console.log('     【同一批物品、同样的贪心策略】，只因为"能不能切开"这一个条件不同，');
  console.log('     一个场景下贪心完全正确，另一个场景下贪心直接错掉。');
  console.log('     为什么？因为分数背包里"拿一部分"这个动作让选择变得【可分】了 ——');
  console.log('     你可以先装满金块、再装银块、最后按比例装一点铜块；');
  console.log('     而 0-1 背包里物品不可分，"拿不拿"是【离散】决策，');
  console.log('     一次"局部划算"的取舍可能让剩余容量白白浪费掉。');
  console.log('');
  console.log('     所以判断贪心能不能用，有一条非常实用的经验：');
  console.log('       【可分的资源 → 常常可以贪心；离散的选择 → 十有八九要 DP】。');
  console.log('');
  console.log('     顺带说：0-1 背包的正确解法是动态规划（见 10_dynamic_programming.js），');
  console.log('     而分数背包的贪心解法本身就是一个"完整且正确"的多项式算法 ——');
  console.log('     所以它并不是"错的贪心"，而是"对的问题配对的贪心"。');
}

console.log('');
console.log('【反例二】找零钱：用面额尽可能少的硬币凑出金额。');
console.log('');
console.log('  贪心策略：每次尽量用面额最大的硬币。这在很多国家的币值体系下是对的，');
console.log('  但【只要币值选得刁钻一点】就会翻车：');
console.log('');
{
  const coins = [1, 3, 4];

  /** 贪心找零：每次拿不超过剩余金额的最大面额 */
  function greedyChange(coins, amount) {
    const sorted = [...coins].sort((a, b) => b - a);
    const used = [];
    let remain = amount;
    for (const c of sorted) {
      while (remain >= c) {
        remain -= c;
        used.push(c);
      }
    }
    return { count: used.length, used, remain };
  }

  /** 正确找零：DP（自底向上，dp[i] = 凑出 i 的最少硬币数） */
  function dpChange(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    const from = new Array(amount + 1).fill(-1);
    dp[0] = 0;
    for (let i = 1; i <= amount; i++) {
      for (const c of coins) {
        if (c <= i && dp[i - c] + 1 < dp[i]) {
          dp[i] = dp[i - c] + 1;
          from[i] = c;
        }
      }
    }
    // 从 DP 表倒推方案 —— 【注意：这就是 10 里那种"回溯 dp 表"，不是本文件的搜索式回溯】
    const used = [];
    let cur = amount;
    while (cur > 0 && from[cur] !== -1) {
      used.push(from[cur]);
      cur -= from[cur];
    }
    return { count: dp[amount], used };
  }

  console.log('    币值 = [1, 3, 4]，目标金额 = 6：');
  console.log('');
  for (const amount of [6, 8, 9, 11]) {
    const g = greedyChange(coins, amount);
    const d = dpChange(coins, amount);
    const mark = g.count === d.count ? '✓ 一致' : '✗ 贪心更差';
    console.log(
      `      金额 ${String(amount).padStart(2)}：贪心 ${g.used.join('+')} = ${g.count} 枚   ` +
        `最优 ${d.used.join('+')} = ${d.count} 枚   ${mark}`,
    );
  }
  console.log('');
  console.log('    金额 6 就是那个著名反例：贪心先拿 4，剩 2 只能拿两个 1 → 3 枚；');
  console.log('    而 3 + 3 只要 2 枚。贪心"这一步看起来最省"的选择，把后面的路堵死了。');
  console.log('');
  console.log('  ★ 一个有意思的事实：人民币 / 美元这套币值（1,5,10,25…）下贪心恰好总是最优的，');
  console.log('    这叫"规范币值系统"。所以"贪心对不对"取决于【输入的结构】，');
  console.log('    而证明一般性的币值是 NP 难问题 —— 这也是为什么工程上找零钱直接上 DP。');
  console.log('');
  console.log('  ★ 最后再看一眼 dpChange 里"从 DP 表倒推方案"那段代码：');
  console.log('    它顺着 from[] 数组一路往回走，O(amount) 就走完了，没有任何"试错"和"撤销"。');
  console.log('    再对比本文件前面 N 皇后、全排列那些代码 —— 那才叫搜索式回溯。');
  console.log('    同一个中文词，两种完全不同的算法，这就是本文件开头那段术语澄清的意义。');
}

// ---------------------------------------------------------------------------
// 7. 选型决策表
// ---------------------------------------------------------------------------

console.log('\n--- 7. 回溯 / 贪心 / DP：到底该用哪个 ---');
console.log('');
console.log('  思想'.padEnd(14) + '本质'.padEnd(40) + '什么时候用'.padEnd(34) + '复杂度');
console.log('  ' + '-'.repeat(108));
for (const [name, essence, when, complexity] of [
  ['搜索式回溯', '在决策树上 DFS + 撤销，穷举所有可能', '要枚举【所有方案】，或 n 很小（≤20）', 'O(指数) 2ⁿ / n!'],
  ['倒推 DP 表', '在已知的 DP 表上走一条确定的路径', 'DP 已算出最优值，想还原【这一个】方案', 'O(n + m) 多项式'],
  ['贪心', '每步选局部最优，且从不回头', '能证明"局部最优 ⊆ 全局最优"（交换论证）', 'O(n log n) 常见'],
  ['动态规划', '记录子问题答案，避免重复计算', '有最优子结构 + 重叠子问题', 'O(n²) / O(n×C) 多项式'],
  ['分治', '子问题互不重叠，各自独立求解', '归并排序、快速排序、大整数乘法', 'O(n log n) 常见'],
]) {
  console.log('  ' + name.padEnd(12) + essence.padEnd(42) + when.padEnd(36) + complexity);
}
console.log('');
console.log('  做题时按这个顺序自问：');
console.log('');
console.log('    ① 题目要"最优值"还是"所有方案"？');
console.log('         要所有方案 → 回溯（这题没得选）');
console.log('         只要最优值 → 继续往下问');
console.log('');
console.log('    ② 我能不能证明"每一步都选局部最优"不会有损失？');
console.log('         能证明 → 贪心（最快，O(n log n)）');
console.log('         证不出来 → 继续往下问');
console.log('');
console.log('    ③ n 有多大？');
console.log('         n ≤ 20 → 回溯 / 状压 DP（见 17）都行，哪个好写用哪个');
console.log('         n 很大 → 只能是 DP / 二分 / 数学结论');
console.log('');
console.log('    ④ 状态怎么定义？子问题重不重叠？');
console.log('         重叠 + 最优子结构 → DP（见 10 和 17）');
console.log('         不重叠 → 分治');
console.log('');
console.log('  ★ 最容易犯的错：n ≤ 20 时硬套 DP/贪心，n 很大时还想着回溯。');
console.log('    先看数据范围，再选算法 —— 比赛里这一条能省下大量时间。');

// ---------------------------------------------------------------------------
// 8. 复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 8. 本文件各算法的复杂度对照 ---');
console.log('');
console.log('算法'.padEnd(28) + '时间'.padEnd(24) + '空间'.padEnd(18) + '说明');
console.log('-'.repeat(104));
for (const [algo, time, space, note] of [
  ['子集枚举（回溯）', 'O(n × 2ⁿ)', 'O(n)', '2ⁿ 个叶子，每个叶子拷贝一份路径'],
  ['组合 C(n,k)（回溯）', 'O(k × C(n,k))', 'O(k)', '加上"剩余不够"的剪枝后更小'],
  ['全排列（回溯）', 'O(n × n!)', 'O(n)', 'n! 个叶子，拷贝长度 n'],
  ['组合总和（剪枝）', 'O(指数) 但实际小得多', 'O(target)', '剪枝不改变量级，只改变常数'],
  ['N 皇后（回溯 + 剪枝）', 'O(n!) 上界', 'O(n)', '实际访问节点数远小于 n!'],
  ['活动选择（贪心）', 'O(n log n)', 'O(n) 或 O(1)', '排序主导，其余是线性扫描'],
  ['0-1 背包', 'O(n × C) DP / O(2ⁿ) 穷举', 'O(C) / O(n)', '贪心会错，必须 DP（见 10）'],
  ['分数背包（贪心）', 'O(n log n)', 'O(1)', '按单位价值排序后线性取，贪心正确 ★'],
  ['找零钱（DP）', 'O(amount × 硬币数)', 'O(amount)', '贪心只在"规范币值系统"下正确'],
]) {
  console.log(algo.padEnd(26) + time.padEnd(26) + space.padEnd(20) + note);
}

console.log('');
console.log('一句话总结：');
console.log('  · 回溯的框架永远是"选择 → 递归 → 撤销"，写错的地方几乎都在"撤销"那一步；');
console.log('  · 剪枝不改变复杂度量级，但它常常把能跑的规模提高一两个数量级，性价比极高；');
console.log('  · 贪心最快、最好写，但它是唯一一个【错了还照样给出答案】的思想 ——');
console.log('    所以用贪心之前，一定要能说出那句"为什么局部最优不会吃亏"；');
console.log('  · 证明不了就想反例，构造反例的套路是"让局部最优占掉本可以更好的组合机会"；');
console.log('  · 0-1 背包与分数背包那组对照，是"离散 vs 可分"这个判断标准最好的注解；');
console.log('  · 最后别忘了本文件开头那段术语澄清：本文件的"回溯"是搜索式回溯，');
console.log('    和 10_dynamic_programming.js 里"回溯 dp 表倒推方案"不是一回事。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
