/**
 * ============================================================================
 * 知识点：定型数组的 8 种类型 —— 取值范围、溢出回绕与普通数组的差异
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/01_arraybuffer_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    定型数组（TypedArray）是一族共享同一套方法、但元素类型不同的构造函数。
 *    核心的 8 种如下（括号里是每个元素的字节数）：
 *      Int8Array    (1) 有符号 8 位整数
 *      Uint8Array   (1) 无符号 8 位整数      <- 最常用，代表"一个字节"
 *      Int16Array   (2) 有符号 16 位整数
 *      Uint16Array  (2) 无符号 16 位整数
 *      Int32Array   (4) 有符号 32 位整数
 *      Uint32Array  (4) 无符号 32 位整数
 *      Float32Array (4) 单精度浮点数
 *      Float64Array (8) 双精度浮点数（与 JS 的 number 完全一致）
 *    另外还有三个"非核心"成员：
 *      Uint8ClampedArray —— 越界不是回绕而是"夹紧"，Canvas 的 ImageData 用它
 *      BigInt64Array / BigUint64Array —— 元素是 BigInt，每个 8 字节
 *    JS 里没有单独的 "TypedArray" 构造函数，上面这些名字都是独立的构造函数，
 *    它们共享同一个原型祖先 %TypedArray%.prototype。
 *
 * 2. 为什么需要
 *    普通数组的元素是"装箱"的，每个元素都可能是一个独立的对象，内存开销大、不连续。
 *    定型数组每个元素固定宽度的二进制表示，内存完全连续，
 *    既能直接映射到硬件（音频采样、像素、矩阵），也能与 C/WebAssembly 交换数据，
 *    同时因为元素类型固定，JIT 能把它编译成接近原生的机器码。
 *
 * 3. 核心语法要点
 *    - new Uint8Array(5)                按"元素个数"创建，会自动配一块内存，默认填 0
 *    - new Uint8Array([1, 2, 3])        从普通数组（或类数组）拷贝元素
 *    - new Uint8Array(otherTypedArray)  从另一个定型数组拷贝（类型转换 + 复制内存）
 *    - new Uint8Array(buffer)           把已有内存当视图用（共享内存，不复制）
 *    - TypedArray.BYTES_PER_ELEMENT     每个元素的字节数
 *    - arr.length                       元素个数（固定不可变）
 *    - arr.byteLength / arr.byteOffset  底层内存信息
 *    - Uint8Array.from(iterable)        与 Array.from 类似
 *
 * 4. 常见陷阱
 *    - 写入越界值不会报错，而是"按位截断回绕"（modulo 2^n），非常容易写出隐藏 bug。
 *    - 越界读写下标（超出 length）会被静默丢弃，也不报错。
 *    - 长度固定：没有 push / pop / shift / splice，越界写不会自动扩容。
 *    - 元素永远存在，不存在"空槽"（稀疏）；规定之外的初始值一律为 0。
 *    - Array.isArray(typedArray) 是 false；typeof 是 'object'。
 *    - Float 类型没有回绕，但 Float32 只有约 7 位十进制有效数字，精度会丢。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/03_typed_array_types.js
 *
 * 【预期输出】
 *   打印 8 种类型的字节宽度、取值范围、溢出回绕实例，以及与普通数组的差异。
 * ============================================================================
 */

console.log('--- 1. 8 种核心类型及其字节宽度 ---');

// 每种定型数组构造函数上都挂着一个静态属性 BYTES_PER_ELEMENT。
const TYPES = [
  Int8Array,
  Uint8Array,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
];

// 构造一个"长度为 1"的实例，就能读出它每个元素占多少字节。
for (const Ctor of TYPES) {
  const one = new Ctor(1);
  console.log(
    `${Ctor.name.padEnd(13)} 每元素 ${one.BYTES_PER_ELEMENT} 字节  ` +
      `byteLength=${one.byteLength}  ` +
      `范围 ${describeRange(Ctor)}`,
  );
}

// 根据类型名推算取值范围：n 位无符号是 [0, 2^n-1]，有符号是 [-2^(n-1), 2^(n-1)-1]。
function describeRange(Ctor) {
  const bits = Ctor.BYTES_PER_ELEMENT * 8;
  const name = Ctor.name;
  if (name.startsWith('Float')) {
    return name === 'Float32Array' ? '约 ±3.4e38（IEEE 754 单精度）' : '约 ±1.8e308（IEEE 754 双精度）';
  }
  if (name.startsWith('Uint')) {
    return `0 ~ ${2 ** bits - 1}`;
  }
  return `${-(2 ** (bits - 1))} ~ ${2 ** (bits - 1) - 1}`;
}

console.log('--- 2. 四种创建方式 ---');

// 方式一：给元素个数。会自动分配内存并清零。
const byLength = new Uint8Array(4);
console.log('new Uint8Array(4)          =', Array.from(byLength).join(','), '| length =', byLength.length);

// 方式二：给一个普通数组/可迭代对象，元素被逐个转换后拷进去。
const byArray = new Uint8Array([10, 20, 255, 300]);
console.log('new Uint8Array([10,20,255,300]) =', Array.from(byArray).join(','), ' <- 300 被回绕成 44');

// 方式三：从另一个定型数组拷贝。类型不同时逐元素转换，并且是"复制"而非共享。
const src = new Int16Array([1, -1, 258]);
const copied = new Uint8Array(src);
console.log('Int16Array [1,-1,258] 转成 Uint8Array =', Array.from(copied).join(','), ' <- -1->255, 258->2');
console.log('  copied.buffer === src.buffer ?', copied.buffer === src.buffer, '（各自独立内存）');

// 方式四：给一块已有的 ArrayBuffer，成为它的视图（共享内存，不复制）。
const sharedBuffer = new ArrayBuffer(4);
const view = new Uint16Array(sharedBuffer);
const byteView = new Uint8Array(sharedBuffer);
view[0] = 0x1234;
console.log(
  'Uint16Array 视图写入 0x1234 后，字节视图 =',
  Array.from(byteView, (b) => b.toString(16).padStart(2, '0')).join(' '),
  '<- 34 12 说明本机是小端序',
);
console.log('  view.buffer === sharedBuffer ?', view.buffer === sharedBuffer, '（共享）');

console.log('--- 3. 溢出回绕：写入越界值会怎样 ---');

// 规则：先把值转成整数（截断小数），再对 2^位数 取模，最后按有/无符号解释。
const u8 = new Uint8Array(1);
const i8 = new Int8Array(1);

const cases = [0, 127, 128, 255, 256, 257, 511, -1, -128, -129, 256.9, -0.5];
console.log('写入值  ->  Uint8   |  Int8');
for (const v of cases) {
  u8[0] = v;
  i8[0] = v;
  console.log(`  ${String(v).padStart(7)}  ->  ${String(u8[0]).padStart(5)}  |  ${String(i8[0]).padStart(5)}`);
}

// 手工验算几个：
//   256 = 2^8，模 256 得 0
//   257 模 256 得 1
//   -1  模 256 得 255；按有符号解释 255 的位模式 11111111 就是 -1
//   128 的位模式 10000000，无符号是 128，有符号是 -128
//   256.9 先截断为 256，再取模得 0
console.log('  -> 无符号：结果 = 值 mod 256（负数也按 mod 处理）');
console.log('  -> 有符号：位模式相同，但最高位被当作符号位解释');
console.log('  -> 小数会被先截断（不是四舍五入）：256.9 -> 256 -> 0，-0.5 -> 0');

console.log('--- 4. 32 位类型同样回绕，且位运算要小心 ---');

const u32 = new Uint32Array([0]);
const i32 = new Int32Array([0]);

// 0x1_0000_0000 = 2^32，超出 32 位，回绕成 0。
u32[0] = 0x1_0000_0000;
console.log('Uint32Array 写入 2^32 =', u32[0]);

// 4294967295 是 32 位无符号的最大值。
u32[0] = 4294967295;
i32[0] = 4294967295;
console.log('写入 4294967295 -> Uint32 =', u32[0], ', Int32 =', i32[0], '（溢出为 -1）');

// 负数同理。
u32[0] = -1;
console.log('Uint32Array 写入 -1 =', u32[0], '（回绕成最大值）');

console.log('--- 5. Uint8ClampedArray：不回绕，而是"夹紧" ---');

// Canvas 的像素数据用它：颜色分量越界时我们希望它停在 255 或 0，
// 而不是变成 0（回绕）产生一块突兀的黑色像素。
const clamped = new Uint8ClampedArray(6);
const clampInput = [300, -5, 1.5, 2.5, 0.5, 128.5];
clampInput.forEach((v, i) => {
  clamped[i] = v;
});
console.log('输入    =', clampInput.join(', '));
console.log('夹紧后  =', Array.from(clamped).join(', '));
console.log('  -> 超大 -> 255，超小 -> 0（夹紧）');
console.log('  -> 小数按"四舍六入五取偶"取整：1.5->2, 2.5->2, 0.5->0, 128.5->128');

console.log('--- 6. 浮点类型不回绕，但会丢精度 / 变无穷 ---');

const f32 = new Float32Array(1);
const f64 = new Float64Array(1);

// 0.1 无法用二进制精确表示，单精度只剩约 7 位有效数字，误差被放大。
f32[0] = 0.1;
f64[0] = 0.1;
console.log('0.1 存进 Float32 =', f32[0]);
console.log('0.1 存进 Float64 =', f64[0], '（与普通 number 一致）');
console.log('  两者相等吗？', f32[0] === f64[0]);

// 超大值超出单精度上限，会变成 Infinity（不回绕）。
f32[0] = 1e40;
console.log('1e40 存进 Float32 =', f32[0], '（溢出为 Infinity）');

// Float32 还常用来证明 0.1 + 0.2 !== 0.3 的精度问题。
f32[0] = 0.1;
const sum32 = new Float32Array([f32[0] + new Float32Array([0.2])[0]])[0];
console.log('Float32 下 0.1 + 0.2 =', sum32, '，与 0.3 相等吗？', sum32 === 0.3);

console.log('--- 7. 与普通数组的差异 ---');

const normal = [1, 2, 3];
const typed = new Uint8Array([1, 2, 3]);

console.log('Array.isArray(普通数组) =', Array.isArray(normal));
console.log('Array.isArray(定型数组) =', Array.isArray(typed), ' <- 不是数组');
console.log('typeof 定型数组 =', typeof typed, ' <- object，不是 "typedarray"');

// 定型数组上调用数组的变异方法会失败（它们不存在）。
console.log('typed.push 存在吗？', typeof typed.push, ' <- 定型数组长度固定，不能增删元素');

// 试图撑大长度也不会生效。
typed[5] = 9;
console.log('执行 typed[5]=9 后 length =', typed.length, '（长度不可变，越界写被丢弃）');

// 元素不会空：即使从稀疏数组创建，空槽也会被填成 0 / NaN。
const sparse = new Array(5);
sparse[2] = 7;
console.log('由稀疏数组创建 Uint8Array =', Array.from(new Uint8Array(sparse)).join(','));
console.log('由稀疏数组创建 Float64Array =', Array.from(new Float64Array(sparse)).join(','));

// 定型数组的原型链顶端就是 %TypedArray%.prototype，
// 所以所有定型数组共享同一套方法（map/filter/... 见下一个文件）。
// 判断方式：比较两个不同类型定型数组的原型的原型是否为同一个对象。
console.log(
  'Uint8Array 与 Float64Array 共享同一个 TypedArray.prototype 吗？',
  Object.getPrototypeOf(Uint8Array.prototype) === Object.getPrototypeOf(Float64Array.prototype),
);

console.log('--- 8. 元素字节数不相等：同一块内存，不同 length ---');

// 16 字节内存：Uint8Array 看到 16 个元素，Uint32Array 看到 4 个，Float64Array 看到 2 个。
const mem = new ArrayBuffer(16);
console.log('Uint8Array(16).length  =', new Uint8Array(mem).length);
console.log('Uint16Array 的 length  =', new Uint16Array(mem).length);
console.log('Uint32Array 的 length  =', new Uint32Array(mem).length);
console.log('Float64Array 的 length =', new Float64Array(mem).length);

// 关键：字节数必须能被元素宽度整除，否则连视图都建不出来。
try {
  // 12 字节不是 8 的整数倍，Float64Array 无法覆盖整块内存。
  new Float64Array(new ArrayBuffer(12));
} catch (err) {
  console.log('12 字节建 Float64Array：', err.constructor.name, '-', err.message);
}

// 用非元素宽度的字节数创建会抛 RangeError。
try {
  new Uint32Array(mem, 0, 2); // 2 个元素 = 8 字节，OK
  new Uint32Array(mem, 1, 1); // 偏移 1 不是 4 的倍数
} catch (err) {
  console.log('非对齐创建抛错：', err.constructor.name, '-', err.message);
}

console.log('\n全部演示完毕。');
