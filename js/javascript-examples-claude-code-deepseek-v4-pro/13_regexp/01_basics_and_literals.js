/**
 * ============================================================================
 * 知识点：正则的两种创建方式（字面量 / RegExp 构造器）、test 与 exec、lastIndex 陷阱
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】入门
 * 【前置知识】无
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    正则表达式（Regular Expression，简称 regex / regexp）是一段用来描述
 *    "字符串模式"的微型语言。它不负责"计算"，只负责"在文本里找符合模式的片段"。
 *    在 JavaScript 里，正则是一等公民：有专门的字面量语法，也有内置的 RegExp 类。
 *
 * 2. 为什么需要
 *    如果用普通字符串 API（indexOf / slice）去判断"这串文本里有没有合法邮箱"，
 *    你需要手写一大堆 if 与循环；而一条正则就能表达整个模式。
 *    正则的典型用途：表单校验、日志解析、批量文本替换、词法分析（写编译器/解释器）、
 *    路由匹配、语法高亮等。
 *
 * 3. 核心语法要点
 *    (1) 两种创建方式
 *        · 字面量：/pattern/flags   —— 源码里直接写死，可读性好，会被引擎缓存。
 *        · 构造器：new RegExp('pattern', 'flags') —— 模式是"运行时字符串"，
 *          可以动态拼接（比如把用户输入拼进模式里）。
 *    (2) test(str)：返回 true / false，只关心"有没有匹配"。
 *    (3) exec(str)：返回一个数组（增强版数组），包含：
 *        [0]  整体匹配到的文本
 *        [1..n] 各捕获组匹配到的文本
 *        .index  整体匹配在源字符串中的起始下标
 *        .input  被搜索的源字符串
 *        .groups 具名捕获组的对象（本文件用不到，07 号文件详述）
 *        没匹配到则返回 null（注意：是 null，不是空数组！）。
 *    (4) lastIndex：正则对象上的一个可读写属性，只在带 g 或 y 标志时有意义。
 *
 * 4. 常见陷阱
 *    (1) 带 g 标志的正则对象是"有状态"的：每次 test / exec 成功后，
 *        lastIndex 会前移到本次匹配的末尾；下一次调用从 lastIndex 继续找。
 *        于是同一个正则连续 test 同一个字符串，结果会 true / false 交替出现。
 *    (2) 忘记重置 lastIndex，导致后续逻辑莫名其妙地失效。
 *    (3) 用构造器时忘了对字符串做转义：'.' 拼接进模式后就不再是"字面点"了。
 *    (4) test 返回的是布尔值，但 exec 返回 null 时若直接取 [0] 会 TypeError。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/01_basics_and_literals.js
 *
 * 【预期输出】
 *   依次打印：两种创建方式的对象形态、test 的布尔结果、exec 的完整返回结构
 *   （含 index / input）、lastIndex 在 g 模式下的推进过程，以及由此引发的
 *   "同一正则连续 test 结果交替"现象和重置 lastIndex 的两种正确写法。
 * ============================================================================
 */

console.log('--- 1. 字面量方式创建正则 ---');

// /cat/ 就是一个正则字面量。两条斜杠之间是"模式"，后面可以跟标志（flag）。
// 这里的模式 cat 表示：依次匹配三个字符 c、a、t。
const literalRe = /cat/;

// 打印一个正则对象，Node 会显示成 /cat/ 的形式，非常直观。
console.log('literalRe =', literalRe);
console.log('typeof literalRe =', typeof literalRe); // object
console.log('literalRe instanceof RegExp =', literalRe instanceof RegExp); // true
console.log('literalRe.source =', literalRe.source); // 模式本体："cat"
console.log('literalRe.flags =', JSON.stringify(literalRe.flags)); // 标志串：""

console.log('--- 2. 构造器方式创建正则 ---');

// new RegExp(模式字符串, 标志字符串)。模式在这里必须是"字符串"。
// 注意：写 'cat' 时反斜杠要写成 '\\'（因为 JS 字符串本身也会处理转义）。
const ctorRe = new RegExp('cat');

console.log('ctorRe =', ctorRe);
console.log('literalRe.source === ctorRe.source =', literalRe.source === ctorRe.source); // true

// 构造器真正的价值：模式可以来自变量 / 用户输入，在运行时拼出来。
const keyword = 'hello';
const dynamicRe = new RegExp(keyword, 'g');
console.log('动态拼出的正则 dynamicRe =', dynamicRe);

console.log('--- 3. 两种方式的区别：转义与"字面点" ---');

// 在正则里，'.' 是元字符，意思是"任意一个字符（默认不含换行）"。
// 所以 /a.c/ 能匹配 'abc'、'a1c'、'a c'……
console.log('a.c  匹配 abc =>', /a.c/.test('abc'));
console.log('a.c  匹配 a1c =>', /a.c/.test('a1c'));

// 想匹配"真正的点号"，必须在正则里写成 \. （反斜杠 + 点）。
console.log('a\\.c 匹配 abc =>', /a\.c/.test('abc')); // false，因为没有真的点号
console.log('a\\.c 匹配 a.c =>', /a\.c/.test('a.c')); // true

// 陷阱来了：如果"."是运行时才知道的字符串，直接拼接会丢掉转义！
const userInput = '.'; // 用户想搜一个点号
const naive = new RegExp(userInput); // 拼成了 /./ —— 变成"任意字符"了！
console.log('裸拼 userInput 得到的正则 =', naive);
console.log('它对 "xyz" 的 test 结果 =', naive.test('xyz')); // true，这显然不是用户想要的

// 正确做法：先把字符串里所有正则元字符转义，再拼进模式。
// 下面这条替换正则逐个解释：
//   [ ... ]   字符类，只要其中任意一个字符出现就匹配
//   . * + ? ^ $ { } ( ) | [ ] \   这些都是正则元字符，需要被转义
//   在字符类内部，']' 要用 '\]' 表示，'\' 要用 '\\' 表示
//   \\$& 是替换串：'\\' 表示插入一个反斜杠，'$&' 表示"整个匹配到的文本"
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const escaped = escapeRegExp(userInput);
console.log('转义后拼出的正则 =', new RegExp(escaped), '，源串 =', JSON.stringify(escaped));
console.log('它对 "xyz" 的 test 结果 =', new RegExp(escaped).test('xyz')); // false，符合预期
console.log('它对 "a.b" 的 test 结果 =', new RegExp(escaped).test('a.b')); // true

console.log('--- 4. test()：只回答"有没有" ---');

const sent1 = 'I have a cat and a dog.';
console.log('/cat/.test(sent1) =>', /cat/.test(sent1)); // true
console.log('/bird/.test(sent1) =>', /bird/.test(sent1)); // false
console.log('/CAT/.test(sent1) =>', /CAT/.test(sent1)); // false，正则默认区分大小写

console.log('--- 5. exec()：拿到匹配详情 ---');

const sent2 = 'Order #A1001 shipped on 2024-05-01.';

// 模式解释：
//   #       字面量井号
//   [A-Z]   字符类，匹配任意一个大写字母（A 到 Z 之间的一个）
//   \d      匹配一个数字字符（等价于 [0-9]）
//   +       量词，表示前面的 \d 出现"一次或多次"
const orderRe = /#([A-Z])(\d+)/;
const result = orderRe.exec(sent2);

console.log('整体匹配 [0] =', JSON.stringify(result[0])); // "#A1001"
console.log('捕获组 [1]   =', JSON.stringify(result[1])); // "A"
console.log('捕获组 [2]   =', JSON.stringify(result[2])); // "1001"
console.log('匹配起始下标 index =', result.index); // 6
console.log('源字符串 input =', JSON.stringify(result.input));
console.log('result.length =', result.length); // 3 = 整体匹配 + 2 个捕获组

// 匹配失败时 exec 返回 null —— 直接取属性会抛错，所以必须先判空。
const miss = /#([A-Z])(\d+)/.exec('no code here');
console.log('匹配失败时 exec 返回 =', miss);
console.log('匹配失败时 index 读出来是 =', miss?.index); // undefined（用了可选链）

// 演示"若不判空就取下标"会怎样：必须在 try/catch 里，不能让进程崩掉。
try {
  const bad = /zzz/.exec('abc');
  console.log('不会走到这里：', bad[0]);
} catch (err) {
  console.log('对 null 取下标的后果 =>', err.constructor.name + ': ' + err.message);
}

console.log('--- 6. 陷阱一：带 g 的正则有状态（lastIndex） ---');

// 没有 g 标志时，正则对象是"无状态"的，每次都从头找，lastIndex 始终为 0。
console.log('无 g 时的 lastIndex =', orderRe.lastIndex);
orderRe.exec(sent2);
console.log('无 g 执行一次 exec 后 lastIndex 仍为 =', orderRe.lastIndex);

// 加上 g 之后，正则对象自己记住"上次找到哪儿了"。
const gRe = /a/g;
const text = 'banana';

console.log('文本 =', JSON.stringify(text), '（a 位于下标 1、3、5）');
console.log('第 1 次 exec =>', JSON.stringify(gRe.exec(text)), ', lastIndex =', gRe.lastIndex);
console.log('第 2 次 exec =>', JSON.stringify(gRe.exec(text)), ', lastIndex =', gRe.lastIndex);
console.log('第 3 次 exec =>', JSON.stringify(gRe.exec(text)), ', lastIndex =', gRe.lastIndex);
console.log('第 4 次 exec =>', String(gRe.exec(text)), '（找不到了返回 null）, lastIndex =', gRe.lastIndex);

console.log('--- 7. 陷阱二：同一个 g 正则连续 test，结果会交替 ---');

// 同一个正则对象被反复 test，就会在"真真假假"之间跳，因为每次成功后 lastIndex 都往前走了。
gRe.lastIndex = 0; // 先复位，方便观察
console.log('第 1 次 test =>', gRe.test(text), '（lastIndex 变成', gRe.lastIndex, '）');
console.log('第 2 次 test =>', gRe.test(text), '（lastIndex 变成', gRe.lastIndex, '）');
console.log('第 3 次 test =>', gRe.test(text), '（lastIndex 变成', gRe.lastIndex, '）');
console.log('第 4 次 test =>', gRe.test(text), '（lastIndex 复位为', gRe.lastIndex, '）');
console.log('第 5 次 test =>', gRe.test(text), '（又变成 true 了，循环往复）');

console.log('--- 8. 正确姿势：重置 lastIndex 或用 while + exec 提取全部匹配 ---');

// 姿势 A：每次判断前手动把 lastIndex 归零。
gRe.lastIndex = 0;
console.log('重置后 test =>', gRe.test(text));

// 姿势 B（推荐）：干脆不要在"复用"的场景用 g 标志，或者每次新建正则。
// 判断"含不含"时用没有 g 的正则最省心，因为无状态。
console.log('无 g 正则连续 test 三次 =>', /a/.test(text), /a/.test(text), /a/.test(text));

// 姿势 C：想"找出所有匹配"时，while + exec 是标准写法。
// 注意：必须带 g，否则 exec 永远从 0 开始，会造成死循环！
const words = 'cat bat rat mat';
const finder = /([a-z])at/g;
const hits = [];
let m;
while ((m = finder.exec(words)) !== null) {
  hits.push({ 匹配文本: m[0], 首字母: m[1], 位置: m.index });
}
console.log('while + exec 提取到的全部匹配：');
console.log(hits);
console.log('循环结束后 finder.lastIndex 被自动归零 =', finder.lastIndex);

// 顺手对比：String.prototype.match 在带 g 时，会一次性返回所有"整体匹配"，
// 但不会给出 index 和捕获组，所以想要位置与分组时就只能用 exec。
const all = words.match(/[a-z]at/g);
console.log('String.match 带 g 的结果 =', all);

console.log('--- 9. 小结 ---');
console.log('· 字面量 /x/ 适合写死的模式；new RegExp(s) 适合动态拼接。');
console.log('· test 返回布尔；exec 返回数组或 null。');
console.log('· 只有 g / y 标志才会让 lastIndex 起作用，也就才会"有状态"。');
console.log('· 复用带 g 的正则前，先想清楚要不要把 lastIndex 归零。');
