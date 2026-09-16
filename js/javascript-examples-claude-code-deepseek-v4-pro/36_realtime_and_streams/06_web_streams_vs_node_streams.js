/**
 * ============================================================================
 * 知识点：Web Streams 与 node:stream 的对比与互转
 * ============================================================================
 *
 * 【所属分类】36_realtime_and_streams —— 实时通信与流式处理
 * 【难度等级】高级
 * 【前置知识】36_realtime_and_streams/04_web_streams_readable.js、26_node_core/08_streams_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 世界里同时存在两套流：
 *      · **node:stream**（2010 年）：Node 自有的流实现，基于 EventEmitter，
 *        有 Readable / Writable / Duplex / Transform 四类，配套 pipeline()、finished()。
 *      · **Web Streams**（WHATWG 标准，2016 年后）：基于 Promise 的拉模型，
 *        有 ReadableStream / WritableStream / TransformStream 三类，
 *        浏览器、Deno、Bun、Cloudflare Workers、Node 里都能跑。
 *    两套 API 互不兼容：一个用 `.on('data')` 和 `.write()/drain`，
 *    另一个用 `getReader().read()` 和 `desiredSize`。
 *    好在 Node 提供了**四个双向适配器**，可以随时在两者之间架桥：
 *
 *      Readable.toWeb(nodeReadable)   -> ReadableStream         （Node 可读 -> Web 可读）
 *      Readable.fromWeb(webReadable)  -> node Readable          （Web 可读 -> Node 可读）
 *      Writable.toWeb(nodeWritable)   -> WritableStream         （Node 可写 -> Web 可写）
 *      Writable.fromWeb(webWritable)  -> node Writable          （Web 可写 -> Node 可写）
 *      Duplex.toWeb / Duplex.fromWeb  同理，用于双向流
 *
 * 2. 为什么需要（真实项目场景）
 *    · 你有一个用 node:stream 写的老库（如 zlib、tar、csv 解析），
 *      但新代码要接 fetch 的 response.body（Web Streams）—— 必须转换。
 *    · 你在写跨平台的库（既跑 Node 又跑浏览器），内部统一用 Web Streams，
 *      到了 Node 边界再转成 node:stream 交给生态里的老库。
 *    · 你想用标准的 `DecompressionStream` / `CompressionStream`，
 *      而压缩源数据恰好来自 Node 的文件/网络流。
 *    · Node 的 `pipeline()`、`stream.finished()`、`addAbortSignal()` 这些
 *      成熟工具只认 node:stream，想在 Web Streams 上用就得先转。
 *
 * 3. 核心语法要点
 *    Node -> Web：
 *      - Readable.toWeb(nodeReadable)       返回 ReadableStream，块类型是 Uint8Array
 *      - Writable.toWeb(nodeWritable)       返回 WritableStream
 *      - Duplex.toWeb(nodeDuplex)           返回 { readable, writable } 的组合
 *      - **调用后 Node 流就交给 Web 包装器接管了**，不要再自己 .on('data') 去抢
 *      - 只对**还没有开始流动**的流有效：已经读过 / 已经 end() 的会抛错
 *    Web -> Node：
 *      - Readable.fromWeb(webReadableStream)   返回 node Readable
 *      - Writable.fromWeb(webWritableStream)   返回 node Writable
 *      - Duplex.fromWeb({ readable, writable }) 返回 node Duplex
 *      - 拿到之后就能用 .pipe() / pipeline() / 'data' 事件了
 *    跨边界的错误传播：
 *      - Node 侧 'error' 事件  ->  Web 侧 read() 的 Promise reject
 *      - Web 侧 controller.error()  ->  Node 侧触发 'error' 事件（漏监听就是进程崩溃）
 *
 * 4. 常见陷阱
 *    陷阱 1：互转不是"零成本改名"，而是**加了一层适配器**。每个块都要经过一次
 *            Promise/事件转换，超高频小块场景会有可测量的额外开销。
 *            能在同一种流里做完的管道，不要来回横跳。
 *    陷阱 2：`Readable.toWeb()` 之后又去 `nodeReadable.on('data')`，
 *            两边抢数据，结果谁都读不全。
 *    陷阱 3：`Writable.toWeb()` 要求 Node 可写流尚未结束；已经 end() 的会抛错。
 *    陷阱 4：Node 侧的错误只以 'error' 事件形式存在。转成 Web 后它变成 reject，
 *            这是好事（能用 try/catch 了）；反过来，Web 转 Node 之后又回到
 *            "漏监听 'error' 事件就崩进程"的老世界，必须补上监听。
 *    陷阱 5：node:stream/promises 的 `pipeline()` **不收 Web Streams**。
 *            想把 Web 流用 pipeline 串起来，得先 `Readable.fromWeb()`。
 *    陷阱 6：块类型不一样。Node 里是 Buffer，Web 里是 Uint8Array。
 *            Buffer 是 Uint8Array 的子类，Web 里的块用 `chunk.toString('utf8')`
 *            会失效（因为没有这个方法），要 `new TextDecoder().decode(chunk)`。
 *    陷阱 7：`Readable.fromWeb()` 默认造出的是 **byte 模式**可读流，只接受
 *            string/Buffer/TypedArray。如果你的 Web 流里装的是数字、对象等任意值，
 *            必须在第二个参数里写 `{ objectMode: true }`，否则一读就抛
 *            ERR_INVALID_ARG_TYPE。这是两套流"对块的假设不同"导致的典型碰撞。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 36_realtime_and_streams/06_web_streams_vs_node_streams.js
 *   纯内存示例（zlib 压缩也在内存里完成），不访问外网、不读写磁盘。
 *
 * 【预期输出】
 *   1) 两套流的差异对照
 *   2) Node Readable  --toWeb-->  Web ReadableStream，用 Web 方式读
 *   3) Web ReadableStream --fromWeb--> Node Readable，用 Node 方式读
 *   4) Writable.toWeb：用 Web writer 写进 Node 可写流
 *   5) Writable.fromWeb + pipeline()：用 Node 侧工具驱动 Web 可写流
 *   6) 跨流派实战：node:zlib 压缩 -> toWeb -> DecompressionStream 解压还原
 *   7) 错误如何跨边界传播
 * ============================================================================
 */

import { Readable, Writable, Transform } from 'node:stream';
import { pipeline as pipelineAsync } from 'node:stream/promises';
import zlib from 'node:zlib';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 算字符串在终端里的显示宽度：东亚全角字符占 2 列，其余占 1 列。
 * 注意范围要包含 CJK 标点（、。「」等，U+3000 起），
 * 只写 [一-鿿] 会把顿号当成半角，表格就对不齐了。
 */
const WIDE = /[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︐-﹯＀-｠￠-￦]/;
const width = (s) => [...s].reduce((w, ch) => w + (WIDE.test(ch) ? 2 : 1), 0);
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - width(s)));

// ---------------------------------------------------------------------------
// 1. 两套流的差异对照
// ---------------------------------------------------------------------------
console.log('--- 1. 两套流的差异对照 ---');

const diffs = [
  ['诞生时间', '2010 年，Node 自有', '2016 年后，WHATWG 标准'],
  ['核心模型', "EventEmitter（推模型 + 'data' 事件）", 'Promise（拉模型 + read()）'],
  ['三大件', 'Readable / Writable / Duplex / Transform', 'ReadableStream / WritableStream / TransformStream'],
  ['背压信号', 'write() 返回 false，等 drain 事件', 'desiredSize <= 0，write() 的 Promise 挂起'],
  ['错误传播', "emit('error')，漏监听直接崩进程", 'Promise reject，可 try/catch'],
  ['取消/中止', 'destroy() / addAbortSignal()', 'AbortSignal / cancel(reason)'],
  ['配套工具', 'pipeline()、finished()、pump()', 'pipeTo()、pipeThrough()、tee()'],
  ['块类型', 'Buffer（或任意对象）', 'Uint8Array（不支持对象）'],
  ['跑在哪里', '只在 Node', '浏览器 / Node / Deno / Bun / Workers'],
];
for (const [k, node, web] of diffs) {
  console.log(`  ${pad(k, 12)}| node:stream: ${node}`);
  console.log(`  ${' '.repeat(12)}| Web Streams: ${web}`);
}
console.log('  两套没有谁取代谁：node:stream 生态更深（文件、压缩、socket），');
console.log('  Web Streams 覆盖面更广（fetch、浏览器、跨平台库）。所以互转能力是刚需。');

// ---------------------------------------------------------------------------
// 2. Node Readable -> Web ReadableStream（Readable.toWeb）
// ---------------------------------------------------------------------------
console.log('\n--- 2. Readable.toWeb：把 Node 可读流交给 Web 世界 ---');

// Readable.from 是最简单的造流方式。默认 objectMode，块就是原样的值。
const nodeSource = Readable.from(['第一块\n', '第二块\n', '第三块\n']);
console.log(`  造了一个 Node Readable，readableObjectMode = ${nodeSource.readableObjectMode}`);

// 关键一步：适配成 Web ReadableStream
const webReadable = Readable.toWeb(nodeSource);
console.log(`  转换结果是不是 ReadableStream：${webReadable instanceof ReadableStream}`);
console.log(`  转换后 locked = ${webReadable.locked}（还没被读取者占用）`);

// 注意陷阱 2：从这一刻起不要再 nodeSource.on('data')，两边会抢数据。
const viaWeb = [];
// TextDecoderStream 是 Web Streams 的成员，能把"字符串块"统一成字符串（这里本来也是字符串）
for await (const chunk of webReadable) {
  viaWeb.push(String(chunk));
}
console.log(`  用 Web 方式（for await）读到：${JSON.stringify(viaWeb.join(''))}`);

// ---------------------------------------------------------------------------
// 3. Web ReadableStream -> Node Readable（Readable.fromWeb）
// ---------------------------------------------------------------------------
console.log('\n--- 3. Readable.fromWeb：把 Web 可读流接回 Node 生态 ---');

const webSource = new ReadableStream({
  start(controller) {
    controller.enqueue('alpha ');
    controller.enqueue('beta ');
    controller.enqueue('gamma');
    controller.close();
  },
});

const nodeFromWeb = Readable.fromWeb(webSource);
const viaNode = [];
// 转到 Node 侧之后，老一套用法就都能用了：'data' 事件、pipe、pipeline……
nodeFromWeb.on('data', (chunk) => viaNode.push(String(chunk)));
await new Promise((resolve) => nodeFromWeb.on('end', resolve));
console.log(`  用 Node 方式（'data' 事件）读到：${JSON.stringify(viaNode.join(''))}`);

// ---- 陷阱：fromWeb 默认造出的是 **byte 模式**可读流 ----
console.log('\n  陷阱：Readable.fromWeb() 默认是 byte 模式，非字节块会直接报错');

const numberStream = ReadableStream.from([10, 20, 30]); // Web 流可以装任意值
const byteModeNode = Readable.fromWeb(numberStream); // 不传 options
try {
  for await (const chunk of byteModeNode) console.log(`    读到 ${chunk}`);
} catch (err) {
  console.log(`    读到数字块时抛错：${err.code}`);
  console.log(`    ${err.message}`);
}
console.log('    原因：Node 的可读流默认是 byte 模式，只接受 string/Buffer/TypedArray。');
console.log('          Web Streams 允许装任意 JS 值，两边对"块"的假设不一致。');

// 正确做法：显式声明 objectMode
const numberStream2 = ReadableStream.from([10, 20, 30]);
const objectModeNode = Readable.fromWeb(numberStream2, { objectMode: true });
const numbers = [];
for await (const chunk of objectModeNode) numbers.push(chunk);
console.log(`    传 { objectMode: true } 之后：${numbers.join(', ')}`);

// 再演示一次：Web 流 -> Node 流 -> 自定义 Transform -> 结果
const webSource2 = ReadableStream.from(['x', 'y', 'z']);
const transformed = Readable.fromWeb(webSource2).pipe(
  // 用 Transform（而不是手写 Duplex）：它的可读端会随可写端一起结束。
  // 手写 Duplex 时如果不在 _final 里 push(null)，可读端会一直"半开"，
  // 下游的 for await 就永远等不到 done —— 这也是 Node 流里的经典坑。
  new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      cb(null, `(${chunk})`);
    },
  }),
);
const pipelineOut = [];
for await (const chunk of transformed) pipelineOut.push(chunk);
console.log(`  Web 流 -> Node 流 -> 自定义 Transform -> 结果：${pipelineOut.join(' ')}`);
console.log(`  说明：一旦转成 Node 流，pipeline()/pipe() 这些成熟工具就都能用了。`);

// ---------------------------------------------------------------------------
// 4. Writable.toWeb：用 Web writer 写进 Node 可写流
// ---------------------------------------------------------------------------
console.log('\n--- 4. Writable.toWeb：用 Web 方式写入 Node 可写流 ---');

const nodeSink = [];
const nodeWritable = new Writable({
  // 这是 Node 侧可写流的标准写法：write(chunk, encoding, callback)
  write(chunk, _encoding, callback) {
    nodeSink.push(chunk.toString('utf8'));
    callback(); // 必须调用，表示"这一块处理完了"
  },
});

const webWritable = Writable.toWeb(nodeWritable);
console.log(`  转换结果是不是 WritableStream：${webWritable instanceof WritableStream}`);

const w = webWritable.getWriter();
await w.write('通过 Web writer 写入的第一块');
await w.write('、第二块');
await w.close();
console.log(`  Node 侧收集到的内容：${JSON.stringify(nodeSink.join(''))}`);
console.log('  注意：web writer 写入时传字符串，到 Node 侧就变成 Buffer 了。');

// ---------------------------------------------------------------------------
// 5. Writable.fromWeb：把 Web 可写流接回 Node 的 pipeline
// ---------------------------------------------------------------------------
console.log('\n--- 5. Writable.fromWeb + pipeline()：用 Node 工具驱动 Web 可写流 ---');

const webSink = [];
const webWritable2 = new WritableStream({
  write(chunk) {
    // Web 侧的 write 可以是异步的，返回值会被当作背压信号
    webSink.push(new TextDecoder().decode(chunk));
  },
});

const nodeWritable2 = Writable.fromWeb(webWritable2);

// 现在可以用 node 的 pipeline 把 "数据源 -> 处理 -> Web 可写流" 串起来
await pipelineAsync(
  Readable.from(['流水线 ', '输出 ', '到 Web 可写流']),
  async function* (source) {
    // 顺便演示：pipeline 支持异步生成器作为中间环节
    for await (const chunk of source) {
      yield String(chunk).toUpperCase();
    }
  },
  nodeWritable2,
);
console.log(`  Web 侧收集到的内容：${JSON.stringify(webSink.join(''))}`);
console.log('  pipeline() 只认 node:stream，所以这里的 fromWeb 是必需的一步。');

// ---------------------------------------------------------------------------
// 6. 跨流派实战：node:zlib 压缩 -> Web 解压还原
// ---------------------------------------------------------------------------
console.log('\n--- 6. 实战：Node 压缩 + Web 解压，一条管道横跨两套流 ---');

const original = 'JavaScript 流式处理 JavaScript 流式处理 JavaScript 流式处理'.repeat(8);
console.log(`  原文长度：${original.length} 字符`);

// ① Node 侧：zlib.createGzip() 是一个 Duplex/Transform，用 pipeline 压出字节流
const gzipNodeStream = Readable.from([Buffer.from(original, 'utf8')]).pipe(zlib.createGzip());

// ② 适配成 Web ReadableStream
const gzipWebStream = Readable.toWeb(gzipNodeStream);

// ③ Web 侧：先统计压缩后字节数，再用标准的 DecompressionStream 解压，最后解码成文本
let compressedBytes = 0;
const counter = new TransformStream({
  transform(chunk, controller) {
    compressedBytes += chunk.byteLength;
    controller.enqueue(chunk);
  },
});

let restored = '';
for await (const textChunk of gzipWebStream
  .pipeThrough(counter)
  .pipeThrough(new DecompressionStream('gzip')) // 标准库提供的 Web TransformStream
  .pipeThrough(new TextDecoderStream())) {
  restored += textChunk;
}

console.log(`  ① node:zlib 压缩 -> ${compressedBytes} 字节`);
console.log(`  ② Readable.toWeb 适配成 Web Streams`);
console.log(`  ③ DecompressionStream('gzip') + TextDecoderStream 解压还原`);
console.log(`  还原后长度：${restored.length} 字符，与原文字符串完全一致：${restored === original}`);

// ---------------------------------------------------------------------------
// 7. 错误如何跨边界传播
// ---------------------------------------------------------------------------
console.log('\n--- 7. 错误跨边界传播 ---');

// 7a. Node 侧出错 -> Web 侧的 read() reject（好消息：能用 try/catch 了）
const failingNode = new Readable({
  read() {
    this.destroy(new Error('Node 侧数据源坏了'));
  },
});
const failingWeb = Readable.toWeb(failingNode);
try {
  await failingWeb.getReader().read();
} catch (err) {
  console.log(`  Node 的 'error' 事件 -> Web 侧 read() 抛出：${err.message}`);
}

// 7b. Web 侧出错 -> Node 侧 emit('error')（坏消息：漏监听会崩进程）
const failingWebSource = new ReadableStream({
  start(controller) {
    controller.error(new Error('Web 侧数据源坏了'));
  },
});
const failingNodeFromWeb = Readable.fromWeb(failingWebSource);
const nodeSideError = await new Promise((resolve) => {
  failingNodeFromWeb.on('error', (err) => resolve(err.message)); // 这个监听必须有
});
console.log(`  Web 的 controller.error() -> Node 侧 'error' 事件：${nodeSideError}`);

// 7c. 正确姿势：用 pipeline 自动串联错误处理
//     pipeline 会把任何一环的错误传播到所有环节，并负责销毁资源 —— 手写事件监听很难做对
const sink = new Writable({
  write(_c, _e, cb) {
    cb();
  },
});
// 注意：上面那个 failingWebSource 已经被 fromWeb 锁住了，可读流不能复用，这里必须新建一个
const failingWebSource2 = new ReadableStream({
  start(controller) {
    controller.enqueue('先给一块正常数据');
    controller.error(new Error('Web 侧数据源中途坏了'));
  },
});
try {
  await pipelineAsync(Readable.fromWeb(failingWebSource2), sink);
} catch (err) {
  console.log(`  pipeline() 统一捕获并清理：${err.message}`);
}
console.log('  用 pipeline() 时不用手写任何 error 监听，它会负责销毁中间所有流，避免泄漏。');

// ---------------------------------------------------------------------------
// 8. 选型建议
// ---------------------------------------------------------------------------
console.log('\n--- 8. 怎么选 ---');
const advice = [
  ['涉及 fetch / 浏览器 / 跨平台库', 'Web Streams', 'response.body 就是它，不必转换'],
  ['文件、压缩、socket、老库生态', 'node:stream', 'zlib/fs/net 全是 node:stream'],
  ['需要 pipeline() 的自动错误处理与清理', 'node:stream', '或者转换到 Node 侧再用'],
  ['要给两个消费者各发一份', 'Web Streams', 'tee() 是标准能力，Node 侧要自己写'],
  ['想在管道中间插一个 AI 流式解析器', 'Web Streams', '大多数 SDK 都返回 ReadableStream'],
  ['追求极致低开销的高频小块', 'node:stream', '互转适配器有额外 Promise 开销'],
];
for (const [scene, choice, why] of advice) {
  console.log(`  ${pad(scene, 36)}-> ${pad(choice, 12)}（${why}）`);
}
console.log('\n  一句话：**内部统一用一种，边界处转换**。');
console.log('  两边都想要的时候，记住适配器是双向的，而且转过去的流是"活的"，不是拷贝。');

await sleep(0);
console.log('\n全部演示结束。');
