/**
 * ============================================================================
 * 知识点：DOM 性能（批量插入的代价：字符串拼接 / 数组 join / DocumentFragment）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】高级
 * 【前置知识】27_web_apis/01_dom_query.js、08_arrays（数组方法）
 *
 * 【也见】31_performance_and_memory/07_batch_dom_updates.js —— 同一主题在「性能与内存」章节里也完整讲了一遍。
 *        本文件是浏览器真 API 的主场（DocumentFragment / innerHTML / 布局抖动）；
 *        那篇在 Node 里自建模拟重排引擎做同样思想的演示（批量缓冲、读写分离）。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "DOM 性能"指的是操作页面结构时的开销。它比普通 JS 计算贵得多，因为：
 *      a) DOM 对象是宿主对象（C++ 侧实现），每次访问都要跨语言边界；
 *      b) 修改 DOM 可能触发**重排（reflow/layout）**：浏览器要重新计算
 *         所有元素的几何位置；以及**重绘（repaint）**：重新画出像素。
 *    所以"一次性批量插入"和"循环里逐个插入"看起来结果一样，
 *    实际开销可能差几十倍。
 *
 * 2. 为什么需要
 *    一个列表渲染 1000 条数据，如果用错方法，页面会卡到用户能明显感觉到。
 *    理解这套代价模型，才知道为什么要用 DocumentFragment、为什么要"批量写、
 *    批量读"、为什么框架要有虚拟 DOM 做 diff。
 *
 * 3. 核心语法要点（浏览器部分）
 *    - 三种批量构建方式：
 *        A) 字符串 += 拼接 → container.innerHTML = html
 *           最快，但每次 += 都可能产生新字符串；而且 innerHTML 会重新解析 HTML、
 *           销毁并重建所有子节点（原有的事件监听器、输入框状态全丢）。
 *        B) 逐个 createElement + appendChild
 *           最慢：每次 appendChild 都可能触发一次重排。
 *        C) DocumentFragment
 *           document.createDocumentFragment() 造一个"游离的、不在页面上的"容器，
 *           在里面随便加节点（不触发重排），最后只 appendChild(fragment) 一次。
 *           兼顾"安全（可以逐个设置事件）"和"快（只重排一次）"。
 *    - 布局抖动（layout thrashing）：在一轮循环里交替"写 DOM"和"读几何属性"
 *      （offsetHeight / offsetTop / getBoundingClientRect / scrollTop），
 *      每次读都会强制浏览器立刻同步重排。正确做法是先集中写、再集中读。
 *    - 其它技巧：用 classList 批量改样式而不是逐条改 style；
 *      用 requestAnimationFrame 把视觉更新合并到一帧里；
 *      离屏的复杂计算做完再一次性挂到页面上。
 *
 * 4. 常见陷阱
 *    - 用 innerHTML += 在循环里追加：每次都把整个容器的 HTML 重新解析一遍，
 *      复杂度是 O(n²)，是前端最经典的性能事故。
 *    - 认为"重排只影响被修改的元素"：一个元素尺寸变化会引起祖先和兄弟节点的
 *      连锁布局，范围可能很大。
 *    - 在循环里读 offsetHeight 判断高度，写完再读、读完再写 —— 每次都强制重排。
 *    - 过早优化：小列表（几十条）怎么写在现代浏览器里都感觉不到差别，
 *      真正要关注的是成百上千条的场景。
 *
 * 【本文件在 Node 中如何演示】
 *    Node 没有 DOM、没有渲染引擎，所以：
 *      1) 用真实的微基准测试对比三种"批量构建"的纯 JS 成本
 *         （字符串 +=、数组 push+join、预分配 + map+join），这部分是真实测量；
 *      2) 用一个"布局引擎模型"精确统计重排次数：把每次 DOM 写标记为"脏"，
 *         把每次读几何属性记一次"强制同步布局"，从而量化"逐个插入"与
 *         "DocumentFragment 一次性插入"的差别；
 *      3) 用"节点创建/丢弃计数"说明 innerHTML 全量重建为什么会毁掉
 *         已有的事件监听器和输入状态。
 *    这些统计出来的次数差异，正是浏览器里性能差异的根源。
 *
 * 【运行方法】
 *   node 27_web_apis/09_dom_performance.js
 *
 * 【预期输出】
 *   三组实验的对比数据：字符串构建耗时、重排次数、节点创建/销毁次数，
 *   以及"布局抖动"与"批量读写"的强制重排次数对比。
 * ============================================================================
 */

import { performance } from 'node:perf_hooks';

// 让基准测试更稳定的小工具
const N = 20000; // 要构建的列表项数量

console.log('--- 0. 测试规模 ---');
console.log(`  本次演示要构建 ${N} 个列表项（<li> 行）`);
console.log('  （真实浏览器里 20000 个 li 用错方法会卡死几秒，这里用同样的规模做对比）');
console.log('');

// ===========================================================================
// 第 1 部分：三种"批量构建"方式的纯 JS 成本
// ===========================================================================

console.log('--- 1. 三种批量构建方式的耗时对比（真实测量） ---');

/** 生成第 i 条数据（模拟从接口拿到的列表） */
const makeItem = (i) => ({ id: i, title: '条目 ' + i, done: i % 3 === 0 });

const data = Array.from({ length: N }, (_, i) => makeItem(i));

/** 跑一次基准测试，返回耗时（毫秒） */
function bench(label, fn) {
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  const ms = t1 - t0;
  console.log(`  ${label.padEnd(34)} ${ms.toFixed(2).padStart(8)} ms   结果长度 = ${result.length.toLocaleString()}`);
  return ms;
}

// 方式 A：字符串循环拼接（+=）
// 每次 += 都可能分配一个新字符串并把旧内容复制过去。
// 现代引擎有"绳索字符串（rope）"优化，所以这里没到 O(n²)，但仍然是最慢的。
const tA = bench('A) html += 字符串拼接', () => {
  let html = '';
  for (let i = 0; i < data.length; i++) {
    html += '<li class="' + (data[i].done ? 'done' : '') + '">' + data[i].title + '</li>';
  }
  return html;
});

// 方式 B：字符串数组 + join
// 把每段小字符串存进数组，最后一次性 join —— 避免了中间的重复复制。
const tB = bench('B) 数组 push + join', () => {
  const parts = [];
  for (let i = 0; i < data.length; i++) {
    parts.push('<li class="' + (data[i].done ? 'done' : '') + '">' + data[i].title + '</li>');
  }
  return parts.join('');
});

// 方式 C：预分配数组 + map + join
// 预分配数组长度可以避免动态扩容；map 让引擎更容易做内联优化。
const tC = bench('C) 预分配数组 + map + join', () => {
  const parts = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    parts[i] = `<li class="${data[i].done ? 'done' : ''}">${data[i].title}</li>`; // 模板字符串更简洁
  }
  return parts.join('');
});

console.log('');
console.log('  相对倍数：');
const fastest = Math.min(tA, tB, tC);
console.log('    最快的是 ' + (fastest === tA ? 'A（+= 拼接）' : fastest === tB ? 'B（push + join）' : 'C（预分配 + map + join）'));
console.log('    A / B = ' + (tA / tB).toFixed(2) + '，B / C = ' + (tB / tC).toFixed(2) + '，A / C = ' + (tA / tC).toFixed(2));
console.log('');
console.log('  ★ 这里有一个反直觉的结论，值得记住：');
console.log('    三者耗时其实在同一个量级（多次运行会互有胜负，差异往往小于运行波动）。');
console.log('    因为现代 JS 引擎对字符串 += 做了"绳索字符串（rope / cons string）"优化：');
console.log('    += 只是挂了一个新节点，并不会把整条字符串复制一遍。');
console.log('    所以"数组 join 一定比 += 快"是十年前的经验，在今天要靠实测说话。');
console.log('    这也正是性能优化的第一原则：**先测量，再优化，别凭印象**。');
console.log('');

// 真正的反例：一种会退化成 O(n²) 的写法
// 每次都把"累积结果"重新 join 一遍 —— 工作量随已处理条数线性增长，总量是平方级。
{
  const N_SMALL = 4000; // 平方级写法太慢，所以缩小规模
  const small = Array.from({ length: N_SMALL }, (_, i) => makeItem(i));

  const tBad0 = performance.now();
  const parts = [];
  for (let i = 0; i < small.length; i++) {
    parts.push('<li>' + small[i].title + '</li>');
    const _unused = parts.join(''); // ← 多余的全量 join，让复杂度变成 O(n²)
  }
  const tBad1 = performance.now();

  // 对照：同样的规模，正常的 push + join
  const tGood0 = performance.now();
  const parts2 = [];
  for (let i = 0; i < small.length; i++) {
    parts2.push('<li>' + small[i].title + '</li>');
  }
  const _html = parts2.join('');
  const tGood1 = performance.now();

  console.log(`  真正的反例（只处理 ${N_SMALL} 条，是上面规模的 1/${N / N_SMALL}）：`);
  console.log(`    每轮都重新 join 一遍（O(n²)）：${(tBad1 - tBad0).toFixed(2)} ms`);
  console.log(`    正常的 push + 最后 join 一次：${(tGood1 - tGood0).toFixed(2)} ms`);
  console.log(`    → 慢了约 ${((tBad1 - tBad0) / (tGood1 - tGood0)).toFixed(1)} 倍，而数据量只有 1/${N / N_SMALL}。`);
  console.log('    这就是"渐进复杂度"的威力：真正的性能事故来自 O(n²)，而不是那些常数级差异。');
}
console.log('');

// ===========================================================================
// 第 2 部分：模拟浏览器的布局引擎，量化"重排"次数
// ===========================================================================

console.log('--- 2. 模拟布局引擎：数一数每种插入方式触发了多少次重排 ---');

/**
 * 一个极简的"布局引擎"模型。
 *
 * 浏览器里真实发生的事情：
 *   - 你修改 DOM（写）之后，浏览器把布局标记为"脏"，但不会马上重排，
 *     它想攒一批修改一起算（这就是"渲染是异步的"）。
 *   - 但是！只要你**读取**需要精确几何信息的属性
 *     （offsetHeight / offsetWidth / getBoundingClientRect / scrollTop ...），
 *     浏览器就必须立刻把积攒的修改全部算完，才能给你正确值 —— 这叫
 *     "强制同步布局（forced synchronous layout）"，也就是布局抖动。
 *   - 如果你只写不读，浏览器会把它合并成一次重排（在下一帧渲染之前）。
 */
class LayoutModel {
  constructor() {
    this.dirty = false; // 是否有"待处理"的 DOM 修改
    this.layoutCount = 0; // 真正执行重排的次数
  }

  /** 修改 DOM（appendChild / 改样式 / 改文本……都算） */
  write() {
    this.dirty = true;
  }

  /** 读取几何属性（offsetHeight 等），可能触发强制同步布局 */
  read() {
    if (this.dirty) {
      this.layoutCount += 1; // 攒的账必须立刻结清
      this.dirty = false;
    }
    return 100;
  }

  /** 浏览器在渲染帧开始时统一结算 */
  flushFrame() {
    if (this.dirty) {
      this.layoutCount += 1;
      this.dirty = false;
    }
  }
}

const M = 5000; // 插入 5000 个节点

// 方式 1：循环里逐个 appendChild，中间不读任何属性
{
  const layout = new LayoutModel();
  for (let i = 0; i < M; i++) {
    layout.write(); // 每次 appendChild
  }
  layout.flushFrame(); // 浏览器在帧末统一结算
  console.log(`  方式 1（逐个 appendChild，只写不读）：重排 ${layout.layoutCount} 次`);
  console.log('    浏览器把 5000 次写合并成了 1 次重排 —— 现代引擎已经相当聪明。');
}

// 方式 2：循环里 appendChild 之后立刻读一次 offsetHeight（经典错误）
{
  const layout = new LayoutModel();
  for (let i = 0; i < M; i++) {
    layout.write();
    layout.read(); // 每次都强制同步布局！
  }
  layout.flushFrame();
  console.log(`  方式 2（逐个 appendChild + 读 offsetHeight）：重排 ${layout.layoutCount} 次 ← 布局抖动`);
  console.log('    这就是"布局抖动"：读写交替让浏览器的合并优化完全失效。');
}

// 方式 3：DocumentFragment，只 appendChild 一次
{
  const layout = new LayoutModel();
  const fragmentWrites = M; // 在 fragment 内部加节点：不在文档里，不会触发重排
  // 真实的 DocumentFragment 是"游离"的，往它里面加节点不会让页面变脏
  layout.write(); // 最后唯一一次真正影响页面的操作：container.appendChild(fragment)
  layout.flushFrame();
  console.log(`  方式 3（DocumentFragment 一次性插入）：重排 ${layout.layoutCount} 次`);
  console.log(`    在 fragment 内部做的 ${fragmentWrites} 次添加完全不触发重排，因为 fragment 不在文档树上。`);
}

// 方式 4：innerHTML 整体赋值
{
  const layout = new LayoutModel();
  layout.write(); // 一次赋值
  layout.flushFrame();
  console.log(`  方式 4（container.innerHTML = html）：重排 ${layout.layoutCount} 次`);
  console.log('    重排次数也是最少的，但下面会看到它的隐藏代价。');
}
console.log('');

// ===========================================================================
// 第 3 部分：innerHTML 的隐藏代价
// ===========================================================================

console.log('--- 3. innerHTML 的隐藏代价：已有的节点会被全部销毁重建 ---');

/** 模拟一个 DOM 节点的生命周期统计 */
class NodeStats {
  constructor() {
    this.created = 0;
    this.destroyed = 0;
    this.listenersLost = 0;
  }
}

// 场景：页面上已经有一个 1000 项的列表，每项都绑了点击事件；
// 现在要追加 1 项。
const existing = 1000;

console.log(`  场景：列表已有 ${existing} 项（每项都绑了 click 监听器），现在要追加 1 项。`);

// 做法 X：container.innerHTML += '<li>新项</li>'
{
  const stats = new NodeStats();
  const t0 = performance.now();
  // innerHTML += 的真实语义是：读出整个容器当前的 HTML 字符串 → 拼接 → 重新赋值。
  // 重新赋值会让浏览器把原有节点**全部销毁**，再按新的 HTML 重新创建一遍。
  stats.destroyed += existing; // 旧的 1000 个节点被销毁
  stats.created += existing + 1; // 重新创建 1001 个节点
  stats.listenersLost += existing; // 之前绑在旧节点上的监听器全部丢失
  const t1 = performance.now();
  console.log('  做法 X：innerHTML += 追加 1 项');
  console.log(`    销毁节点 ${stats.destroyed} 个，创建节点 ${stats.created} 个，丢失监听器 ${stats.listenersLost} 个`);
  console.log(`    另外还要序列化 ${existing} 个节点的 HTML 字符串。耗时约 ${(t1 - t0).toFixed(3)} ms（这里只统计了模拟开销）`);
}

// 做法 Y：createElement + appendChild 一项
{
  const stats = new NodeStats();
  stats.created += 1; // 只创建 1 个节点
  console.log('  做法 Y：createElement + appendChild 追加 1 项');
  console.log(`    销毁节点 ${stats.destroyed} 个，创建节点 ${stats.created} 个，丢失监听器 ${stats.listenersLost} 个`);
  console.log('    原有节点的状态（输入框里的内容、滚动位置、监听器）全部保留。');
}

// 做法 Z：DocumentFragment 批量追加 100 项
{
  const stats = new NodeStats();
  stats.created += 100;
  console.log('  做法 Z：DocumentFragment 批量追加 100 项');
  console.log(`    销毁节点 0 个，创建节点 ${stats.created} 个，丢失监听器 0 个，重排 1 次。`);
}
console.log('');
console.log('  结论：innerHTML 快是快，但它是"全量替换"语义。');
console.log('        只有在"整块内容都要换掉"时才用它；要"追加/局部更新"就用 DOM API 或 fragment。');
console.log('        这也是 React / Vue 这些框架的核心动机之一：');
console.log('        它们用虚拟 DOM 做 diff，只更新真正变化的那几个节点。');
console.log('');

// ===========================================================================
// 第 4 部分：布局抖动（layout thrashing）
// ===========================================================================

console.log('--- 4. 布局抖动：读写交替 vs 批量写 + 批量读 ---');

const K = 2000;

// 反例：写一次读一次
{
  const layout = new LayoutModel();
  const t0 = performance.now();
  for (let i = 0; i < K; i++) {
    layout.write(); // element.style.height = ...
    layout.read(); // element.offsetHeight  ← 强制同步布局
  }
  layout.flushFrame();
  console.log(`  反例（写→读→写→读，共 ${K} 轮）：强制重排 ${layout.layoutCount} 次 ← 每一次都是一次真正的布局计算`);
}

// 正例：先全部写，再全部读
{
  const layout = new LayoutModel();
  for (let i = 0; i < K; i++) layout.write(); // 先集中写
  const heights = [];
  for (let i = 0; i < K; i++) heights.push(layout.read()); // 再集中读（只强制重排 1 次）
  layout.flushFrame();
  console.log(`  正例（先全部写 ${K} 次，再全部读 ${K} 次）：强制重排 ${layout.layoutCount} 次`);
  console.log(`    读到的值完全一样，但重排次数从 ${K} 降到了 ${layout.layoutCount}——在浏览器里就是几千倍的布局开销差距。`);
}
console.log('');
console.log('  浏览器里需要"强制同步布局"的常见属性：');
console.log('    offsetTop / offsetLeft / offsetWidth / offsetHeight');
console.log('    scrollTop / scrollLeft / scrollWidth / scrollHeight');
console.log('    clientTop / clientWidth / clientHeight');
console.log('    getComputedStyle() / getBoundingClientRect() / offsetParent');
console.log('  规则很简单：**同一轮里，先做完所有写，再开始读**。');
console.log('');

// ===========================================================================
// 第 5 部分：一帧的预算是多少
// ===========================================================================

console.log('--- 5. 每一帧的时间预算 ---');
console.log('  显示器 60Hz → 每帧 16.67ms');
console.log('  浏览器渲染一帧的流程（俗称像素管道）：');
console.log('    JavaScript → 样式计算 → 布局(Layout) → 绘制(Paint) → 合成(Composite)');
console.log('  留给 JS 的时间通常只有 10ms 左右，剩下的是布局与绘制的开销。');
console.log('  所以：');
console.log('    - 一次操作耗时 1ms 就已经不算便宜了（占掉了 10% 的帧预算）；');
console.log('    - 触发重排的操作比纯计算贵几个数量级；');
console.log('    - 用 requestAnimationFrame 把视觉更新合并到一帧里，避免一帧内多次重排。');
console.log('');

console.log('--- 6. 实用清单 ---');
console.log('  1) 批量插入用 DocumentFragment，或先把整块 HTML 拼好再一次 innerHTML 赋值。');
console.log('  2) 绝对不要在循环里写 innerHTML += 。');
console.log('  3) 读写分离：先集中改 DOM，再集中读几何属性。');
console.log('  4) 改多个样式用 classList 一次性切换，而不是逐条改 style.xxx。');
console.log('  5) 动画只改 transform 和 opacity（这两者可以只走"合成"，跳过布局和绘制）。');
console.log('  6) 复杂计算放到离屏节点或 Web Worker 里，算完再挂到页面上。');
console.log('  7) 先测量再优化：用 performance.now() 或 DevTools 的 Performance 面板定位瓶颈。');
console.log('');

console.log('程序结束。本文件里的耗时数字是真实测量的，重排次数是按浏览器规则统计的。');
