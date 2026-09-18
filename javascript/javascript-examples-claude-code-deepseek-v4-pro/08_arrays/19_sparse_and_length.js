/**
 * ============================================================================
 * 知识点：稀疏数组、length 可写特性、delete 数组元素的坑与截断
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】进阶
 * 【前置知识】08_arrays/18_copy_array.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    (1) **稀疏数组（sparse array）**：不是"元素值为 undefined"，而是"这个位置
 *        根本没有元素"（空洞 / hole）。区分方法：
 *            const a = new Array(3);       // 稀疏：[ <3 empty items> ]
 *            const b = [undefined, undefined, undefined]; // 不稀疏：三个真 undefined
 *            'length' in a   // true
 *            0 in a          // false —— 下标 0 没有"存在"这个属性
 *            0 in b          // true
 *    (2) **length 可写**：数组的 length 是一个"魔法属性"，写它会直接影响数组：
 *            arr.length = 2      // 截断到 2 个元素（删掉后面的，mutating）
 *            arr.length = 5      // 扩展，新增的位置是空洞
 *            arr.length = 0      // 清空
 *            arr.length = -1     // RangeError
 *            arr.length = 2.5    // RangeError（必须是有效的数组下标长度）
 *    (3) **delete arr[i]**：删掉的是"属性"，数组长度**不变**，该位置变成空洞。
 *        它不是"splice"，不会前移后续元素，也不是"pop"，不会缩短长度。
 *
 * 2. 为什么需要它
 *    理解稀疏数组不是为了"用它"，而是为了**不被它坑**：
 *    - forEach / map / filter / some / every / reduce / indexOf / lastIndexOf
 *      都会**跳过空洞**（内部用"查属性"的方式遍历），回调不会被执行；
 *    - **例外**：find / findIndex / findLast / findLastIndex / includes 用的是"取值"方式，
 *      它们**不会跳过空洞**，会把空洞当成 undefined 处理 —— 于是
 *      `[1, , 3].indexOf(undefined)` 是 -1，而 `[1, , 3].includes(undefined)` 却是 true；
 *    - join / toString 把空洞当空字符串；
 *    - 展开运算符 [...arr] 和 Array.from(arr) 会把空洞转成真正的 undefined（数组变"密"）；
 *    - JSON.stringify 把空洞变成 null。
 *    这些差异会造成"同一个数组，不同的方法给出不同结果"的困惑。
 *
 *    length 可写则有两个真实用途：
 *    - `arr.length = 0` 是最快的清空数组方式（比 splice(0) 和重新赋值更快）；
 *    - 截断数组（保留前 N 项）不需要新数组时就地完成。
 *
 * 3. 核心语法要点
 *    (1) 创建稀疏数组的几种方式：
 *          new Array(5) / Array(5)
 *          [1, , 3]              （中间留空）
 *          const a = [1,2,3]; delete a[1];
 *          const a = [1,2,3]; a[5] = 6;      （中间 3、4 是空洞）
 *          const a = [1,2,3]; a.length = 5;  （后面 2 个是空洞）
 *    (2) 用 in 判断"有没有这个位置"：`2 in arr`
 *    (3) 用 Object.keys(arr) 只能列出"存在"的下标（空洞的下标不出现）
 *    (4) 想"填满空洞"：
 *          Array.from(arr)      -> 空洞变 undefined
 *          [...arr]             -> 同上
 *          arr.keys() 无法修复，但要遍历就得先物化
 *          Array.from(arr, (v) => v ?? 0)  -> 顺带填默认值
 *    (5) 删除元素的正确姿势：
 *          想缩短长度 -> arr.splice(i, 1)（mutating，会前移元素）
 *          想置空但保留长度 -> arr[i] = undefined（不是 delete）
 *          想清空 -> arr.length = 0
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】`length = n` 与 `delete arr[i]` 都**直接修改原数组**（mutating）。
 *      读取 length、用 in 判断、Object.keys 都只是读取，不修改。
 *    - **delete 数组元素是最经典的反模式**：它让数组变稀疏，几乎所有遍历方法都会跳过它，
 *      但 length 又没变，于是"长度对不上元素个数"。绝大多数时候你想要的其实是 splice。
 *    - `new Array(3).map(x => 0)` 得到的是**空数组**（长度 3 但全是空洞），
 *      因为 map 会跳过空洞。要用 fill 或 Array.from。
 *    - `[1, , 3].filter(Boolean)` 的 length 是 2（空洞被跳过，不参与过滤）。
 *    - `arr.length = 5` 扩展出来的位置是空洞，不是 undefined；读取返回 undefined
 *      只是"读不到"的表现，两者在 `in` 运算符下不同。
 *    - length 赋值必须是 0 ~ 2^32-1 的整数，否则抛 RangeError。
 *    - JSON 序列化会掩盖稀疏性：`JSON.stringify(new Array(3))` 是 `"[null,null,null]"`，
 *      反序列化回来却是"密"数组（三个真 null）—— 往返不等价。
 *    - 不要用 `arr[arr.length] = x` 之外的方式"手工维护 length"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/19_sparse_and_length.js
 *
 * 【预期输出】
 *   依次演示稀疏数组的识别、各种方法对空洞的不同处理、length 的读写与截断、
 *   delete 的坑及正确替代方案，最后是清空/截断数组的实战。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 稀疏 vs 密集：本质是"有没有这个属性"
// ---------------------------------------------------------------------------

console.log('--- 1. 稀疏数组长什么样 ---');

const sparse = new Array(3);
const dense = [undefined, undefined, undefined];

console.log('new Array(3)          =', sparse, '（打印出 <3 empty items>）');
console.log('[undefined, und, und] =', dense, '（三个真正的 undefined）');
console.log('两者 length 都是', sparse.length, '和', dense.length);

console.log('\n用 in 运算符区分（这是最可靠的判断）：');
console.log('0 in new Array(3)      =', 0 in sparse, '（false：位置不存在）');
console.log('0 in [undefined, ...]  =', 0 in dense, '（true：位置存在，值是 undefined）');

console.log('\n用 Object.keys 看"真实存在的下标"：');
console.log('Object.keys(new Array(3))     =', JSON.stringify(Object.keys(sparse)), '（空数组）');
console.log('Object.keys([undefined,undefined,undefined]) =', JSON.stringify(Object.keys(dense)));
console.log('（数组的"下标"本质是字符串键，稀疏性 = 这些键不存在）');

// 其他制造稀疏数组的方式
const fromLiteral = [1, , 3]; // eslint-disable-line no-sparse-arrays
console.log('\n字面量留空 [1, , 3] 的 length =', fromLiteral.length, '，1 in arr =', 1 in fromLiteral);

const fromDelete = [1, 2, 3];
delete fromDelete[1];
console.log('delete arr[1] 之后 =', fromDelete, '，length =', fromDelete.length, '，1 in arr =', 1 in fromDelete);

const fromJump = [1, 2, 3];
fromJump[5] = 6;
console.log('arr[5] = 6 之后 =', fromJump, '，length =', fromJump.length, '，3 in arr =', 3 in fromJump);

const fromLength = [1, 2, 3];
fromLength.length = 5;
console.log('arr.length = 5 之后 =', fromLength, '，3 in arr =', 3 in fromLength);

// 但读取都返回 undefined
console.log('\n读取空洞与读取 undefined 的结果看起来一样，都是 undefined：');
console.log('  sparse[0] =', sparse[0], '，dense[0] =', dense[0]);

// JSON 视角：稀疏性被掩盖
console.log('\nJSON 视角（会掩盖稀疏性）：');
console.log('JSON.stringify(new Array(3)) =', JSON.stringify(new Array(3)), '（空洞变成 null）');
console.log('反序列化回来 0 in 结果 =', 0 in JSON.parse(JSON.stringify(new Array(3))), '（变成了"密"的 null）');

// ---------------------------------------------------------------------------
// 2. 各方法对空洞的不同处理（重点）
// ---------------------------------------------------------------------------

console.log('\n--- 2. 各方法对空洞的处理 ---');

const arr = [1, , 3, , 5]; // eslint-disable-line no-sparse-arrays
console.log('稀疏数组 =', arr, '，length =', arr.length);

// (1) 会跳过空洞的方法（回调不会被调用）
console.log('\n【跳过空洞】回调不会被调用：');

const forEachSeen = [];
arr.forEach((v, i) => forEachSeen.push(`${i}:${v}`));
console.log('  forEach  访问到 ->', JSON.stringify(forEachSeen));

const mapResult = arr.map((v) => v * 10);
console.log('  map      结果   ->', mapResult, '（空洞被保留，长度仍为', mapResult.length, '）');
console.log('           2 in map 结果 =', 2 in mapResult);

const filterResult = arr.filter(() => true); // 全部保留
console.log('  filter   结果   ->', JSON.stringify(filterResult), '（length', filterResult.length, '，空洞被丢弃）');

const someResult = arr.some(() => true);
console.log('  some(() => true)  =', someResult, '（只对存在的元素调用）');

let everyCalled = 0;
const everyResult = arr.every(() => {
  everyCalled++;
  return true;
});
console.log('  every(() => true) =', everyResult, '，回调次数 =', everyCalled, '（只对 3 个存在的元素调用）');

const reduceResult = arr.reduce((acc, v) => acc + v, 0);
console.log('  reduce 求和       =', reduceResult, '（1 + 3 + 5）');

console.log('  indexOf(undefined) =', arr.indexOf(undefined), '（-1：空洞不算 undefined）');
console.log('  lastIndexOf(5)     =', arr.lastIndexOf(5));

// 例外：find / findIndex / findLast / findLastIndex / includes 用的是"取值"而非"查属性"，
//       所以它们**不会跳过空洞**，回调会把空洞当成 undefined 来处理。
console.log('\n【例外】find / findIndex / includes 不跳过空洞：');
console.log('  find(v => v === undefined)      =', arr.find((v) => v === undefined), '（undefined，也可能是真的有 undefined）');
console.log('  findIndex(v => v === undefined) =', arr.findIndex((v) => v === undefined), '（1：命中了空洞所在的下标！）');
console.log('  includes(undefined)             =', arr.includes(undefined), '（true：空洞被当成 undefined）');
console.log('  对比 indexOf(undefined)         =', arr.indexOf(undefined), '（-1：indexOf 会跳过空洞）');
console.log('  ——indexOf 与 includes 在稀疏数组上给出相反答案，正是"是否跳过空洞"造成的。');

// (2) 把空洞当"空"的方法
console.log('\n【把空洞当空值】：');
console.log("  join('-')      =", JSON.stringify(arr.join('-')));
console.log('  toString()     =', JSON.stringify(arr.toString()));
console.log('  JSON.stringify =', JSON.stringify(arr), '（空洞 -> null）');

// (3) 会把空洞"实心化"的方法
console.log('\n【把空洞变成真正的 undefined】：');
const viaSpread = [...arr];
const viaFrom = Array.from(arr);
console.log('  [...arr]        =', viaSpread, '，1 in 结果 =', 1 in viaSpread);
console.log('  Array.from(arr) =', viaFrom, '，1 in 结果 =', 1 in viaFrom);
console.log('  用它们可以"填平"空洞，让所有遍历方法都正常工作');

// (4) 只用 keys / entries 时
console.log('\n【keys / entries】：');
console.log('  [...arr.keys()]    =', JSON.stringify([...arr.keys()]), '（下标总是连续的 0..length-1）');
console.log('  [...arr.entries()] =', JSON.stringify([...arr.entries()]), '（但值可能是 undefined）');

// (5) 用 in 或者 hasOwnProperty 精确判断
console.log('\n【精确判断位置是否存在】：');
arr.forEach((_, i) => {
  console.log(`  下标 ${i}：in 判断 = ${i in arr}`);
});

// ---------------------------------------------------------------------------
// 3. 陷阱：new Array(n).map(...) 得到空数组
// ---------------------------------------------------------------------------

console.log('\n--- 3. 陷阱：new Array(n).map 不工作 ---');

const bad = new Array(3).map((_, i) => i + 1);
console.log('new Array(3).map((_, i) => i + 1) =', bad, '（依然是空洞，回调从未执行）');
console.log('Array.isArray 结果 =', Array.isArray(bad), '，length =', bad.length);

// 三种正确写法
console.log('\n三种正确写法：');
console.log('1) new Array(3).fill(0).map((_, i) => i + 1) =', JSON.stringify(new Array(3).fill(0).map((_, i) => i + 1)));
console.log('2) Array.from({length: 3}, (_, i) => i + 1)  =', JSON.stringify(Array.from({ length: 3 }, (_, i) => i + 1)));
console.log('3) [...Array(3)].map((_, i) => i + 1)        =', JSON.stringify([...Array(3)].map((_, i) => i + 1)));
console.log('   （第 3 种靠展开运算符把空洞实心化）');

// ---------------------------------------------------------------------------
// 4. length 可写：截断与扩展
// ---------------------------------------------------------------------------

console.log('\n--- 4. length 可写 ---');

const list = [1, 2, 3, 4, 5];
console.log('原数组 =', JSON.stringify(list), '，length =', list.length);

// 截断（修改原数组！）
const truncated = [...list];
truncated.length = 2;
console.log('length = 2 之后 =', JSON.stringify(truncated), '（后面的元素被真的删掉了）');

// 扩展（新增位置是空洞）
const extended = [...list];
extended.length = 8;
console.log('length = 8 之后 =', extended);
console.log('  length =', extended.length, '，5 in arr =', 5 in extended, '（新增位置是空洞）');
console.log('  各位置的 in 情况 =', [...Array(8).keys()].map((i) => (i in extended ? '1' : '0')).join(''));

// 清空
const toClear = [1, 2, 3];
toClear.length = 0;
console.log('\nlength = 0 清空 =', JSON.stringify(toClear), '（最简洁的清空方式）');

// 非法值
console.log('\n非法 length 值：');
for (const badValue of [-1, 2.5, 4294967296]) {
  try {
    const t = [1, 2, 3];
    t.length = badValue;
    console.log(`  length = ${badValue} -> 成功，length = ${t.length}`);
  } catch (err) {
    console.log(`  length = ${badValue} -> ${err.constructor.name}: ${err.message}`);
  }
}
console.log('  （合法范围是 0 ~ 2^32 - 1 的整数）');

// 读 length 的时机问题：缓存 length 的风险
const changing = [1, 2, 3];
const cached = changing.length;
changing.push(4, 5);
console.log('\n缓存 length 后数组被修改：缓存的 =', cached, '，实际的 =', changing.length);
console.log('（所以循环里建议直接写 arr.length，而不是缓存在变量里；现代引擎对 arr.length 有优化）');

// ---------------------------------------------------------------------------
// 5. delete 数组元素的坑
// ---------------------------------------------------------------------------

console.log('\n--- 5. delete 的坑 ---');

const del = ['a', 'b', 'c', 'd'];
console.log('原数组 =', JSON.stringify(del), '，length =', del.length);

const delReturn = delete del[1];
console.log('delete del[1] 的返回值 =', delReturn, '（删除成功返回 true）');
console.log('delete 之后 =', del, '，length =', del.length, '（长度没变！）');
console.log('1 in del =', 1 in del, '（位置变成空洞）');
console.log('del[1] =', del[1], '（读取返回 undefined，容易被误以为"值是 undefined"）');

// 各种方法遇到它之后的迷惑行为
console.log('\n这个数组现在的迷惑行为：');
console.log('  length =', del.length, '，但 JSON.stringify =', JSON.stringify(del));
console.log('  forEach 访问到 =', (() => {
  const seen = [];
  del.forEach((v) => seen.push(v));
  return JSON.stringify(seen);
})(), '（只有 3 个元素）');
console.log('  filter(Boolean) 的长度 =', del.filter(Boolean).length);

// 正确替代方案
console.log('\n正确替代方案：');
const opt1 = ['a', 'b', 'c', 'd'];
opt1.splice(1, 1); // 删除并前移（修改原数组）
console.log('  想"删掉并把后面补上" -> arr.splice(1, 1) =', JSON.stringify(opt1), '，length =', opt1.length);

const opt2 = ['a', 'b', 'c', 'd'];
opt2[1] = undefined; // 置空但保留长度
console.log('  想"置空但保留长度"   -> arr[1] = undefined =', opt2, '，length =', opt2.length);
console.log('     （注意：这里没有空洞，1 in 结果 =', 1 in opt2, '）');

const opt3 = ['a', 'b', 'c', 'd'];
delete opt3[1];
console.log('  想"彻底移除位置"     -> delete（但这会造出空洞，几乎总是错的）');

console.log('\n结论：delete 数组元素在 99% 的情况下都是 bug，请用 splice。');
console.log('      （delete 适合删除"对象的属性"，不适合删除"数组的元素"）');

// 对比：删除对象属性是正常的
const obj = { a: 1, b: 2 };
delete obj.a;
console.log('  删除对象属性是正常的：', JSON.stringify(obj));

// ---------------------------------------------------------------------------
// 6. 修复稀疏数组
// ---------------------------------------------------------------------------

console.log('\n--- 6. 修复稀疏数组 ---');

const broken = [1, , 3, , 5]; // eslint-disable-line no-sparse-arrays
console.log('问题数组 =', broken, '，length =', broken.length, '，实际元素数 =', Object.keys(broken).length);

// 修复方式 1：实心化
const fixed1 = Array.from(broken);
console.log('Array.from 修复 =', JSON.stringify(fixed1), '，1 in 结果 =', 1 in fixed1);

// 修复方式 2：实心化并给默认值
const fixed2 = Array.from(broken, (v) => v ?? 0);
console.log('填默认值修复 =', JSON.stringify(fixed2));

// 修复方式 3：过滤掉空洞
const fixed3 = broken.filter(() => true);
console.log('filter 掉空洞 =', JSON.stringify(fixed3), '，length =', fixed3.length);

// 修复方式 4：用 entries 手动重建
const fixed4 = [...broken.entries()]
  .filter(([, v]) => v !== undefined)
  .map(([, v]) => v);
console.log('entries 重建 =', JSON.stringify(fixed4));

// 检查一个数组是否稀疏
function isSparse(a) {
  // 如果"存在的键数量"少于 length，说明有空洞
  return Object.keys(a).length !== a.length;
}
console.log('\nisSparse([1, , 3])          =', isSparse([1, , 3])); // eslint-disable-line no-sparse-arrays
console.log('isSparse([1, undefined, 3]) =', isSparse([1, undefined, 3]), '（undefined 也算"存在"）');
console.log('isSparse([1, 2, 3])         =', isSparse([1, 2, 3]));

// ---------------------------------------------------------------------------
// 7. 实战：清空与截断
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战：清空与截断 ---');

// 场景一：清空数组的三种方式（都能保留"引用"）
const sharedRef = [1, 2, 3];
const holder = sharedRef; // 别处还持有这个数组

sharedRef.length = 0; // 方式一：改 length
console.log('length = 0 清空后，holder 看到 =', JSON.stringify(holder), '（引用相同，内容同步清空）');

const sharedRef2 = [1, 2, 3];
const holder2 = sharedRef2;
sharedRef2.splice(0); // 方式二：splice
console.log('splice(0) 清空后，holder2 看到 =', JSON.stringify(holder2));

const sharedRef3 = [1, 2, 3];
const holder3 = sharedRef3;
// 方式三：重新赋值 —— 这不会清空原数组，只是让变量指向新数组
let reassigned = sharedRef3;
reassigned = []; // 只是改了变量 reassigned 的指向
console.log('重新赋值后，holder3 看到 =', JSON.stringify(holder3), '（原数组还在，别处仍看得到）');
console.log('结论：想让"所有持有者"都看到清空，必须用 length = 0 或 splice(0)，不能重新赋值。');

// 场景二：截断到前 N 项
const feed = ['a', 'b', 'c', 'd', 'e'];
const keepTop3 = [...feed];
keepTop3.length = Math.min(3, keepTop3.length);
console.log('\n截断到前 3 项 =', JSON.stringify(keepTop3));

// 不可变做法（推荐）
const immutTruncate = feed.slice(0, 3);
console.log('slice(0, 3) 不可变做法 =', JSON.stringify(immutTruncate), '，原数组 =', JSON.stringify(feed));

// 场景三：定长缓冲区，超出就丢弃最老的
class RingBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.items = [];
  }
  push(item) {
    this.items.push(item);
    // 超出容量就截断掉头部（用 splice 保留最后 capacity 个）
    if (this.items.length > this.capacity) {
      this.items.splice(0, this.items.length - this.capacity);
    }
    return this;
  }
  toArray() {
    return [...this.items];
  }
}
const ring = new RingBuffer(3);
[1, 2, 3, 4, 5].forEach((n) => ring.push(n));
console.log('\n容量 3 的环形缓冲，依次推入 1..5 =', JSON.stringify(ring.toArray()));
console.log('（始终只保留最新的 3 个）');

// 场景四：用 length 控制"并发的请求数不超过 N"
const queue = Array.from({ length: 5 }, (_, i) => `任务${i + 1}`);
console.log('\n任务队列 =', JSON.stringify(queue));
const batchSize = 2;
while (queue.length > 0) {
  const batch = queue.splice(0, batchSize); // 每次取 2 个（会修改 queue）
  console.log(`  处理批次：${JSON.stringify(batch)}，剩余 ${queue.length} 个`);
}

// ---------------------------------------------------------------------------
// 8. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 8. 小结 ---');
console.log('稀疏数组 = 有 length 但某些下标"不存在"，用 `i in arr` 判断，不是 `arr[i] === undefined`。');
console.log('跳过空洞的方法（用"查属性"的方式遍历）：forEach / map / filter / some / every / reduce / indexOf / lastIndexOf / join。');
console.log('**不跳过**空洞的方法（用"取值"的方式遍历）：find / findIndex / findLast / findLastIndex / includes —— 它们会把空洞当成 undefined。');
console.log('实心化空洞：[...arr] 或 Array.from(arr)（会变成真正的 undefined）。');
console.log('length 可写：改小 = 截断（mutating），改大 = 造空洞，写非法值 = RangeError。');
console.log('delete arr[i] 会造出空洞且不缩短长度，几乎总是错的 —— 请用 arr.splice(i, 1)。');
console.log('清空数组要"所有引用都看到"时，用 arr.length = 0，而不是 let x = [] 重新赋值。');
