/**
 * ============================================================================
 * 知识点：超时与取消 —— Promise.race 加超时、AbortController 取消异步操作
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】高级
 * 【前置知识】18_async/06_promise_combinators.js、18_async/08_async_error_handling.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - 超时（timeout）：给异步操作设一个最长等待时间，到点就"放弃等待"。
 *    - 取消（abort）：通知正在进行的异步操作"别做了"，让它有机会提前结束
 *      并释放资源。
 *    两者的关键区别：超时只是"不再等它"，操作本身还在后台跑；
 *    取消是真正把"停止"的信号传给操作本身。
 *
 * 2. 为什么需要
 *    网络可能一直不回应。没有超时，用户会永远卡在 loading。
 *    没有取消，用户离开页面后请求还在跑，既浪费资源又可能把过期数据
 *    写进状态（经典的竞态问题）。AbortController 是 Web/Node 统一的取消标准。
 *
 * 3. 核心语法要点
 *    - 超时常用 Promise.race([操作, 定时拒绝]) 实现，几行就能写出来。
 *    - AbortController 有一个 signal 属性（AbortSignal）和一个 abort() 方法。
 *    - 异步函数接收 signal，监听它的 'abort' 事件，或用 signal.aborted 判断。
 *    - signal.reason 保存取消原因；abort(reason) 可以自定义原因。
 *    - AbortSignal.timeout(ms) 直接生成一个"到点自动中止"的 signal；
 *      AbortSignal.any([s1, s2]) 可以合并多个 signal（任一触发即触发）。
 *    - 被取消的操作通常抛出一个 name 为 'AbortError' 的错误。
 *
 * 4. 常见陷阱
 *    - 以为 Promise.race 的超时能"取消"慢操作：它只是不再等，慢操作还在跑，
 *      之后仍可能产生副作用（要真正取消必须用 AbortController）。
 *    - 忘记清理定时器：超时后定时器仍在跑，会拖住进程或被误判为未处理拒绝。
 *    - 取消后仍往状态里写数据，导致竞态。
 *    - 把 signal 传来传去却从不检查，等于没接。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/13_timeout_and_abort.js
 *
 * 【预期输出】
 *   超时生效／不生效两种情况，以及 AbortController 取消异步操作的完整过程。
 *   延时 ≤ 80ms。
 * ============================================================================
 */

const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

// ---------------------------------------------------------------------------
// 1. 用 Promise.race 实现超时
// ---------------------------------------------------------------------------

console.log('--- 1. Promise.race 实现超时 ---');

/**
 * withTimeout —— 给任意 Promise 加一个超时。
 * 原理：把"操作"和"到点就拒绝的定时器"一起放进 race，
 * 谁先落定就听谁的。
 */
function withTimeout(promise, ms, label = '操作') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}超时（${ms}ms）`)), ms);
  });

  // finally 里清掉定时器，避免它继续占着事件循环
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// 情况一：按时完成
await withTimeout(delay(15, '按时返回的数据'), 60, '快速接口')
  .then((v) => console.log('  情况一：', v))
  .catch((e) => console.log('  不该走到这里：', e.message));

// 情况二：超时
await withTimeout(delay(60, '太慢了'), 15, '慢速接口')
  .then((v) => console.log('  不该走到这里：', v))
  .catch((e) => console.log('  情况二：', e.message));

// ---------------------------------------------------------------------------
// 2. 超时的局限：慢操作并没有被取消
// ---------------------------------------------------------------------------

console.log('\n--- 2. 重要：race 超时只是"不再等"，不是"取消" ---');

let sideEffect = null;

// 这个"慢操作"在 40ms 后仍会执行它的副作用
const slowOperation = delay(40, '慢操作的数据').then((v) => {
  sideEffect = v; // 副作用照常发生
  return v;
});

await withTimeout(slowOperation, 10, '慢操作').catch((e) =>
  console.log('  10ms 就超时了：', e.message),
);

console.log('  此刻副作用还是 null：', sideEffect);
await delay(60, null); // 等到慢操作真正跑完
console.log('  60ms 后副作用变成了：', sideEffect, '——说明它压根没被取消');
console.log('  结论：想真正停下来，必须用 AbortController 把"取消信号"传进去');

// ---------------------------------------------------------------------------
// 3. AbortController 基础
// ---------------------------------------------------------------------------

console.log('\n--- 3. AbortController 基础用法 ---');

const controller = new AbortController();
console.log('  初始状态 signal.aborted：', controller.signal.aborted);

// 监听取消事件
controller.signal.addEventListener('abort', () => {
  // reason 就是 abort() 时传入的原因（这里是一个 Error 对象），取 .message 便于阅读
  console.log('  [监听器] 收到取消信号，原因是：', controller.signal.reason.message);
});

// 触发取消
controller.abort(new Error('用户点了返回按钮'));
console.log('  取消后 signal.aborted：', controller.signal.aborted);

// ---------------------------------------------------------------------------
// 4. 手写一个"支持取消"的异步操作
// ---------------------------------------------------------------------------

console.log('\n--- 4. 支持取消的异步操作 ---');

/**
 * cancellableFetch —— 模拟一个可取消的远程调用。
 * 要点：
 *  1. 进入时先检查 signal.aborted，已经取消就立即失败；
 *  2. 监听 'abort' 事件，取消时清理定时器并拒绝 Promise；
 *  3. 正常完成时移除监听器，避免内存泄漏。
 */
function cancellableFetch(url, { signal, ms = 50 } = {}) {
  return new Promise((resolve, reject) => {
    // 情况 A：进来之前就已经被取消了
    if (signal?.aborted) {
      reject(signal.reason ?? new Error('操作已取消'));
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve(`来自 ${url} 的数据`);
    }, ms);

    function onAbort() {
      clearTimeout(timer); // 关键：把还没触发的定时器清掉，才算真的停下来
      cleanup();
      reject(signal.reason ?? new Error('操作已取消'));
    }

    function cleanup() {
      signal?.removeEventListener('abort', onAbort);
    }

    // 情况 B：执行过程中被取消
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// 4.1 正常完成
const c1 = new AbortController();
await cancellableFetch('/api/users', { signal: c1.signal, ms: 15 })
  .then((v) => console.log('  正常完成：', v))
  .catch((e) => console.log('  不该走到这里：', e.message));

// 4.2 中途取消
const c2 = new AbortController();
setTimeout(() => c2.abort(new Error('用户取消了请求')), 10); // 10ms 后取消
await cancellableFetch('/api/orders', { signal: c2.signal, ms: 40 })
  .then((v) => console.log('  不该走到这里：', v))
  .catch((e) => console.log('  中途取消：', e.message));

// 4.3 已经取消后再调用（典型竞态：用户连点两次）
const c3 = new AbortController();
c3.abort(new Error('组件已卸载'));
await cancellableFetch('/api/profile', { signal: c3.signal, ms: 20 })
  .then((v) => console.log('  不该走到这里：', v))
  .catch((e) => console.log('  进来时已取消：', e.message));

// ---------------------------------------------------------------------------
// 5. AbortSignal.timeout 与 AbortSignal.any
// ---------------------------------------------------------------------------

console.log('\n--- 5. 内置的 AbortSignal.timeout / any ---');

console.log('  支持 AbortSignal.timeout 吗：', typeof AbortSignal.timeout === 'function');
console.log('  支持 AbortSignal.any 吗：', typeof AbortSignal.any === 'function');

if (typeof AbortSignal.timeout === 'function') {
  // 直接生成一个"到点自动中止"的 signal，不用再手写定时器 + race
  const timeoutSignal = AbortSignal.timeout(15);
  await cancellableFetch('/api/slow', { signal: timeoutSignal, ms: 50 })
    .then((v) => console.log('  不该走到这里：', v))
    .catch((e) => console.log('  AbortSignal.timeout 生效，原因类型：', e.name));
}

if (typeof AbortSignal.any === 'function') {
  // any 把多个 signal 合并：任何一个触发，合并后的 signal 就触发
  const userController = new AbortController();
  const merged = AbortSignal.any([userController.signal, AbortSignal.timeout(100)]);

  setTimeout(() => userController.abort(new Error('用户主动取消（合并信号）')), 10);
  await cancellableFetch('/api/merged', { signal: merged, ms: 50 })
    .then((v) => console.log('  不该走到这里：', v))
    .catch((e) => console.log('  合并信号触发：', e.message));
}

// ---------------------------------------------------------------------------
// 6. 把"超时"和"取消"结合起来
// ---------------------------------------------------------------------------

console.log('\n--- 6. 超时 + 取消 的完整方案 ---');

/**
 * fetchWithCancel —— 同时具备超时与主动取消能力。
 * 用 AbortController 自己驱动超时（而不是 race），
 * 这样超时也能真正取消底层操作，而不是"不再等"。
 */
async function fetchWithCancel(url, { timeoutMs = 30, externalSignal } = {}) {
  const own = new AbortController();

  // 超时一到就 abort，真正把取消信号传进去
  const timer = setTimeout(
    () => own.abort(new Error(`请求超时（${timeoutMs}ms）`)),
    timeoutMs,
  );

  // 如果外部还传了自己的 signal，就桥接过来
  const onExternalAbort = () => own.abort(externalSignal.reason);
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

  try {
    return await cancellableFetch(url, { signal: own.signal, ms: 60 });
  } finally {
    clearTimeout(timer); // 无论成败都要清掉定时器
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

await fetchWithCancel('/api/fast', { timeoutMs: 80 })
  .then((v) => console.log('  超时前完成：', v))
  .catch((e) => console.log('  不该走到这里：', e.message));

await fetchWithCancel('/api/slow', { timeoutMs: 15 })
  .then((v) => console.log('  不该走到这里：', v))
  .catch((e) => console.log('  超时并真的取消了：', e.message));

const userCancel = new AbortController();
setTimeout(() => userCancel.abort(new Error('用户手动取消')), 5);
await fetchWithCancel('/api/manual', { timeoutMs: 80, externalSignal: userCancel.signal })
  .then((v) => console.log('  不该走到这里：', v))
  .catch((e) => console.log('  用户取消生效：', e.message));

console.log('\n示例结束。');
