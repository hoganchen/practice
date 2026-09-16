/**
 * ============================================================================
 * 知识点：多个视图共享同一块 ArrayBuffer —— 互相影响的原理与实战用法
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/01_arraybuffer_basics.js 与 04_typed_array_methods.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    前面说过"内存（ArrayBuffer）与视图（TypedArray / DataView）分离"。
 *    这句话的真正含义是：**一块内存可以同时挂任意多个视图**，
 *    每个视图有自己的类型、自己的起始偏移、自己的长度，
 *    但它们读到和写到的都是同一批字节。改一个，其它视图立刻"看得见"。
 *
 * 2. 为什么需要
 *    这是处理二进制数据的基本手法，常见场景：
 *    - 把 4 个字节的 RGBA 像素当成一个 32 位整数整体读写（像素缓冲区）；
 *    - 把一段报文头用 DataView 按字段解析，报文体用 Uint16Array 按数组处理；
 *    - 零拷贝：解码网络包时，只想改动其中一小段，不必复制整块内存。
 *    如果没有"多视图共享内存"，上面每一件事都要手动做字节拼接，既慢又易错。
 *
 * 3. 核心语法要点
 *    - new Uint8Array(buffer)                  整块内存，按字节看
 *    - new Uint32Array(buffer)                 整块内存，按 4 字节一组看
 *    - new Uint8Array(buffer, byteOffset, n)   只覆盖其中一段，长度以"元素个数"计
 *    - view.buffer / view.byteOffset / view.byteLength   视图依附的内存信息
 *    - view.subarray(a, b)                     共享内存的"子视图"（见 04）
 *    - typedArray.set(other)                   视图之间复制**数据**（不是共享）
 *    - 从定型数组再取一个字节视图：
 *        new Uint8Array(ta.buffer, ta.byteOffset, ta.byteLength)
 *      注意必须带上 byteOffset，否则会从整块内存的起点开始，范围就错了。
 *
 * 4. 常见陷阱
 *    - 以为写了新视图就"隔离"了 —— 没有。所有视图都是同一块内存的窗口。
 *    - new Uint8Array(ta) 是**复制**，new Uint8Array(ta.buffer) 是**共享**，
 *      两者只差一个 .buffer，语义天差地别。
 *    - 视图被"转移"（transfer）后原缓冲区会 detached，此时 byteLength 变成 0，
 *      再建视图会抛 TypeError。
 *    - 用错 byteOffset 建视图会读到错误的数据，而且不会报错。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/05_multiple_views.js
 *
 * 【预期输出】
 *   演示多个视图互相影响、实战中的"像素/报文"共享内存玩法，以及 detached 缓冲区。
 * ============================================================================
 */

// 小工具：十六进制字节串。
const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');

console.log('--- 1. 一块内存，两个视图，互相影响 ---');

const buffer = new ArrayBuffer(8);

// 视图 A：按 1 字节看；视图 B：按 2 字节看。二者长度不同，内存相同。
const bytes = new Uint8Array(buffer);
const words = new Uint16Array(buffer);

console.log('bytes.length =', bytes.length, ', words.length =', words.length);
console.log('bytes.byteLength 与 words.byteLength 都是', bytes.byteLength, '/', words.byteLength);

// 通过 A 写第 0 字节，观察 B 的第 0 个元素。
bytes[0] = 0x11;
console.log('bytes[0] = 0x11 之后，words[0] = 0x' + words[0].toString(16));
console.log('  （words[0] 原本只需第 0、1 字节都是 0 才是 0）');

// 通过 A 写第 1 字节，B 的第 0 个元素立刻变化 —— 因为它由这两个字节组成。
bytes[1] = 0x22;
console.log('bytes[1] = 0x22 之后，words[0] = 0x' + words[0].toString(16), '（小端序：低位在前）');
console.log('当前内存 =', hex(bytes));

// 反过来，通过 B 写，A 也立刻"看见"。
words[1] = 0xdead;
console.log('words[1] = 0xdead 之后，内存 =', hex(bytes));
console.log('  bytes[2] =', hex([bytes[2]]), ', bytes[3] =', hex([bytes[3]]), '（0xdead 的两半）');

console.log('--- 2. 实战：用 Uint32Array 视图整体读写 RGBA 像素 ---');

// 一张 2x2 的图片，每个像素 4 字节（R、G、B、A），共 16 字节。
const pixelBuffer = new ArrayBuffer(16);

// 像素级视图：按 4 字节一组看，每个元素就是一个完整像素。
const pixels = new Uint32Array(pixelBuffer);
// 字节级视图：可以精细调整某一个颜色分量。
const colorBytes = new Uint8Array(pixelBuffer);

// 小端序下，一个 32 位整数 0xAABBGGRR 在内存里排成 RR GG BB AA。
// 这正是大多数平台在 Canvas ImageData 里存放像素的顺序。
pixels[0] = 0xff0000ff; // 不透明红：AA=ff, BB=00, GG=00, RR=ff
pixels[1] = 0xff00ff00; // 不透明绿
pixels[2] = 0xffff0000; // 不透明蓝
pixels[3] = 0xffffffff; // 白色

console.log('内存中的 16 个字节 =', hex(colorBytes));
console.log('第 1 个像素的 4 个分量 =', Array.from(colorBytes.subarray(0, 4)).join(','), '（R,G,B,A）');
console.log('  -> 0xff0000ff 在小端机上的字节序正是 ff 00 00 ff，即 R=255 G=0 B=0 A=255');

// 用字节视图单独把第 3 个像素的 R 分量调高（它是 0xffff0000，R 分量是第 8 个字节）。
colorBytes[8] = 0x80;
console.log('把第 3 个像素的 R 分量改成 0x80 后，pixels[2] = 0x' + (pixels[2] >>> 0).toString(16));
console.log('  -> 一次字节级修改，整数视图立刻反映出来');

// 反之，整体改一个像素。
pixels[3] = 0x8000ff00;
console.log('整体设置 pixels[3] = 0x8000ff00 后，它的 4 个字节 =', hex(colorBytes.subarray(12, 16)));

console.log('--- 3. 带偏移的视图：只覆盖内存的一段 ---');

const layout = new ArrayBuffer(12);
new Uint8Array(layout).fill(0);

// 在一个大缓冲区里划分区域：前 4 字节给头部，后 8 字节给数据体。
// 注意第三个参数是"元素个数"，不是字节数（对 Uint16Array 而言 1 个元素 = 2 字节）。
const headView = new Uint8Array(layout, 0, 4); // 字节 0~3
const bodyView = new Uint16Array(layout, 4, 4); // 字节 4~11，共 4 个 16 位元素

console.log('headView.byteOffset =', headView.byteOffset, ', byteLength =', headView.byteLength);
console.log('bodyView.byteOffset =', bodyView.byteOffset, ', byteLength =', bodyView.byteLength);

// 两个视图分别写自己的区域，互不重叠，但都在同一块内存里。
headView.set([0xca, 0xfe, 0xba, 0xbe]);
bodyView.set([1, 2, 3, 4]);
console.log('整块内存 =', hex(new Uint8Array(layout)));
console.log('  -> 头部视图里的 ca fe ba be 是 4 个字节（即魔数），');
console.log('     数据体视图里的 1 2 3 4 各占 2 字节：01 00 02 00 03 00 04 00');

// 用偏移视图的好处：不需要计算绝对下标，各部分的代码互不干扰。
headView[0] = 0x00;
console.log('改 headView[0] 后，bodyView 受影响吗？', Array.from(bodyView).join(','), '（不受影响，区域不重叠）');

console.log('--- 4. 重叠视图：同一批字节的两种解读 ---');

const overlap = new ArrayBuffer(8);
const b8 = new Uint8Array(overlap);
b8.set([1, 2, 3, 4, 5, 6, 7, 8]);
console.log('初始内存 =', hex(b8));

// 视图 X：字节 0~3；视图 Y：字节 2~5。它们在字节 2、3 上重叠。
const x = new Uint8Array(overlap, 0, 4);
const y = new Uint8Array(overlap, 2, 4);
console.log('x =', Array.from(x).join(','), ', y =', Array.from(y).join(','));

// 改 y[0]（对应整块内存的第 2 个字节），x[2] 同步变化。
y[0] = 99;
console.log('改 y[0]=99 后：x =', Array.from(x).join(','), ', y =', Array.from(y).join(','));
console.log('  -> x[2] 变成了 99，因为 x[2] 和 y[0] 是同一个字节');

console.log('--- 5. 复制 vs 共享：只差一个 .buffer ---');

const src = new Uint8Array([1, 2, 3, 4]);

// 方式一：new Uint8Array(定型数组) —— 逐元素**复制**，新内存。
const copiedBytes = new Uint8Array(src);
copiedBytes[0] = 99;
console.log('复制版：改副本后 src =', Array.from(src).join(','), '（原数组不受影响）');
console.log('  copiedBytes.buffer === src.buffer ?', copiedBytes.buffer === src.buffer);

// 方式二：new Uint8Array(定型数组.buffer, ...) —— **共享**同一块内存。
// 必须把 byteOffset 和 byteLength 一起带上，否则拿到的是整块 buffer 的视图。
const sharedBytes = new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
sharedBytes[0] = 99;
console.log('共享版：改子视图后 src =', Array.from(src).join(','), '（原数组被改动）');
console.log('  sharedBytes.buffer === src.buffer ?', sharedBytes.buffer === src.buffer);

// 如果只取 .buffer 而丢掉 byteOffset，遇到"从大缓冲区里切出来"的数组就会读错。
const big = new ArrayBuffer(8);
const middle = new Uint8Array(big, 2, 4); // 只覆盖字节 2~5
middle.set([11, 22, 33, 44]);

const right = new Uint8Array(middle.buffer, middle.byteOffset, middle.byteLength);
const wrong = new Uint8Array(middle.buffer); // 漏掉 byteOffset
console.log('正确的字节视图 =', Array.from(right).join(','));
console.log('漏掉 byteOffset 的视图 =', Array.from(wrong).join(','), ' <- 读到了前面的无用字节');

console.log('--- 6. 多视图协作：DataView 解析头部 + 定型数组处理数据体 ---');

// 构造一个 10 字节的内存"记录"：[2 字节魔数][2 字节数量][6 字节数据]
const record = new ArrayBuffer(10);
const dv = new DataView(record);
const body = new Uint8Array(record, 4, 6); // 后 6 字节是数据区

dv.setUint16(0, 0xbeef, false); // 大端写入魔数
dv.setUint16(2, 6, true); // 小端写入"数据长度 = 6"
body.set([0x41, 0x42, 0x43, 0x44, 0x45, 0x46]); // "ABCDEF"

console.log('整条记录 =', hex(new Uint8Array(record)));

// 解析时各用各的视图：头部用 DataView（要控制字节序），数据体用 Uint8Array。
console.log('魔数（大端读）= 0x' + dv.getUint16(0, false).toString(16));
console.log('长度（小端读）=', dv.getUint16(2, true));
console.log(
  '数据体字符串 =',
  String.fromCharCode(...body),
);
// 数据区也可以整体转成字符串：String.fromCharCode 支持展开一个定型数组。
console.log('  -> 两者都指向同一块内存，但各司其职');

console.log('--- 7. detached 缓冲区：内存被"转移"走了 ---');

// 结构化克隆时可以指定 transfer，把内存的所有权交出去；
// 转移之后原 ArrayBuffer 的 byteLength 会变成 0，称为 "detached"。
const detachable = new ArrayBuffer(8);
console.log('转移前 byteLength =', detachable.byteLength, ', detached =', detachable.detached);

const moved = structuredClone(detachable, { transfer: [detachable] });
console.log('转移后：原 buffer.byteLength =', detachable.byteLength, ', detached =', detachable.detached);
console.log('新 buffer.byteLength =', moved.byteLength, '（内存还活着，只是换了主人）');

try {
  new Uint8Array(detachable);
} catch (err) {
  console.log('给 detached 缓冲区建视图：', err.constructor.name, '-', err.message);
}

console.log('\n全部演示完毕。');
