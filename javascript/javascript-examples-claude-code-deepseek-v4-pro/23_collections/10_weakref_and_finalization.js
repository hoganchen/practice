/**
 * ============================================================================
 * 知识点：WeakRef 与 FinalizationRegistry —— 弱引用与回收回调（含特性检测）
 * ============================================================================
 *
 * 【所属分类】23_collections —— 集合类型
 * 【难度等级】高级
 * 【前置知识】23_collections/05_weakmap.js、06_weakset.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES2021 引入了两个"与垃圾回收打交道"的 API：
 *      (1) WeakRef：一个**不会阻止对象被回收**的引用。通过 ref.deref() 取值：
 *          对象还活着就返回它，已被回收就返回 undefined。
 *      (2) FinalizationRegistry：注册"某个对象被回收之后"要执行的回调，
 *          常被用来做资源清理或调试计数。
 *    它们与 WeakMap/WeakSet 的区别在于：WeakMap 的弱引用是隐式的（键），
 *    而 WeakRef 让"弱引用"本身成为一个可以传来传去的值。
 *
 * 2. 为什么需要
 *    有些对象的生命周期无法用"键值绑定"表达。例如：
 *      - 一个可选的缓存索引，希望对象被回收时自动从索引里消失；
 *      - 大对象池，希望知道哪些对象已经不再被使用；
 *      - 调试内存泄漏时观察对象是否被回收。
 *    在这些场景下，用一个普通变量或数组持有对象会造成泄漏，WeakRef 才能表达。
 *
 * 3. 核心语法要点
 *    (1) new WeakRef(target)  —— target 必须是对象；原始值会抛 TypeError。
 *    (2) ref.deref()          —— 返回目标对象或 undefined，是**唯一**的读取方式。
 *        WeakRef 本身没有其他属性（连 target 都没有）。
 *    (3) WeakRef 对象可以作 WeakMap/WeakSet 的键（它自己也是对象）。
 *    (4) new FinalizationRegistry(callback) —— callback 接收注册时传入的
 *        "持有值"（heldValue）；登记用 registry.register(target, heldValue)，
 *        取消登记用 registry.unregister(token)（token 是 register 的返回值）。
 *    (5) heldValue 不能是 target 本身（否则会形成强引用，永远不回收）。
 *        它可以是原始值，或另一个独立对象。
 *    (6) 🚨 **最重要的一条**：回收时机完全由引擎决定，规范不作任何保证。
 *        回调可能在程序结束时都没执行，也可能在任意时刻以任意顺序执行。
 *        因此：**绝不能把业务逻辑建立在回调一定执行的前提上**。
 *    (7) 旧环境（Node < 14.6、老浏览器）没有这两个 API，必须特性检测。
 *
 * 4. 常见陷阱
 *    (1) 用 WeakRef 去"观察"对象是否被回收来做业务判断 —— 时机不可预测。
 *    (2) 把 heldValue 写成 target 本身，导致对象永远不被回收（WeakRef 失去意义）。
 *    (3) 在回调里访问已经不确定的状态（比如依赖某个全局变量还在）。
 *    (4) 认为 deref() 返回 undefined 就一定表示"对象被回收了" ——
 *        也可能是你从未赋值过（其实构造时必须有对象，所以这一点在 WeakRef 上不成立，
 *        但在 WeakMap.get 的语境里容易混淆）。
 *    (5) 在 FinalizationRegistry 回调里做耗时操作：回调运行时机不受控，
 *        可能拖慢整个进程。
 *    (6) 忘记 try/catch 或特性检测，在旧 Node 上直接 ReferenceError。
 *    (7) 依赖 WeakRef 做缓存：目标被回收后缓存会"凭空消失"，
 *        应当是"可选加速"，而不是"必须命中"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 23_collections/10_weakref_and_finalization.js
 *
 * 【预期输出】
 *   分 6 个小节：先做特性检测，再演示 WeakRef 的取值语义、
 *   FinalizationRegistry 的登记/取消登记、强引用保持存活的对照实验，
 *   并以"为什么不能依赖回收时机"收尾。
 *   脚本不依赖 GC 是否真的发生，任何环境都能以退出码 0 结束。
 * ============================================================================
 */

console.log('--- 1. 特性检测：当前环境是否支持 WeakRef / FinalizationRegistry ---');

const hasWeakRef = typeof globalThis.WeakRef === 'function';
const hasFinalizationRegistry = typeof globalThis.FinalizationRegistry === 'function';
console.log('Node 版本                     =', process.version);
console.log('typeof WeakRef                =', typeof globalThis.WeakRef);
console.log('typeof FinalizationRegistry   =', typeof globalThis.FinalizationRegistry);
console.log('支持 WeakRef                  =', hasWeakRef);
console.log('支持 FinalizationRegistry     =', hasFinalizationRegistry);
if (!hasWeakRef) {
  console.log('提示：Node 14.6 以下不支持，本示例会自动走"说明 + 等价写法"分支，不会报错退出。');
}

console.log('\n--- 2. WeakRef 的基本语义 ---');

if (hasWeakRef) {
  // 目标必须是对象；原始值会抛 TypeError。
  const target = { name: '被弱引用的对象' };
  const ref = new WeakRef(target);
  console.log('创建成功，ref 的类型 =', Object.prototype.toString.call(ref));
  // deref() 是唯一的读取方式：目标还活着就返回它。
  console.log('deref() 是否等于原对象：', ref.deref() === target);
  console.log('deref().name =', ref.deref().name);

  // WeakRef 上没有暴露 target 属性，无法绕过 deref。
  console.log('ref.target        =', ref.target, '（undefined，没有这个属性）');
  console.log('Object.keys(ref)  =', JSON.stringify(Object.keys(ref)), '（空，内部槽不可枚举）');

  // 原始值不能作为被引用对象。
  for (const primitive of ['字符串', 42, null, undefined]) {
    try {
      new WeakRef(primitive);
      console.log('  竟然接受了：', String(primitive));
    } catch (err) {
      console.log(`  ❌ new WeakRef(${String(primitive)}) -> ${err.constructor.name}: ${err.message}`);
    }
  }
} else {
  console.log('当前环境没有 WeakRef，等价语义说明：');
  console.log('  const ref = new WeakRef(obj);  // 不阻止 obj 被回收');
  console.log('  ref.deref()                    // 活着返回 obj，已回收返回 undefined');
  console.log('  ❌ 原始值不能作为目标（会抛 TypeError）');
  console.log('  ❌ WeakRef 上没有 target 属性，只能通过 deref() 读取');
}

console.log('\n--- 3. 弱引用 vs 强引用：让对象"可被回收"的关键 ---');

if (hasWeakRef) {
  // 用一个普通变量持有强引用，对象就一定活着。
  let strongHolder = { id: 'strong' };
  const strongRef = new WeakRef(strongHolder);
  console.log('强引用场景：变量还在指向对象');
  console.log('  此时 deref() 一定返回对象：', strongRef.deref() !== undefined);
  console.log('  因为 strongHolder 这个变量就是一条强引用链。');

  // 断开强引用：此后对象"可被回收"，但**不代表立刻被回收**。
  strongHolder = null;
  const afterDrop = strongRef.deref();
  console.log('把变量置为 null 之后：');
  console.log('  deref() =', afterDrop === undefined ? 'undefined（已被回收）' : '仍然返回对象（还没被回收）');
  console.log('  ⚠️ 上面两种结果都是"正确的" —— 回收时机由引擎决定，');
  console.log('     本示例不假设哪种结果，所以输出可能因运行环境/时刻不同而不同。');
  console.log('  ✅ 可以确定的是：一旦回收发生，deref() 必然返回 undefined。');

  // 把弱引用存进数组也不会阻止回收（数组里存的是 WeakRef，不是目标对象）。
  const refList = [new WeakRef({ tag: 'A' }), new WeakRef({ tag: 'B' })];
  console.log('\n把 WeakRef 放进数组：数组长度 =', refList.length, '（数组持有的是 WeakRef，不是目标对象）');
  console.log('  逐个 deref()：', refList.map((r) => (r.deref() === undefined ? 'undefined' : r.deref().tag)).join(' , '));
  console.log('  ⚠️ 结果同样取决于 GC 是否已经回收了这两个临时对象，不做断言。');
} else {
  console.log('（无 WeakRef 环境）核心结论：');
  console.log('  普通变量/数组/Map 对对象的引用都是**强引用**，会阻止回收；');
  console.log('  WeakRef、WeakMap 的键、WeakSet 的元素是**弱引用**，不阻止回收。');
  console.log('  断开所有强引用后对象才"可被回收"，注意：可被回收 ≠ 立刻回收。');
}

console.log('\n--- 4. FinalizationRegistry：对象被回收后收到通知 ---');

if (hasFinalizationRegistry) {
  // 回调接收的是 register 时传入的 heldValue（不能是目标对象本身）。
  const released = [];
  const registry = new FinalizationRegistry((heldValue) => {
    // ⚠️ 这个回调的触发时机完全不受控，所以这里只做最轻量的记录。
    released.push(heldValue);
  });

  // 注册：target 是待观察对象，heldValue 是回调参数。
  (function registerOne() {
    const temp = { id: 'temp-1' };
    registry.register(temp, 'temp-1 已被回收');
    console.log('已注册一个临时对象，heldValue =', 'temp-1 已被回收');
    // 函数返回后，temp 就没有强引用了，理论上可被回收。
  })();

  console.log('回调是否已经触发：', released.length > 0 ? '是' : '否（很可能还没被回收，这是正常的）');
  console.log('注意：本示例**不会等待** GC —— 等待在真实程序里是不可靠的，');
  console.log('      而且 Node 在没有压力时可能很长时间不触发 GC。');

  // unregister：取消登记需要一个 token。
  const target2 = { id: 'temp-2' };
  const token = {};
  registry.register(target2, 'temp-2 已被回收', token);
  console.log('\n注册 temp-2 并拿到 token');
  registry.unregister(token);
  console.log('调用 unregister(token) 后，即便 temp-2 被回收，回调也不会执行。');
  console.log('（unregister 无返回值，也不报错，是幂等的）');
} else {
  console.log('当前环境没有 FinalizationRegistry，等价语义说明：');
  console.log('  const registry = new FinalizationRegistry((heldValue) => { ... });');
  console.log("  registry.register(obj, '任意值作为 heldValue');");
  console.log('  registry.unregister(token);   // token 来自 register 的返回值');
  console.log('  ❌ heldValue 不能是 obj 本身（会形成强引用，永远不回收）');
  console.log('  🚨 回调触发时机不可预测，不能作为业务逻辑的前提。');
}

console.log('\n--- 5. 为什么"不能依赖回收时机"—— 规范到底说了什么 ---');

const timingNotes = [
  '规范不保证 GC 何时运行，也不保证它会运行。',
  '规范不保证一次 GC 会回收哪些对象，也不保证回调的执行顺序。',
  '规范允许引擎在程序运行期间**完全不**触发回调（直到进程结束）。',
  'Node 的 V8 在没有内存压力时可能长时间不做 full GC。',
  '因此：用 WeakRef/FinalizationRegistry 做的清理只能是"尽力而为"的补充；',
  '真正的资源释放必须靠显式的 close()/dispose()/try...finally。',
];
for (const note of timingNotes) console.log('  •', note);

// 反面示例：把业务逻辑建立在回调之上（这里只演示写法，不依赖它成功）。
console.log('\n❌ 反面示例（不要这样写）：');
console.log('   const registry = new FinalizationRegistry(() => { db.close(); });');
console.log('   —— 如果回调不执行（很可能），数据库连接就永远不关，程序无法正常退出。');
console.log('✅ 正确做法：');
console.log('   try { ... } finally { db.close(); }   // 显式关闭，回调只当作"兜底告警"');

console.log('\n--- 6. WeakRef / WeakMap / 强引用 三者对比 ---');

const compare = [
  ['强引用（普通变量、数组、Map）', '阻止回收', '对象还活着，一定能拿到'],
  ['WeakMap / WeakSet', '不阻止回收', '不可枚举，只能在"键还在"时查到'],
  ['WeakRef', '不阻止回收', 'deref() 可能随时返回 undefined'],
  ['FinalizationRegistry', '不阻止回收', '回调时机完全不可控'],
];
console.log('  ' + '方式'.padEnd(32) + '是否阻止回收'.padEnd(16) + '读取结果');
console.log('  ' + '-'.repeat(76));
for (const [way, blocks, read] of compare) {
  console.log('  ' + way.padEnd(30) + blocks.padEnd(14) + read);
}

console.log('\n--- 7. 实用建议 ---');
console.log('1) 95% 的场景用不到 WeakRef/FinalizationRegistry —— 优先考虑 WeakMap/WeakSet。');
console.log('2) 缓存就用 LRU + 容量上限（见 09_map_practical.js），比"等 GC 通知"可靠得多。');
console.log('3) 真要观察回收，只在**调试/诊断**代码里用，不要进入业务路径。');
console.log('4) 使用前必须特性检测，并为不支持的环境准备降级路径。');
console.log('5) 需要确定性析构时，用显式 API：Symbol.dispose / using 声明（ES2025）');
console.log('   或手写 try...finally，而不是依赖 GC。');
console.log('\n本节结束。');
