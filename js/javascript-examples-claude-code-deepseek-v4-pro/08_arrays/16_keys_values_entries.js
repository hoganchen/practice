/**
 * ============================================================================
 * 知识点：keys / values / entries 迭代器 —— 与解构、for...of 的配合
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】进阶
 * 【前置知识】08_arrays/15_at_and_negative_index.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这三个方法都返回**迭代器（Iterator）**，而不是数组：
 *      arr.keys()    返回下标迭代器      0, 1, 2, ...
 *      arr.values()  返回元素迭代器      元素1, 元素2, ...
 *      arr.entries() 返回 [下标, 元素] 对 的迭代器  [0, 元素1], [1, 元素2], ...
 *
 *    迭代器是一个"惰性"对象：它不预先算出所有值，只有你每次调用 next() 时才产生一个值。
 *    凡是能"被遍历"的语法（for...of、展开运算符 ...、解构赋值、Array.from、
 *    Promise.all 等）都能消费迭代器。
 *
 *    `for (const v of arr)` 内部调用的其实正是 arr[Symbol.iterator]()，
 *    而 arr.values() 就是 arr[Symbol.iterator] 本身 —— 所以它们行为一致。
 *
 * 2. 为什么需要它
 *    - entries() 解决了"同时要下标和元素"的痛点，而且可以直接解构：
 *        for (const [i, item] of arr.entries()) { ... }
 *      比 arr.forEach((item, i) => ...) 更灵活（能用 break/continue，能 await）。
 *    - keys() 可以拿来做"倒序遍历"或配合 values() 做"错位遍历"。
 *    - 迭代器是**惰性**的，对于"只需要前几个"的场景可以省下计算。
 *    - 迭代器还能喂给 Map 构造函数：new Map(arr.entries()) 就是"下标 -> 值"的映射。
 *
 * 3. 核心语法要点
 *    (1) 三个方法都**不修改原数组**（non-mutating），只读。
 *    (2) 迭代器是"一次性"的：遍历完就耗尽了，再 for...of 一次不会有任何输出。
 *        需要重复遍历就重新调用一次 arr.entries()，或用 Array.from 物化成数组。
 *    (3) 迭代器"看不见"长度：没有 length 属性，所以不能 arr.entries().length。
 *        需要长度就先 Array.from 转成数组。
 *    (4) 迭代器可以用 ... 展开：[...arr.keys()] 得到 [0, 1, 2]。
 *    (5) 手动消费迭代器：it.next() 返回 { value, done }，遍历结束时 done === true。
 *    (6) 迭代器是"活的"：遍历过程中修改数组，会反映到后续取值上（与 forEach 不同，
 *        forEach 的长度在开始前已确定；for...of 是每次迭代都重新取 next()，
 *        所以对"新增元素"的行为是"能看到追加的元素"）。
 *        这个差异属于边缘行为，不要依赖它，但要知道它存在。
 *    (7) 迭代协议是统一的：String、Map、Set、Generator 都有 keys/values/entries。
 *        Map.prototype.entries 给出 [key, value]，Set 的 keys 与 values 相同。
 *
 * 4. 常见陷阱
 *    - 把迭代器当数组用：entries() 返回的不是数组，没有 map/filter/length。
 *      要么 [...it] / Array.from(it) 物化，要么用 for...of 直接消费。
 *    - 迭代器只能消费一次，第二次遍历是空的（不会报错，静默无输出）。
 *    - 解构 for (const [i, v] of arr.entries()) 中的顺序是 **先下标后元素**，
 *      和 forEach 的 (element, index) 顺序**正好相反**，很容易记混。
 *    - arr.keys() 与 Object.keys(arr) 不同：前者是惰性迭代器，后者是立即求值的真数组。
 *    - Map 的 entries 顺序是 [key, value]，数组的 entries 顺序是 [index, value]，
 *      两者长得像但语义不同，读代码时要看对象类型。
 *    - 迭代器本身也可以被"部分消费"：先手动 next() 几次再交给 for...of，
 *      会从当前位置继续 —— 这在实现"跳过表头"之类的逻辑时有用，但也容易造成困惑。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/16_keys_values_entries.js
 *
 * 【预期输出】
 *   依次演示三个方法返回的迭代器内容、与 for...of / 解构 / 展开运算符的配合、
 *   手动消费迭代器、一次性与惰性特性，最后是 Map 构造、错位遍历等实战。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 三个方法返回什么
// ---------------------------------------------------------------------------

console.log('--- 1. 三个方法返回什么 ---');

const fruits = ['苹果', '香蕉', '橙子'];
console.log('数组 =', JSON.stringify(fruits), '长度 =', fruits.length);

const keysIt = fruits.keys();
const valuesIt = fruits.values();
const entriesIt = fruits.entries();

console.log('\n返回值的类型：');
console.log('fruits.keys()    的 toString =', Object.prototype.toString.call(keysIt));
console.log('它是数组吗？Array.isArray(keysIt) =', Array.isArray(keysIt), '（不是数组，是迭代器）');
console.log('它继承自 =', Object.getPrototypeOf(Object.getPrototypeOf(keysIt)).constructor.name);
console.log('typeof =', typeof keysIt);

console.log('\n物化成数组来看内容：');
console.log('[...fruits.keys()]    =', JSON.stringify([...fruits.keys()]));
console.log('[...fruits.values()]  =', JSON.stringify([...fruits.values()]));
console.log('[...fruits.entries()] =', JSON.stringify([...fruits.entries()]));

// 迭代器的共同特征
console.log('\n迭代器对象的特征：');
console.log('有 next 方法吗？', typeof keysIt.next === 'function');
console.log('有 length 吗？  ', keysIt.length, '（迭代器没有长度，这是常见的困惑点）');
console.log('有 Symbol.iterator 吗？', typeof keysIt[Symbol.iterator] === 'function', '（所以它自己是可迭代的）');

// 原数组没有变
console.log('\n原数组依然是 =', JSON.stringify(fruits), '（三个方法都不修改原数组）');

// ---------------------------------------------------------------------------
// 2. 手动消费迭代器：next() 与 { value, done }
// ---------------------------------------------------------------------------

console.log('\n--- 2. 手动消费迭代器 ---');

const it = ['a', 'b'].entries();

console.log('第 1 次 next() =', JSON.stringify(it.next()));
console.log('第 2 次 next() =', JSON.stringify(it.next()));
console.log('第 3 次 next() =', JSON.stringify(it.next()), '（done: true 表示已耗尽）');
console.log('第 4 次 next() =', JSON.stringify(it.next()), '（耗尽后 value 永远是 undefined）');

// 用 while 循环消费迭代器（等价于 for...of 的手写版）
console.log('\n手写 while 消费：');
const it2 = ['x', 'y', 'z'].values();
let step = it2.next();
while (!step.done) {
  console.log('  取到 =', step.value);
  step = it2.next();
}

// for...of 其实就是这个过程的语法糖
console.log('\nfor...of 语法糖（推荐）：');
for (const v of ['x', 'y', 'z'].values()) {
  console.log('  取到 =', v);
}

// ---------------------------------------------------------------------------
// 3. 与 for...of 配合
// ---------------------------------------------------------------------------

console.log('\n--- 3. 与 for...of 配合 ---');

const users = [
  { name: '张三', age: 20 },
  { name: '李四', age: 31 },
  { name: '王五', age: 25 },
];

// keys：需要下标时
console.log('遍历 keys：');
for (const i of users.keys()) {
  console.log(`  下标 ${i}`);
}

// values：等价于直接 for...of 数组
console.log('\n遍历 values（与直接 for...of 数组等价）：');
for (const u of users.values()) {
  console.log('  ', u.name);
}
console.log('（数组默认的迭代行为就是 values，所以 for (const u of users) 完全一样）');

// entries：同时拿到下标和元素（最常用）
console.log('\n遍历 entries（推荐写法）：');
for (const [index, user] of users.entries()) {
  console.log(`  #${index + 1} ${user.name}（${user.age} 岁）`);
}

// 注意参数顺序：entries 是 [下标, 元素]，与 forEach 的 (元素, 下标) 相反！
console.log('\n顺序对比（很容易记混）：');
users.forEach((user, index) => console.log(`  forEach：(元素, 下标) -> ${user.name}, ${index}`));
for (const [index, user] of users.entries()) console.log(`  entries：[下标, 元素] -> ${index}, ${user.name}`);

// for...of + entries 能做的事，forEach 做不到：
console.log('\nentries 的优势：可以 break');
for (const [index, user] of users.entries()) {
  if (user.age >= 30) {
    console.log(`  找到了：${user.name} 在下标 ${index}，提前结束`);
    break;
  }
  console.log(`  检查 ${user.name}...`);
}

// 也能 continue
console.log('\nentries + continue（跳过未成年人）：');
const ages = [17, 20, 15, 30];
for (const [i, age] of ages.entries()) {
  if (age < 18) continue;
  console.log(`  下标 ${i}：${age} 岁，成年人`);
}

// ---------------------------------------------------------------------------
// 4. 与解构、展开运算符配合
// ---------------------------------------------------------------------------

console.log('\n--- 4. 与解构和展开配合 ---');

const pairs = [['a', 1], ['b', 2], ['c', 3]];

// 直接解构每对
console.log('解构遍历：');
for (const [key, value] of pairs) {
  console.log(`  ${key} = ${value}`);
}

// 用 entries 得到的数组，可以直接喂给 Object.fromEntries
const arr = ['x', 'y', 'z'];
const objFromEntries = Object.fromEntries(arr.entries());
console.log('\nObject.fromEntries(arr.entries()) =', JSON.stringify(objFromEntries), '（下标 -> 值 的对象）');

// 用 entries 构造 Map
const mapFromEntries = new Map(arr.entries());
console.log('new Map(arr.entries()) =', mapFromEntries, '（下标 0/1/2 作为 key）');

// 反向：用 Map 的 entries 还原成数组
console.log('[...mapFromEntries.entries()] =', JSON.stringify([...mapFromEntries.entries()]));

// 展开迭代器得到数组
console.log('\n展开成数组：');
console.log('[...arr.keys()]    =', JSON.stringify([...arr.keys()]));
console.log('[...arr.entries()] =', JSON.stringify([...arr.entries()]));
console.log('Array.from(arr.entries()) =', JSON.stringify(Array.from(arr.entries())), '（等价写法）');

// 解构赋值也能直接吃迭代器
const [firstKey, secondKey] = arr.keys();
console.log('\n解构迭代器：[firstKey, secondKey] of arr.keys() =', firstKey, secondKey);

// 用迭代器做"取前 N 个"（惰性，不需要遍历全部）
const [a0, a1] = arr.entries();
console.log('[a0, a1] = arr.entries() 的前两项 =', JSON.stringify(a0), JSON.stringify(a1));

// ---------------------------------------------------------------------------
// 5. 迭代器是"一次性"的
// ---------------------------------------------------------------------------

console.log('\n--- 5. 迭代器是一次性的 ---');

const onceIt = ['p', 'q'].entries();

// 第一次消费：有输出
const firstPass = [];
for (const [i, v] of onceIt) {
  firstPass.push([i, v]);
}
console.log('第一次遍历 =', JSON.stringify(firstPass));

// 第二次消费同一个迭代器：什么都没有
const secondPass = [];
for (const [i, v] of onceIt) {
  secondPass.push([i, v]);
}
console.log('第二次遍历同一个迭代器 =', JSON.stringify(secondPass), '（空！迭代器已耗尽）');

// 正确做法一：重新调用方法拿到新迭代器
const secondPassFixed = [...['p', 'q'].entries()];
console.log('重新调用一次 =', JSON.stringify(secondPassFixed));

// 正确做法二：先物化成数组，数组可以反复遍历
const materialized = [...['p', 'q'].entries()];
console.log('物化后第一次 =', JSON.stringify(materialized));
console.log('物化后第二次 =', JSON.stringify(materialized), '（数组可以反复遍历）');

// ---------------------------------------------------------------------------
// 6. 迭代器是"活的"：遍历过程中的修改
// ---------------------------------------------------------------------------

console.log('\n--- 6. 迭代器与遍历中的修改 ---');

// for...of 每次迭代都重新取 next()，因此新增元素会被遍历到
const growable = ['a', 'b'];
const seen = [];
for (const v of growable) {
  seen.push(v);
  if (v === 'a') growable.push('c'); // 遍历中追加
}
console.log('for...of + 遍历中 push：seen =', JSON.stringify(seen), '（c 被遍历到了）');
console.log('（对比 forEach：长度在开始前就确定，不会遍历到新增元素，见 07 号文件）');

// 注意：这属于"边缘行为"，正常代码里不要在遍历时改数组
console.log('建议：不要在遍历数组的过程中增删元素，容易写出难以复现的 bug。');

// ---------------------------------------------------------------------------
// 7. Map / Set 的同类方法
// ---------------------------------------------------------------------------

console.log('\n--- 7. Map / Set 也有这三个方法 ---');

const scoreMap = new Map([
  ['语文', 90],
  ['数学', 85],
]);

console.log('Map 的 keys   =', JSON.stringify([...scoreMap.keys()]));
console.log('Map 的 values =', JSON.stringify([...scoreMap.values()]));
console.log('Map 的 entries=', JSON.stringify([...scoreMap.entries()]));

// Map 的 entries 顺序是 [key, value]，与数组的 [index, value] 形状相似
for (const [subject, score] of scoreMap.entries()) {
  console.log(`  ${subject}: ${score}`);
}

// Map 的默认迭代行为就是 entries
for (const [subject, score] of scoreMap) {
  console.log(`  默认迭代 -> ${subject}: ${score}`);
}

const tagSet = new Set(['前端', 'Node']);
console.log('\nSet 的 keys   =', JSON.stringify([...tagSet.keys()]));
console.log('Set 的 values =', JSON.stringify([...tagSet.values()]), '（Set 的 keys 与 values 完全相同）');
console.log('Set 的 entries=', JSON.stringify([...tagSet.entries()]), '（[值, 值] 的形式，为了与 Map 接口一致）');

// 对象没有 entries 方法，要用静态的 Object.entries
const plainObj = { a: 1, b: 2 };
console.log('\n对象要用 Object.entries =', JSON.stringify(Object.entries(plainObj)));
console.log('对象也没有 keys/values 实例方法，都是 Object.keys / Object.values。');

// ---------------------------------------------------------------------------
// 8. 实战
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战 ---');

// 场景一：带序号的列表渲染
const tasks = ['写代码', '写测试', '写文档'];
console.log('带序号的任务清单：');
for (const [i, task] of tasks.entries()) {
  console.log(`  ${String(i + 1).padStart(2, '0')}. ${task}`);
}

// 场景二：找"重复项的下标"
const items = ['A', 'B', 'A', 'C', 'B'];
const firstSeenAt = new Map();
const duplicates = [];
for (const [i, item] of items.entries()) {
  if (firstSeenAt.has(item)) {
    duplicates.push({ item, first: firstSeenAt.get(item), second: i });
  } else {
    firstSeenAt.set(item, i);
  }
}
console.log('\n重复项 =', JSON.stringify(duplicates));

// 场景三：错位遍历（把相邻元素配对）
const nums2 = [1, 2, 3, 4, 5];
const pairsFromEntries = [...nums2.keys()]
  .slice(1)
  .map((i) => [nums2[i - 1], nums2[i]]);
console.log('\n相邻元素对 =', JSON.stringify(pairsFromEntries));
console.log('（用 keys() 生成下标序列，再按需组合，是"索引驱动"处理的一种思路）');

// 场景四：把数组转成"下标 -> 元素"的查找表
const lookup = Object.fromEntries(tasks.entries());
console.log('\n下标查找表 =', JSON.stringify(lookup));
console.log('查下标 1 =', JSON.stringify(lookup[1]));

// 场景五：跳过表头的遍历
const rows = ['name,age', '张三,20', '李四,31'];
const itRows = rows.entries();
itRows.next(); // 手动跳过第一项（表头）
console.log('\n跳过表头后的数据行：');
for (const [i, row] of itRows) {
  console.log(`  行 ${i}: ${row}`);
}

// 场景六：用 keys 做倒序下标遍历（不修改数组）
const list = ['x', 'y', 'z'];
console.log('\n倒序遍历（不改数组）：');
for (const i of [...list.keys()].reverse()) {
  console.log(`  ${i}: ${list[i]}`);
}

// 场景七：把 entries 转成 Markdown 表格
const table = [
  ['名称', '数量'],
  ['苹果', 3],
  ['香蕉', 5],
];
const md = [...table.entries()]
  .map(([i, row]) => `| ${row.join(' | ')} |${i === 0 ? '\n| --- | --- |' : ''}`)
  .join('\n');
console.log('\nMarkdown 表格：');
console.log(md);

// ---------------------------------------------------------------------------
// 9. 速查
// ---------------------------------------------------------------------------

console.log('\n--- 9. 速查 ---');
console.log('arr.keys()    -> 下标迭代器        0, 1, 2, ...');
console.log('arr.values()  -> 元素迭代器        v0, v1, v2, ...');
console.log('arr.entries() -> [下标, 元素] 迭代器 [0, v0], [1, v1], ...');
console.log('三者都：不修改原数组、惰性求值、只能消费一次、没有 length。');
console.log('要数组就 [...it] 或 Array.from(it)，要遍历就直接 for...of。');
console.log('entries 的解构顺序是 [下标, 元素]，与 forEach 的 (元素, 下标) 相反，务必小心。');
