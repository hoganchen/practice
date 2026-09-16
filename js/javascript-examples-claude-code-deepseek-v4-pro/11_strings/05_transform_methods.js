/**
 * ============================================================================
 * 知识点：字符串变换方法 —— 大小写、trim、pad、repeat
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】入门
 * 【前置知识】11_strings/01_creation_and_immutability.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这一组方法都返回"变换后的新字符串"，原字符串不受影响（不可变性）。
 *      toUpperCase / toLowerCase      大小写转换
 *      trim / trimStart / trimEnd     去掉首尾/开头/结尾的空白
 *      padStart / padEnd              在开头/结尾补字符到指定长度
 *      repeat                         重复 N 次
 *
 * 2. 为什么需要
 *    - 大小写：用户输入的邮箱、命令名（不区分大小写）、显示规范化
 *    - trim：表单输入往往带多余空格，比较和入库前必须清掉
 *    - pad：对齐输出、日志编号补零、银行卡/手机号展示、固定宽度报表
 *    - repeat：画分隔线、生成占位符、缩进
 *
 * 3. 核心语法要点
 *    - toUpperCase() / toLowerCase() 不带参数，返回新串；
 *      若原串不含字母，部分引擎会返回原串本身（不可依赖）。
 *    - trim() 去掉的是"空白字符"，包括空格、制表符 \t、换行 \n、回车 \r，
 *      以及 Unicode 中的不间断空格  、全角空格 　 等。
 *    - padStart(targetLength, padString)：如果原串已经 >= targetLength，直接返回原串。
 *      padString 会按需重复并截断；省略时用空格补齐。
 *    - padEnd 同理，补在右边。
 *    - repeat(n)：n 必须是 0 或正整数，否则抛 RangeError；n 为 0 得到 ''。
 *
 * 4. 常见陷阱
 *    - padStart 的补位串会被"截断"而不是整体重复，例如
 *      '5'.padStart(4, 'ab') 得到 'aba5'（'abab' 只取后 3 位）。
 *    - 用 length 判断补充长度时，中文/emoji 的 length 不等于"看到的宽度"。
 *    - repeat(-1) 抛 RangeError，循环次数来自外部输入时要注意校验。
 *    - toUpperCase 对土耳其语等特殊语言有本地化差异（i/İ），
 *      真正做国际化时应使用 toLocaleUpperCase('tr')。
 *    - 这些都只是"变换"，不会就地修改原串，忘记赋值是新手常见 bug。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/05_transform_methods.js
 *
 * 【预期输出】
 *   演示大小写、trim 系列、pad 系列、repeat 的返回值与边界行为。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 大小写转换
// ---------------------------------------------------------------------------

console.log('--- 1. 大小写转换 ---');

const mixed = 'Hello World 123';
console.log('原串：', JSON.stringify(mixed));
console.log('toUpperCase()：', JSON.stringify(mixed.toUpperCase()));
console.log('toLowerCase()：', JSON.stringify(mixed.toLowerCase()));
// 原串没有变化，验证不可变性
console.log('调用后原串：', JSON.stringify(mixed));

// 数字、符号、中文没有大小写概念，转换后保持不变
console.log("'汉字123!@#'.toUpperCase()：", JSON.stringify('汉字123!@#'.toUpperCase()));

// 实战：大小写不敏感的比较，统一转成小写再比
const input = 'YES';
console.log("input === 'yes'：", input === 'yes'); // false
console.log("toLowerCase 后比较：", input.toLowerCase() === 'yes'); // true

// 本地化版本：土耳其语的 i 大写是 İ 而不是 I
console.log("'i'.toUpperCase()：", JSON.stringify('i'.toUpperCase())); // 'I'
console.log("'i'.toLocaleUpperCase('tr')：", JSON.stringify('i'.toLocaleUpperCase('tr'))); // 'İ'

// ---------------------------------------------------------------------------
// 2. trim 系列
// ---------------------------------------------------------------------------

console.log('--- 2. trim / trimStart / trimEnd ---');

// 用 JSON.stringify 才能看见首尾的空白字符
const padded = '   Hello, 世界   ';
console.log('原串：', JSON.stringify(padded));
console.log('length：', padded.length);
console.log('trim()：', JSON.stringify(padded.trim()));
console.log('trimStart()：', JSON.stringify(padded.trimStart()));
console.log('trimEnd()：', JSON.stringify(padded.trimEnd()));
console.log('trim 后 length：', padded.trim().length);

// trim 会去掉多种空白字符
const allKinds = '\t\n\r Hello  　 ';
console.log('含制表/换行/不间断空格/全角空格：', JSON.stringify(allKinds));
console.log('trim() 之后：', JSON.stringify(allKinds.trim()));

// 注意：trim 只去首尾，中间的空格原封不动
console.log("'a  b'.trim()：", JSON.stringify('a  b'.trim())); // 中间两个空格保留

// 实战：处理表单输入
function normalizeInput(raw) {
  // 先转字符串（防止用户传了 null/undefined），再去首尾空白
  return String(raw ?? '').trim();
}
console.log('normalizeInput("  admin  ")：', JSON.stringify(normalizeInput('  admin  ')));
console.log('normalizeInput(null)：', JSON.stringify(normalizeInput(null)));
console.log('normalizeInput(undefined)：', JSON.stringify(normalizeInput(undefined)));

// 判空的标准写法：trim 之后看长度
const emptyish = '     ';
console.log('仅空格输入判空（错误）：', emptyish.length === 0); // false
console.log('仅空格输入判空（正确）：', emptyish.trim().length === 0); // true

// ---------------------------------------------------------------------------
// 3. padStart / padEnd
// ---------------------------------------------------------------------------

console.log('--- 3. padStart / padEnd ---');

// 第一个参数是"目标总长度"，不是"要补几个字符"
console.log("'5'.padStart(3)：", JSON.stringify('5'.padStart(3))); // '  5'
console.log("'5'.padStart(3, '0')：", JSON.stringify('5'.padStart(3, '0'))); // '005'
console.log("'5'.padEnd(3, '0')：", JSON.stringify('5'.padEnd(3, '0'))); // '500'

// 已经够长就原样返回，不会截断
console.log("'abcdef'.padStart(3, '0')：", JSON.stringify('abcdef'.padStart(3, '0'))); // 'abcdef'

// 补位串会被重复使用，但最终会按需截断
console.log("'7'.padStart(6, 'ab')：", JSON.stringify('7'.padStart(6, 'ab'))); // 'ababa7'
console.log("'7'.padStart(4, 'ab')：", JSON.stringify('7'.padStart(4, 'ab'))); // 'aba7' ← 截断
console.log("'7'.padEnd(6, '-=')：", JSON.stringify('7'.padEnd(6, '-='))); // '7-=-=-'

// 实战 1：时间格式化补零
function formatTime(h, m, s) {
  // String() 保证是字符串，padStart 保证是两位
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
console.log('时间格式化：', formatTime(9, 5, 3)); // '09:05:03'
console.log('时间格式化：', formatTime(23, 59, 59));

// 实战 2：手机号脱敏展示
function maskPhone(phone) {
  const s = String(phone);
  // 保留前 3 位和后 4 位，中间用 * 补齐
  return s.slice(0, 3) + '*'.repeat(s.length - 7) + s.slice(-4);
}
console.log('手机号脱敏：', maskPhone('13812345678'));

// 实战 3：对齐的表格输出
const rows = [
  ['苹果', 12],
  ['香蕉', 3],
  ['火龙果', 128],
];
for (const [label, num] of rows) {
  // padEnd 让中文标签占位一致（注意中文宽度与 length 的差异，此处仅演示 API）
  console.log('  ' + label.padEnd(6, ' ') + String(num).padStart(5, ' '));
}

// 注意 pad 按 length 计算，中文一个字符 length 为 1 但显示宽度通常占 2
console.log("'苹果'.length：", '苹果'.length); // 2

// ---------------------------------------------------------------------------
// 4. repeat
// ---------------------------------------------------------------------------

console.log('--- 4. repeat ---');

console.log("'ab'.repeat(3)：", JSON.stringify('ab'.repeat(3))); // 'ababab'
console.log("'x'.repeat(0)：", JSON.stringify('x'.repeat(0))); // '' 空串
console.log("'x'.repeat(1)：", JSON.stringify('x'.repeat(1)));

// 实战：画分隔线
console.log('='.repeat(40));
console.log('居中标题');
console.log('='.repeat(40));

// 实战：缩进生成
function indent(depth) {
  return '  '.repeat(depth);
}
console.log(JSON.stringify(indent(0) + 'root'));
console.log(JSON.stringify(indent(1) + 'child'));
console.log(JSON.stringify(indent(2) + 'grandchild'));

// 陷阱：负数或 Infinity 会抛 RangeError，必须 try/catch
const badInputs = [-1, Infinity];
for (const n of badInputs) {
  try {
    console.log(`'x'.repeat(${n})：`, JSON.stringify('x'.repeat(n)));
  } catch (err) {
    console.log(`'x'.repeat(${n}) 抛出：`, err.constructor.name, '-', err.message);
  }
}

// 小数会先被截断成整数
console.log("'x'.repeat(2.9)：", JSON.stringify('x'.repeat(2.9))); // 'xx'

// 实践建议：循环次数来自外部输入时先兜底
function safeRepeat(str, n) {
  // 校验成非负有限整数，否则退化成空串
  if (!Number.isFinite(n) || n < 0) return '';
  return str.repeat(Math.floor(n));
}
console.log('safeRepeat("x", -5)：', JSON.stringify(safeRepeat('x', -5)));
console.log('safeRepeat("x", 3)：', JSON.stringify(safeRepeat('x', 3)));

console.log('\n全部演示完毕。');
