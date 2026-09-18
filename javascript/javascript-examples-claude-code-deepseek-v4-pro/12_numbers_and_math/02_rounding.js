/**
 * ============================================================================
 * 知识点：取整与四舍五入的精度陷阱 —— 各种取整方式、toFixed 的坑、保留 N 位小数
 * ============================================================================
 *
 * 【所属分类】12_numbers_and_math —— 数字与数学运算
 * 【难度等级】进阶
 * 【前置知识】12_numbers_and_math/01_math_object.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    取整指"把小数变成整数"，四舍五入指"保留到某一位"。JS 里相关的工具：
 *      Math.ceil / Math.floor / Math.round / Math.trunc  取到整数
 *      num.toFixed(n)                                    保留 n 位小数（返回字符串）
 *      num.toPrecision(n)                                保留 n 位有效数字（字符串）
 *      "放大 → 取整 → 缩小"                              自己实现的保留小数方案
 *    另外，ES2023 起 Intl.NumberFormat 支持 roundingMode 选项，其中的 'halfEven'
 *    就是标准的银行家舍入（四舍六入五成双），语言本身已经内置，无需手写实现。
 *    （roundingMode 的完整用法见 12_numbers_and_math/09_locale_format_and_rounding.js）
 *
 * 2. 为什么需要
 *    金额、折扣、税率、分页、评分展示都要求"保留两位小数"。
 *    但 JS 的数字是 IEEE 754 双精度二进制浮点数，很多十进制小数无法精确表示，
 *    直接四舍五入会得到 1.005 → 1.00 这类"看起来错"的结果。
 *    理解成因并掌握正确的取整方案，是处理后端金额数据的必备技能。
 *
 * 3. 核心语法要点
 *    - toFixed(n)：返回字符串（不是数字！），按"四舍五入"处理，
 *      但由于浮点表示误差，实际行为以"二进制真值"为准。
 *    - 保留两位小数的通用做法（放大取整法）：
 *        Math.round(x * 100) / 100
 *      它同样受浮点误差影响，遇到边界值时要用 EPSILON 修正。
 *    - 更稳健的写法：Math.round((x + Number.EPSILON) * 100) / 100。
 *    - 金融场景的正确做法是"用整数分表示金额"，全程整数运算，只在展示时除以 100。
 *    - Number.prototype.toFixed 的 n 取值范围是 0~100，超出会抛 RangeError。
 *    - 想要"银行家舍入"，ES2023 起直接用内置的：
 *        new Intl.NumberFormat('en-US', {
 *          roundingMode: 'halfEven', maximumFractionDigits: 0,
 *        }).format(2.5)   // "2"
 *      roundingMode 还支持 'ceil' / 'floor' / 'expand' / 'trunc' /
 *      'halfExpand' / 'halfTrunc' 等取值，一次配好即可复用到整批数据。
 *
 * 4. 常见陷阱
 *    - 0.1 + 0.2 === 0.30000000000000004，直接比较会失败（见 06、08 号文件）。
 *    - (1.005).toFixed(2) 得到 "1.00" 而不是 "1.01"，因为 1.005 的二进制真值略小于 1.005。
 *    - (-1.5).toFixed(0) 得到 "-2"，而 Math.round(-1.5) 得到 -1，两者规则不同。
 *    - (1234.5678).toFixed(2) 得到字符串 "1234.57"，再参与运算前要先转数字，
 *      而且 toFixed 不补千分位（那是 Intl.NumberFormat 的工作，见 07 号文件）。
 *    - 大数用 toFixed 可能得到科学计数法之外的意外结果，必要时用 Intl 或字符串处理。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 12_numbers_and_math/02_rounding.js
 *
 * 【预期输出】
 *   对比各种取整方式的差异，并演示 toFixed 与放大取整法在边界值上的表现。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 四种取整方式回顾
// ---------------------------------------------------------------------------

console.log('--- 1. 四种取整方式 ---');

const values = [2.4, 2.5, 2.6, -2.4, -2.5, -2.6];

// 用 JSON.stringify 展示数组，方便横向对比
console.log('原值：    ', JSON.stringify(values));
console.log('ceil：    ', JSON.stringify(values.map(Math.ceil)));
console.log('floor：   ', JSON.stringify(values.map(Math.floor)));
console.log('round：   ', JSON.stringify(values.map(Math.round)));
console.log('trunc：   ', JSON.stringify(values.map(Math.trunc)));

// 关键结论：
//   round 在 .5 处一律"向 +Infinity 方向"进位，所以 -2.5 → -2 而不是 -3
//   trunc 是"向 0 取整"，负数时与 floor 不同
console.log('\n关键差异：');
console.log('  Math.round(2.5) =', Math.round(2.5), '→ 进入更大的正数'); // 3
console.log('  Math.round(-2.5) =', Math.round(-2.5), '→ 也是进入更大的数'); // -2
console.log('  Math.floor(-2.5) =', Math.floor(-2.5)); // -3
console.log('  Math.trunc(-2.5) =', Math.trunc(-2.5)); // -2

// ---------------------------------------------------------------------------
// 2. 浮点数的"真值"：1.005 并不是 1.005
// ---------------------------------------------------------------------------

console.log('--- 2. 浮点数真值 ---');

// 用 toPrecision(20) 把内部值"看穿"到 20 位有效数字
console.log('(1.005).toPrecision(20) =', (1.005).toPrecision(20));
console.log('(1.005).toString()      =', (1.005).toString());
console.log('(0.1 + 0.2).toPrecision(20) =', (0.1 + 0.2).toPrecision(20));

// 这就是经典陷阱的根源
console.log('\n(1.005).toFixed(2) =', (1.005).toFixed(2)); // "1.00" ← 不是期望的 1.01
console.log('Math.round(1.005 * 100) =', Math.round(1.005 * 100)); // 100 ← 因为 100.49999...
console.log('(1.005 * 100).toPrecision(20) =', (1.005 * 100).toPrecision(20));

// 其它类似的例子
console.log('\n(1.335).toFixed(2) =', (1.335).toFixed(2)); // 常见于金额计算
console.log('(10.075).toFixed(2) =', (10.075).toFixed(2));
console.log('(2.675).toFixed(2) =', (2.675).toFixed(2)); // 经典案例，得到 2.67

// 反例：有些值"恰好"是对的，掩盖了问题的随机性
console.log('\n(1.015).toFixed(2) =', (1.015).toFixed(2));
console.log('(1.045).toFixed(2) =', (1.045).toFixed(2));
console.log('(0.125).toFixed(2) =', (0.125).toFixed(2)); // 0.125 二进制可精确表示，结果可靠

// ---------------------------------------------------------------------------
// 3. toFixed 的行为细节
// ---------------------------------------------------------------------------

console.log('--- 3. toFixed 细节 ---');

// 返回值是字符串，不是数字
const fixed = (3.14159).toFixed(2);
console.log('(3.14159).toFixed(2) =', JSON.stringify(fixed), '| typeof =', typeof fixed);
// 参与运算前要先转回数字
console.log('转成数字：', typeof Number(fixed), Number(fixed));

// 会自动补零（这是它比 Math.round 方便的地方）
console.log('\n(5).toFixed(2) =', JSON.stringify((5).toFixed(2))); // "5.00"
console.log('(5.1).toFixed(3) =', JSON.stringify((5.1).toFixed(3))); // "5.100"
console.log('(5).toFixed() =', JSON.stringify((5).toFixed())); // 不传参数等于 0 位

// n 为负数或超过 100 会抛 RangeError
for (const n of [-1, 101]) {
  try {
    console.log(`(1.5).toFixed(${n}) =`, (1.5).toFixed(n));
  } catch (err) {
    console.log(`(1.5).toFixed(${n}) 抛出：`, err.constructor.name, '-', err.message);
  }
}

// toFixed 的舍入方向与 Math.round 不完全一致
console.log('\n(-1.5).toFixed(0) =', JSON.stringify((-1.5).toFixed(0))); // "-2"
console.log('Math.round(-1.5) =', Math.round(-1.5)); // -1
console.log('(-1.4).toFixed(0) =', JSON.stringify((-1.4).toFixed(0))); // "-1"
console.log('(-1.6).toFixed(0) =', JSON.stringify((-1.6).toFixed(0))); // "-2"

// 规范规定：当数字 >= 1e21 时，toFixed 直接退回 ToString，不再补小数位
console.log('\n(1e21).toFixed(2) =', JSON.stringify((1e21).toFixed(2))); // "1e+21"
console.log('(1e20).toFixed(2) =', JSON.stringify((1e20).toFixed(2))); // 仍走正常路径

// 超出安全整数范围后，数字本身就已经不准了，toFixed 只是把不准的值补上小数位
console.log('(123456789012345678901).toFixed(2) =', JSON.stringify((123456789012345678901).toFixed(2)));
console.log('  ↑ 原始字面量结尾是 678901，但存进 Number 后已经变成 683968（超出安全整数范围）');

// ---------------------------------------------------------------------------
// 4. 保留 N 位小数的正确做法
// ---------------------------------------------------------------------------

console.log('--- 4. 保留 N 位小数 ---');

/** 方案一：放大取整法（最常用，但对 1.005 这类值仍然不准） */
function roundToV1(x, digits) {
  const factor = 10 ** digits;
  return Math.round(x * factor) / factor;
}

/** 方案二：放大取整 + EPSILON 修正（能修掉大部分"差一点点"的情况） */
function roundToV2(x, digits) {
  const factor = 10 ** digits;
  // EPSILON 是 2.220446049250313e-16，加上它能抵消"差了 1e-16"的表示误差
  return Math.round((x + Number.EPSILON) * factor) / factor;
}

/** 方案三：用字符串 + 指数记法绕过乘法误差（相对更靠得住） */
function roundToV3(x, digits) {
  // 转成 "1.005e2" 这种形式，让引擎用十进制字符串的方式处理指数
  const shifted = Number(`${x}e${digits}`);
  // 再取整并缩回去
  return Number(`${Math.round(shifted)}e-${digits}`);
}

const tricky = [1.005, 1.335, 2.675, 10.075, 0.615, 1.0049999999];

console.log(' 值            toFixed(2)  roundToV1  roundToV2  roundToV3');
for (const v of tricky) {
  console.log(
    `  ${String(v).padEnd(14)}${JSON.stringify(v.toFixed(2)).padEnd(12)}` +
      `${String(roundToV1(v, 2)).padEnd(11)}${String(roundToV2(v, 2)).padEnd(11)}${roundToV3(v, 2)}`,
  );
}

// 说明：三种方案各有取舍。
// V1 最快但边界不准；V2 加了 EPSILON 能修正"真值略小"的情况；
// V3 用字符串走十进制表示，对多数十进制输入更可靠，但仍不是金融级方案。

// ---------------------------------------------------------------------------
// 5. 金融场景的正确做法：整数分
// ---------------------------------------------------------------------------

console.log('--- 5. 金融场景：整数分 ---');

/** 把"元"转成"分"（整数），用 Math.round 消除输入本身的误差 */
function yuanToCents(yuan) {
  // 先放大 100 倍再取整，得到整数分
  return Math.round(Number(`${yuan}e2`));
}

/** 把"分"转回"元"的展示字符串 */
function centsToYuan(cents) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  // 用字符串插入小数点，避免除法再次引入浮点误差
  const yuanPart = Math.floor(abs / 100);
  const centPart = String(abs % 100).padStart(2, '0');
  return `${sign}${yuanPart}.${centPart}`;
}

/** 金额求和：全程用整数分，只在最后展示 */
function sumAmounts(amounts) {
  const totalCents = amounts.reduce((acc, a) => acc + yuanToCents(a), 0);
  return totalCents;
}

// 经典案例：0.1 + 0.2 用浮点加法会多出误差
console.log('浮点相加：', 0.1 + 0.2); // 0.30000000000000004
console.log('整数分相加：', centsToYuan(sumAmounts([0.1, 0.2]))); // 0.3 正确

const prices = [19.9, 9.99, 0.01, 1.005];
const total = sumAmounts(prices);
console.log('\n明细：', JSON.stringify(prices.map(yuanToCents)), '（单位：分）');
console.log('合计：', centsToYuan(total), '元');

// 折扣计算：先转成分再算，避免中间结果丢精度
function applyDiscount(priceYuan, discountRate) {
  const cents = yuanToCents(priceYuan);
  // 打折结果取整到分
  return centsToYuan(Math.round(cents * discountRate));
}
console.log('\n8 折后 19.9：', applyDiscount(19.9, 0.8));
console.log('9.5 折后 1.005：', applyDiscount(1.005, 0.95));

// 负数金额（退款）的处理
console.log('负金额展示：', centsToYuan(-1234)); // '-12.34'

// ---------------------------------------------------------------------------
// 6. 银行家舍入（四舍六入五成双）
// ---------------------------------------------------------------------------

console.log('--- 6. 银行家舍入 ---');

// 银行家舍入（banker\'s rounding），也叫"四舍六入五成双"：
// 遇到恰好 .5 时不是一律进位，而是就近取"偶数"，让进位与舍去各占一半。
// 这样在大量数据上求和时不会系统性地偏高，是会计、统计、税务领域的常见约定。
//
// 【重要】ES2023 起，语言本身已经内置了这个能力：
//     new Intl.NumberFormat('en-US', { roundingMode: 'halfEven' })
// 早年的教程会说"JS 没有内置的银行家舍入"，那个说法在 ES2023 之后已经过时。
// 下面两个小节分别给出「手写实现」与「内置实现」，
// 手写版仍有教学价值（帮你理解算法本身，也是旧环境的兼容方案），
// 但如今的生产代码应优先使用内置的 Intl.NumberFormat。

// ---------------------------------------------------------------------------
// 6.1 手写实现（用于理解算法 / 兼容旧环境）
// ---------------------------------------------------------------------------

/**
 * 手写银行家舍入：当恰好是 .5 时，向"偶数"方向取整。
 *
 * 注意：这个函数只是为了让算法透明可见。
 * 生产代码请优先使用 Intl.NumberFormat 的 roundingMode: 'halfEven'，
 * 它由引擎/C++ 层实现，既准确又不必自己处理浮点边界。
 */
function bankersRound(x) {
  const floor = Math.floor(x);
  const diff = x - floor;
  // 恰好 .5 时看 floor 的奇偶：偶数就舍，奇数就入
  if (diff === 0.5) return floor % 2 === 0 ? floor : floor + 1;
  return Math.round(x);
}

console.log('普通 round 与手写银行家舍入对比：');
for (const v of [0.5, 1.5, 2.5, 3.5, 4.5, -0.5, -1.5]) {
  console.log(`  ${String(v).padEnd(6)}round=${String(Math.round(v)).padEnd(5)}bankers=${bankersRound(v)}`);
}

// 统计意义上的差别：普通 round 会让总和偏大
const halfValues = [0.5, 1.5, 2.5, 3.5];
console.log('\n一组 .5 的求和：');
console.log('  原值之和：', halfValues.reduce((a, b) => a + b, 0)); // 8
console.log('  普通 round 后之和：', halfValues.map(Math.round).reduce((a, b) => a + b, 0)); // 1+2+3+4=10，比原值大 2
console.log('  银行家舍入后之和：', halfValues.map(bankersRound).reduce((a, b) => a + b, 0)); // 0+2+2+4=8

// 注意：手写版依赖 diff === 0.5 的精确判断，
// 受浮点误差影响时（如 2.5000000001）会退化到普通 round，实际项目建议用 decimal 库。

// ---------------------------------------------------------------------------
// 6.2 ES2023 内置方案：Intl.NumberFormat 的 roundingMode
// ---------------------------------------------------------------------------

console.log('\n--- 6.2 内置方案 roundingMode: halfEven ---');

// 特性检测：老引擎（Node < 20 或更早的浏览器）不认识 roundingMode，
// 构造时不会抛错，但 format 时会抛 RangeError，所以要通过实际格式化和校验来确认。
const hasRoundingMode = (() => {
  try {
    // 构造一个 halfEven 的 formatter，并立刻拿 2.5 验证：银行家舍入应得到 2
    const f = new Intl.NumberFormat('en-US', { roundingMode: 'halfEven', maximumFractionDigits: 0 });
    return f.format(2.5) === '2';
  } catch {
    return false;
  }
})();
console.log('本机支持 roundingMode：', hasRoundingMode);

if (!hasRoundingMode) {
  // 不支持时的降级路径：只用手写实现，绝不让程序报错退出
  console.log('当前环境不支持 Intl.NumberFormat 的 roundingMode，');
  console.log('请升级到 Node 20+ 或改用上面的手写 bankersRound()。');
} else {
  // 核心演示：同一组数字分别用内置方案和手写方案处理，对照结果
  const halfEvenFmt = new Intl.NumberFormat('en-US', {
    roundingMode: 'halfEven', // 银行家舍入：.5 就近取偶
    maximumFractionDigits: 0, // 保留 0 位小数，等价于取整
  });

  const compareValues = [0.5, 1.5, 2.5, 3.5, 4.5, -0.5, -1.5, -2.5, 2.4, 2.6];

  console.log('\n内置 halfEven  vs  手写 bankersRound：');
  console.log('  原值    内置    手写    是否一致');
  let allMatch = true;
  for (const v of compareValues) {
    // format() 返回字符串，这里转回数字再比较；
    // 用 Number() 转换还能把 "-0" 归一化成 -0，使 -0 === 0 成立
    const builtin = Number(halfEvenFmt.format(v));
    const manual = bankersRound(v);
    const same = Object.is(builtin, manual) || builtin === manual;
    if (!same) allMatch = false;
    console.log(
      `  ${String(v).padEnd(8)}${String(builtin).padEnd(8)}${String(manual).padEnd(8)}${same ? '一致' : '不一致 ←'}`,
    );
  }
  console.log('\n全部一致：', allMatch, '→ 内置方案与手写算法语义相同，可以放心替换。');

  // 与默认舍入模式对照：默认是 halfExpand（.5 一律远离 0 进位）
  console.log('\n与默认舍入模式（halfExpand）对比：');
  const defaultFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
  for (const v of [0.5, 1.5, 2.5, 3.5, -2.5]) {
    console.log(
      `  ${String(v).padEnd(6)}halfEven=${String(halfEvenFmt.format(v)).padEnd(5)}默认(halfExpand)=${defaultFmt.format(v)}`,
    );
  }
  console.log('  ↑ 看 2.5：默认向上进位得 3，halfEven 取偶得 2。');
  console.log('  ↑ 还要注意 Math.round(-2.5) = -2，而默认模式是 -3，两者对负数的规则并不相同。');
}

// ---------------------------------------------------------------------------
// 6.3 roundingMode 的全部取值与差异
// ---------------------------------------------------------------------------

console.log('\n--- 6.3 roundingMode 各取值对比 ---');

if (!hasRoundingMode) {
  console.log('当前环境不支持 roundingMode，跳过本小节。');
  console.log('各取值的含义：ceil 向上、floor 向下、expand 远离 0、trunc 向 0、');
  console.log('halfExpand 逢五远离 0（默认）、halfTrunc 逢五向 0、halfEven 逢五取偶。');
} else {
  // 逐一列出 roundingMode 的可选值及其含义
  const roundingModes = [
    ['ceil', '向上取整（+Infinity 方向），同 Math.ceil'],
    ['floor', '向下取整（-Infinity 方向），同 Math.floor'],
    ['expand', '远离 0 取整（绝对值变大）'],
    ['trunc', '向 0 取整（截断），同 Math.trunc'],
    ['halfExpand', '逢五远离 0（默认值，.5 时绝对值变大）'],
    ['halfTrunc', '逢五向 0（.5 时绝对值变小）'],
    ['halfEven', '逢五取偶（银行家舍入）'],
  ];

  // 预先为每种模式建好 formatter（复用一个实例，避免重复构造）
  const formatters = roundingModes.map(([mode, desc]) => ({
    mode,
    desc,
    fmt: new Intl.NumberFormat('en-US', { roundingMode: mode, maximumFractionDigits: 0 }),
  }));

  const sampleValues = [2.5, 2.4, 2.6, -2.5, -2.4, 5.5, 0.5];

  // 打印表头
  console.log('模式         ' + sampleValues.map((v) => String(v).padStart(6)).join(''));
  for (const { mode, fmt } of formatters) {
    const row = sampleValues.map((v) => fmt.format(v).padStart(6)).join('');
    console.log(mode.padEnd(13) + row);
  }

  console.log('\n各模式含义：');
  for (const [mode, desc] of roundingModes) {
    console.log(`  ${mode.padEnd(11)} ${desc}`);
  }

  // 观察重点
  console.log('\n观察重点：');
  console.log('  · ceil / floor 把 2.4 与 2.6 都推向同一侧，不受 .5 规则影响。');
  console.log('  · expand 与 trunc 的差别只体现在负数上（-2.4 → expand -3 / trunc -2）。');
  console.log('  · halfExpand 与 halfTrunc 的差别只体现在恰好 .5 时。');
  console.log('  · halfEven 在 0.5/2.5 这类"整数部分为偶数"的值上不进位，差值最小。');

  // 同一批数据用不同模式汇总，直观看出偏差大小
  const bulk = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5];
  console.log('\n同一批 ' + bulk.length + ' 个 .5 数据在不同模式下的总和（原值之和 ' + bulk.reduce((a, b) => a + b, 0) + '）：');
  for (const { mode, fmt } of formatters) {
    const sum = bulk.reduce((acc, v) => acc + Number(fmt.format(v)), 0);
    console.log(`  ${mode.padEnd(11)} 合计 ${String(sum).padStart(4)}  偏差 ${String(sum - bulk.reduce((a, b) => a + b, 0)).padStart(3)}`);
  }
  console.log('  ↑ halfEven 的偏差为 0，这正是银行家舍入被统计场景采用的原因。');
}

// ---------------------------------------------------------------------------
// 7. 其它取整需求
// ---------------------------------------------------------------------------

console.log('--- 7. 其它取整需求 ---');

/** 取整到指定的"步长"，如取整到 5 的倍数、0.05 的倍数 */
function roundToStep(x, step) {
  // 先按步长归一化、取整，再乘回去
  const result = Math.round(x / step) * step;
  // 乘法又会引入浮点误差，用 toFixed 收敛显示精度
  return Number(result.toFixed(10));
}
console.log('取整到 5 的倍数：');
for (const v of [3, 7, 12, 13]) {
  console.log(`  ${v} → ${roundToStep(v, 5)}`);
}
console.log('取整到 0.05：', roundToStep(1.234, 0.05));
console.log('取整到 0.1：', roundToStep(1.28, 0.1));

/** 向上取整到步长（常用于"必须买整箱"的场景） */
function ceilToStep(x, step) {
  return Number((Math.ceil(x / step) * step).toFixed(10));
}
console.log('\n每箱 12 个，需要 26 个 → 买', ceilToStep(26, 12) / 12, '箱');
console.log('向上取整到 5：', ceilToStep(11, 5));

/** 向下取整到步长 */
function floorToStep(x, step) {
  return Number((Math.floor(x / step) * step).toFixed(10));
}
console.log('向下取整到 5：', floorToStep(14, 5));

/** 分页：总页数 = ceil(总数 / 每页数) */
function pageCount(total, pageSize) {
  if (pageSize <= 0) return 0; // 防止除零得到 Infinity
  return Math.ceil(total / pageSize);
}
console.log('\n分页：');
for (const [total, size] of [[100, 10], [101, 10], [0, 10], [5, 10]]) {
  console.log(`  总数 ${String(total).padEnd(4)} 每页 ${String(size).padEnd(3)} → ${pageCount(total, size)} 页`);
}

console.log('\n全部演示完毕。');
