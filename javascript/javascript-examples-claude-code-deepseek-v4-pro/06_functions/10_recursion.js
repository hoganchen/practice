/**
 * ============================================================================
 * 知识点：递归 —— 阶乘、斐波那契、尾递归概念、递归深度限制
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】进阶
 * 【前置知识】06_functions/08_higher_order_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    递归（recursion）就是"函数直接或间接地调用自己"。
 *    任何递归都必须包含两部分：
 *      基线条件（base case）：什么时候停下来，不再递归。缺了它就会无限递归。
 *      递归条件（recursive case）：把问题缩小一点，再交给自己。
 *
 * 2. 为什么需要
 *    有些问题天生就是"自相似"的：树/目录结构的遍历、JSON 的深层查找、
 *    数学上的阶乘与斐波那契、分治算法（快排、归并）。用循环写这些代码
 *    往往要手动维护一个栈；用递归写，代码几乎就是把定义直接翻译过来，
 *    可读性高得多。
 *
 * 3. 核心语法要点
 *    (1) 必须有基线条件，并且每次递归都要"朝着基线条件靠近"。
 *    (2) 每一次函数调用都会在调用栈上压入一个栈帧；递归太深会抛
 *        RangeError: Maximum call stack size exceeded。
 *    (3) 尾递归：递归调用是整个函数的"最后一步操作"（调用结果直接返回、
 *        不再参与任何运算）。理论上可以被尾调用优化（TCO）成循环、只复用
 *        同一个栈帧，于是空间复杂度从 O(n) 变成 O(1)。
 *        【重要事实】ES2015 规范曾经要求实现 TCO（严格模式下必须做），
 *        但 V8（Node.js / Chrome 的引擎）出于调试体验与性能权衡【始终没有实现】。
 *        所以：写了尾递归，该爆栈还是会爆栈。不要把尾递归当成防爆栈的手段。
 *    (4) 递归往往比等价循环慢（函数调用有开销），但可以通过记忆化改善。
 *    (5) 递归也可以用"显式栈 + 循环"改写，避免爆栈。
 *        ——这才是"深度不可控"场景下真正可用的方案。
 *
 * 4. 常见陷阱
 *    - 忘了基线条件 / 基线条件永远到不了 → 栈溢出。
 *    - 朴素斐波那契的时间复杂度是 O(2^n)，n=40 就已经明显卡顿。
 *    - 【最常见的误解】以为写了尾递归就不会爆栈。
 *      V8 并没有实现尾调用优化（TCO），尾递归写法在 V8 里和普通递归一样压栈。
 *      这个误解会直接导致生产环境里的 RangeError 崩溃，本示例第 5 节专门澄清。
 *    - 在循环里做深递归，把栈深度叠加起来，更容易溢出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/10_recursion.js
 *
 * 【预期输出】
 *   演示阶乘的递归与循环实现、朴素与记忆化斐波那契的对比、
 *   尾递归的完整澄清（概念 + ES2015 规范历史 + V8 未实现的实证 +
 *   正确的替代方案）、以及真实触发栈溢出并被捕获的完整过程。
 *   所有栈溢出都已在文件内部 try/catch 捕获，进程始终以退出码 0 结束。
 * ============================================================================
 */

console.log('--- 1. 递归三要素：阶乘 ---');

// 数学定义：n! = n × (n-1)!，且 0! = 1。
// 这段代码几乎是数学定义的直译。
function factorial(n) {
  // 基线条件：0! 和 1! 都等于 1，到此为止，不再调用自己。
  if (n <= 1) return 1;
  // 递归条件：把 n 缩小为 n-1，问题规模在变小。
  return n * factorial(n - 1);
}
console.log('  factorial(0)  →', factorial(0));
console.log('  factorial(1)  →', factorial(1));
console.log('  factorial(5)  →', factorial(5), '（5×4×3×2×1）');
console.log('  factorial(10) →', factorial(10));

// 等价的循环写法：C 语言风格，代码更"手动"。
function factorialLoop(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}
console.log('  循环版 factorialLoop(10) →', factorialLoop(10), '（结果相同，但思路不同）');

console.log('--- 2. 递归的展开过程（把调用栈画出来） ---');

// 用一个"缩进"参数把递归的进入/返回过程可视化。
function factorialTraced(n, depth = 0) {
  const indent = '  '.repeat(depth + 2);
  console.log(`${indent}进入 factorialTraced(${n})`);
  if (n <= 1) {
    console.log(`${indent}命中基线条件，返回 1`);
    return 1;
  }
  const sub = factorialTraced(n - 1, depth + 1);
  const result = n * sub;
  console.log(`${indent}${n} × ${sub} = ${result}，返回`);
  return result;
}
console.log('  factorialTraced(4) 的调用过程：');
console.log('  最终结果 →', factorialTraced(4));

console.log('--- 3. 斐波那契：朴素递归的性能陷阱 ---');

// 定义：F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2)
// 这段代码的调用次数是指数级增长的：每次调用都分裂成两次。
function fibNaive(n) {
  if (n < 2) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

// 用一个计数器把"重复计算"量化出来。
let callCount = 0;
function fibCounted(n) {
  callCount++;
  if (n < 2) return n;
  return fibCounted(n - 1) + fibCounted(n - 2);
}

console.log('  朴素递归：');
for (const n of [10, 20, 25]) {
  callCount = 0;
  const value = fibCounted(n);
  console.log(`    fib(${n}) = ${value}，函数被调用了 ${callCount} 次`);
}
console.log('  注意 fib(20) 只要 6765 的结果却调用了上万次 —— 存在大量重复子问题。');

// 迭代版：O(n) 时间、O(1) 空间，快得多。
function fibIterative(n) {
  let a = 0;
  let b = 1;
  for (let i = 0; i < n; i++) {
    [a, b] = [b, a + b];
  }
  return a;
}
console.log('  迭代版：');
for (const n of [10, 20, 25, 80]) {
  console.log(`    fib(${n}) = ${fibIterative(n)}`);
}

console.log('--- 4. 记忆化递归：递归的优雅 + 迭代的效率 ---');

// 用一个 Map 缓存已经算过的结果，把指数复杂度降成线性。
function fibMemo(n, cache = new Map()) {
  if (n < 2) return n;
  // 先查缓存：这就是"记忆化（memoization）"，本质是空间换时间。
  if (cache.has(n)) return cache.get(n);
  const value = fibMemo(n - 1, cache) + fibMemo(n - 2, cache);
  cache.set(n, value);
  return value;
}

let memoCallCount = 0;
function fibMemoCounted(n, cache = new Map()) {
  memoCallCount++;
  if (n < 2) return n;
  if (cache.has(n)) return cache.get(n);
  const value = fibMemoCounted(n - 1, cache) + fibMemoCounted(n - 2, cache);
  cache.set(n, value);
  return value;
}

console.log('  记忆化递归：');
for (const n of [10, 20, 25]) {
  memoCallCount = 0;
  const value = fibMemoCounted(n);
  console.log(`    fib(${n}) = ${value}，函数被调用了 ${memoCallCount} 次（线性级别）`);
}
console.log('  fibMemo(80) →', fibMemo(80), '（朴素递归算这个要等到天荒地老）');

console.log('--- 5. 尾递归与尾调用优化（TCO）：概念、规范与 V8 的真相 ---');

// 5.1 什么是"尾调用"：一个函数的最后一步动作，是"调用另一个函数并把结果直接返回"。
//     注意关键词是【最后一步】：调用完就立刻返回，返回之后自己什么都不用做了。
function tailCallExample(n) {
  return Math.abs(n); // ← 尾调用：调完 Math.abs 直接把结果返回，自己无事可做
}
function nonTailCallExample(n) {
  return Math.abs(n) + 1; // ← 不是尾调用：abs 返回后还要再做一次加法
}
console.log('  尾调用示例     tailCallExample(-3)    →', tailCallExample(-3));
console.log('  非尾调用示例   nonTailCallExample(-3) →', nonTailCallExample(-3));

// 5.2 为什么理论上尾调用可以复用栈帧
//
//     普通调用：调用方要"记住自己接下来还要干什么"（返回地址、局部变量），
//     所以必须把自己的栈帧留在栈上，被调用方在它上面新建一个栈帧。
//     于是"调用层级"就等于"栈帧数量"，栈是线性增长的：
//
//        factorialNonTail(3) 的栈： [3] → [3,2] → [3,2,1]   （三层，同时存在）
//
//     尾调用：调用方发现"我调用完就把结果原样返回，返回后没有任何事要做"，
//     那么它自己的栈帧（返回地址、局部变量）就【完全没用了】。
//     这时引擎可以把自己的栈帧直接【替换】成被调用方的栈帧，而不是在上面叠加：
//
//        factorialTail(3, 1) 的栈： [3,acc=1] → 原地替换 → [2,acc=3] → [1,acc=6]
//        任何时刻栈上都只有【一层】。
//
//     这个"用自己的帧换掉对方的帧"的动作，就叫【尾调用优化】（TCO, Tail Call Optimization）。
//     当尾调用恰好是"函数调用自己"（尾递归）时，效果最直观：
//     递归深度变成了常数，空间复杂度从 O(n) 降到 O(1)，一亿层也不会爆栈。
//
//     用代码来表达这个差别：
//     · 非尾递归：递归结果还要参与 n * ... 的运算，所以当前帧必须留下等结果。
function factorialNonTail(n) {
  if (n <= 1) return 1;
  return n * factorialNonTail(n - 1); // ← 外面还包着乘法，返回后还要算，不是最后一步
}
//     · 尾递归：把"累积结果"作为参数一路传下去，递归调用就是最后一步操作。
function factorialTail(n, acc = 1) {
  if (n <= 1) return acc;
  return factorialTail(n - 1, n * acc); // ← 递归调用即最后一步，结果直接原样返回
}
console.log('');
console.log('  非尾递归 factorialNonTail(5) →', factorialNonTail(5));
console.log('  尾递归   factorialTail(5)    →', factorialTail(5), '（结果相同，但写法不同）');
console.log('  两者逻辑等价，区别只在于"递归调用是不是最后一步"。');

// 5.3 ES2015 规范的历史：规范要求过，但 V8 没做
//
//     · 2015 年发布的 ECMAScript 2015（ES6）规范，把【严格模式下的尾位置调用】
//       规定为必须做尾调用优化（规范里的术语叫 Proper Tail Calls，PTC）。
//       也就是说：规范曾经真的【强制要求】引擎实现它，不是"可选优化"。
//     · 但实践很快就发现这个要求代价很大：
//         - 调试体验崩坏：栈帧被复用后，调用栈上看不到"这层函数是谁调用的"，
//           Chrome DevTools 里会丢失整段中间栈，报错信息也难以定位；
//         - 引擎内部实现成本高：V8 的优化编译器（TurboFan）需要额外的
//           "栈帧替换"支持，还要处理 arguments / caller / 调试钩子等边界情况；
//         - 收益场景太窄：真正会被写成深尾递归的业务代码非常少，
//           而绝大多数开发者不会依赖它。
//     · 结果：V8（Chrome / Node.js）、SpiderMonkey（Firefox）、
//       JavaScriptCore（Safari）都【没有实现】TCO。
//       2016 年 TC39 甚至把 PTC 从规范里移除，退回到"引擎可以不做"的状态。
//       （Safari 曾经短暂实现过，后来也移除了。）
//
//     一句话记法：**尾递归在 V8 里只是"写法"，不是"优化"。**

console.log('');
console.log('  规范与实现的历史（重要，请记住结论）：');
console.log('   · ES2015 曾在严格模式下【要求】引擎实现尾调用优化（PTC）；');
console.log('   · 由于调试体验受损 + 实现成本高 + 实际收益窄，');
console.log('     V8 / Node.js / Chrome 决定【不实现】它；');
console.log('   · 其它主流引擎（Firefox、Safari）同样没有实现；');
console.log('   · 后来 TC39 把这条强制要求撤回，规范改为"可选"。');
console.log('  结论：在 Node.js 和浏览器里，尾递归【不会】节省栈帧。');

// 5.4 实证一：尾递归函数在小规模上正常，规模一大依然爆栈
//
//     如果 TCO 生效，下面这个调用在栈上只会占 1 层，无论多大的 n 都不会爆栈。
//     实测结果会告诉你真相。
console.log('');
console.log('  实证：尾递归函数在大规模下依然爆栈');

// 为了让结果不会溢出成 Infinity（那样不好判断"到底跑没跑通"），
// 这里用一个尾递归求和函数：结果是有界的，一旦爆栈必然是抛异常而不是数值溢出。
function sumTail(n, acc = 0) {
  if (n === 0) return acc;
  return sumTail(n - 1, acc + n); // ← 尾调用：递归结果直接返回，没有后续运算
}
console.log('  校验：sumTail(100) =', sumTail(100), '（正确答案 5050，确认函数本身逻辑无误）');

for (const n of [1_000, 10_000]) {
  try {
    const value = sumTail(n);
    console.log(`    规模 ${n.toLocaleString('en-US').padStart(9)} → 正常返回，sum = ${value}`);
  } catch (err) {
    console.log(`    规模 ${n.toLocaleString('en-US').padStart(9)} → ${err.constructor.name}: ${err.message}`);
  }
}

let tailOverflowed = false;
try {
  const value = sumTail(200_000);
  console.log(`    规模   200,000 → 正常返回，sum = ${value}`);
  console.log('    说明本环境实现了 TCO（罕见，非主流引擎行为）');
} catch (err) {
  tailOverflowed = true;
  console.log(`    规模   200,000 → ${err.constructor.name}: ${err.message}`);
  console.log('    ↑ 这就是证据：尾递归写法在 V8 里同样会爆栈，TCO 没有生效。');
  console.log('      栈上依然压了 20 万个栈帧，说明"尾递归"只是语法形式，没有换来栈帧复用。');
}

// 5.5 实证二：把"尾递归"和"显式栈/循环"放在一起对比
//     同样的 20 万次迭代，一个用尾递归（爆栈），一个用循环（毫无压力）。
console.log('');
console.log('  对照实验：同样迭代 200,000 次，两种写法的结果');
console.log(`   · 尾递归写法  → ${tailOverflowed ? '抛出 RangeError（栈溢出）' : '侥幸通过'}`);
console.log('   · 循环写法    → 开始执行…');

// 循环版本：不压栈，用局部变量迭代，20 万次也是瞬间完成。
function sumLoopLarge(n) {
  let acc = 0;
  for (let i = 1; i <= n; i++) acc += i;
  return acc;
}
const loopSum = sumLoopLarge(200_000);
console.log('   · 循环写法    → 正常返回，sum =', loopSum, '（与尾递归版的目标结果完全一致）');
console.log('   结论：改成循环后，同样的计算量不再有任何栈压力。');
console.log('   （顺带一提：两种写法的运算次数完全相同，差别只在"状态放栈上还是放堆/变量上"。）');

// 5.6 那尾递归写法还有意义吗？——注意这个"度"的问题
//
//     虽然在 V8 里不会省栈，但尾递归的【写法】本身仍然有两个正面价值：
//       1) 累积参数（acc）把中间状态变成了显式参数，逻辑更清晰，
//          而且把递归调用放在了最后一步，语义上更容易被改写成循环；
//       2) 换成支持 TCO 的语言（Scheme、部分函数式语言）时，这段代码天然受益。
//     但在 JavaScript 里，它【不能】作为"防止爆栈"的手段。

// 5.7 实践中该怎么做（按推荐度排序）
console.log('');
console.log('  深度不可控时，正确的替代方案（按推荐度排序）：');
console.log('   ① 优先改写成循环 —— 最简单、最快、零栈风险；');
console.log('      上面的 sumLoopLarge 就是例子。');
console.log('   ② 用"显式栈 + while 循环" —— 保留递归的思考方式，但把栈搬到堆上（见第 7 节）；');
console.log('      适合树/图的深度优先遍历这类"结构上就是递归"的问题。');
console.log('   ③ 用显式队列做广度优先（BFS）—— 层序遍历场景比递归更合适；');
console.log('   ④ 分治类问题可以配合"手动分块 + 迭代归并"控制深度；');
console.log('   ⑤ 绝对不要做的事：靠 --stack-size 调大栈上限来"解决"深度问题 ——');
console.log('      这只是把崩溃点推后，栈内存是有限的（默认约 1MB 量级，');
console.log('      具体值因 Node 版本与平台而异），而且深栈本身就会拖慢速度、');
console.log('      在浏览器里你还没有这个开关可用。');

// 5.8 一句话总结
console.log('');
console.log('  【本节结论】尾调用优化是一个"理论上很美、规范曾要求、但主流引擎都没做"的特性。');
console.log('   在 Node.js / 浏览器里，尾递归和普通递归一样会压栈、一样会爆栈。');
console.log('   把它当成防爆栈手段是错误认知；需要深度安全时请用循环或显式栈。');

console.log('--- 6. 递归深度限制：真实触发一次栈溢出 ---');

// 一个没有基线条件的自调用函数（通过参数控制深度，方便观察）。
function countdown(n) {
  if (n === 0) return '到底了';
  return countdown(n - 1);
}

// 先找一个能安全跑完的深度。
console.log('  深度 1000    →', countdown(1000), '（安全）');
console.log('  深度 10000   →', countdown(10000), '（安全）');

// 再用一个极大的深度触发 RangeError，并在文件内部捕获（绝不允许抛到顶层）。
try {
  countdown(1_000_000);
  console.log('  深度 1000000 竟然没爆栈？');
} catch (err) {
  console.log('  深度 1000000 → 报错类型：', err.constructor.name);
  console.log('  错误信息：', err.message);
  console.log('  含义：调用栈的栈帧数量有上限，达到上限就抛 RangeError 而不是静默失败。');
}

// 顺便看看到底能到多深（用二分式的探测：从大往小找）。
let maxSafe = 0;
for (const depth of [50_000, 20_000, 15_000, 12_000, 11_000, 10_500]) {
  try {
    countdown(depth);
    maxSafe = depth;
    break;
  } catch {
    // 爆栈了就继续试更小的深度。
  }
}
console.log(`  在当前 Node 版本与默认栈大小下，本示例能跑通的最大测试深度约为 ${maxSafe}`);
console.log('  提示：栈上限与 Node 版本、函数内局部变量多少有关，可以用 --stack-size 调整，但通常应改用循环。');

console.log('--- 7. 用"显式栈 + 循环"改写递归，彻底避免爆栈 ---');

// 递归本质上是在用"调用栈"保存中间状态；我们也可以在数组里自己维护一个栈。
function countdownIterative(n) {
  const stack = [n];
  let last = null;
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === 0) {
      last = '到底了';
      continue;
    }
    stack.push(current - 1);
  }
  return last;
}
console.log('  countdownIterative(1000000) →', countdownIterative(1_000_000), '（百万层也不爆栈）');

// 更常见的做法：直接把递归改成普通循环。
function factorialLoopAgain(n) {
  let acc = 1;
  for (let i = 2; i <= n; i++) acc *= i;
  return acc;
}
console.log('  阶乘改成循环：factorialLoopAgain(20) →', factorialLoopAgain(20));

console.log('--- 8. 递归的适用场景小结 ---');
console.log('  适合递归：树/目录遍历、分治（快排/归并）、回溯（走迷宫、N 皇后）、');
console.log('            数学上的自相似定义、JSON 深层查找。');
console.log('  不适合递归：线性递推（求和、阶乘）→ 用循环更省内存；');
console.log('              有大量重叠子问题（斐波那契）→ 用记忆化或动态规划；');
console.log('              深度不可控的场景 → 用显式栈或循环。');
