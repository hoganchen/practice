/**
 * ============================================================================
 * 知识点：安全随机数 —— Math.random 为什么不能用、crypto 系列 API、取模偏差与常量时间比较
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/01_input_validation.js、26_node_core（Node 内置模块）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "随机数"有两个截然不同的用途，对随机性的要求也完全不同：
 *      (a) **统计随机**（游戏抽奖动画、随机排序、A/B 分桶、随机占位图）：
 *          只要"看起来没规律、分布大致均匀"就够了。
 *      (b) **密码学安全随机**（会话 ID、令牌、验证码、密码重置链接、盐值、加密密钥、
 *          nonce、初始化向量）：不仅要"看起来随机"，还必须满足两条硬要求：
 *            · 不可预测：知道了前面若干个输出，也推不出后面的输出；
 *            · 不可重现：给定相同输入也得不到相同输出（没有可推断的种子）。
 *    `Math.random()` 只满足 (a)。它的实现是**伪随机数生成器（PRNG）**：
 *    内部维护一个"种子 + 状态"，按固定算法迭代产生输出。
 *    V8 用的是 xorshift128+（自 2015 年起为应对可预测性问题而改进的实现），
 *    但无论算法怎么换，它**始终不是密码学安全的**：
 *      - 状态空间有限，输出足够多时可以反推内部状态，进而预测全部后续输出；
 *      - 种子来自内部熵源且是**进程级共享**的，你的应用和任何第三方库共用同一条流；
 *      - 它的目标是"快"，不是"不可预测"，语言规范也明确不保证密码学安全性。
 *    正确做法：用 `node:crypto` 的随机 API（或浏览器/Worker 的 `crypto`）：
 *      - `crypto.randomUUID()`   -> 生成 RFC 4122 v4 UUID
 *      - `crypto.randomInt(min, max)` -> 生成 [min, max) 区间的**无偏**整数
 *      - `crypto.randomBytes(n)`  -> 生成 n 字节随机数据
 *      - `crypto.getRandomValues(typedArray)` -> 用随机字节填充定型数组（Web Crypto 标准）
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) 会话/令牌可预测 = 账号被接管：如果会话 ID 用 Math.random 生成，
 *        攻击者拿到自己的会话 ID，就能推断出别人的 ID，直接劫持（经典 CVE 类型）。
 *    (b) 验证码/OTP 可预测 = 任意账号可登录：验证码是"短期密码"，
 *        用可预测的随机源生成，等于给攻击者开了后门。
 *    (c) 密码重置链接可预测 = 任意账号被重置。
 *    (d) 加密用的盐/nonce/IV 可预测 = 加密被破（尤其影响 AES-GCM 这类模式的安全性）。
 *    (e) 抽奖/发券/秒杀这类"涉及钱"的场景，随机数可预测还可能造成直接资损。
 *
 * 3. 核心语法要点
 *    (a) **取模偏差（modulo bias）**：这是最容易被忽略的实现级漏洞。
 *        用 `randomByte() % 10` 取 0~9 时，因为 256 不是 10 的整数倍，
 *        byte 值 0~5 会多出现一次（256 = 25*10 + 6），于是 0~5 的概率是 26/256，
 *        而 6~9 是 25/256 —— 分布不均匀。
 *        正确做法：用 `crypto.randomInt(min, max)`（内部用拒绝采样，保证无偏），
 *        或者自己用拒绝采样：丢弃落在"尾部余数区间"的样本。
 *    (b) `crypto.randomInt(min, max)` 的区间是**左闭右开** `[min, max)`，
 *        且 max 必须大于 min。生成 6 位验证码就是 `randomInt(0, 1_000_000)`。
 *    (c) **常量时间比较**：判断"用户提交的 token 是否等于服务端存的 token"时，
 *        用 `===` / `String.prototype.includes` 会在第一个不同字符处提前返回，
 *        比较耗时与"匹配了多少个前缀字符"相关 —— 攻击者可据此逐字节爆破（时序攻击）。
 *        应该用 `crypto.timingSafeEqual(a, b)`，它总是比较完整长度，耗时不随内容变化。
 *        注意：它要求两个参数**长度相同**，否则直接抛错（这是它刻意设计的：
 *        长度不同本身就泄漏了信息，调用方应当先自行处理）。
 *    (d) `randomBytes(n).toString('base64url')` 是生成 URL 安全 token 的常用姿势。
 *        32 字节 = 256 比特熵，已经远超暴力破解可行性。
 *    (e) 熵的直觉：token 的安全强度取决于**熵的比特数**，与"字符有多乱"无关。
 *        `randomInt(0, 10**6)` 只有约 20 比特熵（100 万种可能），只能当短期验证码；
 *        而 `randomBytes(32)` 有 256 比特，才能当长期令牌。
 *
 * 4. 常见陷阱
 *    - 用 `Math.random()` 生成任何跟安全相关的东西（会话、令牌、验证码、盐、密钥）。
 *    - 用 `Date.now()`、`process.pid`、自增计数器、`Math.random()` 拼 token ——
 *      这些都是可枚举/可预测的"伪熵"。
 *    - 取模偏差：`randomBytes(1)[0] % 36` 选字符、`% 6` 掷骰子，分布都不均匀。
 *    - 用长度可变的比较做 token 校验：`if (input === stored)` 是时序泄漏；
 *      正则/`includes` 也一样。
 *    - `crypto.randomInt` 与 `randomBytes` 混用后忘记它们是**同步**的（都会阻塞，
 *      依赖系统熵池）—— 不要在超高频热路径里一次性要几十 KB。
 *    - 以为"UUID v4 就等于密码学安全 ID"：randomUUID 确实是密码学安全的，
 *      但如果你自己拼 `uuid` 库用 Math.random 做兜底，就又回去了。
 *    - 熵不够却当成够用：4 位验证码只有 1 万种可能，必须配"尝试次数限制 + 有效期"，
 *      单靠随机性是挡不住在线爆破的。
 *    - 把随机数当"唯一性保证"：生成 ID 要的是唯一性（可能用计数器/雪花算法），
 *      生成令牌要的才是不可预测性 —— 两者别混。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/09_secure_random.js
 *
 * 【预期输出】
 *   先用一个自制的"小号 PRNG"演示"伪随机可以从输出反推状态、从而预测未来"，
 *   再统计 `randomBytes(1)[0] % 6` 的取模偏差（与 randomInt 对比）；
 *   然后实际生成 UUID、验证码、随机 token，并演示 timingSafeEqual 的用法与
 *   长度不等时的报错行为。全程退出码 0，且不对任何真实系统发起攻击。
 * ============================================================================
 */

import {
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
  webcrypto,
} from 'node:crypto';

// Web Crypto 的 getRandomValues：Node 18+ 全局就有 crypto，这里做一次兼容取值
const webCrypto = globalThis.crypto ?? webcrypto;

// ============================================================================
// 小节 1：Math.random 是什么 —— 一个"快但可预测"的 PRNG
// ============================================================================
console.log('--- 1. Math.random 的本质：伪随机（有种子、有状态、可预测）---');

console.log(`  Math.random() 连续 5 次输出：`);
for (let i = 0; i < 5; i += 1) {
  console.log(`    ${Math.random().toFixed(17)}`);
}
console.log('  观察点：这些数字看起来"很随机"，但生成它们的是一个确定性的算法 ——');
console.log('    内部有一个"种子 + 状态"，每一步按固定公式推进，输出只是状态的函数。');
console.log('    只要知道状态，就能算出后面所有的输出。');
console.log(`  V8（Node/Chrome 的引擎）用的是 xorshift128+ 类算法：`);
console.log('    - 目标是"快、分布均匀"，不是"不可预测"；');
console.log('    - 语言规范明确不保证密码学安全性（ECMAScript 只是"implementation-approximated"）；');
console.log('    - 各引擎实现不同（V8 / SpiderMonkey / JavaScriptCore 各不相同），');
console.log('      这意味着"你在 V8 上测试通过的随机性假设"换个引擎可能不成立；');
console.log('    - 它是**进程级共享**的一条随机流：你的代码、你依赖的库、日志库、');
console.log('      甚至某些测试框架都从同一条流里取数 —— 你无法控制谁看过哪些输出。');

// ============================================================================
// 小节 2：亲手演示"伪随机可预测" —— 用一个自制的小号 PRNG
// ============================================================================
console.log('\n--- 2. 演示：伪随机如何被"从输出反推状态"从而预测未来 ---');
console.log('  说明：下面的 LCG 是一个教学用的"极小号 PRNG"，用来把"可预测"这件事');
console.log('        演示得足够小、足够可验证。它不是在攻击 Math.random ——');
console.log('        而是说明"任何非密码学 PRNG 的共同弱点：状态可以被反推"。\n');

// 线性同余发生器（LCG）的参数：这是 Numerical Recipes 用的经典一组常数
const LCG_A = 1664525;
const LCG_C = 1013904223;
const LCG_M = 2 ** 32;

/**
 * 创建一个 LCG 伪随机数发生器。返回值是一个函数，每次调用产生 [0,1) 的浮点数。
 * @param {number} seed 初始种子
 * @returns {() => number} 生成器函数
 */
function createLcg(seed) {
  // >>> 0 把种子强制转成 32 位无符号整数，保证状态永远在 [0, 2^32) 内
  let state = seed >>> 0;
  return () => {
    // 状态推进：state = (a * state + c) mod m
    // 注意 (a * state) 最大约 1664525 * 4.29e9 ≈ 7.1e15，小于 2^53（约 9.0e15），
    // 所以这里用普通数字运算不会丢精度。
    state = (LCG_A * state + LCG_C) % LCG_M;
    // 归一化到 [0, 1) —— 因为 state/2^32 是二进制小数，float64 能精确表示
    return state / LCG_M;
  };
}

// 场景：某个"漏洞系统"用自制 PRNG 生成会话 ID（真实项目里对应的就是 Math.random）
const SECRET_SEED = 987654321;
const victimPrng = createLcg(SECRET_SEED);

// 攻击者观察到的"自己的会话 ID"（在真实场景里，攻击者可以反复注册来观察输出）
const observed = [victimPrng(), victimPrng(), victimPrng()];
console.log('  受害者的 PRNG 用了一个秘密种子（攻击者不知道）：');
console.log(`    secret seed = ${SECRET_SEED}`);
console.log('  攻击者注册了 3 次，观察到 3 个"会话 ID"：');
observed.forEach((v, i) => console.log(`    第 ${i + 1} 个输出 = ${v.toFixed(17)}`));

// ---- 攻击者视角：从 1 个输出反推状态 ----
// 输出 = 当前状态 / 2^32，而且 state/2^32 是"二进制小数"，float64 能精确表示，
// 所以 state = 输出 × 2^32 是**精确可逆**的（Math.round 在这里只是防御性去浮点尾巴）。
const recoveredState = Math.round(observed[0] * LCG_M);
console.log('\n  攻击者只需**第 1 个输出**就能反推内部状态：');
console.log(`    state = round(output × 2^32) = ${recoveredState}`);
console.log(`    （注意：这个状态不是"种子"，而是第 1 次推进后的内部状态；`);
console.log(`      但这对攻击者来说完全够用 —— 因为后续输出只依赖"当前状态"。）`);
console.log(`    真实种子是 ${SECRET_SEED}，state !== seed 吗？ ${recoveredState !== SECRET_SEED}`);

// ---- 用反推的状态预测后续输出 ----
// 关键：createLcg(recoveredState) 返回的函数"先推进状态再返回"，
// 所以它的第 1 次调用给出的正是受害者的第 2 个输出 —— 无需任何跳过。
const attackerPrng = createLcg(recoveredState);
console.log('\n  攻击者用反推的状态"重放"，预测受害者接下来的输出：');
let allPredicted = true;
for (let i = 1; i < observed.length; i += 1) {
  const predicted = attackerPrng();
  const actual = observed[i];
  const hit = predicted === actual;
  if (!hit) allPredicted = false;
  console.log(`    预测第 ${i + 1} 个 = ${predicted.toFixed(17)}  实际 = ${actual.toFixed(17)}  ${hit ? '✓ 命中' : '✗ 未命中'}`);
}
console.log(`  全部命中？ ${allPredicted}`);
console.log('\n  更进一步：LCG 的递推式 `state = (a*state + c) mod m` 是可以求逆的，');
console.log('  攻击者还能反向算出**最初的种子**。但对攻击者来说，"当前状态"已经足够');
console.log('  预测未来 —— 这正是"不可预测性"与"不可重现性"必须同时满足的原因。');
console.log('\n  结论：伪随机的输出一旦被观察到，内部状态就可能被反推，之后**所有**输出都可预测。');
console.log(`  把这个模型放大：V8 的 xorshift128+ 状态是 128 位，需要的样本多一些，`);
console.log(`  但性质完全一样 —— 有公开研究证明可以从若干输出恢复其状态。`);
console.log('  所以会话 ID / 令牌 / 验证码这类东西，必须用密码学安全随机源。');

// ============================================================================
// 小节 3：正确工具一 —— crypto.randomUUID()
// ============================================================================
console.log('\n--- 3. crypto.randomUUID()：生成安全的 UUID v4 ---');

const uuidList = Array.from({ length: 3 }, () => randomUUID());
console.log('  连续生成 3 个 UUID：');
uuidList.forEach((u) => console.log(`    ${u}`));
console.log(`  UUID v4 的格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`);
console.log(`    ${uuidList[0]}`);
console.log(`    第 13 位（版本号）应该是 '4'：${uuidList[0][14] === '4'}`);
console.log(`    第 17 位（变体位）应该是 8/9/a/b：${'89ab'.includes(uuidList[0][19])}`);
console.log('  熵量：其中 122 位是随机的（版本号与变体位是固定的），暴力猜中概率可忽略。');
console.log('  用途：请求 ID、trace ID（见 08 篇）、幂等键、不需要"用户不可见"的资源 ID。');
console.log('  注意：UUID v4 是"唯一 + 不可预测"的，但它**不是**密码 ——');
console.log('        它不包含任何秘密校验，作为"长期凭证"时仍需配合服务端存储与校验。');

// ============================================================================
// 小节 4：正确工具二 —— getRandomValues 与 randomBytes
// ============================================================================
console.log('\n--- 4. randomBytes / getRandomValues：拿原始随机字节 ---');

// ① node:crypto 的 randomBytes 返回 Buffer（Buffer 是 Uint8Array 的子类）
const buf16 = randomBytes(16);
console.log(`  randomBytes(16)                  = ${buf16.toString('hex')}`);
console.log(`    是 Buffer 吗？ ${Buffer.isBuffer(buf16)}，字节长度 = ${buf16.length}`);

// ② Web Crypto 标准 API：用随机字节填充定型数组（浏览器与 Node 都支持）
const typed = new Uint8Array(8);
webCrypto.getRandomValues(typed);
console.log(`  getRandomValues(new Uint8Array(8)) = ${Array.from(typed).join(', ')}`);
console.log(`    它是"就地填充"：修改传入的数组并把它返回，不分配新数组（性能好）。`);

// ③ 把随机字节表示成不同进制，理解"熵 vs 长度"
const buf8 = randomBytes(8);
console.log(`\n  同一份 8 字节随机数据的不同表示：`);
console.log(`    hex      (16 字符)  ${buf8.toString('hex')}`);
console.log(`    base64   (12 字符)  ${buf8.toString('base64')}`);
console.log(`    base64url(12 字符)  ${buf8.toString('base64url')}`);
console.log(`    UTF-8 直接当字符串是不可行的（大部分字节不是可打印字符），所以必须编码。`);
console.log(`    8 字节 = 64 比特熵 —— 不管写成 hex 还是 base64，熵都是 64 比特。`);
console.log(`    编码方式改变的是"长度和可读性"，不改变"安全强度"。`);

console.log('\n  熵的直觉对照表（决定"能不能被暴力枚举"）：');
const entropyTable = [
  ['4 位数字验证码', '10^4 ≈ 1.3 万种', '约 13 比特', '只能短期使用 + 限制尝试次数'],
  ['6 位数字验证码', '10^6 = 100 万种', '约 20 比特', '短期有效 + 限流（本文件小节 6 演示）'],
  ['6 位字母数字', '36^6 ≈ 22 亿种', '约 31 比特', '可用于较长有效期的链接'],
  ['randomBytes(16)', '2^128 种', '128 比特', '会话 ID、CSRF token 的常用规格'],
  ['randomBytes(32)', '2^256 种', '256 比特', '长期 API 密钥、密码重置 token'],
];
for (const [name, count, bits, usage] of entropyTable) {
  console.log(`    ${name.padEnd(16)} ${count.padEnd(18)} ${bits.padEnd(10)} ${usage}`);
}

// ============================================================================
// 小节 5：正确工具三 —— randomInt 与取模偏差
// ============================================================================
console.log('\n--- 5. 取模偏差（modulo bias）：一个"看起来对"的错误 ---');

console.log('  错误写法：randomBytes(1)[0] % 6 想得到 0~5 的均匀随机数。');
console.log('  问题在哪：一个字节的取值范围是 0~255，共 256 个值。');
console.log('            256 ÷ 6 = 42 余 4 —— 除不尽！');
console.log('            于是 0~3 各有 43 个来源，4~5 各有 42 个来源，概率不等。');

// 用大样本统计，把偏差"量出来"
const SAMPLES = 60_000; // 控制在几万级，避免拖慢示例
const biasedCounts = new Array(6).fill(0);
const unbiasedCounts = new Array(6).fill(0);
for (let i = 0; i < SAMPLES; i += 1) {
  // ① 有偏差：单字节取模
  biasedCounts[randomBytes(1)[0] % 6] += 1;
  // ② 无偏差：randomInt 内部用拒绝采样，保证均匀
  unbiasedCounts[randomInt(0, 6)] += 1;
}

/**
 * 把计数结果格式化成一行百分比。
 * @param {number[]} counts
 * @param {number} total
 * @returns {string}
 */
function formatDistribution(counts, total) {
  return counts.map((c) => ((c / total) * 100).toFixed(3).padStart(7) + '%').join(' ');
}

// 取模法的"理论"分布：0~3 各有 43 个来源，4~5 各有 42 个来源
const BIAS_THEORY = [43, 43, 43, 43, 42, 42].map((n) => n / 256);

console.log(`\n  样本数 ${SAMPLES.toLocaleString()}，均匀分布的理论概率是 16.667%：`);
console.log(`    结果值          :   ${[0, 1, 2, 3, 4, 5].map((v) => String(v).padStart(6)).join(' ')}`);
console.log(`    取模法 实测占比  : ${formatDistribution(biasedCounts, SAMPLES)}`);
console.log(`    取模法 理论概率  : ${formatDistribution(BIAS_THEORY, 1)}   <- 0~3 比 4~5 高`);
console.log(`    randomInt 实测   : ${formatDistribution(unbiasedCounts, SAMPLES)}   <- 均匀`);
console.log('  注意：光看"实测占比"是得不出结论的 —— 6 万样本下，随机波动（约 ±0.2 个百分点）');
console.log('        和偏差本身（约 0.4 个百分点）是同一量级。所以下面把**理论值**单独列出，');
console.log('        它才是"偏差确实存在"的严格证据。');

// 把偏差量化出来
const biasedZero = biasedCounts[0] / SAMPLES;
const biasedFive = biasedCounts[5] / SAMPLES;
const theoretical = 1 / 6;
console.log(`\n  量化对比（关键看理论值，它不随样本波动）：`);
console.log(`    均匀分布的理论概率       = ${(theoretical * 100).toFixed(4)}%`);
console.log(`    取模法 P(结果=0) 理论值  = ${(BIAS_THEORY[0] * 100).toFixed(4)}%（43/256）`);
console.log(`    取模法 P(结果=5) 理论值  = ${(BIAS_THEORY[5] * 100).toFixed(4)}%（42/256）`);
console.log(`    取模法 0 相对 5 的优势   ≈ ${(((43 / 256) / (42 / 256) - 1) * 100).toFixed(2)}%`);
console.log(`    （本次实测：P(0)=${(biasedZero * 100).toFixed(4)}%，P(5)=${(biasedFive * 100).toFixed(4)}% ——`);
console.log(`      数字落在噪声里，但方向由数学保证：0~3 永远偏高。）`);
console.log(`\n  这 2.38% 的相对优势看似微不足道，但它是**固定方向**的：`);
console.log('  跑一亿次也不会自己变均匀。在"抽奖/发券/随机分配稀缺资源"场景里，');
console.log('  攻击者用海量请求就能把这个概率倾斜放大成实际的利益差异。');

console.log('\n  取模偏差的正确处理方式：');
const moduloFixes = [
  ['首选：用 randomInt(min, max)', 'crypto.randomInt 内部实现了拒绝采样（rejection sampling），天然无偏'],
  ['自己写拒绝采样', '计算"最大可整除范围"，把落在尾部余数区间的样本丢弃后重取'],
  ['用足够大的字节数稀释', '偏差随范围增大而减小，但**永远不为零** —— 不要把它当解决方案'],
  ['别用浮点数绕', 'Math.floor(rand / 2**32 * 6) 看似没错，但浮点精度问题仍可能引入偏差'],
];
for (const [name, how] of moduloFixes) {
  console.log(`    - ${name}：${how}`);
}

// 演示一次"自己写拒绝采样"的完整实现，理解 randomInt 在内部做了什么
/**
 * 手写无偏整数生成器（拒绝采样），用来理解 randomInt 的内部原理。
 * @param {number} min 下界（含）
 * @param {number} max 上界（不含）
 * @returns {number} [min, max) 区间的均匀随机整数
 */
function unbiasedInt(min, max) {
  const range = max - min;
  if (range <= 0) throw new RangeError('max 必须大于 min');
  // 用一个足够大的取值空间：这里用 32 位（4 个字节）
  const SPACE = 2 ** 32;
  // limit 是"能被 range 整除的最大上界"。超过它的样本会造成偏差，必须丢弃。
  const limit = SPACE - (SPACE % range);
  for (;;) {
    // 从 4 个随机字节构造一个 [0, 2^32) 的整数（readUInt32BE 读的是大端序）
    const value = randomBytes(4).readUInt32BE(0);
    // 落在尾部余数区间就丢弃重来（这个分支的触发概率 < range/2^32，非常小）
    if (value < limit) return min + (value % range);
  }
}

const manualCounts = new Array(6).fill(0);
for (let i = 0; i < SAMPLES; i += 1) {
  manualCounts[unbiasedInt(0, 6)] += 1;
}
console.log(`\n  手写拒绝采样 unbiasedInt(0, 6) 的分布：`);
console.log(`    ${formatDistribution(manualCounts, SAMPLES)}   <- 同样是均匀的`);
console.log(`    它做的事和 crypto.randomInt 一样：拒绝会造成偏差的样本。`);
console.log(`    实际项目中直接用 randomInt 就好，这里是让你知道"它为什么是对的"。`);

// ============================================================================
// 小节 6：实战之一 —— 生成 6 位数字验证码（OTP）
// ============================================================================
console.log('\n--- 6. 实战：生成 6 位数字验证码（OTP）---');

/**
 * 【正确】用 randomInt 生成指定位数的数字验证码。
 * @param {number} [digits=6] 位数
 * @returns {string} 形如 "048213" 的验证码（保留前导零，所以是字符串）
 */
function generateOtp(digits = 6) {
  // 上界是 10^digits，且是**不含**的（左闭右开），所以刚好覆盖 0 ~ 10^digits-1
  const upper = 10 ** digits;
  const n = randomInt(0, upper);
  // padStart 补前导零：否则 12345 会变成 5 位，位数不定会泄漏"是否含前导零"的信息
  return String(n).padStart(digits, '0');
}

/**
 * 【错误】用 Math.random 生成验证码 —— 不要这样做。
 * 保留它只是为了对比，说明"看起来也能用"的写法其实不安全。
 * @param {number} [digits=6]
 * @returns {string}
 */
function generateOtpInsecure(digits = 6) {
  return String(Math.floor(Math.random() * 10 ** digits)).padStart(digits, '0');
}

console.log('  正确写法（crypto.randomInt）：');
for (let i = 0; i < 5; i += 1) console.log(`    ${generateOtp()}`);
console.log('  错误写法（Math.random）—— 长得一样，但可被预测：');
for (let i = 0; i < 5; i += 1) console.log(`    ${generateOtpInsecure()}`);
console.log('  两者输出看上去毫无差别，这正是危险之处 —— 光看结果分辨不出来。');
console.log('  但 Math.random 的历史输出可以被反推，攻击者能算出"下一个验证码是什么"。');

// 验证 OTP 分布的均匀性（也顺便验证"前导零会出现"）
const otpFirstDigitCounts = new Array(10).fill(0);
const OTP_SAMPLES = 50_000;
for (let i = 0; i < OTP_SAMPLES; i += 1) {
  otpFirstDigitCounts[Number(generateOtp()[0])] += 1;
}
console.log(`\n  ${OTP_SAMPLES.toLocaleString()} 个验证码的**首位数字**分布（应各约 10%）：`);
console.log(`    数字 : ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => String(v).padStart(6)).join(' ')}`);
console.log(`    占比 : ${otpFirstDigitCounts.map((c) => ((c / OTP_SAMPLES) * 100).toFixed(2).padStart(5) + '%').join(' ')}`);
console.log('  首位能取到 0，说明前导零被正确保留（这正是用 padStart 而不是转数字的原因）。');

console.log('\n  OTP 的安全要点（随机性只是一半）：');
const otpRules = [
  ['随机源必须是 crypto', '已演示'],
  ['有效期限要短', '通常 5~10 分钟，过期即失效（服务端存过期时间戳）'],
  ['尝试次数要限制', '6 位只有 100 万种可能，不限次数就会被在线爆破；一般 3~5 次失败即作废'],
  ['必须一次性', '校验成功后立即删除，防止重放'],
  ['绑定用途与会话', '把 OTP 与"手机号 + 场景"绑定，避免 A 场景的码用到 B 场景'],
  ['比较用常量时间', '见小节 7 —— 别用 === 直接比'],
];
for (const [rule, note] of otpRules) console.log(`    - ${rule}：${note}`);

// ============================================================================
// 小节 7：常量时间比较 —— timingSafeEqual
// ============================================================================
console.log('\n--- 7. 常量时间比较：为什么不能用 === 比 token ---');

console.log('  普通比较的致命细节：JavaScript 的字符串比较（===）会在**第一个不同的字符处**');
console.log('  立即返回 false —— 也就是说，"前 3 位对得上"和"第 1 位就错了"的耗时不同。');
console.log('  攻击者可以固定前 N 位、逐位尝试，用响应耗时把正确前缀一位一位"量"出来。');
console.log('  这类攻击叫时序攻击（timing attack），在网络抖动下需要大量样本，但**是可行的**。');

const serverToken = randomBytes(16); // 服务端保存的正确 token（Buffer）
console.log(`\n  服务端 token (hex) = ${serverToken.toString('hex')}`);

/**
 * 【正确】用 timingSafeEqual 做常量时间比较。
 * @param {Buffer|Uint8Array} a
 * @param {Buffer|Uint8Array} b
 * @returns {boolean} 是否相等
 */
function safeCompare(a, b) {
  // 前置检查：timingSafeEqual 要求长度相同，否则直接抛错。
  // 这一步本身会泄漏"长度是否相同"，所以实践中应让所有 token 长度固定一致。
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * 【错误】用 === 比较（示意，仅用于对照）。
 * @param {Buffer} a
 * @param {Buffer} b
 * @returns {boolean}
 */
function unsafeCompare(a, b) {
  return a.toString('hex') === b.toString('hex');
}

// 场景 1：完全正确的 token
const correctInput = Buffer.from(serverToken);
// 场景 2：前缀正确、最后一位错误（时序攻击者最关心的那种输入）
const almostRight = Buffer.from(serverToken);
almostRight[almostRight.length - 1] ^= 0xff; // 翻转最后一个字节
// 场景 3：第一位就错了
const wrongFromStart = Buffer.from(serverToken);
wrongFromStart[0] ^= 0xff;

console.log('\n  比较结果（两种实现给出相同的答案，区别在"耗时是否与内容相关"）：');
const compareCases = [
  ['完全正确', correctInput],
  ['只有最后 1 字节不同', almostRight],
  ['第 1 字节就不同', wrongFromStart],
];
for (const [label, input] of compareCases) {
  console.log(
    `    ${label.padEnd(20)} unsafe=${unsafeCompare(input, serverToken)}  safe=${safeCompare(input, serverToken)}`
  );
}
console.log('    两者的布尔结果完全一致 —— 安全性差异不在"答案"，而在"耗时曲线"。');

console.log('\n  长度不等时 timingSafeEqual 的行为：');
try {
  timingSafeEqual(Buffer.from('abc'), Buffer.from('abcd'));
  console.log('    居然没报错？');
} catch (err) {
  console.log(`    抛错: ${err.name}: ${err.message}`);
  console.log('    这是刻意设计：长度不同本身就泄漏了信息，库强制调用方自己先处理。');
  console.log('    所以实践上应保证"所有 token 长度固定"（如统一 randomBytes(16)），');
  console.log('    这样连"长度是否匹配"都不会成为侧信道。');
}

// 再演示一个常见的错误用法：用正则/includes 做前缀判断
console.log('\n  同样有问题的写法：');
console.log('    stored.startsWith(input)        // 提前返回，且语义上还允许"空输入通过"');
console.log('    stored.includes(input)          // 同上，而且要求匹配任意位置');
console.log('    JSON.parse(a) === JSON.parse(b) // 解析耗时可能随内容变化');
console.log('  凡是"根据比较对象的内容提前结束"的实现，都可能有时序侧信道。');

// 关于"微小耗时差异"的说明
console.log('\n  关于量测：本文件**不做**微基准计时对比 —— 单机上的耗时差异会被 JIT、');
console.log('  缓存、垃圾回收、操作系统调度完全淹没，测出来的数字没有说服力。');
console.log('  这里要传达的是**实现层面的性质**：timingSafeEqual 保证"比较次数与内容无关"，');
console.log('  而 === 不保证。信这个性质，而不是信某一次测出来的纳秒数。');

// ============================================================================
// 小节 8：实战之二 —— 生成随机 token（base64url 编码）
// ============================================================================
console.log('\n--- 8. 实战：生成密码学安全的随机 token ---');

/**
 * 生成 URL 安全的随机 token。
 * @param {number} [bytes=32] 随机字节数（决定熵量）
 * @returns {string} base64url 编码的 token
 */
function generateToken(bytes = 32) {
  // randomBytes 拿原始随机字节；base64url 用 - 和 _ 代替 + 和 /，
  // 并且不含 = 补位，因此可以直接放进 URL、查询串、header、文件名里。
  return randomBytes(bytes).toString('base64url');
}

console.log('  不同规格的 token（注意长度与熵的对应关系）：');
for (const n of [8, 16, 32]) {
  console.log(`    randomBytes(${String(n).padStart(2)}).toString('base64url') -> ${generateToken(n)}`);
}
console.log(`\n  为什么用 base64url 而不是 base64：`);
console.log(`    base64   可能包含 "+" 和 "/" 与 "="，放进 URL 需要再编码（%2B、%2F、%3D），`);
console.log(`             而且 "+" 在查询串里会被解成空格 —— 这是非常常见的踩坑点。`);
console.log(`    base64url把 "+"->"-"、"/"->"_"，并去掉 "=" 补位，URL 中直接可用。`);

// 演示 token 的唯一性（不是为了"证明随机"，而是展示"不会碰撞"）
const tokenSet = new Set();
for (let i = 0; i < 10_000; i += 1) tokenSet.add(generateToken(16));
console.log(`\n  生成 10,000 个 16 字节 token，去重后仍有 ${tokenSet.size} 个（无碰撞）。`);
console.log('  注意：这里只验证了"不碰撞"，没验证"不可预测" ——');
console.log('        不可预测性来自 randomBytes 的密码学性质，不是来自统计测试。');

console.log('\n  会话 ID / 密码重置 token 的推荐做法：');
const tokenRecipes = [
  ['会话 ID', 'randomBytes(16).toString("base64url") —— 128 比特，配 HttpOnly+Secure+SameSite Cookie'],
  ['密码重置 token', 'randomBytes(32).toString("base64url") —— 256 比特，一次性、15 分钟内有效'],
  ['CSRF token', 'randomBytes(16) —— 与会话绑定，每次表单渲染时刷新'],
  ['API 密钥', 'randomBytes(32) —— 服务端只存哈希，明文仅在创建时展示一次'],
  ['加密盐', 'randomBytes(16) —— 每个用户独立，绝不复用（复用会让彩虹表重新生效）'],
  ['文件下载链接', 'randomBytes(24) —— 不可预测的"能力 URL"（capability URL）'],
];
for (const [use, how] of tokenRecipes) {
  console.log(`    - ${use}：${how}`);
}
console.log('  共同点：**服务端只存哈希或随机值本身**，并且校验时用常量时间比较（小节 7）。');

// ============================================================================
// 小节 9：什么时候可以用 Math.random
// ============================================================================
console.log('\n--- 9. 什么时候 Math.random 是合适的 ---');
console.log('  判断标准只有一条：**这个随机数会不会影响安全或钱？**\n');

const usageGuide = [
  ['可以用 Math.random', '粒子动画的初始偏移、随机占位图、随机排序展示、A/B 分桶、示例数据的随机生成'],
  ['必须用 crypto', '会话 ID、任何 token、验证码/OTP、密码重置链接、加密盐/IV/nonce、密钥、抽奖中奖判定、发券码、邀请码'],
  ['拿不准时', '一律用 crypto —— 它的性能损失在现代硬件上小到可以忽略，用错的代价却无法承受'],
];
for (const [scene, examples] of usageGuide) {
  console.log(`  ● ${scene}`);
  console.log(`      ${examples}`);
}

// 顺手量化一下性能差异，说明"用 crypto 不会拖垮性能"
const PERF_N = 100_000;
let t0 = process.hrtime.bigint();
let sinkA = 0;
for (let i = 0; i < PERF_N; i += 1) sinkA += Math.random();
let t1 = process.hrtime.bigint();
const mathMs = Number(t1 - t0) / 1e6;

t0 = process.hrtime.bigint();
let sinkB = 0;
for (let i = 0; i < PERF_N; i += 1) sinkB += randomInt(0, 1000);
t1 = process.hrtime.bigint();
const cryptoMs = Number(t1 - t0) / 1e6;

console.log(`\n  性能对比（${PERF_N.toLocaleString()} 次取值，仅供量级参考）：`);
console.log(`    Math.random()     : ${mathMs.toFixed(1)} ms`);
console.log(`    crypto.randomInt  : ${cryptoMs.toFixed(1)} ms  （约 ${(cryptoMs / mathMs).toFixed(1)}x）`);
console.log(`    （sink 只是为了不让引擎把整个循环优化掉：${sinkA > 0 && sinkB > 0}）`);
console.log('  实测结论可能和"直觉"相反：在这个量级的循环里，两者**基本处于同一量级**');
console.log('  （倍数通常在 0.5x ~ 2x 之间来回波动，谁快谁慢每次跑都可能不一样）。');
console.log('  原因是现代 Node 的 randomInt 是从系统熵池驱动的内部缓冲取数，');
console.log('  单次调用的成本主要落在"函数调用与参数校验"上，而不是"等待熵"。');
console.log('  具体倍数会随 Node 版本、机器负载、JIT 状态剧烈波动 —— 不必纠结数字。');
console.log('  要带走的是这个结论：**用 crypto 做安全随机，性能上没有任何值得犹豫的代价**。');
console.log('  一次 HTTP 请求里生成几个 token 的开销，相对于网络与数据库完全不值一提。');
console.log('  绝对不要为了"省这点性能"去用 Math.random 承担安全风险。');

// ============================================================================
// 小节 10：小结
// ============================================================================
console.log('\n--- 10. 小结 ---');
console.log('  1) Math.random 是伪随机：有状态、可反推、进程级共享，**不满足密码学安全要求**。');
console.log('  2) 本文件用自制 LCG 实测：1 个输出就能反推状态，之后所有输出全部预测命中 ——');
console.log('     非密码学 PRNG 的弱点性质相同，只是需要的样本数量不同。');
console.log('  3) 正确 API：crypto.randomUUID()（UUID v4）、crypto.randomInt()（无偏整数）、');
console.log('     crypto.randomBytes()（原始字节）、crypto.getRandomValues()（Web Crypto 填充数组）。');
console.log('  4) 取模偏差：256 % 6 = 4，于是 0~3 概率更高；本次实测偏差约 2.4%。');
console.log('     用 randomInt（内部拒绝采样）或自己写拒绝采样来解决，别靠"字节多一点"糊弄。');
console.log('  5) OTP 要 6 位 + 短有效期 + 限制尝试次数 + 一次性 + 用 randomInt 生成；');
console.log('     随机性只解决一半问题，限流和有效期同样不可省。');
console.log('  6) 比较 token 用 crypto.timingSafeEqual（要求等长），不要用 === / includes / startsWith。');
console.log('  7) token 用 randomBytes(n).toString("base64url")；熵量看比特数（16 字节=128 比特，32 字节=256 比特）。');
console.log('  8) 判断标准：会不会影响安全或钱？会 -> crypto；不会 -> Math.random 也可以。');
