/**
 * ============================================================================
 * 知识点：并查集（Union-Find / Disjoint Set Union）—— 路径压缩、按秩合并与动态连通性
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】进阶
 * 【前置知识】38_algorithms_and_data_structures/05_binary_search_tree.js
 *            38_algorithms_and_data_structures/07_graph_traversal.js（连通分量的 DFS 做法）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    并查集是一种专门维护【等价关系】的数据结构，它只回答两个问题：
 *
 *      find(x)          —— x 属于哪个集合？（返回集合的"代表元"）
 *      union(x, y)      —— 把 x 和 y 所在的集合合并成一个
 *      connected(x, y)  —— x 和 y 在不在同一个集合里？（本质是 find(x) === find(y)）
 *
 *    实现方式极其朴素：每个元素记一个"父节点"，一路往上找，走到"自己是自己的父亲"
 *    的那个元素就是代表元（也叫根）。所以每个集合就是一棵【树】，
 *    整片森林就是整个数据结构 —— 一个 parent 数组就够了。
 *
 *      初始化：每人自成一家（自己是自己的父亲）    合并 3 和 4 之后：把 4 的根挂到 3 的根下
 *
 *        0    1    2    3    4                      0    1    2    3
 *                                                                    │
 *                                                                   4      ← 4 现在是 3 的孩子
 *
 *      find(4) → 4 的父亲是 3，3 的父亲是 3（自己）→ 代表元是 3
 *      connected(3, 4) → find(3) === find(4) → true
 *
 *    ★ 两个关键优化（这是并查集从"能用"变成"近乎 O(1)"的全部秘密）：
 *
 *      ① 路径压缩：find 的时候，把沿途所有节点【直接挂到根上】。
 *         下次再 find 这些节点就是一步到位。
 *
 *            find(4) 之前         find(4) 之后（顺手压平）
 *              0                      0
 *              │                      ├── 2
 *              1                       ├── 3
 *              │                       └── 4
 *              2
 *              │
 *              3
 *              │
 *              4
 *
 *      ② 按秩合并（按大小合并）：合并两棵树时，把【矮的/小的】树挂到【高的/大的】树下，
 *         避免长出长长的链。只有当两棵树一样高时，合并后的高度才 +1。
 *
 *    单用任一个优化，均摊复杂度都是 O(log n)；
 *    两个一起用，均摊复杂度降到 O(α(n)) —— 阿克曼函数的反函数，
 *    在 n 小于宇宙原子总数（10⁸⁰）时 α(n) ≤ 5，所以可以当成 O(1) 看。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 朋友圈 / 社交网络："这两个人是不是一个圈子的""把两个圈子合并"
 *      （LeetCode 547 朋友圈就是并查集的入门题）。
 *    - 账号合并：同一个人的多个邮箱/手机号账号，只要有一个共同联系方式就合并 ——
 *      这是并查集最经典的工程应用（用户身份归一化、风控黑名单合并）。
 *    - Kruskal 最小生成树：按边权从小到大加边，用并查集判断"这条边的两端是否已经连通"，
 *      连通了就跳过（否则成环）。见 15_weighted_graphs.js。
 *    - 网络连通性：机房掉线后还剩几个独立子网 / 两个节点之间能否通信。
 *    - 图片处理：把颜色相近的相邻像素并成一个区域（连通区域标记、抠图、滤镜）。
 *    - 编译器与静态分析：变量等价类合并、类型联合、别名分析。
 *    - 游戏：迷宫生成（随机打通墙，用并查集判断是否已连通）、地图势力划分。
 *
 * 3. 核心语法要点 / 算法思想
 *    · 数据表示：只有一个 parent 数组（外加可选的 rank/size 数组）。
 *      初始 parent[i] = i，表示"每个元素自成一个集合"。
 *    · find 是递归/迭代地往上找根，天然可以写成两趟：
 *      第一趟找到根，第二趟把沿途节点全挂到根上（路径压缩）。
 *    · union 是"找到两个根，把一个根挂到另一个根下"。
 *      注意是【挂根】而不是挂元素本身 —— 挂错的话整个集合会被撕裂。
 *    · 连通分量个数：初始为 n，每次成功的 union（两个根不同）让计数 -1。
 *      于是"有多少个集合"是 O(1) 就能拿到的。
 *    · 判断加边是否成环：无向图里，如果一条边的两个端点【已经连通】，
 *      再加这条边就必然成环。这是并查集最常用的判定之一。
 *    · 可回滚并查集：不压缩路径、只按秩合并，就能支持"撤销上一次合并"（配合栈记录）。
 *      这是"按秩合并"在工程上额外的好处。
 *
 * 4. 常见陷阱
 *    - 陷阱一：union 时挂错了对象（把 x 挂到 y 下，而不是把 rootX 挂到 rootY 下）。
 *      症状是集合莫名其妙地分裂或丢元素，而且极难调试。
 *    - 陷阱二：以为并查集能回答"两点间的最短距离"。它只知道【在不在同一个集合】，
 *      不保留任何路径信息，这是它快的原因，也是它的能力边界。
 *    - 陷阱三：并查集【不支持删除边】（不支持集合分裂）。只用它处理"不断合并"的场景；
 *      如果要动态删边，得用 LCT（动态树）之类的重型结构。
 *    - 陷阱四：把"每两个点都查一次连通性"写成对每个点跑一次 DFS。
 *      单次 DFS 是 O(V+E)，但每次查询都重跑就退化成了 O(Q × (V+E))；
 *      并查集是"预处理一次 O(E α)，之后每次查询 O(α)"。
 *    - 陷阱五：哈希表做元素索引时忘了处理"元素第一次出现"的情况，
 *      导致 parent 里没有这个键 —— 需要一层"名字 → 下标"的映射（本示例的命名并查集）。
 *    - 陷阱六：路径压缩会改变树形，所以【撤销合并】时必须关闭路径压缩，
 *      否则回滚会还原出一棵错乱的树。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/12_union_find.js
 *
 * 【预期输出】
 *   打印 8 个小节：从朴素实现到两种优化的演进与实测、并查集的基本操作演示、
 *   连通分量计数、动态加边判环、与"每点一次 DFS"的复杂度对比与实测、
 *   两个工程实战（朋友圈 / 账号合并）、可回滚并查集、
 *   以及复杂度对照表与"何时用哪个"的决策表。
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
// 1. 三代实现：朴素 → 路径压缩 → 路径压缩 + 按秩合并
// ---------------------------------------------------------------------------

console.log('--- 1. 并查集的三代实现：优化的意义 ---');
console.log('');
console.log('并查集的代码短到不可思议，但它经历了三代演进，每一代都解决一个具体问题。');
console.log('');

/**
 * 【第一代】朴素并查集（quick-union）。
 *
 * parent[i] = i 的父亲。find 一路往上走到根；union 直接把一个根挂到另一个根下。
 *
 * 问题：union 时【永远把后者的根挂到前者】。如果数据是
 * (1,2) (2,3) (3,4) … 这样顺序给出的，会退化成一条长度为 n 的链，
 * find(n) 要爬 n 层，整体复杂度退化到 O(n²)。
 */
class NaiveUnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.count = n; // 连通分量个数
  }

  find(x) {
    // 没做任何优化：顺着父指针一路爬到根
    while (this.parent[x] !== x) x = this.parent[x];
    return x;
  }

  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    this.parent[ra] = rb; // ← 永远是 ra 挂到 rb 下，不管两边大小
    this.count -= 1;
    return true;
  }

  connected(a, b) {
    return this.find(a) === this.find(b);
  }
}

/**
 * 【第二代】加了路径压缩。
 *
 * find 的时候把沿途所有节点直接挂到根上。第一次 find 之后，链就被压平了，
 * 后续 find 几乎是 O(1)。均摊复杂度 O(log n)（实际远好于 log n）。
 *
 * 但只靠路径压缩有个前提：你得先 find 一次。如果 union 的顺序特别刁钻，
 * 在第一次 find 之前仍可能长出长链（虽然影响有限）。
 */
class PathCompressedUnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.count = n;
  }

  find(x) {
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root]; // 第一趟：找根
    while (this.parent[x] !== root) {
      const next = this.parent[x]; // 第二趟：沿途全部改挂到根上
      this.parent[x] = root;
      x = next;
    }
    return root;
  }

  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    this.parent[ra] = rb;
    this.count -= 1;
    return true;
  }

  connected(a, b) {
    return this.find(a) === this.find(b);
  }
}

/**
 * 【第三代】路径压缩 + 按秩合并（也叫按大小合并）—— 生产环境的标准实现。
 *
 * 按秩合并：维护每棵树的高度（rank）。合并时把【矮的】挂到【高的】下面。
 *  - rankA < rankB  → A 挂到 B 下，B 的高度不变；
 *  - rankA > rankB  → B 挂到 A 下，A 的高度不变；
 *  - rankA === rankB → 随便挂，但被挂的那棵树高度 +1。
 *
 * 为什么能保证树高是 O(log n)？因为一个节点的深度每增加 1，
 * 就说明它所在的树至少翻了一倍大 —— 所以最大深度不超过 log₂n。
 *
 * 两个优化一起用：均摊 O(α(n))，α 是阿克曼函数的反函数，实践中 ≤ 5，视作 O(1)。
 */
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0); // 树高的上界（路径压缩后只是"秩"不再是真实高度）
    this.size = new Array(n).fill(1); // 集合大小，按大小合并时用这个更直观
    this.count = n; // 当前连通分量个数
    this.findCalls = 0; // 统计用：find 总的爬升步数
    this.findSteps = 0;
    this.unionCount = 0;
  }

  /** 找根 + 路径压缩（迭代版，避免递归爆栈） */
  find(x) {
    let root = x;
    this.findCalls += 1;
    while (this.parent[root] !== root) {
      root = this.parent[root];
      this.findSteps += 1;
    }
    // 路径压缩：把 x 到根这条链上的所有节点都直接挂到根上
    while (this.parent[x] !== root) {
      const next = this.parent[x];
      this.parent[x] = root;
      x = next;
    }
    return root;
  }

  /** 递归版 find —— 短小精悍，但深链会爆栈（图很深时用迭代版） */
  findRecursive(x) {
    if (this.parent[x] !== x) this.parent[x] = this.findRecursive(this.parent[x]);
    return this.parent[x];
  }

  /** 合并 a、b 所在的集合；返回是否真的发生了合并 */
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false; // 已经在同一个集合，什么都不用做
    this.unionCount += 1;
    // 按秩（高度）合并：矮的挂到高的下面
    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb;
      this.size[rb] += this.size[ra];
    } else if (this.rank[ra] > this.rank[rb]) {
      this.parent[rb] = ra;
      this.size[ra] += this.size[rb];
    } else {
      this.parent[rb] = ra; // 高度相同时随便挂一个
      this.size[ra] += this.size[rb];
      this.rank[ra] += 1; // ★ 只有高度相同时合并，新树才会变高
    }
    this.count -= 1; // 合并成功 = 分量数减一
    return true;
  }

  /** 判断两个元素是否连通（这就是并查集唯一的"查询"能力） */
  connected(a, b) {
    return this.find(a) === this.find(b);
  }

  /** 集合大小 */
  sizeOf(x) {
    return this.size[this.find(x)];
  }

  /** 分组：把每个集合的元素列出来，用于打印结果 */
  groups() {
    const map = new Map();
    for (let i = 0; i < this.parent.length; i++) {
      const r = this.find(i);
      if (!map.has(r)) map.set(r, []);
      map.get(r).push(i);
    }
    return [...map.values()];
  }
}

// --- 演示：三代实现在"顺序合并成一条链"这种最坏输入下的差别 ---
console.log('构造一个专门坑第一代的输入：按 0-1、1-2、2-3…的顺序合并。');
console.log('（每一对都是"新元素挂到已有集合上"，朴素实现会长出一条长长的链）');
console.log('');

const CHAIN_N = 2000;
{
  /** 直接数 parent 链的深度 —— 绕开 find，才能看到"未经压缩的真实树形" */
  const maxDepth = (uf) => {
    let max = 0;
    for (let i = 0; i < uf.parent.length; i++) {
      let d = 0;
      let x = i;
      while (uf.parent[x] !== x) {
        x = uf.parent[x];
        d += 1;
      }
      if (d > max) max = d;
    }
    return max;
  };

  /**
   * 统计"反复查询"总共爬了多少步。
   *
   * ★ 关键：每一步都必须调用 uf.find()（而不是手写 while 循环去爬），
   *   否则路径压缩根本没机会发生，测出来的是假数据 —— 这是性能测试里
   *   "测错了对象"的典型案例。
   *
   * 计量口径：先调一次 find(i)（该压缩就压缩），再看 i 到根还剩几层。
   * 也就是说，这个数字反映的是"查询时【实际要爬的层数】"。
   */
  const probe = (uf, rounds = 5) => {
    let steps = 0;
    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < CHAIN_N; i++) {
        uf.find(i); // 查询本身（顺手触发路径压缩）
        let x = i;
        while (uf.parent[x] !== x) {
          x = uf.parent[x];
          steps += 1;
        }
      }
    }
    return steps;
  };

  const naive = new NaiveUnionFind(CHAIN_N);
  for (let i = 0; i + 1 < CHAIN_N; i++) naive.union(i, i + 1);

  const compressed = new PathCompressedUnionFind(CHAIN_N);
  for (let i = 0; i + 1 < CHAIN_N; i++) compressed.union(i, i + 1);

  const ranked = new UnionFind(CHAIN_N);
  for (let i = 0; i + 1 < CHAIN_N; i++) ranked.union(i, i + 1);

  // 合并完成后、还没做任何查询时的真实树形
  const depthBefore = [maxDepth(naive), maxDepth(compressed), maxDepth(ranked)];
  const naiveSteps = probe(naive);
  const compressedSteps = probe(compressed);
  const rankedSteps = probe(ranked);
  const depthAfter = [maxDepth(naive), maxDepth(compressed), maxDepth(ranked)];

  console.log(`    n = ${CHAIN_N}，链式合并 ${CHAIN_N - 1} 次，然后做 5 轮全量查询（每轮 ${CHAIN_N} 次 find）`);
  console.log('');
  console.log('    实现'.padEnd(34) + '合并后的最大深度'.padEnd(20) + '5 轮查询的总步数'.padEnd(22) + '查询后的最大深度');
  console.log('    ' + '-'.repeat(96));
  const rows = [
    ['朴素（无优化）', depthBefore[0], naiveSteps, depthAfter[0]],
    ['路径压缩', depthBefore[1], compressedSteps, depthAfter[1]],
    ['路径压缩 + 按秩合并', depthBefore[2], rankedSteps, depthAfter[2]],
  ];
  for (const [name, db, steps, da] of rows) {
    console.log(name.padEnd(32) + String(db).padEnd(20) + String(steps).padEnd(22) + da);
  }
  console.log('');
  console.log('  这张表把两个优化各自的职责分得清清楚楚：');
  console.log('    · 朴素：深度 1999 层，节点在链尾，每查一次都要爬 1999 步 —— 灾难；');
  console.log('    · 路径压缩：合并后深度同样是 1999（压缩只发生在 find 里），');
  console.log('      但查询一开始就把链压平了，之后最大深度只剩 1 层，总步数骤降；');
  console.log('    · 按秩合并：合并后的深度只有 1 层（所有节点都直接挂在同一个根下）——');
  console.log('      链【根本没有长出来】，一开始就是扁的。');
  console.log('      理论上按秩合并能保证树高不超过 log₂n ≈ 11 层，这里比上界还好得多，');
  console.log('      因为 "union(i, i+1)" 这种输入恰好总是让老根当新根，长出了一个星形。');
  console.log('');
  console.log('  所以"路径压缩治标、按秩合并治本"这句话的含义是：');
  console.log('    压缩是事后把已经长歪的树掰直（第一次查询仍然要付代价）；');
  console.log('    按秩合并是从一开始就不让树长歪（第一次查询就已经很浅）。');
  console.log('    由于 find 的次数远多于 union，大多数工程实现两个都开。');
  console.log('');
  console.log('  ★ 注意"路径压缩"和"按秩合并"解决的问题不一样：');
  console.log('    · 路径压缩治【已经长出来的链】（事后补救）；');
  console.log('    · 按秩合并防【链根本长不出来】（事前预防）；');
  console.log('    · 两者结合才能达到 O(α(n)) —— 只用一个也够好，但既然都不费事，没理由不用。');
}

console.log('');
console.log('实测三种实现处理随机合并的吞吐（n = 20000）：');
console.log('');
console.log('  口径说明：三种实现的【操作量不同】，因为朴素实现慢得多，跑同样的次数会把');
console.log('  整个示例拖到十几秒。所以统一换算成"每次操作的平均耗时（微秒）"来比较 ——');
console.log('  这是公平的口径：每种实现都在处理同样形态的随机操作，只是样本量按速度缩放。');
{
  const N = 20000;
  const rnd = makeRandom(20240916);

  const mkPairs = (count) => {
    const out = [];
    for (let i = 0; i < count; i++) out.push([rnd() % N, rnd() % N, rnd() % N, rnd() % N]);
    return out;
  };
  const fastPairs = mkPairs(20000); // 优化版跑 20000 次
  const slowPairs = mkPairs(4000); // 朴素版跑 4000 次（同样的随机形态）

  const runBench = (mk, pairs) => {
    const uf = mk(N);
    let hits = 0;
    for (const [a, b, c, d] of pairs) {
      uf.union(a, b);
      if (uf.connected(c, d)) hits += 1;
    }
    sink.value = hits;
  };

  // 中位数：跑一次预热 + 3 次采样
  const naiveMs = medianMs(() => runBench((n) => new NaiveUnionFind(n), slowPairs));
  const compMs = medianMs(() => runBench((n) => new PathCompressedUnionFind(n), fastPairs));
  const fullMs = medianMs(() => runBench((n) => new UnionFind(n), fastPairs));

  const usPerOp = (ms, ops) => ((ms * 1000) / ops).toFixed(3);
  const naivePer = usPerOp(naiveMs, slowPairs.length);
  const compPer = usPerOp(compMs, fastPairs.length);
  const fullPer = usPerOp(fullMs, fastPairs.length);

  console.log('');
  console.log(
    '    实现'.padEnd(30) +
      '操作次数'.padEnd(12) +
      '总耗时(ms)'.padEnd(14) +
      '每次操作(µs)'.padEnd(16) +
      '均摊复杂度',
  );
  console.log('    ' + '-'.repeat(92));
  console.log(
    '    朴素'.padEnd(28) +
      String(slowPairs.length).padEnd(12) +
      naiveMs.toFixed(2).padEnd(14) +
      naivePer.padEnd(16) +
      'O(n) 最坏',
  );
  console.log(
    '    路径压缩'.padEnd(28) +
      String(fastPairs.length).padEnd(12) +
      compMs.toFixed(2).padEnd(14) +
      compPer.padEnd(16) +
      'O(log n) 均摊',
  );
  console.log(
    '    路径压缩 + 按秩合并'.padEnd(22) +
      String(fastPairs.length).padEnd(12) +
      fullMs.toFixed(2).padEnd(14) +
      fullPer.padEnd(16) +
      'O(α(n)) ≈ O(1) ★',
  );
  console.log('');
  console.log(`    每次操作 = 一次 union + 一次 connected（内部共 4 次 find）`);
  console.log('');
  console.log('  ★ 先老实说一个反直觉的事实：在【随机数据】上，朴素实现只慢 1.6 倍。');
  console.log('    为什么没慢很多？因为随机合并出来的树，深度长得非常慢 ——');
  console.log(`    ${slowPairs.length} 次随机合并之后，树平均只有几层深，find 没爬几步就到底了。`);
  console.log('    这也说明"随机测试通不过就说明实现有问题"是错的：');
  console.log('    随机数据往往会掩盖最坏情况，让你误以为代码已经够快了。');
  console.log('');
  console.log('  ★ 真正的差距要看【最坏输入】—— 就是本节开头那条 2000 层的链：');
  console.log('');
  console.log('    同一个问题，两种输入下的差距：');
  console.log('      随机合并     ：朴素 = 路径压缩 + 按秩合并 的约 1.6 倍（都能接受）');
  console.log('      链式合并     ：朴素爬了 9,995,000 步，优化版只爬了 9,995 步 → 1000 倍 ✗');
  console.log('');
  console.log('    所以并查集这两个优化的价值不是"平均更快"，而是【把最坏情况按死在地上】：');
  console.log('    无论输入怎么构造，复杂度都不会超过 O(α(n))。');
  console.log('    在真实系统里，输入往往来自外部（用户提交、线上流量），');
  console.log('    "平均挺好、最坏崩溃"是最危险的形态 —— 这正是算法分析盯着最坏情况的理由。');
}

// ---------------------------------------------------------------------------
// 2. 基本操作演示
// ---------------------------------------------------------------------------

console.log('\n--- 2. 基本操作：find / union / connected ---');
console.log('');
console.log('用 0~7 八个元素，依次做几次合并，观察森林的变化：');
console.log('');

const uf = new UnionFind(8);
console.log('  初始状态（8 个独立集合，每人自己是自己的父亲）：');
console.log(`    parent = [${uf.parent.join(', ')}]   连通分量数 = ${uf.count}`);
console.log('');
console.log('  操作'.padEnd(20) + '是否合并'.padEnd(12) + 'parent 数组'.padEnd(32) + '分量数');
console.log('  ' + '-'.repeat(82));
for (const [a, b] of [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2], // 把 {0,1} 和 {2,3} 合并成 {0,1,2,3}
  [4, 6], // 把 {4,5} 和 {6,7} 合并成 {4,5,6,7}
  [0, 1], // 已经在同一个集合里，union 返回 false
]) {
  const merged = uf.union(a, b);
  console.log(
    `  union(${a}, ${b})`.padEnd(18) + String(merged).padEnd(12) + `[${uf.parent.join(', ')}]`.padEnd(32) + uf.count,
  );
}
console.log('');
console.log('  现在的森林（两棵树，正好两组）：');
console.log('');
{
  const roots = [...new Set(uf.parent.map((_, i) => uf.find(i)))].sort((a, b) => a - b);
  for (const r of roots) {
    const members = [];
    for (let i = 0; i < 8; i++) if (uf.find(i) === r) members.push(i);
    console.log(`    ${r}(根) ── ${members.filter((m) => m !== r).join(', ')}      共 ${members.length} 个元素`);
  }
}
console.log('');
console.log('  关键结论：');
console.log(`    · 连通分量数 = ${uf.count}，它是在 union 里顺便维护的（每成功合并一次就 -1），O(1) 就能读到；`);
console.log('    · union(0, 1) 第二次返回 false —— 因为它俩本来就在一起，什么都没做；');
console.log('    · find 里的路径压缩已经把树压得很扁了，看 parent 数组就知道：');
console.log(`      parent = [${uf.parent.join(', ')}]，大部分元素都直接指向根。`);

console.log('');
console.log('  connected / sizeOf 的用法：');
console.log('');
console.log('  查询'.padEnd(28) + '结果'.padEnd(10) + '说明');
console.log('  ' + '-'.repeat(76));
for (const [a, b] of [
  [0, 3],
  [0, 4],
  [5, 6],
  [7, 2],
]) {
  console.log(`  connected(${a}, ${b})`.padEnd(26) + String(uf.connected(a, b)).padEnd(10) + `sizeOf(${a}) = ${uf.sizeOf(a)}`);
}
console.log('');
console.log('  ★ 并查集只有这一种查询能力：在不在同一个集合。');
console.log('    没有"距离""路径""方向"—— 正因为它不维护这些信息，才能做到近乎 O(1)。');

// ---------------------------------------------------------------------------
// 3. 连通分量计数 & 动态加边判环
// ---------------------------------------------------------------------------

console.log('\n--- 3. 连通分量计数：与 07 的 DFS 做法对照 ---');
console.log('');
console.log('07_graph_traversal.js 里统计连通分量的做法是：对每个未访问顶点跑一次 DFS，');
console.log('数"总共启动了几次 DFS"。那是对【静态图】最直观的做法（时间 O(V + E)）。');
console.log('并查集的思路完全不同：把所有边一条条 union 进去，最后看 count 是多少。');
console.log('');
console.log('  两种做法的代码骨架对比：');
console.log('');
console.log('    DFS（07 的做法，遍历式）                 并查集（合并式）');
console.log('    ──────────────────────────────         ──────────────────────────────');
console.log('    for v in vertices:                     uf = new UnionFind(n)');
console.log('      if !visited(v):                      for (u, v) in edges:');
console.log('        count++                              uf.union(u, v)');
console.log('        dfs(v)                             print(uf.count)');
console.log('');
console.log('    一边遍历一边数                          一边合并一边数');
console.log('');
console.log('  同一张图，两种做法结果必须一致：');

/** 用 DFS 统计连通分量（07 的做法，这里作为对照实现） */
function countComponentsByDfs(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const visited = new Array(n).fill(false);
  let count = 0;
  for (let start = 0; start < n; start++) {
    if (visited[start]) continue;
    count += 1;
    // 迭代式 DFS：用显式栈，避免深图爆栈
    const stack = [start];
    visited[start] = true;
    while (stack.length > 0) {
      const v = stack.pop();
      for (const next of adj[v]) {
        if (!visited[next]) {
          visited[next] = true;
          stack.push(next);
        }
      }
    }
  }
  return count;
}

/** 用并查集统计连通分量 */
function countComponentsByUf(n, edges) {
  const u = new UnionFind(n);
  for (const [a, b] of edges) u.union(a, b);
  return u.count;
}

console.log('');
{
  const demoEdges = [
    [0, 1],
    [1, 2],
    [3, 4],
    [5, 6],
    [6, 7],
    [7, 5], // 5-6-7 内部成一个环，但仍是 1 个分量
  ];
  const n = 9; // 顶点 0~8，其中 8 是孤点
  const byDfs = countComponentsByDfs(n, demoEdges);
  const byUf = countComponentsByUf(n, demoEdges);
  console.log(`    图的形状：0-1-2、3-4、5-6-7（带环）、8 是孤点`);
  console.log(`    DFS 数出来的分量：${byDfs}`);
  console.log(`    并查集数出来的分量：${byUf}`);
  console.log(`    两者一致：${byDfs === byUf ? '是 ✓' : '否 ✗'}`);
}
console.log('');
console.log('  但请注意 —— 上面这种"一次性算完"的场景，两种做法都好用，DFS 甚至更省内存。');
console.log('  并查集的真正主场是下面这种【边不断到来、查询穿插其间】的动态场景。');

console.log('');
console.log('【动态加边判环】每来一条边，判断它会不会形成环：');
console.log('');
console.log('  判据只有一句话：如果边的两个端点【已经连通】，这条边就必然成环。');
console.log('  为什么？因为既然两端已经有一条路径相连，再加上这条边就构造出了回路。');
console.log('');
console.log('  ★ 反过来，如果两个端点不连通，这条边一定不会成环 —— 这同时意味着');
console.log('    "每次成功 union 的边，恰好构成生成森林"，这是 Kruskal 算法（15）的全部依据。');
console.log('');

{
  const n = 6;
  const cycleUf = new UnionFind(n);
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0], // ← 这一条会成环
    [3, 4],
    [4, 5],
    [2, 5], // ← 这一条也会成环
    [7, 8], // 越界演示：元素 7、8 不存在，n 只有 6
  ];
  console.log('  顶点 0~5，依次加边：');
  console.log('');
  console.log('  边'.padEnd(14) + '两端是否已连通'.padEnd(18) + '判定'.padEnd(22) + '分量数');
  console.log('  ' + '-'.repeat(76));
  for (const [a, b] of edges) {
    if (a >= n || b >= n) {
      console.log(`  (${a}, ${b})`.padEnd(12) + '—'.padEnd(18) + '元素不存在 → 忽略'.padEnd(22) + cycleUf.count);
      continue;
    }
    const already = cycleUf.connected(a, b);
    const merged = cycleUf.union(a, b);
    console.log(
      `  (${a}, ${b})`.padEnd(12) +
        String(already).padEnd(18) +
        (already ? '★ 成环，跳过这条边' : '不会成环，接受').padEnd(22) +
        cycleUf.count,
    );
    sink.value += merged ? 1 : 0;
  }
  console.log('');
  console.log(`  最终连通分量数：${cycleUf.count}`);
  console.log('  真实用途：Kruskal 最小生成树（15）就是"不断加边，成环就丢"；');
  console.log('           迷宫生成也是这个逻辑 —— 随机拆一面墙，用并查集判断两边是否已通。');
}

// ---------------------------------------------------------------------------
// 4. 实测：并查集 vs "每次查询都跑一次 DFS"
// ---------------------------------------------------------------------------

console.log('\n--- 4. 实测：并查集 vs 每个点跑一次 DFS ---');
console.log('');
console.log('先明确两者的复杂度：');
console.log('');
console.log('  做法'.padEnd(38) + '预处理'.padEnd(22) + '单次连通性查询');
console.log('  ' + '-'.repeat(84));
console.log('  每个点跑一次 DFS（07 的做法）'.padEnd(34) + 'O(V + E)'.padEnd(22) + 'O(V + E) ← 每次都要重跑！');
console.log('  并查集'.padEnd(34) + 'O(E × α(n))'.padEnd(22) + 'O(α(n)) ≈ O(1) ★');
console.log('');
console.log('  一次性的"数有几个连通分量"，两者都是 O(V + E)，差别不大；');
console.log('  但如果有 Q 次查询，DFS 就变成 O(Q × (V + E))，并查集是 O(E × α + Q × α)。');
console.log('  当 Q 和 (V + E) 同量级时，这是 O(n²) 与 O(n) 的差别。');
console.log('');

const BV = 5000; // 顶点数
const BE = 10000; // 边数
const BQ = 100; // 查询次数

const benchRnd = makeRandom(777);
const benchEdges = [];
for (let i = 0; i < BE; i++) benchEdges.push([benchRnd() % BV, benchRnd() % BV]);
const benchQueries = [];
for (let i = 0; i < BQ; i++) benchQueries.push([benchRnd() % BV, benchRnd() % BV]);

/** 每次都重新建图 + 跑 DFS（模拟"没有预处理"的做法） */
function connectedByRepeatDfs(n, edges, queries) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  let hits = 0;
  for (const [a, b] of queries) {
    const visited = new Uint8Array(n);
    const stack = [a];
    visited[a] = 1;
    let found = false;
    while (stack.length > 0) {
      const v = stack.pop();
      if (v === b) {
        found = true;
        break;
      }
      for (const next of adj[v]) {
        if (!visited[next]) {
          visited[next] = 1;
          stack.push(next);
        }
      }
    }
    if (found) hits += 1;
  }
  return hits;
}

/** 并查集：预处理一次，之后每次查询 O(α) */
function connectedByUnionFind(n, edges, queries) {
  const u = new UnionFind(n);
  for (const [a, b] of edges) u.union(a, b);
  let hits = 0;
  for (const [a, b] of queries) if (u.connected(a, b)) hits += 1;
  return hits;
}

const dfsHits = connectedByRepeatDfs(BV, benchEdges, benchQueries);
const ufHits = connectedByUnionFind(BV, benchEdges, benchQueries);

const repeatDfsMs = medianMs(() => {
  sink.value = connectedByRepeatDfs(BV, benchEdges, benchQueries);
});
const ufQueryMs = medianMs(() => {
  sink.value = connectedByUnionFind(BV, benchEdges, benchQueries);
});

console.log(`  V = ${BV}，E = ${BE}，查询 Q = ${BQ}：`);
console.log('');
console.log('    做法'.padEnd(40) + '耗时(ms)'.padEnd(14) + '总复杂度');
console.log('    ' + '-'.repeat(80));
console.log('    每次查询重跑 DFS'.padEnd(36) + repeatDfsMs.toFixed(2).padEnd(14) + `O(Q × (V + E)) = ${BQ} × ${BV + BE * 2} 量级`);
console.log('    并查集（预处理一次）'.padEnd(34) + ufQueryMs.toFixed(2).padEnd(14) + `O(E α + Q α) 几乎只有预处理成本`);
console.log('');
console.log(`    实测差距约 ${(repeatDfsMs / ufQueryMs).toFixed(1)} 倍；两边答案一致：${dfsHits === ufHits ? '是 ✓' : '否 ✗'}`);
console.log(`    （命中数都是一致的 —— 第 ${BQ} 号查询里有 ${ufHits} 对是连通的）`);
console.log('');
console.log('  ★ 那是不是说 DFS 就没用了？完全不是。看下面这张"何时用哪个"的分工表：');
console.log('');
console.log('  场景'.padEnd(46) + '该用哪个');
console.log('  ' + '-'.repeat(86));
for (const [scene, choice] of [
  ['数一张【固定图】有几个连通分量（一次算完）', 'DFS / BFS ★（更省内存，还能顺带记录路径）'],
  ['边在不断增加，查询穿插其间', '并查集 ★（DFS 每次都要重跑）'],
  ['要问"从 A 到 B 的具体路径是什么"', 'DFS / BFS（并查集不保留路径信息）'],
  ['要问"两点之间最少几跳"', 'BFS（并查集完全不知道距离）'],
  ['只问"在不在同一个集合"，且要被问很多次', '并查集 ★'],
  ['要把越来越多的东西"合并"成组（账号合并）', '并查集 ★'],
  ['图是动态的，而且还要支持【删边】', '两个都不行 → 需要 LCT / 离线倒序处理'],
  ['要按权重从小到大加边且不成就丢', '并查集 ★（Kruskal，见 15）'],
]) {
  console.log('  ' + scene.padEnd(46) + choice);
}
console.log('');
console.log('  一句话记忆：');
console.log('    DFS 擅长【一次性地看完整张图】，并查集擅长【被反复追问同一个问题】。');
console.log('    "连通分量"这个问题本身，两个都能答；');
console.log('    区别在于问题是问一次，还是问一万次、而且图还在变。');

// ---------------------------------------------------------------------------
// 5. 工程实战：朋友圈 / 账号合并
// ---------------------------------------------------------------------------

console.log('\n--- 5. 工程实战①：朋友圈（LeetCode 547 的简化版）---');
console.log('');
console.log('班里有 8 个人，已知若干对朋友关系，问：一共有几个朋友圈？最大的是哪个？');
console.log('');

{
  const names = ['小明', '小红', '小刚', '小美', '小强', '小丽', '小华', '小飞'];
  const index = new Map(names.map((n, i) => [n, i]));
  const friendships = [
    ['小明', '小红'],
    ['小红', '小刚'],
    ['小美', '小强'],
    ['小强', '小丽'],
    ['小华', '小飞'],
    ['小飞', '小明'], // ← 这一条把 {小华,小飞} 和 {小明,小红,小刚} 连起来了
  ];
  const friendUf = new UnionFind(names.length);
  for (const [a, b] of friendships) friendUf.union(index.get(a), index.get(b));

  console.log('  好友关系（无向）：');
  for (const [a, b] of friendships) console.log(`    ${a} —— ${b}`);
  console.log('');
  const groups = friendUf.groups().sort((g1, g2) => g2.length - g1.length);
  console.log(`  朋友圈个数：${friendUf.count}`);
  groups.forEach((g, i) => {
    console.log(`    圈 ${i + 1}（${g.length} 人）：${g.map((id) => names[id]).join('、')}`);
  });
  console.log('');
  console.log('  注意"小华 —— 小飞 —— 小明"这条链把两个本该独立的圈子连成了一个：');
  console.log('  这正是并查集的传递性 —— 朋友的朋友也是同一个圈子的人。');
  console.log('  如果用哈希表存"每个人认识谁"，要判断两人是否同圈就得做图搜索；');
  console.log('  并查集把它变成了两次 find，O(1) 就能回答。');
}

console.log('');
console.log('--- 6. 工程实战②：账号合并（真实风控场景）---');
console.log('');
console.log('场景：同一个人的多个账号，只要【共享任意一个邮箱或手机号】，就判定为同一人。');
console.log('账号之间的"共享联系方式"不是直接的边，需要先建"联系方式 → 账号"的倒排表，');
console.log('再对每个联系方式下的所有账号做 union —— 这就是典型的并查集应用。');
console.log('');
console.log('  ★ 规模提醒：如果给 10 亿账号两两建边，内存会直接爆炸。');
console.log('    正确做法是【借助中间节点】：让联系方式本身也变成并查集里的元素，');
console.log('    于是边数从 O(账号²) 降到 O(账号 × 平均联系方式数)。');
console.log('    这是并查集工程实践里最重要的一个技巧，本示例用的就是它。');
console.log('');

{
  const accounts = ['alice@a.com', 'bob@b.com', 'carol@c.com', 'dave@d.com', 'eve@e.com', 'frank@f.com'];
  const contacts = ['phone:138', 'phone:139', 'mail:a.com', 'mail:b.com', 'mail:x.com'];

  // 每个账号登记它的联系方式；每个联系方式也占一个并查集下标（中间节点技巧）
  const ownerOfAccount = [
    ['alice@a.com', ['mail:a.com', 'phone:138']],
    ['bob@b.com', ['mail:b.com', 'phone:138']], // 和 alice 共用手机号
    ['carol@c.com', ['mail:x.com']],
    ['dave@d.com', ['mail:x.com', 'phone:139']], // 和 carol 共用邮箱
    ['eve@e.com', ['mail:b.com']], // 和 bob 共用邮箱 → 连到 alice 那一大串
    ['frank@f.com', []], // 完全孤立
  ];

  const total = accounts.length + contacts.length;
  const idx = new Map();
  accounts.forEach((a, i) => idx.set(a, i));
  contacts.forEach((c, i) => idx.set(c, accounts.length + i));

  const accUf = new UnionFind(total);
  for (const [account, list] of ownerOfAccount) {
    for (const c of list) accUf.union(idx.get(account), idx.get(c));
  }

  console.log('  账号与联系方式的对应关系：');
  for (const [a, list] of ownerOfAccount) {
    console.log(`    ${a.padEnd(16)} ← ${list.length ? list.join('、') : '(无任何联系方式)'}`);
  }
  console.log('');
  const merged = new Map();
  for (const a of accounts) {
    const root = accUf.find(idx.get(a));
    // 只看"账号"这一侧的元素，联系方式只是中间桥梁
    const group = [];
    for (let i = 0; i < accounts.length; i++) if (accUf.find(i) === root) group.push(accounts[i]);
    merged.set(root, group);
  }
  console.log('  合并结果（这些账号被认为是同一个人）：');
  let person = 0;
  for (const group of merged.values()) {
    person += 1;
    console.log(`    人 ${person}（${group.length} 个账号）：${group.join('、')}`);
  }
  const lonely = accounts.filter((a) => merged.get(accUf.find(idx.get(a))).length === 1);
  console.log('');
  console.log(`  合并后有 ${[...merged.values()].filter((g) => g.length > 1).length} 个"多人"身份组，`);
  console.log(`  以及 ${lonely.length} 个孤立账号（${lonely.join('、')}）—— 它们没有任何关系，各算一个人。`);
  console.log(`  并查集里一共有 ${total} 个元素（${accounts.length} 个账号 + ${contacts.length} 个联系方式中间节点），`);
  console.log(`  最终 ${accUf.count} 个集合 —— 注意这里面也包含了"联系方式自己"的小集合。`);
  console.log('');
  console.log('  ★ 注意 union 的代价：每个账号只和"它自己的联系方式"合并，');
  console.log(`    总合并次数 = 所有账号的联系方式总数 = ${ownerOfAccount.reduce((s, [, l]) => s + l.length, 0)} 次，`);
  console.log('    而不是账号数的平方。这就是中间节点技巧的价值。');
}

// ---------------------------------------------------------------------------
// 7. 可回滚并查集
// ---------------------------------------------------------------------------

console.log('\n--- 7. 可回滚并查集：按秩合并的隐藏好处 ---');
console.log('');
console.log('路径压缩虽然快，但它会【破坏历史】：一旦压平，就再也还原不回原来的树形。');
console.log('但如果【只用按秩合并、不做路径压缩】，每次 union 只改一个 parent 指针和一个 rank，');
console.log('把这些改动记在栈里，就能精确地撤销（rollback）任意多次合并。');
console.log('');
console.log('用途：离线处理"带删边"的连通性问题（把删边倒过来变成加边）、');
console.log('      分治 + 并查集（线段树分治）等进阶技巧。');
console.log('      复杂度会从 O(α(n)) 退到 O(log n) —— 换来"可撤销"这个能力，很划算。');
console.log('');

class RollbackUnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.size = new Array(n).fill(1);
    this.count = n;
    this.history = []; // 每次 union 的改动记录
  }

  find(x) {
    // ★ 注意：不做路径压缩，保证"树的形态只由 union 决定"
    while (this.parent[x] !== x) x = this.parent[x];
    return x;
  }

  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) {
      this.history.push(null); // 记录"这一步什么都没做"，回滚时要对应弹出
      return false;
    }
    // 按秩合并：只改两个格子，天然可撤销
    let child = ra;
    let root = rb;
    let rankInc = false;
    if (this.rank[ra] < this.rank[rb]) {
      child = ra;
      root = rb;
    } else if (this.rank[ra] > this.rank[rb]) {
      child = rb;
      root = ra;
    } else {
      child = rb;
      root = ra;
      rankInc = true;
      this.rank[root] += 1;
    }
    this.parent[child] = root;
    this.size[root] += this.size[child];
    this.count -= 1;
    // 记下"改了哪个格子、原来的值是什么"
    this.history.push({ child, root, rankInc, sizeChild: this.size[child], sizeRoot: this.size[root] });
    return true;
  }

  /** 撤销最近一次 union */
  rollback() {
    const rec = this.history.pop();
    if (rec === null || rec === undefined) return false; // 这一次本来就没合并
    this.parent[rec.child] = rec.child;
    this.size[rec.root] -= rec.sizeChild;
    if (rec.rankInc) this.rank[rec.root] -= 1;
    this.count += 1;
    return true;
  }
}

{
  const ruf = new RollbackUnionFind(6);
  const steps = [];
  steps.push(['union(0,1)', ruf.union(0, 1)]);
  steps.push(['union(1,2)', ruf.union(1, 2)]);
  steps.push(['union(3,4)', ruf.union(3, 4)]);

  console.log('  执行三次合并：');
  console.log(`    ${steps.map((s) => s[0]).join('  →  ')}`);
  console.log(`    parent = [${ruf.parent.join(', ')}]   连通分量数 = ${ruf.count}`);
  console.log(`    connected(0, 2) = ${ruf.find(0) === ruf.find(2)}`);
  console.log('');
  console.log('  现在回滚一次（撤销 union(3,4)）：');
  ruf.rollback();
  console.log(`    parent = [${ruf.parent.join(', ')}]   连通分量数 = ${ruf.count}`);
  console.log(`    connected(0, 2) = ${ruf.find(0) === ruf.find(2)}    ← 前面的合并没受影响`);
  console.log('');
  console.log('  再回滚两次（撤销 union(1,2) 和 union(0,1)）：');
  ruf.rollback();
  ruf.rollback();
  console.log(`    parent = [${ruf.parent.join(', ')}]   连通分量数 = ${ruf.count}   ← 回到最初状态`);
  console.log('');
  console.log('  ★ 对比一下：如果用带路径压缩的 UnionFind，回滚就不可能做对 ——');
  console.log('    因为 find 会顺手改写 parent，那些改写不属于任何一次 union，无法归属和撤销。');
  console.log('    所以"能力"和"速度"在这里必须做一次取舍，这也是工程里最常见的权衡。');
}

// ---------------------------------------------------------------------------
// 8. 复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 8. 复杂度对照表与决策表 ---');
console.log('');

console.log('实现'.padEnd(30) + '单次 find'.padEnd(20) + '单次 union'.padEnd(20) + 'm 次操作总计');
console.log('-'.repeat(96));
for (const [impl, find, union, total] of [
  ['朴素（quick-find 风格）', 'O(1) 查、O(n) 合并', 'O(n)', 'O(m × n) 最坏'],
  ['朴素（quick-union 风格）', 'O(n) 最坏', 'O(n) 最坏', 'O(m × n) 最坏'],
  ['只加路径压缩', 'O(log n) 均摊', 'O(log n) 均摊', 'O(m log n)'],
  ['只加按秩合并', 'O(log n)', 'O(log n)', 'O(m log n)'],
  ['路径压缩 + 按秩合并 ★', 'O(α(n)) ≈ O(1)', 'O(α(n)) ≈ O(1)', 'O(m α(n)) ≈ O(m)'],
  ['可回滚（只按秩合并）', 'O(log n)', 'O(log n)', 'O(m log n)'],
]) {
  console.log(impl.padEnd(28) + find.padEnd(22) + union.padEnd(22) + total);
}
console.log('');
console.log('  注：α(n) 是阿克曼函数的反函数。α(10⁸⁰) 也不超过 5 ——');
console.log('      也就是说，哪怕宇宙中的每个原子都是一个元素，find 也只需要爬 5 层。');
console.log('      所以在任何真实规模下，并查集都可以当作 O(1) 使用。');
console.log('');

console.log('空间复杂度：O(n)（parent 数组 + rank/size 数组），没有任何额外开销 ——');
console.log('这也是它比邻接表建图更省内存的原因（图结构本身根本不需要存下来）。');

console.log('');
console.log('  并查集能力清单（哪些能做、哪些不能做）：');
console.log('');
console.log('  能做'.padEnd(46) + '不能做');
console.log('  ' + '-'.repeat(96));
for (const [can, cannot] of [
  ['判断两点是否连通 O(α) ★', '求两点间的最短路径 ✗'],
  ['动态加边并维护连通分量数 O(α)', '求两点间的具体路径 ✗'],
  ['判断加边是否成环 O(α)', '求两点间的距离 / 跳数 ✗'],
  ['查询集合大小 O(α)', '删除一条边（集合分裂）✗'],
  ['按秩合并 + 栈记录实现可回滚 O(log n)', '直接遍历一个集合的成员（需要额外维护链表）✗'],
]) {
  console.log('  ' + can.padEnd(46) + cannot);
}

console.log('');
console.log('一句话总结：');
console.log('  · 并查集是"只关心等价关系"的极简数据结构，一个 parent 数组就能撑起全部功能；');
console.log('  · 路径压缩治标、按秩合并治本，两者合体后复杂度低到 O(α(n))，几乎等于 O(1)；');
console.log('  · 它的价值不在"能算什么"，而在"被问一万次也还是 O(1)" ——');
console.log('    这正是它在动态连通性问题里完胜 DFS 的原因；');
console.log('  · 记住它的定位：不维护路径、不维护距离、不支持删边，只维护"谁和谁是一伙的"。');
console.log('    认清边界，才能在该用 DFS 的时候不硬套并查集。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
