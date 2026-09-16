/**
 * ============================================================================
 * 知识点：JSON 语法规则 —— 与 JS 对象字面量的差异
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 数据格式与序列化
 * 【难度等级】入门
 * 【前置知识】21_json/01_parse_and_stringify.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JSON 的语法看起来跟 JS 对象字面量几乎一样，但它是那套语法的"严格子集"：
 *    JSON 只保留了"数据描述"必需的部分，把 JS 里所有"能执行代码"或"写法随意"
 *    的东西全部砍掉了。理解这个"子集"关系，就能一次性记住所有差异。
 *
 * 2. 为什么需要
 *    因为 JSON 要跨语言。如果允许单引号、允许注释、允许尾逗号，
 *    每一种语言都要跟着实现一遍这些"语法糖"，解析器会变复杂、实现会不一致。
 *    所以 JSON 选择了"用起来稍微啰嗦一点，但任何语言都只需三十行就能解析"。
 *    反过来说：当你在 .json 文件里写注释或尾逗号导致报错时，
 *    不是工具"不够聪明"，而是这份文本真的不是 JSON。
 *
 * 3. 核心语法要点（JSON 允许什么）
 *    值只能是下列六种之一：
 *      object   {"key": value, ...}   键必须是双引号字符串
 *      array    [value, ...]
 *      string   "..."   必须双引号；转义只能用 \" \\ \/ \b \f \n \r \t \uXXXX
 *      number   十进制；可有小数与指数；不允许前导 0、不允许 NaN / Infinity
 *      boolean  true / false
 *      null     null
 *    ---- JSON 不允许什么（与 JS 对象字面量的差异） ----
 *      ✗ 单引号字符串          'a'         → 必须 "a"
 *      ✗ 不加引号的键          {a: 1}      → 必须 {"a": 1}
 *      ✗ 尾逗号                {"a":1,}    → 必须删掉
 *      ✗ 注释                  // 或 /* *\/  → JSON 没有注释
 *      ✗ undefined             undefined    → 用 null 代替
 *      ✗ 函数 / Symbol / BigInt
 *      ✗ NaN / Infinity / -Infinity        → 用 null 或字符串
 *      ✗ 稀疏数组里的空位      [1, , 3]     → 必须写成 [1, null, 3]
 *      ✗ 前导零 / 十六进制     01 / 0x1F / .5 / 1.  → 必须 1 / 31 / 0.5 / 1.0
 *      ✗ 计算属性、展开、模板字符串、正则字面量
 *    另外：JSON 文本的顶层可以是任意 JSON 值（包括裸字符串、数字），
 *    但历史上有些老解析器只接受顶层是对象或数组，所以接口约定通常用对象。
 *
 * 4. 常见陷阱
 *    (1) 手写 .json 配置文件时习惯性加注释或尾逗号 —— 工具会直接报错。
 *    (2) 以为 JSON.stringify 的输出可以再手工编辑（可以，但编辑后必须仍然是合法 JSON）。
 *    (3) 用 JSON.parse 去解析 JS 字面量（那是 eval 的领域，而且不安全）。
 *    (4) 字符串里的换行必须写成 \n，不能真的敲一个回车。
 *    (5) 数字精度：JSON 数字就是 JS 的 Number（IEEE 754 双精度），
 *        超出 2^53 的整数会丢精度，需要用字符串传输。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/02_json_format_rules.js
 *
 * 【预期输出】
 *   先打印"合法 JSON 的完整清单"，再逐条演示"JS 字面量能跑但 JSON 会报错"的差异，
 *   每条都在 try/catch 里执行，最后给出"JS 值 → JSON 文本"的降级规则。
 * ============================================================================
 */

console.log('--- 1. 合法的 JSON 值：六种类型全览 ---');

const legalSamples = [
  ['对象', '{"name":"张三","age":30}'],
  ['数组', '[1,2,3]'],
  ['字符串', '"hello"'],
  ['数字（整数）', '42'],
  ['数字（小数）', '-3.14'],
  ['数字（指数）', '1.5e3'],
  ['布尔', 'true'],
  ['null', 'null'],
  ['嵌套结构', '{"list":[{"id":1},{"id":2}],"ok":true}'],
  ['顶层裸字符串', '"just a string"'],
  ['顶层裸数字', '123'],
  ['顶层数组', '[{"a":1}]'],
];

for (const [label, text] of legalSamples) {
  const value = JSON.parse(text);
  console.log(`  ✓ ${label.padEnd(14)} ${text.padEnd(40)} → ${JSON.stringify(value)}`);
}

console.log('--- 2. 差异一：字符串必须用双引号 ---');

const quoteCases = [
  ['{"name":"张三"}', '双引号 —— 合法'],
  ["{'name':'张三'}", '单引号 —— 非法'],
  ['{"name":"他说\\"你好\\""}', '内部双引号用 \\" 转义 —— 合法'],
  ['{"name":"他说\'你好\'"}', '内部单引号 —— 合法（单引号本身不需转义）'],
];
for (const [text, note] of quoteCases) {
  try {
    console.log(`  ✓ ${note.padEnd(30)} ${text} → ${JSON.stringify(JSON.parse(text))}`);
  } catch (err) {
    console.log(`  ✗ ${note.padEnd(30)} ${text} → ${err.constructor.name}: ${err.message.split('\n')[0]}`);
  }
}

console.log('--- 3. 差异二：键必须用双引号包起来 ---');

const keyCases = [
  ['{"a":1}', '键加双引号 —— 合法'],
  ['{a:1}', '键裸写 —— 非法'],
  ["{'a':1}", '键用单引号 —— 非法'],
  ['{"123":1}', '键是数字字符串 —— 合法'],
  ['{123:1}', '键是数字字面量 —— 非法'],
];
for (const [text, note] of keyCases) {
  try {
    console.log(`  ✓ ${note.padEnd(28)} ${text.padEnd(14)} → ${JSON.stringify(JSON.parse(text))}`);
  } catch (err) {
    console.log(`  ✗ ${note.padEnd(28)} ${text.padEnd(14)} → ${err.constructor.name}: ${err.message.split('\n')[0]}`);
  }
}
console.log('  提示：JSON.stringify 输出的键永远带双引号，所以"程序生成"的 JSON 不会有这个问题。');

console.log('--- 4. 差异三：不允许尾逗号 ---');

const trailingCases = [
  ['{"a":1,"b":2}', '无尾逗号 —— 合法'],
  ['{"a":1,"b":2,}', '对象尾逗号 —— 非法'],
  ['[1,2,3]', '数组无尾逗号 —— 合法'],
  ['[1,2,3,]', '数组尾逗号 —— 非法'],
];
for (const [text, note] of trailingCases) {
  try {
    console.log(`  ✓ ${note.padEnd(24)} ${text.padEnd(18)} → ${JSON.stringify(JSON.parse(text))}`);
  } catch (err) {
    console.log(`  ✗ ${note.padEnd(24)} ${text.padEnd(18)} → ${err.constructor.name}: ${err.message.split('\n')[0]}`);
  }
}
console.log('  ↑ 这是从 JS 手写配置迁移到 JSON 时最常犯的错误。');

console.log('--- 5. 差异四：不允许注释 ---');

const commentCases = [
  ['{"a":1}', '无注释 —— 合法'],
  ['{"a":1} // 这里说明一下', '行注释 —— 非法'],
  ['{"a": /* 数量 */ 1}', '块注释 —— 非法'],
];
for (const [text, note] of commentCases) {
  try {
    console.log(`  ✓ ${note.padEnd(22)} ${text.padEnd(28)} → ${JSON.stringify(JSON.parse(text))}`);
  } catch (err) {
    console.log(`  ✗ ${note.padEnd(22)} ${text.padEnd(28)} → ${err.constructor.name}: ${err.message.split('\n')[0]}`);
  }
}
console.log('  工程做法：需要注释的配置请用 JSONC / YAML / TOML，或者把说明写进专门的字段名里，');
console.log('            例如用 "_comment" 或 "_readme" 这样的键来承载说明文字。');
console.log('            示例：', JSON.stringify({ _comment: '这里的数字表示重试次数', retry: 3 }));

console.log('--- 6. 差异五：没有 undefined，也没有函数与 Symbol ---');

const notJson = [
  ['undefined', 'undefined 不是 JSON 值'],
  ['{"a":undefined}', '值不能是 undefined'],
  ['function(){}', '函数不是 JSON 值'],
  ['{"f":function(){}}', '对象的值不能是函数'],
  ['NaN', 'NaN 不是 JSON 值'],
  ['Infinity', 'Infinity 不是 JSON 值'],
  ['{"n":NaN}', 'NaN 不是合法的值'],
];
for (const [text, note] of notJson) {
  try {
    console.log(`  ✓ ${note.padEnd(26)} ${text.padEnd(22)} → ${JSON.stringify(JSON.parse(text))}`);
  } catch (err) {
    console.log(`  ✗ ${note.padEnd(26)} ${text.padEnd(22)} → ${err.constructor.name}`);
  }
}

// 但要注意：JSON.stringify 遇到这些值时"不报错"，而是走静默降级规则（见 04 号文件）。
const withProblems = { a: undefined, b: function () {}, c: NaN, d: Infinity, e: Symbol('s') };
console.log('  JSON.stringify 遇到这些值的降级结果 =>', JSON.stringify(withProblems));
console.log('  ↑ 序列化是"静默丢数据/变 null"，反序列化是"直接报错"，两者的性格完全不同。');

console.log('--- 7. 差异六：数字的写法限制 ---');

const numberCases = [
  ['0', '单个 0 —— 合法'],
  ['-0', '负零 —— 合法'],
  ['01', '前导零 —— 非法'],
  ['0x1F', '十六进制 —— 非法'],
  ['.5', '省略整数部分 —— 非法'],
  ['1.', '省略小数部分 —— 非法'],
  ['1e3', '指数 —— 合法'],
  ['1E+3', '大写 E 与正号 —— 合法'],
  ['+1', '显式正号 —— 非法'],
  ['1_000', '数字分隔符 —— 非法'],
  ['123456789012345678901234567890', '超大整数 —— 语法合法，但会丢精度'],
];
for (const [text, note] of numberCases) {
  try {
    const v = JSON.parse(text);
    console.log(`  ✓ ${note.padEnd(34)} ${text.padEnd(32)} → ${JSON.stringify(v)}`);
  } catch (err) {
    console.log(`  ✗ ${note.padEnd(34)} ${text.padEnd(32)} → ${err.constructor.name}`);
  }
}

// 精度问题的实证：超过 2^53 - 1 的整数无法精确表示。
const bigInt = 9007199254740993n; // 2^53 + 1
const lostPrecision = JSON.parse(String(bigInt));
console.log('  2^53 + 1 =', String(bigInt));
console.log('  经过 JSON 往返后 =', lostPrecision, '（精度已经丢失）');
console.log('  解决：大整数用字符串传输 ——', JSON.stringify({ id: String(bigInt) }));

console.log('--- 8. 差异七：稀疏数组与数组空位 ---');

console.log('  JS 里可以写 [1, , 3]（中间是空位），长度是 3');
const sparse = [1, , 3];
console.log('  稀疏数组 length =', sparse.length, '，序号 1 的值 =', sparse[1]);
console.log('  JSON.stringify 后 =>', JSON.stringify(sparse), '（空位被写成 null）');
try {
  JSON.parse('[1,,3]');
  console.log('  不会走到这里');
} catch (err) {
  console.log('  JSON.parse("[1,,3]") =>', err.constructor.name + ': ' + err.message.split('\n')[0]);
}
console.log('  ↑ JSON 里没有"空位"概念，缺值只能显式写 null。');

console.log('--- 9. 差异八：字符串里的换行必须转义 ---');

const withNewline = '第一行\n第二行\t带制表符';
console.log('  JS 字符串 =', JSON.stringify(withNewline));
console.log('  序列化后 =', JSON.stringify(withNewline).replace(/\t/g, '\\t'));
console.log('  反序列化回来 =', JSON.stringify(JSON.parse(JSON.stringify(withNewline))));
console.log('  ↑ 真实的换行在 JSON 里必须写成 \\n 两个字符，不能真的敲回车。');

// 非法案例：字符串里直接敲换行。
const badMultiline = '{"msg":"第一行\n第二行"}'; // 注意这里的 \n 是真实换行
try {
  JSON.parse(badMultiline);
  console.log('  不会走到这里');
} catch (err) {
  console.log('  字符串里含真实换行 =>', err.constructor.name + ': ' + err.message.split('\n')[0]);
}

console.log('--- 10. 一张对照表总结 JS 字面量 vs JSON ---');

const table = [
  ['字符串引号', "'a'", '"a"'],
  ['对象的键', 'a: 1', '"a": 1'],
  ['尾逗号', '允许', '不允许'],
  ['注释', '允许', '不允许'],
  ['undefined', '允许作为值', '不允许'],
  ['函数值', '允许', '不允许'],
  ['NaN / Infinity', '允许作为数字', '不允许'],
  ['十六进制数字', '0x1F', '不允许'],
  ['前导零', '01（严格模式下也非法）', '不允许'],
  ['数组空位', '[1, , 3]', '必须写 [1, null, 3]'],
  ['计算属性 / 展开', '允许', '不允许'],
  ['末尾分号 / 变量声明', '文件里常见', '不允许（JSON 只是一段"值"）'],
];
console.log('  ' + '特性'.padEnd(20) + 'JS 对象字面量'.padEnd(24) + 'JSON');
for (const [item, js, json] of table) {
  console.log('  ' + item.padEnd(20) + js.padEnd(24) + json);
}

console.log('--- 11. 小结 ---');
console.log('· JSON 的值只有六种：对象、数组、字符串、数字、布尔、null。');
console.log('· 键与字符串必须双引号；不许尾逗号、不许注释、不许 undefined / 函数 / NaN。');
console.log('· JSON.stringify 遇到不合法值会"静默降级"，JSON.parse 遇到不合法文本会"直接报错"。');
console.log('· 大于 2^53 的整数要用字符串传输，否则精度会悄悄丢失。');
