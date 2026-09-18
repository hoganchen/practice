/**
 * ============================================================================
 * 知识点：ES2025 Set 集合运算原生方法 —— union / intersection / difference /
 *         symmetricDifference / isSubsetOf / isSupersetOf / isDisjointFrom
 * ============================================================================
 *
 * 【所属分类】34_modern_es_features —— 现代 ES 新特性
 * 【难度等级】进阶
 * 【前置知识】23_collections/、08_arrays/、17_iterators_and_generators/
 *
 * 【也见】23_collections/04_set_operations.js —— 同样讲了"原生方法 + 手写实现"两套。
 *        那篇是「集合类型主线」的主场，侧重运算语义与业务实战；本文件是「ES2025 新特性主线」
 *        的主场，侧重版本支持、set-like 协议与从 lodash 迁移的差异。两文互补。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES2025 给 Set 补齐了 7 个数学集合运算方法：
 *      产出新集合：union（并集）、intersection（交集）、difference（差集）、
 *                  symmetricDifference（对称差集 / 异或）
 *      返回布尔：  isSubsetOf（子集）、isSupersetOf（超集）、isDisjointFrom（不相交）
 *
 * 2. 为什么需要（真实项目场景）
 *    - 权限系统：用户权限集合 vs 接口所需权限集合 → isSupersetOf 判断"有没有权限"。
 *    - 标签筛选：商品标签 & 用户的筛选条件 → intersection 求"同时满足"。
 *    - 增量同步：本地 id 集合 vs 远端 id 集合 → difference 得到"要新增"和"要删除"，
 *      symmetricDifference 一次拿到"所有不一致的 id"。
 *    - 推荐系统初筛：候选集与黑名单 → isDisjointFrom 快速排除。
 *    - 以前怎么写：每次都要手写一遍 `for (const x of a) if (b.has(x)) ...`，
 *      或者引入 lodash（_.union / _.intersection / _.difference），
 *      而 lodash 这些函数的**语义其实和"数学集合"不完全一致**（它们是数组语义，
 *      会去重但保留顺序、且不处理 NaN 之类的边界），迁移到原生方法时容易踩坑。
 *
 * 3. 核心语法要点
 *    - 全部是**非破坏性**的：不修改 this，也不修改参数，返回全新的 Set。
 *    - 参数不要求是 Set，只要是 "set-like 对象"：拥有 `size` 属性、
 *      拥有 `has(v)` 和 `keys()` 方法即可。最常见的就是 `Map.prototype.keys()`
 *      返回的迭代器 —— 它恰好符合 set-like 协议。
 *    - `isSubsetOf` / `isSupersetOf` / `isDisjointFrom` 返回布尔值；
 *      其余四个返回新 Set。
 *    - 判定用的是 Set 自身的 SameValueZero 语义：`NaN` 被视为等于自身。
 *    - 与迭代器助手一样，这些方法都是 ES2025 的内容，需较新的运行时。
 *
 * 4. 常见陷阱
 *    - **参数必须是 set-like**，不是"任意可迭代"。传一个数组会抛 TypeError！
 *      需要先把数组 `new Set(arr)` 包一层。这是从 lodash 迁移时最常见的报错。
 *    - `isSubsetOf` 的调用方向容易搞反：`a.isSubsetOf(b)` 问的是"a 是不是 b 的子集"，
 *      也就是"a 的元素是否都在 b 里"。记法：谁调用，谁被检查。
 *    - 空集是**任何集合**的子集（isSubsetOf 返回 true）、
 *      且与任何集合**都不相交**（isDisjointFrom 返回 true）。这两个"空真"结论
 *      经常和直觉相反，写业务判断时要特别小心。
 *    - `difference` 是**有方向**的：`a.difference(b)` ≠ `b.difference(a)`。
 *    - 集合运算只看"值"，不看顺序 —— 结果 Set 的迭代顺序是"new Set(可迭代对象)"
 *      的自然插入顺序，不要依赖它做业务排序。
 *    - 和 lodash 的 `_.union` 等不同，原生方法**不会**对结果做排序，也不会接受多个参数。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 34_modern_es_features/06_es2025_set_methods.js
 *
 * 【预期输出】
 *   依次打印 9 个小节。每个方法都同时给出"原生写法"和"手写实现"，
 *   并在输出里断言两者结果完全一致。每个特性都标注"本机支持：是/否"。
 * ============================================================================
 */

console.log('='.repeat(70));
console.log('ES2025 Set 集合运算方法演示');
console.log('当前 Node 版本：', process.version);
console.log('='.repeat(70));

// ---------------------------------------------------------------------------
console.log('\n--- 1. 支持情况总览 ---');
// ---------------------------------------------------------------------------

const setMethodNames = [
  'union',
  'intersection',
  'difference',
  'symmetricDifference',
  'isSubsetOf',
  'isSupersetOf',
  'isDisjointFrom',
];
const setSupport = {};
for (const name of setMethodNames) {
  setSupport[name] = typeof Set.prototype[name] === 'function';
}
console.log('本机支持：' + (Object.values(setSupport).every(Boolean) ? '是' : '否'));
console.log('  详情：', JSON.stringify(setSupport));

// 手写等价实现（既用于降级，也用于和原生结果做对照验证）
// 注意：手写版本按"参数是 Set"来写，这是最常见的使用方式。
const manualSet = {
  union(a, b) {
    const out = new Set(a);
    for (const x of b) out.add(x);
    return out;
  },
  intersection(a, b) {
    const out = new Set();
    for (const x of a) if (b.has(x)) out.add(x);
    return out;
  },
  difference(a, b) {
    const out = new Set();
    for (const x of a) if (!b.has(x)) out.add(x);
    return out;
  },
  symmetricDifference(a, b) {
    const out = new Set();
    for (const x of a) if (!b.has(x)) out.add(x);
    for (const x of b) if (!a.has(x)) out.add(x);
    return out;
  },
  isSubsetOf(a, b) {
    for (const x of a) if (!b.has(x)) return false;
    return true;
  },
  isSupersetOf(a, b) {
    for (const x of b) if (!a.has(x)) return false;
    return true;
  },
  isDisjointFrom(a, b) {
    for (const x of a) if (b.has(x)) return false;
    return true;
  },
};

// 统一的"原生 vs 手写"对照工具：打印两边结果并断言一致
const sameSet = (x, y) => x.size === y.size && [...x].every((v) => y.has(v));
function compare(label, nativeValue, manualValue, isBoolean = false) {
  if (isBoolean) {
    const match = nativeValue === manualValue;
    console.log(`  ${label}`);
    console.log(`    原生：${nativeValue}  |  手写：${manualValue}  |  一致：${match ? '✓' : '✗'}`);
  } else {
    const match = sameSet(nativeValue, manualValue);
    console.log(`  ${label}`);
    console.log(`    原生：{${[...nativeValue].join(', ')}}`);
    console.log(`    手写：{${[...manualValue].join(', ')}}`);
    console.log(`    一致：${match ? '✓' : '✗'}`);
  }
}

// 后面每一节都用这两组数据
const A = new Set([1, 2, 3, 4, 5]);
const B = new Set([4, 5, 6, 7]);
const show = (s) => `{${[...s].join(', ')}}`;
console.log('\n本演示固定使用两个集合：');
console.log('  A =', show(A));
console.log('  B =', show(B));

if (!setSupport.union) {
  console.log('\n当前 Node 版本不支持，以下全部使用手写等价实现（结果语义完全一致）');
  for (const name of setMethodNames) {
    Set.prototype[name] = function (other) {
      return manualSet[name](this, other);
    };
  }
  console.log('  已把等价实现挂到 Set.prototype 上，后续代码可以照常调用');
}

// ---------------------------------------------------------------------------
console.log('\n--- 2. union（并集）：A ∪ B ---');
// ---------------------------------------------------------------------------

// 语义：属于 A 或属于 B 的所有元素。
// 以前怎么写：手动遍历两个集合塞进新 Set（见上面的 manualSet.union）。
// 现在怎么写：
const unionNative = A.union(B);
compare('A.union(B)：', unionNative, manualSet.union(A, B));
console.log('  说明：结果是一个**新 Set**，A 和 B 都没变：A =', show(A), '| B =', show(B));
console.log('  业务场景：合并两个用户组的权限 →', show(new Set(['read', 'write']).union(new Set(['write', 'delete']))));

// ---------------------------------------------------------------------------
console.log('\n--- 3. intersection（交集）：A ∩ B ---');
// ---------------------------------------------------------------------------

const interNative = A.intersection(B);
compare('A.intersection(B)：', interNative, manualSet.intersection(A, B));

// 交集是可交换的
console.log('  交换律验证：B.intersection(A) =', show(B.intersection(A)), '（与上面相同）');
console.log('  业务场景：同时满足两个筛选条件的商品 →',
  show(new Set(['红色', '大号', '纯棉']).intersection(new Set(['大号', '纯棉', '包邮']))));

// ---------------------------------------------------------------------------
console.log('\n--- 4. difference（差集）：A \\ B ---');
// ---------------------------------------------------------------------------

const diffNative = A.difference(B);
compare('A.difference(B)：', diffNative, manualSet.difference(A, B));

// 差集**有方向**，这是最容易出错的地方
console.log('  方向性验证：B.difference(A) =', show(B.difference(A)), '← 和上面完全不同！');
console.log('  A.difference(B) 读作："在 A 里但不在 B 里"（属于 A 减去属于 B 的部分）');
console.log('  业务场景：本地有、远端没有的 id → 需要新增');
console.log('    本地 =', show(new Set([1, 2, 3, 4])), '远端 =', show(new Set([3, 4, 5])));
console.log('    需要新增 =', show(new Set([1, 2, 3, 4]).difference(new Set([3, 4, 5]))));
console.log('    需要删除 =', show(new Set([3, 4, 5]).difference(new Set([1, 2, 3, 4]))));

// ---------------------------------------------------------------------------
console.log('\n--- 5. symmetricDifference（对称差集）：A △ B ---');
// ---------------------------------------------------------------------------

// 语义：只在其中一个集合里出现的元素（也就是"并集减去交集"）。
// 它等价于 (A \ B) ∪ (B \ A)。
const symNative = A.symmetricDifference(B);
compare('A.symmetricDifference(B)：', symNative, manualSet.symmetricDifference(A, B));

// 用其他运算拼出对称差，验证等价性
const composed = A.difference(B).union(B.difference(A));
console.log('  用 (A\\B) ∪ (B\\A) 拼出来：', show(composed), '| 与原生一致：', sameSet(composed, symNative) ? '✓' : '✗');
const composed2 = A.union(B).difference(A.intersection(B));
console.log('  用 (A∪B) \\(A∩B) 拼出来：', show(composed2), '| 与原生一致：', sameSet(composed2, symNative) ? '✓' : '✗');

// 对称差是**可交换**的
console.log('  交换律验证：B.symmetricDifference(A) =', show(B.symmetricDifference(A)), '（与上面相同）');
console.log('  业务场景：找出两边"不一致"的所有 id → 需要双向同步');
console.log('    结果 =', show(symNative));

// ---------------------------------------------------------------------------
console.log('\n--- 6. isSubsetOf（子集）：A ⊆ B？ ---');
// ---------------------------------------------------------------------------

// 语义：A 的**每一个**元素都在 B 里。
// 记法：谁调用，谁被检查 —— a.isSubsetOf(b) 问的是"a 是不是 b 的子集"。
const subNative = A.isSubsetOf(B);
compare('A.isSubsetOf(B) [A 是不是 B 的子集]：', subNative, manualSet.isSubsetOf(A, B), true);
compare('B.isSubsetOf(A)：', B.isSubsetOf(A), manualSet.isSubsetOf(B, A), true);

// 自己永远是自己（和非真子集）的子集
console.log('  自反性：A.isSubsetOf(A) =', A.isSubsetOf(A));
// 真子集
console.log('  {1,2}.isSubsetOf({1,2,3}) =', new Set([1, 2]).isSubsetOf(new Set([1, 2, 3])));
// 空集是任何集合的子集（"空真"）
console.log('  空集是任何集合的子集：new Set().isSubsetOf(A) =', new Set().isSubsetOf(A), '← 空真，别被直觉骗了');
console.log('  业务场景：用户权限是否覆盖接口要求 →',
  new Set(['read', 'write']).isSubsetOf(new Set(['read', 'write', 'delete'])), '（是子集=权限不够）');

// ---------------------------------------------------------------------------
console.log('\n--- 7. isSupersetOf（超集）：A ⊇ B？ ---');
// ---------------------------------------------------------------------------

// 语义：B 的**每一个**元素都在 A 里。正好是 isSubsetOf 的反方向。
const superNative = A.isSupersetOf(B);
compare('A.isSupersetOf(B) [A 是不是包含 B]：', superNative, manualSet.isSupersetOf(A, B), true);
compare('B.isSupersetOf(A)：', B.isSupersetOf(A), manualSet.isSupersetOf(B, A), true);

// 恒等式验证：a.isSupersetOf(b) === b.isSubsetOf(a)
console.log('  恒等式验证：A.isSupersetOf(B) === B.isSubsetOf(A) →', A.isSupersetOf(B) === B.isSubsetOf(A) ? '✓' : '✗');
console.log('  A.isSubsetOf(B) === B.isSupersetOf(A) →', A.isSubsetOf(B) === B.isSupersetOf(A) ? '✓' : '✗');
console.log('  业务场景：当前用户权限是否是接口所需权限的超集 →',
  new Set(['read', 'write', 'delete']).isSupersetOf(new Set(['read', 'write'])), '（是超集=有权限）');

// ---------------------------------------------------------------------------
console.log('\n--- 8. isDisjointFrom（不相交）：A ∩ B = ∅？ ---');
// ---------------------------------------------------------------------------

const disjNative = A.isDisjointFrom(B);
compare('A.isDisjointFrom(B) [A 和 B 有没有公共元素]：', disjNative, manualSet.isDisjointFrom(A, B), true);
console.log('  A 和 B 的公共元素：', show(A.intersection(B)), '← 非空，所以 isDisjointFrom 是 false');

// 不相交的两个集合
const C = new Set([100, 200]);
const D = new Set(['a', 'b']);
compare('C.isDisjointFrom(D) [{100,200} 与 {a,b}]：', C.isDisjointFrom(D), manualSet.isDisjointFrom(C, D), true);
// 恒等式：isDisjointFrom 等价于"交集为空"
console.log('  恒等式验证：A.isDisjointFrom(B) === (A.intersection(B).size === 0) →',
  A.isDisjointFrom(B) === (A.intersection(B).size === 0) ? '✓' : '✗');
// 空集与任何集合都不相交
console.log('  空集与任何集合都不相交：new Set().isDisjointFrom(A) =', new Set().isDisjointFrom(A), '← 又一个"空真"');
console.log('  业务场景：候选推荐是否与黑名单冲突 →',
  new Set(['商品1', '商品2']).isDisjointFrom(new Set(['商品2', '商品3'])), '（false 表示有冲突）');

// ---------------------------------------------------------------------------
console.log('\n--- 9. 进阶：参数是 "set-like 对象"（不止 Set）---');
// ---------------------------------------------------------------------------

// 规范要求参数是 "set-like"：有 size 属性、有 has(v) 方法、有 keys() 方法。
// 实践中天然满足这个协议的有两个内置对象：**Set 本身** 和 **Map**！
// （Map 的 has/size/keys 都是针对"键"的，正好符合集合语义。）
// 但注意：Map.keys() 返回的**迭代器**并不是 set-like，普通**数组也不是**。

console.log('9.1 Map 本身就是 set-like（它的 size / has / keys 都是针对键的）');
const permMap = new Map([
  ['read', '读权限'],
  ['write', '写权限'],
  ['share', '分享权限'],
]);
console.log('    permMap 是 Map，size =', permMap.size, '| has("read") =', permMap.has('read'));
const perms = new Set(['read', 'delete']);
console.log('    Set 与 Map 的并集 perms.union(permMap) =', show(perms.union(permMap)));
console.log('    Set 与 Map 的交集 perms.intersection(permMap) =', show(perms.intersection(permMap)));
console.log('    perms.isSubsetOf(permMap) =', perms.isSubsetOf(permMap));
console.log('    perms.isDisjointFrom(permMap) =', perms.isDisjointFrom(permMap));

console.log('\n9.1b 陷阱：迭代器不是 set-like（Map.keys() / Set.values() 都不行）');
const mapKeysIter = permMap.keys();
console.log('    typeof mapKeysIter.has =', typeof mapKeysIter.has, '| mapKeysIter.size =', mapKeysIter.size);
try {
  perms.union(mapKeysIter);
} catch (err) {
  console.log('    perms.union(permMap.keys()) →', err.constructor.name + ':', err.message);
}
console.log('    正确做法：把迭代器包成 Set →', show(perms.union(new Set(mapKeysIter))));

console.log('\n9.2 传数组会抛 TypeError（从 lodash 迁移时最常踩的坑）');
try {
  A.union([6, 7]); // 数组没有 has() 方法，不是 set-like
} catch (err) {
  console.log('    A.union([6, 7]) →', err.constructor.name + ':', err.message);
}
try {
  A.intersection([6, 7]);
} catch (err) {
  console.log('    A.intersection([6, 7]) →', err.constructor.name + ':', err.message);
}
console.log('    正确做法：先包一层 new Set([6, 7]) →', show(A.union(new Set([6, 7]))));

console.log('\n9.3 自定义 set-like 对象也能用（只要求 size / has / keys）');
const customSetLike = {
  size: 2,
  has(v) {
    return v === 100 || v === 200;
  },
  keys() {
    return [100, 200][Symbol.iterator]();
  },
};
console.log('    自定义 set-like 与 {1,2,3} 的交集 =', show(new Set([1, 2, 3]).intersection(customSetLike)));
console.log('    自定义 set-like 与 {100,300} 的并集 =', show(new Set([100, 300]).union(customSetLike)));

console.log('\n9.4 边界值：NaN 与引用类型');
// Set 用 SameValueZero 判定相等，所以 NaN 在 Set 里能被正常匹配
const nanSet = new Set([NaN, 1, 2]);
const otherSet = new Set([NaN, 3]);
console.log('    Set 里能存 NaN：', show(nanSet), '| NaN 与 NaN 视为相同：', nanSet.has(NaN));
console.log('    {NaN,1,2} ∩ {NaN,3} =', show(nanSet.intersection(otherSet)), '← NaN 被正确匹配');
// 但对象是按引用比较的，内容相同也是两个不同元素
const obj1 = { id: 1 };
const obj2 = { id: 1 };
const objSet1 = new Set([obj1]);
const objSet2 = new Set([obj2]);
console.log('    内容相同的两个对象求交集 =', show(objSet1.intersection(objSet2)), '← 空集，因为引用不同');
console.log('    同一个对象引用求交集 =', objSet1.intersection(new Set([obj1])).size, '个元素');

console.log('\n' + '='.repeat(70));
console.log('ES2025 Set 集合运算方法全部小节演示完毕，进程正常退出（退出码 0）');
console.log('='.repeat(70));
