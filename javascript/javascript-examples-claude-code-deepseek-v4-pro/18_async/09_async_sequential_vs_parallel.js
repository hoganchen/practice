/**
 * ============================================================================
 * 知识点：串行 await 与并行 Promise.all —— 用计时证明性能差异
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】进阶
 * 【前置知识】18_async/06_promise_combinators.js、18_async/07_async_await_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - 串行（sequential）：一个任务做完再做下一个，总耗时 = 各任务耗时之和。
 *    - 并行（parallel）：同时启动所有任务，总耗时 ≈ 最慢那个任务的时间。
 *    在 JS 里，"并行"指的是"并发等待"——异步任务本身在网络/磁盘那头跑，
 *    主线程只是同时等它们，所以不需要多线程。
 *
 * 2. 为什么需要
 *    三个各 60ms 的独立请求：串行要 180ms，并行只要 60ms，差 3 倍。
 *    接口越多差距越大。但并行不是万能的：有依赖关系（下一步要用上一步的结果）
 *    的任务必须串行；并发太高也会压垮下游服务（限制并发数见 15 篇）。
 *
 * 3. 核心语法要点
 *    - 串行写法：一个接一个 await。
 *    - 并行写法：先把 Promise 全部创建出来（此时任务已经启动），
 *      再用 Promise.all 一起 await。
 *    - 常见错误：写成 `await a(); await b();` 却以为是并行——
 *      因为每个 await 都等完了才创建下一个。
 *    - 判断"Is 是串行还是并行"的诀窍：看 Promise 是"何时被创建"的。
 *      在同一次同步执行中创建的多个 Promise 就是并行的。
 *
 * 4. 常见陷阱
 *    - 在循环里 await：把本可并行的任务写成了串行（见 10 篇）。
 *    - 为了"并行"而先 await 再存数组：此时每个都已落定，并行毫无意义。
 *    - 无脑全并行：几百个请求同时打出去，把自己或下游打挂（需要限流）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/09_async_sequential_vs_parallel.js
 *
 * 【预期输出】
 *   同一组任务在串行 / 并行 / 部分并行三种策略下的耗时对比。总耗时约 400ms。
 * ============================================================================
 */

const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

// 模拟一次"耗时 60ms 的远程调用"
const TASK_MS = 60;
const fetchItem = (id) => delay(TASK_MS, `数据-${id}`);

// ---------------------------------------------------------------------------
// 1. 串行：一个接一个
// ---------------------------------------------------------------------------

console.log('--- 1. 串行执行 ---');

async function sequential(ids) {
  const results = [];
  for (const id of ids) {
    // 关键：每一次 await 都要等上一个彻底完成，才会创建下一个 Promise
    results.push(await fetchItem(id));
  }
  return results;
}

const ids = [1, 2, 3];

let t0 = Date.now();
const seqResults = await sequential(ids);
const seqMs = Date.now() - t0;
console.log('结果：', seqResults);
console.log(`串行耗时：约 ${seqMs}ms（≈ ${TASK_MS} × ${ids.length}）`);

// ---------------------------------------------------------------------------
// 2. 并行：先全部启动，再一起等
// ---------------------------------------------------------------------------

console.log('\n--- 2. 并行执行（Promise.all） ---');

async function parallel(ids) {
  // 关键：下面这一行会**同时**创建三个 Promise。
  // Promise 一旦被创建，里面的异步任务就已经开始跑了，
  // 所以此刻三个 60ms 的定时器是同时计时的。
  const promises = ids.map((id) => fetchItem(id));

  // 然后才一起等。总耗时由最慢的那个决定。
  return Promise.all(promises);
}

t0 = Date.now();
const parResults = await parallel(ids);
const parMs = Date.now() - t0;
console.log('结果：', parResults);
console.log(`并行耗时：约 ${parMs}ms（≈ 最慢任务的 ${TASK_MS}ms）`);

console.log(`\n加速比：${(seqMs / parMs).toFixed(2)} 倍（接口越多，差距越明显）`);

// ---------------------------------------------------------------------------
// 3. 常见的"假并行"写法
// ---------------------------------------------------------------------------

console.log('\n--- 3. 陷阱：这是假并行 ---');

// 下面这种写法看起来很"整齐"，但每个 await 都阻塞了下一个 Promise 的创建，
// 所以它其实还是串行。这是初学者最容易犯的错。
async function fakeParallel(ids) {
  const results = [];
  for (const id of ids) {
    // 错误点：await 写在 push 的参数里，导致下一个 fetchItem 要等这一个完成
    results.push(await fetchItem(id));
  }
  return results;
}

t0 = Date.now();
await fakeParallel(ids);
const fakeMs = Date.now() - t0;
console.log(`"看起来像并行"的写法耗时：约 ${fakeMs}ms（和串行几乎一样）`);
console.log('判断窍门：看 fetchItem 是在哪一刻被调用的——被 await 挡住了，它就不可能并行');

// ---------------------------------------------------------------------------
// 4. 有依赖关系时必须串行
// ---------------------------------------------------------------------------

console.log('\n--- 4. 有依赖的任务只能串行 ---');

// 典型场景：要用上一步的结果去请求下一步，天然无法并行。
async function dependentFlow() {
  t0 = Date.now();
  const user = await delay(TASK_MS, { id: 'U-1', name: '小明' }); // 第一步
  const orders = await delay(TASK_MS, [`${user.name} 的订单-1`]); // 依赖 user
  const detail = await delay(TASK_MS, `${orders[0]} 的详情`); // 依赖 orders
  return { user, orders, detail, ms: Date.now() - t0 };
}

const dep = await dependentFlow();
console.log('依赖链结果：', dep.detail);
console.log(`依赖链耗时：约 ${dep.ms}ms（只能串行，无法优化）`);

// 优化思路：把"无依赖的部分"拆出来并行。比如"用户信息"和"系统配置"
// 互不依赖，就可以并行；之后再串行做依赖它们的步骤。

// ---------------------------------------------------------------------------
// 5. 混合策略：先并行拿基础数据，再串行做依赖步骤
// ---------------------------------------------------------------------------

console.log('\n--- 5. 混合策略 ---');

async function mixedStrategy() {
  t0 = Date.now();

  // 第一批：两组互不依赖的数据，并行获取
  const [userInfo, config] = await Promise.all([
    delay(TASK_MS, { id: 'U-2', name: '小红' }),
    delay(TASK_MS, { siteName: '示例站点' }),
  ]);
  const phase1Ms = Date.now() - t0;

  // 第二批：依赖第一批结果，只能串行
  const greeting = await delay(TASK_MS, `${config.siteName} 欢迎 ${userInfo.name}`);

  return { greeting, phase1Ms, totalMs: Date.now() - t0 };
}

const mixed = await mixedStrategy();
console.log('  ', mixed.greeting);
console.log(`  第一批（并行）耗时：约 ${mixed.phase1Ms}ms`);
console.log(`  总耗时：约 ${mixed.totalMs}ms（如果全串行会是 ${TASK_MS * 3}ms）`);

// ---------------------------------------------------------------------------
// 6. 什么时候不该并行
// ---------------------------------------------------------------------------

console.log('\n--- 6. 并行的代价 ---');

console.log('  1. 有数据依赖的任务无法并行');
console.log('  2. 并发过高会打垮下游服务，需要限制并发数（见 15 篇）');
console.log('  3. 并行时"部分失败"的处理更复杂，要配合 allSettled 或逐个 catch');
console.log('  4. 并行任务的日志/错误堆栈会交织，排查问题难度上升');

// 演示"部分失败"：并行任务里有一个失败时，其它任务仍在后台跑完
console.log('\n--- 6.1 并行中部分失败 ---');

const results = await Promise.allSettled([
  delay(TASK_MS, '任务 A 成功'),
  new Promise((_, rej) => setTimeout(() => rej(new Error('任务 B 失败')), 20)),
  delay(TASK_MS, '任务 C 成功'),
]);
for (const r of results) {
  console.log(
    r.status === 'fulfilled'
      ? `  成功：${r.value}`
      : `  失败：${r.reason.message}`,
  );
}
console.log('  用 allSettled 就能拿到"成功的那些"，不会因为一个失败全部白做');

console.log(`\n总结：三组任务 × ${TASK_MS}ms —— 串行 ${seqMs}ms，并行 ${parMs}ms`);
console.log('\n示例结束。');
