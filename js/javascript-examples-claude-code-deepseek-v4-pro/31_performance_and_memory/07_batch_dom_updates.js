/**
 * ============================================================================
 * 知识点：批量更新与减少重复计算 —— DocumentFragment 思想与重排次数统计
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】进阶
 * 【前置知识】31_performance_and_memory/05_loop_performance.js
 *
 * 【也见】27_web_apis/09_dom_performance.js —— 同一主题在「浏览器 Web API」章节里也完整讲了一遍。
 *        那篇是浏览器真 API 的主场（DocumentFragment / innerHTML / 布局抖动）；
 *        本文件用自建的模拟重排引擎演示同一思想（批量缓冲、读写分离）。两文互补。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    批量更新指"先把多次改动累积到一个缓冲区，最后一次性提交给下游"。
 *    在前端里，这个思想最典型的落地就是 DocumentFragment：
 *    它是一个"不属于任何文档、也没有父节点"的轻量节点容器，
 *    往里面添加节点不会影响页面；只有把它整体插入文档的那一刻才会触发一次
 *    样式计算与布局（重排 reflow / 重绘 repaint）。
 *    在 Node.js 里没有 DOM，本示例用一个"会统计重排次数"的模拟渲染器
 *    来演示同样的思想，并给出前端真实 API 的对照说明。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 列表渲染：一次性渲染 1000 条数据，如果每插一条都触发一次重排，
 *      浏览器要做 1000 次布局计算，页面直接卡死。
 *    - 读写交替（layout thrashing）：在循环里"改样式→读 offsetHeight→再改样式"，
 *      每次读取都会强制浏览器立即重新布局，性能断崖式下跌。
 *    - 减少重复计算：循环里反复查 DOM、反复算同一个表达式，
 *      是前端最常见的性能坑（比"用 for 还是 forEach"重要得多）。
 *    - 服务端同样适用：批量写数据库、批量发请求、批量提交日志，
 *      本质都是"先缓冲再提交"。
 *
 * 3. 核心语法要点
 *    - DocumentFragment（前端）：document.createDocumentFragment() 创建；
 *      它不在文档树里，appendChild 到它身上不会触发重排；
 *      把 fragment 整体插入文档时，fragment 的【子节点会被搬走】，
 *      fragment 自身变空（所以不能重复使用同一个 fragment）。
 *    - 缓冲区模式（通用）：用一个数组/字符串/列表当缓冲，
 *      循环里只做 push，循环结束后一次性提交。
 *    - 读写分离：把所有"写"操作集中在一起，再把所有"读"操作集中在一起，
 *      避免在循环里交替进行（这是解决 layout thrashing 的标准手法）。
 *    - 缓存：把循环里不变的表达式提到循环外；把 arr.length、
 *      DOM 查询结果、正则对象等存进局部变量。
 *
 * 4. 常见陷阱
 *    - 陷阱一：在循环里查询 DOM。document.querySelector 每次都要遍历 DOM 树，
 *      在循环里调用它是最典型的性能事故（本示例第 5 节会实测查询次数）。
 *    - 陷阱二：改了样式立刻读布局属性（offsetTop / offsetHeight /
 *      getBoundingClientRect / scrollTop）。读操作会强制浏览器"刷新布局"，
 *      于是"写-读-写-读"退化成 N 次完整重排。
 *    - 陷阱三：以为"重排次数"是唯一指标。其实 DOM 操作的总次数、
 *      事件监听器数量、内存分配同样重要；批量化的收益主要体现在重排上。
 *    - 陷阱四：批量意味着"延迟生效"。如果业务需要"插一条就能立刻被测量到"，
 *      那就要在批量和实时之间做取舍，不能盲目批量化。
 *    - 陷阱五：Node.js 里没有 DOM，不要照搬 document 相关 API；
 *      要迁移的是"先缓冲、再一次性提交"的思想，而不是 API 本身。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/07_batch_dom_updates.js
 *
 * 【预期输出】
 *   打印 6 个小节：为什么需要批量更新、模拟渲染器的实现、
 *   逐个插入与批量插入的重排次数实测、读写交替导致的 layout thrashing 实测、
 *   减少重复计算的三种手法实测、以及前端真实 API 的对照与结论。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 1. 概念：为什么需要批量更新
// ---------------------------------------------------------------------------

console.log('--- 1. 为什么需要批量更新 ---');

console.log('浏览器的渲染大致分三步：');
console.log('  ① 计算样式（Style）    ② 布局/重排（Layout / reflow）    ③ 绘制（Paint）');
console.log('每次修改 DOM 结构或几何相关的样式，浏览器都可能要把 ② 甚至 ③ 重做一遍。');
console.log('批量更新的核心思路：把 N 次修改攒起来，只让浏览器做 1 次重排。');
console.log('');
console.log('前端的标准做法是 DocumentFragment：');
console.log('  · document.createDocumentFragment() 创建一个"不在文档树里"的节点容器；');
console.log('  · 往它身上 appendChild 不会触发任何重排（因为它不被渲染）；');
console.log('  · 最后把 fragment 整体插入文档，只触发 1 次重排；');
console.log('  · 注意：插入时 fragment 的子节点会被"搬走"，fragment 自身会变空。');
console.log('');
console.log('Node.js 里没有 DOM，下面用一个"会统计重排次数"的模拟渲染器来演示。');
console.log('要迁移到服务端的是这个思想：先缓冲，再一次性提交。');

// ---------------------------------------------------------------------------
// 2. 模拟渲染器：统计重排次数与操作次数
// ---------------------------------------------------------------------------

console.log('\n--- 2. 模拟渲染器的实现 ---');

/**
 * 创建一个模拟渲染器。
 * 它不画真正的界面，只统计两件事：DOM 操作次数、重排（reflow）次数。
 * 规则刻意贴近浏览器语义：
 *   · 挂到"已挂载节点"上的写操作 → 触发一次重排；
 *   · 挂到"游离节点"（还没进文档树）上的写操作 → 不触发重排；
 *   · 读几何属性时，如果有未提交的写操作，也会触发一次重排。
 */
function createRenderer() {
  const stats = { ops: 0, reflows: 0, dirty: false };

  // 创建一个节点对象。mounted=false 表示它还在文档树之外（比如在 fragment 里）
  function createNode(tag, mounted = false) {
    stats.ops += 1;
    return { tag, children: [], text: '', mounted, _dirty: false };
  }

  // 把 child 挂到 parent 下面
  function append(parent, child) {
    stats.ops += 1;
    parent.children.push(child);
    // 子节点会跟随父节点进入文档树
    if (parent.mounted) child.mounted = true;
    if (child.mounted) {
      // 只有真正进了文档树才需要重新布局
      stats.reflows += 1;
      stats.dirty = true;
    }
    return child;
  }

  // 模拟"读取几何属性"：有未提交的写操作时，浏览器必须立刻重新布局
  function readLayout(node) {
    stats.ops += 1;
    if (stats.dirty) {
      stats.reflows += 1;
      stats.dirty = false;
    }
    return node.children.length;
  }

  // 模拟提交/刷新：把攒下的改动一次性落地（等价于浏览器在一帧结束时统一渲染）
  function commit() {
    stats.ops += 1;
    if (stats.dirty) {
      stats.reflows += 1; // 一整帧只重排一次
      stats.dirty = false;
    }
  }

  return { stats, createNode, append, readLayout, commit };
}

console.log('渲染器已就绪。规则：');
console.log('  · 写已挂载节点 → 重排 +1');
console.log('  · 写游离节点   → 不重排（这就是 fragment 快的原因）');
console.log('  · 读几何属性时若有未提交的写 → 重排 +1（layout thrashing 的来源）');

// ---------------------------------------------------------------------------
// 3. 实测：逐个插入 vs 批量插入
// ---------------------------------------------------------------------------

console.log('\n--- 3. 实测：逐个插入 vs 批量插入 ---');

const ITEMS = 1000; // 渲染 1000 条列表项

// 3.1 朴素做法：每创建一条就直接插到已挂载的列表容器里
function renderOneByOne(items) {
  const renderer = createRenderer();
  const list = renderer.createNode('ul', true); // mounted = true，已在文档中

  for (let i = 0; i < items; i++) {
    const li = renderer.createNode('li'); // 新节点是游离的
    renderer.append(list, li); // 立刻挂进已挂载的列表 → 每次都触发重排
  }

  return renderer.stats;
}

// 3.2 批量做法：先用一个游离的"容器"当缓冲区，最后整体一次性插入
function renderBatched(items) {
  const renderer = createRenderer();
  const list = renderer.createNode('ul', true);

  // 这一步等价于 document.createDocumentFragment()
  // mounted 默认 false —— 它不在文档树里，往它身上加东西不会触发重排
  const fragment = renderer.createNode('#fragment', false);

  for (let i = 0; i < items; i++) {
    const li = renderer.createNode('li');
    renderer.append(fragment, li); // 加到游离容器上 → 不触发重排
  }

  // 关键的一步：整体插入文档，只触发 1 次重排
  renderer.append(list, fragment);

  return renderer.stats;
}

const oneByOne = renderOneByOne(ITEMS);
const batched = renderBatched(ITEMS);

console.log(`渲染 ${ITEMS} 条列表项，两种做法的对比：`);
console.log('做法'.padEnd(30) + 'DOM 操作次数'.padEnd(16) + '重排次数');
console.log('-'.repeat(64));
console.log('逐个插入'.padEnd(28) + String(oneByOne.ops).padEnd(18) + String(oneByOne.reflows));
console.log('批量插入（fragment 思想）'.padEnd(24) + String(batched.ops).padEnd(18) + String(batched.reflows));

const saved = oneByOne.reflows - batched.reflows;
console.log('');
console.log(`重排次数从 ${oneByOne.reflows} 降到 ${batched.reflows}，减少了 ${saved} 次。`);
console.log(`重排次数比例约 1 : ${(oneByOne.reflows / batched.reflows).toFixed(0)}。`);
console.log('说明：DOM 操作次数几乎没变（节点还是那么多），减少的是"布局计算"的次数。');
console.log('      这正是批量更新的价值所在——同一个结果，更少的重排。');

// ---------------------------------------------------------------------------
// 4. 进阶：读写交替 → layout thrashing（布局抖动）
// ---------------------------------------------------------------------------

console.log('\n--- 4. 进阶：读写交替导致的 layout thrashing ---');

// 4.1 反面教材：每写一次就立刻读一次
function writeReadInterleaved(items) {
  const renderer = createRenderer();
  const list = renderer.createNode('ul', true);

  for (let i = 0; i < items; i++) {
    const li = renderer.createNode('li');
    renderer.append(list, li); // 写
    renderer.readLayout(list); // 读 → 强制立刻重新布局
  }

  return renderer.stats;
}

// 4.2 正确做法：先把所有"写"做完，再统一"读"
function writeThenRead(items) {
  const renderer = createRenderer();
  const list = renderer.createNode('ul', true);

  // 阶段一：只写，不读
  for (let i = 0; i < items; i++) {
    // 这里借 fragment 缓冲，把写操作集中起来
    const fragment = renderer.createNode('#fragment', false);
    renderer.append(fragment, renderer.createNode('li'));
    renderer.append(list, fragment);
  }

  // 阶段二：只读，不写
  const height = renderer.readLayout(list);
  renderer.commit();

  return { ...renderer.stats, height };
}

const interleaved = writeReadInterleaved(ITEMS);
const separated = writeThenRead(ITEMS);

console.log(`处理 ${ITEMS} 条数据，两种做法的对比：`);
console.log('做法'.padEnd(30) + '重排次数');
console.log('-'.repeat(44));
console.log('写一次读一次（交错）'.padEnd(26) + String(interleaved.reflows));
console.log('先写完再统一读（分离）'.padEnd(24) + String(separated.reflows));
console.log('');
console.log('结论：把读和写分开，重排次数能显著下降。');
console.log('前端实战口诀：先批量读（把需要的尺寸/位置一次性量完存进变量），');
console.log('              再批量写（把样式/DOM 改动一次性应用）。');
console.log('另一个思路是"把测量推迟到下一帧"，比如用 requestAnimationFrame，');
console.log('让浏览器在两次布局之间只有一次统一的读写周期。');

// ---------------------------------------------------------------------------
// 5. 减少重复计算：三种最容易被忽视的手法
// ---------------------------------------------------------------------------

console.log('\n--- 5. 减少重复计算 ---');

// 5.1 把循环内不变的表达式提到循环外
const rawItems = Array.from({ length: ITEMS }, (_, i) => ({ id: i, name: `item-${i}` }));

let innerCalcCount = 0;
function prefixInsideLoop(items) {
  let out = '';
  for (let i = 0; i < items.length; i++) {
    // 每次循环都重新算一遍前缀 —— 这一步和 i 无关，纯属浪费
    const prefix = `【${items.length} 条中的第`; // 每次迭代都重新拼接
    innerCalcCount += 1;
    out += `${prefix}${i + 1}】${items[i].name};`;
  }
  return out;
}

let outerCalcCount = 0;
function prefixOutsideLoop(items) {
  let out = '';
  // 提到循环外：只算一次
  const prefix = `【${items.length} 条中的第`;
  outerCalcCount += 1;
  for (let i = 0; i < items.length; i++) {
    out += `${prefix}${i + 1}】${items[i].name};`;
  }
  return out;
}

// 先真正跑一遍两种写法，再打印统计值（顺序很重要，否则统计到的都是 0）
const insideResult = prefixInsideLoop(rawItems);
const outsideResult = prefixOutsideLoop(rawItems);

console.log(`前缀字符串的拼接次数：写在循环内 = ${innerCalcCount} 次，提到循环外 = ${outerCalcCount} 次。`);
console.log('（循环内的写法每轮都要重新拼一次前缀字符串，提到外面只算一次。）');
console.log(`两种写法结果一致：${insideResult === outsideResult}`);

// 5.2 缓存 length 与其它重复属性访问
const bigList = { items: rawItems, meta: { title: '列表' } };

let lengthReadCount = 0;
function withoutLengthCache(list) {
  const result = [];
  for (let i = 0; i < list.items.length; i++) {
    // 每次都走一遍 list.items.length 这条属性链
    lengthReadCount += 1;
    result.push(list.items[i].id);
  }
  return result.length;
}

let cachedReadCount = 0;
function withLengthCache(list) {
  const result = [];
  // 把属性链的结果缓存到局部变量（局部变量的访问比跨对象属性访问快得多）
  const items = list.items;
  const len = items.length;
  cachedReadCount += 1;
  for (let i = 0; i < len; i++) {
    result.push(items[i].id);
  }
  return result.length;
}

// 同样先跑再统计
const noCacheResult = withoutLengthCache(bigList);
const cacheResult = withLengthCache(bigList);

console.log('');
console.log(`属性链（list.items.length）的完整访问次数：不缓存 = ${lengthReadCount} 次，缓存到局部变量 = ${cachedReadCount} 次。`);
console.log(`两种写法结果一致：${noCacheResult === cacheResult}`);
console.log('提示：单看"访问 length"未必测得出明显耗时差异（现代引擎对属性访问优化得很好），');
console.log('      但把属性链的结果存进局部变量，能减少的是"不确定性"——');
console.log('      对象形状一变（参考 08_object_shape_optimization.js），属性链访问就可能变慢。');

// 5.3 缓存 DOM 查询结果（前端最常见的性能坑）
console.log('');
console.log('缓存 DOM 查询结果（前端最常见的性能坑）：');
console.log('  ✗ 反面写法：');
console.log('      for (const row of rows) {');
console.log('        document.querySelector("#total").textContent = sum;  // 每轮都查一次 DOM');
console.log('      }');
console.log('  ✓ 正确写法：');
console.log('      const totalEl = document.querySelector("#total");  // 循环外查一次');
console.log('      for (const row of rows) { totalEl.textContent = sum; }');
console.log('');
console.log('  querySelector 每次都要遍历 DOM 树并做选择器匹配，开销远大于一次属性赋值。');
console.log('  在循环里查 DOM，等于把 O(1) 的赋值变成了 O(n) 的查询——');
console.log('  这类问题的优化收益，比"for 还是 forEach"高好几个量级。');

// 用模拟"查询"统计一下次数差异
function createQueryCounter() {
  const state = { queries: 0 };
  state.querySelector = (selector) => {
    state.queries += 1; // 真实 DOM 里这里是一次 DOM 树遍历
    return { selector };
  };
  return state;
}

const domA = createQueryCounter();
const domB = createQueryCounter();

// 反面：每轮都查
for (let i = 0; i < ITEMS; i++) {
  domA.querySelector('#total');
}
// 正面：只查一次
const cachedEl = domB.querySelector('#total');
for (let i = 0; i < ITEMS; i++) {
  void cachedEl; // 复用同一个引用
}

console.log(`  模拟 ${ITEMS} 条数据：不缓存查询了 ${domA.queries} 次，缓存后只查了 ${domB.queries} 次。`);

// ---------------------------------------------------------------------------
// 6. 前端真实 API 对照与结论
// ---------------------------------------------------------------------------

console.log('\n--- 6. 前端真实 API 对照 ---');

console.log('把本示例的模拟换成真实浏览器 API，对应关系如下：');
console.log('');
console.log('  模拟渲染器                 →  真实前端');
console.log('  ' + '-'.repeat(62));
console.log('  createNode(algo, false)   →  document.createDocumentFragment()');
console.log('  append(fragment, child)   →  fragment.appendChild(child)');
console.log('  append(list, fragment)    →  list.appendChild(fragment)  // 只重排一次');
console.log('  readLayout(node)          →  el.offsetHeight / getBoundingClientRect()');
console.log('  commit()                  →  浏览器在帧末统一渲染（或用 requestAnimationFrame）');
console.log('');
console.log('结论：');
console.log('  1. 批量更新的本质是"先缓冲、再一次性提交"，把 N 次重排压缩成 1 次。');
console.log('  2. 把所有"读"集中在一起、所有"写"集中在一起，避免 layout thrashing。');
console.log('  3. 把循环内不变的表达式、属性链、DOM 查询结果提到循环外或缓存到局部变量——');
console.log('     这类"减少重复计算"的收益，远大于纠结用哪种循环写法。');
console.log('  4. 服务器端同样适用：批量插入数据库、批量发请求、批量写日志，');
console.log('     都是同一个"缓冲 + 提交"的模式。');
console.log('  5. 优化的顺序永远是：先测量，找到真正的瓶颈，再动手。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
