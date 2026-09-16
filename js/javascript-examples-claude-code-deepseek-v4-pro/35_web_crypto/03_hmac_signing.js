/**
 * ============================================================================
 * 知识点：HMAC 消息认证码 —— 导入密钥、sign/verify、时序安全比较、API 签名与 Webhook 校验
 * ============================================================================
 *
 * 【所属分类】35_web_crypto —— Web Crypto API
 * 【难度等级】进阶
 * 【前置知识】35_web_crypto/02_digest_hashing.js、32_security_and_best_practices/09_secure_random.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    **HMAC = Hash-based Message Authentication Code（基于哈希的消息认证码）**。
 *    一句话：**带密钥的摘要**。
 *        HMAC(key, message) = 一串固定长度的字节（用 SHA-256 时是 32 字节）
 *    它同时提供了两个性质：
 *      (a) **完整性（integrity）**：消息改一个比特，HMAC 就完全不同（继承摘要的雪崩效应）。
 *      (b) **真实性（authenticity）**：没有密钥就算不出 HMAC。所以"能验证通过"等价于
 *          "对方知道密钥" —— 这就是"认证"。
 *    对比一下三种"指纹"：
 *      · 摘要（SHA-256）：无密钥。谁都能算 -> 只能证明"数据没损坏"，不能证明"谁发的"。
 *      · HMAC：共享密钥。**双方用同一把密钥**，能算也能验 -> 适合"服务端之间"、"服务端与自己的前端"。
 *      · 数字签名（ECDSA/RSA）：私钥签、公钥验。**别人只能验不能签** -> 适合"多方验证、签约方唯一"。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) **Webhook 校验**：GitHub / Stripe / 微信支付回调都是
 *        "POST 你的接口 + 带一个 X-Signature 头"，签名就是 HMAC(你的密钥, 请求体)。
 *        你用它确认"这真的是支付平台发的"，而不是攻击者伪造的"支付成功"通知。
 *    (b) **API 请求签名**：云服务（AWS SigV4、阿里云、腾讯云）用
 *        HMAC(SecretKey, 规范化后的请求) 生成签名，服务端用同样的方式重算比对。
 *        这样密钥不用每次传输，请求也无法被中途篡改（改了 body 签名就对不上）。
 *    (c) **会话 / Cookie 完整性**：把 `user=alice` 加上 `sig=HMAC(key, user=alice)`，
 *        客户端改不了 user，因为没有密钥就签不出新签名（这就是"签名 Cookie"的思路）。
 *    (d) **JWT 的 HS256 算法**：JWT 的 header.payload 部分就是用 HMAC-SHA256 签的。
 *        （对照：RS256/ES256 用非对称签名，见 06 篇。）
 *    (e) **一次性令牌**：`token = HMAC(key, userId + 过期时间)`，
 *        服务端不用存 token 也能验证有效性，且用户改不了 userId。
 *
 * 3. 核心语法要点
 *    (a) **导入密钥**（HMAC 的密钥是一段**原始字节**，格式用 'raw'）：
 *          const key = await subtle.importKey(
 *            'raw',                      // 密钥格式
 *            keyBytes,                   // BufferSource：密钥字节
 *            { name: 'HMAC', hash: 'SHA-256' },  // 算法 + 哈希（哈希是密钥属性的一部分！）
 *            false,                      // extractable：生产环境建议 false
 *            ['sign', 'verify'],         // usages：明确用途
 *          );
 *    (b) **签名 / 验证**：
 *          const sig = await subtle.sign('HMAC', key, dataBytes);      // -> ArrayBuffer
 *          const ok  = await subtle.verify('HMAC', key, sigBytes, dataBytes); // -> boolean
 *        注意 `verify` 的参数顺序是 **(算法, 密钥, 签名, 数据)** —— 签名在前、数据在后，
 *        写反了会静默返回 false（不报错！），这是最常见的低级错误。
 *    (c) `subtle.verify` 内部用的就是**常量时间比较**，并返回布尔值。
 *        所以能用 verify 就别自己比 —— 自己比很容易写成 `===`，引入时序侧信道。
 *    (d) 签名有 **两种常见文本表示**：hex（小写十六进制，64 字符）和 base64。
 *        两边必须约定一致！"我算出来是 hex，你按 base64 解码"是最常见的联调事故。
 *    (e) HMAC 的密钥长度：**建议至少等于哈希输出长度**（SHA-256 就是 32 字节）。
 *        密钥短于 64 字节（SHA-256 的分组长度）时，算法内部会**补零**到 64 字节，
 *        所以"短密钥"不是错误，只是熵更少、更易被爆破。
 *    (f) 密钥必须是**随机字节**，不能是 'mysecret' 这种人写的字符串 ——
 *        人写的字符串熵极低，且容易在代码仓库里泄漏。生成方式：
 *        `crypto.getRandomValues(new Uint8Array(32))`。
 *
 * 4. 常见陷阱
 *    - **用 `===` 比较签名**：字符串/字节数组比较会在第一个不同处提前返回，
 *      耗时与"匹配了多少前缀"相关。攻击者可以用大量请求把正确签名逐字节"量"出来
 *      （时序攻击）。必须用 `crypto.timingSafeEqual`（要求等长）或直接用 `subtle.verify`。
 *    - **verify 参数顺序写反**：`verify(algo, key, data, sig)` 是错的写法，且**不报错**，
 *      只是永远返回 false —— 调试时很容易怀疑人生。
 *    - **一边用 hex 一边用 base64**：签名对不上，但算法没错。务必在协议里写死编码。
 *    - **把 HMAC 用在"需要多方验证"的场景**：HMAC 要求验证方也持有密钥，
 *      所以"客户端要能验证服务端签名"的场景不能用 HMAC（客户端有密钥 = 谁都能签）。
 *      那种场景要用非对称签名（06 篇）。
 *    - **密钥泄漏 = 全部失效**：HMAC 的安全性完全依赖密钥保密。
 *      密钥不能写进前端代码、不能提交进仓库（`.env` 或密钥管理服务）、要能轮换。
 *    - **忘记签名要覆盖"全部关键字段"**：只签 body 不签时间戳，就会被重放；
 *      只签部分参数，攻击者就能改没签到的参数（经典漏洞：签名只覆盖 query 不覆盖 body）。
 *    - **明文比较长度**：`timingSafeEqual` 在长度不等时**直接抛错**（不是返回 false）。
 *      所以自定义比较函数要先判长度，或者干脆保证签名长度固定（HMAC 输出长度天然固定）。
 *    - **以为 HMAC 能加密**：它只是"带密钥的指纹"，**不能还原原文**。
 *      既要保密又要完整性时，用 AES-GCM（04 篇）或"先加密再 HMAC"的组合。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 35_web_crypto/03_hmac_signing.js
 *
 * 【预期输出】
 *   1) 用固定密钥字节导入 HMAC 密钥，演示 sign/verify 的完整流程；
 *   2) 与 node:crypto 的 createHmac 双向交叉验证（subtle 签、node 验；node 签、subtle 验）；
 *   3) 演示"改一个比特""换密钥""参数写反"三种失败情形；
 *   4) 对比 === 与常量时间比较，说明时序攻击原理；
 *   5) 用 Webhook 校验和一个迷你 API 签名协议收尾。
 *   全程退出码 0：所有失败分支都在 try/catch 里打印结果，不会抛出到顶层。
 * ============================================================================
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const subtle = globalThis.crypto.subtle;
const encoder = new TextEncoder();

/** 把 BufferSource 转成十六进制字符串。 */
const toHex = (bytes) => Buffer.from(bytes).toString('hex');

// ===========================================================================
console.log('--- 1. 为什么"摘要"不够：先看一个能骗过摘要的攻击 ---');
// ===========================================================================
// 场景：客户端提交一段"订单数据 + 它的 SHA-256 摘要"，服务端只校验摘要是否匹配。
// 看起来能防篡改，实际上完全防不住 —— 因为摘要算法是公开的，攻击者也能算。
const order = '{"item":"键盘","price":299}';
const tamperedOrder = '{"item":"键盘","price":0.01}';
const digestOfOrder = toHex(await subtle.digest('SHA-256', encoder.encode(order)));
const digestOfTampered = toHex(await subtle.digest('SHA-256', encoder.encode(tamperedOrder)));
console.log(`  正常订单：${order}`);
console.log(`    摘要：${digestOfOrder.slice(0, 32)}…`);
console.log(`  攻击者改成：${tamperedOrder}`);
console.log(`    摘要：${digestOfTampered.slice(0, 32)}…`);
console.log('  攻击者只要**顺手把摘要字段改成第 2 个值**，服务端校验就通过了！');
console.log('  原因：摘要不带密钥，谁都能算 —— 它只能证明"数据没坏"，不能证明"没被人改"。');
console.log('  只要给摘要加一把双方共享的密钥（HMAC），攻击者就算不出新签名了。');

// ===========================================================================
console.log('\n--- 2. 导入 HMAC 密钥并签名 ---');
// ===========================================================================
// 固定密钥仅为了让输出可复现；**生产环境必须用 crypto.getRandomValues 随机生成**。
// 长度为 32 字节 = 256 位，正好和 SHA-256 的输出长度一致，是社区推荐的最小规格。
const secretBytes = new Uint8Array([
  0x2b, 0x7e, 0x15, 0x16, 0x28, 0xae, 0xd2, 0xa6, 0xab, 0xf7, 0x15, 0x88, 0x09, 0xcf, 0x4f, 0x3c,
  0x76, 0x2e, 0x71, 0x60, 0xf3, 0x8b, 0x4d, 0xa5, 0x6a, 0x78, 0x4d, 0x90, 0x45, 0x19, 0x0c, 0xfe,
]);
console.log(`  密钥（演示用固定字节）：${toHex(secretBytes)}`);
console.log(`    长度：${secretBytes.length} 字节 = ${secretBytes.length * 8} 比特`);

// importKey 的三个关键参数：格式、算法、用途。
// 注意哈希算法（SHA-256）是"密钥的一部分"—— 用 SHA-256 导入的密钥不能拿去算 SHA-512。
const hmacKey = await subtle.importKey(
  'raw',
  secretBytes,
  { name: 'HMAC', hash: 'SHA-256' },
  true, // 演示需要导出，所以设 true；生产环境建议 false
  ['sign', 'verify'],
);
console.log(`  importKey 成功，得到一个 CryptoKey：`);
console.log(`    type       = ${hmacKey.type}         （'secret' 表示对称密钥）`);
console.log(`    algorithm  = ${hmacKey.algorithm.name} / ${hmacKey.algorithm.hash.name}`);
console.log(`    usages     = [${hmacKey.usages.join(', ')}]`);
console.log(`    extractable= ${hmacKey.extractable}`);
console.log(`    keySize    = ${hmacKey.algorithm.length} 位`);
console.log(`    注意：CryptoKey 对 JS 是**不透明**的 —— 你不能直接读它的字节，`);
console.log(`          只能通过 exportKey 导出（且必须 extractable=true）。`);

// 导出回来看看：应当和导入的字节一模一样（round-trip 自检）
const roundTrip = new Uint8Array(await subtle.exportKey('raw', hmacKey));
console.log(`    exportKey('raw') 回来还一样吗？ ${toHex(roundTrip) === toHex(secretBytes)}`);

const message = 'POST /pay/callback amount=1999 orderId=A1001';
const messageBytes = encoder.encode(message);
console.log(`\n  待签名的消息："${message}"`);

const signature = await subtle.sign('HMAC', hmacKey, messageBytes);
console.log(`  subtle.sign('HMAC', key, 消息) ->`);
console.log(`    返回类型：${signature.constructor.name}，长度 ${signature.byteLength} 字节（= SHA-256 的输出长度）`);
console.log(`    签名(hex)  ：${toHex(signature)}`);
console.log(`    签名(base64)：${Buffer.from(signature).toString('base64')}`);
console.log('  注意：同一个消息 + 同一个密钥，签名**永远相同**（HMAC 是确定性的）。');
console.log('        这与 ECDSA 这类"每次签名都不同"的算法形成对比（06 篇会讲到）。');

const verified = await subtle.verify('HMAC', hmacKey, signature, messageBytes);
console.log(`\n  subtle.verify('HMAC', key, 签名, 消息) -> ${verified}`);
console.log('    参数顺序务必记牢：(算法, 密钥, **签名**, **数据**)。');
console.log('    写反成 (算法, 密钥, 数据, 签名) 不会报错，只会永远返回 false。');

// ===========================================================================
console.log('\n--- 3. 与 node:crypto 交叉验证（双向）---');
// ===========================================================================
// 为什么能交叉验证：HMAC 是标准算法（RFC 2104），只要"密钥字节、消息字节、
// 哈希算法"三者一致，任何实现都必须产出同样的 32 字节。
// 对不上只有一个可能：你的某个参数没对齐（常见的是编码或多算了换行）。
console.log('  方向 A：subtle 签名 -> node:crypto 独立重算');
const nodeHmacHex = createHmac('sha256', Buffer.from(secretBytes)).update(messageBytes).digest('hex');
console.log(`    subtle  : ${toHex(signature)}`);
console.log(`    node    : ${nodeHmacHex}`);
console.log(`    完全一致？ ${toHex(signature) === nodeHmacHex}  <- 两套独立实现给出同一结果`);

console.log('\n  方向 B：node:crypto 签名 -> subtle 验证');
const nodeSig = createHmac('sha256', Buffer.from(secretBytes)).update(messageBytes).digest();
const nodeSigAccepted = await subtle.verify('HMAC', hmacKey, nodeSig, messageBytes);
console.log(`    node 的签名被 subtle.verify 接受？ ${nodeSigAccepted}`);

console.log('\n  方向 C：多种哈希算法的交叉验证（HMAC 的哈希是可换的）');
for (const [webHash, nodeHash, bytes] of [
  ['SHA-1', 'sha1', 20],
  ['SHA-256', 'sha256', 32],
  ['SHA-384', 'sha384', 48],
  ['SHA-512', 'sha512', 64],
]) {
  // 每个哈希算法都要单独导入一把密钥：哈希是密钥属性的一部分
  const key = await subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: webHash }, true, ['sign']);
  const webSig = new Uint8Array(await subtle.sign('HMAC', key, messageBytes));
  const nodeSigHex = createHmac(nodeHash, Buffer.from(secretBytes)).update(messageBytes).digest('hex');
  console.log(`    HMAC-${webHash.padEnd(7)} 输出 ${String(webSig.byteLength).padStart(2)} 字节  与 node 一致？ ${toHex(webSig) === nodeSigHex}  （期望 ${bytes} 字节）`);
}
console.log('  SHA-1 仍能用于 HMAC（HMAC-SHA1 尚无实用攻击），但新协议一律用 SHA-256 及以上。');

console.log('\n  交叉验证还能帮你抓出"看不见的字符"这类事故：');
const trickyMessages = [
  ['末尾多一个换行', `${message}\n`],
  ['开头多一个空格', ` ${message}`],
  ['参数顺序调换', 'POST /pay/callback orderId=A1001 amount=1999'],
  ['中文参数', 'POST /pay/callback 备注=付款成功'],
];
for (const [label, msg] of trickyMessages) {
  const webHex = toHex(await subtle.sign('HMAC', hmacKey, encoder.encode(msg)));
  const nodeHex = createHmac('sha256', Buffer.from(secretBytes)).update(Buffer.from(msg, 'utf8')).digest('hex');
  console.log(`    ${label.padEnd(16)} 两侧一致？ ${webHex === nodeHex}`);
}
console.log('  两侧当然一致（因为输入字节相同）。但把它们和上面**原始消息**的签名比一比：');
const originalHex = toHex(signature);
for (const [label, msg] of trickyMessages) {
  const webHex = toHex(await subtle.sign('HMAC', hmacKey, encoder.encode(msg)));
  console.log(`    ${label.padEnd(16)} 与原始消息签名相同？ ${webHex === originalHex}`);
}
console.log('  -> 全是 false。服务端和客户端只要有一边"多拼了一个换行"，签名就永远对不上。');
console.log('     这正是"签名总是验证失败"的第一大原因：**双方对"签哪些字节"的理解不一致**。');

// ===========================================================================
console.log('\n--- 4. 三种失败情形（都在 try/catch 里，不会抛到顶层）---');
// ===========================================================================
console.log('  ① 消息被改了一个比特：');
const tampered = new Uint8Array(messageBytes);
tampered[tampered.length - 1] ^= 0x01; // 只翻转最后 1 个比特
const tamperedResult = await subtle.verify('HMAC', hmacKey, signature, tampered);
console.log(`     改动后仍验证通过？ ${tamperedResult}  <- 必须为 false`);
console.log(`     注意：verify **不抛错**，只返回 false。这是它的设计：`);
console.log(`     "签名不对"是一个正常业务流程（返回 401），不是程序异常。`);

console.log('\n  ② 用了错误的密钥（攻击者自己生成一把）：');
const attackerKey = await subtle.importKey('raw', randomBytes(32), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
const attackerSig = await subtle.sign('HMAC', attackerKey, messageBytes);
const attackerAccepted = await subtle.verify('HMAC', hmacKey, attackerSig, messageBytes);
console.log(`     攻击者签名长度正确、格式正确，服务端能验过吗？ ${attackerAccepted}  <- false`);
console.log('     这就是 HMAC 的核心价值：**没有密钥就算不出有效签名**。');
console.log('     （攻击者可以靠暴力枚举密钥，所以密钥必须有足够熵：32 随机字节 = 2^256 种可能。）');

console.log('\n  ③ verify 参数顺序写反（常见低级错误）：');
const wrongOrder = await subtle.verify('HMAC', hmacKey, messageBytes, signature);
console.log(`     verify(algo, key, 数据, 签名) 的结果：${wrongOrder}  <- false，而且**不报错**`);
console.log('     排查建议：签名验证失败时，先怀疑参数顺序与字节编码，再怀疑密钥。');

console.log('\n  ④ 用不支持的密钥长度（空密钥）导入：');
try {
  await subtle.importKey('raw', new Uint8Array(0), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  console.log('     空密钥居然被接受了？');
} catch (err) {
  console.log(`     抛错 ${err.name}: ${err.message}`);
  console.log('     HMAC 的密钥不能为空。反过来，短密钥（如 4 字节）**会被接受**，');
  console.log('     但那样只有 32 比特熵，容易被暴力枚举 —— 算法不会替你检查"够不够安全"。');
}

// ===========================================================================
console.log('\n--- 5. 时序安全比较：为什么不能用 === 比签名 ---');
// ===========================================================================
console.log('  假设你这样写：if (computedHex === receivedHex) { 放行 }');
console.log('  JS 的字符串比较是**逐字符**的，遇到第一个不同的字符就立刻返回 false。');
console.log('  于是："前 8 位对得上"比"第 1 位就错"要多花一点点时间。');
console.log('  攻击者在网络里发几百万次请求，统计响应时间，就能把正确签名一位一位"量"出来。');
console.log('  这叫**时序攻击（timing attack）**。之所以叫"侧信道"，是因为泄漏的不是内容，而是时间。');

const serverHex = toHex(signature); // 服务端保存/计算出的正确签名（hex）
const wrongFromFirstChar = `f${serverHex.slice(1)}`; // 第 1 个字符就错
const wrongAtLastChar = `${serverHex.slice(0, -1)}f`; // 只有最后 1 个字符错

/**
 * 【错误示范】用 === 比较签名。仅用于说明问题，不要在生产里使用。
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function unsafeCompare(a, b) {
  return a === b;
}

/**
 * 【正确做法之一】自己实现常量时间比较：**无论如何都要扫完全程**。
 * 关键点：不能提前 return，也不能用 if 分支跳过比较；要用"累积"的方式。
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false; // 长度不等本身会泄漏信息，所以调用方应保证等长
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    // 逐字节异或后累积；只要有一个字节不同，diff 就非 0。
    // 注意这里**没有** if 提前退出：比较次数与内容无关。
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

console.log(`  正确签名(hex)：${serverHex}`);
console.log(`  两种错误输入的比较结果（两种实现给出的布尔值一致）：`);
const compareCases = [
  ['第 1 个字符就错', wrongFromFirstChar],
  ['只有最后 1 个字符错', wrongAtLastChar],
  ['完全正确', serverHex],
];
for (const [label, input] of compareCases) {
  const unsafe = unsafeCompare(input, serverHex);
  // 为了让自定义实现也能比字符串，先转回字节；真实项目里应始终用字节比较
  const safe = constantTimeEqual(Buffer.from(input), Buffer.from(serverHex));
  console.log(`    ${label.padEnd(20)} === 比较: ${String(unsafe).padEnd(5)}  常量时间比较: ${safe}`);
}
console.log('  两者**布尔结果完全一致** —— 差别不在"答案对不对"，而在"耗时曲线是否泄漏内容"。');
console.log('  本文件不做纳秒级计时对比：单机上的耗时差异会被 JIT、GC、调度淹没，');
console.log('  测出来的数字没有说服力。要带走的是**性质**：常量时间比较的执行路径与内容无关。');

console.log('\n  实践建议（优先级从高到低）：');
const compareAdvice = [
  ['1. 直接用 subtle.verify', '它内部就是常量时间比较，你连比都不用比 —— 这永远是最佳选择'],
  ['2. node:crypto 的 timingSafeEqual', '服务端 Node 代码里比较两段字节的标准工具（要求长度相同）'],
  ['3. 自己写累积异或', '只有在没有库可用的环境（如某些边缘运行时）才自己写，注意别提前 return'],
  ['4. 绝对不要', '=== / == / startsWith / includes / 正则 比较签名或令牌'],
];
for (const [k, v] of compareAdvice) console.log(`    ${k.padEnd(32)} ${v}`);

console.log('\n  用 node:crypto 的 timingSafeEqual 做一次（这是 Node 侧的标准写法）：');
console.log(`    两段 32 字节签名相等？ ${timingSafeEqual(Buffer.from(signature), Buffer.from(nodeSig))}`);
try {
  timingSafeEqual(Buffer.from('abc'), Buffer.from('abcd'));
} catch (err) {
  console.log(`    长度不等时抛错：${err.name}: ${err.message}`);
  console.log('    这是刻意设计：长度不同本身就泄漏了信息，库强制调用方自己处理。');
  console.log('    HMAC 的输出长度天然固定，所以这个坑在实践中几乎不会遇到。');
}

// ===========================================================================
console.log('\n--- 6. 实战一：Webhook 签名校验（含防重放）---');
// ===========================================================================
// 真实场景：支付平台回调你的接口，请求头带 X-Signature。
// 如果你的实现只签 body，攻击者可以把这个请求**原样重放**一百次（重复扣款/重复发货）。
// 所以业界惯例是把**时间戳**一起签进去，并规定"超过 5 分钟的请求一律拒绝"。
const webhookSecret = randomBytes(32); // 演示用随机密钥（真实场景由平台分配、存在环境变量里）
const webhookKey = await subtle.importKey('raw', webhookSecret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

/**
 * 平台侧：给一个请求生成签名头。
 * @param {CryptoKey} key 签名密钥
 * @param {number} timestamp 秒级时间戳
 * @param {string} body 原始请求体（**必须是未经解析的原始字节串**）
 * @returns {Promise<string>} 形如 "t=1700000000,v1=<hex>" 的签名头
 */
async function signWebhook(key, timestamp, body) {
  // 关键：签名内容 = 时间戳 + '.' + 原始 body
  const payload = encoder.encode(`${timestamp}.${body}`);
  const sig = await subtle.sign('HMAC', key, payload);
  return `t=${timestamp},v1=${toHex(sig)}`;
}

/**
 * 接收侧：校验签名头。
 * @param {CryptoKey} key 校验密钥
 * @param {string} header 收到的签名头
 * @param {string} body 原始请求体
 * @param {number} nowSeconds 当前时间（秒）
 * @param {number} toleranceSeconds 允许的时间偏差
 * @returns {Promise<{ ok: boolean, reason: string }>}
 */
async function verifyWebhook(key, header, body, nowSeconds, toleranceSeconds = 300) {
  // 1) 解析头部。字段缺失就拒绝 —— 不要"没签名就放行"。
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=')));
  const timestamp = Number(parts.t);
  const providedHex = parts.v1;
  if (!Number.isFinite(timestamp) || !providedHex) {
    return { ok: false, reason: '签名头格式不合法' };
  }
  // 2) 防重放：时间戳太旧（或来自未来太久）就拒绝
  const age = Math.abs(nowSeconds - timestamp);
  if (age > toleranceSeconds) {
    return { ok: false, reason: `时间戳超出容忍窗口（${age}s > ${toleranceSeconds}s），可能是重放攻击` };
  }
  // 3) 重算签名并用**常量时间**比较。
  //    这里用 subtle.verify，它本身就是常量时间比较，比"算出来再自己比"更安全。
  const expected = await subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`));
  const provided = Buffer.from(providedHex, 'hex');
  if (provided.length !== expected.byteLength) {
    // 长度不等时直接拒绝：这一步会泄漏"长度对不对"，但签名长度是公开的固定值，无所谓
    return { ok: false, reason: '签名长度不合法' };
  }
  const ok = timingSafeEqual(provided, Buffer.from(expected));
  return { ok, reason: ok ? '验证通过' : '签名不匹配（密钥不对或内容被篡改）' };
}

const webhookBody = '{"event":"payment.succeeded","orderId":"A1001","amount":1999}';
const nowSeconds = 1_700_000_000; // 固定"当前时间"让输出可复现
const goodHeader = await signWebhook(webhookKey, nowSeconds, webhookBody);
console.log(`  请求体：${webhookBody}`);
console.log(`  签名头结构：t=1700000000,v1=<64 个 hex 字符的 HMAC 签名>`);
console.log(`    （签名头内容不打印：密钥是随机生成的，签名也就每次不同；`);
console.log(`      但它一定满足这个结构 —— 段落数 ${goodHeader.split(',').length}，t 段长度 ${goodHeader.split(',')[0].length}，v1 段签名长度 ${goodHeader.split(',')[1].length - 3}）`);

const scenarios = [
  ['正常请求（时间戳=现在）', goodHeader, webhookBody, nowSeconds],
  ['body 被改成 1999 -> 1', goodHeader, '{"event":"payment.succeeded","orderId":"A1001","amount":1}', nowSeconds],
  ['原样重放（时间戳是 10 分钟前）', goodHeader, webhookBody, nowSeconds + 600],
  ['攻击者自己签名（密钥不对）', await signWebhook(attackerKey, nowSeconds, webhookBody), webhookBody, nowSeconds],
  ['缺少签名头', 't=1700000000', webhookBody, nowSeconds],
];
for (const [label, header, body, now] of scenarios) {
  const result = await verifyWebhook(webhookKey, header, body, now);
  console.log(`    ${label.padEnd(26)} ok=${String(result.ok).padEnd(6)} ${result.reason}`);
}
console.log('  要点：');
console.log('    1) 必须签"时间戳 + 原始 body"，而不是解析后的对象 —— ');
console.log('       JSON.parse 再 JSON.stringify 会改变键顺序/空格，签名必然对不上；');
console.log('       所以要在框架里拿**原始请求字节**（Express 里用 express.raw()）。');
console.log('    2) 时间戳窗口是防重放的关键，配合"事件 ID 去重表"效果更好。');
console.log('    3) 校验失败要返回 401/400 并**记录日志**（失败突然增多往往是攻击信号）。');

// ===========================================================================
console.log('\n--- 7. 实战二：一个迷你 API 签名协议 ---');
// ===========================================================================
// 云厂商 SDK 的签名思路（简化版）：
//   1) 把请求要素按**固定顺序**拼成一个规范化字符串；
//   2) HMAC 签名；
//   3) 把签名放进请求头。
// 服务端收到后做同样的事，再比对 —— 中途改了任何要素，签名都会变。
// 这里用固定字节，是为了让"签名值"这段输出可复现（生产环境当然要用 randomBytes(32)）
const apiSecret = new Uint8Array(32).fill(0x5a);
const apiKey = await subtle.importKey('raw', apiSecret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

/**
 * 构造规范化请求串并签名。
 * @param {CryptoKey} key
 * @param {{method: string, path: string, query: Record<string,string>, body: string, timestamp: number, nonce: string}} req
 * @returns {Promise<{ canonical: string, signature: string }>}
 */
async function signRequest(key, req) {
  // ① 查询参数按 key 排序 —— 顺序不固定会导致签名不可复现
  const canonicalQuery = Object.keys(req.query)
    .sort()
    .map((k) => `${k}=${req.query[k]}`)
    .join('&');
  // ② 固定字段顺序、固定分隔符，每一行一个要素（这是 SigV4 的做法）
  const canonical = [
    req.method.toUpperCase(),
    req.path,
    canonicalQuery,
    String(req.timestamp),
    req.nonce,
    req.body,
  ].join('\n');
  const sig = await subtle.sign('HMAC', key, encoder.encode(canonical));
  return { canonical, signature: toHex(sig) };
}

const apiReq = {
  method: 'POST',
  path: '/api/v1/orders',
  query: { page: '1', size: '20', sort: 'createdAt' }, // 注意：故意乱序传进来
  body: '{"item":"键盘","qty":1}',
  timestamp: nowSeconds,
  nonce: 'f3c1a9e0-1b2d-4b8e-9a77-0d5e6f7a8b9c', // 一次性随机串，防重放
};
const signedReq = await signRequest(apiKey, apiReq);
console.log('  ① 规范化字符串（服务端会按同样规则重算，所以格式必须写进协议文档）：');
for (const line of signedReq.canonical.split('\n')) {
  console.log(`       ${line}`);
}
console.log(`  ② 签名(hex)：${signedReq.signature}`);

console.log('\n  服务端校验：改动任意一个要素，签名都会对不上；');
const apiMutationCases = [
  ['原样重发', apiReq],
  ['改 query（size 20 -> 200）', { ...apiReq, query: { ...apiReq.query, size: '200' } }],
  ['改 body（qty 1 -> 99）', { ...apiReq, body: '{"item":"键盘","qty":99}' }],
  ['改 path（orders -> refunds）', { ...apiReq, path: '/api/v1/refunds' }],
  ['只改了 query 的书写顺序（值相同）', { ...apiReq, query: { sort: 'createdAt', size: '20', page: '1' } }],
];
for (const [label, mutated] of apiMutationCases) {
  const recomputed = await signRequest(apiKey, mutated);
  const same = recomputed.signature === signedReq.signature;
  console.log(`    ${label.padEnd(28)} 签名相同？ ${String(same).padEnd(6)} ${same ? '-> 放行' : '-> 拒绝(401)'}`);
}
console.log('  最后一行特别重要：**值相同但顺序不同**的 query 也通过了，');
console.log('  因为规范化时我们做了排序 —— 这就是"规范化（canonicalization）"存在的意义：');
console.log('  把"语义相同但写法不同"的输入统一成唯一形式，否则同一请求会算出不同签名。');
console.log('  真实协议里还要规范化：header 大小写、URL 编码方式、body 的空白与换行、时间格式。');
console.log('  每一处没考虑到的差异，都会变成线上"偶发验签失败"的幽灵 bug。');

// ===========================================================================
console.log('\n--- 8. 小结 ---');
// ===========================================================================
const summary = [
  '1) HMAC = 带密钥的摘要。同时给完整性（改不了）与真实性（无密钥签不出）。',
  '2) 三步走：importKey("raw", 密钥字节, {name:"HMAC", hash:"SHA-256"}, extractable, usages)',
  '   -> subtle.sign("HMAC", key, 数据) -> subtle.verify("HMAC", key, 签名, 数据)。',
  '3) 哈希算法属于密钥属性：SHA-256 的密钥不能用来算 SHA-512，要重新 importKey。',
  '4) 交叉验证：subtle.sign 与 createHmac(算法, 密钥).update(数据).digest() 必须逐字节一致；',
  '   本文件已对 4 种哈希算法、多组消息双向验证通过。对不上 = 你的入参字节没对齐。',
  '5) 绝不用 === 比较签名：字符串比较会提前返回，泄漏"匹配了几个前缀字符"。',
  '   优先用 subtle.verify（内部常量时间），Node 侧用 timingSafeEqual（要求等长）。',
  '6) 签名的两个经典事故：verify 参数写成 (algo, key, 数据, 签名) 静默返回 false；',
  '   一边用 hex 一边用 base64 导致永远对不上。',
  '7) 签名必须覆盖**所有**关键要素 + 时间戳 + 一次性 nonce，否则会有重放/篡改漏洞。',
  '8) HMAC 需要双方共享密钥 —— 所以"客户端要能验证"的场景请改用非对称签名（06 篇）。',
];
for (const line of summary) console.log(`  ${line}`);
