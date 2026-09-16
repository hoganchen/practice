/**
 * ============================================================================
 * 知识点：空值合并运算符 ?? —— 与 || 的区别及不可混用规则
 * ============================================================================
 *
 * 【所属分类】04_operators —— 运算符与表达式
 * 【难度等级】进阶
 * 【前置知识】04_operators/04_logical.js
 *
 * 【也见】09_objects/15_optional_chaining_object.js —— 对象视角下也完整讲了 ?? 与 ?. 的搭配。
 *        本文件是 ?? 运算符的主场（专文）；那篇侧重深层属性访问的工程场景。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ??（Nullish Coalescing Operator，空值合并运算符）是 ES2020 新增的运算符：
 *      a ?? b
 *    语义：只有当 a 是 null 或 undefined 时，才取 b；否则一律取 a。
 *    这里的"空值"专指 null 与 undefined 两个值，因此叫 nullish（空值）。
 *
 * 2. 为什么需要
 *    || 把"假值"全都当成需要兜底的情况，但 0、''、false、NaN
 *    在很多业务里都是**合法且有意义**的数据：
 *      - 商品折扣为 0 折（免费）
 *      - 数量为 0
 *      - 开关被显式设为 false
 *      - 用户昵称被显式设为空字符串
 *    这些场景下用 || 会导致数据被悄悄替换成默认值，是真实项目里的高频 bug。
 *    ?? 只认 null / undefined，正好表达"真的没有值"这一语义。
 *
 * 3. 核心语法要点
 *    - a ?? b 的求值规则：a 不是 null/undefined => 返回 a（且不对 b 求值，同样短路）；
 *      a 是 null/undefined => 返回 b。
 *    - ?? 与 || 一样，返回的是"操作数本身"，不是布尔值：
 *        null ?? 'x'  => 'x'，而 0 ?? 'x' => 0（0 被保留）。
 *    - 优先级：?? 比 || 和 && 低，比三元运算符 ?: 高。
 *    - 可与可选链 ?. 自由组合，这是最实用的搭配：obj?.a ?? 'default'。
 *    - 可配合 ??= 使用（见 02_assignment.js）：a ??= b。
 *
 * 4. 常见陷阱
 *    - 【语法限制】?? 不能与 && 或 || 直接混用而不加括号，否则是 SyntaxError。
 *      这是规范故意设计的：因为 ?? 与 || 混用几乎总是写错，索性禁止你写出歧义代码。
 *      解决办法就是加括号：(a || b) ?? c。
 *    - ?? 不会处理 NaN：NaN ?? 0 得到 NaN，如果要去掉 NaN 要先单独判断。
 *    - ?? 只判断 null/undefined，不判断"空数组""空对象"，[] ?? [] 得到的是左边那个空数组。
 *    - 别把它当成"|| 的升级版"无脑替换：如果业务语义是"假值就兜底"，|| 才是对的。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 04_operators/05_nullish_coalescing.js
 *
 * 【预期输出】
 *   依次打印 ?? 的基础行为、?? 与 || 在 0 / '' / false / NaN 上的差异对照表、
 *   混用导致 SyntaxError 的捕获演示，以及默认值配置合并的实战示例。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. ?? 的基础行为
// ---------------------------------------------------------------------------

console.log('--- 1. ?? 基础行为 ---');

// 只有 null / undefined 会触发右侧兜底
console.log('null ?? "默认" =', null ?? '默认'); // '默认'
console.log('undefined ?? "默认" =', undefined ?? '默认'); // '默认'

// 其余一切值（包括所有假值）都原样返回
console.log('0 ?? "默认" =', 0 ?? '默认'); // 0
console.log("'' ?? '默认' =", '' ?? '默认'); // ''
console.log('false ?? "默认" =', false ?? '默认'); // false
console.log('NaN ?? "默认" =', NaN ?? '默认'); // NaN
console.log("'有值' ?? '默认' =", '有值' ?? '默认'); // '有值'

// 与 && / || 一样，?? 也短路：左边不是 null/undefined 时右边不求值
function noisy(label, value) {
  console.log(`    >>> 右侧 "${label}" 被求值了`);
  return value;
}
console.log('执行：0 ?? noisy(...)');
console.log('  结果 =', 0 ?? noisy('右A', '不会出现')); // 0，且不会打印“被求值”
console.log('执行：null ?? noisy(...)');
console.log('  结果 =', null ?? noisy('右B', '兜底值')); // '兜底值'，会打印

// ---------------------------------------------------------------------------
// 2. 核心对比：?? 与 || 的差异对照表
// ---------------------------------------------------------------------------

console.log('\n--- 2. ?? 与 || 的差异对照 ---');

const samples = [
  ['null', null],
  ['undefined', undefined],
  ['0', 0],
  ["''", ''],
  ['false', false],
  ['NaN', NaN],
  ["'文本'", '文本'],
  ['[]', []],
];

// 用 console.table 打印一张对照表，一眼看出两者区别
const table = samples.map(([name, value]) => ({
  值: name,
  'value || "默认"': String(value || '默认'),
  'value ?? "默认"': String(value ?? '默认'),
  是否一致: String(value || '默认') === String(value ?? '默认') ? '一致' : '★ 不同',
}));
console.table(table);

// 结论：只要值可能是 0 / '' / false / NaN，就必须用 ?? 而不是 ||

// ---------------------------------------------------------------------------
// 3. 真实业务场景对比
// ---------------------------------------------------------------------------

console.log('--- 3. 业务场景对比 ---');

// 场景 A：商品折扣，0 表示"免费"，是有效数据
const product = { name: '键盘', discount: 0 };
console.log('用 || 取折扣：', product.discount || 0.9, '← 0 被错误地替换成了 0.9'); // 0.9
console.log('用 ?? 取折扣：', product.discount ?? 0.9, '← 0 被正确保留'); // 0

// 场景 B：分页参数，pageSize 允许为 0（表示"不分页，全取"）
const query = { pageSize: 0 };
console.log('用 || 取值：', query.pageSize || 20); // 20（错的）
console.log('用 ?? 取值：', query.pageSize ?? 20); // 0（对的）

// 场景 C：开关显式设置为 false，不应该被默认值覆盖
const settings = { autoSave: false };
console.log('用 || 取值：', settings.autoSave || true, '← 用户关掉的开关又被打开了'); // true
console.log('用 ?? 取值：', settings.autoSave ?? true, '← 尊重用户的 false'); // false

// 场景 D：反过来，如果语义是"空字符串也算没填"，那 || 才是正确的
const formInput = { realName: '' };
console.log('语义为"空字符串也算没填"时用 ||：', formInput.realName || '未填写'); // '未填写'
console.log('语义为"空字符串也算没填"时用 ??：', formInput.realName ?? '未填写'); // ''（不符合需求）

// ---------------------------------------------------------------------------
// 4. 陷阱：?? 不能与 && / || 无括号混用
// ---------------------------------------------------------------------------

console.log('\n--- 4. 陷阱：?? 不能与 && || 混用 ---');

// 规范规定：?? 与 || / && 直接相邻时必须加括号，否则解析阶段就报 SyntaxError。
// 这是故意设计的，因为混用时"先算谁"几乎没人能记住，索性禁止。
// 下面用 new Function 在运行期构造并捕获这个语法错误，避免整个文件无法运行。
const illegalSnippets = [
  'return null || undefined ?? "x";',
  'return null ?? undefined || "x";',
  'return true && null ?? "x";',
];

for (const code of illegalSnippets) {
  try {
    new Function(code);
    console.log('没有报错（不会执行到这里）：', code);
  } catch (err) {
    console.log('语法错误 =>', err.constructor.name, '|', code);
    console.log('    信息：', err.message.split('\n')[0]);
  }
}

// 正确做法：用括号明确指定结合顺序
console.log('加括号后合法：(null || undefined) ?? "x" =', (null || undefined) ?? 'x'); // 'x'
console.log('加括号后合法：null ?? (undefined || "x") =', null ?? (undefined || 'x')); // 'x'
console.log('加括号后合法：(true && null) ?? "x" =', (true && null) ?? 'x'); // 'x'

// ---------------------------------------------------------------------------
// 5. 实战：安全的配置合并
// ---------------------------------------------------------------------------

console.log('\n--- 5. 实战：配置合并 ---');

const DEFAULT_CONFIG = {
  host: '0.0.0.0',
  port: 3000,
  retries: 3,
  verbose: false,
  tags: null,
};

function resolveConfig(userConfig = {}) {
  // 对每个字段用 ?? 取"显式传入的值"，没传才用默认值
  return {
    host: userConfig.host ?? DEFAULT_CONFIG.host,
    port: userConfig.port ?? DEFAULT_CONFIG.port,
    retries: userConfig.retries ?? DEFAULT_CONFIG.retries,
    verbose: userConfig.verbose ?? DEFAULT_CONFIG.verbose,
    tags: userConfig.tags ?? ['默认标签'],
  };
}

// 用户显式传入 port: 0 和 verbose: false，都应被尊重
const userA = { port: 0, verbose: false };
console.log('用户传入 { port: 0, verbose: false }：');
console.log('  解析结果 =', resolveConfig(userA));

// 用户什么都没传，全部走默认值
console.log('用户传入 {}：');
console.log('  解析结果 =', resolveConfig({}));

// 对比：如果这里错用 || ，port: 0 会被改成 3000，verbose: false 会被改成 false（恰好一样，
// 但如果默认值是 true 就会出错），这就是 ?? 存在的意义。
function resolveConfigBadOr(userConfig = {}) {
  return {
    port: userConfig.port || DEFAULT_CONFIG.port, // 错误示范
  };
}
console.log("若错误地用 || ：resolveConfigBadOr({ port: 0 }).port =", resolveConfigBadOr({ port: 0 }).port); // 3000

// 与可选链组合：哪怕 userConfig 本身是 null 也不会抛错
function resolveConfigSafe(userConfig) {
  return {
    port: userConfig?.port ?? DEFAULT_CONFIG.port,
    host: userConfig?.host ?? DEFAULT_CONFIG.host,
  };
}
console.log('传入 null 也不会报错：', resolveConfigSafe(null)); // { port: 3000, host: '0.0.0.0' }

console.log('\n全部演示结束。');
