/**
 * ============================================================================
 * 知识点：摘要算法 —— SHA-256/384/512，subtle.digest 用法、与 node:crypto 交叉验证、为什么不可逆
 * ============================================================================
 *
 * 【所属分类】35_web_crypto —— Web Crypto API
 * 【难度等级】入门
 * 【前置知识】35_web_crypto/01_crypto_overview.js、24_typed_arrays/06_textencoder_decoder.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    **摘要（digest / hash，也叫散列、哈希）**是一个把"任意长度的数据"压缩成
 *    "固定长度的一串字节"的函数。它有三个必须同时成立的特性：
 *      (a) **确定性**：同样的输入永远得到同样的输出（一个字节都不差）。
 *      (b) **单向性（抗原像）**：给定输出，反推输入在计算上不可行。
 *      (c) **抗碰撞**：找两个不同的输入让它们输出相同，在计算上不可行。
 *    "固定长度"具体是多少由算法决定：
 *      SHA-1   -> 160 位 = 20 字节（已不推荐）
 *      SHA-256 -> 256 位 = 32 字节
 *      SHA-384 -> 384 位 = 48 字节
 *      SHA-512 -> 512 位 = 64 字节
 *    无论你丢进去的是 1 个字节还是 10 GB，输出长度都一样。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) **完整性校验**：下载文件后比对官方公布的 SHA-256，确认没被篡改/损坏。
 *        （注意：单纯的摘要防不住"攻击者同时改文件又改摘要"，那种场景需要 HMAC，见 03 篇。）
 *    (b) **内容寻址**：Git 用对象内容的 SHA-1/SHA-256 作为对象 ID；
 *        Docker 镜像、IPFS、npm 的 integrity 字段同理 —— 内容一样，ID 就一样。
 *    (c) **去重与大文件比对**：先比摘要（32 字节）再决定要不要比内容（可能几十 GB）。
 *    (d) **数据脱敏**：手机号/身份证写日志前先摘要，既能关联同一用户又不泄漏原文。
 *    (e) **口令存储的起点**（但要加盐 + 慢哈希，见本文件小节 6 与 05 篇）。
 *    (f) **数字签名与证书**：签名签的其实不是原文，而是"原文的摘要"。
 *        因为摘要短且固定长度，签名才高效；这也是为什么摘要算法的抗碰撞性直接决定签名安全。
 *
 * 3. 核心语法要点
 *    (a) `await subtle.digest(algorithm, data)`
 *          algorithm: 'SHA-256' / 'SHA-384' / 'SHA-512'（也可写 { name: 'SHA-256' }）
 *          data     : **BufferSource**（ArrayBuffer / TypedArray / DataView），不是字符串
 *          返回     : ArrayBuffer（原始字节，不是十六进制字符串！要自己转）
 *    (b) 摘要算法**不需要密钥**。所以它只能证明"数据没变"，不能证明"数据是谁发的"。
 *        要证明来源，用 HMAC（带密钥）或数字签名。
 *    (c) 编码：`new TextEncoder().encode(str)` 固定用 **UTF-8**。
 *        Node 里 `Buffer.from(str)` 默认也是 UTF-8，两者结果完全一致，可互相替换。
 *    (d) 结果转文本：`Buffer.from(arrayBuffer).toString('hex')`
 *        或 `Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')`。
 *    (e) Web Crypto 的 digest 是"一次性喂完整数据"，没有 update/final 的流式接口。
 *        大文件要在 Node 里用 `createHash('sha256').update(chunk)` 分组喂。
 *        两者的结果**必须一致** —— 这正是绝好的自检手段。
 *
 * 4. 常见陷阱
 *    - **把字符串直接传给 digest**：抛 TypeError。必须先 TextEncoder/Buffer 转字节。
 *    - **把返回的 ArrayBuffer 直接当字符串用**：`console.log(hash)` 打印不出可读内容，
 *      `hash.toString()` 得到的是 "[object ArrayBuffer]"，
 *      用 `hash.length` 还会得到 undefined（ArrayBuffer 的长度属性叫 byteLength）。
 *    - **混淆"摘要"和"加密"**：摘要是单向的、不可解的；加密是可逆的（有密钥就能解回来）。
 *      经常有人问"MD5 怎么解密" —— 答案是没有解密，只有"撞库"（查别人的彩虹表）。
 *    - **`buf.buffer` 陷阱**：Node 的小 Buffer 是从一块 8 KiB 的内存池里切出来的，
 *      `buf.buffer` 是**整块池子**，直接把它传给 digest 会算进别人的数据。
 *      要传就用 Buffer 本身。
 *    - **用 MD5/SHA-1 做安全用途**：MD5 和 SHA-1 的碰撞攻击早已实用化
 *      （2004 年 MD5、2017 年 SHA-1 的 SHAttered 攻击），
 *      能用于"校验传输错误"，但不能用于"防人为篡改"、签名、证书、口令。
 *    - **以为"加长摘要更安全"**：SHA-512 不比 SHA-256 "安全一倍"，
 *      它只是输出更长。真正的强度取决于你用在什么协议里。
 *    - **口令用裸摘要存**：不加盐 = 彩虹表一击即中；不加迭代 = GPU 每秒几百亿次。
 *      正确做法见 05_key_derivation_pbkdf2.js。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 35_web_crypto/02_digest_hashing.js
 *
 * 【预期输出】
 *   1) 演示字符串/字节/编码的输入差异（含"直接传字符串会报错"的 try/catch）；
 *   2) 计算 SHA-256/384/512 的摘要并与 3 组公开测试向量逐字节比对；
 *   3) 每一步都与 node:crypto 的 createHash 交叉验证，打印"是否一致"；
 *   4) 用"改一个字符"演示雪崩效应；
 *   5) 用一张小型彩虹表演示"为什么口令不能裸摘要存储"，并说明盐的作用。
 *   全程退出码 0，不访问网络。
 * ============================================================================
 */

import { createHash } from 'node:crypto';

const subtle = globalThis.crypto.subtle;
const encoder = new TextEncoder();

/** 把 BufferSource 转成十六进制字符串。 */
const toHex = (bytes) => Buffer.from(bytes).toString('hex');

/** 把十六进制字符串转成大写分组的可读形式，便于按字节观察差异。 */
const groupHex = (hex, groupSize = 8) =>
  hex.toUpperCase().match(new RegExp(`.{1,${groupSize}}`, 'g')).join(' ');

// ---------------------------------------------------------------------------
console.log('--- 1. 摘要的输入是"字节"，不是"字符串" ---');
// ---------------------------------------------------------------------------
const text = 'abc';
console.log(`  原文："${text}"（${text.length} 个字符）`);
console.log(`  TextEncoder（UTF-8）编码后：${encoder.encode(text).length} 字节 -> ${toHex(encoder.encode(text))}`);
console.log(`  Buffer.from(同样内容) 编码后：${Buffer.from(text).length} 字节 -> ${toHex(Buffer.from(text))}`);
console.log(`  两者字节完全一致？ ${toHex(encoder.encode(text)) === toHex(Buffer.from(text))}`);

const zh = '中文';
const zhBytes = encoder.encode(zh);
console.log(`\n  中文示例："${zh}" 有 ${zh.length} 个字符（JS 里按 UTF-16 码元计数），`);
console.log(`  但 UTF-8 编码后是 ${zhBytes.length} 字节 -> ${toHex(zhBytes)}`);
console.log(`  这就是为什么"字符长度"和"字节长度"必须分清：摘要算的是字节。`);

console.log('\n  如果偷懒直接把字符串传进去：');
try {
  await subtle.digest('SHA-256', text);
  console.log('    居然成功了？（不同运行时的行为可能不同）');
} catch (err) {
  console.log(`    抛错 ${err.name}`);
  console.log(`    信息片段：${String(err.message).slice(0, 88)}…`);
  console.log('    修法：await subtle.digest("SHA-256", new TextEncoder().encode(text))');
}

console.log('\n  如果误传了 Buffer 底下的整块内存池（经典陷阱）：');
// Node 的小 Buffer 从 8 KiB 的共享内存池里切，`buf.buffer` 是整块池子。
const small = Buffer.from('abc');
console.log(`    Buffer.from("abc") 本身长度        = ${small.byteLength} 字节`);
console.log(`    它底下的 .buffer（内存池）长度     = ${small.buffer.byteLength} 字节  <- 大得多！`);
const hashOfBuffer = toHex(await subtle.digest('SHA-256', small));
const hashOfPool = toHex(await subtle.digest('SHA-256', small.buffer));
console.log(`    digest(small)            = ${hashOfBuffer.slice(0, 32)}…`);
console.log(`    digest(small.buffer)     = ${hashOfPool.slice(0, 32)}…`);
console.log(`    两者相同吗？ ${hashOfBuffer === hashOfPool}  <- 不同！因为池子里还装着别人的数据`);
console.log('    结论：传 TypedArray 就用它本身，只有在你**明确知道**要整个 ArrayBuffer 时才用 .buffer。');
console.log(`    （对比：digest("abc") 应该是 ${toHex(await subtle.digest('SHA-256', encoder.encode('abc'))).slice(0, 32)}…，与第 1 个相同 ✓）`);

// ---------------------------------------------------------------------------
console.log('\n--- 2. 计算 SHA-256 / SHA-384 / SHA-512 ---');
// ---------------------------------------------------------------------------
const algorithms = ['SHA-256', 'SHA-384', 'SHA-512'];
const message = 'The quick brown fox jumps over the lazy dog';
const messageBytes = encoder.encode(message);
console.log(`  原文："${message}"（${messageBytes.length} 字节）\n`);

const digestResults = new Map();
for (const algo of algorithms) {
  const digest = await subtle.digest(algo, messageBytes);
  const hex = toHex(digest);
  digestResults.set(algo, hex);
  const bits = digest.byteLength * 8;
  console.log(`  ${algo}：`);
  console.log(`    返回对象类型：${digest.constructor.name}，byteLength=${digest.byteLength}（= ${bits} 位）`);
  console.log(`    十六进制：${groupHex(hex)}`);
  console.log(`    这就是"固定长度"的含义：输入无论多大，${algo} 永远输出 ${digest.byteLength} 字节。\n`);
}

console.log('  同一个原文，三种算法给出完全不同的结果 —— 它们是三套独立的算法，不是"加长版"。');
console.log(`  把 SHA-256 的结果排成一行：${digestResults.get('SHA-256')}`);
console.log('  想从这 64 个十六进制字符里"看出"原文？做不到 —— 这就是单向性。');

// ---------------------------------------------------------------------------
console.log('\n--- 3. 与 node:crypto 交叉验证（含公开测试向量）---');
// ---------------------------------------------------------------------------
// 交叉验证的意义：两套**独立实现**（Web Crypto 底层是 OpenSSL/BoringSSL，
// node:crypto 也走 OpenSSL，但入口、参数、编码处理完全不同）给出同样的结果，
// 才说明你把"输入编码、算法名、输出转换"这三步全都对上了。
// 再加上公开测试向量（NIST 公布的已知答案），三方一致才能真正确认实现无误。

// 公开的标准测试向量：SHA-256/384/512 对空串和 "abc" 的结果（NIST FIPS 180-4 示例）
console.log('  先看几组**公开标准测试向量**（可以直接和 NIST 文档对照）：');
const knownVectors = [
  ['', 'SHA-256', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
  ['abc', 'SHA-256', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  ['abc', 'SHA-384', 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7'],
  ['abc', 'SHA-512', 'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'],
];
let allVectorsPass = true;
for (const [input, algo, expected] of knownVectors) {
  const actual = toHex(await subtle.digest(algo, encoder.encode(input)));
  const ok = actual === expected;
  if (!ok) allVectorsPass = false;
  console.log(`    ${algo}("${input}") 与标准值一致？ ${ok}`);
}
console.log(`  全部测试向量通过？ ${allVectorsPass}`);

console.log('\n  再对**任意输入**做 Web Crypto 与 node:crypto 的逐字节比对：');
const crossCases = [
  ['英文短句', 'The quick brown fox jumps over the lazy dog'],
  ['含中文', '中文摘要测试：你好，世界'],
  ['含 emoji', 'emoji 也要按 UTF-8 编成字节 🎉🔐'],
  ['空串', ''],
  ['超长重复文本', 'A'.repeat(100_000)],
  ['包含换行与制表', 'line1\nline2\ttabbed'],
];
for (const [label, input] of crossCases) {
  const bytes = encoder.encode(input);
  const line = [];
  for (const algo of algorithms) {
    const webHex = toHex(await subtle.digest(algo, bytes));
    // node:crypto 的等价写法：createHash(算法名).update(字节).digest('hex')
    // 注意算法名在这里要写成 'sha256' / 'sha384' / 'sha512'（Node 大小写不敏感，但习惯小写）
    const nodeHex = createHash(algo.replace('-', '').toLowerCase()).update(bytes).digest('hex');
    line.push(`${algo.replace('SHA-', '')}:${webHex === nodeHex ? '✓' : '✗'}`);
  }
  console.log(`    ${label.padEnd(14)} ${line.join('  ')}`);
}
console.log('  全部 ✓ 说明：输入编码、算法选择、输出转换都正确。');
console.log('  这也是本目录每一篇都会做的"自检"：能用两套实现对上，才敢说示例是对的。');

console.log('\n  补充：node:crypto 支持**流式**喂数据，Web Crypto 不支持；两者结果必须一致。');
const big = Buffer.alloc(300_000, 'x'); // 30 万字节
const streaming = createHash('sha256');
// 分 3 次喂进去 —— 这是处理大文件的标准姿势（内存占用恒定）
for (let offset = 0; offset < big.length; offset += 100_000) {
  streaming.update(big.subarray(offset, offset + 100_000));
}
const streamHex = streaming.digest('hex');
const oneShotHex = toHex(await subtle.digest('SHA-256', big));
console.log(`    流式（update×3）= ${streamHex.slice(0, 40)}…`);
console.log(`    一次性 digest    = ${oneShotHex.slice(0, 40)}…`);
console.log(`    两者一致？ ${streamHex === oneShotHex}  <- 输多大都不影响结果，这正是摘要的定义性质`);

// ---------------------------------------------------------------------------
console.log('\n--- 4. 雪崩效应：改一个字符，输出面目全非 ---');
// ---------------------------------------------------------------------------
// 好的摘要算法要求：输入的任意 1 位变化，输出中约一半的位会翻转。
// 这叫雪崩效应（avalanche effect），它保证了"输出看起来和输入毫无关系"。
/**
 * 逐位比较两份摘要，统计有多少个比特不同。
 * 注意要按**比特**比，不能按十六进制字符比：
 * 一个 hex 字符是 4 个比特，两个随机的 hex 字符有 15/16 的概率不同，
 * 按字符统计会得到 ~94% 这个假象，掩盖了"约 50% 的位翻转"这一真实规律。
 * @param {ArrayBuffer|Buffer} a
 * @param {ArrayBuffer|Buffer} b
 * @returns {{diffBits: number, totalBits: number}}
 */
function diffBits(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  let diff = 0;
  for (let i = 0; i < bufA.length; i += 1) {
    // 异或后"为 1 的位"就是两边不同的位，下面用经典的位计数技巧数 1 的个数
    let x = bufA[i] ^ bufB[i];
    while (x) {
      x &= x - 1; // 抹掉最低位的 1
      diff += 1;
    }
  }
  return { diffBits: diff, totalBits: bufA.length * 8 };
}

const base = '转账 100 元给 Alice';
const variants = [
  ['原文', base],
  ['改金额（100 -> 900）', '转账 900 元给 Alice'],
  ['改收款人（Alice -> alice）', '转账 100 元给 Alice'.replace('Alice', 'alice')],
  ['末尾多一个空格', `${base} `],
  ['只改一个 Unicode 字符的写法', '转账 100 元给 Alicе'], // 最后一个 e 是西里尔字母 е
];
console.log(`  基准原文："${base}"`);
const baseDigest = await subtle.digest('SHA-256', encoder.encode(base));
console.log(`  基准摘要：${toHex(baseDigest).slice(0, 32)}…\n`);
for (const [label, variant] of variants) {
  const digest = await subtle.digest('SHA-256', encoder.encode(variant));
  const { diffBits: diff, totalBits: total } = diffBits(baseDigest, digest);
  const percent = ((diff / total) * 100).toFixed(1);
  console.log(`    ${label.padEnd(24)} 摘要 ${toHex(digest).slice(0, 32)}…  不同比特位占比 ${percent}%`);
}
console.log('  差异占比普遍在 50% 上下 —— 这正是雪崩效应的表现（理想值是 50%，实测在 40%~60% 波动）。');
console.log('  实用价值：任何微小篡改都会让摘要"完全不同"，无法"局部修改使得摘要变化很小"。');
console.log('  反例：CRC32 这类校验和只抗传输错误，改一个字节时输出也只变一点点，');
console.log('        攻击者可以轻易构造出"改了内容但校验和不变"的数据 —— 它不能防篡改。');
console.log('  （"最后一行是西里尔字母 е 而不是拉丁 e"这种同形字攻击，摘要也会如实暴露。）');

// ---------------------------------------------------------------------------
console.log('\n--- 5. 为什么摘要"不可逆" ---');
// ---------------------------------------------------------------------------
console.log('  三个层面的原因（理解它们，比记住"不可逆"三个字有用得多）：');
console.log('  1) **信息被丢掉了**：SHA-256 的输出只有 256 位，而输入的字节数不设上限。');
console.log('     把 1 GB（2^33 位）映射到 256 位，必然有海量输入共享同一个输出，');
console.log('     从数学上讲"反过来"根本没有唯一答案。');
console.log('  2) **过程被设计成无法回退**：内部是一轮轮的位运算（异或、与、或、循环移位、加法）');
console.log('     与非线性查找表。正向计算便宜，反向求解要同时满足成千上万个耦合方程，');
console.log('     目前没有比"暴力枚举"更快的已知方法。');
console.log('  3) **验证却很容易**：不需要"解密"，只要猜一个输入算一次摘要比一比就知道对不对。');
console.log('     所以攻击者不是"解出"口令，而是"猜出"口令 —— 这就是彩虹表与暴力破解的立足点，');
console.log('     也是必须加盐、必须放慢速度的原因。');
console.log('');
console.log('  一句话记忆：**摘要不是"上锁"，而是"把东西彻底搅碎"。**');
console.log('    上锁（加密）：有钥匙就能还原 -> 可逆，对应 encrypt/decrypt。');
console.log('    搅碎（摘要）：谁也拼不回来，只能拿一份"原样的"来比 -> 不可逆，对应 digest。');

// 用"碰撞必然存在"做一个小小的感性演示：8 位截断的摘要只有 256 种可能
console.log('\n  感性演示：把 SHA-256 截断到只有 1 字节（256 种可能），碰撞立刻出现：');
const seen = new Map();
let firstCollision = null;
for (let i = 0; i < 200 && !firstCollision; i += 1) {
  const key = toHex(await subtle.digest('SHA-256', encoder.encode(`输入-${i}`))).slice(0, 2);
  if (seen.has(key)) {
    firstCollision = [seen.get(key), `输入-${i}`, key];
  } else {
    seen.set(key, `输入-${i}`);
  }
}
if (firstCollision) {
  const [a, b, key] = firstCollision;
  console.log(`    "${a}" 与 "${b}" 的 1 字节摘要都是 0x${key}（在尝试 ${seen.size + 1} 次后撞上）`);
  console.log('    可见"输出空间太小"必然碰撞 —— 这就是为什么短摘要（如 8 位/32 位）不能用于安全场景。');
  console.log('    反过来说，SHA-256 的输出空间是 2^256，暴力找碰撞的代价目前不可接受。');
} else {
  console.log('    本次 200 次尝试没有撞上（生日悖论下 200 次撞上 256 空间是大概率，但非必然）。');
}

// ---------------------------------------------------------------------------
console.log('\n--- 6. 密码不能用"裸摘要"存储：彩虹表演示 ---');
// ---------------------------------------------------------------------------
console.log('  假设某个网站这样存密码：stored = sha256(password)。');
console.log('  泄露数据库后，攻击者根本不需要"解密"，他有更快的办法：**预计算**。');
console.log('  下面这张表就是一张"迷你彩虹表"（真实彩虹表有几十亿条，几十 GB）：\n');

// 一份"最常用弱口令"清单（真实字典有上千万条）
const weakPasswords = [
  '123456', 'password', '123456789', 'qwerty', '111111',
  'abc123', 'iloveyou', 'admin', 'welcome', 'letmein',
  'monkey', 'dragon', 'sunshine', 'princess', 'football',
];
// 预计算：口令 -> 摘要（一次性成本，之后可以无限复用）
const rainbowTable = new Map();
for (const pwd of weakPasswords) {
  const hash = createHash('sha256').update(pwd).digest('hex');
  rainbowTable.set(hash, pwd);
}
console.log(`  已预计算 ${rainbowTable.size} 条"口令 -> 摘要"映射（真实攻击者用几十亿条）。`);

// 模拟"泄露的数据库"：3 个用户，密码都在弱口令表里
const leakedDb = [
  { user: 'alice', password: 'qwerty' },
  { user: 'bob', password: 'sunshine' },
  { user: 'carol', password: '足球' + '123' }, // 不在弱口令表里的"稍好一点"的口令
];
console.log('\n  模拟：数据库泄露（只暴露用户名和"裸摘要"）：');
const leakedHashes = leakedDb.map((u) => ({
  user: u.user,
  hash: createHash('sha256').update(u.password, 'utf8').digest('hex'),
}));
for (const row of leakedHashes) {
  console.log(`    ${row.user.padEnd(6)} sha256 = ${row.hash}`);
}

console.log('\n  攻击者拿彩虹表去查（0 次哈希计算，纯查表）：');
for (const row of leakedHashes) {
  const cracked = rainbowTable.get(row.hash);
  console.log(`    ${row.user.padEnd(6)} ${cracked ? `破解成功 -> "${cracked}"` : '未命中（这张表太小了）'}`);
}
console.log('  注意最后一位"未命中"不是因为安全 —— 只是我这张演示表只有 15 条。');
console.log('  真实彩虹表覆盖上亿条常见口令，而且攻击者可以把"常见口令 + 4 位数字后缀"');
console.log('  全都预计算出来 —— 这类口令几乎等于明文存储。\n');

console.log('  更快的路：GPU 暴力枚举。现代显卡每秒可以算几百亿次 SHA-256，');
console.log('  8 位以内的小写字母+数字口令，几个小时就能穷举完。');
console.log('  "加长口令"能提高成本，但用户不会配合 —— 所以要在**算法侧**解决问题。\n');

console.log('  两个必要的补救措施：');
console.log('    ① **加盐（salt）**：给每个用户生成一份**随机且唯一**的字节，');
console.log('       存 password_hash = sha256(salt || password)，把 salt 明文一起存进数据库。');
console.log('       盐不是秘密，它的作用是让"预计算"失效 —— 攻击者必须为每个用户重新算一遍。');
const saltA = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]); // 固定值，仅为演示
const saltB = new Uint8Array([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]); // 固定值，仅为演示
console.log('       （下面用固定盐保证输出可复现；**生产环境必须用 crypto.getRandomValues 生成随机盐**）');
const saltedPwd = 'qwerty';
// 拼接顺序（盐在前还是在后）不影响安全性，但整个系统必须统一，否则校验会失败
const hashWithSaltA = toHex(await subtle.digest('SHA-256', new Uint8Array([...saltA, ...encoder.encode(saltedPwd)])));
const hashWithSaltB = toHex(await subtle.digest('SHA-256', new Uint8Array([...saltB, ...encoder.encode(saltedPwd)])));
console.log(`       口令 "${saltedPwd}" + 盐A -> ${hashWithSaltA.slice(0, 24)}…`);
console.log(`       口令 "${saltedPwd}" + 盐B -> ${hashWithSaltB.slice(0, 24)}…`);
console.log(`       同一个口令，不同盐得到不同摘要？ ${hashWithSaltA !== hashWithSaltB}  <- 彩虹表直接失效`);
console.log(`       刚才那张彩虹表能查到吗？ ${rainbowTable.has(hashWithSaltA)}  <- 查不到`);
console.log(`       但攻击者能做到什么？为**每一个用户**单独跑一遍字典 —— 成本乘以用户数。`);
console.log('    ② **放慢速度（慢哈希 / KDF）**：用 PBKDF2、scrypt、argon2 这类算法，');
console.log('       把"一次哈希"变成"迭代十万次"，攻击者每猜一个口令的成本上升 10 万倍，');
console.log('       而正常登录只慢几十毫秒，用户感知不到。');

console.log('\n  所以口令存储的正确姿势是（细节见 05 篇）：');
const passwordAdvice = [
  ['算法', 'PBKDF2 / scrypt / argon2id —— 而不是裸 SHA-256'],
  ['盐', '每个用户一份随机盐（≥16 字节），与摘要一起存'],
  ['迭代次数', '调到"服务器上耗时 100ms 左右"再往上取整（PBKDF2 目前常取 60 万次以上）'],
  ['存储格式', '把算法、迭代次数、盐、摘要一起存成一条字符串（如 PHC 格式）'],
  ['升级策略', '登录成功时顺手把旧格式重算成新格式（渐进式升级）'],
  ['别做的事', '不要自己发明拼接顺序，不要用固定盐，不要直接加密口令（能解回来就有风险）'],
];
for (const [k, v] of passwordAdvice) console.log(`    ${k.padEnd(8)} ${v}`);

// ---------------------------------------------------------------------------
console.log('\n--- 7. 小结 ---');
// ---------------------------------------------------------------------------
console.log('  1) 摘要 = 把任意长度数据压成固定长度的"指纹"，三个特性：确定性、单向性、抗碰撞。');
console.log('  2) API：await subtle.digest("SHA-256", bytes) -> ArrayBuffer；');
console.log('     输入必须是字节（TextEncoder / Buffer），输出必须自己转 hex 才好看。');
console.log('  3) 与 node:crypto 交叉验证：subtle.digest 与 createHash(...).update(...).digest("hex")');
console.log('     对同一份字节必须给出相同结果（本文件已对 6 组输入 × 3 种算法全部核对 ✓），');
console.log('     并且与 NIST 公开测试向量一致。');
console.log('  4) 雪崩效应：改一个字符，摘要约一半的位不同。这是"能检测出篡改"的基础。');
console.log('  5) 不可逆：不是"很难算"那么含糊，而是"信息被丢弃 + 无法回退"，并且验证只需重算一次。');
console.log('  6) 裸摘要存口令 = 给彩虹表送菜；必须加随机盐 + 慢哈希（下一篇 03 讲 HMAC，');
console.log('     05 篇讲 PBKDF2 的完整实现）。');
