/**
 * ============================================================================
 * 知识点：异步错误处理 —— try/catch 捕获 await 拒绝与拒绝的多种归宿
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】进阶
 * 【前置知识】18_async/07_async_await_basics.js
 *
 * 【也见】20_error_handling/09_async_error_handling.js —— 同一主题的另一处完整讲解。
 *        本文件是「异步主线」的主场：讲清错误有哪三种归宿、并发组合器如何失败；
 *        那篇是「错误处理主线」的主场，侧重兜底观测点与陷阱清单。两文互补，建议一起读。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    异步错误有三种归宿：
 *      ① 被 try/catch 捕获（await 会把拒绝变成"在当前行抛出"）；
 *      ② 被 .catch() / then 的第二个参数捕获；
 *      ③ 谁都没接住 → 变成"未处理的 Promise 拒绝"，Node 默认会警告并
 *         结束进程（这正是异步错误最容易出事的地方）。
 *
 * 2. 为什么需要
 *    同步代码里 throw 会被调用栈一路向上传递，最终落到某个 try/catch。
 *    而异步回调是在"另一个时间点"执行的，调用栈早已不同，所以回调里抛的错
 *    根本传不到外层 try——这就是回调时代错误难以处理的原因。
 *    Promise 把"错误"也变成了一个可传递的值（拒绝状态），
 *    await 再把它还原成"抛出"，于是 try/catch 又能用了。
 *
 * 3. 核心语法要点
 *    - await 一个被拒绝的 Promise → 在 await 那一行抛错，可用 try/catch 捕获。
 *    - 一个 try 可以包住多个 await：任何一处失败都会跳到 catch，
 *      后面的代码不再执行（这叫"失败快速终止"）。
 *    - await 一个"同步抛出错误的函数调用"也一样能被捕获，因为
 *      async 函数体内部的同步抛错同样会变成拒绝。
 *    - finally 里可以做异步清理：写成 async 回调并 await 它。
 *    - 自定义错误类可以通过继承 Error 实现，便于 instanceof 分流。
 *
 * 4. 常见陷阱
 *    - 只写 try 不写 catch/finally：语法错误；只 catch 不处理：错误被吞掉。
 *    - 在 catch 里再次 throw 却不处理：会继续向上变成拒绝。
 *    - 创建了会被拒绝的 Promise 却没给它任何处理者 → 未处理的拒绝，
 *      进程可能直接退出（本示例会安全地演示这个现象）。
 *    - 在 forEach 里写 async 回调：错误不会被外层捕获（详见 10 篇）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/08_async_error_handling.js
 *
 * 【预期输出】
 *   各种错误处理路径的输出，包括一次"未处理的拒绝"被监听器安全接住的演示。
 *   延时 ≤ 60ms。
 * ============================================================================
 */

const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
const delayReject = (ms, message) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

// ---------------------------------------------------------------------------
// 0. 注册一个全局兜底监听器（仅用于演示）
// ---------------------------------------------------------------------------

// Node 对"未处理的 Promise 拒绝"的默认行为是打印警告并让进程以非零码退出。
// 一旦注册了 unhandledRejection 监听器，默认行为就被接管，
// 进程不会退出——但真实项目里不要靠它兜底，应该让每个 Promise 都有归宿。
let unhandledCount = 0;
process.on('unhandledRejection', (reason) => {
  unhandledCount++;
  console.log(`  [全局兜底] 检测到第 ${unhandledCount} 个未处理的拒绝：${reason.message}`);
});

// ---------------------------------------------------------------------------
// 1. try/catch 捕获 await
// ---------------------------------------------------------------------------

console.log('--- 1. try/catch 捕获 await 的拒绝 ---');

async function basicCatch() {
  try {
    const v = await delayReject(5, '接口 500');
    console.log('  这一行不会执行：', v);
  } catch (err) {
    console.log('  catch 捕获：', err.message);
    console.log('  错误对象是 Error 实例吗：', err instanceof Error);
  }
}
await basicCatch();

// ---------------------------------------------------------------------------
// 2. 一个 try 包住多个 await：失败即终止
// ---------------------------------------------------------------------------

console.log('\n--- 2. 一个 try 包住多个 await ---');

async function multiAwait() {
  try {
    console.log('  步骤 1 开始');
    const a = await delay(5, '步骤 1 结果');

    console.log('  步骤 2 开始');
    const b = await delayReject(5, '步骤 2 失败'); // 从这里跳到 catch

    console.log('  步骤 3 开始（永远不会执行）');
    return a + b;
  } catch (err) {
    console.log('  catch 捕获：', err.message);
    console.log('  注意：步骤 3 被跳过了，这正是我们想要的"失败即停"');
    return null; // catch 里的返回值会成为 async 函数的兑现值
  } finally {
    console.log('  finally：无论成败都会执行（适合做清理）');
  }
}
console.log('  multiAwait 的返回值：', await multiAwait());

// ---------------------------------------------------------------------------
// 3. sync 抛错、await 拒绝、return 拒绝 的三种来源
// ---------------------------------------------------------------------------

console.log('\n--- 3. 错误可以来自三个地方，处理方式一致 ---');

// 来源三：被调用的普通函数同步抛错（它发生在 async 函数体内）
function mayThrow() {
  throw new Error('普通函数同步抛错');
}

// 三种来源都用工厂函数"现造现处理"。
// 为什么要用工厂函数而不是先创建好三个 Promise 再统一处理？
// 因为一个被拒绝的 Promise 如果没有在"同一轮次"被接住，
// 就会被判定为"未处理的拒绝"（Node 会警告甚至退出进程）。
// 先造后接，中间只要隔了一次 await，就会踩到这个坑。
const sources = [
  [
    '同步 throw',
    () =>
      (async () => {
        throw new Error('同步 throw');
      })(),
  ],
  [
    'await 拒绝',
    () =>
      (async () => {
        await delayReject(5, 'await 的拒绝');
      })(),
  ],
  ['调用普通函数抛错', () => (async () => mayThrow())()],
];

for (const [name, create] of sources) {
  // 创建之后立刻挂上 catch，杜绝"未处理的拒绝"
  await create().catch((e) => console.log(`  ${name} -> 捕获：`, e.message));
}

// ---------------------------------------------------------------------------
// 4. 自定义错误类型 + 分流处理
// ---------------------------------------------------------------------------

console.log('\n--- 4. 自定义错误类型与分流 ---');

class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'NetworkError'; // 覆盖 name，日志里更好认
    this.statusCode = statusCode;
  }
}
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

function callApi(endpoint) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      if (endpoint === 'network') {
        reject(new NetworkError('连接超时', 504));
      } else if (endpoint === 'invalid') {
        reject(new ValidationError('参数不合法', 'email'));
      } else {
        reject(new Error('未知错误'));
      }
    }, 5);
  });
}

for (const endpoint of ['network', 'invalid', 'other']) {
  try {
    await callApi(endpoint);
  } catch (err) {
    if (err instanceof NetworkError) {
      console.log(`  网络类错误（可重试）：${err.message}，状态码 ${err.statusCode}`);
    } else if (err instanceof ValidationError) {
      console.log(`  校验类错误（不该重试）：${err.message}，字段 ${err.field}`);
    } else {
      console.log(`  其它错误：${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. 异步清理写在 finally 里
// ---------------------------------------------------------------------------

console.log('\n--- 5. finally 里的异步清理 ---');

async function withResource() {
  console.log('  打开资源');
  try {
    await delay(5, null);
    throw new Error('业务处理失败');
  } finally {
    // finally 里可以 await：外层会等清理完成再继续
    await delay(5, null);
    console.log('  资源已关闭（即使上面抛错了也会执行）');
  }
}

try {
  await withResource();
} catch (err) {
  console.log('  外层捕获：', err.message);
}

// ---------------------------------------------------------------------------
// 6. 未处理的拒绝：安全演示
// ---------------------------------------------------------------------------

console.log('\n--- 6. 未处理的 Promise 拒绝 ---');

// 这里故意创建一个"没人接住"的拒绝。
// 因为文件开头注册了 unhandledRejection 监听器，进程不会退出，
// 而是走我们的兜底日志。真实项目里请务必给每个 Promise 一个归宿。
delayReject(5, '我没有人管').then(() => {
  console.log('  不会执行到这里');
});

// 对比：同一个拒绝，只要有一个 catch，就不会触发全局兜底
delayReject(5, '我被接住了').catch((e) => console.log('  这个拒绝被正常处理：', e.message));

// 等一段时间，让上面两个 Promise 都落定，并让兜底监听器有机会触发
await delay(30, null);
console.log(`  本示例共触发 ${unhandledCount} 次全局兜底（应该只有 1 次）`);

// ---------------------------------------------------------------------------
// 7. Promise.all 中的错误处理
// ---------------------------------------------------------------------------

console.log('\n--- 7. 并发场景下的错误处理 ---');

// all 只要有一个失败就整体失败，其它任务的结果就都拿不到了。
// 如果业务上"允许部分失败"，应该用 allSettled 逐个判断。
try {
  await Promise.all([delay(10, 'A 成功'), delayReject(5, 'B 失败'), delay(20, 'C 成功')]);
} catch (err) {
  console.log('  all 整体失败：', err.message, '（A、C 的结果被丢弃了）');
}

const settled = await Promise.allSettled([
  delay(10, 'A 成功'),
  delayReject(5, 'B 失败'),
  delay(20, 'C 成功'),
]);
for (const item of settled) {
  if (item.status === 'fulfilled') {
    console.log('  allSettled 成功项：', item.value);
  } else {
    console.log('  allSettled 失败项：', item.reason.message);
  }
}

console.log('\n示例结束。');
