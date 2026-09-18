/**
 * ============================================================================
 * 知识点：Map 基础 —— 任意类型作键的键值集合
 * ============================================================================
 *
 * 【所属分类】23_collections —— 集合类型
 * 【难度等级】入门
 * 【前置知识】09_objects/01_object_literal.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Map 是 ES2015 引入的键值对集合。它和 Object 长得像，但本质不同：
 *      - Object 的键只能是字符串或 Symbol（其它类型会被强制转换）
 *      - Map 的键可以是**任何类型**：对象、函数、NaN、甚至另一个 Map
 *    并且 Map 会**保留插入顺序**、提供 size 属性、有清晰的增删查 API。
 *
 * 2. 为什么需要
 *    很多时候我们想"用一个对象当键"：比如给 DOM 节点挂元数据、
 *    用函数当回调表、用对象当缓存索引。用 Object 做这件事只能先把键
 *    转成字符串（都变成 "[object Object]"，互相覆盖），Map 天生支持。
 *
 * 3. 核心语法要点
 *    (1) 构造：
 *          new Map()                       空 Map
 *          new Map([[k1, v1], [k2, v2]])   用可迭代对象（数组的数组）初始化
 *          new Map(另一个Map)              复制（浅拷贝）
 *          new Map(普通对象)               ❌ 会抛 TypeError，对象不可迭代
 *        想把普通对象变成 Map，用 new Map(Object.entries(obj))。
 *    (2) 增：map.set(key, value)  返回 Map 本身，可链式调用
 *    (3) 查：map.get(key)         键不存在返回 undefined（不是抛错）
 *    (4) 判：map.has(key)         返回布尔值；判断"有没有"必须用它，
 *        因为存了 undefined 的键 get 出来也是 undefined
 *    (5) 删：map.delete(key)      返回布尔值（是否真的删掉了）
 *    (6) 清：map.clear()          清空，无返回值
 *    (7) 量：map.size             属性，不是方法（不要写 map.size()）
 *    (8) 键的相等性遵循 SameValueZero 规则：NaN 等于 NaN；+0 与 -0 视为同一个键。
 *
 * 4. 常见陷阱
 *    (1) 写 map.size() 报 TypeError: map.size is not a function。
 *    (2) 用 [] 或 . 访问 Map：map[key] 会去读 Map 对象的普通属性，永远 undefined，
 *        必须用 map.get(key)。同理赋值要用 set。
 *    (3) new Map(obj) 直接传对象会抛 TypeError（对象不是可迭代的）。
 *    (4) 用对象作键时，"内容相同"的两个对象是两个不同的键（按引用比较）。
 *    (5) get 返回 undefined 无法区分"键不存在"和"值是 undefined"，要用 has。
 *    (6) Map 的键是强引用，键对象不释放则不会被 GC（需要弱引用请用 WeakMap）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 23_collections/01_map_basics.js
 *
 * 【预期输出】
 *   分 7 个小节，演示构造、增删查改、任意类型作键、SameValueZero 规则、
 *   size 与 has 的正确用法、以及与普通对象的互转。输出固定。
 * ============================================================================
 */

console.log('--- 1. 创建 Map 的几种方式 ---');

// 空 Map
const empty = new Map();
console.log('new Map() 的 size =', empty.size);

// 用"键值对数组"初始化：每个元素是长度 2 的数组 [key, value]。
const fromPairs = new Map([
  ['name', '张三'],
  ['age', 28],
]);
console.log('从数组初始化 ->', fromPairs.size, '个键值对');
console.log('  顺序保留：', [...fromPairs.keys()].join(' , '));

// 从普通对象初始化：必须用 Object.entries 转成可迭代的键值对。
const sourceObj = { a: 1, b: 2, c: 3 };
const fromObject = new Map(Object.entries(sourceObj));
console.log('从对象初始化 ->', fromObject.size, '个键值对');

// 直接传对象会抛错，因为普通对象不是可迭代对象。
try {
  new Map(sourceObj);
} catch (err) {
  console.log('❌ new Map(普通对象) 抛错 ->', err.constructor.name + ':', err.message);
}

// 从一个 Map 复制（浅拷贝：键和值都是引用的复制）。
const copied = new Map(fromPairs);
console.log('从 Map 复制 ->', copied.size, '个键值对，值相同：', copied.get('name') === fromPairs.get('name'));

console.log('\n--- 2. set / get / has / delete / clear ---');

const user = new Map();
// set 返回 Map 本身，所以可以链式调用。
const returned = user.set('id', 1001).set('name', '李四').set('city', '上海');
console.log('set 返回的是 Map 本身吗：', returned === user);
console.log('链式设置后 size =', user.size);

// get 读取；键不存在返回 undefined。
console.log("get('name')      =", user.get('name'));
console.log("get('不存在')     =", user.get('不存在'));

// has 判断键是否存在，返回布尔值。
console.log("has('id')        =", user.has('id'));
console.log("has('不存在')     =", user.has('不存在'));

// delete 返回布尔值，表示是否真的删除了。
console.log("delete('city')   =", user.delete('city'), '（删掉了）');
console.log("再 delete('city') =", user.delete('city'), '（本来就没有，返回 false）');
console.log('删除后 size      =', user.size);

// clear 清空。
const temp = new Map([['x', 1], ['y', 2]]);
temp.clear();
console.log('clear() 后 size  =', temp.size);

console.log('\n--- 3. 任意类型作键：这是 Map 相对 Object 的最大优势 ---');

const anyKey = new Map();

// 对象作键：按**引用**比较，不是按内容。
const keyObj1 = { id: 1 };
const keyObj2 = { id: 1 }; // 内容一样，但是另一个对象
anyKey.set(keyObj1, '对象键 A');
anyKey.set(keyObj2, '对象键 B');
console.log('两个内容相同的对象是不同的键：size =', anyKey.size);
console.log('  anyKey.get(keyObj1) =', anyKey.get(keyObj1));
console.log('  anyKey.get(keyObj2) =', anyKey.get(keyObj2));

// 函数作键。
const fnKey = () => {};
anyKey.set(fnKey, '函数键');
console.log('函数作键 ->', anyKey.get(fnKey));

// 数组作键。
const arrKey = [1, 2, 3];
anyKey.set(arrKey, '数组键');
console.log('数组作键 ->', anyKey.get(arrKey));
console.log('用内容相同但不同引用的数组取 ->', anyKey.get([1, 2, 3]), '（undefined，因为不是同一个引用）');

// 数字、字符串、布尔、Symbol、null、undefined 都可以作键。
anyKey.set(1, '数字键').set('1', '字符串键').set(true, '布尔键').set(null, 'null 键').set(undefined, 'undefined 键');
console.log('数字 1 与字符串 "1" 是不同的键：', anyKey.get(1), '/', anyKey.get('1'));
console.log('null 键 ->', anyKey.get(null), '；undefined 键 ->', anyKey.get(undefined));
console.log('Symbol 键 ->', (() => { const s = Symbol('k'); anyKey.set(s, 'Symbol 键'); return anyKey.get(s); })());

// 对比：用 Object 存这些键会发生什么。
const objAsMap = {};
objAsMap[keyObj1] = '对象键'; // 键被转成字符串 "[object Object]"
objAsMap[keyObj2] = '另一个对象键'; // 覆盖了上一个
console.log('用普通对象做同样的事：键数 =', Object.keys(objAsMap).length, '，键名 =', Object.keys(objAsMap)[0], '（撞车了）');

console.log('\n--- 4. SameValueZero：键相等性的判定规则 ---');

const svz = new Map();
// NaN === NaN 是 false，但在 Map 里 NaN 被视为同一个键。
svz.set(NaN, 'NaN 的值');
console.log('NaN 作键：set 一次后 size =', svz.size, '，get(NaN) =', svz.get(NaN));
svz.set(NaN, '改过的值');
console.log('再次 set(NaN) 后 size =', svz.size, '（没有新增，是覆盖）');
// +0 与 -0 被视为同一个键。
svz.set(0, '零');
svz.set(-0, '负零');
console.log('0 与 -0：size =', svz.size, '，get(0) =', svz.get(0), '（-0 覆盖了 0 的值）');
console.log('规则名叫 SameValueZero：与 === 几乎相同，但 NaN 等于自身、+0 等于 -0。');

console.log('\n--- 5. size 是属性，不是方法 ---');
const sized = new Map([['a', 1], ['b', 2], ['c', 3]]);
console.log('typeof sized.size =', typeof sized.size, '，值 =', sized.size);
try {
  // @ts-expect-error 故意演示错误用法
  sized.size();
} catch (err) {
  console.log('❌ sized.size() 抛错 ->', err.constructor.name + ':', err.message);
}

console.log('\n--- 6. 陷阱：区分"键不存在"与"值是 undefined" ---');
const undefinedValue = new Map();
undefinedValue.set('existButUndefined', undefined);
console.log("get('existButUndefined') =", undefinedValue.get('existButUndefined'), '（是 undefined）');
console.log("get('neverSet')          =", undefinedValue.get('neverSet'), '（也是 undefined，无法区分！）');
console.log("✅ 用 has 区分：has('existButUndefined') =", undefinedValue.has('existButUndefined'));
console.log("✅ 用 has 区分：has('neverSet')          =", undefinedValue.has('neverSet'));
// 常见的"有则取、无则建"写法。
/**
 * 若键不存在则用 factory 创建并存入，最后返回该键对应的值。
 * @param {Map} map 目标 Map
 * @param {*} key 键
 * @param {Function} factory 惰性创建值的工厂函数
 * @returns {*} 键对应的值
 */
function getOrCreate(map, key, factory) {
  if (!map.has(key)) map.set(key, factory());
  return map.get(key);
}
const counters = new Map();
console.log('getOrCreate 三次（同一个键）：');
for (let i = 0; i < 3; i++) {
  const arr = getOrCreate(counters, 'errors', () => []);
  arr.push(i);
}
console.log('  counters.get("errors") =', JSON.stringify(counters.get('errors')), '（工厂只被调用了一次）');

console.log('\n--- 7. 与普通对象互转 ---');

const toObj = new Map([['x', 1], ['y', 2]]);
// Map -> 数组 -> 对象
console.log('Map -> 对象 =', JSON.stringify(Object.fromEntries(toObj)));
// 对象 -> Map
const backToMap = new Map(Object.entries({ x: 1, y: 2 }));
console.log('对象 -> Map 的 size =', backToMap.size);
// 注意：Map 本身不能被 JSON.stringify 直接序列化。
console.log('❌ JSON.stringify(new Map([["a",1]])) =', JSON.stringify(new Map([['a', 1]])), '（空对象，Map 不是普通对象）');
console.log('✅ 需要序列化时先转成数组或对象：JSON.stringify([...toObj]) =', JSON.stringify([...toObj]));
console.log('\n本节结束。');
