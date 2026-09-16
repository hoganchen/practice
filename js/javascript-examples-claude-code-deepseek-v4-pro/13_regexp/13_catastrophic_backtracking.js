/**
 * ============================================================================
 * 知识点：灾难性回溯（ReDoS）的原理与规避，用小规模输入演示耗时差异
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】高级
 * 【前置知识】13_regexp/03_quantifiers.js、13_regexp/05_groups_and_alternation.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    正则引擎在匹配失败时会"回溯"（backtracking）：把已经吃掉的字符吐回来，
 *    换一种切分方式再试。当模式里存在"嵌套量词"或"多个量词划分同一段文本"时，
 *    切分方式的数量会随输入长度呈指数增长，一条几十字符的输入就能让 CPU 跑满，
 *    这种现象叫"灾难性回溯"（catastrophic backtracking）。
 *    它被用来做拒绝服务攻击时叫 ReDoS（Regular expression Denial of Service）。
 *
 * 2. 为什么需要
 *    正则常常被用在服务器上处理用户提交的内容。如果校验用的正则有嵌套量词，
 *    攻击者只要提交一段精心构造的长字符串（比如 30 个 a 后面接一个不是 b 的字符），
 *    就能让一个请求占用几十秒 CPU。这类漏洞在 npm 生态里被反复报告过，
 *    属于必须知道的工程安全问题。
 *
 * 3. 核心语法要点
 *    ---- 危险信号 ----
 *    (1) 嵌套量词：量词套在"本身已经能被量词匹配"的分组外面
 *        典型：(a+)+、(\d+)*、(a*)*、(?:a|a)+
 *    (2) 多个量词划分同一段文本：/.*.*.*=/ 这类"多个 .* 抢同一段字符"
 *    (3) 带 | 的重复分支且分支之间有重叠：/(?:a|ab)+/
 *    (4) 可选的量词后面紧跟着"必须匹配但可能失败"的部分
 *        例：/\d+\.\d+/ 面对 "1111111111111111111" 这种"全数字无点号"的输入
 *    ---- 缓解手段（按性价比排序）----
 *    (a) 消除嵌套：把 (a+)+ 换成 a+；把 (\d+)* 换成 \d+
 *    (b) 用"否定字符类"代替"任意字符 + 后续约束"：把 .*? 换成 [^"]*
 *    (c) 加锚点 ^ $，让引擎不必尝试每一个起点
 *    (d) 限制输入长度（最简单的兜底）
 *    (e) 避免多重量词争抢同一段文本，改成"一次吃掉、显式描述结构"
 *    (f) 让分支互斥：把 (?:a|ab) 改成 ab? 或 (?:ab|a)，长的放前面
 *
 * 4. 常见陷阱
 *    (1) 只测"正常输入"不测"畸形输入"：正常数据往往几毫秒，畸形数据几十秒。
 *    (2) 觉得"很短的正则不会有性能问题"：/(a+)+b/ 只有 8 个字符，却能指数爆炸。
 *    (3) 以为给正则加个 ?（惰性）就能解决问题：惰性只是换了回溯顺序，
 *        嵌套量词带来的指数级仍然存在。
 *    (4) 忽略"输入长度"这一维度：指数级增长意味着 30 字符与 40 字符是
 *        "毫秒"和"天"的差别。
 *    (5) JS 没有"原子组"和"占有量词"，所以不能像 PCRE 那样用 (?>...) 一劳永逸，
 *        只能靠改写模式。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/13_catastrophic_backtracking.js
 *
 * 【预期输出】
 *   打印"危险正则"与"安全正则"在不同输入长度下的耗时对照表，
 *   直观看到前者随长度指数增长（每加 2 个字符约翻 4 倍），
 *   后者始终是线性增长（长度翻百倍，耗时只涨几十倍）。
 *   为保证脚本能在 1~2 秒内跑完，本文件的输入长度刻意控制在小规模。
 * ============================================================================
 */

/** 测量一次 test 的耗时（毫秒），用 performance.now() 计时 */
function timeTest(re, str) {
  const t0 = performance.now();
  re.test(str);
  return performance.now() - t0;
}

console.log('--- 1. 先看一个最简单的"灾难"现场 ---');

// 危险正则：/(a+)+b/
// 逐符号解释：
//   (a+)    组 1：一个或多个 a
//   +       把"组 1"整体再重复一次或多次 —— 这就是"嵌套量词"
//   b       最后必须以 b 结尾
// 问题在于：对于 "aaaa" 这段文本，引擎有非常多种切分方式：
//   (a)(a)(a)(a) / (aa)(aa) / (aaa)(a) / (a)(aaa) / (aaaa) ……
// 每种切分都是一个"候选解"。当末尾的 b 不存在时，所有候选解都要试一遍才认输。
const dangerous = /(a+)+b/;
const safe = /a+b/; // 等价语义，但没有任何嵌套

console.log('  危险正则 =', dangerous, '   安全正则 =', safe);
console.log('  两者对下面这些字符串的判定结果完全一致（都是"没有匹配"），但耗时天差地别。');

// 语义等价性验证：两种写法的匹配结果确实一样。
console.log('  语义对照（是否匹配）：');
for (const s of ['aaab', 'aaa', 'b', 'ab']) {
  console.log(`    ${JSON.stringify(s).padEnd(8)} 危险版=${dangerous.test(s)}  安全版=${safe.test(s)}`);
}

console.log('--- 2. 指数级增长实测：危险正则 ---');

console.log('  输入形态：n 个 a 后面跟一个"不是 b 的字符"，迫使整体匹配失败');
console.log('  ' + '长度 n'.padEnd(10) + '耗时(ms)'.padEnd(14) + '相比上一行');
let prev = null;
const dangerRows = [];
for (let n = 18; n <= 26; n += 2) {
  const input = 'a'.repeat(n) + '!';
  const ms = timeTest(dangerous, input);
  const ratio = prev === null ? '—' : (ms / prev).toFixed(2) + ' 倍';
  console.log(`  ${String(n).padEnd(10)}${ms.toFixed(2).padEnd(14)}${ratio}`);
  dangerRows.push({ n, ms });
  prev = ms;
}
console.log('  ↑ 每加 2 个字符，耗时大约变成 4 倍 —— 这就是"指数级"。');
console.log('    按这个倍率外推：28 个字符约 2 秒，30 个字符约 10 秒，');
console.log('    40 个字符要跑几个小时，50 个字符要跑几个月。');
console.log('    攻击者只需要一段 50 字符的输入，就能让一个线程彻底卡死。');

console.log('--- 3. 同样的输入，安全正则的耗时 ---');

for (const n of [18, 26, 40, 100, 1000, 10000]) {
  const input = 'a'.repeat(n) + '!';
  const ms = timeTest(safe, input);
  console.log(`  长度 ${String(n).padEnd(6)} ${ms.toFixed(4)} ms`);
}
console.log('  ↑ /a+b/ 是线性扫描：字符串有多少个字符就大约看多少次，与"怎么切分"无关。');
console.log('    所以长度从 100 涨到 10000 时，耗时只涨几十倍（线性），而不是指数级。');

console.log('--- 4. 为什么 /(a+)+b/ 会爆炸：把回溯树画出来 ---');

// 用一个小规模例子数一数"到底试了多少种切分"。
// 这里不修改正则引擎，而是用一段代码模拟"把 n 个 a 做有序拆分"的方案数——
// 也就是 2^(n-1)，这正是指数爆炸的数学来源。
function countSplits(n) {
  // n 个 a 排成一排，有 n-1 个"缝隙"，每个缝隙可以选择"切"或"不切"，
  // 所以切分方案总数 = 2^(n-1)。
  return 2 ** (n - 1);
}
console.log('  n 个 a 的切分方案数：');
for (const n of [4, 8, 12, 20, 30, 40, 50]) {
  const c = countSplits(n);
  // 用 BigInt 友好地打印超大数字
  console.log(`    n=${String(n).padEnd(4)} 方案数 = 2^${n - 1} = ${BigInt(2) ** BigInt(n - 1)}`);
}
console.log('  ↑ 每一种切分都要配合"末尾的 b 到底存不存在"判断一次，这就是回溯的工作量。');

console.log('--- 5. 危险模式清单：见到这些就要警惕 ---');

const riskyPatterns = [
  ['(a+)+', '嵌套量词：外层量词重复的是"本身已带量词的分组"'],
  ['(\\d+)*', '同上：* 与 + 叠在一起'],
  ['(a*)*', '内层能匹配空串时更糟，会产生无限多的等价格子'],
  ['(?:a|a)+', '重复的分支内容完全相同，每次都可以任选一边'],
  ['(?:a|ab)+', '分支互相重叠：a 既是"自己"又是 "ab" 的前缀'],
  ['.*.*.*=', '多个 .* 抢同一段文本，组合数巨大'],
  ['(\\w+\\s?)*$', '把"词 + 可选空格"整体重复，空格处可以任意分配'],
];
for (const [p, why] of riskyPatterns) {
  console.log(`  ${p.padEnd(18)} ${why}`);
}

console.log('--- 6. 改写实战一：嵌套量词 → 单层量词 ---');

const cases1 = [
  ['(a+)+b', 'a+b', '把嵌套拆成单层：语义不变，复杂度从指数降到线性'],
  ['(a*)*b', 'a*b', '内层可为空时，外层量词完全是多余的'],
  ['(?:\\d+)+', '\\d+', '重复"一个或多个数字"等价于"一个或多个数字"'],
];
console.log('  改写对照：');
for (const [bad, good, why] of cases1) {
  const badRe = new RegExp(bad);
  const goodRe = new RegExp(good);
  const input = 'a'.repeat(22) + '!';
  const badMs = timeTest(badRe, input);
  const goodMs = timeTest(goodRe, input);
  console.log(`    危险 ${bad.padEnd(12)} ${badMs.toFixed(2).padStart(8)} ms`);
  console.log(`    安全 ${good.padEnd(12)} ${goodMs.toFixed(4).padStart(8)} ms   ${why}`);
}
console.log('  说明：第 2、3 行的输入里没有 a，也没有数字，所以两边都很快；');
console.log('        关键在于"改写后不会再出现指数级"这一性质，而不是某一次的具体耗时。');

console.log('--- 7. 改写实战二：用否定字符类代替"任意字符 + 后续约束" ---');

const html = '<div class="' + 'x'.repeat(40) + '" id="a">内容</div>';

// 写法 A：/"(.*?)"\s*id=/ —— 用惰性 .*? 表示"引号之间的内容"。
// 写法 B：/"[^"]*"\s*id=/ —— 用否定字符类 [^"] 表示同样的事情。
// 两者的匹配结果完全一样，但写法 B 把"边界在哪里"写死了：
//   [^"] 明确说"碰到引号就停"，引擎根本不需要考虑"要不要再多切一刀"。
const lazyRe = /"(.*?)"\s*id=/;
const classRe = /"[^"]*"\s*id=/;

console.log('  文本 =', html.slice(0, 60) + '…');
console.log('  两者匹配结果完全一致：',
  JSON.stringify(lazyRe.exec(html)?.[0]) === JSON.stringify(classRe.exec(html)?.[0]));
console.log('  匹配到的内容 =', JSON.stringify(classRe.exec(html)?.[0]));
console.log('  ↑ 在这个例子里 V8 对两者都优化得很快（引擎不会盲目穷举），');
console.log('    但写成 [^"] 是"从结构上不可能回溯"，无论换哪个引擎、哪种输入都安全。');
console.log('    这类"能用否定字符类就别用点星"的直觉，是写正则时最值钱的习惯之一。');

console.log('--- 8. 改写实战三：把"词 + 可选空格"的重复改成显式结构 ---');

// 这是一条真实出现过的经典危险正则，用来校验"以空格分隔的词列表"。
// 逐符号解释 /^(\w+\s?)*$/：
//   ^            整串开始
//   ( ... )      分组
//     \w+        一个或多个单词字符
//     \s?        空格可有可无 —— 问题就出在这
//   *            整个分组重复零次或多次
//   $            整串结束
// 问题：同一个空格有两种归属方式 ——"黏在上一轮的末尾"或"独立成一轮"，
// 于是 n 个字符产生 2^(n-1) 种切分，与 /(a+)+b/ 如出一辙。
const wordListBad = /^(\w+\s?)*$/;
// 安全写法：把结构写清楚 —— "一个词，后面跟着若干（空格 + 词）"。
// 逐符号解释 /^\w+(?:\s+\w+)*$/：
//   ^                整串开始
//   \w+              第一个词
//   (?:\s+\w+)*      零次或多次的"一个或多个空格 + 一个词"
//   $                整串结束
// 每个空格只能出现在"分隔符"这一个位置上，不存在第二种解释，因此不会回溯爆炸。
const wordListGood = /^\w+(?:\s+\w+)*$/;

console.log('  危险 =', wordListBad, '   安全 =', wordListGood);
console.log('  语义对比：');
for (const s of ['hello world', 'a b c', 'trailing ', 'two  spaces']) {
  console.log(`    ${JSON.stringify(s).padEnd(16)} 危险版=${String(wordListBad.test(s)).padEnd(6)}安全版=${wordListGood.test(s)}`);
}
console.log('  ↑ 前两行两者一致；后两行出现了差异 —— 这正是改写时最需要警惕的地方：');
console.log('    · "trailing "（末尾多一个空格）：\\s? 允许"最后一个空格"被吃掉，所以危险版通过；');
console.log('      安全版要求"空格后面必须还有词"，所以拒绝（哪个才对取决于业务需求）。');
console.log('    · "two  spaces"（词之间有连续两个空格）：危险版因为 \\s? 只能吃一个空格而拒绝，');
console.log('      安全版的 \\s+ 允许任意多个空格，所以通过。');
console.log('    结论：改写不只是为了性能，还必须同步核对语义是否被改变。');

console.log('  耗时对比（输入 = n 个 a 后接一个 ! ，必然匹配失败）：');
console.log('  ' + '长度 n'.padEnd(10) + '危险版(ms)'.padEnd(14) + '安全版(ms)');
for (const n of [16, 18, 20, 22, 24]) {
  const input = 'a'.repeat(n) + '!';
  const badMs = timeTest(wordListBad, input);
  const goodMs = timeTest(wordListGood, input);
  console.log(`  ${String(n).padEnd(10)}${badMs.toFixed(2).padEnd(14)}${goodMs.toFixed(4)}`);
}
console.log('  ↑ 危险版每次 +2 个字符就翻 4 倍，安全版稳定在 0.0x 毫秒。');

console.log('--- 9. 改写实战四：让分支互斥（长分支优先只是缓解） ---');

// /(?:a|ab)+c/ 的分支 a 与 ab 互相重叠："a" 既是它自己，也是 "ab" 的前缀。
// 引擎在每一轮都要在两条分支之间做选择，而不同的选择组合会导向相同的结果，
// 于是产生大量重复劳动。
const overlapBad = /(?:a|ab)+c/;
const overlapReorder = /(?:ab|a)+c/; // 把长分支放前面：只是缓解，没有根治
const overlapBest = /a+b?c/;         // 真正消除重叠：a 后面可选一个 b，最后必须是 c

const probes = ['aaac', 'ababc', 'ab', 'aab'];
console.log('  三种写法对同样输入的判定：');
for (const s of probes) {
  console.log(`    ${JSON.stringify(s).padEnd(10)} 危险=${String(overlapBad.test(s)).padEnd(6)}长分支优先=${String(overlapReorder.test(s)).padEnd(6)}互斥版=${overlapBest.test(s)}`);
}
console.log('  注意：在上面的样例里三者判定一致，但只有 /a+b?c/ 从结构上消除了"分支重叠"，');
console.log('        所以无论输入多长、无论引擎怎么实现，它都不会发生灾难性回溯。');
console.log('  改写原则：先问"这两条分支能不能用可选结构 b? 合并"，再考虑"长的放前面"。');

console.log('--- 10. 缓解手段：先用长度上限把攻击面挡住 ---');

// 最便宜的兜底：在跑正则之前先看长度，超长直接拒绝。
// 这不是"修复正则"，而是"不让危险输入到达正则"。
function safeTest(re, str, maxLen = 64) {
  if (typeof str !== 'string') return false;
  if (str.length > maxLen) return false;
  return re.test(str);
}

const longEvil = 'a'.repeat(5000) + '!';
console.log('  直接跑危险正则（5000 个 a）—— 会卡死，所以这里不真的执行它。');
console.log('  改用长度上限兜底：safeTest(/(a+)+b/, longEvil, 64) =', safeTest(dangerous, longEvil, 64));
console.log('  对正常长度的输入照常校验：safeTest(/(a+)+b/, "aaab", 64) =', safeTest(dangerous, 'aaab', 64));
console.log('  ↑ 加上长度检查后，攻击者没法把"超长输入"送进危险正则。');

console.log('--- 11. 缓解手段：用锚点缩小搜索空间 ---');

// 没有锚点时，引擎会在每个位置都尝试一遍；有锚点就只从 0 号位置试。
const noAnchor = /\d{4}-\d{2}-\d{2}/;
const anchored = /^\d{4}-\d{2}-\d{2}$/;
const notADate = '9'.repeat(50);
console.log('  无锚点 /\\d{4}-\\d{2}-\\d{2}/ 耗时 =', timeTest(noAnchor, notADate).toFixed(4), 'ms');
console.log('  有锚点 /^\\d{4}-\\d{2}-\\d{2}$/ 耗时 =', timeTest(anchored, notADate).toFixed(4), 'ms');
console.log('  ↑ 对这条模式差异不算大，但当模式内部有复杂量词时，锚点能省掉"每个起点试一遍"的开销。');

console.log('--- 12. 自查清单 ---');

const checklist = [
  '模式里有没有"量词套量词"？有就改成单层。',
  '有没有多个量词在抢同一段文本（如 .*.*）？合并成一个。',
  '能不能用否定字符类（[^x]）替代"任意字符 + 后续约束"？',
  '能加 ^ $ 吗？能加就加，能省掉大量无用的起点尝试。',
  '分支之间是否重叠？让它们互斥，或改成可选结构 b?。',
  '输入长度是否有上限？没有就先加上。',
  '测试里有没有"畸形输入"样例（超长、缺结尾、边界字符）？',
  '这条正则是用来处理"用户输入"的吗？是的话，性能就是安全问题。',
];
for (const [i, item] of checklist.entries()) {
  console.log(`  ${String(i + 1).padStart(2)}. ${item}`);
}

console.log('--- 13. 小结 ---');
console.log('· 灾难性回溯的根因是"同一段文本有指数多种切分方式"，而不是正则写得长。');
console.log('· /(a+)+b/ 与 /a+b/ 语义相同，复杂度一个指数一个线性。');
console.log('· 主要解法：消除嵌套量词、用否定字符类、让分支互斥、加锚点、限制输入长度。');
console.log('· JS 没有原子组/占有量词，所以只能靠改写模式来根治。');
