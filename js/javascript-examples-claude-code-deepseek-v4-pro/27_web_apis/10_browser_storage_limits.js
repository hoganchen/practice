/**
 * ============================================================================
 * 知识点：浏览器存储的容量限制（Node 端实测体积 + 模拟配额与 LRU 淘汰）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】高级
 * 【前置知识】27_web_apis/05_web_storage.js、21_json（JSON 序列化）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    浏览器给你存数据的空间不是无限的。每种存储的容量、计量方式、
 *    超限时的行为都不一样：
 *      - Cookie        ：单条约 4KB，每域名约 50 条，会随每个 HTTP 请求发送。
 *      - localStorage  ：约 5MB（按 UTF-16 计，即 250 万字符左右），同步 API。
 *      - sessionStorage：约 5MB，但只在当前标签页生命周期内有效。
 *      - IndexedDB     ：按磁盘剩余空间的百分比分配（常见是 60%），可达数百 MB
 *                        甚至 GB 级，异步 API，能存二进制。
 *      - Cache Storage ：Service Worker 用来缓存请求/响应，容量同样很大。
 *
 * 2. 为什么需要
 *    "存不进去"是线上常见故障：localStorage 写满了会抛 QuotaExceededError，
 *    而 Safari 的隐私模式下配额甚至可能是 0。提前知道容量边界、
 *    知道怎么做容量估算和淘汰策略，才能写出不崩的代码。
 *
 * 3. 核心语法要点
 *    - 容量估算：navigator.storage.estimate() 返回 { usage, quota }（Promise）。
 *      这是唯一官方的"我还有多少空间"接口，但它算的是整个源（包含 IndexedDB、
 *      Cache 等），不含 localStorage 的精确明细。
 *    - 持久化申请：navigator.storage.persist() 请求"持久存储"，
 *      避免浏览器在磁盘紧张时自动清掉你的数据。
 *    - 超限处理：setItem 会抛 DOMException，name 为 'QuotaExceededError'，code 22。
 *    - 计量单位：localStorage 按 UTF-16 计，一个字符 2 字节。
 *      所以 5MB ≈ 2.5M 个字符；中文和 emoji 也按字符数算（代理对算 2 个字符）。
 *    - Best Effort 与 Persistent：现代浏览器采用"尽力而为"策略，
 *      磁盘紧张时可能整源清除数据；persist() 成功后才有保障。
 *
 * 4. 常见陷阱
 *    - 用 JSON 直接存大数组，几万条就爆了；应该改用 IndexedDB。
 *    - 用 localStorage.length 判断大小是错的：它返回键的数量，不是字节数。
 *    - 超限抛错会让后续逻辑全部中断，必须 try/catch 并给出降级方案。
 *    - 把 key 名写得很长也会占用空间（key 也要算进配额）。
 *    - 隐私模式/无痕窗口下配额可能是 0，任何写入都会失败。
 *    - 同一个源下所有页面共享同一份 localStorage，别的页面可能已经占了空间。
 *    - IndexedDB 的配额虽然大，但也要处理 QuotaExceededError 和事务失败。
 *
 * 【本文件在 Node 中如何演示】
 *    Node 里没有 navigator.storage，也没有 localStorage 的配额。
 *    本文件做三件在 Node 里真正可测的事：
 *      1) 用 Buffer.byteLength 实测各种数据的体积，推导出"5MB 到底能存多少条"；
 *      2) 用 node:zlib 实测 gzip 压缩率，说明"先压缩再存"能把有效容量放大多少倍；
 *      3) 实现一个带配额上限和 LRU（最近最少使用）淘汰策略的 QuotaStorage，
 *         演示"写满之后怎么办"——这正是前端遇到 QuotaExceededError 时该做的事。
 *    另外用 fs.statfs 尝试读取磁盘剩余空间，对应浏览器里的 quota 概念。
 *
 * 【运行方法】
 *   node 27_web_apis/10_browser_storage_limits.js
 *
 * 【预期输出】
 *   打印各存储的容量对比、实测数据体积、5MB 能存多少条、gzip 压缩率、
 *   以及 LRU 淘汰过程与磁盘容量信息。
 * ============================================================================
 */

import { gzipSync, gunzipSync } from 'node:zlib';
import { statfs } from 'node:fs';
import { promisify } from 'node:util';

console.log('--- 1. 各存储的容量对比 ---');

/** 各存储类型的容量与特点（数值取自浏览器厂商文档的常见值） */
const storages = [
  { name: 'Cookie', size: '约 4KB / 条', count: '每域名约 50 条', sync: '同步', sendToServer: '是（每个请求都带）', type: '字符串' },
  { name: 'sessionStorage', size: '约 5MB', count: '同 localStorage', sync: '同步', sendToServer: '否', type: '字符串' },
  { name: 'localStorage', size: '约 5MB', count: '同 sessionStorage', sync: '同步', sendToServer: '否', type: '字符串' },
  { name: 'IndexedDB', size: '磁盘的 10%~60%', count: '可达 GB 级', sync: '异步', sendToServer: '否', type: '结构化 + 二进制' },
  { name: 'Cache Storage', size: '同 IndexedDB 配额池', count: '可达 GB 级', sync: '异步', sendToServer: '否', type: 'Request/Response' },
];

for (const s of storages) {
  console.log(`  ${s.name.padEnd(15)} 容量 ${s.size.padEnd(16)} ${s.sync.padEnd(4)} 数据类型：${s.type}`);
  console.log(`  ${''.padEnd(15)} 是否随请求发给服务器：${s.sendToServer}`);
}
console.log('');
console.log('  注意：localStorage 与 sessionStorage 常常共享同一个 5MB 左右的"源配额池"，');
console.log('        而 IndexedDB / Cache Storage 走的是另一套更大的配额池。');
console.log('');

// ===========================================================================
// 第 2 部分：实测数据体积
// ===========================================================================

console.log('--- 2. 实测：一条记录到底占多少字节 ---');

/**
 * 计算字符串在浏览器 localStorage 里的实际占用。
 * 浏览器的 Storage 按 UTF-16 编码计量，每个码元 2 字节，
 * 所以直接取字符串长度（JS 的 length 就是 UTF-16 码元个数）乘以 2。
 */
function storageBytes(str) {
  return str.length * 2;
}

/** 按 UTF-8 计算字节数（用于网络传输和磁盘存储的估算） */
const utf8Bytes = (str) => Buffer.byteLength(str, 'utf8');

const sampleRecord = {
  id: 10086,
  name: '张三',
  email: 'zhangsan@example.com',
  createdAt: '2024-01-01T00:00:00.000Z',
  tags: ['vip', 'active', 'beta'],
  profile: { age: 28, city: '北京', score: 92.5 },
};

const recordJson = JSON.stringify(sampleRecord);
console.log('  一条典型的用户记录（JSON）：');
console.log('    ' + recordJson);
console.log('    字符数           =', recordJson.length);
console.log('    localStorage 占用 =', storageBytes(recordJson), '字节（UTF-16，每字符 2 字节）');
console.log('    UTF-8 字节数      =', utf8Bytes(recordJson), '字节（网络传输用这个口径）');
console.log('');

// 注意：中文字符在 UTF-8 里是 3 字节，但在 UTF-16 里只算 1 个字符（2 字节）
const chineseOnly = '中文中文中文中文中文';
console.log('  编码口径的坑（以 "' + chineseOnly + '" 为例）：');
console.log('    字符数（UTF-16 码元） =', chineseOnly.length, '→ localStorage 按', storageBytes(chineseOnly), '字节计算');
console.log('    UTF-8 字节数          =', utf8Bytes(chineseOnly), '字节');
console.log('    结论：浏览器配额按 UTF-16 算，服务器和磁盘按 UTF-8 算，两者要分开估算。', 'dim');
console.log('');

// ===========================================================================
// 第 3 部分：5MB 到底能存多少条
// ===========================================================================

console.log('--- 3. 5MB 的 localStorage 能存多少条记录 ---');

const QUOTA_BYTES = 5 * 1024 * 1024; // 5MB
const perRecord = storageBytes(recordJson) + storageBytes('user:10086'); // 值 + 键名都要算

console.log('  单条记录的键 + 值占用 =', perRecord, '字节');
console.log('  理论最多条数 = ' + QUOTA_BYTES + ' / ' + perRecord + ' ≈ ' + Math.floor(QUOTA_BYTES / perRecord).toLocaleString() + ' 条');
console.log('');

// 但真实数据往往更大，而且 JSON 有冗余（重复的键名）
// 对比三种常见的存法：数组套对象 / 只存必要字段 / 压缩后存
const M = 1000; // 生成 1000 条记录来实测

/** 造 M 条记录 */
function makeRecords(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: '用户' + i,
    email: 'user' + i + '@example.com',
    createdAt: new Date(1700000000000 + i * 1000).toISOString(),
    tags: ['vip'],
    profile: { age: 20 + (i % 30), city: '北京', score: 60 + (i % 40) },
  }));
}

const records = makeRecords(M);

// 存法一：原样 JSON.stringify
const plainJson = JSON.stringify(records);
console.log(`  存 ${M} 条记录的三种方式对比：`);
console.log('    方式一（原样 stringify）：');
console.log('      字符数 =', plainJson.length.toLocaleString(), '，localStorage 占用 =', (storageBytes(plainJson) / 1024).toFixed(1), 'KB');

// 存法二：缩短键名（减少重复的键名开销）
const compactJson = JSON.stringify(
  records.map((r) => [r.id, r.name, r.email, r.createdAt, r.profile.age, r.profile.city, r.profile.score]),
);
console.log('    方式二（去掉重复的键名，改成数组）：');
console.log('      字符数 =', compactJson.length.toLocaleString(), '，localStorage 占用 =', (storageBytes(compactJson) / 1024).toFixed(1), 'KB');
console.log('      比方式一省了 ' + (((plainJson.length - compactJson.length) / plainJson.length) * 100).toFixed(1) + '%，代价是要自己维护字段顺序。');

// 存法三：gzip 压缩后存成 Base64（或直接存二进制字符串）
const gzipped = gzipSync(Buffer.from(plainJson, 'utf8'));
// 压缩结果是二进制，存进 localStorage 需要转成字符串：
// 常见做法是 Base64，但 Base64 会让体积膨胀 33%，所以这里两种都算一下。
const base64 = gzipped.toString('base64');
console.log('    方式三（gzip 压缩后再存）：');
console.log('      gzip 后字节数 =', gzipped.length.toLocaleString(), '（原始 UTF-8 是 ' + utf8Bytes(plainJson).toLocaleString() + '）');
console.log('      压缩率 = ' + ((1 - gzipped.length / utf8Bytes(plainJson)) * 100).toFixed(1) + '%');
console.log('      转成 Base64 字符串后字符数 =', base64.length.toLocaleString(), '，localStorage 占用 =', (storageBytes(base64) / 1024).toFixed(1), 'KB');
console.log('      → 即便算上 Base64 的 33% 膨胀，仍然远小于原样存储。');

// 验证解压能还原
const restored = JSON.parse(gunzipSync(Buffer.from(base64, 'base64')).toString('utf8'));
console.log('      解压还原校验：记录条数 =', restored.length, '，第一条的 name =', restored[0].name, '✓ 数据无损');
console.log('');
console.log('  小结：把 1000 条记录原样塞进 localStorage 大约要',
  (storageBytes(plainJson) / 1024 / 1024).toFixed(2), 'MB，');
console.log('        压缩后只要', (storageBytes(base64) / 1024).toFixed(1), 'KB —— 相差 ',
  (storageBytes(plainJson) / storageBytes(base64)).toFixed(1), '倍。');
console.log('        这就是"有效容量"的概念：同样的 5MB 配额，换个存法能多存很多。');
console.log('');

// ===========================================================================
// 第 4 部分：模拟带配额和 LRU 淘汰的存储
// ===========================================================================

console.log('--- 4. 配额满了怎么办：实现带 LRU 淘汰的 QuotaStorage ---');

/**
 * 一个带容量上限的存储。写满时不是直接抛错，而是先淘汰"最久没被访问"的键
 * （LRU: Least Recently Used），腾出空间再写。
 *
 * 这是前端处理 QuotaExceededError 的常见兜底策略：
 * 缓存类数据可以淘汰，用户数据则应提示用户清理。
 */
class QuotaStorage {
  /**
   * @param {number} limitBytes 容量上限（按 UTF-16 计算，与浏览器口径一致）
   * @param {string} name 名字，便于日志
   */
  constructor(limitBytes, name = 'QuotaStorage') {
    this.limitBytes = limitBytes;
    this.name = name;
    this.map = new Map(); // Map 天然保持插入顺序，可以用来实现 LRU 的顺序维护
    this.evicted = 0; // 被淘汰的键数量
    this.usedBytes = 0; // 当前占用
  }

  /** 单个键值对占用的字节数（键名也算！） */
  static sizeOf(key, value) {
    return (String(key).length + String(value).length) * 2;
  }

  /**
   * 读取（同时把这个键标记为"最近使用"）。
   * 标准 Storage 接口没有这个语义，但 LRU 需要它。
   */
  getItem(key) {
    const k = String(key);
    if (!this.map.has(k)) return null;
    const value = this.map.get(k);
    // 重新插入 = 移到 Map 末尾 = 变成"最近使用"
    this.map.delete(k);
    this.map.set(k, value);
    return value;
  }

  setItem(key, value) {
    const k = String(key);
    const v = String(value);
    const need = QuotaStorage.sizeOf(k, v);

    if (need > this.limitBytes) {
      // 单条就超过了整个配额，淘汰谁都没用，只能报错
      const err = new Error(`单条数据 ${need} 字节，超过总配额 ${this.limitBytes} 字节`);
      err.name = 'QuotaExceededError';
      throw err;
    }

    // 如果这个键已存在，先扣掉它原来的占用
    if (this.map.has(k)) {
      this.usedBytes -= QuotaStorage.sizeOf(k, this.map.get(k));
      this.map.delete(k);
    }

    // 空间不够就不断淘汰最久没用的键（Map 的第一个键就是最久没用的）
    while (this.usedBytes + need > this.limitBytes && this.map.size > 0) {
      const oldestKey = this.map.keys().next().value; // 取第一个键
      this.usedBytes -= QuotaStorage.sizeOf(oldestKey, this.map.get(oldestKey));
      this.map.delete(oldestKey);
      this.evicted += 1;
      console.log('    ⚠ 空间不足，淘汰最久未使用的键：' + oldestKey);
    }

    this.map.set(k, v);
    this.usedBytes += need;
  }

  removeItem(key) {
    const k = String(key);
    if (this.map.has(k)) {
      this.usedBytes -= QuotaStorage.sizeOf(k, this.map.get(k));
      this.map.delete(k);
    }
  }

  get length() {
    return this.map.size;
  }

  /** 剩余可用字节 */
  get freeBytes() {
    return this.limitBytes - this.usedBytes;
  }

  keys() {
    return [...this.map.keys()];
  }
}

// 造一个只有 250 字节的小仓库，方便快速触发淘汰
// （每次写入 98 字节：键 2 字符 + 值 47 字符，共 49 个字符 × 2 字节）
const tiny = new QuotaStorage(250, 'tiny');
console.log('  创建了一个容量 250 字节的 QuotaStorage。');

// 每次写入约 100 字节（键 4 字符 + 值 46 字符）× 2
const makeValue = (n) => 'x'.repeat(46) + n;

tiny.setItem('k1', makeValue(1));
console.log('  写入 k1：已用 ' + tiny.usedBytes + ' 字节，剩余 ' + tiny.freeBytes + ' 字节');
tiny.setItem('k2', makeValue(2));
console.log('  写入 k2：已用 ' + tiny.usedBytes + ' 字节，剩余 ' + tiny.freeBytes + ' 字节');

// 读一下 k1，让它变成"最近使用"
tiny.getItem('k1');
console.log("  读取了 k1（k1 变成最近使用，k2 变成最久未使用）");

tiny.setItem('k3', makeValue(3));
console.log('  写入 k3：已用 ' + tiny.usedBytes + ' 字节，当前键 = ' + JSON.stringify(tiny.keys()));
console.log('    k2 被淘汰、k1 保留，这就是 LRU 的效果（不是因为 k1 更重要，而是因为它最近被用过）。');
console.log('    累计淘汰 ' + tiny.evicted + ' 个键。');
console.log('');

console.log('  超限时两种策略的取舍：');
console.log('    - 缓存类数据（接口结果、图片元信息）：用 LRU 淘汰，用户无感；');
console.log('    - 用户数据（草稿、设置）：绝不能悄悄淘汰，应该抛错并提示用户清理。');
console.log('    - 重要数据：改用 IndexedDB（配额大得多），并申请 navigator.storage.persist()。');
console.log('');

// ===========================================================================
// 第 5 部分：浏览器里的容量查询 API
// ===========================================================================

console.log('--- 5. 浏览器里怎么问"我还有多少空间" ---');
console.log('  // 这是浏览器中的写法（Node 里没有 navigator.storage）：');
console.log('  const estimate = await navigator.storage.estimate();');
console.log('  console.log(estimate.quota);  // 本源的配额上限（字节）');
console.log('  console.log(estimate.usage);  // 已使用量（字节）');
console.log('  console.log(estimate.usageDetails); // 明细（Chrome 支持 indexedDB / caches 等）');
console.log('');
console.log('  // 申请"持久存储"，避免浏览器在磁盘紧张时静默清掉你的数据：');
console.log('  const granted = await navigator.storage.persist();');
console.log('  const isPersisted = await navigator.storage.persisted();');
console.log('');
console.log('  两个注意点：');
console.log('    1) estimate() 统计的是整个源（含 IndexedDB、Cache），');
console.log('       不包含 localStorage 的精确明细，所以别指望它告诉你 localStorage 还剩多少。');
console.log('    2) 在无痕模式下配额可能极小（Safari 甚至为 0），');
console.log('       任何写入都可能抛 QuotaExceededError，代码必须有 try/catch 兜底。');
console.log('');

// ===========================================================================
// 第 6 部分：Node 里对应的是什么
// ===========================================================================

console.log('--- 6. Node 里的对应物：磁盘容量与进程内存 ---');

const statfsAsync = promisify(statfs);
try {
  // fs.statfs 能读到文件系统的块数和块大小（Node 18.15+ 提供）
  const info = await statfsAsync(process.cwd());
  const totalBytes = info.blocks * info.bsize;
  const freeBytes = info.bavail * info.bsize;
  const gb = (n) => (n / 1024 / 1024 / 1024).toFixed(1) + ' GB';
  console.log('  fs.statfs() 读到的磁盘信息（对应浏览器里的 quota / usage）：');
  console.log('    总容量 =', gb(totalBytes));
  console.log('    可用   =', gb(freeBytes));
  console.log('    已用比例 =', ((1 - freeBytes / totalBytes) * 100).toFixed(1) + '%');
} catch (err) {
  // 某些平台/文件系统不支持 statfs，兜底不影响程序运行
  console.log('  当前平台不支持 fs.statfs：' + err.message);
}

const mem = process.memoryUsage();
const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
console.log('');
console.log('  process.memoryUsage() 读到的进程内存（Node 特有的"容量视角"）：');
console.log('    heapTotal（堆总量）=', mb(mem.heapTotal));
console.log('    heapUsed （堆已用）=', mb(mem.heapUsed));
console.log('    rss      （常驻集）=', mb(mem.rss));
console.log('  浏览器里没有这个 API（出于安全考虑不暴露），只有 performance.memory 的部分信息。');
console.log('');

console.log('--- 7. 实用清单 ---');
console.log('  1) 小数据（设置、令牌、少量缓存）用 localStorage，注意 try/catch。');
console.log('  2) 大数据（列表、图片、离线数据）用 IndexedDB，别硬塞 localStorage。');
console.log('  3) 写之前先估算体积：JSON.stringify(x).length * 2 字节。');
console.log('  4) 加压缩（gzip/LZ 系）能把有效容量放大几倍到十几倍。');
console.log('  5) 缓存类数据要设计淘汰策略（LRU / TTL），不能只写不删。');
console.log('  6) 捕获 QuotaExceededError，并准备降级方案（内存缓存 / 提示用户清理）。');
console.log('  7) 关键数据申请 persist()，并始终把服务器当作数据的最终归属。');
console.log('');

console.log('程序结束。');
