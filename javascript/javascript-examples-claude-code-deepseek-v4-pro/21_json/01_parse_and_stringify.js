/**
 * ============================================================================
 * 知识点：JSON.parse / JSON.stringify 基础，以及它们的第二个 / 第三个参数
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 数据格式与序列化
 * 【难度等级】入门
 * 【前置知识】无
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JSON（JavaScript Object Notation）是一种"文本格式"，用纯文本来表示结构化数据。
 *    它由道格拉斯·克罗克福德在 2001 年提出，语法是 JavaScript 对象字面量的一个子集，
 *    但它是"语言无关"的：Python、Java、Go、C# 都能读写同一份 JSON 文本。
 *    JavaScript 里只有两个内置方法负责和 JSON 打交道：
 *      JSON.stringify(value)  —— 把 JS 值"序列化"成 JSON 文本
 *      JSON.parse(text)       —— 把 JSON 文本"反序列化"回 JS 值
 *
 * 2. 为什么需要
 *    程序之间传输数据需要一种双方都能读懂的格式。JSON 比 XML 更短、比二进制更易读、
 *    比 CSV 更能表达嵌套结构，所以成了 Web 的事实标准：
 *    前后端接口、配置文件、日志、本地存储、消息队列，到处都是 JSON。
 *
 * 3. 核心语法要点
 *    ---- JSON.stringify(value, replacer, space) ----
 *      value     要序列化的值
 *      replacer  可选。可以是"数组"（白名单，只保留这些键），
 *                也可以是"函数"（逐个键值对做转换）。见 03 号文件。
 *      space     可选。缩进用的字符串或空格数（最多 10）。
 *                传数字表示缩进几个空格，传字符串表示用这个字符串缩进。
 *                不传（或传 0 / 空串）表示输出紧凑无空白的单行文本。
 *    ---- JSON.parse(text, reviver) ----
 *      text    合法的 JSON 文本（注意：必须是 JSON，不是 JS 字面量）
 *      reviver 可选。一个函数，在解析过程中对每个键值对做后处理。见 03 号文件。
 *
 * 4. 常见陷阱
 *    (1) JSON.stringify 的"第三个参数"是缩进，不是"要不要格式化"的布尔值。
 *        只有数字（空格个数）与字符串（缩进内容）两种取值有效，
 *        传 true / false / null 一律不产生缩进，容易让人误以为"开关没生效"。
 *    (2) 格式化会显著增大文本体积（多出大量空格与换行），
 *        网络传输时用紧凑格式，给人看时再格式化。
 *    (3) JSON.parse 遇到非法文本会抛 SyntaxError，必须 try/catch。
 *    (4) 反序列化得到的是"全新的对象"，与原对象没有任何引用关系。
 *    (5) JSON.stringify 返回的是字符串；如果顶层值是 undefined，
 *        返回值是 undefined 而不是字符串 "undefined"（见 04 号文件）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/01_parse_and_stringify.js
 *
 * 【预期输出】
 *   打印同一个对象在不同参数下的序列化结果（紧凑 / 缩进 2 空格 / 自定义缩进），
 *   并把 JSON 文本反序列化回对象，验证两者内容一致。
 * ============================================================================
 */

console.log('--- 1. 最简单的序列化：对象 → JSON 文本 ---');

const user = {
  id: 42,
  name: '张三',
  vip: true,
  tags: ['前端', 'Node'],
  profile: { city: '上海', age: 30 },
};

// 不传后两个参数时，输出紧凑的单行文本，没有任何多余空白。
const compact = JSON.stringify(user);
console.log('  紧凑格式（无空白，适合网络传输）：');
console.log('   ', compact);
console.log('  文本长度 =', compact.length);
console.log('  返回值类型 =', typeof compact);

console.log('--- 2. 第三个参数：缩进（美化输出） ---');

// 传数字 n：用 n 个空格缩进（规范上限是 10，超过按 10 处理）。
const pretty2 = JSON.stringify(user, null, 2);
console.log('  缩进 2 空格：');
console.log(pretty2);
console.log('  文本长度 =', pretty2.length, '（比紧凑格式长了', pretty2.length - compact.length, '个字符）');
console.log('  ↑ 美化只是为了给人看，传输时应该用紧凑格式。');

// 传字符串：用这个字符串当作每一层的缩进。
const prettyTab = JSON.stringify(user, null, '\t');
console.log('  用制表符缩进（只打印前两行）：');
console.log(prettyTab.split('\n').slice(0, 2).join('\n') + '\n    …');

const prettyCustom = JSON.stringify({ a: { b: 1 } }, null, '--');
console.log('  用自定义字符串 "--" 缩进：');
console.log(prettyCustom);

console.log('--- 3. 缩进参数的边界情况 ---');

console.log('  不传第三参 =>', JSON.stringify({ a: 1 }));
console.log('  传 0       =>', JSON.stringify({ a: 1 }, null, 0));
console.log('  传空字符串 =>', JSON.stringify({ a: 1 }, null, ''));
console.log('  传 20（超过上限 10，按 10 处理）=>');
console.log(JSON.stringify({ a: { b: 1 } }, null, 20).split('\n').map((l) => '    ' + JSON.stringify(l)).join('\n'));
// 传布尔值不会被当成 1 或 0：规范只认"数字"和"字符串"两种缩进参数，
// 其他类型一律视为"不缩进"。所以下面这行输出依旧是紧凑格式。
console.log('  传 true =>', JSON.stringify({ a: { b: 1 } }, null, true), '（非数字/字符串的缩进参数被忽略）');

console.log('--- 4. 反向操作：JSON 文本 → 对象 ---');

const text = '{"id":42,"name":"张三","vip":true,"tags":["前端","Node"],"profile":{"city":"上海","age":30}}';
const parsed = JSON.parse(text);

console.log('  文本 =', text);
console.log('  解析结果 =', parsed);
console.log('  是对象吗 =', typeof parsed, ' 是数组吗 =', Array.isArray(parsed));
console.log('  取值 parsed.profile.city =', parsed.profile.city);
console.log('  嵌套数组 parsed.tags[0] =', parsed.tags[0]);

// 往返一致性：序列化再反序列化，结构应完全一致。
const roundTrip = JSON.parse(JSON.stringify(user));
console.log('  往返后与原对象"深相等"吗（用 JSON 文本比较）=',
  JSON.stringify(roundTrip) === JSON.stringify(user));
console.log('  但它们是两个不同的对象 =', roundTrip !== user,
  '，嵌套对象也是新的 =', roundTrip.profile !== user.profile);

console.log('--- 5. 数组与原始值的序列化 ---');

console.log('  数组 =>', JSON.stringify([1, 'two', true, null]));
console.log('  嵌套数组 =>', JSON.stringify([[1, 2], [3, [4, 5]]]));
console.log('  字符串 =>', JSON.stringify('hello'));
console.log('  数字   =>', JSON.stringify(3.14), JSON.stringify(-0), JSON.stringify(1e21));
console.log('  布尔   =>', JSON.stringify(true), JSON.stringify(false));
console.log('  null   =>', JSON.stringify(null));
console.log('  ↑ 注意：字符串会被加上双引号，因为 JSON 顶层允许"裸"的字符串值。');

console.log('--- 6. JSON.parse 的非法输入会抛错（必须 try/catch） ---');

const badInputs = [
  "{'name':'张三'}",       // 单引号不是合法 JSON
  '{name:"张三"}',          // 键没有加引号
  '{"a":1,}',              // 尾逗号
  '',                      // 空串
  'undefined',             // undefined 不是 JSON 值
  '{"a":1}{"b":2}',        // 两个值连在一起
];

for (const bad of badInputs) {
  try {
    const r = JSON.parse(bad);
    console.log(`  ${JSON.stringify(bad).padEnd(22)} => 竟然通过了：${JSON.stringify(r)}`);
  } catch (err) {
    console.log(`  ${JSON.stringify(bad).padEnd(22)} => ${err.constructor.name}: ${err.message.split('\n')[0]}`);
  }
}
console.log('  ↑ JSON.parse 的报错信息里会带"位置"，定位问题很有用。');

console.log('--- 7. JSON.parse 与 eval 的区别（为什么不能用 eval 解析 JSON） ---');

// eval 会把输入当成"JS 代码"执行，所以它既能解析合法 JSON，
// 也会执行注入的代码 —— 这是严重的安全漏洞，永远不要用 eval 解析 JSON。
const injected = '{"a": (function(){ console.log("    【危险】这段代码被 eval 执行了！"); return 1; })()}';
console.log('  用 eval 解析带代码的文本：');
const viaEval = eval('(' + injected + ')');
console.log('    eval 结果 =', viaEval);

console.log('  用 JSON.parse 解析同样的文本：');
try {
  JSON.parse(injected);
  console.log('    不会走到这里');
} catch (err) {
  console.log('    ' + err.constructor.name + ': ' + err.message.split('\n')[0]);
}
console.log('  ↑ 结论：JSON.parse 只认数据、不执行代码，所以它才是安全的解析方式。');

console.log('--- 8. 常见派生用法：用 JSON 文本做"深相等"比较 ---');

const objA = { x: 1, y: [1, 2] };
const objB = { x: 1, y: [1, 2] };
console.log('  直接 === 比较 =>', objA === objB, '（比较的是引用）');
console.log('  用 JSON 文本比较 =>', JSON.stringify(objA) === JSON.stringify(objB));
console.log('  注意：这种比较依赖"键的顺序一致"，键顺序不同就会判为不等：');
console.log('    {a:1,b:2} 与 {b:2,a:1} =>',
  JSON.stringify({ a: 1, b: 2 }) === JSON.stringify({ b: 2, a: 1 }));

console.log('--- 9. 小结 ---');
console.log('· JSON.stringify(value, replacer, space)：第二个参数控制"保留什么"，第三个控制"怎么排版"。');
console.log('· JSON.parse(text, reviver)：第二个参数用于解析后的后处理。');
console.log('· 缩进只是给人看的，线上传输用紧凑格式。');
console.log('· JSON.parse 只解析数据、不执行代码，比 eval 安全得多；失败时抛 SyntaxError。');
