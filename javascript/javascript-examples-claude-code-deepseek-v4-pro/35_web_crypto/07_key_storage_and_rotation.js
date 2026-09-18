/**
 * ============================================================================
 * 知识点：密钥的生命周期 —— 存储、轮换与撤销（CryptoKey 持久化 + kid 密钥环）
 * ============================================================================
 *
 * 【所属分类】35_web_crypto —— Web Crypto API
 * 【难度等级】高级
 * 【前置知识】35_web_crypto/04_aes_gcm_encryption.js、35_web_crypto/05_key_derivation_pbkdf2.js、23_collections/01_map_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    04 篇讲完了"怎么用密钥加密"，并在清单里留下了一句轻描淡写的话：
 *    「密钥轮换：密文里带"密钥版本号"，支持新旧密钥并存与平滑轮换」——
 *    但那只是一行字，**没有一行代码**。本篇就是把它补成可运行的东西。
 *    密钥的生命周期一共有四个阶段，本篇逐个落实：
 *      (a) **生成**：随机生成，或从 KMS 取回（04 篇已讲）；
 *      (b) **存储**：密钥放在哪里？—— 这是生产里被问得最多、也最容易做错的一环；
 *      (c) **轮换（rotation）**：定期换成新密钥，但**旧密文必须还能解**；
 *      (d) **撤销（revocation）**：密钥泄漏后让它立刻失效，并处理存量密文。
 *    支撑 (c) 和 (d) 的核心机制只有一个：**`kid`（key id，密钥版本号）**。
 *    密文里带上 kid，解密方就能"按版本找回对应的密钥"，而不是"只有唯一一把钥匙"。
 *    把一组带 kid 的密钥组织在一起，就是业界所说的**密钥环（KeyRing）**。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) **合规要求**：PCI-DSS、等保、GDPR 这类标准都明确要求密钥定期轮换，
 *        并要求"密钥泄漏后能快速吊销"。
 *    (b) **降低爆炸半径**：密钥被攻破时，只影响"这把密钥加密过的数据"，
 *        而不是"整个数据库的全部历史数据"。
 *    (c) **平滑轮换**：轮换不是"停服换钥匙"。正确姿势是
 *        **新数据用新密钥加密、旧数据仍用旧密钥解密**，等存量数据全部迁移完，
 *        再撤销旧密钥 —— 全程零停机、零回归。
 *    (d) **多租户 / 多区域**：每个租户一把密钥，靠 kid 区分（这也让"按租户删数据"
 *        变成"删掉那把密钥"，即所谓 crypto-shredding）。
 *    (e) **人员离职 / 服务拆分**：签发密钥的人走了，轮换一次即可切断其影响。
 *
 * 3. 核心语法要点
 *    (a) **`extractable` 是密钥的第一道闸门**：
 *          const key = await subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt','decrypt']);
 *          //                                                                  ^^^^^ extractable = false
 *        设成 false 后，`subtle.exportKey('raw'|'jwk', key)` 会抛
 *        `InvalidAccessError`（Node 里实际抛的子类叫 `InvalidAccessException`）。
 *        意义：**密钥的字节永远不会出现在 JS 里**，即使页面被 XSS，
 *        攻击者也没法 `fetch('/steal', { body: exportedKey })` 把密钥带走。
 *    (b) **非可导出密钥的"搬运"方式只有一种：结构化克隆（structured clone）**。
 *        `structuredClone(key)` 会得到一个**仍然是 non-extractable**、且**仍可正常加解密**的
 *        CryptoKey（本文件会实测）。浏览器里把它 **put 进 IndexedDB** 就能跨页面刷新持久化：
 *          // 浏览器专用（Node 没有 IndexedDB，所以下面是参考代码，不在本文件执行）
 *          const db = await new Promise((r) => { const q = indexedDB.open('keys', 1); q.onsuccess = () => r(q.result); });
 *          db.transaction('keys', 'readwrite').objectStore('keys').put(key, 'v1');   // 直接存 CryptoKey 对象
 *        **绝不能**走 JSON：`JSON.stringify(key)` 的结果是 `{}`（CryptoKey 没有可枚举属性），
 *        存进 localStorage 只会得到"一个空对象"，等你读回来时它已经不是密钥了。
 *    (c) **Node 里的替代方案**（Node 没有 IndexedDB）：
 *          · 进程内长期驻留：把 CryptoKey 放进模块级 Map（服务只要不重启就一直有效）；
 *          · 跨重启：把密钥放进 KMS / 密钥文件（权限 0600）/ 环境变量，
 *            启动时读进来 importKey 成 non-extractable；
 *          · 想"把密钥加密后再存"：用 `subtle.wrapKey` + KEK（见小节 5）。
 *    (d) **密钥环的最小设计**：
 *          { kid -> CryptoKey }  + 一个"当前用于加密"的 kid。
 *          加密用 activeKid；解密按密文里的 kid 查表 —— 一条规则解决全部轮换问题。
 *    (e) **打包格式要自己定并写进协议文档**。本篇用：
 *          `kidLen(1 字节) || kid(变长) || iv(12 字节) || 密文+认证标签(其余)`
 *          并把 kid 同时作为 **AAD** 传进 AES-GCM —— 这样"有人把 kid 从 v1 改成 v2"
 *          会被认证标签直接挡下（见 04 篇对 AAD 的讲解）。
 *    (f) 相关 API：
 *          `subtle.wrapKey(format, key, wrappingKey, wrapAlgo)`  把密钥包成密文（AES-KW）
 *          `subtle.unwrapKey(format, wrapped, wrappingKey, wrapAlgo, keyAlgo, extractable, usages)`
 *
 * 4. 常见陷阱（每一条都对应一个真实的线上事故）
 *    - **把密钥写进前端源码 / 提交进 Git**：前端代码是**完全公开**的，
 *      "打包时混淆"挡不住任何人（`view-source` 就能看）。密钥必须在服务端。
 *    - **把密钥塞进 localStorage / sessionStorage**：那是明文存储，
 *      任何一行 XSS（包括第三方 npm 包里的）都能 `localStorage.getItem()` 拿走。
 *      更糟的是它会被浏览器同步到磁盘、被备份软件抓走。
 *    - **把密钥打进日志 / 错误上报 / APM**：`console.log(key)` 打印的是对象摘要，
 *      但 `console.log(await exportKey('raw', key))` 就是**明文密钥进日志**。
 *      同理，把整个 config 对象打日志时，里面的密钥字段会一起被带出去。
 *    - **轮换时直接删掉旧密钥**：存量密文立刻全部解不开 —— 这是最惨烈的一类事故。
 *      必须"先上新钥、后下旧钥"，且下线前确认存量数据已迁移完毕。
 *    - **以为 non-extractable 就万事大吉**：它只保证"字节导不出来"。
 *      XSS 仍然可以在页面存活期间**调用**这个密钥去解密数据（相当于借用你的手）。
 *      它是"提高攻击成本"，不是"免疫"。真正的防线仍是防住 XSS（CSP、依赖审计）。
 *    - **generation 号用得不对**：把 kid 做成"自增整数"时，要防止进程重启后从 1 重新开始，
 *      否则新旧密钥撞号 —— 用 UUID、时间戳 + 随机后缀，或干脆用 KMS 返回的密钥 ID。
 *    - **忘了给 kid 做完整性保护**：kid 在密文里是明文的，攻击者可以改它。
 *      把它放进 AAD（本篇做法）或放在被签名的信封里，才能防篡改。
 *    - **只轮换密钥、不轮换 IV 规则**：轮换的收益依赖"每把密钥下 IV 都不重复"，
 *      如果 IV 是计数器式的，换密钥时计数器要一起重置规划（见 04 篇 IV 一节）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 35_web_crypto/07_key_storage_and_rotation.js
 *   纯本地示例：不访问网络、不使用随机以外的外部状态，全程退出码 0。
 *   所有随机值（IV、密钥）只打印"长度 / 是否相同 / 是否验证通过"这类结构化信息。
 *
 * 【预期输出】
 *   1) extractable=false 的实测：exportKey 抛错、JSON.stringify 得到 {}、
 *      structuredClone 得到仍不可导出但**仍然可用**的密钥；
 *   2) 浏览器 IndexedDB 持久化与 Node 替代方案的对照（表单形式，含参考代码）；
 *   3) 用 AES-KW 把密钥"包"成密文存起来（wrapKey / unwrapKey 往返）；
 *   4) 一个完整可运行的 KeyRing：kid + 打包格式 + AAD 绑定；
 *   5) 轮换演练：v1 加密 -> 轮换到 v2 -> 新数据用 v2 -> **v1 的旧密文仍能解开**；
 *   6) 撤销演练：revoke(v1) 之后 v1 密文不可解，v2 不受影响；
 *   7) 重加密迁移：撤销前先把存量密文解密再加密，实现零丢失下线；
 *   8) 与 node:crypto 的 aes-256-gcm 双向交叉验证（含 AAD）；
 *   9) "绝不这么做"的红线清单与生产检查清单。
 * ============================================================================
 */

import { createCipheriv, createDecipheriv } from 'node:crypto';

const subtle = globalThis.crypto.subtle;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** 把 BufferSource 转成十六进制字符串。 */
const toHex = (bytes) => Buffer.from(bytes).toString('hex');

/** 仅用于输出对齐：按"显示宽度"补空格（中文占 2 列）。 */
const displayWidth = (s) => [...s].reduce((w, ch) => w + (/[一-鿿＀-￯]/.test(ch) ? 2 : 1), 0);
const padLabel = (s, width) => s + ' '.repeat(Math.max(0, width - displayWidth(s)));

// ===========================================================================
console.log('--- 1. extractable 是密钥的第一道闸门 ---');
// ===========================================================================
// 同一份字节，导入两次：一次可导出、一次不可导出。后面所有对比都基于这两个对象。
const DEMO_SECRET_BYTES = new Uint8Array(32);
for (let i = 0; i < DEMO_SECRET_BYTES.length; i += 1) DEMO_SECRET_BYTES[i] = (i * 11 + 5) & 0xff;

const exportableKey = await subtle.importKey('raw', DEMO_SECRET_BYTES, { name: 'AES-GCM' }, true, [
  'encrypt',
  'decrypt',
]);
const lockedKey = await subtle.importKey('raw', DEMO_SECRET_BYTES, { name: 'AES-GCM' }, false, [
  'encrypt',
  'decrypt',
]);

console.log('  同一份 32 字节，用 importKey 导入两次（只有第 4 个参数不同）：');
console.log(`    extractable = true   -> key.extractable = ${exportableKey.extractable}`);
console.log(`    extractable = false  -> key.extractable = ${lockedKey.extractable}`);

console.log('\n  导出试试（这是"密钥会不会被带走"的分水岭）：');
for (const [label, k] of [
  ['extractable=true ', exportableKey],
  ['extractable=false', lockedKey],
]) {
  for (const format of ['raw', 'jwk']) {
    try {
      const out = await subtle.exportKey(format, k);
      const size = out instanceof ArrayBuffer ? `${out.byteLength} 字节` : `JWK（字段：${Object.keys(out).join(',')}）`;
      console.log(`    ${label}  exportKey('${format}') -> ✓ 成功，${size}`);
    } catch (err) {
      // 注意 err.name：规范里叫 InvalidAccessError，Node 抛的是它的子类 InvalidAccessException。
      // 所以判断"密钥不可导出"时不要硬编码名字，用 err.name.includes('InvalidAccess') 更稳。
      console.log(`    ${label}  exportKey('${format}') -> ✗ ${err.name}: ${err.message}`);
    }
  }
}
console.log('  —— 不可导出的密钥，**字节永远拿不出来**，这是它对 XSS 的全部价值。');

console.log('\n  常见的两种"以为能存下来"的写法，都会静默失败：');
console.log(`    JSON.stringify(key)        -> ${JSON.stringify(lockedKey)}`);
console.log('      （CryptoKey 没有可枚举属性，序列化出来是个空对象 ——');
console.log('        把它存进 localStorage 再读回来，你拿到的只是一个 {}，不是密钥。）');
console.log(`    Object.keys(key)           -> [${Object.keys(lockedKey).join(', ')}]（长度 ${Object.keys(lockedKey).length}，一个可枚举字段都没有）`);
console.log('    但**只读属性**是有的，它们是元数据而不是密钥材料：');
console.log(`      type=${lockedKey.type}  algorithm=${lockedKey.algorithm.name}  usages=[${lockedKey.usages.join(', ')}]`);
console.log(`      byteLength=${lockedKey.algorithm.length / 8}（这只是一个长度数字，不是密钥本体）`);

console.log('\n  验证一下"不可导出的密钥照样能干活"（否则它就没用了）：');
const probeIv = globalThis.crypto.getRandomValues(new Uint8Array(12));
const probeCt = await subtle.encrypt({ name: 'AES-GCM', iv: probeIv }, lockedKey, encoder.encode('secret payload'));
const probePt = await subtle.decrypt({ name: 'AES-GCM', iv: probeIv }, lockedKey, probeCt);
console.log(`    加密后解密回来："${decoder.decode(probePt)}"`);
console.log('    所以 non-extractable 的含义是"能**用**，但拿**不走**"。');
console.log('    诚实地说：XSS 仍然可以在页面活着的时候借用这把钥匙去解密 ——');
console.log('    它抬高的是攻击成本（无法把密钥带走长期复用），不是免疫。');

// ===========================================================================
console.log('\n--- 2. 唯一的合法"搬运"方式：结构化克隆 ---');
// ===========================================================================
// 浏览器要把 non-extractable 的 CryptoKey 存下来，靠的是 **结构化克隆**：
// CryptoKey 是规范明确允许被结构化克隆的对象之一（它会以"不可导出"的形态被复制）。
// IndexedDB 的 put() 走的就是结构化克隆算法，所以它能把 CryptoKey 原样存进去。
const clonedKey = structuredClone(lockedKey);
console.log('  structuredClone(non-extractable key) 的结果：');
console.log(`    是 CryptoKey 吗？ ${clonedKey instanceof CryptoKey}`);
console.log(`    仍然不可导出吗？ extractable = ${clonedKey.extractable}  <- **克隆不会放宽权限**`);
console.log(`    算法/用途是否保留？ ${clonedKey.algorithm.name} / usages=[${clonedKey.usages.join(', ')}]`);
const clonedIv = globalThis.crypto.getRandomValues(new Uint8Array(12));
const clonedCt = await subtle.encrypt({ name: 'AES-GCM', iv: clonedIv }, clonedKey, encoder.encode('via clone'));
const clonedPt = await subtle.decrypt({ name: 'AES-GCM', iv: clonedIv }, lockedKey, clonedCt);
console.log(`    克隆体能加密、原件能解密（说明密钥材料一致）："${decoder.decode(clonedPt)}"`);
console.log('    同一把密钥无法直接比较相等，只能这样"互相加解密"来验证它们一致。');

console.log('\n  浏览器里的持久化就这么写（下面是参考代码，本文件不执行 —— Node 没有 IndexedDB）：');
for (const line of [
  '// ---- 只在浏览器里跑 ----',
  'const key = await crypto.subtle.generateKey({ name:"AES-GCM", length:256 }, false, ["encrypt","decrypt"]);',
  '',
  'const db = await new Promise((resolve, reject) => {',
  '  const req = indexedDB.open("app-keys", 1);',
  '  req.onupgradeneeded = () => req.result.createObjectStore("keys");',
  '  req.onsuccess = () => resolve(req.result);',
  '  req.onerror = () => reject(req.error);',
  '});',
  '',
  '// put(value, keyPath) —— 值直接就是一个 CryptoKey 对象，IndexedDB 会用结构化克隆存它',
  'await new Promise((resolve, reject) => {',
  '  const tx = db.transaction("keys", "readwrite");',
  '  tx.objectStore("keys").put(key, "v1");',
  '  tx.oncomplete = resolve;',
  '  tx.onerror = () => reject(tx.error);',
  '});',
  '',
  '// 下次打开页面：读回来的仍然是一把 non-extractable、可以直接用的 CryptoKey',
  'const restored = await new Promise((resolve, reject) => {',
  '  const tx = db.transaction("keys", "readonly");',
  '  const req = tx.objectStore("keys").get("v1");',
  '  req.onsuccess = () => resolve(req.result);',
  '  req.onerror = () => reject(req.error);',
  '});',
  '// restored.extractable === false，且 restored.algorithm.name === "AES-GCM"',
]) {
  console.log(`    ${line}`);
}

console.log('\n  Node 里的替代方案对照（本文件后续只演示"进程内 Map"这一种）：');
const storageOptions = [
  ['浏览器 · IndexedDB', '✓ 能', 'non-extractable 的 CryptoKey 直接存活（结构化克隆）；同源页面脚本仍可读，仍要防 XSS'],
  ['浏览器 · localStorage', '✗ 不能（红线）', '只能存字符串，等于存明文；任何 XSS 一行 getItem 拿走，还会被落盘、被备份抓走'],
  ['浏览器 · 内存变量', '✓ 能', '最安全，但刷新即失；配合 Refresh Token 重新换取会话密钥'],
  ['Node · 模块级 Map', '✓ 能', '等价于浏览器内存方案，服务不重启就一直有效（本文件的做法）；多实例要各自持钥'],
  ['Node · 环境变量 / 密钥文件', '✓ 能', '字节会进进程内存，可能被 core dump / 日志带出；启动后立刻 importKey(..., false) 锁上'],
  ['Node · KMS / HSM / Vault', '✓✓ 最佳', '生产首选：密钥从不出 KMS，只借它的运算能力；代价是网络开销、要注意缓存与超时'],
  ['Node · wrapKey 再落盘', '✓ 能', '折中：磁盘上只有密文，解开需要 KEK（见小节 3）；KEK 本身还是得放 KMS'],
];
for (const [where, can, note] of storageOptions) {
  console.log(`    ${padLabel(where, 28)} ${padLabel(can, 14)} ${note}`);
}

// ===========================================================================
console.log('\n--- 3. 折中方案：用 AES-KW 把密钥"包"起来再存 ---');
// ===========================================================================
// 如果既想落盘、又没有 KMS，可以引入一把 **KEK（Key Encryption Key，密钥加密密钥）**：
// 用 KEK 把数据密钥（DEK）包成密文存进数据库/配置文件，运行时解开使用。
// 这就是 envelope encryption（信封加密）的最小形态；KEK 通常由 KMS 托管。
// 注意：wrapKey 要求被包的密钥 extractable=true（否则连包都包不出来）——
//       所以"能被包起来存磁盘的密钥"与"绝不离开内存的密钥"是两种存在形态，
//       真实项目里通常让 KMS 完成包裹，应用侧只拿 non-extractable 的那一份。
const kek = await subtle.generateKey({ name: 'AES-KW', length: 256 }, false, ['wrapKey', 'unwrapKey']);
console.log('  ① wrapKey：把数据密钥包成密文');
const dek = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
const wrappedDek = await subtle.wrapKey('raw', dek, kek, 'AES-KW');
console.log(`     明文密钥长度 32 字节 -> 包裹后 ${wrappedDek.byteLength} 字节`);
console.log('     多出的 8 字节是 AES-KW 自带的完整性校验码（RFC 3394），不是填充。');
console.log(`     包裹结果本身是随机的，这里只打印长度，不打印内容。`);
const unwrappedDek = await subtle.unwrapKey('raw', wrappedDek, kek, 'AES-KW', { name: 'AES-GCM' }, false, [
  'encrypt',
  'decrypt',
]);
console.log('  ② unwrapKey：解开还原，并**当场设成 non-extractable**');
console.log(`     unwrap 出来的密钥 extractable = ${unwrappedDek.extractable}（关键：权限在这一步收窄）`);
try {
  await subtle.exportKey('raw', unwrappedDek);
  console.log('     居然导出了？不应该。');
} catch (err) {
  console.log(`     再想导出它 -> ✗ ${err.name}：一旦 unwrap 成 non-extractable，就再也拿不回字节了。`);
}
console.log('  ③ 拿它实际加解密一次，确认解出来的密钥是对的：');
const dekIv = globalThis.crypto.getRandomValues(new Uint8Array(12));
const dekCt = await subtle.encrypt({ name: 'AES-GCM', iv: dekIv }, unwrappedDek, encoder.encode('unwrapped key works'));
console.log(`     解出来："${decoder.decode(await subtle.decrypt({ name: 'AES-GCM', iv: dekIv }, dek, dekCt))}"`);
console.log('  ④ 反过来：拿一把 non-extractable 的密钥去给别人打包，行不行？');
try {
  await subtle.wrapKey('raw', unwrappedDek, kek, 'AES-KW');
  console.log('     包成功了？不应该。');
} catch (err) {
  console.log(`     ✗ ${err.name}：wrapKey 要求**被包的密钥本身可导出**（否则等于绕开了闸门）。`);
  console.log('        所以"能被包起来上磁盘的密钥"和"绝不离开内存的密钥"是两种存在形态：');
  console.log('        KMS 负责包裹动作，应用侧拿到的永远是 non-extractable 的那一份。');
}

// ===========================================================================
console.log('\n--- 4. 模拟 KMS：密钥字节从哪里来 ---');
// ===========================================================================
/**
 * 模拟一次 KMS 调用：根据 kid 返回确定性的密钥字节。
 *
 * 真实项目里这里是一次网络请求（AWS KMS / GCP KMS / Vault），返回的往往是
 * 已经包裹好的密文，或者直接由 KMS 提供加解密能力。
 * 本示例用 SHA-256 派生，是为了让**输出可复现**，并且方便和 node:crypto 交叉验证。
 * @param {string} kid 密钥版本号
 * @returns {Promise<Uint8Array>} 32 字节的 AES-256 密钥材料
 */
async function fetchKeyBytesFromKms(kid) {
  const digest = await subtle.digest('SHA-256', encoder.encode(`kms://demo-keyring/${kid}`));
  return new Uint8Array(digest);
}

const kmsProbeA = await fetchKeyBytesFromKms('probe');
const kmsProbeB = await fetchKeyBytesFromKms('probe');
console.log(`  fetchKeyBytesFromKms('probe') -> ${kmsProbeA.byteLength} 字节（AES-256 规格）`);
console.log(`    同一个 kid 取两次结果相同？ ${toHex(kmsProbeA) === toHex(kmsProbeB)}（确定性派生，仅为让输出可复现）`);
console.log(`    换一个 kid 结果完全不同？   ${toHex(kmsProbeA) !== toHex(await fetchKeyBytesFromKms('probe2'))}`);
console.log('  真实 KMS 每次调用返回的都是随机材料或包裹结果，这里是 SHA-256 派生，');
console.log('  目的是让"密钥字节"在脚本里可复现，从而能和 node:crypto 做交叉验证。');

// ===========================================================================
console.log('\n--- 5. KeyRing：一个可运行的密钥环 ---');
// ===========================================================================
// 前面四节解决了"密钥存在哪"，接下来解决"怎么换、怎么撤"。
// 下面的 KeyRing 就是全部答案：**一个 kid -> CryptoKey 的 Map，加一个当前版本号**。
// 它只有四个对外动作 —— rotate（加新钥并切换）、encrypt（用当前钥）、
// decrypt（按密文里的 kid 查表）、revoke（摘掉旧钥）。不到五十行，但足够上生产。
//
/**
 * 打包格式（自己定，但必须写进协议文档）：
 *   kidLen(1 字节) || kid(kidLen 字节, UTF-8) || iv(12 字节) || 密文+认证标签(其余)
 * 为什么把 kid 放在最前面：解密方要先知道"用哪把钥匙"，才谈得上解密。
 */
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

/**
 * 把 kid + iv + 密文打成一个自包含的字节包。
 * @param {string} kid 密钥版本号
 * @param {Uint8Array} iv 12 字节初始化向量
 * @param {Uint8Array} ciphertext 密文（末尾含 16 字节认证标签）
 * @returns {Uint8Array} 打包结果
 */
function packEnvelope(kid, iv, ciphertext) {
  const kidBytes = encoder.encode(kid);
  if (kidBytes.byteLength > 255) throw new Error('kid 太长（最多 255 字节）');
  const out = new Uint8Array(1 + kidBytes.byteLength + IV_LENGTH + ciphertext.byteLength);
  out[0] = kidBytes.byteLength;
  out.set(kidBytes, 1);
  out.set(iv, 1 + kidBytes.byteLength);
  out.set(ciphertext, 1 + kidBytes.byteLength + IV_LENGTH);
  return out;
}

/**
 * 拆开字节包。这一步**不做任何校验** —— 校验交给 AES-GCM 的认证标签（AAD 绑定 kid）。
 * @param {Uint8Array} packed
 * @returns {{ kid: string, iv: Uint8Array, ciphertext: Uint8Array }}
 */
function unpackEnvelope(packed) {
  const kidLength = packed[0];
  const kid = decoder.decode(packed.subarray(1, 1 + kidLength));
  const ivStart = 1 + kidLength;
  const iv = packed.subarray(ivStart, ivStart + IV_LENGTH);
  const ciphertext = packed.subarray(ivStart + IV_LENGTH);
  return { kid, iv, ciphertext };
}

/** 把 kid 作为 AAD：任何对 kid 字段的篡改都会让 GCM 认证失败。 */
const aadFor = (kid) => encoder.encode(`kid=${kid}`);

/**
 * 密钥环：一组"带版本号"的密钥，加上一个"当前用于加密"的版本号。
 *
 * 三条不变量（任何一条破了都会出事故）：
 *   1. encrypt 永远用 activeKid；
 *   2. decrypt 永远按密文里的 kid 去找密钥，**绝不猜**；
 *   3. revoke 只从环里摘掉解密能力，绝不改动已发出的密文。
 */
class KeyRing {
  /** @type {Map<string, CryptoKey>} kid -> CryptoKey（全部以 non-extractable 形态驻留内存） */
  #keys = new Map();
  /** @type {string|null} 当前用于加密的 kid */
  #activeKid = null;
  /** @type {Set<string>} 曾经存在、已被撤销的 kid（用于给出准确错误信息） */
  #revoked = new Set();

  /** 环里现有的 kid 列表（顺带体现"新旧并存"）。 */
  get kids() {
    return [...this.#keys.keys()];
  }

  /** 当前加密用的 kid。 */
  get activeKid() {
    return this.#activeKid;
  }

  /**
   * 把一个密钥加入环（字节来源通常是 KMS）。
   * 关键一行：extractable 传 false —— 从此这份字节就锁在 Web Crypto 内部了。
   * @param {string} kid
   * @param {Uint8Array} keyBytes 32 字节
   * @returns {Promise<void>}
   */
  async addKey(kid, keyBytes) {
    const key = await subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
    this.#keys.set(kid, key);
    this.#revoked.delete(kid);
  }

  /**
   * 轮换：生成（取回）一把新密钥并切换为当前版本；**旧密钥继续留在环里**。
   * 这正是"平滑轮换"的全部秘密 —— 一行都不删。
   * @param {string} newKid
   * @returns {Promise<void>}
   */
  async rotate(newKid) {
    if (this.#keys.has(newKid)) throw new Error(`kid ${newKid} 已存在，轮换必须换一个新的版本号`);
    await this.addKey(newKid, await fetchKeyBytesFromKms(newKid));
    this.#activeKid = newKid;
  }

  /**
   * 撤销：把某个 kid 从环里彻底摘掉。之后**所有用该密钥加密的密文都将无法解开**。
   * 只在两种情况下调用：① 确认存量数据已全部重加密；② 密钥泄漏，宁可丢数据也不让攻击者读。
   * @param {string} kid
   * @returns {boolean} 是否真的撤销了一个存在的 kid
   */
  revoke(kid) {
    const existed = this.#keys.delete(kid);
    this.#revoked.add(kid);
    if (this.#activeKid === kid) this.#activeKid = null; // 绝不允许用一把已撤销的密钥加密新数据
    return existed;
  }

  /**
   * 加密：用 activeKid，随机生成 IV，并把 kid 同时写进密文和 AAD。
   * @param {string} plaintext
   * @returns {Promise<Uint8Array>} 自包含的信封
   */
  async encrypt(plaintext) {
    if (!this.#activeKid) throw new Error('密钥环没有可用的加密密钥（可能全部被撤销了）');
    const kid = this.#activeKid;
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const ciphertext = new Uint8Array(
      await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aadFor(kid) }, this.#keys.get(kid), encoder.encode(plaintext)),
    );
    return packEnvelope(kid, iv, ciphertext);
  }

  /**
   * 解密：从信封里读出 kid，找对应的密钥。
   * 找不到就**明确报错**，绝不回退到"用当前密钥试一下" —— 那是事故的温床。
   * @param {Uint8Array} packed
   * @returns {Promise<{ kid: string, text: string, plaintext: string }>}
   */
  async decrypt(packed) {
    const { kid, iv, ciphertext } = unpackEnvelope(packed);
    const key = this.#keys.get(kid);
    if (!key) {
      throw new Error(
        this.#revoked.has(kid) ? `密钥 ${kid} 已被撤销，该密文永久不可解` : `密钥环里没有 kid=${kid}`,
      );
    }
    const plainBuffer = await subtle.decrypt(
      { name: 'AES-GCM', iv, additionalData: aadFor(kid) },
      key,
      ciphertext,
    );
    return { kid, text: decoder.decode(plainBuffer), plaintext: new Uint8Array(plainBuffer) };
  }
}

// ===========================================================================
console.log('\n--- 6. 轮换演练：v1 加密 -> 轮到 v2 -> 旧密文还能解 ---');
// ===========================================================================
const keyring = new KeyRing();
await keyring.rotate('2026-01'); // 第一把密钥，版本号用日期是个常见做法
console.log(`  初始状态：kids = [${keyring.kids.join(', ')}]，activeKid = ${keyring.activeKid}`);

const orderA = 'order:A1001;amount:1999;to:alice';
const envelopeA = await keyring.encrypt(orderA);
const metaA = unpackEnvelope(envelopeA);
console.log(`\n  ① 用 ${keyring.activeKid} 加密一条订单：`);
console.log(`     明文长度 ${encoder.encode(orderA).byteLength} 字节`);
console.log(`     信封总长 ${envelopeA.byteLength} 字节 = kidLen(1) + kid(${metaA.kid.length}) + iv(12) + 密文+tag(${metaA.ciphertext.byteLength})`);
console.log(`     信封里明文的 kid = "${metaA.kid}"（kid 不需要保密，它只是个路由标签）`);
console.log(`     解密：${JSON.stringify((await keyring.decrypt(envelopeA)).text)}`);

console.log('\n  ② 触发轮换（现实里可能是定时任务 / 合规要求 / 密钥泄漏）：');
await keyring.rotate('2026-02');
console.log(`     轮换后：kids = [${keyring.kids.join(', ')}]，activeKid = ${keyring.activeKid}`);
console.log('     注意 kids 里**旧密钥还在** —— 这就是"新旧并存"，一行都没删。');

const orderB = 'order:A1002;amount:88;to:bob';
const envelopeB = await keyring.encrypt(orderB);
console.log(`\n  ③ 新数据自动用新密钥：`);
console.log(`     信封B 的 kid = "${unpackEnvelope(envelopeB).kid}"（= activeKid，无需调用方关心）`);

console.log('\n  ④ 最关键的验证：解析旧信封');
const stillReadable = await keyring.decrypt(envelopeA);
console.log(`     信封A（v1）现在还能解吗？ ✓ "${stillReadable.text}"（用 kid=${stillReadable.kid} 找到了旧密钥）`);
console.log(`     信封B（v2）呢？         ✓ "${(await keyring.decrypt(envelopeB)).text}"`);
console.log('     两把密钥同时活着，各自服务自己的密文 —— 平滑轮换达成，零停机。');

console.log('\n  ⑤ 顺带验证"kid 被篡改"会怎样（这就是把它放进 AAD 的价值）：');
const forged = new Uint8Array(envelopeA);
forged.set(encoder.encode('2026-02'), 1); // 把信封 A 的 kid 从 2026-01 改成 2026-02
console.log(`     把信封A 的 kid 字节就地改成 "2026-02" 后解密：`);
try {
  await keyring.decrypt(forged);
  console.log('     居然解开了？不应该。');
} catch (err) {
  console.log(`     ✗ ${err.name}：${err.message}`);
  console.log('     如果 kid 不在 AAD 里，这时会拿着**错误的密钥**去解密，');
  console.log('     得到的错误信息会变成"密钥不匹配"，运维会误以为"是不是密钥轮换做错了"。');
  console.log('     放进 AAD 后，错误立刻收敛成"这批数据被篡改了"，指向真正的根因。');
}

// ===========================================================================
console.log('\n--- 7. 撤销演练：泄漏之后怎么办 ---');
// ===========================================================================
console.log('  剧情：安全团队发现 2026-01 这把密钥曾经被打印进过日志 —— 必须撤销。');
console.log('  但直接 revoke 会让存量密文全部读不出来。所以正确顺序是：');
console.log('    (1) 用旧密钥解密存量数据 -> (2) 用当前密钥重新加密 -> (3) 确认迁移完成后 revoke');
console.log('\n  ① 先做重加密迁移（re-encrypt migration）：');
const storedEnvelopes = [envelopeA]; // 假设这是"数据库里的全部密文"
const migrated = [];
for (const env of storedEnvelopes) {
  const { kid, plaintext } = await keyring.decrypt(env);
  const envNew = await keyring.encrypt(decoder.decode(plaintext));
  migrated.push(envNew);
  console.log(`     kid=${kid} 的密文 -> 用 ${unpackEnvelope(envNew).kid} 重加密完成`);
}
console.log(`     迁移前后密文长度：${storedEnvelopes[0].byteLength} -> ${migrated[0].byteLength} 字节`);
console.log(`     重加密后能读吗？ ✓ "${(await keyring.decrypt(migrated[0])).text}"`);

console.log('\n  ② 确认没有遗漏后，撤销旧密钥：');
const revoked = keyring.revoke('2026-01');
console.log(`     revoke('2026-01') -> ${revoked}，现在 kids = [${keyring.kids.join(', ')}]`);
console.log(`     撤销后 activeKid = ${keyring.activeKid}（没有被误伤）`);
console.log(`     用旧密钥的**原始信封**再试：`);
try {
  await keyring.decrypt(envelopeA);
  console.log('     解开了？不应该。');
} catch (err) {
  console.log(`     ✗ ${err.name}：${err.message}`);
  console.log('       —— 这就是"撤销"的真实含义：不是删除数据，而是让数据**变得不可解**。');
  console.log('         对称加密没有后门，密钥没了，密文就是一堆随机字节。');
}
console.log(`     迁移后的信封仍然可读：✓ "${(await keyring.decrypt(migrated[0])).text}"（它用的是 2026-02）`);
console.log(`     新数据仍能正常加密：✓ kid=${unpackEnvelope(await keyring.encrypt('order:A1003;amount:1')).kid}`);

console.log('\n  ③ 撤销的两个真实场景（策略不同，别混）：');
const revokeCases = [
  ['常规下线（有迁移窗口）', '先重加密全部存量数据，确认无遗漏，再 revoke', '数据零丢失，可以慢慢来'],
  ['密钥泄漏（争分夺秒）', '**立刻 revoke**，接受存量密文全部不可读的代价', '安全 > 可用性；同时启用新密钥、通知受影响用户'],
];
for (const [scene, action, cost] of revokeCases) {
  console.log(`     ${padLabel(scene, 26)}${padLabel(action, 44)}${cost}`);
}
console.log('     判断依据只有一个：**这把密钥保护的数据，泄漏出去更可怕，还是丢失更可怕？**');

console.log('\n  ④ 别忘了：撤销的应该是一整套相关密钥');
console.log('     如果同一份密钥材料被复制到了多个服务/多个环境，只撤销一处等于没撤 ——');
console.log('     生产环境要能回答"这把密钥现在被哪几个部署单元持有"，答案必须是"只有一处"。');

// ===========================================================================
console.log('\n--- 8. 与 node:crypto 交叉验证（双向，含 AAD）---');
// ===========================================================================
// 交叉验证的意义：证明我们自定义的信封格式**没有把标准 AES-GCM 用歪**，
// 任何语言（Java/Go/Python）只要按同样的打包规则，都能解开我们写下的密文。
const v2Bytes = await fetchKeyBytesFromKms('2026-02');
const envB = envelopeB;
const { kid: envBKid, iv: envBIv, ciphertext: envBCt } = unpackEnvelope(envB);

console.log('  方向 A：Web Crypto 加密 -> node:crypto 解密');
const nodeDecipher = createDecipheriv('aes-256-gcm', Buffer.from(v2Bytes), Buffer.from(envBIv));
// node 的接口要求把 AAD 和 tag **分别**设置回去（Web Crypto 是拼在密文末尾的）
nodeDecipher.setAAD(Buffer.from(aadFor(envBKid)));
nodeDecipher.setAuthTag(Buffer.from(envBCt.subarray(envBCt.byteLength - TAG_LENGTH)));
const nodePlain = Buffer.concat([
  nodeDecipher.update(Buffer.from(envBCt.subarray(0, envBCt.byteLength - TAG_LENGTH))),
  nodeDecipher.final(),
]);
console.log(`     node 解出的明文："${nodePlain.toString('utf8')}"`);
console.log(`     与原文一致？ ${nodePlain.toString('utf8') === orderB}`);

console.log('\n  方向 B：node:crypto 加密 -> KeyRing 解密');
const nodeIv = Buffer.alloc(IV_LENGTH, 0x5a); // 固定 IV 只为让输出可复现
const nodeCipher = createCipheriv('aes-256-gcm', Buffer.from(v2Bytes), nodeIv);
nodeCipher.setAAD(Buffer.from(aadFor('2026-02')));
const nodeCt = Buffer.concat([nodeCipher.update(Buffer.from('order:A2001;amount:5;from:node', 'utf8')), nodeCipher.final()]);
const nodeEnvelope = packEnvelope('2026-02', new Uint8Array(nodeIv), new Uint8Array(Buffer.concat([nodeCt, nodeCipher.getAuthTag()])));
console.log(`     node 侧按同样的信封格式打包，共 ${nodeEnvelope.byteLength} 字节`);
console.log(`     KeyRing 解出："${(await keyring.decrypt(nodeEnvelope)).text}"`);

console.log('\n  方向 C：用**错误的 AAD**（漏掉 kid 绑定）解同一份密文：');
const wrongAadDecipher = createDecipheriv('aes-256-gcm', Buffer.from(v2Bytes), Buffer.from(envBIv));
wrongAadDecipher.setAuthTag(Buffer.from(envBCt.subarray(envBCt.byteLength - TAG_LENGTH)));
try {
  Buffer.concat([
    wrongAadDecipher.update(Buffer.from(envBCt.subarray(0, envBCt.byteLength - TAG_LENGTH))),
    wrongAadDecipher.final(),
  ]);
  console.log('     解开了？不应该。');
} catch (err) {
  console.log(`     ✗ ${err.code ?? err.name}（"unable to authenticate data" 那一类）`);
  console.log('       证明 AAD 真的参与了认证，跨语言实现时**漏设 AAD 是最常见的对接事故**。');
}

// ===========================================================================
console.log('\n--- 9. 红线清单：密钥绝不能出现在这些地方 ---');
// ===========================================================================
const redLines = [
  ['前端源码 / 打包产物', '打包混淆只是改名字，view-source 和断点调试都能拿到；密钥必须在服务端'],
  ['localStorage / sessionStorage', '明文可读、会落盘与备份，任何一行 XSS 都能带走'],
  ['日志 / console.log / APM', 'exportKey 的结果、含密钥字段的整个 config 对象、请求体回显'],
  ['URL / query string', '会进浏览器历史、Referer 头、反向代理访问日志'],
  ['Git 仓库 / 镜像层 / Dockerfile', '历史提交删不掉；镜像层可以用 docker history 翻出来'],
  ['错误信息 / 异常堆栈', '把密钥拼进报错文本，会被错误上报平台长期保存'],
  ['前端可访问的接口', '"给我密钥"的调试接口一旦上线，等于把钥匙挂在门把手上'],
  ['聊天工具 / 工单 / 截图', '密钥通过任何人类渠道传递过，就算已经泄漏，必须轮换'],
];
for (const [where, why] of redLines) {
  console.log(`    ✗ ${padLabel(where, 28)}${why}`);
}
console.log('\n  正确的存放位置只有三个：KMS/HSM、受控的密钥文件（0600 + 独立进程）、');
console.log('  以及**运行时的进程内存**（importKey 成 non-extractable 之后）。');

console.log('\n  生产检查清单：');
const checklist = [
  ['生成', 'crypto.getRandomValues / generateKey；绝不用 Math.random、绝不用口令派生（口令场景见 05 篇）'],
  ['导入', '一律 importKey(..., extractable = false, ...)；只有"要被 wrap 上盘"的密钥才允许 true'],
  ['存储', 'KMS 优先；退而求其次用密钥文件（0600）或环境变量，并在启动后立刻锁成 non-extractable'],
  ['轮换周期', '写进制度：按时间（如 90 天）、按用量（加密次数上限）、按事件（人员变动 / 疑似泄漏）'],
  ['密文自带 kid', '信封格式 `kidLen || kid || iv || 密文+tag`，并把 kid 放进 AAD'],
  ['新旧并存', 'rotate 只加不删；解密严格按 kid 查表，找不到就报错，**绝不回退尝试别的密钥**'],
  ['重加密迁移', '批量把旧密文解密后用新密钥重加密；可分批、可断点续做'],
  ['撤销', '迁移确认完成后 revoke；泄漏场景直接 revoke 并接受数据不可读'],
  ['监控', '统计"还在用旧 kid 解密的次数"，它会告诉你迁移有没有真正完成'],
  ['审计', '记录 kid 的创建/使用/撤销时间点 —— 事故复盘时这比什么都重要'],
];
for (const [k, v] of checklist) console.log(`    ${padLabel(k, 14)}${v}`);

// ===========================================================================
console.log('\n--- 10. 小结 ---');
// ===========================================================================
const summary = [
  '1) extractable=false 是密钥的第一道闸门：能**用**、拿**不走**。exportKey 会抛 InvalidAccessError。',
  '   （Node 抛的是子类 InvalidAccessException，判断时用 includes("InvalidAccess") 更稳。）',
  '2) 非可导出密钥唯一的持久化之路是**结构化克隆**：浏览器 put 进 IndexedDB。',
  '   JSON.stringify(key) 只会得到 {}；localStorage 存不了 CryptoKey，只能存明文 —— 那是红线。',
  '3) Node 没有 IndexedDB，替代方案是"进程内 Map + 启动时从 KMS/密钥文件导入并锁成不可导出"，',
  '   或者用 AES-KW 做信封加密（wrapKey/unwrapKey，见小节 3）。',
  '4) **kid 是密钥生命周期管理的支点**：密文自带 kid，解密按 kid 查表，',
  '   于是"轮换"变成"往环里加一把新钥匙"，"撤销"变成"从环里摘掉一把旧钥匙"。',
  '5) 平滑轮换的正确姿势：rotate 只加不删 -> 新数据用新钥 -> 旧密文仍可解 ->',
  '   存量重加密迁移 -> 确认无遗漏 -> revoke 旧钥。本文件把这五步全跑了一遍。',
  '6) 撤销的真实含义是"让数据不可解"，不是"删除数据"。对称加密没有后门。',
  '7) kid 必须放进 AAD 一起认证，否则"改 kid"会伪装成"密钥不匹配"，误导排查方向。',
  '8) 交叉验证通过：自定义信封格式与 node:crypto 的 aes-256-gcm 双向互通（含 AAD）。',
  '9) 红线一句话：**密钥只能待在 KMS 或运行内存里**，其余一切位置（源码、localStorage、',
  '   日志、URL、Git、错误上报）都等于公开。',
];
for (const line of summary) console.log(`  ${line}`);
