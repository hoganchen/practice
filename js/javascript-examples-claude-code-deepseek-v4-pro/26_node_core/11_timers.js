/**
 * ============================================================================
 * 知识点：定时器 —— setTimeout / setInterval / setImmediate 与事件循环
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】进阶
 * 【前置知识】26_node_core/01_process_object.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    定时器让你"过一会儿再执行"或"每隔一段时间执行一次"。
 *    JavaScript 语言本身没有定时器——它们是宿主环境提供的：
 *    浏览器里是 window.setTimeout，Node 里来自 node:timers（同时注入为全局函数）。
 *
 *    Node 提供三种调度方式：
 *      · setTimeout(fn, ms)     最少等 ms 毫秒后执行一次
 *      · setInterval(fn, ms)    每隔约 ms 毫秒执行一次，直到被清除
 *      · setImmediate(fn)       在**当前事件循环的这一轮**的"检查阶段"执行
 *    另外 node:timers/promises 提供 Promise 版本，可以直接 await。
 *
 * 2. 为什么需要
 *    JS 是单线程的，所有代码共用一条执行流。定时器是"出让控制权"的基本手段：
 *    把耗时操作拆成小片、错峰执行、给其他任务让路。
 *    它也是实现轮询、心跳、防抖节流、超时控制的基础设施。
 *    更重要的是：**事件循环是理解 Node 性能问题的钥匙**，
 *    而定时器是观察事件循环各阶段顺序最直观的窗口。
 *
 * 3. 核心语法要点
 *    - setTimeout(fn, delay, ...args)   额外的参数会原样传给 fn
 *    - clearTimeout(timer)              取消（对已触发或已取消的定时器再调用是安全的）
 *    - setInterval(fn, ms) / clearInterval(timer)
 *    - setImmediate(fn) / clearImmediate(timer)
 *    - 返回值是 Timeout 对象（不是数字，这点与浏览器不同），可用方法：
 *        timer.unref()     让这个定时器**不**阻止进程退出
 *        timer.ref()       恢复默认行为（阻止进程退出）
 *        timer.hasRef()    查询当前是否在"撑住"事件循环
 *        timer.refresh()   重置计时（重新开始数 ms）
 *    - node:timers/promises：
 *        await setTimeout(ms)           Promise 版延时，可直接 await
 *        setInterval(ms)                返回**异步迭代器**，可 for await
 *        都支持 AbortSignal 取消
 *    - 定时器回调的执行时机是"不早于"指定延时，实际可能晚很多（见陷阱 1）
 *
 * 4. 常见陷阱
 *    陷阱 1：delay 是"最小等待时间"，不是"精确时间"。事件循环被阻塞时，
 *            定时器会被顺延。setTimeout(fn, 0) 也不是立即执行。
 *    陷阱 2：delay 小于 1 会被钳制。写 setTimeout(fn, 0) 实际约等于 1ms；
 *            而要"尽快在本轮之后执行"，setImmediate 才是更贴切的语义。
 *    陷阱 3：setImmediate 与 setTimeout(fn, 0) 谁先执行**取决于所处位置**。
 *            在主模块顶层，通常 setTimeout 先；在 I/O 回调内部，setImmediate 先。
 *            本文件有实测。永远不要依赖这个顺序写业务逻辑。
 *    陷阱 4：定时器不阻止进程的"自然退出"是有条件的。默认定时器会**撑住**事件循环，
 *            所以脚本会等到定时器跑完才退出；用了 unref() 才会被忽略。
 *            反过来，忘了 clearInterval 会让进程永远不退出——这是脚本挂起的常见原因。
 *    陷阱 5：setInterval 不保证间隔精确，也不保证不"追赶"。
 *            回调耗时超过间隔时，回调会排队堆积。需要严格节流请自己在回调末尾
 *            用 setTimeout 续期，而不是用 setInterval。
 *    陷阱 6：闭包里的循环变量。与回调 API 同理，用 let 而不是 var（见 05_fs_callback.js）。
 *    陷阱 7：定时器的延时不受"系统时间"影响，但受"进程被挂起/休眠"影响。
 *            要算真实经过时间请用 Date.now() 差值，不要靠累加 delay。
 *    陷阱 8：在定时器里抛出的异常会成为未捕获异常，直接终止进程。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/11_timers.js
 *
 * 【预期输出】
 *   演示 setTimeout 传参、clearTimeout、setInterval 计数、setImmediate 与
 *   setTimeout(0) 的顺序差异（顶层 vs I/O 回调内）、Timeout 对象的
 *   ref/unref/refresh，以及 node:timers/promises 的 await 写法。
 *   全部定时器都很短（最长 200ms），脚本很快结束且不会挂起。
 * ============================================================================
 */

// 从 node:timers 显式导入，语义比依赖全局函数更清晰。
// 同时也演示"它们是模块，不是语言内置"这一点。
import { setTimeout as setTimeoutTimer, setInterval as setIntervalTimer, setImmediate as setImmediateTimer } from 'node:timers';
// 注意：node:timers 导出的 setTimeout 与全局 setTimeout 功能相同，
// 这里加别名只是为了在阅读代码时能一眼区分两种风格。

// Promise 版定时器，位于单独的 node:timers/promises 子模块。
import { setTimeout as sleep, setInterval as interval, scheduler } from 'node:timers/promises';

// 需要 I/O 回调来演示 setImmediate 的顺序（见第 4 节）。
import fs from 'node:fs';

// ---------------------------------------------------------------------------
// 1. setTimeout 基础：延时、传参、取消
// ---------------------------------------------------------------------------

console.log('--- 1. setTimeout 基础 ---');

const t0 = Date.now();

// setTimeout 的第一个参数是回调，第二个是延时毫秒数，
// 之后的参数会**原样**传给回调——这比用闭包捕获更直观。
const sayHello = setTimeoutTimer(
  (name, age) => {
    // 打印实际经过的时间，用来观察"延时是最小值"这件事。
    console.log(`  你好 ${name}，${age} 岁（实际等待 ${Date.now() - t0}ms）`);
  },
  50,
  '张三',
  30,
);

// 取消定时器：clearTimeout 接受的就是 setTimeout 的返回值。
// 对同一个定时器重复 clear 是安全的，不会报错。
clearTimeout(sayHello);
console.log('  刚创建的定时器已被 clearTimeout 取消，它的回调不会执行。');

// 验证一下：等 60ms 看看有没有那行"你好"输出。
await sleep(60);
console.log('  等了 60ms 之后，上面那个被取消的定时器确实没有输出。');

// 再说一次：延时是"最小值"。下面这会阻塞 80ms，
// 那个"声称 10ms 后执行"的定时器只能等到阻塞结束后才跑。
const t1 = Date.now();
setTimeoutTimer(() => {
  console.log(`  声称 10ms 的定时器实际等了 ${Date.now() - t1}ms（被同步阻塞推迟了）`);
}, 10);

// 同步忙等 80ms，把事件循环占住。
while (Date.now() - t1 < 80) {
  // 空转
}
console.log('  同步阻塞 80ms 结束（此时那个 10ms 的定时器还没机会执行）。');
// 给定时器一点时间跑完，再进入下一节。
await sleep(20);

// ---------------------------------------------------------------------------
// 2. setInterval 与 clearInterval
// ---------------------------------------------------------------------------

console.log('--- 2. setInterval 周期执行 ---');

let tick = 0;
const intervalStart = Date.now();

// setInterval 每隔约 30ms 执行一次，直到被 clearInterval 清掉。
// 关键纪律：**一定要有终止条件**，否则进程永远不退出。
const ticker = setIntervalTimer(() => {
  tick += 1;
  console.log(`  第 ${tick} 次 tick，距开始 ${Date.now() - intervalStart}ms`);

  if (tick === 3) {
    // 计数到 3 就停。真实代码里终止条件可能是"任务完成""超时""收到信号"。
    clearInterval(ticker);
    console.log('  已 clearInterval，周期任务结束。');
  }
}, 30);

// 等它跑完（3 次 × 30ms = 90ms，多给一点余量）。
await sleep(150);

// 演示陷阱 5：setInterval 在回调耗时超过间隔时会堆积。
// 这里不实际制造堆积（那会让输出很乱），只说明正确的替代写法：
//   用"回调末尾再 setTimeout 续期"的方式，天然保证间隔不小于处理时间。
async function safeLoop(times) {
  for (let i = 0; i < times; i += 1) {
    // 先处理，再等 —— 这样每次迭代的总耗时 = 处理时间 + 间隔。
    // 换成 setInterval 的话，处理时间会被压在间隔里，导致堆积或丢帧。
    await sleep(20);
  }
  return times;
}
console.log('  用 await sleep 串起来的"安全循环"执行次数 =', await safeLoop(3));

// ---------------------------------------------------------------------------
// 3. Timeout 对象：unref / ref / refresh
// ---------------------------------------------------------------------------

console.log('--- 3. Timeout 对象的方法 ---');

// Node 的 setTimeout 返回的是一个 Timeout 对象（浏览器返回数字）。
// 它的关键能力是控制"是否撑住事件循环"。
const keepAlive = setTimeoutTimer(() => {
  console.log('  这个定时器正常执行了（它一直是 ref 状态）。');
}, 30);

// hasRef() 为 true 表示"这个定时器会阻止进程退出"。
console.log('  默认状态 hasRef() =', keepAlive.hasRef(), '（true = 会撑住事件循环）');

// unref() 之后，即使它还没触发，进程也可以正常退出。
keepAlive.unref();
console.log('  调用 unref() 后 hasRef() =', keepAlive.hasRef());

// ref() 恢复默认行为。
keepAlive.ref();
console.log('  调用 ref() 后 hasRef() =', keepAlive.hasRef(), '（恢复成会撑住事件循环）');

await sleep(50);

// refresh()：重置计时，相当于"重新开始数延时"。
// 典型用途：心跳超时检测——每收到一次心跳就 refresh，长时间没有心跳才真正超时。
const hbStart = Date.now();
const heartbeat = setTimeoutTimer(() => {
  // 如果中途没 refresh，它应该在 40ms 左右触发；
  // refresh 之后，倒计时从"刷新那一刻"重新开始，因此会晚于 40ms。
  console.log(`  心跳超时触发了，距开始 ${Date.now() - hbStart}ms（原计划 40ms）`);
}, 40);

// 20ms 时假装收到了一次心跳，把计时重置。
// 重置后需要再等完整的 40ms，也就是大约 60ms 处才会触发。
setTimeoutTimer(() => {
  heartbeat.refresh();
  console.log(`  收到心跳，refresh() 重置了倒计时（此时 ${Date.now() - hbStart}ms）`);
}, 20);

// 等到 50ms 时检查一次：还没触发，证明 refresh 确实把时间往后推了。
await sleep(50);
console.log(`  在 ${Date.now() - hbStart}ms 时检查：如果没 refresh 早就该触发了，但现在还没。`);

// 再等到总共约 90ms，此时它已经触发过了。
await sleep(40);
console.log('  心跳演示结束。');
// 对已经触发的定时器再 clearTimeout 也是安全的（幂等）。
clearTimeout(heartbeat);

// ---------------------------------------------------------------------------
// 4. setImmediate 与 setTimeout(0) 的顺序
// ---------------------------------------------------------------------------

console.log('--- 4. setImmediate vs setTimeout(0) ---');

// 先看"主模块顶层"的情况。
// 在 ESM 里，模块体本身是在一个 Promise 任务中求值的，而且本文件此前已经
// 经历过多次 await——所以这里注册回调时所处的"轮次上下文"与 CommonJS 主模块不同，
// 两者的顺序表现可能相反。下面只做记录，不做任何承诺。
const topLevelOrder = [];
setTimeoutTimer(() => {
  topLevelOrder.push('setTimeout(0)');
}, 0);
setImmediateTimer(() => {
  topLevelOrder.push('setImmediate');
});

// 给两个回调足够的时间都跑完（20ms 足够）。
await sleep(20);
console.log('  模块顶层注册时的实际顺序：', topLevelOrder.join(' -> '));
console.log('  => 这个顺序在同一份代码的不同运行中、或在此前 await 次数改变时都可能翻转，');
console.log('     不要去记"谁先谁后"，只要记住"不要依赖它"即可。');

// 再看"I/O 回调内部"的情况，这里的顺序是**确定**的：
// setImmediate 一定先于 setTimeout(0)。
// 原因：事件循环在 poll 阶段处理完 I/O 回调后立刻进入 check 阶段执行 setImmediate，
// 而 setTimeout 属于 timers 阶段，要等下一轮循环才会被处理。
const ioOrder = [];

await new Promise((resolve) => {
  // fs.stat 的回调就是一个 I/O 回调。
  fs.stat('.', () => {
    // 在这个回调内部注册两个定时器。
    setTimeoutTimer(() => {
      ioOrder.push('setTimeout(0)');
    }, 0);
    setImmediateTimer(() => {
      ioOrder.push('setImmediate');
    });

    // 等两个都跑完后再继续。
    setTimeoutTimer(resolve, 20);
  });
});
console.log('  I/O 回调内部注册时的实际顺序：', ioOrder.join(' -> '));
console.log('  => I/O 回调内 setImmediate 一定先执行；顶层则不一定。');
console.log('  => 结论：要"当前这一轮结束后尽快执行"，用 setImmediate 语义最明确；');
console.log('     绝不要依赖这两者的先后关系来写业务逻辑。');

// setImmediate 的典型用途：把一个"很重但可以稍后做"的任务从当前流程里摘出去，
// 让当前响应（比如 HTTP 回包）先发出去。
setImmediateTimer(() => {
  console.log('  setImmediate 执行了：适合把重活挪到当前轮次之后，不阻塞当前响应。');
});
await sleep(20);

// ---------------------------------------------------------------------------
// 5. node:timers/promises —— 可以直接 await 的定时器
// ---------------------------------------------------------------------------

console.log('--- 5. timers/promises ---');

// await sleep(ms) 让"等一会儿"变得像同步代码一样可读。
const p0 = Date.now();
await sleep(40);
console.log(`  await sleep(40) 实际等待 ${Date.now() - p0}ms`);

// 它也能"传递值"：sleep 的第二个参数会成为 resolve 的结果。
// 这在测试、模拟接口返回时很有用。
const payload = await sleep(10, { status: 'ok' });
console.log('  await sleep(10, 值) 拿到的结果 =', JSON.stringify(payload));

// 用 AbortSignal 取消一个延时——这是实现"超时控制"的标准手法。
const controller = new AbortController();
// 20ms 后中止。
setTimeoutTimer(() => controller.abort(), 20);
try {
  // 要求等 200ms，但 20ms 时就被中止了。
  await sleep(200, undefined, { signal: controller.signal });
  console.log('  这行不会执行');
} catch (err) {
  // 被中止时抛出 AbortError。
  console.log('  被 AbortSignal 中止：name =', err.name);
  console.log('  => 这就是 fetch 超时控制的底层套路（见 15_http_server_client.js）。');
}

// setInterval 的 Promise 版返回**异步迭代器**，可以 for await。
// 好处是终止条件写在循环里，非常直观，不会忘记 clearInterval。
let countdown = 3;
console.log('  用 for await 消费异步迭代器版 setInterval：');
for await (const _ of interval(25)) {
  // 每次迭代就是一个周期间隔
  countdown -= 1;
  console.log(`    倒计时 ${countdown}`);
  if (countdown <= 0) {
    // break 会**自动**结束底层定时器，不需要手动 clear。
    // 这是它比回调版 setInterval 更安全的地方。
    break;
  }
}
console.log('  break 之后定时器已被自动清理，不会有残留。');

// scheduler.wait 是 sleep 的别名（更贴近"调度器"语义），
// scheduler.yield 则用于"让出执行权给其他任务"。
await scheduler.wait(10);
console.log('  scheduler.wait(10) 等价于 await sleep(10)。');

// ---------------------------------------------------------------------------
// 6. 演示：unref 的定时器不会撑住进程
// ---------------------------------------------------------------------------

console.log('--- 6. unref 与进程退出 ---');

// 这是本文件的最后一段。下面这个定时器要等 300ms，
// 但被 unref() 了，所以它**不会**阻止进程退出。
// 脚本执行完当前的同步流程后就会自然退出，它的回调永远不会被调用。
const ghost = setTimeoutTimer(() => {
  console.log('  这行不应该出现：unref 的定时器没来得及执行，进程就退出了。');
}, 300);
ghost.unref();
console.log('  已安排一个 300ms 后触发的定时器，但调用了 unref()。');
console.log('  当前 hasRef() =', ghost.hasRef());

// 只等 30ms 就收尾——远小于 300ms，所以上面那个 unref 定时器必然不会执行。
await sleep(30);

console.log('  验证：ghost 定时器的回调没有被执行（因为它没有撑住事件循环）。');
console.log('  => 记住两个方向：');
console.log('     · 默认（ref）定时器会撑住事件循环，脚本会等它跑完才退出');
console.log('     · unref 的定时器不会阻止退出；反过来，忘了 clearInterval 的周期任务');
console.log('       会让脚本永远挂起——这是"脚本跑不完"最常见的原因之一。');

console.log('--- 全部演示结束 ---');
