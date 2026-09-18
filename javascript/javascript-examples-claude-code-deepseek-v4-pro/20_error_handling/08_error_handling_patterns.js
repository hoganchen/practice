/**
 * ============================================================================
 * 知识点：错误处理模式 —— 早抛晚捕、错误边界、重试、降级
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】进阶
 * 【前置知识】20_error_handling/05_custom_errors.js、20_error_handling/06_error_cause.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    把"什么时候抛、在哪里捕、捕获之后做什么"沉淀成几种可复用的套路：
 *      早抛晚捕（throw early, catch late）
 *        —— 参数非法就立刻抛，让调用栈最外层（或最懂业务的那一层）统一处理。
 *      错误边界（error boundary）
 *        —— 在一个模块/请求/组件的入口处兜住所有异常，
 *           保证"一个地方出错不会拖垮整个系统"。
 *      重试（retry）
 *        —— 对临时性故障自动重试，通常配合指数退避（exponential backoff）。
 *      降级（fallback / graceful degradation）
 *        —— 拿不到理想结果时返回一个次优但可用的结果，而不是直接报错。
 *
 * 2. 为什么需要
 *    (1) 到处 try/catch 会让业务代码被错误处理淹没，主流程看不清。
 *        早抛晚捕把"检查"和"处理"分开，代码更干净。
 *    (2) 网络抖动、服务重启是常态，重试能显著提升成功率（但要区分是否可重试）。
 *    (3) 用户宁可看到"缓存数据（可能不是最新）"也不愿看到报错页，降级提升可用性。
 *    (4) 边界兜底是最后一道防线：防止一个未处理异常导致整个进程/页面崩溃。
 *
 * 3. 核心语法要点
 *    (1) 早抛：在函数入口集中做参数校验，不合法就 throw（见 12_defensive_programming.js）。
 *    (2) 晚捕：只在"能真正处理这个错误"的层捕获。处理不了就往上抛，不要吞。
 *    (3) 重试三要素：次数上限、等待间隔（建议指数退避 + 抖动）、可重试判断。
 *    (4) 降级要留痕：至少要记录一条日志，否则问题会被悄悄掩盖。
 *    (5) 错误边界通常是一个包装函数（高阶函数），把"统一处理"套在业务函数外面。
 *
 * 4. 常见陷阱
 *    (1) 无脑重试不可重试的错误（如 400 参数错误），白白浪费时间且放大故障。
 *    (2) 重试没有上限或没有退避，形成"重试风暴"打垮下游。
 *    (3) 降级时静默返回默认值，出了问题没人知道（必须打日志/埋点）。
 *    (4) 早抛时抛了非 Error 值（字符串），上层无法区分错误类型。
 *    (5) 在错误边界里把异常吞掉却返回"成功"的结果，导致数据不一致。
 *
 * 【运行方法】
 *   node 20_error_handling/08_error_handling_patterns.js
 *
 * 【预期输出】
 *   依次演示四种模式的实际效果（重试用的是本地假函数，不访问网络）。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 模式一：早抛晚捕
// ---------------------------------------------------------------------------

console.log('--- 1. 早抛晚捕（throw early, catch late） ---');

/**
 * 计算折扣价。入口处立刻校验参数，不合法就抛，函数体内不再重复检查。
 * @param {number} price 原价
 * @param {number} discount 折扣率（0~1）
 * @returns {number} 折后价
 */
function applyDiscount(price, discount) {
  // —— 早抛：把校验集中在最前面，一眼看清前置条件 ——
  if (typeof price !== 'number' || !Number.isFinite(price)) {
    throw new TypeError(`price 必须是有限数字，收到：${JSON.stringify(price)}`);
  }
  if (price < 0) {
    throw new RangeError(`price 不能为负，收到：${price}`);
  }
  if (typeof discount !== 'number' || discount < 0 || discount > 1) {
    throw new RangeError(`discount 必须在 0~1 之间，收到：${JSON.stringify(discount)}`);
  }

  // —— 主流程：到这里参数一定合法，可以放心写业务逻辑 ——
  const finalPrice = price * (1 - discount);
  return Math.round(finalPrice * 100) / 100;
}

// —— 晚捕：在"懂业务"的这一层统一捕获并决定怎么展示 ——
const discountCases = [
  [100, 0.2],
  [199.9, 0.15],
  [-5, 0.2],
  ['一百', 0.2],
  [100, 1.5],
];

for (const [price, discount] of discountCases) {
  try {
    console.log(`  原价 ${String(price).padEnd(6)} 折扣 ${discount} → ${applyDiscount(price, discount)}`);
  } catch (err) {
    console.log(`  原价 ${String(price).padEnd(6)} 折扣 ${discount} → 拒绝：${err.name}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// 模式二：错误边界
// ---------------------------------------------------------------------------

console.log('\n--- 2. 错误边界（error boundary） ---');

/**
 * 把一个可能抛错的函数包成"永不抛错"的版本，统一兜底处理。
 * 这是最常用的一种错误边界实现（前端的 ErrorBoundary、后端的请求中间件同理）。
 * @template T
 * @param {() => T} fn 业务函数
 * @param {{ onError?: (err: Error) => void, fallback: T }} options
 * @returns {T} 正常结果或降级结果
 */
function withBoundary(fn, options) {
  try {
    return fn();
  } catch (err) {
    // 统一记录：产出告警 / 上报监控
    if (options.onError) {
      options.onError(err instanceof Error ? err : new Error(String(err)));
    }
    // 返回降级值，让调用方永远拿到一个可用的结果
    return options.fallback;
  }
}

/** 收集到的错误（模拟日志/监控） */
const collectedErrors = [];

const safeParseConfig = (text) =>
  withBoundary(() => JSON.parse(text), {
    fallback: { theme: 'default' },
    onError: (err) => collectedErrors.push(`配置解析失败：${err.message}`),
  });

console.log('合法配置  →', JSON.stringify(safeParseConfig('{"theme":"dark"}')));
console.log('非法配置  →', JSON.stringify(safeParseConfig('{ 坏掉 }')));
console.log('边界收集到的错误：', collectedErrors);

// 边界的第二条铁律：不能吞掉"不该吞"的错误
console.log('\n错误边界的取舍：');
console.log('  - 可预期的外部输入错误 → 兜住并降级（如上例）');
console.log('  - 程序 bug（TypeError/RangeError 等）→ 记录后仍然重新抛出，让问题暴露');

/**
 * 只兜住"业务错误"，其余重新抛出
 * @template T
 * @param {() => T} fn
 * @returns {T}
 */
function withStrictBoundary(fn) {
  try {
    return fn();
  } catch (err) {
    if (err instanceof RangeError || err instanceof TypeError) {
      // 这两类通常意味着代码 bug，记录后继续向上抛
      console.log('  [边界] 发现可能是 bug 的错误，向上抛出：', err.name);
      throw err;
    }
    console.log('  [边界] 业务错误，已降级处理');
    return undefined;
  }
}

try {
  withStrictBoundary(() => {
    throw new RangeError('这是代码 bug');
  });
} catch (err) {
  console.log('  外层收到并处理了：', err.message);
}

// ---------------------------------------------------------------------------
// 模式三：重试（含指数退避）
// ---------------------------------------------------------------------------

console.log('\n--- 3. 重试（retry with exponential backoff） ---');

/** 模拟一个"前两次失败、第三次成功"的接口 */
let attempt = 0;
/**
 * 不稳定的操作：前两次抛错，第三次返回成功
 * @returns {Promise<string>}
 */
async function flakyOperation() {
  attempt += 1;
  await new Promise((r) => setTimeout(r, 5)); // 模拟耗时
  if (attempt < 3) {
    const err = new Error(`第 ${attempt} 次尝试失败：临时网络错误`);
    err.code = 'ETIMEDOUT'; // 标记为可重试
    throw err;
  }
  return `第 ${attempt} 次尝试成功`;
}

/**
 * 带重试与指数退避的调用封装
 * @param {() => Promise<unknown>} fn 要执行的操作
 * @param {{ retries?: number, baseDelayMs?: number, isRetryable?: (e: Error) => boolean }} [options]
 * @returns {Promise<unknown>}
 */
async function withRetry(fn, options = {}) {
  const retries = options.retries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 10;
  // 默认策略：只有带 code 的错误才重试（业务错误不重试）
  const isRetryable = options.isRetryable ?? ((e) => Boolean(e.code));

  let lastError;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLast = i === retries;
      if (!isRetryable(err) || isLast) {
        console.log(`  [重试] 第 ${i + 1} 次失败，不再重试（${isRetryable(err) ? '已达上限' : '错误不可重试'}）`);
        throw lastError;
      }
      // 指数退避：10ms、20ms、40ms……
      const delay = baseDelayMs * 2 ** i;
      console.log(`  [重试] 第 ${i + 1} 次失败（${err.message}），${delay}ms 后重试`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError; // 理论上不可达，仅让类型完整
}

try {
  const result = await withRetry(flakyOperation, { retries: 3, baseDelayMs: 10 });
  console.log('  最终结果：', result);
} catch (err) {
  console.log('  最终失败：', err.message);
}

// 不可重试的错误：直接放弃
try {
  await withRetry(
    async () => {
      const err = new Error('参数不合法（400）');
      err.statusCode = 400; // 没有 code，默认策略判定为不可重试
      throw err;
    },
    { retries: 3, baseDelayMs: 5 },
  );
} catch (err) {
  console.log('  不可重试的错误直接抛出：', err.message, '（没有白白重试 3 次）');
}

// ---------------------------------------------------------------------------
// 模式四：降级
// ---------------------------------------------------------------------------

console.log('\n--- 4. 降级（fallback / graceful degradation） ---');

/** 模拟一个会失败的"远程配置服务" */
async function fetchRemoteConfig() {
  await new Promise((r) => setTimeout(r, 5));
  throw new Error('配置服务不可用');
}

/** 本地兜底配置 */
const LOCAL_FALLBACK_CONFIG = { theme: 'light', locale: 'zh-CN', source: 'local' };

/**
 * 先试远程、失败则用本地兜底
 * @returns {Promise<object>}
 */
async function loadConfig() {
  try {
    const remote = await fetchRemoteConfig();
    return { ...remote, source: 'remote' };
  } catch (err) {
    // 降级必须有痕迹：记录日志，否则线上问题无人知晓
    console.log('  [降级] 远程配置加载失败（已记录日志）：', err.message);
    return LOCAL_FALLBACK_CONFIG;
  }
}

console.log('  加载结果：', JSON.stringify(await loadConfig()));

// 降级的进阶形态：缓存优先（stale-while-revalidate 的简化版）
const cache = { data: { user: '缓存的旧数据' }, time: Date.now() };

/**
 * 拿不到新数据时，使用"过期但可用"的缓存
 * @returns {Promise<object>}
 */
async function loadUserWithStaleCache() {
  try {
    throw new Error('主数据源不可用'); // 模拟失败
  } catch (err) {
    if (cache.data) {
      const ageMs = Date.now() - cache.time;
      console.log(`  [降级] 使用缓存数据（已过期 ${ageMs}ms）：`, JSON.stringify(cache.data));
      return cache.data;
    }
    throw err; // 连缓存都没有，只能把错误抛出去
  }
}

console.log('  加载结果：', JSON.stringify(await loadUserWithStaleCache()));

// ---------------------------------------------------------------------------
// 组合使用：真实项目中的完整链路
// ---------------------------------------------------------------------------

console.log('\n--- 5. 组合使用 ---');

/**
 * 一个"完整的"数据加载流程：校验 → 重试 → 降级 → 边界
 * @param {string} id 用户 id
 * @returns {Promise<object>}
 */
async function loadUserSafely(id) {
  // 1) 早抛：参数立刻校验
  if (typeof id !== 'string' || id.trim() === '') {
    throw new TypeError('id 必须是非空字符串');
  }

  // 2) 重试：应对临时故障
  try {
    return await withRetry(
      async () => {
        const err = new Error('读取超时');
        err.code = 'ETIMEDOUT';
        throw err;
      },
      { retries: 1, baseDelayMs: 5 },
    );
  } catch (err) {
    // 3) 降级：重试仍然失败，返回兜底数据
    console.log('  [流程] 重试仍失败，启用降级：', err.message);
    return { id, name: '匿名用户', degraded: true };
  }
}

console.log('  最终返回：', JSON.stringify(await loadUserSafely('u-1')));

try {
  await loadUserSafely('');
} catch (err) {
  // 4) 边界：非法参数属于调用方 bug，不降级，直接抛出
  console.log('  非法参数被抛出：', err.name, '-', err.message);
}

console.log('\n--- 6. 小结 ---');
console.log('早抛晚捕：参数校验放最前，处理放最外；');
console.log('错误边界：入口兜底，但"可能是 bug 的错误"要重新抛出；');
console.log('重试    ：次数上限 + 指数退避 + 只重试可重试的错误；');
console.log('降级    ：返回次优结果，但一定要留日志，不能静默。');
