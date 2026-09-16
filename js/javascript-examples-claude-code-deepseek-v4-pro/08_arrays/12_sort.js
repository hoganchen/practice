/**
 * ============================================================================
 * 知识点：sort 排序 —— 默认按字符串比较的坑、比较函数、稳定性
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】进阶
 * 【前置知识】08_arrays/11_flat_and_flatMap.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    arr.sort(compareFn) 对数组元素排序，**默认（不传比较函数时）把元素转成字符串，
 *    按 UTF-16 码元顺序比较**。这是 JS 历史上一个非常著名的设计缺陷，导致
 *    [10, 9, 1].sort() 得到 [1, 10, 9] 而不是 [1, 9, 10]。
 *
 *    比较函数 compareFn(a, b) 的返回值含义：
 *      负数  -> a 排在 b 前面（a 更小）
 *      正数  -> a 排在 b 后面（a 更大）
 *      0     -> 两者相等，保持相对顺序（依赖排序的稳定性）
 *    缩写技巧：数字升序可以用 `(a, b) => a - b`，降序用 `(a, b) => b - a`。
 *
 * 2. 为什么需要它
 *    展示数据时几乎总需要排序：按时间倒序、按价格升序、按销量排名。
 *    默认的字符串行为几乎永远是错的，所以**排序时几乎总要显式传比较函数**。
 *
 * 3. 核心语法要点
 *    (1) 数字排序：arr.sort((a, b) => a - b)     升序
 *                 arr.sort((a, b) => b - a)     降序
 *    (2) 字符串排序：arr.sort() 对纯字符串数组是正确的（按码元）；
 *        要按人类语言的字母序（如中文拼音、忽略大小写），用
 *        arr.sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))。
 *    (3) 对象排序：arr.sort((a, b) => a.age - b.age)
 *        多字段排序：arr.sort((a, b) => a.dept.localeCompare(b.dept) || b.score - a.score)
 *        （`||` 的技巧：第一个比较结果非 0 就短路，否则用第二个字段）
 *    (4) 稳定性：ES2019 起规范**保证 sort 是稳定的**（相同键值的元素保持原有相对顺序）。
 *        这非常有用：可以先按次要字段排一次，再按主要字段排一次，实现多级排序。
 *    (5) 空位与 undefined：它们总是被排到**最后**，且不会调用比较函数。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**会修改原数组**（mutating）！并且返回的就是原数组本身
 *      （`arr.sort() === arr` 为 true）。想保留原数组请先拷贝：
 *      `[...arr].sort(...)` 或使用 ES2023 的 `arr.toSorted(...)`（不修改原数组）。
 *    - 不传比较函数时用"字符串比较"，因此 [1, 2, 10].sort() 结果是 [1, 10, 2]；
 *      [100, 20, 3] 结果是 [100, 20, 3]（'1' < '2' < '3'）。这是最常见的排序 bug。
 *    - 比较函数必须**返回数字**，不能返回布尔值：
 *      `(a, b) => a.age > b.age` 在 true 时返回 1、false 时返回 0，
 *      永远不返回负数，所以排序结果完全错误。
 *    - 比较函数要满足"自反性/传递性"，否则行为未定义（可能排不对，甚至死循环）。
 *      例如 `(a, b) => Math.random() - 0.5` 就是典型的错误用法（虽然常被用来"洗牌"）。
 *    - 数字排序不能用 `localeCompare`：它按字符串比，'10' < '9'。
 *    - 排序前要小心"比较函数里修改元素"这类副作用，会让结果不可预测。
 *    - sort 默认把所有元素当字符串，所以对混合类型数组排序结果会很迷惑。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/12_sort.js
 *
 * 【预期输出】
 *   依次演示默认字符串排序的坑、数字/字符串/对象/多字段排序、稳定性验证、
 *   undefined 与空洞的处理，以及"不要修改原数组"的三种写法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 默认排序的坑（本文件最重要的部分）
// ---------------------------------------------------------------------------

console.log('--- 1. 默认排序的坑 ---');

const numsStr = [10, 9, 1, 100, 20];
console.log('原数组 =', JSON.stringify(numsStr));
console.log('nums.sort() 默认结果 =', JSON.stringify([...numsStr].sort()));
console.log('  期望的是 [1, 9, 10, 20, 100]，实际却是按字符串比：');
console.log('  "10" < "100" < "20" < "9" 因为逐字符比较时 "1" < "2" < "9"');

console.log('\n正确的数字排序（必须传比较函数）：');
console.log('升序 (a, b) => a - b =', JSON.stringify([...numsStr].sort((a, b) => a - b)));
console.log('降序 (a, b) => b - a =', JSON.stringify([...numsStr].sort((a, b) => b - a)));

// 更极端的例子：负数
const withNegative = [-1, -10, 5, 0];
console.log('\n含负数的数组 =', JSON.stringify(withNegative));
console.log('默认排序 =', JSON.stringify([...withNegative].sort()), '（"-1" < "-10" < "0" < "5"）');
console.log('数字排序 =', JSON.stringify([...withNegative].sort((a, b) => a - b)));

// ---------------------------------------------------------------------------
// 2. sort 修改原数组（重点）
// ---------------------------------------------------------------------------

console.log('\n--- 2. sort 会修改原数组 ---');

const original = [3, 1, 2];
const sorted = original.sort((a, b) => a - b);
console.log('原数组 =', JSON.stringify(original), '（被就地排序了！）');
console.log('返回值 =', JSON.stringify(sorted));
console.log('返回值与原数组是同一个引用吗？', sorted === original, '（true）');

// 三种"不修改原数组"的写法
const base = [3, 1, 2];
console.log('\n不修改原数组的三种写法：');
console.log('1) 展开运算符 [...base].sort() =', JSON.stringify([...base].sort((a, b) => a - b)));
console.log('2) slice() base.slice().sort() =', JSON.stringify(base.slice().sort((a, b) => a - b)));
// ES2023 新增 toSorted：直接返回排序后的新数组，不修改原数组
console.log('3) toSorted() base.toSorted()  =', JSON.stringify(base.toSorted((a, b) => a - b)));
console.log('base 从未改变 =', JSON.stringify(base));

// toSorted 的适用性检查
console.log('运行环境支持 toSorted 吗？', typeof base.toSorted === 'function', '（Node 20+ 支持）');

// ---------------------------------------------------------------------------
// 3. 字符串排序
// ---------------------------------------------------------------------------

console.log('\n--- 3. 字符串排序 ---');

const words = ['banana', 'Apple', 'cherry', 'apple', 'Banana'];
console.log('原数组 =', JSON.stringify(words));

// 默认排序：按 UTF-16 码元，所有大写字母都排在小写字母前面
console.log('默认 sort() =', JSON.stringify([...words].sort()));
console.log('  （"Apple"、"Banana" 排前面，因为大写字母的码元值更小）');

// 忽略大小写的正确做法
console.log('忽略大小写 =', JSON.stringify([...words].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))));

// localeCompare：按语言习惯比较，适合中文、带重音的字母
const zhWords = ['张三', '李四', '王五', '赵六', '阿七'];
console.log('\n中文数组 =', JSON.stringify(zhWords));
console.log('默认 sort() =', JSON.stringify([...zhWords].sort()), '（按 Unicode 码点，不是拼音）');
console.log('localeCompare(zh) =', JSON.stringify([...zhWords].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))), '（按拼音）');

// localeCompare 还支持"数字感知"排序（自然排序）
const vTags = ['v1', 'v10', 'v2', 'v20', 'v3'];
console.log('\nv 标签 =', JSON.stringify(vTags));
console.log('默认排序 =', JSON.stringify([...vTags].sort()));
console.log('自然排序 =', JSON.stringify([...vTags].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))));

// ---------------------------------------------------------------------------
// 4. 对象排序
// ---------------------------------------------------------------------------

console.log('\n--- 4. 对象排序 ---');

const users = [
  { name: '张三', age: 25, score: 88 },
  { name: '李四', age: 20, score: 95 },
  { name: '王五', age: 25, score: 72 },
  { name: '赵六', age: 30, score: 95 },
];
console.log('用户 =', JSON.stringify(users));

console.log('\n按年龄升序 =', JSON.stringify(users.toSorted((a, b) => a.age - b.age).map((u) => `${u.name}(${u.age})`)));
console.log('按年龄降序 =', JSON.stringify(users.toSorted((a, b) => b.age - a.age).map((u) => `${u.name}(${u.age})`)));
console.log('按分数降序 =', JSON.stringify(users.toSorted((a, b) => b.score - a.score).map((u) => `${u.name}(${u.score})`)));
console.log('按姓名拼音 =', JSON.stringify(users.toSorted((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN')).map((u) => u.name)));

// 多字段排序：先按分数降序，分数相同再按年龄升序
const multiSort = users.toSorted((a, b) => b.score - a.score || a.age - b.age);
console.log('\n分数降序 + 年龄升序 =', JSON.stringify(multiSort.map((u) => `${u.name}(分${u.score}/龄${u.age})`)));
console.log('  `||` 技巧：前一个表达式非 0 就直接作为结果，为 0 时才看后一个。');

// 另一种更显式的多字段写法
const multiSort2 = users.toSorted((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  return a.age - b.age;
});
console.log('显式写法结果相同 =', JSON.stringify(multiSort2.map((u) => u.name)));

// ---------------------------------------------------------------------------
// 5. 稳定性验证
// ---------------------------------------------------------------------------

console.log('\n--- 5. 排序的稳定性 ---');

// 稳定性 = 比较结果相等时，保持它们在原数组中的相对顺序。
const stable = [
  { dept: '研发', name: 'A' },
  { dept: '销售', name: 'B' },
  { dept: '研发', name: 'C' },
  { dept: '销售', name: 'D' },
  { dept: '研发', name: 'E' },
];
console.log('原顺序 =', JSON.stringify(stable.map((x) => `${x.dept}-${x.name}`)));

// 只按 dept 排序，同 dept 的应保持 A,C,E 顺序
const byDept = stable.toSorted((a, b) => a.dept.localeCompare(b.dept, 'zh-Hans-CN'));
console.log('\n按部门排序后 =', JSON.stringify(byDept.map((x) => `${x.dept}-${x.name}`)));
console.log('  研发组依然是 A, C, E —— 顺序未被打乱，说明 ES2019+ 的 sort 是稳定的。');

// 稳定性的实用价值：多级排序可以拆成两次排序（从次要字段到主要字段）
const twoPass = stable
  .toSorted((a, b) => b.name.localeCompare(a.name)) // 先按 name 降序（次要）
  .toSorted((a, b) => a.dept.localeCompare(b.dept, 'zh-Hans-CN')); // 再按 dept 升序（主要）
console.log('\n两次排序实现"部门升序 + 同部门姓名降序" =', JSON.stringify(twoPass.map((x) => `${x.dept}-${x.name}`)));

// ---------------------------------------------------------------------------
// 6. undefined 与空洞的处理
// ---------------------------------------------------------------------------

console.log('\n--- 6. undefined 与空洞 ---');

const withUndefined = [3, undefined, 1, null, 2];
console.log('含 undefined/null 的数组 =', withUndefined);
console.log('排序后 =', [...withUndefined].sort((a, b) => a - b).map(String));
console.log('  （undefined 永远排最后，且不会进入比较函数）');

// 空洞：sort 会把它当作 undefined 处理，排到最后并被"实心化"
const holey = [3, , 1]; // eslint-disable-line no-sparse-arrays
const holeySorted = [...holey];
holeySorted.sort((a, b) => a - b);
console.log('\n空洞数组 =', holey, '长度 =', holey.length);
console.log('排序后 =', holeySorted, '长度 =', holeySorted.length);
console.log('1 in 排序结果 =', 1 in holeySorted, '（空洞变成了真正的 undefined）');

// 排序时比较函数被调用了多少次？
const counted = [5, 3, 8, 1, 9, 2, 7];
let cmpCount = 0;
counted.toSorted((a, b) => {
  cmpCount++;
  return a - b;
});
console.log('\n7 个元素排序，比较函数被调用了', cmpCount, '次（大约是 n log n 量级）');

// ---------------------------------------------------------------------------
// 7. 常见错误写法
// ---------------------------------------------------------------------------

console.log('\n--- 7. 常见错误写法 ---');

const errArr = [3, 1, 2];

// 错误 1：直接 sort() 不传比较函数（数字场景）
console.log('错误 1：不传比较函数 =', JSON.stringify([...errArr].sort()), '（对个位数恰好巧合正确）');
console.log('        用两位数就露馅 =', JSON.stringify([10, 9, 1].sort()));

// 错误 2：比较函数返回布尔值
const boolCmp = [...errArr].sort((a, b) => a > b); // 只会返回 true->1 或 false->0
console.log('\n错误 2：比较函数返回布尔值 =', JSON.stringify(boolCmp));
const boolCmp2 = [10, 9, 1, 100, 20].sort((a, b) => a > b);
console.log('        在更多数据上更明显 =', JSON.stringify(boolCmp2));
console.log('        正确写法 =', JSON.stringify([10, 9, 1, 100, 20].sort((a, b) => a - b)));

// 错误 3：用 localeCompare 排数字（它只存在于字符串上，数字得先转成字符串）
const numArr = [10, 9, 1, 100];
console.log('\n错误 3：数字用 localeCompare =', JSON.stringify([...numArr].sort((a, b) => String(a).localeCompare(String(b)))));
console.log('         （localeCompare 是字符串方法，数字要先 String() 转换；结果是字符串序，不是数字序）');
try {
  [...numArr].sort((a, b) => a.localeCompare(b)); // 数字上没有这个方法
} catch (err) {
  console.log('         直接对数字调用会抛错：', err.constructor.name, '-', err.message);
}

// 错误 4：以为 sort 不影响原数组
const sideEffect = [3, 1, 2];
sideEffect.sort((a, b) => a - b);
console.log('\n错误 4：调用 sort 后原数组已经变了 =', JSON.stringify(sideEffect));

// 反面教材：用 sort 洗牌（不可靠，分布不均匀且违背比较函数契约）
const shuffleMe = [1, 2, 3, 4, 5];
const shuffled = shuffleMe.toSorted(() => Math.random() - 0.5);
console.log('\n用 sort 洗牌（不推荐）=', JSON.stringify(shuffled));
// 正确的洗牌是 Fisher-Yates
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
console.log('Fisher-Yates 洗牌 =', JSON.stringify(shuffle(shuffleMe)), '（每行都是独立随机，见 17 号文件）');

// ---------------------------------------------------------------------------
// 8. 实战：排行榜
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战：排行榜 ---');

const players = [
  { name: 'Alice', score: 1200, wins: 8 },
  { name: 'Bob', score: 1500, wins: 6 },
  { name: 'Carol', score: 1200, wins: 10 },
  { name: 'Dave', score: 900, wins: 12 },
];
console.log('玩家 =', JSON.stringify(players));

// 排名规则：分数降序 -> 胜场降序 -> 名字升序
const ranked = players
  .toSorted((a, b) => a.name.localeCompare(b.name)) // 第三优先级
  .toSorted((a, b) => b.wins - a.wins) // 第二优先级（稳定排序保证不影响已排好的第三级）
  .toSorted((a, b) => b.score - a.score) // 第一优先级
  .map((p, i) => ({ rank: i + 1, ...p }));

console.log('\n排行榜：');
ranked.forEach((p) => console.log(`  #${p.rank} ${p.name}  分数 ${p.score}  胜场 ${p.wins}`));

// 用单次比较多字段的写法（等价，但更紧凑）
const ranked2 = players.toSorted(
  (a, b) => b.score - a.score || b.wins - a.wins || a.name.localeCompare(b.name),
);
console.log('\n紧凑写法结果一致 =', JSON.stringify(ranked2.map((p) => p.name)));

// ---------------------------------------------------------------------------
// 9. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 9. 小结 ---');
console.log('1. sort 会修改原数组（mutating），且返回原数组本身；要用 toSorted / [...arr].sort() 保平安。');
console.log('2. 排数字必须传 (a, b) => a - b；排中文/忽略大小写用 localeCompare。');
console.log('3. 比较函数必须返回数字（负/零/正），不能返回布尔值。');
console.log('4. ES2019 起 sort 是稳定的，可以放心用"多次排序"实现多级排序。');
console.log('5. 想用 sort 洗牌是错的，用 Fisher-Yates。');
