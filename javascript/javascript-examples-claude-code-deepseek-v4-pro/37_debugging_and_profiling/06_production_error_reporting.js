/**
 * ============================================================================
 * 知识点：生产环境错误上报 —— 全局兜底、上下文采集、脱敏、分级与告警
 * ============================================================================
 *
 * 【所属分类】37_debugging_and_profiling —— 调试与性能剖析
 * 【难度等级】高级
 * 【前置知识】20_error_handling/09_async_error_handling.js
 *
 * 【也见】32_security_and_best_practices/08_error_message_hygiene.js —— 分级 logger + 脱敏 + traceId
 *        这套手写实现在「安全与最佳实践」章节里也完整写了一遍。那篇是**安全视角**的主场
 *        （信息泄漏、用户枚举、日志反噬）；本文件是**生产上报流水线**视角（兜底→去重→限流→告警）。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    生产环境的错误处理不是"加一个 try/catch"，而是一条完整的流水线：
 *      兜底捕获 → 补齐上下文 → 脱敏 → 分级 → 去重聚合 → 限流 → 上报 → 告警
 *    本示例把这条流水线拆开，每一段都给出可以直接搬到项目里的代码。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 线上出现了 "Cannot read properties of undefined"，
 *      但日志里只有这一句话，没有请求、没有用户、没有版本，等于什么都查不了；
 *    - 一次故障给运维发了 8 万条告警，真正的第一条被淹没在通知轰炸里；
 *    - 日志把用户手机号、身份证、token 原样写了进去，合规检查直接挂掉；
 *    - 一个未处理的 Promise 拒绝悄无声息地让进程退出了，
 *      重启之后什么都没留下，只能靠猜。
 *
 * 3. 核心语法要点
 *    (1) process.on('uncaughtException')：捕获"没人接住"的同步异常。
 *        有监听器时，Node 默认的"打印并退出"行为会被【抑制】，进程会继续活着。
 *    (2) process.on('unhandledRejection')：捕获没有被 .catch / try-await 处理的
 *        Promise 拒绝。Node 15 起的默认策略是 throw：如果没注册这个监听器，
 *        未处理的拒绝会被当成未捕获异常，进程以退出码 1 结束。
 *    (3) process.setUncaughtExceptionCaptureCallback(fn)：
 *        另一套兜底机制，它【不触发 uncaughtException 事件】；
 *        两者同时使用会抛 ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET。
 *    (4) AsyncLocalStorage（node:async_hooks）：把 requestId 之类的上下文
 *        自动带过 await / 定时器 / I/O 回调，是"给异步错误补上下文"的标准解法。
 *    (5) process.report.writeReport()：生成一份诊断报告（含栈、堆摘要、环境），
 *        启动时加 --report-uncaught-exception 可以让它在崩溃时自动生成。
 *
 * 4. 常见陷阱
 *    - 陷阱一：把 uncaughtException 当成"错误处理"，捕获完继续正常服务。
 *      官方文档的措辞很重：异常之后进程处于【未定义状态】，
 *      继续跑等于带着脏状态服务用户。正确做法是记录 + 优雅退出 + 由进程管理器重启。
 *    - 陷阱二：在 uncaughtException 里做异步操作（写数据库、发 HTTP）。
 *      进程马上要退出了，异步任务很可能执行不完。日志要同步写或写本地文件。
 *    - 陷阱三：用 message 做去重指纹。message 里常带用户 ID、时间戳，
 *      同一个 bug 会被拆成几万条"不同"的错误，告警彻底失效。
 *      指纹应该基于【错误类型 + 栈顶帧】。
 *    - 陷阱四：每条错误都上报、每条都告警。结果是告警疲劳，
 *      真正的故障反而没人看。必须有采样、去重窗口和分级阈值。
 *    - 陷阱五：把完整 stack 和原始 message 直接上报给第三方。
 *      绝对路径会泄露内网目录结构，message 里可能带 token、手机号、SQL 语句。
 *    - 陷阱六：只上报"错误数量"，不上报"受影响用户数/请求数"。
 *      1 个用户重试 1 万次 和 1 万个用户各失败 1 次，严重程度完全不同。
 *    - 陷阱七：忘了 4xx 不是服务故障。把用户输入错误按 P0 告警，
 *      会让团队对告警脱敏。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 37_debugging_and_profiling/06_production_error_reporting.js
 *
 * 【预期输出】
 *   打印 7 个小节：兜底的必要性、两种全局兜底的实证（会故意抛出错误并接住，
 *   进程仍然以退出码 0 正常结束）、用 AsyncLocalStorage 采集请求上下文、
 *   栈与消息脱敏、分级与指纹去重限流、告警策略、检查清单。
 *   本示例【不会访问网络】，所有"上报"都以打印脱敏后的载荷代替。
 * ============================================================================
 */

import crypto from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';

const SCRIPT_START = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用小工具
// ---------------------------------------------------------------------------

function section(n, title) {
  console.log(`\n--- ${n}. ${title} ---`);
}

/** 打印一条"上报载荷"（本示例用打印代替真实网络上报） */
function printPayload(title, payload) {
  console.log(`${title}：`);
  console.log(
    JSON.stringify(payload, null, 2)
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n'),
  );
}

// ---------------------------------------------------------------------------
// 1. 生产环境的错误会从哪些地方"漏"出去
// ---------------------------------------------------------------------------

section(1, '为什么必须有全局兜底');

console.log('一个 Node 服务里，错误可能从四个地方冒出来：');
console.log('');
console.log('  ① 同步代码抛错且没人 catch      → uncaughtException');
console.log('  ② Promise 被拒绝但没人处理      → unhandledRejection');
console.log('  ③ 事件回调 / 定时器里抛错        → uncaughtException（调用栈在异步边界断掉）');
console.log('  ④ 进程收到 SIGTERM/SIGINT 要退出 → 需要优雅停机，否则未落盘的日志全丢');
console.log('');
console.log('前三种如果没有兜底，结果是【进程直接退出】，而且往往什么都不留下：');
console.log('  · 有的部署方式把 stderr 丢进黑洞，日志平台里查不到任何东西；');
console.log('  · 容器重启后现场消失，只剩一个 exitCode=1；');
console.log('  · 更糟的是"静默失败"：错误被某个空白 catch 吞掉，用户看到 500，');
console.log('    日志里干干净净。');
console.log('');
console.log('所以生产环境的标准配置是：全局兜底 + 结构化日志 + 优雅停机 + 进程守护。');
console.log('  全局兜底不是"错误处理方案"，它是【防止现场丢失的最后一道网】。');

// ---------------------------------------------------------------------------
// 2. 全局兜底：uncaughtException 与 unhandledRejection
// ---------------------------------------------------------------------------

section(2, '全局兜底：两种事件的语义与实证');

// ---------------------------------------------------------------------------
// 2.1 先准备好"上报"函数：这里只打印，真实项目里换成写日志/发 HTTP
// ---------------------------------------------------------------------------

const reportedEvents = [];

/** 最小可用的"错误上报"：补齐上下文 → 脱敏 → 打印（真实项目里换成日志/HTTP） */
function reportError(err, context = {}, severity = 'error') {
  const payload = {
    severity,
    name: err?.name ?? 'UnknownError',
    message: redactMessage(String(err?.message ?? err)),
    fingerprint: fingerprintOf(err),
    stack: sanitizeStack(err?.stack ?? '(无 stack)').split('\n').slice(0, 6).join('\n'),
    context,
    timestamp: new Date().toISOString(),
  };
  reportedEvents.push({ severity, fingerprint: payload.fingerprint, name: payload.name });
  printPayload(`【${severity}】上报一条错误`, payload);
  return payload;
}

// ---------------------------------------------------------------------------
// 2.2 uncaughtException：捕获"没人接住"的同步异常
// ---------------------------------------------------------------------------

process.on('uncaughtException', (err) => {
  console.log('');
  console.log('  >>> uncaughtException 兜底被触发 <<<');
  reportError(err, {
    // 这里能拿到的上下文很有限：全局兜底时已经没有"请求"这个语境了，
    // 所以真正的上下文必须靠第 3 节的 AsyncLocalStorage 提前携带。
    pid: process.pid,
    nodeVersion: process.version,
    env: process.env.NODE_ENV ?? '(未设置)',
  }, 'fatal');

  console.log('');
  console.log('  真实项目里，这个分支的正确后续动作是：');
  console.log('    1) 同步写出日志 / 落盘（异步操作可能来不及执行完）；');
  console.log('    2) 停止接收新请求（从负载均衡摘除）；');
  console.log('    3) process.exit(1)，让进程管理器（PM2 / K8s）把你重启；');
  console.log('  绝对不要"记录一下然后继续服务"——异常之后进程状态是未定义的，');
  console.log('  带着脏状态继续跑，可能写出错误的数据、返回错误的结果。');
  console.log('');
  console.log('  本示例为了继续演示后面的内容，【刻意没有退出】。');
});

// 故意制造一个"没人接住"的异常：注意它发生在定时器回调里，
// 这也正是最常见的场景——异步回调中的错误没有 try/catch 包住。
setTimeout(() => {
  const fakeUser = null;
  fakeUser.profile.name; // TypeError: Cannot read properties of null
}, 0);

// 等它发生之后再继续
await new Promise((resolve) => setTimeout(resolve, 30));

// ---------------------------------------------------------------------------
// 2.3 unhandledRejection：捕获没人处理的 Promise 拒绝
// ---------------------------------------------------------------------------

process.on('unhandledRejection', (reason, promise) => {
  console.log('');
  console.log('  >>> unhandledRejection 兜底被触发 <<<');
  console.log(`  被拒绝的 Promise 对象本身也拿得到（用于关联上下文）：${promise instanceof Promise}`);
  reportError(reason instanceof Error ? reason : new Error(String(reason)), {
    note: '这个 Promise 没有被 await，也没有 .catch',
  }, 'error');
  console.log('');
  console.log('  关于 unhandledRejection 的两条关键事实：');
  console.log('    · Node 15 起默认策略是 --unhandled-rejections=throw：');
  console.log('      如果【没有】注册这个监听器，未处理的拒绝会被当成未捕获异常，');
  console.log('      进程以退出码 1 结束。注册了监听器就由你负责处理；');
  console.log('    · 可用 --unhandled-rejections=strict|warn|throw|none 调整策略，');
  console.log('      strict 最严格（任何未处理的拒绝都直接崩溃），');
  console.log('      生产环境建议保持默认的 throw，让问题尽早暴露而不是被悄悄吞掉。');
});

// 故意制造一个没人处理的拒绝（注意：这里不 await、不 catch）
Promise.reject(new Error('下游支付网关返回 503，重试 3 次后放弃'));

// 等 unhandledRejection 事件被派发之后再继续
await new Promise((resolve) => setTimeout(resolve, 30));

console.log('');
console.log('两条兜底都生效了，而且本进程【仍然活着】——这就是"有监听器就抑制默认崩溃"的效果。');
console.log('  但要再强调一次：生产环境应该在被兜底之后【主动退出并重启】，而不是继续跑。');
console.log('');
console.log('另一套等价的机制（二者只能选一个）：');
console.log('  process.setUncaughtExceptionCaptureCallback((err) => { /* ... */ })');
console.log('  它不会触发 uncaughtException 事件；如果两种都注册，');
console.log('  Node 会抛 ERR_UNCAUGHT_EXCEPTION_CAPTURE_ALREADY_SET。');
console.log('');
console.log('还有一个常被忽略的兜底：诊断报告（Diagnostic Report）。');
console.log('  它比日志更进一步，会带上环境、堆摘要、栈、libuv 句柄等现场信息：');
console.log('    process.report.writeReport();                 // 手动触发');
console.log('    node --report-uncaught-exception app.js       // 崩溃时自动生成');
console.log('    node --report-on-signal --report-signal=SIGUSR2 app.js   // 收信号时生成');
console.log('  排查"进程凭空消失"这类问题时，它的价值非常高。');

// ---------------------------------------------------------------------------
// 3. 上下文采集：用 AsyncLocalStorage 让 requestId 跟着异步流程走
// ---------------------------------------------------------------------------

section(3, '上下文采集：AsyncLocalStorage 携带 requestId');

console.log('问题：全局兜底捕获到错误时，你几乎拿不到任何业务上下文——');
console.log('  不知道是哪个请求、哪个用户、哪个版本触发的，因为调用栈在异步边界断掉了。');
console.log('');
console.log('解法：用 AsyncLocalStorage 建立一个"随异步流程传播"的存储；');
console.log('  在请求入口处 run() 一次，之后在这个异步调用链的任何地方都能读到它，');
console.log('  包括 setTimeout、I/O 回调、以及全局兜底处理器里。');
console.log('');

// 创建上下文存储（真实项目里通常放在一个单独的模块里导出）
const requestContext = new AsyncLocalStorage();

/** 取当前上下文；没有就返回一个空对象，避免到处判空 */
const currentContext = () => requestContext.getStore() ?? {};

async function queryDatabase(sql) {
  await new Promise((resolve) => setTimeout(resolve, 1));
  // 注意：这里没有把 requestId 当参数传进来，但依然能读到 —— 这就是价值所在
  const ctx = currentContext();
  console.log(`    查询数据库（sql=${sql}）时读到的上下文：requestId=${ctx.requestId}, user=${ctx.userId}`);
  return [{ id: 1 }];
}

async function handleRequest(requestId, userId) {
  // 在请求入口处建立上下文；run 内部的整条异步链都能读到这个 store
  return requestContext.run({ requestId, userId, startedAt: Date.now() }, async () => {
    console.log(`  处理请求 ${requestId}：`);
    const rows = await queryDatabase('select 1');
    // 定时器回调里同样读得到
    await new Promise((resolve) =>
      setTimeout(() => {
        console.log(`    定时器回调里读到的 requestId=${currentContext().requestId}`);
        resolve();
      }, 1),
    );
    return rows.length;
  });
}

console.log('模拟两个并发请求，看上下文会不会串：');
const [countA, countB] = await Promise.all([handleRequest('req-AAA', 'user-1'), handleRequest('req-BBB', 'user-2')]);
console.log(`  两个请求都完成，各自返回 ${countA} / ${countB} 行。`);
console.log('');
console.log('可以看到：两个并发请求的 requestId 各自独立，没有互相污染。');
console.log('  这就是 AsyncLocalStorage 的核心价值：');
console.log('  · 不用把 requestId 一层层当参数往下传（也就不会漏传）；');
console.log('  · 在异步回调、全局兜底、日志中间件里都能读到，天然串起一次请求的所有日志；');
console.log('  · 代价是有少量运行时开销（依赖 async_hooks），属于"值得付"的成本。');
console.log('');
console.log('真实项目里的典型用法：');
console.log('  · HTTP 入口中间件里生成 requestId（或者取上游传来的 X-Request-Id），');
console.log('    然后 requestContext.run({ requestId, userId, traceId }, next)；');
console.log('  · 日志库从上下文里自动取 requestId 附加到每一条日志上；');
console.log('  · 全局兜底处理器里同样读一次，就能把"哪个请求炸了"上报出去。');
console.log(`  · 本示例演示的三层（入口 → 数据库 → 定时器）读到的都是同一个 requestId；`);
console.log(`    当前上下文（在 run 之外）是空的：${JSON.stringify(currentContext())}`);

// ---------------------------------------------------------------------------
// 4. 脱敏：栈和消息都不能原样上报
// ---------------------------------------------------------------------------

section(4, '脱敏：栈路径、敏感字段、栈长度');

/**
 * 栈脱敏：
 *  ① 把绝对路径换成文件名，避免泄露内网目录结构 / 用户名 / 项目代号；
 *  ② 丢掉 node:internal 帧（对自己没用，还占体积）；
 *  ③ 截断帧数——栈只需要"够定位"，不需要全量。
 */
function sanitizeStack(stack, options = {}) {
  const { maxFrames = 8, keepNodeInternals = false } = options;
  const lines = String(stack).split('\n');
  const head = lines[0];
  let frames = lines.slice(1);

  if (!keepNodeInternals) {
    frames = frames.filter((line) => !line.includes('node:internal'));
  }

  frames = frames.map(
    (line) =>
      // ESM：file:///C:/very/long/path/to/app.js:12:34 → app.js:12:34
      line
        .replace(/file:\/\/\/[^\s)]+/g, (url) => url.split('/').pop())
        // CommonJS：C:\very\long\path\app.js:12:34 或 /very/long/path/app.js:12:34
        .replace(/\(([A-Za-z]:[\\/][^\s):]+|\/[^\s):]+)(:\d+:\d+)\)/g, (_m, filePath, pos) => {
          const base = filePath.split(/[\\/]/).pop();
          return `(${base}${pos})`;
        }),
  );

  if (frames.length > maxFrames) {
    const omitted = lines.length - 1 - maxFrames;
    frames = [...frames.slice(0, maxFrames), `    ... 省略 ${omitted} 帧（上报时只保留定位所需的最小信息）`];
  }

  return [head, ...frames].join('\n');
}

/**
 * 消息脱敏：错误信息里经常夹带着用户数据与凭据。
 * 这是合规红线（个保法/GDPR），不是"可做可不做"的优化。
 */
function redactMessage(message) {
  return String(message)
    .replace(/(token|password|passwd|secret|api[_-]?key|authorization)\s*[=:]\s*[^\s,&"']+/gi, '$1=<已脱敏>')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '<邮箱已脱敏>')
    .replace(/\b1[3-9]\d{9}\b/g, '<手机号已脱敏>')
    .replace(/\b\d{17}[\dXx]\b/g, '<身份证已脱敏>')
    .replace(/\/api\/v\d+\/users\/\d+/g, '/api/v*/users/<ID已脱敏>');
}

// 用一条"很脏"的错误来验证脱敏效果
const dirtyError = new Error(
  '调用 /api/v1/users/10086 失败：user=张三 email=zhangsan@example.com phone=13800138000 token=sk-live-abcdefg123456',
);
dirtyError.stack = [
  'Error: 调用 /api/v1/users/10086 失败',
  '    at fetchUser (C:\\Repo\\internal-payments-service\\src\\clients\\user.js:42:11)',
  '    at processTicksAndRejections (node:internal/process/task_queues:95:5)',
  '    at async handleRequest (C:\\Repo\\internal-payments-service\\src\\routes\\user.js:18:5)',
  '    at async file:///C:/Repo/internal-payments-service/src/server.js:88:3',
].join('\n');

console.log('原始栈（会泄露内网目录结构）：');
console.log(
  dirtyError.stack
    .split('\n')
    .map((l) => `  ${l}`)
    .join('\n'),
);
console.log('');
console.log('脱敏后的栈：');
console.log(
  sanitizeStack(dirtyError.stack)
    .split('\n')
    .map((l) => `  ${l}`)
    .join('\n'),
);
console.log('');
console.log('消息脱敏：');
console.log(`  原始：${dirtyError.message}`);
console.log(`  脱敏：${redactMessage(dirtyError.message)}`);
console.log('');
console.log('  注意：user=张三 并没有被脱敏——这正说明【黑名单式脱敏一定会漏】。');
console.log('  真实项目里更可靠的做法是白名单：只上报你明确需要的字段，');
console.log('  而不是"先全部上报、再想办法把敏感的过滤掉"。');
console.log('');
console.log('脱敏的几条原则：');
console.log('  · 【白名单优于黑名单】：与其枚举所有敏感字段，不如只上报明确需要的字段；');
console.log('  · 绝对路径一律换成文件名——它同时也在泄露"用户名 + 项目结构"；');
console.log('  · 栈不必全量上报，8~15 帧足够定位，还能显著降低上报体积；');
console.log('  · 脱敏必须在【进程内、上报之前】完成，别指望日志平台帮你做；');
console.log('  · 落到日志里的东西就是"已经泄露给所有有日志权限的人"了。');

// ---------------------------------------------------------------------------
// 5. 分级、指纹去重与限流
// ---------------------------------------------------------------------------

section(5, '错误分级、指纹去重与限流');

/** 分级：不是所有错误都值得半夜叫醒人 */
function classify(err) {
  const status = err?.statusCode ?? err?.status;
  // 客户端错误（4xx）不是服务故障，按 warn 处理，只统计不告警
  if (typeof status === 'number' && status >= 400 && status < 500) return 'warn';
  // 明确的"用户主动取消"，直接忽略
  if (err?.name === 'AbortError' || err?.code === 'ECONNABORTED') return 'ignore';
  // 下游依赖不可用、磁盘写满这类，属于需要人介入的
  if (err?.code === 'ECONNREFUSED' || err?.code === 'ENOSPC' || err?.code === 'ENOMEM') return 'fatal';
  // 约定：显式标记为致命的自定义错误
  if (err?.severity === 'fatal') return 'fatal';
  return 'error';
}

/**
 * 指纹：用来把"同一个 bug 的 N 条错误"合并成 1 个问题。
 * 关键设计：只取【错误类型 + 栈顶的"自己项目"帧】，不含 message。
 * 因为 message 里经常带用户 ID、时间戳、SQL 参数，
 * 拿它做指纹会让同一个 bug 变成几万条"不同"的问题。
 */
function fingerprintOf(err) {
  const frames = String(err?.stack ?? '')
    .split('\n')
    .slice(1)
    .map((line) => line.trim())
    // 归一化：去掉行号列号，只保留"哪个函数在哪个文件"
    .map((line) => line.replace(/:\d+:\d+\)?$/, ''))
    .filter((line) => !line.includes('node:internal'));
  const topFrame = frames[0] ?? '(无栈信息)';
  const raw = `${err?.name ?? 'Error'}|${topFrame}`;
  return crypto.createHash('sha1').update(raw).digest('hex').slice(0, 12);
}

/**
 * 聚合器：同一指纹在一个时间窗口内最多上报 N 次，其余只计数。
 * 这是所有错误监控平台的核心逻辑，也是防"告警轰炸"的第一道闸门。
 */
class ErrorAggregator {
  constructor({ windowMs = 60_000, maxPerWindow = 3 } = {}) {
    this.windowMs = windowMs;
    this.maxPerWindow = maxPerWindow;
    this.buckets = new Map(); // fingerprint -> { windowStart, reported, suppressed }
  }

  /**
   * @param {string} fingerprint
   * @param {number} now 当前时间（显式传入，方便演示与测试）
   * @returns {{report:boolean, reason:string, stats:object}}
   */
  shouldReport(fingerprint, now) {
    let bucket = this.buckets.get(fingerprint);
    if (!bucket) {
      // 第一次见到这个指纹：新建一个桶，累计值也从 0 开始
      bucket = { windowStart: now, reported: 0, suppressed: 0, totalReported: 0, totalSuppressed: 0 };
      this.buckets.set(fingerprint, bucket);
    } else if (now - bucket.windowStart >= this.windowMs) {
      // 进入新窗口：只重置窗口内的计数，【累计值保留】，
      // 否则"这个 bug 一共吵了多少次"这个关键信息就丢了。
      bucket.windowStart = now;
      bucket.reported = 0;
      bucket.suppressed = 0;
    }
    if (bucket.reported < this.maxPerWindow) {
      bucket.totalReported += 1;
      bucket.reported += 1;
      return { report: true, reason: `窗口内第 ${bucket.reported} 次，允许上报`, stats: bucket };
    }
    bucket.suppressed += 1;
    bucket.totalSuppressed += 1;
    return { report: false, reason: `窗口内已上报 ${bucket.reported} 次，本次被限流`, stats: bucket };
  }

  summary() {
    return [...this.buckets.entries()].map(([fp, b]) => ({
      fingerprint: fp,
      本窗口上报: b.reported,
      本窗口抑制: b.suppressed,
      累计上报: b.totalReported,
      累计抑制: b.totalSuppressed,
    }));
  }
}

// 5.1 分级演示
console.log('错误分级演示：');
const sampleErrors = [
  Object.assign(new Error('参数校验失败：age 必须是数字'), { statusCode: 400 }),
  Object.assign(new Error('用户不存在'), { statusCode: 404 }),
  Object.assign(new Error('数据库连接池耗尽'), { code: 'ECONNREFUSED' }),
  Object.assign(new Error('请求被取消'), { name: 'AbortError' }),
  new Error('一个普通的业务异常'),
];
console.log('  错误'.padEnd(34) + '判定级别');
console.log('  ' + '-'.repeat(56));
for (const err of sampleErrors) {
  console.log(`  ${err.message.padEnd(32)}${classify(err)}`);
}
console.log('');
console.log('分级的实际意义：');
console.log('  · ignore → 只计数，不进告警通道（用户取消不该吵醒任何人）；');
console.log('  · warn   → 进日报/看板，用于发现"是不是有客户端版本在乱调接口"；');
console.log('  · error  → 实时上报，按指纹聚合，超过阈值才告警；');
console.log('  · fatal  → 立即告警，并且通常伴随"服务已经不可用"的判断。');

// 5.2 指纹演示：同一个 bug 的不同 message 应该归为同一个指纹
const sameBugA = new Error('user 1001 not found');
sameBugA.stack = 'Error: user 1001 not found\n    at findUser (C:\\app\\src\\user.js:42:11)\n    at async handle (C:\\app\\src\\route.js:9:3)';
const sameBugB = new Error('user 8888 not found');
sameBugB.stack = 'Error: user 8888 not found\n    at findUser (C:\\app\\src\\user.js:42:11)\n    at async handle (C:\\app\\src\\route.js:9:3)';
const otherBug = new Error('user 8888 not found');
otherBug.stack = 'Error: user 8888 not found\n    at sendEmail (C:\\app\\src\\mail.js:12:5)';

console.log('');
console.log('指纹演示（注意 message 不同、但栈顶帧相同 → 应当归为同一个问题）：');
console.log(`  "user 1001 not found" 的指纹 = ${fingerprintOf(sameBugA)}`);
console.log(`  "user 8888 not found" 的指纹 = ${fingerprintOf(sameBugB)}`);
console.log(`  两者是否同一个指纹？        ${fingerprintOf(sameBugA) === fingerprintOf(sameBugB)}`);
console.log(`  另一处抛出的相似错误指纹     = ${fingerprintOf(otherBug)}`);
console.log(`  是否与前两者相同？          ${fingerprintOf(otherBug) === fingerprintOf(sameBugA)}`);
console.log('');
console.log('如果改用 message 做指纹，这两条会被当成两个不同的问题，');
console.log('  线上只要用户 ID 变化就会源源不断地产生"新问题"，聚合彻底失效。');

// 5.3 限流演示：用显式时间戳模拟，结果完全确定
const aggregator = new ErrorAggregator({ windowMs: 60_000, maxPerWindow: 3 });
const windowStart = 1_700_000_000_000;
const sameFingerprint = fingerprintOf(sameBugA);
console.log('');
console.log('限流演示（窗口 60 秒，同一指纹最多上报 3 次）：');
console.log('  时间偏移'.padEnd(16) + '是否上报'.padEnd(12) + '原因');
console.log('  ' + '-'.repeat(82));
const timeline = [
  { offset: 0, fp: sameFingerprint, label: '同一个 bug 第 1 次' },
  { offset: 500, fp: sameFingerprint, label: '同一个 bug 第 2 次' },
  { offset: 1200, fp: sameFingerprint, label: '同一个 bug 第 3 次' },
  { offset: 1800, fp: sameFingerprint, label: '同一个 bug 第 4 次' },
  { offset: 2400, fp: sameFingerprint, label: '同一个 bug 第 5 次' },
  { offset: 3000, fp: fingerprintOf(otherBug), label: '另一个 bug（新指纹，不受影响）' },
  { offset: 61_000, fp: sameFingerprint, label: '下一个窗口，重新计数' },
];
for (const item of timeline) {
  const result = aggregator.shouldReport(item.fp, windowStart + item.offset);
  console.log(
    `  +${String(item.offset).padStart(6)} ms`.padEnd(16) +
      String(result.report).padEnd(12) +
      `${result.reason}  ← ${item.label}`,
  );
}
console.log('');
console.log('聚合器最终统计（被抑制的次数同样重要，它反映"这个 bug 有多吵"）：');
for (const row of aggregator.summary()) {
  console.log(
    `  指纹 ${row.fingerprint}：本窗口上报 ${row.本窗口上报} 次 / 抑制 ${row.本窗口抑制} 次；` +
      `累计上报 ${row.累计上报} 次 / 抑制 ${row.累计抑制} 次`,
  );
}
console.log('  注意累计值跨窗口保留：窗口重置的是"限流计数"，不是"这个 bug 吵了多少次"。');
console.log('');
console.log('除了"每窗口限流"，常见的策略还有：');
console.log('  · 采样：高频但低价值的错误按 1% 采样上报，用于统计成功率；');
console.log('  · 新指纹立即上报：第一次见的错误不做限流，保证新问题不会被挡掉；');
console.log('  · 熔断：某个指纹在 1 分钟内超过 1000 次，直接打入"已知故障"名单，');
console.log('    只更新计数不再逐条处理，避免上报通道本身被打挂。');

// ---------------------------------------------------------------------------
// 6. 告警策略：让正确的人在该醒的时候醒
// ---------------------------------------------------------------------------

section(6, '告警策略与工程实践');

console.log('告警不是"有错就发通知"，而是一套决策规则。经验值如下：');
console.log('');
console.log('  ① 基于【影响面】而不是【错误条数】告警');
console.log('     1 个用户疯狂重试产生 1 万条错误，和 1 万个用户各错 1 次，');
console.log('     严重程度完全不同。应该统计"受影响请求占比 / 受影响用户数"。');
console.log('');
console.log('  ② 新指纹首次出现 → 可以直接告警');
console.log('     它是"我们之前没见过的问题"，即使只有一条也值得看一眼。');
console.log('     已经见过的指纹 → 按速率告警（如 5 分钟内超过 50 次）。');
console.log('');
console.log('  ③ 设置静默期与升级路径');
console.log('     同一指纹告警后静默 30 分钟；持续超过 1 小时自动升级；');
console.log('     已确认修复的指纹加白名单，避免"修好了还在响"。');
console.log('');
console.log('  ④ 告警内容必须能让值班的人自己动手排查');
console.log('     至少要包含：指纹、首次出现时间、影响版本、错误类型、');
console.log('     栈顶帧、示例 requestId（能直接去日志里捞完整现场）；');
console.log('     不要只发一句"错误数超过阈值"。');
console.log('');
console.log('  ⑤ 分级路由');
console.log('     fatal → 电话/值班群；error → 工单/告警群；warn → 日报看板。');
console.log('     所有级别都往同一个群里发，等于没有级别。');
console.log('');
console.log('  ⑥ 与发布系统联动');
console.log('     错误率突增的时间点往往就是一次发布。把版本号带进上报载荷，');
console.log('     上线后自动比对"新版本 vs 老版本"的错误率，回滚决策会快很多。');
console.log('');
console.log('除了告警，工程上还有几件必须做的事：');
console.log('  · 结构化日志（JSON）：字段固定、可检索，别用字符串拼接；');
console.log('  · 优雅停机：收到 SIGTERM 后停止收新请求 → 处理完在途请求 →');
console.log('    刷新上报队列 → 退出。没有这一步，进程被杀时最后一批错误日志会丢；');
console.log('  · 进程守护：PM2 / systemd / K8s 负责崩溃后重启，');
console.log('    这样"崩溃即退出"才是安全策略；');
console.log('  · 不要用 console.log 当生产日志：没有级别、没有时间戳、无法结构化，');
console.log('    生产环境请用 pino / winston 这类日志库。');

// 把前面几条"上报"的结果汇总一下，展示兜底确实抓到了东西
console.log('');
console.log('本示例运行期间，全局兜底共捕获并"上报"了以下事件：');
for (const event of reportedEvents) {
  console.log(`  [${event.severity}] ${event.name} (指纹 ${event.fingerprint})`);
}

// 收尾：真实项目里这里应该在 SIGTERM 处理里刷新上报队列
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM：真实项目里应当在这里停止接收新请求、刷新上报队列，再退出。');
  process.exit(0);
});

// ---------------------------------------------------------------------------
// 7. 检查清单
// ---------------------------------------------------------------------------

section(7, '生产环境错误上报检查清单');

const checklist = [
  ['注册 uncaughtException 与 unhandledRejection', '否则进程会静默退出，什么现场都不留'],
  ['兜底之后记录 + 退出 + 重启', '异常后进程状态未定义，继续服务会写坏数据'],
  ['兜底里只做同步操作', '进程立刻要退出，异步上报很可能执行不完'],
  ['用 AsyncLocalStorage 带上下文', '异步边界会丢栈，requestId 必须提前存好'],
  ['指纹 = 错误类型 + 栈顶帧', '用 message 做指纹会让同一 bug 碎成几万条'],
  ['绝对路径换成文件名', '栈里的路径会泄露内网结构与用户名'],
  ['消息里的凭据与 PII 必须脱敏', '合规红线，落盘即视为已泄露'],
  ['栈只保留 8~15 帧', '足够定位，且显著降低上报体积'],
  ['分级 + 限流 + 采样', '防止告警轰炸，保住真正重要的那条通知'],
  ['按影响面告警而非条数', '1 万条小错误可能不如 10 个用户全挂重要'],
  ['版本号/环境写进载荷', '便于对比发布前后，快速定位与回滚'],
  ['优雅停机并刷新上报队列', '否则最后一批错误日志会随进程一起消失'],
  ['用结构化日志库而不是 console.log', '可检索、有级别、可采样，是上报的基础'],
];

console.log('要点'.padEnd(44) + '说明');
console.log('-'.repeat(100));
for (const [item, reason] of checklist) {
  console.log(item.padEnd(42) + reason);
}

console.log('');
console.log('一句话总结：兜底负责"别漏"，上下文负责"能查"，脱敏负责"能存"，');
console.log('  分级与限流负责"值得看"——四件事都做到，生产环境的错误才真正可控。');
console.log(`\n本示例总耗时约 ${Date.now() - SCRIPT_START} ms。`);
console.log('示例结束。');
