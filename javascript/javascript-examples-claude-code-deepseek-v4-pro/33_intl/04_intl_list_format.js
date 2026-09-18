/**
 * ============================================================================
 * 知识点：Intl.ListFormat —— 本地化的列表连接（"张三、李四和王五"）
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】入门
 * 【前置知识】33_intl/01_intl_overview.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Intl.ListFormat 把"一个字符串数组"按目标语言的书写习惯连成一句话。
 *    它解决的是"枚举列表里的连词和分隔符怎么写"这个问题：
 *      中文：张三、李四和王五        并列用"、"分隔，最后一项前用"和"
 *      英语：Alice, Bob, and Carol   逗号 + 最后一项前 and（注意牛津逗号）
 *      德语：Alice, Bob und Carol    同样有逗号，连词是 und
 *      阿拉伯语：أ و ب و ج             每个元素之间都插"و"，没有逗号
 *      日语：A、B、C                   直接用顿号，不加"と"
 *    两种语义类型：
 *      conjunction（合取，"和"）—— "参与人有 A、B 和 C"
 *      disjunction（析取，"或"）—— "请选择 A、B 或 C"
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 拼提示语："请填写 姓名、邮箱和手机号"。手写 `names.join('、')` 会漏掉
 *        最后的连词，而且换语言就崩（英文要 "name, email, and phone"）。
 *    (2) 生成自然语言摘要："张三、李四和王五 3 人已完成审批"。
 *    (3) 表单校验文案：必填项列表、互斥选项列表。
 *    (4) 无障碍（a11y）朗读：屏幕阅读器依赖正确的连词来断句，
 *        "A, B, C" 会被读成三个独立项，而 "A, B and C" 会被读成一个整体。
 *    (5) 中文里"、"是顿号不是逗号，两者语义不同（顿号表并列，逗号表分句），
 *        手写 join(',') 在中文排版上是错的。
 *
 * 3. 核心语法要点
 *    (1) new Intl.ListFormat(locales, { type, style })。
 *        type：'conjunction'（默认）| 'disjunction'
 *        style：'long'（默认）| 'short' | 'narrow'
 *    (2) lf.format(iterable) —— 接收**可迭代对象**（数组、Set、生成器都能用），
 *        元素**必须是字符串**，否则抛 TypeError。
 *    (3) lf.formatToParts(iterable) —— 返回分量数组，
 *        type 是 'element'（原元素）或 'literal'（分隔符/连词）。
 *    (4) lf.resolvedOptions() —— 查看实际生效的 type/style/locale。
 *    (5) 没有 formatRange；也不提供"解析"，只能格式化。
 *
 * 4. 常见陷阱
 *    (1) 手写 join('、') 或 join(', ') + ' and '：短列表碰巧对，长列表必错，
 *        换语言更是全错。列表连接**只有** Intl.ListFormat 是对的。
 *    (2) 元素必须是字符串：传数字/null/undefined 会抛
 *        TypeError: Iterable yielded 1 which is not a string。
 *        数字要先经 Intl.NumberFormat 格式化再传进去。
 *    (3) 别用它拼接"机器要解析"的内容（如 CSV、查询参数、URL），
 *        因为连词和标点会被本地化，解析端拿到的格式不确定。
 *    (4) style 的差异很反直觉：中文 narrow 直接去掉"和"，英文 short 用 "&"。
 *        不要假设 narrow 只是"更短的 long"。
 *    (5) 空数组返回空串，不会报错；单元素返回元素本身。
 *        拼句子时要注意"列表为空"时整句话要不要省略，这得你自己判断。
 *    (6) 列表元素的顺序是文化相关的，Intl 不会帮你排序 ——
 *        需要排序请配合 33_intl/02_intl_collator.js。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 33_intl/04_intl_list_format.js
 *
 * 【预期输出】
 *   分 8 个小节：两种 type 的基础对比、三种 style、多语言对照表、
 *   边界情况、formatToParts、两个真实场景（审批摘要 + 表单单选提示）、陷阱演示。
 *   全部显式传 locale，输出固定。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 统一数据
// ---------------------------------------------------------------------------

// 人名列表：中文名 + 拉丁名混排，用来同时观察分隔符与连词。
const PEOPLE = ['张三', '李四', '王五'];
// 颜色：用于 disjunction（"请选择红、绿或蓝"）。
const COLORS = ['红色', '绿色', '蓝色'];

console.log('--- 1. conjunction vs disjunction ---');

// conjunction = "和"，用于并列陈述
const zhAnd = new Intl.ListFormat('zh-CN', { type: 'conjunction', style: 'long' });
// disjunction = "或"，用于"任选其一"的场景
const zhOr = new Intl.ListFormat('zh-CN', { type: 'disjunction', style: 'long' });
console.log('conjunction（和）: ' + zhAnd.format(PEOPLE));
console.log('disjunction（或）: ' + zhOr.format(COLORS));
console.log('区别只在最后一项前的那个连词："和"表示"全部都要/都成立"，"或"表示"任选一个"。');

console.log('\n--- 2. style：long / short / narrow ---');

// 三种 style 让同一份数据在"空间紧张"和"空间充裕"的场合都有合适写法。
const styles = ['long', 'short', 'narrow'];
console.log('中文：');
for (const style of styles) {
  console.log(`  ${style.padEnd(7)} conjunction -> ${new Intl.ListFormat('zh-CN', { type: 'conjunction', style }).format(PEOPLE)}`);
}
console.log('中文（disjunction）：');
for (const style of styles) {
  console.log(`  ${style.padEnd(7)} disjunction -> ${new Intl.ListFormat('zh-CN', { type: 'disjunction', style }).format(COLORS)}`);
}
console.log('  （中文 disjunction 的三个 style 输出完全相同：CLDR 认为"或"没有简写形式）');

console.log('\n英文（差异更明显）：');
for (const style of styles) {
  console.log(`  ${style.padEnd(7)} conjunction -> ${new Intl.ListFormat('en-US', { type: 'conjunction', style }).format(['Alice', 'Bob', 'Carol'])}`);
}
for (const style of styles) {
  console.log(`  ${style.padEnd(7)} disjunction -> ${new Intl.ListFormat('en-US', { type: 'disjunction', style }).format(['red', 'green', 'blue'])}`);
}
console.log('注意 en-US 的 short 用 "&" 而不是 "and"，narrow 则只留逗号；');
console.log('中文的 narrow 是直接去掉"和"两个字 —— 所以 narrow 不等于"简写"，它就是"最省字"。');

// ---------------------------------------------------------------------------
// 3. 多语言对照表
// ---------------------------------------------------------------------------

console.log('\n--- 3. 多语言对照（同一份数据）---');

const TAGS = [
  ['zh-CN', '中文', '顿号 + 和'],
  ['ja-JP', '日语', '顿号，无连词'],
  ['ko-KR', '韩语', '逗号 + 및'],
  ['en-US', '英语', '逗号 + and（牛津逗号）'],
  ['de-DE', '德语', '逗号 + und'],
  ['fr-FR', '法语', '逗号 + et'],
  ['es-ES', '西班牙语', '逗号 + y'],
  ['ru-RU', '俄语', '逗号 + и'],
  ['ar-EG', '阿拉伯语', '每个元素间都插 و（从右往左书写）'],
];

console.table(
  TAGS.map(([tag, name, rule]) => ({
    locale: tag,
    语言: name,
    'conjunction（和）': new Intl.ListFormat(tag, { type: 'conjunction', style: 'long' }).format(PEOPLE),
    规则: rule,
  })),
);

console.log('\ndisjunction（或）对照：');
for (const [tag, name] of TAGS) {
  console.log(`  ${tag.padEnd(7)} ${name.padEnd(5)} -> ${new Intl.ListFormat(tag, { type: 'disjunction', style: 'long' }).format(COLORS)}`);
}

console.log('\n两个关键差异点：');
console.log('  1. 中文/日语用顿号"、"（占一个全角位，语义是并列），');
console.log('     西文用逗号加空格 ", "（半个字符宽 + 空格）。手写 join(",") 在中文里是排版错误。');
console.log('  2. 阿拉伯语每个元素之间都插连词"و"，三项就有两个 و，');
console.log('     这与"只在最后一项前加连词"的中英文习惯完全不同 —— 不可能靠手写规则覆盖。');

// ---------------------------------------------------------------------------
// 4. 边界情况：空、单元素、两元素
// ---------------------------------------------------------------------------

console.log('\n--- 4. 边界情况 ---');

const edgeCases = [[], ['张三'], ['张三', '李四'], ['张三', '李四', '王五']];
for (const arr of edgeCases) {
  const text = zhAnd.format(arr);
  console.log(`  ${JSON.stringify(arr).padEnd(34)} 长度 ${String(arr.length)} -> ${JSON.stringify(text)}`);
}
console.log('\n英文对照：');
for (const arr of edgeCases) {
  console.log(`  ${JSON.stringify(arr).padEnd(34)} -> ${JSON.stringify(new Intl.ListFormat('en-US').format(arr))}`);
}
console.log('\n规律：');
console.log('  0 个元素 -> 空字符串（不报错，但要自己决定整句话怎么处理）');
console.log('  1 个元素 -> 原样返回（连词消失）');
console.log('  2 个元素 -> 只有连词，没有分隔符（"张三和李四" / "Alice and Bob"）');
console.log('  3 个及以上 -> 分隔符 + 连词（"张三、李四和王五"）');
console.log('注意：两元素时英文不加逗号（"Alice and Bob"），这就是牛津逗号的边界，手写极易出错。');

// ---------------------------------------------------------------------------
// 5. formatToParts：拿回分量
// ---------------------------------------------------------------------------

console.log('\n--- 5. formatToParts()：把结果拆成分量 ---');

const parts = zhAnd.formatToParts(PEOPLE);
console.log('zh-CN 三元素的 formatToParts：');
for (const p of parts) {
  console.log(`  type=${p.type.padEnd(8)} value=${JSON.stringify(p.value)}`);
}

const partsEn = new Intl.ListFormat('en-US', { style: 'short' }).formatToParts(['A', 'B', 'C']);
console.log('\nen-US(short) 的 formatToParts：');
for (const p of partsEn) {
  console.log(`  type=${p.type.padEnd(8)} value=${JSON.stringify(p.value)}`);
}
console.log('可见 en-US short 的连词是 ", & "（逗号 + 空格 + & + 空格），narrow 时它变成一个纯逗号。');

// 实战：把 element 包成 <b>，literal 保持原样 —— 做富文本渲染时非常有用。
console.log('\n用 formatToParts 做富文本渲染（只给元素加粗）：');
const rich = zhAnd
  .formatToParts(PEOPLE)
  .map((p) => (p.type === 'element' ? `**${p.value}**` : p.value))
  .join('');
console.log('  ' + rich);
console.log('  如果只写 lf.format()，你要再写正则去切分，既费劲又容易切错。');

// ---------------------------------------------------------------------------
// 6. 真实场景一：审批摘要
// ---------------------------------------------------------------------------

console.log('\n--- 6. 真实场景：生成审批摘要 ---');

/**
 * 把"谁完成了什么"渲染成一句本地化的话。
 * @param {string[]} names 参与者姓名
 * @param {string} locale BCP 47 标签
 * @returns {string}
 */
function approvalSummary(names, locale) {
  const lf = new Intl.ListFormat(locale, { type: 'conjunction', style: 'long' });
  // 人数本身也要走 PluralRules 决定词形（英文 1 person / 3 people）。
  const pr = new Intl.PluralRules(locale);
  const nf = new Intl.NumberFormat(locale);
  const forms = {
    'zh-CN': { other: '{list} 共 {n} 人已完成审批' },
    'en-US': { one: '{list} has approved ({n} person)', other: '{list} have approved ({n} people)' },
    'de-DE': { one: '{list} hat freigegeben ({n} Person)', other: '{list} haben freigegeben ({n} Personen)' },
  };
  const table = forms[locale];
  const template = table[pr.select(names.length)] ?? table.other;
  return template.replace('{list}', lf.format(names)).replace('{n}', nf.format(names.length));
}

const APPROVERS = ['张三', '李四', '王五'];
for (const locale of ['zh-CN', 'en-US', 'de-DE']) {
  console.log(`  ${locale.padEnd(6)} -> ${approvalSummary(APPROVERS, locale)}`);
}
console.log('\n单人 vs 多人的对比（英文会把 has/have、person/people 一起换掉）：');
for (const locale of ['zh-CN', 'en-US', 'de-DE']) {
  console.log(`  ${locale.padEnd(6)} 1 人 -> ${approvalSummary(['张三'], locale)}`);
  console.log(`  ${locale.padEnd(6)} 2 人 -> ${approvalSummary(['张三', '李四'], locale)}`);
}

// ---------------------------------------------------------------------------
// 7. 真实场景二：表单校验提示（disjunction）
// ---------------------------------------------------------------------------

console.log('\n--- 7. 真实场景：表单校验提示 ---');

/**
 * 把"缺失的必填项"渲染成用户能读的提示语。
 * @param {Array<{ key: string, labels: Record<string, string> }>} missing 缺失项
 * @param {string} locale BCP 47 标签
 * @returns {string}
 */
function missingFieldsHint(missing, locale) {
  // 取出该语言下的字段名，按 locale 排序（列表顺序也是文化的一部分）。
  const labels = missing.map((m) => m.labels[locale] ?? m.key).sort(new Intl.Collator(locale).compare);
  const lf = new Intl.ListFormat(locale, { type: 'disjunction', style: 'long' });
  const prefix = { 'zh-CN': '请填写：', 'en-US': 'Please fill in: ', 'ja-JP': '入力してください：' }[locale];
  return prefix + lf.format(labels);
}

const MISSING = [
  { key: 'name', labels: { 'zh-CN': '姓名', 'en-US': 'name', 'ja-JP': '氏名' } },
  { key: 'email', labels: { 'zh-CN': '邮箱', 'en-US': 'email', 'ja-JP': 'メール' } },
  { key: 'phone', labels: { 'zh-CN': '手机号', 'en-US': 'phone', 'ja-JP': '電話番号' } },
];
for (const locale of ['zh-CN', 'en-US', 'ja-JP']) {
  console.log(`  ${locale.padEnd(6)} -> ${missingFieldsHint(MISSING, locale)}`);
}
console.log('\n注意这里用的是 disjunction（"或"）：因为用户只要补齐其中任意一项即可提交，');
console.log('如果写成 conjunction（"和"），语义就变成了"必须同时补充"，是产品事故。');

// ---------------------------------------------------------------------------
// 8. 陷阱演示
// ---------------------------------------------------------------------------

console.log('\n--- 8. 陷阱 ---');

console.log('陷阱一：元素必须是字符串');
const mixed = ['张三', 42];
try {
  zhAnd.format(mixed);
} catch (err) {
  console.log('  format(["张三", 42]) ->', err.constructor.name + ':', err.message);
}
// 正确做法：先把数字交给 NumberFormat 本地化，再转成字符串。
const fixed = mixed.map((x) => (typeof x === 'string' ? x : new Intl.NumberFormat('zh-CN').format(x)));
console.log('  修正后（数字先经 NumberFormat 本地化）->', zhAnd.format(fixed));
console.log('  若传 1234567，正确的输出是 "123万" 还是 "1,234,567" 取决于 NumberFormat 的配置，');
console.log('  Intl.ListFormat **不做**任何元素级格式化，它只负责拼接。');

console.log('\n陷阱二：手写拼接在长列表上必错');
const naive = (arr) => arr.join('、') + '和'; // 典型错误写法
console.log('  ❌ 手写 join("、") + "和" ->', naive(PEOPLE.slice(0, 2)));
console.log('  ✅ Intl.ListFormat        ->', zhAnd.format(PEOPLE.slice(0, 2)));
console.log('  两元素时手写会多出一个分隔符，三元素时又会漏掉最后一项前的分隔符：');
console.log('  ❌ 三元素手写 ->', PEOPLE.join('、') + '和');
console.log('  ✅ 三元素 Intl ->', zhAnd.format(PEOPLE));

console.log('\n陷阱三：不要用本地化列表做机器可解析的数据');
console.log('  URL 查询串 join(",") -> "a,b,c"（稳定，可解析）');
console.log('  Intl.ListFormat zh   ->', JSON.stringify(zhAnd.format(['a', 'b', 'c'])), '（含顿号与"和"，解析端无法可靠切分）');
console.log('  规则：给人看的用 Intl.ListFormat；给程序看的用 JSON / 逗号分隔固定格式。');

console.log('\n陷阱四：非法选项抛 RangeError');
for (const opts of [{ type: 'xxx' }, { style: 'xxx' }]) {
  try {
    new Intl.ListFormat('zh-CN', opts);
  } catch (err) {
    console.log(`  new Intl.ListFormat('zh-CN', ${JSON.stringify(opts)}) ->`, err.constructor.name + ':', err.message);
  }
}

console.log('\n陷阱五：接受任意可迭代对象，不只是数组');
console.log('  Set     ->', new Intl.ListFormat('zh-CN').format(new Set(['甲', '乙', '丙'])));
console.log('  生成器  ->', new Intl.ListFormat('zh-CN').format((function* () { yield '甲'; yield '乙'; })()));
console.log('  这意味着可以惰性生成大列表，但注意生成器只能消费一次。');

console.log('\n本节结束。');
