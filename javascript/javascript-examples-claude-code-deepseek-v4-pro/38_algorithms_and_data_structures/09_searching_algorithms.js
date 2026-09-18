/**
 * ============================================================================
 * 知识点：查找算法 —— 线性查找、二分查找及其边界陷阱、二分答案
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】进阶
 * 【前置知识】38_algorithms_and_data_structures/01_big_o_and_complexity.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    查找就是在数据集合里找某个值（或它应该插入的位置）。
 *
 *    · 线性查找：从头到尾一个一个比。对数据没有任何要求，O(n)。
 *    · 二分查找：每次把搜索范围砍一半。要求数据【已经有序】，O(log n)。
 *
 *    二分查找的威力有多大？看这组数字（每步砍一半）：
 *
 *      n = 10          → 最多 4 次比较
 *      n = 1,000       → 最多 10 次
 *      n = 1,000,000   → 最多 20 次
 *      n = 1,000,000,000 → 最多 30 次      ← 十亿条数据，30 次比较就够
 *
 *    换个说法：在一本 1000 页的字典里找一个字，翻 10 次就能定位。
 *    这就是"对数"的威力 —— 数据量涨 10 倍，比较次数只多 3~4 次。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 有序数组里的值查找、ID 定位；
 *    - 数据库索引：B+ 树本质上就是"多叉版的二分查找"，每层能砍掉更多分支；
 *    - 版本回滚定位：git bisect 用二分查找找出"哪次提交引入了 bug"；
 *    - 找插入位置：往有序列表里插入时，先二分找到该插在哪；
 *    - 找边界：找"第一个 ≥ x 的位置""最后一个 ≤ x 的位置"，
 *      是处理区间查询、排名、去重的基础；
 *    - 二分答案：把"求最优解"转成"判断某个值行不行"，再用二分逼近答案。
 *
 * 3. 核心语法要点 / 算法思想
 *    二分查找的思想极简单：维护一个"答案一定在里面"的区间，
 *    每次取中点，根据中点的情况丢掉一半，直到区间为空或命中。
 *
 *      [1, 3, 5, 7, 9, 11, 13]   找 7
 *       lo=0        mid=3        hi=6
 *      [1, 3, 5, 7, 9, 11, 13]
 *              ↑ a[3]=7 == 7  命中！
 *
 *      [1, 3, 5, 7, 9, 11, 13]   找 11
 *       lo=0  mid=3  hi=6          a[3]=7 < 11 → 丢掉左半边，lo=4
 *      [1, 3, 5, 7, 9, 11, 13]
 *                   lo=4 mid=5 hi=6   a[5]=11 == 11  命中
 *
 *    ★ 但二分查找是出了名的"思路 30 秒，边界写 2 小时"。
 *      三个经典的边界陷阱（本示例逐个演示）：
 *        ① 中点计算溢出：(lo + hi) / 2 在 lo、hi 很大时会溢出；
 *        ② 循环条件：用 lo <= hi 还是 lo < hi？区间定义要一致；
 *        ③ 返回什么：返回 lo 还是 lo-1？哪个是左边界、哪个是右边界？
 *
 *    ★ 记住一个万能的思考方式：先明确你的区间是【左闭右闭 [lo, hi]】
 *      还是【左闭右开 [lo, hi)】，然后整个代码都要和这个定义保持一致：
 *        · 左闭右闭：初始 hi = n-1，循环条件 lo <= hi，收缩时 lo = mid+1 / hi = mid-1
 *        · 左闭右开：初始 hi = n，  循环条件 lo <  hi，收缩时 lo = mid+1 / hi = mid
 *      混用这两种约定，就是绝大多数二分 bug 的来源。
 *
 * 4. 常见陷阱
 *    - 陷阱一：数据没排序就二分。二分的所有推理都建立在"有序"之上，
 *      无序数据上的二分结果毫无意义（而且不会报错，只会静默出错）。
 *    - 陷阱二：中点写 (lo + hi) / 2。在小数据里没问题，
 *      但 lo、hi 接近整数上限时会溢出成负数。正确写法：lo + ((hi - lo) >> 1)。
 *    - 陷阱三：死循环。如果写成 lo = mid 而不是 lo = mid + 1，
 *      当区间只剩 2 个元素时 mid 永远等于 lo，循环永远不结束。
 *    - 陷阱四：用 lo < hi 却把 hi 初始化为 n-1，导致最后一个元素永远检查不到。
 *    - 陷阱五：找"第一个等于目标"的位置时用普通二分。
 *      普通二分在有重复元素时返回的是"某一个"匹配位置，不保证是第一个。
 *    - 陷阱六：以为二分只能用在数组上。只要"能按某个顺序判断该往哪边走"就能二分，
 *      比如二分答案、在旋转有序数组里查找、在单调函数上求根。
 *    - 陷阱七：对链表用二分。链表无法 O(1) 跳到中点，二分的前提就不成立了。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/09_searching_algorithms.js
 *
 * 【预期输出】
 *   打印 9 个小节：线性查找、二分查找的过程演示、三个边界陷阱的实证
 *   （每个陷阱都用"跑遍所有目标值找反例"的方式证明它真的会出错）、
 *   四种二分变体（第一个/最后一个等于目标、下界、插入位置）、
 *   二分查找 vs 线性查找的实测对比、二分答案的思路与实例、以及模板总结。
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

// ---------------------------------------------------------------------------
// 1. 线性查找
// ---------------------------------------------------------------------------

/**
 * 线性查找：从头到尾逐个比较。
 *
 * 时间 最好 O(1)（第一个就是）、平均 O(n/2)、最坏 O(n)（不存在时要扫完全部）
 * 空间 O(1)
 * 优点：对数据【没有任何要求】，不需要有序，链表也能用。
 * 缺点：数据量大时太慢。
 */
function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}

console.log('--- 1. 线性查找：朴素但通用 ---');
console.log('');
console.log('  做法：从下标 0 开始，一个一个和目标比较，相等就返回下标。');
console.log('  优点：对数据【零要求】—— 不需要有序，不需要能随机访问，链表也能用。');
console.log('  缺点：平均要看一半的元素，最坏要看全部。');

const linearArr = [5, 3, 8, 1, 9, 2, 7];
console.log('');
console.log(`  数组：[${linearArr.join(', ')}]（注意：这是【无序】的，所以没法二分）`);
console.log('');
console.log('  查找目标'.padEnd(12) + '结果'.padEnd(20) + '比较路径');
console.log('  ' + '-'.repeat(60));
for (const t of [8, 5, 7, 100]) {
  const idx = linearSearch(linearArr, t);
  const compared = idx === -1 ? linearArr.map(String) : linearArr.slice(0, idx + 1).map(String);
  console.log(
    '  ' +
      String(t).padEnd(12) +
      (idx === -1 ? '未找到 (-1)' : `找到，下标 ${idx}`).padEnd(22) +
      compared.join(' ≠ ') + (idx === -1 ? ' 全都不等' : ` = ${t} ✓`),
  );
}
console.log('');
console.log('  复杂度：时间 O(n)，空间 O(1)。');
console.log('  注意"未找到"是最坏情况 —— 必须确认完所有元素才能下这个结论。');

// ---------------------------------------------------------------------------
// 2. 二分查找的基本写法
// ---------------------------------------------------------------------------

console.log('\n--- 2. 二分查找：标准写法（左闭右闭区间）---');
console.log('');
console.log('  前提：数组【必须已经排好序】。这是二分一切推理的基础。');
console.log('');
console.log('  约定：区间用【左闭右闭】[lo, hi]，一开始是 [0, n-1]。');
console.log('        "闭"的意思是两端都还在候选范围内。');
console.log('');
console.log('  循环不变式（每一步都成立，这是理解二分的钥匙）：');
console.log('      "如果目标存在，它的下标一定在 [lo, hi] 里"。');
console.log('    每次砍掉一半之后，这句话依然成立 —— 所以最后区间空了，');
console.log('    就说明目标真的不存在。');

/**
 * 标准二分查找（左闭右闭区间）
 *
 * 时间 最好 O(1)（第一次就命中）、平均/最坏 O(log n)
 * 空间 O(1)（迭代写法，只用了 lo/hi/mid 三个变量）
 */
function binarySearch(arr, target) {
  let lo = 0;
  let hi = arr.length - 1; // ★ 左闭右闭：hi 指向"最后一个候选元素"
  while (lo <= hi) {
    // ★ 这样算中点不会溢出（后面第 3 节会详细讲为什么）
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) {
      lo = mid + 1; // 目标在右半边，mid 本身已经排除了
    } else {
      hi = mid - 1; // 目标在左半边，mid 本身已经排除了
    }
  }
  return -1; // 区间空了，说明不存在
}

const sortedArr = [1, 3, 5, 7, 9, 11, 13];
console.log('');
console.log(`  数据：[${sortedArr.join(', ')}]（已排序，共 ${sortedArr.length} 个）`);

/** 带过程追踪的二分，把每一步的区间打出来 */
function binarySearchTraced(arr, target) {
  let lo = 0;
  let hi = arr.length - 1;
  let step = 0;
  console.log(`    找 ${target}：`);
  while (lo <= hi) {
    step += 1;
    const mid = lo + ((hi - lo) >> 1);
    const range = arr.slice(lo, hi + 1).join(', ');
    let decision;
    if (arr[mid] === target) decision = `= ${target}，命中！返回下标 ${mid}`;
    else if (arr[mid] < target) decision = `< ${target}，丢掉左半边，lo = ${mid + 1}`;
    else decision = `> ${target}，丢掉右半边，hi = ${mid - 1}`;
    console.log(
      `      第 ${step} 步：区间 [${lo}..${hi}] = [${range}]   mid = ${mid}, a[${mid}] = ${arr[mid]}  →  ${decision}`,
    );
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  console.log(`      第 ${step + 1} 步：区间 [${lo}..${hi}] 为空 → 确定不存在，返回 -1`);
  return -1;
}

console.log('');
binarySearchTraced(sortedArr, 7);
console.log('');
binarySearchTraced(sortedArr, 11);
console.log('');
binarySearchTraced(sortedArr, 4);

console.log('');
console.log('  查找目标'.padEnd(12) + '结果'.padEnd(22) + '线性查找需要比较'.padEnd(20) + '二分查找最多比较');
console.log('  ' + '-'.repeat(76));
for (const t of [1, 5, 13, 4, 0, 100]) {
  const idx = binarySearch(sortedArr, t);
  const linearSteps = idx === -1 ? sortedArr.length : idx + 1;
  const maxBinarySteps = Math.ceil(Math.log2(sortedArr.length + 1));
  console.log(
    '  ' +
      String(t).padEnd(12) +
      (idx === -1 ? '未找到 (-1)' : `下标 ${idx}`).padEnd(24) +
      String(linearSteps).padEnd(20) +
      `≤ ${maxBinarySteps}`,
  );
}

// ---------------------------------------------------------------------------
// 3. 边界陷阱一：中点计算溢出
// ---------------------------------------------------------------------------

console.log('\n--- 3. 边界陷阱①：中点计算 (lo + hi) / 2 会溢出 ---');
console.log('');
console.log('  几乎所有教科书第一次都写 const mid = (lo + hi) / 2;');
console.log('  在小数据上它完全正确 —— 这就是它危险的地方。');
console.log('');
console.log('  问题：当 lo 和 hi 都很大时，lo + hi 可能超出整数上限。');
console.log('        在 C / Java / Go 里这会变成一个【负数】，mid 就跑到数组外面去了；');
console.log('        更糟的是它通常不崩溃，而是静默地返回错误结果。');
console.log('');
console.log('  修复办法：改成 lo + ((hi - lo) >> 1)。');
console.log('    关键区别：lo + hi 是两个大数相加，可能越界；');
console.log('              hi - lo 是两个数的【差】，一定比它们都小，绝不会越界。');

console.log('');
console.log('  JS 里的复现：JS 的普通数字是 64 位浮点数，不会溢出，');
console.log('  但一旦用了位运算（>> 1），JS 会把操作数转成 32 位有符号整数 ——');
console.log('  于是 C/Java 里的那个溢出 bug 就在 JS 里原样重现了：');
console.log('');
{
  const lo = 1_500_000_000;
  const hi = 1_500_000_001;
  const sum = lo + hi;
  const badMid = sum >> 1; // 模拟 C/Java 的 int 溢出
  const goodMid = lo + ((hi - lo) >> 1);
  console.log(`    lo = ${lo}, hi = ${hi}`);
  console.log(`    lo + hi = ${sum}   ← 这个数已经超过了 32 位有符号整数的上限 2147483647`);
  console.log(`    (lo + hi) >> 1 = ${badMid}   ← ✗ 溢出成了负数！mid 直接跑到数组外面`);
  console.log(`    lo + ((hi - lo) >> 1) = ${goodMid}   ← ✓ 正确`);
  console.log('');
  console.log(`    实际安全的中点应该是 ${Math.floor((lo + hi) / 2)}（用浮点除法算出来的）。`);
  console.log(`    验证：goodMid 是否等于它 → ${goodMid === Math.floor((lo + hi) / 2)}`);
  console.log(`          badMid 是否等于它 → ${badMid === Math.floor((lo + hi) / 2)}  ← 明显错了`);
}
console.log('');
console.log('  ★ 这条在 JS 里到底要不要在意？');
console.log('    · 对【数组下标】来说，JS 数组长度上限是 2³²-1，实际根本到不了十亿，');
console.log('      所以纯数组二分在 JS 里用 (lo+hi)/2 几乎不会出事；');
console.log('    · 但【二分答案】的场景里，lo 和 hi 是【值】而不是下标 ——');
console.log('      值完全可以是 10⁹ 甚至更大（比如"最小运载能力"可能是 10¹⁵）；');
console.log('      这时 (lo + hi) / 2 在别的语言里就是真 bug，在 JS 里配合位运算也会翻车。');
console.log('    · 结论：无论什么语言、什么场景，统一写 lo + ((hi - lo) >> 1)。');
console.log('      它和 (lo+hi)/2 一样简洁，却能永久地避开这一类 bug —— 没有理由不这么写。');

console.log('');
console.log('  用"跑遍所有目标值"的方式验证两种写法的正确性：');
{
  // 用一个较大的数组来对比两种中点写法
  const big = [];
  for (let i = 0; i < 2000; i++) big.push(i * 2);

  function searchWithMidFn(arr, target, midFn) {
    let lo = 0;
    let hi = arr.length - 1;
    while (lo <= hi) {
      const mid = midFn(lo, hi);
      if (arr[mid] === target) return mid;
      if (arr[mid] < target) lo = mid + 1;
      else hi = mid - 1;
    }
    return -1;
  }

  const safeMid = (lo, hi) => lo + ((hi - lo) >> 1);
  let safeErrors = 0;
  let unsafeErrors = 0;
  for (let t = -5; t < 4010; t++) {
    const expected = linearSearch(big, t);
    if (searchWithMidFn(big, t, safeMid) !== expected) safeErrors += 1;
    // (lo+hi)>>1 在 0~2000 这个范围内不会溢出，所以这里两者结果一致
    if (searchWithMidFn(big, t, (lo, hi) => (lo + hi) >> 1) !== expected) unsafeErrors += 1;
  }
  console.log(`    测试 ${4015} 个目标值（含不存在的），对比结果：`);
  console.log(`      lo + ((hi - lo) >> 1) 的出错次数：${safeErrors}   ← 推荐写法`);
  console.log(`      (lo + hi) >> 1        的出错次数：${unsafeErrors}   ← 小范围内不会暴露问题`);
  console.log('    小范围测试【测不出】溢出 bug —— 这正是它危险的地方，');
  console.log('    它只在极大规模下才发作，而那时往往已经在生产环境里了。');
}

// ---------------------------------------------------------------------------
// 4. 边界陷阱二：while 用 <= 还是 <
// ---------------------------------------------------------------------------

console.log('\n--- 4. 边界陷阱②：while (lo <= hi) 还是 while (lo < hi)？---');
console.log('');
console.log('  答案不是"哪个对"，而是"必须和你的区间定义匹配"：');
console.log('');
console.log('    区间定义'.padEnd(26) + 'hi 初始值'.padEnd(16) + '循环条件'.padEnd(18) + '右半边收缩');
console.log('    ' + '-'.repeat(82));
console.log('    左闭右闭 [lo, hi]'.padEnd(24) + 'n - 1'.padEnd(16) + 'lo <= hi'.padEnd(18) + 'hi = mid - 1');
console.log('    左闭右开 [lo, hi)'.padEnd(24) + 'n'.padEnd(16) + 'lo < hi'.padEnd(18) + 'hi = mid');
console.log('');
console.log('  混用这两种约定就会出错。最典型的错误：');
console.log('    区间定义成左闭右闭（hi = n-1），但循环条件写成 lo < hi ——');
console.log('    这样当 lo === hi 时会退出循环，而那个位置上可能正好是目标！');

/**
 * 错误的二分：hi = n - 1（左闭右闭）却配了 lo < hi 的循环条件。
 * 后果：当区间收缩到只剩一个元素时循环就退出了，那个元素永远检查不到。
 */
function binarySearchBuggyLoop(arr, target) {
  let lo = 0;
  let hi = arr.length - 1; // 左闭右闭
  while (lo < hi) { // ★ 错：应该是 lo <= hi
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

console.log('');
console.log('  用"跑遍所有目标值"的方式找出它到底在什么情况下出错：');
{
  const arr = [1, 3, 5, 7, 9, 11, 13];
  const failures = [];
  for (let t = 0; t <= 14; t++) {
    const expected = linearSearch(arr, t);
    const actual = binarySearchBuggyLoop(arr, t);
    if (actual !== expected) failures.push({ t, expected, actual });
  }
  console.log('');
  console.log(`    数据：[${arr.join(', ')}]`);
  console.log(`    出错的目标值有 ${failures.length} 个：`);
  console.log('');
  console.log('    目标'.padEnd(10) + '正确答案'.padEnd(14) + '错误代码返回'.padEnd(16) + '说明');
  console.log('    ' + '-'.repeat(70));
  for (const f of failures) {
    console.log(
      '    ' +
        String(f.t).padEnd(10) +
        (f.expected === -1 ? '不存在' : `下标 ${f.expected}`).padEnd(16) +
        (f.actual === -1 ? '不存在' : `下标 ${f.actual}`).padEnd(18) +
        (f.expected === -1 ? '假阳性：报告了一个不存在的值！' : '假阴性：存在的值却找不到'),
    );
  }
  console.log('');
  console.log('    发现规律了吗？出错的正好是下标为【偶数】的那 4 个元素：1(下标0)、');
  console.log('    5(下标2)、9(下标4)、13(下标6)。');
  console.log('    原因：这个写法里 mid 总是落在奇数下标上（先是 3，之后是 1 或 5……），');
  console.log('    于是当区间收缩到只剩一个元素、且它的下标是偶数时，');
  console.log('    循环条件 lo < hi 判定为假，直接跳出 —— 这个元素根本没被检查过。');
  console.log('');
  console.log('    危险之处在于它的"隐蔽性"：');
  console.log('      · 它只对【一半】的元素出错，另一半完全正常，所以随手测几个用例可能测不出来；');
  console.log('      · 出错的表现是"存在的值查不到"，业务上会表现为"数据明明在，却报不存在"，');
  console.log('        这种 bug 极难排查，因为第一反应总是去怀疑数据而不是二分代码；');
  console.log('      · 正确的写法应该是 while (lo <= hi)，这样 lo === hi 时还会再检查一次。');
}

console.log('');
console.log('  还有一个更隐蔽的错法：把 lo = mid + 1 写成 lo = mid。');
console.log('  这样当区间只剩 2 个元素时，mid 恒等于 lo，循环永远不会缩小 → 死循环。');
console.log('  演示（带次数的死循环检测，避免示例真的卡住）：');
{
  const arr = [1, 3, 5, 7, 9];
  let lo = 0;
  let hi = arr.length - 1;
  let iterations = 0;
  const LIMIT = 20;
  while (lo <= hi && iterations < LIMIT) {
    iterations += 1;
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] === 2) break;
    if (arr[mid] < 2) lo = mid; // ★ 错：应该是 mid + 1
    else hi = mid - 1;
  }
  console.log(
    `    找不存在的值 2：循环跑了 ${iterations} 次${iterations >= LIMIT ? '（达到上限被人为中断，实际上会永远跑下去）' : '（正常结束）'}`,
  );
  console.log(`    此时 lo = ${lo}, hi = ${hi} —— 区间卡住不再变化，这就是死循环的特征。`);
  console.log('');
  console.log('  避免死循环的两条铁律：');
  console.log('    ① 区间必须【每一步都在缩小】。写完后检查：mid 会落在哪，');
  console.log('       新的区间是否一定比旧区间小？');
  console.log('    ② 收缩边界时永远跳过 mid 本身（lo = mid + 1 / hi = mid - 1），');
  console.log('       因为 mid 已经在这一步被检查过了，没必要再留在区间里。');
}

// ---------------------------------------------------------------------------
// 5. 边界陷阱三：返回哪个边界
// ---------------------------------------------------------------------------

console.log('\n--- 5. 边界陷阱③：有重复元素时，返回的是哪一个？---');
console.log('');
console.log('  前面所有演示用的数组都【没有重复元素】，这是被刻意简化的场景。');
console.log('  现实中数据经常有重复：比如按价格排序的商品列表里，');
console.log('  同价格的商品会连续排在一起。这时"找到了"往往不够，');
console.log('  你通常需要知道【第一个】或【最后一个】在哪：');
console.log('');
console.log('    · 找第一个 —— 从这个位置开始，所有同价商品都在右边，可以直接切片；');
console.log('    · 找最后一个 —— 配合第一个可以算出"这个价格有几种商品"；');
console.log('    · 找插入位置 —— 保持有序地插入新元素时该放哪。');
console.log('');
console.log('  而普通二分在重复数据上返回的是【某一个】匹配位置，');
console.log('  它可能落在中间，不保证是第一个 —— 这是很多人踩过的坑。');

const dupArr = [1, 3, 3, 3, 3, 5, 7, 7, 9];
console.log('');
console.log(`  演示数据：[${dupArr.join(', ')}]（3 出现了 4 次，7 出现了 2 次）`);
console.log('');
console.log(`  普通二分找 3：返回下标 ${binarySearch(dupArr, 3)} —— 只是"某一个"，不是第一个（正确答案是 1）`);
console.log(`  普通二分找 7：返回下标 ${binarySearch(dupArr, 7)} —— 正确答案是 6`);

/**
 * 查下界（lower bound）：返回第一个【大于等于】target 的下标。
 * 如果所有元素都小于 target，返回数组长度 n。
 *
 * 这是二分查找里最重要的一个变体 ——
 * 找"第一个等于目标"、找"插入位置"、找"第一个 ≥ x"全都能由它推出来。
 *
 * 时间 O(log n)，空间 O(1)。
 */
function lowerBound(arr, target) {
  let lo = 0;
  let hi = arr.length; // ★ 左闭右开 [lo, hi)，hi 可以等于 n（表示"插到末尾"）
  while (lo < hi) {
    // ★ 左闭右开配 lo < hi
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] < target) {
      lo = mid + 1; // a[mid] < target → 答案在 mid 右边（mid 不可能是答案）
    } else {
      hi = mid; // ★ a[mid] >= target → mid 可能就是答案，不能跳过它！
    }
  }
  return lo; // 循环结束时 lo === hi，指向第一个 >= target 的位置
}

/**
 * 查上界（upper bound）：返回第一个【大于】target 的下标。
 * 和 lowerBound 只差一个符号：把 < 改成 <=。
 */
function upperBound(arr, target) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (arr[mid] <= target) {
      // ★ 这里和 lowerBound 唯一的区别
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

console.log('');
console.log('  两个最重要的变体：');
console.log('');
console.log('    lowerBound(x)：第一个【>= x】的位置');
console.log('    upperBound(x)：第一个【>  x】的位置');
console.log('');
console.log('    它们的关系：[ lowerBound , upperBound ) 正好是"等于 x 的那一段区间"。');
console.log('    所以：第一个等于 x 的下标 = lowerBound(x)');
console.log('          最后一个等于 x 的下标 = upperBound(x) - 1');
console.log('          等于 x 的元素个数   = upperBound(x) - lowerBound(x)');
console.log('          保持有序的插入位置   = lowerBound(x)');

console.log('');
console.log('  实测每个值在数组里的分布：');
console.log('');
console.log('  值'.padEnd(8) + 'lowerBound'.padEnd(14) + 'upperBound'.padEnd(14) + '出现次数'.padEnd(12) + '第一个等于它的下标'.padEnd(22) + '最后一个等于它的下标');
console.log('  ' + '-'.repeat(90));
for (const v of [1, 3, 5, 7, 9, 0, 4, 10]) {
  const lb = lowerBound(dupArr, v);
  const ub = upperBound(dupArr, v);
  const count = ub - lb;
  const first = count > 0 ? String(lb) : '不存在';
  const last = count > 0 ? String(ub - 1) : '不存在';
  console.log(
    '  ' +
      String(v).padEnd(8) +
      String(lb).padEnd(14) +
      String(ub).padEnd(14) +
      String(count).padEnd(12) +
      first.padEnd(22) +
      last,
  );
}
console.log('');
console.log('  注意 0 和 4、10 这三行（它们不在数组里）：');
console.log('    0 的 lowerBound = 0 → 说明"应该插在最前面"；');
console.log('    10 的 lowerBound = 9 = 数组长度 → 说明"应该插到最后面"；');
console.log('    4 的 lowerBound = 5 → 说明"应该插在下标 5（5 的前面）"，插入后数组仍然有序。');
console.log('    这就是为什么 lowerBound 可以直接当成"插入位置"来用 —— 一个函数三种用途。');

console.log('');
console.log('  用"跑遍所有值"的方式验证这些推导是否成立：');
{
  let errors = 0;
  for (let v = 0; v <= 10; v++) {
    const lb = lowerBound(dupArr, v);
    const ub = upperBound(dupArr, v);
    // 用线性扫描算出"标准答案"
    let expectFirst = -1;
    for (let i = 0; i < dupArr.length; i++) {
      if (dupArr[i] === v) {
        expectFirst = i;
        break;
      }
    }
    let expectLast = -1;
    for (let i = dupArr.length - 1; i >= 0; i--) {
      if (dupArr[i] === v) {
        expectLast = i;
        break;
      }
    }
    const gotFirst = ub > lb ? lb : -1;
    const gotLast = ub > lb ? ub - 1 : -1;
    if (gotFirst !== expectFirst || gotLast !== expectLast) errors += 1;
  }
  console.log(`    在 0~10 全部 11 个值上，lowerBound / upperBound 的推导结果全部正确：${errors === 0}`);
}

// ---------------------------------------------------------------------------
// 6. 实测：线性查找 vs 二分查找
// ---------------------------------------------------------------------------

console.log('\n--- 6. 实测：线性查找 vs 二分查找 ---');
console.log('');
console.log('  二分查找需要有序数据，而"把数据排好序"本身是有成本的：');
console.log('    · 排序一次 O(n log n)，但如果要查很多次，这次排序可以摊薄到每次查询上；');
console.log('    · 只查一两次的话，排序的成本可能比省下的还多 —— 直接用线性查找更划算。');
console.log('  所以对比要分两种情况看：一次排序 + 很多次查询，才体现二分的价值。');

const N = 20000;
const QUERIES = 1000;
const sortedForSearch = [];
for (let i = 0; i < N; i++) sortedForSearch.push(i * 3);
const shuffledForSearch = [...sortedForSearch];
{
  // 打乱（确定性）
  let s = 20240916;
  for (let i = shuffledForSearch.length - 1; i > 0; i--) {
    s = (s * 48271) % 2147483647;
    const j = s % (i + 1);
    const t = shuffledForSearch[i];
    shuffledForSearch[i] = shuffledForSearch[j];
    shuffledForSearch[j] = t;
  }
}

// 构造查询目标：一半命中、一半不命中
const targets = [];
{
  let s = 777;
  for (let i = 0; i < QUERIES; i++) {
    s = (s * 48271) % 2147483647;
    const base = (s % N) * 3;
    targets.push(i % 2 === 0 ? base : base + 1); // 奇数必然不命中（数组里都是 3 的倍数）
  }
}

const linearMs = medianMs(() => {
  let hits = 0;
  for (const t of targets) if (linearSearch(shuffledForSearch, t) !== -1) hits += 1;
  sink.value = hits;
});

const binaryMs = medianMs(() => {
  let hits = 0;
  for (const t of targets) if (binarySearch(sortedForSearch, t) !== -1) hits += 1;
  sink.value = hits;
});

const sortCostMs = medianMs(() => {
  sink.value = [...shuffledForSearch].sort((a, b) => a - b)[0];
});

// 统计比较次数，这个数字与机器无关
let linearSteps = 0;
for (const t of targets) {
  const idx = linearSearch(shuffledForSearch, t);
  linearSteps += idx === -1 ? shuffledForSearch.length : idx + 1;
}
let binarySteps = 0;
for (const t of targets) {
  let lo = 0;
  let hi = sortedForSearch.length - 1;
  let steps = 0;
  while (lo <= hi) {
    steps += 1;
    const mid = lo + ((hi - lo) >> 1);
    if (sortedForSearch[mid] === t) break;
    if (sortedForSearch[mid] < t) lo = mid + 1;
    else hi = mid - 1;
  }
  binarySteps += steps;
}

console.log('');
console.log(`  n = ${N}，查询 ${QUERIES} 次（一半命中、一半不命中，未命中是线性查找的最坏情况）：`);
console.log('');
console.log('做法'.padEnd(34) + '总比较次数'.padEnd(16) + '平均每次'.padEnd(14) + '耗时(ms)');
console.log('-'.repeat(84));
console.log(
  '线性查找（数据无需排序）'.padEnd(32) +
    linearSteps.toLocaleString('en-US').padEnd(16) +
    (linearSteps / QUERIES).toFixed(1).padEnd(14) +
    linearMs.toFixed(4),
);
console.log(
  '二分查找（数据已排序）'.padEnd(32) +
    binarySteps.toLocaleString('en-US').padEnd(16) +
    (binarySteps / QUERIES).toFixed(1).padEnd(14) +
    binaryMs.toFixed(4),
);
console.log('');
console.log(`  二分查找快约 ${(linearMs / binaryMs).toFixed(1)} 倍；`);
console.log(`  比较次数从 ${linearSteps.toLocaleString('en-US')} 次降到 ${binarySteps.toLocaleString('en-US')} 次，`);
console.log(`  相差 ${(linearSteps / binarySteps).toFixed(1)} 倍 —— 这个比值会随 n 增大而继续拉大。`);
console.log('');
{
  const perQuerySavingMs = (linearMs - binaryMs) / QUERIES; // 每次查询省下多少
  const breakEven = Math.ceil(sortCostMs / perQuerySavingMs);
  console.log(`  但别忘了二分的【前置成本】：把数据排序一次要 ${sortCostMs.toFixed(3)} ms。`);
  console.log(`  而每次查询平均只省下 ${(perQuerySavingMs * 1000).toFixed(2)} 微秒（${perQuerySavingMs.toFixed(6)} ms）——`);
  console.log(`  因为单次查找实在太快了，它的收益要靠"次数"累积。`);
  console.log(`  盈亏平衡点 = ${sortCostMs.toFixed(3)} ÷ ${perQuerySavingMs.toFixed(6)} ≈ ${breakEven} 次查询。`);
  console.log(`  也就是说：查不到 ${breakEven} 次，排序的成本都赚不回来，还不如直接线性查找；`);
  console.log(`  本示例查了 ${QUERIES} 次 > ${breakEven} 次，所以二分才划算。`);
}
console.log('');
console.log('  ★ 这条"前置成本"的账非常重要：');
console.log('    它解释了为什么"有序数组 + 二分"适合【静态数据 + 高频查询】，');
console.log('    而"频繁增删"的场景要用二叉搜索树（插入删除也是 O(log n)，不需要重建）。');

console.log('');
console.log('  二分查找的比较次数随 n 增长得有多慢？');
console.log('');
console.log('  n'.padEnd(16) + '最多需要比较'.padEnd(18) + '线性查找最坏需要比较');
console.log('  ' + '-'.repeat(60));
for (const size of [10, 100, 1000, 10000, 1000000, 1000000000]) {
  console.log(
    '  ' +
      size.toLocaleString('en-US').padEnd(16) +
      String(Math.ceil(Math.log2(size + 1))).padEnd(18) +
      size.toLocaleString('en-US'),
  );
}
console.log('');
console.log('  十亿条数据，二分查找最多 30 次比较就能确定答案；');
console.log('  线性查找最坏要 10 亿次 —— 这就是 O(log n) 和 O(n) 的全部差距。');

// ---------------------------------------------------------------------------
// 7. 二分答案
// ---------------------------------------------------------------------------

console.log('\n--- 7. 二分答案：把"求最优解"变成"判断行不行" ---');
console.log('');
console.log('  这是二分查找最有威力的用法，也是它跳出"数组下标"范畴的地方。');
console.log('');
console.log('  适用条件（两个都必须满足）：');
console.log('    ① 答案在一个【有序的候选范围】里（通常是一个整数区间 [lo, hi]）；');
console.log('    ② 存在一个【单调的判定函数】 check(x)：');
console.log('         x 越大越容易满足 → 一旦某个 x 满足了，比它大的全都满足；');
console.log('         于是"满足/不满足"的分界线可以用二分找出来。');
console.log('');
console.log('  形象地说，check(x) 的结果长这样（T = 行，F = 不行）：');
console.log('');
console.log('      x:      1  2  3  4  5  6  7  8  9');
console.log('    check:    F  F  F  F  T  T  T  T  T');
console.log('                         ↑');
console.log('                    我们要找的就是这个分界点');
console.log('');
console.log('  ★ 这就是"有单调性"的意思 —— 结果是"一排 F 后面跟着一排 T"。');
console.log('    只要能构造出这样的判定函数，"求最小的可行 x"就可以二分。');

console.log('');
console.log('【例子一：整数平方根】求最大的 k 使 k² ≤ n。');
console.log('');
console.log('  等价说法：找最小的 k 使 k² > n，然后减一。');
console.log('  check(k)：k² > n 是否成立？k 越大越容易成立 → 单调 ✓');
console.log('');
console.log('  范围：lo = 0，hi = n（答案一定在这里面，因为 0² ≤ n 且 n² > n）。');

/**
 * 二分答案求整数平方根（向下取整）
 * 时间 O(log n)，空间 O(1)
 */
function integerSqrt(n) {
  if (n < 0) throw new RangeError('负数没有实数平方根');
  if (n < 2) return n;
  let lo = 0;
  let hi = n;
  // 找最小的 k 使 k*k > n
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (mid * mid > n) {
      hi = mid; // mid 满足"太大"这个条件，答案可能是 mid 或更小
    } else {
      lo = mid + 1; // mid 不满足，答案一定比 mid 大
    }
  }
  return lo - 1; // lo 是第一个"太大"的 k，所以答案是 lo - 1
}

console.log('');
console.log('  n'.padEnd(14) + '二分答案结果'.padEnd(16) + 'Math.floor(Math.sqrt(n))'.padEnd(28) + '一致?');
console.log('  ' + '-'.repeat(70));
for (const n of [0, 1, 2, 8, 9, 10, 15, 16, 17, 100, 999, 1000000]) {
  const mine = integerSqrt(n);
  const builtin = Math.floor(Math.sqrt(n));
  console.log(
    '  ' + String(n).padEnd(14) + String(mine).padEnd(16) + String(builtin).padEnd(28) + (mine === builtin ? '✓' : '✗'),
  );
}
console.log('');
console.log('  这个例子的价值不在于"算平方根"（Math.sqrt 一行就够了），');
console.log('  而在于演示了【二分答案的完整套路】——下面看一个真正有用的例子。');

console.log('');
console.log('【例子二：最小运载能力】');
console.log('');
console.log('  场景：有若干堆货物，用一辆卡车按顺序（不能打乱次序）分 D 天运完。');
console.log('        卡车每天装的重量不能超过它的载重 capacity。');
console.log('        求"能在 D 天内运完"所需的【最小载重】。');
console.log('');
console.log('  关键洞察：载重越大，需要的天数越少 —— 这就是单调性！');
console.log('');
console.log('    capacity:   1   2   3   4   5   6   7   8   9  10');
console.log('    需要的天数: 15  10   8   6   5   4   4   3   3   3');
console.log('    能否 ≤ 5 天: F   F   F   F   T   T   T   T   T   T');
console.log('                             ↑');
console.log('                    载重 5 就是答案');
console.log('');
console.log('  check(capacity)：按这个载重模拟运货，看需要的天数是否 ≤ D。');
console.log('  容量越大天数越少（单调），所以可以二分答案！');
console.log('');
console.log('  这个例子说明：二分答案的 check 函数可以是【任意复杂的模拟】，');
console.log('  只要它满足"单调"这一条，二分就成立 —— 这才是二分答案真正的威力。');

/**
 * 二分答案：求在 days 天内运完所有货物所需的最小载重
 * @param {number[]} weights 每堆货物的重量（必须按顺序装运）
 * @param {number} days 允许的天数
 *
 * 时间 O(n log(maxWeight))，空间 O(1)
 */
function minShipCapacity(weights, days) {
  // 答案的下界：至少要能装下最重的那一堆
  let lo = Math.max(...weights);
  // 答案的上界：一次全装完
  let hi = weights.reduce((a, b) => a + b, 0);

  /** 判定函数：以 capacity 为载重，需要几天？ */
  const daysNeeded = (capacity) => {
    let needed = 1;
    let currentLoad = 0;
    for (const w of weights) {
      if (currentLoad + w > capacity) {
        needed += 1; // 装不下了，开新的一天
        currentLoad = 0;
      }
      currentLoad += w;
    }
    return needed;
  };

  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    if (daysNeeded(mid) <= days) {
      hi = mid; // 这个载重可行，试试更小的
    } else {
      lo = mid + 1; // 太小了，需要更大的载重
    }
  }
  return lo;
}

const weights = [3, 2, 2, 4, 1, 4];
const days = 3;
console.log('');
console.log(`  货物： [${weights.join(', ')}]，要在 ${days} 天内运完`);
console.log('');
console.log('  二分过程的每一步：');
console.log('');
console.log('  lo'.padEnd(8) + 'hi'.padEnd(8) + 'mid(载重)'.padEnd(14) + '需要天数'.padEnd(12) + '判定'.padEnd(20) + '下一步');
console.log('  ' + '-'.repeat(78));
{
  let lo = Math.max(...weights);
  let hi = weights.reduce((a, b) => a + b, 0);
  const daysNeeded = (capacity) => {
    let needed = 1;
    let cur = 0;
    for (const w of weights) {
      if (cur + w > capacity) {
        needed += 1;
        cur = 0;
      }
      cur += w;
    }
    return needed;
  };
  while (lo < hi) {
    const mid = lo + ((hi - lo) >> 1);
    const need = daysNeeded(mid);
    const ok = need <= days;
    const next = ok ? `可行 → hi = ${mid}（试更小）` : `不可行 → lo = ${mid + 1}（要更大）`;
    console.log(
      '  ' +
        String(lo).padEnd(8) +
        String(hi).padEnd(8) +
        String(mid).padEnd(14) +
        String(need).padEnd(12) +
        (ok ? `≤ ${days} ✓` : `> ${days} ✗`).padEnd(22) +
        next,
    );
    if (ok) hi = mid;
    else lo = mid + 1;
  }
  console.log('');
  console.log(`  二分答案结果：最小载重 = ${lo}`);
  console.log('');
  console.log('  手工验证一下这个答案：');
  let cur = 0;
  let day = 1;
  const plan = [[]];
  for (const w of weights) {
    if (cur + w > lo) {
      day += 1;
      cur = 0;
      plan.push([]);
    }
    cur += w;
    plan[plan.length - 1].push(w);
  }
  plan.forEach((loads, i) => {
    console.log(`    第 ${i + 1} 天：[${loads.join(', ')}]  合计 ${loads.reduce((a, b) => a + b, 0)} ≤ ${lo} ✓`);
  });
  console.log(`    共用了 ${plan.length} 天 ≤ ${days} 天 ✓`);
  console.log('');
  console.log(`    再试一下载重 ${lo - 1}：需要 ${daysNeeded(lo - 1)} 天 > ${days} 天 ✗ —— 所以 ${lo} 确实是"最小"的。`);
}

console.log('');
console.log('  二分答案的通用模板（务必背下来）：');
console.log('');
console.log('    let lo = 答案可能的最小值;');
console.log('    let hi = 答案可能的最大值;');
console.log('    while (lo < hi) {                    // ★ 左闭右开式写法');
console.log('      const mid = lo + ((hi - lo) >> 1);');
console.log('      if (check(mid)) hi = mid;          // mid 可行 → 答案 ≤ mid，往左找');
console.log('      else            lo = mid + 1;      // mid 不可行 → 答案 > mid，往右找');
console.log('    }');
console.log('    return lo;                           // lo 就是最小的可行答案');
console.log('');
console.log('  这个模板的两个要点：');
console.log('    ① 循环用 lo < hi 而不是 lo <= hi —— 因为我们要找的是"分界点"，');
console.log('       而不是"某个等于目标的元素"，所以不需要在 lo === hi 时再检查一次；');
console.log('    ② check(mid) 为真时写 hi = mid 而不是 hi = mid - 1 ——');
console.log('       因为 mid 本身可能就是答案，不能把它排除掉。');
console.log('');
console.log('  常见的二分答案题目类型：');
console.log('    · 求"最小的最大"（最小化最大值）：如本题的最小载重、分割数组的最小和；');
console.log('    · 求"最大的最小"（最大化最小值）：如"最大化最小间距"、安排牛舍；');
console.log('    · 求最优的整数参数：如最小速度、最大长度、最少天数。');
console.log('  它们的共同点：答案是一个整数，且"越大越容易/越难满足"这种单调关系成立。');

// ---------------------------------------------------------------------------
// 8. 模板总结
// ---------------------------------------------------------------------------

console.log('\n--- 8. 二分查找模板总结 ---');

console.log('');
console.log('模板'.padEnd(30) + '区间约定'.padEnd(20) + '循环条件'.padEnd(14) + '用来解决');
console.log('-'.repeat(104));
for (const [name, range, cond, use] of [
  ['精确查找', '左闭右闭 [lo, hi]', 'lo <= hi', '找一个确定存在的元素，返回它的下标'],
  ['lowerBound（下界）', '左闭右开 [lo, hi)', 'lo < hi', '第一个 ≥ x 的位置 / 插入位置'],
  ['upperBound（上界）', '左闭右开 [lo, hi)', 'lo < hi', '第一个 > x 的位置'],
  ['二分答案', '左闭右开 [lo, hi)', 'lo < hi', '最小的可行解（check 单调）'],
]) {
  console.log(name.padEnd(28) + range.padEnd(22) + cond.padEnd(14) + use);
}

console.log('');
console.log('  三种模板的完整代码（对比着看，区别只有几处）：');
console.log('');
console.log('    // ① 精确查找：左闭右闭');
console.log('    let lo = 0, hi = arr.length - 1;');
console.log('    while (lo <= hi) {');
console.log('      const mid = lo + ((hi - lo) >> 1);');
console.log('      if (arr[mid] === target) return mid;');
console.log('      if (arr[mid] < target) lo = mid + 1;');
console.log('      else                   hi = mid - 1;');
console.log('    }');
console.log('    return -1;');
console.log('');
console.log('    // ② lowerBound：左闭右开，第一个 >= target');
console.log('    let lo = 0, hi = arr.length;');
console.log('    while (lo < hi) {');
console.log('      const mid = lo + ((hi - lo) >> 1);');
console.log('      if (arr[mid] < target) lo = mid + 1;');
console.log('      else                   hi = mid;      // ← 不跳过 mid');
console.log('    }');
console.log('    return lo;   // 等于"插入位置"，也等于"第一个 >= target 的下标"');
console.log('');
console.log('    // ③ 二分答案：左闭右开，最小的可行解');
console.log('    let lo = 下界, hi = 上界;');
console.log('    while (lo < hi) {');
console.log('      const mid = lo + ((hi - lo) >> 1);');
console.log('      if (check(mid)) hi = mid;      // ← 可行就往左收缩');
console.log('      else            lo = mid + 1;');
console.log('    }');
console.log('    return lo;');

console.log('');
console.log('  写二分时按这个顺序自查，能避开 99% 的 bug：');
console.log('');
console.log('    □ 1. 数据是有序的吗？（二分的前提，无序就白搭）');
console.log('    □ 2. 我的区间是【左闭右闭】还是【左闭右开】？（先声明，再写代码）');
console.log('    □ 3. hi 的初始值是 n-1 还是 n？（必须和第 2 步的声明一致）');
console.log('    □ 4. 循环条件是 <= 还是 <？（必须和第 2 步的声明一致）');
console.log('    □ 5. 中点写的是 lo + ((hi - lo) >> 1) 吗？（防溢出）');
console.log('    □ 6. 收缩时跳过了 mid 吗？（lo = mid + 1 / hi = mid - 1）');
console.log('       —— 除非你要找的是边界（那时 hi = mid 才是对的）');
console.log('    □ 7. 区间【每一步都在缩小】吗？（否则死循环）');
console.log('    □ 8. 返回的是 lo 还是 lo-1？（想清楚 lo 到底指向什么）');
console.log('');
console.log('  最有效的验证方法：写一个小循环，把目标值【从头到尾跑一遍】，');
console.log('  和线性查找的结果逐个比对 —— 本示例的三个陷阱都是这么被抓出来的。');

console.log('\n--- 9. 复杂度对照表 ---');

console.log('');
console.log('算法'.padEnd(32) + '最好'.padEnd(14) + '平均'.padEnd(16) + '最坏'.padEnd(14) + '前置要求');
console.log('-'.repeat(96));
for (const [name, best, avg, worst, req] of [
  ['线性查找', 'O(1)', 'O(n)', 'O(n)', '无（无序、链表都能用）'],
  ['二分查找（数组）', 'O(1)', 'O(log n)', 'O(log n)', '必须有序 + 能随机访问'],
  ['二分查找（链表）', '—', '—', 'O(n)', '链表无法 O(1) 找中点，二分失去意义'],
  ['lowerBound / upperBound', 'O(log n)', 'O(log n)', 'O(log n)', '必须有序'],
  ['二分答案', 'O(log R · T)', 'O(log R · T)', 'O(log R · T)', '判定函数必须单调（R 是答案范围，T 是单次判定成本）'],
  ['哈希表查找', 'O(1)', 'O(1)', 'O(n)', '需要额外 O(n) 空间，且不支持范围查询'],
  ['平衡 BST 查找', 'O(log n)', 'O(log n)', 'O(log n)', '需要额外空间，但支持插入删除和范围查询'],
]) {
  console.log(name.padEnd(30) + best.padEnd(14) + avg.padEnd(16) + worst.padEnd(14) + req);
}

console.log('');
console.log('怎么选？');
console.log('');
console.log('  场景'.padEnd(42) + '推荐');
console.log('  ' + '-'.repeat(76));
for (const [scene, choice] of [
  ['数据无序，且只查一两次', '线性查找（排序成本不合算）'],
  ['数据静态有序，查询很多次', '二分查找 ★'],
  ['数据要频繁增删，还要查找', '平衡 BST / 哈希表（二分不适合动态数据）'],
  ['只需要"存不存在"', '哈希表（O(1)，比二分更快）'],
  ['需要"第一个 ≥ x"/"范围查询"', '二分查找 / 平衡 BST（哈希表做不到）'],
  ['答案是个整数且有单调性', '二分答案 ★'],
  ['在一本 1000 页的字典里找一个字', '二分（翻 10 次）'],
]) {
  console.log('  ' + scene.padEnd(42) + choice);
}

console.log('');
console.log('最后三句话：');
console.log('  1. 二分查找的思路 30 秒就能讲明白，但边界能让人调 2 小时 ——');
console.log('     所以一定要有【系统的自查清单】和【跑遍所有输入】的验证习惯。');
console.log('  2. 二分的本质不是"在数组里找数"，而是"在一个单调的判定上找分界点"。');
console.log('     想通这一点，你就能用它解决一堆看起来跟查找无关的问题（二分答案）。');
console.log('  3. 遇到"求最小/最大的某个值，且越大越容易（或越难）满足"这类题，');
console.log('     第一反应就应该是：能不能二分答案？');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
