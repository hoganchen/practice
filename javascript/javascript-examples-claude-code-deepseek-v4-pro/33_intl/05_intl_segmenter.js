/**
 * ============================================================================
 * 知识点：Intl.Segmenter —— 分词、字素簇与句子切分
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】进阶
 * 【前置知识】33_intl/01_intl_overview.js、11_strings 中的字符串基础
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Intl.Segmenter 按 Unicode 的断字规则（UAX #29）把一段文本切成"有意义的单位"。
 *    三种粒度（granularity）：
 *      'grapheme' 字素簇 —— 用户眼中的"一个字符"（emoji、组合字符、国旗都算一个）
 *      'word'     词        —— 词 / 数字 / 标点，并带 isWordLike 标记
 *      'sentence' 句子      —— 按句末标点与缩写规则切分
 *    它是 JS 里唯一能正确处理"文本边界"的内置工具。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 字数限制 / 截断：Twitter 式的"最多 N 个字符"，
 *        如果用 str.length 或 str.slice(0, n)，会把 emoji 劈成两半变成乱码。
 *    (2) 中文分词：中文没有空格，split(' ') 完全无效。
 *        搜索高亮、关键词统计、按词换行、文本编辑器双击选中，
 *        都需要"词"的概念。
 *    (3) 搜索命中高亮：要把用户输入的关键词在原文里定位出来，
 *        得先知道词边界在哪。
 *    (4) 句子切分：摘要、朗读（TTS）、逐句翻译，都要求按句子切。
 *    (5) 表单里"限制字数并显示剩余"的计数器，必须按字素簇计数，
 *        否则用户看到的字数和程序算的对不上。
 *
 * 3. 核心语法要点
 *    (1) new Intl.Segmenter(locales, { granularity })。granularity 默认 'grapheme'。
 *    (2) seg.segment(input) 返回一个**可迭代的 Segments 对象**（不是数组）。
 *        每一个迭代项形如：{ segment: '北京', index: 2, input: '...', isWordLike: true }
 *          segment    切出来的那段文本
 *          index      这段文本在原串中的**起始 UTF-16 索引**（可直接用于 slice）
 *          input      原始输入
 *          isWordLike 仅 'word' 粒度有：是否是"词"（标点、空格、emoji 为 false）
 *    (3) Segments 还有 .containing(index) 方法：给定位置，返回包含它的那一段。
 *    (4) 想转成数组就展开：[...seg.segment(text)]。
 *    (5) locale 会影响部分语言的分词（词典分词），但对字素簇粒度几乎无影响。
 *        无论如何都**应该显式传 locale**，保持行为可预期。
 *
 * 4. 常见陷阱
 *    (1) str.length 数的是 UTF-16 码元，不是"字符"：
 *        '👨‍👩‍👧‍👦'.length 是 11，但用户看到的是 1 个 emoji。
 *    (2) [...str]（展开运算符）按**码点**切分，比 length 好，但仍然会拆散
 *        ZWJ 序列（家庭 emoji）、肤色修饰符、国旗（区域指示符对）和组合重音。
 *        要正确切分只能按**字素簇**，也就是 Intl.Segmenter。
 *    (3) str.slice / str.substring 的索引是 UTF-16 码元下标，
 *        用它们截断 emoji 会把代理对劈开，产生"半个字符"（显示成 �）。
 *    (4) 中文分词依赖 ICU 词典，结果**不保证 100% 正确**
 *        （"研究生命起源"可能被切成"研究/生命/起源"也可能切成"研究生/命/起源"，
 *        这正是经典的歧义梗）。它是"够用的启发式"，不是语言学真理。
 *    (5) 分词不改变文本：把 segments 的 segment 拼起来必须等于原文，
 *        任何"丢字"都说明用法有问题。
 *    (6) Segments 对象是**惰性**的：只能遍历一次，需要多次使用请先转成数组。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 33_intl/05_intl_segmenter.js
 *
 * 【预期输出】
 *   分 9 个小节：三种粒度、字素簇 vs split('') vs [...]、emoji 全解、
 *   中文分词、与 split(' ') 的对比、句子切分、两个实战函数（安全截断、关键词高亮）、
 *   陷阱演示。全部显式传 locale，输出固定。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 常用常量
// ---------------------------------------------------------------------------

const LOCALE = 'zh-CN';
// 一段包含家庭 emoji、肤色修饰符、国旗、ZWJ 职业 emoji、组合重音字符的混合文本。
// 最后一个 "e" 后面跟的是"组合重音"（U+0301），不是预组合的 é —— 两者视觉相同但字节不同。
const EMOJI_MIX = 'a👨‍👩‍👧‍👦b👍🏽c🇨🇳d👩‍💻e' + 'é' + 'f';

/**
 * 按显示宽度补空格（汉字/emoji 算 2 列），让终端表格对齐。
 * @param {string} str 文本
 * @param {number} width 目标显示宽度
 * @returns {string}
 */
function padDisplay(str, width) {
  let w = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    const wide =
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2e80 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe30 && cp <= 0xfe6f) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0x1f300 && cp <= 0x1faff);
    w += wide ? 2 : 1;
  }
  return str + ' '.repeat(Math.max(0, width - w));
}

// ---------------------------------------------------------------------------
// 1. 三种粒度总览
// ---------------------------------------------------------------------------

console.log('--- 1. 三种 granularity ---');

const TEXT_WORD = '我爱北京天安门，JavaScript 真好玩！Hello world.';
console.log('原文：' + TEXT_WORD);

const wordSeg = new Intl.Segmenter(LOCALE, { granularity: 'word' });
console.log('\nword 粒度（词）：');
for (const s of wordSeg.segment(TEXT_WORD)) {
  const mark = s.isWordLike ? '词' : '符';
  console.log(`  [${mark}] ${padDisplay(JSON.stringify(s.segment), 16)} index=${String(s.index).padStart(2)}`);
}
console.log('要点：isWordLike 为 false 的是标点/空格，做"关键词提取"时要过滤掉它们。');

const sentenceSeg = new Intl.Segmenter(LOCALE, { granularity: 'sentence' });
console.log('\nsentence 粒度（句）：');
for (const s of sentenceSeg.segment(TEXT_WORD)) {
  console.log(`  index=${String(s.index).padStart(2)} -> ${JSON.stringify(s.segment)}`);
}

const graphemeSeg = new Intl.Segmenter(LOCALE, { granularity: 'grapheme' });
console.log('\ngrapheme 粒度（字素簇）：');
console.log('  ' + JSON.stringify(TEXT_WORD) + ' 共切出', [...graphemeSeg.segment(TEXT_WORD)].length, '个字素簇');
console.log('  其中"J"和"a"各算一个，"！"和"。"也各算一个 —— 标点同样占一个"用户眼中的字符"。');

// ---------------------------------------------------------------------------
// 2. 三种"长度"的对比
// ---------------------------------------------------------------------------

console.log('\n--- 2. str.length vs [...str] vs grapheme ---');

const counts = [
  { 方式: "str.length（UTF-16 码元）", 数量: EMOJI_MIX.length, 说明: 'emoji 会被算成好几个' },
  { 方式: '[...str]（码点）', 数量: [...EMOJI_MIX].length, 说明: 'ZWJ 序列仍会被拆散' },
  { 方式: '[...segmenter]（字素簇）', 数量: [...graphemeSeg.segment(EMOJI_MIX)].length, 说明: '与用户看到的一致' },
];
console.table(counts);
console.log('测试串：' + EMOJI_MIX);
console.log('用户肉眼数出来是 11 个"字符"，只有字素簇方式数对了。');

console.log('\n逐项展开这张表：');
const items = [...graphemeSeg.segment(EMOJI_MIX)];
console.log('  ' + padDisplay('序号', 6) + padDisplay('字素簇', 10) + padDisplay('UTF-16 长度', 14) + '说明');
// 逐项标注：说明每个字素簇由什么组成。
const NOTES = [
  '普通字母 a',
  '一家四口：4 个 emoji + 3 个 ZWJ 连接符',
  '普通字母 b',
  '点赞 + 中肤色修饰符（U+1F3FD）',
  '普通字母 c',
  '中国国旗：两个区域指示符组成一个整体',
  '普通字母 d',
  '女程序员：ZWJ 连接起来的两个 emoji',
  '普通字母 e',
  'e + 组合重音 U+0301（两个码点，一个字素簇）',
  '普通字母 f',
];
items.forEach((s, i) => {
  console.log(
    '  ' +
      padDisplay(String(i), 6) +
      padDisplay(s.segment, 10) +
      padDisplay(String(s.segment.length), 14) +
      (NOTES[i] ?? '未标注'),
  );
});
console.log('  共', items.length, '项，与 NOTES 一一对应。');
console.log('\n注意每一项的 UTF-16 长度大多大于 1，但每项在用户眼里都只是"一个字符"。');
console.log('提示：终端里组合重音字符可能显示成两个字符的样子，这只是渲染差异，切分是对的。');

// ---------------------------------------------------------------------------
// 3. split('') 与 [...] 到底错在哪
// ---------------------------------------------------------------------------

console.log("\n--- 3. split('') 与 [...] 错在哪 ---");

const FAMILY = '👨‍👩‍👧‍👦';
console.log('以家庭 emoji 为例：' + FAMILY);
console.log('  FAMILY.length            =', FAMILY.length, '（11 个 UTF-16 码元）');
console.log('  [...FAMILY].length       =', [...FAMILY].length, '（7 个码点，被 ZWJ 拆开了）');
console.log('  [...graphemeSeg.segment(FAMILY)].length =', [...graphemeSeg.segment(FAMILY)].length, '（1 个字素簇，正确）');
console.log('  逐码点展开：', [...FAMILY].map((c) => JSON.stringify(c)).join(' '));
console.log("  split('') 更糟，会把代理对劈成孤立的一半：");
console.log('   ', JSON.stringify(FAMILY.split('')));

console.log('\n用 slice 按码元截断会发生什么：');
const TARGET = FAMILY + 'abc';
console.log('  原文 =', JSON.stringify(TARGET));
// slice(0, 1) 只取第一个 UTF-16 码元：家庭 emoji 的首个码元是高代理项 0xD83D。
const oneUnit = TARGET.slice(0, 1);
const cp = oneUnit.codePointAt(0);
const isLoneSurrogate = cp >= 0xd800 && cp <= 0xdfff;
console.log('  TARGET.slice(0, 1) =', JSON.stringify(oneUnit), '，码点 U+' + cp.toString(16).toUpperCase(), '，是孤立代理项吗？', isLoneSurrogate);
// slice(0, 6) 正好在 ZWJ 之后断开，留下一个"悬空的连接符"，视觉上会和后面的字符粘连。
console.log('  TARGET.slice(0, 6) =', JSON.stringify(TARGET.slice(0, 6)), '（结尾是一个悬空的 ZWJ）');
console.log('  -> 孤立代理项显示成 �（U+FFFD 替换字符），悬空 ZWJ 会让后面的字符被错误地拼接，');
console.log('     这类"半个字符"还可能让 JSON 序列化或严格校验的接口直接报错。');

// ---------------------------------------------------------------------------
// 4. 中文分词：Intl.Segmenter 对中文的意义
// ---------------------------------------------------------------------------

console.log('\n--- 4. 中文分词 ---');

const HAN_TEXT = '我爱北京天安门，天安门上太阳升。';
console.log('原文：' + HAN_TEXT);
console.log("\n用 split(' ') 试试：");
console.log('  ' + JSON.stringify(HAN_TEXT.split(' ')), '（只有一项 —— 中文根本不用空格分词）');
console.log('\n用 Intl.Segmenter 分词：');
const hanWords = [...wordSeg.segment(HAN_TEXT)].filter((s) => s.isWordLike).map((s) => s.segment);
console.log('  ' + hanWords.join(' | '));
console.log('  词数 =', hanWords.length, '（"北京""天安门""太阳"都是完整词，而不是一个字一个词）');

console.log('\n与"按字切"的对比：');
console.log('  按字切（[...text] 或 split("")） ->', [...HAN_TEXT].filter((c) => /[一-龥]/.test(c)).join(' | '));
console.log('  按词切（Intl.Segmenter）        ->', hanWords.join(' | '));
console.log('  差别在于："北京"是一个词还是两个字？搜索、统计、换行都依赖这个判断。');

console.log('\n分词保留了原文的所有内容（可无损还原）：');
const allSegments = [...wordSeg.segment(HAN_TEXT)].map((s) => s.segment).join('');
console.log('  拼接 segments === 原文 ->', allSegments === HAN_TEXT);

console.log('\n分词歧义（经典案例，说明它只是启发式）：');
for (const text of ['研究生命的起源', '南京市长江大桥', '乒乓球拍卖完了']) {
  const words = [...wordSeg.segment(text)].filter((s) => s.isWordLike).map((s) => s.segment);
  console.log(`  ${text} -> ${words.join(' / ')}`);
}
console.log('  这些句子都有多种合法切法，ICU 词典给出的是"最常见"的一种，');
console.log('  不能当成语言学正确答案；涉及金额、法条等严肃场景要人工校验。');

// ---------------------------------------------------------------------------
// 5. 词边界还能干什么：containing 与 index
// ---------------------------------------------------------------------------

console.log('\n--- 5. index 与 containing() ---');

const text2 = 'Hello world';
const segments = wordSeg.segment(text2);
console.log('原串：' + JSON.stringify(text2));
for (const s of segments) {
  console.log(`  index=${s.index} segment=${JSON.stringify(s.segment)} isWordLike=${s.isWordLike}`);
}
console.log('index 是 UTF-16 下标，可以直接用于 slice：');
const third = [...wordSeg.segment(text2)][2];
console.log(`  text2.slice(${third.index}, ${third.index + third.segment.length}) =`, JSON.stringify(text2.slice(third.index, third.index + third.segment.length)));

// containing：给定位置反查所属的词（编辑器"双击选中"就是这样实现的）。
const seg1 = wordSeg.segment(text2);
console.log('\ncontaining(6)（光标在第 6 个码元处）->', JSON.stringify(seg1.containing(6)?.segment));
const seg2 = wordSeg.segment('我爱北京天安门');
console.log('containing(3)（"北京"里）->', JSON.stringify(seg2.containing(3)?.segment));
console.log('containing 在"双击选词"、"光标所在词加粗"这类交互里非常有用。');

// ---------------------------------------------------------------------------
// 6. 句子切分
// ---------------------------------------------------------------------------

console.log('\n--- 6. 句子切分 ---');

const PARA = '今天下雨。明天会晴吗？应该会吧！Dr. Smith went home. He was tired.';
console.log('原文：' + PARA);
console.log('\nsentence 粒度结果：');
for (const s of sentenceSeg.segment(PARA)) {
  console.log(`  index=${String(s.index).padStart(2)} -> ${JSON.stringify(s.segment)}`);
}
console.log('注意 "Dr. Smith" 没有被拆开 —— 分词器知道英文缩写里的点是句内点。');
console.log('这是手写 split(/[.。!！?？]/) 永远做不到的。');

// ---------------------------------------------------------------------------
// 7. 实战一：按字素簇安全截断
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战：emoji 安全截断 ---');

/**
 * 按"用户眼中的字符数"截断字符串，超长时补省略号。
 * 这是社交产品"最多 N 个字"的标准实现。
 * @param {string} text 原文
 * @param {number} maxGraphemes 最大字素簇数
 * @param {string} [ellipsis] 省略号
 * @param {string} [locale] BCP 47 标签
 * @returns {string}
 */
function truncateByGrapheme(text, maxGraphemes, ellipsis = '…', locale = 'zh-CN') {
  const seg = new Intl.Segmenter(locale, { granularity: 'grapheme' });
  const graphemes = [...seg.segment(text)];
  if (graphemes.length <= maxGraphemes) return text;
  // 省略号本身也占位置，所以要给它留出一个字素簇。
  return graphemes.slice(0, Math.max(0, maxGraphemes - 1)).map((g) => g.segment).join('') + ellipsis;
}

const LONG = '大家好👨‍👩‍👧‍👦这是 👍🏽 一个 🇨🇳 测试文案';
console.log('原文（' + [...graphemeSeg.segment(LONG)].length + ' 个字素簇）：' + LONG);
for (const n of [10, 15, 20]) {
  console.log(`  截到 ${String(n).padStart(2)} 个 -> ${truncateByGrapheme(LONG, n)}`);
}
console.log('\n对比暴力写法：');
const naive = (t, n) => (t.length <= n ? t : t.slice(0, n - 1) + '…');
console.log(`  按码元截到 10 -> ${naive(LONG, 10)}`);
console.log('  -> 家庭 emoji 被劈开，只剩下零散的码点，显示为乱码或方框。');

// ---------------------------------------------------------------------------
// 8. 实战二：中文关键词高亮
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战：中文关键词高亮 ---');

/**
 * 在文本中给命中的关键词加标记。
 * 中文没有空格，必须先用 Segmenter 切词，再按词匹配，否则只能做子串匹配。
 * @param {string} text 原文
 * @param {string[]} keywords 关键词
 * @param {string} locale BCP 47 标签
 * @returns {string}
 */
function highlight(text, keywords, locale) {
  const seg = new Intl.Segmenter(locale, { granularity: 'word' });
  const set = new Set(keywords);
  return [...seg.segment(text)]
    .map((s) => (s.isWordLike && set.has(s.segment) ? `【${s.segment}】` : s.segment))
    .join('');
}

const ARTICLE = '北京是中国的首都，北京也是历史文化名城。';
console.log('原文：' + ARTICLE);
console.log('按词高亮"北京" -> ' + highlight(ARTICLE, ['北京'], 'zh-CN'));
console.log('按词高亮"中国" -> ' + highlight(ARTICLE, ['中国'], 'zh-CN'));
console.log('按词高亮多个关键词 -> ' + highlight(ARTICLE, ['北京', '中国'], 'zh-CN'));

console.log('\n与"子串替换"的取舍（用同一个关键词"中"对比）：');
const TRAP = '中美关系紧张，他是中国人。';
console.log('  原文       -> ' + TRAP);
console.log('  子串替换   -> ' + TRAP.replaceAll('中', '【中】'));
console.log('  按词高亮   -> ' + highlight(TRAP, ['中'], 'zh-CN'));
console.log('  子串替换命中了"中美关系""中国人"内部的"中"，把它当成独立关键词高亮是误导；');
console.log('  按词高亮只认完整词，所以这里一处都没命中 —— 这是"精确但可能漏"，');
console.log('  子串替换是"全都能中但会误伤"。选哪种取决于产品语义：');
console.log('    搜"中"想找含该字的任何内容 -> 子串替换；');
console.log('    搜"篮球"想找这个词本身     -> 按词匹配（见下例）。');
const SPORT = '我喜欢打篮球，篮球很好玩。';
console.log('\n  原文     -> ' + SPORT);
console.log('  按词高亮 -> ' + highlight(SPORT, ['篮球'], 'zh-CN'));
console.log('  这里子串替换也能得到同样结果，但按词匹配能顺手拿到 index（可做精确定位）。');

// ---------------------------------------------------------------------------
// 9. 陷阱与限制
// ---------------------------------------------------------------------------

console.log('\n--- 9. 陷阱与限制 ---');

console.log('陷阱一：Segments 是惰性迭代器，只能消费一次');
const lazy = wordSeg.segment('我爱北京');
console.log('  第一次遍历 ->', [...lazy].map((s) => s.segment).join(' / '));
console.log('  第二次遍历 ->', JSON.stringify([...lazy].map((s) => s.segment)), '（空了！）');
console.log('  需要多次使用就先转数组：const arr = [...seg.segment(text)];');

console.log('\n陷阱二：granularity 拼错会抛 RangeError');
try {
  new Intl.Segmenter(LOCALE, { granularity: 'char' });
} catch (err) {
  console.log('  granularity: "char" ->', err.constructor.name + ':', err.message);
}
console.log("  合法值只有 'grapheme' | 'word' | 'sentence'（注意是英式拼写 grapheme）。");

console.log('\n陷阱三：不传 locale 时字素切分一般没问题，但分词会受影响');
console.log('  本运行时对这几段文本，zh-CN / en-US / ja-JP 的分词结果恰好一致：');
for (const tag of ['zh-CN', 'en-US', 'ja-JP']) {
  const words = [...new Intl.Segmenter(tag, { granularity: 'word' }).segment('我爱北京天安门')]
    .filter((s) => s.isWordLike)
    .map((s) => s.segment);
  console.log(`    ${tag.padEnd(7)} -> ${words.join(' / ')}`);
}
console.log('  词典覆盖也因运行时而异：本运行时对韩文连写不做切分（换哪个 locale 都一样），');
console.log('  但换一个 Node / 浏览器版本，结果可能就不同 —— 所以别把分词结果写进测试快照：');
for (const tag of ['ko-KR', 'en-US']) {
  const words = [...new Intl.Segmenter(tag, { granularity: 'word' }).segment('안녕하세요세계')]
    .filter((s) => s.isWordLike)
    .map((s) => s.segment);
  console.log(`    ${tag.padEnd(7)} -> ${words.join(' / ')}`);
}
console.log('  结论：无论字素还是词，都该显式传 locale，行为才可预期。');

console.log('\n陷阱四：Segmenter 处理超长文本会慢');
const BIG = '北京天安门。'.repeat(2000);
const bench = (fn) => {
  const t = process.hrtime.bigint();
  const r = fn();
  return { ms: Number(process.hrtime.bigint() - t) / 1e6, r };
};
const byCodePoint = bench(() => [...BIG].length);
const byGrapheme = bench(() => [...graphemeSeg.segment(BIG)].length);
const byWord = bench(() => [...wordSeg.segment(BIG)].length);
console.log(`  [环境相关] 原文长度 ${BIG.length} 个码元`);
console.log(`  [环境相关] [...BIG]                    ${byCodePoint.ms.toFixed(2)} ms -> ${byCodePoint.r}`);
console.log(`  [环境相关] 字素簇切分                  ${byGrapheme.ms.toFixed(2)} ms -> ${byGrapheme.r}`);
console.log(`  [环境相关] 分词                        ${byWord.ms.toFixed(2)} ms -> ${byWord.r}`);
console.log('  Segments 是惰性的（边遍历边切），如果你只需要前 N 项，');
console.log('  用 for...of 配合 break 提前退出，不要先 [...spread] 再取前 N 个。');
const onlyFirst = (() => {
  const t = process.hrtime.bigint();
  let count = 0;
  for (const s of wordSeg.segment(BIG)) {
    count++;
    if (count >= 5) break;
  }
  return Number(process.hrtime.bigint() - t) / 1e6;
})();
console.log(`  [环境相关] 只取前 5 个词（提前 break）  ${onlyFirst.toFixed(3)} ms`);

console.log('\n本节结束。');
