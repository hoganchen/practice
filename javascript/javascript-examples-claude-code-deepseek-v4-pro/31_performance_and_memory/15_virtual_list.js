/**
 * ============================================================================
 * 知识点：虚拟列表（窗口化渲染）—— 核心思路与完整算法实现
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/14_long_tasks_and_scheduling.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    虚拟列表（virtual list / windowing / 窗口化渲染）是"只渲染可视区域内的
 *    那一小段内容"的技术。它的核心洞察是：
 *      【用户一次只能看见十几到几十条，把几千条都渲染出来纯属浪费。】
 *    做法是：
 *      · 用一个占位元素撑起"整份列表应有的总高度"，让滚动条看起来是对的；
 *      · 只创建可视区 + 少量缓冲区的那些行；
 *      · 滚动时重新计算"现在该显示哪几条"，并【复用】已有的 DOM 节点，
 *        只改它们的内容和位置，而不是不停地创建/销毁节点。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 表格/日志/消息流一次加载 5000 条 → 页面卡死十几秒甚至崩溃；
 *    - 列表滚到后面越滚越卡（节点太多，样式计算与布局越来越慢）；
 *    - 移动端上几百条就开始掉帧；
 *    - 列表项很"重"（带图表、头像、复杂样式）时，问题会成倍放大。
 *    虚拟列表也是很多 UI 库内置的能力（React Virtualized / vue-virtual-scroller
 *    / TanStack Virtual 等），理解原理才能用好它们、调对参数。
 *
 * 3. 核心语法要点
 *
 *    (1) 为什么"直接全量渲染"会卡 —— 三个成本同时爆炸
 *        · 内存成本：每个真实 DOM 节点都是一个 C++ 对象 + 若干 JS 包装，
 *          实测经验值通常在【1KB 上下/节点】量级（含样式、布局信息）。
 *          10000 个节点就是几十 MB 的常驻内存，而且几乎全在可视区之外。
 *        · 布局/样式成本：浏览器要为每个节点计算样式、参与布局。
 *          插入 10000 个节点会触发一次极昂贵的重排（reflow），
 *          这就是 07_batch_dom_updates.js 里讲的"读写交错导致布局抖动"的极端版。
 *        · 绘制成本：即使不可见，浏览器也常常要为它们维护层与绘制状态。
 *        结论：成本大致与【总条数】成正比，而用户的收益只与【可视条数】有关 ——
 *        这个比例极其不划算。
 *
 *    (2) 虚拟列表的三个核心量
 *        · viewportHeight   可视区高度（滚动容器的高度）
 *        · scrollTop        当前滚动位置（已经滚上去多少像素）
 *        · rowHeight        单行高度（定高版本的最关键前提）
 *        由它们可以直接算出：
 *          startIndex = floor(scrollTop / rowHeight) - overscan
 *          visibleCount = ceil(viewportHeight / rowHeight)
 *          endIndex = startIndex + visibleCount + 2 * overscan
 *          offsetY = startIndex * rowHeight   ← 这一批节点要"往下挪"多少像素
 *          totalHeight = totalCount * rowHeight  ← 撑开滚动条的假高度
 *
 *    (3) 缓冲区（overscan / buffer）
 *        在可视区上下各多渲染几行。为什么必须有：
 *          · 滚动事件是异步的、有节流，等事件到达再渲染会来不及 → 白屏；
 *          · 快速滚动（尤其是触控板/惯性滚动）时，如果不预渲染就会出现空白；
 *          · overscan 太小 → 滚动时闪白；太大 → 白渲染更多节点，失去意义。
 *        经验值：上下各 3~10 行，或相当于半个可视区的高度。
 *
 *    (4) 节点复用（recycling）—— 虚拟列表的第二半价值
 *        只减少"首次渲染量"还不够：如果每次滚动都销毁旧节点、创建新节点，
 *        滚动过程中依然会持续产生 GC 压力和布局开销。
 *        正确做法是维护一个【固定大小的节点池】：
 *          滚动时只更新池中节点的内容与 transform 偏移，不增不减节点。
 *        这样滚动过程中的 DOM 操作量恒定，与总条数完全无关。
 *
 *    (5) 定高 vs 不定高
 *        · 定高：上面那些公式都是精确的，O(1) 就能算出来 —— 本示例实现的版本；
 *        · 不定高：需要先测量（或估算）每行高度并缓存，通常配合
 *          "估算高度 + 累计偏移表 + 滚动时校正"来做，复杂度高很多，
 *          而且滚动位置会有跳动，需要额外的锚定（scroll anchoring）处理。
 *        实践中优先争取"定高"或"有限几种高度"。
 *
 * 4. 常见陷阱
 *    - 陷阱一：忘了撑起总高度。不设置占位高度，滚动条就只有可视区那么长，
 *      用户根本滚不到后面 —— 这是最常见的实现失误。
 *    - 陷阱二：overscan 设成 0。滚动时必然出现白边闪烁。
 *    - 陷阱三：滚动事件里同步做重活。滚动事件触发极其频繁（一次滑动几十上百次），
 *      必须节流/用 requestAnimationFrame 合并（参见 02_throttle.js）。
 *    - 陷阱四：每次滚动都重建节点。只做了"少渲染"没做"复用"，
 *      滚动过程中的 GC 与布局开销依然可观。
 *    - 陷阱五：用绝对定位时忘了给容器 position: relative。
 *      行会相对最近的定位祖先定位，滚起来错位。
 *    - 陷阱六：定高假设被打破。行内有图片/长文本换行导致实际高度不一致，
 *      公式算出来的位置就全错了，表现为"越滚越偏"。
 *    - 陷阱七：忽略可访问性与键盘操作。虚拟化后 DOM 里只有十几行，
 *      Ctrl+F 搜不到、屏幕阅读器读不全、Tab 键跳不出去。
 *      真实项目需要额外补偿（提供搜索、aria 属性、focus 管理）。
 *    - 陷阱八：把虚拟列表用在小列表上。几十条数据时它带来的复杂度
 *      远大于收益，而且会引入上面这些坑。
 *
 * 【关于运行环境的重要说明】
 *    本示例运行在 Node.js 中，【没有 DOM】。
 *    因此本示例【只做算法与数据结构层面】的实现与验证：
 *      —— 输出"当前这一帧应该渲染哪几条记录、偏移多少像素"的计算结果，
 *         并用"虚拟节点对象"代替真实 DOM 节点来演示复用。
 *    所有涉及 document / element 的地方都只以注释形式给出，不会真的调用。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/15_virtual_list.js
 *
 * 【预期输出】
 *   8 个小节：大列表的三个成本、虚拟列表核心思路、
 *   computeVisibleRange 完整实现、模拟滚动查看渲染窗口、
 *   节点池复用演示、工作量对比、边界情况与陷阱、实践建议。
 *   全程不访问 DOM、不访问外网，一秒内跑完。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用工具
// ---------------------------------------------------------------------------

const fmtInt = (n) => n.toLocaleString('en-US');

/** 把数字限制在 [min, max] 区间内 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// ---------------------------------------------------------------------------
// 1. 为什么大列表直接渲染会卡
// ---------------------------------------------------------------------------

console.log('--- 1. 为什么"把 10000 条全渲染出来"会卡 ---');
console.log('');

const TOTAL_ROWS = 10_000; // 列表总条数
const ROW_HEIGHT = 32; // 每行高度（像素）
const VIEWPORT_HEIGHT = 640; // 可视区高度（像素）

const fullHeight = TOTAL_ROWS * ROW_HEIGHT;
const visibleRows = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT);

console.log(`  场景：一个 ${fmtInt(TOTAL_ROWS)} 条的列表，每行 ${ROW_HEIGHT}px，可视区 ${VIEWPORT_HEIGHT}px。`);
console.log(`    整份列表的理论总高度 = ${fmtInt(TOTAL_ROWS)} × ${ROW_HEIGHT}px = ${fmtInt(fullHeight)}px`);
console.log(`    用户一次真正能看见的 = ceil(${VIEWPORT_HEIGHT}/${ROW_HEIGHT}) = ${visibleRows} 行`);
console.log(`    可见比例 = ${((visibleRows / TOTAL_ROWS) * 100).toFixed(2)}%`);
console.log('');
console.log('  也就是说：全量渲染时，有 99.7% 以上的工作是用户当场看不见的。');
console.log('');
console.log('  这些工作换来的是三个同时爆炸的成本：');
console.log('');
console.log('  ①【内存成本】');
console.log('     每个真实 DOM 节点都不是"一个 JS 对象"那么简单：');
console.log('     它背后有 C++ 侧的节点对象、样式解析结果、布局盒模型数据。');
console.log('     行业经验值大致在【每个节点约 1KB 上下】的量级（因内容与样式而异）。');
console.log(`     ${fmtInt(TOTAL_ROWS)} 个节点 ≈ ${(TOTAL_ROWS / 1024).toFixed(1)} MB 起步的常驻内存，`);
console.log('     而且它们几乎全在可视区之外 —— 纯粹是浪费。');
console.log('     这还没算每个节点里的文本、图标、绑定的事件、闭包引用。');
console.log('');
console.log('  ②【布局/样式成本】—— 通常是最致命的那个');
console.log('     浏览器要为每个节点计算最终样式、参与布局计算。');
console.log(`     一次性插入 ${fmtInt(TOTAL_ROWS)} 个节点会触发一次极昂贵的重排（reflow）。`);
console.log('     这正是 07_batch_dom_updates.js 里讲的"布局抖动"的极端版本：');
console.log('     那里是"读写交错"导致多次重排，这里是"一次性量太大"导致单次重排极慢。');
console.log('');
console.log('  ③【绘制与合成成本】');
console.log('     即使节点不可见，浏览器也可能要为它们维护层、绘制状态与命中测试数据。');

// 用"虚拟节点对象"做一次可量化的替代测量。
// 注意：创建普通 JS 对象比创建真实 DOM 节点【便宜得多】，
// 所以下面的耗时是一个【极度乐观的下限】—— 真实的 DOM 操作只会更慢。
console.log('');
console.log('  量级感受（注意：这里用的是普通 JS 对象，不是真实 DOM 节点，');
console.log('            所以测出来的时间是一个【极度乐观的下限】）：');

function makeFakeNode(index) {
  return {
    id: index,
    tagName: 'div',
    className: 'row',
    textContent: `记录 #${index} —— 这是第 ${index} 行的内容`,
    style: { position: 'absolute', top: index * ROW_HEIGHT, height: ROW_HEIGHT },
    dataset: { index: String(index) },
    listeners: { click: null, mouseenter: null },
  };
}

// 预热，避免把 JIT 编译时间算进去（参见 11_benchmark_basics.js）
for (let i = 0; i < 2000; i++) makeFakeNode(i);

const fullBuildStart = performance.now();
const fullNodes = [];
for (let i = 0; i < TOTAL_ROWS; i++) fullNodes.push(makeFakeNode(i));
const fullBuildMs = performance.now() - fullBuildStart;

const partialBuildStart = performance.now();
const partialNodes = [];
for (let i = 0; i < visibleRows; i++) partialNodes.push(makeFakeNode(i));
const partialBuildMs = performance.now() - partialBuildStart;

console.log('');
console.log(`    创建 ${fmtInt(TOTAL_ROWS)} 个"虚拟节点对象"：${fullBuildMs.toFixed(2)} ms`);
console.log(`    创建 ${String(visibleRows).padStart(5)} 个"虚拟节点对象"：${partialBuildMs.toFixed(3)} ms`);
console.log(`    只做这一步就已经相差约 ${(fullBuildMs / Math.max(partialBuildMs, 0.001)).toFixed(0)} 倍。`);
console.log('');
console.log('    ⚠ 真实 DOM 创建比这慢得多（要经过绑定、样式、布局等多层），');
console.log('      所以真实项目里的差距会比这个数字大得多。');
console.log('    ⚠ 绝对数值因机器而异，这里只看"量级差异"这个结构性结论。');

// 后面的算法演示不需要这批数据了，释放掉
fullNodes.length = 0;
partialNodes.length = 0;

// ---------------------------------------------------------------------------
// 2. 虚拟列表的核心思路
// ---------------------------------------------------------------------------

console.log('\n--- 2. 虚拟列表的核心思路：三件事 ---');
console.log('');
console.log('  ①【撑】：用一个占位元素撑起"整份列表应有的总高度"');
console.log(`     总高度 = 总条数 × 每行高度 = ${fmtInt(TOTAL_ROWS)} × ${ROW_HEIGHT} = ${fmtInt(fullHeight)}px`);
console.log('     这样滚动条的长度、滚动范围都是"对的"，用户感觉不到列表被裁剪了。');
console.log('     （浏览器只认"高度"，不会因为你没渲染真实内容就不给滚动条。）');
console.log('');
console.log('  ②【算】：根据 scrollTop 算出"现在该渲染哪几条"');
console.log('     这是一个纯数学问题，O(1) 就能算出来 —— 不需要遍历所有数据。');
console.log('');
console.log('  ③【挪】：把这一批行绝对定位到正确的位置上，并【复用】已有节点');
console.log('     这一批行统一放在偏移 offsetY = startIndex × rowHeight 的位置。');
console.log('     滚动时只更新它们的内容和这个偏移量，不创建也不销毁节点。');
console.log('');
console.log('  用一个比喻：');
console.log('    就像透过一个小窗口看一幅很长的画卷。');
console.log('    你不会把整幅画卷都摊开，只把窗口对着的那一小段摊出来；');
console.log('    画卷在动的时候，你只是把摊开的那一段换成新的一段 ——');
console.log('    而"换"的过程用的是同一张纸（复用节点）。');
console.log('');
console.log('  纯 DOM 层面的等价写法（本示例不执行，仅作对照）：');
console.log('    <div class="viewport" style="height:640px; overflow-y:auto">');
console.log('      <div class="phantom" style="height:320000px">        <!-- ① 撑 -->');
console.log('        <div class="row" style="top:0px">…</div>           <!-- ③ 挪 -->');
console.log('        <div class="row" style="top:32px">…</div>');
console.log('        <!-- 只有 20 个左右，不是 10000 个 -->');
console.log('      </div>');
console.log('    </div>');
console.log('  注意：.row 必须 position:absolute，.phantom 必须 position:relative。');

// ---------------------------------------------------------------------------
// 3. 完整实现：computeVisibleRange
// ---------------------------------------------------------------------------

console.log('\n--- 3. 完整算法实现：computeVisibleRange ---');

/**
 * 计算"当前这一帧应该渲染哪些行"。
 * 这是虚拟列表唯一的核心算法，纯函数、无副作用、O(1)。
 *
 * @param {object} opts
 * @param {number} opts.scrollTop       当前滚动位置（像素，0 表示顶部）
 * @param {number} opts.viewportHeight  可视区高度（像素）
 * @param {number} opts.rowHeight       每行高度（像素，定高版本）
 * @param {number} opts.totalCount      列表总条数
 * @param {number} [opts.overscan=3]    可视区上下各多渲染几行作为缓冲
 * @returns {{
 *   startIndex:number, endIndex:number, renderCount:number,
 *   offsetY:number, totalHeight:number, visibleCount:number,
 *   firstRowTop:number, lastRowBottom:number
 * }}
 */
function computeVisibleRange({
  scrollTop,
  viewportHeight,
  rowHeight,
  totalCount,
  overscan = 3,
}) {
  // 步骤 1：整份列表的总高度 —— 用来撑开滚动条
  const totalHeight = totalCount * rowHeight;

  // 步骤 2：可视区最多能放下几行
  const visibleCount = Math.ceil(viewportHeight / rowHeight);

  // 步骤 3：当前滚动位置对应的"第一行"是第几条
  //   scrollTop = 0    → 第 0 行
  //   scrollTop = 32   → 第 1 行（正好滚过一整行）
  //   scrollTop = 33   → 还是第 1 行（第 1 行还没完全滚出去）
  const firstVisibleIndex = Math.floor(scrollTop / rowHeight);

  // 步骤 4：加上上下缓冲区
  //   · 减 overscan 让上面多渲染几行（快速向上滚动时不会露白）
  //   · 加 overscan 让下面多渲染几行（快速向下滚动时不会露白）
  //
  //   这里用 clamp 做边界处理，注意上界是 totalCount - 1（最后一条的下标）。
  const startIndex = clamp(firstVisibleIndex - overscan, 0, Math.max(0, totalCount - 1));
  const endIndex = clamp(
    firstVisibleIndex + visibleCount - 1 + overscan,
    0,
    Math.max(0, totalCount - 1),
  );

  // 步骤 5：这一批行要整体偏移多少像素
  //   —— 它们会被绝对定位到 offsetY 开始的位置
  const offsetY = startIndex * rowHeight;

  const renderCount = totalCount === 0 ? 0 : endIndex - startIndex + 1;

  return {
    startIndex,
    endIndex,
    renderCount,
    offsetY,
    totalHeight,
    visibleCount,
    firstRowTop: startIndex * rowHeight,
    lastRowBottom: (endIndex + 1) * rowHeight,
  };
}

console.log('');
console.log('  算法分五步（全部是 O(1) 的算术，不涉及任何循环）：');
console.log('    ① totalHeight   = totalCount × rowHeight           撑开滚动条');
console.log('    ② visibleCount  = ceil(viewportHeight / rowHeight)  可视区能放几行');
console.log('    ③ firstVisible  = floor(scrollTop / rowHeight)      当前第一行是第几条');
console.log('    ④ start/end     = firstVisible ∓ overscan，再 clamp 到 [0, total-1]');
console.log('    ⑤ offsetY       = startIndex × rowHeight            这批行整体下移多少');
console.log('');
console.log('  关键点：这个算法【完全不关心总条数有多大】。');
console.log(`    列表有 ${fmtInt(TOTAL_ROWS)} 条还是有 ${fmtInt(10_000_000)} 条，`);
console.log('    计算耗时都是一样的（几次整数除法而已）。');
console.log('    这就是虚拟列表最漂亮的地方：成本与数据量解耦。');

// ---------------------------------------------------------------------------
// 4. 模拟滚动：查看每个位置该渲染哪几条
// ---------------------------------------------------------------------------

console.log('\n--- 4. 模拟滚动：看看每个位置实际渲染了哪几条 ---');

const OVERSCAN = 3;

// 先验证一个基础场景
const initial = computeVisibleRange({
  scrollTop: 0,
  viewportHeight: VIEWPORT_HEIGHT,
  rowHeight: ROW_HEIGHT,
  totalCount: TOTAL_ROWS,
  overscan: OVERSCAN,
});

console.log('');
console.log('  场景参数：');
console.log(`    totalCount = ${fmtInt(TOTAL_ROWS)}，rowHeight = ${ROW_HEIGHT}px，`);
console.log(`    viewportHeight = ${VIEWPORT_HEIGHT}px，overscan = ${OVERSCAN}（上下各多渲染 ${OVERSCAN} 行）`);
console.log('');
console.log('  初始状态（scrollTop = 0）：');
console.log(`    总高度 totalHeight   = ${fmtInt(initial.totalHeight)}px  ← 撑开滚动条用`);
console.log(`    可视行数 visibleCount = ${initial.visibleCount} 行`);
console.log(`    渲染区间 [${initial.startIndex}, ${initial.endIndex}]，共 ${initial.renderCount} 条`);
console.log(`    偏移 offsetY = ${initial.offsetY}px`);
console.log('');
console.log(`  也就是说：${fmtInt(TOTAL_ROWS)} 条数据里，这一刻只创建 ${initial.renderCount} 个 DOM 节点。`);
console.log(`  渲染量是总条数的 ${((initial.renderCount / TOTAL_ROWS) * 100).toFixed(3)}%。`);

// 模拟滚动到不同位置
console.log('');
console.log('  模拟滚动到不同位置，观察渲染窗口如何【滑动】：');
console.log('');
console.log(
  '  scrollTop'.padEnd(14) +
    '首条可见'.padEnd(12) +
    '渲染区间'.padEnd(20) +
    '渲染条数'.padEnd(12) +
    'offsetY',
);
console.log('  ' + '-'.repeat(78));

const scrollPositions = [0, 64, 320, 3200, 32_000, 160_000, 319_000];

for (const scrollTop of scrollPositions) {
  const r = computeVisibleRange({
    scrollTop,
    viewportHeight: VIEWPORT_HEIGHT,
    rowHeight: ROW_HEIGHT,
    totalCount: TOTAL_ROWS,
    overscan: OVERSCAN,
  });
  const firstVisible = Math.floor(scrollTop / ROW_HEIGHT);
  console.log(
    `  ${fmtInt(scrollTop).padEnd(13)}` +
      `${fmtInt(firstVisible).padEnd(11)}` +
      `[${fmtInt(r.startIndex)} ~ ${fmtInt(r.endIndex)}]`.padEnd(19) +
      `${String(r.renderCount).padEnd(11)}` +
      `${fmtInt(r.offsetY)}px`,
  );
}
console.log('');
console.log('  观察到的关键现象：');
console.log('    · "渲染条数"这一列【始终在 26 条左右】（20 条可视 + 上下各 3 条缓冲），');
console.log(`      无论滚到第 0 条还是第 ${fmtInt(TOTAL_ROWS - 1)} 条 —— 这个数字是恒定的；`);
console.log('    · "offsetY"随滚动位置线性增长，它就是这批行在长画卷上的位置；');
console.log('    · "首条可见"和"渲染区间"的起点始终相差 overscan（=3），');
console.log('      说明缓冲区也确实生效了。');
console.log('');
console.log('  换算成收益：');
console.log(`    全量渲染：${fmtInt(TOTAL_ROWS)} 个节点；`);
console.log(`    虚拟列表：约 ${initial.renderCount} 个节点；`);
console.log(`    节点数减少到约 1/${Math.round(TOTAL_ROWS / initial.renderCount)}。`);

// 用具体的节点数再强调一次
const nodeReduction = TOTAL_ROWS / initial.renderCount;
console.log('');
console.log(`  按"每节点约 1KB"的行业经验值估算：`);
console.log(`    全量渲染 ≈ ${(TOTAL_ROWS / 1024).toFixed(1)} MB 的 DOM 内存；`);
console.log(`    虚拟列表 ≈ ${(initial.renderCount / 1024).toFixed(3)} MB；`);
console.log(`    相差约 ${nodeReduction.toFixed(0)} 倍。`);
console.log('    ⚠ 这个换算只是为了建立量级感，实际数值因页面内容而异。');

// ---------------------------------------------------------------------------
// 5. 节点复用（节点池）
// ---------------------------------------------------------------------------

console.log('\n--- 5. 节点复用：只减少首次渲染还不够 ---');
console.log('');
console.log('  问题：如果每次滚动都"销毁旧节点 + 创建新节点"，会出现两个后果：');
console.log('    · 滚动过程中的 DOM 操作量与滚动次数成正比，快速滚动时掉帧；');
console.log('    · 持续产生垃圾对象，给 GC 制造压力（参见 12_gc_internals.js）；');
console.log('    · 节点上的状态（焦点、动画、图片加载）每次都被重置。');
console.log('');
console.log('  正确做法：维护一个【固定大小的节点池】。');
console.log('    池子里的节点数量 = 最大可能渲染条数（这里约 26 个）；');
console.log('    滚动时只更新节点的【内容和位置】，不增不减。');
console.log('');

/** 用普通对象模拟一个 DOM 节点 */
function createNode() {
  return {
    textContent: '',
    style: { transform: '' },
    // 用一个自增计数来记录"这个节点被创建过几次"，用于验证复用
    _createdAt: ++createNode.createdCount,
    _updates: 0,
  };
}
createNode.createdCount = 0;

/**
 * 极简的虚拟列表渲染器（只维护节点池与内容更新，不碰真实 DOM）。
 */
class VirtualListRenderer {
  /**
   * @param {number} poolSize 节点池大小（= 最大渲染条数）
   */
  constructor(poolSize) {
    // 一次性建好节点池 —— 整个生命周期内只创建这么多次
    this.pool = Array.from({ length: poolSize }, () => createNode());
    this.poolSize = poolSize;
    this.totalUpdates = 0; // 累计"更新了几次节点内容"
    this.maxUsed = 0; // 记录历史上最多用到过几个节点
  }

  /**
   * 把"当前该显示的数据"画到节点池上。
   * @param {number} scrollTop
   * @param {object} config { viewportHeight, rowHeight, totalCount, overscan }
   * @param {(index:number)=>string} getText 根据数据下标取文本
   * @returns {object} 本帧的渲染信息
   */
  render(scrollTop, config, getText) {
    const range = computeVisibleRange({ scrollTop, ...config });
    this.maxUsed = Math.max(this.maxUsed, range.renderCount);

    // 遍历这一批要显示的数据，把内容写进池子里对应的节点
    for (let i = 0; i < range.renderCount; i++) {
      const dataIndex = range.startIndex + i;
      const node = this.pool[i]; // ← 复用：拿的是池子里已有的节点
      if (!node) break; // 池子不够大（这里只是防御性写法）

      node.textContent = getText(dataIndex);
      node.style.transform = `translateY(${range.offsetY + i * config.rowHeight}px)`;
      node._updates++;
      this.totalUpdates++;
    }

    return range;
  }

  /** 统计信息 */
  stats() {
    return {
      created: createNode.createdCount,
      poolSize: this.poolSize,
      totalUpdates: this.totalUpdates,
      maxUsed: this.maxUsed,
    };
  }
}

// 构造数据
const DATA = Array.from({ length: TOTAL_ROWS }, (_, i) => `记录 #${i} —— 内容占位`);
const getText = (index) => DATA[index] ?? '';

const CONFIG = {
  viewportHeight: VIEWPORT_HEIGHT,
  rowHeight: ROW_HEIGHT,
  totalCount: TOTAL_ROWS,
  overscan: OVERSCAN,
};

// ⚠ 这里有一个非常容易踩的坑：
//   节点池必须按【理论上最多可能渲染的条数】来建，也就是
//       可视行数 + 上下各 overscan 行
//   而【不能】按"第一帧算出来的渲染条数"来建 ——
//   因为第一帧在顶部会被 clamp 到 0，得到的条数往往比最大值少几条！
//
//   本示例第一帧（scrollTop=0）算出来是 23 条，但理论上最多能到
//   20（可视行）+ 3 + 3（上下缓冲）= 26 条。
//   如果按 23 建池，列表滚到中间时就会有 3 行没节点可用 —— 表现为"缺行"。
//   这个坑很隐蔽：只有滚到列表中间才会暴露，所以务必按理论上限建池。
const maxRenderCount = initial.visibleCount + 2 * OVERSCAN;
const poolSize = maxRenderCount;

const renderer = new VirtualListRenderer(poolSize);

console.log(`  节点池大小怎么定：`);
console.log(`    第一帧实际渲染条数（在顶部，被 clamp 过） = ${initial.renderCount} 条 ← 【不能】用这个建池！`);
console.log(`    理论上最多可能渲染条数 = 可视行数(${initial.visibleCount}) + 上下缓冲(${OVERSCAN}×2) = ${maxRenderCount} 条 ← 应该用这个`);
console.log(`  初始化：一次性创建 ${poolSize} 个节点，组成节点池。`);
console.log('');

// 模拟一次"用户从头滚到尾"的完整过程
const SCROLL_STEPS = 200;
const scrollStep = (initial.totalHeight - VIEWPORT_HEIGHT) / SCROLL_STEPS;

const scrollStart = performance.now();
let lastRange = null;
for (let s = 0; s <= SCROLL_STEPS; s++) {
  const scrollTop = Math.min(s * scrollStep, initial.totalHeight - VIEWPORT_HEIGHT);
  lastRange = renderer.render(scrollTop, CONFIG, getText);
}
const scrollElapsed = performance.now() - scrollStart;

const stats = renderer.stats();

console.log(`  模拟"从顶部一路滚到底部"，共 ${SCROLL_STEPS + 1} 次滚动更新：`);
console.log('');
console.log(`    实际创建过的节点总数 = ${fmtInt(stats.created)} 个`);
console.log(`    节点池大小           = ${stats.poolSize} 个`);
console.log(`    历史上最多用过       = ${stats.maxUsed} 个`);
console.log(`    累计内容更新次数     = ${fmtInt(stats.totalUpdates)} 次`);
console.log(`    滚动耗时总计         = ${scrollElapsed.toFixed(2)} ms`);
console.log('');
console.log(`  节点池够不够用：最多用过 ${stats.maxUsed} 个，池子有 ${stats.poolSize} 个 →`);
console.log(`    ${stats.maxUsed <= stats.poolSize ? '✓ 够用（池子大小刚好等于理论上限，没有缺行）' : '✗ 不够用，会缺行！'}`);
console.log('    如果当初按第一帧的 23 条建池，滚动到中间时就会有 3 行没有节点可放。');
console.log('');
console.log('  怎么读这几个数（这是本节最重要的一段）：');
console.log(`    · "创建过的节点总数" = ${stats.created}，【不是 ${fmtInt(TOTAL_ROWS)}，也不是 ${fmtInt((SCROLL_STEPS + 1) * poolSize)}】——`);
console.log('      整个滚动过程从头到尾只创建了节点池里那一次，之后全是复用；');
console.log(`    · "内容更新次数" = ${fmtInt(stats.totalUpdates)}，这才是滚动过程中的真实工作量；`);
console.log(`      每次滚动更新只改约 ${stats.poolSize} 个节点的文本和 transform，与总条数无关；`);
console.log('    · 对比一下：如果每次滚动都重建节点，');
console.log(`      需要创建 ${fmtInt((SCROLL_STEPS + 1) * poolSize)} 个节点、销毁同样多 ——`);
console.log(`      是实际创建量（${stats.created} 个）的约 ${Math.round(((SCROLL_STEPS + 1) * poolSize) / stats.created)} 倍。`);

// ---------------------------------------------------------------------------
// 6. 工作量对比总表
// ---------------------------------------------------------------------------

console.log('\n--- 6. 全量渲染 vs 虚拟列表：工作量对比 ---');
console.log('');
console.log(`  对比场景：${fmtInt(TOTAL_ROWS)} 条数据，可视区 ${VIEWPORT_HEIGHT}px，每行 ${ROW_HEIGHT}px`);
console.log('');
console.log('  维度'.padEnd(30) + '全量渲染'.padEnd(22) + '虚拟列表');
console.log('  ' + '-'.repeat(78));
console.log(
  '  DOM 节点数'.padEnd(28) + fmtInt(TOTAL_ROWS).padEnd(22) + fmtInt(initial.renderCount),
);
console.log(
  '  占总数比例'.padEnd(29) +
    '100%'.padEnd(22) +
    `${((initial.renderCount / TOTAL_ROWS) * 100).toFixed(2)}%`,
);
console.log('  滚动时的节点增删'.padEnd(23) + '每次滚动都重建'.padEnd(20) + '不增不减（复用）');
console.log(
  '  滚动过程总节点创建'.padEnd(23) +
    `${fmtInt((SCROLL_STEPS + 1) * TOTAL_ROWS)} 次`.padEnd(20) +
    `${fmtInt(stats.created)} 次（仅一次）`,
);
console.log('  滚动时单次工作量'.padEnd(23) + `与 ${fmtInt(TOTAL_ROWS)} 条成正比`.padEnd(18) + `与 ${poolSize} 个节点成正比`);
console.log('  单次重排成本'.padEnd(25) + '极慢（上万节点）'.padEnd(22) + '极快（几十节点）');
console.log('  DOM 内存量级'.padEnd(25) + `约 ${(TOTAL_ROWS / 1024).toFixed(1)} MB`.padEnd(22) + `约 ${(initial.renderCount / 1024).toFixed(3)} MB`);
console.log('');
console.log('  一句话总结：');
console.log('    全量渲染的成本与【总条数】成正比；');
console.log('    虚拟列表的成本与【可视条数】成正比，与总条数【无关】。');
console.log('    这就是它存在的全部意义。');

// ---------------------------------------------------------------------------
// 7. 边界情况与陷阱
// ---------------------------------------------------------------------------

console.log('\n--- 7. 边界情况与陷阱（实现时最容易出错的地方） ---');
console.log('');

console.log('  7.1 滚动到最底部：区间必须被正确截断');
const bottomEdge = computeVisibleRange({
  scrollTop: initial.totalHeight - VIEWPORT_HEIGHT, // 正好滚到底
  viewportHeight: VIEWPORT_HEIGHT,
  rowHeight: ROW_HEIGHT,
  totalCount: TOTAL_ROWS,
  overscan: OVERSCAN,
});
console.log(`      scrollTop = ${fmtInt(initial.totalHeight - VIEWPORT_HEIGHT)}（滚到底）`);
console.log(`      渲染区间 = [${fmtInt(bottomEdge.startIndex)} ~ ${fmtInt(bottomEdge.endIndex)}]，共 ${bottomEdge.renderCount} 条`);
console.log(`      最后一条的下标是 ${fmtInt(TOTAL_ROWS - 1)}，endIndex ${bottomEdge.endIndex <= TOTAL_ROWS - 1 ? '没有越界（正确）' : '【越界了！】'}`);
console.log('      → 这就是为什么 endIndex 必须用 clamp 限制在 totalCount - 1。');
console.log('        不加这层保护，就会去访问不存在的第 10000 条，得到 undefined。');

console.log('');
console.log('  7.2 顶部：startIndex 不能是负数');
const topEdge = computeVisibleRange({
  scrollTop: 16, // 刚滚了一点点，减 overscan 后会是负数
  viewportHeight: VIEWPORT_HEIGHT,
  rowHeight: ROW_HEIGHT,
  totalCount: TOTAL_ROWS,
  overscan: OVERSCAN,
});
console.log(`      scrollTop = 16，overscan = ${OVERSCAN}`);
console.log(`      未加保护时 firstVisible - overscan = 0 - ${OVERSCAN} = ${-OVERSCAN}（负数！）`);
console.log(`      加了 clamp 之后 startIndex = ${topEdge.startIndex}（正确）`);
console.log('      → 不加保护会出现"第 -3 条"这种诡异的下标。');

console.log('');
console.log('  7.3 空列表：totalCount = 0');
const emptyEdge = computeVisibleRange({
  scrollTop: 0,
  viewportHeight: VIEWPORT_HEIGHT,
  rowHeight: ROW_HEIGHT,
  totalCount: 0,
  overscan: OVERSCAN,
});
console.log(`      totalCount = 0 → renderCount = ${emptyEdge.renderCount}，totalHeight = ${emptyEdge.totalHeight}`);
console.log('      → 必须提前处理空列表，否则 endIndex 会算出 -1 之类的值。');
console.log('        （这也是为什么上面用了 Math.max(0, totalCount - 1) 兜底。）');

console.log('');
console.log('  7.4 可视区比整份列表还高：不该有 overscan 外的多余渲染');
const shortList = computeVisibleRange({
  scrollTop: 0,
  viewportHeight: VIEWPORT_HEIGHT, // 640px 可视区
  rowHeight: ROW_HEIGHT,
  totalCount: 5, // 但只有 5 条数据（总高 160px）
  overscan: OVERSCAN,
});
console.log(`      totalCount = 5（总高 ${5 * ROW_HEIGHT}px，比可视区 ${VIEWPORT_HEIGHT}px 还矮）`);
console.log(`      渲染区间 = [${shortList.startIndex} ~ ${shortList.endIndex}]，共 ${shortList.renderCount} 条`);
console.log(`      → 正确结果应该是全部 5 条，实际得到 ${shortList.renderCount} 条。`);
console.log('        这正是 clamp 上界在起作用：不会去渲染不存在的第 6~19 条。');

console.log('');
console.log('  7.5 陷阱清单');
console.log('');
const pitfalls = [
  ['忘了撑起总高度', '滚动条只有可视区那么长，用户根本滚不到后面'],
  ['overscan 设为 0', '滚动时可视区边缘闪白，快速滚动尤其明显'],
  ['滚动事件里同步做重活', '滚动事件极其频繁，必须节流或合并到 rAF'],
  ['每次滚动重建节点', '只做了"少渲染"没做"复用"，GC 与布局压力依旧'],
  ['容器忘了 position:relative', '绝对定位的行会相对别的祖先定位，整体错位'],
  ['假定每行等高但实际不等', '行内有图片/换行文本时，位置会越滚越偏'],
  ['按固定条数判断切片', '行高不同、内容不同，固定条数切出来的可视区量不对'],
  ['忽略可访问性', 'Ctrl+F 搜不到、屏幕阅读器读不全、Tab 焦点跳不出去'],
  ['对小列表也用虚拟列表', '几十条数据时，复杂度远大于收益，还引入一堆坑'],
  ['滚动位置未持久化', '切换路由回来回到顶部，用户要找半天'],
];
console.log('  陷阱'.padEnd(30) + '后果');
console.log('  ' + '-'.repeat(84));
for (const [p, c] of pitfalls) {
  console.log(p.padEnd(28) + c);
}

// ---------------------------------------------------------------------------
// 8. 实践建议
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实践建议 ---');
console.log('');
console.log('  8.1 参数怎么选');
console.log(`    · overscan：上下各 3~10 行，或约半个可视区。默认 3 偏保守；`);
console.log('      列表项很重（带图表/图片）时调小，滚动很快时调大；');
console.log('    · 滚动监听：必须用 requestAnimationFrame 合并，或 16ms 节流');
console.log('      （参见 02_throttle.js）。绝不要每次 scroll 事件都重新计算并写 DOM；');
console.log('    · 节点池大小 = 最大可能渲染条数（可视行数 + 2 × overscan），只多不少。');
console.log('');
console.log('  8.2 定高 vs 不定高怎么选');
console.log('    · 能定高就一定定高 —— 公式精确、无累计误差、可以 O(1) 定位任意行；');
console.log('    · 不定高需要维护"每行高度 + 累计偏移表"，');
console.log('      通常用二分查找定位首行，并在滚动时动态校正；');
console.log('      还要处理滚动位置跳动（scroll anchoring），复杂度高一个量级；');
console.log('    · 折中方案：限定几种高度（如 32/64/96），用分段累计表，实现难度适中。');
console.log('');
console.log('  8.3 什么时候【不要】用虚拟列表');
console.log('    · 数据量在几百条以内，且列表项很轻 → 直接渲染更简单可靠；');
console.log('    · 需要完整的页内搜索（Ctrl+F）→ 虚拟化天然做不到；');
console.log('    · 需要整页打印 / 导出为图片 → 未渲染的内容不会出现；');
console.log('    · 列表项高度完全不可预测且必须精确 → 实现成本可能不划算。');
console.log('');
console.log('  8.4 还要配套做的事');
console.log('    · 分页/懒加载：虚拟列表解决"渲染多少"，不解决"数据怎么来"；');
console.log('      两者配合才是完整的方案（首次只取可视区 + 滚动时增量拉取）；');
console.log('    · 滚动位置上：切换视图回来要恢复，用 sessionStorage 记住即可；');
console.log('    · 骨架屏：数据还没到时给个占位，避免高度跳变；');
console.log('    · 可访问性补偿：给容器加 role="list"、aria-rowcount 等属性，');
console.log('      并提供键盘导航与"跳转到第 N 条"的能力。');
console.log('');
console.log('  8.5 现成的库（理解原理后用它们更顺手）');
console.log('    · TanStack Virtual   —— 框架无关的虚拟化内核，API 现代；');
console.log('    · react-window / react-virtualized —— React 生态里的经典选择；');
console.log('    · vue-virtual-scroller —— Vue 生态；');
console.log('    · 它们内部做的就是本示例这几件事，理解了就不容易被参数配置绕晕。');

console.log('');
console.log('  【本节结论】');
console.log('    1. 虚拟列表的本质是"把渲染成本与总条数解耦"，只与可视条数相关；');
console.log('    2. 核心算法就是一个 O(1) 的窗口计算（computeVisibleRange）；');
console.log('    3. 只有"少渲染"还不够，必须配上"节点复用"才能让滚动过程也流畅；');
console.log('    4. 真正落地时的难点不在算法，而在 overscan 调参、高不定、可访问性这些细节。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
