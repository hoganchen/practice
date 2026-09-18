/**
 * ============================================================================
 * 知识点：字符类 —— \d \D \w \W \s \S . 与自定义 [abc] [^abc] [a-z]
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】入门
 * 【前置知识】13_regexp/01_basics_and_literals.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    字符类（character class）描述"某个位置上允许出现哪些字符"。
 *    它一次只匹配"一个字符"，是构成正则的最小积木之一。
 *    分两类：
 *      · 预定义字符类（简写）：\d \D \w \W \s \S . —— 由语言内置的常用集合。
 *      · 自定义字符类：用方括号 [ ] 自己列出允许的字符范围。
 *    两者的关系是"简写 vs 展开"：\d 完全等价于 [0-9]，\w 等价于 [A-Za-z0-9_]。
 *
 * 2. 为什么需要
 *    真实文本里我们很少关心"具体是哪个字符"，只关心"它是哪一类字符"：
 *    数字、字母、空白还是标点。字符类把这层判断压缩成一个符号。
 *
 * 3. 核心语法要点
 *    \d   digit            —— 一个数字，等价 [0-9]
 *    \D   非 \d             —— 等价 [^0-9]
 *    \w   word             —— "单词字符"：字母、数字、下划线，等价 [A-Za-z0-9_]
 *                             注意：\w 不包含中文、不含连字符 '-'、不含空格
 *    \W   非 \w
 *    \s   whitespace       —— 一个空白字符：空格、\t 制表符、\n 换行、
 *                             \r 回车、\f 换页、\v 垂直制表、以及各种 Unicode 空格
 *    \S   非 \s
 *    .    dot              —— 除"行终止符"外的任意一个字符；
 *                             加 s 标志（dotAll）后连换行也能匹配
 *    [abc]   自定义集合：a 或 b 或 c 中的任意一个
 *    [^abc]  取反集合：不是 a 也不是 b 也不是 c 的任意一个字符
 *    [a-z]   范围；[a-zA-Z0-9] 可连写多个范围
 *    [\d-]   在字符类里，\d 这类简写仍然有效；'-' 放在末尾表示字面连字符
 *    字符类里的元字符规则与外部不同：[ . * + ? ( ) ] 在类里都是普通字符，
 *    只有 ] \ ^ - 需要小心（^ 只在开头有意义，- 在中间表示范围）。
 *
 * 4. 常见陷阱
 *    (1) 一个字符类只吃"一个字符"：/\d\d/ 才是两位数字，/\d{2}/ 才是两位。
 *    (2) \w 不认中文：/^\w+$/ 校验"用户名"会把中文用户名判为非法。
 *    (3) '.' 默认不匹配换行，很多人误以为它匹配一切。
 *    (4) [^abc] 只排除三个具体字符，不排除"abc 这个字符串"。
 *    (5) 在字符类里 | 不是"或"，而是一个普通竖线字符：/[a|b]/ 匹配 a、| 或 b。
 *    (6) 忘记给 '-' 转义：[a-z] 是范围，想匹配字面连字符要写 [a\-z] 或 [-az]。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/02_character_classes.js
 *
 * 【预期输出】
 *   每个小节先打印被搜索的字符串，再打印每个匹配到的文本及其下标，
 *   最后打印几个"反例"，让你直观看到字符类的边界在哪里。
 * ============================================================================
 */

/**
 * 小工具：打印出 str 中所有匹配 re 的片段与位置。
 * 参数含义：
 *   label —— 打印用的小标题
 *   re    —— 要用的正则（函数内部会补上 g 标志，保证能找出全部匹配）
 *   str   —— 被搜索的文本
 * 之所以在这里重建一个正则，一是为了补上 g 标志（保证能找出全部匹配），
 * 二是为了避开外面传进来的正则可能残留的 lastIndex 状态（01 号文件讲过的坑）。
 * 注意：必须把原正则的 flags 一起带上，否则 /.../s、/.../u 这类标志会丢失。
 */
function showMatches(label, re, str) {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const g = new RegExp(re.source, flags);
  const out = [];
  let m;
  while ((m = g.exec(str)) !== null) {
    out.push(`"${m[0]}"@${m.index}`);
    // 防御：万一模式能匹配空串（如 /a*/），exec 不会推进 lastIndex，会死循环。
    if (m[0] === '') g.lastIndex++;
  }
  console.log(`${label} 在 ${JSON.stringify(str)} 中匹配到 ${out.length} 处：`, out.join('  '));
}

console.log('--- 1. \\d 与 \\D：数字与非数字 ---');

// \d 表示"一个数字字符"，等价于 [0-9]（只认 ASCII 数字，不认中文数字或罗马数字）。
showMatches('\\d  ', /\d/, '订单 A1001，共 25 元');
showMatches('\\d\\d', /\d\d/, '订单 A1001，共 25 元'); // 两个连着的数字才匹配

// \D 是 \d 的补集：一个"不是数字"的字符。
showMatches('\\D\\D', /\D\D/, 'ab12cd'); // 只有字母连着的地方才匹配

console.log('--- 2. \\w 与 \\W：单词字符与非单词字符 ---');

// \w = [A-Za-z0-9_]：字母、数字、下划线。注意它不含中文、不含连字符、不含空格。
showMatches('\\w+', /\w+/, 'user_name-1 中文');
console.log('说明：上面 "中文" 没有被匹配到，因为 \\w 不包含汉字。');

// 想匹配中文，要用 Unicode 属性转义 \p{Script=Han}（必须带 u 标志），
// 或者用汉字在 Unicode 中的码点区间 [一-龥]（常用字范围）。
// 下面这条正则逐个符号解释：
//   \p{Script=Han}  表示"一个属于汉字（Han 脚本）的字符"，需要 u 标志才生效
//   +               表示前面的汉字出现一次或多次
showMatches('汉字 \\p{Script=Han}+', /\p{Script=Han}+/u, 'user_name-1 中文abc');

// 传统写法：用码点区间。一 是"一"，龥 是常用汉字区的上界。
showMatches('汉字 [\\u4e00-\\u9fa5]+', /[一-龥]+/, 'user_name-1 中文abc');

console.log('--- 3. \\s 与 \\S：空白与非空白 ---');

const spaced = 'a b\tc\nd  e';
console.log('被搜索文本（用 JSON 显示，便于看清 \\t 与 \\n）=', JSON.stringify(spaced));
showMatches('\\s ', /\s/, spaced); // 逐个空白符都会被找到
showMatches('\\s+', /\s+/, spaced); // 连续空白合并成一个匹配

// \S+ 是"连续的非空白"，非常适合"按空白切词"。
showMatches('\\S+', /\S+/, spaced);

console.log('--- 4. . 点号：默认不匹配换行 ---');

const twoLines = 'foo\nbar';
console.log('被搜索文本 =', JSON.stringify(twoLines));
showMatches('f.o', /f.o/, twoLines);
showMatches('b.r', /b.r/, twoLines);
showMatches('foo.bar（跨行）', /foo.bar/, twoLines); // 匹配不到：'.' 跨不过 \n

// 加上 s 标志（dotAll）后，'.' 才真正变成"任意字符"。
showMatches('foo.bar 加 s 标志', /foo.bar/s, twoLines);

console.log('--- 5. 自定义字符类 [abc]：集合里任选一个 ---');

// [abc] 表示"a 或 b 或 c 中的一个字符"，注意它不是一个字符串 "abc"。
showMatches('[abc]', /[abc]/, 'a dog and a cat');

// 常见误区：[abc] 不是"连续的 abc 子串"，所以 "abcd" 里 a、b、c 各匹配一次。
showMatches('[abc] 逐个匹配', /[abc]/, 'abcd');
console.log('验证：[abc] 不是字符串 abc =>', /^[abc]$/.test('abc')); // false，因为要三个字符位置

console.log('--- 6. 自定义字符类 [^abc]：取反 ---');

// [^abc] 表示"不是 a、不是 b、也不是 c 的任意一个字符"（也要注意只吃一个字符）。
showMatches('[^abc]+', /[^abc]+/, 'abcXYZabc123');

// 取反类配合 + 常用来"贪婪地吃掉不含某些字符的一段"。
showMatches('日志级别行 [^\\]]+', /\[[^\]]+\]/, '[INFO] hello [WARN] bye');

console.log('--- 7. 范围写法 [a-z] / [A-Z0-9] / [\\u4e00-\\u9fa5] ---');

showMatches('[a-z]+', /[a-z]+/, 'abcDEFghi123');
showMatches('[A-Z]+', /[A-Z]+/, 'abcDEFghi123');
showMatches('[a-zA-Z]+', /[a-zA-Z]+/, 'abcDEFghi123');
showMatches('[0-9]+', /[0-9]+/, 'abcDEFghi123');
showMatches('混合范围 [A-Za-z0-9_]+', /[A-Za-z0-9_]+/, 'abcDEFghi123');

console.log('--- 8. 字符类内部的元字符规则（最容易踩的坑） ---');

// 陷阱 1：在字符类里，'.' 就是字面点号，不再是"任意字符"。
console.log('[.] 只匹配真点号 =>', /[.]/.test('a'), /[.]/.test('.'));
console.log('但 [.] 不等于任意字符 =>', '[.] 对 "x" 的结果 =', /[.]/.test('x'));

// 陷阱 2：在字符类里，'|' 是普通竖线字符，不是"或"。
showMatches('[a|b] 会匹配到竖线本身', /[a|b]/, 'a|b');

// 陷阱 3：'-' 在中间是范围运算符，要表示字面连字符得放开头/末尾或加反斜杠。
showMatches('[a-z] 是范围', /[a-z]/, 'a-z');
showMatches('[-az] 含字面连字符', /[-az]/, 'a-z');
showMatches('[a\\-z] 同样含字面连字符', /[a\-z]/, 'a-z');

// 陷阱 4：']' 必须转义才能出现在字符类里。
// 注意 JS 与 Perl/POSIX 的差异：在 JS 里 [] 是一个"空字符类"，它什么都匹配不到，
// 所以 /[]]/ 会被解析成"空字符类 + 字面 ]"，永远匹配失败。必须写 [\]]。
console.log('空字符类 [] 的 source =', JSON.stringify(/[]]/.source)); // "[]]"
showMatches('[]] （错误写法，永不匹配）', /[]]/, 'a]b');
showMatches('[\\]] （正确写法）', /[\]]/, 'a]b');

console.log('--- 9. 综合小练习：从日志行里抠出关键字段 ---');

const logLine = '2024-05-01T10:20:30 [ERROR] user_id=42 msg="disk full"';

// 逐段解释下面这条大正则：
//   1. (\d{4})-(\d{2})-(\d{2})   年-月-日：\d{4} 表示"4 个数字"
//   2. T                          字面量字母 T
//   3. (\d{2}):(\d{2}):(\d{2})   时:分:秒
//   4. \s+                        一个或多个空白
//   5. \[(\w+)\]                  \[ 是字面左方括号，(\w+) 捕获级别名，\] 是字面右方括号
//   6. .*?                        惰性匹配任意内容（后面 03 号文件会详细讲惰性）
//   7. user_id=(\d+)              user_id= 之后的数字
//   8. .*?                        惰性匹配任意内容
//   9. "([^"]*)"                  引号里不含引号的一段（[^"] 表示"不是引号"）
const logRe = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\s+\[(\w+)\]\s+.*?user_id=(\d+).*?"([^"]*)"/;
const logMatch = logRe.exec(logLine);

console.log('整行原文 =', logLine);
if (logMatch) {
  console.log('整体匹配 =', JSON.stringify(logMatch[0]));
  console.log('年月日 =', logMatch[1], logMatch[2], logMatch[3]);
  console.log('时分秒 =', logMatch[4], logMatch[5], logMatch[6]);
  console.log('日志级别 =', logMatch[7]);
  console.log('用户 ID =', logMatch[8]);
  console.log('消息内容 =', logMatch[9]);
} else {
  console.log('没有匹配到（理论上不会发生）');
}

console.log('--- 10. 小结 ---');
console.log('· \\d \\w \\s 只是常用集合的简写：\\d=[0-9]，\\w=[A-Za-z0-9_]，\\s=空白。');
console.log('· 一个字符类只消耗一个字符；量词要写在字符类外面。');
console.log('· 字符类里 "." "|" "*" 都是普通字符，只有 ] \\ ^ - 需要留意。');
console.log('· . 默认不匹配换行；需要跨行请加 s 标志。');
