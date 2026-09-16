/**
 * ============================================================================
 * 知识点：DataView —— 读写多字节数值与字节序（大端 / 小端）
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/01_arraybuffer_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    DataView 是 ArrayBuffer 的另一种视图（另一种"解读内存的方式"）。
 *    与 Uint8Array 这类定型数组不同，DataView 提供的是"方法式"的读写接口：
 *      dv.getUint16(offset, littleEndian)  从第 offset 字节开始读 2 字节
 *      dv.setInt32(offset, value, littleEndian)
 *    它最特别的能力是：**可以在任意字节偏移处读写任意宽度的数值**，
 *    并且可以逐次调用地指定字节序。
 *
 * 2. 为什么需要
 *    网络协议（TCP/IP、DNS、PNG、ZIP）里，一个字段可能是 2 字节、4 字节，
 *    而且往往不是按 2/4/8 字节对齐的。例如一个报文头：
 *      偏移 0  ：1 字节版本号
 *      偏移 1  ：2 字节标志位
 *      偏移 3  ：4 字节长度     <- 偏移 3 不是 4 的倍数，定型数组读不了
 *    定型数组要求偏移必须是元素大小的整数倍，DataView 没有这个限制，
 *    所以它是"解析二进制格式"的首选工具。
 *
 * 3. 核心语法要点
 *    - new DataView(buffer)                 整个缓冲区
 *      new DataView(buffer, byteOffset, byteLength)  只覆盖其中一段
 *    - 读：getInt8 / getUint8 / getInt16 / getUint16 / getInt32 / getUint32 /
 *          getFloat32 / getFloat64 / getBigInt64 / getBigUint64
 *    - 写：set + 同样的类型名，第一个参数是偏移，第二个是要写入的值
 *    - 所有多字节方法最后一个参数是 littleEndian 布尔值：
 *        false 或不传 -> 大端序（Big-Endian，高位字节在低地址）
 *        true         -> 小端序（Little-Endian，低位字节在低地址）
 *    - byteOffset / byteLength 属性描述这个视图覆盖的范围。
 *
 * 4. 常见陷阱
 *    - 默认是"大端序"！这与定型数组的行为相反（定型数组用平台字节序，PC 上是小端），
 *      忘记传 true 会读出一堆莫名其妙的数。
 *    - 越界读写会抛 RangeError（这点比定型数组的"静默丢弃"友好）。
 *    - getUint8 读出来的永远是 0~255 的正数；要读负数得用 getInt8。
 *    - Float 的二进制表示是 IEEE 754，不是简单的整数拼接，不能靠肉眼推。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/02_dataview.js
 *
 * 【预期输出】
 *   打印同一段内存在大端/小端两种解读下的字节布局与数值差异。
 * ============================================================================
 */

// 小工具：把视图覆盖的字节打印成 "aa bb cc" 形式的十六进制串。
const toHex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');

// 小工具：数字用固定宽度的十六进制显示，方便和字节布局对照。
const hex = (n, width) => '0x' + n.toString(16).toUpperCase().padStart(width, '0');

console.log('--- 1. 创建 DataView ---');

// 准备 24 字节内存，足够演示各种宽度（最宽的 BigInt64 要占 8 字节）。
const buffer = new ArrayBuffer(24);

// 最简单：覆盖整个缓冲区。
const dv = new DataView(buffer);
console.log('dv.buffer === buffer ?', dv.buffer === buffer);
console.log('dv.byteOffset =', dv.byteOffset, ', dv.byteLength =', dv.byteLength);

// 也可以只覆盖其中一段：从第 4 字节开始、长度 8。
// 注意：这个视图内部的下标 0 对应的是整个缓冲区的第 4 字节。
const partial = new DataView(buffer, 4, 8);
console.log('partial.byteOffset =', partial.byteOffset, ', partial.byteLength =', partial.byteLength);

// partial 写 offset 0，实际落到 buffer 的第 4 个字节。
partial.setUint8(0, 0xee);
console.log('partial.setUint8(0, 0xee) 之后整个缓冲区 =', toHex(new Uint8Array(buffer)));

console.log('--- 2. 各种宽度数值的读写 ---');

// 从头来，先把内存清零，避免上面的 0xee 干扰。
new Uint8Array(buffer).fill(0);

// 注意：DataView 的下标单位始终是"字节"，不是"元素"。
// 这跟定型数组不同（Uint16Array 的下标单位是 2 字节）。
dv.setUint8(0, 255); // 1 字节无符号：0 ~ 255
dv.setInt8(1, -1); // 1 字节有符号：-128 ~ 127
dv.setUint16(2, 0x1234); // 2 字节无符号
dv.setInt32(4, -2); // 4 字节有符号
dv.setFloat32(8, 3.5); // 4 字节单精度浮点
dv.setBigInt64(12, -1n); // 8 字节大整数（要传 BigInt）

console.log('内存布局（共 %d 字节）=', buffer.byteLength, toHex(new Uint8Array(buffer)));

// 逐字段读回来，验证一致。多字节字段不传第三个参数就是大端序。
console.log('getUint8 (0)   =', dv.getUint8(0));
console.log('getInt8 (1)    =', dv.getInt8(1));
console.log('getUint16(2)   =', hex(dv.getUint16(2), 4), '=', dv.getUint16(2));
console.log('getInt32 (4)   =', hex(dv.getInt32(4) >>> 0, 8), '=', dv.getInt32(4));
console.log('getFloat32(8)  =', dv.getFloat32(8));
console.log('getBigInt64(12)=', dv.getBigInt64(12).toString());

console.log('--- 3. 有符号 vs 无符号：同一串位，两种解释 ---');

// 第 0 字节被写成了 255（二进制 1111 1111）。
// 无符号解释：255；有符号解释：-1。位模式完全相同，只是最高位算不算符号位。
console.log('第 0 字节 getUint8 =', dv.getUint8(0));
console.log('第 0 字节 getInt8  =', dv.getInt8(0));
console.log('第 1 字节 getUint8 =', dv.getUint8(1), '（-1 被当作无符号读就变成 255）');
console.log('第 1 字节 getInt8  =', dv.getInt8(1));

console.log('--- 4. 字节序：大端与小端（本章最重要的概念） ---');

// 拿一个一眼能认出来的数：0x12345678
// 它由 4 个字节构成，从高位到低位依次是 12、34、56、78。
const VALUE = 0x12345678;

// 清空内存重新开始。
new Uint8Array(buffer).fill(0);

// 第 4 个参数不传 => 大端序（Big-Endian）：高位字节放在低地址。
// 内存里就是从低地址到高地址依次写 12 34 56 78，和书写顺序一致。
dv.setUint32(0, VALUE, false);
console.log('大端写入 0x12345678 后的内存 =', toHex(new Uint8Array(buffer, 0, 4)));

// 第 4 个参数传 true => 小端序（Little-Endian）：低位字节放在低地址。
// 内存里变成 78 56 34 12，跟书写顺序正好相反。
new Uint8Array(buffer).fill(0);
dv.setUint32(0, VALUE, true);
console.log('小端写入 0x12345678 后的内存 =', toHex(new Uint8Array(buffer, 0, 4)));

console.log('  -> 大端 = 高位字节在前（12 34 56 78），人类阅读顺序');
console.log('  -> 小端 = 低位字节在前（78 56 34 12），x86/ARM 等主流 CPU 的默认顺序');

console.log('--- 5. 用错字节序会读出什么 ---');

// 现在内存里是小端序的 78 56 34 12。
// 如果按大端去读，读到的就是 0x78563412 —— 一个完全不同但"看起来合理"的数，
// 这正是字节序 bug 最难查的地方。
console.log('小端写入后，按小端读 =', hex(dv.getUint32(0, true), 8), '（正确）');
console.log('小端写入后，按大端读 =', hex(dv.getUint32(0, false), 8), '（错误但不会报错）');

// 0x78563412 十进制是 2018915858，与原值 305419896 差了十万八千里。
console.log('  原值十进制 =', VALUE, '，误读值十进制 =', dv.getUint32(0, false));

console.log('--- 6. 一次读写两个字段：字节序只影响多字节字段 ---');

new Uint8Array(buffer).fill(0);

// 模拟一个小报文头：[1 字节版本][2 字节长度][小端 4 字节时间戳]
dv.setUint8(0, 2);
dv.setUint16(1, 0x0102, false); // 大端
dv.setUint32(3, 0x0a0b0c0d, true); // 小端，且偏移 3 不是 4 的倍数
console.log('报文头内存 =', toHex(new Uint8Array(buffer, 0, 7)));

// 读回来：每个字段用什么字节序写的，就得用什么字节序读。
console.log('版本      =', dv.getUint8(0), '（单字节，无字节序问题）');
console.log('长度      =', hex(dv.getUint16(1, false), 4), '（大端写入，大端读出）');
console.log('时间戳    =', hex(dv.getUint32(3, true), 8), '（小端写入，小端读出）');
console.log('  -> 注意偏移 3 这个位置：定型数组无法在这里读 4 字节，DataView 可以');

console.log('--- 7. 与定型数组对比：对齐全解析 ---');

// 定型数组要求"字节偏移必须是元素大小的整数倍"，否则抛 RangeError。
try {
  // 试图从第 1 个字节开始，按 4 字节一组解读（元素大小 4，偏移 1 不是 4 的倍数）。
  const misaligned = new Uint32Array(buffer, 1, 2);
  console.log('不该走到这里：', misaligned.length);
} catch (err) {
  console.log('定型数组非对齐偏移：', err.constructor.name, '-', err.message);
}

// DataView 没有对齐要求，任意偏移都可以。
console.log('DataView 在偏移 3 读 4 字节 =', hex(dv.getUint32(3, true), 8), '（允许）');
console.log('DataView 在偏移 15 读 1 字节 =', dv.getUint8(15), '（允许）');

// 但 DataView 一样有边界检查：越界会抛 RangeError。
try {
  dv.getUint32(22); // 22 + 4 = 26 > 24，越界
} catch (err) {
  console.log('DataView 越界读：', err.constructor.name, '-', err.message);
}

console.log('--- 8. 单精度浮点的内存长什么样 ---');

new Uint8Array(buffer).fill(0);

// 1.0 的 IEEE 754 单精度表示：符号 0，指数 01111111，尾数全 0
// 拼起来是 00111111 10000000 00000000 00000000 = 0x3F800000
dv.setFloat32(0, 1.0, false);
console.log('1.0  的大端内存 =', toHex(new Uint8Array(buffer, 0, 4)), '（就是 0x3F800000）');

new Uint8Array(buffer).fill(0);
// -2.0：符号位变 1 => 0xC0000000
dv.setFloat32(0, -2.0, false);
console.log('-2.0 的大端内存 =', toHex(new Uint8Array(buffer, 0, 4)), '（就是 0xC0000000）');

new Uint8Array(buffer).fill(0);
// 0.1 无法用二进制精确表示，尾数会是长长一串 —— 这也是 0.1+0.2 !== 0.3 的根源。
dv.setFloat64(0, 0.1, false);
console.log('0.1  的双精度内存 =', toHex(new Uint8Array(buffer, 0, 8)));

console.log('--- 9. 探测当前平台的字节序 ---');

// 写一个 2 字节整数 1（大端是 00 01，小端是 01 00），看第一个字节就知道。
new Uint8Array(buffer).fill(0);
dv.setUint16(0, 1, true);
const platformLittleEndian = new Uint8Array(buffer)[0] === 1;
console.log('本机是小端序吗？', platformLittleEndian);
console.log('（可以用 new Uint16Array(buffer)[0] 直接取平台序，这就是定型数组的行为）');

console.log('\n全部演示完毕。');
