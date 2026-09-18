/**
 * ============================================================================
 * 知识点：Node.js 的 Buffer —— Uint8Array 的子类与它自带的编解码能力
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/03_typed_array_types.js 与 05_multiple_views.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Buffer 是 Node.js 早期（在 JS 还没有 ArrayBuffer 的时候）就引入的"字节数组"。
 *    ES6 之后，Buffer 被重新实现为 **Uint8Array 的子类**：
 *      Buffer.prototype.__proto__ === Uint8Array.prototype   // true
 *    所以定型数组的一切能力（下标读写、subarray、set、迭代）Buffer 都有；
 *    Buffer 在此之上额外加了一大批"二进制工具方法"：
 *    与字符串的自动转换、base64/hex 编解码、大小端整数读写、比较、拼接……
 *
 * 2. 为什么需要
 *    Node 里几乎所有 I/O 都是字节流：fs.readFile 返回 Buffer，
 *    net.Socket 的 data 事件给出 Buffer，crypto 的哈希结果也是 Buffer。
 *    直接操作定型数组要自己写编解码循环，而 Buffer 把这些常见需求做成了内置方法
 *    （例如 buf.toString('base64') 一行顶十几行手写代码）。
 *
 * 3. 核心语法要点
 *    - Buffer.alloc(size[, fill])          分配并**清零**，安全
 *    - Buffer.allocUnsafe(size)            分配但**不清零**，更快，可能残留旧内存数据
 *    - Buffer.from(string[, encoding])     从字符串编码，编码默认 'utf8'
 *    - Buffer.from(array)                  从普通数组/定型数组**复制**
 *    - Buffer.from(arrayBuffer[, off, len]) 直接**共享**那块 ArrayBuffer 的内存
 *    - Buffer.from(buffer)                 从另一个 Buffer **复制**
 *    - Buffer.concat([...])                拼接多个 Buffer
 *    - Buffer.byteLength(str[, encoding])  算字符串编码后的字节数（不真的分配）
 *    - buf.toString(encoding)              'utf8' / 'hex' / 'base64' / 'latin1' / 'base64url'
 *    - buf.slice / buf.subarray            取子视图（**共享内存**）
 *    - buf.copy(target, targetStart, ...)  复制数据到另一个 Buffer
 *    - buf.readUInt16BE / writeUInt32LE ... 大小端整数读写
 *    - buf.equals / buf.compare / buf.includes / buf.indexOf
 *
 * 4. 常见陷阱
 *    - **buf.slice() 与定型数组的 slice 语义相反**：Buffer 的 slice 返回共享内存的子视图，
 *      改副本会改原数据；Uint8Array 的 slice 则是复制。这是最著名的坑。
 *    - Buffer.allocUnsafe 不清零，可能读到进程里之前用过的内存（安全风险），
 *      只在"马上就会被整体覆盖"的性能敏感场景使用。
 *    - Buffer.from(arrayBuffer) 是共享，Buffer.from(buffer) 是复制，一字之差。
 *    - allocUnsafe 的小块内存来自共享内存池，所以它的 .buffer 往往是 8KB 的池子，
 *      byteOffset 不为 0（见第 6 节），处理 .buffer 时必须带上偏移。
 *    - new Buffer(...) 已被废弃，请用 Buffer.from / Buffer.alloc。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/07_node_buffer.js
 *
 * 【预期输出】
 *   打印 Buffer 与 Uint8Array 的关系、创建方式差异、编解码与共享/复制的区别。
 * ============================================================================
 */

// 小工具：十六进制字符串。
const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');

console.log('--- 1. Buffer 就是 Uint8Array 的子类 ---');

const buf = Buffer.from([1, 2, 3]);

console.log('buf instanceof Buffer      =', buf instanceof Buffer);
console.log('buf instanceof Uint8Array  =', buf instanceof Uint8Array, ' <- 是子类关系');
console.log('buf instanceof Array       =', buf instanceof Array);
console.log('buf.constructor.name       =', buf.constructor.name);
console.log('原型链顶端是否相同         =', Object.getPrototypeOf(Buffer.prototype) === Uint8Array.prototype);

// 所以定型数组的所有能力 Buffer 都具备。
console.log('length =', buf.length, ', byteLength =', buf.byteLength, ', byteOffset =', buf.byteOffset);
console.log('Array.from(buf) =', Array.from(buf).join(','));
// 注意一个例外：Buffer 通过 Symbol.species 覆盖了"派生子类实例"的规则，
// 所以 Buffer 的 map/filter/slice 之类的返回值仍然是 Buffer，而不是普通 Uint8Array。
const mapped = buf.map((x) => x * 2);
console.log('Buffer.prototype.map 的返回值类型 =', mapped.constructor.name, '（仍是 Buffer）');
console.log('  但它在原型链上依然是 Uint8Array =', mapped instanceof Uint8Array);
console.log('  对比：普通 Uint8Array.map 返回 =', new Uint8Array([1]).map((x) => x * 2).constructor.name);

console.log('--- 2. 三种创建方式：alloc / allocUnsafe / from ---');

// alloc：分配并清零。安全，推荐默认使用。
const safe = Buffer.alloc(4);
console.log('Buffer.alloc(4)              =', hex(safe), '（已清零）');

// alloc 可以带填充值。
console.log('Buffer.alloc(4, 0xab)        =', hex(Buffer.alloc(4, 0xab)));

// allocUnsafe：分配但不清零。可能残留该进程之前用过的内存内容 —— 所以叫 unsafe。
const unsafe = Buffer.allocUnsafe(4);
console.log('Buffer.allocUnsafe(4)        =', hex(unsafe), '（内容不确定，可能全是 0，也可能是残留数据）');
console.log('  -> 性能敏感且"马上会覆盖全部字节"时才用它，否则有信息泄露风险');

// 正确用法：创建后立刻整体写满，就没有残留问题了。
const filled = Buffer.allocUnsafe(4);
filled.fill(0x5a);
console.log('allocUnsafe 后立刻 fill(0x5a) =', hex(filled));

// from 字符串：默认按 UTF-8 编码。
const fromStr = Buffer.from('中文abc');
console.log('Buffer.from("中文abc")       长度 =', fromStr.length, '（3+3+1+1+1 字节）');
console.log('  内容 =', hex(fromStr));

// 显式指定编码也可以。
console.log('Buffer.from("abc", "latin1") =', hex(Buffer.from('abc', 'latin1')));
console.log('Buffer.from("abc", "hex")    =', hex(Buffer.from('abc', 'hex')), ' <- "abc" 按十六进制解析');

// from 数组 / 定型数组：都是复制。
const fromArray = Buffer.from([0xde, 0xad, 0xbe, 0xef]);
console.log('Buffer.from([0xde,0xad,0xbe,0xef]) =', hex(fromArray));

console.log('--- 3. 复制 vs 共享：from 的两种行为 ---');

// from(普通数组 / 定型数组 / Buffer) 一律是**复制**。
const source = Buffer.from([1, 2, 3, 4]);
const copy = Buffer.from(source);
copy[0] = 99;
console.log('Buffer.from(Buffer) 改副本后 source =', Array.from(source).join(','), '（不受影响，是复制）');

// from(arrayBuffer, byteOffset, length) 是**共享**同一块内存。
const ab = new ArrayBuffer(8);
const shared1 = Buffer.from(ab, 0, 4); // 字节 0~3
const shared2 = Buffer.from(ab, 4, 4); // 字节 4~7
shared1[0] = 0xaa;
shared2[0] = 0xbb;
console.log('两个 Buffer 共享同一 ArrayBuffer =', hex(new Uint8Array(ab)));

// 也可以从"另一个 Buffer 的 buffer"做共享视图 —— 记得带上 byteOffset。
const sliceOfPool = Buffer.from(source.buffer, source.byteOffset, source.length);
sliceOfPool[1] = 88;
console.log('共享视图改动后 source =', Array.from(source).join(','), '（被改动了）');

console.log('--- 4. 与字符串互转：toString 的各种编码 ---');

const textBuf = Buffer.from('Hello 世界');

// 默认编码是 utf8。
console.log('toString()        =', textBuf.toString());
console.log('toString("utf8")  =', textBuf.toString('utf8'));

// hex：每个字节两位十六进制，常用于日志与调试。
console.log('toString("hex")   =', textBuf.toString('hex'));

// base64：把 3 字节编码成 4 个可打印字符，体积膨胀约 1/3。
const b64 = textBuf.toString('base64');
console.log('toString("base64") =', b64);

// base64url：把 + / 换成 - _，且去掉 = 填充，适合放进 URL 与文件名。
console.log('toString("base64url") =', textBuf.toString('base64url'));

// latin1：每个字节直接当成一个码点 0~255，永远不会失败，但会丢失信息。
console.log('toString("latin1") =', JSON.stringify(textBuf.toString('latin1')));

// 反向：从各种编码解析回字符串。
console.log('Buffer.from(base64, "base64").toString() =', Buffer.from(b64, 'base64').toString());
console.log('Buffer.from(hex, "hex").toString()       =', Buffer.from(textBuf.toString('hex'), 'hex').toString());
console.log('  -> hex 与 base64 都是"往返无损"的，latin1 对中文则有损');

// 不真的分配内存，只算长度。
console.log('Buffer.byteLength("Hello 世界") =', Buffer.byteLength('Hello 世界'), '字节');

console.log('--- 5. Buffer 的 slice 是"共享"（与定型数组相反！） ---');

const original = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7]);

// Buffer.prototype.slice 返回共享内存的子视图 —— 注意这与 Uint8Array.prototype.slice 不同！
const bufSlice = original.slice(2, 5);
bufSlice[0] = 99;
console.log('buf.slice(2,5) 后改第一个元素：');
console.log('  bufSlice =', Array.from(bufSlice).join(','));
console.log('  original =', Array.from(original).join(','), ' <- 原数据被改动了（共享内存）');
console.log('  bufSlice.buffer === original.buffer ?', bufSlice.buffer === original.buffer);

// 对比：定型数组的 slice 是复制。
const u8 = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
const u8Slice = u8.slice(2, 5);
u8Slice[0] = 99;
console.log('  对比 Uint8Array.slice：原数组 =', Array.from(u8).join(','), '（不受影响，是复制）');
console.log('  -> 记牢：Buffer.slice = 共享，Uint8Array.slice = 复制');

// subarray 在两边都是共享，行为一致。
const u8Sub = u8.subarray(2, 5);
u8Sub[0] = 77;
console.log('  Uint8Array.subarray 改后原数组 =', Array.from(u8).join(','), '（共享）');

console.log('--- 6. 内存池：allocUnsafe 小块内存的来源 ---');

// Node 为了提高性能，会预先分配一个 8KB 的内存池，
// 小于 poolSize 一半的 allocUnsafe 请求都从池子里切一块出来。
const pooled = Buffer.allocUnsafe(10);
console.log('pooled.length        =', pooled.length);
console.log('pooled.byteOffset    =', pooled.byteOffset, ' <- 不为 0，说明它在池子中间');
console.log('pooled.buffer.byteLength =', pooled.buffer.byteLength, ' <- 底层是一整块大内存（默认 8KB 池）');
console.log('Buffer.poolSize      =', Buffer.poolSize, '（默认 8192 字节）');

// 先写点内容进去，方便观察"取的偏移对不对"。
pooled.fill(0xcd);
console.log('  池子前 12 字节（没带偏移，读到的是池子开头）=', hex(new Uint8Array(pooled.buffer, 0, 12)));
console.log('  正确姿势（带 byteOffset）=', hex(new Uint8Array(pooled.buffer, pooled.byteOffset, pooled.length)));
console.log('  -> 这就是为什么"共享内存"时一定要带 byteOffset：');
console.log('     只取 .buffer 会拿到整个 8KB 的池子，而不是这 10 个字节');

// 大块分配则不走池子，byteOffset 为 0。
const bigAlloc = Buffer.allocUnsafe(20000);
console.log('20000 字节的 buffer.byteLength =', bigAlloc.buffer.byteLength, ', byteOffset =', bigAlloc.byteOffset);

console.log('--- 7. concat / copy / equals / compare ---');

const a = Buffer.from('Hello ');
const b = Buffer.from('World');

// concat 把多个 Buffer 拼成一个新的（复制数据，不是共享）。
const joined = Buffer.concat([a, b]);
console.log('Buffer.concat([a, b]) =', joined.toString());

// 可以预设总长度；不够时会被截断，多出来的位置填 0。
console.log('Buffer.concat([a,b], 8) =', JSON.stringify(Buffer.concat([a, b], 8).toString()));
console.log('Buffer.concat([a,b], 20) 的字节 =', hex(Buffer.concat([a, b], 20)));

// copy：把数据复制进目标 Buffer。
const target = Buffer.alloc(11);
a.copy(target, 0); // 把 a 写到 target 的偏移 0
b.copy(target, a.length); // 把 b 接着写
console.log('用 copy 拼出来 =', target.toString());

// equals：逐个字节比较内容是否相同（不是比较引用）。
console.log('Buffer.from("abc").equals(Buffer.from("abc")) =', Buffer.from('abc').equals(Buffer.from('abc')));
console.log('Buffer.from("abc") === Buffer.from("abc")     =', Buffer.from('abc') === Buffer.from('abc'), '（不同对象）');

// compare：字典序比较，返回 -1 / 0 / 1。
console.log('Buffer.from("abc").compare(Buffer.from("abd")) =', Buffer.from('abc').compare(Buffer.from('abd')));

// includes / indexOf 在字节层面查找。
console.log('joined.includes("World") =', joined.includes('World'));
console.log('joined.indexOf("World")  =', joined.indexOf('World'));

console.log('--- 8. Buffer 自带的大小端整数读写 ---');

const nums = Buffer.alloc(8);

// 这些方法名以 BE / LE 结尾，明确指定字节序，比 DataView 更易读。
nums.writeUInt16BE(0x1234, 0); // 大端写 2 字节
nums.writeUInt16LE(0x1234, 2); // 小端写 2 字节
nums.writeInt32BE(-2, 4); // 大端写 4 字节有符号

console.log('内存 =', hex(nums));
console.log('  偏移 0 大端写 0x1234 -> 12 34');
console.log('  偏移 2 小端写 0x1234 -> 34 12');
console.log('  偏移 4 大端写 -2     -> ff ff ff fe（补码）');

console.log('readUInt16BE(0) =', '0x' + nums.readUInt16BE(0).toString(16));
console.log('readUInt16LE(2) =', '0x' + nums.readUInt16LE(2).toString(16));
console.log('readInt32BE(4)  =', nums.readInt32BE(4));

// 越界会抛 RangeError，和 DataView 一样有边界检查。
try {
  nums.writeUInt32BE(1, 6); // 6 + 4 = 10 > 8
} catch (err) {
  console.log('越界写入：', err.constructor.name, '-', err.message);
}

// 另外还有 BigInt 版本（读 64 位整数时用）。
const bigBuf = Buffer.alloc(8);
bigBuf.writeBigUInt64BE(9007199254740993n, 0); // 超出 Number 安全整数范围
console.log('readBigUInt64BE =', bigBuf.readBigUInt64BE(0).toString());

console.log('--- 9. 已废弃的 new Buffer()（只说明，不运行） ---');

// new Buffer(n) 在 Node 6 就被标记废弃，因为它会返回未清零的内存（同 allocUnsafe），
// 而且参数含义随类型变化（数字 = 长度，字符串 = 内容），极易误用。
// 现在调用它会在 stderr 打印弃用警告（DEP0005）。
// 记住替代方案即可：
//   new Buffer(10)      -> Buffer.alloc(10)
//   new Buffer('abc')   -> Buffer.from('abc')
//   new Buffer([1,2,3]) -> Buffer.from([1, 2, 3])
//   new Buffer(ab, 0, 4)-> Buffer.from(ab, 0, 4)
console.log('本文件全部使用 Buffer.alloc / Buffer.from，不使用已废弃的 new Buffer()');

console.log('\n全部演示完毕。');
