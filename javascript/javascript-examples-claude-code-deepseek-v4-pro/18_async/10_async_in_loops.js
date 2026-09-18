/**
 * ============================================================================
 * 知识点：循环里的异步 —— for...of + await、forEach 陷阱、for await...of
 * ============================================================================
 *
 * 【所属分类】18_async —— 异步编程
 * 【难度等级】进阶
 * 【前置知识】18_async/09_async_sequential_vs_parallel.js、17_iterators_and_generators/09_async_iterator.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    在循环里处理异步是日常需求（批量请求、逐条上传）。但不同循环写法
 *    行为差别巨大：
 *      - for / for...of + await  ：真正的串行，一轮等一轮，顺序可控；
 *      - arr.forEach(async ...)  ：**不会等待**，循环立刻结束，回调各跑各的；
 *      - arr.map(async ...)      ：立即得到一堆 Promise，配 Promise.all 可并行；
 *      - for await...of          ：消费异步迭代器（或同步可迭代对象）。
 *
 * 2. 为什么需要
 *    最常见的生产事故就是"以为 forEach 会等，结果数据还没上传完就提示成功"。
 *    理解"谁在等谁"，才能选对写法：要顺序用 for...of，要并发用 map+all，
 *    要限流用 15 篇的分批/信号量方案。
 *
 * 3. 核心语法要点
 *    - for...of 是语言级循环，await 会真正暂停循环体，进而暂停整个循环。
 *    - forEach 是数组方法，它只是"对每个元素调用一次回调"，
 *      回调返回的 Promise 被直接丢弃，forEach 本身永远返回 undefined。
 *    - map 不丢弃返回值，所以能得到 Promise 数组，交给 Promise.all。
 *    - for await...of 可以消费异步迭代器；对同步可迭代对象也适用。
 *    - 在 for...of 里 await 是"串行"，总耗时 = 各任务之和。
 *
 * 4. 常见陷阱
 *    - arr.forEach(async ...) 后面直接写"全部完成"的逻辑。
 *    - 在 forEach 里 await 却期望顺序执行（回调之间其实是并发的）。
 *    - 用 map+all 做"有依赖关系"的任务：它们会一起发出去，顺序不保证。
 *    - 用 for...of 遍历大数组做网络请求：串行慢，且不易控制并发。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 18_async/10_async_in_loops.js
 *
 * 【预期输出】
 *   对比四种循环写法的执行顺序与耗时，并明确标出打印先后。延时 ≤ 60ms。
 * ============================================================================
 */

const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

// 模拟一次 20ms 的异步操作
const process1 = (item) => delay(20, `已处理:${item}`);

// ---------------------------------------------------------------------------
// 1. for...of + await：真正的串行
// ---------------------------------------------------------------------------

console.log('--- 1. for...of + await（串行，逐个等待） ---');

let t0 = Date.now();
const serialResults = [];

for (const item of ['A', 'B', 'C']) {
  console.log(`  开始处理 ${item}（耗时 ${Date.now() - t0}ms）`);
  // await 会暂停整个循环体，所以下一轮一定在这一轮完成后才开始
  const r = await process1(item);
  serialResults.push(r);
  console.log(`  完成 ${item}（耗时 ${Date.now() - t0}ms）`);
}
// 实际耗时略大于 3 × 20ms，因为每一次 await 恢复都要等一次事件循环调度
console.log('  串行结果：', serialResults, `总耗时约 ${Date.now() - t0}ms（理论上 ≈ ${20 * 3}ms）`);

// ---------------------------------------------------------------------------
// 2. forEach + async：经典陷阱
// ---------------------------------------------------------------------------

console.log('\n--- 2. 陷阱：forEach 里的 async 回调不会被等待 ---');

t0 = Date.now();
const forEachResults = [];

['A', 'B', 'C'].forEach(async (item) => {
  // forEach 只是"调用"这个回调，它拿到的是一个 Promise 并**直接丢掉**，
  // 所以 forEach 不会等回调里的 await。
  const r = await process1(item);
  forEachResults.push(r);
  console.log(`  forEach 回调内部完成 ${item}（耗时 ${Date.now() - t0}ms）`);
});

// 这一行会先于上面所有回调打印——因为它属于同步代码，
// 而回调里的 await 还在等 20ms 的定时器。
console.log(`  forEach 之后的同步代码（耗时 ${Date.now() - t0}ms，一定先打印！）`);

// 等一会儿再检查结果，证明"循环早就结束了，回调却还在跑"
await delay(70, null);
console.log('  等 70ms 后再看 forEachResults：', forEachResults);
console.log('  注意：forEach 之后那行代码在 0ms 左右就执行完了，');
console.log('  可那时三个回调一个都没完成——这就是"以为等了其实没等"的 bug 来源');

// 明确对比：打印顺序是
//   ① "forEach 之后的同步代码"（同步，立刻）
//   ② 三个 "forEach 回调内部完成"（20ms 后，彼此并发）

// ---------------------------------------------------------------------------
// 3. map + Promise.all：需要并发时用这个
// ---------------------------------------------------------------------------

console.log('\n--- 3. map + Promise.all（并发，一起等） ---');

t0 = Date.now();

// map 会保留回调的返回值，所以这里得到的是 [Promise, Promise, Promise]。
// 注意：三行 map 执行完的那一刻，三个 20ms 定时器就已经同时在跑了。
const promises = ['A', 'B', 'C'].map((item) => process1(item));
console.log('  map 立刻返回：', promises.map((p) => p.constructor.name));

// 再统一等。总耗时 ≈ 20ms，而不是 60ms。
const parallelResults = await Promise.all(promises);
console.log('  并发结果：', parallelResults, `总耗时约 ${Date.now() - t0}ms（≈ 单次 20ms）`);

// 如果要拿到"元素和结果的对应关系"，可以让 map 回调返回一个对象：
const withIndex = await Promise.all(
  ['A', 'B', 'C'].map(async (item, index) => ({ index, result: await process1(item) })),
);
console.log('  保留顺序与下标：', withIndex);

// ---------------------------------------------------------------------------
// 4. 传统 for 循环 + await：需要下标或提前退出时用
// ---------------------------------------------------------------------------

console.log('\n--- 4. for (let i...) + await（可以 break） ---');

t0 = Date.now();
for (let i = 0; i < 5; i++) {
  const r = await process1(`第${i}项`);
  console.log(`  ${r}（耗时 ${Date.now() - t0}ms）`);
  if (i === 1) {
    // for...of 和传统 for 都支持 break/continue，
    // 而 forEach/map 中途无法退出（除非用异常，不推荐）。
    console.log('  找到需要的数据，提前 break 退出循环');
    break;
  }
}

// ---------------------------------------------------------------------------
// 5. for await...of：消费异步迭代器
// ---------------------------------------------------------------------------

console.log('\n--- 5. for await...of（异步迭代器） ---');

// 异步生成器：每产出一个值都要等一次异步操作
async function* asyncSource() {
  for (const item of ['X', 'Y', 'Z']) {
    yield await delay(10, `异步来源:${item}`);
  }
}

t0 = Date.now();
for await (const value of asyncSource()) {
  // 每轮都会等上一个 yield 的异步操作完成
  console.log(`  收到 ${value}（耗时 ${Date.now() - t0}ms）`);
}
console.log('  for await 天然是串行的：它一次只向迭代器要一个值');

// for await 也能吃同步数组（每个值被当成已兑现的 Promise）
console.log('  for await 遍历同步数组：');
for await (const x of ['普通值-1', '普通值-2']) {
  console.log(`    ${x}`);
}

// ---------------------------------------------------------------------------
// 6. 四种写法对照表
// ---------------------------------------------------------------------------

console.log('\n--- 6. 该用哪种写法 ---');

const table = [
  ['for...of + await', '串行', '需要严格按顺序、逐个处理'],
  ['传统 for + await', '串行', '需要下标、或中途 break'],
  ['forEach + async', '不等待（陷阱）', '不要这样写'],
  ['map + Promise.all', '并发', '互相独立、可同时发起'],
  ['for await...of', '串行（异步源）', '消费异步迭代器 / 流式数据'],
];

for (const [form, mode, usage] of table) {
  console.log(`  ${form.padEnd(20)} ${mode.padEnd(14)} ${usage}`);
}

console.log('\n示例结束。');
