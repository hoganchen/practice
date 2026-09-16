/**
 * ============================================================================
 * 知识点：Web Crypto 总览 —— crypto.subtle 是什么、与 node:crypto 的分工、可用算法、安全随机数
 * ============================================================================
 *
 * 【所属分类】35_web_crypto —— Web Crypto API
 * 【难度等级】入门
 * 【前置知识】32_security_and_best_practices/09_secure_random.js、24_typed_arrays（定型数组）、18_async（Promise）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Web Crypto API 是 W3C/WHATWG 制定的**浏览器与 Node.js 通用的密码学标准接口**，
 *    它由两部分组成，都挂在全局对象 `crypto` 上：
 *      (a) **crypto.subtle**：真正的密码学运算（摘要、签名、加密、派生密钥）。
 *          "subtle" 是"微妙/不易察觉"的意思，名字来自一句设计箴言：
 *          密码学实现里最危险的不是算法被攻破，而是**微妙的实现错误**
 *          （比如时序泄漏、IV 复用、少了完整性校验）。
 *          它提醒使用者：这里的每个参数都有安全含义，不要随手改。
 *      (b) **crypto.getRandomValues() / crypto.randomUUID()**：密码学安全的随机数。
 *          它们**不在** subtle 命名空间下，而是同步的、直接可用的。
 *    与 `node:crypto` 最大的区别是：subtle 的每一个方法都返回 **Promise**。
 *    原因是浏览器里密码学可能落到硬件加速器、WebCrypto Worker 甚至是系统弹窗，
 *    不能阻塞主线程（UI 线程），所以设计成异步。
 *    在 Node 里，同步的 `node:crypto` 与异步的 Web Crypto 同时存在，两者**可以互相验证**。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) **一份代码两端运行**：同一段加密逻辑既要跑在浏览器（前端加密表单、端到端加密聊天、
 *        生成密钥对做设备身份），又要跑在 Node（服务端解密、验签），Web Crypto 是唯一的
 *        官方标准交集 —— 用它写的代码在两个环境里语义一致。
 *    (b) **算法白名单**：`node:crypto` 暴露了 50+ 种哈希、几十种密码算法，包括 MD5、RC4、
 *        DES 这些早该淘汰的算法。Web Crypto 只实现"审核通过、参数不易用错"的那一小撮，
 *        并且**不允许自定义参数**（比如 RSA 指数、CBC 的填充方式都没法乱设）。
 *        选它，等于默认选了一组安全默认值。
 *    (c) **不接触密钥明文**：Web Crypto 的 CryptoKey 对象对 JS 是**不透明**的
 *        （non-extractable 时连 exportKey 都拿不到原始字节），密钥可以只存在于
 *        浏览器/硬件里，脚本只能"请求使用它"而不能"读出它"。这对防 XSS 窃取密钥很关键。
 *    (d) **合规与审计**：金融/医疗类项目常要求"只用标准算法、只走 FIPS 认证路径"，
 *        Web Crypto 的算法集合更容易过审。
 *
 * 3. 核心语法要点
 *    (a) 所有 subtle 方法都是 `async`：
 *          subtle.digest(algorithm, data)                    -> ArrayBuffer
 *          subtle.importKey(format, keyData, algorithm, extractable, usages)
 *          subtle.exportKey(format, key)                     -> ArrayBuffer | JsonWebKey
 *          subtle.generateKey(algorithm, extractable, usages) -> CryptoKey | CryptoKeyPair
 *          subtle.sign / verify / encrypt / decrypt / deriveBits / deriveKey
 *        算法参数可以写成字符串简写（'SHA-256'、'HMAC'、'AES-GCM'），
 *        也可以写成对象形式 `{ name: 'AES-GCM', iv, tagLength: 128 }`。
 *    (b) **数据永远是字节，不是字符串**。subtle 的入参类型是 BufferSource
 *        （ArrayBuffer / TypedArray / DataView）。想传文本必须先 `new TextEncoder().encode(str)`。
 *        直接把字符串丢进去会抛 TypeError —— 这是初学者在 Web Crypto 上的第一个坑。
 *    (c) **usage（用途）必须提前声明**：importKey / generateKey 时要写清这把密钥将来
 *        是 'encrypt'、'decrypt'、'sign'、'verify'、'wrapKey' 还是 'deriveBits'，
 *        而且不能混用（HMAC 密钥可以用 sign/verify，AES 密钥不能用 sign）。
 *        声明之后，用它去做未授权的操作会被拒绝 —— 这是有意设计的最小权限原则。
 *    (d) **extractable（是否可导出）**：`false` 表示这把密钥的原始字节永远出不来
 *        （仍可用它运算）。生产环境里，只用于加解密的对称密钥一般设 false，
 *        需要持久化到磁盘的密钥才设 true。
 *    (e) `crypto.getRandomValues(view)` 是**同步**的、**就地填充**的（返回同一个数组），
 *        并且有硬限制：单次最多 65,536 字节，只接受整数型 TypedArray
 *        （Uint8Array / Uint16Array / Int32Array…，不接受普通数组、不接受 Float32Array）。
 *        需要更多随机字节时分多次调用。
 *    (f) `crypto.randomUUID()` 生成 RFC 4122 版本 4 的 UUID（122 位随机），
 *        是最省事的"不可预测 ID"来源。
 *
 * 4. 常见陷阱
 *    - 用 `Math.random()` 生成任何与安全相关的东西（令牌、盐、IV、密钥、验证码）。
 *      Math.random 是伪随机：内部有"种子 + 状态"，按固定算法推进，
 *      观察到足够多的输出就能反推状态、预测后续（本文件小节 6 用实验演示"可预测"）。
 *      它的目标是"快"，规范明确不保证密码学安全性。
 *    - 以为"浏览器里能用，Node 里不能用"：Node 18+ 全局就有 `crypto`
 *      （本机 Node 24 无需任何 flag），`crypto.subtle` 开箱即用。
 *      唯一的差别是安全上下文：浏览器里 Web Crypto 只在 https / localhost 下可用，Node 无此限制。
 *    - 把 `subtle.encrypt()` 的返回值当字符串打印：它返回的是 ArrayBuffer，
 *      `console.log` 出来是一堆字节；要展示就用 `Buffer.from(x).toString('hex')`。
 *    - 以为换算法（SHA-256 改成 SHA-512）是"安全升级"：摘要算法只是工具，
 *      真正的安全强度取决于**密钥长度、随机性质量、整体协议设计**（见下一节的陷阱说明）。
 *    - 忘记 await：`const h = subtle.digest(...)` 拿到的是 Promise 而不是结果，
 *      后续用它算长度会得到 undefined，报错信息却指向奇怪的地方。
 *    - 在浏览器里用 `crypto.subtle` 却在 http 页面调试：`crypto.subtle` 会是 undefined，
 *      因为非安全上下文里整个 subtle 都不暴露（这是刻意的）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 35_web_crypto/01_crypto_overview.js
 *
 * 【预期输出】
 *   先用对照表说明"两种 crypto"的分工，再实测全局 crypto 的能力边界
 *   （getRandomValues 的类型限制与 64 KiB 上限、randomUUID 的结构、digest 只吃字节不吃字符串）；
 *   然后用"可预测的 Math.random"实验说明为什么它不能用于安全场景；
 *   最后用一次算法探测列出 Web Crypto 真正支持的算法清单，并与 node:crypto 的规模对比。
 *   全程退出码 0，不需要网络。
 * ============================================================================
 */

import { getCiphers, getHashes, webcrypto as nodeWebCrypto } from 'node:crypto';

// ---------------------------------------------------------------------------
// 0. 取到 Web Crypto：全局 crypto（Node 18+ / 所有现代浏览器）
// ---------------------------------------------------------------------------
// Node 18 起，浏览器那套 `crypto` 被挂到了 globalThis 上，和浏览器里用的是同一套 API。
// 老代码里常见的 `node:crypto` 的 webcrypto 导出（下面留了个兜底）现在基本不需要了。
const subtle = globalThis.crypto?.subtle ?? nodeWebCrypto.subtle;
const webCrypto = globalThis.crypto ?? nodeWebCrypto;

/** 把字节数据转成十六进制字符串，方便阅读。 */
const toHex = (bytes) => Buffer.from(bytes).toString('hex');

console.log('--- 1. 两个 crypto：Web Crypto（标准）与 node:crypto（Node 内置）---');
console.log(`  当前 Node 版本：${process.version}`);
console.log(`  globalThis.crypto 存在吗？        ${typeof globalThis.crypto === 'object'}`);
console.log(`  globalThis.crypto.subtle 存在吗？ ${typeof subtle === 'object'}`);
console.log(`  getRandomValues 是同步函数吗？    ${webCrypto.getRandomValues.constructor.name === 'Function'}`);
console.log('');
console.log('  两者关系一句话：**不是替代关系，而是分工关系**。');
console.log('    - 需要"同一份代码在浏览器和 Node 都能跑" -> 用 Web Crypto（crypto.subtle）。');
console.log('    - 需要 Node 特有能力（流式哈希、scrypt/argon2、X509 证书、密钥文件读写）');
console.log('      -> 用 node:crypto。');
console.log('    - 需要同步 API（不想 async 传染整条调用链）-> node:crypto 的 *Sync 系列。');
console.log('    - 教学与自检 -> 用一边算、另一边验证，结果应当完全一致（本目录后续章节都这么做）。');

console.log('\n  能力对照表：');
const compareTable = [
  ['返回风格', 'Promise（异步）', '同步为主 + 少量异步回调'],
  ['运行环境', '浏览器 / Node / Deno / 云函数 / Service Worker', '仅 Node'],
  ['算法范围', '精选白名单（约 20 种算法族）', `${getHashes().length} 种哈希、${getCiphers().length} 种密码算法（含历史遗留）`],
  ['密钥表示', '不透明 CryptoKey（可设为不可导出）', 'KeyObject / Buffer（字节可控）'],
  ['文本输入', '必须自己 TextEncoder 转字节', '常可直接传字符串 + 指定编码'],
  ['流式处理', '不支持（一次性喂完整数据）', '支持 createHash().update().update()'],
  ['安全上下文', '浏览器要求 https / localhost', '无限制'],
  ['最大优势', '跨端一致、默认参数安全、密钥不外泄', '功能全、同步、可与 OpenSSL/系统密钥体系互操作'],
];
for (const [dim, web, node] of compareTable) {
  console.log(`    ${dim.padEnd(10)} Web Crypto: ${web}`);
  console.log(`    ${''.padEnd(10)} node:crypto: ${node}`);
}

// ---------------------------------------------------------------------------
console.log('\n--- 2. crypto.getRandomValues：同步、就地填充、有硬上限 ---');
// ---------------------------------------------------------------------------
// 它是"用密码学安全的随机字节填充你给的数组"。注意两件事：
//   ① 就地填充（返回的就是你传进去的那个数组，不分配新内存）；
//   ② 上限 65536 字节/次（= 64 KiB），这是规范为了不让页面卡死设的限制。
const buf16 = new Uint8Array(16);
const returned = webCrypto.getRandomValues(buf16);
console.log(`  getRandomValues(new Uint8Array(16))：`);
console.log(`    返回的是同一个对象吗？ ${returned === buf16}（就地填充，不是复制）`);
console.log(`    填充了 16 字节：长度=${buf16.length}，是否全 0=${buf16.every((b) => b === 0)}`);
console.log('    注意：这里刻意**不打印**这 16 个字节 —— 它是随机的，每次运行都不同；');
console.log('        对教学示例来说，打印"结构化信息"（长度、是否全零）比打印原始随机值更有意义。');

console.log('\n  它能填哪些类型？（"整数型 TypedArray"都行，浮点数组不行）');
const typeTrials = [
  ['Uint8Array(8)', () => new Uint8Array(8)],
  ['Uint16Array(8)', () => new Uint16Array(8)],
  ['Int32Array(8)', () => new Int32Array(8)],
  ['Float64Array(8)', () => new Float64Array(8)],
  ['普通数组 [1,2,3]', () => [1, 2, 3]],
];
for (const [label, make] of typeTrials) {
  try {
    const arr = make();
    const out = webCrypto.getRandomValues(arr);
    console.log(`    ✓ ${label.padEnd(18)} 成功（共 ${out.byteLength} 字节）`);
  } catch (err) {
    // 注意错误名：类型不对是 TypeMismatchError，这是区分"参数写错"的信号
    console.log(`    ✗ ${label.padEnd(18)} ${err.name}: ${err.message}`);
  }
}

console.log('\n  单次调用的容量上限（规范硬限制：65536 字节）：');
for (const size of [65536, 65537]) {
  try {
    webCrypto.getRandomValues(new Uint8Array(size));
    console.log(`    ✓ ${String(size).padStart(6)} 字节  成功`);
  } catch (err) {
    console.log(`    ✗ ${String(size).padStart(6)} 字节  ${err.name}: ${err.message}`);
  }
}
console.log('  需要更多随机字节时，分多次调用即可（例如每次 64 KiB，循环填充）——');
console.log('  不要试图一次要几百 KiB，浏览器会直接拒绝（这是防止主线程被卡死的保护）。');

// ---------------------------------------------------------------------------
console.log('\n--- 3. crypto.randomUUID：122 位随机的 UUID v4 ---');
// ---------------------------------------------------------------------------
// UUID v4 的格式是 xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
// 其中第 13 位固定是 '4'（版本号），第 17 位固定是 8/9/a/b（变体位），
// 剩下 122 位是随机的。格式检查是确定性的，所以可以放心地"展示结构"而不是"展示值"。
const uuidA = webCrypto.randomUUID();
const uuidB = webCrypto.randomUUID();
const versionChar = uuidA[14];
const variantChar = uuidA[19];
console.log(`  randomUUID() 生成了一个 UUID（不打印原值，只做结构校验）：`);
console.log(`    长度是否为 36？           ${uuidA.length === 36}`);
console.log(`    连字符位置 8/13/18/23？   ${[8, 13, 18, 23].every((i) => uuidA[i] === '-')}`);
console.log(`    第 13 位（版本号）是 '4'？ ${versionChar === '4'}`);
console.log(`    第 17 位（变体）在 89ab 中？ ${'89ab'.includes(variantChar)}`);
console.log(`    连续两次生成不同？        ${uuidA !== uuidB}`);
console.log(`    随机位数：122 位（约 5.3e36 种可能，碰撞概率可忽略）`);
console.log('  它适合：请求 ID / trace ID / 幂等键 / 不需要保密的资源标识。');
console.log('  它**不适合**单独当"永久凭证"—— UUID 可以被记录、被转发，');
console.log('  长期凭证需要"服务端保存 + 可吊销 + 常量时间比较"（见 03 篇）。');

// ---------------------------------------------------------------------------
console.log('\n--- 4. 数据永远是字节：subtle 不吃字符串 ---');
// ---------------------------------------------------------------------------
// ArrayBuffer / TypedArray / DataView 统称 BufferSource。
// JS 的字符串是 UTF-16 码元序列，密码学只认字节，所以必须显式编码。
const encoder = new TextEncoder();
for (const value of ['abc', encoder.encode('abc')]) {
  try {
    const digest = await subtle.digest('SHA-256', value);
    console.log(`    ✓ 入参 ${typeof value === 'string' ? '字符串 "abc"' : 'Uint8Array(3)'} -> 摘要 ${toHex(digest).slice(0, 16)}…（32 字节）`);
  } catch (err) {
    console.log(`    ✗ 入参 字符串 "abc"  ${err.name}: ${err.message.slice(0, 90)}…`);
    console.log('      修法：new TextEncoder().encode("abc")，或用 Buffer.from("abc")（Node 里两者等价）');
  }
}
console.log('  同样地，encrypt / sign 的"数据"参数、IV、salt、AAD 全都是字节；');
console.log('  只有"算法名、格式名、usage"这些是字符串。');

// ---------------------------------------------------------------------------
console.log('\n--- 5. 猜一个数字：为什么 Math.random 不能用于安全 ---');
// ---------------------------------------------------------------------------
// 用一个"被替换掉的 Math.random"来演示：伪随机 = 可复现。
// 真实场景里攻击者拿不到你的种子，但只要能观察到足够多的输出，就能反推内部状态。
const realMathRandom = Math.random;

/**
 * 造一个"可预测版 Math.random"：线性同余发生器（LCG）。
 * 同一个种子必然产生同一串数字 —— 这就是"伪随机"的定义。
 * @param {number} seed 初始种子
 * @returns {() => number} 取值在 [0, 1) 的函数
 */
function createSeededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) % 2 ** 32;
    return state / 2 ** 32;
  };
}

/**
 * 【错误示范】用 Math.random 生成"会话令牌"。
 * 保留它只为了演示，真实项目里绝不可以这样写。
 * @param {number} bytes 字节数
 * @returns {string} 十六进制字符串
 */
function insecureToken(bytes) {
  let out = '';
  for (let i = 0; i < bytes; i += 1) {
    // 0~255 的"随机"字节，看起来和真的随机没区别
    out += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  }
  return out;
}

/**
 * 用"当前 Math.random"生成 n 个 8 字节令牌。
 * @param {number} n 令牌个数
 * @returns {string[]} 令牌列表
 */
function generateTokenBatch(n) {
  return Array.from({ length: n }, () => insecureToken(8));
}

/** 真实随机源（crypto）生成的令牌，用于对照。 */
function secureToken(bytes) {
  const buf = new Uint8Array(bytes);
  webCrypto.getRandomValues(buf);
  return toHex(buf);
}

// 第 1 次"服务重启"：种子取进程启动时间（真实 PRNG 的种子同样来自环境，攻击者不易知道）
Math.random = createSeededRandom(20250916);
const batchRun1 = generateTokenBatch(3);
// 第 2 次"服务重启"：种子恰好相同 —— 于是整串令牌被完整复现
Math.random = createSeededRandom(20250916);
const batchRun2 = generateTokenBatch(3);
Math.random = realMathRandom; // 用完立刻还原，避免污染后面的代码

console.log('  实验：把 Math.random 换成同种子的 LCG（演示用的可预测 PRNG），各生成 3 个"会话令牌"。');
console.log(`    第 1 批: ${batchRun1.join('  ')}`);
console.log(`    第 2 批: ${batchRun2.join('  ')}`);
console.log(`    两批完全一致？ ${batchRun1.join() === batchRun2.join()}  <- 种子相同，输出就一模一样`);
console.log(`    第 1 批内部有重复吗？ ${new Set(batchRun1).size !== batchRun1.length}（没有重复，所以"看起来很正常"）`);
console.log('');
console.log('  换成真正的密码学随机源（crypto.getRandomValues）再各生成 3 个：');
const secureRun1 = Array.from({ length: 3 }, () => secureToken(8));
const secureRun2 = Array.from({ length: 3 }, () => secureToken(8));
console.log(`    第 1 批: 3 个 8 字节令牌（每个 16 个 hex 字符）`);
console.log(`    第 2 批: 3 个 8 字节令牌`);
console.log(`    两批完全一致？ ${secureRun1.join() === secureRun2.join()}  <- 没有任何"种子"可以复现它`);
console.log(`    第 1 批内部有重复吗？ ${new Set(secureRun1).size !== secureRun1.length}`);
console.log(`    每个令牌的长度都合法吗？ ${[...secureRun1, ...secureRun2].every((t) => t.length === 16 && /^[0-9a-f]+$/.test(t))}`);
console.log('  这里刻意**不打印令牌内容**：它每次运行都不同，打印出来只会让输出无法复现；');
console.log('  对随机值，我们只打印"结构化断言"（是否相同、有没有重复、长度对不对）就够了。');
console.log('  三个结论：');
console.log('    1) 伪随机的输出完全由"种子 + 状态"决定，是可复现、可推导的；');
console.log('    2) 状态一旦被反推（观察足够多输出即可），之后的每个令牌都能被预测；');
console.log('    3) 更糟的是 Math.random 是**进程级共享**的一条流 —— 你无法知道');
console.log('       谁（哪个依赖库）已经看过这条流的输出。');
console.log('  正确工具：crypto.getRandomValues（字节级真随机，无种子可推）、');
console.log('            crypto.randomUUID（现成的安全 ID）。');

// ---------------------------------------------------------------------------
console.log('\n--- 6. 算法探测：Web Crypto 到底支持哪些算法 ---');
// ---------------------------------------------------------------------------
// subtle 没有"列出所有算法"的 API，判断某个算法是否可用的办法是**试一次**：
// 参数正确却被拒绝，就说明这个运行时没实现它（错误名通常是 NotSupportedError）。

/**
 * 探测一个算法是否可用。
 * @param {string} label 展示名
 * @param {() => Promise<unknown>} attempt 一次合法的调用
 * @returns {Promise<[string, string]>} [展示名, 结果文本]
 */
async function probe(label, attempt) {
  try {
    await attempt();
    return [label, '✓ 支持'];
  } catch (err) {
    // NotSupportedError -> 未实现；其它错误名说明参数写错了，这里一并展示出来便于排查
    return [label, `✗ ${err.name}`];
  }
}

const probes = await Promise.all([
  probe('SHA-1', () => subtle.digest('SHA-1', new Uint8Array(0))),
  probe('SHA-256', () => subtle.digest('SHA-256', new Uint8Array(0))),
  probe('SHA-384', () => subtle.digest('SHA-384', new Uint8Array(0))),
  probe('SHA-512', () => subtle.digest('SHA-512', new Uint8Array(0))),
  probe('HMAC', () => subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, true, ['sign', 'verify'])),
  probe('AES-GCM', () => subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])),
  probe('AES-CBC', () => subtle.generateKey({ name: 'AES-CBC', length: 256 }, true, ['encrypt', 'decrypt'])),
  probe('AES-CTR', () => subtle.generateKey({ name: 'AES-CTR', length: 256 }, true, ['encrypt', 'decrypt'])),
  probe('AES-KW', () => subtle.generateKey({ name: 'AES-KW', length: 256 }, true, ['wrapKey', 'unwrapKey'])),
  probe('RSA-OAEP', () => subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 1024, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt'],
  )),
  probe('RSASSA-PKCS1-v1_5', () => subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 1024, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )),
  probe('RSA-PSS', () => subtle.generateKey(
    { name: 'RSA-PSS', modulusLength: 1024, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true,
    ['sign', 'verify'],
  )),
  probe('ECDSA P-256/P-384/P-521', () => subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])),
  probe('ECDH', () => subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits'])),
  probe('Ed25519', () => subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])),
  probe('X25519', () => subtle.generateKey({ name: 'X25519' }, true, ['deriveBits'])),
  probe('PBKDF2', () => subtle.importKey('raw', encoder.encode('pw'), 'PBKDF2', false, ['deriveBits'])),
  probe('HKDF', () => subtle.importKey('raw', new Uint8Array(16), 'HKDF', false, ['deriveBits'])),
]);

console.log(`  Web Crypto 算法探测（本机 Node ${process.version}）：`);
for (const [label, result] of probes) {
  console.log(`    ${label.padEnd(24)} ${result}`);
}
console.log('  注意：SHA-1 虽然还在列表里，但它早已不适合做签名/口令哈希（抗碰撞性被攻破）。');
console.log('        它能留下只是为了兼容老协议；新代码一律用 SHA-256 及以上。');
console.log('  Node 还额外提供 SHA3-256 / ChaCha20-Poly1305 等实验性实现，');
console.log('        使用时控制台会打印 ExperimentalWarning —— 生产代码要留意这类提示。');

// ---------------------------------------------------------------------------
console.log('\n--- 7. 规模对比：为什么 Web Crypto 是"白名单" ---');
// ---------------------------------------------------------------------------
const hashes = getHashes();
const ciphers = getCiphers();
console.log(`  node:crypto 暴露出 ${hashes.length} 种哈希算法，其中包含：`);
console.log(`    已被淘汰但仍在列表里的：${hashes.filter((h) => /^(md4|md5|sha1|ripemd)/i.test(h)).join(', ')}`);
console.log(`  node:crypto 暴露出 ${ciphers.length} 种密码算法，其中包含：`);
console.log(`    已被淘汰的经典算法（DES / RC4 系列）：${ciphers.filter((c) => /^(des|rc4|rc2)/i.test(c)).slice(0, 8).join(', ')} …`);
console.log('  能选不等于该选。Web Crypto 的取舍是：**宁可少给，也不给你机会配错**。');
console.log('    它不允许你指定 CBC 的填充方式（只提供 PKCS#7 语义）、');
console.log('    不允许你设 RSA 的指数、不允许你用 ECB（ECB 会泄漏明文结构，见 AES 篇）；');
console.log('    它甚至**根本不提供 AES-ECB**。这些都是刻意的安全默认值。');

// ---------------------------------------------------------------------------
console.log('\n--- 8. 什么时候必须回到 node:crypto ---');
// ---------------------------------------------------------------------------
const nodeOnlyCases = [
  ['流式哈希大文件', 'createHash().update(chunk) 边读边算；subtle.digest 需要整个数据一次性进内存'],
  ['口令哈希（scrypt/argon2）', 'Web Crypto 只有 PBKDF2；scrypt 需要 node:crypto 或第三方库'],
  ['读系统密钥 / X.509 证书', 'createPrivateKey(pem) / X509Certificate 是 Node 特有'],
  ['同步 API 场景', '启动脚本、模块初始化时不想 await，用 *Sync 系列'],
  ['旧协议兼容', '需要 MD5/SHA-1/3DES/RC4 时（能不用就尽量别用）'],
];
for (const [scene, why] of nodeOnlyCases) {
  console.log(`    - ${scene}：${why}`);
}

console.log('\n--- 9. 小结：这个目录会讲什么 ---');
const roadmap = [
  ['02_digest_hashing.js', '摘要：SHA-256/384/512，与 node:crypto 交叉验证，为什么摘要不可逆'],
  ['03_hmac_signing.js', 'HMAC：消息认证码、API 签名与 Webhook 校验、时序安全比较'],
  ['04_aes_gcm_encryption.js', 'AES-GCM：对称加密全流程、IV 为什么绝不能复用、认证标签与篡改检测'],
  ['05_key_derivation_pbkdf2.js', 'PBKDF2：口令派生密钥、盐与迭代次数、为什么口令不能直接当密钥'],
  ['06_ecdsa_keypair.js', 'ECDSA：密钥对、签名验签、raw/pkcs8/spki/jwk 四种导出格式、JWT 签名思路'],
];
for (const [file, topic] of roadmap) console.log(`    ${file.padEnd(28)} ${topic}`);
console.log('\n  贯穿全目录的两条主线：');
console.log('    1) 每个结论都用 node:crypto 交叉验证 —— 两套独立实现给出相同结果，');
console.log('       才说明你真的把参数（编码、哈希、IV、盐、格式）都对上了；');
console.log('    2) 涉及随机值的地方只打印"结构化信息"（长度、是否相同、验证结果），');
console.log('       因为随机值的原始内容每次运行都不同，不适合作为教学输出。');
