/**
 * ============================================================================
 * 知识点：口令派生密钥 —— PBKDF2 原理、盐与迭代次数、deriveBits/deriveKey，为什么口令不能直接当密钥
 * ============================================================================
 *
 * 【所属分类】35_web_crypto —— Web Crypto API
 * 【难度等级】进阶
 * 【前置知识】35_web_crypto/02_digest_hashing.js、35_web_crypto/03_hmac_signing.js、35_web_crypto/04_aes_gcm_encryption.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    **口令（password）**是人脑想出来、用键盘敲进去的一串字符；
 *    **密钥（key）**是一段具有足够熵的随机字节。
 *    两者完全不是一回事，中间的转换过程就叫 **KDF（Key Derivation Function，密钥派生函数）**。
 *    **PBKDF2**（Password-Based Key Derivation Function 2，RFC 8018）是最经典、最通用的一个 KDF，
 *    它做三件事：
 *      (a) **把口令"嚼碎"**：用口令当 HMAC 的密钥，反复迭代成千上万次，
 *          把"一串字符"变成"一串看起来完全随机、且长度任你指定的字节"；
 *      (b) **加盐（salt）**：混入一段随机字节，让同样的口令每次派生出不同的密钥；
 *      (c) **故意变慢**：迭代次数就是"成本旋钮"，把攻击者的穷举成本抬高几万到几百万倍。
 *    它的核心公式（简化）：
 *        DK = PBKDF2(HMAC-SHA256, 口令, 盐, 迭代次数 c, 输出长度 dkLen)
 *    注意它是**确定性**的：口令 + 盐 + 迭代次数 + 哈希算法 相同，输出就永远相同 ——
 *    这正是"登录时能校验口令是否正确"的基础。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) **用户口令存储**：数据库里绝不能存明文口令，也不能存"裸摘要"（02 篇演示过彩虹表）。
 *        正确做法是存：算法 + 迭代次数 + 盐 + 派生结果。
 *    (b) **用口令加密文件/笔记**（1Password、Bitwarden、VeraCrypt 这类工具的思路）：
 *        用户只记一个主口令，程序用它派生出真正的加密密钥，去解开数据。
 *    (c) **从口令导出 API 密钥**：让用户自己选一个"种子短语"，
 *        应用派生出确定性的密钥用于签名（助记词钱包就是这样做的）。
 *    (d) **端到端加密的密钥协商**：双方共享一个口令时，用它派生出会话密钥
 *        （比直接用口令加密安全得多）。
 *    (e) **密钥拉伸（key stretching）**：把熵不足的口令"拉长"到 AES-256 需要的 32 字节。
 *
 * 3. 核心语法要点
 *    (a) **第一步：把口令导入成一个"基础密钥"**
 *          const baseKey = await subtle.importKey(
 *            'raw',
 *            new TextEncoder().encode(password),   // 口令的 UTF-8 字节
 *            'PBKDF2',                             // 注意：这里写的就是 'PBKDF2'
 *            false,                                // 基础密钥本身不需要导出
 *            ['deriveBits', 'deriveKey'],          // 用途是"派生"
 *          );
 *    (b) **第二步：派生**
 *          // 只想要原始字节（比如要 32 字节给别的算法用）
 *          const bits = await subtle.deriveBits(
 *            { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
 *            baseKey,
 *            256,   // dkLen 位数，**必须是 8 的倍数**（否则 OperationError）
 *          );
 *          // 或者一步到位，直接得到一个可用的 CryptoKey
 *          const aesKey = await subtle.deriveKey(
 *            { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
 *            baseKey,
 *            { name: 'AES-GCM', length: 256 },   // 想派生成什么密钥
 *            false,                               // extractable
 *            ['encrypt', 'decrypt'],
 *          );
 *    (c) **盐（salt）**：随机字节，通常 16 字节。
 *        `crypto.getRandomValues(new Uint8Array(16))`。
 *        **每个用户/每次加密都要独立生成**；它**不是秘密**，但必须与派生产物一起保存。
 *        没有盐 = 彩虹表直接命中；盐重复 = 彩虹表一次命中多个用户。
 *    (d) **迭代次数**：越大越慢（对攻击者和对你都一样）。业界做法是
 *        "在目标硬件上测出耗时约 100ms 的迭代次数"，再往上取整数倍。
 *        OWASP 目前的建议：PBKDF2-HMAC-SHA256 取 **600,000 次**以上。
 *    (e) **哈希算法**：新代码用 SHA-256（或 SHA-512）。SHA-1 只用于兼容老数据。
 *
 * 4. 常见陷阱
 *    - **拿口令当密钥直接用**：`importKey('raw', 口令字节, 'AES-GCM', ...)` 会抛
 *      DataError（AES 只接受 16/24/32 字节）。就算你截断/补零凑够 32 字节，
 *      也还是**不安全**：口令的熵只有几十比特，且没有盐 —— 攻击者用一张字典就能穷举。
 *    - **不加盐**：同一个口令在两个用户那里派生出一模一样的密钥。
 *      攻击者破解一个 = 破解一片；彩虹表也能预先算好直接查。
 *    - **盐写死成常量**：等于没加盐。盐必须是**每个用户各不相同**的随机值。
 *    - **迭代次数太低**：迭代 1000 次在现代 GPU 面前形同虚设。
 *      迭代次数是**存的**（跟密文/口令哈希一起存），所以可以随硬件升级而调大；
 *      但调大后老数据仍按老参数校验 —— 于是需要在用户登录成功时"顺手升级"。
 *    - **`deriveBits` 的 length 不是 8 的倍数**：抛 `OperationError: length must be a multiple of 8`。
 *      要 256 位就写 256，不是 32（32 位只有 4 字节）。
 *    - **迭代次数写 0**：抛 `OperationError: iterations cannot be zero`。
 *    - **忘记盐也要存**：丢了盐就永远派不出同一个密钥，数据等于永久锁死。
 *    - **以为 PBKDF2 是最好的**：PBKDF2 只消耗 CPU、几乎不占内存，
 *      因此对 GPU、FPGA、ASIC 都很"友好" —— 攻击者能大规模并行。
 *      更新一代的 **scrypt**（内存硬）和 **argon2id**（内存硬 + 抗侧信道）更好。
 *      Web Crypto 里没有它们，Node 里有 `crypto.scrypt`（见 26_node_core/13_crypto_hash.js）。
 *    - **口令直接当 Kerberos/API 密钥用**：任何"人记得住"的字符串都应该先过 KDF。
 *    - **口令强度仍是前提**：KDF 只是把成本抬高几万倍，
 *      "123456" 加了盐、迭代 60 万次，仍然是第一条被猜出来的口令。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 35_web_crypto/05_key_derivation_pbkdf2.js
 *
 * 【预期输出】
 *   1) 演示"拿口令当 AES 密钥"为什么行不通（DataError 的 try/catch）；
 *   2) 用固定盐 + 固定迭代次数做 PBKDF2，与 node:crypto 的 pbkdf2Sync 逐字节交叉验证；
 *   3) 演示盐的作用（同口令 + 不同盐 = 完全不同的密钥）；
 *   4) 用 deriveKey 一步派生出 AES-GCM 密钥，跑通"口令 -> 密钥 -> 加密 -> 解密"整条链；
 *   5) 错误口令的解密失败（try/catch）+ 三种非法参数的报错演示；
 *   6) 迭代次数的实测耗时对比与"100 ms 原则"，以及口令验证记录该怎么存。
 *   全程退出码 0，不访问网络。
 * ============================================================================
 */

import { pbkdf2Sync, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const subtle = globalThis.crypto.subtle;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** 把 BufferSource 转成十六进制字符串。 */
const toHex = (bytes) => Buffer.from(bytes).toString('hex');

// ===========================================================================
console.log('--- 1. 为什么不能拿口令直接当密钥 ---');
// ===========================================================================
const password = 'correct horse battery staple'; // 来自那幅著名的 XKCD 漫画
console.log(`  示例口令："${password}"（${encoder.encode(password).length} 字节 UTF-8）`);
console.log('  四个理由，每一个都足以否决"直接用口令当密钥"：');
console.log('    ① **长度不对**：AES 只接受 16 / 24 / 32 字节，口令长度完全随机。');
console.log('    ② **熵不足**：口令是人想出来的，真实分布高度集中，');
console.log('       一本常用口令字典（几亿条）就能覆盖相当大比例的真实口令。');
console.log('    ③ **没有盐**：同一个口令在任何系统里派生出同一个密钥，攻击者可以批量预计算。');
console.log('    ④ **速度太快**：SHA-256 每秒能算几十亿次，攻击者穷举起来毫无压力。');

console.log('\n  亲眼看看第 ① 条（把口令直接当 AES 密钥导入）：');
try {
  await subtle.importKey('raw', encoder.encode(password), { name: 'AES-GCM' }, false, ['encrypt']);
  console.log('    居然成功了？（不同运行时的校验严格程度不同）');
} catch (err) {
  console.log(`    抛错 ${err.name}: ${err.message}`);
}
console.log('  有人会"聪明地"把口令截断或补零到 32 字节 —— 然后就踩了第 ②③④ 条：');
const naiveKey = new Uint8Array(32);
naiveKey.set(encoder.encode(password).subarray(0, 32)); // 补零凑够 32 字节
console.log(`    补零后的"密钥"：${toHex(naiveKey)}`);
console.log('    注意末尾那一串 00 —— 可预测的填充不会增加任何熵。');
console.log('    这种"密钥"配合彩虹表/字典，破解难度比想象的低几个数量级。');
console.log('    正确做法：走 PBKDF2（本节剩下的内容），它一次解决上面全部四个问题。');

// ===========================================================================
console.log('\n--- 2. PBKDF2 的输入输出：一步把口令变成密钥 ---');
// ===========================================================================
// 固定盐 + 固定迭代次数，只为让输出可复现。
// 【生产环境】盐必须每次随机生成（crypto.getRandomValues(new Uint8Array(16))）。
const DEMO_SALT = new Uint8Array([
  0x9f, 0x8b, 0x2c, 0x41, 0xd7, 0x0e, 0x53, 0xaa, 0x61, 0x38, 0xf4, 0x2d, 0x90, 0x77, 0xbb, 0x05,
]);
const DEMO_ITERATIONS = 100_000; // 演示用；生产建议 ≥ 600,000（见小节 6）
console.log(`  盐（演示用固定值）：${toHex(DEMO_SALT)}（${DEMO_SALT.byteLength} 字节）`);
console.log(`  迭代次数（演示用）：${DEMO_ITERATIONS.toLocaleString()}`);
console.log('  （生产环境：盐随机生成、迭代次数按硬件调高 —— 下面两个值都只是为了让输出稳定）');

// 第一步：把口令导入成"基础密钥"。注意算法名就是 'PBKDF2'。
const baseKey = await subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);
console.log(`\n  importKey 得到的基础密钥：`);
console.log(`    type      = ${baseKey.type}           （'secret'：对称密钥）`);
console.log(`    algorithm = ${baseKey.algorithm.name}（这里只声明"用于派生"，还没指定哈希）`);
console.log(`    usages    = [${baseKey.usages.join(', ')}]`);
console.log(`    extractable = ${baseKey.extractable}（口令的字节不留在 JS 里更安全）`);
console.log('    注意：PBKDF2 的哈希算法不在基础密钥上，而在 deriveBits/deriveKey 的参数里，');
console.log('          这一点与 HMAC（哈希是密钥属性）不同，容易记混。');

// 第二步：派生出 256 位（32 字节）密钥材料
const derivedBits = await subtle.deriveBits(
  { name: 'PBKDF2', salt: DEMO_SALT, iterations: DEMO_ITERATIONS, hash: 'SHA-256' },
  baseKey,
  256, // 位数！必须是 8 的倍数。要 32 字节就写 256
);
console.log(`\n  deriveBits(..., 256) 得到：`);
console.log(`    长度 ${derivedBits.byteLength} 字节 = 256 位（正好是 AES-256 需要的规格）`);
console.log(`    内容（hex）：${toHex(derivedBits)}`);
console.log('    这串东西看起来完全随机 —— 但它是**确定性**的：');
console.log('    同样的口令 + 同样的盐 + 同样的迭代次数 + 同样的哈希 = 永远同样的结果。');

const againBits = await subtle.deriveBits(
  { name: 'PBKDF2', salt: DEMO_SALT, iterations: DEMO_ITERATIONS, hash: 'SHA-256' },
  baseKey,
  256,
);
console.log(`    再算一次，结果相同吗？ ${toHex(againBits) === toHex(derivedBits)}  <- 确定性是"能校验口令"的前提`);

// ===========================================================================
console.log('\n--- 3. 与 node:crypto 交叉验证 ---');
// ===========================================================================
// node:crypto 的 pbkdf2 是 OpenSSL 实现，与 Web Crypto 完全独立。
// 只要"口令字节、盐、迭代次数、哈希、输出长度"五项一致，结果必须逐字节相同 ——
// 这同时验证了参数有没有写错（比如忘了把迭代次数传进去）。
const crossCases = [
  ['SHA-256', 'sha256', 32],
  ['SHA-512', 'sha512', 64],
  ['SHA-1', 'sha1', 20],
];
console.log('  同一份口令 + 同一份盐 + 同样的迭代次数，两侧结果对比：');
for (const [webHash, nodeHash, bytes] of crossCases) {
  const webBits = await subtle.deriveBits(
    { name: 'PBKDF2', salt: DEMO_SALT, iterations: DEMO_ITERATIONS, hash: webHash },
    baseKey,
    bytes * 8,
  );
  // node 侧可以直接传字符串口令（默认 UTF-8），也可以传字节；两者等价
  const nodeBits = pbkdf2Sync(password, Buffer.from(DEMO_SALT), DEMO_ITERATIONS, bytes, nodeHash);
  const same = toHex(webBits) === toHex(nodeBits);
  console.log(`    PBKDF2-HMAC-${webHash.padEnd(7)} ${String(bytes).padStart(2)} 字节  一致？ ${same}   前 16 字节 ${toHex(webBits).slice(0, 32)}…`);
}

console.log('\n  用字符串口令 vs 字节口令，node 侧的结果一致吗？');
const nodeStr = pbkdf2Sync(password, Buffer.from(DEMO_SALT), DEMO_ITERATIONS, 32, 'sha256');
const nodeBytes = pbkdf2Sync(encoder.encode(password), Buffer.from(DEMO_SALT), DEMO_ITERATIONS, 32, 'sha256');
console.log(`    一致？ ${toHex(nodeStr) === toHex(nodeBytes)}  <- 说明口令在两侧都被当作 UTF-8 字节处理`);
console.log('    这正是跨语言/跨端实现 PBKDF2 的关键：**口令的编码方式必须写进协议**。');
console.log('    （用 UTF-8 是社区共识；但历史上有些系统用了 Latin-1 或自己做了 NFKC 归一化，');
console.log('      对接老系统时会出现"两边算法一样但结果不同"的幽灵问题。）');

console.log('\n  再验证：迭代次数变了、盐变了，结果是否如预期地完全不同？');
const iterationProbe = [1000, DEMO_ITERATIONS, DEMO_ITERATIONS + 1];
for (const iter of iterationProbe) {
  const bits = await subtle.deriveBits({ name: 'PBKDF2', salt: DEMO_SALT, iterations: iter, hash: 'SHA-256' }, baseKey, 256);
  console.log(`    迭代 ${String(iter).padStart(7)} 次 -> ${toHex(bits).slice(0, 32)}…`);
}
console.log('    迭代次数只差 1，结果就完全不同 —— 迭代次数是**密钥的一部分**，必须存下来。');

// ===========================================================================
console.log('\n--- 4. 盐（salt）：不是秘密，但绝不能省 ---');
// ===========================================================================
console.log('  先澄清一个常见误解：**盐不是密钥，不需要保密**。');
console.log('  它和密文/口令哈希一起明文存储。它的唯一使命是"让预计算失效"。\n');

const saltA = new Uint8Array(16).fill(0x11);
const saltB = new Uint8Array(16).fill(0x22);
const saltQuick = 50_000; // 演示用的迭代次数，让这一段跑得快一点
const keyA = await subtle.deriveBits({ name: 'PBKDF2', salt: saltA, iterations: saltQuick, hash: 'SHA-256' }, baseKey, 256);
const keyB = await subtle.deriveBits({ name: 'PBKDF2', salt: saltB, iterations: saltQuick, hash: 'SHA-256' }, baseKey, 256);
console.log('  同一个口令，只换盐：');
console.log(`    盐=1111…11 -> ${toHex(keyA)}`);
console.log(`    盐=2222…22 -> ${toHex(keyB)}`);
console.log(`    两者相同吗？ ${toHex(keyA) === toHex(keyB)}  <- 完全不同`);

console.log('\n  盐解决了两个具体问题：');
const saltBenefits = [
  ['防彩虹表', '攻击者不能再预计算"口令 -> 密钥"的大表；每个盐都要重新算一遍'],
  ['防批量破解', '用户 A 和用户 B 恰好用了同一个口令时，各自的盐让密钥不同 —— 攻击者无法"破解一个 = 破解一片"'],
  ['防信息泄漏', '没盐时，数据库里两条记录相同就说明两人口令相同 —— 这本身就是隐私泄漏'],
  ['做域分离', '同一个口令要派生"登录校验值"和"加密密钥"两份材料时，用不同的盐把它们彻底分开'],
];
for (const [k, v] of saltBenefits) console.log(`    - ${k}：${v}`);

console.log('\n  盐的规格建议：');
const saltSpec = [
  ['长度', '≥ 16 字节（128 位）；PBKDF2 标准要求至少 8 字节，业界普遍用 16 或 32'],
  ['来源', 'crypto.getRandomValues()（密码学安全随机），绝不用 Math.random / 时间戳 / 用户名'],
  ['唯一性', '每个用户、每次加密都独立生成一份；绝不复用'],
  ['保密性', '**不需要保密**，与派生产物一起明文存储'],
  ['存储', '必须存！丢了盐 = 数据永久无法解密（或口令永远校验不过）'],
  ['其他场景', '同一条口令要派生多个用途的密钥时，用不同盐（或加"用途标签"）做域分离'],
];
for (const [k, v] of saltSpec) console.log(`    ${k.padEnd(8)} ${v}`);

console.log('\n  随机盐长什么样（只打印结构化信息，因为它是随机值）：');
for (let i = 0; i < 3; i += 1) {
  const randomSalt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  console.log(`    第 ${i + 1} 份随机盐：长度 ${randomSalt.byteLength} 字节，全 0？ ${randomSalt.every((b) => b === 0)}`);
}
const saltSet = new Set();
for (let i = 0; i < 1000; i += 1) saltSet.add(toHex(globalThis.crypto.getRandomValues(new Uint8Array(16))));
console.log(`    生成 1000 份随机盐，去重后 ${saltSet.size} 份（无碰撞）—— 这是"唯一性"的直观验证。`);

// ===========================================================================
console.log('\n--- 5. deriveKey：一步派生出可用的 AES 密钥 ---');
// ===========================================================================
// 如果你只是想要"一个能用来加密的密钥"，deriveKey 比 deriveBits 少两步（导入）。
// 它同时把"派生"和"导入"合成一个操作，而且派生的密钥可以设为**不可导出**。
console.log('  完整链条：用户口令 -> PBKDF2 -> AES-GCM 密钥 -> 加密 -> 解密\n');

const aeadKey = await subtle.deriveKey(
  { name: 'PBKDF2', salt: DEMO_SALT, iterations: DEMO_ITERATIONS, hash: 'SHA-256' },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false, // extractable = false：密钥字节永远出不来，只能用它加解密
  ['encrypt', 'decrypt'],
);
console.log(`  deriveKey 得到的密钥：`);
console.log(`    type      = ${aeadKey.type}`);
console.log(`    algorithm = ${aeadKey.algorithm.name}，length = ${aeadKey.algorithm.length} 位`);
console.log(`    usages    = [${aeadKey.usages.join(', ')}]`);
console.log(`    extractable = ${aeadKey.extractable}  <- 连开发者都导不出原始字节，密钥更难泄漏`);

// 用它加密一段"用口令保护的数据"
const secretNote = '这是我用口令保护起来的私密笔记（演示内容）';
const iv = globalThis.crypto.getRandomValues(new Uint8Array(12)); // 每次加密都必须新生成
const noteCipher = new Uint8Array(
  await subtle.encrypt({ name: 'AES-GCM', iv }, aeadKey, encoder.encode(secretNote)),
);
console.log(`\n  加密 "${secretNote}"`);
console.log(`    IV 已随机生成（${iv.byteLength} 字节）`);
console.log(`    密文+tag 共 ${noteCipher.byteLength} 字节（不使用固定 IV，所以这里不打印密文内容）`);

const notePlain = decoder.decode(await subtle.decrypt({ name: 'AES-GCM', iv }, aeadKey, noteCipher));
console.log(`  用同一把密钥解密：${notePlain === secretNote ? '成功' : '失败'}`);
console.log(`    内容："${notePlain}"`);

console.log('\n  换成"错误的口令"再来一次（这是最常见的失败路径，必须 try/catch）：');
const wrongPassword = 'correct horse battery stapl'; // 只少了一个字母 e
console.log(`    错误口令："${wrongPassword}"（和真口令只差一个字符）`);
const wrongBaseKey = await subtle.importKey('raw', encoder.encode(wrongPassword), 'PBKDF2', false, ['deriveKey']);
const wrongAeadKey = await subtle.deriveKey(
  { name: 'PBKDF2', salt: DEMO_SALT, iterations: DEMO_ITERATIONS, hash: 'SHA-256' },
  wrongBaseKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['decrypt'],
);
try {
  const leaked = await subtle.decrypt({ name: 'AES-GCM', iv }, wrongAeadKey, noteCipher);
  console.log(`    居然解出："${decoder.decode(leaked)}"（不该发生）`);
} catch (err) {
  console.log(`    解密失败 -> ${err.name}（认证失败）`);
  console.log('    注意这里**没有**"口令错误"这种专门的错误类型 —— GCM 只知道"密钥不对导致认证失败"，');
  console.log('    这恰好是好设计：攻击者无法区分"口令错"还是"数据被改"，得不到额外信息。');
  console.log('    另一个细节：口令只差一个字符，派生出的密钥就已经面目全非（雪崩效应）——');
  console.log('    所以不存在"口令差不多对"这种事，要么完全正确，要么完全打不开。');
}

// ===========================================================================
console.log('\n--- 6. 迭代次数：唯一的"成本旋钮"，怎么定 ---');
// ===========================================================================
// 迭代次数不改变"能不能破解"，只改变"破解要花多久"。它的取值原则是：
//   在你**最慢的那台生产服务器**上测一次派生，选一个耗时约 100ms 的次数。
// 下面在测试机上实测几个量级（耗时会随机器波动，只看量级即可）。
console.log('  实测（本机，仅供量级参考）：');
const timingResults = [];
for (const iterations of [1_000, 10_000, 100_000, 600_000]) {
  const started = process.hrtime.bigint();
  await subtle.deriveBits({ name: 'PBKDF2', salt: DEMO_SALT, iterations, hash: 'SHA-256' }, baseKey, 256);
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  timingResults.push([iterations, ms]);
  console.log(`    迭代 ${String(iterations).padStart(7).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 次 -> 约 ${ms.toFixed(1)} ms`);
}
console.log('    （毫秒数每次运行都会有波动，这是正常的；这里只看"量级"和"线性关系"。）');
console.log('    耗时与迭代次数近似成正比（PBKDF2 是纯 CPU 的迭代，没有内存开销）。');
console.log('    正常登录时用户感知不到这几十毫秒；但攻击者要为**每一个猜测**付同样的成本。\n');

console.log('  为什么"变慢"能救命？算一笔账：');
const guessRates = [
  ['无 KDF（裸 SHA-256）', '现代 GPU 约 100 亿次/秒', '几十亿条口令字典：几分钟'],
  ['PBKDF2 迭代 1,000', '约 100 万次/秒', '几亿条字典：几十分钟'],
  ['PBKDF2 迭代 600,000', '约 2,000 次/秒', '同样字典：几年到几十年'],
];
for (const [scheme, rate, cost] of guessRates) {
  console.log(`    ${scheme.padEnd(20)} ${rate.padEnd(24)} ${cost}`);
}
console.log('    注意：这是"单张显卡"的量级估算，攻击者会用成百上千张卡 —— 但仍然被拉高了好几个数量级。');
console.log('    而且**口令强度才是根本**：字典攻击只覆盖"常见口令"，一个真正的长随机口令，');
console.log('    无论攻击者有多少算力都无从下手。');

console.log('\n  迭代次数的工程建议：');
const iterationAdvice = [
  ['取值目标', '在最慢的生产服务器上约 100 ms（登录接口还能接受）'],
  ['当前参考值', 'PBKDF2-HMAC-SHA256 ≥ 600,000 次（OWASP 建议值，随硬件发展逐年上调）'],
  ['必须存下来', '迭代次数是派生的一部分，不存就无法校验/解密'],
  ['可以升级', '硬件变快了就调大；但老数据仍用老参数 —— 所以在"用户登录成功那一刻"'],
  ['', '顺手用新参数重新派生并覆盖存储（渐进式升级，用户无感）'],
  ['别忘了限流', 'KDF 同时也保护了攻击者（每次尝试都很慢）—— 但服务端要限制登录尝试频率，'],
  ['', '否则攻击者可以把"慢"转嫁成你的 CPU 负载（一种 DoS）'],
];
for (const [k, v] of iterationAdvice) console.log(`    ${k.padEnd(10)} ${v}`);

// ===========================================================================
console.log('\n--- 7. 三种非法参数的报错（都在 try/catch 里）---');
// ===========================================================================
console.log('  ① deriveBits 的长度不是 8 的倍数：');
try {
  await subtle.deriveBits({ name: 'PBKDF2', salt: DEMO_SALT, iterations: 1000, hash: 'SHA-256' }, baseKey, 100);
} catch (err) {
  console.log(`     ${err.name}: ${err.message}`);
  console.log('     100 位不是整字节，算法拒绝。想取 12 字节就写 96。');
}
console.log('\n  ② 迭代次数为 0：');
try {
  await subtle.deriveBits({ name: 'PBKDF2', salt: DEMO_SALT, iterations: 0, hash: 'SHA-256' }, baseKey, 256);
} catch (err) {
  console.log(`     ${err.name}: ${err.message}`);
  console.log('     迭代 0 次 = 没有做任何拉伸，等于裸 HMAC —— 库直接拒绝。');
}
console.log('\n  ③ 在只有 deriveBits 用途的密钥上用 deriveKey（用途不匹配）：');
const bitsOnlyKey = await subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
try {
  await subtle.deriveKey({ name: 'PBKDF2', salt: DEMO_SALT, iterations: 1000, hash: 'SHA-256' }, bitsOnlyKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  console.log('     居然成功了？');
} catch (err) {
  console.log(`     ${err.name}: ${err.message}`);
  console.log('     用途（usages）在 importKey 时就定死了 —— 这是最小权限原则的体现。');
}
console.log('\n  ④ 盐为空（很多实现会悄悄接受，但这是危险信号）：');
const emptySaltBits = await subtle.deriveBits({ name: 'PBKDF2', salt: new Uint8Array(0), iterations: 1000, hash: 'SHA-256' }, baseKey, 256);
console.log(`     空盐居然被接受了，仍然派生出 ${emptySaltBits.byteLength} 字节 ——`);
console.log('     但这等于没加盐（所有用户共用"空盐"），彩虹表照样有效。');
console.log('     算法库不会替你检查"参数够不够安全"，安全责任在调用方。');

// ===========================================================================
console.log('\n--- 8. 口令派生的两种典型用法 ---');
// ===========================================================================
console.log('  用法一：**校验用户口令**（登录场景）——注意这不是"加密"，是"比对"');
console.log('    注册时：salt = 随机 16 字节；dk = PBKDF2(口令, salt, 600000, 32)');
console.log('            存库：algo$iterations$salt$dk（全部明文存，只有 dk 与口令相关）');
console.log('    登录时：按存的参数重算 dk\'，与存的 dk 做**常量时间比较**（见 03 篇）。');
console.log('    为什么不用 digest 而用 PBKDF2？因为 PBKDF2 慢 —— 慢就是它的安全价值。\n');

/**
 * 模拟一次"注册"：生成口令验证记录。
 * @param {string} pwd 用户口令
 * @param {number} iterations 迭代次数
 * @returns {Promise<string>} PHC 风格的口令哈希串
 */
async function hashPassword(pwd, iterations) {
  const salt = randomBytes(16); // 每个用户一份独立随机盐
  const dk = pbkdf2Sync(pwd, salt, iterations, 32, 'sha256');
  // PHC 风格的字符串格式：$算法$参数$盐$哈希（参数与盐都明文写进去，方便将来升级）
  return `$pbkdf2-sha256$i=${iterations}$${salt.toString('base64url')}$${dk.toString('base64url')}`;
}

/**
 * 模拟一次"登录"：校验口令。
 * @param {string} pwd 待校验的口令
 * @param {string} stored 存库的 PHC 串
 * @returns {boolean} 是否匹配
 */
function verifyPassword(pwd, stored) {
  const [, algo, params, saltB64, hashB64] = stored.split('$');
  if (algo !== 'pbkdf2-sha256') throw new Error(`不认识的算法：${algo}`);
  const iterations = Number(params.replace('i=', ''));
  const salt = Buffer.from(saltB64, 'base64url');
  const expected = Buffer.from(hashB64, 'base64url');
  const actual = pbkdf2Sync(pwd, salt, iterations, expected.length, 'sha256');
  // 常量时间比较：绝不能用 actual.toString('hex') === hashB64
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const storedRecordA = await hashPassword('hunter2', 100_000);
const storedRecordB = await hashPassword('hunter2', 100_000); // 同一个口令，另一个用户
console.log('  两个用户用了**同一个口令**，存库记录长这样（盐是随机生成的，这里只展示结构）：');
console.log('    用户 A：$pbkdf2-sha256$i=100000$<16 字节随机盐的 base64url>$<32 字节派生值的 base64url>');
console.log('    用户 B：$pbkdf2-sha256$i=100000$<16 字节随机盐的 base64url>$<32 字节派生值的 base64url>');
console.log(`    A 的字段个数：${storedRecordA.split('$').length - 1}（算法 / 参数 / 盐 / 派生值）`);
console.log(`    A 中盐的解码长度：${Buffer.from(storedRecordA.split('$')[3], 'base64url').byteLength} 字节`);
console.log(`    A 中派生值的解码长度：${Buffer.from(storedRecordA.split('$')[4], 'base64url').byteLength} 字节`);
console.log(`    两条记录相同吗？ ${storedRecordA === storedRecordB}`);
console.log('    因为盐不同，所以不同 —— 攻击者看不出"这两个用户口令一样"，也无法一次破解两人。');
console.log('    （盐与派生值在真实系统里也是明文存储的，不算泄漏；）');
console.log('      真正的秘密只有"口令"本身。）\n');
console.log(`    A 用对口令校验：${verifyPassword('hunter2', storedRecordA)}`);
console.log(`    A 用错口令校验：${verifyPassword('hunter3', storedRecordA)}`);
console.log(`    同一个口令去校验 B 的记录（B 也用 hunter2）：${verifyPassword('hunter2', storedRecordB)}`);
console.log('      两条记录内容不同（盐不同），但各自用自己的盐重算后都能通过 ——');
console.log('      校验的从来不是"哈希长什么样"，而是"口令 + 该用户的盐"这个组合。');

console.log('\n  用法二：**用口令加密数据**（密码管理器 / 加密笔记）');
console.log('    派生出的密钥可以直接当 AES-GCM 密钥用（本文件小节 5 已演示），');
console.log('    但如果你要"用派生密钥再加密口令哈希"，那属于把两件事混在一起，别这么做。');
console.log('    需要同时"校验口令"和"用口令解密数据"时，标准做法是：');
console.log('      · 从同一次 PBKDF2 里用**不同的盐或不同的长度区间**取出两段材料，');
console.log('        一段当"校验值"，一段当"加密密钥"（这叫域分离，domain separation）。');

// ===========================================================================
console.log('\n--- 9. PBKDF2 的局限：它不是终点 ---');
// ===========================================================================
console.log('  PBKDF2 的弱点：**只烧 CPU，不吃内存**。');
console.log('  攻击者可以用显卡（几千个核心）或专用芯片（ASIC）把成本压得极低。');
console.log('  新一代 KDF 的改进方向是"内存硬（memory-hard）"：每次计算都要占用大量内存，');
console.log('  而内存恰恰是显卡/ASIC 最难堆的资源。\n');
const kdfCompare = [
  ['PBKDF2', '1999', '只有 CPU 迭代', 'Web Crypto 支持；Node 支持；兼容性最好'],
  ['scrypt', '2009', '内存硬', 'Node 内置（crypto.scrypt）但 Web Crypto 没有；参数需调内存'],
  ['argon2id', '2015', '内存硬 + 抗侧信道，密码哈希竞赛冠军', '需要第三方库（如 argon2），Node 无内置'],
];
for (const [name, year, feature, avail] of kdfCompare) {
  console.log(`    ${name.padEnd(9)} ${year}  ${feature}`);
  console.log(`    ${''.padEnd(9)}      可用性：${avail}`);
}
console.log('\n  Node 里的 scrypt 长这样（一行就能看出"内存硬"的实现方式）：');
const scryptStarted = process.hrtime.bigint();
const scryptResult = scryptSync(password, DEMO_SALT, 32, { N: 16384, r: 8, p: 1 });
const scryptMs = Number(process.hrtime.bigint() - scryptStarted) / 1e6;
console.log(`    scryptSync(口令, 盐, 32, { N: 16384, r: 8, p: 1 }) -> ${toHex(scryptResult)}`);
console.log(`      耗时约 ${scryptMs.toFixed(1)} ms，N=16384 大约占用 16 MB 内存（每次计算都要）。`);
console.log('      参数含义：N 是 CPU/内存成本，r 是块大小，p 是并行度；');
console.log('      默认 N=16384 是 node 的默认值，生产环境通常往上调。');
console.log('\n  选型建议：');
console.log('    · 只能在浏览器里跑（Web Crypto）-> 用 PBKDF2，把迭代次数调到最大可接受值；');
console.log('    · 纯 Node 服务端、能装依赖 -> 用 argon2id（首选）或 scrypt；');
console.log('    · 要跟老系统兼容 -> 继续用 PBKDF2，但记录里带上算法名，方便将来升级。');

// ===========================================================================
console.log('\n--- 10. 小结 ---');
// ===========================================================================
const summary = [
  '1) 口令 ≠ 密钥：口令长度不对、熵不足、无盐可预计算、哈希太快 —— 四个问题都必须解决。',
  '2) PBKDF2 用"HMAC + 盐 + 大量迭代"把口令拉成密钥，一次解决上面四个问题。',
  '3) 三步 API：importKey("raw", 口令字节, "PBKDF2", false, ["deriveBits","deriveKey"])',
  '   -> deriveBits(参数, baseKey, 位数) 或 deriveKey(参数, baseKey, 目标算法, ...)。',
  '   哈希算法写在**派生参数**里（不在密钥上），位数必须是 8 的倍数。',
  '4) 盐：随机、唯一、≥16 字节、不需保密、必须保存。它的作用是废掉预计算（彩虹表）。',
  '5) 迭代次数：成本旋钮，目标是"生产服务器上约 100ms"，PBKDF2-SHA256 目前建议 ≥60 万次；',
  '   它也是密钥的一部分，必须存下来，并支持渐进式升级。',
  '6) 交叉验证通过：subtle.deriveBits 与 node:crypto 的 pbkdf2Sync 在 SHA-1/256/512 下',
  '   逐字节一致 —— 前提是口令编码（UTF-8）、盐、迭代次数、输出长度全部对齐。',
  '7) 口令校验记录 = 算法 + 迭代次数 + 盐 + 派生结果，比较时用常量时间比较。',
  '8) PBKDF2 只烧 CPU，GPU/ASIC 友好；能选的话优先 argon2id / scrypt。',
];
for (const line of summary) console.log(`  ${line}`);
