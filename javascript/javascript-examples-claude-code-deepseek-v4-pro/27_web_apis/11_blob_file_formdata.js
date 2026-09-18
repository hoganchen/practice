/**
 * ============================================================================
 * 知识点：Blob / File / FileReader / FormData —— 二进制数据的表示与传递
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】进阶
 * 【前置知识】27_web_apis/04_fetch_api.js（fetch/Request/Response）、
 *             09_objects/01_object_literal.js（对象）、
 *             19_promise/01_promise_basics.js（Promise / async-await）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - Blob（Binary Large Object，二进制大对象）是浏览器里表示"一段不可变的
 *      二进制数据 + 一个 MIME 类型"的对象。它不关心这段数据是图片、文本还是
 *      压缩包，只负责"装字节"。可以把 Blob 理解成"带类型标签的只读文件"。
 *    - File 是 Blob 的子类，额外带上 name（文件名）和 lastModified（最后修改
 *      时间戳）两个属性。用户在 <input type="file"> 里选中的文件就是 File 对象。
 *    - FileReader 是"把 Blob 读成别的东西"的早期 API：读成文本、DataURL、
 *      ArrayBuffer。它是事件式的（onload / onerror），现代代码更常用
 *      Blob 自带的 Promise 方法：text() / arrayBuffer() / stream()。
 *    - FormData 是"表单数据容器"，专门解决"一次提交里既有普通文本字段、
 *      又有文件"的需求。它被 fetch 发送时会自动编码成 multipart/form-data。
 *
 * 2. 为什么需要
 *    网页里到处是二进制：用户上传的图片、要下载的报表、Canvas 导出的图片、
 *    录音/录像的原始数据。JS 早期只有字符串，处理二进制要靠各种奇技淫巧。
 *    Blob / ArrayBuffer / TypedArray 这一套出现之后，二进制才变成"一等公民"。
 *    而 FormData 解决了文件上传这个最常见的场景——不需要你手写编码。
 *
 * 3. 核心语法要点
 *    - new Blob(parts, options)
 *        parts 是数组，元素可以是字符串、ArrayBuffer、TypedArray、其它 Blob；
 *        options.type 是 MIME 类型（如 'image/png'、'text/plain;charset=utf-8'）。
 *    - blob.size / blob.type    → 字节数 / MIME 类型
 *    - blob.slice(start, end, type) → 切出一个新 Blob（这是"大文件分片"的基础）
 *    - blob.text() / blob.arrayBuffer() / blob.stream() → 三个 Promise 式读取方法
 *    - URL.createObjectURL(blob) / URL.revokeObjectURL(url)
 *        → 生成一个 "blob:http://..." 的临时地址，可以直接塞给 <img src>、
 *          <a download>。用完必须 revoke，否则这块内存永远不释放（内存泄漏）。
 *    - new File(fileBits, fileName, options) → 相当于 Blob + 文件名
 *    - new FileReader() → onload / onerror / readAsText / readAsDataURL /
 *      readAsArrayBuffer。注意：它没有 Promise 版，只能写回调。
 *    - new FormData(formElement?) → append / set / get / getAll / has / delete /
 *      forEach / entries / keys / values，可直接作为 fetch 的 body。
 *
 * 4. 常见陷阱
 *    - Blob 是"不可变的"：造出来之后改不了，只能 slice 出新 Blob。
 *    - Blob 不会立即把数据读进内存？其实会（由实现决定），但当你只要"一个引用"
 *      时用 Blob 比用字符串更省——例如把 100MB 视频传给 <video> 时，
 *      用 createObjectURL 不会像 DataURL 那样把整个文件变成 1.33 倍的 Base64 字符串。
 *    - FileReader 和 Blob.text() 都会把整个文件读进内存：读 2GB 的文件会崩。
 *      正确做法是用 blob.stream() 配合 getReader() 边读边处理。
 *    - file:// 协议下有些能力受限（如 Service Worker 不可用），但 Blob、
 *      FileReader、createObjectURL 依然可用；用 fetch 读本地文件则会被 CORS 拦住。
 *    - FormData 里 append 的 File 不能再被读取字节（只能整体发送），
 *      想要处理文件内容要在 append 之前做。
 *
 * 【本文件在 Node 中如何演示】
 *   Node.js 18+ 已经内置了 Blob 与 FormData（来自 undici / buffer 模块），
 *   Node 20+ 还内置了 File。所以这里用的是**完全相同的真实 API**，
 *   不是模拟。唯一的差异：
 *     - Node 没有 FileReader（那是浏览器 DOM 的产物）。替代品是 Blob 自带的
 *       text() / arrayBuffer() / stream()，功能是超集，本文件用它们演示。
 *     - Node 没有"用户选择文件"这一说，File 对象要自己 new 出来。
 *     - Node 的 URL.createObjectURL 能生成 blob:nodedata:... 地址，
 *       但没有 <img src> 这样的消费者，实际用途很小，本文件只做演示。
 *   另外本文件会**手写 multipart/form-data 的编码与解析**，
 *   把 "FormData 被 fetch 发送时到底变成了什么字节" 这件事彻底讲清楚。
 *
 * 【运行方法】
 *   node 27_web_apis/11_blob_file_formdata.js
 *
 * 【预期输出】
 *   依次打印：Blob 的创建与读取、切片与分片上传模拟、File 对象、
 *   FileReader 的 Node 替代方案、手写 multipart 编码结果、
 *   以及把这段字节流反向解析回字段的全过程。
 * ============================================================================
 */

// ===========================================================================
// 第 0 部分：通用字节工具
// ===========================================================================
// Node 内置 TextEncoder / TextDecoder（与浏览器同名同语义），
// 它们是"字符串 ↔ 字节"之间的桥梁：JS 字符串是 UTF-16 的，
// 而网络/文件里流动的是 UTF-8 字节，必须显式转换。

const encoder = new TextEncoder(); // 字符串 → Uint8Array（默认 UTF-8）
const decoder = new TextDecoder('utf-8'); // Uint8Array → 字符串

/** 把多个 Uint8Array 拼成一个（手写版，避免依赖 Buffer.concat） */
function concatBytes(chunks) {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total); // 先算总长，一次性分配
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset); // 把 c 拷到 out 的 offset 位置
    offset += c.length;
  }
  return out;
}

/**
 * 在字节数组里查找子序列，返回下标；找不到返回 -1。
 * 相当于 String.prototype.indexOf 的字节版本——二进制数据不能当字符串搜，
 * 因为多字节字符会被拆坏。
 */
function indexOfBytes(haystack, needle, from = 0) {
  outer: for (let i = from; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer; // 不匹配，从下一个 i 重试
    }
    return i;
  }
  return -1;
}

/** 把字节数组格式化成 "48 65 6C 6C 6F" 这样的十六进制串，便于观察 */
function toHex(bytes, max = 64) {
  const shown = bytes.subarray(0, max);
  const hex = Array.from(shown, (b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  return bytes.length > max ? `${hex} ... (共 ${bytes.length} 字节)` : hex;
}

/** 打印一小段带缩进的分节标题 */
function section(title) {
  console.log('');
  console.log('='.repeat(74));
  console.log(title);
  console.log('='.repeat(74));
}

// ===========================================================================
// 第 1 部分：Blob 的创建与基本属性
// ===========================================================================

section('--- 1. Blob：一段带 MIME 类型的不可变二进制数据 ---');

// new Blob(parts, options)
//   parts  ：数组，元素可以是 字符串 / ArrayBuffer / TypedArray / Blob
//   options：{ type: 'MIME 类型' }
const textBlob = new Blob(['你好，Blob！', '\n第二行'], { type: 'text/plain;charset=utf-8' });
console.log('textBlob.size（字节数）=', textBlob.size);
// 注意：中文在 UTF-8 里占 3 字节，所以 size 不等于"字符个数"。
// "你好，Blob！" = 6 个中文字符(3字节) + "Blob"(4) + "！"(3) ... 用实际值说明最清楚。
console.log('  其中"你好，Blob！"共', '你好，Blob！'.length, '个字符，但 UTF-8 下占',
  encoder.encode('你好，Blob！').length, '个字节 —— size 数的是字节不是字符。');
console.log('textBlob.type =', JSON.stringify(textBlob.type));

// 用 TypedArray / ArrayBuffer 造 Blob：这是处理"真正的二进制"的常规姿势
const rawBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG 文件头魔数
const pngHeaderBlob = new Blob([rawBytes], { type: 'image/png' });
console.log('pngHeaderBlob：type =', pngHeaderBlob.type, '，size =', pngHeaderBlob.size);
console.log('  它的字节 =', toHex(await pngHeaderBlob.arrayBuffer().then((b) => new Uint8Array(b))));

// 混合 parts：字符串和二进制可以放在同一个 Blob 里，按顺序拼接
const mixedBlob = new Blob(['前缀-', rawBytes, '-后缀'], { type: 'application/octet-stream' });
console.log('mixedBlob.size =', mixedBlob.size, '（字符串部分 7 字节 + 二进制 8 字节 + 字符串 7 字节）');

// Blob 是不可变的：想"修改"只能重新构造
console.log('提示：Blob 不可变，没有 append/修改方法，只能 slice 出新 Blob。');

// ===========================================================================
// 第 2 部分：读取 Blob 内容 —— FileReader 的现代替代
// ===========================================================================

section('--- 2. 读取 Blob 内容 ---');
console.log('浏览器：new FileReader() + readAsText / readAsDataURL / readAsArrayBuffer（事件式）');
console.log('Node  ：没有 FileReader，用 Blob 自带的三个 Promise 方法代替（功能是超集）');
console.log('');

// 方法一：text() → 按 UTF-8 解码成字符串
console.log('[text()]        内容 =', JSON.stringify(await textBlob.text()));

// 方法二：arrayBuffer() → 拿到原始字节的 ArrayBuffer
const ab = await textBlob.arrayBuffer();
console.log('[arrayBuffer()] 字节数 =', ab.byteLength, '，读作字符串 =', JSON.stringify(decoder.decode(ab)));

// 方法三：stream() → 流式读取，适合大文件（边读边处理，不用全部载入内存）
// getReader() 返回一个读取器，每次 read() 拿到 { value: Uint8Array, done: boolean }
const reader = textBlob.stream().getReader();
const streamedChunks = [];
while (true) {
  const { value, done } = await reader.read();
  if (done) break; // 流读完了
  streamedChunks.push(value);
}
console.log('[stream()]      分', streamedChunks.length, '块读到，拼接后 =',
  JSON.stringify(decoder.decode(concatBytes(streamedChunks))));

console.log('');
console.log('对照：若在浏览器里用 FileReader，同样一件事要写成回调：');
console.log('  const fr = new FileReader();');
console.log("  fr.onload = () => console.log(fr.result);   // fr.result 是读出来的内容");
console.log("  fr.readAsText(blob, 'utf-8');");
console.log('  注意 FileReader 没有 Promise 版本，想 await 就得自己包一层。');

// ===========================================================================
// 第 3 部分：slice 与"大文件分片上传"
// ===========================================================================

section('--- 3. slice：把大文件切成小片（分片上传的基础） ---');

// 造一个 10KB 的"大文件"（真实场景里可能是几百 MB 的视频）
const bigContent = 'ABCDEFGHIJ'.repeat(1024); // 10 * 1024 = 10240 字符
const bigBlob = new Blob([bigContent], { type: 'text/plain' });
const CHUNK_SIZE = 4096; // 每片 4KB
console.log('文件总大小 =', bigBlob.size, '字节，分片大小 =', CHUNK_SIZE, '字节');

/**
 * 把 Blob 切成若干片。
 * blob.slice(start, end, contentType) 的参数语义与 String.slice 一致：
 * 左闭右开，end 省略则到末尾，负数表示从末尾倒数。
 */
function sliceIntoChunks(blob, chunkSize) {
  const chunks = [];
  for (let start = 0; start < blob.size; start += chunkSize) {
    const end = Math.min(start + chunkSize, blob.size); // 最后一片可能不足 chunkSize
    chunks.push({
      index: chunks.length,
      start,
      end,
      blob: blob.slice(start, end, blob.type), // 切出来的仍是 Blob
    });
  }
  return chunks;
}

const chunks = sliceIntoChunks(bigBlob, CHUNK_SIZE);
console.log('切片结果：共', chunks.length, '片');
for (const c of chunks) {
  console.log(`  第 ${c.index} 片  [${c.start}, ${c.end})  大小 ${c.blob.size} 字节`);
}
const totalSize = chunks.reduce((s, c) => s + c.blob.size, 0);
console.log('所有分片大小之和 =', totalSize, '，与原文件一致：', totalSize === bigBlob.size);

// ---- 模拟一次"分片上传"：串行发片，最后通知服务端合并 ----
console.log('');
console.log('--- 模拟分片上传流程 ---');

/** 假的"网络发送"：把一片 Blob 转成字节，耗时用 await 模拟异步 */
async function fakeUploadPart(fileId, part) {
  const bytes = new Uint8Array(await part.blob.arrayBuffer()); // 浏览器里这一步是 fetch(url, {body: part.blob})
  // 用前 4 个字节算个"校验和"，模拟服务端会做的完整性校验
  const checksum = bytes.subarray(0, 4).reduce((s, b) => (s + b) % 100000, 0);
  await new Promise((r) => setTimeout(r, 1)); // 让出事件循环，模拟网络往返
  return { part: part.index, bytes: bytes.length, checksum, ok: true };
}

const FILE_ID = 'upload-demo-0001';
const results = [];
for (const c of chunks) {
  const r = await fakeUploadPart(FILE_ID, c);
  results.push(r);
  console.log(`  上传第 ${r.part} 片 → ${r.bytes} 字节，校验和 ${r.checksum}，服务端已收`);
}
console.log(`  全部分片上传完毕，通知服务端合并 fileId=${FILE_ID}，共 ${results.length} 片`);
console.log('');
console.log('为什么真实项目要分片？');
console.log('  1) 单次请求有体积上限（Nginx 默认 1MB，网关常常限制 10~100MB）；');
console.log('  2) 某一片失败只需重传那一片，不用整个文件从头来（断点续传）；');
console.log('  3) 可以并发上传多片，显著提速；');
console.log('  4) 可以边传边算哈希，传完立即校验完整性。');

// ===========================================================================
// 第 4 部分：File —— Blob + 文件名 + 修改时间
// ===========================================================================

section('--- 4. File：Blob 的子类，多了 name 和 lastModified ---');

// new File(fileBits, fileName, options)
// 浏览器里 File 通常由 <input type="file"> 或拖放事件产生，
// Node 里没有"用户选择文件"，只能自己 new（Node 20+ 提供 File 全局）。
const file = new File(['id,name\n1,张三\n2,李四\n'], 'users.csv', {
  type: 'text/csv',
  lastModified: Date.now(),
});
console.log('file.name         =', file.name, '（Blob 没有这个属性，File 才有）');
console.log('file.lastModified =', file.lastModified, '→', new Date(file.lastModified).toISOString());
console.log('file.type         =', file.type);
console.log('file.size         =', file.size);
console.log('file instanceof Blob =', file instanceof Blob, '（File 继承自 Blob，所有 Blob 方法它都有）');
console.log('');
console.log('内容：');
console.log(await file.text());

console.log('浏览器里的典型来源：');
console.log('  <input type="file"> 的 input.files[0]        → File');
console.log('  拖放事件 event.dataTransfer.files[0]         → File');
console.log('  大文件还能拿到 webkitRelativePath（选文件夹时）');

// ===========================================================================
// 第 5 部分：FormData —— 文本字段 + 文件，一次提交
// ===========================================================================

section('--- 5. FormData：一次提交既有文本又有文件 ---');

// 浏览器里可以直接 new FormData(formElement)，自动把表单里的控件读取进来；
// Node/浏览器都可以 new FormData() 然后用 append 手动塞。
const formData = new FormData();
formData.append('username', '张三'); // 普通文本字段
formData.append('age', '28');
formData.append('avatar', file, 'profile.csv'); // 文件字段：第二个参数是 File/Blob，第三个是覆盖用的文件名
formData.append('tags', 'vip'); // 同名多次 append
formData.append('tags', 'new'); // → 会变成两个同名字段，这是表单的合法行为

console.log('formData.has("username") =', formData.has('username'));
console.log('formData.get("username") =', formData.get('username'), '（同名多个时只返回第一个）');
console.log('formData.getAll("tags")  =', formData.getAll('tags'), '（getAll 才能拿到全部）');
console.log('formData.get("avatar")   =', formData.get('avatar').name, '，类型', formData.get('avatar').constructor.name);

// set 与 append 的区别：set 会覆盖同名的所有旧值
formData.set('tags', 'vvip');
console.log('set("tags","vvip") 之后 getAll("tags") =', formData.getAll('tags'), '（set 覆盖，append 追加）');

// delete 删除字段
formData.delete('age');
console.log('delete("age") 之后 has("age") =', formData.has('age'));

console.log('');
console.log('遍历 FormData（它实现了可迭代协议，entries() 返回 [name, value] 迭代器）：');
for (const [name, value] of formData.entries()) {
  const desc = typeof value === 'string' ? JSON.stringify(value) : `File("${value.name}", ${value.size} 字节)`;
  console.log(`  ${name} = ${desc}`);
}

// ===========================================================================
// 第 6 部分：手写 multipart/form-data 编码
// ===========================================================================
// fetch(url, { method:'POST', body: formData }) 时，浏览器（或 Node 的 undici）
// 会把 FormData 编码成 multipart/form-data 格式。它的字节结构是这样的：
//
//   --<boundary>\r\n
//   Content-Disposition: form-data; name="username"\r\n
//   \r\n
//   张三\r\n
//   --<boundary>\r\n
//   Content-Disposition: form-data; name="avatar"; filename="profile.csv"\r\n
//   Content-Type: text/csv\r\n
//   \r\n
//   <文件原始字节>\r\n
//   --<boundary>--\r\n
//
// boundary 是一串"绝不会出现在内容里"的随机字符串，由发送方自己生成，
// 并通过请求头 Content-Type: multipart/form-data; boundary=xxx 告诉服务端。

section('--- 6. 手写 multipart/form-data 编码 ---');

/** 生成一个随机 boundary（浏览器内部也是这么干的） */
function makeBoundary() {
  return '----WebKitFormBoundary' + Math.random().toString(36).slice(2, 18);
}

/**
 * 把「字段列表」编码成 multipart/form-data 的字节流。
 * @param {Array<{name:string, value?:string, filename?:string, contentType?:string, data?:Uint8Array}>} fields
 * @param {string} boundary
 * @returns {Uint8Array} 请求体的完整字节
 */
function encodeMultipart(fields, boundary) {
  const CRLF = '\r\n';
  const pieces = []; // 收集所有字节片段，最后一次性拼接

  for (const f of fields) {
    // 1) 每个字段都以 "--boundary\r\n" 开头
    pieces.push(encoder.encode(`--${boundary}${CRLF}`));

    // 2) Content-Disposition 头：说明这个字段叫什么名字
    if (f.filename !== undefined) {
      // 文件字段：多一个 filename 参数。注意文件名两侧一定要有引号。
      pieces.push(
        encoder.encode(`Content-Disposition: form-data; name="${f.name}"; filename="${f.filename}"${CRLF}`),
      );
      // 文件字段还会带 Content-Type，告诉服务端这坨字节是什么格式
      pieces.push(encoder.encode(`Content-Type: ${f.contentType || 'application/octet-stream'}${CRLF}`));
    } else {
      // 普通文本字段：只有 name，没有 filename
      pieces.push(encoder.encode(`Content-Disposition: form-data; name="${f.name}"${CRLF}`));
    }

    // 3) 头部与主体之间是一个空行（也就是连续的 \r\n）
    pieces.push(encoder.encode(CRLF));

    // 4) 字段的值：文本按 UTF-8 编码；文件直接放原始字节（绝不能当字符串处理！）
    pieces.push(f.data !== undefined ? f.data : encoder.encode(f.value ?? ''));

    // 5) 字段结束的 CRLF
    pieces.push(encoder.encode(CRLF));
  }

  // 6) 结束标记："--boundary--"（比普通分隔符多了结尾的两个短横线）
  pieces.push(encoder.encode(`--${boundary}--${CRLF}`));

  return concatBytes(pieces);
}

/**
 * 把 FormData 对象转成本文件的「字段列表」中间表示。
 * 真实实现（undici / 浏览器）会直接读 FormData 的内部槽位，
 * 这里我们只能通过公开的 entries() 迭代，效果一样。
 */
async function formDataToFields(fd) {
  const fields = [];
  for (const [name, value] of fd.entries()) {
    if (typeof value === 'string') {
      fields.push({ name, value });
    } else {
      // File / Blob：把字节读出来，并带上文件名与类型
      fields.push({
        name,
        filename: value.name || 'blob',
        contentType: value.type || 'application/octet-stream',
        data: new Uint8Array(await value.arrayBuffer()),
      });
    }
  }
  return fields;
}

const boundary = makeBoundary();
const fields = await formDataToFields(formData);
const bodyBytes = encodeMultipart(fields, boundary);

console.log('boundary =', boundary);
console.log('请求头应为：');
console.log(`  Content-Type: multipart/form-data; boundary=${boundary}`);
console.log(`  Content-Length: ${bodyBytes.length}`);
console.log('');
console.log('编码后的请求体大小 =', bodyBytes.length, '字节');
console.log('前 200 字节的原始内容（把 CRLF 显示成 ⏎ 以便观察）：');
const preview = decoder.decode(bodyBytes.subarray(0, 200));
console.log(JSON.stringify(preview.replace(/\r\n/g, '⏎')));
console.log('');
console.log('十六进制前 64 字节：');
console.log(' ', toHex(bodyBytes, 64));

// ===========================================================================
// 第 7 部分：手写 multipart 解析（服务端视角）
// ===========================================================================

section('--- 7. 手写 multipart/form-data 解析（服务端做的事） ---');

/**
 * 解析 multipart/form-data 字节流，返回字段数组。
 * 算法（与 Express 的 multer / busboy 思路一致）：
 *   1. 用 "--boundary" 把所有片段切开；
 *   2. 每片里，第一个 "\r\n\r\n" 之前是头部，之后是主体字节；
 *   3. 头部里解析出 name / filename / Content-Type。
 *
 * @param {Uint8Array} bytes 完整的请求体字节
 * @param {string} boundaryStr 请求头里的 boundary
 */
function parseMultipart(bytes, boundaryStr) {
  const delim = encoder.encode(`--${boundaryStr}`);
  const headerSep = encoder.encode('\r\n\r\n');
  const result = [];
  let pos = indexOfBytes(bytes, delim, 0);

  while (pos !== -1) {
    let start = pos + delim.length;

    // 遇到 "--boundary--" 就是结束标记，解析到此为止
    if (bytes[start] === 0x2d && bytes[start + 1] === 0x2d) break; // 0x2d 是字符 '-'

    // 分隔符后面跟着一个 CRLF，跳过它
    if (bytes[start] === 0x0d && bytes[start + 1] === 0x0a) start += 2;

    // 找下一个分隔符，作为本片的结束位置
    const next = indexOfBytes(bytes, delim, start);
    if (next === -1) break;

    let end = next;
    // 片尾的 CRLF 属于分隔符的一部分，不属于内容，要去掉
    if (bytes[end - 2] === 0x0d && bytes[end - 1] === 0x0a) end -= 2;

    const raw = bytes.subarray(start, end); // 本片全部字节
    const sep = indexOfBytes(raw, headerSep, 0); // 头部与主体的分界
    if (sep === -1) {
      pos = next; // 格式异常，跳过这一片（真实实现这里会抛错）
      continue;
    }

    const headerText = decoder.decode(raw.subarray(0, sep));
    const bodyPart = raw.subarray(sep + headerSep.length); // 主体：subarray 是"视图"不复制内存
    result.push({ headers: headerText.split('\r\n'), body: bodyPart });

    pos = next;
  }
  return result;
}

const parsed = parseMultipart(bodyBytes, boundary);
console.log('解析出', parsed.length, '个部分：');
console.log('');

for (const [i, p] of parsed.entries()) {
  console.log(`  [${i}] 头部：`);
  for (const line of p.headers) console.log('        ' + line);

  // 从 Content-Disposition 头里正则抠出 name 与 filename
  const cd = p.headers.find((h) => /^content-disposition:/i.test(h)) || '';
  const name = (cd.match(/name="([^"]*)"/) || [])[1]; // 字段名必有
  const filename = (cd.match(/filename="([^"]*)"/) || [])[1]; // 文件字段才有
  const ctype = (p.headers.find((h) => /^content-type:/i.test(h)) || '').replace(/^content-type:\s*/i, '');

  if (filename !== undefined) {
    console.log(`        解析结果：字段 name="${name}"，文件名 "${filename}"，类型 "${ctype}"`);
    console.log(`                  主体 ${p.body.length} 字节，前 30 字节十六进制`);
    console.log(`                  ${toHex(p.body, 30)}`);
    console.log(`                  按文本读："${JSON.stringify(decoder.decode(p.body).slice(0, 40))}..."`);
  } else {
    console.log(`        解析结果：字段 name="${name}"，值 = ${JSON.stringify(decoder.decode(p.body))}`);
  }
  console.log('');
}

console.log('结论：所谓"上传文件"，本质就是把二进制拼进一个约定好格式的大字节流里。');
console.log('      FormData 负责构造，fetch 负责发送，服务端按 boundary 拆开还原。');

// ===========================================================================
// 第 8 部分：Object URL 与内存管理
// ===========================================================================

section('--- 8. URL.createObjectURL：给 Blob 一个临时地址 ---');

const objectUrl = URL.createObjectURL(pngHeaderBlob);
console.log('URL.createObjectURL(blob) →', objectUrl);
console.log('浏览器中可以这样用：');
console.log("  img.src = url;                       // 直接显示 Blob 里的图片，无需上传服务器");
console.log("  a.href = url; a.download = 'x.png';  // 触发下载");
console.log('Node 里这个地址没有消费者（没有 <img>），所以实际意义有限，仅作演示。');
console.log('');
console.log('关键：用完必须 URL.revokeObjectURL(url) 释放，否则这块 Blob 内存永远不会被回收。');
console.log('  常见内存泄漏写法：每生成一次预览就 createObjectURL 一次，从不 revoke。');
URL.revokeObjectURL(objectUrl); // 释放
console.log('已调用 URL.revokeObjectURL 释放：', objectUrl);

// 对比 DataURL：DataURL 是把字节 Base64 编码后塞进字符串，
// 体积会膨胀约 33%，且大字符串会长期占用内存。
const base64 = Buffer.from(await pngHeaderBlob.arrayBuffer()).toString('base64');
const dataUrl = `data:${pngHeaderBlob.type};base64,${base64}`;
console.log('');
console.log('对比 DataURL：', dataUrl);
console.log('  8 字节的 Blob → DataURL 字符串长', dataUrl.length, '字符；数据量越大膨胀越明显。');
console.log('  所以大文件预览一律用 createObjectURL，不要用 DataURL。');

// ===========================================================================
// 第 9 部分：浏览器 vs Node 对照表
// ===========================================================================

section('--- 9. 浏览器 vs Node 差异速查 ---');

const compare = [
  ['Blob', '原生支持', 'Node 18+ 全局内置（来自 buffer 模块）'],
  ['File', '原生支持', 'Node 20+ 全局内置；20 以下需 require("buffer").File'],
  ['FileReader', '有（DOM API，事件式）', '无。用 blob.text() / arrayBuffer() / stream() 代替'],
  ['FormData', '原生支持', 'Node 18+ 全局内置（来自 undici）'],
  ['new FormData(form)', '支持，自动读表单控件', '无表单概念，只能 new FormData() 后 append'],
  ['URL.createObjectURL', '有，且是主要用途（img/video/download）', '有，但没有消费者，基本不用'],
  ['<input type="file">', 'File 的主要来源', '不存在，File 需自己 new'],
];
// 注意：不要用 padEnd 对齐含中文的表格——中文是"全角"字符，终端里占 2 个字符宽度，
// 而 JS 的 length/padEnd 只按 UTF-16 码元计数（中文算 1），结果必然错位。
// 稳妥做法是用固定分隔符，让每列各占一行结构清晰。
for (const [ability, browser, node] of compare) {
  console.log(`· ${ability}`);
  console.log(`    浏览器：${browser}`);
  console.log(`    Node  ：${node}`);
}

console.log('');
console.log('小结：Blob 家族解决的是"二进制在 JS 里怎么表示、怎么传递"这个核心问题。');
console.log('      - 表示：Blob（不可变字节 + MIME）、File（+名字/时间）');
console.log('      - 读取：text / arrayBuffer / stream（现代），FileReader（传统）');
console.log('      - 传递：FormData + multipart/form-data（跨网络），createObjectURL（跨 DOM）');
console.log('      - 大文件：slice 分片 + 并发上传 + 失败重传。');
