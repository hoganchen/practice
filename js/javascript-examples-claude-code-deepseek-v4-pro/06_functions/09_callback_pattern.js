/**
 * ============================================================================
 * 知识点：回调函数模式、同步回调与异步回调、错误优先回调约定
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】进阶
 * 【前置知识】06_functions/08_higher_order_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    回调函数（callback）是"作为参数传给另一个函数、由那个函数在合适的时机
 *    反过来调用"的函数。它是高阶函数最常见的落地形态。
 *    按调用时机分两类：
 *      同步回调 —— 被调用方立刻在当前调用栈里执行它（如 arr.map 的回调）。
 *      异步回调 —— 被调用方先记下它，等某个事件/任务完成后才执行
 *                    （如 setTimeout、fs.readFile、事件监听）。
 *
 * 2. 为什么需要
 *    JS 是单线程的，耗时的 I/O 不能"卡住"主线程，所以只能"先把要做的事
 *    （回调）交给系统，等结果回来再执行"。这就是 Node.js 的核心编程模型：
 *    一切 I/O 都是回调。理解回调是理解 Promise / async-await 的前提——
 *    后两者都只是"更好地组织回调"的工具。
 *
 * 3. 核心语法要点
 *    (1) 同步回调：调用方在函数返回前就执行完回调，代码"看起来"是顺序执行的。
 *    (2) 异步回调：调用方立刻返回，回调稍后执行。所以异步回调里的 return
 *        不会变成外层函数的返回值，try/catch 也包不住它。
 *    (3) 错误优先回调（error-first callback）：Node.js 的约定——
 *        回调的第一个参数是错误对象（成功时为 null），第二个及之后才是数据。
 *          function (err, data) { if (err) { ... } else { ... } }
 *    (4) 回调地狱（callback hell）：多层嵌套导致代码向右缩进成"金字塔"，
 *        可读性和错误处理都很差，这是 Promise 诞生的直接原因。
 *    (5) Promise 化（promisify）：把错误优先回调的函数包成返回 Promise 的函数。
 *
 * 4. 常见陷阱
 *    - 以为异步回调里的 return 能返回到外层函数（其实返回给了调用者，被丢弃）。
 *    - 用 try/catch 包异步回调的调用点，以为能捕获回调内部的错误。
 *    - 回调里忘写 return，导致成功后继续往下执行，触发"回调被调用两次"。
 *    - 同步回调抛错和异步回调抛错的传播路径完全不同。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/09_callback_pattern.js
 *
 * 【预期输出】
 *   按顺序打印同步回调、异步回调的执行时序、错误优先回调的两种分支、
 *   回调地狱演示与 Promise 化改造后的写法。
 * ============================================================================
 */

console.log('--- 1. 同步回调：调用方立刻执行它 ---');

function syncGreet(name, callback) {
  // 注意：callback 在 syncGreet 返回之前就被调用了。
  return callback(name);
}
const syncResult = syncGreet('小明', (name) => `你好，${name}！（这是同步回调的返回值）`);
console.log('  同步回调结果 →', syncResult);
console.log('  时序：回调执行完，syncGreet 才返回。');

// 数组方法是最常见的同步回调。
console.log('  [1,2,3].map(x => x * 2) →', [1, 2, 3].map((x) => x * 2), '（回调立刻被逐个调用）');

console.log('--- 2. 异步回调：调用方先返回，回调稍后执行 ---');

// 打印顺序是理解异步回调的关键。
console.log('  ① 主线程：调用异步函数之前');

function asyncGreet(name, callback) {
  // setTimeout 把 callback 交给定时器，0 毫秒表示"尽快"（放进宏任务队列）。
  setTimeout(() => {
    callback(`你好，${name}！（这是异步回调）`);
  }, 0);
  console.log('  ② 被调用方：我已经返回了，但回调还没执行');
  // 这里如果写 return xxx，返回的不是回调的结果。
  return '我是同步返回的值，跟回调结果无关';
}

const asyncReturn = asyncGreet('小红', (msg) => {
  console.log('  ④ 回调终于执行了 →', msg);
});
console.log('  ③ 主线程：拿到的同步返回值 =', asyncReturn);
console.log('  结论：③ 一定在 ④ 之前打印——异步回调排在当前同步代码之后。');

// 等待一下，让上面的 setTimeout 回调有机会执行完，保证下面小节的输出顺序稳定。
await new Promise((resolve) => setTimeout(resolve, 10));

console.log('--- 3. 异步回调里的 return 和 try/catch 都不管用 ---');

// 【错误示范】想在函数里通过回调拿到结果然后 return —— 拿不到。
function fetchDataWrong(callback) {
  setTimeout(() => callback('真实数据'), 0);
  return '我提前返回了，此时数据还没拿到'; // 这行总是先执行
}

// 【正确思路】所有依赖"结果"的逻辑，都必须写在回调里面。
function fetchDataRight(callback) {
  setTimeout(() => callback(null, '真实数据'), 0);
}

console.log('  错误写法拿到的值 →', fetchDataWrong((d) => d));

// try/catch 也包不住异步回调里抛出的错误。
function throwsAsync(callback) {
  setTimeout(() => {
    callback(); // 这个调用的异常发生在另一个宏任务里
  }, 0);
}

try {
  throwsAsync(() => {
    // 这个 throw 逃出了当前 try/catch 的作用域，会变成未捕获异常。
    // 为了避免进程非零退出，这里在回调内部自己兜住。
    try {
      throw new Error('回调内部出错了');
    } catch (err) {
      console.log('  回调内部自己捕获 →', err.message);
    }
  });
} catch (err) {
  // 永远不会执行到这里。
  console.log('  外层 try/catch 捕获到 →', err.message);
}
await new Promise((resolve) => setTimeout(resolve, 10));
console.log('  结论：异步回调里的错误，外层 try/catch 是拦不住的，必须用错误优先回调或 Promise。');

console.log('--- 4. 错误优先回调（error-first callback）约定 ---');

// Node.js 的标准约定：回调签名为 (err, result)。
// 成功时 err 为 null，失败时 err 是 Error 对象、result 通常为 undefined。
function readConfig(name, callback) {
  // 用 setTimeout 模拟一次异步 I/O（不访问外网、不读写真实文件）。
  setTimeout(() => {
    if (name === 'missing') {
      // 约定一：错误必须是 Error 实例，不要传字符串。
      callback(new Error(`找不到配置：${name}`));
      return; // 约定二：出错后立刻 return，绝不继续执行后面成功分支的逻辑
    }
    // 约定三：成功时第一个参数显式传 null。
    callback(null, { name, value: 42 });
  }, 0);
}

// 成功分支
await new Promise((resolve) => {
  readConfig('app', (err, config) => {
    if (err) {
      console.log('  成功用例里不该有错误：', err.message);
    } else {
      console.log('  成功分支 → err =', err, '，config =', config);
    }
    resolve();
  });
});

// 失败分支
await new Promise((resolve) => {
  readConfig('missing', (err, config) => {
    if (err) {
      console.log('  失败分支 → err.message =', err.message, '，config =', config);
    } else {
      console.log('  不该走到这里');
    }
    resolve();
  });
});

console.log('--- 5. 回调地狱（callback hell）---');

// 三层嵌套就已经开始向右"漂移"了，而且每一层都要重复错误处理。
function stepByStep(callback) {
  setTimeout(() => {
    callback(null, '第一步结果');
  }, 0);
}

console.log('  嵌套写法（只演示两层，真实项目常见五六层）：');
await new Promise((resolve) => {
  stepByStep((err1, r1) => {
    if (err1) {
      console.log('    第 1 步失败');
      return resolve();
    }
    stepByStep((err2, r2) => {
      if (err2) {
        console.log('    第 2 步失败');
        return resolve();
      }
      console.log(`    ${r1} → ${r2}（每一步都要重复 if (err) 判断）`);
      resolve();
    });
  });
});

console.log('--- 6. Promise 化（promisify）：把回调风格包装成 Promise ---');

// 通用 promisify：接收一个"错误优先回调风格"的函数，返回一个返回 Promise 的函数。
function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      // 在最后追加一个符合约定的回调。
      fn.call(this, ...args, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  };
}

const readConfigAsync = promisify(readConfig);

// 用 Promise 写，成功和失败都用 try/catch 统一处理，不用再层层嵌套。
try {
  const cfg = await readConfigAsync('app');
  console.log('  Promise 化后（成功）→', cfg);
} catch (err) {
  console.log('  不应执行');
}

try {
  await readConfigAsync('missing');
} catch (err) {
  console.log('  Promise 化后（失败）→', err.message, '（用 try/catch 统一处理，比 if (err) 清爽）');
}

console.log('--- 7. 同步回调 vs 异步回调：对比小结 ---');

const compare = [
  ['执行时机', '被调用方返回之前', '被调用方返回之后（另一轮事件循环）'],
  ['返回值能否拿到', '能，回调的 return 就是被调用方的 return', '不能，回调的 return 被丢弃'],
  ['能否被外层 try/catch 捕获', '能', '不能，必须靠错误优先回调或 Promise'],
  ['常见例子', 'map / filter / forEach / sort', 'setTimeout / 文件与网络 I/O / 事件监听'],
  ['写代码时要注意', '基本与普通函数无异', '所有后续逻辑必须写在回调内部'],
];
for (const [item, sync, async] of compare) {
  console.log(`  · ${item}`);
  console.log(`      同步回调：${sync}`);
  console.log(`      异步回调：${async}`);
}

console.log('--- 8. 现代替代：Promise 与 async/await ---');
console.log('  回调 → Promise → async/await，是同一个问题的三代解法：');
console.log('    回调      ：最原始、最灵活，但嵌套深、错误处理分散。');
console.log('    Promise   ：可链式 then/catch，错误可以统一捕获，但 .then 链也会变长。');
console.log('    async/await：用同步的写法表达异步，配合 try/catch，是当前的首选。');
console.log('  但底层依然是"回调"：Promise 的 then 注册的还是回调函数，只是被引擎调度得更好了。');
