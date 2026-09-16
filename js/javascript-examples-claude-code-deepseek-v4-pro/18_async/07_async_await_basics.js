/**
 * ============================================================================
 * 知识点：async / await 基础 —— async 函数返回 Promise，await 在等什么
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】进阶
 * 【前置知识】18_async/05_promise_chaining.js、17_iterators_and_generators/10_generator_practical.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - async 函数：声明前加 async 关键字的函数。它**总是返回一个 Promise**：
 *      函数里 return 的值会成为兑现值，throw 的错误会成为拒绝原因。
 *    - await 表达式：只能写在 async 函数（或 ESM 顶层）里。它会
 *      "暂停当前函数的执行"，等右侧的 Promise 落定后，把兑现值作为整个
 *      await 表达式的值继续往下跑；如果 Promise 被拒绝，await 会在
 *      当前这一行**抛出**那个错误（所以能用 try/catch 捕获）。
 *
 * 2. 为什么需要
 *    Promise 链虽然解决了嵌套，但把流程拆成了一段段回调，"先做什么、
 *    再做什么"被 then 分隔开。async/await 让异步代码长得和同步代码一样：
 *    顺序、分支、循环、try/catch 全部可以直接用，可读性大幅提升。
 *    （它本质上是 17/10 篇那个"生成器 + 驱动器"模式的语法糖。）
 *
 * 3. 核心语法要点
 *    - await 只等待 Promise；普通值会被包装成已兑现的 Promise，
 *      但**仍然会让出一次执行权**（产生一次微任务暂停）。
 *    - await 是"暂停当前函数"，不是"阻塞主线程"：函数让出控制权后，
 *      主线程继续跑别的代码。
 *    - async 函数里的 return 相当于 resolve，throw 相当于 reject。
 *    - ESM 模块顶层可以直接用 await（顶层 await）。
 *    - 顺序写多个 await＝串行；想并行要先创建 Promise 再 await。
 *
 * 4. 常见陷阱
 *    - 忘记 await：拿到的是一个 pending 的 Promise，而不是结果。
 *    - 以为 await 会阻塞整个进程：它只暂停当前 async 函数。
 *    - 在循环里无脑 await：明明是独立的多个请求，却写成了串行（见 10 篇）。
 *    - 在非 async 函数里用 await：语法错误。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/07_async_await_basics.js
 *
 * 【预期输出】
 *   带编号的日志，展示 async 函数返回 Promise、await 的暂停与恢复顺序、
 *   以及 async/await 与 then 写法的等价性。延时 ≤ 50ms。
 * ============================================================================
 */

const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const delayReject = (ms, message) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

// ---------------------------------------------------------------------------
// 1. async 函数总是返回 Promise
// ---------------------------------------------------------------------------

console.log('--- 1. async 函数总是返回 Promise ---');

async function returnNumber() {
  return 42; // 普通返回值会被包成一个已兑现的 Promise
}

const r1 = returnNumber();
console.log('调用 async 函数拿到的是：', r1.constructor.name);
console.log('是 Promise 吗：', r1 instanceof Promise);
// 想拿值必须 await 或 then
r1.then((v) => console.log('  then 拿到：', v));

async function returnNothing() {}

// 没有 return 的 async 函数，兑现值是 undefined（而不是没有值）
returnNothing().then((v) => console.log('  没有 return 时兑现值：', v));

async function returnPromise() {
  // 返回 Promise 时会被"等待并展开"，和 then 的扁平化规则一致
  return delay(5, '内层 Promise 的值');
}
returnPromise().then((v) => console.log('  返回 Promise 时兑现值：', v, '（被展开，不是 Promise 对象）'));

// ---------------------------------------------------------------------------
// 2. await 的暂停与恢复（为什么这行先打印）
// ---------------------------------------------------------------------------

console.log('\n--- 2. await 暂停的是当前函数，不是整个进程 ---');

async function demoAwait() {
  console.log('  1 [async 内部] 函数开始执行');

  // 执行到这一行：右侧的 Promise 已经创建好（定时器已注册），
  // 然后函数在这里"暂停"，把控制权还给调用者。
  const v = await delay(10, '异步结果');
  console.log('  4 [async 内部] await 之后恢复，拿到：', v);

  return 'demoAwait 的返回值';
}

const p = demoAwait();
console.log('  2 [主线程] async 函数调用后立刻返回，我继续跑');

// 插一个微任务，验证 await 恢复是"微任务级"的调度
Promise.resolve().then(() => console.log('  3 [微任务] 微任务比 10ms 的定时器先执行'));

p.then((v) => console.log('  5 [主线程] async 函数的最终结果：', v));

// 打印顺序是 1、2、3、4、5。
// 关键理解：1 之后函数暂停（并没有卡住主线程），所以 2 立刻打印；
// 3 是微任务，秒回；4 要等 10ms 的定时器；5 要等 async 函数彻底返回。

// ---------------------------------------------------------------------------
// 3~5 节：用一段 async 流程串起来，保证输出顺序清晰
// ---------------------------------------------------------------------------
//
// 为什么这里不用一堆独立的 setTimeout？
// 因为多个定时器各自延时，输出很容易互相穿插。把它们放进同一个 async
// 函数里用 await 排成队列，输出顺序就完全确定了——这本身就是
// async/await 相比回调的一个好处：用同步的写法控制异步的顺序。

async function runLaterSections() {
  // -------------------------------------------------------------------------
  // 3. await 一个非 Promise 值
  // -------------------------------------------------------------------------

  console.log('\n--- 3. await 普通值时也会让出一次执行权 ---');
  console.log('  A [同步] 异步段开始');

  // 把"恢复后要执行的代码"放进另一个 async 函数，方便观察它被推迟到哪里
  const inner = (async () => {
    const v = await 100; // 100 不是 Promise，会被包装成 Promise.resolve(100)
    console.log('  C [微任务] await 100 的恢复：', v);
  })();

  // A -> B -> C 的 B：它属于同一段同步代码，必然排在 C 之前。
  // 说明即使等待的"值"是现成的，await 依然要让出一次执行权，
  // 恢复动作被排进微任务队列，必须等当前同步代码跑完。
  console.log('  B [同步] 这一行排在 C 之前');

  await inner; // 等它跑完，保证本段输出完整

  // -------------------------------------------------------------------------
  // 4. await 的错误处理：等价于 try/catch 同步写法
  // -------------------------------------------------------------------------

  console.log('\n--- 4. await 会把拒绝变成"抛出" ---');

  // 关键：await 一个被拒绝的 Promise，会在当前位置抛错，
  // 于是可以直接用 try/catch 捕获——这是 async/await 相比 then 最大的便利。
  try {
    const v = await delayReject(5, '接口返回 500');
    console.log('  不该走到这里：', v);
  } catch (err) {
    console.log('  try/catch 捕获到：', err.message);
  }

  // 没有被 try/catch 包住的 await 拒绝，会让 async 函数返回的 Promise 拒绝
  const rejecting = (async () => {
    await delayReject(5, '没人接住我');
  })();
  await rejecting.catch((e) => console.log('  用 catch 接住 async 函数的拒绝：', e.message));

  // async 函数里的 throw 等价于 reject
  const throwing = (async () => {
    throw new Error('直接 throw 也是拒绝');
  })();
  await throwing.catch((e) => console.log('  async 里 throw：', e.message));

  // -------------------------------------------------------------------------
  // 5. async/await 与 then 的等价改写
  // -------------------------------------------------------------------------

  console.log('\n--- 5. 同一段逻辑的两种写法 ---');

  const fetchUser = () => delay(5, { id: 'U-1', name: '小明' });
  const fetchOrders = (user) => delay(5, [`${user.name} 的订单-1`, `${user.name} 的订单-2`]);

  // 写法一：Promise 链（注意它是"异步启动"的，不阻塞下面的代码）
  const chainPromise = fetchUser()
    .then((user) => fetchOrders(user))
    .then((orders) => console.log('  链式写法：', orders))
    .catch((e) => console.log('  链式写法出错：', e.message));

  // 写法二：async/await（同样的逻辑，读起来像同步代码）
  const asyncTask = (async () => {
    try {
      const user = await fetchUser();
      const orders = await fetchOrders(user);
      console.log('  async 写法：', orders);
    } catch (e) {
      console.log('  async 写法出错：', e.message);
    }
  })();

  // 两种写法都在"并发"进行，这里等它们都结束，保证输出顺序整齐
  await Promise.all([chainPromise, asyncTask]);
}

// 先把第 2 节的末尾输出等过去（10ms 的定时器），再开始后面的演示
await delay(20, null);
await runLaterSections();

// ---------------------------------------------------------------------------
// 6. 顶层 await（ESM 专有）
// ---------------------------------------------------------------------------

// 本仓库是 ESM（package.json 里 "type": "module"），所以模块顶层就能用 await。
// 注意：顶层 await 之后的所有代码都会被推迟到"这个 Promise 落定之后"才执行。
console.log('\n--- 6. 顶层 await ---');
console.log('  上面第 5 节的输出已经全部打印完了（因为这里等过它）');

const topLevelValue = await delay(5, '顶层 await 的结果');
console.log('  顶层 await 拿到：', topLevelValue);
console.log('  这两行之所以排在最后，是因为顶层 await 把后续代码推迟了');

console.log('\n示例结束。');
