/**
 * ============================================================================
 * 知识点：畸形 UTF-16 字符串 —— isWellFormed / toWellFormed（ES2024）与孤立代理项
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】进阶
 * 【前置知识】11_strings/09_unicode_and_codepoints.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 的字符串是 UTF-16 编码的"码元（code unit）"序列，每个码元 16 位。
 *    Unicode 码位（code point）U+0000 ~ U+FFFF 用一个码元表示（BMP）；
 *    U+10000 以上（如 emoji）需要两个码元：一个"高位代理"（0xD800~0xDBFF）
 *    加一个"低位代理"（0xDC00~0xDFFF），合称"代理对（surrogate pair）"。
 *
 *    如果字符串里出现了一个落单的代理码元，它就叫"孤立代理项（lone surrogate）"，
 *    这个字符串就是"畸形（ill-formed）"的 UTF-16 字符串。
 *    这种字符串不是合法的 Unicode 文本，很多 API 遇到它会抛错或产出脏数据。
 *
 *    ES2024 新增了两个方法专门处理这个问题：
 *      str.isWellFormed()   检查字符串是否为合法的 UTF-16（无孤立代理项）
 *      str.toWellFormed()   把孤立代理项替换成 U+FFFD（替换字符 �），返回修好的新串
 *
 * 2. 为什么需要
 *    真实项目里畸形字符串几乎必然出现，来源包括：
 *      · 按"码元"而不是"码位"做切片/反转/截断，把一个代理对从中间切开；
 *      · 从网络或文件读入被截断的 UTF-8，再被错误地按 Latin-1 解码；
 *      · 逐字节解析二进制协议时按错误的边界切分；
 *      · 用 String.fromCharCode() 手工拼字符串时算错了长度。
 *    带着它继续往下走的后果：
 *      · encodeURIComponent() 直接抛 URIError，请求发不出去；
 *      · JSON.stringify() 会把它原样输出成 "\ud800" 这种"合法 JSON 但脏数据"的转义，
 *        下游（尤其是 Java / Python / Go 服务）解析时可能报错；
 *      · 写入文件、发到网络、存数据库后变成"乱码"或 mysql 的
 *        "Incorrect string value" 报错，而且很难定位源头。
 *    所以"入口做校验、出口前做修复"是处理外部文本的标准做法。
 *
 * 3. 核心语法要点
 *    - str.isWellFormed() → boolean：不抛错，只做判断。
 *    - str.toWellFormed() → string：把每个非法代理码元换成 U+FFFD，返回新串。
 *      注意是"每个"，所以 '\uD800\uD800' 会变成两个 U+FFFD。
 *    - 判断规则：
 *        高位代理（0xD800~0xDBFF）后面必须紧跟低位代理（0xDC00~0xDFFF），否则非法；
 *        低位代理（0xDC00~0xDFFF）前面必须是高位代理，否则非法。
 *    - 没有这两个方法时（Node < 20 / 旧浏览器），可以用 charCodeAt 手写判断与修复，
 *      本文件第 5、6 节给出完整实现并与内置结果逐一对照。
 *    - 相关但不同的 API：TextEncoder 走 USVString 转换，会把孤立代理静默换成
 *      U+FFFD（不抛错），这与 encodeURIComponent 抛 URIError 的行为不同。
 *
 * 4. 常见陷阱
 *    - 不要把"码元长度"当成"字符个数"：'😀'.length === 2，而 ['😀'].length === 1。
 *    - 不要用 split('') / reverse() / join('') 处理含 emoji 的字符串，
 *      它们按码元操作，会把代理对切开，亲手制造出畸形字符串。
 *    - toWellFormed() 是"修复"，不是"还原"：被替换掉的信息永远丢失，
 *      所以它只适合兜底清洗，不能替代在源头正确按码位处理。
 *    - isWellFormed() 检查的是"UTF-16 结构是否合法"，不是"这段文本是否有意义"。
 *    - 本文件只讲代理项层面的问题；把字符串按"字素簇（grapheme cluster）"切分
 *      （例如让 '👨‍👩‍👧' 算作 1 个用户可见字符）是另一件事，
 *      由 Intl.Segmenter 负责，见 33_intl/05_intl_segmenter.js。
 *    - 只关心"孤立代理项如何影响 JSON 序列化/反序列化"的读者，
 *      可以参看 21_json/11_lone_surrogates.js（本文件覆盖面更广，含 URI 编码与二进制转换）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/13_well_formed_unicode.js
 *
 * 【预期输出】
 *   演示畸形字符串的构造、危害、检测与两种修复方式（内置 + 手写），并验证两者一致。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 特性检测
// ---------------------------------------------------------------------------

console.log('--- 0. 特性检测 ---');

// 用 typeof 检测原型上有没有这两个方法（ES2024 新增）
const hasIsWellFormed = typeof ''.isWellFormed === 'function';
const hasToWellFormed = typeof ''.toWellFormed === 'function';
const hasNativeSupport = hasIsWellFormed && hasToWellFormed;

console.log('String.prototype.isWellFormed 可用：', hasIsWellFormed);
console.log('String.prototype.toWellFormed 可用：', hasToWellFormed);
console.log('Node 版本：', process.version);
console.log(hasNativeSupport
  ? '→ 本环境支持 ES2024 的内置方案，下面优先使用内置方法。'
  : '→ 本环境不支持内置方法，将自动降级到手写实现（第 5、6 节）。');

/**
 * 统一入口：优先用内置方法，不支持时退回手写实现。
 * 这样本文件在任何 Node 18+ 上都能跑出同样的结果。
 */
function isWellFormed(str) {
  // 内置方法存在就直接用
  if (hasIsWellFormed) return str.isWellFormed();
  // 否则走手写实现（定义见第 5 节，JS 的函数声明会提升，这里可以提前调用）
  return isWellFormedManual(str);
}

function toWellFormed(str) {
  if (hasToWellFormed) return str.toWellFormed();
  return toWellFormedManual(str);
}

// ---------------------------------------------------------------------------
// 1. 什么是代理对与孤立代理项
// ---------------------------------------------------------------------------

console.log('\n--- 1. 代理对与孤立代理项 ---');

// BMP 内的字符：一个码元就是一个码位
console.log("'A'   长度：", 'A'.length, '| 码元：', 'A'.charCodeAt(0).toString(16));

// 😀 U+1F600，超出 BMP，需要两个码元
const emoji = '😀';
console.log("'😀' 长度：", emoji.length, '（两个码元！）',
  '| 码元：', emoji.charCodeAt(0).toString(16).toUpperCase(), emoji.charCodeAt(1).toString(16).toUpperCase());
console.log('  第一半是高位代理（0xD800~0xDBFF），第二半是低位代理（0xDC00~0xDFFF）');
console.log('  按码位迭代才是 1 个字符：', Array.from(emoji).length);
console.log('  码位： U+' + emoji.codePointAt(0).toString(16).toUpperCase());

// 代理项的数值范围（记下来，第 5 节手写检测要用）
const HIGH_SURROGATE_MIN = 0xd800;
const HIGH_SURROGATE_MAX = 0xdbff;
const LOW_SURROGATE_MIN = 0xdc00;
const LOW_SURROGATE_MAX = 0xdfff;

/**
 * 判断一个码元值是不是"高位代理"（代理对的第一个码元）
 */
function isHighSurrogate(code) {
  return code >= HIGH_SURROGATE_MIN && code <= HIGH_SURROGATE_MAX;
}

/**
 * 判断一个码元值是不是"低位代理"（代理对的第二个码元）
 */
function isLowSurrogate(code) {
  return code >= LOW_SURROGATE_MIN && code <= LOW_SURROGATE_MAX;
}

console.log('\n代理项范围：');
console.log(`  高位代理 U+${HIGH_SURROGATE_MIN.toString(16).toUpperCase()} ~ U+${HIGH_SURROGATE_MAX.toString(16).toUpperCase()}`);
console.log(`  低位代理 U+${LOW_SURROGATE_MIN.toString(16).toUpperCase()} ~ U+${LOW_SURROGATE_MAX.toString(16).toUpperCase()}`);
console.log('  😀 的两个码元是否构成代理对：', isHighSurrogate(emoji.charCodeAt(0)) && isLowSurrogate(emoji.charCodeAt(1)));

// ---------------------------------------------------------------------------
// 2. 构造一个畸形字符串（用于演示）
// ---------------------------------------------------------------------------

console.log('\n--- 2. 如何构造畸形字符串 ---');

// 最直接的方式：用 \uXXXX 转义直接写出一个孤立的代理码元
const loneHigh = '\uD800';              // 只有高位代理，后面没有低位代理
const loneLow = '\uDC00';               // 只有低位代理，前面没有高位代理
const mixed = 'a\uD800b';               // 夹在正常字符中间
const twoHighs = '\uD800\uD800';        // 两个高位代理挨在一起，谁都不配对
const lowThenHigh = '\uDC00\uD83D';     // 顺序反了，低位在前高位在后

// 更贴近现实的构造方式：把代理对从中间切开
// '😀' 的两个码元是 D83D DE00，切前一半就得到孤立的高位代理
const slicedEmoji = '😀'.slice(0, 1);
// 反转码元顺序也会切开代理对
const reversedEmoji = '😀'.split('').reverse().join('');

const malformedSamples = [
  ['\\uD800（孤立高位代理）', loneHigh],
  ['\\uDC00（孤立低位代理）', loneLow],
  ['a\\uD800b（夹在中间）', mixed],
  ['\\uD800\\uD800（两个高位）', twoHighs],
  ['\\uDC00\\uD83D（顺序颠倒）', lowThenHigh],
  ["'😀'.slice(0, 1)（切开代理对）", slicedEmoji],
  ["'😀'.split('').reverse().join('')（反转）", reversedEmoji],
];

console.log('构造出的畸形字符串：');
for (const [desc, str] of malformedSamples) {
  console.log(
    `  ${desc.padEnd(42)} length=${str.length}  码元=[${Array.from({ length: str.length }, (_, i) => str.charCodeAt(i).toString(16)).join(' ')}]  isWellFormed=${isWellFormed(str)}`,
  );
}
console.log('  ↑ 全部是 false。注意"切开代理对"是实际项目里最常见的成因 ——');
console.log('    slice / split("") / reverse / 按字节截断，任何一个都可能制造出畸形字符串。');

// 合法的对照组
console.log('\n合法对照组：');
for (const [desc, str] of [["'A'", 'A'], ["'😀'（完整代理对）", emoji], ["'中文abc'", '中文abc'], ["''（空串）", '']]) {
  console.log(`  ${desc.padEnd(22)} isWellFormed=${isWellFormed(str)}`);
}

// ---------------------------------------------------------------------------
// 3. 畸形字符串会造成什么实际问题
// ---------------------------------------------------------------------------

console.log('\n--- 3. 畸形字符串的实际危害 ---');

// 危害一：encodeURIComponent 直接抛 URIError，请求发不出去
console.log('\n【危害 1】encodeURIComponent 抛 URIError');
try {
  const encoded = encodeURIComponent(mixed);
  console.log('  竟然成功了：', encoded);
} catch (err) {
  // 期望走到这里：URIError: URI malformed
  console.log('  抛出：', err.constructor.name, '-', err.message);
}
// 对照：修好之后就能正常编码
console.log('  修复后再编码：', encodeURIComponent(toWellFormed(mixed)));
// 对照：合法 emoji 本来就能正常编码
console.log('  合法 emoji 编码：', encodeURIComponent(emoji));
console.log('  → 后端接口参数里带脏字符串时，前端会在这里失败，且报错信息毫无指向性。');

// 危害二：JSON.stringify 产出 "\ud800" 这类脏转义，下游语言容易炸
console.log('\n【危害 2】JSON.stringify 产出 \\udXXX 脏数据');
const payload = { name: '张三', avatar: mixed, id: 1 };
const json = JSON.stringify(payload);
console.log('  JSON 字符串：', json);
console.log('  ↑ 里面出现了 "a\\ud800b"，这是"符合 JSON 语法但内容非法"的典型脏数据。');
console.log('  下游用 Java/Python/Go 解析时，可能报 UnicodeDecodeError 或直接吞掉。');
// 修复后
console.log('  修复后：', JSON.stringify({ ...payload, avatar: toWellFormed(mixed) }));

// 危害三：不同 API 的行为不一致，导致"有的地方报错有的地方静默损坏"
console.log('\n【危害 3】各 API 对孤立代理项的处理不一致');
// TextEncoder 走 USVString 转换：静默替换成 U+FFFD，不抛错
const encodedBytes = new TextEncoder().encode(loneHigh);
console.log('  TextEncoder 编码 \\uD800 →', Array.from(encodedBytes), '（即 EF BF BD，U+FFFD 的 UTF-8）');
console.log('  → 它不报错，但数据已经"悄悄变了"，这类静默损坏比抛错更难排查。');
// btoa 会抛错
try {
  btoa(loneHigh);
  console.log('  btoa(\\uD800) 成功了');
} catch (err) {
  console.log('  btoa(\\uD800) 抛出：', err.constructor.name, '-', err.message);
}
console.log('  → 同一个字符串，encodeURIComponent/btoa 抛错、TextEncoder 静默替换，');
console.log('    行为完全取决于 API，所以最稳妥的策略是"在入口就把它修好"。');

// 危害四：写入文件 / 发到数据库时的乱码
console.log('\n【危害 4】写文件 / 存数据库时的乱码');
const cleanBytes = new TextEncoder().encode(emoji);
const dirtyBytes = new TextEncoder().encode(loneHigh);
console.log('  合法 😀 的 UTF-8 字节：', Array.from(cleanBytes), '（4 字节，F0 9F 98 80）');
console.log('  畸形 \\uD800 的 UTF-8 字节：', Array.from(dirtyBytes), '（3 字节，已被替换成 U+FFFD）');
console.log('  → 原始 emoji 被切成两半后落库，读回来就是 "�"，而且原始信息已不可恢复。');
console.log('    MySQL 的 utf8mb4 列写入这类数据还可能直接报 Incorrect string value。');

// ---------------------------------------------------------------------------
// 4. isWellFormed() 检测与 toWellFormed() 修复
// ---------------------------------------------------------------------------

console.log('\n--- 4. 内置方案：isWellFormed / toWellFormed ---');

// 检测：只是一个布尔判断，不会抛错，可以直接放在校验函数里
console.log('检测结果：');
for (const [desc, str] of malformedSamples.slice(0, 4)) {
  console.log(`  isWellFormed(${desc}) = ${isWellFormed(str)}`);
}

// 修复：把每个孤立代理码元替换成 U+FFFD（替换字符，显示为 �）
console.log('\ntoWellFormed 修复效果：');
for (const [desc, str] of malformedSamples) {
  const fixed = toWellFormed(str);
  console.log(
    `  ${desc.padEnd(42)} length ${str.length} → ${fixed.length}  码位=[${Array.from(fixed).map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase()).join(' ')}]`,
  );
}
console.log('  ↑ 每个非法码元各换成一个 U+FFFD，所以 "\\uD800\\uD800" 得到两个 U+FFFD。');
console.log('  ↑ 合法的代理对原样保留：toWellFormed("😀") === "😀" →', toWellFormed(emoji) === emoji);

// 幂等性：修好的字符串再修一次不变
const onceFixed = toWellFormed(mixed);
console.log('\n幂等性：toWellFormed 两次的结果相同 →', toWellFormed(onceFixed) === onceFixed);
console.log('  且修复后一定是良构的 →', isWellFormed(onceFixed));

// 实战：一个"入口清洗"函数
/**
 * 清洗来自外部的不可信文本：先修复孤立代理项，再返回可用字符串。
 * 放在 HTTP 请求解析、CSV 导入、用户输入处理的第一道关口。
 */
function sanitizeInput(text) {
  // 非字符串直接转成字符串，避免后续调用报错
  const str = typeof text === 'string' ? text : String(text);
  // 良构就原样返回（避免不必要的复制），否则修复
  return isWellFormed(str) ? str : toWellFormed(str);
}
console.log('\n实战：入口清洗函数');
for (const raw of ['正常文本', mixed, loneHigh, '😀 合法 emoji']) {
  const clean = sanitizeInput(raw);
  console.log(`  清洗前 length=${String(raw.length).padEnd(3)} wellFormed=${String(isWellFormed(raw)).padEnd(5)} → 清洗后 "${clean}"`);
}
console.log('  → 清洗过的字符串可以安全地 encodeURIComponent / JSON.stringify / 落库。');

// ---------------------------------------------------------------------------
// 5. 没有内置方法时：手写检测
// ---------------------------------------------------------------------------

console.log('\n--- 5. 手写方案一：自己检测 ---');

/**
 * 手写版 isWellFormed。
 * 思路：从左到右扫一遍码元，
 *   · 遇到"高位代理"→ 必须紧跟一个"低位代理"，否则非法；配对成功就跳过后一个码元。
 *   · 遇到"低位代理"→ 它前面没有高位代理来配（否则上一轮已经跳过了），非法。
 *   · 其它码元 → 都是 BMP 内的合法字符，直接跳过。
 */
function isWellFormedManual(str) {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (isHighSurrogate(code)) {
      // 看一眼后面那个码元是不是低位代理
      const next = str.charCodeAt(i + 1);
      // 注意：i 越界时 charCodeAt 返回 NaN，NaN 参与比较一律为 false，
      // 所以"高位代理在结尾"这种情况会被正确地判为非法
      if (!isLowSurrogate(next)) return false;
      // 配对成功，跳过已被消费的低位代理
      i++;
    } else if (isLowSurrogate(code)) {
      // 走到这里说明它前面不是高位代理（是的话上一轮就跳过了）
      return false;
    }
    // 其它情况：普通 BMP 字符，继续
  }
  return true;
}

console.log('手写实现的处理细节：');
console.log("  '\\uD83D' 单独一个（高位在结尾）：", isWellFormedManual('\uD83D'), '← charCodeAt(1) 返回 NaN，判定非法');
console.log('  isLowSurrogate(NaN) =', isLowSurrogate(NaN), '← NaN 与任何数比较都是 false');
console.log("  '😀'（完整代理对）：", isWellFormedManual(emoji));
console.log("  'a\\uD800b'：", isWellFormedManual(mixed));

// 与内置逐例对照
console.log('\n手写 vs 内置 逐例对照：');
let detectionMatch = true;
const allCases = [...malformedSamples.map(([, s]) => s), emoji, 'A', '中文abc', '', '\uD83D', '😀\uD83D'];
for (const str of allCases) {
  const manual = isWellFormedManual(str);
  // 内置方法只有在本环境支持时才做对照
  const builtin = hasIsWellFormed ? str.isWellFormed() : manual;
  const same = manual === builtin;
  if (!same) detectionMatch = false;
  const label = Array.from({ length: str.length }, (_, i) => str.charCodeAt(i).toString(16)).join(' ') || '(空)';
  console.log(`  [${label.padEnd(20)}] 手写=${String(manual).padEnd(5)} 内置=${String(builtin).padEnd(5)} ${same ? '一致' : '不一致 ←'}`);
}
console.log('\n全部一致：', detectionMatch);

// ---------------------------------------------------------------------------
// 6. 没有内置方法时：手写修复
// ---------------------------------------------------------------------------

console.log('\n--- 6. 手写方案二：自己修复 ---');

/**
 * 手写版 toWellFormed。
 * 与检测版逻辑完全相同，只是把"非法"的位置换成一个 U+FFFD 再拼进结果里。
 * 用数组收集片段再 join，避免在长字符串上反复 += 造成额外开销。
 */
function toWellFormedManual(str) {
  // U+FFFD 替换字符，Unicode 官方指定的"此处数据不可用"占位符
  const REPLACEMENT = '�';
  const parts = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (isHighSurrogate(code)) {
      const next = str.charCodeAt(i + 1);
      if (isLowSurrogate(next)) {
        // 合法代理对：两个码元一起搬过去，并跳过后一个
        parts.push(str[i], str[i + 1]);
        i++;
      } else {
        // 孤立高位代理：换成一个 U+FFFD
        parts.push(REPLACEMENT);
      }
    } else if (isLowSurrogate(code)) {
      // 孤立低位代理：换成一个 U+FFFD
      parts.push(REPLACEMENT);
    } else {
      // 普通字符：原样保留
      parts.push(str[i]);
    }
  }
  return parts.join('');
}

console.log('手写修复效果：');
for (const [desc, str] of malformedSamples) {
  const fixed = toWellFormedManual(str);
  console.log(`  ${desc.padEnd(42)} → "${fixed}"  码位=[${Array.from(fixed).map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase()).join(' ')}]`);
}

// 与内置逐例对照
console.log('\n手写 vs 内置 逐例对照：');
let repairMatch = true;
for (const str of allCases) {
  const manual = toWellFormedManual(str);
  const builtin = hasToWellFormed ? str.toWellFormed() : manual;
  const same = manual === builtin;
  if (!same) repairMatch = false;
  const label = Array.from({ length: str.length }, (_, i) => str.charCodeAt(i).toString(16)).join(' ') || '(空)';
  console.log(`  [${label.padEnd(20)}] 手写="${manual}" 内置="${builtin}" ${same ? '一致' : '不一致 ←'}`);
}
console.log('\n全部一致：', repairMatch);
console.log('→ 结论：内置方法与手写实现的语义完全一致，');
console.log('  新项目直接用内置方法；维护老代码时可以照抄上面这段作为 polyfill 思路。');

// ---------------------------------------------------------------------------
// 7. 一个必须记住的反面教材：不要按码元切分字符串
// ---------------------------------------------------------------------------

console.log('\n--- 7. 反面教材：按码元切分制造畸形串 ---');

const text = '你好😀世界';
console.log('原文：', text, '| length =', text.length, '| 按码位长度 =', Array.from(text).length);
// 索引分布：'你'=0、'好'=1、'😀'=2 和 3、'世'=4、'界'=5
console.log('  索引分布：你=0 好=1 😀=2,3 世=4 界=5');

// 错误做法：按码元截断
// slice(0, 3) 只取走 😀 的第一个码元（索引 2），第二个码元（索引 3）被丢在外面，
// 于是"半个 emoji"留了下来 —— 这是一个孤立高位代理
const wrongCut = text.slice(0, 3);
console.log('\n错误：text.slice(0, 3) →', JSON.stringify(wrongCut));
console.log('  码元 =', Array.from({ length: wrongCut.length }, (_, i) => wrongCut.charCodeAt(i).toString(16)).join(' '));
console.log('  isWellFormed =', isWellFormed(wrongCut), '← 代理对被从中间切开了！');

// 正确做法：先转成码位数组再截断
const rightCut = Array.from(text).slice(0, 3).join('');
console.log('正确：Array.from(text).slice(0, 3).join("") →', JSON.stringify(rightCut));
console.log('  isWellFormed =', isWellFormed(rightCut));

// 兜底：万一已经拿到了脏字符串，用 toWellFormed 抢救
console.log('\n兜底修复：toWellFormed 后 =', JSON.stringify(toWellFormed(wrongCut)));

// 其它按码元操作的危险 API 一览
console.log('\n容易切坏代理对的 API（都按"码元"工作）：');
console.log('  slice / substring / substr、split("")、reverse()、' +
  'String.fromCharCode、charAt / charCodeAt、str.length、str[i]');
console.log('安全的替代（都按"码位"工作）：');
console.log('  Array.from(str)、[...str]、for...of、codePointAt、String.fromCodePoint、str.at(i)');

// 演示安全替代
console.log('\n安全替代演示：');
console.log("  [...'😀'].length =", [...emoji].length, '（对比 \'😀\'.length =', emoji.length, '）');
console.log("  '😀'.at(0) 只取到半个：", JSON.stringify(emoji.at(0)), '← at() 仍按码元索引，只是支持负数下标');
console.log("  [...'😀'][0] 取到完整码位：", JSON.stringify([...emoji][0]), '| 码位 U+' + [...emoji][0].codePointAt(0).toString(16).toUpperCase());
console.log('  String.fromCodePoint(0x1F600) =', JSON.stringify(String.fromCodePoint(0x1f600)));
console.log('  ↑ 注意 String.fromCharCode 只能处理码元（16 位），它会把参数截断到低 16 位：');
console.log('    String.fromCharCode(0x1F600) 的参数被截成 U+' +
  String.fromCharCode(0x1f600).charCodeAt(0).toString(16).toUpperCase() + '（0x1F600 & 0xFFFF），得到的是一个完全不相干的字符。');
// 用 fromCharCode 手工拼代理对时必须自己算清楚，少拼一半就会造出畸形字符串
console.log('    手工拼代理对也不能少一半：String.fromCharCode(0xD83D).isWellFormed() =',
  isWellFormed(String.fromCharCode(0xd83d)), '← 又是一个孤立代理项');

// ---------------------------------------------------------------------------
// 8. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 8. 小结 ---');

console.log('1) 畸形字符串 = 含有孤立代理项的字符串，isWellFormed() 返回 false。');
console.log('2) 最常见的成因：按"码元"做 slice / split("") / reverse / 字节截断，把代理对切开。');
console.log('3) 危害：encodeURIComponent 抛 URIError、btoa 抛错、JSON 产出 \\udXXX 脏数据、');
console.log('   TextEncoder 静默替换成 U+FFFD、落库乱码 —— 各 API 行为还不一致。');
console.log('4) 修复：toWellFormed() 把每个孤立代理码元换成 U+FFFD，幂等且可安全反复调用。');
console.log('5) 旧环境：用本文件第 5、6 节的 charCodeAt 手写方案，语义与内置完全一致。');
console.log('6) 预防优先于修复：按码位（Array.from / for...of / codePointAt）处理文本，');
console.log('   并在系统入口处统一做一次 sanitize。');
console.log('7) 相关但不同的主题：按"字素簇"切分（Intl.Segmenter）见 33_intl/05_intl_segmenter.js；');
console.log('   只关注 JSON 场景的见 21_json/11_lone_surrogates.js。');

console.log('\n全部演示完毕。');
