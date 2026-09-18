/**
 * ============================================================================
 * 知识点：replace 的第二个参数用函数 —— 动态替换与回调参数含义
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】进阶
 * 【前置知识】13_regexp/05_groups_and_alternation.js、13_regexp/07_named_groups.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    String.prototype.replace(searchValue, replaceValue) 的第二个参数除了字符串，
 *    还可以是一个函数。此时 replace 会对每一个匹配调用一次这个函数，
 *    并用"函数返回值"作为替换文本。这个函数叫"替换回调"（replacer function）。
 *
 * 2. 为什么需要
 *    字符串替换串只能做"搬家"（$1 移到别处），做不到"计算"：
 *      · 把匹配到的数字乘以 2 再写回去
 *      · 按照匹配内容去查表决定替换成什么
 *      · 大小写变换、驼峰转下划线、单位换算、时间格式改写
 *      · 给不重复的匹配依次编号
 *    一旦替换结果依赖匹配内容本身，就必须用函数形式。
 *
 * 3. 核心语法要点
 *    回调函数的参数（按顺序，且个数由正则决定）：
 *      1) match      —— 本次匹配到的完整文本（等价于 $&）
 *      2) p1..pn     —— 第 1..n 个捕获组的内容（未参与匹配的组是 undefined）
 *      3) offset     —— 本次匹配在源字符串中的起始下标
 *      4) string     —— 被搜索的整个源字符串（等价于 $` 与 $' 的组合来源）
 *      5) groups     —— 具名捕获组的对象（只有存在具名组时才会传这个参数）
 *    参数个数是动态的：
 *      没有捕获组 → (match, offset, string)
 *      有 2 个捕获组 → (match, p1, p2, offset, string)
 *      有具名组 → 末尾再追加 groups
 *    所以想拿 offset 千万不要靠"数第几个参数"，正确做法是用 rest 参数
 *    从后往前取，或者干脆只用具名组 + groups。
 *
 * 4. 常见陷阱
 *    (1) 误以为第三个参数一定是 offset —— 有捕获组时它是 p1。
 *    (2) 回调里返回 undefined 会被当成字符串 "undefined" 插回去（不是"跳过"）。
 *    (3) 无 g 标志时只会替换第一个匹配，回调也只会被调用一次。
 *    (4) 回调里用了正则的 lastIndex 之类的状态，可能得到意外结果。
 *    (5) 忘记 return，函数返回 undefined，结果字符串里出现 "undefined"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/10_replace_with_function.js
 *
 * 【预期输出】
 *   打印回调每次被调用时的全部参数，让你看清参数个数的变化规律；
 *   再用若干实战（数值计算、查表、大小写转换、驼峰下划线互转、时间重排）
 *   展示"只有函数才能做到"的替换。
 * ============================================================================
 */

console.log('--- 1. 先看清回调被调用时到底收到什么参数 ---');

const text1 = '价格是 12 元和 345 元';

// 用 rest 参数把所有实参收集起来打印，避免"猜参数位置"。
const replaced1 = text1.replace(/(\d+)\s*元/g, (...args) => {
  // 有 1 个捕获组时，args = [match, p1, offset, string]
  console.log('  回调收到参数：', args.map((a) => (typeof a === 'string' ? JSON.stringify(a) : a)));
  return `<${args[1]}>`;
});
console.log('  替换结果 =', replaced1);

console.log('--- 2. 参数个数随捕获组数量变化 ---');

const text2 = 'a=1, b=22';

console.log('  没有任何捕获组：');
text2.replace(/\d+/g, (...args) => {
  console.log(`    args.length = ${args.length}，依次是：${args.map((a) => JSON.stringify(a)).join(' | ')}`);
  return args[0];
});

console.log('  有 2 个捕获组：');
text2.replace(/(\w)=(\d+)/g, (...args) => {
  console.log(`    args.length = ${args.length}，依次是：${args.map((a) => JSON.stringify(a)).join(' | ')}`);
  return args[0];
});

console.log('  有具名组（末尾会多一个 groups 对象）：');
text2.replace(/(?<k>\w)=(?<v>\d+)/g, (...args) => {
  console.log(`    args.length = ${args.length}`);
  console.log('      前几个 =', args.slice(0, -1).map((a) => JSON.stringify(a)).join(' | '));
  console.log('      最后一个 =', JSON.stringify(args.at(-1)));
  return args[0];
});

console.log('--- 3. 结论：想拿 offset 就用 rest 参数，别数位置 ---');

const text3 = 'x1 y22 z333';
// 正确姿势：固定形参只声明自己确定要的，剩下的用 rest 接住。
text3.replace(/(\d+)/g, (match, p1, ...rest) => {
  // rest = [offset, string]，因为这里恰好有 1 个捕获组
  const offset = rest[0];
  console.log(`    匹配 ${JSON.stringify(match)} 位置=${offset} 捕获组=${JSON.stringify(p1)}`);
  return match;
});

console.log('--- 4. 实战一：对匹配到的数值做计算 ---');

const prices = '商品A 1200 元，商品B 350 元，商品C 80 元';
// 逐符号解释 /(\d+) 元/g：
//   (\d+)  组 1：一个或多个数字
//   元     字面量"元"字
//   g      全局替换
const doubled = prices.replace(/(\d+) 元/g, (_match, num) => `${Number(num) * 2} 元`);
console.log('  原价 =', prices);
console.log('  翻倍 =', doubled);

// 折扣计算 + 保留两位小数
const discounted = prices.replace(/(\d+) 元/g, (_m, num) => (Number(num) * 0.85).toFixed(2) + ' 元');
console.log('  八五折 =', discounted);

console.log('--- 5. 实战二：用查表决定替换内容 ---');

const template = '你好 {{name}}，你的订单 {{orderId}} 已发货，预计 {{days}} 天到达。';
const data = { name: '张三', orderId: 'A-2026-0916', days: '3' };

// 逐符号解释 /\{\{(\w+)\}\}/g：
//   \{\{        两个字面的左花括号（花括号是量词符号，必须转义）
//   (\w+)       组 1：键名（字母、数字、下划线）
//   \}\}        两个字面的右花括号
//   g           全部替换
const rendered = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
  const value = data[key];
  // 找不到键时保留原样，而不是插入 "undefined"。
  return value === undefined ? match : value;
});
console.log('  模板 =', template);
console.log('  渲染 =', rendered);

// 故意留一个没定义的占位符，验证兜底逻辑生效。
console.log('  缺键时保留原样 =',
  '你好 {{nickname}}'.replace(/\{\{(\w+)\}\}/g, (m, k) => (data[k] === undefined ? m : data[k])));

console.log('--- 6. 实战三：用 offset 做"第 N 次出现"的标注 ---');

const words = 'apple banana apple cherry apple';
let counter = 0;
const numbered = words.replace(/apple/g, (match, offset) => {
  counter += 1;
  return `${match}#${counter}(@${offset})`;
});
console.log('  原文 =', words);
console.log('  结果 =', numbered);
console.log('  回调函数天然是"按顺序调用"的，因此可以用来维护调用次数。');

console.log('--- 7. 实战四：驼峰与下划线互转 ---');

const camel = 'userNameAndId';
// 逐符号解释 /([A-Z])/g：
//   ([A-Z])  组 1：一个大写字母
//   g        全局替换
const snake = camel.replace(/([A-Z])/g, (_m, upper, offset, whole) => {
  // 首字母大写时不加下划线（避免 "_user_name"）
  return (offset === 0 ? '' : '_') + upper.toLowerCase();
});
console.log(`  驼峰 ${camel} => 下划线 ${snake}`);

// 反向：下划线转驼峰
const snake2 = 'user_name_and_id';
// 逐符号解释 /_([a-z])/g：
//   _         字面下划线
//   ([a-z])   组 1：一个小写字母
const camel2 = snake2.replace(/_([a-z])/g, (_m, ch) => ch.toUpperCase());
console.log(`  下划线 ${snake2} => 驼峰 ${camel2}`);

console.log('--- 8. 实战五：一段正则改写时间格式（含校验与兜底） ---');

const logs = '2026-09-16 08:05:00 开始 | 2026-12-31 23:59:59 结束';

// 逐符号解释 /(?<y>\d{4})-(?<mo>\d{2})-(?<d>\d{2})/g：
//   (?<y>\d{4})   年
//   (?<mo>\d{2})  月
//   (?<d>\d{2})   日
const pretty = logs.replace(/(?<y>\d{4})-(?<mo>\d{2})-(?<d>\d{2})/g, (_m, ...rest) => {
  const groups = rest.at(-1); // 具名组永远是最后一个参数
  return `${groups.y}年${Number(groups.mo)}月${Number(groups.d)}日`;
});
console.log('  原文 =', logs);
console.log('  改写 =', pretty);

console.log('--- 9. 实战六：给 JSON 里的数字做千分位（只在字符串外侧生效） ---');

const amount = '{"total":1234567,"tax":8900}';
// 用函数形式可以在回调里做判断，字符串替换串做不到这一点。
const withComma = amount.replace(/"total":(\d+)/g, (_m, num) =>
  `"total":${num.replace(/(?<=\d)(?=(\d{3})+$)/g, ',')}`);
console.log('  原文 =', amount);
console.log('  结果 =', withComma, '（注意：这已经不是合法 JSON 数字了，仅作演示）');

console.log('--- 10. 陷阱：回调返回 undefined 会变成字符串 ---');

const danger = 'a1b2';
const bad = danger.replace(/\d/g, (_m) => {
  // 忘记写 return，函数返回 undefined
});
console.log('  回调没有返回值 =>', bad);
console.log('  ↑ 结果里插入了 "undefined"，这是最常见的低级 bug，务必检查 return。');

// 想"什么都不替换"应该显式返回原匹配。
const keep = danger.replace(/\d/g, (m) => m);
console.log('  显式返回原匹配 =>', keep);

console.log('--- 11. 陷阱：没有 g 时回调只被调用一次 ---');

let calls = 0;
const once = 'a1b2c3'.replace(/[abc]/, (m) => {
  calls += 1;
  return m.toUpperCase();
});
console.log('  无 g 的替换结果 =', once, '，回调调用次数 =', calls);
calls = 0;
const all = 'a1b2c3'.replace(/[abc]/g, (m) => {
  calls += 1;
  return m.toUpperCase();
});
console.log('  有 g 的替换结果 =', all, '，回调调用次数 =', calls);

console.log('--- 12. 陷阱：捕获组未参与匹配时回调收到 undefined ---');

// 下面的正则有两个分支，每次只有一个组有值。
const branch = 'cat dog';
const out = branch.replace(/(cat)|(dog)/g, (_m, g1, g2, offset) => {
  console.log(`    offset=${offset} g1=${JSON.stringify(g1)} g2=${JSON.stringify(g2)}`);
  return (g1 ?? g2).toUpperCase();
});
console.log('  替换结果 =', out);

console.log('--- 13. 小结 ---');
console.log('· 回调参数顺序：match, p1..pn, offset, string, groups(可选)。');
console.log('· 想拿 offset 请用 rest 参数，别依赖"第 3 个参数"这种位置假设。');
console.log('· 一定要写 return；返回 undefined 会被拼成字符串 "undefined"。');
console.log('· 只要替换结果依赖匹配内容本身，就应该用函数形式而不是 $1 字符串。');
