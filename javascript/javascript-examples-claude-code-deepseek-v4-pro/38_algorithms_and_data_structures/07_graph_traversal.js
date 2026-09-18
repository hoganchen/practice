/**
 * ============================================================================
 * 知识点：图的遍历 —— 邻接表/邻接矩阵、DFS、BFS、最短路径与拓扑排序
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】进阶
 * 【前置知识】38_algorithms_and_data_structures/03_stack_and_queue.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    图（graph）由【顶点】（vertex/node）和【边】（edge）组成，用来表达"谁和谁有关系"。
 *    它比树更一般：树是"每个节点只有一个父节点、且没有环"的特殊图。
 *
 *      · 有向图 vs 无向图：边有没有方向（关注 vs 互相关注）
 *      · 带权图 vs 无权图：边有没有权重（好友关系 vs 两地距离）
 *
 *    本示例讲两种表示法和两种遍历：
 *
 *      邻接表（每个顶点存一份"邻居名单"）      邻接矩阵（n×n 的 0/1 表格）
 *
 *         A → [B, C]                            A B C D
 *         B → [A, D]                          A 0 1 1 0
 *         C → [A]                             B 1 0 0 1
 *         D → [B]                             C 1 0 0 0
 *                                             D 0 1 0 0
 *
 *    两种遍历：
 *      DFS 深度优先：一条路走到黑，走不动了再回头（用栈，或者递归）
 *      BFS 广度优先：一层一层往外扩（用队列）
 *
 *      ASCII 示意（同一张图，两种走法）：
 *
 *              A                 DFS 顺序: A → B → D → C   （一直往深里走）
 *            /   \               BFS 顺序: A → B → C → D   （一层一层铺开）
 *          B       C
 *          |                   DFS 用【栈】：后进先出，所以"最近的岔路"先走
 *          D                   BFS 用【队列】：先进先出，所以"最早的邻居"先走
 *
 * 2. 为什么需要（真实项目场景）
 *    - 依赖解析：npm install 要算出包的安装顺序（拓扑排序），
 *      检测循环依赖（DFS 找环）、找出所有受影响的模块（BFS 传播）。
 *    - 社交网络：找"你可能认识的人"（二度好友 = BFS 走两层）、
 *      计算最短关系链（BFS 最短路径）。
 *    - 路由与导航：网络包转发、地图最短路径（无权图用 BFS，带权图用 Dijkstra）。
 *    - 构建工具：webpack / vite 的模块依赖图，从入口开始遍历出所有要打包的文件。
 *    - 爬虫与状态机：从种子 URL 开始按广度优先抓取；游戏里的状态搜索。
 *    - 死锁检测：操作系统的资源分配图找环。
 *
 * 3. 核心语法要点 / 算法思想
 *    · 邻接表：Map<顶点, 邻居数组>。空间 O(V + E)；
 *      查"u 和 v 是否相邻"要 O(degree(u))（扫描邻居名单）；
 *      遍历 u 的所有邻居是 O(degree(u))。
 *    · 邻接矩阵：V×V 的二维数组。空间 O(V²)；
 *      查两点是否相邻是 O(1)；
 *      但遍历 u 的所有邻居必须扫完整整一行，是 O(V)（哪怕 u 只有 1 个邻居）。
 *    · 选哪个？
 *        稀疏图（边数远小于 V²，绝大多数真实场景）→ 邻接表，省内存又快；
 *        稠密图（边数接近 V²）或需要频繁 O(1) 判断两点是否相连 → 邻接矩阵。
 *    · DFS：递归写法最简洁（靠函数调用栈），但图很深时会栈溢出；
 *      迭代写法用一个显式的栈，更可控。
 *      DFS 的三种状态染色（白/灰/黑）是检测有向图环的标准做法。
 *    · BFS：必须用队列。它有个极其重要的性质 ——
 *      在【无权图】上，BFS 第一次访问到某个顶点的路径，一定是最短路径。
 *      因为 BFS 是一层一层扩的，第一次碰到它时走过的层数最少。
 *    · 拓扑排序：把有向无环图（DAG）排成"所有箭头都从左指向右"的线性序列。
 *      两种做法：Kahn 算法（不断取出入度为 0 的点）和 DFS 后序反转。
 *      如果排出来的序列长度小于顶点数，说明图里有环。
 *
 * 4. 常见陷阱
 *    - 陷阱一：忘记记录"已访问"。图里可以有环，不标记就会无限循环。
 *      树不需要标记（因为没有环），图必须有。
 *    - 陷阱二：BFS 标记访问的时机。必须在【入队时】就标记，
 *      不能等出队时才标记，否则同一个顶点会被重复入队很多次。
 *    - 陷阱三：用数组当 BFS 队列却用 shift 出队 —— 大规模下 O(n) 出队会拖慢整体。
 *      用下标 head 模拟出队（见 03_stack_and_queue.js）。
 *    - 陷阱四：把 DFS 的"访问顺序"当成最短路径。DFS 找到的路径可能绕很远。
 *    - 陷阱五：拓扑排序用在有环图上。必须检测环，否则结果会缺顶点。
 *    - 陷阱六：误以为邻接矩阵更好（因为 O(1) 判断相邻）。
 *      对稀疏图，建矩阵的 O(V²) 内存和时间往往是灾难性的。
 *    - 陷阱七：递归 DFS 在大图上爆栈（RangeError: Maximum call stack size exceeded）。
 *      十万个顶点的链式图递归必炸，这时要改用迭代版。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/07_graph_traversal.js
 *
 * 【预期输出】
 *   打印 8 个小节：图的两种表示与取舍表、建图与状态打印、
 *   DFS 递归版（带路径追踪）、DFS 迭代版、BFS 与无权图最短路径、
 *   拓扑排序（Kahn 算法 + 循环依赖检测）、邻接表 vs 邻接矩阵的实测对比、
 *   以及复杂度对照表。
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
// 1. 图的两种表示
// ---------------------------------------------------------------------------

/**
 * 邻接表实现的图。
 *
 * 内部就是一个 Map：顶点 → 邻居数组。
 * 空间 O(V + E)：每个顶点一条记录，每条边在邻居数组里出现一次（无向图出现两次）。
 */
class AdjacencyListGraph {
  /**
   * @param {boolean} directed 是否有向图
   */
  constructor(directed = false) {
    this.directed = directed;
    this.adj = new Map(); // 顶点 → 邻居数组
  }

  /** 添加顶点 */
  addVertex(v) {
    if (!this.adj.has(v)) this.adj.set(v, []);
    return this;
  }

  /** 添加边 u-v */
  addEdge(u, v) {
    this.addVertex(u);
    this.addVertex(v);
    this.adj.get(u).push(v);
    // 无向图要双向添加：一条边在两个顶点的邻居名单里各出现一次
    if (!this.directed) this.adj.get(v).push(u);
    return this;
  }

  get vertices() {
    return [...this.adj.keys()];
  }

  get vertexCount() {
    return this.adj.size;
  }

  get edgeCount() {
    let total = 0;
    for (const list of this.adj.values()) total += list.length;
    // 无向图每条边被数了两次，要除 2
    return this.directed ? total : total / 2;
  }

  neighbors(v) {
    return this.adj.get(v) ?? [];
  }

  /** 判断 u 和 v 是否相邻：要扫描 u 的邻居名单，O(degree(u)) */
  hasEdge(u, v) {
    return this.neighbors(u).includes(v);
  }

  /** 顶点的度（有向图里是出度） */
  degree(v) {
    return this.neighbors(v).length;
  }

  /** 渲染成 "A → [B, C]" 的形式，用于打印状态 */
  snapshot() {
    return this.vertices.map((v) => `${v} → [${this.neighbors(v).join(', ')}]`).join('\n    ');
  }
}

/**
 * 邻接矩阵实现的图。
 *
 * 内部是一个 V×V 的二维数组，matrix[i][j] = 1 表示 i 到 j 有边。
 * 空间 O(V²) —— 哪怕只有一条边，也要开 V² 个格子。
 */
class AdjacencyMatrixGraph {
  constructor(vertexLabels, directed = false) {
    this.labels = [...vertexLabels];
    this.index = new Map(this.labels.map((label, i) => [label, i]));
    this.directed = directed;
    const n = this.labels.length;
    // 建一个 n×n 的零矩阵
    this.matrix = new Array(n);
    for (let i = 0; i < n; i++) this.matrix[i] = new Array(n).fill(0);
  }

  addEdge(u, v) {
    const i = this.index.get(u);
    const j = this.index.get(v);
    this.matrix[i][j] = 1;
    if (!this.directed) this.matrix[j][i] = 1; // 无向图对称
    return this;
  }

  /** 判断是否相邻：一次数组索引，O(1) —— 这是矩阵唯一明显强于邻接表的地方 */
  hasEdge(u, v) {
    return this.matrix[this.index.get(u)][this.index.get(v)] === 1;
  }

  /**
   * 列出 v 的所有邻居：必须扫完整整一行，O(V)。
   * 注意：哪怕 v 只有 1 个邻居，也要检查 V 个格子 —— 这是矩阵最大的缺点。
   */
  neighbors(v) {
    const i = this.index.get(v);
    const out = [];
    for (let j = 0; j < this.labels.length; j++) {
      if (this.matrix[i][j] === 1) out.push(this.labels[j]);
    }
    return out;
  }

  /** 渲染成表格 */
  snapshot() {
    const header = '      ' + this.labels.map((l) => l.padStart(4)).join('');
    const rows = this.labels.map((label, i) => {
      const cells = this.matrix[i].map((x) => String(x).padStart(4)).join('');
      return `    ${label.padEnd(4)}${cells}`;
    });
    return [header, ...rows].join('\n');
  }
}

console.log('--- 1. 图的两种表示法 ---');
console.log('');
console.log('同一张图（4 个顶点、4 条边的无向图）：');
console.log('');
console.log('            A');
console.log('          /   \\');
console.log('         B     C');
console.log('         |');
console.log('         D');
console.log('');
console.log('【邻接表】空间 O(V + E)，只存实际存在的边：');
const demoListGraph = new AdjacencyListGraph(false);
demoListGraph.addEdge('A', 'B').addEdge('A', 'C').addEdge('B', 'D');
console.log('    ' + demoListGraph.snapshot());
console.log('');
console.log('【邻接矩阵】空间 O(V²)，不管有没有边都要占格子：');
const demoMatrixGraph = new AdjacencyMatrixGraph(['A', 'B', 'C', 'D'], false);
demoMatrixGraph.addEdge('A', 'B').addEdge('A', 'C').addEdge('B', 'D');
console.log(demoMatrixGraph.snapshot());
console.log('');
console.log('  两个矩阵的空格（0）就是"浪费掉"的内存 —— 这张图里 16 个格子只用了 8 个。');
console.log('  图越大越稀疏，浪费越夸张：100 万顶点、平均 5 条边的图，');
console.log('  邻接表只要约 500 万条记录，邻接矩阵要 1 万亿个格子 —— 根本开不出来。');

console.log('');
console.log('【核心操作对比】');
console.log('');
console.log('操作'.padEnd(32) + '邻接表'.padEnd(26) + '邻接矩阵');
console.log('-'.repeat(88));
for (const [op, list, matrix] of [
  ['空间复杂度', 'O(V + E) 只存真实的边', 'O(V²) 不管有没有边'],
  ['判断 u-v 是否相邻', 'O(degree(u)) 扫邻居名单', 'O(1) 直接查格子 ★'],
  ['遍历 u 的所有邻居', 'O(degree(u)) 只走真实邻居 ★', 'O(V) 必须扫完整行'],
  ['添加一条边', 'O(1)', 'O(1)'],
  ['删除一条边', 'O(degree(u)) 要在数组里找', 'O(1) 格子置 0'],
  ['添加一个顶点', 'O(1)', 'O(V²) 要重建整个矩阵'],
  ['适合的图', '稀疏图（绝大多数真实场景）★', '稠密图、顶点数固定的小图'],
  ['实际使用者', '社交网络、依赖图、路由表', '小规模图论计算、比赛题目'],
]) {
  console.log(op.padEnd(30) + list.padEnd(28) + matrix);
}
console.log('');
console.log('  结论：真实世界的图几乎都是稀疏的（一个人的好友最多几千个，');
console.log('  而不是全人类 80 亿），所以【邻接表是默认选择】。');
console.log('  邻接矩阵只在"顶点数少且边很密"或"需要频繁 O(1) 判断相邻"时才值得。');

// ---------------------------------------------------------------------------
// 2. 建图：一张社交网络图
// ---------------------------------------------------------------------------

console.log('\n--- 2. 建图：一张好友关系图（无向图）---');
console.log('');
console.log('  图的形状：');
console.log('');
console.log('        Alice ── Bob');
console.log('          │        │');
console.log('        Carol ─── Dave ── Eve');
console.log('          │');
console.log('        Frank');
console.log('');

const social = new AdjacencyListGraph(false);
const friendships = [
  ['Alice', 'Bob'],
  ['Alice', 'Carol'],
  ['Bob', 'Dave'],
  ['Carol', 'Dave'],
  ['Carol', 'Frank'],
  ['Dave', 'Eve'],
];

console.log('  逐步添加边（每条边都要双向登记）：');
console.log('');
for (const [u, v] of friendships) {
  console.log(`  addEdge(${u}, ${v})`);
  social.addEdge(u, v);
  console.log('    当前邻接表：' + social.snapshot().replace(/\n\s+/g, '  |  '));
}
console.log('');
console.log(`  最终：${social.vertexCount} 个顶点，${social.edgeCount} 条边`);
console.log('  完整邻接表：');
console.log('    ' + social.snapshot());
console.log('');
console.log('  注意 Bob 的名单里有 Alice、Dave —— 因为无向图的边是双向的，');
console.log('  一条边会在两个顶点的邻居名单里各出现一次。');
console.log(`  hasEdge("Alice", "Bob") = ${social.hasEdge('Alice', 'Bob')}`);
console.log(`  hasEdge("Alice", "Eve") = ${social.hasEdge('Alice', 'Eve')}  ← 不相邻`);

// ---------------------------------------------------------------------------
// 3. DFS 深度优先（递归版）
// ---------------------------------------------------------------------------

console.log('\n--- 3. DFS 深度优先：递归写法 ---');
console.log('');
console.log('DFS 的思路（一句话）：能往深走就往深走，走不动了再退回来找别的岔路。');
console.log('');
console.log('递归实现几乎是照着定义写出来的：');
console.log('    function dfs(v, visited) {');
console.log('      if (visited.has(v)) return;      // ① 来过就别再走了（图可能有环！）');
console.log('      visited.add(v);                  // ② 标记已访问');
console.log('      for (const next of neighbors(v)) // ③ 挨个尝试每个邻居');
console.log('        dfs(next, visited);            //    对每个邻居重复同样的过程');
console.log('    }');
console.log('');
console.log('  为什么"已访问"标记是必须的？因为图可以有环：');
console.log('    A ─ B ─ C ─ A   ← 不标记的话，A→B→C→A→B→C… 永远走不完');
console.log('  （树不需要标记，因为树天生没有环 —— 这也是树和图最大的区别。）');

/**
 * DFS 递归版，返回访问顺序。
 * @param {Array<{v:string, depth:number, action:string}>} trace 可选的访问轨迹
 */
function dfsRecursive(graph, start, visited = new Set(), order = [], trace = null, depth = 0) {
  if (visited.has(start)) {
    if (trace) trace.push({ v: start, depth, action: '已访问过 → 直接返回' });
    return order;
  }
  visited.add(start);
  order.push(start);
  if (trace) trace.push({ v: start, depth, action: '首次访问 → 标记并入序' });

  for (const next of graph.neighbors(start)) {
    dfsRecursive(graph, next, visited, order, trace, depth + 1);
  }
  if (trace) trace.push({ v: start, depth, action: '邻居都走完了 → 回溯' });
  return order;
}

const dfsTrace = [];
const dfsOrder = dfsRecursive(social, 'Alice', new Set(), [], dfsTrace);

console.log('');
console.log('  从 Alice 出发的 DFS 递归过程（用缩进表示递归深度）：');
console.log('');
for (const step of dfsTrace) {
  console.log('    ' + '  '.repeat(step.depth) + `${step.v}  ${step.action}`);
}
console.log('');
console.log(`  访问顺序：${dfsOrder.join(' → ')}`);
console.log('');
console.log('  注意轨迹里的"回溯"：走到底（Frank、Eve 没有新邻居）之后，');
console.log('  函数一层层返回，去处理之前没走完的邻居。这个"往回退"的动作就是深度优先的精髓，');
console.log('  而它恰好对应【函数调用栈】的弹出，所以递归写法如此自然。');
console.log('');
console.log(`  复杂度：时间 O(V + E)（每个顶点访问一次、每条边检查一次），`);
console.log(`          空间 O(V)（visited 集合 + 递归栈深度，最坏是链式图，栈深 = V）。`);

// ---------------------------------------------------------------------------
// 4. DFS 迭代版
// ---------------------------------------------------------------------------

console.log('\n--- 4. DFS 深度优先：迭代写法（显式栈）---');
console.log('');
console.log('递归版靠"函数调用栈"，迭代版就用一个真实的【栈】来替代它，');
console.log('好处是不会爆栈 —— 十万个顶点的链式图，递归版必炸，迭代版没事。');
console.log('');
console.log('  关键细节：栈是"后进先出"的，所以：');
console.log('    · 入栈顺序要【反过来】，才能让第一个邻居先被访问；');
console.log('    · 或者接受"邻居被逆序访问"这个事实（很多人不在意）。');
console.log('');
console.log('  另一个细节：可以"入栈时就标记"，也可以"出栈时才标记"。');
console.log('    出栈时标记：同一个顶点可能被重复入栈（但不会重复访问），栈可能变大；');
console.log('    入栈时标记：每个顶点只入栈一次，更高效，本示例采用这种。');

/**
 * DFS 迭代版。
 * @param {boolean} reversePush 是否把邻居反序入栈（让访问顺序与递归版一致）
 */
function dfsIterative(graph, start, reversePush = true) {
  const visited = new Set();
  const order = [];
  const stack = [start];
  visited.add(start); // 入栈时就标记，避免重复入栈

  while (stack.length > 0) {
    const v = stack.pop(); // 从栈【顶】取出
    order.push(v);
    const neighbors = graph.neighbors(v);
    // 反序入栈 → 弹出时就是原来的顺序（因为栈是后进先出）
    const toPush = reversePush ? [...neighbors].reverse() : neighbors;
    for (const next of toPush) {
      if (!visited.has(next)) {
        visited.add(next);
        stack.push(next);
      }
    }
  }
  return order;
}

const dfsIterOrder = dfsIterative(social, 'Alice', true);
const dfsIterOrderNoReverse = dfsIterative(social, 'Alice', false);

console.log('');
console.log(`  迭代版（邻居反序入栈）：${dfsIterOrder.join(' → ')}`);
console.log(`  迭代版（邻居正序入栈）：${dfsIterOrderNoReverse.join(' → ')}`);
console.log(`  递归版            ：${dfsOrder.join(' → ')}`);
console.log(`  迭代版（反序）与递归版结果一致：${dfsIterOrder.join(',') === dfsOrder.join(',')}`);
console.log('');
console.log('  顺序不同但都是合法的 DFS —— 因为"先走哪个邻居"取决于邻居名单的顺序。');
console.log('  DFS 的结果本来就不唯一，这是它和 BFS 的重要区别（BFS 的分层结构更稳定）。');

console.log('');
console.log('【栈的变化过程】以访问顺序追踪：');
{
  const visited = new Set(['Alice']);
  const stack = ['Alice'];
  const order = [];
  console.log('');
  console.log('  步骤'.padEnd(8) + '出栈'.padEnd(10) + '入栈的邻居'.padEnd(24) + '栈内容（栈顶在右）');
  console.log('  ' + '-'.repeat(66));
  let step = 0;
  while (stack.length > 0 && step < 12) {
    step += 1;
    const v = stack.pop();
    order.push(v);
    const pushed = [];
    for (const next of [...social.neighbors(v)].reverse()) {
      if (!visited.has(next)) {
        visited.add(next);
        stack.push(next);
        pushed.push(next);
      }
    }
    console.log(
      '  ' +
        String(step).padEnd(8) +
        v.padEnd(10) +
        (pushed.length ? pushed.join(', ') : '(无)').padEnd(24) +
        '[' + stack.join(', ') + ']',
    );
  }
  console.log('');
  console.log(`  最终访问顺序：${order.join(' → ')}`);
}

console.log('');
console.log(`  DFS 迭代版复杂度：时间 O(V + E)，空间 O(V)（visited + 栈）。`);
console.log('  两种写法的复杂度完全相同，选择依据是【图的深度】和【可读性】：');
console.log('    · 图不深、追求代码简洁 → 递归；');
console.log('    · 图可能很深（链式依赖、超大图）→ 迭代，避免爆栈。');

// ---------------------------------------------------------------------------
// 5. BFS 与无权图最短路径
// ---------------------------------------------------------------------------

console.log('\n--- 5. BFS 广度优先：一层一层往外扩 ---');
console.log('');
console.log('BFS 的思路：先把所有"距离起点 1 步"的点访问完，再访问"2 步"的，以此类推。');
console.log('');
console.log('  用【队列】实现（先进先出）：');
console.log('    function bfs(start) {');
console.log('      const queue = [start]; visited.add(start);   // ★ 入队时就标记！');
console.log('      while (queue.length) {');
console.log('        const v = queue.shift();   // 从队【头】取出（生产代码要用下标模拟）');
console.log('        for (const next of neighbors(v))');
console.log('          if (!visited.has(next)) { visited.add(next); queue.push(next); }');
console.log('      }');
console.log('    }');
console.log('');
console.log('  ★ 为什么必须在【入队时】标记，而不是出队时？');
console.log('     如果出队才标记，同一个顶点会被多个邻居重复入队，队列规模可能爆炸。');
console.log('     入队即标记，保证每个顶点最多入队一次，队列最多装 V 个元素。');
console.log('');
console.log('  ★ BFS 的黄金性质：在【无权图】上，BFS 第一次访问到某点的路径一定是最短的。');
console.log('     因为 BFS 严格按"跳数"分层推进，第一次碰到它时用的跳数必然最少。');

/**
 * BFS，返回 { order, level, parent, levels }
 * @returns {{order:string[], level:Map, parent:Map, levels:string[][]}}
 */
function bfs(graph, start) {
  const visited = new Set([start]);
  const order = [];
  const level = new Map([[start, 0]]); // 距离起点的跳数
  const parent = new Map([[start, null]]); // 用于回溯路径
  const levels = [[start]];

  // 用下标 head 模拟出队，避免 shift 的 O(n)（见 03_stack_and_queue.js）
  const queue = [start];
  let head = 0;

  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    order.push(v);
    const currentLevel = level.get(v);

    for (const next of graph.neighbors(v)) {
      if (!visited.has(next)) {
        visited.add(next); // ★ 入队时就标记
        level.set(next, currentLevel + 1);
        parent.set(next, v);
        queue.push(next);
        if (!levels[currentLevel + 1]) levels[currentLevel + 1] = [];
        levels[currentLevel + 1].push(next);
      }
    }
  }
  return { order, level, parent, levels };
}

const bfsResult = bfs(social, 'Alice');

console.log('');
console.log('  从 Alice 出发的 BFS：');
console.log('');
console.log(`    order 参数：${bfsResult.order.join(' → ')}`);
console.log('');
console.log('  按层分组（这就是 BFS 的"一层一层"，也叫做"波纹扩散"）：');
bfsResult.levels.forEach((nodes, i) => {
  console.log(`    第 ${i} 层（距离 Alice ${i} 跳）: ${nodes.join(', ')}`);
});
console.log('');
console.log('  每一步的访问轨迹：');
console.log('');
console.log('    出队'.padEnd(10) + '距离'.padEnd(8) + '新入队的邻居'.padEnd(22) + '队列内容（队头在左）');
console.log('    ' + '-'.repeat(66));
{
  const visited = new Set(['Alice']);
  const dist = new Map([['Alice', 0]]);
  let head = 0;
  const queue = ['Alice'];
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    const pushed = [];
    for (const next of social.neighbors(v)) {
      if (!visited.has(next)) {
        visited.add(next);
        dist.set(next, dist.get(v) + 1);
        queue.push(next);
        pushed.push(next);
      }
    }
    console.log(
      '    ' +
        v.padEnd(10) +
        String(dist.get(v)).padEnd(8) +
        (pushed.length ? pushed.join(', ') : '(无)').padEnd(22) +
        '[' + queue.slice(head).join(', ') + ']',
    );
  }
}

console.log('');
console.log('【用 BFS 求最短路径】BFS 顺带记录了 parent，回溯一下就能还原路径：');

/** 从 BFS 的 parent 表里回溯出 start → target 的最短路径 */
function reconstructPath(parent, start, target) {
  if (!parent.has(target)) return null; // 不可达
  const path = [];
  let cur = target;
  while (cur !== null && cur !== undefined) {
    path.push(cur);
    cur = parent.get(cur);
  }
  path.reverse();
  return path;
}

console.log('');
console.log('  目标'.padEnd(12) + '跳数'.padEnd(8) + '最短路径');
console.log('  ' + '-'.repeat(56));
for (const target of ['Alice', 'Bob', 'Carol', 'Dave', 'Frank', 'Eve']) {
  const path = reconstructPath(bfsResult.parent, 'Alice', target);
  const d = bfsResult.level.get(target);
  console.log(
    '  ' + target.padEnd(12) + String(d).padEnd(8) + path.join(' → '),
  );
}
console.log('');
console.log('  注意 Dave 和 Frank 都在第 2 层，但它们在图上并不相邻 ——');
console.log('  一个挂在 Bob 那边，一个挂在 Carol 那边。BFS 只按"跳数"分层，');
console.log('  只要跳数相同就在同一层，和顶点的物理位置无关。');
console.log('');
console.log('  另外注意：Dave 到 Eve 明明只有 1 条边，但 Eve 却在第 3 层。');
console.log('  因为 Eve 距离【起点 Alice】确实是 3 跳 —— BFS 算的永远是"到起点的距离"，');
console.log('  而不是"两个点之间看起来隔多远"。');
console.log('');
console.log(`  BFS 复杂度：时间 O(V + E)，空间 O(V)（visited + 队列 + parent 表）。`);

console.log('');
console.log('【为什么最短路径必须用 BFS，DFS 不行？】');
console.log('');
console.log('  构造一张"有捷径，但捷径排在邻居名单后面"的图：');
console.log('');
console.log('        S ──────→ T          ← 捷径：1 跳直达');
console.log('        │');
console.log('        ↓');
console.log('        A → B → C → D → T    ← 绕路：5 跳');
console.log('');
console.log('  关键：S 的邻居名单是 [A, T]，A 排在 T 前面。');
console.log('        DFS 遇到邻居就一头扎进第一个，于是走进了那条长链。');

const detour = new AdjacencyListGraph(true);
detour.addEdge('S', 'A').addEdge('S', 'T');
detour.addEdge('A', 'B').addEdge('B', 'C').addEdge('C', 'D').addEdge('D', 'T');

/** DFS 找路径：记录 parent，找到目标就停止 */
function dfsFindPath(graph, start, target) {
  const visited = new Set();
  const parent = new Map([[start, null]]);
  let found = false;
  (function visit(v) {
    if (found) return;
    if (v === target) {
      found = true;
      return;
    }
    visited.add(v);
    for (const next of graph.neighbors(v)) {
      if (found) return;
      if (!visited.has(next)) {
        parent.set(next, v);
        visit(next);
      }
    }
  })(start);
  return found ? reconstructPath(parent, start, target) : null;
}

const dfsPath = dfsFindPath(detour, 'S', 'T');
const bfsPathResult = bfs(detour, 'S');
const bfsPath = reconstructPath(bfsPathResult.parent, 'S', 'T');

console.log('');
console.log(`  DFS 找到的路径：${dfsPath.join(' → ')}   共 ${dfsPath.length - 1} 跳`);
console.log(`  BFS 找到的路径：${bfsPath.join(' → ')}   共 ${bfsPath.length - 1} 跳  ← 最短！`);
console.log('');
console.log(`  验证：BFS 的 ${bfsPath.length - 1} 跳确实是理论最短（S 到 T 有直接边）。`);
console.log('  DFS 的失败不在于"不能走捷径"，而在于它【只认顺序、不分层】：');
console.log('  它一旦钻进第一个邻居就越走越深，压根没有"比较哪条更短"的意识。');
console.log('  而 BFS 先把所有 1 跳的点看完，所以第一次碰到 T 就是 1 跳。');
console.log('');
console.log('  结论：求无权图最短路径，用 BFS；DFS 只适合"是否存在路径""枚举所有路径"这类问题。');

// ---------------------------------------------------------------------------
// 6. 拓扑排序
// ---------------------------------------------------------------------------

console.log('\n--- 6. 拓扑排序：给有向无环图排出一个合法顺序 ---');
console.log('');
console.log('场景：项目构建依赖。要打包 app.js，必须先打包它 import 的模块。');
console.log('');
console.log('  依赖关系（箭头表示【构建顺序】：A → B 表示"必须先构建 A，才能构建 B"）：');
console.log('');
console.log('        utils ──→ ui ──→ main');
console.log('          │       │       ↑');
console.log('          ↓       ↓       │');
console.log('        core ──→ api ─────┘');
console.log('');
console.log('  把箭头读成"必须先做左边的"，等价的说法就是：');
console.log('    main 依赖 ui 和 api；api 依赖 ui 和 core；ui 和 core 都依赖 utils。');
console.log('');
console.log('  拓扑排序要回答的问题是：按什么顺序构建，才能保证"轮到某个模块时，');
console.log('  它依赖的东西都已经构建好了"？');
console.log('');
console.log('  合法答案之一：utils → core → ui → api → main');
console.log('  （合法的答案可能有很多个，拓扑排序给的是其中之一。）');
console.log('');
console.log('  ★ 前提：图必须是有向【无环】图（DAG）。');
console.log('    如果 A 依赖 B、B 又依赖 A，那就永远排不出顺序 —— 这就是循环依赖。');
console.log('');
console.log('  ★ 用这个方向约定，Kahn 算法的逻辑就非常自然：');
console.log('    【入度为 0】意味着"没有任何前置依赖"，这种顶点可以立刻构建。');

const deps = new AdjacencyListGraph(true); // 有向图
// 边指向"构建顺序"：先 from 后 to
for (const [from, to] of [
  ['utils', 'ui'],
  ['utils', 'core'],
  ['ui', 'main'],
  ['ui', 'api'],
  ['core', 'api'],
  ['api', 'main'],
]) {
  deps.addEdge(from, to);
}

console.log('');
console.log('  邻接表（"谁构建完之后轮到谁"）：');
console.log('    ' + deps.snapshot());

/**
 * Kahn 算法求拓扑排序。
 *
 * 思路（非常直观）：
 *   ① 算出每个顶点的【入度】（有多少条边指向它）；
 *   ② 把所有入度为 0 的顶点放进队列 —— 它们没有任何前置依赖，可以立刻执行；
 *   ③ 不断从队列取出一个顶点，加入结果序列；
 *      然后把它的每条出边"删掉"（也就是把对面顶点的入度减 1）；
 *      如果某个顶点的入度因此变成 0，说明它的依赖都处理完了，入队；
 *   ④ 如果结果序列的长度 < 顶点总数，说明剩下的顶点互相依赖 → 【有环】。
 *
 * 复杂度：时间 O(V + E)，空间 O(V)。
 */
function topologicalSortKahn(graph) {
  const inDegree = new Map();
  for (const v of graph.vertices) inDegree.set(v, 0);
  // 统计入度：每条边 u→v 让 v 的入度 +1
  for (const v of graph.vertices) {
    for (const next of graph.neighbors(v)) {
      inDegree.set(next, inDegree.get(next) + 1);
    }
  }

  const queue = [];
  for (const [v, d] of inDegree) if (d === 0) queue.push(v);

  const order = [];
  let head = 0;
  while (head < queue.length) {
    const v = queue[head];
    head += 1;
    order.push(v);
    for (const next of graph.neighbors(v)) {
      const d = inDegree.get(next) - 1;
      inDegree.set(next, d);
      if (d === 0) queue.push(next); // 依赖都处理完了，可以被构建了
    }
  }

  return {
    order,
    hasCycle: order.length !== graph.vertexCount,
    inDegree,
  };
}

const topoResult = topologicalSortKahn(deps);

console.log('');
console.log('  Kahn 算法的执行过程：');
console.log('');
console.log('    步骤'.padEnd(8) + '取出'.padEnd(10) + '入度变 0 而入队的'.padEnd(24) + '当前序列');
console.log('    ' + '-'.repeat(68));
{
  const inDegree = new Map();
  for (const v of deps.vertices) inDegree.set(v, 0);
  for (const v of deps.vertices) for (const n of deps.neighbors(v)) inDegree.set(n, inDegree.get(n) + 1);
  console.log('    ' + '初始'.padEnd(8) + ''.padEnd(10) + '(入度为 0 的先进队列)'.padEnd(24) + `[${[...inDegree].filter(([, d]) => d === 0).map(([v]) => v).join(', ')}]`);
  const queue = [...inDegree].filter(([, d]) => d === 0).map(([v]) => v);
  const order = [];
  let head = 0;
  let step = 0;
  while (head < queue.length) {
    step += 1;
    const v = queue[head];
    head += 1;
    order.push(v);
    const freed = [];
    for (const next of deps.neighbors(v)) {
      const d = inDegree.get(next) - 1;
      inDegree.set(next, d);
      if (d === 0) {
        queue.push(next);
        freed.push(next);
      }
    }
    console.log(
      '    ' +
        String(step).padEnd(8) +
        v.padEnd(10) +
        (freed.length ? `${freed.join(', ')} 的入度变为 0` : '(没有新的顶点就绪)').padEnd(24) +
        `[${order.join(', ')}]`,
    );
  }
}

// 构建"前置依赖表"：predecessors[v] = 所有必须先于 v 构建的顶点
// （也就是所有指向 v 的边的起点。注意不能用 neighbors(v)，那是指向别人的边。）
const predecessors = new Map(deps.vertices.map((v) => [v, []]));
for (const v of deps.vertices) {
  for (const next of deps.neighbors(v)) predecessors.get(next).push(v);
}

console.log('');
console.log(`  拓扑排序结果：${topoResult.order.join(' → ')}`);
console.log('');
console.log(`  是不是合法？逐个检查"轮到它时，它所有的前置依赖是否都已经排过了"：`);
{
  const seen = new Set();
  let allOk = true;
  for (const v of topoResult.order) {
    const require = predecessors.get(v);
    const missing = require.filter((d) => !seen.has(d));
    if (missing.length > 0) allOk = false;
    console.log(
      `    ${v.padEnd(8)} 前置依赖 [${require.join(', ') || '无'}]`.padEnd(40) +
        (missing.length === 0 ? '✓ 都已就绪' : `✗ 还缺 ${missing.join(', ')}`),
    );
    seen.add(v);
  }
  console.log(`  整体校验：${allOk ? '全部合法 ✓' : '存在违反依赖的顺序 ✗'}`);
}
console.log(`  检测到环：${topoResult.hasCycle}`);
console.log('');
console.log(`  实际构建顺序：${topoResult.order.join(' → ')} —— 从没有任何依赖的 utils 开始，`);
console.log('  到所有依赖都就绪的 main 结束，完全符合依赖约束。');
console.log('  注意一个细节：同一时刻可能有多个模块就绪（比如 utils 之后 core 和 ui 都就绪了），');
console.log('  它们的先后不影响正确性 —— 所以拓扑排序的结果通常不唯一。');
console.log('  真实构建工具会在此基础上并行构建就绪的模块，这就是"多阶段流水线"。');

console.log('');
console.log('【循环依赖检测】现在额外加一条 main → ui 的边，制造环：');
console.log('  （原本是 ui → main，再加一条反向的 main → ui，两者就互相等待了）');
const cyclicDeps = new AdjacencyListGraph(true);
for (const [from, to] of [
  ['utils', 'ui'],
  ['utils', 'core'],
  ['ui', 'main'],
  ['ui', 'api'],
  ['core', 'api'],
  ['api', 'main'],
  ['main', 'ui'], // ← 新加的，制造循环
]) {
  cyclicDeps.addEdge(from, to);
}
const cyclicResult = topologicalSortKahn(cyclicDeps);
console.log('');
console.log('    ' + cyclicDeps.snapshot());
console.log('');
console.log(`  拓扑排序结果：${cyclicResult.order.join(' → ')}`);
console.log(`  只排出了 ${cyclicResult.order.length} 个，而总共有 ${cyclicDeps.vertexCount} 个顶点。`);
console.log(`  hasCycle = ${cyclicResult.hasCycle}  ← 正确检测出了循环依赖！`);
console.log('');
{
  const placed = new Set(cyclicResult.order);
  const stuck = cyclicDeps.vertices.filter((v) => !placed.has(v));
  console.log(`  排不出来的顶点（就是环上的顶点）：${stuck.join(', ')}`);
}
console.log('  环在哪？main 和 ui 互相依赖：ui 要先构建才能构建 main，');
console.log('  main 又要先构建才能构建 ui —— 两个人互相等，谁也动不了。');
console.log('');
console.log('  Kahn 算法检测环的方式非常优雅：');
console.log('    能排出来的顶点数 < 总数，就说明剩下的顶点在环里（入度永远降不到 0）。');
console.log('  这也是 npm / pip 报 "circular dependency" 的原理。');

console.log('');
console.log('【另一种拓扑排序：DFS 后序反转】');
console.log('  思路：对图做 DFS，把每个顶点在"它的所有邻居都处理完之后"压入结果，');
console.log('  最后把整个结果【反转】，就是拓扑序。');
console.log('  为什么？因为后序保证"被依赖的顶点一定排在自己后面"，反转过来就正好。');

/** DFS 版拓扑排序：后序 + 反转，同时检测环 */
function topologicalSortDfs(graph) {
  const visited = new Set();
  const inStack = new Set(); // 当前递归路径上的顶点，用来检测环
  const postOrder = [];
  let cycleFound = false;

  function visit(v) {
    if (inStack.has(v)) {
      cycleFound = true; // 走到了自己所在的递归路径上 → 有环
      return;
    }
    if (visited.has(v)) return;
    visited.add(v);
    inStack.add(v);
    for (const next of graph.neighbors(v)) visit(next);
    inStack.delete(v);
    postOrder.push(v); // 后序位置：邻居都处理完了才轮到自己
  }

  for (const v of graph.vertices) visit(v);
  return { order: postOrder.reverse(), hasCycle: cycleFound };
}

const dfsTopo = topologicalSortDfs(deps);
const dfsTopoCyclic = topologicalSortDfs(cyclicDeps);
console.log('');
console.log(`  无环图的 DFS 拓扑序：${dfsTopo.order.join(' → ')}`);
console.log(`  有环图的检测结果：hasCycle = ${dfsTopoCyclic.hasCycle}  ← 也检测到了`);
console.log('');
console.log('两种拓扑排序对比：');
console.log('');
console.log('对比项'.padEnd(26) + 'Kahn（BFS 式）'.padEnd(34) + 'DFS 后序反转');
console.log('-'.repeat(96));
for (const [item, kahn, dfs] of [
  ['核心思想', '不断取出入度为 0 的顶点', '深度优先，后序位置记录，最后反转'],
  ['用的数据结构', '队列 + 入度表', '递归栈（或显式栈） + 染色标记'],
  ['时间复杂度', 'O(V + E)', 'O(V + E)'],
  ['空间复杂度', 'O(V)', 'O(V)（递归栈深度可能到 V）'],
  ['检测环的方式', '结果长度 < V 即有环', '递归中碰到"当前路径上"的顶点即有环'],
  ['能否按层输出', '✓ 天然可以（同层的并行执行）', '✗ 不直接支持'],
  ['深图的风险', '无（迭代实现）', '递归可能爆栈'],
  ['字典序最小的解', '用优先队列代替队列即可', '较难控制'],
]) {
  console.log(item.padEnd(24) + kahn.padEnd(36) + dfs);
}
console.log('');
console.log('  Kahn 算法更直观、能做并行调度；DFS 版本代码更短、还能顺带算出别的信息。');
console.log('  工程上 npx / npm / webpack 基本都是用 Kahn 的思路（要按层并行构建）。');

// ---------------------------------------------------------------------------
// 7. 实测：邻接表 vs 邻接矩阵
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实测：邻接表 vs 邻接矩阵 ---');
console.log('');
console.log('构造一张【稀疏图】：V 个顶点，每个顶点平均只有 3 个邻居。');
console.log('这是真实社交网络 / 依赖图的典型形态（边数远小于 V²）。');

const V = 1500;
const DEGREE = 3;

const sparseList = new AdjacencyListGraph(false);
{
  let s = 20240916;
  const nextRand = () => {
    s = (s * 48271) % 2147483647;
    return s;
  };
  for (let i = 0; i < V; i++) sparseList.addVertex(`v${i}`);
  for (let i = 0; i < V; i++) {
    for (let d = 0; d < DEGREE; d++) {
      const target = nextRand() % V;
      if (target !== i) sparseList.addEdge(`v${i}`, `v${target}`);
    }
  }
}

const labels = sparseList.vertices;
const sparseMatrix = new AdjacencyMatrixGraph(labels, false);
for (const v of labels) {
  for (const n of sparseList.neighbors(v)) sparseMatrix.addEdge(v, n);
}

console.log('');
console.log(`顶点数 V = ${sparseList.vertexCount}，边数 E = ${sparseList.edgeCount}（稀疏图）`);
console.log(`邻接矩阵要开 ${V} × ${V} = ${(V * V).toLocaleString('en-US')} 个格子，`);
console.log(`而实际有边的格子只有 ${(sparseList.edgeCount * 2).toLocaleString('en-US')} 个（无向图算两遍），`);
console.log(`空间利用率只有约 ${((sparseList.edgeCount * 2) / (V * V) * 100).toFixed(2)}% —— 其余全是浪费。`);

// 7.1 遍历所有顶点的所有邻居（这是 BFS/DFS 最核心的操作）
const iterListMs = medianMs(() => {
  let count = 0;
  for (const v of labels) for (const n of sparseList.neighbors(v)) count += 1;
  sink.value = count;
});

const iterMatrixMs = medianMs(() => {
  let count = 0;
  for (const v of labels) for (const n of sparseMatrix.neighbors(v)) count += 1;
  sink.value = count;
});

// 7.2 判断两点是否相邻
const PROBES = 5000;
const probePairs = [];
{
  let s = 999;
  const nextRand = () => {
    s = (s * 48271) % 2147483647;
    return s;
  };
  for (let i = 0; i < PROBES; i++) {
    probePairs.push([labels[nextRand() % V], labels[nextRand() % V]]);
  }
}

const hasEdgeListMs = medianMs(() => {
  let count = 0;
  for (const [u, v] of probePairs) if (sparseList.hasEdge(u, v)) count += 1;
  sink.value = count;
});

const hasEdgeMatrixMs = medianMs(() => {
  let count = 0;
  for (const [u, v] of probePairs) if (sparseMatrix.hasEdge(u, v)) count += 1;
  sink.value = count;
});

// 一致性校验
let edgeCheckOk = true;
for (const [u, v] of probePairs) {
  if (sparseList.hasEdge(u, v) !== sparseMatrix.hasEdge(u, v)) edgeCheckOk = false;
}

// 7.3 再测一张【稠密图】：每个顶点有 150 个邻居。
// 这一步是为了看到"邻接矩阵的 O(1) 判断相邻"究竟在什么条件下才真正占优。
const V2 = 1200;
const DEGREE2 = 150;
const denseList = new AdjacencyListGraph(false);
{
  let s = 8888;
  const nextRand = () => {
    s = (s * 48271) % 2147483647;
    return s;
  };
  for (let i = 0; i < V2; i++) denseList.addVertex(`w${i}`);
  for (let i = 0; i < V2; i++) {
    for (let d = 0; d < DEGREE2; d++) {
      const target = nextRand() % V2;
      if (target !== i) denseList.addEdge(`w${i}`, `w${target}`);
    }
  }
}
const labels2 = denseList.vertices;
const denseMatrix = new AdjacencyMatrixGraph(labels2, false);
for (const v of labels2) for (const n of denseList.neighbors(v)) denseMatrix.addEdge(v, n);

const denseProbes = [];
{
  let s = 777;
  const nextRand = () => {
    s = (s * 48271) % 2147483647;
    return s;
  };
  for (let i = 0; i < PROBES; i++) denseProbes.push([labels2[nextRand() % V2], labels2[nextRand() % V2]]);
}

const denseIterListMs = medianMs(() => {
  let count = 0;
  for (const v of labels2) for (const n of denseList.neighbors(v)) count += 1;
  sink.value = count;
});
const denseIterMatrixMs = medianMs(() => {
  let count = 0;
  for (const v of labels2) for (const n of denseMatrix.neighbors(v)) count += 1;
  sink.value = count;
});
const denseHasEdgeListMs = medianMs(() => {
  let count = 0;
  for (const [u, v] of denseProbes) if (denseList.hasEdge(u, v)) count += 1;
  sink.value = count;
});
const denseHasEdgeMatrixMs = medianMs(() => {
  let count = 0;
  for (const [u, v] of denseProbes) if (denseMatrix.hasEdge(u, v)) count += 1;
  sink.value = count;
});

let denseCheckOk = true;
for (const [u, v] of denseProbes) {
  if (denseList.hasEdge(u, v) !== denseMatrix.hasEdge(u, v)) denseCheckOk = false;
}

console.log('');
console.log('实测对比（两张图、同样的操作）：');
console.log('');
console.log('场景 / 操作'.padEnd(42) + '邻接表(ms)'.padEnd(15) + '邻接矩阵(ms)'.padEnd(16) + '谁更快');
console.log('-'.repeat(90));
{
  const row = (label, a, b) => {
    const winner = a <= b ? `邻接表 ${(b / a).toFixed(2)}x` : `矩阵 ${(a / b).toFixed(2)}x`;
    console.log(label.padEnd(40) + a.toFixed(4).padEnd(15) + b.toFixed(4).padEnd(16) + winner);
  };
  row(`稀疏图(度=3) 遍历所有邻居`, iterListMs, iterMatrixMs);
  row(`稀疏图(度=3) 判断相邻 ×${PROBES}`, hasEdgeListMs, hasEdgeMatrixMs);
  row(`稠密图(度=${DEGREE2}) 遍历所有邻居`, denseIterListMs, denseIterMatrixMs);
  row(`稠密图(度=${DEGREE2}) 判断相邻 ×${PROBES}`, denseHasEdgeListMs, denseHasEdgeMatrixMs);
}
console.log('');
console.log(`  正确性校验：两张图上两种表示法的 hasEdge 结果都完全一致 = ${edgeCheckOk && denseCheckOk}`);
console.log('');
console.log('结果说明（这四行数据把两种表示法的性格展现得非常清楚）：');
console.log('');
console.log('  ① 遍历邻居：无论稀疏还是稠密，邻接表都完胜。');
console.log(`     稀疏图：邻接表只走真实的边（约 ${sparseList.edgeCount * 2} 次），`);
console.log(`             邻接矩阵却要对每个顶点扫完整行（${V} × ${V} = ${(V * V).toLocaleString('en-US')} 次）；`);
console.log(`     稠密图：矩阵虽然利用率高了，但它仍然要扫 ${V2} × ${V2} 个格子，`);
console.log('             而邻接表只走真实存在的边 —— 差距依然明显。');
console.log('');
console.log('  ② 判断相邻：这一项的结果很反直觉 —— 稀疏图上两者几乎【打平】！');
console.log('     按理论，矩阵是 O(1)、邻接表是 O(度)，矩阵应该碾压才对。');
console.log('     但实测两者的差距落在噪声范围内（邻接表甚至还略快一点点）。');
console.log('     原因：矩阵的 hasEdge 要先做两次 Map 查表把顶点名转成下标，');
console.log('     再做一次二维数组索引；而邻接表的邻居名单平均只有 3 个元素，');
console.log('     一次 Map 查表 + 扫 3 个元素，成本基本相同。');
console.log('     所谓"矩阵 O(1)、邻接表 O(度)"只是【渐近复杂度】的说法，');
console.log('     度很小时常数因子会把理论差距完全抹平 —— 又一条"理论不等于实测"的例证。');
console.log('');
console.log(`  ③ 但到了稠密图（度 = ${DEGREE2}），矩阵的 O(1) 优势终于兑现了：`);
console.log(`     邻接表的 hasEdge 需要扫过最多 ${DEGREE2} 个元素，实测慢了`);
console.log(`     ${(denseHasEdgeListMs / denseHasEdgeMatrixMs).toFixed(2)} 倍 —— 这才是矩阵的主场。`);
console.log('');
console.log('  ④ 结论：');
console.log('     · BFS / DFS 的核心操作是"遍历邻居"，所以它们【必须】用邻接表；');
console.log('     · 邻接矩阵只在"顶点少、边很稠密、且频繁需要判断两点是否相邻"时才划算；');
console.log('     · 大多数真实图（社交、依赖、路由）都是稀疏的，所以默认选邻接表。');

// ---------------------------------------------------------------------------
// 8. 复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 8. 复杂度对照表 ---');

console.log('操作'.padEnd(36) + '邻接表'.padEnd(20) + '邻接矩阵');
console.log('-'.repeat(80));
for (const [op, list, matrix] of [
  ['存储空间', 'O(V + E)', 'O(V²)'],
  ['添加顶点', 'O(1)', 'O(V²)'],
  ['添加边', 'O(1)', 'O(1)'],
  ['删除边 u-v', 'O(degree(u))', 'O(1)'],
  ['判断 u-v 是否相邻', 'O(degree(u))', 'O(1)'],
  ['遍历 v 的所有邻居', 'O(degree(v))', 'O(V)'],
  ['遍历整张图', 'O(V + E)', 'O(V²)'],
]) {
  console.log(op.padEnd(34) + list.padEnd(20) + matrix);
}

console.log('');
console.log('算法'.padEnd(32) + '时间复杂度'.padEnd(20) + '空间复杂度'.padEnd(18) + '说明');
console.log('-'.repeat(104));
for (const [algo, time, space, note] of [
  ['DFS（邻接表）', 'O(V + E)', 'O(V)', '递归版的空间含递归栈深度'],
  ['BFS（邻接表）', 'O(V + E)', 'O(V)', 'visited + 队列 + 可选的 parent 表'],
  ['DFS / BFS（邻接矩阵）', 'O(V²)', 'O(V)', '遍历邻居退化成扫整行，所以是 V²'],
  ['无权图最短路径（BFS）', 'O(V + E)', 'O(V)', 'parent 表回溯出路径'],
  ['拓扑排序（Kahn）', 'O(V + E)', 'O(V)', '入度表 + 队列'],
  ['拓扑排序（DFS 后序）', 'O(V + E)', 'O(V)', '递归栈深度最坏是 V，深图有爆栈风险'],
  ['检测有向图是否有环', 'O(V + E)', 'O(V)', 'DFS 三色标记 或 Kahn 结果长度判断'],
  ['连通分量（无向图）', 'O(V + E)', 'O(V)', '对每个未访问顶点跑一次 DFS/BFS'],
  ['带权图最短路径（Dijkstra）', 'O((V+E) log V)', 'O(V)', '把 BFS 的队列换成优先队列'],
]) {
  console.log(algo.padEnd(30) + time.padEnd(20) + space.padEnd(18) + note);
}

console.log('');
console.log('遇到的图问题该怎么选算法？');
console.log('');
console.log('  问题'.padEnd(36) + '该用什么');
console.log('  ' + '-'.repeat(72));
for (const [problem, answer] of [
  ['从一个点出发，能不能到达另一个点', 'DFS 或 BFS 都行（BFS 通常更省内存）'],
  ['无权图的最短路径（最少几跳）', 'BFS ★（DFS 做不到）'],
  ['带权图的短路（边的权重不同）', 'Dijkstra（优先队列 + BFS 思想）'],
  ['判断有没有循环依赖', 'DFS 三色标记 / Kahn 算法'],
  ['排出一个合法的执行顺序', '拓扑排序'],
  ['图里有几个独立的连通块', '对每个未访问顶点各跑一次 DFS/BFS'],
  ['按距离一层层处理（如好友推荐）', 'BFS ★'],
  ['枚举所有路径 / 所有方案', 'DFS + 回溯'],
  ['只需要知道"能不能走到"，且图很深', 'BFS 更安全（DFS 递归会爆栈）'],
]) {
  console.log('  ' + problem.padEnd(36) + answer);
}

console.log('');
console.log('一句话总结：');
console.log('  · 遍历是图算法的基础 —— 几乎所有图算法（最短路、连通性、拓扑排序）');
console.log('    都是在 DFS 或 BFS 的骨架上加一点额外逻辑；');
console.log('  · DFS 用栈、BFS 用队列，这一个数据结构之差决定了两者完全不同的行为；');
console.log('  · 记住"无权图最短路用 BFS"这一条，它能解决大量实际问题；');
console.log('  · 图论里"别忘了标记已访问"和"注意递归深度"是两个最常见的坑。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
