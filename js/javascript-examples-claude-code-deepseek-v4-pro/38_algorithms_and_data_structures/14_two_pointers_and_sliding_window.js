/**
 * ============================================================================
 * 知识点：双指针与滑动窗口 —— 把 O(n²) 降成 O(n) 的两个通用模板
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】进阶
 * 【前置知识】38_algorithms_and_data_structures/02_linked_list.js
 *            38_algorithms_and_data_structures/03_stack_and_queue.js（双端队列）
 *            38_algorithms_and_data_structures/09_searching_algorithms.js（二分）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    双指针不是一种数据结构，而是一大类"用两个下标在序列上移动"的技巧。
 *    它的共同目标是：避免"把所有 (i, j) 组合都试一遍"这种 O(n²) 的暴力做法。
 *
 *    按两个指针的移动方式，分成三大类（本文件逐个讲）：
 *
 *      ① 对撞指针（左右夹逼）：一个从头、一个从尾，相向而行，相遇即结束
 *
 *            lo →                    ← hi
 *            [1, 3, 4, 6, 8, 11]
 *            两边根据比较结果决定"该动左边还是右边"
 *
 *      ② 快慢指针（同向不同速）：都从头出发，一个走得快、一个走得慢
 *
 *            slow →        快指针每步走 2，慢指针每步走 1
 *            fast ────────→
 *            [a, b, c, d, e, f]
 *            用途：判断链表有没有环、找中点、找倒数第 k 个
 *
 *      ③ 滑动窗口（一前一后的一段区间）：right 负责扩张，left 负责收缩
 *
 *            left ──→  ┌─────────┐ ←── right
 *                      [ 窗口内的元素 ]
 *            窗口始终是"以 right 结尾的、满足条件的那个区间"
 *
 * 2. 为什么需要（真实项目场景）
 *    · 字符串处理：找最长不重复子串（编辑器的"当前单词高亮"）、
 *      最小覆盖子串（日志里抓一段包含若干关键字的上下文）；
 *    · 限流与监控：统计"最近 60 秒的请求数"就是一个定长滑动窗口 ——
 *      这是所有网关限流算法（滑动窗口计数）的基础；
 *    · 时间序列分析：计算股价的 5 日均线、传感器数据的滑动平均；
 *    · 数组/链表处理：有序数组求两数之和（对撞）、链表判环与找中点（快慢）、
 *      原地删除重复元素（快慢指针，不用额外空间）；
 *    · 滑动窗口最大值：实时计算"最近 k 个数据里的最大值"（监控告警、信号处理）；
 *    · 双指针在工程里还常用于归并两个有序流（多路归并的基础）。
 *
 * 3. 核心语法要点 / 算法思想
 *    · 双指针之所以能从 O(n²) 降到 O(n)，靠的是【单调性】：
 *      每一步都能排除掉一整批不可能的组合，而不是只排除一个。
 *      对撞指针：有序数组里 a[lo] + a[hi] < target，说明 a[lo] 配谁都不够大
 *                （连最大的 a[hi] 都不够），于是 a[lo] 这个元素可以【整个扔掉】，lo++；
 *                这一下排除的不是一个组合，而是"a[lo] 与右边所有元素"的一整行。
 *    · 滑动窗口成立的前提是【窗口的合法性关于 left 单调】：
 *      如果 [left, right] 不合法，那么 [left-1, right] 也一定不合法
 *      （窗口越大越不合法）。满足这个性质，才能"right 只管往右扩、left 只管往右收"，
 *      两个指针各自都只走 n 步，合计 O(n)。
 *    · 三种模板的代码骨架：
 *
 *        对撞：while (lo < hi) { 比较 → lo++ 或 hi-- 或 命中返回 }
 *        快慢：while (fast && fast.next) { slow = slow.next; fast = fast.next.next }
 *        滑窗：for (right = 0..n-1) { 加入 s[right]; while (不合法) { 移出 s[left]; left++ } 更新答案 }
 *
 * 4. 常见陷阱
 *    - 陷阱一：对撞指针用在【无序】数组上。两数之和的"夹逼"必须建立在有序的前提上，
 *      否则"a[lo] 太小所以 a[lo] 整个作废"这个推理不成立，答案会漏。
 *      （哈希表解法不要求有序，这也是它更通用的原因。）
 *    - 陷阱二：滑窗里用 while 还是 if 收缩，取决于题目要"最长"还是"最短"：
 *        求最长合法窗口 → 用 while 保证窗口重新变合法；
 *        求最短合法窗口 → 一旦合法就立刻收缩并记录，条件用 while 收缩到不合法为止。
 *      写反了不会报错，只会悄悄给出错误答案。
 *    - 陷阱三：更新答案的时机。滑窗的答案必须在"right 扩张完、窗口已合法"时更新，
 *      在 while 收缩过程中更新会漏掉一些窗口。
 *    - 陷阱四：快慢指针判环时忘记判 fast.next 是否为 null，
 *      直接访问 fast.next.next 会在偶数长度链表上抛 TypeError。
 *    - 陷阱五：滑动窗口最大值用普通遍历（每次取 max）又变成 O(nk)。
 *      必须用【单调双端队列】，否则这个技巧等于没学。
 *    - 陷阱六：单调队列里存了"值"而不是"下标"，结果无法判断队首有没有滑出窗口。
 *    - 陷阱七：以为滑窗（或双指针）对所有区间问题都适用。
 *      它只适用于"窗口越大越不合法"这类单调场景；遇到求最大子数组和（有负数）这种
 *      不满足单调性的问题，应该用 DP（见 10）而不是滑窗。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/14_two_pointers_and_sliding_window.js
 *
 * 【预期输出】
 *   打印 8 个小节：双指针三兄弟总览、对撞指针（两数之和与回文判断，含暴力对比实测）、
 *   三数之和、快慢指针（判环／找中点／找环入口）、滑动窗口（定长与不定长，含暴力对比实测）、
 *   滑动窗口最大值（单调双端队列，含暴力对比实测）、
 *   以及复杂度对照表与模板速查。
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
// 1. 对撞指针：两数之和
// ---------------------------------------------------------------------------

console.log('--- 1. 对撞指针①：有序数组的两数之和 ---');
console.log('');
console.log('题目：在一个【已排序】数组里找两个数，使它们的和等于 target，返回下标。');
console.log('');
console.log('  暴力思路：把所有 (i, j) 组合都试一遍，O(n²)。');
console.log('  对撞思路：既然数组有序，就可以"两头夹逼"：');
console.log('');
console.log('    target = 10, 数组 = [1, 3, 4, 6, 8, 11]');
console.log('');
console.log('    第 1 步:  lo=0(1)              hi=5(11)   1+11=12 > 10 → 太大，hi--');
console.log('              [1, 3, 4, 6, 8, 11]');
console.log('               ↑               ↑');
console.log('');
console.log('    第 2 步:  lo=0(1)          hi=4(8)       1+8=9 < 10  → 太小，lo++');
console.log('              [1, 3, 4, 6, 8, 11]');
console.log('               ↑           ↑');
console.log('');
console.log('    第 3 步:     lo=1(3)       hi=4(8)       3+8=11 > 10 → 太大，hi--');
console.log('              [1, 3, 4, 6, 8, 11]');
console.log('                  ↑        ↑');
console.log('');
console.log('    第 4 步:     lo=1(3)    hi=3(6)         3+6=9 < 10  → 太小，lo++');
console.log('              [1, 3, 4, 6, 8, 11]');
console.log('                  ↑     ↑');
console.log('');
console.log('    第 5 步:        lo=2(4) hi=3(6)         4+6=10 = 10 → 命中！');
console.log('');
console.log('  ★ 关键洞察在第 1 步：1 + 11 = 12 太大了，于是我们能断定');
console.log('    "11 和数组里任何一个数相加都太大"（因为 1 已经是最小的了），');
console.log('    所以 11 可以【整个扔掉】—— 这一下排除的不是一个组合，而是"11 配所有人"的一整行！');
console.log('    每一次移动都排除掉一整批可能性，这就是 O(n²) → O(n) 的来源。');

/**
 * 对撞指针求两数之和（要求数组已排序）。
 *
 * 时间复杂度 O(n)：lo 只增、hi 只减，总共移动 n 次。
 * 空间复杂度 O(1)：只用两个下标。
 *
 * 注意：返回的是【下标】，前提是数组已排序且元素互不相同（简化处理）。
 */
function twoSumSorted(nums, target) {
  let lo = 0;
  let hi = nums.length - 1;
  let steps = 0;
  while (lo < hi) {
    steps += 1;
    const sum = nums[lo] + nums[hi];
    if (sum === target) return { lo, hi, steps };
    if (sum < target) lo += 1; // 太小：左边这个数配谁都太小，整个扔掉
    else hi -= 1; // 太大：右边这个数配谁都不够小，整个扔掉
  }
  return { lo: -1, hi: -1, steps };
}

/** 暴力双层循环求两数之和 */
function twoSumBrute(nums, target) {
  let steps = 0;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      steps += 1;
      if (nums[i] + nums[j] === target) return { lo: i, hi: j, steps };
    }
  }
  return { lo: -1, hi: -1, steps };
}

{
  const nums = [1, 3, 4, 6, 8, 11];
  const r = twoSumSorted(nums, 10);
  console.log('');
  console.log(`  代码实测：[${nums.join(', ')}] 里找和为 10 的两个数`);
  console.log(`    对撞指针：下标 ${r.lo} 和 ${r.hi}（值 ${nums[r.lo]} + ${nums[r.hi]} = 10），只比较了 ${r.steps} 次`);
  console.log('    元素个数 n = 6，比较次数 5 次 —— 小于 n，这正是 O(n) 的样子。');
}
console.log('');
console.log('  实测：对撞指针 vs 暴力双层循环（数组规模 4000，找不到答案的最坏情况）');
{
  const n = 4000;
  const rnd = makeRandom(20240916);
  const arr = [];
  let cur = 0;
  for (let i = 0; i < n; i++) {
    cur += 1 + (rnd() % 3); // 严格递增，保证有序
    arr.push(cur);
  }
  const target = -1; // 故意找一个不存在的值，逼两种算法都跑满

  const bruteMs = medianMs(() => {
    sink.value = twoSumBrute(arr, target).steps;
  }, 2);
  const twoPointerMs = medianMs(() => {
    sink.value = twoSumSorted(arr, target).steps;
  }, 2);

  console.log('');
  console.log('    算法'.padEnd(28) + '耗时(ms)'.padEnd(14) + '比较次数'.padEnd(16) + '复杂度');
  console.log('    ' + '-'.repeat(76));
  console.log('    暴力双层循环'.padEnd(26) + bruteMs.toFixed(2).padEnd(14) + `${twoSumBrute(arr, target).steps.toLocaleString('en-US')}`.padEnd(16) + 'O(n²)');
  console.log('    对撞指针'.padEnd(26) + twoPointerMs.toFixed(2).padEnd(14) + `${twoSumSorted(arr, target).steps.toLocaleString('en-US')}`.padEnd(16) + 'O(n) ★');
  console.log('');
  console.log(`    暴力比较了约 ${twoSumBrute(arr, target).steps.toLocaleString('en-US')} 次（n²/2 = 800 万），`);
  console.log(`    对撞指针只比较了 ${twoSumSorted(arr, target).steps.toLocaleString('en-US')} 次（不到 n）—— 相差约 ${(bruteMs / twoPointerMs).toFixed(0)} 倍。`);
  console.log('');
  console.log('  ★ 但请记住对撞指针的【前提条件】：数组必须有序。');
  console.log('    如果给你的是无序数组，两种选择：');
  console.log('      · 先排序 O(n log n) 再对撞 —— 但排序会丢失原始下标；');
  console.log('      · 用哈希表（Map 存"值 → 下标"）一遍扫过去 O(n)，且不需要有序。');
  console.log('    这就是 04_hash_table.js 里讲两数之和的解法，它比双指针更通用。');
  console.log('    双指针在这里的价值是【O(1) 额外空间】—— 不额外开哈希表。');
}

console.log('');
console.log('--- 2. 对撞指针②：判断回文 ---');
console.log('');
console.log('回文判断是对撞指针最直观的应用：一个从头、一个从尾，逐个字符比对，');
console.log('只要有一对不相等就不是回文；指针相遇（或交叉）就说明全部匹配。');
console.log('');

/** 对撞指针判断回文：只比较字母和数字，忽略大小写与其它字符 */
function isPalindrome(s) {
  const isAlnum = (ch) => /[0-9a-zA-Z]/.test(ch);
  let lo = 0;
  let hi = s.length - 1;
  let comparisons = 0;
  while (lo < hi) {
    // 跳过非字母数字的字符（空格、标点）
    while (lo < hi && !isAlnum(s[lo])) lo += 1;
    while (lo < hi && !isAlnum(s[hi])) hi -= 1;
    comparisons += 1;
    if (s[lo].toLowerCase() !== s[hi].toLowerCase()) return { ok: false, comparisons };
    lo += 1;
    hi -= 1;
  }
  return { ok: true, comparisons };
}

/** 反转字符串后比较（另一种常见写法） */
function isPalindromeByReverse(s) {
  const cleaned = s.toLowerCase().replace(/[^0-9a-z]/g, '');
  return cleaned === [...cleaned].reverse().join('');
}

console.log('  同一批字符串，两种写法都必须给出相同结论：');
console.log('');
console.log('  字符串'.padEnd(46) + '对撞'.padEnd(10) + '反转比较'.padEnd(12) + '比较次数');
console.log('  ' + '-'.repeat(86));
{
  const cases = [
    'A man, a plan, a canal: Panama',
    'race a car',
    'abccba',
    'hello world',
    '12321',
    'Was it a car or a cat I saw?',
  ];
  let allMatch = true;
  for (const s of cases) {
    const a = isPalindrome(s);
    const b = isPalindromeByReverse(s);
    if (a.ok !== b) allMatch = false;
    console.log(
      '  ' + `"${s}"`.padEnd(44) + String(a.ok).padEnd(10) + String(b).padEnd(12) + a.comparisons,
    );
  }
  console.log('');
  console.log(`  两种写法结论完全一致：${allMatch ? '是 ✓' : '否 ✗'}`);
}
console.log('');
console.log('  ★ 两种写法的复杂度其实都是 O(n)，那用对撞指针的意义在哪？');
console.log('    · 反转比较会额外开一块 O(n) 的内存（cleaned 和 reverse 各一份），对撞指针是 O(1)；');
console.log('    · 更要紧的是：对撞指针能【提前返回】—— "hello world" 第 1 次比较就发现 h≠d，');
console.log('      立刻就能给答案；而反转比较必须把整个字符串处理完。');
console.log('    · 在超长字符串（比如几 MB 的日志行）上，这个"最好情况 O(1) vs 恒定 O(n)"的差别很实在。');
console.log('    算法题里常说"O(n) 都一样"，但真实工程里【最坏、平均、最好】三个数都要看。');

// ---------------------------------------------------------------------------
// 3. 三数之和
// ---------------------------------------------------------------------------

console.log('\n--- 3. 对撞指针③：三数之和（排序 + 固定一个 + 对撞两个）---');
console.log('');
console.log('题目：找出所有和为 0 的三元组（不重复）。');
console.log('  暴力：三层循环 O(n³)。');
console.log('  优化：排序后固定第一个数 a[i]，剩下的问题就变成了"在 i 右边找两数之和 = -a[i]" ——');
console.log('        正是上一节的【有序数组两数之和】！于是 O(n³) 变 O(n²)。');
console.log('');
console.log('  threeSum(nums) 的骨架：');
console.log('    nums.sort()                                   ← 排序 O(n log n)');
console.log('    for (i = 0; i < n - 2; i++) {');
console.log('      if (nums[i] > 0) break                      ← 剪枝：最小的都 > 0，和不可能为 0');
console.log('      if (i > 0 && nums[i] === nums[i-1]) continue ← 去重：同一个值只当一次"第一个数"');
console.log('      lo = i + 1, hi = n - 1');
console.log('      while (lo < hi) { ...对撞，命中后 lo++/hi-- 并跳过重复值... }');
console.log('    }');
console.log('');

/**
 * 三数之和：返回所有和为 0 的不重复三元组。
 *
 * 时间 O(n²)：外层 n 次，内层对撞总共 O(n)，排序 O(n log n) 被 n² 盖过。
 * 空间 O(1)（不计返回值；排序如果算额外空间则是 O(log n) 的递归栈）。
 */
function threeSum(nums) {
  const result = [];
  const a = [...nums].sort((x, y) => x - y);
  const n = a.length;
  for (let i = 0; i < n - 2; i++) {
    if (a[i] > 0) break; // 剪枝：三数里最小的都大于 0，和不可能等于 0
    if (i > 0 && a[i] === a[i - 1]) continue; // 去重：跳过相同的第一个数
    let lo = i + 1;
    let hi = n - 1;
    while (lo < hi) {
      const sum = a[i] + a[lo] + a[hi];
      if (sum === 0) {
        result.push([a[i], a[lo], a[hi]]);
        // 命中后两个指针都要动，并且各自跳过重复值，避免产生重复的三元组
        const loVal = a[lo];
        const hiVal = a[hi];
        while (lo < hi && a[lo] === loVal) lo += 1;
        while (lo < hi && a[hi] === hiVal) hi -= 1;
      } else if (sum < 0) {
        lo += 1;
      } else {
        hi -= 1;
      }
    }
  }
  return result;
}

/** 三数之和的暴力版（O(n³)），用于对照 */
function threeSumBrute(nums) {
  const result = [];
  const n = nums.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        if (nums[i] + nums[j] + nums[k] === 0) {
          const t = [nums[i], nums[j], nums[k]].sort((x, y) => x - y);
          if (!result.some((r) => r[0] === t[0] && r[1] === t[1] && r[2] === t[2])) result.push(t);
        }
      }
    }
  }
  return result.sort((x, y) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]);
}

{
  const cases = [
    [-1, 0, 1, 2, -1, -4],
    [0, 1, 1],
    [0, 0, 0],
    [-2, 0, 1, 1, 2],
    [1, 2, 3],
  ];
  console.log('  正确性验证（双指针版 vs 暴力版）：');
  console.log('');
  let allOk = true;
  for (const c of cases) {
    const fast = threeSum(c);
    const slow = threeSumBrute(c);
    const ok = JSON.stringify(fast) === JSON.stringify(slow);
    if (!ok) allOk = false;
    console.log(
      '    ' + `[${c.join(', ')}]`.padEnd(26) + '双指针 ' + JSON.stringify(fast).padEnd(28) + (ok ? '✓' : '✗'),
    );
  }
  console.log('');
  console.log(`  全部一致：${allOk ? '是 ✓' : '否 ✗'}`);
}
console.log('');
console.log('  实测：O(n²) vs O(n³)（n = 200 的随机数组，各跑一遍）');
{
  const n = 200;
  const rnd = makeRandom(777);
  const arr = [];
  for (let i = 0; i < n; i++) arr.push((rnd() % 200) - 100);

  const bruteMs = medianMs(() => {
    sink.value = threeSumBrute(arr).length;
  }, 1);
  const fastMs = medianMs(() => {
    sink.value = threeSum(arr).length;
  }, 2);
  console.log('');
  console.log('    算法'.padEnd(30) + '耗时(ms)'.padEnd(14) + '复杂度'.padEnd(12) + '说明');
  console.log('    ' + '-'.repeat(82));
  console.log('    三层暴力'.padEnd(28) + bruteMs.toFixed(2).padEnd(14) + 'O(n³)'.padEnd(12) + 'n = 200 就要 133 万次三元组检查');
  console.log('    排序 + 对撞'.padEnd(26) + fastMs.toFixed(2).padEnd(14) + 'O(n²)'.padEnd(12) + '排序后固定一个，剩下的退化成两数之和 ★');
  console.log('');
  console.log(`    n = 200 时已经差了约 ${(bruteMs / fastMs).toFixed(0)} 倍；n 越大差距越夸张（n 翻倍，O(n³) 涨 8 倍，O(n²) 只涨 4 倍）。`);
  console.log('');
  console.log('  ★ 三数之和的难点其实不在双指针，而在【去重】——');
  console.log('    代码里那两处 "nums[i] === nums[i-1]" 和 "跳过相同值" 才是最容易写错的地方。');
  console.log('    这类题的通用套路是：先排序（让相同元素挨在一起），再用"跳过相邻相同元素"去重。');
}

// ---------------------------------------------------------------------------
// 4. 快慢指针
// ---------------------------------------------------------------------------

console.log('\n--- 4. 快慢指针：判环、找中点、找环入口 ---');
console.log('');
console.log('快慢指针从同一位置出发，速度比通常是 2:1。它能解决三类问题：');
console.log('');
console.log('  ① 判断链表有没有环：如果快指针追上了慢指针 → 有环（追不上就是没环）');
console.log('  ② 找链表中点：快指针走到尽头时，慢指针正好在中间');
console.log('  ③ 找环的入口：相遇后把一个指针放回头部，两者同速前进，再次相遇处就是入口');
console.log('');

/** 简单的链表节点 */
class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

/** 用数组建链表，返回 { head, nodes }；cycleAt >= 0 时在末尾接回该下标形成环 */
function buildList(values, cycleAt = -1) {
  const nodes = values.map((v) => new ListNode(v));
  for (let i = 0; i + 1 < nodes.length; i++) nodes[i].next = nodes[i + 1];
  if (cycleAt >= 0 && nodes.length > 0) nodes[nodes.length - 1].next = nodes[cycleAt];
  return { head: nodes[0] ?? null, nodes };
}

/**
 * Floyd 判环（龟兔赛跑算法）。
 *
 * 为什么快指针一定能追上慢指针？
 *   一旦两个指针都进入环里，它们的相对速度是 1（快指针每轮比慢指针多走 1 步），
 *   而环的长度是有限的 —— 所以快指针一定会"一圈一圈地逼近"，最终和慢指针重合。
 *   这就像在环形跑道上跑步：快的人一定会套圈追上慢的人。
 *
 * 时间复杂度 O(n)：慢指针走过的总步数不超过 n（相遇发生在慢指针进入环后的第一圈内）。
 * 空间复杂度 O(1)：只用了两个指针。
 */
function hasCycle(head) {
  let slow = head;
  let fast = head;
  let steps = 0;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    steps += 1;
    if (slow === fast) return { hasCycle: true, steps, meet: slow };
  }
  return { hasCycle: false, steps, meet: null };
}

/**
 * 找环的入口。
 *
 * 数学推导：设头到入口的长度是 a，入口到相遇点的长度是 b，环长是 c。
 *   相遇时：慢走了 a + b，快走了 a + b + k·c（快多绕了 k 圈），
 *   而快走的路程是慢的 2 倍 → 2(a + b) = a + b + k·c → a + b = k·c → a = k·c - b。
 *   注意 k·c - b = (k-1)·c + (c - b)，也就是"从相遇点再走 a 步会回到入口"。
 *   所以：把一个指针放回头部，两者同速前进，走 a 步后正好在入口相遇。
 */
function findCycleEntry(head) {
  const { hasCycle: cyclic, meet } = hasCycle(head);
  if (!cyclic) return null;
  let p1 = head;
  let p2 = meet;
  while (p1 !== p2) {
    p1 = p1.next;
    p2 = p2.next;
  }
  return p1;
}

/** 用哈希表判环（对照做法）：空间 O(n) */
function hasCycleBySet(head) {
  const seen = new Set();
  let cur = head;
  while (cur !== null) {
    if (seen.has(cur)) return true;
    seen.add(cur);
    cur = cur.next;
  }
  return false;
}

{
  const { head: listA } = buildList(['a', 'b', 'c', 'd', 'e']);
  const { head: listB } = buildList(['a', 'b', 'c', 'd', 'e', 'f'], 2); // f 指回 c
  const rA = hasCycle(listA);
  const rB = hasCycle(listB);
  const entry = findCycleEntry(listB);

  console.log('  链表 A：a → b → c → d → e → null （无环）');
  console.log(`    Floyd 判环：hasCycle = ${rA.hasCycle}，走了 ${rA.steps} 步`);
  console.log(`    哈希表判环：hasCycle = ${hasCycleBySet(listA)}`);
  console.log('');
  console.log('  链表 B：a → b → c → d → e → f → 回到 c （f.next = c，形成环）');
  console.log(`    Floyd 判环：hasCycle = ${rB.hasCycle}，只走了 ${rB.steps} 步就相遇了`);
  console.log(`    相遇的节点是：${rB.meet.value}`);
  console.log(`    哈希表判环：hasCycle = ${hasCycleBySet(listB)}`);
  console.log(`    环的入口是：${entry ? entry.value : '(无环)'}   ← 数学推导见函数注释`);
  console.log('');
  console.log('  ★ 为什么快慢指针比哈希表好？');
  console.log('    · 快慢指针：时间 O(n)，空间 O(1) —— 不额外占内存；');
  console.log('    · 哈希表：时间 O(n)，空间 O(n) —— 要把走过的节点全记下来。');
  console.log('    对一个可能上亿节点的链表，O(n) 的哈希表内存是不可接受的，');
  console.log('    而 Floyd 算法只用了两个指针 —— 这就是它成为经典的原因。');
}

console.log('');
console.log('  找中点（同一套快慢指针的机械应用）：');
{
  console.log('');
  console.log('    链表长度'.padEnd(16) + '慢指针停在'.padEnd(18) + '说明');
  console.log('    ' + '-'.repeat(64));
  for (const len of [5, 6, 7, 8]) {
    const { head, nodes } = buildList(Array.from({ length: len }, (_, i) => i + 1));
    let slow = head;
    let fast = head;
    while (fast !== null && fast.next !== null) {
      slow = slow.next;
      fast = fast.next.next;
    }
    console.log(
      '    ' + String(len).padEnd(16) + `第 ${nodes.indexOf(slow) + 1} 个（值 ${slow.value}）`.padEnd(18) +
        (len % 2 === 0 ? '偶数长度 → 停在"中间偏右"那个' : '奇数长度 → 正好是正中间'),
    );
  }
  console.log('');
  console.log('  ★ 规律：奇数长度停在正中；偶数长度停在中间偏右。');
  console.log('    想让它停在"中间偏左"，把循环条件改成 while (fast.next && fast.next.next) 即可。');
}
console.log('');
console.log('  快慢指针还能干别的（这里只列思路，代码同上，都是"换一下快指针的走法"）：');
console.log('');
console.log('  问题'.padEnd(40) + '指针怎么走');
console.log('  ' + '-'.repeat(78));
for (const [q, how] of [
  ['找倒数第 k 个节点', '快指针先走 k 步，然后两个一起走，快到尾部时慢指针就是答案'],
  ['原地删除有序数组的重复项', '慢指针指向"已整理区"末尾，快指针扫新元素，不同就搬过去'],
  ['原地移除指定元素', '同上：快指针找"该留的"，慢指针负责写'],
  ['判断是否是回文链表', '先用快慢指针找中点，再反转后半段，然后对撞比较'],
  ['找两个链表的交点', '先各走一遍得到长度差，长的先走差值，再一起走'],
]) {
  console.log('  ' + q.padEnd(40) + how);
}
console.log('');
console.log('  ★ 快慢指针的复杂度几乎总是时间 O(n)、空间 O(1) ——');
console.log('    它最大的卖点就是"不额外开内存"，尤其在链表这种不能随机访问的结构上。');

// ---------------------------------------------------------------------------
// 5. 滑动窗口
// ---------------------------------------------------------------------------

console.log('\n--- 5. 滑动窗口：right 负责扩张，left 负责收缩 ---');
console.log('');
console.log('滑动窗口=双指针的一种特殊形态：两个指针夹出一个区间 [left, right]，');
console.log('right 不断向右扩张窗口，一旦窗口不满足条件，就让 left 向右收缩。');
console.log('');
console.log('  通用模板（背下来就能解一大类题）：');
console.log('');
console.log('    let left = 0, best = 0;');
console.log('    for (let right = 0; right < n; right++) {');
console.log('      把 s[right] 加入窗口;                  // ① 扩张');
console.log('      while (窗口不合法) {');
console.log('        把 s[left] 移出窗口; left++;         // ② 收缩（注意是 while 不是 if）');
console.log('      }');
console.log('      此刻 [left, right] 是"以 right 结尾的最长合法窗口" → 更新答案; // ③ 记录');
console.log('    }');
console.log('');
console.log('  ★ 为什么这样是 O(n)？因为 left 和 right 都【只增不减】，各自最多走 n 步，');
console.log('    外层 right 走 n 步，内层 while 里的 left 加起来也只走 n 步 —— 合计 2n = O(n)。');
console.log('    注意：看着像双层循环，但内层不是"每次重来"，所以要按【总移动次数】算，不能按嵌套层数算。');
console.log('');
console.log('  ★ 什么时候能用滑窗？必须满足【单调性】——');
console.log('    "窗口变大只会更不合法"。这样 left 才不用回头。');
console.log('    反例：求"和最大的子数组"（数组里有负数）就不满足单调性，');
console.log('    窗口变长不代表和更大 —— 这种题要用 DP（见 10_dynamic_programming.js 的 Kadane 算法）。');

console.log('');
console.log('【定长窗口】求长度为 k 的连续子数组的最大和：');
console.log('');
console.log('  暴力：每个起点都重新加 k 个数 → O(n × k)');
console.log('  滑动窗口：窗口向右滑动一格 = "加上新进来的一个数、减去滑出去的一个数" → O(n)');
console.log('');
console.log('    窗口 k=3 向右滑一格：');
console.log('      [ 2  1  5 ] 4  3        和 = 8');
console.log('       2 [ 1  5  4 ] 3        和 = 8 - 2 + 4 = 10   ← 减掉滑出的 2，加上滑入的 4');
console.log('       2  1 [ 5  4  3 ]       和 = 10 - 1 + 3 = 12');
console.log('');

/** 定长滑动窗口：长度为 k 的连续子数组最大和 */
function maxSumFixedWindow(nums, k) {
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];
  let best = windowSum;
  for (let right = k; right < nums.length; right++) {
    windowSum += nums[right] - nums[right - k]; // 加一个、减一个
    if (windowSum > best) best = windowSum;
  }
  return best;
}

/** 暴力：每个起点重新求和 */
function maxSumBrute(nums, k) {
  let best = -Infinity;
  for (let i = 0; i + k <= nums.length; i++) {
    let sum = 0;
    for (let j = i; j < i + k; j++) sum += nums[j];
    if (sum > best) best = sum;
  }
  return best;
}

{
  const nums = [2, 1, 5, 4, 3, 7, 2];
  const k = 3;
  console.log(`  验证：[${nums.join(', ')}]，k = ${k}`);
  console.log(`    暴力 = ${maxSumBrute(nums, k)}，滑窗 = ${maxSumFixedWindow(nums, k)}  →  ${maxSumBrute(nums, k) === maxSumFixedWindow(nums, k) ? '一致 ✓' : '不一致 ✗'}`);
}
console.log('');
console.log('  实测（n = 20000，k = 100）：');
{
  const n = 20000;
  const k = 100;
  const rnd = makeRandom(555);
  const nums = [];
  for (let i = 0; i < n; i++) nums.push((rnd() % 200) - 100);

  const bruteMs = medianMs(() => {
    sink.value = maxSumBrute(nums, k);
  }, 2);
  const windowMs = medianMs(() => {
    sink.value = maxSumFixedWindow(nums, k);
  }, 2);
  console.log('');
  console.log('    算法'.padEnd(30) + '耗时(ms)'.padEnd(14) + '复杂度'.padEnd(12) + '加法运算次数');
  console.log('    ' + '-'.repeat(80));
  console.log('    暴力（每个起点重算）'.padEnd(24) + bruteMs.toFixed(3).padEnd(14) + 'O(n × k)'.padEnd(12) + (n * k).toLocaleString('en-US'));
  console.log('    滑动窗口'.padEnd(26) + windowMs.toFixed(3).padEnd(14) + 'O(n)'.padEnd(12) + n.toLocaleString('en-US'));
  console.log('');
  console.log(`    快约 ${(bruteMs / windowMs).toFixed(1)} 倍，正好对应 k = ${k} 的倍数关系。`);
  console.log('  ★ 定长滑窗的精髓：窗口每滑动一格，只有 2 个元素进出，');
  console.log('    所以"维护窗口的和"只需要 2 次运算，而不是 k 次。');
}

console.log('');
console.log('【不定长窗口】无重复字符的最长子串（LeetCode 3）：');
console.log('');
console.log('  窗口的含义：[left, right] 是一个"没有重复字符"的区间，我们要它最长。');
console.log('  right 每进来一个字符：');
console.log('    · 如果它没在窗口里出现过 → 窗口仍然合法，直接更新答案；');
console.log('    · 如果它已经在窗口里了 → 窗口不合法，把 left 一直往右推，');
console.log('      推到"那个重复的字符被移出窗口"为止。');
console.log('');
console.log('  例子 s = "abcabcbb"：');
console.log('');
console.log('    right=0 a    窗口 [a]          长 1');
console.log('    right=1 ab   窗口 [ab]         长 2');
console.log('    right=2 abc  窗口 [abc]        长 3');
console.log('    right=3 abca → a 重复了！left 推 1 → 窗口 [bca]   长 3');
console.log('    right=4 bcab → b 重复了！left 推 1 → 窗口 [cab]   长 3');
console.log('    right=5 cabc → c 重复了！left 推 1 → 窗口 [abc]   长 3');
console.log('    right=6 abcb → b 重复了！left 推到 b 移出 → 窗口 [cb]  长 2');
console.log('    right=7 bcb →  b 重复了！left 推 → 窗口 [b]      长 1');
console.log('    答案 = 3');
console.log('');

/**
 * 无重复字符的最长子串（滑动窗口 + 字符计数表）。
 *
 * 时间 O(n)：right 走 n 步，left 在 while 里总共也只走 n 步。
 * 空间 O(字符集大小)：这里用 Map 记录窗口内每个字符出现的次数。
 */
function longestUniqueSubstring(s) {
  const count = new Map(); // 字符 → 在窗口里出现的次数
  let left = 0;
  let best = 0;
  let bestStart = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    count.set(ch, (count.get(ch) ?? 0) + 1); // ① 扩张
    // ② 收缩：只要当前字符出现了不止一次，窗口就不合法
    while (count.get(ch) > 1) {
      const out = s[left];
      count.set(out, count.get(out) - 1);
      left += 1;
    }
    // ③ 此时窗口一定合法，更新答案
    if (right - left + 1 > best) {
      best = right - left + 1;
      bestStart = left;
    }
  }
  return { length: best, substring: s.slice(bestStart, bestStart + best) };
}

/** 暴力版：枚举所有起点，逐个往后扩，用 Set 判断重复 —— O(n²) */
function longestUniqueSubstringBrute(s) {
  let best = 0;
  for (let i = 0; i < s.length; i++) {
    const seen = new Set();
    for (let j = i; j < s.length; j++) {
      if (seen.has(s[j])) break;
      seen.add(s[j]);
      if (j - i + 1 > best) best = j - i + 1;
    }
  }
  return best;
}

{
  const cases = ['abcabcbb', 'bbbbb', 'pwwkew', '', 'dvdf', 'abcdefg'];
  console.log('  正确性验证（滑窗 vs 暴力）：');
  console.log('');
  let allOk = true;
  for (const s of cases) {
    const fast = longestUniqueSubstring(s);
    const slow = longestUniqueSubstringBrute(s);
    if (fast.length !== slow) allOk = false;
    console.log(
      '    ' + `"${s}"`.padEnd(14) + `滑窗 ${String(fast.length).padEnd(3)}"${fast.substring}"`.padEnd(28) + (fast.length === slow ? '✓' : '✗'),
    );
  }
  console.log('');
  console.log(`  全部一致：${allOk ? '是 ✓' : '否 ✗（注意空串返回 0）'}`);
}
console.log('');
console.log('  实测：两种数据形态下分别对比（这里能看出"数据分布决定差距大小"）：');
{
  const n = 20000;
  const rnd = makeRandom(2468);
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let randomStr = '';
  for (let i = 0; i < n; i++) randomStr += letters[rnd() % 26];

  // 第二组：字符【全不重复】的串 —— 这才是暴力解法真正的噩梦
  const uniqN = 2000;
  let uniqueStr = '';
  for (let i = 0; i < uniqN; i++) uniqueStr += String.fromCharCode(0x4e00 + i);

  const bruteRandomMs = medianMs(() => {
    sink.value = longestUniqueSubstringBrute(randomStr);
  }, 1);
  const windowRandomMs = medianMs(() => {
    sink.value = longestUniqueSubstring(randomStr).length;
  }, 2);
  const bruteUniqueMs = medianMs(() => {
    sink.value = longestUniqueSubstringBrute(uniqueStr);
  }, 1);
  const windowUniqueMs = medianMs(() => {
    sink.value = longestUniqueSubstring(uniqueStr).length;
  }, 2);

  console.log('');
  console.log('    数据形态'.padEnd(34) + '暴力(ms)'.padEnd(14) + '滑窗(ms)'.padEnd(14) + '差距');
  console.log('    ' + '-'.repeat(82));
  console.log(
    '    26 个字母的随机串（n = 20000）'.padEnd(30) +
      bruteRandomMs.toFixed(2).padEnd(14) +
      windowRandomMs.toFixed(3).padEnd(14) +
      `${(bruteRandomMs / windowRandomMs).toFixed(1)}x`,
  );
  console.log(
    '    字符全不重复的串（n = 2000）'.padEnd(30) +
      bruteUniqueMs.toFixed(2).padEnd(14) +
      windowUniqueMs.toFixed(3).padEnd(14) +
      `${(bruteUniqueMs / windowUniqueMs).toFixed(0)}x`,
  );
  console.log('');
  console.log('  ★ 第一行差距小，第二行差距大 —— 这不是代码问题，而是【数据分布】决定的：');
  console.log('    · 只有 26 个字母时，任意长度超过 27 的窗口必然出现重复，');
  console.log('      所以暴力解法的内层循环最多跑 27 次就 break 了，实际是 O(26n) 而不是 O(n²)；');
  console.log('    · 字符全不重复时，内层循环一路扩到底，暴力才真正退化成 O(n²)。');
  console.log('');
  console.log('    ★ 这个现象在性能分析里非常普遍：');
  console.log('      理论复杂度描述的是【最坏情况的增长趋势】，而实测数据往往落在平均情况上。');
  console.log('      所以"我测了很快"永远不能证明"它没问题"，一定要拿最坏输入再测一遍 ——');
  console.log('      这也是 07_graph_traversal.js 里"邻接表 vs 邻接矩阵实测"那一节的同一个教训。');
  console.log('');
  console.log('  ★ 不定长窗口和定长窗口的唯一区别：');
  console.log('    · 定长：窗口大小固定，right 和 left 一起走（right - left == k - 1 恒成立）；');
  console.log('    · 不定长：窗口大小由"合法性"决定，right 扩张、left 只在必要时收缩。');
  console.log('    两者的代码骨架完全一样，只是更新答案的位置和收缩条件不同。');
  console.log('');
  console.log('  ★ 一个实用经验：求【最长】合法窗口时，while 收缩完再更新答案；');
  console.log('    求【最短】合法窗口（如最小覆盖子串）时，一旦合法就立刻收缩并更新，');
  console.log('    收缩到不合法为止。这个细微区别是滑窗题最容易翻车的地方。');
}

// ---------------------------------------------------------------------------
// 6. 滑动窗口最大值（单调双端队列）
// ---------------------------------------------------------------------------

console.log('\n--- 6. 滑动窗口最大值：单调双端队列的经典应用 ---');
console.log('');
console.log('题目：给一个数组和一个窗口大小 k，返回每个窗口里的最大值。');
console.log('');
console.log('  暴力：每个窗口扫一遍找最大 → O(n × k)。');
console.log('  优化：用一个【单调递减的双端队列】维护"可能是最大值"的候选下标 → O(n)。');
console.log('');
console.log('  核心思想（三条规则）：');
console.log('    ① 队列里存【下标】，队列对应的值是【单调递减】的 —— 队首永远是当前窗口的最大值；');
console.log('    ② 新元素进来时，把队尾所有【比它小的元素】全部弹出去：');
console.log('       因为它们比新元素先过期，又比新元素小，永远不可能再当最大值了 —— 直接淘汰；');
console.log('    ③ 队首如果已经滑出窗口（下标 ≤ right - k），把它弹出去。');
console.log('');
console.log('  ASCII 演示：nums = [1, 3, -1, -3, 5, 3, 6, 7]，k = 3');
console.log('');
console.log('    right=0 1   队列 [0(1)]             窗口 [1]        还没满 k');
console.log('    right=1 3   1 被 3 淘汰 → [1(3)]     窗口 [1,3]      还没满 k');
console.log('    right=2 -1  → [1(3), 2(-1)]         窗口 [1,3,-1]   队首 3 就是最大值 ✓');
console.log('    right=3 -3  → [1(3), 2(-1), 3(-3)]  窗口 [3,-1,-3]   队首 3 ✓（但下标 1 即将过期）');
console.log('    right=4 5   3、-1、-3 全被淘汰 → [4(5)]  窗口 [-1,-3,5]  队首 5 ✓');
console.log('    right=5 3   → [4(5), 5(3)]          窗口 [-3,5,3]    队首 5 ✓');
console.log('    right=6 6   5、3 被淘汰 → [6(6)]      窗口 [5,3,6]     队首 6 ✓');
console.log('    right=7 7   6 被淘汰 → [7(7)]        窗口 [3,6,7]     队首 7 ✓');
console.log('');
console.log('    答案：[3, 3, 5, 5, 6, 7]');
console.log('');
console.log('  ★ 为什么它是 O(n)？看上去新元素一来就可能弹掉很多个队尾元素，');
console.log('    但【每个下标最多进队一次、出队一次】—— 总的弹出次数不超过 n。');
console.log('    又是"用总次数而不是循环嵌套层数"来算复杂度的典型例子。');
console.log('');

/**
 * 滑动窗口最大值（单调双端队列）。
 *
 * 时间 O(n)：每个下标最多入队一次、出队一次。
 * 空间 O(k)：队列里最多同时存在 k 个下标。
 */
function maxSlidingWindow(nums, k) {
  const result = [];
  const deque = []; // 存下标，对应的值单调递减（用数组 + 头指针模拟双端队列）
  let head = 0;
  for (let right = 0; right < nums.length; right++) {
    // ② 队尾所有比当前元素小的，全部淘汰（它们永远当不成最大值了）
    while (deque.length > head && nums[deque[deque.length - 1]] <= nums[right]) {
      deque.pop();
    }
    deque.push(right);
    // ③ 队首滑出窗口就丢掉
    if (deque[head] <= right - k) head += 1;
    // 窗口凑满 k 个之后，队首就是当前窗口的最大值
    if (right >= k - 1) result.push(nums[deque[head]]);
  }
  return result;
}

/** 暴力版：每个窗口扫一遍求最大值 */
function maxSlidingWindowBrute(nums, k) {
  const result = [];
  for (let i = 0; i + k <= nums.length; i++) {
    let best = -Infinity;
    for (let j = i; j < i + k; j++) if (nums[j] > best) best = nums[j];
    result.push(best);
  }
  return result;
}

{
  const nums = [1, 3, -1, -3, 5, 3, 6, 7];
  const k = 3;
  const fast = maxSlidingWindow(nums, k);
  const slow = maxSlidingWindowBrute(nums, k);
  console.log(`  验证：[${nums.join(', ')}]，k = ${k}`);
  console.log(`    单调队列 = [${fast.join(', ')}]`);
  console.log(`    暴力解法 = [${slow.join(', ')}]  →  ${JSON.stringify(fast) === JSON.stringify(slow) ? '一致 ✓' : '不一致 ✗'}`);
}
console.log('');
console.log('  实测（n = 20000，k = 200）：');
{
  const n = 20000;
  const k = 200;
  const rnd = makeRandom(1357);
  const nums = [];
  for (let i = 0; i < n; i++) nums.push(rnd() % 100000);

  const bruteMs = medianMs(() => {
    sink.value = maxSlidingWindowBrute(nums, k).length;
  }, 1);
  const dequeMs = medianMs(() => {
    sink.value = maxSlidingWindow(nums, k).length;
  }, 2);
  console.log('');
  console.log('    算法'.padEnd(34) + '耗时(ms)'.padEnd(14) + '复杂度'.padEnd(12) + '比较次数量级');
  console.log('    ' + '-'.repeat(86));
  console.log('    暴力（每个窗口扫一遍）'.padEnd(28) + bruteMs.toFixed(2).padEnd(14) + 'O(n × k)'.padEnd(12) + (n * k).toLocaleString('en-US'));
  console.log('    单调双端队列'.padEnd(30) + dequeMs.toFixed(3).padEnd(14) + 'O(n)'.padEnd(12) + (2 * n).toLocaleString('en-US'));
  console.log('');
  console.log(`    快约 ${(bruteMs / dequeMs).toFixed(0)} 倍（k = 200 的倍数关系在实测里体现得很清楚）。`);
  console.log('');
  console.log('  ★ 单调队列是"单调栈"的兄弟（见 03_stack_and_queue.js 里的思路）：');
  console.log('    · 单调栈：只在一端进出，用来找"左右第一个更大的元素"；');
  console.log('    · 单调队列：两端都能进出，用来找"固定窗口内的最值"。');
  console.log('    判断该用哪个，就看问题里有没有"窗口过期"这回事。');
  console.log('');
  console.log('  ★ 单调队列还有一个高频用途：【动态维护一个序列的最大值】，');
  console.log('    比如"最近 1 分钟的 QPS 峰值"这种实时监控指标 ——');
  console.log('    数据不断进来、老数据不断过期，正是它最擅长的场景。');
}

// ---------------------------------------------------------------------------
// 7. 复杂度对照表与模板速查
// ---------------------------------------------------------------------------

console.log('\n--- 7. 复杂度对照表 ---');
console.log('');
console.log('问题'.padEnd(36) + '暴力'.padEnd(16) + '双指针/滑窗'.padEnd(16) + '空间');
console.log('-'.repeat(92));
for (const [problem, brute, fast, space] of [
  ['有序数组两数之和', 'O(n²)', 'O(n) 对撞 ★', 'O(1)'],
  ['判断回文', 'O(n) 反转后比较', 'O(n)，最好 O(1)', 'O(1)'],
  ['三数之和', 'O(n³)', 'O(n²) 排序+对撞 ★', 'O(1)'],
  ['链表判环', 'O(n) 哈希表', 'O(n) 快慢指针 ★', 'O(1)'],
  ['找链表中点', 'O(n) 先数长度', 'O(n) 快慢指针（一趟）★', 'O(1)'],
  ['定长子数组最大和', 'O(n × k)', 'O(n) 滑窗 ★', 'O(1)'],
  ['最长无重复子串', 'O(n²)', 'O(n) 不定长滑窗 ★', 'O(字符集)'],
  ['滑动窗口最大值', 'O(n × k)', 'O(n) 单调双端队列 ★', 'O(k)'],
]) {
  console.log(problem.padEnd(34) + brute.padEnd(18) + fast.padEnd(18) + space);
}

console.log('');
console.log('  三个模板速查（遇到题先想"能不能套这三个之一"）：');
console.log('');
console.log('  ① 对撞指针 —— 序列【有序】，要找两个位置满足某种关系');
console.log('       let lo = 0, hi = n - 1;');
console.log('       while (lo < hi) {');
console.log('         if (条件(lo, hi)) { 记录; lo++; hi--; }');
console.log('         else if (偏小) lo++;');
console.log('         else hi--;');
console.log('       }');
console.log('');
console.log('  ② 快慢指针 —— 链表上有"环""中点""倒数第 k 个"这类问题时');
console.log('       let slow = head, fast = head;');
console.log('       while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }');
console.log('');
console.log('  ③ 滑动窗口 —— 求"满足某条件的最长/最短【连续】子区间"');
console.log('       let left = 0;');
console.log('       for (let right = 0; right < n; right++) {');
console.log('         加入 nums[right];');
console.log('         while (不合法) { 移出 nums[left]; left++; }');
console.log('         记录答案;');
console.log('       }');
console.log('');
console.log('  怎么判断该用哪一个？');
console.log('');
console.log('  问题特征'.padEnd(52) + '该用哪个');
console.log('  ' + '-'.repeat(88));
for (const [feature, which] of [
  ['已排序的数组里找两个数 / 三个数', '对撞指针 ★'],
  ['原地删除元素、原地去重（要求 O(1) 额外空间）', '快慢指针 ★'],
  ['链表上的环、中点、倒数第 k 个', '快慢指针 ★'],
  ['连续子数组 / 子串，求最长或最短', '滑动窗口 ★'],
  ['连续区间，且"区间越大越不合法"', '滑动窗口 ★（单调性是前提）'],
  ['窗口内求最大值 / 最小值', '滑动窗口 + 单调双端队列 ★'],
  ['数组里有负数，求最大子数组和', 'DP（Kadane），不能用滑窗 ✗'],
  ['要求"任意两个元素"而非"连续区间"', '查表 / 排序 + 双指针，不能用滑窗 ✗'],
]) {
  console.log('  ' + feature.padEnd(52) + which);
}

console.log('');
console.log('一句话总结：');
console.log('  · 双指针能省时间，靠的是【每一步排除一整批可能】，而不是挨个试；');
console.log('  · 对撞需要有序，快慢需要链表结构，滑窗需要区间的单调性 —— 三个前提别记混；');
console.log('  · 滑窗看着像双层循环，但 left 和 right 都只增不减，所以是 O(n) 而不是 O(n²)；');
console.log('  · 单调双端队列是"窗口内求最值"的唯一正解，普通遍历会把 O(n) 拖回 O(nk)；');
console.log('  · 判断能不能用滑窗，只问一句："窗口变大是不是只会更不合法？"');
console.log('    答"是"就能用，答"不一定"（比如数组里带负数）就老老实实上 DP。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
