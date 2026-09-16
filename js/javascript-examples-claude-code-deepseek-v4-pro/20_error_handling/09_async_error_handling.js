/**
 * ============================================================================
 * 知识点：异步错误处理 —— Promise 拒绝、await + try/catch、unhandledRejection
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】进阶
 * 【前置知识】20_error_handling/01_try_catch_finally.js、19_modules/09_dynamic_import.js
 *
 * 【也见】18_async/08_async_error_handling.js —— 同一主题的另一处完整讲解
 *        （await + try/catch、finally 清理、unhandledRejection 等要点两边都讲了）。
 *        本文件是「错误处理主线」的主场，侧重兜底、陷阱清单与同步/异步错误边界；
 *        那篇是「异步主线」的主场，侧重错误归宿与并发组合器的失败行为。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    异步代码的错误不走 try/catch 的同步通道，而是通过 Promise 的"拒绝（reject）"
 *    传播。三种处理手段：
 *      (1) promise.catch(onRejected)        在链式调用里捕获
 *      (2) try { await p } catch (e) {}     在 async 函数里像同步一样捕获
 *      (3) try { await p } finally {}       配合 finally 做清理
 *    如果没有任何地方处理拒绝，Node 会触发 'unhandledRejection' 事件，
 *    默认行为是打印警告并让进程以非零码退出。
 *
 * 2. 为什么需要
 *    (1) 异步错误"跑偏"的代价很高：一个未处理的拒绝可能悄悄让任务永远不完成，
 *        或者在有回调的链路上造成资源泄漏。
 *    (2) await + try/catch 让异步代码的错误处理看起来和同步代码一样直观，
 *        这是 async/await 相比裸 Promise 最大的可读性收益之一。
 *    (3) unhandledRejection 是最后的观测点：用来记录日志、上报监控，
 *        在进程退出前保存现场。
 *
 * 3. 核心语法要点
 *    (1) 在 async 函数中，`await p` 如果 p 被拒绝，会**抛出**那个拒绝原因，
 *        所以能用 try/catch 接住。
 *    (2) 没有 await 也没有 .catch() 的 Promise 拒绝，会在当前事件循环轮次结束后
 *        触发 'unhandledRejection'（进程级事件，需要在最后注册兜底处理）。
 *    (3) 一旦某个拒绝被处理（加了 .catch 或 await 接住），就不会再触发该事件；
 *        如果拒绝被"迟到地"处理，还会触发 'rejectionHandled'。
 *    (4) 用 process.on('unhandledRejection', handler) 注册监听，
 *        用 process.off(...) 移除（本示例演示完就移除，避免影响后续示例）。
 *    (5) async 函数里的 throw 等价于返回一个被拒绝的 Promise；
 *        同理，返回 Promise.reject(x) 与 throw x 效果一致。
 *
 * 4. 常见陷阱
 *    (1) 忘记 await：`doAsync().catch(...)` 写了但主流程没等它，错误处理被"跳过"。
 *    (2) 在 forEach 里用 async 回调：forEach 不会等待，错误也不会被捕获。
 *        请用 for...of + await 或 Promise.all。
 *    (3) try/catch 包住了 Promise 的创建但没有 await，导致 catch 永远不触发：
 *          try { doAsync(); } catch (e) {}   // ✗ 捕获不到
 *          try { await doAsync(); } catch (e) {} // ✓
 *    (4) 在 catch 里又 await 一个会失败的操作且没再处理，产生新的未处理拒绝。
 *    (5) 一个 reject 被两个地方处理（如同时 await 和 .catch），语义混乱且容易重复记录。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/09_async_error_handling.js
 *
 * 【预期输出】
 *   演示 Promise 链式捕获、await + try/catch、finally 清理、
 *   未处理拒绝事件的注册与触发（用完即移除监听），以及常见陷阱的对比。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Promise 的两种状态与拒绝
// ---------------------------------------------------------------------------

console.log('--- 1. Promise 的拒绝 ---');

/**
 * 一个会失败的异步操作（不访问网络，纯本地模拟）
 * @param {string} reason 失败原因
 * @returns {Promise<never>}
 */
function fail(reason) {
  return Promise.reject(new Error(reason));
}

/**
 * 一个会成功的异步操作
 * @param {unknown} value
 * @returns {Promise<unknown>}
 */
function succeed(value) {
  return Promise.resolve(value);
}

// 方式一：.then(onFulfilled, onRejected)
succeed('ok').then(
  (v) => console.log('  成功回调：', v),
  (e) => console.log('  失败回调：', e.message),
);

// 方式二：.catch()，等价且更常用
await fail('链式 catch 捕获到的错误')
  .catch((err) => console.log('  .catch 捕获：', err.message))
  .finally(() => console.log('  .finally 执行：无论成功失败都会跑'));

// ---------------------------------------------------------------------------
// 2. async / await + try / catch / finally
// ---------------------------------------------------------------------------

console.log('\n--- 2. await + try/catch/finally ---');

/**
 * 模拟一个分步骤的异步流程
 * @param {boolean} shouldFail 是否在某一步失败
 * @returns {Promise<string>}
 */
async function multiStepFlow(shouldFail) {
  let resource = '未打开';

  try {
    console.log('  [try] 打开资源');
    resource = '已打开';
    await new Promise((r) => setTimeout(r, 5)); // 模拟异步操作

    if (shouldFail) {
      throw new Error('中间步骤失败了'); // async 函数里 throw = 返回被拒绝的 Promise
    }

    return `流程成功（${resource}）`;
  } catch (err) {
    console.log('  [catch] 捕获：', err.message);
    return `流程失败但已优雅处理（${resource}）`;
  } finally {
    // 清理逻辑：不管成功失败都要释放资源
    resource = '已关闭';
    console.log('  [finally] 释放资源 →', resource);
  }
}

console.log('成功路径：', await multiStepFlow(false));
console.log('失败路径：', await multiStepFlow(true));

// ---------------------------------------------------------------------------
// 3. 陷阱：漏掉 await，catch 就形同虚设
// ---------------------------------------------------------------------------

console.log('\n--- 3. 陷阱：漏掉 await 会捕获不到 ---');

// 错误示范：调用但没有 await，try/catch 接不住
let orphanPromise;
try {
  orphanPromise = fail('这个拒绝不会被下面的 catch 接住');
  console.log('  [错误示范] try 块正常走完了，但 Promise 其实已经拒绝了');
} catch {
  console.log('  [错误示范] 这行不会执行');
}
// 注意：orphanPromise 此刻是一个"没人处理"的拒绝。
// 如果一直没人管它，进程会触发 unhandledRejection（见第 5 节）。
// 这里立刻补一个 .catch 把它接住，既证明"事后补救可行"，
// 也避免这个拒绝影响后面的示例（真实项目里这就是一个 bug）。
orphanPromise.catch((err) => console.log('  [事后补救] 用 .catch 才处理了它：', err.message));

// 正确示范：await 之后才能被 catch 接住
try {
  await fail('这个拒绝会被 catch 接住');
} catch (err) {
  console.log('  [正确示范] catch 接住了：', err.message);
}

// ---------------------------------------------------------------------------
// 4. 陷阱：在 forEach 里用 async 回调
// ---------------------------------------------------------------------------

console.log('\n--- 4. 陷阱：forEach + async ---');

const ids = [1, 2, 3];

/**
 * 异步处理一条数据
 * @param {number} id
 * @returns {Promise<string>}
 */
async function handleOne(id) {
  await new Promise((r) => setTimeout(r, 5));
  if (id === 2) throw new Error(`处理 ${id} 失败`);
  return `处理 ${id} 成功`;
}

// 错误示范：forEach 不会等待 async 回调，错误也无人接管
ids.forEach(async (id) => {
  try {
    await handleOne(id);
  } catch (err) {
    console.log('  [forEach] 内部虽然捕到了：', err.message, '但 forEach 不会等它');
  }
});
console.log('  [forEach] forEach 之后的代码立刻执行（说明它没有等待）');

// 正确示范一：串行 for...of + await（顺序执行，遇错可中断）
console.log('  串行处理（for...of）：');
for (const id of ids) {
  try {
    console.log('   ', await handleOne(id));
  } catch (err) {
    console.log('    ', err.message, '（串行模式下可在此决定是否继续）');
  }
}

// 正确示范二：并行 Promise.allSettled（全都跑完，各自报告结果）
console.log('  并行处理（Promise.allSettled）：');
const results = await Promise.allSettled(ids.map((id) => handleOne(id)));
for (const r of results) {
  console.log('   ', r.status === 'fulfilled' ? r.value : `失败：${r.reason.message}`);
}

// 如果确实需要"并发 + 全部成功才算成功"，用 Promise.all（fail-fast）
try {
  await Promise.all(ids.map((id) => handleOne(id)));
} catch (err) {
  console.log('  Promise.all 遇到第一个失败就整体拒绝：', err.message);
}

// ---------------------------------------------------------------------------
// 5. unhandledRejection：最后的兜底观测点
// ---------------------------------------------------------------------------

console.log('\n--- 5. unhandledRejection 事件 ---');

/** 记录本次示例捕获到的未处理拒绝 */
const caughtUnhandled = [];

/**
 * 未处理拒绝的处理器
 * @param {unknown} reason 拒绝原因
 * @param {Promise} promise 被拒绝的 Promise
 */
function onUnhandledRejection(reason, promise) {
  caughtUnhandled.push(reason instanceof Error ? reason.message : String(reason));
  console.log('  [unhandledRejection] 捕获到未处理的拒绝：', reason instanceof Error ? reason.message : reason);
  console.log('  [unhandledRejection] 对应的 Promise 是：', promise.constructor.name);
  // 真实项目里这里应该：写日志、上报监控、决定是否优雅退出
}

// 注册监听（注意：本示例跑完会移除它，避免影响进程的其它部分）
process.on('unhandledRejection', onUnhandledRejection);
console.log('  已注册 unhandledRejection 监听器');

// 制造一个没有 .catch、也没有 await 的拒绝
// 注意：这个拒绝不会被任何人处理，只会触发上面的事件
Promise.reject(new Error('这是一个无人处理的拒绝'));

// 未处理拒绝的事件是在当前事件循环的微任务队列清空后触发的，
// 所以需要让出一次事件循环，才能看到它被触发。
await new Promise((resolve) => setImmediate(resolve));

console.log('  捕获结果：', caughtUnhandled);

// 用完即移除监听器（非常重要：本示例只是演示，不应长期占用进程级监听）
process.off('unhandledRejection', onUnhandledRejection);
console.log('  已移除 unhandledRejection 监听器');

// 验证移除是否生效：再制造一个未处理拒绝，此时不会有任何输出（也不会崩溃，
// 因为 Node 默认的未处理拒绝处理策略是在本进程已经因它退出过一次后…… 实际上
// 由于此处监听器已移除，Node 会采用默认行为。为避免示例进程异常退出，
// 这里不再真的制造拒绝，只做说明。）
console.log('  说明：移除监听后，未处理的拒绝会回到 Node 的默认行为（打印警告并退出）。');
console.log('  所以生产环境应**长期注册**该监听，本示例为了不影响后续代码才移除。');

// ---------------------------------------------------------------------------
// 6. 同步错误 vs 异步错误
// ---------------------------------------------------------------------------

console.log('\n--- 6. 同步错误与异步错误的边界 ---');

/**
 * 一个"半同步半异步"的函数：参数校验是同步抛错，后续操作是异步
 * @param {unknown} value
 * @returns {Promise<unknown>}
 */
function halfSyncHalfAsync(value) {
  // 同步抛错：即使用 try/catch 包住调用点也无法用 .catch 处理
  if (typeof value !== 'number') {
    throw new TypeError('value 必须是数字');
  }
  return succeed(value * 2); // 返回 Promise
}

// 关键结论：async 函数里抛出的错误会变成"被拒绝的 Promise"；
// 而普通函数里抛出的错误就是同步异常。两种情况用 try/catch + await 都能接住：
try {
  await halfSyncHalfAsync('abc'); // 普通函数同步抛错 → 直接被 try 接住
} catch (err) {
  console.log('  同步抛错：', err.name, '-', err.message);
}

/**
 * 改成 async 函数后，抛错就变成"被拒绝的 Promise"
 * @param {unknown} value
 * @returns {Promise<number>}
 */
async function fullyAsync(value) {
  if (typeof value !== 'number') {
    throw new TypeError('value 必须是数字'); // 等价于 return Promise.reject(...)
  }
  return value * 2;
}

// 不 await 时，错误只会出现在 Promise 里（必须用 .catch 或 await 处理）
let ignoredPromise;
try {
  ignoredPromise = fullyAsync('abc'); // 没有 await → catch 接不住
  console.log('  async 函数抛错但没 await：catch 块不会执行');
} catch {
  console.log('  这行不会执行');
}
// 同上：这个拒绝必须有人接管，否则会触发 unhandledRejection
await ignoredPromise.catch((e) => console.log('  用 .catch 才接住了：', e.message));

console.log('\n--- 7. 小结 ---');
console.log('1) async 函数里的 throw 等于返回被拒绝的 Promise；');
console.log('2) 想用 try/catch 捕获异步错误，必须 await；');
console.log('3) forEach 不会等待 async 回调，请用 for...of / Promise.all / allSettled；');
console.log('4) 给进程注册 unhandledRejection 监听作为最后一道防线（长期保留）。');
