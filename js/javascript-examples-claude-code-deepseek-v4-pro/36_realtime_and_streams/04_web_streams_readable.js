/**
 * ============================================================================
 * 知识点：Web Streams API —— ReadableStream 与背压
 * ============================================================================
 *
 * 【所属分类】36_realtime_and_streams —— 实时通信与流式处理
 * 【难度等级】进阶
 * 【前置知识】17_iterators_and_generators/09_async_iterator.js、18_async/07_async_await_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Web Streams（WHATWG Streams Standard）是一套**跨运行时统一**的流式数据处理 API，
 *    浏览器、Node.js、Deno、Bun、Cloudflare Workers、Service Worker 里都用同一套。
 *    它由三件套组成：
 *      · ReadableStream       可读流（数据源）
 *      · WritableStream       可写流（数据汇）
 *      · TransformStream      转换流（读 + 写，见下一个示例）
 *    "流"的核心思想是：**不要一次性把整个数据装进内存**，而是一块一块（chunk）地处理。
 *    下载 1GB 文件、读取数据库百万行、处理 AI 逐字输出的响应，都靠它把内存占用
 *    从 O(数据总量) 降到 O(缓冲区大小)。
 *
 * 2. 为什么需要（真实项目场景）
 *    · fetch 的响应体 `response.body` 就是一个 ReadableStream。想要"边下边处理"
 *      （比如边下边解压、边下边解析 JSON 行、边下边渲染进度条），就必须会用它。
 *    · 浏览器里的文件上传/下载、`showSaveFilePicker()`、Blob.stream()、
 *      request.body，全都是 Web Streams。
 *    · Node 里 `ReadableStream.from()`、`fs` 的 web 流、`fetch` 上传流式请求体，
 *      以及跨平台库（如 AI SDK、各种 LLM 客户端）都用它做统一抽象。
 *    · **背压（backpressure）** 是流最本质的价值：生产者不会无限制地灌数据把内存撑爆，
 *      而是根据消费者的处理速度自动调节产出节奏。
 *
 * 3. 核心语法要点
 *    创建（UnderlyingSource 三个可选钩子）：
 *      new ReadableStream({
 *        start(controller)  { controller.enqueue(chunk); controller.close(); },  // 建流时调用一次
 *        pull(controller)   { ... },   // 消费者"想要更多"时反复调用 —— 按需生产的地方
 *        cancel(reason)     { ... },   // 消费者取消时调用 —— 释放资源的地方
 *      }, new CountQueuingStrategy({ highWaterMark: 3 }))
 *      · controller.enqueue(chunk)  往内部队列放一块数据
 *      · controller.close()         正常结束（消费者读到 done: true）
 *      · controller.error(err)      以错误结束（消费者 read() 会 reject）
 *      · controller.desiredSize     队列还能再塞多少（= highWaterMark - 队列长度）
 *      · controller.byobRequest     BYOB（bring your own buffer）模式，进阶用法
 *    消费（三种方式，选一种）：
 *      · reader = stream.getReader()；await reader.read() -> { value, done }
 *      · for await (const chunk of stream)            最简洁，推荐（Node 18+ 支持异步迭代）
 *      · await stream.pipeTo(writableStream)          接给另一个流
 *    其它：
 *      · stream.tee()               一分为二，两个消费者各读一份（代价是缓冲翻倍）
 *      · ReadableStream.from(iterable)  从数组 / 异步生成器直接造流
 *      · reader.cancel(reason)      消费者提前退出；会触发底层 cancel()
 *      · reader.releaseLock()       释放锁，让别的消费者可以接手
 *      · response.body.pipeThrough(new TextDecoderStream())  字节流 -> 字符串流
 *
 * 4. 常见陷阱
 *    陷阱 1：创建流的那个"锁"的模型。一个 ReadableStream 同时只能有一个读取器，
 *            重复 getReader() 会抛 "ReadableStream is locked"。
 *            要解绑必须 reader.releaseLock()（且不能有未完成的 read）。
 *    陷阱 2：在 start() 里同步塞进海量数据 —— 那等于放弃流的全部好处，内存照样爆。
 *            按需生产者应该写在 pull() 里。
 *    陷阱 3：pull() 里忘记 await。如果 return 了一个未完成的 Promise，
 *            流会认为这次生产没做完，不会继续调用 pull，流就"卡住"了。
 *    陷阱 4：controller.error() 之后没有消费者，错误会变成 unhandled rejection。
 *            本示例把 error 演示放在了 try/catch 里。
 *    陷阱 5：for await 中途 break —— 规范会自动调用 reader.cancel()，
 *            但**异步生成器里的 finally 是否执行**取决于实现细节，
 *            需要清理的资源最好显式放在 cancel() 钩子里。
 *    陷阱 6：highWaterMark 不是"缓冲区总量限制"。它是**期望值**，
 *            enqueue 超过它只是让 desiredSize 变成负数，并不会报错，
 *            生产者需要自己看 desiredSize 来决定要不要暂停。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 36_realtime_and_streams/04_web_streams_readable.js
 *   纯内存示例，不涉及网络与文件。
 *
 * 【预期输出】
 *   1) 手动构造一个流并用 getReader() 逐块读取
 *   2) pull 按需生产：打印生产者与消费者的交错顺序，证明"消费者要一块才产一块"
 *   3) 背压：highWaterMark 如何决定生产者的领先量；慢消费者如何自动让生产者等待
 *   4) controller.close() 与 controller.error() 在消费者侧的表现
 *   5) 异步迭代 for await 与提前 break 触发的 cancel()
 *   6) ReadableStream.from / tee 简介
 *   7) 与 node:stream 的差异对照
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 工具
// ---------------------------------------------------------------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tick = () => new Promise((r) => setTimeout(r, 0)); // 让出一次事件循环

// ---------------------------------------------------------------------------
// 1. 从零构造一个 ReadableStream
// ---------------------------------------------------------------------------
console.log('--- 1. 手动构造 ReadableStream（start + enqueue + close）---');

// start(controller) 在流创建时**立即同步调用一次**，用来做初始化与"预填充"。
// 注意测试输出：new ReadableStream(...) 之后 start 的日志会先于下面这行 console.log 出现。
const simpleStream = new ReadableStream({
  start(controller) {
    console.log('  [start] 建流时被调用一次，此时 desiredSize =', controller.desiredSize);
    for (const word of ['流', '式', '处', '理']) {
      controller.enqueue(word); // 放进内部队列
    }
    controller.close(); // 声明"不会再有数据了"
    // desiredSize = highWaterMark(默认 1) - 队列长度。塞了 4 块就成了 -3，
    // 负数只表示"超出期望水位"，并非错误 —— 它正是背压信号的来源。
    console.log('  [start] 已 enqueue 4 块并 close()，此时 desiredSize =', controller.desiredSize);
  },
  cancel(reason) {
    console.log('  [cancel] 底层 cancel 被调用：', reason);
  },
});
console.log('  流已创建，locked =', simpleStream.locked);

// getReader() 抢占唯一的读取权。此后这个流被"锁住"。
const reader = simpleStream.getReader();
console.log('  getReader() 之后 locked =', simpleStream.locked);

// 陷阱示范：同一个流不能被两个读取器同时读
try {
  simpleStream.getReader();
} catch (err) {
  console.log(`  再次 getReader() 抛错：${err.message}`);
}

// 逐块读取，直到 done 为 true
const collected = [];
for (;;) {
  const { value, done } = await reader.read();
  if (done) {
    console.log('  read() 返回 done=true，流已结束');
    break;
  }
  collected.push(value);
}
console.log(`  读到的数据：${collected.join('')}`);

// releaseLock() 释放锁，流才能被别的消费者接手（或再次 getReader）
reader.releaseLock();
console.log('  releaseLock() 之后 locked =', simpleStream.locked);

// ---------------------------------------------------------------------------
// 2. pull：按需生产，这才是流的意义
// ---------------------------------------------------------------------------
console.log('\n--- 2. pull()：消费者要一块，生产者才产一块 ---');

const log = [];

// 生产者工厂：模拟从数据库/网络"一条条"取数据
function makeProducer(label, highWaterMark, total = 6) {
  let pullCount = 0;
  const stream = new ReadableStream(
    {
      async pull(controller) {
        // pull 会被**反复调用**，直到队列够满（desiredSize <= 0）或流结束
        pullCount += 1;
        const n = pullCount;
        await sleep(5); // 模拟异步取数
        if (n > total) {
          controller.close();
          return;
        }
        controller.enqueue({ seq: n, text: `${label}数据块${n}` });
      },
    },
    // 队列策略：highWaterMark 是"允许队列里积压多少块"的上限
    new CountQueuingStrategy({ highWaterMark }),
  );
  return { stream, pullCount: () => pullCount };
}

// ---- 2a. 最关键的问题：完全没人读的时候，生产者能跑多远？----
for (const hwm of [1, 3]) {
  const p = makeProducer('X', hwm);
  await sleep(200); // 建好流但**一块都不读**
  const idlePulls = p.pullCount();
  const chunks = [];
  for await (const c of p.stream) chunks.push(c.text); // 现在开始读
  console.log(`  highWaterMark=${hwm}：没人读的这 200ms 里，生产者只 pull 了 ${idlePulls} 次；`);
  console.log(`     随后消费者来读，最终共 pull ${p.pullCount()} 次，读到 ${chunks.length} 块数据。`);
}
console.log('  —— highWaterMark 就是"没人消费时，内存里最多允许积压几块"的上限。');
console.log('     它是背压的第一道闸门：生产者再快，也快不过 desiredSize 的约束。');
console.log('     值越大吞吐越高（能吸收抖动），但内存占用、以及"数据已过期"的风险也越大。');

// ---- 2b. 一读一产的交错节奏 ----
const a = makeProducer('A', 1);
let consumedA = 0;
for await (const chunk of a.stream) {
  consumedA += 1;
  if (consumedA <= 3) {
    log.push(`  [消费者] 拿到「${chunk.text}」时，生产者累计 pull 了 ${a.pullCount()} 次`);
  }
  await sleep(20); // 消费者比较慢
}
console.log(`\n  一读一产的交错节奏（highWaterMark=1）：`);
console.log(log.join('\n'));
console.log(`  最终消费者读了 ${consumedA} 块，生产者 pull 了 ${a.pullCount()} 次（生产次数 ≈ 消费次数 + 1，`);
console.log(`  多出来的那次是最后用来 close() 的空拉取）。`);
log.length = 0;

// ---------------------------------------------------------------------------
// 3. 背压：慢消费者会自动让快生产者停下来
// ---------------------------------------------------------------------------
console.log('\n--- 3. 背压：消费者慢，生产者就自动被按住 ---');

const timeline = [];
let fastPulled = 0;
let firstPullAt = 0;
let lastPullAt = 0;

const fastProducer = new ReadableStream(
  {
    async pull(controller) {
      fastPulled += 1;
      if (firstPullAt === 0) firstPullAt = Date.now();
      lastPullAt = Date.now();
      await sleep(5); // 生产者很快：每 5ms 就能产一块
      if (fastPulled <= 20) {
        controller.enqueue(`快数据${fastPulled}`);
      } else {
        controller.close();
      }
    },
  },
  new CountQueuingStrategy({ highWaterMark: 1 }),
);

let slowConsumed = 0;
const slowStart = Date.now();
for await (const chunk of fastProducer) {
  slowConsumed += 1;
  if (slowConsumed <= 3 || slowConsumed === 20) {
    timeline.push(
      `  [消费者] 第 ${slowConsumed} 块「${chunk}」到手（距开始 ${Date.now() - slowStart}ms），生产者累计 pull ${fastPulled} 次`,
    );
  }
  await sleep(50); // 消费者很慢：每块要处理 50ms
}
console.log(`  消费者一共处理了 ${slowConsumed} 块，生产者一共 pull 了 ${fastPulled} 次。`);
console.log(timeline.join('\n'));
const producingSpan = lastPullAt - firstPullAt;
console.log(`  生产者的 ${fastPulled} 次 pull 前后跨越了 ${producingSpan}ms，`);
console.log(`  而它自己每次只要 5ms —— 也就是说它有 ${producingSpan - fastPulled * 5}ms 是**停在那里等消费者**。`);
console.log('  关键结论：生产者不会自己猛跑到底。队列一满，desiredSize 归零，');
console.log('            pull() 就不再被调用，生产自动停下。整套背压由流自动完成，');
console.log('            你唯一要做的是：异步生产写进 pull()，并且老老实实 await。');

// ---------------------------------------------------------------------------
// 4. close() 与 error() 在消费者侧的表现
// ---------------------------------------------------------------------------
console.log('\n--- 4. controller.close() 与 controller.error() ---');

// 4a. 正常结束
const okStream = new ReadableStream({
  start(c) {
    c.enqueue('ok');
    c.close();
  },
});
const okReader = okStream.getReader();
console.log('  正常结束：', JSON.stringify(await okReader.read()), JSON.stringify(await okReader.read()));

// 4b. 出错结束：一旦 error()，整个流作废，队列里已 enqueue 的数据会被丢弃
const badStream = new ReadableStream({
  start(c) {
    c.enqueue('先给一块');
    c.error(new Error('数据源连接断了')); // 注意：这行会让上面 enqueue 的那块数据一起作废
  },
});
const badReader = badStream.getReader();
try {
  // 陷阱：这里拿到的是 reject，而不是 { value: '先给一块' }
  const first = await badReader.read();
  console.log('  第一块：', JSON.stringify(first));
} catch (err) {
  console.log(`  第一次 read() 就抛错：${err.message}`);
  console.log('  enqueue 过的那块数据被丢弃了 —— error() 不是"补一个错误"，而是让整条流作废');
}
try {
  await badReader.read();
} catch (err) {
  // 必须 try/catch。这里如果不接住，就是 unhandled rejection，
  // 顶层 await 失败会让 Node 直接以退出码 1 结束进程
  // （报错栈会指向 new Error() 的那一行，因为那是错误对象的诞生地，很容易看歪）。
  console.log(`  再读一次仍然抛：${err.message}（errored 是不可逆的终态）`);
}
console.log('  错误后的流，locked =', badStream.locked);

// 4c. 异步迭代里出错会直接 throw 出来
const badStream2 = new ReadableStream({
  pull(c) {
    c.error(new Error('拉取失败'));
  },
});
try {
  for await (const chunk of badStream2) console.log(chunk);
} catch (err) {
  console.log(`  for await 遇到错误：${err.message}`);
}

// ---------------------------------------------------------------------------
// 5. 异步迭代提前 break -> 自动 cancel（资源清理钩子）
// ---------------------------------------------------------------------------
console.log('\n--- 5. 提前 break 会触发 cancel()，用来释放资源 ---');

let cleaned = false;
const endlessStream = new ReadableStream(
  {
    pull(c) {
      c.enqueue(`第 ${c.desiredSize} 块`); // 造一个"永远读不完"的流
    },
    cancel(reason) {
      // 真实项目里这里要：关闭数据库游标、清除定时器、断开上游连接……
      cleaned = true;
      console.log(`  [cancel] 消费者提前退出，reason = ${JSON.stringify(reason)}，已释放底层资源`);
    },
  },
  new CountQueuingStrategy({ highWaterMark: 2 }),
);

let taken = 0;
for await (const chunk of endlessStream) {
  taken += 1;
  if (taken >= 3) break; // 够了，不读了
}
await sleep(20);
console.log(`  只读了 ${taken} 块就 break，cancel 是否被调用：${cleaned}`);

// 也可以显式取消
const cancelStream = new ReadableStream({
  cancel(reason) {
    console.log(`  [cancel] 显式 reader.cancel()，reason = ${reason}`);
  },
});
await cancelStream.getReader().cancel('用户点了"取消下载"');
console.log('  显式 cancel 成功。');

// ---------------------------------------------------------------------------
// 6. 两个常用糖：ReadableStream.from 与 tee
// ---------------------------------------------------------------------------
console.log('\n--- 6. ReadableStream.from() 与 tee() ---');

// from(iterable)：把数组、Set、生成器、异步生成器直接变成流
async function* numberGen() {
  for (let i = 1; i <= 4; i += 1) {
    await sleep(5);
    yield `异步生成器-${i}`;
  }
}
const fromArray = ReadableStream.from(['a', 'b', 'c']);
const fromGen = ReadableStream.from(numberGen());

const arrayChunks = [];
for await (const c of fromArray) arrayChunks.push(c);
console.log(`  ReadableStream.from(数组)：${arrayChunks.join(', ')}`);

const genChunks = [];
for await (const c of fromGen) genChunks.push(c);
console.log(`  ReadableStream.from(异步生成器)：${genChunks.join(', ')}`);

// tee()：把一个流分成两份，两个消费者各读一份。
// 注意代价：两条支路速度不一致时，快的一方会在内存里缓冲，所以别乱用。
const [branch1, branch2] = ReadableStream.from([1, 2, 3]).tee();
const b1 = [];
const b2 = [];
for await (const c of branch1) b1.push(c);
for await (const c of branch2) b2.push(c);
console.log(`  tee() 两条支路分别读到：${b1.join(',')} 与 ${b2.join(',')}`);

// ---------------------------------------------------------------------------
// 7. 与 node:stream 的关系
// ---------------------------------------------------------------------------
console.log('\n--- 7. Web Streams 与 node:stream 的差异 ---');
const diffs = [
  ['标准来源', 'WHATWG 标准，浏览器/Node/Deno/Bun 通用', 'Node 自有实现，历史更久'],
  ['模块形态', '全局对象，无需 import', "import { Readable } from 'node:stream'"],
  ['读一块的 API', 'await reader.read() -> { value, done }', "stream.on('data') / for await / read()"],
  ['是否基于事件', '否，基于 Promise（拉模型）', "是，EventEmitter + 'data'/'end'/'error'"],
  ['背压机制', 'desiredSize + highWaterMark 自动调节', 'write() 返回 false + drain 事件'],
  ['错误传播', 'Promise reject（管道会自动取消）', "error 事件（漏监听就是进程崩溃）"],
  ['典型场景', 'fetch、浏览器 API、跨平台库、AI 流式输出', '文件、压缩、网络 socket、老库生态'],
];
const width = (s) => [...s].reduce((w, ch) => w + (/[一-鿿＀-￯]/.test(ch) ? 2 : 1), 0);
for (const [k, web, node] of diffs) {
  const pad = ' '.repeat(Math.max(0, 14 - width(k)));
  console.log(`  ${k}${pad}| Web Streams: ${web}`);
  console.log(`  ${' '.repeat(14)}| node:stream: ${node}`);
}
console.log('\n  两者可以互转，见 06_web_streams_vs_node_streams.js。');
console.log('  简单记：新代码、跨平台、涉及 fetch -> Web Streams；');
console.log('           纯 Node 的文件/压缩/老库 -> node:stream 仍然更顺手。');

await tick();
console.log('\n全部演示结束。');
