/**
 * ============================================================================
 * 知识点：Transducer（转换器）—— 把 map/filter 组合成一个 reducer
 * ============================================================================
 *
 * 【所属分类】40_functional_programming —— 函数式编程进阶
 * 【难度等级】高级
 * 【前置知识】40_functional_programming/05_point_free_and_pipeline.js、08_arrays/10_reduce.js、08_arrays/21_chaining_practice.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    transducer = transform + reducer，直译"转换器"。它的签名长这样：
 *        xf :: reducer -> reducer
 *    也就是"接收一个 reducer，返回一个新的 reducer"的函数。
 *    注意这层意思：transducer 操作的**不是数据，而是"处理数据的方式"**。
 *    把 map / filter / take 从"数组上的方法"改写成"reducer 的包装器"之后，
 *    多个步骤就能用普通的函数组合（compose）拼成一个整体，交给一次 reduce 执行：
 *    数据只走一趟、不产生任何中间数组。
 *    名字与概念来自 Rich Hickey 2014 年为 Clojure 1.7 引入的 transducer（转换器）。
 *
 * 2. 为什么需要
 *    05 号文件第 8 节已经实测过链式写法的代价：`.map().filter().map().filter()`
 *    每一步都完整遍历上一步的输出、每一步都产出一个新数组。那个文件也如实承认了
 *    "手写一个大 reduce 可以一趟走完"，但**没有给出可复用的做法** ——
 *    手写 reduce 的循环体把"取属性、判偶数、乘 2、判整除"全揉在一起，
 *    换一个过滤条件就得重抄一遍整个循环。这是本文件要补上的那一块：
 *    既要 reduce 的性能（一趟遍历、零中间数组），又要 map/filter 的可组合性
 *    （每一小步能单独复用、能像搭积木一样重组）。
 *
 * 3. 核心语法要点
 *    (1) reducer：聚合函数，签名 `(acc, x) => acc'`（reduce 的回调就是这个）。
 *    (2) transducer：`(reducer) => (acc, x) => acc'`，即"包一层 reducer"。
 *    (3) transduce(xf, reducer, init, coll)：驱动函数，用被包装后的 reducer
 *        对 coll 做一次 reduce。coll 可以是任何可迭代对象（数组、Set、Map、
 *        generator），这正是 transducer 比数组方法更通用的地方。
 *    (4) compose：组合多个 transducer。与 pipe 里的 compose 是同一个组合子，
 *        但**数据流向看起来是反的**（用 compose 写，数据却从左往右流），
 *        原因见第 5 节 —— 这是 transducer 最容易劝退人的一个点。
 *    (5) Reduced 哨兵：让 take 这类"提前结束"的转换能中断整条 reduce，
 *        这是 transducer 支持短路（以及处理无限序列）的关键机制。
 *
 * 4. 常见陷阱
 *    - 以为 transducer 会减少回调的调用次数。**不会**：同样四个步骤、同样 10 万条
 *      数据，回调总调用次数两者完全一样（30 万次，见第 6 节实测）。
 *      它省掉的是**中间数组的分配与元素搬运**，以及配合 take 时的短路。
 *    - 以为用了 transducer 就一定能跑得更快。在这个量级下耗时可能持平甚至更慢
 *      （多了一层闭包调用），真正的收益在大数据量的内存占用和短路场景上。
 *    - 有状态的 transducer（take / drop / distinct）如果状态放错闭包层级，
 *      第二次复用就会拿到空结果 —— 第 7 节有反面示例。
 *    - 组合顺序想当然。transducer 的 `compose(map, filter)` 里，
 *      **map 先作用于数据、filter 后作用**，与数学上 compose(f, g) = f(g(x))
 *      的直觉相反（见第 5 节的推导）。
 *    - 忘了它的代数前提：只有当 reducer 满足结合律（并有单位元，即构成 Monoid）时，
 *      "分组、换初始值、并行化"才是安全的（见第 8 节，含一个减法反例）。
 *    - 在只有两三个步骤、数据量几千条的场合强行上 transducer：可读性代价远大于收益。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 40_functional_programming/07_transducer.js
 *
 * 【预期输出】
 *   先量化链式写法的两项开销（元素访问次数、中间数组与元素搬运次数），
 *   再展示"手写一个 reduce"解决了性能却丢了组合性；
 *   然后从 reducer 出发推导出 transducer，手写 map/filter/take 三个转换器、
 *   compose 组合子与 transduce 驱动函数；
 *   用同一个计数器做三方实测对比（链式 / 手写 reduce / transducer），
 *   演示 take 的短路与无限序列、跨集合复用、状态复用陷阱；
 *   最后讲清它成立的代数前提：reduce 的结合律与单位元（Monoid）。
 * ============================================================================
 */

console.log('--- 1. 先把问题量化：链式写法到底贵在哪 ---');

// 复习 05 号文件第 8 节的结论：链式 map/filter 每一步都完整遍历上一步的输出。
// 这里换一种更精确的量法 —— 不再只数"元素访问次数"，
// 而是分别数清楚三件事：
//   reads  —— 从某个数组里读出了多少个元素
//   writes —— 往新数组里写了多少个元素
//   arrays —— 一共分配了几个新数组
// 遍历次数 = reads，而 reads + writes 就是"元素在内存里被搬运的总次数"，
// 这才是中间数组真正的成本所在（分配 + 写入 + 之后再读回来）。
const meter = { reads: 0, writes: 0, arrays: 0, calls: 0 };
const resetMeter = () => {
  meter.reads = 0;
  meter.writes = 0;
  meter.arrays = 0;
  meter.calls = 0;
};
const report = (label) =>
  `${label}：reads=${meter.reads}  writes=${meter.writes}  中间数组=${meter.arrays}  回调调用=${meter.calls}`;

// 给原生 map/filter 包一层，用来记账。
// 注意"一进一出"：读进 arr.length 个元素，可能有更少的元素被写进新数组（filter 会丢）。
const countedMap = (arr, f) => {
  meter.reads += arr.length;
  const out = arr.map((x) => {
    meter.calls++;
    return f(x);
  });
  meter.writes += out.length;
  meter.arrays++;
  return out;
};
const countedFilter = (arr, pred) => {
  meter.reads += arr.length;
  const out = arr.filter((x) => {
    meter.calls++;
    return pred(x);
  });
  meter.writes += out.length;
  meter.arrays++;
  return out;
};

const bigData = Array.from({ length: 100_000 }, (_, i) => ({ v: i }));
const isEven = (n) => n % 2 === 0;
const divBy3 = (n) => n % 3 === 0;

// 需求：取出 v 为偶数的项，把 v 翻倍，再只保留能被 3 整除的结果。
resetMeter();
const chained = countedFilter(countedMap(countedFilter(countedMap(bigData, (x) => x.v), isEven), (v) => v * 2), divBy3);
const chainedStat = { ...meter, outLen: chained.length };
console.log('  ' + report('链式写法（10 万条数据、4 步加工）'));
console.log('    第 1 步 map   读 10 万 → 写 10 万（arr1）');
console.log('    第 2 步 filter 读 10 万 → 写 5 万（arr2）');
console.log('    第 3 步 map   读 5 万 → 写 5 万（arr3）');
console.log('    第 4 步 filter 读 5 万 → 写 1.67 万（结果）');
console.log('    结果条数 →', chained.length);

console.log('--- 2. 朴素解法：手写一个大 reduce ---');

// 05 号文件给出的正解方向：把四步合并成一个 reduce，一趟走完。
// 好处是显而易见的：一次遍历、零中间数组。
resetMeter();
const onePass = bigData.reduce((acc, x) => {
  meter.reads++;
  meter.calls++; // 这里没有"小回调"可分，整个循环体算一次调用
  const v = x.v;
  if (!isEven(v)) return acc;
  const doubled = v * 2;
  if (!divBy3(doubled)) return acc;
  acc.push(doubled);
  meter.writes++;
  return acc;
}, []);
meter.arrays++;
const onePassStat = { ...meter };
console.log('  ' + report('手写单个 reduce'));
console.log('    结果条数 →', onePass.length, '（与链式一致：', onePass.length === chained.length, '）');
console.log('  ★ 性能问题解决了，但组合性没了。看看这段代码的三个致命伤：');
console.log('    1) 不可组合：想再加一步"取前 10 条"，得往循环体里再塞一段逻辑；');
console.log('    2) 不可复用：isEven / divBy3 / 翻倍 被埋在一个循环体里，别的场景用不上；');
console.log('    3) 只能用于数组：换成 Set、Map 或 generator，整个循环要重写。');
console.log('  transducer 要的就是："既有这一趟遍历的性能，又有 map/filter 那样的可组合性"。');

console.log('--- 3. 从 reducer 到 transducer：先看 reducer 是什么 ---');

// reducer 就是 reduce 的第一个参数：把"当前累加值"和"一个元素"合成"新的累加值"。
// 我们把它单独抽出来，给它一个名字，这一步是理解 transducer 的全部关键。
//
// reducer 有两种常见形态：
const sumReducer = (acc, x) => acc + x; // 聚合型：结果是标量
const pushReducer = (arr, x) => {
  arr.push(x);
  return arr;
}; // 收集型：结果还是数组（transduce 默认用它）
console.log('  sumReducer(0, 5)      →', sumReducer(0, 5), '（累加一个值）');
console.log('  pushReducer([1, 2], 3) →', JSON.stringify(pushReducer([1, 2], 3)), '（收集一个值）');
console.log('  [1,2,3,4].reduce(sumReducer, 0) →', [1, 2, 3, 4].reduce(sumReducer, 0));
console.log('  记住 pushReducer 的签名：(累加数组, 元素) => 累加数组。');

// 现在关键的一步：以 map 为例，看看"给每个元素加一层变换"这件事，
// 能不能写成"给 reducer 加一层包装"。
// 原 reducer：(acc, x) => acc'
// map 版      ：(acc, x) => 原reducer(acc, f(x))   ← 先加工 x，再交给原 reducer
// 这个"map 版"自己也是一个 reducer（签名一模一样）。
// 而"制造它的那个东西"，就是 transducer：
const mapT = (f) => (reducer) => (acc, x) => reducer(acc, f(x));
//   ↑ 收一个普通函数     ↑ 收一个 reducer    ↑ 这就是返回的新 reducer
console.log('  mapT 的读法：mapT(f) 是一个函数，它接收 reducer，返回新 reducer。');
console.log('  也就是说 mapT(f) 加工的是"聚合方式"，而不是数据本身。');
console.log('  数据仍然是那个数据，但"聚合时先做一次 f"这个能力被装进了 reducer 里。');

console.log('--- 4. 手写三个转换器：map / filter / take ---');

// (1) map：对每个元素做一次变换后再交给下游。
//     下游没得选，元素一定会到达它。
// (2) filter：先判断，通过才交给下游；不通过就直接返回原累加值（等于"跳过"）。
//     注意这里没有 if/else 两支逻辑分别处理 —— "不通过"就是"什么都不做"。
const filterT = (pred) => (reducer) => (acc, x) => (pred(x) ? reducer(acc, x) : acc);

// (3) take：只放行前 n 个元素，之后要求整条流水线停下来。
//     这是唯一"有状态"的转换器：它必须记住"已经放行了几个"。
//     状态的正确位置在这里 —— 每次 `xf(reducer)` 都重新初始化一次，
//     这样同一个 transducer 可以被反复使用（第 7 节演示放错位置会怎样）。
const Reduced = (value) => ({ __reduced: true, value }); // 短路哨兵
const isReduced = (x) => x !== null && typeof x === 'object' && x.__reduced === true;
const unreduced = (x) => (isReduced(x) ? x.value : x);
const takeT = (n) => (reducer) => {
  let taken = 0; // ← 状态每次驱动时重新开始，所以 transducer 可以复用
  return (acc, x) => {
    if (taken >= n) return Reduced(acc); // 理论上到不了这里，驱动器会先中断
    taken++;
    const next = reducer(acc, x);
    // 取满 n 个之后，把结果打上"已完成"标记，让驱动器停止遍历。
    return taken >= n ? Reduced(next) : next;
  };
};

console.log('  mapT(f)     : (reducer) => (acc, x) => reducer(acc, f(x))');
console.log('  filterT(p)  : (reducer) => (acc, x) => p(x) ? reducer(acc, x) : acc');
console.log('  takeT(n)    : (reducer) => { let taken = 0; ... 取满 n 个就返回 Reduced }');
console.log('  Reduced 是一个哨兵对象：它的出现告诉驱动函数"别再遍历了"。');
console.log('  没有它，take 无法中断上游 —— 这也是 transducer 能处理无限序列的原因。');

console.log('--- 5. 组合与驱动：compose + transduce ---');

// 组合：把多个 transducer 串成一个。
// 推导一遍（很重要，能解释"为什么用 compose 但数据从左往右流"）：
//   composeT(mapT(f), filterT(p))(pushReducer)
//     = mapT(f)( filterT(p)(pushReducer) )        ← reduceRight：右边的先包
//     = 记 filterT(p)(pushReducer) 为 r1，则 mapT(f)(r1) = r2
//   处理元素 x 时：r2(acc, x) = r1(acc, f(x)) = p(f(x)) ? pushReducer(acc, f(x)) : acc
//   看最后那个表达式：**f 先作用，p 后作用**。
//   所以写成 compose(mapT(f), filterT(p)) 时，数据的流向是"从左到右"的 f → p，
//   和 pipe 的手感一致 —— 因为每个 transducer 都把新逻辑插在了"调用下游之前"。
const composeT = (...xfs) => (reducer) => xfs.reduceRight((r, xf) => xf(r), reducer);
// 恒等 transducer：什么都不做。它和 composeT 一起构成一个 Monoid（见第 8 节）。
const identityT = (reducer) => reducer;

// 驱动函数：整个 transducer 体系的执行入口。
// 它做的事非常朴素 —— 用被包装过的 reducer，对集合做一次普通的 reduce。
// 因为它用 for...of 而不是 Array.prototype.reduce，所以任何可迭代对象都能用。
const transduce = (xf, reducer, init, coll) => {
  const step = xf(reducer); // ★ 关键：把 transducer 应用到 reducer 上，得到新 reducer
  let acc = init;
  for (const x of coll) {
    acc = step(acc, x);
    if (isReduced(acc)) return unreduced(acc); // 短路：take 取够了
  }
  return acc;
};

// 最常见的用法：结果是数组。所以给它一个糖：into。
const into = (xf, coll) => transduce(xf, pushReducer, [], coll);

// 小试牛刀：
const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
console.log('  into(filterT(isEven), [1..10])           →', JSON.stringify(into(filterT(isEven), nums)));
console.log('  into(mapT((n) => n * 10), [1..10])       →', JSON.stringify(into(mapT((n) => n * 10), nums)));
console.log('  into(takeT(3), [1..10])                  →', JSON.stringify(into(takeT(3), nums)));
const xfDemo = composeT(filterT(isEven), mapT((n) => n * 10), takeT(2));
console.log('  compose(filterT(偶数), mapT(×10), takeT(2))→', JSON.stringify(into(xfDemo, nums)));
console.log('    逐步验算：1..10 里的偶数 → 2,4,6,8,10；各乘 10 → 20,40,60,80,100；取前 2 个 → 20,40');
console.log('  ★ 注意数据流向：filter 先作用、map 后作用 —— 与 compose 的直觉相反，');
console.log('    这正是 transducer 组合最反直觉的一点，记住"compose 写、从左往右流"。');

console.log('--- 6. 三方实测对比：链式 / 手写 reduce / transducer ---');

// 为了公平对比，transducer 这边也接上同一套计数器：
// 用一层"会计数的可迭代对象"包住数据源，驱动器每拉取一个元素就记一次 reads。
function* countedIter(iter) {
  for (const x of iter) {
    meter.reads++;
    yield x;
  }
}
// 会计数的 pushReducer：每收集一个元素记一次 writes。
const countedPush = (arr, x) => {
  meter.writes++;
  arr.push(x);
  return arr;
};

// 场景 A：完整跑 4 步（与第 1 节的链式写法做同样的事）。
// 这里的四个回调也各自记一次 calls，用来验证"回调次数到底有没有变少"。
resetMeter();
const xfFourSteps = composeT(
  mapT((x) => {
    meter.calls++;
    return x.v;
  }),
  filterT((v) => {
    meter.calls++;
    return isEven(v);
  }),
  mapT((v) => {
    meter.calls++;
    return v * 2;
  }),
  filterT((v) => {
    meter.calls++;
    return divBy3(v);
  }),
);
const transduced = transduce(xfFourSteps, countedPush, [], countedIter(bigData));
meter.arrays++; // 只有最后那个结果数组
const transducedStat = { ...meter };
console.log('  ' + report('transducer（4 步一趟走完）'));
console.log('    结果条数 →', transduced.length, '（与链式一致：', transduced.length === chained.length, '）');
console.log('  ── 对比表（同一份 10 万条数据、同样的 4 步加工）──');
console.log('    方案              reads     writes    中间数组   回调调用');
console.log(`    链式写法          ${String(chainedStat.reads).padEnd(9)} ${String(chainedStat.writes).padEnd(9)} ${String(chainedStat.arrays).padEnd(10)} ${chainedStat.calls}`);
console.log(`    手写 reduce       ${String(onePassStat.reads).padEnd(9)} ${String(onePassStat.writes).padEnd(9)} ${String(onePassStat.arrays).padEnd(10)} ${onePassStat.calls}（循环体只算一次）`);
console.log(`    transducer        ${String(transducedStat.reads).padEnd(9)} ${String(transducedStat.writes).padEnd(9)} ${String(transducedStat.arrays).padEnd(10)} ${transducedStat.calls}`);
console.log('  ★★ 一个反直觉但必须讲清楚的事实：');
console.log('     transducer 并**没有**减少回调的调用次数 —— 元素一旦通过前面的关卡，');
console.log('     后面的每一步都还是要处理它，四个回调合计 30 万次，两者完全相同。');
console.log('     它真正省掉的是"中间数组"：链式要分配 4 个数组、把 30 万元素写进去再读出来，');
console.log('     transducer 只往最终结果里写了 1.67 万次，reads 也降到了 10 万（只读源数据一次）。');
console.log('     省下的是内存分配与内存带宽，不是计算量。这一点被很多介绍文章含糊过去了。');

// 场景 B：配合 take 的短路 —— 这里差距是数量级的。
resetMeter();
const shortChain = countedFilter(countedMap(countedFilter(countedMap(bigData, (x) => x.v), isEven), (v) => v * 2), divBy3).slice(0, 1000);
const shortChainStat = { ...meter };
resetMeter();
const xfShort = composeT(mapT((x) => x.v), filterT(isEven), mapT((v) => v * 2), filterT(divBy3), takeT(1000));
const shortTransduced = transduce(xfShort, countedPush, [], countedIter(bigData));
meter.arrays++;
console.log('  ── 场景 B：只要前 1000 条结果 ──');
console.log(`    链式 + slice(0, 1000)   reads=${shortChainStat.reads}  中间数组=${shortChainStat.arrays}  结果 ${shortChain.length} 条`);
console.log(`    transducer + takeT(1000) reads=${meter.reads}  中间数组=${meter.arrays}  结果 ${shortTransduced.length} 条`);
console.log('    ★ 链式写法**做不到**提前退出：filter 必须先把整个数组过滤完，');
console.log('      slice 才有东西可切 —— 这就是 4 次完整遍历跑不掉的根本原因。');
console.log('      （公平地说：把链式换成手写 for 循环 + break 也能提前退出，');
console.log('        但那又回到了"不可组合"的老问题。transducer 是两者兼得。）');

// 场景 C：无限序列 —— 只有短路机制才可能做到。
function* naturals() {
  let i = 0;
  while (true) yield i++; // 永远不结束的序列
}
const first5EvenSquares = into(composeT(filterT(isEven), mapT((n) => n * n), takeT(5)), naturals());
console.log('  ── 场景 C：无限序列 ──');
console.log('  自然数中前 5 个偶数的平方 →', JSON.stringify(first5EvenSquares));
console.log('    naturals() 是无限 generator，链式写法根本没法起手（它要一个完整数组）；');
console.log('    transducer 只拉取到第 9 个自然数就停了（take 取满 5 个即短路）。');

console.log('--- 7. 陷阱：有状态转换器的复用 ---');

// take / drop / distinct 这类转换器必须"记住"一点状态。
// 状态放在哪一层闭包，决定了这个 transducer 能不能被复用。
// 正确写法（本文件 takeT 采用）：状态放在 `(reducer) => {...}` 里面 ——
// 每次 transduce 调用都会执行一次 xf(reducer)，状态自然是全新的。
const goodTake = takeT(3);
console.log('  正确写法，重复使用同一个 takeT(3)：');
console.log('    第 1 次 →', JSON.stringify(into(goodTake, [1, 2, 3, 4, 5, 6])));
console.log('    第 2 次 →', JSON.stringify(into(goodTake, [1, 2, 3, 4, 5, 6])), '← 依然是前 3 个，因为状态随驱动器重建');

// 反面写法：把状态放在最外层闭包里。看起来只差一行，行为完全不同。
const badTakeT = (n) => {
  let taken = 0; // ✗ 放错层级：这个变量被所有驱动器共享
  return (reducer) => (acc, x) => {
    if (taken >= n) return Reduced(acc);
    taken++;
    const next = reducer(acc, x);
    return taken >= n ? Reduced(next) : next;
  };
};
const badTake = badTakeT(3);
console.log('  错误写法，重复使用同一个 badTakeT(3)：');
console.log('    第 1 次 →', JSON.stringify(into(badTake, [1, 2, 3, 4, 5, 6])));
console.log('    第 2 次 →', JSON.stringify(into(badTake, [1, 2, 3, 4, 5, 6])), '← 空了！taken 还停在上一次的值');
console.log('  结论：写有状态转换器时，状态一律放在 `(reducer) =>` 这一层里面，');
console.log('        这样"一次驱动一份状态"，transducer 本身就是无副作用的、可复用的。');

console.log('--- 8. 它成立的代数前提：结合律与单位元（Monoid） ---');

// 前面所有推导都默认了一件事：reduce 可以随意分组、可以换初始值。
// 这个"默认"其实是代数性质，不是免费的。两条：
//   结合律：(a ⊕ b) ⊕ c ≡ a ⊕ (b ⊕ c)  —— 分组方式不影响结果
//   单位元：存在 e，使得 e ⊕ a ≡ a ≡ a ⊕ e —— 换初始值不影响结果
// 同时满足这两条的 (类型, ⊕) 就叫 Monoid（幺半群）。
// 加法和乘法是 Monoid（e 分别是 0 和 1）；字符串拼接也是（e 是 ''）。
const add = (a, b) => a + b;
const mul = (a, b) => a * b;
const concat = (a, b) => a + b;

const range = Array.from({ length: 1000 }, (_, i) => i + 1);
const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));

// 一次性归约 vs 分组归约：结合律保证了它们必然相等 —— 这正是 MapReduce / 并行流合法的原因。
const oneShot = range.reduce(add, 0);
const grouped = chunk(range, 250)
  .map((c) => c.reduce(add, 0)) // 分组内各自求和
  .reduce(add, 0); // 再合并
console.log('  加法（满足结合律）：');
console.log('    一趟 reduce                →', oneShot);
console.log('    切成 4 组分别算、再合并     →', grouped, ' 相等：', oneShot === grouped);
console.log('    换初始值（把单位元 0 换成 100，结果减去 100 仍相同）：', range.reduce(add, 100) - 100 === oneShot);
console.log('    乘法同样满足（单位元是 1）：一趟 →', [2, 3, 4, 5].reduce(mul, 1),
  ' 分组 →', [2, 3].reduce(mul, 1) * [4, 5].reduce(mul, 1));
console.log('    字符串拼接也是 Monoid（单位元是空串）：一趟 →', `"${['a', 'b', 'c'].reduce(concat, '')}"`,
  ' 分组 →', `"${['a', 'b'].reduce(concat, '') + ['c'].reduce(concat, '')}"`);

// 反例：减法不满足结合律，所以"分组"会改变结果，也就绝不能并行化。
const sub = (a, b) => a - b;
console.log('  减法（不满足结合律）：');
console.log('    (10 - 3) - 2 →', sub(sub(10, 3), 2));
console.log('    10 - (3 - 2) →', sub(10, sub(3, 2)), ' ← 结果不同！');
console.log('    推论：如果有人把 reduce 的初始值从 0 换成别的、或把数组切块并行，');
console.log('          只有 Monoid 才敢这么做。这就是"能不能并行"的判据。');

// transducer 自己也构成一个 Monoid：
//   运算 = 组合（composeT），单位元 = identityT（什么都不做的转换器）。
// 所以组合的顺序可以任意加括号，结果不变 —— 这是"transducer 可以被库自由拼接"的根据。
const xfA = filterT(isEven);
const xfB = mapT((n) => n * 3);
const xfC = takeT(4);
const leftGrouped = into(composeT(composeT(xfA, xfB), xfC), range.slice(0, 20));
const rightGrouped = into(composeT(xfA, composeT(xfB, xfC)), range.slice(0, 20));
const withIdentity = into(composeT(identityT, xfA, xfB, xfC), range.slice(0, 20));
console.log('  transducer 组合的结合律：');
console.log('    (A ∘ B) ∘ C →', JSON.stringify(leftGrouped));
console.log('    A ∘ (B ∘ C) →', JSON.stringify(rightGrouped), ' 相等：', JSON.stringify(leftGrouped) === JSON.stringify(rightGrouped));
console.log('    左边插入单位元（identityT ∘ A ∘ B ∘ C）→', JSON.stringify(withIdentity), ' 相等：', JSON.stringify(withIdentity) === JSON.stringify(leftGrouped));
console.log('  单位元的实际用处：库可以在不改变语义的前提下自由增删转换器（比如按配置决定是否加一步过滤）。');
console.log('  也见 GLOSSARY 的 Monoid 相关词条（结合律 / 单位元 / reduce）。');

console.log('--- 9. 真正的杀手级优势：跨集合复用同一个转换器 ---');

// map/filter 是"数组的方法"，所以这套逻辑只能用在数组上。
// transducer 描述的是"如何聚合"，与数据源解耦，所以同一个 xf 可以用在任何可迭代对象上。
const xfReuse = composeT(filterT((n) => n > 10), mapT((n) => n * 2));
console.log('  同一个 xf = compose(filterT(n > 10), mapT(n * 2)) 用在四种数据源上：');
console.log('    数组        →', JSON.stringify(into(xfReuse, [5, 12, 20, 3, 40])));
console.log('    Set         →', JSON.stringify(into(xfReuse, new Set([5, 12, 20, 3, 40]))));
console.log('    Map 的条目   →', JSON.stringify(into(mapT(([k, v]) => `${k}=${v}`), new Map([['a', 1], ['b', 2]]))));
function* gen() {
  yield 7;
  yield 11;
  yield 15;
  yield 30;
}
console.log('    generator   →', JSON.stringify(into(xfReuse, gen())));
console.log('  还能换掉输出方式 —— 同样的 xf，聚合成一个数字（求和）或一个字符串：');
console.log('    求和 →', transduce(xfReuse, add, 0, [5, 12, 20, 3, 40]));
console.log('    拼串 →', transduce(xfReuse, (acc, x) => `${acc}[${x}]`, '', [5, 12, 20, 3, 40]));
console.log('  ★ 上面最后一行体现了 transducer 的完整定义：');
console.log('    它同时被"输入集合"和"输出聚合方式"解耦 —— 这才是它比链式写法更本质的抽象。');

console.log('--- 10. 生态现状与选型建议 ---');

console.log('  JavaScript 标准库里**没有** transducer：Array.prototype 没有 transduce，');
console.log('  TC39 也没有把它推进标准（它更偏向库层面的抽象）。');
console.log('  现实中的选择：');
console.log('    · Ramda：transduce(xf, fn, acc, list) / into(list, xf, source)，接口与本文件一致；');
console.log('    · transducers-js：最早把 Clojure 的 transducer 移植到 JS 的库；');
console.log('    · lodash/fp：有 map/filter 的组合，但没有真正的 transducer 短路机制。');
console.log('  什么时候值得用：');
console.log('    ✓ 数据量大（十万级以上）且链条长（4 步以上），想省中间数组的内存；');
console.log('    ✓ 需要提前退出（取前 N 条），或数据源是无限/惰性序列；');
console.log('    ✓ 同一套加工逻辑要跑在数组、Set、Map、流等多种数据源上；');
console.log('    ✓ 需要把"加工流程"当配置项传来传去（它是值，可以存进变量、传进函数）。');
console.log('  什么时候不值得：');
console.log('    ✗ 数据量几千条、链条两三步 —— 直接链式写法，可读性完胜；');
console.log('    ✗ 团队没接触过 transducer —— 这一个概念的认知成本很高，');
console.log('      而且调试时堆栈里全是匿名闭包（10 万条数据出错，报错行号指向 transduce 内部，');
console.log('      和 05 号文件讲的"管道难调试"是同一个问题）；');
console.log('    ✗ 只是想要"一次遍历" —— 那就直接手写一个 reduce，别引入新概念。');

console.log('--- 11. 小结 ---');
console.log('  链式 map/filter：每一步完整遍历上一步的输出，每步产出一个中间数组（05 号文件的问题）。');
console.log('  手写大 reduce  ：一趟走完、零中间数组，但不可组合、不可复用、只适用于数组。');
console.log('  transducer     ：把 map/filter/take 改写成"reducer → reducer"的函数，');
console.log('                   用 compose 组合、用 transduce 驱动 —— 性能与组合性兼得。');
console.log('  三个接口：reducer (acc, x) => acc\'' + ' ／ transducer (reducer) => reducer ／ transduce(xf, reducer, init, coll)');
console.log('  Reduced 哨兵让 take 能中断遍历，这是处理无限序列的前提。');
console.log('  诚实的两条：');
console.log('    1) 它不减少回调调用次数，省的是中间数组与元素搬运（第 6 节实测）；');
console.log('    2) 它成立的代数前提是 reducer 满足结合律且有单位元（Monoid，第 8 节）。');
console.log('  也见：');
console.log('    40_functional_programming/05_point_free_and_pipeline.js —— 本文件在回答它提出的问题；');
console.log('    40_functional_programming/04_monad.js —— chain 是"串起来"，transducer 是"合成一个"；');
console.log('    08_arrays/10_reduce.js —— reducer 本身的用法与陷阱。');
console.log('  下一个话题（08_io_and_effects.js）：');
console.log('  到这里为止我们处理的都是"纯数据"。可程序总要读写文件、打日志、发请求 ——');
console.log('  那些副作用该怎么塞进函数式的世界里？');
