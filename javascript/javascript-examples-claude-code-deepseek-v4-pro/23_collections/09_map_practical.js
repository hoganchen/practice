/**
 * ============================================================================
 * 知识点：Map 实战 —— 缓存、邻接表、频次统计、LRU 思路
 * ============================================================================
 *
 * 【所属分类】23_collections —— 集合类型
 * 【难度等级】高级
 * 【前置知识】23_collections/01_map_basics.js、02_map_iteration.js、07_map_vs_object.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本示例把 Map 的三种"天然优势"落地成四个真实场景：
 *      - 任意类型可作键   -> 用对象本身当缓存键（记忆化）
 *      - 插入顺序稳定     -> LRU 的"淘汰最久未使用"就靠这个顺序
 *      - 平均 O(1) 增删查 -> 频次统计、邻接表
 *
 * 2. 为什么需要
 *    这些是面试与工程中都高频出现的结构。手写一遍比背结论更有效，
 *    而且能顺带理解"为什么 Map 比 Object 更适合做缓存"。
 *
 * 3. 核心语法要点
 *    (1) 记忆化（memoization）：把"参数 -> 结果"存进 Map。
 *        用对象作键时，Map 的引用相等语义恰好就是"同一个输入"的判定。
 *    (2) 图结构邻接表：Map<节点, 邻居数组>。相比 Object，
 *        它允许节点是任意类型（对象、数字），且没有原型键干扰。
 *    (3) 频次统计：Map<元素, 次数>。get 返回 undefined 时用 ?? 兜底。
 *    (4) LRU（Least Recently Used）缓存：
 *        Map 的"插入顺序"可被 delete + set 主动调整——
 *        "被访问过的键先 delete 再 set"，它就会排到末尾，于是
 *        队首（keys().next().value）就是"最久未使用"的那个。
 *        这是用 Map 实现 LRU 的核心技巧。
 *    (5) Map 的迭代顺序 = 插入顺序，这一点在 LRU 里被当作"使用时间轴"来用。
 *
 * 4. 常见陷阱
 *    (1) 记忆化时用 JSON.stringify(参数) 当键：既慢，又无法处理循环引用、
 *        且会丢失类型信息（1 与 "1" 撞车）。能用对象引用就用引用。
 *    (2) 缓存无限增长 -> 内存泄漏，必须有容量上限（LRU）或 TTL。
 *    (3) 缓存"会变化的状态"（如依赖外部变量的计算结果）会得到过期数据。
 *    (4) LRU 里忘记"读也算使用"：只在写时调整顺序就退化成 FIFO。
 *    (5) 频次统计时用 set/get 手工累加，忘了 ?? 兜底会得到 NaN。
 *    (6) 邻接表用有向图的方式建无向图（忘记双向添加边）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 23_collections/09_map_practical.js
 *
 * 【预期输出】
 *   分 5 个小节，依次演示记忆化缓存、图邻接表（BFS/DFS/拓扑排序）、
 *   频次统计（Top-K）、可观测的 LRU 缓存。输出全部固定。
 * ============================================================================
 */

console.log('--- 1. 实战一：记忆化缓存（memoization） ---');

// 场景：递归求斐波那契，朴素实现是指数复杂度，加缓存后是线性。
// 这里同时统计"真实计算次数"，用确定性的计数代替运行时间。
let fibComputeCount = 0;
let fibCacheHitCount = 0;
const fibCache = new Map();

/**
 * 带缓存的斐波那契。
 * @param {number} n 非负整数
 * @returns {number} 第 n 项
 */
function fib(n) {
  if (n <= 1) return n;
  if (fibCache.has(n)) {
    fibCacheHitCount++;
    return fibCache.get(n);
  }
  fibComputeCount++;
  const result = fib(n - 1) + fib(n - 2);
  fibCache.set(n, result);
  return result;
}
const fibResults = [];
for (let i = 0; i <= 10; i++) fibResults.push(fib(i));
console.log('fib(0..10) =', fibResults.join(', '));
console.log('真实计算次数 =', fibComputeCount, '（若不缓存，n=10 需要上百次递归调用）');
console.log('缓存命中次数 =', fibCacheHitCount);
console.log('缓存条数     =', fibCache.size);

// 更强的一类：用**对象参数**当缓存键。
const heavyCache = new Map();
let heavyCalls = 0;
/**
 * 模拟"昂贵计算"：把点对象转成描述字符串。结果缓存在 Map 里。
 * @param {{x: number, y: number}} point 坐标对象
 * @returns {string} 描述
 */
function describePoint(point) {
  if (heavyCache.has(point)) return heavyCache.get(point) + '（缓存命中）';
  heavyCalls++;
  const text = `(${point.x}, ${point.y}) 到原点距离的平方 = ${point.x ** 2 + point.y ** 2}`;
  heavyCache.set(point, text);
  return text;
}
const p1 = { x: 3, y: 4 };
console.log('\n用对象本身当缓存键：');
console.log('  第一次：', describePoint(p1));
console.log('  第二次：', describePoint(p1), '（同一个对象引用，命中缓存）');
console.log('  换一个内容相同的对象：', describePoint({ x: 3, y: 4 }), '（不同引用，未命中）');
console.log('  真实计算次数 =', heavyCalls);
console.log('⚠️ 用对象引用当键很快，但"内容相同"的对象会被视为不同输入。');
console.log('   若希望按内容命中，可先归一化成字符串（要接受 JSON.stringify 的开销）。');

console.log('\n--- 2. 实战二：图的邻接表 ---');

// 用 Map<节点名, 邻居数组> 表示无向图。
// 为什么不用 Object？因为节点可能是数字或对象，且容易与原型键冲突。
const graph = new Map([
  ['A', ['B', 'C']],
  ['B', ['A', 'D', 'E']],
  ['C', ['A', 'F']],
  ['D', ['B']],
  ['E', ['B', 'F']],
  ['F', ['C', 'E']],
]);

/**
 * 添加无向边（双向添加，避免只加一边的常见错误）。
 * @param {string} u 顶点 u
 * @param {string} v 顶点 v
 */
function addEdge(u, v) {
  if (!graph.has(u)) graph.set(u, []);
  if (!graph.has(v)) graph.set(v, []);
  graph.get(u).push(v);
  graph.get(v).push(u);
}
console.log('初始图：');
for (const [node, neighbors] of graph) {
  console.log(`  ${node} -> ${neighbors.join(', ')}`);
}
console.log('顶点数 =', graph.size);
// 用一条"新增边"验证 addEdge 的双向性。
addEdge('D', 'F');
console.log("addEdge('D','F') 后：D 的邻居 =", graph.get('D').join(', '), '，F 的邻居 =', graph.get('F').join(', '));

/**
 * 广度优先搜索，返回从 start 到各顶点的距离。
 * @param {Map} g 邻接表
 * @param {string} start 起点
 * @returns {Map<string, number>} 顶点 -> 距离
 */
function bfsDistances(g, start) {
  const dist = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length > 0) {
    const cur = queue.shift();
    for (const next of g.get(cur) ?? []) {
      if (!dist.has(next)) { // Map 的 has 是 O(1)，比数组 includes 快
        dist.set(next, dist.get(cur) + 1);
        queue.push(next);
      }
    }
  }
  return dist;
}
console.log('\n从 A 出发的最短距离：');
for (const [node, d] of bfsDistances(graph, 'A')) {
  console.log(`  A -> ${node} : ${d} 步`);
}

/**
 * 深度优先搜索，返回遍历顺序（用显式栈，避免递归深度限制）。
 * @param {Map} g 邻接表
 * @param {string} start 起点
 * @returns {string[]} 访问顺序
 */
function dfsOrder(g, start) {
  const visited = new Set();
  const stack = [start];
  const order = [];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (visited.has(cur)) continue;
    visited.add(cur);
    order.push(cur);
    // 逆序入栈，让输出顺序与邻居书写顺序一致（纯为可读性）。
    for (const next of [...(g.get(cur) ?? [])].reverse()) {
      if (!visited.has(next)) stack.push(next);
    }
  }
  return order;
}
console.log('从 A 出发的 DFS 顺序 =', dfsOrder(graph, 'A').join(' -> '));

console.log('\n--- 3. 实战三：频次统计与 Top-K ---');

const text = 'the quick brown fox jumps over the lazy dog the fox';
const words = text.split(' ');
const freq = new Map();
for (const w of words) {
  // ?? 0 兜底，避免 undefined + 1 得到 NaN。
  freq.set(w, (freq.get(w) ?? 0) + 1);
}
console.log('总词数 =', words.length, '，不同词数 =', freq.size);
console.log('全部词频（按首次出现顺序）：');
for (const [w, c] of freq) console.log(`  ${w.padEnd(6)} ${'#'.repeat(c)} (${c})`);

// Top-K：先转数组按次数排序，再取前 K 个。
const topK = (map, k) => [...map].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, k);
console.log('\n出现最多的 3 个词：');
for (const [w, c] of topK(freq, 3)) console.log(`  ${w} : ${c} 次`);
console.log('（注释：排序时用 a[0].localeCompare 作为并列时的稳定次序，保证输出可复现）');

// 用 Map 做"分组"（多值 Map）：值本身是数组。
const people = [
  { name: '张三', dept: '研发' },
  { name: '李四', dept: '市场' },
  { name: '王五', dept: '研发' },
  { name: '赵六', dept: '市场' },
  { name: '孙七', dept: '研发' },
];
const byDept = new Map();
for (const person of people) {
  // 有则取、无则建的惯用法
  if (!byDept.has(person.dept)) byDept.set(person.dept, []);
  byDept.get(person.dept).push(person.name);
}
console.log('\n按部门分组：');
for (const [dept, names] of byDept) {
  console.log(`  ${dept}（${names.length} 人）: ${names.join('、')}`);
}

console.log('\n--- 4. 实战四：LRU 缓存的核心思路 ---');

/**
 * 基于 Map 的 LRU 缓存。
 * 关键技巧：Map 保持插入顺序，"被访问的键"先 delete 再 set 就会排到末尾；
 * 于是 keys() 的第一个元素永远是"最久未使用"的那个，超容量时删它即可。
 */
class LRUCache {
  /**
   * @param {number} capacity 最大容量，必须为正整数
   */
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new RangeError('capacity 必须是正整数');
    }
    /** @type {number} 容量上限 */
    this.capacity = capacity;
    /** @type {Map<*, *>} 底层存储，键的顺序即"最近使用时间"从旧到新 */
    this.store = new Map();
    /** @type {number} 命中次数，仅用于演示 */
    this.hits = 0;
    /** @type {number} 未命中次数，仅用于演示 */
    this.misses = 0;
    /** @type {string[]} 淘汰日志，仅用于演示 */
    this.evicted = [];
  }

  /**
   * 读取。命中时把该键移到"最新"位置。
   * @param {*} key 键
   * @returns {*} 值，不存在返回 undefined
   */
  get(key) {
    if (!this.store.has(key)) {
      this.misses++;
      return undefined;
    }
    this.hits++;
    const value = this.store.get(key);
    // 读也算"使用"：先删再插，让它排到末尾。
    this.store.delete(key);
    this.store.set(key, value);
    return value;
  }

  /**
   * 写入。超容量时淘汰最久未使用的键。
   * @param {*} key 键
   * @param {*} value 值
   */
  set(key, value) {
    // 已存在时先删掉，保证重新插入后位于末尾。
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, value);
    if (this.store.size > this.capacity) {
      // keys() 的第一个就是最久未使用的键。
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
      this.evicted.push(oldest);
    }
  }

  /** 按"最久未使用 -> 最近使用"的顺序返回当前键列表。 @returns {Array} */
  keysOldestFirst() {
    return [...this.store.keys()];
  }
}

const cache = new LRUCache(3);
console.log('LRU 容量 = 3');
console.log("set('a',1) set('b',2) set('c',3) 之后：", (cache.set('a', 1), cache.set('b', 2), cache.set('c', 3), cache.keysOldestFirst().join(' , ')));
console.log("get('a') ->", cache.get('a'), '，之后顺序变为：', cache.keysOldestFirst().join(' , '), '（a 被移到最近使用）');
console.log("set('d',4) 触发淘汰，被淘汰的是：", (cache.set('d', 4), cache.evicted.join(', ')), '（b 是最久未使用的）');
console.log('当前顺序：', cache.keysOldestFirst().join(' , '));
console.log("get('b') ->", cache.get('b'), '（已被淘汰，返回 undefined）');
console.log('统计：命中', cache.hits, '次，未命中', cache.misses, '次');

// 对照：如果只在 set 时调整顺序、get 时不调整，就退化成了 FIFO。
console.log('\n⚠️ 常见错误：get 时忘记把键移到末尾 —— 那样淘汰顺序就变成了"先进先出"，');
console.log('   而不是"最久未使用"，缓存命中率会明显下降。');

console.log('\n--- 5. 实战五：对象键缓存 + 生命周期注意事项 ---');
console.log('Map 的键是**强引用**：只要缓存活着，键对象就永远不会被回收。');
console.log('因此"以对象为键的缓存"必须有下面之一的策略：');
console.log('  1) 容量上限（LRU）：上面实现的方案；');
console.log('  2) TTL：给每条记录加时间戳，读取时判断是否过期；');
console.log('  3) 用 WeakMap：让缓存随对象一起被回收（见 05_weakmap.js），但代价是不可枚举、无法淘汰。');
console.log('❌ 最危险的做法：`const cache = new Map()` 然后在请求处理里不断 set，永不清理。');

// 演示一个带 TTL 的极简缓存（时间用固定值模拟，输出可复现）。
/**
 * 极简 TTL 缓存。
 * @param {number} ttlMs 存活毫秒数
 */
function createTtlCache(ttlMs) {
  const store = new Map(); // key -> { value, expireAt }
  return {
    /**
     * @param {string} key 键
     * @param {*} value 值
     * @param {number} now 当前时刻（毫秒），显式传入便于测试
     */
    set(key, value, now) { store.set(key, { value, expireAt: now + ttlMs }); },
    /**
     * @param {string} key 键
     * @param {number} now 当前时刻（毫秒）
     * @returns {*} 未过期则返回值，否则 undefined
     */
    get(key, now) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (now >= entry.expireAt) { store.delete(key); return undefined; }
      return entry.value;
    },
    /** @returns {number} 当前条数 */
    get size() { return store.size; },
  };
}
const ttlCache = createTtlCache(1000);
const T0 = 1700000000000; // 固定的"当前时刻"，保证输出可复现
ttlCache.set('token', 'abc123', T0);
console.log('\nTTL 缓存演示（ttl = 1000ms，起点为固定值）：');
console.log('  立即读取（T0+500）  :', ttlCache.get('token', T0 + 500));
console.log('  过期后读取（T0+1000）:', ttlCache.get('token', T0 + 1000), '（已过期并被清除）');
console.log('  当前条数 =', ttlCache.size);

console.log('\n--- 6. 四个场景的共性总结 ---');
const summary = [
  ['记忆化缓存', '键是对象引用时用 Map，天然表达"同一个输入"', '要配容量上限或 TTL'],
  ['图邻接表', 'Map<节点, 邻居[]>，节点可以是任意类型', '建无向图别忘了双向加边'],
  ['频次统计', '(freq.get(k) ?? 0) + 1 是标准写法', 'Top-K 要转数组排序'],
  ['LRU 缓存', 'delete + set 把键"提到末尾"是核心技巧', 'get 也必须调整顺序'],
];
console.log('  ' + '场景'.padEnd(14) + 'Map 的用法'.padEnd(40) + '注意事项');
console.log('  ' + '-'.repeat(84));
for (const [scene, usage, note] of summary) {
  console.log('  ' + scene.padEnd(12) + usage.padEnd(38) + note);
}
console.log('\n本节结束。');
