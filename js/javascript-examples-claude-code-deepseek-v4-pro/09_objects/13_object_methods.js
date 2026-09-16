/**
 * ============================================================================
 * 知识点：Object 上的工具方法 —— Object.is / getPrototypeOf / getOwnPropertyNames 等
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】进阶
 * 【前置知识】09_objects/08_property_descriptors.js、09_objects/10_object_create.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Object 是 JS 的"对象工具库"，除了前面文件讲过的 keys/entries/assign/create/freeze，
 *    还有一批高频工具方法，本文件集中介绍：
 *      Object.is(a, b)                   —— 更严谨的相等判断（SameValue）
 *      Object.getPrototypeOf / setPrototypeOf —— 读写原型
 *      Object.getOwnPropertyNames        —— 所有字符串键（含不可枚举）
 *      Object.getOwnPropertySymbols      —— 所有 Symbol 键
 *      Object.getOwnPropertyDescriptor(s) —— 读取属性描述符
 *      Object.entries / fromEntries      —— 已在 05 号文件详述
 *      Object.groupBy（ES2024）          —— 按回调分组，见第 5 节
 *
 * 2. 为什么需要
 *    写 JS 时大量需求都要靠这些方法完成：
 *      - 判断"是不是同一个值"：Object.is 能区分 +0/-0 和 NaN，=== 不能。
 *      - 判断"是不是纯对象"：结合 getPrototypeOf 可以看出对象来源。
 *      - 遍历"所有属性"：Object.keys 看不到不可枚举属性，需要 getOwnPropertyNames。
 *      - 反射式编程：写通用的序列化 / 校验 / 拷贝工具时必须用到这些 API。
 *
 * 3. 核心语法要点
 *    (1) Object.is 与 === 的差异只有两处：
 *        - Object.is(NaN, NaN) === true，而 NaN === NaN 是 false
 *        - Object.is(0, -0) === false，而 0 === -0 是 true
 *        其余情况两者完全一致（不做类型转换，引用按地址比较）。
 *    (2) Object.getOwnPropertyNames(obj) 返回"字符串键"，含不可枚举但不含 Symbol。
 *    (3) Object.getOwnPropertySymbols(obj) 返回 Symbol 键（含不可枚举）。
 *    (4) Reflect.ownKeys(obj) = getOwnPropertyNames + getOwnPropertySymbols 的合集，
 *        顺序也遵循属性遍历顺序规则（见 14 号文件）。
 *    (5) Object.getPrototypeOf(null/undefined) 抛 TypeError；
 *        Object.prototype.toString.call(x) 是最通用的"类型标签"探测手段。
 *    (6) Object.entries / Object.values / Object.fromEntries 见 05 号文件。
 *
 * 4. 常见陷阱
 *    (1) 以为 Object.is 和 === 差不多就随便混用：判 NaN 必须用 Object.is（或用
 *        Number.isNaN），判 +0/-0 要小心。
 *    (2) Object.keys 只返回可枚举属性，遍历"全部属性"必须用 Reflect.ownKeys。
 *    (3) Object.getOwnPropertyNames 对数组会返回 ['0','1',...,'length']。
 *    (4) typeof null === 'object'，判断对象必须加 null 检查。
 *    (5) Object.prototype.toString.call() 虽然强大，但可以被 Symbol.toStringTag 伪造。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/13_object_methods.js
 *
 * 【预期输出】
 *   分 6 个小节，集中演示 Object 上除 keys/assign/freeze 之外的工具方法。
 * ============================================================================
 */

console.log('--- 1. Object.is：比 === 更严谨的相等 ---');

// 与 === 一致的部分
console.log("Object.is(1, 1)        =", Object.is(1, 1));
console.log("Object.is('a', 'a')    =", Object.is('a', 'a'));
console.log("Object.is({}, {})      =", Object.is({}, {}), '（引用不同）');
const shared = {};
console.log('Object.is(shared, shared) =', Object.is(shared, shared));

// 差异一：NaN
console.log('\n差异一：NaN 的比较');
console.log('   NaN === NaN              =', NaN === NaN, '（=== 认为不相等）');
console.log('   Object.is(NaN, NaN)      =', Object.is(NaN, NaN), '（Object.is 认为相等）');
console.log('   Number.isNaN(NaN)        =', Number.isNaN(NaN), '（另一种正确写法）');

// 差异二：+0 与 -0
console.log('\n差异二：正零与负零');
const posZero = 0;
const negZero = -0;
console.log('   0 === -0                 =', posZero === negZero, '（=== 认为相等）');
console.log('   Object.is(0, -0)         =', Object.is(0, -0), '（Object.is 认为不相等）');
// 怎么造出 -0：负数除以正无穷，或者 -0 字面量
console.log('   Object.is(-0, -0)        =', Object.is(-0, -0));
console.log('   1 / -0 =', 1 / negZero, '（-Infinity，说明确实是 -0）');

// 场景：用 Object.is 判断"值到底有没有变"，这样 NaN -> NaN 不会被误判为变化。
function hasChanged(oldVal, newVal) {
  return !Object.is(oldVal, newVal);
}
console.log('\n用 Object.is 判断值是否变化：');
console.log('   hasChanged(NaN, NaN)  =', hasChanged(NaN, NaN), '（没变）');
console.log('   hasChanged(0, -0)     =', hasChanged(0, -0), '（变了）');
console.log('   hasChanged(1, 1)      =', hasChanged(1, 1), '（没变）');

console.log('\n--- 2. 原型相关：getPrototypeOf / setPrototypeOf / isPrototypeOf ---');

const base = { kind: '基础' };
const derived = Object.create(base);
derived.own = '自有';

console.log('getPrototypeOf(derived) === base =', Object.getPrototypeOf(derived) === base);
console.log('base.isPrototypeOf(derived)      =', base.isPrototypeOf(derived));

// 原型链顶端
console.log('getPrototypeOf({}) === Object.prototype =', Object.getPrototypeOf({}) === Object.prototype);
console.log('getPrototypeOf(Object.prototype)        =', Object.getPrototypeOf(Object.prototype));
console.log('getPrototypeOf([]) === Array.prototype  =', Object.getPrototypeOf([]) === Array.prototype);

// 计算原型链的"深度"与完整链条
function prototypeChain(obj) {
  const chain = [];
  let cur = Object.getPrototypeOf(obj);
  while (cur !== null) {
    chain.push(cur.constructor ? cur.constructor.name || '[匿名]' : '[无 constructor]');
    cur = Object.getPrototypeOf(cur);
  }
  chain.push('null');
  return chain;
}
console.log('普通对象的原型链 =', prototypeChain({}));
console.log('数组的原型链     =', prototypeChain([]));
class Animal {}
class Dog extends Animal {}
console.log('Dog 实例的原型链  =', prototypeChain(new Dog()));
console.log('无原型对象的原型链 =', prototypeChain(Object.create(null)));

// setPrototypeOf 的代价：会破坏引擎的优化，应尽量避免。
const mutable = { a: 1 };
Object.setPrototypeOf(mutable, { helper: () => '来自新原型' });
console.log('setPrototypeOf 之后 helper() =', mutable.helper());

console.log('\n--- 3. 属性枚举三兄弟：names / symbols / Reflect.ownKeys ---');

const s1 = Symbol('s1');
const target = { str: 1 };
Object.defineProperty(target, 'hidden', { value: 2, enumerable: false });
target[s1] = 3;
Object.defineProperty(target, Symbol.for('s2'), { value: 4, enumerable: false });

console.log('Object.keys                    =', JSON.stringify(Object.keys(target)));
console.log('Object.getOwnPropertyNames     =', JSON.stringify(Object.getOwnPropertyNames(target)));
console.log('Object.getOwnPropertySymbols   =', Object.getOwnPropertySymbols(target).map(String));
console.log('Reflect.ownKeys                =', Reflect.ownKeys(target).map(String));
console.log('（Reflect.ownKeys 是前两者的合集，含不可枚举属性）');

// 数组上的应用：注意 length 是自有但不可枚举的属性
const arr = ['a', 'b', 'c'];
console.log('\n数组上的表现：');
console.log('   Object.keys(arr)                =', JSON.stringify(Object.keys(arr)));
console.log('   Object.getOwnPropertyNames(arr) =', JSON.stringify(Object.getOwnPropertyNames(arr)));
console.log('   length 的描述符 =', JSON.stringify(Object.getOwnPropertyDescriptor(arr, 'length')));

// 想拿"可枚举的自有属性"用 keys，想拿"全部自有属性"用 Reflect.ownKeys。
// 下面这个函数可以用来做"完整属性复制"：
function cloneAllOwnProps(obj) {
  const out = {};
  for (const key of Reflect.ownKeys(obj)) {
    out[key] = obj[key];
  }
  return out;
}
const fullClone = cloneAllOwnProps(target);
console.log('完整复制（含不可枚举）后 JSON =', JSON.stringify(fullClone));
console.log('Symbol 也复制到了 =', fullClone[s1]);

console.log('\n--- 4. getOwnPropertyDescriptors：一次拿到全部描述符 ---');

const described = {};
Object.defineProperties(described, {
  id: { value: 1, writable: false, enumerable: true, configurable: false },
  name: { value: '张三', writable: true, enumerable: true, configurable: true },
  log: {
    get() {
      return 'getter 结果';
    },
    enumerable: true,
    configurable: true,
  },
});

const allDescriptors = Object.getOwnPropertyDescriptors(described);
console.log('全部描述符（用 JSON 打印会触发 getter，所以 log 显示的是值）：');
for (const [key, d] of Object.entries(allDescriptors)) {
  console.log(`   ${key.padEnd(6)} ->`, JSON.stringify(d));
}

// 单个属性的描述符
console.log('单取 id 的描述符 =', JSON.stringify(Object.getOwnPropertyDescriptor(described, 'id')));

// 用描述符做"完整复制"，能保留 writable/enumerable/configurable 和 getter/setter。
const exactCopy = Object.defineProperties({}, allDescriptors);
console.log('完整复制后 id 仍不可写 =', JSON.stringify(Object.getOwnPropertyDescriptor(exactCopy, 'id')));
console.log('完整复制后 log 仍是访问器 =', typeof Object.getOwnPropertyDescriptor(exactCopy, 'log').get === 'function');

// 从描述符里"提取纯数据对象"的常用技巧（把 getter 求值成值）：
const plainData = Object.fromEntries(
  Object.entries(allDescriptors).map(([k, d]) => [k, 'value' in d ? d.value : d.get.call(described)]),
);
console.log('提取成纯数据 =', JSON.stringify(plainData));

console.log('\n--- 5. Object.groupBy（ES2024，Node 21+） ---');

// 老办法：手写循环分组（见 03 号文件）。
// 新办法：Object.groupBy(items, callback)，回调返回分组键。
const fruits = [
  { name: '苹果', type: '水果', qty: 3 },
  { name: '胡萝卜', type: '蔬菜', qty: 5 },
  { name: '香蕉', type: '水果', qty: 2 },
  { name: '菠菜', type: '蔬菜', qty: 1 },
];

if (typeof Object.groupBy === 'function') {
  const byType = Object.groupBy(fruits, (item) => item.type);
  console.log('按 type 分组 =', JSON.stringify(byType));
  console.log('取出水果组 =', JSON.stringify(byType['水果'].map((f) => f.name)));

  // 回调返回的键会被转成字符串；返回 Symbol 也可以。
  const byQty = Object.groupBy(fruits, (f) => (f.qty >= 3 ? '多' : '少'));
  console.log('按数量多少分组 =', JSON.stringify(byQty));

  // 也可以直接按数组分组，得到的是数组的数组。
  console.log('分组结果是纯数组 =', Array.isArray(byType['水果']));
} else {
  // 兼容旧环境的兜底写法
  console.log('当前环境没有 Object.groupBy，使用手写实现：');
  const fallbackGroupBy = (items, cb) => {
    const out = {};
    for (const item of items) {
      const key = cb(item);
      out[key] ??= [];
      out[key].push(item);
    }
    return out;
  };
  console.log(JSON.stringify(fallbackGroupBy(fruits, (f) => f.type)));
}

// Map.groupBy 是同样的东西，区别是返回 Map（键可以是任意类型）。
if (typeof Map.groupBy === 'function') {
  const m = Map.groupBy(fruits, (f) => f.qty);
  console.log('Map.groupBy 返回 Map =', m instanceof Map);
} else {
  console.log('（当前环境没有 Map.groupBy）');
}

console.log('\n--- 6. 类型判断与其它常用静态方法 ---');

// 最通用的"类型标签"探测
const tagOf = (x) => Object.prototype.toString.call(x).slice(8, -1);
console.log('类型标签探测：');
for (const v of [{}, [], null, undefined, 42, 'str', true, Symbol('s'), () => {}, new Date(), /a/, new Map(), 10n]) {
  console.log(`   ${String(v).slice(0, 18).padEnd(20)} -> ${tagOf(v)}`);
}

// typeof 的经典坑
console.log('\ntypeof 的坑：');
console.log('   typeof null      =', typeof null, '（不是 null！）');
console.log('   typeof []        =', typeof [], '（不是 array！）');
console.log('   正确写法：Array.isArray([]) =', Array.isArray([]));
console.log('   正确写法：x === null        =', null === null);

// 判断"是不是纯对象"（原型是 Object.prototype 或 null）
const isPlainObject = (x) =>
  x !== null && typeof x === 'object' && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
console.log('\nisPlainObject 判断：');
for (const [label, v] of [['{}', {}], ['Object.create(null)', Object.create(null)], ['[]', []], ['new Date()', new Date()], ['null', null]]) {
  console.log(`   ${label.padEnd(22)} -> ${isPlainObject(v)}`);
}

// Object.prototype.hasOwnProperty 的现代替代已在 11 号文件详述，这里只做提示。
console.log('\nObject.hasOwn 可用 =', typeof Object.hasOwn === 'function');

// 一些常被忽略但很实用的静态方法：
console.log('\n其它实用方法：');
console.log('   Object.isExtensible({})       =', Object.isExtensible({}));
console.log('   Object.isSealed({})           =', Object.isSealed({}));
console.log('   Object.isFrozen({})           =', Object.isFrozen({}));
console.log('   Object.preventExtensions 等已在 09 号文件详述');
console.log('   Object.hasOwn({ a: 1 }, "a")  =', Object.hasOwn({ a: 1 }, 'a'));

// Object.prototype.isPrototypeOf 的反向工具：检查属性来源
const ownerOf = (obj, key) => {
  let cur = obj;
  let level = 0;
  while (cur !== null) {
    if (Object.hasOwn(cur, key)) return { level, owner: cur };
    cur = Object.getPrototypeOf(cur);
    level += 1;
  }
  return null;
};
const inst = new Dog();
inst.name = '旺财';
console.log('\n属性归属查询：');
console.log('   name   ->', JSON.stringify(ownerOf(inst, 'name'))?.slice(0, 40));
console.log('   constructor -> 第', ownerOf(inst, 'constructor').level, '层');

console.log('\n全部演示完毕。');
