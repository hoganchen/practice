/**
 * ============================================================================
 * 知识点：WebSocket 广播、房间分组与心跳保活
 * ============================================================================
 *
 * 【所属分类】36_realtime_and_streams —— 实时通信与流式处理
 * 【难度等级】进阶
 * 【前置知识】36_realtime_and_streams/01_websocket_basics.js
 *
 * 【也见】29_npm_libraries/13_ws_websocket.js —— 广播与心跳在那儿也完整讲了一遍。
 *        本文件是广播/房间/心跳的主场（含僵尸连接与半开连接的处理）；那篇是「第三方库」视角。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    单个 WebSocket 连接只能一对一。真实应用里几乎都是"多人"场景，
 *    于是需要在服务端维护一张**连接表**，并在此之上实现三件事：
 *      · 广播（broadcast）：一条消息发给所有在线连接
 *      · 房间（room / channel）：把连接分组，消息只在组内流转
 *      · 心跳（heartbeat）：定期探测连接是否还活着，清掉"僵尸连接"
 *    这三件事合起来就是聊天室、协同编辑、多房间直播弹幕的最小骨架。
 *
 * 2. 为什么需要（真实项目场景）
 *    · 广播：聊天室消息、系统公告、股票行情推送、多端状态同步。
 *      没有广播，你就得自己遍历连接表——而连接表的管理（什么时候加入、
 *      什么时候移除）正是最容易写出 bug 的地方。
 *    · 房间：一个 IM 应用有上万个群，一条消息只该发给群成员，而不是全网广播。
 *      直播场景里则是"每个直播间一个房间"，弹幕只发本房间。
 *      房间还能天然做权限边界与资源隔离。
 *    · 心跳：这是**最容易被忽略、上线后最容易出事**的一环。原因有三：
 *        ① TCP 连接可能是"半开"的：对端机器断电、网线被拔、NAT 超时，
 *           都不会发出 FIN/RST，服务端以为连接还在，实际早就是死连接了。
 *        ② 运营商/NAT/负载均衡会静默回收空闲连接（典型 60~300 秒），
 *           连接看起来还在，实际再也发不出数据。
 *        ③ 半开连接会持续占用内存与文件描述符，用户量一大就是内存泄漏。
 *
 * 3. 核心语法要点
 *    广播：
 *      - wss.clients                        服务端所有在线连接的 Set（只读，别直接改）
 *      - socket.send(data)                  发送给单个连接
 *      - 广播 = 遍历 wss.clients，逐个 send，并跳过 readyState !== OPEN 的
 *      - JSON.stringify 后发送是最常见的做法：用一个 type 字段做消息路由
 *    房间：
 *      - 用 Map<socket, meta> 或 socket 上的自定义属性保存"这个连接属于哪个房间"
 *      - 用 Map<string, Set<socket>> 维护"房间 -> 成员集合"的反向索引，广播更快
 *    心跳（ws 官方推荐写法）：
 *      - socket.ping([data])                发送 Ping 控制帧（opcode 0x9）
 *      - socket.on('pong', cb)              收到对方的 Pong 控制帧（opcode 0xA）
 *      - socket.isAlive                     自己在 socket 上挂的自定义标记位
 *      - socket.terminate()                 不打招呼直接销毁 TCP 连接
 *      - 客户端（浏览器 / Node 内置 WebSocket）**会自动回 Pong**，无需写代码
 *
 * 4. 常见陷阱
 *    陷阱 1：广播时不检查 readyState。正在关闭（CLOSING）的连接上 send()
 *            会抛错或静默丢弃，还可能抛出未捕获异常把整个服务打挂。
 *    陷阱 2：在 'close' 事件里忘记把连接从房间索引中删除。
 *            用户会"永远留在房间里"，广播时对已销毁的 socket 发消息。
 *    陷阱 3：遍历 wss.clients 的过程中删除元素。JS 的 Set 在 for...of 中删除
 *            当前元素是安全的，但为了清晰，广播时最好先复制成数组再遍历。
 *    陷阱 4：把心跳间隔设得太短。心跳本身也是流量，移动端还会显著耗电。
 *            生产上一般是 30 秒心跳 + 允许错过 2~3 次，本示例为了演示压缩到 150ms。
 *    陷阱 5：以为 terminate() 是优雅关闭。它会直接销毁 TCP 连接，
 *            客户端收到的是 1006（异常关闭），不会有关闭握手。
 *            只有确认对方已经失联时才该这么做，且应清零心跳定时器避免泄漏。
 *    陷阱 6：用 setInterval 做心跳却忘了在服务关闭时 clearInterval，
 *            进程会因为定时器一直活着而无法自然退出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 36_realtime_and_streams/02_websocket_broadcast.js
 *   本示例只在 127.0.0.1 上自建服务器并连接自己，**不访问外网**。
 *
 * 【预期输出】
 *   1) 3 个客户端连接，服务端打印在线连接数
 *   2) 广播：任一客户端发言，所有客户端都收到
 *   3) 房间：两个客户端进 #js 房间，第三个留在 #python 房间，消息互不串台
 *   4) 退房与在线计数
 *   5) 心跳：服务端每 150ms ping 一次，打印 Pong 往返耗时；
 *      并制造一个"TCP 还连着但从不回 Pong"的僵尸连接，由心跳检测并踢掉
 *   6) 清理所有连接与定时器，进程自然退出
 * ============================================================================
 */

import net from 'node:net';
import { WebSocketServer, WebSocket } from 'ws';

// ---------------------------------------------------------------------------
// 0. 工具函数
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`超时保护触发：${label} 在 ${ms}ms 内没有完成`)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

/**
 * 等待某个客户端收满 n 条消息（或超时）。
 * 示例里到处都要"等服务端把消息推过来"，用一个辅助函数避免重复代码。
 */
function waitForMessages(inbox, n, ms, label) {
  return withTimeout(
    new Promise((resolve) => {
      const check = () => (inbox.length >= n ? resolve() : setTimeout(check, 15));
      check();
    }),
    ms,
    label,
  );
}

// 安全兜底（unref 不会阻止进程退出，只在进程因别的原因卡住时兜底）
setTimeout(() => {
  console.log('\n[安全兜底] 进程仍未退出，强制结束。');
  process.exit(0);
}, 10_000).unref();

// ---------------------------------------------------------------------------
// 1. 启动服务端，并设计一套消息协议
// ---------------------------------------------------------------------------
console.log('--- 1. 启动服务端：设计一套 JSON 消息协议 ---');

const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
await new Promise((resolve) => wss.once('listening', resolve));
const PORT = wss.address().port;
console.log(`  服务端监听 ws://127.0.0.1:${PORT}`);

// 连接表。ws 自己维护的 wss.clients 只有 socket，没有业务信息，
// 所以真实项目一定会额外维护一份"元数据表"。
// Map<socket, { name, room }>
const meta = new Map();
// 反向索引：房间名 -> 该房间的 socket 集合。广播时直接拿集合，不必遍历全部连接。
// Map<string, Set<socket>>
const rooms = new Map();

console.log('  消息协议约定（用 type 字段路由）：');
console.log('    客户端 -> 服务端：{ type: "hello", name } / { type: "join", room } / { type: "msg", text } / { type: "leave" }');
console.log('    服务端 -> 客户端：{ type: "system" | "broadcast" | "room" | "welcome", ... }');

// 心跳相关的状态。
// 注意：**必须在这个最早的 connection 处理器里就把 pong 监听挂好**，
// 否则在处理器注册之前连上的客户端永远不会被标记为存活，会被心跳误杀。
const pingSentAt = new WeakMap(); // socket -> 发出 Ping 的时间戳，用来算往返耗时

/** 给连接装上心跳所需的两个钩子 */
function attachHeartbeat(socket) {
  socket.isAlive = true; // 自定义标记位，ws 本身不提供
  socket.on('pong', () => {
    socket.isAlive = true;
    const rtt = Date.now() - (pingSentAt.get(socket) ?? Date.now());
    console.log(`  [心跳] 收到 Pong，往返耗时 ${rtt}ms（说明这条连接是活的）`);
  });
}

/** 把消息发给单个连接（带状态检查，这是必须的） */
function sendTo(socket, payload) {
  if (socket.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify(payload));
  return true;
}

/**
 * 广播。filter 可选，用来实现"只发给某个房间"。
 * 注意先 [...wss.clients] 复制一份再遍历，避免遍历过程中集合被修改。
 */
function broadcast(payload, filter) {
  let count = 0;
  for (const socket of [...wss.clients]) {
    if (filter && !filter(socket)) continue;
    if (sendTo(socket, payload)) count += 1;
  }
  return count;
}

/** 只广播给指定房间的成员 */
function broadcastToRoom(room, payload) {
  return broadcast(payload, (socket) => meta.get(socket)?.room === room);
}

/** 把连接从房间索引里摘掉（若不摘，就会出现"幽灵成员"） */
function leaveRoom(socket) {
  const info = meta.get(socket);
  if (!info?.room) return null;
  const members = rooms.get(info.room);
  members?.delete(socket);
  if (members && members.size === 0) rooms.delete(info.room);
  const left = info.room;
  info.room = null;
  return left;
}

// ---------------------------------------------------------------------------
// 2. 处理连接、入房、退房、发言
// ---------------------------------------------------------------------------
console.log('\n--- 2. 处理客户端消息 ---');

wss.on('connection', (socket, req) => {
  const name = `访客${meta.size + 1}`; // 先给个临时名，客户端可以用 hello 改名
  meta.set(socket, { name, room: null });
  attachHeartbeat(socket);
  sendTo(socket, { type: 'welcome', name, online: wss.clients.size });
  console.log(`  [服务端] ${name} 上线，当前在线 ${wss.clients.size}`);

  socket.on('message', (raw) => {
    let msg;
    // 永远不要相信客户端发来的数据：可能是非法 JSON、可能是超长文本。
    try {
      msg = JSON.parse(raw.toString('utf8'));
    } catch {
      sendTo(socket, { type: 'system', text: '消息不是合法 JSON，已忽略' });
      return;
    }

    switch (msg.type) {
      case 'hello': {
        // 真实项目里这里应该做鉴权（校验 token），本示例只演示改名
        const info = meta.get(socket);
        console.log(`  [服务端] ${info.name} 改名为 ${msg.name}`);
        info.name = String(msg.name);
        sendTo(socket, { type: 'system', text: `你好，${info.name}` });
        break;
      }
      case 'join': {
        leaveRoom(socket); // 先退出旧房间（一个连接同时只属于一个房间）
        const info = meta.get(socket);
        info.room = String(msg.room);
        if (!rooms.has(info.room)) rooms.set(info.room, new Set());
        rooms.get(info.room).add(socket);
        console.log(`  [服务端] ${info.name} 加入房间 #${info.room}，房间人数 ${rooms.get(info.room).size}`);
        sendTo(socket, { type: 'system', text: `已加入 #${info.room}` });
        break;
      }
      case 'leave': {
        const left = leaveRoom(socket);
        if (left) sendTo(socket, { type: 'system', text: `已退出 #${left}` });
        break;
      }
      case 'msg': {
        const info = meta.get(socket);
        if (!info.room) {
          sendTo(socket, { type: 'system', text: '请先加入一个房间' });
          return;
        }
        // 房间广播：只发给同房间的人
        const n = broadcastToRoom(info.room, {
          type: 'room',
          room: info.room,
          from: info.name,
          text: msg.text,
        });
        console.log(`  [服务端] ${info.name} 在 #${info.room} 发言，广播给 ${n} 人`);
        break;
      }
      default:
        sendTo(socket, { type: 'system', text: `未知消息类型：${msg.type}` });
    }
  });

  socket.on('close', (code) => {
    const info = meta.get(socket);
    leaveRoom(socket); // 关键：断开时一定要从房间索引里移除
    meta.delete(socket);
    console.log(`  [服务端] ${info?.name ?? '未知'} 断开（code=${code}），当前在线 ${wss.clients.size}`);
  });
});

// ---------------------------------------------------------------------------
// 3. 三个客户端上线
// ---------------------------------------------------------------------------
console.log('\n--- 3. 三个客户端上线 ---');

/** 创建一个客户端，自动记录收到的所有消息 */
function createClient(name) {
  const ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
  const inbox = [];
  ws.addEventListener('message', (e) => inbox.push(JSON.parse(e.data)));
  ws.sendMessage = (obj) => ws.send(JSON.stringify(obj));
  return { name, ws, inbox };
}

// 注意：三个 new WebSocket 是并发握手的，服务端 accept 的先后顺序并不确定，
// 所以这里让每个客户端连上后主动上报自己的名字，而不是靠服务端分配，
// 这样输出才稳定可读（真实项目也是靠登录态标识用户，而不是连接顺序）。
const clients = [createClient('A'), createClient('B'), createClient('C')];
await withTimeout(
  Promise.all(clients.map((c) => new Promise((r) => c.ws.addEventListener('open', r, { once: true })))),
  3000,
  '三个客户端建立连接',
);
for (const c of clients) c.ws.sendMessage({ type: 'hello', name: c.name });
await sleep(150);
// 并发握手导致服务端 accept 顺序不确定，所以 A 拿到的临时名可能是"访客2"。
// 这正好说明：业务身份必须由客户端上报（或登录态决定），不能依赖连接顺序。
for (const c of clients) console.log(`    ${c.name} 收到的 welcome：${JSON.stringify(c.inbox[0])}`);
console.log(`  三个客户端已用 hello 上报名字：${clients.map((c) => c.name).join(', ')}`);

// ---------------------------------------------------------------------------
// 4. 广播到全体
// ---------------------------------------------------------------------------
console.log('\n--- 4. 广播：一条消息，所有人收到 ---');

// 先清空收件箱，方便观察本段结果
clients.forEach((c) => (c.inbox.length = 0));

// 服务端主动发起一次全员广播（真实场景：系统公告、行情推送）
const reached = broadcast({ type: 'broadcast', text: '服务器将于 10 分钟后重启' });
console.log(`  [服务端] 全员广播已发送给 ${reached} 个连接`);

await waitForMessages(clients[0].inbox, 1, 3000, '等待广播');
await sleep(60);
console.log(`  三个客户端收到的消息数：${clients.map((c) => c.inbox.length).join(', ')}`);
console.log(`  内容：${clients[0].inbox[0].text}`);

// ---------------------------------------------------------------------------
// 5. 房间分组
// ---------------------------------------------------------------------------
console.log('\n--- 5. 房间：消息只在组内流转 ---');

clients.forEach((c) => (c.inbox.length = 0));

// A、B 进 #js 房间，C 进 #python 房间
clients[0].ws.sendMessage({ type: 'join', room: 'js' });
clients[1].ws.sendMessage({ type: 'join', room: 'js' });
clients[2].ws.sendMessage({ type: 'join', room: 'python' });
await sleep(150);

console.log(`  房间索引：${[...rooms.entries()].map(([r, s]) => `#${r}(${s.size}人)`).join('  ')}`);

clients.forEach((c) => (c.inbox.length = 0));

// A 在 #js 发言
clients[0].ws.sendMessage({ type: 'msg', text: '有人写 TypeScript 吗？' });
await waitForMessages(clients[0].inbox, 1, 2000, '等待房间广播');
await sleep(80);

const roomMsgs = (c) => c.inbox.filter((m) => m.type === 'room').length;
console.log(`  A 在 #js 发言后：同房间的 B 收到 ${roomMsgs(clients[1])} 条，A 自己也收到 ${roomMsgs(clients[0])} 条`);
console.log(`  而 #python 房间的 C 收到 ${roomMsgs(clients[2])} 条 —— 房间之间互不串台`);
const got = clients[1].inbox.find((m) => m.type === 'room');
console.log(`  B 收到的内容：[${got.from} 在 #${got.room}] ${got.text}`);

// 跨房间广播：用 broadcastToRoom 指定房间
console.log('\n  定向广播（服务端只发给 #python）：');
clients.forEach((c) => (c.inbox.length = 0));
const sent = broadcastToRoom('python', { type: 'room', from: '系统', text: 'Python 3.14 已发布' });
await sleep(100);
console.log(`    命中 ${sent} 个连接；C 收到 ${clients[2].inbox.length} 条，A/B 收到 ${clients[0].inbox.length}/${clients[1].inbox.length} 条`);

// 退房：验证"幽灵成员"不会残留
clients[1].ws.sendMessage({ type: 'leave' });
await sleep(120);
console.log(`\n  B 退出后房间索引：${[...rooms.entries()].map(([r, s]) => `#${r}(${s.size}人)`).join('  ')}（空房间会被自动删除）`);

// ---------------------------------------------------------------------------
// 6. 心跳保活
// ---------------------------------------------------------------------------
console.log('\n--- 6. 心跳保活：检测只连不回应的僵尸连接 ---');

// 先制造一个"僵尸连接"：用最原始的 TCP socket 完成 WebSocket 握手，
// 之后**故意不读取、不回应任何数据**，模拟"机器断电 / 网线被拔 / NAT 静默回收"
// 这类 TCP 层看起来还连着、应用层其实已经死掉的连接。
const zombie = net.connect(PORT, '127.0.0.1');
await new Promise((resolve) => zombie.once('connect', resolve));
zombie.write(
  [
    'GET / HTTP/1.1',
    `Host: 127.0.0.1:${PORT}`,
    'Upgrade: websocket',
    'Connection: Upgrade',
    // 这个值是 RFC 6455 文档里的示例 key，服务端并不校验它的内容
    'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
    'Sec-WebSocket-Version: 13',
    '',
    '',
  ].join('\r\n'),
);
await sleep(150);
console.log(`  僵尸连接已接入（TCP 上完全正常），当前服务端在线连接数 ${wss.clients.size}`);
console.log('  它从此刻起不再读取、不再回应任何数据。');

// 心跳机制（ws 官方文档的标准写法）：
//   1) 每个连接上挂一个 isAlive 标记，收到 Pong 就置回 true
//   2) 定时器每轮：先检查上一轮的标记，还是 false 就说明对方没回 —— 踢掉
//   3) 然后把标记置为 false，并主动发一个 Ping
const HEARTBEAT_INTERVAL = 150; // 生产环境一般是 30000ms，这里为演示压缩
let heartbeatRounds = 0;

const heartbeatTimer = setInterval(() => {
  heartbeatRounds += 1;
  const snapshot = [...wss.clients];
  let pinged = 0;
  let killed = 0;

  for (const socket of snapshot) {
    if (socket.isAlive === false) {
      // 上一轮发了 Ping，这一轮还没收到 Pong —— 判定为死连接
      console.log(`  [心跳] 第 ${heartbeatRounds} 轮：某连接连续未回 Pong，terminate() 掉`);
      killed += 1;
      socket.terminate(); // 直接销毁 TCP，不发关闭帧
      continue;
    }
    socket.isAlive = false; // 先假设它死了，收到 Pong 再改回 true
    pingSentAt.set(socket, Date.now());
    socket.ping(); // 发送 Ping 控制帧（opcode 0x9）
    pinged += 1;
  }
  if (pinged > 0 || killed > 0) {
    console.log(`  [心跳] 第 ${heartbeatRounds} 轮：ping ${pinged} 个，踢掉 ${killed} 个，在线 ${wss.clients.size}`);
  }
}, HEARTBEAT_INTERVAL);

// 关于 Pong：服务端只需在 connection 时挂好 'pong' 监听（见 attachHeartbeat）；
// 客户端侧（浏览器 / Node 内置 WebSocket）会在协议层自动回 Pong，
// 一行业务代码都不用写 —— 这是 WebSocket 协议自带的能力，不是库的魔法。

// 等 4 轮心跳，足够让僵尸连接被检测出来（2 轮 ping + 1 轮判定）
await sleep(HEARTBEAT_INTERVAL * 4 + 80);
console.log(`  4 轮心跳后，服务端在线连接数：${wss.clients.size}（僵尸连接已被清理）`);

// 僵尸连接在服务端侧被 terminate 后，本地的 TCP socket 会收到 close
zombie.destroy();

clearInterval(heartbeatTimer); // 必须清掉，否则进程不会退出
console.log('  心跳定时器已清除。');
console.log('  生产实践：心跳间隔 30s + 容忍 2 次未响应；同时客户端也要有"看门狗"，');
console.log('            因为客户端同样无法感知服务端的静默失联。');

// ---------------------------------------------------------------------------
// 7. 清理
// ---------------------------------------------------------------------------
console.log('\n--- 7. 关闭所有连接与服务器 ---');

for (const c of clients) c.ws.close(1000, '演示结束');
await sleep(120);
// 关闭顺序：先关客户端，再关服务器。
// wss.close() 只停止接受新连接，已有连接还在的话回调永远不触发。
for (const socket of [...wss.clients]) socket.terminate();
await withTimeout(new Promise((resolve) => wss.close(resolve)), 3000, 'wss.close');
console.log(`  服务器已关闭，最终在线连接数 ${wss.clients.size}，元数据表剩余 ${meta.size} 条`);

console.log('\n全部演示结束。');
