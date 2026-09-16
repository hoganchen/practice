/**
 * ============================================================================
 * 知识点：ArrayBuffer —— 字节缓冲区、byteLength 与「内存与视图分离」
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】进阶
 * 【前置知识】03_data_types/01_primitive_types.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ArrayBuffer 表示"一段连续的、长度固定的原始内存"，计量单位是字节（byte）。
 *    1 字节 = 8 个二进制位（bit），能表示 0~255 这 256 个整数。
 *    ArrayBuffer 本身是一块"空地"，它不提供任何读写数据的方法；
 *    要读写它，必须借助"视图"（View）：Uint8Array、Int16Array、DataView 等。
 *    这就是所谓的"内存与视图分离"：内存归 ArrayBuffer，解读方式归视图。
 *
 * 2. 为什么需要
 *    普通 JS 数组是对象，元素可以是任意类型，内存不保证连续，还带有大量元信息；
 *    而图片、音频、网络报文、加密结果、WebAssembly 内存这些数据，
 *    在底层就是"一段连续的字节"。JS 必须能精确地按字节操作它们，
 *    于是引入了 ArrayBuffer（内存）+ 定型数组（视图）这一套模型。
 *
 * 3. 核心语法要点
 *    - new ArrayBuffer(byteLength)  开辟指定字节数的内存，新内存默认全部填 0。
 *    - buf.byteLength               字节长度，创建后不可变（见第 6 节的可扩容特例）。
 *    - buf.slice(start, end)        复制出新的 ArrayBuffer（复制内容，不是共享引用）。
 *    - ArrayBuffer.isView(x)        判断 x 是否为视图（定型数组或 DataView）。
 *    - new Uint8Array(buf)          最常用的视图：把这块内存看成"一串 0~255 的字节"。
 *    - 视图的 .buffer 属性          反向指回它所依附的那个 ArrayBuffer。
 *
 * 4. 常见陷阱
 *    - ArrayBuffer 不能下标读写。buf[0] = 1 不会报错，但也完全无效（buf[0] 永远是 undefined）。
 *      必须通过视图写：new Uint8Array(buf)[0] = 1。
 *    - 一个 ArrayBuffer 可以同时挂多个视图，它们共享同一块内存（本章 05 详解）。
 *    - slice() 是"复制内存内容"，得到的是新内存；两个 buffer 之后互不影响。
 *    - 字节数不等于元素个数：同一个 8 字节缓冲区，Uint8Array.length 是 8，
 *      Uint16Array.length 是 4，Float64Array.length 是 1。
 *    - 内存分配是有限资源，超大 ArrayBuffer 会抛 RangeError。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/01_arraybuffer_basics.js
 *
 * 【预期输出】
 *   打印缓冲区字节长度、内部字节内容、切片结果，并证明"内存与视图分离"。
 * ============================================================================
 */

console.log('--- 1. 创建一个 8 字节的 ArrayBuffer ---');

// 参数是"字节数"，不是"元素个数"，也不指定类型。
// 新分配的内存会被引擎清零（这是规范要求的，避免读到别人残留的数据）。
const buf = new ArrayBuffer(8);

// byteLength 是这块内存的字节数，单位永远是字节。
console.log('byteLength =', buf.byteLength);

// 空内存里全是 0。我们用 Uint8Array 这个"放大镜"把它逐字节读出来。
// Array.from 把定型数组转成普通数组，方便 console.log 显示。
console.log('初始内容（十进制）=', Array.from(new Uint8Array(buf)));

console.log('--- 2. ArrayBuffer 自己不能下标读写（重要陷阱） ---');

// 读：ArrayBuffer 上没有下标属性，所以读出来是 undefined。
console.log('直接读 buf[0] =', buf[0], '（永远是 undefined）');

// 写：不会报错！因为它只是在这个普通对象上新建了一个叫 "0" 的普通属性，
// 跟缓冲区里那块内存毫无关系。这是最危险的一类 bug：看起来成功了，其实完全无效。
buf[0] = 123;
console.log('执行 buf[0] = 123 之后：');
console.log('  buf[0]（普通属性）=', buf[0], ' <- 看起来写进去了');
console.log('  内存里的第 0 个字节 =', new Uint8Array(buf)[0], ' <- 内存根本没变');

// 这也解释了为什么必须用视图：只有视图知道"下标 0 对应内存的第 0 个字节"。
// 顺手把这个误加的属性删掉，免得影响后面演示。
delete buf[0];

console.log('--- 3. 通过视图读写这块内存 ---');

// 视图是"解读内存的方式"，它不是数据的容器，只是内存的一扇窗。
// Uint8Array 把每个字节解释为一个 0~255 的无符号整数。
const view = new Uint8Array(buf);

// 现在按元素下标读写就生效了。
view[0] = 255; // 1 字节能表示的最大值
view[1] = 0x1f; // 十六进制字面量：0x1f === 31
view[7] = 200;

// 视图的 buffer 属性指回它依附的 ArrayBuffer，两者是同一个对象。
console.log('view.buffer === buf ?', view.buffer === buf);

// 用十六进制看更符合"字节"的直觉：每个字节固定两位十六进制。
// 255 -> ff，31 -> 1f，200 -> c8。
const toHex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');

console.log('写入后（十进制）=', Array.from(view));
console.log('写入后（十六进制）=', toHex(view));

// 下标越界：赋予定型数组的值会被丢弃（不报错），读到的是 undefined。
view[8] = 9;
console.log('越界写 view[8]=9 之后再读 view[8] =', view[8], '（被静默丢弃）');
console.log('byteLength 仍然是', buf.byteLength, '，越界写不会撑大内存');

console.log('--- 4. slice：复制出一块新内存 ---');

// slice(start, end) 复制 [start, end) 区间，返回一个全新的 ArrayBuffer。
// 注意：不是引用，是实打实的复制。
const part = buf.slice(0, 2);
console.log('part.byteLength =', part.byteLength);
console.log('part 内容（十六进制）=', toHex(new Uint8Array(part)));

// 修改原缓冲区，切片出来的副本不受影响 —— 证明它们是两块独立内存。
view[0] = 1;
console.log('改原内存后 part 的内容 =', toHex(new Uint8Array(part)), '（未受影响）');
console.log('原内存现在的值 =', toHex(view));

// 不传参数则整块复制。
console.log('buf.slice() 的字节数 =', buf.slice().byteLength);

// 负数下标表示"从末尾往回数"，-2 即倒数第 2 个字节的位置。
console.log('buf.slice(-2) 的内容 =', toHex(new Uint8Array(buf.slice(-2))));

console.log('--- 5. 内存与视图分离：同一块内存，多种解读 ---');

// 同一块 8 字节内存，既可以看成 8 个字节，也可以看成 4 个 16 位整数。
// 这是 ArrayBuffer 模型最核心的价值：内存只有一份，解读方式可以有很多种。
const bytes = new Uint8Array(buf);
const words = new Uint16Array(buf);

console.log('view 元素个数（按 1 字节读）=', bytes.length);
console.log('word 元素个数（按 2 字节读）=', words.length);
console.log('两者 byteLength 相同 =', bytes.byteLength, '/', words.byteLength);

// 通过 Uint8Array 写第 0、1 个字节，再通过 Uint16Array 读第 0 个元素。
// 会发现 Uint16Array[0] 恰好把这两个字节"合成"了一个数（小端序，详见 02 与 03）。
bytes[0] = 0x34;
bytes[1] = 0x12;
console.log('通过字节视图写入 34 12 后：');
console.log('  Uint8Array[0] =', bytes[0].toString(16), ', Uint8Array[1] =', bytes[1].toString(16));
console.log('  Uint16Array[0] = 0x' + words[0].toString(16), '（两个字节被合成一个 16 位数）');

// 反过来通过 Uint16Array 写，也能从字节视图里看到变化 —— 因为它们本就是同一块内存。
words[1] = 0xaabb;
console.log('通过 Uint16Array 写 words[1]=0xaabb 后，字节视图 =', toHex(bytes));

console.log('--- 6. isView：区分"内存"和"视图" ---');

console.log('ArrayBuffer.isView(buf) =', ArrayBuffer.isView(buf), '（buf 是内存，不是视图）');
console.log('ArrayBuffer.isView(bytes) =', ArrayBuffer.isView(bytes), '（定型数组是视图）');
console.log('ArrayBuffer.isView(new DataView(buf)) =', ArrayBuffer.isView(new DataView(buf)), '（DataView 也是视图）');
console.log('ArrayBuffer.isView([1, 2, 3]) =', ArrayBuffer.isView([1, 2, 3]), '（普通数组不是视图）');

console.log('--- 7. 可扩容的 ArrayBuffer（ES2024 特性） ---');

// 第二个参数 maxByteLength 让缓冲区可以"长大"到指定上限。
// 普通缓冲区 byteLength 恒定，这个例外值得知道。
const growable = new ArrayBuffer(4, { maxByteLength: 16 });

// resizable 属性标明它是否可扩容。
console.log('resizable =', growable.resizable);
console.log('初始 byteLength =', growable.byteLength, ', maxByteLength =', growable.maxByteLength);

// resize 直接改变字节数；扩容出来的新区域同样会被清零。
growable.resize(10);
const growView = new Uint8Array(growable);
growView[9] = 7;
console.log('扩容后 byteLength =', growable.byteLength);
console.log('追加区域（前 4 字节之外）默认清零，写第 10 个字节后 =', toHex(growView));

// 普通缓冲区的 resizable 是 false，调用 resize 会抛 TypeError。
console.log('普通 buf 的 resizable =', buf.resizable);
try {
  buf.resize(100);
} catch (err) {
  console.log('对不可扩容的 buffer 调 resize：', err.constructor.name, '-', err.message);
}

console.log('--- 8. 分配失败会抛 RangeError ---');

// 内存不是无限的。请求一个荒谬的大小会被引擎拒绝。
// 这里用 try/catch 接住，保证脚本仍然以退出码 0 结束。
try {
  const tooBig = new ArrayBuffer(Number.MAX_SAFE_INTEGER);
  console.log('不该走到这里：', tooBig.byteLength);
} catch (err) {
  console.log('分配超大内存抛错：', err.constructor.name, '-', err.message);
}

console.log('\n全部演示完毕。');
