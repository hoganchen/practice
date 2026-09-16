/**
 * ============================================================================
 * 知识点：WebSocket 客户端重连 —— 指数退避、抖动、状态恢复与心跳保活
 * ============================================================================
 *
 * 【所属分类】36_realtime_and_streams —— 实时通信与流式处理
 * 【难度等级】高级
 * 【前置知识】36_realtime_and_streams/01_websocket_basics.js、36_realtime_and_streams/03_server_sent_events.js、18_async/13_timeout_and_abort.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    01 篇的陷阱 6 白纸黑字写着「生产环境必须自己实现重连（见后续示例）」，
 *    但在此之前**根本没有后续示例** —— 这是一句悬空承诺。本篇把它兑现。
 *    **WebSocket 协议本身不带重连**：连接一断，`readyState` 变成 `CLOSED`，
 *    协议栈就到此为止了，它不会、也没办法自己重新连上。想继续用，只有三个选择：
 *      (a) 重新 `new WebSocket(url)`（本篇的做法）；
 *      (b) 用户手动刷新页面（体验最差）；
 *      (c) 换用 SSE —— `EventSource` **协议内置**了重连与断点续传（见 03 篇）。
 *    一个生产可用的重连实现 = 下面这五件事，缺一件都会在真实网络里出问题：
 *      ① **退避策略**：多久重试一次（指数退避 + 抖动）；
 *      ② **放弃条件**：重试多少次之后认输，什么关闭码根本不该重试；
 *      ③ **状态恢复**：连上之后要重新鉴权、重新入房、把断线期间漏掉的消息补回来；
 *      ④ **心跳保活**：识别"半开连接"（TCP 还在、对端已死）并主动断开触发重连；
 *      ⑤ **资源清理**：定时器、监听器、重连任务在主动关闭时必须全部停掉。
 *
 * 2. 为什么需要（真实项目场景）
 *    WebSocket 断线是**常态**而不是异常：
 *      · 手机切基站 / 进电梯 / 锁屏，网络接口整个换掉；
 *      · 公司网络、NAT 网关、负载均衡器有**空闲超时**（常见 60s / 300s），
 *        长时间没数据就把连接悄悄回收；
 *      · 服务端发布重启、扩容缩容、K8s 滚动更新，连接必然被切断；
 *      · 中间设备（防火墙、代理）会把"看起来卡住"的连接直接丢弃。
 *    没有重连的实时应用，用户会看到"消息不刷新了"，只能刷新页面 ——
 *    而这类 bug 在开发机上几乎复现不出来（本地网络太稳了）。
 *    重连做好了，掉线对用户就是"卡一下"，而不是"功能坏了"。
 *
 *    **抖动（jitter）是重连策略里最容易被忽略、后果最严重的一环**：
 *    假设服务端重启，10 万个客户端**同时**掉线。如果所有客户端都"等 1 秒再重连"，
 *    那 1 秒后就会有 10 万个连接请求同时砸向刚刚启动、冷缓存、还没预热完的服务端 ——
 *    它大概率直接被打挂，于是所有客户端又一起重试，形成**惊群 / 重试风暴**
 *    （thundering herd）。服务端可能因此永远起不来。
 *    抖动的作用就是把这 10 万个请求**摊开**到一个时间窗里，让服务端能慢慢接住。
 *
 * 3. 核心语法要点
 *    (a) **指数退避（exponential backoff）**：
 *          delay = min(baseDelay × factor^attempt, maxDelay)
 *        每次失败都把等待时间翻倍，直到一个上限。效果是"前期快速恢复、后期不放弃"。
 *        常见参数：base 500ms~1s、factor 2、max 30s~60s。
 *    (b) **抖动（jitter）**的三种常见变体（AWS 那篇著名的 *Exponential Backoff And Jitter*）：
 *          · 无抖动     delay = exp                       ← 会引发惊群，**不要用**
 *          · 等量抖动   delay = exp/2 + random(0, exp/2)   ← 窗口减半，效果一般
 *          · 全量抖动   delay = random(0, exp)             ← 推荐，摊得最开
 *        本文件默认用**全量抖动**，并把三种的差异打印出来对比。
 *    (c) **关闭码决定要不要重连**（见 01 篇的关闭码表）：
 *          1000 正常关闭 / 1001 端点离开   → 是"有意关闭"，不该无脑重连（视业务而定）
 *          1006 异常断开（TCP 直接断）     → **必须重连**，这是最常见的掉线
 *          1008 违反策略 / 4001 被踢出     → **不要重连**，重连也还是会被拒
 *          1011 服务端内部错误             → 可以重连，但要用更长的退避
 *        注意：`close` 事件里拿到的 `code` 如果是 1006，`reason` 一定是空字符串 ——
 *        因为 1006 是"没有任何关闭帧"的本地合成码，没有对端可以告诉你原因。
 *    (d) **状态恢复（session resume）**：重连**不是**简单地再连一次，而是"续上"。
 *        最小实现三件套：
 *          ① 重新鉴权（token 可能还有效，也可能已经过期，要做失败分支）；
 *          ② 重新订阅（入房、订阅频道）；
 *          ③ **补拉**：客户端带上"我最后收到的序号/游标"，服务端把缺口重放一遍。
 *        `since` / `lastSeq` 这个游标就是 03 篇 SSE 的 `Last-Event-ID` 的 WebSocket 版，
 *        只不过 WebSocket 协议不帮你带，得自己在握手后的第一条消息里发。
 *    (e) **心跳（heartbeat）与半开连接**：
 *        TCP 连接可能处于"半开"状态 —— 对端进程已经死了，但本地 socket 还不知道，
 *        `readyState` 依然是 `OPEN`，`send()` 甚至不会报错（数据被写进内核缓冲区后石沉大海）。
 *        唯一的识别办法是**应用层主动探测**：
 *          · 客户端每 N 秒发一个 `{type:'ping'}`，服务端回 `{type:'pong'}`；
 *          · 客户端记录"最后一次收到 pong 的时间"，超过阈值就判定连接已死，
 *            调用 `terminate()` 强制断开，从而触发 `close` 事件和后续重连。
 *        `ws` 库还提供了协议层的 `socket.ping()` / `'pong'` 事件（更省流量），
 *        但**浏览器 API 不暴露 ping 帧**，所以想前后端通用就得用应用层心跳。
 *
 * 4. 常见陷阱
 *    - **无抖动**：这是最致命也最常见的一个。见上面"惊群"的说明。
 *      服务端重启把客户端全打挂的那种事故，根因十有八九是这里。
 *    - **固定间隔重连**（每 3 秒试一次）：重试风暴 + 服务端长期承压。
 *      指数退避的意义是"给对方喘息时间"，而不是"我尽快连上"。
 *    - **不设上限**：指数退避会一直翻倍下去（2^30 秒 ≈ 34 年），
 *      必须用 `min(..., maxDelay)` 封顶。
 *    - **重连成功就以为万事大吉**：状态没恢复，用户看到的是"连上了但收不到消息"。
 *      必须重新鉴权 + 重新入房 + 补拉缺口。
 *    - **补拉时把 `since` 弄错**：用了"收到的消息条数"而不是"服务端分配的严格递增序号"，
 *      一旦有消息被过滤/丢失，游标就永久错位。**游标必须由服务端分配**。
 *    - **在 onclose 里直接递归调用 connect()**：会瞬间打出成千上万个连接请求，
 *      等于把抖动和退避全都绕过了。必须走"定时器 + 退避"这条路。
 *    - **`onerror` 里写重连逻辑**：`error` 之后**一定**还会触发 `close`，
 *      两处都写会导致同一次断线重连两次（甚至指数级放大）。
 *      正确做法：`onerror` 只记日志，**重连逻辑只放在 `onclose` 里**。
 *    - **忘了清理定时器**：用户主动关闭后，心跳定时器和重连定时器还在跑，
 *      于是"关掉的连接"又自己连回来了，还会拖住 Node 进程不退出。
 *      主动 `close()` 时必须把所有定时器清掉，并立一个 `closedByUser` 标志。
 *    - **用 `close()` 去检测半开连接**：`close()` 会等对端回关闭帧，对端已死就永远等不到。
 *      检测半开要用 `terminate()`（立刻销毁 socket）。
 *    - **重连风暴没有上限**：页面在后台标签页里疯狂重连会耗尽手机电量。
 *      标签页重新可见时（`visibilitychange`）再做一次"立即重试"是更好的策略 ——
 *      后台就让它慢慢退避。
 *    - **心跳间隔太长**：NAT 超时常见 60s，心跳就得显著小于它（比如 20~30s）。
 *      本示例为了跑得快用了 100ms 量级，真实项目按上面的数量级设置。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 36_realtime_and_streams/07_websocket_reconnect.js
 *   本示例只在 127.0.0.1 上自建 ws 服务端并连接自己，**不使用 fetch、不访问外网**。
 *   为了让演示能在几秒内跑完，退避参数被压缩到毫秒级（真实项目请按注释里的量级设置）。
 *   演示结束后会清理所有定时器、关闭所有连接与服务端，进程自然退出。
 *
 * 【预期输出】
 *   1) 退避公式与三种抖动的对比表（含每个 attempt 的等待区间）；
 *   2) 关闭码与"该不该重连"的判定表；
 *   3) 完整时间线：连接 -> 鉴权 -> 入房 -> 收消息 -> 服务端强制断开（1006）
 *      -> 退避（含抖动）-> 重连 -> 重新鉴权 -> 重新入房并带游标补拉 -> 补齐缺口；
 *   4) 半开连接演示：服务端进入"静默"（不回 pong、不推送），
 *      客户端心跳超时 -> terminate() -> 重连成功；
 *   5) 放弃条件演示：连一个没人监听的端口，观察退避增长并在第 N 次后放弃；
 *   6) 校验收到的序号序列**连续无缺口**，并打印统计与收尾。
 * ============================================================================
 */

import { WebSocketServer } from 'ws';
import WebSocket from 'ws';

// ---------------------------------------------------------------------------
// 0. 工具
// ---------------------------------------------------------------------------

/** 启动基准时刻，时间线里的所有 [+123ms] 都相对于它。 */
const T0 = Date.now();
/** 打印一行带相对时间戳的日志 —— 时间线是本示例最重要的输出。 */
const log = (msg) => console.log(`  [+${String(Date.now() - T0).padStart(4)}ms] ${msg}`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 给 Promise 加超时保护：任何一步卡住都不会让进程永久挂起。 */
function withTimeout(promise, ms, label) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`超时保护触发：${label} 在 ${ms}ms 内没有完成`)), ms);
  });
  return Promise.race([promise, guard]).finally(() => clearTimeout(timer));
}

/** 轮询等待条件成立。 */
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

// 最外层安全兜底：无论前面哪里出问题，都不允许进程挂死。
// unref() 让这个定时器**不会**阻止进程正常退出。
setTimeout(() => {
  console.log('\n[安全兜底] 进程仍未退出，强制结束（正常流程不应触发）。');
  process.exit(0);
}, 20_000).unref();

/** 按"显示宽度"补空格（中文占 2 列），只为了终端里对齐好看。 */
const displayWidth = (s) => [...s].reduce((w, ch) => w + (/[一-鿿＀-￯]/.test(ch) ? 2 : 1), 0);
const padLabel = (s, width) => s + ' '.repeat(Math.max(0, width - displayWidth(s)));

// ---------------------------------------------------------------------------
// 1. 退避与抖动
// ---------------------------------------------------------------------------
console.log('--- 1. 指数退避与抖动：参数怎么定 ---');

/** 退避参数。真实项目参考值：base 500~1000ms、factor 2、max 30~60s、maxAttempts 10~∞。 */
const RETRY = {
  baseDelayMs: 40, // 演示压缩：真实 500~1000
  factor: 2,
  maxDelayMs: 300, // 演示压缩：真实 30000~60000
  maxAttempts: 5,
  jitter: 'full', // 'none' | 'equal' | 'full'
};

/**
 * 计算第 attempt 次重试该等多久（attempt 从 0 开始）。
 * 公式：delay = min(base × factor^attempt, max)，再按抖动策略取随机值。
 * @param {number} attempt 连续失败次数
 * @param {'none'|'equal'|'full'} jitter 抖动策略
 * @returns {number} 等待毫秒数
 */
function backoffDelay(attempt, jitter = RETRY.jitter) {
  const exponential = Math.min(RETRY.maxDelayMs, RETRY.baseDelayMs * RETRY.factor ** attempt);
  if (jitter === 'full') return Math.round(Math.random() * exponential); // 全量抖动：摊得最开
  if (jitter === 'equal') return Math.round(exponential / 2 + Math.random() * (exponential / 2));
  return Math.round(exponential); // 无抖动：所有客户端会在同一毫秒醒来
}

console.log(`  参数：base=${RETRY.baseDelayMs}ms  factor=${RETRY.factor}  max=${RETRY.maxDelayMs}ms  maxAttempts=${RETRY.maxAttempts}`);
console.log('  （为了几秒内跑完，这里把 base/max 压缩到了毫秒级；真实项目按注释里的数量级设置。）\n');
console.log('  三种抖动策略在各 attempt 下的等待区间（标 * 表示已撞到 maxDelayMs 上限）：');
console.log(
  `    ${padLabel('attempt', 10)}${padLabel('指数增长值', 14)}${padLabel('无抖动', 12)}${padLabel('等量抖动', 16)}全量抖动`,
);
for (let attempt = 0; attempt <= 5; attempt += 1) {
  const raw = RETRY.baseDelayMs * RETRY.factor ** attempt;
  const exponential = Math.min(RETRY.maxDelayMs, raw);
  const star = raw > RETRY.maxDelayMs ? '*' : '';
  console.log(
    `    ${padLabel(String(attempt), 10)}${padLabel(`${exponential}ms${star}`, 14)}` +
      `${padLabel(`${exponential}ms`, 12)}${padLabel(`${Math.round(exponential / 2)}~${exponential}ms`, 16)}0~${exponential}ms`,
  );
}
console.log('\n  为什么"无抖动"会出事？想象服务端重启导致 10 万客户端同时掉线：');
console.log('    无抖动    ：第 1 次全都在 40ms 后重连 -> 4 万/秒的洪峰砸向刚启动的服务端 -> 打挂');
console.log('    全量抖动  ：重连时间被摊开成 0~40ms 的均匀分布 -> 服务端拿到的是平滑的斜坡');
console.log('  这就是**惊群效应（thundering herd）**：问题不在"某个客户端重试太频繁"，');
console.log('  而在"所有客户端**同时**重试"。抖动是唯一能解决它的手段，且成本几乎为零。');
console.log('\n  真实项目里还会加两条：');
console.log('    · **重试上限封顶**（maxDelay）—— 否则 2^30 秒要等 34 年；');
console.log('    · **成功一次就重置计数** —— 别让"昨天那次抖动"影响今天的退避。');

// ---------------------------------------------------------------------------
// 2. 哪些关闭码该重连，哪些不该
// ---------------------------------------------------------------------------
console.log('\n--- 2. 关闭码决定"要不要重连" ---');
const closeCodePolicy = [
  ['1000', '正常关闭', '对方主动说"我关了"', '默认**不重连**；若是自己调的 close()，当然也不重连'],
  ['1001', '端点离开', '服务端下线 / 浏览器关标签页', '要重连（服务滚动更新就靠它），但可用更长退避'],
  ['1006', '异常断开', 'TCP 直接被切断，**没有关闭帧**', '**必须重连** —— 这是生产里最常见的掉线'],
  ['1008', '违反策略', '鉴权失败 / 被拉黑 / 超配额', '**不要重连**，重连还是会被拒，应提示用户重新登录'],
  ['1009', '消息过大', '发的内容超过服务端限制', '不重连，这是代码 bug，重连解决不了'],
  ['1011', '服务端内部错误', '服务端崩了', '重连，但退避要更保守，避免把恢复中的服务端再打挂'],
  ['1012/1013', '服务重启/稍后再试', '明确告诉客户端"等会儿再来"', '重连，且**尊重服务端给的等待时间**（Retry-After 语义）'],
  ['4000~4999', '应用自定义', '账号在别处登录（4002）、被踢出等', '由业务决定；"被踢"通常不该自动重连'],
];
console.log(`    ${padLabel('码', 14)}${padLabel('含义', 22)}${padLabel('什么情况', 38)}该不该重连`);
for (const [code, name, when, policy] of closeCodePolicy) {
  console.log(`    ${padLabel(code, 14)}${padLabel(name, 22)}${padLabel(when, 38)}${policy}`);
}
console.log('\n  两个容易踩的细节：');
console.log('    · `code === 1006` 时 `reason` **一定是空字符串**（没有关闭帧就没有原因），');
console.log('      别去解析它，那是个必然为空的值。');
console.log('    · 1005 / 1006 / 1015 是**保留码**，只能由实现生成，不能被 send（见 01 篇）。');

// ---------------------------------------------------------------------------
// 3. 服务端：一个会"重启"、会"装死"的 WebSocket 服务
// ---------------------------------------------------------------------------
console.log('\n--- 3. 启动服务端 ---');

const AUTH_TOKEN = 'demo-token-please-rotate-in-real-life';
const ROOM = 'prices';

/** 服务端全局状态。history 就是"补拉"的数据来源（真实项目里是消息表 / 消息队列）。 */
const server = {
  seq: 0,
  history: [], // { seq, room, price }
  subscribers: new Set(), // 已订阅的 socket（要清理，否则内存泄漏）
  silent: false, // 半开连接演示：装死模式（不回 pong、不推送）
  replayCount: 0,
  authCount: 0,
};

const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
await new Promise((resolve) => wss.once('listening', resolve));
const PORT = wss.address().port;
const URL = `ws://127.0.0.1:${PORT}`;
log(`服务端已监听 ${URL}`);

wss.on('connection', (socket, req) => {
  // 每个连接一份会话状态 —— 断线重连后是新连接，所以状态必须重建
  const session = { authed: false, room: null, since: 0 };
  log(`服务端：新连接接入（来自 ${req.socket.remoteAddress}），当前在线 ${wss.clients.size}`);

  socket.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString('utf8'));
    } catch {
      return; // 收到非 JSON 直接丢掉，绝不让解析异常把服务打挂
    }

    if (msg.type === 'auth') {
      // ① 重新鉴权：真实项目这里是校验 JWT / session，还可能直接在这里拒绝
      session.authed = msg.token === AUTH_TOKEN;
      server.authCount += 1;
      log(`服务端：收到 auth（第 ${server.authCount} 次），结果 ${session.authed ? '成功' : '失败'}`);
      socket.send(JSON.stringify(session.authed ? { type: 'auth.ok', userId: 'user-1001' } : { type: 'auth.fail' }));
      return;
    }

    if (msg.type === 'subscribe') {
      if (!session.authed) return; // 未鉴权不允许订阅
      session.room = msg.room;
      session.since = Number(msg.since) || 0;
      server.subscribers.add(socket);
      // ② 补拉：把客户端断线期间漏掉的消息按序号重放。
      //    `since` 由**服务端分配的序号**充当游标，客户端不能自己数条数。
      const missed = server.history.filter((m) => m.room === session.room && m.seq > session.since);
      log(`服务端：收到 subscribe（room=${session.room}, since=${session.since}），需补发 ${missed.length} 条`);
      socket.send(
        JSON.stringify({ type: 'subscribe.ok', room: session.room, since: session.since, replay: missed.length }),
      );
      for (const m of missed) socket.send(JSON.stringify({ type: 'msg', ...m }));
      server.replayCount += missed.length;
      return;
    }

    if (msg.type === 'ping') {
      // ③ 心跳应答。装死模式下**故意不回** —— 这正是半开连接的样子。
      if (!server.silent) socket.send(JSON.stringify({ type: 'pong', t: msg.t }));
    }
  });

  socket.on('close', () => {
    server.subscribers.delete(socket); // 必须清理，否则 Set 会无限增长
    log(`服务端：连接断开（剩余在线 ${wss.clients.size}，订阅者 ${server.subscribers.size}）`);
  });
  socket.on('error', () => {}); // 必须有，否则 terminate() 时可能抛未捕获错误
});

/** 定时推送行情：每 60ms 产生一条带序号的消息。 */
const publisher = setInterval(() => {
  if (server.silent) return; // 装死模式不推送
  server.seq += 1;
  const record = { seq: server.seq, room: ROOM, price: Number((100 + Math.random()).toFixed(2)) };
  server.history.push(record);
  if (server.history.length > 500) server.history.shift(); // 历史不能无限增长
  for (const socket of server.subscribers) {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'msg', ...record }));
  }
}, 60);

// ---------------------------------------------------------------------------
// 4. 客户端：一个生产形态的重连器
// ---------------------------------------------------------------------------
console.log('\n--- 4. 客户端：重连器（退避 + 抖动 + 状态恢复 + 心跳）---');

/**
 * 会自动重连的 WebSocket 客户端。
 *
 * 设计要点（每一条都对应上面"常见陷阱"里的一条）：
 *   · 重连逻辑**只**放在 onclose 里，onerror 只记日志；
 *   · 用 setTimeout + 退避，绝不递归调用 connect()；
 *   · 成功连上后把失败计数清零；
 *   · 主动 close() 时置 closedByUser 并清掉所有定时器；
 *   · 每次重连都重新鉴权 + 重新订阅 + 带上 lastSeq 补拉；
 *   · 心跳超时用 terminate()（不是 close()）强制断开。
 */
class ReconnectingClient {
  #url;
  #authToken;
  #room;
  #onMessage;
  #ws = null;
  #attempt = 0; // 连续失败次数（成功连上就清零）
  #lastSeq = 0; // **补拉游标**：已收到的最大服务端序号
  #closedByUser = false;
  #gaveUp = false;
  #reconnectTimer = null;
  #heartbeatTimer = null;
  #lastPongAt = 0;
  #connectedOnce = false;
  /** @type {number[]} 收到的全部序号，用来验证连续性 */
  receivedSeqs = [];
  /** @type {{label: string, detail: string}[]} 决策记录，最后统一打印 */
  decisions = [];

  constructor({ url, authToken, room, onMessage }) {
    this.#url = url;
    this.#authToken = authToken;
    this.#room = room;
    this.#onMessage = onMessage;
  }

  get lastSeq() {
    return this.#lastSeq;
  }

  get attempts() {
    return this.#attempt;
  }

  get gaveUp() {
    return this.#gaveUp;
  }

  get readyState() {
    return this.#ws?.readyState ?? WebSocket.CLOSED;
  }

  /** 发起（或重新发起）连接。**永远**通过退避定时器调用，不要在 onclose 里直接调。 */
  connect() {
    if (this.#closedByUser || this.#gaveUp) return;
    const ws = new WebSocket(this.#url);
    this.#ws = ws;

    ws.onopen = () => {
      this.#attempt = 0; // 成功一次就重置退避计数，别让历史失败拖累以后
      const isResume = this.#connectedOnce;
      this.#connectedOnce = true;
      log(`客户端：连接成功（readyState=OPEN）${isResume ? ' —— 这是一次**重连**' : ''}`);
      // ① 重新鉴权：每一次连接都要重新做，服务端不记得你是谁
      ws.send(JSON.stringify({ type: 'auth', token: this.#authToken }));
      log(`客户端 -> auth（token 已发送；真实项目里 token 可能已过期，要处理 auth.fail）`);
      // ③ 启动心跳：连接建立那一刻就开始计时
      this.#lastPongAt = Date.now();
      this.#startHeartbeat();
    };

    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }
      switch (msg.type) {
        case 'auth.ok':
          // ② 重新入房，并带上 lastSeq 作为补拉游标
          log(`客户端 <- auth.ok（userId=${msg.userId}），紧接着发起 subscribe`);
          ws.send(JSON.stringify({ type: 'subscribe', room: this.#room, since: this.#lastSeq }));
          log(`客户端 -> subscribe（room=${this.#room}, since=${this.#lastSeq}）<- 游标就是"断点续传"的全部秘密`);
          break;
        case 'subscribe.ok':
          log(`客户端 <- subscribe.ok（replay=${msg.replay}，即将补发 ${msg.replay} 条历史消息）`);
          break;
        case 'pong':
          this.#lastPongAt = Date.now(); // 心跳存活证据
          break;
        case 'msg':
          this.#lastSeq = Math.max(this.#lastSeq, msg.seq); // 游标只前进，绝不后退
          this.receivedSeqs.push(msg.seq);
          this.#onMessage(msg);
          break;
        default:
          break;
      }
    };

    ws.onerror = () => {
      // 只记日志，**不要**在这里重连：error 之后一定还会触发 close，两处都写会重连两次
      log('客户端：onerror（只记录，重连逻辑统一放在 onclose 里）');
    };

    ws.onclose = (event) => {
      this.#stopHeartbeat();
      if (this.#closedByUser) {
        log('客户端：onclose —— 是我们自己关的，不再重连');
        return;
      }
      const code = event.code;
      const reason = event.reason || '（空）';
      log(`客户端：onclose code=${code} reason=${reason}  <- 1006 时 reason 必然为空，因为它没有关闭帧`);
      const shouldRetry = this.#shouldRetry(code);
      this.decisions.push({ label: `关闭码 ${code}`, detail: shouldRetry ? '判定：可重连' : '判定：不重连' });
      if (!shouldRetry) {
        this.#gaveUp = true;
        log('客户端：按关闭码语义放弃重连（重连也只会被同样地拒绝）');
        return;
      }
      this.#scheduleReconnect();
    };
  }

  /** 主动关闭：清掉所有定时器并立标志，确保不会"关掉又自己连回来"。 */
  close() {
    this.#closedByUser = true;
    clearTimeout(this.#reconnectTimer);
    this.#stopHeartbeat();
    this.#ws?.close(1000, '客户端主动关闭');
  }

  /** 关闭码 -> 是否重连。 */
  #shouldRetry(code) {
    if (code === 1000) return false; // 正常关闭
    if (code === 1008 || code === 1009) return false; // 策略拒绝 / 消息过大
    if (code >= 4000 && code <= 4999) return false; // 应用层"被踢"类语义
    return true; // 1006 等异常断开，必须重连
  }

  /** 安排一次退避重连。 */
  #scheduleReconnect() {
    if (this.#closedByUser || this.#gaveUp) return;
    if (this.#attempt >= RETRY.maxAttempts) {
      this.#gaveUp = true;
      log(`客户端：已连续失败 ${this.#attempt} 次，达到上限 ${RETRY.maxAttempts}，**放弃重连**`);
      this.decisions.push({ label: '重试上限', detail: `连续 ${this.#attempt} 次后放弃` });
      return;
    }
    const delay = backoffDelay(this.#attempt);
    const exponential = Math.min(RETRY.maxDelayMs, RETRY.baseDelayMs * RETRY.factor ** this.#attempt);
    log(
      `客户端：第 ${this.#attempt + 1} 次重试将在 ${delay}ms 后发起` +
        `（指数值 ${exponential}ms，全量抖动把它随机到 0~${exponential}ms 之间）`,
    );
    this.#attempt += 1;
    this.#reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  /** 心跳：周期性发 ping，并检查"最后一次 pong"是否已过期。 */
  #startHeartbeat() {
    this.#stopHeartbeat();
    this.#heartbeatTimer = setInterval(() => {
      const ws = this.#ws;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (Date.now() - this.#lastPongAt > 250) {
        // 超过阈值没收到 pong -> 判定为**半开连接**
        log('客户端：心跳超时（>250ms 没收到 pong），判定为半开连接，主动 terminate()');
        this.decisions.push({ label: '半开连接', detail: '心跳超时 -> terminate() -> 触发 onclose -> 重连' });
        // 关键：用 terminate() 而不是 close()。
        // close() 要等对端回关闭帧，而对端已经"死"了，会永远等下去。
        ws.terminate();
        return;
      }
      ws.send(JSON.stringify({ type: 'ping', t: Date.now() }));
    }, 100);
  }

  #stopHeartbeat() {
    clearInterval(this.#heartbeatTimer);
    this.#heartbeatTimer = null;
  }
}

// ---------------------------------------------------------------------------
// 5. 跑起来：一次完整的"断线 -> 重连 -> 补拉"时间线
// ---------------------------------------------------------------------------
console.log('\n--- 5. 时间线演示 ---');

const timelineEvents = [];
const client = new ReconnectingClient({
  url: URL,
  authToken: AUTH_TOKEN,
  room: ROOM,
  onMessage: (msg) => {
    timelineEvents.push(`收到 seq=${msg.seq} price=${msg.price}`);
  },
});

log('客户端：发起第 1 次连接');
client.connect();

// ---- 阶段一：正常收消息 ----
await waitUntil(() => client.receivedSeqs.length >= 3, 3000, '等待首批 3 条消息');
log(`客户端：已收到 3 条消息，序号 = [${client.receivedSeqs.join(', ')}]，当前游标 lastSeq=${client.lastSeq}`);

// ---- 阶段二：服务端"重启"，强制断开所有连接 ----
log('服务端：模拟进程重启 —— 对全部连接调用 terminate()');
server.silent = true; // 先停推送，制造"服务端真的没了"的观感
for (const socket of wss.clients) socket.terminate();
await waitUntil(() => client.readyState === WebSocket.CLOSED, 2000, '等待客户端感知断开');
log(`客户端：已感知断开，readyState=${client.readyState}（3=CLOSED），游标仍然停在 ${client.lastSeq}`);
log('  此时服务端在"重启中"，但**消息仍在产生** —— 这就是断线期间会丢数据的原因。');
// 断线期间产生的消息：直接写进 history（模拟服务端另一进程/队列仍在写入）
for (let i = 0; i < 3; i += 1) {
  server.seq += 1;
  server.history.push({ seq: server.seq, room: ROOM, price: Number((100 + Math.random()).toFixed(2)) });
}
log(`服务端：重启期间又产生了 3 条消息（seq=${server.seq - 2}~${server.seq}），它们只存在于 history 里`);

// ---- 阶段三：重连 + 补拉 ----
await waitUntil(() => client.receivedSeqs.length >= 6, 4000, '等待重连并补拉');
log(`客户端：重连完成并补齐缺口，现在共收到 ${client.receivedSeqs.length} 条：`);
log(`  [${client.receivedSeqs.join(', ')}]`);
server.silent = false;
log('服务端：恢复推送（模拟服务端重启完成）');

// ---- 阶段四：半开连接 ----
// 这一阶段要演示的重点是**客户端如何自己发现"连接已经死了"**：
// 服务端既不回 pong、也不推送，但 TCP 层的 socket 在我们这边看上去还是 OPEN 的。
// 注意：客户端此刻**看不到任何异常**（没有 error、没有 close）——
// 如果没有心跳，它会一直以为自己连着，用户则一直收不到消息。
log('服务端：进入"装死"模式（不回 pong、不推送）—— 模拟半开连接');
server.silent = true;
const seqBeforeHalfOpen = client.lastSeq;
const attemptsBefore = client.attempts;
log(`客户端：此刻 readyState=${client.readyState}（1=OPEN），它**看不出**对端已经死了`);
// 真实世界里，消息可能来自另一个服务实例（比如另一个进程在写同一个消息表），
// 所以"装死"期间依然会有新消息入库 —— 它们同样要在重连后被补拉出来。
for (let i = 0; i < 2; i += 1) {
  server.seq += 1;
  server.history.push({ seq: server.seq, room: ROOM, price: Number((100 + Math.random()).toFixed(2)) });
}
log(`  这期间另一个服务实例又写入了 2 条消息（seq=${server.seq - 1}~${server.seq}），但没人推给它`);

await waitUntil(() => client.lastSeq > seqBeforeHalfOpen, 3000, '等待心跳超时并重连');
await sleep(150);
log('客户端：心跳超时触发 terminate() -> onclose -> 退避重连 -> 重新鉴权入房，全自动完成');
log(`  退避计数在"连上"的那一刻被重置为 0（本轮失败过 ${attemptsBefore + 1} 次，已清零）——`);
log('  否则昨天那几次失败会让今天的第一次重试就退避到几秒之后。');
server.silent = false;
const seqAfterHalfOpen = client.lastSeq;
log(`客户端：重连时带上了 since=${seqBeforeHalfOpen}，静默期那 2 条被补拉回来（游标 -> ${seqAfterHalfOpen}）`);

// ---- 校验连续性 ----
console.log('\n  收到的序号序列：');
console.log(`    [${client.receivedSeqs.join(', ')}]`);
let gaps = 0;
for (let i = 1; i < client.receivedSeqs.length; i += 1) {
  if (client.receivedSeqs[i] !== client.receivedSeqs[i - 1] + 1) gaps += 1;
}
console.log(`    缺口数量：${gaps}  <- 0 表示**一条都没丢**：断线期间的消息被 since 游标补齐了`);
console.log(`    服务端共重放（补发）了 ${server.replayCount} 条历史消息`);
console.log(`    服务端共处理了 ${server.authCount} 次 auth —— 次数 > 1 就说明发生了重连，每次都要重新鉴权`);

console.log('\n  重连决策记录：');
for (const d of client.decisions) console.log(`    ${d.label.padEnd(12)}${d.detail}`);

console.log('\n  如果把 since 游标去掉会怎样（这是最常见的"半成品重连"）：');
console.log('    · 重连后服务端不知道你要从哪儿续，只能从"当前时刻"开始推；');
console.log(`    · 本次演示中客户端会**永久丢掉** seq=${client.receivedSeqs[3] ?? '?'} 附近的那几条消息；`);
console.log('    · 用户的表现就是"刷新后才恢复，但中间的消息永远看不到了"。');
console.log('    所以：**游标必须由服务端分配、客户端只负责回传**，且游标只能单调前进。');

// ---------------------------------------------------------------------------
// 6. 放弃条件：连不上就认输，别无限重试
// ---------------------------------------------------------------------------
console.log('\n--- 6. 放弃条件：连一个没人监听的端口 ---');

// 先开一个服务器拿到一个"刚才还空闲"的端口，再立刻关掉 —— 这样就得到一个必然连不上的地址
const probe = new WebSocketServer({ host: '127.0.0.1', port: 0 });
await new Promise((resolve) => probe.once('listening', resolve));
const deadPort = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
log(`准备连接一个已被关闭的端口 127.0.0.1:${deadPort}（必然 ECONNREFUSED）`);

const doomedClient = new ReconnectingClient({
  url: `ws://127.0.0.1:${deadPort}`,
  authToken: AUTH_TOKEN,
  room: ROOM,
  onMessage: () => {},
});
doomedClient.connect();
await waitUntil(() => doomedClient.gaveUp, 5000, '等待放弃重连');
log(`连不上的客户端最终放弃：gaveUp=${doomedClient.gaveUp}，连续失败 ${RETRY.maxAttempts} 次`);
console.log('  关键：**放弃不是失败，而是保护**。');
console.log('    对用户：UI 上显示"连接已断开，点击重试"，而不是无限转圈。');
console.log('    对服务端：不会因为一批客户端死磕而长期承压。');
console.log('    真实项目里通常配合"网络恢复事件"（浏览器的 online 事件）再给一次立即重试的机会。');

// ---------------------------------------------------------------------------
// 7. 收尾：主动关闭时，所有定时器都必须停掉
// ---------------------------------------------------------------------------
console.log('\n--- 7. 收尾 ---');
client.close();
doomedClient.close();
await sleep(150); // 等主动关闭的握手走完，让 onclose 的日志落在"收尾"之前，输出顺序才清晰
clearInterval(publisher); // 定时器不清，进程不会退出
for (const socket of wss.clients) socket.terminate();
await withTimeout(new Promise((resolve) => wss.close(resolve)), 3000, 'wss.close');
await sleep(20); // 等最后一轮 close 事件派发完，连接计数才归零
log(`服务端已关闭，最终在线连接数 ${wss.clients.size}，订阅者 ${server.subscribers.size}`);

console.log('\n  收尾三件套（漏一个都会出问题）：');
console.log('    ① clearInterval/clearTimeout 所有定时器 —— 否则进程挂住不退出；');
console.log('    ② 立 closedByUser 标志 —— 否则"主动关闭"会被 onclose 当成断线又重连回来；');
console.log('    ③ 服务端清理 subscribers —— 否则已断开的 socket 会一直留在广播列表里（内存泄漏）。');

console.log('\n--- 8. 小结 ---');
const summary = [
  '1) WebSocket **协议不带重连**。EventSource（03 篇）内置重连 + Last-Event-ID，',
  '   WebSocket 什么都没有，必须自己写 —— 这就是本篇存在的原因。',
  '2) 退避公式：delay = min(base × factor^attempt, max)，并**必须叠加抖动**。',
  '   抖动不是为了自己连得快，而是为了不让所有客户端**同时**重连打垮服务端（惊群）。',
  '   全量抖动 delay = random(0, exp) 最简单也最有效。',
  '3) 放弃条件要明说：连续失败达到上限就停，并按**关闭码语义**决定能不能重连。',
  '   1006 必重连、1008/1009/4000+ 不重连、1000 正常关闭不重连。',
  '4) 重连 ≠ 重连上就完了，还要**恢复状态**：重新鉴权 -> 重新入房 -> 用游标补拉。',
  '   游标必须由服务端分配并单调递增，客户端只负责回传。',
  '5) 心跳用来识别**半开连接**（readyState 还是 OPEN，但对端已经死了）。',
  '   检测到超时要用 terminate() 而不是 close()，然后让 onclose 走正常重连流程。',
  '6) 重连逻辑**只放在 onclose**：onerror 之后一定还会 close，两处都写会重复重连。',
  '7) 主动关闭时要清定时器、立标志、清订阅列表 —— 否则"关掉的连接会自己回来"。',
  '8) 本示例的时序数字都压缩到了毫秒级；真实项目参考 base 500~1000ms、',
  '   max 30~60s、心跳 20~30s（必须显著小于 NAT 的 60s 空闲超时）。',
];
for (const line of summary) console.log(`  ${line}`);
