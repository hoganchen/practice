/**
 * ============================================================================
 * 知识点：Promise 基础 —— 三种状态、executor 立即执行、then/catch/finally
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】进阶
 * 【前置知识】18_async/03_callback_hell.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Promise 是一个"表示未来某个结果的占位对象"。它有三种状态：
 *      - pending（待定）：还没有结果；
 *      - fulfilled（已兑现）：成功，带一个值；
 *      - rejected（已拒绝）：失败，带一个原因（通常是 Error）。
 *    状态只能从 pending 单向变为 fulfilled 或 rejected，且**只变一次**。
 *
 * 2. 为什么需要
 *    Promise 把"异步结果"变成了一个可以传递的值（而不是只能塞在回调参数里），
 *    于是：可以先返回、后注册回调；可以用 return 串起来；可以有统一的
 *    catch 集中处理错误；还可以整体 await。回调地狱的四个问题一次性解决。
 *
 * 3. 核心语法要点
 *    - new Promise(executor)：executor 是被**同步立即调用**的函数，
 *      接收 resolve 和 reject 两个参数。
 *    - resolve(v) 把状态变成 fulfilled；reject(e) 变成 rejected。
 *      先调用的那个生效，之后的调用一律被忽略。
 *    - then(onFulfilled, onRejected) 注册回调，回调总是**异步**执行（微任务）。
 *    - catch(fn) 等价于 then(undefined, fn)；finally(fn) 无论成败都执行，
 *      且不改变值。
 *    - 状态无法同步读取：只能通过 then/catch 注册回调来"等结果"。
 *
 * 4. 常见陷阱
 *    - 以为 Promise 是"马上就有值"的：pending 状态下拿不到任何结果。
 *    - 在 executor 里忘记调用 resolve/reject：Promise 永远 pending。
 *    - executor 内部的同步抛错会让 Promise 直接变成 rejected，
 *      所以别忘了 catch，否则会产生"未处理的拒绝"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/04_promise_basics.js
 *
 * 【预期输出】
 *   演示状态单向不可逆、executor 同步执行、then 异步回调、
 *   catch 与 finally 的行为。延时都在 20ms 以内。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. executor 是同步立即执行的
// ---------------------------------------------------------------------------

console.log('--- 1. executor 同步执行，回调异步执行 ---');

console.log('A [同步] 准备创建 Promise');

const p1 = new Promise((resolve, reject) => {
  // 下面这行会先在同步阶段打印，因为它属于 executor 函数体，
  // 而 executor 是被 new Promise 同步调用的。
  console.log('B [同步] executor 正在执行（注意它发生在 new 的那一刻）');

  // 真实的异步操作放在这里，比如网络请求、文件读写
  setTimeout(() => {
    resolve('异步操作的结果');
  }, 10);
});

console.log('C [同步] new Promise 之后继续执行同步代码');

// then 只是"注册"回调，不会立刻执行回调本身。
// 回调要等 Promise 变成 fulfilled 之后，作为微任务执行。
p1.then((value) => {
  console.log('D [微任务] then 回调收到：', value);
});

console.log('E [同步] 本轮同步代码结束（D 一定在 E 之后打印）');

// 输出顺序：A、B、C、E → D。
// 为什么 D 最后？因为 B 虽然"同步"执行了，但 resolve 是在 10ms 后的定时器里
// 才被调用，D 必须等到那时才会进入微任务队列。

// ---------------------------------------------------------------------------
// 2. 三种状态与"状态不可逆"
// ---------------------------------------------------------------------------

console.log('\n--- 2. 三种状态与状态不可逆 ---');

// 状态是内部的，外部拿不到。我们用一个"结果记录"来观察它会停在哪个状态。
const p2 = new Promise((resolve, reject) => {
  reject(new Error('第一次拒绝')); // 第一个生效的调用决定了最终状态
  resolve('这个 resolve 会被忽略'); // 状态已定，后续调用一律无效
  reject(new Error('这个拒绝也会被忽略'));
});

p2.then(
  (v) => console.log('  不该走到这里：', v),
  (e) => console.log('  then 的第二个参数拿到拒绝原因：', e.message),
);

// 用 catch 再注册一次回调：Promise 已经 rejected，
// 回调会被异步调度执行，而不是"状态已经没了"。
p2.catch((e) => console.log('  用 catch 也能拿到同一个原因：', e.message));

// 演示 pending：一个永远不 resolve 的 Promise
const pPending = new Promise(() => {
  // 什么都不做，它就是 pending 状态
});
const pendingRace = Promise.race([
  pPending,
  // 用 10ms 定时器"陪跑"，10ms 后我们就能确认 pPending 自己没有产生任何回调
  new Promise((resolve) => setTimeout(() => resolve('陪跑结束'), 10)),
]);

pendingRace.then((winner) => {
  console.log('  永远 pending 的 Promise 没有赢，赢的是：', winner);
});

// ---------------------------------------------------------------------------
// 3. then / catch / finally 三件套
// ---------------------------------------------------------------------------

console.log('\n--- 3. then / catch / finally ---');

const p3 = new Promise((resolve) => {
  setTimeout(() => resolve(42), 5);
});

p3
  .then((v) => {
    console.log('  then 收到值：', v);
    return v * 2; // 返回值会传给下一个 then
  })
  .catch((e) => {
    // 上面没有出错，所以这里不会执行——但写成链式是推荐做法
    console.log('  不该走到这里：', e.message);
  })
  .finally(() => {
    // finally 无论成功失败都会执行，且它的返回值会被忽略（不改变链上的值）
    console.log('  finally 执行了（常用于关闭加载状态、释放资源）');
  });

// catch 也能捕获 executor 里同步抛出的错误
const p4 = new Promise(() => {
  throw new Error('executor 里同步抛出的错误');
});
p4.catch((e) => console.log('  catch 捕获 executor 的同步抛错：', e.message));

// ---------------------------------------------------------------------------
// 4. 拒绝的多种处理方式（避免"未处理的拒绝"）
// ---------------------------------------------------------------------------

console.log('\n--- 4. 处理拒绝的三种写法 ---');

// 写法一：then 的第二个参数
new Promise((_, reject) => setTimeout(() => reject(new Error('错误-1')), 5)).then(
  (v) => console.log('  不该执行：', v),
  (e) => console.log('  写法一（then 第二参）捕获：', e.message),
);

// 写法二：catch（更常用，因为它能捕获链上任何一环的错误）
new Promise((_, reject) => setTimeout(() => reject(new Error('错误-2')), 5))
  .then(() => console.log('  不该执行'))
  .catch((e) => console.log('  写法二（catch）捕获：', e.message));

// 写法三：finally 兜底 + catch
new Promise((_, reject) => setTimeout(() => reject(new Error('错误-3')), 5))
  .finally(() => console.log('  写法三：finally 先执行（无论成败）'))
  .catch((e) => console.log('  写法三（finally 后 catch）捕获：', e.message));

// 重要提醒：如果创建的 Promise 被拒绝却始终没人调用 then/catch/finally，
// Node.js 会报 "UnhandledPromiseRejection" 并终止进程。
// 所以每个可能失败的 Promise 都要有归宿。

// ---------------------------------------------------------------------------
// 5. 手动把一个回调式 API 包成 Promise（预告 14 篇的 promisify）
// ---------------------------------------------------------------------------

console.log('\n--- 5. 用 Promise 包装回调式 API ---');

// 这个函数体现了 Promise 的基本套路：
// 把"结果"通过 resolve/reject 交出去，而不是通过回调参数。
function readValueAsync(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id > 0) {
        resolve({ id, name: `项目-${id}` });
      } else {
        reject(new Error(`非法的 id：${id}`));
      }
    }, 5);
  });
}

readValueAsync(1)
  .then((item) => console.log('  成功：', item))
  .catch((e) => console.log('  失败：', e.message));

readValueAsync(-1)
  .then((item) => console.log('  这一行不会执行：', item))
  .catch((e) => console.log('  失败：', e.message));

// 最后等所有异步打印完成后收尾（用 setTimeout 排到最后）
setTimeout(() => {
  console.log('\n示例结束。');
}, 20);
