/**
 * ============================================================================
 * 知识点：WeakMap —— 只收对象当键、不可遍历、对垃圾回收友好
 * ============================================================================
 *
 * 【所属分类】23_collections —— 集合类型
 * 【难度等级】进阶
 * 【前置知识】23_collections/01_map_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    WeakMap 是"弱引用"版的 Map。它和 Map 的差别只有三条，但每一条都很关键：
 *      (1) 键**只能是对象**（含函数、数组、Symbol 之外的引用类型）；
 *      (2) **不可枚举**：没有 size、没有 keys/values/entries、不能 for...of；
 *      (3) 键是**弱引用**：如果键对象在程序里没有别的引用了，
 *          这条键值对会被垃圾回收器自动清掉，不会造成内存泄漏。
 *    API 只剩 4 个方法：set / get / has / delete。没有 clear，
 *    因为要"清空"就意味着要枚举，而它不可枚举。
 *
 * 2. 为什么需要
 *    当一个 Map 用对象做键时，Map 会**强引用**那个键：只要 Map 活着，
 *    键对象就永远不会被回收。典型问题场景：
 *      - 给 DOM 节点挂元数据，节点被移除后数据还占着内存；
 *      - 给对象做缓存，对象不用了缓存却永远留着；
 *      - 用对象存"私有数据"，又不想在对象上留可被遍历的属性。
 *    WeakMap 让"数据随对象一起消失"，这正是它存在的唯一理由。
 *
 * 3. 核心语法要点
 *    (1) new WeakMap()  /  new WeakMap([[obj1, v1], [obj2, v2]])  （初始化数组里键必须是对象）
 *    (2) wm.set(obj, value) 返回 WeakMap 本身，可链式
 *    (3) wm.get(obj)        键不存在返回 undefined
 *    (4) wm.has(obj)        判断是否存在
 *    (5) wm.delete(obj)     返回布尔值
 *    (6) 用非对象作键会抛 TypeError（不像 Map 会接受）
 *    (7) Symbol 作键：ES2023 起，**未在全局注册表登记的 Symbol**（Symbol('x')）
 *        可以作为 WeakMap 键；而 Symbol.for('x') 登记在全局注册表里、
 *        生命周期与程序相同，因此被视作"永久可达"，不能作键（会抛 TypeError）。
 *
 * 4. 常见陷阱
 *    (1) 试图遍历 WeakMap 或读 wm.size：全是 undefined 或抛错。
 *    (2) 用原始值作键：立即 TypeError。
 *    (3) 误以为"值"也是弱引用：**只有键是弱引用**，值仍是强引用。
 *        如果值反向引用了键，反而会造成泄漏。
 *    (4) 误以为可以观测到"被回收"：回收时机不可预测，不能写依赖它的业务逻辑。
 *    (5) 以为它能防内存泄漏就滥用：绝大多数场景 Map 更合适，
 *        只有"生命周期绑定在键对象上"时才用 WeakMap。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 23_collections/05_weakmap.js
 *
 * 【预期输出】
 *   分 7 个小节，演示基本 API、不可枚举、只能对象作键、键的弱引用语义、
 *   私有数据与缓存的经典用法、以及与 Map 的对照。输出固定，不依赖 GC 时机。
 * ============================================================================
 */

console.log('--- 1. WeakMap 的基本 API ---');

const wm = new WeakMap();
const keyObj = { name: '键对象' };

// set 返回 WeakMap 本身，可链式。
const chained = wm.set(keyObj, '第一个值');
console.log('set 返回的是 WeakMap 本身吗：', chained === wm);

wm.set({ name: '另一个键' }, '第二个值');
console.log("has(keyObj)      =", wm.has(keyObj));
console.log("get(keyObj)      =", wm.get(keyObj));
console.log("get(另一个对象)   =", wm.get({ name: '键对象' }), '（undefined，不是同一个引用）');
console.log("delete(keyObj)   =", wm.delete(keyObj));
console.log("再 has(keyObj)   =", wm.has(keyObj));
console.log('API 只有这四个方法，加上构造函数共 5 个可用的成员。');

console.log('\n--- 2. 不可枚举：没有 size，不能遍历 ---');
console.log('typeof WeakMap.prototype.keys   =', typeof WeakMap.prototype.keys, '（不存在）');
console.log('typeof WeakMap.prototype.values =', typeof WeakMap.prototype.values, '（不存在）');
console.log('typeof WeakMap.prototype.entries=', typeof WeakMap.prototype.entries, '（不存在）');
console.log('typeof WeakMap.prototype.forEach=', typeof WeakMap.prototype.forEach, '（不存在）');
console.log('typeof WeakMap.prototype.clear  =', typeof WeakMap.prototype.clear, '（不存在）');
console.log('"size" in new WeakMap()         =', 'size' in new WeakMap(), '（false，没有 size 属性）');
console.log("Object.keys(new WeakMap())      =", JSON.stringify(Object.keys(new WeakMap())), '（空数组）');

// 尝试遍历会抛错 —— 演示时必须 try/catch。
try {
  // @ts-expect-error 故意演示
  for (const item of new WeakMap()) { void item; }
} catch (err) {
  console.log('❌ 遍历 WeakMap 抛错 ->', err.constructor.name + ':', err.message);
}

console.log('\n--- 3. 只能对象作键：原始值会抛 TypeError ---');

const typeErrMap = new WeakMap();
const invalidKeys = ['字符串', 123, true, null, undefined, Symbol.for('注册的 Symbol')];
for (const k of invalidKeys) {
  try {
    typeErrMap.set(k, 'x');
    console.log('  竟然接受了：', String(k));
  } catch (err) {
    console.log(`  ❌ set(${typeof k === 'symbol' ? 'Symbol.for(...)' : String(k)}) -> ${err.constructor.name}: ${err.message}`);
  }
}
// 合法的键类型：普通对象、数组、函数、非注册的 Symbol、以及其他对象（日期、正则等）。
const validKeys = [{}, [], function () {}, Symbol('未注册的 Symbol'), new Date(0), /re/];
console.log('合法键类型全部可以设置：');
for (const k of validKeys) {
  typeErrMap.set(k, 'ok');
  // Object.prototype.toString 能给出比较友好的类型标签。
  console.log(`  ${Object.prototype.toString.call(k).padEnd(14)} -> has =`, typeErrMap.has(k));
}

console.log('\n--- 4. 键是弱引用：垃圾回收后条目会自动消失 ---');
console.log('WeakMap 与 Map 在生命周期上的差别：');
console.log('  Map     ：只要 Map 本身可达，它的所有键就**一直**可达 —— 键对象永远不会被回收。');
console.log('            若键是 DOM 节点或大对象，节点移除后内存仍然被占着，这就是泄漏。');
console.log('  WeakMap ：键是弱引用。当程序里再没有别的引用指向该键对象时，');
console.log('            垃圾回收器可以回收这个键，对应的键值对也随之消失，无需手动清理。');
console.log('⚠️ 回收时机由 GC 决定，**不可预测、不可观测**，绝不要写依赖它的逻辑。');

// 用 Map 做对照：证明 Map 会强引用键，因此回收不掉。
let strongKey = { big: 'data' };
const strongMap = new Map();
strongMap.set(strongKey, 'Meta');
console.log('Map 里放了一个对象键，size =', strongMap.size);
strongKey = null; // 外部引用断开，但 Map 仍然强引用它
console.log('把外部变量置为 null 之后，Map 的 size 仍是', strongMap.size, '（键依然被 Map 强引用着）');
console.log('如果是 WeakMap，此时这个键就"可被回收"了（但你看不到它消失的时刻）。');

console.log('\n--- 5. 经典场景一：给对象挂"私有数据" ---');

// 用 WeakMap 实现真正的私有字段（外部无法通过遍历对象发现它）。
const _balance = new WeakMap();

class BankAccount {
  /**
   * @param {number} initial 初始余额
   */
  constructor(initial) {
    // 私有数据存在模块级 WeakMap 里，实例对象上不留任何痕迹。
    _balance.set(this, initial);
  }

  /** 读取余额。 @returns {number} */
  get balance() {
    return _balance.get(this);
  }

  /**
   * 存款。
   * @param {number} amount 金额
   * @returns {number} 新余额
   */
  deposit(amount) {
    _balance.set(this, _balance.get(this) + amount);
    return _balance.get(this);
  }
}

const acc = new BankAccount(100);
console.log('初始余额 =', acc.balance);
console.log('存 50 后 =', acc.deposit(50));
// 从外部无法看到私有数据。
console.log('实例自身的可枚举属性 =', JSON.stringify(Object.keys(acc)), '（空，数据完全藏起来了）');
console.log('JSON.stringify(acc) =', JSON.stringify(acc), '（不会泄露余额）');
// 即使拿到另一个实例也读不到别人的数据。
const acc2 = new BankAccount(999);
console.log('两个实例互不干扰：acc.balance =', acc.balance, '，acc2.balance =', acc2.balance);

console.log('\n--- 6. 经典场景二：对象关联的缓存 / 元数据 ---');

// 场景：按对象缓存计算结果，对象不在了缓存自动消失。
const computedCache = new WeakMap();
let computeCount = 0;

/**
 * 计算并缓存"对象的签名"（这里用字段拼接模拟昂贵计算）。
 * @param {object} obj 目标对象
 * @returns {string} 签名
 */
function signatureOf(obj) {
  if (computedCache.has(obj)) {
    return computedCache.get(obj) + '（命中缓存）';
  }
  computeCount++; // 只有真正计算时才会自增
  const sig = Object.entries(obj).sort().map(([k, v]) => `${k}=${v}`).join('&');
  computedCache.set(obj, sig);
  return sig;
}

const target = { b: 2, a: 1 };
console.log('第一次：', signatureOf(target));
console.log('第二次：', signatureOf(target));
console.log('第三次：', signatureOf(target));
console.log('实际计算次数 =', computeCount, '（三次调用只算了一次）');
console.log('换一个对象：', signatureOf({ x: 9 }), '（不同键，重新计算）');
console.log('实际计算次数 =', computeCount);
console.log('✅ 对象作为键天然唯一标识，比用 JSON.stringify 当键更快、更准确');

// 场景：DOM 风格的对象元数据（这里用普通对象模拟 DOM 节点）。
const metadata = new WeakMap();
const fakeDomNodes = [{ id: 'node-1' }, { id: 'node-2' }];
metadata.set(fakeDomNodes[0], { clicks: 3, lastVisit: '2024-01-01' });
metadata.set(fakeDomNodes[1], { clicks: 7, lastVisit: '2024-02-02' });
console.log('\n模拟 DOM 元数据：');
for (const node of fakeDomNodes) {
  console.log(`  ${node.id} ->`, JSON.stringify(metadata.get(node)));
}
fakeDomNodes.length = 0; // 模拟"节点被移除"
console.log('节点被移除后，WeakMap 里的记录会随对象一起被回收，无需手动 delete。');

console.log('\n--- 7. WeakMap 与 Map 的选择表 ---');
const compare = [
  ['键的类型', '任意类型（含原始值）', '只能是对象'],
  ['是否可枚举', '是（keys/values/entries/forEach）', '否'],
  ['size 属性', '有', '没有'],
  ['clear()', '有', '没有'],
  ['键的引用强度', '强引用（阻碍回收）', '弱引用（不阻碍回收）'],
  ['能否被 JSON 序列化', '不能（要转数组）', '不能'],
  ['典型用途', '通用字典、缓存、图结构', '对象元数据、私有数据、对象关联缓存'],
];
console.log('  ' + '对比项'.padEnd(14) + 'Map'.padEnd(34) + 'WeakMap');
console.log('  ' + '-'.repeat(76));
for (const [item, mapDesc, wmDesc] of compare) {
  console.log('  ' + item.padEnd(12) + mapDesc.padEnd(32) + wmDesc);
}
console.log('\n结论：需要"键的生命周期跟着对象走"时才用 WeakMap，其余场景用 Map。');
console.log('本节结束。');
