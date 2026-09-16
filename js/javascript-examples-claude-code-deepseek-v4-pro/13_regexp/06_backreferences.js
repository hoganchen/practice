/**
 * ============================================================================
 * 知识点：反向引用 \1、命名反向引用 \k<name>
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】进阶
 * 【前置知识】13_regexp/05_groups_and_alternation.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    反向引用（backreference）是在正则**内部**引用"前面某个捕获组已经匹配到的文本"。
 *    它不是"再匹配一次同样的模式"，而是"再匹配一次同样的内容"。
 *      · 按编号引用：\1 表示"这里出现的文本，必须和第 1 个捕获组刚才匹配到的完全相同"
 *      · 按名字引用：\k<name> 表示同上，只是用名字代替编号（07 号文件会讲具名组）
 *    "同样的模式"和"同样的内容"是理解反向引用的关键：
 *      /(a|b)\1/     匹配 "aa"、"bb"，不匹配 "ab"
 *      /(a|b)(a|b)/  匹配 "aa"、"ab"、"ba"、"bb"
 *
 * 2. 为什么需要
 *    很多文本结构天生"前后必须一致"，而固定模式写不出来：
 *      · HTML/XML 的成对标签：<b>...</b>，开标签是什么，闭标签就必须是什么
 *      · 成对引号：'...' 与 "..."，用同一个组引用就能一套搞定
 *      · 重复单词检测（"the the"、"非常 非常"）
 *      · 回文串判定、代码里重复出现的字面量
 *
 * 3. 核心语法要点
 *    \1 \2 ... \9 ...   按捕获组编号引用（编号 >9 时写法仍有歧义，建议用具名）
 *    \k<name>           引用名为 name 的捕获组
 *    引用的是"当前这一次匹配中该组已经捕获到的文本"，如果该组尚未参与匹配
 *    （比如落在未选中的分支里），反向引用会失败。
 *    在字符类 [ ] 里，\1 会被解释成"八进制转义"，不是反向引用。
 *
 * 4. 常见陷阱
 *    (1) 反向引用与量词结合时容易误判：/(ab)\1/ 匹配 "abab"，但 /(ab)+\1/ 的含义是
 *        "ab 重复若干次之后，再出现一次'最后一次迭代'的内容"（在本例里恰好也是 abab）。
 *    (2) 反向引用会显著增加回溯开销，是 ReDoS 的常见成因之一（见 13 号文件）。
 *    (3) 编号容易漂移：插入一个新括号，\1 的含义就变了。这也正是具名引用的价值。
 *    (4) 忘记在字符串里转义反斜杠：写 new RegExp 时要写成 '\\1' 或 String.raw`\1`。
 *    (5) \1 在字符类内部不是反向引用：/[\1]/ 表示码点 1 的字符，与分组无关。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/06_backreferences.js
 *
 * 【预期输出】
 *   打印每条含反向引用的正则能否匹配，并给出正例/反例对照，
 *   最后用"提取成对标签内容"的实战例子把反向引用用起来。
 * ============================================================================
 */

/** 判定并打印匹配结果，含捕获组 */
function check(label, re, str) {
  const m = re.exec(str);
  if (!m) {
    console.log(`  ${label}  →  不匹配   （文本 ${JSON.stringify(str)}）`);
    return null;
  }
  const groups = [];
  for (let i = 1; i < m.length; i++) groups.push(JSON.stringify(m[i]));
  console.log(`  ${label}  →  匹配 "${m[0]}"  组=[${groups.join(', ')}]`);
  return m;
}

console.log('--- 1. 反向引用 vs 重复模式：先看清区别 ---');

const samples = ['aa', 'bb', 'ab', 'ba', 'a1', '11'];

console.log('  正则 /(a|b)\\1/ —— "同一个字符重复两次"：');
for (const s of samples) check(`文本 ${JSON.stringify(s).padEnd(6)}`, /(a|b)\1/, s);

console.log('  正则 /(a|b)(a|b)/ —— "两个各自独立的候选字符"：');
for (const s of samples) check(`文本 ${JSON.stringify(s).padEnd(6)}`, /(a|b)(a|b)/, s);
console.log('  对照结论：前者要求"两处内容完全一样"，后者只要"两处都在候选集里"。');

console.log('--- 2. 重复单词检测（经典应用） ---');

// 逐符号解释 /\b(\w+)\s+\1\b/：
//   \b      单词边界
//   (\w+)   组 1：一个或多个单词字符
//   \s+     一个或多个空白
//   \1      反向引用：这里的文本必须与组 1 刚才捕获的完全相同
//   \b      单词边界
const dupRe = /\b(\w+)\s+\1\b/;

// 注意：正则字面量里 \b 是"单词边界"，写 printf 风格的 \b 要注意区分。
const dupCases = [
  'this is is a test',
  'the cat sat on the mat',
  'go go go',
  'no duplicate here',
];
for (const c of dupCases) {
  const m = dupRe.exec(c);
  console.log(`  ${JSON.stringify(c).padEnd(30)} → ${m ? '发现重复词 ' + JSON.stringify(m[1]) : '没有重复词'}`);
}

// 带 g 就能找出所有重复词，并用 replace 去重。
const noisy = 'we we should should fix fix this';
console.log('  原文 =', JSON.stringify(noisy));
console.log('  去重后 =', JSON.stringify(noisy.replace(/(\b\w+\b)(\s+\1\b)+/g, '$1')));
// 上面这条替换正则的解释：
//   (\b\w+\b)     组 1：一个完整的单词
//   (\s+\1\b)+    组 2：后面跟着"同样的单词"，重复一次或多次
//   替换成 '$1' 就是把重复的整串压缩成一个单词

console.log('--- 3. 成对引号：一套正则搞定两种引号 ---');

const quoteRe = /(["'])(.*?)\1/;
const quoteCases = [
  `say "hello" now`,
  `say 'hello' now`,
  `mixed "hello' quotes`,
];
console.log('  正则 =', quoteRe);
for (const c of quoteCases) {
  const m = quoteRe.exec(c);
  if (m) {
    console.log(`  ${JSON.stringify(c).padEnd(28)} → 引号=${JSON.stringify(m[1])} 内容=${JSON.stringify(m[2])}`);
  } else {
    console.log(`  ${JSON.stringify(c).padEnd(28)} → 引号不配对，不匹配`);
  }
}
console.log("  这条正则的妙处：([\"']) 捕获到的是哪种引号，\\1 就要求闭合用哪一种，");
console.log('  所以 "hello\' 这种混用的写法会被自动排除。');

console.log('--- 4. 成对标签：反向引用最有价值的场景 ---');

// 逐符号解释 /<(\w+)>(.*?)<\/\1>/：
//   <          字面左尖括号
//   (\w+)      组 1：标签名（字母/数字/下划线）
//   >          字面右尖括号
//   (.*?)      组 2：标签内容，惰性匹配（尽量少）
//   <\/        字面 "</"，其中 / 需要转义是因为它同时是分隔符
//   \1         反向引用：闭合标签名必须与开标签名相同
//   >          字面右尖括号
//   s 标志让 . 能跨越换行
const tagRe = /<(\w+)>(.*?)<\/\1>/s;

const html = '<b>粗体</b><i>斜体</i><div>容器<span>嵌套</span></div>';
console.log('  文本 =', html);
for (const m of html.matchAll(new RegExp(tagRe.source, tagRe.flags + 'g'))) {
  console.log(`    标签 <${m[1]}> 内容=${JSON.stringify(m[2])}（整体 ${JSON.stringify(m[0])}）`);
}
console.log('  注意：/div 与 /span 都会被正确配对，因为反向引用校验了标签名。');

// 反例：标签不配对时不会匹配。
check('不配对的 <b>x</i>', /<(\w+)>(.*?)<\/\1>/, '<b>x</i>');

console.log('--- 5. 编号反向引用的脆弱性 ---');

const target = 'key=value;key=value;other=x;';

// 版本 A：只有一个组，\1 引用它。
console.log('  版本 A /(\\w+)=([^;]*);\\1=/');
for (const m of target.matchAll(/(\w+)=([^;]*);\1=/g)) {
  console.log(`    整体=${JSON.stringify(m[0])} 组1=${JSON.stringify(m[1])} 组2=${JSON.stringify(m[2])}`);
}

// 版本 B：仅仅在开头多加了一对括号用于"分组不捕获"之外的用途，\1 的含义就变了。
console.log('  版本 B /((\\w+)=([^;]*);)\\2=/  —— 编号整体后移，必须同步改引用');
for (const m of target.matchAll(/((\w+)=([^;]*);)\2=/g)) {
  console.log(`    整体=${JSON.stringify(m[0])} 组1=${JSON.stringify(m[1])} 组2=${JSON.stringify(m[2])}`);
}
console.log('  教训：正则一改，\\1 就可能指向别的东西，所以更推荐具名反向引用。');

console.log('--- 6. 具名反向引用 \\k<name> ---');

// 语法：(?<name>...) 定义具名组，\k<name> 反向引用它。需要 ES2018+（Node 10+）。
// 逐符号解释 /(?<quote>["'])(?<body>.*?)\k<quote>/：
//   (?<quote>["'])      具名组 quote：捕获一个引号
//   (?<body>.*?)        具名组 body：惰性捕获引号之间的内容
//   \k<quote>           反向引用 quote 组捕获到的那个引号
const namedQuote = /(?<quote>["'])(?<body>.*?)\k<quote>/;

const sentence = `he said "hi" then 'bye'`;
console.log('  正则 =', namedQuote, '  文本 =', JSON.stringify(sentence));
for (const m of sentence.matchAll(new RegExp(namedQuote.source, 'g'))) {
  console.log(`    引号=${JSON.stringify(m.groups.quote)} 内容=${JSON.stringify(m.groups.body)}`);
}
console.log('  好处：\\k<quote> 一眼能看出引用了谁，插入新组也不会破坏它。');

// 同样用命名引用重写成对标签，可读性明显更好。
const namedTag = /<(?<tag>\w+)>(?<inner>.*?)<\/\k<tag>>/s;
const m2 = namedTag.exec('<p>段落</p>');
console.log('  具名版标签正则的 groups =', m2.groups);
console.log('  捕获组编号仍然是自动分配的：', JSON.stringify(m2[1]), JSON.stringify(m2[2]));

console.log('--- 7. 陷阱：字符类里的 \\1 不是反向引用 ---');

// 在 [ ] 内部，\1 被解释为八进制转义（码点 1 的字符），而不是"引用组 1"。
const inClass = /([a-z])[\1]/;
console.log('  /([a-z])[\\1]/.source =', JSON.stringify(inClass.source));
check('在字符类里用 \\1', /([a-z])[\1]/, 'aa');
console.log('  说明：这里没匹配到 "aa"，因为 [\\1] 并不是"组 1 的内容"，而是码点 1 的字符。');
check('把它挪到字符类外面就正常了', /([a-z])\1/, 'aa');

console.log('--- 8. 陷阱：引用一个"没参与匹配"的组 ---');

// 先看一个"看起来应该不匹配、实际却匹配了"的反直觉例子。
// 正则 (a)|(b)\1 的两个分支是：(a) 与 (b)\1。
check('(a)|(b)\\1 对 "bb"', /(a)|(b)\1/, 'bb');
check('(a)|(b)\\1 对 "bc"', /(a)|(b)\1/, 'bc');
console.log('  说明：走 (b) 分支时组 1 并没有参与匹配，此时 \\1 引用的内容不存在。');
console.log('        V8 引擎把它当成"空匹配"，于是 "b" 之后就什么都不用匹配，直接成功。');
console.log('        这是极易误用的写法 —— 想要"引用前面的内容"，就不该让那个组落在别的分支里。');

// 更实用的对照：组确实参与了匹配，但内容不同，此时反向引用就会失败。
check('(?<x>[a-z])\\k<x> 对 "cc"', /(?<x>[a-z])\k<x>/, 'cc');
check('(?<x>[a-z])\\k<x> 对 "cd"', /(?<x>[a-z])\k<x>/, 'cd');
console.log('  说明："cd" 里组 x 捕获到 "c"，而 \\k<x> 要求后面也是 "c"，实际是 "d"，所以失败。');

console.log('--- 9. 在 RegExp 构造器里写反向引用 ---');

// 在 JS 字符串里，'\1' 会被当成"八进制转义"，也就是码点 1 那个控制字符，
// 而不是"反斜杠 + 数字 1"。想得到两个字符 '\' 和 '1'，必须写成 '\\1'。
console.log('  "\\\\1" 的长度 =', '\\1'.length, ' 内容 =', JSON.stringify('\\1'));
// 顺带演示反面写法：注意本例所在的是 ESM 模块，天然处于严格模式，
// 严格模式下八进制转义是语法错误，所以这里只能用 String.fromCharCode 造出同样的字符。
const octalLike = String.fromCharCode(1);
console.log('  八进制转义 \\1 实际代表的字符码点 =', octalLike.charCodeAt(0));
console.log('  如果直接把这种字符传进 new RegExp，会得到乱码般的模式 =',
  JSON.stringify(new RegExp('a' + octalLike).source));
console.log('  ↑ 这就是"忘记写双反斜杠"时正则静默失效的原因。');

const builtByString = new RegExp('(\\w+)\\s+\\1'); // 正确：\\1 传给 RegExp 后才是反向引用
console.log('  正确拼出的正则 =', builtByString, ' 对 "ha ha" 的结果 =', builtByString.test('ha ha'));

// 用 String.raw 可以免去双重转义，写起来最接近正则字面量。
const builtByRaw = new RegExp(String.raw`(\w+)\s+\1`);
console.log('  用 String.raw 拼出的正则 =', builtByRaw, ' 对 "ha ha" 的结果 =', builtByRaw.test('ha ha'));

console.log('--- 10. 小结 ---');
console.log('· 反向引用匹配的是"内容相同"，不是"模式相同"。');
console.log('· \\1 易漂移，\\k<name> 更稳；新代码建议优先用具名组。');
console.log('· 成对引号、成对标签、重复单词是反向引用的三大经典场景。');
console.log('· 字符类里没有反向引用；构造器里要写 ' + "'\\\\1'" + ' 或 String.raw。');
