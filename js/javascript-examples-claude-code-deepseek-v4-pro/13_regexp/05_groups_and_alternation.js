/**
 * ============================================================================
 * 知识点：捕获组 ()、非捕获组 (?:)、或 |、嵌套组
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】进阶
 * 【前置知识】13_regexp/01_basics_and_literals.js、13_regexp/03_quantifiers.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    圆括号在正则里有三个作用，而且常常同时生效：
 *      (1) 分组：把若干个原子打包成一个整体，让量词或断言作用于整组。
 *      (2) 捕获：把这一组匹配到的文本单独保存下来，供后续读取（exec 的返回值、
 *          replace 的 $1、反向引用 \1）。
 *      (3) 分支限定：与 | 配合，把"或"的范围限制在括号内。
 *    (?:...) 是"非捕获组"：只做分组，不做捕获，因此不占用组编号，性能也略好。
 *
 * 2. 为什么需要
 *    现实抽取任务几乎都是"从一段文本里抠出几个字段"，捕获组就是那个"抠"的动作。
 *    例如日志解析、URL 拆解、时间格式化，本质都是"用一条正则把字段分组切出来"。
 *
 * 3. 核心语法要点
 *    ( ... )      捕获组，编号从 1 开始（整体匹配是 0 号）
 *    (?: ... )    非捕获组，不占编号
 *    a | b        或：匹配 a 或 b
 *    | 的优先级很低：/^cat|dog$/ 是 "(行首+cat) 或 (dog+行尾)"，
 *    要表达"整串是 cat 或 dog"必须写 /^(?:cat|dog)$/。
 *    组的编号顺序 = 左括号出现的先后顺序，与嵌套层数无关。
 *    未被匹配到的组，其值是 undefined（占位但无内容）。
 *
 * 4. 常见陷阱
 *    (1) 用带 g 的 String.match 时，返回值只有整体匹配，捕获组全丢了；
 *        要拿分组必须用 exec / matchAll，或者不加 g 的 match。
 *    (2) 无脑加括号会打乱编号：本来 $1 是你的目标字段，多插了一个括号就变成 $2。
 *        解决：不打算捕获的括号统一写成 (?:...)。
 *    (3) | 的范围写错是最高频的 bug：/abc|def/ 的含义不是 "ab 后面跟 c 或 d 再跟 ef"。
 *    (4) 分组内的量词写在外面：/(abc)+/ 是"abc 重复"，/abc+/ 只是"c 重复"。
 *    (5) 嵌套组时按左括号顺序编号，不是按"从内到外"或"从外到内"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/05_groups_and_alternation.js
 *
 * 【预期输出】
 *   打印每条正则的完整捕获结果（含整体匹配、各分组、位置），
 *   并用对照实验展示 | 的作用范围与非捕获组对编号的影响。
 * ============================================================================
 */

/** 打印一次 exec 的完整结果：整体匹配 + 每个捕获组 + 位置 */
function describe(label, re, str) {
  const m = re.exec(str);
  console.log(`  ${label}`);
  console.log(`    正则 = ${re}   文本 = ${JSON.stringify(str)}`);
  if (!m) {
    console.log('    结果 = null（没有匹配到）');
    return;
  }
  console.log(`    index = ${m.index}，整体匹配 [0] = ${JSON.stringify(m[0])}`);
  for (let i = 1; i < m.length; i++) {
    const v = m[i];
    console.log(`    捕获组 [${i}] = ${v === undefined ? 'undefined（该组未参与匹配）' : JSON.stringify(v)}`);
  }
}

console.log('--- 1. 最基础的捕获组 ---');

// 逐符号解释 /(\d{4})-(\d{2})-(\d{2})/：
//   (\d{4})   组 1：4 个数字（年）
//   -         字面连字符
//   (\d{2})   组 2：2 个数字（月）
//   -
//   (\d{2})   组 3：2 个数字（日）
describe('/ (\\d{4})-(\\d{2})-(\\d{2}) /', /(\d{4})-(\d{2})-(\d{2})/, '今天是 2026-09-16 星期三');

console.log('--- 2. 组的编号 = 左括号出现的顺序（与嵌套无关） ---');

// 逐符号解释 /((a)(b(c)))/：
//   最外层的 ( 是第 1 个左括号 → 组 1，内容是 (a)(b(c)) 的全部
//   第二个 (    → 组 2，内容是 a
//   第三个 (    → 组 3，内容是 b(c)
//   第四个 (    → 组 4，内容是 c
describe('嵌套组 ((a)(b(c)))', /((a)(b(c)))/, 'zabc');

console.log('--- 3. 未参与匹配的组是 undefined ---');

// (a)|(b) 两个分支：匹配 a 时组 2 不参与，匹配 b 时组 1 不参与。
describe('(a)|(b) 匹配 a', /(a)|(b)/, 'xxa');
describe('(a)|(b) 匹配 b', /(a)|(b)/, 'xxb');

// 可选组也一样：写了括号但没匹配上，值就是 undefined，而不是空字符串。
describe('可选组 /ID:(?:(\\d+))?/', /ID:(?:(\d+))?/, 'ID:');

console.log('--- 4. 非捕获组 (?:...) 与捕获组的对照 ---');

const url = 'https://example.com:8080/path/to?q=1';
// 版本 A：全部用捕获组
describe('全捕获 /(https?):\\/\\/([^/:]+)(?::(\\d+))?/', /(https?):\/\/([^/:]+)(?::(\d+))?/, url);
// 版本 B：把不关心的部分改成非捕获组，编号立刻"对齐"了
describe('混用非捕获 /(https?):\\/\\/(?:[^/:]+)(?::(\\d+))?/', /(https?):\/\/(?:[^/:]+)(?::(\d+))?/, url);
console.log('  对照结论：版本 A 的端口号是第 3 组，版本 B 里变成第 2 组。');
console.log('  实战建议：只给"真正要用的字段"加括号，其余一律 (?:...)，编号才稳定。');

console.log('--- 5. 或 | 的优先级陷阱 ---');

const animals = 'The cat sleeps. The dog barks.';

// 陷阱写法：/^cat|dog$/ 会被解析成 (^cat) | (dog$)
describe('^cat|dog$ 在句子中', /^cat|dog$/, animals);
console.log('  这条正则的两个分支是："行首的 cat" 或 "行尾的 dog"，跟直觉完全不同；');
console.log('  本句里 cat 不在行首、dog 不在行尾，所以结果是 null。');

// 陷阱写法之二：/cat|dog/ 才是"cat 或 dog"
describe('cat|dog', /cat|dog/, animals);

// 正确表达"整串是 cat 或 dog"：用分组把 | 圈起来，再用 ^ $ 包住整串。
describe('^(?:cat|dog)$ 对 "cat"', /^(?:cat|dog)$/, 'cat');
describe('^(?:cat|dog)$ 对 "dog"', /^(?:cat|dog)$/, 'dog');
describe('^(?:cat|dog)$ 对 "catdog"', /^(?:cat|dog)$/, 'catdog');

console.log('--- 6. | 与量词、锚点的组合 ---');

// 常见的"文件扩展名"判断：把候选后缀放进非捕获组。
const files = ['report.txt', 'photo.JPG', 'archive.tar.gz', 'notes'];
const extRe = /\.(?:txt|jpg|png|gif|gz)$/i;
console.log('  正则 =', extRe);
for (const f of files) {
  const m = f.match(extRe);
  console.log(`    ${f.padEnd(14)} → ${m ? '匹配到后缀 ' + JSON.stringify(m[0]) : '不匹配'}`);
}

// 注意区分：如果把 (?:...) 换成 (...)，m[1] 就能拿到后缀名本身。
const extReCapture = /\.(txt|jpg|png|gif|gz)$/i;
const m2 = 'report.txt'.match(extReCapture);
console.log('  换成捕获组后，捕获组 [1] =', JSON.stringify(m2[1]));

console.log('--- 7. 分组的另一个作用：让量词作用于整组 ---');

// /(ab)+/ 中的 + 作用于整组 ab；/ab+/ 中的 + 只作用于 b。
const seq = 'ababab';
console.log('  /(ab)+/  =>', JSON.stringify(/(ab)+/.exec(seq)[0]));
console.log('  /(ab)+/ 的捕获组 [1] =>', JSON.stringify(/(ab)+/.exec(seq)[1]));
console.log('    ↑ 重复组只保留"最后一次"迭代的内容，这是很多人第一次看到会惊讶的点。');
console.log('  /ab+/   =>', JSON.stringify(/ab+/.exec(seq)[0]));

// 想拿到每次迭代的全部内容，应该用 /(ab)/g + matchAll，或者改成 /((?:ab)+)/。
console.log('  /((?:ab)+)/ 的捕获组 [1] =>', JSON.stringify(/((?:ab)+)/.exec(seq)[1]));

console.log('--- 8. 陷阱：带 g 的 match 会丢掉捕获组 ---');

const csv = 'a=1, b=22, c=333';
const gMatch = csv.match(/\w+=(\d+)/g);
console.log('  带 g 的 match 结果 =', gMatch, '（只有整体匹配，没有分组）');

// 想要分组 + 全部结果，用 matchAll（必须带 g，否则抛 TypeError）。
for (const m of csv.matchAll(/(\w+)=(\d+)/g)) {
  console.log(`    matchAll 一轮：整体=${JSON.stringify(m[0])} 键=${JSON.stringify(m[1])} 值=${JSON.stringify(m[2])} 位置=${m.index}`);
}

console.log('--- 9. 实战：用分组拆分 CSS 颜色值 ---');

// 支持 #rgb、#rrggbb 两种写法。逐符号解释：
//   #                                            字面井号
//   (?:([0-9a-f])([0-9a-f])([0-9a-f])|([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2}))
//     这是一个非捕获组，里面用 | 分成两个分支：
//       分支 1：三个"单个十六进制字符"，分别落在组 1、2、3
//       分支 2：三个"两个十六进制字符"，分别落在组 4、5、6
//   $                                            整串结束
//   i                                            忽略大小写，让 A-F 也能匹配
const hexRe = /^#(?:(?:([0-9a-f])([0-9a-f])([0-9a-f]))|(?:([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})))$/i;

for (const color of ['#f00', '#ff0000', '#3A7BD5', '#12345']) {
  const m = hexRe.exec(color);
  if (!m) {
    console.log(`  ${color.padEnd(10)} → 非法颜色值`);
    continue;
  }
  // 分支 1 命中时组 1~3 有值；分支 2 命中时组 4~6 有值。用 ?? 取出实际生效的那一套。
  const [r, g, b] = [m[1] ?? m[4], m[2] ?? m[5], m[3] ?? m[6]];
  console.log(`  ${color.padEnd(10)} → 简写=${m[1] !== undefined}  R=${r} G=${g} B=${b}`);
}

console.log('--- 10. 小结 ---');
console.log('· ( ) 有三重身份：分组、捕获、限定 | 的范围。');
console.log('· 组编号按左括号出现顺序，整体匹配是 0 号，未匹配的组是 undefined。');
console.log('· 不打算读取的括号请写成 (?:...)，否则 $1 / [1] 的编号会漂移。');
console.log('· | 的优先级最低，涉及锚点时必须用括号把它圈起来。');
