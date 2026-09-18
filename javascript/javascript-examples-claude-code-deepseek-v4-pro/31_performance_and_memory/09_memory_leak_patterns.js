/**
 * ============================================================================
 * 知识点：内存泄漏的常见模式 —— 全局变量、定时器、闭包、无上限缓存、分离 DOM
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/03_memoization.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 的垃圾回收（GC）用的是【可达性分析】：
 *    从根（全局对象、当前调用栈、闭包作用域等）出发，能顺着引用链走到的对象
 *    就"活着"，走不到就可以被回收。
 *    内存泄漏不是"内存丢了"，而是【本该不可达的对象，却因为某条被遗忘的引用
 *    链仍然可达】，于是 GC 永远不敢回收它。泄漏的本质是"引用还在"。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 单页应用长时间不刷新，内存越用越多，最终标签页崩溃；
 *    - Node.js 服务长期运行，内存缓慢上涨，几小时后 OOM 重启；
 *    - 组件反复挂载/卸载，每次卸载都留下一点残留，几百次后页面卡死；
 *    - 移动端内存紧张，泄漏会导致 WebView 被系统杀掉。
 *    这类问题的特点是"不会报错、只会越来越慢"，所以必须靠对模式的敏感度
 *    和工具（Chrome DevTools 的 Memory 面板、Node 的 heap snapshot）来定位。
 *
 * 3. 核心语法要点（本示例演示的五种模式）
 *    (1) 意外的全局变量：函数里给未声明的变量赋值（leaked = x）会创建全局变量；
 *        全局变量是 GC 根，永远可达。'use strict' 或 ESM 下会直接报错，反而是保护。
 *    (2) 未清理的定时器 / 事件监听器：setInterval 的回调、注册在全局对象上的
 *        监听器都会持有闭包作用域，让回调里用到的所有对象都活着。
 *    (3) 闭包持有大对象：闭包会捕获它引用到的外层变量；只要闭包还活着，
 *        被捕获的大对象就一直活着——哪怕后面再也不用它。
 *    (4) 缓存无上限：用 Map/对象当缓存且永不清理，key 空间无限时它只增不减。
 *    (5) 分离的 DOM 节点（前端）：节点已从文档树移除，但 JS 里还留着对它的引用，
 *        整个子树连同它的监听器都无法回收。
 *
 * 4. 常见陷阱
 *    - 陷阱一：以为"变量置 null"就万事大吉。如果对象还被别的东西引用着
 *      （闭包、全局数组、pending 的 Promise、监听器），置 null 也没用。
 *    - 陷阱二：以为用了 WeakMap 就万事大吉。WeakMap 只对【对象键】弱引用，
 *      值仍然是强引用；如果值又反过来引用了键，一样会泄漏。
 *    - 陷阱三：把 GC 观察结果当成"事实"。GC 什么时候跑、跑不跑，
 *      完全由引擎决定，Node 里还有栈扫描等保守策略。**观察不到回收 ≠ 有泄漏**，
 *      观察到回收才说明"这次真的收了"。
 *    - 陷阱四：只盯着"内存数字"。内存数值因环境、Node 版本、堆策略而异，
 *      应该关注的是"引用是否合理存在"这个结构性问题。
 *
 * 【关于本示例的观察手段（很重要）】
 *    本示例刻意【不强制触发 GC】（不使用 --expose-gc），因此：
 *    · 确定性的证据是"可达性"——对象是否还有一条从根出发的引用链；
 *    · GC 观察（WeakRef.deref()）只是"尽力而为"的补充，结果【不保证稳定】；
 *    · 在部分 Node 版本上（尤其启用了保守栈扫描的版本），WeakRef 的目标
 *      可能长时间不被回收，这是引擎行为，不是 bug。
 *    内存数值因环境而异，本示例不打印任何具体内存字节数，只做定性说明。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/09_memory_leak_patterns.js
 *
 * 【预期输出】
 *   打印 7 个小节：观察工具与原理、五种泄漏模式各一节（每种都有坏例子、
 *   确定性证据和可选的 GC 观察），以及最后的排查清单。
 * ============================================================================
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 1. 观察工具：可达性是确定的，GC 观察是不确定的
// ---------------------------------------------------------------------------

console.log('--- 1. 原理与观察工具 ---');

console.log('JS 的 GC 用【可达性分析】：从根（全局对象、调用栈、闭包）出发，');
console.log('顺着引用链能走到的对象就活着，走不到才能被回收。');
console.log('内存泄漏 = 本该不可达的对象，因为一条被遗忘的引用链仍然可达。');
console.log('');
console.log('本示例用两种观察手段：');
console.log('  ① 可达性检查（确定性）：对象是否还有活的引用路径指向它；');
console.log('     比如"闭包还能不能读出这个数组的内容"——能读出来就说明它还活着。');
console.log('  ② WeakRef + FinalizationRegistry（不确定性）：');
console.log('     ref.deref() 返回 undefined 表示已被回收。');
console.log('     但 GC 何时运行完全由引擎决定，观察不到回收【不代表】有泄漏。');

// 记录被回收对象的标签，用于观察 FinalizationRegistry 是否触发
const finalizedLabels = [];
const registry = new FinalizationRegistry((label) => {
  finalizedLabels.push(label);
});

/**
 * 创建一个"可被观察是否回收"的对象。
 * 注意：只返回 WeakRef，不返回对象本身的强引用，否则就永远回收不了了。
 */
function track(label) {
  const target = { label, payload: new Array(100).fill(label) };
  const ref = new WeakRef(target);
  registry.register(target, label);
  // target 是局部变量，函数返回后就没有强引用了（除了调用方自己再持有）
  return { label, ref };
}

// 制造一点分配压力，给 GC 一个运行的机会（但绝不强制、也不保证它一定跑）
async function giveGcAChance() {
  for (let round = 0; round < 2; round++) {
    let sink = 0;
    for (let i = 0; i < 150_000; i++) {
      const tmp = { i };
      sink += tmp.i;
    }
    if (sink < 0) console.log(sink); // 防止整个循环被引擎优化掉
    await sleep(20);
  }
}

/** 打印一次 GC 观察结果，并对两种结果都给出解释 */
function reportGcObservation(label, ref, expectation) {
  const collected = ref.deref() === undefined;
  console.log(`  GC 观察：${label} → ${collected ? '已被回收（deref() 返回 undefined）' : '仍可达（deref() 仍能取到对象）'}`);
  if (collected) {
    console.log('    说明：这次 GC 确实把它回收了，符合预期。');
  } else {
    console.log('    说明：这不代表"一定泄漏"——GC 时机不确定，');
    console.log('          而且部分 Node 版本的保守栈扫描会把对象暂时钉住。');
    console.log(`          预期是：${expectation}`);
  }
  return collected;
}

// ---------------------------------------------------------------------------
// 2. 模式一：意外的全局变量
// ---------------------------------------------------------------------------

console.log('\n--- 2. 模式一：意外的全局变量 ---');

console.log('坏例子：函数内给【未声明】的变量赋值');
console.log('    function cacheUser(user) {');
console.log('      leakedUsers = [user];   // 忘了 let/const，创建了一个全局变量');
console.log('    }');

// 演示：故意在函数里给一个未声明的变量赋值。
// 这里用 globalThis 显式模拟，避免真的写出"隐式全局变量"这种脏代码；
// 在非严格模式下（普通脚本）它的效果完全一样，都会挂到全局对象上。
function cacheUserLeaky(user) {
  // 等价于 leakedUsers = [user]（非严格模式下会创建全局变量）
  globalThis.__leakedUsers = [user];
  return globalThis.__leakedUsers.length;
}

const leakyTrack = track('全局变量持有的用户对象');
// 模拟：把用户对象塞进"意外的全局变量"
globalThis.__leakedUsers = [{ name: '小明', track: leakyTrack }];

console.log(`  当前全局变量里的用户数：${globalThis.__leakedUsers.length}`);
console.log('  可达性检查（确定性）：');
console.log(`    能通过 globalThis.__leakedUsers[0].name 读到 = ${globalThis.__leakedUsers[0].name}`);
console.log('    → 全局变量是 GC 根之一，只要它还指向这个数组，数组和里面的对象就永远活着。');
console.log('');
console.log('好例子：用局部变量 + 明确的生命周期');
console.log('    function cacheUser(user) {');
console.log('      const list = [user];   // 局部变量，函数返回后就可以被回收');
console.log('      return list;           // 由调用方决定要不要长期持有');
console.log('    }');
console.log('');
console.log('补充：ESM 和 "use strict" 下给未声明变量赋值会直接抛 ReferenceError，');
console.log('      这其实是好事——把"潜伏多年的泄漏"变成"当场报错"。本仓库所有示例');
console.log('      都是 ESM，所以下面这段代码必须用 globalThis 显式模拟才能运行。');

// 先看"严格模式下的保护"：直接 eval 继承当前的严格模式，赋值给未声明变量会抛错
try {
  eval('undeclaredLeakVariable = 1;'); // 直接 eval → 继承 ESM 的严格模式
  console.log('  这一行不会执行');
} catch (err) {
  console.log(`  直接 eval 抛出了 ${err.constructor.name}：${err.message}`);
  console.log('  → 严格模式（含所有 ESM 模块）把这类隐蔽泄漏变成了当场报错，这是好事。');
}

// 再看"老式脚本的行为"：间接 eval 在全局非严格作用域里执行，会真的创建全局变量
const indirectEval = eval; // 换个名字调用 → 变成间接 eval
indirectEval('undeclaredLeakVariable = 1;');
console.log(`  间接 eval 执行后，全局变量出现了：${typeof globalThis.undeclaredLeakVariable}`);
console.log('  → 这就是"意外的全局变量"的由来：一次不小心，对象就挂到 GC 根上了。');

// 清理掉演示用的全局变量，避免影响后续小节
delete globalThis.undeclaredLeakVariable;

console.log('');
console.log('修复：显式删除不再需要的全局引用');
delete globalThis.__leakedUsers;
console.log(`  删除后 globalThis.__leakedUsers = ${globalThis.__leakedUsers}`);
console.log('  → 这就是"解除引用"，让对象重新变成不可达，GC 才有可能回收它。');

// ---------------------------------------------------------------------------
// 3. 模式二：未清理的定时器与事件监听器
// ---------------------------------------------------------------------------

console.log('\n--- 3. 模式二：未清理的定时器与事件监听器 ---');

console.log('坏例子：组件卸载时忘了清定时器');
console.log('    onMounted(() => { timer = setInterval(() => { 更新图表(大对象); }, 1000); });');
console.log('    onUnmounted(() => { /* 忘了 clearInterval */ });');
console.log('');
console.log('为什么是泄漏：');
console.log('  · setInterval 的回调函数被定时器队列【强引用】着；');
console.log('  · 回调函数又通过闭包【捕获】了它用到的所有变量（比如那个大对象）；');
console.log('  · 于是"定时器 → 回调 → 闭包作用域 → 大对象"形成一条永远不断的引用链。');

// 用一个假想的"图表组件"来演示
function createChartComponent() {
  // 这个对象模拟组件的大数据（比如 10 万个数据点）
  const chartData = { points: new Array(1000).fill(0), name: '销售趋势图' };
  const chartTrack = track('图表组件的大数据对象');
  const state = {
    renderCount: 0, // 渲染次数，用来观察定时器是否还在跑
    cleared: false,
    data: chartData, // 通过 state 保持可达，方便演示可达性
  };

  // 模拟 setInterval：用一个长周期定时器，避免示例变慢
  state.timer = setInterval(() => {
    // 回调里用到了 chartData → 通过闭包捕获 → chartData 一直活着
    state.renderCount += 1;
    void chartData.points.length;
  }, 15);

  return { state, chartTrack };
}

const { state: chartState, chartTrack } = createChartComponent();

await sleep(60); // 让定时器跑几轮
console.log(`  定时器运行约 60ms 后，渲染次数 = ${chartState.renderCount}`);

// 模拟"组件卸载"但忘记清理
console.log('');
console.log('模拟组件卸载时【忘记】clearInterval：');
console.log(`  卸载后仍能读到组件数据 = ${chartState.data.name}（说明对象还活着）`);
await sleep(40);
console.log(`  卸载后渲染次数还在增加 = ${chartState.renderCount}（说明定时器还在跑）`);
console.log('  → 定时器没停，回调里的闭包就一直持有 chartData，内存无法释放。');

// 正确做法：卸载时清理
console.log('');
console.log('正确做法：卸载时 clearInterval');
clearInterval(chartState.timer);
chartState.cleared = true;
const beforeClear = chartState.renderCount;
await sleep(50);
console.log(`  清理后渲染次数 = ${chartState.renderCount}，清理前是 ${beforeClear}`);
console.log(`  定时器是否已停止：${chartState.renderCount === beforeClear}`);

// 事件监听器同理
console.log('');
console.log('事件监听器的等价问题：');
console.log('  window.addEventListener("resize", handler) 如果不 removeEventListener，');
console.log('  handler 会一直被 window（GC 根）引用，它闭包里的一切都不会被回收。');
console.log('  这就是为什么框架都要在卸载钩子里做清理——');
console.log('  这不是"框架的规矩"，而是"解除引用"的必要步骤。');

// ---------------------------------------------------------------------------
// 4. 模式三：闭包持有大对象
// ---------------------------------------------------------------------------

console.log('\n--- 4. 模式三：闭包持有大对象 ---');

console.log('坏例子：闭包捕获了整个大对象，实际只用其中一个小字段');

function createLeakyGetter() {
  // 一个很大的配置对象
  const hugeConfig = {
    items: new Array(5000).fill({ name: 'x' }),
    theme: 'dark',
  };

  // 下面这个闭包只用到 hugeConfig.theme，
  // 但因为它引用了 hugeConfig 这个变量，整个对象都会被闭包作用域持有。
  return function getTheme() {
    // 换成一个局部常量就断开了对大对象的引用
    return hugeConfig.theme;
  };
}

const leakyGetTheme = createLeakyGetter();
console.log(`  调用闭包：${leakyGetTheme()}`);
console.log('  可达性检查（确定性）：');
console.log('    闭包函数还活着 → 它的作用域还活着 → hugeConfig 还活着。');
console.log('    这一点不依赖 GC：只要 leakyGetTheme 这个函数对象存在，');
console.log('    它捕获的词法环境就被保留，里面的大数组自然也保留。');
console.log('    （闭包的作用域是"按变量"保留的，不是"按字段"保留的。）');

console.log('');
console.log('好例子：先把要用的值取出来，别捕获整个大对象');
function createCleanGetter() {
  const hugeConfig = {
    items: new Array(5000).fill({ name: 'x' }),
    theme: 'dark',
  };
  // 关键：只把需要的那一个原始值取出来存进常量
  const theme = hugeConfig.theme;
  // 闭包只捕获 theme（一个字符串），不再引用 hugeConfig
  return function getTheme() {
    return theme;
  };
}

const cleanGetTheme = createCleanGetter();
console.log(`  调用闭包：${cleanGetTheme()}`);
console.log('  → 这个闭包只捕获了一个字符串常量，大对象在函数返回后就不可达了。');
console.log('    注意：这里没有"复制大对象"的额外开销，只是少捕获了一个变量而已。');

console.log('');
console.log('前端常见变体：');
console.log('  · 事件处理函数里捕获了整个组件实例（this / 组件对象）；');
console.log('  · 回调里捕获了 DOM 节点，但只需要它的 id；');
console.log('  · Promise.then 的回调长期挂着，捕获了一大堆已经用不到的数据。');

// ---------------------------------------------------------------------------
// 5. 模式四：缓存无上限
// ---------------------------------------------------------------------------

console.log('\n--- 5. 模式四：缓存无上限（Map 当缓存却永不清理） ---');

console.log('坏例子：用 Map 当缓存，key 空间无限且从不清理');

const unboundedCache = new Map();
function queryUnbounded(key) {
  if (unboundedCache.has(key)) return unboundedCache.get(key);
  const result = { key, data: `结果-${key}` };
  unboundedCache.set(key, result); // 只增不减
  return result;
}

// 模拟"每个不同用户都来查一次"
const CACHE_HITS = 5000; // 规模控制：5000 个不同 key
for (let i = 0; i < CACHE_HITS; i++) {
  queryUnbounded(`user-${i}`);
}
console.log(`  查询了 ${CACHE_HITS} 个不同的 key 之后，缓存 size = ${unboundedCache.size}`);
console.log('  可达性检查（确定性）：Map 是 GC 根可达的对象，它持有的每个 key/value');
console.log('  都是强引用 —— 只要 Map 还活着，这 5000 条记录就永远活着。');
console.log('  key 来自用户输入/用户 ID 时，key 空间是无限的，缓存就只增不减。');

console.log('');
console.log('好例子一：给缓存加容量上限（LRU 淘汰最久未使用的）');
const boundedCache = new Map();
const CAPACITY = 100;
function queryBounded(key) {
  if (boundedCache.has(key)) {
    const value = boundedCache.get(key);
    // 先删后插，把这条挪到 Map 的尾部（最近使用）
    boundedCache.delete(key);
    boundedCache.set(key, value);
    return value;
  }
  if (boundedCache.size >= CAPACITY) {
    // Map 的插入顺序里，第一个就是最久未使用的
    boundedCache.delete(boundedCache.keys().next().value);
  }
  const result = { key, data: `结果-${key}` };
  boundedCache.set(key, result);
  return result;
}

for (let i = 0; i < CACHE_HITS; i++) {
  queryBounded(`user-${i}`);
}
console.log(`  同样查询 ${CACHE_HITS} 个不同的 key，有上限的缓存 size = ${boundedCache.size}（上限 ${CAPACITY}）`);
console.log('  → 内存占用被钉死在容量上限上，不会随访问量无限增长。');

console.log('');
console.log('好例子二：key 是对象时，用 WeakMap（键是弱引用）');
console.log('  const meta = new WeakMap();');
console.log('  meta.set(domNode, { 私有数据 });');
console.log('  → domNode 被回收时，这条记录会自动消失，不需要手动清理。');
console.log('  注意：WeakMap【不可枚举】，没有 size，也不能遍历——');
console.log('        它只适合"给对象附加元数据"，不适合当需要统计的通用缓存。');

const weakMeta = new WeakMap();
const someNode = { id: 'node-1' };
weakMeta.set(someNode, { visitedAt: '刚刚' });
console.log(`  WeakMap 读取验证：${JSON.stringify(weakMeta.get(someNode))}`);
console.log(`  WeakMap 没有 size 属性：${weakMeta.size === undefined}`);

// ---------------------------------------------------------------------------
// 6. 模式五：分离的 DOM 节点（前端）
// ---------------------------------------------------------------------------

console.log('\n--- 6. 模式五：分离的 DOM 节点（Detached DOM） ---');

console.log('这里的 DOM 用普通对象模拟，因为 Node.js 里没有 document。');

function createFakeDomNode(tag, id) {
  return {
    tag,
    id,
    children: [],
    listeners: [],
    addEventListener(type, handler) {
      this.listeners.push({ type, handler });
    },
  };
}

// 模拟一个"文档树"和一个"JS 里保存的引用数组"
const detachedRefs = [];

console.log('坏例子：节点从页面上移除了，但 JS 变量还引用着它');

(function leakyDetach() {
  // 创建一个列表节点和它的子节点
  const container = createFakeDomNode('div', 'container');
  const child = createFakeDomNode('span', 'child');
  // 给它挂一个事件监听器，回调闭包捕获了这个节点
  child.addEventListener('click', () => child.id);
  container.children.push(child);

  // 模拟"把 container 从文档树里移除"：
  // 在真实浏览器里，container.parentNode.removeChild(container) 之后，
  // 这个子树就"脱离文档"了，但它并不会自动被回收。

  // 关键：JS 里还留着一份引用！
  detachedRefs.push(container);
})();

console.log(`  引用数组长度 = ${detachedRefs.length}`);
console.log('  可达性检查（确定性）：');
console.log(`    还能通过 detachedRefs[0].children[0].id 读到 = ${detachedRefs[0].children[0].id}`);
console.log(`    这个子节点上还挂着 ${detachedRefs[0].children[0].listeners.length} 个事件监听器`);
console.log('    → 整棵子树（含监听器闭包）都无法回收。');
console.log('    这就是前端内存泄漏里最臭名昭著的一种：Detached DOM tree。');
console.log('');
console.log('好例子：移除节点时同步解除 JS 引用');
detachedRefs.length = 0; // 清空数组 = 解除所有引用
console.log(`  清空引用数组后长度 = ${detachedRefs.length}`);
console.log('  → 没有任何引用路径能到达那棵子树了，它才真正变成"可回收"。');
console.log('');
console.log('排查技巧（前端）：在 DevTools 的 Memory 面板拍两次堆快照，');
console.log('  搜索 "Detached" 就能看到分离的 DOM 树，它还会显示"谁在引用它"——');
console.log('  也就是那条让你无法回收的引用链。');

// ---------------------------------------------------------------------------
// 7. GC 观察汇总与排查清单
// ---------------------------------------------------------------------------

console.log('\n--- 7. GC 观察汇总与排查清单 ---');

// 给 GC 最后一次机会（只是"有机会"，不保证会跑）
await giveGcAChance();

reportGcObservation(
  '图表组件的大数据对象',
  chartTrack.ref,
  '组件已清理，理论上应该被回收（但观察不到也正常）',
);
reportGcObservation(
  '演示用的若干个跟踪对象',
  // 这里没有强引用，理论上可回收
  track('临时对象').ref,
  '没有强引用，理论上应该被回收',
);

console.log('');
console.log('FinalizationRegistry 收到的回收通知：', finalizedLabels.length === 0 ? '（本次一条都没有）' : finalizedLabels);
console.log('再次强调：观察不到回收【不等于】有泄漏。');
console.log('  · GC 是惰性的，只有在需要时才会跑；');
console.log('  · 部分 Node 版本启用了保守栈扫描，栈上的残留指针会暂时"钉住"对象；');
console.log('  · 所以本示例把"可达性"作为确定性证据，把 GC 观察作为补充参考。');
console.log('  · 内存数值因环境而异，本示例刻意不打印任何具体内存字节数。');

console.log('');
console.log('内存泄漏排查清单：');
console.log('  1. 有没有给未声明的变量赋值？打开严格模式/用 ESM 让它在开发期就报错。');
console.log('  2. 所有 setInterval / setTimeout / requestAnimationFrame 都有对应的清理吗？');
console.log('  3. 所有 addEventListener 都有对应的 removeEventListener（或 AbortController）吗？');
console.log('  4. 订阅（EventEmitter / socket / 观察者）在销毁时都取消了吗？');
console.log('  5. 缓存有容量上限或 TTL 吗？key 空间是有限的吗？');
console.log('  6. 闭包是不是捕获了比实际需要大得多的对象？');
console.log('  7. 移除 DOM 节点时，JS 里保存的引用同步清空了吗？');
console.log('  8. 有没有用工具真正测量过？Heap Snapshot / Allocation Timeline 才是裁判。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
