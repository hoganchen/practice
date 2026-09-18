/**
 * ============================================================================
 * 知识点：属性遍历顺序 —— 整数键 → 字符串键 → Symbol 键
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】进阶
 * 【前置知识】09_objects/05_keys_values_entries.js、09_objects/13_object_methods.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    对象的属性并不总是按"你书写的顺序"遍历。ES2015 起，规范明确定义了
 *    "自有属性键"（OwnPropertyKeys）的返回顺序，规则是**三分组**：
 *      第一组：整数索引键（array index），按数值**升序**排列
 *      第二组：其余字符串键，按**插入顺序**排列
 *      第三组：Symbol 键，按**插入顺序**排列
 *    这个顺序对所有相关 API 都生效，包括 for...in、Object.keys、Object.values、
 *    Object.entries、JSON.stringify、Object.getOwnPropertyNames、Reflect.ownKeys、
 *    对象展开 ...、Object.assign 的目标写入顺序。
 *
 * 2. 为什么需要
 *    依赖"顺序"的代码到处都有：按顺序渲染表格列、生成稳定签名的序列化、
 *    diff 两份配置。知道规则才能判断"这个顺序能不能依赖"。
 *    好消息是：规范明确定了，所以是**可以依赖**的（这是 ES2015 的一大改进，
 *    在此之前各引擎实现不一致）。
 *
 * 3. 核心语法要点
 *    (1) "整数索引"的严格定义：字符串键，且其数值形式是 0 <= n < 2^32 - 1 的整数，
 *        并且转成字符串后与自身完全一致（"01"、"1.5"、"-1"、"1e2" 都不算）。
 *    (2) 整数键一定排在字符串键前面，且按数值升序——哪怕你后写。
 *    (3) 字符串键之间保持插入顺序；覆盖已有键不会改变它的位置。
 *    (4) 删除再重新添加一个属性，它会跑到该分组的**末尾**（位置被重置）。
 *    (5) Symbol 键永远在最后，且不会被 Object.keys / JSON.stringify 看到。
 *    (6) for...in 的顺序 = 自有属性顺序，然后沿原型链依次向上（同一属性只出现一次）。
 *
 * 4. 常见陷阱
 *    (1) 用对象当"有序字典"，键是数字字符串时顺序被重排。
 *        需要严格顺序时用 Map（Map 保持纯插入顺序）或数组。
 *    (2) 误以为"后定义的属性一定在后面"：数字键会被提前。
 *    (3) 以为 for...in 的顺序和 Object.keys 一定一样——对于自有属性是一样的，
 *        但 for...in 还会带上原型链上的属性。
 *    (4) JSON.stringify 用同样的顺序，但会跳过 Symbol 键和值为 undefined 的键。
 *    (5) 用 Object.freeze 之后顺序不变；顺序只跟"键本身"和"插入时间"有关。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/14_property_order.js
 *
 * 【预期输出】
 *   分 6 个小节，通过对比书写顺序与遍历顺序，验证三分组规则及其边界。
 * ============================================================================
 */

console.log('--- 1. 三分组规则总览 ---');

const mixed = {};
// 故意用"乱序"写入，观察遍历时会怎样重排
mixed.b = '字符串 b'; // 第二组
mixed[2] = '整数 2'; // 第一组
mixed.a = '字符串 a'; // 第二组
mixed[1] = '整数 1'; // 第一组
mixed[Symbol('s1')] = 'symbol 1'; // 第三组
mixed['10'] = '整数 10'; // 第一组
mixed.c = '字符串 c'; // 第二组
mixed[Symbol('s2')] = 'symbol 2'; // 第三组

console.log('书写顺序：b, 2, a, 1, [s1], "10", c, [s2]');
console.log('Object.keys 得到      =', JSON.stringify(Object.keys(mixed)));
console.log('（整数键 1, 2, 10 被提前并升序排列）');
console.log('全部自有键 Reflect.ownKeys =', Reflect.ownKeys(mixed).map(String));
console.log('Symbol 键在最后      =', Object.getOwnPropertySymbols(mixed).map(String));

console.log('\n--- 2. 什么才算"整数索引键" ---');

const edge = {};
// 以下都算整数索引键（会被提前并升序）
edge[0] = 'zero';
edge['7'] = '十进制 7'; // 字符串 "7" 也是整数索引
edge[4294967294] = '2^32 - 2'; // 上界内
// 以下都**不算**整数索引键（留在第二组，保持插入顺序）
edge['01'] = '前导零';
edge['1.5'] = '小数';
edge['-1'] = '负数';
edge['1e2'] = '科学计数法';
edge[' 3'] = '带空格';
edge['4294967295'] = '2^32 - 1'; // 恰好等于上界，不算
edge['4294967296'] = '2^32'; // 超出上界，不算
edge['abc'] = '普通字符串';

console.log('Object.keys 顺序：');
Object.keys(edge).forEach((k, i) => console.log(`   ${i}: ${JSON.stringify(k)}`));
// 规范的"数组索引"（array index）定义：字符串键，其数值形式是整数，
// 且满足 0 <= n < 2^32 - 1 = 4294967295。用这个定义才能准确判断哪些键会被提前。
const ARRAY_INDEX_LIMIT = 2 ** 32 - 1; // 4294967295，上界本身不算
const isArrayIndex = (key) => {
  const n = Number(key);
  return Number.isInteger(n) && n >= 0 && n < ARRAY_INDEX_LIMIT && String(n) === key;
};

console.log('\n以上键之中，被规范认定为"数组索引"因而会被提前的 =',
  JSON.stringify(Object.keys(edge).filter(isArrayIndex)));
console.log('被留在字符串组的（注意上界 4294967295 与 4294967296 都超出范围） =',
  JSON.stringify(Object.keys(edge).filter((k) => !isArrayIndex(k))));

console.log('\n--- 3. 字符串键保持插入顺序，且覆盖不改位置 ---');

const strOrder = {};
strOrder.zebra = 1;
strOrder.apple = 2;
strOrder.mango = 3;
console.log('插入顺序 zebra, apple, mango =', JSON.stringify(Object.keys(strOrder)));

// 覆盖一个已有的键，它的位置不会变（不会跑到末尾）
strOrder.zebra = 999;
console.log('覆盖 zebra 之后仍 =', JSON.stringify(Object.keys(strOrder)));

// 但删除再重新添加，位置会被重置到该组的末尾
delete strOrder.zebra;
strOrder.zebra = 1000;
console.log('删除再添加 zebra 之后 =', JSON.stringify(Object.keys(strOrder)));

// 整数键同理：删除再添加，会按数值重新排到整数组里正确的位置
const intOrder = { b: 1, 3: 'three', a: 2, 1: 'one' };
console.log('\n整数键删除再添加：');
console.log('   初始 =', JSON.stringify(Object.keys(intOrder)));
delete intOrder[3];
console.log('   删除 3 后 =', JSON.stringify(Object.keys(intOrder)));
intOrder[3] = 'three again';
console.log('   重新添加 3 后 =', JSON.stringify(Object.keys(intOrder)), '（又按数值升序归位）');

console.log('\n--- 4. 所有相关 API 都遵循同一顺序 ---');

const orderDemo = {};
orderDemo.z = 1;
orderDemo[5] = 'five';
orderDemo.a = 2;
orderDemo[1] = 'one';
orderDemo[Symbol('sym')] = 'symbol';

console.log('同一个对象，各种 API 的输出顺序：');
console.log('   Object.keys               =', JSON.stringify(Object.keys(orderDemo)));
console.log('   Object.values             =', JSON.stringify(Object.values(orderDemo)));
console.log('   Object.entries            =', JSON.stringify(Object.entries(orderDemo)));
console.log('   Object.getOwnPropertyNames=', JSON.stringify(Object.getOwnPropertyNames(orderDemo)));
console.log('   Reflect.ownKeys           =', JSON.stringify(Reflect.ownKeys(orderDemo).map(String)));
console.log('   JSON.stringify            =', JSON.stringify(orderDemo));
console.log('   {...obj}                  =', JSON.stringify({ ...orderDemo }));
console.log('   Object.assign({}, obj)    =', JSON.stringify(Object.assign({}, orderDemo)));

// for...in 也遵循同样顺序（对自有属性而言）
const forInKeys = [];
for (const k in orderDemo) forInKeys.push(k);
console.log('   for...in                  =', JSON.stringify(forInKeys));

// for...of 无法直接遍历对象，但可以配合 Object.keys
const ofKeys = [];
for (const k of Object.keys(orderDemo)) ofKeys.push(k);
console.log('   for...of Object.keys      =', JSON.stringify(ofKeys));

console.log('\n--- 5. for...in 与原型链的顺序 ---');

const proto = {};
proto.p2 = '原型 2';
proto.p1 = '原型 1';
proto[100] = '原型的整数键';

const inst = Object.create(proto);
inst.own2 = '自有 2';
inst[50] = '自有的整数键';
inst.own1 = '自有 1';

console.log('原型上的键顺序   =', JSON.stringify(Object.keys(proto)));
console.log('自有键顺序       =', JSON.stringify(Object.keys(inst)));
console.log('for...in 完整顺序 =');
const seen = [];
for (const k in inst) seen.push(k);
console.log('   ', JSON.stringify(seen));
console.log('（先遍历自有属性：整数键 50 -> own2 -> own1；');
console.log('  再沿原型链遍历：整数键 100 -> p2 -> p1）');

// 被"遮蔽"的属性只出现一次
inst.own1 = inst.own1; // 无意义，只是提醒：自有属性会遮蔽同名的原型属性
console.log('   own1 在自有和原型上都有吗 =', Object.hasOwn(inst, 'own1'), Object.hasOwn(proto, 'own1'));

console.log('\n--- 6. 实践建议与替代方案 ---');

// 场景 A：数字字符串键被重排，导致顺序不符合预期
const wrongDict = {};
wrongDict[10] = '第十项';
wrongDict[2] = '第二项';
wrongDict[33] = '第三十三项';
console.log('用对象当有序字典（顺序被打乱）：');
console.log('   写入顺序 10, 2, 33 -> 遍历顺序 =', JSON.stringify(Object.keys(wrongDict)));

// 场景 B：用 Map 保持纯插入顺序
const rightMap = new Map();
rightMap.set(10, '第十项');
rightMap.set(2, '第二项');
rightMap.set(33, '第三十三项');
console.log('用 Map（严格保持插入顺序）：');
console.log('   写入顺序 10, 2, 33 -> 遍历顺序 =', JSON.stringify([...rightMap.keys()]));
console.log('   （Map 的键可以是任意类型，不受字符串化影响）');

// 场景 C：用数组显式表达顺序
const orderedList = [{ id: 10, label: '第十项' }, { id: 2, label: '第二项' }];
console.log('用数组表达顺序 =', JSON.stringify(orderedList.map((o) => o.id)));

// 场景 D：把"顺序"显式存成一个字段，不依赖对象的隐式顺序
const explicit = {
  order: ['c', 'a', 'b'],
  items: { a: 1, b: 2, c: 3 },
};
console.log('显式存顺序字段 =', JSON.stringify(explicit.order));

// 场景 E：想让数字键保持插入顺序，可以加个前缀变成非整数键
const prefixed = {};
prefixed['id_10'] = '第十项';
prefixed['id_2'] = '第二项';
prefixed['id_33'] = '第三十三项';
console.log('加前缀后保持插入顺序 =', JSON.stringify(Object.keys(prefixed)));

// 序列化成稳定格式（用于签名 / 缓存键）：显式按 key 排序
const stableStringify = (obj) =>
  JSON.stringify(
    Object.keys(obj)
      .sort()
      .reduce((acc, k) => {
        acc[k] = obj[k];
        return acc;
      }, {}),
  );
const a = { b: 1, a: 2, 10: 3 };
const b = { a: 2, 10: 3, b: 1 }; // 书写顺序不同，但键集合相同
console.log('\n稳定序列化：');
console.log('   a 的原始序列化 =', JSON.stringify(a));
console.log('   b 的原始序列化 =', JSON.stringify(b));
console.log('   a 的稳定序列化 =', stableStringify(a));
console.log('   b 的稳定序列化 =', stableStringify(b));
console.log('   两者稳定序列化相同 =', stableStringify(a) === stableStringify(b));

console.log('\n全部演示完毕。');
