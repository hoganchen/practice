/**
 * ============================================================================
 * 知识点：Set 集合运算 —— 并集、交集、差集、对称差集
 * ============================================================================
 *
 * 【所属分类】23_collections —— 集合类型
 * 【难度等级】进阶
 * 【前置知识】23_collections/03_set_basics.js
 *
 * 【也见】34_modern_es_features/06_es2025_set_methods.js —— 同样讲了"原生方法 + 手写实现"两套。
 *        本文件是「集合类型主线」的主场，侧重运算的语义与实战（权限校验等）；
 *        那篇是「ES2025 新特性主线」的主场，侧重版本支持与 lodash 迁移的差异。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    数学上的集合运算，在编程里对应下面几种常见操作：
 *      并集   A ∪ B  —— 属于 A 或属于 B 的元素
 *      交集   A ∩ B  —— 同时属于 A 和 B 的元素
 *      差集   A \ B  —— 属于 A 但不属于 B 的元素（也叫相对补集）
 *      对称差 A △ B  —— 只属于其中一个、不同时属于两个的元素（异或）
 *      子集   A ⊆ B  —— A 的所有元素都在 B 里
 *    JS 的 Set 没有内置这些方法（历史上只能手写），
 *    ES2025 新增了原生方法：union / intersection / difference /
 *    symmetricDifference / isSubsetOf / isSupersetOf / isDisjointFrom。
 *
 * 2. 为什么需要
 *    权限校验（用户权限 ∩ 资源要求权限）、标签筛选（并集/交集）、
 *    版本对比（差集）、推荐系统（相似用户集合的交集大小）……
 *    这些场景用集合运算表达，比嵌套循环清晰且高效得多。
 *
 * 3. 核心语法要点
 *    (1) 手写版本（兼容所有环境）的核心套路：
 *          并集：new Set([...a, ...b])
 *          交集：new Set([...a].filter((v) => b.has(v)))
 *          差集：new Set([...a].filter((v) => !b.has(v)))
 *          对称差：new Set([...a].filter((v) => !b.has(v)).concat([...b].filter((v) => !a.has(v))))
 *        关键点：把其中一个集合转成 Set 后用 has 判断，复杂度 O(n+m)，
 *        而用数组的 includes 会退化成 O(n*m)。
 *    (2) 原生版本（Node 22+ / 现代浏览器）直接就是方法调用：
 *          a.union(b)  a.intersection(b)  a.difference(b)  a.symmetricDifference(b)
 *          a.isSubsetOf(b)  a.isSupersetOf(b)  a.isDisjointFrom(b)
 *        它们接收"类集合对象"（有 size、has、keys 的对象），返回**新 Set**，不修改原集合。
 *    (3) 顺序约定：并集按 a 在前 b 在后的顺序；交集/差集保持 a 的顺序；
 *        对称差先 a 的独有元素、再 b 的独有元素。
 *
 * 4. 常见陷阱
 *    (1) 用数组而不是 Set 做判断，循环里 includes 让复杂度爆炸。
 *    (2) 误以为 a.union(b) 会修改 a —— 所有集合运算都返回新对象。
 *    (3) 交集结果是无序的直觉：结果保持的是第一个集合的顺序，不是排序后的顺序。
 *    (4) 对象元素的集合运算仍按引用比较，{"id":1} 与 {"id":1} 不会相交。
 *    (5) 混淆"差集"与"对称差集"：a - b 与 a △ b 完全不同。
 *    (6) 在不支持原生方法的旧环境里调用这些方法会 TypeError，需要特性检测或降级。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 23_collections/04_set_operations.js
 *
 * 【预期输出】
 *   分 7 个小节，演示并集/交集/差集/对称差集/子集判断的手写实现、
 *   原生方法对照（带特性检测），以及权限校验等实战场景。输出固定。
 * ============================================================================
 */

// 先定义一套"手写版"工具函数，任何环境都能用。
/**
 * 并集：A ∪ B。
 * @param {Set} a 集合 A
 * @param {Set} b 集合 B
 * @returns {Set} 新集合
 */
function union(a, b) {
  // 展开两个集合再构造新 Set，重复元素自动合并。
  return new Set([...a, ...b]);
}

/**
 * 交集：A ∩ B。
 * @param {Set} a 集合 A
 * @param {Set} b 集合 B
 * @returns {Set} 新集合
 */
function intersection(a, b) {
  // 遍历 A，保留那些 B 里也有的元素。b.has 是 O(1)。
  return new Set([...a].filter((v) => b.has(v)));
}

/**
 * 差集：A \ B（在 A 中但不在 B 中）。
 * @param {Set} a 集合 A
 * @param {Set} b 集合 B
 * @returns {Set} 新集合
 */
function difference(a, b) {
  return new Set([...a].filter((v) => !b.has(v)));
}

/**
 * 对称差集：A △ B（只在其中一个里出现的元素）。
 * @param {Set} a 集合 A
 * @param {Set} b 集合 B
 * @returns {Set} 新集合
 */
function symmetricDifference(a, b) {
  // A 的独有 + B 的独有。两部分的交集必为空，所以直接拼接即可。
  return new Set([...difference(a, b), ...difference(b, a)]);
}

/** 把 Set 转成便于阅读的排序后字符串（仅用于展示，不改变集合语义）。 */
const show = (s) => `{${[...s].sort().join(', ')}}`;

const A = new Set([1, 2, 3, 4]);
const B = new Set([3, 4, 5, 6]);

console.log('--- 1. 两个基础集合 ---');
console.log('A =', show(A));
console.log('B =', show(B));
console.log('注意：下面展示时对结果做了排序只为便于阅读，Set 本身的顺序是插入顺序。');

console.log('\n--- 2. 并集 A ∪ B ---');
console.log('手写 union(A, B)        =', show(union(A, B)));
console.log('简写 new Set([...A, ...B]) =', show(new Set([...A, ...B])));
console.log('元素个数 =', union(A, B).size, '（4 + 4 - 2 个重复 = 6）');
// 并集不会修改原集合。
console.log('A 是否被修改：', A.size === 4, '（size 仍是 4，集合运算返回新对象）');

console.log('\n--- 3. 交集 A ∩ B ---');
console.log('手写 intersection(A, B) =', show(intersection(A, B)));
console.log('结果保持第一个集合 A 的顺序吗：', JSON.stringify([...intersection(new Set([4, 3, 2, 1]), B)]) === JSON.stringify([4, 3]));
console.log('空交集示例：', show(intersection(new Set([1, 2]), new Set([3, 4]))), '（size =', intersection(new Set([1, 2]), new Set([3, 4])).size, '）');

console.log('\n--- 4. 差集 A \\ B 与 B \\ A（注意方向） ---');
console.log('A \\ B =', show(difference(A, B)), '（A 里有、B 里没有的）');
console.log('B \\ A =', show(difference(B, A)), '（B 里有、A 里没有的）');
console.log('方向不同结果就不同 —— 差集不满足交换律。');

console.log('\n--- 5. 对称差集 A △ B ---');
console.log('手写 symmetricDifference(A, B) =', show(symmetricDifference(A, B)));
// 恒等式验证：对称差 = 并集 - 交集。
console.log('验证恒等式 A △ B === (A ∪ B) \\ (A ∩ B) :');
console.log('  ', show(symmetricDifference(A, B)), '===', show(difference(union(A, B), intersection(A, B))));
console.log('  是否相等：', show(symmetricDifference(A, B)) === show(difference(union(A, B), intersection(A, B))));
// 两个常见错法对照。
// ❌ 错法一：只算 A 的独有部分，漏掉了 B 独有的部分。
const wrong1 = [...A].filter((v) => !B.has(v));
console.log('❌ 只算 A \\ B 当作对称差：', JSON.stringify(wrong1), '（漏掉了', JSON.stringify([...B].filter((v) => !A.has(v))), '）');
// ❌ 错法二：把"并集"当成"对称差"。
const wrong2 = [...new Set([...A, ...B])];
console.log('❌ 把并集当对称差        ：', JSON.stringify(wrong2), '（把公共元素 3、4 也算进去了）');
// ✅ 正确：两边的独有部分都要。
const right = [...difference(A, B), ...difference(B, A)];
console.log('✅ A \\ B 拼接 B \\ A       ：', JSON.stringify(right));

console.log('\n--- 6. 子集 / 超集 / 相离 ---');

/**
 * 判断 a 是否为 b 的子集（a 的所有元素都在 b 中）。
 * @param {Set} a 候选子集
 * @param {Set} b 候选超集
 * @returns {boolean}
 */
function isSubsetOf(a, b) {
  if (a.size > b.size) return false; // 快速失败：比对方大就不可能是子集
  for (const v of a) if (!b.has(v)) return false;
  return true;
}
/**
 * 判断两个集合是否相离（没有任何公共元素）。
 * @param {Set} a 集合 A
 * @param {Set} b 集合 B
 * @returns {boolean}
 */
function isDisjointFrom(a, b) {
  // 遍历较小的那个，减少比较次数。
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const v of small) if (large.has(v)) return false;
  return true;
}
const C = new Set([3, 4]);
console.log('C =', show(C));
console.log('isSubsetOf(C, A) =', isSubsetOf(C, A), '（C ⊆ A）');
console.log('isSubsetOf(A, C) =', isSubsetOf(A, C), '（A ⊄ C）');
console.log('isSubsetOf(空集, A) =', isSubsetOf(new Set(), A), '（空集是任何集合的子集）');
console.log('isDisjointFrom(A, B) =', isDisjointFrom(A, B), '（有公共元素 3、4）');
console.log('isDisjointFrom(new Set([1,2]), new Set([3,4])) =', isDisjointFrom(new Set([1, 2]), new Set([3, 4])));

console.log('\n--- 7. ES2025 原生方法（含特性检测） ---');

// 原生集合方法在 Node 22+ / 现代浏览器可用，旧环境需要降级到上面的手写版。
const hasNativeSetOps = typeof Set.prototype.union === 'function';
console.log('当前环境是否支持 Set.prototype.union：', hasNativeSetOps);

if (hasNativeSetOps) {
  console.log('  A.union(B)                =', show(A.union(B)));
  console.log('  A.intersection(B)         =', show(A.intersection(B)));
  console.log('  A.difference(B)           =', show(A.difference(B)));
  console.log('  A.symmetricDifference(B)  =', show(A.symmetricDifference(B)));
  console.log('  C.isSubsetOf(A)           =', C.isSubsetOf(A));
  console.log('  A.isSupersetOf(C)         =', A.isSupersetOf(C));
  console.log('  A.isDisjointFrom(B)       =', A.isDisjointFrom(B));
  console.log('  原生结果与手写结果是否一致：');
  console.log('    union                ', show(A.union(B)) === show(union(A, B)));
  console.log('    intersection         ', show(A.intersection(B)) === show(intersection(A, B)));
  console.log('    difference           ', show(A.difference(B)) === show(difference(A, B)));
  console.log('    symmetricDifference  ', show(A.symmetricDifference(B)) === show(symmetricDifference(A, B)));
  console.log('  A 是否被修改：', A.size === 4, '（原生方法同样返回新 Set）');
} else {
  console.log('  当前环境没有原生集合方法，下面是等价的降级实现：');
  console.log('  union                ->', show(union(A, B)));
  console.log('  intersection         ->', show(intersection(A, B)));
  console.log('  difference           ->', show(difference(A, B)));
  console.log('  symmetricDifference  ->', show(symmetricDifference(A, B)));
  console.log('  isSubsetOf           ->', isSubsetOf(C, A));
  console.log('  isDisjointFrom       ->', isDisjointFrom(A, B));
}
console.log('  提示：写库时用 typeof Set.prototype.union === "function" 做特性检测，');
console.log('        不支持就退回手写实现，这样新旧环境都能跑。');

console.log('\n--- 8. 实战：权限校验与标签筛选 ---');

const userPermissions = new Set(['read', 'write', 'comment']);
const requiredPermissions = new Set(['read', 'write']);
console.log('用户权限   =', show(userPermissions));
console.log('接口要求   =', show(requiredPermissions));
console.log('是否拥有全部所需权限：', isSubsetOf(requiredPermissions, userPermissions), '✅');
console.log('缺少的权限：', show(difference(requiredPermissions, userPermissions)), '（空集表示不缺）');
console.log('多余的权限：', show(difference(userPermissions, requiredPermissions)));

// 标签筛选：找出同时拥有 "javascript" 和 "node" 标签的文章。
const articles = [
  { title: 'A', tags: ['javascript', 'node', 'typescript'] },
  { title: 'B', tags: ['javascript', 'css'] },
  { title: 'C', tags: ['node', 'javascript'] },
];
const mustHave = ['javascript', 'node'];
const matched = articles.filter((a) => {
  const tagSet = new Set(a.tags);
  // 要求全部命中 -> 用 isSubsetOf 的语义
  return mustHave.every((t) => tagSet.has(t));
});
console.log('\n同时带 javascript 和 node 标签的文章 =', matched.map((a) => a.title).join(', '));

// 找出两篇文章的共同标签。
const [first, third] = [new Set(articles[0].tags), new Set(articles[2].tags)];
console.log('文章 A 与 C 的共同标签 =', show(intersection(first, third)));
console.log('文章 A 与 C 的全部标签 =', show(union(first, third)));
console.log('\n本节结束。');
