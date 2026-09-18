/**
 * ============================================================================
 * 知识点：本地存储（Node 端用 Map 实现同接口的 Storage）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】入门
 * 【前置知识】27_web_apis/04_fetch_api.js、21_json（JSON 序列化）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    浏览器提供了几种把数据存在用户本机的方式：
 *      - localStorage   ：永久保存（除非用户清理），同源的所有标签页共享。
 *      - sessionStorage ：只在当前标签页有效，关掉标签页就没了。
 *      - Cookie         ：随每个 HTTP 请求自动发给服务器，容量很小（约 4KB）。
 *      - IndexedDB      ：异步的、可存大量结构化数据的数据库（本目录 15_indexeddb.js 讲）。
 *    前两者都实现了同一个 Storage 接口，用法完全一样，只有生命周期不同。
 *
 * 2. 为什么需要
 *    刷新页面后 JS 里的变量全部清零。想"记住"用户的选择（主题、语言、
 *    登录状态、草稿内容、购物车），就必须把它写到浏览器提供的持久化存储里。
 *    localStorage 是最简单的一种：同步、字符串键值对、5MB 左右容量。
 *
 * 3. 核心语法要点
 *    Storage 接口只有 5 个方法 + 1 个属性：
 *      storage.setItem(key, value)  写入（value 会被强制转成字符串）
 *      storage.getItem(key)         读取，键不存在时返回 null（不是 undefined）
 *      storage.removeItem(key)      删除单个键
 *      storage.clear()              清空全部（只清当前源的）
 *      storage.key(index)           按序号取键名（顺序 = 插入顺序，不稳定）
 *      storage.length               键的数量
 *    另外还有 storage 事件：当**其它**标签页修改了 localStorage 时，
 *    当前页会收到 'storage' 事件，这是最简单的跨标签页通信手段。
 *
 * 4. 常见陷阱
 *    - 存的全是字符串！store.setItem('n', 1) 存的是 '1'，取出来再 +1 会变成 '11'。
 *      存对象必须 JSON.stringify，取出来 JSON.parse（并做好解析失败的兜底）。
 *    - 读取不存在的键返回 null，而 null 也是"合法值"，所以别用 getItem() == null
 *      判断"有没有"，用 hasOwnProperty 式的思路会更好（或者干脆约定不用 null）。
 *    - localStorage 是同步 API：存大字符串会阻塞主线程，别放几十 MB 的数据。
 *    - 容量超限会抛 QuotaExceededError；Safari 无痕模式下甚至可能是 0 容量。
 *    - Cookie 在 file:// 协议下通常不可用，而且会被浏览器隐私策略限制。
 *    - localStorage 不加密，绝不要存 token、密码等敏感信息。
 *    - 同源策略：不同域名/端口的 localStorage 互相隔离，但同一域名下所有页面共享。
 *
 * 【本文件在 Node 中如何演示】
 *    Node.js 里没有 window、没有 localStorage，也没有 Cookie 的自动收发。
 *    所以本文件：
 *      1) 用 Map 手写一个完全符合 Storage 接口的 MemoryStorage 类（含容量限制），
 *         在浏览器里只要把 `new MemoryStorage()` 换成 `localStorage` 就是同一段代码；
 *      2) 用 Node 的 EventEmitter 模拟 'storage' 事件；
 *      3) 手写 Cookie 的序列化/反序列化（对应浏览器里 document.cookie 的字符串语义，
 *         也对应 Node 服务端处理 Cookie 请求头的真实需求）。
 *
 * 【运行方法】
 *   node 27_web_apis/05_web_storage.js
 *
 * 【预期输出】
 *   打印 localStorage/sessionStorage 的读写删清、对象的 JSON 存取、
 *   容量超限报错、跨标签页 storage 事件、以及 Cookie 字符串的序列化与解析过程。
 * ============================================================================
 */

import { EventEmitter } from 'node:events';

// ===========================================================================
// 第 1 部分：用 Map 实现符合 Storage 接口的存储
// ===========================================================================

console.log('--- 1. 手写一个符合 Storage 接口的 MemoryStorage ---');

/**
 * 内存版 Storage：接口与浏览器的 localStorage 完全一致。
 * 浏览器里真正的 localStorage 是 C++ 实现的，但对 JS 暴露的接口就是这 6 个成员。
 */
class MemoryStorage {
  /**
   * @param {string} name 名字，仅用于日志区分
   * @param {number} [limitBytes] 容量上限（字节），模拟浏览器的 5MB 配额
   */
  constructor(name, limitBytes = 5 * 1024 * 1024) {
    this.name = name;
    this._map = new Map(); // 真正存数据的地方
    this.limitBytes = limitBytes;
  }

  /** 当前已占用的字节数（localStorage 按 UTF-16 计，每个字符 2 字节） */
  get usedBytes() {
    let total = 0;
    for (const [k, v] of this._map) total += (k.length + v.length) * 2;
    return total;
  }

  /**
   * 写入。返回值是 undefined（Storage 接口就是这么定义的）。
   * 关键语义：键和值都会被强制转换成字符串。
   */
  setItem(key, value) {
    const k = String(key);
    const v = String(value); // 浏览器里存数字 1 再读出来是字符串 '1'
    const delta = (k.length + v.length) * 2;
    const old = this._map.get(k);
    const oldSize = old === undefined ? 0 : (k.length + old.length) * 2;

    if (this.usedBytes - oldSize + delta > this.limitBytes) {
      // 浏览器抛的是 DOMException，名字叫 QuotaExceededError，错误码 22
      const err = new Error('Failed to execute \'setItem\' on \'Storage\': 超出存储配额');
      err.name = 'QuotaExceededError';
      err.code = 22;
      throw err;
    }
    this._map.set(k, v);
    return undefined;
  }

  /** 读取。键不存在返回 null（注意：不是 undefined） */
  getItem(key) {
    const k = String(key);
    return this._map.has(k) ? this._map.get(k) : null;
  }

  /** 删除单个键（键不存在也不报错，静默成功） */
  removeItem(key) {
    this._map.delete(String(key));
    return undefined;
  }

  /** 清空全部（只影响自己的数据，浏览器里也只清当前源的数据） */
  clear() {
    this._map.clear();
    return undefined;
  }

  /** 按序号取键名。注意 Storage 规范没有规定顺序，别依赖它 */
  key(index) {
    const keys = [...this._map.keys()];
    return index >= 0 && index < keys.length ? keys[index] : null;
  }

  /** 键的数量 */
  get length() {
    return this._map.size;
  }

  /** 便于调试：等价于 Object.keys(localStorage) 之类的枚举 */
  keys() {
    return [...this._map.keys()];
  }
}

// 浏览器里这两行就是：const localStore = localStorage; const sessionStore = sessionStorage;
const localStore = new MemoryStorage('localStorage', 5 * 1024 * 1024);
const sessionStore = new MemoryStorage('sessionStorage', 5 * 1024 * 1024);

console.log('已创建两个 Storage 实例，接口与 localStorage / sessionStorage 完全一致。');
console.log('');

// ===========================================================================
// 第 2 部分：基本读写
// ===========================================================================

console.log('--- 2. 基本读写：setItem / getItem / removeItem / clear ---');

localStore.setItem('theme', 'dark');
localStore.setItem('lang', 'zh-CN');
console.log("  setItem('theme', 'dark') 后：getItem('theme') =", JSON.stringify(localStore.getItem('theme')));
console.log("  getItem('not-exist') =", localStore.getItem('not-exist'), '← 键不存在返回 null，不是 undefined');
console.log('  length =', localStore.length, '，键名列表 =', localStore.keys());
console.log("  key(0) =", JSON.stringify(localStore.key(0)), '，key(99) =', JSON.stringify(localStore.key(99)));

localStore.removeItem('lang');
console.log("  removeItem('lang') 后：length =", localStore.length, '，键名列表 =', localStore.keys());
console.log('  removeItem 一个不存在的键不会报错：', localStore.removeItem('never-existed') === undefined);
console.log('');

// ===========================================================================
// 第 3 部分：所有值都是字符串
// ===========================================================================

console.log('--- 3. 陷阱：存进去的一切都会变成字符串 ---');

localStore.setItem('count', 42); // 存的是数字 42
const raw = localStore.getItem('count');
console.log("  setItem('count', 42) 之后 getItem('count') =", JSON.stringify(raw), '，typeof =', typeof raw);
console.log('  raw + 1 =', JSON.stringify(raw + 1), '← 字符串拼接，得到 "421" 而不是 43！');
console.log('  正确做法：Number(localStore.getItem(\'count\')) + 1 =', Number(raw) + 1);
console.log('');

localStore.setItem('user', { name: '小明', age: 18 }); // 忘记 JSON.stringify
console.log("  忘记 JSON.stringify 存对象：getItem('user') =", JSON.stringify(localStore.getItem('user')), '← 变成了 "[object Object]"');
console.log('');

// 正确做法：序列化与反序列化
console.log('  正确做法（存对象）：');
const user = { name: '小明', age: 18, tags: ['vip', 'new'] };
localStore.setItem('user', JSON.stringify(user)); // 存
const restored = JSON.parse(localStore.getItem('user')); // 取
console.log('    JSON.stringify 后存入，JSON.parse 后取出 =', restored);
console.log('    取出来的 tags 是真数组：', Array.isArray(restored.tags), restored.tags);
console.log('');

/** 安全的读取工具：解析失败时不崩溃，返回默认值 */
function readJson(storage, key, fallback = null) {
  const raw = storage.getItem(key);
  if (raw === null) return fallback; // 键不存在
  try {
    return JSON.parse(raw);
  } catch {
    // 存进去的可能不是 JSON（比如别的代码写了个普通字符串）
    return fallback;
  }
}

localStore.setItem('broken', '{不是合法 JSON');
console.log("  readJson(localStore, 'broken', '默认值') =", JSON.stringify(readJson(localStore, 'broken', '默认值')), '← 解析失败时安全兜底');
console.log("  readJson(localStore, 'user') =", JSON.stringify(readJson(localStore, 'user')));
console.log('');

// ===========================================================================
// 第 4 部分：localStorage 与 sessionStorage 的生命周期差异
// ===========================================================================

console.log('--- 4. localStorage vs sessionStorage：接口一样，生命周期不同 ---');

// 模拟一次页面会话：往两个存储里各写一份数据
function simulatePageSession(label) {
  // 每个新页面都会给 sessionStorage 一块新的区域（所以这里新建一个）
  const tabSession = new MemoryStorage('sessionStorage(标签页)', 5 * 1024 * 1024);
  tabSession.setItem('formDraft', '用户正在填的表单草稿');
  console.log(`  [${label}] sessionStorage 内容 =`, tabSession.keys(), '（只属于这一个标签页）');
  console.log(`  [${label}] localStorage 内容 =`, localStore.keys(), '（是共享的，包含之前写入的）');
}

simulatePageSession('标签页 A 打开');
simulatePageSession('标签页 B 打开');
console.log('  结论：localStorage 在同一个源的所有标签页之间共享且长期存在；');
console.log('        sessionStorage 每个标签页一份，标签页一关就没了。');
console.log('');

// 浏览器里"关闭标签页"这件事在 Node 里无法真正发生，
// 所以这里用一个显式的 clear() 来示意它被销毁。
sessionStore.setItem('temp', '只在本次会话有效');
console.log("  往 sessionStorage 写 'temp'：", sessionStore.getItem('temp'));
sessionStore.clear(); // 等价于"关掉标签页"
console.log('  clear()（模拟关闭标签页）后：', sessionStore.getItem('temp'), '← 数据没了');
console.log('');

// ===========================================================================
// 第 5 部分：容量配额与 QuotaExceededError
// ===========================================================================

console.log('--- 5. 容量超限：会抛 QuotaExceededError ---');

// 造一个只有 200 字节的小仓库，方便快速触发超限
const tinyStore = new MemoryStorage('tiny(200字节)', 200);
try {
  // 每次写入 104 字节：键名 2 字符 + 值 50 字符，共 52 个字符 × 2 字节
  tinyStore.setItem('k1', 'x'.repeat(50));
  console.log('  第 1 次写入成功，已用', tinyStore.usedBytes, '字节');
  tinyStore.setItem('k2', 'x'.repeat(50)); // 104 + 104 = 208 > 200，这一行就会超限
  console.log('  不应该走到这里');
} catch (err) {
  console.log('  第 2 次写入失败：' + err.name + '（code=' + err.code + '）');
  console.log('    错误信息：' + err.message);
  console.log('    实际项目中要捕获它，提示用户"本地存储已满，请清理"或降级到内存变量。');
}
console.log('');

console.log('--- 6. 各浏览器的容量参考 ---');
console.log('  localStorage  ：各浏览器约 5MB（按 UTF-16 计，即约 250 万个字符）');
console.log('  sessionStorage：各浏览器约 5MB，但只在单个标签页内有效');
console.log('  Cookie        ：单个约 4KB，每个域名通常最多 50 个');
console.log('  IndexedDB     ：通常按磁盘剩余空间的百分比分配，可达数百 MB 以上');
console.log('');

// ===========================================================================
// 第 6 部分：storage 事件（跨标签页通信）
// ===========================================================================

console.log('--- 7. storage 事件：唯一能让同源标签页互相通知的浏览器机制 ---');

/**
 * 一个带 storage 事件通知的 Storage。
 * 浏览器里这个事件由浏览器自动派发，Node 里我们用 EventEmitter 手动模拟。
 */
class NotifyingStorage extends MemoryStorage {
  constructor(name, limitBytes) {
    super(name, limitBytes);
    this._emitter = new EventEmitter();
  }

  /** 对应 window.addEventListener('storage', handler) */
  addEventListener(type, handler) {
    this._emitter.on(type, handler);
  }

  setItem(key, value) {
    const oldValue = this.getItem(key); // 记录旧值，事件里会带上
    super.setItem(key, value);
    // 真实浏览器中，事件只发给"其它标签页"，本标签页不会收到
    this._emitter.emit('storage', { key: String(key), oldValue, newValue: String(value), storageArea: this.name });
  }

  removeItem(key) {
    const oldValue = this.getItem(key);
    super.removeItem(key);
    this._emitter.emit('storage', { key: String(key), oldValue, newValue: null, storageArea: this.name });
  }
}

const sharedStore = new NotifyingStorage('localStorage', 5 * 1024 * 1024);

// 相当于在"标签页 B"里注册了监听器
sharedStore.addEventListener('storage', (event) => {
  console.log(`  [标签页 B 收到 storage 事件] key=${event.key}，oldValue=${JSON.stringify(event.oldValue)} → newValue=${JSON.stringify(event.newValue)}`);
});

console.log("  在标签页 A 里执行 setItem('theme', 'dark')：");
sharedStore.setItem('theme', 'dark');
console.log("  在标签页 A 里执行 setItem('theme', 'light')（改值）：");
sharedStore.setItem('theme', 'light');
console.log("  在标签页 A 里执行 removeItem('theme')：");
sharedStore.removeItem('theme');
console.log('');
console.log('  注意三个细节：');
console.log('    1) 事件只在**其它**标签页触发，修改数据的那一页自己收不到；');
console.log('    2) 事件里带着 oldValue 和 newValue，可以据此做精细的同步；');
console.log('    3) clear() 触发的事件里 key 为 null。');
console.log('  用途：多标签页同时打开时同步登录状态、主题、购物车等。');
console.log('');

// ===========================================================================
// 第 7 部分：Cookie（另一种"本地存储"，但会随请求发给服务器）
// ===========================================================================

console.log('--- 8. Cookie：浏览器里是 document.cookie，Node 里是请求头字符串 ---');

/**
 * 把 cookie 对象序列化成 HTTP 头里的一行。
 * 这相当于浏览器里执行 document.cookie = '...' 时浏览器帮你做的事。
 */
function serializeCookie(name, value, options = {}) {
  let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (options.maxAge !== undefined) str += `; Max-Age=${options.maxAge}`; // 存活秒数
  if (options.expires) str += `; Expires=${options.expires.toUTCString()}`;
  if (options.path) str += `; Path=${options.path}`; // 生效路径
  if (options.domain) str += `; Domain=${options.domain}`;
  if (options.secure) str += '; Secure'; // 只走 HTTPS
  if (options.httpOnly) str += '; HttpOnly'; // JS 读不到，防 XSS 窃取
  if (options.sameSite) str += `; SameSite=${options.sameSite}`; // 防 CSRF
  return str;
}

/** 把 Cookie 请求头解析成对象（document.cookie 读到的就是这个格式） */
function parseCookie(cookieHeader) {
  const result = {};
  if (!cookieHeader) return result;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    result[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return result;
}

// 服务端通过 Set-Cookie 响应头下发
const setCookieHeader = serializeCookie('sessionId', 'abc123', {
  maxAge: 3600,
  path: '/',
  httpOnly: true, // 关键：HttpOnly 的 Cookie 在浏览器里 document.cookie 读不到
  sameSite: 'Lax',
});
console.log('  服务端返回的 Set-Cookie：');
console.log('    ' + setCookieHeader);
console.log('');

// 之后浏览器每次请求都会带上 Cookie 请求头
const cookieHeader = 'sessionId=abc123; theme=dark; lang=zh-CN';
console.log('  浏览器之后发请求时带上的 Cookie 请求头：');
console.log('    ' + cookieHeader);
console.log('  服务端解析结果 =', parseCookie(cookieHeader));
console.log('');

console.log('  document.cookie 的三个反直觉之处：');
console.log('    1) 它不是一个真正的字符串属性，读写都是"拼接/解析"的语法糖：');
console.log("       读：document.cookie → 'a=1; b=2'（全部 Cookie 拼成一行）");
console.log("       写：document.cookie = 'c=3' → 追加，而不是覆盖全部");
console.log('    2) 想删除某个 Cookie，只能把它设成过期：Expires=Thu, 01 Jan 1970 00:00:00 GMT');
console.log('    3) HttpOnly 的 Cookie 用 document.cookie 永远读不到（这是安全特性，不是 bug）');
console.log('');

console.log('程序结束。');
console.log('小结：浏览器里把 new MemoryStorage() 换成 localStorage，');
console.log('      本文所有读写/超限/事件的代码都可以原样运行。');
