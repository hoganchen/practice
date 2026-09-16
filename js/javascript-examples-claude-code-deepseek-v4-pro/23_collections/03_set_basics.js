/**
 * ============================================================================
 * 知识点：Set 基础 —— 唯一值集合与数组去重
 * ============================================================================
 *
 * 【所属分类】23_collections —— 集合类型
 * 【难度等级】入门
 * 【前置知识】23_collections/01_map_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Set 是 ES2015 引入的"值集合"：一组**互不相同**的值，只关心"有没有"，
 *    不关心"排第几"。它的接口可以概括为"Map 的一半"——
 *    Map 存键值对，Set 只存键（可以理解为 value 恒为 undefined 的 Map）。
 *
 * 2. 为什么需要
 *    (1) 去重：一行代码搞定数组去重，且保持首次出现顺序。
 *    (2) 快速判存：set.has(x) 的复杂度是 O(1)，而数组的 includes 是 O(n)。
 *        在循环里判断"是否见过"时，Set 能把 O(n²) 降到 O(n)。
 *    (3) 表达"集合"这一语义：标签、权限、ID 列表、已访问节点……
 *    注意两个副作用：Set 的元素唯一，且**插入顺序被保留**。
 *
 * 3. 核心语法要点
 *    (1) 构造：
 *          new Set()                     空集合
 *          new Set(iterable)             从数组 / 字符串 / Map / 另一个 Set 初始化
 *          字符串会被逐字符拆分：new Set('aab') -> {'a','b'}
 *    (2) 增：set.add(value)  返回 Set 本身，可链式；重复添加是"无操作"，不会报错
 *    (3) 查：set.has(value)  返回布尔值（注意是 has 不是 contains / includes）
 *    (4) 删：set.delete(value) 返回布尔值，表示是否真的删掉了
 *    (5) 清：set.clear()
 *    (6) 量：set.size  属性（不是方法）
 *    (7) 遍历：Set 是可迭代的，for...of 直接拿值；有 keys/values/entries 三个方法，
 *        其中 keys() 与 values() 完全相同，entries() 返回 [value, value] 对
 *        （这是为了与 Map 接口保持一致而做的兼容设计）。
 *    (8) 相等性同样遵循 SameValueZero：NaN 与 NaN 是同一个值，+0 与 -0 视为相同。
 *
 * 4. 常见陷阱
 *    (1) 写 set.size() 报错（它是属性）。
 *    (2) 用 set[0] 或 set.length 取元素 —— 都没有，必须用迭代或转数组。
 *    (3) 以为 Set 只能存字符串/数字：任何类型都能存，对象按引用比较。
 *    (4) JSON.stringify(new Set([1,2])) 得到 '{}'，序列化前要先转数组。
 *    (5) 去重时对"内容相同的对象"无效：{a:1} 与 {a:1} 是两个不同元素。
 *    (6) 判断"是否包含"时误用 Array.from(set).includes(x) —— 白白退化回 O(n)。
 *    (7) 以为 new Set(数组) 会返回数组：它返回 Set，需要 [...set] 转回去。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 23_collections/03_set_basics.js
 *
 * 【预期输出】
 *   分 7 个小节，演示构造、增删查改、唯一性与 SameValueZero、
 *   数组去重的多种写法、对象元素的引用语义、遍历，以及常用工具函数。输出固定。
 * ============================================================================
 */

console.log('--- 1. 创建 Set 的几种方式 ---');

console.log('new Set() 的 size =', new Set().size);
// 从数组创建，自动去重。
console.log('new Set([1, 2, 2, 3, 3, 3]) ->', [...new Set([1, 2, 2, 3, 3, 3])]);
// 从字符串创建：逐字符拆分。
console.log("new Set('hello') ->", [...new Set('hello')].join(', '), '（重复的 l 被合并）');
// 从另一个 Set 复制。
const base = new Set([1, 2, 3]);
console.log('new Set(另一个 Set) ->', [...new Set(base)]);
// 从 Map 创建：注意 Map 的默认迭代器产出的是 [键, 值] 对，
// 所以 new Set(map) 得到的其实是"键值对数组"的集合，通常不是你想要的。
const m = new Map([['a', 1], ['b', 2]]);
console.log('new Set(Map)        ->', JSON.stringify([...new Set(m)]), '（元素是 [k, v] 数组）');
console.log('new Set(Map.keys()) ->', JSON.stringify([...new Set(m.keys())]), '✅ 想要键就用 .keys()');
// 从生成器创建。
function* naturals(n) { for (let i = 1; i <= n; i++) yield i * i; }
console.log('new Set(生成器) ->', [...new Set(naturals(5))]);

console.log('\n--- 2. add / has / delete / clear / size ---');

const tags = new Set();
// add 返回 Set 本身，可链式。
const chained = tags.add('js').add('ts').add('node');
console.log('add 返回的是 Set 本身吗：', chained === tags);
console.log('链式添加后 size =', tags.size);

// 重复 add 是幂等的：不报错，size 不变。
tags.add('js');
console.log("重复 add('js') 后 size =", tags.size, '（没变）');

// has 判断存在性。
console.log("has('js')      =", tags.has('js'));
console.log("has('python')  =", tags.has('python'));

// delete 返回布尔值。
console.log("delete('ts')   =", tags.delete('ts'));
console.log("再 delete('ts') =", tags.delete('ts'), '（本来就没有）');
console.log('删除后 size =', tags.size, '，内容 =', [...tags].join(', '));

// clear 清空。
const toClear = new Set([1, 2, 3]);
toClear.clear();
console.log('clear() 后 size =', toClear.size);

console.log('\n--- 3. 唯一性与 SameValueZero 规则 ---');

const mixed = new Set();
mixed.add(1);
mixed.add('1'); // 字符串 '1' 与数字 1 不同
mixed.add(true); // 布尔 true 与数字 1 不同（与 == 的宽松相等不同！）
mixed.add(null);
mixed.add(undefined);
console.log('混合类型 ->', [...mixed].map((v) => `${typeof v}:${String(v)}`).join('  '));
console.log('size =', mixed.size, '（1、\'1\'、true 是三个不同的值）');

// NaN：Map/Set 认为 NaN 等于自身。
const nanSet = new Set();
nanSet.add(NaN);
nanSet.add(NaN);
console.log('重复 add(NaN) 后 size =', nanSet.size, '，has(NaN) =', nanSet.has(NaN), '（NaN === NaN 是 false，但 Set 认为它们相同）');
// +0 与 -0 视为同一个值。
const zeroSet = new Set([0, -0]);
console.log('new Set([0, -0]) 的 size =', zeroSet.size, '（+0 与 -0 被认为相同）');

console.log('\n--- 4. 数组去重：Set 最常用的场景 ---');

const withDupes = [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5];
console.log('原数组 =', JSON.stringify(withDupes));
// ✅ 标准写法：既去重又保持首次出现的顺序。
const unique = [...new Set(withDupes)];
console.log('去重后 =', JSON.stringify(unique), '（顺序是首次出现的顺序）');
// 等价写法。
console.log('Array.from(new Set(...)) =', JSON.stringify(Array.from(new Set(withDupes))));
// 不要求顺序时也可以用 filter + indexOf，但复杂度是 O(n²)，数据量大时明显更慢。
const byFilter = withDupes.filter((v, i, arr) => arr.indexOf(v) === i);
console.log('filter + indexOf 的结果 =', JSON.stringify(byFilter), '（结果相同，但慢）');

// 字符串数组去重。
const words = ['apple', 'banana', 'apple', 'cherry', 'banana'];
console.log('字符串去重 =', JSON.stringify([...new Set(words)]));

console.log('\n--- 5. 陷阱：对象元素按引用比较 ---');

const objSet = new Set();
objSet.add({ id: 1 });
objSet.add({ id: 1 }); // 内容相同，但是另一个对象
console.log('两个"内容相同"的对象 -> size =', objSet.size, '（被当成两个不同元素）');

const sameRef = { id: 1 };
objSet.add(sameRef);
objSet.add(sameRef); // 同一个引用
console.log('同一个引用加两次 -> size =', objSet.size, '（只算一个）');
console.log('has({ id: 1 }) =', objSet.has({ id: 1 }), '（false，不是同一个引用）');
console.log('has(sameRef)   =', objSet.has(sameRef), '（true）');
console.log('✅ 想让"内容相同即算重复"，要先映射成字符串等原始值，例如：');
const byId = new Set([{ id: 1 }, { id: 1 }, { id: 2 }].map((o) => JSON.stringify(o)));
console.log('   按 JSON 字符串去重后 size =', byId.size);
console.log('   更常见的做法是提取唯一字段：new Set(list.map((o) => o.id))');

console.log('\n--- 6. 遍历 Set ---');

const colors = new Set(['red', 'green', 'blue']);
// 直接 for...of，拿到的就是值（不像 Map 是 [k, v] 对）。
for (const color of colors) console.log('  for...of ->', color);
// forEach 的三个参数是 (value, valueAgain, set)；第二个参数重复是为了与 Map 接口对齐。
colors.forEach((value, valueAgain, set) => {
  console.log(`  forEach  value=${value}  valueAgain=${valueAgain}  同一个值吗=${value === valueAgain}  size=${set.size}`);
});
// keys() 与 values() 完全相同；entries() 返回 [v, v]。
console.log('keys()   =', [...colors.keys()]);
console.log('values() =', [...colors.values()]);
console.log('keys 与 values 是同一个函数吗：', Set.prototype.keys === Set.prototype.values);
console.log('entries()= ', JSON.stringify([...colors.entries()]), '（为了与 Map 对齐，键值都是同一个值）');
// 迭代器同样是一次性的。
const it = colors.values();
console.log('第一次 [...it] =', [...it]);
console.log('第二次 [...it] =', [...it], '（已耗尽）');

console.log('\n--- 7. 常用工具函数 ---');

/**
 * 数组去重（保持首次出现顺序）。
 * @param {Array} arr 输入数组
 * @returns {Array} 去重后的新数组
 */
const uniq = (arr) => [...new Set(arr)];
console.log('uniq([1, 1, 2, 3, 3]) =', JSON.stringify(uniq([1, 1, 2, 3, 3])));

/**
 * 求两个数组的交集（结果去重且保持第一个数组的顺序）。
 * @param {Array} a 数组 A
 * @param {Array} b 数组 B
 * @returns {Array}
 */
const intersection = (a, b) => {
  const setB = new Set(b); // 只构造一次，之后每次 has 都是 O(1)
  return [...new Set(a)].filter((v) => setB.has(v));
};
console.log('intersection([1,2,3],[2,3,4]) =', JSON.stringify(intersection([1, 2, 3], [2, 3, 4])));

/**
 * 判断数组是否有重复元素（遇到第一个重复就返回，无需遍历完）。
 * @param {Array} arr 输入数组
 * @returns {boolean}
 */
const hasDuplicate = (arr) => {
  const seen = new Set();
  for (const v of arr) {
    if (seen.has(v)) return true;
    seen.add(v);
  }
  return false;
};
console.log('hasDuplicate([1,2,3])   =', hasDuplicate([1, 2, 3]));
console.log('hasDuplicate([1,2,1])   =', hasDuplicate([1, 2, 1]));

console.log('\n--- 8. 与其他结构互转 ---');
const sample = new Set(['a', 'b', 'c']);
console.log('Set -> 数组          :', JSON.stringify([...sample]));
console.log('Set -> 对象（下标映射）:', JSON.stringify(Object.fromEntries([...sample].map((v, i) => [i, v]))));
console.log('❌ JSON.stringify(Set) =', JSON.stringify(sample), '（得到 {}，Set 不会被序列化成数组）');
console.log('✅ 正确做法：JSON.stringify([...sample]) =', JSON.stringify([...sample]));
console.log('\n本节结束。');
