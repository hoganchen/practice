/**
 * ============================================================================
 * 知识点：Math.fround / Math.imul / Math.clz32 —— 三个「单精度 / 32 位」专用方法
 * ============================================================================
 *
 * 【所属分类】12_numbers_and_math —— 数字与数学运算
 * 【难度等级】高级
 * 【前置知识】12_numbers_and_math/01_math_object.js、04_operators/07_bitwise.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    12_numbers_and_math/01_math_object.js 自称「Math 静态方法大全」，把 log1p / expm1 /
 *    双曲函数这些冷门方法都覆盖了，**唯独漏掉这三个**：
 *
 *      Math.fround(x)  → 把 x 转成 **float32（单精度）**，返回对应的 float64 值
 *      Math.imul(a, b) → 真正的 **32 位整数乘法**（按 2^32 回绕，有符号结果）
 *      Math.clz32(x)   → 数出 x 的 32 位无符号表示里**前导零**的个数
 *
 *    它们的共同点是：**都工作在 32 位 / 单精度的世界里**，而 JS 默认的 number 是
 *    float64（双精度、53 位有效数字）。换句话说，它们是 JS 里少数几个「逃出 float64」
 *    的口子，专门服务于位运算、哈希、图形、二进制协议这些场景。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) Math.imul 已经在仓库里被**实际使用却没有任何解释** ——
 *        见 12_numbers_and_math/03_random.js 的 mulberry32 伪随机数生成器：
 *            t = Math.imul(t ^ (t >>> 15), t | 1);
 *            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
 *        这两行是算法规定死的步骤，**必须**用 imul 才能得到正确的序列（下面第 6 节会实测
 *        把它换成普通 `*` 之后序列如何变化）。
 *    (2) Math.fround 是「这个数字能不能安全地放进 Float32Array / 传给 GPU / 交给
 *        WebGL uniform / 喂给 WebNN 张量」的标准检测手段。
 *        单精度的存储与带宽都只有双精度的一半，图形与神经网络推理几乎都用单精度。
 *    (3) Math.clz32 是位图 / 位集 / 位运算题的常用工具：求 log2 的整数下取整、
 *        求二进制位宽、找最高有效位、判断 2 的幂、实现紧凑的 32 位标志位集合。
 *
 * 3. 核心语法要点
 *    (1) Math.fround(x)：
 *        · 先把 x 转成 number（字符串等会被强制转换），再**按 IEEE 754 单精度舍入**，
 *          最后把这个 float32 值**原样**转回 float64 返回。
 *        · 所以 `Math.fround(x) === x` 当且仅当 x 本身能被 float32 精确表示。
 *        · 单精度只有 24 位有效二进制位（约 7 位十进制有效数字），
 *          能表示的范围是 ±3.4028234663852886e38（超出变 Infinity），
 *          最小正规格化数 1.1754943508222875e-38（2^-126），再小进入非规格化数。
 *        · `new Float32Array([x])[0]` 的结果**必定等于** `Math.fround(x)` ——
 *          这正是 fround 的存在意义：在写入之前就预测写入之后的值。
 *    (2) Math.imul(a, b)：
 *        · 语义等价于「把 a、b 各自按 ToInt32 转成 32 位有符号整数（必要时截断），
 *          做数学乘法，再把结果按 2^32 取模回绕成 32 位有符号整数」。
 *        · 结果**可能有符号**（可能是负数），要无符号就再 `>>> 0`。
 *        · 与普通 `*` 的根本差异：`*` 走 IEEE 754 浮点乘法，
 *          当乘积超过 2^53 时**低位会被舍入掉**；而 imul 是精确的 32 位回绕。
 *        · 所以 `(a * b) | 0` 在乘积很大时**不等于** `Math.imul(a, b)` ——
 *          `| 0` 只是对一个**已经不准的浮点结果**做截断，救不回来。
 *        · 在 x64 上它就是一条 CPU 的 32 位乘法指令，速度与位运算同级。
 *    (3) Math.clz32(x)：
 *        · 先把 x 按 ToUint32 转成 32 位**无符号**整数（小数截断、负数按补码取模），
 *          再数出二进制表示里最高有效位之前的 0 的个数。
 *        · `clz32(0)` 是 32（全零），`clz32(1)` 是 31，`clz32(0xFFFFFFFF)` 是 0。
 *        · 由此得到几个精确的整数工具：
 *            floor(log2(n)) = 31 - clz32(n)     （n ≥ 1）
 *            二进制位宽   = 32 - clz32(n)
 *            向上取整到 2 的幂 = 1 << (32 - clz32(n - 1))
 *
 * 4. 常见陷阱
 *    - 【以为 fround 只是「取几位小数」】它做的是**二进制**舍入，不是十进制。
 *      所以 `Math.fround(0.1)` 不是 0.1，也不是 0.10；它是最接近 0.1 的那个 float32。
 *    - 【以为 fround 能当舍入函数用】`Math.fround(1.23456789)` 不会给你 1.23，
 *      要保留小数位请用 toFixed / 放大取整（见 01 / 08 号文件）。
 *    - 【用 `(a * b) | 0` 代替 Math.imul】小数字时结果恰好一致，
 *      一旦乘积超过 2^53 就悄悄出错 —— 这种「大部分时候对」的 bug 最难查。
 *    - 【忘记 imul 的结果是有符号的】`Math.imul(0xFFFFFFFF, 0xFFFFFFFF)` 是 1，
 *      但很多位运算场景需要的是无符号结果，记得补 `>>> 0`。
 *    - 【对超过 32 位的整数用 clz32】它会先 ToUint32 **丢掉高位**：
 *      `Math.clz32(2 ** 48 + 1)` 得到的是 `clz32(1)` 的结果（因为 2^48 被 2^32 整除后只剩 1）。
 *      要处理大整数请用 BigInt（见 06 号文件）。
 *    - 【把 clz32 的结果理解成「数值大小」】它衡量的是「最高有效位在 32 位窗口里靠左多少」，
 *      一个很小的数和一个很大的数可能只差几位。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 12_numbers_and_math/10_bit_and_precision_math.js
 *
 * 【预期输出】
 *   分组演示三个方法：fround 与 Float32Array 的一致性、单精度精度损失实证、
 *   float32 的 eps 与取值范围；imul 与 `*` 在溢出时的差异、以及把 mulberry32
 *   里的 imul 换成 `*` 之后随机序列如何改变；clz32 的取值规律、
 *   与 Math.log2 的一致性验证、以及位宽 / 2 的幂 / 位图的应用。
 *   全程退出码 0，一秒内跑完。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 第一部分：Math.fround —— 单精度（float32）转换
// ---------------------------------------------------------------------------

console.log('--- 1. Math.fround 的基本行为：把值按 float32 舍入 ---');

console.log('  Math.fround(0.1)      =', Math.fround(0.1));
console.log('  0.1 本身               =', 0.1);
console.log('  两者相等吗？            ', Math.fround(0.1) === 0.1, ' ← 不相等，说明 0.1 在单精度里存不下');
console.log('  差了多少？             ', Math.fround(0.1) - 0.1);
console.log('  Math.fround(1.1)      =', Math.fround(1.1), '（1.1 也存不下）');
console.log('  Math.fround(1.00000001) =', Math.fround(1.00000001), ' ← 单精度只有约 7 位十进制有效数字');
console.log('  Math.fround(NaN)      =', Math.fround(NaN), '；Math.fround(Infinity) =', Math.fround(Infinity));

// 能被 float32 精确表示的常见值：分母是 2 的幂的分数、以及位数够少的整数。
console.log('  能被 float32 精确表示的例子（fround(x) === x）：');
for (const v of [0.5, 0.25, 0.125, 1.5, 3.5, 1024, 1e10, 2 ** 24]) {
  console.log(`    ${String(v).padEnd(22)} → ${Math.fround(v) === v}`);
}
console.log('  不能被精确表示的例子：');
for (const v of [0.1, 0.2, 1 / 3, 3.14, 1e-7, 2 ** 24 + 1]) {
  console.log(`    ${String(v).padEnd(22)} → ${Math.fround(v) === v}（fround 之后变成 ${Math.fround(v)}）`);
}
console.log('  ^ 判断依据：能写成「整数 × 2 的整数次幂」且那个整数不超过 24 位二进制的，就能精确表示。');
console.log('    2 ** 24 + 1 = 16777217 是第一个无法表示的正整数（2^24 之后间隔变成了 2）。');

console.log('--- 2. fround 与 Float32Array 的等价性（这才是它的实用价值） ---');

// Float32Array 每个元素就是 32 位浮点数。写入 float64 时引擎会按单精度舍入。
// Math.fround 做的事与这个舍入完全一致 —— 于是它成了「写入前的预演」。
const float32Store = new Float32Array(3);
float32Store[0] = 0.1;
float32Store[1] = 1.1;
float32Store[2] = 3.14159;
for (let i = 0; i < float32Store.length; i += 1) {
  const written = float32Store[i];
  const predicted = Math.fround([0.1, 1.1, 3.14159][i]);
  console.log(`  写入 ${[0.1, 1.1, 3.14159][i]}：Float32Array 里是 ${written}，fround 预测 ${predicted}，一致：${written === predicted}`);
}
console.log('  ^ 结论：Math.fround(x) 恒等于 new Float32Array([x])[0]。');
console.log('    所以「这个数写进 Float32Array 会不会变」可以直接用 fround 判断，不必真的分配数组。');
console.log('    它也解释了为什么「把 0.1 存进 Float32Array 再拿出来」会得到 0.10000000149011612。');
console.log('    Float32Array 的更多用法见 24_typed_arrays/03_typed_array_types.js。');

console.log('--- 3. 单精度的 eps 与取值范围（与 Number.EPSILON 对比） ---');

// 「eps」是「1 与下一个可表示的数之间的距离」，代表这种精度的极限分辨率。
const float32Eps = 2 ** -23; // 单精度尾数 23 位（隐藏 1 位，共 24 位有效）
console.log('  Number.EPSILON（float64）=', Number.EPSILON, '= 2^-52');
console.log('  单精度 eps    （float32）=', float32Eps, '= 2^-23');
console.log('  单精度的 eps 是双精度的多少倍？', float32Eps / Number.EPSILON, '倍（正好是 2^29 ≈ 5.4 亿倍）');
console.log('  实测验证：');
// 二分逼近，实测 float32 的 eps：最小的 d 满足 fround(1 + d) !== 1
let probe = 1;
while (Math.fround(1 + probe) !== 1) {
  probe /= 2;
}
probe *= 2; // 回退一步，得到「刚好能区分的最小增量」
console.log('    实测 float32 eps =', probe, '，与 2^-23 相等：', probe === float32Eps);
console.log('    fround(1 + eps/2) === 1 吗？', Math.fround(1 + float32Eps / 2) === 1, '（半个 eps 就分不出来了）');

// 取值范围：float32 的最大有限值与最小正规格化数。
const float32Max = (2 - 2 ** -23) * 2 ** 127;
console.log('  float32 最大值 =', float32Max);
console.log('    Math.fround(3.4028235e38) =', Math.fround(3.4028235e38), '（还在范围内）');
console.log('    Math.fround(3.5e38)       =', Math.fround(3.5e38), ' ← 溢出成 Infinity（超出 float32 上限）');
console.log('    Math.fround(1e40)         =', Math.fround(1e40));
console.log('  float32 最小正规格化数 =', 2 ** -126);
console.log('    比它更小的值会退化成「非规格化数」，精度骤降：');
console.log('    Math.fround(1e-39) =', Math.fround(1e-39), '（有效位数已经很少了）');
console.log('    Math.fround(1e-45) =', Math.fround(1e-45), '（能表示的最小正数）');

console.log('--- 4. 精度损失的实证：用 float32 累加 0.1 十次 ---');

// 每次加法后都经过一次 float32 舍入，模拟「把所有数据都存成 float32」的场景。
let sum64 = 0;
let sum32 = 0;
for (let i = 0; i < 10; i += 1) {
  sum64 += 0.1; // 纯 float64 累加
  sum32 = Math.fround(sum32 + Math.fround(0.1)); // 每一步都按 float32 舍入
}
console.log('  float64 累加 0.1 十次 =', sum64, '（与 1 相差', Math.abs(1 - sum64), '）');
console.log('  float32 累加 0.1 十次 =', sum32, '（与 1 相差', Math.abs(1 - sum32), '）');
console.log('  ^ 两者的误差都已经出现，但单精度的误差**大得多**，且方向相反。');
console.log('    这解释了为什么图形/神经网络里「精度」是一个需要专门处理的工程问题：');
console.log('    GPU 默认按单精度算，长链条累加（如成千上万个像素求平均）会明显漂移，');
console.log('    常见对策是：局部用 float64 累加再写回、或使用 Kahan 求和等补偿算法。');
console.log('    （更一般的浮点误差见 12_numbers_and_math/08_precision_handling.js）');

console.log('  为什么图形与神经网络爱用单精度：');
const froundReasons = [
  ['显存/带宽减半', 'float32 每个数占 4 字节，float64 占 8 字节，纹理与权重体积直接砍半'],
  ['GPU 原生精度', '绝大多数 GPU 的浮点单元以 32 位为基本宽度，double 要么更慢要么要特殊扩展'],
  ['精度够用', '7 位十进制有效数字对颜色（0-1）、坐标、归一化权重来说完全足够'],
  ['能早发现问题', 'Math.fround 可以在上传前就暴露「这个数在 GPU 上会变成别的值」'],
];
for (const [reason, detail] of froundReasons) {
  console.log(`    · ${reason}：${detail}`);
}

// ---------------------------------------------------------------------------
// 第二部分：Math.imul —— 真正的 32 位整数乘法
// ---------------------------------------------------------------------------

console.log('--- 5. Math.imul 的基础：32 位回绕乘法 ---');

// 小数字时，imul 与普通乘法结果一致 —— 这也是它容易被忽视的原因。
console.log('  Math.imul(2, 3)          =', Math.imul(2, 3));
console.log('  Math.imul(6, 7)          =', Math.imul(6, 7));
console.log('  Math.imul(-3, 5)         =', Math.imul(-3, 5), '（负数照常，结果带符号）');

// 关键差异：乘积超出 53 位精度时，普通乘法开始丢低位。
console.log('  真正的差异在「乘积超过 2^53」时出现（2^53 =', 2 ** 53, '）：');
const imulCases = [
  [0xffffffff, 0xffffffff],
  [123456789, 987654321],
  [0xdeadbeef | 0, 0x12345678],
  [2000000000, 2000000000],
];
console.log('  ┌─ a ────────────┬─ b ────────────┬─ Math.imul(a,b) ─┬─ (a*b)|0 ───────┬─ 一致？');
for (const [a, b] of imulCases) {
  const viaImul = Math.imul(a, b);
  const viaStar = (a * b) | 0;
  console.log(
    `  │ ${String(a).padEnd(15)}│ ${String(b).padEnd(15)}│ ${String(viaImul).padEnd(16)}│ ${String(viaStar).padEnd(16)}│ ${viaImul === viaStar ? '是' : '否 ←'}`,
  );
}
console.log('  ^ 表格中标记「否 ←」的行就是浮点乘法丢掉精度的直接证据：');
console.log('    · 0xFFFFFFFF * 0xFFFFFFFF = 18446744073709551615，用 | 0 得到 0，而 imul 得到 1（正确）');
console.log('    · 123456789 * 987654321 ≈ 1.22e17 > 2^53，浮点结果已经把低位抹掉了');
console.log('    · 2000000000 * 2000000000 = 4e18，但它恰好能被 float64 精确表示（= 2^20 × 5^18），所以两者一致');
console.log('    也就是说：`(a * b) | 0` 是「大多数情况碰巧对」的写法，不能依赖。');

// 为什么 `| 0` 救不回来：它只是把「已经舍入过的浮点结果」再截断一次。
const bigA = 123456789;
const bigB = 987654321;
console.log('  拆开看为什么救不回来：');
console.log('    精确乘积（用 BigInt 算）=', BigInt(bigA) * BigInt(bigB));
console.log('    浮点乘积 (a * b)        =', bigA * bigB, ' ← 这里已经丢掉了低位（末尾全是 0）');
console.log('    (a * b) | 0             =', (bigA * bigB) | 0, '（对一个不准的数取模，当然不准）');
console.log('    Math.imul(a, b)         =', Math.imul(bigA, bigB), '（把精确乘积按 2^32 回绕，正确）');

// imul 的结果是有符号 32 位整数，要无符号就补一个 >>> 0。
console.log('  结果是有符号的（很多哈希场景需要无符号，记得补 >>> 0）：');
console.log('    Math.imul(0xFFFFFFFF, 2)                =', Math.imul(0xffffffff, 2), '（有符号，即 -2）');
console.log('    Math.imul(0xFFFFFFFF, 2) >>> 0          =', Math.imul(0xffffffff, 2) >>> 0, '（无符号，即 4294967294）');
console.log('    Math.imul(0xFFFFFFFF, 0xFFFFFFFF)       =', Math.imul(0xffffffff, 0xffffffff), '← 两个 0xFFFFFFFF 相乘，回绕后正好是 1');
console.log('    Math.imul(-1, -1)                       =', Math.imul(-1, -1), '← (-1) × (-1) = 1，32 位下依然是 1');
console.log('    Math.imul(2 ** 31, 2)                   =', Math.imul(2 ** 31, 2), '← 2^31 作为 int32 是负数，乘 2 溢出回绕成 0');
console.log('  参数会先做 ToInt32（小数截断、超范围回绕）：');
console.log('    Math.imul(2.9, 3)          =', Math.imul(2.9, 3), '（2.9 → 2）');
console.log('    Math.imul(2 ** 32 + 5, 1)  =', Math.imul(2 ** 32 + 5, 1), '（2^32+5 回绕成 5）');
console.log('    Math.imul(NaN, 5)          =', Math.imul(NaN, 5), '（NaN → 0）');

console.log('--- 6. 就地解释：12_numbers_and_math/03_random.js 的 mulberry32 为什么必须用 imul ---');

// 先把 03_random.js 里的 createSeededRandom（mulberry32）原样抄一遍，方便对照。
function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    // 这两行就是「必须用 Math.imul」的地方：
    // 位运算 ^、>>>、| 都会把操作数转成 32 位整数，产生的 t 最大可达 2^32-1；
    // 两个这样的数相乘，乘积最大可达 2^64 级别 —— 远远超过 float64 能精确表示的 2^53。
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 再写一个「错误版本」：把 Math.imul 换成 (a * b) | 0，其余一模一样。
function createSeededRandomBroken(seed) {
  let state = seed >>> 0;
  const mul = (a, b) => (a * b) | 0; // ← 唯一的改动
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = mul(t ^ (t >>> 15), t | 1);
    t ^= t + mul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const correctRng = createSeededRandom(20240101);
const brokenRng = createSeededRandomBroken(20240101);
const correctSeq = Array.from({ length: 5 }, () => Number(correctRng().toFixed(6)));
const brokenSeq = Array.from({ length: 5 }, () => Number(brokenRng().toFixed(6)));
console.log('  同一个种子 20240101，两个版本的前 5 个随机数：');
console.log('    Math.imul 版本       →', JSON.stringify(correctSeq));
console.log('    (a*b)|0 版本         →', JSON.stringify(brokenSeq));
console.log('    两个序列完全相同吗？  ', JSON.stringify(correctSeq) === JSON.stringify(brokenSeq));
console.log('  ^ 结论：换成 `*` 之后，序列**整个变了**。虽然看起来「还是随机的」，');
console.log('    但它已经**不是 mulberry32 算法了**，而且丢掉了算法赖以成立的数学性质。');
console.log('  为什么必须是精确的 32 位回绕乘法：');
const imulReasons = [
  ['算法规定', 'mulberry32 的每一步混合都定义在「模 2^32 的整数环」上，乘法必须精确回绕'],
  ['低位很重要', '浮点乘法在 >2^53 时把低位舍成 0，而雪崩效应恰恰依赖每一个二进制位都参与混合'],
  ['可复现性', '测试 / 游戏回放要求「同一种子必然同一序列」，浮点误差会让不同引擎结果不一致'],
  ['性能', 'imul 在 x64 上是一条 32 位整数乘法指令，比走浮点乘法再截断更快'],
];
for (const [reason, detail] of imulReasons) {
  console.log(`    · ${reason}：${detail}`);
}
console.log('  同类算法（xxHash、MurmurHash 的 JS 移植版）也一律使用 Math.imul，原因完全相同。');
console.log('  mulberry32 的完整讲解与可复现随机数场景见 12_numbers_and_math/03_random.js。');

// ---------------------------------------------------------------------------
// 第三部分：Math.clz32 —— 数前导零
// ---------------------------------------------------------------------------

console.log('--- 7. Math.clz32 的基础：32 位窗口里，最高有效位前面有几个 0 ---');

const clzCases = [
  [0, '全零（特例）'],
  [1, '二进制 1'],
  [2, '二进制 10'],
  [7, '二进制 111'],
  [255, '二进制 11111111'],
  [256, '二进制 1 0000 0000'],
  [0x80000000, '最高位是 1'],
  [0xffffffff, '32 位全是 1'],
  [-1, 'ToUint32(-1) = 0xFFFFFFFF'],
];
for (const [value, note] of clzCases) {
  console.log(`  Math.clz32(${String(value).padStart(11)}) = ${String(Math.clz32(value)).padStart(2)}   // ${note}`);
}
console.log('  ^ clz32(0) 是 32 而不是「未定义」—— 全零时 32 位都是前导零，这个特例要记住。');

console.log('  输入会先按 ToUint32 转换（小数截断、负数取补码、超范围回绕）：');
console.log('    Math.clz32(2.9)          =', Math.clz32(2.9), '（2.9 → 2）');
console.log('    Math.clz32(-1)           =', Math.clz32(-1), '（-1 → 0xFFFFFFFF，最高位是 1，所以没有前导零）');
console.log('    Math.clz32(NaN)          =', Math.clz32(NaN), '（NaN → 0 → 全零）');
console.log('    Math.clz32(Infinity)     =', Math.clz32(Infinity), '（Infinity → 0 → 全零）');
console.log('    Math.clz32(2 ** 32)      =', Math.clz32(2 ** 32), '（超出 32 位，回绕成 0）');
console.log('    Math.clz32(2 ** 32 + 1)  =', Math.clz32(2 ** 32 + 1), '（回绕成 1）');
console.log('    Math.clz32(1e21)         =', Math.clz32(1e21), '（大数只看低 32 位，结果毫无「大数」的感觉）');

console.log('--- 8. 由 clz32 派生的三个精确整数工具 ---');

// 工具一：求 log2 的整数下取整（也就是「最高位的位置」）。
const floorLog2 = (n) => 31 - Math.clz32(n);
console.log('  floorLog2(n) = 31 - clz32(n)（n ≥ 1）：');
for (const n of [1, 2, 3, 4, 7, 8, 100, 1024, 65535, 2 ** 31 - 1]) {
  console.log(`    floorLog2(${String(n).padStart(10)}) = ${String(floorLog2(n)).padStart(2)}   （Math.floor(Math.log2(n)) = ${Math.floor(Math.log2(n))}）`);
}
console.log('  ^ 两者在 uint32 范围内应当完全一致。用 10 万个确定性伪随机数验证一下：');
let mismatchCount = 0;
let lcg = 12345; // 一个简单的线性同余发生器，保证每次运行结果完全一样
for (let i = 0; i < 100_000; i += 1) {
  lcg = (lcg * 1103515245 + 12345) >>> 0;
  const n = lcg === 0 ? 1 : lcg;
  if (floorLog2(n) !== Math.floor(Math.log2(n))) mismatchCount += 1;
}
console.log('    10 万个随机 uint32 里，两种算法结果不一致的次数 =', mismatchCount);
console.log('  ^ 两者结果一致，但 clz32 走的是**纯整数位运算**（CPU 的一条前导零指令），');
console.log('    不涉及浮点近似，也不会有 Math.log2 在极端值上的舍入疑虑 —— 位运算代码优先用它。');

// 工具二：求二进制位宽（表示这个数最少需要多少位）。
const bitWidth = (n) => 32 - Math.clz32(n);
console.log('  bitWidth(n) = 32 - clz32(n)：');
for (const n of [0, 1, 2, 3, 255, 256, 65535, 65536, 2 ** 31]) {
  console.log(`    bitWidth(${String(n).padStart(11)}) = ${String(bitWidth(n)).padStart(2)}   （二进制 ${n.toString(2).slice(0, 20)}${n.toString(2).length > 20 ? '…' : ''}）`);
}

// 工具三：判断 2 的幂、向上取整到 2 的幂。
const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0;
// 注意 `<<` 的结果是**有符号**的：1 << 31 得到 -2147483648，所以必须补 >>> 0 才能与 2^31 比较。
const isPowerOfTwoViaClz = (n) => n > 0 && ((1 << floorLog2(n)) >>> 0) === n;
console.log('  判断 2 的幂：两种写法在 uint32 范围内等价');
for (const n of [1, 2, 3, 4, 1024, 1023, 2 ** 31]) {
  console.log(`    ${String(n).padStart(11)}：位运算写法 ${isPowerOfTwo(n)}，clz32 写法 ${isPowerOfTwoViaClz(n)}`);
}
console.log('    顺带踩一下移位的坑：1 << 31 =', 1 << 31, '，而 (1 << 31) >>> 0 =', (1 << 31) >>> 0);
// 向上取整到 2 的幂：经典用法 `1 << (32 - clz32(n - 1))`（n > 1 时成立）
const ceilPow2 = (n) => (n <= 1 ? 1 : 1 << (32 - Math.clz32(n - 1)));
console.log('  向上取整到最近的 2 的幂：1 << (32 - clz32(n - 1))');
for (const n of [1, 2, 3, 5, 8, 9, 1023, 1024, 1025]) {
  console.log(`    ceilPow2(${String(n).padStart(5)}) = ${String(ceilPow2(n)).padStart(5)}`);
}
console.log('  ^ 用途：给哈希表 / 数组缓冲区选容量（2 的幂便于用位与代替取模）。');
console.log('    注意 1 << 31 是负数，所以这个写法在 n > 2^31 时会失效，且 n 不能超过 uint32 范围。');

console.log('--- 9. 实战：用一个 32 位数当「位图」（32 个布尔标志位） ---');

// 位图（bitset）：一个 32 位整数就能存 32 个布尔值，且能一次比较、一次统计。
// 位运算仅能在 32 位窗口里做，所以这套技巧与 clz32 是天然搭档。
const FLAG = { READ: 1 << 0, WRITE: 1 << 1, EXEC: 1 << 2, DELETE: 1 << 3 };

/** 把若干权限合成一个位图 */
function grant(...flags) {
  // 用按位或把每个位「点亮」，>>> 0 保证结果是非负的 uint32
  return flags.reduce((acc, f) => acc | f, 0) >>> 0;
}

const permissions = grant(FLAG.READ, FLAG.WRITE);
console.log('  权限位图（READ | WRITE）=', permissions, '，二进制 =', permissions.toString(2).padStart(32, '0'));
console.log('  某一位是否打开可以用 & 判断：有 READ 吗？', (permissions & FLAG.READ) !== 0);
console.log('                              有 EXEC 吗？', (permissions & FLAG.EXEC) !== 0);

// clz32 在这里的用途：找出「最高位的那个标志」——等价于「优先级最高的那一项」。
// 把标志位从低到高当作优先级，最高位就是当前生效的最高优先级标志。
const priorityMap = ['（占位）', 'low', 'normal', 'high', 'critical'];
const withPriority = grant(1 << 1, 1 << 3); // 同时置位 normal 与 critical
const highestIndex = 31 - Math.clz32(withPriority);
console.log('  位图', withPriority, '（二进制', withPriority.toString(2).padStart(8, '0') + '）');
console.log('  最高位的下标 = 31 - clz32(bits) =', highestIndex, '→ 对应优先级「', priorityMap[highestIndex], '」');
console.log('  ^ clz32 直接给出「最高有效位在哪」，不用循环、不用数组，O(1)。');
console.log('    同类场景：任务调度器挑最高优先级队列、内存分配器找最大的空闲块、');
console.log('    协议解析里判断报文的最高位标记、位图索引的桶定位。');

// 一次统计有多少个位被点亮（popcount），也是位图操作里的常客。
function popcount(bits) {
  let x = bits >>> 0;
  let count = 0;
  while (x !== 0) {
    // 每次消掉最低位的那个 1；clz32 用不上，这里用的是经典的 n & (n-1) 技巧
    x &= x - 1;
    count += 1;
  }
  return count;
}
console.log('  已点亮的标志个数（popcount）=', popcount(permissions), '，位图里还剩', 32 - popcount(permissions), '个空位');
console.log('  用 clz32 可以快速判断「还有空位吗」：clz32(bits) > 0 说明最高位还没占满。');
console.log('  clz32(', permissions, ') =', Math.clz32(permissions), '，说明它还远没占满 32 位。');

console.log('--- 也见 ---');
console.log('  12_numbers_and_math/01_math_object.js  —— Math 方法大全（本文件补齐它漏掉的三个）');
console.log('  12_numbers_and_math/03_random.js       —— mulberry32 里 Math.imul 的实际用法');
console.log('  12_numbers_and_math/08_precision_handling.js —— 浮点误差的通用处理');
console.log('  04_operators/07_bitwise.js             —— 位运算基础（& | ^ ~ << >>> ）');
console.log('  24_typed_arrays/03_typed_array_types.js —— Float32Array 等定长数值数组');

console.log('\n全部演示完毕。');
