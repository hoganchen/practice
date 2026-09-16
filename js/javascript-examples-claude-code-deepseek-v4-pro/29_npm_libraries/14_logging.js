/**
 * ============================================================================
 * 知识点：日志 —— 从 console.log 到结构化日志器，以及 pino / winston / consola 选型
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】高级
 * 【前置知识】29_npm_libraries/10_express_server.js（HTTP 服务端）、
 *             29_npm_libraries/12_library_selection.js（库选型方法论）、
 *             20_error_handling（Error 对象与堆栈）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    日志是"程序运行过程的可观测记录"，是可观测性三大支柱（Logs / Metrics / Traces）
 *    里最基础、成本最低的一个。
 *    "结构化日志"（structured logging）指的是：**日志的载体是机器可解析的对象，
 *    而不是给人看的拼接字符串**。每条日志是一个 JSON 对象，形如：
 *      {"level":30,"time":"2026-09-16T02:11:07.482Z","pid":1234,
 *       "requestId":"req-8f3a","userId":42,"msg":"订单创建成功","orderId":"ORD-1","costMs":12}
 *    这样的日志能直接被 Elasticsearch / Loki / Datadog 索引、按字段检索、做聚合告警。
 *
 * 2. 为什么需要（真实项目场景）
 *    console.log 在开发时很好用，在生产环境有五个硬伤：
 *      (a) **没有级别**：无法只想看 warn 以上；线上打开 debug 日志会把磁盘写爆。
 *      (b) **没有上下文**：一个并发 1000 QPS 的服务里，几十行日志交错打印，
 *          你根本分不清哪几行属于同一个请求 —— 这是排障最致命的痛点。
 *      (c) **不是结构化数据**：`console.log('订单', id, '创建失败', err)` 打出来是
 *          拼接文本，采集端只能全文检索，没法 `WHERE userId=42 AND status=500`。
 *      (d) **无法输出到采集端**：console 只能写 stdout/stderr，要发到 Kafka/HTTP 采集器
 *          得自己包一层，而且会阻塞主线程。
 *      (e) **可能阻塞事件循环**：写 TTY/文件是同步系统调用，高频日志会拖慢服务；
 *          而且 console.log 对对象做惰性 inspect，持有引用会阻止 GC（内存泄漏来源之一）。
 *
 *    真实场景举例：
 *      - 线上支付接口偶发失败，你要按 requestId 捞出这个请求的**全部**日志串起来看；
 *      - 老板问"昨天 500 错误率多少"，你要能按 level=50 聚合统计；
 *      - 安全合规要求日志里**绝不能出现密码/身份证/银行卡号**（脱敏）；
 *      - 高频 debug 日志要按 1% 采样，否则采集成本比服务器还贵。
 *    这些 console.log 一条都做不到。
 *
 * 3. 核心语法要点（本文件手写实现里涉及的）
 *    - 级别权重：`{ trace:10, debug:20, info:30, warn:40, error:50, fatal:60 }`，
 *      比较权重决定是否输出；数值与业界事实标准（pino / bunyan / syslog）一致，方便对接。
 *    - 绑定上下文（bindings）：logger 创建时携带的基础字段（service、env、pid）。
 *    - 子日志器 child(bindings)：从父日志器派生，字段**累加**，用于给一次请求/一个任务
 *      打上 requestId、userId。这是结构化日志最核心的用法。
 *    - 传输层（transport）：日志记录最终去哪（stdout / 文件 / 内存 / HTTP 采集端）。
 *      把"产生日志"和"消费日志"解耦，才能做到不阻塞业务、可插拔、可测试。
 *    - 脱敏（redaction）：按路径把敏感字段替换成 [REDACTED]。
 *    - 序列化器（serializer）：把 Error 这种不可 JSON 化的对象转成可读结构（含 stack）。
 *
 * 4. 常见陷阱
 *    - 打日志时把整个对象丢进去：`log.info(req)` 会打印 body/文件内容/凭证，既慢又泄密。
 *    - 用字符串拼接代替结构化字段：`log.info('user ' + id + ' paid ' + amt)`，
 *      采集端再也没法按 id / amt 检索与聚合。
 *    - 同步写文件/网络：高并发下日志本身成为性能瓶颈甚至拖垮服务。
 *      正确做法是写 stdout，由容器运行时/采集 agent 异步收走（12-factor 原则）。
 *    - 在循环里打日志：一次批量任务打几十万行，既没用又要花钱。
 *      高频日志要采样或聚合（"共处理 N 条，失败 M 条"）。
 *    - JSON.stringify(Error) 得到 `{}`：Error 的 message/stack 是不可枚举属性。
 *      必须显式序列化，这是新手最常见的"日志里看不到错误原因"。
 *    - 日志里同时用 console.log 和 logger，格式混乱，采集端规则难写。
 *    - 把敏感字段脱敏做成"人工记得别打"：一定会漏。要基于路径自动脱敏。
 *    - 只在 catch 里打 `err.message`，丢掉了 stack：等于没有排障线索。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/14_logging.js
 *   （全程零新增依赖、不访问外网；日志只写到内存缓冲和 stdout）
 *
 * 【预期输出】
 *   先展示 console.log 在并发场景下的混乱，再逐步搭出一个可用的结构化日志器：
 *   层级过滤 → JSON 输出 → requestId 子日志器 → 脱敏 → 采样 → 可插拔 transport，
 *   最后给出 pino / winston / consola 的离线横向对比与生产日志清单，退出码 0。
 * ============================================================================
 */

import assert from 'node:assert/strict';

// ===========================================================================
// 1. 先看问题：console.log 在并发/生产场景下到底哪里不行
// ===========================================================================

console.log('--- 1. 问题复现：console.log 的五个硬伤 ---');

// 模拟两个并发请求的交错日志。人类看着还行，机器完全无法区分归属。
const fakeErr = new Error('connect ECONNREFUSED 10.0.0.7:5432');
console.log('  [原生 console.log 输出示例]');
console.log('    收到下单请求', 'req-1a2b');
console.log('    收到下单请求', 'req-9c8d');
console.log('    扣库存失败', fakeErr); // 打印的是"给人看的"格式，不是 JSON
console.log('    订单创建成功', 'req-1a2b', 12);

console.log('');
console.log('  硬伤盘点：');
console.log('    1) 无级别    ：没法只输出 warn 以上，线上不敢开 debug');
console.log('    2) 无上下文  ：req-1a2b 和 req-9c8d 的日志交错，无法按请求聚合');
console.log('    3) 非结构化  ：是拼接文本，采集端不能 WHERE userId=42');
console.log('    4) 无出口    ：写不到 Kafka / HTTP 采集端，且同步写会阻塞事件循环');
console.log('    5) 无脱敏    ：password / token 一旦打进去就是安全事故');
console.log('  另外还有一个隐蔽坑：JSON.stringify(new Error("x")) === ' + JSON.stringify(JSON.stringify(new Error('x'))));

// ===========================================================================
// 2. 手写一个结构化日志器（零依赖，约 120 行）
// ===========================================================================

console.log('\n--- 2. 手写结构化日志器 ---');

// 级别用数字权重，和 pino / bunyan / syslog 保持一致，方便日后无痛迁移
const LEVELS = Object.freeze({
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
  silent: Infinity, // 特殊级别：设成它等于关闭所有输出
});

/**
 * 把 Error / Map / BigInt 等"不可 JSON 化"的值转成普通对象。
 * 这是日志库最容易被忽略、又最影响排障体验的一环。
 */
function serializeValue(value, seen = new WeakSet()) {
  if (value instanceof Error) {
    return {
      type: value.name,
      message: value.message,
      // stack 是排障的根本，绝对不能丢
      stack: value.stack,
      // 保留自定义字段（如 err.code = 'ECONNREFUSED'）
      ...Object.fromEntries(Object.entries(value).filter(([k]) => k !== 'name')),
      ...(value.cause ? { cause: serializeValue(value.cause, seen) } : {}),
    };
  }
  if (value instanceof Map) return Object.fromEntries(value);
  if (value instanceof Set) return [...value];
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map((v) => serializeValue(v, seen));
  if (value && typeof value === 'object') {
    // 防循环引用：日志代码自己把进程写崩就太讽刺了
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = serializeValue(v, seen);
    seen.delete(value);
    return out;
  }
  return value;
}

/**
 * 按路径脱敏。paths 形如 ['password', 'token', 'user.idCard', 'headers.authorization']。
 * 用"路径白名单"而不是"人工记得别打"，才能保证不漏。
 */
function redactValue(value, paths, prefix = '') {
  if (Array.isArray(value)) return value.map((v) => redactValue(v, paths, prefix));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${k}` : k;
      // 命中路径本身，或命中某个前缀下的任意字段（用 `*` 表示）
      if (paths.includes(path) || paths.includes(`${prefix}.*`)) out[k] = '[REDACTED]';
      else out[k] = redactValue(v, paths, path);
    }
    return out;
  }
  return value;
}

// ---------------------------------------------------------------------------
// 传输层：日志最终写到哪儿。用函数表示，可插拔、可组合。
// ---------------------------------------------------------------------------

/** 传输层 1：把 JSON 打到 stdout（12-factor 推荐做法，由采集 agent 异步收走） */
function stdoutTransport({ pretty = false } = {}) {
  return {
    name: 'stdout',
    write(record) {
      if (pretty) {
        // 把 level(数字) / levelName / time / msg 这几个"元字段"摘掉，剩下的才是业务字段
        const { level, levelName, time, msg, ...rest } = record;
        const extras = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
        console.log(`  [${time}] ${levelName.toUpperCase().padEnd(5)} ${msg}${extras}`);
      } else {
        console.log(JSON.stringify(record));
      }
    },
  };
}

/** 传输层 2：写进内存数组。生产里对应"批量攒够 N 条再发 Kafka"，测试里用来做断言 */
function memoryTransport() {
  const records = [];
  return {
    name: 'memory',
    records,
    write(record) {
      records.push(record);
    },
  };
}

/** 传输层 3：按比例采样。高频 debug/trace 日志只留 1%，避免日志费比服务器还贵 */
function samplingTransport(inner, { sampleRate = 0.1, alwaysKeepAtOrAbove = 'warn' } = {}) {
  const threshold = LEVELS[alwaysKeepAtOrAbove];
  let kept = 0;
  let dropped = 0;
  return {
    name: `sampling(${inner.name})`,
    stats: () => ({ kept, dropped }),
    write(record) {
      // 注意：record.level 已经是**数字权重**（LEVELS 是用名字索引的，别再套一层 LEVELS[...]）
      // warn 以上的日志永远不采样 —— 出错信息一条都不能丢
      if (record.level >= threshold || Math.random() < sampleRate) {
        kept += 1;
        inner.write(record);
      } else {
        dropped += 1;
      }
    },
  };
}

/**
 * 创建日志器。
 * 使用方式：const log = createLogger({ level:'info', base:{ service:'order-api' } })
 */
function createLogger({
  level = 'info',
  base = {},
  transports = [stdoutTransport()],
  redactPaths = [],
} = {}) {
  const currentLevel = LEVELS[level] ?? LEVELS.info;

  /** 核心：组装一条记录并交给所有传输层 */
  function emit(levelName, bindings, args) {
    if (LEVELS[levelName] < currentLevel) return null; // 级别过滤，尽早返回，省掉序列化开销

    // 参数规整：支持 log.info('msg') / log.info({a:1}, 'msg') / log.info(obj)
    let msg = '';
    let data = {};
    for (const arg of args) {
      if (typeof arg === 'string') msg = arg;
      else if (arg && typeof arg === 'object') data = { ...data, ...serializeValue(arg) };
    }

    const record = {
      level: LEVELS[levelName],
      levelName,
      time: new Date().toISOString(),
      pid: process.pid,
      ...base,
      ...bindings,
      ...data,
      msg,
    };

    const redacted = redactValue(record, redactPaths);
    for (const transport of transports) transport.write(redacted);
    return redacted;
  }

  const logger = {
    level: level,
    /**
     * 子日志器：派生一个新的 logger，绑定字段**累加**。
     * 这是结构化日志最重要的一个 API —— 一次请求创建一个 child，
     * 之后这条链路上所有日志都自动带上 requestId，不用每行手动传。
     */
    child(bindings = {}) {
      return createLogger({
        level, // 子日志器继承父级别（也可单独覆盖）
        base: { ...base, ...bindings },
        transports,
        redactPaths,
      });
    },
    /** 动态调级：线上临时把级别降到 debug 排查问题，不用重启（pino 也是这样） */
    setLevel(newLevel) {
      logger.level = newLevel;
      return createLogger({ level: newLevel, base, transports, redactPaths });
    },
  };

  for (const levelName of ['trace', 'debug', 'info', 'warn', 'error', 'fatal']) {
    logger[levelName] = (...args) => emit(levelName, {}, args);
  }

  return logger;
}

// --- 2.1 最小可用：JSON 输出 ---
const memTransport = memoryTransport();
const log = createLogger({
  level: 'debug',
  base: { service: 'order-api', env: 'prod', version: '1.4.2' },
  transports: [memTransport, stdoutTransport({ pretty: true })],
  redactPaths: ['password', 'token', 'headers.authorization', 'user.idCard'],
});

log.info('服务启动完成');
log.debug({ port: 3000 }, '正在监听端口');
log.warn({ queueDepth: 812 }, '消息队列积压');

const firstRecord = memTransport.records[0];
console.log('  ↑ 上面那行 warn 的原始 JSON 记录（采集端看到的就是这个）：');
console.log('    ' + JSON.stringify(memTransport.records[2]));
assert.equal(firstRecord.service, 'order-api');
assert.equal(firstRecord.level, 30);
assert.ok(typeof firstRecord.time === 'string');
console.log('  可以看到：service / env / version / pid / time / level 都是**独立字段**，可被索引。');

// --- 2.2 级别过滤 ---
console.log('\n  [级别过滤]');
const warnOnly = createLogger({ level: 'warn', transports: [stdoutTransport({ pretty: true })] });
warnOnly.debug('这行不会出现');
warnOnly.info('这行也不会出现');
warnOnly.warn('只有 warn 及以上才会输出');
warnOnly.error('error 当然会输出');
assert.equal(memTransport.records.filter((r) => r.msg === '这行不会出现').length, 0);

// --- 2.3 Error 序列化 ---
console.log('\n  [Error 序列化：JSON.stringify(err) 是 {}，必须自己转]');
const dbErr = new Error('connect ECONNREFUSED 10.0.0.7:5432');
dbErr.code = 'ECONNREFUSED';
dbErr.cause = new Error('socket hang up');
log.error({ err: dbErr, retryCount: 3 }, '数据库连接失败');
const errRecord = memTransport.records.at(-1);
assert.equal(errRecord.err.type, 'Error');
assert.equal(errRecord.err.code, 'ECONNREFUSED');
assert.ok(errRecord.err.stack.includes('ECONNREFUSED'), 'stack 必须保留');
assert.equal(errRecord.err.cause.message, 'socket hang up', 'cause 链也要保留');
console.log('  记录里的 err 字段：type / message / code / stack / cause 全都在。');

// --- 2.4 脱敏 ---
console.log('\n  [脱敏：按路径自动替换，不依赖"人工记得别打"]');
log.info(
  {
    user: { id: 42, name: '张三', idCard: '110101199001011234' },
    password: 'hunter2',
    headers: { authorization: 'Bearer eyJhbGciOi...', 'content-type': 'application/json' },
  },
  '用户登录成功',
);
const redactedRecord = memTransport.records.at(-1);
assert.equal(redactedRecord.password, '[REDACTED]');
assert.equal(redactedRecord.headers.authorization, '[REDACTED]');
assert.equal(redactedRecord.user.idCard, '[REDACTED]');
assert.equal(redactedRecord.user.name, '张三', '非敏感字段不能被误伤');
assert.equal(redactedRecord.headers['content-type'], 'application/json');
console.log('  password / headers.authorization / user.idCard 已替换为 [REDACTED]，其余字段原样保留。');

// --- 2.5 循环引用不会把进程写崩 ---
const circular = { name: 'node-a' };
circular.self = circular;
log.info({ graph: circular }, '循环引用安全测试');
assert.equal(memTransport.records.at(-1).graph.self, '[Circular]');
console.log('  [循环引用] 已妥善处理为 "[Circular]"，日志代码不会反过来搞崩进程。');

// ===========================================================================
// 3. 真实场景：用 child() 把一次请求的所有日志串起来
// ===========================================================================

console.log('\n--- 3. 真实场景：requestId 上下文与子日志器 ---');

const requestLogs = memoryTransport();
const appLog = createLogger({
  level: 'debug', // 线上排障时通常会临时降到 debug，这里为了展示完整链路直接开 debug
  base: { service: 'order-api', env: 'prod' },
  transports: [requestLogs],
  redactPaths: ['password', 'token'],
});

// 模拟三个并发请求交错执行。若用 console.log，三者的日志会混成一团；
// 有了 requestId，采集端一条查询就能还原任意一个请求的完整链路。
let requestSeq = 0;

async function handleCreateOrder({ userId, sku, qty, token }) {
  const requestId = `req-${(++requestSeq).toString(16).padStart(4, '0')}`;
  // 关键一步：派生一个绑定了 requestId 的子日志器。
  // 注意 token 也一起绑进来了 —— 之后这个请求的**每一条**日志都会自动带上它，
  // 而脱敏是在最外层统一做的，所以绑进来的敏感字段一样会被自动抹掉。
  const rlog = appLog.child({ requestId, userId, token });
  const startedAt = Date.now();

  rlog.info({ sku, qty }, '收到下单请求');

  await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 8)));
  rlog.debug({ sku, remain: 7 }, '库存充足，开始扣减');

  if (qty > 5) {
    rlog.warn({ sku, qty, remain: 7 }, '库存不足，下单被拒');
    return { requestId, ok: false, reason: 'INSUFFICIENT_STOCK' };
  }

  const costMs = Date.now() - startedAt;
  rlog.info({ orderId: `ORD-${requestId.slice(4)}`, costMs }, '订单创建成功');
  return { requestId, ok: true, costMs };
}

const results = await Promise.all([
  handleCreateOrder({ userId: 101, sku: 'SKU-A', qty: 2, token: 'tok_alice' }),
  handleCreateOrder({ userId: 202, sku: 'SKU-B', qty: 9, token: 'tok_bob' }),
  handleCreateOrder({ userId: 303, sku: 'SKU-A', qty: 1, token: 'tok_carol' }),
]);

console.log('  三个并发请求的日志（全部写进了内存 transport）：');
for (const r of requestLogs.records) {
  console.log(
    `    ${r.requestId}  ${r.levelName.toUpperCase().padEnd(5)} ${r.msg}` +
      (r.sku ? `  sku=${r.sku}` : '') +
      (r.orderId ? `  orderId=${r.orderId}` : ''),
  );
}

// 演示"按 requestId 捞日志" —— 这就是结构化日志的杀手锏
const targetId = results[1].requestId;
const chain = requestLogs.records.filter((r) => r.requestId === targetId);
console.log(`\n  按 requestId="${targetId}" 过滤，一次拿到该请求的完整链路（${chain.length} 条）：`);
for (const r of chain) console.log(`    ${JSON.stringify(r)}`);

assert.equal(chain.length, 3, '被拒的请求应该有 3 条日志');
assert.ok(chain.every((r) => r.userId === 202), '上下文 userId 自动带上了');
assert.ok(
  requestLogs.records.every((r) => r.token === '[REDACTED]'),
  'token 必须在所有日志里都被脱敏',
);
console.log('  注意：token 字段自动被脱敏，userId 自动带上，全程没有手写过一个拼接字符串。');

// 统计：采集端能做的聚合，console.log 的纯文本做不到
const byLevel = {};
for (const r of requestLogs.records) byLevel[r.levelName] = (byLevel[r.levelName] ?? 0) + 1;
console.log(`  按级别聚合（可直接做成监控指标）：${JSON.stringify(byLevel)}`);
assert.equal(byLevel.info, 5, '3 条"收到下单请求" + 2 条"订单创建成功"');
assert.equal(byLevel.warn, 1);
assert.equal(byLevel.debug, 3);

// ===========================================================================
// 4. 采样传输层：让高频日志不再烧钱
// ===========================================================================

console.log('\n--- 4. 采样：debug 日志按 1% 留，warn 以上 100% 留 ---');

const sampledMemory = memoryTransport();
const sampler = samplingTransport(sampledMemory, { sampleRate: 0.01, alwaysKeepAtOrAbove: 'warn' });
const sampledLogger = createLogger({ level: 'debug', transports: [sampler] });

for (let i = 0; i < 2000; i++) {
  sampledLogger.debug({ i }, '高频调试日志'); // 只想在需要时看到，不该全量落盘
}
for (let i = 0; i < 5; i++) {
  sampledLogger.warn({ attempt: i }, '重试中'); // 出错信息，一条都不能丢
}

const stats = sampler.stats();
console.log(`  debug 写了 2000 条 → 实际保留 ${stats.kept - 5} 条（约 1%）`);
console.log(`  warn  写了    5 条 → 实际保留 5 条（100%）`);
console.log(`  总共丢弃 ${stats.dropped} 条，日志量下降 ${((stats.dropped / 2000) * 100).toFixed(1)}%`);
assert.ok(stats.kept < 200, '采样应大幅减少日志量');
assert.ok(
  sampledMemory.records.filter((r) => r.levelName === 'warn').length === 5,
  'warn 不能被采样丢弃',
);

// ===========================================================================
// 5. 迁移到真实日志库时，你该关心什么
// ===========================================================================

console.log('\n--- 5. 横向对比：pino / winston / consola ---');
console.log('  （本仓库没有安装这三个库，以下为离线对比，不 import、不访问外网）');

const libs = [
  {
    name: 'pino',
    positioning: '极致性能的结构化 JSON 日志器，Node 生产环境事实标准',
    perf: '⭐ 最快。核心只做 JSON 字符串拼接，不格式化、不做字符串模板；',
    perf2: '   序列化有缓存与 fast-json-stringify 思路；传输跑在 worker 线程（pino.transport）',
    perf3: '   或用 pino/file 直接写 fd，主线程几乎零开销。',
    size: '核心极小（无依赖），但生态要装 pino-pretty / pino-http / pino-roll 等配套',
    output: '默认纯 JSON 单行（newline-delimited JSON），天生适配 Loki/ES/CloudWatch',
    scenario: '高并发服务端、Serverless、K8s 微服务；已经或准备接入日志采集平台',
    note: '开箱"不好看"，必须配 pino-pretty 才能在本地开发时友好显示，这是新手最常抱怨的点',
  },
  {
    name: 'winston',
    positioning: '最"重"也最灵活的日志框架：logger + format + transport 三大抽象',
    perf: '⭐ 中等。默认走多个可组合的 format 管道，每条日志要串行过一遍转换函数',
    perf2: '   ；相比 pino 慢一个数量级左右，但绝大多数业务场景够用。',
    perf3: '',
    size: '较大，自带多种 transport（console/file/http/stream），也有 logrotate 类方案',
    output: '格式自由：JSON、着色文本、自定义 format 都能拼，可同时输出到多个目的地',
    scenario: '需要"日志同时写文件+控制台+告警 webhook"、格式高度定制、或团队已在用的老项目',
    note: 'API 偏重，配置样板多；对 ts 类型支持一般，v3 后改善',
  },
  {
    name: 'consola',
    positioning: '面向"人"的漂亮日志器，主打 CLI 工具与开发期 DX',
    perf: '⭐ 较慢：默认带图标、颜色、缩进、格式化，为可读性牺牲性能',
    perf2: '   ，不适合高频生产日志。',
    perf3: '',
    size: '小巧，零依赖（本仓库 07_chalk_terminal_colors.js 展示了它常用的着色能力）',
    output: '彩色 + 图标 + 分组缩进，可自定义 reporter 切换成 JSON 交给采集端',
    scenario: 'CLI 工具、构建脚本、脚手架、本地开发服务；不适合高 QPS 生产服务',
    note: '它的定位其实是"更好的 console"，而不是"生产日志基础设施"',
  },
];

for (const lib of libs) {
  console.log(`\n  ● ${lib.name} —— ${lib.positioning}`);
  console.log(`      性能：${lib.perf}`);
  if (lib.perf2) console.log(`      ${lib.perf2}`);
  if (lib.perf3) console.log(`      ${lib.perf3}`);
  console.log(`      体积：${lib.size}`);
  console.log(`      默认输出：${lib.output}`);
  console.log(`      适用场景：${lib.scenario}`);
  console.log(`      注意：${lib.note}`);
}

console.log('\n  一句话选型：');
console.log('    · 生产服务端、要进采集平台、在意性能  → pino（本示例的手写版就是它的迷你实现）');
console.log('    · 要同时写多个目的地、格式必须高度定制 → winston');
console.log('    · CLI / 开发期人看的日志              → consola');
console.log('    · 只是一个 20 行的脚本                 → console.log，别过度设计');
console.log('  关键认知：这三个库的**API 长得几乎一样**（log.info / logger.child / level），');
console.log('  因为结构化日志的接口已经收敛了。所以先用本文件这种薄封装包一层，');
console.log('  未来换库只改一个工厂函数，业务代码一行不动。');

// ===========================================================================
// 6. 生产日志清单
// ===========================================================================

console.log('\n--- 6. 生产日志检查清单 ---');

const checklist = [
  '每条日志都是单行 JSON，包含 time / level / msg 三个必备字段',
  '所有日志带 service、env、version，多服务混在一起也能区分来源',
  '每个请求/任务用 child() 绑定 requestId（或 traceId），可整链路还原',
  'Error 必须序列化 message + stack + code + cause，绝不只打 message',
  '密码 / token / 身份证 / 银行卡按**路径**自动脱敏，不靠人自觉',
  '日志写 stdout（12-factor），由采集 agent 异步收走，不在业务进程里同步写文件',
  '高频 debug 日志采样或聚合，warn 及以上全量保留',
  '级别可运行时动态调整，线上排障不用重启',
  '严禁在循环里逐条打日志，改为"共 N 条 / 失败 M 条"的汇总日志',
  '日志内容不参与业务逻辑判断（日志系统挂了业务要照常跑）',
];

checklist.forEach((item, i) => console.log(`  ${String(i + 1).padStart(2, ' ')}. [ ] ${item}`));

console.log('\n  最后一句：日志的价值不在于"写了多少"，而在于"出事时能不能 30 秒内定位"。');
console.log('  判断标准很简单 —— 凌晨三点被叫起来，你能不能只靠日志还原出问题请求的完整链路。');

console.log('\n完成：结构化日志器（级别 / 子日志器 / 脱敏 / 采样 / 可插拔 transport）演示结束，退出码 0。');
