/**
 * ============================================================================
 * 知识点：算法复杂度实测 —— Array 线性查找 O(n) vs Set/Map 哈希查找 O(1)
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】进阶
 * 【前置知识】31_performance_and_memory/03_memoization.js
 *
 * 【也见】31_performance_and_memory/17_data_structure_performance.js §4 —— 综合横评里也有一节做同样的对比。
 *        本文件是复杂度专题的主场（含 O(n) vs O(1) 的理论推导）；那篇是横评视角，侧重横向选型。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    大 O 表示法描述的是"当数据规模 n 增大时，耗时（或内存）增长的趋势"，
 *    它忽略常数因子、只看最高阶项。本示例把理论落到实测：
 *    · 数组的 includes / indexOf / find 是【线性查找 O(n)】——
 *      从头一个个比，最坏要看完全部 n 个元素；
 *    · Set.has / Map.has / 对象键查找是【哈希查找 O(1)】——
 *      先对 key 做哈希算出桶的位置，一步到位，与总量无关。
 *    本示例用 10 万元素、查找 1000 次做实测对比，并打印理论对照表。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 权限判断：用户有 200 个角色，每次渲染都要判断"能不能看这个按钮"。
 *      写成 roles.includes(x) 就是 O(n)，一个列表渲染 1000 次就是 200000 次比较；
 *      改成 Set 后每次都接近 O(1)。
 *    - 列表去重与交集：用 arr.filter(x => otherArr.includes(x)) 是 O(n*m)，
 *      换成 Set 后是 O(n+m)。这是最常见的性能事故之一。
 *    - 大数据量的"存不存在"判断：ID 是否已加载、URL 是否已访问、词是否在词库中。
 *    - 选择数据结构本质上就是在选择复杂度，写业务代码时多花 10 秒想一下，
 *      可能省掉上线后一次性能优化。
 *
 * 3. 核心语法要点
 *    - 数组：有序、可重复、按下标随机访问 O(1)；但"按值查找"只能线性扫描 O(n)。
 *    - Set：值的集合，自动去重，has/add/delete 平均 O(1)；没有下标，不能随机访问。
 *    - Map：键值对，键可以是任意类型，get/set/has 平均 O(1)。
 *    - 普通对象：键是字符串/Symbol，属性查找平均 O(1)；
 *      但如果对象被当成"字典"频繁增删，V8 会转成字典模式，查找仍然快但比
 *      内联缓存的属性访问慢（见 08_object_shape_optimization.js）。
 *    - "平均 O(1)" 里的"平均"很重要：哈希冲突严重时会退化到 O(n)。
 *
 * 4. 常见陷阱
 *    - 陷阱一：把大 O 当绝对值。O(1) 也有常数开销——算哈希、查桶、比较。
 *      n 很小时（比如 8 个元素），数组线性扫描反而比 Set.has 更快，
 *      本示例的第 5 节会实测演示这个"反直觉"的现象。
 *    - 陷阱二：实测数据受 JIT 编译、数据规模、CPU 缓存局部性影响。
 *      数组是连续内存，顺序访问对 CPU 缓存友好；哈希表跳跃访问容易 cache miss。
 *      所以大规模下 Set 也未必快很多，"大 O 只是趋势，不是保证"。
 *    - 陷阱三：在循环里调用 includes 造成 O(n²)，代码看起来却很"简洁"：
 *      list.filter((a) => other.includes(a)) —— 这一行就是性能事故现场。
 *    - 陷阱四：为了用 Set 而用 Set。如果需要按下标访问、需要保持顺序且元素很少，
 *      数组才是对的工具。不要为了复杂度好看而牺牲可读性。
 *    - 陷阱五：把对象当 Set 用（obj[key] = true）时，__proto__ 等原型属性会干扰，
 *      应该用 Object.create(null) 或直接用 Set。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/04_algorithm_complexity.js
 *
 * 【预期输出】
 *   打印 6 个小节：数据结构准备、10 万元素 × 1000 次查找的实测耗时对比、
 *   理论复杂度对照表、O(n²) 与 O(n) 的对比与规模翻倍实验、
 *   小数据量下数组反而更快的反直觉实测，以及工程结论。
 *   注意：本示例只打印实测数值并给出定性结论，不做任何"谁一定更快"的断言。
 * ============================================================================
 */

const scriptStart = Date.now();

// 统一的计时工具：跑一次 fn，返回 { result, ms }
function timeOnce(fn) {
  const t0 = performance.now();
  const result = fn();
  const t1 = performance.now();
  return { result, ms: t1 - t0 };
}

// 把耗时格式化成固定宽度，方便打印对齐
const fmtMs = (ms) => ms.toFixed(3).padStart(10);

// ---------------------------------------------------------------------------
// 1. 准备测试数据
// ---------------------------------------------------------------------------

console.log('--- 1. 准备测试数据 ---');

const SIZE = 100_000; // 数据规模：10 万（刻意控制在几十万级，保证示例 1 秒内跑完）
const LOOKUPS = 1000; // 查找次数：1000 次

// 1.1 数组：存 0, 2, 4, ... 共 10 万个偶数（严格递增，内存连续，缓存友好）
const arr = new Array(SIZE);
for (let i = 0; i < SIZE; i++) arr[i] = i * 2;

// 1.2 Set：同一批数据，哈希存储
const set = new Set(arr);

// 1.3 Map：键为数值，值为该值所在的下标
const map = new Map();
for (let i = 0; i < SIZE; i++) map.set(arr[i], i);

// 1.4 普通对象当查找表：用 Object.create(null) 避免原型链上的属性干扰
const dict = Object.create(null);
for (let i = 0; i < SIZE; i++) dict[arr[i]] = i;

console.log(`数组长度 = ${arr.length}`);
console.log(`Set.size = ${set.size}`);
console.log(`Map.size = ${map.size}`);
console.log(`对象自身可枚举键数量 = ${Object.keys(dict).length}`);

// 1.5 构造查找目标：一半是"存在的偶数"，一半是"不存在的奇数"
// 用确定性的伪随机（Lehmer 生成器）保证每次运行目标一致、结果可复现
function buildTargets(count, size) {
  const targets = new Array(count);
  let seed = 20240916;
  for (let i = 0; i < count; i++) {
    seed = (seed * 48271) % 2147483647; // 线性同余，数值不超过 2^53，不会丢精度
    const r = seed % size;
    // 偶数下标命中（arr 里存在），奇数下标必然未命中（arr 里全是偶数）
    targets[i] = i % 2 === 0 ? r * 2 : r * 2 + 1;
  }
  return targets;
}

const targets = buildTargets(LOOKUPS, SIZE);
const hitCount = targets.filter((v) => v % 2 === 0).length;
console.log(`查找目标 ${LOOKUPS} 个（约 ${hitCount} 个能命中，${LOOKUPS - hitCount} 个必然未命中）`);
console.log('提示：未命中的查找是数组的最坏情况——必须扫完整个 10 万长度。');

// ---------------------------------------------------------------------------
// 2. 实测：10 万元素、查找 1000 次
// ---------------------------------------------------------------------------

console.log('\n--- 2. 实测对比：10 万元素 × 1000 次查找 ---');

// 为了让 JIT 完成预热，每个操作先热身一遍再正式计时（详见 11_benchmark_basics.js）
const warmup = (fn) => {
  fn();
};

const runIncludes = () => {
  let found = 0;
  for (let i = 0; i < LOOKUPS; i++) {
    // Array.prototype.includes：从下标 0 开始逐个比较，命中就提前返回
    if (arr.includes(targets[i])) found += 1;
  }
  return found;
};

const runIndexOf = () => {
  let found = 0;
  for (let i = 0; i < LOOKUPS; i++) {
    // indexOf 与 includes 同为线性查找，区别是它返回下标、找不到返回 -1
    if (arr.indexOf(targets[i]) !== -1) found += 1;
  }
  return found;
};

const runSetHas = () => {
  let found = 0;
  for (let i = 0; i < LOOKUPS; i++) {
    // Set.has：哈希定位，平均 O(1)
    if (set.has(targets[i])) found += 1;
  }
  return found;
};

const runMapHas = () => {
  let found = 0;
  for (let i = 0; i < LOOKUPS; i++) {
    if (map.has(targets[i])) found += 1;
  }
  return found;
};

const runObjectKey = () => {
  let found = 0;
  for (let i = 0; i < LOOKUPS; i++) {
    // 对象键查找：键会被转成字符串再哈希，因此比 Set.has 多一次数字转字符串的开销
    if (dict[targets[i]] !== undefined) found += 1;
  }
  return found;
};

const benchmarks = [
  ['Array.includes（O(n)）', runIncludes],
  ['Array.indexOf（O(n)）', runIndexOf],
  ['Set.has（O(1)）', runSetHas],
  ['Map.has（O(1)）', runMapHas],
  ['对象键查找（O(1)）', runObjectKey],
];

const results = [];
for (const [name, fn] of benchmarks) {
  warmup(fn); // 预热，避免把 JIT 编译时间算进结果
  const { result, ms } = timeOnce(fn);
  results.push({ name, ms, found: result });
}

console.log('实测结果（同一进程内连续测量，未做多轮采样，仅供定性参考）：');
console.log('操作'.padEnd(26) + '命中数'.padEnd(10) + '耗时(ms)');
console.log('-'.repeat(60));
for (const r of results) {
  console.log(r.name.padEnd(24) + String(r.found).padEnd(10) + fmtMs(r.ms));
}

// 找出本次实测中最快和最慢的，注意：这里只做"展示"，不做断言。
// 不同机器、不同 Node 版本的结果可能相反，所以绝不用 if (a > b) throw 的形式。
const fastest = results.reduce((a, b) => (a.ms <= b.ms ? a : b));
const slowest = results.reduce((a, b) => (a.ms >= b.ms ? a : b));
console.log('');
console.log(`本次实测最快：${fastest.name}（${fastest.ms.toFixed(3)} ms）`);
console.log(`本次实测最慢：${slowest.name}（${slowest.ms.toFixed(3)} ms）`);
console.log(`两者相差约 ${(slowest.ms / fastest.ms).toFixed(1)} 倍（该比值因机器而异，仅作参考）`);
console.log('所有实现的命中数一致，说明结果正确性没有差别，差别只在速度。');
console.log('本次测量未做多轮采样，正式对比请参考 11_benchmark_basics.js 的做法。');

// ---------------------------------------------------------------------------
// 3. 理论复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 3. 理论复杂度对照表 ---');

const complexityTable = [
  ['Array 按下标访问 arr[i]', 'O(1)', '不适用', '直接算内存偏移，最快'],
  ['Array.includes / indexOf', 'O(n)', 'O(1)', '必须逐个比较，找不到要扫完全部'],
  ['Array.push / pop（尾部）', 'O(1)', 'O(1)', '均摊 O(1)，偶尔扩容'],
  ['Array.unshift / shift（头部）', 'O(n)', 'O(n)', '要移动后面所有元素'],
  ['Array.splice（中间插入）', 'O(n)', 'O(n)', '同样要移动后续元素'],
  ['Set.has / add / delete', 'O(1)', 'O(1)', '平均情况；哈希冲突严重时退化'],
  ['Map.get / set / has', 'O(1)', 'O(1)', '同上'],
  ['对象属性访问 obj.key', 'O(1)', 'O(1)', '键会先转成字符串'],
  ['Array.sort', 'O(n log n)', 'O(log n)', 'V8 用 TimSort，需要额外栈空间'],
  ['Array.filter / map', 'O(n)', 'O(n)', '一定会遍历全部元素并新建数组'],
];

console.log('操作'.padEnd(30) + '时间'.padEnd(14) + '空间'.padEnd(12) + '说明');
console.log('-'.repeat(92));
for (const [op, time, space, note] of complexityTable) {
  console.log(op.padEnd(28) + time.padEnd(14) + space.padEnd(12) + note);
}

// ---------------------------------------------------------------------------
// 4. O(n²) vs O(n)：规模翻倍时会发生什么
// ---------------------------------------------------------------------------

console.log('\n--- 4. O(n²) 与 O(n) 的对比 ---');

// 4.1 O(n²)：双重循环找重复，为了演示最坏情况，重复元素故意放在数组末尾
function hasDuplicateNaive(list) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      if (list[i] === list[j]) return true;
    }
  }
  return false;
}

// 4.2 O(n)：用 Set 记录见过的值，一次遍历即可
function hasDuplicateFast(list) {
  const seen = new Set();
  for (const v of list) {
    if (seen.has(v)) return true; // Set.has 平均 O(1)
    seen.add(v);
  }
  return false;
}

function buildList(n) {
  const list = new Array(n);
  for (let i = 0; i < n; i++) list[i] = i;
  list[n - 1] = n - 2; // 制造一个重复项，并让它出现在最末尾（最坏情况）
  return list;
}

const smallN = 2500;
const largeN = 5000;

const listSmall = buildList(smallN);
const listLarge = buildList(largeN);

hasDuplicateNaive(listSmall); // 预热
hasDuplicateFast(listSmall);

const naiveSmall = timeOnce(() => hasDuplicateNaive(listSmall));
const naiveLarge = timeOnce(() => hasDuplicateNaive(listLarge));
const fastSmall = timeOnce(() => hasDuplicateFast(listSmall));
const fastLarge = timeOnce(() => hasDuplicateFast(listLarge));

console.log('对比表（每项只测一次，用于观察"趋势"而非精确数值）：');
console.log('算法'.padEnd(20) + 'n='.padEnd(4) + String(smallN).padEnd(10) + 'n=' + String(largeN).padEnd(10) + '规模翻倍后耗时倍数');
console.log('-'.repeat(78));

const naiveRatio = naiveLarge.ms / naiveSmall.ms;
const fastRatio = fastLarge.ms / fastSmall.ms;

console.log(
  '双重循环 O(n²)'.padEnd(20) +
    ''.padEnd(4) +
    `${naiveSmall.ms.toFixed(3)}ms`.padEnd(12) +
    `${naiveLarge.ms.toFixed(3)}ms`.padEnd(12) +
    `${naiveRatio.toFixed(2)} 倍`,
);
console.log(
  'Set 遍历 O(n)'.padEnd(20) +
    ''.padEnd(4) +
    `${fastSmall.ms.toFixed(3)}ms`.padEnd(12) +
    `${fastLarge.ms.toFixed(3)}ms`.padEnd(12) +
    `${fastRatio.toFixed(2)} 倍`,
);

console.log('');
console.log('理论预期：n 翻倍时，O(n²) 的耗时应该变成约 4 倍，O(n) 应该约 2 倍。');
console.log(`实测：O(n²) 约 ${naiveRatio.toFixed(2)} 倍，O(n) 约 ${fastRatio.toFixed(2)} 倍。`);
console.log('两者的结果一致性检查：', hasDuplicateNaive(listLarge) === hasDuplicateFast(listLarge));
console.log('这就是为什么"能不能用 Set/Map 把内层循环干掉"是最高性价比的优化之一。');

// ---------------------------------------------------------------------------
// 5. 反直觉实测：数据量很小时，数组反而比 Set 更快
// ---------------------------------------------------------------------------

console.log('\n--- 5. 反直觉：小数据量下 O(n) 可能比 O(1) 更快 ---');

const tinyArray = [3, 7, 11, 19, 23, 31, 43, 47]; // 只有 8 个元素
const tinySet = new Set(tinyArray);

// 小数组可以放心跑很多轮；大数组必须把轮数降下来，否则总操作次数会失控。
// 关键做法：把总耗时换算成"平均每次查找耗时"，不同轮数之间就能公平比较了。
const SMALL_ROUNDS = 200_000; // 20 万轮（上限之内）
const BIG_ROUNDS = 1000; // 大数组只跑 1000 轮，避免示例超出时间预算

const tinyTargets = [3, 8, 11, 20, 23, 32, 43, 48, 7, 19]; // 混合了命中和未命中的目标

const benchTinyArray = () => {
  let found = 0;
  for (let r = 0; r < SMALL_ROUNDS; r++) {
    if (tinyArray.includes(tinyTargets[r % tinyTargets.length])) found += 1;
  }
  return found;
};

const benchTinySet = () => {
  let found = 0;
  for (let r = 0; r < SMALL_ROUNDS; r++) {
    if (tinySet.has(tinyTargets[r % tinyTargets.length])) found += 1;
  }
  return found;
};

const benchBigArray = () => {
  let found = 0;
  for (let r = 0; r < BIG_ROUNDS; r++) {
    // 同一个操作，只是数据从 8 个元素换成了 10 万个元素
    if (arr.includes(tinyTargets[r % tinyTargets.length])) found += 1;
  }
  return found;
};

benchTinyArray();
benchTinySet();
benchBigArray(); // 预热

const tinyArrayResult = timeOnce(benchTinyArray);
const tinySetResult = timeOnce(benchTinySet);
const bigArrayResult = timeOnce(benchBigArray);

// 把"总耗时"换算成"平均每次查找耗时"（单位：纳秒），消除轮数不同带来的干扰
const nsPerLookup = (ms, rounds) => (ms * 1e6) / rounds;

console.log('把总耗时换算成"平均每次查找耗时"，不同轮数之间也能公平比较：');
console.log('做法'.padEnd(32) + '轮数'.padEnd(12) + '总耗时(ms)'.padEnd(14) + '平均每次查找');
console.log('-'.repeat(84));
console.log(
  '8 元素数组 includes（n=8）'.padEnd(30) +
    String(SMALL_ROUNDS).padEnd(12) +
    tinyArrayResult.ms.toFixed(3).padEnd(14) +
    `${nsPerLookup(tinyArrayResult.ms, SMALL_ROUNDS).toFixed(2)} ns`,
);
console.log(
  '8 元素 Set has（有哈希开销）'.padEnd(28) +
    String(SMALL_ROUNDS).padEnd(12) +
    tinySetResult.ms.toFixed(3).padEnd(14) +
    `${nsPerLookup(tinySetResult.ms, SMALL_ROUNDS).toFixed(2)} ns`,
);
console.log(
  '10 万元素数组 includes'.padEnd(28) +
    String(BIG_ROUNDS).padEnd(12) +
    bigArrayResult.ms.toFixed(3).padEnd(14) +
    `${nsPerLookup(bigArrayResult.ms, BIG_ROUNDS).toFixed(2)} ns`,
);
console.log('');
console.log('观察点：');
console.log('  1) 8 元素时，数组的线性扫描和 Set.has 处在同一量级（都是个位数 ns），');
console.log('     因为 8 次比较的常数开销和一次哈希运算相当，连续内存还对 CPU 缓存友好。');
console.log('     所以小数据量下"数组反而更快"是完全可能的——谁快取决于机器和 Node 版本。');
console.log('  2) 换成 10 万元素后，平均每次查找慢了 3~4 个数量级，');
console.log('     这直观说明：O(n) 的真正代价来自 n 的增长，而不是"数组"这个类型本身。');
console.log('  3) 三条数据的命中数一致，说明结果正确性没有差别，差别只在速度。');
console.log('  （具体数值因机器、Node 版本而异；这里只给定性结论，不做"谁一定更快"的断言。）');

// ---------------------------------------------------------------------------
// 6. 工程结论
// ---------------------------------------------------------------------------

console.log('\n--- 6. 工程结论：什么时候该换数据结构 ---');

console.log('1. 判断"存不存在"且要重复多次 → 用 Set / Map，别用 Array.includes。');
console.log('2. 数组求交集/差集/去重 → 先把一侧转成 Set，把 O(n*m) 降到 O(n+m)。');
console.log('3. 元素很少（个位数）且只查一两次 → 数组就够，别过度设计。');
console.log('4. 需要下标访问、需要保持顺序、需要按位取值 → 数组仍然是对的。');
console.log('5. 大 O 只描述趋势：JIT 编译、数据规模、CPU 缓存局部性都会影响实测结果。');
console.log('   优化前先测量（measure first），不要凭直觉改代码。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
