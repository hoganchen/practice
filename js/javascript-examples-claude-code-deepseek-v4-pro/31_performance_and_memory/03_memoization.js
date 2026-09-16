/**
 * ============================================================================
 * 知识点：记忆化 memoization —— 闭包缓存、键策略、TTL 失效与 LRU 淘汰
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】进阶
 * 【前置知识】31_performance_and_memory/01_debounce.js
 *
 * 【也见】07_scope_and_closure/09_closure_memoization.js —— 记忆化在「作用域与闭包」章节里另有一篇完整讲解。
 *        那篇是「闭包主线」的主场，侧重用私有缓存解释闭包；本文件是「性能优化主线」的主场，
 *        侧重键策略、TTL 失效与 LRU 淘汰。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    记忆化（memoization）是一种用"空间换时间"的优化手段：把函数的输入当作
 *    key、输出当作 value 存进缓存，下次用同样的输入调用时直接返回缓存结果，
 *    不再重新计算。
 *    一句话：记忆化 = "算过一遍的结果记在小本本上，下次直接查表"。
 *    它成立的数学前提是"纯函数"：相同输入必然得到相同输出，且函数没有副作用。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 递归重复子问题：斐波那契朴素递归 fib(30) 要算 160 多万次，
 *      记忆化后只需算 30 次，提速成千上万倍。
 *    - 昂贵计算：正则解析、大数组排序分组、单位换算表、日期间隔计算。
 *    - React/Vue 里的派生数据：useMemo/vue computed 本质就是记忆化。
 *    - 接口结果缓存：同一个请求参数短时间内重复请求，直接返回缓存。
 *    - 配置解析：同一个配置文件被多处读取时只解析一次。
 *
 * 3. 核心语法要点
 *    - 最小实现：闭包里的 Map 当缓存 + 拦截调用。
 *    - Map 比对象好：key 可以是任意类型（对象、函数、NaN 都能当 key），
 *      而普通对象的 key 会被强制转成字符串（对象 key 全变成 "[object Object]"）。
 *    - 键策略：默认用第一个参数当 key 最简单；多参数时要么用 JSON.stringify，
 *      要么提供一个 resolver 自己拼 key（推荐，可控且快）。
 *    - 失效策略：TTL（过期时间）、手动 clear()、容量上限（LRU/LFU）。
 *
 * 4. 常见陷阱
 *    - 陷阱一：JSON.stringify 作为 key 的致命问题——
 *      · 键顺序敏感：{a:1,b:2} 与 {b:2,a:1} 语义相同却得到不同的 key，缓存命中率暴跌；
 *      · 循环引用直接抛 TypeError；
 *      · 非可序列化值被静默丢弃：函数、undefined、Symbol 会消失，
 *        NaN 和 Infinity 会变成 null，Date 会变成字符串——
 *        于是 {n: NaN} 和 {n: null} 撞成同一个 key，产生【错误的缓存命中】，
 *        返回完全不相干的结果。这类 bug 极难排查。
 *      · 序列化本身很慢，可能比原函数计算还贵（大对象尤其明显）。
 *    - 陷阱二：缓存无上限 = 内存泄漏。key 空间无限（比如按用户输入做 key）时，
 *      Map 会一直变大。必须设置容量上限（LRU）或 TTL。
 *    - 陷阱三：给非纯函数做记忆化。函数带副作用（写数据库、发请求、读随机数、
 *      依赖 Date.now()）时，缓存会返回过期或错误的结果。
 *    - 陷阱四：this 丢失。记忆化包装器如果写成箭头函数，方法调用时 this 会变。
 *    - 陷阱五：缓存了 undefined 却判断不出来。用 cache.has(key) 判断是否存在，
 *      不要用 cache.get(key) !== undefined。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/03_memoization.js
 *
 * 【预期输出】
 *   打印 6 个小节：基础 Map 缓存实现、斐波那契加速实测、JSON.stringify 键策略
 *   的四个坑、自定义 resolver 写法、缓存失效（TTL 与手动清除）、
 *   以及基于 Map 插入顺序的 O(1) LRU 变体。
 * ============================================================================
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 1. 最小可用实现：闭包 + Map
// ---------------------------------------------------------------------------

console.log('--- 1. 闭包 + Map 实现的记忆化 ---');

/**
 * 记忆化包装器（基础版：只按"第一个参数"做 key）
 *
 * @param {Function} fn 需要被缓存的纯函数
 * @returns {Function} 带 cache 属性的包装函数
 */
function memoize(fn) {
  // cache 定义在外层函数里，被内层函数引用 → 闭包。
  // 每次调用 memoized 时读写的都是同一个 Map。
  const cache = new Map();

  function memoized(...args) {
    // 基础版只用第一个参数做 key。对单参数函数来说这已经足够。
    const key = args[0];

    // 注意用 has 而不是 get(...) !== undefined：
    // 因为函数本身可能合法地返回 undefined，用 get 判断会误判成"没缓存"。
    if (cache.has(key)) {
      cache.hits += 1; // 自定义字段，仅用于统计
      return cache.get(key);
    }

    // 没命中 → 真正计算一次，然后写进缓存
    const value = fn.apply(this, args);
    cache.set(key, value);
    return value;
  }

  // 把 cache 暴露出去，方便调试、统计和手动清理
  cache.hits = 0;
  memoized.cache = cache;
  memoized.clear = () => cache.clear();

  return memoized;
}

// 一个能统计"被真实调用了几次"的昂贵函数
let computeCount = 0;

function slowSquare(n) {
  computeCount += 1;
  // 模拟一段耗时计算（这里是空转，避免示例变慢）
  let acc = 0;
  for (let i = 0; i < 1000; i++) acc += i % 7;
  return n * n + (acc % 1);
}

const fastSquare = memoize(slowSquare);

console.log('第一次调用 slowSquare 的包装版，参数 12 →', fastSquare(12));
console.log('第二次用同样的参数 12 再调用 →', fastSquare(12));
console.log('换一个参数 15 调用 →', fastSquare(15));
console.log('再用 12 调用第三次 →', fastSquare(12));
console.log(`真实计算次数 = ${computeCount}（3 次调用参数去重后只有 2 个不同参数）`);
console.log(`缓存命中次数 = ${fastSquare.cache.hits}（统计字段，仅供观察）`);
console.log('缓存里现在的 key =', JSON.stringify([...fastSquare.cache.keys()]));

// ---------------------------------------------------------------------------
// 2. 实战效果：斐波那契加速实测
// ---------------------------------------------------------------------------

console.log('\n--- 2. 斐波那契：朴素递归 vs 记忆化 ---');

let naiveCalls = 0;
function fibNaive(n) {
  naiveCalls += 1; // 统计递归调用次数
  if (n < 2) return n;
  // 朴素递归的致命伤：fib(n-2) 会被 fib(n-1) 的分支重复计算无数次
  return fibNaive(n - 1) + fibNaive(n - 2);
}

let memoCalls = 0;
const fibMemo = memoize(function fibInner(n) {
  memoCalls += 1;
  if (n < 2) return n;
  // 关键差异：递归调用的是"记忆化后的自己"，所以每个 n 只会被真正算一次
  return fibMemo(n - 1) + fibMemo(n - 2);
});

const N = 30; // 规模控制在 30：朴素递归约 160 万次调用，几十毫秒内能跑完

let t0 = performance.now();
const naiveResult = fibNaive(N);
let t1 = performance.now();
const naiveMs = t1 - t0;

t0 = performance.now();
const memoResult = fibMemo(N);
t1 = performance.now();
const memoMs = t1 - t0;

console.log('对比表（数值因机器而异，关注数量级差异即可）：');
console.log('实现'.padEnd(16) + '结果'.padEnd(12) + '递归调用次数'.padEnd(16) + '耗时(ms)');
console.log('-'.repeat(64));
console.log('朴素递归'.padEnd(14) + String(naiveResult).padEnd(12) + String(naiveCalls).padEnd(18) + naiveMs.toFixed(3));
console.log('记忆化'.padEnd(16) + String(memoResult).padEnd(12) + String(memoCalls).padEnd(18) + memoMs.toFixed(3));
console.log('');
console.log(`两者结果一致： ${naiveResult === memoResult}`);
console.log(`调用次数从 ${naiveCalls} 降到 ${memoCalls}，这是复杂度从 O(2^n) 降到 O(n) 的直接体现。`);
console.log('再次调用 fibMemo(30)（这次完全命中缓存）：');
t0 = performance.now();
fibMemo(30);
console.log(`  耗时 ${(performance.now() - t0).toFixed(3)} ms，递归调用次数仍为 ${memoCalls}（没有再增长）`);

// ---------------------------------------------------------------------------
// 3. 陷阱：用 JSON.stringify 当缓存键的四个坑
// ---------------------------------------------------------------------------

console.log('\n--- 3. JSON.stringify 当缓存键的坑 ---');

// 坑 1：键顺序敏感 —— 语义相同的对象得到不同的 key
const objA = { a: 1, b: 2 };
const objB = { b: 2, a: 1 }; // 和 objA 内容等价，只是书写顺序不同
console.log('坑 1 · 键顺序敏感：');
console.log('  JSON.stringify({a:1,b:2}) =', JSON.stringify(objA));
console.log('  JSON.stringify({b:2,a:1}) =', JSON.stringify(objB));
console.log(`  两者字符串相等吗？ ${JSON.stringify(objA) === JSON.stringify(objB)}`);
console.log('  → 逻辑上同一个参数却产生两个 key，缓存命中率下降、内存翻倍。');
console.log('  → 正确做法：先规范化参数（按固定顺序取字段），或用 resolver 自定义键。');

// 坑 2：循环引用直接抛错
console.log('\n坑 2 · 循环引用抛错：');
const circular = { name: 'node' };
circular.self = circular; // 自己引用自己
try {
  JSON.stringify(circular);
  console.log('  这一行不会执行');
} catch (err) {
  console.log(`  捕获到 ${err.constructor.name}：${err.message}`);
  console.log('  → 记忆化函数如果接收可能循环的对象，会在生成 key 时就崩掉，');
  console.log('    而且是在"缓存查询"阶段崩，堆栈里看不到业务代码，极难定位。');
}

// 坑 3：非可序列化的值被静默丢弃 / 改变
console.log('\n坑 3 · 非可序列化值被静默改写：');
console.log('  函数被丢掉     ：', JSON.stringify({ fn: () => 1, x: 1 }));
console.log('  undefined 被丢掉：', JSON.stringify({ x: undefined, y: 2 }));
console.log('  NaN 变成 null  ：', JSON.stringify({ n: NaN }));
console.log('  Infinity 变 null：', JSON.stringify({ n: Infinity }));
console.log('  Map 变成空对象 ：', JSON.stringify({ m: new Map([['k', 1]]) }));
console.log('  Symbol 被丢掉  ：', JSON.stringify({ s: Symbol('s'), y: 1 }));

// 坑 4（最危险）：不同参数撞成同一个 key，返回错误结果
console.log('\n坑 4 · 错误的缓存命中（最危险）：');
const keyNaN = JSON.stringify({ n: NaN });
const keyNull = JSON.stringify({ n: null });
console.log(`  JSON.stringify({n: NaN})  = ${keyNaN}`);
console.log(`  JSON.stringify({n: null}) = ${keyNull}`);
console.log(`  两个语义完全不同的参数，key 竟然相同？ ${keyNaN === keyNull}`);
console.log('  → 这会让记忆化返回"另一个参数算出来的结果"，属于静默的逻辑错误，');
console.log('    测试里不写边界用例根本发现不了。');

// ---------------------------------------------------------------------------
// 4. 推荐做法：自定义 resolver 生成缓存键
// ---------------------------------------------------------------------------

console.log('\n--- 4. 推荐做法：自定义 resolver ---');

/**
 * 支持自定义键生成器的记忆化
 * @param {Function} fn       目标纯函数
 * @param {Function} [resolver] 参数 → 字符串 key 的映射函数
 */
function memoizeWith(fn, resolver) {
  const cache = new Map();

  function memoized(...args) {
    // 默认策略：只认第一个参数（对单参数函数最省事也最快）
    const key = resolver ? resolver.apply(this, args) : args[0];
    if (cache.has(key)) return cache.get(key);
    const value = fn.apply(this, args);
    cache.set(key, value);
    return value;
  }

  memoized.cache = cache;
  return memoized;
}

let pairComputeCount = 0;
function addPair(a, b) {
  pairComputeCount += 1;
  return a + b;
}

// resolver 用最简单的 "a|b" 拼接：快、无歧义、可读
const fastAdd = memoizeWith(addPair, (a, b) => `${a}|${b}`);

console.log('fastAdd(1, 2) =', fastAdd(1, 2));
console.log('fastAdd(1, 2) 再来一次 =', fastAdd(1, 2));
console.log('fastAdd(2, 1) =', fastAdd(2, 1), '（参数顺序不同，是不同的 key）');
console.log('fastAdd(1, 3) =', fastAdd(1, 3));
console.log(`真实计算次数 = ${pairComputeCount}，缓存 size = ${fastAdd.cache.size}`);
console.log('对比：如果 resolver 里写 JSON.stringify([a,b])，也能工作，但多了一层序列化开销。');

// 对象参数的正确处理：把参与计算的字段按固定顺序拼成 key
const fastQuery = memoizeWith(
  (options) => {
    // 假装这里是一次昂贵的查询
    return `查询结果(limit=${options.limit}, sort=${options.sort})`;
  },
  (options) => `${options.limit}#${options.sort}`, // 只取用到的字段，顺序由我决定
);

console.log(fastQuery({ limit: 10, sort: 'name' }));
console.log(fastQuery({ sort: 'name', limit: 10 }), '← 字段顺序不同但命中同一个缓存');
console.log(`缓存 size = ${fastQuery.cache.size}（只有 1 条，说明规范化生效了）`);

// ---------------------------------------------------------------------------
// 5. 缓存失效：TTL 与手动清除
// ---------------------------------------------------------------------------

console.log('\n--- 5. 缓存失效：TTL 与手动清除 ---');

/**
 * 带过期时间（TTL）的记忆化
 * @param {Function} fn
 * @param {number}   ttl 缓存有效期（毫秒）
 */
function memoizeWithTTL(fn, ttl) {
  // 每条缓存记录 { value, expireAt }，读取时检查是否过期
  const cache = new Map();

  function memoized(...args) {
    const key = args[0];
    const entry = cache.get(key);

    if (entry !== undefined) {
      if (Date.now() < entry.expireAt) {
        return entry.value; // 未过期 → 命中
      }
      // 已过期 → 删掉这条记录（惰性删除：读的时候才清理）
      cache.delete(key);
    }

    const value = fn.apply(this, args);
    cache.set(key, { value, expireAt: Date.now() + ttl });
    return value;
  }

  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  return memoized;
}

let nowCount = 0;
const nowMemo = memoizeWithTTL(() => {
  nowCount += 1;
  return `第 ${nowCount} 次生成的时间戳快照`;
}, 40); // 有效期 40ms

console.log('第一次读取：', nowMemo('key'));
console.log('立刻再读一次（命中缓存）：', nowMemo('key'));
console.log(`真实计算次数 = ${nowCount}（只算了 1 次）`);

await sleep(60); // 等超过 TTL

console.log('等待 60ms（已超过 40ms 的 TTL）后再读：', nowMemo('key'));
console.log(`真实计算次数 = ${nowCount}（过期后重新计算了）`);
console.log('TTL 适合：接口数据、配置快照、时间敏感的计算结果。');

// 手动清除：数据源变了（比如用户切换了租户），必须主动清空
console.log('\n手动清除演示：');
console.log(`清除前缓存 size = ${nowMemo.cache.size}`);
nowMemo.clear();
console.log(`clear() 之后缓存 size = ${nowMemo.cache.size}`);
console.log('真实场景：用户登出、权限变更、socket 推送数据更新时，必须手动清缓存。');

// ---------------------------------------------------------------------------
// 6. LRU 变体：用 Map 的插入顺序实现 O(1) 淘汰
// ---------------------------------------------------------------------------

console.log('\n--- 6. LRU 缓存（容量上限 + 淘汰最久未使用） ---');

/**
 * LRU（Least Recently Used）缓存
 *
 * 核心技巧：Map 会严格保持【插入顺序】，keys() 的第一个就是"最久没被碰过"的。
 * · get 时：先 delete 再 set，把这条记录挪到队尾 → 变成"最近使用"
 * · set 超额时：删掉 keys().next().value（队首 = 最久未使用）
 * 两个操作都是 O(1)，不需要手写双向链表。
 */
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    // 先删后插 = 移动到队尾（最近使用）
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.map.has(key)) {
      // 已存在：先删掉旧位置，稍后统一插到队尾
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // 容量已满且是新 key → 淘汰队首（最久未使用）
      const oldestKey = this.map.keys().next().value;
      this.map.delete(oldestKey);
      console.log(`    容量已满，淘汰最久未使用的 key：${oldestKey}`);
    }
    this.map.set(key, value);
  }

  // 用 Map 的迭代顺序可以直接看出"从最久未使用到最近使用"的排列
  keys() {
    return [...this.map.keys()];
  }
}

const lru = new LRUCache(3);
console.log('容量 = 3，依次写入 A、B、C：');
lru.set('A', 1);
lru.set('B', 2);
lru.set('C', 3);
console.log('  当前顺序（左=最久未使用）：', lru.keys());

console.log('访问一次 A（A 变成最近使用）：');
lru.get('A');
console.log('  当前顺序：', lru.keys());

console.log('写入 D（容量满，应该淘汰 B）：');
lru.set('D', 4);
console.log('  当前顺序：', lru.keys());

console.log('查询 B 是否还在：', lru.get('B'), '← undefined 说明已被淘汰');
console.log('查询 A 是否还在：', lru.get('A'), '← 1，因为刚刚被访问过所以留下来了');

console.log('\n把 LRU 和记忆化结合：给 memoize 加一个容量上限，');
console.log('key 空间无限时（例如按用户 ID 缓存）就不会把内存撑爆。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
