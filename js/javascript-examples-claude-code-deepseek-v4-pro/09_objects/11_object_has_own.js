/**
 * ============================================================================
 * 知识点：Object.hasOwn（新）与 hasOwnProperty（旧）—— 自有属性判断的安全性
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】进阶
 * 【前置知识】09_objects/02_property_access.js、09_objects/10_object_create.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    判断"某个属性是不是对象自己的"，历史上有两种写法：
 *      obj.hasOwnProperty('key')                        // 旧：Object.prototype 上的方法
 *      Object.prototype.hasOwnProperty.call(obj, 'key') // 旧：借调，避开遮蔽
 *    ES2022 引入了一个专门的静态方法：
 *      Object.hasOwn(obj, 'key')                        // 新：推荐写法
 *    三者语义相同：只检查**自有属性**，不查原型链。
 *
 * 2. 为什么需要
 *    obj.hasOwnProperty(...) 有两个致命弱点：
 *      (1) 可以被遮蔽：如果对象自己有个叫 hasOwnProperty 的属性（用户数据里完全可能
 *          出现这个名字），那 obj.hasOwnProperty 就不是函数了，调用直接抛 TypeError。
 *      (2) 对象可能没有原型：Object.create(null) 创建的对象根本没有 hasOwnProperty。
 *    旧的标准解法是 Object.prototype.hasOwnProperty.call(obj, key)，
 *    但它又长又难读。Object.hasOwn 正是为了同时解决这两个问题而设计的。
 *
 * 3. 核心语法要点
 *    (1) Object.hasOwn(obj, key) —— key 可以是字符串或 Symbol；
 *        返回布尔值；不查原型链。
 *    (2) 第一个参数可以是原始值：会被自动装箱，所以 Object.hasOwn('abc', '0') 是 true。
 *    (3) 第一个参数是 null / undefined 时抛 TypeError（这点与 hasOwnProperty.call 相同）。
 *    (4) 与 in 运算符的对比：'key' in obj 会查整条原型链，包括 Object.prototype。
 *    (5) 与 Object.keys 的关系：Object.hasOwn 相当于 Object.keys(obj).includes(key)，
 *        但不创建临时数组，性能更好。
 *    (6) 与 Object.getOwnPropertyDescriptor 的关系：那是拿描述符，
 *        想同时知道"属性是否可枚举"就用它。
 *
 * 4. 常见陷阱
 *    (1) 用 `if (obj[key])` 判断属性存在是错的：值为 0 / '' / false / null 时也会判为"不存在"。
 *    (2) 用 `obj[key] !== undefined` 也有漏洞：属性存在但值就是 undefined 时判断错误。
 *    (3) for...in 遍历时，一定要用 Object.hasOwn 过滤掉原型链上的属性。
 *    (4) in 运算符会把 'toString'、'constructor' 这类内置属性也判为存在，
 *        做"配置校验"时会导致误判。
 *    (5) Object.hasOwn 只说明"存在"，不说明"可枚举"；
 *        defineProperty 定义的不可枚举属性也会返回 true。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/11_object_has_own.js
 *
 * 【预期输出】
 *   分 6 个小节，对比四种判断方式的差异，并演示遮蔽与无原型两个经典崩溃场景。
 * ============================================================================
 */

console.log('--- 1. 三种"自有属性"判断写法，结果一致 ---');

const obj = { name: '张三', age: 20 };

console.log("Object.hasOwn(obj, 'name')                          =", Object.hasOwn(obj, 'name'));
console.log("obj.hasOwnProperty('name')                          =", obj.hasOwnProperty('name'));
console.log(
  "Object.prototype.hasOwnProperty.call(obj, 'name')   =",
  Object.prototype.hasOwnProperty.call(obj, 'name'),
);
console.log("三者结论相同，但 Object.hasOwn 最简洁：'age' ->", Object.hasOwn(obj, 'age'), obj.hasOwnProperty('age'));

console.log('\n--- 2. 与 in 运算符的关键区别：是否查原型链 ---');

// 普通对象都继承自 Object.prototype，所以内置方法都能被 in 找到。
console.log("'toString' in obj                   =", 'toString' in obj, '（in 会查原型链）');
console.log("Object.hasOwn(obj, 'toString')      =", Object.hasOwn(obj, 'toString'));
console.log("obj.hasOwnProperty('toString')      =", obj.hasOwnProperty('toString'));

// 自定义原型同理
const proto = { inherited: '来自原型' };
const child = Object.create(proto);
child.own = '自有的';
console.log("'inherited' in child                =", 'inherited' in child, '（in 找到了原型上的）');
console.log("Object.hasOwn(child, 'inherited')   =", Object.hasOwn(child, 'inherited'));
console.log("Object.hasOwn(child, 'own')         =", Object.hasOwn(child, 'own'));

// 用 in 做配置校验时的经典误判
const config = { timeout: 1000 };
const requiredKeys = ['timeout', 'constructor', 'toString'];
console.log('\n用 in 做配置项校验（会误判）：');
for (const k of requiredKeys) {
  // constructor 和 toString 明明没配，in 却说是存在的
  console.log(`   in 判断 ${k.padEnd(12)} -> ${k in config}`);
}
console.log('用 Object.hasOwn 做同样的校验（正确）：');
for (const k of requiredKeys) {
  console.log(`   hasOwn 判断 ${k.padEnd(12)} -> ${Object.hasOwn(config, k)}`);
}

console.log('\n--- 3. 陷阱一：hasOwnProperty 被遮蔽 ---');

// 假设这个对象来自 JSON.parse(用户输入) 或接口返回，键是不可控的。
const userData = {
  name: '张三',
  // 用户数据里恰好有一个叫 hasOwnProperty 的字段
  hasOwnProperty: '我是个字符串，不是函数',
};

console.log('userData.hasOwnProperty 的类型 =', typeof userData.hasOwnProperty);
// 旧写法在这里直接崩溃
try {
  console.log(userData.hasOwnProperty('name'));
} catch (err) {
  console.log('旧写法报错：', err.name, '-', err.message);
}

// 旧写法的补救：从 Object.prototype 上借调原始方法
console.log(
  "借调写法 Object.prototype.hasOwnProperty.call(userData, 'name') =",
  Object.prototype.hasOwnProperty.call(userData, 'name'),
);
// 注意：这样判断"hasOwnProperty 自己"也正确
console.log(
  "借调判断 'hasOwnProperty' 自身 =",
  Object.prototype.hasOwnProperty.call(userData, 'hasOwnProperty'),
);

// 新写法：完全不受遮蔽影响，写法也最自然
console.log("Object.hasOwn(userData, 'name')          =", Object.hasOwn(userData, 'name'));
console.log("Object.hasOwn(userData, 'hasOwnProperty') =", Object.hasOwn(userData, 'hasOwnProperty'));

console.log('\n--- 4. 陷阱二：无原型对象没有 hasOwnProperty ---');

// 用 Object.create(null) 做的"安全字典"，原型链为空。
const safeDict = Object.create(null);
safeDict.key1 = '值1';

console.log('原型 =', Object.getPrototypeOf(safeDict));
console.log('typeof safeDict.hasOwnProperty =', typeof safeDict.hasOwnProperty);
try {
  safeDict.hasOwnProperty('key1');
} catch (err) {
  console.log('旧写法报错：', err.name, '-', err.message);
}

// 借调写法可以工作（因为 call 的 this 是 safeDict，方法本体来自 Object.prototype）
console.log(
  "借调写法可用 =",
  Object.prototype.hasOwnProperty.call(safeDict, 'key1'),
);

// 新写法同样可用，而且不需要记住那一长串
console.log("Object.hasOwn(safeDict, 'key1') =", Object.hasOwn(safeDict, 'key1'));

// 顺带一提：无原型对象连 in 都只能查自己，因为原型链只有自己
console.log("'key1' in safeDict       =", 'key1' in safeDict);
console.log("'toString' in safeDict   =", 'toString' in safeDict, '（没有原型链可穿透）');

console.log('\n--- 5. 四种"属性存在性"判断的对照 ---');

const sample = { a: 1, b: undefined };
Object.defineProperty(sample, 'c', { value: 3, enumerable: false });

// 从 sample 的原型上再挂一个属性
const sampleProto = Object.create(Object.prototype);
sampleProto.fromProto = 'x';
Object.setPrototypeOf(sample, sampleProto);

const rows = [
  { label: "Object.hasOwn(sample, 'a')", value: Object.hasOwn(sample, 'a') },
  { label: "Object.hasOwn(sample, 'b')  (值为 undefined)", value: Object.hasOwn(sample, 'b') },
  { label: "Object.hasOwn(sample, 'c')  (不可枚举)", value: Object.hasOwn(sample, 'c') },
  { label: "Object.hasOwn(sample, 'fromProto')", value: Object.hasOwn(sample, 'fromProto') },
  { label: "Object.hasOwn(sample, 'toString')", value: Object.hasOwn(sample, 'toString') },
];
for (const r of rows) console.log(`   ${r.label.padEnd(50)} = ${r.value}`);

console.log('\n   对比其它判断方式：');
console.log("   'a' in sample                    =", 'a' in sample, '（含原型链）');
console.log("   'fromProto' in sample            =", 'fromProto' in sample);
console.log("   'toString' in sample             =", 'toString' in sample);
console.log("   Boolean(sample.b)                =", Boolean(sample.b), '（值为 undefined，判成"不存在"）');
console.log("   sample.b !== undefined           =", sample.b !== undefined, '（也判错）');
console.log("   Object.keys(sample).includes('c')=", Object.keys(sample).includes('c'), '（key 不在，因为不可枚举）');
console.log(
  '   Object.getOwnPropertyNames 里有 c 吗 =',
  Object.getOwnPropertyNames(sample).includes('c'),
  '（这个能看到不可枚举属性）',
);

console.log('\n--- 6. 实战：安全的 for...in 遍历与键校验 ---');

// for...in 会枚举"整条原型链上所有可枚举属性"，必须用 hasOwn 过滤。
const baseOptions = { theme: 'dark' };
const options = Object.create(baseOptions);
options.lang = 'zh';
options.autoSave = true;

console.log('不做过滤的 for...in（会带上原型上的 theme）：');
for (const k in options) {
  console.log('   ', k);
}

console.log('用 Object.hasOwn 过滤后（只剩自有的）：');
for (const k in options) {
  if (Object.hasOwn(options, k)) {
    console.log('   ', k, '=', options[k]);
  }
}

// 更好的做法：直接用 Object.keys / Object.entries，它们本来就只返回自有可枚举属性。
console.log('直接用 Object.entries =', JSON.stringify(Object.entries(options)));
console.log('（所以现代代码里 for...in 基本被 Object.keys/entries 取代了）');

// 实战：写一个"只提取白名单字段"的工具函数
function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    // 用 hasOwn 而不是 in，避免把原型上的字段也当成数据取出来
    if (Object.hasOwn(obj, k)) out[k] = obj[k];
  }
  return out;
}
console.log("pick(obj, ['name', 'toString', 'notExist']) =", JSON.stringify(pick(obj, ['name', 'toString', 'notExist'])));

// 实战：区分"字段没传"与"字段传了 undefined"
function withDefault(input, key, fallback) {
  // 用 hasOwn 才能区分"没有这个字段"和"字段值就是 undefined"
  return Object.hasOwn(input, key) ? input[key] : fallback;
}
console.log("字段不存在 withDefault({}, 'x', '默认值')        =", withDefault({}, 'x', '默认值'));
console.log("字段为 undefined withDefault({x: undefined}, 'x', '默认值') =", withDefault({ x: undefined }, 'x', '默认值'));
console.log("字段有值 withDefault({x: 0}, 'x', '默认值')      =", withDefault({ x: 0 }, 'x', '默认值'));

// 实战：Symbol 键也能判断
const secret = Symbol('secret');
const withSymbol = { [secret]: 'symbol 值' };
console.log('Object.hasOwn(withSymbol, secret) =', Object.hasOwn(withSymbol, secret));

// 边界：第一个参数是原始值时会被装箱
console.log("Object.hasOwn('abc', '0')  =", Object.hasOwn('abc', '0'), '（字符串会被装箱）');
console.log("Object.hasOwn('abc', 0)    =", Object.hasOwn('abc', 0), '（数字会转成字符串键）');
try {
  Object.hasOwn(null, 'x');
} catch (err) {
  console.log('Object.hasOwn(null, "x") 报错：', err.name, '-', err.message);
}

console.log('\n全部演示完毕。');
