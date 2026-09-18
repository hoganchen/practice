/**
 * ============================================================================
 * 知识点：异步迭代器 —— Symbol.asyncIterator 与 for await...of
 * ============================================================================
 *
 * 【所属分类】17_iterators_and_generators —— 迭代器与生成器
 * 【难度等级】高级
 * 【前置知识】17_iterators_and_generators/06_generator_delegation.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    异步迭代器协议是同步版本的"异步镜像"：
 *      - 可迭代对象身上的方法名从 Symbol.iterator 变为 Symbol.asyncIterator；
 *      - 迭代器的 next() 返回的不再是 { value, done }，而是
 *        "Promise<{ value, done }>"；
 *      - 消费它的语法是 for await (const x of iterable)。
 *
 * 2. 为什么需要
 *    异步数据源（分页接口、文件流、WebSocket 消息）的特点是"下一个值要等"。
 *    如果用同步迭代器，next() 只能返回一个待处理的 Promise 对象本身，
 *    调用方还得自己 await——for await...of 把这个过程内置了：
 *    每轮循环自动 await next() 的结果，代码看起来和同步遍历一样。
 *
 * 3. 核心语法要点
 *    - async function* 声明的异步生成器：既能 yield 值，又能在内部 await。
 *      它返回的对象同时满足"异步迭代器"与"异步可迭代"两个协议。
 *    - for await...of 也能消费普通的同步可迭代对象：
 *      每个同步值会被当成已解决的 Promise 处理。
 *    - 循环体内可以写 await；循环会严格按顺序一个一个来（前一个处理完
 *      才会去要下一个），天然是串行的。
 *    - 提前 break 时，引擎会自动调用异步迭代器的 return()（返回 Promise），
 *      所以异步生成器里的 finally 一样能执行。
 *    - 异步生成器内部抛错会让 for await...of 的 Promise 拒绝，
 *      用 try/catch 包住循环即可捕获。
 *
 * 4. 常见陷阱
 *    - 用 for await 遍历普通数组时忘记"它其实还是串行的"，误以为能并发。
 *    - 把异步迭代器当成普通 Promise 数组：它不能被 Promise.all 消费。
 *    - async function* 里 yield 一个 Promise 时，for await...of 会
 *      自动 await 它——所以产出的是解决后的值，而不是 Promise 对象。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 17_iterators_and_generators/09_async_iterator.js
 *
 * 【预期输出】
 *   演示异步生成器的逐步产出、手动 next() 拿到的 Promise、for await 的顺序、
 *   break 触发的清理，以及错误捕获。所有延时都在 40ms 以内。
 * ============================================================================
 */

// 统一的延时工具：不使用网络，全部用 setTimeout 自行构造异步
const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

// ---------------------------------------------------------------------------
// 1. 第一个异步生成器
// ---------------------------------------------------------------------------

console.log('--- 1. async function* 基础 ---');

// 注意 function 后面紧跟星号，前面有 async
async function* asyncCounter(max) {
  for (let i = 1; i <= max; i++) {
    // 异步生成器内部允许 await：先"等"一个异步操作，再把结果 yield 出去
    const v = await delay(10, i * 100);
    console.log(`  [异步生成器] 第 ${i} 次产出：${v}`);
    yield v;
  }
  return '全部产出完毕'; // 收尾返回值，for await 看不到，手工 next 才看得到
}

// ---------------------------------------------------------------------------
// 2. 手动观察：next() 返回的是 Promise
// ---------------------------------------------------------------------------

console.log('\n--- 2. 手动 next()：返回的是 Promise<{value, done}> ---');

const itAsync = asyncCounter(3);

// 异步迭代器的 next() 立即返回一个 Promise，所以下面的 instanceof 为 true
const firstCall = itAsync.next();
console.log('next() 返回的是 Promise 吗：', firstCall instanceof Promise);

// await 之后才拿到 { value, done }
const firstStep = await firstCall;
console.log('await 之后拿到：', firstStep);

// 继续把剩下的走完（顶层 await 在 ESM 模块里可以直接用）
console.log('第二次：', await itAsync.next());
console.log('第三次：', await itAsync.next());
console.log('第四次（收尾）：', await itAsync.next());

// ---------------------------------------------------------------------------
// 3. for await...of 消费异步生成器
// ---------------------------------------------------------------------------

console.log('\n--- 3. for await...of：像同步遍历一样写异步代码 ---');

// 关键理解：循环体会"等"上一个值处理完才去要下一个值，
// 所以这里的输出顺序严格是 100 -> 200 -> 300，不会乱序。
console.log('开始遍历：');
for await (const v of asyncCounter(3)) {
  console.log(`  循环体收到：${v}`);
}
console.log('遍历结束（说明所有 await 都已完成）');

// 顺便验证：异步生成器对象也是"异步可迭代对象"
const ag = asyncCounter(1);
console.log('有 Symbol.asyncIterator 吗：', typeof ag[Symbol.asyncIterator] === 'function');
console.log('Symbol.asyncIterator() 返回自身吗：', ag[Symbol.asyncIterator]() === ag);

// ---------------------------------------------------------------------------
// 4. for await 也能吃同步可迭代对象
// ---------------------------------------------------------------------------

console.log('\n--- 4. for await...of 同样适用于同步可迭代对象 ---');

// 规范规定：for await 遇到只有 Symbol.iterator 的对象时，
// 会把每个同步值包装成 Promise.resolve(值) 再交给循环体，
// 所以下面两种写法的输出完全一样。
for await (const x of ['a', 'b', 'c']) {
  console.log('  同步数组被 for await 消费：', x);
}

for await (const x of new Set([1, 2])) {
  console.log('  同步 Set 被 for await 消费：', x);
}

// 混合场景：数组里装着 Promise，for await 会自动 await 每一个
const promiseArray = [delay(5, '结果-A'), delay(5, '结果-B')];
for await (const x of promiseArray) {
  console.log('  数组里的 Promise 被自动等待：', x);
}

// ---------------------------------------------------------------------------
// 5. 自定义异步可迭代对象
// ---------------------------------------------------------------------------

console.log('\n--- 5. 自定义异步可迭代对象：模拟分页接口 ---');

// 用 setTimeout 模拟"每次请求要花 10ms"的分页 API
function fakeFetchPage(page, pageSize) {
  return delay(10, {
    page,
    items: Array.from({ length: pageSize }, (_, i) => `第${page}页-第${i + 1}条`),
    hasNext: page < 3, // 只有 3 页
  });
}

const paginatedApi = {
  // 方法名必须是 Symbol.asyncIterator
  [Symbol.asyncIterator]() {
    let page = 1;
    let buffer = []; // 当前页还没发完的条目
    let done = false;

    return {
      // 异步迭代器的 next() 必须返回 Promise
      async next() {
        if (buffer.length === 0) {
          if (done) {
            return { value: undefined, done: true };
          }
          // 缓冲空了就去请求下一页（这一步是异步的）
          const res = await fakeFetchPage(page, 3);
          console.log(`  [API] 第 ${res.page} 页返回了 ${res.items.length} 条`);
          buffer = res.items;
          done = !res.hasNext;
          page++;
        }
        // 从缓冲里吐出一条
        return { value: buffer.shift(), done: false };
      },
      // 可选的 return()：外部提前 break 时会被调用，用来释放资源
      async return() {
        console.log('  [API] 客户端提前退出，释放连接');
        return { value: undefined, done: true };
      },
    };
  },
};

// 消费方式依然是平平无奇的 for await
console.log('遍历全部分页：');
for await (const item of paginatedApi) {
  console.log('  拿到数据：', item);
}

// 提前退出：只取前 4 条就 break
console.log('只取前 4 条就退出：');
let count = 0;
for await (const item of paginatedApi) {
  console.log('  拿到数据：', item);
  if (++count === 4) break; // break 会让引擎自动调用上面定义的 return()
}

// ---------------------------------------------------------------------------
// 6. 错误处理：异步生成器内部抛错
// ---------------------------------------------------------------------------

console.log('\n--- 6. 异步生成器中的错误处理 ---');

async function* flakySource() {
  yield '正常值-1';
  await delay(5, null);
  // 内部抛出的错误会变成一个"被拒绝的 Promise"，从 next()/for await 冒出来
  throw new Error('数据源出问题了');
  // eslint-disable-next-line no-unreachable
  yield '永远到不了这里';
}

// 必须用 try/catch 包住 for await，否则会变成未捕获的拒绝
try {
  for await (const v of flakySource()) {
    console.log('  收到：', v);
  }
} catch (err) {
  console.log('  捕获到异步迭代错误：', err.message);
}

// 也可以用 finally 保证清理逻辑一定执行
try {
  for await (const v of asyncCounter(1)) {
    console.log('  收到：', v);
    throw new Error('循环体自己抛错也会触发异步迭代器的 return()');
  }
} catch (err) {
  console.log('  捕获到循环体内的错误：', err.message);
} finally {
  console.log('  finally 保证执行');
}

console.log('\n示例结束。');
