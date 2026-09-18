/**
 * ============================================================================
 * 知识点：字节流与 BYOB —— ByteLengthQueuingStrategy、缓冲区复用、何时该用字节流
 * ============================================================================
 *
 * 【所属分类】36_realtime_and_streams —— 实时通信与流式处理
 * 【难度等级】高级
 * 【前置知识】36_realtime_and_streams/04_web_streams_readable.js、36_realtime_and_streams/05_web_streams_transform.js、24_typed_arrays/01_typed_array_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    04 篇讲的是**默认流（default stream）**：chunk 可以是任意 JS 值，
 *    队列按"块数"计量，`CountQueuingStrategy` 就是为它准备的。
 *    本篇补上另一条分支 —— **字节流（byte stream）**：`new ReadableStream({ type: 'bytes' })`。
 *    两者的差别不是"能不能装字节"，而是三条根本性的设计差异：
 *
 *      · **chunk 的类型**：默认流能装任何值（对象、字符串、数字、Uint8Array…）；
 *        字节流**只能**装 ArrayBufferView，装别的一律 TypeError。
 *      · **计量单位**：默认流的 `highWaterMark` 是"**几块**"；
 *        字节流的是"**几字节**"。同样是 `highWaterMark: 1024`，
 *        在默认流里表示"最多积压 1024 块"，在字节流里表示"最多积压 1024 字节"。
 *      · **能不能 BYOB**：字节流支持 **BYOB**（Bring Your Own Buffer，自带缓冲区）——
 *        消费者可以把一块自己的 `Uint8Array` 交给流，让**生产者直接往里写**；
 *        默认流完全不支持（`controller.byobRequest` 是 `undefined`，
 *        `getReader({ mode: 'byob' })` 会抛 TypeError）。
 *
 *    **BYOB 的意义**：普通读法是"生产者分配一块新内存装数据 -> 消费者再拷走"；
 *    BYOB 是"消费者先把缓冲区递过去 -> 生产者直接写进去"。
 *    于是**单次处理的数据量由消费者说了算**，源侧也不必为每块新分配内存。
 *    （注意：规范会在每次 read 时把传入的 buffer 转移走，引擎仍会准备一块等长的缓冲区，
 *      所以它是"数据不重复拷贝"，**不等于**"内存零分配" —— 本文件小节 5 会用实测数字说清这点。）
 *    下载大文件、解压、解析二进制协议时，这个差别会随着数据量放大。
 *
 * 2. 为什么需要（真实项目场景）
 *    · **文件与网络**：`fetch` 的 `response.body` 就是**字节流**，
 *      处理大文件时用 BYOB 可以复用同一块缓冲区，避免每块都产生垃圾对象。
 *    · **流式解压/解密**：`DecompressionStream` 的输出也是字节流，
 *      逐块喂给解析器时，块边界永远是"完整的字节"，不需要处理"半个字符"。
 *    · **二进制协议**：自定义帧协议（魔数 + 长度 + 负载 + 校验和）必须按字节解析，
 *      字节流能保证你拿到的是字节而不是"某个被顺手转换过的值"。
 *    · **背压必须按字节算**：处理二进制时，"1MB 的一块"和"1 字节的一块"对内存的含义
 *      差了六个数量级。用块数当水位，等于让背压形同虚设（本篇会实测给你看）。
 *    · **什么时候**不用**字节流**：消息类数据（聊天消息、JSON 事件、行情 tick）
 *      用默认流更自然 —— 直接把对象 enqueue 进去就行，不需要自己序列化再解析。
 *
 * 3. 核心语法要点
 *    (a) **创建字节流**：
 *          new ReadableStream({ type: 'bytes', pull(controller) { ... } }, { highWaterMark: 65536 })
 *        注意三点：
 *          · `type: 'bytes'` 是**唯一的**内置类型，写错会抛 RangeError；
 *          · 只能 `controller.enqueue(view)`（`ArrayBufferView`，如 Uint8Array）；
 *          · **排队策略不能带 `size` 函数** —— 所以
 *            `new CountQueuingStrategy({...})` 和 `new ByteLengthQueuingStrategy({...})` **都会抛错**，
 *            只能写成裸对象 `{ highWaterMark: N }`。这一点非常反直觉，本篇会实测。
 *    (b) **BYOB 读取**：
 *          const reader = stream.getReader({ mode: 'byob' });   // 必须显式指定 mode
 *          const { value, done } = await reader.read(new Uint8Array(65536));
 *          // value 是一块**填好数据的** Uint8Array（长度 ≤ 传入的长度）
 *        **关键陷阱**：传进去的那个 `Uint8Array` 会被**转移（detach）**——
 *        它的 `byteLength` 会变成 0，不能再用；下一次读取要传 `result.value`
 *        （返回值本身可以继续当缓冲区用）。
 *    (c) **源侧配合 BYOB**：
 *          pull(controller) {
 *            const request = controller.byobRequest;     // 可能为 null
 *            if (request) {
 *              const view = request.view;                 // 消费者递过来的缓冲区
 *              const n = fillFromSomewhere(view);         // 直接往里写！
 *              request.respond(n);                        // 告知写了多少字节
 *            } else {
 *              controller.enqueue(new Uint8Array([...])); // 消费者没用 BYOB 时走这条路
 *            }
 *          }
 *        `byobRequest` 的三种取值要分清：
 *          · 默认流：永远是 `undefined`；
 *          · 字节流 + 没有待处理的 BYOB 请求：`null`；
 *          · 字节流 + 有待处理的请求：一个 `ReadableStreamBYOBRequest` 对象。
 *        `respond(bytesWritten)` 表示"我写了这么多"；
 *        若你换了一块内存来写，则用 `respondWithNewView(newView)`。
 *    (d) **两条读取路径可以混用**：同一个字节流，既可以被 `getReader()` 普通读取
 *        （拿到的是 Uint8Array），也可以被 `getReader({mode:'byob'})` 读。
 *        但**不能同时**两个 reader（流是单锁的，见 04 篇）。
 *    (e) **ByteLengthQueuingStrategy 的正确用法**：
 *          new ReadableStream({ pull(...) {...} }, new ByteLengthQueuingStrategy({ highWaterMark: 1024 * 1024 }))
 *        它给**默认流 + Uint8Array chunk** 用：`size(chunk)` 返回 `chunk.byteLength`，
 *        于是水位按**字节总量**算。用来替代"按块数算"的 CountQueuingStrategy。
 *
 * 4. 常见陷阱
 *    - **漏写 `type: 'bytes'`**（本篇实测最值得警惕的一条）：你写好了一个"按字节限流"的流，
 *      但忘了写 `type: 'bytes'`，它就变成了默认流，`highWaterMark` 的含义从"字节"变成"块"。
 *      **代码能跑、不报错、单测大概率也能过**，只是内存占用比预期大两个数量级，
 *      直到线上 OOM 才暴露。同一个数字 `300`，一边是 300 字节，一边是 300 块。
 *    - **拿 `CountQueuingStrategy` 配字节流**：直接抛
 *      `RangeError: The property 'strategy.size' is invalid`。
 *      规范规定字节流的 strategy 里 `size` 必须为 undefined —— 因为字节流自己就是用字节计量的，
 *      再给一个 size 就冲突了。**字节流只能传 `{ highWaterMark: N }`**，而 N 的单位是字节。
 *    - **拿 `ByteLengthQueuingStrategy` 配字节流**：同上，一样抛错。
 *      它不是"字节流专用策略"，而是"给默认流按字节算水位"的策略 —— 名字很容易误导。
 *    - **以为 `byteLength` 水位能挡住大块**：`highWaterMark` 是**期望值**不是硬上限
 *      （04 篇陷阱 6）。一个 1MB 的块塞进 `highWaterMark: 4096` 的队列里不会报错，
 *      只是 `desiredSize` 一下变成 -1044480，让生产者在**下一块**之前停下。
 *      所以第一块大内存是免不了的，能挡住的是"继续积压"。
 *    - **BYOB 用完传入的 buffer 还继续用它**：会被 detach（`byteLength` 变 0），
 *      之后任何读写都会抛 `TypeError: Cannot perform ... on a detached ArrayBuffer`。
 *      正确做法：`let buf = new Uint8Array(N); for(;;){ const r = await reader.read(buf); ...; buf = r.value; }`。
 *    - **在 pull 里对默认流访问 `byobRequest` 并当成 null 判断**：
 *      默认流给的是 `undefined`，`request ? ... : ...` 能工作，
 *      但 `request === null` 的判断会漏掉。用 `if (request)` 更稳。
 *    - **以为字节流会自动帮你切块**：它保证"chunk 是字节"，但**不保证块边界**
 *      （跟默认流一样，网络来的数据怎么切全看运气）。要按消息切分仍然得靠
 *      TransformStream + 边界缓冲（见 05 篇的行切分器）。
 *    - **enqueue 一个非 ArrayBufferView**：`controller.enqueue('字符串')` 会抛
 *      `TypeError: This ReadableStream did not expect to be read as a byte stream...`
 *      报错信息会告诉你"stream 是 byte stream，但收到的是 string"。
 *    - **忘记 `respond()`**：源侧拿了 `byobRequest` 却不调 `respond`，
 *      读取方的 `read()` 会**永远挂着**（不报错、不超时）。
 *      这是字节流里最容易写出死锁的地方 —— `respond` 是"我这次写完了"的信号。
 *    - **`respond(0)` 用错**：写 0 字节是合法的（表示"暂时没数据"），
 *      但它会立刻交还控制权；真正"没有更多数据了"要用 `controller.close()`。
 *    - **在 `pull` 里同步地 `respond` 后又 `close`**：可以先 respond 再 close，
 *      但要保证最后一次 respond 之后不再写 —— 顺序错了会抛
 *      "The byob request is already responded to"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 36_realtime_and_streams/09_byte_streams.js
 *   纯内存 + 一个本机 127.0.0.1 的自建 HTTP 服务，**不访问外网**。
 *   为了观察背压，示例里会让"没人消费"的状态持续一小会儿（80ms 量级）。
 *   收尾时调用 `server.closeAllConnections()` —— 用了 Node 内置 fetch（keep-alive 连接池）
 *   就必须这么做，否则 `server.close()` 的回调不触发、进程会挂住。
 *
 * 【预期输出】
 *   1) 默认流与字节流的差异对照表；
 *   2) 实测：字节流**不能**配带 size 的策略 —— Count / ByteLength 两种都抛 RangeError；
 *   3) 实测：字节流的 highWaterMark 单位是**字节**（desiredSize 每次减 100）；
 *      以及**漏写 `type: "bytes"` 的后果** —— 同一份代码瞬间退化成默认流，
 *      水位从"300 字节"变成"300 块"，积压量差了两个数量级（本文件实测 300B -> 30KB）；
 *   4) 实测对比 CountQueuingStrategy 与 ByteLengthQueuingStrategy 的背压差异 ——
 *      同样的"前 3 块 1MB、之后每块 1 字节"的生产者，一个积压 4MB，一个只积压 1MB；
 *   5) BYOB 完整流程：byobRequest 的三种取值、respond()、传入 buffer 被 detach 的真实现象；
 *   6) 真的从 HTTP 响应体（字节流）里用 BYOB 读数据，并对比两种读法的分配次数；
 *   7) 什么时候用字节流、什么时候用默认流的决策表；
 *   8) 小结。全程退出码 0。
 * ============================================================================
 */

import http from 'node:http';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 按"显示宽度"补空格（中文占 2 列），只为了终端里对齐好看。 */
const displayWidth = (s) => [...s].reduce((w, ch) => w + (/[一-鿿＀-￯]/.test(ch) ? 2 : 1), 0);
const padLabel = (s, width) => s + ' '.repeat(Math.max(0, width - displayWidth(s)));

/** 把字节数变成好读的形式。 */
const bytesText = (n) =>
  n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(2)} MB` : n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`;

/** 最外层兜底，保证脚本最坏情况下也能以退出码 0 结束。 */
setTimeout(() => {
  console.log('\n[安全兜底] 进程仍未退出，强制结束（正常流程不应触发）。');
  process.exit(0);
}, 15_000).unref();

// ===========================================================================
console.log('--- 1. 默认流与字节流：差在三条根本设计上 ---');
// ===========================================================================
const streamDiff = [
  ['创建方式', 'new ReadableStream({ pull })', "new ReadableStream({ type: 'bytes', pull })"],
  ['chunk 能装什么', '任意 JS 值（对象/字符串/数字/TypedArray…）', '**只能是 ArrayBufferView**（Uint8Array 等）'],
  ['highWaterMark 的单位', '**块数**（默认 1）', '**字节数**（默认 0）'],
  ['排队策略', 'CountQueuingStrategy / ByteLengthQueuingStrategy / 裸对象', '**只能给裸对象 { highWaterMark }**（见小节 2）'],
  ['支不支持 BYOB', '不支持（byobRequest 是 undefined）', '**支持**（byobRequest 是 null 或请求对象）'],
  ['读取器', 'getReader() / for await / pipeTo', 'getReader({ mode: "byob" }) 也可以'],
  ['典型场景', '消息、事件、JSON、业务对象', '文件、压缩、二进制协议、网络字节流'],
];
for (const [dim, def, byte] of streamDiff) {
  console.log(`  ${padLabel(dim, 22)}| 默认流: ${def}`);
  console.log(`  ${' '.repeat(22)}| 字节流: ${byte}`);
}

console.log('\n  先直观感受一下"chunk 类型"的限制：');
try {
  const bad = new ReadableStream({ type: 'bytes', pull(c) { c.enqueue('我是字符串'); } });
  await bad.getReader().read();
  console.log('    往字节流里 enqueue 字符串：居然成功了？');
} catch (err) {
  console.log(`    往字节流里 enqueue 字符串 -> ✗ ${err.name}`);
  console.log(`      ${String(err.message).split('\n')[0]}`);
}
const okByteStream = new ReadableStream({ type: 'bytes', start(c) { c.enqueue(new Uint8Array([1, 2, 3])); c.close(); } });
const okRead = await okByteStream.getReader().read();
console.log(`    往字节流里 enqueue Uint8Array -> ✓ 读到 ${okRead.value.constructor.name} [${[...okRead.value]}]`);

console.log('\n  再感受一下"默认流不支持 BYOB"：');
try {
  new ReadableStream({ pull(c) { c.enqueue('x'); } }).getReader({ mode: 'byob' });
  console.log('    默认流 getReader({mode:"byob"})：居然成功了？');
} catch (err) {
  console.log(`    默认流 getReader({mode:"byob"}) -> ✗ ${err.name}`);
  console.log(`      ${String(err.message).split('\n')[0]}`);
  console.log('      （这条报错信息里会带上 supportsBYOB: false，是快速判断流类型的线索。）');
}
// 默认流的 byobRequest 是 undefined（不是 null！）
const defaultStreamProbe = new ReadableStream({
  pull(c) {
    console.log(`    默认流的 controller.byobRequest = ${String(c.byobRequest)}（typeof = ${typeof c.byobRequest}）`);
    c.enqueue('x');
    c.close();
  },
});
await defaultStreamProbe.getReader().read();
console.log('     注意是 **undefined** 而不是 null —— 判断时用 `if (controller.byobRequest)` 最稳。');

// ===========================================================================
console.log('\n--- 2. 实测：字节流**不能**配任何带 size 的排队策略 ---');
// ===========================================================================
console.log('  这一条在文档里不显眼，但踩上去就报错，所以直接跑给你看：');
const strategyCases = [
  ['不传策略（默认）', undefined],
  ['裸对象 { highWaterMark: 8 }', { highWaterMark: 8 }],
  ['new CountQueuingStrategy({ highWaterMark: 8 })', new CountQueuingStrategy({ highWaterMark: 8 })],
  ['new ByteLengthQueuingStrategy({ highWaterMark: 8 })', new ByteLengthQueuingStrategy({ highWaterMark: 8 })],
];
for (const [label, strategy] of strategyCases) {
  try {
    const s = new ReadableStream(
      { type: 'bytes', start(c) { c.enqueue(new Uint8Array([1])); c.close(); } },
      strategy,
    );
    const r = await s.getReader().read();
    console.log(`    ${padLabel(label, 48)}-> ✓ 成功（读到 ${r.value.byteLength} 字节）`);
  } catch (err) {
    console.log(`    ${padLabel(label, 48)}-> ✗ ${err.name}: ${String(err.message).split('\n')[0]}`);
  }
}
console.log('\n  原因（规范层面的设计）：');
console.log('    · 字节流的队列**本身就是按字节计量的**，不需要 size 函数告诉它"这一块算多少"；');
console.log('    · 所以规范要求字节流的 strategy 里 `size` **必须是 undefined**，');
console.log('      一旦定义了 size（CountQueuingStrategy 和 ByteLengthQueuingStrategy 都定义了），就直接抛 RangeError。');
console.log('    · 结论：**名字叫 ByteLengthQueuingStrategy，但它不是给字节流用的** ——');
console.log('      它是给"默认流 + Uint8Array chunk"用的（见小节 4）。这个命名确实容易误导。');

console.log('\n  字节流的 highWaterMark 单位是"字节"（默认 0）。跑两组实验确认：');

// ---- ① 正确写法：带 type: 'bytes' ----
console.log('\n  ① `new ReadableStream({ type: "bytes", pull }, { highWaterMark: 300 })`');
console.log('     每块 100 字节、没人消费时：');
let correctPulls = 0;
new ReadableStream(
  {
    type: 'bytes',
    pull(c) {
      correctPulls += 1;
      console.log(`     [pull ${correctPulls}] desiredSize = ${c.desiredSize} 字节`);
      if (correctPulls > 10) {
        c.close();
        return;
      }
      c.enqueue(new Uint8Array(100));
    },
  },
  { highWaterMark: 300 },
);
await sleep(40);
console.log(`     -> desiredSize 每次**减 100**，pull 到 ${correctPulls} 次就停了（队列里 300 字节）。`);
console.log('        这说明字节流的水位**确实是按字节算的**。');

// ---- ② 漏写 type: 'bytes' 会怎样 ----
console.log('\n  ② 只把 `type: "bytes"` 漏掉，其它一字不改：');
console.log('     `new ReadableStream({ pull }, { highWaterMark: 300 })`  <- 变成了**默认流**');
let forgotPulls = 0;
new ReadableStream(
  {
    pull(c) {
      forgotPulls += 1;
      if (forgotPulls <= 4) console.log(`     [pull ${forgotPulls}] desiredSize = ${c.desiredSize}`);
      if (forgotPulls > 400) {
        c.close();
        return;
      }
      c.enqueue(new Uint8Array(100));
    },
  },
  { highWaterMark: 300 },
);
await sleep(40);
console.log(`     -> desiredSize 每次只**减 1**，pull 一直跑到 ${forgotPulls} 次才停。`);
console.log(`        队列里积压了 ${bytesText(forgotPulls * 100)}，是预期（300 字节）的 ${Math.round((forgotPulls * 100) / 300)} 倍。`);
console.log('     **同一个数字 300，含义从"300 字节"悄悄变成了"300 块"。**');
console.log('     这是字节流里最隐蔽的一类 bug：代码能跑、不报错、单测也能过，');
console.log('     只是内存占用比预期大两个数量级 —— 直到线上 OOM 才被发现。');

console.log('\n  所以字节流的两个要点：');
console.log('    · 水位单位是**字节**（这条要靠 `type: "bytes"` 才成立，漏写就退化成"块数"）；');
console.log('    · 排队策略只能给裸对象 `{ highWaterMark: N }`，N 是字节数；');
console.log('      想让消费者也参与字节计量，就用 BYOB 读法（小节 4），那条路线计量最直接。');
console.log('    · 兜底建议：把 `type: "bytes"` 写进代码评审清单 —— 它是这个 API 唯一的类型标记，');
console.log('      漏掉不会有任何报错，只会让水位含义悄悄变化。');

// ===========================================================================
console.log('\n--- 3. ByteLengthQueuingStrategy vs CountQueuingStrategy：背压实测 ---');
// ===========================================================================
console.log('  场景：生产者产出的块**大小极不均匀** —— 前 3 块各 1MB，之后每块 1 字节。');
console.log('        （真实世界：视频关键帧 + 后续小分片、日志突发 + 常规行、压缩块 + 末段残块）');
console.log('  问题：完全没人消费时，生产者会往内存里积压多少？');
console.log('');

/**
 * 造一个"块大小极不均匀"的生产者。
 * @param {object} strategy 排队策略
 * @returns {{ stream: ReadableStream, stats: () => { pulls: number, bytes: number } }}
 */
function makeLopsidedProducer(strategy) {
  let pulls = 0;
  let bytes = 0;
  const stream = new ReadableStream(
    {
      pull(controller) {
        pulls += 1;
        const size = pulls <= 3 ? 1024 * 1024 : 1; // 前 3 块 1MB，之后 1 字节
        controller.enqueue(new Uint8Array(size));
        bytes += size;
      },
    },
    strategy,
  );
  return { stream, stats: () => ({ pulls, bytes }) };
}

// ---- 3a. 用 CountQueuingStrategy：水位是"4 块" ----
const countProducer = makeLopsidedProducer(new CountQueuingStrategy({ highWaterMark: 4 }));
await sleep(80); // 关键：**一块都不读**，看生产者能跑多远
const countStats = countProducer.stats();
console.log(`  ① CountQueuingStrategy({ highWaterMark: 4 })  —— 水位是"4 **块**"`);
console.log(`     没人读的这 80ms 里，生产者 pull 了 ${countStats.pulls} 次，往内存里积压了 ${bytesText(countStats.bytes)}`);
console.log(`     它老老实实遵守了"${countStats.pulls} 块"的约定 —— 但这几块是 1MB 级的，加起来就是 ${bytesText(countStats.bytes)} 内存。`);
console.log('     而且这个上限**跟块大小完全脱钩**：如果每块是 100MB，那 4 块就是 400MB。');
await countProducer.stream.cancel('演示结束');

// ---- 3b. 用 ByteLengthQueuingStrategy：水位是"4096 字节" ----
const byteProducer = makeLopsidedProducer(new ByteLengthQueuingStrategy({ highWaterMark: 4096 }));
await sleep(80);
const byteStats = byteProducer.stats();
console.log(`\n  ② ByteLengthQueuingStrategy({ highWaterMark: 4096 })  —— 水位是"4096 **字节**"`);
console.log(`     同样没人读，生产者只 pull 了 ${byteStats.pulls} 次，积压了 ${bytesText(byteStats.bytes)}`);
console.log('     第一块 1MB 一进来，desiredSize 立刻变成 4096 - 1048576 = -1044480（负数 = 超出水位），');
console.log('     于是 pull() 不再被调用 —— 生产者被按住了。');
console.log(`     对比：${bytesText(countStats.bytes)}  vs  ${bytesText(byteStats.bytes)}，相差约 ${(countStats.bytes / byteStats.bytes).toFixed(0)} 倍。`);
await byteProducer.stream.cancel('演示结束');

console.log('\n  结论：');
console.log('    · 处理**二进制**、且块大小可能很不均匀时，水位必须按**字节数**算，');
console.log('      否则"1MB 的块"和"1 字节的块"都算 1，背压形同虚设 —— 这正是 issue 里说的那个问题。');
console.log('    · API 名字里的 ByteLength 说的是"用 chunk.byteLength 当 size"，');
console.log('      所以它配的是**默认流**（chunk 是 Uint8Array 的那种），不是 `type: "bytes"` 的字节流。');
console.log('    · `highWaterMark` 只是**期望值**，不是硬上限 ——');
console.log('      第一块 1MB 还是进来了（挡不住已经产生的块），它挡住的是"继续积压更多块"。');

console.log('\n  什么时候 CountQueuingStrategy 就够用？—— 块大小**均匀**的时候：');
let uniformCountPulls = 0;
const uniformCount = new ReadableStream(
  {
    pull(c) {
      uniformCountPulls += 1;
      c.enqueue(new Uint8Array(1024)); // 每块都恰好 1KB
    },
  },
  new CountQueuingStrategy({ highWaterMark: 4 }),
);
await sleep(50);
console.log(`    每块固定 1KB + 水位 4 块 -> 积压 ${uniformCountPulls} 块 = ${bytesText(uniformCountPulls * 1024)}`);
console.log('    块大小固定时，"4 块"和"4096 字节"是等价的，用哪个都行。');
console.log('    但**只要块大小可能变化，就该用字节水位** —— 均匀是巧合，不均匀才是常态。');
await uniformCount.cancel('演示结束');

// ===========================================================================
console.log('\n--- 4. BYOB：让生产者直接写进消费者的缓冲区 ---');
// ===========================================================================
console.log('  先看普通读法和 BYOB 读法的内存行为差别：');
console.log('    普通读法：生产者 enqueue(新分配的 Uint8Array) -> 消费者拿到它（每块一次分配）');
console.log('    BYOB    ：消费者把 Uint8Array 递过去 -> 生产者直接往里写（缓冲区可重复使用）');
console.log('');
console.log('  下面这个字节流模拟"从某个设备读数据"，它优先走 BYOB 路径：');

/** 源侧要写的"数据源"：一段固定的字节序列（每个实验都要一份新的流，所以做成工厂）。 */
const SOURCE_BYTES = new Uint8Array(64);
for (let i = 0; i < SOURCE_BYTES.length; i += 1) SOURCE_BYTES[i] = (i * 7 + 1) & 0xff;

/**
 * 造一个"设备读取"风格的字节流：优先走 BYOB 路径，退回到 enqueue 也能工作。
 * @returns {{ stream: ReadableStream, stats: { byobPath: number, enqueuePath: number } }}
 */
function makeDeviceStream() {
  let offset = 0;
  // 记录 BYOB 路径被走了几次、enqueue 回退路径被走了几次
  const stats = { byobPath: 0, enqueuePath: 0 };
  const stream = new ReadableStream(
    {
      type: 'bytes',
      pull(controller) {
        const request = controller.byobRequest; // ★ 字节流专属：消费者递过来的缓冲区
        if (!request) {
          // 消费者没用 BYOB（用的普通 reader / for await）时，只能自己分配再 enqueue
          stats.enqueuePath += 1;
          if (offset >= SOURCE_BYTES.length) {
            controller.close();
            return;
          }
          const end = Math.min(offset + 16, SOURCE_BYTES.length);
          controller.enqueue(SOURCE_BYTES.slice(offset, end));
          offset = end;
          if (offset >= SOURCE_BYTES.length) controller.close();
          return;
        }
        // ★ BYOB 路径：直接往消费者给的缓冲区里写
        stats.byobPath += 1;
        const view = request.view; // 一个 Uint8Array，长度 = 消费者请求的长度
        const n = Math.min(view.byteLength, SOURCE_BYTES.length - offset);
        view.set(SOURCE_BYTES.subarray(offset, offset + n));
        offset += n;
        request.respond(n); // 必须调用！否则消费者的 read() 会永远挂着
        if (offset >= SOURCE_BYTES.length) controller.close();
      },
    },
    { highWaterMark: 0 }, // 字节流的 highWaterMark 单位是字节；给 0 表示"完全按需生产"
  );
  return { stream, stats };
}

const deviceA = makeDeviceStream();
const byteStream = deviceA.stream;
const byobStats = deviceA.stats;

console.log(`  数据源共 ${SOURCE_BYTES.length} 字节。先确认 byobRequest 的三种取值：`);
console.log(`    · 默认流                    -> undefined（无论何时）`);
console.log(`    · 字节流、没有 BYOB 请求    -> null`);
console.log(`    · 字节流、有 BYOB 请求      -> ReadableStreamBYOBRequest 对象（下面就会看到）`);

console.log('\n  ① 用 BYOB 读取器读：');
const byobReader = byteStream.getReader({ mode: 'byob' });
let buffer = new Uint8Array(16); // 我们自己的缓冲区，准备让它被复用
const collected = [];
for (let round = 1; ; round += 1) {
  const { value, done } = await byobReader.read(buffer);
  if (done) {
    console.log(`     第 ${round} 次 read() -> done: true`);
    break;
  }
  collected.push(...value);
  console.log(
    `     第 ${round} 次 read() -> 拿到 ${value.byteLength} 字节，前 4 个是 [${[...value.subarray(0, 4)].join(', ')}]`,
  );
  // ★ 关键现象：传进去的 buffer 已经被 detach 了（byteLength 变成 0）
  if (round === 1) {
    console.log(`       **传入的那个 buffer 现在 byteLength = ${buffer.byteLength}**（被 detach 了！）`);
    console.log('       规范会把传进来的 buffer 转移到流内部，返回的是"同一份数据的新视图"，');
    console.log('       所以那个变量不能再用了 —— 必须用返回值继续读。');
  }
  buffer = value; // 复用返回的缓冲区：这正是 BYOB 省内存的地方
}
console.log(`     读到的前 8 个字节：[${collected.slice(0, 8).join(', ')}]，共 ${collected.length} 字节`);
console.log(`     与原数据一致？ ${collected.length === SOURCE_BYTES.length && collected.every((b, i) => b === SOURCE_BYTES[i])}`);
console.log(`     统计：BYOB 路径走了 ${byobStats.byobPath} 次，enqueue 回退路径走了 ${byobStats.enqueuePath} 次`);
byobReader.releaseLock(); // 读到 done **不代表**自动解锁；不释放的话下一个 getReader() 会抛 "ReadableStream is locked"
console.log('     （读完必须 releaseLock()：读到 done 不会自动解锁，见 04 篇陷阱 1。）');
console.log('     —— 源侧**没有为每块新分配内存**：它直接往消费者递过来的视图里写。');
console.log('        真正由消费者掌握的只有"我准备一次处理多少字节"（这里是 16），');
console.log('        峰值内存因此由这个数字决定，而不是由"一块数据到底有多大"决定。');

console.log('\n  ② 换一条同样的流、改用普通读取器，源侧就只能自己分配再 enqueue 了：');
const deviceB = makeDeviceStream();
const plainReader = deviceB.stream.getReader();
let plainBytes = 0;
let plainChunks = 0;
for (;;) {
  const { value, done } = await plainReader.read();
  if (done) break;
  plainChunks += 1;
  plainBytes += value.byteLength;
}
console.log(`     普通读取器读了 ${plainChunks} 块、共 ${plainBytes} 字节`);
console.log(`     统计：BYOB 路径 ${deviceB.stats.byobPath} 次，enqueue 回退路径 ${deviceB.stats.enqueuePath} 次`);
console.log('     —— 走的全是 enqueue，源侧每次都要**新分配一块内存**。');
console.log('     这就是源侧必须同时处理两条路径的原因：同一个流可能被任何读法消费，');
console.log('     你没法假设"调用方一定会用 BYOB"。');

console.log('\n  ③ 反面教材：源侧拿了 byobRequest 却忘记 respond()');
const stuckStream = new ReadableStream({
  type: 'bytes',
  pull(controller) {
    const request = controller.byobRequest;
    if (request) {
      // 故意只写不 respond —— 消费者的 read() 会永远挂着
      request.view.set([9, 9, 9]);
      console.log('     源侧往缓冲区写了 3 字节，但**没有调用 respond()**');
      return;
    }
    controller.enqueue(new Uint8Array([9]));
  },
});
const stuckReader = stuckStream.getReader({ mode: 'byob' });
let stuckResolved = false;
stuckReader.read(new Uint8Array(8)).then(() => (stuckResolved = true));
await sleep(80);
console.log(`     80ms 后，read() 完成了吗？ ${stuckResolved}  <- **永远挂着，不报错、不超时**`);
console.log('     respond() 是"我这次写完了"的信号，漏掉它就是字节流里最常见的死锁。');
console.log('     真正"没有更多数据"要用 controller.close()，而不是一直不 respond。');
await stuckReader.cancel('演示结束，避免悬挂的 Promise 影响进程退出').catch(() => {});

// ===========================================================================
console.log('\n--- 5. 实战：从 HTTP 响应体里用 BYOB 读数据 ---');
// ===========================================================================
// fetch 的 response.body 就是一个**字节流**（supportsBYOB = true），所以可以直接 BYOB 读。
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
  const payload = Buffer.alloc(4096, 0x41); // 4KB 的 'A'
  res.end(payload);
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const PORT = server.address().port;
const URL = `http://127.0.0.1:${PORT}/file`;
console.log(`  服务端已监听 http://127.0.0.1:${PORT}（GET /file 返回 4KB 数据）`);

console.log('\n  ① 普通读法（每块一块新内存）：');
{
  const res = await fetch(URL);
  const reader = res.body.getReader();
  let chunks = 0;
  let bytes = 0;
  const allocations = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks += 1;
    bytes += value.byteLength;
    allocations.push(value.byteLength);
  }
  console.log(`     读了 ${chunks} 块、${bytes} 字节；每次 read() 返回的都是流内部**新分配**的 Uint8Array`);
  console.log(`     各块长度：${allocations.slice(0, 8).join(', ')}${allocations.length > 8 ? ' …' : ''}`);
}

console.log('\n  ② BYOB 读法（复用同一块缓冲区）：');
{
  const res = await fetch(URL);
  // response.body 是字节流，所以可以直接开 byob 模式
  const reader = res.body.getReader({ mode: 'byob' });
  let buffer = new Uint8Array(64); // 只准备 64 字节的缓冲区
  const lengths = [];
  let bytes = 0;
  const buffersSeen = new Set();
  for (;;) {
    const { value, done } = await reader.read(buffer);
    if (done) break;
    lengths.push(value.byteLength);
    bytes += value.byteLength;
    // 记录"这块数据来自哪个 ArrayBuffer 对象"，观察复用情况
    buffersSeen.add(value.buffer);
    buffer = value; // 复用返回的视图继续读
  }
  console.log(`     用 64 字节的缓冲区读了 ${lengths.length} 次、共 ${bytes} 字节`);
  console.log(`     各次长度：${lengths.slice(0, 8).join(', ')}${lengths.length > 8 ? ' …' : ''}（都被限制在 64 字节以内）`);
  console.log(`     期间出现过的不同 ArrayBuffer 对象数：${buffersSeen.size}（read 了 ${lengths.length} 次）`);
  console.log('     —— 每次 read() 都只填 64 字节，**一次处理的数据量由我们说了算**。');
  console.log('');
  console.log('     这里必须说清楚一个容易夸大的点：BYOB 的收益是"**数据只被写一次**"，');
  console.log('     而不是"内存零分配"。规范为了安全，每次 read(view) 都会把传入的 buffer');
  console.log('     **转移（detach）**走，引擎需要为此准备一块等长的缓冲区 ——');
  console.log(`     所以上面 ${lengths.length} 次 read 仍然对应 ${buffersSeen.size} 个不同的 ArrayBuffer 对象。`);
  console.log('     真正稳定拿到的好处是：');
  console.log('       · 源侧不必"自己分配一块 → 消费者再拷一次"，少了中间那一份数据；');
  console.log('       · 峰值内存由**消费者给的缓冲区大小**决定，而不是由单块数据的最大长度决定；');
  console.log('       · 消费者可以精确控制"我一次愿意处理多少字节"。');
  console.log('     要判断具体运行时是否真的复用了底层内存，**只能实测** —— 别信文档里的"零拷贝"三个字。');
}
console.log('\n  什么时候**不能**用 BYOB：');
console.log('    · 你要的是对象/字符串（用默认流，或者先 pipeThrough(new TextDecoderStream())）；');
console.log('    · 你只想 for await 逐块处理、不关心分配（代码简洁优先时）；');
console.log('    · 流不是字节流（普通 reader 会抛 TypeError，见小节 1）。');
console.log('    注意：BYOB 读到的仍然是**任意切分**的字节块，块边界不保证落在消息边界上 ——');
console.log('          要按协议切分仍然得用 05 篇的行切分器/帧解析器。');

// ===========================================================================
console.log('\n--- 6. 决策表：什么时候用字节流，什么时候用默认流 ---');
// ===========================================================================
const decisionRows = [
  ['数据本质', '二进制：文件、图片、压缩包、音视频、二进制协议帧', '结构化：对象、JSON 消息、事件、任何 JS 值'],
  ['用哪种流', "new ReadableStream({ type: 'bytes' })", 'new ReadableStream({ pull })（默认流）'],
  ['水位策略', '裸对象 { highWaterMark: N }，N 是**字节数**', 'CountQueuingStrategy（块数）或 ByteLengthQueuingStrategy（字节）'],
  ['水位建议值', '65536（64KB）起，按单块最大长度调整', '按"积压几块"设，1~16 之间比较常见'],
  ['想省内存', '**用 BYOB** 复用缓冲区', '不适用（对象本来就各有各的生命周期）'],
  ['想按消息切分', '还要自己加边界缓冲（05 篇的行切分器）', '直接 enqueue 一个完整对象即可，不用切'],
  ['要转成文本', 'pipeThrough(new TextDecoderStream())', '本来就是字符串，无需转换'],
  ['典型 API', 'fetch 的 response.body、DecompressionStream 输出', 'ReadableStream.from(数组/生成器)、业务事件流'],
];
for (const [dim, byte, def] of decisionRows) {
  console.log(`  ${padLabel(dim, 14)}| 字节流: ${byte}`);
  console.log(`  ${' '.repeat(14)}| 默认流: ${def}`);
}
console.log('\n  一句话：**管道里跑的是"字节"就用字节流，跑的是"东西"就用默认流。**');
console.log('  拿不准的时候问自己："我需要担心内存里的字节总数吗？"');
console.log('  需要 -> 字节流 / ByteLengthQueuingStrategy；不需要 -> 默认流怎么顺手怎么来。');

// ===========================================================================
console.log('\n--- 7. 收尾 ---');
// ===========================================================================
server.closeAllConnections(); // 必须：Node 内置 fetch 的 keep-alive 连接池会吊住 close()
await new Promise((resolve) => server.close(resolve));
console.log('  服务端已关闭（先 closeAllConnections() 再 close()）。');

console.log('\n--- 8. 小结 ---');
const summary = [
  '1) 字节流与默认流的三条根本差异：chunk 只能是 ArrayBufferView、水位按**字节**计量、支持 BYOB。',
  '2) 字节流的排队策略**不能带 size 函数** —— CountQueuingStrategy 和 ByteLengthQueuingStrategy',
  '   配字节流都会抛 RangeError（实测）。字节流只能写 `{ highWaterMark: N }`，N 的单位是字节。',
  '3) **ByteLengthQueuingStrategy 是给默认流用的**（size = chunk.byteLength），名字容易误导。',
  '   处理二进制时按字节算水位才正确：块大小不均匀时，按块数算会让背压形同虚设。',
  '   实测：前 3 块 1MB 的生产者，按块数水位积压了 4MB，按字节水位只积压了 1MB，差 4 倍。',
  '4) highWaterMark 是**期望值不是硬上限**：第一块超大 chunk 照样进得来，',
  '   它挡住的是"继续积压更多块"。',
  '5) BYOB 的完整流程：getReader({ mode: "byob" }) -> read(myBuffer) ->',
  '   源侧 controller.byobRequest.view 直接写 -> byobRequest.respond(n) -> 消费者拿到填好的视图。',
  '6) byobRequest 的三种取值：默认流 undefined、字节流无请求 null、字节流有请求 请求对象。',
  '   判断用 `if (request)`；源侧必须同时处理 enqueue 回退路径（消费者可能不用 BYOB）。',
  '7) **传进 read() 的 buffer 会被 detach**（byteLength 变 0），必须用返回值继续读；',
  '   这就是缓冲区能被复用的机制。',
  '8) 漏调 respond() 会让消费者的 read() **永远挂着**（不报错、不超时）—— 字节流里最常见的死锁。',
  '9) 字节流保证"chunk 是字节"，但**不保证块边界** —— 按协议切分仍然要靠 05 篇的边界缓冲。',
  '10) 选型一句话：跑"字节"用字节流（重内存就用 BYOB），跑"东西"用默认流。',
];
for (const line of summary) console.log(`  ${line}`);
