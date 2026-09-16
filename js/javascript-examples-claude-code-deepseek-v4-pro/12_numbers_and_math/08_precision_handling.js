/**
 * ============================================================================
 * 知识点：浮点精度的工程解法 —— 放大取整、整数分、decimal 思路、EPSILON 比较
 * ============================================================================
 *
 * 【所属分类】12_numbers_and_math —— 数字与数学运算
 * 【难度等级】高级
 * 【前置知识】12_numbers_and_math/06_number_limits.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    浮点误差无法"根治"，但可以用工程手段规避。业界有四种主流思路：
 *      思路 A  放大取整：把小数按固定倍数放大成整数运算，最后再缩回去
 *      思路 B  整数分表示：金额一律以"分"为单位存整数，只在展示时除以 100
 *      思路 C  十进制字符串运算：自己实现基于十进制的加减乘除（decimal 库原理）
 *      思路 D  容差比较：不追求精确相等，用 EPSILON 或业务容差判断"足够接近"
 *    本文件把这四种思路各实现一遍，并说明各自的适用边界。
 *
 * 2. 为什么需要
 *    后端的金额字段是字符串或分为单位的整数，前端一旦用普通浮点做加减乘除，
 *    就会出现"0.1 + 0.2 !== 0.3""19.9 * 3 = 59.699999999999996"这类问题。
 *    订单金额、发票税额、库存数量这些场景对精度零容忍，
 *    必须选一种确定的方案，而不是"看起来能跑就行"。
 *
 * 3. 核心语法要点
 *    - 思路 A：Math.round(x * factor) / factor，factor = 10^digits。
 *      缺点是 x * factor 这一步本身就可能引入误差，所以通常要配合 EPSILON 修正
 *      或改用字符串指数写法 Number(`${x}e${digits}`)。
 *    - 思路 B：所有中间计算都用整数（分），只在展示时格式化。
 *      这是最可靠、最简单、性能最好的方案，也是电商系统的通行做法。
 *    - 思路 C：用字符串保存数字，逐位实现四则运算。
 *      可以做到任意精度，但代码量大、性能差，通常直接引入成熟库。
 *    - 思路 D：Math.abs(a - b) < 容差。容差可以是 EPSILON、EPSILON * scale，
 *      也可以是业务容差（如 0.005 表示半分钱）。
 *    - BigInt 可用于思路 B 的高精度版本（金额很大时仍然精确）。
 *
 * 4. 常见陷阱
 *    - 只把"结果"取整，却让"中间过程"裸奔。误差会在乘除之间被放大。
 *    - 用 toFixed 做舍入后忘记转回数字，导致字符串拼接（'1.00' + 1 = '1.001'）。
 *    - 用 EPSILON 做绝对容差却忘了它只对"1 附近"有效（见 06 号文件）。
 *    - 自己实现 decimal 时忘了处理进位、借位和符号，得不偿失。
 *    - 金额跨越前后端时，接口约定必须明确"单位是分还是元、是数字还是字符串"，
 *      否则两边理解不一致，比浮点误差更致命。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 12_numbers_and_math/08_precision_handling.js
 *
 * 【预期输出】
 *   对比四种方案在加减乘除与舍入场景下的结果，并给出一个完整的金额计算器实现。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 先看清问题：误差是怎么积累的
// ---------------------------------------------------------------------------

console.log('--- 1. 误差的积累 ---');

// 直接浮点运算
console.log('0.1 + 0.2 =', 0.1 + 0.2);
console.log('19.9 * 3 =', 19.9 * 3);
console.log('0.3 - 0.1 =', 0.3 - 0.1);
console.log('1.1 * 3 =', 1.1 * 3);
console.log('(0.1 + 0.2) * 10 =', (0.1 + 0.2) * 10); // 误差被放大 10 倍

// 累加 1000 次 0.01，误差会积累成可见的偏差
let naiveSum = 0;
for (let i = 0; i < 1000; i++) {
  naiveSum += 0.01;
}
console.log('\n0.01 累加 1000 次的浮点结果：', naiveSum);
console.log('与 10 的差：', naiveSum - 10);
console.log('是否等于 10：', naiveSum === 10); // false

// 整数累加就没有这个问题
let intSum = 0;
for (let i = 0; i < 1000; i++) {
  intSum += 1; // 单位是分
}
console.log('整数（分）累加 1000 次：', intSum, '分 =', intSum / 100, '元');
console.log('精确等于 10 元：', intSum / 100 === 10); // true

// ---------------------------------------------------------------------------
// 2. 思路 A：放大取整
// ---------------------------------------------------------------------------

console.log('--- 2. 思路 A：放大取整 ---');

/** 基础版：放大 → 取整 → 缩小 */
function roundByFactor(x, digits) {
  const factor = 10 ** digits;
  return Math.round(x * factor) / factor;
}

/** 改进版：用字符串指数写法避开乘法误差 */
function roundByExpString(x, digits) {
  // Number('1.005e2') 会得到 100.5，这一步是十进制字符串解析，比 1.005 * 100 更准
  const shifted = Number(`${x}e${digits}`);
  return Number(`${Math.round(shifted)}e-${digits}`);
}

/** 通用的定点加法：先把两个数放大成整数再相加 */
function addFixed(a, b, digits) {
  const factor = 10 ** digits;
  // 放大后取整，保证进入整数运算
  const ia = Math.round(Number(`${a}e${digits}`));
  const ib = Math.round(Number(`${b}e${digits}`));
  return Number(`${ia + ib}e-${digits}`);
}

/** 通用的定点乘法：（a * b）结果保留 digits 位小数 */
function multiplyFixed(a, b, digits) {
  const ia = Math.round(Number(`${a}e${digits}`));
  const ib = Math.round(Number(`${b}e${digits}`));
  // 两个放大后的整数相乘，结果是放大了 2*digits 倍，需要缩回 digits 倍
  const product = ia * ib;
  return Number(`${Math.round(product / 10 ** digits)}e-${digits}`);
}

console.log('roundByFactor(1.005, 2) =', roundByFactor(1.005, 2)); // 1.00 ← 仍受乘法误差影响
console.log('roundByExpString(1.005, 2) =', roundByExpString(1.005, 2)); // 1.01 ← 更准
console.log('roundByExpString(2.675, 2) =', roundByExpString(2.675, 2)); // 2.68

console.log('\n定点加法：');
console.log('  0.1 + 0.2 =', addFixed(0.1, 0.2, 2)); // 0.3
console.log('  19.9 + 9.99 =', addFixed(19.9, 9.99, 2)); // 29.89
console.log('  对比浮点：', 19.9 + 9.99);

console.log('\n定点乘法：');
console.log('  19.9 * 3 =', multiplyFixed(19.9, 3, 2)); // 59.7
console.log('  对比浮点：', 19.9 * 3);
console.log('  1.005 * 3 =', multiplyFixed(1.005, 3, 2));
console.log('  对比浮点：', 1.005 * 3);

// 放大取整法的边界：小数位不统一时很难用一种 digits 兼顾
console.log('\n放大取整法的局限：');
console.log('  单价 1.005 元 × 数量 3 件，若先各自取 2 位再相乘：');
console.log('  ', multiplyFixed(roundByExpString(1.005, 2), 3, 2)); // 3.03
console.log('  若保留 3 位精度再相乘：', multiplyFixed(1.005, 3, 3)); // 3.015
console.log('  可见 digits 的选择直接影响结果 —— 这正是它不如"整数分"的原因');

// ---------------------------------------------------------------------------
// 3. 思路 B：整数分（推荐方案）
// ---------------------------------------------------------------------------

console.log('--- 3. 思路 B：整数分 ---');

/**
 * 金额工具：内部一律用"分"（整数）表示，只在输入输出处做转换。
 * 这是电商、财务系统最常用也最可靠的方案。
 */
const Money = {
  /** 元 → 分（用字符串指数写法避免浮点误差） */
  fromYuan(yuan) {
    const n = Number(yuan);
    if (!Number.isFinite(n)) throw new TypeError(`金额必须是有限数字：${yuan}`);
    // 先转成字符串再加 e2，让引擎用十进制解析
    const cents = Math.round(Number(`${n}e2`));
    if (!Number.isSafeInteger(cents)) {
      throw new RangeError(`金额 ${yuan} 超出可安全处理的整数范围`);
    }
    return cents;
  },

  /** 分 → 元的展示字符串（不用除法，直接拼字符串） */
  toYuanString(cents) {
    const sign = cents < 0 ? '-' : '';
    const abs = Math.abs(cents);
    const yuan = Math.floor(abs / 100);
    const fen = String(abs % 100).padStart(2, '0');
    return `${sign}${yuan}.${fen}`;
  },

  /** 分 → 元（数字形式，仅在需要参与非金额运算时使用） */
  toYuanNumber(cents) {
    return Number(Money.toYuanString(cents));
  },

  /** 加法 */
  add(...amounts) {
    return amounts.reduce((acc, a) => acc + Money.fromYuan(a), 0);
  },

  /** 减法 */
  sub(a, b) {
    return Money.fromYuan(a) - Money.fromYuan(b);
  },

  /** 乘法：金额 × 数量，结果四舍五入到分 */
  mul(yuan, quantity) {
    const cents = Money.fromYuan(yuan);
    // 数量可能是小数（如 1.5 公斤），所以也要放大
    const qtyScaled = Math.round(Number(`${quantity}e6`));
    const scale = 1e6;
    // 先整数乘，再除以 scale 并四舍五入到分
    return Math.round((cents * qtyScaled) / scale);
  },

  /** 按比例打折：rate 形如 0.8 表示八折 */
  applyRate(cents, rate) {
    const rateScaled = Math.round(Number(`${rate}e6`));
    const scale = 1e6;
    return Math.round((cents * rateScaled) / scale);
  },

  /** 按比例分摊（如按金额比例分摊运费），保证各份之和等于总额 */
  allocate(totalCents, weights) {
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight <= 0) throw new RangeError('权重之和必须大于 0');
    const result = [];
    let allocated = 0;
    weights.forEach((w, i) => {
      if (i === weights.length - 1) {
        // 最后一份用"总额减去已分配"，这样一定不会出现分位上的差错
        result.push(totalCents - allocated);
      } else {
        const share = Math.round((totalCents * w) / totalWeight);
        result.push(share);
        allocated += share;
      }
    });
    return result;
  },
};

console.log('元转分：');
for (const y of [0.1, 19.9, 1.005, 0.01, 100]) {
  console.log(`  ${String(y).padEnd(8)} → ${Money.fromYuan(y)} 分`);
}

console.log('\n分转元字符串：');
for (const c of [0, 1, 10, 30, 1990, 100000, -1234]) {
  console.log(`  ${String(c).padStart(8)} 分 → ${Money.toYuanString(c)} 元`);
}

console.log('\n加法：');
console.log('  0.1 + 0.2 =', Money.toYuanString(Money.add(0.1, 0.2)), '元'); // 0.30
console.log('  对比浮点：', 0.1 + 0.2);
console.log('  19.9 + 9.99 + 0.01 =', Money.toYuanString(Money.add(19.9, 9.99, 0.01)), '元'); // 29.90

console.log('\n减法：');
console.log('  0.3 - 0.1 =', Money.toYuanString(Money.sub(0.3, 0.1)), '元'); // 0.20
console.log('  对比浮点：', 0.3 - 0.1);

console.log('\n乘法（金额 × 数量）：');
console.log('  19.9 × 3 =', Money.toYuanString(Money.mul(19.9, 3)), '元'); // 59.70
console.log('  对比浮点：', 19.9 * 3);
console.log('  1.005 × 3 =', Money.toYuanString(Money.mul(1.005, 3)), '元'); // 3.02（3.015 四舍五入进位）
console.log('  9.99 × 1.5 =', Money.toYuanString(Money.mul(9.99, 1.5)), '元');

console.log('\n打折：');
const priceCents = Money.fromYuan(19.9);
console.log('  19.9 元打 8 折 =', Money.toYuanString(Money.applyRate(priceCents, 0.8)), '元');
console.log('  19.9 元打 9.5 折 =', Money.toYuanString(Money.applyRate(priceCents, 0.95)), '元');

console.log('\n按比例分摊 100 分给 3 个权重相同的项：');
const shares = Money.allocate(100, [1, 1, 1]);
console.log('  分摊结果：', JSON.stringify(shares), '合计', shares.reduce((a, b) => a + b, 0));
console.log('  天然不会出现"少了 1 分"的问题');

// 大规模累加的正确性
let moneyTotal = 0;
for (let i = 0; i < 10_000; i++) {
  moneyTotal += Money.fromYuan(0.01);
}
console.log('\n0.01 元累加 1 万次：', Money.toYuanString(moneyTotal), '元');
console.log('精确等于 100 元：', moneyTotal === 10000);

// ---------------------------------------------------------------------------
// 4. 思路 C：十进制字符串运算（decimal 思想）
// ---------------------------------------------------------------------------

console.log('--- 4. 思路 C：十进制字符串运算 ---');

/**
 * 一个极简的"十进制定点数"实现，用来演示 decimal 库的核心思想：
 *   用 BigInt 保存"去掉小数点后的整数"，同时记住小数位数，
 *   所有运算都在整数上做，从而彻底摆脱二进制浮点误差。
 * 真实项目请直接使用成熟库，这里只是为了讲清原理。
 */
class Decimal {
  /**
   * @param {bigint} digits 去掉小数点后的整数部分（含符号）
   * @param {number} scale  小数位数
   */
  constructor(digits, scale) {
    this.digits = digits;
    this.scale = scale;
  }

  /** 从字符串或数字构造 */
  static from(value) {
    const text = String(value).trim();
    // 支持普通的十进制写法与负号；不支持科学计数法（真实库要支持）
    const match = /^(-?)(\d*)(?:\.(\d*))?$/.exec(text);
    if (!match || (match[2] === '' && match[3] === '')) {
      throw new TypeError(`无法解析为十进制数：${JSON.stringify(value)}`);
    }
    const [, sign, intPart = '', fracPart = ''] = match;
    const digits = BigInt((intPart || '0') + fracPart);
    return new Decimal(sign === '-' ? -digits : digits, fracPart.length);
  }

  /** 对齐两个操作数的小数位，返回 (放大后的 a, 放大后的 b, 目标 scale) */
  static align(a, b) {
    const scale = Math.max(a.scale, b.scale);
    const factorA = 10n ** BigInt(scale - a.scale);
    const factorB = 10n ** BigInt(scale - b.scale);
    return [a.digits * factorA, b.digits * factorB, scale];
  }

  add(other) {
    const [x, y, scale] = Decimal.align(this, other);
    return new Decimal(x + y, scale);
  }

  sub(other) {
    const [x, y, scale] = Decimal.align(this, other);
    return new Decimal(x - y, scale);
  }

  multiply(other) {
    // 两个定点数相乘，小数位数相加
    return new Decimal(this.digits * other.digits, this.scale + other.scale);
  }

  /** 除法：保留指定小数位，四舍五入 */
  divide(other, resultScale = 10) {
    if (other.digits === 0n) throw new RangeError('除数不能为 0');
    // 把被除数放大到足够多的小数位再做整数除法
    const shift = BigInt(resultScale + other.scale - this.scale);
    const factor = 10n ** (shift >= 0n ? shift : 0n);
    const dividend = shift >= 0n ? this.digits * factor : this.digits;
    const divisor = other.digits;
    // 先做整数除法，再根据余数判断是否需要进位
    let quotient = dividend / divisor;
    const remainder = dividend % divisor;
    // 余数的绝对值达到除数绝对值的一半时进位（四舍五入）
    if (2n * (remainder < 0n ? -remainder : remainder) >= (divisor < 0n ? -divisor : divisor)) {
      quotient += dividend < 0n !== divisor < 0n ? -1n : 1n;
    }
    return new Decimal(quotient, resultScale);
  }

  /** 舍入到指定小数位 */
  round(scale) {
    if (scale >= this.scale) return new Decimal(this.digits, this.scale);
    const drop = this.scale - scale;
    const factor = 10n ** BigInt(drop);
    const quotient = this.digits / factor;
    const remainder = this.digits % factor;
    const absRemainder = remainder < 0n ? -remainder : remainder;
    // 看被丢弃部分是否 >= 半个单位
    const bump = 2n * absRemainder >= factor ? (this.digits < 0n ? -1n : 1n) : 0n;
    return new Decimal(quotient + bump, scale);
  }

  /** 转成字符串 */
  toString() {
    const sign = this.digits < 0n ? '-' : '';
    const abs = (this.digits < 0n ? -this.digits : this.digits).toString();
    if (this.scale === 0) return sign + abs;
    // 整数部分不足时前面补 0
    const padded = abs.padStart(this.scale + 1, '0');
    const cut = padded.length - this.scale;
    return `${sign}${padded.slice(0, cut)}.${padded.slice(cut)}`;
  }

  /** 转成 Number（可能有精度损失，仅用于展示或非精确场景） */
  toNumber() {
    return Number(this.toString());
  }
}

console.log('构造：');
for (const v of ['0.1', '0.2', '19.90', '-3.005', '100']) {
  console.log(`  ${v.padEnd(9)} → ${Decimal.from(v).toString()}`);
}

console.log('\n加减乘除：');
console.log('  0.1 + 0.2 =', Decimal.from('0.1').add(Decimal.from('0.2')).toString());
console.log('  0.3 - 0.1 =', Decimal.from('0.3').sub(Decimal.from('0.1')).toString());
console.log('  19.90 × 3 =', Decimal.from('19.90').multiply(Decimal.from('3')).toString());
console.log('  1 ÷ 3（保留 10 位）=', Decimal.from('1').divide(Decimal.from('3'), 10).toString());
console.log('  10 ÷ 4 =', Decimal.from('10').divide(Decimal.from('4'), 4).toString());
console.log('  -7 ÷ 2（保留 2 位）=', Decimal.from('-7').divide(Decimal.from('2'), 2).toString());

console.log('\n舍入：');
for (const [v, s] of [['1.005', 2], ['2.675', 2], ['1.335', 2], ['-1.005', 2]]) {
  console.log(`  ${v.padEnd(8)} 保留 ${s} 位 → ${Decimal.from(v).round(s).toString()}`);
}
console.log('  这才是"人类期望的四舍五入"—— 因为全程在十进制上运算');

console.log('\n高精度小数：');
console.log('  0.1 + 0.2 的 20 位结果 =', Decimal.from('0.1').add(Decimal.from('0.2')).round(20).toString());
console.log('  1 ÷ 7 保留 20 位 =', Decimal.from('1').divide(Decimal.from('7'), 20).toString());

// 字符串形式的结果可以直接参与展示，且与浮点结果对比
console.log('\n浮点 vs 十进制：');
console.log('  浮点 (0.1 + 0.2).toPrecision(20) =', (0.1 + 0.2).toPrecision(20));
console.log('  十进制 0.1 + 0.2                =', Decimal.from('0.1').add(Decimal.from('0.2')).toString());

// ---------------------------------------------------------------------------
// 5. 思路 D：容差比较
// ---------------------------------------------------------------------------

console.log('--- 5. 思路 D：容差比较 ---');

/** 绝对容差比较：判断"差得够小" */
function closeEnough(a, b, tolerance = 1e-9) {
  return Math.abs(a - b) <= tolerance;
}

/** 相对容差比较：适合量级不确定的场景 */
function relativelyClose(a, b, relTolerance = 1e-12) {
  if (a === b) return true;
  const scale = Math.max(Math.abs(a), Math.abs(b));
  // scale 为 0 时说明两数都是 0，上面 a === b 已经返回了
  return Math.abs(a - b) <= relTolerance * scale;
}

// 业务容差：金额到分
const CENT_TOLERANCE = 0.005;
console.log('closeEnough(0.1 + 0.2, 0.3)：', closeEnough(0.1 + 0.2, 0.3)); // true
console.log('closeEnough(1, 2)：', closeEnough(1, 2)); // false
console.log('金额比较（容差半分钱）：');
console.log('  closeEnough(19.996, 20.0, 0.005) =', closeEnough(19.996, 20.0, CENT_TOLERANCE)); // true，差 0.004
console.log('  closeEnough(19.99, 20.0, 0.005) =', closeEnough(19.99, 20.0, CENT_TOLERANCE)); // false，差 0.01 已经是一分钱

// 大数场景：绝对容差失效，相对容差有效
const bigX = 1e12 + 0.1;
const bigY = 1e12;
console.log('\n大数比较：');
console.log('  绝对差：', Math.abs(bigX - bigY));
console.log('  closeEnough（绝对）：', closeEnough(bigX, bigY, 1e-9)); // false
console.log('  relativelyClose：', relativelyClose(bigX, bigY, 1e-12)); // true

// 容差比较的正确用途：断言 / 测试 / 判等，而不是"用来做计算"
/** 用于测试断言：相等则通过，否则抛出带说明的错误 */
function assertClose(actual, expected, tolerance, message = '') {
  if (!closeEnough(actual, expected, tolerance)) {
    throw new Error(`断言失败${message ? `（${message}）` : ''}：期望 ${expected}，实际 ${actual}，容差 ${tolerance}`);
  }
}
console.log('\n断言测试：');
try {
  assertClose(0.1 + 0.2, 0.3, 1e-9, '浮点加法');
  console.log('  ✓ 0.1 + 0.2 与 0.3 在 1e-9 容差内相等');
} catch (err) {
  console.log('  ✗', err.message);
}
try {
  assertClose(1.0, 1.1, 1e-9, '明显不同的值');
  console.log('  ✓ 通过');
} catch (err) {
  console.log('  ✗', err.message);
}

// ---------------------------------------------------------------------------
// 6. 四种方案的选择建议
// ---------------------------------------------------------------------------

console.log('--- 6. 方案选择建议 ---');

const scenarios = [
  {
    name: '电商订单金额',
    recommend: '思路 B：整数分',
    reason: '加减乘除全在整数上做，天然精确，性能最好，也是行业惯例',
  },
  {
    name: '展示层保留 2 位小数',
    recommend: 'Intl.NumberFormat',
    reason: '展示用专业工具，还能顺便处理本地化与货币符号（见 07 号文件）',
  },
  {
    name: '科学计算 / 图形',
    recommend: '原生 Number + 思路 D 容差比较',
    reason: '本来就不需要十进制精确，追求性能，容差比较足够',
  },
  {
    name: '税率 / 汇率等复杂十进制运算',
    recommend: '思路 C：decimal 库',
    reason: '除法会产生无限小数，需要明确的精度与舍入策略，自己写风险太高',
  },
  {
    name: '超大整数（如雪花 id）',
    recommend: 'BigInt 或字符串',
    reason: '超出安全整数范围，必须避免用 Number 承载（见 06 号文件）',
  },
];

for (const s of scenarios) {
  console.log(`\n  【${s.name}】`);
  console.log(`    推荐：${s.recommend}`);
  console.log(`    理由：${s.reason}`);
}

// ---------------------------------------------------------------------------
// 7. 综合实战：一个完整的购物车结算
// ---------------------------------------------------------------------------

console.log('--- 7. 综合实战：购物车结算 ---');

/**
 * 结算：全程用整数分，最后一次性格式化输出。
 * 商品价格用字符串表示，从源头杜绝浮点解析误差。
 */
function checkout(items, { discountRate = 1, shippingYuan = 0, taxRate = 0 } = {}) {
  const lines = [];

  // 1) 逐行计算小计（单价 × 数量），单位统一为分
  let subtotalCents = 0;
  for (const item of items) {
    const unitCents = Money.fromYuan(item.price);
    const lineCents = Money.mul(item.price, item.quantity);
    lines.push({
      name: item.name,
      unit: Money.toYuanString(unitCents),
      quantity: item.quantity,
      subtotal: Money.toYuanString(lineCents),
    });
    subtotalCents += lineCents;
  }

  // 2) 折扣
  const discountedCents = Money.applyRate(subtotalCents, discountRate);

  // 3) 运费（也转成分）
  const shippingCents = Money.fromYuan(shippingYuan);

  // 4) 税费按折后价计算（不含运费，这是常见约定）
  const taxCents = Money.applyRate(discountedCents, taxRate);

  // 5) 总计
  const totalCents = discountedCents + shippingCents + taxCents;

  return { lines, subtotalCents, discountedCents, shippingCents, taxCents, totalCents };
}

const cart = [
  { name: '苹果（斤）', price: '5.9', quantity: 3 },
  { name: '牛奶（箱）', price: '59.90', quantity: 1 },
  { name: '纸巾（包）', price: '12.35', quantity: 2 },
];

const bill = checkout(cart, { discountRate: 0.95, shippingYuan: 8, taxRate: 0.06 });

console.log('  商品明细：');
for (const line of bill.lines) {
  console.log(`    ${line.name.padEnd(12)} ${line.unit.padStart(7)} 元 × ${String(line.quantity).padEnd(2)} = ${line.subtotal.padStart(8)} 元`);
}
console.log('  ' + '-'.repeat(50));
console.log(`    小计          ${Money.toYuanString(bill.subtotalCents).padStart(8)} 元`);
console.log(`    折后（95 折）  ${Money.toYuanString(bill.discountedCents).padStart(8)} 元`);
console.log(`    运费          ${Money.toYuanString(bill.shippingCents).padStart(8)} 元`);
console.log(`    税费（6%）     ${Money.toYuanString(bill.taxCents).padStart(8)} 元`);
console.log(`    应付合计       ${Money.toYuanString(bill.totalCents).padStart(8)} 元`);

// 用 Intl 做最终展示（金额已经是精确的分，格式化只负责好看）
const moneyFmt = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' });
console.log('\n  格式化后：应付', moneyFmt.format(Money.toYuanNumber(bill.totalCents)));

// 对照：如果用纯浮点算，结果会差多少
const floatSubtotal = cart.reduce((acc, it) => acc + Number(it.price) * it.quantity, 0);
const floatDiscounted = floatSubtotal * 0.95;
const floatTax = floatDiscounted * 0.06;
const floatTotal = floatDiscounted + 8 + floatTax;
console.log('\n  浮点计算结果：', floatTotal);
console.log('  整数分计算结果：', Money.toYuanNumber(bill.totalCents));
console.log('  差值：', Math.abs(floatTotal - Money.toYuanNumber(bill.totalCents)));
console.log('  本笔订单差值很小，但金额大了或笔数多了就可能差出 1 分钱 —— 而对账只认分');

console.log('\n全部演示完毕。');
