/**
 * ============================================================================
 * 知识点：测试异步代码 —— async 测试函数、断言 Promise 拒绝、超时控制
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试基础
 * 【难度等级】进阶
 * 【前置知识】28_testing/03_assert_module.js、28_testing/05_mocking_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    异步测试的核心问题只有一个：测试运行器怎么知道"这个用例跑完了"？
 *    对于同步用例，函数返回即结束；对于异步用例，函数返回时异步逻辑可能才刚开始。
 *    三种让运行器知道"结束点"的机制：
 *      (a) 返回 Promise —— 最推荐。test 的回调是 async 函数，返回值天然是 Promise，
 *          运行器 await 它，resolve 视为通过，reject 视为失败。
 *      (b) 回调参数 —— 老式 done() 风格，node:test 出于兼容也支持，
 *          但一旦忘了调用 done()，用例就会挂到超时。
 *      (c) 都不给 —— 运行器认为用例同步结束，异步代码变成"脱缰的 Promise"，
 *          它的失败会变成 unhandledRejection，可能让整个进程崩溃，
 *          而且用例本身还显示"通过"。这是异步测试最危险的失败模式：假通过。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    真实项目里几乎所有有价值的东西都是异步的：HTTP 请求、数据库查询、文件读写、
 *    定时任务、消息队列。所以"会不会测异步"基本决定了测试能不能落地。
 *    典型场景：
 *      - 验证接口在超时后是否正确降级；
 *      - 验证并发调用不会互相污染（race condition）；
 *      - 验证重试逻辑最终成功；
 *      - 验证某个操作确实在指定时间内完成（性能回归测试）。
 *
 * 3. 核心语法要点
 *    test('name', async () => { await ... })          返回 Promise 即被等待
 *    test('name', { timeout: 200 }, async () => {})   单用例超时（毫秒）
 *    await assert.rejects(promiseOrFn, ...)           断言拒绝
 *    await assert.doesNotReject(fn)                   断言不拒绝
 *    t.signal                                         运行器提供的 AbortSignal，
 *                                                     超时会 abort，便于清理资源
 *    await t.test(...)                                异步子测试必须 await
 *    mock.timers                                      配合虚拟时间，避免真的等待
 *    并发测试用 await Promise.all([...]) 把多个断言集中在一个用例里，
 *    或者直接依赖运行器的并发能力（不同用例之间）。
 *
 * 4. 常见陷阱
 *    - 忘记 await：`assert.rejects(p)` 不 await，用例立刻"通过"，失败被吞掉。
 *    - async 函数抛错用 assert.throws 接：接不到，必须用 rejects。
 *    - 用 setTimeout 真的等 5 秒：CI 里几千个用例累积起来就是几十分钟。
 *      应该用 mock.timers 或把超时时间做成可注入参数。
 *    - 没有超时保护：被测代码死循环或网络挂死，CI 会一直卡住。
 *    - 未处理的 Promise 拒绝：Node 默认会让进程以非 0 退出，导致"用例全绿但进程失败"。
 *    - 用 async 回调却当作同步返回：比如 `new Promise(r => setTimeout(r, 0))` 忘记 return。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/06_testing_async_code.js
 *
 * 【预期输出】
 *   打印 TAP 结果，包含 8 个左右异步用例全部通过（含 3 个演示超时的用例
 *   用独立手段验证），退出码 0。
 * ============================================================================
 */

import { test, describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// 被测代码：一个带超时、重试、并发的模拟 HTTP 客户端
// ---------------------------------------------------------------------------

/**
 * 带超时的 fetch 封装。
 * 真实项目里这个模式极其常见：任何一个外部调用都必须有超时，
 * 否则一个卡住的下游会耗尽你的连接池和线程。
 *
 * @param {() => Promise<any>} requestFn 真正发起请求的函数
 * @param {number} timeoutMs 超时毫秒数
 */
async function withTimeout(requestFn, timeoutMs) {
  let timer;
  // Promise.race：谁先 settle 就用谁的结果
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`请求超时（${timeoutMs}ms）`);
      error.code = 'ETIMEDOUT';
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([requestFn(), timeoutPromise]);
  } finally {
    // finally 保证无论成功、失败还是超时，定时器都被清掉，
    // 否则进程会因为残留的定时器句柄而无法退出（测试里非常常见的"跑完不退出"根因）。
    clearTimeout(timer);
  }
}

/**
 * 带指数退避的重试。
 * @param {() => Promise<any>} fn 可能失败的异步操作
 * @param {{retries?: number, baseDelay?: number, sleep?: (ms: number) => Promise<void>}} options
 */
async function retry(fn, { retries = 3, baseDelay = 10, sleep = defaultSleep } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      // 最后一次失败不再等待，直接把错误抛出
      if (attempt === retries) break;
      await sleep(baseDelay * 2 ** (attempt - 1)); // 10, 20, 40 ...
    }
  }
  throw lastError;
}

/** 默认的等待实现。做成可注入的，测试时就能替换成"不等待"，让用例瞬间跑完 */
const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 并发限制器：最多同时执行 limit 个任务。
 * 真实项目里用于限制对下游的并发压力（比如最多 5 个并发请求）。
 * @param {Array<() => Promise<any>>} tasks
 * @param {number} limit
 */
async function mapWithConcurrency(tasks, limit) {
  const results = new Array(tasks.length);
  let cursor = 0;

  // 起 limit 个"工人"，每个工人循环从队列里取任务执行，直到队列空
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await tasks[index]();
    }
  });

  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
console.log('--- 1. async 测试函数：返回 Promise 就会被等待 ---');

describe('异步测试的基本形式', () => {
  it('async 回调：运行器等 Promise resolve 后才判定通过', async () => {
    // 运行器会 await 这个 async 函数。如果这里抛错，用例就是失败。
    const value = await Promise.resolve(42);
    assert.strictEqual(value, 42);
  });

  it('返回 Promise 的普通函数同样被等待（不一定要 async）', () => {
    // 不写 async，直接 return 一个 Promise，效果完全一样
    return Promise.resolve('done').then((v) => {
      assert.strictEqual(v, 'done');
    });
  });

  it('演示：忘记 await 会导致假通过（用 assert.rejects 反向验证这个坑）', async () => {
    // 这是一个会拒绝的 Promise。如果不 await 它，用例会立刻"通过"，
    // 而拒绝会变成一个未处理的拒绝（可能让进程崩溃）。
    const failing = assert.rejects(async () => {
      throw new Error('这个错误必须被接住');
    }, /必须被接住/);

    // 正确的做法就是 await 它 —— 这一行是这个用例存在的意义
    await failing;
  });
});

// ---------------------------------------------------------------------------
console.log('--- 2. 断言 Promise 拒绝的三种写法 ---');

describe('assert.rejects 的用法', () => {
  it('传函数：推荐写法（拒绝时机可控，不会产生未处理拒绝）', async () => {
    await assert.rejects(
      async () => {
        throw new RangeError('参数越界');
      },
      RangeError,
      '应当以 RangeError 拒绝',
    );
  });

  it('传 Promise 对象：可以，但要注意拒绝可能早于断言注册', async () => {
    // 因为这里 await 得很及时，所以是安全的；但如果是"先创建、后断言"的写法就有风险
    const promise = Promise.reject(new Error('立即失败'));
    await assert.rejects(promise, /立即失败/);
  });

  it('传校验函数：断言错误对象的结构化字段', async () => {
    await assert.rejects(
      () =>
        withTimeout(
          // 这个请求永远不会成功，必然被超时兜住
          () => new Promise(() => {}),
          20,
        ),
      (error) => {
        assert.strictEqual(error.code, 'ETIMEDOUT');
        assert.match(error.message, /请求超时（20ms）/);
        return true;
      },
    );
  });

  it('没有拒绝时要报错：assert.rejects 对成功路径会失败', async () => {
    // 这是"反向断言"：确认 rejects 真的是在严格检查，而不是永远通过
    await assert.rejects(
      () => assert.rejects(async () => 'ok', /永远不会匹配/),
      assert.AssertionError,
      'assert.rejects 面对不拒绝的 Promise 应当自己抛错',
    );
  });
});

// ---------------------------------------------------------------------------
console.log('--- 3. 超时控制 ---');

describe('超时控制', () => {
  it('用例超时：options.timeout 到期即判失败', { timeout: 300 }, async () => {
    // 这个用例本身很快，只是演示 timeout 选项的写法。
    // 真实项目里应给所有异步用例设置超时，避免 CI 卡死。
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.ok(true);
  });

  it('验证"超时会被触发"：用 assert.rejects 捕获超时错误', async () => {
    // 不依赖运行器的 timeout，而是用被测代码自己的超时逻辑 —— 这样断言更精确
    const start = Date.now();
    await assert.rejects(() => withTimeout(() => new Promise(() => {}), 30), /请求超时/);
    const elapsed = Date.now() - start;

    // 断言"确实等了大约 30ms"，容差放宽到 200ms 以适应 CI 的调度抖动。
    // 测试里对时间做断言一定要留足容差，否则会出现随机失败的"脆弱测试"。
    assert.ok(elapsed >= 25, `应至少等待 25ms，实际 ${elapsed}ms`);
    assert.ok(elapsed < 500, `不应等待过久，实际 ${elapsed}ms`);
  });

  it('被测代码在超时内完成时，正常返回结果', async () => {
    const result = await withTimeout(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return 'fast-response';
    }, 200);
    assert.strictEqual(result, 'fast-response');
  });

  it('t.signal：运行器超时会 abort，便于主动清理资源', async () => {
    // node:test 的 TestContext 提供了 signal 属性（AbortSignal）。
    // 用例超时或取消时它会 abort，你可以把它透传给 fetch 等支持 signal 的 API，
    // 从而在用例被强杀时也能正确释放资源。
    await test('使用 signal 的子测试', async (t) => {
      assert.strictEqual(t.signal.aborted, false, '正常情况下不应已 abort');

      const value = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => resolve('completed'), 10);
        // 一旦 signal abort，立即清理定时器并拒绝，避免资源泄漏
        t.signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('被取消'));
        });
      });

      assert.strictEqual(value, 'completed');
    });
  });
});

// ---------------------------------------------------------------------------
console.log('--- 4. 让异步测试变快：注入 sleep / 虚拟时间 ---');

describe('避免真的等待', () => {
  it('注入 sleep 实现：重试逻辑的等待被替换成"立即返回"', async () => {
    let attempts = 0;
    const sleepCalls = [];

    const result = await retry(
      async (attempt) => {
        attempts = attempt;
        if (attempt < 3) throw new Error(`第 ${attempt} 次失败`);
        return 'success';
      },
      {
        retries: 3,
        baseDelay: 100,
        // 关键：把"等待"换成一个假函数。测试瞬间完成，而不是真的等 100 + 200 = 300ms。
        // 这是依赖注入带来的可测试性红利 —— 不需要任何 mock 框架。
        sleep: async (ms) => {
          sleepCalls.push(ms);
        },
      },
    );

    assert.strictEqual(result, 'success');
    assert.strictEqual(attempts, 3);
    // 顺便验证了退避策略本身：100ms、200ms（指数退避）
    assert.deepStrictEqual(sleepCalls, [100, 200], '退避间隔应当是指数增长的');
  });

  it('全部失败时抛出最后一次的错误，且不额外等待', async () => {
    const sleepCalls = [];
    await assert.rejects(
      () =>
        retry(
          async () => {
            throw new Error('服务不可用');
          },
          { retries: 3, sleep: async (ms) => sleepCalls.push(ms) },
        ),
      /服务不可用/,
    );
    // retries=3 表示共尝试 3 次，失败之间等待 2 次（最后一次失败不再等待）
    assert.deepStrictEqual(sleepCalls, [10, 20]);
  });

  it('用 mock.timers 让真实定时器瞬间走完', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });
    try {
      let fired = false;
      setTimeout(() => {
        fired = true;
      }, 60_000); // 一分钟的定时器

      assert.strictEqual(fired, false);
      mock.timers.tick(60_000); // 虚拟推进一分钟，实际耗时接近 0
      assert.strictEqual(fired, true, '虚拟时间推进后回调应当触发');
    } finally {
      // 必须还原，否则后续用例的定时器永远不触发
      mock.timers.reset();
    }
  });
});

// ---------------------------------------------------------------------------
console.log('--- 5. 并发异步代码的测试 ---');

describe('并发', () => {
  it('mapWithConcurrency：结果顺序与输入一致', async () => {
    // 故意让后面的任务更快完成，用来验证"结果按输入顺序而非完成顺序排列"
    const delays = [30, 20, 10, 5];
    const tasks = delays.map((delay, index) => async () => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return index;
    });

    const results = await mapWithConcurrency(tasks, 4);
    assert.deepStrictEqual(results, [0, 1, 2, 3]);
  });

  it('mapWithConcurrency：并发数不超过限制', async () => {
    let running = 0;
    let maxRunning = 0;

    const tasks = Array.from({ length: 10 }, () => async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running); // 记录峰值并发
      await new Promise((resolve) => setTimeout(resolve, 5));
      running -= 1;
      return 'done';
    });

    const results = await mapWithConcurrency(tasks, 3);
    assert.strictEqual(results.length, 10);
    assert.ok(maxRunning <= 3, `峰值并发不应超过 3，实际 ${maxRunning}`);
    assert.strictEqual(running, 0, '全部任务结束后不应有残留的运行中任务');
  });

  it('并发调用不会互相污染状态（race condition 检查）', async () => {
    // 用一段"累加器"逻辑验证：并发执行下计数必须准确。
    // 真实项目里这类 bug 极难复现，但写测试时很容易暴露。
    let counter = 0;
    const increment = async () => {
      const current = counter;
      // 人为制造一个"读-改-写"之间的空隙。JS 是单线程的，
      // 但 await 会让出控制权，所以这个空隙足以让并发调用互相覆盖。
      await new Promise((resolve) => setTimeout(resolve, 1));
      counter = current + 1;
    };

    // 串行执行：结果正确
    for (let i = 0; i < 5; i += 1) await increment();
    assert.strictEqual(counter, 5, '串行执行时计数正确');

    // 并发执行：读-改-写被交错，结果会小于 5 —— 这就是竞态
    counter = 0;
    await Promise.all(Array.from({ length: 5 }, () => increment()));
    assert.ok(counter < 5, `并发执行时应当出现竞态导致计数丢失，实际 ${counter}`);
    console.log(`  （演示：5 次并发自增后 counter = ${counter}，正确值应为 5）`);
  });
});

// ---------------------------------------------------------------------------
console.log('--- 6. 异步测试检查清单 ---');
console.log('  1. 每个异步用例都返回/await 一个 Promise，绝不留"脱缰的 Promise"；');
console.log('  2. 所有异步用例都设 timeout，避免 CI 卡死；');
console.log('  3. 断言拒绝用 await assert.rejects，断言成功用 await assert.doesNotReject；');
console.log('  4. 避免真的 sleep，把 sleep / 定时器做成可注入的依赖；');
console.log('  5. 用 finally 清理定时器、连接、临时资源；');
console.log('  6. 对时间做断言时留足容差，防止脆弱的随机失败。');
console.log('');
console.log('演示结束。');
