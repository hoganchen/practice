/**
 * ============================================================================
 * 知识点：Set 与 Array 对比 —— 查找复杂度、去重、顺序与稳定性的取舍
 * ============================================================================
 *
 * 【所属分类】23_collections —— 集合类型
 * 【难度等级】进阶
 * 【前置知识】23_collections/03_set_basics.js、08_arrays 基础
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Array 和 Set 都能"装一串值"，但设计目标不同：
 *      Array 关心**顺序与位置**：按下标访问、可重复、有丰富的变换方法。
 *      Set 关心**成员关系**：元素唯一、快速判存、不提供下标访问。
 *    所以它们不是替代关系，而是互补关系：各自解决对方不擅长的部分。
 *
 * 2. 为什么需要
 *    代码里大量出现"这个元素在不在集合里"的判断。如果集合很大又要反复判断，
 *    用数组的 includes/indexOf 会让整体复杂度从 O(n) 变成 O(n²)，
 *    数据量一大就会出现肉眼可见的卡顿。
 *
 * 3. 核心语法要点（差异清单）
 *    (1) 查找：Array.includes / indexOf 是 O(n) 线性扫描；
 *        Set.has 平均 O(1)。
 *    (2) 唯一性：Array 允许重复；Set 自动去重（SameValueZero 规则）。
 *    (3) 下标：Array 有 arr[i]、length；Set 都没有（要转数组才能取第 n 个）。
 *    (4) 顺序：两者都保留插入顺序。但注意 Array 的 sort/splice 会改变顺序，
 *        Set 没有这些方法，顺序只受 add/delete 影响。
 *    (5) API：Array 有 map/filter/reduce/slice/splice/indexOf 等几十个方法；
 *        Set 只有 add/has/delete/clear/size 加上几个迭代方法。
 *        需要变换时通常"转数组 -> 变换 -> 转回 Set"。
 *    (6) 增删：Array 在中间增删是 O(n)（要移动后续元素）；
 *        Set 的 add/delete 平均 O(1)。
 *    (7) 索引访问频繁的场景（如按位置取元素、排序、切片）Set 完全不合适。
 *
 * 4. 常见陷阱
 *    (1) 在循环里对数组做 includes，数据量大时性能崩塌。
 *    (2) 以为 Set 能按下标访问：set[0] 是 undefined（除非你恰好存了 "0" 这个键？不会，
 *        Set 不是对象下标访问，一律 undefined）。
 *    (3) 以为 Set 能排序：set.sort 不存在，要 [...set].sort()。
 *    (4) 忘了 Set 的去重会"吃掉"重复数据：如果重复本身有含义（如词频），不能用它。
 *    (5) 对对象元素用 Set 去重无效（引用比较），见 03 号示例。
 *    (6) 认为 Set 一定比 Array 快：小数据量下 Array 往往更快，
 *        因为数组是连续内存、缓存友好，而 Set 有哈希开销。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 23_collections/08_set_vs_array.js
 *
 * 【预期输出】
 *   分 7 个小节，逐项对比查找、去重、顺序、API、增删，并给出选择清单。
 *   性能部分只打印操作计数与结论，不打印不稳定的耗时数值。
 * ============================================================================
 */

console.log('--- 1. 查找复杂度：用"比较次数"直观感受差别 ---');

// 用一个计数器统计"实际发生了多少次元素比较"，避免依赖波动的运行时间。
let probeCount = 0;
/**
 * 模拟 Array.includes：线性扫描，逐个比较。
 * @param {Array} arr 数组
 * @param {*} target 目标值
 * @returns {boolean} 是否存在
 */
function arrayIncludes(arr, target) {
  for (const v of arr) {
    probeCount++; // 每比较一次计数一次
    if (v === target) return true;
  }
  return false;
}

const N = 1000;
const bigArray = Array.from({ length: N }, (_, i) => i);

// 查找一个不存在于数组中的值：必须比较完所有元素。
probeCount = 0;
const notFound = arrayIncludes(bigArray, -1);
console.log(`数组长度 ${N}，查找一个不存在的值：`);
console.log('  结果 =', notFound, '，比较次数 =', probeCount, '（最坏情况要看完整个数组）');

// Set 的查找：哈希定位，与元素个数无关（这里用一个"模拟计数"表达语义）。
const bigSet = new Set(bigArray);
console.log('Set 查找同一个值：');
console.log('  bigSet.has(-1) =', bigSet.has(-1), '，语义上只需 1 次哈希查找（平均 O(1)）');
console.log('  注意：Set 的 has 不暴露比较次数，这里的"1 次"是复杂度说明，不是实测。');

console.log('\n--- 2. 真实差距：在循环里做判存 ---');

// 场景：找出同时出现在两个列表中的元素（共同好友）。
const listA = Array.from({ length: 200 }, (_, i) => i * 2); // 0,2,4,...,398
const listB = Array.from({ length: 200 }, (_, i) => i * 3); // 0,3,6,...,597

// ❌ 数组版：嵌套 includes，复杂度 O(n*m)。
let arrayProbes = 0;
const commonWithArray = [];
for (const a of listA) {
  // 手工模拟 includes，方便计数
  for (const b of listB) {
    arrayProbes++;
    if (a === b) { commonWithArray.push(a); break; }
  }
}
console.log('用嵌套循环（等价于 array.includes）：');
console.log('  结果个数 =', commonWithArray.length, '，比较次数 =', arrayProbes, '（约 n*m）');

// ✅ Set 版：先把 B 装进 Set，再遍历 A 判存，复杂度 O(n+m)。
let setOperations = 0;
const setB = new Set(listB);
setB.forEach(() => setOperations++); // 构建 Set 的 n 次操作
const commonWithSet = listA.filter((a) => { setOperations++; return setB.has(a); });
console.log('用 Set 判存：');
console.log('  结果个数 =', commonWithSet.length, '，操作次数 ≈', setOperations, '（约 n+m）');
console.log('  两者结果一致：', JSON.stringify(commonWithArray) === JSON.stringify(commonWithSet));
console.log(`  操作次数比 ≈ ${Math.round(arrayProbes / setOperations)} 倍（元素越多差距越大，这里是 200 vs 200）`);
console.log('  ⚠️ 这两个数字是"操作计数"，与机器无关，可放心比较；实际耗时还受缓存等因素影响。');

console.log('\n--- 3. 唯一性：Array 允许重复，Set 自动去重 ---');
const arrDup = [1, 2, 2, 3, 3, 3];
const setDup = new Set(arrDup);
console.log('Array ->', JSON.stringify(arrDup), '，length =', arrDup.length);
console.log('Set   ->', JSON.stringify([...setDup]), '，size =', setDup.size);
console.log('⚠️ 如果重复本身有含义（比如词频统计），就不能用 Set —— 会丢信息。');
// 词频统计必须用 Map，而不是 Set。
const words = ['a', 'b', 'a', 'c', 'b', 'a'];
const freq = new Map();
for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
console.log('词频统计要用 Map：', JSON.stringify([...freq]));

console.log('\n--- 4. 顺序与下标：Set 没有下标访问 ---');
const colors = new Set(['red', 'green', 'blue']);
console.log('Set 的元素 =', [...colors].join(' , '), '（保持插入顺序）');
console.log('colors[0]  =', colors[0], '（undefined —— Set 不支持下标访问）');
console.log('colors.length =', colors.length, '（undefined —— 用 size 而不是 length）');
console.log('colors.size   =', colors.size);
// 想取第 n 个元素，必须转数组（O(n)）。
const asArray = [...colors];
console.log('转数组后取第 2 个：', asArray[1], '（这一步是 O(n)）');
console.log('Set 也没有 sort / splice / reverse：', typeof colors.sort, typeof colors.splice);
console.log('需要排序时转数组排完再转回：', JSON.stringify([...colors].sort().reverse()));

console.log('\n--- 5. API 丰富度：变换要借道数组 ---');

/**
 * 对 Set 做"映射"：Set 没有 map，只能先转数组。
 * @param {Set} set 原集合
 * @param {Function} fn 映射函数
 * @returns {Set} 新集合（结果自动去重）
 */
const setMap = (set, fn) => new Set([...set].map(fn));

/**
 * 对 Set 做"过滤"。
 * @param {Set} set 原集合
 * @param {Function} predicate 判定函数
 * @returns {Set} 新集合
 */
const setFilter = (set, predicate) => new Set([...set].filter(predicate));

const nums = new Set([1, 2, 3, 4, 5]);
console.log('原 Set          =', [...nums].join(', '));
console.log('setMap(x => x*x)=', [...setMap(nums, (x) => x * x)].join(', '));
console.log('setFilter(偶数) =', [...setFilter(nums, (x) => x % 2 === 0)].join(', '));
console.log('reduce 也一样要转数组：Sum =', [...nums].reduce((a, b) => a + b, 0));
console.log('注意：setMap(x => x % 3) 会因为去重而"丢元素"：', [...setMap(nums, (x) => x % 3)].join(', '));

console.log('\n--- 6. 增删代价：中间插删除 vs 直接增删 ---');

// Array 在中间插入/删除需要移动后续元素，是 O(n)。
const arrMove = [1, 2, 3, 4, 5];
const movesForSplice = arrMove.length - 1; // 从下标 1 插入，后面 4 个元素都要挪
arrMove.splice(1, 0, 99);
console.log('Array splice 插入后 =', JSON.stringify(arrMove));
console.log('  需要移动的后续元素个数 =', movesForSplice, '（n 越大代价越大，O(n)）');
// Set 的增删与位置无关，平均 O(1)。
const setMove = new Set([1, 2, 3, 4, 5]);
setMove.add(99);
console.log('Set add 后 =', [...setMove].join(', '), '（平均 O(1)，但新元素只能排在末尾）');
console.log('⚠️ Set 无法"插到中间" —— 顺序由插入时间决定，这是它表达力的边界。');

console.log('\n--- 7. 什么时候用哪个 ---');
const decision = [
  ['需要按下标随机访问', 'Array'],
  ['需要排序 / 切片 / 反转', 'Array'],
  ['允许重复元素（如词频、日志）', 'Array'],
  ['需要 map/filter/reduce 链式变换', 'Array'],
  ['元素必须唯一（如标签、ID 集）', 'Set'],
  ['需要高频"在不在"判断', 'Set'],
  ['需要频繁增删元素', 'Set'],
  ['数据要经过 JSON 序列化', 'Array（Set 要先转数组）'],
  ['既要唯一又要排序', 'Set 去重 + 转数组排序'],
  ['既要唯一又要计数', 'Map（值存计数）'],
];
for (const [scene, choice] of decision) {
  console.log(`  ${scene.padEnd(32)} -> ${choice}`);
}

console.log('\n--- 8. 一个常见的组合模式 ---');
// 模式：用 Set 去重/判存，用 Array 负责顺序与变换。
const rawTags = ['js', 'css', 'js', 'html', 'css', 'ts'];
console.log('原始标签（有重复）=', JSON.stringify(rawTags));
const uniqueSorted = [...new Set(rawTags)].sort();
console.log('去重 + 排序       =', JSON.stringify(uniqueSorted));
const filterLower = uniqueSorted.filter((t) => t.length === 2);
console.log('再按长度过滤      =', JSON.stringify(filterLower));
console.log('✅ 这就是最常见的用法：Set 负责"去重与判存"，Array 负责"顺序与变换"。');
console.log('\n本节结束。');
