/**
 * ============================================================================
 * 知识点：Promise 静态方法 —— resolve / reject / withResolvers / try
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】进阶
 * 【前置知识】18_async/08_async_error_handling.js
 *
 * 【也见】withResolvers 另见 34_modern_es_features/04_es2024_features.js（ES2024 特性综述）；
 *        Promise.try 另见 34_modern_es_features/07_promise_try_and_regexp_escape.js（ES2025 三件套）。
 *        本文件是「Promise 静态方法」的主场，按方法逐个讲语义；那两篇从"版本新特性"视角切入。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    除了四个组合器，Promise 构造器上还有一组"造 Promise"的静态方法：
 *      - Promise.resolve(v)     造一个已兑现的 Promise；
 *      - Promise.reject(e)      造一个已拒绝的 Promise；
 *      - Promise.withResolvers() 造一个 Promise 并把 resolve / reject 暴露出来；
 *      - Promise.try(fn)        用 Promise 的方式执行一个可能是同步也可能抛错的函数；
 *      - new Promise(executor)  最基础的构造方式。
 *
 * 2. 为什么需要
 *    - resolve 的妙处在于"归一化"：不管拿到的是普通值、thenable 还是 Promise，
 *      都能统一成 Promise，于是调用方不必再判断类型。
 *    - withResolvers 解决"我需要把 resolve 拿到外面去用"的场景
 *      （事件回调、只触发一次的监听器），过去只能自己写一堆样板代码。
 *    - try 解决"这个函数到底是同步抛错还是返回 Promise 我分不清"的问题：
 *      两种情况都能被同一个 catch 接住。
 *
 * 3. 核心语法要点
 *    - Promise.resolve(p) 如果 p 本身就是 Promise，会**原样返回**它（不包装）。
 *    - Promise.resolve(thenable) 会把带 then 方法的对象"同化"成 Promise。
 *    - withResolvers 返回 { promise, resolve, reject } 三个属性（ES2024，Node 22+）。
 *    - Promise.try(fn) 会同步调用 fn，返回值按 resolve 处理，抛错按 reject 处理
 *      （ES2025，Node 23+）。
 *
 * 4. 常见陷阱
 *    - Promise.reject(e) 创建后立刻要有处理者，否则会被判定为"未处理的拒绝"。
 *    - 以为 Promise.resolve(p) 会创建新 Promise，于是写出 `if (p === q)`
 *      这种误判（其实同一个引用会被原样返回）。
 *    - 在旧版 Node 上直接调用 withResolvers / try 会报
 *      "is not a function"——用之前先做能力检测。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/11_promise_static_methods.js
 *
 * 【预期输出】
 *   各静态方法的行为演示，包含能力检测结果与局部实现（polyfill）演示。
 * ============================================================================
 */

const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

// ---------------------------------------------------------------------------
// 1. Promise.resolve：归一化任何值
// ---------------------------------------------------------------------------

console.log('--- 1. Promise.resolve 的归一化能力 ---');

// 普通值 → 已兑现的 Promise
const p1 = Promise.resolve(42);
console.log('  普通值：', p1.constructor.name, '，兑现值：', await p1);

// 传入 Promise → 原样返回（注意是"同一个引用"）
const source = delay(5, '原始 Promise');
const p2 = Promise.resolve(source);
console.log('  传入 Promise 时是同一个对象吗：', p2 === source, '（不会再多包一层）');

// 传入 thenable（有 then 方法的普通对象）→ 被"同化"
const thenable = {
  then(resolve) {
    // 这个函数就是我们熟悉的 resolve，thenable 可以自己决定何时调用它
    setTimeout(() => resolve('来自 thenable 的值'), 5);
  },
};
console.log('  thenable 同化结果：', await Promise.resolve(thenable));

// 传入 undefined / null 也没问题（得到兑现值为 undefined 的 Promise）
console.log('  undefined：', await Promise.resolve(undefined));

// 实用场景：函数参数既可能是值也可能是 Promise 时，统一包装
async function normalize(input) {
  return await Promise.resolve(input);
}
console.log('  统一包装普通值：', await normalize('字符串'));
console.log('  统一包装 Promise：', await normalize(delay(5, '异步值')));

// 注意一个反直觉点：await 一个普通值也会让出一次执行权（见 07 篇第 3 节），
// 所以 normalize 里即使传入普通值，也是异步返回的。

// ---------------------------------------------------------------------------
// 2. Promise.reject：造一个已拒绝的 Promise
// ---------------------------------------------------------------------------

console.log('\n--- 2. Promise.reject ---');

// 创建之后要立刻挂上处理者，否则会变成"未处理的拒绝"
await Promise.reject(new Error('立即拒绝')).catch((e) =>
  console.log('  捕获 Promise.reject：', e.message),
);

// 实用场景：在条件分支里统一"返回失败的 Promise"
function ensurePositive(n) {
  if (n > 0) {
    return Promise.resolve(n);
  }
  // 两个分支都返回 Promise，调用方写法统一
  return Promise.reject(new Error(`必须是正数，实际是 ${n}`));
}

console.log('  合法输入：', await ensurePositive(5));
await ensurePositive(-1).catch((e) => console.log('  非法输入：', e.message));

// ---------------------------------------------------------------------------
// 3. Promise.withResolvers：把 resolve / reject 交到外面
// ---------------------------------------------------------------------------

console.log('\n--- 3. Promise.withResolvers（ES2024 / Node 22+） ---');

console.log('  当前环境支持吗：', typeof Promise.withResolvers === 'function');

// 过去要这么写：把 resolve/reject 存在外部变量里
let outerResolve;
const manualPromise = new Promise((resolve) => {
  outerResolve = resolve;
});
setTimeout(() => outerResolve('手动交出的 resolve 被调用'), 5);
console.log('  传统写法结果：', await manualPromise);

// withResolvers 一步搞定，语义也更清晰
if (typeof Promise.withResolvers === 'function') {
  const { promise, resolve, reject } = Promise.withResolvers();

  // 典型场景：某个事件/回调只触发一次，触发时就把 Promise 兑现
  setTimeout(() => resolve('withResolvers 的结果'), 5);
  console.log('  withResolvers 结果：', await promise);

  // reject 那一侧也一样
  const second = Promise.withResolvers();
  setTimeout(() => second.reject(new Error('withResolvers 的失败')), 5);
  await second.promise.catch((e) => console.log('  withResolvers 拒绝：', e.message));
} else {
  console.log('  当前 Node 版本不支持，跳过该演示（需要 Node 22 及以上）');
}

// ---------------------------------------------------------------------------
// 4. Promise.try：同步抛错与异步拒绝一视同仁
// ---------------------------------------------------------------------------

console.log('\n--- 4. Promise.try（ES2025 / Node 23+） ---');

console.log('  当前环境支持吗：', typeof Promise.try === 'function');

function mayThrowSync(shouldThrow) {
  if (shouldThrow) {
    throw new Error('我是同步抛出的错误');
  }
  return delay(5, '我是异步返回的值');
}

// 问题：这个函数可能同步抛错，也可能返回 Promise。
// 直接把它放进 Promise.all(...) 里，同步抛错会在**调用的一瞬间**炸出来，
// 而 Promise.all 的 catch 是接不到同步抛错的。
if (typeof Promise.try === 'function') {
  // Promise.try 把"调用"这件事也包进了 Promise 里，两种情况统一处理
  await Promise.try(() => mayThrowSync(false)).then((v) =>
    console.log('  Promise.try 正常路径：', v),
  );
  await Promise.try(() => mayThrowSync(true)).catch((e) =>
    console.log('  Promise.try 捕获同步抛错：', e.message),
  );

  // 对照：不用 Promise.try 时，同步抛错会直接抛出，下面的 catch 抓不到
  try {
    // 如果 mayThrowSync(true) 直接写在这里，它会同步抛出，
    // 根本来不及变成 Promise 的拒绝。所以要先包一层函数：
    await Promise.resolve().then(() => mayThrowSync(true));
  } catch (e) {
    console.log('  用 then 包一层也能捕获：', e.message, '（但多了一层嵌套）');
  }
} else {
  console.log('  当前 Node 版本不支持 Promise.try，跳过该演示（需要 Node 23 及以上）');
}

// 手写一个等价的实现，理解它只有几行代码（这里用普通函数，避免改写内置对象）
function promiseTry(fn, ...args) {
  return new Promise((resolve) => {
    // 用 executor 包住同步调用：fn 正常返回就兑现，
    // fn 同步抛错也会被 executor 捕获并转成拒绝。
    resolve(fn(...args));
  });
}

await promiseTry(() => mayThrowSync(false)).then((v) =>
  console.log('  手写实现正常路径：', v),
);
await promiseTry(() => mayThrowSync(true)).catch((e) =>
  console.log('  手写实现捕获同步抛错：', e.message),
);

// ---------------------------------------------------------------------------
// 5. 四种创建方式对照
// ---------------------------------------------------------------------------

console.log('\n--- 5. 四种创建方式对照 ---');

const rows = [
  ['new Promise(executor)', '需要在内部驱动异步操作', 'executor 同步立即执行'],
  ['Promise.resolve(v)', '把已有值/thenable 归一化', '传入 Promise 会原样返回'],
  ['Promise.reject(e)', '分支里表示失败', '创建后必须有人处理'],
  ['Promise.withResolvers()', 'resolve/reject 要给到外面用', 'Node 22+'],
  ['Promise.try(fn)', '不确定 fn 会同步抛错还是异步返回', 'Node 23+'],
];

for (const [api, usage, note] of rows) {
  console.log(`  ${api.padEnd(26)} 用途：${usage.padEnd(30)} 备注：${note}`);
}

console.log('\n示例结束。');
