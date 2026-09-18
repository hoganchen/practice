/**
 * ============================================================================
 * 知识点：定型数组的方法 —— map/filter/slice 返回新定型数组，set/subarray 的复制与共享
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/03_typed_array_types.js 与 08_arrays/ 中的数组方法
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    定型数组共享 %TypedArray%.prototype 上的一整套方法，大部分与普通数组同名同义：
 *    map / filter / forEach / reduce / find / every / some / indexOf / includes /
 *    join / fill / sort / reverse / copyWithin / slice / at / entries / keys / values。
 *    但它有三个"只在定型数组上存在"的关键差异，也是本文件的重点：
 *      a) map / filter / slice 返回的是**同类型的定型数组**，不是普通数组；
 *      b) 多了 set() 与 subarray() 这对专用方法，一个负责"复制进来"，
 *         一个负责"共享出去"；
 *      c) 没有 push / pop / shift / unshift / splice / concat —— 长度不可变。
 *
 * 2. 为什么需要
 *    处理二进制数据时，"复制"和"共享"是两种语义完全不同的操作。
 *    复制安全但费内存（比如要保留原始数据做对比）；
 *    共享高效但危险（比如解码一个大文件时只想改动其中一小段，不想整块复制）。
 *    JS 用 slice（复制）与 subarray（共享）把这两种语义明确分开。
 *
 * 3. 核心语法要点
 *    - mapped = arr.map(fn)      返回同类型定型数组；元素写回时同样会截断回绕
 *    - filtered = arr.filter(fn) 返回同类型定型数组，长度可能变短
 *    - copied = arr.slice(a, b)  复制 [a, b) 的元素到新内存
 *    - shared = arr.subarray(a, b)  不复制，返回共享同一块内存的新视图
 *    - arr.set(source, offset)   把 source 的元素拷进 arr 的指定位置
 *    - arr.sort()                默认按**数值大小**排序（不是按字符串！）
 *    - Array.from(arr) / [...arr]  转成普通数组
 *
 * 4. 常见陷阱
 *    - map 的返回值仍被限制在原类型里：Uint8Array.map(x => x * 2) 中若结果超过 255
 *      会发生回绕，而不是自动升级为 Uint16Array —— 这是最隐蔽的坑。
 *    - filter 的结果长度变短，但你无法从返回值的类型上看出这一点。
 *    - slice 与 subarray 语义相反，极易记混：slice 复制、subarray 共享。
 *    - subarray 的改动会反映到原数组（反之亦然）。
 *    - 定型数组的 sort 默认是数值排序，这一点**比普通数组更好用**：
 *      [10, 9, 1].sort() 得到 [1, 10, 9]（字符串序），而定型数组得到 [1, 9, 10]。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/04_typed_array_methods.js
 *
 * 【预期输出】
 *   打印各类方法的效果，并明确演示 slice 复制 / subarray 共享的区别。
 * ============================================================================
 */

// 小工具：把定型数组打印成紧凑的一行，方便阅读。
const show = (label, arr) => console.log(label, Array.from(arr).join(', '));

console.log('--- 1. map：返回同类型定型数组（不是普通数组） ---');

const base = new Uint8Array([1, 2, 3, 4]);

// 普通数组的 map 返回 Array；定型数组的 map 返回**同类型**定型数组。
const doubled = base.map((x) => x * 2);
console.log('base 是 Uint8Array 吗？', base instanceof Uint8Array);
console.log('doubled 是 Uint8Array 吗？', doubled instanceof Uint8Array, ' <- 关键差异');
console.log('doubled 是普通数组吗？', Array.isArray(doubled));
show('doubled =', doubled);
show('原数组未变 base =', base);

// 陷阱：结果超过元素取值范围时会**回绕**，不会自动升级类型。
// 200 * 2 = 400，400 mod 256 = 144。
const overflow = new Uint8Array([200, 130]).map((x) => x * 2);
show('Uint8Array [200,130].map(x => x*2) =', overflow);
console.log('  -> 400 回绕成 144，260 回绕成 4。要避免就先转成 Float64Array 或普通数组');

// 正确做法：先换成足够宽的容器，再计算。
const safe = Float64Array.from([200, 130], (x) => x * 2);
show('Float64Array.from 同样输入 =', safe);

// map 的回调参数与普通数组一致：(元素, 下标, 整个定型数组)。
const withIndex = new Int8Array([10, 20]).map((v, i, arr) => {
  console.log(`  回调收到 value=${v}, index=${i}, 整个数组长度=${arr.length}`);
  return v + i;
});
show('Int8Array [10,20].map((v,i) => v+i) =', withIndex);

console.log('--- 2. filter：返回同类型定型数组，长度可变短 ---');

const nums = new Int16Array([-5, 3, -1, 8, 0, 12]);

// filter 只挑出满足条件的元素，返回的仍是 Int16Array，但 length 变小了。
const positives = nums.filter((x) => x > 0);
show('positives =', positives);
console.log('原长度 =', nums.length, '，过滤后长度 =', positives.length);
console.log('过滤后类型仍是 Int16Array 吗？', positives instanceof Int16Array);

console.log('--- 3. slice vs subarray：复制与共享的分水岭 ---');

const original = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

// slice(a, b)：复制 [a, b) 到**新内存**。改副本不影响原数组。
const sliced = original.slice(2, 5);
show('original.slice(2,5) =', sliced);
sliced[0] = 99;
show('  改 sliced[0]=99 后 sliced  =', sliced);
show('  改 sliced[0]=99 后 original =', original);
console.log('  sliced.buffer === original.buffer ?', sliced.buffer === original.buffer, '（不同内存）');

// subarray(a, b)：不复制，返回**共享同一块内存**的新视图。
const sub = original.subarray(2, 5);
show('original.subarray(2,5) =', sub);
sub[0] = 77;
show('  改 sub[0]=77 后 sub      =', sub);
show('  改 sub[0]=77 后 original =', original, ' <- 原数组被改动了！');
console.log('  sub.buffer === original.buffer ?', sub.buffer === original.buffer, '（同一块内存）');

// 反向也成立：原数组改了，subarray 看得到。
original[4] = 66;
show('  改 original[4]=66 后 sub =', sub);

// 传负数下标表示从末尾算起，与 Array.prototype.slice 一致。
show('original.subarray(-3) =', original.subarray(-3));

console.log('--- 4. set：把数据批量复制进来 ---');

const target = new Uint8Array(8);

// set(source, offset) 把 source 的每个元素拷到 target[offset + i]。
target.set([10, 20, 30], 2);
show('target.set([10,20,30], 2) 后 =', target);

// source 也可以是另一个定型数组。
target.set(new Uint8Array([7, 7]), 0);
show('再 set(new Uint8Array([7,7]), 0) =', target);

// 也可以从一个共享内存的视图里取数据（例如从某个偏移开始截取）。
const raw = new Uint8Array([0, 0, 1, 2, 3, 0]);
const copy = new Uint8Array(3);
copy.set(raw.subarray(2, 5)); // 常与 subarray 搭配：共享读取 + 复制保存
show('从 raw.subarray(2,5) 复制出来 =', copy);
console.log('copy 与 raw 共享内存吗？', copy.buffer === raw.buffer);

// 越界会抛 RangeError（不像下标赋值那样静默丢弃），这一点很友好。
try {
  target.set([1, 2, 3], 7); // 7 + 3 = 10 > 8
} catch (err) {
  console.log('set 越界：', err.constructor.name, '-', err.message);
}

console.log('--- 5. 遍历与聚合方法 ---');

const data = new Uint8Array([3, 1, 4, 1, 5, 9, 2, 6]);

// forEach：只遍历不返回。
let total = 0;
data.forEach((v) => {
  total += v;
});
console.log('forEach 求和 =', total);

// reduce：聚合成一个值。
console.log('reduce 求和 =', data.reduce((acc, v) => acc + v, 0));
console.log('reduce 求最大值 =', data.reduce((acc, v) => (v > acc ? v : acc), 0));

// find / findIndex / includes / indexOf
console.log('find(x => x > 4) =', data.find((x) => x > 4));
console.log('findIndex(x => x > 4) =', data.findIndex((x) => x > 4));
console.log('includes(9) =', data.includes(9), ', includes(99) =', data.includes(99));
console.log('indexOf(1) =', data.indexOf(1), ', lastIndexOf(1) =', data.lastIndexOf(1));
console.log('every(x => x > 0) =', data.every((x) => x > 0));
console.log('some(x => x > 8) =', data.some((x) => x > 8));

// join / toString：定型数组默认用逗号连接，与普通数组一致。
console.log('join("-") =', data.join('-'));
console.log('toString() =', data.toString());

// 可迭代：可以用 for...of、展开运算符、解构。
let collected = [];
for (const v of data.subarray(0, 3)) collected.push(v);
console.log('for...of 遍历前 3 个 =', collected.join(','));
console.log('展开运算符 [...] =', [...data].join(','));
const [first, second] = data;
console.log('解构前两个 =', first, second);

// entries / keys / values
console.log('keys() 前 3 个 =', [...data.keys()].slice(0, 3).join(','));
console.log('entries() 前 2 个 =', JSON.stringify([...data.entries()].slice(0, 2)));

console.log('--- 6. sort：定型数组默认按数值排序（比普通数组好用） ---');

const values = new Int16Array([10, 9, 1, -3, 100]);

// 普通数组的默认 sort 会把元素转成字符串按字典序比较：1, 10, 100, 9 ...
console.log('普通数组 [10,9,1,-3,100].sort() =', [10, 9, 1, -3, 100].sort().join(','));

// 定型数组的默认 sort 用数值比较，结果符合直觉。
values.sort();
show('Int16Array 默认 sort() =', values);
console.log('  -> 定型数组不需要传 (a,b)=>a-b，这是它与普通数组的重要差异');

// 当然也可以传比较函数自定义顺序。
values.sort((a, b) => b - a);
show('降序 sort((a,b) => b-a) =', values);

// reverse 就地反转。
values.reverse();
show('reverse() =', values);

console.log('--- 7. fill / copyWithin / at ---');

// fill(value, start, end)：用同一个值填充一段区间。
const filled = new Uint8Array(6);
filled.fill(0xff, 1, 4);
show('fill(0xff, 1, 4) =', filled);

// copyWithin(target, start, end)：在**同一块内存内部**搬移数据，不改变长度。
// 这里把 [0,3) 的元素（1 2 3）搬到下标 3 开始的位置。
const shifted = new Uint8Array([1, 2, 3, 4, 5, 6]);
shifted.copyWithin(3, 0, 3);
show('copyWithin(3, 0, 3) =', shifted);

// at() 支持负下标，比 arr[arr.length - 1] 更简洁。
const last = new Uint8Array([10, 20, 30]);
console.log('arr.at(-1) =', last.at(-1), ', arr.at(-2) =', last.at(-2));

console.log('--- 8. 定型数组没有的方法 ---');

// 这些数组方法在定型数组上不存在，因为长度不可变。
const methodNames = ['push', 'pop', 'shift', 'unshift', 'splice', 'concat', 'flat'];
for (const name of methodNames) {
  console.log(`  TypedArray.prototype.${name} =`, typeof Uint8Array.prototype[name]);
}
console.log('  -> 全部 undefined：定型数组一旦创建，长度就固定了');

// 需要"可增长"时，用普通数组收集，最后再一次性转换成定型数组。
const collected2 = [];
for (const v of [1, 2, 3, 4, 5]) {
  if (v % 2 === 1) collected2.push(v * 10);
}
const finalized = Uint8Array.from(collected2);
show('先 push 再 Uint8Array.from =', finalized);
console.log('finalized 的 byteLength =', finalized.byteLength, '（= 元素个数 × 1）');

console.log('\n全部演示完毕。');
