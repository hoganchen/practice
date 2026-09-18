/**
 * ============================================================================
 * 知识点：装饰器模式 —— 用高阶函数包装函数（日志/计时/缓存/鉴权）
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/07_strategy.js、06_functions（闭包与高阶函数）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    装饰器模式在不修改原函数的前提下，给函数"套"上额外能力：
 *        const fn2 = withLogging(fn);   // fn 没被改动，fn2 多了日志能力
 *    它的实现公式只有一个：
 *        function withXxx(fn) { return function (...args) { ...额外逻辑...; return fn(...args); }; }
 *    接收一个函数、返回一个新函数 —— 这就是"高阶函数"在模式语言里的名字。
 *
 *    ⚠️ 关于语法糖：TC39 有一个"装饰器"提案（@decorator 语法），
 *    写起来像 `@withLogging class Foo {}` 或 `@readonly method() {}`。
 *    它的标准化历程很长（Stage 3，且历经大改），**Node 当前默认不支持该语法**，
 *    需要 Babel / TypeScript 编译。本文件**全部使用函数式实现**，
 *    不写任何 @decorator 语法，因此可以直接 `node` 运行。
 *    理解函数式实现之后，再学 @ 语法糖就只是"写法换了，思想没变"。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 日志/埋点：进出函数各打一条，不想在每个函数里手写。
 *    - 计时/性能监控：想知道这个接口慢在哪，且希望不侵入业务代码。
 *    - 缓存：昂贵计算（斐波那契、正则、格式化）结果复用。
 *    - 权限校验：进入前检查角色，没权限直接拒绝。
 *    - 重试/限流/防抖节流：都是"在调用前后加料"的同一种需求。
 *    这些叫"横切关注点"（cross-cutting concerns）：它们散落在所有业务函数周围，
 *    但又不属于任何一项业务。装饰器让它们能"叠"在业务之上，而不是"混"进去。
 *
 * 3. 核心语法要点
 *    - 保持 this：包装函数里必须用 fn.apply(this, args)（或 fn.call(this, ...args)），
 *      否则对象方法被包装后 this 会丢失（变成 undefined，严格模式下直接报错）。
 *    - 保持函数名与参数个数：Object.defineProperty 把 name 和 length 复制过去，
 *      这对调试、日志、以及依赖 fn.length 的库（如某些 DI 框架）很重要。
 *    - 装饰器链的顺序：withA(withB(fn)) 的执行顺序是"洋葱模型" ——
 *      A 的前置 -> B 的前置 -> fn -> B 的后置 -> A 的后置。
 *      也就是说**最外层先进入、最后退出**，写的时候是"从里往外"读。
 *    - 缓存装饰器要用 Map 而不是对象（键可能是任意值）。
 *    - 缓存要能失效：提供 invalidate / 版本号 / TTL，否则会返回过期数据。
 *
 * 4. 常见陷阱
 *    - 丢 this：直接写 fn(...args)，方法里的 this 就没了。
 *    - 丢函数名：包装后所有函数都叫 "anonymous" 或 "wrapper"，日志里分不清谁是谁。
 *    - 缓存了"不该缓存"的东西：有副作用、依赖外部状态、参数是对象（引用不同但内容相同）
 *      的函数，缓存会返回错误结果。
 *    - 缓存无限增长：没有上限或淘汰策略，就是内存泄漏。
 *    - 装饰器顺序写反：withAuth(withLogging(fn)) 与 withLogging(withAuth(fn))
 *      的差别是"未授权时要不要打日志"，这是语义差别，不是风格差别。
 *    - 洋葱模型里"前置/后置"的对称性被破坏：只写前置不写后置（如只在进函数前打日志）
 *      会让排查"卡在哪一步"变得困难。
 *    - 滥用：给每个函数都套 5 层装饰器，调用栈深不见底，性能也受影响。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/08_decorator.js
 *
 * 【预期输出】
 *   先对比"侵入式改造"与"装饰器改造"，再依次实现 withLogging / withTiming /
 *   withCache / withAuth，演示 this 保持、name/length 保持、装饰器链的洋葱顺序，
 *   并用对齐表格说明 @ 语法糖的现状，最后给出装饰器的代价与不适用场景。
 * ============================================================================
 */

// ===========================================================================
// 1. 问题引入：侵入式改造 vs 装饰器
// ===========================================================================

console.log('--- 1. 问题引入：横切逻辑会污染业务代码 ---');

/** 业务函数：计算订单总价（本身只有一行） */
function calcTotalBad(items) {
  // ↓ 为了打日志，业务代码里被迫插入了这些
  console.log('  [日志] 进入 calcTotalBad，参数：', JSON.stringify(items));
  const t0 = Date.now();
  const total = items.reduce((s, it) => s + it.price * it.qty, 0);
  console.log(`  [日志] calcTotalBad 耗时 ${Date.now() - t0}ms，返回 ${total}`);
  return total;
}
calcTotalBad([{ price: 10, qty: 2 }]);
console.log(`问题：如果 20 个函数都要日志 + 计时，就要复制 20 遍这四行；
  而且业务逻辑被挤在中间，读代码时要在噪音里找重点。`);

// ===========================================================================
// 2. withLogging：最基础的装饰器
// ===========================================================================

console.log('\n--- 2. withLogging：基础装饰器 ---');

/**
 * 日志装饰器：打印入参、返回值、耗时。
 * 注意三处细节：
 *   1) 用 function（不是箭头函数），因为需要自己的 arguments 与 this；
 *   2) 用 fn.apply(this, args) 保留调用上下文；
 *   3) 用 try/finally 保证即使抛错也能打出"退出"日志。
 */
function withLogging(fn, options = {}) {
  const { label = fn.name || 'anonymous' } = options;

  const wrapped = function (...args) {
    console.log(`  → ${label} 调用，参数：${JSON.stringify(args)}`);
    const t0 = Date.now();
    try {
      // ★关键：apply 的第一个参数是 this。
      //   如果这里写成 fn(...args)，被包装的方法一旦依赖 this 就会炸。
      const result = fn.apply(this, args);
      console.log(`  ← ${label} 返回：${JSON.stringify(result)}（${Date.now() - t0}ms）`);
      return result;
    } catch (err) {
      console.log(`  ✗ ${label} 抛错：${err.message}（${Date.now() - t0}ms）`);
      throw err; // 装饰器只观察，不吞掉业务错误
    }
  };

  // 把原函数的 name 与 length 复制到包装函数上（见第 3 节详解）
  copyMeta(wrapped, fn);
  return wrapped;
}

/**
 * 复制函数的元信息（name / length）。
 * 为什么重要：
 *   - name 会出现在日志、错误堆栈、性能分析工具里，全是 "wrapped" 就没法看；
 *   - length 是形参个数，一些库（如依赖注入、柯里化工具）会读它来推断参数个数。
 */
function copyMeta(target, source) {
  // defineProperty 而不是直接赋值：name/length 是只读且不可枚举的属性
  Object.defineProperty(target, 'name', { value: source.name, configurable: true });
  Object.defineProperty(target, 'length', { value: source.length, configurable: true });
  return target;
}

function addTax(amount, rate) {
  return Number((amount * (1 + rate)).toFixed(2));
}

const loggedAddTax = withLogging(addTax);
console.log('结果：', loggedAddTax(100, 0.13));
console.log('包装后函数名仍是：', loggedAddTax.name, '| 形参个数仍是：', loggedAddTax.length, '（原函数是', addTax.length, '）');

// 抛错场景：装饰器记录了错误，然后原样抛出，由这里 catch
const loggedFail = withLogging(function mightFail(x) {
  if (x < 0) throw new RangeError('金额不能为负');
  return x;
});
loggedFail(5);
try {
  loggedFail(-1);
} catch (err) {
  console.log('  业务错误被原样抛出，由调用方处理：', err.name, '-', err.message);
}

// ===========================================================================
// 3. 保持 this：装饰器最容易踩的坑
// ===========================================================================

console.log('\n--- 3. 保持 this：最经典的坑 ---');

console.log('反面示范（不用 apply）：');
/** 错误实现：直接 fn(...args) 调用，this 丢失 */
function withLoggingBroken(fn) {
  return function (...args) {
    // ✗ 这里的 this 是 undefined（模块顶层是严格模式），
    //   传给原函数时它拿不到调用者对象
    return fn(...args);
  };
}

class Counter {
  constructor() {
    this.count = 0;
  }
  incrementBy(n) {
    // 这个方法依赖 this
    this.count += n;
    return this.count;
  }
}

const c = new Counter();
const broken = withLoggingBroken(c.incrementBy);
try {
  // 注意：这里用 .call(c) 把 this 传给了包装函数，
  // 但包装函数内部用 fn(...args) 调用，this 没有被转发下去
  broken.call(c, 1);
} catch (err) {
  console.log('  丢 this 的后果：', err.name, '-', err.message);
}

console.log('正确示范（用 apply 转发 this）：');
const good = withLogging(c.incrementBy);
console.log('  good.call(c, 5) =>', good.call(c, 5), '| c.count =', c.count);

// 更实用的写法：直接装饰原型方法 / 实例方法
const c2 = new Counter();
c2.incrementBy = withLogging(c2.incrementBy); // 装饰实例方法
console.log('  装饰实例方法后调用 c2.incrementBy(3)：');
console.log('  返回', c2.incrementBy(3), '（this 正确指向 c2）');

// ===========================================================================
// 4. withTiming 与 withCache
// ===========================================================================

console.log('\n--- 4. withTiming 与 withCache ---');

/** 计时装饰器：把耗时记录下来，而不是只打印（便于聚合统计） */
function withTiming(fn, stats = []) {
  const wrapped = function (...args) {
    const t0 = performance.now();
    try {
      return fn.apply(this, args);
    } finally {
      // 用 finally 保证抛错时也记录耗时
      const ms = performance.now() - t0;
      stats.push({ fn: fn.name, ms });
    }
  };
  copyMeta(wrapped, fn);
  wrapped.stats = stats; // 把统计数组挂在包装函数上，外部可读取
  return wrapped;
}

/** 一个"昂贵"的计算：故意做几十万次循环，控制在 1 秒以内 */
function expensiveSum(limit) {
  let sum = 0;
  for (let i = 0; i < limit; i += 1) sum += i % 7;
  return sum;
}

const timedSum = withTiming(expensiveSum);
timedSum(300_000);
timedSum(300_000);
timedSum(300_000);
console.log('计时统计（3 次调用）：', timedSum.stats.map((s) => `${s.fn}:${s.ms.toFixed(2)}ms`).join(', '));

/**
 * 缓存装饰器（memoize）：
 *   - 键 = 参数序列化后的字符串（这里用 JSON.stringify，够用但不完美）；
 *   - 用 Map 存（键可能是数字/字符串/对象）；
 *   - 暴露 invalidate() 清理缓存 —— 没有失效机制的缓存迟早会出错。
 */
function withCache(fn) {
  const cache = new Map();
  let hits = 0;
  let misses = 0;

  const wrapped = function (...args) {
    // ★陷阱：JSON.stringify 无法区分 {a:1,b:2} 与 {b:2,a:1}（键顺序不同），
    //   对参数是对象且键顺序不固定的函数，需要更严谨的键生成策略（如稳定序列化）。
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      hits += 1;
      return cache.get(key);
    }
    misses += 1;
    const value = fn.apply(this, args);
    cache.set(key, value);
    return value;
  };

  copyMeta(wrapped, fn);
  wrapped.stats = () => ({ hits, misses, size: cache.size });
  wrapped.invalidate = () => {
    cache.clear();
    hits = 0;
    misses = 0;
  };
  return wrapped;
}

const cachedSum = withCache(expensiveSum);
const t0 = performance.now();
const r1 = cachedSum(300_000); // 第一次：真算
const t1 = performance.now();
const r2 = cachedSum(300_000); // 第二次：命中缓存
const t2 = performance.now();
console.log(`首次结果 ${r1}，耗时 ${(t1 - t0).toFixed(2)}ms`);
console.log(`二次结果 ${r2}，耗时 ${(t2 - t1).toFixed(4)}ms（快了约 ${((t1 - t0) / Math.max(t2 - t1, 0.0001)).toFixed(0)} 倍）`);
console.log('缓存统计：', cachedSum.stats());
cachedSum.invalidate();
console.log('invalidate 之后：', cachedSum.stats());

// ===========================================================================
// 5. withAuth：前置校验类装饰器（会"短路"）
// ===========================================================================

console.log('\n--- 5. withAuth：不满足条件时短路 ---');

/**
 * 权限装饰器：如果校验不通过，**直接返回**，根本不调用原函数。
 * 这是装饰器的另一种形态："守卫"（guard）——
 * 它不只是加料，还会拦截。这类装饰器在顺序上必须靠外层（见第 6 节）。
 */
function withAuth(fn, { requiredRole, getCurrentUser }) {
  const wrapped = function (...args) {
    const user = getCurrentUser();
    if (!user) {
      // 短路：不调用 fn，直接给出结果
      console.log(`  ⛔ ${fn.name} 被拒绝：未登录`);
      return { ok: false, reason: 'UNAUTHORIZED' };
    }
    if (requiredRole && !user.roles.includes(requiredRole)) {
      console.log(`  ⛔ ${fn.name} 被拒绝：需要角色 ${requiredRole}，当前 ${user.roles.join('/') || '无'}`);
      return { ok: false, reason: 'FORBIDDEN' };
    }
    console.log(`  ✅ ${fn.name} 鉴权通过（用户 ${user.name}）`);
    return fn.apply(this, args);
  };
  copyMeta(wrapped, fn);
  return wrapped;
}

let currentUser = null;
const getCurrentUser = () => currentUser;

function deleteArticle(articleId) {
  return { ok: true, deleted: articleId };
}

const guardedDelete = withAuth(deleteArticle, { requiredRole: 'admin', getCurrentUser });

console.log('-- 未登录 --');
console.log('  结果：', guardedDelete(42));
console.log('-- 登录为普通用户 --');
currentUser = { name: '张三', roles: ['editor'] };
console.log('  结果：', guardedDelete(42));
console.log('-- 登录为管理员 --');
currentUser = { name: '李四', roles: ['editor', 'admin'] };
console.log('  结果：', guardedDelete(42));

// ===========================================================================
// 6. 装饰器链：洋葱模型与顺序
// ===========================================================================

console.log('\n--- 6. 装饰器链的顺序（洋葱模型） ---');

/**
 * 用一个"标记进入/退出"的装饰器，把执行顺序可视化。
 * 注意：withTrace(tag, fn) 的参数顺序与前几个装饰器不同（tag 在前），
 * 这是为了演示"装饰器本身也可以参数化"，代价是它不能再被直接当高阶函数用。
 */
function withTrace(tag, fn) {
  const wrapped = function (...args) {
    console.log(`    [${tag}] 进入`);
    const result = fn.apply(this, args);
    console.log(`    [${tag}] 退出`);
    return result;
  };
  copyMeta(wrapped, fn);
  return wrapped;
}

function core() {
  console.log('      >>> 业务函数本体执行');
  return 'done';
}

// 写法一：手工嵌套 —— 读的时候"从里往外"
console.log('链：A(B(core))，即最外层是 A');
const chain = (fn) => withTrace('A', withTrace('B', withTrace('C', fn)));
chain(core)();

console.log('\n链：C(B(core))，交换一下最外层');
const chain2 = (fn) => withTrace('C', withTrace('B', withTrace('A', fn)));
chain2(core)();

console.log(`\n结论：withX(withY(fn)) 的执行顺序是
    前置：X 先于 Y 先于 fn
    后置：fn 先于 Y 先于 X
  即"最后包装的最先执行"（像洋葱：最外层最先被穿过，也最后被离开）。
  用 reduce 表达"按数组顺序包装"时，要注意 reduce 是从左往右累加的：
    [A, B, C].reduce((acc, dec) => dec(acc), core) 的结果是 C(B(A(core)))，
  也就是说"数组里写在最后的，变成了最外层"。这是最常见的顺序错误来源。`);

// 用一个 arrayReduce 版本再验证一次上面的结论
const decorators = [(fn) => withTrace('A', fn), (fn) => withTrace('B', fn), (fn) => withTrace('C', fn)];
const reduced = decorators.reduce((acc, dec) => dec(acc), core);
console.log('\nreduce 版本（数组 [A, B, C]）执行结果：');
reduced();
console.log('  注意最外层是 C（数组最后一项），印证了上面那句话。');

// ---------------------------------------------------------------------------
// 顺序的语义差别：鉴权应该在外层还是内层？
// ---------------------------------------------------------------------------

console.log('\n--- 6.2 顺序的语义差别：日志 vs 鉴权 ---');

const traceLog = (fn) => withTrace('LOG', fn); // 模拟日志装饰器
const traceAuth = (fn) => withTrace('AUTH', fn); // 模拟鉴权装饰器

console.log('顺序 1：LOG(AUTH(core)) —— 未授权时"也会打日志"（审计需要）');
traceLog(traceAuth(core))();

console.log('\n顺序 2：AUTH(LOG(core)) —— 未授权时"不会打日志"（日志只记录真正执行过的调用）');
traceAuth(traceLog(core))();

console.log(`\n（上面两次都走的是"鉴权通过"的正常路径，所以两条链的输出看起来只是顺序不同。
  真正的差别出现在"鉴权失败"时 —— 由于 traceAuth 在这里只是打标记、不会短路，
  下面用第 5 节那个会短路的 withAuth 来验证：）

这两种顺序没有绝对的对错，取决于业务要求：
  - 安全审计要求"记录所有尝试（含被拒绝的）" -> 日志放最外层（守卫在内层）；
    此时 withLogging(withAuth(fn)) 里，auth 拒绝后日志装饰器仍会执行，能记下"被拒了一次"。
  - 只关心成功执行的耗时统计 -> 守卫放最外层 withAuth(withLogging(fn))，
    挡掉无效调用后再进入日志与业务，日志里不会出现被拒绝的噪音。`);

// 用会短路的 withAuth 验证上面第一条结论
const logsWhenRejected = withLogging(
  withAuth(function riskyAction() { return 'executed'; }, { requiredRole: 'admin', getCurrentUser: () => null }),
  { label: 'riskyAction(外层日志)' },
);
console.log('日志在外层时，鉴权失败仍然留下了记录：', logsWhenRejected());
console.log('（可以看到 → 和 ← 都打印了，说明日志装饰器确实执行了，只是内部被短路）');

// ===========================================================================
// 7. TC39 装饰器语法提案的现状
// ===========================================================================

console.log('\n--- 7. TC39 装饰器提案（@decorator 语法）现状 ---');

console.log(`【现状】
  TC39 有一个"Decorators"提案（Stage 3），允许这样写：

      @withLogging
      class Service {
        @withTiming
        async fetchUser(id) { ... }
      }

  但请注意：
  1) 该语法**当前 Node 默认不支持**（本文件若写 @ 语法会直接 SyntaxError），
     需要 TypeScript 的 experimentalDecorators / 或 Babel 插件来编译。
  2) 提案经历过一次大改（"legacy decorators" -> "standard decorators"），
     两套语义在"能否改方法本身""this 绑定""初始化顺序"上都有差别。
     很多老项目的 @ 写法属于 legacy 版本。
  3) 装饰器的**核心思想完全相同**：接收目标、返回替换品。
     本文件用函数式实现，正是为了让你先看清思想，再去看语法糖。

【函数式 vs 语法糖的取舍】
  函数式（本文件）：
    + 无需编译，任何 JS 环境都能跑；
    + 只作用于函数，非常直白：const f2 = withCache(f)；
    + 可以随时组合、当普通值传递。
    - 只能包装函数，不能装饰类字段/访问器；
    - 装饰链要手写嵌套，容易顺序出错。
  语法糖（@）：
    + 可以作用于类、方法、访问器、字段，能表达更丰富的位置信息；
    + 一眼能看出"这个类被装饰了"，声明式。
    - 需要编译工具链；
    - 语义更复杂（初始化顺序、元数据），调试时更绕。

本文件的所有装饰器都可以直接用在方法上：
    class A { method = withLogging(originalMethod) }   // 类字段写法，无需编译器`);

// 演示"函数式装饰器 + 类字段"的组合，这是不需要编译器的替代方案
class Service {
  // 类字段初始化时套上装饰器，效果接近 @ 语法
  fetchUser = withLogging(function fetchUser(id) {
    return { id, name: `user-${id}` };
  });
}
const svc = new Service();
console.log('类字段 + 函数式装饰器：');
console.log('  结果：', svc.fetchUser(7));

// ===========================================================================
// 8. 代价与什么时候不该用
// ===========================================================================

console.log('\n--- 8. 装饰器的代价与不适用场景 ---');

console.log(`【代价】
  1) 调用栈变深：每层装饰器多一帧。5 层装饰器 + 业务函数 = 6 帧，
     错误堆栈里全是 wrapped，定位成本上升。
  2) 性能损耗：每次调用都要多走一层函数调用 + 参数展开 + 可能的 JSON.stringify。
     热路径（每秒百万次）上的缓存装饰器可能比原函数本身还慢。
     本文件用 30 万次循环演示耗时，正是因为装饰器的常数开销在循环里会累积。
  3) 调试困难：断点打在业务函数里时，this 和局部变量都正常，
     但"为什么没被调用"（被鉴权短路了）光看业务代码看不出来。
  4) 隐式行为：读代码时容易漏掉装饰器带来的副作用（缓存、重试、超时），
     于是出现"我明明只调用了一次，为什么日志里出现两次"这类困惑。
  5) 元信息丢失风险：name/length/原型链/静态属性都需要手工复制，
     漏一个就可能让某个库的行为异常。

【什么时候不该用】
  1) 只有一处需要这段横切逻辑：直接写在那个函数里更清楚，
     装饰器的价值来自"复用"，用不上复用就不要引入间接。
  2) 逻辑与业务强耦合：比如"计算金额后按业务规则写审计表"，
     这不是横切关注点，抽象成装饰器会割裂上下文。
  3) 需要访问函数内部状态：装饰器只能看到参数与返回值，
     想读中间变量就只能在函数里写代码。
  4) 对性能极度敏感的热路径：用宏/代码生成/手工内联代替。
  5) 会改变函数签名的场景：装饰器适合"签名不变"的增强，
     若包装后参数含义变了，调用方会非常困惑。

判断口诀：问自己"这段代码和业务逻辑有关系吗？"
  没有 -> 装饰器；有 -> 就写在业务里。
  再问"它会被用在 3 个以上的地方吗？" 不会 -> 别抽。`);

console.log('\n全部演示完毕。');
