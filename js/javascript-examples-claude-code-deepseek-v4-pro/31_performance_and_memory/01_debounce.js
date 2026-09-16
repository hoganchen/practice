/**
 * ============================================================================
 * 知识点：防抖 debounce —— 闭包保存 timer、leading 立即执行、cancel 取消与 maxWait
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】进阶
 * 【前置知识】无
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    防抖（debounce）是一种"延迟执行"的调用控制策略：把函数包一层，事件每触发
 *    一次就把计时器清零重新计时，只有当事件"停下来"超过设定的等待时间（wait），
 *    真正要执行的函数才会被调用一次。
 *    一句话：防抖 = "等你停下来我再做"，连续触发 N 次，通常只执行 1 次。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 搜索框输入联想：用户每敲一个字符都会触发 input 事件，打字 "javascript"
 *      会触发 10 次请求。防抖后只在用户停止输入 300ms 后发 1 次请求，
 *      既省流量又避免"旧请求后返回覆盖新结果"的竞态问题。
 *    - 窗口 resize：拖动窗口边缘会每秒触发几十次 resize，如果每次都重新计算
 *      布局就会掉帧。防抖后只在用户松手后计算一次。
 *    - 表单校验：输入过程中不必每敲一个字就校验一次，停顿后再校验体验更好。
 *    - 按钮防连点（配合 leading）、编辑器自动保存、埋点上报合并。
 *
 * 3. 核心语法要点
 *    - 计时器句柄必须存在"闭包变量"里：外层函数执行一次就返回内层函数，内层
 *      函数能一直访问外层的 timer 变量，从而实现"跨调用共享状态"。
 *    - 每次触发先 clearTimeout(timer) 再 setTimeout，这就是"重置计时"。
 *    - leading 选项：第一次触发时立即执行一次，而不是等到停下来才执行。
 *    - trailing 选项：停止后是否补执行最后一次（默认 true）。
 *    - cancel()：把挂起的任务取消掉（组件卸载、路由离开时必做）。
 *    - flush()：不等了，立刻把挂起的任务执行掉，并拿到返回值。
 *    - this 与参数透传：内层函数用 ...args 收集参数、用 function 而不是箭头
 *      函数保存调用方的 this，最后用 fn.apply(thisArg, args) 还原。
 *
 * 4. 常见陷阱
 *    - 陷阱一：把 debounce 写成箭头函数返回箭头函数，this 会丢，因为箭头函数
 *      没有自己的 this，无法保存调用现场。
 *    - 陷阱二：返回值拿不到。防抖本质是异步的，直接调用返回 undefined，必须用
 *      flush() 或改用 Promise 包装才能拿到结果。
 *    - 陷阱三：防抖带来"输入延迟"体验问题——wait 设得越大越省请求，但用户
 *      感知到的响应就越慢。搜索场景通常 200~300ms，超过 500ms 就会觉得卡。
 *    - 陷阱四：持续不断的输入会让防抖永远不执行（比如用户一直在打字，或聊天室
 *      一直有新消息）。这时需要 maxWait（最长等待时间）：从第一次触发算起，
 *      超过 maxWait 就强制执行一次，保证"再频繁也至少有输出"。
 *    - 陷阱五：组件卸载后没有 cancel，定时器到期仍会执行，可能导致对已销毁
 *      对象操作（前端里常见的 "setState on unmounted component" 报警）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/01_debounce.js
 *
 * 【预期输出】
 *   打印 7 个小节：手写防抖实现、连续触发只执行最后一次的真实定时器验证、
 *   leading 立即执行、cancel 取消、this 与返回值处理、maxWait 概念演示，
 *   以及防抖与节流的适用场景对照表。
 * ============================================================================
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 记录脚本总耗时，用于确认示例足够轻量（应远小于 1 秒）
const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 1. 手写一个生产可用的 debounce
// ---------------------------------------------------------------------------

console.log('--- 1. 手写 debounce 实现 ---');

/**
 * 防抖函数工厂
 *
 * @param {Function} fn       真正要执行的函数
 * @param {number}   wait     等待时间（毫秒）：停止触发多久后才执行
 * @param {object}   [options]
 * @param {boolean}  [options.leading=false]  第一次触发时是否立即执行
 * @param {boolean}  [options.trailing=true]  停止触发后是否补执行最后一次
 * @returns {Function} 包装后的防抖函数，附带 cancel() 与 flush()
 */
function debounce(fn, wait, options = {}) {
  // 用解构 + 默认值读取配置，调用方不传就落到默认行为
  const { leading = false, trailing = true } = options;

  // 这几个变量定义在"外层函数"里，被内层函数 debounced 引用，
  // 于是它们构成了闭包：debounced 每被调用一次，访问的都是同一份 timer。
  // 这正是防抖能"跨多次调用记住上一次计时器"的原因。
  let timer = null; // setTimeout 返回的计时器句柄；null 表示当前没有挂起的任务
  let lastArgs = null; // 最后一次调用时传进来的参数（用数组保存）
  let lastThis = null; // 最后一次调用时的 this
  let result; // 最近一次 fn 执行后的返回值

  // 内部的小工具：真正去调用 fn，并把"这一次的现场"取出来用掉
  function invoke() {
    const args = lastArgs;
    const ctx = lastThis;
    // 关键：先清空现场再调用，避免同一个现场被执行两次
    lastArgs = null;
    lastThis = null;
    // apply 的第一个参数是 this，第二个参数是参数数组
    // —— 这一步同时解决了"this 丢失"和"参数透传"两个问题
    result = fn.apply(ctx, args);
    return result;
  }

  function debounced(...args) {
    // 记录本次调用的现场（参数与 this），供将来的 invoke 使用
    lastArgs = args;
    lastThis = this;

    // 本轮触发之前是否已经有一个挂起的计时器？
    // 这个判断必须在 clearTimeout 之前做，否则永远都是"没有挂起"。
    const isFirstCallOfRound = timer === null;

    if (timer !== null) {
      // 有挂起任务 → 取消它 → 相当于把计时器"归零重新计时"
      clearTimeout(timer);
      timer = null;
    }

    if (leading && isFirstCallOfRound) {
      // leading 模式：本轮第一次触发立刻执行。
      // invoke() 会把 lastArgs 清空，所以如果后面没有新的触发，
      // trailing 就不会重复执行。
      invoke();
    }

    // 重新挂一个计时器：wait 毫秒内没有新触发，它就会到期
    timer = setTimeout(() => {
      timer = null; // 任务已经到期，清掉句柄
      // trailing 为 true 且确实有未执行的现场时才补执行
      if (trailing && lastArgs) invoke();
    }, wait);
  }

  // 取消：把挂起的任务扔掉。组件卸载时调用可以避免"定时器泄漏 + 操作已销毁对象"。
  debounced.cancel = function cancel() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    // 连现场一起清掉，下次调用就是全新的开始
    lastArgs = null;
    lastThis = null;
  };

  // 立即执行：不等 wait 了，把挂起的任务现在就跑掉，并返回它的结果。
  debounced.flush = function flush() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    // 有现场就执行；没有现场说明已经执行过，直接返回上一次的结果
    if (lastArgs) return invoke();
    return result;
  };

  return debounced;
}

// 造一个"可观察"的模拟函数：它记录自己被调用了几次、每次的参数是什么
function createCounter(label) {
  const state = {
    label,
    count: 0, // 真正执行的次数
    argsList: [], // 每次真正执行时收到的参数
  };
  state.fn = function (...args) {
    state.count += 1;
    state.argsList.push(args);
    // 返回一个字符串，用来演示 flush() 能拿到返回值
    return `${label} 第 ${state.count} 次执行`;
  };
  return state;
}

console.log('debounce 已定义，它返回的函数带有 cancel 与 flush 两个方法。');

// ---------------------------------------------------------------------------
// 2. 真实定时器验证：连续触发只执行最后一次
// ---------------------------------------------------------------------------

console.log('\n--- 2. 连续触发 5 次，只执行最后 1 次 ---');

const search = createCounter('搜索请求');
const debouncedSearch = debounce(search.fn, 40); // wait 取 40ms，让示例跑得快

console.log('mock 函数连续触发 5 次，每次间隔 8ms，等待时间 wait = 40ms');
for (let i = 1; i <= 5; i++) {
  debouncedSearch(`关键词-${i}`);
  // 每次触发后立刻检查：此时应该一次都还没执行，因为计时器一直被重置
  console.log(`  第 ${i} 次触发后（同步检查）真实执行次数 = ${search.count}`);
  await sleep(8);
}

console.log(`连续触发刚结束时，真实执行次数 = ${search.count}（因为一直在重置计时器）`);

// 停下来等足够久，让最后一次的计时器到期
await sleep(60);

console.log(`停止触发并等待 60ms 后，真实执行次数 = ${search.count}`);
console.log('真正被执行的参数 =', JSON.stringify(search.argsList));
console.log('结论：5 次触发只发起了 1 次请求，且用的是最后一次的参数。');

// ---------------------------------------------------------------------------
// 3. leading 选项：第一次触发立刻执行
// ---------------------------------------------------------------------------

console.log('\n--- 3. leading 立即执行选项 ---');

// 3.1 默认（leading = false）：第一次触发不执行，要等停下来才执行
const noLeading = createCounter('默认模式');
const debouncedNoLeading = debounce(noLeading.fn, 40);
debouncedNoLeading('a');
console.log(`leading=false 时，调用后同步检查执行次数 = ${noLeading.count}（还没执行）`);
await sleep(60);
console.log(`等待 60ms 后执行次数 = ${noLeading.count}`);

// 3.2 leading = true：第一次触发立刻执行
const withLeading = createCounter('leading 模式');
const debouncedLeading = debounce(withLeading.fn, 40, { leading: true, trailing: true });

debouncedLeading('第一次');
console.log(`leading=true 时，调用后同步检查执行次数 = ${withLeading.count}（已立即执行）`);

debouncedLeading('第二次');
debouncedLeading('第三次');
console.log(`后续又触发 2 次，执行次数仍为 = ${withLeading.count}（窗口内不重复执行）`);

await sleep(60);
console.log(`窗口结束后执行次数 = ${withLeading.count}（trailing 把最后几次补执行了 1 次）`);
console.log('执行参数序列 =', JSON.stringify(withLeading.argsList));

// ---------------------------------------------------------------------------
// 4. cancel：取消挂起的任务
// ---------------------------------------------------------------------------

console.log('\n--- 4. cancel 取消挂起的任务 ---');

const cancellable = createCounter('可取消任务');
const debouncedCancellable = debounce(cancellable.fn, 40);

debouncedCancellable('参数1');
debouncedCancellable('参数2');
console.log(`触发 2 次后，任务处于挂起状态，执行次数 = ${cancellable.count}`);

debouncedCancellable.cancel(); // 模拟"组件卸载"
await sleep(60);

console.log(`cancel() 之后等待 60ms，执行次数 = ${cancellable.count}（永远等不到了）`);
console.log('真实场景：Vue/React 组件卸载、路由离开时必须 cancel，否则定时器泄漏。');

// ---------------------------------------------------------------------------
// 5. this 绑定 与 返回值处理
// ---------------------------------------------------------------------------

console.log('\n--- 5. this 绑定与返回值 ---');

const searchBox = {
  name: '搜索框组件',
  history: [],
  query(keyword) {
    // 这里的 this 必须指向 searchBox，否则会抛 TypeError
    this.history.push(keyword);
    return `${this.name} 已记录「${keyword}」`;
  },
};

// 把方法包成防抖版本：注意 debounce 内部用 function 保存 this，
// 而调用时是 searchBox.queryDebounced(...)，this 自然指向 searchBox
searchBox.queryDebounced = debounce(searchBox.query, 40);

const directReturn = searchBox.queryDebounced('vue');
console.log(`直接调用拿到的返回值 = ${directReturn}（防抖是异步的，这里必然是 undefined）`);

// 想同步拿到结果就用 flush()：立刻执行并返回 fn 的返回值
const flushReturn = searchBox.queryDebounced.flush();
console.log(`flush() 强制立即执行，返回值 = ${flushReturn}`);
console.log('this 是否绑定正确（history 被写入了） =', JSON.stringify(searchBox.history));

// ---------------------------------------------------------------------------
// 6. 陷阱：防抖导致的"输入延迟"与 maxWait 概念
// ---------------------------------------------------------------------------

console.log('\n--- 6. 输入延迟陷阱与 maxWait ---');

/**
 * 带 maxWait 的防抖：从"本轮第一次触发"起算，最多等 maxWait 毫秒就必须执行一次。
 * 这样即使事件源源不断，也不会出现"永远不执行"的情况。
 */
function debounceWithMaxWait(fn, wait, maxWait) {
  let timer = null;
  let roundStartAt = 0; // 本轮第一次触发的时间戳，0 表示当前没有进行中的轮次
  let lastArgs = null;
  let lastThis = null;

  function invoke() {
    const args = lastArgs;
    const ctx = lastThis;
    lastArgs = null;
    lastThis = null;
    fn.apply(ctx, args);
  }

  return function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    const now = Date.now();
    if (roundStartAt === 0) roundStartAt = now; // 新一轮开始

    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }

    const elapsed = now - roundStartAt; // 本轮已经等了多久
    if (elapsed >= maxWait) {
      // 已达到最长等待时间：不再等，立刻执行，并结束本轮
      invoke();
      roundStartAt = 0;
      return;
    }

    // 下一次到期的时机 = min(常规 wait, 距离 maxWait 还差多久)
    const nextDelay = Math.min(wait, maxWait - elapsed);
    timer = setTimeout(() => {
      timer = null;
      roundStartAt = 0; // 本轮结束，下一次触发重新起算
      if (lastArgs) invoke();
    }, nextDelay);
  };
}

const plain = createCounter('普通防抖');
const capped = createCounter('带 maxWait');
const plainDebounced = debounce(plain.fn, 60);
const cappedDebounced = debounceWithMaxWait(capped.fn, 60, 80);

// 模拟"用户一直不停地在输入"：连续触发 8 次，每次间隔 20ms（共 160ms）
console.log('模拟持续输入：每 20ms 触发一次，连续 6 次（wait=60ms，maxWait=80ms）');
for (let i = 1; i <= 6; i++) {
  plainDebounced(`输入-${i}`);
  cappedDebounced(`输入-${i}`);
  await sleep(20);
}

console.log(`持续输入期间 → 普通防抖执行 ${plain.count} 次，带 maxWait 执行 ${capped.count} 次`);
await sleep(70);
console.log(`输入停止并等待 70ms → 普通防抖执行 ${plain.count} 次，带 maxWait 执行 ${capped.count} 次`);
console.log('结论：持续输入时普通防抖一次都不执行（体验上像卡死），');
console.log('      而 maxWait 保证了"再频繁也至少每隔 maxWait 输出一次"。');

// ---------------------------------------------------------------------------
// 7. 防抖 vs 节流：适用场景对照
// ---------------------------------------------------------------------------

console.log('\n--- 7. 防抖与节流的适用场景差异 ---');

const comparison = [
  ['执行时机', '停下 wait 毫秒后执行一次', '每 wait 毫秒最多执行一次'],
  ['连续触发 10 次', '通常只执行 1 次（最后一次）', '大约执行总时长 / wait 次'],
  ['搜索框输入联想', '✔ 首选：只要最终结果', '✘ 中间态请求没有意义'],
  ['窗口 resize 重算布局', '✔ 首选：只关心最终尺寸', '△ 需要实时跟随时也可用'],
  ['滚动加载更多 / 滚动进度条', '✘ 停下来了才触发，太晚', '✔ 首选：固定频率采样'],
  ['鼠标移动轨迹 / 拖拽', '✘ 会丢中间轨迹', '✔ 首选：等距采样'],
  ['按钮防连点', '✔ 可用（leading:true）', '✔ 更常用（leading:true）'],
  ['自动保存 / 埋点上报', '✔ 首选：合并短时间内的多次', '△ 需要周期性上报时用节流'],
];

console.log('对比项'.padEnd(20) + '防抖 debounce'.padEnd(26) + '节流 throttle');
console.log('-'.repeat(76));
for (const [item, debounceDesc, throttleDesc] of comparison) {
  console.log(item.padEnd(20) + debounceDesc.padEnd(26) + throttleDesc);
}

console.log('\n记忆口诀：防抖是"等你停下来"，节流是"固定频率"。');

// 打印总耗时，确认示例足够轻量
console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
