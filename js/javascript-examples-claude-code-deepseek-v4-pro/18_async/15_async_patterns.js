/**
 * ============================================================================
 * 知识点：异步实战模式 —— 并发控制、失败重试、顺序队列
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】高级
 * 【前置知识】18_async/09_async_sequential_vs_parallel.js、18_async/13_timeout_and_abort.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    三个生产环境里最常见的异步模式：
 *      - 并发控制（concurrency limit）：一次最多只放 N 个任务在跑，
 *        剩下的排队等待。避免"一口吃光"下游服务。
 *      - 失败重试（retry）：失败的任务按策略再试几次，常用指数退避
 *        （每次等待时间翻倍），并配合随机抖动避免"惊群"。
 *      - 顺序队列（sequential queue）：任务严格按入队顺序一个接一个执行，
 *        适合有顺序依赖、或必须串行写入的场景。
 *
 * 2. 为什么需要
 *    Promise.all 很方便，但一千个请求同时打出去就是一场事故：
 *    连接池耗尽、对方限流、本机内存飙升。重试则是应对"偶发失败"的
 *    标准手段（网络抖动、限流、临时不可用）。顺序队列保证写入不乱序。
 *
 * 3. 核心语法要点
 *    - 并发控制的通用实现：维护"运行中数量"和"等待队列"，
 *      每个任务结束时从队列里取下一个补上（这就是一个信号量的雏形）。
 *    - 重试三要素：最大次数、退避策略（如 base * 2^n）、只对可重试错误重试。
 *    - 顺序队列可以用一条 promise 链实现：next = next.then(() => task())。
 *
 * 4. 常见陷阱
 *    - 用 all 处理大量任务：并发无上限（应该用本节的 pool）。
 *    - 无限重试：必须有上限，否则会永远卡住。
 *    - 重试不区分错误类型：把"参数错误"也重试，白费力气还放大故障。
 *    - 队列里某个任务永久 pending：整条队列被堵死（要配合超时）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/15_async_patterns.js
 *
 * 【预期输出】
 *   三种模式的运行日志：并发数被限制在 3；任务在第 3 次尝试时成功；
 *   顺序队列严格按入队顺序执行。总耗时约 300ms。
 * ============================================================================
 */

import { setTimeout as sleep } from 'node:timers/promises';

// 模拟一个耗时 30ms 的异步任务
const task = (id, ms = 30) => sleep(ms).then(() => `任务-${id} 完成`);

// ---------------------------------------------------------------------------
// 1. 并发控制：一次最多跑 N 个
// ---------------------------------------------------------------------------

console.log('--- 1. 并发控制（限制并发数为 3） ---');

/**
 * pool —— 并发池。
 * @param {Array} items       待处理的数据
 * @param {Function} worker   处理函数，接收 (item, index)，返回 Promise
 * @param {number} limit      最大并发数
 *
 * 实现思路：
 *   - 用 nextIndex 记录"下一个要派发的任务下标"；
 *   - 启动 limit 个"worker 协程"，每个协程不停地"取一个任务 -> 执行 -> 再取一个"；
 *   - 协程之间共享 nextIndex，靠 JS 单线程的特性天然不会抢到同一个下标。
 * 结果数组的下标固定，所以返回顺序始终与输入顺序一致。
 */
async function pool(items, worker, limit = 3) {
  const results = new Array(items.length);
  let nextIndex = 0;
  let active = 0;
  let peak = 0; // 记录实际达到过的最大并发数，用于验证限制是否生效

  async function runOne() {
    while (nextIndex < items.length) {
      const current = nextIndex++; // 先占位再自增，保证每个下标只被处理一次
      active++;
      peak = Math.max(peak, active);
      try {
        results[current] = await worker(items[current], current);
      } catch (err) {
        results[current] = `失败：${err.message}`;
      } finally {
        active--; // 无论成败都要归还"名额"
      }
    }
  }

  // 启动 limit 个协程；它们会一起把任务队列"吃"完
  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runOne());
  await Promise.all(runners);

  return { results, peak };
}

const ids = [1, 2, 3, 4, 5, 6, 7, 8];

let t0 = Date.now();
const limited = await pool(
  ids,
  async (id) => {
    const r = await task(id);
    console.log(`  [${String(Date.now() - t0).padStart(3, ' ')}ms] ${r}（当前并发数不会超过 3）`);
    return r;
  },
  3,
);
console.log(`  8 个 30ms 任务，限流 3：总耗时约 ${Date.now() - t0}ms（理论 ≈ 30 × 3 = 90ms）`);
console.log('  实际达到过的最大并发数：', limited.peak);
console.log('  结果顺序仍然与输入一致：', limited.results.length, '项');

// 对照：不限流的 Promise.all（用 4 个任务演示，避免输出太多）
console.log('  对照（不限流）：4 个任务同时开跑');
const tUnlimited = Date.now();
await Promise.all(ids.slice(0, 4).map((id) => task(id, 10)));
console.log(`  不限流时 4 个任务同时启动，总耗时约 ${Date.now() - tUnlimited}ms（只等于最慢的那个）`);

// ---------------------------------------------------------------------------
// 2. 失败重试：指数退避 + 抖动
// ---------------------------------------------------------------------------

console.log('\n--- 2. 失败重试 ---');

/**
 * retry —— 通用重试包装。
 * @param {Function} fn             要执行的异步函数
 * @param {object} options
 * @param {number} options.retries  最多重试几次（不含首次）
 * @param {number} options.baseMs   首次退避时间，之后翻倍
 * @param {Function} options.shouldRetry 判断某个错误是否值得重试
 */
async function retry(fn, { retries = 3, baseMs = 5, shouldRetry = () => true } = {}) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;

      // 不可重试的错误立刻抛出，不浪费时间
      if (!shouldRetry(err)) {
        console.log(`  第 ${attempt + 1} 次尝试失败，且该错误不可重试，直接放弃`);
        throw err;
      }

      if (attempt === retries) break; // 次数用尽

      // 指数退避：5ms、10ms、20ms……再叠加一点随机抖动，
      // 避免大量请求在同一时刻一起重试（惊群效应）
      const backoff = baseMs * 2 ** attempt;
      const jitter = Math.random() * baseMs;
      const waitMs = Math.round(backoff + jitter);
      console.log(`  第 ${attempt + 1} 次尝试失败（${err.message}），${waitMs}ms 后重试`);
      await sleep(waitMs);
    }
  }

  throw lastError;
}

// 场景一：前两次失败，第三次成功
let calls = 0;
t0 = Date.now();
const retryResult = await retry(
  async () => {
    calls++;
    if (calls < 3) {
      throw new Error(`临时故障 #${calls}`);
    }
    return `第 ${calls} 次尝试成功`;
  },
  { retries: 3, baseMs: 5 },
);
console.log(`  结果：${retryResult}，总耗时约 ${Date.now() - t0}ms`);

// 场景二：不可重试的错误（比如参数错误）
class ValidationError extends Error {}

await retry(
  async () => {
    throw new ValidationError('参数格式错误');
  },
  {
    retries: 5,
    baseMs: 5,
    shouldRetry: (err) => !(err instanceof ValidationError), // 校验错误不重试
  },
).catch((e) => console.log('  最终失败：', e.message, '（只尝试了 1 次）'));

// 场景三：全部失败
await retry(
  async () => {
    throw new Error('始终失败');
  },
  { retries: 2, baseMs: 5 },
).catch((e) => console.log('  重试耗尽后抛出：', e.message, '（共尝试 3 次）'));

// ---------------------------------------------------------------------------
// 3. 顺序队列：严格按入队顺序执行
// ---------------------------------------------------------------------------

console.log('\n--- 3. 顺序队列 ---');

/**
 * createQueue —— 串行任务队列。
 * 用一条不断延长的 Promise 链来保证顺序：
 * 每次 enqueue 都把新任务接到 current 后面，current 再指向这条新链的末尾。
 * 这样即使多个任务被"同时"入队，它们也会一个接一个执行。
 */
function createQueue() {
  let current = Promise.resolve();

  return {
    enqueue(fn) {
      // 关键：.then(() => fn()) 保证 fn 在前一个任务结束后才被调用
      const result = current.then(() => fn());
      // 出错不能污染队列：catch 掉错误的副本，让链继续往下走
      current = result.catch(() => {});
      return result;
    },
    // 等待队列中所有任务完成
    onIdle() {
      return current;
    },
  };
}

const queue = createQueue();
t0 = Date.now();
const order = [];

// 一口气入队 4 个任务。注意任务 2 只要 5ms、任务 1 要 20ms，
// 但因为是串行队列，任务 2 必须等任务 1 结束才能开始。
const queueTasks = [];

queueTasks.push(
  queue.enqueue(async () => {
    await sleep(20);
    order.push(1);
    console.log(`  [${String(Date.now() - t0).padStart(3, ' ')}ms] 顺序队列任务 1（耗时 20ms）完成`);
  }),
);

queueTasks.push(
  queue.enqueue(async () => {
    await sleep(5);
    order.push(2);
    console.log(`  [${String(Date.now() - t0).padStart(3, ' ')}ms] 顺序队列任务 2（耗时 5ms，但不能抢跑）完成`);
  }),
);

queueTasks.push(
  queue.enqueue(async () => {
    // 队列里的失败不会影响后面的任务：内部已经用 catch 隔离过了
    throw new Error('任务 3 失败了');
  }),
);

queueTasks.push(
  queue.enqueue(async () => {
    await sleep(10);
    order.push(4);
    console.log(`  [${String(Date.now() - t0).padStart(3, ' ')}ms] 顺序队列任务 4（前面有任务失败也不受影响）完成`);
  }),
);

// 每个任务的 Promise 仍然保留了自己的成功/失败状态，可以单独处理
await queueTasks[2].catch((e) => console.log('  任务 3 的失败被单独捕获：', e.message));
await queue.onIdle().catch(() => {});
console.log('  实际完成顺序：', order, '（严格按入队次序）');

// ---------------------------------------------------------------------------
// 4. 组合使用：限流 + 重试
// ---------------------------------------------------------------------------

console.log('\n--- 4. 组合：限流池 + 重试 ---');

t0 = Date.now();
const attemptsLog = [];

const combined = await pool(
  [1, 2, 3, 4, 5],
  (id) =>
    retry(
      async (attempt) => {
        attemptsLog.push(`任务${id}#第${attempt + 1}次`);
        if (attempt === 0 && id % 2 === 0) {
          // 偶数任务第一次一定失败，用来演示重试
          throw new Error('偶发失败');
        }
        await sleep(10);
        return `任务${id} 成功`;
      },
      { retries: 2, baseMs: 5 },
    ),
  2, // 并发上限 2
);

console.log('  尝试记录：', attemptsLog.join('、'));
console.log('  全部结果：', combined.results);
console.log(`  总耗时约 ${Date.now() - t0}ms（限流 2，且有重试）`);

console.log('\n--- 5. 小结 ---');
console.log('  并发控制：一次别放太多，用 pool / 信号量');
console.log('  重试：限制次数 + 指数退避 + 只重试可恢复的错误');
console.log('  顺序队列：用 Promise 链把任务串起来，保证执行次序');
console.log('  三者可以自由组合：本示例就把 pool 和 retry 套在了一起');

console.log('\n示例结束。');
