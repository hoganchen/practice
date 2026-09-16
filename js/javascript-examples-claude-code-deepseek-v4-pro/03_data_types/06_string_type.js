/**
 * ============================================================================
 * 知识点：string 类型 —— 不可变性、UTF-16 编码、length 与码点的差异
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】入门
 * 【前置知识】03_data_types/01_primitives_overview.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    string 是原始类型，表示一串 UTF-16 编码的"码元（code unit）"序列。
 *    字面量可以用单引号 '、双引号 " 或反引号 ` 书写；反引号是模板字符串，
 *    支持 ${表达式} 插值与跨行书写。
 *
 * 2. 为什么强调"不可变"与"UTF-16"
 *    · 不可变（immutable）：字符串一旦创建就不能被修改。所有看起来"改字符串"
 *      的方法（toUpperCase、slice、replace、+ 拼接）都返回"新字符串"，
 *      原字符串原封不动。因此用变量累积拼接大量文本会产生很多临时对象。
 *    · UTF-16：JS 的 length 数的是"码元"个数（每个 16 位），不是人类眼中的
 *      "字符"个数。基本多文种平面（BMP）之外的字符（如 emoji、部分生僻汉字）
 *      需要用两个码元组成的"代理对（surrogate pair）"表示，
 *      所以 '👍'.length === 2 而不是 1。
 *
 * 3. 核心语法要点
 *    · 访问单个码元：s[i]（返回字符串）或 s.charAt(i)；越界返回 undefined / ''。
 *    · 取码元值：s.charCodeAt(i)（0~65535）；取完整码点：s.codePointAt(i)。
 *    · 由码点构造：String.fromCharCode(...) 按码元，String.fromCodePoint(...) 按码点。
 *    · 按码点遍历：for...of 与 Array.from(s) 会正确处理代理对；s.split('') 不会。
 *    · length 是只读属性，赋值无效（ESM 严格模式下会抛 TypeError）。
 *    · 常用方法：includes / startsWith / endsWith / indexOf / slice / substring /
 *      substr / padStart / padEnd / repeat / trim / replace / replaceAll / split /
 *      toUpperCase / toLowerCase / localeCompare / normalize。
 *    · 模板字符串里的换行会被保留，是构造多行文本的推荐方式。
 *
 * 4. 常见陷阱
 *    · '👍'.length === 2，用 length 做长度校验（如"昵称不超过 10 字"）会算错。
 *    · str[0] = 'X' 静默失败（严格模式下抛 TypeError），因为字符串不可变。
 *    · slice 支持负索引，substring 会把负数当 0 并自动交换参数，两者语义不同。
 *    · substr 已被标记为遗留特性（Annex B），新代码请用 slice。
 *    · 'é' 可能是单码点 U+00E9，也可能是 'e' + U+0301 组合，长度与相等性都不同，
 *      需要 normalize('NFC') 统一。
 *    · '\u{1F44D}' 这种码点转义只在模板/普通字符串中带花括号语法，必须写对。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/06_string_type.js
 *
 * 【预期输出】
 *   打印不可变性实验、UTF-16 码元与码点对比、代理对处理、常用方法速查、
 *   以及规范化对比。全部为确定输出，退出码 0。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 字面量的三种写法
// ---------------------------------------------------------------------------

console.log('--- 1. 三种字符串字面量 ---');

const single = '单引号';
const double = '双引号';
const template = `反引号（模板字符串）`;

console.log(single, '|', double, '|', template);

// 模板字符串支持插值与多行。
const name = '小明';
const age = 18;
console.log(`插值：我叫${name}，今年${age}岁，明年${age + 1}岁。`);

const multiLine = `第一行
第二行
第三行`;
console.log('多行内容：\n' + multiLine);

// 转义字符
console.log('转义示例：', 'It\'s ok', '| 制表符[\t]', '| 换行用 \\n 表示', '| 反斜杠\\\\');

// ---------------------------------------------------------------------------
// 2. 不可变性
// ---------------------------------------------------------------------------

console.log('--- 2. 字符串不可变 ---');

const original = 'hello';
const upper = original.toUpperCase(); // 返回新字符串
console.log('original =', original, '| upper =', upper, '← original 没变');

const replaced = original.replace('l', 'L'); // 只替换第一个匹配
console.log('replace 结果 =', replaced, '| original 仍为', original);

// 用下标赋值：字符串是原始值，无法就地修改。
const immutableStr = 'abc';
try {
  immutableStr[0] = 'X'; // ESM 严格模式下抛 TypeError
} catch (err) {
  console.log('str[0] = "X" →', err.name + ':', err.message);
}
console.log('尝试后仍是：', immutableStr);

// 更隐蔽的"看起来能改"的情况：变量重新赋值其实是指向新字符串。
let mutable = 'a';
const before = mutable; // before 保存的是旧值
mutable += 'b'; // 等价于 mutable = mutable + 'b'，产生新字符串
console.log('mutable =', mutable, '| before =', before, '← 互不影响');

// 性能提示：大量拼接用数组 join 或直接一次模板字符串，减少中间垃圾对象。
const parts = [];
for (let i = 0; i < 3; i++) parts.push('item' + i);
console.log('数组 join 拼接：', parts.join('-'));

// ---------------------------------------------------------------------------
// 3. UTF-16：length 数的是码元，不是字符
// ---------------------------------------------------------------------------

console.log('--- 3. length 与 UTF-16 码元 ---');

const ascii = 'abc';
const thumbsUp = '👍'; // U+1F44D，BMP 之外，需要代理对
const chinese = '中文';
const mixed = 'a👍中';

console.log("'abc'.length   =", ascii.length);
console.log("'中文'.length  =", chinese.length, '（常用汉字在 BMP 内，1 个码元）');
console.log("'👍'.length    =", thumbsUp.length, '← 是 2，不是 1！');
console.log("'a👍中'.length =", mixed.length, '（1 + 2 + 1 = 4）');

// 用 Array.from 或展开运算符可以按"码点"拆分。
console.log("Array.from('a👍中')      =", Array.from(mixed), '长度', Array.from(mixed).length);
console.log("['a👍中'] 展开后长度       =", [...mixed].length);
console.log("'a👍中'.split('')         =", mixed.split(''), '← split 按码元，代理对被拆坏');

// 码元 vs 码点：
console.log("'👍'.charCodeAt(0)  =", thumbsUp.charCodeAt(0), '（高位代理，0xD83D）');
console.log("'👍'.charCodeAt(1)  =", thumbsUp.charCodeAt(1), '（低位代理，0xDC4D）');
console.log("'👍'.codePointAt(0) =", thumbsUp.codePointAt(0), '（完整码点 0x1F44D）');
console.log("'👍'.codePointAt(0).toString(16) =", thumbsUp.codePointAt(0).toString(16));

// 反向构造：
console.log('String.fromCharCode(0xD83D, 0xDC4D) =', String.fromCharCode(0xd83d, 0xdc4d));
console.log('String.fromCodePoint(0x1F44D)       =', String.fromCodePoint(0x1f44d));
console.log('码点转义写法 \\u{1F44D}             =', '\u{1F44D}');

// 用 for...of 按码点遍历（推荐）：
const codePoints = [];
for (const ch of mixed) codePoints.push(ch);
console.log('for...of 遍历结果：', codePoints, '共', codePoints.length, '个码点');

// 实战：正确的"字符数"统计函数
/** 按 Unicode 码点统计长度（比 length 更接近人类直觉，但组合字符仍算多个） */
const codePointLength = (s) => [...s].length;
console.log('codePointLength("a👍中") =', codePointLength(mixed));

// ---------------------------------------------------------------------------
// 4. 组合字符与规范化
// ---------------------------------------------------------------------------

console.log('--- 4. 组合字符与 normalize ---');

// 'é' 有两种写法：单个码点 U+00E9，或者 'e' + 组合重音 U+0301。
const precomposed = 'é'; // é
const decomposed = 'é'; // e +  ́

console.log('precomposed 码元数 =', precomposed.length,
  '| 首码点 = 0x' + precomposed.codePointAt(0).toString(16));
console.log('decomposed  码元数 =', decomposed.length,
  '| 码点依次 = 0x' + decomposed.codePointAt(0).toString(16),
  '0x' + decomposed.codePointAt(1).toString(16));
console.log('渲染出来看都一模一样：', precomposed, decomposed);
console.log('直接 === 比较：', precomposed === decomposed, '← 看起来一样，却不相等');
console.log("先 normalize('NFC') 再比较：",
  precomposed.normalize('NFC') === decomposed.normalize('NFC'), '← 统一形态后才相等');

// ---------------------------------------------------------------------------
// 5. 常用方法速查
// ---------------------------------------------------------------------------

console.log('--- 5. 常用字符串方法 ---');

const s = '  Hello, JavaScript World!  ';
console.log('原串                 =', JSON.stringify(s));
console.log('trim()               =', JSON.stringify(s.trim()));
console.log('toUpperCase()        =', s.trim().toUpperCase());
console.log('toLowerCase()        =', s.trim().toLowerCase());
console.log('includes("Java")     =', s.includes('Java'));
console.log('startsWith("  He")   =', s.startsWith('  He'));
console.log('endsWith("!  ")      =', s.endsWith('!  '));
console.log('indexOf("Java")      =', s.indexOf('Java'));
console.log('lastIndexOf("l")     =', s.lastIndexOf('l'));

const t = 'Hello, JavaScript World';
console.log('t.slice(7, 17)       =', JSON.stringify(t.slice(7, 17)), '（含头不含尾）');
console.log('t.slice(-6)          =', JSON.stringify(t.slice(-6)), '（负索引从末尾数）');
console.log('t.substring(17, 7)   =', JSON.stringify(t.substring(17, 7)), '（自动交换参数）');
console.log('t.slice(17, 7)       =', JSON.stringify(t.slice(17, 7)), '（不会交换，返回空串）');
console.log('t.slice(-100)        =', JSON.stringify(t.slice(-100)), '（超界被夹到 0）');

console.log('"5".padStart(3, "0") =', JSON.stringify('5'.padStart(3, '0')));
console.log('"5".padEnd(3, "*")   =', JSON.stringify('5'.padEnd(3, '*')));
console.log('"ab".repeat(3)       =', JSON.stringify('ab'.repeat(3)));
console.log('"a,b,,c".split(",")  =', 'a,b,,c'.split(','));
console.log('t.replace("l", "L")  =', t.replace('l', 'L'), '（只替换第一个）');
console.log('t.replaceAll("l","L")=', t.replaceAll('l', 'L'), '（全部替换，ES2021）');
console.log('"abc".localeCompare("abd") =', 'abc'.localeCompare('abd'), '（-1 表示排在前面）');

// ---------------------------------------------------------------------------
// 6. 实战：一个按码点安全截断的函数
// ---------------------------------------------------------------------------

console.log('--- 6. 实战：安全截断 ---');

/**
 * 按码点截断字符串，绝不会把代理对切成两半。
 * @param {string} input 原始字符串
 * @param {number} maxCodePoints 最多保留多少个码点
 */
function safeTruncate(input, maxCodePoints) {
  // 先用 Array.from 拆成码点数组，再切片，最后拼回字符串。
  const points = Array.from(input);
  if (points.length <= maxCodePoints) return input;
  return points.slice(0, maxCodePoints).join('') + '…';
}

const longText = '你好👍世界🌍JavaScript';
console.log('原文码点数：', [...longText].length);
console.log('截断到 5  ：', safeTruncate(longText, 5));
console.log('截断到 6  ：', safeTruncate(longText, 6));
console.log('截断到 100：', safeTruncate(longText, 100));

console.log('--- 完成：string 的不可变性与 UTF-16 编码要点 ---');
