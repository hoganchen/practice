/**
 * ============================================================================
 * 知识点：WebSocket 基础 —— 从 HTTP Upgrade 握手到双向通信
 * ============================================================================
 *
 * 【所属分类】36_realtime_and_streams —— 实时通信与流式处理
 * 【难度等级】进阶
 * 【前置知识】26_node_core/15_http_server_client.js、18_async/04_promise_basics.js
 *
 * 【也见】29_npm_libraries/13_ws_websocket.js —— 同一套 ws 用法（服务端/客户端/广播/心跳）在
 *        「常用第三方库」章节里也完整讲了一遍。本文件是 WebSocket 协议的**主场**（握手原理优先），
 *        那篇是「第三方库」视角，侧重 ws 这个库的用法与轮询成本的量化。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    WebSocket 是一种在**单个 TCP 连接**上实现**全双工**通信的协议（RFC 6455）。
 *    它和 HTTP 是"平级"的独立协议，但借用了 HTTP 来完成"入场"：
 *      · 客户端发一个普通的 HTTP 请求，带上 `Connection: Upgrade` 与
 *        `Upgrade: websocket`，再附上 `Sec-WebSocket-Key`（16 字节随机数的 Base64）
 *      · 服务端如果同意，返回 `101 Switching Protocols`，并附上
 *        `Sec-WebSocket-Accept`（= SHA-1(key + 固定 GUID) 再 Base64）
 *      · 握手完成那一刻起，这条 TCP 连接上跑的就不再是 HTTP 文本协议，
 *        而是 WebSocket 的**帧（frame）**协议，双方可以随时互发数据
 *    这就是"用 HTTP 请求换一张长期通行证"。一旦换到，服务端就第一次具备了
 *    **主动向客户端推送**数据的能力。
 *
 * 2. 为什么需要（真实项目场景）
 *    HTTP 是"请求—响应"模型：客户端不问，服务端就不能答。这在实时场景下很尴尬。
 *    传统解法是**轮询（polling）**：客户端每隔 N 秒问一次"有新的吗？"。
 *    问题非常明显：
 *      · 实时性差：延迟平均是轮询间隔的一半，最坏是整整一个间隔
 *      · 浪费严重：绝大多数请求的答案是"没有新的"，但请求头、TCP/TLS 开销一次不少
 *      · 服务端压力大：1 万个在线用户 × 每秒 1 次轮询 = 每秒 1 万次请求
 *    真实场景：聊天室、协同编辑（多人同时改同一份文档）、股票行情、
 *    IoT 设备状态、游戏对战、在线客服、AI 流式输出的会话通道。
 *    WebSocket 用一条常驻连接替代了这些反复的请求，把延迟压到网络往返级别。
 *
 * 3. 核心语法要点
 *    服务端（ws 库）：
 *      - new WebSocketServer({ port, host })      创建服务端；port 传 0 让系统分配
 *      - wss.on('connection', (socket, req) => {}) 新客户端握手成功时触发
 *                                                  req 是那次 Upgrade 的 HTTP 请求，可读 header
 *      - wss.clients                               所有在线连接的 Set
 *      - socket.on('message', (data, isBinary))    收到消息；data 默认是 Buffer
 *      - socket.send(data)                         发送；字符串按文本帧，Buffer 按二进制帧
 *      - socket.on('close', (code, reasonBuf))     关闭握手完成
 *      - socket.close(code, reason)                主动发起关闭握手
 *      - socket.readyState                         连接状态（0/1/2/3）
 *      - wss.close(cb)                             停止监听新连接（不会踢掉已有连接！）
 *    客户端（Node 内置全局 WebSocket，与浏览器同款 API）：
 *      - new WebSocket(url)                        立即开始握手，此刻 readyState = CONNECTING
 *      - ws.onopen / ws.onmessage / ws.onclose / ws.onerror
 *      - ws.send(data)                             只能在 OPEN 状态下调用，否则抛错
 *      - ws.close(code, reason)                    发起关闭握手
 *
 * 4. 常见陷阱
 *    陷阱 1：以为 WebSocket 是"HTTP 的增强"。它只在握手时用 HTTP，
 *            之后完全是另一套协议；nginx 等反向代理必须显式配置 Upgrade 头透传，
 *            否则握手会失败退回 400/426。
 *    陷阱 2：握手成功 ≠ 能立刻发消息。浏览器/undici 客户端在 CONNECTING(0) 时
 *            调用 send() 会直接抛异常，必须等 open 事件。
 *    陷阱 3：服务端收到的 message 默认是 Buffer 而不是字符串。
 *            `ws` 出于性能不做自动解码，要自己 `data.toString()`。
 *    陷阱 4：wss.close() 只是"不再接受新连接"，已连上的客户端还开着，
 *            close 回调永远不触发，进程会挂住。必须先逐个 close 客户端。
 *    陷阱 5：关闭码有合法区间。1000（正常）以及 3000~4999（应用自定义）可用；
 *            1005/1006/1015 是保留码，不能主动发送，否则 ws 会抛
 *            "First argument must be a valid error code number"。
 *    陷阱 6：WebSocket 没有内置的重连、心跳、鉴权。连接会因为网络抖动、代理超时、
 *            服务重启而断掉，生产环境必须自己实现重连（见后续示例）与心跳保活。
 *    陷阱 7：WebSocket 不受同源策略约束。浏览器发起握手时会带上 Origin 头，
 *            **服务端必须自己校验**，否则任何网站都能连上你的服务（跨站劫持）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 36_realtime_and_streams/01_websocket_basics.js
 *   本示例只在 127.0.0.1 上自建服务器并连接自己，**不访问外网**。
 *   演示结束后会依次关闭所有客户端与服务器，进程自然退出。
 *
 * 【预期输出】
 *   1) 真实的 HTTP 轮询对比：打印轮询次数、拿到新数据的次数、以及浪费率
 *   2) WebSocket 握手成功（服务端打印 Upgrade 请求头）
 *   3) 客户端 -> 服务端 -> 客户端 的回显（Echo）
 *   4) 服务端无需请求即可主动推送
 *   5) 关闭握手：正常关闭 1000，以及服务端用 1008 拒绝连接
 *   6) 打印连接计数归零，关闭服务器
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 依赖与工具
// ---------------------------------------------------------------------------

import http from 'node:http';
// ws 库：Node 生态最主流的 WebSocket 实现。
// WebSocketServer 是服务端类；WebSocket 常量对象提供 CONNECTING/OPEN/CLOSING/CLOSED。
import { WebSocketServer, WebSocket } from 'ws';

/**
 * 给 Promise 加超时保护：万一某一步因为等待消息永远不返回，
 * 会抛出错误而不是让整个进程永久挂起。
 */
function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`超时保护触发：${label} 在 ${ms}ms 内没有完成`)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

/** 把回调风格的事件等待包装成 Promise，代码更像同步流程 */
function once(emitter, event) {
  return new Promise((resolve) => emitter.once(event, (...args) => resolve(args)));
}

/** 小工具：延时，避免示例跑得太快看不清输出顺序 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 全局安全兜底：unref() 让这个定时器**不会**阻止进程退出，
// 只有当进程因为别的原因（比如某个 socket 没关）还活着时它才会触发，
// 保证脚本最坏情况下也能在 8 秒内以退出码 0 结束。
setTimeout(() => {
  console.log('\n[安全兜底] 检测到进程仍未退出，强制结束（正常流程不应触发）。');
  process.exit(0);
}, 8000).unref();

// ---------------------------------------------------------------------------
// 1. 为什么需要 WebSocket：先看看 HTTP 轮询有多浪费
// ---------------------------------------------------------------------------
console.log('--- 1. HTTP 轮询：客户端不停地问"有新的吗？" ---');

// 场景：服务端有一个"版本号"，它每 200ms 真实地变化一次（模拟新消息到达）。
// 客户端不知道什么时候会变，只好每 40ms 问一次。
const pollState = { version: 0, requests: 0 };
const bumpTimer = setInterval(() => {
  pollState.version += 1;
}, 200);

const pollServer = http.createServer((req, res) => {
  pollState.requests += 1;
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ version: pollState.version }));
});

await new Promise((resolve) => pollServer.listen(0, '127.0.0.1', resolve));
const pollPort = pollServer.address().port;
console.log(`  轮询服务器已启动：http://127.0.0.1:${pollPort}/`);

const seenVersions = new Set();
let pollCount = 0;
const pollStart = Date.now();

// 一共轮询约 440ms
while (Date.now() - pollStart < 440) {
  pollCount += 1;
  const res = await fetch(`http://127.0.0.1:${pollPort}/`);
  const body = await res.json();
  seenVersions.add(body.version);
  await sleep(40);
}

console.log(`  客户端共发出 ${pollCount} 次 HTTP 请求，其中只有 ${seenVersions.size} 次拿到了新数据。`);
console.log(`  无效请求占比约 ${Math.round(((pollCount - seenVersions.size) / pollCount) * 100)}% —— 这些请求的请求头、`);
console.log('  TCP 往返全部白费。而且新数据最多要等一个轮询间隔（40ms）才会被发现。');
console.log('  WebSocket 的思路：建立一条长连接，服务端有数据时立刻推，客户端不用问。');
console.log('  （轮询次数会随机器速度略有浮动，这里看数量级即可。）');

// 收尾：先停掉定时器，再关闭服务器。
// 关键点：Node 的 fetch（undici）默认使用 keep-alive 连接池，
// 就算请求都结束了，连接仍然开着，server.close() 的回调不会触发。
// 必须再调用 closeAllConnections() 强制断开。
clearInterval(bumpTimer);
pollServer.closeAllConnections();
await new Promise((resolve) => pollServer.close(resolve));
console.log('  轮询服务器已关闭。');

// ---------------------------------------------------------------------------
// 2. 创建 WebSocket 服务端：握手本质是一次 HTTP Upgrade
// ---------------------------------------------------------------------------
console.log('\n--- 2. 启动 WebSocket 服务端 ---');

// host 指定 127.0.0.1 只监听本机；port 传 0 让操作系统分配空闲端口，
// 这样示例不会因为 8080/3000 被占用而失败。
const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });

// 等待 listening 事件后，才能从 address() 里取到真实端口
await once(wss, 'listening');
const wssPort = wss.address().port;
console.log(`  WebSocket 服务端已监听：ws://127.0.0.1:${wssPort}`);

const serverLog = [];

// 'connection' 在握手（101 Switching Protocols）**成功之后**才触发。
// 第二个参数 req 就是那次 HTTP Upgrade 请求，可以看到浏览器发来的握手头。
wss.on('connection', (socket, req) => {
  serverLog.push(`新客户端接入，来自 ${req.socket.remoteAddress}:${req.socket.remotePort}`);
  serverLog.push(`  · 请求行：${req.method} ${req.url}`);
  serverLog.push(`  · Connection: ${req.headers.connection}`);
  serverLog.push(`  · Upgrade: ${req.headers.upgrade}`);
  serverLog.push(`  · Sec-WebSocket-Key: ${req.headers['sec-websocket-key']}`);
  serverLog.push(`  · Sec-WebSocket-Version: ${req.headers['sec-websocket-version']}`);
  serverLog.push(`  · Sec-WebSocket-Accept（服务端回给客户端的验算值）: ${req.headers['sec-websocket-accept'] ?? '(由 ws 在响应头中回写)'}`);
  serverLog.push(`  · 当前在线连接数：${wss.clients.size}`);

  // 服务端收到消息。data 默认是 Buffer（即使对方发的是文本帧）。
  socket.on('message', (data, isBinary) => {
    const text = data.toString('utf8');
    serverLog.push(`收到消息（isBinary=${isBinary}）：${text}`);
    // 原样回显。字符串会被 ws 编码成文本帧（opcode 0x1）。
    socket.send(`echo: ${text}`);
  });

  // 关闭握手完成。code 是关闭码，reason 是 Buffer，要转成字符串。
  socket.on('close', (code, reason) => {
    serverLog.push(`客户端断开，关闭码 ${code}，原因 "${reason.toString('utf8')}"，剩余在线 ${wss.clients.size}`);
  });
});

// ---------------------------------------------------------------------------
// 3. 客户端连接：握手 + open 事件 + 状态机
// ---------------------------------------------------------------------------
console.log('\n--- 3. 客户端建立连接（注意 readyState 的变化）---');

// Node 18+ 提供全局 WebSocket（基于 undici 实现），API 与浏览器完全一致，
// 所以这里的代码可以原样复制到前端页面里跑。
const client = new WebSocket(`ws://127.0.0.1:${wssPort}`);
client.binaryType = 'arraybuffer';

console.log(`  刚 new 出来时 readyState = ${client.readyState}（0=CONNECTING，握手还没完成）`);
try {
  // 陷阱示范：CONNECTING 状态下调用 send() 会直接抛错
  client.send('这条消息会被拒绝');
} catch (err) {
  console.log(`  在 CONNECTING 状态调用 send() 抛错：${err.message}（这就是必须等 open 的原因）`);
}

// open 事件 = 握手成功，此时才可以发送数据
const clientOpen = new Promise((resolve) => client.addEventListener('open', resolve, { once: true }));
await withTimeout(clientOpen, 3000, '客户端 open');
console.log(`  握手成功！readyState = ${client.readyState}（1=OPEN）`);
console.log(`  实际启用的扩展/子协议：${client.protocol || '(未协商子协议)'}`);

// 服务端侧记录的握手细节
await sleep(50);
console.log('  服务端看到的握手请求：');
for (const line of serverLog) console.log(`    ${line}`);
serverLog.length = 0;

// ---------------------------------------------------------------------------
// 4. 双向收发：message 事件
// ---------------------------------------------------------------------------
console.log('\n--- 4. 双向收发消息 ---');

// 收集客户端收到的所有消息，方便观察顺序
const clientInbox = [];
client.addEventListener('message', (event) => {
  const isBinary = typeof event.data !== 'string';
  clientInbox.push(isBinary ? `<二进制 ${event.data.byteLength} 字节>` : event.data);
});

for (const word of ['你好', 'WebSocket', '双向通信']) {
  client.send(word);
}
// 等回显回来
await withTimeout(
  new Promise((resolve) => {
    const check = () => (clientInbox.length >= 3 ? resolve() : setTimeout(check, 20));
    check();
  }),
  3000,
  '等待回显',
);
console.log('  客户端收到的回显：', clientInbox.join(' | '));

// 发送二进制数据：Buffer/Uint8Array 会走二进制帧（opcode 0x2）
client.send(new Uint8Array([0x48, 0x69]));
await sleep(80);
console.log(`  客户端共收到 ${clientInbox.length} 条消息，最后一条：${clientInbox.at(-1)}`);
console.log('  服务端日志：');
for (const line of serverLog) console.log(`    ${line}`);
serverLog.length = 0;

// ---------------------------------------------------------------------------
// 5. 服务端主动推送：HTTP 做不到的事
// ---------------------------------------------------------------------------
console.log('\n--- 5. 服务端主动推送（无需客户端先请求）---');

// 记下当前收件箱长度，方便一会儿只打印"这一段新收到的"消息
const inboxMark = clientInbox.length;

// 直接拿到服务端上这个客户端对应的 socket。
// wss.clients 是一个 Set，foreach 顺序即接入顺序。
const serverSideSocket = [...wss.clients][0];

// 模拟：服务端自己产生数据（真实项目里可能是别的客户端发来的消息、
// 数据库变更通知、定时任务结果），立刻推给客户端。
const priceTicks = [101.2, 101.5, 100.9];
for (const price of priceTicks) {
  serverSideSocket.send(JSON.stringify({ type: 'tick', price }));
  await sleep(60);
}
await withTimeout(
  new Promise((resolve) => {
    const check = () => (clientInbox.length >= inboxMark + 3 ? resolve() : setTimeout(check, 20));
    check();
  }),
  3000,
  '等待推送',
);
console.log('  客户端收到的推送：');
for (const msg of clientInbox.slice(inboxMark)) console.log(`    ${msg}`);

// ---------------------------------------------------------------------------
// 6. 关闭握手与状态码
// ---------------------------------------------------------------------------
console.log('\n--- 6. 关闭握手与状态码 ---');

// 关闭是"双向确认"的：一方发 Close 帧，另一方回 Close 帧，TCP 连接才真正断开。
// 这样双方都能确认数据已经处理完，而不是被粗暴地掐断。
const clientClosed = once(client, 'close');
client.close(1000, '演示结束，正常关闭'); // 1000 = Normal Closure
console.log(`  客户端发起关闭，此刻 readyState = ${client.readyState}（2=CLOSING）`);

const [closeCode, closeReason] = await withTimeout(clientClosed, 3000, '客户端 close');
console.log(`  客户端 close 事件：code=${closeCode}，reason="${closeReason}"`);
console.log(`  关闭完成后 readyState = ${client.readyState}（3=CLOSED）`);
await sleep(50);
console.log(`  服务端在此之后感知到的剩余连接数：${wss.clients.size}`);

// 再演示"服务端拒绝连接"：用一个自定义关闭码 1008（Policy Violation）
// 真实场景：鉴权失败、超出配额、命中黑名单时，服务端会这样把连接踢掉。
const rejectedClient = new WebSocket(`ws://127.0.0.1:${wssPort}`);
await withTimeout(new Promise((r) => rejectedClient.addEventListener('open', r, { once: true })), 3000, '第二个客户端 open');
console.log(`  第二个客户端已连上，当前在线 ${wss.clients.size} 个`);

const rejectedClose = new Promise((resolve) => rejectedClient.addEventListener('close', (e) => resolve(e), { once: true }));
// 服务端主动关闭：1008 表示"你违反了策略"
const target = [...wss.clients].find((s) => s.readyState === WebSocket.OPEN);
target.close(1008, 'policy violation: 未通过鉴权');
const rejectEvent = await withTimeout(rejectedClose, 3000, '被拒绝客户端的 close');
console.log(`  被拒绝客户端收到：code=${rejectEvent.code}，reason="${rejectEvent.reason}"`);
console.log('  客户端在 onclose 里看到 1008 就知道"不是网络问题，是服务端拒绝了我"，可以据此决定要不要重连。');

console.log('\n  常用关闭码：');
console.log('    1000 正常关闭          1001 端点离开（如浏览器关闭标签页）');
console.log('    1008 违反策略（鉴权失败） 1009 消息过大    1011 服务端内部错误');
console.log('    3000~4999 应用自定义码（如 4001 表示"被管理员踢出"）');
console.log('    1005/1006/1015 是保留码，不能主动发送');

// ---------------------------------------------------------------------------
// 7. 收尾：务必先关客户端，再关服务器
// ---------------------------------------------------------------------------
console.log('\n--- 7. 关闭服务器 ---');

// 陷阱：wss.close() 只是停止接受新连接，已有连接仍然保持，
// 'close' 事件不会触发，Node 进程就永远不退出。
// 所以正确顺序是：先确保 clients 为空，再 close。
for (const socket of wss.clients) {
  socket.close(1001, '服务器即将关闭');
}
await withTimeout(new Promise((resolve) => wss.close(resolve)), 3000, 'wss.close');
console.log(`  服务器已关闭，最终在线连接数：${wss.clients.size}`);

console.log('\n全部演示结束，进程即将自然退出。');
