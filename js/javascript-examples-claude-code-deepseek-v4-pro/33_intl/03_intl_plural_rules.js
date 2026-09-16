/**
 * ============================================================================
 * 知识点：Intl.PluralRules —— 复数类别、范围复数与序数词
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】进阶
 * 【前置知识】33_intl/01_intl_overview.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Intl.PluralRules 回答一个问题：**"给定一个数字，它在某种语言里属于哪个复数类别？"**
 *    复数类别是 CLDR 定义的一组标签：
 *      zero（零） one（单数） two（双数） few（少数） many（多数） other（其他）
 *    每种语言用到的类别集合不同：英语只有 one/other，俄语有 one/few/many/other，
 *    阿拉伯语六种全有（含 two 双数），中文、日语、韩语**只有 other**。
 *    Intl.PluralRules 只负责"选类别"，**不负责给出文案** —— 文案要你自己维护。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 最经典的文案事故：英文界面显示 "1 items"、"3 item"。
 *        正确做法不是 `n === 1 ? 'item' : 'items'`，而是把文案表按类别索引，
 *        让 Intl.PluralRules 决定用哪一条 —— 因为规则因语言而异，
 *        硬编码的 `n === 1` 只在英语里碰巧成立。
 *    (2) 俄语：1 товар / 2 товара / 5 товаров，三套词形；
 *        `n > 1` 这种朴素判断在俄语里必错（21 用单数，22 用 few）。
 *    (3) 阿拉伯语：0 用 zero 形式，1 用 one，2 有专门的双数形式 two。
 *    (4) 序数词：英文 1st / 2nd / 3rd / 4th / 11th / 21st，
 *        type: 'ordinal' 就是为它准备的。
 *    (5) 范围文案："1–2 items" 该怎么措辞？用 selectRange()。
 *
 * 3. 核心语法要点
 *    (1) new Intl.PluralRules(locales, { type })。
 *        type: 'cardinal'（默认，基数词"1 个/3 个"）| 'ordinal'（序数词"第 1 个"）。
 *    (2) pr.select(number) -> 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'。
 *    (3) pr.selectRange(start, end) -> 整个范围该用哪个类别。
 *    (4) pr.resolvedOptions().pluralCategories -> 该语言用到的类别数组。
 *    (5) 四个常用的 options：minimumFractionDigits / maximumFractionDigits
 *        （参与判断的小数位）、minimumIntegerDigits、minimumSignificantDigits。
 *        例如 en-US 下 1 是 one，但把 minimumFractionDigits 设为 1 后
 *        "1.0" 就变成 other（因为可见数字变了）。
 *    (6) **没有 format 方法**：它只做判断，渲染文案是你的工作。
 *
 * 4. 常见陷阱
 *    (1) 用 `n === 1` 代替复数规则 —— 只能骗过英语，到了俄语/阿拉伯语/波兰语全错。
 *    (2) 中文只有一个类别，就以为"用不上 PluralRules"。
 *        正确姿势是让所有文案都走同一条管线，将来加语言时无需改代码。
 *    (3) 拿浮点数直接判断：en-US 下 1.0 是 'one'，1.5 是 'other'；
 *        而法语里 0 和 1.5 都算 'one'（法语 0 和 1 同形）。务必用真实数字测。
 *    (4) 文案表缺 key：某语言有 many 类别而你的表里只有 one/other，
 *        运行时会取到 undefined。要准备兜底回退到 other。
 *    (5) PluralRules 的 locale 必须与展示数字的 Intl.NumberFormat 的 locale 一致，
 *        否则会出现"英文措辞配德语数字"的缝合怪。
 *    (6) selectRange 的结果不一定等于两端 select 的结果
 *        （en-US 里 select(1) 是 one，但 selectRange(1,1) 是 other）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 33_intl/03_intl_plural_rules.js
 *
 * 【预期输出】
 *   分 8 个小节：类别总览表、select 数值实测、五语言文案对照、
 *   序数词、范围复数、小数与 options 的影响、以及一个可直接复用的
 *   "按 locale 渲染数量文案"的工具函数。全部显式传 locale，输出固定。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 各语言用到的复数类别
// ---------------------------------------------------------------------------

console.log('--- 1. 各语言的复数类别集合 ---');

// 挑几个有代表性的语言，覆盖"最简单"到"最复杂"。
const LOCALES = [
  ['zh-CN', '中文', '只有 other：完全没有复数变化'],
  ['ja-JP', '日语', '只有 other：和中文一样'],
  ['ko-KR', '韩语', '只有 other'],
  ['en-US', '英语', 'one / other：最常被当成"通用规则"的那个'],
  ['de-DE', '德语', 'one / other，与英语同构'],
  ['fr-FR', '法语', 'one / many / other：0 和 1.5 都算 one，百万级算 many'],
  ['ru-RU', '俄语', 'one / few / many / other：三套词形'],
  ['pl-PL', '波兰语', 'one / few / many / other'],
  ['cs-CZ', '捷克语', 'one / few / many / other（且小数会落到 many）'],
  ['ar-EG', '阿拉伯语', '六种全有：zero / one / two / few / many / other'],
];

console.table(
  LOCALES.map(([tag, name, note]) => ({
    locale: tag,
    语言: name,
    复数类别: new Intl.PluralRules(tag).resolvedOptions().pluralCategories.join(' / '),
    类别数: new Intl.PluralRules(tag).resolvedOptions().pluralCategories.length,
    说明: note,
  })),
);

console.log('结论：只有 other 的语言（中文/日语/韩语）不需要区分词形，');
console.log('      但这不代表代码可以省掉这一层 —— 见第 3 节的理由。');

// ---------------------------------------------------------------------------
// 2. select()：数字 -> 类别
// ---------------------------------------------------------------------------

console.log('\n--- 2. select() 实测：同一个数字，各国归类不同 ---');

const NUMBERS = [0, 1, 2, 3, 5, 10, 11, 21, 22, 25, 100, 101, 1.5];
const TAGS = ['en-US', 'zh-CN', 'ru-RU', 'ar-EG', 'fr-FR', 'cs-CZ'];

// 表头手动补足宽度：中文宽度不能靠 padEnd 精确对齐，这里用等宽 ASCII 表头。
console.log('n'.padEnd(8) + TAGS.map((t) => t.padEnd(8)).join(''));
for (const n of NUMBERS) {
  const cells = TAGS.map((t) => new Intl.PluralRules(t).select(n).padEnd(8)).join('');
  console.log(String(n).padEnd(8) + cells);
}

console.log('\n几个值得记住的点：');
const ru = new Intl.PluralRules('ru-RU');
const ar = new Intl.PluralRules('ar-EG');
const fr = new Intl.PluralRules('fr-FR');
const en = new Intl.PluralRules('en-US');
const cs = new Intl.PluralRules('cs-CZ');
console.log('  俄语 1 ->', ru.select(1), '；2 ->', ru.select(2), '；5 ->', ru.select(5), '；21 ->', ru.select(21), '（21 又回到单数！）');
console.log('  俄语 11 ->', ru.select(11), '（11 属于 many，所以 "11 товаров"）');
console.log('  阿拉伯语 0 ->', ar.select(0), '；1 ->', ar.select(1), '；2 ->', ar.select(2), '（双数 two）');
console.log('  法语 0 ->', fr.select(0), '（法语把 0 和 1 同等看待）；1.5 ->', fr.select(1.5), '；1000000 ->', fr.select(1000000));
console.log('  捷克语 1.5 ->', cs.select(1.5), '（小数落到 many，和英语完全不同）');
console.log('  英语 1.0 ->', en.select(1.0), '（JS 里 1.0 === 1，所以仍是 one）');

// ---------------------------------------------------------------------------
// 3. 真实场景：i18n 文案表 —— "1 item" vs "3 items"
// ---------------------------------------------------------------------------

console.log('\n--- 3. 真实场景：购物车文案 ---');

// 文案表按 locale -> 复数类别 组织。占位符 {n} 稍后替换成格式化后的数字。
const CART_MESSAGES = {
  'zh-CN': {
    // 中文没有复数变化，所有数量都用同一句。
    other: '购物车里有 {n} 件商品',
  },
  'en-US': {
    one: 'You have {n} item in your cart',
    other: 'You have {n} items in your cart',
  },
  'ru-RU': {
    one: 'В корзине {n} товар',
    few: 'В корзине {n} товара',
    many: 'В корзине {n} товаров',
    other: 'В корзине {n} товара',
  },
  'ar-EG': {
    zero: 'السلة فارغة',
    one: 'يوجد عنصر واحد في السلة',
    two: 'يوجد عنصران في السلة',
    few: 'يوجد {n} عناصر في السلة',
    many: 'يوجد {n} عنصرًا في السلة',
    other: 'يوجد {n} عنصر في السلة',
  },
};

/**
 * 按 locale 渲染"数量 + 文案"。
 * 关键点：先让 PluralRules 决定类别，再从文案表里取对应句子；
 * 缺 key 时回退到 other，再缺就抛错（提示翻译漏了）。
 * @param {number} count 数量
 * @param {string} locale BCP 47 标签
 * @param {Record<string, Record<string, string>>} messages 文案表
 * @returns {string}
 */
function renderCount(count, locale, messages) {
  const table = messages[locale];
  if (!table) throw new Error(`缺少 ${locale} 的文案表`);

  // 复数类别由 Intl 决定，而不是我们手写 if/else。
  const category = new Intl.PluralRules(locale).select(count);
  const template = table[category] ?? table.other;
  if (template === undefined) throw new Error(`${locale} 缺少类别 ${category} 且没有 other 兜底`);

  // 数字也要本地化：同一个 1234567，德语用点做千分位、法语用空格。
  const formatted = new Intl.NumberFormat(locale).format(count);
  return template.replaceAll('{n}', formatted);
}

console.log('同一个购物车，四种语言的措辞：');
for (const count of [0, 1, 2, 3, 5, 21, 100]) {
  console.log(`\n  count = ${String(count).padStart(3)}`);
  for (const locale of ['zh-CN', 'en-US', 'ru-RU', 'ar-EG']) {
    const category = new Intl.PluralRules(locale).select(count);
    console.log(`    ${locale.padEnd(6)} [${category.padEnd(5)}] -> ${renderCount(count, locale, CART_MESSAGES)}`);
  }
}
console.log('\n注意 count = 0 时阿拉伯语直接换成了"购物车是空的"，连数字都不出现 —— 这就是 zero 类别。');
console.log('而中文从 0 到 100 都是 other，一句话走天下，这正是中文的便利之处。');

console.log('\n反例对比（很多项目就是这么写的）：');
/**
 * 典型的错误写法：把英语规则当成"通用规则"。
 * @param {number} n 数量
 * @returns {string}
 */
function naiveEnglishOnly(n) {
  return `${n} ${n === 1 ? 'item' : 'items'}`;
}
for (const n of [1, 2, 21]) {
  console.log(`  naiveEnglishOnly(${n}) = "${naiveEnglishOnly(n)}"`);
}
console.log('  这套写法搬到俄语就是 "1 товаров"、"21 товара" —— 全是错词形。');
console.log('  正确做法就是上面 renderCount：把"判断"交给 Intl，把"文案"交给翻译。');

// ---------------------------------------------------------------------------
// 4. 序数词：type: 'ordinal'
// ---------------------------------------------------------------------------

console.log('\n--- 4. 序数词：type: "ordinal" ---');

const enOrdinal = new Intl.PluralRules('en-US', { type: 'ordinal' });
const zhOrdinal = new Intl.PluralRules('zh-CN', { type: 'ordinal' });

console.log('英语序数类别集合 =', JSON.stringify(enOrdinal.resolvedOptions().pluralCategories));
console.log('中文序数类别集合 =', JSON.stringify(zhOrdinal.resolvedOptions().pluralCategories));

// 英语序数的后缀映射表（CLDR 把 one/two/few 分别对应 st/nd/rd，其余 th）。
const ORDINAL_SUFFIX = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
console.log('\n英语序数词后缀：');
const ORDINAL_NUMBERS = [1, 2, 3, 4, 5, 11, 12, 13, 21, 22, 23, 101, 111];
for (const n of ORDINAL_NUMBERS) {
  const cat = enOrdinal.select(n);
  console.log(`  ${String(n).padStart(4)} -> 类别 ${cat.padEnd(6)} -> ${n}${ORDINAL_SUFFIX[cat]}`);
}
console.log('陷阱：11/12/13 是 other（11th/12th/13th），但 21/22/23 又回到 one/two/few（21st/22nd/23rd）。');
console.log('     这就是 `n % 10 === 1` 这类朴素写法的翻车点（11 会被误判成 1st）。');

console.log('\n中文序数词：');
console.log('  中文用"第 N 个"，没有词形变化，类别集合只有', JSON.stringify(zhOrdinal.resolvedOptions().pluralCategories));
console.log('  所以中文的序数实现就是 `第${n}个`，PluralRules 在中文里是"什么都不做"的保险。');

console.log('\n其他语言的序数类别（有的语言根本没有序数专用类别）：');
console.table(
  ['ru-RU', 'fr-FR', 'de-DE', 'zh-CN'].map((tag) => ({
    locale: tag,
    序数类别: new Intl.PluralRules(tag, { type: 'ordinal' }).resolvedOptions().pluralCategories.join(' / '),
  })),
);
console.log('俄语序数在这里只有 other，说明 CLDR 没有为俄语序数定义额外词形区分。');

// ---------------------------------------------------------------------------
// 5. selectRange：范围复数
// ---------------------------------------------------------------------------

console.log('\n--- 5. selectRange()：范围文案 ---');

const RANGES = [
  [1, 1],
  [1, 2],
  [2, 2],
  [1, 5],
  [2, 10],
  [0, 2],
  [5, 5],
  [21, 22],
];
console.log('范围'.padEnd(12) + TAGS.map((t) => t.padEnd(9)).join(''));
for (const [a, b] of RANGES) {
  const cells = TAGS.map((t) => new Intl.PluralRules(t).selectRange(a, b).padEnd(9)).join('');
  console.log(`${`${a}–${b}`.padEnd(12)}${cells}`);
}
console.log('\n值得注意的三点：');
console.log('  1. en-US 的 selectRange(1,1) =', new Intl.PluralRules('en-US').selectRange(1, 1), '，而 select(1) =', new Intl.PluralRules('en-US').select(1), '；');
console.log('     范围有它自己的规则表，不要用两端 select 的结果去推断。');
console.log('  2. 俄语 selectRange(1,2) =', ru.selectRange(1, 2), '，但 selectRange(1,5) =', ru.selectRange(1, 5), '（范围一跨就变成 many）。');
console.log('  3. 阿拉伯语 selectRange(0,2) =', ar.selectRange(0, 2), '，所以"0–2 件"用 zero 形式。');

console.log('\n实战用法：范围文案只需要一条模板：');
/**
 * 渲染"a–b 件"这样的范围文案（英文版）。
 * @param {number} a 起始
 * @param {number} b 结束
 * @returns {string}
 */
function renderRange(a, b) {
  const rules = new Intl.PluralRules('en-US');
  const category = rules.selectRange(a, b);
  const forms = { one: 'item', other: 'items' };
  const nums = new Intl.NumberFormat('en-US');
  // 两端相同时 formatRange 会输出 "~1"（近似号），这里特殊处理成单一数字更自然。
  const numberText = a === b ? nums.format(a) : nums.formatRange(a, b);
  return `${numberText} ${forms[category]}`;
}
for (const [a, b] of [[1, 1], [1, 2], [3, 10]]) {
  console.log(`  ${a}–${b} -> ${renderRange(a, b)}`);
}

// ---------------------------------------------------------------------------
// 6. options 对判断的影响
// ---------------------------------------------------------------------------

console.log('\n--- 6. options 会改变判断结果 ---');

console.log('同一个数字 1，因为"可见小数位"不同，类别就不同：');
const plain = new Intl.PluralRules('en-US');
const withFraction = new Intl.PluralRules('en-US', { minimumFractionDigits: 1 });
console.log('  默认              select(1) =', plain.select(1));
console.log('  minimumFractionDigits:1 select(1) =', withFraction.select(1), '（数字写成 "1.0"，于是变成 other）');
console.log('  这个选项要和 Intl.NumberFormat 的配置保持一致，否则会出现');
console.log('  "显示 1.0 item"（单数形式）这种不一致。');

console.log('\nminimumSignificantDigits 同理（它改变了"有效数字"的计数方式）：');
const sig = new Intl.PluralRules('en-US', { minimumSignificantDigits: 3 });
console.log('  默认                        select(1) =', plain.select(1));
console.log('  minimumSignificantDigits: 3 select(1) =', sig.select(1), '（有效数字变成 "1.00"，于是变成 other）');
console.log('\n反例（保持 one 的选项）：');
const padded = new Intl.PluralRules('en-US', { minimumIntegerDigits: 3 });
console.log('  minimumIntegerDigits: 3     select(1) =', padded.select(1), '（仍是 one）');
console.log('  原因：英语的 one 规则是 "i = 1 且 v = 0，或 n = 1"，n 表示数值本身，');
console.log('        补零只影响 i（整数位数）不影响 n，所以这条规则依然命中。');
console.log('  启示：不同选项影响的是不同的规则变量，必须实测，不能凭直觉推断。');

// ---------------------------------------------------------------------------
// 7. 陷阱汇总（代码化演示）
// ---------------------------------------------------------------------------

console.log('\n--- 7. 陷阱演示 ---');

console.log('陷阱一：文案表缺类别');
const brokenTable = { one: '{n} item', other: '{n} items' };
const count = 21;
const cat = ru.select(count);
console.log(`  俄语 count=${count} 的类别是 "${cat}"，而 brokenTable 里只有`, Object.keys(brokenTable));
const picked = brokenTable[cat] ?? brokenTable.other;
console.log(`  直接取 table["${cat}"] -> ${brokenTable[cat]}；用 ?? other 兜底 -> ${picked}`);
console.log('  兜底能避免抛错，但文案是错的（复数词形不对），所以兜底只该是最后一道保险。');

console.log('\n陷阱二：别按"语言"分组，要按"完整的 locale"分组');
const ptBR = new Intl.PluralRules('pt-BR');
const ptPT = new Intl.PluralRules('pt-PT');
console.log('  类别集合相同：pt-BR =', ptBR.resolvedOptions().pluralCategories.join('/'), '，pt-PT =', ptPT.resolvedOptions().pluralCategories.join('/'));
console.log('  但同一个数字归类不同：');
for (const n of [0, 1, 2, 1.5]) {
  const a = ptBR.select(n);
  const b = ptPT.select(n);
  console.log(`    n = ${String(n).padEnd(4)} pt-BR -> ${a.padEnd(6)} pt-PT -> ${b.padEnd(6)} ${a === b ? '' : '<-- 不同！'}`);
}
console.log('  巴西葡语把 0 和 1.5 当单数，欧洲葡语不当 —— 光看类别集合完全发现不了这个差异。');
console.log('  所以文案表的 key 要用 resolvedOptions().locale 这种完整标签，而不是 ' + "'pt'。");

console.log('\n陷阱三：PluralRules 不负责格式化文案，也不负责格式化数字');
console.log('  typeof new Intl.PluralRules("en-US").format =', typeof new Intl.PluralRules('en-US').format, '（不存在）');
console.log('  必须自己把 PluralRules（选词形）+ NumberFormat（排版数字）组合起来用。');

console.log('\n本节结束。');
