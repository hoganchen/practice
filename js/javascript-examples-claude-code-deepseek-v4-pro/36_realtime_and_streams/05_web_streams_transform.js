/**
 * ============================================================================
 * 知识点：TransformStream 与管道 —— pipeThrough、分块切分与背压传导
 * ============================================================================
 *
 * 【所属分类】36_realtime_and_streams —— 实时通信与流式处理
 * 【难度等级】高级
 * 【前置知识】36_realtime_and_streams/04_web_streams_readable.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    TransformStream 是 Web Streams 的第三件套：它**同时是一个可写流和一个可读流**。
 *    你往它的 writable 端写数据，它在中间做转换，从 readable 端吐出转换后的数据。
 *    直观理解就是一个"加工管道"：
 *
 *        上游 ReadableStream --pipeThrough--> [TransformStream] --pipeThrough--> [TransformStream] --> 下游
 *                                              writable | readable
 *
 *    它的构造函数接收两个东西：
 *      · transformer 对象，三个可选钩子：
 *          start(controller)              建流时调用一次，做初始化
 *          transform(chunk, controller)   每来一块数据调用一次 —— 转换逻辑写这里
 *          flush(controller)              上游关闭时调用一次 —— 收尾（吐出缓冲区残余）
 *      · 队列策略 { writableHighWaterMark, readableHighWaterMark }
 *        （注意这两个名字和 ReadableStream 的构造参数不同，没有 writableStrategy 包一层）
 *
 * 2. 为什么需要（真实项目场景）
 *    · 解压/解密的流式处理：gzip 流 -> TransformStream 解压 -> 输出
 *    · 换行/分隔符切分：把字节流切成"一行行"，这是日志解析、NDJSON、SSE 解析的地基
 *    · AI 流式输出的增量解析：拿到的是半截 JSON/半截 Markdown，必须缓冲到完整再处理
 *    · 脱敏/限流/统计：在管道中间插一层，不改变上下游的代码
 *    · 编解码：TextDecoderStream / TextEncoderStream / CompressionStream 都是
 *      标准库提供的现成 TransformStream
 *    它的价值在于**可组合**：每个转换器只关心"进来一块，出去一块"，
 *    工程师可以把整条数据处理链路像积木一样拼起来，还能随时插一个统计用的转换器。
 *
 * 3. 核心语法要点
 *    - new TransformStream(transformer?, writableStrategy?, readableStrategy?)
 *      或者简写 new TransformStream({ writableHighWaterMark, readableHighWaterMark })
 *    - ts.writable / ts.readable                  拿到两端
 *    - stream.pipeThrough(ts)                     最常用：把可读流接到转换器，返回新的可读流
 *    - stream.pipeTo(writable)                    把可读流接到一个可写流，返回 Promise
 *    - controller.enqueue(chunk)                  transform/flush 里往可读端放数据
 *    - controller.terminate()                     在 transform 里提前结束可读端（丢弃后续数据）
 *    - ts.readable / ts.writable 是**同一个对象的两面**，任何一端出错，另一端也立即出错
 *    - transformer 的方法是用 transformer 作为 this 调用的，所以可以写 this.buffer = ''
 *      （但用箭头函数会丢失 this，此时要用外部闭包变量）
 *    - new TextDecoderStream() / new TextEncoderStream() / new CompressionStream('gzip')
 *
 * 4. 常见陷阱
 *    陷阱 1：**粘包/半包**。流只保证"块的顺序"，不保证"块就是一条完整消息"。
 *            收到的可能是半行、也可能是三行。转换器必须自己缓冲不完整的部分，
 *            并在 flush 里把最后残留的数据吐出来。
 *    陷阱 2：只在 transform 里处理，忘了 flush。缓冲里的最后一段（通常没有结尾分隔符）
 *            会被静默丢掉 —— 这是线上最难查的一类 bug（"最后一条日志不见了"）。
 *    陷阱 3：以为 write() 会等到数据被消费才 resolve。它只承诺"已被接收"。
 *            当可读端堆积到 readableHighWaterMark 上限时，write() 才会挂起 ——
 *            这就是背压从下游传导到上游的方式。
 *    陷阱 4：pipeTo 的返回值是一个 Promise，忘了 await。不 await 就可能在
 *            管道还没跑完时就去读结果，或者让错误变成 unhandled rejection。
 *    陷阱 5：用 string 做编解码而不处理多字节字符跨块。一个中文字符占 3 个字节，
 *            如果它正好被切在两个块里，逐块解码就会得到乱码。
 *            正确做法是用 TextDecoderStream（内部带 stream: true 语义）。
 *    陷阱 6：在 transform 里同步抛错，会让**管道两端同时 errored**。
 *            上游会收到 write() 的 reject，下游会收到 read() 的 reject，两边都要处理。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 36_realtime_and_streams/05_web_streams_transform.js
 *   纯内存示例，不涉及网络与文件。
 *
 * 【预期输出】
 *   1) 最小 TransformStream：手动操作两端，逐块大写
 *   2) pipeThrough 链式管道：数字 -> 翻倍 -> 加编号 -> 汇总
 *   3) 行切分器：把任意切分的文本块切成完整行，演示粘包/半包与 flush 收尾
 *   4) 背压：可读端不消费时，上游的 write() 会被挂起；一旦开始读就恢复
 *   5) 错误传播：transform 里抛错，管道两端同时报错
 *   6) TextDecoderStream 正确处理"多字节字符被切块"
 * ============================================================================
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// 1. 最小的 TransformStream
// ---------------------------------------------------------------------------
console.log('--- 1. 最小 TransformStream：逐块大写 ---');

// transformer.transform 每收到一块就调用一次；controller.enqueue 把结果推给可读端。
// 注意这里的 transform 是普通方法（不是箭头函数），规范会用 transformer 对象作为 this，
// 所以下面能用 this.count 累积状态。
//
// 构造函数签名：new TransformStream(transformer, writableStrategy, readableStrategy)
// 这里显式指定两个水位，原因见下面 1b 的陷阱。
const upperCaser = new TransformStream(
  {
    start() {
      this.count = 0;
      console.log('  [start] 转换器建立');
    },
    transform(chunk, controller) {
      this.count += 1;
      controller.enqueue(String(chunk).toUpperCase());
    },
    flush(controller) {
      // flush 在上游关闭后被调用一次，用来补一个"总结"或吐出缓冲区残余
      controller.enqueue(`[共转换 ${this.count} 块]`);
      console.log('  [flush] 上游已关闭，转换结束');
    },
  },
  { highWaterMark: 1 }, // writable 端水位
  { highWaterMark: 3 }, // readable 端水位（默认是 0，见 1b）
);

// 手动操作两端：先拿 writer 写入，再拿 reader 读出
const writer = upperCaser.writable.getWriter();
const reader = upperCaser.readable.getReader();

// readableHighWaterMark=3，所以这里连着写 3 块都不需要有人同时在读
await writer.write('hello');
await writer.write('web');
await writer.write('streams');
await writer.close(); // 关闭可写端 -> 触发 flush -> 之后可读端读到 done

const upperResults = [];
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  upperResults.push(value);
}
console.log(`  结果：${upperResults.join(' | ')}`);
console.log('  注意最后一块 "[共转换 3 块]" —— 它是 flush() 里补出来的，不属于任何输入块。');

// ---- 1b. 陷阱：TransformStream 的 readableHighWaterMark 默认是 0 ----
console.log('\n  1b. 陷阱：默认 readableHighWaterMark = 0，write() 会一直挂着');

const zeroHwm = new TransformStream({
  transform(chunk, controller) {
    controller.enqueue(String(chunk).toUpperCase());
  },
  // 故意不传 readableStrategy，用默认值
});
const zw = zeroHwm.writable.getWriter();
const zr = zeroHwm.readable.getReader();

const pendingWrite = zw.write('a'); // 注意：这里不能直接 await，否则整个脚本就卡死了
const outcome = await Promise.race([
  pendingWrite.then(() => '已完成'),
  sleep(120).then(() => '120ms 内没有完成'),
]);
console.log(`  默认水位下 write('a') 的结果：${outcome}`);
console.log('  原因：TransformStream 的 readableHighWaterMark 默认值是 **0**（不是 ReadableStream 的 1），');
console.log('        意味着可读端一开始就是"满"的，必须**有读取请求挂在那里**，转换才会真正执行。');
console.log('        这是最容易写出死锁的地方：只写不读，程序就静静挂住，不报错、不超时。');

// 补上一个读取请求，被卡住的 write 立刻完成
const unblocked = await zr.read();
await pendingWrite;
console.log(`  补一次 read() 之后：读到 ${unblocked.value}，卡住的 write 也结算了。`);
console.log('  实践建议：手动操作两端时，显式传 readableStrategy；或者干脆用 pipeThrough，');
console.log('            由 pipeTo 的泵循环自动挂上读取请求（本示例第 2、3 节就是这么做的）。');

// ---------------------------------------------------------------------------
// 2. pipeThrough：把转换器串成流水线
// ---------------------------------------------------------------------------
console.log('\n--- 2. pipeThrough 链式管道 ---');

// 每个转换器只管一件事，组合起来就是一条完整的处理链
const doubleIt = new TransformStream({
  transform(n, controller) {
    controller.enqueue(n * 2);
  },
});

const labelIt = new TransformStream({
  transform(n, controller) {
    controller.enqueue(`#${n}`);
  },
});

// 收集成 2 个一组（演示"聚合型"转换器，它输出块数比输入少）
const batchOfTwo = new TransformStream({
  start() {
    this.buf = [];
  },
  transform(item, controller) {
    this.buf.push(item);
    if (this.buf.length === 2) {
      controller.enqueue(this.buf.join('+'));
      this.buf = [];
    }
  },
  flush(controller) {
    // 不足 2 个的尾巴必须在 flush 里吐出来，否则数据就静默丢了
    if (this.buf.length > 0) {
      controller.enqueue(`(落单)${this.buf.join('+')}`);
      this.buf = [];
    }
  },
});

const source = ReadableStream.from([1, 2, 3, 4, 5]);
const pipelineOut = [];
for await (const chunk of source.pipeThrough(doubleIt).pipeThrough(labelIt).pipeThrough(batchOfTwo)) {
  pipelineOut.push(chunk);
}
console.log(`  输入 [1,2,3,4,5] -> 翻倍 -> 加 # 前缀 -> 两个一组`);
console.log(`  输出：${pipelineOut.join('  ')}`);
console.log('  指针：pipeThrough 返回的是一个**新的 ReadableStream**，所以可以一直 .pipeThrough() 接下去。');

// ---------------------------------------------------------------------------
// 3. 行切分器：粘包 / 半包问题的标准解法
// ---------------------------------------------------------------------------
console.log('\n--- 3. 行切分器：流只保证块的顺序，不保证块的边界 ---');

console.log('  假设上游把这段文本切成了 3 块（真实网络里切点完全随机）：');
const rawChunks = ['line1\nline2-part', 'ial\nline3\nhalf', '-line4'];
for (const [i, c] of rawChunks.entries()) {
  console.log(`    第 ${i + 1} 块：${JSON.stringify(c)}`);
}

const lineSplitter = new TransformStream({
  start() {
    this.buffer = ''; // 存放"不完整的半行"
  },
  transform(chunk, controller) {
    this.buffer += chunk;
    // 按 \n 切开，最后一段可能是不完整的 —— 留在缓冲区，等下一块来补全
    const parts = this.buffer.split('\n');
    this.buffer = parts.pop();
    for (const line of parts) {
      controller.enqueue(`完整行: ${line}`);
    }
  },
  flush(controller) {
    // 陷阱提醒：上游结束时缓冲区里往往还留着**没有换行符的最后一行**。
    // 不在这里吐出来，它就被静默丢弃了。
    if (this.buffer !== '') {
      controller.enqueue(`完整行（由 flush 补出）: ${this.buffer}`);
      this.buffer = '';
    }
  },
});

const lines = [];
for await (const line of ReadableStream.from(rawChunks).pipeThrough(lineSplitter)) {
  lines.push(line);
}
for (const line of lines) console.log(`    ${line}`);
console.log(`  3 个乱切的块 -> ${lines.length} 行完整数据。这就是 NDJSON / 日志 / SSE 解析的地基。`);

// ---------------------------------------------------------------------------
// 4. 背压：从下游一路传导到上游
// ---------------------------------------------------------------------------
console.log('\n--- 4. 背压：可读端不消费，上游的 write() 就得等 ---');

// 两个水位都调到最小，方便观察
const bottleneck = new TransformStream(
  {
    transform(chunk, controller) {
      controller.enqueue(`T(${chunk})`);
    },
  },
  { readableHighWaterMark: 1, writableHighWaterMark: 1 },
);

const bpWriter = bottleneck.writable.getWriter();
const resolvedWrites = [];
const writePromises = [];
for (let i = 1; i <= 6; i += 1) {
  // 关键：write() 返回 Promise。它 resolve 的条件是"这块被接收了"，
  // 而不是"这块被消费了"。可读端积压到水位上限时，它就一直是 pending。
  writePromises.push(
    bpWriter.write(`c${i}`).then(
      () => resolvedWrites.push(i),
      (err) => console.log(`  write 失败：${err.message}`),
    ),
  );
}

await sleep(80); // 等一会儿，让能完成的都完成
console.log(`  写了 6 块但完全没人读，只有 ${resolvedWrites.length} 个 write() 完成了：[${resolvedWrites.join(', ')}]`);
console.log('  剩下的都卡在 pending —— 这就是背压把上游"顶住"了。');

// 现在开始读，卡住的 write() 会立刻陆续完成
const bpReader = bottleneck.readable.getReader();
const bpConsumed = [];
for (let i = 0; i < 4; i += 1) {
  const { value } = await bpReader.read();
  bpConsumed.push(value);
}
await sleep(60);
console.log(`  读走 4 块（${bpConsumed.join(', ')}）之后，完成的 write() 变成了 ${resolvedWrites.length} 个：[${resolvedWrites.join(', ')}]`);
console.log('  一读就解锁 —— 背压不是"报错"，而是"让对方等一下"，天然形成流量匹配。');

// 收尾：把剩下的读完。
// 注意顺序：close() 会排在前面的 write 之后，所以**不能先 await close()**，
// 否则又是一次死锁（close 等 write，write 等 read，read 还没开始）。
const closePromise = bpWriter.close().catch(() => {});
const restOfBottleneck = [];
for (;;) {
  const { value, done } = await bpReader.read();
  if (done) break;
  restOfBottleneck.push(value);
}
await closePromise;
console.log(`  剩下的数据：${restOfBottleneck.join(', ')}`);
await Promise.allSettled(writePromises); // 确保所有 write 的 Promise 都有归宿，避免 unhandled rejection

// ---------------------------------------------------------------------------
// 5. 错误传播：一端出错，两端都报错
// ---------------------------------------------------------------------------
console.log('\n--- 5. 错误传播：transform 里 throw，管道两端同时 errored ---');

const validator = new TransformStream(
  {
    transform(chunk, controller) {
      if (chunk === 'bad') throw new Error('遇到非法数据，拒绝继续处理');
      controller.enqueue(String(chunk).toUpperCase());
    },
  },
  // 这里必须显式给 readable 端水位，否则默认值 0 会让下面的 write 一直挂着（见 1b）
  { highWaterMark: 1 },
  { highWaterMark: 2 },
);

const vWriter = validator.writable.getWriter();
const vReader = validator.readable.getReader();

await vWriter.write('good');
const firstRead = await vReader.read();
console.log(`  正常块：write('good') -> read() 得到 ${firstRead.value}`);

// 先给下游挂上错误处理，避免 unhandled rejection
const downstream = vReader.read().then(
  (v) => ({ value: v.value }),
  (e) => ({ error: e.message }),
);

let writeError = null;
try {
  await vWriter.write('bad');
} catch (err) {
  writeError = err.message;
}
const down = await downstream;

console.log(`  写入 'bad' 时，上游 write() 得到：${writeError ? `抛错「${writeError}」` : '成功返回'}`);
console.log(`  同时下游 read() 得到：${down.error ? `抛错「${down.error}」` : `数据 ${down.value}`}`);
console.log('  结论：TransformStream 的两端是同一条命 —— 任何一端 errored，另一端立刻跟着 errored，');
console.log('        不会出现"上游还在傻写、下游已经死了"的情况。这也是管道比手写回调更安全的原因。');

// ---------------------------------------------------------------------------
// 6. TextDecoderStream：多字节字符被切块时怎么办
// ---------------------------------------------------------------------------
console.log('\n--- 6. TextDecoderStream：处理"多字节字符被切在两个块里" ---');

const utf8 = new TextEncoder().encode('中文流'); // 每个汉字 3 字节，共 9 字节
// 故意在汉字中间切开：这是网络传输里必然会发生的事
const byteChunks = [utf8.slice(0, 2), utf8.slice(2, 5), utf8.slice(5, 7), utf8.slice(7)];

const naive = byteChunks.map((bytes) => new TextDecoder().decode(bytes)).join('');
console.log(`  4 个字节块：${byteChunks.map((b) => `[${b.join(' ')}]`).join(' ')}`);
console.log(`  逐块 new TextDecoder().decode() 拼接（错误做法）：${JSON.stringify(naive)}  <- 乱码`);

const decoded = [];
for await (const text of ReadableStream.from(byteChunks).pipeThrough(new TextDecoderStream())) {
  decoded.push(text);
}
console.log(`  用 TextDecoderStream（正确做法）：${JSON.stringify(decoded.join(''))}  <- 正确`);
console.log(`  它输出 ${decoded.length} 块：${JSON.stringify(decoded)}`);
console.log('  TextDecoderStream 内部维护了"半个字符"的缓冲，永远不会吐出乱码。');
console.log('  凡是"字节流 -> 文本"的场合，都应该用它，而不是手写 new TextDecoder()。');

console.log('\n全部演示结束。');
