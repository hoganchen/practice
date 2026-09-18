/**
 * ============================================================================
 * 知识点：数组拷贝 —— 浅拷贝的多种方式、深拷贝与 structuredClone、嵌套数组的陷阱
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】进阶
 * 【前置知识】08_arrays/17_array_destructuring.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 里的"复制数组"分两个层次，必须先分清：
 *
 *      **浅拷贝（shallow copy）**：创建一个新数组，把原数组的**每个元素的值**
 *      复制进去。对原始值（number/string/boolean/null/undefined/symbol/bigint）
 *      而言，复制的是值本身，互不影响；对**引用值**（对象、数组、函数、Map…）而言，
 *      复制的是**引用**（内存地址），新旧数组的元素指向**同一个对象**。
 *
 *      **深拷贝（deep copy）**：递归地复制所有层级，任何一个层级的修改都不会
 *      影响另一份。代价是更慢、更占内存，且对函数、循环引用等有限制。
 *
 *    常见方式一览：
 *      浅拷贝：arr.slice()、[...arr]、Array.from(arr)、arr.concat()、
 *              Array.prototype.slice.call(类数组)、Object.assign([], arr)
 *      深拷贝：structuredClone(arr)（推荐）、JSON.parse(JSON.stringify(arr))（有限制）、
 *              手写递归、第三方库（lodash 的 cloneDeep）
 *
 * 2. 为什么需要它
 *    因为 JS 的"赋值"对引用类型来说是**共享**：
 *        const a = [1, 2, 3];
 *        const b = a;      // b 和 a 是同一个数组！
 *        b.push(4);        // a 也变成了 [1,2,3,4]
 *    共享会引发"我明明只改了我这份，为什么别处也变了"的经典事故。
 *    拷贝是"切断共享"的手段，也是不可变数据（React/Redux）的基础操作。
 *
 * 3. 核心语法要点
 *    (1) 判断"是不是同一份"：用 === 比较数组本身，用 === 比较元素。
 *    (2) 浅拷贝的 5 种常用写法（都在下面代码里演示）：
 *          arr.slice()        —— 最直观
 *          [...arr]           —— 最现代
 *          Array.from(arr)    —— 能顺带做映射
 *          arr.concat()       —— 老代码常见
 *          Object.assign([], arr) —— 少见但有效
 *    (3) 深拷贝首选 structuredClone(value)：浏览器与 Node 17+ 均内置，
 *        支持数组、对象、Date、Map、Set、RegExp、TypedArray、循环引用、
 *        甚至 ArrayBuffer 的转移（transfer）。
 *        不支持：函数、Symbol 键、DOM 节点、类实例的原型（会降级成普通对象）、
 *        以及 undefined 以外的某些自定义属性。
 *    (4) JSON 深拷贝的四大局限（第 6 节演示）：
 *          undefined / 函数 / Symbol 会被丢弃；
 *          NaN / Infinity 变成 null；
 *          Date 变成字符串；
 *          循环引用直接抛 TypeError；
 *          Map / Set / RegExp 变成空对象。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】拷贝本身**不修改原数组**，但**浅拷贝留下了"共享内部对象"
 *      的隐患**：改副本里的对象属性，原数组也会变。这是 JS 里最高频的坑之一。
 *    - 只适用于"数组本身" —— 想复制"数组里的对象"必须深拷贝。
 *    - `const b = a` 不是拷贝，是取别名。
 *    - 多维数组（`[[1,2],[3,4]]`）用浅拷贝后，改 `copy[0][0]` 会影响原数组。
 *    - `Object.assign({}, arr)` 会得到**对象**（键是 '0'、'1'），不是数组。
 *    - `Array.from(arr)` 与 `[...arr]` 对"迭代器"和"类数组"的行为略有不同：
 *      前者对类数组也有效，后者要求可迭代。
 *    - structuredClone 不能克隆"带方法的类实例"：方法会丢失，只留下可枚举的自有属性。
 *    - structuredClone 遇到函数会抛 DataCloneError（不是静默丢弃，这点与 JSON 不同）。
 *    - 深拷贝"足够用"即可：很多场景下**结构化共享**（immutable 更新）比深拷贝更高效。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/18_copy_array.js
 *
 * 【预期输出】
 *   依次演示赋值即共享、五种浅拷贝方式的等价性、浅拷贝在嵌套结构上的陷阱，
 *   structuredClone 的用法与限制、JSON 深拷贝的坑，最后给出选择建议与实战。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 先看清"赋值不是拷贝"
// ---------------------------------------------------------------------------

console.log('--- 1. 赋值不是拷贝 ---');

const a = [1, 2, 3];
const b = a; // 这只是给同一个数组起了第二个名字

console.log('a =', JSON.stringify(a), '，b = a');
console.log('a === b ?', a === b, '（true：同一个数组）');

b.push(4);
console.log('执行 b.push(4) 之后：');
console.log('  a =', JSON.stringify(a), '（a 也变了！）');
console.log('  b =', JSON.stringify(b));

// 注意：push 会修改原数组（mutating），这里正是想说明"共享引用"的后果
console.log('结论：想要独立的副本，必须显式拷贝。');

// ---------------------------------------------------------------------------
// 2. 五种浅拷贝方式
// ---------------------------------------------------------------------------

console.log('\n--- 2. 五种浅拷贝方式 ---');

const original = [1, 2, 3];
console.log('原数组 =', JSON.stringify(original));

const bySlice = original.slice();
const bySpread = [...original];
const byFrom = Array.from(original);
const byConcat = original.concat();
const byAssign = Object.assign([], original);

console.log('arr.slice()            =', JSON.stringify(bySlice));
console.log('[...arr]               =', JSON.stringify(bySpread));
console.log('Array.from(arr)        =', JSON.stringify(byFrom));
console.log('arr.concat()           =', JSON.stringify(byConcat));
console.log('Object.assign([], arr) =', JSON.stringify(byAssign));

console.log('\n它们都创建了新数组（都不是原数组本身）：');
console.log('slice  === original ?', bySlice === original);
console.log('spread === original ?', bySpread === original);
console.log('from   === original ?', byFrom === original);
console.log('concat === original ?', byConcat === original);
console.log('assign === original ?', byAssign === original);

// 五种方式彼此之间也是不同的数组
console.log('\n副本之间互不相同 =', bySlice !== bySpread && bySpread !== byFrom);

// 改副本不影响原数组（元素是原始值时）
bySlice.push(999);
console.log('\npush 到 slice 副本后：原数组 =', JSON.stringify(original), '，副本 =', JSON.stringify(bySlice));

// 各方式的细微差别
console.log('\n差别提示：');
console.log('  [...arr] 要求可迭代；Array.from 对"类数组"也有效。');
const arrayLike = { 0: 'p', 1: 'q', length: 2 };
console.log("  Array.from({0:'p',1:'q',length:2}) =", JSON.stringify(Array.from(arrayLike)));
try {
  console.log([...arrayLike]);
} catch (err) {
  console.log('  [...类数组] 会抛错：', err.constructor.name, '-', err.message);
}
console.log('  Object.assign({}, arr) 得到的是对象：', JSON.stringify(Object.assign({}, [10, 20])));
console.log('  （键是 "0"/"1" 的普通对象，不是数组，Array.isArray 为', Array.isArray(Object.assign({}, [10, 20])), '）');

// ---------------------------------------------------------------------------
// 3. 浅拷贝的陷阱：嵌套结构
// ---------------------------------------------------------------------------

console.log('\n--- 3. 浅拷贝陷阱（重点）---');

// 元素是对象时，浅拷贝只复制"引用"
const users = [
  { name: '张三', age: 20 },
  { name: '李四', age: 30 },
];
const shallow = users.slice();

console.log('原数组 =', JSON.stringify(users));
console.log('浅拷贝 =', JSON.stringify(shallow));
console.log('数组本身相同吗？', users === shallow, '（false，是新数组）');
console.log('第一个元素相同吗？', users[0] === shallow[0], '（true！同一个对象）');

// 改副本里的对象属性 -> 原数组也变
shallow[0].age = 99;
console.log('\n执行 shallow[0].age = 99 之后：');
console.log('  原数组 =', JSON.stringify(users), '（被改了！）');
console.log('  浅拷贝 =', JSON.stringify(shallow));

// 但是"替换"副本里的元素不影响原数组（因为改的是副本的槽位）
shallow[1] = { name: '李四（替换）', age: 31 };
console.log('\n执行 shallow[1] = {...} 之后：');
console.log('  原数组 =', JSON.stringify(users), '（没变，因为只是换了副本的槽位）');
console.log('  浅拷贝 =', JSON.stringify(shallow));
console.log('\n关键结论：浅拷贝对"替换元素"安全，对"修改元素内部"不安全。');

// 二维数组同样中招
const grid = [[1, 2], [3, 4]];
const gridCopy = grid.map((row) => row); // 只拷外层
gridCopy[0][0] = 999;
console.log('\n二维数组浅拷贝：原数组 =', JSON.stringify(grid), '（内层被改了）');

// 正确的深拷贝做法
const grid2 = [[1, 2], [3, 4]];
const gridDeep = grid2.map((row) => [...row]); // 每个内层数组也拷一份
gridDeep[0][0] = 999;
console.log('二维数组逐层拷贝：原数组 =', JSON.stringify(grid2), '，副本 =', JSON.stringify(gridDeep));
console.log('（"map + 展开"就是一层一层剥，这只适用于已知层数的情况）');

// ---------------------------------------------------------------------------
// 4. structuredClone：现代深拷贝首选
// ---------------------------------------------------------------------------

console.log('\n--- 4. structuredClone 深拷贝 ---');

const data = {
  id: 1,
  tags: ['a', 'b'],
  meta: { created: new Date('2024-01-01T00:00:00Z'), nested: { deep: [1, 2, 3] } },
  set: new Set([1, 2]),
  map: new Map([['k', 'v']]),
  re: /abc/gi,
};

const cloned = structuredClone(data);

console.log('原数据（JSON 视角）=', JSON.stringify(data));
console.log('拷贝后（JSON 视角）=', JSON.stringify(cloned));
console.log('是同一个对象吗？', cloned === data, '（false）');
console.log('meta 是同一个对象吗？', cloned.meta === data.meta, '（false，深拷贝到底）');

// 类型保留情况
console.log('\n类型保留：');
console.log('  Date  ?', cloned.meta.created instanceof Date, '值为', cloned.meta.created.toISOString());
console.log('  Set   ?', cloned.set instanceof Set, '值为', [...cloned.set].join(','));
console.log('  Map   ?', cloned.map instanceof Map, '值为', [...cloned.map].join(','));
console.log('  RegExp?', cloned.re instanceof RegExp, '值为', cloned.re.toString());

// 改拷贝的深层属性，原数据不受影响
cloned.meta.nested.deep.push(999);
cloned.tags.push('c');
console.log('\n修改拷贝后：原数据 tags =', JSON.stringify(data.tags));
console.log('           拷贝   tags =', JSON.stringify(cloned.tags));

// 数组也能直接深拷贝
const nestedArr = [[1, 2], [3, [4, 5]]];
const deepArr = structuredClone(nestedArr);
deepArr[1][1][0] = 999;
console.log('\n深拷贝数组：原数组 =', JSON.stringify(nestedArr), '，副本 =', JSON.stringify(deepArr));

// 循环引用也能处理（这是 structuredClone 相比 JSON 的巨大优势）
const circular = { name: '循环' };
circular.self = circular;
circular.arr = [circular];
const circularClone = structuredClone(circular);
console.log('\n循环引用深拷贝成功：clone.self === clone ?', circularClone.self === circularClone);
console.log('  clone.arr[0] === clone ?', circularClone.arr[0] === circularClone);
console.log('  与原对象不同 ?', circularClone !== circular);

// structuredClone 的限制
console.log('\nstructuredClone 的限制：');
try {
  structuredClone({ fn: () => 1 });
} catch (err) {
  console.log('  含函数 -> ', err.constructor.name, '-', err.message);
}
try {
  structuredClone({ sym: Symbol('s') });
} catch (err) {
  console.log('  含 Symbol 值 -> ', err.constructor.name, '-', err.message);
}

// 类实例会退化成普通对象
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  get length() {
    return Math.hypot(this.x, this.y);
  }
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}
const point = new Point(3, 4);
const pointClone = structuredClone(point);
console.log('\n类实例深拷贝：');
console.log('  原实例 toString() =', String(point));
console.log('  拷贝是 Point 实例吗？', pointClone instanceof Point, '（false，原型丢失）');
console.log('  拷贝的内容 =', JSON.stringify(pointClone), '（只剩自有属性）');
console.log('  拷贝的 toString() =', Object.prototype.toString.call(pointClone));

// ---------------------------------------------------------------------------
// 5. JSON 深拷贝及其局限
// ---------------------------------------------------------------------------

console.log('\n--- 5. JSON 深拷贝的局限 ---');

const jsonSrc = {
  n: 1,
  s: 'text',
  arr: [1, 2, 3],
  obj: { inner: true },
  date: new Date('2024-06-01T00:00:00Z'),
  nan: NaN,
  inf: Infinity,
  undef: undefined,
  fn: () => 'hi',
  map: new Map([['a', 1]]),
  set: new Set([1]),
  re: /x/,
};
console.log('原始对象 =', JSON.stringify(jsonSrc));

const jsonClone = JSON.parse(JSON.stringify(jsonSrc));
console.log('\nJSON 往返后：');
console.log('  date 的类型  ->', typeof jsonClone.date, '（变成了字符串，不再是 Date 实例）');
console.log('  date 的值    ->', jsonClone.date);
console.log('  nan 的值     ->', jsonClone.nan, '（NaN 变成 null）');
console.log('  inf 的值     ->', jsonClone.inf, '（Infinity 变成 null）');
console.log('  undef 存在吗 ->', 'undef' in jsonClone, '（被丢弃了）');
console.log('  fn 存在吗    ->', 'fn' in jsonClone, '（被丢弃了）');
console.log('  map 的值     ->', JSON.stringify(jsonClone.map), '（Map 变成空对象）');
console.log('  set 的值     ->', JSON.stringify(jsonClone.set), '（Set 变成空对象）');
console.log('  re 的值      ->', JSON.stringify(jsonClone.re), '（RegExp 变成空对象）');
console.log('  嵌套对象是同一引用吗？', jsonClone.obj === jsonSrc.obj, '（false，这一层确实是深拷贝）');

// 循环引用会直接抛错
try {
  const cyc = {};
  cyc.self = cyc;
  JSON.stringify(cyc);
} catch (err) {
  console.log('\nJSON 处理循环引用会抛错：', err.constructor.name, '-', err.message);
}

// JSON 深拷贝仍然有效的场景：纯 JSON 数据（数字/字符串/布尔/null/数组/普通对象）
const pureJson = { a: 1, b: [true, null, 'x'], c: { d: 2 } };
const pureClone = JSON.parse(JSON.stringify(pureJson));
pureClone.c.d = 99;
console.log('\n纯 JSON 数据用 JSON 往返完全可靠：原 =', JSON.stringify(pureJson), '，副本 =', JSON.stringify(pureClone));

// ---------------------------------------------------------------------------
// 6. 手写深拷贝（了解原理）
// ---------------------------------------------------------------------------

console.log('\n--- 6. 手写递归深拷贝 ---');

function deepClone(value, seen = new WeakMap()) {
  // 原始值与函数直接返回（函数按引用共享，这是常见约定）
  if (value === null || typeof value !== 'object') return value;

  // 处理循环引用
  if (seen.has(value)) return seen.get(value);

  // Date / RegExp 的特殊处理
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);

  // Map / Set
  if (value instanceof Map) {
    const m = new Map();
    seen.set(value, m);
    value.forEach((v, k) => m.set(deepClone(k, seen), deepClone(v, seen)));
    return m;
  }
  if (value instanceof Set) {
    const s = new Set();
    seen.set(value, s);
    value.forEach((v) => s.add(deepClone(v, seen)));
    return s;
  }

  // 数组与普通对象
  const result = Array.isArray(value) ? [] : {};
  seen.set(value, result);
  for (const key of Reflect.ownKeys(value)) {
    result[key] = deepClone(value[key], seen);
  }
  return result;
}

const handSrc = { a: [1, { b: 2 }], d: new Date('2024-01-01'), m: new Map([['k', [1, 2]]]) };
const handClone = deepClone(handSrc);
handClone.a[1].b = 999;
handClone.m.get('k').push(3);
console.log('手写深拷贝：原 =', JSON.stringify(handSrc));
console.log('            副本 =', JSON.stringify(handClone));
console.log('Date 保留 =', handClone.d instanceof Date, '，Map 保留 =', handClone.m instanceof Map);

// 循环引用也能处理
const handCircular = { n: 1 };
handCircular.me = handCircular;
const handCircularClone = deepClone(handCircular);
console.log('手写深拷贝处理循环引用：clone.me === clone ?', handCircularClone.me === handCircularClone);

// ---------------------------------------------------------------------------
// 7. 选择建议
// ---------------------------------------------------------------------------

console.log('\n--- 7. 怎么选 ---');

const scenarios = [
  ['元素全是原始值（数字/字符串/布尔）', '浅拷贝足够：[...arr] 或 arr.slice()'],
  ['元素是对象，但我只做"替换"不做"改属性"', '浅拷贝可以：arr.map(x => x) 或 [...arr]'],
  ['元素是对象，且要改内部属性', '必须深拷贝：structuredClone(arr)'],
  ['数据是纯 JSON（来自接口/文件）', 'JSON 往返或 structuredClone 都行，structuredClone 更稳'],
  ['有循环引用', '只能 structuredClone 或手写'],
  ['要保留类实例的方法与原型', '手写深拷贝 + 自定义构造函数，或专用库'],
  ['性能敏感的大数组', '尽量用"不可变更新"避免整体拷贝'],
];
scenarios.forEach(([when, how], i) => console.log(`  ${i + 1}. 当 ${when} -> ${how}`));

// 结构化共享 vs 深度拷贝：后者往往不必
console.log('\n提示：很多场景不需要"整份深拷贝"，只需要"沿着修改路径复制一层"（结构共享）。');
const state = { list: [{ id: 1, done: false }], page: 1 };
const nextState = {
  ...state,
  list: state.list.map((item) => (item.id === 1 ? { ...item, done: true } : item)), // 只复制改动路径
};
console.log('不可变更新后：原 state =', JSON.stringify(state));
console.log('              新 state =', JSON.stringify(nextState));
console.log('未改动的元素仍是同一引用（省内存）=', state.list === nextState.list ? '列表也换了' : '列表是新数组，但可复用未改动项');

// ---------------------------------------------------------------------------
// 8. 实战：拷贝的常见业务场景
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战 ---');

// 场景一：排序前先拷贝，避免污染原数组
const source = [3, 1, 2];
const sortedCopy = [...source].sort((x2, y2) => x2 - y2);
console.log('原数组 =', JSON.stringify(source), '（未被子排序污染）');
console.log('排序副本 =', JSON.stringify(sortedCopy));
console.log('（也等价于 source.toSorted((a,b) => a-b) =', JSON.stringify(source.toSorted((x2, y2) => x2 - y2)), '）');

// 场景二：表格数据要做"编辑草稿"
const tableRows = [
  { id: 1, name: 'A', editing: false },
  { id: 2, name: 'B', editing: false },
];
// 浅拷贝 + 只替换要改的那一项（结构共享思路）
function setEditing(rows, id, editing) {
  return rows.map((row) => (row.id === id ? { ...row, editing } : row));
}
const afterEdit = setEditing(tableRows, 2, true);
console.log('\n草稿 =', JSON.stringify(afterEdit));
console.log('原始数据 =', JSON.stringify(tableRows), '（保持干净）');
console.log('未改动项复用同一引用 =', afterEdit[0] === tableRows[0]);

// 场景三：把嵌套数组整体独立出来交给"可能有副作用"的函数
const config = { tags: ['a', 'b'], nested: { opts: [1, 2] } };
function riskyMutate(cfg) {
  cfg.tags.push('injected');
  cfg.nested.opts.push(99);
  return cfg;
}
const safeInput = structuredClone(config);
riskyMutate(safeInput);
console.log('\n原始 config =', JSON.stringify(config), '（完全没被污染）');
console.log('函数处理后的副本 =', JSON.stringify(safeInput));

// ---------------------------------------------------------------------------
// 9. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 9. 小结 ---');
console.log('1. `const b = a` 是取别名，不是拷贝。');
console.log('2. 浅拷贝：[...arr] / arr.slice() / Array.from(arr) / arr.concat()，都不修改原数组，但元素仍是共享引用。');
console.log('3. 深拷贝首选 structuredClone(value)：支持 Date/Map/Set/RegExp/循环引用，遇到函数会抛错。');
console.log('4. JSON 往返只能用于纯 JSON 数据，会丢 undefined/函数，把 NaN 变 null，把 Date 变字符串。');
console.log('5. 大多数业务场景只需要"沿修改路径复制"（结构共享），不必整份深拷贝。');
