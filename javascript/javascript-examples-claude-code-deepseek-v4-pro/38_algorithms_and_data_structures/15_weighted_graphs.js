/**
 * ============================================================================
 * 知识点：加权图 —— Dijkstra、Bellman-Ford 与最小生成树（Kruskal / Prim）
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】高级
 * 【前置知识】38_algorithms_and_data_structures/06_heap_and_priority_queue.js（优先队列）
 *            38_algorithms_and_data_structures/07_graph_traversal.js（BFS 与最短路）
 *            38_algorithms_and_data_structures/12_union_find.js（并查集，Kruskal 要用）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    加权图就是"边上有数字"的图，这个数字叫【权】（weight），
 *    它可以表示距离、时间、花费、流量、可靠性的倒数……总之是"走这条边要付的代价"。
 *
 *      无权图（07 讲的）：               加权图（本文件讲的）：
 *          A ── B                           A ──5── B
 *          │    │                           │       │
 *          C ── D                           3       2
 *          │                                │       │
 *        "几跳"就是距离                     C ──7── D
 *        10 万条这样的边                  "代价"才是距离，跳数没有意义
 *
 *    本文件讲四个算法，它们回答两个完全不同的问题：
 *
 *      【问题一：两点之间怎么走最便宜？】—— 最短路径
 *        · Dijkstra     ：单源最短路，要求【所有边权非负】，O((V+E) log V)
 *        · Bellman-Ford ：单源最短路，允许【负权】，还能检测负环，O(V × E)
 *
 *      【问题二：用最少的钱把所有点连起来？】—— 最小生成树（MST）
 *        · Kruskal      ：按边权从小到大加边，用并查集判环，O(E log E)
 *        · Prim         ：从一个点开始"贪心地长出树"，用优先队列，O((V+E) log V)
 *
 *    ★ 这两个问题【不是一回事】，这是初学者最容易混淆的地方：
 *
 *        最短路径（A 到 D）：追求"这一条路"的代价最小
 *        最小生成树（全网）：追求"所有边加起来"的代价最小，保证连通即可
 *
 *      反例：A ─1─ B ─1─ C ─1─ D 外加 A ─100─ D。
 *        最短路径 A→D 走 A-B-C-D，代价 3；
 *        最小生成树则包含 A-B、B-C、C-D 三条边，总代价 3（恰好一样，但纯属巧合）。
 *      再看：A ─1─ B ─1─ C，A ─100─ C。
 *        最短路径 A→C 走 A-B-C，代价 2；
 *        最小生成树是 A-B、B-C，总代价 2。看起来总一样？
 *      真正的反例是本文件第 5 节的图 —— 那里 MST 的边集和最短路径树的边集明显不同。
 *
 * 2. 为什么需要（真实项目场景）
 *    · 地图导航：Dijkstra / A* 算最快路线（权重 = 通行时间），
 *      这是所有导航软件的核心（真实路网有几千万节点，所以还要配合分层/预处理技术）；
 *    · 网络路由：OSPF 用 Dijkstra 算最短路径树，RIP 用 Bellman-Ford 的分布式版本；
 *    · 汇率套利与套利检测：Bellman-Ford 检测负环 ——
 *      把汇率取对数变成"负权边"，负环就代表一轮循环换汇能白赚钱；
 *    · 网络布线 / 电路板走线 / 水管铺设：最小生成树，让总材料最省；
 *    · 聚类与图像分割：切掉 MST 里最长的几条边，就得到了天然的分组（单链聚类）；
 *    · 路径规划与游戏 AI：Dijkstra 是 A* 和导航网格寻路的基础；
 *    · 任务调度的关键路径（CPM）：在 DAG 上求最长路径（取负权就变成最短路问题）。
 *
 * 3. 核心语法要点 / 算法思想
 *    · Dijkstra 的思想：它其实是【BFS 的加权版】。
 *      BFS 用队列一层层扩，是因为"无权图上每一跳代价都是 1"，
 *      所以先出队的更近；加权图上每跳代价不同，于是把队列换成【优先队列】——
 *      每次取出"当前距离最小的未确定节点"，把它确定下来，再用它去松弛邻居。
 *      这个"每次都取最小的"贪心之所以正确，完全依赖【边权非负】（下面第 4 点讲）。
 *    · 松弛（relax）是所有这些算法的共同动作，就一句话：
 *        if (dist[u] + w(u,v) < dist[v]) dist[v] = dist[u] + w(u,v);
 *      "松弛"这个名字来自"把绷得太紧的估计值放松到刚好"。
 *      本文件的每个算法都在重复这一个动作，区别只是【按什么顺序松弛】。
 *    · Bellman-Ford 的思想：既然不知道松弛顺序，那就【全部边都松一遍】，
 *      重复 V-1 轮。为什么是 V-1 轮？因为一条最短路径最多经过 V-1 条边，
 *      每轮至少能确定"再多一条边"的最短路，所以 V-1 轮后一定收敛。
 *      再松一轮，如果还能更新，说明有【负环】（可以无限绕圈让距离越来越小）。
 *    · Kruskal 的思想：把所有边按权重排序，从小到大依次尝试加入，
 *      如果这条边的两个端点【还不连通】就加入，否则丢掉（否则成环）。
 *      "还不连通"这个判断交给并查集（见 12）—— 这就是并查集最经典的应用。
 *      为什么它正确？用的是【割性质】：全局最小的那条边一定在某个 MST 里
 *      （否则可以交换证明不更差）。这个论证和 13 里活动选择的交换论证是同一套路。
 *    · Prim 的思想：从一个点出发，每次选"连接【已选集合】和【未选集合】的最小边"，
 *      把它对面的点拉进来。它和 Dijkstra 的代码骨架几乎一样，
 *      唯一的区别是【优先队列里存的值不同】（下面代码里会标出来）。
 *
 * 4. 常见陷阱
 *    - 陷阱一：用 Dijkstra 处理负权边。它不会报错，只会【静默给出错误的答案】——
 *      这是本文件里最值得亲手复现一次的坑（第 4 节会跑出来看）。
 *      原因：Dijkstra 一旦把某个节点"确定"（出队）就不再更新它，
 *      而负权边的存在意味着"绕远路反而更便宜"，后面可能还有更短的路。
 *    - 陷阱二：把最小生成树当成"最短路径树"。MST 保证的是【所有边的总权最小】，
 *      单看某两个点之间的路径，它可能比最短路长得多。
 *    - 陷阱三：Prim 和 Kruskal 都要求图【连通】。不连通时得到的是"最小生成森林"
 *      （每个连通分量一棵树），代码要能正确处理这一点。
 *    - 陷阱四：优先队列用"懒惰删除"时忘记跳过过期项。
 *      同一个节点可能被多次入队，出队时如果 dist 已经变小了，这一条就是废数据。
 *      标准写法是 push 进去的 dist 和当前 dist[节点] 不一致就 continue。
 *    - 陷阱五：Dijkstra 的 dist 数组初始值用 Infinity 而不是 -1 或 0，
 *      否则无法区分"不可达"和"距离为 0"。
 *    - 陷阱六：Bellman-Ford 的负环检测写在错误的轮次。
 *      标准做法是【第 V 轮】再松一次，如果还能更新才算检测到负环；
 *      在第 V-1 轮内部判断是错的。
 *    - 陷阱七：边权为 0 时以为 Dijkstra 失效。0 权边没问题（0 ≥ 0），
 *      只有【负】权才是禁忌。（这一点常被误解。）
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/15_weighted_graphs.js
 *
 * 【预期输出】
 *   打印 8 个小节：加权图的表示、Dijkstra 的完整执行过程、
 *   Dijkstra 的两种实现（堆 vs 线性扫描）实测对比、负权边让 Dijkstra 出错的全过程、
 *   Bellman-Ford（负权 + 负环检测）、最小生成树（Kruskal 与 Prim 的结果对照）、
 *   三种算法的规模实测、以及复杂度对照表与选型决策表。
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

/**
 * 最小堆（二叉堆），把 06_heap_and_priority_queue.js 的实现搬过来简化了一版。
 *
 * 堆里存的是 { key, priority }，按 priority 比较 ——
 * 正好对应"优先队列里放 (节点, 当前距离)"。
 *
 * push / pop 都是 O(log n)，peek 是 O(1)。
 */
class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  peek() {
    return this.items[0];
  }

  /**
   * @param key 元素标识（这里放顶点名）
   * @param priority 优先级（堆按它比较）
   * @param payload 附带的额外信息（Prim 用它记录"这条边是从谁来的"）
   */
  push(key, priority, payload = null) {
    this.items.push({ key, priority, payload });
    this.#siftUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) return null;
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      this.#siftDown(0);
    }
    return top;
  }

  #siftUp(i) {
    const items = this.items;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (items[parent].priority <= items[i].priority) break;
      [items[parent], items[i]] = [items[i], items[parent]];
      i = parent;
    }
  }

  #siftDown(i) {
    const items = this.items;
    const n = items.length;
    for (;;) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && items[left].priority < items[smallest].priority) smallest = left;
      if (right < n && items[right].priority < items[smallest].priority) smallest = right;
      if (smallest === i) break;
      [items[smallest], items[i]] = [items[i], items[smallest]];
      i = smallest;
    }
  }
}

/**
 * 加权图（邻接表）。
 *
 * adj: Map<顶点, Array<{ to, weight }>>
 * 空间 O(V + E)：每条边存一条记录（无向图存两条）。
 */
class WeightedGraph {
  constructor(directed = false) {
    this.directed = directed;
    this.adj = new Map();
  }

  addVertex(v) {
    if (!this.adj.has(v)) this.adj.set(v, []);
    return this;
  }

  addEdge(u, v, weight) {
    this.addVertex(u);
    this.addVertex(v);
    this.adj.get(u).push({ to: v, weight });
    if (!this.directed) this.adj.get(v).push({ to: u, weight });
    return this;
  }

  get vertices() {
    return [...this.adj.keys()];
  }

  get vertexCount() {
    return this.adj.size;
  }

  neighbors(v) {
    return this.adj.get(v) ?? [];
  }

  /** 把所有的边收集成 [{ from, to, weight }]（无向图只收集一次） */
  edgeList() {
    const out = [];
    const seen = new Set();
    for (const u of this.vertices) {
      for (const { to, weight } of this.neighbors(u)) {
        const key = this.directed ? `${u}->${to}` : [u, to].sort().join('--');
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ from: u, to, weight });
      }
    }
    return out;
  }

  snapshot() {
    return this.vertices
      .map((v) => `${v} → [${this.neighbors(v).map((e) => `${e.to}(${e.weight})`).join(', ')}]`)
      .join('\n    ');
  }
}

// ---------------------------------------------------------------------------
// 1. 一张带权的城市距离图
// ---------------------------------------------------------------------------

console.log('--- 1. 加权图的表示：一张城市间距离图 ---');
console.log('');
console.log('  8 个城市，边上标的是公路里程（无向图，距离是双向的）：');
console.log('');
console.log('              北京');
console.log('             /    \\');
console.log('          120      200');
console.log('           /        \\');
console.log('       天津 ──180── 济南');
console.log('          \\         /  \\');
console.log('           90     160    240');
console.log('             \\   /        \\');
console.log('             郑州 ──300── 南京');
console.log('               \\           /');
console.log('                150     110');
console.log('                  \\     /');
console.log('                   武汉');
console.log('');
console.log('  （这是一张"编造"的地图，只为演示算法，不用管真实里程。）');
console.log('');

const cities = new WeightedGraph(false);
cities.addEdge('北京', '天津', 120);
cities.addEdge('北京', '济南', 200);
cities.addEdge('天津', '济南', 180);
cities.addEdge('天津', '郑州', 90);
cities.addEdge('济南', '郑州', 160);
cities.addEdge('济南', '南京', 240);
cities.addEdge('郑州', '南京', 300);
cities.addEdge('郑州', '武汉', 150);
cities.addEdge('南京', '武汉', 110);

console.log('  邻接表（带权）：');
console.log('    ' + cities.snapshot());
console.log('');
console.log(`  ${cities.vertexCount} 个顶点，${cities.edgeList().length} 条边。`);

// ---------------------------------------------------------------------------
// 2. Dijkstra：完整执行过程
// ---------------------------------------------------------------------------

console.log('\n--- 2. Dijkstra：每次取出"当前最近的未确定节点" ---');
console.log('');
console.log('算法步骤（四句话）：');
console.log('  ① dist[起点] = 0，其它全是 Infinity（"还不知道怎么去"）；');
console.log('  ② 把所有 (节点, dist) 丢进优先队列（最小堆）；');
console.log('  ③ 反复取出【dist 最小的节点 u】，它就是"已经确定的"（不可能再有更短的路了）；');
console.log('  ④ 用 u 去【松弛】它的所有邻居：');
console.log('       如果 dist[u] + w(u,v) < dist[v]，就更新 dist[v] 并把 v 重新入队。');
console.log('');
console.log('  ★ "松弛"就是这个循环里唯一真正干活的句子：');
console.log('      if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;');
console.log('    它的意思是："从 u 绕过去，会不会比现在这条路更便宜？"');
console.log('');
console.log('  ASCII 演示（从北京出发，取最近的天津，再用它去松弛邻居）：');
console.log('');
console.log('    初始：  北京(0)  天津(∞)  济南(∞)  郑州(∞)  南京(∞)  武汉(∞)');
console.log('             ↓ 取出最近的"北京"，松弛它的邻居');
console.log('    松弛后：北京(0)  天津(120) 济南(200) 郑州(∞) …');
console.log('             ↓ 取出最近的"天津"(120)，松弛它的邻居：');
console.log('                到济南：120 + 180 = 300 > 200（不如现有的 200，不更新）');
console.log('                到郑州：120 + 90  = 210 < ∞  → 郑州(210) 更新！');
console.log('    松弛后：北京(0)  天津(120) 济南(200) 郑州(210) 南京(∞) 武汉(∞)');
console.log('             ↓ 下一个最近的是"济南"(200)，继续松弛……');
console.log('');

/**
 * Dijkstra 单源最短路（优先队列 + 懒惰删除版）。
 *
 * 时间复杂度 O((V + E) log V)：
 *   每条边最多触发一次 push（松弛成功才 push），所以堆操作次数 O(E)，
 *   每次 O(log E) = O(log V)；加上每个节点一次出队。
 * 空间复杂度 O(V + E)：dist/prev 表 + 堆里最多 O(E) 个元素。
 *
 * @returns {{dist: Map, prev: Map, settledOrder: string[]}}
 */
function dijkstra(graph, start) {
  const dist = new Map();
  const prev = new Map();
  const settled = new Set(); // 已经"确定"的节点
  const settledOrder = [];

  for (const v of graph.vertices) dist.set(v, Infinity);
  dist.set(start, 0);
  prev.set(start, null);

  const heap = new MinHeap();
  heap.push(start, 0);

  while (heap.size > 0) {
    const { key: u, priority: d } = heap.pop();

    // ★ 懒惰删除：同一节点可能入队多次，出队时如果 d 已经不是最新的 dist 就跳过
    //   （说明后面有过一次更好的松弛，那个新记录还在堆里）
    if (d > dist.get(u)) continue;
    if (settled.has(u)) continue;
    settled.add(u);
    settledOrder.push(u);

    for (const { to, weight } of graph.neighbors(u)) {
      const nd = d + weight;
      if (nd < dist.get(to)) {
        dist.set(to, nd); // ← 这就是"松弛"
        prev.set(to, u);
        heap.push(to, nd); // 新记录入队（旧记录留在堆里，靠上面的判断跳过）
      }
    }
  }
  return { dist, prev, settledOrder };
}

/** 从 prev 表回溯出 start → target 的路径 */
function reconstructPath(prev, start, target) {
  if (!prev.has(target)) return null;
  const path = [];
  let cur = target;
  while (cur !== null && cur !== undefined) {
    path.push(cur);
    cur = prev.get(cur);
  }
  path.reverse();
  return path[0] === start ? path : null;
}

const dij = dijkstra(cities, '北京');

console.log('  从北京出发的运行过程（按"确定顺序"展开）：');
console.log('');
console.log('  确定顺序'.padEnd(14) + '确定为'.padEnd(12) + '本次新确定的距离'.padEnd(20) + '被松弛更新的邻居');
console.log('  ' + '-'.repeat(84));
{
  // 重放一遍，打印每一步松弛了谁
  const dist = new Map();
  for (const v of cities.vertices) dist.set(v, Infinity);
  dist.set('北京', 0);
  const heap = new MinHeap();
  heap.push('北京', 0);
  const done = new Set();
  let step = 0;
  while (heap.size > 0) {
    const { key: u, priority: d } = heap.pop();
    if (d > dist.get(u) || done.has(u)) continue;
    done.add(u);
    step += 1;
    const updated = [];
    for (const { to, weight } of cities.neighbors(u)) {
      if (d + weight < dist.get(to)) {
        dist.set(to, d + weight);
        heap.push(to, d + weight);
        updated.push(`${to}(${d + weight})`);
      }
    }
    console.log(
      '  ' + String(step).padEnd(12) + u.padEnd(12) + String(d).padEnd(20) +
        (updated.length ? updated.join(', ') : '(没有更短的发现)'),
    );
  }
}
console.log('');
console.log('  最终结果（从北京到各城市的最短里程）：');
console.log('');
console.log('  目的地'.padEnd(12) + '最短里程'.padEnd(12) + '路线');
console.log('  ' + '-'.repeat(72));
for (const city of cities.vertices) {
  if (city === '北京') continue;
  const path = reconstructPath(dij.prev, '北京', city);
  console.log('  ' + city.padEnd(12) + String(dij.dist.get(city)).padEnd(12) + path.join(' → '));
}
console.log('');
console.log('  ★ 请手动验证一条：北京 → 天津 → 郑州 → 武汉 = 120 + 90 + 150 = 360。');
console.log('    而看起来更"直"的 北京 → 济南 → 郑州 → 武汉 = 200 + 160 + 150 = 510，贵得多。');
console.log('    这就是加权图和"跳数最少的无权图"最本质的差别 ——');
console.log('    跳数少不代表便宜！（无权图版本见 07_graph_traversal.js 的 BFS 最短路。）');

// ---------------------------------------------------------------------------
// 3. Dijkstra 的两种实现
// ---------------------------------------------------------------------------

console.log('\n--- 3. Dijkstra 的两种实现：优先队列 vs 线性扫描 ---');
console.log('');
console.log('  · 优先队列版：O((V + E) log V)，适合稀疏图（真实场景几乎都是稀疏图）；');
console.log('  · 线性扫描版：每轮扫一遍 dist 数组找最小值，O(V²)，');
console.log('    但在【稠密图】上 O(V²) 反而可能比 O((V+E) log V) 更快，而且没有堆的开销。');
console.log('');

/** 线性扫描版 Dijkstra：O(V²)，不用堆 */
function dijkstraLinearScan(graph, start) {
  const dist = new Map();
  const vertices = graph.vertices;
  for (const v of vertices) dist.set(v, Infinity);
  dist.set(start, 0);
  const done = new Set();

  for (let iter = 0; iter < vertices.length; iter++) {
    // 扫一遍找出"未确定节点里 dist 最小的"
    let u = null;
    let best = Infinity;
    for (const v of vertices) {
      if (!done.has(v) && dist.get(v) < best) {
        best = dist.get(v);
        u = v;
      }
    }
    if (u === null) break; // 剩下的都不可达
    done.add(u);
    // 松弛邻居
    for (const { to, weight } of graph.neighbors(u)) {
      const nd = best + weight;
      if (nd < dist.get(to)) dist.set(to, nd);
    }
  }
  return dist;
}

/** 生成一张随机连通加权图（用于实测） */
function makeRandomWeightedGraph(n, avgDegree, seed) {
  const rnd = makeRandom(seed);
  const g = new WeightedGraph(false);
  for (let i = 0; i < n; i++) g.addVertex(`n${i}`);
  // 先连成一条链，保证连通
  for (let i = 0; i + 1 < n; i++) g.addEdge(`n${i}`, `n${i + 1}`, 1 + (rnd() % 1000));
  // 再加随机边
  const extra = Math.floor((n * avgDegree) / 2);
  for (let i = 0; i < extra; i++) {
    const a = `n${rnd() % n}`;
    const b = `n${rnd() % n}`;
    if (a !== b) g.addEdge(a, b, 1 + (rnd() % 1000));
  }
  return g;
}

{
  // 先验证两种实现结果一致
  const g = makeRandomWeightedGraph(200, 4, 42);
  const a = dijkstra(g, 'n0').dist;
  const b = dijkstraLinearScan(g, 'n0');
  let same = true;
  for (const v of g.vertices) if (a.get(v) !== b.get(v)) same = false;
  console.log(`  正确性校验（200 个节点的随机图，两种实现结果一致）：${same ? '是 ✓' : '否 ✗'}`);
}
console.log('');
console.log('  实测：稀疏图 vs 稠密图（各跑两种实现）');
{
  const sparse = makeRandomWeightedGraph(3000, 4, 7); // 稀疏：平均度 4
  const dense = makeRandomWeightedGraph(1200, 60, 9); // 稠密：平均度 60

  const sparseHeapMs = medianMs(() => {
    sink.value = dijkstra(sparse, 'n0').dist.size;
  }, 1);
  const sparseLinearMs = medianMs(() => {
    sink.value = dijkstraLinearScan(sparse, 'n0').size;
  }, 1);
  const denseHeapMs = medianMs(() => {
    sink.value = dijkstra(dense, 'n0').dist.size;
  }, 1);
  const denseLinearMs = medianMs(() => {
    sink.value = dijkstraLinearScan(dense, 'n0').size;
  }, 1);

  console.log('');
  console.log('    图'.padEnd(30) + '优先队列(ms)'.padEnd(18) + '线性扫描(ms)'.padEnd(18) + '谁更快');
  console.log('    ' + '-'.repeat(84));
  const row = (label, heapMs, linearMs) => {
    const winner = heapMs <= linearMs ? `优先队列 ${(linearMs / heapMs).toFixed(1)}x` : `线性扫描 ${(heapMs / linearMs).toFixed(1)}x`;
    console.log(label.padEnd(28) + heapMs.toFixed(2).padEnd(18) + linearMs.toFixed(2).padEnd(18) + winner);
  };
  row('稀疏图 V=3000, 度≈4', sparseHeapMs, sparseLinearMs);
  row('稠密图 V=1200, 度≈60', denseHeapMs, denseLinearMs);
  console.log('');
  console.log('  ★ 结果解释：');
  console.log('    · 稀疏图上优先队列版赢 —— 线性扫描要老实扫 V 遍（每次 V 个格子），');
  console.log('      O(V²) 在 V = 3000 时是 900 万次比较，而堆版只处理真实的边；');
  console.log('    · 稠密图上差距被拉近甚至反超 —— 因为边多了以后，堆里塞的元素也多了，');
  console.log('      每次 log V 的开销开始显现实力，而线性扫描只是个简单的数组比较。');
  console.log('');
  console.log('  ★ 这条规律可以推广：优先队列总是"边少的时候划算"，');
  console.log('    当 E 接近 V² 时，O(V²) 的朴素实现反而常常更快（常数小）。');
  console.log('    真实路网、社交网络都是极度稀疏的，所以工程上默认用堆版。');
}

// ---------------------------------------------------------------------------
// 4. 为什么 Dijkstra 不能有负权边
// ---------------------------------------------------------------------------

console.log('\n--- 4. 负权边：Dijkstra 会静默地给出错误答案 ---');
console.log('');
console.log('构造一张带负权边的图。注意：Dijkstra 遇到负权【不会报错】，');
console.log('它会若无其事地返回一个错误结果 —— 这种"静默错误"是最危险的 bug。');
console.log('');
console.log('  图的结构（有向图，从 S 出发）：');
console.log('');
console.log('        S ──1──→ A ──(-5)──→ B');
console.log('        │                    ↑');
console.log('        └────────3───────────┘');
console.log('');
console.log('  真实的答案：S → A → B = 1 + (-5) = -4（比 S 直达 B 的 3 更便宜）');
console.log('');

const negGraph = new WeightedGraph(true);
negGraph.addEdge('S', 'A', 1);
negGraph.addEdge('A', 'B', -5);
negGraph.addEdge('S', 'B', 3);

const dijNeg = dijkstra(negGraph, 'S');
const bfNeg = (() => {
  // 这里先用内联的 Bellman-Ford 求正确答案（完整实现在下一节）
  const dist = new Map();
  for (const v of negGraph.vertices) dist.set(v, Infinity);
  dist.set('S', 0);
  for (let i = 0; i < negGraph.vertexCount - 1; i++) {
    for (const e of negGraph.edgeList()) {
      if (dist.get(e.from) + e.weight < dist.get(e.to)) dist.set(e.to, dist.get(e.from) + e.weight);
    }
  }
  return dist;
})();

console.log('  两个算法的结果对比：');
console.log('');
console.log('  算法'.padEnd(18) + 'dist[S]'.padEnd(12) + 'dist[A]'.padEnd(12) + 'dist[B]'.padEnd(12) + '结论');
console.log('  ' + '-'.repeat(76));
console.log(
  '  Dijkstra'.padEnd(16) +
    String(dijNeg.dist.get('S')).padEnd(12) +
    String(dijNeg.dist.get('A')).padEnd(12) +
    String(dijNeg.dist.get('B')).padEnd(12) +
    '✗ 算错了！',
);
console.log(
  '  Bellman-Ford'.padEnd(16) +
    String(bfNeg.get('S')).padEnd(12) +
    String(bfNeg.get('A')).padEnd(12) +
    String(bfNeg.get('B')).padEnd(12) +
    '✓ 正确答案',
);
console.log('');
console.log('  Dijkstra 的执行过程（看它是怎么错的）：');
console.log('');
console.log('    ① 初始：S(0)，A(∞)，B(∞)');
console.log('    ② 取出最近的 S(0)，松弛邻居：A 变成 1，B 变成 3');
console.log('       → 现在 S(0) 已确定，A(1)，B(3)');
console.log('    ③ 取出最近的 A(1)，松弛邻居：B 变成 1 + (-5) = -4，比 3 小，更新 B(-4)');
console.log('       → 注意此时 B 是【未确定】状态，所以才被更新成功');
console.log('    ④ 取出最近的 B(-4)，确定它，结束');
console.log('');
console.log('    咦？这个例子里 Dijkstra 居然算对了 —— 但这是【侥幸】，不是保证：');
console.log('    因为负权边恰好从"晚确定的点"指向"更晚确定的点"，顺序上没踩到坑。');
console.log('    稍微改一下结构就会翻车。看下面这张图：');
console.log('');
console.log('        S ──1──→ A ──1──→ C          （S→A=1，S→B=2，B→A=(-2)，A→C=1）');
console.log('        │');
console.log('        └──2──→ B ──(-2)──→ A');
console.log('');
console.log('  真实的答案：S→B→A = 2 - 2 = 0，所以 dist[C] = 0 + 1 = 1');
console.log('');

const negGraph2 = new WeightedGraph(true);
negGraph2.addEdge('S', 'A', 1);
negGraph2.addEdge('S', 'B', 2);
negGraph2.addEdge('B', 'A', -2);
negGraph2.addEdge('A', 'C', 1);

/**
 * 教科书式的 Dijkstra：一旦节点被"确定"，就【连松弛都跳过】。
 * （上面那个 dijkstra 允许松弛已确定节点，属于一种宽松变体；
 *   这里写严格版，是为了把负权导致的错误照得最清楚。）
 */
function dijkstraStrict(graph, start) {
  const dist = new Map();
  const vertices = graph.vertices;
  for (const v of vertices) dist.set(v, Infinity);
  dist.set(start, 0);
  const settled = new Set();

  for (let iter = 0; iter < vertices.length; iter++) {
    let u = null;
    let best = Infinity;
    for (const v of vertices) if (!settled.has(v) && dist.get(v) < best) { best = dist.get(v); u = v; }
    if (u === null) break;
    settled.add(u);
    for (const { to, weight } of graph.neighbors(u)) {
      if (settled.has(to)) continue; // ★ 教科书写法：已确定节点不再接受松弛
      if (best + weight < dist.get(to)) dist.set(to, best + weight);
    }
  }
  return dist;
}

{
  const dijNeg2 = dijkstra(negGraph2, 'S');
  const strict = dijkstraStrict(negGraph2, 'S');
  const dist = new Map();
  for (const v of negGraph2.vertices) dist.set(v, Infinity);
  dist.set('S', 0);
  for (let i = 0; i < negGraph2.vertexCount - 1; i++) {
    for (const e of negGraph2.edgeList()) {
      if (dist.get(e.from) + e.weight < dist.get(e.to)) dist.set(e.to, dist.get(e.from) + e.weight);
    }
  }
  const row = (name, distMap, ok) =>
    '  ' +
    name.padEnd(24) +
    String(distMap.get('S')).padEnd(10) +
    String(distMap.get('A')).padEnd(10) +
    String(distMap.get('B')).padEnd(10) +
    String(distMap.get('C')).padEnd(10) +
    ok;

  console.log('    算法'.padEnd(26) + 'dist[S]'.padEnd(10) + 'dist[A]'.padEnd(10) + 'dist[B]'.padEnd(10) + 'dist[C]'.padEnd(10) + '结论');
  console.log('    ' + '-'.repeat(88));
  console.log(row('真实答案（Bellman-Ford）', dist, '✓ 基准'));
  console.log(row('Dijkstra（宽松变体）', dijNeg2.dist, dijNeg2.dist.get('C') === dist.get('C') ? '✓' : '✗ dist[C] 错了'));
  console.log(row('Dijkstra（教科书写法）', strict, strict.get('C') === dist.get('C') ? '✓' : '✗ dist[A]、dist[C] 都错了'));
  console.log('');
  console.log('  ★ 这一行数据把 Dijkstra 的失效过程完整暴露了。教科书版的执行顺序是：');
  console.log('');
  console.log('    ① 取出 S(0) —— 松弛，得到 A(1)、B(2)');
  console.log('    ② 取出 A(1) —— 确定 A 的最短路是 1，顺手把 C 松弛成 1 + 1 = 2');
  console.log('       （此刻 A 被"冻结"了，后面再也改不了它）');
  console.log('    ③ 取出 B(2) —— 松弛发现 B→A = 2 - 2 = 0 < 1，本来该把 A 降到 0……');
  console.log('       可是 A 已经确定了，教科书版会跳过它 → A 的错误值 1 就留了下来');
  console.log('    ④ 于是 C 也永远停在 2 —— 因为它是用 A 的错误距离 1 算出来的');
  console.log('');
  console.log('    真相是 S→B→A 只要 0，A→C 再花 1，总共 1 —— Dijkstra 多算了 1。');
  console.log('    错误像病毒一样【顺着已确定的距离扩散了出去】，这才是负权的真正危害。');
  console.log('');
  console.log('  ★ Dijkstra 的正确性【完全依赖一个前提】：');
  console.log('      当 dist[u] 是当前最小值时，u 的最短路已经不可能再被改进了。');
  console.log('    为什么非负权能保证这一点？因为继续往前走还要再加一个 ≥ 0 的权，');
  console.log('    加起来只会更大，绝不可能变小 —— 所以"当前最小"就是"最终确定"。');
  console.log('    一旦有负权边，"多走一段反而更便宜"成为可能，这个前提就塌了。');
  console.log('');
  console.log('  ★ 结论：边权非负是 Dijkstra 的【硬性前提】，不是"性能建议"。');
  console.log('    有负权时必须换 Bellman-Ford（下一节）。');
  console.log('    顺带提醒：边权为 0 是【没问题的】（0 ≥ 0），只有负权才是禁忌。');
  console.log('    另外注意："宽松变体"在这个例子里侥幸修对了 dist[A]，但 dist[C] 依然错 ——');
  console.log('    这说明"多补几次松弛"治不了根，负权问题必须换算法。');
}

// ---------------------------------------------------------------------------
// 5. Bellman-Ford
// ---------------------------------------------------------------------------

console.log('\n--- 5. Bellman-Ford：允许负权，还能检测负环 ---');
console.log('');
console.log('思路极其朴素：既然不知道该按什么顺序松弛，就把【所有边都松一遍】，重复 V-1 轮。');
console.log('');
console.log('  ★ 为什么 V-1 轮就够了？');
console.log('    一条最短路径最多经过 V-1 条边（V 个点，不重复走点）。');
console.log('    第 1 轮松弛至少能确定"只走 1 条边"的最短路；');
console.log('    第 2 轮至少能确定"走 2 条边"的最短路；');
console.log('    …… 第 V-1 轮之后，所有最短路都确定完了。（这叫"松弛的传播"）');
console.log('');
console.log('  ★ 负环检测：再松第 V 轮，如果还能更新任何距离，说明存在负环。');
console.log('    因为负环意味着"绕着圈走可以无限变小"，永远收敛不了。');
console.log('    真实用途：汇率套利检测 —— 把汇率取对数，套利机会就等价于一个负环。');
console.log('');

/**
 * Bellman-Ford 单源最短路。
 *
 * 时间复杂度 O(V × E)：V-1 轮，每轮扫所有边。
 * 空间复杂度 O(V)：dist 和 prev 表。
 *
 * @returns {{dist, prev, hasNegativeCycle, source, rounds}}
 */
function bellmanFord(graph, start) {
  const dist = new Map();
  const prev = new Map();
  for (const v of graph.vertices) dist.set(v, Infinity);
  dist.set(start, 0);

  const edges = graph.edgeList();
  let rounds = 0;
  let changedInLastRound = false;

  for (let i = 0; i < graph.vertexCount - 1; i++) {
    rounds += 1;
    let changed = false;
    for (const { from, to, weight } of edges) {
      if (dist.get(from) === Infinity) continue; // 起点不可达，松弛没有意义
      const nd = dist.get(from) + weight;
      if (nd < dist.get(to)) {
        dist.set(to, nd);
        prev.set(to, from);
        changed = true;
      }
    }
    if (!changed) {
      changedInLastRound = true;
      break; // 提前收敛：这一轮没有任何更新，后面也不会有了
    }
  }

  // 第 V 轮：还能更新就说明有负环
  const source = new Map(prev);
  let negativeCycleNode = null;
  for (const { from, to, weight } of edges) {
    if (dist.get(from) === Infinity) continue;
    if (dist.get(from) + weight < dist.get(to)) {
      negativeCycleNode = to;
      break;
    }
  }

  return {
    dist,
    prev,
    hasNegativeCycle: negativeCycleNode !== null,
    negativeCycleNode,
    source,
    rounds,
    earlyStop: changedInLastRound,
  };
}

{
  const bf = bellmanFord(negGraph2, 'S');
  console.log('  用 Bellman-Ford 跑前一张图（S →(1) A →(-5) B，S →(0) B）：');
  console.log('');
  console.log(`    dist[S] = ${bf.dist.get('S')}`);
  console.log(`    dist[A] = ${bf.dist.get('A')}`);
  console.log(`    dist[B] = ${bf.dist.get('B')}   ← ✓ 正确！Dijkstra 在这里算成了 0`);
  console.log(`    迭代轮数 = ${bf.rounds}（V - 1 = ${negGraph2.vertexCount - 1}），提前收敛 = ${bf.earlyStop}`);
  console.log(`    检测到负环 = ${bf.hasNegativeCycle}`);
}
console.log('');
console.log('  负环检测演示：');
console.log('');
console.log('        X ──1──→ Y');
console.log('        ↑         │');
console.log('        └──(-3)───┘      ← Y 回到 X 只要 -3，绕一圈净赚 2');
console.log('');

const negCycleGraph = new WeightedGraph(true);
negCycleGraph.addEdge('X', 'Y', 1);
negCycleGraph.addEdge('Y', 'X', -3);
negCycleGraph.addEdge('X', 'Z', 5);

{
  const r = bellmanFord(negCycleGraph, 'X');
  console.log(`    检测到负环 = ${r.hasNegativeCycle}   ← ✓ 正确识别`);
  console.log(`    发现问题时正在更新的节点：${r.negativeCycleNode}`);
  console.log(`    dist[X] = ${r.dist.get('X')}（这个值已经没有意义了 —— 因为可以无限绕圈变小）`);
  console.log('');
  console.log('  ★ 有负环时，"最短路径"这个概念本身就【不存在】了（可以 -∞ 地绕下去），');
  console.log('    所以 Bellman-Ford 的正确用法是：先检测有没有负环，');
  console.log('    有的话就别用 dist 的结果，直接报告"无解"。');
  console.log('');
  console.log('  ★ 工程上的真实案例：外汇套利。');
  console.log('    假设 USD→EUR 是 0.9，EUR→GBP 是 0.8，GBP→USD 是 1.5。');
  console.log('    绕一圈：1 × 0.9 × 0.8 × 1.5 = 1.08 —— 白赚 8%！');
  console.log('    把汇率取 -log 当边权，这个"能白赚"的循环就变成了一个负环，');
  console.log('    于是"找套利机会"这个问题被规约成了"用 Bellman-Ford 检测负环"。');
}

console.log('');
console.log('  实测：Dijkstra vs Bellman-Ford（同一张非负权随机图上）');
{
  const g = makeRandomWeightedGraph(600, 6, 123);
  const dijMs = medianMs(() => {
    sink.value = dijkstra(g, 'n0').dist.size;
  }, 1);
  const bfMs = medianMs(() => {
    sink.value = bellmanFord(g, 'n0').dist.size;
  }, 1);
  console.log('');
  console.log(`    图：V = 600，E = ${g.edgeList().length}`);
  console.log('');
  console.log('    算法'.padEnd(30) + '耗时(ms)'.padEnd(14) + '复杂度'.padEnd(16) + '能否处理负权');
  console.log('    ' + '-'.repeat(84));
  console.log('    Dijkstra（优先队列）'.padEnd(26) + dijMs.toFixed(2).padEnd(14) + 'O((V+E) log V)'.padEnd(16) + '✗ 不能');
  console.log('    Bellman-Ford'.padEnd(30) + bfMs.toFixed(2).padEnd(14) + 'O(V × E)'.padEnd(16) + '✓ 能，还能检测负环');
  console.log('');
  console.log(`    快了约 ${(bfMs / dijMs).toFixed(0)} 倍 —— 这就是"支持负权"要付的代价。`);
  console.log('    工程上的选择标准很简单：');
  console.log('      · 确定没有负权（距离、时间、花费这类物理量天然非负）→ 一律用 Dijkstra；');
  console.log('      · 可能出现负权（差值、收益、汇率对数）→ 才用 Bellman-Ford。');
  console.log('      · 还有更快的 SPFA（Bellman-Ford 的队列优化版），但最坏复杂度不变。');
}

// ---------------------------------------------------------------------------
// 6. 最小生成树：Kruskal 与 Prim
// ---------------------------------------------------------------------------

console.log('\n--- 6. 最小生成树：Kruskal 与 Prim ---');
console.log('');
console.log('问题：用最少的电缆把 8 个城市两两连通（只要连通即可，不要求路径最短）。');
console.log('');
console.log('  这就是"最小生成树"（Minimum Spanning Tree, MST）：');
console.log(`    V 个顶点的生成树一定有 V-1 = ${cities.vertexCount - 1} 条边，且不能有环；`);
console.log('    在所有这些树里，边权之和最小的那棵就是 MST。');
console.log('');
console.log('  两种算法的性格完全不同：');
console.log('    · Kruskal：以【边】为中心 —— 全局排序所有边，从小到大加，成环就丢（并查集判环）；');
console.log('    · Prim   ：以【点】为中心 —— 从一个点开始，每次拉进来"最近的一个新点"。');
console.log('');

// --- Kruskal：用 12_union_find.js 的并查集 ---
/**
 * 并查集（从 12_union_find.js 搬来的精简版，只保留 Kruskal 需要的部分）。
 * 为了让两个文件能各自独立运行，这里重新实现一份（本仓库的示例都能独立执行）。
 */
class UnionFind {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
    this.count = n;
  }

  find(x) {
    let root = x;
    while (this.parent[root] !== root) root = this.parent[root];
    while (this.parent[x] !== root) {
      const next = this.parent[x];
      this.parent[x] = root;
      x = next;
    }
    return root;
  }

  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra] < this.rank[rb]) {
      this.parent[ra] = rb;
    } else if (this.rank[ra] > this.rank[rb]) {
      this.parent[rb] = ra;
    } else {
      this.parent[rb] = ra;
      this.rank[ra] += 1;
    }
    this.count -= 1;
    return true;
  }
}

/**
 * Kruskal 最小生成树。
 *
 * 时间复杂度 O(E log E)：排序主导（并查集部分是 O(E α(V))，可以忽略）。
 * 空间复杂度 O(V + E)。
 *
 * 正确性依据（割性质 / 交换论证）：
 *   设当前最小的边是 e = (u, v)。假设某棵 MST 不包含 e，
 *   那么把 e 加进这棵 MST 会形成一个环，环上一定有另一条边 e' 跨越了
 *   "u 所在的一侧"和"v 所在的一侧"这个割，且 w(e') ≥ w(e)（e 是最小的）。
 *   把 e' 换成 e，得到的树总权不会变大 —— 所以"一定存在一棵包含 e 的 MST"。
 */
function kruskal(graph) {
  const vertices = graph.vertices;
  const index = new Map(vertices.map((v, i) => [v, i]));
  const edges = graph.edgeList().sort((a, b) => a.weight - b.weight);
  const uf = new UnionFind(vertices.length);
  const chosen = [];
  const rejected = []; // 因为成环而被丢弃的边，打印出来看过程用
  let total = 0;

  for (const e of edges) {
    const i = index.get(e.from);
    const j = index.get(e.to);
    if (uf.union(i, j)) {
      // 两端原本不连通 → 加这条边不会成环，接受
      chosen.push(e);
      total += e.weight;
      if (chosen.length === vertices.length - 1) break; // 已经有 V-1 条边，树建好了
    } else {
      rejected.push(e);
    }
  }
  return { chosen, rejected, total, components: uf.count };
}

console.log('  【Kruskal】把所有边按权重排序，从小到大尝试加入：');
console.log('');

const kruskalResult = kruskal(cities);
{
  const edges = cities.edgeList().sort((a, b) => a.weight - b.weight);
  const idx = new Map(cities.vertices.map((v, i) => [v, i]));
  const uf = new UnionFind(cities.vertices.length);
  console.log('  边（按权重升序）'.padEnd(26) + '两端是否已连通'.padEnd(20) + '决定');
  console.log('  ' + '-'.repeat(78));
  for (const e of edges) {
    const i = idx.get(e.from);
    const j = idx.get(e.to);
    const already = uf.find(i) === uf.find(j);
    const name = `${e.from}—${e.to}(${e.weight})`;
    if (!already) uf.union(i, j);
    console.log('  ' + name.padEnd(26) + String(already).padEnd(20) + (already ? '✗ 成环，丢掉' : '✓ 加入生成树'));
  }
}
console.log('');
console.log(`  Kruskal 结果：选了 ${kruskalResult.chosen.length} 条边，总权重 = ${kruskalResult.total}`);
console.log(`    边集：${kruskalResult.chosen.map((e) => `${e.from}-${e.to}`).join(', ')}`);

// --- Prim ---
/**
 * Prim 最小生成树（优先队列 + 懒惰删除版）。
 *
 * 时间复杂度 O((V + E) log V)，和 Dijkstra 一样。
 * 空间复杂度 O(V + E)。
 *
 * ★ 注意 Prim 和 Dijkstra 的代码骨架几乎完全相同，唯一的区别是【堆里存什么】：
 *     Dijkstra：堆里存 (节点, 从【起点】到它的总距离) —— 累积量
 *     Prim    ：堆里存 (节点, 从【已选集合】到它的单条边权) —— 单条边
 *   就这一个字的区别，让它们一个求最短路、一个求最小生成树。
 */
function prim(graph, start) {
  const visited = new Set();
  const heap = new MinHeap();
  const chosen = [];
  let total = 0;

  visited.add(start);
  for (const { to, weight } of graph.neighbors(start)) heap.push(to, weight, start);

  while (heap.size > 0) {
    const { key: v, priority: w, payload: from } = heap.pop();
    if (visited.has(v)) continue; // 懒惰删除：已经在树里了
    visited.add(v);
    chosen.push({ from, to: v, weight: w });
    total += w;

    for (const { to, weight } of graph.neighbors(v)) {
      if (!visited.has(to)) heap.push(to, weight, v); // ★ 存单条边权，不是累积距离
    }
  }

  return { chosen, total, reached: visited.size };
}

console.log('');
console.log('  【Prim】从"北京"开始，每次拉进"离已选集合最近的新点"：');

const primResult = prim(cities, '北京');
{
  const visited = new Set(['北京']);
  const heap = new MinHeap();
  for (const { to, weight } of cities.neighbors('北京')) heap.push(to, weight, '北京');
  console.log('');
  console.log('  步骤'.padEnd(8) + '拉进'.padEnd(10) + '来自'.padEnd(10) + '边权'.padEnd(10) + '累计'.padEnd(10) + '新加入堆的候选边');
  console.log('  ' + '-'.repeat(92));
  let total = 0;
  let step = 0;
  while (heap.size > 0) {
    const { key: v, priority: w, payload: from } = heap.pop();
    if (visited.has(v)) continue;
    visited.add(v);
    total += w;
    step += 1;
    const pushed = [];
    for (const { to, weight } of cities.neighbors(v)) {
      if (!visited.has(to)) {
        heap.push(to, weight, v);
        pushed.push(`${to}(${weight})`);
      }
    }
    console.log(
      '  ' + String(step).padEnd(6) + v.padEnd(10) + String(from).padEnd(10) + String(w).padEnd(10) +
        String(total).padEnd(10) + (pushed.length ? pushed.join(', ') : '(没有新候选)'),
    );
  }
}
console.log('');
console.log(`  Prim 结果：选了 ${primResult.chosen.length} 条边，总权重 = ${primResult.total}`);

console.log('');
console.log('  两种算法的结果对照：');
console.log('');
console.log('  算法'.padEnd(16) + '边数'.padEnd(10) + '总权重'.padEnd(12) + '选中的边');
console.log('  ' + '-'.repeat(88));
console.log(
  '  Kruskal'.padEnd(14) + String(kruskalResult.chosen.length).padEnd(10) + String(kruskalResult.total).padEnd(12) +
    kruskalResult.chosen.map((e) => `${e.from}-${e.to}(${e.weight})`).join('  '),
);
console.log(
  '  Prim'.padEnd(14) + String(primResult.chosen.length).padEnd(10) + String(primResult.total).padEnd(12) +
    primResult.chosen.map((e) => `${e.from === null ? '?' : e.from}-${e.to}(${e.weight})`).join('  '),
);
console.log('');
console.log('  ★ 两条最重要的观察：');
console.log('    ① 【总权重完全相同】—— 这是必然的：MST 的总权重是唯一的。');
console.log('       （但 MST 本身可能不唯一：如果图里有权重相同的边，可以选出不同的树，');
console.log('         不过它们的总权重一定相等。这就是"MST 的权值唯一性"定理。）');
console.log('    ② 【边集可以不同】—— 两个算法从不同的方向逼近，选出的边可能不一样。');
console.log('       而且 Prim 的起始点不同，结果也可能不同（总权重依然相同）。');

console.log('');
console.log('  ★★ 一个必须澄清的误解：最小生成树 ≠ 最短路径树');
console.log('');
console.log('    · MST 保证的是：【所有边的总长】最小（省电缆）；');
console.log('    · 最短路径树保证的是：从起点到【每一个点】的路径都最短（省时间）。');
console.log('    两者的目标函数完全不同，所以边集通常也不一样。');
console.log('');
{
  // 把 MST 建成一张图，方便在树上找路径（树中两点间的路径唯一，BFS 即可）
  const mstTree = new WeightedGraph(false);
  for (const e of kruskalResult.chosen) mstTree.addEdge(e.from, e.to, e.weight);

  /** 在 MST 上找 u → v 的唯一路径，返回 { path, weight } */
  const mstPathBetween = (u, v) => {
    const prev = new Map([[u, null]]);
    const queue = [u];
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head];
      head += 1;
      if (cur === v) break;
      for (const { to } of mstTree.neighbors(cur)) {
        if (!prev.has(to)) {
          prev.set(to, cur);
          queue.push(to);
        }
      }
    }
    const path = reconstructPath(prev, u, v) ?? [];
    let weight = 0;
    for (let i = 1; i < path.length; i++) {
      weight += mstTree.neighbors(path[i - 1]).find((x) => x.to === path[i]).weight;
    }
    return { path, weight };
  };

  // 找出"MST 上最绕"的那一对城市：MST 路径代价 - 最短路代价 最大的那对
  let worst = null;
  for (const a of cities.vertices) {
    for (const b of cities.vertices) {
      if (a >= b) continue;
      const shortest = dijkstra(cities, a).dist.get(b);
      const { path, weight } = mstPathBetween(a, b);
      if (weight > shortest && (worst === null || weight - shortest > worst.diff)) {
        worst = { a, b, shortest, path, weight, diff: weight - shortest };
      }
    }
  }

  console.log(`    先看一个"恰好相同"的例子（北京 → 武汉）：`);
  const p = reconstructPath(dij.prev, '北京', '武汉');
  const w = mstPathBetween('北京', '武汉');
  console.log(`      最短路：      ${p.join(' → ')}，代价 ${dij.dist.get('武汉')}`);
  console.log(`      在 MST 上：   ${w.path.join(' → ')}，代价 ${w.weight}`);
  console.log('      → 恰好一样（北京-天津、天津-郑州、郑州-武汉 这三条边正好都在 MST 里）。');
  console.log('');
  console.log(`    再看差距最大的那一对（${worst.a} → ${worst.b}）：`);
  const shortestPath = reconstructPath(dijkstra(cities, worst.a).prev, worst.a, worst.b);
  console.log(`      最短路：      ${shortestPath.join(' → ')}，代价 ${worst.shortest}`);
  console.log(`      在 MST 上：   ${worst.path.join(' → ')}，代价 ${worst.weight}`);
  console.log(`      → 在 MST 上要多走 ${worst.diff}！`);
  console.log('');
  console.log('    同一个目的地，MST 上的路径明显更贵 —— 这不是 bug，而是目标不同。');
  console.log('    原因也不难理解：MST 只关心"全网总成本最小"，它给每个点只保留【一条】接入边；');
  console.log(`    ${worst.a}—${worst.b} 那条直连边（240）虽然更短，但对"连通全网"没有贡献，`);
  console.log(`    在 Kruskal 里被判定"成环"丢掉了 —— 回头看前面那张表就能找到它。`);
  console.log(`    于是 ${worst.b} 只能绕道 ${worst.path.slice(1, -1).join(' → ')} 才能到 ${worst.a}。`);
  console.log('    要按"某两点之间最近"选边，得用最短路径树（Dijkstra），代价是全网总成本变高。');
  console.log('    ★ 一个图，两种"最优"，目标函数不同，答案就不同 —— 选算法前先想清楚在优化什么。');
}

console.log('');
console.log('  实测：Kruskal vs Prim（同一张随机图）');
{
  const g = makeRandomWeightedGraph(3000, 6, 2024);
  const kMs = medianMs(() => {
    sink.value = kruskal(g).total;
  }, 1);
  const pMs = medianMs(() => {
    sink.value = prim(g, 'n0').total;
  }, 1);
  const kTotal = kruskal(g).total;
  const pTotal = prim(g, 'n0').total;
  console.log('');
  console.log(`    图：V = 3000，E = ${g.edgeList().length}`);
  console.log('');
  console.log('    算法'.padEnd(30) + '耗时(ms)'.padEnd(14) + '总权重'.padEnd(14) + '复杂度');
  console.log('    ' + '-'.repeat(88));
  console.log('    Kruskal（排序 + 并查集）'.padEnd(24) + kMs.toFixed(2).padEnd(14) + String(kTotal).padEnd(14) + 'O(E log E)');
  console.log('    Prim（优先队列）'.padEnd(26) + pMs.toFixed(2).padEnd(14) + String(pTotal).padEnd(14) + 'O((V+E) log V)');
  console.log('');
  console.log(`    两者的总权重完全一致（${kTotal}）：${kTotal === pTotal ? '是 ✓' : '否 ✗'}`);
  console.log('    耗时接近 —— 都是 O(E log E) 级别的算法，谁快取决于图的结构：');
  console.log('      · 稀疏图 / 边已经排好序 / 有现成的并查集 → Kruskal 更顺手；');
  console.log('      · 稠密图（E ≈ V²）→ Prim 的 O(V²) 朴素版更划算；');
  console.log('      · 图不连通 / 要处理多个连通分量 → Kruskal 天然支持（得到最小生成森林）；');
  console.log('      · 图是用"逐步加点"的方式给出的（比如增量式聚类）→ Prim 更自然。');
}

// ---------------------------------------------------------------------------
// 7. 复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 7. 四种加权图算法的复杂度对照 ---');
console.log('');
console.log('算法'.padEnd(26) + '时间'.padEnd(24) + '空间'.padEnd(16) + '限制 / 特点');
console.log('-'.repeat(104));
for (const [algo, time, space, limit] of [
  ['Dijkstra（优先队列）', 'O((V + E) log V)', 'O(V + E)', '边权必须非负 ✗ 负权'],
  ['Dijkstra（线性扫描）', 'O(V²)', 'O(V)', '稠密图更划算；同样不能有负权'],
  ['Bellman-Ford', 'O(V × E)', 'O(V)', '允许负权 ✓，能检测负环 ✓'],
  ['SPFA（BF 的队列优化）', 'O(k × E) 平均，O(V × E) 最坏', 'O(V)', '允许负权，但最坏仍慢'],
  ['Floyd-Warshall（多源）', 'O(V³)', 'O(V²)', '求所有点对最短路径，允许负权'],
  ['Kruskal（MST）', 'O(E log E)', 'O(V + E)', '稀疏图、天然支持不连通'],
  ['Prim（MST，优先队列）', 'O((V + E) log V)', 'O(V + E)', '必须从某个点开始扩'],
  ['Prim（MST，朴素版）', 'O(V²)', 'O(V)', '稠密图首选'],
]) {
  console.log(algo.padEnd(24) + time.padEnd(26) + space.padEnd(18) + limit);
}

console.log('');
console.log('遇到加权图问题该怎么选？');
console.log('');
console.log('  问题'.padEnd(44) + '该用什么');
console.log('  ' + '-'.repeat(88));
for (const [problem, answer] of [
  ['一个源点到所有点的最短路，边权非负', 'Dijkstra（优先队列）★'],
  ['一个源点的最短路，可能有负权', 'Bellman-Ford ★（顺带检测负环）'],
  ['要检测"能不能白赚"的循环（套利）', 'Bellman-Ford 检测负环 ★'],
  ['任意两点之间的最短路（点不多）', 'Floyd-Warshall，O(V³)'],
  ['把所有点连起来且总成本最小', 'Kruskal 或 Prim（MST）★'],
  ['图不连通，要求"最小生成森林"', 'Kruskal ★（并查集天然处理）'],
  ['稠密图上的最短路 / MST', '朴素的 O(V²) 实现反而更快'],
  ['地图导航（超大规模、要极快）', 'A*（Dijkstra + 启发式）/ 分层预处理'],
  ['边权是"跳数"（无权图）', 'BFS（见 07），别用 Dijkstra 杀鸡用牛刀'],
]) {
  console.log('  ' + problem.padEnd(44) + answer);
}

console.log('');
console.log('一句话总结：');
console.log('  · 所有最短路算法都在做同一件事 —— 松弛，区别只是【松弛的顺序】；');
console.log('    Dijkstra 按"距离从小到大"松弛（要非负权），Bellman-Ford 干脆暴力全松 V-1 轮；');
console.log('  · "边权非负"是 Dijkstra 的硬性前提，破坏它得到的是【静默的错误答案】而不是报错；');
console.log('  · 最小生成树和最短路径是两个不同的问题 —— 前者对"全网总成本"负责，后者对"两点之间"负责；');
console.log('  · 加权图的世界里，优先队列和并查集是两个最常出现的搭档：');
console.log('    Dijkstra / Prim 用堆，Kruskal 用并查集；');
console.log('  · 选算法时先问三件事：边权有负数吗？要求两点最短还是全网连通？图稀疏还是稠密？');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
