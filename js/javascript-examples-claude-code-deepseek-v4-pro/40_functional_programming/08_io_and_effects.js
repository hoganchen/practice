/**
 * ============================================================================
 * 知识点：IO 函子与副作用的实用化 —— 把副作用变成"可以被组合的值"
 * ============================================================================
 *
 * 【所属分类】40_functional_programming —— 函数式编程进阶
 * 【难度等级】高级
 * 【前置知识】40_functional_programming/01_functor.js、04_monad.js、18_async/04_promise_basics.js、28_testing/07_testing_pure_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    IO 函子（IO Functor）是"把副作用包装成值"的容器：
 *        IO.of(() => console.log('hi'))   // 这不是一句话，而是一个"待执行的动作"
 *    它装的是一个**还没执行的动作描述**，map / chain 组合的是这些描述，
 *    直到调用 run()（别名 unsafePerformIO()）才真正执行。
 *    一句话概括它的思想：**把"描述"与"执行"分开** ——
 *    整个程序可以先用纯函数拼出一份"副作用的说明书"，最后在最外层执行一次。
 *    这个思路更复杂的版本就是 Effect / Task / ZIO 这类效果系统的起点。
 *
 * 2. 为什么需要
 *    副作用（读写文件、打日志、发请求、读当前时间、随机数）有两个麻烦：
 *      (1) 让函数不可测：只要函数体里有一句 console.log 或一次请求，
 *          想验证它的返回值就不得不 mock 一堆东西；
 *      (2) 让函数不可组合：纯函数是"输入 → 输出"，可以随意套娃；
 *          而"查数据库 → 计算 → 发通知"这种流程，每一步都立刻发生，
 *          没法先攒起来、换个顺序、或者跑两遍。
 *    IO 函子做的事很朴素：把这些动作先"记在纸上"，变成一个普通的值。
 *    既然是值，就能被传递、被组合、被测试（测它"描述得对不对"），
 *    而"真正动手"这件事被推迟到了唯一的一个出口。
 *
 * 3. 核心语法要点
 *    (1) IO.of(x) 装箱。**最大的坑**：参数会先被求值 ——
 *        IO.of(console.log('hi')) 当场就打印了，装进去的其实是 console.log 的返回值
 *        undefined。正确写法是包一层函数：IO.of(() => console.log('hi'))。
 *        （见第 2 节的实测。这也是 GLOSSARY 里 IO 函子词条点名的经典误解。）
 *    (2) map(f)：组合纯计算，f 是"值 → 值"。得到的新 IO 描述的是"先执行原动作，再把结果交给 f"。
 *    (3) chain(f)：当 f 自己也要返回一个 IO 时用它（和 04_monad.js 里的 chain 是同一件事）。
 *    (4) run() / unsafePerformIO()：**唯一的执行出口**。叫 unsafe 不是因为它危险，
 *        而是提醒你"越过这道门就离开了纯函数的世界，副作用只能在这里发生"。
 *        名字来自 Haskell 的 unsafePerformIO。
 *    (5) IO 与 Promise 的关键区别：Promise 是**急切**的（一创建就开始执行），
 *        IO / Task 是**惰性**的（不 run 就不发生）。所以基于 IO/Task 的计划可以
 *        反复执行（天然的 retry 能力），而 Promise 只能执行一次（见第 6 节实测）。
 *    (6) 落地形态：**函数式核心 + 命令式外壳**（functional core, imperative shell）——
 *        业务规则、计算、格式化写成纯函数；IO 集中在最外层的少数几个函数里，
 *        由它们调用纯函数、再把结果交给下一个副作用。
 *
 * 4. 常见陷阱
 *    - IO.of(某个已经求值的表达式)：副作用当场发生，容器里装的是它的返回值（第 2 节）。
 *    - 以为 run() 一次之后结果会被缓存：不会，每一次 run() 都真的重新执行一次
 *      （这正是它比 Promise 强的地方，也是它容易踩坑的地方：别在循环里 run）。
 *    - 在执行入口之外的地方 run()：那就等于没抽象，副作用又散回业务逻辑里了。
 *      判断标准很简单：run() 应该只出现在 main / 事件处理函数 / 测试代码里。
 *    - 把 IO 当成"让异步变同步"的工具：它不改变任何时序，只是把"什么时候开始"推迟了。
 *    - 用 IO 包装纯计算：纯计算直接写纯函数就好，包装只会让代码更难读。
 *    - 过度使用：一个内部管理系统里，只要做到"纯函数核心 + 边界处的依赖注入"，
 *      就已经拿到了 90% 的收益，不必强行引入 IO 函子（见第 7 节的诚实结论）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 40_functional_programming/08_io_and_effects.js
 *
 * 【预期输出】
 *   先复现"副作用混在业务逻辑里"的三个麻烦（含 IO.of 急切求值的经典坑）；
 *   再手写一个 IO 函子（of / map / chain / run）并演示"计划"与"执行"分离；
 *   然后用一个真实场景做重构：从"随手打日志、随手发通知"的不可测实现，
 *   改成"纯函数拼装计划、最后一次性执行"的可测实现；
 *   最后用 Promise 类比出异步版本 Task，并实测它与 Promise 的急切 / 惰性差异。
 * ============================================================================
 */

console.log('--- 1. 问题：副作用散落各处，业务逻辑变得不可测 ---');

// 先看一个"很常见"的实现：一个函数里既有业务计算，又有日志、查询、通知。
// （为了让文件零依赖、可离线运行，这里的"数据库/通知服务"用内存里的假对象代替，
//   真实项目里它们就是 fs.readFile / fetch / 数据库客户端。）
const fakeDb = {
  orders: {
    A100: { id: 'A100', userId: 'u1', amount: 1280 },
    A200: { id: 'A200', userId: 'u2', amount: 90 },
  },
  users: { u1: { name: 'Alice', vip: true }, u2: { name: 'Bob', vip: false } },
};
const fakeNotifier = {
  sent: [],
  send(userId, text) {
    fakeNotifier.sent.push({ userId, text });
  },
};

// ★ 糟糕实现：业务规则（VIP 打八折）被埋在一堆副作用中间。
function buildReceiptBad(orderId) {
  console.log(`  [log] 开始处理订单 ${orderId}`); // 副作用 1：日志
  const order = fakeDb.orders[orderId]; // 副作用 2：查询
  if (!order) {
    console.log(`  [log] 订单不存在`); // 又一次日志
    return null;
  }
  const user = fakeDb.users[order.userId]; // 又一次查询
  // ↓ 这一行才是真正的业务规则，但它和副作用挤在一起
  const total = user.vip ? order.amount * 0.8 : order.amount;
  if (total > 500) {
    fakeNotifier.send(order.userId, `您有一笔 ${total} 元的大额订单`); // 副作用 3：通知
  }
  console.log(`  [log] 完成，金额 ${total}`); // 副作用 4：日志
  return { orderId, name: user.name, total };
}

console.log('  调用 buildReceiptBad("A100")：');
console.log('    →', JSON.stringify(buildReceiptBad('A100')));
console.log('    顺带说一句：通知已经**真的发出去了** —— fakeNotifier.sent 里现在有',
  fakeNotifier.sent.length, '条记录。');
console.log('    调用这个函数就必然产生副作用，你没法"只算一下金额看看"。');
console.log('  这个函数有三个麻烦：');
console.log('    1) 不可测：想验证"VIP 打八折"这条规则，必须先准备数据库、拦截日志和通知；');
console.log('    2) 不可组合：无法先"攒"起来，也没法只算钱而不发通知；');
console.log('    3) 顺序写死：日志、查询、通知的执行时机完全由代码行的位置决定。');
console.log('  理想状态：业务规则是纯函数（好测、好复用），副作用只在最外层发生一次。');

console.log('--- 2. 朴素解法与 IO 函子的经典坑 ---');

// 朴素解法：把副作用抽成参数（依赖注入）。这一步已经很有价值 ——
// 但它只解决了"测什么"，没解决"什么时候执行"：函数体里仍然是"调用即发生"。
// IO 函子要解决的是后者：让副作用先变成值，攒好了再一起执行。

// ★★ 先去踩那个最经典的坑：IO.of 的参数是"已经求值过"的。
console.log('  准备执行这一行：const bad = IO.of(console.log("    [立即打印] 我本该被延迟"));');
const bad = { _effect: console.log('    [立即打印] 我本该被延迟') }; // 用最朴素的方式模拟"急切求值"
console.log('  看到了吗？"立即打印"在**构造之前**就已经出现在屏幕上了。');
console.log('  因为 JS 是及早求值（eager）：函数参数会先算出来，再传给 IO.of，');
console.log('  于是装进容器的是 console.log 的返回值 undefined，而不是"打印这个动作"。');
console.log('  bad 里装的东西 →', bad._effect, '（undefined，动作早就执行完了，装了个寂寞）');
console.log('  正确做法：把动作包进函数（thunk），让"求值"这件事被推迟到调用时才发生。');
console.log('  也见 GLOSSARY 的「IO Functor（IO函子）」词条 —— 它点名的就是这一个坑。');

console.log('--- 3. 手写一个 IO 函子：of / map / chain / run ---');

// 设计取舍说明：
//   IO 内部永远存一个"零参函数"（thunk）—— 这是"惰性"的全部秘密。
//   of 做成"智能构造"：传函数就当动作描述，传普通值就当纯值。
//   （代价：没法把"一个函数本身"当纯值装箱。想要这种精确性，
//     就把 of 只用于纯值、另配一个 IO.from(effect) 专用于动作 ——
//     本文件两个都提供，并在下面演示区别。）
class IO {
  constructor(effect) {
    if (typeof effect !== 'function') {
      throw new TypeError(`IO 需要一个返回值的函数作为动作描述，收到：${typeof effect}`);
    }
    this._effect = effect; // ← 只是"存起来"，构造函数里绝不调用它
  }

  // of：装箱。传函数 → 当作"待执行的动作"；传普通值 → 当作纯值。
  static of(value) {
    return new IO(typeof value === 'function' ? value : () => value);
  }

  // from：明确地只接受"动作描述"。语义比 of 清晰，推荐在团队里统一用这个包副作用。
  static from(effect) {
    return new IO(effect);
  }

  // map：组合纯计算 f（值 → 值）。新的 IO 描述的是"先执行原动作，再把结果交给 f"。
  map(f) {
    return new IO(() => f(this._effect()));
  }

  // chain：当 f 自己返回 IO 时用它（否则会套成 IO(IO(x))，见 04_monad.js）。
  chain(f) {
    return new IO(() => f(this._effect()).run());
  }

  // run / unsafePerformIO：唯一的执行出口。叫 unsafe 是因为它"逃出了纯函数世界"。
  run() {
    return this._effect();
  }

  unsafePerformIO() {
    return this._effect();
  }

  // 调试用：打印出来看到的是"计划"，而不是结果 —— 这正是我们想要的心智模型。
  inspect() {
    return 'IO(<未执行的计划>)';
  }

  toString() {
    return this.inspect();
  }
}

console.log('  1) 惰性验证：构造时什么都不发生');
const helloIO = IO.of(() => console.log('    [延迟打印] 我现在才执行，因为有人调用了 run()'));
console.log('     构造完毕，但屏幕上什么都没有。计划是 →', helloIO.inspect());

console.log('  2) 只有 run() 才让副作用发生');
helloIO.run();

console.log('  3) run() 不缓存结果：每次调用都真的重新执行一遍');
let runCount = 0;
const counterIO = IO.of(() => ++runCount);
console.log('     第 1 次 run() →', counterIO.run(), '  第 2 次 run() →', counterIO.run());
console.log('     （对比 Promise：它只能执行一次，结果被永久记住 —— 见第 6 节）');

console.log('  4) map / chain 组合纯计算，全程没有任何副作用');
const configIO = IO.of(() => ({ currency: 'CNY', rate: 0.8 })); // 假装"读配置"这个副作用
// 注意：下面每一步都只是在"描述"，没有读配置、也没有算数。
const plan = configIO
  .map((cfg) => cfg.rate) // 纯计算 1：取出折扣率
  .map((rate) => (amount) => amount * rate) // 纯计算 2：造一个"打折函数"
  .map((discount) => ({ discount, label: 'VIP 价' })); // 纯计算 3：包装成结果对象
console.log('     拼好的计划 →', plan.inspect(), '（到此为止：配置没读、计算没做）');
const finalPlan = plan.chain((r) => IO.of(discountResult('A100', r))); // chain：下一步也是 IO
function discountResult(orderId, r) {
  const amount = fakeDb.orders[orderId].amount;
  return `${orderId} 的 ${r.label} = ${amount} × ${r.discount(amount) / amount} = ${r.discount(amount)} 元`;
}
console.log('     执行唯一一次 run() →', finalPlan.run());
console.log('  ★ 全部副作用就集中在最后那一行。这就是"描述与执行分离"。');

console.log('--- 4. 函数式核心 + 命令式外壳：把这个场景重构一遍 ---');

// 重构第一步：把所有"业务规则"抽成纯函数。它们不碰数据库、不打印、不发通知。
const isVip = (user) => user.vip === true;
const applyDiscount = (amount, user) => (isVip(user) ? amount * 0.8 : amount);
const needsNotify = (total) => total > 500;
const formatNotifyText = (total) => `您有一笔 ${total} 元的大额订单`;
const formatLogLine = (orderId, total) => `处理订单 ${orderId}，金额 ${total}`;
const buildReceipt = (order, user) => ({
  orderId: order.id,
  name: user.name,
  total: applyDiscount(order.amount, user),
});

// 纯函数的可测性：不需要数据库、不需要拦截日志，直接调用、比对结果即可。
// （这就是 28_testing/07_testing_pure_functions.js 讲的"最容易测的代码"。）
const assertEqual = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) throw new Error(`断言失败：${label} 期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
  console.log(`     ✓ ${label}`);
};
console.log('  纯核心的单元测试（不需要任何 mock）：');
assertEqual('VIP 打八折', applyDiscount(1000, { vip: true }), 800);
assertEqual('非 VIP 原价', applyDiscount(1000, { vip: false }), 1000);
assertEqual('500 元不触发通知', needsNotify(500), false);
assertEqual('501 元触发通知', needsNotify(501), true);
assertEqual('收据内容', buildReceipt({ id: 'A100', amount: 1280 }, { name: 'Alice', vip: true }),
  { orderId: 'A100', name: 'Alice', total: 1024 });
console.log('  ★ 注意：上面没有出现任何 fakeDb、fakeNotifier，也没打印业务日志。');

// 重构第二步：副作用变成"可以被组合的 IO 值"。
// 每个动作只做一件小事，而且都还没执行。
const readOrderIO = (orderId) => IO.of(() => fakeDb.orders[orderId]); // 查询订单
const readUserIO = (userId) => IO.of(() => fakeDb.users[userId]); // 查询用户
const logIO = (line) => IO.of(() => console.log(`     [log] ${line}`)); // 写日志
const notifyIO = (userId, text) => IO.of(() => fakeNotifier.send(userId, text)); // 发通知

// 用 chain 把动作串成一份完整计划。这里全部是"描述"，一行副作用都还没发生。
// 也见 04_monad.js：chain 解决的是"下一步也返回容器"时的嵌套问题。
const buildReceiptPlan = (orderId) =>
  readOrderIO(orderId)
    .chain((order) => (order ? readUserIO(order.userId).map((user) => ({ order, user })) : IO.of(null)))
    .chain((pair) => {
      if (!pair) return logIO(`订单 ${orderId} 不存在`).map(() => null);
      const { order, user } = pair;
      const receipt = buildReceipt(order, user); // ← 纯函数在这里被调用
      // 先记日志，再（按需）发通知，最后把收据传下去。
      // 注意这里用的是 chain：下一步也是 IO，用 chain 才不会套成 IO(IO(...))。
      return logIO(formatLogLine(order.id, receipt.total)) // 纯函数生成日志文本
        .chain(() =>
          needsNotify(receipt.total) // 纯函数决定要不要通知
            ? notifyIO(order.userId, formatNotifyText(receipt.total))
            : IO.of(null), // 不需要通知时，用一个"什么都不做"的 IO 顶上
        )
        .map(() => receipt);
    });

// 先清空台账：第 1 节的 buildReceiptBad 已经往里面塞了一条通知。
fakeNotifier.sent.length = 0;
console.log('  拼装计划（此时 fakeNotifier.sent 还是空的）：');
const receiptPlan = buildReceiptPlan('A100');
console.log('     计划 →', receiptPlan.inspect(), '  fakeNotifier.sent =', JSON.stringify(fakeNotifier.sent));
console.log('  执行 run() 一次：');
console.log('     结果 →', JSON.stringify(receiptPlan.run()));
console.log('     副作用台账：fakeNotifier.sent =', JSON.stringify(fakeNotifier.sent));

// 同一个计划换一个订单：不需要改任何业务逻辑，也不需要动副作用代码。
fakeNotifier.sent.length = 0;
console.log('  同一个计划处理 A200（金额 90，不触发通知）：');
console.log('     结果 →', JSON.stringify(buildReceiptPlan('A200').run()));
console.log('     fakeNotifier.sent =', JSON.stringify(fakeNotifier.sent), '（空的，符合预期）');
// 不存在的订单：计划里那条"短路"分支生效。
console.log('  处理不存在的订单 A999：');
console.log('     结果 →', buildReceiptPlan('A999').run(), '（计划里返回 null，日志也照常打）');

console.log('  ── 重构前后对比 ──');
console.log('    维度          buildReceiptBad（重构前）    IO 版（重构后）');
console.log('    业务规则     埋在函数体中间，测不到        抽成纯函数，直接断言');
console.log('    副作用位置   散落在 4 个地方               集中在 logIO / notifyIO / read*IO');
console.log('    执行时机     调用即发生                    run() 时统一发生');
console.log('    能否只算不发通知  不能                     能（不在计划里 chain 那个 IO 就行）');
console.log('    测试成本     需要准备 DB、拦截 console、捕获通知   纯函数零 mock');

console.log('--- 5. 异步版本：Task / Effect（用 Promise 类比） ---');

// IO 处理同步副作用。异步副作用（请求、读文件）需要一个"返回 Promise 的 thunk"，
// 也就是通常叫作 Task（或 Effect / Future / Async）的东西。
// 结构完全一样，只是内部的返回值从 a 变成了 Promise<a>。
class Task {
  constructor(effect) {
    if (typeof effect !== 'function') {
      throw new TypeError(`Task 需要一个返回 Promise 的函数，收到：${typeof effect}`);
    }
    this._effect = effect;
  }

  static of(value) {
    return new Task(() => Promise.resolve(value));
  }

  static from(effect) {
    return new Task(effect); // effect: () => Promise<a>
  }

  map(f) {
    return new Task(() => this._effect().then(f));
  }

  // chain：f 返回 Task，所以要先 run() 把它的 Promise 拿出来再接着走。
  chain(f) {
    return new Task(() => this._effect().then((x) => f(x).run()));
  }

  run() {
    return this._effect(); // 返回 Promise —— 出口处仍然是 async/await 的世界
  }

  inspect() {
    return 'Task(<未执行的异步计划>)';
  }
}

// 假的外部服务（真实项目里这里是 fetch / fs.readFile）：
const fakeApi = {
  calls: 0,
  fetchUser(userId) {
    fakeApi.calls++;
    return Promise.resolve(fakeDb.users[userId]); // 用 Promise 模拟网络往返
  },
};

console.log('  1) 急切 vs 惰性 —— 这是 Task 与 Promise 最本质的区别');
console.log('     （注意下面的打印顺序：Promise 那行会先出现）');
const eagerPromise = new Promise((resolve) => {
  console.log('     [Promise] 我一被创建就开始执行了，根本拦不住');
  resolve(1);
});
const lazyTask = Task.from(() => {
  console.log('     [Task] 我一直等到 run() 才开始执行');
  return Promise.resolve(1);
});
console.log('     两行代码都写完了。Promise 已经打印过，Task 还没有 —— 这就是急切 vs 惰性。');
const taskValue = await lazyTask.run();
console.log('     run() 之后 →', taskValue, '（返回值与 Promise 一样，都是"解包后的值"）');
void eagerPromise;

// 2) 组合一条异步流水线：查询 → 纯计算 → 再查询 → 纯计算，最后执行一次。
const fetchUserTask = (userId) => Task.from(() => fakeApi.fetchUser(userId));
const fetchOrdersTask = (userId) =>
  Task.from(() => Promise.resolve(Object.values(fakeDb.orders).filter((o) => o.userId === userId)));

const summarizeUserPlan = (userId) =>
  fetchUserTask(userId) // 副作用（网络）
    .map((user) => ({ user, label: user.name.toUpperCase() })) // 纯计算
    .chain((ctx) => fetchOrdersTask(userId).map((orders) => ({ ...ctx, orders }))) // 副作用 + 纯计算
    .map((ctx) => ({ // 纯计算：汇总
      label: ctx.label,
      orderCount: ctx.orders.length,
      total: ctx.orders.reduce((s, o) => s + applyDiscount(o.amount, ctx.user), 0),
    }));
console.log('  2) 组合异步计划（此时一次请求都没发，fakeApi.calls =', fakeApi.calls, '）');
const summarizePlan = summarizeUserPlan('u1');
console.log('     计划 →', summarizePlan.inspect(), '  fakeApi.calls =', fakeApi.calls);
console.log('     run() →', JSON.stringify(await summarizePlan.run()), '  fakeApi.calls =', fakeApi.calls);

// 3) 同一个计划可以反复执行 —— 于是"重试"变成了顺手的事（Promise 做不到这一点）。
let attempts = 0;
const flakyTask = Task.from(() => {
  attempts++;
  return attempts < 2 ? Promise.reject(new Error('网络抖动')) : Promise.resolve('第 2 次成功了');
});
try {
  await flakyTask.run();
} catch (err) {
  console.log('  3) 第 1 次 run() 失败：', err.message, '（错误被 try/catch 接住了，进程不会崩）');
}
console.log('     同一个计划再 run() 一次 →', await flakyTask.run());
console.log('  ★ 这个"计划是值、可以重跑"的性质，是 Effect / Task 类库能优雅实现');
console.log('     retry / timeout / 并发控制 / 依赖注入 的根本原因。');
console.log('     而 Promise 是"一次性的、已经在跑的任务"，想重试只能重新调用产生它的函数。');

// 4) 错误处理：本文件里的 Task 是最小实现，失败会以 reject 的形式冒到出口。
//    更完整的做法是把错误也变成值：TaskEither<E, A>（fp-ts）或者 Effect 的 error channel ——
//    那时失败就不再是异常，而是像 03_either.js 讲的那样，是一个可以 map 的数据。
const failedTask = Task.from(() => Promise.reject(new Error('模拟的失败')));
try {
  await failedTask.run();
} catch (err) {
  console.log('  4) 失败在出口处被捕获：', err.message);
  console.log('     进阶方向：用 Either 承载错误（见 03_either.js），让"可能失败"写在返回值里；');
  console.log('     fp-ts 的 TaskEither、Effect-TS 的 Effect 都是这个思路的工业化版本。');
}

console.log('--- 6. 诚实结论：什么时候真的该用 IO / Task ---');

console.log('  先说清楚一个事实：**绝大多数 JavaScript 项目不需要手写 IO 函子**。');
console.log('  做到下面两件事，就已经拿到了 IO 想要的大部分收益：');
console.log('    · 业务逻辑写成纯函数（好测、好复用）—— 这是收益的大头；');
console.log('    · 副作用集中在边界（main / 路由处理函数 / 事件回调），用参数把依赖传进去。');
console.log('  这正是 05 号文件里那条管道的做法：解析是纯的，只有最后的输出发生在边界。');
console.log('  IO / Task 真正值得上的场合：');
console.log('    ✓ 副作用很多、需要"攒起来一起执行"或"按配置决定要不要执行"（第 4 节那种）；');
console.log('    ✓ 需要重试、超时、并发限制、依赖注入等横切能力，且想用组合的方式表达；');
console.log('    ✓ 团队已经在用 fp-ts / Effect-TS，或者需要把"流程"当数据传来传去；');
console.log('    ✓ 想通过它理解 Effect 系统 —— 它们是同一棵树上长出来的。');
console.log('  不值得上的场合：');
console.log('    ✗ 只有一两个副作用点 —— 直接 async/await 加一个 try/catch，可读性完胜；');
console.log('    ✗ 团队没接触过函子 —— 得先过 01/04 那两关，认知成本不低；');
console.log('    ✗ 把 IO 当成"异步同步化"或"错误处理框架"来用 —— 它两样都不是。');
console.log('  也见：');
console.log('    40_functional_programming/01_functor.js —— map 到底是什么；');
console.log('    40_functional_programming/04_monad.js —— chain 与单子定律（IO 是它的实例）；');
console.log('    40_functional_programming/03_either.js —— 把"可能失败"变成数据，与 TaskEither 直接相关；');
console.log('    18_async/04_promise_basics.js —— Promise 是急切的，这是两者最本质的差别；');
console.log('    28_testing/07_testing_pure_functions.js —— 纯核心为什么好测。');

console.log('--- 7. 小结 ---');
console.log('  副作用的两个麻烦：让函数不可测、不可组合。IO 函子的对策是"把它变成值"。');
console.log('  IO.of(() => ...) 是惰性的：不 run 就什么都不发生（IO.of(表达式) 会当场执行 —— 最大的坑）。');
console.log('  map 组合纯计算，chain 串联下一个 IO，run()/unsafePerformIO() 是唯一出口。');
console.log('  落地形态是"函数式核心 + 命令式外壳"：业务纯函数 + 边界处一次性执行。');
console.log('  异步版本叫 Task / Effect：和 Promise 的区别是急切 vs 惰性，');
console.log('  惰性带来两个能力 —— 计划可反复执行（retry）、可组合后再决定跑不跑。');
console.log('  诚实的建议：先做到"纯函数核心 + 边界集中副作用"，再考虑要不要上 IO 函子。');
console.log('  下一个话题（09_immutability_and_structural_sharing.js）：');
console.log('  说到这里，我们的"值"一直是不可变的。可真要"改"一个深层嵌套对象时，');
console.log('  { ...a, b: { ...a.b, c: 1 } } 这种展开会一路套下去 —— 那该怎么办？');
