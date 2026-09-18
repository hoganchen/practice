/**
 * ============================================================================
 * 知识点：数组的创建方式与索引访问
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】无
 *
 * 【知识点说明】
 *
 * 1. 数组是什么
 *    数组（Array）是 JavaScript 中最常用的有序集合类型。它是一个"有序的、
 *    可以按下标随机访问的"值的列表。每个元素都有一个从 0 开始的整数索引，
 *    元素可以是任意类型（数字、字符串、对象、函数，甚至另一个数组），
 *    并且同一个数组里可以混合存放不同类型 —— JS 的数组不像 C/Java 那样要求同质。
 *
 *    本质上，JS 的数组是"披着数组外衣的特殊对象"：它的索引其实是字符串键
 *    （'0'、'1'、'2'…），length 是一个会自动维护的特殊属性。
 *    所以 typeof [] === 'object'，用 typeof 无法判断一个值是不是数组。
 *
 * 2. 为什么需要数组
 *    没有数组时，存放 100 个学生的成绩就得声明 100 个变量（score1、score2…），
 *    既无法循环处理，也无法在运行时动态增删。数组把"一组同类的值"变成一个整体，
 *    于是可以用循环、可以用内置方法（map/filter/reduce）批量处理。
 *    数组是"数据驱动"编程的起点：有数组才有遍历，有遍历才有高阶函数。
 *
 * 3. 核心语法要点
 *    (1) 字面量创建： const arr = [1, 2, 3];        —— 99% 的场景都用这个
 *    (2) 构造器创建： new Array(3) 与 Array(3) 都创建"长度为 3 的空洞数组"，
 *        而不是 [3]！要创建单元素数组必须用 Array.of(3) 或 [3]。
 *    (3) 索引访问：   arr[0] 是第一个元素，arr[arr.length - 1] 是最后一个。
 *    (4) 索引越界：   读取不存在的下标不会报错，而是返回 undefined（这是 JS 与
 *        Java/C# 的重大区别，也是 bug 的常见来源）。
 *    (5) length：     数组元素个数。它随时可读，也可以被写入（见 19 号文件）。
 *    (6) Array.from： 从"类数组对象"或"可迭代对象"创建真数组（如字符串、Set、Map、
 *        arguments、NodeList），第二个参数可以传映射函数。
 *    (7) Array.of：   用参数列表创建数组，解决了 new Array(n) 的歧义。
 *    (8) Array.isArray： 判断一个值是否为数组，这是唯一可靠的方式。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】本文件的创建与访问操作**都不修改任何数组**：
 *      Array.from / Array.of / Array.isArray 都是非 mutating（不改变原数组）的；
 *      索引读取当然也不改变数组。读取 arr[i] 不会因为 i 越界就往数组里塞 undefined，
 *      它只是返回 undefined，数组本身没有任何变化。
 *    - new Array(3) 得到的是 [ <3 empty items> ]，不是 [3]。这是最经典的构造器陷阱。
 *    - arr.length = 0 可以清空数组；arr[100] = 'x' 会把 length 直接撑到 101。
 *    - 用 for...in 遍历数组是不推荐的：它遍历的是"可枚举属性键"，会把自定义属性
 *      和原型链上的东西也遍历出来，而且顺序不保证。遍历数组请用 for...of 或 forEach。
 *    - 稀疏数组：new Array(3) 创建的三个位置没有值（empty），不是 undefined，
 *      arr.forEach 会直接跳过它们（详见 19 号文件）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/01_create_and_access.js
 *
 * 【预期输出】
 *   依次打印数组的各种创建方式、索引读写的返回值、越界访问的 undefined、
 *   length 的行为，以及 Array.from / Array.of / Array.isArray 的用法与对比。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 最常见的创建方式：数组字面量
// ---------------------------------------------------------------------------

console.log('--- 1. 数组字面量 ---');

// 用方括号 [] 直接列出元素，这是最简洁、最不易出错的方式。
const fruits = ['苹果', '香蕉', '橙子'];

// console.log 打印数组时会带类型提示，输出形如 [ '苹果', '香蕉', '橙子' ]。
console.log('fruits =', fruits);

// JSON.stringify 能得到更紧凑、更接近数据格式的字符串，适合展示嵌套结构。
console.log('JSON 形式 =', JSON.stringify(fruits));

// 数组可以存放任意类型，并且允许混合。
const mixed = [1, 'two', true, null, undefined, { name: '对象' }, [1, 2]];
console.log('混合类型数组 =', mixed);
console.log('mixed 的长度 =', mixed.length);

// 空数组与带尾随逗号的数组
const empty = [];
const trailing = [1, 2, 3, , 5]; // 注意中间这个"洞"：这是稀疏数组，见 19 号文件
console.log('空数组 =', empty, '长度 =', empty.length);
console.log('含空隙的数组 =', trailing, '长度 =', trailing.length);

// ---------------------------------------------------------------------------
// 2. 构造器创建：new Array 的歧义陷阱
// ---------------------------------------------------------------------------

console.log('\n--- 2. new Array 的陷阱 ---');

// 传一个数字参数时，它表示"长度"，而不是"第一个元素"。
const lenThree = new Array(3);
console.log('new Array(3) =', lenThree);
console.log('new Array(3).length =', lenThree.length);
console.log('它的第 0 个元素 =', lenThree[0], '（注意是 undefined，位置是空的）');
console.log('它是稀疏数组吗？0 in arr =', 0 in lenThree, '（false 表示这个位置没有值）');

// 传多个参数时，每个参数才是元素。
console.log('new Array(3, 5) =', new Array(3, 5));

// 传字符串等非数字时，就是普通元素。
console.log("new Array('3') =", new Array('3'));

// 不带参数创建空数组。
console.log('new Array() =', new Array(), '长度 =', new Array().length);

// ---------------------------------------------------------------------------
// 3. Array.of：消除 new Array 的歧义
// ---------------------------------------------------------------------------

console.log('\n--- 3. Array.of ---');

// Array.of 的行为永远一致：不管你传几个参数、传什么类型，参数就是元素。
console.log('Array.of(3) =', Array.of(3), '长度 =', Array.of(3).length);
console.log('Array.of(3, 5) =', Array.of(3, 5));
console.log('Array.of() =', Array.of(), '长度 =', Array.of().length);

// 什么时候真的需要 Array.of？当元素数量是变量的时候。
function buildList(...items) {
  // 如果用 new Array(items)，当 items 恰好只有一个数字时会得到错误结果。
  return Array.of(...items);
}
console.log('buildList(7) =', buildList(7), '（new Array(7) 会得到 7 个空位）');
console.log('buildList(1, 2, 3) =', buildList(1, 2, 3));

// ---------------------------------------------------------------------------
// 4. Array.from：把"类数组"和"可迭代对象"变成真数组
// ---------------------------------------------------------------------------

console.log('\n--- 4. Array.from ---');

// (1) 从字符串创建（字符串是可迭代对象）
console.log("Array.from('hello') =", Array.from('hello'));

// (2) 从 Set 创建 —— 顺便去重
const uniq = Array.from(new Set([1, 1, 2, 3, 3, 3]));
console.log('Array.from(new Set([1,1,2,3,3,3])) =', uniq);

// (3) 从 Map 创建，得到 [key, value] 对的数组
const map = new Map([
  ['a', 1],
  ['b', 2],
]);
console.log('Array.from(map) =', Array.from(map));

// (4) 从类数组对象创建：只要对象有 length 属性和对应的整数下标就行
const arrayLike = { 0: 'x', 1: 'y', 2: 'z', length: 3 };
console.log('Array.from(arrayLike) =', Array.from(arrayLike));

// (5) 第二个参数是映射函数，等价于 .map()，但只遍历一遍，性能更好
const squares = Array.from([1, 2, 3, 4], (n) => n * n);
console.log('Array.from([1,2,3,4], n => n*n) =', squares);

// (6) 常用技巧：生成 1..n 的序列
const oneToTen = Array.from({ length: 10 }, (_, i) => i + 1);
console.log('生成 1..10 =', oneToTen);

// 对比：Array(10).fill(0).map(...) 也能做，但要两步，且容易忘掉 fill。
console.log('Array(10).fill(0).map((_, i) => i + 1) =', Array(10).fill(0).map((_, i) => i + 1));

// ---------------------------------------------------------------------------
// 5. 索引访问与越界
// ---------------------------------------------------------------------------

console.log('\n--- 5. 索引访问 ---');

const colors = ['红', '绿', '蓝'];
console.log('colors =', colors);
console.log('colors[0]（第一个）=', colors[0]);
console.log('colors[1]（第二个）=', colors[1]);
console.log('colors[2]（第三个）=', colors[2]);

// 越界读取：不报错，返回 undefined。这是 JS 的"宽容"设计，也是隐藏 bug 的温床。
console.log('colors[3]（越界）=', colors[3]);
console.log('colors[100]（越界）=', colors[100]);
console.log('colors[-1]（不支持负索引）=', colors[-1], '（要访问倒数第一个请用 at(-1)，见 15 号文件）');

// 越界读取不会改变数组本身
console.log('读过越界下标后，colors 依然是 =', colors, '，length =', colors.length);

// 写入越界下标则会真的扩展数组，并把中间位置留成"空洞"
const writable = ['a', 'b'];
writable[4] = 'e';
console.log('writable[4] = "e" 之后 =', writable, '，length =', writable.length);
console.log('中间的洞：writable[2] =', writable[2], '，2 in writable =', 2 in writable);

// 最后一个元素的两种写法
console.log('colors[colors.length - 1] =', colors[colors.length - 1]);
console.log('colors.at(-1) =', colors.at(-1));

// ---------------------------------------------------------------------------
// 6. length 的读取与特殊行为
// ---------------------------------------------------------------------------

console.log('\n--- 6. length ---');

const nums = [10, 20, 30];
console.log('nums.length =', nums.length);

// 数组赋值
nums[3] = 40; // 追加到末尾：等价于 push，但可读性差
console.log('nums[3] = 40 之后 =', nums, '，length =', nums.length);

// 直接写 length 会截断数组（修改原数组！）
nums.length = 2;
console.log('nums.length = 2 之后 =', nums, '（元素被真的删掉了）');

// length 只能是非负整数，赋值非法值会抛 RangeError（这里用 try/catch 演示）
try {
  nums.length = -1;
} catch (err) {
  console.log('设置负数 length 抛错：', err.constructor.name, '-', err.message);
}

// ---------------------------------------------------------------------------
// 7. Array.isArray：可靠地判断"是不是数组"
// ---------------------------------------------------------------------------

console.log('\n--- 7. Array.isArray ---');

console.log('Array.isArray([1,2,3]) =', Array.isArray([1, 2, 3]));
console.log('Array.isArray([]) =', Array.isArray([]));
console.log('Array.isArray(new Array(3)) =', Array.isArray(new Array(3)));
console.log('Array.isArray(Array.from("ab")) =', Array.isArray(Array.from('ab')));

console.log('Array.isArray({0:1, length:1}) =', Array.isArray({ 0: 1, length: 1 }), '（类数组不是数组）');
console.log('Array.isArray("abc") =', Array.isArray('abc'), '（字符串不是数组）');
console.log('Array.isArray(null) =', Array.isArray(null));
console.log('Array.isArray(undefined) =', Array.isArray(undefined));

// 为什么不能用 typeof？
console.log('typeof [] =', typeof [], '（是 object，区分不出来）');
console.log('typeof {} =', typeof {}, '（也是 object）');

// 为什么不能用 instanceof？
// instanceof 依赖原型链，跨"领域"（如浏览器里 iframe 中的数组）会失效。
// Array.isArray 内部用的是更底层的 [[Class]] 判断，跨领域依然正确。
const arrFromOtherRealm = Array.from([1]); // 这里只做普通演示
console.log('instanceof 对普通数组有效：', arrFromOtherRealm instanceof Array);

// ---------------------------------------------------------------------------
// 8. 综合小结
// ---------------------------------------------------------------------------

console.log('\n--- 8. 小结 ---');
console.log('创建方式推荐顺序：1) [] 字面量  2) Array.from  3) Array.of  4) new Array(n).fill(x)');
console.log('判断数组：一律使用 Array.isArray(x)，不要用 typeof 或 instanceof');
console.log('本文件所有操作均未修改传入的示例数组（唯二例外是上面演示截断用的 nums 和扩展用的 writable）。');
