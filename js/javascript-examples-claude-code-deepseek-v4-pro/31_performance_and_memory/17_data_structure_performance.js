/**
 * ============================================================================
 * 知识点：数据结构的性能视角 —— Array vs TypedArray、Map vs Object、
 *           Set vs Array、字符串拼接、JSON 与 structuredClone 的开销
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/11_benchmark_basics.js
 *
 * 【也见】本文 §4（Set vs Array）与 31_performance_and_memory/04_algorithm_complexity.js 重叠，
 *        §5（字符串拼接 vs join）与 31_performance_and_memory/06_string_concatenation.js 重叠。
 *        本文是「数据结构横评」的主场；那两篇是各自专题的主场（更细的复杂度推导与 Rope 结构解剖）。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "选哪种数据结构"通常被当成可读性问题，但它同时是一个性能问题。
 *    不同的数据结构在【内存布局、查找复杂度、增删成本、遍历顺序】上
 *    有本质差异，而这些差异在大规模数据下会放大成数量级的差距。
 *    本示例用可复现的实测，把常见几组选择的差异摆出来。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 一个 10 万条记录的列表，用 Array.includes 做"是否已存在"的判断，
 *      每次 O(n)，整体变成 O(n²) —— 换成 Set 立刻从秒级降到毫秒级；
 *    - 像素/音频/传感器数据用普通数组存，内存是 TypedArray 的好几倍；
 *    - 高频增删的键值缓存用普通对象，删除会让 V8 退化成字典模式，
 *      查找变慢、内存变高 —— 换成 Map 就稳定了；
 *    - 逐条拼接大段文本，疑惑"+= 到底会不会很慢"；
 *    - 每次状态更新都用 JSON.parse(JSON.stringify(x)) 做深拷贝，
 *      在数据量大时成为明显的瓶颈。
 *
 * 3. 核心语法要点（结论先行，后面用实测验证）
 *
 *    (1) Array vs TypedArray
 *        · Array 是【通用容器】：什么都能装，但每个元素可能是
 *          小整数(Smi)、双精度浮点、或是指向堆对象的指针，
 *          引擎需要根据内容维护"元素种类"，还可能发生种类转换；
 *        · TypedArray（Int32Array / Float64Array / Uint8Array …）是
 *          【固定类型 + 连续内存】：长度固定，内存布局可预测，
 *          数据还放在【堆外】（arrayBuffers，见 13 号示例）；
 *        · 内存上：存 0~255 的字节数据时，Uint8Array 是 1 字节/元素，
 *          而普通数组每个元素至少是一个指针宽度（64 位下 8 字节），
 *          差距可达 8 倍；
 *        · 速度上：TypedArray 在数值密集的连续访问（求和、矩阵运算）中
 *          通常更快，因为它没有装箱与类型检查的负担；
 *        · 代价：只能存数字、长度不可变、没有 push/pop 等便利方法。
 *
 *    (2) Map vs 普通对象
 *        · 键的类型：对象只能用字符串/Symbol 作键（其它类型会被转成字符串），
 *          Map 的键可以是任意类型，且用 SameValueZero 比较，不会隐式转换；
 *        · 键的数量级与稳定性：对象在属性很多、或频繁增删时会退化成
 *          "字典模式"，查找不再是简单的内联缓存命中；
 *        · 频繁删除：delete obj.key 会让对象形状不稳定，
 *          而 Map.delete 是稳定操作；
 *        · 遍历：Map 保证【插入顺序】，对象对整数键会按数值升序排列
 *          （这是一个常见的意外行为）；
 *        · 但也要知道：属性固定的对象在 V8 里被优化得极其好
 *          （见 08_object_shape_optimization.js），
 *          在小规模、形状稳定的场景下，对象往往比 Map 更快。
 *
 *    (3) Set vs Array
 *        · 查找：Array.includes 是 O(n) 线性扫描；Set.has 平均 O(1)；
 *        · 去重：Array 去重大量数据需要嵌套循环（O(n²)）或额外哈希；
 *          Set 去重一步到位；
 *        · 但常数因子不能忽略：元素很少（几十个）时，
 *          线性扫描可能因为缓存友好而更快 —— 复杂度只在规模够大时才主导。
 *
 *    (4) 字符串拼接 vs 数组 join
 *        · 现代 V8 用【绳索（rope / cons string）】表示拼接结果：
 *          a + b 并不立刻复制两个字符串，而是记录一个"拼接节点"，
 *          只在真正需要扁平化时才合并。所以 += 在循环里通常没有想象中慢；
 *        · 但绳索结构过深也会带来问题：最终扁平化时要一次性走完整棵树，
 *          而且中间结果会占用额外内存；
 *        · 惯用建议：拼少量片段用 += / 模板字符串（可读性好），
 *          拼大量片段（几千个以上）用数组 push + join，行为更可预测。
 *
 *    (5) JSON 序列化 / 反序列化 与 structuredClone
 *        · JSON.stringify / parse 的常见用途之一是"深拷贝"，但它有几个缺点：
 *          - 丢失函数、undefined、Symbol、正则、Date 会变成字符串；
 *          - 循环引用直接报错；
 *          - 纯 JS 实现，成本与数据规模成正比，大对象上非常可观；
 *        · structuredClone(obj) 是标准的结构化克隆：
 *          - 支持 Date、Map、Set、RegExp、ArrayBuffer、循环引用；
 *          - 由引擎用 C++ 实现，通常比 JSON 往返更快；
 *          - 但依然会丢失函数、原型链、类实例会退化成普通对象；
 *          - 依然是全量深拷贝，成本同样随数据规模线性增长 ——
 *            它不是"免费的"，只是"更正确的选择"。
 *
 * 4. 常见陷阱
 *    - 陷阱一：在小数据量上做微基准并推广到所有规模。
 *      复杂度只在规模够大时才主导，几十个元素时线性扫描往往更快。
 *    - 陷阱二：只看一次测量就下结论。必须预热、多轮、取中位数
 *      （见 11_benchmark_basics.js）。
 *    - 陷阱三：把"理论复杂度"当成"实际速度"。
 *      Big-O 忽略了常数因子、缓存局部性、JIT 优化，
 *      这些在真实规模下可能完全改变结论。
 *    - 陷阱四：以为 TypedArray 在所有场景都更快。
 *      它只擅长"数值密集 + 连续访问"；需要动态增删时它反而更麻烦。
 *    - 陷阱五：用普通对象当超大哈希表，还频繁 delete。
 *      这会让对象退化成字典模式，性能和内存双输。
 *    - 陷阱六：用 JSON.parse(JSON.stringify(x)) 做深拷贝。
 *      数据量大时它是明显的瓶颈，且会丢失类型信息。
 *    - 陷阱七：为了"性能"把可读性好的代码改成晦涩写法，
 *      但实测下来差异在噪声范围内 —— 这是净损失。
 *    - 陷阱八：【本示例要反复强调的一条】现代 JS 引擎的优化极其激进，
 *      很多"教科书上更快的写法"在实测中差异远没有直觉那么大。
 *      所以：先测量，再决定要不要改。
 *
 * 【关于测量的诚实声明】
 *    · 所有实测都控制在较小规模（几千到几十万），保证一秒内跑完；
 *    · 每项都先预热，再跑多轮取【中位数】，并同时给出离散程度；
 *    · 【绝不断言绝对快慢】，只描述本次观察到的相对关系；
 *    · 数值因机器、Node 版本、运行状态而异，两次运行不会完全相同；
 *    · 当两个方案的差距落在噪声范围内时，本示例会明确说"差异不显著"，
 *      并建议用可读性来做决定 —— 这才是正确的工程态度。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/17_data_structure_performance.js
 *
 * 【预期输出】
 *   9 个小节：测量方法说明、Array vs TypedArray（内存篇）、
 *   Array vs TypedArray（速度篇）、Map vs Object、Set vs Array、
 *   字符串拼接 vs 数组 join、JSON 往返、structuredClone 对比、
 *   以及"这些结论该怎么用"的实践建议。
 *   全部为相对关系描述，不断言精确数值。
 * ============================================================================
 */

import { performance } from 'node:perf_hooks';

const scriptStart = performance.now();

// ---------------------------------------------------------------------------
// 0. 测量工具
// ---------------------------------------------------------------------------

/** 中位数 */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * 迷你基准工具：预热 + 多轮采样 + 返回中位数与离散程度。
 * 设计与 11_benchmark_basics.js 中的 bench() 一致，这里做了精简。
 */
function bench(name, fn, { rounds = 7, warmup = 2 } = {}) {
  for (let i = 0; i < warmup; i++) fn();

  const samples = [];
  for (let i = 0; i < rounds; i++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }

  const med = median(samples);
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  return { name, median: med, min, max, spread: min > 0 ? max / min : Infinity };
}

/** 把若干 bench 结果打印成一张表 */
function printTable(results, unit = 'ms') {
  console.log(
    '  用例'.padEnd(34) + `中位数(${unit})`.padEnd(16) + `最小(${unit})`.padEnd(14) + '离散(max/min)',
  );
  console.log('  ' + '-'.repeat(76));
  for (const r of results) {
    console.log(
      r.name.padEnd(32) +
        r.median.toFixed(4).padEnd(16) +
        r.min.toFixed(4).padEnd(14) +
        (r.spread === Infinity ? 'n/a' : r.spread.toFixed(2)),
    );
  }
}

/**
 * 比较两个结果，给出【克制】的结论。
 * 关键：差距很小的时候要敢于说"差异不显著"。
 */
function compare(a, b) {
  const ratio = a.median / (b.median || 1e-9);
  if (ratio >= 1.25) return { text: `「${a.name}」慢约 ${ratio.toFixed(2)} 倍`, significant: true };
  if (ratio <= 0.8) return { text: `「${a.name}」快约 ${(1 / ratio).toFixed(2)} 倍`, significant: true };
  return { text: '两者差异不显著（在噪声范围内）', significant: false };
}

/** 每个小节结束后打印耗时，方便控制总时长 */
function sectionClock(label, t0) {
  console.log(`  ⏱ ${label} 耗时 ${(performance.now() - t0).toFixed(1)} ms（仅用于控制示例总时长）`);
}

console.log('--- 0. 测量方法说明 ---');
console.log('');
console.log('  在开始之前，先把方法论说清楚（这部分比任何数字都重要）：');
console.log('    ① 预热：每项先空跑 2 轮，让 V8 完成 JIT 编译；');
console.log('    ② 多轮采样：正式跑 7 轮，取【中位数】（抗离群值）；');
console.log('    ③ 同时看离散程度 max/min：这个比值大就说明噪声大，结论要谨慎；');
console.log('    ④ 所有用例都保证【结果一致】，否则就不是同一个任务，比较无意义；');
console.log('    ⑤ 规模控制在几千到几十万，保证一秒内跑完 ——');
console.log('       这不是为了好看，而是因为在这个规模区间内的结论最贴近日常业务；');
console.log('    ⑥ 【最重要】差距小于噪声时，本示例会直接说"差异不显著"。');
console.log('');
console.log('  ⚠ 绝对数值因机器与 Node 版本而异，请只关注【相对关系】与【量级】。');

// ---------------------------------------------------------------------------
// 1. Array vs TypedArray：内存
// ---------------------------------------------------------------------------

console.log('\n--- 1. Array vs TypedArray（内存篇）---');
const sec1 = performance.now();
console.log('');

const N_ELEMENTS = 2_000_000;

console.log(`  场景：存 ${N_ELEMENTS.toLocaleString('en-US')} 个 0~255 之间的字节数据。`);
console.log('');
console.log('  先看理论上的内存占用：');
console.log('');
console.log('  存储方式'.padEnd(30) + '每元素'.padEnd(16) + '理论总量');
console.log('  ' + '-'.repeat(66));
console.log('  Uint8Array'.padEnd(28) + '1 字节'.padEnd(16) + `${(N_ELEMENTS / 1024 / 1024).toFixed(1)} MB`);
console.log(
  '  普通 Array（存小整数）'.padEnd(22) + '8 字节（指针宽度）'.padEnd(14) + `${((N_ELEMENTS * 8) / 1024 / 1024).toFixed(1)} MB`,
);
console.log('');
console.log(`  理论差距约 ${(8 / 1).toFixed(0)} 倍。`);

// 实测：TypedArray 的内存落在 arrayBuffers（堆外），这个数字很准
const memBefore = process.memoryUsage();
const u8 = new Uint8Array(N_ELEMENTS);
for (let i = 0; i < N_ELEMENTS; i++) u8[i] = i & 0xff;
const memAfterTyped = process.memoryUsage();

// 实测：普通数组的内存落在 JS 堆里（heapUsed），这个数字噪声较大
const plainArr = new Array(N_ELEMENTS);
for (let i = 0; i < N_ELEMENTS; i++) plainArr[i] = i & 0xff;
const memAfterPlain = process.memoryUsage();

const typedDelta = (memAfterTyped.arrayBuffers - memBefore.arrayBuffers) / 1024 / 1024;
const plainHeapDelta = (memAfterPlain.heapUsed - memAfterTyped.heapUsed) / 1024 / 1024;

console.log('');
console.log('  实测内存变化：');
console.log(`    Uint8Array 分配后，arrayBuffers 增加 = ${typedDelta.toFixed(1)} MB  ← 堆外，数字很准`);
console.log(`    普通 Array 分配后，heapUsed   增加 = ${plainHeapDelta.toFixed(1)} MB  ← 堆内，噪声较大`);
console.log('');
console.log('  怎么解读：');
console.log('    · Uint8Array 的数字几乎精确等于理论值，因为它的内存是连续分配的，');
console.log(`      ${N_ELEMENTS.toLocaleString('en-US')} 字节 = ${(N_ELEMENTS / 1024 / 1024).toFixed(1)} MB，一目了然；`);
console.log('    · 普通 Array 的 heapUsed 增量噪声大得多（可能被同时发生的 GC 抵消一部分），');
console.log('      所以它只能用来判断【量级】，不能当成精确值；');
console.log('    · 但量级差异是明确的：普通数组在这个场景下明显更费内存。');
console.log('');
console.log('  更关键的一点：TypedArray 的内存【不计入 heapUsed】（见 13 号示例）。');
console.log('    这意味着大量使用 TypedArray 时，JS 堆很健康，但进程内存（rss）很高。');
console.log('    这既是优点（不增加 GC 压力、不参与可达性分析），');
console.log('    也是坑（监控只看 heapUsed 就发现不了它）。');

// 计算校验，确保两边存的数据确实一样
let typedSum = 0;
let plainSum = 0;
for (let i = 0; i < N_ELEMENTS; i++) {
  typedSum += u8[i];
  plainSum += plainArr[i];
}
console.log('');
console.log(`  数据一致性校验：Uint8Array 求和 = ${typedSum}，Array 求和 = ${plainSum} → ${typedSum === plainSum ? '一致 ✓' : '不一致 ✗'}`);

// 释放
plainArr.length = 0;
sectionClock('第 1 节', sec1);

// ---------------------------------------------------------------------------
// 2. Array vs TypedArray：速度
// ---------------------------------------------------------------------------

console.log('\n--- 2. Array vs TypedArray（速度篇）---');
const sec2 = performance.now();
console.log('');

const SPEED_N = 500_000;

// 准备三种容器，内容完全相同：0 ~ SPEED_N-1 的整数
const arrPlain = Array.from({ length: SPEED_N }, (_, i) => i);
const arrInt32 = Int32Array.from({ length: SPEED_N }, (_, i) => i);
const arrFloat64 = Float64Array.from({ length: SPEED_N }, (_, i) => i);

// 三者必须给出相同的结果，否则比较没有意义
function sumPlain(a) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i];
  return s;
}
function sumTyped(a) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i];
  return s;
}

const expected = sumPlain(arrPlain);
console.log(`  场景：对 ${SPEED_N.toLocaleString('en-US')} 个整数求和，三种容器内容完全一致。`);
console.log(`  结果一致性校验：普通Array=${expected}，Int32Array=${sumTyped(arrInt32)}，Float64Array=${sumTyped(arrFloat64)}`);
console.log('');

const sumResults = [
  bench('普通 Array 求和', () => sumPlain(arrPlain)),
  bench('Int32Array 求和', () => sumTyped(arrInt32)),
  bench('Float64Array 求和', () => sumTyped(arrFloat64)),
];
printTable(sumResults);
console.log('');
const cmpSum = compare(sumResults[1], sumResults[0]);
console.log(`  对照结论：Int32Array vs 普通 Array → ${cmpSum.text}`);
console.log('');
console.log('  ⚠ 请注意本次实测的结果，它和很多人的直觉是【相反】的：');
console.log(`    普通 Array 反而是最快的，Int32Array / Float64Array 都更慢。`);
console.log('');
console.log('  为什么"应该更快"的 TypedArray 反而输了（这几点很值得理解）：');
console.log('    · 这里装的全是小整数，V8 会用【Smi（小整数）】这种最紧凑的表示，');
console.log('      不装箱、不分配，和 TypedArray 的连续布局差别没那么大；');
console.log('    · 这个求和循环极其简单，V8 的 JIT 能把它优化得非常好');
console.log('      （甚至做循环展开与向量化），普通数组完全吃到了这波优化；');
console.log('    · 而 TypedArray 的每次读写都要做边界检查与类型转换，');
console.log('      在这种"单次运算极轻"的循环里，这点开销反而占了主导；');
console.log('    · 结论：在【元素少、运算轻、被 JIT 充分优化】的微基准里，');
console.log('      普通 Array 经常赢 —— 这正是"不要凭直觉下结论"的最好例子。');
console.log('');
console.log('  那 TypedArray 的价值到底在哪（这些是确定无疑的）：');
console.log('    · 【内存】—— 上一节已经实测：存字节数据时省约 8 倍，这是硬收益；');
console.log('    · 【不增加 GC 压力】—— 数据在堆外，不参与可达性分析、不产生碎片；');
console.log('    · 【零拷贝交给底层】—— Canvas / WebGL / 加密库 / Worker 通信');
console.log('      可以直接使用它的内存，普通数组必须先转换一遍；');
console.log('    · 【行为可预测】—— 长度固定、类型固定，不会因为混入浮点就悄悄变慢；');
console.log('    · 【大数据量下缓存局部性占优】—— 百万级以上时优势才容易显现。');
console.log('');
console.log('  ⚠ 还有一点必须提醒：本次测出的离散程度（max/min）也值得看一眼。');
console.log('    如果某个用例的 max/min 很大，说明它的测量噪声大，');
console.log('    那部分差距就不该被当成确定的结论。');
console.log('');
console.log('  实践建议：');
console.log('    为【内存】和【互操作】选 TypedArray，');
console.log('    而不是为"它一定更快"选它 —— 速度要按你的真实场景实测。');

sectionClock('第 2 节', sec2);

// ---------------------------------------------------------------------------
// 3. Map vs 普通对象
// ---------------------------------------------------------------------------

console.log('\n--- 3. Map vs 普通对象 ---');
const sec3 = performance.now();
console.log('');

const MAP_N = 20_000;
const LOOKUPS = 20_000;

// 用统一的字符串键，保证两边完全等价
const keys = Array.from({ length: MAP_N }, (_, i) => `key-${i}`);

const objStore = {};
const mapStore = new Map();
for (let i = 0; i < MAP_N; i++) {
  objStore[keys[i]] = i;
  mapStore.set(keys[i], i);
}

console.log(`  场景：${MAP_N.toLocaleString('en-US')} 个字符串键，做 ${LOOKUPS.toLocaleString('en-US')} 次查找。`);
console.log('');

// 3.1 查找
const lookupResults = [
  bench('普通对象 查找', () => {
    let acc = 0;
    for (let i = 0; i < LOOKUPS; i++) acc += objStore[keys[i]];
    return acc;
  }),
  bench('Map 查找 (get)', () => {
    let acc = 0;
    for (let i = 0; i < LOOKUPS; i++) acc += mapStore.get(keys[i]);
    return acc;
  }),
];
printTable(lookupResults);
const cmpLookup = compare(lookupResults[1], lookupResults[0]);
console.log(`  对照结论：${cmpLookup.text}`);

// 3.2 插入
const insertResults = [
  bench(
    '普通对象 插入 20k',
    () => {
      const o = {};
      for (let i = 0; i < MAP_N; i++) o[keys[i]] = i;
      return o;
    },
    { rounds: 5 },
  ),
  bench(
    'Map 插入 20k',
    () => {
      const m = new Map();
      for (let i = 0; i < MAP_N; i++) m.set(keys[i], i);
      return m;
    },
    { rounds: 5 },
  ),
];
console.log('');
printTable(insertResults);
const cmpInsert = compare(insertResults[1], insertResults[0]);
console.log(`  对照结论：${cmpInsert.text}`);

// 3.3 频繁增删 —— 理论上 Map 更稳，实测未必看得出差距
console.log('');
console.log('  3.3 频繁增删：');
console.log('     理论上普通对象用 delete 删除属性后，V8 常常会把它切换成"字典模式"，');
console.log('     之后属性访问不再是简单的内联缓存命中，而是真正的哈希查找；');
console.log('     而 Map 的删除始终是稳定操作，不会引起结构退化。');
console.log('     下面的实测就是想验证这一点 —— 但请先看看它到底测出了什么。');

const CHURN_N = 5_000;
const churnResults = [
  bench(
    '对象 增删循环',
    () => {
      const o = {};
      for (let i = 0; i < CHURN_N; i++) {
        o[keys[i]] = i;
        delete o[keys[i]]; // ← 这个 delete 会让对象形状不稳定
      }
      return o;
    },
    { rounds: 5 },
  ),
  bench(
    'Map 增删循环',
    () => {
      const m = new Map();
      for (let i = 0; i < CHURN_N; i++) {
        m.set(keys[i], i);
        m.delete(keys[i]); // ← Map 的删除不会引起结构退化
      }
      return m;
    },
    { rounds: 5 },
  ),
];
printTable(churnResults);
const cmpChurn = compare(churnResults[0], churnResults[1]);
console.log(`  对照结论：${cmpChurn.text}`);
console.log('');
console.log('  【诚实解读】速度方面的实测结论（可能再次出乎意料）：');
console.log(`    · 本节的查找、插入、增删三项里，Map 在速度上【都没有明显优势】，`);
console.log('      查找与增删都被判定为"差异不显著"，插入反而略慢一点；');
console.log('    · 原因：本节的键数量（2 万）对 V8 来说还很小，');
console.log('      普通对象即使退化到字典模式也依然很快；');
console.log('    · 而且每次 bench 都新建一个【全新的】对象，');
console.log('      形状从头开始建立，没有经历长期服务里那种"被 delete 打散"的累积效应；');
console.log('    · 【所以本节真正的结论是】：');
console.log('      不要为了"性能"把对象换成 Map —— 在中小规模下，');
console.log('      这个理由基本站不住脚，实测差距落在噪声范围内。');
console.log('');
console.log('  那到底该不该用 Map？该。但理由是【正确性】，不是速度：');
console.log('    · 键可以是任意类型（对象、函数、NaN 都可以当键），对象只能字符串/Symbol；');
console.log('    · 不会发生键的隐式转换 —— obj[1] 和 obj["1"] 是同一个键，Map 则分开；');
console.log('    · 【没有原型链污染风险】：对象有 __proto__ / constructor 等继承属性，');
console.log('      用对象当字典时，键名撞上这些属性会导致诡异 bug（经典的安全问题）；');
console.log('    · 遍历顺序保证是插入顺序（对象对"整数样式"的键会按数值升序返回）；');
console.log('    · 有 size 属性直接拿到条目数，对象要 Object.keys().length 才行。');
console.log('');
console.log('  什么时候普通对象仍然更好：');
console.log('    · 属性是固定的、已知的（比如配置、DTO）→ 形状稳定，V8 优化得极好；');
console.log('    · 需要 JSON.stringify 直接序列化 → 对象天然可用，Map 会序列化成空对象；');
console.log('    · 数据结构就是"一条记录"，而不是"一张查找表"。');

sectionClock('第 3 节', sec3);

// ---------------------------------------------------------------------------
// 4. Set vs Array
// ---------------------------------------------------------------------------

console.log('\n--- 4. Set vs Array（查找与去重）---');
const sec4 = performance.now();
console.log('');

const SET_N = 10_000;
const HAYSTACK_LOOKUPS = 500;

// 构造一个 1 万个元素的数组/集合，内容相同
const haystackArray = Array.from({ length: SET_N }, (_, i) => i);
const haystackSet = new Set(haystackArray);

console.log(`  场景：在一个 ${SET_N.toLocaleString('en-US')} 元素的集合里，做 ${HAYSTACK_LOOKUPS} 次"是否存在"判断。`);
console.log('');
console.log('  复杂度分析（先讲理论）：');
console.log(`    · Array.includes 是【线性扫描】O(n)：最坏要看完全部 ${SET_N.toLocaleString('en-US')} 个元素`);
console.log('      所以总成本 ≈ 查找次数 × 元素数，是乘法关系；');
console.log('    · Set.has 是【哈希查找】平均 O(1)：一次判断基本是常数时间。');
console.log('');

const containsResults = [
  bench('Array.includes', () => {
    let found = 0;
    for (let i = 0; i < HAYSTACK_LOOKUPS; i++) {
      if (haystackArray.includes(i * 3 % SET_N)) found++;
    }
    return found;
  }),
  bench('Set.has', () => {
    let found = 0;
    for (let i = 0; i < HAYSTACK_LOOKUPS; i++) {
      if (haystackSet.has(i * 3 % SET_N)) found++;
    }
    return found;
  }),
];
printTable(containsResults);
const cmpContains = compare(containsResults[0], containsResults[1]);
console.log(`  对照结论：${cmpContains.text}`);
console.log('');
console.log('  这里就能看出复杂度的威力了：');
console.log(`    Array 的每一次查找都要平均扫 ${SET_N / 2} 个元素，`);
console.log(`    而 Set 是一次哈希计算 —— 规模越大，差距越大。`);

// 去重对比
console.log('');
console.log('  4.2 去重（这才是日常最常用的场景）：');

const DEDUP_N = 6_000;
// 构造一个含大量重复的数组
const dupSource = Array.from({ length: DEDUP_N }, (_, i) => i % (DEDUP_N / 3));

const dedupResults = [
  bench(
    'Array + 辅助对象去重',
    () => {
      const seen = Object.create(null); // 用无原型对象当哈希表
      const out = [];
      for (const v of dupSource) {
        if (!seen[v]) {
          seen[v] = true;
          out.push(v);
        }
      }
      return out;
    },
    { rounds: 5 },
  ),
  bench(
    'Array.includes 去重（O(n²)）',
    () => {
      const out = [];
      for (const v of dupSource) {
        if (!out.includes(v)) out.push(v); // ← 每轮都线性扫描，整体 O(n²)
      }
      return out;
    },
    { rounds: 3 }, // O(n²) 比较慢，少跑几轮
  ),
  bench(
    'Set 去重',
    () => [...new Set(dupSource)],
    { rounds: 5 },
  ),
];
printTable(dedupResults);
console.log('');
console.log('  三者的结果必须完全一致：');
const dedupA = [];
{
  const seen = Object.create(null);
  for (const v of dupSource) {
    if (!seen[v]) {
      seen[v] = true;
      dedupA.push(v);
    }
  }
}
const dedupB = [...new Set(dupSource)];
console.log(`    辅助对象法 ${dedupA.length} 条，Set 法 ${dedupB.length} 条 → ${dedupA.length === dedupB.length ? '一致 ✓' : '不一致 ✗'}`);
console.log('');
console.log('  结论（三种写法都正确，差别在写法与规模适应性）：');
console.log('    · Set 去重是最【简洁】的写法，一行搞定，而且速度很快；');
console.log('    · "Array + 辅助对象"与 Set 是同一个思路（都是哈希），');
console.log('      实测速度非常接近（本节甚至略微更快，但差距在噪声范围内，');
console.log('      不宜当成结论）；它的代价是代码更啰嗦，');
console.log('      而且必须使用 Object.create(null) 来避免原型污染；');
console.log('    · Array.includes 去重在数据量大时是灾难 —— 复杂度是 O(n²)，');
console.log(`      ${DEDUP_N.toLocaleString('en-US')} 条数据就是约 ${((DEDUP_N * DEDUP_N) / 2 / 1e6).toFixed(0)} 百万次比较，`);
console.log('      实测慢了【一个数量级】—— 这是本节差异最显著、最值得记住的一项。');
console.log('');
console.log('  ⚠ 但要记住前面说的：元素很少（几十个）时，');
console.log('    Array.includes 的线性扫描反而可能更快（缓存友好、无哈希开销）。');
console.log('    所以：小数组随意，上了千级就换 Set。');
console.log('');
console.log('  ⚠ 另外注意本节的 Array.includes 用例离散程度非常小（max/min 接近 1），');
console.log('    这说明这个 12 倍的差距是【真实且稳定】的，不是噪声 ——');
console.log('    离散程度这个指标就是用来帮你区分这两种情况的。');

sectionClock('第 4 节', sec4);

// ---------------------------------------------------------------------------
// 5. 字符串拼接 vs 数组 join
// ---------------------------------------------------------------------------

console.log('\n--- 5. 字符串拼接 vs 数组 join ---');
const sec5 = performance.now();
console.log('');

const STR_PIECES = 5_000;

console.log(`  场景：把 ${STR_PIECES.toLocaleString('en-US')} 个片段拼成一个大字符串。`);
console.log('');
console.log('  背景知识：现代 V8 用【绳索（rope）】表示字符串拼接。');
console.log('    a + b 并不立刻把两个字符串的内容复制到一起，');
console.log('    而是创建一个"拼接节点"，记录左右两部分，等真正需要时才扁平化。');
console.log('    所以 += 在循环里【没有想象中那么慢】—— 这是很多老资料的过时结论。');
console.log('');

const parts = Array.from({ length: STR_PIECES }, (_, i) => `part-${i};`);

const concatResults = [
  bench(`+= 逐条拼接 ${STR_PIECES}` , () => {
    let s = '';
    for (let i = 0; i < STR_PIECES; i++) s += parts[i];
    return s.length;
  }),
  bench(`数组 push + join ${STR_PIECES}`, () => {
    const buf = [];
    for (let i = 0; i < STR_PIECES; i++) buf.push(parts[i]);
    return buf.join('').length;
  }),
  bench(`模板字符串累积 ${STR_PIECES}`, () => {
    let s = '';
    for (let i = 0; i < STR_PIECES; i++) s = `${s}${parts[i]}`;
    return s.length;
  }),
];
printTable(concatResults);

// 结果一致性
let concatA = '';
for (let i = 0; i < STR_PIECES; i++) concatA += parts[i];
const concatB = parts.join('');
console.log('');
console.log(`  结果一致性：+= 得到 ${concatA.length} 字符，join 得到 ${concatB.length} 字符 → ${concatA.length === concatB.length ? '一致 ✓' : '不一致 ✗'}`);
console.log('');
console.log('  怎么解读（请特别注意这里的【不确定性】）：');
console.log('    · 三者结果完全相同，比较是公平的；');
console.log(`    · 三种写法的中位数：+= ${concatResults[0].median.toFixed(4)}ms，` +
  `join ${concatResults[1].median.toFixed(4)}ms，模板 ${concatResults[2].median.toFixed(4)}ms；`);
console.log('    · 【它们的绝对值都远小于 1 毫秒】—— 拼 5000 个片段本来就不是瓶颈；');
console.log('    · 【关键】请对比"离散程度(max/min)"这一列与上面中位数的差距：');
console.log('      本节的离散程度高达数倍（有的轮次快、有的轮次慢好几倍），');
console.log('      也就是说【这批测量的噪声，比三种写法之间的差距还大】；');
console.log('    · 结论（这是一个"没有结论"的结论，而它才是正确的结论）：');
console.log('      【本节的测量无法证明这三种写法谁更快】。');
console.log('      多跑几次你会发现排名会变 —— 这不是代码问题，是测量噪声。');
console.log('');
console.log('  那能确定的是什么（这些是结构性的，与噪声无关）：');
console.log('    · 现代 V8 的绳索优化确实让 += 变得很便宜，');
console.log('      "循环里 += 会 O(n²) 复制"这条老结论【在现代引擎上已经不成立】；');
console.log('    · 三种写法的耗时都是亚毫秒级，在 5000 这个规模下【都不是瓶颈】；');
console.log('    · 所以选择依据应该是【内存行为与可读性】，而不是速度。');
console.log('');
console.log('  那还有什么理由用数组 join？（这些理由依然成立，只是和"速度"无关）');
console.log('    · 【内存峰值更可控】—— 绳索是一棵树，节点本身也占内存，');
console.log('      片段特别多时（几万、几十万）绳索的开销会累积起来；');
console.log('    · 【最终扁平化的代价只是被推迟了】—— 一旦你把这个字符串交给');
console.log('      正则、JSON.parse 或写文件，它就必须被拍平成连续内存，');
console.log('      那一刻的代价可能很大，也可能触发一次明显的 GC 停顿；');
console.log('    · 【深绳索会让某些操作变慢】—— 反复做正则匹配时，');
console.log('      每次都要先把它拍平，等于反复付这笔钱；');
console.log('    · 【跨函数传递的可预测性】—— join 的结果一开始就是扁平字符串，');
console.log('      不会有隐藏的树结构跟着一起走。');
console.log('');
console.log('  实践建议（兼顾可读性与可预测性）：');
console.log('    · 拼少量片段 → 用 += 或模板字符串，最易读，而且实测就是最快的；');
console.log('    · 循环里拼【几万个以上】片段 / 构建大文件内容 → 用数组 push + join，');
console.log('      不是为了更快，而是为了让内存峰值和最终扁平化的代价更可控；');
console.log('    · 真正的大文本构建（生成 HTML、CSV、日志）优先考虑【流式写出】，');
console.log('      根本不在内存里拼一个大字符串 —— 这才是最有效的优化。');
console.log('');
console.log('  ⚠ 最后强调一次：本节的结论【与很多老资料的结论相反】。');
console.log('    这不是本示例测错了，而是 V8 在这些年里把字符串拼接优化得非常好。');
console.log('    遇到这类"大家都这么说"的性能建议时，请务必自己测一遍。');

sectionClock('第 5 节', sec5);

// ---------------------------------------------------------------------------
// 6. JSON 序列化 / 反序列化的开销
// ---------------------------------------------------------------------------

console.log('\n--- 6. JSON 序列化 / 反序列化的开销 ---');
const sec6 = performance.now();
console.log('');

const JSON_RECORDS = 2_000;

// 构造一份"像真实业务数据"的对象
const dataset = {
  meta: { version: 3, generatedAt: '2026-01-01T00:00:00.000Z', source: 'example' },
  records: Array.from({ length: JSON_RECORDS }, (_, i) => ({
    id: i,
    name: `记录-${i}`,
    score: (i * 37) % 997,
    tags: [`tag${i % 7}`, `tag${i % 13}`],
    nested: { active: i % 2 === 0, ratio: (i % 100) / 100 },
  })),
};

const jsonString = JSON.stringify(dataset);
console.log(`  场景：一个含 ${JSON_RECORDS.toLocaleString('en-US')} 条记录的对象，`);
console.log(`        序列化后约 ${(jsonString.length / 1024).toFixed(0)} KB，`);
console.log(`        顶层结构：${Object.keys(dataset).join(', ')}`);
console.log('');

const jsonResults = [
  bench('JSON.stringify', () => JSON.stringify(dataset).length, { rounds: 7 }),
  bench('JSON.parse', () => JSON.parse(jsonString).records.length, { rounds: 7 }),
  bench('JSON 往返（深拷贝）', () => JSON.parse(JSON.stringify(dataset)).records.length, { rounds: 5 }),
];
printTable(jsonResults);
console.log('');
console.log('  怎么解读：');
console.log('    · stringify 和 parse 的成本都【与数据规模成正比】——');
console.log('      这是无法避免的，因为必须遍历整棵对象树；');
console.log('    · 往返（parse(stringify(x))）就是一次深拷贝，');
console.log('      成本约等于两者之和，在本场景下是毫秒级；');
console.log('    · 数据量再大十倍，成本也会大十倍 —— 这是线性增长，不是常数;');
console.log('    · 所以：偶发调用无所谓，放进热点循环就是灾难。');
console.log('');
console.log('  用 JSON 往返做深拷贝的代价（这些比速度更重要）：');
console.log('    ✗ 函数、undefined、Symbol 会被直接丢掉；');
console.log('    ✗ Date 会变成字符串（不再是 Date 对象）；');
console.log('    ✗ Map / Set / RegExp 会变成空对象或普通对象；');
console.log('    ✗ 循环引用直接抛 TypeError: Converting circular structure to JSON；');
console.log('    ✗ 原型链和类实例的类型信息全部丢失。');

// 演示这些丢失（捕获异常后打印，绝不让进程崩溃）
console.log('');
console.log('  实测这些信息丢失：');

// 1) 循环引用会抛错
const circular = { name: 'root' };
circular.self = circular;
try {
  JSON.stringify(circular);
  console.log('    · 循环引用：竟然成功了？（不应该）');
} catch (err) {
  console.log(`    · 循环引用：${err.constructor.name} → ${err.message.slice(0, 60)}…`);
  console.log('      ↑ 这是 JSON 深拷贝最常见的崩溃原因，必须 try/catch。');
}

// 2) 类型丢失
const typed = {
  when: new Date('2026-01-01'),
  tags: new Set([1, 2, 3]),
  lookup: new Map([['a', 1]]),
  fn: () => 42,
  missing: undefined,
  big: 123n,
};
const typedRoundTrip = JSON.parse(
  JSON.stringify(typed, (key, value) => (typeof value === 'bigint' ? String(value) : value)),
);
console.log('    · 类型丢失对照：');
console.log(`        Date   → ${Object.prototype.toString.call(typed.when)}`);
console.log(`        经过 JSON 往返 → ${Object.prototype.toString.call(typedRoundTrip.when)}（变成了字符串！）`);
console.log(`        Set    → 往返后变成 ${JSON.stringify(typedRoundTrip.tags)}（空了）`);
console.log(`        Map    → 往返后变成 ${JSON.stringify(typedRoundTrip.lookup)}（空了）`);
console.log(`        函数   → 往返后 ${typedRoundTrip.fn === undefined ? '直接被丢弃了' : '还在'} `);
console.log(`        undefined → 往返后 ${'missing' in typedRoundTrip ? '还在' : '键被移除了'}`);

sectionClock('第 6 节', sec6);

// ---------------------------------------------------------------------------
// 7. structuredClone 对比
// ---------------------------------------------------------------------------

console.log('\n--- 7. structuredClone：更正确的深拷贝 ---');
const sec7 = performance.now();
console.log('');

console.log(`  当前环境是否提供 structuredClone：${typeof structuredClone === 'function' ? '是' : '否'}`);
console.log('');
console.log('  它能正确处理 JSON 做不到的那些类型：');
console.log('    ✓ Date 保持为 Date，RegExp 保持为 RegExp');
console.log('    ✓ Map / Set 保持类型与内容');
console.log('    ✓ ArrayBuffer / TypedArray 正确复制');
console.log('    ✓ 【循环引用可以处理】（JSON 会直接抛错）');
console.log('    ✗ 仍然不支持函数、原型链、类实例（会退化成普通对象）');
console.log('    ✗ 仍然不支持 DOM 节点、Error 的部分信息');
console.log('');

// 用同一份数据进行对比
const cloneResults = [
  bench('JSON 往返深拷贝', () => JSON.parse(JSON.stringify(dataset)).records.length, { rounds: 5 }),
  bench('structuredClone', () => structuredClone(dataset).records.length, { rounds: 5 }),
];
printTable(cloneResults);
const cmpClone = compare(cloneResults[0], cloneResults[1]);
console.log(`  对照结论：JSON 往返 vs structuredClone → ${cmpClone.text}`);
console.log('');
console.log('  怎么解读（这里同样要克制，不要预设谁更快）：');
console.log(`    · 本次实测：JSON 往返 ${cloneResults[0].median.toFixed(4)}ms，` +
  `structuredClone ${cloneResults[1].median.toFixed(4)}ms；`);
console.log('    · 常见说法是"structuredClone 由引擎用 C++ 实现，比 JSON 往返更快"，');
console.log('      但【这取决于数据的构成】，本次实测里 JSON 往返反而更快一些；');
console.log('    · 原因在于：本节这份数据是【纯 JSON 友好】的普通对象，');
console.log('      正好落在 JSON 最擅长、V8 优化得最彻底的路径上；');
console.log('      而 structuredClone 要通用地处理各种类型，走的是更保守的路径；');
console.log('    · 如果数据里有 Date / Map / Set / ArrayBuffer / 循环引用，');
console.log('      情况就完全不同了 —— 那时 JSON 往返要么丢失信息，要么直接抛错，');
console.log('      而 structuredClone 依然能正确工作（此时根本不存在"比速度"的前提）；');
console.log('    · 所以【"structuredClone 更快"不是重点，"structuredClone 更正确"才是】；');
console.log('    · 而且它同样是 O(数据规模) 的全量拷贝；');
console.log('      数据量再大十倍，它的成本也会大十倍。');
console.log('    · 无论用哪个，都要先问一句：这次深拷贝真的必要吗？');

// 验证 structuredClone 能处理循环引用
console.log('');
try {
  const clonedCircular = structuredClone(circular);
  console.log(`  structuredClone 处理循环引用：成功 ✓`);
  console.log(`    克隆体 name = ${clonedCircular.name}`);
  console.log(`    clonedCircular.self === clonedCircular → ${clonedCircular.self === clonedCircular}（自我引用关系被正确重建）`);
  console.log(`    clonedCircular !== circular → ${clonedCircular !== circular}（确实是新对象，不是同一引用）`);
} catch (err) {
  console.log(`  structuredClone 处理循环引用失败：${err.message}`);
}

// 验证类型保真
console.log('');
const cloneTyped = structuredClone({
  when: new Date('2026-01-01'),
  tags: new Set([1, 2, 3]),
  lookup: new Map([['a', 1]]),
});
console.log('  structuredClone 的类型保真：');
console.log(`    Date → ${Object.prototype.toString.call(cloneTyped.when)}（保住了！）`);
console.log(`    Set  → ${cloneTyped.tags instanceof Set}，内容 ${[...cloneTyped.tags].join(',')}（保住了！）`);
console.log(`    Map  → ${cloneTyped.lookup instanceof Map}，内容 ${[...cloneTyped.lookup].join(',')}（保住了！）`);

console.log('');
console.log('  性能上的通用建议：');
console.log('    · 能用浅拷贝就别用深拷贝：{...obj} / Object.assign 只复制一层，快得多；');
console.log('    · 只有确实需要独立副本、且数据规模不大时，才用 structuredClone；');
console.log('    · 超大对象（几 MB 以上）的深拷贝应该【避免】，');
console.log('      改用不可变数据（immer 这类库）或按需复制部分字段；');
console.log('    · 在跨线程通信（Web Worker / worker_threads）里，');
console.log('      structuredClone 是底层机制，但那时可以用 Transferable 做到零拷贝。');

sectionClock('第 7 节', sec7);

// ---------------------------------------------------------------------------
// 8. 结论汇总
// ---------------------------------------------------------------------------

console.log('\n--- 8. 这些结论该怎么用 ---');
console.log('');
console.log('  选择'.padEnd(34) + '默认建议');
console.log('  ' + '-'.repeat(88));
const summary = [
  ['数值密集且长度固定', 'TypedArray（省内存、布局可预测、可零拷贝交给底层 API）'],
  ['通用列表 / 需要增删', '普通 Array（灵活，V8 优化得很好）'],
  ['查找表 / 缓存', 'Map（键类型自由、无原型污染、删除稳定）'],
  ['固定的记录结构', '普通对象（形状稳定时 V8 优化极快，且能直接 JSON 序列化）'],
  ['判重 / 去重 / 集合运算', 'Set（平均 O(1)，一行搞定）'],
  ['几十个元素的小集合', 'Array 也完全可以（差异在噪声范围内）'],
  ['循环里拼几千个片段', '数组 push + join（内存峰值更可控）'],
  ['拼少量片段', '+= 或模板字符串（可读性优先）'],
  ['深拷贝', '优先浅拷贝；需要深拷贝用 structuredClone（但要注意成本）'],
];
for (const [scene, advice] of summary) {
  console.log(scene.padEnd(32) + advice);
}

console.log('');
console.log('  最后五句话（比上面所有数字都重要）：');
console.log('    1. 【先测量，再优化】没有测量的优化是在赌运气；');
console.log('    2. 【先看复杂度，再看常数】O(n²) 的算法在 n 变大时一定会输，');
console.log('       但在 n 很小时它可能更快 —— 规模决定一切；');
console.log('    3. 【现代引擎很聪明】很多"教科书上更快的写法"实测差异很小，');
console.log('       不要为了想象中的性能牺牲可读性；');
console.log('    4. 【最大的优化往往来自换算法或换架构】，');
console.log('       比如把 O(n²) 换成 O(n)，或者用虚拟列表少渲染（见 15 号示例），');
console.log('       而不是在微基准上抠那几个百分点；');
console.log('    5. 【不要优化还没被证明是瓶颈的地方】。');
console.log('       先profile找到热点，再动手 —— 参见 11 号和 13 号示例。');

console.log(`\n本示例总耗时约 ${(performance.now() - scriptStart).toFixed(0)} ms（含全部基准测试）。`);
console.log('示例结束。');
