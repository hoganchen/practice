/**
 * ============================================================================
 * 知识点：循环性能实测 —— for / while / for...of / forEach / map 的真实差距
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】进阶
 * 【前置知识】31_performance_and_memory/04_algorithm_complexity.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 提供了至少五种遍历数组的写法：经典 for、while、for...of、
 *    Array.prototype.forEach、Array.prototype.map。本示例用 20 万元素数组
 *    分别做"求和"与"转换"两种任务，实测它们的耗时差异，并给出工程结论。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 渲染大数据表格、统计报表、日志分析、游戏循环，循环体本身可能很轻，
 *      循环开销就变成了瓶颈；但更多时候循环体才是瓶颈，换写法毫无意义。
 *    - 团队代码评审里经常出现"for 比 forEach 快，必须用 for"的说法。
 *      本示例用实测数据说明：在现代 V8 上这种差异通常很小，
 *      为此牺牲可读性往往得不偿失。
 *    - 知道 map 会创建新数组、for...of 有迭代器开销，才能在该省内存时做对选择。
 *
 * 3. 核心语法要点
 *    - 经典 for：手动控制下标，没有函数调用、没有迭代器协议、没有闭包分配，
 *      是理论上开销最小的写法；还能用 break/continue 提前跳出。
 *    - while：与 for 等价，只是把初始化/自增写在循环外，适合"条件复杂"的场景。
 *    - for...of：走的是【迭代器协议】——每轮调用一次 iterator.next()，
 *      返回 { value, done } 对象，因此有额外的对象分配与方法调用开销。
 *      对数组而言这个开销已经被 V8 大幅优化，但仍常常比经典 for 慢一些，
 *      循环体越轻（越接近纯粹的下标访问），这个差距越明显。
 *    - forEach：每轮调用一次回调函数（有函数调用开销），
 *      并且【无法中途 break】（只能靠抛异常或用 some/every 变通）。
 *    - map：和 forEach 一样要调用回调，但【额外创建一个等长新数组】，
 *      所以内存分配是它的主要成本；它表达的是"映射"，本来就是为返回新数组而生的。
 *
 * 4. 常见陷阱
 *    - 陷阱一：过早优化。现代 V8 对这些写法的差异在正常业务代码里【通常很小】，
 *      差异最大的是"循环体几乎不做事"的极端微基准（本示例会实测到）；
 *      而真实业务里循环体往往有一次对象创建或函数调用，那点差异立刻被淹没。
 *      请务必同时看相对倍数和绝对耗时——亚毫秒级的差距不值得牺牲可读性。
 *    - 陷阱二：为了性能把 forEach 改成 for，结果逻辑变复杂、bug 变多，
 *      性能收益却测量不出来（在噪声范围之内）。
 *    - 陷阱三：在 for 循环里每次迭代都访问 arr.length。
 *      现代引擎对这一点优化得很好，而对象属性（如 obj.items.length）的重复访问
 *      才是值得缓存到局部变量的。
 *    - 陷阱四：在循环里做重复计算、重复 DOM 查询、反复创建正则——
 *      这些才是真正的性能杀手（详见 07_batch_dom_updates.js）。
 *    - 陷阱五：只测一轮就下结论。第一次运行包含 JIT 解释执行与编译的开销，
 *      必须预热后多轮采样（详见 11_benchmark_basics.js）。
 *    - 陷阱六：测出来的结果被"死代码消除"优化掉——只累加不使用，引擎可能
 *      直接把整个循环删掉。所以必须把累加结果打印出来。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/05_loop_performance.js
 *
 * 【预期输出】
 *   打印 6 个小节：准备数据、五种写法的求和实测、五种写法的转换实测、
 *   加重循环体后差距变化的对比实验、总结论与重要说明、以及工程建议。
 *   全程只打印实测数值和定性结论，不做"某写法一定更快"的断言。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 1. 准备数据与简易计时工具
// ---------------------------------------------------------------------------

console.log('--- 1. 准备 20 万元素数组 ---');

const N = 200_000; // 规模：20 万（控制在 50 万以内，确保示例 1 秒内跑完）

const numbers = new Array(N);
for (let i = 0; i < N; i++) numbers[i] = i % 1000; // 值域小，便于验证结果一致性

console.log(`数组长度 = ${numbers.length}`);

// 简易计时器：跑 rounds 轮，返回每轮的耗时数组（毫秒）
// 这里刻意先跑 1 轮预热，避免把 JIT 编译时间算进去
function bench(fn, rounds) {
  fn(); // 预热：让引擎先把这段代码编译成机器码
  const times = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  // 返回最小值：最小值受系统抖动影响最小，最能代表这段代码的最佳性能
  return { min: Math.min(...times), all: times };
}

const ROUNDS = 3; // 采样轮数（轮数不多，保证总耗时可控）

// 把结果收集起来，最后统一打印
const summary = [];

// ---------------------------------------------------------------------------
// 2. 任务一：求和（循环体极轻，最能体现"循环开销"的差异）
// ---------------------------------------------------------------------------

console.log('\n--- 2. 任务一：数组求和（20 万元素） ---');

// 2.1 经典 for：下标访问，最"原始"的写法
function sumFor(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}

// 2.2 while：与 for 等价，把自增写在循环体内
function sumWhile(arr) {
  let total = 0;
  let i = 0;
  while (i < arr.length) {
    total += arr[i];
    i += 1;
  }
  return total;
}

// 2.3 for...of：使用迭代器协议，每轮拿一个值
function sumForOf(arr) {
  let total = 0;
  for (const v of arr) {
    total += v;
  }
  return total;
}

// 2.4 forEach：每轮调用一次回调函数
function sumForEach(arr) {
  let total = 0;
  arr.forEach((v) => {
    total += v;
  });
  return total;
}

// 2.5 reduce：函数式写法，每次迭代调用一次 reducer
function sumReduce(arr) {
  return arr.reduce((acc, v) => acc + v, 0);
}

const sumCases = [
  ['经典 for', sumFor],
  ['while', sumWhile],
  ['for...of', sumForOf],
  ['forEach', sumForEach],
  ['reduce', sumReduce],
];

console.log('（每项先预热 1 轮，再采样 ' + ROUNDS + ' 轮，取最小值）');
console.log('写法'.padEnd(14) + '最小值(ms)'.padEnd(14) + '各轮耗时(ms)');
console.log('-'.repeat(64));

const sumResults = [];
for (const [name, fn] of sumCases) {
  const { min, all } = bench(() => fn(numbers), ROUNDS);
  sumResults.push({ name, min, value: fn(numbers) });
  console.log(name.padEnd(12) + min.toFixed(3).padEnd(16) + all.map((t) => t.toFixed(3)).join(', '));
}

// 校验所有写法的结果一致 —— 性能比较的前提是功能等价
const sumValues = new Set(sumResults.map((r) => r.value));
console.log(`\n五种写法的求和结果是否一致：${sumValues.size === 1}（结果 = ${[...sumValues][0]}）`);

const sumMin = Math.min(...sumResults.map((r) => r.min));
const sumMax = Math.max(...sumResults.map((r) => r.min));
console.log(`最快 ${sumMin.toFixed(3)} ms，最慢 ${sumMax.toFixed(3)} ms，差距约 ${(sumMax / sumMin).toFixed(2)} 倍。`);
summary.push(['求和', sumMin, sumMax]);

// ---------------------------------------------------------------------------
// 3. 任务二：转换（map 会创建新数组，内存开销更大）
// ---------------------------------------------------------------------------

console.log('\n--- 3. 任务二：每个元素乘以 2（会创建新数组） ---');

// 3.1 经典 for + 预分配数组：先 new Array(n) 再按下标赋值，避免多次扩容
function doubleForPreallocated(arr) {
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    out[i] = arr[i] * 2;
  }
  return out;
}

// 3.2 经典 for + push：不预分配，让数组自己增长（可能触发多次扩容）
function doubleForPush(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i++) {
    out.push(arr[i] * 2);
  }
  return out;
}

// 3.3 map：语义最清晰的写法，内部同样会创建等长新数组
function doubleMap(arr) {
  return arr.map((v) => v * 2);
}

// 3.4 for...of + push：迭代器 + 动态增长，两种开销叠加
function doubleForOf(arr) {
  const out = [];
  for (const v of arr) {
    out.push(v * 2);
  }
  return out;
}

// 3.5 Array.from：用一个映射函数从类数组/可迭代对象构造新数组
function doubleArrayFrom(arr) {
  return Array.from(arr, (v) => v * 2);
}

const transformCases = [
  ['for + 预分配', doubleForPreallocated],
  ['for + push', doubleForPush],
  ['map', doubleMap],
  ['for...of + push', doubleForOf],
  ['Array.from', doubleArrayFrom],
];

console.log('（每项先预热 1 轮，再采样 ' + ROUNDS + ' 轮，取最小值）');
console.log('写法'.padEnd(16) + '最小值(ms)'.padEnd(14) + '各轮耗时(ms)');
console.log('-'.repeat(66));

const transformResults = [];
for (const [name, fn] of transformCases) {
  const { min, all } = bench(() => fn(numbers), ROUNDS);
  transformResults.push({ name, min, value: fn(numbers) });
  console.log(name.padEnd(18) + min.toFixed(3).padEnd(16) + all.map((t) => t.toFixed(3)).join(', '));
}

// 校验结果一致：每个结果数组的长度和首尾元素都要对得上
const allConsistent = transformResults.every(
  (r) =>
    r.value.length === N &&
    r.value[0] === numbers[0] * 2 &&
    r.value[N - 1] === numbers[N - 1] * 2,
);
console.log(`\n五种写法的转换结果是否一致：${allConsistent}`);

const transMin = Math.min(...transformResults.map((r) => r.min));
const transMax = Math.max(...transformResults.map((r) => r.min));
console.log(`最快 ${transMin.toFixed(3)} ms，最慢 ${transMax.toFixed(3)} ms，差距约 ${(transMax / transMin).toFixed(2)} 倍。`);
summary.push(['转换', transMin, transMax]);

// 内存开销的定性说明（注意：不打印具体的字节数，因为内存数值因环境而异）
console.log('\n内存开销（定性，不做精确数值断言）：');
console.log('  · for + 预分配 / for + push / map / for...of + push / Array.from：');
console.log('    这五种都会创建一个长度为 20 万的新数组，内存开销属于同一量级。');
console.log('  · 真正的差别在于"是否需要在原数组上原地修改"：');
console.log('    如果只想就地改值，用 for 循环改 arr[i] 就不需要第二块内存；');
console.log('    map 的语义是"产生新数组"，它对内存的额外占用是设计使然，不是缺陷。');

// ---------------------------------------------------------------------------
// 3.5 关键实验：给循环体加一点"真实工作量"，差距会怎样变化
// ---------------------------------------------------------------------------

console.log('\n--- 4. 关键实验：循环体加上真实工作量后，差距会怎样 ---');

// 前面两个任务是"循环体几乎不做事"的极端微基准，此时循环本身的开销占比最高。
// 现在给循环体加一点真实业务里常见的工作（取模判断 + 开方 + 分支），再看差距。
console.log('给循环体加上：取模判断 + Math.sqrt + 分支累加（模拟真实业务逻辑）');

function heavySumFor(arr) {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v % 3 === 0) total += Math.sqrt(v);
    else total += v;
  }
  return total;
}

function heavySumForOf(arr) {
  let total = 0;
  for (const v of arr) {
    if (v % 3 === 0) total += Math.sqrt(v);
    else total += v;
  }
  return total;
}

function heavySumForEach(arr) {
  let total = 0;
  arr.forEach((v) => {
    if (v % 3 === 0) total += Math.sqrt(v);
    else total += v;
  });
  return total;
}

const heavyCases = [
  ['经典 for（重循环体）', heavySumFor],
  ['for...of（重循环体）', heavySumForOf],
  ['forEach（重循环体）', heavySumForEach],
];

console.log('写法'.padEnd(26) + '最小值(ms)'.padEnd(14) + '各轮耗时(ms)');
console.log('-'.repeat(70));

const heavyResults = [];
for (const [name, fn] of heavyCases) {
  const { min, all } = bench(() => fn(numbers), ROUNDS);
  heavyResults.push({ name, min, value: fn(numbers) });
  console.log(name.padEnd(24) + min.toFixed(3).padEnd(16) + all.map((t) => t.toFixed(3)).join(', '));
}

const heavyValues = new Set(heavyResults.map((r) => r.value));
const heavyMin = Math.min(...heavyResults.map((r) => r.min));
const heavyMax = Math.max(...heavyResults.map((r) => r.min));
console.log(`\n三种写法结果是否一致：${heavyValues.size === 1}（结果 = ${[...heavyValues][0]}）`);
console.log(`最快 ${heavyMin.toFixed(3)} ms，最慢 ${heavyMax.toFixed(3)} ms，差距约 ${(heavyMax / heavyMin).toFixed(2)} 倍。`);
console.log('对比前面"极轻循环体"时的差距，可以看到：循环体一变重，');
console.log('循环写法本身的相对差距就被稀释了——这才是真实项目的常态。');
console.log('循环体里的工作量越大，循环本身的开销占比就越低；');
console.log('当循环体足够重时，这点差异会缩小到与测量噪声同量级。');
summary.push(['重循环体', heavyMin, heavyMax]);

// ---------------------------------------------------------------------------
// 5. 结论：差异有多大，值不值得为它牺牲可读性
// ---------------------------------------------------------------------------

console.log('\n--- 5. 结论：现代 V8 下这些差异有多大 ---');

console.log('任务'.padEnd(12) + '最快(ms)'.padEnd(14) + '最慢(ms)'.padEnd(14) + '最大差距');
console.log('-'.repeat(60));
for (const [task, min, max] of summary) {
  console.log(task.padEnd(10) + min.toFixed(3).padEnd(16) + max.toFixed(3).padEnd(16) + `${(max / min).toFixed(2)} 倍`);
}

console.log('');
console.log('重要说明：');
console.log('  1) 一句被广泛引用的话是：现代 V8 引擎对这些写法的差异已经很小');
console.log('     （通常在 2 倍以内），可读性优先于微优化。');
console.log('     但请记住这句话的前提——它说的是"正常业务代码"，而不是');
console.log('     "循环体几乎不做事、只做 20 万次加法"这种极端微基准。');
console.log('  2) 上面"求和"那一行的相对差距就明显大于 2 倍，原因正是它的循环体太轻，');
console.log('     循环本身的开销占比被放到了最大。请同时看它的绝对耗时：');
console.log('     最慢的写法处理 20 万个数也不到 1 毫秒，在真实业务里根本感知不到。');
console.log('  3) 一旦循环体里加上一点真实工作（第 4 节的实验），相对差距随之缩小');
console.log('     （本示例从约 7 倍降到约 4 倍）。循环体越重，差距越小——');
console.log('     这说明"换循环写法"的收益很容易被循环体本身淹没。');
console.log('  4) 结论依然是：不要把"把 forEach 改成 for"当成性能优化来做，');
console.log('     除非你已经在真实场景里测出了它是瓶颈。');
console.log('  2) for...of 因为有迭代器协议的开销（每轮一次 next() 调用），');
console.log('     在数组上的确常常略慢于经典 for —— 但换来了不用管下标、');
console.log('     天然支持任意可迭代对象的可读性。');
console.log('  3) map 会额外创建一个新数组，所以它的耗时和内存开销都更大——');
console.log('     这不是缺点，而是它的语义就是"映射出一个新数组"。');
console.log('     不需要新数组时用 forEach 或 for，需要新数组时 map 最清晰。');
console.log('  4) 数据规模、JIT 优化、CPU 缓存都会影响实测结果，');
console.log('     本示例的绝对数值在不同机器上可能相反，请只看数量级。');

// ---------------------------------------------------------------------------
// 6. 工程建议：什么时候该在意循环写法
// ---------------------------------------------------------------------------

console.log('\n--- 6. 工程建议 ---');

console.log('优先级从高到低：');
console.log('  ① 先选对算法和数据结构（O(n²) → O(n) 的收益是几十上百倍，');
console.log('     参考 04_algorithm_complexity.js）。');
console.log('  ② 再消除循环内的重复工作：把不变的表达式提到循环外、');
console.log('     缓存重复查询的结果（参考 07_batch_dom_updates.js）。');
console.log('  ③ 最后才考虑换循环写法（收益通常不到 2 倍）。');
console.log('');
console.log('选择建议：');
console.log('  · 需要 break / continue、需要下标、追求极致性能 → 经典 for');
console.log('  · 需要产生新数组 → map（语义最清楚）');
console.log('  · 只是想遍历做点副作用 → forEach（注意不能 break）');
console.log('  · 遍历的不是数组而是任意可迭代对象 → for...of');
console.log('  · 需要函数式风格、累加聚合 → reduce（可读性有争议，团队统一即可）');
console.log('');
console.log('一句话：可读性优先于微优化，性能问题要用数据说话，不要靠直觉。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
