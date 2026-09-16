/**
 * ============================================================================
 * 知识点：TextEncoder / TextDecoder —— 字符串与 UTF-8 字节的互转
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/03_typed_array_types.js 与 11_strings/ 中的 Unicode 章节
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    TextEncoder 把 JS 字符串编码成 UTF-8 字节序列（输出一个 Uint8Array）；
 *    TextDecoder 把字节序列按指定编码解码回字符串。
 *    它们是字符串世界与二进制世界之间唯一的官方桥梁，
 *    也是 ArrayBuffer 体系中"为什么需要字节"最直观的例子。
 *
 * 2. 为什么需要
 *    文件、网络、加密、压缩算法处理的都是字节，不是字符。
 *    而 JS 字符串内部用的是 UTF-16 码元序列，一个"字符"可能占 1 个或 2 个码元。
 *    想把字符串写进文件或发给服务端，必须先确定"用哪种编码变成哪些字节"。
 *    TextEncoder 固定使用 UTF-8（这是 Web 与 Node 的事实标准），
 *    TextDecoder 则支持多种编码，可以把别人给的字节按正确的方式还原。
 *
 * 3. 核心语法要点
 *    - const enc = new TextEncoder();          // 只能构造 UTF-8 编码器，无参数
 *    - enc.encoding                             // 永远是 'utf-8'
 *    - enc.encode(str)                          // 返回 Uint8Array
 *    - enc.encodeInto(str, uint8Array)          // 写进已有缓冲区，返回 { read, written }
 *    - const dec = new TextDecoder(label, opts); // 默认 'utf-8'，可传 'utf-16le'、'latin1' 等
 *    - dec.decode(bytes)                        // 返回字符串
 *    - dec.decode(bytes, { stream: true })      // 流式解码：字节还没收完时用
 *    - opts.fatal = true                        // 遇到非法字节直接抛错，而不是替换成 U+FFFD
 *    - opts.ignoreBOM = true                    // 保留 BOM 字符（默认会吃掉它）
 *
 * 4. 常见陷阱
 *    - 中文一个字在 UTF-8 里占 3 个字节，英文 1 个，emoji 4 个。
 *      str.length 是"UTF-16 码元数"，不是字节数，也不是"字符数"。
 *    - 用 Uint8Array.from(str, c => c.charCodeAt(0)) 做"编码"是错的：
 *      它只能处理 0~255 的码点，中文会被截断成垃圾数据。
 *    - 直接用 String.fromCharCode(...bytes) 解码 UTF-8 中文也是错的，
 *      必须用 TextDecoder。
 *    - 非法字节默认被替换成 U+FFFD（"�"），不报错，容易静默丢数据。
 *    - decode() 默认会吞掉开头的 BOM，如果需要保留要显式设置 ignoreBOM。
 *    - 多字节字符被切开时（网络分包），必须用 { stream: true } 才能正确还原。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/06_textencoder_decoder.js
 *
 * 【预期输出】
 *   打印中英文/emoji 的 UTF-8 字节长度与十六进制内容，并演示流式解码与容错。
 * ============================================================================
 */

// 小工具：字节数组 -> "xx xx xx" 十六进制串。
const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');

console.log('--- 1. 创建编码器 / 解码器 ---');

const enc = new TextEncoder();

// TextEncoder 不接收构造参数，它的编码永远是 UTF-8。
console.log('enc.encoding =', enc.encoding);

// TextDecoder 的构造参数是一个"编码标签"字符串，默认 utf-8。
const dec = new TextDecoder();
console.log('dec.encoding =', dec.encoding, '（默认）');
console.log('dec.fatal =', dec.fatal, ', dec.ignoreBOM =', dec.ignoreBOM);

console.log('--- 2. 最简单的往返：ASCII 字符串 ---');

const ascii = 'Hello';

// encode 返回一个 Uint8Array，长度恰好是字符个数（ASCII 每字符 1 字节）。
const asciiBytes = enc.encode(ascii);
console.log('encode("Hello") 类型 =', asciiBytes.constructor.name);
console.log('  字节长度 =', asciiBytes.length);
console.log('  内容（十进制）=', Array.from(asciiBytes).join(', '));
console.log('  内容（十六进制）=', hex(asciiBytes));
console.log('  -> 0x48=72 是 "H" 的 ASCII 码，0x65=101 是 "e"');

// decode 把字节还原成字符串。
console.log('decode 回来 =', dec.decode(asciiBytes));
console.log('往返一致吗？', dec.decode(asciiBytes) === ascii);

console.log('--- 3. 中文：一个字 3 个字节 ---');

const chinese = '中';

// JS 字符串的 length 是 UTF-16 码元数量。"中" 在 BMP 内，所以 length = 1。
console.log('"中".length =', chinese.length, '（UTF-16 码元数）');

// 码点（code point）才是真正的"字符编号"。
console.log('"中" 的码点 = U+' + chinese.codePointAt(0).toString(16).toUpperCase(),
  '（十进制 ' + chinese.codePointAt(0) + '）');

// 但在 UTF-8 里，这个码点需要 3 个字节才能表示（0xE4 0xB8 0xAD）。
const chineseBytes = enc.encode(chinese);
console.log('"中" 的 UTF-8 字节长度 =', chineseBytes.length);
console.log('"中" 的 UTF-8 字节 =', hex(chineseBytes));
console.log('  -> 0xE4B8AD 就是 U+4E2D 的 UTF-8 三字节编码');

// 对照：英文只占 1 字节，所以同样长度的字符串，中文的字节数是 3 倍。
const en = 'abcde';
const zh = '一二三四五';
console.log('"abcde" 字符数 =', en.length, ', 字节数 =', enc.encode(en).length);
console.log('"一二三四五" 字符数 =', zh.length, ', 字节数 =', enc.encode(zh).length);
console.log('  -> 这就是"按字符截断"会把中文截成乱码的根本原因');

console.log('--- 4. emoji：一个字 4 个字节，且 length 是 2 ---');

const emoji = '😀'; // U+1F600

// 这个码点超过了 U+FFFF，UTF-16 必须用两个码元（代理对）表示，所以 length = 2。
console.log('"😀".length =', emoji.length, '（两个 UTF-16 码元，即代理对）');

// codePointAt 能正确还原成完整码点；charCodeAt 只能看到一半。
console.log('codePointAt(0) = U+' + emoji.codePointAt(0).toString(16).toUpperCase());
console.log('charCodeAt(0) = U+' + emoji.charCodeAt(0).toString(16).toUpperCase(), '（代理对高位）');
console.log('charCodeAt(1) = U+' + emoji.charCodeAt(1).toString(16).toUpperCase(), '（代理对低位）');

// UTF-8 用 4 个字节表示它。
const emojiBytes = enc.encode(emoji);
console.log('"😀" 的 UTF-8 字节 =', hex(emojiBytes), '（4 字节）');
console.log('  -> 0xF0 0x9F 0x98 0x80 对应 U+1F600');

// 遍历时要注意：for...of 按码点迭代（正确），下标按码元（会切开 emoji）。
console.log('for...of 迭代次数 =', [...emoji].length, '（按码点，正确）');
console.log('按 length 下标遍历 =', emoji.length, '（会切成两个半截）');

// 把 emoji 的字节切开一半再解回来 —— 这是经典的"乱码"现场。
console.log('切开前 2 字节解码 =', JSON.stringify(dec.decode(emojiBytes.slice(0, 2))));
console.log('  -> 得到替换字符 U+FFFD（显示为一个问号菱形），表示"这段字节不是合法的 UTF-8"');
console.log('完整解码 =', dec.decode(emojiBytes));

console.log('--- 5. 编码长度的完整对照表 ---');

// 用码点范围来理解 UTF-8 的变长规则。
const samples = [
  ['A（ASCII）', 'A'],
  ['é（拉丁扩展）', 'é'],
  ['中（CJK 基本区）', '中'],
  ['𝄞（音乐符号）', '𝄞'],
  ['😀（emoji）', '😀'],
];

console.log('样本            码点        UTF-16 length  UTF-8 字节数  字节内容');
for (const [label, str] of samples) {
  const bytes = enc.encode(str);
  console.log(
    label.padEnd(16),
    ('U+' + str.codePointAt(0).toString(16).toUpperCase()).padEnd(10),
    String(str.length).padEnd(14),
    String(bytes.length).padEnd(13),
    hex(bytes),
  );
}
console.log('  -> 规则：码点 <= 0x7F 用 1 字节；<= 0x7FF 用 2 字节；');
console.log('           <= 0xFFFF 用 3 字节；> 0xFFFF 用 4 字节');

console.log('--- 6. encodeInto：写进已有的缓冲区 ---');

const small = new Uint8Array(8);

// encodeInto 把字符串写进你给的目标数组，返回 { read, written }。
// read = 消费了多少个 UTF-16 码元，written = 写入多少个字节。
const result = enc.encodeInto('中文字符串', small);
console.log('encodeInto 返回值 =', JSON.stringify(result));
console.log('  read =', result.read, '（消费的码元数）');
console.log('  written =', result.written, '（写入的字节数）');
console.log('  目标缓冲区内容 =', hex(small));

// 缓冲区不够时，编码会在字符边界处停下，不会写半个字符进去。
// '中' 占 3 字节，8 字节的缓冲区只能装下 2 个完整的汉字（6 字节）。
console.log('  -> 8 字节只装得下 2 个汉字（6 字节），第三个汉字放不下就停住了');
console.log('  未写入的部分保持为 0 =', Array.from(small.subarray(result.written)).join(','));

// 用 read 可以知道字符串处理到哪儿了，便于分批处理大文本。
console.log('  已完整写入的字符串 =', dec.decode(small.subarray(0, result.written)));

console.log('--- 7. 流式解码：处理被切断的多字节字符 ---');

// 模拟网络分包：一个中文字符的 3 个字节被拆成两次到达。
const full = enc.encode('中文'); // e4 b8 ad e6 96 87
const chunk1 = full.slice(0, 4); // 第一个汉字完整 + 第二个汉字的前 1 字节
const chunk2 = full.slice(4); // 第二个汉字的剩余 2 字节

// 不用 stream：第一个分包末尾的半个字符解码失败，变成替换字符。
console.log('非流式解码 chunk1 =', JSON.stringify(dec.decode(chunk1)));

// 用 stream: true：解码器会把不完整的字节"记住"，等下一块到了再拼起来。
const dec2 = new TextDecoder();
const part1 = dec2.decode(chunk1, { stream: true });
const part2 = dec2.decode(chunk2, { stream: true });
const part3 = dec2.decode(); // 收尾，冲刷剩余状态
console.log('流式解码 chunk1 =', JSON.stringify(part1), '（不完整的字节被暂存，不输出乱码）');
console.log('流式解码 chunk2 =', JSON.stringify(part2));
console.log('流式收尾 decode() =', JSON.stringify(part3));
console.log('拼起来 =', JSON.stringify(part1 + part2 + part3), '（完整还原"中文"）');

console.log('--- 8. fatal：让非法字节直接报错 ---');

// 构造一段非法的 UTF-8：0xFF 在 UTF-8 里永远不合法。
const invalid = new Uint8Array([0x41, 0xff, 0x42]);

// 默认模式：碰到非法字节替换成 U+FFFD，不报错 —— 数据被静默改变。
console.log('默认解码 =', JSON.stringify(dec.decode(invalid)), '（0xff 变成了 U+FFFD）');

// fatal: true 模式：直接抛 TypeError，让错误暴露出来。
const strictDec = new TextDecoder('utf-8', { fatal: true });
try {
  strictDec.decode(invalid);
} catch (err) {
  console.log('fatal 模式解码：', err.constructor.name, '-', err.message);
}
console.log('  -> 解析不可信数据时，建议用 fatal: true，避免悄悄丢数据');

console.log('--- 9. 其它编码：utf-16le 与 latin1 ---');

// UTF-16 是小端序 2 字节定长（BMP 内），跟 UTF-8 的结果完全不同。
const utf16 = new TextDecoder('utf-16le');
const zhBytes = enc.encode('中'); // UTF-8: e4 b8 ad
console.log('"中" 的 UTF-8 字节 =', hex(zhBytes));
console.log('用 utf-8 解码 =', dec.decode(zhBytes), '（正确）');

// 用 UTF-16LE 解读同样的字节会得到完全不同的字符（甚至拼接出两个字符）。
console.log('同样字节用 utf-16le 解读 =', JSON.stringify(utf16.decode(new Uint8Array([0x2d, 0x4e]))), '（U+4E2D 的小端写法）');

// latin1（iso-8859-1）是单字节编码，每个字节直接对应一个码点 0~255。
const latin1 = new TextDecoder('latin1');
const latin1Bytes = new Uint8Array([0x41, 0xe9, 0xff]);
console.log('latin1 解码 [41 e9 ff] =', JSON.stringify(latin1.decode(latin1Bytes)));
console.log('  -> latin1 永远不会失败，任意字节都能解出一个字符，但会丢失中文信息');

console.log('--- 10. BOM：文件开头的隐藏字符 ---');

// U+FEFF 是字节顺序标记（BOM）。UTF-8 文件有时会在开头写它在 UTF-8 下的字节 EF BB BF。
const withBom = new Uint8Array([0xef, 0xbb, 0xbf, 0x41]); // BOM + 'A'

// 默认解码会吃掉 BOM。
console.log('默认解码 =', JSON.stringify(dec.decode(withBom)), ', 长度 =', dec.decode(withBom).length);

// ignoreBOM: true 则保留它。
const keepBom = new TextDecoder('utf-8', { ignoreBOM: true });
const kept = keepBom.decode(withBom);
console.log('ignoreBOM 解码 =', JSON.stringify(kept), ', 长度 =', kept.length);
console.log('  首字符码点 = U+' + kept.codePointAt(0).toString(16).toUpperCase(), '（就是 U+FEFF 本身）');

// 自己造一个 BOM 也很简单。
console.log('enc.encode("\\uFEFF") =', hex(enc.encode('﻿')), '（UTF-8 的 BOM 就是 EF BB BF）');

console.log('\n全部演示完毕。');
