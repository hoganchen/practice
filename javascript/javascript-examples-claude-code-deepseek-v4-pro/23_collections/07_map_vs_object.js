/**
 * ============================================================================
 * 知识点：Map 与 Object 的全维度对比 —— 键类型、顺序、size、性能、序列化
 * ============================================================================
 *
 * 【所属分类】23_collections —— 集合类型
 * 【难度等级】进阶
 * 【前置知识】23_collections/01_map_basics.js、09_objects 全部
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Object 和 Map 都能做"键值映射"，但它们在**键的类型、顺序保证、
 *    键名污染、序列化、性能特征**上都有实质差别。
 *    这不是"新取代旧"的关系：JSON 与对象字面量语法让 Object 无可替代，
 *    而 Map 在"动态键"和"频繁增删"场景明显更强。
 *
 * 2. 为什么需要
 *    选错结构会带来真实的 bug 和性能问题：
 *      - 用 Object 做"用户输入当键的字典"，__proto__ 键会污染原型；
 *      - 用 Object 缓存对象，键全部变成 "[object Object]" 互相覆盖；
 *      - 用 Object 做高频增删，V8 会退化成"字典模式"，性能下降；
 *      - 用 Map 做配置对象，结果 JSON.stringify 出来是 {}。
 *
 * 3. 核心语法要点（差异清单）
 *    (1) 键类型：Object 只能是 string / Symbol（其它类型被 toString）；
 *        Map 可以是任意类型。
 *    (2) 键的意外来源：Object 会从原型链继承键（toString、constructor、
 *        __proto__ 等），所以 "key" in obj 可能是 true 但并非自身属性；
 *        Map 没有原型链干扰（Map.prototype 上的方法不在数据里）。
 *    (3) 顺序：Object 的字符串键按"整数键升序 + 其余按插入顺序"；
 *        Map 严格按插入顺序。
 *    (4) 大小：Object 要 Object.keys(o).length（O(n)）；
 *        Map 有 O(1) 的 size。
 *    (5) 迭代：Object 需要 for...in（会遍历到继承属性）或 Object.keys 转换；
 *        Map 天然可迭代，且迭代协议明确。
 *    (6) 增删性能：频繁增删时 Map 更稳定；Object 在大量增删后可能变成
 *        慢速的"字典模式"。
 *    (7) 序列化：Object 直接被 JSON.stringify 支持；Map 需要先转数组或对象。
 *    (8) 字面量语法：Object 有 { } 和 JSON，Map 只能 new Map([...])。
 *
 * 4. 常见陷阱
 *    (1) 用读取到的 "__proto__"、"constructor" 当键写进 Object，造成原型污染。
 *    (2) 用 for...in 遍历 Object 并假设只有自身属性 —— 需要 hasOwnProperty 过滤。
 *    (3) JSON.stringify(new Map(...)) 得到 '{}'。
 *    (4) 以为"对象字面量的整数键顺序"和 Map 一样，实际 Object 会对整数键排序。
 *    (5) 在有大量动态键时仍坚持用 Object，导致性能与可读性双输。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 23_collections/07_map_vs_object.js
 *
 * 【预期输出】
 *   分 8 个小节，逐项对比两类结构，并给出"什么时候用哪个"的决策清单。
 *   所有输出固定（性能小节只打印相对关系与结论，不打印不稳定的耗时数值）。
 * ============================================================================
 */

console.log('--- 1. 键类型：Object 只能 string / Symbol ---');

const objKeys = {};
objKeys['字符串键'] = 1;
objKeys[42] = 2; // 数字会被转成字符串 "42"
objKeys[true] = 3; // 布尔会被转成字符串 "true"
const sym = Symbol('sym');
objKeys[sym] = 4; // Symbol 保留原样
const keyObject = { id: 1 };
objKeys[keyObject] = 5; // 对象被转成 "[object Object]"
console.log('Object 的键 =', Object.keys(objKeys).map((k) => JSON.stringify(k)).join(' , '));
console.log('  Symbol 键不在 Object.keys 里，要用 Object.getOwnPropertySymbols：', Object.getOwnPropertySymbols(objKeys).length, '个');
console.log('  用对象作键的结果：objKeys[{ id: 1 }] =', objKeys[keyObject], '，键名是 "[object Object]"');

const mapKeys = new Map();
mapKeys.set('字符串键', 1).set(42, 2).set(true, 3).set(sym, 4).set(keyObject, 5);
console.log('Map 的键个数 =', mapKeys.size, '（5 个都独立存在）');
console.log('  mapKeys.get(42) 与 get("42") 不同：', mapKeys.get(42), 'vs', mapKeys.get('42'));

console.log('\n--- 2. 原型链污染：Object 的"意外键" ---');

const plain = {};
console.log('空对象的 "toString" in obj =', 'toString' in plain, '（true，来自原型链！）');
console.log('空对象的 "constructor" in obj =', 'constructor' in plain, '（true）');
console.log('空对象的 Object.keys(obj).length =', Object.keys(plain).length, '（0，自身确实没有）');
console.log('✅ 判断自身属性要用 Object.hasOwn(obj, k) 或 Object.prototype.hasOwnProperty.call');
console.log('   Object.hasOwn(plain, "toString") =', Object.hasOwn(plain, 'toString'));

// 危险场景：把用户输入的键直接写进对象。
const userInputKey = '__proto__';
const polluted = {};
polluted[userInputKey] = { isAdmin: true }; // ⚠️ 这会试图修改原型
console.log('\n把 "__proto__" 当普通键写进对象：');
console.log('  polluted 的自身键 =', JSON.stringify(Object.keys(polluted)), '（键没进去，反而改了原型链指向）');
console.log('  Object.getPrototypeOf(polluted) =', JSON.stringify(Object.getPrototypeOf(polluted)));

// 安全写法一：用 Object.create(null) 创建"无原型"对象，任何键都是自身属性。
const bare = Object.create(null);
bare['__proto__'] = { isAdmin: true };
console.log('\n✅ 用 Object.create(null)：');
console.log('  自身键 =', JSON.stringify(Object.keys(bare)), '（"__proto__" 老老实实成了一个普通键）');
console.log('  原型 =', Object.getPrototypeOf(bare), '（就是 null）');

// 安全写法二：用 Map，天然没有这个问题。
const safeMap = new Map();
safeMap.set('__proto__', { isAdmin: true });
console.log('✅ 用 Map：键 =', [...safeMap.keys()].join(', '), '，取出来 =', JSON.stringify(safeMap.get('__proto__')));
console.log('  Map 的键不会与任何东西"撞车"，也不会影响原型。');

console.log('\n--- 3. 键的顺序规则不同 ---');

// Object：整数样子（数组下标）的键会被**升序**排在前面，其余按插入顺序。
const orderedObj = {};
orderedObj['b'] = 1;
orderedObj[2] = 2;
orderedObj['a'] = 3;
orderedObj[1] = 4;
console.log('Object 的键顺序 =', Object.keys(orderedObj).join(' , '), '（整数键 1、2 被提前并升序）');

// Map：严格按插入顺序，数字键也不例外。
const orderedMap = new Map();
orderedMap.set('b', 1).set(2, 2).set('a', 3).set(1, 4);
console.log('Map 的键顺序    =', [...orderedMap.keys()].join(' , '), '（严格按插入顺序）');
console.log('✅ 需要"顺序可预测"（如按插入顺序渲染列表）时，Map 比 Object 可靠。');

console.log('\n--- 4. 大小与判存 ---');

const bigObj = { a: 1, b: 2, c: 3 };
const bigMap = new Map([['a', 1], ['b', 2], ['c', 3]]);
console.log('Object 的大小：Object.keys(o).length =', Object.keys(bigObj).length, '（需要先取出所有键，O(n)）');
console.log('Map 的大小   ：map.size =', bigMap.size, '（O(1) 属性）');

console.log('判存（是否存在某个键）：');
const probeKey = 'a';
console.log("  Object：Object.hasOwn(obj, 'a') =", Object.hasOwn(bigObj, probeKey));
console.log("  Map   ：map.has('a')            =", bigMap.has(probeKey));
console.log("  陷阱：'a' in obj 对继承属性也会返回 true，Object.hasOwn 才只看自身。");
console.log("  另外：Object 的 obj[k] 取到 undefined 时，无法区分'键不存在'与'值就是 undefined'，需要配合 Object.hasOwn。");

console.log('\n--- 5. 删除性能与"删除后是否留下空洞" ---');

// Object 用 delete 会留下"空洞"，影响 V8 的内部表示（可能退化为字典模式）。
const delObj = { a: 1, b: 2, c: 3 };
delete delObj.b;
console.log('删除 Object 的键后：keys =', Object.keys(delObj).join(' , '), '（键消失了）');
// 更稳的替代：用值置为 undefined（但键还在），或干脆用 Map。
const delMap = new Map([['a', 1], ['b', 2], ['c', 3]]);
delMap.delete('b');
console.log('删除 Map 的键后：size =', delMap.size, '，keys =', [...delMap.keys()].join(' , '));
console.log('工程建议：需要频繁增删键的字典，用 Map；固定字段的实体，用 Object。');

console.log('\n--- 6. 迭代方式 ---');

const iterObj = { name: '张三', age: 28 };
const iterMap = new Map([['name', '张三'], ['age', 28]]);

console.log('Object 的迭代方式：');
for (const k of Object.keys(iterObj)) console.log(`  Object.keys -> ${k} = ${iterObj[k]}`);
for (const [k, v] of Object.entries(iterObj)) console.log(`  Object.entries -> ${k} = ${v}`);
// for...in 会遍历继承的可枚举属性，必须过滤。
let forInCount = 0;
for (const k in iterObj) { forInCount++; void k; }
console.log('  for...in 遍历到的键数量 =', forInCount, '（若原型被污染过，数量会变多，所以要用 hasOwn 过滤）');

console.log('Map 的迭代方式：');
for (const [k, v] of iterMap) console.log(`  for...of map -> ${k} = ${v}`);
iterMap.forEach((v, k) => console.log(`  forEach -> ${k} = ${v}（注意参数顺序是 value 在前）`));

console.log('\n--- 7. 序列化 ---');

const jsonObj = { name: '张三', age: 28 };
const jsonMap = new Map([['name', '张三'], ['age', 28]]);
console.log('Object -> JSON：', JSON.stringify(jsonObj));
console.log('Map    -> JSON：', JSON.stringify(jsonMap), '（❌ 得到 {}）');
console.log('Map 要序列化必须先转换：');
console.log('  JSON.stringify([...map])             =', JSON.stringify([...jsonMap]));
console.log('  JSON.stringify(Object.fromEntries(map)) =', JSON.stringify(Object.fromEntries(jsonMap)));
console.log('反向：JSON.parse 得到的永远是普通对象，要变成 Map 需再包一层：');
const parsed = JSON.parse('{"name":"张三","age":28}');
console.log('  new Map(Object.entries(JSON.parse(...))) 的 size =', new Map(Object.entries(parsed)).size);
console.log('✅ 若数据要过 JSON（接口、localStorage、配置文件），Object 更省事；');
console.log('   若只是内存中的数据结构，Map 的表达力更强。');

console.log('\n--- 8. 性能特征（结论，不依赖具体耗时数字） ---');
console.log('关键点：两者的复杂度都是平均 O(1)，差异主要在**常数因子**和**引擎优化**上。');
console.log('  1) 纯查找/插入：小数据量下 Object 通常更快（引擎对固定形状的对象有内联缓存）。');
console.log('  2) 频繁增删键：Map 更稳定。Object 的 delete 会让隐藏类失效，');
console.log('     大量动态键会让对象退化成"字典模式"，性能明显下降。');
console.log('  3) 键数量未知/很大：Map 更省心，size 是 O(1)，且没有键名字符串化的开销。');
console.log('  4) 结果只说明"哪类操作更合适"，具体数值依赖引擎版本，不应作为硬性依据。');

// 用一个确定性的对比说明"字符串化键"的代价：数字键在 Object 里会被转成字符串。
const numKeysObj = {};
const numKeysMap = new Map();
for (let i = 0; i < 5; i++) { numKeysObj[i] = i; numKeysMap.set(i, i); }
console.log('\n数字键存储后读回来的类型：');
console.log('  Object 的键类型：', Object.keys(numKeysObj).map((k) => typeof k).join(', '), '（全变成字符串）');
console.log('  Map 的键类型   ：', [...numKeysMap.keys()].map((k) => typeof k).join(', '), '（保持数字）');

console.log('\n--- 9. 决策清单 ---');
const decision = [
  ['键是字符串或 Symbol，且字段固定', 'Object（能直接用字面量和 JSON）'],
  ['键是对象/数字/函数等非字符串', 'Map'],
  ['需要频繁增删键', 'Map'],
  ['需要 O(1) 拿到元素个数', 'Map'],
  ['需要严格的插入顺序', 'Map'],
  ['数据要经过 JSON 序列化', 'Object'],
  ['需要原型链上的方法或 this 绑定', 'Object'],
  ['键来自不可信的外部输入', 'Map 或 Object.create(null)'],
  ['需要私有数据 / 元数据绑定到对象', 'WeakMap'],
];
for (const [scene, choice] of decision) {
  console.log(`  ${scene.padEnd(30)} -> ${choice}`);
}
console.log('\n本节结束。');
