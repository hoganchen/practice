/**
 * ============================================================================
 * 知识点：节流 throttle —— 时间戳版、定时器版与结合版（首次立即 + 末尾补执行）
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】进阶
 * 【前置知识】31_performance_and_memory/01_debounce.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    节流（throttle）是一种"限频"策略：不管事件触发得多密集，真正要执行的函数
 *    在每 wait 毫秒内最多只执行一次，就像给函数装了一个"节流阀"。
 *    一句话：节流 = "固定频率"，把 100 次/秒的触发降到 10 次/秒。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 滚动加载更多 / 滚动进度条：滚动事件每秒能触发几十上百次，用节流固定
 *      每 100~200ms 采样一次，既能及时响应又不会卡顿。
 *    - 鼠标移动 / 拖拽跟随：mousemove 频率极高，节流后按固定频率更新位置，
 *      画面上看起来依然顺滑。
 *    - 按钮防连点：用户手抖点了 5 次，用 leading 节流只让第 1 次生效，
 *      后续 5 秒内的点击全部丢弃（比禁用按钮更简单）。
 *    - 埋点上报 / 位置上报：按固定间隔上报，避免请求风暴。
 *
 * 3. 核心语法要点（三种实现流派）
 *    (1) 时间戳版：记录上次执行时间 lastTime，每次触发算 now - lastTime >= wait
 *        才执行。特点是【首次立即执行】，但停止触发后【最后一次会丢失】，
 *        因为最后一次触发时还没到冷却期，而它之后不会再有触发来"唤醒"。
 *    (2) 定时器版：触发时如果 timer 为 null 就挂一个 setTimeout(wait)。
 *        特点是【首次延迟 wait 毫秒才执行】，但【最后一次保证执行】，
 *        因为 timer 到期时用的是最后记录下来的参数。
 *    (3) 结合版：用 lastTime 做"立即执行"的判断，用 timer 做"兜底补执行"，
 *        实现"首次立即执行 + 停止后补执行最后一次"，也就是 lodash.throttle 的行为。
 *
 * 4. 常见陷阱
 *    - 时间戳版丢尾部：拖拽结束时最后一段位置没被记录，画面停在半路。
 *      解决办法就是结合版，或者在 dragend 时手动补一次。
 *    - 定时器版首次延迟：点击按钮后要等 wait 毫秒才有反应，用户会觉得"没点到"。
 *      按钮场景要用 leading（首次立即执行）。
 *    - 定时器版必须用 function 保存 this 和参数，否则 fn.apply 时现场已经丢了。
 *    - 计时用 Date.now() 会受系统时间调整影响（用户改系统时间会跳变），
 *      更严谨的实现用 performance.now()（单调递增，不受系统时间影响）。
 *    - 节流不保证"最后一次一定是最新数据"——如果 wait 期间数据变了多次，
 *      只会保留最后一次的参数，前面的会被覆盖丢弃。需要"一个都不能少"时应当
 *      改用队列/批量提交，而不是节流。
 *    - 忘清定时器导致进程无法退出（Node.js 里），或组件卸载后回调仍执行。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/02_throttle.js
 *
 * 【预期输出】
 *   打印 6 个小节：三种节流实现的代码与说明、同一串触发下的调用次数实测对比、
 *   首次触发是否立即执行的对比、停止触发后最后一次是否丢失的对比、
 *   节流与防抖的区别，以及按钮防连点的实战写法。
 * ============================================================================
 */

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 1. 时间戳版：首次立即执行，但最后一次可能丢失
// ---------------------------------------------------------------------------

console.log('--- 1. 时间戳版 throttle ---');

/**
 * 时间戳版节流
 * @param {Function} fn   要执行的函数
 * @param {number}   wait 冷却时间（毫秒）
 */
function throttleByTimestamp(fn, wait) {
  // lastTime 记录"上一次真正执行"的时刻。
  // 初始化成 0 是个小技巧：now - 0 一定大于 wait，所以首次调用必然立即执行。
  let lastTime = 0;

  return function throttled(...args) {
    const now = Date.now();

    if (now - lastTime >= wait) {
      // 冷却时间已过 → 放行，并刷新 lastTime
      lastTime = now;
      return fn.apply(this, args);
    }

    // 冷却时间未到 → 直接丢弃这次触发（注意：什么都没记住！）
    // 这就是"最后一次可能丢失"的根本原因：尾部触发被丢掉了，
    // 而它之后不再有触发来把它"唤醒"。
    return undefined;
  };
}

console.log('时间戳版特点：首次立即执行 ✔，最后一次可能丢失 ✘');

// ---------------------------------------------------------------------------
// 2. 定时器版：首次延迟，但最后一次保证执行
// ---------------------------------------------------------------------------

console.log('\n--- 2. 定时器版 throttle ---');

/**
 * 定时器版节流
 * @param {Function} fn
 * @param {number}   wait
 */
function throttleByTimer(fn, wait) {
  let timer = null; // 冷却中的计时器句柄
  let lastArgs = null; // 冷却期间最后一次触发留下的参数
  let lastThis = null; // 冷却期间最后一次触发留下的 this

  function invoke() {
    const args = lastArgs;
    const ctx = lastThis;
    lastArgs = null;
    lastThis = null;
    fn.apply(ctx, args);
  }

  return function throttled(...args) {
    // 无论放行还是丢弃，都要先把现场记下来 —— 这是"末尾补执行"能生效的关键
    lastArgs = args;
    lastThis = this;

    if (timer !== null) {
      // 还在冷却中：直接返回，等计时器到期时统一执行（参数用最新的那份）
      return;
    }

    // 不在冷却中 → 开始一个冷却周期。
    // 注意这里用的是 setTimeout 而不是立即调用，所以首次触发会被延迟 wait 毫秒。
    timer = setTimeout(() => {
      timer = null; // 冷却结束
      if (lastArgs) invoke(); // 把冷却期间攒下的最后一次触发执行掉
    }, wait);
  };
}

console.log('定时器版特点：首次延迟 wait 毫秒 ✘，最后一次保证执行 ✔');

// ---------------------------------------------------------------------------
// 3. 结合版：首次立即执行 + 停止后补执行最后一次
// ---------------------------------------------------------------------------

console.log('\n--- 3. 结合版 throttle（推荐） ---');

/**
 * 结合版节流：lodash.throttle 的核心思路
 * @param {Function} fn
 * @param {number}   wait
 * @param {object}   [options]
 * @param {boolean}  [options.leading=true]  冷却周期开始时是否立即执行
 * @param {boolean}  [options.trailing=true] 冷却周期结束时是否补执行最后一次
 */
function throttle(fn, wait, options = {}) {
  const { leading = true, trailing = true } = options;

  let lastTime = 0; // 上次真正执行的时刻
  let timer = null; // 兜底计时器
  let lastArgs = null;
  let lastThis = null;

  function invoke() {
    const args = lastArgs;
    const ctx = lastThis;
    lastArgs = null;
    lastThis = null;
    lastTime = Date.now(); // 每次真正执行都要刷新时间戳
    return fn.apply(ctx, args);
  }

  return function throttled(...args) {
    const now = Date.now();
    // leading 为 false 时，把"起点"挪到当前时刻，
    // 这样 now - lastTime = 0，首次调用就不会立即执行。
    if (lastTime === 0 && !leading) lastTime = now;

    const remaining = wait - (now - lastTime); // 距离冷却结束还剩多久

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      // 冷却已过（或系统时间被往回调导致 remaining > wait 的异常情况）→ 立即执行
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      return invoke();
    }

    // 还在冷却中：只在第一次进入冷却时挂一个兜底计时器
    if (timer === null) {
      timer = setTimeout(() => {
        timer = null;
        // trailing 为 true 且冷却期间确实攒下了触发 → 补执行一次
        if (trailing && lastArgs) invoke();
      }, remaining);
    }
  };
}

console.log('结合版特点：首次立即执行 ✔，最后一次补执行 ✔（推荐在项目中使用）');

// ---------------------------------------------------------------------------
// 4. 同一串触发下的调用次数实测对比
// ---------------------------------------------------------------------------

console.log('\n--- 4. 实测：同一串触发下三种实现的调用次数 ---');

// 复用 01 文件里的思路：造一个记录调用次数的 mock 函数
function createCounter(label) {
  const state = { label, count: 0, argsList: [] };
  state.fn = function (...args) {
    state.count += 1;
    state.argsList.push(args[0]);
    return state.count;
  };
  return state;
}

const WAIT = 30; // 节流冷却时间取 30ms，让示例跑得快

const tsCounter = createCounter('时间戳版');
const timerCounter = createCounter('定时器版');
const combinedCounter = createCounter('结合版');
const debounceCounter = createCounter('防抖（对照）');

const tsThrottled = throttleByTimestamp(tsCounter.fn, WAIT);
const timerThrottled = throttleByTimer(timerCounter.fn, WAIT);
const combinedThrottled = throttle(combinedCounter.fn, WAIT);

// 一个最简单的防抖，用于对照
function debounceSimple(fn, wait) {
  let timer = null;
  return function (...args) {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, wait);
  };
}
const debouncedFn = debounceSimple(debounceCounter.fn, WAIT);

// 统一触发序列：每 10ms 触发一次，共 9 次（总时长 80ms）
const TRIGGER_COUNT = 9;
const TRIGGER_GAP = 10;

console.log(`触发序列：每 ${TRIGGER_GAP}ms 触发一次，共 ${TRIGGER_COUNT} 次（总时长约 ${(TRIGGER_COUNT - 1) * TRIGGER_GAP}ms，节流间隔 ${WAIT}ms）`);

// 第一次触发后同步检查，用于观察"首次是否立即执行"
tsThrottled(1);
timerThrottled(1);
combinedThrottled(1);
debouncedFn(1);
console.log(`第 1 次触发后同步检查：时间戳版=${tsCounter.count}，定时器版=${timerCounter.count}，结合版=${combinedCounter.count}，防抖=${debounceCounter.count}`);

// 继续触发剩余的
for (let i = 2; i <= TRIGGER_COUNT; i++) {
  await sleep(TRIGGER_GAP);
  tsThrottled(i);
  timerThrottled(i);
  combinedThrottled(i);
  debouncedFn(i);
}

// 触发序列刚刚结束时的快照
const duringSnapshot = {
  时间戳版: tsCounter.count,
  定时器版: timerCounter.count,
  结合版: combinedCounter.count,
  防抖: debounceCounter.count,
};
console.log('触发序列刚结束时：', JSON.stringify(duringSnapshot));

// 停下来等待，观察"最后一次"会不会被补执行
await sleep(WAIT * 2);

const afterSnapshot = {
  时间戳版: tsCounter.count,
  定时器版: timerCounter.count,
  结合版: combinedCounter.count,
  防抖: debounceCounter.count,
};
console.log(`停止触发并等待 ${WAIT * 2}ms 后：`, JSON.stringify(afterSnapshot));

console.log('\n调用次数对比表（触发 ' + TRIGGER_COUNT + ' 次）：');
console.log('实现'.padEnd(14) + '结束时'.padEnd(10) + '等待后'.padEnd(10) + '首次立即执行'.padEnd(16) + '末尾补执行');
console.log('-'.repeat(72));
const rows = [
  ['时间戳版', duringSnapshot.时间戳版, afterSnapshot.时间戳版, '是', '否（会丢失）'],
  ['定时器版', duringSnapshot.定时器版, afterSnapshot.定时器版, '否（延迟 wait）', '是'],
  ['结合版', duringSnapshot.结合版, afterSnapshot.结合版, '是', '是'],
  ['防抖', duringSnapshot.防抖, afterSnapshot.防抖, '否', '是（只执行 1 次）'],
];
for (const r of rows) {
  console.log(String(r[0]).padEnd(14) + String(r[1]).padEnd(10) + String(r[2]).padEnd(10) + String(r[3]).padEnd(16) + r[4]);
}

console.log('\n注：具体次数受定时器精度与机器负载影响，可能小幅波动，');
console.log('    但"时间戳版次数不随等待增加、其余实现次数会增加"这一趋势是稳定的。');

// 各实现最终收到的参数，能直观看到"丢了哪些"
console.log('时间戳版实际收到的事件序号 =', JSON.stringify(tsCounter.argsList));
console.log('结合版实际收到的事件序号   =', JSON.stringify(combinedCounter.argsList));

// ---------------------------------------------------------------------------
// 5. 节流与防抖的区别
// ---------------------------------------------------------------------------

console.log('\n--- 5. 节流与防抖的核心区别 ---');

console.log('防抖：等你停下来再执行  →  执行次数 = 1（无论触发多少次）');
console.log('节流：固定频率执行      →  执行次数 ≈ 总时长 / wait');
console.log('');
console.log('用一句话选择：');
console.log('  · 只关心"最终结果"        → 防抖（搜索联想、表单校验、自动保存）');
console.log('  · 需要"过程中的连续反馈"  → 节流（滚动进度、鼠标跟随、拖拽）');

// ---------------------------------------------------------------------------
// 6. 实战：按钮防连点（首次立即执行的节流）
// ---------------------------------------------------------------------------

console.log('\n--- 6. 实战：按钮防连点 ---');

const submitCounter = createCounter('提交订单');
// leading: true 保证第一次点击立刻有反馈；trailing: false 表示冷却期内的点击直接忽略，
// 这正是"防连点"想要的语义（如果 trailing 为 true，冷却结束后还会再提交一次，反而危险）。
const safeSubmit = throttle(submitCounter.fn, 60, { leading: true, trailing: false });

// 真实世界里"手抖连点"的几次点击几乎发生在同一瞬间（间隔通常只有几毫秒），
// 所以这里用同步循环模拟，避免 setTimeout 的粗粒度精度干扰演示效果。
console.log('用户手抖连续点击 6 次（同步连续触发，冷却时间 60ms）：');
for (let i = 1; i <= 6; i++) {
  safeSubmit(i);
}
console.log(`点击 6 次后同步检查：实际提交 ${submitCounter.count} 次，收到的是第 ${JSON.stringify(submitCounter.argsList)} 次点击`);
await sleep(80);
console.log(`等待冷却结束后再看：实际提交 ${submitCounter.count} 次（trailing:false，冷却期内的点击全部丢弃）`);

// 冷却期结束后再点一次，验证功能恢复正常
safeSubmit(7);
console.log(`冷却结束后再点 1 次：实际提交 ${submitCounter.count} 次，收到的是第 ${JSON.stringify(submitCounter.argsList)} 次点击`);
console.log('结论：防连点应该用 leading:true + trailing:false 的节流，');
console.log('      如果用了防抖，用户点完还要再等 wait 毫秒才提交，交互上会"迟钝"。');

// 提醒：Node.js 进程退出前，所有定时器都应该已经到期或已被清除。
console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms（所有定时器均已自然到期）。`);
console.log('示例结束。');
