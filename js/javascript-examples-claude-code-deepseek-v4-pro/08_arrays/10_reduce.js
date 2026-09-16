/**
 * ============================================================================
 * 知识点：reduce 归约 —— 求和、求最值、数组转对象、分组，以及初始值陷阱
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】进阶
 * 【前置知识】08_arrays/09_filter.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    arr.reduce(callback, initialValue) 把整个数组"折叠"成**一个值**。
 *    回调签名是 (accumulator, currentValue, index, array)，返回值为"下一次的累加器"。
 *
 *    执行过程：
 *      acc = initialValue
 *      对每个元素： acc = callback(acc, 当前元素, 下标, 数组)
 *      最终返回 acc
 *
 *    它是数组里**唯一一个"数量级"的方法**：map 是 1 对 1，filter 是 1 对 0/1，
 *    reduce 是 N 对 1。所以求和、求最值、去重、计数、分组、扁平化、数组转对象……
 *    全都可以用 reduce 表达。
 *
 * 2. 为什么需要它
 *    没有 reduce 时，"把一组数据汇总成一个结果"必须手写循环 + 临时变量，
 *    而临时变量意味着可变状态，很容易在复杂场景下出错。reduce 把"初始状态"
 *    和"每一步如何合并"显式地写在调用处，语义清晰、可复用、可组合。
 *
 * 3. 核心语法要点
 *    (1) 初始值（initialValue）**强烈建议总是传**，理由见第 4 节。
 *    (2) 不传初始值时：第一次回调不执行，而是把 arr[0] 当作初始累加器，
 *        currentValue 从 arr[1] 开始。也就是说回调会执行 length - 1 次。
 *    (3) 常见形态：
 *        求和  reduce((sum, n) => sum + n, 0)
 *        计数  reduce((count, item) => count + (cond ? 1 : 0), 0)
 *        求最值 reduce((max, n) => (n > max ? n : max), -Infinity)
 *        转对象 reduce((obj, item) => ({ ...obj, [item.id]: item }), {})
 *        分组  reduce((groups, item) => { (groups[item.key] ??= []).push(item); return groups; }, {})
 *    (4) 累加器不一定是数字：可以是数组、对象、Map、甚至另一个数组的中间态。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**不修改原数组**（non-mutating）。但要注意两点：
 *        ① 如果初始值是原数组里的某个对象，你在回调里改它，就等于改了原数组内部的对象；
 *        ② 用 { ...obj, ... } 展开构造新对象每次都创建新对象，元素多时会明显变慢。
 *           数据量大时应改用"就地修改累加器"的写法（acc[key] = v; return acc;）。
 *    - **空数组 + 不传初始值会抛 TypeError**：`[].reduce((a, b) => a + b)`
 *      抛 "Reduce of empty array with no initial value"。传了初始值就没问题。
 *    - **单元素数组 + 不传初始值**：直接返回那个元素，回调根本不执行。
 *    - 忘记在回调里 return 累加器，下一次的 acc 就变成 undefined，很快就 NaN 或报错。
 *    - 回调参数顺序是 (acc, cur)，和直觉相反 —— 这是最常见的 reduce bug 来源。
 *    - 用 reduce 求"平均分"时要先防除零：(sum / arr.length) || 0。
 *    - 用 reduce 拼字符串性能差（每次都创建新字符串），不如 join。
 *    - reduce 的写法过度嵌套会变得极难读。团队代码里，能用更直白的方法就用更直白的。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/10_reduce.js
 *
 * 【预期输出】
 *   依次演示 reduce 的执行过程、初始值的三种情况（传/不传/空数组抛错）、
 *   求和/计数/求最值/数组转对象/分组/去重等实战，以及常见错误与性能提示。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 从最熟悉的求和开始
// ---------------------------------------------------------------------------

console.log('--- 1. 求和 ---');

const nums = [1, 2, 3, 4, 5];
const sum = nums.reduce((acc, cur) => acc + cur, 0);

console.log('数组 =', JSON.stringify(nums));
console.log('reduce 求和 =', sum);
console.log('原数组未被修改 =', JSON.stringify(nums));

// 手写 for 循环对比
let sumFor = 0;
for (const n of nums) sumFor += n;
console.log('for 循环求和 =', sumFor, '（结果相同，但 reduce 把"初始值"和"合并规则"写在一起）');

// 其他聚合
console.log('\n乘积 =', nums.reduce((a, b) => a * b, 1));
console.log('最大值 =', nums.reduce((max, n) => (n > max ? n : max), -Infinity));
console.log('最大值（更简洁） =', nums.reduce((max, n) => Math.max(max, n), -Infinity));
console.log('最小值 =', nums.reduce((min, n) => (n < min ? n : min), Infinity));
console.log('平均值 =', nums.reduce((a, b) => a + b, 0) / nums.length);

// ---------------------------------------------------------------------------
// 2. 看清 reduce 的执行过程
// ---------------------------------------------------------------------------

console.log('\n--- 2. 执行过程可视化 ---');

const trace = [10, 20, 30];
const traced = trace.reduce((acc, cur, index) => {
  const next = acc + cur;
  console.log(`  第 ${index} 次回调：acc=${acc}, cur=${cur} -> 返回 ${next}`);
  return next;
}, 0);
console.log('最终结果 =', traced);

// 累加器可以是任意类型：比如用它拼一个句子
const wordsArr = ['reduce', '是', '很', '强大', '的'];
const sentence = wordsArr.reduce((s, w) => s + w, '');
console.log('\n拼句子 =', JSON.stringify(sentence), '（不过这种场景 join 更好）');
console.log('用 join =', JSON.stringify(wordsArr.join('')));

// ---------------------------------------------------------------------------
// 3. 计数与条件统计
// ---------------------------------------------------------------------------

console.log('\n--- 3. 计数 ---');

const votes = ['yes', 'no', 'yes', 'yes', 'no'];
const yesCount = votes.reduce((count, v) => (v === 'yes' ? count + 1 : count), 0);
console.log('投票 =', JSON.stringify(votes));
console.log('yes 票数 =', yesCount, '，no 票数 =', votes.length - yesCount);

// 统计"通过"的数量
const scores = [55, 78, 90, 43, 66];
console.log('\n成绩 =', JSON.stringify(scores));
console.log('及格人数 =', scores.reduce((c, s) => c + (s >= 60 ? 1 : 0), 0));

// 更复杂的：一次遍历同时算出多个统计量（用对象当累加器）
const stats = scores.reduce(
  (acc, s) => {
    acc.sum += s;
    acc.max = Math.max(acc.max, s);
    acc.min = Math.min(acc.min, s);
    if (s >= 60) acc.pass++;
    return acc; // 别忘了 return
  },
  { sum: 0, max: -Infinity, min: Infinity, pass: 0 },
);
console.log('一次遍历的统计 =', JSON.stringify(stats));
console.log('平均分 =', (stats.sum / scores.length).toFixed(1));

// ---------------------------------------------------------------------------
// 4. 初始值陷阱（重点）
// ---------------------------------------------------------------------------

console.log('\n--- 4. 初始值陷阱 ---');

// (1) 传了初始值 —— 安全，任何数组都不会出错
console.log('[].reduce((a,b) => a+b, 0) =', [].reduce((a, b) => a + b, 0));
console.log('[5].reduce((a,b) => a+b, 0) =', [5].reduce((a, b) => a + b, 0));

// (2) 不传初始值 + 空数组 -> TypeError
try {
  [].reduce((a, b) => a + b);
} catch (err) {
  console.log('空数组且不传初始值会抛错：', err.constructor.name, '-', err.message);
}

// (3) 不传初始值 + 单元素数组 -> 直接返回该元素，回调不执行
const single = [42].reduce((acc, cur) => {
  console.log('  这行不会被打印');
  return acc + cur;
});
console.log('[42].reduce((a,b) => a+b) =', single, '（回调一次都没执行）');

// (4) 不传初始值 + 多元素 -> 回调执行 length-1 次，arr[0] 当初始值
let callCount = 0;
const noInit = [1, 2, 3].reduce((acc, cur) => {
  callCount++;
  return acc + cur;
});
console.log('[1,2,3].reduce(...) 不传初始值 =', noInit, '，回调执行次数 =', callCount);

callCount = 0;
const withInit = [1, 2, 3].reduce((acc, cur) => {
  callCount++;
  return acc + cur;
}, 0);
console.log('[1,2,3].reduce(..., 0) 传初始值 =', withInit, '，回调执行次数 =', callCount);

// (5) 不传初始值时，累加器的类型由 arr[0] 决定 —— 这是最隐蔽的坑
const strNums = ['1', '2', '3'];
console.log("\n['1','2','3'].reduce((a,b) => a+b) =", JSON.stringify(strNums.reduce((a, b) => a + b)));
console.log('  （结果是字符串 "123"，因为 arr[0] 是字符串，+ 变成拼接）');
console.log("['1','2','3'].reduce((a,b) => a+b, 0) =", JSON.stringify(strNums.reduce((a, b) => a + b, 0)));
console.log('  （结果是数字 6，因为初始值是数字 0）');

// (6) 忘记 return 累加器
const forgotReturn = [1, 2, 3].reduce((acc, cur) => {
  acc + cur; // 没有 return
}, 0);
console.log('\n忘记 return =', forgotReturn);
console.log('（第一次回调返回 undefined，之后 undefined + 2 = NaN）');

// ---------------------------------------------------------------------------
// 5. 数组转对象
// ---------------------------------------------------------------------------

console.log('\n--- 5. 数组转对象 ---');

const users = [
  { id: 'u1', name: '张三', role: 'admin' },
  { id: 'u2', name: '李四', role: 'user' },
  { id: 'u3', name: '王五', role: 'user' },
];

// 按 id 建索引（O(1) 查找），这是 reduce 最经典的用途之一
const userById = users.reduce((acc, u) => {
  acc[u.id] = u;
  return acc;
}, {});
console.log('按 id 建索引 =', JSON.stringify(userById));
console.log('查找 u2 =', JSON.stringify(userById.u2));

// 每次展开新对象的"纯函数"写法（小数据量可读性好，大数据量慢）
const userByIdPure = users.reduce((acc, u) => ({ ...acc, [u.id]: u }), {});
console.log('纯函数写法结果相同 =', JSON.stringify(userByIdPure));

// 数组转 Map 也常用
const userMap = users.reduce((m, u) => m.set(u.id, u), new Map());
console.log('\n转成 Map =', userMap instanceof Map, '，map.get("u3") =', JSON.stringify(userMap.get('u3')));

// 更直接的写法（如果只是"键值对数组 -> 对象"）
console.log('Object.fromEntries 更直接 =', JSON.stringify(Object.fromEntries(users.map((u) => [u.id, u.name]))));

// 计数转为对象：统计每个角色的人数
const roleCount = users.reduce((acc, u) => {
  acc[u.role] = (acc[u.role] ?? 0) + 1;
  return acc;
}, {});
console.log('\n角色人数统计 =', JSON.stringify(roleCount));

// ---------------------------------------------------------------------------
// 6. 分组（group by）
// ---------------------------------------------------------------------------

console.log('\n--- 6. 分组 ---');

const items = [
  { name: '苹果', type: '水果', price: 5 },
  { name: '香蕉', type: '水果', price: 3 },
  { name: '白菜', type: '蔬菜', price: 2 },
  { name: '菠菜', type: '蔬菜', price: 4 },
  { name: '键盘', type: '数码', price: 199 },
];

// 经典 reduce 分组写法
const grouped = items.reduce((acc, item) => {
  // ??= 是"空值赋值"运算符：只有左边是 null/undefined 时才赋值
  (acc[item.type] ??= []).push(item.name);
  return acc;
}, {});
console.log('按类型分组 =', JSON.stringify(grouped));

// 分组 + 聚合：每组的总价
const groupSum = items.reduce((acc, item) => {
  acc[item.type] = (acc[item.type] ?? 0) + item.price;
  return acc;
}, {});
console.log('每组总价 =', JSON.stringify(groupSum));

// 分组 + 排序：每组按价格排序
const groupSorted = items.reduce((acc, item) => {
  (acc[item.type] ??= []).push(item);
  return acc;
}, {});
for (const [type, list] of Object.entries(groupSorted)) {
  list.sort((a, b) => b.price - a.price); // 注意 sort 会改数组（这里改的是我们自己造的分组数组）
  console.log(`  ${type} 按价格降序 =`, JSON.stringify(list.map((i) => `${i.name}(${i.price})`)));
}

console.log('\n提示：ES2024 起可以用 Object.groupBy / Map.groupBy 直接分组，见 20 号文件。');

// ---------------------------------------------------------------------------
// 7. 去重与扁平化（用 reduce 实现）
// ---------------------------------------------------------------------------

console.log('\n--- 7. 去重与扁平化 ---');

const dup = [1, 2, 2, 3, 1, 4];
const uniqueByReduce = dup.reduce((acc, n) => {
  if (!acc.includes(n)) acc.push(n);
  return acc;
}, []);
console.log('reduce 去重 =', JSON.stringify(uniqueByReduce));

// 现代写法：Set 更简洁（且在超大数组上更快，因为 includes 是 O(n)）
console.log('Set 去重 =', JSON.stringify([...new Set(dup)]));

// 扁平化（其实用 flat 更合适，见 11 号文件）
const nested = [[1, 2], [3, 4], [5]];
console.log('\nreduce 扁平化 =', JSON.stringify(nested.reduce((acc, arr) => acc.concat(arr), [])));
console.log('flat() 扁平化 =', JSON.stringify(nested.flat()));

// 统计词频
const text = 'the quick brown fox jumps over the lazy dog the fox';
const wordCount = text.split(' ').reduce((acc, w) => {
  acc[w] = (acc[w] ?? 0) + 1;
  return acc;
}, {});
console.log('\n词频统计 =', JSON.stringify(wordCount));

// 取出出现次数最多的词
const topWord = Object.entries(wordCount).reduce((best, [w, c]) => (c > best[1] ? [w, c] : best), ['', 0]);
console.log('出现最多的词 =', JSON.stringify(topWord));

// ---------------------------------------------------------------------------
// 8. reduceRight：从右往左
// ---------------------------------------------------------------------------

console.log('\n--- 8. reduceRight ---');

const seq = ['a', 'b', 'c'];
console.log("['a','b','c'].reduce((s, c) => s + c, '') =", JSON.stringify(seq.reduce((s, c) => s + c, '')));
console.log("['a','b','c'].reduceRight((s, c) => s + c, '') =", JSON.stringify(seq.reduceRight((s, c) => s + c, '')));

// reduceRight 的经典用途：函数组合（右结合的 compose）
const compose =
  (...fns) =>
  (x) =>
    fns.reduceRight((acc, fn) => fn(acc), x);
const addOne = (n) => n + 1;
const double = (n) => n * 2;
console.log('\ncompose(double, addOne)(5) =', compose(double, addOne)(5), '（先 addOne 再 double = (5+1)*2 = 12）');
console.log('reduce 版本的 pipe(addOne, double)(5) =', [addOne, double].reduce((acc, fn) => fn(acc), 5), '（左到右）');

// ---------------------------------------------------------------------------
// 9. 什么时候不该用 reduce
// ---------------------------------------------------------------------------

console.log('\n--- 9. 什么时候不该用 reduce ---');

const data2 = [1, 2, 3, 4, 5];

// 反例 1：只是求和的常见场景，reduce 合适，但"累加"用 for...of 也很清楚
// 反例 2：想过滤并转换 -> 用 filter + map 比一个巨型 reduce 可读得多
const awkward = data2.reduce((acc, n) => {
  if (n % 2 === 0) acc.push(n * 10);
  return acc;
}, []);
const clear = data2.filter((n) => n % 2 === 0).map((n) => n * 10);
console.log('reduce 一次搞定 =', JSON.stringify(awkward));
console.log('filter + map   =', JSON.stringify(clear), '（更易读，多数情况下更推荐）');

// 反例 3：拼接字符串
const longArray = Array.from({ length: 5000 }, (_, i) => String(i));
const t0 = process.hrtime.bigint();
longArray.reduce((s, w) => s + w + ',', '');
const t1 = process.hrtime.bigint();
longArray.join(',');
const t2 = process.hrtime.bigint();
console.log('\n5000 个元素拼接字符串耗时对比：');
console.log('  reduce 累加 =', Number(t1 - t0) / 1e6, 'ms');
console.log('  join        =', Number(t2 - t1) / 1e6, 'ms', '（join 通常快很多）');

// 反例 4：只是"每个都做一件事" -> 那就是 forEach
console.log('\n如果回调没有"合并"的语义，那它就不是 reduce 的用武之地。');

// ---------------------------------------------------------------------------
// 10. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 10. 小结 ---');
console.log('reduce 的三种典型用途：聚合（求和/最值/计数）、建索引（数组转对象/Map）、分组。');
console.log('三条避坑守则：');
console.log('  1. 永远传初始值（尤其是不确定数组是否为空时）；');
console.log('  2. 回调第一个参数是"累加器"，第二个是"当前元素"，别写反；');
console.log('  3. 回调一定要 return 累加器（除非你故意用就地修改的写法，那也要 return）。');
console.log('reduce 不修改原数组，但它非常灵活 —— 灵活性带来的是可读性风险，能简单就别复杂。');
