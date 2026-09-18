/**
 * ============================================================================
 * 知识点：node:crypto —— 哈希、HMAC、随机数与密码加盐哈希
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】高级
 * 【前置知识】26_node_core/12_os_and_util.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:crypto 是 Node.js 内置的密码学模块，底层由 OpenSSL 提供实现。
 *    本文件聚焦其中**最常用的四类能力**：
 *      · 哈希（digest）   createHash('sha256')，把任意长度的数据压成固定长度的指纹
 *      · 消息认证码 HMAC  createHmac('sha256', key)，带密钥的哈希，用于校验来源
 *      · 安全随机数       randomBytes / randomUUID / randomInt
 *      · 密码加盐哈希     scrypt / pbkdf2 —— 专门用来存密码，故意"慢"
 *    以下能力**不在本文件范围**（属于更高阶的话题）：
 *    对称加密 createCipheriv、非对称加密 generateKeyPair、签名 createSign、
 *    密钥派生 hkdf、TLS 相关 API。
 *
 * 2. 为什么需要
 *    · 校验完整性：下载一个文件后，用它的 sha256 与官网公布的值对比，
 *      一致就说明没被篡改。哈希是"单向且雪崩"的：改一个字节，结果面目全非。
 *    · 接口签名：调用第三方支付接口时，用双方共享的密钥对参数做 HMAC，
 *      服务端用同样的方式算一遍，一致才认。这能同时验证"来源"和"未被改动"。
 *    · 生成不可预测的值：会话 ID、令牌、盐值都必须来自密码学安全的随机源。
 *      用 Math.random() 生成令牌是严重的安全漏洞。
 *    · 存密码：绝不能明文存，也不能只用无盐哈希。必须用 scrypt/argon2 这类
 *      "慢哈希 + 每用户独立盐"的方案。
 *
 * 3. 核心语法要点
 *    · createHash(算法)          创建哈希对象，常用 'sha256' / 'sha512' / 'md5'
 *    · hash.update(数据)         喂数据，可以多次调用（流式累积）
 *    · hash.digest(编码)         产出结果，**只能调用一次**；编码 'hex' / 'base64' / 不传得 Buffer
 *    · createHmac(算法, key)     HMAC，签名方式与 createHash 完全一致
 *    · randomBytes(n)            返回 n 个密码学安全随机字节（Buffer）
 *    · randomUUID()              返回 v4 UUID 字符串，天然适合做 ID
 *    · randomInt(min, max)       返回 [min, max) 的安全随机整数
 *    · scryptSync(password, salt, keylen, options?)   慢哈希，专门给密码用
 *    · timingSafeEqual(a, b)     定长时间比较，防止计时攻击
 *    · getHashes()               列出本机 OpenSSL 支持的所有算法名
 *
 * 4. 常见陷阱
 *    陷阱 1：digest() 只能调用一次。调用后再 update 或再 digest 都会抛
 *            ERR_CRYPTO_HASH_FINALIZED。要复用就新建一个哈希对象。
 *    陷阱 2：update() 之后必须调用 digest() 才算完成；只 update 不 digest
 *            什么也得不到。
 *    陷阱 3：MD5 和 SHA-1 已经被证明不安全（能构造碰撞），
 *            只能用于"校验下载文件是否完整"这类非对抗场景；
 *            涉及安全（签名、口令）一律用 SHA-256 及以上。
 *    陷阱 4：哈希**不是加密**，不可逆。想"能解回来"必须用加密而不是哈希。
 *            常见误解：以为把密码哈希后还能"解密验证"——不能，只能重算比对。
 *    陷阱 5：无盐哈希 + 彩虹表 = 密码泄露。同一个密码无盐哈希的结果完全一样，
 *            攻击者可以预先算好常见密码的哈希表直接反查。
 *            必须"每个用户一个随机盐"，并且用慢哈希（scrypt/pbkdf2/argon2）。
 *    陷阱 6：比较哈希值不要用 ===。字符串比较会在第一个不同字符处提前返回，
 *            理论上可被计时攻击逐字节猜出。用 timingSafeEqual。
 *    陷阱 7：timingSafeEqual 要求两个 Buffer **长度相同**，否则直接抛异常。
 *            所以要先比长度（长度本身不是秘密）。
 *    陷阱 8：Math.random() 不是密码学安全的，绝不能用于令牌、密码、盐。
 *    陷阱 9：随机数的默认编码。randomBytes(16).toString('hex') 得到 32 个字符，
 *            因为每个字节变成两个十六进制字符——别把长度算错。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/13_crypto_hash.js
 *
 * 【预期输出】
 *   演示 SHA-256 哈希（含分块 update 与不同输出编码）、HMAC 签名与验签、
 *   随机字节 / UUID / 随机整数，以及一个完整的"密码注册 + 登录校验"流程
 *   （随机盐 + scrypt + timingSafeEqual）。不访问网络，不写文件。
 * ============================================================================
 */

import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// 1. 哈希：把任意数据压成固定长度的指纹
// ---------------------------------------------------------------------------

console.log('--- 1. SHA-256 哈希 ---');

// createHash 接受算法名。用哪种算法决定了结果的长度与安全性：
//   md5    -> 128 位，已被攻破，仅用于非对抗场景
//   sha1   -> 160 位，已被攻破
//   sha256 -> 256 位，当前的主流选择（32 字节 / 64 个十六进制字符）
//   sha512 -> 512 位，更长更慢
const hash = crypto.createHash('sha256');

// update 可以接受字符串（默认按 utf8 编码）或 Buffer。
// 它是"累加"的：可以分多次把数据喂进去，效果与一次喂完完全相同。
hash.update('Hello, ');
hash.update('crypto!');

// digest 产出最终结果，参数是输出编码。
// 一旦调用 digest，这个哈希对象就"封口"了，不能再 update。
// 'hex' 输出十六进制字符串，最常用于展示与比对。
const digestHex = hash.digest('hex');
console.log('  SHA-256("Hello, crypto!") =', digestHex);
console.log('  长度 =', digestHex.length, '个字符（32 字节 × 2）');

// 同一份数据，哈希结果永远相同——这是哈希的"确定性"。
function sha256(text, encoding = 'hex') {
  // 每次都新建一个哈希对象，因为 digest 只能调用一次（陷阱 1）。
  return crypto.createHash('sha256').update(text, 'utf8').digest(encoding);
}
console.log('  再次计算，结果一致 =', sha256('Hello, crypto!') === digestHex);

// 不同的输出编码，表达的是同一个字节序列。
console.log('  hex 编码：   ', sha256('Hello, crypto!', 'hex'));
console.log('  base64 编码：', sha256('Hello, crypto!', 'base64'));

// 完全不传编码给 digest()，得到的是原始的 Buffer（32 字节）。
// 注意与"传 undefined 触发默认参数"的区别——所以要单独写一次调用，
// 不能借用上面那个带默认值 'hex' 的辅助函数。
const rawDigest = crypto.createHash('sha256').update('Hello, crypto!', 'utf8').digest();
console.log('  不传编码得到 Buffer 吗 =', Buffer.isBuffer(rawDigest), '，字节数 =', rawDigest.length);
console.log('  这个 Buffer 转成 hex 与上面一致吗 =', rawDigest.toString('hex') === digestHex);

// 雪崩效应：改一个字符，结果完全不同，看不出任何"相似"。
const before = sha256('abc');
const after = sha256('abd');
console.log('  sha256("abc") =', before);
console.log('  sha256("abd") =', after);
// 逐字符比较"相同位置相同的字符数"，来说明毫无相关性。
let sameChars = 0;
for (let i = 0; i < before.length; i += 1) {
  if (before[i] === after[i]) sameChars += 1;
}
console.log(`  64 个字符里只有 ${sameChars} 个位置偶然相同——这就是雪崩效应。`);

// 哈希的另一个重要性质：无论输入多长，输出长度固定。
console.log('  空字符串的哈希长度 =', sha256('').length);
console.log('  10000 个字符的哈希长度 =', sha256('x'.repeat(10000)).length);

// 分块 update 的用途：处理大文件时可以边读边喂，不必把整个文件装进内存。
// 这里用"分三次喂"来验证结果与一次性喂完全相同。
const chunked = crypto.createHash('sha256');
chunked.update('分段');
chunked.update('喂入');
chunked.update('数据');
const chunkedResult = chunked.digest('hex');
const oneShotResult = sha256('分段喂入数据');
console.log('  分三次 update 的结果 =', chunkedResult);
console.log('  一次性 update 的结果 =', oneShotResult);
console.log('  两者相同吗 =', chunkedResult === oneShotResult);

// 查看本机可用的算法清单（不同 OpenSSL 版本支持的算法集会有差异）。
const available = crypto.getHashes();
console.log('  本机支持的哈希算法数量 =', available.length);
// 挑几个常见的确认它们都在。
for (const name of ['sha256', 'sha512', 'md5', 'sha1', 'sha3-256']) {
  console.log(`    是否支持 ${name}:`, available.includes(name));
}

// MD5 演示：结果只有 32 个字符，且早已不安全（陷阱 3）。
// 这里仅用于说明"算法强度决定长度"，不要在生产里用它做安全校验。
console.log('  md5("abc") =', crypto.createHash('md5').update('abc').digest('hex'),
  '（32 字符，已被攻破，仅可用于非对抗场景）');

// ---------------------------------------------------------------------------
// 2. HMAC：带密钥的哈希
// ---------------------------------------------------------------------------

console.log('--- 2. HMAC 消息认证码 ---');

// HMAC = Hash-based Message Authentication Code。
// 与普通哈希的区别：它需要一个**密钥**。没有密钥的人算不出同样的结果，
// 所以它能同时证明"是谁发的"和"内容没被改过"。
const secretKey = 'shared-secret-key-不要硬编码在真实项目里';

function hmacSign(message, key) {
  // 用法与 createHash 几乎相同，只是多了密钥参数。
  return crypto.createHmac('sha256', key).update(message, 'utf8').digest('hex');
}

const message = 'orderId=A1001&amount=199';
const signature = hmacSign(message, secretKey);
console.log('  原文     =', message);
console.log('  签名     =', signature);

// 验证方用同样的密钥和算法重算一遍，比对结果。
console.log('  用正确密钥验签 =', hmacSign(message, secretKey) === signature);

// 用错误的密钥算，结果完全不同——这正是它安全性的来源。
console.log('  用错误密钥验签 =', hmacSign(message, 'wrong-key') === signature);

// 内容被改一个字符，签名也完全不同。
console.log('  篡改内容后验签 =', hmacSign('orderId=A1001&amount=299', secretKey) === signature);
console.log('  => 这两个 false 合起来说明：签名同时绑定"密钥"与"内容"，缺一不可。');

// 实际接口签名里更常见的做法是"对参数排序后拼接再签名"，
// 因为不同客户端传参顺序可能不同，但要求算出的签名一致。
function signParams(params, key) {
  const canonical = Object.keys(params)
    // 先按键名排序，保证规范化结果唯一。
    .sort()
    .map((k) => `${k}=${params[k]}`)
    // 用 & 连成标准形式。
    .join('&');
  return { canonical, signature: hmacSign(canonical, key) };
}
const signed = signParams({ amount: 199, orderId: 'A1001', nonce: 'abc' }, secretKey);
console.log('  规范化后的待签名串 =', signed.canonical);
console.log('  签名 =', signed.signature);
console.log('  （参数顺序不同的对象会得到同一个签名，因为先排序了）');
// 验证：把参数的书写顺序换一下，签名应该不变。
const signedReordered = signParams({ nonce: 'abc', orderId: 'A1001', amount: 199 }, secretKey);
console.log('  打乱参数顺序后签名是否相同 =', signedReordered.signature === signed.signature);

// ---------------------------------------------------------------------------
// 3. 安全随机数
// ---------------------------------------------------------------------------

console.log('--- 3. 安全随机数 ---');

// randomBytes 从操作系统的密码学安全随机源取字节。
// 任何与安全相关的随机值（令牌、盐、会话 ID）都必须用它，绝不能用 Math.random。
const bytes16 = crypto.randomBytes(16);
console.log('  16 个随机字节的 Buffer 长度 =', bytes16.length);
// 转成十六进制后长度翻倍：每个字节用两个十六进制字符表示。
console.log('  转成 hex 后长度 =', bytes16.toString('hex').length, '个字符');
console.log('  示例值 =', bytes16.toString('hex'));

// 连续取两次不会相同——这是随机性的直观体现。
console.log('  两次 randomBytes 结果不同 =',
  crypto.randomBytes(8).toString('hex') !== crypto.randomBytes(8).toString('hex'));

// randomUUID 生成 v4 UUID，格式固定为 8-4-4-4-12 共 36 个字符。
// 它本质上是 16 个随机字节（其中 6 位被固定为版本与变体标识），
// 因此碰撞概率极低，非常适合直接当作数据库主键或文件名。
const uuid = crypto.randomUUID();
console.log('  randomUUID() =', uuid);
console.log('  长度 =', uuid.length, '，含 4 个连字符');
console.log('  两次 UUID 不同 =', crypto.randomUUID() !== crypto.randomUUID());

// randomInt(min, max) 返回 [min, max) 区间内的安全随机整数。
// 注意上界是**开区间**，与 Math.floor(Math.random() * n) 的习惯不同。
console.log('  randomInt(1, 7) 模拟骰子，连取 5 次：',
  Array.from({ length: 5 }, () => crypto.randomInt(1, 7)).join(', '));

// 只有一个参数时表示 [0, max)。
console.log('  randomInt(100) 取 5 次：',
  Array.from({ length: 5 }, () => crypto.randomInt(100)).join(', '));
console.log('  => 上界永远取不到，别写成 randomInt(1, 6) 去模拟骰子（会永远没有 6）。');

// 生成一个"短令牌"的常见做法：取随机字节再转成 URL 安全的 base64。
// base64url 编码把 '+' '/' 换成 '-' '_'，并去掉末尾的 '='，便于放进 URL。
const token = crypto.randomBytes(24).toString('base64url');
console.log('  会话令牌（base64url） =', token);
console.log('  长度 =', token.length, '个字符，只含 URL 安全字符 =',
  /^[A-Za-z0-9_-]+$/.test(token));

// ---------------------------------------------------------------------------
// 4. 定长时间比较：timingSafeEqual
// ---------------------------------------------------------------------------

console.log('--- 4. timingSafeEqual 定长时间比较 ---');

// 为什么不能直接用 === 比较哈希/签名？
// 因为字符串比较通常"发现不同就立即返回"。攻击者可以通过测量响应时间，
// 一个字符一个字符地试出正确值——这叫计时攻击（timing attack）。
// timingSafeEqual 无论如何都比对完所有字节，耗时与内容无关。
const a = crypto.randomBytes(32);
const b = Buffer.from(a); // 内容相同的副本
const c = crypto.randomBytes(32); // 内容不同

console.log('  相同内容比较 =', crypto.timingSafeEqual(a, b));
console.log('  不同内容比较 =', crypto.timingSafeEqual(a, c));

// 陷阱 7：长度不同会直接抛异常，所以必须先比长度。
try {
  crypto.timingSafeEqual(Buffer.from('abc'), Buffer.from('abcd'));
} catch (err) {
  console.log('  长度不同时抛错：', err.code, '（ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH）');
}
// 正确用法：先比长度（长度不是秘密，可以放行），再用定长比较比内容。
function safeCompare(hex1, hex2) {
  const buf1 = Buffer.from(hex1, 'hex');
  const buf2 = Buffer.from(hex2, 'hex');
  // 长度不同直接判否，不进入定长比较（避免抛异常）。
  if (buf1.length !== buf2.length) return false;
  return crypto.timingSafeEqual(buf1, buf2);
}
console.log('  封装后的比较（长度不同）=', safeCompare('abcd', 'abcdef'));
console.log('  封装后的比较（内容相同）=', safeCompare(signature, signature));

// ---------------------------------------------------------------------------
// 5. 密码加盐哈希 —— 完整流程
// ---------------------------------------------------------------------------

console.log('--- 5. 密码加盐哈希 ---');

// 这一节是本文件最重要的部分。请记住三条铁律：
//   1) 绝不存明文密码
//   2) 绝不无盐哈希（否则彩虹表可批量破解）
//   3) 绝不用"快"哈希（sha256 每秒能算上亿次，暴力破解太快）
//
// 正确方案是"慢哈希 + 每用户独立随机盐"，Node 内置了 scrypt 和 pbkdf2。
// scrypt 故意设计成既吃 CPU 又吃内存，让暴力破解的成本高到不可行。

// scrypt 的参数含义：
//   password 要哈希的密码（字符串或 Buffer）
//   salt     盐，每个用户一份随机值
//   keylen   输出长度（字节），64 是常见选择
//   options  { N, r, p, maxmem }，N 是 CPU/内存成本，必须是 2 的幂
// 这里的 N 用的是较小的值（16384 是默认值），演示够用；
// 生产环境可以按硬件能力调高，并相应调大 maxmem。
const SCRYPT_KEYLEN = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** 注册：为密码生成"盐 + 哈希"，模拟存进数据库的那条记录 */
function hashPassword(plainPassword) {
  // 每个用户一份独立的随机盐。16 字节（128 位）足够。
  // 盐不是秘密，可以和哈希一起明文存进数据库。
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, SCRYPT_KEYLEN, SCRYPT_OPTIONS);
  return {
    salt,
    // 存成十六进制字符串，便于放进数据库的字符字段。
    hash: derived.toString('hex'),
    // 把参数也存下来：将来升级成本参数时，老记录还能被正确验证。
    params: { ...SCRYPT_OPTIONS, keylen: SCRYPT_KEYLEN, algorithm: 'scrypt' },
  };
}

/** 登录：用记录里的盐重算，再定长比较 */
function verifyPassword(plainPassword, record) {
  // 用**同一个盐**和同一组参数重算。
  const derived = crypto.scryptSync(plainPassword, record.salt, record.params.keylen, {
    N: record.params.N,
    r: record.params.r,
    p: record.params.p,
    maxmem: record.params.maxmem,
  });
  const expected = Buffer.from(record.hash, 'hex');
  // 长度不等直接判否，避免 timingSafeEqual 抛异常。
  if (derived.length !== expected.length) return false;
  // 定长比较，防计时攻击。
  return crypto.timingSafeEqual(derived, expected);
}

// 注册一个用户，观察存储记录的结构。
const t0 = Date.now();
const record = hashPassword('my-Secret-Password-123');
const elapsed = Date.now() - t0;
console.log('  存储记录（模拟数据库行）：');
console.log('    salt =', record.salt);
console.log('    hash =', `${record.hash.slice(0, 32)}...（共 ${record.hash.length} 个字符）`);
console.log('    参数 =', JSON.stringify(record.params));
console.log(`  计算一次耗时约 ${elapsed}ms —— 这个"慢"正是安全性的来源。`);
console.log('  （sha256 算一次大约只要百万分之一秒，比它快几万倍，所以不适合存密码）');

// 验证：正确密码通过，错误密码失败。
console.log('  用正确密码登录 =', verifyPassword('my-Secret-Password-123', record));
console.log('  用错误密码登录 =', verifyPassword('my-Secret-Password-124', record));
console.log('  用空密码登录   =', verifyPassword('', record));

// 演示"盐的作用"：同一个密码，两次注册得到完全不同的哈希。
// 这意味着攻击者无法通过"哈希相同"判断两个用户用了同一个密码，
// 也无法用预先算好的彩虹表批量反查。
const record2 = hashPassword('my-Secret-Password-123');
console.log('  同一密码两次注册的哈希是否相同 =', record.hash === record2.hash, '（不同，因为盐不同）');
console.log('  但两次都能通过验证 =',
  verifyPassword('my-Secret-Password-123', record) && verifyPassword('my-Secret-Password-123', record2));

// 无盐哈希的对比演示：同样的密码，哈希永远一样，因此彩虹表能直接命中。
const unsalted = crypto.createHash('sha256').update('123456').digest('hex');
console.log('  无盐 sha256("123456") =', unsalted);
console.log('  => 这个值在全世界的弱密码表里都能查到，等于没保护。');

// 顺带一提：Node 也有异步版的 crypto.scrypt（回调）与
// crypto.scrypt 的 Promise 包装（用 node:util 的 promisify）。
// 同步版会阻塞事件循环 —— 在高并发服务里要改用异步版，否则登录请求会拖垮整个进程。
// 这正好呼应 04 节讲过的"同步 API 阻塞事件循环"。

console.log('--- 全部演示结束 ---');
