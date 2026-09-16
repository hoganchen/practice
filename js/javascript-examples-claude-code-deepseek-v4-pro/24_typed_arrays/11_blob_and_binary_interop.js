/**
 * ============================================================================
 * 知识点：Blob / File 与二进制数据的互转 —— 附完整的类型转换矩阵
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/01_arraybuffer_basics.js、24_typed_arrays/07_node_buffer.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Blob（Binary Large Object，二进制大对象）是 Web 平台对"一块不可变的
 *    二进制数据 + 一个 MIME 类型"的抽象。它有三个关键特征：
 *      - **不可变**：创建后内容与 type 都不能再改，只能整体替换；
 *      - **异步读取**：内容可能在磁盘上（浏览器会把大 Blob 落盘），
 *        所以取内容的方法（arrayBuffer / text / bytes）都返回 Promise；
 *      - **有类型**：`type` 字段是一个 MIME 字符串，用于告诉消费方
 *        "这是什么格式的数据"。
 *    它是 fetch / FormData / File / Response / URL.createObjectURL
 *    这些 API 之间传递二进制数据的**通用货币**。
 *
 *    File 是 Blob 的**子类**，只多了三个元数据字段：name、lastModified、
 *    （浏览器里还有 webkitRelativePath）。所以凡是接受 Blob 的地方，
 *    传 File 都可以 —— 反过来不行。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 文件上传：`<input type="file">` 拿到的就是 File，
 *      `fetch(url, { body: file })` 或塞进 FormData 直接上传。
 *    - 分片上传 / 断点续传：用 `blob.slice(start, end)` 把大文件切成块，
 *      逐块上传，失败只重传那一块。
 *    - 图片预览：`URL.createObjectURL(file)` 生成一个临时 URL 喂给 `<img>`，
 *      比 FileReader.readAsDataURL 快得多，也不占内存（不生成 base64 字符串）。
 *    - 下载文件（前端生成）：把内存里的字节包成 Blob，
 *      配 `URL.createObjectURL` + `<a download>` 直接触发下载。
 *    - 在 Node 侧：Blob 是全局可用的（Node 18+），
 *      `new Response(blob)`、`blob.stream()` 让"内存数据"和"网络流"
 *      能无缝互换，写同构代码（浏览器/Node 共用）时特别有用。
 *
 * 3. 核心语法要点
 *    - 构造：`new Blob(parts, options)`
 *        parts  是 **BlobPart 数组**，元素可以是：
 *                 string（按 UTF-8 编码）、ArrayBuffer、ArrayBufferView
 *                 （Uint8Array / DataView / Buffer 都算）、另一个 Blob；
 *                 字符串与二进制可以混着放，会按顺序拼接。
 *        options `{ type: 'image/png' }`，会被**转成小写**。
 *    - 读取：三个异步方法 + 一个流
 *        await blob.arrayBuffer()  -> ArrayBuffer
 *        await blob.text()         -> string（按 UTF-8 解码）
 *        await blob.bytes()        -> Uint8Array（Node 19+ / 新浏览器）
 *        blob.stream()             -> ReadableStream<Uint8Array>
 *    - 切片：`blob.slice(start, end, contentType)`，语义同 Array.prototype.slice，
 *      支持负数下标，返回**新的 Blob**（不复制底层数据，是视图）。
 *    - 临时 URL：`URL.createObjectURL(blob)` 得到一个形如 `blob:nodedata:...`
 *      的字符串 URL；用完必须 `URL.revokeObjectURL(url)`。
 *
 * 4. 常见陷阱
 *    - **忘记 revokeObjectURL 导致内存泄漏**：这个 URL 会在运行时的注册表里
 *      持有 Blob 的强引用，不撤销就永远不会被 GC 回收。这是最经典的一条。
 *    - 以为 Blob 是"零拷贝视图"：`new Blob([u8])` 会把字节**拷贝**进 Blob，
 *      之后改 u8 不会影响 Blob（这是好事，避免了竞态）。
 *    - `u8.buffer` 不等于"u8 的字节"：如果一个 Uint8Array 是某个大
 *      ArrayBuffer 的子视图，`.buffer` 返回的是**整个**底层缓冲区。
 *      要精确取视图范围，得用 `u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)`。
 *    - `blob.text()` 对非 UTF-8 字节不报错，而是插入 U+FFFD 替换字符，
 *      数据被"静默损坏"，二进制数据千万别用 text() 读。
 *    - `blob.slice()` 不带第三个参数时 type 会被清空（在各运行时中的表现
 *      略有差异），分片后还要保留 MIME 类型就必须显式传。
 *    - File 的 name / lastModified 是**只读**的，赋值会被静默忽略
 *      （严格模式下抛 TypeError），想改名只能重新 new 一个 File。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/11_blob_and_binary_interop.js
 *
 * 【预期输出】
 *   打印 Blob 的构造、size/type 特性、读取方式、切片、File 的继承关系、
 *   createObjectURL 的内存占用实证，以及一张完整的类型互转矩阵。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 环境能力检测与兼容垫片
// ---------------------------------------------------------------------------

// Node 18+ 把 Blob 暴露为全局对象；File 在 Node 20+ 才是全局的，
// 更早的版本要 `import { File } from 'node:buffer'`。
// 浏览器里两者都是全局的。为了兼容，这里优先用全局对象，取不到再回落到 node:buffer。
const nodeBufferModule = await import('node:buffer');

const BlobClass = typeof Blob === 'function' ? Blob : nodeBufferModule.Blob;
const FileClass = typeof File === 'function' ? File : nodeBufferModule.File;

const HAS_CREATE_OBJECT_URL = typeof URL.createObjectURL === 'function';
const HAS_REVOKE_OBJECT_URL = typeof URL.revokeObjectURL === 'function';
const HAS_BLOB_STREAM = typeof BlobClass.prototype.stream === 'function';

// ---------------------------------------------------------------------------
// 1. 工具函数
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** 字节数组转十六进制字符串 */
function hex(bytes, max = 24) {
  const shown = Array.from(bytes.subarray(0, Math.min(max, bytes.length)), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join(' ');
  return bytes.length > max ? `${shown} ...` : shown;
}

function bytesEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

let checkPass = 0;
let checkFail = 0;

/** 稳定结论检查：只打印不抛错，保证脚本始终以退出码 0 结束。 */
function check(label, condition) {
  if (condition) {
    checkPass += 1;
    console.log(`  [通过] ${label}`);
  } else {
    checkFail += 1;
    console.log(`  [未通过] ${label}`);
  }
}

// ---------------------------------------------------------------------------
// 2. 主流程
// ---------------------------------------------------------------------------

async function main() {
  console.log('================ Blob / File 与二进制数据的互转 ================\n');

  // -------------------------------------------------------------------------
  console.log('--- 1. 环境能力检测 ---');
  // -------------------------------------------------------------------------
  console.log(`  Blob                       : ${typeof Blob === 'function' ? '全局可用' : '来自 node:buffer'}`);
  console.log(`  File                       : ${typeof File === 'function' ? '全局可用' : '来自 node:buffer'}`);
  console.log(`  Blob.prototype.stream()    : ${HAS_BLOB_STREAM ? '可用' : '不可用'}`);
  console.log(`  Blob.prototype.bytes()     : ${typeof BlobClass.prototype.bytes === 'function' ? '可用' : '不可用'}`);
  console.log(`  URL.createObjectURL()      : ${HAS_CREATE_OBJECT_URL ? '可用' : '不可用'}`);
  console.log(`  URL.revokeObjectURL()      : ${HAS_REVOKE_OBJECT_URL ? '可用' : '不可用'}`);
  console.log(`  当前 Node 版本             : ${process.version}`);
  if (!HAS_CREATE_OBJECT_URL) {
    console.log('  说明：本环境不支持 createObjectURL，第 8 节将显示降级说明。');
    console.log('       降级方案：改用 `await blob.arrayBuffer()` 拿到字节自行处理。');
  }

  // -------------------------------------------------------------------------
  console.log('\n--- 2. 构造 Blob：BlobPart 可以是什么 ---');
  // -------------------------------------------------------------------------
  const rawBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG 魔数
  const rawBuffer = new Uint8Array([0xca, 0xfe, 0xba, 0xbe]).buffer;
  const dataView = new DataView(new Uint8Array([0x12, 0x34, 0x56, 0x78]).buffer);

  const fromString = new BlobClass(['PNG:']);
  const fromUint8 = new BlobClass([rawBytes]);
  const fromArrayBuffer = new BlobClass([rawBuffer]);
  const fromDataView = new BlobClass([dataView]);
  const fromBuffer = new BlobClass([Buffer.from([0xde, 0xad, 0xbe, 0xef])]);
  const fromBlob = new BlobClass([fromUint8]); // 嵌套 Blob：内容会被展开拼接
  // 混合拼接：字符串 + 定型数组 + ArrayBuffer，按数组顺序首尾相接
  const mixed = new BlobClass(['PNG:', rawBytes, rawBuffer]);

  console.log(`  new Blob(['PNG:'])              -> ${fromString.size} 字节  内容 "${await fromString.text()}"`);
  console.log(`  new Blob([Uint8Array])          -> ${fromUint8.size} 字节  ${hex(new Uint8Array(await fromUint8.arrayBuffer()))}`);
  console.log(`  new Blob([ArrayBuffer])         -> ${fromArrayBuffer.size} 字节  ${hex(new Uint8Array(await fromArrayBuffer.arrayBuffer()))}`);
  console.log(`  new Blob([DataView])            -> ${fromDataView.size} 字节  ${hex(new Uint8Array(await fromDataView.arrayBuffer()))}`);
  console.log(`  new Blob([Buffer])              -> ${fromBuffer.size} 字节  ${hex(new Uint8Array(await fromBuffer.arrayBuffer()))}`);
  console.log(`  new Blob([blob]) 嵌套展开       -> ${fromBlob.size} 字节（与内层 Blob 等长）`);
  console.log(`  new Blob(['PNG:', u8, ab]) 混合 -> ${mixed.size} 字节  ${hex(new Uint8Array(await mixed.arrayBuffer()))}`);

  check('字符串按 UTF-8 编码：4 个 ASCII 字符 = 4 字节', fromString.size === 4);
  check('内层 Blob 被展开而不是当成 opaque 对象', fromBlob.size === rawBytes.byteLength);
  check('混合拼接长度为各部分之和', mixed.size === 4 + rawBytes.byteLength + 4);

  // 中文在 UTF-8 里占 3 字节，所以 Blob.size 数的是**字节**不是字符。
  const chinese = new BlobClass(['二进制']);
  console.log(`  new Blob(['二进制'])             -> ${chinese.size} 字节（3 个汉字 x 3 字节，size 数的是字节不是字符）`);
  check('汉字按 UTF-8 编码为 3 字节/字', chinese.size === 9);

  // -------------------------------------------------------------------------
  console.log('\n--- 3. size 与 type（MIME） ---');
  // -------------------------------------------------------------------------
  const typed = new BlobClass([rawBytes], { type: 'Image/PNG' });
  console.log(`  size = ${typed.size}`);
  console.log(`  type = "${typed.type}"  <- 传入的 "Image/PNG" 被自动转成小写`);
  const noType = new BlobClass([rawBytes]);
  console.log(`  不传 options 时 type = "${noType.type}"（空字符串，而不是 undefined）`);

  // type 一旦创建就不能改：它不是可写属性。
  try {
    typed.type = 'text/plain';
    console.log(`  尝试 typed.type = 'text/plain' 之后，type 仍是 "${typed.type}"`);
  } catch (err) {
    console.log(`  尝试改写 type 抛出: ${err.constructor.name} - ${err.message}`);
  }
  check('type 被规范化为小写', typed.type === 'image/png');
  check('未指定 type 时为空字符串', noType.type === '');
  check('type 不可被改写（内容不可变）', typed.type === 'image/png');
  console.log('  为什么要小写？因为 MIME 类型按 RFC 是大小写不敏感的，统一下来才好比较。');

  // -------------------------------------------------------------------------
  console.log('\n--- 4. Blob 是"快照"：构造时会拷贝字节 ---');
  // -------------------------------------------------------------------------
  const source = new Uint8Array([1, 2, 3, 4, 5]);
  const snapshot = new BlobClass([source]);
  source[0] = 99; // 改源数组
  const snapshotBytes = new Uint8Array(await snapshot.arrayBuffer());
  console.log(`  构造前源数组: ${hex(new Uint8Array([1, 2, 3, 4, 5]))}`);
  console.log(`  构造后把 source[0] 改成 99`);
  console.log(`  Blob 里读出来: ${hex(snapshotBytes)}`);
  check('Blob 内容不受源数组后续修改影响（拷贝语义）', snapshotBytes[0] === 1);
  console.log('  这一点和 TypedArray 的"共享内存视图"完全相反：');
  console.log('  Blob 是拷贝，TypedArray 是视图。理解这个区别能避免大量诡异 bug。');

  // 反过来，用 subarray 视图构造 Blob 时，只取视图覆盖的那一段。
  const base = new Uint8Array([0xaa, 0xbb, 0xcc, 0xdd, 0xee]);
  const view = base.subarray(1, 4); // 覆盖 0xbb 0xcc 0xdd
  const viewBlob = new BlobClass([view]);
  console.log(`\n  完整数组 ${hex(base)} 的 subarray(1,4) = ${hex(view)}`);
  console.log(`  用该视图构造的 Blob 只有 ${viewBlob.size} 字节: ${hex(new Uint8Array(await viewBlob.arrayBuffer()))}`);
  check('用子视图构造 Blob 时只取视图范围', viewBlob.size === 3);

  // -------------------------------------------------------------------------
  console.log('\n--- 5. 读取 Blob 的四种方式 ---');
  // -------------------------------------------------------------------------
  const textBlob = new BlobClass(['Hello, 世界'], { type: 'text/plain;charset=utf-8' });

  const asText = await textBlob.text();
  const asBuffer = await textBlob.arrayBuffer(); // ArrayBuffer
  const asBytes = typeof textBlob.bytes === 'function' ? await textBlob.bytes() : new Uint8Array(asBuffer);
  const asBufferLe = Buffer.from(asBuffer); // 转成 Buffer 后更好看字节

  console.log(`  1) await blob.text()        -> "${asText}"`);
  console.log(`  2) await blob.arrayBuffer() -> ArrayBuffer(${asBuffer.byteLength})  ${hex(new Uint8Array(asBuffer))}`);
  console.log(`  3) await blob.bytes()       -> ${asBytes.constructor.name}(${asBytes.length})  ${hex(asBytes)}`);
  console.log(`  4) blob.stream()            -> 见下方分块读取`);
  console.log(`  Buffer 视角（十六进制）      : ${asBufferLe.toString('hex').replace(/(..)/g, '$1 ').trim()}`);

  check('text() 返回原始字符串', asText === 'Hello, 世界');
  check('arrayBuffer().byteLength 等于 blob.size', asBuffer.byteLength === textBlob.size);
  check('bytes() 返回 Uint8Array 且内容一致', asBytes instanceof Uint8Array && bytesEqual(asBytes, new Uint8Array(asBuffer)));

  // 用 stream() 分块读取：大 Blob 不需要一次性读进内存。
  if (HAS_BLOB_STREAM) {
    const reader = textBlob.stream().getReader();
    const chunks = [];
    let total = 0;
    // 循环直到 done 为 true
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      total += value.byteLength;
    }
    console.log(`\n  stream() 分块读取：拿到 ${chunks.length} 个 chunk，合计 ${total} 字节`);
    console.log('  （数据很小所以只切出 1 块；换成几百 MB 的 Blob 就会持续产出多块，');
    console.log('    配合 for await (const chunk of blob.stream()) 可以恒内存处理。）');
    // 把各个 chunk 拼回一整块
    const joined = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      joined.set(chunk, offset);
      offset += chunk.byteLength;
    }
    check('流式读取拼接后与整体读取一致', bytesEqual(joined, new Uint8Array(asBuffer)));
    console.log('  Blob.stream() 是关键：它让"内存中的二进制"和"网络流"可以互相替换。');
  }

  // -------------------------------------------------------------------------
  console.log('\n--- 6. slice：切片与"分片上传"的完整思路 ---');
  // -------------------------------------------------------------------------
  const fileLike = new BlobClass([new Uint8Array(1000).map((_, i) => i % 256)], {
    type: 'application/octet-stream',
  });
  console.log(`  假设有一个 ${fileLike.size} 字节的 Blob，type = "${fileLike.type}"`);

  const head = fileLike.slice(0, 4);
  const tail = fileLike.slice(-4); // 负数下标：从末尾数
  console.log(`  slice(0, 4)   -> ${head.size} 字节  ${hex(new Uint8Array(await head.arrayBuffer()))}`);
  console.log(`  slice(-4)     -> ${tail.size} 字节  ${hex(new Uint8Array(await tail.arrayBuffer()))}`);
  console.log(`  slice 后 type = "${head.type}"  <- 不带第三个参数时 type 被清空`);
  const headTyped = fileLike.slice(0, 4, 'application/octet-stream');
  console.log(`  slice(0, 4, 'application/octet-stream') 后 type = "${headTyped.type}"`);
  check('slice 取出的长度正确', head.size === 4 && tail.size === 4);
  check('显式传 contentType 时 type 被保留', headTyped.type === 'application/octet-stream');

  // 验证切片的拼接等价于原数据 —— 这是分片上传的正确性基础。
  const CHUNK = 256;
  const parts = [];
  for (let start = 0; start < fileLike.size; start += CHUNK) {
    parts.push(fileLike.slice(start, Math.min(start + CHUNK, fileLike.size)));
  }
  const reassembled = new BlobClass(parts);
  const originalBytes = new Uint8Array(await fileLike.arrayBuffer());
  const reassembledBytes = new Uint8Array(await reassembled.arrayBuffer());
  console.log(`\n  按 ${CHUNK} 字节切成 ${parts.length} 片，再把它们 new Blob(parts) 拼回来`);
  console.log(`  拼回后大小 = ${reassembled.size} 字节`);
  check('所有分片重新拼接后与原数据逐字节相同', bytesEqual(reassembledBytes, originalBytes));

  console.log('  分片上传的完整流程（真实项目里的写法）：');
  console.log('    1. 计算分片数：Math.ceil(file.size / CHUNK_SIZE)');
  console.log('    2. 逐片取 blob.slice(i * CHUNK, (i + 1) * CHUNK)');
  console.log('    3. 每片塞进 FormData（带 index / total / fileId），POST 给服务端；');
  console.log('    4. 服务端按 index 落盘或暂存，收齐后合并并校验整体哈希；');
  console.log('    5. 失败只重传那一片 —— 这就是"断点续传"的本质。');
  console.log('  额外好处：slice 出来的分片在规范上"引用同一份底层字节"，不是真的拷贝 N 份 ——');
  console.log('         所以切 1000 片也不会让内存翻 1000 倍（实现可能惰性处理，但语义如此）。');

  // -------------------------------------------------------------------------
  console.log('\n--- 7. File：给 Blob 加上"文件元数据" ---');
  // -------------------------------------------------------------------------
  const file = new FileClass([new Uint8Array([1, 2, 3, 4])], 'photo.png', {
    type: 'image/png',
    lastModified: 1755300000000,
  });
  console.log(`  file.name          = "${file.name}"`);
  console.log(`  file.type          = "${file.type}"`);
  console.log(`  file.size          = ${file.size}`);
  console.log(`  file.lastModified  = ${file.lastModified} （Unix 毫秒时间戳）`);
  console.log(`  file instanceof Blob = ${file instanceof BlobClass}  <- File 继承自 Blob`);
  check('File 是 Blob 的实例', file instanceof BlobClass);
  check('File 继承来的 size/type 可直接用', file.size === 4 && file.type === 'image/png');

  // 只读属性：赋值会被静默忽略（严格模式下 TypeError）。
  const nameBefore = file.name;
  try {
    file.name = 'hacked.png';
    console.log(`\n  尝试 file.name = 'hacked.png' 之后，name 仍是 "${file.name}"`);
  } catch (err) {
    console.log(`\n  尝试改写 name 抛出: ${err.constructor.name}（ESM 模块默认是严格模式）`);
  }
  check('File.name 只读，无法被改写', file.name === nameBefore);
  console.log('  想"改名"只有一个办法：new File([file], "新名字", { type: file.type })。');

  // File 既然继承自 Blob，那么所有 Blob 的能力它都有。
  const fileText = new FileClass(['你好，文件'], 'greeting.txt', { type: 'text/plain' });
  console.log(`\n  File 也能 text(): "${await fileText.text()}"，也能 slice(): ${fileText.slice(0, 3).size} 字节（按字节切，会切断多字节字符）`);
  console.log('  注意 slice 是按**字节**切的，切在 UTF-8 多字节字符中间会产生非法序列 ——');
  console.log('  这也是 blob.text() 会插入 U+FFFD 替换字符的原因（见第 10 节陷阱）。');

  // -------------------------------------------------------------------------
  console.log('\n--- 8. URL.createObjectURL 与"必须 revoke"的内存问题 ---');
  // -------------------------------------------------------------------------
  if (HAS_CREATE_OBJECT_URL) {
    const demoBlob = new BlobClass(['临时内容'], { type: 'text/plain' });
    const demoUrl = URL.createObjectURL(demoBlob);
    console.log(`  URL.createObjectURL(blob) -> "${demoUrl}"`);
    console.log('  这个字符串是一个"句柄"，任何拿到它的地方都能读到那块字节。');
    console.log('  典型用途：<img src={url}>、<a href={url} download>、fetch(url)、video.src');

    // Node 的 fetch 也能直接消费 blob: URL（浏览器里同样可行）。
    const resp = await fetch(demoUrl);
    console.log(`  fetch(该 URL) -> HTTP ${resp.status}，内容 "${await resp.text()}"`);

    if (HAS_REVOKE_OBJECT_URL) {
      URL.revokeObjectURL(demoUrl);
      console.log('  调用 URL.revokeObjectURL(url) 之后，这个句柄就失效了。');
      try {
        await fetch(demoUrl);
        console.log('  （该运行时在 revoke 后仍能读到内容，说明撤销是"解除引用"而非立即销毁）');
      } catch (err) {
        console.log(`  revoke 后再 fetch 抛出: ${err.constructor.name} - ${err.message.slice(0, 60)}`);
      }
    }

    // 内存实证：Blob 的数据不在 V8 堆上，而在外部（external）内存里。
    // 如果 createObjectURL 之后不 revoke，注册表会一直持有强引用，外部内存只增不减。
    const LEAK_COUNT = 120;
    const LEAK_SIZE = 128 * 1024;
    const before = process.memoryUsage();
    const leaked = [];
    for (let i = 0; i < LEAK_COUNT; i += 1) {
      leaked.push(URL.createObjectURL(new BlobClass([new Uint8Array(LEAK_SIZE)])));
    }
    const after = process.memoryUsage();
    const extDeltaKB = (after.external - before.external) / 1024;
    const heapDeltaKB = (after.heapUsed - before.heapUsed) / 1024;
    const allocatedKB = (LEAK_COUNT * LEAK_SIZE) / 1024;

    console.log(`\n  内存实证：连续创建 ${LEAK_COUNT} 个 ${LEAK_SIZE / 1024} KB 的 Blob 并各自 createObjectURL，不 revoke`);
    console.log(`    共分配            : ${allocatedKB.toFixed(0)} KB`);
    console.log(`    V8 堆增长         : ${heapDeltaKB.toFixed(0)} KB  <- 几乎没动`);
    console.log(`    外部内存增长      : ${extDeltaKB.toFixed(0)} KB  <- 几乎全在这里`);
    console.log('    结论：Blob 的字节存在 V8 堆之外（C++ 侧 / 浏览器里可能落盘），');
    console.log('          heapUsed 看不出泄漏，必须看 external —— 这正是它容易被忽视的原因。');
    check('未 revoke 的 URL 使外部内存持续增长（强引用未释放）', extDeltaKB > 1024);

    // 正确姿势：用完立刻 revoke。清理后外部内存会被回收。
    for (const url of leaked) {
      URL.revokeObjectURL(url);
    }
    console.log(`  已 revoke ${leaked.length} 个 URL，这些 Blob 现在可以被 GC 回收了。`);
    console.log('\n  正确的使用模板（务必照抄这个结构）：');
    console.log('    const url = URL.createObjectURL(blob);');
    console.log('    try {');
    console.log('      // 使用 url ...');
    console.log('    } finally {');
    console.log('      URL.revokeObjectURL(url);   // 无论成功失败都要撤销');
    console.log('    }');
    console.log('  在 React / Vue 里则放在组件卸载的清理函数（useEffect 的 return）中。');
    console.log('  经验值：图片预览、音频播放这类"用完就换"的场景，泄漏最严重 ——');
    console.log('        每次预览都新建一个 URL，一分钟就能攒出几百 MB 的僵尸 Blob。');
  } else {
    console.log('  （跳过：本环境不支持 URL.createObjectURL）');
    console.log('  降级方案：直接用 await blob.arrayBuffer() 处理字节，');
    console.log('           或改在浏览器中运行本示例。');
  }

  // -------------------------------------------------------------------------
  console.log('\n--- 9. 完整互转矩阵 ---');
  // -------------------------------------------------------------------------
  console.log('  下面把 6 种二进制载体两两互转的核心写法列全（这是最实用的一节）：\n');

  const matrix = [
    ['Uint8Array <-> ArrayBuffer', '视图: new Uint8Array(ab)  /  反向: u8.buffer（注意可能更大，见陷阱）'],
    ['ArrayBuffer <-> Uint8Array', '精确拷贝: ab.slice(u8.byteOffset, u8.byteOffset + u8.byteLength)'],
    ['Uint8Array  <-> Blob', 'new Blob([u8])  /  new Uint8Array(await blob.arrayBuffer())'],
    ['Blob        <-> ArrayBuffer', 'await blob.arrayBuffer()  /  new Blob([ab])'],
    ['Uint8Array  <-> Buffer', 'Buffer.from(u8)（拷贝）/ new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)（视图）'],
    ['Buffer      <-> Blob', 'new Blob([buf])  /  Buffer.from(await blob.arrayBuffer())'],
    ['Blob        <-> string', 'new Blob([str])（UTF-8 编码）/ await blob.text()（UTF-8 解码）'],
    ['Uint8Array  <-> Base64', "Buffer.from(u8).toString('base64')  /  Buffer.from(b64, 'base64')"],
    ['Uint8Array  <-> DataView', 'new DataView(u8.buffer, u8.byteOffset, u8.byteLength)  /  new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength)'],
  ];
  for (const [pair, how] of matrix) {
    console.log(`  ${pair}`);
    console.log(`      ${how}`);
  }

  console.log('\n  用代码实测一遍这张表里的每一条：');

  // 起点：一段字节
  const origin = encoder.encode('互转矩阵 interop');

  // 1) Uint8Array -> ArrayBuffer（精确范围）
  const ab = origin.buffer.slice(origin.byteOffset, origin.byteOffset + origin.byteLength);
  const backFromAb = new Uint8Array(ab);
  check('Uint8Array <-> ArrayBuffer 往返一致', bytesEqual(backFromAb, origin));

  // 2) Uint8Array -> Blob -> Uint8Array
  const blobFromU8 = new BlobClass([origin]);
  const u8FromBlob = new Uint8Array(await blobFromU8.arrayBuffer());
  check('Uint8Array <-> Blob 往返一致', bytesEqual(u8FromBlob, origin));

  // 3) Blob -> string -> Blob
  const strFromBlob = await blobFromU8.text();
  const blobFromStr = new BlobClass([strFromBlob]);
  check('Blob <-> string 往返一致', strFromBlob === '互转矩阵 interop' && blobFromStr.size === blobFromU8.size);
  console.log('    注意：Blob <-> string 的往返只在**文本**数据上成立。');
  console.log('    对任意二进制字节做 text() -> new Blob() 会损坏数据（第 10 节会实证）。');

  // 4) Uint8Array <-> Buffer
  const bufFromU8 = Buffer.from(origin); // 拷贝
  const u8FromBuf = new Uint8Array(bufFromU8.buffer, bufFromU8.byteOffset, bufFromU8.byteLength); // 视图，共享内存
  check('Uint8Array <-> Buffer 往返一致', bytesEqual(u8FromBuf, origin));
  console.log(`    Buffer.from(u8) 是拷贝，改 Buffer 不影响原数组：${bufFromU8[0] === origin[0]}`);
  console.log(`    而 new Uint8Array(buf.buffer, ...) 是视图，共享内存 —— 改一个另一个跟着变。`);
  const shared = new Uint8Array(bufFromU8.buffer, bufFromU8.byteOffset, bufFromU8.byteLength);
  shared[0] = 0x5a; // 改成 'Z'
  console.log(`    验证共享：改视图首字节后，Buffer 首字节 = 0x${bufFromU8[0].toString(16)}`);
  check('Uint8Array 视图与 Buffer 共享同一块内存', bufFromU8[0] === 0x5a);
  bufFromU8[0] = origin[0]; // 还原，避免影响后续断言

  // 5) Buffer -> Blob -> Buffer
  const blobFromBuf = new BlobClass([bufFromU8]);
  const bufFromBlob = Buffer.from(await blobFromBuf.arrayBuffer());
  check('Buffer <-> Blob 往返一致', bufFromBlob.equals(bufFromU8));

  // 6) Uint8Array <-> Base64
  const b64 = Buffer.from(origin).toString('base64');
  const u8FromB64 = new Uint8Array(Buffer.from(b64, 'base64'));
  console.log(`    Base64 形式: ${b64}`);
  check('Uint8Array <-> Base64 往返一致', bytesEqual(u8FromB64, origin));

  // 7) Uint8Array <-> DataView（共享内存）
  const dv = new DataView(origin.buffer, origin.byteOffset, origin.byteLength);
  const u8FromDv = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
  check('Uint8Array <-> DataView 往返一致', bytesEqual(u8FromDv, origin));
  console.log('    DataView 与 Uint8Array 也是同一块内存的两种"视角"，不产生拷贝。');

  // -------------------------------------------------------------------------
  console.log('\n--- 10. 常见陷阱实证 ---');
  // -------------------------------------------------------------------------

  // 陷阱一：u8.buffer 不等于 u8 的字节。
  const big = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
  const small = big.subarray(2, 5); // 只看 3,4,5
  console.log(`  陷阱一：u8.buffer 可能比你想要的大得多`);
  console.log(`    big    = ${hex(big)}（${big.length} 字节）`);
  console.log(`    small  = big.subarray(2, 5) = ${hex(small)}（${small.length} 字节）`);
  console.log(`    small.buffer.byteLength = ${small.buffer.byteLength}  <- 是**整个**底层缓冲区，不是 3`);
  console.log(`    正确取法: small.buffer.slice(small.byteOffset, small.byteOffset + small.byteLength)`);
  check('子视图的 .buffer 大于视图本身（陷阱成立）', small.buffer.byteLength === 8 && small.length === 3);
  const exact = small.buffer.slice(small.byteOffset, small.byteOffset + small.byteLength);
  check('用 byteOffset + byteLength 才能精确取到视图字节', bytesEqual(new Uint8Array(exact), small));

  // 陷阱二：二进制数据用 text() 读会被静默损坏。
  const binaryJunk = new Uint8Array([0xff, 0xfe, 0x41, 0x80, 0xc3]);
  const junkBlob = new BlobClass([binaryJunk], { type: 'application/octet-stream' });
  const mangled = await junkBlob.text();
  const restored = encoder.encode(mangled);
  console.log(`\n  陷阱二：用 text() 读二进制数据会静默损坏`);
  console.log(`    原始字节     : ${hex(binaryJunk)}（${binaryJunk.length} 字节）`);
  console.log(`    text() 结果  : ${JSON.stringify(mangled)}`);
  console.log(`    重新编码回来 : ${hex(restored)}（${restored.length} 字节）`);
  check('二进制数据经 text() 往返后已经变了（数据损坏）', !bytesEqual(restored, binaryJunk));
  check('非法字节被替换成 U+FFFD 替换字符', mangled.includes('�'));
  console.log('    原因：UTF-8 解码器遇到非法字节序列不会报错，而是插入 U+FFFD。');
  console.log('    教训：二进制数据一律用 arrayBuffer() / bytes()，绝不用 text()。');

  // 陷阱三：slice 按字节切，会切断多字节字符。
  const cnBlob = new BlobClass(['中文'], { type: 'text/plain' });
  const cutInMiddle = cnBlob.slice(0, 4); // '中' 是 3 字节，切 4 字节正好截断 '文' 的第 1 字节
  const cutText = await cutInMiddle.text();
  console.log(`\n  陷阱三：slice 按字节切，会切坏多字节字符`);
  console.log(`    "中文" 共 ${cnBlob.size} 字节（每个汉字 3 字节 x 2）`);
  console.log(`    slice(0, 4) 得 ${cutInMiddle.size} 字节，text() = ${JSON.stringify(cutText)}`);
  check('切在多字节字符中间会产生替换字符', cutText.includes('�'));
  console.log('    教训：文本分片必须按字符边界切，或者干脆别切文本。');

  // -------------------------------------------------------------------------
  console.log('\n--- 11. 收尾统计 ---');
  // -------------------------------------------------------------------------
  console.log(`  稳定结论检查：通过 ${checkPass} 项，未通过 ${checkFail} 项`);
  console.log('\n  一句话总结：');
  console.log('    Blob 是"不可变的二进制块 + MIME 类型 + 异步读取"，');
  console.log('    File 是"Blob + 文件名 + 修改时间"；');
  console.log('    它们和 ArrayBuffer / TypedArray / Buffer 之间的互转就那么几条，');
  console.log('    真正需要记牢的是三件事：');
  console.log('      1) Blob 构造是**拷贝**，TypedArray 之间是**视图**；');
  console.log('      2) createObjectURL 用完**必须** revokeObjectURL；');
  console.log('      3) 二进制数据永远不要用 text() 读。');
  console.log('\n全部演示完毕。');
}

main().catch((err) => {
  console.error('示例执行失败:', err);
  process.exitCode = 1;
});
