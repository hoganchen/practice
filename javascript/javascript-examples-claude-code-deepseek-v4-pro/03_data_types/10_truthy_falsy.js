/**
 * ============================================================================
 * 知识点：真值与假值 —— 假值只有 8 个，其余一切都是真值
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】入门
 * 【前置知识】03_data_types/07_boolean_type.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    凡是出现在"布尔上下文"里的值（if 条件、while 条件、!x、&&/||/??、
 *    三元表达式、Boolean(x)、Array.prototype.filter 的回调返回值等），
 *    引擎都会先做 ToBoolean 转换。转换结果为 false 的值叫"假值（falsy）"，
 *    其余全部叫"真值（truthy）"。
 *
 * 2. 为什么必须背下来
 *    因为"假值只有 8 个"这个事实能解决大量误判：
 *      · 空数组 []、空对象 {} 都是真值 —— 不能用 if (arr) 判断"数组是否为空"，
 *        必须用 arr.length === 0。
 *      · 字符串 '0' 与 'false' 都是真值 —— 从表单/URL 拿到的字符串永远为真，
 *        必须显式转换或比较。
 *      · 0 与 '' 是假值 —— 用 || 兜底会把合法的 0 和空串吃掉，应该用 ??。
 *
 * 3. 核心语法要点
 *    【完整的 8 个假值】
 *      1) false      布尔假
 *      2) 0          数字零
 *      3) -0         数字负零
 *      4) 0n         BigInt 零
 *      5) ''         空字符串（含 `''`、""、`` 三种写法，长度必须为 0）
 *      6) null       空值
 *      7) undefined  未定义
 *      8) NaN        非数字
 *    【判定方式】Boolean(v) 与 !!v 完全等价，都走 ToBoolean 转换。
 *    【在分支中的表现】if (v)、v ? a : b、while (v)、v && x、v || x 都会触发转换。
 *    【重要对照】这些"看起来像空"但其实是真值：
 *      '0'、'false'、' '（空格）、'\t\n'、[]、{}、function () {}、
 *      new Boolean(false)、0.0 之外的 -1、Infinity、'undefined'。
 *
 * 4. 常见陷阱
 *    · 用 if (!arr) 判断空数组 → 永远不成立，因为 [] 是真值。
 *    · 用 if (!obj) 判断空对象 → 同理，{} 也是真值。
 *    · 用 value || default 兜底 → value 为 0 / '' / false 时被误替换。
 *    · filter(Boolean) 能过滤掉假值，但也会顺带过滤掉合法的 0 与 ''，慎用。
 *    · 浏览器环境里还有一个历史遗留的假值 document.all（一个"像 undefined 的
 *      对象"），这是为兼容旧网页而保留的特例，Node 中不存在，本示例不涉及。
 *    · Number 的 0.0 与 0 是同一个值，-0 也是假值，不要以为负零是真值。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/10_truthy_falsy.js
 *
 * 【预期输出】
 *   打印 8 个假值的逐一验证表、常见真值对照表、分支中的实际表现、
 *   以及 || 与 ?? 兜底差异的实战对比。全部输出确定，退出码 0。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 八个假值，一个不多一个不少
// ---------------------------------------------------------------------------

console.log('--- 1. 八个假值 ---');

// 每一项都用 [表达式文本, 值] 的形式列出，便于统一验证。
const falsyList = [
  ['false', false],
  ['0', 0],
  ['-0', -0],
  ['0n', 0n],
  ["''", ''],
  ['null', null],
  ['undefined', undefined],
  ['NaN', NaN],
];

falsyList.forEach(([expr, value], i) => {
  const verdict = value ? '会进入' : '不进入';
  console.log(`${i + 1}. Boolean(${expr}) = ${Boolean(value)}，if (${expr}) ${verdict}真分支`);
});

// 统计一下，确认恰好 8 个。
const totalFalsy = falsyList.filter(([, v]) => !v).length;
console.log('假值总数：', totalFalsy, '个（这就是全部）');

// -0 的特殊之处：它和 0 用 === 比较是相等的，但可以用 Object.is 区分。
console.log('-0 === 0 ?', -0 === 0, '| Object.is(-0, 0) ?', Object.is(-0, 0));
console.log('Boolean(-0) =', Boolean(-0), '（负零同样是假值）');

// ---------------------------------------------------------------------------
// 2. 对照：这些"看起来像空"，其实是真值
// ---------------------------------------------------------------------------

console.log('--- 2. 容易误判的真值 ---');

const trickyTruthy = [
  ["'0'（内容为 0 的字符串）", '0'],
  ["'false'（内容为 false 的字符串）", 'false'],
  ["' '（一个空格）", ' '],
  ["'\\t\\n'（空白字符）", '\t\n'],
  ["'undefined'（内容为 undefined 的字符串）", 'undefined'],
  ['[]（空数组）', []],
  ['{}（空对象）', {}],
  ['function () {}（空函数）', function () {}],
  ['new Boolean(false)（包装对象）', new Boolean(false)],
  ['-1（负一）', -1],
  ['Infinity（无穷）', Infinity],
  ['0.1（小数）', 0.1],
];

trickyTruthy.forEach(([label, value]) => {
  console.log(`  ${label} → Boolean = ${Boolean(value)}`);
});

// 重点提醒：空数组与空对象的判断方式。
const emptyArr = [];
const emptyObj = {};
console.log("if ([]) 会进入分支吗？", emptyArr ? '会' : '不会', '← 空数组是真值');
console.log("判断数组为空应写 arr.length === 0 →", emptyArr.length === 0);
console.log("判断对象为空应写 Object.keys(obj).length === 0 →",
  Object.keys(emptyObj).length === 0);

// ---------------------------------------------------------------------------
// 3. 布尔上下文有哪些
// ---------------------------------------------------------------------------

console.log('--- 3. 常见布尔上下文 ---');

const samples = [0, 1, '', 'x'];

for (const v of samples) {
  const label = JSON.stringify(v);
  const ifResult = v ? '真分支' : '假分支'; // 三元表达式
  const notResult = !v; // 逻辑非
  const andResult = v && '右值被求值'; // 短路与
  const orResult = v || '右值被求值'; // 短路或
  console.log(
    `v = ${label.padEnd(4)} | if: ${ifResult.padEnd(4)} | !v: ${String(notResult).padEnd(5)}` +
    ` | v && 右: ${String(andResult).padEnd(6)} | v || 右: ${orResult}`,
  );
}

// while 循环同样是布尔上下文：下面的循环靠 0 结束。
console.log('while 循环演示：');
let countdown = 3;
while (countdown) {
  console.log('  倒计时', countdown);
  countdown--; // 减到 0 时 0 是假值，循环结束
}
console.log('  循环因 countdown 变成 0（假值）而结束');

// filter 的回调返回值也是布尔上下文。
const mixed = [0, 1, '', 'a', '', null, undefined, NaN, [], {}];
console.log('mixed              =', mixed);
console.log('mixed.filter(Boolean) =', mixed.filter(Boolean));
console.log('过滤掉的元素：', mixed.filter((v) => !v));
console.log('注意：合法的 0 和 "" 也被一并过滤掉了 ← filter(Boolean) 的副作用');

// ---------------------------------------------------------------------------
// 4. 兜底写法：|| 与 ?? 的差别
// ---------------------------------------------------------------------------

console.log('--- 4. || 与 ?? 兜底对比 ---');

/** 表单每条记录可能有"数量"，0 是合法值 */
const records = [
  { name: '甲', count: 0 },
  { name: '乙', count: 5 },
  { name: '丙', count: null },
  { name: '丁' },
];

for (const r of records) {
  const byOr = r.count || 10; // 假值即兜底：0 会被覆盖
  const byNullish = r.count ?? 10; // 只有 null/undefined 才兜底
  console.log(
    `记录 ${r.name} 的 count = ${String(r.count).padEnd(9)}` +
    ` | count || 10 = ${String(byOr).padEnd(3)}` +
    ` | count ?? 10 = ${byNullish}`,
  );
}
console.log('结论：能确定"只有 null/undefined 算缺省"时，一律用 ??');

// ---------------------------------------------------------------------------
// 5. 显式转换 vs 隐式转换
// ---------------------------------------------------------------------------

console.log('--- 5. 显式与隐式转换 ---');

/** 把一个值渲染成便于在表格里阅读的短标签 */
function show(v) {
  if (typeof v === 'string') return JSON.stringify(v); // 字符串带引号，避免与数字混淆
  if (Array.isArray(v)) return '[]';
  if (v !== null && typeof v === 'object') return '{}';
  return String(v); // 数字、布尔、null、undefined、NaN 直接转字符串
}

const values = [0, 1, '', 'abc', null, undefined, NaN, [], {}];
console.log('值'.padEnd(10), '| Boolean() | !!v  | if 判定');
console.log('-'.repeat(46));
for (const v of values) {
  console.log(
    show(v).padEnd(10), '|',
    String(Boolean(v)).padEnd(9), '|',
    String(!!v).padEnd(5), '|',
    v ? '真' : '假',
  );
}

// ---------------------------------------------------------------------------
// 6. 实战：一个只在"值确实存在"时才覆盖的合并工具
// ---------------------------------------------------------------------------

console.log('--- 6. 实战：区分"缺省"与"合法假值" ---');

/**
 * 合并配置：只有当来源值既不缺省、又不是空字符串时，才覆盖目标值。
 * 这样 0、false 这类合法值能被保留，而 '' 和 undefined 会被跳过。
 * @param {object} target 目标配置
 * @param {object} source 来源配置
 */
function mergeConfig(target, source) {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    // 用 ?? 处理 null/undefined，用 !== '' 处理空字符串，两者职责分明。
    const normalized = value ?? target[key];
    result[key] = normalized === '' ? target[key] : normalized;
  }
  return result;
}

const defaults = { retry: 3, verbose: false, tag: 'default' };
console.log('默认配置：', defaults);
console.log('合并 { retry: 0 }         →', mergeConfig(defaults, { retry: 0 }), '← 0 被保留');
console.log('合并 { verbose: true }    →', mergeConfig(defaults, { verbose: true }));
console.log("合并 { tag: '' }          →", mergeConfig(defaults, { tag: '' }), '← 空串被跳过');
console.log('合并 { retry: null }      →', mergeConfig(defaults, { retry: null }));

console.log('--- 完成：真值与假值全清单 ---');
