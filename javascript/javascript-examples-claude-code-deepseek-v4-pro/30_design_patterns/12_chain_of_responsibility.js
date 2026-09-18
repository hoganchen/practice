/**
 * ============================================================================
 * 知识点：责任链模式 —— 中间件流水线与 compose 的完整实现
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】高级
 * 【前置知识】30_design_patterns/11_command.js、06_functions（闭包）、
 *             异步基础（Promise / async-await，见 26_node_core 中的异步示例）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    责任链模式把"处理一个请求"的多个步骤串成一条链，请求沿链传递，
 *    每个节点可以选择：处理、处理后继续传递、或者**中断**（不再往下传）。
 *    在前端/Node 世界，它最广为人知的形态就是**中间件（middleware）**：
 *        const app = compose([logger, auth, handler, errorHandler]);
 *        await app(ctx);
 *    每个中间件形如 `async (ctx, next) => { ...前置...; await next(); ...后置... }`。
 *
 * 2. 为什么需要（真实项目场景）
 *    - Web 框架：Express / Koa / Redux 的 middleware 全是这个模式。
 *    - 请求处理管线：日志 → 限流 → 鉴权 → 参数校验 → 业务 → 统一错误处理。
 *    - 构建工具：webpack 的 loader 链、babel 的插件链。
 *    - 审批流：报销单 → 组长 → 经理 → 财务，任一层可驳回（中断）。
 *    - 事件处理管线：埋点上报前的采样、脱敏、批量合并。
 *    它的价值在于：**每个步骤只关心自己那一件事，步骤之间的组合是数据（数组）**，
 *    所以增删步骤、调整顺序都不需要改任何一个步骤的代码。
 *
 * 3. 核心语法要点
 *    - compose 的本质是一个**递归/迭代的 next 分发器**：
 *        每个中间件拿到一个 next 函数，调用 next() 就是"把控制权交给下一个"。
 *    - 洋葱模型：`await next()` 之前的代码"逐层进入"，
 *      之后的代码"逐层退出"，方向相反（和 08 文件的装饰器链完全同构）。
 *    - 异步版必须要求 `await next()`：
 *      忘记 await 会导致"后置逻辑"在下一个中间件完成前就执行了。
 *    - 同步版 vs 异步版：
 *        同步版 `next()` 直接返回下一个中间件的结果（用 reduceRight 一行即可）；
 *        异步版必须返回 Promise，且 next() 内部要能 await 下游的整条链
 *        （所以 Koa 风格的 next() 返回的是"下游全部执行完"的 Promise）。
 *    - next() 只能调用一次：调用两次会让下游执行两遍（经典 bug）。
 *    - 中断：不调用 next() 就等于终止链条（鉴权失败时的正确做法）。
 *    - 错误处理：try/catch 包住 await next()，就能捕获下游任何中间件抛出的错误 ——
 *      这是"统一错误处理中间件"能工作的原理。
 *    - ctx 是贯穿全链的"上下文对象"：各中间件通过读写它来传递数据。
 *
 * 4. 常见陷阱
 *    - 忘记调用 next()：请求"卡住"、下游永远不执行，而且**不报错**，极难排查。
 *    - 忘记 await next()：下游还没跑完，本层的"后置代码"就先执行了，
 *      洋葱模型的顺序被破坏；异步错误也捕获不到。
 *    - next() 调用两次：下游执行两遍（比如日志打了两次、订单创建了两张）。
 *      防御做法：在 next 里加"只能调用一次"的守卫（本文件实现了）。
 *    - 错误处理中间件放的位置：必须放在链的**最外层（第一个）**，
 *      才能捕获到所有下游错误。如果放在最后，它自己抛的错就没人管了。
 *    - 在中间件里改 ctx 的引用（ctx = ...）：其他中间件看不到这个改动，
 *      因为它们是各自持有自己的 ctx 变量。要改就改 ctx 的属性。
 *    - 链条过深：20 层中间件会让"一个请求到底做了什么"完全不可追踪，
 *      性能上也是 20 次额外函数调用。**够用就好**。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/12_chain_of_responsibility.js
 *
 * 【预期输出】
 *   先给出 compose 的完整实现与逐行解释，再用"日志 → 鉴权 → 业务 → 错误处理"
 *   跑一遍完整请求，演示鉴权失败时的中断、以及错误被最外层捕获；
 *   然后用对齐的时序图展示洋葱模型的进入/退出顺序，对比同步版与异步版，
 *   最后列出责任链的代价与不适用场景。
 * ============================================================================
 */

// ===========================================================================
// 1. compose 的完整实现与逐行解释
// ===========================================================================

console.log('--- 1. compose 的完整实现 ---');

/**
 * 把中间件数组组合成一个可执行函数（Koa 风格）。
 *
 * 实现要点逐条说明：
 *   1) dispatch(i) 返回"执行第 i 个中间件"的 Promise；
 *   2) next() 被调用时，实际执行的是 dispatch(i + 1) —— 递归往下走；
 *   3) 当 i 超出数组长度时，说明链已走完，resolve(undefined)；
 *   4) 同一个 next 只能被调用一次，否则抛错（防止"下游执行两遍"）；
 *   5) 中间件抛出的错误会沿着 Promise 链冒泡回上一层的 await，
 *      于是外层 try/catch 就能捕获下游错误 —— 这是整个模式的灵魂。
 *
 * @param {Array<(ctx: object, next: Function) => any>} middlewares
 * @returns {(ctx: object) => Promise<void>}
 */
function compose(middlewares) {
  // 参数校验提前做：错误越早暴露越好
  if (!Array.isArray(middlewares)) {
    throw new TypeError('compose 的参数必须是数组');
  }
  for (const [idx, mw] of middlewares.entries()) {
    if (typeof mw !== 'function') {
      throw new TypeError(`第 ${idx} 个中间件不是函数`);
    }
  }

  // 返回组合后的函数。注意它是 async 的 —— 所以调用方可以 await 整条链跑完。
  return async function composed(ctx) {
    // 从第 0 个中间件开始派发。
    // 用 return 把 dispatch 的 Promise 交出去，调用方 await 时就能等到全链结束。
    return dispatch(0);

    /** 派发第 i 个中间件 */
    function dispatch(i) {
      // 基准情形：没有更多中间件了，链条走完。返回已 resolve 的 Promise，
      // 这样上层的 `await next()` 会立刻继续执行"后置逻辑"。
      // 这里的返回值就是 next() 的返回值 —— 本文件让它为 undefined。
      if (i >= middlewares.length) return Promise.resolve();

      const middleware = middlewares[i];

      // 构造传给这个中间件的 next 函数。
      // 关键：它返回 dispatch(i + 1)，也就是"下游全部执行完"的 Promise。
      // 正是这个设计让 `await next()` 之后的代码一定在下游结束之后才跑。
      let called = false; // 守卫：next 只能调一次
      const next = () => {
        if (called) {
          // 重复调用 next 是经典 bug（下游会跑两遍）。
          // 这里选择抛错暴露问题，而不是静默忽略 —— 静默会掩盖真实的逻辑错误。
          return Promise.reject(new Error(`中间件 #${i}（${middleware.name || 'anonymous'}）重复调用了 next()`));
        }
        called = true;
        return dispatch(i + 1);
      };

      try {
        // 中间件可以是同步的，也可以返回 Promise（async 函数）。
        // Promise.resolve(...) 把两种情况统一成 Promise，方便上层 await。
        return Promise.resolve(middleware(ctx, next));
      } catch (err) {
        // 同步抛错（非 async 中间件）：转成 rejected Promise，保持接口一致
        return Promise.reject(err);
      }
    }
  };
}

console.log(`compose 的核心只有十几行，但它把"一串步骤"变成了"一个函数"。
  最关键的一行是：const next = () => dispatch(i + 1);
  —— next 不是"调用下一个"，而是"执行剩余的整条链"，这是一个递归定义。`);

// ===========================================================================
// 2. 四个真实中间件：日志 → 鉴权 → 业务 → 错误处理
// ===========================================================================

console.log('\n--- 2. 一条完整的请求处理链 ---');

/** 用 ctx 贯穿全链：所有中间件读写同一个对象 */
function createContext(path, token) {
  return {
    path,
    token,
    user: null, // 由鉴权中间件填充
    startAt: 0, // 由日志中间件填充
    body: null, // 由业务中间件填充
    status: 200, // 由各中间件修改
    trace: [], // 记录进出顺序，用来演示洋葱模型
  };
}

// ---- 中间件 1：统一错误处理（必须放在最外层/第一位）----
async function errorHandler(ctx, next) {
  ctx.trace.push('errorHandler 进入');
  try {
    await next(); // 下游任何错误都会在这里被捕获
    ctx.trace.push('errorHandler 退出（无异常）');
  } catch (err) {
    // 统一错误出口：把各种异常翻译成 HTTP 语义
    ctx.status = err.statusCode ?? 500;
    ctx.body = { error: err.code ?? 'INTERNAL_ERROR', message: err.message };
    ctx.trace.push(`errorHandler 捕获异常 -> ${ctx.status}`);
    console.log(`  [errorHandler] 捕获到异常：${err.message}（已转成 ${ctx.status}）`);
    // 注意：这里**不再抛出**，因为错误已经被"处理"了。
    // 如果这是最外层，不抛就意味着进程不会崩。
  }
}

// ---- 中间件 2：访问日志（记录耗时，所以必须在 next() 前后都写代码）----
async function accessLog(ctx, next) {
  ctx.trace.push('accessLog 进入');
  ctx.startAt = performance.now();
  console.log(`  [accessLog] --> ${ctx.path}`);
  await next(); // ★必须 await：否则下面的"<--"会在下游执行完之前打印
  const ms = (performance.now() - ctx.startAt).toFixed(2);
  console.log(`  [accessLog] <-- ${ctx.path} ${ctx.status} (${ms}ms)`);
  ctx.trace.push('accessLog 退出');
}

// ---- 中间件 3：鉴权（失败则中断，不调用 next）----
async function authenticate(ctx, next) {
  ctx.trace.push('authenticate 进入');
  if (!ctx.token) {
    // 中断链：**不调用 next()**，下游全部不执行
    ctx.status = 401;
    ctx.body = { error: 'UNAUTHORIZED', message: '缺少 token' };
    ctx.trace.push('authenticate 中断（未调用 next）');
    console.log('  [authenticate] 缺少 token，中断链条（不调用 next）');
    return; // 直接返回，注意这里没有 await next()
  }
  ctx.user = { id: 1, name: '张三', token: ctx.token };
  console.log(`  [authenticate] 鉴权通过：${ctx.user.name}`);
  await next();
  ctx.trace.push('authenticate 退出');
}

// ---- 中间件 4：业务处理（链尾）----
async function businessHandler(ctx) {
  ctx.trace.push('businessHandler 进入');
  if (ctx.path === '/boom') {
    // 故意抛错，演示错误如何被最外层的 errorHandler 捕获。
    // 注意：这里**不需要 try/catch** —— 错误会沿 await 链冒泡上去。
    const err = new Error('数据库连接失败');
    err.statusCode = 503;
    err.code = 'DB_DOWN';
    throw err;
  }
  ctx.body = { ok: true, user: ctx.user.name, path: ctx.path };
  ctx.trace.push('businessHandler 退出');
}

const app = compose([errorHandler, accessLog, authenticate, businessHandler]);

// ---- 场景 A：正常请求 ----
console.log('\n[场景 A] 正常请求（带 token）');
const ctxA = createContext('/orders', 'tok-123');
await app(ctxA);
console.log('  最终 status =', ctxA.status);
console.log('  最终 body   =', JSON.stringify(ctxA.body));

// ---- 场景 B：鉴权失败，链条中断 ----
console.log('\n[场景 B] 缺少 token（鉴权中断）');
const ctxB = createContext('/orders', null);
await app(ctxB);
console.log('  最终 status =', ctxB.status);
console.log('  最终 body   =', JSON.stringify(ctxB.body));
console.log('  执行轨迹：', ctxB.trace.join(' -> '));
console.log(`  注意 businessHandler 的 trace 一条都没有 —— 它根本没有被执行。
  这就是"中断"：不调用 next() 就等于终止责任链。`);

// ---- 场景 C：业务抛错，被最外层捕获 ----
console.log('\n[场景 C] 业务中间件抛错');
const ctxC = createContext('/boom', 'tok-999');
await app(ctxC);
console.log('  最终 status =', ctxC.status);
console.log('  最终 body   =', JSON.stringify(ctxC.body));
console.log('  执行轨迹：', ctxC.trace.join(' -> '));
console.log(`  ★注意：accessLog 的"<--"这一行**没有**打印，它的"退出"也没有进入 trace。
  为什么？因为错误是沿着 await 链**逐层向上抛**的：
    businessHandler 抛错 -> authenticate 的 await next() 抛出 -> accessLog 的 await next() 抛出
  —— 抛出之后，每一层 next() 之后的代码都不会执行（除非该层自己 try/finally）。
  所以：写在 await next() 之后的"后置逻辑"**默认不具备异常安全性**。
  如果 accessLog 想"无论成功失败都记录耗时"，必须自己写 try/finally：
      const t0 = performance.now();
      try { await next(); } finally { log(performance.now() - t0); }`);

// ===========================================================================
// 3. 洋葱模型：进出的对称时序
// ===========================================================================

console.log('\n--- 3. 洋葱模型（进出的对称时序） ---');

const traceApp = compose([
  async function mw1(ctx, next) {
    console.log('    mw1 进入');
    await next();
    console.log('    mw1 退出');
  },
  async function mw2(ctx, next) {
    console.log('    mw2 进入');
    await next();
    console.log('    mw2 退出');
  },
  async function mw3(ctx, next) {
    console.log('    mw3 进入');
    console.log('      >>> 链尾（业务）执行');
    await next(); // 链尾也能调用 next()，它只是立刻 resolve
    console.log('    mw3 退出');
  },
]);

console.log('  执行顺序：');
await traceApp({});

console.log(`\n  进入顺序：mw1 -> mw2 -> mw3 -> 链尾
  退出顺序：mw3 -> mw2 -> mw1
  这就是"洋葱模型"：进入时由外向内穿，退出时由内向外穿。
  所以：
    - "前置"逻辑（鉴权、解析参数、打开始日志）写在 await next() 之前；
    - "后置"逻辑（写响应头、统计耗时、清理资源）写在 await next() 之后。
  这与装饰器链（08 文件）完全同构 —— 两者都是"中间件/洋葱"思想。`);

// 用一张对齐的时序表把进出关系画出来
const stages = ['mw1', 'mw2', 'mw3', '业务'];
const totalCols = stages.length * 2;
const timeline = Array.from({ length: totalCols }, () => stages.map(() => '   '));
// 进入阶段：第 i 个中间件在第 i 列打印
stages.forEach((name, i) => {
  timeline[i][i] = `▼${name}`;
  timeline[totalCols - 1 - i][i] = `▲${name}`;
});
console.log('\n  时序图（▼=进入，▲=退出）：');
timeline.forEach((row, idx) => {
  if (idx === stages.length) console.log('  ' + '-'.repeat(totalCols * 5));
  console.log(`  ${String(idx + 1).padStart(2)}| ${row.join(' ')}`);
});

// ===========================================================================
// 4. 同步版 vs 异步版
// ===========================================================================

console.log('\n--- 4. 同步版 vs 异步版 compose ---');

/**
 * 同步版 compose：一行就能写完（reduceRight）。
 * 适用：纯同步的管线（数据转换、校验、格式化）。
 * 不适用：任何一步需要 IO（网络、文件、数据库）——
 *         同步版没法 await，异步错误也无法传播。
 */
function composeSync(middlewares) {
  // reduceRight 从右往左折叠：最右边的中间件最先被"包"进结果里，
  // 于是它成为最内层（最后执行的那个）。
  return middlewares.reduceRight(
    (next, middleware) => (ctx) => middleware(ctx, next),
    // 初始值：链尾的"空操作"，保证最后一个中间件也有 next 可调
    () => undefined,
  );
}

const syncApp = composeSync([
  (ctx, next) => {
    ctx.trace.push('sync-1 进入');
    const r = next(ctx);
    ctx.trace.push('sync-1 退出');
    return r;
  },
  (ctx, next) => {
    ctx.trace.push('sync-2 进入');
    ctx.value = 42;
    const r = next(ctx);
    ctx.trace.push('sync-2 退出');
    return r;
  },
  (ctx) => {
    ctx.trace.push('sync-链尾');
    return ctx.value * 2;
  },
]);

const syncCtx = { trace: [] };
const syncResult = syncApp(syncCtx);
console.log('  同步版返回值：', syncResult, '（可以直接拿到返回值，这是异步版做不到的）');
console.log('  执行轨迹：', syncCtx.trace.join(' -> '));

console.log(`
  ┌────────────┬──────────────────────────────┬──────────────────────────────┐
  │ 对比项     │ 同步版                       │ 异步版（Koa 风格）           │
  ├────────────┼──────────────────────────────┼──────────────────────────────┤
  │ 实现       │ reduceRight 一行             │ 递归 dispatch + Promise      │
  │ next() 返回│ 下游的返回值                 │ Promise<void>（拿不到返回值）│
  │ 中途异步   │ 做不到                       │ 天然支持                     │
  │ 错误传播   │ 靠同步 throw（能冒泡）       │ 靠 Promise rejection（能冒泡）│
  │ 忘记 next  │ 下游不执行（同异步）         │ 下游不执行（同异步）         │
  │ 典型用途   │ 数据转换、校验、格式化       │ HTTP 请求、构建管线          │
  └────────────┴──────────────────────────────┴──────────────────────────────┘
  （本文件两个版本都实现了，可以对比着看。）`);

// ===========================================================================
// 5. 陷阱演示：忘记调用 next / 忘记 await next / 调用两次
// ===========================================================================

console.log('\n--- 5. 三个经典陷阱 ---');

// ---- 陷阱 1：忘记调用 next()，请求"卡住" ----
console.log('\n[陷阱 1] 忘记调用 next()：下游静默地不执行');
const stuckApp = compose([
  async function mwA(ctx, next) {
    console.log('    mwA 执行了，但忘记调用 next()');
    // ← 这里少了 await next();
    ctx.stuck = true;
  },
  async function mwB(ctx) {
    console.log('    mwB 执行了（这行不会出现）');
  },
]);
const stuckCtx = {};
await stuckApp(stuckCtx);
console.log('  整条链跑完了，但 mwB 从未执行。stuck =', stuckCtx.stuck);
console.log(`  为什么会"卡住"：链条靠 next() 手动推进，没人推就停在那里。
  最坑的是**它不报错**，只是"什么都没发生"。
  防御手段：给 ctx 加一个"是否走到链尾"的标记，在链尾之外检查它：
      if (!ctx.reachedEnd) log warn('请求没有走到链尾，可能有中间件忘了 next()');`);
console.log('  注意：本文件的 compose 在链走完时会 resolve，所以程序不会真的挂起 ——');
console.log('  但"业务没执行、响应却是 200"这种 bug 更难查。');

// ---- 陷阱 2：忘记 await next()，顺序错乱 ----
console.log('\n[陷阱 2] 忘记 await next()：洋葱顺序被破坏');
const noAwaitApp = compose([
  async function outer(ctx, next) {
    console.log('    outer 进入');
    next(); // ← 少了 await！下游的 Promise 没有被等待
    console.log('    outer 退出（这行会在下游完成之前就打印）');
  },
  async function inner(ctx, next) {
    // 用一个 0ms 定时器让出事件循环，模拟真实的异步 IO。
    // （不用 setInterval，因为未清理的 interval 会让进程无法退出。）
    await new Promise((resolve) => setTimeout(resolve, 0));
    console.log('    inner 执行（本应在 outer 退出之前）');
  },
]);
console.log('  实际顺序：');
await noAwaitApp({});
// 等一下"没被 await 的下游"，让它把日志打完，避免输出交错
await new Promise((resolve) => setTimeout(resolve, 10));
console.log(`  可以看到 outer 的"退出"打印在 inner 之前 —— 顺序反了。
  更严重的是：下游如果抛错，因为没有 await，这个错误不会被 outer 捕获，
  会变成"未处理的 Promise rejection"（可能直接让进程退出）。`);

// ---- 陷阱 3：next() 调用两次 ----
console.log('\n[陷阱 3] next() 调用两次：下游执行两遍');
const twiceApp = compose([
  async function doubleNext(ctx, next) {
    await next();
    await next(); // ← 第二次调用
  },
  async function downstream(ctx) {
    ctx.count = (ctx.count ?? 0) + 1;
    console.log(`    下游被执行（第 ${ctx.count} 次）`);
  },
]);
const twiceCtx = {};
try {
  await twiceApp(twiceCtx);
} catch (err) {
  console.log('  重复调用被 compose 的守卫拦下：', err.message);
}
console.log('  下游实际执行次数：', twiceCtx.count, '（如果守卫只是静默忽略，这里会是 2 —— 更隐蔽）');
console.log(`  真实事故形态：日志中间件被调用两次、订单被创建两张。
  所以 compose 里那个 called 标志位不是可选的，是必须的。`);

// ===========================================================================
// 6. 责任链 vs 其他模式
// ===========================================================================

console.log('\n--- 6. 责任链与其他模式的关系 ---');

console.log(`  与装饰器（08 文件）：
    结构完全同构（都是洋葱），但意图不同 ——
    装饰器是"一个函数被多层包装"，责任链是"多个处理者依次尝试处理同一个请求"。
    装饰器的层是"同一个功能的不同切面"；责任链的层是"不同的处理步骤"。

  与命令模式（11 文件）：
    命令模式把"一个请求"变成对象，责任链把"一组处理者"变成链。
    两者常组合：中间件里执行命令对象。

  与策略模式（07 文件）：
    策略是"选一个执行"，责任链是"依次执行，直到有人处理或全部走完"。

  责任链的独特之处：**中断是内建的**。
    任何一个节点不调用 next()，链条就到此为止 ——
    这让"鉴权失败就返回 401"这类需求变得极其自然。`);

// ===========================================================================
// 7. 代价与什么时候不该用
// ===========================================================================

console.log('\n--- 7. 责任链的代价与不适用场景 ---');

console.log(`【代价】
  1) 控制流不直观：代码不再是从上往下读，而是"函数 A 调 B 调 C"。
     一个请求到底经过哪些步骤，要看 compose 的数组才能确定（运行时才知道）。
  2) 调试困难：断点要一层层跨过 async 边界；调用栈里全是 dispatch，
     看不出"业务逻辑在哪里"。
  3) 顺序即逻辑：中间件的顺序本身就是业务规则（鉴权必须在业务前，
     错误处理必须在最外层），但这个约束**没有类型系统保障**，
     只能靠约定和测试。调换两行数组元素就可能出安全漏洞。
  4) 忘记 next() 静默失败：见第 5 节，这是责任链最典型的故障模式。
  5) ctx 变成一个"什么都往里塞"的大对象：中间件之间的隐式接口，
     谁改了什么、谁依赖什么，很难静态分析（"ctx 污染"）。
  6) 性能：每层多一次函数调用 + Promise 分配。20 层中间件在 QPS 高时是可测的开销。
  7) 中断难以表达"部分失败"：不调用 next() 就是全中断，
     想表达"记录一下但继续"就得改成"总是调用 next()，把结果写进 ctx"。

【什么时候不该用】
  1) 步骤是固定且少量的（2~3 步）：直接顺序调用三个函数最清楚，
     一眼能读完，也不会有"忘记 next"的风险。
  2) 步骤之间有复杂的条件依赖（A 的结果决定 B 还是 C）：
     那是流程图/状态机，硬塞进线性链条会写出大量 if。
  3) 需要明确的返回值与类型推导：异步链只能拿到 ctx，
     返回值语义要靠约定（ctx.body 就是响应体？）—— 类型上很弱。
  4) 对性能极度敏感的路径：中间件带来的 Promise 分配在热路径上是实打实的成本。
  5) 一次性脚本/简单接口：为 3 个接口引入一套中间件框架，
     属于典型的"架构宇航员"（见 13 文件的过度设计章节）。

判断口诀：问自己"这些步骤会不会被**重新组合**？"
  会被重新组合（有的接口要鉴权、有的不要）-> 责任链/中间件值得。
  每个接口的步骤都一样且固定 -> 直接顺序调用三个函数。`);

console.log('\n全部演示完毕。');
