/**
 * ============================================================================
 * 知识点：child_process.fork 与 cluster —— 多进程跑 Node 脚本、多进程共享端口
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】高级
 * 【前置知识】26_node_core/10_child_process.js、26_node_core/14_worker_threads.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    (1) child_process.fork 是 spawn 的**特化版**：专门用来启动"另一个 Node 脚本"。
 *        与 spawn 相比它替你做三件固定的事：
 *          · 可执行文件固定为 process.execPath（就是当前这个 node），不用你写 'node'；
 *          · 第一个参数是**模块路径**（.js/.mjs/.cjs），不是可执行文件名；
 *          · 自动在 stdio 里加一路 'ipc' 通道，于是 child.send() / process.send()
 *            开箱即用 —— 这是 fork 与 spawn 最本质的区别。
 *        拿到返回值之后的 API 与 spawn 完全一样（pid / stdout / kill / 'exit' ...）。
 *    (2) cluster 建立在 fork 之上：它按 CPU 核数 fork 出多个**进程**（worker），
 *        每个 worker 各自跑一遍应用代码，而它们**共享同一个监听端口**。
 *        于是"一个 Node 进程只能用一个核"这件事被绕开了：
 *        多个进程、多个事件循环、多个 CPU 核，对外仍然只有一个端口。
 *        注意：cluster 的 worker 之间**内存不共享**（各自独立的 V8 堆），
 *        想共享状态只能走 IPC 或外部存储（Redis / 数据库）。
 *
 * 2. 为什么需要
 *    - 用满多核：Node 的 JS 执行是单线程的，一台 8 核机器上跑一个 Node 服务，
 *      另外 7 个核在"看着"。cluster 让每个核各跑一个进程，吞吐近似线性提升。
 *    - 崩溃隔离：某个 worker 因为 OOM 或未捕获异常退出，其他 worker 照常服务，
 *      主进程还能把它重新拉起来（零停机自愈）。
 *    - 部署简单：不需要先学 nginx / pm2 的反向代理模式，代码里就能开多进程。
 *    - 而 fork（不配 cluster）适合"把一件独立的事外包出去"：跑一个构建脚本、
 *      跑一次性任务、把不稳定的第三方代码关进单独的进程里。
 *
 * 3. 核心语法要点
 *    (1) fork(modulePath, args?, options?)     args 是**给脚本的参数**（进 process.argv）
 *        常用 options：
 *          · cwd / env            工作目录、环境变量（env 是整体替换，记得展开 process.env）
 *          · execArgv             传给子进程那个 node 的启动参数，如 ['--max-old-space-size=256']
 *          · serialization        'json'（默认）或 'advanced'（结构化克隆，见第 4 节）
 *          · silent: true         把子进程 stdout/stderr 管道回父进程（child.stdout）；
 *                                 默认 false，即直接继承父进程的控制台
 *          · detached / stdio     与 spawn 相同
 *    (2) child.send(message[, sendHandle][, callback])   父 -> 子
 *        process.send(message)                            子 -> 父
 *        child.on('message', (msg, handle) => {})         父侧接收
 *        process.on('message', (msg, handle) => {})       子侧接收
 *        sendHandle 可以传 net.Socket / net.Server / dgram.Socket —— 这是"把一条连接
 *        或一个监听句柄移交给另一个进程"的底层能力，cluster 就靠它实现端口共享。
 *    (3) child.connected / child.channel                   当前是否还有 IPC 通道
 *        child.disconnect()                                优雅断开：只拆通话线路，
 *                                                          **不杀**子进程
 *        child.kill(signal?)                               杀进程（与 spawn 相同）
 *        'disconnect' 事件                                  通道断开时触发（两侧都有）
 *        'exit' / 'close' / 'error' 事件                    与 spawn 完全一致
 *    (4) cluster 侧：
 *        cluster.isPrimary / cluster.isWorker              分支用（同一个文件两种身份）
 *        cluster.fork([env])                               拉起一个 worker（返回 Worker 对象）
 *        cluster.workers                                   活着的 worker 表：id -> Worker
 *        cluster.worker                                    在 worker 里指"我自己"
 *        worker.id / worker.process.pid / worker.process   身份信息
 *        worker.send(msg) / worker.on('message')           主 <-> worker 的自定义通信
 *        worker.disconnect()                               请它"干完手上的活再退出"
 *        worker.kill()                                     立即杀
 *        worker.exitedAfterDisconnect                      区分"被请退"还是"自己崩了"
 *        cluster.on('exit', (worker, code, signal) => {})  重启逻辑就写在这里
 *        cluster.on('listening', (worker, address) => {})  address 即 server.address()
 *        cluster.schedulingPolicy                          SCHED_RR（轮询）/ SCHED_NONE（交给操作系统）
 *        cluster.setupPrimary({ exec, args, execArgv })    换一个 worker 入口文件
 *        cluster.disconnect([cb])                          断开所有 worker 并关闭主进程持有的句柄
 *
 * 4. 常见陷阱
 *    陷阱 1：以为 fork 传消息是"引用"或者"结构化克隆"。child_process 的 IPC
 *            **默认是 JSON 序列化**（这点与 worker_threads 的 postMessage 不同！）：
 *              Date  -> ISO 字符串；Map/Set -> {}；Buffer -> { type:'Buffer', data:[...] }；
 *              undefined 属性 -> 直接消失；函数 -> **静默丢弃，连错都不报**；
 *              BigInt -> 直接抛 TypeError。
 *            要保类型必须显式写 serialization: 'advanced'（第 4 节有实测对照）。
 *    陷阱 2：send() 的失败有两种，位置完全不同，别只防一种：
 *            · 序列化失败（advanced 模式传函数）—— **同步抛错**，try/catch 能接住；
 *            · 通道已关闭后继续 send —— **异步**在 ChildProcess 上 emit 'error'
 *              （ERR_IPC_CHANNEL_CLOSED）。不监听 'error'，整个进程直接崩。
 *            所以：child.on('error', ...) 必须注册；send 前后要判断 child.connected。
 *    陷阱 3：忘了 IPC 通道会**撑住事件循环**。只要通道还连着，父子两侧都不会退出。
 *            收尾时 disconnect() 和 kill() 至少要做一个，一个都不能少。
 *    陷阱 4：以为 disconnect() 会结束子进程。它只拆线；子进程会把手上的活干完再
 *            自然退出（也可能永远不退出——比如它还监听着一个端口）。要立刻结束用 kill()。
 *    陷阱 5：cluster 的 worker 之间**内存不共享**。主进程里改全局变量，worker 看不见；
 *            反过来也一样。要共享会话/缓存必须走外部存储，或者改用 worker_threads
 *            的 SharedArrayBuffer（那是线程方案，见 14_worker_threads.js）。
 *    陷阱 6：cluster 的轮询是**按连接**分发的，不是按请求。客户端如果复用同一条
 *            keep-alive 长连接，这条连接上的所有请求都会落在同一个 worker 上，
 *            看起来像"负载不均"。压测与排查时要注意这一点。
 *    陷阱 7：每个 worker 都会**完整跑一遍模块顶层代码**，包括建数据库连接、注册定时任务。
 *            写"每 10 分钟清理一次"这类定时任务时必须判断 cluster.isPrimary，
 *            否则 N 个 worker 会同时干同一件事。
 *    陷阱 8：worker 监听哪个端口不需要你操心，也不要自己改。cluster 会把"相同
 *            address:port 的 listen 调用"合并成同一个句柄，这就是共享端口的全部秘密。
 *    陷阱 9：SCHED_RR 在 Windows 上**不是默认值**。Node 文档写明：除 Windows 外所有
 *            平台默认 SCHED_RR，Windows 上默认 SCHED_NONE（由操作系统分发连接）。
 *            本文件显式设置 SCHED_RR，保证在任何平台上都能看到"轮流处理"的效果。
 *
 * 【关于本示例的运行方式（重要）】
 *    本文件用**一个文件演三种角色**，这是 cluster 教学代码的惯用写法：
 *      · 默认运行          -> 主进程，跑完 fork 演示与 cluster 演示后正常退出；
 *      · 被 fork 起来时    -> 命令行带 --jsc-fork-child，走"子进程"那一支；
 *      · 被 cluster 起来时 -> cluster.isWorker 为 true，走"worker 服务"那一支。
 *    所有子进程与 worker 都会显式收尾（先优雅关闭、超时再兜底强杀），
 *    因此 `node 本文件` 不会挂起、退出码为 0、只访问本机回环地址、无外网请求。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/19_fork_and_cluster.js
 *
 * 【预期输出】
 *   打印 10 个小节（编号 0~9）：本文件扮演的角色、fork 与 spawn 的关系、
 *   最小 fork（启动/报到/来回对话）、传对象的两种序列化差异、
 *   生命周期与两种 send 错误、cluster 共享端口（多个 pid 轮流处理同一个端口的请求）、
 *   worker 崩溃后的自动重启、优雅关闭与兜底强杀、四种并发方案选型、小结。
 * ============================================================================
 */

import cluster from 'node:cluster';
import http from 'node:http';
import os from 'node:os';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_START = Date.now();

// 本文件自己的绝对路径。fork 的第一个参数是**模块路径**，
// 用 import.meta.url 转出来最稳（不受 cwd 影响，也不会因为相对路径出错）。
const SELF = fileURLToPath(import.meta.url);

// 用来区分"我是被 child_process.fork 起来的子进程"的自定义参数。
const FORK_CHILD_FLAG = '--jsc-fork-child';

// 打印辅助。本文件文字量大，用 line() 代替 console.log 让正文更整齐。
const line = (text = '') => console.log(text);

// cluster 的分发策略必须在**第一次 fork 之前**设定，之后改就无效了：
//   SCHED_RR   主进程接管监听句柄，收到连接后依次分给各 worker（轮询）
//   SCHED_NONE 主进程不接管，各 worker 自己去抢（Windows 上的默认值）
// 这里显式指定 RR，保证跨平台行为一致、能直观看到"轮流处理"。
cluster.schedulingPolicy = cluster.SCHED_RR;

// ===========================================================================
// 角色分派：一个文件，三种身份
// ===========================================================================
//
// 判断顺序很重要：
//   ① cluster.isWorker 为 true —— 这个进程是 cluster.fork() 拉起来的。
//      cluster 内部会给子进程设置 NODE_UNIQUE_ID 环境变量，
//      worker 一侧的 cluster 模块据此把 isWorker 置为 true。
//   ② 命令行带 --jsc-fork-child —— 这个进程是 child_process.fork() 拉起来的。
//   ③ 两者都不是 —— 我是用户直接执行的那个主进程。
//
// 用 if / else 分支包住，保证每种身份只跑自己那一支，其余代码一律不执行。

if (cluster.isWorker) {
  // ---------------- 身份 A：cluster worker ----------------
  runClusterWorker();
} else if (process.argv.includes(FORK_CHILD_FLAG)) {
  // ---------------- 身份 B：fork 出来的子进程 ----------------
  runForkChild();
} else {
  // ---------------- 身份 C：主进程（默认） ----------------
  await main();
}

// ===========================================================================
// 身份 B：被 child_process.fork() 拉起来的子进程
// ===========================================================================
//
// 这里演示"子进程一侧"要写什么：
//   · process.on('message') 收父进程的消息；
//   · process.send() 把结果发回去；
//   · process.on('disconnect') 感知"通话线路被拆了"。
// 注意 process.send **只在拥有 IPC 通道的进程里存在**：直接运行本文件的主进程
// 是没有 process.send 的（打印出来是 undefined，第 0 节会验证这一点）。

function runForkChild() {
  const tag = `[子进程 pid=${process.pid}]`;

  line(`${tag} 我起来了。typeof process.send = ${typeof process.send}`);
  line(`${tag} 我的 argv = ${JSON.stringify(process.argv.slice(1))}`);

  // 子进程 -> 父进程的主动通知：不等父进程提问，先报个到。
  process.send({ type: 'ready', pid: process.pid, node: process.version });

  process.on('message', (msg) => {
    // 用 type 字段分发消息，是 IPC 协议的标准做法
    //（并发场景还要再加 requestId，见 14_worker_threads.js）。
    if (msg?.type === 'echo') {
      // 把收到的内容原样回显，并附上子进程侧的"类型体检结果"。
      // 关键：msg.payload 到达那一刻可能已经不是父进程发出去时的类型了
      //（默认 JSON 模式会失真），所以这里 instanceof 判断的结果本身就是证据。
      process.send({
        type: 'echo-reply',
        pid: process.pid,
        payload: msg.payload,
        payloadIsDate: msg.payload?.when instanceof Date,
        payloadIsMap: msg.payload?.m instanceof Map,
        // JSON 模式下 undefined 属性会被丢掉，这个布尔值能看出差别。
        hasUndefinedProp: Object.hasOwn(msg.payload ?? {}, 'u'),
      });
    } else if (msg?.type === 'bye') {
      // 父进程说拜拜了：由子进程这一侧主动断开通道。
      // 两侧都可以调 disconnect()，效果一样：通道关闭，'disconnect' 事件触发。
      process.disconnect();
    }
  });

  // 'disconnect' 在"对端调用了 disconnect() / kill()"或"对端进程退出"时触发。
  // 关键认知：它不是死亡通知，只是"通话线路断了"。子进程完全可以继续干活。
  process.on('disconnect', () => {
    line(`${tag} 收到 'disconnect'：通道已断开，但我还活着。`);
    // 演示"断线之后仍能把活干完"：做一点计算并打印结果。
    let sum = 0;
    for (let i = 1; i <= 1000; i += 1) sum += i;
    line(`${tag} 断线后仍算出了 1+2+...+1000 = ${sum}`);
    line(`${tag} 手上没事了，事件循环变空，我会自然退出（退出码 0）。`);
    // 没有别的句柄了，Node 会自己退出——不需要显式 process.exit()。
  });
}

// ===========================================================================
// 身份 A：cluster worker —— 真正对外提供 HTTP 服务的进程
// ===========================================================================
//
// 每个 worker 都会执行 server.listen(0)，看上去是"各听各的随机端口"，
// 但 cluster 在背后把它们合并成了**同一个端口**：
//   · 第一个调用 listen 的 worker 会让主进程创建一个真实的监听句柄；
//   · 后续 worker 用相同的 address:port 调 listen 时，主进程发现"已经有这个句柄"，
//     于是直接复用，不再新建。
// 结果是所有 worker 报出来的端口号一模一样，而连接由主进程轮流分发。

function runClusterWorker() {
  const tag = `[worker pid=${process.pid} id=${cluster.worker.id}]`;
  let servedCount = 0;

  const server = http.createServer((req, res) => {
    // 模拟"某个 worker 里的代码崩了"。真实场景是未捕获异常或 OOM；
    // 这里用 nextTick 抛错，模拟异步回调里崩掉的样子。
    if (req.url === '/crash') {
      process.nextTick(() => {
        throw new Error('worker 内部故意抛出的异常（模拟线上崩溃）');
      });
      return;
    }

    servedCount += 1;
    // 响应里带上 pid 与 workerId —— 主进程据此就能证明"确实是多个进程在干活"。
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(
      JSON.stringify({
        pid: process.pid,
        workerId: cluster.worker.id,
        ppid: process.ppid,
        // 这个计数是**每个进程各自**的，永远不会超过它自己处理过的请求数 ——
        // 因为进程之间内存不共享（陷阱 5）。
        servedByThisProcess: servedCount,
        url: req.url,
      }),
    );
  });

  // 这个 handler 只是为了让输出整洁（真实崩溃会打印一整页堆栈）。
  // 真实项目应当在这里做日志上报，然后照样以非 0 码退出，交给主进程重启。
  process.on('uncaughtException', (err) => {
    line(`${tag} 未捕获异常：${err.message}`);
    line(`${tag} 以退出码 1 退出，等主进程来重启我。`);
    process.exit(1);
  });

  // 主进程用 worker.send() 发来的自定义消息（走的还是 fork 的 IPC 通道）。
  process.on('message', (msg) => {
    if (msg?.type === 'report') {
      process.send({ type: 'report-reply', pid: process.pid, id: cluster.worker.id, served: servedCount });
    } else if (msg?.type === 'shutdown') {
      line(`${tag} 收到主进程的 shutdown，开始优雅关闭。`);
      server.close();
      server.closeAllConnections();
    }
  });

  // 主进程调用 worker.disconnect() 时进入这里：与该做的事和收到 shutdown 一样。
  process.on('disconnect', () => {
    line(`${tag} IPC 通道断开，注销我的监听份额。`);
    // 注意：worker 里的 server.close() 不是关掉整个端口，
    // 只是"把我这一份注销掉"；端口由主进程持有的句柄继续活着。
    server.close();
    server.closeAllConnections();
    // unref() 让这个句柄不再撑住事件循环：注销完成后本进程即可自然退出。
    // 没有它，worker 会一直挂在这里等主进程 kill（那就只能等兜底超时了）。
    server.unref();
  });

  // listen(0) 让系统挑一个空闲端口。
  // worker 之间**不需要**事先商量端口是多少，cluster 会把它们合并成一个。
  server.listen(0, () => {
    const address = server.address();
    line(`${tag} 已监听，端口 = ${address.port}（每个 worker 看到的端口号都一样）`);
    // 除了 cluster 自带的 'listening' 事件，worker 也可以主动 process.send 报信。
    // 两条路都能把"我好了 + 端口是多少"告诉主进程，本示例两条都用上。
    process.send({ type: 'listening', pid: process.pid, id: cluster.worker.id, port: address.port });
  });
}

// ===========================================================================
// 身份 C：主进程
// ===========================================================================

/** 把"等子进程退出"包成 Promise。
 *
 *  刻意不使用 events.once(child, 'exit')：那个工具在等待期间若收到 'error'
 *  会直接 reject，把一次正常退出变成未捕获异常（14_worker_threads.js 踩过这个坑）。 */
function waitExit(child) {
  return new Promise((resolve) => {
    child.once('exit', (code, signal) => resolve({ code, signal }));
  });
}

function section(n, title) {
  line();
  line(`--- ${n}. ${title} ---`);
}

/** 用 node:http 发一个 GET 请求并解析 JSON 响应。
 *
 *  这里刻意**不用内置 fetch**：undici 的连接池会保留 keep-alive 长连接，
 *  让本进程在最后一条请求之后还要多挂几秒才退出（15_http_server_client.js 讲的是
 *  同一个 keep-alive 在**服务端**的表现 —— close() 的回调不触发；这里是它在
 *  **客户端**的另一面 —— 进程退不干净）。自己用 node:http 就完全可控。
 *  agent: false 表示不复用连接、每次都新建一条，这也让 cluster 的
 *  "按连接轮询"看得更清楚。 */
function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { agent: false }, (res) => {
      let text = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        text += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(text) });
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on('error', reject);
  });
}

async function main() {
  // -------------------------------------------------------------------------
  section(0, '本文件扮演的角色');
  // -------------------------------------------------------------------------

  line(`主进程 pid = ${process.pid}，Node ${process.version}，平台 ${process.platform}`);
  line(`可用并行度 os.availableParallelism() = ${os.availableParallelism()}（进程/线程数量的经验上限）`);
  line(`cluster.isPrimary = ${cluster.isPrimary}，cluster.isWorker = ${cluster.isWorker}`);
  line(`typeof process.send = ${typeof process.send}（主进程没有 IPC 通道，所以是 undefined）`);
  line('说明：本文件同时是"主进程脚本"和"子进程脚本"——被 fork / cluster 拉起时，');
  line('      顶部的角色分派会让它走另外两支，不会重复跑这一整套演示。');

  // -------------------------------------------------------------------------
  section(1, 'fork 与 spawn 的关系：三处特化');
  // -------------------------------------------------------------------------

  line('fork(modulePath, args, options) 就是"为跑 Node 脚本量身定制"的 spawn：');
  line();
  line('  维度            spawn                                fork');
  line('  ' + '-'.repeat(98));
  line('  第一个参数     可执行文件（要自己写 node 或绝对路径）   模块路径（.js/.mjs/.cjs）');
  line('  可执行文件     由你指定                             固定为 process.execPath（当前这个 node）');
  line('  参数含义       传给那个程序的参数                    传给**脚本**的参数（进 process.argv）');
  line('  IPC 通道       要自己在 stdio 里加 "ipc" 才有         **默认就有**（stdio 自动加一路 ipc）');
  line('  通信 API       要自己封握手协议                       child.send() / process.send() 开箱即用');
  line();
  line('除了上面三点，fork 返回的仍然是同一个 ChildProcess 类型：');
  line('  child.pid / child.stdout / child.stderr / child.kill() / child.on("exit") 全都一样。');
  line('换句话说：fork = spawn(process.execPath, [模块路径, ...参数], { stdio: [..., "ipc"] })。');

  // -------------------------------------------------------------------------
  section(2, '最小 fork：启动、报到、回话');
  // -------------------------------------------------------------------------

  // fork 的第二个参数是**给脚本的参数数组**，会原样进入子进程的 process.argv，
  // 子进程靠它识别自己的身份（见顶部角色分派）。
  //
  // 默认 silent 为 false：子进程的 stdout/stderr 直接继承父进程的控制台，
  // 所以下面能看到子进程自己打印的、以 [子进程 pid=...] 开头的行。
  // 想让父进程接管它的输出，就传 { silent: true }，然后去读 child.stdout。
  const child = fork(SELF, [FORK_CHILD_FLAG]);

  line(`已 fork 子进程：pid = ${child.pid}（父进程 pid = ${process.pid}）`);
  line(`child.connected = ${child.connected}（true 表示 IPC 通道已建立）`);

  // 陷阱 2：'error' 必须监听。序列化失败、通道关闭后继续 send 都会走这里，
  // 不监听的话 Node 会把它抛成未捕获异常，直接干掉主进程。
  child.on('error', (err) => {
    line(`  [父进程] child "error" 事件：${err.code ?? err.name} - ${err.message}`);
  });

  // 先登记"等退出"的 Promise，再发消息 —— 避免事件比监听器更早到达时被错过
  //（与 10_child_process.js 陷阱 5 同理）。
  const childExit = waitExit(child);

  // 等子进程主动报到的第一条消息。用 Promise 包一层，"收消息"就能按顺序 await。
  const readyMsg = await new Promise((resolve) => {
    child.once('message', resolve);
  });
  line(`  [父进程] 收到子进程报到：${JSON.stringify(readyMsg)}`);

  // 把"发一条消息并等它的回信"包成 Promise，用起来像本地异步函数。
  function ask(target, payload) {
    return new Promise((resolve) => {
      target.once('message', resolve);
      target.send({ type: 'echo', payload });
    });
  }

  const reply = await ask(child, { question: '两个进程之间能不能传对象？', n: 42 });
  line(`  [父进程] 子进程回话：${JSON.stringify(reply.payload)}`);
  line(`  [父进程] 回话来自 pid = ${reply.pid}，type = ${reply.type}`);

  // child.send 的签名是 send(message[, sendHandle][, callback])。
  // 末尾可以给一个回调：消息**成功写进通道**之后被调用。
  await new Promise((resolve) => {
    child.send({ type: 'echo', payload: { note: '带回调的 send' } }, resolve);
  });
  line('  [父进程] 带回调的 send：回调已被调用，说明消息已经写入通道。');

  // -------------------------------------------------------------------------
  section(3, '传对象：默认 JSON 序列化 vs serialization: "advanced"');
  // -------------------------------------------------------------------------

  line('这是 fork 最容易踩的坑：child_process 的 IPC **默认用 JSON 序列化**，');
  line('而 worker_threads 的 postMessage 用的是结构化克隆，两者行为并不一样。');

  // 造一个"类型很丰富"的对象，看它到达对面时变成了什么。
  // 注意这里不能放函数或 BigInt：JSON 模式下的表现见第 4 节。
  const richPayload = {
    when: new Date('2024-01-02T03:04:05.000Z'),
    m: new Map([['k', 'v']]),
    s: new Set([1, 2]),
    buf: Buffer.from('abc'),
    u: undefined,
    n: 123,
  };

  // 3.1 默认模式（JSON）
  const jsonReply = await ask(child, richPayload);
  line();
  line('  [默认 JSON 模式] 子进程看到的类型：');
  line(`    payload.when instanceof Date = ${jsonReply.payloadIsDate}   <- false：Date 变成了字符串`);
  line(`      payload.when = ${JSON.stringify(jsonReply.payload.when)}`);
  line(`    payload.m instanceof Map     = ${jsonReply.payloadIsMap}   <- false：Map 变成了空对象`);
  line(`      payload.m = ${JSON.stringify(jsonReply.payload.m)}`);
  line(`    payload.s = ${JSON.stringify(jsonReply.payload.s)}   <- Set 也没了`);
  line(`    payload.buf 的类型 = ${jsonReply.payload.buf?.constructor?.name}   <- 不再是 Buffer，而是普通对象 { type, data }`);
  line(`      payload.buf = ${JSON.stringify(jsonReply.payload.buf)}`);
  line(`    含 u 这个属性吗 = ${jsonReply.hasUndefinedProp}   <- false：undefined 属性被丢掉`);
  line();
  line('  结论：默认模式下跨进程传的其实是"一份 JSON 文本"，只能可靠地传');
  line('        null / 布尔 / 数字 / 字符串 / 数组 / 普通对象。');

  // 3.2 advanced 模式（结构化克隆，走 V8 的序列化器）
  //     必须用 { serialization: 'advanced' } 重新 fork 一个子进程 ——
  //     这个选项是**建立通道时**决定的，运行中改不了。
  const advChild = fork(SELF, [FORK_CHILD_FLAG], { serialization: 'advanced' });
  advChild.on('error', (err) => line(`  [父进程] advChild "error" 事件：${err.code ?? err.name} - ${err.message}`));
  const advExit = waitExit(advChild);
  await new Promise((resolve) => advChild.once('message', resolve));

  const advReply = await ask(advChild, richPayload);
  line();
  line('  [advanced 模式] 同一个对象，子进程看到的类型：');
  line(`    payload.when instanceof Date = ${advReply.payloadIsDate}   <- true：Date 活过来了`);
  line(`    payload.m instanceof Map     = ${advReply.payloadIsMap}   <- true：Map 也活过来了`);
  line(`    payload.s 还原成 = ${JSON.stringify([...advReply.payload.s])}   <- Set 保住了`);
  line(`    payload.buf 的类型 = ${advReply.payload.buf?.constructor?.name}，还是 Buffer 吗 = ${Buffer.isBuffer(advReply.payload.buf)}   <- Buffer 也保住了`);
  line(`    含 u 这个属性吗 = ${advReply.hasUndefinedProp}   <- true：连 undefined 属性都保住了`);
  line();
  line('  代价与边界：advanced 走 V8 序列化器，比 JSON 稍慢；');
  line('  它仍然是"复制"而不是共享内存；函数、类实例的方法、Symbol 依旧传不了。');
  line('  一句话：要用 worker_threads 那种结构化克隆语义，就显式写 advanced。');

  // -------------------------------------------------------------------------
  section(4, '生命周期：disconnect / exit，以及两种 send 错误');
  // -------------------------------------------------------------------------

  // 4.1 序列化失败：advanced 模式是**同步抛错**（能 try/catch 接住）
  try {
    advChild.send({ fn: () => {} });
  } catch (err) {
    line(`  advanced 模式传函数：同步抛出 ${err.name} - ${err.message}`);
  }

  // 4.2 JSON 模式下的两种"更隐蔽"的失败
  //     函数：**静默丢弃**，不报错、对面收到的是个空对象（比抛错更难排查）；
  //     BigInt：JSON.stringify 处理不了，同步抛 TypeError。
  const fnReply = await new Promise((resolve) => {
    child.once('message', resolve);
    child.send({ type: 'echo', payload: { fn: () => {}, keep: 1 } });
  });
  line(`  JSON 模式传函数：不报错，对面收到的是 ${JSON.stringify(fnReply.payload)}（fn 消失了，keep 还在）`);
  try {
    child.send({ big: 10n });
  } catch (err) {
    line(`  JSON 模式传 BigInt：同步抛出 ${err.name} - ${err.message}`);
  }
  const bigReply = await new Promise((resolve) => {
    advChild.once('message', resolve);
    advChild.send({ type: 'echo', payload: { big: 10n } });
  });
  line(`  advanced 模式传同样的 BigInt：对面拿到的 typeof = ${typeof bigReply.payload.big}（BigInt 保住了）`);

  // 4.3 disconnect() 与 kill() 的分工
  //     disconnect() —— 拆掉通话线路，让子进程把手上的活干完；
  //     kill()       —— 直接要命。
  //     disconnect() 两侧都能调，效果一样：通道关闭，双方都收到 'disconnect'。
  line();
  line('  [子进程主动断开] 给第一个子进程发 { type: "bye" }：');
  child.send({ type: 'bye' }); // 子进程的 message 处理里会调用 process.disconnect()

  // 等子进程走完"断线 -> 继续干活 -> 自然退出"的完整流程。
  const exit1 = await childExit;
  line(`  child.exitCode = ${child.exitCode}，child.connected = ${child.connected}`);
  line(`  'exit' 事件：code = ${exit1.code}，signal = ${exit1.signal}（子进程干完活自己走的，不是被杀的）`);

  // 第二个子进程改由**父进程**这一侧断开，并验证"断线之后再 send 会怎样"。
  line();
  line('  [父进程主动断开] 对 advanced 子进程调用 disconnect()：');
  line(`    断开前 child.connected = ${advChild.connected}`);
  advChild.disconnect(); // 父进程侧同步生效
  line(`    断开后 child.connected = ${advChild.connected}（同步变成 false）`);

  // 通道关了还硬发：错误**不是**同步抛出的，而是异步 emit 到 'error' 事件上。
  // 幸好上面注册了 advChild.on('error')，所以只会打印一行、不会崩。
  advChild.send({ type: 'echo', payload: { will: 'fail' } });
  line('    断线后调用 send()：错误会异步跑到子进程的 "error" 事件上（下一行就是它）。');

  const advExitResult = await advExit;
  line(`    advanced 子进程最终退出：code = ${advExitResult.code}，signal = ${advExitResult.signal}`);
  line('  => disconnect() 只是拆线：子进程照样能把活干完，然后自然退出，退出码仍然是 0。');

  // -------------------------------------------------------------------------
  section(5, 'cluster：让多个进程共享同一个端口');
  // -------------------------------------------------------------------------

  line('单进程 Node 只能用满一个 CPU 核。cluster 的思路是"多开几个进程，');
  line('每个进程各跑一遍这份代码、各自 listen 同一个端口"，连接由主进程轮流分发。');
  line();
  line('实现上的两个关键点：');
  line('  ① cluster.fork() 不是"另一种子进程"，它内部就是 child_process.fork，');
  line('     只是额外做了两件事：给子进程设置 NODE_UNIQUE_ID（worker 侧的 cluster');
  line('     模块据此把 isWorker 置为 true），以及把监听句柄的分配接管过来。');
  line('  ② "共享端口"不是靠操作系统的 SO_REUSEPORT，而是主进程持有一个真实的监听');
  line('     句柄，收到连接后用 IPC 把这条连接（一个 net.Socket）交给某个 worker。');
  line('     所以进程数可以远超端口数，端口对外始终只有一个。');
  line(`本机可用并行度 = ${os.availableParallelism()}；本示例只开 2 个 worker（够看出效果，收尾也更快）。`);

  // 主进程不需要自己维护"活着的 worker 表"：cluster 内置了 cluster.workers
  // （id -> Worker），worker 一崩就从表里消失，重启后以新 id 出现。
  // 下面这个函数负责"拉起一个 worker 并等它就绪"。
  function spawnWorker(note) {
    const worker = cluster.fork();
    // 与 ChildProcess 一样，cluster.Worker 也是 EventEmitter，
    // 'error' 必须监听，否则 worker 侧的错误可能以未处理错误的形式冒上来。
    worker.on('error', (err) => line(`  [主进程] worker ${worker.process.pid} "error"：${err.message}`));

    const ready = new Promise((resolve) => {
      // 渠道一：cluster 专有的 'listening' 事件 —— worker 里的 server 完成 listen 后触发，
      // 参数就是这个 worker 的 server.address()（含真实端口号）。
      worker.once('listening', (address) => {
        resolve({ pid: worker.process.pid, id: worker.id, port: address.port, via: "cluster 的 'listening' 事件" });
      });
      // 渠道二：worker 自己 process.send 过来的报到消息（普通 IPC，任何进程间通信都能用）。
      worker.on('message', (msg) => {
        if (msg?.type === 'listening') {
          resolve({ pid: msg.pid, id: msg.id, port: msg.port, via: 'worker.send() 自定义消息' });
        }
      });
      // 兜底：万一两条路都没来，用超时保证示例不卡死。
      setTimeout(() => resolve(null), 3000).unref();
    });

    line(`  [主进程] 拉起 worker id=${worker.id} pid=${worker.process.pid}${note ? `（${note}）` : ''}`);
    return { worker, ready };
  }

  const first = spawnWorker('第一批');
  const second = spawnWorker('第一批');

  // 两个 worker 是**并发**启动的，所以这里并发等待（Promise 数组同时被 await）。
  const readyInfo = [await first.ready, await second.ready];
  for (const info of readyInfo) {
    if (!info) continue;
    line(`  [主进程] worker pid=${info.pid} id=${info.id} 已就绪，端口 = ${info.port}（消息来自${info.via}）`);
  }

  // 关键证据一：两个 worker 报出来的端口号**完全相同**，
  // 而这个端口号是它们各自的 server.address() 算出来的，不是谁告诉它们的。
  const ports = new Set(readyInfo.filter(Boolean).map((i) => i.port));
  line(`  不同 worker 报告的端口数量 = ${ports.size}（1 表示它们真的共享同一个端口）`);

  const port = readyInfo.find(Boolean).port;
  const baseUrl = `http://127.0.0.1:${port}`;

  // 关键证据二：从同一个端口发请求，响应里的 pid 会在多个进程之间轮换。
  // 注意陷阱 6：轮询是**按连接**分发的；这里每次都用一条新连接，才能看到轮流处理
  // 的效果（如果复用同一条 keep-alive 长连接，会一直落在同一个 worker 上）。
  line();
  line('  向同一个端口连发 6 个请求，看是谁在响应：');
  const servedBy = new Map();
  for (let i = 1; i <= 6; i += 1) {
    const { body } = await getJson(`${baseUrl}/hello?n=${i}`);
    servedBy.set(body.pid, (servedBy.get(body.pid) ?? 0) + 1);
    line(
      `    第 ${i} 个请求 -> 由 pid=${body.pid}（worker id=${body.workerId}，父进程=${body.ppid}）处理，` +
        `它自己累计处理了 ${body.servedByThisProcess} 个`,
    );
  }
  line(`  一共有 ${servedBy.size} 个不同进程参与了服务：${JSON.stringify([...servedBy.keys()])}`);
  line('  => 这就证明了"多个进程共同处理同一个端口的请求"。注意每个进程自己的计数是独立的，');
  line('     因为进程之间内存不共享（要共享状态得走 IPC 或 Redis 之类的中间件）。');

  // -------------------------------------------------------------------------
  section(6, 'worker 崩溃与自动重启');
  // -------------------------------------------------------------------------

  line('cluster 最有价值的特性：一个 worker 崩了，其他 worker 不受影响，');
  line('主进程可以在 cluster.on("exit") 里把它重新拉起来，做到零停机自愈。');

  let shuttingDown = false;
  let restartCount = 0;
  let crashHandled = () => {};

  cluster.on('exit', (worker, code, signal) => {
    const pid = worker.process.pid;
    line(`  [主进程] cluster "exit"：pid=${pid} id=${worker.id}，code=${code}，signal=${signal}`);
    line(
      `    worker.exitedAfterDisconnect = ${worker.exitedAfterDisconnect}` +
        `（${worker.exitedAfterDisconnect ? '被请退后退出' : '不是被请退的，是真崩了'}）`,
    );

    // 只在"非主动请退"时重启，且只重启一次，避免演示陷入无限重启。
    if (!worker.exitedAfterDisconnect && restartCount < 1 && !shuttingDown) {
      restartCount += 1;
      const replacement = spawnWorker('崩溃后重启');
      replacement.ready
        .then(async (info) => {
          if (!info) return;
          line(`  [主进程] 重启完成：新 worker pid=${info.pid} 接管端口 ${info.port}`);
          const { body } = await getJson(`${baseUrl}/after-restart`);
          line(`  [主进程] 重启后的请求成功，由 pid=${body.pid} 处理`);
        })
        .catch((err) => line(`  [主进程] 重启流程出错：${err.message}`))
        .finally(() => crashHandled());
    }
  });

  // 请求 /crash：连接会被调度到某个 worker，那个 worker 随即崩掉。
  // 客户端这边会看到连接被重置 —— 这正是真实场景里"用户看到的那一面"。
  line();
  line('  向 /crash 发一个请求（模拟某个 worker 的代码崩溃）：');
  try {
    const { status } = await getJson(`${baseUrl}/crash`);
    line(`    意外拿到了响应：${status}`);
  } catch (err) {
    line(`    客户端观察到：${err.code ?? err.name} —— 连接被重置，说明那个 worker 死了`);
  }

  // 等重启流程走完（最多等 3 秒兜底，保证示例不会卡住）。
  // 注意兜底用的定时器用完必须 clearTimeout：它自己是"被 ref 的"，
  // 留着它就会让进程多活整整 3 秒 —— 这类"看不见的尾巴"是脚本退不干净的高频原因。
  let crashWatchdog;
  await Promise.race([
    new Promise((resolve) => {
      crashHandled = resolve;
    }),
    new Promise((resolve) => {
      crashWatchdog = setTimeout(resolve, 3000);
    }),
  ]);
  clearTimeout(crashWatchdog);

  // -------------------------------------------------------------------------
  section(7, '优雅关闭：先请退，再兜底强杀');
  // -------------------------------------------------------------------------

  // 生产环境的收尾模板：
  //   ① 停止接受新连接、通知各 worker 把手上的请求做完再退出（优雅）；
  //   ② 给一个超时窗口，超时还没退的就 kill（兜底）。
  // 少了②，只要有一个 worker 卡住（死循环、连接没关干净），主进程就永远退不出去。
  shuttingDown = true;

  const survivors = Object.values(cluster.workers ?? {}).filter(Boolean);
  line(`  当前还活着的 worker 有 ${survivors.length} 个：${survivors.map((w) => w.process.pid).join(', ')}`);

  // 先问一下各 worker"你处理了多少请求"（走 worker.send / process.send 自定义消息）。
  for (const w of survivors) {
    const report = await new Promise((resolve) => {
      w.once('message', resolve);
      w.send({ type: 'report' });
    });
    line(`    pid=${report.pid}（id=${report.id}）报告：自己处理了 ${report.served} 个请求`);
  }

  // 为每个 worker 登记"等退出"，再统一断线 —— 避免事件早于监听器到达时被错过。
  const exitPromises = survivors.map(
    (w) =>
      new Promise((resolve) => {
        w.once('exit', (code, signal) => resolve({ pid: w.process.pid, code, signal }));
      }),
  );
  const allExited = Promise.all(exitPromises);

  // cluster.disconnect() 会对每个 worker 调用 disconnect()（worker 侧收到 'disconnect'
  // 后自行注销监听份额），同时关闭主进程持有的那些监听句柄。
  // 不调用它，主进程会因为句柄还开着而永远不退出。
  line('  调用 cluster.disconnect()：断开所有 worker 的 IPC，并关闭主进程持有的监听句柄。');
  cluster.disconnect();

  // 兜底计时器：1.2 秒内还有没退的，直接强杀。
  // 注意定时器用完必须 clearTimeout，否则它自己就会把进程多留 1.2 秒。
  let watchdog;
  const killTimeout = new Promise((resolve) => {
    watchdog = setTimeout(() => resolve('timeout'), 1200);
  });

  const outcome = await Promise.race([allExited.then(() => 'exited'), killTimeout]);
  clearTimeout(watchdog);

  if (outcome === 'timeout') {
    line('  1.2 秒内还有 worker 没退出 —— 触发兜底：直接 kill。');
    for (const w of Object.values(cluster.workers ?? {})) {
      if (w) w.kill();
    }
  } else {
    line('  所有 worker 都在超时窗口内优雅退出，不需要兜底强杀。');
  }

  for (const item of await allExited) {
    line(`    pid=${item.pid} 退出：code=${item.code}，signal=${item.signal}`);
  }

  line(`  本次一共发生崩溃重启 ${restartCount} 次`);
  line(`  cluster.workers 现在剩下：${JSON.stringify(Object.keys(cluster.workers ?? {}))}（[] = 都退干净了）`);

  // -------------------------------------------------------------------------
  section(8, '选型：四种"同时干多件事"的方案');
  // -------------------------------------------------------------------------

  line('  方案                隔离级别   内存      启动成本  典型用途');
  line('  ' + '-'.repeat(98));
  line('  child_process.spawn 独立进程   不共享    高        跑别的程序（ffmpeg / git / python）');
  line('  child_process.fork  独立进程   不共享    中        跑另一个 Node 脚本 + 开箱即用的双向通信');
  line('  cluster             独立进程   不共享    中        把 HTTP 服务铺满多核 + 崩溃自愈');
  line('  worker_threads      线程       可共享    低        并行跑 CPU 密集的**纯计算**');
  line();
  line('怎么选（三句话）：');
  line('  · 要"一个端口被多个 CPU 核一起服务"        -> cluster（本篇第 5~7 节）；');
  line('  · 要"把一段计算从主线程挪走、且频繁传数据"  -> worker_threads（进程内，开销最小）；');
  line('  · 要"跑别人的程序"或"把不稳定代码彻底关起来" -> child_process 系列。');
  line();
  line('为什么 cluster 不用 worker_threads 实现？因为 Node 的 HTTP 服务、原生模块、');
  line('第三方依赖里到处是"进程级"假设（句柄、信号、环境变量、崩溃隔离），用进程隔离');
  line('最省心：一个 worker 崩了不会污染别人，重启即可。代价就是内存不能共享。');

  // -------------------------------------------------------------------------
  section(9, '小结');
  // -------------------------------------------------------------------------

  line('· fork = 自带 IPC 通道的 spawn，专门跑 Node 脚本：child.send / process.send 双向通信；');
  line('· IPC 默认走 JSON 序列化（Date/Map/Set/Buffer 会失真、函数被静默丢弃、BigInt 报错），');
  line('  要保类型就写 serialization: "advanced"；');
  line('· send 的失败有两种：序列化错误同步抛，通道关闭错误异步 emit 到 "error"，两种都要防；');
  line('· disconnect() 只拆线、不杀进程；kill() 才是要命 —— 这个区别决定你能不能"优雅关闭"；');
  line('· cluster = fork + 共享端口句柄 + 崩溃重启，是让 Node 服务吃满多核的标准做法；');
  line('· worker 之间内存不共享，共享状态要靠 IPC 或外部存储；');
  line('· 收尾永远要"先优雅、后兜底强杀"，否则一个卡住的 worker 就能让主进程退不出去。');

  line();
  line(`本示例总耗时约 ${Date.now() - SCRIPT_START} ms（含 2 次 child_process.fork + 3 次 cluster.fork）。`);
  line('示例结束。');
}
