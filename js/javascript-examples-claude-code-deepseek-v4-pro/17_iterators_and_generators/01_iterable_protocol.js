/**
 * ============================================================================
 * 知识点：可迭代协议 —— Symbol.iterator 与 for...of 的底层约定
 * ============================================================================
 *
 * 【所属分类】17_iterators_and_generators —— 迭代器与生成器
 * 【难度等级】进阶
 * 【前置知识】08_arrays/01_create_and_access.js、09_objects/02_property_access.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    可迭代协议（iterable protocol）是一条约定：
 *    只要一个对象身上有名为 Symbol.iterator 的方法，并且这个方法返回一个
 *    "迭代器"，那么这个对象就是"可迭代的（iterable）"。
 *    for...of、展开运算符 ...、解构 [a, b] = x、Array.from(x)、
 *    new Set(x)、new Map(x)、yield* 这些语法全都在背后调用它。
 *
 * 2. 为什么需要
 *    在 ES6 之前，遍历不同数据结构要用不同的写法：
 *      数组用 for (let i = 0; i < arr.length; i++)
 *      对象用 for (const k in obj)
 *      类数组用 Array.prototype.slice.call(...)
 *    可迭代协议把"如何遍历"抽象成一个统一接口，于是 for...of 可以
 *    遍历任何遵守约定的东西——包括你自己写的对象，甚至无限序列。
 *
 * 3. 核心语法要点
 *    - Symbol.iterator 是一个内置的 symbol 值，用作方法名。用普通字符串
 *      'iterator' 不行，必须是这个 symbol。
 *    - 判断可迭代：typeof obj[Symbol.iterator] === 'function'。
 *    - obj[Symbol.iterator]() 返回一个"迭代器"（不是直接返回值）。
 *    - 内置可迭代类型：Array、String、Map、Set、TypedArray、
 *      arguments、生成器对象、Node.js 的 Buffer、DOM 的 NodeList。
 *    - 不可迭代：普通对象 {}、数字、布尔、null、undefined、Promise。
 *
 * 4. 常见陷阱
 *    - 普通对象 {} 不可迭代，for...of {} 会抛 TypeError，
 *      这就是为什么"遍历对象"要用 Object.keys/values/entries 先转成数组。
 *    - 数组的 Symbol.iterator 可以被覆盖，覆盖后 for...of 行为随之改变。
 *    - 可迭代对象 in 运算符检测不到 Symbol.iterator，
 *      因为 in 检测的是属性名，而 symbol 属性名也可以被 in 检测到——
 *      但更稳妥的判断方式是 typeof 函数。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 17_iterators_and_generators/01_iterable_protocol.js
 *
 * 【预期输出】
 *   依次打印可迭代判断表、数组/字符串的手动迭代、以及普通对象不可迭代的报错演示。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 什么是 Symbol.iterator
// ---------------------------------------------------------------------------

console.log('--- 1. 认识 Symbol.iterator ---');

// Symbol.iterator 是 JS 内置的"知名 symbol"之一，它是一个独一无二的值，
// 不是字符串。用作属性名时，只能用方括号语法 obj[Symbol.iterator]。
console.log('Symbol.iterator 的类型：', typeof Symbol.iterator);
console.log('Symbol.iterator 的说明文字：', Symbol.iterator.toString());

// 每个 Symbol.iterator 都不相等，但同一个内置 symbol 处处相同。
console.log('两次取到的是同一个吗：', Symbol.iterator === Symbol.iterator);

// 数组自己就带着这个方法：
console.log('数组的 Symbol.iterator 是函数吗：', typeof [][Symbol.iterator]);

// ---------------------------------------------------------------------------
// 2. 手动模拟 for...of 在背后做了什么
// ---------------------------------------------------------------------------

console.log('\n--- 2. 手动调用数组的迭代器 ---');

const fruits = ['苹果', '香蕉', '橘子'];

// 关键：Symbol.iterator 方法调用后返回的才是"迭代器"，不是数组本身。
const arrIterator = fruits[Symbol.iterator]();

console.log('迭代器对象：', arrIterator);

// 反复调用 next()，每次都拿到一个形如 { value, done } 的对象。
// done 为 false 表示"还有值"，为 true 表示"遍历结束"。
console.log('第 1 次 next()：', arrIterator.next());
console.log('第 2 次 next()：', arrIterator.next());
console.log('第 3 次 next()：', arrIterator.next());
// 越界后不会报错，而是永远返回 { value: undefined, done: true }
console.log('第 4 次 next()：', arrIterator.next());

// ---------------------------------------------------------------------------
// 3. 哪些内置类型是可迭代的
// ---------------------------------------------------------------------------

console.log('\n--- 3. 内置类型的可迭代性 ---');

// 统一的判断函数：把对象身上的 Symbol.iterator 取出来看是不是函数。
// 用 optional chaining (?.) 防止 obj 为 null/undefined 时报错。
const isIterable = (obj) => typeof obj?.[Symbol.iterator] === 'function';

const samples = [
  ['数组', [1, 2, 3]],
  ['字符串', 'abc'],
  ['Map', new Map([['a', 1]])],
  ['Set', new Set([1, 2])],
  ['TypedArray（Int8Array）', new Int8Array([1, 2])],
  ['生成器对象', (function* () { yield 1; })()],
  ['arguments', (function () { return arguments; })(1, 2)],
  ['Buffer', Buffer.from('hi')],
  ['普通对象', { a: 1 }],
  ['数字', 42],
  ['布尔值', true],
  ['null', null],
  ['Promise', Promise.resolve(1)],
];

for (const [name, value] of samples) {
  console.log(`${name.padEnd(22, ' ')} 可迭代？ ${isIterable(value)}`);
}

// ---------------------------------------------------------------------------
// 4. 同一个迭代器，所有吃"可迭代对象"的语法都认
// ---------------------------------------------------------------------------

console.log('\n--- 4. 所有消费可迭代对象的语法 ---');

const source = [10, 20, 30];

// 4.1 for...of：背后就是不断调用 next()
const collected = [];
for (const n of source) collected.push(n);
console.log('for...of 结果：', collected);

// 4.2 展开运算符：把可迭代对象"摊开"成参数/数组元素
console.log('展开到数组：', [...source]);
console.log('展开成函数参数：', Math.max(...source));

// 4.3 解构赋值
const [first, second, ...rest] = source;
console.log('解构：', { first, second, rest });

// 4.4 Array.from：把任意可迭代对象转成数组
console.log('Array.from(字符串)：', Array.from('abc'));
// 注意第三个参数起才是 map 回调的第二个参数，这里只演示基本用法
console.log('Array.from(Map)：', Array.from(new Map([['k1', 'v1'], ['k2', 'v2']])));

// 4.5 Set / Map 构造函数也吃可迭代对象
console.log('new Set(数组)——顺带去重：', [...new Set([1, 1, 2, 3, 3])]);

// ---------------------------------------------------------------------------
// 5. 陷阱一：普通对象不可迭代
// ---------------------------------------------------------------------------

console.log('\n--- 5. 陷阱：普通对象不能 for...of ---');

const person = { name: '小明', age: 18 };

// 下面的代码会抛 TypeError: person is not iterable。
// 为了不让示例进程以非零退出码结束，我们用 try/catch 包起来打印错误信息。
try {
  for (const item of person) {
    console.log('这一行永远不会执行：', item);
  }
} catch (err) {
  console.log('捕获到的错误类型：', err.constructor.name);
  console.log('错误信息：', err.message);
}

// 正确做法：先用 Object.keys / values / entries 把对象转成数组
console.log('Object.keys：', Object.keys(person));
console.log('Object.values：', Object.values(person));
console.log('Object.entries：', Object.entries(person));

// ---------------------------------------------------------------------------
// 6. 陷阱二：字符串按"码点"迭代，不是按 UTF-16 编码单元
// ---------------------------------------------------------------------------

console.log('\n--- 6. 字符串迭代 vs 下标访问 ---');

const emoji = '😀'; // U+1F600，需要两个 UTF-16 编码单元表示

console.log('length（编码单元数）：', emoji.length);
console.log('下标 0 拿到的半个字符：', emoji[0]);
console.log('[...字符串] 得到的元素个数：', [...emoji].length);
console.log('[...字符串] 的内容：', [...emoji]);

// for...of 内部用的就是字符串的迭代器，所以它一次给出一个完整码点，
// 这正是"用 for...of 代替按索引遍历字符串"更安全的原因。
for (const ch of 'a😀b') {
  console.log('for...of 取到的字符：', ch);
}

console.log('\n示例结束。');
