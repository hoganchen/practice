/**
 * ============================================================================
 * 知识点：map 映射 —— 返回新数组，以及"用 map 做副作用"的常见误用
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】08_arrays/07_forEach.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    arr.map(callback) 对数组的每个元素调用一次回调，把回调的**返回值**收集起来，
 *    组成一个**新数组**返回。新数组的长度与原数组**永远相同**（一一对应）。
 *    回调签名同样是 (element, index, array)。
 *
 *    这就是"映射"的数学含义：把集合 A 的每个元素，按规则 f 变换成集合 B 的元素。
 *        [1, 2, 3].map(x => x * 2)  ->  [2, 4, 6]
 *
 * 2. 为什么需要它
 *    数据在程序里流动时，几乎每过一层就要"变形"一次：
 *    数据库记录 -> 视图模型 -> 渲染文本。map 让"变形规则"以纯函数的形式表达出来，
 *    没有循环变量、没有临时数组、没有可变状态，读代码时只需要关注"每一项变成什么"。
 *    它是函数式编程里最基本也最常用的一个函数。
 *
 * 3. 核心语法要点
 *    (1) 返回值：**新数组**，长度 = 原数组长度。
 *    (2) 如果你不写 return，每一项都会变成 undefined —— 这是最常见的 map 事故。
 *    (3) map 不会跳过元素（除稀疏数组的空洞外），也不会改变长度；
 *        想改变长度请用 filter（变短）或 flatMap（变长）。
 *    (4) 链式调用：map 返回数组，所以可以继续 .map().filter().reduce()。
 *    (5) 第二个参数 thisArg 与 forEach 一致（现代代码一般不用）。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**不修改原数组**（non-mutating）。
 *      但注意：它返回的是"新数组装旧引用"，如果元素是对象，你在回调里改了对象的属性，
 *      原数组里的那个对象也会被改到（浅拷贝的经典陷阱，见 18 号文件）。
 *      要避免就得在回调里返回一个新的对象：`u => ({ ...u, age: u.age + 1 })`。
 *    - **用 map 做副作用**是错误的：`arr.map(x => console.log(x))` 或者
 *      `arr.map(x => { arr2.push(x) })`。map 的目的就是"得到新数组"，
 *      只为了遍历请用 forEach；只为过滤请用 filter。这样写不仅语义错，
 *      还会白白创建一个没人用的数组（性能与可读性双输）。
 *    - 回调返回对象字面量时要用括号包住：`x => ({ id: x })`，
 *      写成 `x => { id: x }` 会被当成函数体（里面是标签语句），返回 undefined。
 *    - map 无法跳过、无法提前终止：想"过滤"用 filter，想"找到就停"用 find。
 *    - map 不是"就地修改"：写 `arr.map(...)` 却不接收返回值，等于什么都没做。
 *    - 稀疏数组的空洞会被**保留**在新数组里，回调不执行，新数组也是稀疏的。
 *    - 不要用 map 展开 Promise：`await arr.map(async ...)` 得到的是 Promise 数组，
 *      要用 `await Promise.all(arr.map(async ...))`。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/08_map.js
 *
 * 【预期输出】
 *   依次演示 map 的基础映射、新数组与原数组无关、长度不变、
 *   返回对象与展开运算符的写法、for 循环/map 的对比，
 *   以及"用 map 做副作用"的错误示范与正确替代。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基础映射
// ---------------------------------------------------------------------------

console.log('--- 1. 基础映射 ---');

const nums = [1, 2, 3, 4];
const doubled = nums.map((n) => n * 2);

console.log('原数组 =', JSON.stringify(nums));
console.log('map(n => n * 2) =', JSON.stringify(doubled));
console.log('长度对比：', nums.length, '->', doubled.length, '（一一对应，长度不变）');
console.log('是不是同一个数组？', nums === doubled, '（false，是新数组）');
console.log('原数组没被修改 =', JSON.stringify(nums));

// 回调的三个参数
console.log('\n回调参数：');
['a', 'b'].map((element, index, array) => {
  console.log(`  element=${element}, index=${index}, array=${JSON.stringify(array)}`);
  return element.toUpperCase();
});

// 不同类型的映射
console.log('\n类型转换：');
console.log('数字 -> 字符串 =', ['1', '2', '3'].map(Number));
console.log('字符串 -> 长度 =', ['a', 'bb', 'ccc'].map((s) => s.length));
console.log('数字 -> 布尔   =', [0, 1, 2, ''].map(Boolean));
console.log('摄氏 -> 华氏   =', [0, 25, 100].map((c) => c * 1.8 + 32));

// ---------------------------------------------------------------------------
// 2. 忘了 return 会得到一数组 undefined
// ---------------------------------------------------------------------------

console.log('\n--- 2. 忘了 return ---');

// 箭头函数用了花括号就必须显式 return
const forgotReturn = [1, 2, 3].map((n) => {
  n * 2; // 没有 return
});
console.log('忘记 return 的结果 =', JSON.stringify(forgotReturn));

// 不加花括号（隐式返回）才对
const implicitReturn = [1, 2, 3].map((n) => n * 2);
console.log('隐式返回的结果 =', JSON.stringify(implicitReturn));

// ---------------------------------------------------------------------------
// 3. 映射成对象：对象字面量必须加括号
// ---------------------------------------------------------------------------

console.log('\n--- 3. 映射成对象 ---');

const names = ['张三', '李四'];

// 错误写法：花括号被当成函数体
const wrongObj = names.map((name) => { name }); // 这其实是个块语句
console.log('不加括号的错误写法 =', JSON.stringify(wrongObj));

// 正确写法一：用小括号包住对象字面量
const rightObj1 = names.map((name) => ({ name }));
console.log('加括号的正确写法 =', JSON.stringify(rightObj1));

// 正确写法二：用花括号 + 显式 return
const rightObj2 = names.map((name) => {
  return { name, len: name.length };
});
console.log('显式 return 写法 =', JSON.stringify(rightObj2));

// ---------------------------------------------------------------------------
// 4. map 不修改原数组，但"浅"到什么程度？
// ---------------------------------------------------------------------------

console.log('\n--- 4. 浅拷贝陷阱 ---');

const users = [
  { id: 1, name: '张三', age: 20 },
  { id: 2, name: '李四', age: 30 },
];
console.log('原用户 =', JSON.stringify(users));

// 危险写法：直接改元素属性，原数组里的对象也被改了
const mutated = users.map((u) => {
  u.age += 1; // 改的是原对象的属性！
  return u; // 返回的还是同一个对象
});
console.log('\n危险写法结果 =', JSON.stringify(mutated));
console.log('原数组变成了 =', JSON.stringify(users), '（被污染了！）');

// 正确写法：返回一个新对象（展开运算符做浅拷贝）
const users2 = [
  { id: 1, name: '张三', age: 20 },
  { id: 2, name: '李四', age: 30 },
];
const safeMapped = users2.map((u) => ({ ...u, age: u.age + 1 }));
console.log('\n安全写法结果 =', JSON.stringify(safeMapped));
console.log('原数组保持 =', JSON.stringify(users2), '（未被修改）');
console.log('元素是同一引用吗？', safeMapped[0] === users2[0], '（false，是新对象）');

// ---------------------------------------------------------------------------
// 5. for 循环 vs map 对比
// ---------------------------------------------------------------------------

console.log('\n--- 5. for vs map ---');

const prices = [10, 20, 30];

// 命令式：描述"怎么做"
const withTaxFor = [];
for (let i = 0; i < prices.length; i++) {
  withTaxFor.push(prices[i] * 1.1);
}
console.log('for 循环 =', JSON.stringify(withTaxFor));

// 声明式：描述"要什么"
const withTaxMap = prices.map((p) => p * 1.1);
console.log('map      =', JSON.stringify(withTaxMap));

console.log('两者结果一样，但 map 版本没有循环变量、没有临时数组、没有可变状态。');
console.log('（浮点数精度：0.1 + 0.2 类问题在这里依然存在，见 02 号分类的数字章节）');

// 保留两位小数
console.log('保留两位小数 =', JSON.stringify(prices.map((p) => Number((p * 1.1).toFixed(2)))));

// ---------------------------------------------------------------------------
// 6. 常见误用：用 map 做副作用
// ---------------------------------------------------------------------------

console.log('\n--- 6. 误用：用 map 做副作用 ---');

// 误用 A：用 map 只为了遍历打印
console.log('误用 A：arr.map(x => console.log(x))');
const a = [1, 2, 3].map((x) => console.log('  打印到控制台：', x));
console.log('  返回值 =', JSON.stringify(a), '（一堆没用的 undefined）');
console.log('  正确做法：用 forEach');
[1, 2, 3].forEach((x) => console.log('  forEach 打印：', x));

// 误用 B：用 map 往另一个数组里 push
console.log('\n误用 B：在 map 里 push 到外部数组');
const source = [1, 2, 3, 4, 5, 6];
const external = [];
const useless = source.map((n) => {
  if (n % 2 === 0) external.push(n);
  return n;
});
console.log('  external =', JSON.stringify(external));
console.log('  map 的返回值 =', JSON.stringify(useless), '（完全没用上，白白分配了一个新数组）');
console.log('  正确做法：用 filter');
console.log('  filter 版本 =', JSON.stringify(source.filter((n) => n % 2 === 0)));

// 误用 C：用 map 实现"求和"
console.log('\n误用 C：用 map 累加求和');
let total = 0;
source.map((n) => {
  total += n;
});
console.log('  total =', total, '（能跑，但语义上应该用 reduce）');
console.log('  reduce 版本 =', source.reduce((s, n) => s + n, 0));

// 误用 D：忘记接收返回值
console.log('\n误用 D：调用 map 但不接收返回值');
[1, 2, 3].map((n) => n * 100);
console.log('  数组没有任何变化，也没有变量保存结果 —— 这一行的唯一效果是浪费 CPU。');

// ---------------------------------------------------------------------------
// 7. 正确用法：链式调用
// ---------------------------------------------------------------------------

console.log('\n--- 7. 链式调用 ---');

const orders = [
  { id: 'A001', amount: 120, status: 'paid' },
  { id: 'A002', amount: 80, status: 'unpaid' },
  { id: 'A003', amount: 300, status: 'paid' },
  { id: 'A004', amount: 50, status: 'paid' },
];
console.log('订单 =', JSON.stringify(orders));

// 取已支付订单的 id，转大写，加前缀
const ids = orders
  .filter((o) => o.status === 'paid') // 先过滤（变短）
  .map((o) => o.id.toLowerCase()) // 再映射
  .map((id) => `ORDER-${id}`); // 可以多次 map
console.log('已支付订单号 =', JSON.stringify(ids));

// 更常见的做法：一次 map 内完成
console.log('一次 map 完成 =', JSON.stringify(orders.filter((o) => o.status === 'paid').map((o) => `ORDER-${o.id.toLowerCase()}`)));

// 从对象数组提取某列（"pluck"）
const amounts = orders.map((o) => o.amount);
console.log('\n提取金额列 =', JSON.stringify(amounts));
console.log('金额总和 =', amounts.reduce((s, n) => s + n, 0));

// 对象 -> key 数组
console.log('提取 id 列 =', JSON.stringify(orders.map((o) => o.id)));

// ---------------------------------------------------------------------------
// 8. map 与稀疏数组
// ---------------------------------------------------------------------------

console.log('\n--- 8. map 与稀疏数组 ---');

const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
const mappedSparse = sparse.map((n) => n * 2);
console.log('稀疏数组 =', sparse, '长度 =', sparse.length);
console.log('map 之后 =', mappedSparse, '长度 =', mappedSparse.length);
console.log('1 in 结果 =', 1 in mappedSparse, '（空洞被保留，回调没有对它执行）');
console.log('对比 fill + map =', Array.from(sparse).map((n) => (n === undefined ? 0 : n * 2)));
console.log('（Array.from 会把空洞变成真正的 undefined，所以 map 会处理它们）');

// ---------------------------------------------------------------------------
// 9. map 与异步
// ---------------------------------------------------------------------------

console.log('\n--- 9. map 与异步 ---');

const ids2 = [1, 2, 3];

// 错误：直接 await 一个数组，得到的是 Promise 数组
const promises = ids2.map(async (id) => id * 10);
console.log('map(async) 得到的类型 =', Object.prototype.toString.call(promises[0]));

// 正确：Promise.all 包一层
const resolved = await Promise.all(ids2.map(async (id) => id * 10));
console.log('Promise.all(map(async)) =', JSON.stringify(resolved));

// ---------------------------------------------------------------------------
// 10. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 10. 小结 ---');
console.log('map 的三条铁律：');
console.log('  1. 返回新数组，长度与原数组相同，**不修改原数组**；');
console.log('  2. 回调必须有返回值，返回对象字面量要加括号；');
console.log('  3. 只为"转换"而用 map；只为"遍历"用 forEach，"过滤"用 filter，"汇总"用 reduce。');
