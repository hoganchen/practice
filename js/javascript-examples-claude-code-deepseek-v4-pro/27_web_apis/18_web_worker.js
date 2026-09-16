/**
 * ============================================================================
 * 知识点：浏览器 Web Worker（多线程 / postMessage / Transferable / Worker 池）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】高级
 * 【前置知识】27_web_apis/13_cross_context_messaging.js（跨上下文通信与结构化克隆）、
 *             26_node_core/14_worker_threads.js（Node 的线程）、
 *             27_web_apis/17_service_worker.js（另一种 Worker：Service Worker）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 是单线程语言：一个标签页只有一个主线程，它既要跑你的代码，又要负责
 *    样式计算、布局、绘制和事件响应。所以一段 500ms 的密集计算，用户就会感到
 *    "页面卡住了"——点击没反应、动画掉帧。
 *    Web Worker 让你把这段计算**搬到另一个线程**去：主线程发消息派活，
 *    Worker 算完再发消息把结果送回来。主线程全程不卡。
 *
 * 2. 核心 API（浏览器侧）
 *      const worker = new Worker('worker.js');        // 加载一个独立脚本
 *      const worker = new Worker('worker.js', { type: 'module' });  // 模块化 Worker
 *      worker.postMessage(data, [transferList]);      // 主线程 → Worker
 *      worker.onmessage = (e) => e.data;              // Worker → 主线程
 *      worker.onerror = (e) => e.message;             // 捕获 Worker 里的未捕获错误
 *      worker.terminate();                            // 立即终止（不等它做完）
 *      // Worker 脚本里：
 *      self.onmessage = (e) => { const r = doWork(e.data); self.postMessage(r); };
 *      importScripts('a.js', 'b.js');                 // 经典 Worker 里同步加载脚本
 *      // 模块化 Worker 里改用 import（见下文）
 *
 * 3. 两条必须掌握的数据规则
 *    （1）结构化克隆（structured clone）：消息不是按引用传的，而是**深拷贝**过去的。
 *        能传：普通对象/数组、Date、RegExp、Map、Set、ArrayBuffer、TypedArray、
 *              Blob、File、Error、BigInt、NaN、undefined、循环引用。
 *        不能传：函数、Symbol、WeakMap/WeakSet、Promise、Proxy、DOM 节点
 *              （传这些会抛 DataCloneError）。
 *        注意"传出去的只是副本"：两边各有一份，互不影响。
 *    （2）Transferable（可转移对象）：ArrayBuffer（以及背后的 TypedArray、
 *        MessagePort、ImageBitmap 等）可以**转移所有权**而不是复制：
 *           worker.postMessage(buffer, [buffer]);
 *        转移之后，原线程里的 buffer.byteLength 变成 0（被"清零"了），
 *        所有权归接收方。传几十 MB 的二进制时，这能省掉一整次内存拷贝。
 *
 * 4. Worker 里有什么、没有什么
 *    有：self / postMessage / onmessage / fetch / XMLHttpRequest / WebSocket /
 *        IndexedDB / Cache Storage / importScripts / setTimeout / 大部分 Web API。
 *    没有：DOM（document、任何元素）、window、alert、localStorage
 *        —— 因为 Worker 运行在另一个线程，操作 DOM 必须回到主线程做。
 *    这也是为什么 Worker 的正确姿势是"算完把结果传回去，由主线程更新 UI"。
 *
 * 5. 常见陷阱
 *    - 直接 postMessage 一个函数 / class 的实例（带方法）→ DataCloneError 或方法丢失。
 *    - 传了 DOM 节点 → DataCloneError。
 *    - 忘了转移所有权，传 100MB 的 ArrayBuffer → 白白复制一次，内存瞬间翻倍。
 *    - Worker 里抛错不会让主线程崩，但会触发 worker.onerror；不处理就静默失败。
 *    - 每次任务都 new Worker() → 线程创建有开销（几毫秒），高频任务应该用"池"。
 *    - Worker 里改了共享数据，主线程不会跟着变（除非用 SharedArrayBuffer + Atomics）。
 *    - file:// 下 Worker 受限（Chrome 不允许从 file:// 加载 Worker 脚本，
 *      blob: 形式的 Worker 在部分浏览器也受限），所以浏览器示例要做特性检测与降级。
 *
 * 【本文件在 Node 中如何演示】
 *   Node 里没有 document，但有**真正的多线程**：worker_threads 模块。
 *   本文件用 `new Worker(code, { eval: true })` 起真实线程做对照实验，全部是真数据：
 *     · 阻塞实测：同一段 CPU 密集任务，在主线程跑 vs 在 Worker 里跑，
 *       用 setInterval 心跳计数直接量化"主线程有没有被卡住"；
 *     · 双向通信：postMessage / onmessage 与浏览器同名的 API；
 *     · 结构化克隆：Node 与浏览器用的是同一套算法，所以"什么能传、什么不能传"
 *       是真实验，不是模拟；
 *     · Transferable：ArrayBuffer 转移所有权后 byteLength 归零，也是真的；
 *     · 无 DOM：在 Worker 里 typeof document / window / localStorage 全部 undefined，
 *       与浏览器 Worker 完全一致；
 *     · 模块化：Node 的 `{ type: 'module' }` 与浏览器的 `{ type: 'module' }` 遥相呼应。
 *   两者的差异集中在最后一节的对照表里。
 *
 * 【运行方法】
 *   node 27_web_apis/18_web_worker.js
 *
 * 【预期输出】
 *   十个部分：主线程被阻塞的实测证据、浏览器与 Node 的 API 对照、双向通信、
 *   结构化克隆实测、Transferable 转移所有权、Worker 里没有 DOM、
 *   importScripts 与模块化 Worker、错误处理与 terminate、Worker 池的并发加速、
 *   以及浏览器侧的真实代码与差异对照表。
 * ============================================================================
 */

import { Worker } from 'node:worker_threads';

/** 分节标题 */
function section(title) {
  console.log('');
  console.log('='.repeat(74));
  console.log(title);
  console.log('='.repeat(74));
}

/** CPU 密集任务：统计 limit 以内的质数个数（故意用最朴素的试除法，让它真的耗 CPU） */
function countPrimes(limit) {
  let count = 0;
  for (let n = 2; n <= limit; n++) {
    let isPrime = true;
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) count += 1;
  }
  return count;
}

/** 等 Worker 的下一条消息（带超时保护，避免万一卡死） */
function nextMessage(worker, label, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('等待 ' + label + ' 超时')), timeoutMs);
    worker.once('message', (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ===========================================================================
// 第 1 部分：主线程被阻塞的可观察证据
// ===========================================================================

section('--- 1. 为什么需要 Worker：主线程被阻塞的实测 ---');

const LIMIT = 2_000_000;
console.log(`先测一下任务规模：countPrimes(${LIMIT}) 大约需要多久`);
{
  const t0 = performance.now();
  const n = countPrimes(LIMIT);
  const ms = performance.now() - t0;
  console.log(`  主线程直接跑：${ms.toFixed(0)}ms，得到 ${n} 个质数`);
  console.log('  （这个时间就是"页面卡住"的时长：用户点按钮没反应、CSS 动画停住。）');
}
console.log('');

console.log('用一个每 10ms 跳一次的心跳计时器来量化"卡住"：');
{
  let ticks = 0;
  const timer = setInterval(() => {
    ticks += 1;
  }, 10);
  const t0 = performance.now();
  countPrimes(LIMIT);
  const ms = performance.now() - t0;
  clearInterval(timer);
  const expected = Math.floor(ms / 10);
  console.log(`  ✗ 主线程跑这段计算：耗时 ${ms.toFixed(0)}ms，这期间心跳只跳了 ${ticks} 次`);
  console.log(`    按理说 ${ms.toFixed(0)}ms 内应该跳约 ${expected} 次 —— 说明主线程被完全占住了。`);
  console.log('    在浏览器里，这段时间内页面无法响应任何点击、滚动与动画。');
}
console.log('');

// ===========================================================================
// 第 2 部分：Node 的 worker_threads —— 与浏览器 Worker 的对应关系
// ===========================================================================

section('--- 2. Node 侧：worker_threads 与浏览器 Worker 的 API 对照 ---');

/**
 * Worker 脚本：一个"万能"的小 Worker，支持三种消息
 *   { type: 'count-primes', limit }  → 算出质数个数（密集计算）
 *   { type: 'echo', payload }        → 回显收到的数据（用来验证结构化克隆）
 *   { type: 'peek-buffer', buffer }  → 看一下收到的 ArrayBuffer（用来验证转移）
 */
const PRIME_WORKER_CODE = `
const { parentPort, threadId } = require('node:worker_threads');
function countPrimes(limit) {
  let count = 0;
  for (let n = 2; n <= limit; n++) {
    let isPrime = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) { isPrime = false; break; }
    if (isPrime) count += 1;
  }
  return count;
}
parentPort.on('message', (msg) => {
  if (msg && msg.type === 'count-primes') {
    const t0 = Date.now();
    const count = countPrimes(msg.limit);
    parentPort.postMessage({ type: 'result', count, ms: Date.now() - t0 });
    return;
  }
  if (msg && msg.type === 'echo') {
    // 把收到的数据"体检"一遍，检查结构化克隆是否保留了各种类型
    const p = msg.payload;
    parentPort.postMessage({
      type: 'echo',
      got: {
        date: p.date instanceof Date ? 'Date（' + p.date.toISOString().slice(0, 10) + '）' : '丢了类型',
        re: p.re instanceof RegExp ? 'RegExp（' + p.re.source + '）' : '丢了类型',
        map: p.map instanceof Map ? 'Map（size=' + p.map.size + '）' : '丢了类型',
        set: p.set instanceof Set ? 'Set（size=' + p.set.size + '）' : '丢了类型',
        typed: p.typed instanceof Uint8Array ? 'Uint8Array（[' + Array.from(p.typed).join(',') + ']）' : '丢了类型',
        big: typeof p.big === 'bigint' ? 'BigInt（' + p.big + '）' : '丢了类型',
        selfIsSelf: p.self === p,
        fnType: typeof p.fn,
      },
    });
    return;
  }
  if (msg && msg.type === 'peek-buffer') {
    const view = new Uint8Array(msg.buffer);
    parentPort.postMessage({ type: 'peek', byteLength: msg.buffer.byteLength, first: view[0] });
  }
});
parentPort.postMessage({ type: 'ready', threadId });
`;

const primeWorker = new Worker(PRIME_WORKER_CODE, { eval: true });
primeWorker.on('error', (err) => console.log('  Worker 出错：', err.name, err.message));
{
  const ready = await nextMessage(primeWorker, 'ready');
  console.log(`  Worker 线程已启动：threadId = ${ready.threadId}（主线程的 threadId 是 0）`);
}

const apiMap = [
  ['加载脚本', "new Worker('worker.js')", "new Worker(code, { eval: true }) 或 new Worker(new URL('./w.js', import.meta.url))"],
  ['主 → 子', 'worker.postMessage(data)', 'worker.postMessage(data) —— 完全同名'],
  ['子 → 主', 'worker.onmessage = (e) => e.data', "worker.on('message', (data) => ...)"],
  ['子侧接收', 'self.onmessage = (e) => ...', "parentPort.on('message', (msg) => ...)"],
  ['子侧发送', 'self.postMessage(result)', 'parentPort.postMessage(result)'],
  ['错误', "worker.onerror = (e) => e.message", "worker.on('error', (err) => ...)"],
  ['终止', 'worker.terminate()', 'await worker.terminate()（返回 Promise）'],
  ['传额外数据', "new Worker(url, { name, type: 'module' })", 'new Worker(code, { workerData, type: "module" })'],
  ['线程标识', 'self.name（可读名字）', 'threadId（数字）'],
];
for (const [ability, browser, node] of apiMap) {
  console.log('· ' + ability);
  console.log('    浏览器：' + browser);
  console.log('    Node  ：' + node);
}
console.log('');
console.log('→ 结论：Node 的 worker_threads 就是照着浏览器的 Worker 设计的，');
console.log('  postMessage / onmessage / terminate 这些主 API 一模一样，');
console.log('  主要差别在"加载脚本的方式"和"子侧用什么对象收发消息"。');
console.log('');

// ===========================================================================
// 第 3 部分：双向通信
// ===========================================================================

section('--- 3. 双向通信：主线程派活，Worker 回报 ---');

console.log('① 主线程 → Worker：postMessage 派一个任务过去');
const t1 = performance.now();
primeWorker.postMessage({ type: 'count-primes', limit: LIMIT });
console.log(`  已 postMessage({type:'count-primes', limit:${LIMIT}})，主线程没有等待，立刻继续往下走`);
console.log('  （这就是"异步非阻塞"：发消息只是把数据放进对方的队列。）');
console.log('');

console.log('② Worker → 主线程：算完了把结果发回来');
{
  // 一边等结果，一边让主线程干活 —— 心跳照样在跳
  let ticks = 0;
  const timer = setInterval(() => {
    ticks += 1;
  }, 10);
  const result = await nextMessage(primeWorker, 'result');
  clearInterval(timer);
  console.log(`  收到结果：${result.count} 个质数，Worker 里算了 ${result.ms}ms`);
  console.log(`  ✓ 同样这段时间，主线程的心跳跳了 ${ticks} 次 —— 主线程全程没被卡住！`);
  console.log(`    总墙钟时间 ${(performance.now() - t1).toFixed(0)}ms ≈ Worker 的计算时间，说明是并行跑的。`);
}
console.log('');

console.log('③ 多次往返：同一个 Worker 可以反复干活（不必每次都新建线程）');
{
  const list = [50_000, 100_000, 150_000];
  for (const limit of list) {
    primeWorker.postMessage({ type: 'count-primes', limit });
    const r = await nextMessage(primeWorker, 'result');
    console.log(`    limit=${String(limit).padStart(7)} → ${String(r.count).padStart(6)} 个质数（${r.ms}ms）`);
  }
}
console.log('');

// ===========================================================================
// 第 4 部分：结构化克隆
// ===========================================================================

section('--- 4. 结构化克隆：消息通道上到底能传什么 ---');

console.log('① 能传的（深拷贝过去，两边各一份，互不影响）');
{
  const payload = {
    str: '文本',
    num: 42,
    bool: true,
    nil: null,
    undef: undefined,
    nan: NaN,
    date: new Date('2026-01-01T00:00:00Z'),
    re: /ab+c/gi,
    map: new Map([['k', 1]]),
    set: new Set([1, 2, 3]),
    typed: new Uint8Array([1, 2, 3]),
    big: 10n,
    nested: { arr: [1, [2, [3]]] },
  };
  payload.self = payload; // 循环引用

  primeWorker.postMessage({ type: 'echo', payload });
  const echo = await nextMessage(primeWorker, 'echo');
  console.log('    Worker 回显的类型检查：');
  console.log('      Date   → ' + echo.got.date);
  console.log('      RegExp → ' + echo.got.re);
  console.log('      Map    → ' + echo.got.map);
  console.log('      Set    → ' + echo.got.set);
  console.log('      Uint8Array → ' + echo.got.typed);
  console.log('      BigInt → ' + echo.got.big);
  console.log('      循环引用 → ' + echo.got.selfIsSelf + '（a.self === a 成立）');
  console.log('      函数属性 → ' + echo.got.fnType + '（函数是传不过去的）');
}
console.log('');

console.log('② 不能传的：函数 / Symbol / DOM 节点');
{
  try {
    primeWorker.postMessage({ fn: () => 1 });
    console.log('    函数居然发出去了？（本环境行为不同，浏览器里会抛 DataCloneError）');
  } catch (err) {
    console.log('    ✗ postMessage 一个函数：' + err.name + '：' + err.message);
    console.log('      → 与浏览器完全一致：函数不可结构化克隆。');
  }
  try {
    primeWorker.postMessage({ s: Symbol('x') });
    console.log('    Symbol 居然发出去了？');
  } catch (err) {
    console.log('    ✗ postMessage 一个 Symbol：' + err.name + '：' + err.message);
  }
  console.log('    浏览器里还有一条：postMessage(document.body) 抛 DataCloneError（DOM 节点不可克隆）。');
  console.log('    规避办法：把要传的东西"降级成纯数据"（对象字面量、数组、TypedArray）。');
}
console.log('');

// ===========================================================================
// 第 5 部分：Transferable —— 零拷贝地转移所有权
// ===========================================================================

section('--- 5. Transferable：ArrayBuffer 的"所有权转移" ---');

console.log('① 不转移（默认行为）：整块内存被复制一份');
{
  const buffer = new ArrayBuffer(32 * 1024 * 1024); // 32MB
  new Uint8Array(buffer)[0] = 0xab;
  const t0 = performance.now();
  primeWorker.postMessage({ type: 'peek-buffer', buffer });
  const r = await nextMessage(primeWorker, 'peek');
  const ms = performance.now() - t0;
  console.log(`    发送 32MB 的 ArrayBuffer（不转移）：往返 ${ms.toFixed(1)}ms`);
  console.log(`    发送方这边 byteLength 仍然是 ${buffer.byteLength}（复制了一份，两边各持有 32MB）`);
  console.log(`    Worker 收到的 byteLength = ${r.byteLength}，首字节 = 0x${r.first.toString(16)}`);
  console.log('    内存峰值 = 64MB：主线程 32MB + Worker 32MB。');
}
console.log('');

console.log('② 转移所有权：不复制，直接把这块内存"过户"给 Worker');
{
  const buffer = new ArrayBuffer(32 * 1024 * 1024);
  new Uint8Array(buffer)[0] = 0xcd;
  console.log(`    转移前：主线程这边 byteLength = ${buffer.byteLength}`);
  const t0 = performance.now();
  primeWorker.postMessage({ type: 'peek-buffer', buffer }, [buffer]); // 第二个参数是 transferList
  const r = await nextMessage(primeWorker, 'peek');
  const ms = performance.now() - t0;
  console.log(`    发送 32MB 的 ArrayBuffer（转移）：往返 ${ms.toFixed(1)}ms`);
  console.log(`    转移后：主线程这边 byteLength = ${buffer.byteLength} ← 变成 0 了！`);
  console.log('    为什么？同一块内存不能两个线程同时持有，所以发送方手里的引用被"清零"（neutered）。');
  console.log(`    Worker 收到的 byteLength = ${r.byteLength}，首字节 = 0x${r.first.toString(16)} ← 数据完好`);
  console.log('    内存峰值 = 32MB：全程只有一份，收益是"省掉一次 32MB 的拷贝"。');
  console.log('');
  console.log('    真实场景：把一张 4000×3000 的图片（约 48MB 原始像素）转成 ImageBitmap 时，');
  console.log('    用转移能把主线程的卡顿从几十毫秒降到接近 0。');
  console.log('    浏览器里可转移的对象：ArrayBuffer、MessagePort、ImageBitmap、');
  console.log('    OffscreenCanvas、ReadableStream/WritableStream 等。');
}
console.log('');

// ===========================================================================
// 第 6 部分：Worker 里没有 DOM
// ===========================================================================

section('--- 6. Worker 里没有 DOM / window / localStorage ---');

const ENV_WORKER_CODE = `
const { parentPort } = require('node:worker_threads');
parentPort.postMessage({
  document: typeof document,
  window: typeof window,
  alert: typeof alert,
  localStorage: typeof localStorage,
  navigator: typeof navigator,
  fetch: typeof fetch,
  setTimeout: typeof setTimeout,
  indexedDB: typeof indexedDB,
  selfType: typeof self,
  process: typeof process,
  requireType: typeof require,
});
`;
const envWorker = new Worker(ENV_WORKER_CODE, { eval: true });
{
  const env = await nextMessage(envWorker, 'env');
  const rows = [
    ['document（DOM 的总入口）', env.document, '没有 —— 想在 Worker 里改界面是做不到的'],
    ['window', env.window, '没有 —— Worker 的全局对象是 self'],
    ['alert', env.alert, '没有 —— 弹窗必须由主线程做'],
    ['localStorage', env.localStorage, '没有 —— 同步存储会拖慢 Worker，被刻意去掉'],
    ['indexedDB', env.indexedDB, '浏览器里**有**（Node 里没有），Worker 里可以访问 IndexedDB'],
    ['fetch', env.fetch, '有 —— Worker 里发请求很常见（下载并解析大文件）'],
    ['setTimeout', env.setTimeout, '有 —— 定时器照常可用'],
    ['navigator', env.navigator, '浏览器里**有**（只读的 worker 版 navigator）'],
  ];
  console.log('在 Worker 里挨个 typeof 一遍：');
  for (const [name, type, note] of rows) {
    console.log(`  ${name.padEnd(24)} typeof = ${String(type).padEnd(10)} ${note}`);
  }
  console.log('');
  console.log('  设计意图很明确：Worker 负责"算"，主线程负责"显示"。');
  console.log('  所以标准做法是：把原始数据传给 Worker → 算完把结果传回来 → 主线程更新 DOM。');
  console.log('  （浏览器里还有一个例外：OffscreenCanvas 可以把画布的控制权转给 Worker，');
  console.log('    那是专门为图形计算开的口子。）');
}
await envWorker.terminate();
console.log('');

// ===========================================================================
// 第 7 部分：加载脚本的方式 —— importScripts 与模块化 Worker
// ===========================================================================

section('--- 7. importScripts 与模块化 Worker ---');

console.log('浏览器有两种 Worker：');
console.log('  · 经典 Worker（默认）：脚本里用 importScripts("a.js", "b.js") 同步加载依赖，');
console.log('    相当于在 Worker 全局作用域里"拼接"多个脚本，靠全局变量通信。');
console.log('  · 模块化 Worker：new Worker("w.js", { type: "module" })（或 <script type="module"> 里创建），');
console.log('    脚本里可以直接用 import / export，作用域是模块级的，不污染全局。');
console.log('    注意：模块化 Worker 里 **不能** 再用 importScripts（浏览器会直接报错）。');
console.log('');

console.log('① Node 侧对照 A：经典/CommonJS 形式的 Worker');
{
  const code = `
    const { parentPort } = require('node:worker_threads');
    parentPort.postMessage({
      requireType: typeof require,
      exportsType: typeof exports,
      moduleType: typeof module,
    });
  `;
  const w = new Worker(code, { eval: true });
  const r = await nextMessage(w, 'cjs');
  await w.terminate();
  console.log('    在默认（CJS）Worker 里：require = ' + r.requireType + '，module = ' + r.moduleType + '，exports = ' + r.exportsType);
  console.log('    → 对应浏览器经典 Worker 的 importScripts：都是"运行时加载脚本"，');
  console.log('      都会把依赖放进同一个全局作用域。');
}
console.log('');

console.log('② Node 侧对照 B：模块化 Worker（{ type: "module" }）');
{
  const code = `
    import { parentPort } from 'node:worker_threads';
    import { platform } from 'node:os';
    parentPort.postMessage({ esm: true, requireType: typeof require, platform: platform() });
  `;
  const w = new Worker(code, { eval: true, type: 'module' });
  const r = await nextMessage(w, 'esm');
  await w.terminate();
  console.log('    在 ES Module Worker 里：静态 import 可用，require = ' + r.requireType + '（没有 require 了）');
  console.log('    → 与浏览器 new Worker(url, { type: "module" }) 完全对应，');
  console.log('      都是"用模块系统加载依赖"，作用域干净、可静态分析、可被打包工具处理。');
}
console.log('');

console.log('③ 动态 import()：两种 Worker 里都能用（相当于"按需加载"）');
{
  const code = `
    const { parentPort } = require('node:worker_threads');
    import('node:os').then((os) => parentPort.postMessage({ dynamicImportOk: typeof os.platform === 'function' }));
  `;
  const w = new Worker(code, { eval: true });
  const r = await nextMessage(w, 'dynamic');
  await w.terminate();
  console.log('    CJS Worker 里 await import("node:os") 成功：' + r.dynamicImportOk);
  console.log('    → 浏览器里同理：import("./heavy-module.js") 可以按需把大模块拉进 Worker。');
}
console.log('');

// ===========================================================================
// 第 8 部分：错误处理与 terminate
// ===========================================================================

section('--- 8. 错误处理与 terminate() ---');

console.log('① Worker 里的未捕获错误：主线程收到 error 事件，**不会**让主线程崩溃');
{
  const code = `
    const { parentPort } = require('node:worker_threads');
    parentPort.on('message', (msg) => {
      if (msg === 'boom') throw new Error('Worker 里故意抛出的错误');
    });
  `;
  const w = new Worker(code, { eval: true });
  const errPromise = new Promise((resolve) => w.on('error', resolve));
  w.postMessage('boom');
  const err = await errPromise;
  console.log('    ✗ 收到 error 事件：' + err.name + '：' + err.message);
  console.log('      主线程还活着（这一行就是证据）。浏览器里对应 worker.onerror。');
  console.log('      注意：出错的 Worker 会立刻失效，后续 postMessage 不会再被执行。');
  await w.terminate().catch(() => {});
  console.log('      浏览器里的处理模板：');
  console.log('        worker.onerror = (e) => { console.error("Worker 出错：", e.message); worker.terminate(); };');
  console.log('      （不挂 onerror 就会静默失败，任务永远等不到结果 —— 最难查的一类 bug。）');
}
console.log('');

console.log('② terminate()：立刻终止，不管它做到哪了');
{
  const code = `
    const { parentPort } = require('node:worker_threads');
    function countPrimes(limit) {
      let count = 0;
      for (let n = 2; n <= limit; n++) {
        let isPrime = true;
        for (let d = 2; d * d <= n; d++) if (n % d === 0) { isPrime = false; break; }
        if (isPrime) count += 1;
      }
      return count;
    }
    parentPort.on('message', (msg) => {
      parentPort.postMessage({ type: 'started' });
      const count = countPrimes(msg.limit);
      parentPort.postMessage({ type: 'done', count });
    });
  `;
  const w = new Worker(code, { eval: true });
  w.postMessage({ limit: 2_000_000 });
  await nextMessage(w, 'started');
  console.log('    Worker 已开始算 superLarge 任务，现在调用 terminate() ……');
  const t0 = performance.now();
  const exitCode = await w.terminate();
  console.log(`    terminate() 返回 exitCode = ${exitCode}，耗时 ${(performance.now() - t0).toFixed(1)}ms`);
  console.log('    → 计算被**立刻掐断**，done 消息永远不会到来，做了一半的工作全丢了。');
  console.log('      所以 terminate 只适合"用户取消了""组件卸载了"这类可以丢弃结果的场景；');
  console.log('      需要优雅退出的话，用 postMessage 发一个 "cancel" 消息，让 Worker 自己收尾。');
  console.log('      （注意：Node 的 terminate() 返回 Promise，浏览器的是同步调用，行为一致。）');
}
console.log('');

// ===========================================================================
// 第 9 部分：Worker 池
// ===========================================================================

section('--- 9. Worker 池：并发加速的实测 ---');

/**
 * 一个极简的 Worker 池。
 * 为什么需要它：new Worker() 本身有开销（起线程、加载脚本，通常几毫秒），
 * 高频的小任务如果每次新建线程，开销可能比计算本身还大。
 * 池的做法：预先建好 N 个 Worker，任务来了丢进队列，空闲的 Worker 立刻接手。
 */
class WorkerPool {
  constructor(size, workerCode) {
    this.size = size;
    this.queue = [];
    this.idle = [];
    this.jobs = new Map(); // 进行中的任务：worker → resolve
    this.workers = [];
    for (let i = 0; i < size; i++) {
      const w = new Worker(workerCode, { eval: true });
      w.on('message', (msg) => {
        const resolve = this.jobs.get(w);
        this.jobs.delete(w);
        this.idle.push(w);
        if (resolve) resolve(msg);
        this._next();
      });
      w.on('error', (err) => {
        const resolve = this.jobs.get(w);
        this.jobs.delete(w);
        if (resolve) resolve({ error: err.message });
        this.idle.push(w);
        this._next();
      });
      this.workers.push(w);
      this.idle.push(w);
    }
  }

  /** 提交一个任务，返回 Promise<结果> */
  run(task) {
    return new Promise((resolve) => {
      this.queue.push({ task, resolve });
      this._next();
    });
  }

  _next() {
    if (!this.queue.length || !this.idle.length) return;
    const w = this.idle.pop();
    const job = this.queue.shift();
    this.jobs.set(w, job.resolve);
    w.postMessage(job.task);
  }

  async destroy() {
    for (const w of this.workers) await w.terminate().catch(() => {});
    this.workers = [];
    this.idle = [];
  }
}

const POOL_WORKER_CODE = `
const { parentPort, threadId } = require('node:worker_threads');
function countPrimes(limit) {
  let count = 0;
  for (let n = 2; n <= limit; n++) {
    let isPrime = true;
    for (let d = 2; d * d <= n; d++) if (n % d === 0) { isPrime = false; break; }
    if (isPrime) count += 1;
  }
  return count;
}
parentPort.on('message', (task) => {
  const t0 = Date.now();
  parentPort.postMessage({ id: task.id, count: countPrimes(task.limit), ms: Date.now() - t0, threadId });
});
`;

// 任务要"够大"才看得出并行的价值：太小的任务，线程调度与消息克隆的开销会盖过收益。
// 单任务 150 万：一次约 180ms，6 个串行就要 1 秒多。
const TASKS = [
  { id: 1, limit: 1_500_000 },
  { id: 2, limit: 1_500_000 },
  { id: 3, limit: 1_500_000 },
  { id: 4, limit: 1_500_000 },
  { id: 5, limit: 1_500_000 },
  { id: 6, limit: 1_500_000 },
];

console.log(`① 串行：一个 Worker 依次处理 ${TASKS.length} 个任务`);
let serialMs = 0;
{
  const w = new Worker(POOL_WORKER_CODE, { eval: true });
  const t0 = performance.now();
  for (const task of TASKS) {
    w.postMessage(task);
    const r = await nextMessage(w, 'task');
    serialMs += r.ms;
  }
  const wall = performance.now() - t0;
  console.log(`    墙钟时间 = ${wall.toFixed(0)}ms（每个任务约 ${(serialMs / TASKS.length).toFixed(0)}ms，只能一个一个排着做）`);
  await w.terminate();
}
console.log('');

console.log('② 并行：4 个 Worker 的池处理同样 6 个任务');
{
  const pool = new WorkerPool(4, POOL_WORKER_CODE);
  const t0 = performance.now();
  const results = await Promise.all(TASKS.map((task) => pool.run(task)));
  const wall = performance.now() - t0;
  console.log(`    墙钟时间 = ${wall.toFixed(0)}ms`);
  console.log('    各任务由哪个线程完成的：');
  for (const r of results) console.log(`      task#${r.id} → threadId ${r.threadId}（${r.ms}ms，${r.count} 个质数）`);
  console.log(`    加速比 ≈ ${(serialMs / wall).toFixed(1)}x（受限于 CPU 核心数与任务粒度，不会等于线程数）`);
  console.log('    注意：池里的线程会复用。第 5、6 个任务会落到先空出来的线程上。');
  await pool.destroy();
  console.log('    池已销毁（每个 Worker 都 terminate 了，进程才能正常退出）。');
}
console.log('');

console.log('③ Worker 池的工程要点');
console.log('  · 池大小一般取 navigator.hardwareConcurrency（CPU 逻辑核心数），');
console.log('    开太多线程反而因为切换开销变慢；');
console.log('  · 大任务才值得走 Worker：结构化克隆本身有成本，小于 1ms 的任务别折腾；');
console.log('  · 任务要能"公平拆分"：把一个 1 亿次的循环切成 8 份，比丢给 1 个线程快得多；');
console.log('  · 别忘了 terminate：一个还活着的 Worker 会阻止浏览器页面正常卸载 / Node 进程退出。');

// ===========================================================================
// 第 10 部分：浏览器侧真实代码 + 差异对照表
// ===========================================================================

section('--- 10. 浏览器里的真实代码与差异对照表 ---');

console.log('【主线程 main.js】');
console.log('  // ① 用 Blob 动态造一个 Worker（适合演示；生产环境用独立的 .js 文件）');
console.log('  const code = `');
console.log("    self.onmessage = (e) => {");
console.log('      const { limit } = e.data;');
console.log('      // ……密集计算……');
console.log("      self.postMessage({ count });");
console.log('    };');
console.log('  `;');
console.log("  const worker = new Worker(URL.createObjectURL(new Blob([code], { type: 'application/javascript' })));");
console.log('');
console.log('  // ② 也可以用独立文件 + 模块化');
console.log("  const worker2 = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });");
console.log('');
console.log('  worker.onmessage = (e) => {');
console.log('    // ③ 结果回到主线程之后再碰 DOM —— Worker 里碰不到 DOM');
console.log("    document.getElementById('out').textContent = e.data.count;");
console.log('  };');
console.log('  worker.onerror = (e) => {');
console.log("    console.error('Worker 出错：', e.message);");
console.log('    worker.terminate();');
console.log('  };');
console.log('');
console.log('  // ④ 传大块二进制时一定记得转移所有权');
console.log('  worker.postMessage({ buffer: bigArrayBuffer }, [bigArrayBuffer]);');
console.log('  console.log(bigArrayBuffer.byteLength); // 0！所有权已经交出去了');
console.log('');

const diff = [
  ['创建', "new Worker('worker.js')（必须同源；file:// 下受限）", 'new Worker(code, { eval: true }) 或传文件路径'],
  ['子侧全局对象', 'self（WorkerGlobalScope）', 'parentPort + isMainThread'],
  ['收发消息', 'self.onmessage / self.postMessage', "parentPort.on('message') / parentPort.postMessage"],
  ['错误捕获', 'worker.onerror / self.onerror', "worker.on('error') / worker.on('exit')"],
  ['终止', 'worker.terminate()（同步）', 'await worker.terminate()（返回 Promise）'],
  ['模块化', "new Worker(url, { type: 'module' })", "new Worker(code, { eval: true, type: 'module' })"],
  ['加载依赖', 'importScripts() 或 import（模块化 Worker）', "require() 或 import（模块化 Worker）"],
  ['DOM', '没有 document / window（这是重点）', '本来就没有，Node 里也没有'],
  ['能用的存储', 'IndexedDB、Cache Storage、WebSocket、fetch', '文件系统、net、其它 Node 模块'],
  ['共享内存', 'SharedArrayBuffer + Atomics（需要跨源隔离响应头）', 'SharedArrayBuffer + Atomics（同）'],
  ['典型用途', '大数组计算、图片像素处理、加解密、解析大 JSON', 'CPU 密集任务、worker_threads 池、并行压缩'],
];
for (const [dim, browser, node] of diff) {
  console.log('· ' + dim);
  console.log('    浏览器：' + browser);
  console.log('    Node  ：' + node);
}
console.log('');

console.log('选型经验：');
console.log('  · 小于 5ms 的计算别用 Worker：结构化克隆 + 线程调度的开销可能比省下的还多；');
console.log('  · 涉及 DOM 的活儿不能放进 Worker，只能"算完传回来由主线程更新"；');
console.log('  · 高频任务用 Worker 池，低频大任务一任务一线程即可；');
console.log('  · 传大数据优先考虑 Transferable 或 SharedArrayBuffer，避免白白复制。');

// ===========================================================================
// 收尾：把所有 Worker 终止掉，进程才能正常退出
// ===========================================================================

section('清理');
await primeWorker.terminate();
await sleep(50); // 给后台任务一点时间把消息打印完
console.log('所有 Worker 已 terminate，事件循环已清空 —— 进程可以正常退出了。');
console.log('（如果忘了 terminate，Node 进程会一直挂住不退出，浏览器里则是页面无法真正卸载。）');
console.log('');
console.log('程序结束。');
