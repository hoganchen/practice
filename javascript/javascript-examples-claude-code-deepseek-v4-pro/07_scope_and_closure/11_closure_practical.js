/**
 * ============================================================================
 * 知识点：闭包实战 —— 防抖、节流、一次性函数、单例
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】高级
 * 【前置知识】07_scope_and_closure/07_closure_private_state.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本示例把闭包用到四个最常见的工程场景上。它们的共同点都是
 *    "函数需要记住一些状态，而这些状态不应该暴露给外部"：
 *      · 防抖（debounce）：连续触发时只在"停下来之后"执行一次；
 *      · 节流（throttle）：连续触发时限制为"每隔一段时间最多执行一次"；
 *      · 一次性函数（once）：无论调用多少次，只真正执行一次；
 *      · 单例（singleton）：无论请求多少次，只创建一个实例。
 *
 * 2. 为什么需要
 *    这四个都是"把状态藏起来"的需求：
 *      防抖要记住上一次的定时器 id；
 *      节流要记住上一次执行的时间戳；
 *      一次性函数要记住"是否已经执行过"；
 *      单例要记住"那个唯一实例"。
 *    如果用模块级变量来存，多实例就会互相干扰（比如两个输入框都想要自己的防抖），
 *    而闭包让"每个被包装出来的函数"拥有自己独立的一份状态。
 *
 * 3. 核心语法要点
 *    (1) 防抖：每次触发都清掉上一个定时器，重新计时。适合"输入停止后再搜索"。
 *    (2) 节流：记录上次执行时间，未超过间隔就直接忽略本次触发。
 *        适合"滚动、拖拽、resize 这类高频事件"。
 *    (3) 一次性函数：用一个标志位（或直接把内部函数置空）保证只执行一次，
 *        后续调用返回第一次的结果。
 *    (4) 单例：用一个私有变量存实例，第一次调用时创建，之后都返回同一个。
 *    (5) 这三个包装函数都返回"新函数"，新函数通过闭包访问私有状态。
 *        被包装的原函数本身完全不需要知道这些逻辑（装饰器思想）。
 *
 * 4. 常见陷阱
 *    - 防抖和节流混淆：防抖是"等你停下来"，节流是"按固定频率"。
 *    - 防抖忘了处理"立即执行（leading）"的需求，导致首次点击没反应。
 *    - 节流用 setInterval 实现，导致定时器泄漏（应在回调里用 setTimeout 递归）。
 *    - 一次性函数忘了给后续调用返回第一次的结果，调用方拿到 undefined。
 *    - 单例的"私有变量"写在了对的位置之外（比如写成了返回对象上的属性），失去单例效果。
 *
 * 【运行方法】
 *   node 07_scope_and_closure/11_closure_practical.js
 *
 * 【预期输出】
 *   用真实定时器演示防抖与节流的执行次数差异、一次性函数的只执行一次、
 *   单例的同一个实例，以及一个用闭包实现的事件总线。
 * ============================================================================
 */

console.log('--- 1. 防抖 debounce：停下来之后才执行 ---');

/**
 * 防抖：触发后等 wait 毫秒，如果期间又被触发，就重新计时。
 * @param {Function} fn 真正要执行的函数
 * @param {number} wait 等待时间（毫秒）
 * @param {boolean} leading 是否在第一次触发时"立即执行一次"
 */
function debounce(fn, wait = 100, leading = false) {
  // 私有状态：定时器 id、是否已经因为 leading 执行过。
  let timerId = null;
  let calledInThisRound = false;

  return function debounced(...args) {
    // leading 模式：本轮第一次触发时立刻执行。
    if (leading && !calledInThisRound) {
      calledInThisRound = true;
      fn.apply(this, args);
    }
    // 无论哪种模式，都要清掉上一个待执行的定时器，重新计时。
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      calledInThisRound = false;
      if (!leading) {
        fn.apply(this, args);
      }
    }, wait);
  };
}

// 用"模拟输入"来观察执行次数。
let searchCount = 0;
const doSearch = (keyword) => {
  searchCount += 1;
  console.log(`    [真实搜索] 关键词「${keyword}」，第 ${searchCount} 次执行`);
};
const debouncedSearch = debounce(doSearch, 30);

console.log('  连续快速"输入"5 次（每次间隔 5ms，都小于 30ms 的等待时间）：');
for (const kw of ['j', 'ja', 'jav', 'java', 'javas']) {
  debouncedSearch(kw);
  await new Promise((resolve) => setTimeout(resolve, 5));
}
console.log(`  输入结束时的执行次数 → ${searchCount}（还在等待中）`);
// 等超过 wait 的时间，让防抖最后一次真正执行。
await new Promise((resolve) => setTimeout(resolve, 60));
console.log(`  等待 60ms 后的执行次数 → ${searchCount}（只执行了 1 次，用的是最后一次的关键词）`);
console.log('  结论：5 次触发只执行 1 次 —— 这就是防抖，非常适合搜索框输入。');

// leading 模式：第一次立刻执行。
searchCount = 0;
const debouncedLeading = debounce(doSearch, 30, true);
console.log('  leading 模式（第一次立即执行）：');
debouncedLeading('首次');
console.log(`    触发后立刻执行次数 → ${searchCount}`);
debouncedLeading('第二次');
console.log(`    再触发一次后 → ${searchCount}（本轮已执行过，不再立即执行）`);
await new Promise((resolve) => setTimeout(resolve, 60));
console.log(`    等待结束后 → ${searchCount}（leading 模式下等待结束时不再重复执行）`);

console.log('--- 2. 节流 throttle：固定频率内最多执行一次 ---');

/**
 * 节流：无论触发多频繁，每 wait 毫秒最多执行一次。
 * 为了让演示结果稳定可复现，时间来源用参数注入（真实项目里直接用 Date.now 即可）。
 * @param {Function} fn 真正要执行的函数
 * @param {number} wait 间隔时间（毫秒）
 * @param {Function} now 取当前时间的函数，默认 Date.now
 */
function throttle(fn, wait = 100, now = Date.now) {
  // 私有状态：上一次执行的时间戳。
  // 初值取负无穷，保证"第一次触发一定执行"。
  let lastTime = Number.NEGATIVE_INFINITY;

  return function throttled(...args) {
    const current = now();
    // 距离上次执行是否已经超过了 wait 毫秒。
    if (current - lastTime >= wait) {
      lastTime = current;
      fn.apply(this, args);
      return true;
    }
    // 没到时间，直接忽略本次触发（leading-only 版本）。
    return false;
  };
}

// 用一个"手动时钟"让结果完全确定：每次触发让时间前进 5ms。
let fakeTime = 0;
const fakeNow = () => fakeTime;

let scrollCount = 0;
const onScroll = (position, at) => {
  scrollCount += 1;
  console.log(`    第 ${scrollCount} 次执行 → 滚动位置 ${position}（此时时钟 t = ${at}ms）`);
};
const throttledScroll = throttle(onScroll, 25, fakeNow);

console.log('  连续"滚动"10 次（每次让时钟前进 5ms，节流间隔 25ms）：');
for (let i = 1; i <= 10; i++) {
  const position = i * 10;
  const executed = throttledScroll(position, fakeTime);
  console.log(`    t=${String(fakeTime).padStart(3)}ms 触发（位置 ${position}）→ ${executed ? '执行' : '被节流忽略'}`);
  fakeTime += 5; // 时钟前进 5 毫秒
}
console.log(`  10 次触发中真正执行了 ${scrollCount} 次 —— 这就是节流：按固定频率放行。`);
console.log('  规律：t=0ms 放行，之后每隔 25ms 才放行一次，其余全部忽略。');
console.log('  防抖 vs 节流：防抖是"等你停下来再执行"，节流是"按固定频率执行"，别用混。');

// 真实项目里的节流还要考虑"最后一次触发后补执行一次（trailing）"，
// 那部分需要用 setTimeout 实现，思路是：未到时间时记下最后一次的参数，
// 并用定时器在剩余时间到点后补执行一次 —— 这里只给出思路，避免输出依赖真实时钟。
console.log('  提示：需要 trailing（最后一次补执行）时，在"被忽略"的分支里用 setTimeout 排一个定时器，');
console.log('        等 remaining 毫秒后用最新的参数再执行一次。');

console.log('--- 3. 一次性函数 once：只执行一次 ---');

function once(fn) {
  // 私有状态：只在这里记录"是否已执行"和"第一次的结果"。
  let called = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
      // 执行完可以把原函数引用也丢掉（语义上的"用过了"）。
      fn = null;
    }
    // 后续调用返回第一次的结果，而不是 undefined —— 这一点非常关键。
    return result;
  };
}

let initCount = 0;
const initialize = once((name) => {
  initCount += 1;
  return `已初始化「${name}」（真实执行第 ${initCount} 次）`;
});

console.log('  第 1 次调用 →', initialize('数据库'));
console.log('  第 2 次调用 →', initialize('缓存'));
console.log('  第 3 次调用 →', initialize('消息队列'));
console.log(`  真实执行次数 → ${initCount}（后面两次都直接返回第一次的结果）`);
console.log('  典型用途：只初始化一次的连接、只弹一次的引导弹窗、只发送一次的分析埋点。');

console.log('--- 4. 单例 singleton：整个程序只有一个实例 ---');

function createSingleton(factory) {
  // instance 藏在闭包里，外部完全无法重置或替换。
  let instance = null;
  let createCount = 0;

  return function getInstance(...args) {
    if (instance === null) {
      createCount += 1;
      instance = factory(...args);
    }
    return instance;
  };
}

const getConfig = createSingleton((env) => ({
  env,
  createdAt: '本次创建时确定（为避免输出不稳定，不打印真实时间）',
  // 用一个自增编号证明"只创建了一次"
  sequence: `instance-${Math.random().toString(36).slice(2, 8)}`,
}));

const configFirst = getConfig('production');
const configSecond = getConfig('development'); // 参数不同也没用，已经创建过了
console.log('  第一次获取 →', configFirst.env, '/', configFirst.sequence);
console.log('  第二次获取 →', configSecond.env, '/', configSecond.sequence);
console.log('  两次是同一个对象吗？', configFirst === configSecond);
console.log('  注意：单例会忽略后续传入的参数，这在语义上是"只认第一次" —— 有时是特性，有时是坑。');

// 单例的常见变体：惰性初始化 + 依赖工厂函数（只有真正用到时才创建）。
const getHeavyResource = createSingleton(() => {
  console.log('    [工厂] 正在创建重量级资源…（只会看到这一次）');
  return { type: '重量级资源', ready: true };
});
console.log('  第一次调用 getHeavyResource() 前，资源还没创建。');
console.log('  第一次 →', getHeavyResource());
console.log('  第二次 →', getHeavyResource(), '（不会再看到"[工厂] 正在创建"）');

console.log('--- 5. 综合：用闭包实现一个简单的事件总线 ---');

function createEventBus() {
  // 私有状态：事件名 → 处理函数数组。
  const listeners = new Map();

  return {
    on(event, handler) {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event).push(handler);
      return () => {
        // 返回"取消订阅"的函数 —— 它也是闭包，记住了 event 和 handler。
        const list = listeners.get(event) ?? [];
        const index = list.indexOf(handler);
        if (index !== -1) {
          list.splice(index, 1);
          return '已取消订阅';
        }
        return '该订阅不存在';
      };
    },
    emit(event, payload) {
      const list = listeners.get(event) ?? [];
      if (list.length === 0) return `事件「${event}」没有订阅者`;
      // 复制一份再遍历，避免回调中取消订阅导致遍历错乱。
      return [...list].map((handler) => handler(payload));
    },
    listenerCount(event) {
      return (listeners.get(event) ?? []).length;
    },
  };
}

const bus = createEventBus();
const logPrefix = '[总线] ';
const off1 = bus.on('user:login', (user) => `${logPrefix}欢迎 ${user}`);
const off2 = bus.on('user:login', (user) => `记录登录日志：${user}`);
const off3 = bus.on('user:logout', (user) => `再见 ${user}`);

console.log('  触发 user:login →', bus.emit('user:login', '小明'));
console.log('  触发 user:logout →', bus.emit('user:logout', '小明'));
console.log('  触发未知事件 →', bus.emit('unknown:event'));
console.log('  user:login 的订阅数 →', bus.listenerCount('user:login'));
console.log('  取消第二个订阅 →', off2());
console.log('  再触发 user:login →', bus.emit('user:login', '小红'));
console.log('  再取消一次 →', off2(), '（幂等：重复取消不会出错）');
void off1;
void off3;

console.log('--- 6. 四个工具的共同点与差异 ---');

const summary = [
  ['防抖 debounce', '定时器 id', '连续触发只在停止后执行一次', '搜索输入、表单校验、窗口 resize 结束后计算'],
  ['节流 throttle', '上次执行时间 + 定时器 id', '固定间隔内最多执行一次', '滚动监听、拖拽、鼠标移动、按钮防连点'],
  ['一次性 once', '布尔标志 + 结果', '永远只真正执行一次', '初始化、埋点上报、只弹一次的提示'],
  ['单例 singleton', '实例引用', '永远只创建一个对象', '全局配置、连接池、日志器'],
];
for (const [name, state, behavior, usage] of summary) {
  console.log(`  · ${name}`);
  console.log(`      私有状态：${state}`);
  console.log(`      行为：${behavior}`);
  console.log(`      典型场景：${usage}`);
}

console.log('--- 7. 为什么这四个都离不开闭包 ---');
console.log('  它们的私有状态必须"每个包装结果一份"：');
console.log('    两个输入框各自需要独立的防抖定时器；');
console.log('    两个滚动容器各自需要独立的节流时间戳。');
console.log('  如果把这些状态写成模块级变量，多个实例就会互相干扰；');
console.log('  写成返回对象的属性，外部又能随手篡改（debounce.timer = null 就废了）。');
console.log('  只有闭包能同时做到：状态私有 + 每个实例独立 + 不污染全局。');

console.log('--- 程序结束 ---');
