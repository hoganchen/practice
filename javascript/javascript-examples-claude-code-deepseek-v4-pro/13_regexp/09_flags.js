/**
 * ============================================================================
 * 知识点：修饰符 g i m s u y 各自的含义与组合效果
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】进阶
 * 【前置知识】13_regexp/01_basics_and_literals.js、13_regexp/04_anchors_and_boundaries.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    修饰符（flag，也叫标志）写在正则字面量的第二个斜杠之后，或者作为
 *    new RegExp(pattern, flags) 的第二个参数。它们不改变"模式本身"，
 *    而是改变"匹配策略"：找几次、要不要区分大小写、^$ 指哪里、. 的范围、
 *    以及按什么规则解释字符。
 *
 * 2. 为什么需要
 *    同一段模式在不同场景下的期望行为并不相同：
 *    搜索框要"忽略大小写 + 找全部"，日志解析要"逐行"，处理 emoji 要"按码点"，
 *    词法分析器要"严格按位置连续匹配"。这些差异全部由标志来表达。
 *
 * 3. 核心语法要点
 *    g  global     全局匹配：找出全部匹配，而不是找到第一个就停。
 *                  带 g 的正则会维护 lastIndex（01 号文件详述）。
 *    i  ignoreCase 忽略大小写。对 Unicode 也会做一定的大小写折叠，
 *                  但只有在 u 模式下才完整（Unicode 简单大小写折叠）。
 *    m  multiline  多行模式：^ 和 $ 分别匹配"每行的开头 / 结尾"，
 *                  而不只是整串的首尾。
 *    s  dotAll     dotAll：让 . 也能匹配换行符（默认 . 不匹配行终止符）。
 *    u  unicode    Unicode 模式：按"码点"而不是"UTF-16 码元"处理，
 *                  并且开启 \p{...}、\u{...} 等 Unicode 语法。
 *    y  sticky    粘性匹配：从 lastIndex 处"必须正好接上"，不允许向后滑动。
 *    d  indices   让 exec 结果多出一个 .indices 属性，记录每组的起止下标。
 *    ---- 组合 ----
 *    标志可以自由组合，写法如 /x/gimsuy。顺序无所谓，但 flags 属性会按
 *    字母表顺序（d g i m s u v y）规范化输出。
 *
 * 4. 常见陷阱
 *    (1) g 与 y 都不能与"期望无状态"的用法混用（lastIndex 残留）。
 *    (2) 忘记 u 会导致 emoji 被"劈成两半"：'😀'.length 是 2，
 *        /^.$/.test('😀') 在非 u 模式下是 false，加 u 才是 true。
 *    (3) m 只影响 ^ $，不影响 \b，也不影响 . （那是 s 的事）。
 *    (4) y 与 g 的区别：g 允许向后滑动找，y 不允许，所以 y 是"词法分析器"模式。
 *    (5) 在同一个正则上反复用 g + test 会出现 true/false 交替（见 01 号文件）。
 *    (6) u 模式下，非法的转义（如 \a）会直接抛 SyntaxError；非 u 模式下会被当作字面量。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/09_flags.js
 *
 * 【预期输出】
 *   逐个标志演示其效果，并给出"同一个模式加不加标志"的对照表，
 *   最后演示 y 与 g 的行为差异以及常见错误标志组合的报错。
 * ============================================================================
 */

/** 打印所有匹配（含位置） */
function show(label, re, str) {
  const flags = re.flags.includes('g') || re.flags.includes('y') ? re.flags : re.flags + 'g';
  const g = new RegExp(re.source, flags);
  g.lastIndex = 0;
  const out = [];
  let m;
  let guard = 0;
  while ((m = g.exec(str)) !== null && guard++ < 200) {
    out.push(`"${m[0]}"@${m.index}`);
    if (m[0] === '') g.lastIndex++;
    if (!g.global && !g.sticky) break; // 没有 g/y 时 exec 永远从 0 开始，手动跳出
  }
  console.log(`  ${label} → ${out.length} 处：${out.join('  ') || '（无）'}`);
}

console.log('--- 1. g（global）：找出全部，而不是第一个 ---');

const sentence = 'The cat and the cat and the CAT';
console.log('  文本 =', JSON.stringify(sentence));

// 注意：本文件顶部的 show() 辅助函数为了方便观察，会自动给正则补上 g。
// 要展示"没有 g"的行为，必须直接用 exec，因为无 g 的 exec 永远只返回第一个匹配。
console.log('  无 g 的 exec =>', JSON.stringify(/cat/.exec(sentence)[0]), '（只返回第一个）');
console.log('  无 g 的 exec 再来一次 =>', JSON.stringify(/cat/.exec(sentence)[0]), '（还是第一个，无状态）');
console.log('  无 g 但用 match(/g) 只能逐个手动推进，很不方便。');
show('有 g（找出全部）', /cat/g, sentence);
console.log('  注意：i 没加，所以两处小写的 cat 被找到，大写的 CAT 没有。');

console.log('--- 2. i（ignoreCase）：忽略大小写 ---');

show('有 gi', /cat/gi, sentence);
console.log('  String.replace 也是一样：加 g 才能替换全部。');
console.log('    无 g =>', sentence.replace(/cat/, 'dog'));
console.log('    有 g =>', sentence.replace(/cat/g, 'dog'));

console.log('--- 3. i 与 Unicode 的大小写折叠 ---');

// 拉丁字母之外的字符也有大小写，例如希腊字母 Σ/σ/ς、西里尔字母 А/а。
console.log('  /Σ/i 匹配 "σ" =>', /Σ/i.test('σ'));
console.log('  开尔文符号 K(U+212A) 与拉丁字母 k 在 iu 下等价：');
console.log('    /k/i  匹配 "\\u212A" =>', /k/i.test('K'));
console.log('    /k/iu 匹配 "\\u212A" =>', /k/iu.test('K'));
console.log('    /k/u  匹配 "\\u212A" =>', /k/u.test('K'));
console.log('  说明：加上 u 之后才会启用完整的 Unicode 大小写折叠规则。');

console.log('--- 4. m（multiline）：让 ^ $ 逐行生效 ---');

const multiline = 'alpha\nbeta\ngamma';
console.log('  文本 =', JSON.stringify(multiline));
show('^\\w+（无 m，只认串首）', /^\w+/, multiline);
show('^\\w+（有 m，认每行行首）', /^\w+/m, multiline);
show('\\w+$（无 m，只认串尾）', /\w+$/, multiline);
show('\\w+$（有 m，认每行行尾）', /\w+$/m, multiline);
console.log('  强调：m 只影响 ^ 与 $ 的含义，对 . 是否跨行毫无影响（那是 s 的事）。');
show('a.b（m 无法让 . 跨行）', /a.b/m, 'a\nb');
show('a.b（s 才能让 . 跨行）', /a.b/s, 'a\nb');

console.log('--- 5. s（dotAll）：让 . 匹配换行 ---');

const block = 'start\nmiddle\nend';
console.log('  文本 =', JSON.stringify(block));
show('start.+end（无 s）', /start.+end/, block);
show('start.+end（有 s）', /start.+end/s, block);
console.log('  s 的典型用途：跨行提取注释块、跨行的 HTML 片段等。');
console.log('  等价写法：把 . 换成 [\\s\\S]，即"任意字符（含换行）"，不依赖 s。');
show('start[\\s\\S]+end（不用 s 的等价写法）', /start[\s\S]+end/, block);

console.log('--- 6. u（unicode）：按码点处理，并解锁 \\p{...} ---');

const emoji = '😀';
console.log('  "😀" 的 .length =', emoji.length, '（UTF-16 里它占两个码元）');
console.log('  "😀" 的码点数 =', [...emoji].length);
console.log('  /^.$/.test("😀")   =>', /^.$/.test(emoji), '（非 u 模式把代理对看成两个字符）');
console.log('  /^.$/u.test("😀")  =>', /^.$/u.test(emoji), '（u 模式按码点看，是一个字符）');

// \u{...} 这种大码点转义只有 u 模式认识。
console.log('  /\\u{1F600}/u.test("😀") =>', /\u{1F600}/u.test(emoji));
show('\\p{Script=Han}+ 需要 u', /\p{Script=Han}+/u, '中文abc中文');
show('\\p{Emoji}+ 需要 u', /\p{Emoji}+/u, 'hi😀there🎉!');

// 非 u 模式下 \p{...} 不会被当成 Unicode 属性，而是被当作字面字符 p{...}。
show('非 u 模式下 \\p{Script=Han} 退化成字面量', /\p{Script=Han}/, 'p{Script=Han}');

console.log('--- 7. y（sticky）：必须正好接上，不许向后滑动 ---');

const stickyText = 'aaa bbb aaa';

// 先看 g 的"向后找"行为：每次从 lastIndex 开始，找不到就往后挪。
const gRe = /aaa/g;
gRe.lastIndex = 0;
console.log('  g 版本：');
console.log('    lastIndex=0 找到 =>', JSON.stringify(gRe.exec(stickyText)?.[0]), ' 新 lastIndex =', gRe.lastIndex);
console.log('    lastIndex=4 找到 =>', JSON.stringify(gRe.exec(stickyText)?.[0]), ' 新 lastIndex =', gRe.lastIndex);
console.log('  ↑ g 允许跳过中间的 "bbb"，一路往后滑到第二个 "aaa"。');

// 再看 y：lastIndex 处必须正好是 aaa，否则直接失败并复位。
const yRe = /aaa/y;
yRe.lastIndex = 0;
console.log('  y 版本：');
console.log('    lastIndex=0 找到 =>', JSON.stringify(yRe.exec(stickyText)?.[0]), ' 新 lastIndex =', yRe.lastIndex);
console.log('    lastIndex=4 找到 =>', String(yRe.exec(stickyText)), '（4 号位置是空格，粘性匹配失败）');
console.log('  ↑ y 不滑动：lastIndex 指向哪里就必须从哪里接上，因此特别适合手写词法分析器。');

// 手写 tokenizer 的极简演示：用 y 逐个吃掉 token。
const code = 'let x=42;';
const tokenRe = /\s+|let|[a-zA-Z_]\w*|\d+|[^\s\w]/y;
const tokens = [];
let pos = 0;
for (;;) {
  tokenRe.lastIndex = pos;
  const tk = tokenRe.exec(code);
  if (!tk) break;
  const kind = /^\s+$/.test(tk[0]) ? '空白' : /^\d+$/.test(tk[0]) ? '数字' : /^[a-zA-Z_]/.test(tk[0]) ? '标识符' : '符号';
  tokens.push(`${kind}:${JSON.stringify(tk[0])}`);
  pos = tokenRe.lastIndex;
}
console.log('  用 y 做词法扫描 "let x=42;" =>', tokens.join(' '));

console.log('--- 8. d（indices）：拿到每个捕获组的起止位置 ---');

// d 标志（ES2022）让 exec 结果多一个 indices 数组，元素是 [start, end] 或 undefined。
const dRe = /(?<year>\d{4})-(?<month>\d{2})/d;
const dm = dRe.exec('日期 2026-09-16');
console.log('  m.indices =', JSON.stringify(dm.indices));
console.log('  m.indices.groups =', JSON.stringify(dm.indices.groups));
console.log('  校验一下：m[1] =', JSON.stringify(dm[1]),
  '，切片 [', dm.indices[1][0], ',', dm.indices[1][1], ') =',
  JSON.stringify('日期 2026-09-16'.slice(dm.indices[1][0], dm.indices[1][1])));
console.log('  d 的用途：做语法高亮、编辑器标注、把匹配位置精确映射回原文。');

console.log('--- 9. flags 属性与组合顺序 ---');

const combo = /x/gimsuy;
console.log('  /x/gimsuy 的 .flags =', JSON.stringify(combo.flags), '（会被规范化成字母表顺序）');
console.log('  .global =', combo.global, ' .ignoreCase =', combo.ignoreCase,
  ' .multiline =', combo.multiline, ' .dotAll =', combo.dotAll,
  ' .unicode =', combo.unicode, ' .sticky =', combo.sticky);

console.log('--- 10. 陷阱：非法标志会抛错 ---');

// 重复标志与未知标志都是语法错误，必须用 try/catch 兜住。
for (const flags of ['gg', 'z', 'gy']) {
  try {
    const re = new RegExp('a', flags);
    console.log(`  标志 ${JSON.stringify(flags)} => 通过：${re}`);
  } catch (err) {
    console.log(`  标志 ${JSON.stringify(flags)} => ${err.constructor.name}: ${err.message.split('\n')[0]}`);
  }
}
console.log('  说明："gy" 本身是合法的组合（同时带 g 与 y），但实际使用时 y 会主导行为。');

console.log('--- 11. 陷阱：u 模式下非法转义会报错 ---');

// 非 u 模式下 \a 会被当作字面字符 a（兼容行为）；u 模式下直接是语法错误。
console.log('  非 u 模式 /\\a/ 的 source =', JSON.stringify(/\a/.source), '，能匹配 "a" =>', /\a/.test('a'));
try {
  const bad = new RegExp('\\a', 'u');
  console.log('  不会走到这里：', bad);
} catch (err) {
  console.log('  u 模式下 new RegExp("\\\\a", "u") =>', err.constructor.name + ': ' + err.message.split('\n')[0]);
}
console.log('  建议：写新正则时优先加 u，让错误尽早暴露，而不是静默降级成字面量。');

console.log('--- 12. 小结 ---');
console.log('· g 找全部、i 忽略大小写、m 让 ^$ 逐行、s 让 . 跨行。');
console.log('· u 按码点处理并解锁 \\p{...}；y 要求从 lastIndex 处严格接上。');
console.log('· g 与 y 都会维护 lastIndex，复用同一个正则对象时要记得复位。');
console.log('· 标志可以自由组合，非法或重复的标志会直接抛 SyntaxError。');
