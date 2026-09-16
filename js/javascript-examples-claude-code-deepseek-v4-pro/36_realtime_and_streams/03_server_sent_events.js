/**
 * ============================================================================
 * 知识点：Server-Sent Events —— 一条永不结束的 HTTP 响应
 * ============================================================================
 *
 * 【所属分类】36_realtime_and_streams —— 实时通信与流式处理
 * 【难度等级】进阶
 * 【前置知识】36_realtime_and_streams/01_websocket_basics.js、26_node_core/15_http_server_client.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    SSE（Server-Sent Events，服务端推送事件）是 HTML5 规范的一部分，
 *    它把"服务端主动推送"做成了一个**普通的 HTTP 响应**：
 *      · 请求头 Accept: text/event-stream，服务端响应头 Content-Type: text/event-stream
 *      · 服务端**不调用 res.end()**，而是一点点往响应体里写数据；
 *        HTTP/1.1 用 chunked 编码，HTTP/2 用 DATA 帧，效果都是"响应体可以无限长"
 *      · 传输的是一种极简的纯文本格式，事件之间用**空行**分隔
 *    换句话说：SSE 不发明新协议，它只是"赖着不结束的 HTTP"。
 *    它天然是**单向的**（服务端 -> 客户端）；客户端要发数据，只能另开一个普通请求。
 *
 * 2. 为什么需要（真实项目场景）
 *    SSE 的杀手锏是**简单**：不需要新协议、不需要新端口、不需要反向代理改配置
 *    （握手阶段有坑，但比 WebSocket 的 Upgrade 透传容易），浏览器原生支持 EventSource，
 *    而且**协议内置了自动重连与断点续传**——这是 WebSocket 完全没有的。
 *    真实场景：
 *      · 大模型/AI 助手的流式输出（ChatGPT 式的打字机效果，OpenAI 的流式接口就是 SSE）
 *      · 行情推送、进度条（文件导出、视频转码、批量任务进度）
 *      · 站内通知、消息红点、构建日志实时输出（CI 的实时日志就是这个）
 *      · 监控大盘的实时指标
 *    一句话选型：**只需要服务端推、客户端不怎么需要反推时，优先 SSE**。
 *
 * 3. 核心语法要点
 *    服务端（node:http，无需任何第三方库）：
 *      - res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8',
 *                             'Cache-Control': 'no-cache, no-transform',
 *                             'Connection': 'keep-alive',
 *                             'X-Accel-Buffering': 'no' })
 *      - res.write('data: 内容\n\n')     写出一个事件，**别调用 res.end()**
 *      - req.on('close', ...)            客户端断开时清理，否则就是内存泄漏
 *    事件流文本格式（每一行是一个"字段: 值"，一个事件以空行结束）：
 *      - `data: xxx`       消息内容；可以写多行 data:，客户端会用 \n 拼接
 *      - `event: xxx`      事件名；客户端用 addEventListener('xxx') 监听，
 *                          不写则触发默认的 message 事件
 *      - `id: xxx`         事件编号；**断线重连时浏览器会自动带上
 *                          Last-Event-ID: xxx 请求头**，服务端据此续传
 *      - `retry: 3000`     告诉客户端断线后隔多少毫秒重连
 *      - `: 这是注释`       以冒号开头的行会被忽略，常用来做心跳保活
 *    客户端（浏览器原生 / Node 22.3+ 用 --experimental-eventsource 开启全局 EventSource）：
 *      - const es = new EventSource(url)
 *      - es.onopen / es.onmessage / es.onerror
 *      - es.addEventListener('自定义事件名', fn)
 *      - es.readyState：0=CONNECTING、1=OPEN、2=CLOSED
 *      - es.close()      主动关闭（**只有主动 close 才不会自动重连**）
 *      - 断线后 EventSource 会自己重连，并自动带上 Last-Event-ID
 *
 * 4. 常见陷阱
 *    陷阱 1：写了 res.end()。响应一结束，SSE 就退化成了一次性请求。
 *    陷阱 2：忘了 Content-Type 或忘了 charset=utf-8。客户端会拒绝解析或中文乱码。
 *    陷阱 3：格式写错——**必须以空行结尾**。少写一个 \n，浏览器会一直缓冲不派发。
 *            同理，多个字段之间用单个 \n 分隔，事件之间用 \n\n。
 *    陷阱 4：中间有反向代理/压缩中间件时会缓冲，事件被攒成一批才发出去，
 *            "实时"就没了。要设置 X-Accel-Buffering: no 并禁用 gzip 压缩
 *            （Cache-Control 里的 no-transform 就是干这个的）。
 *    陷阱 5：不清理连接。客户端每断开一次就要从广播列表里删掉那个 res，
 *            否则列表越来越长，还会对着已销毁的 socket 写入。
 *    陷阱 6：浏览器对同一域名的 SSE 连接数有限制（HTTP/1.1 下通常是 6 个），
 *            开多个标签页会互相挤占。
 *    陷阱 7：SSE 只能传 UTF-8 文本（二进制要先 Base64，会膨胀 33%）；
 *            也**不能自定义请求头**（EventSource 不支持），要鉴权只能用 Cookie
 *            或把 token 放在 URL 查询串里。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 36_realtime_and_streams/03_server_sent_events.js
 *   本示例只在 127.0.0.1 上自建服务器并连接自己，**不访问外网**。
 *   Node 内置的全局 EventSource 需要 --experimental-eventsource 才能用，
 *   所以示例里手写了一个遵循 EventSource 规范的 MiniEventSource，
 *   这样既不需要加参数，又能把"重连 + Last-Event-ID 续传"的细节讲透。
 *
 * 【预期输出】
 *   1) 打印一段真实的事件流文本，逐字段解释
 *   2) 服务端推送 tick 事件（默认 message 事件）与 notice 事件（自定义事件名）
 *   3) 打印注释行心跳（`: keep-alive`）被客户端忽略的过程
 *   4) 模拟连接被掐断 -> 客户端自动重连并带 Last-Event-ID -> 服务端补发丢失的事件
 *   5) 校验客户端收到的 id 序列连续无缺口
 *   6) SSE 与 WebSocket 的取舍对比表
 * ============================================================================
 */

import http from 'node:http';

// ---------------------------------------------------------------------------
// 0. 工具
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`超时保护触发：${label} 在 ${ms}ms 内没有完成`)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

/** 轮询等待某个条件成立，用于"等到客户端收满 N 条再继续" */
function waitUntil(fn, ms, label) {
  return withTimeout(
    new Promise((resolve) => {
      const check = () => (fn() ? resolve() : setTimeout(check, 10));
      check();
    }),
    ms,
    label,
  );
}

setTimeout(() => {
  console.log('\n[安全兜底] 进程仍未退出，强制结束。');
  process.exit(0);
}, 10_000).unref();

// ---------------------------------------------------------------------------
// 1. 事件流长什么样
// ---------------------------------------------------------------------------
console.log('--- 1. 事件流的文本格式 ---');

console.log('  服务端响应头（缺一不可）：');
console.log('    HTTP/1.1 200 OK');
console.log('    Content-Type: text/event-stream; charset=utf-8   <- 不写这个，浏览器直接不认');
console.log('    Cache-Control: no-cache, no-transform            <- 禁止缓存与压缩改写');
console.log('    Connection: keep-alive                           <- 保持长连接');
console.log('    X-Accel-Buffering: no                            <- 告诉 nginx 别缓冲');
console.log('');
console.log('  响应体（注意：每个事件都以一个空行结束）：');
console.log('    retry: 200\\n');
console.log('    \\n');
console.log('    id: 1\\n');
console.log('    event: notice\\n');
console.log('    data: 第一行\\n');
console.log('    data: 第二行\\n');
console.log('    \\n');
console.log('    : keep-alive\\n');
console.log('    \\n');
console.log('');
console.log('  逐字段解释：');
console.log('    id:    事件编号。浏览器记下最后一个 id，重连时自动带上 Last-Event-ID 请求头');
console.log('    event: 事件名。不写则触发 message 事件；写了则触发同名事件');
console.log('    data:  消息体。多行 data: 会被浏览器用 \\n 拼成一条');
console.log('    retry: 断线后重连等待毫秒数（默认约 3000ms）');
console.log('    : xxx  注释行，客户端直接忽略 —— 用来做心跳保活，防止中间设备掐掉空闲连接');
console.log('    空行   一个事件的终止符。**少了它，客户端会一直缓冲，什么都不派发**');

// ---------------------------------------------------------------------------
// 2. 服务端：一个永不结束的 HTTP 响应
// ---------------------------------------------------------------------------
console.log('\n--- 2. 启动 SSE 服务端 ---');

const history = []; // 已发出的事件，用于 Last-Event-ID 断点续传
let nextId = 1;
const sseClients = new Set(); // 所有还在写的事件流响应对象

/** 按 SSE 格式写出一个事件 */
function writeEvent(res, record) {
  if (record.id !== undefined) res.write(`id: ${record.id}\n`);
  if (record.event) res.write(`event: ${record.event}\n`);
  // data 里如果有换行，要拆成多个 data: 行
  for (const line of String(record.data).split('\n')) {
    res.write(`data: ${line}\n`);
  }
  res.write('\n'); // 空行 = 事件结束
}

/** 产生一个事件：先存历史，再广播给所有在线客户端 */
function publish(event, data) {
  const record = { id: nextId, event, data: JSON.stringify(data) };
  nextId += 1;
  history.push(record);
  if (history.length > 200) history.shift(); // 历史不能无限增长
  for (const res of sseClients) writeEvent(res, record);
  return record;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? '127.0.0.1'}`);

  // ---- 事件流端点 ----
  if (url.pathname === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    // 立刻告诉客户端重连间隔（本示例压缩到 200ms，方便观察）
    res.write('retry: 200\n\n');

    // 断点续传：客户端重连时会自动带上 Last-Event-ID
    const lastEventId = req.headers['last-event-id'];
    if (lastEventId !== undefined) {
      const from = Number(lastEventId);
      const missed = history.filter((r) => r.id > from);
      console.log(`    [服务端] 收到重连，Last-Event-ID=${from}，从历史里补发 ${missed.length} 条`);
      for (const r of missed) writeEvent(res, r);
    } else {
      console.log('    [服务端] 收到首次连接（没有 Last-Event-ID）');
    }

    sseClients.add(res);
    // 关键清理：客户端断开时必须从广播列表里移除，否则是内存泄漏
    req.on('close', () => {
      sseClients.delete(res);
      console.log(`    [服务端] 连接断开，剩余事件流 ${sseClients.size} 条`);
    });
    return; // 注意：没有 res.end()，这个响应会一直开着
  }

  // ---- 掐断所有事件流（模拟网络抖动 / 服务端重启 / 网关超时）----
  if (url.pathname === '/kill') {
    console.log(`    [服务端] 模拟网络中断，强制结束 ${sseClients.size} 条事件流`);
    for (const r of [...sseClients]) r.end(); // 直接结束响应，客户端会立刻察觉
    sseClients.clear();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end('{"killed":true}');
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end('{"error":"not found"}');
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const PORT = server.address().port;
const BASE = `http://127.0.0.1:${PORT}`;
console.log(`  服务端已监听 ${BASE}，事件流端点：GET /events`);

// 定时推送：每 120ms 产生一个 tick 事件
let tickCount = 0;
const ticker = setInterval(() => {
  tickCount += 1;
  publish('', { seq: tickCount, price: Number((100 + Math.random() * 2).toFixed(2)) });
  // 每 3 个 tick 发一次注释行心跳。
  // 注释行不是事件，不占用 id，纯粹是为了让中间的代理/防火墙看到"这条连接有流量"。
  if (tickCount % 3 === 0) {
    for (const res of sseClients) res.write(': keep-alive\n\n');
  }
}, 120);

// ---------------------------------------------------------------------------
// 3. 客户端：手写一个遵循 EventSource 规范的 MiniEventSource
// ---------------------------------------------------------------------------
console.log('\n--- 3. 客户端：MiniEventSource（Node 内置 EventSource 需 --experimental-eventsource）---');

/**
 * 一个最小的 EventSource 实现，行为严格对齐浏览器规范：
 *   · 用 fetch 拿到响应流，按 \n\n 切分事件块
 *   · 解析 data / event / id / retry 四个字段，忽略注释行
 *   · 流意外结束时自动重连，并带上 Last-Event-ID
 *   · 只有主动 close() 才不重连
 */
class MiniEventSource {
  constructor(url, { log = () => {} } = {}) {
    this.url = url;
    this.log = log;
    this.readyState = 0; // 0=CONNECTING 1=OPEN 2=CLOSED
    this.lastEventId = '';
    this.retryMs = 3000; // 规范默认值
    this.reconnectCount = 0;
    this.closedByUser = false;
    this.listeners = new Map();
    this.controller = null;
    this.#connect();
  }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(fn);
  }

  #emit(type, payload) {
    for (const fn of this.listeners.get(type) ?? []) fn(payload);
  }

  close() {
    this.closedByUser = true;
    this.readyState = 2;
    this.controller?.abort();
  }

  async #connect() {
    this.readyState = 0;
    this.controller = new AbortController();

    // 重连时把最后收到的事件 id 带上 —— 这就是"断点续传"的全部秘密
    const headers = {};
    if (this.lastEventId) headers['Last-Event-ID'] = this.lastEventId;

    let res;
    try {
      res = await fetch(this.url, { headers, signal: this.controller.signal });
    } catch (err) {
      if (this.closedByUser) return;
      this.log(`  连接失败：${err.message}`);
      this.#emit('error', { message: err.message });
      return this.#scheduleReconnect();
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!res.ok || !contentType.includes('text/event-stream')) {
      // 规范要求：Content-Type 不对就当作致命错误，不再重连
      this.readyState = 2;
      this.log(`  响应不合法（${res.status} ${contentType}），按规范不再重连`);
      this.#emit('error', { message: 'bad content-type' });
      return;
    }

    this.readyState = 1;
    this.#emit('open', { status: res.status });

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break; // 服务端结束了响应（或连接被掐断）
        buffer += decoder.decode(value, { stream: true });
        // 统一换行符后，用空行切出完整的事件块
        buffer = buffer.replace(/\r\n|\r/g, '\n');
        let sep;
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          this.#dispatchBlock(block);
        }
      }
    } catch (err) {
      if (this.closedByUser) return;
      this.log(`  流读取中断：${err.name}`);
    }

    if (this.closedByUser) return;
    // 流意外结束（不是我们主动关的）-> 触发 error 并自动重连
    this.#emit('error', { message: '连接被服务端关闭' });
    this.#scheduleReconnect();
  }

  /** 解析一个事件块。规范：注释行忽略，无 data 的块不派发 */
  #dispatchBlock(block) {
    let eventType = 'message'; // 默认事件名
    const dataLines = [];

    for (const line of block.split('\n')) {
      if (line === '') continue;
      if (line.startsWith(':')) continue; // 注释行（心跳），直接丢弃

      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      let value = colon === -1 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1); // 规范：冒号后允许一个空格

      if (field === 'event') eventType = value;
      else if (field === 'data') dataLines.push(value);
      // 规范细节：id 的值里如果含 U+0000 NULL，整个 id 字段都要被忽略。
      // （注意：源码里要写成转义形式，别直接敲一个 NUL 字符进来，
      //   否则整个 .js 文件会被 grep 之类的工具判定为"二进制文件"。）
      else if (field === 'id') {
        if (!value.includes('\u0000')) this.lastEventId = value;
      } else if (field === 'retry') {
        const n = Number(value);
        if (Number.isInteger(n) && n >= 0) this.retryMs = n;
      }
    }

    if (dataLines.length === 0) return; // 没有 data 就不派发
    this.#emit(eventType, { data: dataLines.join('\n'), lastEventId: this.lastEventId });
  }

  #scheduleReconnect() {
    if (this.closedByUser) return;
    this.reconnectCount += 1;
    this.readyState = 0;
    this.log(`  ${this.retryMs}ms 后自动重连（第 ${this.reconnectCount} 次），将带上 Last-Event-ID: ${this.lastEventId || '(空)'}`);
    setTimeout(() => {
      if (!this.closedByUser) this.#connect();
    }, this.retryMs);
  }
}

// ---------------------------------------------------------------------------
// 4. 跑起来：收消息、自定义事件、断线续传
// ---------------------------------------------------------------------------
console.log('\n--- 4. 连接并接收事件 ---');

const received = []; // 收到的 message 事件
const notices = []; // 收到的自定义 notice 事件
const allIds = []; // 收到的**所有**事件的 id（不论事件名）——id 是流级别的，不是事件名级别的
const errors = [];

const es = new MiniEventSource(`${BASE}/events`, {
  log: (m) => console.log(m),
});

es.addEventListener('open', () => {
  console.log(`  [客户端] open 事件触发，readyState=${es.readyState}（1=OPEN）`);
});
// 默认事件：服务端没有写 event: 字段
es.addEventListener('message', (e) => {
  received.push({ id: Number(e.lastEventId), payload: JSON.parse(e.data) });
  allIds.push(Number(e.lastEventId));
});
// 自定义事件：服务端写了 event: notice
es.addEventListener('notice', (e) => {
  notices.push({ id: Number(e.lastEventId), payload: JSON.parse(e.data) });
  allIds.push(Number(e.lastEventId));
  console.log(`  [客户端] 收到自定义事件 notice：${e.data}`);
});
es.addEventListener('error', (e) => {
  errors.push(e.message);
  console.log(`  [客户端] error 事件：${e.message}（readyState=${es.readyState}）`);
});

// 等收到 4 条 tick，然后让服务端发一个自定义事件
await waitUntil(() => received.length >= 4, 3000, '等待 4 条 tick');
console.log(`  已收到 ${received.length} 条 message 事件，最后一条：${JSON.stringify(received.at(-1).payload)}`);

const notice = publish('notice', { text: '这是一条自定义事件，客户端用 addEventListener("notice") 接收' });
console.log(`  [服务端] 已发布自定义事件 id=${notice.id}`);
await waitUntil(() => notices.length >= 1, 2000, '等待 notice 事件');
await sleep(150);
console.log(`  注意：id=${notice.id} 这条带 event: notice，所以只触发 notice 监听器，`);
console.log('        不会触发 message —— id 是**整条流**的序号，不是某种事件各自的序号。');
console.log(`  （上面这些 tick 之间穿插着若干 ": keep-alive" 注释行，客户端一律静默忽略，` +
  `它们不占用 id、也不会触发任何事件，只负责让中间设备别掐连接。）`);

// ---- 断线续传 ----
console.log('\n--- 5. 断线重连与 Last-Event-ID 续传 ---');

const idBeforeKill = received.at(-1).id;
console.log(`  当前客户端最后一个事件 id = ${idBeforeKill}，现在模拟网络中断……`);

// 调服务端的管理端点，把所有事件流强制结束
await fetch(`${BASE}/kill`);
// 客户端应该会：error -> 等 retryMs -> 带 Last-Event-ID 重连 -> 服务端补发缺失事件
await waitUntil(() => es.reconnectCount >= 1, 3000, '等待自动重连');
await waitUntil(() => received.length >= 3 && received.at(-1).id > idBeforeKill, 3000, '等待续传数据');
await sleep(120);

console.log(`  重连次数：${es.reconnectCount}，重连后 readyState=${es.readyState}`);
console.log(`  客户端收到的全部 message 事件 id 序列：${received.map((r) => r.id).join(', ')}`);
console.log(`  客户端收到的全部事件（含 notice）id 序列：${allIds.join(', ')}`);

// 校验：序列应当连续无缺口 —— 这就是 Last-Event-ID 续传的价值。
// 判断连续性要用"所有事件"的 id，不能用某一类事件的 id（notice 会占掉一个号）。
let gaps = 0;
for (let i = 1; i < allIds.length; i += 1) {
  if (allIds[i] !== allIds[i - 1] + 1) gaps += 1;
}
console.log(`  缺口数量：${gaps}（0 表示一条都没丢 —— 服务端按 Last-Event-ID 补齐了中断期间产生的事件）`);
console.log(`  期间发生过的 error 事件：${errors.length} 次 -> ${errors.join(' / ')}`);

// ---------------------------------------------------------------------------
// 6. 收尾
// ---------------------------------------------------------------------------
console.log('\n--- 6. 关闭 ---');

es.close(); // 主动关闭后绝不会再自动重连
console.log(`  客户端已 close()，readyState=${es.readyState}（2=CLOSED）`);

clearInterval(ticker); // 定时器必须清掉，否则进程不会退出
for (const r of [...sseClients]) r.end();
sseClients.clear();
server.closeAllConnections(); // fetch 的 keep-alive 连接池会吊住 server.close()
await withTimeout(new Promise((resolve) => server.close(resolve)), 3000, 'server.close');
console.log('  服务端已关闭。');

// ---------------------------------------------------------------------------
// 7. 选型对比
// ---------------------------------------------------------------------------
console.log('\n--- 7. SSE 与 WebSocket 怎么选 ---');
const rows = [
  ['通信方向', '单向（服务端 -> 客户端）', '全双工（双向随时发）'],
  ['底层协议', '普通 HTTP，不需要 Upgrade', 'HTTP 握手后升级为独立的 ws 协议'],
  ['自动重连', '协议内置，还带 Last-Event-ID 续传', '完全没有，必须自己写'],
  ['数据格式', '只能 UTF-8 文本（二进制要 Base64）', '文本帧 + 二进制帧，原生支持二进制'],
  ['浏览器 API', 'EventSource，不能自定义请求头', 'WebSocket，握手可带 Cookie/子协议'],
  ['代理友好度', '高（就是 HTTP），但要注意禁用缓冲', '低，Nginx 等要显式配置 Upgrade 透传'],
  ['连接数限制', 'HTTP/1.1 下同域名约 6 条', '同域名约 200 条（浏览器限制宽松得多）'],
  ['服务端实现', '一个不 end() 的 http 响应即可', '需要 ws 之类的库，或自己实现帧协议'],
  ['典型场景', 'AI 流式输出、行情、进度条、通知', '聊天室、协同编辑、游戏、双向 RPC'],
];
// 中文字符在终端里占两列，padEnd 按字符数补空格会对不齐，
// 所以自己算"显示宽度"再补空格。
const displayWidth = (s) =>
  [...s].reduce((w, ch) => w + (/[一-鿿＀-￯]/.test(ch) ? 2 : 1), 0);
const padLabel = (s, width) => s + ' '.repeat(Math.max(0, width - displayWidth(s)));

const LABEL_WIDTH = 12;
for (const [k, sse, ws] of rows) {
  console.log(`  ${padLabel(k, LABEL_WIDTH)}| SSE: ${sse}`);
  console.log(`  ${' '.repeat(LABEL_WIDTH)}| WS : ${ws}`);
}
console.log('\n  一句话选型：只需要"推"就用 SSE，需要"互推"或"二进制"才上 WebSocket。');
console.log('  很多产品两者混用：SSE 推通知，WebSocket 走交互。');

console.log('\n全部演示结束。');
