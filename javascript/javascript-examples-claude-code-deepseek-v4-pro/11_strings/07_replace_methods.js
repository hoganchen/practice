/**
 * ============================================================================
 * 知识点：replace 与 replaceAll —— 字符串模式、正则模式、替换函数
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】进阶
 * 【前置知识】11_strings/04_search_methods.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    replace / replaceAll 用于把匹配到的内容替换成新内容，返回新字符串。
 *    关键在于第一个参数的类型决定了"替换几个、按什么规则替换"：
 *      - 传字符串：replace 只替换第一个匹配，replaceAll 替换全部
 *      - 传正则（无 g）：replace 只替换第一个匹配
 *      - 传正则（带 g）：replace 替换全部；replaceAll 传无 g 的正则会抛 TypeError
 *    第二个参数可以是字符串，也可以是一个函数（每次匹配调用一次，返回值即替换结果）。
 *
 * 2. 为什么需要
 *    - 文本清洗：去掉多余空白、统一换行符、过滤敏感词
 *    - 格式化：把日期 2024-01-05 换成 2024年01月05日、金额加千分位
 *    - 模板渲染：把 {{name}} 替换成真实值（简易模板引擎原理）
 *    - 转义：HTML 转义、正则元字符转义（见 10 号文件的标签模板）
 *
 * 3. 核心语法要点
 *    - 替换字符串里的特殊记号：
 *        $$   插入一个 $ 字符
 *        $&   插入匹配到的整个子串
 *        $`   插入匹配项左边的文本
 *        $'   插入匹配项右边的文本
 *        $1..$9  插入第 n 个捕获组
 *        $<name> 插入具名捕获组（ES2018）
 *    - 替换函数签名：(match, p1, p2, ..., offset, string, groups) => 新字符串
 *      参数个数取决于正则里有多少捕获组，这是最容易搞错的地方。
 *    - replaceAll 是 ES2021 新增；旧环境用 split(sep).join(new) 或带 g 的正则替代。
 *    - 正则的 g 标志是"有状态"的（lastIndex），跨调用复用同一个带 g 的正则要小心。
 *
 * 4. 常见陷阱
 *    - 传字符串给 replace 只替换第一个，误以为它会全替换 —— 这是最经典的 bug。
 *    - 替换字符串里的 $ 有特殊含义：想插入字面量 $ 必须写 $$。
 *    - replaceAll 传了带 g 的正则是允许的，但传不带 g 的正则会抛 TypeError。
 *    - 替换函数返回 undefined 时，会被当成字符串 'undefined' 插入。
 *    - 用 /g 正则做替换时若在替换函数里递归调用会因 lastIndex 产生意外结果。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/07_replace_methods.js
 *
 * 【预期输出】
 *   对比字符串模式与正则模式下的替换范围，并演示替换函数与特殊记号。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 字符串模式：只替换第一个！
// ---------------------------------------------------------------------------

console.log('--- 1. 字符串模式只替换第一个 ---');

const sentence = 'cat dog cat bird cat';
console.log('原串：', JSON.stringify(sentence));
// 第一个参数是字符串时，只会替换第一个匹配
console.log("replace('cat', 'X')：", JSON.stringify(sentence.replace('cat', 'X')));
// 原串没有被修改
console.log('原串未变：', JSON.stringify(sentence));

// replaceAll 用字符串参数会替换全部（ES2021）
console.log("replaceAll('cat', 'X')：", JSON.stringify(sentence.replaceAll('cat', 'X')));

// 旧环境的等价写法（现在仍可用，兼容性最好）
console.log("split+join：", JSON.stringify(sentence.split('cat').join('X')));

// ---------------------------------------------------------------------------
// 2. 正则模式：g 标志决定替换范围
// ---------------------------------------------------------------------------

console.log('--- 2. 正则模式 ---');

console.log("replace(/cat/, 'X')（无 g）：", JSON.stringify(sentence.replace(/cat/, 'X')));
console.log("replace(/cat/g, 'X')（带 g）：", JSON.stringify(sentence.replace(/cat/g, 'X')));

// 大小写敏感：默认不匹配大写
const mixedCase = 'Cat cat CAT';
console.log('原串：', JSON.stringify(mixedCase));
console.log('无 i 标志：', JSON.stringify(mixedCase.replace(/cat/g, 'X')));
console.log('带 i 标志：', JSON.stringify(mixedCase.replace(/cat/gi, 'X')));

// replaceAll 传正则时，正则需要带 g 标志，否则抛 TypeError
try {
  console.log(sentence.replaceAll(/cat/, 'X'));
  console.log('没有报错');
} catch (err) {
  console.log('replaceAll(/cat/) 抛出：', err.constructor.name, '-', err.message);
}
// 带上 g 就正常
console.log("replaceAll(/cat/g, 'X')：", JSON.stringify(sentence.replaceAll(/cat/g, 'X')));

// ---------------------------------------------------------------------------
// 3. 替换字符串里的特殊记号
// ---------------------------------------------------------------------------

console.log('--- 3. 特殊记号 ---');

const hello = 'Hello World';
// $& 表示"被匹配到的整个内容"
console.log("replace(/World/, '[$&]')：", JSON.stringify(hello.replace(/World/, '[$&]')));
// $` 表示匹配项左边的文本，$' 表示右边的文本
console.log("replace(/World/, \"$`\")：", JSON.stringify(hello.replace(/World/, '$`')));
console.log("replace(/World/, \"$'\")：", JSON.stringify(hello.replace(/World/, "$'")));
// $$ 表示一个字面量 $
console.log("replace(/World/, '$$')：", JSON.stringify(hello.replace(/World/, '$$')));

// $1、$2 引用捕获组
const date = '2024-01-05';
// 年-月-日 → 日/月/年
console.log('日期重排：', JSON.stringify(date.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3/$2/$1')));

// 具名捕获组 $<名称>（ES2018）
console.log(
  '具名组：',
  JSON.stringify(date.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/, '$<d>.$<m>.$<y>')),
);

// 陷阱：想输出字面量 $1 必须写 $$1
console.log("replace(/World/, '$$1')：", JSON.stringify(hello.replace(/World/, '$$1')));
console.log("replace(/World/, '$1')：", JSON.stringify(hello.replace(/World/, '$1'))); // 没有捕获组，$1 原样保留

// ---------------------------------------------------------------------------
// 4. 替换函数 —— 最灵活的方式
// ---------------------------------------------------------------------------

console.log('--- 4. 替换函数 ---');

// 函数签名：(match, p1, p2, ..., offset, string)
// 参数个数 = 捕获组个数 + 3（match + offset + string）
const result1 = sentence.replace(/cat/g, (match, offset) => {
  // 这里 offset 是第 2 个参数（没有捕获组时）
  return `${match}#${offset}`;
});
console.log('替换函数（带偏移）：', JSON.stringify(result1));

// 有捕获组时，参数会依次插入捕获组
const result2 = 'a1 b2 c3'.replace(/([a-z])(\d)/g, (match, letter, digit, offset, whole) => {
  console.log(`  匹配 "${match}" → 字母=${letter} 数字=${digit} 偏移=${offset} 原串=${whole}`);
  return digit + letter; // 交换字母和数字
});
console.log('交换结果：', JSON.stringify(result2));

// 实战：把价格加上千分位
const priceText = '总价 1234567 元，优惠 890 元';
const withComma = priceText.replace(/\d+/g, (num) =>
  // 用正则给整数部分插入千分位
  num.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
);
console.log('加千分位：', JSON.stringify(withComma));

// 实战：单词首字母大写（用替换函数实现，比 split/map/join 更直接）
console.log(
  '首字母大写：',
  JSON.stringify('hello beautiful world'.replace(/\b\w/g, (c) => c.toUpperCase())),
);

// 陷阱：替换函数返回 undefined 会被转成字符串 'undefined'
console.log(
  '返回 undefined：',
  JSON.stringify('abc'.replace(/b/, () => undefined)),
);
// 正确做法：保证函数总是返回字符串
console.log(
  '返回空串：',
  JSON.stringify('abc'.replace(/b/, () => '')),
);

// ---------------------------------------------------------------------------
// 5. 实战：文本清洗
// ---------------------------------------------------------------------------

console.log('--- 5. 实战：文本清洗 ---');

// 5.1 把连续空白压缩成一个空格
const messy = '  这是   一段 \t 有\n很多空白  的文本  ';
console.log('清洗前：', JSON.stringify(messy));
console.log('清洗后：', JSON.stringify(messy.replace(/\s+/g, ' ').trim()));

// 5.2 统一换行符（Windows 的 \r\n → \n）
const crlf = 'line1\r\nline2\r\nline3';
console.log('统一换行：', JSON.stringify(crlf.replace(/\r\n/g, '\n')));

// 5.3 简易模板渲染：把 {{key}} 换成数据里的值
const template = '你好 {{name}}，你的订单 {{orderId}} 已发货。';
const data = { name: '小明', orderId: 'A10086' };
const rendered = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
  // 数据里没有这个 key 时保留原样，避免显示 undefined
  return Object.hasOwn(data, key) ? data[key] : match;
});
console.log('模板渲染：', JSON.stringify(rendered));

// 5.4 敏感词过滤（简易版，实际项目要按长度做掩码而不是整体替换）
const badWords = ['傻瓜', '笨蛋'];
let comment = '你这个傻瓜，真是个笨蛋！';
for (const w of badWords) {
  // 每个词都构造一个新的全局正则，避免复用带 g 的正则造成 lastIndex 问题
  comment = comment.replaceAll(w, '*'.repeat(w.length));
}
console.log('过滤后：', JSON.stringify(comment));

// 5.5 正则元字符转义（把用户输入当字面量搜索）
function escapeRegExp(str) {
  // 在所有正则元字符前加反斜杠
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const userInput = 'a.b*c';
console.log('转义后的正则源：', JSON.stringify(escapeRegExp(userInput)));
console.log(
  '按字面量搜索 "a.b*c"：',
  'x a.b*c y'.replace(new RegExp(escapeRegExp(userInput), 'g'), '[HIT]'),
);
console.log('不转义时的错误结果：', JSON.stringify('x aXbXc y'.replace(/a.b*c/g, '[HIT]')));

console.log('\n全部演示完毕。');
