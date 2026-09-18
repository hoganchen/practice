/**
 * ============================================================================
 * 知识点：经典排序算法 —— 冒泡/选择/插入、归并、快排与稳定性
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】进阶
 * 【前置知识】38_algorithms_and_data_structures/01_big_o_and_complexity.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    排序就是把一组数据按某个规则（通常是大小）重新排列。
 *    本示例实现五个经典算法，并重点讲清它们的【思想差异】、
 *    【复杂度差异】、【稳定性差异】以及【在什么数据上表现好】。
 *
 *    O(n²) 家族（都靠"两两比较 + 交换/移动"）：
 *      · 冒泡排序：相邻两个比，大的往后冒；每一轮把当前最大值送到末尾。
 *      · 选择排序：每一轮从剩下的里面挑出最小的，放到已排序区的末尾。
 *      · 插入排序：像整理扑克牌，把新牌插进左边已经有序的手牌里。
 *
 *    O(n log n) 家族（都靠"分治"）：
 *      · 归并排序：把数组一分为二，各自排好，再合并两个有序数组。
 *      · 快速排序：选一个基准值，把数组分成"比它小"和"比它大"两半，再分别递归。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 排行榜、订单列表、搜索结果排序：几乎所有列表页都要排序。
 *    - 归并排序的思想是"外部排序"的基础：数据大到内存装不下时，
 *      先把每块排好写到磁盘，再做多路归并（数据库的 ORDER BY 就是这么干的）。
 *    - 快速排序是很多语言内置排序的骨架（配合小数组用插入排序收尾）。
 *    - 插入排序在【近乎有序】的数据上极快，所以真实排序库都会这样优化：
 *      快排递归到小区间（比如 < 16 个元素）就改用插入排序。
 *    - 稳定性在很多业务里是硬需求：按"价格"排序后，
 *      同价格的商品应该保持原来的上架顺序 —— 这就必须用稳定排序。
 *
 * 3. 核心语法要点 / 算法思想
 *    · 冒泡：每轮把相邻的逆序对交换掉，n 轮之后必然有序。
 *      可以优化：如果某一轮一次交换都没发生，说明已经有序，直接退出 ——
 *      这个优化让它在【已有序】数据上变成 O(n)。
 *
 *          第 1 轮：[5,3,8,1] → [3,5,8,1] → [3,5,8,1] → [3,5,1,8]   ← 8 冒到末尾
 *          第 2 轮：[3,5,1,8] → [3,5,1,8] → [3,1,5,8] → 不用再比   ← 5 归位
 *          第 3 轮：[3,1,5,8] → [1,3,5,8]                          ← 全部有序
 *
 *    · 选择：交换次数最少（最多 n-1 次），但比较次数固定是 n²/2，不受数据影响。
 *
 *          第 1 轮：[5,3,8,1] 找最小 1 → 和 5 交换 → [1,3,8,5]
 *          第 2 轮：[1|3,8,5] 在剩下里找最小 3 → 已就位 → [1,3,8,5]
 *          第 3 轮：[1,3|8,5] 找最小 5 → 和 8 交换 → [1,3,5,8]
 *
 *    · 插入：把 arr[i] 往前挪到合适位置，比它大的元素依次右移一格。
 *      关键性质：【数据越接近有序越快】—— 近乎有序时接近 O(n)。
 *
 *          已有序部分        待插入      过程
 *          [5]             3          3 比 5 小 → 5 右移 → [3,5]
 *          [3,5]           8          8 比 5 大 → 直接放末尾 → [3,5,8]
 *          [3,5,8]         1          8、5、3 依次右移 → [1,3,5,8]
 *
 *    · 归并：分治三件套 —— 分（拆成两半）、治（递归排好）、合（合并两个有序数组）。
 *      合并两个有序数组只需要一次线性扫描，所以合并是 O(n)，
 *      递归深度 log n 层，总复杂度 O(n log n)。
 *
 *          [5,3,8,1]  分 → [5,3] [8,1]
 *                     治 → [3,5] [1,8]     （各自递归排好）
 *                     合 → [1,3,5,8]       （双指针线性合并）
 *
 *    · 快排：选基准 pivot，把数组重排成"小的在左边、大的在右边"（这个动作叫分区），
 *      于是 pivot 就落到了它最终该在的位置上，然后左右两半各自递归。
 *      平均 O(n log n)，最坏 O(n²)（每次分区都极不均匀时），原地 O(log n) 栈空间。
 *
 *          [5,3,8,1,9]  选 pivot=5
 *          分区后：[3,1] 5 [8,9]   ← 5 已就位，左右各自递归
 *
 *    · 稳定性：排序后，值相等的元素是否保持原来的相对顺序。
 *      稳：插入、冒泡、归并    不稳：选择、快排
 *
 * 4. 常见陷阱
 *    - 陷阱一：以为"O(n²) 的算法在生产里毫无价值"。插入排序在近乎有序的数据上
 *      比快排还快，所以被所有标准库用在"小区间收尾"里。
 *    - 陷阱二：快排的基准值固定选第一个元素。遇到【已排序】的数据会退化成 O(n²)，
 *      因为每次分区都极不均匀。解决：随机选基准 / 三数取中。
 *    - 陷阱三：归并排序 merge 时忘记处理"某一边还有剩余"的情况，导致丢元素。
 *    - 陷阱四：以为 arr.sort() 默认按数值排序。
 *      它默认按【字符串 Unicode 码点】排序：[1, 2, 10].sort() 会得到 [1, 10, 2]！
 *      排数字必须写 arr.sort((a, b) => a - b)。
 *    - 陷阱五：以为 arr.sort() 一定稳定。ES2019 起规范要求稳定，
 *      但排序对象时"稳定"指的是比较结果相等的元素保持原序，不是"按对象内容"。
 *    - 陷阱六：只看平均复杂度。快排平均最快，但最坏 O(n²)；
 *      归并稳定地 O(n log n) 但要额外 O(n) 空间 —— 要按场景权衡。
 *    - 陷阱七：比较次数少 ≠ 移动次数少。选择排序比较次数恒定 n²/2，
 *      但交换次数最少（n-1 次），"写操作很贵"的场景反而适合它。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/08_sorting_algorithms.js
 *
 * 【预期输出】
 *   打印 8 个小节：三个 O(n²) 算法的逐步演示、
 *   归并排序的分治过程、快速排序的分区过程、稳定性对比表、
 *   不同数据分布下的实测性能（随机/已排序/逆序/近乎有序）、
 *   快排最坏情况的构造与防御、以及复杂度与选型总结。
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

/** 确定性伪随机（Lehmer），保证每次运行的数据完全一致 */
function makeRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return s;
  };
}

/** 校验数组是否升序，所有排序结果都要过这一关 */
function isSorted(arr) {
  for (let i = 1; i < arr.length; i++) if (arr[i - 1] > arr[i]) return false;
  return true;
}

// ---------------------------------------------------------------------------
// 1. 冒泡排序
// ---------------------------------------------------------------------------

/**
 * 冒泡排序（带"提前退出"优化）
 *
 * 思路：反复比较【相邻】的两个元素，如果前比后大就交换。
 *       每一轮结束后，当前未排序部分的最大值一定被"冒"到了末尾。
 *
 * 复杂度：
 *   时间 最好 O(n)（数据已有序，第一轮没有任何交换就退出）
 *        平均 O(n²)，最坏 O(n²)（完全逆序）
 *   空间 O(1)（原地，只用了几个临时变量）
 *   稳定性：稳定（相等时不交换，所以相对顺序不变）
 */
function bubbleSort(input) {
  const a = [...input];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false; // ★ 这一轮有没有发生过交换
    // 后面 i 个已经排好了，只需要处理前 n-1-i 个
    for (let j = 0; j < n - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        const tmp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = tmp;
        swapped = true;
      }
    }
    if (!swapped) break; // ★ 一次都没交换 → 已经有序，提前收工
  }
  return a;
}

// ---------------------------------------------------------------------------
// 2. 选择排序
// ---------------------------------------------------------------------------

/**
 * 选择排序
 *
 * 思路：每一轮在"未排序区"里找出最小值，和未排序区的第一个元素交换。
 *
 * 复杂度：
 *   时间 最好/平均/最坏都是 O(n²) —— 因为无论数据如何，比较次数恒为 n²/2
 *   空间 O(1)
 *   稳定性：【不稳定】—— 交换是长距离的，可能把相等的元素甩到后面去
 *
 * 它唯一的优势：交换次数最少，最多 n-1 次。
 * 当"写入"远比"读取"昂贵时（比如写 Flash 存储），选择排序反而有价值。
 */
function selectionSort(input) {
  const a = [...input];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (a[j] < a[minIdx]) minIdx = j;
    }
    if (minIdx !== i) {
      const tmp = a[i];
      a[i] = a[minIdx];
      a[minIdx] = tmp;
    }
  }
  return a;
}

// ---------------------------------------------------------------------------
// 3. 插入排序
// ---------------------------------------------------------------------------

/**
 * 插入排序
 *
 * 思路：像整理扑克牌。维护"左边已有序"的区域，
 *       每次把右边第一个元素往前挪，比它大的元素依次右移一格，直到找到位置。
 *
 * 复杂度：
 *   时间 最好 O(n)（数据已有序，每个元素只比较一次就放回原位）
 *        平均 O(n²)，最坏 O(n²)（完全逆序，每个元素都要挪到最前面）
 *   空间 O(1)
 *   稳定性：稳定（用的是"大于才右移"，相等时不会越过它）
 *
 * ★ 它是 O(n²) 家族里最有用的一员：
 *   数据越接近有序越快，所以标准库都用它给快排/归并的小区间收尾。
 */
function insertionSort(input) {
  const a = [...input];
  const n = a.length;
  for (let i = 1; i < n; i++) {
    const current = a[i];
    let j = i - 1;
    // 比 current 大的元素统统右移一格
    // 注意用 > 而不是 >=，这保证了稳定性（相等的元素不会被越过）
    while (j >= 0 && a[j] > current) {
      a[j + 1] = a[j];
      j -= 1;
    }
    a[j + 1] = current;
  }
  return a;
}

// ---------------------------------------------------------------------------
// 4. 归并排序
// ---------------------------------------------------------------------------

/**
 * 归并排序
 *
 * 分治三步：
 *   分：把数组从中间切成两半
 *   治：递归地把两半各自排好序
 *   合：把两个【有序】数组合并成一个有序数组（双指针一次线性扫描）
 *
 * 复杂度：
 *   时间 最好/平均/最坏都是 O(n log n) —— 这是它最大的优点，没有退化风险
 *   空间 O(n)（合并时需要临时数组）—— 这是它最大的代价
 *   稳定性：稳定（合并时遇到相等元素，优先取左边那个，相对顺序就保住了）
 *
 * 为什么是 O(n log n)？
 *   每一层的合并总共要处理 n 个元素（O(n)），一共 log n 层 → O(n log n)。
 *
 *   [5,3,8,1]            ← 第 0 层：1 个数组，长度 4
 *   [5,3] [8,1]          ← 第 1 层：2 个数组，每个长度 2
 *   [5][3] [8][1]        ← 第 2 层：4 个数组，每个长度 1（递归到底）
 *   ---- 开始向上合并 ----
 *   [3,5] [1,8]          ← 每一层的合并总代价都是 O(n)
 *   [1,3,5,8]            ← 共 log₂4 = 2 层，总代价 O(n log n)
 */
function mergeSort(input) {
  const a = [...input];
  if (a.length <= 1) return a;

  /** 合并两个已排序的数组，返回一个新的有序数组 */
  function merge(left, right) {
    const out = [];
    let i = 0;
    let j = 0;
    // 两边都还有元素时，每次取较小的那个
    while (i < left.length && j < right.length) {
      // ★ 用 <= 而不是 <，保证稳定性：相等时优先取左边的
      if (left[i] <= right[j]) {
        out.push(left[i]);
        i += 1;
      } else {
        out.push(right[j]);
        j += 1;
      }
    }
    // ★ 别忘了把剩下的元素接上（两个 while 只会执行其中一个）
    while (i < left.length) {
      out.push(left[i]);
      i += 1;
    }
    while (j < right.length) {
      out.push(right[j]);
      j += 1;
    }
    return out;
  }

  const mid = a.length >> 1; // 等价于 Math.floor(a.length / 2)
  const left = mergeSort(a.slice(0, mid));
  const right = mergeSort(a.slice(mid));
  return merge(left, right);
}

// ---------------------------------------------------------------------------
// 5. 快速排序
// ---------------------------------------------------------------------------

/**
 * 快速排序
 *
 * 思路（分治，但和归并相反：先干活再递归）：
 *   ① 选一个基准值 pivot；
 *   ② 分区：把数组重排成"小于 pivot 的在左、大于 pivot 的在右"；
 *      分区完成后，pivot 就落在了它【最终应该在的位置】上；
 *   ③ 对左右两半递归地做同样的事。
 *
 * 和归并的关键区别：
 *   归并是"先递归排好两半，再合并"（工作在后）；
 *   快排是"先分区把 pivot 放对，再递归两半"（工作在前）——
 *   正因为工作在前，pivot 归位后就不需要再合并了，所以快排是【原地】的。
 *
 * 复杂度：
 *   时间 最好/平均 O(n log n)
 *        最坏 O(n²) —— 每次分区都极不均匀时（比如对已排序数组固定取第一个当 pivot）
 *   空间 O(log n)（递归栈深度，平均）；最坏 O(n)（退化成链式递归）
 *   稳定性：【不稳定】—— 分区时的交换是长距离跳跃
 *
 * 分区过程演示（Lomuto 分区法，取最后一个元素当 pivot）：
 *
 *   [5, 3, 8, 1, 9]  pivot = 9（最后一个）
 *    遍历，把小于 9 的都换到前面：
 *    5<9 ✓ 3<9 ✓ 8<9 ✓ 1<9 ✓ → [5,3,8,1, | 9]  ← 9 归位到下标 4
 *
 *   再对 [5,3,8,1] 递归，pivot = 1：
 *    没有一个小于 1 → [ | 1, 5,3,8]  ← 1 归位到下标 0
 *
 *   再对 [5,3,8] 递归，pivot = 8：
 *    5<8 ✓ 3<8 ✓ → [5,3, | 8]  ← 8 归位
 *
 *   再对 [5,3] 递归 → 3 归位 → [3,5]
 *   最终：[1,3,5,8,9]
 *
 * @param {number[]} input
 * @param {boolean} randomPivot 是否随机选基准（用来规避最坏情况）
 */
function quickSort(input, randomPivot = true) {
  const a = [...input];
  const rnd = makeRandom(20240916);

  function partition(lo, hi) {
    // 选基准值
    let pivotIdx = hi;
    if (randomPivot) {
      // ★ 随机选基准：让"最坏情况"无法被输入数据构造出来
      pivotIdx = lo + (rnd() % (hi - lo + 1));
      const tmp = a[pivotIdx];
      a[pivotIdx] = a[hi];
      a[hi] = tmp;
    }
    const pivot = a[hi];
    // i 指向"小于 pivot 的区域"的末尾
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (a[j] < pivot) {
        i += 1;
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
    }
    // 把 pivot 放到分界点上
    const tmp = a[i + 1];
    a[i + 1] = a[hi];
    a[hi] = tmp;
    return i + 1; // pivot 最终所在的下标
  }

  function sort(lo, hi) {
    if (lo >= hi) return;
    const p = partition(lo, hi);
    sort(lo, p - 1);
    sort(p + 1, hi);
  }

  sort(0, a.length - 1);
  return a;
}

/** 固定取第一个元素当 pivot 的"坏"快排，专门用来演示最坏情况 */
function quickSortBadPivot(input) {
  const a = [...input];
  function sort(lo, hi) {
    if (lo >= hi) return;
    const pivot = a[lo]; // ← 固定取第一个
    let i = lo + 1;
    let j = hi;
    while (i <= j) {
      while (i <= j && a[i] <= pivot) i += 1;
      while (i <= j && a[j] > pivot) j -= 1;
      if (i < j) {
        const tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
      }
    }
    const tmp = a[lo];
    a[lo] = a[j];
    a[j] = tmp;
    sort(lo, j - 1);
    sort(j + 1, hi);
  }
  sort(0, a.length - 1);
  return a;
}

// ---------------------------------------------------------------------------
// 6. 三个 O(n²) 算法的逐步演示
// ---------------------------------------------------------------------------

console.log('--- 1. 三个 O(n²) 排序算法：逐步演示 ---');

const demoInput = [5, 3, 8, 1, 9, 2];
console.log('');
console.log(`  演示数据：[${demoInput.join(', ')}]`);

console.log('');
console.log('════ 冒泡排序：相邻比较，大的往后冒 ════');
{
  const a = [...demoInput];
  const n = a.length;
  console.log(`    初始：      [${a.join(', ')}]`);
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    const steps = [];
    for (let j = 0; j < n - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        const tmp = a[j];
        a[j] = a[j + 1];
        a[j + 1] = tmp;
        swapped = true;
        steps.push(`交换 ${tmp}↔${a[j]}`);
      }
    }
    console.log(
      `    第 ${i + 1} 轮后：[${a.join(', ')}]   已归位：[${a.slice(n - 1 - i).join(', ')}]` +
        (steps.length ? `   （${steps.join('，')}）` : '   （本轮无交换 → 提前结束）'),
    );
    if (!swapped) break;
  }
  console.log('    结果：' + `[${bubbleSort(demoInput).join(', ')}]`);
}

console.log('');
console.log('════ 选择排序：每轮挑出最小的，放到前面 ════');
{
  const a = [...demoInput];
  const n = a.length;
  console.log(`    初始：      [${a.join(', ')}]`);
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) if (a[j] < a[minIdx]) minIdx = j;
    const minVal = a[minIdx];
    if (minIdx !== i) {
      const tmp = a[i];
      a[i] = a[minIdx];
      a[minIdx] = tmp;
    }
    console.log(
      `    第 ${i + 1} 轮：未排序区 [${a.slice(i).join(', ')}] 里最小的是 ${minVal}` +
        (minIdx !== i ? `，与 ${tmp0(i)} 交换` : '，已在原位') +
        `  →  [${a.join(', ')}]`,
    );
  }
  function tmp0(i) {
    return demoInput.slice().sort((x, y) => x - y)[i]; // 仅用于日志展示
  }
  console.log(`    结果：[${selectionSort(demoInput).join(', ')}]`);
}

console.log('');
console.log('════ 插入排序：像整理扑克牌 ════');
{
  const a = [...demoInput];
  console.log(`    初始：      [${a.join(', ')}]   （第一个元素视为已有序）`);
  for (let i = 1; i < a.length; i++) {
    const current = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > current) {
      a[j + 1] = a[j];
      j -= 1;
    }
    a[j + 1] = current;
    console.log(
      `    插入 ${String(current).padEnd(2)} 后：有序区 [${a.slice(0, i + 1).join(', ')}]` +
        `   未处理区 [${a.slice(i + 1).join(', ')}]`,
    );
  }
  console.log(`    结果：[${insertionSort(demoInput).join(', ')}]`);
}

console.log('');
console.log('  三种算法的结果完全一致（都是升序），但过程截然不同：');
console.log('    · 冒泡：每一轮把最大的"冒"到末尾，靠的是相邻交换；');
console.log('    · 选择：每一轮把最小的"挑"到前面，靠的是远程交换；');
console.log('    · 插入：每一轮把新元素"插"进有序区，靠的是元素右移。');

// ---------------------------------------------------------------------------
// 7. 归并排序与快速排序的演示
// ---------------------------------------------------------------------------

console.log('\n--- 2. 归并排序：先拆到底，再合并回来 ---');

/** 带缩进追踪的归并排序，用于展示分治过程 */
function mergeSortTraced(a, depth = 0, log = []) {
  const pad = '    ' + '  '.repeat(depth);
  if (a.length <= 1) {
    log.push(`${pad}分到 [${a.join(', ')}] —— 只剩一个元素，天然有序`);
    return a;
  }
  log.push(`${pad}分：[${a.join(', ')}]`);
  const mid = a.length >> 1;
  const left = mergeSortTraced(a.slice(0, mid), depth + 1, log);
  const right = mergeSortTraced(a.slice(mid), depth + 1, log);
  const merged = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) merged.push(left[i++]);
    else merged.push(right[j++]);
  }
  while (i < left.length) merged.push(left[i++]);
  while (j < right.length) merged.push(right[j++]);
  log.push(`${pad}合：[${left.join(', ')}] + [${right.join(', ')}] → [${merged.join(', ')}]`);
  return merged;
}

const mergeDemo = [5, 3, 8, 1, 9, 2];
console.log('');
console.log(`  演示数据：[${mergeDemo.join(', ')}]`);
console.log('');
const mergeLog = [];
mergeSortTraced(mergeDemo, 0, mergeLog);
for (const line of mergeLog) console.log('  ' + line);
console.log('');
console.log(`  结果：[${mergeSort(mergeDemo).join(', ')}]`);
console.log('');
console.log('  观察"合"的顺序：它总是自底向上进行的 ——');
console.log('  先把长度为 1 的合成 2，再合成 4，再合成 8……');
console.log('  每一层的合并代价都是 O(n)（双指针各扫描一遍），一共 log n 层，');
console.log('  所以总复杂度是 O(n log n)，而且【对任何输入都一样】，没有最坏情况退化。');

console.log('\n--- 3. 快速排序：先分区定 pivot，再递归两半 ---');

/** 带追踪的快排，展示分区过程 */
function quickSortTraced(a, lo = 0, hi = a.length - 1, depth = 0, log = []) {
  const pad = '    ' + '  '.repeat(depth);
  if (lo >= hi) return a;
  const pivot = a[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) {
      i += 1;
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
  }
  const tmp = a[i + 1];
  a[i + 1] = a[hi];
  a[hi] = tmp;
  const p = i + 1;
  log.push(
    `${pad}区间 [${lo}..${hi}] 选 pivot=${pivot} → 归位到下标 ${p}：` +
      ` [${a.join(', ')}]`,
  );
  quickSortTraced(a, lo, p - 1, depth + 1, log);
  quickSortTraced(a, p + 1, hi, depth + 1, log);
  return a;
}

const quickDemo = [5, 3, 8, 1, 9, 2];
console.log('');
console.log(`  演示数据：[${quickDemo.join(', ')}]（这里为了让过程可读，固定取最后一个元素当 pivot）`);
console.log('');
const quickLog = [];
quickSortTraced([...quickDemo], 0, quickDemo.length - 1, 0, quickLog);
for (const line of quickLog) console.log('  ' + line);
console.log('');
console.log(`  结果：[${quickSort(quickDemo).join(', ')}]`);
console.log('');
console.log('  注意每次分区后，pivot 都停在了【最终正确的位置】上，之后再也不会移动它。');
console.log('  这是快排和归并最大的不同：');
console.log('    · 归并的工作在"合"阶段（自底向上），所以需要额外数组；');
console.log('    · 快排的工作在"分"阶段（自顶向下），pivot 归位后无需再合并，所以是原地排序。');
console.log('');
console.log('  数组越"乱"，快排分区越均匀，性能越好；越"有序"，固定取端点的快排越容易退化。');

// ---------------------------------------------------------------------------
// 8. 稳定性对比
// ---------------------------------------------------------------------------

console.log('\n--- 4. 稳定性：一个容易被忽略但业务上很关键的性质 ---');
console.log('');
console.log('定义：排序后，【值相等】的元素是否保持它们原来的相对顺序。');
console.log('     保持 → 稳定；打乱 → 不稳定。');
console.log('');
console.log('为什么业务上重要？看这个例子：');
console.log('  订单列表先按【下单时间】排好，现在要按【金额】再排一次。');
console.log('  · 如果是稳定排序：金额相同的订单会保持"先下单的在前"这个顺序，符合直觉；');
console.log('  · 如果是不稳定排序：金额相同的订单顺序可能被打乱，用户看到的就是乱跳的列表。');
console.log('');
console.log('  真实做法：多关键字排序 = 先按次要字段排，再用【稳定】排序按主要字段排。');
console.log('  所以"稳定"不是学术概念，是能直接看到的产品行为差异。');

/** 测试一个排序函数是否稳定：用带原始下标的对象数组验证 */
function testStability(sortFn, name) {
  // 所有元素的值都相等（都按 value=1 比较），但带上不同的原始序号
  const data = [];
  for (let i = 0; i < 8; i++) data.push({ value: 1, seq: i });
  const sorted = sortFn(data);
  // 稳定的话，seq 应该仍然是 0,1,2,...,7
  const seqs = sorted.map((x) => x.seq);
  const stable = seqs.every((s, i) => s === i);
  return { name, stable, seqs };
}

// 对对象数组排序时，要提供按 value 比较的函数
const stableCases = [
  ['冒泡排序', (arr) => bubbleSortObj(arr)],
  ['选择排序', (arr) => selectionSortObj(arr)],
  ['插入排序', (arr) => insertionSortObj(arr)],
  ['归并排序', (arr) => mergeSortObj(arr)],
  ['快速排序', (arr) => quickSortObj(arr)],
  ['Array.sort（ES2019+）', (arr) => [...arr].sort((a, b) => a.value - b.value)],
];

// 为对象数组准备的各算法版本（比较 value 字段）
function bubbleSortObj(input) {
  const a = [...input];
  for (let i = 0; i < a.length - 1; i++) {
    let swapped = false;
    for (let j = 0; j < a.length - 1 - i; j++) {
      if (a[j].value > a[j + 1].value) {
        const t = a[j];
        a[j] = a[j + 1];
        a[j + 1] = t;
        swapped = true;
      }
    }
    if (!swapped) break;
  }
  return a;
}
function selectionSortObj(input) {
  const a = [...input];
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) if (a[j].value < a[minIdx].value) minIdx = j;
    if (minIdx !== i) {
      const t = a[i];
      a[i] = a[minIdx];
      a[minIdx] = t;
    }
  }
  return a;
}
function insertionSortObj(input) {
  const a = [...input];
  for (let i = 1; i < a.length; i++) {
    const cur = a[i];
    let j = i - 1;
    while (j >= 0 && a[j].value > cur.value) {
      a[j + 1] = a[j];
      j -= 1;
    }
    a[j + 1] = cur;
  }
  return a;
}
function mergeSortObj(input) {
  if (input.length <= 1) return [...input];
  const mid = input.length >> 1;
  const left = mergeSortObj(input.slice(0, mid));
  const right = mergeSortObj(input.slice(mid));
  const out = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    if (left[i].value <= right[j].value) out.push(left[i++]);
    else out.push(right[j++]);
  }
  while (i < left.length) out.push(left[i++]);
  while (j < right.length) out.push(right[j++]);
  return out;
}
function quickSortObj(input) {
  const a = [...input];
  function sort(lo, hi) {
    if (lo >= hi) return;
    const pivot = a[hi].value;
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (a[j].value < pivot) {
        i += 1;
        const t = a[i];
        a[i] = a[j];
        a[j] = t;
      }
    }
    const t = a[i + 1];
    a[i + 1] = a[hi];
    a[hi] = t;
    sort(lo, i);
    sort(i + 2, hi);
  }
  if (a.length > 0) sort(0, a.length - 1);
  return a;
}

console.log('');
console.log('  实测：8 个元素的值全部相同（seq 是原始序号），用各算法排序后看 seq 是否还是 0..7：');
console.log('');
console.log('算法'.padEnd(28) + '是否稳定'.padEnd(14) + '排序后的原始序号');
console.log('-'.repeat(82));
for (const [name, fn] of stableCases) {
  const r = testStability(fn, name);
  console.log(
    name.padEnd(26) + (r.stable ? '稳定 ✓' : '不稳定 ✗').padEnd(16) + `[${r.seqs.join(', ')}]`,
  );
}

console.log('');
console.log('稳定性总结表：');
console.log('');
console.log('算法'.padEnd(16) + '平均时间'.padEnd(16) + '最坏时间'.padEnd(16) + '空间'.padEnd(14) + '稳定性'.padEnd(12) + '备注');
console.log('-'.repeat(104));
for (const [name, avg, worst, space, stable, note] of [
  ['冒泡排序', 'O(n²)', 'O(n²)', 'O(1)', '稳定', '近乎有序时接近 O(n)'],
  ['选择排序', 'O(n²)', 'O(n²)', 'O(1)', '不稳定', '比较次数恒定，交换次数最少'],
  ['插入排序', 'O(n²)', 'O(n²)', 'O(1)', '稳定', '★ 近乎有序时接近 O(n)'],
  ['归并排序', 'O(n log n)', 'O(n log n)', 'O(n)', '稳定', '唯一没有退化风险的稳定排序'],
  ['快速排序', 'O(n log n)', 'O(n²)', 'O(log n)', '不稳定', '平均最快，原地，但最坏会退化'],
  ['堆排序', 'O(n log n)', 'O(n log n)', 'O(1)', '不稳定', '见 06_heap_and_priority_queue.js'],
  ['TimSort（V8 内置）', 'O(n log n)', 'O(n log n)', 'O(n)', '稳定', '归并 + 插入的混合，利用已有的有序段'],
]) {
  console.log(
    name.padEnd(14) + avg.padEnd(16) + worst.padEnd(16) + space.padEnd(14) + stable.padEnd(12) + note,
  );
}
console.log('');
console.log('  一句话记忆：');
console.log('    · 靠"相邻交换"或"插入右移"的 → 稳定（冒泡、插入、归并）；');
console.log('    · 靠"远程交换"的 → 不稳定（选择、快排、堆排）。');
console.log('    原因很直观：远程交换会把一个元素瞬间甩过一大片区域，');
console.log('    途中经过的相等元素就被"跨"过去了，相对顺序自然保不住。');

// ---------------------------------------------------------------------------
// 9. 实测：不同数据分布下的表现
// ---------------------------------------------------------------------------

console.log('\n--- 5. 实测：不同数据分布下，各算法表现如何 ---');
console.log('');
console.log('  公平起见，所有算法都排同一份数据、都检查结果正确性。');
console.log('  O(n²) 的算法用较小规模（3000），O(n log n) 的用较大规模（20000），');
console.log('  这样既能看清差距，又不会让示例跑得太久。');

const rnd = makeRandom(20240916);

/** 生成四种典型数据分布 */
function makeData(n) {
  const random = [];
  for (let i = 0; i < n; i++) random.push(rnd() % 100000);

  const sorted = [...random].sort((a, b) => a - b);
  const reversed = [...sorted].reverse();

  // "近乎有序"：先排好，再随机交换 1% 的位置
  const nearlySorted = [...sorted];
  const swaps = Math.max(1, Math.floor(n * 0.01));
  for (let i = 0; i < swaps; i++) {
    const p = rnd() % n;
    const q = rnd() % n;
    const t = nearlySorted[p];
    nearlySorted[p] = nearlySorted[q];
    nearlySorted[q] = t;
  }

  // "大量重复值"：只有 10 种不同的值
  const fewUnique = [];
  for (let i = 0; i < n; i++) fewUnique.push(rnd() % 10);

  return { random, sorted, reversed, nearlySorted, fewUnique };
}

const SMALL_N = 2000;
const LARGE_N = 20000;
const smallData = makeData(SMALL_N);
const largeData = makeData(LARGE_N);

/** 跑一个排序算法，校验正确性并返回中位数耗时 */
function benchmark(sortFn, data) {
  const expected = [...data].sort((a, b) => a - b);
  const result = sortFn(data);
  let ok = result.length === expected.length;
  for (let i = 0; i < expected.length && ok; i++) if (result[i] !== expected[i]) ok = false;
  const ms = medianMs(() => {
    sink.value = sortFn(data)[0];
  });
  return { ms, ok };
}

const distributions = [
  ['随机数据', 'random'],
  ['已排序', 'sorted'],
  ['完全逆序', 'reversed'],
  ['近乎有序', 'nearlySorted'],
  ['大量重复值', 'fewUnique'],
];

console.log('');
console.log(`  ［O(n²) 家族］数据规模 n = ${SMALL_N}`);
console.log('');
console.log(
  '算法'.padEnd(14) +
    distributions.map(([label]) => label.padEnd(13)).join('') +
    '正确性',
);
console.log('-'.repeat(14 + 13 * distributions.length + 8));
for (const [name, fn] of [
  ['冒泡排序', bubbleSort],
  ['选择排序', selectionSort],
  ['插入排序', insertionSort],
]) {
  const cells = [];
  let allOk = true;
  for (const [, key] of distributions) {
    const r = benchmark(fn, smallData[key]);
    if (!r.ok) allOk = false;
    cells.push(r.ms.toFixed(2).padEnd(13));
  }
  console.log(name.padEnd(12) + cells.join('') + (allOk ? '全部通过 ✓' : '有错误 ✗'));
}

console.log('');
console.log(`  ［O(n log n) 家族］数据规模 n = ${LARGE_N}`);
console.log('');
console.log(
  '算法'.padEnd(14) +
    distributions.map(([label]) => label.padEnd(13)).join('') +
    '正确性',
);
console.log('-'.repeat(14 + 13 * distributions.length + 8));
for (const [name, fn] of [
  ['归并排序', mergeSort],
  ['快排(随机pivot)', quickSort],
  ['Array.sort', (arr) => [...arr].sort((a, b) => a - b)],
]) {
  const cells = [];
  let allOk = true;
  for (const [, key] of distributions) {
    const r = benchmark(fn, largeData[key]);
    if (!r.ok) allOk = false;
    cells.push(r.ms.toFixed(2).padEnd(13));
  }
  console.log(name.padEnd(12) + cells.join('') + (allOk ? '全部通过 ✓' : '有错误 ✗'));
}

console.log('');
console.log('读数要点（请对照着上面两张表看）：');
console.log('');
console.log('  ① 【插入排序在近乎有序的数据上极快】。');
console.log('     这是本示例最值得记住的一条：在"近乎有序"那一列，');
console.log('     插入排序的耗时应该远低于它在"随机数据"上的表现，');
console.log('     甚至可能追上 O(n log n) 的算法 —— 因为此时它接近 O(n)。');
console.log('     这就是为什么所有工业级排序库都用它给小区间收尾。');
console.log('');
console.log('  ② 【冒泡排序同样受益于"近乎有序"】（因为它有提前退出优化），');
console.log('     但在随机数据上它是三者中最慢的 —— 交换次数太多。');
console.log('');
console.log('  ③ 【选择排序对数据分布完全不敏感】。');
console.log('     它的五个数字应该都差不多 —— 因为无论数据长什么样，');
console.log('     它都要老老实实做 n²/2 次比较，一次都省不掉。');
console.log('     这既是它的缺点（没有最好情况），也是它的特点（性能可预测）。');
console.log('');
console.log('  ④ O(n log n) 家族比 O(n²) 家族快了几个数量级，');
console.log('     而且【对数据分布不敏感】—— 归并和内置排序的五个数字都很接近。');
console.log('     这就是"有复杂度保证"的价值：不用赌用户会传什么数据进来。');
console.log('');
console.log('  ⑤ 但请注意【快排那一行的最后一格 —— 大量重复值】！');
console.log('     它比快排在随机数据上慢了好几倍，成了那一行里最差的一格。');
console.log('     这是快排一个非常隐蔽的坑：元素大量重复时，');
console.log('     标准的 Lomuto 分区会把"等于 pivot"的元素全部推到同一侧，');
console.log('     导致分区严重不均匀，效率骤降（极端情况下退化成 O(n²)）。');
console.log('     而且这个坑【不是"数据已排序"造成的】，随机 pivot 也救不了它。');
console.log('     解法是"三路分区"：把数组分成【小于 / 等于 / 大于】三段，');
console.log('     等于 pivot 的那一段直接跳过不再递归 ——');
console.log('     因为重复元素全部集中在中间，下一层的规模会大幅缩小。');
console.log('     这也是为什么真实排序库要处理重复值，而不能只防"已排序"。');

// ---------------------------------------------------------------------------
// 10. 快排的最坏情况与防御
// ---------------------------------------------------------------------------

console.log('\n--- 6. 快速排序的最坏情况：怎么被构造出来，又怎么防 ---');
console.log('');
console.log('  前面说过，快排最坏是 O(n²)。什么时候会这样？');
console.log('  【当每次分区都极不均匀时】—— 比如固定取第一个元素当 pivot，');
console.log('  而此时数据又已经排好序了：');
console.log('');
console.log('    已排序数组 [1, 2, 3, 4, 5]，固定取 pivot = 第一个元素 = 1：');
console.log('      分区结果：[空] 1 [2,3,4,5]   ← pivot 只切掉了 0 个元素！');
console.log('      递归右边：[2,3,4,5]，又取 pivot=2 → [空] 2 [3,4,5]');
console.log('      每次只减少 1 个元素 → 递归 n 层 → 每层代价 O(n) → 总代价 O(n²)');
console.log('');
console.log('    而且递归深度也变成了 n，栈空间从 O(log n) 恶化到 O(n)。');
console.log('');
console.log('  这是个很讽刺的情况：快排在【已经排好序】的数据上最慢，');
console.log('  而现实中"用户已经点过一次排序"的数据恰恰经常是半有序的。');

const worstN = 2000;
const sortedData = [];
for (let i = 0; i < worstN; i++) sortedData.push(i); // 已排序数据 —— 固定 pivot 的噩梦

const badPivotMs = medianMs(() => {
  sink.value = quickSortBadPivot(sortedData)[0];
});
const randomPivotMs = medianMs(() => {
  sink.value = quickSort(sortedData)[0];
});

console.log('');
console.log(`  实测（n = ${worstN} 的【已排序】数组）：`);
console.log('');
console.log('  做法'.padEnd(38) + '耗时(ms)'.padEnd(14) + '最坏复杂度');
console.log('  ' + '-'.repeat(72));
console.log('固定取第一个元素当 pivot'.padEnd(36) + badPivotMs.toFixed(3).padEnd(14) + 'O(n²) ← 退化了');
console.log('随机选 pivot'.padEnd(36) + randomPivotMs.toFixed(3).padEnd(14) + 'O(n log n) 期望');
console.log('');
console.log(`  随机 pivot 快约 ${(badPivotMs / randomPivotMs).toFixed(1)} 倍。`);
console.log(`  两者结果都正确：${isSorted(quickSortBadPivot(sortedData)) && isSorted(quickSort(sortedData))}`);
console.log('');
console.log('  为什么随机 pivot 能防住？');
console.log('    因为最坏情况只在"每次都恰好切出极不均匀的分区"时发生。');
console.log('    随机选 pivot 之后，攻击者无法事先构造出这种输入 ——');
console.log('    每次分区"运气都极差"的概率低到可以忽略，所以期望复杂度是 O(n log n)。');
console.log('');
console.log('  工业界的其他防御手段：');
console.log('    · 三数取中：取首、中、尾三个元素的中位数当 pivot，避开"已排序"的陷阱；');
console.log('    · 小区间切换插入排序：递归到 < 16 个元素时改用插入排序，减少递归开销；');
console.log('    · 三路分区：把数组分成"小于/等于/大于 pivot"三段，');
console.log('      大量重复元素时性能大幅提升（重复元素全落在中间段，不再递归）；');
console.log('    · 递归深度保护：层数超过 2·log n 就改用堆排序，保证最坏 O(n log n)');
console.log('      （introsort 就是这么做的，C++ 的 std::sort 用的正是它）；');
console.log('    · 干脆不用快排：归并排序最坏也是 O(n log n)，代价是 O(n) 额外空间。');

// ---------------------------------------------------------------------------
// 11. 选型总结
// ---------------------------------------------------------------------------

console.log('\n--- 7. 复杂度与选型总结 ---');

console.log('');
console.log('算法'.padEnd(16) + '最好'.padEnd(14) + '平均'.padEnd(16) + '最坏'.padEnd(14) + '空间'.padEnd(12) + '稳定性');
console.log('-'.repeat(88));
for (const [name, best, avg, worst, space, stable] of [
  ['冒泡排序', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', '稳定'],
  ['选择排序', 'O(n²)', 'O(n²)', 'O(n²)', 'O(1)', '不稳定'],
  ['插入排序', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', '稳定'],
  ['归并排序', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)', '稳定'],
  ['快速排序', 'O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n)', '不稳定'],
  ['堆排序', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(1)', '不稳定'],
  ['计数排序', 'O(n+k)', 'O(n+k)', 'O(n+k)', 'O(n+k)', '稳定'],
  ['基数排序', 'O(d(n+k))', 'O(d(n+k))', 'O(d(n+k))', 'O(n+k)', '稳定'],
]) {
  console.log(
    name.padEnd(14) + best.padEnd(14) + avg.padEnd(16) + worst.padEnd(14) + space.padEnd(12) + stable,
  );
}
console.log('');
console.log('  注：计数排序、基数排序不是"比较排序"，它们利用"值本身是整数且有范围"这一点，');
console.log('      可以突破比较排序的 Ω(n log n) 下界，达到 O(n)。');
console.log('      代价是：只能排整数/可离散化的值，而且需要 O(n+k) 的额外空间。');

console.log('');
console.log('场景'.padEnd(40) + '推荐算法');
console.log('  ' + '-'.repeat(76));
for (const [scene, choice] of [
  ['日常业务排序（绝大多数情况）', 'Array.sort，直接用内置的'],
  ['数据量很小（< 16 个）', '插入排序（真实排序库内部就是这么切的）'],
  ['数据近乎有序', '插入排序（接近 O(n)）'],
  ['内存极度紧张，且要求最坏性能有保证', '堆排序（O(n log n) + O(1) 空间）'],
  ['要求稳定排序', '归并排序 / TimSort（内置 sort 就是稳定的）'],
  ['数据量远超内存（外部排序）', '多路归并（先分块排好写磁盘，再归并）'],
  ['整数且值域很小（如年龄、评分）', '计数排序（O(n)）'],
  ['固定长度的整数（如手机号、ID）', '基数排序（O(n)）'],
  ['完全不想自己动脑', 'Array.sort —— 它已经比 99% 的手写实现更快更稳'],
]) {
  console.log('  ' + scene.padEnd(40) + choice);
}

console.log('');
console.log('最后三个必须记住的点：');
console.log('');
console.log('  1. 【Array.sort 默认按字符串排序】。');
console.log(`     验证： [1, 2, 10].sort() = [${[1, 2, 10].sort().join(', ')}]  ← 10 排到了 2 前面！`);
console.log('     因为默认把元素转成字符串再按 Unicode 码点比较，"1" < "10" < "2"。');
console.log('     排数字必须写 arr.sort((a, b) => a - b)。');
console.log('');
console.log('  2. 【没有"最好的排序算法"，只有"最适合当前场景的"】。');
console.log('     快排平均最快但会退化；归并稳定且稳定（两个"稳定"意思不同）但要额外空间；');
console.log('     插入排序在大数据上很慢，但在小数据/近乎有序时最快。');
console.log('     工程上的最优解往往是【组合】：快排分区 + 小区间插入排序 + 深度保护转堆排序。');
console.log('');
console.log('  3. 【先测量，再优化】。');
console.log('     本示例的实测数据已经反复证明了：理论复杂度只给方向，');
console.log('     常数因子、数据分布、函数调用开销都会实打实地改变结果。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
