/**
 * ============================================================================
 * 知识点：弱引用与 GC —— WeakMap / WeakSet / WeakRef / FinalizationRegistry
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/09_memory_leak_patterns.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    普通变量、对象属性、数组元素、Map 的键和值，都是【强引用】：
 *    只要引用还在，对象就不会被回收。
 *    ES6 之后新增了几种【弱引用】容器，它们"引用"对象但不阻止对象被回收：
 *    · WeakMap：键是弱引用，键对象没有其它引用时，整个键值对自动消失；
 *    · WeakSet：元素的弱引用集合，适合给对象打"标记"；
 *    · WeakRef：对单个对象的弱引用，用 deref() 取用，可能拿到 undefined；
 *    · FinalizationRegistry：对象被回收后收到一个通知，用于做清理（谨慎使用）。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 给对象附加元数据：缓存信息、访问时间、DOM 节点与组件实例的对应关系。
 *      如果用 Map 存，Map 会一直强引用着键对象，导致泄漏；
 *      换成 WeakMap，对象被回收时记录会自动消失，不需要手动清理。
 *    - 真正的私有数据：用 WeakMap 存实例的内部状态，
 *      外部拿到实例也读不到（比下划线约定更硬，比 #私有字段更早出现）。
 *    - 打标记：判断"这个对象是否已经处理过"，又不想因此让它长期驻留内存。
 *    - WeakRef：缓存大对象，希望内存紧张时它自己消失。
 *    - FinalizationRegistry：对象被回收时释放它占用的外部资源（如临时文件句柄）。
 *
 * 3. 核心语法要点
 *    - WeakMap 的键必须是【对象】（含函数）；原语做键会抛 TypeError。
 *    - WeakMap / WeakSet 都【不可枚举】：没有 size、没有 keys()/values()/
 *      forEach、不能 for...of、不能 JSON.stringify。
 *    - WeakRef 用 new WeakRef(obj) 创建，用 ref.deref() 取值；
 *      返回 undefined 说明对象已被回收。
 *    - FinalizationRegistry 用 register(target, heldValue) 注册，
 *      回调里拿到的是 heldValue（不是 target 本身！因为 target 已经没了）。
 *    - 这些弱引用容器都是【不可迭代】的，所以无法"遍历所有缓存项"。
 *
 * 4. 常见陷阱
 *    - 陷阱一：用弱引用做缓存淘汰的【唯一依据】。
 *      GC 什么时候跑完全由引擎决定，可能很久不跑 —— 于是"该淘汰的没淘汰"；
 *      也可能在你没准备好的时候跑了 —— 于是"刚要用的没了"。
 *      需要确定性淘汰就用 LRU/TTL（见 03_memoization.js），弱引用只能当补充。
 *    - 陷阱二：WeakRef 不可用于需要确定性行为的场景。
 *      "取出来判断是否存在"这件事本身就不可靠：同一个对象，
 *      这一次 deref() 拿到、下一次可能就没了。
 *    - 陷阱三：FinalizationRegistry 的回调时机不确定，可能在程序快退出时才跑，
 *      也可能永远不跑。绝不能把"必须执行的清理逻辑"只放在里面。
 *    - 陷阱四：以为 WeakMap 的"值"也是弱引用。值仍然是强引用！
 *      如果值又反过来引用了键，就形成了环，依然回收不掉。
 *    - 陷阱五：为了"优化内存"到处用 WeakMap，结果代码变得难以调试
 *      （看不到内容、无法遍历、出问题无从查起）。大多数缓存用普通 Map +
 *      容量上限就够了。
 *
 * 【关于本示例的 GC 观察（必读）】
 *    本示例【不强制触发 GC】（不使用 --expose-gc），只用 setTimeout 给它机会。
 *    GC 时机完全由引擎决定：观察不到回收【不等于】有泄漏或代码有问题。
 *    特别地，部分 Node 版本启用了保守栈扫描，栈上的残留指针会暂时"钉住"对象，
 *    使得 WeakRef.deref() 长时间返回对象 —— 这也是正常的引擎行为。
 *    因此本示例把【确定性的语义演示】作为主体，把 GC 观察作为补充参考，
 *    并且不打印任何具体的内存字节数（内存数值因环境而异）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/10_weakref_and_gc.js
 *
 * 【预期输出】
 *   打印 6 个小节：强引用与弱引用的区别、WeakMap 附加元数据与私有数据、
 *   WeakSet 打标记、WeakRef 与 FinalizationRegistry 的谨慎使用、
 *   GC 观察（并说明结果可能因环境而异）、以及使用禁忌与结论。
 * ============================================================================
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 1. 强引用与弱引用的区别
// ---------------------------------------------------------------------------

console.log('--- 1. 强引用 vs 弱引用 ---');

console.log('强引用：变量、对象属性、数组元素、Map 的键和值');
console.log('  → 只要引用还在，对象就一定不会被回收。');
console.log('');
console.log('弱引用：WeakMap 的键、WeakSet 的元素、WeakRef 的目标');
console.log('  → "我看着它，但不拦着它被回收"：');
console.log('    除了这个弱引用之外没有任何强引用时，对象照样会被回收，');
console.log('    回收之后，弱引用容器里的相关记录会自动消失。');
console.log('');
console.log('一个直观的类比：');
console.log('  强引用 = 你把文件放进了自己的文件夹（你删掉它之前，它一直在）');
console.log('  弱引用 = 你在便签上记了"某个文件在哪"（文件被别人删了，便签也就没意义了）');

// ---------------------------------------------------------------------------
// 2. WeakMap：给对象附加元数据、实现真正的私有数据
// ---------------------------------------------------------------------------

console.log('\n--- 2. WeakMap：附加元数据与私有数据 ---');

// 2.1 用 Map 存元数据的隐患
console.log('用 Map 存"对象 → 元数据"的隐患：');
console.log('  const meta = new Map();');
console.log('  meta.set(domNode, { visitedAt: Date.now() });');
console.log('  → Map 强引用 key！即使 domNode 从页面上移除了，只要 Map 还活着，');
console.log('    domNode 就永远无法回收 —— 这正是 09 示例里的泄漏模式。');
console.log('');
console.log('换成 WeakMap：');
console.log('  const meta = new WeakMap();');
console.log('  meta.set(domNode, { visitedAt: Date.now() });');
console.log('  → 键是弱引用。domNode 没有其它引用时会被回收，');
console.log('    对应的这条记录也会自动消失，不需要任何手动清理。');

// 2.2 WeakMap 的确定性语义演示（这些行为不依赖 GC）
const meta = new WeakMap();
const nodeA = { id: 'A' };
const nodeB = { id: 'B' };

meta.set(nodeA, { visitedAt: '10:00', count: 3 });
meta.set(nodeB, { visitedAt: '10:05', count: 1 });

console.log('');
console.log('WeakMap 的确定性行为（不依赖 GC）：');
console.log(`  meta.has(nodeA)              = ${meta.has(nodeA)}`);
console.log(`  meta.get(nodeA)              = ${JSON.stringify(meta.get(nodeA))}`);
console.log(`  用另一个内容相同的对象查询   = ${meta.get({ id: 'A' })}（引用不同就是不同的键）`);
console.log(`  meta.delete(nodeA) 返回      = ${meta.delete(nodeA)}`);
console.log(`  删除后 meta.has(nodeA)       = ${meta.has(nodeA)}`);
console.log('  注意：WeakMap 无法枚举，所以下面这些都不存在：');
console.log(`    meta.size        = ${meta.size}（undefined，没有 size 属性）`);
console.log(`    meta.keys        = ${typeof meta.keys}（undefined，没有 keys 方法）`);
console.log(`    可迭代吗          = ${typeof meta[Symbol.iterator]}（undefined，不能 for...of）`);

// 2.3 键必须是对象
console.log('');
console.log('WeakMap 的键必须是对象（原语不行）：');
try {
  meta.set('字符串键', 1);
  console.log('  这一行不会执行');
} catch (err) {
  console.log(`  捕获到 ${err.constructor.name}：${err.message}`);
}
console.log('  → 原因：原语值没有"生命周期"可言，无法被弱引用追踪。');
console.log(`  函数也可以当键：${(() => {
  const fn = () => {};
  meta.set(fn, 'ok');
  return meta.get(fn);
})()}`);

// 2.4 用 WeakMap 实现真正的私有数据
console.log('');
console.log('实战：用 WeakMap 给实例存私有数据');

// 模块作用域里的 WeakMap：外部代码拿不到这个变量
const walletData = new WeakMap();

class Wallet {
  constructor(owner) {
    // 内部状态不挂在实例上，而是以实例为键存进 WeakMap
    walletData.set(this, { owner, balance: 0, history: [] });
  }

  deposit(amount) {
    const data = walletData.get(this);
    data.balance += amount;
    data.history.push(`+${amount}`);
    return data.balance;
  }

  withdraw(amount) {
    const data = walletData.get(this);
    if (amount > data.balance) throw new Error('余额不足');
    data.balance -= amount;
    data.history.push(`-${amount}`);
    return data.balance;
  }

  get owner() {
    return walletData.get(this).owner;
  }

  get balance() {
    return walletData.get(this).balance;
  }

  // 只有方法能读到完整内部状态
  statement() {
    return walletData.get(this).history.join(', ');
  }
}

const wallet = new Wallet('小明');
wallet.deposit(100);
wallet.deposit(50);
wallet.withdraw(30);

console.log(`  wallet.owner   = ${wallet.owner}`);
console.log(`  wallet.balance = ${wallet.balance}`);
console.log(`  wallet.statement() = ${wallet.statement()}`);
console.log(`  实例自身的可枚举属性 = ${JSON.stringify(Object.keys(wallet))}（空的！）`);
console.log(`  wallet.balance 不是数据属性，而是 getter：${JSON.stringify(Object.getOwnPropertyDescriptor(Wallet.prototype, 'balance').get ? '是 getter' : '否')}`);
console.log('  → 外部代码即使拿到 wallet，也读不到 _balance 这样的字段，');
console.log('    因为根本没有这个字段 —— 数据在模块作用域的 WeakMap 里。');

// 2.5 用 WeakMap 给外部对象附加元数据（经典用法：给 DOM 节点绑定组件实例）
console.log('');
console.log('另一个经典用法：给 DOM 节点绑定组件实例');
const componentOf = new WeakMap();
const fakeDomNode = { tagName: 'DIV', id: 'app' };
componentOf.set(fakeDomNode, { name: 'AppComponent', mounted: true });
console.log(`  componentOf.get(node) = ${JSON.stringify(componentOf.get(fakeDomNode))}`);
console.log('  → 节点被移除并被回收时，这条绑定关系自动消失，不会拖住组件实例。');

// ---------------------------------------------------------------------------
// 3. WeakSet：给对象打标记
// ---------------------------------------------------------------------------

console.log('\n--- 3. WeakSet：给对象打标记 ---');

console.log('典型场景：判断"这个对象是否已经处理过"，但不想因此让它一直活着。');
console.log('');
console.log('  const processed = new WeakSet();');
console.log('  function handleOnce(obj) {');
console.log('    if (processed.has(obj)) return;   // 处理过了，跳过');
console.log('    processed.add(obj);');
console.log('    // ... 真正的处理逻辑');
console.log('  }');

const processed = new WeakSet();
const tasks = [{ id: 1 }, { id: 2 }, { id: 3 }];
const handled = [];

function handleOnce(obj) {
  if (processed.has(obj)) {
    handled.push(`跳过 ${obj.id}`);
    return;
  }
  processed.add(obj);
  handled.push(`处理 ${obj.id}`);
}

// 第一次遍历：都会处理
for (const t of tasks) handleOnce(t);
// 第二次遍历：都会被跳过
for (const t of tasks) handleOnce(t);

console.log('');
console.log(`  两轮处理的记录：${handled.join(' | ')}`);
console.log(`  processed.has(tasks[0]) = ${processed.has(tasks[0])}`);
console.log('  与 Set 的区别：');
console.log('    · Set 会强引用这 3 个对象，它们会一直活着；');
console.log('    · WeakSet 不阻止回收，对象没别的引用时标记会随之消失。');
console.log('  代价：WeakSet 同样不可枚举，没有 size，不能遍历。');

// 对比：用 Set 的话，对象的生命周期被延长了
const strongProcessed = new Set(tasks);
console.log(`  对照：用 Set 的 strongProcessed.size = ${strongProcessed.size}（可以枚举，但会强引用）`);

// ---------------------------------------------------------------------------
// 4. WeakRef 与 FinalizationRegistry：谨慎使用
// ---------------------------------------------------------------------------

console.log('\n--- 4. WeakRef 与 FinalizationRegistry ---');

console.log('WeakRef：对单个对象的弱引用');
console.log('  const ref = new WeakRef(bigObject);');
console.log('  ref.deref();   // 返回对象，或返回 undefined（说明已被回收）');
console.log('');
console.log('FinalizationRegistry：对象被回收后收到通知');
console.log('  const registry = new FinalizationRegistry((heldValue) => {');
console.log('    // 这里拿到的 heldValue 是注册时传的"附带值"，不是对象本身！');
console.log('    // 因为对象已经没了，回调里不可能再拿到它。');
console.log('  });');
console.log('  registry.register(target, heldValue);');

// 4.1 WeakRef 的确定性行为：deref 的两种可能
const strongHolder = { name: '有强引用的对象' };
const refAlive = new WeakRef(strongHolder);
console.log('');
console.log('确定性演示：只要还有强引用，deref() 一定拿得到对象');
console.log(`  refAlive.deref()?.name = ${refAlive.deref()?.name}`);
console.log('  → 因为 strongHolder 这个变量还在（强引用），对象必然可达。');

// 4.2 观察回收（不确定）
const finalizedLog = [];
const registry = new FinalizationRegistry((label) => {
  finalizedLog.push(label);
});

// 在一个函数里创建对象并只保留 WeakRef，函数返回后就没有强引用了
function makeWeakTarget(label) {
  const target = { label, payload: new Array(200).fill(label) };
  const ref = new WeakRef(target);
  registry.register(target, label);
  return ref; // 只返回弱引用
}

const refMaybe = makeWeakTarget('临时对象');

console.log('');
console.log('不确定演示：下面的结果【因环境而异】，两种都是正常的');
console.log(`  创建后立即观察：${refMaybe.deref() ? '仍可达' : '已被回收'}`);

// 制造一点分配压力，给 GC 一个机会（不强制、不保证）
for (let round = 0; round < 2; round++) {
  let sink = 0;
  for (let i = 0; i < 150_000; i++) {
    const tmp = { i };
    sink += tmp.i;
  }
  if (sink < 0) console.log(sink); // 防止循环被优化掉
  await sleep(20);
}

const afterRef = refMaybe.deref();
console.log(`  分配压力 + 等待后观察：${afterRef ? '仍可达' : '已被回收（deref() 返回 undefined）'}`);
console.log(`  FinalizationRegistry 收到的通知：${finalizedLog.length === 0 ? '（暂无）' : JSON.stringify(finalizedLog)}`);
console.log('');
console.log('  如何解读这两种结果：');
if (afterRef === undefined) {
  console.log('    · 本次真的被回收了 —— 说明对象确实没有强引用，符合预期。');
} else {
  console.log('    · 本次没被回收 —— 这【不代表】有泄漏，而是：');
  console.log('      1) GC 是惰性的，只在引擎认为需要时才跑；');
  console.log('      2) 部分 Node 版本启用了保守栈扫描，栈上残留的指针会把对象"钉住"；');
  console.log('      3) 观察不到回收 ≠ 代码有问题，两者不能划等号。');
}
console.log('  · 无论哪种结果，本示例都把"可达性"当作确定性证据，把 GC 观察当参考。');

// 4.3 用 WeakRef 做缓存的正确姿势（必须带兜底）
console.log('');
console.log('WeakRef 做缓存时，必须把它当成"可能随时失效"来写：');

const bigObjectRefs = new Map(); // key → WeakRef
function getCached(key, factory) {
  const ref = bigObjectRefs.get(key);
  const cached = ref?.deref();
  if (cached !== undefined) {
    return { value: cached, fromCache: true };
  }
  // 关键：缓存失效（或被回收）时，必须能重新构造出来
  const value = factory();
  bigObjectRefs.set(key, new WeakRef(value));
  return { value, fromCache: false };
}

const first = getCached('config', () => ({ theme: 'dark', version: 1 }));
const second = getCached('config', () => ({ theme: 'dark', version: 2 }));
console.log(`  第一次：fromCache=${first.fromCache}，version=${first.value.version}`);
console.log(`  第二次：fromCache=${second.fromCache}，version=${second.value.version}`);
console.log('  → 注意 second.value 和 first.value 是同一个对象（因为 first 还持有强引用）。');
console.log('    如果 first 被丢弃了，第二次就可能重新构造 —— 这正是"不确定"的来源。');
console.log('  结论：业务逻辑绝不能依赖"缓存一定命中"或"缓存一定失效"。');

// ---------------------------------------------------------------------------
// 5. 使用禁忌
// ---------------------------------------------------------------------------

console.log('\n--- 5. 使用禁忌 ---');

console.log('禁忌一：不能用弱引用作为缓存淘汰的唯一依据');
console.log('  · GC 何时运行不可控，可能长时间不回收 → 缓存该淘汰的没淘汰，内存照样涨；');
console.log('  · 也可能在你正好要用的时候回收了 → 数据"凭空消失"，出现偶发 bug。');
console.log('  · 需要确定性的淘汰策略时，用 LRU / TTL（参考 03_memoization.js）。');
console.log('');
console.log('禁忌二：WeakRef 不可用于需要确定性行为的场景');
console.log('  · 不要写 "if (ref.deref()) { ... } else { ... }" 来驱动业务分支；');
console.log('  · 不要用 WeakRef 实现"单例"或"对象是否还存在"的判断；');
console.log('  · 规范明确规定：GC 可以在任意时刻回收，甚至一个对象都不回收。');
console.log('');
console.log('禁忌三：不能把必须执行的清理逻辑只放在 FinalizationRegistry 里');
console.log('  · 回调可能在程序即将退出时才跑，也可能永远不跑；');
console.log('  · 它只适合"锦上添花"的清理（比如顺手释放一个可选的临时资源）；');
console.log('  · 必须执行的清理要显式调用（dispose() / close() / clearInterval）。');
console.log('');
console.log('禁忌四：WeakMap 的值是强引用');
console.log('  · weakMap.set(key, value) 只弱引用 key，value 是强引用的；');
console.log('  · 如果 value 又引用了 key（形成引用环），一样回收不掉；');
console.log('  · 值最好是不可变的小数据（数字、字符串、小对象）。');
console.log('');
console.log('禁忌五：不要为了"优化内存"到处用弱引用');
console.log('  · 弱引用容器不可枚举、看不到内容，调试成本高；');
console.log('  · 大多数缓存用"普通 Map + 容量上限"就够了，简单可控；');
console.log('  · WeakMap 的最佳场景很窄：给对象附加元数据、存私有状态。');

// 演示"值引用了键"造成的环
console.log('');
console.log('演示"值是强引用，且值引用了键"的情况：');
const cyclicWeak = new WeakMap();
const keyObj = { id: 'key' };
const valueObj = { owner: keyObj }; // 值引用了键
cyclicWeak.set(keyObj, valueObj);
console.log(`  cyclicWeak.get(keyObj).owner === keyObj → ${cyclicWeak.get(keyObj).owner === keyObj}`);
console.log('  → 这条记录里：键是弱引用，但值是强引用，而值又强引用了键。');
console.log('    从"值"往回走能到达"键"，于是键实际上是可达的 —— 回收不掉。');
console.log('    所以 WeakMap 的自动清理只在"值不反向引用键"时才能生效。');

// ---------------------------------------------------------------------------
// 6. 结论
// ---------------------------------------------------------------------------

console.log('\n--- 6. 结论 ---');

console.log('该用的时候：');
console.log('  · WeakMap：给对象附加元数据、实现真正的私有数据（DOM 节点 ↔ 组件实例）；');
console.log('  · WeakSet：给对象打"已处理/已访问"标记，又不想延长它的生命周期；');
console.log('  · WeakRef：想缓存大对象又允许它被回收（务必带重新构造的兜底逻辑）；');
console.log('  · FinalizationRegistry：可选的、非必须的清理通知。');
console.log('');
console.log('不该用的时候：');
console.log('  · 需要确定性淘汰 → 用 LRU / TTL；');
console.log('  · 需要确定性行为 → 用普通引用 + 显式的生命周期管理；');
console.log('  · 需要遍历/统计缓存 → 用普通 Map。');
console.log('');
console.log('一句话记住：弱引用解决的是"引用不该延长对象寿命"的问题，');
console.log('            它不是缓存策略，更不是"内存优化的万能药"。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
