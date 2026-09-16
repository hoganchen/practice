/**
 * ============================================================================
 * 知识点：闭包与内存 —— 为什么闭包会阻止回收、如何避免泄漏
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】高级
 * 【前置知识】07_scope_and_closure/06_closure_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 的垃圾回收（GC）采用"可达性"判定：只要一个对象还能从根（全局对象、
 *    当前调用栈等）沿着引用链被找到，它就不会被回收。
 *    闭包的作用域环境就是一条这样的引用链：只要"闭包函数本身"还活着，
 *    它捕获的那些变量（以及这些变量引用的所有对象）就都活着。
 *    这不是 bug，而是闭包的定义使然 —— 但它确实是"内存泄漏"的主要来源之一。
 *
 * 2. 为什么需要
 *    在生产环境里，内存泄漏的表现往往是"跑得越久越慢，最后 OOM 崩溃"。
 *    理解闭包与可达性的关系，才能判断"这块内存到底为什么没被释放"，
 *    也才能写出"用完就断开引用"的代码。
 *    关键认知：泄漏的往往不是"闭包变量"本身，而是它间接引用的大对象。
 *
 * 3. 核心语法要点
 *    (1) 只有当闭包"逃逸"出去并且被长期持有（全局变量、模块级变量、
 *        注册在事件总线上、被定时器引用）时，才可能造成泄漏。
 *    (2) 触发回收的唯一办法：让那个闭包函数本身不再可达
 *        （置为 null、从数组/Map 中移除、清除定时器、解绑事件监听）。
 *    (3) 用 WeakMap / WeakRef / FinalizationRegistry 可以让引用"不阻止回收"。
 *    (4) 现代引擎（V8）会做"变量级"的优化：如果闭包只用到了外层作用域里的
 *        某个变量，其他变量可能不会被保留。但这是实现细节，不能依赖。
 *    (5) 测量手段：process.memoryUsage() 看堆使用量；配合 --expose-gc
 *        手动触发 GC 后对比更能说明问题。
 *
 * 4. 常见陷阱
 *    - 把闭包放进全局数组 / 模块级 Map，永远不清理（缓存变成"只增不减"）。
 *    - setInterval 注册的闭包没有 clearInterval，且它捕获了大对象。
 *    - 事件监听注册后从不移除，回调闭包持有整个组件状态。
 *    - 闭包捕获了整个大对象，但只用到其中一个小字段。
 *    - 认为"函数返回了内存就该释放"（闭包让它继续活着）。
 *
 * 【运行方法】
 *   node 07_scope_and_closure/10_closure_memory.js
 *
 * 【预期输出】
 *   用可观察的引用关系说明"闭包让变量活下去"，
 *   用 process.memoryUsage() 对比"被闭包持有"与"已断开引用"两种情况的堆占用，
 *   并给出避免泄漏的具体做法。
 * ============================================================================
 */

console.log('--- 1. 可观察的事实：闭包让变量活下去 ---');

// 用 FinalizationRegistry 观察"对象是否被回收"。
// 注意：GC 的时机由引擎决定，所以下面的输出只具有"示意"意义，
// 不要把它当成本示例的断言依据（因此我们只打印、不断言）。
const collected = [];
const registry = new FinalizationRegistry((label) => {
  collected.push(label);
});

function createHolder() {
  const bigData = { label: '大对象 A', payload: new Array(1000).fill('数据') };
  registry.register(bigData, bigData.label);
  // 返回一个引用了 bigData 的闭包 —— 只要这个闭包活着，bigData 就活着。
  return () => bigData.label;
}

let holder = createHolder();
console.log('  闭包读到的内容 →', holder());
console.log('  此时被回收的对象 →', collected.length === 0 ? '（暂无）' : collected);
console.log('  只要 holder 变量还在引用这个闭包，它捕获的 bigData 就无法被回收。');

// 断开引用：把 holder 置为 null，闭包函数失去引用，bigData 才可能被回收。
holder = null;
console.log('  已把 holder 置为 null（断开对闭包的唯一引用）');
console.log('  注意：GC 何时执行由引擎决定，所以这里不打印"是否已回收"作为结论。');

console.log('--- 2. 用堆内存数据直观感受"被持有"与"被释放" ---');

// 统一格式化字节数。
const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

// 造一批"大对象"：每个对象里放一个 5 万个数字的数组，约占 400KB。
// 注意：这里用"数字数组"而不是大字符串来撑内存，是因为数字数组会被
// 老老实实计入 heapUsed，测量结果才可信、才好观察。
function makePayload(index) {
  const numbers = new Array(50_000);
  for (let i = 0; i < numbers.length; i++) numbers[i] = i + index;
  return { index, numbers };
}

const heapBefore = process.memoryUsage().heapUsed;

// 场景一：用一个数组"持有"这些对象（模拟被闭包/缓存长期引用）。
const leakedStore = [];
for (let i = 0; i < 100; i++) {
  leakedStore.push(makePayload(i));
}
const heapNow = process.memoryUsage().heapUsed;
console.log('  持有 100 份大对象（每份含一个 5 万元素的数字数组）：');
console.log(`    持有前 heapUsed = ${mb(heapBefore)}`);
console.log(`    持有后 heapUsed = ${mb(heapNow)}（增长 ${mb(heapNow - heapBefore)}）`);

// 场景二：断开引用，让它们变成不可达。
leakedStore.length = 0; // 清空数组 → 里面的对象不再被引用
// 主动请求 GC。注意：`global.gc` 只有在用 --expose-gc 启动时才存在。
if (typeof globalThis.gc === 'function') {
  globalThis.gc();
  console.log('  已通过 global.gc() 请求一次垃圾回收（--expose-gc 生效）。');
}

const heapAfterRelease = process.memoryUsage().heapUsed;
console.log(`    清空数组后 heapUsed = ${mb(heapAfterRelease)}`);
console.log('  说明：清空数组只是"断开引用"，内存什么时候真正释放由 GC 决定。');
console.log('        所以这里的数字不一定立刻下降 —— 这是正常现象，不是代码有问题。');
console.log('        想看到明显效果，用 `node --expose-gc 07_scope_and_closure/10_closure_memory.js` 运行。');
void leakedStore;

console.log('--- 3. 泄漏场景一：全局/模块级缓存只增不减 ---');

// 反面教材：把结果永远塞进一个模块级 Map。
const unboundedCache = new Map();

function badMemoize(fn) {
  return function (...args) {
    const key = JSON.stringify(args);
    if (!unboundedCache.has(key)) {
      unboundedCache.set(key, fn(...args)); // 永远不会被清理
    }
    return unboundedCache.get(key);
  };
}

const cachedDouble = badMemoize((n) => n * 2);
for (let i = 0; i < 1000; i++) {
  cachedDouble(i);
}
console.log('  无上限缓存的大小 →', unboundedCache.size, '（只增不减，输入空间一大就是泄漏）');

// 正面做法：加容量上限（LRU 思想），或改用 WeakMap。
function goodMemoize(fn, maxSize = 100) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const value = fn(...args);
    cache.set(key, value);
    if (cache.size > maxSize) {
      // 淘汰最早插入的那一项（最简单的 FIFO，真实 LRU 见 09 号示例）。
      cache.delete(cache.keys().next().value);
    }
    return value;
  };
}
const boundedCache = goodMemoize((n) => n * 2);
for (let i = 0; i < 1000; i++) {
  boundedCache(i);
}
console.log('  有上限缓存：调用 1000 次后缓存大小被限制住了（最大 100 项）');
const probe = new Map();
for (let i = 990; i < 1000; i++) probe.set(i, i);
void probe;

console.log('--- 4. 泄漏场景二：定时器里的闭包 ---');

let tickCount = 0;
const bigConfig = { data: 'x'.repeat(50 * 1024), name: '定时器持有的配置' };

const timer = setInterval(() => {
  // 这个闭包捕获了 bigConfig。只要定时器不清除，bigConfig 就一直活着。
  tickCount += 1;
  if (tickCount >= 3) {
    // 达到次数后主动清除定时器 —— 这是正确做法。
    clearInterval(timer);
    console.log(`  定时器执行了 ${tickCount} 次后已清除（bigConfig 随之可被回收）`);
  }
}, 5);

// 等定时器跑完，保证输出顺序稳定。
await new Promise((resolve) => setTimeout(resolve, 50));
console.log('  反面教材：如果永远不 clearInterval，这个闭包和它捕获的 bigConfig 会一直存在，');
console.log('            对模块级/长生命周期的对象注册定时器时，这种泄漏尤其常见。');

console.log('--- 5. 泄漏场景三：只用到大对象的一个小字段 ---');

function makeProcessor(bigRecord) {
  // 这里只用到 bigRecord.id，但整个 bigRecord 都会被闭包捕获。
  return () => `处理的记录 id = ${bigRecord.id}`;
}
const hugeRecord = { id: 42, lines: new Array(10_000).fill('很长的内容') };
const processor = makeProcessor(hugeRecord);
console.log('  ', processor());
console.log('  问题：processor 只需要 id，却把整个 hugeRecord（含一万行内容）留在了内存里。');

// 改进：只把真正需要的数据取出来再进闭包。
function makeProcessorFixed(record) {
  // 先解构出需要的那一个字段，闭包只捕获这个小值。
  const { id } = record;
  return () => `处理的记录 id = ${id}`;
}
const processorFixed = makeProcessorFixed(hugeRecord);
console.log('  ', processorFixed(), '（闭包只捕获了 id 这个数字）');
console.log('  原则：不要让闭包"顺便"捕获整个大对象，先解构出真正需要的部分。');

console.log('--- 6. 让引用"不阻止回收"：WeakMap / WeakRef ---');

// WeakMap：键是弱引用，键对象被回收时对应条目自动消失。
const weakCache = new WeakMap();
let keyObject = { id: 'key-1' };
weakCache.set(keyObject, '与 key 关联的值');
console.log('  WeakMap 有值吗？', weakCache.get(keyObject));
keyObject = null; // 断开对键对象的引用 → 该条目可被自动回收
console.log('  WeakMap 没有 size / 不可遍历，因此没法打印"还剩几项" —— 这正是它"不阻止回收"的代价。');

// WeakRef：持有一个"弱引用"，需要时用 deref() 看看对象还在不在。
let target = { name: '被弱引用的对象' };
const weakRef = new WeakRef(target);
console.log('  WeakRef.deref() →', weakRef.deref()?.name ?? '（对象已被回收）');
target = null;
// 这里不强制 GC，所以通常还能 deref 到；输出结果因引擎调度而异，不做断言。
console.log('  把 target 置为 null 后，deref() →', weakRef.deref()?.name ?? '（对象已被回收）');
console.log('  WeakRef 适合"缓存但允许随时丢失"的场景，用之前必须处理 deref() 返回 undefined 的情况。');

console.log('--- 7. 正确断开的四种手法 ---');

// 手法 1：把持有闭包的变量置为 null。
let fn = () => 'hello';
fn = null;
console.log('  ① 变量置 null：let fn = () => {}; fn = null;');

// 手法 2：从集合中移除（数组、Map、Set）。
const listeners = new Set();
const listener = () => 'event';
listeners.add(listener);
listeners.delete(listener);
console.log('  ② 从集合中删除：listeners.delete(listener)');

// 手法 3：清除定时器 / 解绑监听（浏览器里还有 removeEventListener）。
console.log('  ③ 清除定时器：clearInterval(timer) / clearTimeout(timer)');

// 手法 4：改用弱引用容器（WeakMap / WeakSet）承载"附属数据"。
const weakSet = new WeakSet();
let obj = {};
weakSet.add(obj);
obj = null;
console.log('  ④ 改用 WeakMap / WeakSet，让引用不阻止回收');

console.log('--- 8. 排查清单：怀疑内存泄漏时按这个顺序看 ---');

const checklist = [
  ['模块级 Map / 数组缓存', '有没有容量上限？有没有 TTL？能否换成 WeakMap？'],
  ['定时器与轮询', 'clearInterval 了吗？闭包里捕获了大对象吗？'],
  ['事件监听', '注册后有没有对应的移除逻辑？'],
  ['闭包捕获范围', '是不是"顺便"捕获了整个大对象？能不能先解构？'],
  ['闭包工厂的返回值', '返回的方法是不是一直挂在长生命周期对象上？'],
  ['验证工具', 'node --expose-gc 手动 GC 前后对比 process.memoryUsage().heapUsed；'],
  ['', '浏览器里用 DevTools 的 Memory 面板拍两次堆快照做对比。'],
];
for (const [item, question] of checklist) {
  if (!item) {
    console.log(`      ${question}`);
    continue;
  }
  console.log(`  · ${item}`);
  console.log(`      → ${question}`);
}

console.log('--- 9. 一句话总结 ---');
console.log('  闭包本身不是泄漏，"闭包 + 长期持有"才是。');
console.log('  判断依据只有一条：这个闭包函数，还能从根对象沿着引用链找到吗？');
console.log('  能 → 它捕获的一切都活着；不能 → 全部可以被回收。');
