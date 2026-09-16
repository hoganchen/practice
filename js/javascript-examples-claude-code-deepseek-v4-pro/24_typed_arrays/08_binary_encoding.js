/**
 * ============================================================================
 * 知识点：字节的文本化编码 —— Base64 / Hex / 百分号编码的互转
 * ============================================================================
 *
 * 【所属分类】24_typed_arrays —— 二进制数据、定型数组与字节操作
 * 【难度等级】进阶
 * 【前置知识】24_typed_arrays/06_textencoder_decoder.js 与 24_typed_arrays/07_node_buffer.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    字节是 0~255 的数字，而很多传输通道（URL、HTTP 头、JSON、HTML 属性、邮件正文）
 *    只允许"可打印的 ASCII 字符"。要把任意字节塞进这些通道，
 *    必须先把它**编码成只含安全字符的文本**，用的时候再解码回来。
 *    本文件讲三种最常见的编码：
 *      - Hex（十六进制）：每字节 2 个字符，编码后体积 ×2，可读性最好
 *      - Base64：每 3 字节 4 个字符，体积 ×4/3，最常用于嵌入二进制
 *      - 百分号编码（URL 编码）：把不安全字节写成 %XX，URL 专用
 *
 * 2. 为什么需要
 *    - 把一张图片塞进 JSON 或 HTML 的 src="data:image/png;base64,..." 里；
 *    - 把签名、Token 放进 HTTP 头（头里不能有换行和二进制）；
 *    - 把查询参数里的中文和特殊字符安全地放进 URL；
 *    - 调试二进制数据时，用 Hex 打印比看一堆乱码直观得多。
 *    这些编码**不是加密**，只是把字节换成另一种表示，任何人都能还原。
 *
 * 3. 核心语法要点
 *    Base64（浏览器与 Node 通用的 btoa/atob）：
 *      - btoa(binaryString) -> base64 字符串
 *      - atob(base64String) -> 二进制字符串（每个字符的 charCode 是 0~255）
 *      注意它们操作的是"二进制字符串"，不是普通文本！
 *    Base64（Node 专用，更好用）：
 *      - buf.toString('base64') / buf.toString('base64url')
 *      - Buffer.from(str, 'base64')
 *    Hex：
 *      - buf.toString('hex') / Buffer.from(hexStr, 'hex')
 *      - 手动：Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('')
 *    百分号编码：
 *      - encodeURIComponent(str) / decodeURIComponent(str)  按 UTF-8 编码每个字节
 *
 * 4. 常见陷阱
 *    - btoa('中文') 会直接抛 DOMException: Invalid character！
 *      因为 btoa 只接受每个字符都在 0~255 的"二进制字符串"。
 *      正确做法是先用 TextEncoder 编码成字节，再转成二进制字符串。
 *    - atob 的结果也**不是**可以直接显示的文本，必须先转成字节再 UTF-8 解码。
 *    - base64 里的 + / = 在 URL 里会被转义（+ 会变成空格），
 *      所以 URL 场景要用 base64url（把 + 换成 -，/ 换成 _，去掉 =）。
 *    - Base64 只是"换个写法"，不提供任何机密性，别拿它存密码。
 *    - Hex 字符串大小写都可以解析，但比较时要注意统一大小写。
 *    - encodeURIComponent 不会编码 ! ' ( ) * - . _ ~ 这些字符，
 *      其中有些在特定场景仍需转义（标准允许，但个别服务端不认）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 24_typed_arrays/08_binary_encoding.js
 *
 * 【预期输出】
 *   打印同一段数据的 Hex / Base64 / Base64URL / 百分号编码表示，以及互转与陷阱。
 * ============================================================================
 */

// 小工具：字节数组 -> "xx xx" 十六进制串（带空格，便于阅读）。
const spaced = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(' ');

// 小工具：字节数组 -> 紧凑 hex 字符串。
const compactHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

// 小工具：二进制字符串（每字符 0~255）-> Uint8Array。
const binStrToBytes = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0));

// 小工具：Uint8Array -> 二进制字符串。
const bytesToBinStr = (bytes) => Array.from(bytes, (b) => String.fromCharCode(b)).join('');

console.log('--- 1. Base64 的基本原理：3 字节变 4 个字符 ---');

// 取 3 个 ASCII 字节 "Man" —— 这是 RFC 4648 的标准示例。
const man = new TextEncoder().encode('Man');
console.log('原文 = "Man"，字节 =', spaced(man), '（3 个字节）');

// Base64 把 3 字节 = 24 位，切成 4 组、每组 6 位，
// 再查表（A-Z a-z 0-9 + /）映射成 4 个可打印字符：
//   M=0x4D=01001101, a=0x61=01100001, n=0x6E=01101110
//   拼起来：010011 010110 000101 101110
//   查表  ：   T      W      F      u     ->  "TWFu"
console.log('Base64 =', Buffer.from(man).toString('base64'), '（4 个字符）');
console.log('  -> 每 3 字节编成 4 字符，所以体积膨胀 4/3 ≈ 33%');

// 字节数不是 3 的倍数时，用 '=' 补齐。
console.log('"Ma" (2 字节) -> ', Buffer.from('Ma').toString('base64'), '（补 1 个 =）');
console.log('"M"  (1 字节) -> ', Buffer.from('M').toString('base64'), '（补 2 个 =）');
console.log('  -> 所以合法的 base64 长度永远是 4 的倍数');

console.log('--- 2. btoa / atob：浏览器风格的两个全局函数 ---');

// Node 从 v16 起也提供了这两个浏览器全局函数。
console.log('typeof btoa =', typeof btoa, ', typeof atob =', typeof atob);

// btoa 接收"二进制字符串"，返回 base64。
console.log('btoa("Man") =', btoa('Man'));

// atob 反向：返回的"二进制字符串"每个字符的 charCode 就是原来的字节值。
const back = atob('TWFu');
console.log('atob("TWFu") =', JSON.stringify(back), ', length =', back.length);
console.log('  各字符的码点 =', Array.from(back, (c) => c.charCodeAt(0)).join(', '), '（就是原来的字节）');

console.log('--- 3. 陷阱：btoa 不能直接编码中文 ---');

// 中文字符的码点远大于 255，btoa 会当场抛错。
try {
  btoa('中文');
} catch (err) {
  console.log('btoa("中文") 抛错：', err.constructor.name, '/', err.name, '-', err.message);
}

// 正确姿势：先用 TextEncoder 拿到 UTF-8 字节，再把字节当成"二进制字符串"喂给 btoa。
const text = '中文abc';
const textBytes = new TextEncoder().encode(text);
const binStr = bytesToBinStr(textBytes);
console.log('原始字节 =', spaced(textBytes));
console.log('二进制字符串的每个字符码 =', Array.from(binStr, (c) => c.charCodeAt(0)).join(','));

const b64FromBtoa = btoa(binStr);
console.log('btoa(二进制字符串) =', b64FromBtoa);
console.log('与 Buffer 的结果一致吗？', b64FromBtoa === Buffer.from(text, 'utf8').toString('base64'));

// 解码方向同样要绕一圈：atob -> 二进制字符串 -> 字节 -> UTF-8 文本。
const decodedBytes = binStrToBytes(atob(b64FromBtoa));
console.log('atob 再 UTF-8 解码 =', new TextDecoder().decode(decodedBytes));
console.log('  -> 直接用 atob 的结果当文本用是错的，必须先转回字节');

console.log('--- 4. Node 用 Buffer 更省事 ---');

// Buffer 把上面那套绕圈全部封装好了，一行搞定。
const buf = Buffer.from(text, 'utf8');
console.log('buf.toString("base64") =', buf.toString('base64'));
console.log('Buffer.from(b64, "base64").toString("utf8") =', Buffer.from(buf.toString('base64'), 'base64').toString('utf8'));
console.log('  -> Node 环境下优先用 Buffer；btoa/atob 主要为了兼容浏览器代码');

console.log('--- 5. Base64URL：为 URL 安全而生的变体 ---');

// 造一段会产生 + 和 / 的字节（这是 base64 标准表里的第 62、63 个字符）。
const trickyBytes = new Uint8Array([0xfb, 0xef, 0xbe, 0x3f, 0xfe]);
const stdB64 = Buffer.from(trickyBytes).toString('base64');
const urlB64 = Buffer.from(trickyBytes).toString('base64url');

console.log('字节 =', spaced(trickyBytes));
console.log('标准 base64    =', stdB64);
console.log('base64url      =', urlB64);

// 逐字符对照，可以清楚看到替换规则。
console.log('标准 :', stdB64);
console.log('url  :', urlB64);
console.log('  替换规则：+ -> - ，/ -> _ ，并去掉末尾的 = 填充');
console.log('  标准里有 + 吗？', stdB64.includes('+'), '| url 里有 + 吗？', urlB64.includes('+'));

// 为什么必须换？因为 URL 编码中 "+" 代表空格，"/" 会破坏路径分段。
console.log('把标准 base64 放进 URL =', encodeURIComponent(stdB64), '（+ 被转义成 %2B，变得又长又丑）');
console.log('把 base64url 放进 URL   =', encodeURIComponent(urlB64), '（原样可用）');

// base64url 一样能解回来。
console.log('base64url 解码 =', spaced(Buffer.from(urlB64, 'base64url')));
console.log('  -> Buffer.from(x, "base64") 其实也容错地接受 - 和 _，但最好显式写 base64url');

// 注意：浏览器的 atob 不认 - 和 _，必须自己替换回去。
try {
  atob(urlB64);
} catch (err) {
  console.log('浏览器风格的 atob 解 base64url：', err.name, '-', err.message);
}
const fixed = urlB64.replace(/-/g, '+').replace(/_/g, '/');
console.log('手工替换回标准表后 atob 可用 =', spaced(binStrToBytes(atob(fixed))));

console.log('--- 6. Hex 编码：最易读的字节表示 ---');

const payload = new TextEncoder().encode('Hi 你好');
console.log('字节          =', spaced(payload));

// Node 的 toString('hex') 是最简洁的写法（不带分隔符）。
const hexStr = Buffer.from(payload).toString('hex');
console.log('toString("hex")=', hexStr);

// 手动实现一遍，理解它不过是"每字节两位十六进制"。
const manualHex = Array.from(payload, (b) => b.toString(16).padStart(2, '0')).join('');
console.log('手动拼接       =', manualHex);
console.log('两者一致吗？   =', manualHex === hexStr);

// 解码：Buffer.from(hex, 'hex')。
console.log('hex 解码回文本 =', Buffer.from(hexStr, 'hex').toString('utf8'));

// 手动解码：每两位取一个子串，用 parseInt(..., 16) 解析。
const manualBack = new Uint8Array(hexStr.length / 2);
for (let i = 0; i < manualBack.length; i += 1) {
  manualBack[i] = parseInt(hexStr.substr(i * 2, 2), 16);
}
console.log('手动解码       =', new TextDecoder().decode(manualBack));

// Hex 的大小写与奇数长度。
console.log('大写 hex 解析  =', Buffer.from(hexStr.toUpperCase(), 'hex').toString('utf8'), '（大小写都认）');
console.log('奇数长度 hex   =', Buffer.from('abc', 'hex'), '（末尾半个字节被丢弃，只剩 ab）');
console.log('  -> 建议始终用偶数长度、统一小写，避免歧义');

// 常见用途：调试打印、颜色值、哈希摘要。
console.log('颜色值示例     = #' + Buffer.from([0xff, 0x88, 0x00]).toString('hex'));

console.log('--- 7. 百分号编码（URL 编码） ---');

// encodeURIComponent 会把字符串按 UTF-8 编码，再把"不安全"的字节写成 %XX。
const query = '关键词=a b&c';
console.log('原文 =', query);
console.log('encodeURIComponent =', encodeURIComponent(query));

// 中文会变成一串 %E4... 的三字节 UTF-8 序列。
const zhQuery = '搜索=中文';
const encoded = encodeURIComponent(zhQuery);
console.log('中文原文 =', zhQuery);
console.log('编码后   =', encoded);
console.log('  "中" 的 UTF-8 是 e4 b8 ad，所以编码成 %E4%B8%AD');
console.log('解码回来 =', decodeURIComponent(encoded));

// 哪些字符不会被编码？留作"安全字符"的集合：
const unreserved = "A-z0-9-_.!~*'()";
console.log('不会被编码的字符 =', JSON.stringify(unreserved));
console.log('encodeURIComponent("A-_.!~*\'()") =', encodeURIComponent("A-_.!~*'()"));

// 对比 encodeURI：它保留 :/?#[]@ 等 URL 结构字符，适合整条 URL。
const fullUrl = 'https://example.com/a b?q=中 文&x=1';
console.log('encodeURI        =', encodeURI(fullUrl), '（保留 :// ? & 等结构字符）');
console.log('encodeURIComponent=', encodeURIComponent(fullUrl), '（全部转义，适合做参数值）');
console.log('  -> 拼 URL 时：结构部分用 encodeURI，参数值用 encodeURIComponent');

// encodeURIComponent 处理的是**字符串的 UTF-8 字节**，不是"字符码点"。
// 所以 charCode 为 0xff 的字符（码点 U+00FF）会被编成 UTF-8 的两字节 c3 bf。
console.log('对二进制字符串 [00 41 ff] 做编码 =', encodeURIComponent(bytesToBinStr(new Uint8Array([0x00, 0x41, 0xff]))));
console.log('  -> 0x00 -> %00（控制字符必须转义）');
console.log('  -> 0x41 是字母 A，属于安全字符，原样保留');
console.log('  -> 0xff 对应码点 U+00FF，UTF-8 是 c3 bf，所以变成 %C3%BF');
console.log('  -> 想对"原始字节"做百分号编码且保证一一对应，应改用 Buffer.toString("hex") 之类的方案');

console.log('--- 8. 三种编码的体积与用途对比 ---');

const sample = new TextEncoder().encode('The quick brown fox jumps over the lazy dog');
const n = sample.length;
console.log('原始字节数            =', n);
console.log('Hex 编码后长度        =', Buffer.from(sample).toString('hex').length, `（×2）`);
console.log('Base64 编码后长度     =', Buffer.from(sample).toString('base64').length, `（约 ×${(Buffer.from(sample).toString('base64').length / n).toFixed(2)}）`);
console.log('百分号编码后长度（最坏）=', n * 3, '（不可打印字节每个 3 字符，×3）');
console.log('  -> 体积：Hex > 百分号 > Base64');
console.log('  -> 可读性：Hex 最好，Base64 最差但最紧凑');

console.log('--- 9. 实战：data URL 与 JWT 式的载荷 ---');

// data URL：把二进制内容直接内嵌进文本。
// 这里用几个字节模拟一张"图片"，实际项目里就是 fs.readFileSync 的结果。
const fakePngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const dataUrl = 'data:image/png;base64,' + Buffer.from(fakePngHeader).toString('base64');
console.log('data URL =', dataUrl);
console.log('  -> 0x89 0x50 0x4e 0x47 正是 PNG 文件的固定魔数');
console.log('  还原出的字节 =', spaced(Buffer.from(dataUrl.split(',')[1], 'base64')));

// JSON 里嵌入二进制：JSON 只能放字符串，所以要靠 base64 转一道。
const binaryInJson = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
const jsonText = JSON.stringify({ name: 'payload.bin', data: Buffer.from(binaryInJson).toString('base64') });
console.log('JSON 文本 =', jsonText);
const parsed = JSON.parse(jsonText);
console.log('解析回来 =', spaced(Buffer.from(parsed.data, 'base64')), '（与原始字节一致）');

console.log('--- 10. 再次强调：编码不是加密 ---');

// base64 只是换了个写法，谁都能解 —— 不要用它保护敏感数据。
const secret = 'password123';
console.log('原文            =', secret);
console.log('base64          =', Buffer.from(secret).toString('base64'));
console.log('任何人都能解码回 =', Buffer.from(Buffer.from(secret).toString('base64'), 'base64').toString());
console.log('  -> 保护机密要用真正的加密算法（见 crypto 相关章节），而不是编码');

console.log('\n全部演示完毕。');
