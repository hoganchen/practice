/**
 * ============================================================================
 * 知识点：Intl.Collator —— 本地化字符串比较与排序
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】进阶
 * 【前置知识】33_intl/01_intl_overview.js、08_arrays 中的 sort 用法
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Intl.Collator 是"按人类语言习惯比较两个字符串"的比较器。
 *    它把排序规则（collation）从 CLDR 数据里取出来，提供 compare(a, b) 方法：
 *    返回负数 / 0 / 正数，分别表示 a 排在 b 前面 / 相等 / 后面，
 *    正好可以直接丢给 Array.prototype.sort。还可用于二分查找与"高亮搜索"的匹配。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 通讯录 / 成员列表按姓名排序：中文要按拼音（阿、曹、李、欧阳…），
 *        而不是按 Unicode 码点（那样会排成"周、孙、张、曹…"，用户一眼就看出是 bug）。
 *    (2) 文件名、章节号、排行榜："第2名"要排在"第10名"前面。
 *    (3) 德语词典：ö 要当成 o 处理（甚至 ä 等同于 ae），ß 等同于 ss；
 *        而瑞典语里 ö 是排在 z 之后的独立字母。同一份代码，靠 locale 自动切换。
 *    (4) 搜索框的"近似匹配"：用户打 "strasse" 也能命中 "Straße"。
 *
 * 3. 核心语法要点
 *    (1) new Intl.Collator(locales, options)，核心方法是 collator.compare(a, b)。
 *    (2) collator.compare 是**绑定函数**，可直接写 arr.sort(collator.compare)。
 *    (3) 关键 options：
 *          usage        'sort'（默认，用于排序）| 'search'（用于查找匹配）
 *          sensitivity  'base' | 'accent' | 'case' | 'variant'（由粗到细）
 *          numeric      true 时把连续数字当数值比较（自然排序）
 *          caseFirst    'upper' | 'lower' | 'false'（仅当大小写可区分时生效）
 *          ignorePunctuation  true 时忽略标点与空格
 *          collation    指定排序变体，如 'pinyin' / 'stroke' / 'phonebk'
 *    (4) 快捷写法 str1.localeCompare(str2, locales, options) 等价，
 *        但每次调用都可能重建比较器；循环里请用缓存的 Collator 实例。
 *    (5) collator.resolvedOptions() 查看实际生效的规则。
 *
 * 4. 常见陷阱
 *    (1) 直接 arr.sort() 得到的是 **UTF-16 码元顺序**：大写字母全在小写字母前、
 *        'Z' 排在 'a' 之前、中文按码点乱序。这是最常见的中文排序事故。
 *    (2) a < b 运算符永远是码元比较，**不受 locale 影响**，不要拿它做本地化比较。
 *    (3) sensitivity 默认是 'variant'（最严格）—— 'a' 与 'A' 不相等。
 *        但 caseFirst 默认 'false' 时仍会得到小写优先的顺序，二者不是一回事。
 *    (4) numeric 只在**同一位置**把数字串当数值：'a1' 与 'a01' 会被视为相等，
 *        排序是稳定的，会保持原有相对顺序。
 *    (5) 不要对"已经 internationalize 过的 key"再排序：先 sort 好再格式化。
 *    (6) 排序大数据量时不要重复 new Collator（见第 9 节的实测）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 33_intl/02_intl_collator.js
 *
 * 【预期输出】
 *   分 9 个小节，用 console.table 与对齐表格对比"默认 sort / < 运算符 / Collator"
 *   在中文、德语、瑞典语、自然排序等场景下的差异，全部显式传 locale，输出固定。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 统一的样例数据
// ---------------------------------------------------------------------------

// 一组混排数据：中文姓名 + 拉丁姓名 + 带变音的字符，用来暴露各种排序差异。
const NAMES = ['张三', '李四', '王五', '欧阳修', '阿宝', '曹操', '赵六', '钱七', 'Alice', 'bob', 'Öko'];
// 一组"文件/章节"数据：用来演示自然排序。
const FILES = ['第10章', '第2章', '第1章', 'file10.txt', 'file2.txt', 'file1.txt', 'img12', 'img2'];

/**
 * 把排序结果拼成一行，便于并排对比。
 * @param {string[]} arr 结果数组
 * @param {string} [sep] 分隔符
 * @returns {string}
 */
function join(arr, sep = ' ') {
  return arr.join(sep);
}

/**
 * 按"终端显示宽度"右侧补空格。
 * String.prototype.padEnd 数的是 UTF-16 长度，一个汉字算 1，
 * 但终端里汉字占 2 列，直接用 padEnd 会导致中文表格错位。
 * 这里把全角字符按 2 列计算（覆盖 CJK、全角标点、常见 emoji 区段）。
 * @param {string} str 原始文本
 * @param {number} width 目标显示宽度
 * @returns {string}
 */
function padDisplay(str, width) {
  let w = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    const wide =
      (cp >= 0x1100 && cp <= 0x115f) || // 韩文字母
      (cp >= 0x2e80 && cp <= 0xa4cf) || // CJK 部首、汉字
      (cp >= 0xac00 && cp <= 0xd7a3) || // 韩文音节
      (cp >= 0xf900 && cp <= 0xfaff) || // CJK 兼容汉字
      (cp >= 0xfe30 && cp <= 0xfe6f) || // CJK 兼容形式
      (cp >= 0xff00 && cp <= 0xff60) || // 全角字符
      (cp >= 0x1f300 && cp <= 0x1faff); // emoji / 符号
    w += wide ? 2 : 1;
  }
  return str + ' '.repeat(Math.max(0, width - w));
}

// ---------------------------------------------------------------------------
// 1. 默认 sort() 的真相：UTF-16 码元顺序
// ---------------------------------------------------------------------------

console.log('--- 1. 默认 sort() 与 < 运算符：按 UTF-16 码元比较 ---');

console.log('默认 sort() 结果：');
console.log('  ' + join([...NAMES].sort()));
console.log('观察规律：Alice 在 bob 前（大写 A=65 < 小写 b=98），Öko 掉到了拉丁字母之后。');
console.log('中文部分更明显：' + join([...NAMES].filter((n) => /[一-龥]/.test(n)).sort()));
console.log('  -> 这是汉字在 Unicode 里的码点顺序（张 24352 < 曹 26361 < 李 26446 ...），');
console.log('     与读音毫无关系，中文用户完全无法理解，只看得出"排过了但排错了"。');

console.log('\n< 运算符同理，永远不看 locale：');
const pairs = [
  ['Z', 'a'],
  ['Ö', 'z'],
  ['第2名', '第10名'],
  ['2', '10'],
];
console.log('  ' + padDisplay('比较对', 22) + padDisplay('a < b（码元）', 16) + 'a < b（en-US Collator）');
for (const [a, b] of pairs) {
  const codeUnit = String(a < b);
  const collated = String(new Intl.Collator('en-US').compare(a, b) < 0);
  console.log('  ' + padDisplay(`${JSON.stringify(a)} vs ${JSON.stringify(b)}`, 22) + padDisplay(codeUnit, 16) + collated);
}
console.log('注意 "Z" vs "a"：码元说 Z 在前，英语习惯说 a 在前 —— 两种结论完全相反。');

// ---------------------------------------------------------------------------
// 2. Collator 基础用法
// ---------------------------------------------------------------------------

console.log('\n--- 2. Collator 基础：compare 就是一个排序函数 ---');

const zhCollator = new Intl.Collator('zh-CN');
console.log('compare("阿", "白") =', zhCollator.compare('阿', '白'), '（负数 => 阿 在前）');
console.log('compare("白", "阿") =', zhCollator.compare('白', '阿'), '（正数 => 白 在后）');
console.log('compare("阿", "阿") =', zhCollator.compare('阿', '阿'), '（0 => 视为相等）');

// compare 是绑定函数：可以直接传引用给 sort，不必包一层箭头函数。
console.log('compare 是绑定函数吗？', zhCollator.compare === zhCollator.compare, '（每次取到同一个函数，可安全解构）');
console.log('直接传引用排序：' + join([...NAMES].sort(zhCollator.compare)));

// resolvedOptions：看看实际用了什么规则。
console.log('resolvedOptions() =', JSON.stringify(zhCollator.resolvedOptions()));
console.log('  -> locale 是 zh-CN，collation 默认就是 pinyin（CLDR 对 zh 的默认值）。');

// ---------------------------------------------------------------------------
// 3. 中文排序：拼音 vs 笔画
// ---------------------------------------------------------------------------

console.log('\n--- 3. 中文排序：拼音 vs 笔画 ---');

const HAN = ['张三', '李四', '王五', '欧阳修', '阿宝', '曹操', '赵六', '钱七', '周杰伦', '孙悟空'];
const rows = [
  { 排序方式: 'Array.sort() 默认', 结果: join([...HAN].sort()) },
  { 排序方式: 'zh-CN（默认拼音）', 结果: join([...HAN].sort(new Intl.Collator('zh-CN').compare)) },
  { 排序方式: 'zh-CN-u-co-pinyin', 结果: join([...HAN].sort(new Intl.Collator('zh-CN-u-co-pinyin').compare)) },
  { 排序方式: 'zh-CN-u-co-stroke（笔画）', 结果: join([...HAN].sort(new Intl.Collator('zh-CN-u-co-stroke').compare)) },
];
for (const r of rows) console.log(`  ${r.排序方式.padEnd(26)} -> ${r.结果}`);
console.log('拼音顺序：阿(a) 曹(c) 李(l) 欧阳(o) 钱(q) 孙(s) 王(w) 张(z) 赵(z) 周(z) —— 完全符合中文习惯。');
console.log('笔画顺序：王五(4画) 孙悟空 张三 李四 周杰伦 ... —— 按笔画数 + 笔顺，用于字典/索引。');

// 真实场景：通讯录按姓氏分组
console.log('\n真实场景：通讯录里"按姓氏首字母分组"其实只差一个 Collator：');
const contacts = ['周杰伦', '欧阳修', '阿宝', '曹操', '李四'];
const sortedContacts = [...contacts].sort(new Intl.Collator('zh-CN').compare);
console.log('  排序后：' + join(sortedContacts, '、'));
console.log('  注意：Intl.Collator 只排序，不会告诉你"拼音首字母是 A/C/L/O/Z"。');
console.log('        要首字母得自己查表或借助 Intl.Segmenter + 拼音库，Collator 不提供这个能力。');

// ---------------------------------------------------------------------------
// 4. 变音符号：德语 ö/ß vs 瑞典语 ö
// ---------------------------------------------------------------------------

console.log('\n--- 4. 变音符号：同一个 ö，各国规矩不同 ---');

const umlaut = ['öko', 'Oktober', 'Zoe', 'Ärger'];
const langRows = [
  { locale: 'de-DE（德语）', 规则: 'ö 等同于 o，ß 等同于 ss', 结果: join([...umlaut].sort(new Intl.Collator('de-DE').compare)) },
  { locale: 'sv-SE（瑞典语）', 规则: 'ö 是排在 z 之后的独立字母', 结果: join([...umlaut].sort(new Intl.Collator('sv-SE').compare)) },
  { locale: 'en-US（英语）', 规则: 'ö 视作 o 加变音，先比 o 再比变音', 结果: join([...umlaut].sort(new Intl.Collator('en-US').compare)) },
];
for (const r of langRows) console.log(`  ${r.locale.padEnd(20)} ${r.规则.padEnd(26)} -> ${r.结果}`);

console.log('\n直接比较单个字符（负数 = 前者在前）：');
const charRows = [
  ['ö', 'z', 'de-DE', '德语里 ö ≈ o，所以 ö < z'],
  ['ö', 'z', 'sv-SE', '瑞典语里 ö 在字母表末尾，所以 ö > z'],
  ['ß', 'z', 'de-DE', '德语里 ß ≈ ss，s < z 所以 ß < z'],
  ['ä', 'z', 'de-DE', '德语里 ä ≈ a，所以 ä < z'],
];
console.log('  ' + padDisplay('字符对', 12) + padDisplay('locale', 10) + padDisplay('码元 a<b', 12) + padDisplay('Collator', 12) + '说明');
for (const [a, b, loc, note] of charRows) {
  console.log(
    '  ' +
      padDisplay(`${a} vs ${b}`, 12) +
      padDisplay(loc, 10) +
      padDisplay(String(a < b), 12) +
      padDisplay(String(new Intl.Collator(loc).compare(a, b)), 12) +
      note,
  );
}

console.log('\nß 与 ss 的关系（搜索场景的关键）：');
const de = new Intl.Collator('de-DE');
console.log('  de-DE compare("Straße", "Strasse")               =', de.compare('Straße', 'Strasse'), '（德语把 ß 等同于 ss，但仍然 > 0）');
console.log('  de-DE + sensitivity:"base" compare("Straße","Strasse") =', new Intl.Collator('de-DE', { sensitivity: 'base' }).compare('Straße', 'Strasse'), '（0 = 视为同一个词）');
console.log('  -> 所以"忽略大小写与变音的模糊搜索"要用 base，而"德语词典排序"要用默认的 variant。');

// ---------------------------------------------------------------------------
// 5. numeric：自然排序
// ---------------------------------------------------------------------------

console.log('\n--- 5. numeric: true —— 自然排序（Natural Sort）---');

console.log('场景一：排行榜名次');
const ranks = ['第10名', '第2名', '第1名', '第20名'];
console.log('  默认 sort()                 ->', join([...ranks].sort()));
console.log('  Collator numeric:true       ->', join([...ranks].sort(new Intl.Collator('zh-CN', { numeric: true }).compare)));
console.log('  "第2名" vs "第10名"：码元比较说 2 > 1，自然排序说 2 < 10。');

console.log('\n场景二：文件名 / 章节号');
console.log('  默认 sort()                 ->', join([...FILES].sort()));
console.log('  Collator numeric:true       ->', join([...FILES].sort(new Intl.Collator('zh-CN', { numeric: true }).compare)));
console.log('  file2.txt 终于排在 file10.txt 前面了。');

console.log('\n细节：数字串等值时按"稳定排序"保持原顺序');
const dup = ['a1', 'a01', 'a001'];
const dupColl = new Intl.Collator('en-US', { numeric: true });
console.log('  compare("a1","a01") =', dupColl.compare('a1', 'a01'), '（视为相等，不比较前导零）');
console.log('  ["a1","a01","a001"] 排序 ->', join([...dup].sort(dupColl.compare)), '（原顺序被保留）');

// ---------------------------------------------------------------------------
// 6. sensitivity：控制"多严格才算不同"
// ---------------------------------------------------------------------------

console.log('\n--- 6. sensitivity：四个档位 ---');

const SENS = ['base', 'accent', 'case', 'variant'];
const sensRows = SENS.map((s) => {
  const c = new Intl.Collator('en-US', { sensitivity: s });
  return {
    档位: s,
    'a vs A': String(c.compare('a', 'A')),
    'a vs á': String(c.compare('a', 'á')),
    'a vs b': String(c.compare('a', 'b')),
    语义: { base: '忽略大小写与变音', accent: '忽略大小写，区分变音', case: '忽略变音，区分大小写', variant: '全都区分（默认）' }[s],
  };
});
console.table(sensRows);
console.log('规律：档位越"严格"，相等的可能性越低；a vs b 在任何档位都不同（基础字母不同）。');
console.log('用例：模糊搜索（忽略重音）-> base；密码/唯一键比较 -> variant；');
console.log('      "搜索时忽略大小写但保留重音" -> accent。');

// ---------------------------------------------------------------------------
// 7. caseFirst：大小写谁在前
// ---------------------------------------------------------------------------

console.log('\n--- 7. caseFirst：大小写字母谁排前面 ---');

const MIXED = ['a', 'B', 'c', 'A', 'b', 'C'];
const caseRows = [
  ['不传（默认）', new Intl.Collator('en-US').compare],
  ["caseFirst: 'upper'", new Intl.Collator('en-US', { caseFirst: 'upper' }).compare],
  ["caseFirst: 'lower'", new Intl.Collator('en-US', { caseFirst: 'lower' }).compare],
];
for (const [label, cmp] of caseRows) {
  console.log(`  ${label.padEnd(22)} -> ${join([...MIXED].sort(cmp), ',')}`);
}
console.log('注意：caseFirst 只在"大小写可区分"时才有意义。');
console.log("  若 sensitivity 为 'base'/'accent'（不区分大小写），caseFirst 会被忽略：");
console.log("  base + caseFirst:'upper' ->", join([...MIXED].sort(new Intl.Collator('en-US', { sensitivity: 'base', caseFirst: 'upper' }).compare), ','));

// ---------------------------------------------------------------------------
// 8. ignorePunctuation 与 usage
// ---------------------------------------------------------------------------

console.log('\n--- 8. ignorePunctuation 与 usage ---');

const PUNCT = ['a-b', 'ab', 'a b', 'a.b'];
console.log('  默认                 ->', join([...PUNCT].sort(new Intl.Collator('en-US').compare), ' | '));
console.log('  ignorePunctuation    ->', join([...PUNCT].sort(new Intl.Collator('en-US', { ignorePunctuation: true }).compare), ' | '));
console.log('  说明：忽略标点后 "a-b" 与 "ab" 完全相等，稳定排序保持它们在原数组中的先后。');

// usage: 'search' 声明"这个比较器用于查找"，'sort' 声明"用于排序"。
// 它告诉 ICU 选择不同的比较算法（search 模式倾向于对"前缀/子串匹配"更友好），
// 但**它本身不会放宽任何匹配条件** —— 想让 "cafe" 匹配 "Café"，仍然要靠 sensitivity。
const searchColl = new Intl.Collator('en-US', { usage: 'search' });
const sortColl = new Intl.Collator('en-US', { usage: 'sort' });
console.log("\nusage: 'search' vs 'sort'（sensitivity 都是默认的 variant）:");
for (const [a, b] of [['a', 'A'], ['Café', 'cafe'], ['a', 'á'], ['a-b', 'ab']]) {
  const s = searchColl.compare(a, b);
  const t = sortColl.compare(a, b);
  console.log(`  compare(${JSON.stringify(a)}, ${JSON.stringify(b)})  search: ${String(s).padStart(3)}   sort: ${String(t).padStart(3)}   两者一致: ${s === t}`);
}
console.log('  结论：只改 usage 不会让比较变宽松，本例所有结果与 sort 模式完全相同。');
console.log('  真正的"模糊匹配"要组合 sensitivity / ignorePunctuation：');
const fuzzy = new Intl.Collator('en-US', { usage: 'search', sensitivity: 'base', ignorePunctuation: true });
console.log('    search + base + ignorePunctuation:');
console.log('      compare("Café", "cafe")  =', fuzzy.compare('Café', 'cafe'), '（0 = 命中）');
console.log('      compare("Zürich","zurich") =', fuzzy.compare('Zürich', 'zurich'), '（0 = 命中）');
console.log('      compare("a-b",   "ab")   =', fuzzy.compare('a-b', 'ab'), '（0 = 命中）');
console.log('  补充：ß 与 ss、ö 与 o 这类"字母等价"关系在 base 档位下会被抹平，');
console.log('        de-DE 与 en-US 在这一点上表现一致（都返回 0）：');
const fuzzyDe = new Intl.Collator('de-DE', { usage: 'search', sensitivity: 'base' });
console.log('    de-DE + search + base: compare("Straße","strasse") =', fuzzyDe.compare('Straße', 'strasse'));
console.log('    en-US + search + base: compare("Straße","strasse") =', new Intl.Collator('en-US', { usage: 'search', sensitivity: 'base' }).compare('Straße', 'strasse'));
console.log('    两者的差别体现在**排序位置**而不是等价判断上：');
console.log('      德语词典里 ä/ö/ü 展开成 ae/oe/ue，ß 展开成 ss（见第 4 节）。');

// ---------------------------------------------------------------------------
// 9. localeCompare vs 缓存 Collator
// ---------------------------------------------------------------------------

console.log('\n--- 9. localeCompare 与缓存 Collator 的关系 ---');

// localeCompare 语义上与 Collator 完全一致，只是每次调用都要解析 locales/options。
console.log('"张三".localeCompare("李四", "zh-CN") =', '张三'.localeCompare('李四', 'zh-CN'));
console.log('等价写法 new Intl.Collator("zh-CN").compare("张三","李四") =', zhCollator.compare('张三', '李四'));

const ITER = 20000;
const SAMPLE = ['张三', '李四', '王五', '赵六', '阿宝'];
const bench = (fn, n) => {
  fn();
  const t = process.hrtime.bigint();
  for (let i = 0; i < n; i++) fn();
  return Number(process.hrtime.bigint() - t) / 1e6;
};
// ❌ 反例：每次排序都新建比较器（localeCompare 传 locale 时内部要做同样的事）
const costLocaleCompare = bench(() => [...SAMPLE].sort((a, b) => a.localeCompare(b, 'zh-CN')), ITER);
const costNewCollator = bench(() => [...SAMPLE].sort(new Intl.Collator('zh-CN').compare), ITER);
// ✅ 正例：比较器建一次，反复用
const cachedCollator = new Intl.Collator('zh-CN');
const costCached = bench(() => [...SAMPLE].sort(cachedCollator.compare), ITER);

console.log(`排序 5 个元素 x ${ITER} 次：`);
console.log('  [环境相关] localeCompare 传 locale   ->', costLocaleCompare.toFixed(1), 'ms');
console.log('  [环境相关] 每次 new Collator         ->', costNewCollator.toFixed(1), 'ms');
console.log('  [环境相关] 复用缓存好的 Collator     ->', costCached.toFixed(1), 'ms');
console.log('结论（与机器无关）：复用缓存显著快于每次新建；');
console.log('  本机实测：缓存版约比 localeCompare 传 locale 快', Math.round(costLocaleCompare / Math.max(costCached, 0.001)), '倍，');
console.log('  约比每次 new 一个 Collator 快', Math.round(costNewCollator / Math.max(costCached, 0.001)), '倍。');
console.log('  浏览器里每次 new 都要走一遍 ICU 初始化，差距只会更大。');
console.log('统一建议：把 Collator 提到模块顶层或组件外，作为常量复用。');

// 最终示例：一份"生产级"的排序函数
/**
 * 生成一个中文姓名排序比较器（拼音序 + 自然数字序）。
 * 在模块顶层调用一次并缓存结果，避免每次排序都重建 Collator。
 * @returns {(a: string, b: string) => number}
 */
function createNameComparator() {
  const collator = new Intl.Collator('zh-CN', { usage: 'sort', numeric: true });
  return collator.compare; // 直接返回绑定函数
}
const compareNames = createNameComparator();
console.log('\n最终示例（拼音 + 自然序）排序混排数据：');
console.log('  ' + join([...NAMES, ...FILES].sort(compareNames)));
console.log('  中文按拼音排在前面，带数字的按数值大小排，拉丁字母殿后 —— 符合中文用户预期。');

console.log('\n本节结束。');
