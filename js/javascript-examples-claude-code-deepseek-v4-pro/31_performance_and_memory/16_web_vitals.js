/**
 * ============================================================================
 * 知识点：Web Vitals 与性能测量 API —— LCP/CLS/INP/TTFB/FCP、
 *           PerformanceObserver、User Timing、长任务观察、真实采集与上报
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/11_benchmark_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "Web Vitals" 是一套【以用户体验为中心】的性能指标体系。
 *    传统指标（加载总耗时、资源大小）说的是"机器做了什么"，
 *    Web Vitals 说的是"用户感受到了什么"：
 *      页面多久出现内容？主要内容多久出现？点一下多久有反应？画面会不会乱跳？
 *    它由三个核心指标（Core Web Vitals）加几个辅助指标组成。
 *
 * 2. 为什么需要（真实项目场景）
 *    - "我们做了很多优化，到底有没有变好？" —— 需要可对比的数字；
 *    - "监控说接口很快，但用户投诉很卡" —— 接口快 ≠ 用户感觉快，
 *      中间还隔着渲染、主线程阻塞、布局抖动；
 *    - 搜索引擎把 Core Web Vitals 作为排名因素之一，它直接影响业务指标；
 *    - 上线后发现转化率下降，需要定位是"白屏太久"还是"点不动"。
 *
 * 3. 核心语法要点
 *
 *    (1) 五个核心指标（含义 + 优化方向）
 *
 *        TTFB —— Time To First Byte（首字节时间）
 *          从发起请求到收到第一个字节。它衡量的是【网络 + 服务端】的响应速度，
 *          是后面所有指标的地基：TTFB 慢，后面全都会慢。
 *          好/需改进/差：≤800ms / ≤1800ms / >1800ms
 *          优化方向：CDN、服务端缓存、数据库查询优化、连接复用（keep-alive）、
 *                    把重定向减到最少、用 HTTP/2 或 HTTP/3。
 *
 *        FCP —— First Contentful Paint（首次内容绘制）
 *          页面上【第一个】文本或图片被绘制出来的时刻。
 *          它回答的是"用户什么时候第一次看到东西（而不是白屏）"。
 *          好/需改进/差：≤1.8s / ≤3.0s / >3.0s
 *          优化方向：减少阻塞渲染的资源、内联关键 CSS、
 *                    字体用 font-display: swap、避免 JS 阻塞首屏。
 *
 *        LCP —— Largest Contentful Paint（最大内容绘制）
 *          视口内【最大】的那块内容（大图、大标题、大视频封面）绘制完成的时刻。
 *          Core Web Vitals 的加载性能代表指标 —— 它比 FCP 更贴近
 *          "主要内容看到了吗"这个真实感受。
 *          好/需改进/差：≤2.5s / ≤4.0s / >4.0s
 *          优化方向：优先加载 LCP 图片（fetchpriority="high"、预加载）、
 *                    用现代格式（WebP/AVIF）、给图片设明确的尺寸、
 *                    服务端渲染/静态化、减少 TTFB。
 *
 *        CLS —— Cumulative Layout Shift（累积布局偏移）
 *          衡量【画面意外跳动】的程度，是个"分数"（无单位，越小越好）。
 *          典型场景：图片没写尺寸，加载完把下面的内容顶下去了；
 *                    广告/横幅后插入，正文被推走；字体切换导致文字重排。
 *          ⚠ CLS 只计算"意外"的偏移，用户主动交互引发的偏移不计入
 *            （所以它对交互后 500ms 内的偏移也不计入）。
 *          好/需改进/差：≤0.1 / ≤0.25 / >0.25
 *          优化方向：给图片/视频/iframe 写明 width/height 或 aspect-ratio、
 *                    为动态插入的内容预留空间、字体用 size-adjust、
 *                    不要把内容插到已有内容的上方。
 *
 *        INP —— Interaction to Next Paint（交互到下次绘制）
 *          从用户交互（点击、按键、点按）到页面【下一次绘制】的时间。
 *          ⚠ INP 在 2024 年 3 月正式【取代了 FID】（First Input Delay）。
 *            区别很大：FID 只测【第一次交互的输入延迟】，
 *            INP 测【整次访问中所有交互】的表现，并且一直测到绘制完成。
 *            所以 INP 比 FID 严格得多，也更能反映真实卡顿。
 *          它由三部分组成：
 *            输入延迟（主线程忙，事件在队列里等）+ 事件处理耗时 + 呈现延迟。
 *            其中"输入延迟"往往是大头，直接来源于【长任务】。
 *          好/需改进/差：≤200ms / ≤500ms / >500ms
 *          优化方向：拆分长任务（见 14 号示例）、减少不必要的事件监听、
 *                    让出主线程、避免在交互回调里做同步重活。
 *
 *        ⚠ 关于"取哪个值"：这些指标都不是取平均值，而是取
 *          【第 75 百分位（p75）】—— 也就是"75% 的访问比这个值更好"。
 *          平均值会被少数极端慢的样本掩盖，而用户体验关心的是"大多数人"。
 *          所以报表上通常是 p75，有时也会同时看 p90/p99 观察长尾。
 *
 *    (2) User Timing API —— 自己打点
 *        · performance.mark(name)                    —— 打一个时间戳标记
 *        · performance.measure(name, start, end)     —— 量两个标记之间的距离
 *          start/end 可以是标记名、也可以是 mark 对象、还可以省略
 *          （省略 start 就从导航开始，省略 end 就到现在）
 *        · performance.getEntriesByType('measure')   —— 取所有 measure 条目
 *        · performance.getEntriesByName(name)        —— 按名字取
 *        · performance.clearMarks() / clearMeasures()—— 清理
 *        这是"给业务代码打点"最标准的方式，DevTools 的 Performance 面板
 *        会把这些标记直接画在时间轴上，非常直观。
 *
 *    (3) PerformanceObserver —— 订阅性能条目
 *        性能条目是【异步】产生的，用 getEntries() 轮询既低效又会漏。
 *        PerformanceObserver 让你"有新的就通知我"：
 *
 *          const po = new PerformanceObserver((list) => {
 *            for (const entry of list.getEntries()) { ... }
 *          });
 *          po.observe({ type: 'largest-contentful-paint', buffered: true });
 *
 *        · { buffered: true } 会【补发】观察者注册之前就已经产生的条目 ——
 *          这非常关键，因为很多指标（FCP/LCP）在页面早期就产生了，
 *          等你的 JS 加载完再注册就晚了；
 *        · list.getEntries() 拿到的是本轮新增的条目；
 *        · 用 po.disconnect() 停止观察；
 *        · ⚠ 很多指标需要注册【多个】观察者并各取所需，不是一次就齐。
 *
 *    (4) 长任务观察（'longtask'）
 *        浏览器会在主线程连续被占用超过 50ms 时产生一个 longtask 条目，
 *        里面能看到它持续了多久、发生在什么时间。
 *        这是定位 INP 问题的第一手材料：把 longtask 和用户交互时间对一下，
 *        就能确认"这次卡顿是被哪个长任务拖住的"。
 *        ⚠ 'longtask' 是浏览器专有，Node 里【不会】产生。
 *
 *    (5) 【本示例的环境现实】
 *        本示例在 Node.js 里运行，所以：
 *          · 能真实观察到的 entry 类型：'mark'、'measure'、'function'、'gc'；
 *          · FCP / LCP / CLS / INP / longtask 这些依赖【渲染】的指标
 *            在 Node 里【根本不存在】—— 没有渲染，就没有"绘制"可言；
 *          · 本示例会打印出浏览器端应该怎么写这些观察者，
 *            但在 Node 里【只真实演示它能观察的那几类】。
 *        这里有一个非常值得记住的坑（本示例会实测给你看）：
 *          ❗ 在 Node 里对 'largest-contentful-paint' 这类浏览器专属类型
 *             调用 observe()，【不会报错】，只是永远收不到任何条目。
 *             "没抛异常"绝不等于"这个指标可用"—— 这是很多统计代码
 *             在生产环境静默失效的原因。
 *
 * 4. 常见陷阱
 *    - 陷阱一：以为 API 不报错就等于指标可用（见上）。
 *      必须做特性检测：typeof PerformanceObserver !== 'undefined' 且
 *      用 performance.supportedEntryTypes?.includes('xxx') 判断。
 *    - 陷阱二：忘了 { buffered: true }。晚注册的观察者会漏掉早期指标。
 *    - 陷阱三：把 CLS 当成"所有偏移"。它只统计意外偏移，
 *      用户交互后的偏移不算 —— 所以不要自己用 scroll 位置去算。
 *    - 陷阱四：用平均值汇报。必须用 p75。
 *    - 陷阱五：只看实验室数据（Lighthouse）就下结论。
 *      实验室数据是"受控环境下的单次测量"，真实用户数据（RUM）才是事实。
 *      两者要结合：实验室用来定位，RUM 用来判断影响面。
 *    - 陷阱六：上报时页面已经卸载，请求被浏览器取消。
 *      必须用 navigator.sendBeacon 或 fetch(..., { keepalive: true })。
 *    - 陷阱七：在 Node 里用 performance.mark 却忘了清理，
 *      长时间运行的服务会累积大量 mark 条目，造成内存缓慢增长。
 *    - 陷阱八：以为 INP 还是 FID。FID 已于 2024 年 3 月被 INP 取代，
 *      还在按 FID 的阈值（100ms）做优化目标的话，标准就落后了。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/16_web_vitals.js
 *
 * 【预期输出】
 *   8 个小节：五个核心指标详解、User Timing API 实测、
 *   PerformanceObserver 在 Node 里的真机演示（mark/measure/function）、
 *   "不报错但永远不触发"的实测证据、GC 条目观察、长任务与 LCP/CLS/INP
 *   的浏览器端写法、真实项目的采集与上报策略、以及速查清单。
 *   全程不访问外网，一秒内跑完。
 * ============================================================================
 */

import { PerformanceObserver, performance } from 'node:perf_hooks';

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 小工具
// ---------------------------------------------------------------------------

/** 等待一个宏任务，让 PerformanceObserver 的回调有机会执行 */
const tick = (ms = 0) => new Promise((resolve) => setTimeout(resolve, ms));

/** 把毫秒格式化 */
const ms = (v) => `${v.toFixed(2)} ms`;

// ---------------------------------------------------------------------------
// 1. 五个核心指标
// ---------------------------------------------------------------------------

console.log('--- 1. Web Vitals 五个核心指标 ---');
console.log('');
console.log('  指标'.padEnd(8) + '衡量什么'.padEnd(30) + '好'.padEnd(10) + '需改进'.padEnd(10) + '差');
console.log('  ' + '-'.repeat(86));
const metrics = [
  ['TTFB', '服务端 + 网络的响应速度', '≤800ms', '≤1800ms', '>1800ms'],
  ['FCP', '第一次看到任何内容', '≤1.8s', '≤3.0s', '>3.0s'],
  ['LCP', '主要内容（最大块）出现', '≤2.5s', '≤4.0s', '>4.0s'],
  ['CLS', '画面意外跳动的程度', '≤0.1', '≤0.25', '>0.25'],
  ['INP', '交互到下次绘制的响应', '≤200ms', '≤500ms', '>500ms'],
];
for (const [name, what, good, ok, bad] of metrics) {
  console.log(name.padEnd(6) + what.padEnd(28) + good.padEnd(10) + ok.padEnd(10) + bad);
}
console.log('');
console.log('  其中 LCP、CLS、INP 三个是【Core Web Vitals】（核心指标），');
console.log('  TTFB 和 FCP 是辅助诊断指标 —— 它们本身不是目标，但能解释核心指标为什么差。');
console.log('');
console.log('  换个角度理解这五个指标，它们其实覆盖了三个不同阶段：');
console.log('    加载阶段：TTFB（服务端） → FCP（有反应了） → LCP（主要内容到了）');
console.log('    视觉稳定：CLS（画面别乱跳）');
console.log('    交互阶段：INP（点得动、跟得上）');
console.log('');
console.log('  【关键】这些指标都取【第 75 百分位（p75）】，不是平均值。');
console.log('    含义是"75% 的访问体验比这个值更好"。');
console.log('    为什么不取平均：少数极端慢的样本会把平均值拉偏，');
console.log('    而平均值很好、p75 很差，恰恰说明大量用户其实体验不佳。');

// ---------------------------------------------------------------------------
// 2. User Timing API
// ---------------------------------------------------------------------------

console.log('\n--- 2. User Timing API：自己给业务代码打点 ---');
console.log('');

console.log('  四个核心方法：');
console.log('    · performance.mark(name)                打一个时间戳标记');
console.log('    · performance.measure(name, start, end) 量两个标记之间的距离');
console.log('    · performance.getEntriesByType(type)    按类型取条目');
console.log('    · performance.getEntriesByName(name)    按名字取条目');
console.log('');

// 2.1 mark 与 measure 的基本用法
performance.mark('task-start');

// 模拟一段业务工作
let workAcc = 0;
for (let i = 0; i < 800_000; i++) workAcc = (workAcc + ((i % 256) * 3)) & 0xffffff;

performance.mark('task-end');

// 量出两个标记之间的距离。参数是"标记名"。
performance.measure('业务任务耗时', 'task-start', 'task-end');

const measures = performance.getEntriesByType('measure');
console.log('  实测：打了两个 mark，量出一个 measure');
console.log(`    performance.mark('task-start') 与 performance.mark('task-end') 之间`);
console.log(`    → measure "业务任务耗时" = ${ms(measures[0].duration)}`);
console.log(`    （校验值 ${workAcc}，确保计算真的发生了）`);
console.log('');
console.log('  measure 条目上的字段（这些是标准字段，浏览器里也一样）：');
console.log(`    name        = ${measures[0].name}    ← 你起的名字`);
console.log(`    entryType   = ${measures[0].entryType}`);
console.log(`    startTime   = ${ms(measures[0].startTime)}  ← 相对 navigationStart 的起点`);
console.log(`    duration    = ${ms(measures[0].duration)}  ← 这就是你要的耗时`);
console.log('');
console.log('  相对导航起点是什么概念：');
console.log('    startTime 不是"绝对时间"，而是相对页面导航开始那一刻的毫秒数。');
console.log('    所以同一个页面里的所有条目【可以直接相减】比较先后，');
console.log('    这一点在拼接时间线、算"从加载到某个业务动作"的距离时非常有用。');

// 2.2 按名字取条目
const byName = performance.getEntriesByName('业务任务耗时');
console.log('');
console.log('  getEntriesByName("业务任务耗时") 取到', byName.length, '条');
console.log('  getEntriesByType("measure") 取到', measures.length, '条');
console.log('  两者的取舍：');
console.log('    · 只想看某一个具体指标 → 用 byName；');
console.log('    · 想汇总某一大类的全部数据 → 用 byType。');

// 再打几个 mark，展示"一次操作会被分成多个阶段"
performance.mark('phase-a-start');
for (let i = 0; i < 200_000; i++) workAcc = (workAcc + ((i % 256) * 3)) & 0xffffff;
performance.mark('phase-a-end');
performance.mark('phase-b-start');
for (let i = 0; i < 400_000; i++) workAcc = (workAcc + ((i % 256) * 3)) & 0xffffff;
performance.mark('phase-b-end');

performance.measure('阶段A', 'phase-a-start', 'phase-a-end');
performance.measure('阶段B', 'phase-b-start', 'phase-b-end');

console.log('');
console.log('  把一次操作拆成多个阶段来打点（这是真实项目最常见的用法）：');
const phases = performance.getEntriesByType('measure').filter((e) => e.name.startsWith('阶段'));
let sum = 0;
for (const p of phases) {
  sum += p.duration;
  console.log(`    ${p.name} = ${ms(p.duration)}`);
}
console.log(`    两阶段合计 = ${ms(sum)}`);
console.log('');
console.log('  为什么要分阶段：');
console.log('    只知道"总共花了 100ms"没法优化 —— 你必须知道是哪一段慢。');
console.log('    分阶段打点之后，慢的那一段会自己跳出来。');
console.log('    DevTools 的 Performance 面板会把这些 mark/measure 直接标在时间轴上。');

// 2.3 清理
console.log('');
console.log('  清理（长时间运行的服务必须做）：');
console.log(`    清理前：mark ${performance.getEntriesByType('mark').length} 条，measure ${performance.getEntriesByType('measure').length} 条`);
performance.clearMarks();
performance.clearMeasures();
console.log(`    清理后：mark ${performance.getEntriesByType('mark').length} 条，measure ${performance.getEntriesByType('measure').length} 条`);
console.log('    ⚠ 不清理会怎样：performance 的条目缓冲区会一直增长，');
console.log('      在高频调用的代码里打点会导致内存缓慢上涨（见陷阱七）。');
console.log('      注意 clearMeasures() 也会清掉条目本身，所以要先把数据上报出去再清。');

// ---------------------------------------------------------------------------
// 3. PerformanceObserver 在 Node 里的真机演示
// ---------------------------------------------------------------------------

console.log('\n--- 3. PerformanceObserver：订阅性能条目 ---');
console.log('');
console.log('  为什么需要观察者：');
console.log('    性能条目是【异步产生】的。用 getEntries() 轮询既浪费 CPU 又会漏。');
console.log('    PerformanceObserver 是"有了就通知我"的推送模型，这是标准做法。');
console.log('');

// 3.1 观察 'measure'
const measureEntries = [];
const measureObserver = new PerformanceObserver((list) => {
  // list.getEntries() 拿到的是【本轮新增】的条目
  for (const entry of list.getEntries()) {
    measureEntries.push(entry);
  }
});
measureObserver.observe({ type: 'measure', buffered: true });

// 3.2 观察 'function' —— 这是 Node 特有的强大能力
//
// performance.timerify(fn) 会把一个函数包起来：
// 每次调用都会产生一条 'function' 类型的条目，记录这次调用的耗时。
// 这相当于"零侵入地给函数自动打点"，非常适合排查热点函数。
const timedFn = performance.timerify(function parseAndValidate(n) {
  let acc = 0;
  for (let i = 0; i < n; i++) acc = (acc + ((i % 256) * 3)) & 0xffffff;
  return acc;
});

const functionEntries = [];
const functionObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    functionEntries.push(entry);
  }
});
functionObserver.observe({ type: 'function', buffered: true });

console.log('  已注册两个观察者：一个观察 measure，一个观察 function（timerify）。');
console.log('');

// 现在产生一些条目
performance.mark('obs-start');
performance.mark('obs-end');
performance.measure('观察者测试1', 'obs-start', 'obs-end');

performance.mark('obs2-start');
for (let i = 0; i < 300_000; i++) workAcc = (workAcc + ((i % 256) * 3)) & 0xffffff;
performance.mark('obs2-end');
performance.measure('观察者测试2', 'obs2-start', 'obs2-end');

// 调用被 timerify 包装过的函数若干次
const timedResults = [];
for (let i = 0; i < 5; i++) {
  timedResults.push(timedFn(150_000));
}

// 关键：观察者的回调是【异步】的，必须让出一次事件循环才能收到条目
await tick(20);

console.log('  3.1 观察 measure 的结果：');
console.log(`    收到了 ${measureEntries.length} 条 measure 条目：`);
for (const e of measureEntries) {
  console.log(`      · ${e.name.padEnd(16)} duration = ${ms(e.duration)}`);
}
console.log('');
console.log('  3.2 观察 function（timerify）的结果：');
console.log(`    调用被包装的函数 5 次，收到了 ${functionEntries.length} 条 function 条目：`);
functionEntries.forEach((e, i) => {
  // 'function' 条目上还有几个额外字段
  console.log(
    `      · 第 ${i + 1} 次调用  duration = ${ms(e.duration).padEnd(14)}` +
      `detail = ${JSON.stringify(e.detail ?? null)}`,
  );
});
console.log(`    （返回值 ${timedResults.join(', ')}，确认函数确实执行了）`);
console.log('');
console.log('  timerify 的价值：');
console.log('    · 完全不用改函数体，包一层就自动记录每次调用的耗时；');
console.log('    · 适合临时排查"到底哪个函数是热点"，排查完把包装去掉即可；');
console.log('    · 但它本身有开销（每次调用都要产生一条条目），');
console.log('      绝对不要长期留在生产代码的热点路径上。');

// 断开观察者 —— 这也是必须养成的习惯
measureObserver.disconnect();
functionObserver.disconnect();
console.log('');
console.log('  用完记得 disconnect()，否则观察者会一直持有引用并持续回调。');

// ---------------------------------------------------------------------------
// 4. 实测：Node 接受浏览器专属类型，但永远不会触发
// ---------------------------------------------------------------------------

console.log('\n--- 4. 实测一个坑：observe() 不报错 ≠ 指标可用 ---');
console.log('');

const browserOnlyTypes = [
  'largest-contentful-paint',
  'layout-shift',
  'longtask',
  'paint',
  'navigation',
  'event',
];

console.log('  逐个尝试注册这些【浏览器专属】的 entry 类型：');
console.log('');
console.log('  entry 类型'.padEnd(32) + 'observe() 是否报错'.padEnd(22) + '实际收到条目数');
console.log('  ' + '-'.repeat(78));

for (const type of browserOnlyTypes) {
  let threw = null;
  const got = [];
  let observer = null;
  try {
    observer = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) got.push(e);
    });
    observer.observe({ type, buffered: true });
  } catch (err) {
    threw = err;
  }
  if (observer) observer.disconnect();
  console.log(
    type.padEnd(30) +
      (threw ? `报错：${threw.message}`.padEnd(22) : '没有报错'.padEnd(22)) +
      `${got.length} 条`,
  );
}
console.log('');
console.log(`  ⚠ 这些类型在 Node 里【没有抛出任何异常】，但也【不会有任何条目】。`);
console.log('');
console.log('  为什么这一点极其重要：');
console.log('    在浏览器项目里，如果只靠 try/catch 来判断"这个指标能不能采集"，');
console.log('    你会得到"一切正常"的假象，而监控面板上的 LCP / CLS / INP');
console.log('    永远是空的 —— 这种静默失效可能在线上存在几个月都没人发现。');
console.log('');
console.log('  正确的特性检测方式：');
console.log('');
console.log('      // 方式一：检查 API 是否存在');
console.log('      if (typeof PerformanceObserver === "undefined") return;');
console.log('');
console.log('      // 方式二（更可靠）：检查这个 entry 类型是否被支持');
console.log('      const supported = performance.supportedEntryTypes ?? [];');
console.log('      if (!supported.includes("largest-contentful-paint")) return;');
console.log('');
console.log('      // 方式三：注册后设一个兜底计时器，超时没数据就上报"不可用"');
console.log('');
const supportedInNode = performance.supportedEntryTypes;
console.log(`  实测：Node 里 performance.supportedEntryTypes = ${supportedInNode === undefined ? 'undefined（不存在）' : JSON.stringify(supportedInNode)}`);
console.log('    浏览器里它是一个字符串数组，可以直接 includes() 判断 ——');
console.log('    这就是最可靠的方式二。Node 里没有这个属性，所以要可选链兜底。');

// ---------------------------------------------------------------------------
// 5. 附带：观察 GC 条目（Node 特有，可与 12 号示例对照）
// ---------------------------------------------------------------------------

console.log('\n--- 5. 附带能力：在 Node 里观察 GC 条目 ---');
console.log('');
console.log('  Node 的 PerformanceObserver 还能观察 \'gc\' 类型的条目，');
console.log('  每一次垃圾回收都会产生一条记录 —— 这可以和 12_gc_internals.js');
console.log('  讲的分代回收对照着看（能看到新生代/老生代的回收次数与耗时）。');
console.log('');

const gcEntries = [];
const gcObserver = new PerformanceObserver((list) => {
  for (const e of list.getEntries()) gcEntries.push(e);
});
gcObserver.observe({ type: 'gc', buffered: true });

// 制造一些垃圾，给 GC 一点事情做
let churn = [];
for (let round = 0; round < 6; round++) {
  for (let i = 0; i < 40_000; i++) {
    churn.push({ round, i, text: `payload-${round}-${i}` });
  }
  churn = null; // 断开引用，全部变成垃圾
  churn = [];
}
await tick(30);

gcObserver.disconnect();

console.log(`  本段代码执行期间，观察到了 ${gcEntries.length} 条 gc 条目。`);
if (gcEntries.length > 0) {
  // ⚠ 这里有个小坑：entry.detail.kind 在 Node 里是一个【数字枚举】，不是字符串。
  //   直接拿去 padEnd 会抛 "kind.padEnd is not a function"。
  //   所以要自己建一张映射表，把数字翻译成人看得懂的名字。
  //   这些常量来自 node:perf_hooks 的 constants（NODE_PERFORMANCE_GC_*）。
  const GC_KIND_NAMES = {
    1: 'Minor（新生代 Scavenge）',
    2: 'Major（老生代标记清除）',
    4: 'Major（老生代标记清除）',
    8: 'Incremental（增量标记）',
    16: 'WeakCallbacks（弱引用回调）',
  };

  const byKind = new Map();
  let totalDuration = 0;
  for (const e of gcEntries) {
    const rawKind = e.detail?.kind;
    const kind = GC_KIND_NAMES[rawKind] ?? `其它（kind=${String(rawKind)}）`;
    byKind.set(kind, (byKind.get(kind) ?? 0) + 1);
    totalDuration += e.duration;
  }

  console.log(`  （原始 detail.kind 示例：${gcEntries.map((e) => String(e.detail?.kind)).join(', ')}）`);
  console.log('  ↑ 注意它们是数字，不是字符串 —— 用之前必须自己映射。');
  console.log('');
  console.log('  按回收类型统计：');
  for (const [kind, count] of byKind) {
    console.log(`    · ${kind.padEnd(28)} ${count} 次`);
  }
  console.log('');
  console.log(`  GC 总耗时 = ${ms(totalDuration)}，单次最长 = ${ms(Math.max(...gcEntries.map((e) => e.duration)))}`);
  console.log('');
  console.log('  怎么读这个结果：');
  console.log('    · Scavenge 是新生代回收（快、频繁），MarkSweep/MarkCompact 是老生代（慢、少见）；');
  console.log('    · "单次最长"这个数字比总耗时更值得关注 —— 它就是用户会感知到的卡顿来源；');
  console.log('    · 这与 14 号示例讲的"最长阻塞决定体感"是同一个道理。');
} else {
  console.log('  （本次没有观察到 GC —— 触发时机由 V8 的启发式决定，因环境而异，属正常现象。）');
}
console.log('');
console.log('  ⚠ 观察到的次数与耗时【因环境与运行状态而异】，两次运行不会相同。');
console.log('    这里演示的是"能观察到 GC"这个能力，不是一个可比的基准数字。');

// ---------------------------------------------------------------------------
// 6. 浏览器端的观察者写法（Node 里无法执行）
// ---------------------------------------------------------------------------

console.log('\n--- 6. 浏览器端的观察者写法（本示例只打印，不执行）---');
console.log('');
console.log('  ⚠ 以下代码依赖渲染，在 Node 里无法运行，仅作参照。');
console.log('');

const browserSnippets = [
  {
    title: 'LCP（最大内容绘制）',
    code: [
      "new PerformanceObserver((list) => {",
      "  const entries = list.getEntries();",
      "  const last = entries[entries.length - 1];   // LCP 会持续更新，取最后一条",
      "  report('LCP', last.startTime, { element: last.element?.tagName });",
      "}).observe({ type: 'largest-contentful-paint', buffered: true });",
      "// 注意：LCP 在用户首次交互后就停止更新，所以要在那之前完成采集。",
    ],
  },
  {
    title: 'CLS（累积布局偏移）',
    code: [
      "let clsValue = 0;",
      "new PerformanceObserver((list) => {",
      "  for (const entry of list.getEntries()) {",
      "    // 只统计【没有最近用户输入】的偏移 —— 这部分才是意外偏移",
      "    if (!entry.hadRecentInput) clsValue += entry.value;",
      "  }",
      "  report('CLS', clsValue);",
      "}).observe({ type: 'layout-shift', buffered: true });",
    ],
  },
  {
    title: 'INP（交互到下次绘制）',
    code: [
      "// INP 没有现成的 entry 类型，常用做法是观察 event 条目并",
      "// 计算「交互时间 → 下一次绘制」的间隔（web-vitals 库内部就是这么做的）",
      "new PerformanceObserver((list) => {",
      "  for (const entry of list.getEntries()) {",
      "    // entry.duration 近似为「处理耗时 + 呈现延迟」",
      "    // 再加上 entry.processingStart - entry.startTime（输入延迟）",
      "    const inp = entry.duration;",
      "    trackWorstInteraction(entry.name, inp);",
      "  }",
      "}).observe({ type: 'event', buffered: true, durationThreshold: 40 });",
      "// 最后上报所有交互中的【最差那次】（INP 取的是高百分位，不是平均）",
    ],
  },
  {
    title: '长任务（longtask）—— 定位 INP 问题的第一手材料',
    code: [
      "new PerformanceObserver((list) => {",
      "  for (const entry of list.getEntries()) {",
      "    if (entry.duration > 50) {",
      "      // entry.attribution 里通常能看出是哪个脚本/框架引起的",
      "      report('LongTask', entry.duration, entry.attribution);",
      "    }",
      "  }",
      "}).observe({ type: 'longtask', buffered: true });",
    ],
  },
  {
    title: 'FCP / TTFB（用 paint 与 navigation 条目）',
    code: [
      "// FCP：从 paint 条目里挑出 first-contentful-paint",
      "new PerformanceObserver((list) => {",
      "  for (const entry of list.getEntries()) {",
      "    if (entry.name === 'first-contentful-paint') report('FCP', entry.startTime);",
      "  }",
      "}).observe({ type: 'paint', buffered: true });",
      "",
      "// TTFB：从 navigation 条目算 responseStart - requestStart",
      "const nav = performance.getEntriesByType('navigation')[0];",
      "if (nav) report('TTFB', nav.responseStart - nav.requestStart);",
    ],
  },
];

for (const snippet of browserSnippets) {
  console.log(`  ◆ ${snippet.title}`);
  for (const line of snippet.code) console.log(`      ${line}`);
  console.log('');
}

console.log('  观察这几段代码的共同点：');
console.log('    · 都是 observe({ type, buffered: true }) 的形式；');
console.log('    · 都是在回调里【累加或取极值】，而不是当场就上报（指标会持续更新）；');
console.log('    · 都必须在页面卸载前把最终值发出去。');

// ---------------------------------------------------------------------------
// 7. 真实项目怎么采集与上报
// ---------------------------------------------------------------------------

console.log('\n--- 7. 真实项目怎么采集与上报 ---');
console.log('');
console.log('  7.1 采集时机：三个必须踩准的点');
console.log('    · 【尽早注册】必须带 buffered: true，否则会漏掉页面早期的指标；');
console.log('    · 【持续更新】LCP 会随着更大的元素出现而更新，CLS 会累加，');
console.log('      所以要在回调里持续记录，不能取第一条就上报；');
console.log('    · 【卸载前发出】页面关闭/切到后台时才是"最终值"，');
console.log('      但这时发请求很容易被浏览器取消 —— 见下面 7.3。');
console.log('');
console.log('  7.2 p75 与分位数');
console.log('    · 上报的是【每次访问的原始值】，服务端再算 p75；');
console.log('    · 千万不要在客户端算平均后上报 —— 那样会丢失分布信息，');
console.log('      也无法再按页面、设备、地区切分着看；');
console.log('    · 常见的分层维度：页面路径、设备类型、网络类型、地区、版本号。');
console.log('      同一个指标在不同分层下可能差好几倍，"整体 p75 达标"是没意义的。');
console.log('');
console.log('  7.3 卸载时上报的正确姿势');
console.log('');
console.log('      // ✓ 推荐：sendBeacon —— 浏览器保证会发出去，不阻塞卸载');
console.log("      navigator.sendBeacon('/collect', JSON.stringify(payload));");
console.log('');
console.log('      // ✓ 备选：fetch + keepalive —— 页面关了请求还会继续');
console.log("      fetch('/collect', { method: 'POST', body: data, keepalive: true });");
console.log('');
console.log('      // ✗ 错误：普通 fetch —— 页面卸载时请求会被直接取消');
console.log("      fetch('/collect', { method: 'POST', body: data });");
console.log('');
console.log('      // ✗ 错误：同步 XHR —— 会阻塞卸载，用户感觉页面"关不掉"');
console.log('');
console.log('  7.4 实验室数据 vs 真实用户数据（RUM）');
console.log('');
console.log('  维度'.padEnd(22) + '实验室（Lighthouse / CI）'.padEnd(34) + '真实用户（RUM）');
console.log('  ' + '-'.repeat(90));
console.log('  数据来源'.padEnd(20) + '受控环境下的单次测量'.padEnd(32) + '真实用户真实设备的采样');
console.log('  优点'.padEnd(22) + '可复现、能定位、能进 CI 卡门禁'.padEnd(26) + '反映真实体验、可分维度下钻');
console.log('  缺点'.padEnd(22) + '不代表真实设备与网络'.padEnd(28) + '只有数字，定位原因较难');
console.log('  怎么用'.padEnd(22) + '定位问题、防止回归'.padEnd(30) + '衡量影响面、决定优化优先级');
console.log('');
console.log('  正确做法是【两者结合】：');
console.log('    先用 RUM 发现"哪个页面、哪类用户的哪个指标差"，');
console.log('    再用 Lighthouse / DevTools 在本地复现并定位到具体原因。');
console.log('');
console.log('  7.5 现成的采集库');
console.log('    · web-vitals（Google 官方）—— 直接用，它帮你处理了');
console.log('      各浏览器的差异、指标更新、以及卸载时上报这些琐事；');
console.log('    · 理解了本示例这些原理之后，用起来就知道每一步在做什么，');
console.log('      也更容易排查"为什么线上收不到数据"。');

// ---------------------------------------------------------------------------
// 8. 速查清单
// ---------------------------------------------------------------------------

console.log('\n--- 8. 速查清单 ---');
console.log('');
console.log('  指标差 → 先查什么'.padEnd(40) + '');
console.log('  ' + '-'.repeat(84));
const diagnosis = [
  ['TTFB 差', '服务端处理慢、数据库查询慢、没上 CDN、重定向太多'],
  ['FCP 差', '阻塞渲染的 CSS/JS、字体加载阻塞、HTML 太大'],
  ['LCP 差', 'LCP 图片没优先加载、图片格式太大、服务端渲染缺失、TTFB 本身就慢'],
  ['CLS 差', '图片没写尺寸、动态内容插到了上方、字体切换导致重排、广告位没预留空间'],
  ['INP 差', '长任务阻塞主线程、事件回调太重、第三方脚本抢占主线程'],
];
for (const [symptom, cause] of diagnosis) {
  console.log(symptom.padEnd(12) + cause);
}
console.log('');
console.log('  API 速查：');
console.log('    performance.mark(name)                     打标记');
console.log('    performance.measure(name, start, end)      量距离');
console.log('    performance.getEntriesByType(type)         按类型取条目');
console.log('    performance.getEntriesByName(name)         按名字取条目');
console.log('    performance.clearMarks() / clearMeasures() 清理');
console.log('    performance.timerify(fn)                   Node：自动给函数打点');
console.log('    new PerformanceObserver(cb).observe({type, buffered:true})  订阅条目');
console.log('    performance.supportedEntryTypes            浏览器：判断类型是否支持');
console.log('');
console.log('  最重要的五条：');
console.log('    1. 指标取 p75，不取平均值；');
console.log('    2. observe() 一定要带 { buffered: true }；');
console.log('    3. observe() 不报错 ≠ 指标可用，必须做特性检测；');
console.log('    4. 卸载时上报必须用 sendBeacon 或 keepalive；');
console.log('    5. RUM 找问题，实验室定位原因，两者缺一不可。');
console.log('');
console.log(`  本示例实际观察到的能力边界（Node v${process.versions.node}）：`);
console.log('    ✓ 可用：mark / measure / function(timerify) / gc');
console.log('    ✗ 不可用（浏览器专有，依赖渲染）：FCP / LCP / CLS / INP / longtask');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
