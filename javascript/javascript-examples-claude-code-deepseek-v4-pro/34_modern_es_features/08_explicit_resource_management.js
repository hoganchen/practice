/**
 * ============================================================================
 * 知识点：ES2025 显式资源管理（Explicit Resource Management）——
 *         using / await using、Symbol.dispose、Symbol.asyncDispose、SuppressedError
 * ============================================================================
 *
 * 【所属分类】34_modern_es_features —— 现代 ES 新特性
 * 【难度等级】高级
 * 【前置知识】20_error_handling/、18_async/08_async_error_handling.js、17_iterators_and_generators/
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "显式资源管理"给 JavaScript 补上了类似 C# `using` / Python `with` / Java
 *    try-with-resources 的**确定性资源释放**能力。它由四部分组成：
 *      (1) 两个内置 Symbol：`Symbol.dispose` / `Symbol.asyncDispose`（资源协议）
 *      (2) 两种新声明：`using x = ...` 和 `await using x = ...`
 *      (3) 一个新的错误类型：`SuppressedError`（清理阶段出错时，同时保留两个错误）
 *      (4) 两个内置工具类：`DisposableStack` / `AsyncDisposableStack`
 *
 * 2. 为什么需要（真实项目场景）
 *    有一类资源"必须配对释放"，忘记释放的代价非常真实：
 *      打开的文件句柄、数据库连接、事务/锁、定时器、事件订阅、Worker、
 *      流（stream）、原生句柄（fd）、互斥量……
 *    以前只能用 try/finally 手工保证：
 *
 *      const handle = open();
 *      try {
 *        doWork(handle);
 *      } finally {
 *        handle.close();   // 必须记得写，而且资源一多就变成"嵌套金字塔"
 *      }
 *
 *    问题在于：
 *      · 资源多了以后 try/finally 层层嵌套，缩进爆炸；
 *      · 一旦在 finally 里再次抛错，原始错误会被**悄悄覆盖**，排查时只能看到
 *        清理错误，根因丢失（SuppressedError 就是为了解决这个）；
 *      · 代码审查时要靠人肉确认"每个 open 都有 close"，很容易漏。
 *    用 using 之后，声明即注册清理，代码是**线性**的、离开作用域自动释放。
 *
 * 3. 核心语法要点
 *    - 资源协议：对象只要有 `[Symbol.dispose]()` 方法，就是"可被 using 管理"的；
 *      有 `[Symbol.asyncDispose]()` 则可被 `await using` 管理。
 *    - `using x = expr;` ：在当前**块作用域**结束时自动调用 `x[Symbol.dispose]()`。
 *    - `await using x = expr;`：作用域结束时 `await x[Symbol.asyncDispose]()`。
 *      如果对象同时有 asyncDispose 和 dispose，`await using` **优先用 asyncDispose**。
 *    - 释放顺序是 **LIFO（后进先出）**，和栈一样 —— 这与资源获取顺序相反，
 *      符合"后打开的先关闭"的直觉（例如：先拿锁再开事务，就应该先提交事务再放锁）。
 *    - `using x = null` / `using x = undefined` 是**合法**的，等价于"没有资源"。
 *    - `SuppressedError`：主体抛错 + 清理也抛错时，抛出的就是它。
 *      它的 `.error` 是主体错误，`.suppressed` 是清理时抛出的错误。
 *    - `DisposableStack` 提供命令式 API：`use()` / `adopt()` / `defer()` /
 *      `move()` / `dispose()`，适合"要动态决定注册多少资源"的场景。
 *
 * 4. 常见陷阱
 *    - `using` 是**声明**，不是表达式：不能写 `using(expr)`，也不能放在表达式位置。
 *    - 初始值必须有 `[Symbol.dispose]`，否则在**初始化那一刻**就抛 TypeError
 *      （哪怕后面根本用不到这个资源）。所以"可能是 null"的值要显式判空。
 *    - 普通对象（如 `{}`、数组、Promise）没有 `[Symbol.dispose]`，直接 using 会报错；
 *      Node 的 FileHandle / 一些库对象已经实现了该协议。
 *    - `using` 的清理是**同步**的：如果 dispose 本身要异步完成，必须用 `await using`，
 *      否则 Promise 不会被等待（可能"清理没做完就退出了"）。
 *    - SuppressedError 会"包一层"，日志里如果只打印 `err.message` 就会丢掉根因，
 *      要记得同时打印 `err.error` 和 `err.suppressed`。
 *    - **作用域**很关键：`using` 绑定在最近的块 `{}` / 函数体 / 模块顶层上。
 *      写在循环体里，每一轮迭代结束都会释放一次（这正是你想要的）。
 *    - `DisposableStack` 的注册顺序与释放顺序相反；`move()` 之后原 stack 不可再用。
 *    - 本特性较新，旧运行时（以及部分构建工具的语法解析器）可能还不认这段语法。
 *      本文件开头的"支持情况检测"用 `new Function` 做**解析探测**，
 *      并在不支持时给出等价的手写实现；但要注意：如果运行时完全不认 `using`
 *      语法，本文件在**解析阶段**就会失败，任何运行期检测都救不了它。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 34_modern_es_features/08_explicit_resource_management.js
 *
 * 【预期输出】
 *   依次打印 8 个小节。因为 `using` 是语法层面的特性，本文件会先在
 *   `new Function` 里做解析探测并打印"本机支持：是/否"，然后：
 *     · 支持时：直接演示原生 `using` / `await using` / SuppressedError
 *     · 不支持时：只演示手写等价实现（try/finally）
 * ============================================================================
 */

console.log('='.repeat(70));
console.log('ES2025 显式资源管理演示');
console.log('当前 Node 版本：', process.version);
console.log('='.repeat(70));

// ---------------------------------------------------------------------------
console.log('\n--- 0. 支持情况检测（using 是语法特性，只能做解析探测）---');
// ---------------------------------------------------------------------------

// `using` 是声明语法，没有对应的全局对象可以用 typeof 检测。
// 唯一的办法是让解析器"试一试"：把一小段带 using 的源码交给 new Function，
// 能编译通过就说明支持。
function detectUsingSupport() {
  try {
    // eslint-disable-next-line no-new-func
    new Function('const r = { [Symbol.dispose]() {} }; using x = r; return 1;');
    return true;
  } catch {
    return false;
  }
}
function detectAwaitUsingSupport() {
  try {
    // eslint-disable-next-line no-new-func
    new Function('return async function () { const r = { [Symbol.asyncDispose]() {} }; await using x = r; };');
    return true;
  } catch {
    return false;
  }
}

const USING_SUPPORTED = detectUsingSupport();
const AWAIT_USING_SUPPORTED = detectAwaitUsingSupport();

console.log('本机支持 using 声明：' + (USING_SUPPORTED ? '是' : '否'));
console.log('本机支持 await using 声明：' + (AWAIT_USING_SUPPORTED ? '是' : '否'));
console.log('本机支持 Symbol.dispose：' + (typeof Symbol.dispose === 'symbol' ? '是' : '否'));
console.log('本机支持 Symbol.asyncDispose：' + (typeof Symbol.asyncDispose === 'symbol' ? '是' : '否'));
console.log('本机支持 SuppressedError：' + (typeof SuppressedError === 'function' ? '是' : '否'));
console.log('本机支持 DisposableStack：' + (typeof DisposableStack === 'function' ? '是' : '否'));
console.log('本机支持 AsyncDisposableStack：' + (typeof AsyncDisposableStack === 'function' ? '是' : '否'));

// 语法速查（无论本机是否支持，先把语法写清楚）：
// ────────────────────────────────────────────────────────────────────────────
//   // 1) 最基本的形态：块作用域结束时自动释放
//   {
//     using handle = openFile('a.txt');
//     handle.write('...');
//   }                                     // ← 这里自动调用 handle[Symbol.dispose]()
//
//   // 2) 资源对象需要实现协议
//   const resource = {
//     [Symbol.dispose]() { /* 释放 */ },
//   };
//   const asyncResource = {
//     async [Symbol.asyncDispose]() { /* 异步释放 */ },
//   };
//
//   // 3) 异步清理
//   {
//     await using conn = await connect();
//   }                                     // ← 这里 await conn[Symbol.asyncDispose]()
//
//   // 4) 一次声明多个：释放顺序是"后声明的先释放"（LIFO）
//   {
//     using a = open('a');
//     using b = open('b');                // 先释放 b，再释放 a
//   }
//
//   // 5) 允许 null / undefined（表示"这次没有资源"）
//   using maybe = lookUpResource();       // 可以是 null，不会报错
// ────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
console.log('\n--- 1. 问题背景：以前怎么写（try/finally 的三大痛点）---');
// ---------------------------------------------------------------------------

// 模拟一个"必须配对释放"的资源
const openResources = [];
function makeResource(name, { failOnDispose = false, log = openResources } = {}) {
  log.push(`打开 ${name}`);
  return {
    name,
    use() {
      log.push(`使用 ${name}`);
    },
    [Symbol.dispose]() {
      if (failOnDispose) {
        log.push(`释放 ${name} 时出错`);
        throw new Error(`释放 ${name} 失败`);
      }
      log.push(`释放 ${name}`);
    },
  };
}

// 【以前写法】try/finally —— 能工作，但有几个真实痛点
function oldWay() {
  const log = [];
  const a = makeResource('连接A', { log });
  try {
    const b = makeResource('连接B', { log });
    try {
      a.use();
      b.use();
    } finally {
      b[Symbol.dispose]();
    }
  } finally {
    a[Symbol.dispose]();
  }
  return log;
}
console.log('[以前写法] try/finally 嵌套：');
console.log('  ' + oldWay().join(' → '));

console.log('\n痛点 1：资源越多，嵌套越深（3 个资源就是 3 层 try/finally）');
console.log('痛点 2：释放顺序必须**手工**保证与获取顺序相反，写反了就是隐蔽的 bug');
console.log('痛点 3：如果 finally 里再次抛错，原始错误会被覆盖 —— 根因丢失');

// 演示痛点 3（用一个"清理时抛错"的经典例子）
try {
  const log = [];
  const r = makeResource('会出错连接', { failOnDispose: true, log });
  try {
    throw new Error('业务逻辑失败了'); // 主体的错误
  } finally {
    r[Symbol.dispose](); // 清理又抛错 → 把上面的错误"顶掉"了
  }
} catch (err) {
  console.log('\n[以前写法] 最终捕获到的是：', err.message);
  console.log('  ↑ 业务逻辑的错误「业务逻辑失败了」彻底不见了 —— 这正是 SuppressedError 要解决的问题');
}

// ---------------------------------------------------------------------------
console.log('\n--- 2. Symbol.dispose / Symbol.asyncDispose：资源协议 ---');
// ---------------------------------------------------------------------------

// 这两个 Symbol 是"协议"：任何对象只要挂上对应方法，就自动获得被 using 管理的能力。
// 它们是 well-known symbol，用 Symbol.dispose 直接访问（不是 Symbol.for('...')）。

console.log('Symbol.dispose 的描述：', Symbol.dispose.toString());
console.log('Symbol.asyncDispose 的描述：', Symbol.asyncDispose.toString());
console.log('两者是同一个 symbol 吗：', Symbol.dispose === Symbol.asyncDispose, '（不是）');

// 一个同时实现两种协议的资源
const dualResource = {
  syncCount: 0,
  asyncCount: 0,
  [Symbol.dispose]() {
    this.syncCount++;
  },
  async [Symbol.asyncDispose]() {
    this.asyncCount++;
  },
};

// 手写等价实现：手动调用 dispose（这就是 using 在底层做的事）
dualResource[Symbol.dispose]();
console.log('手动调用 dispose 后 syncCount =', dualResource.syncCount);

// ---------------------------------------------------------------------------
console.log('\n--- 3. using 声明 ---');
// ---------------------------------------------------------------------------

if (USING_SUPPORTED) {
  // 3.1 最基本用法：离开块作用域自动释放
  const log1 = [];
  {
    using res = makeResource('自动释放的资源', { log: log1 });
    res.use();
    log1.push('（块内部代码执行完毕）');
    // 块结束 → 自动调用 res[Symbol.dispose]()
  }
  log1.push('（块外代码）');
  console.log('[3.1] 块作用域自动释放：');
  console.log('  ' + log1.join(' → '));

  // 3.2 多个资源：释放顺序是 LIFO（后进先出）
  const log2 = [];
  {
    using a = makeResource('A', { log: log2 });
    using b = makeResource('B', { log: log2 });
    using c = makeResource('C', { log: log2 });
    log2.push('主体逻辑');
  }
  console.log('\n[3.2] 多资源释放顺序（LIFO）：');
  console.log('  ' + log2.join(' → '));
  console.log('  可以看到 C→B→A，与声明顺序相反 —— 这与"先拿锁再开事务，就先提交事务再放锁"一致');

  // 3.3 null / undefined 是合法的
  const log3 = [];
  {
    using nothing = null; // 合法：表示"这次没有资源"
    using alsoNothing = undefined;
    log3.push('using null / undefined 完全合法，不会报错');
  }
  console.log('\n[3.3] null / undefined：');
  console.log('  ' + log3.join(' → '));

  // 3.4 异常安全：主体抛错时，清理**依然**执行，而且原始错误不会被顶掉
  const log4 = [];
  try {
    {
      using res = makeResource('异常场景资源', { log: log4 });
      log4.push('准备抛错');
      throw new Error('主体业务错误');
    }
  } catch (err) {
    log4.push(`捕获到：${err.message}`);
  }
  console.log('\n[3.4] 主体抛错时的清理：');
  console.log('  ' + log4.join(' → '));
  console.log('  ↑ dispose 依然被调用了，异常也正常向外传播');

  // 3.5 作用域是"最近的块"，循环里每轮都会释放
  const log5 = [];
  for (let i = 1; i <= 3; i++) {
    using res = makeResource(`第${i}轮`, { log: log5 });
  }
  console.log('\n[3.5] 写在循环体里，每轮结束都释放：');
  console.log('  ' + log5.join(' → '));

  // 3.6 函数体作用域：提前 return 也会释放
  function earlyReturn() {
    const log = [];
    using res = makeResource('函数内资源', { log });
    log.push('提前 return');
    return log; // ← return 之前会先释放
  }
  console.log('\n[3.6] 提前 return：');
  console.log('  ' + earlyReturn().join(' → '));

  // 3.7 陷阱：初始值必须实现协议
  console.log('\n[3.7] 陷阱演示：');
  try {
    {
      using bad = {}; // 普通对象没有 [Symbol.dispose]
    }
  } catch (err) {
    console.log('  using {} →', err.constructor.name + ':', err.message);
  }
  try {
    {
      using bad = [1, 2, 3]; // 数组也没有
    }
  } catch (err) {
    console.log('  using [1,2,3] →', err.constructor.name + ':', err.message);
  }
  console.log('  → 报错发生在**初始化那一刻**，即使后面根本用不到这个资源');
} else {
  console.log('当前 Node 版本不支持 using 语法，以下是等价实现（try/finally + 手动 dispose）');
  const log1 = [];
  {
    const res = makeResource('手动释放的资源', { log: log1 });
    try {
      res.use();
      log1.push('（块内部代码执行完毕）');
    } finally {
      res[Symbol.dispose](); // 等价于 using 在离开作用域时做的事
    }
  }
  log1.push('（块外代码）');
  console.log('  等价实现：' + log1.join(' → '));
}

// ---------------------------------------------------------------------------
console.log('\n--- 4. await using 声明 + Symbol.asyncDispose ---');
// ---------------------------------------------------------------------------

// 同步 dispose 只能做"立刻完成"的清理。但很多资源天生是异步的：
// 关闭数据库连接、flush 缓冲区、优雅关闭 WebSocket……
// 这些需要 `await using` 配合 `[Symbol.asyncDispose]()`。

const asyncLog = [];
const asyncResource = {
  name: '异步连接',
  async [Symbol.asyncDispose]() {
    await new Promise((r) => setTimeout(r, 5));
    asyncLog.push('异步释放完成');
  },
};

if (AWAIT_USING_SUPPORTED) {
  // 4.1 基本用法
  await (async () => {
    await using conn = asyncResource;
    asyncLog.push('主体逻辑执行');
  })();
  console.log('[4.1] await using：' + asyncLog.join(' → '));

  // 4.2 同时实现两种协议时，await using 优先用 asyncDispose
  const preferLog = [];
  const bothResource = {
    [Symbol.dispose]() {
      preferLog.push('走了同步 dispose');
    },
    async [Symbol.asyncDispose]() {
      preferLog.push('走了异步 asyncDispose');
    },
  };
  await (async () => {
    await using r = bothResource;
  })();
  console.log('[4.2] 两种协议都有时：' + preferLog.join(' → '));
  console.log('  规则：await using 优先用 asyncDispose；只有同步 dispose 时则退回用它');

  // 4.3 只有同步 dispose 的资源，也能用 await using（会退回同步）
  const fallbackLog = [];
  await (async () => {
    await using r = {
      [Symbol.dispose]() {
        fallbackLog.push('asyncDispose 不存在 → 退回到同步 dispose');
      },
    };
  })();
  console.log('[4.3] 退回同步：' + fallbackLog.join(' → '));

  // 4.4 异步清理的异常安全
  const errLog = [];
  try {
    await (async () => {
      await using r = {
        async [Symbol.asyncDispose]() {
          await new Promise((res) => setTimeout(res, 5));
          errLog.push('异步清理仍然执行了');
        },
      };
      throw new Error('异步主体错误');
    })();
  } catch (err) {
    errLog.push(`捕获到：${err.message}`);
  }
  console.log('[4.4] 异步异常安全：' + errLog.join(' → '));
} else {
  console.log('当前 Node 版本不支持 await using 语法，以下是等价实现');
  await (async () => {
    try {
      asyncLog.push('主体逻辑执行');
    } finally {
      await asyncResource[Symbol.asyncDispose](); // 等价于 await using 做的事
    }
  })();
  console.log('  等价实现：' + asyncLog.join(' → '));
}

// ---------------------------------------------------------------------------
console.log('\n--- 5. SuppressedError：清理失败时不丢根因 ---');
// ---------------------------------------------------------------------------

// 场景：主体已经抛错了，清理阶段又抛错。此时必须**同时保留两个错误**，
// 否则排查时只能看到"关闭连接失败"，完全不知道真正的原因是什么。

if (typeof SuppressedError === 'function') {
  const err = new SuppressedError(
    new Error('清理时抛出的错误'), // error  —— 清理阶段的错误
    new Error('主体抛出的原始错误'), // suppressed —— 被"压制"的原始错误
    '释放资源时发生错误', // message
  );
  console.log('[5.1] SuppressedError 的结构：');
  console.log('  constructor.name :', err.constructor.name);
  console.log('  instanceof Error :', err instanceof Error);
  console.log('  message          :', err.message);
  console.log('  .error           :', err.error.message, '（清理阶段抛的）');
  console.log('  .suppressed      :', err.suppressed.message, '（原来的根因，没有被丢掉）');
  console.log('  嵌套可以多层：清理链上每一层都会再包一层 SuppressedError');
}

// 5.2 真实触发：用 using 时会自动产生
if (USING_SUPPORTED) {
  const log = [];
  try {
    {
      using r = makeResource('会在清理时出错的资源', { failOnDispose: true, log });
      log.push('主体逻辑');
      throw new Error('真正的根因：业务逻辑失败');
    }
  } catch (err) {
    log.push(`捕获到 ${err.constructor.name}`);
    if (err instanceof SuppressedError) {
      log.push(`  .error = ${err.error.message}`);
      log.push(`  .suppressed = ${err.suppressed.message}`);
    } else {
      log.push(`  message = ${err.message}`);
    }
  }
  console.log('\n[5.2] using + 清理抛错：');
  console.log('  ' + log.join('\n  '));
  console.log('  ↑ 对比第 1 节 try/finally 里"根因被顶掉"的情况，这里两个错误都在');

  // 5.3 遍历整个 SuppressedError 链（写日志工具时的标准做法）
  console.log('\n[5.3] 完整打出错误链（推荐写进日志工具）：');
  try {
    {
      using r = makeResource('链式错误资源', { failOnDispose: true });
      throw new Error('第一层根因');
    }
  } catch (err) {
    let cur = err;
    let depth = 0;
    while (cur) {
      console.log(`  [${depth}] ${cur.constructor.name}: ${cur.message}`);
      if (cur instanceof SuppressedError) {
        console.log(`       ├─ error      : ${cur.error?.message}`);
        console.log(`       └─ suppressed : ${cur.suppressed?.message}`);
        cur = cur.suppressed; // 沿 suppressed 继续往下找根因
      } else {
        cur = cur.cause; // 也可能是 cause 链
      }
      depth++;
    }
  }
} else {
  console.log('当前 Node 版本不支持 using，以下用 try/finally 复现"根因被覆盖"的问题：');
  try {
    const r = makeResource('会出错连接', { failOnDispose: true });
    try {
      throw new Error('真正的根因：业务逻辑失败');
    } finally {
      r[Symbol.dispose]();
    }
  } catch (err) {
    console.log('  最终只捕获到：', err.message, '← 根因丢失，这就是需要 SuppressedError 的原因');
  }
}

// ---------------------------------------------------------------------------
console.log('\n--- 6. 手写等价实现：try/finally + dispose 调用 ---');
// ---------------------------------------------------------------------------

// 这一段把 using 的语义"手动实现"出来，帮助你彻底看懂它在做什么。
// 三个关键点：① 初始化时立刻取到 dispose 方法；② finally 里调用；
//             ③ 清理抛错时用 SuppressedError 包住两个错误。

function withResource(resource, body) {
  // ① 校验协议（对应 using 初始化时的类型检查）
  const dispose = resource?.[Symbol.dispose];
  if (dispose !== undefined && typeof dispose !== 'function') {
    throw new TypeError('resource[Symbol.dispose] 必须是函数');
  }
  let bodyError;
  try {
    return body(resource);
  } catch (err) {
    bodyError = err;
    throw err;
  } finally {
    if (dispose) {
      try {
        dispose.call(resource);
      } catch (disposeError) {
        // ③ 两边都出错 → 用 SuppressedError 保住根因
        if (bodyError !== undefined) {
          throw new SuppressedError(disposeError, bodyError, '清理资源时发生错误');
        }
        throw disposeError;
      }
    }
  }
}

// 也可以在运行时给内置类型"补"上协议，让老代码也能被统一管理。
// 例如给一个自定义的连接类加上 Symbol.dispose：
class FakeConnection {
  constructor(name) {
    this.name = name;
    this.closed = false;
  }
  query(sql) {
    return `${this.name} 执行了: ${sql}`;
  }
  close() {
    this.closed = true;
  }
  // 关键一步：实现资源协议，从此可以被 using / withResource 统一管理
  [Symbol.dispose]() {
    this.close();
  }
}

const conn = new FakeConnection('db-1');
console.log('[6.1] 给自定义类实现协议后，就变成了"可被 using 管理的资源"：');
console.log('  query →', conn.query('SELECT 1'));
withResource(conn, (c) => {
  console.log('  withResource 内部 query →', c.query('SELECT 2'));
});
console.log('  离开作用域后 conn.closed =', conn.closed);

// 用 withResource 复现"清理抛错 + 主体抛错"的完整语义
console.log('\n[6.2] 手写实现也能正确产出 SuppressedError：');
try {
  withResource(makeResource('手写版资源', { failOnDispose: true }), () => {
    throw new Error('手写版的主体错误');
  });
} catch (err) {
  console.log('  捕获到：', err.constructor.name);
  console.log('    .error      =', err.error?.message);
  console.log('    .suppressed =', err.suppressed?.message);
}

// ---------------------------------------------------------------------------
console.log('\n--- 7. DisposableStack / AsyncDisposableStack（补充）---');
// ---------------------------------------------------------------------------

// 当"要注册多少个资源"需要在运行时动态决定时，声明式的 using 就不够灵活了。
// DisposableStack 提供了命令式 API：
//   stack.use(resource)      —— 注册一个实现了协议的资源
//   stack.adopt(value, fn)   —— 注册一个"值 + 清理函数"
//   stack.defer(fn)          —— 注册一个纯清理函数
//   stack.move()             —— 把当前栈移交给一个新的栈（原栈作废）
//   stack.dispose()          —— 立即释放全部（顺序同样是 LIFO）

if (typeof DisposableStack === 'function') {
  const order = [];
  const stack = new DisposableStack();
  console.log('[7.1] 命令式注册（注册顺序：defer → use → adopt）：');
  stack.defer(() => order.push('defer 注册的清理函数'));
  stack.use({
    [Symbol.dispose]() {
      order.push('use 注册的资源');
    },
  });
  stack.adopt('配置对象', (v) => order.push(`adopt 的清理：${v}`));
  console.log('  dispose 之前 disposed =', stack.disposed);
  stack.dispose(); // 一次性按 LIFO 释放
  console.log('  释放顺序：' + order.join(' → '));
  console.log('  dispose 之后 disposed =', stack.disposed);
  console.log('  重复 dispose 是安全的（幂等）：');
  stack.dispose();
  console.log('    再次调用 dispose() 没有抛错，order 长度仍为', order.length);

  // move()：把栈"移交"出去（常见于"在函数里创建，返回给调用方释放"）
  const order2 = [];
  const src = new DisposableStack();
  src.use({
    [Symbol.dispose]() {
      order2.push('被移交给新栈的资源');
    },
  });
  const moved = src.move();
  console.log('\n[7.2] move()：');
  console.log('  原栈 disposed =', src.disposed, '（移动后原栈立刻作废）');
  console.log('  新栈 disposed =', moved.disposed);
  console.log('  对已作废的栈调用 use() 会报错：');
  try {
    src.use({ [Symbol.dispose]() {} });
  } catch (err) {
    console.log('    →', err.constructor.name + ':', err.message);
  }
  moved.dispose();
  console.log('  新栈释放：' + order2.join(' → '));
}

if (typeof AsyncDisposableStack === 'function') {
  const asyncOrder = [];
  const astack = new AsyncDisposableStack();
  astack.defer(() => asyncOrder.push('同步清理函数'));
  astack.use({
    async [Symbol.asyncDispose]() {
      await new Promise((r) => setTimeout(r, 5));
      asyncOrder.push('异步资源');
    },
  });
  await astack.disposeAsync(); // 注意是 disposeAsync()
  console.log('\n[7.3] AsyncDisposableStack：' + asyncOrder.join(' → '));
}

// ---------------------------------------------------------------------------
console.log('\n--- 8. 实战：把资源管理写成"线性代码" ---');
// ---------------------------------------------------------------------------

// 场景：一个既要用锁、又要开事务、还要写审计日志的操作。
// 用 using 之后，代码是"从上到下一路写下来"的，不需要嵌套。
function transferWithLock(from, to, amount) {
  const trace = [];
  // 模拟三种资源
  const lock = {
    [Symbol.dispose]() {
      trace.push('释放锁');
    },
  };
  const tx = {
    committed: false,
    [Symbol.dispose]() {
      trace.push(this.committed ? '提交事务' : '回滚事务');
    },
  };
  const audit = {
    async [Symbol.asyncDispose]() {
      await new Promise((r) => setTimeout(r, 1));
      trace.push('异步 flush 审计日志');
    },
  };
  return (async () => {
    if (USING_SUPPORTED && AWAIT_USING_SUPPORTED) {
      using l = lock;
      using t = tx;
      await using a = audit;
      await new Promise((r) => setTimeout(r, 1)); // 模拟异步写库
      if (amount <= 0) throw new RangeError('转账金额必须为正');
      t.committed = true;
      return { ok: true, from, to, amount, trace };
    }
    // 等价手写实现
    try {
      await new Promise((r) => setTimeout(r, 1));
      if (amount <= 0) throw new RangeError('转账金额必须为正');
      tx.committed = true;
      return { ok: true, from, to, amount, trace };
    } finally {
      await audit[Symbol.asyncDispose]();
      t[Symbol.dispose]();
      l[Symbol.dispose]();
    }
  })();
}

const okCase = await transferWithLock('账户A', '账户B', 100);
console.log('[8.1] 成功路径：', JSON.stringify(okCase));
const failCase = await transferWithLock('账户A', '账户B', -1).catch((err) => ({ err: err.message }));
console.log('[8.2] 失败路径：', JSON.stringify(failCase));
console.log('  ↑ 同一个函数，成功时提交、失败时回滚、审计日志无论如何都会被 flush');
console.log('  ↑ 而且三个资源的释放顺序是自动正确的（LIFO），不需要人肉维护');

// ---------------------------------------------------------------------------
console.log('\n--- 9. 小结与注意事项 ---');
// ---------------------------------------------------------------------------

console.log('何时用：');
console.log('  · 资源必须"配对获取/释放"（句柄、连接、事务、锁、订阅、定时器）');
console.log('  · 清理逻辑可能在异步之后才完成 → 用 await using + Symbol.asyncDispose');
console.log('  · 资源数量在运行时才知道 → 用 DisposableStack / AsyncDisposableStack');
console.log('\n注意：');
console.log('  · 本机运行结果：using =', USING_SUPPORTED ? '支持' : '不支持',
  '| await using =', AWAIT_USING_SUPPORTED ? '支持' : '不支持',
  '| SuppressedError =', typeof SuppressedError === 'function' ? '支持' : '不支持');
console.log('  · 兼容性：这是很新的语法，打包工具的解析器、旧版运行时可能不认识，');
console.log('    上线前要确认 target 环境；不能用的地方就退回本文件第 6 节的手写实现。');
console.log('  · dispose 应当"尽量不抛错"：真抛错了要意识到原始错误会被包进 SuppressedError，');
console.log('    日志里务必把 .error 和 .suppressed 都打出来。');

console.log('\n' + '='.repeat(70));
console.log('ES2025 显式资源管理全部小节演示完毕，进程正常退出（退出码 0）');
console.log('='.repeat(70));
