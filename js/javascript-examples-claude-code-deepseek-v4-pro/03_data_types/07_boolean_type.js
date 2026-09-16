/**
 * ============================================================================
 * 知识点：boolean 类型与真值表
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】入门
 * 【前置知识】03_data_types/03_type_conversion.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    boolean 是最简单的原始类型，只有两个字面量：true 和 false。
 *    typeof true === 'boolean'。
 *
 * 2. 为什么需要
 *    它是所有分支与循环的"燃料"：if、while、for、三元表达式、逻辑运算符
 *    都围绕布尔判断展开。而 JS 允许任意值出现在条件位置，引擎会自动做
 *    ToBoolean 转换，这就产生了"真值 / 假值"的概念。
 *
 * 3. 核心语法要点
 *    【产生布尔值的三类操作】
 *      · 比较运算符：=== !== > < >= <= ，结果一定是 boolean。
 *      · 逻辑运算符：! && || ??（注意：!!、&&、||、?? 的返回值不一定是布尔，
 *        见第 4 节）。
 *      · 判断类方法：Array.isArray、Number.isNaN、String.prototype.includes 等。
 *    【假值只有 8 个】false、0、-0、0n、''、null、undefined、NaN。
 *      除此之外一切皆真值 —— 包括 '0'、' '、[]、{}、function(){}。
 *    【取反与双重取反】!x 把 x 转布尔后取反；!!x 是"转成布尔"的惯用写法，
 *      等价于 Boolean(x)。
 *    【逻辑运算符的短路与返回值】
 *      · a && b：a 为假值则返回 a，否则返回 b。
 *      · a || b：a 为真值则返回 a，否则返回 b。
 *      · a ?? b：a 为 null 或 undefined 时返回 b，否则返回 a。
 *      它们返回的是"操作数本身"，不是布尔值，这一点常被误用。
 *    【逻辑赋值运算符（ES2021）】||=、&&=、??= 是 a = a || b 的简写。
 *    【真值表】与 / 或 / 非 / 异或（异或要用 !== 表达）。
 *
 * 4. 常见陷阱
 *    · if (x) 与 if (x === true) 完全不同：前者对 1、'abc'、[] 都成立。
 *    · new Boolean(false) 是对象，对象恒为真值 —— 永远不要用 new Boolean()。
 *    · 判断"值是否存在"时，用 ?? 而不是 ||，否则 0 和 '' 会被当成"不存在"。
 *    · a && b 用于取值时会返回 b 的原始类型，把它当布尔用会出类型错误。
 *    · Array.prototype.includes 用 SameValueZero 比较，[NaN].includes(NaN) 为 true。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/07_boolean_type.js
 *
 * 【预期输出】
 *   打印 boolean 基础操作、完整真值表、8 个假值清单、逻辑运算符返回值演示，
 *   以及 new Boolean 的陷阱。全部为确定输出，退出码 0。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. boolean 的基础
// ---------------------------------------------------------------------------

console.log('--- 1. boolean 基础 ---');

const t = true;
const f = false;
console.log('true  ->', t, '| typeof =', typeof t);
console.log('false ->', f, '| typeof =', typeof f);
console.log('取反：!true =', !t, ' !false =', !f);

// !! 是"转布尔"的经典写法。
console.log('!!0 =', !!0, ' !!"abc" =', !!"abc", ' !![] =', !![]);
console.log('Boolean(x) 与 !!x 等价：', Boolean('abc') === !!'abc');

// 比较运算符一定返回 boolean
console.log('1 < 2        =', 1 < 2);
console.log("'a' === 'a'  =", 'a' === 'a');
console.log('NaN === NaN  =', NaN === NaN);
console.log('typeof (1 < 2) =', typeof (1 < 2));

// ---------------------------------------------------------------------------
// 2. 与 / 或 / 非 真值表
// ---------------------------------------------------------------------------

console.log('--- 2. 逻辑运算真值表 ---');

console.log('A     | B     | A && B | A || B | !A');
console.log('------+-------+--------+--------+-------');
for (const a of [true, false]) {
  for (const b of [true, false]) {
    console.log(
      String(a).padEnd(5), '|',
      String(b).padEnd(5), '|',
      String(a && b).padEnd(6), '|',
      String(a || b).padEnd(6), '|',
      String(!a),
    );
  }
}

// 异或没有专门运算符，用 !== 表达：两个布尔不同时为真。
console.log('异或 true !== false =', true !== false);
console.log('异或 true !== true  =', true !== true);

// ---------------------------------------------------------------------------
// 3. 八个假值
// ---------------------------------------------------------------------------

console.log('--- 3. 八个假值（假值就这么几个）---');

const falsyValues = [
  ['false', false],
  ['0', 0],
  ['-0', -0],
  ['0n', 0n],
  ["''（空字符串）", ''],
  ['null', null],
  ['undefined', undefined],
  ['NaN', NaN],
];
falsyValues.forEach(([label, value], index) => {
  console.log(`  ${index + 1}. Boolean(${label}) = ${Boolean(value)}`);
});
console.log('假值总数：', falsyValues.filter(([, v]) => !v).length, '个');

console.log('--- 对照：这些都是真值 ---');
const truthySamples = [
  ["'0'（含字符 0 的字符串）", '0'],
  ["'false'（含文字的字符串）", 'false'],
  ["' '（空格）", ' '],
  ['[]（空数组）', []],
  ['{}（空对象）', {}],
  ['function () {}（空函数）', function () {}],
  ['-1', -1],
  ['Infinity', Infinity],
];
truthySamples.forEach(([label, value]) => {
  console.log(`  Boolean(${label}) = ${Boolean(value)}`);
});

// ---------------------------------------------------------------------------
// 4. 逻辑运算符返回的是操作数，不是布尔值
// ---------------------------------------------------------------------------

console.log('--- 4. && 与 || 的返回值 ---');

// && ：遇到假值就"短路口"返回该假值，否则返回最后一个操作数。
console.log("0 && 'x'        =", 0 && 'x', '（返回 0，类型是', typeof (0 && 'x') + '）');
console.log("'' && 'x'       =", JSON.stringify('' && 'x'));
console.log("'a' && 'b'      =", 'a' && 'b', '（返回最后一个操作数）');
console.log("1 && 2 && 3     =", 1 && 2 && 3);
console.log("1 && 0 && 3     =", 1 && 0 && 3, '（遇到 0 就返回 0）');

// || ：遇到真值就返回它，否则返回最后一个操作数。
console.log("'a' || 'b'      =", 'a' || 'b');
console.log("'' || '默认值'  =", '' || '默认值');
console.log("0 || '默认值'   =", 0 || '默认值', '← 0 被当成"不存在"，这是经典坑');
console.log('null || 42      =', null || 42);

// ?? ：只在 null / undefined 时取默认值，保留 0 与 ''。
console.log("0 ?? '默认值'   =", 0 ?? '默认值', '← 这才是正确的"默认值"写法');
console.log("'' ?? '默认值'  =", JSON.stringify('' ?? '默认值'));
console.log("null ?? '默认值' =", null ?? '默认值');
console.log("undefined ?? '默认值' =", undefined ?? '默认值');

// 通过函数参数演示实战差异：
/** 用 || 取默认值：0 和空串会被覆盖 */
const badDefault = (count) => count || 10;
/** 用 ?? 取默认值：只有 null / undefined 被覆盖 */
const goodDefault = (count) => count ?? 10;
console.log('badDefault(0)  =', badDefault(0), '← 0 被误判为缺省');
console.log('goodDefault(0) =', goodDefault(0), '← 保留了 0');

// ---------------------------------------------------------------------------
// 5. 短路求值的实际用途
// ---------------------------------------------------------------------------

console.log('--- 5. 短路求值 ---');

let callCount = 0;
const sideEffect = () => {
  callCount++;
  return true;
};

// || 左侧为真时，右侧根本不会执行。
const r1 = true || sideEffect();
console.log('true || sideEffect() → 结果', r1, '，sideEffect 被调用次数：', callCount);
const r2 = false && sideEffect();
console.log('false && sideEffect() → 结果', r2, '，sideEffect 被调用次数：', callCount);

// 常见惯用法：条件成立才执行。
const isDebug = false;
isDebug && console.log('这行只有在 isDebug 为真时才打印');
console.log('（上面这行没有输出，说明短路生效）');

// 常见惯用法：给可能为空的变量兜底。
const config = { timeout: undefined };
const timeout = config.timeout ?? 3000;
console.log('兜底后的 timeout =', timeout);

// ---------------------------------------------------------------------------
// 6. 逻辑赋值运算符（ES2021）
// ---------------------------------------------------------------------------

console.log('--- 6. 逻辑赋值运算符 ---');

let a = 0;
a ||= 5; // 等价于 a = a || 5
console.log('0 ||= 5   →', a);

let b = 0;
b ??= 5; // 等价于 b = b ?? 5，0 不会被覆盖
console.log('0 ??= 5   →', b, '← 保留了 0');

let c = 1;
c &&= 9; // 等价于 c = c && 9
console.log('1 &&= 9   →', c);

const obj = { name: null };
obj.name ??= '未命名';
console.log('obj.name ??= "未命名" →', obj.name);

// ---------------------------------------------------------------------------
// 7. 陷阱：new Boolean 与真值判断
// ---------------------------------------------------------------------------

console.log('--- 7. 陷阱 ---');

// new Boolean(false) 是对象，对象永远是真值。
const boxedFalse = new Boolean(false);
console.log('typeof new Boolean(false) =', typeof boxedFalse);
console.log('if (new Boolean(false)) 会进入分支吗？', Boolean(boxedFalse) ? '会！' : '不会');
console.log('boxedFalse.valueOf() =', boxedFalse.valueOf(), '← 真正的值在这里');
console.log('结论：永远不要用 new Boolean()，直接用字面量 false。');

// 用 === true 判断会漏掉所有"真值但非布尔"的情况。
const maybeTrue = 1;
console.log("if (1)              →", Boolean(maybeTrue) ? '进入分支' : '不进入');
console.log("if (1 === true)     →", maybeTrue === true ? '进入分支' : '不进入');

// 判断数组是否含 NaN：includes 用 SameValueZero，能正确找到 NaN。
console.log('[1, NaN].includes(NaN)   =', [1, NaN].includes(NaN), '（SameValueZero）');
console.log('[1, NaN].indexOf(NaN)    =', [1, NaN].indexOf(NaN), '（用 === ，找不到）');

console.log('--- 完成：boolean 与真值表 ---');
