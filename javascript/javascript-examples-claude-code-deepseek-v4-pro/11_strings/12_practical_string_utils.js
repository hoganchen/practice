/**
 * ============================================================================
 * 知识点：实战字符串工具集 —— 首字母大写、命名风格转换、截断、掩码
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】进阶
 * 【前置知识】11_strings/06_split_and_join.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本文件把前面 11 个文件的知识点组装成一套"日常开发真正会用到"的工具函数：
 *      - capitalize / camelCase / pascalCase / snakeCase / kebabCase / constantCase
 *      - truncate / ellipsis 文本截断（按码点，不拆坏 emoji）
 *      - mask 手机号 / 邮箱 / 身份证掩码
 *      - slugify 生成 URL 友好的短标识
 *      - escapeHtml 防 XSS 转义
 *      - 命名风格互转是前后端字段映射的高频需求（JS 用 camelCase，Python 用 snake_case）
 *
 * 2. 为什么需要
 *    这些函数几乎每个项目都会重新写一遍，但写错的概率极高：
 *    边界情况（空串、null、连续分隔符、全大写缩写、非 ASCII 字符）很容易漏。
 *    集中实现一遍并覆盖边界，比每次现写更可靠。
 *
 * 3. 核心语法要点
 *    - 命名风格转换的通用套路：
 *        a) 先把各种分隔符统一：遇到 _ - 空格 以及"小写→大写"的分界点都切开
 *        b) 全部转小写得到"词数组"
 *        c) 按目标风格重新拼接
 *    - 关键正则是 /[A-Z]/ 前面的零宽断言，用来在驼峰边界切词：
 *        'userName'.replace(/([a-z0-9])([A-Z])/g, '$1 $2')  → 'user Name'
 *    - 截断必须按码点（[...str]）而不是按码元，否则会拆坏 emoji（见 09 号文件）。
 *    - 掩码的关键是"保留几位、掩盖几位"，以及长度不足时不要越界。
 *    - 所有工具函数都应先 String(x ?? '') 归一化输入，避免 null/undefined 报错。
 *
 * 4. 常见陷阱
 *    - 首字母大写只处理第一个字符：'hello'.charAt(0).toUpperCase() + 'hello'.slice(1)，
 *      不要写成 toUpperCase() 后拼接原串（会得到 'Hellohello'）。
 *    - snake_case → camelCase 时忘了处理连续大写缩写（'XMLHttpRequest'）。
 *    - 截断函数没考虑"省略号也要占长度"，结果超出了限制。
 *    - 掩码函数在短输入上越界，产生 'undefined' 或超出原长的字符串。
 *    - 用 toUpperCase 做命名风格比较时忽略了非 ASCII 语言的大小写差异。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/12_practical_string_utils.js
 *
 * 【预期输出】
 *   逐个打印各工具函数在正常输入与边界输入下的返回值。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 通用输入归一化
// ---------------------------------------------------------------------------

console.log('--- 0. 输入归一化 ---');

/**
 * 把任意输入转成字符串；null / undefined 一律变成空串。
 * 这样后续所有工具函数都不必再关心 null / undefined。
 */
function toStr(value) {
  return value === null || value === undefined ? '' : String(value);
}

console.log('toStr(null)：', JSON.stringify(toStr(null)));
console.log('toStr(undefined)：', JSON.stringify(toStr(undefined)));
console.log('toStr(0)：', JSON.stringify(toStr(0)));
console.log('toStr(false)：', JSON.stringify(toStr(false)));

// ---------------------------------------------------------------------------
// 1. 首字母大写 / 小写
// ---------------------------------------------------------------------------

console.log('--- 1. 首字母大小写 ---');

/**
 * 首字母大写。注意只改第一个字符，其余原样保留。
 */
function capitalize(str) {
  const s = toStr(str);
  if (s.length === 0) return s; // 空串直接返回，charAt(0) 会得到 ''，此处提前退出更清晰
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** 首字母小写（常用于把类名转成实例变量名） */
function uncapitalize(str) {
  const s = toStr(str);
  if (s.length === 0) return s;
  return s.charAt(0).toLowerCase() + s.slice(1);
}

console.log("capitalize('hello')：", JSON.stringify(capitalize('hello')));
console.log("capitalize('hELLO')：", JSON.stringify(capitalize('hELLO'))); // 只改首字母
console.log("capitalize('')：", JSON.stringify(capitalize('')));
console.log("capitalize(null)：", JSON.stringify(capitalize(null)));
console.log("capitalize('中文测试')：", JSON.stringify(capitalize('中文测试'))); // 无大小写概念

console.log("uncapitalize('Hello')：", JSON.stringify(uncapitalize('Hello')));
console.log("uncapitalize('URL')：", JSON.stringify(uncapitalize('URL')));

// 每个单词都首字母大写（title case），保留其余字符原样
function titleCase(str) {
  return toStr(str)
    .split(/\s+/)
    .filter((w) => w !== '')
    .map(capitalize)
    .join(' ');
}
console.log("titleCase('hello  beautiful   world')：", JSON.stringify(titleCase('hello  beautiful   world')));

// ---------------------------------------------------------------------------
// 2. 命名风格转换的核心：切词
// ---------------------------------------------------------------------------

console.log('--- 2. 切词 ---');

/**
 * 把任意命名风格的标识符切成小写单词数组。
 * 处理三类分界：
 *   1) 分隔符 _ - 空格 . /（连续的分隔符合并处理）
 *   2) 小写/数字 → 大写的驼峰边界：'userName' → user | Name
 *   3) 连续大写 → 大写+小写 的缩写边界：'XMLHttp' → XML | Http
 */
function splitWords(str) {
  return (
    toStr(str)
      // 第 1 步：驼峰边界插空格。
      // (?<=[a-z0-9]) 先断言前面是小写字母或数字，(?!$) 防止末尾多出空格
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      // 第 2 步：连续大写的最后一个大写字母后面若有小写字母，则在此切开
      // 例：'XMLHttpRequest' → 'XML Http Request'
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      // 第 3 步：把各种分隔符统一成空格
      .replace(/[_\-.\s/]+/g, ' ')
      .trim()
      .split(' ')
      // 去掉可能产生的空片段，并统一转小写
      .filter((w) => w !== '')
      .map((w) => w.toLowerCase())
  );
}

const samples = ['userName', 'user_name', 'user-name', 'UserName', 'XMLHttpRequest', 'get2FA-code', '  spaced  out  '];
for (const s of samples) {
  console.log(`  ${JSON.stringify(s).padEnd(22)} → ${JSON.stringify(splitWords(s))}`);
}
console.log('  空输入 →', JSON.stringify(splitWords('')));
console.log('  null   →', JSON.stringify(splitWords(null)));

// ---------------------------------------------------------------------------
// 3. 命名风格转换
// ---------------------------------------------------------------------------

console.log('--- 3. 命名风格转换 ---');

const { log } = console;

/** camelCase：首词小写，后续词首字母大写 */
function camelCase(str) {
  return splitWords(str)
    .map((w, i) => (i === 0 ? w : capitalize(w)))
    .join('');
}

/** PascalCase（大驼峰）：所有词首字母都大写 */
function pascalCase(str) {
  return splitWords(str).map(capitalize).join('');
}

/** snake_case：全小写，下划线连接 */
function snakeCase(str) {
  return splitWords(str).join('_');
}

/** kebab-case：全小写，短横线连接（常用于 CSS 类名、URL） */
function kebabCase(str) {
  return splitWords(str).join('-');
}

/** CONSTANT_CASE：全大写，下划线连接（常用于常量名） */
function constantCase(str) {
  return splitWords(str).join('_').toUpperCase();
}

const styleInputs = ['userName', 'user_name', 'USER_NAME', 'XMLHttpRequest', 'get2FA-code'];
for (const s of styleInputs) {
  log(`  输入 ${JSON.stringify(s)}`);
  log(`    camelCase    → ${JSON.stringify(camelCase(s))}`);
  log(`    PascalCase   → ${JSON.stringify(pascalCase(s))}`);
  log(`    snake_case   → ${JSON.stringify(snakeCase(s))}`);
  log(`    kebab-case   → ${JSON.stringify(kebabCase(s))}`);
  log(`    CONSTANT_CASE→ ${JSON.stringify(constantCase(s))}`);
}

// 实战：把后端返回的 snake_case 字段批量转成前端用的 camelCase
function keysToCamelCase(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    // 值仍然是嵌套对象时递归处理
    out[camelCase(key)] = value !== null && typeof value === 'object' && !Array.isArray(value)
      ? keysToCamelCase(value)
      : value;
  }
  return out;
}
const apiResponse = { user_id: 7, user_name: '小明', profile_info: { avatar_url: '/a.png' } };
log('\n  后端响应：', JSON.stringify(apiResponse));
log('  转 camelCase：', JSON.stringify(keysToCamelCase(apiResponse)));

// 反向：把前端对象转成后端要的 snake_case
function keysToSnakeCase(obj) {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[snakeCase(key)] = value;
  }
  return out;
}
log('  转 snake_case：', JSON.stringify(keysToSnakeCase({ userId: 7, userName: '小明' })));

// ---------------------------------------------------------------------------
// 4. 截断（按码点，不拆坏 emoji）
// ---------------------------------------------------------------------------

console.log('--- 4. 文本截断 ---');

/**
 * 按"用户看到的字符数"截断，超出部分替换成省略号。
 * @param {*} str       输入
 * @param {number} max  最大字符数（含省略号）
 * @param {string} suffix 省略号，默认为 '…'
 */
function truncate(str, max, suffix = '…') {
  const chars = [...toStr(str)]; // 展开成码点数组，emoji 不会被拆散
  const limit = Math.max(0, Math.floor(Number(max)));
  // 本来就不超长，原样返回
  if (chars.length <= limit) return chars.join('');
  // 省略号自己也要占位置，所以要预留出来
  const keep = Math.max(0, limit - [...suffix].length);
  return chars.slice(0, keep).join('') + suffix;
}

const longText = '这是一段用来演示截断功能的中文文本';
log('  截断 10：', JSON.stringify(truncate(longText, 10)));
log('  截断 6：', JSON.stringify(truncate(longText, 6)));
log('  不超长：', JSON.stringify(truncate('短文本', 10)));
log('  截断 0：', JSON.stringify(truncate(longText, 0))); // 只剩省略号
log('  emoji 安全：', JSON.stringify(truncate('😀😀😀😀😀', 3)));
log('  自定义省略号：', JSON.stringify(truncate('abcdefghij', 7, '...')));
log('  null 输入：', JSON.stringify(truncate(null, 5)));

// 不想要省略号时的变体：按码点硬截
function sliceByChar(str, max) {
  const chars = [...toStr(str)];
  return chars.slice(0, Math.max(0, max)).join('');
}
log('  硬截 3 个 emoji：', JSON.stringify(sliceByChar('😀😀😀😀😀', 3)));

// ---------------------------------------------------------------------------
// 5. 掩码
// ---------------------------------------------------------------------------

console.log('--- 5. 掩码 ---');

/**
 * 通用掩码工具：保留头 head 位与尾 tail 位，中间用 maskChar 填充。
 * 长度不足时按实际长度做尽量合理的处理，绝不越界。
 */
function mask(str, { head = 3, tail = 4, maskChar = '*' } = {}) {
  const s = toStr(str);
  // 太短就整体掩掉，避免"露出比原文还多"的尴尬
  if (s.length <= head + tail) return maskChar.repeat(s.length);
  const middle = maskChar.repeat(s.length - head - tail);
  return s.slice(0, head) + middle + s.slice(s.length - tail);
}

// 每 4 位用空格分隔的银行卡号掩码
function maskBankCard(card) {
  const s = toStr(card).replace(/\s+/g, ''); // 先去掉用户输入里的空格
  if (s.length < 8) return mask(s, { head: 2, tail: 2 });
  return s.slice(0, 4) + ' **** **** ' + s.slice(-4);
}

// 邮箱掩码：保留首字母和域名
function maskEmail(email) {
  const s = toStr(email);
  const at = s.indexOf('@');
  // 不是合法邮箱格式就整体掩掉，避免抛出奇怪结果
  if (at <= 0) return mask(s);
  const local = s.slice(0, at);
  const domain = s.slice(at);
  if (local.length <= 2) return local.charAt(0) + '*'.repeat(Math.max(0, local.length - 1)) + domain;
  return local.charAt(0) + '*'.repeat(local.length - 2) + local.slice(-1) + domain;
}

// 姓名掩码：保留姓，名用 * 代替
function maskName(name) {
  const chars = [...toStr(name)];
  if (chars.length <= 1) return chars.join('');
  // 复姓（如"欧阳"）也一并按"保留第 1 个字"处理，简单可预期
  return chars[0] + '*'.repeat(chars.length - 1);
}

log('  手机号：', JSON.stringify(mask('13812345678')));
log('  身份证：', JSON.stringify(mask('110101199001011234', { head: 6, tail: 4 })));
log('  银行卡：', JSON.stringify(maskBankCard('6222 0212 3456 7890')));
log('  邮箱：', JSON.stringify(maskEmail('zhangsan@example.com')));
log('  邮箱（短）：', JSON.stringify(maskEmail('ab@x.com')));
log('  邮箱（非法）：', JSON.stringify(maskEmail('not-an-email')));
log('  姓名：', JSON.stringify(maskName('张三丰')));
log('  姓名（复姓）：', JSON.stringify(maskName('欧阳修')));
log('  姓名（单字）：', JSON.stringify(maskName('李')));
log('  超短输入：', JSON.stringify(mask('123', { head: 3, tail: 4 })));
log('  null 输入：', JSON.stringify(mask(null)));

// ---------------------------------------------------------------------------
// 6. slugify 与 escapeHtml
// ---------------------------------------------------------------------------

console.log('--- 6. slugify 与 escapeHtml ---');

/**
 * 生成 URL 友好的短标识：小写、空格转连字符、去掉不安全的字符。
 * 注意：中文会被保留（现代浏览器会把中文 URL 编码成 %E4%B8%AD 之类），
 * 若要强制 ASCII slug，需要额外的音译库或映射表，这里不引入外部依赖。
 */
function slugify(str) {
  return toStr(str)
    .trim()
    .toLowerCase()
    // 空格、下划线、连续短横线统一成一个短横线
    .replace(/[\s_]+/g, '-')
    // 去掉除中英文、数字、短横线之外的字符
    .replace(/[^\p{L}\p{N}-]/gu, '')
    // 压缩连续短横线并去掉首尾短横线
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const titles = ['Hello World!', '  JavaScript 入门 指南 ', 'A  B___C', '!!!', '中文标题'];
for (const t of titles) {
  log(`  ${JSON.stringify(t).padEnd(28)} → ${JSON.stringify(slugify(t))}`);
}

/** HTML 转义，用于把用户内容安全地插入页面 */
const HTML_ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(str) {
  return toStr(str).replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}
log('\n  转义：', JSON.stringify(escapeHtml('<img src=x onerror="alert(1)">')));
log('  普通文本：', JSON.stringify(escapeHtml('Tom & Jerry')));

// ---------------------------------------------------------------------------
// 7. 其它常用小工具
// ---------------------------------------------------------------------------

console.log('--- 7. 其它常用小工具 ---');

/** 按指定长度把字符串切成数组（按码点，适合做"每 N 个字换行"） */
function chunk(str, size) {
  const chars = [...toStr(str)];
  const n = Math.max(1, Math.floor(Number(size) || 1)); // 防止 0 或 NaN 导致死循环
  const out = [];
  for (let i = 0; i < chars.length; i += n) {
    out.push(chars.slice(i, i + n).join(''));
  }
  return out;
}
log('  每 3 个一切：', JSON.stringify(chunk('abcdefghij', 3)));
log('  emoji 安全：', JSON.stringify(chunk('😀😀😀😀😀', 2)));
log('  size 为 0 时兜底：', JSON.stringify(chunk('abc', 0)));

/** 统计各字符出现次数，返回按次数降序排列的数组 */
function charFrequency(str) {
  const map = new Map();
  for (const ch of toStr(str)) {
    map.set(ch, (map.get(ch) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
}
log('  字符频率：', JSON.stringify(charFrequency('aabbc')));

/** 判断字符串是否只由空白组成（含空串） */
function isBlank(str) {
  return toStr(str).trim().length === 0;
}
log("  isBlank('   ')：", isBlank('   '));
log("  isBlank(''）：", isBlank(''));
log("  isBlank(' a ')：", isBlank(' a '));

/** 计算"显示宽度"：中日韩全角字符按 2 列算，其它按 1 列算 */
function displayWidth(str) {
  let width = 0;
  for (const ch of toStr(str)) {
    const cp = ch.codePointAt(0);
    // 常见全角区间：CJK 统一表意文字、全角标点、日文假名、韩文、以及 emoji 区段。
    // 这份简化表覆盖常见场景；真正的终端对宽度有一套更复杂的规则（East Asian Width），
    // 需要完全精确时应使用专门的宽度库。
    const isWide =
      (cp >= 0x1100 && cp <= 0x115f) ||
      (cp >= 0x2e80 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) ||
      (cp >= 0xf900 && cp <= 0xfaff) ||
      (cp >= 0xfe30 && cp <= 0xfe6f) ||
      (cp >= 0xff00 && cp <= 0xff60) ||
      (cp >= 0xffe0 && cp <= 0xffe6) ||
      (cp >= 0x1f300 && cp <= 0x1faff); // 常见 emoji 区段
    width += isWide ? 2 : 1;
  }
  return width;
}
log("  显示宽度 'abc'：", displayWidth('abc')); // 3
log("  显示宽度 '中文'：", displayWidth('中文')); // 4
log("  显示宽度 'a中b'：", displayWidth('a中b')); // 4
log("  显示宽度 '😀'：", displayWidth('😀')); // 2

/** 用显示宽度对齐的 padEnd（解决中文表格错位） */
function padEndWide(str, targetWidth, padChar = ' ') {
  const s = toStr(str);
  const pad = Math.max(0, targetWidth - displayWidth(s));
  return s + padChar.repeat(pad);
}
log('\n  用显示宽度对齐的表格：');
for (const [label, value] of [['苹果', 12], ['香蕉', 3], ['火龙果', 128]]) {
  log('    ' + padEndWide(label, 8) + String(value).padStart(5));
}

// ---------------------------------------------------------------------------
// 8. 组合使用：一行代码生成脱敏摘要
// ---------------------------------------------------------------------------

console.log('--- 8. 组合使用 ---');

function maskRecord(record) {
  return {
    // 姓名掩码 + 首字母大写
    name: maskName(record.name),
    // 手机号按通用掩码处理
    phone: mask(record.phone, { head: 3, tail: 4 }),
    // 描述按 12 个字符截断
    desc: truncate(record.desc, 12),
    // 邮箱掩码
    email: maskEmail(record.email),
  };
}

const rawRecord = {
  name: '张三丰',
  phone: '13812345678',
  desc: '这是一段很长的备注信息需要被截断处理',
  email: 'zhangsan@example.com',
};
log('  原始：', JSON.stringify(rawRecord));
log('  脱敏：', JSON.stringify(maskRecord(rawRecord)));

console.log('\n全部演示完毕。');
