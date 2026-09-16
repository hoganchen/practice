/**
 * ============================================================================
 * 知识点：用闭包实现记忆化（memoize）
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】高级
 * 【前置知识】07_scope_and_closure/07_closure_private_state.js
 *
 * 【也见】31_performance_and_memory/03_memoization.js —— 记忆化在「性能与内存」章节里另有一篇完整讲解。
 *        本文件是「闭包主线」的主场，侧重"私有缓存正是闭包的用武之地"；
 *        那篇是「性能优化主线」的主场，侧重键策略、TTL 失效与 LRU 淘汰。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    记忆化（memoization）是"用缓存换时间"的优化手法：
 *    把函数的输入当 key、输出当 value 存起来，下次遇到同样的输入就直接返回缓存，
 *    不再重新计算。
 *      const memoized = memoize(fn);   // fn 必须尽量是纯函数
 *    在这里，缓存对象必须是"私有的"——它不属于任何外部变量，只被返回的函数访问，
 *    这正是闭包最典型的用武之地。
 *
 * 2. 为什么需要
 *    (1) 性能：斐波那契、大量重复的格式化、解析、正则匹配等场景能带来数量级的提升；
 *    (2) 去重：同样的请求参数只发一次请求（请求去重 / 结果缓存）；
 *    (3) 结构清晰：把缓存逻辑从业务函数里剥离，业务函数只关心"怎么算"。
 *    前提条件：函数最好是纯函数（相同输入必定相同输出），否则缓存会返回过时结果。
 *
 * 3. 核心语法要点
 *    (1) 基本结构：外层函数创建私有缓存（Map / WeakMap / 对象），
 *        返回一个新函数，新函数先查缓存、未命中才调用原函数并写入缓存。
 *    (2) 缓存键的构造：
 *          - 单参数且是基本类型 → 直接用参数；
 *          - 多参数 → 用 JSON.stringify(args) 拼接（简单但有局限）；
 *          - 对象参数 → 用 JSON.stringify 或自己实现稳定的序列化；
 *          - 需要按"引用"缓存 → 用 WeakMap（对象作为键时可被回收，避免内存泄漏）。
 *    (3) Map 比普通对象更适合做缓存：键可以是任意类型，且有 size 属性和 has/delete。
 *    (4) WeakMap 的键是弱引用：对象失去其他引用后，缓存条目会被自动回收，
 *        非常适合"以对象为键"的缓存。
 *    (5) 缓存策略：无上限缓存适合纯计算；有内存风险时应加 LRU 或 TTL 淘汰。
 *
 * 4. 常见陷阱
 *    - 缓存键不唯一：JSON.stringify 对属性顺序敏感，{a:1,b:2} 与 {b:2,a:1} 会生成不同的键。
 *    - 给非纯函数做缓存：同一个输入的结果可能变了（比如依赖当前时间），缓存会返回旧值。
 *    - 用对象当键却没有用 WeakMap，导致对象被缓存"钉住"无法回收 → 内存泄漏。
 *    - 无上限缓存大结果集：跑得越久内存越大。
 *    - 把"缓存命中率"这类调试信息暴露给外部后忘了清理。
 *
 * 【运行方法】
 *   node 07_scope_and_closure/09_closure_memoization.js
 *
 * 【预期输出】
 *   从最简 memoize 开始，逐步加入缓存统计、多参数键、对象键（WeakMap）、
 *   带 LRU 淘汰的缓存，并对比开启缓存前后的计算次数与耗时。
 * ============================================================================
 */

console.log('--- 1. 为什么需要缓存：先看一个"慢"函数 ---');

// 用一个"故意慢一点"的纯函数来放大差异（真实场景里可能是复杂解析、正则、加解密）。
let heavyCallCount = 0;
function heavyCompute(n) {
  heavyCallCount += 1;
  // 模拟耗时计算（同步的自旋，不涉及任何 I/O）。
  let acc = 0;
  for (let i = 0; i < 2_000_000; i++) {
    acc = (acc + i) % 1000003;
  }
  return n * n + (acc % 7);
}

const started1 = Date.now();
const a1 = heavyCompute(12);
const a2 = heavyCompute(12); // 同样的输入，又算了一遍
const a3 = heavyCompute(12);
const cost1 = Date.now() - started1;
console.log(`  三次计算同样输入：结果 ${a1} / ${a2} / ${a3}`);
console.log(`  实际执行次数 → ${heavyCallCount}，总耗时约 ${cost1}ms`);
console.log('  结论：同样的输入算了三遍，纯粹是浪费 —— 这就是记忆化要解决的问题。');

console.log('--- 2. 最简 memoize：闭包保存私有缓存 ---');

function memoize(fn) {
  // 缓存是"私有"的：外部完全拿不到，只能通过返回的函数间接使用。
  const cache = new Map();

  return function memoized(...args) {
    // 构造缓存键：这里先用最简单的 JSON.stringify 方案。
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      // 命中缓存：直接返回，不调用原函数。
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

heavyCallCount = 0;
const memoHeavy = memoize(heavyCompute);
const started2 = Date.now();
const b1 = memoHeavy(12);
const b2 = memoHeavy(12);
const b3 = memoHeavy(12);
const cost2 = Date.now() - started2;
console.log(`  三次调用：结果 ${b1} / ${b2} / ${b3}（与原函数一致）`);
console.log(`  实际执行次数 → ${heavyCallCount}，总耗时约 ${cost2}ms`);
console.log(`  首次必须真算，后两次直接命中缓存 —— 执行次数从 3 降到 ${heavyCallCount}。`);

console.log('--- 3. 加上缓存命中的统计（仍然放在闭包里）---');

function memoizeWithStats(fn) {
  const cache = new Map();
  // 私有统计信息，通过暴露出来的方法读取。
  let hits = 0;
  let misses = 0;

  const memoized = function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      hits += 1;
      return cache.get(key);
    }
    misses += 1;
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };

  // 统计信息也是"受控读接口"，不直接暴露内部变量。
  memoized.stats = () => ({ hits, misses, size: cache.size, hitRate: hits + misses === 0 ? 0 : hits / (hits + misses) });
  memoized.clear = () => {
    cache.clear();
    hits = 0;
    misses = 0;
    return '缓存与统计已清空';
  };
  return memoized;
}

let fibCallCount = 0;
function slowFib(n) {
  fibCallCount += 1;
  if (n < 2) return n;
  return slowFib(n - 1) + slowFib(n - 2);
}
// 注意：这里的 slowFib 内部调用的是它自己，不是被 memo 化的版本，
// 所以外层 memo 只能避免"重复调用同一入口"的开销。
const memoFib = memoizeWithStats(slowFib);
console.log('  memoFib(15) →', memoFib(15));
console.log('  第一次调用统计 →', memoFib.stats());
console.log('  memoFib(15) →', memoFib(15), '（命中缓存）');
console.log('  memoFib(16) →', memoFib(16), '（新参数，未命中）');
console.log('  最终统计 →', memoFib.stats());
console.log('  提示：stats() 里的 hitRate 已经四舍五入前的原始小数，可以自己 toFixed 展示。');
console.log('  命中率 →', (memoFib.stats().hitRate * 100).toFixed(1) + '%');
console.log(' ', memoFib.clear());

console.log('--- 4. 递归函数自己记忆化：把缓存嵌进递归里 ---');

// 更彻底的方案：让递归函数自己带缓存，这样内部子问题也能命中。
function fibMemoized(n, cache = new Map()) {
  if (n < 2) return n;
  if (cache.has(n)) return cache.get(n);
  const value = fibMemoized(n - 1, cache) + fibMemoized(n - 2, cache);
  cache.set(n, value);
  return value;
}
const counts = {};
function fibTraced(n, cache = new Map(), trace = { calls: 0 }) {
  trace.calls += 1;
  if (n < 2) return n;
  if (cache.has(n)) return cache.get(n);
  const value = fibTraced(n - 1, cache, trace) + fibTraced(n - 2, cache, trace);
  cache.set(n, value);
  return value;
}
const traceObj = { calls: 0 };
console.log('  fibTraced(30) →', fibTraced(30, new Map(), traceObj), `（函数调用次数 ${traceObj.calls}）`);
console.log('  对比：不做记忆化的朴素递归，fib(30) 要调用上百万次。');
void counts;
void fibMemoized;

// 更好的做法：用闭包把缓存彻底藏起来，调用方连 cache 参数都不用传。
const fib = (() => {
  const cache = new Map();
  function compute(n) {
    if (n < 2) return n;
    if (cache.has(n)) return cache.get(n);
    const value = compute(n - 1) + compute(n - 2);
    cache.set(n, value);
    return value;
  }
  // 暴露一个只收一个参数的干净接口。
  const wrapped = (n) => compute(n);
  wrapped.cacheSize = () => cache.size;
  return wrapped;
})();
console.log('  fib(40) →', fib(40), '（内部缓存了', fib.cacheSize(), '个子问题的结果）');
console.log('  fib(40) 再算一次 →', fib(40), '（全部命中缓存，瞬间返回）');

console.log('--- 5. 多参数与键的构造策略 ---');

// 三个参数的函数，看看不同键构造方式的效果。
let computeCallCount = 0;
function computeArea(width, height, unit) {
  computeCallCount += 1;
  return `${width * height} ${unit}`;
}
const memoArea = memoize(computeArea);
console.log('  memoArea(3, 4, "cm")  →', memoArea(3, 4, 'cm'));
console.log('  memoArea(3, 4, "cm")  →', memoArea(3, 4, 'cm'), '（命中）');
console.log('  memoArea(4, 3, "cm")  →', memoArea(4, 3, 'cm'), '（顺序不同 = 不同的键，会重新计算）');
console.log('  真实计算次数 →', computeCallCount, '（说明只有真正不同的参数组合才重算）');

// 对象参数的键陷阱。
const memoByJson = memoize((obj) => `处理了 ${JSON.stringify(obj)}`);
console.log('  ', memoByJson({ a: 1, b: 2 }));
console.log('  ', memoByJson({ a: 1, b: 2 }), '（同样的内容，命中缓存）');
console.log('  ', memoByJson({ b: 2, a: 1 }), '  ← 属性顺序不同，JSON 字符串不同 → 缓存未命中');
console.log('  结论：JSON.stringify 做键对"属性顺序"敏感。需要避免时，应做一次按键排序的稳定序列化。');

// 稳定的序列化：先按 key 排序再序列化。
function stableKey(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableKey).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableKey(value[k])}`).join(',')}}`;
}
// 让 memoize 支持自定义键函数，这样就能把上面的 stableKey 用起来。
function memoizeBy(fn, keyFn) {
  const cache = new Map();
  return function (...args) {
    const key = keyFn(args);
    if (cache.has(key)) {
      return `命中缓存：${cache.get(key)}`;
    }
    const result = fn(...args);
    cache.set(key, result);
    return `真实计算：${result}`;
  };
}

const memoByStable = memoizeBy((obj) => `处理了 ${JSON.stringify(obj)}`, (args) => stableKey(args[0]));
console.log('  ', memoByStable({ a: 1, b: 2 }));
console.log('  ', memoByStable({ b: 2, a: 1 }), '  ← 稳定键把它和上一条视为同一个键，直接命中');
console.log('  结论：多参数/对象参数场景，自定义键函数往往是最省心也最可靠的做法。');

console.log('--- 6. 以对象为键：用 WeakMap 避免内存泄漏 ---');

// 场景：给每个"用户对象"缓存一份计算好的资料。
function makeUserProfileCache() {
  // WeakMap 的键是弱引用：用户对象被回收后，对应的缓存条目也会自动消失。
  const cache = new WeakMap();
  let computed = 0;

  return {
    getProfile(user) {
      if (cache.has(user)) {
        return cache.get(user);
      }
      computed += 1;
      const profile = { id: user.id, displayName: `用户-${user.id}`, computedAt: '本次计算' };
      cache.set(user, profile);
      return profile;
    },
    get computedCount() {
      return computed;
    },
  };
}

const profileCache = makeUserProfileCache();
const user1 = { id: 1, name: '小明' };
const user2 = { id: 2, name: '小红' };
console.log('  user1 第一次 →', profileCache.getProfile(user1));
const firstProfile = profileCache.getProfile(user1);
const secondProfile = profileCache.getProfile(user1);
console.log('  同一个 user1 再取两次，是同一个对象吗？', firstProfile === secondProfile);
void secondProfile;
console.log('  user2 →', profileCache.getProfile(user2));
console.log('  真实计算次数 →', profileCache.computedCount, '（三次调用只计算了两次）');
console.log('  WeakMap 的优势：user1 若在其他地方不再被引用，它可以被回收，');
console.log('                  对应的缓存条目也会一起消失，不会造成内存泄漏。');
console.log('  WeakMap 的限制：不可遍历、没有 size，所以无法做统计报表。');

console.log('--- 7. 给缓存加上容量上限（LRU 思想）---');

function memoizeLRU(fn, maxSize = 3) {
  // Map 的迭代顺序是"插入顺序"，用它就能很方便地实现 LRU。
  const cache = new Map();

  return {
    call(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        // 命中后把它删掉再重新插入 → 移到"最新使用"的位置。
        const value = cache.get(key);
        cache.delete(key);
        cache.set(key, value);
        return `命中：${value}`;
      }
      const value = fn(...args);
      cache.set(key, value);
      // 超出容量就淘汰"最久未使用"的那个（也就是 Map 里的第一个键）。
      if (cache.size > maxSize) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
      }
      return `计算：${value}`;
    },
    keys() {
      return [...cache.keys()];
    },
  };
}

const lru = memoizeLRU((n) => n * 100, 3);
console.log(' ', lru.call(1));
console.log(' ', lru.call(2));
console.log(' ', lru.call(3));
console.log('  ', lru.call(1), '（命中，并把它移到最新位置）');
console.log('  ', lru.call(4), '（超出容量 3，淘汰最久未使用的 key=2）');
console.log('  当前缓存里的键 →', lru.keys(), '（2 已被淘汰）');

console.log('--- 8. 什么时候不该用记忆化 ---');

const cautions = [
  ['函数不是纯函数', '依赖时间、随机数、外部状态时，缓存会返回过时结果'],
  ['输入空间极大且几乎不重复', '缓存只增不减，纯粹浪费内存'],
  ['参数是大量不同的对象', '请用 WeakMap，否则对象会被缓存钉住无法回收'],
  ['返回大对象/大数组', '缓存会长期占用大量内存，应加容量上限或改用 WeakMap'],
  ['计算本身很便宜', '构造键 + 查表的开销可能比直接算还大'],
  ['有副作用（发请求、写文件）', '切记不要缓存副作用本身，否则它们只执行一次'],
];
for (const [scene, reason] of cautions) {
  console.log(`  · ${scene}：${reason}`);
}

console.log('--- 9. 小结：memoize 的三要素 ---');
console.log('  ① 私有缓存（闭包提供）—— 用 Map / WeakMap，不污染外部；');
console.log('  ② 键的构造 —— 单参直接用，多参用稳定序列化，对象优先 WeakMap；');
console.log('  ③ 淘汰策略 —— 无上限只适合确定的小输入空间；否则加 LRU 或 TTL。');
