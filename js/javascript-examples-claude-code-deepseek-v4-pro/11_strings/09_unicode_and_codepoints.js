/**
 * ============================================================================
 * 知识点：Unicode 与码点 —— UTF-16、代理对、length 陷阱、码点遍历、normalize
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】高级
 * 【前置知识】11_strings/03_indexing_and_length.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 字符串内部是 UTF-16 编码的"码元（code unit）"序列，每个码元 16 位（0~65535）。
 *    Unicode 给每个字符分配一个"码点（code point）"，范围为 U+0000 ~ U+10FFFF。
 *    码点 <= U+FFFF 的字符（BMP，基本多文种平面）占 1 个码元；
 *    码点 > U+FFFF 的字符（如 emoji、部分生僻汉字）需要 2 个码元表示，
 *    这 2 个码元称为"代理对（surrogate pair）"：
 *      高代理项 D800~DBFF，低代理项 DC00~DFFF。
 *    所以 str.length 统计的是码元数，不一定等于"人看到的字符数"。
 *
 * 2. 为什么需要
 *    只要程序会处理用户输入、昵称、评论、emoji，就一定会遇到这个问题：
 *      - "😀".length === 2，按 length 截断会切出乱码
 *      - 用 str[i] 或 charAt 遍历会把 emoji 拆成两个无效码元
 *      - 校验"最多 10 个字"的用户名时，用 length 会把 emoji 算成 2
 *      - 两个看起来一样的字符串（é）可能编码不同，=== 比较失败
 *
 * 3. 核心语法要点
 *    - 从"字符"到"编码"的几种表示法：
 *        'A'        → 'A'（BMP 字符）
 *        '\u{1F600}'     → '😀'（ES6 的码点转义，需开 u 标志或直接用于字符串字面量）
 *        '😀'  → '😀'（显式写两个代理码元，结果一样）
 *    - 按码点遍历：for...of、展开运算符 [...str]、Array.from(str)。
 *    - String.prototype.codePointAt(i) 读取码点；String.fromCodePoint(cp) 反向构造。
 *    - str.normalize(form)：把"组合字符序列"统一成规范形式，form 可为
 *      'NFC'（默认，合成）、'NFD'（分解）、'NFKC'、'NFKD'（兼容形式）。
 *    - 正则加 u 标志后，. 和量词都按码点工作，能正确匹配 emoji。
 *
 * 4. 常见陷阱
 *    - str.length、str.slice、str[i] 全部按码元工作，都不"感知"代理对。
 *    - [...'😀'].length === 1，而 '😀'.length === 2，两者混用会算错字数。
 *    - 'é' 有两种写法：单个 U+00E9，或 'e' + 组合重音 U+0301。二者 === 为 false，
 *      必须 normalize 后才能比较。
 *    - 只有"字符数"用码点算就够；涉及"显示宽度"（中文占 2 列）还得另算，
 *      需要 Intl.Segmenter 或专门的宽度库，本文件不展开。
 *    - 不要用 str.split('') 拆分用户昵称，会拆坏 emoji 与生僻字。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/09_unicode_and_codepoints.js
 *
 * 【预期输出】
 *   演示码元与码点的差异、代理对拆分、按码点遍历、normalize 比较等结果。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. length 是码元数，不是字符数
// ---------------------------------------------------------------------------

console.log('--- 1. length 是码元数 ---');

const ascii = 'abc';
const chinese = '中文字';
const emoji = '😀';

console.log('ASCII 串：', JSON.stringify(ascii), '| length =', ascii.length);
console.log('中文串：', JSON.stringify(chinese), '| length =', chinese.length); // 3，BMP 内
console.log('emoji 串：', JSON.stringify(emoji), '| length =', emoji.length); // 2 ！不是 1

// 用户"看到"的字符数应该按码点算
console.log('emoji 的码点数：', [...emoji].length); // 1

// 混合串：码元数与码点数不一致
const mixed = 'a中😀';
console.log('混合串：', JSON.stringify(mixed));
console.log('  length（码元）：', mixed.length); // 1 + 1 + 2 = 4
console.log('  码点个数：', [...mixed].length); // 3
console.log('  Array.from 结果：', JSON.stringify(Array.from(mixed)));

// ---------------------------------------------------------------------------
// 2. 码点与代理对
// ---------------------------------------------------------------------------

console.log('--- 2. 码点与代理对 ---');

// 用码点转义直接写 emoji（ES6 语法，等价于直接贴 emoji）
const emojiEscaped = '\u{1F600}';
console.log("'\\u{1F600}'：", JSON.stringify(emojiEscaped));
console.log('与直接写的 emoji 相等：', emojiEscaped === emoji); // true

// 也可以用两个代理码元拼出来，结果完全相同。
// 0xD83D 是高代理项，0xDE00 是低代理项，二者合起来就是 U+1F600。
// 这里刻意用数值写法，是为了让你看清"两个码元拼出一个字符"这件事。
const emojiByPair = String.fromCharCode(0xd83d, 0xde00);
console.log('两个代理码元拼出：', JSON.stringify(emojiByPair));
console.log('长度：', emojiByPair.length); // 2，说明它确实是两个码元
console.log('相等：', emojiByPair === emoji); // true，与直接写的 emoji 完全相同

// 逐个码元看内部结构
console.log('第 0 个码元的编码：', emoji.charCodeAt(0), '(0x' + emoji.charCodeAt(0).toString(16) + ')');
console.log('第 1 个码元的编码：', emoji.charCodeAt(1), '(0x' + emoji.charCodeAt(1).toString(16) + ')');
// 0xD83D 属于高代理区 D800~DBFF，0xDE00 属于低代理区 DC00~DFFF
const hi = emoji.charCodeAt(0);
const lo = emoji.charCodeAt(1);
console.log('是代理对吗：', hi >= 0xd800 && hi <= 0xdbff && lo >= 0xdc00 && lo <= 0xdfff);

// 真正的码点
console.log('codePointAt(0)：', emoji.codePointAt(0), '(0x' + emoji.codePointAt(0).toString(16) + ')');

// 手工从代理对还原码点（理解原理用，实际应直接调用 codePointAt）
// 公式：码点 = 0x10000 + (高代理 - 0xD800) * 0x400 + (低代理 - 0xDC00)
const manual = 0x10000 + (hi - 0xd800) * 0x400 + (lo - 0xdc00);
console.log('手工计算码点：', manual, '| 与 codePointAt 一致：', manual === emoji.codePointAt(0));

// 判断一个码点是否是 BMP（是否需要代理对）
function needsSurrogatePair(cp) {
  return cp > 0xffff;
}
console.log('U+0041 需要代理对吗：', needsSurrogatePair(0x41)); // false
console.log('U+1F600 需要代理对吗：', needsSurrogatePair(0x1f600)); // true

// ---------------------------------------------------------------------------
// 3. 码点与字符互转
// ---------------------------------------------------------------------------

console.log('--- 3. 码点与字符互转 ---');

// fromCodePoint 能处理任意码点（含需要代理对的）
console.log('String.fromCodePoint(0x41)：', JSON.stringify(String.fromCodePoint(0x41))); // 'A'
console.log('String.fromCodePoint(0x4E2D)：', JSON.stringify(String.fromCodePoint(0x4e2d))); // '中'
console.log('String.fromCodePoint(0x1F600)：', JSON.stringify(String.fromCodePoint(0x1f600))); // '😀'

// fromCharCode 只认码元，传大于 0xFFFF 的值会被截断成错误字符
console.log('fromCharCode(0x1F600)：', JSON.stringify(String.fromCharCode(0x1f600))); // 截断后是乱码
console.log('fromCharCode 会截断成：', '0x' + String.fromCharCode(0x1f600).charCodeAt(0).toString(16));

// 一次传入多个码点
console.log('fromCodePoint 多个参数：', JSON.stringify(String.fromCodePoint(0x48, 0x69, 0x1f600)));

// 码点转十六进制表示（用于日志、调试）
const cp = emoji.codePointAt(0);
console.log('转义写法：', JSON.stringify('\\u{' + cp.toString(16).toUpperCase() + '}'));

// ---------------------------------------------------------------------------
// 4. 按码点遍历
// ---------------------------------------------------------------------------

console.log('--- 4. 按码点遍历 ---');

const sample = 'a😀中𝌆';
console.log('样本：', JSON.stringify(sample));
console.log('length（码元）：', sample.length); // 1 + 2 + 1 + 2 = 6
console.log('码点数：', [...sample].length); // 4

// 错误做法：按码元遍历，emoji 会被拆成两个乱码片段
const byUnit = [];
for (let i = 0; i < sample.length; i++) {
  byUnit.push(sample[i]);
}
console.log('按码元遍历（错误）：', JSON.stringify(byUnit));

// 正确做法 1：for...of（内部按码点迭代）
const byCodePoint = [];
for (const ch of sample) {
  byCodePoint.push(ch);
}
console.log('for...of 遍历（正确）：', JSON.stringify(byCodePoint));

// 正确做法 2：展开运算符
console.log('展开运算符：', JSON.stringify([...sample]));

// 正确做法 3：Array.from（与展开运算符等价，且能处理类数组）
console.log('Array.from：', JSON.stringify(Array.from(sample)));

// 正确做法 4：Array.from 带映射函数（顺便把每个字符转成码点值）
console.log('码点值数组：', JSON.stringify(Array.from(sample, (c) => c.codePointAt(0))));

// 用码点数组做"反转字符串"，emoji 不会被拆坏
console.log('按码点反转：', JSON.stringify([...sample].reverse().join('')));
console.log('按码元反转（错误）：', JSON.stringify(sample.split('').reverse().join('')));

// 正确的"字符数"统计函数
function charCount(str) {
  return [...String(str)].length;
}
console.log("charCount('😀')：", charCount('😀')); // 1
console.log("charCount('a中😀')：", charCount('a中😀')); // 3

// 正确的前 N 个字符截断
function truncateByCodePoint(str, n) {
  const chars = [...String(str)];
  // 不够长就原样返回
  if (chars.length <= n) return String(str);
  return chars.slice(0, n).join('');
}
console.log("truncateByCodePoint('a😀中𝌆', 2)：", JSON.stringify(truncateByCodePoint('a😀中𝌆', 2)));

// ---------------------------------------------------------------------------
// 5. 正则中的 u 标志
// ---------------------------------------------------------------------------

console.log('--- 5. 正则 u 标志 ---');

const emojiText = 'hi😀';
// 不带 u 标志时，. 只匹配一个码元，量词也按码元数
console.log("无 u 标志 /^.{3}$/：", /^.{3}$/.test(emojiText)); // false
console.log('无 u 标志时 emojiText.length：', emojiText.length); // 4

// 带 u 标志后，. 按码点匹配
console.log("带 u 标志 /^.{3}$/u：", /^.{3}$/u.test(emojiText)); // true（h、i、😀 共 3 个）

// u 标志还让 \u{...} 转义生效
console.log('字面量匹配 emoji：', /\u{1F600}/u.test(emojiText)); // true

// 用 u 标志配合全局匹配提取所有 emoji
const emojiList = '天气不错😀🌧️☀️'.match(/\p{Extended_Pictographic}/gu);
console.log('提取到的图形字符：', JSON.stringify(emojiList));

// \p{...} 是 Unicode 属性转义，必须搭配 u 标志，可按类别筛选字符
console.log('提取中文：', JSON.stringify('a中b文c'.match(/\p{Script=Han}/gu)));
console.log('提取数字：', JSON.stringify('a1中2b'.match(/\p{Nd}/gu)));

// ---------------------------------------------------------------------------
// 6. normalize —— 看起来一样的字符串可能不相等
// ---------------------------------------------------------------------------

console.log('--- 6. normalize ---');

// 'é' 的两种写法：
//   1) 单个码点 U+00E9（预组合形式）
//   2) 'e' + U+0301（组合重音，两个码点）
// 这里用 \u{...} 转义把第二种写法显式写出来，避免肉眼看起来两者一样而看不出差别
const precomposed = '\u{E9}'; // 等价于直接写 'é'
const decomposed = 'e\u{301}'; // e + 组合尖音符

console.log('预组合：', JSON.stringify(precomposed), '| length =', precomposed.length);
console.log('组合式：', JSON.stringify(decomposed), '| length =', decomposed.length);
console.log('看起来一样吗：', precomposed === decomposed ? '是' : '是（肉眼），但比较结果不同');
console.log('=== 比较结果：', precomposed === decomposed); // false ← 陷阱

// NFC 把组合字符合成一个码点
const nfc1 = precomposed.normalize('NFC');
const nfc2 = decomposed.normalize('NFC');
console.log('NFC 后相等：', nfc1 === nfc2); // true
console.log('NFC 后长度：', nfc1.length, nfc2.length); // 都是 1

// NFD 把预组合字符拆开
const nfd1 = precomposed.normalize('NFD');
console.log('NFD 后长度：', nfd1.length); // 2
console.log('NFD 后相等：', nfd1 === decomposed.normalize('NFD')); // true

// NFKC：兼容分解 + 合成，会把"看起来像但不是同一个"的字符统一
// 例：全角字母 Ａ → 半角 A；上标 ² → 普通 2
console.log("'Ａ'.normalize('NFKC')：", JSON.stringify('Ａ'.normalize('NFKC'))); // 'A'
console.log("'²'.normalize('NFKC')：", JSON.stringify('²'.normalize('NFKC'))); // '2'
console.log("'ﬁ'.normalize('NFKC')：", JSON.stringify('ﬁ'.normalize('NFKC'))); // 'fi' 连字被拆开

// 实战：比较用户输入时要先 normalize
function sameText(a, b) {
  // NFC 是 Web 上的通用推荐形式；再配合大小写归一化
  return String(a).normalize('NFC').toLowerCase() === String(b).normalize('NFC').toLowerCase();
}
console.log('同一文本比较：', sameText(precomposed, decomposed)); // true

// ---------------------------------------------------------------------------
// 7. 实战汇总
// ---------------------------------------------------------------------------

console.log('--- 7. 实战汇总 ---');

// 7.1 按"用户看到的字符数"做长度校验
function validateNickname(name, maxChars) {
  const len = [...String(name)].length;
  if (len === 0) return { ok: false, reason: '昵称不能为空' };
  if (len > maxChars) return { ok: false, reason: `昵称最多 ${maxChars} 个字，当前 ${len} 个` };
  return { ok: true, reason: '通过' };
}
console.log('校验 "小明"：', JSON.stringify(validateNickname('小明', 10)));
console.log('校验 "😀😀😀"：', JSON.stringify(validateNickname('😀😀😀', 10)));
console.log('校验超长 emoji：', JSON.stringify(validateNickname('😀'.repeat(11), 10)));

// 7.2 安全地把字符串按"可见字符"截断
function safeTruncate(str, maxChars, suffix = '…') {
  const chars = [...String(str)];
  if (chars.length <= maxChars) return String(str);
  return chars.slice(0, maxChars).join('') + suffix;
}
console.log('安全截断：', JSON.stringify(safeTruncate('😀😀😀😀😀', 3)));
console.log('安全截断（不超长）：', JSON.stringify(safeTruncate('😀', 3)));

// 7.3 反转含 emoji 的字符串
function reverseByCodePoint(str) {
  return [...String(str)].reverse().join('');
}
console.log('反转 "ab😀"：', JSON.stringify(reverseByCodePoint('ab😀')));

// 7.4 判断字符串是否含有需要代理对的字符
function hasSurrogatePair(str) {
  for (const ch of String(str)) {
    if (ch.codePointAt(0) > 0xffff) return true;
  }
  return false;
}
console.log("'abc' 含代理对吗：", hasSurrogatePair('abc')); // false
console.log("'a😀' 含代理对吗：", hasSurrogatePair('a😀')); // true

console.log('\n全部演示完毕。');
