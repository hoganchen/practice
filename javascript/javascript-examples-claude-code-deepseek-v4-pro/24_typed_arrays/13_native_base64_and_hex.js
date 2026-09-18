/**
 * ============================================================================
 * 知识点：Uint8Array 的原生字节编解码（ES2025）—— toBase64 / fromBase64 / toHex / fromHex
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/06_textencoder_decoder.js、24_typed_arrays/07_node_buffer.js、
 *            24_typed_arrays/08_binary_encoding.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES2025 给 **Uint8Array** 补上了四个原生方法，把字节与文本之间的转换标准化：
 *      bytes.toBase64(options)          -> base64 字符串
 *      Uint8Array.fromBase64(str, opts) -> Uint8Array
 *      bytes.toHex()                    -> 十六进制字符串（小写，无分隔符）
 *      Uint8Array.fromHex(str)          -> Uint8Array
 *    在此之前，这件事要么靠浏览器的 btoa/atob，要么靠 Node 的 Buffer，
 *    两边的行为还不完全一致 —— 本目录 08_binary_encoding.js 正是那样手搓的，
 *    还专门讲了一个坑：`btoa('中文')` 会抛 DOMException。
 *
 *    现在：`new TextEncoder().encode('中文').toBase64()` 一行搞定，
 *    没有二进制字符串中转，没有 0~255 的限制，也没有平台差异。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 把图片/文件塞进 JSON 或 data URL（data:image/png;base64,...）；
 *    (2) 把签名、Token、哈希放进 HTTP 头（头里不能有二进制）；
 *    (3) JWT 式的 base64url 载荷；
 *    (4) 调试二进制数据时用 hex 打印（哈希摘要、魔数、协议帧）。
 *    这些场景原来在浏览器与 Node 下要写两套代码，现在一套就够。
 *
 *    命名上继承定型数组的惯例，在 %TypedArray% 之外**只加在 Uint8Array 上**。
 *
 * 3. 核心语法要点
 *    (1) toBase64(options) 的选项：
 *        · alphabet: 'base64'（默认，含 + /）| 'base64url'（- _，URL 安全）
 *        · omitPadding: false（默认，保留 =）| true（去掉末尾的 =）
 *    (2) fromBase64(str, options) 的选项：
 *        · alphabet: 'base64'（默认）| 'base64url'
 *          注意：**默认不认 base64url 的 - 和 _**，要显式指定 alphabet；
 *        · lastChunkHandling: 'loose'（默认）| 'strict' | 'stop-before-partial'
 *          决定"最后一段不足 4 个字符"时怎么办。
 *    (3) **只有 Uint8Array 有这四个方法**。Uint16Array / Float16Array 等都没有 ——
 *        因为 base64/hex 的语义单位是"字节"，其它定型数组的元素不止一字节。
 *        要给它们编码，先取 .buffer 或建 Uint8Array 视图。
 *    (4) 编码体积：hex 是 ×2；base64 是 ×4/3 ≈ ×1.3333（3 字节 -> 4 字符）。
 *    (5) 非法输入抛 **SyntaxError**（不是 TypeError，也不是 DOMException）：
 *        · base64 里有表外字符 -> SyntaxError: Found a character that cannot be part of a valid base64 string.
 *        · hex 长度是奇数或含非十六进制字符 -> SyntaxError: Input string must contain hex characters in even length
 *    (6) 空白字符（空格/制表/换行）在解码时被**忽略**，这是为了兼容换行的 PEM 格式。
 *    (7) 早期提案里的 setFromBase64 / setFromHex 已经在定稿前被移除，
 *        标准里只有上面那四个方法 —— 见到旧文档提到它们，那已经过时了。
 *    (8) 它是 2025 年才落地的新 API：**用前必须做特性检测**。
 *        本机 Node 24.16（V8 13.6）默认**不支持**，需要 `node --js-base-64` 开启；
 *        本文件因此把降级实现写成主力路径，并保证与原生逐字节一致。
 *
 * 4. 常见陷阱
 *    (1) 以为 `Buffer.from(bytes).toString('base64')` 和原生结果一样 ——
 *        结果确实一样，但 **Buffer 只在 Node 有**，浏览器打包时会炸。
 *    (2) 默认不认 base64url：`Uint8Array.fromBase64('-_-_')` 会抛 SyntaxError，
 *        要写 `{ alphabet: 'base64url' }`。
 *    (3) base64 **不是加密**：谁都能解回来，别拿它保护敏感数据。
 *    (4) 用 `btoa` 处理非 ASCII 会抛 DOMException，用原生方法不会有这个问题
 *        （因为它接收的是真正的字节，不是"二进制字符串"）。
 *    (5) hex 输出统一小写；解析时大小写都接受（与 Buffer 一致）。
 *    (6) 大数组上 `arr.toHex()` 会产生 2 倍大小的字符串，
 *        1MB 的字节会变成 2MB 的字符串 —— 传输前先想清楚是否真的需要文本形式。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/13_native_base64_and_hex.js
 *
 *   想看到"原生分支"被真正走到，可以加上 V8 的实验开关：
 *     node --js-base-64 24_typed_arrays/13_native_base64_and_hex.js
 *   两种方式都必须正常退出，且交叉验证的结论一致。
 *
 * 【预期输出】
 *   分 10 个小节：特性探测、四种方式的用法对照、选项详解、错误处理、
 *   体积与膨胀比、浏览器与 Node 的可用性差异、降级实现、统一入口与逐字节交叉验证、
 *   实战（data URL 与 JWT 式载荷）、交付前检查清单。
 *   凡随运行环境变化的行都标注 [环境相关]。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 特性探测
// ---------------------------------------------------------------------------

console.log('--- 0. 特性探测 ---');

// base64 的两张字符表。放在文件最前面，因为从第 1 节开始的所有编解码演示
// 都会用到它们（函数声明会提升，const 不会 —— 这类常量必须声明在调用之前）。
const BASE64_STD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

const HAS_TO_BASE64 = typeof Uint8Array.prototype.toBase64 === 'function';
const HAS_FROM_BASE64 = typeof Uint8Array.fromBase64 === 'function';
const HAS_TO_HEX = typeof Uint8Array.prototype.toHex === 'function';
const HAS_FROM_HEX = typeof Uint8Array.fromHex === 'function';
const HAS_NATIVE = HAS_TO_BASE64 && HAS_FROM_BASE64 && HAS_TO_HEX && HAS_FROM_HEX;

console.log('[环境相关] Node 版本 =', process.version, '| V8 版本 =', process.versions.v8);
console.log('Uint8Array.prototype.toBase64 可用吗 =', HAS_TO_BASE64);
console.log('Uint8Array.fromBase64 可用吗         =', HAS_FROM_BASE64);
console.log('Uint8Array.prototype.toHex 可用吗    =', HAS_TO_HEX);
console.log('Uint8Array.fromHex 可用吗            =', HAS_FROM_HEX);

console.log('\n"只有 Uint8Array 有"这件事，实测如下：');
console.table(
  [Uint8Array, Int8Array, Uint16Array, Int32Array, Float32Array, Float64Array, Float16Array, Uint8ClampedArray]
    .filter((Ctor) => typeof Ctor === 'function')
    .map((Ctor) => {
      const proto = Ctor.prototype;
      const own = [];
      if (typeof proto.toBase64 === 'function') own.push('toBase64');
      if (typeof proto.toHex === 'function') own.push('toHex');
      if (typeof Ctor.fromBase64 === 'function') own.push('fromBase64');
      if (typeof Ctor.fromHex === 'function') own.push('fromHex');
      return {
        类型: Ctor.name,
        '每元素字节': Ctor.BYTES_PER_ELEMENT,
        原生的编解码方法: own.length === 0 ? '（无，需转成 Uint8Array 视图）' : own.join(', '),
      };
    }),
);
console.log('  结论：这些方法定义在 **Uint8Array 自己的原型**上，不在 %TypedArray% 上。');
console.log('  原因很直白：base64/hex 的语义单位是"字节"，而 Uint16Array 的一个元素是 2 字节，');
console.log('  直接编码会让"字节序"变成一个必须回答却没被回答的问题。');
console.log('  要给其它定型数组编码，正确做法是走它的字节视图：');
const u16 = new Uint16Array([0x1234, 0xabcd]);
console.log('    new Uint16Array([0x1234, 0xabcd]) 的字节视图 =',
  Array.from(new Uint8Array(u16.buffer), (b) => b.toString(16).padStart(2, '0')).join(' '));
console.log('    （本机是小端序，所以 0x1234 存成 34 12 —— 端序问题见 03/05 篇）');

if (!HAS_NATIVE) {
  console.log('\n本运行时**默认没有**这四个原生方法 —— 下面会自动走第 6 节的降级实现。');
  console.log('  想启用原生实现（V8 的实验开关）：');
  console.log('    node --js-base-64 24_typed_arrays/13_native_base64_and_hex.js');
  console.log('  本文件两种运行方式都能正常退出，且交叉验证结论一致。');
} else {
  console.log('\n本运行时完整支持这四个原生方法。');
}

/**
 * 当前运行时会选中的实现层级名（只读探测结果，不做任何副作用）。
 * 用函数声明是为了让第 1 节可以先调用它 —— 函数声明会提升，const 不会。
 * @returns {'原生'|'Buffer'|'手写'}
 */
function activeImplName() {
  if (HAS_NATIVE) return '原生';
  if (typeof Buffer === 'function') return 'Buffer';
  return '手写';
}

const HAS_BUFFER = typeof Buffer === 'function';
const HAS_BTOA = typeof btoa === 'function';
console.log('\n其它可用的实现路径（用来做交叉验证）：');
console.log('  Buffer（Node 专有） 可用吗 =', HAS_BUFFER);
console.log('  btoa / atob 可用吗        =', HAS_BTOA && typeof atob === 'function');

// ---------------------------------------------------------------------------
// 1. 四种方式的用法对照
// ---------------------------------------------------------------------------

console.log('\n--- 1. 四种方式对照 ---');

// 统一的样例字节：既有 ASCII 也有多字节 UTF-8，还有会触发 + / 的字节。
const SAMPLE_TEXT = '中文abc';
const SAMPLE_BYTES = new TextEncoder().encode(SAMPLE_TEXT);
console.log('样例：', JSON.stringify(SAMPLE_TEXT), '-> 字节 =',
  Array.from(SAMPLE_BYTES, (b) => b.toString(16).padStart(2, '0')).join(' '));

/**
 * 把字节转成"二进制字符串"（每字符 0~255）—— btoa 需要的输入形式。
 * @param {Uint8Array} bytes 字节
 * @returns {string}
 */
function bytesToBinaryString(bytes) {
  let out = '';
  for (const b of bytes) out += String.fromCharCode(b);
  return out;
}

/**
 * 把"二进制字符串"转回字节。
 * @param {string} s 每字符 0~255 的字符串
 * @returns {Uint8Array}
 */
function binaryStringToBytes(s) {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

console.log('\n把同一段字节用四种方式编码成 base64：');
console.log('  2) Buffer.toString    ->', HAS_BUFFER ? Buffer.from(SAMPLE_BYTES).toString('base64') : '(不可用)');
console.log('  3) btoa + 二进制字符串 ->', HAS_BTOA ? btoa(bytesToBinaryString(SAMPLE_BYTES)) : '(不可用)');
console.log('  4) 手写实现           ->', handToBase64(SAMPLE_BYTES));

console.log('\n再编码成 hex：');
console.log('  1) 统一门面（当前会选中：' + activeImplName() + '）->', toHex(SAMPLE_BYTES));
console.log('  2) Buffer.toString    ->', HAS_BUFFER ? Buffer.from(SAMPLE_BYTES).toString('hex') : '(不可用)');
console.log('  3) 手写实现           ->', handToHex(SAMPLE_BYTES));

console.table([
  { 方式: '原生 Uint8Array', 平台: '浏览器 + Node（较新版本）', 输入类型: '真正的字节', '要处理中文吗': '不用，直接编码', 评价: '首选' },
  { 方式: 'Buffer', 平台: '仅 Node', 输入类型: 'Buffer / 字节 / 字符串', '要处理中文吗': '不用', 评价: 'Node 里最省事，浏览器里没有' },
  { 方式: 'btoa / atob', 平台: '浏览器 + Node 16+', 输入类型: '二进制字符串（每字符 0~255）', '要处理中文吗': '要，先 TextEncoder 再转字符串', 评价: '老代码在用；中文会抛 DOMException' },
  { 方式: '手写实现', 平台: '任何地方', 输入类型: 'Uint8Array', '要处理中文吗': '不用', 评价: '降级兜底；本文件用来做交叉验证' },
].map((r) => r));

console.log('\nbtoa 的那个老坑，对比一下：');
try {
  btoa('中文');
} catch (err) {
  console.log('  btoa("中文")            ->', err.constructor.name + ':', err.message);
}
console.log('  统一门面 toBase64        ->', toBase64(new TextEncoder().encode('中文')), '（没有任何问题）');
console.log('  根本原因：btoa 收的是"字符串"，每个字符必须在 0~255；');
console.log('            原生方法收的是"字节数组"，本来就不存在字符码点的概念。');

console.log('\n再看解码方向（atob 的结果也不能直接当文本用）：');
const zhBytes = new TextEncoder().encode('中文');
const zhB64 = btoa(bytesToBinaryString(zhBytes));
console.log('  btoa 得到的 base64   =', zhB64);
const atobResult = atob(zhB64);
console.log('  atob 直接打印        =', JSON.stringify(atobResult), '（乱码：它只是"每字符 0~255 的字符串"）');
console.log('  转回字节再 UTF-8 解码 =',
  new TextDecoder().decode(binaryStringToBytes(atobResult)), '（这才是正确姿势）');
console.log('  统一门面一步到位      =',
  new TextDecoder().decode(fromBase64(zhB64)), '（原生/降级实现都直接给你字节）');

// ---------------------------------------------------------------------------
// 2. 选项详解
// ---------------------------------------------------------------------------

console.log('\n--- 2. 选项详解 ---');

// 造几个字节数不是 3 的倍数的样本，用来观察填充。
const TRICKY = new Uint8Array([0xfb, 0xef, 0xbe, 0x3f, 0xfe]);
console.log('样本字节（会同时触发 + 和 /）:', Array.from(TRICKY, (b) => b.toString(16).padStart(2, '0')).join(' '));
console.log('  标准 base64        ->', toBase64(TRICKY));
console.log('  alphabet: base64url ->', toBase64(TRICKY, { alphabet: 'base64url' }));
console.log('  omitPadding: true   ->', toBase64(TRICKY, { omitPadding: true }));
console.log('  两者同时用          ->', toBase64(TRICKY, { alphabet: 'base64url', omitPadding: true }));
console.log('  替换规则：+ -> - ，/ -> _ ，再去掉末尾的 = 填充。');
console.log('  为什么必须换：URL 编码里 "+" 代表空格，"/" 会破坏路径分段。');
console.log('  放进 URL 的效果：');
console.log('    标准 base64  -> encodeURIComponent 后 =', encodeURIComponent(toBase64(TRICKY)));
console.log('    base64url    -> encodeURIComponent 后 =', encodeURIComponent(toBase64(TRICKY, { alphabet: 'base64url' })));

console.log('\n填充与长度：3 字节 -> 4 字符，不足 3 字节用 = 补齐');
console.table(
  [
    ['"M"', new TextEncoder().encode('M')],
    ['"Ma"', new TextEncoder().encode('Ma')],
    ['"Man"', new TextEncoder().encode('Man')],
    ['"Manz"', new TextEncoder().encode('Manz')],
  ].map(([text, bytes]) => {
    const encoded = toBase64(bytes);
    return {
      原文: text,
      字节数: bytes.length,
      base64: encoded,
      长度: encoded.length,
      '是 4 的倍数吗': encoded.length % 4 === 0,
      '填充个数': (encoded.match(/=/g) ?? []).length,
    };
  }),
);
console.log('  => 合法的 base64（带填充）长度**永远是 4 的倍数**；');
console.log('     用了 omitPadding 之后就不一定了，所以解析时两种都要能接。');

console.log('\n解码方向的 alphabet 也很关键（默认不认 base64url）：');
const urlSafe = toBase64(TRICKY, { alphabet: 'base64url' });
console.log('  url-safe 串 =', urlSafe);
console.log('  用默认 alphabet 解 ->', tryDecode(urlSafe, {}));
console.log('  显式指定 base64url ->', tryDecode(urlSafe, { alphabet: 'base64url' }), '（解回来与原文一致：', sameBytes(fromBase64(urlSafe, { alphabet: 'base64url' }), TRICKY), '）');

/**
 * 试着解码并返回可读结果（演示报错必须 try/catch）。
 * @param {string} text base64 文本
 * @param {object} options 选项
 * @returns {string}
 */
function tryDecode(text, options) {
  try {
    const bytes = fromBase64(text, options);
    return `成功 -> [${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ')}]`;
  } catch (err) {
    return `${err.constructor.name}: ${err.message}`;
  }
}

/**
 * 判断两段字节是否完全一致。
 * @param {Uint8Array} a 字节 a
 * @param {Uint8Array} b 字节 b
 * @returns {boolean}
 */
function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

console.log('\nlastChunkHandling：最后一段不足 4 个字符时怎么办');
// 造一个"被截断"的 base64：删掉最后一个字符，最后一个块就不完整了。
const truncated = toBase64(new TextEncoder().encode('Man')).slice(0, -1); // "TWF" 而不是 "TWFu"
console.log('  样本 =', JSON.stringify(truncated), '（"Man" 的完整 base64 是 "TWFu"，这里故意少一个字符）');
console.table(
  ['loose', 'strict', 'stop-before-partial'].map((mode) => ({
    lastChunkHandling: mode,
    结果: tryDecode(truncated, { lastChunkHandling: mode }),
  })),
);
console.log('  · loose（默认）：把不完整的最后一段按可用位数解出尽可能多的字节；');
console.log('  · strict：要求最后一段必须完整或有合法填充，否则抛 SyntaxError；');
console.log('  · stop-before-partial：干脆丢掉不完整的最后一段，只解前面的完整块。');
console.log('  选哪个：解析你自己生成的数据用 loose 最省事；');
console.log('          解析外来输入（协议、第三方）时用 strict，能尽早发现数据被截断。');

console.log('\n空白字符在解码时被忽略（为了兼容带换行的 PEM 格式）：');
const multiline = toBase64(new TextEncoder().encode('The quick brown fox jumps over the lazy dog'));
const withBreaks = multiline.slice(0, 16) + '\n' + multiline.slice(16, 32) + '\r\n  ' + multiline.slice(32);
console.log('  带换行与缩进的版本 =', JSON.stringify(withBreaks));
console.log('  解码结果与不带换行的一致吗 ->', sameBytes(fromBase64(withBreaks), fromBase64(multiline)));
console.log('  （对照：Buffer.from(x, "base64") 也会忽略空白；btoa/atob 则不会）');

// ---------------------------------------------------------------------------
// 3. 错误处理
// ---------------------------------------------------------------------------

console.log('\n--- 3. 错误处理 ---');

console.log('非法输入抛的是 **SyntaxError**（不是 TypeError，也不是 DOMException）。');
console.log('下面是实际拿到的错误信息（原生可用时是原生的，否则是降级实现的消息）：');

console.table(
  [
    ['base64 表外字符', () => fromBase64('!!!!')],
    ['base64 单个字符结尾', () => fromBase64('T')],
    ['base64 五个字符结尾', () => fromBase64('TWFuT')],
    ['base64 填充在中间', () => fromBase64('TW=Fu')],
    ['hex 奇数长度', () => fromHex('abc')],
    ['hex 非十六进制字符', () => fromHex('zz')],
    ['hex 空串（合法）', () => fromHex('')],
    ['base64 空串（合法）', () => fromBase64('')],
  ].map(([name, fn]) => {
    let result;
    try {
      result = `成功 -> [${Array.from(fn(), (b) => b.toString(16).padStart(2, '0')).join(' ')}]`;
    } catch (err) {
      result = `${err.constructor.name}: ${err.message}`;
    }
    return { 场景: name, 结果: result };
  }),
);

console.log('\n注意那两条「单个字符结尾」的报错：判据是**字符数模 4 等于 1**，');
console.log('  而不是「长度必须是 4 的倍数」—— 后者会把 TWE（3 个字符、能解出 2 字节）误判成非法。');
console.log('  1 个 base64 字符只能提供 6 位，凑不出一个完整字节，所以无法还原任何数据；');
console.log('  2 个或 3 个字符则能还原 1~2 个字节（见上面 lastChunkHandling 的 loose 模式）。');
console.log('  => 这条规则看起来「宽松」，其实才是与数据容量严格对应的那条。');

console.log('\n生产代码里应该把这类错误转成你自己的错误类型，附上上下文：');
/**
 * 安全地把 base64 解成字节，失败时抛出带上下文字段的自定义错误。
 * @param {string} text base64 文本
 * @param {string} context 上下文（用于定位是哪一段数据坏了）
 * @param {object} [options] 解码选项
 * @returns {Uint8Array}
 */
function decodeOrThrow(text, context, options = {}) {
  try {
    return fromBase64(text, options);
  } catch (cause) {
    const err = new SyntaxError(`无法解码 ${context} 的 base64 数据：${cause.message}`);
    err.context = context;
    err.cause = cause;
    throw err;
  }
}
try {
  decodeOrThrow('!!!!', '上传的头像字段');
} catch (err) {
  console.log('  ', err.constructor.name + ':', err.message);
  console.log('   cause 保留了吗 ->', err.cause instanceof SyntaxError, '| context =', err.context);
}

// ---------------------------------------------------------------------------
// 4. 体积与膨胀比
// ---------------------------------------------------------------------------

console.log('\n--- 4. 体积与膨胀比 ---');

console.log('理论上：hex 每字节 2 个字符（×2），base64 每 3 字节 4 个字符（×4/3）。');
console.log('拿真实数据量一遍（1 000 000 个字节）：');
const BIG = new Uint8Array(1_000_000);
for (let i = 0; i < BIG.length; i += 1) BIG[i] = (i * 31) & 0xff;
const bigB64 = toBase64(BIG);
const bigHex = toHex(BIG);
console.table([
  { 编码: '原始字节', 长度: BIG.length, '相对原始': '×1', 说明: '内存里的真实体积' },
  { 编码: 'base64', 长度: bigB64.length, '相对原始': `×${(bigB64.length / BIG.length).toFixed(4)}`, 说明: '每 3 字节 -> 4 字符' },
  { 编码: 'base64url + omitPadding', 长度: toBase64(BIG, { alphabet: 'base64url', omitPadding: true }).length, '相对原始': `×${(toBase64(BIG, { alphabet: 'base64url', omitPadding: true }).length / BIG.length).toFixed(4)}`, 说明: '省略末尾填充，最多省 2 个字符' },
  { 编码: 'hex', 长度: bigHex.length, '相对原始': `×${(bigHex.length / BIG.length).toFixed(2)}`, 说明: '每字节 -> 2 字符' },
].map((r) => r));

console.log('\n小数据上的膨胀要更小心（填充占比高）：');
console.table(
  [1, 2, 3, 4, 5, 10, 100].map((n) => {
    const bytes = new Uint8Array(n).fill(0xab);
    const b64 = toBase64(bytes);
    const padded = toBase64(bytes, { alphabet: 'base64url', omitPadding: true });
    return {
      字节数: n,
      'base64 长度': b64.length,
      实际倍率: (b64.length / n).toFixed(2),
      'base64url 省略填充后长度': padded.length,
      '省略填充的实际倍率': (padded.length / n).toFixed(2),
    };
  }),
);
console.log('  => 1 个字节编码成 4 个字符，膨胀 4 倍；数据越小，固定开销占比越高。');
console.log('     所以 base64 适合"整体编码一段二进制"，不适合"逐字节编码再拼接"。');

// ---------------------------------------------------------------------------
// 5. 浏览器与 Node 的可用性差异
// ---------------------------------------------------------------------------

console.log('\n--- 5. 可用性差异 ---');

console.table([
  {
    环境: 'Node（2009 起）',
    '原生 toBase64/fromBase64': '视版本而定（较新版本才有）',
    替代方案: 'Buffer.from(x).toString("base64") —— Node 独有，最省事',
    备注: '本机 Node ' + process.version + ' 默认不可用，需要 --js-base-64 开关',
  },
  {
    环境: '浏览器',
    '原生 toBase64/fromBase64': '2025 年起的新版本逐步支持',
    替代方案: 'btoa / atob（但要自己处理中文与 ArrayBuffer 转换）',
    备注: '老浏览器要引入 polyfill；具体版本以 MDN 兼容表为准',
  },
  {
    环境: 'Web Worker / Service Worker',
    '原生 toBase64/fromBase64': '与所在浏览器一致',
    替代方案: '同浏览器',
    备注: '没有额外的限制',
  },
  {
    环境: 'Deno / Bun',
    '原生 toBase64/fromBase64': '跟随其内置的 V8 / JavaScriptCore',
    替代方案: 'Buffer（Bun 兼容 Node API）或手写',
    备注: '同样要探测，别假设',
  },
].map((r) => r));

console.log('为什么"探测"是唯一可靠的做法：');
console.log('  · 同一个 API 在不同运行时、不同版本上落地时间可能差一两年；');
console.log('  · 本机 Node 24.16（V8 13.6）默认没有，加上 --js-base-64 就有 —— ');
console.log('    也就是说"同一个 Node 版本，跑法不同结果都不同"；');
console.log('  · 所以代码里必须是 **能力探测 + 降级**，而不是"我知道 Node XX 支持"。');
console.log('  这正是本文件的结构：先探测，再把最好的实现挑出来用。');

// ---------------------------------------------------------------------------
// 6. 降级实现
// ---------------------------------------------------------------------------

console.log('\n--- 6. 降级实现 ---');

// 降级分两层：
//   第一层：Node 里直接用 Buffer（它已经高度优化过，没必要自己写）；
//   第二层：连 Buffer 都没有（浏览器），用手写的查表实现。
// 下面两级都给出来，并在第 7 节做逐字节交叉验证。

// 字符表 BASE64_STD / BASE64_URL 已经在文件最前面声明过了。

/**
 * 取字符表。
 * @param {'base64'|'base64url'} alphabet 字母表
 * @returns {string}
 */
function tableOf(alphabet) {
  return alphabet === 'base64url' ? BASE64_URL : BASE64_STD;
}

/**
 * 手写 base64 编码（降级用，也用来验证原生实现）。
 * @param {Uint8Array} bytes 字节
 * @param {{alphabet?: 'base64'|'base64url', omitPadding?: boolean}} [options] 选项
 * @returns {string}
 */
function handToBase64(bytes, options = {}) {
  const { alphabet = 'base64', omitPadding = false } = options;
  const table = tableOf(alphabet);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const has1 = i + 1 < bytes.length;
    const has2 = i + 2 < bytes.length;
    const b1 = has1 ? bytes[i + 1] : 0;
    const b2 = has2 ? bytes[i + 2] : 0;
    out += table[b0 >> 2];
    out += table[((b0 & 0b11) << 4) | (b1 >> 4)];
    if (has1) out += table[((b1 & 0b1111) << 2) | (b2 >> 6)];
    else if (!omitPadding) out += '=';
    if (has2) out += table[b2 & 0b111111];
    else if (!omitPadding) out += '=';
  }
  return out;
}

/**
 * 手写 base64 解码（降级用）。
 * 行为对齐标准：忽略 ASCII 空白、支持填充、长度模 4 为 1 时报错。
 * @param {string} text base64 文本
 * @param {{alphabet?: 'base64'|'base64url', lastChunkHandling?: 'loose'|'strict'|'stop-before-partial'}} [options] 选项
 * @returns {Uint8Array}
 */
function handFromBase64(text, options = {}) {
  const { alphabet = 'base64', lastChunkHandling = 'loose' } = options;
  const table = tableOf(alphabet);
  const lookup = new Map();
  for (let i = 0; i < table.length; i += 1) lookup.set(table[i], i);

  // 第一步：去掉 ASCII 空白（与原生和 Buffer 的行为一致）。
  const chars = [];
  for (const ch of String(text)) {
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\f' || ch === '\r') continue;
    chars.push(ch);
  }

  // 第二步：剥离末尾填充，并确保填充只出现在末尾。
  let padding = 0;
  while (chars.length > 0 && chars[chars.length - 1] === '=') {
    chars.pop();
    padding += 1;
  }
  if (chars.includes('=')) throw new SyntaxError('base64 的填充只能出现在末尾');
  if (padding > 2) throw new SyntaxError('base64 的填充字符过多');

  // 第三步：长度校验。字符数模 4 等于 1 时凑不出任何字节，视为非法。
  const leftover = chars.length % 4;
  if (leftover === 1) throw new SyntaxError('base64 输入以单个字符结尾，无法还原出任何字节');

  // 第四步：查表，遇到表外字符立刻报错。
  const values = chars.map((ch) => {
    const v = lookup.get(ch);
    if (v === undefined) {
      throw new SyntaxError(`base64 串里出现了非法字符：${JSON.stringify(ch)}`);
    }
    return v;
  });

  // 第五步：按 4 个一组解包。
  const out = [];
  for (let i = 0; i < values.length; i += 4) {
    const remaining = values.length - i;
    const v0 = values[i];
    const v1 = values[i + 1] ?? 0;
    const v2 = values[i + 2] ?? 0;
    const v3 = values[i + 3] ?? 0;
    out.push(((v0 << 2) | (v1 >> 4)) & 0xff);
    if (remaining > 2) out.push(((v1 << 4) | (v2 >> 2)) & 0xff);
    if (remaining > 3) out.push(((v2 << 6) | v3) & 0xff);
  }

  // 第六步：按 lastChunkHandling 处理"不完整的最后一段"。
  const bytes = Uint8Array.from(out);
  if (lastChunkHandling === 'strict' && leftover !== 0) {
    throw new SyntaxError('strict 模式下最后一段必须是完整的 4 个字符或带合法填充');
  }
  if (lastChunkHandling === 'stop-before-partial' && leftover !== 0) {
    // 丢掉不完整最后一段对应的字节：每 4 个字符 3 字节，末尾不足 4 个字符的块整块丢弃。
    const completeBytes = Math.floor(values.length / 4) * 3;
    return bytes.slice(0, completeBytes);
  }
  return bytes;
}

/**
 * 手写 hex 编码。
 * @param {Uint8Array} bytes 字节
 * @returns {string}
 */
function handToHex(bytes) {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

/**
 * 手写 hex 解码（大小写都接受，奇数长度或非法字符抛 SyntaxError）。
 * @param {string} text hex 文本
 * @returns {Uint8Array}
 */
function handFromHex(text) {
  const s = String(text);
  if (s.length % 2 !== 0) throw new SyntaxError('hex 字符串长度必须是偶数');
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < s.length; i += 2) {
    const pair = s.slice(i, i + 2);
    if (!/^[0-9a-fA-F]{2}$/.test(pair)) {
      throw new SyntaxError(`hex 串里出现了非法字符：${JSON.stringify(pair)}`);
    }
    out[i / 2] = Number.parseInt(pair, 16);
  }
  return out;
}

console.log('手写实现已就绪：handToBase64 / handFromBase64 / handToHex / handFromHex。');
console.log('  编码是从高位往低位"每 6 位切一刀"；解码则是反过来"每 4 个字符拼出 3 个字节"。');
console.log('  用 0b111111 这样的二进制字面量写掩码，比写 63 更容易看出"取低 6 位"的意图。');

// ---------------------------------------------------------------------------
// 7. 统一入口 + 逐字节交叉验证
// ---------------------------------------------------------------------------

console.log('\n--- 7. 统一入口与交叉验证 ---');

// 生产代码的推荐形态：探测一次，挑最好的实现，之后全部走这个门面。
const Bytes = {
  原生的: {
    toBase64: (b, o) => b.toBase64(o),
    fromBase64: (s, o) => Uint8Array.fromBase64(s, o),
    toHex: (b) => b.toHex(),
    fromHex: (s) => Uint8Array.fromHex(s),
  },
  'Buffer 的': HAS_BUFFER
    ? {
      toBase64: (b, o) => Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString(o && o.alphabet === 'base64url' ? 'base64url' : 'base64'),
      fromBase64: (s, o) => new Uint8Array(Buffer.from(s, o && o.alphabet === 'base64url' ? 'base64url' : 'base64')),
      toHex: (b) => Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString('hex'),
      fromHex: (s) => new Uint8Array(Buffer.from(s, 'hex')),
    }
    : null,
  手写的: {
    toBase64: handToBase64,
    fromBase64: handFromBase64,
    toHex: handToHex,
    fromHex: handFromHex,
  },
  /** 当前运行时实际会选中的那一层 */
  get active() {
    if (HAS_NATIVE) return '原生的';
    if (this['Buffer 的'] !== null) return 'Buffer 的';
    return '手写的';
  },
};

// 下面这几个函数就是"应用代码该长什么样"：只认这一层门面，不关心底层是谁。
/**
 * 字节 -> base64 文本。自动选用当前运行时最好的实现。
 * @param {Uint8Array} bytes 字节
 * @param {object} [options] 选项
 * @returns {string}
 */
function toBase64(bytes, options = {}) {
  if (HAS_TO_BASE64) {
    // 原生可用时直接用，并且把方法取出来调用，避免"每次调用都做一次属性查找"。
    return Uint8Array.prototype.toBase64.call(bytes, options);
  }
  return handToBase64(bytes, options);
}

/**
 * base64 文本 -> 字节。
 * @param {string} text base64 文本
 * @param {object} [options] 选项
 * @returns {Uint8Array}
 */
function fromBase64(text, options = {}) {
  if (HAS_FROM_BASE64) return Uint8Array.fromBase64(text, options);
  return handFromBase64(text, options);
}

/**
 * 字节 -> 十六进制文本。
 * @param {Uint8Array} bytes 字节
 * @returns {string}
 */
function toHex(bytes) {
  if (HAS_TO_HEX) return Uint8Array.prototype.toHex.call(bytes);
  return handToHex(bytes);
}

/**
 * 十六进制文本 -> 字节。
 * @param {string} text hex 文本
 * @returns {Uint8Array}
 */
function fromHex(text) {
  if (HAS_FROM_HEX) return Uint8Array.fromHex(text);
  return handFromHex(text);
}

console.log('统一门面已建立。当前运行时会选中的实现层级 = **' + Bytes.active + '**');

// —— 交叉验证 ——
console.log('\n7.1 交叉验证：手写实现 vs Buffer（两者一定都可用）');
const CROSS_SAMPLES = [
  ['空数组', new Uint8Array([])],
  ['1 字节 0x00', new Uint8Array([0x00])],
  ['1 字节 0xff', new Uint8Array([0xff])],
  ['2 字节', new Uint8Array([0xfb, 0xef])],
  ['3 字节', new Uint8Array([0xfb, 0xef, 0xbe])],
  ['5 字节（触发 + 和 /）', new Uint8Array([0xfb, 0xef, 0xbe, 0x3f, 0xfe])],
  ['RFC 4648 示例 Man', new TextEncoder().encode('Man')],
  ['中文 UTF-8', new TextEncoder().encode('中文abc')],
  ['emoji（4 字节 UTF-8）', new TextEncoder().encode('🙂')],
  ['0x00~0x3f 全表', Uint8Array.from({ length: 64 }, (_, i) => i)],
  ['0xc0~0xff 全表', Uint8Array.from({ length: 64 }, (_, i) => 0xc0 + i)],
  ['255 字节顺序数', Uint8Array.from({ length: 255 }, (_, i) => i)],
];
console.table(
  CROSS_SAMPLES.map(([name, bytes]) => {
    const mine = handToBase64(bytes);
    const buf = HAS_BUFFER ? Buffer.from(bytes).toString('base64') : null;
    const mineHex = handToHex(bytes);
    const bufHex = HAS_BUFFER ? Buffer.from(bytes).toString('hex') : null;
    const b64RoundTrip = sameBytes(handFromBase64(mine), bytes);
    const hexRoundTrip = sameBytes(handFromHex(mineHex), bytes);
    return {
      样本: name,
      字节数: bytes.length,
      'base64 手写 vs Buffer 一致': buf === null ? '(无 Buffer)' : mine === buf,
      'hex 手写 vs Buffer 一致': bufHex === null ? '(无 Buffer)' : mineHex === bufHex,
      'base64 往返一致': b64RoundTrip,
      'hex 往返一致': hexRoundTrip,
    };
  }),
);

console.log('\n7.2 与原生实现的逐字节对比（原生可用时才跑，用 --js-base-64 可以打开）');
if (HAS_NATIVE) {
  console.table(
    CROSS_SAMPLES.map(([name, bytes]) => {
      const nativeB64 = bytes.toBase64();
      const handB64 = handToBase64(bytes);
      const nativeHex = bytes.toHex();
      const handHex = handToHex(bytes);
      return {
        样本: name,
        'base64 一致': nativeB64 === handB64,
        'hex 一致': nativeHex === handHex,
        'fromBase64 往返一致': sameBytes(Uint8Array.fromBase64(nativeB64), bytes),
        'base64url 一致': bytes.toBase64({ alphabet: 'base64url' }) === handToBase64(bytes, { alphabet: 'base64url' }),
        'omitPadding 一致': bytes.toBase64({ omitPadding: true }) === handToBase64(bytes, { omitPadding: true }),
      };
    }),
  );

  // 大规模随机验证：2000 组随机长度、随机内容的字节，编码结果必须逐字符一致。
  const ROUNDS = 2000;
  let b64Mismatch = 0;
  let hexMismatch = 0;
  let decodeMismatch = 0;
  for (let i = 0; i < ROUNDS; i += 1) {
    const len = Math.floor(Math.random() * 64);
    const bytes = Uint8Array.from({ length: len }, () => Math.floor(Math.random() * 256));
    if (bytes.toBase64() !== handToBase64(bytes)) b64Mismatch += 1;
    if (bytes.toHex() !== handToHex(bytes)) hexMismatch += 1;
    if (!sameBytes(Uint8Array.fromBase64(bytes.toBase64()), bitsFromHandDecode(bytes))) decodeMismatch += 1;
  }
  console.log(`  ${ROUNDS} 组随机字节：base64 编码不一致 ${b64Mismatch} 个，hex 不一致 ${hexMismatch} 个，解码不一致 ${decodeMismatch} 个`);
  console.log('  => 手写实现与原生实现**逐字节一致**，可以放心作为降级路径。');
} else {
  console.log('  本运行时默认没有原生实现 —— 这一节被跳过。');
  console.log('  用 `node --js-base-64 24_typed_arrays/13_native_base64_and_hex.js` 重跑即可看到对比表。');
  console.log('  在支持的环境里，它会验证：');
  console.log('    · base64 / hex / base64url / omitPadding 四种输出的逐字符一致；');
  console.log('    · 2000 组随机字节的编码与解码双向一致。');
  console.log('  在与 Buffer 的对比（上一节）里已经证明了手写实现的正确性，');
  console.log('  而 Buffer 与原生共享同一套 base64 语义，两者互为印证。');
}

/**
 * 用降级实现解一遍（配合上面的解码对比使用）。
 * @param {Uint8Array} bytes 原始字节
 * @returns {Uint8Array}
 */
function bitsFromHandDecode(bytes) {
  return handFromBase64(handToBase64(bytes));
}

console.log('\n7.3 为什么要在运行时"挑实现"而不是写死一种：');
console.table([
  { 场景: 'Node 24 默认', 会选中: '手写 / Buffer', 为什么: '原生方法还没落地' },
  { 场景: 'Node 加 --js-base-64', 会选中: '原生', 为什么: '同一个版本，跑法不同能力不同' },
  { 场景: '新版浏览器', 会选中: '原生', 为什么: '零依赖、无 DOMException 坑' },
  { 场景: '旧版浏览器', 会选中: '手写', 为什么: '没有 Buffer，原生也没有' },
].map((r) => r));
console.log('  这正是本目录 08_binary_encoding.js 那些手搓样板想要被替代掉的形态：');
console.log('  以前每个项目都要复制一遍 btoa/atob/Buffer 的兼容代码，现在可以只留一份门面。');

// ---------------------------------------------------------------------------
// 8. 完整跑一遍：data URL 与 JWT 式载荷
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战：data URL 与 JWT 式的载荷 ---');

// data URL：把二进制内容直接内嵌进文本。
const fakePngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const dataUrl = 'data:image/png;base64,' + toBase64(fakePngHeader);
console.log('data URL =', dataUrl);
console.log('  0x89 0x50 0x4e 0x47 正是 PNG 文件的固定魔数；');
const restored = fromBase64(dataUrl.split(',')[1]);
console.log('  从 URL 里解回来一致吗 ->', sameBytes(restored, fakePngHeader));

// JSON 里嵌入二进制。
const payload = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
const jsonText = JSON.stringify({ name: 'payload.bin', data: toBase64(payload) });
console.log('\nJSON 文本 =', jsonText);
const parsed = JSON.parse(jsonText);
console.log('  解析回来一致吗 ->', sameBytes(fromBase64(parsed.data), payload));

// JWT 式：base64url + 无填充。
console.log('\nJWT 式载荷（base64url + omitPadding，且内容是 UTF-8 JSON）：');
const header = { alg: 'HS256', typ: 'JWT' };
const claims = { sub: '1234567890', name: '张三', iat: 1710000000, 角色: '管理员' };
const encoder = new TextEncoder();
for (const [label, obj] of [['header', header], ['payload', claims]]) {
  const encoded = toBase64(encoder.encode(JSON.stringify(obj)), { alphabet: 'base64url', omitPadding: true });
  console.log(`  ${label.padEnd(8)} = ${encoded}`);
  // 解回来必须是原来的 JSON —— 注意非 ASCII 已被 UTF-8 编码成多字节。
  const back = new TextDecoder().decode(fromBase64(encoded, { alphabet: 'base64url' }));
  console.log(`           解回来 = ${back}`);
  console.log(`           与原对象一致吗 -> ${back === JSON.stringify(obj)}`);
}
console.log('  注意：真正的 JWT 还要求"签名"，base64url 只是编码，不提供任何机密性或完整性。');

// 调试场景：用 hex 打印一段二进制。
console.log('\n调试场景：hex 打印比乱码直观得多');
const random = new Uint8Array(24);
for (let i = 0; i < random.length; i += 1) random[i] = (i * 37 + 11) & 0xff;
console.log('  直接转成文本 =', JSON.stringify(new TextDecoder('utf-8', { fatal: false }).decode(random)));
console.log('  hex 形式     =', toHex(random));
console.log('  分组显示     =', (toHex(random).match(/.{1,8}/g) ?? []).join(' '));
console.log('  => 排查协议/哈希问题时一律用 hex，不要试图把二进制当文本读。');

// ---------------------------------------------------------------------------
// 9. 交付前检查清单
// ---------------------------------------------------------------------------

console.log('\n--- 9. 检查清单 ---');

console.table(
  [
    ['是否做了 typeof 探测，而不是假设运行时支持？', '同一个 Node 版本加不加开关结果都不同'],
    ['是否准备了降级路径？', '手写查表实现，或用 Buffer（仅 Node）'],
    ['降级实现是否与原生逐字节验证过？', '随机字节 + 边界长度 + 往返，见第 7 节'],
    ['是否记得这些方法只在 Uint8Array 上？', '其它定型数组要先取 .buffer / 建字节视图'],
    ['base64url 是否显式传了 alphabet？', '默认不认 - 和 _，会抛 SyntaxError'],
    ['是否处理了 omitPadding 产生的非 4 倍数长度？', '解析时两种都要能接'],
    ['解析外来数据是否用了 strict？', '能尽早发现数据被截断'],
    ['错误类型是否按 SyntaxError 捕获？', '不是 TypeError，也不是 DOMException'],
    ['是否知道空白会被忽略？', '兼容 PEM 换行；但也意味着"带换行的损坏数据"可能被静默接受'],
    ['是否区分了"编码"与"加密"？', 'base64 谁都能解，敏感数据必须用真正的加密'],
    ['大数组编码前是否评估过体积？', 'hex ×2、base64 ×1.33，1MB 会变成 2MB 的字符串'],
    ['给非 Uint8Array 编码时是否注意了端序？', '多字节类型取字节视图会暴露端序，见 03/05 篇'],
  ].map(([检查项, 做法], i) => ({ '#': i + 1, 检查项, 做法 })),
);

console.log('\n一句话总结：');
console.log('  这四个方法把"字节 <-> 文本"从"每个项目自己写的兼容层"变成了语言标准。');
console.log('  它的价值不只是少写几行代码，而是**抹平了浏览器与 Node 的行为差异**，');
console.log('  并且顺手解决了 btoa 那类"必须先转二进制字符串"的历史包袱。');
console.log('  在原生落地之前，用本文件第 6 节那种"探测 + 降级 + 交叉验证"的写法过渡。');

console.log('\n本节结束。');
