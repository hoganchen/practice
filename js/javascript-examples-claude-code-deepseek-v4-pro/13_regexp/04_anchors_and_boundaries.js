/**
 * ============================================================================
 * 知识点：锚点 ^ $、单词边界 \b \B、多行模式 m
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】入门
 * 【前置知识】13_regexp/01_basics_and_literals.js、13_regexp/03_quantifiers.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    前面几课讲的字符类、量词都在回答"匹配什么字符"。锚点（anchor）回答的是
 *    另一个问题："这个匹配必须出现在什么位置"。
 *    锚点与边界都是"零宽断言"（zero-width assertion）：它们不消耗任何字符，
 *    只对"当前位置"提出约束，所以匹配结果里看不到它们，index 也不会因它们移动。
 *      · ^    断言当前位置是"输入的开头"（加 m 标志后：也是一行的开头）
 *      · $    断言当前位置是"输入的结尾"（加 m 标志后：也是一行的结尾）
 *      · \b   单词边界：当前位置的一左一右，恰好只有一边是"单词字符"（\w）
 *      · \B   非单词边界：\b 的补集
 *
 * 2. 为什么需要
 *    没有锚点时，/cat/ 能在 "concatenate" 里也匹配到 cat —— 这通常不是你想要的。
 *    加上 /\bcat\b/ 才能表达"独立的单词 cat"。
 *    校验类场景更是离不开锚点：/^\d{11}$/ 表示"整串必须恰好是 11 位数字"，
 *    漏掉 ^ 和 $ 就变成"只要包含 11 位数字就行"，校验立刻失去意义。
 *
 * 3. 核心语法要点
 *    (1) m 标志（multiline）让 ^ 和 $ 从"整串首尾"放宽到"每一行的首尾"。
 *        行的分隔依据是换行符 \n（\r 也算，因为它们都属于行终止符）。
 *    (2) \b 的判定完全基于 \w 的定义。JS 的 \w = [A-Za-z0-9_]，
 *        所以 \b 出现的位置是：
 *          · 一个 \w 字符与一个非 \w 字符之间
 *          · 一个 \w 字符与字符串开头 / 结尾之间
 *    (3) \b 不占位置：/(\bcat\b)/ 的捕获组 1 内容仍然是 "cat"，不是边界本身。
 *
 * 4. 常见陷阱
 *    (1) JS 的 $ 与 Perl/Python 不同：不加 m 时，$ 只匹配"输入的最末尾"，
 *        它不会匹配"末尾换行符之前"的位置。所以 /a$/.test('a\n') 在 JS 里是 false。
 *    (2) 中文用户最容易踩的坑：\b 只认 ASCII 单词字符。汉字属于"非单词字符"，
 *        于是 "中文abc" 里 a 前面存在 \b —— 把中文当"词"处理时这往往是错的。
 *        处理中文时，应该用 (?<![\p{Script=Han}]) 这类 Unicode 断言，或干脆用 ^ $。
 *    (3) 下划线属于 \w：'foo_bar' 里 foo 与 bar 之间没有 \b，所以 /\bfoo\b/ 匹配不到。
 *    (4) 忘记加 m 就写 /^xxx/m 之外的用法，导致"明明每行都有却只匹配到一行"。
 *    (5) 锚点写在分组内部只约束那一组的位置，不会约束整串，容易写错。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/04_anchors_and_boundaries.js
 *
 * 【预期输出】
 *   对比无锚点 / 有 ^$ / 加 m / 用 \b 的匹配差异，并打印每次匹配的 index，
 *   最后给出 \b 在中文场景下"失效"的实证。
 * ============================================================================
 */

/** 打印 str 中所有匹配（含位置），便于观察锚点的零宽特性 */
function show(label, re, str) {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const g = new RegExp(re.source, flags);
  const out = [];
  let m;
  while ((m = g.exec(str)) !== null) {
    out.push(`"${m[0]}"@${m.index}`);
    if (m[0] === '') g.lastIndex++;
  }
  console.log(`  ${label} → ${out.length} 处：${out.join('  ') || '（无）'}`);
}

console.log('--- 1. 没有锚点时的"误伤" ---');

const s1 = 'cat concatenate cat.';
show('/cat/', /cat/, s1);
console.log('  注意 "concatenate" 里的 cat 也被匹配了 —— 这通常不是我们想要的。');

console.log('--- 2. ^ 与 $：把匹配钉死在整串的首尾 ---');

const s2 = 'abc123';
show('^abc', /^abc/, s2); // 匹配：abc 正好在开头
show('abc$', /abc$/, s2); // 无匹配：abc 后面还有 123，不在结尾
show('^\\d+$', /^\d+$/, s2); // 无匹配：整串不是"纯数字"
show('^\\w+$', /^\w+$/, s2); // 匹配：整串都是单词字符

// 校验场景的经典对照：锚点决定了"包含"还是"整体就是"。
console.log('  /\\d{3}/.test("12345")   =>', /\d{3}/.test('12345'), '（包含 3 位数字即可）');
console.log('  /^\\d{3}$/.test("12345") =>', /^\d{3}$/.test('12345'), '（必须是恰好 3 位）');
console.log('  /^\\d{3}$/.test("123")   =>', /^\d{3}$/.test('123'));

console.log('--- 3. JS 特有的细节：不加 m 时 $ 不匹配"末尾换行之前" ---');

const withNewline = 'hello\n';
console.log('  文本 =', JSON.stringify(withNewline));
console.log('  /hello$/.test("hello\\n")  =>', /hello$/.test('hello\n'));
console.log('  说明：在 Perl / Python / PCRE 里这个结果是 true，JS 里是 false。');
console.log('        这是 JS 正则一个容易被忽略的差异，写跨语言代码时要小心。');
console.log('  加了 m 之后 =>', /hello$/m.test('hello\n'), '（m 让 $ 也能匹配行尾）');

console.log('--- 4. m 标志：让 ^ $ 逐行生效 ---');

const multiline = 'first line\nsecond line\nthird line';
console.log('  文本 =', JSON.stringify(multiline));

show('^third（无 m）', /^third/, multiline); // 无匹配
show('^third（有 m）', /^third/m, multiline); // 匹配

// 逐符号解释 /^\w+/gm：
//   ^     行首（因为带了 m）
//   \w+   一个或多个单词字符
//   g     找出全部匹配
//   m     多行模式
show('^\\w+ 带 g 带 m（取每行第一个单词）', /^\w+/m, multiline);

const lines = multiline.split('\n').length;
console.log('  文本共', lines, '行，上面正好匹配到', lines, '处，每行一处。');

// 行尾锚点的用法：给每一行统一加个后缀（04 与 10 号文件配合使用）
const tagged = multiline.replace(/$/m, ' ← 行尾');
console.log('  用 replace(/$/m, ...) 在每行末尾插入标记：');
console.log('  ' + JSON.stringify(tagged));

console.log('--- 5. \\b 单词边界 ---');

const s3 = 'cat concatenate cat. _cat the cat9';

// \b 的位置判定：左边是"词字符 ↔ 非词字符"的切换点。
show('/\\bcat\\b/', /\bcat\b/, s3);
console.log('  逐个解释上面的结果：');
console.log('   · "cat"（位置 0）         ：左边是串首，右边是空格 → 前后都是边界，匹配');
console.log('   · "concatenate" 里的 cat  ：前面紧跟字母 n，不是边界 → 不匹配');
console.log('   · "cat."（位置 16）       ：后面是点号（非词字符）→ 匹配');
console.log('   · "_cat"（位置 21）       ：前面是下划线（属于 \\w）→ 不是边界，不匹配');
console.log('   · "cat9"（位置 30）       ：后面是数字（属于 \\w）→ 不是边界，不匹配');

console.log('--- 6. \\b 的"零宽"性质：不消耗字符 ---');

// 边界本身不占宽度，所以匹配文本依旧是 "cat"，index 是 c 的下标。
const bm = /\bcat\b/.exec(s3);
console.log('  exec 结果 [0] =', JSON.stringify(bm[0]), '，index =', bm.index);
console.log('  匹配长度 =', bm[0].length, '（正好 3 个字符，边界本身没有贡献任何长度）');

// 用带分组的写法验证：捕获组里也只有 cat 本身。
const bm2 = /(\b)(cat)(\b)/.exec(s3);
console.log('  /(\\b)(cat)(\\b)/ 的三个捕获组 =',
  JSON.stringify(bm2[1]), JSON.stringify(bm2[2]), JSON.stringify(bm2[3]));
console.log('  三个组的长度分别是', bm2[1].length, bm2[2].length, bm2[3].length, '（边界组长度为 0）');

console.log('--- 7. \\B 非单词边界：\\b 的补集 ---');

const s4 = 'xtz x z';
show('/\\Bz/', /\Bz/, s4);
console.log('  解释："xtz" 里的 z 前面是 t（都是词字符）→ 非边界 → 匹配；');
console.log('        " z" 里的 z 前面是空格（词字符变非词字符）→ 是边界 → \\B 不匹配。');

console.log('--- 8. 陷阱：\\b 只认 ASCII，中文场景会失效 ---');

const cn = '这是中文hello世界';
console.log('  文本 =', cn);
// 汉字不属于 \w，所以"中文hello"之间会被判定为存在单词边界。
show('/\\bhello\\b/', /\bhello\b/, cn);
console.log('  解释：hello 在中文里被匹配到了，因为汉字对 \\b 而言等同"非单词字符"，');
console.log('        相当于中文被当成了空格。把中文视作"词"时，这个结果通常是错的。');

// 想正确表达"中文语境下的词边界"，要用 Unicode 属性 + 后顾断言（08 号文件详述）。
// (?<![\p{Script=Han}]) 的含义：当前位置前面不能是一个汉字。
const cnStrict = /(?<![\p{Script=Han}])hello(?![\p{Script=Han}])/u;
show('用 Unicode 后顾断言严格限定', cnStrict, cn);
console.log('  说明：这里 hello 前后都是汉字，所以被正确排除了。');

console.log('--- 9. 锚点与 replace 的配合：给每一行加前缀 ---');

const code = 'let a = 1;\nlet b = 2;';
const commented = code.replace(/^/gm, '# ');
console.log('  原文 =', JSON.stringify(code));
console.log('  用 replace(/^/gm, "# ") 后 =', JSON.stringify(commented));
console.log('  说明：^ 本身长度为 0，所以 replace 的效果就是"在每个行首插入文本"。');

console.log('--- 10. 小结 ---');
console.log('· ^ $ 是零宽锚点，只约束位置，不消耗字符，也不出现在匹配结果里。');
console.log('· 加 m 后 ^ $ 变成"逐行"生效；不加 m 时 $ 在 JS 里只认整串末尾。');
console.log('· \\b 的判定基于 \\w = [A-Za-z0-9_]，不认中文、不认连字符、不认空格。');
console.log('· 校验类正则务必用 ^...$ 包住，否则会从"整体校验"退化成"包含判断"。');
