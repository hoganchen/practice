/**
 * ============================================================================
 * 知识点：AES-GCM 对称加密 —— 密钥与 IV、认证标签、篡改检测，以及为什么优于 CBC
 * ============================================================================
 *
 * 【所属分类】35_web_crypto —— Web Crypto API
 * 【难度等级】进阶
 * 【前置知识】35_web_crypto/02_digest_hashing.js、35_web_crypto/03_hmac_signing.js、24_typed_arrays（字节数组）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    **对称加密**：加密和解密用**同一把密钥**（对比 06 篇的非对称加密）。
 *    **AES**（Advanced Encryption Standard）是当今唯一被广泛认可的对称加密算法，
 *    密钥长度 128 / 192 / 256 位。它本身是**分组密码**：一次只能处理 16 字节，
 *    所以要把数据切开，按某种"模式（mode）"逐块处理 —— AES-GCM 就是其中一种模式。
 *    **AES-GCM**（Galois/Counter Mode）不只是"加密"，它是 **AEAD**
 *    （Authenticated Encryption with Associated Data，带关联数据的认证加密），
 *    一次完成三件事：
 *      · 保密（confidentiality）：数据被加密，没有密钥看不懂；
 *      · 完整性（integrity）：任何人改一个字节，解密时会**报错**而不是给出错误明文；
 *      · 真实性（authenticity）：只有持有密钥的人能造出合法密文。
 *    它用到的三个要素：
 *      · **密钥（key）**：16 / 24 / 32 字节，必须随机、必须保密；
 *      · **IV / nonce**（初始化向量）：通常 **12 字节**，必须**每次加密都不同**，但**不需要保密**；
 *      · **认证标签（auth tag）**：通常 16 字节，是"密文 + AAD"的完整性证明，
 *        一般直接**拼接在密文末尾**（Web Crypto 就是这么做的）。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) 数据库字段加密：用户身份证、银行卡、病历等敏感字段落库前加密，
 *        密钥放 KMS / 环境变量，即使数据库被拖走也没有明文。
 *    (b) 会话票据加密：把会话内容加密后放进 Cookie（服务端不存 session），
 *        必须用 AEAD —— 否则用户可以篡改 Cookie 里的 role=user 为 role=admin。
 *    (c) 文件/配置加密：把私钥、CI 变量加密后提交到仓库（如 SOPS、git-crypt 的思路）。
 *    (d) 端到端加密消息：每条消息一个随机 IV，密钥由双方协商（结合 ECDH，见 06 篇）。
 *    (e) 加密后再传输：TLS 之外再加一层"应用层加密"，防止中间代理/网关看到明文。
 *
 * 3. 核心语法要点
 *    (a) **密钥**：
 *          // 方式一：随机生成（推荐）
 *          const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
 *          // 方式二：从已有字节导入（从 KMS 取回、或由口令派生，见 05 篇）
 *          const key = await subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
 *        密钥长度只能是 128 / 192 / 256 位（16 / 24 / 32 字节），别的长度会抛 DataError。
 *    (b) **加密**：
 *          const iv = crypto.getRandomValues(new Uint8Array(12));   // 每次都必须重新生成！
 *          const cipher = await subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, plainBytes);
 *        返回的 ArrayBuffer = **密文 || 认证标签**（末尾 16 字节是 tag）。
 *    (c) **解密**：把 iv 和 cipher 原样传回去
 *          const plain = await subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, cipher);
 *        只要 iv / 密文 / tag / 密钥 / AAD 中有任何一处不对，就**抛 OperationError**，
 *        绝不会"给你一段看起来很像但其实是乱码的明文"。这正是 AEAD 的价值。
 *    (d) **AAD（additionalData）**：可以附加一段"需要被认证但不加密"的数据，
 *        比如消息的序号、tenant_id、协议版本。它不出现在密文里（保持可见/可路由），
 *        但一旦被改动，解密同样失败。传 AAD 时加密和解密必须**完全一致**。
 *    (e) **打包格式**：密文自己不带 iv 和算法信息，所以要自己拼一个格式，例如：
 *          `版本(1B) || iv(12B) || 密文+tag(剩余)`  —— 一起存库或放进 Cookie。
 *        没有 iv 就解不回来；把 iv 丢了等于数据丢了。
 *    (f) 若使用 128 位以外的 tagLength（如 96 / 104 / 112 / 120），在现代用法里没有必要，
 *        保持默认 128 位即可。
 *
 * 4. 常见陷阱
 *    - **IV 重用（最致命的错误）**：同一个密钥下，用相同的 IV 加密两段不同明文，
 *      GCM 底层的 CTR 模式会**重复使用同一段密钥流**。此时
 *      `密文1 XOR 密文2 = 明文1 XOR 明文2`，攻击者不用密钥就能还原出明文之间的关系，
 *      而且可以伪造出合法密文（GCM 的认证也会被攻破）。历史上有真实事故：
 *      某协议复用 nonce 导致密钥被完全恢复。**IV 必须每次随机生成（或严格单调递增）。**
 *    - **IV 不是秘密，但必须是唯一值**：所以可以随密文一起明文存储，但绝不能重复。
 *      随机 12 字节 IV 在 2^32 次加密后碰撞概率约 2^-33（生日悖论），
 *      对绝大多数业务足够安全；超高吞吐场景应改用计数器式 nonce。
 *    - **把密钥硬编码在代码里 / 提交进仓库**：等于没加密。
 *      密钥要放环境变量或密钥管理服务（KMS），并支持轮换。
 *    - **用 ECB 模式"加密"**：ECB 不做 IV、相同明文块产生相同密文块，
 *      会泄漏明文结构（经典例子：加密一张图片，加密后还能看出轮廓）。
 *      Web Crypto 干脆**不提供 ECB**，就是要让这条路走不通。
 *    - **以为加密等于完整性**：CBC 等老模式只加密不认证，攻击者可以篡改密文
 *      （配合 padding oracle 甚至能逐字节解出明文）。**新代码一律用 AEAD（GCM/ChaCha20-Poly1305）。**
 *    - **把 tag 丢了或截断**：tag 是完整性证明，丢了就没有防篡改能力。
 *      注意 Web Crypto 把 tag 拼在密文末尾，如果你手工拆包时"多截了 16 字节"，解密必然失败。
 *    - **忘了 await**：拿到的是 Promise 而不是密文，存进数据库会存成 "[object Promise]"。
 *    - **拿密文长度当明文长度**：密文比明文长 16 字节（tag）。另外，如果只加密高度结构化
 *      的小数据（如"是/否"），密文长度本身会泄漏信息 —— 必要时先填充到固定长度。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 35_web_crypto/04_aes_gcm_encryption.js
 *
 * 【预期输出】
 *   1) 生成密钥并打印长度与算法属性（不打印随机密钥内容），并演示非法的 64 位密钥长度；
 *   2) 演示"固定 IV"的加密解密全流程，并与 node:crypto 的 aes-256-gcm 双向交叉验证；
 *   3) 演示篡改密文 / 篡改 tag / 换 IV / 换密钥 / 截断密文 / AAD 不一致六种失败（全部 try/catch）；
 *   4) 用 XOR 实验说明"IV 复用 = 密钥流复用"的严重后果，并给出 IV 生成规则与打包格式；
 *   5) 对比 CBC：篡改后不报错而是给出乱码，说明为什么 AEAD 优于 CBC；
 *   6) 给出一个可直接照抄的密钥管理清单与小结。
 *   全程退出码 0。
 * ============================================================================
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const subtle = globalThis.crypto.subtle;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** 把 BufferSource 转成十六进制字符串。 */
const toHex = (bytes) => Buffer.from(bytes).toString('hex');

// ===========================================================================
console.log('--- 1. 生成 AES 密钥：128 / 192 / 256 位 ---');
// ===========================================================================
const generatedKey = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
console.log(`  generateKey({name:'AES-GCM', length:256}) ->`);
console.log(`    type        = ${generatedKey.type}        （'secret' = 对称密钥）`);
console.log(`    algorithm   = ${generatedKey.algorithm.name}，length=${generatedKey.algorithm.length} 位`);
console.log(`    usages      = [${generatedKey.usages.join(', ')}]`);
console.log(`    extractable = ${generatedKey.extractable}`);
console.log('    这里刻意不打印密钥内容：它是随机的，每次运行都不同；');
console.log('    而且真实项目里的密钥**永远不应该**出现在日志里。');

console.log('\n  密钥长度只能取这三种（这不是"建议"，是算法规定）：');
for (const bits of [128, 192, 256, 64]) {
  try {
    const k = await subtle.generateKey({ name: 'AES-GCM', length: bits }, true, ['encrypt']);
    console.log(`    ${String(bits).padStart(3)} 位 ✓ 成功（${k.algorithm.length} 位）`);
  } catch (err) {
    console.log(`    ${String(bits).padStart(3)} 位 ✗ ${err.name}: ${err.message}`);
  }
}

// 用固定密钥（演示可复现）导入，后面所有小节都用它
// 【重要】固定密钥/固定 IV **仅为了教学演示**；生产环境密钥要随机生成、IV 每次都要新。
const KEY_BYTES = new Uint8Array(32);
for (let i = 0; i < KEY_BYTES.length; i += 1) KEY_BYTES[i] = (i * 7 + 3) & 0xff;
const key = await subtle.importKey('raw', KEY_BYTES, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
const exported = new Uint8Array(await subtle.exportKey('raw', key));
console.log(`\n  用固定字节导入的密钥（演示用）：${toHex(KEY_BYTES)}`);
console.log(`    exportKey('raw') 回来一致吗？ ${toHex(exported) === toHex(KEY_BYTES)}（${exported.byteLength} 字节 = AES-256）`);

// ===========================================================================
console.log('\n--- 2. 加解密全流程（固定 IV，只为让输出可复现）---');
// ===========================================================================
// 真实代码在这里必须写：const iv = crypto.getRandomValues(new Uint8Array(12));
const DEMO_IV = new Uint8Array([0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80, 0x90, 0xa0, 0xb0, 0xc0]);
const plaintext = '订单 A1001：给 Alice 转账 1999 元（演示用明文）';
const plainBytes = encoder.encode(plaintext);

console.log(`  IV（演示用固定值）：${toHex(DEMO_IV)}（${DEMO_IV.byteLength} 字节 = 96 位，GCM 的标准长度）`);
console.log(`  明文："${plaintext}"（${plainBytes.byteLength} 字节 UTF-8）`);

const cipherBuffer = await subtle.encrypt(
  // tagLength 默认就是 128 位，这里显式写出来，提醒你它是可配的（但没必要改小）
  { name: 'AES-GCM', iv: DEMO_IV, tagLength: 128 },
  key,
  plainBytes,
);
const cipherBytes = new Uint8Array(cipherBuffer);
const TAG_LENGTH = 16; // 128 位
const cipherBody = cipherBytes.subarray(0, cipherBytes.length - TAG_LENGTH); // 真正的密文
const tag = cipherBytes.subarray(cipherBytes.length - TAG_LENGTH); // 认证标签

console.log(`\n  subtle.encrypt(...) 返回：`);
console.log(`    总长度 ${cipherBytes.byteLength} 字节 = 明文 ${plainBytes.byteLength} + 认证标签 ${TAG_LENGTH}`);
console.log(`    密文部分（不含 tag）：${toHex(cipherBody)}`);
console.log(`    认证标签 tag（末 16 字节）：${toHex(tag)}`);
console.log(`    完整返回（Web Crypto 把 tag 拼在密文后面）：${toHex(cipherBytes)}`);

const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv: DEMO_IV, tagLength: 128 }, key, cipherBytes);
console.log(`\n  subtle.decrypt(...) 还原：`);
console.log(`    解出来是原文吗？ ${decoder.decode(decrypted) === plaintext}`);
console.log(`    内容："${decoder.decode(decrypted)}"`);
console.log('  这就是对称加密的闭环：同一把密钥 + 同一个 IV -> 完整还原。');

console.log('\n  关键理解：密文长度 = 明文长度（不含 tag）—— GCM 属于"流式"模式，不做填充；');
console.log('            这与 CBC 不同（CBC 需要把明文填充到 16 字节的整数倍）。');

// ===========================================================================
console.log('\n--- 3. 与 node:crypto 交叉验证 ---');
// ===========================================================================
// node:crypto 的 aes-256-gcm 与本例参数完全对应，密文和 tag 应当逐字节一致。
// 注意 node 的接口把 tag **分开**返回（getAuthTag），而 Web Crypto 是**拼接**的 ——
// 这个差异是很多人跨端解密失败的根源。
console.log('  用同样的密钥、IV、明文，交给 node:crypto 的 aes-256-gcm 算一遍：');
const nodeCipher = createCipheriv('aes-256-gcm', Buffer.from(KEY_BYTES), Buffer.from(DEMO_IV));
const nodeCt = Buffer.concat([nodeCipher.update(Buffer.from(plainBytes)), nodeCipher.final()]);
const nodeTag = nodeCipher.getAuthTag();
console.log(`    node 密文：${toHex(nodeCt)}`);
console.log(`    node tag ：${toHex(nodeTag)}`);
console.log(`    密文与 subtle 一致？ ${toHex(nodeCt) === toHex(cipherBody)}`);
console.log(`    tag  与 subtle 一致？ ${toHex(nodeTag) === toHex(tag)}`);
console.log(`    node 的 (密文 || tag) 与 subtle 的一整块一致？ ${toHex(Buffer.concat([nodeCt, nodeTag])) === toHex(cipherBytes)}`);

console.log('\n  反向：node 加密 -> subtle 解密（跨运行时互通的关键路径）：');
const nodeCombined = Buffer.concat([nodeCt, nodeTag]);
const crossPlain = await subtle.decrypt({ name: 'AES-GCM', iv: DEMO_IV }, key, nodeCombined);
console.log(`    subtle 能解开 node 的密文吗？ ${decoder.decode(crossPlain) === plaintext}`);
console.log(`    解出的内容："${decoder.decode(crossPlain)}"`);

console.log('\n  再反向一次：subtle 加密 -> node 解密：');
const nodeDecipher = createDecipheriv('aes-256-gcm', Buffer.from(KEY_BYTES), Buffer.from(DEMO_IV));
nodeDecipher.setAuthTag(Buffer.from(tag)); // 必须把 tag 单独设回去
const nodePlain = Buffer.concat([nodeDecipher.update(Buffer.from(cipherBody)), nodeDecipher.final()]);
console.log(`    node 能解开 subtle 的密文吗？ ${nodePlain.toString('utf8') === plaintext}`);

console.log('\n  顺便验证"随机 IV"的效果（每次加密结果都不同，这是正确行为）：');
const randomIvCiphers = [];
for (let i = 0; i < 3; i += 1) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const c = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, key, plainBytes));
  randomIvCiphers.push(toHex(c));
  console.log(`    第 ${i + 1} 次：IV 已随机生成（12 字节），密文+tag 长度 ${c.byteLength} 字节（密文内容每次不同，故不打印）`);
}
console.log(`    三次密文互不相同？ ${new Set(randomIvCiphers).size === 3}  <- 因为 IV 不同，密钥流也不同`);
console.log('    （对比第 2 节：固定 IV 时，同样的明文永远得到同样的密文。）');
console.log('    **所以 IV 必须随密文一起存下来**，否则解密方无法还原。');

// ===========================================================================
console.log('\n--- 4. 篡改检测：改一个字节就解不开 ---');
// ===========================================================================
/**
 * 尝试解密并返回结果描述（绝不把异常抛到顶层）。
 * @param {Uint8Array} iv
 * @param {Uint8Array} data
 * @param {CryptoKey} k
 * @param {Uint8Array} [aad]
 * @returns {Promise<string>}
 */
async function tryDecrypt(iv, data, k, aad) {
  try {
    const algo = aad ? { name: 'AES-GCM', iv, additionalData: aad } : { name: 'AES-GCM', iv };
    const out = await subtle.decrypt(algo, k, data);
    return `成功 -> "${decoder.decode(out)}"`;
  } catch (err) {
    // 认证失败统一是 OperationError，且**故意不给细节**：
    // 如果错误信息区分"tag 错"和"密文错"，就等于给攻击者提供了额外信息。
    return `失败 -> ${err.name}（认证失败，拒绝给出明文）`;
  }
}

/**
 * 复制一份字节数组并翻转指定位置的一个比特。
 * @param {Uint8Array} src
 * @param {number} index
 * @returns {Uint8Array}
 */
function flipBit(src, index) {
  const copy = new Uint8Array(src);
  copy[index] ^= 0x01;
  return copy;
}

const tamperCases = [
  ['原封不动', cipherBytes, DEMO_IV, key],
  ['密文正文第 1 字节翻转 1 比特', flipBit(cipherBytes, 0), DEMO_IV, key],
  ['密文正文中间 1 字节翻转 1 比特', flipBit(cipherBytes, Math.floor(cipherBody.length / 2)), DEMO_IV, key],
  ['认证标签最后 1 字节翻转', flipBit(cipherBytes, cipherBytes.length - 1), DEMO_IV, key],
  ['IV 被换掉', cipherBytes, flipBit(DEMO_IV, 0), key],
  ['密文被截掉 1 个字节', cipherBytes.subarray(0, cipherBytes.length - 1), DEMO_IV, key],
];
for (const [label, data, iv, k] of tamperCases) {
  console.log(`    ${label.padEnd(30)} ${await tryDecrypt(iv, data, k)}`);
}

const wrongKey = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['decrypt']);
console.log(`    ${'换一把别的密钥'.padEnd(30)} ${await tryDecrypt(DEMO_IV, cipherBytes, wrongKey)}`);
console.log('\n  注意：所有失败都返回同一个 OperationError，没有任何"部分成功"的情况。');
console.log('  这比"解密成功但得到乱码"安全得多 —— 后者会让上层程序把乱码当成真实数据继续处理。');

// ===========================================================================
console.log('\n--- 5. AAD：认证"不该被改但不该被加密"的数据 ---');
// ===========================================================================
// 典型用法：把"这条密文属于哪个用户/哪个版本"作为 AAD 一起认证。
// AAD 不进入密文（保持可见、可被路由），但被改就会解密失败。
const aad = encoder.encode('tenant=acme;version=1');
const aadCipher = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: DEMO_IV, additionalData: aad }, key, plainBytes));
console.log(`  AAD（明文可见）："${decoder.decode(aad)}"`);
console.log(`  用正确 AAD 解密：${await tryDecrypt(DEMO_IV, aadCipher, key, aad)}`);
console.log(`  漏传 AAD 解密  ：${await tryDecrypt(DEMO_IV, aadCipher, key)}`);
console.log(`  传错 AAD 解密  ：${await tryDecrypt(DEMO_IV, aadCipher, key, encoder.encode('tenant=evil;version=1'))}`);
console.log('  实用价值：攻击者即使拿到了密钥（比如某个租户的密钥），也不能把 A 租户的密文');
console.log('            搬到 B 租户名下 —— 因为 AAD 对不上（这类攻击叫"密文混淆/confused deputy"）。');
console.log('  注意：AAD 是**认证**不是**加密**，不要往里放密码或隐私数据。');

// ===========================================================================
console.log('\n--- 6. 为什么 IV 绝不能重用：亲手做一次密钥流复用攻击 ---');
// ===========================================================================
// GCM 内部是 CTR 模式：把 IV 用密钥加密成一段"密钥流"，再与明文异或。
// 同一个密钥 + 同一个 IV => 同一段密钥流 => 同一个 keystream 被用了两次。
// 于是：C1 = P1 XOR KS，C2 = P2 XOR KS，两式相减得 C1 XOR C2 = P1 XOR P2。
// 攻击者只需要两个密文，就能得到两个明文之间的异或关系 —— 明文完全暴露。
const victimPlain = encoder.encode('transfer=1000;to=alice;memo=rent');
const evilPlain = encoder.encode('transfer=9999;to=mallory;memo=rent');
console.log(`  攻击者已知（或猜到）P2 的大致格式："${decoder.decode(evilPlain)}"`);
console.log(`  受害者真实明文 P1：                        "${decoder.decode(victimPlain)}"`);

const c1 = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: DEMO_IV }, key, victimPlain));
const c2 = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv: DEMO_IV }, key, evilPlain));
const xorCipher = Buffer.alloc(victimPlain.length);
for (let i = 0; i < victimPlain.length; i += 1) xorCipher[i] = c1[i] ^ c2[i];
const xorPlain = Buffer.alloc(victimPlain.length);
for (let i = 0; i < victimPlain.length; i += 1) xorPlain[i] = victimPlain[i] ^ evilPlain[i];
console.log(`\n  两次加密用了**同一个 IV**（这是灾难性的错误配置）。`);
console.log(`    C1 XOR C2 = ${toHex(xorCipher)}`);
console.log(`    P1 XOR P2 = ${toHex(xorPlain)}`);
console.log(`    两者完全相同？ ${toHex(xorCipher) === toHex(xorPlain)}  <- 攻击者不需要密钥就得到了这个等式`);

// 已知明文攻击：假设攻击者知道 P2 是标准模板（比如 "transfer=" 开头）
const knownPrefix = 'transfer=';
let recovered = '';
for (let i = 0; i < knownPrefix.length; i += 1) {
  // P1[i] = (C1[i] XOR C2[i]) XOR P2[i]，而 P2[i] 攻击者已经从模板得知
  recovered += String.fromCharCode(xorCipher[i] ^ knownPrefix.charCodeAt(i));
}
console.log(`    假设攻击者知道 P2 的前 ${knownPrefix.length} 个字符是 "${knownPrefix}"，`);
console.log(`    他就能算出 P1 的前几个字符："${recovered}"  <- 与真实值一致？ ${recovered === knownPrefix}`);
console.log('  把长度放大到整条报文：只要攻击者能猜出对端明文的一部分，就能解开对端的其余部分。');
console.log('  更严重的是：GCM 的认证密钥也与这段密钥流相关，IV 重用还会让攻击者');
console.log('  **伪造出能通过验证的密文**（历史上 Enigma、WEP、某些 TLS 实现都栽在这上面）。');

console.log('\n  正确做法（三选一，按推荐度排序）：');
const ivRules = [
  ['每次随机生成 12 字节', 'crypto.getRandomValues(new Uint8Array(12)) —— 最省事，绝大多数业务够用'],
  ['计数器 / 严格递增', '同一密钥下维护一个只用一次、绝不回退的计数器（数据库序列、单调时钟）'],
  ['不自己造，交给现成协议', '比如用 AES-KW 包一层、或用 HPKE/TLS 这类已经处理好 nonce 的协议'],
];
for (const [k, v] of ivRules) console.log(`    - ${k}：${v}`);
console.log('  绝对不要：用固定 IV、用时间戳当 IV（可能重复）、用随机数但每次都从同一个种子开始。');

console.log('\n  附带一个容易忽略的细节：**IV 也要一起存**。');
console.log('  打包建议格式（自己定，但要写进协议文档）：');
console.log('    版本(1 字节) || IV(12 字节) || 密文+tag(其余)');
const packed = Buffer.concat([Buffer.from([0x01]), Buffer.from(DEMO_IV), Buffer.from(cipherBytes)]);
console.log(`    本例打包后：${toHex(packed).slice(0, 60)}…（共 ${packed.length} 字节）`);
const unpackedIv = packed.subarray(1, 13);
const unpackedData = packed.subarray(13);
console.log(`    拆包后 IV 还原一致？ ${toHex(unpackedIv) === toHex(DEMO_IV)}`);
console.log(`    拆包后解密成功？ ${decoder.decode(await subtle.decrypt({ name: 'AES-GCM', iv: unpackedIv }, key, unpackedData)) === plaintext}`);

// ===========================================================================
console.log('\n--- 7. 为什么 GCM 优于 CBC：一个"不报错"的篡改实验 ---');
// ===========================================================================
// CBC 只做"保密"，不做"完整性"。改一段密文，解密**照样成功**，只是明文变成了乱码。
// 上层程序分辨不出"这是乱码"还是"用户输入的就是这样"，于是漏洞就出现了。
const cbcKey = Buffer.from(KEY_BYTES); // 同一个密钥，仅用于对比（真实项目里不同用途要换密钥！）
const cbcIv = Buffer.alloc(16, 0x24); // CBC 的 IV 必须是 16 字节（分组长度）
const cbcPlain = Buffer.from('orders: A1001, amount: 1999'); // 16 字节对齐的明文
const cbcCipher = createCipheriv('aes-256-cbc', cbcKey, cbcIv);
const cbcCt = Buffer.concat([cbcCipher.update(cbcPlain), cbcCipher.final()]);

/** 用 CBC 解密并返回结果描述（CBC 解密可能因填充错误抛错）。 */
function tryCbcDecrypt(iv, data) {
  try {
    const d = createDecipheriv('aes-256-cbc', cbcKey, iv);
    const out = Buffer.concat([d.update(data), d.final()]);
    return `"${out.toString('utf8')}"  <- 没有报错！`;
  } catch (err) {
    return `抛错 ${err.code ?? err.name}（这一次恰好被填充校验挡住了）`;
  }
}

console.log(`  明文："${cbcPlain.toString('utf8')}"`);
console.log(`  用 AES-256-CBC 加密后 ${cbcCt.length} 字节（明文被填充到 16 字节的整数倍）`);
console.log(`    密文：${toHex(cbcCt)}`);
console.log(`  正常解密：${tryCbcDecrypt(cbcIv, cbcCt)}`);

// 翻转第 2 个密文分组中的 1 个比特（第 2 分组从第 16 字节开始）
const tamperedCbc = Buffer.from(cbcCt);
tamperedCbc[20] ^= 0x01;
console.log(`\n  攻击者在第 2 个分组里翻转 1 个比特：`);
console.log(`    解密结果：${tryCbcDecrypt(cbcIv, tamperedCbc)}`);
// 翻转第 1 分组里一个比特（会影响第 1 分组的一个字节 + 第 2 分组的整块）
const tamperedCbc2 = Buffer.from(cbcCt);
tamperedCbc2[3] ^= 0x01;
console.log(`  攻击者在第 1 个分组里翻转 1 个比特：`);
console.log(`    解密结果：${tryCbcDecrypt(cbcIv, tamperedCbc2)}`);
console.log('  CBC 的"错误扩散"特性让改动只影响局部：前面的分组几乎原样，只是变成了乱码。');
console.log('  **整个过程没有任何"被篡改"的信号** —— 这就是 CBC 最大的问题。');
console.log('  攻击者还能利用"服务端是否报填充错误"的差异，一点一点把明文猜出来：');
console.log('  这就是著名的 **padding oracle 攻击**（POODLE、BEAST 那一类漏洞的思想）。');

console.log('\n  GCM 与 CBC 的对照：');
const modeCompare = [
  ['保密性', '✓ CTR 流式加密，无填充（也就没有填充相关的攻击面）', '✓ 分组加密 + PKCS#7 填充'],
  ['完整性/真实性', '✓ 自带 GMAC 认证标签，篡改必失败', '✗ 完全没有，需要额外再套一个 HMAC'],
  ['IV 长度', '12 字节（推荐）', '16 字节'],
  ['需要填充吗', '不需要（密文长度 = 明文长度）', '需要（密文更长，且填充校验本身是攻击面）'],
  ['并行能力', '加密/解密都可并行（高性能）', '加密不能并行，解密可以'],
  ['能不能"先加密再校验"补救', '不需要', '可以（Encrypt-then-MAC），但极容易实现错'],
  ['Web Crypto 里的写法', 'subtle.encrypt({name:"AES-GCM", iv})', 'subtle.encrypt({name:"AES-CBC", iv}) —— 但仍然没有完整性'],
];
for (const [dim, gcm, cbc] of modeCompare) {
  console.log(`    ${dim}`);
  console.log(`        GCM: ${gcm}`);
  console.log(`        CBC: ${cbc}`);
}
console.log('  结论：新代码用 GCM（或 ChaCha20-Poly1305）。只有在对接无法修改的老协议时才用 CBC，');
console.log('        而且那种情况下必须自己在密文外面再套一层 HMAC，并按"先加密后 MAC"的顺序做。');

// ===========================================================================
console.log('\n--- 8. 实践清单 ---');
// ===========================================================================
const checklist = [
  ['密钥来源', 'generateKey 随机生成，或从 KMS/环境变量导入；绝不硬编码、绝不提交进仓库'],
  ['密钥长度', 'AES-256（32 字节）；老系统兼容时才退到 128'],
  ['密钥轮换', '密文里带"密钥版本号"，支持新旧密钥并存与平滑轮换'],
  ['IV', '每次加密都重新随机生成 12 字节；随机值不需要保密，但要和密文一起存'],
  ['认证标签', '保持 128 位，随密文一起存；丢了就等于放弃防篡改能力'],
  ['AAD', '把"租户 ID / 版本 / 序号"这类必须绑定的元数据放进去（明文可见）'],
  ['打包格式', '版本 || IV || 密文+tag，写进协议文档；跨语言对接时特别要确认 tag 的位置'],
  ['错误处理', '解密失败一律当作"数据不可信"处理：记日志、告警，绝不返回部分明文'],
  ['抽取层封装', '业务代码不要直接调 subtle，封装成 encrypt(plain) / decrypt(packed) 两个函数，'],
  ['', '这样 IV 生成、tag 拼接、密钥选择都只有一处实现，不会有人写漏'],
];
for (const [k, v] of checklist) console.log(`    ${k.padEnd(10)} ${v}`);

console.log('\n--- 9. 小结 ---');
console.log('  1) AES-GCM 是 AEAD：一次同时保证保密性 + 完整性 + 真实性，是现代对称加密的默认选择。');
console.log('  2) 三要素：密钥（16/24/32 字节，保密）、IV（12 字节，每次唯一、不必保密）、');
console.log('     tag（16 字节，拼接在密文末尾，Web Crypto 自动处理）。');
console.log('  3) 与 node:crypto 交叉验证通过：密文与 tag 逐字节一致；');
console.log(`     并且明白了接口差异 —— node 分开放（getAuthTag/setAuthTag），Web Crypto 拼一起。`);
console.log('  4) 篡改检测：改密文、改 tag、换 IV、换密钥、AAD 不符，全部抛 OperationError，');
console.log('     绝不给出"看起来像明文"的乱码 —— 这正是 AEAD 与 CBC 的本质区别。');
console.log('  5) IV 重用会退化成"密钥流复用"：C1 XOR C2 = P1 XOR P2，本文件已亲手复现。');
console.log('  6) CBC 不报错地接受篡改，还会引出 padding oracle —— 它是历史包袱，不是可选项。');
