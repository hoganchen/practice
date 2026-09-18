/**
 * ============================================================================
 * 知识点：测试替身 —— stub / spy / mock 手写实现，以及 node:test 的 mock 模块
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试基础
 * 【难度等级】进阶
 * 【前置知识】28_testing/02_node_test_runner.js、28_testing/04_test_structure.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "测试替身"（test double）是"用一个假的实现替换掉真实依赖"的统称，
 *    借用电影里"替身演员"的概念。常见的三种：
 *
 *      Spy（间谍）：包一层，仍然调用真实实现，但记录"被调了几次、参数是什么"。
 *                   用途：验证"这段代码有没有按预期调用依赖"。
 *      Stub（桩）  ：替换掉真实实现，返回预先设定的值，不产生副作用。
 *                   用途：让被测代码走进某个分支（比如"让支付网关返回失败"）。
 *      Mock（模拟）：预设"期望的调用方式"，并在调用不符时自动判失败。更主动。
 *                   实践中大家常把三者混用，统称 mock，这没问题，关键是知道意图。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    真实依赖有三类麻烦：
 *      (a) 慢/贵：发一封真邮件、调一次真支付接口；
 *      (b) 不稳定：第三方服务可能超时、限流、随机失败；
 *      (c) 不可控：你没法让真实服务器"恰好返回 500"来测你的降级逻辑。
 *    替身让你能精确控制依赖的行为，从而把测试聚焦在"被测代码自己的逻辑"上：
 *      - 用 Stub 让短信网关抛错，验证"发短信失败时不阻塞下单"；
 *      - 用 Spy 验证"下单成功后确实调用了库存服务扣减库存"；
 *      - 用 mock.timers 把 24 小时的定时任务在几毫秒内跑完。
 *
 * 3. 核心语法要点（node:test 的 mock 模块）
 *    import { mock } from 'node:test';
 *    const fn = mock.fn(impl)                  创建带调用记录的假函数
 *    fn.mock.callCount()                       被调用的次数
 *    fn.mock.calls[0].arguments                第 1 次调用的参数数组
 *    fn.mock.calls[0].result                   第 1 次调用的返回值
 *    fn.mock.resetCalls()                      清空调用记录（保留实现）
 *    mock.method(obj, 'name', impl)            替换对象方法并自动记录，返回被替换对象
 *    mock.method(...).mock.restore()           还原该方法
 *    mock.restoreAll()                         还原所有被 mock.method 替换过的方法
 *    mock.timers.enable({ apis: ['setTimeout'] })  接管定时器
 *    mock.timers.tick(1000)                    虚拟推进 1000ms
 *    mock.getter(obj, 'name', impl)            替换 getter
 *
 * 4. 常见陷阱
 *    - 忘记还原（restore）：mock 泄漏到其他用例，造成"单独跑通过、一起跑失败"的幽灵问题。
 *      解法：在 afterEach 里统一 mock.restoreAll()（本文件就是这么做的）。
 *    - mock 了不属于自己的东西：过度 mock 会让测试变成"测我自己的假设"，
 *      测不出真实集成问题。原则：只 mock 进程外的、慢的、不确定的依赖。
 *    - 断言调用次数用了错的方法：fn.mock.callCount 是函数，必须加括号调用。
 *    - mock.fn() 不传实现时返回 undefined，如果被测代码依赖返回值会静默出错。
 *    - 用 mock.timers.enable() 后忘记 restore，会导致后续用例里的 setTimeout 永远不触发。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/05_mocking_basics.js
 *
 * 【预期输出】
 *   先手写一个 spy 和一个 stub 并打印它们的记录，再演示 node:test 的
 *   mock.fn / mock.method / mock.restoreAll / mock.timers，全部用例通过，退出码 0。
 * ============================================================================
 */

import { test, describe, it, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// 被测代码：一个下单服务，依赖三个外部系统
// ---------------------------------------------------------------------------

/**
 * 下单服务。
 * 依赖通过构造函数注入（依赖注入），这正是"可测试性"的关键设计：
 * 因为依赖是从外面传进来的，测试时可以传替身进去。
 *
 * @param {object} deps
 * @param {{send: (phone: string, text: string) => Promise<{ok: boolean}>}} deps.smsGateway 短信网关（慢、要花钱）
 * @param {{deduct: (sku: string, qty: number) => Promise<void>}} deps.inventory 库存服务（远程调用）
 * @param {(msg: string, level: string) => void} deps.logger 日志（只想验证被调用）
 * @param {() => number} deps.now 取当前时间戳（不确定，需要固定）
 */
function createOrderService(deps) {
  return {
    /**
     * 创建订单。
     * 业务规则：
     *   1. 先扣库存（失败则整个下单失败，抛错）
     *   2. 记一条日志
     *   3. 尝试发短信通知；短信失败只记警告，不影响下单结果（降级）
     *   4. 返回订单对象
     */
    async placeOrder({ sku, qty, phone }) {
      // 第 1 步：扣库存。这一步失败必须让整个下单失败
      await deps.inventory.deduct(sku, qty);

      // 第 2 步：记日志
      deps.logger(`下单成功：${sku} x${qty}`, 'info');

      // 第 3 步：发短信，失败降级（真实项目里这是最常见的"非关键路径"处理）
      try {
        await deps.smsGateway.send(phone, `您的订单 ${sku} 已创建`);
      } catch {
        // 短信失败不影响下单，只记录警告
        deps.logger(`短信发送失败：${phone}`, 'warn');
      }

      // 第 4 步：返回订单，用注入的 now() 而不是 Date.now()，保证时间可控可测
      return { sku, qty, phone, createdAt: deps.now(), status: 'created' };
    },
  };
}

// ---------------------------------------------------------------------------
console.log('--- 1. 手写一个 Spy（理解框架 mock 的本质）---');

/**
 * 手写 spy：包装真实函数，记录每次调用的参数，仍然执行真实实现。
 * 看懂这 10 行，就看懂了所有测试框架 spy 的原理。
 *
 * @param {Function} realFn 被包装的真实函数
 */
function createSpy(realFn) {
  const calls = []; // 调用记录
  const spy = (...args) => {
    // 先记录，再执行 —— 顺序很重要，如果真实实现抛错，记录也必须先留下
    calls.push({ arguments: args });
    return realFn(...args);
  };
  spy.calls = calls;
  spy.callCount = () => calls.length;
  return spy;
}

// 手写一个 Stub：替换真实实现，返回预设值，不产生副作用
function createStub(returnValue) {
  const calls = [];
  const stub = (...args) => {
    calls.push({ arguments: args });
    return returnValue;
  };
  stub.calls = calls;
  stub.callCount = () => calls.length;
  return stub;
}

test('手写 Spy：仍然执行真实实现，但记录调用', () => {
  const realLogger = (message, level) => {
    // 真实实现：假设这里会写文件/上报日志系统
    return `[${level}] ${message}`;
  };

  const spyLogger = createSpy(realLogger);
  const service = createOrderService({
    smsGateway: { send: async () => ({ ok: true }) },
    inventory: { deduct: async () => {} },
    logger: spyLogger,
    now: () => 1_700_000_000_000,
  });

  return service.placeOrder({ sku: 'SKU-1', qty: 2, phone: '13800000000' }).then((order) => {
    // 验证结果
    assert.strictEqual(order.sku, 'SKU-1');
    assert.strictEqual(order.createdAt, 1_700_000_000_000);
    // 验证"行为"：logger 恰好被调用 1 次，参数符合预期
    assert.strictEqual(spyLogger.callCount(), 1);
    assert.deepStrictEqual(spyLogger.calls[0].arguments, ['下单成功：SKU-1 x2', 'info']);
  });
});

test('手写 Stub：让依赖返回指定值，从而驱动被测代码走进特定分支', () => {
  const warnLogs = [];
  const smsStub = createStub(Promise.reject(new Error('短信网关超时'))); // 让短信必然失败

  const service = createOrderService({
    // 注意这里用 stub 替换了真实实现：我们可以精确制造"短信失败"这个场景
    smsGateway: { send: smsStub },
    inventory: { deduct: async () => {} },
    logger: (msg, level) => warnLogs.push({ msg, level }),
    now: () => 0,
  });

  return service.placeOrder({ sku: 'SKU-2', qty: 1, phone: '13900000000' }).then((order) => {
    // 短信失败不应让下单失败 —— 这就是"降级"逻辑的测试
    assert.strictEqual(order.status, 'created');
    assert.strictEqual(smsStub.callCount(), 1, '短信网关应被尝试调用 1 次');
    assert.deepStrictEqual(
      warnLogs.map((l) => l.level),
      ['info', 'warn'],
      '应先记 info，再记一条 warn 警告',
    );
  });
});

test('手写 Stub：扣库存失败时整个下单应当失败', () => {
  const service = createOrderService({
    smsGateway: { send: async () => ({ ok: true }) },
    inventory: {
      deduct: async () => {
        throw new Error('库存不足');
      },
    },
    logger: () => {},
    now: () => 0,
  });

  // async 函数抛错 -> Promise 拒绝，所以用 rejects
  return assert.rejects(
    () => service.placeOrder({ sku: 'SKU-3', qty: 999, phone: '13700000000' }),
    /库存不足/,
  );
});

// ---------------------------------------------------------------------------
console.log('--- 2. node:test 的 mock.fn：框架版 spy/stub ---');

describe('mock.fn()', () => {
  it('记录调用次数、参数与返回值', () => {
    // mock.fn(impl)：impl 是真实实现。不传则返回 undefined。
    const double = mock.fn((n) => n * 2);

    assert.strictEqual(double(3), 6);
    assert.strictEqual(double(5), 10);

    // callCount 是方法，别忘了括号 —— 这是最常踩的坑
    assert.strictEqual(double.mock.callCount(), 2);

    // calls 数组里保存了每次调用的 arguments 和 result
    assert.deepStrictEqual(double.mock.calls[0].arguments, [3]);
    assert.strictEqual(double.mock.calls[0].result, 6);
    assert.strictEqual(double.mock.calls[1].result, 10);

    // 真实实现本身也能通过 mock.calls[i].this 拿到 this 上下文
    assert.strictEqual(double.mock.calls[0].this, undefined);
  });

  it('mock.fn() 不传实现时返回 undefined，并可后续改实现', () => {
    const noop = mock.fn();
    assert.strictEqual(noop(), undefined);

    // 用 mockImplementation 替换实现，模拟"测试中途改变依赖行为"
    noop.mock.mockImplementation(() => 'changed');
    assert.strictEqual(noop(), 'changed');
  });

  it('resetCalls 清空记录但保留实现', () => {
    const fn = mock.fn(() => 42);
    fn();
    fn();
    assert.strictEqual(fn.mock.callCount(), 2);

    fn.mock.resetCalls();
    assert.strictEqual(fn.mock.callCount(), 0);
    assert.strictEqual(fn(), 42, '实现仍然保留');
  });
});

// ---------------------------------------------------------------------------
console.log('--- 3. mock.method：替换对象上的真实方法 ---');

describe('mock.method() 与 restoreAll()', () => {
  // 关键：每个用例结束后统一还原，避免 mock 泄漏到其他用例。
  // 这条 afterEach 是本文件里最重要的一行防御代码。
  afterEach(() => {
    mock.restoreAll();
  });

  it('mock.method 替换对象方法并自动记录调用', () => {
    const mailer = {
      send(email) {
        throw new Error('真实实现会发真邮件（测试里绝不允许执行到这里）');
      },
    };

    // 第三个参数是替身实现。真实实现在测试期间完全不会被调用。
    const mocked = mock.method(mailer, 'send', (email) => `queued:${email}`);

    assert.strictEqual(mailer.send('a@example.com'), 'queued:a@example.com');
    assert.strictEqual(mocked.mock.callCount(), 1);
    assert.deepStrictEqual(mocked.mock.calls[0].arguments, ['a@example.com']);

    // 手动还原后，真实实现回来（这里我们用 throws 把"真实实现会抛错"断言下来）
    mocked.mock.restore();
    assert.throws(() => mailer.send('b@example.com'), /真实实现会发真邮件/);
  });

  it('mock.method 也能只做 spy（保留真实实现）', () => {
    const counter = {
      value: 0,
      inc() {
        this.value += 1;
        return this.value;
      },
    };

    // 不传实现时，mock.method 默认保留原方法（等价于 spy）
    const spy = mock.method(counter, 'inc');

    assert.strictEqual(counter.inc(), 1);
    assert.strictEqual(counter.inc(), 2);
    assert.strictEqual(spy.mock.callCount(), 2);
    assert.strictEqual(counter.value, 2, '真实实现确实生效了');
  });

  it('mock.getter：替换属性读取', () => {
    const config = {
      get port() {
        // 真实实现从环境变量读，测试环境里拿不到
        return process.env.PORT ?? 8080;
      },
    };

    // 用一个固定值替换 getter，保证测试与运行环境无关 —— 这是真实项目里的常见刚需
    mock.getter(config, 'port', () => 3000);
    assert.strictEqual(config.port, 3000);
  });

  it('mock.restoreAll 一次性还原全部替换', () => {
    const a = { fn: () => 'real-a' };
    const b = { fn: () => 'real-b' };
    mock.method(a, 'fn', () => 'mock');
    mock.method(b, 'fn', () => 'mock');

    assert.strictEqual(a.fn(), 'mock');
    assert.strictEqual(b.fn(), 'mock');

    mock.restoreAll();
    assert.strictEqual(a.fn(), 'real-a');
    assert.strictEqual(b.fn(), 'real-b');
  });
});

// ---------------------------------------------------------------------------
console.log('--- 4. mock.timers：把时间"快进" ---');

describe('mock.timers', () => {
  afterEach(() => {
    // 必须还原！否则定时器被永久接管，后续用例里的 setTimeout 永不触发
    mock.timers.reset();
  });

  it('用虚拟时间测试防抖函数，无需真的等待', () => {
    /**
     * 防抖：连续调用只在停止调用 delay 毫秒后执行一次。
     * 真实项目里用于搜索框输入、窗口 resize 等高频事件。
     */
    function debounce(fn, delay) {
      let timer = null;
      return (...args) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
      };
    }

    // 接管 setTimeout：此后所有 setTimeout 都由假时钟控制，不会真的等 300ms
    mock.timers.enable({ apis: ['setTimeout'] });

    const results = [];
    const search = debounce((keyword) => results.push(keyword), 300);

    search('j');
    search('ja');
    search('jav');
    search('java');

    // 虚拟推进 299ms：还没到 300ms，回调不应触发
    mock.timers.tick(299);
    assert.deepStrictEqual(results, [], '未到防抖时间不应执行');

    // 再推进 1ms，累计 300ms，回调触发
    mock.timers.tick(1);
    assert.deepStrictEqual(results, ['java'], '只有最后一次调用应当生效');
  });

  it('用虚拟时间测试重试逻辑', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });

    let attempts = 0;
    /**
     * 带指数退避的重试：前两次失败，第三次成功。
     * 真实项目里访问第三方接口时的标准做法。
     */
    async function retryWithBackoff(fn, retries = 3, baseDelay = 100) {
      for (let i = 0; i < retries; i += 1) {
        try {
          return await fn();
        } catch (error) {
          if (i === retries - 1) throw error;
          await new Promise((resolve) => setTimeout(resolve, baseDelay * 2 ** i));
        }
      }
      return undefined;
    }

    const promise = retryWithBackoff(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error(`第 ${attempts} 次失败`);
      return 'success';
    });

    // 需要在每个 await 点推进虚拟时间。用循环推进足够多的时间直到完成。
    for (let i = 0; i < 5; i += 1) {
      mock.timers.tick(1_000);
      // 让微任务队列有机会执行（真实项目里一般用 vi.runAllTimersAsync 之类的 API）
      await Promise.resolve();
    }

    assert.strictEqual(await promise, 'success');
    assert.strictEqual(attempts, 3, '应当在第 3 次尝试成功');
  });
});

// ---------------------------------------------------------------------------
console.log('--- 5. 选型建议：什么时候该用替身 ---');
console.log('  该 mock：网络请求、数据库、文件系统、时间、随机数、邮件/短信、支付网关');
console.log('  不该 mock：自己项目内的纯函数、值对象、简单的工具函数');
console.log('  判断标准：如果 mock 掉它之后，测试就只能在验证"我的假设"，');
console.log('            而不能发现真实集成问题，那就不该 mock。');
console.log('');
console.log('演示结束。');
