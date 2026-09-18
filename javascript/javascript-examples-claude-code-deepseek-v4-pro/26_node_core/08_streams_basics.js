/**
 * ============================================================================
 * 知识点：node:stream —— 可读流、可写流与 pipe 管道
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】高级
 * 【前置知识】26_node_core/07_events_eventemitter.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    流（stream）是"分块处理数据"的抽象。它把数据看成一连串有序的小块（chunk），
 *    而不是一次性拿到全部。Node 里有四种流：
 *      · Readable  可读流   —— 数据来源，如 fs.createReadStream、http 请求体
 *      · Writable  可写流   —— 数据去处，如 fs.createWriteStream、http 响应体
 *      · Duplex    双工流   —— 既可读又可写，如 net.Socket
 *      · Transform 转换流   —— 双工流的特例，写入的数据经过处理后再读出，
 *                              如 zlib.createGzip、crypto.createCipheriv
 *
 *    流本身继承自 EventEmitter，所以它是"事件驱动"的：
 *    可读流会 emit 'data'（有数据了）、'end'（读完了）、'error'；
 *    可写流会 emit 'drain'（缓冲区空了，可以继续写了）、'finish'（写完了）。
 *    只要理解了 07 的 EventEmitter，流就只是一套"约定好的事件名 + 缓冲策略"。
 *
 * 2. 为什么需要
 *    假设要把一个 5GB 的日志文件压缩后发出去。用 fs.readFileSync 一次性读进内存，
 *    进程立刻需要 5GB 内存，多数机器直接崩掉；而且用户要等到全部读完才开始收到数据。
 *    用流，内存占用只有一个缓冲区（默认 64KB 左右），数据边读边压边发，
 *    首字节延迟从"几分钟"降到"几毫秒"。这就是流最核心的价值：
 *    **让内存占用与数据总大小无关**。
 *    此外，流的背后是操作系统的背压机制（backpressure），
 *    它能保证"生产太快"时不会把数据堆在内存里无限膨胀。
 *
 * 3. 核心语法要点
 *    - Readable.from(iterable)              从数组 / 生成器 / 异步生成器造可读流
 *    - readable.pipe(writable)              把可读流接到可写流，返回目标流
 *    - readable.on('data', chunk)           流动模式下逐块接收数据
 *    - readable.on('end', ...)              读完了（注意不是 'finish'）
 *    - readable.on('error', ...)            出错
 *    - writable.write(chunk, cb?)           写一块数据，返回布尔值表示"还能不能继续写"
 *    - writable.end(chunk?, cb?)            结束写入（不调用它，'finish' 永远不会触发）
 *    - writable.on('drain', ...)            缓冲区排空，可以继续写了
 *    - writable.on('finish', ...)           所有数据都已交给底层系统
 *    - pipeline(a, b, c, cb)                推荐的管道组合方式，自动传播错误与清理
 *    - stream.finished(stream, cb)          等一个流彻底结束（含错误）
 *    - highWaterMark                        缓冲区水位线，决定一次缓冲多少字节
 *    - Duplex.from({ readable, writable })  把一个可读 + 一个可写拼成双工流
 *
 * 4. 常见陷阱
 *    陷阱 1：把 'end' 和 'finish' 搞混。'end' 属于可读流（没有更多数据可读了），
 *            'finish' 属于可写流（数据都写完了）。Transform 流两者都会发。
 *    陷阱 2：忘记调用 writable.end()。流永远不会结束，'finish' 不触发，
 *            如果用 pipeline 还会导致整个 Promise 永远不 resolve——进程挂起。
 *    陷阱 3：只用 pipe 而不处理 'error'。pipe 不会把源流的错误传给目标流，
 *            出错时目标流会被永远挂住（内存和文件句柄都泄漏）。
 *            官方的建议是：能用 pipeline 就别用 pipe。
 *    陷阱 4：忽略 write() 的返回值。返回 false 表示缓冲区已满，
 *            此时应暂停生产、等 'drain' 再继续。无视它就会让内存一路涨上去。
 *    陷阱 5：在 'data' 监听器里做重 CPU 计算，会阻塞整条管道。
 *    陷阱 6：objectMode。普通流的 chunk 必须是 Buffer / 字符串 / TypedArray；
 *            要传任意对象必须开 objectMode: true，否则 write 会抛 TypeError。
 *    陷阱 7：可读流默认处于"暂停模式"，只有加了 'data' 监听器或调用 pipe()
 *            或 resume() 才会变成"流动模式"开始吐数据。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/08_streams_basics.js
 *
 * 【预期输出】
 *   全部使用内存中的流（不读写外部大文件）：
 *   演示 Readable.from 造流、逐块消费、pipe 接管道、Transform 转换、
 *   以及背压现象（write 返回 false 与 drain 事件）的实测。
 * ============================================================================
 */

// 只导入需要用到的东西：
//   Readable  —— 可读流基类，用 Readable.from 从内存数据造流
//   Writable  —— 可写流基类，用自定义 _write 实现收集数据
//   Transform —— 转换流基类，用自定义 _transform 实现逐块加工
import { Readable, Writable, Transform } from 'node:stream';

// pipeline 和 finished 都有两个版本：
//   node:stream            -> 回调版，pipeline(...streams, cb) / finished(stream, cb)
//   node:stream/promises   -> Promise 版，可以 await
// 这里**必须**从 node:stream/promises 导入 Promise 版。
// 如果误用了回调版还写 await pipeline(...)，await 一个非 Promise 值会立刻返回，
// 错误既不会被抛出也不会被回调处理——这是一个非常隐蔽的坑。
import { pipeline, finished } from 'node:stream/promises';

// once(emitter, name) 把"等一个事件"变成 Promise（见 07_events_eventemitter.js）。
// 在流的背压控制里它非常常用：await once(writable, 'drain')。
import { once } from 'node:events';

// ---------------------------------------------------------------------------
// 1. Readable.from —— 用内存数据造一个可读流
// ---------------------------------------------------------------------------

console.log('--- 1. Readable.from 造流并消费 ---');

// Readable.from 接受任何可迭代对象：
// 数组、字符串、Map、生成器，甚至是异步生成器。
// 对于异步生成器，它会自动按需拉取（pull），这就是"惰性求值"的流式体现。
const words = ['流', '是', '分块', '处理', '数据', '的', '抽象'];

const src = Readable.from(words);

// 加 'data' 监听器会让可读流进入"流动模式"，数据开始一块块地推过来。
// 注意：这个监听器是在**同步**注册的，但回调会在事件循环的后续阶段被调用。
const collected = [];
src.on('data', (chunk) => {
  // 每个 chunk 就是数组里的一个元素。
  // 默认情况下 Readable.from 对字符串会做 UTF-8 编码成 Buffer。
  // 这里我们直接把它转成字符串，方便观察。
  const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
  collected.push(text);
  console.log(`  收到 chunk: ${JSON.stringify(text)} (chunk 类型: ${chunk.constructor.name})`);
});

// 'end' 表示可读流已经没有更多数据了。它是可读流的事件。
// 用 finished() 等它更省事：它会同时处理 'end'、'error' 和 'close'。
await finished(src);
console.log('  拼接结果：', collected.join(''));
console.log('  共收到', collected.length, '个 chunk（chunk 数量与数组长度一致）');

// 换个角度理解：流不会把整个数组变成一个大字符串再给你，
// 而是一个元素一个元素地"送"。数据量大时，这就是内存占用的差别。

// ---------------------------------------------------------------------------
// 2. 自定义 Writable —— 观察 write 与 finish
// ---------------------------------------------------------------------------

console.log('--- 2. 自定义 Writable 收集数据 ---');

// 继承 Writable 并实现 _write(chunk, encoding, callback) 即可。
// 约定：处理完这一块后**必须**调用 callback()，否则流会一直卡住，
// 既不会处理下一块，也不会触发 'finish'。这是自定义流最常见的 bug。
class Collector extends Writable {
  constructor(options) {
    super(options);
    // 这里存收集到的结果。用真实文件流时，这一层就是操作系统的写缓冲。
    this.chunks = [];
    this.bytes = 0;
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(chunk);
    this.bytes += chunk.length;
    // 模拟一点点异步处理（比如写数据库）。用 queueMicrotask 是同步"下一微任务"，
    // 既真实又不会引入明显的耗时。
    queueMicrotask(() => {
      // 一定要调用 callback，参数是错误对象或 null。
      callback(null);
    });
  }

  _final(callback) {
    // _final 在 end() 之后、'finish' 之前调用，适合做收尾工作。
    console.log('  [_final] 收尾：共收到', this.chunks.length, '块，', this.bytes, '字节');
    callback(null);
  }
}

const collector = new Collector();

collector.on('finish', () => {
  // 'finish' 只在调用过 end() 之后才可能触发。
  console.log("  [finish] 事件触发，表示所有数据都已交给底层处理完毕");
});

// write 的返回值非常关键：
//   true  -> 缓冲区还没满，可以继续写
//   false -> 缓冲区已满（超过 highWaterMark），你应该停下来等 'drain'
// 这里数据很小，两次都是 true。
const canContinue1 = collector.write('第一块数据\n');
const canContinue2 = collector.write('第二块数据\n');
console.log('  write 第一次返回：', canContinue1, '；第二次返回：', canContinue2);

// end() 表示"没有更多数据了"。不调用它，'finish' 永远不会触发。
collector.end('最后一块数据\n');

// 等待流彻底结束（这里用 Promise 版 finished 以便写出干净的顺序输出）。
await finished(collector);
console.log('  收集到的完整内容：');
collector.chunks
  .map((c) => c.toString('utf8').trimEnd())
  .forEach((line) => console.log('    |', line));

// ---------------------------------------------------------------------------
// 3. pipe —— 把可读流接到可写流
// ---------------------------------------------------------------------------

console.log('--- 3. pipe 管道 ---');

// pipe 做的事：监听源的 'data'，收到就 write 到目标；
// 源 'end' 时自动调用目标的 end()。
// 相当于 shell 里的 `cat a | b`。
const source = Readable.from(['alpha', ' ', 'beta', ' ', 'gamma']);
const sink = new Collector();

// pipe 返回的是**目标流**，所以可以链式调用：a.pipe(b).pipe(c)。
// 但要注意：pipe 不会把源的错误传给目标。所以官方推荐用 pipeline（见第 5 节）。
source.pipe(sink);

await finished(sink);
console.log('  管道输出：', sink.chunks.map((c) => c.toString('utf8')).join(''));

// ---------------------------------------------------------------------------
// 4. Transform —— 边流边加工
// ---------------------------------------------------------------------------

console.log('--- 4. Transform 转换流 ---');

// Transform 是"写进去、加工后读出来"的流。
// 实现 _transform(chunk, encoding, callback)：
// 用 this.push(加工后的数据) 把结果放到可读侧，然后调用 callback()。
class UpperCase extends Transform {
  _transform(chunk, encoding, callback) {
    // 加工：转大写后推出去。
    // 注意不要用 'utf8' 之外的编码做逐块解码——多字节字符可能被切断。
    this.push(chunk.toString('utf8').toUpperCase());
    callback(null);
  }
}

// 再写一个"每块加前缀"的转换流，用来演示多个 Transform 串联。
class Prefixer extends Transform {
  constructor(prefix) {
    super();
    this.prefix = prefix;
  }

  _transform(chunk, encoding, callback) {
    this.push(`${this.prefix}${chunk.toString('utf8')}`);
    callback(null);
  }
}

// 链式 pipe 的写法也能串联多个 Transform：
//   Readable.from(data).pipe(new UpperCase()).pipe(new Prefixer('[LOG] ')).pipe(collector);
// pipe 的返回值就是目标流，所以可以一直点下去。
//
// 但这种写法有两个硬伤，所以下面的正式写法改用 pipeline：
//   1) 某一环出错时，错误不会传给后面的流，管道会被挂住
//   2) 出错后没有任何自动清理，文件句柄、socket 都会泄漏
const upper = new UpperCase();
const prefixed = new Prefixer('[LOG] ');
const out = new Collector();

// pipeline 会把所有流连起来，并在**任意一环出错时**统一抛出错误，
// 同时自动销毁其余流、释放资源。这就是它比 pipe 好的地方。
await pipeline(Readable.from(['hello', ' ', 'stream', ' ', 'world']), upper, prefixed, out);
console.log('  经 Transform 加工后的结果：', out.chunks.map((c) => c.toString('utf8')).join(''));

// ---------------------------------------------------------------------------
// 5. pipeline —— 推荐的多流组合方式
// ---------------------------------------------------------------------------

console.log('--- 5. pipeline 与错误传播 ---');

// pipeline 的第一个好处：错误会统一冒泡到最后一个回调（这里被 await 变成异常）。
// 下面故意让中间环节出错，看看错误能不能被捕获。
class Boom extends Transform {
  _transform(chunk, encoding, callback) {
    // 用 callback(err) 报告错误，是流的规范做法。
    // 直接 throw 虽然也能被捕获，但会让流的状态变得不可预期。
    callback(new Error('转换环节故意失败'));
  }
}

const errSink = new Collector();
try {
  await pipeline(Readable.from(['a', 'b', 'c']), new Boom(), errSink);
  console.log('  这行不会执行');
} catch (err) {
  console.log('  pipeline 捕获到中途错误：', err.message);
  console.log('  => 裸 pipe 是拿不到这个错误的，目标流会一直被挂住。');
  console.log('  => 而且 pipeline 会自动销毁所有流，不需要手工清理。');
}

// 检验一下 pipeline 确实销毁了目标流（destroyed 为 true）。
console.log('  出错后目标流是否已被销毁：', errSink.destroyed);

// pipeline 的第二个好处：支持异步生成器，写法非常接近"顺序代码"。
// 这里用一个异步生成器当作数据源，边生成边流。
async function* generateLines() {
  for (let i = 1; i <= 3; i += 1) {
    // 每一轮都 await 一个极短的延时（总共不超过 30ms）。
    await new Promise((resolve) => setTimeout(resolve, 10));
    // yield 出来的每一项都会成为流的一个 chunk。
    yield `第 ${i} 行数据\n`;
  }
}

const genSink = new Collector();
// Readable.from 能直接接受异步生成器：它只会在下游需要数据时才拉取下一项。
// 这就是"惰性 + 背压"的天然结合。
await pipeline(Readable.from(generateLines()), genSink);
console.log('  异步生成器作为数据源的输出：');
genSink.chunks
  .map((c) => c.toString('utf8').trimEnd())
  .forEach((line) => console.log('    |', line));

// ---------------------------------------------------------------------------
// 6. 背压（backpressure）—— 流最精髓的部分
// ---------------------------------------------------------------------------

console.log('--- 6. 背压实测 ---');

// 背压的含义：消费者处理不过来时，要**告诉**生产者慢一点，
// 而不是把数据无限堆在内存里。
//
// 机制：每个可写流有一个 highWaterMark（水位线，默认 16KB）。
//   · 缓冲区里的字节数 < highWaterMark  -> write() 返回 true
//   · 缓冲区里的字节数 >= highWaterMark -> write() 返回 false
// 拿到 false 就意味着"别再写了，等 'drain' 事件"。
//
// 下面用一个"处理很慢"的 Writable 来制造背压：
// 它的 _write 要等 40ms 才回调，在这期间缓冲区不断堆积。
class SlowSink extends Writable {
  constructor() {
    // highWaterMark 设为 4 字节，这样一块数据就能立刻把缓冲填满，
    // 让我们在极小的数据量下也能观察到背压（真实场景默认是 16KB）。
    super({ highWaterMark: 4 });
    this.processed = 0;
  }

  _write(chunk, encoding, callback) {
    // 模拟慢速消费者：40ms 才处理完一块。
    setTimeout(() => {
      this.processed += 1;
      callback(null);
    }, 40);
  }
}

const slow = new SlowSink();

// drainCount 记录 'drain' 被触发了多少次，方便我们事后核对。
let drainCount = 0;

// 注册 'drain' 监听器：缓冲区排空时会触发，表示"可以继续写了"。
// 用事件监听只是为了计数；真正等待时应该用 once(slow, 'drain')（见下面）。
slow.on('drain', () => {
  drainCount += 1;
  console.log(`    [drain 事件] 第 ${drainCount} 次：缓冲区已排空，生产者可以继续写了`);
});

// 逐块写，并检查每次 write 的返回值。
// 这里刻意写成同步的 for 循环，为的是把每次 write 的返回值连续打印出来，
// 直观展示"从哪一块开始缓冲区满了"。
const chunksToWrite = ['AA', 'BB', 'CC', 'DD', 'EE'];
let firstFalseAt = -1;

for (let i = 0; i < chunksToWrite.length; i += 1) {
  const ok = slow.write(chunksToWrite[i]);
  console.log(`    write(${chunksToWrite[i]}) 返回 ${ok}`);
  if (!ok && firstFalseAt === -1) {
    firstFalseAt = i;
  }
}
console.log(`  第 ${firstFalseAt + 1} 次 write 开始返回 false，说明缓冲区已满。`);
console.log('  => 正确的生产者此时应当**暂停写入**，等 drain 事件后再继续。');
console.log('  => 忽略这个返回值，数据就会在内存里越堆越多，直到 OOM。');
console.log('  （注意：此刻 drain 一次都还没触发，因为我们一口气把 5 块全塞进去了）');

// 正确姿势：拿到 false 之后停下来，等 drain 再继续。
// once(slow, 'drain') 返回一个 Promise，正好可以用 await 等待。
// 5 块数据、每块约 40ms，全部处理完约需 200ms；这里只等第一次排空。
await once(slow, 'drain');
console.log('  await once(slow, "drain") 返回了，说明缓冲区已腾空，现在可以继续写。');
slow.write('FF');

// end() 之后等它把缓冲区里的数据全部处理完。
slow.end();
await finished(slow);
console.log('  所有数据最终都被处理完了，processed =', slow.processed);
console.log('  drain 事件累计触发', drainCount, '次（每排空一次缓冲区就触发一次）。');

// ---------------------------------------------------------------------------
// 7. 用 pipeline 自动处理背压
// ---------------------------------------------------------------------------

console.log('--- 7. pipeline 自动处理背压 ---');

// 好消息是：pipeline 已经内置了背压处理。
// 它会在目标 write() 返回 false 时自动暂停源，等 'drain' 再恢复。
// 你不需要手写上面那套逻辑——这正是应该优先用 pipeline 的原因之一。
const fastSource = Readable.from(['快', '速', '生', '产', '者', '的', '数', '据']);
const slowAgain = new SlowSink();

const t0 = Date.now();
await pipeline(fastSource, slowAgain);
console.log(`  8 块数据经慢速消费者处理完毕，耗时 ${Date.now() - t0}ms`);
console.log('  如果 pipeline 不做背压控制，这 8 块会瞬间全部灌进内存；');
console.log('  实际上 pipeline 让源流边等边发，内存占用始终只有一两块的大小。');
console.log('  => 结论：优先用 pipeline，需要精细控制时才手写 write/drain。');

console.log('--- 全部演示结束 ---');
