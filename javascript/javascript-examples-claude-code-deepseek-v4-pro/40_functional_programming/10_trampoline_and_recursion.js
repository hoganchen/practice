/**
 * ============================================================================
 * 知识点：FP 风格的递归与蹦床（trampoline）—— 在没有尾调用优化的 JS 里安全地递归
 * ============================================================================
 *
 * 【所属分类】40_functional_programming —— 函数式编程进阶
 * 【难度等级】高级
 * 【前置知识】06_functions/10_recursion.js、08_arrays/10_reduce.js、17_iterators_and_generators/*、38_algorithms_and_data_structures/03_stack_and_queue.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    递归：函数直接或间接调用自己，把大问题拆成同类的小问题。
 *    蹦床（trampoline）：一种"把递归摊平"的执行技巧 ——
 *    递归函数不再直接调用自己，而是**返回一个"下一步要做什么"的函数（thunk）**，
 *    由外层的驱动器用一个 while 循环反复调用，直到拿到最终结果。
 *    名字的来源就是形象：每一次"返回一个函数"像一次弹跳，而 while 循环是那张绷着的蹦床。
 *    它和尾调用优化解决的是同一个问题，可以理解为**手动版的 TCO**。
 *
 * 2. 为什么需要
 *    函数式编程天然偏爱递归：fold / reduce 就是"递归思想的封装"，
 *    而树、JSON、目录、表达式、评论楼中楼这些**自相似结构**，
 *    用递归描述起来比循环短得多、也贴近人的思维。
 *    问题是 JavaScript 没有尾调用优化：
 *      · 规范里曾有 PTC（proper tail calls），但 V8（Node / Chrome）从未实现，
 *        只有 Safari 的 JavaScriptCore 落地过，实际处于搁置状态；
 *      · 于是"尾递归写法"在 Node 里**照样爆栈**（第 2 节有实测）；
 *      · 调用栈上限只有大约一万层（第 2 节用二分法实测出来的量级）。
 *    而现实中深度常常不可控：用户上传的 JSON、文件系统的目录树、
 *    爬虫抓到的评论嵌套、退化成一串的链表 —— 都可能轻易超过一万层。
 *    所以"递归的表达力"必须配上一套"不会爆栈的落地手段"，这就是本文件要补的那条线。
 *
 * 3. 核心语法要点
 *    (1) 递归的 FP 写法：用 reduce/fold 替代显式循环，把"遍历"交给库、把"做什么"交给参数。
 *    (2) 爆栈的信号：`RangeError: Maximum call stack size exceeded`，
 *        它和内存溢出（OOM）是两回事（也见 GLOSSARY 的 Stack Overflow 词条）。
 *    (3) 蹦床的约定：递归函数返回一个**零参函数**（表示"还要再算一步"），
 *        或者返回一个**非函数值**（表示"算完了"）。驱动器只认这两件事：
 *            let r = fn(...args);
 *            while (typeof r === 'function') r = r();
 *    (4) 为什么它不会爆栈：每一次调用都在**返回之后**才发生下一次调用，
 *        栈深度始终是 O(1)；而被推迟的"下一步"变成了堆上的闭包（可以随便增长）。
 *    (5) 分支递归（树）要配合 CPS（延续传递风格）：把"剩下的活儿"作为参数 k 传下去，
 *        让每个递归调用都落在函数体的最后一步，才有可能改写成返回 thunk。
 *    (6) 三种方案的取舍：直接递归（最好写，会爆栈）、显式栈循环（最快，最难写）、
 *        蹦床（写法接近递归，不会爆栈，比循环慢）。
 *
 * 4. 常见陷阱
 *    - 以为"写成尾递归形式就不会爆栈"。Node 里照样爆 —— 没有 TCO 就是没有（第 2 节实测）。
 *    - 以为 `await` 能展开调用栈。**不能**：`await rec(n - 1)` 里的 rec(n-1)
 *      是在同一个 tick 里同步发起的，栈照样长上去（实测上限约 8800 层，与同步递归同量级）。
 *    - 以为蹦床能省内存。它省的是**栈**，不是内存：每一步要分配一个闭包，
 *      递归深度的内存开销从栈搬到了堆，只是堆大得多、而且不会一脚踩空。
 *    - 蹦床用在了没有递归的地方：它比普通循环慢好几倍（第 5 节实测），
 *      深度确定且不大的场景纯属自找麻烦。
 *    - 忘了检查"返回的到底是 thunk 还是结果"：如果递归函数在某个分支返回了函数值本身
 *      （而不是"下一步的函数"），驱动器会一直弹下去直到它变成结果 —— 甚至死循环。
 *    - 用 `--stack-size=20000` 之类的命令行参数"解决"问题：只是把上限抬高，
 *      治标不治本、不可移植，线上环境还不一定能改。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 40_functional_programming/10_trampoline_and_recursion.js
 *
 * 【预期输出】
 *   先看递归在 FP 里的两种典型用法（fold 与自相似结构）；
 *   再用二分法实测调用栈上限的量级，并验证"尾递归写法在 Node 里照样爆栈"；
 *   接着给出三种落地手段（循环 / 显式栈 / 蹦床），手写蹦床并用它安全地处理十万层的深链；
 *   再用 CPS + 蹦床处理分支递归（深树求和）；
 *   最后给出三种方案的对比表与选型建议。
 * ============================================================================
 */

console.log('--- 1. 递归在函数式编程里的两种典型用法 ---');

// 用法一：fold / reduce —— 它本身就是"把循环写成递归"的封装。
// 求和、计数、分组、建索引，全都能用归约表达，不需要写一句 for。
const numbers = [1, 2, 3, 4, 5];
const sumByReduce = (arr) => arr.reduce((acc, x) => acc + x, 0);
console.log('  用法一 · 归约（fold）：[1,2,3,4,5].reduce(加法) →', sumByReduce(numbers));
console.log('  reduce 内部就是一个递归过程：处理完第一个元素，剩下的交给"下一次"。');

// 用法二：自相似结构的递归下降 —— 树、JSON、目录、表达式都用它。
// 数据结构长什么样，代码就长什么样，这是递归最大的可读性收益。
const orgTree = {
  name: 'CEO',
  reports: [
    { name: 'CTO', reports: [{ name: '前端负责人', reports: [] }, { name: '后端负责人', reports: [] }] },
    { name: 'CFO', reports: [] },
  ],
};
// 统计节点总数：结构与递归一一对应，几乎不需要解释。
const countTree = (node) => node.reports.reduce((sum, child) => sum + countTree(child), 1);
console.log('  用法二 · 自相似结构：组织架构树共', countTree(orgTree), '个节点（CEO → CTO/CFO → 两个负责人）');
console.log('  ★ 换成手写循环也能做，但你要自己维护一个栈 —— 代码就从"数节点"变成了"怎么遍历"。');
console.log('  也见 08_arrays/10_reduce.js 与 06_functions/10_recursion.js。');

console.log('--- 2. 坏消息：JS 没有尾调用优化，而且栈只有大约一万层 ---');

// 先用二分法把"最多能递归多少层"量出来（比"大概一万层"这种说法靠谱）。
// 注意：这个数字受 Node 版本、平台、函数帧大小影响，请把它当成**量级**而不是常数。
const maxDepthOf = (fn, hi = 200_000) => {
  let lo = 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    try {
      fn(mid);
      lo = mid; // 这一深度能跑通 → 往深处试
    } catch (err) {
      if (err instanceof RangeError) hi = mid - 1; // 爆栈了 → 往浅处试
      else throw err;
    }
  }
  return lo;
};

// 变体 A：最朴素的递归（帧很小）
const sumRec = (n) => (n <= 0 ? 0 : n + sumRec(n - 1));
// 变体 B：帧更大（多几个局部变量）
const sumRecHeavy = (n) => {
  if (n <= 0) return 0;
  const a = n + 1;
  const b = [n, a];
  const c = { n, a };
  const d = `第 ${n} 层`;
  return 1 + sumRecHeavy(n - 1) + (b.length + c.n + d.length > 0 ? 0 : a);
};
// 变体 C：**尾递归形式**（理论上可被优化成循环，实际上 V8 不优化）
const sumTailRec = (n, acc) => (n <= 0 ? acc : sumTailRec(n - 1, acc + n));

const limitPlain = maxDepthOf(sumRec);
const limitHeavy = maxDepthOf(sumRecHeavy);
const limitTail = maxDepthOf((n) => sumTailRec(n, 0));
console.log(`  ${process.version} 上的实测（同一台机器，仅作量级参考）：`);
console.log('    朴素递归上限          ≈', limitPlain, '层');
console.log('    帧较大的递归上限      ≈', limitHeavy, '层  （帧越大，能装的层数越少）');
console.log('    尾递归形式的上限      ≈', limitTail, '层  ← 和朴素递归同一量级');
console.log('  ★ 第三行是本节最重要的事实：**尾递归形式在 Node 里一样会爆栈**。');
console.log('    V8 从未实现 ES6 规范里的 PTC，只有 Safari 的 JSC 落地过（也见 GLOSSARY 的 TCO 词条）。');
console.log('    所以"改成尾递归"不是解法，"不能依赖 TCO"才是结论。');

// 直观地看一眼爆栈现场（try/catch 接住，进程不会崩）。
try {
  sumRec(1_000_000);
} catch (err) {
  console.log('  直接递归 100 万层 →', err.constructor.name + ':', err.message);
}
console.log('  顺带澄清一个常见误解：**await 不能展开调用栈**。');
console.log('    async 函数里的 await rec(n - 1)，rec(n-1) 是在同一个 tick 里同步发起的，');
console.log('    栈照样长上去（本文件没有演示这段，因为 Node 会打印内部噪声；');
console.log('    单独实测的上限约 8800 层，与同步递归同一量级）。');

console.log('--- 3. 朴素解法：改成循环 / 显式栈 ---');

// 方案一：平铺数据 → 循环最直接，也最快。
// 缺点：只能处理"线性"的数据；遇到树还是要自己想办法。
const sumLoop = (n) => {
  let acc = 0;
  for (let i = 1; i <= n; i++) acc += i;
  return acc;
};
console.log('  方案一 · 循环：sum(1..1000000) =', sumLoop(1_000_000), '（不会爆栈，而且最快）');

// 方案二：树 → 用数组当显式栈，自己模拟递归。
// 能跑通任意深度，但代码的重心从"做什么"偏到了"怎么走"。
const countTreeIterative = (root) => {
  const stack = [root];
  let count = 0;
  while (stack.length > 0) {
    const node = stack.pop();
    count++;
    for (const child of node.reports) stack.push(child);
  }
  return count;
};
console.log('  方案二 · 显式栈：同一棵组织架构树 →', countTreeIterative(orgTree), '个节点（结果一致）');
console.log('  ★ 显式栈的代价：访问顺序被反转了（要用 push/reverse 或改成队列来修正）、');
console.log('    中间状态要自己管，递归里那种"一个函数对应一个结构"的对应关系消失了。');
console.log('  我们想要的是：既不爆栈，又能保持递归的写法 —— 那就是蹦床。');

console.log('--- 4. 蹦床：把"调用自己"改成"返回下一步的函数" ---');

// 核心约定只有两条：
//   · 递归函数返回一个**零参函数** → 表示"还没算完，请再弹一次"
//   · 返回一个**非函数值**     → 表示"算完了，这就是结果"
// 驱动器（蹦床）负责不停地弹，直到拿到非函数值。
let bounceCount = 0; // 演示用的计数器，数一数一共弹了多少次
const trampoline = (fn) => (...args) => {
  let result = fn(...args);
  bounceCount = 0;
  while (typeof result === 'function') {
    result = result(); // ★ 关键：上一次调用已经返回了，栈没有增长
    bounceCount++;
  }
  return result;
};

// 把"求和"改写成蹦床版：
// 原来是 `n + sumRec(n - 1)`（调用后还要做加法，栈必须等着），
// 现在把"累加"挪到参数里（acc），递归调用变成"返回一个 thunk"。
const sumTrampolined = trampoline(function go(n, acc) {
  return n <= 0 ? acc : () => go(n - 1, acc + n); // ← 注意是"返回"，不是"调用"
});
const trampolineSum = sumTrampolined(1_000_000, 0);
console.log('  蹦床求和 1..1000000 →', trampolineSum, '（弹了', bounceCount, '次）');
console.log('    与循环的结果一致吗？', trampolineSum === sumLoop(1_000_000));
console.log('  ★ 这就是它不会爆栈的原因：每一次 go() 都已经 return 了，');
console.log('    栈上永远只有"蹦床 + 当前这一个 thunk"两层，与递归深度无关。');

// 对比一下产物：同样是"1 到 100 万求和"，三种写法的结果与可行性。
console.log('  ── 同样是 100 万层递归 ──');
console.log('    直接递归      → RangeError（上面已经看过现场了）');
console.log('    蹦床          →', trampolineSum, '（正确）');
console.log('    循环          →', sumLoop(1_000_000), '（正确）');

console.log('--- 5. 真实场景：深度不可控的深层结构 ---');

// 场景：一份"深度不可控"的嵌套数据（用户上传的 JSON、目录树、评论楼中楼）。
// 这里用一个退化成链表的树来模拟极端情况 —— 深度 3 万，远超刚才量出来的栈上限。
const CHAIN_DEPTH = 30_000;
const makeDeepTree = (depth) => {
  let node = { name: `leaf-${depth}`, children: [] };
  for (let i = depth - 1; i >= 0; i--) node = { name: `node-${i}`, children: [node] };
  return node;
};
const deepTree = makeDeepTree(CHAIN_DEPTH);
console.log(`  构造一棵深度 ${CHAIN_DEPTH} 的树（每个节点只有一个孩子，模拟最坏情况）。`);

// 方案 A：直接递归 —— 深度超过一万就会炸。
const countTreeRec = (node) => node.children.reduce((sum, c) => sum + countTreeRec(c), 1);
try {
  countTreeRec(deepTree);
} catch (err) {
  console.log('  方案 A · 直接递归 →', err.constructor.name + ':', err.message);
}

// 方案 B：蹦床 + CPS（延续传递风格）。
// 分支递归不能直接蹦床，因为"算完孩子还要加上自己"这一步卡在中间了。
// 解法是把"剩下的活"显式写成参数 k，让每个分支都落在函数体的最后一步：
//   · k 一开始是"把结果返回给调用者"（(x) => x）；
//   · 每一步都构造一个新的 k，把"后面要干的活"攒进闭包里；
//   · 于是栈不增长，被推迟的活全在堆上的闭包里排着队。
const sumTreeCPS = (node, k) => () => {
  // 没有孩子：本节点的值就是全部，直接交给延续
  if (node.children.length === 0) return k(1);
  // 有孩子：先算孩子的结果，再加上自己 —— 但"加上自己"被包装成了新的延续
  return sumChildrenCPS(node.children, 0, 0, (childSum) => k(1 + childSum));
};
const sumChildrenCPS = (children, i, acc, k) => () => {
  if (i >= children.length) return k(acc); // 所有孩子都算完了，把汇总结果交给延续
  return sumTreeCPS(children[i], (childSum) => sumChildrenCPS(children, i + 1, acc + childSum, k));
};
const countTreeTramp = trampoline(sumTreeCPS);
const trampResult = countTreeTramp(deepTree, (x) => x);
console.log('  方案 B · 蹦床 + CPS →', trampResult, `（弹了 ${bounceCount} 次，结果正确：${trampResult === CHAIN_DEPTH + 1}）`);

// 方案 C：显式栈循环 —— 最快，但代码已经看不出"树"的形状了。
const countTreeLoop = (root) => {
  const stack = [root];
  let count = 0;
  while (stack.length > 0) {
    const node = stack.pop();
    count++;
    for (const child of node.children) stack.push(child);
  }
  return count;
};
console.log('  方案 C · 显式栈循环 →', countTreeLoop(deepTree), '（结果相同，而且最快）');

// 性能对比：蹦床比循环慢，因为它每一步都要分配一个闭包。
const bench = (label, fn) => {
  const t0 = performance.now();
  const value = fn();
  console.log(`    ${label} → ${value}（${(performance.now() - t0).toFixed(1)}ms）`);
};
console.log('  性能对比（受机器状态影响，看量级即可）：');
bench('显式栈循环  ', () => countTreeLoop(deepTree));
bench('蹦床 + CPS  ', () => countTreeTramp(deepTree, (x) => x));
console.log('  ★ 蹦床的代价是真实存在的：每弹一次要分配一个闭包。');
console.log('    它换来的是"不会爆栈"和"保持递归的写法"，这是一笔明确的交易。');

console.log('--- 6. 三种方案的对比与选型 ---');

console.log('  维度            直接递归              显式栈循环            蹦床 + CPS');
console.log('  代码形状        与数据结构同构        看不出结构            与数据结构同构');
console.log('  栈安全          深度约 1 万就爆       任意深度              任意深度');
console.log('  速度            最快                  最快                  慢（每步分配闭包）');
console.log('  内存            栈帧（小且会爆）      自己维护的数组        堆上的闭包（更大但安全）');
console.log('  改写难度        不需要                中（要自己管遍历顺序） 高（要理解 CPS）');
console.log('  典型用途        深度已知且很小        热路径、大数据量      深度不可控且想保留递归表达');
console.log('');
console.log('  选型决策：');
console.log('    1) 深度有保证（比如深度 ≤ 100 的配置树）→ 直接递归，别给自己加戏；');
console.log('    2) 深度不可控、且在性能热点上 → 显式栈循环（或者把数据拍平，见下）；');
console.log('    3) 深度不可控、且希望保留递归的表达力（比如递归下降解析器）→ 蹦床 + CPS；');
console.log('    4) 还有两个更省心的替代方案值得先想一遍：');
console.log('       · 把递归结构改成**迭代式数据结构**（链表 → 数组、树 → 带 parent 指针的扁平表），');
console.log('         往往一次性消灭整个问题 —— 这是工程上最优先考虑的方案；');
console.log('       · 用**生成器**写惰性遍历（见 17_iterators_and_generators/），');
console.log('         它同样把"位置"保存在堆上的对象里，而不是栈帧里；');
console.log('       · 异步场景里可以借助事件循环来"展开栈"（比如把每层递归包成 queueMicrotask），');
console.log('         但那会带来性能与可读性的双重代价，通常不如蹦床。');

console.log('--- 7. 小结 ---');
console.log('  递归是 FP 的基本功：fold 是它的封装，自相似结构（树/JSON/目录）靠它才写得漂亮。');
console.log('  JS 没有尾调用优化：V8 从未实现 PTC，尾递归写法照样爆栈（本文件实测过）。');
console.log('  调用栈上限只有大约一万层的量级 —— 而现实中深度常常不可控，所以必须防。');
console.log('  蹦床 = 手动版 TCO：递归函数返回"下一步的函数"，驱动器 while 循环弹到结果为止。');
console.log('  分支递归要用 CPS 改写（把剩下的活作为延续 k 传下去），才能被蹦床驱动。');
console.log('  三种方案：直接递归最好写但会爆；显式栈最快但难写；蹦床慢一些但两者兼顾。');
console.log('  最优先考虑的方案其实是第四种：把数据结构改成迭代式的，让问题不必存在。');
console.log('  也见：');
console.log('    06_functions/10_recursion.js —— 递归的基础（基线条件、调用栈）；');
console.log('    08_arrays/10_reduce.js —— fold 的用法，本文件第 1 节的起点；');
console.log('    17_iterators_and_generators/ —— 用生成器写惰性遍历的替代路线；');
console.log('    38_algorithms_and_data_structures/03_stack_and_queue.js —— 显式栈的实现细节；');
console.log('    GLOSSARY 的 Tail Call / Tail Call Optimization / Stack Overflow 词条。');
console.log('');
console.log('  本目录（40_functional_programming）到此结束。整条脉络回顾：');
console.log('    01 函子      —— 值可以被装进容器里变换而不破坏结构；');
console.log('    02 Maybe     —— 容器多了一种"可能没有值"的状态，缺失自动短路；');
console.log('    03 Either    —— 失败本身也是值，可以带着信息流动；');
console.log('    04 Monad     —— 变换函数自己也返回容器时，用 chain 拍平；');
console.log('    05 point-free—— 这些抽象如何组织成可复用的管道（以及代价）；');
console.log('    06 ADT       —— 回头看清这些容器其实都是和类型；');
console.log('    07 transducer—— 把 map/filter 合成一个 reducer：一趟遍历、可组合（含 Monoid 前提）；');
console.log('    08 IO/Task   —— 副作用如何变成可组合的值：描述与执行分离；');
console.log('    09 不可变    —— 结构共享、引用相等、浅比较——FP 在前端落地的地基；');
console.log('    10 蹦床      —— 递归的表达力 + 不爆栈的落地手段（本文件）。');
