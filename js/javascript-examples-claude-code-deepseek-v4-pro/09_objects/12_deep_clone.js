/**
 * ============================================================================
 * 知识点：深拷贝 —— structuredClone / JSON 方式 / 手写递归的各自局限
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】高级
 * 【前置知识】09_objects/04_spread_merge.js、09_objects/06_object_assign.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    浅拷贝只复制第一层，嵌套的引用仍然共享。深拷贝（deep clone）会**递归**复制
 *    所有层级，得到一棵与原对象完全独立的树。三种主流方案：
 *      (1) structuredClone(value)      —— 平台内置（浏览器 / Node 17+），最推荐。
 *      (2) JSON.parse(JSON.stringify(value)) —— 一行搞定，但信息损失严重。
 *      (3) 手写递归函数                —— 最灵活，能定制如何处理特殊类型。
 *
 * 2. 为什么需要
 *    (1) 不可变数据流：React/Redux 里要基于旧状态生成新状态，绝不能改到旧对象。
 *    (2) 局部修改：接口返回的数据要临时改几个字段但不想污染缓存。
 *    (3) 跨线程/跨上下文传递：structuredClone 正是 postMessage 使用的算法。
 *
 * 3. 核心语法要点
 *    (1) structuredClone 支持的：普通对象、数组、Date、RegExp、Map、Set、
 *        ArrayBuffer/TypedArray、Blob、File、循环引用、Symbol（仅作为"键"会丢，
 *        值里的 Symbol 会抛错）。
 *    (2) structuredClone 不支持的（会抛 DataCloneError）：函数、DOM 节点、
 *        类实例的 prototype（变成普通对象）、getter/setter（求值成数据属性）、
 *        以及任何带原型的自定义对象的方法。
 *    (3) structuredClone 的第二个参数可以传 { transfer: [buf] } 做"转移"而非复制。
 *    (4) JSON 方式的丢失清单：undefined、函数、Symbol、BigInt（抛错）、
 *        Date（变字符串）、RegExp（变空对象）、Map/Set（变空对象）、NaN/Infinity（变 null）。
 *    (5) 手写递归要点：区分数组/对象、处理循环引用（用 WeakMap 记录已拷贝的映射）、
 *        保留 Date/RegExp/Map/Set 等特殊类型的语义。
 *
 * 4. 常见陷阱
 *    (1) 以为 JSON 方式是最佳实践——它是最容易"静默丢数据"的方式。
 *    (2) structuredClone 会丢掉原型，class 实例克隆后变成普通对象，方法没了。
 *    (3) 深拷贝可能非常慢，大对象/高频调用会成为性能瓶颈；能浅拷贝就别深拷贝。
 *    (4) 深拷贝不等于"不可变"：它只是复制，不提供写保护（要写保护用 Object.freeze）。
 *    (5) 手写递归如果不处理循环引用，会直接栈溢出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/12_deep_clone.js
 *
 * 【预期输出】
 *   分 6 个小节，逐个演示三种方案的用法与丢失项，并给出可用的手写实现。
 * ============================================================================
 */

/** 安全执行并打印结果或错误名，方便演示"会抛错"的方案。 */
function safe(label, fn) {
  try {
    const v = fn();
    console.log(`   ${label} ->`, typeof v === 'string' ? v : JSON.stringify(v));
  } catch (err) {
    console.log(`   ${label} -> 抛错（${err.name}）`);
  }
}

console.log('--- 1. 先确认浅拷贝的问题 ---');

const source = {
  title: '配置',
  nested: { a: 1, deeper: { b: 2 } },
  list: [1, 2, 3],
};

const shallow = { ...source };
shallow.nested.a = 999;
console.log('浅拷贝后原对象被连累：source.nested.a =', source.nested.a);

// 重新构造一份干净的源对象，供后面测试用
const makeSource = () => ({
  title: '配置',
  nested: { a: 1, deeper: { b: 2 } },
  list: [1, 2, 3],
});

console.log('\n--- 2. structuredClone：最推荐的方案 ---');

const s1 = makeSource();
const clone1 = structuredClone(s1);

// 修改任意层级，都不会影响原对象
clone1.nested.a = 999;
clone1.nested.deeper.b = 888;
clone1.list.push(4);
console.log('克隆体 =', JSON.stringify(clone1));
console.log('原对象 =', JSON.stringify(s1), '（纹丝不动）');
console.log('嵌套对象不是同一个引用 =', clone1.nested !== s1.nested);

// 支持的类型
const rich = {
  date: new Date('2024-01-01T00:00:00Z'),
  regex: /abc/gi,
  map: new Map([['k', 'v']]),
  set: new Set([1, 2]),
  typed: new Uint8Array([1, 2, 3]),
  buf: new ArrayBuffer(8),
};
const richClone = structuredClone(rich);
console.log('Date 被正确克隆 =', richClone.date instanceof Date, richClone.date.toISOString());
console.log('RegExp 被正确克隆 =', richClone.regex instanceof RegExp, String(richClone.regex));
console.log('Map 被正确克隆 =', richClone.map instanceof Map, richClone.map.get('k'));
console.log('Set 被正确克隆 =', richClone.set instanceof Set, [...richClone.set]);
console.log('TypedArray 被正确克隆 =', richClone.typed instanceof Uint8Array, [...richClone.typed]);
console.log('引用已经不同 =', richClone.map !== rich.map);

// 循环引用也能处理
const circular = { name: '自己' };
circular.self = circular;
const circularClone = structuredClone(circular);
console.log('循环引用克隆成功 =', circularClone.self === circularClone, '（指向克隆体自身，不是原对象）');

console.log('\n--- 3. structuredClone 的局限 ---');

// (1) 函数不能克隆
safe('克隆含函数的对象', () => structuredClone({ fn: () => 1 }));

// (2) 类实例的原型会丢失
class User {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return `你好，${this.name}`;
  }
}
const u = new User('张三');
const uClone = structuredClone(u);
console.log('克隆后 name 保留 =', uClone.name);
console.log('克隆后还是 User 实例吗 =', uClone instanceof User, '（原型丢了）');
console.log('克隆后还有 greet 方法吗 =', typeof uClone.greet);

// (3) getter 会被求值成普通数据属性
const withGetter = {
  first: '张',
  last: '三',
  get full() {
    return this.first + this.last;
  },
};
const getterClone = structuredClone(withGetter);
console.log('克隆后 full =', getterClone.full);
console.log('是 getter 还是数据属性 =', JSON.stringify(Object.getOwnPropertyDescriptor(getterClone, 'full')));

// (4) Symbol 作为"值"不能克隆（作为键也会丢失）
const symValue = Symbol('v');
safe('克隆 Symbol 值', () => structuredClone({ s: symValue }));
const symKeyClone = structuredClone({ [Symbol('k')]: 1, normal: 2 });
console.log('Symbol 键被丢弃 =', JSON.stringify(Object.keys(symKeyClone)), '，Symbol 数量 =', Object.getOwnPropertySymbols(symKeyClone).length);

// (5) 可用 transfer 转移 ArrayBuffer（原 buffer 会被"清空"）
const buf = new ArrayBuffer(16);
const transferred = structuredClone(buf, { transfer: [buf] });
console.log('转移后新 buffer 字节数 =', transferred.byteLength);
console.log('原 buffer 被清空，字节数 =', buf.byteLength);

console.log('\n--- 4. JSON.parse(JSON.stringify(x))：一行但会丢数据 ---');

const lossy = {
  str: '文本',
  num: 42,
  bool: false,
  nul: null,
  undef: undefined,
  fn: function () {},
  sym: Symbol('s'),
  nan: NaN,
  inf: Infinity,
  date: new Date('2024-01-01T00:00:00Z'),
  regex: /abc/,
  map: new Map([['k', 'v']]),
  set: new Set([1]),
  nested: { deep: { value: 1 } },
  big: 10n,
};

// 大部分丢失项会"静默"发生，只有 BigInt 会抛错。
let jsonClone;
try {
  jsonClone = JSON.parse(JSON.stringify(lossy));
} catch (err) {
  console.log('含 BigInt 时报错：', err.name, '-', err.message.slice(0, 50), '...');
  // 去掉 BigInt 再试一次
  const { big, ...withoutBig } = lossy;
  jsonClone = JSON.parse(JSON.stringify(withoutBig));
}

console.log('JSON 克隆结果 =', JSON.stringify(jsonClone));
console.log('逐项对比：');
console.log('   str   保留 =', jsonClone.str);
console.log('   num   保留 =', jsonClone.num);
console.log('   bool  保留 =', jsonClone.bool);
console.log('   nul   保留 =', jsonClone.nul);
console.log('   undef 丢了 =', 'undef' in jsonClone === false, '（undefined 会被整体丢弃）');
console.log('   fn    丢了 =', typeof jsonClone.fn);
console.log('   sym   丢了 =', typeof jsonClone.sym);
console.log('   NaN   变成了 null =', jsonClone.nan === null);
console.log('   Infinity 变成了 null =', jsonClone.inf === null);
console.log('   date  变成了字符串 =', typeof jsonClone.date, jsonClone.date);
console.log('   regex 变成了空对象 =', JSON.stringify(jsonClone.regex));
console.log('   map   变成了空对象 =', JSON.stringify(jsonClone.map));
console.log('   set   变成了空对象 =', JSON.stringify(jsonClone.set));
console.log('   nested 深层的值是对的 =', jsonClone.nested.deep.value, '（这点 JSON 方式没问题）');

// 循环引用也不能用 JSON 方式
const circular2 = { name: 'x' };
circular2.self = circular2;
safe('JSON 方式克隆循环引用', () => JSON.parse(JSON.stringify(circular2)));

console.log('\n--- 5. 手写递归深拷贝 ---');

/**
 * 手写深拷贝。
 * 设计要点：
 *   1. seen 用 Map 记录 "原对象 -> 克隆体"，既解决循环引用，也保证同一对象只克隆一次。
 *   2. 按类型分派：Date / RegExp / Map / Set 各自有语义，不能一律当普通对象处理。
 *   3. 数组要单独判断（Object.keys 数组会得到下标字符串，构造出来的不是数组）。
 *   4. Symbol 键需要单独取（Object.keys 看不到）。
 */
function deepClone(value, seen = new Map()) {
  // 原始值（含 null、undefined、函数）直接返回。
  // 函数按"引用共享"处理——这是与 structuredClone 不同的取舍：我们选择不抛错。
  if (value === null || typeof value !== 'object') return value;

  // 循环引用：如果这个对象已经克隆过，直接返回之前的克隆体
  if (seen.has(value)) return seen.get(value);

  // Date
  if (value instanceof Date) {
    const d = new Date(value.getTime());
    seen.set(value, d);
    return d;
  }

  // RegExp
  if (value instanceof RegExp) {
    const r = new RegExp(value.source, value.flags);
    r.lastIndex = value.lastIndex;
    seen.set(value, r);
    return r;
  }

  // Map
  if (value instanceof Map) {
    const m = new Map();
    seen.set(value, m);
    for (const [k, v] of value) {
      m.set(deepClone(k, seen), deepClone(v, seen));
    }
    return m;
  }

  // Set
  if (value instanceof Set) {
    const s = new Set();
    seen.set(value, s);
    for (const v of value) {
      s.add(deepClone(v, seen));
    }
    return s;
  }

  // 数组与普通对象：先建空壳并登记到 seen，再填充（顺序很重要，否则循环引用会漏）
  const out = Array.isArray(value) ? [] : {};
  seen.set(value, out);

  for (const key of Reflect.ownKeys(value)) {
    // 只用字符串键和可枚举的 Symbol 键
    const desc = Object.getOwnPropertyDescriptor(value, key);
    if (!desc.enumerable) continue;
    out[key] = deepClone(value[key], seen);
  }

  return out;
}

const handSource = makeSource();
handSource.date = new Date('2024-06-01T00:00:00Z');
handSource.regex = /hello/gi;
handSource.map = new Map([['a', { inner: 1 }]]);
handSource.set = new Set([1, 2]);
handSource.self = handSource; // 循环引用

const handClone = deepClone(handSource);
console.log('克隆成功：');
console.log('   nested 独立 =', handClone.nested !== handSource.nested);
console.log('   deeper 独立 =', handClone.nested.deeper !== handSource.nested.deeper);
console.log('   list 独立   =', handClone.list !== handSource.list);
console.log('   date 保留   =', handClone.date instanceof Date, handClone.date.toISOString());
console.log('   regex 保留  =', handClone.regex instanceof RegExp, String(handClone.regex));
console.log('   map 保留了嵌套结构 =', handClone.map.get('a').inner, '，且引用独立 =', handClone.map.get('a') !== handSource.map.get('a'));
console.log('   set 保留    =', [...handClone.set]);
console.log('   循环引用正确指向克隆体 =', handClone.self === handClone);

// 修改克隆体，原对象不受影响
handClone.nested.a = 12345;
console.log('   改克隆体后原对象 nested.a 仍是 =', handSource.nested.a);

console.log('\n--- 6. 三种方案对比与选型建议 ---');

const comparison = [
  { 方案: 'structuredClone', 复杂类型: '好（Date/Map/Set/循环引用）', 函数: '抛错', 原型: '丢失', 推荐度: '首选' },
  { 方案: 'JSON 往返', 复杂类型: '差（大量静默丢失）', 函数: '静默丢弃', 原型: '丢失', 推荐度: '仅限纯 JSON 数据' },
  { 方案: '手写递归', 复杂类型: '可定制', 函数: '可自行决定', 原型: '可保留', 推荐度: '需要定制时' },
];
console.log('三种方案对比：');
for (const row of comparison) {
  console.log('   ', JSON.stringify(row));
}

// 决策建议：
//   1) 数据是纯 JSON（无 Date/Map/Set/函数/undefined）—— 三者都行，选 structuredClone。
//   2) 数据里有 Date/Map/Set/循环引用 —— 必须用 structuredClone（或手写）。
//   3) 数据里有 class 实例且需要保留方法 —— 必须手写（或加一个"重建原型的后处理"）。
//   4) 数据里只有一层且你知道没有嵌套 —— 用 { ...obj } 浅拷贝就够了，别浪费性能。

// 一个折中技巧：structuredClone 之后再把原型接回去。
const uClone2 = structuredClone(u);
Object.setPrototypeOf(uClone2, User.prototype);
console.log('structuredClone + 重设原型后 instanceof User =', uClone2 instanceof User);
console.log('并且方法可用了 =', uClone2.greet());

// 性能提示：深拷贝是 O(n) 的递归遍历，对超大对象（如 10 万条记录）
// 会有明显开销。若只是"读的时候不想被改"，考虑 Object.freeze 或先不拷贝。
console.log('\n全部演示完毕。');
