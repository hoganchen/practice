/**
 * ============================================================================
 * 知识点：Promise 四大组合器 —— all / allSettled / race / any
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】进阶
 * 【前置知识】18_async/05_promise_chaining.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    组合器把"多个 Promise"合并成"一个 Promise"。四个成员的区别在于
 *    "什么时候算完成"以及"失败怎么处理"：
 *      - Promise.all        全部成功才成功；任何一个失败就立即失败。
 *      - Promise.allSettled 等到全部"落定"（无论成功失败），永不拒绝。
 *      - Promise.race       第一个"落定"的说了算（成功或失败都算）。
 *      - Promise.any        第一个"成功"的说了算；全部失败才拒绝。
 *
 * 2. 为什么需要
 *    实际业务里并发是常态：同时请求多个接口、给多个候选地址发探测、
 *    给异步操作加超时。没有组合器，就得手写计数器自己管理"还剩几个"，
 *    很容易写出重复 resolve、错误提前吞掉之类的 bug。
 *
 * 3. 核心语法要点
 *    - 输入可以是 Promise 数组，也可以是任意可迭代对象（里面允许混普通值）。
 *    - all / allSettled 的结果**顺序与输入顺序一致**，与谁先完成无关。
 *    - allSettled 每项结果是 { status: 'fulfilled', value } 或
 *      { status: 'rejected', reason }。
 *    - any 全部失败时抛的是 AggregateError，可以用 err.errors 取到全部原因。
 *    - race 的"第一"是按落定时间算的；如果最快的那个失败，race 就失败。
 *
 * 4. 常见陷阱
 *    - 用 all 做"能容忍部分失败"的事情：一个失败整批白做，应该用 allSettled。
 *    - 用 all 的返回值乱序假设：结果顺序是输入顺序，不是完成顺序。
 *    - 用 race 实现超时：慢的那个 Promise 并不会被取消，它仍在后台跑
 *      （真正的取消要用 AbortController，见 13 篇）。
 *    - 传空数组：all / allSettled / any 立即兑现（any 会拒绝），
 *      race 会永远 pending。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/06_promise_combinators.js
 *
 * 【预期输出】
 *   四个组合器各自成功/失败场景的输出，以及一张适用场景对照表。延时 ≤ 60ms。
 * ============================================================================
 */

// 工具：延时后成功
const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
// 工具：延时后失败（必须延迟后才 reject，避免产生"当前轮次无人处理"的拒绝）
const delayReject = (ms, message) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

// ---------------------------------------------------------------------------
// 1. Promise.all —— 全部成功才成功
// ---------------------------------------------------------------------------

console.log('--- 1. Promise.all：全成功才成功 ---');

const t1 = Date.now();

// 三个任务分别耗时 30ms / 10ms / 20ms，但它们是**同时开始**的，
// 所以总耗时由最慢的那个决定（约 30ms），而不是 30+10+20=60ms。
const allResult = await Promise.all([
  delay(30, '任务A（30ms 完成）'),
  delay(10, '任务B（10ms 完成，但它排在第二）'),
  delay(20, '任务C（20ms 完成）'),
]);

console.log('耗时约：', Date.now() - t1, 'ms（等于最慢任务的时间）');
console.log('结果顺序与输入一致：', allResult);
// 注意：任务 B 最先完成，但它仍然排在结果数组的第 2 位。
// all 保证"顺序 = 输入顺序"，这正是它和 race 的关键差别之一。

// 失败场景：任一失败，整体立即失败
try {
  await Promise.all([
    delay(10, '成功-1'),
    delayReject(5, '接口 2 挂了'),
    delay(50, '成功-3（根本等不到它）'),
  ]);
} catch (err) {
  console.log('all 的失败：', err.message, '（第一个失败立刻打断，不等其它）');
}

// ---------------------------------------------------------------------------
// 2. Promise.allSettled —— 等所有任务落定，永不拒绝
// ---------------------------------------------------------------------------

console.log('\n--- 2. Promise.allSettled：全部落定，永不拒绝 ---');

const settled = await Promise.allSettled([
  delay(10, '成功的结果'),
  delayReject(5, '失败的原因'),
  delay(20, '另一个成功的结果'),
]);

// 每一项都是 { status, value } 或 { status, reason }
for (const [i, item] of settled.entries()) {
  if (item.status === 'fulfilled') {
    console.log(`  第 ${i + 1} 项：成功 ->`, item.value);
  } else {
    console.log(`  第 ${i + 1} 项：失败 ->`, item.reason.message);
  }
}

// 统计成功率是 allSettled 的典型用法
const okCount = settled.filter((s) => s.status === 'fulfilled').length;
console.log(`  共 ${settled.length} 项，成功 ${okCount} 项`);

// ---------------------------------------------------------------------------
// 3. Promise.race —— 第一个落定的说了算
// ---------------------------------------------------------------------------

console.log('\n--- 3. Promise.race：第一个落定者胜出 ---');

const raceWinner = await Promise.race([
  delay(20, '慢任务'),
  delay(5, '快任务'),
  delay(30, '更慢任务'),
]);
console.log('  第一个完成的是：', raceWinner);

// 关键区别：race 不看成功失败，只看"谁先落定"。
// 所以如果最快的那个是失败，race 就整体失败。
try {
  await Promise.race([delayReject(5, '快任务但失败了'), delay(20, '慢任务成功')]);
} catch (err) {
  console.log('  最快的落定者是失败，race 整体失败：', err.message);
}

// race 的经典用法：给操作加超时（详见 13 篇）
function withTimeout(promise, ms) {
  const timeout = delayReject(ms, `操作超时（${ms}ms）`);
  return Promise.race([promise, timeout]);
}
await withTimeout(delay(10, '按时完成'), 50)
  .then((v) => console.log('  带超时的操作成功：', v))
  .catch((e) => console.log('  不该走到这里：', e.message));

await withTimeout(delay(50, '来不及了'), 10)
  .then((v) => console.log('  不该走到这里：', v))
  .catch((e) => console.log('  带超时的操作失败：', e.message));

// ---------------------------------------------------------------------------
// 4. Promise.any —— 第一个成功者胜出
// ---------------------------------------------------------------------------

console.log('\n--- 4. Promise.any：第一个成功者胜出（失败被忽略） ---');

const anyWinner = await Promise.any([
  delayReject(5, '镜像站 1 挂了'),
  delay(20, '镜像站 2 的响应'),
  delay(30, '镜像站 3 的响应'),
]);
console.log('  第一个成功的是：', anyWinner, '（前 5ms 的失败被忽略）');

// 全部失败时才拒绝，并且抛出 AggregateError
try {
  await Promise.any([
    delayReject(5, '候选 1 失败'),
    delayReject(10, '候选 2 失败'),
  ]);
} catch (err) {
  console.log('  全部失败，错误类型：', err.constructor.name);
  console.log('  是否为 AggregateError：', err instanceof AggregateError);
  console.log('  全部失败原因：', err.errors.map((e) => e.message));
}

// ---------------------------------------------------------------------------
// 5. 边界：空数组的行为
// ---------------------------------------------------------------------------

console.log('\n--- 5. 边界情况：传入空数组 ---');

console.log('  Promise.all([]) ->', await Promise.all([]));
console.log('  Promise.allSettled([]) ->', await Promise.allSettled([]));

try {
  await Promise.any([]);
} catch (err) {
  console.log('  Promise.any([]) 会立即拒绝：', err.constructor.name);
}

// Promise.race([]) 会永远 pending，所以这里用 race 加一个陪跑者来演示，
// 而不是直接 await 它（那会让进程一直挂着）。
const raceEmpty = await Promise.race([Promise.race([]), delay(5, '陪跑者胜出')]);
console.log('  Promise.race([]) 永远 pending，所以：', raceEmpty);

// ---------------------------------------------------------------------------
// 6. 适用场景对照表
// ---------------------------------------------------------------------------

console.log('\n--- 6. 适用场景对照 ---');

const scenarios = [
  ['Promise.all', '多个接口都成功才算成功', '页面初始化时并发拉取配置、用户、权限'],
  ['Promise.allSettled', '允许部分失败，需要每项结果', '批量发送通知、统计批量任务的成功率'],
  ['Promise.race', '只要最快的那一个（无论是成功还是失败）', '请求超时控制、抢锁、探测最快节点'],
  ['Promise.any', '只要最快成功的那个，失败可以忽略', '多镜像源下载、多候选地址探测'],
];

for (const [name, rule, usage] of scenarios) {
  console.log(`  ${name.padEnd(20)} 语义：${rule}`);
  console.log(`  ${''.padEnd(20)} 场景：${usage}`);
}

console.log('\n示例结束。');
