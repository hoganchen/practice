/**
 * ============================================================================
 * 知识点：索引访问与 length —— 方括号、charAt、charCodeAt、codePointAt、at()
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】入门
 * 【前置知识】11_strings/01_creation_and_immutability.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    字符串可以按下标逐字符读取，也可以用 length 属性获取长度，
 *    还可以拿到每个字符对应的数值编码（UTF-16 码元 / Unicode 码点）。
 *      访问方式            越界返回值      支持负索引
 *      str[0]             undefined     否
 *      str.charAt(0)      ''（空串）    否
 *      str.at(0)          undefined     是（推荐）
 *      str.charCodeAt(0)  NaN           否
 *      str.codePointAt(0) undefined     否
 *
 * 2. 为什么需要
 *    - 取首字母、判断首字符类型（如是否为数字）→ str[0] / str.at(0)
 *    - 逐字符遍历、做字符统计 → for...of（按码点）或 for 循环（按码元）
 *    - 字符编码转换、简单的字符集校验 → charCodeAt / codePointAt
 *    - 截取最后几个字符 → at(-1)、slice(-n)
 *
 * 3. 核心语法要点
 *    - length 是 UTF-16 码元的个数，不是"用户看到的字符数"。
 *      超出 BMP（基本多文种平面）的字符（如 emoji）占 2 个码元，length 会是 2。
 *    - str[i] 在越界时返回 undefined，而 charAt(i) 返回空字符串 ''，二者不同。
 *    - charCodeAt 返回 0~65535 的整数（单个 UTF-16 码元）；
 *      codePointAt 返回完整的 Unicode 码点（可能大于 65535）。
 *    - at() 是 ES2022 新增，是唯一支持负索引的访问方式：at(-1) 取最后一个字符。
 *    - 字符串的索引是只读的，不能赋值（见 01 号文件的不可变性）。
 *
 * 4. 常见陷阱
 *    - 用 str.length 统计含 emoji 的文本字符数会偏大。
 *    - 用 str[i] === undefined 判断越界，比 charAt(i) === '' 更不易出错。
 *    - 在 for 循环里用 charCodeAt 遍历 emoji 会把一个字符拆成两个乱码码元，
 *      应按码点遍历则用 for...of 或 Array.from(str)（详见 09 号文件）。
 *    - at() 在旧环境（Node 16 以下、老浏览器）不存在，需要按需降级。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/03_indexing_and_length.js
 *
 * 【预期输出】
 *   对比各访问方式在正常下标、负下标、越界下标下的返回值。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. length 与方括号索引
// ---------------------------------------------------------------------------

console.log('--- 1. length 与方括号索引 ---');

const str = 'JavaScript';

// length 返回码元个数，ASCII 字符一个码元一个字符，所以是 10
console.log('字符串：', JSON.stringify(str));
console.log('length：', str.length);

// 下标从 0 开始
console.log('str[0]：', JSON.stringify(str[0])); // 'J'
console.log('str[4]：', JSON.stringify(str[4])); // 'S'
console.log('str[str.length - 1]：', JSON.stringify(str[str.length - 1])); // 't'

// 越界时返回 undefined（不报错）
console.log('str[100]：', String(str[100])); // 'undefined'
console.log('str[-1]：', String(str[-1])); // 'undefined'，负索引不生效

// 用循环遍历（按码元）
let reversed = '';
for (let i = str.length - 1; i >= 0; i--) {
  reversed += str[i];
}
console.log('倒序：', JSON.stringify(reversed));

// 更简洁的倒序写法：split 成数组后 reverse 再 join（见 06 号文件）
console.log('split+reverse+join：', JSON.stringify(str.split('').reverse().join('')));

// ---------------------------------------------------------------------------
// 2. charAt —— 越界返回空串
// ---------------------------------------------------------------------------

console.log('--- 2. charAt ---');

console.log('charAt(0)：', JSON.stringify(str.charAt(0))); // 'J'
console.log('charAt(100)：', JSON.stringify(str.charAt(100))); // '' 注意不是 undefined

// 与方括号的差别就在这里：越界时一个给 ''，一个给 undefined
console.log('str[100] === undefined：', str[100] === undefined); // true
console.log("charAt(100) === ''：", str.charAt(100) === ''); // true

// 传非整数时会被截断/转换
console.log('charAt(1.9)：', JSON.stringify(str.charAt(1.9))); // 等价 charAt(1) → 'a'
console.log("charAt('2')：", JSON.stringify(str.charAt('2'))); // 字符串数字也能用 → 'v'
console.log("charAt('x')：", JSON.stringify(str.charAt('x'))); // NaN → 当 0 处理 → 'J'

// ---------------------------------------------------------------------------
// 3. charCodeAt —— 拿 UTF-16 码元
// ---------------------------------------------------------------------------

console.log('--- 3. charCodeAt ---');

// 返回 0~65535 之间的整数
console.log('charCodeAt(0)：', str.charCodeAt(0)); // 'J' → 74
console.log('charCodeAt(4)：', str.charCodeAt(4)); // 'S' → 83
// 越界返回 NaN（不是 undefined，也不是 0）
console.log('charCodeAt(100)：', str.charCodeAt(100)); // NaN
console.log('Number.isNaN 判断：', Number.isNaN(str.charCodeAt(100))); // true

// 常见用途 1：判断某位置是不是数字字符（'0' 是 48，'9' 是 57）
const code = str.charCodeAt(0);
console.log('首字符编码：', code, '| 是数字吗：', code >= 48 && code <= 57);

// 常见用途 2：编码与字符互转
console.log('String.fromCharCode(74)：', JSON.stringify(String.fromCharCode(74))); // 'J'
console.log('String.fromCharCode(72, 105)：', JSON.stringify(String.fromCharCode(72, 105))); // 'Hi'

// ---------------------------------------------------------------------------
// 4. codePointAt —— 拿完整 Unicode 码点
// ---------------------------------------------------------------------------

console.log('--- 4. codePointAt ---');

// 😀 的码点是 U+1F600（十进制 128512），超出 65535，因此占 2 个 UTF-16 码元
const emoji = '😀';

console.log('emoji：', JSON.stringify(emoji));
console.log('emoji.length：', emoji.length); // 2 ← 陷阱：不是 1
console.log('emoji[0]：', JSON.stringify(emoji[0])); // 半个代理对，打印出来是乱码
console.log('emoji[1]：', JSON.stringify(emoji[1]));

// charCodeAt 只能拿到码元（代理对的一半），拿不到真正码点
console.log('charCodeAt(0)：', emoji.charCodeAt(0)); // 55357，只是高代理项
console.log('charCodeAt(1)：', emoji.charCodeAt(1)); // 56832，只是低代理项
// codePointAt 会把两个码元合成一个完整码点
console.log('codePointAt(0)：', emoji.codePointAt(0)); // 128512 ← 真正的码点
console.log('16 进制：', '0x' + emoji.codePointAt(0).toString(16).toUpperCase()); // 0x1F600

// 码点转字符串：String.fromCodePoint（对比 fromCharCode 只能处理 BMP）
console.log('String.fromCodePoint(128512)：', JSON.stringify(String.fromCodePoint(128512)));

// 正确遍历含 emoji 的字符串：for...of 按码点迭代
const mixed = 'a😀b';
console.log('mixed.length（码元数）：', mixed.length); // 4
console.log('按码点拆分：', JSON.stringify([...mixed])); // ['a','😀','b'] 共 3 个
console.log('Array.from 等价：', JSON.stringify(Array.from(mixed)));

// ---------------------------------------------------------------------------
// 5. at() —— 支持负索引（ES2022）
// ---------------------------------------------------------------------------

console.log('--- 5. at() ---');

console.log('at(0)：', JSON.stringify(str.at(0))); // 'J'
// 负索引从末尾数：-1 是最后一个
console.log('at(-1)：', JSON.stringify(str.at(-1))); // 't'
console.log('at(-2)：', JSON.stringify(str.at(-2))); // 'p'

// 等价写法对比
console.log('at(-1) 等价于 slice(-1)：', JSON.stringify(str.slice(-1))); // 't'
console.log('at(-1) 等价于 str[str.length-1]：', JSON.stringify(str[str.length - 1])); // 't'

// 越界仍然返回 undefined
console.log('at(100)：', String(str.at(100))); // 'undefined'
console.log('at(-100)：', String(str.at(-100))); // 'undefined'

// emoji 场景下 at() 依然按码元，所以 at(0) 只能拿到半个字符
console.log('emoji.at(0) === emoji[0]：', emoji.at(0) === emoji[0]); // true

// ---------------------------------------------------------------------------
// 6. 综合对比表
// ---------------------------------------------------------------------------

console.log('--- 6. 越界行为对比 ---');

const outOfRange = [100];
for (const i of outOfRange) {
  console.log(`下标 ${i} 时：`);
  console.log('  str[i]           =', String(str[i]));
  console.log('  str.charAt(i)    =', JSON.stringify(str.charAt(i)));
  console.log('  str.at(i)        =', String(str.at(i)));
  console.log('  str.charCodeAt(i)=', String(str.charCodeAt(i)));
  console.log('  str.codePointAt(i)=', String(str.codePointAt(i)));
}

console.log('\n全部演示完毕。');
