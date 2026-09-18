/**
 * ============================================================================
 * 知识点：uuid —— v4 / v7 生成、唯一性演示、与 crypto.randomUUID 对比
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】入门
 * 【前置知识】无特殊要求，了解"主键 / 唯一标识"的概念即可
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    UUID（Universally Unique Identifier，通用唯一识别码）是一个 128 位（16 字节）的
 *    标识符，标准写法是 36 个字符的字符串，形如：
 *      550e8400-e29b-41d4-a716-446655440000
 *    结构是 8-4-4-4-12 共 5 段，用连字符分隔。
 *
 *    常用的几个版本：
 *      v1  基于"时间戳 + MAC 地址"  —— 有序，但会泄漏 MAC 地址（隐私问题），不推荐
 *      v3  基于 MD5 的"命名空间 + 名字" —— 同样的输入永远得到同样的 UUID（确定性）
 *      v4  纯随机（122 位随机数）    —— 最常用，实现简单，无序
 *      v5  基于 SHA-1 的"命名空间 + 名字" —— 与 v3 同理，但哈希更强
 *      v7  基于 Unix 毫秒时间戳 + 随机数 —— **按时间有序**，是近年来的新宠
 *
 *    为什么"有序"很重要？因为数据库主键如果是随机无序的（v4），
 *    每次插入都会落在 B+ 树的随机位置，导致页分裂、缓存命中率低、写入变慢。
 *    用 v7 做主键，新记录总是追加到索引末尾，写入性能接近自增 ID，
 *    同时又保留了"客户端可以本地生成、不依赖数据库"的好处。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *      - 数据库主键：分布式系统里自增 ID 会冲突，UUID 可以客户端生成；
 *      - 幂等键：下单请求带一个 UUID，服务端用它去重；
 *      - 文件名/对象存储 key：上传的图片用 UUID 命名，避免同名覆盖；
 *      - 链路追踪 ID：一次请求贯穿多个服务时用它串联日志；
 *      - 前端列表的稳定 key（注意：只在数据本身没有业务 id 时才这样用）。
 *
 * 3. 核心语法要点
 *    import { v4 as uuidv4, v7 as uuidv7, validate, version, NIL, parse, stringify } from 'uuid';
 *    uuidv4()                生成随机 UUID（字符串）
 *    uuidv7()                生成按时间有序的 UUID（字符串）
 *    v4 与 v7 也有 .buffer / .bytes 形式（生成到已有数组，零分配）：
 *      v4({}, buffer) 或 v4(null, buffer)
 *    validate(str)           是否是合法 UUID（任意版本）
 *    version(str)            返回版本号数字（1/3/4/5/7），非法时抛错
 *    NIL                     全零 UUID "00000000-0000-0000-0000-000000000000"
 *    parse(str) -> Uint8Array(16)     字符串转字节
 *    stringify(bytes) -> str          字节转字符串
 *    v3(name, namespace) / v5(name, namespace)  确定性 UUID
 *
 * 4. 常见陷阱
 *    - 用 Math.random() 自己拼 UUID：Math.random() 的随机性远达不到密码学强度，
 *      在 1 亿量级下有可观测的碰撞概率，且不同浏览器实现差异大。
 *    - v4 做主键的性能问题：如上所述，随机主键会拖慢写入。
 *      数据量大（千万级以上）时应优先 v7 或数据库自增 + 业务 UUID 双列方案。
 *    - 把 UUID 存成 varchar(36)：空间浪费且索引变慢。
 *      关系型数据库应存成 BINARY(16) / uuid 类型（PostgreSQL 原生支持 uuid）。
 *    - 跨版本解析假设：不要假设第三方系统给你的 UUID 是 v4。
 *      用 version() 检查，或者在业务上直接当作不透明字符串使用。
 *    - crypto.randomUUID() 在浏览器里要求安全上下文（HTTPS 或 localhost），
 *      在 http 页面上会报错 —— 这是前端上线后才发现的经典问题。
 *    - 误以为 UUID 绝对不重复：它是"概率上极低"，不是"数学上不可能"。
 *      v4 需要生成约 2.7×10^18 个才有 50% 概率出现一次碰撞。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/06_uuid.js
 *
 * 【预期输出】
 *   演示 v4 / v7 / v1 / v5 的生成与校验、v7 的时间有序性、
 *   以及 uuid 包与 crypto.randomUUID 的对比。退出码 0。
 * ============================================================================
 */

import { v1 as uuidv1, v4 as uuidv4, v5 as uuidv5, v7 as uuidv7, validate, version, NIL, parse, stringify } from 'uuid';
import { randomUUID, getRandomValues } from 'node:crypto';
import assert from 'node:assert/strict';

console.log('--- 1. v4：纯随机 UUID（最常用）---');

const sample4 = uuidv4();
console.log(`  uuidv4() -> ${sample4}`);
console.log(`  长度：${sample4.length} 个字符（32 个十六进制字符 + 4 个连字符）`);
console.log(`  结构：8-4-4-4-12 = ${sample4.split('-').map((s) => s.length).join('-')}`);
console.log(`  版本号（第 13 位）：${sample4[14]}（0x4 表示版本 4）`);
console.log(`  变体号（第 17 位）：${sample4[19]}（8/9/a/b 之一，表示 RFC 4122 变体）`);
console.log(`  version(uuid) -> ${version(sample4)}`);
console.log('');

// 生成一批，观察随机性
const batch4 = Array.from({ length: 5 }, () => uuidv4());
console.log('  连续生成 5 个 v4：');
for (const id of batch4) console.log(`    ${id}`);
console.log('  注意：相邻两次生成毫无规律，因为 v4 的 122 位全是随机的。');
console.log('');

console.log('--- 2. v7：按时间有序的 UUID ---');

const sample7 = uuidv7();
console.log(`  uuidv7() -> ${sample7}`);
console.log(`  version(uuid) -> ${version(sample7)}`);
console.log('  v7 的前 48 位是 Unix 毫秒时间戳，因此同一毫秒内生成的 UUID 前缀相同。');
console.log('');

console.log('  演示时间有序性（连续生成 5 个，间隔 2ms）：');
/** 记录生成结果与时间 */
const batch7 = [];
for (let i = 0; i < 5; i += 1) {
  batch7.push({ id: uuidv7(), at: Date.now() });
  // 等待 2ms，保证时间戳部分真的变化
  await new Promise((resolve) => setTimeout(resolve, 2));
}
for (const { id } of batch7) console.log(`    ${id}`);

// 关键结论：v7 的字符串按字典序排序 = 按生成时间排序
const sorted7 = [...batch7.map((r) => r.id)].sort();
const inOrder7 = batch7.map((r) => r.id);
console.log(`  按字典序排序后与生成顺序一致？${JSON.stringify(sorted7) === JSON.stringify(inOrder7)}`);

// 对比：v4 排序后完全乱序
const sorted4 = [...batch4].sort();
console.log(`  对照：v4 排序后与生成顺序一致？${JSON.stringify(sorted4) === JSON.stringify(batch4)}`);
console.log('');

console.log('  为什么"有序"在数据库里很重要：');
console.log('    以 MySQL InnoDB 为例，主键是聚簇索引，数据按主键顺序存储；');
console.log('    - 自增 ID / UUIDv7：新行总是追加到最后一页，写入是顺序 I/O；');
console.log('    - UUIDv4：新行随机插入到中间某页，触发页分裂、大量随机 I/O，');
console.log('      实测在高并发写入下吞吐可能差 3~10 倍。');
console.log('');

console.log('  从 v7 中还原时间戳：');
// v7 的前 12 个十六进制字符就是毫秒时间戳
const timestampHex = sample7.replace(/-/g, '').slice(0, 12);
const extractedMs = Number.parseInt(timestampHex, 16);
console.log(`    UUID 前缀（去连字符后前 12 位）：${timestampHex}`);
console.log(`    解析出的毫秒时间戳：${extractedMs}`);
console.log(`    还原成本地时间：${new Date(extractedMs).toISOString()}`);
console.log('    与当前时间的差距：', Math.abs(Date.now() - extractedMs), 'ms（应当很小）');
console.log('    这个特性很有用：从主键就能看出记录的创建时间，不用额外加 created_at 索引。');
console.log('');

console.log('--- 3. 唯一性演示 ---');

// 演示 1：小批量无碰撞
const SMALL_BATCH = 100_000;
const seen = new Set();
const t0 = Date.now();
for (let i = 0; i < SMALL_BATCH; i += 1) {
  seen.add(uuidv4());
}
const elapsed = Date.now() - t0;
console.log(`  生成 ${SMALL_BATCH.toLocaleString('en-US')} 个 v4，耗时 ${elapsed}ms`);
console.log(`  Set 中的唯一值数量：${seen.size.toLocaleString('en-US')}（等于生成数量即无碰撞）`);

// 演示 2：唯一性的概率量级（不真的生成，成本太高）
console.log('');
console.log('  v4 的碰撞概率量级（数学计算，不是实测）：');
console.log('    v4 有 122 位随机位，总可能值约 5.3 × 10^36 个；');
console.log('    根据生日悖论，生成约 2.7 × 10^18 个才会有 50% 的碰撞概率；');
console.log('    按每毫秒生成 10 亿个计算，也要 85 年才能到那个量级。');
// 用浮点近似演示这个量级（Math.pow 的精度足够表达数量级）
const possibleValues = 2 ** 122;
const fiftyPercentBirthday = Math.sqrt(2 * possibleValues * Math.LN2);
console.log(`    代码验证：2^122 ≈ ${possibleValues.toExponential(2)}；`);
console.log(`    生日悖论公式 sqrt(2 * N * ln2) ≈ ${fiftyPercentBirthday.toExponential(2)}`);
console.log('    结论：实践中可以认为不会碰撞，但"概率极低"不等于"数学上不可能"，');
console.log('          所以数据库该有的唯一索引还是要建。');

// 演示 3：v5 是"确定性"的 —— 同样的输入永远得到同样的 UUID
const NAMESPACE_DNS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // 标准中预定义的 DNS 命名空间
const id1 = uuidv5('example.com', NAMESPACE_DNS);
const id2 = uuidv5('example.com', NAMESPACE_DNS);
const id3 = uuidv5('other.com', NAMESPACE_DNS);
console.log('');
console.log('  v5（确定性 UUID，基于 SHA-1）：');
console.log(`    v5('example.com') = ${id1}`);
console.log(`    v5('example.com') = ${id2}（与上一次完全相同）`);
console.log(`    v5('other.com')   = ${id3}（输入不同则结果不同）`);
console.log('  用途：需要"由业务键稳定地推导出一个 ID"时（例如把用户邮箱映射成固定的匿名 ID）。');
console.log('  注意：v5 的结果可预测，因此不能用于需要不可猜测性的场景（如邀请码、会话 ID）。');
console.log('');

console.log('--- 4. v1：基于时间戳与 MAC 地址（了解即可，不推荐使用）---');

const sample1 = uuidv1();
console.log(`  uuidv1() -> ${sample1}`);
console.log('  为什么不推荐：');
console.log('    1. 包含生成机器的 MAC 地址 —— 泄漏硬件信息，有隐私与合规风险；');
console.log('    2. 同一台机器上的相邻 UUID 可被预测，不能用于安全场景；');
console.log('    3. 现代替代品是 v7（同样时间有序，但用随机数替代了 MAC 地址）。');
console.log('');

console.log('--- 5. 校验与工具函数 ---');

const validCases = [sample4, sample7, sample1, NIL, id1];
const invalidCases = [
  'not-a-uuid',
  '550e8400e29b41d4a716446655440000', // 缺少连字符
  '550e8400-e29b-41d4-a716-44665544000', // 少一位
  '550e8400-e29b-41d4-a716-44665544000g', // 含非法字符
  'ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ',
];
console.log('  validate() 合法用例：');
for (const v of validCases) console.log(`    ${validate(v) ? '✔' : '✖'} ${v}`);
console.log('  validate() 非法用例：');
for (const v of invalidCases) console.log(`    ${validate(v) ? '✔' : '✖'} ${v}`);

console.log('');
console.log(`  version() 提取版本号：v4 -> ${version(sample4)}，v7 -> ${version(sample7)}，v1 -> ${version(sample1)}，v5 -> ${version(id1)}`);
try {
  version('not-a-uuid');
} catch (error) {
  console.log(`  version('not-a-uuid') 会抛错：${error.message}`);
}

// parse / stringify：字符串与 16 字节之间互转，用于存 BINARY(16)
const bytes = parse(sample4);
console.log('');
console.log(`  parse(uuid) -> Uint8Array，长度 = ${bytes.length} 字节（128 位 = 16 字节）`);
console.log(`    前 4 个字节：${Array.from(bytes.slice(0, 4)).map((b) => b.toString(16).padStart(2, '0')).join(' ')}`);
console.log(`  stringify(bytes) 还原 -> ${stringify(bytes)}`);
console.log(`  与原始字符串一致？${stringify(bytes) === sample4}`);
console.log('  真实用途：数据库存 BINARY(16) 比 varchar(36) 省一半以上空间，且索引更快。');
console.log(`  NIL（全零 UUID）：${NIL}`);
console.log('  用途：表示"空值但有 UUID 类型"的场景（类似数值类型的 0），避免用 NULL。');
console.log('');

console.log('--- 6. 与 crypto.randomUUID 对比 ---');

// Node 14.17+ / 浏览器安全上下文下可用。它生成的就是一个 v4 UUID。
const cryptoId = randomUUID();
console.log(`  crypto.randomUUID() -> ${cryptoId}`);
console.log(`  version() 识别为：${version(cryptoId)}（就是 v4）`);
console.log(`  validate() 通过：${validate(cryptoId)}`);

// 性能对比：uuid 包的 v4 与原生 randomUUID
const N = 100_000;

let start = Date.now();
const setA = new Set();
for (let i = 0; i < N; i += 1) setA.add(uuidv4());
const timeUuidV4 = Date.now() - start;

start = Date.now();
const setB = new Set();
for (let i = 0; i < N; i += 1) setB.add(randomUUID());
const timeCrypto = Date.now() - start;

start = Date.now();
const setC = new Set();
for (let i = 0; i < N; i += 1) setC.add(uuidv7());
const timeUuidV7 = Date.now() - start;

console.log('');
console.log(`  生成 ${N.toLocaleString('en-US')} 个的性能对比（同一进程，仅供参考量级）：`);
console.log(`    uuid.v4()            ${String(timeUuidV4).padStart(5)}ms  （唯一值 ${setA.size}）`);
console.log(`    crypto.randomUUID()  ${String(timeCrypto).padStart(5)}ms  （唯一值 ${setB.size}）`);
console.log(`    uuid.v7()            ${String(timeUuidV7).padStart(5)}ms  （唯一值 ${setC.size}）`);
console.log('    结论：v4 场景下原生 randomUUID 通常更快（无额外抽象层）；');
console.log('          但 uuid 包提供了 v7、v5、validate、parse 等原生没有的能力。');

// 也可以直接用 crypto 的随机源自己构造 v7（说明 uuid 包的实现原理）
const customBytes = getRandomValues(new Uint8Array(16));
const nowMs = BigInt(Date.now());
// 前 6 字节写入 48 位毫秒时间戳
for (let i = 0; i < 6; i += 1) {
  customBytes[i] = Number((nowMs >> BigInt(8 * (5 - i))) & 0xffn);
}
// 第 7 字节的高 4 位设为 0x7（版本 7）
customBytes[6] = (customBytes[6] & 0x0f) | 0x70;
// 第 9 字节的高 2 位设为 10（RFC 4122 变体）
customBytes[8] = (customBytes[8] & 0x3f) | 0x80;
const handMade = stringify(customBytes);
console.log('');
console.log(`  用 node:crypto 手写一个 v7 -> ${handMade}`);
console.log(`  version() 验证：${version(handMade)}（确实是版本 7）`);
console.log('  这说明 uuid 包并不神秘：它就是"随机字节 + 按规范摆放版本位与变体位"。');
console.log('');

console.log('--- 7. 真实项目场景：三种典型用法 ---');

// 场景一：数据库主键（推荐 v7）
console.log('  场景一：数据库主键');
const dbRecords = [
  { id: uuidv7(), name: '订单 A' },
  { id: uuidv7(), name: '订单 B' },
  { id: uuidv7(), name: '订单 C' },
];
for (const r of dbRecords) console.log(`    INSERT ${r.name} id=${r.id}`);
console.log('    用 v7 做主键：客户端可生成、不依赖数据库、且写入有序。');

// 场景二：幂等键（推荐 v4，客户端生成后随请求发送）
console.log('');
console.log('  场景二：接口幂等键');
/**
 * 生成幂等键。同一个业务操作重试时应当复用同一个 key，
 * 服务端用它去重，避免重复下单。
 * @param {string} bizType 业务类型
 */
function makeIdempotencyKey(bizType) {
  // 前缀便于排查日志时一眼看出业务来源；随机部分保证唯一
  return `${bizType}:${uuidv4()}`;
}
console.log(`    下单请求头：Idempotency-Key = ${makeIdempotencyKey('order')}`);
console.log(`    支付请求头：Idempotency-Key = ${makeIdempotencyKey('payment')}`);

// 场景三：对象存储文件名（推荐 v4 + 保留原扩展名）
console.log('');
console.log('  场景三：上传文件命名');
/**
 * 生成安全的存储文件名：UUID + 原扩展名。
 * 不要用用户上传的原始文件名直接当 key（可能含路径穿越字符、中文、超长等）。
 * @param {string} originalName 用户上传的原始文件名
 */
function makeStorageKey(originalName) {
  // 只保留扩展名，并且限制长度与字符集
  const ext = originalName.includes('.') ? originalName.split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const safeExt = ext && ext.length <= 8 ? `.${ext}` : '';
  return `uploads/${uuidv4()}${safeExt}`;
}
for (const original of ['我的照片.JPG', 'report.pdf', '../../etc/passwd', 'noextension']) {
  console.log(`    "${original}" -> ${makeStorageKey(original)}`);
}
console.log('    注意 "noextension" 与 "../../etc/passwd" 都被安全处理了 —— ');
console.log('    最后一个的扩展名含 "/" 会被过滤掉，避免路径穿越。');
console.log('');

console.log('--- 8. 选型速查 ---');
console.log('  v4          随机、无序         主键（数据量小）、幂等键、文件名、追踪 ID');
console.log('  v7          时间有序 + 随机     主键（推荐，尤其高写入量的表）');
console.log('  v5          确定性（SHA-1）     由业务键稳定推导 ID；不可用于安全场景');
console.log('  v1          时间 + MAC         遗留系统兼容；新项目不要用');
console.log('  crypto.randomUUID()  原生 v4    只需要 v4 时首选，零依赖、更快');
console.log('  NIL         全零               表示"空 UUID"的占位值');

// ---------------------------------------------------------------------------
// 自测断言
// ---------------------------------------------------------------------------
console.log('');
console.log('--- 9. 自测断言 ---');

// 格式与版本
assert.strictEqual(sample4.length, 36);
assert.deepStrictEqual(sample4.split('-').map((s) => s.length), [8, 4, 4, 4, 12]);
assert.strictEqual(version(sample4), 4);
assert.strictEqual(version(sample7), 7);
assert.strictEqual(version(sample1), 1);
assert.strictEqual(version(id1), 5);
assert.strictEqual(version(cryptoId), 4);

// 校验
assert.strictEqual(validate(sample4), true);
assert.strictEqual(validate(NIL), true);
assert.strictEqual(validate('not-a-uuid'), false);
assert.strictEqual(validate('550e8400e29b41d4a716446655440000'), false);

// 唯一性
assert.strictEqual(seen.size, SMALL_BATCH, '10 万个 v4 不应有重复');
assert.strictEqual(setB.size, N, '10 万个 randomUUID 不应有重复');
assert.strictEqual(setC.size, N, '10 万个 v7 不应有重复');

// v7 的时间有序性
assert.deepStrictEqual(sorted7, inOrder7, 'v7 按字典序排序应等于生成顺序');
assert.notDeepStrictEqual(sorted4, batch4, 'v4 排序后应完全乱序');
assert.ok(Math.abs(Date.now() - extractedMs) < 60_000, 'v7 前缀应能还原出接近当前的时间戳');

// v5 的确定性
assert.strictEqual(id1, id2, 'v5 对相同输入应产生相同结果');
assert.notStrictEqual(id1, id3, 'v5 对不同输入应产生不同结果');

// parse / stringify 往返
assert.strictEqual(bytes.length, 16);
assert.strictEqual(stringify(bytes), sample4, 'parse -> stringify 应当还原');
assert.strictEqual(version(handMade), 7, '手工构造的 v7 应被识别为版本 7');

// v4 的随机性：10 万个值的首字符分布应当比较均匀（不会都集中在某一段）
const firstCharCounts = new Map();
for (const id of setA) {
  const c = id[0];
  firstCharCounts.set(c, (firstCharCounts.get(c) ?? 0) + 1);
}
// 16 个可能的十六进制首字符，均匀分布时每个约 6.25%；
// 这里只做宽松检查：应当出现全部 16 种首字符，且没有哪一种占比超过 20%
assert.strictEqual(firstCharCounts.size, 16, 'v4 的首字符应覆盖全部 16 种十六进制字符');
const maxRatio = Math.max(...firstCharCounts.values()) / N;
assert.ok(maxRatio < 0.2, `首字符分布应大致均匀，实际最大占比 ${(maxRatio * 100).toFixed(1)}%`);
console.log(`  随机性检查：v4 首字符共出现 ${firstCharCounts.size} 种，最大占比 ${(maxRatio * 100).toFixed(2)}%（理论值 6.25%）`);
console.log('  全部断言通过。');
console.log('');
console.log('演示结束。');
