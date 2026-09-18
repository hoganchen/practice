/**
 * ============================================================================
 * 知识点：WebSocket 实时通信 —— 用 ws 库做服务端 / 客户端 / 广播 / 心跳
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】进阶
 * 【前置知识】29_npm_libraries/10_express_server.js（HTTP 服务端基础）、
 *             18_async（Promise / 事件循环）、26_node_core（node:http 模块）
 *
 * 【也见】36_realtime_and_streams/01_websocket_basics.js 与 02_websocket_broadcast.js —— 同一套 ws 用法
 *        （服务端/客户端/广播/房间/心跳）在那两篇里也从协议原理到代码完整讲了一遍。
 *        本文件是「第三方库」视角的主场（侧重 ws 这个库本身与轮询成本的量化）；协议原理以 36 章为准。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    WebSocket 是一种在**单个 TCP 连接**上做**全双工**通信的协议（RFC 6455）。
 *    它靠一次 HTTP 请求完成"握手升级"（Upgrade: websocket），握手成功后这条 TCP
 *    连接就不再是 HTTP 了，双方可以随时、双向、低开销地互相推消息。
 *
 *    浏览器原生就有 WebSocket API（`new WebSocket('ws://...')`）；Node.js 没有内置
 *    客户端，本仓库安装的 `ws` 库同时提供服务端（WebSocketServer）与客户端（WebSocket），
 *    是 Node 生态里事实上的标准实现（socket.io 底层也是它）。
 *
 * 2. 为什么需要（真实项目场景）
 *    很多需求天然是"服务端主动推"：
 *      - 聊天 / 客服系统：别人发的消息要立刻出现在你屏幕上；
 *      - 协同编辑（腾讯文档、Figma）：光标、选区、内容变更的实时同步；
 *      - 行情 / 比分 / 监控大盘：价格每秒变，不能让浏览器每秒发一个请求；
 *      - 构建进度、任务进度条、日志 tail -f；
 *      - 游戏、在线白板、通知推送。
 *
 *    这些需求用 HTTP 轮询也能"凑合实现"，但代价是：
 *      (a) 实时性差：轮询间隔多长，延迟就至少多长；
 *      (b) 浪费巨大：99% 的请求都是"没消息"的空请求，白占带宽和服务器连接数；
 *      (c) 每个请求都要带一遍 Cookie / Header，开销远大于一个 2 字节的 WS 帧。
 *    本文件第二节会用真实数据把 (b) 量化出来，而不是空口说"WS 更好"。
 *
 * 3. 核心语法要点
 *    服务端：
 *      const wss = new WebSocketServer({ server });   // 挂到已有 http server 上
 *      wss.on('connection', (socket, req) => {});     // 新连接
 *      socket.send(data);                             // 发（字符串或 Buffer）
 *      socket.on('message', (raw, isBinary) => {});   // 收（raw 是 Buffer）
 *      socket.on('close', (code, reason) => {});      // 对端/自己关闭
 *      wss.clients;                                   // Set<WebSocket>，用于广播
 *    客户端：
 *      const c = new WebSocket('ws://127.0.0.1:PORT/path');
 *      c.on('open' | 'message' | 'close' | 'error', handler)
 *    心跳保活：
 *      socket.ping() / socket.on('pong')  —— WS 协议层的控制帧，不占用你的业务消息通道。
 *
 * 4. 常见陷阱
 *    - **忘记清理定时器 / 连接，进程永不退出**：这是写 WS 示例最常翻车的地方。
 *      WS 连接、心跳 interval 都会让 Node 的事件循环一直有活跃句柄，必须显式 close()。
 *    - 以为 TCP 连接"断了对方一定会知道"：拔网线、NAT 超时、手机进隧道，
 *      对端可能长时间收不到 FIN，连接变成"半开"。所以服务端必须自己做心跳探测，
 *      N 个周期没收到 pong 就主动 terminate()，否则会泄漏内存和文件描述符。
 *    - 服务端直接 `socket.send()` 而不判断 readyState：连接正在关闭时会抛错。
 *    - message 事件的 raw 是 Buffer 不是字符串，别忘了 `.toString()`。
 *    - 把 WS 当成"有状态的 HTTP"：它没有请求/响应配对、没有状态码、没有自动重连，
 *      断线重连、消息去重、离线补发都得自己实现（或换 socket.io / SSE + 幂等补齐）。
 *    - 轮询"降级"是必要的：企业代理、部分防火墙会掐掉 WS，生产要有回退方案。
 *    - 广播时无脑遍历所有连接：连接数上十万后，要按"房间/频道"分组，别做全量广播。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/13_ws_websocket.js
 *   （本文件自建本地 HTTP + WebSocket 服务，监听 0 号端口，全程不访问外网）
 *
 * 【预期输出】
 *   先打印 HTTP 轮询的真实开销统计，再完成一次 WebSocket 完整闭环：
 *   连接 → 请求/响应 → 广播 → 心跳 ping/pong → 优雅关闭，
 *   最后打印对比表格与知识点小结，进程自然退出，退出码 0。
 * ============================================================================
 */

import http from 'node:http';
import assert from 'node:assert/strict';
import { WebSocketServer, WebSocket } from 'ws';

// ---------------------------------------------------------------------------
// 通用小工具
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 等待某个事件发生，并带超时保护。
 * 在示例里非常关键：万一事件没来，宁可抛错也不要让进程永远挂起。
 */
function waitForEvent(emitter, event, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.off(event, onEvent);
      reject(new Error(`等待事件 "${event}" 超时（${timeoutMs}ms）`));
    }, timeoutMs);
    function onEvent(...args) {
      clearTimeout(timer);
      resolve(args);
    }
    emitter.once(event, onEvent);
  });
}

/**
 * 给一个 WS 连接装一个"收件箱"：进来的消息先进缓冲区，谁想要谁取。
 *
 * 为什么必须缓冲？因为 ws 是 EventEmitter 语义，**消息不会为未来的监听者保留**。
 * 服务端在 connection 事件里会立刻推一条 welcome，如果客户端先 await('open')
 * 再 .once('message')，这条 welcome 早就被丢弃了 —— 这在真实项目里就是
 * "偶发丢消息"的经典成因。收件箱模式（先挂监听、再处理业务）能彻底避免。
 */
function createInbox(socket) {
  const buffer = [];
  const waiters = [];

  socket.on('message', (raw) => {
    // 注意：ws 库给到的是 Buffer，即使是文本帧也不是字符串，必须自己转
    const msg = JSON.parse(raw.toString('utf8'));
    const waiter = waiters.shift();
    if (waiter) waiter.resolve(msg);
    else buffer.push(msg);
  });

  return {
    next(timeoutMs = 3000) {
      if (buffer.length > 0) return Promise.resolve(buffer.shift());
      return new Promise((resolve, reject) => {
        const waiter = { resolve: null };
        const timer = setTimeout(() => {
          const i = waiters.indexOf(waiter);
          if (i !== -1) waiters.splice(i, 1);
          reject(new Error(`等待消息超时（${timeoutMs}ms）`));
        }, timeoutMs);
        waiter.resolve = (msg) => {
          clearTimeout(timer);
          resolve(msg);
        };
        waiters.push(waiter);
      });
    },
  };
}

/** 安全关闭一个 WS 连接：已关闭就直接返回，避免等待永远不会到来的 close 事件 */
function closeSocket(socket, code = 1000, reason = '') {
  return new Promise((resolve) => {
    if (socket.readyState === WebSocket.CLOSED) {
      resolve();
      return;
    }
    socket.once('close', () => resolve());
    socket.close(code, reason);
  });
}

// ===========================================================================
// 1. 场景铺垫：先看看"HTTP 轮询"到底有多浪费
// ===========================================================================

console.log('--- 1. 对照组：HTTP 轮询的真实开销 ---');

/**
 * 这一节自建一个"消息接口"，然后以固定间隔轮询它，
 * 统计「总共发了多少请求 / 其中多少是没用的空请求 / 真实消息延迟多少」。
 * 数据是现场跑出来的，不是编的。
 */
const inbox = []; // 模拟服务端待下发的消息队列
let pollRequestCount = 0;
let pollBytesReceived = 0;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/messages') {
    pollRequestCount += 1; // 无论有没有消息，这次请求都已经消耗掉了
    const payload = JSON.stringify({ messages: inbox.splice(0, inbox.length) });
    pollBytesReceived += Buffer.byteLength(payload) + 180; // +180 粗略估算响应头开销
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(payload);
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('not found');
});

// listen(0) = 让操作系统分配一个空闲端口，避免和本机其它程序冲突
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
console.log(`  本地服务已启动：${base}（监听 0 号端口，端口由系统分配）`);

// 生产者：在未来的 300ms 内陆续"产生" 3 条消息（每条带 createdAt 便于统计延迟）
const producerTimers = [60, 160, 260].map((delay, i) =>
  setTimeout(() => inbox.push({ seq: i + 1, text: `消息${i + 1}`, createdAt: Date.now() }), delay),
);

// 消费者：每 50ms 轮询一次，持续 450ms
const POLL_INTERVAL = 50;
const POLL_DURATION = 450;
const pollStartedAt = Date.now();
let usefulPolls = 0;
let emptyPolls = 0;
const delivered = [];

while (Date.now() - pollStartedAt < POLL_DURATION) {
  const t0 = Date.now();
  const res = await fetch(`${base}/api/messages`);
  const body = await res.json();
  if (body.messages.length > 0) {
    usefulPolls += 1;
    // 延迟 = 消息从产生到被客户端拿到的真实时间差
    for (const m of body.messages) delivered.push({ ...m, latency: t0 - m.createdAt });
  } else {
    emptyPolls += 1;
  }
  await sleep(POLL_INTERVAL);
}
for (const t of producerTimers) clearTimeout(t);

const avgLatency =
  delivered.length > 0
    ? Math.round(delivered.reduce((sum, m) => sum + m.latency, 0) / delivered.length)
    : 0;

console.log(`  轮询间隔 ${POLL_INTERVAL}ms，持续 ${POLL_DURATION}ms`);
console.log(`  总共发出请求：${pollRequestCount} 次`);
console.log(`  其中【有效】请求（拿到消息）：${usefulPolls} 次`);
console.log(`  其中【空转】请求（什么都没拿到）：${emptyPolls} 次`);
console.log(
  `  无效请求占比：${((emptyPolls / pollRequestCount) * 100).toFixed(1)}%（消息越稀疏，这个比例越接近 100%）`,
);
console.log(`  仅响应体+响应头就收发了约 ${pollBytesReceived} 字节（还没算每次都要带的请求头）`);
console.log(`  实测消息平均延迟 ≈ ${avgLatency}ms，随消息稀疏度线性变差（最差等于一个轮询周期）`);
console.log('  结论：轮询把"实时性"和"开销"绑成了对立面，没法同时优化。');

assert.ok(pollRequestCount >= 6, `轮询次数应不少于 6 次，实际 ${pollRequestCount}`);
assert.equal(usefulPolls + emptyPolls, pollRequestCount);
assert.ok(delivered.length >= 1, '演示期内应当至少收到一条消息');

// ===========================================================================
// 2. WebSocket 服务端：把 WS 挂到刚才这个 HTTP 服务上
// ===========================================================================

console.log('\n--- 2. 建立 WebSocket 服务端 ---');

// 关键点：WS 握手本质是一个带 Upgrade 头的 HTTP 请求，
// 所以 wss 可以直接复用已有的 http.Server（同一个端口，无需再开端口）。
const wss = new WebSocketServer({ server });

/** 给每个连接一个自增 id + 存活标记，方便日志和心跳排查 */
let connectionSeq = 0;
const serverLog = [];

/** 广播：把数据发给所有处于 OPEN 状态的连接 */
function broadcast(data, { except } = {}) {
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  let sent = 0;
  for (const client of wss.clients) {
    // 广播前一定要判断状态：正在关闭的连接 send() 会抛错
    if (client.readyState !== WebSocket.OPEN) continue;
    if (except && client.clientId === except) continue;
    client.send(text);
    sent += 1;
  }
  return sent;
}

wss.on('connection', (socket, req) => {
  socket.clientId = `conn-${++connectionSeq}`;
  socket.isAlive = true; // 心跳探活的标记位
  serverLog.push(`[连接建立] ${socket.clientId} 来自 ${req.socket.remoteAddress}`);

  // 客户端回了 pong，说明这条连接还活着
  socket.on('pong', () => {
    socket.isAlive = true;
  });

  socket.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString('utf8'));
    } catch {
      // 生产环境必须防脏数据：一条非法消息不能让整个服务崩掉
      socket.send(JSON.stringify({ type: 'error', reason: '不是合法的 JSON' }));
      return;
    }

    // 约定一个极简协议：每个消息带 type，请求带 id 便于客户端做请求-响应配对
    if (msg.type === 'echo') {
      // 点对点回包：把 id 原样带回，客户端靠它认领结果
      socket.send(JSON.stringify({ type: 'echo:reply', id: msg.id, echo: msg.payload }));
    } else if (msg.type === 'chat') {
      // 群发：广播给所有人（包括发送者自己，这样发送方能确认服务端已收到）
      const sent = broadcast({ type: 'chat', from: socket.clientId, text: msg.text });
      serverLog.push(`[广播] ${socket.clientId} 的 "${msg.text}" 发给了 ${sent} 个连接`);
    } else if (msg.type === 'ping-me') {
      // 演示协议层 ping（控制帧），客户端会自动回 pong，不需要业务代码参与
      socket.ping();
    }
  });

  socket.on('close', (code, reasonBuf) => {
    serverLog.push(
      `[连接关闭] ${socket.clientId} code=${code} reason=${reasonBuf.toString('utf8') || '(空)'}`,
    );
  });

  socket.on('error', (err) => {
    // 不处理 error 事件会让 Node 直接抛未捕获异常
    serverLog.push(`[连接错误] ${socket.clientId} ${err.message}`);
  });

  socket.send(JSON.stringify({ type: 'welcome', yourId: socket.clientId }));
});

console.log(`  服务端已就绪，复用同一个 HTTP 端口（无需额外开端口）`);
console.log(`  当前 wss.clients 数量：${wss.clients.size}`);

// ===========================================================================
// 3. 客户端：连接、事件、请求-响应、广播
// ===========================================================================

console.log('\n--- 3. 客户端连接与收发消息 ---');

const wsUrl = `ws://127.0.0.1:${port}/`;
const alice = new WebSocket(wsUrl);
const bob = new WebSocket(wsUrl);

// 【顺序很重要】先把收件箱挂上，再去等 open 事件。
// 反过来的话（先 await open 再挂 message 监听），服务端抢先发来的 welcome 会被丢掉。
const aliceInbox = createInbox(alice);
const bobInbox = createInbox(bob);

await Promise.all([waitForEvent(alice, 'open'), waitForEvent(bob, 'open')]);
console.log('  alice / bob 均已 open');

const aliceWelcome = await aliceInbox.next();
const bobWelcome = await bobInbox.next();
console.log(`  alice 收到欢迎消息：${JSON.stringify(aliceWelcome)}`);
console.log(`  bob   收到欢迎消息：${JSON.stringify(bobWelcome)}`);
assert.notEqual(aliceWelcome.yourId, bobWelcome.yourId, '每个连接的 id 必须唯一');

// --- 3.1 请求-响应（点对点 echo）---
// WS 没有"响应"这个概念，得自己在协议里加 id 做配对，这是新手最容易忽略的一点。
const echoPromise = aliceInbox.next();
const requestId = `req-${Date.now()}`;
alice.send(JSON.stringify({ type: 'echo', id: requestId, payload: { hello: 'ws' } }));
const echoReply = await echoPromise;
console.log(`  alice 发出 id=${requestId}，收到回包：${JSON.stringify(echoReply)}`);
assert.equal(echoReply.id, requestId, '回包必须带上原请求 id 才能配对');

// --- 3.2 广播 ---
// alice 说一句话，alice 和 bob 都应该收到
const aliceGotChat = aliceInbox.next();
const bobGotChat = bobInbox.next();
alice.send(JSON.stringify({ type: 'chat', text: '大家好，我是 alice' }));
const [chatAtAlice, chatAtBob] = await Promise.all([aliceGotChat, bobGotChat]);
console.log(`  alice 收到广播：${JSON.stringify(chatAtAlice)}`);
console.log(`  bob   收到广播：${JSON.stringify(chatAtBob)}`);
assert.equal(chatAtAlice.text, '大家好，我是 alice');
assert.equal(chatAtBob.from, aliceWelcome.yourId, '广播应携带发送者 id 供前端展示');
assert.equal(wss.clients.size, 2, '服务端应记录 2 个活跃连接');

// 再让 bob 说一句，验证双向都能广播
const bobChat = aliceInbox.next();
bob.send(JSON.stringify({ type: 'chat', text: '收到，我是 bob' }));
console.log(`  alice 又收到 bob 的广播：${JSON.stringify(await bobChat)}`);

// ===========================================================================
// 4. 心跳保活：识别"半开连接"
// ===========================================================================

console.log('\n--- 4. 心跳保活（ping / pong）---');

/**
 * 心跳扫描逻辑抽成纯函数，好处有二：
 *   1. 逻辑清晰，一眼能看懂"谁被淘汰了、为什么"；
 *   2. 可以传入假对象做确定性测试，不受真实网络抖动影响。
 *
 * 规则（业界标准做法）：
 *   - 上轮标记为 false ⇒ 这一整轮都没回 pong ⇒ 判定死亡，terminate() 释放资源；
 *   - 否则把标记置 false 并 ping()，等对端回 pong 时再置回 true。
 */
function sweepDeadConnections(clients) {
  const terminatedIds = [];
  let pinged = 0;
  for (const client of clients) {
    if (client.isAlive === false) {
      terminatedIds.push(client.clientId);
      client.terminate(); // 直接掐断，不发关闭握手，避免死连接拖住资源
      continue;
    }
    client.isAlive = false;
    client.ping();
    pinged += 1;
  }
  return { pinged, terminatedIds };
}

// 4.1 用真实连接跑心跳：客户端会自动回 pong，连接始终存活
let realPongCount = 0;
const countPong = () => {
  realPongCount += 1;
};
wss.on('connection', (socket) => socket.on('pong', countPong));
// 上面的监听注册得比已有连接晚，所以给已有连接也补上
for (const client of wss.clients) client.on('pong', countPong);

const HEARTBEAT_INTERVAL = 80;
let sweepRounds = 0;
const heartbeatTimer = setInterval(() => {
  const result = sweepDeadConnections(wss.clients);
  sweepRounds += 1;
  if (result.terminatedIds.length > 0) {
    console.log(`  心跳第 ${sweepRounds} 轮淘汰了：${result.terminatedIds.join(', ')}`);
  }
}, HEARTBEAT_INTERVAL);

await sleep(HEARTBEAT_INTERVAL * 3 + 20);
console.log(`  真实连接心跳：扫描 ${sweepRounds} 轮，服务端共收到 ${realPongCount} 次 pong`);
console.log(`  扫描后 wss.clients 仍为 ${wss.clients.size}，说明两条连接都健康`);
assert.ok(realPongCount >= 2, '健康连接应当正常回 pong');
assert.equal(wss.clients.size, 2);

// 4.2 用假对象演示"淘汰死连接"的分支（真拔网线不好在示例里复现，假对象更稳定）
const fakeConnections = [
  {
    clientId: 'fake-healthy',
    isAlive: true,
    ping() {
      this.pinged = true;
    },
    terminate() {
      this.terminated = true;
    },
  },
  {
    clientId: 'fake-zombie',
    isAlive: false, // 上一轮 ping 出去后一直没回 pong
    ping() {
      this.pinged = true;
    },
    terminate() {
      this.terminated = true;
    },
  },
];
const fakeResult = sweepDeadConnections(fakeConnections);
console.log(`  假连接扫描结果：ping 了 ${fakeResult.pinged} 条，淘汰 ${fakeResult.terminatedIds.join(', ')}`);
assert.deepEqual(fakeResult.terminatedIds, ['fake-zombie']);
assert.equal(fakeConnections[0].pinged, true);
assert.equal(fakeConnections[0].terminated, undefined, '健康连接不能被误杀');
assert.equal(fakeConnections[1].terminated, true, '僵尸连接必须被 terminate');
console.log('  也就是说：NAT 超时 / 拔网线造成的"半开连接"，最多 2 个心跳周期就会被回收。');

// ===========================================================================
// 5. 优雅关闭：连接、心跳、服务器全部清理干净
// ===========================================================================

console.log('\n--- 5. 优雅关闭 ---');
clearInterval(heartbeatTimer); // 关键！不清掉它进程永远不退出

// 先让服务端主动关闭 bob，演示 close 事件的 code / reason 能完整传到对端
const bobClosed = waitForEvent(bob, 'close');
for (const client of wss.clients) {
  if (client.clientId === bobWelcome.yourId) client.close(4001, '服务端要求下线');
}
const [bobCode, bobReasonBuf] = await bobClosed;
console.log(`  bob 收到关闭：code=${bobCode} reason="${bobReasonBuf.toString('utf8')}"`);
assert.equal(bobCode, 4001);

// 再走标准关闭流程：客户端先关，服务器后关
await Promise.all([closeSocket(alice, 1000, '示例结束'), closeSocket(bob, 1000, '示例结束')]);
console.log('  客户端已全部关闭');

await new Promise((resolve, reject) => {
  wss.close((err) => (err ? reject(err) : resolve()));
});
console.log('  WebSocketServer 已关闭');

await new Promise((resolve, reject) => {
  server.close((err) => (err ? reject(err) : resolve()));
  // 陷阱提醒：Node 内置 fetch（undici）默认开启 keep-alive，
  // 轮询阶段留下的一条空闲 TCP 连接会让 server.close() 的回调永远不触发，
  // 进程就"卡住不退出"了。必须主动断开这些空闲连接。
  if (typeof server.closeIdleConnections === 'function') server.closeIdleConnections();
  if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
});
console.log('  HTTP 服务器已关闭（同端口的 WS 与 HTTP 一起释放）');

console.log('\n  服务端事件日志：');
for (const line of serverLog) console.log(`    ${line}`);

// ===========================================================================
// 6. 总结：什么时候用 WS，什么时候不用
// ===========================================================================

console.log('\n--- 6. 选型对比小结 ---');

// 说明：中文字符是"全角"的，终端里 1 个汉字占 2 个英文字符宽度，
// 所以用 padEnd 做表格对齐会歪。这里改用"每行一个维度"的写法，稳定且易读。
const comparison = [
  ['通信方向', '客户端拉（单向）', '双向全双工'],
  ['实时延迟', '≈ 轮询间隔（最差一倍）', '≈ 网络 RTT（通常 <10ms）'],
  ['单条消息开销', '完整 HTTP 头（几百字节起）', '2~14 字节帧头'],
  ['空转浪费', '消息越稀疏浪费越大', '空闲时不产生任何流量'],
  ['连接成本', '每次请求新建/复用 TCP', '一次握手长期复用'],
  ['断线恢复', '天然无状态，重试即可', '需自己实现重连 + 补发'],
  ['代理/防火墙', '几乎不会被拦', '部分企业代理会掐掉，需降级方案'],
  ['适用场景', '低频、可容忍延迟、无状态', '高频、强实时、服务端主动推'],
];

for (const [dim, polling, wsSide] of comparison) {
  console.log(`  · ${dim}`);
  console.log(`      HTTP 轮询：${polling}`);
  console.log(`      WebSocket：${wsSide}`);
}

console.log('\n  实践建议：');
console.log('    1. 单向推送（只服务端 → 客户端）优先考虑 SSE（Server-Sent Events）：');
console.log('       它就是一个"不结束的 HTTP 响应"，自带断线重连，还能穿过大部分代理。');
console.log('    2. 双向且要广播/房间/自动重连 → socket.io（基于 ws 的更高层封装，代价是包更大、');
console.log('       且前后端必须都用它，协议不通用）。');
console.log('    3. 只要"原生协议 + 完全掌控" → 直接用 ws，重连/心跳/鉴权自己写，本文件就是模板。');
console.log('    4. 无论用哪个，服务端都必须有：心跳淘汰、连接数上限、鉴权（握手时校验 token）、');
console.log('       以及按房间分组而不是全量广播。');

console.log('\n完成：ws 库的 服务端 / 客户端 / 广播 / 心跳 / 优雅关闭 完整闭环演示结束，退出码 0。');
