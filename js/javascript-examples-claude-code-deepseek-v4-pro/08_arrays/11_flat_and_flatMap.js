/**
 * ============================================================================
 * 知识点：flat / flatMap 扁平化 —— 深度参数与两者的关系
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】进阶
 * 【前置知识】08_arrays/10_reduce.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - arr.flat(depth)：把嵌套数组"摊平"。depth 默认是 1，表示只摊平一层；
 *      depth 可以传任意非负整数，传 Infinity 则无限摊平到底。
 *    - arr.flatMap(callback)：等价于先 map 再 flat(1)，但**只遍历一遍**，效率更高。
 *      因为摊平深度固定为 1，它无法通过参数调整。
 *
 *    关系式：arr.flatMap(fn) ≈ arr.map(fn).flat(1)（当 fn 返回数组时尤其有用）
 *
 *    注意 flatMap 的摊平规则：回调返回**数组**时，这个数组会被摊平一层；
 *    返回非数组值（数字、字符串、对象）时，就当作普通元素放进去。
 *    返回空数组 [] 等于"这一项被丢弃"，这是 flatMap 的隐藏能力 —— 过滤！
 *
 * 2. 为什么需要它
 *    真实数据天生是嵌套的：
 *      - 一个订单有多个商品 -> [[商品, 商品], [商品], ...] 要摊成商品列表；
 *      - 一棵分类树的所有叶子节点；
 *      - 每个用户有多条地址，要收集所有地址；
 *      - 一段文本按行切分后，每行再按空格切分成单词。
 *    手写递归去摊平很啰嗦，flat 一行搞定。
 *
 *    flatMap 的价值在于"一对一 -> 一对多"的映射：
 *    当你的映射函数返回的是数组时，用 map 会得到"数组的数组"（嵌套一层），
 *    这时用 flatMap 就能一步到位。它还顺带支持了"返回空数组即过滤"的能力，
 *    相当于 map + filter + flat 三合一。
 *
 * 3. 核心语法要点
 *    flat()：
 *      [1, [2, [3, [4]]]].flat()        -> [1, 2, [3, [4]]]     （默认 1 层）
 *      [1, [2, [3, [4]]]].flat(2)       -> [1, 2, 3, [4]]
 *      [1, [2, [3, [4]]]].flat(Infinity)-> [1, 2, 3, 4]        （无限层）
 *      [1, [2, [3, [4]]]].flat(0)       -> 原样返回（浅拷贝）
 *      ['a', ['b', 'c']].flat()         -> ['a', 'b', 'c']      （字符串不会被拆成字符）
 *    flatMap(fn)：
 *      [1, 2, 3].flatMap(n => [n, n * 10])   -> [1, 10, 2, 20, 3, 30]  （一对多）
 *      [1, 2, 3].flatMap(n => n * 2)         -> [2, 4, 6]              （退化为 map）
 *      [1, 2, 3, 4].flatMap(n => n % 2 ? [] : [n]) -> [2, 4]          （用空数组过滤）
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**都不修改原数组**（non-mutating），返回新数组。
 *      但注意是浅拷贝：摊平后数组里装的对象仍是原来那些对象的引用。
 *    - flat 只摊平**数组**，不会摊平其他"可迭代对象"（如 Set、arguments 里的嵌套内容）。
 *    - flat 会**直接删除空洞**：`[1, , 3].flat()` 得到 `[1, 3]`（长度从 3 变成 2）。
 *      注意这与 [...arr]（把空洞变成真 undefined、长度不变）完全不同。
 *    - flat 按"深度"而不是"递归"理解更容易出错：深度是从最外层往里数，
 *      不是"每个子数组再摊 N 层"。实践中最省心的是直接传 Infinity。
 *    - flatMap 的摊平深度**不可配置**（永远是 1 层）。返回嵌套更深的数组时，
 *      需要再接一个 .flat(depth)。
 *    - flatMap 回调返回字符串不会被拆成字符（只有数组会被摊平），
 *      这一点常被误解；要拆字符得自己 [...str]。
 *    - flat(Infinity) 在"自引用"（数组里包含自己的引用）的数组上会无限循环 —— 实践中
 *      极少遇到，但数据里出现循环引用时是真实风险。
 *    - 用 flatMap 时如果回调返回的不是数组而是"类数组对象"，不会被摊平。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/11_flat_and_flatMap.js
 *
 * 【预期输出】
 *   依次演示 flat 的不同深度、默认值、空洞处理，flatMap 的一对多映射、
 *   与 map+flat 的等价性、用空数组过滤的技巧，最后是树形结构摊平与词频统计实战。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. flat 基础与深度参数
// ---------------------------------------------------------------------------

console.log('--- 1. flat 基础与深度 ---');

const deep = [1, [2, [3, [4, [5]]]]];
console.log('原数组 =', JSON.stringify(deep));
console.log('深度实际层级：第 1 层 1 个元素 + 嵌套 4 层');

console.log('\nflat()         =', JSON.stringify(deep.flat()), '（默认 1 层）');
console.log('flat(1)        =', JSON.stringify(deep.flat(1)));
console.log('flat(2)        =', JSON.stringify(deep.flat(2)));
console.log('flat(3)        =', JSON.stringify(deep.flat(3)));
console.log('flat(4)        =', JSON.stringify(deep.flat(4)));
console.log('flat(999)      =', JSON.stringify(deep.flat(999)), '（超过实际深度不会报错）');
console.log('flat(Infinity) =', JSON.stringify(deep.flat(Infinity)), '（无限摊平）');
console.log('flat(0)        =', JSON.stringify(deep.flat(0)), '（一层都不摊，等于浅拷贝）');

// 原数组没变
console.log('\n原数组依然是 =', JSON.stringify(deep), '（flat 不修改原数组）');

// 负数、小数、字符串参数的处理
console.log('\nflat(-1)   =', JSON.stringify([1, [2]].flat(-1)), '（负数按 0 处理，等于不摊）');
console.log('flat(1.9)  =', JSON.stringify([1, [2, [3]]].flat(1.9)), '（小数会被向 0 取整）');
console.log('flat("2")  =', JSON.stringify([1, [2, [3, [4]]]].flat('2')), '（字符串会被转成数字）');
console.log('flat(null) =', JSON.stringify([1, [2]].flat(null)), '（null -> 0）');
console.log('flat() 的默认值是 1，不是 Infinity，这点很容易记错。');

// ---------------------------------------------------------------------------
// 2. flat 的细节：什么会被摊平
// ---------------------------------------------------------------------------

console.log('\n--- 2. flat 的细节 ---');

// 只有"数组"会被摊平
console.log("[1, ['a', 'b']].flat() =", JSON.stringify([1, ['a', 'b']].flat()));
console.log("[1, 'ab'].flat()  =", JSON.stringify([1, 'ab'].flat()), '（字符串不会被拆成字符）');
console.log("[1, new Set([2, 3])].flat() =", JSON.stringify([1, new Set([2, 3])].flat()), '（Set 不是数组，不动）');
console.log("[1, {0: 'x', length: 1}].flat() =", JSON.stringify([1, { 0: 'x', length: 1 }].flat()), '（类数组对象也不动）');

// 空洞会被**直接删除**（注意：是删除，不是变成 undefined，所以长度会变短）
const withHoles = [1, , 3, [, 5]]; // eslint-disable-line no-sparse-arrays
console.log('\n含空洞的数组 =', withHoles, '长度 =', withHoles.length);
const flattenedHoles = withHoles.flat();
console.log('flat 之后 =', flattenedHoles, '长度 =', flattenedHoles.length, '（空洞被删掉了，长度变短）');
console.log('对比 [...withHoles].flat() =', [...withHoles].flat(), '（展开运算符先把空洞变成真 undefined，就删不掉了）');
console.log('再对比 [...withHoles] =', [...withHoles], '（这里能清楚看到 undefined 被保留下来）');
console.log('所以：想保留"被摊平的位置"就用 [...arr] 先实心化，想彻底丢弃就用 flat。');

// 对象数组不会被"展开"
const objNested = [{ a: 1 }, [{ b: 2 }]];
console.log('\n对象数组 flat =', JSON.stringify(objNested.flat()), '（对象本身不展开，只摊掉外层数组）');

// ---------------------------------------------------------------------------
// 3. flatMap：先映射再摊平一层
// ---------------------------------------------------------------------------

console.log('\n--- 3. flatMap 基础 ---');

const nums = [1, 2, 3];
console.log('数组 =', JSON.stringify(nums));

// 一对多：把每个数字变成"它自己和它的 10 倍"
const pairs = nums.flatMap((n) => [n, n * 10]);
console.log('flatMap(n => [n, n * 10]) =', JSON.stringify(pairs));

// 用 map 做同样的事，会得到嵌套数组（多一层）
const nestedPairs = nums.map((n) => [n, n * 10]);
console.log('map(n => [n, n * 10])     =', JSON.stringify(nestedPairs), '（嵌套了一层）');
console.log('map(...).flat()           =', JSON.stringify(nestedPairs.flat()), '（结果与 flatMap 相同）');

// 等价性验证
console.log('两者结果相同 =', JSON.stringify(pairs) === JSON.stringify(nestedPairs.flat()));

// 回调返回非数组时，flatMap 退化成 map
console.log('\nflatMap(n => n * 2) =', JSON.stringify(nums.flatMap((n) => n * 2)), '（与 map 相同）');
console.log('flatMap(n => String(n)) =', JSON.stringify(nums.flatMap((n) => String(n))), '（字符串不被拆开）');

// 直接返回数组字面量时，可以用展开运算符构造
const duplicate = nums.flatMap((n) => [n, n]);
console.log('flatMap(n => [n, n]) =', JSON.stringify(duplicate), '（每个元素复制一份）');

// ---------------------------------------------------------------------------
// 4. flatMap 的隐藏能力：用空数组实现"过滤"
// ---------------------------------------------------------------------------

console.log('\n--- 4. flatMap 当 filter 用 ---');

const values = [1, 2, 3, 4, 5, 6];

// 返回 [] 就等于"丢掉这一项"，返回 [x] 就等于"保留"
const onlyEven = values.flatMap((n) => (n % 2 === 0 ? [n] : []));
console.log('只保留偶数 =', JSON.stringify(onlyEven));

// 等价于 map + filter 的组合，但只遍历一遍
console.log('filter 版本 =', JSON.stringify(values.filter((n) => n % 2 === 0)));

// 更强的地方：既能过滤又能变换，一步完成
const evenDoubled = values.flatMap((n) => (n % 2 === 0 ? [n * 2] : []));
console.log('偶数并乘 2 =', JSON.stringify(evenDoubled));

// 实战：把"可能为空的字段"展开
const records = [
  { name: '张三', tags: ['前端', 'Node'] },
  { name: '李四', tags: [] },
  { name: '王五', tags: ['数据库'] },
];
const allTags = records.flatMap((r) => r.tags);
console.log('\n所有标签（空数组自然消失）=', JSON.stringify(allTags));
console.log('去重后 =', JSON.stringify([...new Set(allTags)]));

// 实战：把"可选的一对多"展开
const cartItems = [
  { sku: 'A', qty: 2 },
  { sku: 'B', qty: 0 }, // qty 为 0 -> 不产生任何明细
  { sku: 'C', qty: 3 },
];
const lines = cartItems.flatMap((item) =>
  item.qty > 0 ? [{ sku: item.sku, qty: item.qty, subtotal: null }] : [],
);
console.log('\n有效购物明细 =', JSON.stringify(lines));

// ---------------------------------------------------------------------------
// 5. flatMap 的摊平深度只有 1 层
// ---------------------------------------------------------------------------

console.log('\n--- 5. flatMap 只摊平 1 层 ---');

// 回调返回嵌套两层的数组时，flatMap 只摊掉最外面那层
const twoLevel = [1, 2].flatMap((n) => [[n, n], [n]]);
console.log('flatMap(n => [[n, n], [n]]) =', JSON.stringify(twoLevel));
console.log('要完全摊平需要再接 flat() =', JSON.stringify(twoLevel.flat()));

// 拆句子成单词：split 返回数组，正好用 flatMap
const sentences = ['hello world', 'foo bar baz'];
console.log('\n句子 =', JSON.stringify(sentences));
console.log('flatMap(s => s.split(" ")) =', JSON.stringify(sentences.flatMap((s) => s.split(' '))));
console.log('对比 map(s => s.split(" ")) =', JSON.stringify(sentences.map((s) => s.split(' '))));

// ---------------------------------------------------------------------------
// 6. 实战：摊平树形结构
// ---------------------------------------------------------------------------

console.log('\n--- 6. 实战：摊平分类树 ---');

const categoryTree = [
  {
    name: '电子产品',
    children: [
      { name: '手机', children: [{ name: '智能手机' }, { name: '老人机' }] },
      { name: '电脑', children: [{ name: '笔记本' }, { name: '台式机' }] },
    ],
  },
  {
    name: '家居',
    children: [{ name: '台灯' }],
  },
];

// flat 对付"二维数组"很轻松，但树形结构是"递归嵌套对象"，得先取出 children
// 方法一：手动 flat 两层（适合层数已知的情况）
const level1 = categoryTree.flatMap((n) => n.children ?? []);
console.log('第 2 层节点 =', JSON.stringify(level1.map((n) => n.name)));

const level2 = level1.flatMap((n) => n.children ?? []);
console.log('第 3 层节点 =', JSON.stringify(level2.map((n) => n.name)));

// 方法二：写一个通用的递归摊平（真正处理任意深度的树）
function flattenTree(nodes) {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children ?? [])]);
}
console.log('\n递归摊平（含所有层级）=', JSON.stringify(flattenTree(categoryTree).map((n) => n.name)));

// 只要叶子节点
function leaves(nodes) {
  return nodes.flatMap((node) => (node.children?.length ? leaves(node.children) : [node.name]));
}
console.log('只要叶子节点 =', JSON.stringify(leaves(categoryTree)));

// 对比：reduce 写法（可读性略逊）
function flattenByReduce(nodes) {
  return nodes.reduce((acc, node) => acc.concat([node], flattenByReduce(node.children ?? [])), []);
}
console.log('reduce 版本 =', JSON.stringify(flattenByReduce(categoryTree).map((n) => n.name)));

// ---------------------------------------------------------------------------
// 7. 实战：词频统计（split + flatMap + reduce 组合）
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战：词频统计 ---');

const documents = [
  'the quick brown fox',
  'jumps over the lazy dog',
  'the fox is quick',
];

// 三步：flatMap 拆词 -> filter 清洗 -> reduce 计数
const wordFreq = documents
  .flatMap((doc) => doc.split(' ')) // 拆成所有单词
  .filter(Boolean) // 去空
  .reduce((acc, word) => {
    acc[word] = (acc[word] ?? 0) + 1;
    return acc;
  }, {});

console.log('文档数 =', documents.length);
console.log('词频 =', JSON.stringify(wordFreq));

// 按频次降序输出 Top 3
const top3 = Object.entries(wordFreq)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3);
console.log('Top 3 =', JSON.stringify(top3));

// ---------------------------------------------------------------------------
// 8. 实战：收集所有用户的地址
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战：收集嵌套数据 ---');

const userList = [
  { name: '张三', addresses: [{ city: '北京' }, { city: '上海' }] },
  { name: '李四', addresses: [{ city: '广州' }] },
  { name: '王五', addresses: [] },
];

// 用 flatMap 一步收集所有地址
const allCities = userList.flatMap((u) => u.addresses.map((a) => a.city));
console.log('所有城市 =', JSON.stringify(allCities));

// 带上用户名（返回对象数组时用 map 构造）
const cityOwners = userList.flatMap((u) => u.addresses.map((a) => ({ user: u.name, city: a.city })));
console.log('城市归属 =', JSON.stringify(cityOwners));

// 用 reduce 做同样的事（对比可读性）
const cityOwners2 = userList.reduce((acc, u) => {
  u.addresses.forEach((a) => acc.push({ user: u.name, city: a.city }));
  return acc;
}, []);
console.log('reduce 版本 =', JSON.stringify(cityOwners2));

// 每个用户的城市数统计
const citiesPerUser = userList.map((u) => ({
  name: u.name,
  count: u.addresses.length,
  cities: u.addresses.map((a) => a.city).join('/') || '（无）',
}));
console.log('\n每用户城市 =', JSON.stringify(citiesPerUser));

// ---------------------------------------------------------------------------
// 9. 与其他方法的对比速查
// ---------------------------------------------------------------------------

console.log('\n--- 9. 速查 ---');

const sample = [[1, 2], [3, 4]];
console.log('sample =', JSON.stringify(sample));
console.log('map(arr => arr)          =', JSON.stringify(sample.map((a) => a)), '（嵌套不变）');
console.log('flat()                   =', JSON.stringify(sample.flat()), '（摊平 1 层）');
console.log('flatMap(arr => arr)      =', JSON.stringify(sample.flatMap((a) => a)), '（等价于 flat）');
console.log('reduce((a, b) => a.concat(b), []) =', JSON.stringify(sample.reduce((a, b) => a.concat(b), [])));

console.log('\n选择建议：');
console.log('  只是"摊平"，用 flat(depth)；层数未知就 flat(Infinity)');
console.log('  "映射后产生数组"，用 flatMap（比 map().flat() 少一次遍历）');
console.log('  想要"映射 + 过滤"，flatMap 返回 [] 即可（比 filter().map() 少一次遍历）');
console.log('  两者都不修改原数组（non-mutating）。');
