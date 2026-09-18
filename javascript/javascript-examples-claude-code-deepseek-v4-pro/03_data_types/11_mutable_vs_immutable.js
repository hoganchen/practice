/**
 * ============================================================================
 * 知识点：原始值不可变 vs 对象可变，以及浅拷贝 / 深拷贝
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】进阶
 * 【前置知识】03_data_types/01_primitives_overview.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    · 不可变（immutable）：值一旦创建就永远不变。7 种原始值都是不可变的，
 *      "修改"字符串永远是在造新字符串。
 *    · 可变（mutable）：对象的内容可以被就地修改（增删改属性），
 *      而变量始终指向同一个引用。
 *    由此引出拷贝的两级概念：
 *      · 浅拷贝（shallow copy）：只复制第一层，嵌套的对象仍然是共享引用。
 *      · 深拷贝（deep copy）：递归复制所有层级，两份数据彻底独立。
 *
 * 2. 为什么需要
 *    因为"引用共享"是 JS 里最常见的一类隐蔽 bug：
 *      · 把对象当参数传给函数，函数内部一改，调用方的数据也跟着变。
 *      · 用展开运算符"复制"配置对象，改副本的嵌套字段却发现原对象也变了。
 *    理解可变性，才能选对拷贝策略：只需要改第一层用浅拷贝，
 *    要整体隔离就必须深拷贝。
 *
 * 3. 核心语法要点
 *    【浅拷贝的几种写法】
 *      · 展开运算符：{ ...obj }、[ ...arr ]
 *      · Object.assign({}, obj)
 *      · arr.slice()、Array.from(arr)
 *      · structuredClone 也可用于浅层简单结构（但它是深拷贝，见下）
 *    【深拷贝的现代方案】structuredClone(value)（Node 17+ / 现代浏览器）
 *      支持 Date、RegExp、Map、Set、ArrayBuffer、循环引用；
 *      不支持函数、Symbol 键、DOM 节点、类原型方法 —— 遇到会抛 DataCloneError
 *      或静默丢失。
 *    【深拷贝的传统方案】JSON.parse(JSON.stringify(v))
 *      缺点很多：丢失 undefined 属性、Date 变字符串、NaN/Infinity 变 null、
 *      Map/Set 变空对象、循环引用直接抛错、Symbol 键丢失。
 *    【Object.freeze】只冻结第一层（浅冻结），嵌套对象仍可修改。
 *      想深冻结需要自己递归。
 *    【函数传参】原始值传"值的副本"，对象传"引用的副本"（业内叫
 *      "按共享传参 / pass-by-sharing"）：函数内改属性会影响外部，
 *      但函数内重新赋值整个对象不会影响外部。
 *
 * 4. 常见陷阱
 *    · const 声明的对象仍然可以改内容 —— const 限制的是重新赋值，不是可变性。
 *    · 展开运算符只做一层，嵌套对象照样共享：改副本的深层字段会污染原数据。
 *    · Object.freeze 之后浅层属性不可改，但深层依然可变。
 *    · structuredClone 不能克隆函数，克隆 class 实例会丢失原型链（变成普通对象）。
 *    · 循环引用会让 JSON 方案直接抛 TypeError，structuredClone 才能处理。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/11_mutable_vs_immutable.js
 *
 * 【预期输出】
 *   打印不可变实验、可变实验、浅拷贝的"嵌套共享"陷阱、structuredClone 深拷贝
 *   效果、JSON 方案的局限、循环引用的处理。全部输出确定，退出码 0。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 原始值：不可变
// ---------------------------------------------------------------------------

console.log('--- 1. 原始值不可变 ---');

// 所有"修改"字符串的操作都返回新值，原值不动。
const str = 'hello';
str.toUpperCase(); // 返回值被丢弃，原串没变
console.log('调用 toUpperCase 后 str =', str, '← 原值不变');

// 变量看起来变了，其实是变量指向了新字符串。
let s = 'aaa';
const sBefore = s;
s = s + 'bbb';
console.log('s =', s, '| 之前保存的 sBefore =', sBefore);

// 数字同理：
const n = 10;
n.toFixed(2); // 不会改变 n
console.log('n =', n);

// ---------------------------------------------------------------------------
// 2. 对象：可变
// ---------------------------------------------------------------------------

console.log('--- 2. 对象可变 ---');

// 用 const 声明的对象，内容依然可以被修改。
const config = { host: 'localhost', port: 80 };
config.port = 8080; // 合法：const 只禁止重新赋值变量本身
config.secure = true; // 也能新增属性
delete config.secure; // 还能删除属性
console.log('修改后的 config =', config);

// 重新赋值变量本身才会报错。这里用"包一层箭头函数再调用"的方式，
// 让这次非法赋值真正发生在运行时，从而能被 try/catch 捕获。
try {
  (() => {
    // eslint-disable-next-line no-const-assign
    config = {}; // 运行到这里会抛 TypeError: Assignment to constant variable.
  })();
} catch (err) {
  console.log('config = {} →', err.name + ':', err.message, '（const 限制的是这个）');
}

// 数组也是可变的：
const list = [3, 1, 2];
list.push(4); // 就地修改
list.sort(); // 就地排序
console.log('就地修改后的 list =', list);

// 这里有个反直觉点：sort 是"就地"排序，会改原数组，它不是纯函数。
const originalList = [3, 1, 2];
const sortedCopy = [...originalList].sort(); // 想不改原数组，要先拷贝
console.log('原数组 =', originalList, '| 排序副本 =', sortedCopy);

// ---------------------------------------------------------------------------
// 3. 浅拷贝与"嵌套共享"陷阱
// ---------------------------------------------------------------------------

console.log('--- 3. 浅拷贝的陷阱 ---');

const userA = {
  name: '小明',
  profile: {
    city: '北京',
    tags: ['vip'],
  },
};

// 浅拷贝：第一层属性被复制，但 profile 存的仍是同一个"地址"。
const userB = { ...userA };

// 改动第一层：互不影响。
userB.name = '小红';
console.log('改第一层：userA.name =', userA.name, '| userB.name =', userB.name);

// 改动第二层：两份数据共享同一个嵌套对象，一起变！
userB.profile.city = '上海';
console.log('改第二层：userA.profile.city =', userA.profile.city, '| userB.profile.city =', userB.profile.city);
console.log('  ← 原对象的城市被意外改掉了，这就是浅拷贝陷阱');

// 用引用相等来证明它们确实共享：
console.log('userA.profile === userB.profile ?', userA.profile === userB.profile, '← true，同一个对象');

// Object.assign 与 slice 同样是浅拷贝：
const objAssignCopy = Object.assign({}, userA);
console.log('Object.assign 也是浅拷贝：', objAssignCopy.profile === userA.profile);

const arrShallow = [[1, 2], [3, 4]];
const sliced = arrShallow.slice();
sliced[0].push(99); // 改的是共享的内层数组
console.log('slice() 浅拷贝后改内层：原数组 =', JSON.stringify(arrShallow));

// ---------------------------------------------------------------------------
// 4. 深拷贝：structuredClone
// ---------------------------------------------------------------------------

console.log('--- 4. structuredClone 深拷贝 ---');

const source = {
  name: '订单',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  items: [{ sku: 'A1', qty: 2 }],
  tags: new Set(['急单']),
  meta: new Map([['channel', 'web']]),
};

const cloned = structuredClone(source);

// 改动克隆体的每一层，原对象都不受影响。
cloned.items[0].qty = 999;
cloned.tags.add('已取消');
cloned.meta.set('channel', 'app');

console.log('原对象 items[0].qty =', source.items[0].qty, '| 克隆体 =', cloned.items[0].qty);
console.log('原对象 tags =', [...source.tags], '| 克隆体 tags =', [...cloned.tags]);
console.log('原对象 meta.channel =', source.meta.get('channel'), '| 克隆体 =', cloned.meta.get('channel'));
console.log('日期被正确克隆：', cloned.createdAt instanceof Date, cloned.createdAt.toISOString());
console.log('嵌套引用已断开：', source.items[0] !== cloned.items[0]);

// structuredClone 的局限：不能克隆函数。
try {
  structuredClone({ fn: () => {} });
} catch (err) {
  console.log('克隆含函数的对象 →', err.name + ':', err.message);
}

// class 实例会失去原型链。
class Money {
  constructor(amount) {
    this.amount = amount;
  }
  describe() {
    return '金额 ' + this.amount;
  }
}
const clonedInstance = structuredClone(new Money(100));
console.log('克隆 class 实例后 instanceof Money ?', clonedInstance instanceof Money, '← 原型丢了');
console.log('方法还在吗？', typeof clonedInstance.describe, '← 方法也丢了');

// 循环引用：structuredClone 能处理，JSON 方案不行。
const circular = { name: '环' };
circular.self = circular;
const circularClone = structuredClone(circular);
console.log('循环引用克隆成功：clone.self === clone ?', circularClone.self === circularClone);
console.log('且与原对象不同：', circularClone !== circular);

// ---------------------------------------------------------------------------
// 5. JSON 方案的局限
// ---------------------------------------------------------------------------

console.log('--- 5. JSON.parse(JSON.stringify()) 的局限 ---');

const tricky = {
  num: 1,
  date: new Date('2024-01-01T00:00:00Z'),
  undef: undefined,
  nan: NaN,
  inf: Infinity,
  set: new Set([1, 2]),
  map: new Map([['k', 'v']]),
  fn: function greet() {},
};

const viaJson = JSON.parse(JSON.stringify(tricky));
console.log('原始键：', Object.keys(tricky));
console.log('JSON 往返后：', Object.keys(viaJson), '← undefined 与函数整条消失');
console.log('Date 变成：', typeof viaJson.date, viaJson.date);
console.log('NaN  变成：', viaJson.nan);
console.log('Infinity 变成：', viaJson.inf);
console.log('Set 变成：', viaJson.set);
console.log('Map 变成：', viaJson.map);
console.log('结论：JSON 方案只适合"纯 JSON 数据"，其它场景请用 structuredClone。');

// 循环引用直接抛错：
try {
  console.log(JSON.stringify(circular));
} catch (err) {
  console.log('JSON.stringify(循环引用) →', err.name + ':', err.message);
}

// ---------------------------------------------------------------------------
// 6. Object.freeze 只冻结一层
// ---------------------------------------------------------------------------

console.log('--- 6. Object.freeze 是浅冻结 ---');

const frozen = Object.freeze({
  level1: '不可改',
  nested: { level2: '可以改' },
});

console.log('Object.isFrozen(frozen)             =', Object.isFrozen(frozen));
console.log('Object.isFrozen(frozen.nested)      =', Object.isFrozen(frozen.nested), '← 内层没被冻结');

// 严格模式下改冻结对象的属性会抛错（try/catch 演示）。
try {
  frozen.level1 = '试试';
} catch (err) {
  console.log('改冻结属性 →', err.name + ':', err.message);
}

// 但内层属性可以随意修改 —— 这是浅冻结的漏洞。
frozen.nested.level2 = '被改了';
console.log('内层属性被改成：', frozen.nested.level2, '← 冻结没有传递下去');

/** 深冻结：递归冻结所有嵌套对象（注意循环引用时需要记录已访问集合） */
function deepFreeze(obj, visited = new WeakSet()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (visited.has(obj)) return obj; // 防循环引用导致无限递归
  visited.add(obj);
  for (const key of Reflect.ownKeys(obj)) {
    deepFreeze(obj[key], visited);
  }
  return Object.freeze(obj);
}

const deepFrozen = deepFreeze({ a: { b: { c: 1 } } });
try {
  deepFrozen.a.b.c = 2;
} catch (err) {
  console.log('深冻结后改深层属性 →', err.name + ':', err.message);
}
console.log('深冻结后读取：', deepFrozen.a.b.c, '（仍为 1）');

// ---------------------------------------------------------------------------
// 7. 函数传参：原始值传副本，对象传引用副本
// ---------------------------------------------------------------------------

console.log('--- 7. 函数传参行为 ---');

/** 修改参数的属性：会影响外部，因为传进来的是同一个对象引用 */
function mutateObject(o) {
  o.changed = true;
}

/** 给参数重新赋值：不会影响外部，因为只是让局部变量指向别处 */
function reassignObject(o) {
  o = { changed: 'new object' };
  return o;
}

/** 修改原始值参数：完全不影响外部 */
function mutatePrimitive(x) {
  x = 999;
  return x;
}

const target = { changed: false };
mutateObject(target);
console.log('mutateObject 之后  target.changed =', target.changed, '← 被影响了');

const target2 = { changed: false };
const returned = reassignObject(target2);
console.log('reassignObject 之后 target2.changed =', target2.changed, '← 没被影响');
console.log('  函数返回的新对象 =', returned);

let num = 1;
mutatePrimitive(num);
console.log('mutatePrimitive 之后 num =', num, '← 原始值完全不受影响');

// 实战建议：函数若不想污染入参，进函数先拷贝一层。
/** 返回"加了折扣"的新订单对象，不修改入参 */
function withDiscount(order, rate) {
  // 用展开做浅拷贝，再覆盖需要改的字段（不可变更新风格）。
  return { ...order, price: order.price * rate };
}
const order = { id: 'A1', price: 100 };
const discounted = withDiscount(order, 0.8);
console.log('原订单 price =', order.price, '| 折后订单 price =', discounted.price);

console.log('--- 完成：可变性、浅拷贝与深拷贝 ---');
