/**
 * ============================================================================
 * 知识点：截取子串 —— slice / substring / substr 的区别与负参数行为
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】进阶
 * 【前置知识】11_strings/03_indexing_and_length.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    三个方法都用于从字符串中截取一段，但参数含义和边界处理完全不同：
 *      方法                     第二个参数含义   负数处理          参数反序时
 *      slice(start, end)        结束下标（不含） 从末尾倒数        返回空串
 *      substring(start, end)    结束下标（不含） 一律当 0 处理     自动交换两参数
 *      substr(start, length)    截取长度         仅 start 可为负   不适用（已废弃）
 *    另外还有一个 padEnd 之后新增的 at()，但那是"取一个字符"，不是截取。
 *
 * 2. 为什么需要
 *    截取是最高频的字符串操作之一：截头像路径、取文件扩展名、截断长文本、
 *    从固定格式的编码里抽出字段（如身份证取出生日期）。
 *    理解三者的差异，能避免大量"看起来对、边界一跑就错"的 bug。
 *
 * 3. 核心语法要点
 *    - slice(start, end)：
 *        • 省略 end 表示截到末尾
 *        • 负数下标从末尾算：slice(-3) 取最后 3 个字符
 *        • start >= end 时返回 ''（不会自动交换）
 *        • 支持数组（Array.prototype.slice），负参数行为一致 → 推荐统一使用 slice
 *    - substring(start, end)：
 *        • 负数或 NaN 一律当作 0
 *        • start > end 时自动交换两个参数（所以 substr(3, 1) 不会返回空串）
 *        • end 省略则截到末尾
 *    - substr(start, length)：
 *        • 第二参数是"长度"而不是结束位置
 *        • start 为负时从末尾算；length 为负或 0 时返回 ''
 *        • 已被标记为废弃（Annex B），新代码不应使用
 *
 * 4. 常见陷阱
 *    - 把 slice 的第二个参数误当成"长度"：'abcdef'.slice(2, 3) 得到 'c' 而不是 'cde'。
 *    - 用 slice(x, y) 时 x > y 得到空串，而 substring(x, y) 会交换参数给出结果，
 *      同一个负数表达式喂给两者，结果可能完全不同。
 *    - slice(-0) 与 slice(0) 等价（-0 === 0），无法表达"从末尾取 0 个"。
 *    - 中文/emoji 场景下截断会把代理对劈开，得到乱码（见 09 号文件）。
 *    - 截断展示文本时应加省略号并处理"本来就不长"的情况。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/08_substring_methods.js
 *
 * 【预期输出】
 *   逐组对比三个方法在正常/负参数/反序/越界参数下的返回值。
 * ============================================================================
 */

const s = 'abcdefghij';
console.log('基准字符串：', JSON.stringify(s));
console.log('长度：', s.length);
console.log('下标对照：a=0 b=1 c=2 d=3 e=4 f=5 g=6 h=7 i=8 j=9');

// ---------------------------------------------------------------------------
// 1. slice —— 推荐优先使用
// ---------------------------------------------------------------------------

console.log('--- 1. slice(start, end) ---');

// 基本用法：取 [start, end)，包含 start 不包含 end
console.log("slice(0, 3)：", JSON.stringify(s.slice(0, 3))); // 'abc'
console.log("slice(2, 5)：", JSON.stringify(s.slice(2, 5))); // 'cde'
// 省略 end 则截到末尾
console.log('slice(5)：', JSON.stringify(s.slice(5))); // 'fghij'
// 只给 start=0 等于复制整串
console.log('slice(0)：', JSON.stringify(s.slice(0)));
console.log('slice()：', JSON.stringify(s.slice())); // 不传参数也是整串

// 负数下标：从末尾倒数
console.log('slice(-3)：', JSON.stringify(s.slice(-3))); // 'hij' 最后 3 个
console.log('slice(-3, -1)：', JSON.stringify(s.slice(-3, -1))); // 'hi'
console.log('slice(0, -2)：', JSON.stringify(s.slice(0, -2))); // 'abcdefgh'

// start >= end 时返回空串（不会自动交换）
console.log("slice(5, 2)：", JSON.stringify(s.slice(5, 2))); // ''
console.log("slice(-2, -5)：", JSON.stringify(s.slice(-2, -5))); // ''

// 越界会按边界裁剪，不报错
console.log("slice(100)：", JSON.stringify(s.slice(100))); // ''
console.log("slice(-100)：", JSON.stringify(s.slice(-100))); // 整串
console.log("slice(0, 100)：", JSON.stringify(s.slice(0, 100))); // 整串

// slice 对数组同样适用，负参数语义一致 → 这是它可迁移性最好的原因
const arr = [1, 2, 3, 4, 5];
console.log('数组 slice(-2)：', JSON.stringify(arr.slice(-2))); // [4,5]

// ---------------------------------------------------------------------------
// 2. substring —— 会交换参数、负数当 0
// ---------------------------------------------------------------------------

console.log('--- 2. substring(start, end) ---');

// 正常区间下与 slice 完全一致
console.log("substring(0, 3)：", JSON.stringify(s.substring(0, 3))); // 'abc'
console.log("substring(2, 5)：", JSON.stringify(s.substring(2, 5))); // 'cde'
console.log('substring(5)：', JSON.stringify(s.substring(5))); // 'fghij'

// 关键差异 1：负数一律当作 0
console.log("substring(-3)：", JSON.stringify(s.substring(-3))); // 整串（等价 substring(0)）
console.log("substring(-3, 2)：", JSON.stringify(s.substring(-3, 2))); // 'ab'（等价 substring(0,2)）
console.log('slice(-3, 2)：', JSON.stringify(s.slice(-3, 2))); // ''（对比）

// 关键差异 2：start > end 时自动交换
console.log("substring(5, 2)：", JSON.stringify(s.substring(5, 2))); // 'cde' ← 交换成 (2,5)
console.log('slice(5, 2)：', JSON.stringify(s.slice(5, 2))); // ''（对比）

// NaN 被当成 0
console.log("substring('x', 3)：", JSON.stringify(s.substring('x', 3))); // 'abc'

// 越界同样是裁剪，不报错
console.log('substring(0, 100)：', JSON.stringify(s.substring(0, 100))); // 整串

// ---------------------------------------------------------------------------
// 3. substr —— 已废弃，只做了解
// ---------------------------------------------------------------------------

console.log('--- 3. substr(start, length)（已废弃） ---');

// 第二个参数是"长度"，不是结束位置！
console.log("substr(2, 3)：", JSON.stringify(s.substr(2, 3))); // 'cde'，从下标 2 起取 3 个
console.log('slice(2, 3)：', JSON.stringify(s.slice(2, 3))); // 'c' ← 同样参数结果完全不同

// 省略 length 则截到末尾
console.log('substr(7)：', JSON.stringify(s.substr(7))); // 'hij'

// start 可以是负数（从末尾算），但 length 为负会返回空串
console.log('substr(-3)：', JSON.stringify(s.substr(-3))); // 'hij'
console.log('substr(-3, 2)：', JSON.stringify(s.substr(-3, 2))); // 'hi'
console.log('substr(2, -1)：', JSON.stringify(s.substr(2, -1))); // ''
console.log('substr(2, 0)：', JSON.stringify(s.substr(2, 0))); // ''

// 官方建议：用 slice(start, start + length) 替代 substr(start, length)
const start = 2;
const len = 3;
console.log('slice 替代 substr：', JSON.stringify(s.slice(start, start + len))); // 'cde'

// ---------------------------------------------------------------------------
// 4. 三方法对照表
// ---------------------------------------------------------------------------

console.log('--- 4. 同一组参数下的对照 ---');

const cases = [
  ['(2, 4)', 2, 4],
  ['(4, 2)', 4, 2],
  ['(-3)', -3, undefined],
  ['(-3, -1)', -3, -1],
  ['(0, -2)', 0, -2],
  ['(100)', 100, undefined],
];

// 打印表头
console.log(
  '  参数'.padEnd(12) +
    'slice'.padEnd(14) +
    'substring'.padEnd(14) +
    'substr',
);
for (const [label, a, b] of cases) {
  // 三者在参数为 undefined 时行为不同，需要分别处理"省略第二参数"的情况
  const sliceRes = b === undefined ? s.slice(a) : s.slice(a, b);
  const subRes = b === undefined ? s.substring(a) : s.substring(a, b);
  const substrRes = b === undefined ? s.substr(a) : s.substr(a, b);
  console.log(
    `  ${label.padEnd(10)}${JSON.stringify(sliceRes).padEnd(14)}${JSON.stringify(subRes).padEnd(14)}${JSON.stringify(substrRes)}`,
  );
}

// ---------------------------------------------------------------------------
// 5. 实战场景
// ---------------------------------------------------------------------------

console.log('--- 5. 实战场景 ---');

// 5.1 取文件扩展名（用 lastIndexOf 定位最后一个点）
function extname(filename) {
  const i = filename.lastIndexOf('.');
  // 没有点，或者点在开头（隐藏文件如 .gitignore）都视为没有扩展名
  return i <= 0 ? '' : filename.slice(i);
}
for (const f of ['report.pdf', 'archive.tar.gz', '.gitignore', 'README']) {
  console.log(`  ${f.padEnd(16)} → 扩展名 ${JSON.stringify(extname(f))}`);
}

// 5.2 取路径中的文件名
const fullPath = '/usr/local/bin/node';
console.log('文件名：', JSON.stringify(fullPath.slice(fullPath.lastIndexOf('/') + 1)));

// 5.3 截断长文本并加省略号
function truncate(text, maxLen, suffix = '...') {
  // 先转字符串，避免收到非字符串输入时报错
  const str = String(text);
  // 如果本来就不超长，原样返回
  if (str.length <= maxLen) return str;
  // 预留省略号的长度，保证结果总长不超过 maxLen
  return str.slice(0, Math.max(0, maxLen - suffix.length)) + suffix;
}
console.log('截断 10：', JSON.stringify(truncate('这是一段很长的中文文本需要被截断', 10)));
console.log('截断 20：', JSON.stringify(truncate('short', 20))); // 不超长，原样返回
console.log('截断 0：', JSON.stringify(truncate('abc', 0))); // 退化成纯省略号

// 5.4 取字符串的后 N 位（如展示订单号尾号）
const orderNo = 'ORD2024010500086';
console.log('尾号：', JSON.stringify(orderNo.slice(-4))); // '0086'

// 5.5 去掉最后一个字符（常用于去掉结尾的逗号）
function removeTrailingComma(str) {
  // endsWith 判断 + slice 截取，比正则更直观
  return str.endsWith(',') ? str.slice(0, -1) : str;
}
console.log('去尾逗号：', JSON.stringify(removeTrailingComma('a,b,c,')));
console.log('去尾逗号：', JSON.stringify(removeTrailingComma('a,b,c')));

// ---------------------------------------------------------------------------
// 6. 陷阱：slice 的第二个参数不是长度
// ---------------------------------------------------------------------------

console.log('--- 6. 常见陷阱 ---');

const text = 'Hello, World';
// 想取 5 个字符？下面这种写法是错的，得到的是 [0,5) 共 5 个字符
console.log("slice(0, 5)：", JSON.stringify(text.slice(0, 5))); // 'Hello'
// 想从下标 7 开始取 5 个，正确的写法是 slice(7, 7 + 5)
console.log("slice(7, 7+5)：", JSON.stringify(text.slice(7, 7 + 5))); // 'World'
console.log("slice(7, 5)：", JSON.stringify(text.slice(7, 5))); // '' ← 参数写反的典型后果

// 用 substring 时参数写反不会得到空串，而是"悄悄交换后"给出结果，
// 于是 bug 被掩盖了 —— 这才是 substring 最危险的地方
console.log("substring(7, 5)：", JSON.stringify(text.substring(7, 5))); // ', '（等于 substring(5,7)）

// 真实事故场景：只有某些输入下 start 才会大于 end，此时 slice 直接给空串（错误可被发现），
// 而 substring 给出一段看似合理的文本（错误被悄悄带到线上）
console.log("slice(7, 5)：", JSON.stringify(text.slice(7, 5))); // ''

// slice(-0) 无法表达"取末尾 0 个"，因为 -0 === 0
console.log("slice(-0)：", JSON.stringify(text.slice(-0))); // 整串
console.log("-0 === 0：", -0 === 0); // true

// 截断 emoji 会劈开代理对，得到乱码（详见 09 号文件）
const emojiStr = 'a😀b';
console.log('emoji 串长度：', emojiStr.length); // 4
console.log('slice(0, 2) 结果：', JSON.stringify(emojiStr.slice(0, 2))); // 'a' + 半个 emoji
// 正确做法：按码点数组截取再 join
console.log('按码点截取：', JSON.stringify([...emojiStr].slice(0, 2).join('')));

console.log('\n全部演示完毕。');
