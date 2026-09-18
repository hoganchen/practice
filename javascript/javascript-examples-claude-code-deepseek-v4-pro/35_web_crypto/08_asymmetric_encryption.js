/**
 * ============================================================================
 * 知识点：非对称加密 —— RSA-OAEP 与 ECDH 密钥协商（公钥怎么用来"加密"）
 * ============================================================================
 *
 * 【所属分类】35_web_crypto —— Web Crypto API
 * 【难度等级】高级
 * 【前置知识】35_web_crypto/04_aes_gcm_encryption.js、35_web_crypto/05_key_derivation_pbkdf2.js、35_web_crypto/06_ecdsa_keypair.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    06 篇通篇讲的是**签名**，只在对照表里留了一句「要用公钥加密就用 RSA-OAEP 或 ECDH」——
 *    只点名，没实现。本篇把它补齐。先记住这张**方向表**，这是最容易记混的地方：
 *
 *       签名（06 篇）  ：私钥 sign  ->  公钥 verify   「我签的，谁都能验」
 *       加密（本篇）   ：公钥 encrypt -> 私钥 decrypt  「谁都能加密给我，只有我能看」
 *
 *    方向正好相反。原因很直观：**私钥是唯一的秘密**，所以"只有私钥持有者能做的事"
 *    只能有两种 —— 要么是"证明身份"（签名），要么是"偷看内容"（解密）。
 *    非对称加密有两条完全不同的技术路线，本篇各实现一遍：
 *      (a) **RSA-OAEP**：真的有一个"用公钥加密字节"的运算。
 *          公钥里含模数 n 和指数 e，加密就是 c = m^e mod n；私钥含 d，解密是 m = c^d mod n。
 *          **OAEP** 是配套的填充方案（Optimal Asymmetric Encryption Padding），
 *          没有它，RSA 就是个能被轻易攻破的"教科书算法"（本篇会亲手复现攻击）。
 *      (b) **ECDH**（Elliptic Curve Diffie-Hellman，椭圆曲线迪菲-赫尔曼）：
 *          它**不是加密**，而是**密钥协商**。双方各自生成一对临时密钥、交换公钥，
 *          然后各自用"自己的私钥 + 对方的公钥"独立算出一个**相同的共享密钥**。
 *          这个共享密钥再经 HKDF 派生，就变成一把 AES-GCM 密钥，用来加密真正的数据。
 *    两条路线的关系：RSA-OAEP 是"公钥直接加密"，ECDH 是"协商出对称密钥再加密"。
 *    后者是当今的主流（TLS 1.3 已经删掉了 RSA 密钥传输，只剩 ECDHE）。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) **混合加密（hybrid encryption）—— 非对称加密真正的用法**：
 *        非对称加密慢且容量极小（RSA-2048 一次只能加密 190 字节），
 *        所以真实系统从来不用它加密业务数据，而是用它**保护一把对称密钥**：
 *          ① 发送方随机生成一把 AES 密钥（DEK）；
 *          ② 用接收方的**公钥**把 DEK 加密（RSA-OAEP）或协商出共享密钥（ECDH）；
 *          ③ 用 DEK 通过 AES-GCM 加密真正的数据（因为快、且无长度限制）；
 *          ④ 把"被保护的 DEK + 密文"一起发出去。
 *        这正是 PGP、S/MIME、JWE、TLS 证书体系、各种"信封加密"的共同骨架。
 *    (b) **配置/密钥分发**：服务端启动时从 KMS 拉取用公钥加密过的配置，
 *        私钥只在进程内存里，磁盘上永远没有明文密钥（结合 07 篇的密钥生命周期）。
 *    (c) **前向保密（forward secrecy）**：ECDH 用**每次会话新生成的临时密钥对**，
 *        于是"今天的私钥泄漏了，也解不开昨天录下的流量"。
 *        这是 TLS 1.3 强制要求 ECDHE 的根本原因。
 *    (d) **端到端加密消息**：Signal、WhatsApp 的会话建立就是"ECDH 协商 + 双棘轮"。
 *    (e) **物联网 / 设备配网**：设备内置公钥，App 用公钥把 Wi-Fi 口令传给设备。
 *    (f) **不安全的通道上传输秘密**：HTTPS 之外再套一层应用层加密，
 *        防止中间代理、网关、日志系统看到明文。
 *
 * 3. 核心语法要点
 *    (a) **RSA-OAEP 密钥对**：
 *          const pair = await subtle.generateKey(
 *            { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
 *            true,                       // extractable
 *            ['encrypt', 'decrypt'],     // 公钥拿 encrypt、私钥拿 decrypt，Web Crypto 会自动分配
 *          );
 *        `publicExponent` 就是 e，工业界固定用 65537（= `[0x01, 0x00, 0x01]`）。
 *        `hash` 同时决定 OAEP 的摘要算法和最大明文长度（见下面的容量公式）。
 *        注意：**RSA 的密钥生成很慢**（2048 位约几十毫秒，4096 位约几百毫秒），
 *        而且不能像 AES 那样每个请求生成一次 —— 必须复用密钥对。
 *    (b) **加解密**：
 *          const ct = await subtle.encrypt({ name: 'RSA-OAEP' }, pair.publicKey, plainBytes);
 *          const pt = await subtle.decrypt({ name: 'RSA-OAEP' }, pair.privateKey, ct);
 *        密文长度**永远等于模长**（RSA-2048 就是 256 字节），与明文长度无关。
 *        这也意味着"密文长度会泄漏"：看到一串 256 字节的密文，就知道对方用的是 RSA-2048。
 *    (c) **ECDH 密钥对与协商**：
 *          const pair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
 *          const shared = await subtle.deriveBits({ name: 'ECDH', public: 对方公钥 }, 自己的私钥, 256);
 *        **公钥的 usages 是空数组**（它不"做"任何运算，只是被对方拿去用）。
 *        `deriveBits` 的第三参是"要多少位"，P-256 最多 256 位（要更长的密钥请用 HKDF 扩展）。
 *        同样的密钥对换成 `deriveKey`，就能一步直接得到 AES 密钥（内部帮你做了派生）。
 *    (d) **HKDF**：把 ECDH 的原始输出变成"能用的对称密钥"：
 *          const base = await subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey']);
 *          const aesKey = await subtle.deriveKey(
 *            { name: 'HKDF', hash: 'SHA-256', salt, info: encoder.encode('my-app/v1/session') },
 *            base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
 *        `salt` 加随机性；`info` 做**域分离**（同一份共享密钥派生出不同用途的多把密钥）。
 *        KDF 的概念与 PBKDF2 的对比见 05 篇，这里只用到"提取 + 扩展"这一面。
 *    (e) **为什么 ECDH 输出不能直接用**：椭圆曲线点有数学结构（不是均匀随机字节），
 *        而且双方还可能协商出"同一个低熵密钥"。HKDF 的 extract 步骤把这点残余结构抹掉。
 *        **协商出共享密钥后直接当 AES 密钥用是常见错误**，务必过一遍 KDF。
 *
 * 4. 常见陷阱
 *    - **把签名和加密的方向记反**（本篇最想纠正的一件事）：
 *      加密是"**公钥加、私钥解**"，签名是"**私钥签、公钥验**"。
 *      一个口诀：**能公开的那把钥匙，只能"锁"（加密）或"验"（验签）**。
 *    - **想用同一把密钥对既签名又加密**：RSA 数学上可行，但**绝对不能这么用**。
 *      交叉协议攻击（cross-protocol attack）会利用"同一份密钥材料出现在两种协议里"，
 *      例如把一份签名当作密文来解密，从而套出信息。**一个用途一对密钥**是铁律。
 *    - **以为 ECDSA 的密钥能用来加密**：不能。ECDSA 只能签名验签，
 *      想加密要用 ECDH（不同算法，密钥对不通用）。
 *    - **用 RSA 加密大文件**：超过容量上限直接抛 `OperationError`（本篇会实测触发），
 *      而且就算不超限也会慢到无法接受。永远走混合加密。
 *    - **用 RSA 时忘记 padding / 自己实现 padding**：教科书 RSA 是**确定性**的，
 *      而且有**可乘同态性**（`E(m1)·E(m2) = E(m1·m2)`），攻击者不需要私钥就能伪造出
 *      "某条已知消息的合法密文"，进而实施选择密文攻击。本篇会亲手复现这个性质。
 *      Web Crypto **根本不提供无填充的 RSA**（连 PKCS#1 v1.5 也不提供），
 *      这是刻意的 API 设计：把危险的路直接封死（和"不提供 ECB"是同一个思路）。
 *    - **以为 PKCS#1 v1.5 更"标准"所以更安全**：恰恰相反。
 *      v1.5 存在 Bleichenbacher / Manger 这类填充预言攻击，历史上打穿过多套协议
 *      （旧版 TLS、某些智能卡、若干库）。**新代码一律用 OAEP。**
 *    - **ECDH 少了身份认证**：裸 ECDH 无法防**中间人**（MITM）——
 *      攻击者可以和双方各自协商出一把密钥，然后转发。
 *      必须把协商出来的公钥**用签名/证书绑定身份**（这就是 TLS 证书的作用）。
 *    - **ECDH 复用同一对静态密钥**：失去前向保密性。会话密钥必须用**临时（ephemeral）**密钥对，
 *      用完即弃 —— 这就是 ECDHE 里那个 E。
 *    - **忘了把共享密钥用完就丢**：临时私钥和共享密钥用完应从内存里抹掉（能抹则抹）。
 *    - **从 ECDH 的原始位里"截一段"当密钥**：曲线不同、位序不同，很容易出错，
 *      还可能截到有结构的部分。**一律走 HKDF**，而不是手工 slice。
 *    - **公钥真的可以随便公开吗**：可以公开，但要保证**完整性**——
 *      被换掉的公钥等于把信道交给了攻击者（所以公钥要靠证书链或带外指纹来分发，
 *      比如 SSH 首次连接时的指纹确认）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 35_web_crypto/08_asymmetric_encryption.js
 *   纯本地示例：不访问网络。RSA 密钥生成会占用几十到一百多毫秒，属于正常现象。
 *   所有随机值（密钥、OAEP 随机种子、IV、盐）只打印长度与验证结论。
 *
 * 【预期输出】
 *   1) 方向对照：签名与加密的密钥用法正好相反（一张表 + 代码对照）；
 *   2) RSA-OAEP 完整流程：生成密钥对 -> 公钥加密 -> 私钥解密，
 *      与 node:crypto 双向交叉验证；
 *   3) 亲手复现"教科书 RSA"的确定性 + 可乘同态性，说明 OAEP 到底防住了什么，
 *      并验证 PKCS#1 v1.5 的密文在 OAEP 下解不开；
 *   4) 实测 RSA 的明文容量上限（2048/SHA-256 是 190 字节，191 就抛 OperationError），
 *      并给出正确的混合加密写法；
 *   5) ECDH：双方各自生成密钥对、交换公钥、各自独立算出**同一个**共享密钥
 *      （打印两侧结果是否相等），并与 node:crypto 的 diffieHellman 交叉验证；
 *   6) HKDF 把共享密钥派生为 AES-GCM 密钥（与 node 的 hkdfSync 交叉验证），
 *      完成"协商 -> 加密 -> 解密"闭环；
 *   7) 前向保密：静态密钥 vs 临时密钥（ECDHE）的差别；
 *   8) RSA-OAEP 与 ECDH 的取舍表，以及签名/加密方向的总表；
 *   9) 小结。全程退出码 0。
 * ============================================================================
 */

import {
  constants,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  privateDecrypt,
  publicEncrypt,
} from 'node:crypto';

const subtle = globalThis.crypto.subtle;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** 把 BufferSource 转成十六进制字符串。 */
const toHex = (bytes) => Buffer.from(bytes).toString('hex');

/** 按"显示宽度"补空格（中文占 2 列），只为了终端里对齐好看。 */
const displayWidth = (s) => [...s].reduce((w, ch) => w + (/[一-鿿＀-￯]/.test(ch) ? 2 : 1), 0);
const padLabel = (s, width) => s + ' '.repeat(Math.max(0, width - displayWidth(s)));

// ===========================================================================
console.log('--- 1. 先纠正最容易记混的一件事：方向 ---');
// ===========================================================================
console.log('  06 篇（签名）与本篇（加密）用的是**两把不同的钥匙**，方向正好相反：');
console.log('');
console.log(`    ${padLabel('', 16)}${padLabel('用哪把钥匙操作', 20)}${padLabel('谁能做', 18)}目的`);
console.log(
  `    ${padLabel('签名', 16)}${padLabel('私钥 sign', 20)}${padLabel('只有自己', 18)}证明"这条消息确实是我发的"`,
);
console.log(
  `    ${padLabel('', 16)}${padLabel('公钥 verify', 20)}${padLabel('任何人', 18)}任何人可验证，无需持有秘密`,
);
console.log(
  `    ${padLabel('加密', 16)}${padLabel('公钥 encrypt', 20)}${padLabel('任何人', 18)}让"只有私钥持有者"能读`,
);
console.log(
  `    ${padLabel('', 16)}${padLabel('私钥 decrypt', 20)}${padLabel('只有自己', 18)}只有我能解开`,
);
console.log('');
console.log('  一句话记忆：**能公开的那把钥匙，只会"锁"和"验"，不会"开"和"签"。**');
console.log('  推论：加密只能"发给对方"，不能"用对方的公钥解出对方发来的东西" ——');
console.log('        想读别人发给你的密文，你必须持有**自己的**私钥。');
console.log('');
console.log('  第二个必须记住的点：**一个用途一对密钥**。');
console.log('  RSA 的数学允许同一对密钥既签名又加密，但这是事故隐患：');
console.log('  协议 A 里的"签名"可能被协议 B 当成"密文"来解释，从而泄漏信息');
console.log('  （这类攻击叫 cross-protocol attack）。生产系统里，签名密钥和加密密钥必须分开。');

// ===========================================================================
console.log('\n--- 2. RSA-OAEP：真的用公钥加密一串字节 ---');
// ===========================================================================
console.log('  ① 生成 RSA-OAEP 密钥对（这一步是**慢**的，所以密钥对必须复用）：');
const rsaGenStart = Date.now();
const rsaPair = await subtle.generateKey(
  {
    name: 'RSA-OAEP',
    modulusLength: 2048, // 模长（位）。2048 是目前的最低推荐值
    publicExponent: new Uint8Array([1, 0, 1]), // 65537，工业界固定值
    hash: 'SHA-256', // 同时决定 OAEP 的摘要与"能加密多长"
  },
  true, // extractable：本篇要和 node:crypto 交叉验证，所以需要导出
  ['encrypt', 'decrypt'], // Web Crypto 会自动分配：公钥拿 encrypt、私钥拿 decrypt
);
console.log(`     generateKey 耗时约 ${Date.now() - rsaGenStart}ms —— 对比 AES 的 generateKey 是微秒级。`);
console.log(`     公钥：type=${rsaPair.publicKey.type}  usages=[${rsaPair.publicKey.usages.join(', ')}]`);
console.log(`     私钥：type=${rsaPair.privateKey.type}  usages=[${rsaPair.privateKey.usages.join(', ')}]`);
console.log('     注意 usages 的分配：**公钥只能 encrypt、私钥只能 decrypt**，');
console.log('     这与 06 篇的 ECDSA（公钥 verify、私钥 sign）是同一种"方向思维"。');
const rsaSpki = new Uint8Array(await subtle.exportKey('spki', rsaPair.publicKey));
const rsaPkcs8 = new Uint8Array(await subtle.exportKey('pkcs8', rsaPair.privateKey));
console.log(`     公钥 spki ${rsaSpki.byteLength} 字节 / 私钥 pkcs8 ${rsaPkcs8.byteLength} 字节`);
console.log(`     对比 06 篇的 P-256：公钥 91 字节、私钥 138 字节 —— RSA 大了一个数量级。`);

console.log('\n  ② 公钥加密、私钥解密（完整闭环）：');
const secretMessage = 'DB_PASSWORD=hunter2;HOST=db.internal';
const secretBytes = encoder.encode(secretMessage);
const rsaCipher = new Uint8Array(await subtle.encrypt({ name: 'RSA-OAEP' }, rsaPair.publicKey, secretBytes));
console.log(`     明文 "..."（${secretBytes.byteLength} 字节）`);
console.log(`     密文 ${rsaCipher.byteLength} 字节 —— **固定等于模长**（2048 位 = 256 字节）`);
console.log('     密文长度与明文长度无关：这本身就是一条元数据泄漏（对手知道你在用 RSA-2048）。');
const rsaPlain = await subtle.decrypt({ name: 'RSA-OAEP' }, rsaPair.privateKey, rsaCipher);
console.log(`     私钥解密 -> "${decoder.decode(rsaPlain)}"`);
console.log(`     与原文一致？ ${decoder.decode(rsaPlain) === secretMessage}`);

console.log('\n  ③ 同一明文加密两次，密文一样吗？');
const rsaCipher2 = new Uint8Array(await subtle.encrypt({ name: 'RSA-OAEP' }, rsaPair.publicKey, secretBytes));
console.log(`     两次密文相同？ ${toHex(rsaCipher) === toHex(rsaCipher2)}  <- **不同**，因为 OAEP 每次都会生成随机种子`);
console.log('     这一点非常重要：它让"同一句明文"每次加密结果都不同，攻击者无法靠比对密文猜内容。');
console.log('     （对称加密的随机 IV 是同一个道理，见 04 篇。）');

console.log('\n  ④ 换错钥匙会怎样：');
const otherRsaPair = await subtle.generateKey(
  { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['encrypt', 'decrypt'],
);
try {
  await subtle.decrypt({ name: 'RSA-OAEP' }, otherRsaPair.privateKey, rsaCipher);
  console.log('     解开了？不应该。');
} catch (err) {
  console.log(`     用别人的私钥解密 -> ✗ ${err.name}（OAEP 的填充校验直接失败，不会给出乱码）`);
}
const rsaTampered = new Uint8Array(rsaCipher);
rsaTampered[10] ^= 0x01;
try {
  await subtle.decrypt({ name: 'RSA-OAEP' }, rsaPair.privateKey, rsaTampered);
  console.log('     篡改后解开了？不应该。');
} catch (err) {
  console.log(`     密文翻转 1 个比特 -> ✗ ${err.name}  <- OAEP 自带完整性校验，篡改必失败`);
}

console.log('\n  ⑤ 与 node:crypto 交叉验证（双向）：');
const nodeRsaPublic = createPublicKey({ key: Buffer.from(rsaSpki), format: 'der', type: 'spki' });
const nodeRsaPrivate = createPrivateKey({ key: Buffer.from(rsaPkcs8), format: 'der', type: 'pkcs8' });
console.log(`     node 能解析这两个 DER 吗？ 公钥 ${nodeRsaPublic.asymmetricKeyType} / 私钥 ${nodeRsaPrivate.asymmetricKeyType}`);

console.log('     [方向 A] Web Crypto 加密 -> node:crypto 解密');
const nodeDecrypted = privateDecrypt(
  // oaepHash 必须与 generateKey 时的 hash 一致，否则一定失败
  { key: nodeRsaPrivate, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
  Buffer.from(rsaCipher),
);
console.log(`       node 解出："${nodeDecrypted.toString('utf8')}"  一致？ ${nodeDecrypted.toString('utf8') === secretMessage}`);

console.log('     [方向 B] node:crypto 加密 -> Web Crypto 解密');
const nodeCipher = publicEncrypt(
  { key: nodeRsaPublic, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
  encoder.encode('from node:crypto'),
);
console.log(`       Web Crypto 解出："${decoder.decode(await subtle.decrypt({ name: 'RSA-OAEP' }, rsaPair.privateKey, nodeCipher))}"`);

console.log('     [方向 C] node 用 **PKCS#1 v1.5** 填充加密，Web Crypto 用 OAEP 解：');
const nodePkcs1 = publicEncrypt(
  { key: nodeRsaPublic, padding: constants.RSA_PKCS1_PADDING },
  encoder.encode('v1.5 padded'),
);
try {
  await subtle.decrypt({ name: 'RSA-OAEP' }, rsaPair.privateKey, nodePkcs1);
  console.log('       解开了？不应该。');
} catch (err) {
  console.log(`       ✗ ${err.name}：填充方案不匹配，两种 padding **完全不兼容**。`);
  console.log('         跨系统对接时"RSA 解密失败"的头号原因就是 padding 没对齐（OAEP vs v1.5）。');
}

// ===========================================================================
console.log('\n--- 3. 为什么必须有 padding：亲手复现教科书 RSA 的两个致命性质 ---');
// ===========================================================================
console.log('  先做个思想实验。**教科书的 RSA**（也就是"没有任何填充"的裸 RSA）是这样的：');
console.log('     加密：c = m^e mod n        解密：m = c^d mod n');
console.log('  它有两个致命性质，一个比一个糟。');
console.log('');
console.log('  性质一：**确定性**。同一份明文，加密一万次结果都一样。');
console.log('          攻击者只要拿到"密文 -> 明文"的一对样本，就能靠比对密文猜出别人的内容');
console.log('          （比如猜"老板给没给这个人转账"，加密一遍比一比就知道了）。');
console.log('  性质二：**可乘同态性**。因为 (m1·m2)^e = m1^e · m2^e，所以：');
console.log('          E(m1) · E(m2) ≡ E(m1·m2)  (mod n)');
console.log('          攻击者**不需要私钥**，只要把两个密文相乘，就凭空造出了一条合法密文！');
console.log('          经典的破坏方式：冒充服务器去解密密文 c，实际让它解 c·r^e，');
console.log('          拿到结果后除以 r 就得到了原文（这叫选择密文攻击）。');
console.log('');
console.log('  Web Crypto **根本不提供无填充的 RSA**，所以下面用 node:crypto 的 RSA_NO_PADDING 来复现：');
const { publicKey: rawPublic, privateKey: rawPrivate } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const rawJwk = rawPublic.export({ format: 'jwk' }); // JWK 里 n 和 e 都是 **base64url** 编码，不是 hex
const modulusBytes = Buffer.from(rawJwk.n, 'base64url');
const publicExponent = BigInt(`0x${Buffer.from(rawJwk.e, 'base64url').toString('hex')}`);

/** 把一个整数按模长左补零，变成 RSA 运算需要的大端字节串。 */
function intToBlock(value) {
  const hex = value.toString(16).padStart(modulusBytes.length * 2, '0');
  return Buffer.from(hex, 'hex');
}
/** 把大端字节串还原成整数（省略前导零的十六进制）。 */
const blockToInt = (buf) => BigInt(`0x${buf.toString('hex') || '0'}`);

const m1 = 3n;
const m2 = 5n;
const e1 = publicEncrypt({ key: rawPublic, padding: constants.RSA_NO_PADDING }, intToBlock(m1));
const e2 = publicEncrypt({ key: rawPublic, padding: constants.RSA_NO_PADDING }, intToBlock(m2));
console.log(`     模长 n = ${modulusBytes.length} 字节；公开指数 e = ${publicExponent}（工业界固定值 65537）`);
console.log(`     E(3) 与 E(5) 都已算出（各 ${e1.length} 字节，内容随机-looking，不打印）`);
console.log(`     性质一验证：E(3) 再算一次，结果相同吗？ ${e1.equals(publicEncrypt({ key: rawPublic, padding: constants.RSA_NO_PADDING }, intToBlock(m1)))}  <- **确定性**`);

const product = (blockToInt(e1) * blockToInt(e2)) % blockToInt(modulusBytes);
const recovered = privateDecrypt(
  { key: rawPrivate, padding: constants.RSA_NO_PADDING },
  intToBlock(product),
);
console.log(`     性质二验证：把两个密文相乘取模，再用私钥解 —— 得到 ${blockToInt(recovered)}`);
console.log(`                 而 3 × 5 = 15 —— **攻击者手里没有私钥，却造出了 E(15) 的合法密文**。`);
console.log('     这就是"教科书 RSA 不安全"的全部含义：不是密码学不够强，而是**缺了随机性与完整性**。');
console.log('');
console.log('  填充方案要做的事，正好补上这两点：');
console.log('    · OAEP 在明文里混入一段**随机种子**，让同样的明文每次加密结果都不同（破确定性）；');
console.log('    · OAEP 的填充结构带**冗余校验**，解密时会验证，解不出"结构合法"就报错（破同态伪造）。');
console.log('    · OAEP 的随机种子还会经由 MGF1 扩展到整块，使得"篡改密文"几乎必定导致校验失败。');
console.log('    理论上 OAEP 达到 CCA（选择密文攻击）安全，而 PKCS#1 v1.5 达不到 ——');
console.log('    v1.5 历史上的 Bleichenbacher / Manger 攻击打穿过旧版 TLS、VPN、智能卡等一大票系统。');
console.log('    结论：**新代码一律 RSA-OAEP（配 SHA-256），永不使用 v1.5。**');

// ===========================================================================
console.log('\n--- 4. "RSA 只能加密很短的数据"：实测它的容量上限 ---');
// ===========================================================================
console.log('  OAEP 的填充要占掉固定的一部分空间，所以能加密的明文长度有个硬上限：');
console.log('');
console.log('     明文上限 = 模长字节数 - 2 × 摘要长度 - 2');
console.log('');
console.log('  对最常见的 RSA-2048 + SHA-256：256 - 2×32 - 2 = **190 字节**。');
console.log('  实测一下（这就是为什么 RSA 不能用来加密业务数据）：');
for (const size of [188, 190, 191, 256]) {
  try {
    const ct = await subtle.encrypt({ name: 'RSA-OAEP' }, rsaPair.publicKey, new Uint8Array(size));
    console.log(`     ${String(size).padStart(3)} 字节明文 -> ✓ 成功（密文仍是 ${ct.byteLength} 字节）`);
  } catch (err) {
    console.log(`     ${String(size).padStart(3)} 字节明文 -> ✗ ${err.name}: ${err.message}`);
  }
}
console.log('     注意报错信息几乎不给细节 —— 规范刻意如此，避免泄漏"你离上限还差多少"。');
console.log('     顺带一提：190 字节连一条稍长的 JWT 或一份配置都装不下。');

console.log('\n  不同参数的容量对照（按上面的公式算）：');
const capacityRows = [
  ['RSA-2048 + SHA-256', 256, 32, 190],
  ['RSA-2048 + SHA-1', 256, 20, 214],
  ['RSA-3072 + SHA-256', 384, 32, 318],
  ['RSA-4096 + SHA-256', 512, 32, 446],
];
for (const [label, mod, hashLen, max] of capacityRows) {
  console.log(`     ${padLabel(label, 22)}模长 ${mod}B - 2×${hashLen} - 2 = ${max} 字节`);
}
console.log('  再用 RSA-3072 实测一下边界（生成这一步会花 70ms 左右）：');
const rsa3072 = await subtle.generateKey(
  { name: 'RSA-OAEP', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['encrypt', 'decrypt'],
);
for (const size of [318, 319]) {
  try {
    await subtle.encrypt({ name: 'RSA-OAEP' }, rsa3072.publicKey, new Uint8Array(size));
    console.log(`     RSA-3072 ${size} 字节 -> ✓ 成功`);
  } catch (err) {
    console.log(`     RSA-3072 ${size} 字节 -> ✗ ${err.name}（与公式预测的 318 完全吻合）`);
  }
}
console.log('  注意：**把密钥加长来解决容量问题是个陷阱**。4096 位也只是 446 字节，');
console.log('        而密钥生成要几百毫秒、加密慢 4 倍以上。正确的路是混合加密。');

console.log('\n  正确的写法：RSA-OAEP 只用来保护一把对称密钥（混合加密 / 信封加密）：');
const envelopeStart = Date.now();
// ① 生成一次性数据密钥（对称密钥天生就是快的）
const dek = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
// ② 用接收方的公钥保护这把 DEK（32 字节，远低于上限）
const wrappedDek = await subtle.encrypt({ name: 'RSA-OAEP' }, rsaPair.publicKey, await subtle.exportKey('raw', dek));
// ③ 用 DEK 加密真正的数据（长度不受限，速度也快得多）
const payload = 'x'.repeat(50_000) + '|文件末尾的真实内容';
const payloadIv = globalThis.crypto.getRandomValues(new Uint8Array(12));
const payloadCt = await subtle.encrypt({ name: 'AES-GCM', iv: payloadIv }, dek, encoder.encode(payload));
console.log(`     明文 ${encoder.encode(payload).byteLength} 字节`);
console.log(`     被 RSA 保护的部分：${wrappedDek.byteLength} 字节（一把 32 字节的 AES 密钥）`);
console.log(`     AES-GCM 密文：${payloadCt.byteLength} 字节（长度 = 明文 + 16 字节 tag）`);
console.log(`     总耗时 ${Date.now() - envelopeStart}ms —— 绝大部分花在 AES 上，而它处理了 5 万字节。`);
const unwrappedDek = await subtle.decrypt({ name: 'RSA-OAEP' }, rsaPair.privateKey, wrappedDek);
const dekKey = await subtle.importKey('raw', unwrappedDek, { name: 'AES-GCM' }, false, ['decrypt']);
const payloadPlain = decoder.decode(await subtle.decrypt({ name: 'AES-GCM', iv: payloadIv }, dekKey, payloadCt));
console.log(`     接收方解密后与原文一致？ ${payloadPlain === payload}`);
console.log('     这就是 PGP / S/MIME / JWE / TLS 的共同骨架：**非对称保护密钥，对称保护数据**。');

// ===========================================================================
console.log('\n--- 5. ECDH：不是"加密"，而是"双方各自算出同一个秘密" ---');
// ===========================================================================
// 这是本篇最需要"亲眼看到"的一段：双方**各自独立**计算，结果相同。
console.log('  场景：Alice 和 Bob 要在一个完全公开的信道上商量出一把只有他们知道的密钥。');
console.log('  （旁听者能看到他们交换的全部内容，但算不出这把密钥 —— 这就是 DH 的魔力。）');

console.log('\n  ① 双方各自生成一对**临时**密钥（注意 usages 与 RSA 完全不同）：');
const alice = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const bob = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
console.log(`     Alice 私钥 usages=[${alice.privateKey.usages.join(', ')}]  公钥 usages=[${alice.publicKey.usages.join(', ')}]`);
console.log(`     Bob   私钥 usages=[${bob.privateKey.usages.join(', ')}]  公钥 usages=[${bob.publicKey.usages.join(', ')}]`);
console.log('     注意：**ECDH 的公钥 usages 是空数组** —— 它不"做"任何运算，');
console.log('     它只是被对方拿去参与运算的输入。这和 RSA 公钥（usages=[encrypt]）形成鲜明对比，');
console.log('     也说明了 ECDH 的本质：**它是协商，不是加密**。');
const aliceRawPub = new Uint8Array(await subtle.exportKey('raw', alice.publicKey));
const bobRawPub = new Uint8Array(await subtle.exportKey('raw', bob.publicKey));
console.log(`     Alice 公钥 raw ${aliceRawPub.byteLength} 字节、Bob 公钥 raw ${bobRawPub.byteLength} 字节`);
console.log('     （公钥本来就是公开的，交换过程可以被窃听 —— 安全性不依赖于它的保密。）');

console.log('\n  ② 双方各自计算共享密钥 —— 这是整篇最关键的两行代码：');
const aliceShared = new Uint8Array(
  await subtle.deriveBits({ name: 'ECDH', public: bob.publicKey }, alice.privateKey, 256),
);
const bobShared = new Uint8Array(
  await subtle.deriveBits({ name: 'ECDH', public: alice.publicKey }, bob.privateKey, 256),
);
console.log('     Alice 算的是：deriveBits({public: Bob的公钥}, Alice的私钥)');
console.log('     Bob   算的是：deriveBits({public: Alice的公钥}, Bob的私钥)');
console.log(`     输入完全不同，输出长度都是 ${aliceShared.byteLength} 字节（256 位）。`);
console.log(`     **两侧结果完全相同吗？ ${toHex(aliceShared) === toHex(bobShared)}**  <- 这就是密钥协商`);
console.log('     双方都没有把私钥发给对方，也没有任何"把密钥传过去"的动作；');
console.log('     他们只是各自做了一次数学运算，就得到了同一个值。');
console.log('     （内容不打印：它是密钥材料，任何时候都不该出现在日志里。）');

console.log('\n  ③ 第三方能不能算出来？用一个"窃听者"的密钥对试试：');
const eve = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const eveShared = new Uint8Array(
  await subtle.deriveBits({ name: 'ECDH', public: alice.publicKey }, eve.privateKey, 256),
);
console.log(`     Eve 用自己的私钥 + Alice 的公钥算出来的是不是那个共享密钥？ ${toHex(eveShared) === toHex(aliceShared)}`);
console.log('     （Eve 只拿到了两串公开的公钥，算出来的是完全不同的值。）');

console.log('\n  ④ 与 node:crypto 交叉验证（用 diffieHellman 独立算一遍）：');
const alicePkcs8 = new Uint8Array(await subtle.exportKey('pkcs8', alice.privateKey));
// 注意：node 的 createPublicKey 需要的是 **spki**（带算法标识的 DER 包装），
// 不是 65 字节的 raw 曲线点 —— 直接喂 raw 会报 "Failed to read asymmetric key"。
// 这正是 06 篇讲过的 raw / spki 分工，密钥交换场景里同样适用。
const bobSpki = new Uint8Array(await subtle.exportKey('spki', bob.publicKey));
const nodeAlicePrivate = createPrivateKey({ key: Buffer.from(alicePkcs8), format: 'der', type: 'pkcs8' });
const nodeBobPublic = createPublicKey({ key: Buffer.from(bobSpki), format: 'der', type: 'spki' });
const nodeShared = new Uint8Array(
  // 注意这里第三个参数是**对象**：{ privateKey, publicKey }
  diffieHellman({ privateKey: nodeAlicePrivate, publicKey: nodeBobPublic }),
);
console.log(`     node 的 diffieHellman() 输出 ${nodeShared.byteLength} 字节`);
console.log(`     与 Web Crypto 的 deriveBits 结果一致吗？ ${toHex(nodeShared) === toHex(aliceShared)}`);

console.log('\n  ⑤ 换一个曲线（X25519）也是一样的用法，而且体积小得多：');
const x1 = await subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']);
const x2 = await subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']);
const xShared = new Uint8Array(await subtle.deriveBits({ name: 'X25519', public: x2.publicKey }, x1.privateKey, 256));
const xShared2 = new Uint8Array(await subtle.deriveBits({ name: 'X25519', public: x1.publicKey }, x2.privateKey, 256));
console.log(`     X25519 公钥 raw ${new Uint8Array(await subtle.exportKey('raw', x1.publicKey)).byteLength} 字节（P-256 是 65 字节）`);
console.log(`     私钥 pkcs8 ${new Uint8Array(await subtle.exportKey('pkcs8', x1.privateKey)).byteLength} 字节（P-256 是 138 字节）`);
console.log(`     两侧协商结果一致？ ${toHex(xShared) === toHex(xShared2)}`);
console.log('     新协议优先选 X25519（更快、更小、更不易用错）；P-256 兼容性最好，是最稳的默认。');

console.log('\n  ⑥ 为什么 ECDH 的原始输出**不能直接当 AES 密钥**：');
console.log('     · 它是椭圆曲线上的一个点的坐标，带有数学结构，不是均匀随机的字节串；');
console.log('     · 不同曲线/实现可能只在部分字节上一致，直接拿来用会"看起来能跑但不对"；');
console.log('     · 同一对密钥若被复用，原始输出也永远相同（没有随机性）。');
console.log('     所以必须过一遍 **KDF（密钥派生函数）**，标准选择就是 HKDF。');

// ===========================================================================
console.log('\n--- 6. HKDF：把协商结果变成可用的 AES-GCM 密钥 ---');
// ===========================================================================
console.log('  HKDF = HMAC-based KDF，两步走（与 05 篇的 PBKDF2 对照着看）：');
console.log('     extract：HMAC(salt, 共享秘密) —— 把输入"压扁"成一段固定长度的伪随机密钥，');
console.log('              抹掉原材料的数学结构。salt 加随机性，**不必保密**，随公钥一起传即可。');
console.log('     expand ：用 info 作为上下文，把密钥扩展到需要的长度，并实现**域分离**。');
console.log('              info 不必保密，但双方必须完全一致（它是一份"用途标签"）。');
const hkdfSalt = new Uint8Array(16);
for (let i = 0; i < hkdfSalt.length; i += 1) hkdfSalt[i] = (i * 17 + 9) & 0xff;
const hkdfInfo = encoder.encode('demo-app/v1/session-key');

const hkdfBase = await subtle.importKey('raw', aliceShared, 'HKDF', false, ['deriveBits', 'deriveKey']);
const derivedBits = new Uint8Array(
  await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info: hkdfInfo }, hkdfBase, 256),
);
console.log(`\n  ① 派生 256 位密钥材料：得到 ${derivedBits.byteLength} 字节（内容不打印，密钥材料不进日志）`);
const derivedAgain = new Uint8Array(
  await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info: hkdfInfo }, hkdfBase, 256),
);
console.log(`     同样输入再算一次，结果相同？ ${toHex(derivedBits) === toHex(derivedAgain)}（HKDF 是确定性的）`);
console.log(`     与 ECDH 的原始输出相同？   ${toHex(derivedBits) === toHex(aliceShared)}（**当然不同**，HKDF 不是恒等变换）`);

console.log('\n  ② 域分离：只改 info，就能派生出"另一把完全无关的密钥"');
const derivedOtherInfo = new Uint8Array(
  await subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info: encoder.encode('demo-app/v1/mac-key') },
    hkdfBase,
    256,
  ),
);
console.log(`     改 info 后结果不同？ ${toHex(derivedBits) !== toHex(derivedOtherInfo)}`);
console.log('     用途：同一份共享秘密，派生出"加密密钥""认证密钥""导出密钥"多把，互不干扰。');
console.log('     这比"把同一把密钥用于多个目的"安全得多（一把被攻破不会牵连其他）。');

console.log('\n  ③ 与 node:crypto 的 hkdfSync 交叉验证：');
const nodeHkdf = new Uint8Array(
  hkdfSync('sha256', Buffer.from(aliceShared), Buffer.from(hkdfSalt), Buffer.from(hkdfInfo), 32),
);
console.log(`     node hkdfSync 输出 ${nodeHkdf.byteLength} 字节，与 Web Crypto 一致吗？ ${toHex(nodeHkdf) === toHex(derivedBits)}`);
console.log('     （HKDF 是 RFC 5869 标准化的，跨语言实现天然一致，这点比早期的各种"自创 KDF"好太多。）');

// ===========================================================================
console.log('\n--- 7. 闭环：协商 -> 派生 -> 加密 -> 解密 ---');
// ===========================================================================
console.log('  现在把整条链路走通。注意 Bob 那边用的是**自己算出来的**共享密钥，');
console.log('  而不是 Alice 传给他的任何东西 —— 这才是密钥协商的意义。');
// Alice 侧：用她的共享密钥派生 AES 密钥
const aliceAes = await subtle.deriveKey(
  { name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info: hkdfInfo },
  hkdfBase,
  { name: 'AES-GCM', length: 256 },
  false, // 派生出来的密钥同样设为不可导出
  ['encrypt', 'decrypt'],
);
// Bob 侧：完全独立地重复同一套派生（输入是 Bob 那边算出的共享密钥）
const bobHkdfBase = await subtle.importKey('raw', bobShared, 'HKDF', false, ['deriveKey']);
const bobAes = await subtle.deriveKey(
  { name: 'HKDF', hash: 'SHA-256', salt: hkdfSalt, info: hkdfInfo },
  bobHkdfBase,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt'],
);
console.log(`     Alice 派生出的密钥：${aliceAes.algorithm.name}-${aliceAes.algorithm.length}，extractable=${aliceAes.extractable}`);
console.log(`     Bob   派生出的密钥：${bobAes.algorithm.name}-${bobAes.algorithm.length}，extractable=${bobAes.extractable}`);

const sessionIv = globalThis.crypto.getRandomValues(new Uint8Array(12));
const sessionMessage = '会议纪要：下周三 10:00 评审，参会人 Alice、Bob';
const sessionCipher = new Uint8Array(
  await subtle.encrypt({ name: 'AES-GCM', iv: sessionIv }, aliceAes, encoder.encode(sessionMessage)),
);
console.log(`\n     Alice 用**自己派生的**密钥加密（IV 12 字节随机，密文+tag ${sessionCipher.byteLength} 字节）`);
const bobDecrypted = decoder.decode(
  await subtle.decrypt({ name: 'AES-GCM', iv: sessionIv }, bobAes, sessionCipher),
);
console.log(`     Bob 用**自己派生的**密钥解密 -> "${bobDecrypted}"`);
console.log(`     解密成功？ ${bobDecrypted === sessionMessage}`);
console.log('     双方从头到尾没有传输过任何密钥，只交换了两串公开的公钥。');

// ===========================================================================
console.log('\n--- 8. 前向保密：为什么要用"临时"密钥对 ---');
// ===========================================================================
console.log('  ECDH 有两种用法，安全性差别巨大：');
const fsRows = [
  ['静态 ECDH（static）', '双方长期用同一对密钥', '会话密钥永远一样；长期私钥一旦泄漏，**过去录下的所有流量都能解开**'],
  ['临时 ECDH（ECDHE）', '每次会话新生成一对，用完即弃', '私钥泄漏也解不开历史会话 —— 这就是**前向保密**'],
];
for (const [mode, how, consequence] of fsRows) {
  console.log(`     ${padLabel(mode, 32)}${padLabel(how, 26)}${consequence}`);
}
console.log('\n  用代码验证"临时密钥对每次协商结果都不同"（静态密钥对则永远相同）：');
const staticKey = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const staticPeer = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const staticShared1 = toHex(await subtle.deriveBits({ name: 'ECDH', public: staticPeer.publicKey }, staticKey.privateKey, 256));
const staticShared2 = toHex(await subtle.deriveBits({ name: 'ECDH', public: staticPeer.publicKey }, staticKey.privateKey, 256));
console.log(`     静态密钥对协商两次，结果相同？ ${staticShared1 === staticShared2}  <- 每次会话同一把密钥，没有前向保密`);
const eph1 = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const eph2 = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const ephShared1 = toHex(await subtle.deriveBits({ name: 'ECDH', public: staticPeer.publicKey }, eph1.privateKey, 256));
const ephShared2 = toHex(await subtle.deriveBits({ name: 'ECDH', public: staticPeer.publicKey }, eph2.privateKey, 256));
console.log(`     每次新建临时密钥对，结果相同？ ${ephShared1 === ephShared2}  <- 每次会话都是全新的密钥`);
console.log('     TLS 1.3 强制要求 ECDHE，正是因为它把"服务器私钥泄漏"的后果');
console.log('     从"历史流量全部可读"降级为"只有未来被主动中间人的会话有风险"。');

console.log('\n  但 ECDHE 单独用有个致命缺口：**它不认证身份**（裸 DH 无法防中间人）。');
console.log('     Eve 可以分别和 Alice、Bob 各协商一把密钥，然后把两边的话互相转发 ——');
console.log('     双方都以为在跟对方说话。堵住它的办法是**用签名/证书把公钥绑定到身份上**：');
console.log('     Alice 验证"这个公钥确实属于 Bob"（靠 CA 证书或带外指纹），再参与协商。');
console.log('     所以 06 篇的**签名**和本篇的**协商**是配套使用的，不是二选一。');

// ===========================================================================
console.log('\n--- 9. RSA-OAEP 与 ECDH 怎么选 ---');
// ===========================================================================
const compareRows = [
  ['本质', '公钥直接加密字节', '双方各自算出同一个秘密（不是加密）'],
  ['单次容量', '有硬上限：2048/SHA-256 只有 190 字节', '不限（协商出的是定长密钥，数据靠 AES 加密）'],
  ['速度', '慢（一次加密比 AES 慢几个数量级，且随密钥加长急剧变慢）', '快（一次点乘，微秒级；比 RSA 协商快得多）'],
  ['密钥/密文体积', '公钥 294B、私钥 1218B、密文固定 256B', '公钥 65B、私钥 138B、无需传密文'],
  ['前向保密', '不支持（除非每次新生成密钥对，但那就没必要用 RSA 了）', '天然支持（ECDHE）'],
  ['典型用法', '加密一把对称密钥（信封加密）、老系统对接、JWE 的 RSA-OAEP 模式', 'TLS 1.3、Signal/WhatsApp、SSH、现代协议全部用它'],
  ['Web Crypto 支持', 'RSA-OAEP（**只有 OAEP，没有 v1.5、没有裸 RSA**）', 'ECDH（P-256/384/521）+ X25519'],
  ['推荐度', '只在"必须兼容 RSA 生态"时用', '**新设计的默认选择**'],
];
for (const [dim, rsa, ecdh] of compareRows) {
  console.log(`  ${padLabel(dim, 14)}| RSA-OAEP: ${rsa}`);
  console.log(`  ${' '.repeat(14)}| ECDH    : ${ecdh}`);
}

console.log('\n  签名与加密的总对照（本篇与 06 篇一起看）：');
const directionRows = [
  ['私钥做什么', 'sign（签名）', 'decrypt（解密）'],
  ['公钥做什么', 'verify（验签）', 'encrypt（加密）'],
  ['谁持有秘密', '签名方', '解密方（接收方）'],
  ['公开验证 / 公开加密', '任何人可验签', '任何人可加密'],
  ['算法', 'ECDSA / Ed25519 / RSA-PSS', 'RSA-OAEP / ECDH(+HKDF)'],
  ['能加密数据吗', '不能（ECDSA 只能签名）', '能（但对大数据要用混合加密）'],
  ['典型误用', '拿签名当"加密"用（别人能读，只是改不了）', '拿加密当"认证"用（能保密，但不知道谁发的）'],
];
for (const [dim, sign, encrypt] of directionRows) {
  console.log(`  ${padLabel(dim, 26)}| 签名: ${sign}`);
  console.log(`  ${' '.repeat(26)}| 加密: ${encrypt}`);
}
console.log('\n  最后一句提醒：**要保密又要认证，就得两件事都做** ——');
console.log('  先签名再加密（sign-then-encrypt），或者用现成的 AEAD + 证书体系，不要指望一个原语包办。');

// ===========================================================================
console.log('\n--- 10. 小结 ---');
// ===========================================================================
const summary = [
  '1) 方向别记反：**加密 = 公钥加、私钥解；签名 = 私钥签、公钥验**。',
  '   能公开的钥匙只会"锁"（加密）和"验"（验签）。',
  '2) RSA-OAEP 是真的"用公钥加密字节"，但只能加密很短的明文：',
  '   上限 = 模长 - 2×摘要长 - 2，2048/SHA-256 就是 190 字节（本文件实测 191 直接抛错）。',
  '3) **必须有填充**。教科书 RSA 是确定性的、且可乘同态（E(m1)·E(m2) = E(m1·m2)），',
  '   本文件用 node:crypto 的 RSA_NO_PADDING 亲手复现了这两点。',
  '   Web Crypto 干脆不提供无填充 RSA，也不提供 PKCS#1 v1.5 —— 危险的路直接封死。',
  '4) RSA 真正的位置是**混合加密**：非对称保护一把对称密钥，对称保护数据。',
  '   这条骨架同时是 PGP / S/MIME / JWE / TLS 的结构。',
  '5) ECDH 不是加密而是**协商**：双方各自 generateKey、交换公钥、',
  '   各自 deriveBits 得到**同一个**共享密钥（本文件打印了两侧相等）。',
  '   ECDH 的公钥 usages 是空的 —— 它只提供输入，不做运算。',
  '6) 共享密钥**必须过 KDF**（HKDF）：extract 抹掉数学结构，expand 做域分离。',
  '   本文件与 node 的 hkdfSync、diffieHellman 双向交叉验证通过。',
  '7) 前向保密来自**临时密钥对**（ECDHE）：每次会话新生成，私钥泄漏也解不开历史流量。',
  '   TLS 1.3 因此删掉了 RSA 密钥传输，只保留 ECDHE。',
  '8) ECDH 不认证身份，必须靠签名/证书绑定公钥与身份 —— 06 篇和本篇是配套的。',
  '9) 铁律：**一个用途一对密钥**。同一把密钥既签名又加密会招来交叉协议攻击。',
];
for (const line of summary) console.log(`  ${line}`);
