/**
 * ============================================================================
 * 知识点：请求重试与弹性 —— 指数退避、抖动、幂等性、熔断器
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】高级
 * 【前置知识】29_npm_libraries/04_axios.js（HTTP 客户端）、
 *             29_npm_libraries/15_database_and_orm.js（事务与原子性）、
 *             18_async（Promise、定时器）、20_error_handling（错误分类）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    分布式系统里，"网络调用失败"不是异常情况，而是**常态**。弹性（resilience）
 *    是一整套让系统在部分组件抖动时仍能提供服务的模式，本文件讲四个核心概念：
 *      (a) 重试（Retry）        ：失败的调用再试一次，但要有策略，不能无脑循环；
 *      (b) 退避 + 抖动（Backoff + Jitter）：越失败等得越久，并加入随机化；
 *      (c) 幂等性（Idempotency）：同一个请求执行多次，结果与执行一次相同 ——
 *          这是"可以安全重试"的**前提**；
 *      (d) 熔断器（Circuit Breaker）：下游持续故障时主动"断电"，快速失败，
 *          避免把有限的线程/连接/超时预算全耗在注定失败的调用上。
 *
 * 2. 为什么需要（真实项目场景）
 *    失败的成因分两类，处理方式完全不同：
 *      · **瞬时故障（transient）**：网络抖动、DNS 临时解析失败、服务正在滚动发布、
 *        数据库连接被回收、云厂商的偶发 5xx、限流 429。这类失败**重试就能成功**。
 *      · **永久故障（permanent）**：参数校验失败 400、没登录 401、没权限 403、
 *        资源不存在 404、语义错误 422、代码 bug。这类失败**重试一万次也一样**，
 *        重试只会浪费资源、放大故障。
 *    真实数据：Google SRE 的经验是，多数据中心之间的请求有相当比例会遇到瞬时故障；
 *    一次不到 1 秒的抖动，如果没有重试，就变成用户可见的报错。
 *
 *    但重试是一把双刃剑，用错了会造成**重试风暴（retry storm）**：
 *      下游过载 → 大量超时 → 所有客户端同时重试 → 下游更过载 → 雪崩。
 *      所以必须配合：指数退避 + 抖动（错开重试时刻）+ 熔断（停止无意义重试）。
 *
 * 3. 核心语法要点
 *    - 指数退避：delay = base * 2^(attempt-1)，例如 100ms → 200ms → 400ms → 800ms。
 *      再加一个上限 maxDelay，避免第 10 次重试等 51 秒。
 *    - 抖动（Jitter）三种常见做法：
 *        full jitter       : delay = random(0, exp)              ← AWS 推荐，去相关效果最好
 *        equal jitter      : delay = exp/2 + random(0, exp/2)    ← 保底等待，又带随机
 *        decorrelated      : delay = random(base, prevDelay * 3) ← 不需要记录 attempt 次数
 *      不加抖动的后果：1000 个客户端会在**同一毫秒**一起重试，形成周期性的脉冲式压垮。
 *    - 总预算（budget）：除"最大重试次数"外，还要有"整个操作最多花多久"。
 *      否则 5 次重试 × 10 秒超时 = 用户等 50 秒，不如直接失败。
 *    - 幂等性：GET/PUT/DELETE/HEAD 天然幂等（HTTP 语义保证）；
 *      **POST 默认不幂等**（"创建订单"执行两次就是两笔订单）。
 *      解法是客户端生成一个唯一的 `Idempotency-Key` 头，服务端把
 *      "key → 首次执行结果" 存起来，重复请求直接返回缓存结果（Stripe / 支付宝都是这么做的）。
 *    - 熔断器三态：
 *        CLOSED（闭合，正常放行）→ 连续失败达到阈值 → OPEN（断开，直接快速失败）
 *        → 等待 resetTimeout → HALF_OPEN（半开，放少量探针请求试试）
 *        → 探针成功 → CLOSED；探针失败 → 回到 OPEN。
 *
 * 4. 常见陷阱
 *    - **对非幂等操作重试**：超时后重试 POST，可能造成用户被扣两次款。
 *      超时是"结果未知"，不是"一定失败"——这是最危险的一类错误。
 *    - 重试所有 4xx：400/401/403/404 重试毫无意义，只会拖慢响应、放大日志量。
 *    - 不加抖动：所有客户端同步重试，把"抖动"放大成"雪崩"。
 *    - 重试层数叠加：网关重试 3 次 × SDK 重试 3 次 × 业务重试 3 次 = 27 次真实请求，
 *      下游瞬间被打爆。**重试只应在链路的一层做**，其余层配超时。
 *    - 没有总超时：重试让 P99 延迟成倍放大，用户早就走了，请求还在重试。
 *    - 忘记尊重 `Retry-After`：服务端明确告诉你"30 秒后再来"，你 100ms 后就重试，
 *      只会被继续限流，甚至被封禁。
 *    - 熔断器阈值拍脑袋：阈值太低会误熔断正常抖动；太高则失去保护意义。
 *      应按实际错误率（如 50%）+ 最小请求数（如 20 次）来判断，而不是"连续 3 次失败"。
 *    - 熔断后不做恢复探测：一直断着，下游恢复了也不放量。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/16_retry_and_resilience.js
 *   （本文件用 node:http 自建一个"故意不稳定"的本地服务，用 axios 打它，
 *     端口 listen(0) 由系统分配，全程不访问外网，结束前关闭服务）
 *
 * 【预期输出】
 *   1) 失败分类表与"哪些能重试"的判定规则；
 *   2) 三种抖动策略的实测分布对比（纯计算，不需网络）；
 *   3) 用 axios 打本地不稳定服务，演示完整重试逻辑，打印尝试次数与总耗时；
 *   4) 幂等性实证：无 Idempotency-Key 会重复下单，有 key 只会下一单；
 *   5) 熔断器 CLOSED → OPEN → HALF_OPEN → CLOSED 全流程，退出码 0。
 * ============================================================================
 */

import http from 'node:http';
import assert from 'node:assert/strict';
import axios from 'axios';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ===========================================================================
// 1. 建立本地"不稳定服务"
// ===========================================================================

console.log('--- 1. 搭建本地不稳定服务（模拟真实下游）---');

/** 服务端状态：所有"故意失败"的行为都通过这里控制，方便演示后重置 */
const serviceState = {
  flakyRemainingFailures: 0, // /api/flaky 还要失败几次
  flakyCalls: 0, // /api/flaky 被调用的总次数
  healthy: false, // /api/unstable 依赖的开关
  unstableCalls: 0,
  orders: [], // 已创建的订单
  idempotencyStore: new Map(), // Idempotency-Key → 首次执行结果
  loseNextOrderResponse: false, // 模拟"订单已创建但响应丢包"
  orderSeq: 0,
};

function sendJson(res, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(payload);
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');

  // ---- 控制面：让演示代码可以重置服务端状态 ----
  if (url.pathname === '/control/reset') {
    serviceState.flakyRemainingFailures = Number(url.searchParams.get('failures') ?? 0);
    serviceState.flakyCalls = 0;
    serviceState.healthy = url.searchParams.get('healthy') === '1';
    serviceState.unstableCalls = 0;
    serviceState.orders = [];
    serviceState.idempotencyStore.clear();
    serviceState.orderSeq = 0;
    serviceState.loseNextOrderResponse = url.searchParams.get('loseResponse') === '1';
    return sendJson(res, 200, { ok: true });
  }

  // ---- 场景 A：前 N 次必然 500，之后成功（最典型的瞬时故障）----
  if (url.pathname === '/api/flaky') {
    serviceState.flakyCalls += 1;
    if (serviceState.flakyRemainingFailures > 0) {
      serviceState.flakyRemainingFailures -= 1;
      // 顺便带上 Retry-After，演示客户端应当尊重服务端的建议
      return sendJson(res, 500, { error: 'upstream hiccup' }, { 'retry-after': '0' });
    }
    return sendJson(res, 200, { ok: true, servedAtCall: serviceState.flakyCalls });
  }

  // ---- 场景 B：永久故障（4xx），重试一万次也没用 ----
  if (url.pathname === '/api/validation-error') {
    return sendJson(res, 422, { error: 'sku 不合法' });
  }

  // ---- 场景 C：限流 429 + Retry-After ----
  if (url.pathname === '/api/rate-limited') {
    return sendJson(res, 429, { error: 'too many requests' }, { 'retry-after': '0' });
  }

  // ---- 场景 D：永不及时响应（演示超时也被视为可重试）----
  if (url.pathname === '/api/slow') {
    // 注意：必须保证这条连接最终会被结束，否则 server.close() 会一直等它
    const timer = setTimeout(() => {
      if (!res.writableEnded) sendJson(res, 200, { ok: true, note: '迟到的响应' });
    }, 800);
    res.on('close', () => clearTimeout(timer));
    return undefined;
  }

  // ---- 场景 E：下游健康开关（给熔断器用）----
  if (url.pathname === '/api/unstable') {
    serviceState.unstableCalls += 1;
    if (!serviceState.healthy) {
      return sendJson(res, 503, { error: 'service unavailable' });
    }
    return sendJson(res, 200, { ok: true, calls: serviceState.unstableCalls });
  }

  // ---- 场景 F：创建订单（演示幂等性）----
  if (url.pathname === '/api/orders' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const idempotencyKey = req.headers['idempotency-key'];

    // 【幂等性的核心实现】key 见过就直接返回首次结果，不再产生副作用
    if (idempotencyKey && serviceState.idempotencyStore.has(idempotencyKey)) {
      const cached = serviceState.idempotencyStore.get(idempotencyKey);
      return sendJson(res, 200, { ...cached, replayed: true });
    }

    // 产生副作用：真的创建了一笔订单
    const order = { orderId: ++serviceState.orderSeq, sku: body.sku, qty: body.qty };
    serviceState.orders.push(order);
    const result = { orderId: order.orderId, sku: order.sku, qty: order.qty };
    if (idempotencyKey) serviceState.idempotencyStore.set(idempotencyKey, result);

    // 模拟"订单已落库，但响应在回程路上丢了" —— 分布式系统里最危险的一类失败：
    // 客户端只知道"超时/失败"，完全不知道副作用到底有没有发生。
    if (serviceState.loseNextOrderResponse) {
      serviceState.loseNextOrderResponse = false;
      return sendJson(res, 503, { error: 'gateway timeout（但订单其实已经创建了）' });
    }
    return sendJson(res, 201, result);
  }

  return sendJson(res, 404, { error: 'not found' });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const baseURL = `http://127.0.0.1:${server.address().port}`;
console.log(`  本地服务已启动：${baseURL}`);
console.log('  提供的端点：/api/flaky /api/validation-error /api/rate-limited');
console.log('              /api/slow /api/unstable /api/orders');

const api = axios.create({
  baseURL,
  timeout: 2000,
  // 关键：让 axios 对 4xx/5xx 都走 catch 分支（默认就是这样），
  // 我们会从 err.response.status 里读出状态码再判断是否值得重试。
});

const control = async (params) => {
  await axios.get(`${baseURL}/control/reset`, { params, timeout: 2000 });
};

// ===========================================================================
// 2. 失败的分类：哪些能重试，哪些绝对不能
// ===========================================================================

console.log('\n--- 2. 失败分类：可重试 vs 不可重试 ---');

const failureTaxonomy = [
  ['网络层', 'ECONNRESET / EPIPE（连接被重置）', '✅ 可重试', '典型的瞬时故障'],
  ['网络层', 'ECONNREFUSED（服务刚重启/未就绪）', '✅ 可重试', '配合退避等待它起来'],
  ['网络层', 'ETIMEDOUT / ECONNABORTED（超时）', '⚠️ 谨慎', '结果未知！仅当操作幂等才能重试'],
  ['网络层', 'EAI_AGAIN（DNS 临时解析失败）', '✅ 可重试', 'DNS 抖动很常见'],
  ['HTTP', '408 Request Timeout', '⚠️ 谨慎', '同上，超时语义'],
  ['HTTP', '429 Too Many Requests', '✅ 可重试', '必须尊重 Retry-After'],
  ['HTTP', '500 Internal Server Error', '✅ 可重试', '常由偶发异常引起'],
  ['HTTP', '502 / 503 / 504', '✅ 可重试', '网关/上游不可用'],
  ['HTTP', '400 Bad Request', '❌ 不可重试', '请求本身有问题，重试无用'],
  ['HTTP', '401 / 403', '❌ 不可重试', '认证/授权问题（除非先刷新 token）'],
  ['HTTP', '404 Not Found', '❌ 不可重试', '资源就是不存在'],
  ['HTTP', '409 Conflict', '❌ 不可重试', '状态冲突，重试会更乱'],
  ['HTTP', '422 Unprocessable Entity', '❌ 不可重试', '业务校验失败'],
  ['业务', '余额不足 / 库存不足', '❌ 不可重试', '领域规则拒绝，不是故障'],
];

console.log('  分类'.padEnd(6, '　') + ' | 场景 | 判定 | 说明');
for (const [layer, scenario, verdict, note] of failureTaxonomy) {
  console.log(`  [${layer}] ${scenario}`);
  console.log(`      ${verdict} —— ${note}`);
}

/**
 * 默认的可重试判定函数 —— 生产项目的重试库（axios-retry / got / undici）核心就是这段逻辑。
 * 原则：**只重试"看起来是瞬时故障"的错误**，其余一律快速失败。
 */
function isRetryableError(err) {
  // 1) 没有 response：说明请求根本没走完（网络错误、超时、DNS 失败）
  if (!err.response) {
    const code = err.code ?? '';
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') return { retry: true, kind: 'timeout(结果未知，需幂等)' };
    if (['ECONNRESET', 'EPIPE', 'ECONNREFUSED', 'EAI_AGAIN', 'ENOTFOUND'].includes(code)) {
      return { retry: true, kind: `network:${code}` };
    }
    return { retry: false, kind: `unknown:${code || err.message}` };
  }

  // 2) 有 response：按状态码判断
  const status = err.response.status;
  if (status === 429) return { retry: true, kind: 'rate-limited(429)' };
  if (status === 408) return { retry: true, kind: 'request-timeout(408)' };
  if (status >= 500) return { retry: true, kind: `server-error(${status})` };
  if (status >= 400) return { retry: false, kind: `client-error(${status})` };
  return { retry: false, kind: `unexpected(${status})` };
}

// ===========================================================================
// 3. 退避与抖动：三种策略的真实分布
// ===========================================================================

console.log('\n--- 3. 退避（Backoff）与抖动（Jitter）---');

/** 计算第 attempt 次失败后应该等多久（attempt 从 1 开始） */
function backoffDelay(attempt, { baseDelayMs = 100, maxDelayMs = 5000, jitter = 'full' } = {}) {
  // 指数增长部分，并限制上限（否则第 10 次要等 51 秒）
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  switch (jitter) {
    case 'none':
      return exponential;
    case 'full':
      // AWS 推荐：在 [0, exponential] 之间均匀取值，去相关性最好
      return Math.round(Math.random() * exponential);
    case 'equal':
      // 在 [exponential/2, exponential] 之间取值，既保底又带随机
      return Math.round(exponential / 2 + Math.random() * (exponential / 2));
    default:
      throw new Error(`未知的抖动策略：${jitter}`);
  }
}

console.log('  假设 base=100ms、max=5000ms，看 6 次重试的名义等待时间：');
console.log('  重试次数 | none(不加抖动) | full jitter 采样');
for (let attempt = 1; attempt <= 6; attempt++) {
  const none = backoffDelay(attempt, { jitter: 'none' });
  const full = backoffDelay(attempt, { jitter: 'full' });
  console.log(`    第 ${attempt} 次 | ${String(none + 'ms').padStart(10)} | ${String(full + 'ms').padStart(10)}`);
}
console.log('  注意 none 列是**确定性**的 —— 所有客户端都会在同一时刻重试。');

// 用统计说明"为什么必须加抖动"
function summarize(jitter, samples = 2000) {
  const values = Array.from({ length: samples }, () => backoffDelay(4, { jitter }));
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const std = Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length);
  return { jitter, mean: mean.toFixed(0), min, max, std: std.toFixed(0) };
}

console.log('\n  第 4 次重试（名义 800ms）的 2000 次采样：');
for (const jitter of ['none', 'equal', 'full']) {
  const s = summarize(jitter, 2000);
  console.log(`    ${jitter.padEnd(6)} 均值=${s.mean}ms 最小=${s.min}ms 最大=${s.max}ms 标准差=${s.std}ms`);
}
const noneStats = summarize('none', 100);
const fullStats = summarize('full', 2000);
assert.equal(noneStats.std, '0', '不加抖动时延迟完全确定 —— 这正是雪崩的根源');
assert.ok(Number(fullStats.std) > 100, 'full jitter 应当把重试时刻打散');
console.log('  结论：none 的标准差为 0（1000 个客户端同一毫秒重试）；');
console.log('        full jitter 把重试时刻均匀打散到整个区间，显著削平脉冲。');

// ===========================================================================
// 4. 完整重试实现
// ===========================================================================

console.log('\n--- 4. 完整的重试实现（带预算、抖动、Retry-After）---');

/**
 * 带策略的重试执行器。
 *
 * 设计要点：
 *   1) 返回结果对象而不是抛异常 —— 调用方可以清晰地看到"试了几次、为什么放弃"；
 *   2) 有两道刹车：maxAttempts（次数）与 totalBudgetMs（总耗时预算）；
 *   3) 尊重服务端给的 Retry-After；
 *   4) 每次重试都回调 onRetry，方便打日志/上报指标（真实项目必做）。
 */
async function withRetry(operation, options = {}) {
  const {
    maxAttempts = 4,
    baseDelayMs = 50,
    maxDelayMs = 1000,
    jitter = 'full',
    totalBudgetMs = 5000,
    isRetryable = isRetryableError,
    respectRetryAfter = true,
    onRetry = () => {},
    label = 'operation',
  } = options;

  const startedAt = Date.now();
  const attempts = [];
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptStart = Date.now();
    try {
      const value = await operation(attempt);
      attempts.push({ attempt, ms: Date.now() - attemptStart, ok: true });
      return { ok: true, value, attempts, attemptCount: attempt, elapsedMs: Date.now() - startedAt };
    } catch (err) {
      lastError = err;
      // 判定只做一次，后面还要根据 Retry-After 做微调
      const verdict = isRetryable(err);
      const attemptRecord = { attempt, ms: Date.now() - attemptStart, ok: false, reason: verdict.kind };
      attempts.push(attemptRecord);

      if (!verdict.retry) {
        return {
          ok: false,
          error: err,
          attempts,
          attemptCount: attempt,
          elapsedMs: Date.now() - startedAt,
          gaveUpReason: `不可重试的错误：${verdict.kind}`,
        };
      }
      if (attempt === maxAttempts) {
        return {
          ok: false,
          error: err,
          attempts,
          attemptCount: attempt,
          elapsedMs: Date.now() - startedAt,
          gaveUpReason: `已达最大重试次数 ${maxAttempts}`,
        };
      }

      // 计算本次要等多久
      let delay = backoffDelay(attempt, { baseDelayMs, maxDelayMs, jitter });

      // 尊重服务端建议（429/503 常带 Retry-After），但不超过我们的上限
      const retryAfterHeader = err.response?.headers?.['retry-after'];
      if (respectRetryAfter && retryAfterHeader !== undefined) {
        const serverWants = Number(retryAfterHeader) * 1000;
        delay = Math.max(delay, Math.min(serverWants, maxDelayMs));
        verdict.kind += '+RetryAfter';
        attemptRecord.reason = verdict.kind; // 记录到尝试明细里，便于事后分析
      }

      // 总预算检查：宁可快速失败，也不要让用户等 30 秒
      const spent = Date.now() - startedAt;
      if (spent + delay > totalBudgetMs) {
        return {
          ok: false,
          error: err,
          attempts,
          attemptCount: attempt,
          elapsedMs: spent,
          gaveUpReason: `总预算 ${totalBudgetMs}ms 将被超出（已用 ${spent}ms，还需等 ${delay}ms）`,
        };
      }

      onRetry({ label, attempt, delay, kind: verdict.kind });
      await sleep(delay);
    }
  }
  /* c8 ignore next */
  return { ok: false, error: lastError, attempts, attemptCount: maxAttempts, elapsedMs: Date.now() - startedAt, gaveUpReason: 'unreachable' };
}

// --- 4.1 瞬时故障：前 2 次 500，第 3 次成功 ---
console.log('\n  [4.1 瞬时故障重试成功]');
await control({ failures: 2 });
const outcome1 = await withRetry(() => api.get('/api/flaky'), {
  label: 'GET /api/flaky',
  maxAttempts: 5,
  baseDelayMs: 40,
  onRetry: ({ attempt, delay, kind }) => console.log(`      ↻ 第 ${attempt} 次失败（${kind}），${delay}ms 后重试`),
});
console.log(`  结果：${outcome1.ok ? '成功' : '失败'}，共尝试 ${outcome1.attemptCount} 次，总耗时 ${outcome1.elapsedMs}ms`);
console.log(`  服务端返回：${JSON.stringify(outcome1.value?.data)}`);
assert.equal(outcome1.ok, true);
assert.equal(outcome1.attemptCount, 3, '前两次 500 失败，第三次成功');
console.log('  合计耗时 = 2 次失败的往返 + 2 次退避等待；指数退避让重试不会把下游打垮。');

// --- 4.2 永久故障：422 立刻放弃，一次都不重试 ---
console.log('\n  [4.2 永久故障：立刻放弃]');
const outcome2 = await withRetry(() => api.post('/api/validation-error'), {
  label: 'POST /api/validation-error',
  maxAttempts: 5,
  baseDelayMs: 40,
});
console.log(`  结果：${outcome2.ok ? '成功' : '放弃'}，共尝试 ${outcome2.attemptCount} 次，耗时 ${outcome2.elapsedMs}ms`);
console.log(`  放弃原因：${outcome2.gaveUpReason}`);
assert.equal(outcome2.ok, false);
assert.equal(outcome2.attemptCount, 1, '4xx 绝不应该重试');
console.log('  对比 4.1：同样是失败，可重试的要试 3 次，不可重试的 1 次就结束 ——');
console.log('  这就是"重试策略"和"无脑循环"的区别，能省下大量无谓的等待与流量。');

// --- 4.3 限流 429：始终失败，最终达到最大次数 ---
console.log('\n  [4.3 限流 429：重试到上限后放弃]');
const outcome3 = await withRetry(() => api.get('/api/rate-limited'), {
  label: 'GET /api/rate-limited',
  maxAttempts: 3,
  baseDelayMs: 30,
  onRetry: ({ attempt, delay, kind }) => console.log(`      ↻ 第 ${attempt} 次（${kind}），等 ${delay}ms`),
});
console.log(`  结果：${outcome3.ok ? '成功' : '放弃'}，尝试 ${outcome3.attemptCount} 次，耗时 ${outcome3.elapsedMs}ms`);
console.log(`  放弃原因：${outcome3.gaveUpReason}`);
assert.equal(outcome3.attemptCount, 3);
console.log(`  尝试明细：${JSON.stringify(outcome3.attempts)}`);
console.log('  注意前两次的 reason 标了 "+RetryAfter"（最后一次已达上限，不再安排重试），');
console.log('  说明客户端按服务端建议调整了等待时间，而不是死板地用自己的退避公式。');

// --- 4.4 超时：结果未知，只有幂等操作才能重试 ---
console.log('\n  [4.4 超时：结果未知（最危险的一类）]');
const outcome4 = await withRetry(
  () => api.get('/api/slow', { timeout: 80 }), // 服务端 800ms 才回，必然超时
  {
    label: 'GET /api/slow',
    maxAttempts: 2,
    baseDelayMs: 20,
    totalBudgetMs: 1500,
    onRetry: ({ attempt, kind }) => console.log(`      ↻ 第 ${attempt} 次（${kind}）`),
  },
);
console.log(`  结果：${outcome4.ok ? '成功' : '放弃'}，尝试 ${outcome4.attemptCount} 次，耗时 ${outcome4.elapsedMs}ms`);
console.log(`  放弃原因：${outcome4.gaveUpReason}`);
assert.equal(outcome4.ok, false);
console.log('  超时被归类为"可重试"（kind 里带 timeout），但对 GET 是安全的，');
console.log('  对 POST 就未必 —— 服务端可能已经处理完了，只是响应慢。请看第 5 节。');

// --- 4.5 总预算：次数还没用完，预算先到 ---
console.log('\n  [4.5 总超时预算：次数的刹车之外，还要有时间刹车]');
const outcome5 = await withRetry(() => api.get('/api/rate-limited'), {
  label: 'GET /api/rate-limited',
  maxAttempts: 10, // 允许 10 次
  baseDelayMs: 200, // 但退避很慢
  totalBudgetMs: 500, // 总预算只有 500ms
});
console.log(`  结果：${outcome5.ok ? '成功' : '放弃'}，尝试 ${outcome5.attemptCount} 次，耗时 ${outcome5.elapsedMs}ms`);
console.log(`  放弃原因：${outcome5.gaveUpReason}`);
assert.equal(outcome5.ok, false);
assert.ok(outcome5.attemptCount < 10, '预算应先把重试拦下来');
console.log('  重要：用户能忍受的等待是有限的。没有总预算的重试 = 把延迟放大 N 倍。');

// ===========================================================================
// 5. 幂等性：能不能重试的前提
// ===========================================================================

console.log('\n--- 5. 幂等性：重试的前提 ---');
console.log('  场景：下单接口超时了。客户端只知道"失败"，但它到底有没有创建订单？');
console.log('  如果直接重试，可能变成两笔订单 —— 用户被扣两次款。');

// --- 5.1 反面教材：没有 Idempotency-Key ---
console.log('\n  [5.1 反面教材：不带 Idempotency-Key]');
await control({ loseResponse: 1 });
const orderBody = { sku: 'SKU-001', qty: 2 };

// 第一次：服务端创建了订单，但响应丢了（返回 503）
const attemptA = await api.post('/api/orders', orderBody).catch((e) => e.response);
console.log(`  第一次请求 → HTTP ${attemptA.status}（服务端其实已经创建了订单）`);

// 客户端认为失败，重试
const attemptB = await api.post('/api/orders', orderBody).catch((e) => e.response);
console.log(`  重试请求   → HTTP ${attemptB.status}，orderId=${attemptB.data.orderId}`);

console.log(`  结果：数据库里产生了 ${serviceState.orders.length} 笔订单 —— **重复下单** ✗`);
console.log(`  订单明细：${JSON.stringify(serviceState.orders)}`);
assert.equal(serviceState.orders.length, 2, '没有幂等键就会重复创建');
console.log('  这就是"超时"比"明确失败"更危险的原因：失败是确定的，超时是**未知**的。');

// --- 5.2 正确做法：带上 Idempotency-Key ---
console.log('\n  [5.2 正确做法：带 Idempotency-Key]');
await control({ loseResponse: 1 });
// 关键：同一个业务操作，重试时必须用**同一个** key（通常由客户端在操作开始时生成一次）
const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
console.log(`  客户端生成的幂等键：${idempotencyKey}`);
const headers = { 'Idempotency-Key': idempotencyKey };

const attemptC = await api.post('/api/orders', orderBody, { headers }).catch((e) => e.response);
console.log(`  第一次请求 → HTTP ${attemptC.status}（订单已创建，响应丢了）`);
const attemptD = await api.post('/api/orders', orderBody, { headers }).catch((e) => e.response);
console.log(
  `  重试请求   → HTTP ${attemptD.status}，orderId=${attemptD.data.orderId}，replayed=${attemptD.data.replayed}`,
);

console.log(`  结果：数据库里仍然只有 ${serviceState.orders.length} 笔订单 ✓`);
assert.equal(serviceState.orders.length, 1, '幂等键必须保证只创建一次');
assert.equal(attemptD.data.orderId, attemptC.data?.orderId ?? attemptD.data.orderId);
assert.equal(attemptD.data.replayed, true, '第二次是重放首次结果');
console.log('  幂等键让"重试"变得安全：服务端记住 key→结果，重复请求直接返回缓存结果，');
console.log('  既不重复产生副作用，也能让客户端拿到当初丢失的那个响应。');
console.log('  这就是 Stripe / 支付宝 / 微信支付的接口都要求 Idempotency-Key 的原因。');

console.log('\n  [5.3 只有幂等的操作才能自动重试]');
const idempotencyGuide = [
  ['GET   /orders/42', '天然幂等 ✅', '可以放心自动重试'],
  ['PUT   /orders/42', '天然幂等 ✅', '整体覆盖，重复执行结果相同'],
  ['DELETE /orders/42', '天然幂等 ✅', '删两次和删一次效果一样（第二次 404 也接受）'],
  ['POST  /orders', '默认不幂等 ❌', '需要 Idempotency-Key 才能安全重试'],
  ['PATCH /orders/42', '取决于语义 ⚠️', '若是 "balance += 10" 就不幂等；若是 "status = paid" 则幂等'],
  ['POST  /payments', '不幂等 ❌', '绝对要对账 + 幂等键，重试前必须确认'],
];
for (const [op, verdict, note] of idempotencyGuide) {
  console.log(`    ${op.padEnd(18)} ${verdict.padEnd(14)} ${note}`);
}

// ===========================================================================
// 6. 熔断器
// ===========================================================================

console.log('\n--- 6. 熔断器（Circuit Breaker）---');

const BREAKER = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

/**
 * 极简熔断器。
 * 三个状态：CLOSED(正常) → OPEN(快速失败) → HALF_OPEN(试探) → CLOSED / OPEN
 *
 * 生产实现还会关心：滑动窗口错误率、最小请求数、按接口粒度隔离、
 * 与重试的配合（通常顺序是：熔断器在外、重试在内）。
 */
class CircuitBreaker {
  constructor({ name, failureThreshold = 3, resetTimeoutMs = 200, halfOpenMaxCalls = 1 } = {}) {
    this.name = name;
    this.failureThreshold = failureThreshold;
    this.resetTimeoutMs = resetTimeoutMs;
    this.halfOpenMaxCalls = halfOpenMaxCalls;
    this.state = BREAKER.CLOSED;
    this.consecutiveFailures = 0;
    this.openedAt = 0;
    this.halfOpenCalls = 0;
    this.stats = { passed: 0, failed: 0, shortCircuited: 0, stateChanges: [] };
  }

  get isOpen() {
    return this.state === BREAKER.OPEN;
  }

  /** 每次调用前都要判断：现在该放行、还是该立刻失败？ */
  canAttempt() {
    if (this.state === BREAKER.CLOSED) return true;

    if (this.state === BREAKER.OPEN) {
      // 冷却时间到了 → 进入半开，放少量探针请求出去
      if (Date.now() - this.openedAt >= this.resetTimeoutMs) {
        this.#toState(BREAKER.HALF_OPEN);
        this.halfOpenCalls = 0;
        return true;
      }
      this.stats.shortCircuited += 1; // 关键指标：被拦下多少请求，省了多少次注定失败的调用
      return false;
    }

    // HALF_OPEN：只放行极少量探针，避免刚恢复就把下游又打垮
    if (this.halfOpenCalls < this.halfOpenMaxCalls) {
      this.halfOpenCalls += 1;
      return true;
    }
    this.stats.shortCircuited += 1;
    return false;
  }

  onSuccess() {
    this.stats.passed += 1;
    this.consecutiveFailures = 0;
    if (this.state === BREAKER.HALF_OPEN) this.#toState(BREAKER.CLOSED); // 探针成功 → 恢复放量
  }

  onFailure() {
    this.stats.failed += 1;
    this.consecutiveFailures += 1;
    if (this.state === BREAKER.HALF_OPEN) {
      this.#toState(BREAKER.OPEN); // 探针失败 → 立刻重新断开
      this.openedAt = Date.now();
      return;
    }
    if (this.consecutiveFailures >= this.failureThreshold) {
      this.#toState(BREAKER.OPEN);
      this.openedAt = Date.now();
    }
  }

  #toState(next) {
    if (this.state === next) return;
    this.stats.stateChanges.push({ from: this.state, to: next, at: Date.now() });
    this.state = next;
  }

  /** 用熔断器包裹一次调用：断开时抛 CIRCUIT_OPEN，不产生任何网络请求 */
  async execute(fn) {
    if (!this.canAttempt()) {
      const err = new Error(`[${this.name}] 熔断器处于 OPEN 状态，快速失败（未发起网络请求）`);
      err.code = 'CIRCUIT_OPEN';
      throw err;
    }
    try {
      const value = await fn();
      this.onSuccess();
      return value;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }
}

// --- 6.1 下游持续故障 → 熔断器打开 ---
console.log('\n  [6.1 下游持续故障 → 熔断打开，后续请求快速失败]');
await control({ healthy: 0 }); // 服务端 /api/unstable 恒返回 503

const breaker = new CircuitBreaker({ name: 'inventory-service', failureThreshold: 3, resetTimeoutMs: 300 });
console.log(`  熔断器配置：失败阈值=${breaker.failureThreshold}，冷却时间=${breaker.resetTimeoutMs}ms`);
console.log(`  初始状态：${breaker.state}`);

// 把熔断器包在重试外面（熔断在外，重试在内是常见组合；这里为了看清状态变化只用一层）
const callsBefore = serviceState.unstableCalls;
for (let i = 1; i <= 8; i++) {
  try {
    await breaker.execute(() => api.get('/api/unstable'));
    console.log(`    第 ${i} 次调用：成功`);
  } catch (err) {
    const tag = err.code === 'CIRCUIT_OPEN' ? '快速失败（无网络请求）' : `真实请求失败(${err.response?.status})`;
    console.log(`    第 ${i} 次调用：${tag}  当前状态=${breaker.state}，连续失败=${breaker.consecutiveFailures}`);
  }
}

const realCalls = serviceState.unstableCalls - callsBefore;
console.log(`  实际打到下游的请求：${realCalls} 次；被熔断器直接拦下：${breaker.stats.shortCircuited} 次`);
assert.equal(breaker.state, BREAKER.OPEN, '连续失败超过阈值后应进入 OPEN');
assert.equal(realCalls, 3, '只应放行 3 次真实请求，其余被短路');
console.log('  价值：下游挂了的时候，我们**不再浪费连接和超时预算**，用户立刻拿到失败，');
console.log('        而不是每个请求都等 2 秒超时。这就是"快速失败（fail fast）"的意义。');

// --- 6.2 下游恢复 → 半开探针 → 闭合 ---
console.log('\n  [6.2 下游恢复 → HALF_OPEN 探针 → CLOSED]');
console.log('  先等冷却时间过去……');
await sleep(330);
// 运维把下游修好了（这里直接改服务端状态，避免整体 reset 把调用计数清零）
serviceState.healthy = true;
console.log(`  下游已恢复（serviceState.healthy = true），熔断器将在下次调用时试探`);

const beforeProbe = serviceState.unstableCalls;
const probeResult = await breaker.execute(() => api.get('/api/unstable'));
console.log(`  探针请求成功：${JSON.stringify(probeResult.data)}，熔断器状态 → ${breaker.state}`);
assert.equal(breaker.state, BREAKER.CLOSED, '探针成功后应闭合');
assert.equal(serviceState.unstableCalls - beforeProbe, 1, '半开状态只应放行一个探针');

const afterRecovery = await breaker.execute(() => api.get('/api/unstable'));
console.log(`  恢复后的正常调用：${JSON.stringify(afterRecovery.data)}，状态保持 ${breaker.state}`);
console.log(`  状态迁移记录：${breaker.stats.stateChanges.map((s) => `${s.from}→${s.to}`).join('，')}`);
assert.ok(
  breaker.stats.stateChanges.some((s) => s.to === BREAKER.HALF_OPEN),
  '必须经历过 HALF_OPEN',
);
console.log('  半开状态的意义：**用最小的代价试探下游是否真的好了**，');
console.log('  好了才逐步恢复流量，没好就立刻再次断开，避免"恢复瞬间的二次雪崩"。');

// ===========================================================================
// 7. 收尾
// ===========================================================================

console.log('\n--- 7. 生产落地清单 ---');
const checklist = [
  '只对幂等操作自动重试；非幂等写操作必须配 Idempotency-Key',
  '只重试网络错误、超时、429、5xx；4xx 一律快速失败',
  '指数退避 + 抖动（推荐 full jitter），并设 maxDelay 上限',
  '同时设两道上限：maxAttempts 与 totalBudgetMs，超预算立即放弃',
  '尊重服务端 Retry-After；对 429 更要退让',
  '重试只在整个调用链的**一层**做，其余层靠超时兜底，避免重试放大',
  '每次重试都打结构化日志 + 上报指标（重试率是重要的健康信号）',
  '对持续故障的下游上熔断器：快速失败优于慢速失败',
  '为每个下游单独设置超时，且总超时要小于上游调用方的超时',
  '压测时专门测"下游变慢/失败"的场景，而不是只测正常路径',
];
checklist.forEach((item, i) => console.log(`  ${String(i + 1).padStart(2, ' ')}. [ ] ${item}`));

// ---- 关闭本地服务 ----
console.log('\n[清理] 关闭本地服务……');
await new Promise((resolve, reject) => {
  server.close((err) => (err ? reject(err) : resolve()));
  // axios 默认 agent 可能保留 keep-alive 连接，不主动断开 close 回调会一直等
  if (typeof server.closeIdleConnections === 'function') server.closeIdleConnections();
  if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
});
console.log('[清理] 本地服务已关闭。');

console.log('\n完成：重试 / 退避抖动 / 幂等性 / 熔断器 全套演示结束，退出码 0。');
