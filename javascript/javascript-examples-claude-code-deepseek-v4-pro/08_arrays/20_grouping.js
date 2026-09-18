/**
 * ============================================================================
 * 知识点：分组 —— Object.groupBy / Map.groupBy 与手写分组实现
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】进阶
 * 【前置知识】08_arrays/19_sparse_and_length.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "分组"就是把一个数组按某个规则拆成若干组。JS 在很长一段时间里没有内置方法，
 *    只能用 reduce 手写（每个项目都写过一遍那个函数）。ES2024 终于标准化了两个：
 *
 *      Object.groupBy(items, callbackFn)  ->  返回一个**无原型对象**，键是分组键（字符串/符号）
 *      Map.groupBy(items, callbackFn)     ->  返回一个 **Map**，键可以是任意类型（对象、数字…）
 *
 *    两者的回调签名都是 (element, index, array)，返回值就是"这一项属于哪个组"。
 *
 *    对照记忆：它们的"亲兄弟"是已有的
 *      Array.prototype.group  ->  最终以 **静态方法** Object.groupBy / Map.groupBy 落地
 *      （曾经提案里是 arr.groupBy(...)，最后被改成静态方法，因为要避免与第三方库冲突）
 *
 * 2. 为什么需要它
 *    分组是最常见的聚合操作之一：按部门列出员工、按日期汇总订单、按状态分类订单、
 *    按首字母索引联系人……手写 reduce 版本虽然可行，但每次都要重复
 *    "取键 - 查表 - 建数组 - push"这套模板，还容易忘记初始化。
 *    内置方法让意图直接写在调用处：groupBy(items, fn)。
 *
 * 3. 核心语法要点
 *    (1) 返回值差异（最关键的一点）：
 *          Object.groupBy -> 普通对象（准确说是 **null 原型对象**），键会被转成字符串/符号
 *          Map.groupBy    -> Map，键保持原样（可以是对象、数字、布尔……）
 *    (2) **Object.groupBy 的键会经历"属性键转换"**：数字 20 会变成字符串 '20'，
 *        对象会变成 '[object Object]'（这几乎总是 bug）。要保留原始键类型请用 Map.groupBy。
 *    (3) 结果是 null 原型对象，所以：
 *          result.hasOwnProperty('x')  // TypeError！没有这个方法
 *          Object.hasOwn(result, 'x')  // 正确
 *          'x' in result               // 也可以（但没有原型链干扰）
 *          用 { ...result } 或 Object.assign({}, result) 可以得到普通对象
 *    (4) 回调返回 undefined 会得到一个键为 'undefined' 的组（不会丢弃，但要注意）。
 *    (5) 分组结果 **不修改原数组**（non-mutating），元素本身也还是原引用。
 *    (6) 组内元素的**顺序**与原数组顺序一致（稳定）。
 *    (7) 环境要求：Node 21+ / Chrome 117+ / Safari 17.4+。本仓库 Node 24 支持。
 *        需要兼容旧环境时，用手写的 groupBy 替代（本文件第 7 节给出实现）。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**不修改原数组**，只读并产出新对象/Map；
 *      但组内元素与原数组共享引用（浅）。
 *    - Object.groupBy 用对象当分组键会全部挤到 "[object Object]" 一个组里。
 *    - Object.groupBy 的数字键会变成字符串，`result[1]` 与 `result['1']` 是同一个组。
 *    - 结果是 null 原型对象，`JSON.stringify` 正常，但 `instanceof Object` 为 false，
 *      某些库（如老版本的 lodash merge、jQuery.extend）处理它可能出问题。
 *    - 空数组分组得到空的 null 原型对象 `{}`（不是 undefined）。
 *    - 忘了"分组键不存在"的情况：某个分组可能一个元素都没有，此时该键根本不存在，
 *      读取得到 undefined，直接 .length 会崩。
 *    - Map.groupBy 返回的 Map 用 get 取值，键是引用类型时必须用**同一个引用**去取。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/20_grouping.js
 *
 * 【预期输出】
 *   依次演示 Object.groupBy 的基本用法与键转换规则、Map.groupBy 的差异、
 *   空数组与 missing key 的处理，以及三种手写分组实现与它们的性能/可读性对比。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Object.groupBy 基础
// ---------------------------------------------------------------------------

console.log('--- 1. Object.groupBy 基础 ---');

// 环境探测（便于在旧版本 Node 上也能跑完本文件）
const hasGroupBy = typeof Object.groupBy === 'function' && typeof Map.groupBy === 'function';
console.log('当前环境支持 Object.groupBy / Map.groupBy 吗？', hasGroupBy);
console.log('（Node 21+ 支持；本仓库用的 Node 24 是支持的）');

const items = [
  { name: '苹果', type: '水果', price: 5 },
  { name: '香蕉', type: '水果', price: 3 },
  { name: '白菜', type: '蔬菜', price: 2 },
  { name: '菠菜', type: '蔬菜', price: 4 },
  { name: '键盘', type: '数码', price: 199 },
  { name: '鼠标', type: '数码', price: 89 },
];
console.log('\n原始数据 =', JSON.stringify(items));

const byType = Object.groupBy(items, (item) => item.type);
console.log('\nObject.groupBy(items, i => i.type) =');
console.log(JSON.stringify(byType, null, 0));

// 各组的内容
console.log('\n各组元素数量：');
for (const [type, list] of Object.entries(byType)) {
  console.log(`  ${type}: ${list.length} 个 -> ${list.map((i) => i.name).join(', ')}`);
}

// 原数组没有被修改
console.log('\n原数组长度依然是', items.length, '（groupBy 不修改原数组）');

// ---------------------------------------------------------------------------
// 2. 返回值是一个"null 原型对象"
// ---------------------------------------------------------------------------

console.log('\n--- 2. 返回值的真面目 ---');

console.log('Object.prototype.toString 结果 =', Object.prototype.toString.call(byType));
console.log('原型是 null 吗？', Object.getPrototypeOf(byType) === null);
console.log('byType instanceof Object =', byType instanceof Object, '（false！因为它没有原型）');
console.log('Array.isArray(byType) =', Array.isArray(byType));

// null 原型意味着没有继承来的方法
try {
  byType.hasOwnProperty('水果');
} catch (err) {
  console.log('\n调用 byType.hasOwnProperty 会抛错：', err.constructor.name, '-', err.message);
}
console.log('用 Object.hasOwn 才是正确方式：', Object.hasOwn(byType, '水果'));
console.log("用 in 运算符也可以：", '水果' in byType, '，' + '饮料' + ' in byType =', '饮料' in byType);

// 想要普通对象可以转换
const plain = { ...byType };
console.log('\n{ ...byType } 得到普通对象：原型是 null 吗？', Object.getPrototypeOf(plain) === null);
console.log('它 instanceof Object =', plain instanceof Object);
console.log('JSON 输出一致 =', JSON.stringify(plain) === JSON.stringify(byType));

// 为什么设计成 null 原型？
console.log('\n为什么用 null 原型？');
console.log('  1. 避免与 Object.prototype 上的属性冲突（比如分组键叫 "constructor" 或 "toString"）；');
const tricky = Object.groupBy(['a', 'b'], (v) => (v === 'a' ? 'constructor' : 'toString'));
console.log('  分组键是 constructor / toString 时依然安全 =', JSON.stringify(tricky));
console.log('  2. 明确表达"这是一个纯数据字典，不是普通对象"。');

// ---------------------------------------------------------------------------
// 3. 分组键的转换规则（重要的坑）
// ---------------------------------------------------------------------------

console.log('\n--- 3. 分组键的转换规则 ---');

// (1) 数字键会被转成字符串
const numbers = [1, 2, 3, 4, 5, 6];
const byParity = Object.groupBy(numbers, (n) => (n % 2 === 0 ? 'even' : 'odd'));
console.log('按奇偶分组 =', JSON.stringify(byParity));

const byMod = Object.groupBy(numbers, (n) => n % 3); // 返回数字
console.log('\n按 n % 3 分组（键是数字） =', JSON.stringify(byMod));
console.log('键的类型都是字符串吗？', Object.keys(byMod).map((k) => typeof k).join(','));
console.log("byMod[0] 与 byMod['0'] 是同一组 =", byMod[0] === byMod['0']);

// (2) 用对象当键 -> 全部挤到一个组（经典坑）
const withObjKey = Object.groupBy(numbers, (n) => ({ bucket: n % 2 }));
console.log('\n用对象当分组键 =', JSON.stringify(withObjKey));
console.log('（对象的 toString() 都是 "[object Object]"，所以全部挤到一组）');
console.log('要保留对象键请用 Map.groupBy。');

// (3) 布尔键也会被转成字符串
const byBool = Object.groupBy(numbers, (n) => n > 3);
console.log('\n按 n > 3 分组 =', JSON.stringify(byBool));
console.log("键是 'true' / 'false' 字符串（JSON 里看不出来，类型是 string）");

// (4) 返回 undefined 会得到 'undefined' 组
const withUndef = Object.groupBy([1, 2, 3], (n) => (n === 2 ? undefined : 'ok'));
console.log("\n返回 undefined 时 =", JSON.stringify(withUndef), "（得到键为 'undefined' 的组）");

// (5) 空数组
const emptyGroup = Object.groupBy([], (x) => x);
console.log('\n空数组分组 =', JSON.stringify(emptyGroup), '，键的数量 =', Object.keys(emptyGroup).length);

// (6) 访问不存在的组
console.log("\n访问不存在的组 byType['饮料'] =", byType['饮料'], '（undefined）');
try {
  byType['饮料'].length;
} catch (err) {
  console.log('  直接取 length 会抛错：', err.constructor.name, '-', err.message);
}
console.log("  安全写法 (byType['饮料'] ?? []).length =", (byType['饮料'] ?? []).length);
console.log("  或用 byType['饮料']?.length ?? 0 =", byType['饮料']?.length ?? 0);

// ---------------------------------------------------------------------------
// 4. Map.groupBy：键可以是任意类型
// ---------------------------------------------------------------------------

console.log('\n--- 4. Map.groupBy ---');

const byTypeMap = Map.groupBy(items, (item) => item.type);
console.log('Map.groupBy 返回的是 Map 吗？', byTypeMap instanceof Map);
console.log('Map 内容 =', [...byTypeMap.entries()].map(([k, v]) => `${k}:${v.length}`).join(' | '));

// 用 Map 才能保留原始键类型
const byModMap = Map.groupBy(numbers, (n) => n % 3);
console.log('\n用数字键分组（Map 版本） =', [...byModMap.keys()].map((k) => `${typeof k}:${k}`).join(', '));
console.log("map.get(0) =", JSON.stringify(byModMap.get(0)));
console.log("map.get('0') =", byModMap.get('0'), "（Map 不做隐式转换，取不到）");

// 对象键才是 Map.groupBy 的杀手锏
const categories = [
  { id: 'fruit', label: '水果' },
  { id: 'tech', label: '数码' },
];
const catFruit = categories[0];
const catTech = categories[1];
const byCatObject = Map.groupBy(items, (item) => (item.type === '水果' ? catFruit : catTech));
console.log('\n用对象引用当键 =', [...byCatObject.entries()].map(([k, v]) => `${k.label}:${v.length}个`).join(' | '));
console.log('用同一个引用可以取回 =', byCatObject.get(catFruit).map((i) => i.name).join(','));
console.log('用"内容相同但不同引用"的对象取不到 =', byCatObject.get({ id: 'fruit', label: '水果' }));
console.log('（Map 的键按引用比较，这点与 Object 完全不同）');

// 按区间分组
const scores = [55, 78, 90, 43, 66, 88, 72];
const byGradeMap = Map.groupBy(scores, (s) => {
  if (s >= 90) return 'A';
  if (s >= 80) return 'B';
  if (s >= 60) return 'C';
  return 'D';
});
console.log('\n成绩 =', JSON.stringify(scores));
console.log('按等级分组（Map） =', [...byGradeMap.entries()].map(([g, list]) => `${g}:[${list.join(',')}]`).join(' '));

// 如果也要对象形式，转一下即可
const byGradeObj = Object.fromEntries(
  [...byGradeMap.entries()].map(([g, list]) => [g, list]),
);
console.log('转成对象 =', JSON.stringify(byGradeObj));

// ---------------------------------------------------------------------------
// 5. 分组的经典用途
// ---------------------------------------------------------------------------

console.log('\n--- 5. 分组的经典用途 ---');

// (1) 按日期分组统计
const records = [
  { date: '2024-01-01', amount: 100 },
  { date: '2024-01-01', amount: 200 },
  { date: '2024-01-02', amount: 150 },
  { date: '2024-01-02', amount: 50 },
  { date: '2024-01-03', amount: 300 },
];
const byDate = Object.groupBy(records, (r) => r.date);
console.log('按日期分组 =');
for (const [date, list] of Object.entries(byDate)) {
  const total = list.reduce((s, r) => s + r.amount, 0);
  console.log(`  ${date}: ${list.length} 笔，合计 ${total}`);
}

// (2) 分组 + 映射（先分组，再把每组变换成统计对象）
const summary = Object.fromEntries(
  Object.entries(byDate).map(([date, list]) => [
    date,
    { count: list.length, total: list.reduce((s, r) => s + r.amount, 0) },
  ]),
);
console.log('\n分组 + 汇总 =', JSON.stringify(summary));

// (3) 按状态分组订单
const orders = [
  { id: 'A1', status: 'paid' },
  { id: 'A2', status: 'unpaid' },
  { id: 'A3', status: 'paid' },
  { id: 'A4', status: 'refunded' },
  { id: 'A5', status: 'paid' },
];
const byStatus = Object.groupBy(orders, (o) => o.status);
console.log('\n按状态分组 =', Object.entries(byStatus).map(([s, l]) => `${s}(${l.length})`).join(' '));
console.log('已支付订单 id =', byStatus.paid.map((o) => o.id).join(','));

// (4) 按首字母索引（通讯录场景）
const contacts = ['Alice', 'Bob', 'Anna', 'Chris', 'Bill'];
const byInitial = Object.groupBy(contacts, (name) => name[0].toUpperCase());
console.log('\n按首字母索引 =', JSON.stringify(byInitial));

// (5) 分组后排序每个组
const byTypeSorted = Object.fromEntries(
  Object.entries(byType).map(([type, list]) => [type, [...list].sort((a, b) => b.price - a.price)]),
);
console.log('\n每组按价格降序 =');
for (const [type, list] of Object.entries(byTypeSorted)) {
  console.log(`  ${type}: ${list.map((i) => `${i.name}(${i.price})`).join(' > ')}`);
}

// ---------------------------------------------------------------------------
// 6. 手写实现一：reduce（最经典）
// ---------------------------------------------------------------------------

console.log('\n--- 6. 手写分组：reduce ---');

function groupByReduce(arr, keyFn) {
  return arr.reduce((acc, item, index, source) => {
    const key = keyFn(item, index, source);
    // ??= 只有左边是 null/undefined 时才赋值
    (acc[key] ??= []).push(item);
    return acc;
  }, {});
}

const manual1 = groupByReduce(items, (i) => i.type);
console.log('reduce 版本 =', JSON.stringify(manual1));
console.log('与 Object.groupBy 结果一致 =', JSON.stringify(manual1) === JSON.stringify(byType));

// 返回 Map 的版本
function groupByReduceMap(arr, keyFn) {
  return arr.reduce((m, item, index, source) => {
    const key = keyFn(item, index, source);
    const list = m.get(key);
    if (list) {
      list.push(item);
    } else {
      m.set(key, [item]);
    }
    return m;
  }, new Map());
}

const manual1Map = groupByReduceMap(items, (i) => i.type);
console.log('reduce + Map 版本 =', [...manual1Map.entries()].map(([k, v]) => `${k}:${v.length}`).join(' '));
console.log('Map 版本能保留对象键 =', groupByReduceMap(items, (i) => ({ t: i.type })).size, '（对象键转成 [object Object]，只剩 1 组）');

// ---------------------------------------------------------------------------
// 7. 手写实现二：forEach（最易读）
// ---------------------------------------------------------------------------

console.log('\n--- 7. 手写分组：forEach ---');

function groupByForEach(arr, keyFn) {
  const result = {};
  arr.forEach((item, index, source) => {
    const key = keyFn(item, index, source);
    if (!Object.hasOwn(result, key)) {
      result[key] = [];
    }
    result[key].push(item);
  });
  return result;
}

const manual2 = groupByForEach(items, (i) => i.type);
console.log('forEach 版本 =', JSON.stringify(manual2));

// 为什么用 Object.hasOwn 而不是 if (!result[key])？
// 因为普通对象会继承 Object.prototype 上的属性，"分组键恰好叫 toString" 时就会误判。
console.log('\n对比：用 if (!result[key]) 的"天真版"实现');
function groupByNaive(arr, keyFn) {
  const result = {};
  for (const [index, item] of arr.entries()) {
    const key = keyFn(item, index, arr);
    if (!result[key]) {
      // 陷阱：result['toString'] 从原型上继承到了函数，是真值，所以这里不会初始化
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

try {
  groupByNaive(['x'], () => 'toString');
} catch (err) {
  console.log('  分组键用 "toString" 时天真版会抛错：', err.constructor.name, '-', err.message);
}
console.log('  用 Object.hasOwn 的版本则正常 =', JSON.stringify(groupByForEach(['x'], () => 'toString')));

// 更安全的写法：用 Object.create(null) 或 Map（这正是 Object.groupBy 内部的做法）
console.log('  更安全的是用 Object.create(null) 或 Map：');
function groupBySafe(arr, keyFn) {
  const result = Object.create(null); // 无原型，不怕特殊键
  for (const [index, item] of arr.entries()) {
    const key = keyFn(item, index, arr);
    (result[key] ??= []).push(item);
  }
  return result;
}
const protoSafe = groupBySafe(['x'], () => '__proto__');
console.log('  Object.create(null) 版本 =', JSON.stringify(protoSafe));
console.log('  （这正是 Object.groupBy 内部返回 null 原型对象的原因之一）');

// ---------------------------------------------------------------------------
// 8. 手写实现三：兼容性包装（推荐放进项目工具库）
// ---------------------------------------------------------------------------

console.log('\n--- 8. 兼容性包装 ---');

// 优先用原生实现，不支持时退回手写版本
const groupBy = (arr, keyFn) =>
  typeof Object.groupBy === 'function'
    ? Object.groupBy(arr, keyFn)
    : groupBySafe(arr, keyFn);

const groupByMap = (arr, keyFn) =>
  typeof Map.groupBy === 'function'
    ? Map.groupBy(arr, keyFn)
    : groupByReduceMap(arr, keyFn);

console.log('groupBy 包装 =', JSON.stringify(groupBy(items, (i) => i.type)));
console.log('groupByMap 包装 =', [...groupByMap(items, (i) => i.type).entries()].map(([k, v]) => `${k}:${v.length}`).join(' '));

// 顺手加一个"分组并聚合"的工具，这才是业务里更常用的
function groupAndAggregate(arr, keyFn, valueFn, initValue, aggregateFn) {
  const result = Object.create(null);
  for (const [index, item] of arr.entries()) {
    const key = keyFn(item, index, arr);
    result[key] ??= initValue;
    result[key] = aggregateFn(result[key], valueFn(item, index, arr), item);
  }
  return result;
}

const totalByType = groupAndAggregate(
  items,
  (i) => i.type, // 分组键
  (i) => i.price, // 取什么值
  0, // 初始值
  (acc, value) => acc + value, // 如何合并
);
console.log('\n分组求和（每组总价） =', JSON.stringify(totalByType));

const maxByType = groupAndAggregate(
  items,
  (i) => i.type,
  (i) => i.price,
  -Infinity,
  (acc, value) => Math.max(acc, value),
);
console.log('分组求最大值 =', JSON.stringify(maxByType));

// ---------------------------------------------------------------------------
// 9. 性能与选型
// ---------------------------------------------------------------------------

console.log('\n--- 9. 选型建议 ---');

console.log('用 Object.groupBy：分组键是字符串/数字，且最终要当普通对象用（JSON 输出、按 key 取值）。');
console.log('用 Map.groupBy：分组键是对象/引用类型，或需要保留键的原始类型。');
console.log('手写 reduce 版本：需要兼容老环境，或需要在分组时做更复杂的初始化逻辑。');
console.log('手写 forEach 版本：可读性最好，适合团队里不熟悉 reduce 的场景。');

// 简单性能对比：原生 vs 手写
const bigData = Array.from({ length: 50_000 }, (_, i) => ({ id: i, type: `t${i % 10}` }));

let t0 = process.hrtime.bigint();
const nativeResult = typeof Object.groupBy === 'function'
  ? Object.groupBy(bigData, (x) => x.type)
  : groupBySafe(bigData, (x) => x.type);
let t1 = process.hrtime.bigint();

t0 = process.hrtime.bigint();
const manualResult = groupBySafe(bigData, (x) => x.type);
t1 = process.hrtime.bigint();
const manualMs = Number(t1 - t0) / 1e6;

t0 = process.hrtime.bigint();
const reduceResult = groupByReduce(bigData, (x) => x.type);
t1 = process.hrtime.bigint();

console.log('\n5 万条数据分组耗时（同一台机器上只作量级参考）：');
console.log('  原生 Object.groupBy 结果组数 =', Object.keys(nativeResult).length);
console.log('  Object.create(null) 手写版本 =', Number(manualMs).toFixed(2), 'ms，组数 =', Object.keys(manualResult).length);
console.log('  reduce 手写版本 =', Number(t1 - t0) / 1e6, 'ms，组数 =', Object.keys(reduceResult).length);
console.log('（原生实现通常更快，而且代码更短 —— 能用原生就用原生）');

// ---------------------------------------------------------------------------
// 10. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 10. 小结 ---');
console.log('Object.groupBy(arr, fn) -> null 原型对象，键被转成字符串/符号（数字变字符串）。');
console.log('Map.groupBy(arr, fn)    -> Map，键保留原始类型（对象键按引用比较）。');
console.log('两者都不修改原数组；组内元素保持原顺序，且与原数组共享引用。');
console.log('结果对象没有原型，判断属性用 Object.hasOwn 或 in，不要用 hasOwnProperty。');
console.log('不存在的组读取是 undefined，取 length 前记得用 ?? [] 兜底。');
console.log('Node 21+ / Chrome 117+ 才有原生支持；老环境用手写 reduce 版本兜底。');
