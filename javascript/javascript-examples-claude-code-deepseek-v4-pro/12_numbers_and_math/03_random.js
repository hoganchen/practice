/**
 * ============================================================================
 * 知识点：Math.random —— 范围随机、整数随机、随机取元素、洗牌算法
 * ============================================================================
 *
 * 【所属分类】12_numbers_and_math —— 数字与数学运算
 * 【难度等级】进阶
 * 【前置知识】12_numbers_and_math/02_rounding.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Math.random() 返回一个 [0, 1) 区间内的伪随机浮点数（包含 0，不包含 1）。
 *    它没有参数，也无法指定种子，因此结果不可复现。
 *    基于它可以构造出各种随机需求：
 *      任意范围浮点   min + Math.random() * (max - min)
 *      任意范围整数   Math.floor(Math.random() * (max - min + 1)) + min
 *      随机取数组元素 arr[Math.floor(Math.random() * arr.length)]
 *      洗牌           Fisher-Yates 算法
 *      随机布尔       Math.random() < 0.5
 *      按权重随机     累积概率 + 二分或线性扫描
 *
 * 2. 为什么需要
 *    抽奖、验证码、随机昵称、测试数据生成、游戏掉落、A/B 分流、
 *    随机排序展示等场景都会用到。理解"随机区间是左闭右开"是写对公式的前提。
 *
 * 3. 核心语法要点
 *    - Math.random() 的取值区间是 [0, 1)，所以 Math.random() * n 是 [0, n)。
 *    - 取整数时必须用 Math.floor（不能用 Math.round，否则两端概率会减半）。
 *    - 需要"包含 max"时，公式里的长度要写 max - min + 1。
 *    - Fisher-Yates 洗牌的核心：从后往前，每次在当前未处理的范围内随机挑一个交换。
 *      它保证每种排列出现的概率相等（O(n) 时间，无额外空间）。
 *    - 洗牌不要把 random 当比较函数传给 sort：
 *      arr.sort(() => Math.random() - 0.5) 的分布是不均匀的，且不同引擎结果不同。
 *    - 需要"可复现的随机"（测试、游戏存档、确定性渲染）时应自己实现伪随机
 *      生成器（如 mulberry32），或使用 crypto 模块的 randomUUID 等。
 *    - 安全场景（密码、令牌）必须用 node:crypto 的 randomInt / randomBytes，
 *      Math.random 是可预测的，不能用于安全用途。
 *
 * 4. 常见陷阱
 *    - 用 Math.round 取整数导致首尾数字被选中的概率只有中间数字的一半。
 *    - 忘记 +1 导致最大值永远取不到。
 *    - min > max 时公式会给出意料之外的结果（应提前校验或交换）。
 *    - 用 sort + 随机比较函数"洗牌"会引入统计偏差，还可能触发引擎的排序行为差异。
 *    - 每轮循环都重新调用 Math.random() 却忘了把它存下来，导致同一次抽样的多个
 *      部分用的是不同的随机值（例如按权重抽取时把权重和随机数算错了）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 12_numbers_and_math/03_random.js
 *
 * 【预期输出】
 *   演示各种随机公式的取值范围，并统计多次抽样验证分布是否符合预期。
 *   注意：由于随机性，每次运行的具体数字都不同，但统计结论一致。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Math.random() 的基础行为
// ---------------------------------------------------------------------------

console.log('--- 1. Math.random 基础 ---');

console.log('Math.random() =', Math.random());
console.log('Math.random() =', Math.random());
console.log('每次调用都不一样：', Math.random() !== Math.random());

// 验证取值范围：连续采样 10 万次，检查是否都落在 [0, 1) 内
const SAMPLES = 100_000;
let inRange = true;
let minSeen = Infinity;
let maxSeen = -Infinity;
for (let i = 0; i < SAMPLES; i++) {
  const r = Math.random();
  if (r < 0 || r >= 1) inRange = false;
  if (r < minSeen) minSeen = r;
  if (r > maxSeen) maxSeen = r;
}
console.log(`\n采样 ${SAMPLES} 次：`);
console.log('  全部落在 [0, 1) 内：', inRange);
console.log('  本次最小观测值：', minSeen);
console.log('  本次最大观测值：', maxSeen);
console.log('  均值（期望 0.5）：', // 中心极限定理保证均值接近 0.5
  (() => {
    let sum = 0;
    for (let i = 0; i < SAMPLES; i++) sum += Math.random();
    return sum / SAMPLES;
  })());

// ---------------------------------------------------------------------------
// 2. 任意范围的浮点数
// ---------------------------------------------------------------------------

console.log('--- 2. 范围浮点数 ---');

/** 返回 [min, max) 内的随机浮点数 */
function randomFloat(min, max) {
  // 先校验参数顺序，避免调用方传反了导致结果恒定
  if (min > max) [min, max] = [max, min];
  return min + Math.random() * (max - min);
}

console.log('randomFloat(0, 1) =', randomFloat(0, 1));
console.log('randomFloat(-5, 5) =', randomFloat(-5, 5));
console.log('randomFloat(10, 20) =', randomFloat(10, 20));
console.log('传反也能正常工作：', randomFloat(20, 10));

// 验证范围与位置：采样 5 万次，看有多少落在 [0, 10) 的前半段
let firstHalf = 0;
for (let i = 0; i < 50_000; i++) {
  if (randomFloat(0, 10) < 5) firstHalf++;
}
console.log('\n[0,10) 中落在 [0,5) 的比例（期望约 50%）：', ((firstHalf / 50_000) * 100).toFixed(2) + '%');

// ---------------------------------------------------------------------------
// 3. 整数随机 —— 最常用的公式
// ---------------------------------------------------------------------------

console.log('--- 3. 整数随机 ---');

/** 返回 [min, max] 内的随机整数（两端都包含） */
function randomInt(min, max) {
  // 先规整为整数，避免传入小数时公式失真
  min = Math.ceil(Math.min(min, max));
  max = Math.floor(Math.max(min, max));
  // 区间长度是 max - min + 1，这样才能包含 max
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

console.log('randomInt(1, 6) 模拟骰子：', randomInt(1, 6));
console.log('randomInt(1, 6) 模拟骰子：', randomInt(1, 6));
console.log('randomInt(0, 100)：', randomInt(0, 100));
console.log('randomInt(-10, 10)：', randomInt(-10, 10));
console.log('randomInt(5, 5)（区间只有一个值）：', randomInt(5, 5));

// 致命错误示范：用 Math.round 取整数
function badRandomInt(min, max) {
  // round 会让两端值的"捕获区间"只有半个单位，概率减半
  return Math.round(min + Math.random() * (max - min));
}

// 统计两种实现下各数值出现的次数
const goodCounts = {};
const badCounts = {};
const ROUNDS = 60_000;
for (let i = 0; i < ROUNDS; i++) {
  const g = randomInt(1, 6);
  const b = badRandomInt(1, 6);
  goodCounts[g] = (goodCounts[g] || 0) + 1;
  badCounts[b] = (badCounts[b] || 0) + 1;
}

console.log('\n 点数  正确实现      错误实现（round）');
for (let face = 1; face <= 6; face++) {
  const g = ((goodCounts[face] / ROUNDS) * 100).toFixed(2) + '%';
  const b = ((badCounts[face] / ROUNDS) * 100).toFixed(2) + '%';
  console.log(`  ${face}    ${g.padEnd(14)}${b}`);
}
console.log('  期望每面约 16.67%；用 round 时两端的 1 和 6 只在约 10%，中间四面各约 20%');

// 验证取值范围：确认 max 真的能被取到
let sawMax = false;
let sawMin = false;
for (let i = 0; i < 10_000; i++) {
  const v = randomInt(1, 3);
  if (v === 3) sawMax = true;
  if (v === 1) sawMin = true;
  if (sawMax && sawMin) break;
}
console.log('\n1 和 3 都能被取到：', sawMin && sawMax);

// ---------------------------------------------------------------------------
// 4. 随机取数组元素
// ---------------------------------------------------------------------------

console.log('--- 4. 随机取元素 ---');

/** 从数组中随机取一个元素 */
function pickOne(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

const fruits = ['苹果', '香蕉', '橘子', '西瓜'];
console.log('随机取一个：', JSON.stringify(pickOne(fruits)));
console.log('随机取一个：', JSON.stringify(pickOne(fruits)));
console.log('空数组：', String(pickOne([]))); // undefined，不会报错

/** 从数组中随机取 n 个不重复的元素 */
function pickSome(arr, n) {
  if (!Array.isArray(arr)) return [];
  // 先复制再洗牌，避免修改调用方传入的数组
  const copy = [...arr];
  shuffle(copy);
  // n 超过长度时返回全部，不会越界
  return copy.slice(0, Math.max(0, Math.min(n, copy.length)));
}

// 注意：shuffle 的定义在下面，函数声明会提升，所以这里可以提前使用
const lottery = Array.from({ length: 10 }, (_, i) => i + 1);
console.log('\n10 个号码抽 3 个：', JSON.stringify(pickSome(lottery, 3)));
console.log('抽 3 个结果不重复：', new Set(pickSome(lottery, 3)).size === 3);
console.log('抽 20 个（超过长度）：', JSON.stringify(pickSome([1, 2, 3], 20)));

// 验证分布均匀：每个元素被抽中的比例应接近 1/4
const pickCounts = { 苹果: 0, 香蕉: 0, 橘子: 0, 西瓜: 0 };
for (let i = 0; i < 40_000; i++) {
  pickCounts[pickOne(fruits)]++;
}
console.log('\n各元素被抽中比例（期望 25%）：');
for (const f of fruits) {
  console.log(`  ${f}  ${((pickCounts[f] / 40_000) * 100).toFixed(2)}%`);
}

// 按权重随机（例如中奖概率）
function pickWeighted(items) {
  // items 形如 [{ value: '一等奖', weight: 1 }, ...]
  const total = items.reduce((sum, it) => sum + it.weight, 0);
  // 只在这一次抽样里生成一个随机数
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.weight;
    // 减到小于 0 说明落在了这一项的区间里
    if (r < 0) return it.value;
  }
  // 浮点误差兜底：返回最后一项
  return items[items.length - 1].value;
}
const prizes = [
  { value: '一等奖', weight: 1 },
  { value: '二等奖', weight: 9 },
  { value: '三等奖', weight: 90 },
];
const prizeCounts = {};
for (let i = 0; i < 30_000; i++) {
  const p = pickWeighted(prizes);
  prizeCounts[p] = (prizeCounts[p] || 0) + 1;
}
console.log('\n按权重抽奖（期望 1% / 9% / 90%）：');
for (const { value } of prizes) {
  console.log(`  ${value}  ${((prizeCounts[value] / 30_000) * 100).toFixed(2)}%`);
}

// ---------------------------------------------------------------------------
// 5. Fisher-Yates 洗牌
// ---------------------------------------------------------------------------

console.log('--- 5. Fisher-Yates 洗牌 ---');

/**
 * 原地洗牌（Fisher-Yates / Knuth shuffle）。
 * 从最后一位开始，每次在 [0, i] 中随机挑一个位置与 i 交换。
 * 这样一共有 n! 种等概率的排列，是数学上正确的洗牌算法。
 */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    // j 的范围是 0..i，包含 i 自身（表示"这次不换"）
    const j = Math.floor(Math.random() * (i + 1));
    // 解构赋值交换两个元素
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const deck = ['A', 'B', 'C', 'D', 'E'];
console.log('原始：', JSON.stringify(deck));
// 注意 shuffle 是原地修改，需要保留原数组时要先复制
console.log('洗牌后：', JSON.stringify(shuffle([...deck])));
console.log('再洗一次：', JSON.stringify(shuffle([...deck])));
console.log('原数组未被修改：', JSON.stringify(deck));

// 验证"不修改原数组"与"元素不丢失"
const original = [1, 2, 3, 4, 5, 6, 7, 8];
const shuffled = shuffle([...original]);
console.log('\n洗牌前后元素集合相同：', JSON.stringify([...shuffled].sort((a, b) => a - b)) === JSON.stringify(original));

// 验证排列均匀性：统计 5 个元素时每种排列出现的次数
const perms = ['A', 'B', 'C'];
const permCounts = {};
const TRIALS = 60_000;
for (let i = 0; i < TRIALS; i++) {
  const p = shuffle([...perms]).join('');
  permCounts[p] = (permCounts[p] || 0) + 1;
}
console.log('\n3 个元素共 6 种排列，每种期望约 16.67%：');
for (const p of Object.keys(permCounts).sort()) {
  console.log(`  ${p}  ${((permCounts[p] / TRIALS) * 100).toFixed(2)}%`);
}

// 对比：错误的洗牌方式（sort + 随机比较函数）分布不均
function badShuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
const badPermCounts = {};
for (let i = 0; i < TRIALS; i++) {
  const p = badShuffle(perms).join('');
  badPermCounts[p] = (badPermCounts[p] || 0) + 1;
}
console.log('\n错误洗牌方式的分布（明显偏离 16.67%）：');
for (const p of Object.keys(badPermCounts).sort()) {
  const ratio = ((badPermCounts[p] / TRIALS) * 100).toFixed(2);
  console.log(`  ${p}  ${ratio}%`);
}

// ---------------------------------------------------------------------------
// 6. 其它常见需求
// ---------------------------------------------------------------------------

console.log('--- 6. 其它常见需求 ---');

/** 随机布尔值：给定概率返回 true */
function randomBool(probability = 0.5) {
  // 把概率夹到 [0, 1]，防止传入越界值
  const p = Math.min(1, Math.max(0, probability));
  return Math.random() < p;
}
const bools = Array.from({ length: 10 }, () => randomBool());
console.log('随机布尔：', JSON.stringify(bools));
console.log('概率 0 恒为 false：', randomBool(0), randomBool(0));
console.log('概率 1 恒为 true：', randomBool(1), randomBool(1));

/** 生成随机密码（教学用途；安全场景请用 node:crypto） */
function randomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += charset[Math.floor(Math.random() * charset.length)];
  }
  return out;
}
console.log('\n随机密码：', randomPassword(12));
console.log('长度正确：', randomPassword(20).length === 20);

/** 生成随机验证码（数字） */
function randomCode(digits = 6) {
  let out = '';
  for (let i = 0; i < digits; i++) out += randomInt(0, 9);
  return out;
}
console.log('验证码：', randomCode(6));
console.log('长度正确：', randomCode(4).length === 4);

/**
 * 可复现的伪随机生成器示例（mulberry32）。
 * 给定同一个 seed，每次运行都会产生完全相同的一串数字，
 * 适合单元测试、游戏回放、确定性渲染等需要"可重复随机"的场景。
 */
function createSeededRandom(seed) {
  // 把种子规整成 32 位无符号整数
  let state = seed >>> 0;
  return function next() {
    // 这里用到的位运算与乘法是 mulberry32 算法的固定步骤
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    // 除以 2^32 得到 [0, 1)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const seededA = createSeededRandom(20240101);
const seededB = createSeededRandom(20240101);
const seqA = Array.from({ length: 5 }, () => Number(seededA().toFixed(6)));
const seqB = Array.from({ length: 5 }, () => Number(seededB().toFixed(6)));
console.log('\n相同种子产生的序列：', JSON.stringify(seqA));
console.log('再生成一次：        ', JSON.stringify(seqB));
console.log('序列完全一致：', JSON.stringify(seqA) === JSON.stringify(seqB));

const seededC = createSeededRandom(20240102);
const seqC = Array.from({ length: 5 }, () => Number(seededC().toFixed(6)));
console.log('不同种子：', JSON.stringify(seqC));
console.log('与上一个种子产生的序列不同：', JSON.stringify(seqA) !== JSON.stringify(seqC));

console.log('\n全部演示完毕。');
