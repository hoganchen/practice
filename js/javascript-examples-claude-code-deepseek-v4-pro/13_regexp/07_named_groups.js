/**
 * ============================================================================
 * 知识点：具名捕获组 (?<name>...)、groups 属性、replace 中的 $<name>
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】进阶
 * 【前置知识】13_regexp/05_groups_and_alternation.js、13_regexp/06_backreferences.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    具名捕获组（named capture group）就是"带名字的捕获组"，语法是 (?<name>...)，
 *    是 ES2018 引入的特性。它在保留数字编号的同时，额外把结果挂到一个
 *    "名字 → 内容" 的普通对象上（exec 返回值的 .groups 属性）。
 *
 * 2. 为什么需要
 *    只用数字编号时，正则一旦改动（比如多加了一对括号），所有 [1]、[2]、$1
 *    的下标全部错位，而且读代码的人根本不知道 [3] 是什么。
 *    具名组把"位置记忆"换成"语义记忆"：
 *      m[3]                  —— 3 是什么？要回头看正则。
 *      m.groups.year         —— 一眼就懂。
 *    这一点在长正则、多人协作、需要长期维护的代码里价值极大。
 *
 * 3. 核心语法要点
 *    (1) 定义：(?<name>...)       name 必须以字母、$ 或 _ 开头，后续可含数字
 *    (2) 读取：m.groups.name
 *        整体匹配仍是 m[0]，数字编号 m[1]、m[2]... 依旧存在（按左括号顺序分配）
 *    (3) 在 replace 的替换串里用 $<name> 引用
 *    (4) 在 replace 的函数形式里，groups 对象是最后一个参数（10 号文件详述）
 *    (5) 具名反向引用：\k<name>（06 号文件已见）
 *    (6) 没有匹配到的具名组，其值为 undefined（与数字组一致）
 *    (7) groups 是一个"无原型对象"（null prototype），不是普通对象字面量
 *    (8) 如果有任何具名组存在，正则就会带上 .groups 结构；一个都没有时 m.groups 是 undefined
 *
 * 4. 常见陷阱
 *    (1) 组名不能是纯数字，也不能含连字符：(?<user-id>) 是语法错误。
 *    (2) 组名必须是合法的标识符风格；用中文名虽然语法上允许（标识符可含 Unicode），
 *        但工程上不建议。
 *    (3) 同一个正则里重复使用同一个组名：ES2025 之前直接是语法错误；
 *        Node 24 已支持在"互斥的或分支"中重名（见本文件第 7 节，用 try/catch 演示）。
 *    (4) 用带 g 的 String.match 依旧拿不到 groups（和数字组一样会丢），
 *        要用 matchAll 或 exec。
 *    (5) 在模板字符串里写 $<name> 时要小心，替换串必须是普通字符串，
 *        否则反引号里的 ${} 会被先求值。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/07_named_groups.js
 *
 * 【预期输出】
 *   打印具名组的定义、groups 对象内容、与数字编号的对应关系，
 *   以及 $<name> 在 replace 中的用法与常见语法错误的友好提示。
 * ============================================================================
 */

/** 打印一次 exec 的完整信息，数字组与具名组并排展示 */
function report(label, re, str) {
  const m = re.exec(str);
  console.log(`  ${label}`);
  console.log(`    正则 = ${re}`);
  console.log(`    文本 = ${JSON.stringify(str)}`);
  if (!m) {
    console.log('    结果 = null');
    return null;
  }
  console.log(`    整体匹配 [0] = ${JSON.stringify(m[0])}，index = ${m.index}`);
  const numeric = m.slice(1).map((v) => (v === undefined ? 'undefined' : JSON.stringify(v)));
  console.log(`    数字编号 = [${numeric.join(', ')}]`);
  console.log(`    具名 groups = ${m.groups ? JSON.stringify(m.groups) : 'undefined（没有具名组或未匹配）'}`);
  return m;
}

console.log('--- 1. 从数字组到具名组 ---');

const log = '2026-09-16 10:20:30 [ERROR] disk full';

// 数字组版本：读的人得数括号才知道 [4] 是级别。
const numbered = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) \[(\w+)\]/;
report('数字组版本', numbered, log);

// 具名组版本：同样的模式，每段都有名字。
// 逐符号解释：
//   (?<year>\d{4})      具名组 year：4 个数字
//   (?<month>\d{2})     具名组 month：2 个数字
//   (?<day>\d{2})       具名组 day：2 个数字
//   (?<hour>\d{2})      具名组 hour
//   (?<minute>\d{2})    具名组 minute
//   (?<second>\d{2})    具名组 second
//   (?<level>\w+)       具名组 level：单词字符
const named = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2}) (?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2}) \[(?<level>\w+)\]/;
const m1 = report('具名组版本', named, log);

console.log('  用名字取值：');
console.log('    年 =', m1.groups.year, ' 月 =', m1.groups.month, ' 日 =', m1.groups.day);
console.log('    级别 =', m1.groups.level);
console.log('  数字编号依然可用，且顺序与括号出现顺序一致：');
console.log('    m[1] =', JSON.stringify(m1[1]), '（就是 year）');
console.log('    m[7] =', JSON.stringify(m1[7]), '（就是 level）');

console.log('--- 2. groups 是一个无原型对象 ---');

console.log('  Object.getPrototypeOf(m.groups) =', Object.getPrototypeOf(m1.groups));
console.log('  所以 m.groups.toString 是 =>', m1.groups.toString);
console.log('  说明：它故意不继承 Object.prototype，避免组名恰好叫 "toString" 时被原型污染。');
console.log('  想安全判断某个组名是否存在，用 Object.hasOwn：');
console.log('    hasOwn(groups, "year")  =>', Object.hasOwn(m1.groups, 'year'));
console.log('    hasOwn(groups, "zone")  =>', Object.hasOwn(m1.groups, 'zone'));

console.log('--- 3. 具名组也会出现在 .groups 与数字两处，未匹配则为 undefined ---');

// 可选具名组：没匹配到时是 undefined，而不是空串。
const optRe = /(?<key>\w+)(?:=(?<value>\w+))?/;
report('可选具名组，匹配 "color"', optRe, 'color');
report('可选具名组，匹配 "color=red"', optRe, 'color=red');

console.log('--- 4. 在 replace 的替换串里用 $<name> ---');

const row = '2026-09-16';
// 把 YYYY-MM-DD 重排成 DD/MM/YYYY
const reformatted = row.replace(
  /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/,
  '$<d>/$<m>/$<y>',
);
console.log('  原文 =', row, '  =>  重排后 =', reformatted);

// 同时使用数字编号与具名引用也可以（$1 与 $<y> 等价）
const bothWays = row.replace(/(?<y>\d{4})-(\d{2})-(\d{2})/, '[$1|$<y>]-[$2]-[$3]');
console.log('  $1 与 $<y> 等价：', bothWays);

// 实战：把日志行转成 key=value 形式
const logLine = '2026-09-16 10:20:30 [ERROR] disk full';
const kv = logLine.replace(
  /(?<date>\S+) (?<time>\S+) \[(?<level>\w+)\] (?<msg>.*)/,
  'level=$<level> date=$<date> time=$<time> msg="$<msg>"',
);
console.log('  日志重排 =>', kv);

console.log('--- 5. $<name> 找不到对应组时的行为 ---');

// 陷阱一：替换串里引用了不存在的组名时，$<xxx> 会被替换成空字符串 —— 不报错，静默丢内容。
console.log('  $<nope>（不存在的组名）=>', row.replace(/(?<y>\d{4})-(\d{2})-(\d{2})/, '$<nope>-ok'));
// 陷阱二：数字组的越界引用则相反，它会被原样保留成字面文本。
console.log('  $9（不存在的数字组）=>', row.replace(/(\d{4})-(\d{2})-(\d{2})/, '$9-ok'));
console.log('  两种情况都不报错，所以替换结果必须自己核对。');
console.log('  想输出字面的 $< 符号，用 $$ 转义一个美元符号 =>',
  row.replace(/(?<y>\d{4})/, '$$<y>'));

console.log('--- 6. matchAll 与具名组配合：批量抽取 ---');

const text = '张三:88 李四:95 王五:72';
// 逐符号解释 /(?<name>[\p{Script=Han}]+):(?<score>\d+)/gu：
//   (?<name>[\p{Script=Han}]+)   具名组 name：一个或多个汉字
//   :                            字面冒号
//   (?<score>\d+)                具名组 score：一个或多个数字
//   g                            找出全部匹配
//   u                            启用 Unicode 模式，\p{...} 才生效
const scoreRe = /(?<name>[\p{Script=Han}]+):(?<score>\d+)/gu;
const records = [];
for (const m of text.matchAll(scoreRe)) {
  records.push({ 姓名: m.groups.name, 分数: Number(m.groups.score), 位置: m.index });
}
console.log('  抽取结果 =');
for (const r of records) {
  console.log(`    ${r.姓名} -> ${r.分数} 分（下标 ${r.位置}）`);
}

// 顺手做一次转换：把 "张三:88" 变成 "张三(88分)"
console.log('  用 $<name> 改写 =>', text.replace(scoreRe, '$<name>($<score>分)'));

console.log('--- 7. 组名重复：新版 Node 支持互斥分支重名 ---');

// 在 ES2025 之前，同一个正则里出现两次同名组会直接抛 SyntaxError。
// 现在的规范允许"同一个组名出现在不同的或分支中"，条件是任一时刻只可能有一个生效。
// 因为旧引擎仍是语法错误，这里必须用 try/catch 包住，绝不能让进程崩掉。
try {
  const dup = /(?<val>\d+)|(?<val>[a-z]+)/;
  console.log('  互斥分支重名可以构造成功：', dup);
  console.log('    对 "123" 的 groups =', JSON.stringify(dup.exec('123').groups));
  console.log('    对 "abc" 的 groups =', JSON.stringify(dup.exec('abc').groups));
} catch (err) {
  console.log('  当前引擎不支持互斥分支重名 =>', err.constructor.name + ': ' + err.message);
}

// 反例：两个组可能"同时生效"时，任何引擎都不允许重名，必定是语法错误。
try {
  const bad = new RegExp('(?<x>a)(?<x>b)');
  console.log('  不该走到这里：', bad);
} catch (err) {
  console.log('  同名组同时生效 =>', err.constructor.name + ': ' + err.message);
}

console.log('--- 8. 陷阱：组名写法不合法的几种情况 ---');

const badNames = ['1abc', 'user-id', 'user id', ''];
for (const n of badNames) {
  try {
    const re = new RegExp(`(?<${n}>\\w+)`);
    console.log(`  组名 ${JSON.stringify(n).padEnd(10)} => 竟然通过了：${re}`);
  } catch (err) {
    console.log(`  组名 ${JSON.stringify(n).padEnd(10)} => ${err.constructor.name}: ${err.message.split('\n')[0]}`);
  }
}

// 合法但需要引号包裹的写法：用字符串拼接组名时必须自己保证合法性。
const goodName = new RegExp('(?<ok_name>\\w+)');
console.log('  合法的组名 ok_name =>', goodName, ' 结果 =', JSON.stringify(goodName.exec('hi').groups));

console.log('--- 9. 陷阱：模板字符串里的 $<name> ---');

// 替换串里的 $ 语法是 replace 自己解析的，跟 JS 的模板字符串 ${} 完全是两回事。
// 如果把替换串写成反引号模板，${} 会被 JS 先求值，而 $<name> 仍由 replace 解析，
// 两种语法混在一起极易看错，所以替换串一律用普通引号字符串书写。
const t = 'a=1';
console.log('  用普通字符串写替换串 =>', t.replace(/(?<k>\w+)=(?<v>\d+)/, '$<v> <- $<k>'));
console.log('  说明：替换串里没有任何 JS 插值语法，$<name> 完全由 replace 自己解析。');

console.log('--- 10. 小结 ---');
console.log('· (?<name>...) 定义具名组，m.groups.name 读取，$<name> 用于 replace。');
console.log('· 具名组不取代数字编号，两者并存；未匹配的组值为 undefined。');
console.log('· groups 是无原型对象，判断键存在请用 Object.hasOwn。');
console.log('· 组名必须是标识符风格（字母/下划线/$ 开头），不能是纯数字或含连字符。');
