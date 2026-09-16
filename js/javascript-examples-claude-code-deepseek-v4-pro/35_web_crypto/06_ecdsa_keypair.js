/**
 * ============================================================================
 * 知识点：ECDSA 非对称签名 —— 密钥对生成、sign/verify、raw/pkcs8/spki/jwk 四种格式、JWT 签名思路
 * ============================================================================
 *
 * 【所属分类】35_web_crypto —— Web Crypto API
 * 【难度等级】高级
 * 【前置知识】35_web_crypto/02_digest_hashing.js、35_web_crypto/03_hmac_signing.js、35_web_crypto/04_aes_gcm_encryption.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    **非对称加密**（公钥密码）用一对数学上关联的密钥：
 *      · **私钥（private key）**：只有你自己有，用来**签名**或**解密**；
 *      · **公钥（public key）**：可以公开给任何人，用来**验签**或**加密给你的数据**。
 *    从公钥推不出私钥（这是整个体系的安全基石）。
 *    **ECDSA**（Elliptic Curve Digital Signature Algorithm，椭圆曲线数字签名算法）
 *    是目前最常用的签名算法，因为它**密钥短、签名短、速度快**：
 *      · P-256 曲线的私钥只有 32 字节、公钥 65 字节、签名 64 字节；
 *      · 安全性大致相当于 RSA-3072（而 RSA 要 384 字节的密钥、384 字节的签名）。
 *    "椭圆曲线"这个名词听起来吓人，你可以先把它当成一个数学黑盒：
 *    在这个曲线上定义了一种"点加法"，私钥是一个随机数 d，公钥是点 P = d×G
 *    （G 是曲线上的固定起点）。已知 d 求 P 很容易，已知 P 求 d 无解 ——
 *    这就是它单向的原因（离散对数问题）。
 *    ECDSA 签名过程（理解到"用一次性的随机数 k 参与运算"即可）：
 *      签名 = f(私钥 d, 消息摘要 z, 随机数 k) -> (r, s) 两个大整数
 *      验签 = 用公钥做一组运算，检查这个 (r, s) 是否成立
 *    因为 k 是随机的，**同一条消息每次签名都不同**，但都能验签通过。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) **JWT 签名**：`alg: ES256` 的 JWT 就是"base64url(header).base64url(payload)"再套一层
 *        ECDSA 签名。服务端（或任意第三方）用**公钥**验签，而**私钥只在一个地方**保管。
 *    (b) **软件更新 / 固件签名**：厂商用私钥签发布包，设备内置公钥验签。
 *        就算下载站的服务器被攻破，攻击者也造不出能通过验签的恶意包 —— 这正是 HMAC 做不到的
 *        （HMAC 要求设备里存着密钥，一旦设备被拆就能反推出来伪造签名）。
 *    (c) **TLS 证书 / 代码签名**：证书链的每一环都是"上一级私钥签名、下一级公钥验签"。
 *    (d) **区块链 / 钱包**：一笔交易就是"用私钥签名的转账指令"，全网用公钥验证它合法。
 *    (e) **一次性登录链接 / 授权码**：服务端用私钥签一个 `userId+过期时间`，
 *        校验方（可能是无状态的边缘节点）只需公钥即可验证，不必访问数据库或共享密钥。
 *    (f) **审计与不可否认**：签名可以公开验证，持有私钥的一方事后无法抵赖
 *        （对比 HMAC：双方共享密钥，谁都能造出"对方的"签名，无法归责）。
 *
 * 3. 核心语法要点
 *    (a) **生成密钥对**：
 *          const keyPair = await subtle.generateKey(
 *            { name: 'ECDSA', namedCurve: 'P-256' },  // 曲线
 *            true,                                     // extractable：需要导出就设 true
 *            ['sign', 'verify'],                       // **必须同时列两个**（私钥要 sign、公钥要 verify）
 *          );
 *        keyPair 是 CryptoKeyPair：`{ privateKey, publicKey }`。
 *        常用曲线：P-256（默认选择，兼容性最好）、P-384（更高强度）、P-521。
 *    (b) **签名 / 验签**：
 *          const sig = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, dataBytes);
 *          const ok  = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.publicKey, sig, dataBytes);
 *        注意：**哈希算法写在这里**（和 HMAC 的写法一样）；而曲线是**密钥的属性**。
 *        签名结果是 **raw 格式**：P-256 时是 64 字节 = `r(32) || s(32)`（业内也叫 IEEE P1363 格式）。
 *    (c) **四种导出/导入格式**（这是本篇最容易出错的地方）：
 *          · `'raw'`  ：**只支持公钥**（其实是椭圆曲线点），P-256 时为 65 字节
 *                       = `04 || x(32) || y(32)`（首字节 04 表示"未压缩点"）。
 *                       导入时必须显式给 namedCurve，否则抛 TypeError。
 *          · `'pkcs8'`：**私钥**的通用二进制格式（ASN.1 DER）。P-256 时约 138 字节，
 *                       可以序列化成 PEM 存文件、塞进 KMS。
 *          · `'spki'` ：**公钥**的通用二进制格式（ASN.1 DER）。P-256 时 91 字节，
 *                       也是 TLS 证书里装公钥的格式。
 *          · `'jwk'`  ：JSON 对象（JSON Web Key），人类可读，字段固定：
 *                       `kty`（密钥类型，EC）、`crv`（曲线）、`x`、`y`（公钥坐标）、
 *                       `d`（**私钥**的整数，只有私钥才有这个字段！）。
 *        配错组合会直接报错：raw 导不出私钥、pkcs8 导不出公钥 —— 这是好事，防止误用。
 *    (d) **签名不可"加密"**：ECDSA 只能签名/验签，不能加密数据。
 *        想用椭圆曲线加密，需要 ECDH（协商出共享密钥）+ 对称加密；
 *        想直接"用公钥加密"，用 RSA-OAEP。
 *
 * 4. 常见陷阱
 *    - **ECDSA 签名是随机的**：同一条消息签两次得到两个不同的签名（都有效）。
 *      所以**绝不能**用"签名是否相等"来判断消息是否相同（那要用摘要）。
 *      想得到确定性签名请用 Ed25519（它的签名是确定的，见本文件小节 7）。
 *    - **DER 与 P1363 两种签名编码**：Web Crypto 用 P1363（`r||s`），
 *      OpenSSL / `node:crypto` 默认用 DER（`30 45 02 21 …`）。两者**不能互换使用**，
 *      但都是合法的 ECDSA 签名 —— 跨端联调时"验签总是失败"十有八九是这个原因。
 *      本文件小节 5 会给出转换代码并演示。
 *    - **把私钥导出成 jwk / pkcs8 后泄漏**：`d` 字段就是私钥本体。
 *      生产环境的私钥应当 `extractable: false`，或干脆放在 KMS/HSM 里，永远不进 JS 内存。
 *    - **曲线不匹配**：用 P-256 的公钥验 P-384 的签名会失败（甚至导入时就报错）。
 *      协议里必须写死曲线名。
 *    - **`usages` 写错**：generateKey 时只写 `['sign']` 会导致生成的公钥不能 verify
 *      （报 InvalidAccessError）。ECDSA 的密钥对通常一次列出 `['sign', 'verify']`。
 *    - **JWT 的 alg 混淆攻击**：验证方如果"信任 header 里的 alg 字段"，
 *      攻击者就能把它改成 `none`（无签名）或 `HS256`（用公钥当 HMAC 密钥）来绕过验签。
 *      正确做法是**在服务端写死允许的算法**，而不是听客户端的。
 *    - **JWT 的 payload 不是加密的**：它只是 base64url 编码，任何人可读。
 *      敏感信息放 JWT 里等于公开。
 *    - **认证与授权混淆**：验签只能证明"这条消息由私钥持有者签发"，
 *      不能证明"签名里写的用户就是他本人"。业务规则仍需服务端校验。
 *    - **私钥长度 ≠ 安全强度**：P-256 私钥 32 字节比 AES-256 的 32 字节密钥"弱一些"，
 *      因为椭圆曲线上的攻击有更快的算法（预期约 128 位安全强度）。
 *      业界共识：P-256 足够，高价值场景用 P-384。
 *    - **忘了哈希**：`{ name: 'ECDSA', hash: 'SHA-256' }` 里的 hash 不可省；
 *      如果数据很长，算法会先算摘要再签名（这一步由库完成，不用你手动做）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 35_web_crypto/06_ecdsa_keypair.js
 *
 * 【预期输出】
 *   1) 生成 P-256 密钥对，打印公钥/私钥的类型与算法属性（不打印私钥材料）；
 *   2) 签名与验签，演示"同消息两次签名不同、但都能验过"；
 *   3) 四种格式的导出/导入往返（含 raw 私钥 / pkcs8 公钥 的报错演示），
 *      jwk 只打印字段结构而不打印 d 的值；
 *   4) 与 node:crypto 双向交叉验证，并用 DER <-> P1363 转换演示编码差异；
 *   5) 手搓一个迷你 JWT（ES256），演示签发、验签、篡改 payload 与 alg 混淆攻击；
 *   6) 与 Ed25519 的简短对比。
 *   全程退出码 0，不访问网络。
 * ============================================================================
 */

import { createPrivateKey, createPublicKey, createSign, createVerify, sign as nodeSign, verify as nodeVerify } from 'node:crypto';

const subtle = globalThis.crypto.subtle;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** 把 BufferSource 转成十六进制字符串。 */
const toHex = (bytes) => Buffer.from(bytes).toString('hex');

/** base64url 编码（JWT 用的就是这种编码，不含 + / =，可直接放进 URL）。 */
const toBase64Url = (bytes) => Buffer.from(bytes).toString('base64url');

// ===========================================================================
console.log('--- 1. 生成 ECDSA 密钥对 ---');
// ===========================================================================
const keyPair = await subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' },
  true, // extractable：本篇要演示导出，所以设 true；生产环境私钥建议 false
  ['sign', 'verify'], // 私钥用 sign、公钥用 verify，两个都要列出来
);
console.log('  generateKey({ name: "ECDSA", namedCurve: "P-256" }, extractable, ["sign","verify"])');
console.log(`    keyPair 是一个 CryptoKeyPair：{ privateKey, publicKey }`);
console.log(`    私钥：type=${keyPair.privateKey.type}  algorithm=${keyPair.privateKey.algorithm.name}/${keyPair.privateKey.algorithm.namedCurve}`);
console.log(`          usages=[${keyPair.privateKey.usages.join(', ')}]  extractable=${keyPair.privateKey.extractable}`);
console.log(`    公钥：type=${keyPair.publicKey.type}  algorithm=${keyPair.publicKey.algorithm.name}/${keyPair.publicKey.algorithm.namedCurve}`);
console.log(`          usages=[${keyPair.publicKey.usages.join(', ')}]  extractable=${keyPair.publicKey.extractable}`);
console.log('    注意 type：私钥是 "private"、公钥是 "public"（对称密钥才是 "secret"）。');
console.log('    这里不打印任何密钥材料：私钥是随机的，且**永远不该出现在日志里**。');

console.log('\n  密钥短得惊人（这正是椭圆曲线的优势）：');
const spkiForSize = new Uint8Array(await subtle.exportKey('spki', keyPair.publicKey));
const rawPubForSize = new Uint8Array(await subtle.exportKey('raw', keyPair.publicKey));
const pkcs8ForSize = new Uint8Array(await subtle.exportKey('pkcs8', keyPair.privateKey));
console.log(`    公钥 raw   ：${rawPubForSize.byteLength} 字节（只是一个曲线上的点）`);
console.log(`    公钥 spki  ：${spkiForSize.byteLength} 字节（带算法标识的 DER 包装）`);
console.log(`    私钥 pkcs8 ：${pkcs8ForSize.byteLength} 字节（含曲线参数与私钥整数）`);
console.log(`    签名       ：64 字节（r、s 各 32 字节）`);
console.log(`    对比 RSA-2048：公钥约 294 字节、签名固定 256 字节 —— 差了一个数量级。`);
console.log(`    安全强度对比：P-256 ≈ RSA-3072（约 128 位安全强度）。`);

console.log('\n  曲线必须是这三种之一（其它名字会报错）：');
for (const curve of ['P-256', 'P-384', 'P-521', 'P-192']) {
  try {
    const kp = await subtle.generateKey({ name: 'ECDSA', namedCurve: curve }, false, ['sign', 'verify']);
    const rawPub = new Uint8Array(await subtle.exportKey('raw', kp.publicKey).catch(() => new ArrayBuffer(0)));
    console.log(`    ${curve.padEnd(6)} ✓ 支持（公钥 raw 为 ${rawPub.byteLength} 字节）`);
  } catch (err) {
    console.log(`    ${curve.padEnd(6)} ✗ ${err.name}: ${err.message}`);
  }
}
console.log('    P-384 的公钥是 97 字节、签名 96 字节；P-521 是 133 / 132 字节。');

// ===========================================================================
console.log('\n--- 2. 签名与验签 ---');
// ===========================================================================
const message = 'payment order A1001 amount=1999 currency=CNY';
const messageBytes = encoder.encode(message);
console.log(`  待签消息："${message}"`);

const signature = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, messageBytes);
const sigBytes = new Uint8Array(signature);
console.log(`  subtle.sign({name:'ECDSA', hash:'SHA-256'}, 私钥, 消息) ->`);
console.log(`    返回类型 ${signature.constructor.name}，长度 ${signature.byteLength} 字节`);
console.log(`    结构：前 32 字节是 r，后 32 字节是 s（两个大整数，各 ${sigBytes.byteLength / 2} 字节）`);
console.log(`    这里的**不打印签名值**：ECDSA 每次签名都不同（见下面），打印出来输出就无法复现；`);
console.log(`    但 r 与 s 的长度是固定的 —— 这也是"签名长度可预测"的原因`);
console.log(`    注意这是 **raw（IEEE P1363）** 格式，不是 DER —— 见小节 5 的详细对比。`);

console.log(`\n  验签（用公钥）：`);
console.log(`    原始消息        -> ${await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.publicKey, signature, messageBytes)}`);
const tampered = encoder.encode(`${message}0`); // 末尾多一个字符
console.log(`    消息末尾加个"0" -> ${await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.publicKey, signature, tampered)}`);

console.log('\n  ECDSA 的一个关键特性：**签名是随机的**（每次都不一样）。');
const sig1 = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, messageBytes));
const sig2 = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, messageBytes));
const sig3 = new Uint8Array(await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.privateKey, messageBytes));
console.log(`    连续签 3 次，三次签名互不相同？ ${new Set([toHex(sig1), toHex(sig2), toHex(sig3)]).size === 3}`);
console.log(`    但每一个都能验过？ ${(await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.publicKey, sig1, messageBytes))
  && (await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.publicKey, sig2, messageBytes))
  && (await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.publicKey, sig3, messageBytes))}`);
console.log('    原因：签名时用了一个一次性随机数 k，每次的 k 都不同。');
console.log('    **推论一**：不能用"签名相同"判断消息相同（要比就比摘要）。');
console.log('    **推论二**：这不影响验签 —— 验签只检查数学关系，不比对固定值。');
console.log('    **推论三**（历史教训）：如果 k 被复用或可预测（比如用弱随机源），');
console.log('      攻击者能从两个签名里解出私钥 —— 索尼 PS3 的签名密钥就是这样被破的。');
console.log('      所以 ECDSA 的随机源**必须**是密码学安全的（crypto.getRandomValues 那一类）。');

console.log('\n  公钥换掉、私钥换掉会怎样（两类常见的集成 bug）：');
const otherPair = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
console.log(`    用别人的公钥验签 -> ${await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, otherPair.publicKey, signature, messageBytes)}`);
console.log(`    用别的私钥签名后再用原公钥验 -> ${await subtle.verify(
  { name: 'ECDSA', hash: 'SHA-256' },
  keyPair.publicKey,
  await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, otherPair.privateKey, messageBytes),
  messageBytes,
)}`);

// ===========================================================================
console.log('\n--- 3. 四种导出格式：raw / pkcs8 / spki / jwk ---');
// ===========================================================================
console.log('  先看清"哪种格式配哪种密钥"（配错会直接报错，这是刻意的保护）：');
const formatMatrix = [
  ['raw', 'public', '椭圆曲线点本身：04 || x || y'],
  ['raw', 'private', '不支持！raw 不包含曲线参数，无法表达私钥'],
  ['pkcs8', 'private', '通用私钥容器（ASN.1 DER），可存 PEM / 放 KMS'],
  ['pkcs8', 'public', '不支持！公钥请用 spki'],
  ['spki', 'public', '通用公钥容器（ASN.1 DER），TLS 证书里装的就是它'],
  ['spki', 'private', '不支持！私钥请用 pkcs8'],
  ['jwk', 'public', 'JSON 对象：kty/crv/x/y'],
  ['jwk', 'private', 'JSON 对象：kty/crv/x/y/**d**'],
];
for (const [format, kind, note] of formatMatrix) {
  let result;
  try {
    const exported = await subtle.exportKey(format, kind === 'public' ? keyPair.publicKey : keyPair.privateKey);
    result = exported instanceof ArrayBuffer
      ? `✓ ${exported.byteLength} 字节`
      : `✓ JWK（${Object.keys(exported).join(', ')}）`;
  } catch (err) {
    result = `✗ ${err.name}`;
  }
  console.log(`    ${format.padEnd(6)} ${kind.padEnd(8)} ${result.padEnd(26)} ${note}`);
}

console.log('\n  ① raw：只是"曲线上一个点"，导入时必须补上曲线名');
const rawPub = new Uint8Array(await subtle.exportKey('raw', keyPair.publicKey));
console.log(`     前 1 字节是 0x04（表示"未压缩点"）：${rawPub[0] === 0x04}`);
console.log(`     总长度 65 字节 = 1 + 32 + 32（标记 + x 坐标 + y 坐标）`);
console.log(`     x 坐标占 ${rawPub.subarray(1, 33).byteLength} 字节，y 坐标占 ${rawPub.subarray(33, 65).byteLength} 字节`);
console.log(`     坐标值本身是随机的（每次都不同），这里只验证结构而不打印数值。`);
console.log(`     想导出公钥给别人用时，用 raw/spki/jwk 都可以 —— 公钥本来就不需要保密。`);
try {
  await subtle.importKey('raw', rawPub, { name: 'ECDSA' }, true, ['verify']);
  console.log('     不带 namedCurve 导入：居然成功了？');
} catch (err) {
  console.log(`     不带 namedCurve 导入：✗ ${err.name}`);
  console.log(`       ${String(err.message).slice(0, 90)}…`);
  console.log('       原因：65 个字节里没有曲线信息，算法不知道这是 P-256 还是 P-384 上的点。');
}
const rawImported = await subtle.importKey('raw', rawPub, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
console.log(`     带上 namedCurve 导入后，验签仍然通过？ ${await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, rawImported, signature, messageBytes)}`);
console.log('     raw 格式的用途：链上地址、二维码里的公钥、体积敏感的场景。');

console.log('\n  ② pkcs8 / spki：可以序列化成 PEM，与 OpenSSL、KMS、证书体系互通');
const pkcs8 = new Uint8Array(await subtle.exportKey('pkcs8', keyPair.privateKey));
const spki = new Uint8Array(await subtle.exportKey('spki', keyPair.publicKey));
/** 把 DER 字节转成 PEM 文本（每行 64 个 base64 字符，头尾加标记）。 */
function derToPem(der, label) {
  const base64 = Buffer.from(der).toString('base64');
  const lines = base64.match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}
console.log(`     pkcs8 开头 8 字节：${toHex(pkcs8.subarray(0, 8))}（0x30 = ASN.1 SEQUENCE）`);
console.log(`     spki  开头 8 字节：${toHex(spki.subarray(0, 8))}`);
console.log('     PEM 形式（内容随密钥不同，这里只展示"外壳"）：');
const pemLines = derToPem(spki, 'PUBLIC KEY').split('\n');
console.log(`       ${pemLines[0]}`);
console.log(`       <base64 编码的 DER 内容，共 ${pemLines.length - 2} 行，每行 64 个 base64 字符>`);
console.log(`       ${pemLines[pemLines.length - 1]}`);
// 往返（round-trip）验证：导出再导入，签名/验签仍然可用
const pkcs8Key = await subtle.importKey('pkcs8', pkcs8, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
const spkiKey = await subtle.importKey('spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
const roundTripSig = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, pkcs8Key, messageBytes);
console.log(`     pkcs8 导入后签名、spki 导入后验签 -> ${await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, spkiKey, roundTripSig, messageBytes)}`);
console.log('     这一步很重要：**导出再导入必须还能用**，否则你的密钥持久化方案就是坏的。');

console.log('\n  ③ jwk：JSON 对象（只打印字段结构，不打印私钥整数）');
const jwkPublic = await subtle.exportKey('jwk', keyPair.publicKey);
const jwkPrivate = await subtle.exportKey('jwk', keyPair.privateKey);
console.log(`     公钥 JWK 的字段名：[${Object.keys(jwkPublic).join(', ')}]`);
console.log(`       （字段值都是公钥材料，这里只打印结构 —— 数值随密钥不同而不同）`);
console.log(`       kty=${jwkPublic.kty}（密钥类型 EC）  crv=${jwkPublic.crv}（曲线）`);
console.log(`       x 长度=${jwkPublic.x.length} 字符  y 长度=${jwkPublic.y.length} 字符（base64url 编码的坐标，各 32 字节）`);
console.log(`     私钥 JWK 字段名：[${Object.keys(jwkPrivate).join(', ')}]`);
console.log(`       比公钥多出的字段：${Object.keys(jwkPrivate).filter((k) => !(k in jwkPublic)).join(', ')} —— **这就是私钥本体**`);
console.log('     安全提醒：JWK 是明文 JSON，一行日志、一个错误上报就可能把私钥泄漏出去。');
console.log('               导出私钥要么别做，要么写进受控的密钥文件（600 权限）或 KMS。');
const jwkImported = await subtle.importKey('jwk', jwkPublic, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
console.log(`     用 JWK 导入公钥后验签 -> ${await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, jwkImported, signature, messageBytes)}`);
console.log('     JWK 的用途：JWKS 端点（GET /.well-known/jwks.json）就是一组公钥 JWK，');
console.log('                让所有服务能自动拉取并轮换验签公钥 —— 这是 JWT 生态的标准做法。');

// ===========================================================================
console.log('\n--- 4. 与 node:crypto 交叉验证（双向）---');
// ===========================================================================
// 关键点：两套实现的**签名编码不同**。
//   Web Crypto：P1363（r || s，固定长度）
//   node:crypto（默认，底层 OpenSSL）：DER（ASN.1 SEQUENCE 包着两个 INTEGER）
// node:crypto 提供了 dsaEncoding: 'ieee-p1363' 选项，可以切到 Web Crypto 的格式。
const nodePublicKey = createPublicKey({ key: Buffer.from(spki), format: 'der', type: 'spki' });
const nodePrivateKey = createPrivateKey({ key: Buffer.from(pkcs8), format: 'der', type: 'pkcs8' });
console.log('  先把 subtle 导出的 spki / pkcs8 交给 node:crypto 解析成 KeyObject：');
console.log(`    node 能解析公钥吗？ ${nodePublicKey.type === 'public'}（asymmetricKeyType=${nodePublicKey.asymmetricKeyType}）`);
console.log(`    node 能解析私钥吗？ ${nodePrivateKey.type === 'private'}`);

console.log('\n  方向 A：subtle 签名 -> node 验签（用 dsaEncoding 指定 P1363）');
const nodeAccepted = nodeVerify('sha256', Buffer.from(messageBytes), { key: nodePublicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(signature));
console.log(`    node.crypto.verify(..., { dsaEncoding: 'ieee-p1363' }) -> ${nodeAccepted}`);
const nodeAcceptedDer = (() => {
  try {
    return nodeVerify('sha256', Buffer.from(messageBytes), nodePublicKey, Buffer.from(signature));
  } catch (err) {
    return `抛错 ${err.code ?? err.name}`;
  }
})();
console.log(`    node.crypto.verify(..., 默认 DER 解析) -> ${nodeAcceptedDer}  <- 同一份签名，换个编码解释就失败/抛错`);

console.log('\n  方向 B：node 签名（P1363）-> subtle 验签');
const nodeP1363Sig = nodeSign('sha256', Buffer.from(messageBytes), { key: nodePrivateKey, dsaEncoding: 'ieee-p1363' });
console.log(`    node 签名长度 ${nodeP1363Sig.length} 字节（P-256 的 P1363 是 64 字节）`);
console.log(`    subtle.verify 接受吗？ ${await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.publicKey, nodeP1363Sig, messageBytes)}`);

console.log('\n  方向 C：node 的**默认 DER** 签名直接丢给 subtle 会怎样？');
const nodeDerSig = nodeSign('sha256', Buffer.from(messageBytes), nodePrivateKey);
console.log(`    DER 签名长度 ${nodeDerSig.length} 字节，开头两字节 ${toHex(nodeDerSig.subarray(0, 2))}（0x30 0x2x = ASN.1 SEQUENCE）`);
console.log(`    subtle.verify(DER 签名) -> ${await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.publicKey, nodeDerSig, messageBytes)}`);
console.log('    注意它**不抛错，只返回 false** —— 这就是为什么"验签失败"经常被误判成"密钥不对"。');
console.log('    实际上 99% 的情况是：**签名编码格式不一致**。');

// ---------------------------------------------------------------------------
console.log('\n--- 5. 手工做 DER <-> P1363 转换，彻底搞懂这个坑 ---');
// ---------------------------------------------------------------------------
/**
 * 把 DER 编码的 ECDSA 签名（30 len 02 len r 02 len s）转成 P1363（r || s）。
 * ASN.1 的 INTEGER 是**大端 + 有符号**编码：
 *   · 最高位为 1 时会补一个 0x00 前缀，表示这是正数（所以长度可能是 33 而不是 32）；
 *   · 数值本身也可能带前导 0x00 —— 转换时要剥掉再左补零对齐。
 * @param {Buffer|Uint8Array} der DER 字节
 * @param {number} partLength 每个分量的字节数（P-256 是 32，P-384 是 48，P-521 是 66）
 * @returns {Buffer} P1363 字节
 */
function derToP1363(der, partLength = 32) {
  const buf = Buffer.from(der);
  let offset = 0;
  if (buf[offset] !== 0x30) throw new Error('不是 DER SEQUENCE');
  offset += 1;
  // 读长度：最高位为 1 表示"后续 n 个字节才是长度"（长形式编码）
  let seqLen = buf[offset];
  offset += 1;
  if (seqLen & 0x80) {
    const n = seqLen & 0x7f;
    seqLen = 0;
    for (let i = 0; i < n; i += 1) {
      seqLen = (seqLen << 8) | buf[offset];
      offset += 1;
    }
  }
  /** 读一个 ASN.1 INTEGER，返回去掉前导零后的字节。 */
  const readInteger = () => {
    if (buf[offset] !== 0x02) throw new Error('不是 DER INTEGER');
    offset += 1;
    let len = buf[offset];
    offset += 1;
    if (len & 0x80) {
      const n = len & 0x7f;
      len = 0;
      for (let i = 0; i < n; i += 1) {
        len = (len << 8) | buf[offset];
        offset += 1;
      }
    }
    let value = buf.subarray(offset, offset + len);
    offset += len;
    // 剥掉前导 0x00（可能不止一个）
    while (value.length > 1 && value[0] === 0x00) value = value.subarray(1);
    return value;
  };
  /** 把变长整数右对齐放进固定长度缓冲区，左边补零。 */
  const padLeft = (value) => {
    if (value.length > partLength) throw new Error(`分量长度 ${value.length} 超过 ${partLength} 字节`);
    const out = Buffer.alloc(partLength);
    Buffer.from(value).copy(out, partLength - value.length);
    return out;
  };
  const r = padLeft(readInteger());
  const s = padLeft(readInteger());
  return Buffer.concat([r, s]);
}

/**
 * 把 P1363 签名（r || s）转成 DER 编码。
 * @param {Buffer|Uint8Array} p1363 P1363 字节
 * @param {number} partLength 每个分量的字节数
 * @returns {Buffer} DER 字节
 */
function p1363ToDer(p1363, partLength = 32) {
  const buf = Buffer.from(p1363);
  if (buf.length !== partLength * 2) throw new Error(`P1363 签名应为 ${partLength * 2} 字节，实际 ${buf.length}`);
  /** 把一个定长分量编码成 ASN.1 INTEGER（去前导零；最高位为 1 则补 0x00 表示正数）。 */
  const encodeInteger = (value) => {
    let v = value;
    while (v.length > 1 && v[0] === 0x00) v = v.subarray(1);
    if (v[0] & 0x80) v = Buffer.concat([Buffer.from([0x00]), v]);
    return Buffer.concat([Buffer.from([0x02, v.length]), v]);
  };
  const body = Buffer.concat([
    encodeInteger(buf.subarray(0, partLength)),
    encodeInteger(buf.subarray(partLength)),
  ]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

console.log('  用 node 生成的 DER 签名做一次转换：');
const converted = derToP1363(nodeDerSig, 32);
console.log(`    DER 长度 ${nodeDerSig.length} -> P1363 长度 ${converted.length}`);
console.log(`    转换后 subtle 能验过吗？ ${await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keyPair.publicKey, converted, messageBytes)}`);
console.log('  反过来，把 subtle 的 P1363 签名转成 DER 交给 node 验：');
const backToDer = p1363ToDer(signature, 32);
console.log(`    P1363 长度 64 -> DER 长度 ${backToDer.length}，开头 ${toHex(backToDer.subarray(0, 2))}`);
console.log(`    转换后 node.crypto.verify 能验过吗？ ${nodeVerify('sha256', Buffer.from(messageBytes), nodePublicKey, backToDer)}`);
console.log('  往返一致性：DER -> P1363 -> DER 是否还原成原字节？', toHex(p1363ToDer(derToP1363(nodeDerSig, 32), 32)) === toHex(nodeDerSig));
console.log('  记住这个经验：**跨语言做 ECDSA 联调，第一件事就是问"签名用什么编码"**。');
console.log('  （Ed25519 没有这个问题 —— 它只有一种签名编码，见本文件最后一节。）');

// ===========================================================================
console.log('\n--- 6. 实战：手搓一个迷你 JWT（ES256）---');
// ===========================================================================
// JWT = base64url(header) + "." + base64url(payload) + "." + base64url(signature)
// 签名对象是"前两段拼起来的字符串"，用的是 ECDSA-SHA256（alg 标为 ES256）。
const jwtHeader = { alg: 'ES256', typ: 'JWT' };
const jwtPayload = { sub: 'user-1001', name: 'Alice', role: 'admin', iat: 1_700_000_000, exp: 1_700_003_600 };

/**
 * 用私钥签发一个 JWT。
 * @param {CryptoKey} privateKey ECDSA P-256 私钥
 * @param {object} header JWT 头部
 * @param {object} payload JWT 载荷
 * @returns {Promise<{ token: string, signingInput: string }>}
 */
async function signJwt(privateKey, header, payload) {
  const h = toBase64Url(encoder.encode(JSON.stringify(header)));
  const p = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${h}.${p}`; // **签名的是这个字符串，不是 JSON**
  const sig = await subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, encoder.encode(signingInput));
  const token = `${signingInput}.${toBase64Url(sig)}`;
  return { token, signingInput };
}

/**
 * 用公钥校验一个 JWT（并把服务端写死的算法作为参数传入，而不是信任 header 里的 alg）。
 * @param {CryptoKey} publicKey ECDSA P-256 公钥
 * @param {string} token JWT 字符串
 * @param {number} nowSeconds 当前时间（秒），用于检查 exp
 * @param {string[]} allowedAlgs 服务端允许的算法白名单
 * @returns {Promise<{ ok: boolean, reason: string, payload?: object }>}
 */
async function verifyJwt(publicKey, token, nowSeconds, allowedAlgs = ['ES256']) {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'token 结构不合法（应为三段）' };
  const [h, p, s] = parts;
  let header;
  try {
    header = JSON.parse(decoder.decode(Buffer.from(h, 'base64url')));
  } catch {
    return { ok: false, reason: 'header 不是合法 JSON' };
  }
  // 关键安全检查：算法白名单。绝不能因为 header 说 alg 是什么就用什么。
  if (!allowedAlgs.includes(header.alg)) {
    return { ok: false, reason: `算法 ${header.alg} 不在白名单 [${allowedAlgs.join(', ')}] 内` };
  }
  const sigBytes = Buffer.from(s, 'base64url');
  if (sigBytes.length !== 64) return { ok: false, reason: `签名长度 ${sigBytes.length} 不是 64 字节` };
  const ok = await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, sigBytes, encoder.encode(`${h}.${p}`));
  if (!ok) return { ok: false, reason: '签名验证失败（内容被改或签名不对）' };
  let payload;
  try {
    payload = JSON.parse(decoder.decode(Buffer.from(p, 'base64url')));
  } catch {
    return { ok: false, reason: 'payload 不是合法 JSON' };
  }
  if (typeof payload.exp === 'number' && nowSeconds > payload.exp) {
    return { ok: false, reason: 'token 已过期（exp 检查）' };
  }
  return { ok: true, reason: '验证通过', payload };
}

const issued = await signJwt(keyPair.privateKey, jwtHeader, jwtPayload);
const nowSeconds = 1_700_000_100;
console.log(`  ① 签发结果：`);
console.log(`     header  : ${toBase64Url(encoder.encode(JSON.stringify(jwtHeader)))}`);
console.log(`     payload : ${toBase64Url(encoder.encode(JSON.stringify(jwtPayload)))}`);
console.log(`     签名输入（前两段拼接）：${issued.signingInput}`);
console.log(`     完整 token（签名每次不同，这里省略不打印）：`);
console.log(`       ${issued.signingInput}.<base64url(64 字节签名)>`);
console.log(`     token 的三段长度：${issued.token.split('.').map((x) => x.length).join(' / ')}`);

console.log('\n  ② 各种验证场景：');
const [tamperedPayloadToken, forgedRoleToken] = (() => {
  // 篡改 payload：把 name 改掉（不重签）
  const p1 = toBase64Url(encoder.encode(JSON.stringify({ ...jwtPayload, name: 'Eve' })));
  const [h1] = issued.token.split('.');
  // 伪造 payload：把自己改成超级管理员
  const p2 = toBase64Url(encoder.encode(JSON.stringify({ ...jwtPayload, role: 'superadmin' })));
  return [`${h1}.${p1}.${issued.token.split('.')[2]}`, `${h1}.${p2}.${issued.token.split('.')[2]}`];
})();
// 换一个算法名（模拟 alg 混淆攻击）：把 header 改成 "none"
const noneAlgToken = (() => {
  const h = toBase64Url(encoder.encode(JSON.stringify({ alg: 'none', typ: 'JWT' })));
  const [, p, s] = issued.token.split('.');
  const newInput = `${h}.${p}`;
  // 攻击者把 header 换成 alg=none（想骗服务端"这是无签名 token"），签名段则原样留着
  return `${newInput}.${s}`;
})();

const jwtCases = [
  ['正常 token', issued.token, nowSeconds],
  ['篡改 payload（name 改成 Eve）', tamperedPayloadToken, nowSeconds],
  ['伪造 payload（role 改成 superadmin）', forgedRoleToken, nowSeconds],
  ['alg 改成 none（alg 混淆攻击）', noneAlgToken, nowSeconds],
  ['token 已过期（1 小时后再验）', issued.token, nowSeconds + 7200],
  ['用另一个密钥对签发的 token', await (async () => (await signJwt(otherPair.privateKey, jwtHeader, jwtPayload)).token)(), nowSeconds],
  ['把签名段截短', `${issued.signingInput}.AAAA`, nowSeconds],
];
for (const [label, token, now] of jwtCases) {
  const result = await verifyJwt(keyPair.publicKey, token, now);
  console.log(`     ${label.padEnd(28)} ok=${String(result.ok).padEnd(6)} ${result.reason}`);
}
console.log('\n  ③ 别忘了 decode 一下 payload 看看（JWT 是**可读的**，不是加密的）：');
const decodedPayload = JSON.parse(decoder.decode(Buffer.from(issued.token.split('.')[1], 'base64url')));
console.log(`     ${JSON.stringify(decodedPayload)}`);
console.log('     任何人都能解开这一段 —— 所以**绝对不要把密码、身份证、密钥放进 JWT**。');
console.log('     JWT 只保证"内容没被改"，不保证"内容看不见"。');

console.log('\n  ④ 这段代码想传达的五个生产要点：');
const jwtLessons = [
  ['算法白名单', 'verify 时用服务端写死的 allowedAlgs，而不是信任 header.alg（防 none/HS256 混淆）'],
  ['签名覆盖前两段原文', '签名对象是字符串 `${h}.${p}`，不是解析后的 JSON —— 否则键顺序一变签名就废了'],
  ['永远校验 exp', '签名有效不等于 token 有效；还要看过期时间、签发者、受众（iss/aud）'],
  ['公钥可以公开', 'JWKS 端点把公钥发出去，任何服务都能验签；私钥只在签发服务里（最好在 KMS 里）'],
  ['签名 ≠ 加密', 'payload 明文可读；要保密就再套一层 JWE/对称加密'],
];
for (const [k, v] of jwtLessons) console.log(`     ${k.padEnd(20)} ${v}`);

// ===========================================================================
console.log('\n--- 7. 与 Ed25519 的对比：新一代签名算法 ---');
// ===========================================================================
const edPair = await subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
const edMessage = encoder.encode(message);
const edSig1 = new Uint8Array(await subtle.sign({ name: 'Ed25519' }, edPair.privateKey, edMessage));
const edSig2 = new Uint8Array(await subtle.sign({ name: 'Ed25519' }, edPair.privateKey, edMessage));
const edSig3 = new Uint8Array(await subtle.sign({ name: 'Ed25519' }, edPair.privateKey, edMessage));
console.log('  Ed25519（Edwards 曲线数字签名算法，是 EdDSA 的一种）：');
console.log(`    签名长度：${edSig1.byteLength} 字节（P-256 是 64 字节，差不多）`);
console.log(`    公钥 raw：${new Uint8Array(await subtle.exportKey('raw', edPair.publicKey)).byteLength} 字节`);
console.log(`    同消息连签 3 次结果相同？ ${toHex(edSig1) === toHex(edSig2) && toHex(edSig2) === toHex(edSig3)}  <- **确定性签名**`);
console.log(`    验签通过？ ${await subtle.verify({ name: 'Ed25519' }, edPair.publicKey, edSig1, edMessage)}`);
console.log('    好处：① 签名确定（可复现、便于做缓存与去重）；');
console.log('          ② 只有一种签名编码（没有 DER/P1363 的坑）；');
console.log('          ③ 对"随机数质量差"更鲁棒（不用每次生成随机 k，没有 PS3 式的风险）。');
console.log('    代价：生态较新，某些老系统/硬件不支持；互操作时先确认对方支持 Ed25519。');

console.log('\n  ECDSA 与 Ed25519 的选择建议：');
const algoChoice = [
  ['需要最大兼容性（TLS、证书、JWT 库、智能卡）', 'ECDSA P-256'],
  ['新设计的协议、双方都能升级', 'Ed25519（更简单、更不易用错）'],
  ['极高安全等级', 'ECDSA P-384 / Ed448'],
  ['需要"用公钥加密数据"', '都不是 —— 用 RSA-OAEP 或 ECDH + AES-GCM'],
];
for (const [scene, choice] of algoChoice) console.log(`    ${scene.padEnd(38)} -> ${choice}`);

// ===========================================================================
console.log('\n--- 8. 小结 ---');
// ===========================================================================
const summary = [
  '1) 非对称 = 私钥签、公钥验。解决了 HMAC 的根本局限：验证方不需要持有密钥。',
  '2) 生成：generateKey({name:"ECDSA", namedCurve:"P-256"}, extractable, ["sign","verify"])；',
  '   曲线是密钥属性，哈希算法写在 sign/verify 的参数里。',
  '3) sign/verify 与 HMAC 用法同构，只是密钥从"对称密钥"换成"私钥/公钥"。',
  '4) **签名是随机的**：同消息两次签名不同但都有效；不要用签名做"内容比对"。',
  '5) 四种格式：raw（仅公钥，65 字节点，导入必须给 namedCurve）、pkcs8（私钥，可 PEM）、',
  '   spki（公钥，可 PEM，证书同款）、jwk（JSON，私钥多一个 d 字段 = 私钥本体）。',
  '6) 交叉验证通过：subtle 的 P1363 签名与 node:crypto 的 dsaEncoding:"ieee-p1363" 互通；',
  '   node 默认的 DER 签名交给 subtle 只会返回 false —— 本文件给了双向转换代码并验证通过。',
  '7) JWT（ES256）= base64url(header) + "." + base64url(payload) + "." + 签名；',
  '   必须做算法白名单、必须校验 exp、payload 是明文不能放敏感数据。',
  '8) 新协议可优先考虑 Ed25519：确定性签名、无编码歧义、更不易用错。',
  '9) 最后一条也是最重要的一条：**私钥是整套体系里唯一的秘密**。',
  '   它不该出现在日志里、不该提交进仓库、能放 KMS/HSM 就别放在应用内存里。',
];
for (const line of summary) console.log(`  ${line}`);
