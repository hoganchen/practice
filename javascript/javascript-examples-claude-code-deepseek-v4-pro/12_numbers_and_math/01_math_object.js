/**
 * ============================================================================
 * 知识点：Math 静态方法大全 —— abs/ceil/floor/round/trunc/sign/min/max/pow/sqrt/cbrt/hypot
 * ============================================================================
 *
 * 【所属分类】12_numbers_and_math —— 数字与数学运算
 * 【难度等级】入门
 * 【前置知识】04_operators/01_arithmetic.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Math 是一个内置的全局对象，上面挂着一组数学常量与静态方法。
 *    它不是构造函数，不能 new Math()，也不应该被当作实例使用。
 *    常用方法按用途可分为：
 *      取整类    ceil（向上） floor（向下） round（四舍五入） trunc（去掉小数）
 *      符号类    abs（绝对值） sign（符号：-1 / 0 / 1，注意 -0）
 *      比较类    min / max（可接收任意个参数）
 *      幂与根    pow(x, y) sqrt（平方根） cbrt（立方根） hypot（勾股/欧几里得范数）
 *      其它      exp log log2 log10 sin cos tan 等三角与对数函数
 *    常量有 Math.PI、Math.E、Math.LN2、Math.SQRT2 等。
 *
 * 2. 为什么需要
 *    分页计算（总数 / 每页数取上整）、像素坐标取整、金额取整、
 *    距离计算（hypot）、概率与统计、游戏物理，绝大多数都靠这几个方法组合完成。
 *    它们都是"纯函数"：不改参数、无副作用，结果只由入参决定。
 *
 * 3. 核心语法要点
 *    - 所有方法都是 Math.xxx(...) 的调用形式，不需要实例。
 *    - 参数会先被转成数字：Math.abs('-3') === 3，Math.max('5', 2) === 5。
 *      无法转成数字的参数得到 NaN（Math.max(1, 'x') === NaN）。
 *    - Math.min() 不传参数返回 Infinity，Math.max() 不传参数返回 -Infinity。
 *      这样设计是为了让 reduce 之类的折叠逻辑自然工作。
 *    - Math.sign(-0) 返回 -0（不是 0），Object.is(Math.sign(-0), -0) 为 true。
 *    - Math.hypot(a, b) 计算 sqrt(a*a + b*b)，但内部做了防溢出处理，比手写更稳。
 *    - Math.pow(x, y) 与运算符 x ** y 等价；Math.sqrt(x) 等价于 x ** 0.5。
 *
 * 4. 常见陷阱
 *    - Math.round 的"四舍五入"是"向 +Infinity 方向取整"：
 *      Math.round(-2.5) 得到 -2（而不是 -3），Math.round(-0.5) 得到 -0。
 *    - ceil/floor/round/trunc 都只处理到小数点后 0 位，保留两位小数不是它们的职责，
 *      需要 toFixed（见 02 号文件）或"放大取整再缩小"（见 08 号文件）。
 *    - 传入字符串和 null：Math.max(null, 1) 得到 1（null 被转成 0），容易误判。
 *    - Math.abs(-0) 返回 0；判断一个值是否为负零要用 Object.is(x, -0)。
 *    - 这些方法对超大数（超出安全整数范围）会静默丢精度，见 06 号文件。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 12_numbers_and_math/01_math_object.js
 *
 * 【预期输出】
 *   分组打印各 Math 方法在典型输入下的返回值与边界行为。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 常量
// ---------------------------------------------------------------------------

console.log('--- 1. Math 常量 ---');

console.log('Math.PI：', Math.PI); // 圆周率
console.log('Math.E：', Math.E); // 自然对数底
console.log('Math.LN2：', Math.LN2); // ln(2)
console.log('Math.LN10：', Math.LN10); // ln(10)
console.log('Math.LOG2E：', Math.LOG2E); // log2(e)
console.log('Math.SQRT2：', Math.SQRT2); // 根号 2
console.log('Math.SQRT1_2：', Math.SQRT1_2); // 根号(1/2)

// 常用：把角度转成弧度（三角函数只接受弧度）
const toRadians = (deg) => (deg * Math.PI) / 180;
const toDegrees = (rad) => (rad * 180) / Math.PI;
console.log('180 度 = ', toRadians(180), '弧度');
console.log('Math.PI 弧度 = ', toDegrees(Math.PI), '度');

// ---------------------------------------------------------------------------
// 2. 取整四兄弟：ceil / floor / round / trunc
// ---------------------------------------------------------------------------

console.log('--- 2. 取整方法对比 ---');

// ceil：向上取整（向 +Infinity 方向），别名"天花板"
console.log('Math.ceil(4.1) =', Math.ceil(4.1)); // 5
console.log('Math.ceil(4.9) =', Math.ceil(4.9)); // 5
console.log('Math.ceil(-4.1) =', Math.ceil(-4.1)); // -4 ← 注意负数方向
console.log('Math.ceil(4) =', Math.ceil(4)); // 4，整数原样返回

// floor：向下取整（向 -Infinity 方向），别名"地板"
console.log('\nMath.floor(4.9) =', Math.floor(4.9)); // 4
console.log('Math.floor(-4.1) =', Math.floor(-4.1)); // -5 ← 负数变小
console.log('Math.floor(4) =', Math.floor(4)); // 4

// round：四舍五入，但实际规则是"加上 0.5 后向下取整"
console.log('\nMath.round(4.4) =', Math.round(4.4)); // 4
console.log('Math.round(4.5) =', Math.round(4.5)); // 5
console.log('Math.round(4.6) =', Math.round(4.6)); // 5
console.log('Math.round(-4.5) =', Math.round(-4.5)); // -4 ← 不是 -5！
console.log('Math.round(-4.6) =', Math.round(-4.6)); // -5
console.log('Math.round(2.5) =', Math.round(2.5)); // 3
console.log('Math.round(-2.5) =', Math.round(-2.5)); // -2 ← 不对称

// trunc：直接去掉小数部分（向 0 方向取整）
console.log('\nMath.trunc(4.9) =', Math.trunc(4.9)); // 4
console.log('Math.trunc(-4.9) =', Math.trunc(-4.9)); // -4 ← 和 floor 不同
console.log('Math.trunc(-0.9) =', Math.trunc(-0.9)); // -0（是负零）

// 传统上 trunc 的替代写法（理解位运算取整的原理）
console.log('\n~~4.9 =', ~~4.9); // 4，双按位取反
console.log('~~-4.9 =', ~~-4.9); // -4
// 但位运算会把值截断到 32 位（有符号），处理大数时会出错
// 顺便注意：~~x ** y 是语法错误，因为一元运算符不能直接用在 ** 左边，必须加括号
console.log('~~(2 ** 31) =', ~~(2 ** 31)); // -2147483648 ← 溢出成负数
console.log('Math.trunc(2 ** 31) =', Math.trunc(2 ** 31)); // 2147483648 正确
console.log('~~1e10 =', ~~1e10); // 1410065408 ← 完全错误的值
console.log('Math.trunc(1e10) =', Math.trunc(1e10)); // 10000000000 正确

// 对照表
console.log('\n  值      ceil   floor  round  trunc');
for (const v of [4.2, 4.5, 4.7, -4.2, -4.5, -4.7]) {
  console.log(
    `  ${String(v).padEnd(6)}${String(Math.ceil(v)).padEnd(7)}${String(Math.floor(v)).padEnd(7)}${String(Math.round(v)).padEnd(7)}${Math.trunc(v)}`,
  );
}

// ---------------------------------------------------------------------------
// 3. abs 与 sign
// ---------------------------------------------------------------------------

console.log('--- 3. abs 与 sign ---');

console.log('Math.abs(-5) =', Math.abs(-5)); // 5
console.log('Math.abs(5) =', Math.abs(5)); // 5
console.log("Math.abs('-3.5') =", Math.abs('-3.5')); // 3.5，字符串会被转成数字
console.log('Math.abs(NaN) =', Math.abs(NaN)); // NaN
console.log('Math.abs(null) =', Math.abs(null)); // 0，null 转成 0

// sign 返回符号：正数 1，负数 -1，正零 0，负零 -0
console.log('\nMath.sign(42) =', Math.sign(42)); // 1
console.log('Math.sign(-42) =', Math.sign(-42)); // -1
console.log('Math.sign(0) =', Math.sign(0)); // 0
console.log('Math.sign(-0) =', Math.sign(-0)); // -0
console.log('Math.sign(NaN) =', Math.sign(NaN)); // NaN

// 判断是否为负零要用 Object.is，因为 -0 === 0 为 true
console.log('\n-0 === 0：', -0 === 0); // true
console.log('Object.is(-0, 0)：', Object.is(-0, 0)); // false
console.log('Object.is(Math.sign(-0), -0)：', Object.is(Math.sign(-0), -0)); // true

// 实战：保留符号的对齐方式
function applySign(magnitude, signSource) {
  // 用 sign 拿到方向，再作用到绝对值上，比写 if/else 简洁
  return Math.abs(magnitude) * Math.sign(signSource);
}
console.log('\napplySign(5, -3) =', applySign(5, -3)); // -5
console.log('applySign(-5, 3) =', applySign(-5, 3)); // 5

// ---------------------------------------------------------------------------
// 4. min 与 max
// ---------------------------------------------------------------------------

console.log('--- 4. min 与 max ---');

// 可以接收任意多个参数
console.log('Math.min(3, 1, 2) =', Math.min(3, 1, 2)); // 1
console.log('Math.max(3, 1, 2) =', Math.max(3, 1, 2)); // 3

// 不传参数时的返回值是"无穷"，这是为了配合 reduce 折叠
console.log('Math.min() =', Math.min()); // Infinity
console.log('Math.max() =', Math.max()); // -Infinity

// 参数会被转成数字
console.log("\nMath.max('5', 2) =", Math.max('5', 2)); // 5
console.log('Math.max(null, 1) =', Math.max(null, 1)); // 1 ← null 变成 0
console.log("Math.max(1, 'x') =", Math.max(1, 'x')); // NaN ← 有一个不能转就全 NaN

// 丢弃 NaN 的安全版本
function maxSafe(...nums) {
  // 先过滤掉不能转成数字的值，再求最大
  const valid = nums.map(Number).filter((n) => !Number.isNaN(n));
  return valid.length === 0 ? NaN : Math.max(...valid);
}
console.log('\nmaxSafe(1, "x", 5) =', maxSafe(1, 'x', 5)); // 5
console.log('maxSafe("x") =', maxSafe('x')); // NaN

// 用展开运算符对数组求极值（数组元素过多时可能超出参数个数上限，分块更安全）
const scores = [88, 92, 76, 95, 81];
console.log('\n数组最大值：', Math.max(...scores)); // 95
console.log('数组最小值：', Math.min(...scores)); // 76

// 用 reduce 处理超长数组（不依赖展开运算符）
const bigValues = [1, 5, 3, 9, 2];
console.log('reduce 求最大：', bigValues.reduce((a, b) => Math.max(a, b), -Infinity)); // 9

// 实战：把数值限制在区间内（clamp），这是最常用的数学工具之一
function clamp(value, min, max) {
  // Math.min 与 Math.max 的嵌套顺序：先抬下限，再压上限
  return Math.min(Math.max(value, min), max);
}
console.log('\nclamp(15, 0, 10) =', clamp(15, 0, 10)); // 10
console.log('clamp(-5, 0, 10) =', clamp(-5, 0, 10)); // 0
console.log('clamp(5, 0, 10) =', clamp(5, 0, 10)); // 5

// clamp 可用于进度条百分比、调色分量等场景
const percent = clamp((7 / 10) * 100, 0, 100);
console.log('百分比：', percent);

// ---------------------------------------------------------------------------
// 5. pow / sqrt / cbrt
// ---------------------------------------------------------------------------

console.log('--- 5. 幂与根 ---');

// pow(x, y) 计算 x 的 y 次方，等价于 x ** y
console.log('Math.pow(2, 10) =', Math.pow(2, 10)); // 1024
console.log('2 ** 10 =', 2 ** 10); // 1024
console.log('Math.pow(2, 0.5) =', Math.pow(2, 0.5)); // 1.414...（开平方）
console.log('Math.pow(2, -1) =', Math.pow(2, -1)); // 0.5（负指数是倒数）
console.log('Math.pow(-8, 1 / 3) =', Math.pow(-8, 1 / 3)); // NaN ← 负数开奇次方不成立

// sqrt：平方根
console.log('\nMath.sqrt(16) =', Math.sqrt(16)); // 4
console.log('Math.sqrt(2) =', Math.sqrt(2)); // 1.4142135623730951
console.log('Math.sqrt(-1) =', Math.sqrt(-1)); // NaN，JS 没有虚数
console.log('Math.sqrt(0) =', Math.sqrt(0)); // 0

// cbrt：立方根，可以处理负数（ES2015 新增）
console.log('\nMath.cbrt(27) =', Math.cbrt(27)); // 3
console.log('Math.cbrt(-27) =', Math.cbrt(-27)); // -3 ← sqrt 做不到这一点
console.log('Math.cbrt(0) =', Math.cbrt(0));

// 用 pow 求平方根与平方根的对比
console.log('\nsqrt(9) === 9 ** 0.5：', Math.sqrt(9) === 9 ** 0.5); // true

// 实战：复利计算
function compound(principal, rate, years) {
  // 本息合计 = 本金 * (1 + 年利率) ^ 年数
  return principal * Math.pow(1 + rate, years);
}
console.log('\n10000 元，年利率 5%，存 10 年：', compound(10000, 0.05, 10).toFixed(2));

// 实战：两点距离（平方根形式）
function distance2D(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
console.log('(0,0) 到 (3,4) 的距离：', distance2D(0, 0, 3, 4)); // 5

// ---------------------------------------------------------------------------
// 6. hypot —— 更安全的勾股计算
// ---------------------------------------------------------------------------

console.log('--- 6. Math.hypot ---');

// hypot(a, b, ...) 计算所有参数平方和的平方根
console.log('Math.hypot(3, 4) =', Math.hypot(3, 4)); // 5
console.log('Math.hypot(5, 12) =', Math.hypot(5, 12)); // 13
console.log('Math.hypot(3, 4, 12) =', Math.hypot(3, 4, 12)); // 13（三维）
console.log('Math.hypot() =', Math.hypot()); // 0（空和）
console.log('Math.hypot(-3, -4) =', Math.hypot(-3, -4)); // 5，先平方所以符号消失

// 与手写 sqrt(a*a + b*b) 的结果一致
console.log('\n与手写一致：', Math.hypot(3, 4) === distance2D(0, 0, 3, 4));

// 但超大数值时 hypot 不会溢出，手写会
const big = 1e200;
console.log('\n手写 sqrt(a*a+b*b)：', Math.sqrt(big * big + big * big)); // Infinity 溢出
console.log('Math.hypot(a, b)：', Math.hypot(big, big)); // 1.4142...e+200 正常

// 实战：向量长度（归一化前必做的一步）
function normalize2D([x, y]) {
  const len = Math.hypot(x, y);
  // 零向量无法归一化，返回 [0, 0] 避免除以 0
  if (len === 0) return [0, 0];
  return [x / len, y / len];
}
console.log('\n归一化 [3, 4]：', JSON.stringify(normalize2D([3, 4])));
console.log('归一化 [0, 0]：', JSON.stringify(normalize2D([0, 0])));

// ---------------------------------------------------------------------------
// 7. 对数与三角（简要）
// ---------------------------------------------------------------------------

console.log('--- 7. 对数与三角 ---');

console.log('Math.log(Math.E) =', Math.log(Math.E)); // 1，自然对数
console.log('Math.log(1) =', Math.log(1)); // 0
console.log('Math.log(0) =', Math.log(0)); // -Infinity
console.log('Math.log(-1) =', Math.log(-1)); // NaN
console.log('Math.log2(8) =', Math.log2(8)); // 3
console.log('Math.log10(1000) =', Math.log10(1000)); // 3
console.log('Math.log1p(0) =', Math.log1p(0)); // 0，计算 ln(1+x)，x 很小时更精确

console.log('\nMath.exp(1) =', Math.exp(1)); // 2.718...  e 的 1 次方
console.log('Math.expm1(0) =', Math.expm1(0)); // 0，计算 e^x - 1，x 很小时更精确

// 三角函数使用弧度
console.log('\nMath.sin(0) =', Math.sin(0));
console.log('Math.cos(0) =', Math.cos(0));
console.log('sin(90°) =', Math.sin(toRadians(90))); // 1，但有浮点误差
console.log('Math.atan2(1, 1) =', Math.atan2(1, 1)); // 0.785... 即 45 度
console.log('转成角度：', toDegrees(Math.atan2(1, 1))); // 45

// 实战：用 atan2 计算两点连线的角度（游戏里算朝向）
function angleBetween(x1, y1, x2, y2) {
  // atan2(dy, dx) 能正确处理所有象限，比 atan(dy/dx) 安全
  return toDegrees(Math.atan2(y2 - y1, x2 - x1));
}
console.log('(0,0)→(1,1) 的角度：', angleBetween(0, 0, 1, 1)); // 45
console.log('(0,0)→(-1,1) 的角度：', angleBetween(0, 0, -1, 1)); // 135

// 查看 Math 上所有自有属性名（不含原型链）
console.log('\nMath 自有属性数量：', Object.getOwnPropertyNames(Math).length);
console.log('是否可被 new：', (() => {
  try {
    // Math 不是构造函数，new 它一定报错，这里用 try/catch 演示
    new Math();
    return '可以 new（意外）';
  } catch (err) {
    return `不能 new：${err.constructor.name}`;
  }
})());

console.log('\n全部演示完毕。');
