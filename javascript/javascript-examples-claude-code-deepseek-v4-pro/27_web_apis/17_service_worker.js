/**
 * ============================================================================
 * 知识点：Service Worker 与离线能力（生命周期 / 缓存策略 / 后台缓存 / 版本管理）
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】高级
 * 【前置知识】27_web_apis/04_fetch_api.js（fetch / Request / Response）、
 *             27_web_apis/13_cross_context_messaging.js（跨上下文与 postMessage）、
 *             26_node_core/06_http_server.js（Node 的 HTTP 服务）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Service Worker（简称 SW）是一个**运行在浏览器后台、独立于页面**的脚本。
 *    它像一个"可编程的网络代理"：页面发出的每个请求都会先经过它，它可以
 *      · 直接返回缓存里的响应（离线可用）；
 *      · 放行到网络，或者"先给缓存、后台偷偷更新"；
 *      · 把响应存进 Cache Storage，供下次使用。
 *    它还能在页面全部关闭后继续运行（后台同步、推送通知），这是它和 Web Worker
 *    最大的区别：Web Worker 属于某个页面，页面关了它就没了。
 *
 * 2. 生命周期（必须记牢，90% 的坑都出在这里）
 *      注册 register()
 *        ↓
 *      install   —— 安装。通常在这里 cache.addAll() 预缓存静态资源
 *        ↓            （失败则整个 SW 安装失败，不会进入下一步）
 *      installed —— 已安装。如果还有旧版本的页面开着，就停在 waiting 状态
 *        ↓            skipWaiting() 可以跳过等待，立刻进入 activating
 *      activating—— 激活。通常在这里清理旧版本缓存（caches.keys 删掉不认识的）
 *        ↓            默认只控制"之后新打开的页面"，clients.claim() 可以接管已有页面
 *      activated —— 生效。开始接收 fetch / message / push 等事件
 *        ↓
 *      redundant —— 被新版本取代或被注销
 *
 * 3. 三个必须理解的概念
 *    （1）作用域（scope）：SW 只能拦截**自己作用域之内**的请求。
 *        /sw.js 默认作用域是 /（因为它在根目录），/js/sw.js 的作用域只能是 /js/，
 *        想在子目录里控制全站，需要服务端返回 Service-Worker-Allowed 响应头。
 *    （2）接管（control）：注册成功 ≠ 立即生效。首次注册的 SW 要等下一次导航
 *        才控制页面；已打开的页面也仍然由旧 SW 控制，除非调用 clients.claim()。
 *    （3）为什么"用户要刷新两次才能看到新版本"：
 *        v2 装好后停在 waiting，此时页面里已经加载过的 HTML/JS/CSS 都是 v1 的；
 *        即使 skipWaiting + claim 让它立刻激活，**当前这一次页面加载**用的还是旧文件，
 *        要等用户再刷新一次才会拿到新内容。要缓解就得让用户收到提示后主动刷新
 *        （监听 updatefound / statechange，弹一个"有新版本，点击刷新"的条）。
 *
 * 4. 三种最常用的缓存策略
 *    · cache-first（缓存优先）：先查缓存，命中就返回；没命中再走网络并写入缓存。
 *      适合：版本化的静态资源（app.3f2a1.js、logo.png）——永远不会变，快就是一切。
 *    · network-first（网络优先）：先走网络，成功就更新缓存并返回；失败则回退缓存。
 *      适合：HTML 文档、需要尽量新鲜的接口数据。
 *    · stale-while-revalidate（陈旧内容 + 后台更新）：立刻返回缓存（快），
 *      同时后台发一个请求更新缓存（下次就是新的）。
 *      适合：更新频率不高的内容（头像、列表页、博客正文）。
 *
 * 5. 硬性限制与常见陷阱
 *    · **只能在 HTTPS 或 localhost 下使用**。http:// 的普通站点注册直接抛错。
 *      原因：SW 能读取并改写页面收到的所有响应，权限太大。
 *    · **file:// 下完全不可用**：navigator.serviceWorker 直接不存在，
 *      连注册的机会都没有（本目录的 .html 示例因此必须做可用性检测与降级）。
 *    · 注册脚本必须**同源**，且返回的 Content-Type 必须是 JavaScript。
 *    · SW 里没有 DOM，不能访问 window / document；能用的是 self / caches / fetch。
 *    · 缓存要**及时清理**：只在 activate 里删一次旧缓存，否则用户的磁盘会被吃掉。
 *    · cache.add() / addAll() 只接受 2xx 响应，遇到 404 会抛错并让整批失败；
 *      需要容错就用 fetch + cache.put 自己控制。
 *    · 更新检查只在导航时发生，且浏览器对自己的 HTTP 缓存有 24 小时上限的"照顾"，
 *      真机调试时常需要 DevTools 的 "Update on reload"。
 *
 * 【本文件在 Node 中如何演示】
 *   Node 里没有 navigator.serviceWorker、没有 caches、也没有"页面"。
 *   本文件：
 *     1) 用 http.createServer + listen(0) 起一个**真实的本地服务器**（随机端口，
 *        不访问外网），提供 HTML / CSS / JS / API / 离线兜底页，还能模拟
 *        "在线（快/慢）、服务器 500、彻底断网"四种网络状况；
 *     2) 手写 Cache Storage：Cache / CacheStorage / Request / Response 全部基于
 *        Node 18+ 真实存在的 Web 标准对象（Response、Request 是 undici 提供的），
 *        所以缓存读写、response.clone() 这些细节是真的；
 *     3) 手写 SW 的生命周期状态机（install → waiting → activating → activated、
 *        skipWaiting / clients.claim / updatefound / controllerchange），
 *        把"刷新两次才生效"的成因按时间线打印出来；
 *     4) 手写一个"缓存策略决策器"：给定请求和网络状况，按三种策略分别决策，
 *        打印每一步的判断依据与最终结果来源。
 *
 * 【运行方法】
 *   node 27_web_apis/17_service_worker.js
 *
 * 【预期输出】
 *   八个部分：SW 是什么、生命周期状态机与"刷新两次"的完整时间线、
 *   Cache Storage 的增删查、三种缓存策略在四种网络状况下的决策对比、
 *   缓存版本管理与旧缓存清理、离线兜底页、真实注册代码与 HTTPS 限制、
 *   浏览器与 Node 的能力对照表。
 * ============================================================================
 */

import http from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

/** 分节标题 */
function section(title) {
  console.log('');
  console.log('='.repeat(74));
  console.log(title);
  console.log('='.repeat(74));
}

// ===========================================================================
// 第 1 部分：先起一个真实的本地 HTTP 服务器
// ===========================================================================

section('--- 1. 先起一个真实的本地服务器（随机端口，不联网） ---');

/** 可控的"网络状况"与"站点版本" */
const net = {
  mode: 'fast', // fast | slow | error | offline
  delay: 0,
  siteVersion: 1, // 站点资源版本，用来演示 SW 更新
  requestCount: 0, // 统计真实打到服务器的请求数
};

const ASSETS = {
  '/index.html': () =>
    `<!DOCTYPE html><html><body><h1>离线优先的示例站点 v${net.siteVersion}</h1>` +
    '<link rel="stylesheet" href="/style.css"><script src="/app.js"></script></body></html>',
  '/style.css': () => `/* v${net.siteVersion} */ body { font-family: system-ui; }`,
  '/app.js': () => `// v${net.siteVersion} console.log('app v${net.siteVersion}');`,
  '/offline.html': () => '<!DOCTYPE html><html><body><h1>你离线了</h1><p>这是离线兜底页。</p></body></html>',
  '/api/now': () => JSON.stringify({ version: net.siteVersion, at: '2026-01-01T00:00:00Z' }),
};

const server = http.createServer((req, res) => {
  net.requestCount += 1;
  const url = new URL(req.url, 'http://127.0.0.1');
  const respond = () => {
    if (net.mode === 'offline') {
      // 模拟"彻底断网"：直接掐断连接，fetch 会抛 TypeError: fetch failed
      req.socket.destroy();
      return;
    }
    if (net.mode === 'error') {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('服务器内部错误（这是故意的）');
      return;
    }
    const gen = ASSETS[url.pathname];
    if (!gen) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404');
      return;
    }
    res.writeHead(200, { 'Content-Type': url.pathname.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8' });
    res.end(gen());
  };
  // slow 模式：延迟 300ms 才响应，用来对比三种策略的响应速度
  if (net.mode === 'slow') setTimeout(respond, 300);
  else respond();
});

const PORT = await new Promise((resolve) => {
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const ORIGIN = `http://127.0.0.1:${PORT}`;
console.log('服务器已启动：', ORIGIN);
console.log('（端口写 0 表示由系统随机分配，脚本在任何机器上都能跑，也不会访问外网。）');
console.log('');

/** 模拟浏览器发出的网络请求（真实 fetch，打到上面这个服务器） */
async function networkFetch(path, init) {
  // 允许传相对路径（'/x'）或绝对地址（'http://.../x'）
  const url = /^https?:\/\//.test(path) ? path : ORIGIN + path;
  return fetch(url, init);
}

/** 模拟四种网络状况 */
async function setNet(mode) {
  net.mode = mode;
  net.delay = mode === 'slow' ? 300 : 0;
  console.log(`  ▶ 网络状况切换为：${mode}${mode === 'slow' ? '（每次都延迟 300ms）' : ''}`);
}

// ===========================================================================
// 第 2 部分：手写 Cache Storage
// ===========================================================================

section('--- 2. Cache Storage：SW 的"响应仓库" ---');

/** 把 request（字符串 / Request / URL）统一成用于比较的 key */
function cacheKey(request) {
  if (typeof request === 'string') return new URL(request, ORIGIN).href;
  if (request instanceof URL) return request.href;
  return request.url;
}

/** 一个 Cache：名字 + 一张 request → Response 的表（真实浏览器存在磁盘上） */
class MiniCache {
  constructor(name) {
    this.name = name;
    this._map = new Map();
  }

  /** 存一对请求/响应。响应会被 clone()，因为 body 只能读一次 */
  async put(request, response) {
    if (response.status === 206) throw new TypeError('put 不接受 206 Partial Content');
    this._map.set(cacheKey(request), response.clone());
  }

  /** 取一个响应（返回的是副本，所以能反复取） */
  async match(request, options = {}) {
    const key = cacheKey(request);
    if (this._map.has(key)) return this._map.get(key).clone();
    if (options.ignoreSearch) {
      const bare = key.split('?')[0];
      for (const [k, v] of this._map) if (k.split('?')[0] === bare) return v.clone();
    }
    return undefined;
  }

  async matchAll(request) {
    if (request === undefined) return [...this._map.values()].map((r) => r.clone());
    const hit = await this.match(request);
    return hit ? [hit] : [];
  }

  async add(request) {
    // 真实 API：add 内部就是 fetch + put，并且要求响应 ok（2xx）
    const res = await networkFetch(cacheKey(request));
    if (!res.ok) throw new TypeError(`add() 只接受 2xx 响应，${cacheKey(request)} 返回了 ${res.status}`);
    await this.put(request, res);
    return undefined;
  }

  /** 批量预缓存：任何一个失败，整批都失败（这也是 SW 安装失败的常见原因） */
  async addAll(requests) {
    for (const r of requests) await this.add(r);
    return undefined;
  }

  async delete(request) {
    return this._map.delete(cacheKey(request));
  }

  async keys() {
    return [...this._map.keys()].map((u) => new Request(u));
  }

  get size() {
    return this._map.size;
  }
}

/** CacheStorage：浏览器的 caches 全局对象 */
class MiniCacheStorage {
  constructor() {
    this._caches = new Map();
  }

  async open(name) {
    if (!this._caches.has(name)) this._caches.set(name, new MiniCache(name));
    return this._caches.get(name);
  }

  async has(name) {
    return this._caches.has(name);
  }

  async keys() {
    return [...this._caches.keys()];
  }

  async delete(name) {
    return this._caches.delete(name);
  }

  /** caches.match 会按顺序在所有缓存里找第一个命中 */
  async match(request) {
    for (const cache of this._caches.values()) {
      const hit = await cache.match(request);
      if (hit) return hit;
    }
    return undefined;
  }
}

const caches = new MiniCacheStorage();
console.log('已创建 caches（MiniCacheStorage），API 与浏览器的 caches 一致：');
console.log('  caches.open(name) / caches.keys() / caches.delete(name) / caches.match(req) / caches.has(name)');
console.log('  cache.put(req, res) / match / matchAll / add / addAll / delete / keys');
console.log('  注意：put 时浏览器会自动 clone 一份响应，所以之后能反复 match 出来。');
console.log('');

const staticCache = await caches.open('static-v1');
await staticCache.addAll(['/index.html', '/style.css', '/app.js']);
console.log('已预缓存 3 个资源到 static-v1：', (await staticCache.keys()).map((r) => new URL(r.url).pathname).join(', '));
{
  const hit = await staticCache.match('/style.css');
  console.log('match("/style.css") → ' + (hit ? `命中，${hit.status}，内容开头：${(await hit.text()).slice(0, 20)}` : '未命中'));
  const miss = await staticCache.match('/nope.txt');
  console.log('match("/nope.txt") → ' + (miss === undefined ? 'undefined（注意：不是 null，也不是抛错）' : '命中'));
  console.log('缓存里现有 ' + (await cacheKeysOf(staticCache)).length + ' 条记录');
}
async function cacheKeysOf(cache) {
  return (await cache.keys()).map((r) => new URL(r.url).pathname);
}
console.log('');

// ===========================================================================
// 第 3 部分：SW 的生命周期状态机
// ===========================================================================

section('--- 3. 生命周期：install → waiting → activating → activated ---');

/** 一个"页面"（客户端），它要么不受控，要么被某个 SW 控制 */
class MiniClient {
  constructor(name) {
    this.name = name;
    this.controller = null;
    this.loadedAssets = []; // 这次加载用到的资源（用来解释"刷新两次"）
  }

  toString() {
    return `页面[${this.name}]` + (this.controller ? `(由 ${this.controller.version} 控制)` : '(不受控)');
  }
}

/** 一个 Service Worker 实例 */
class MiniServiceWorker {
  constructor(version, scope) {
    this.version = version; // 'sw-v1' / 'sw-v2'
    this.scope = scope;
    this.state = 'parsed'; // parsed → installing → installed → activating → activated → redundant
    this.onstatechange = null;
  }

  _setState(s) {
    this.state = s;
    console.log(`      [${this.version}] 状态 → ${s}`);
    if (this.onstatechange) this.onstatechange();
  }

  /** install 事件：预缓存静态资源 */
  async install(assets) {
    this._setState('installing');
    const cache = await caches.open(`static-${this.version}`);
    // 真实代码里这里是 self.addEventListener('install', e => e.waitUntil(cache.addAll([...])))
    await cache.addAll(assets);
    this._setState('installed');
  }

  /** activating 事件：清理旧版本缓存 */
  async activate() {
    this._setState('activating');
    const keep = `static-${this.version}`;
    for (const name of await caches.keys()) {
      if (name !== keep) {
        await caches.delete(name);
        console.log(`        清理旧缓存：${name}`);
      }
    }
    this._setState('activated');
  }

  _terminate() {
    this._setState('redundant');
  }
}

/** 容器：相当于浏览器的 navigator.serviceWorker */
class MiniServiceWorkerContainer {
  constructor() {
    this._registration = null;
    this._clients = [];
    this._scriptVersion = null; // 服务器上 sw.js 的当前内容版本
    this._skipWaitingFlag = false;
    this._claimFlag = false;
    // 真实浏览器的事件
    this.oncontrollerchange = null;
  }

  get controller() {
    return this._registration && this._registration.active && this._registration.active.state === 'activated' ? this._registration.active : null;
  }

  /** 注册。真实 API 只在 HTTPS / localhost 下可用，作用域也有限制 */
  async register(scriptURL, options = {}) {
    const scope = options.scope || scriptURL.replace(/[^/]*$/, '');
    if (!scriptURL.endsWith('.js')) throw new TypeError('SW 脚本必须是 .js');
    // 作用域规则：默认不能超出脚本所在目录
    const scriptDir = scriptURL.replace(/[^/]*$/, '');
    if (!scope.startsWith(scriptDir) && !options.allowedByHeader) {
      throw new Error(`SecurityError: 作用域 ${scope} 超出了脚本目录 ${scriptDir}（需要 Service-Worker-Allowed 响应头）`);
    }
    if (this._registration) return this._registration;
    this._registration = new MiniRegistration(scope, this);
    return this._registration;
  }

  _newClient(name) {
    const c = new MiniClient(name);
    c.controller = this.controller;
    this._clients.push(c);
    return c;
  }
}

class MiniRegistration {
  constructor(scope, container) {
    this.scope = scope;
    this.container = container;
    this.installing = null;
    this.waiting = null;
    this.active = null;
    this.onupdatefound = null;
  }

  /** 服务器上的 sw.js 变了 → 触发一次更新流程 */
  async update(assets) {
    const container = this.container;
    const nextVersion = container._scriptVersion;
    if (this.active && this.active.version === nextVersion) {
      console.log('  ▶ update()：sw.js 内容没变，什么都不做');
      return;
    }
    if (this.active && this.installing) {
      console.log('  ▶ update()：已有正在安装的版本，忽略');
      return;
    }
    const worker = new MiniServiceWorker(nextVersion, this.scope);
    this.installing = worker;
    if (this.onupdatefound) this.onupdatefound();
    await worker.install(assets);
    this.installing = null;

    // 有没有"旧 SW 控制的页面"还开着？有 → 停在 waiting；没有 → 直接 activate
    const controlled = container._clients.filter((c) => c.controller && c.controller !== worker);
    if (this.active && controlled.length > 0 && !container._skipWaitingFlag) {
      this.waiting = worker;
      console.log(`      → 还有 ${controlled.length} 个页面被旧版本控制着，停在 waiting`);
      console.log('      → 用户需要关掉所有标签页再打开，或者由代码调用 skipWaiting()');
    } else {
      if (container._skipWaitingFlag) console.log('      → skipWaiting() 已开启：跳过 waiting，直接激活');
      this.waiting = null; // 新版本直接激活了，原来停在 waiting 的那个作废
      if (this.active) this.active._terminate();
      await worker.activate();
      this.active = worker;
      // clients.claim()：把已有页面也交给新 SW 控制
      if (container._claimFlag) {
        for (const c of container._clients) c.controller = worker;
        console.log('      → clients.claim() 已开启：现有页面立刻改由新版本控制');
        if (container.oncontrollerchange) container.oncontrollerchange();
      }
    }
  }

  /** 让 waiting 的版本立刻激活 */
  async skipWaiting() {
    if (!this.waiting) {
      console.log('  ▶ skipWaiting()：当前没有 waiting 的版本');
      return;
    }
    const worker = this.waiting;
    this.waiting = null;
    if (this.active) this.active._terminate();
    await worker.activate();
    this.active = worker;
  }
}

const container = new MiniServiceWorkerContainer();
container.oncontrollerchange = () => console.log('      [页面] 收到 controllerchange 事件：控制器换了');

console.log('场景 A：第一次注册（此时还没有任何 SW）');
container._scriptVersion = 'sw-v1';
container._clients.push(new MiniClient('标签页-1'));
let registration = await container.register('/sw.js', { scope: '/' });
await registration.update(['/index.html', '/style.css', '/app.js', '/offline.html']);
console.log('  当前 active = ' + registration.active.version);
console.log('  标签页-1 的 controller = ' + (container._clients[0].controller ? '已接管' : 'null（首次注册不会立刻接管，下次导航才控制）'));
const tab2 = container._newClient('标签页-2');
console.log('  新开一个标签页-2：controller = ' + (tab2.controller ? tab2.controller.version : 'null'));
console.log('  → 首次注册时，"先打开的页面"不受控，"之后打开的页面"才受控。');
console.log('');

// ===========================================================================
// 第 4 部分："刷新两次才生效"的完整时间线
// ===========================================================================

section('--- 4. 经典问题：为什么用户要刷新两次才能看到新版本？ ---');

console.log('现在服务器上的 sw.js 升级到 v2，站点资源也变成了 v2：');
net.siteVersion = 2;
container._scriptVersion = 'sw-v2';
await registration.update(['/index.html', '/style.css', '/app.js', '/offline.html']);
console.log('  当前 active = ' + registration.active.version + '，waiting = ' + (registration.waiting ? registration.waiting.version : 'null'));
console.log('');

console.log('① 打开 DevTools 的 "Update on reload"（或代码里调用 skipWaiting）：');
container._skipWaitingFlag = true;
container._claimFlag = true;
await registration.update(['/index.html', '/style.css', '/app.js', '/offline.html']);
console.log('  active = ' + registration.active.version + '，waiting = ' + (registration.waiting ? registration.waiting.version : 'null'));
console.log('');

console.log('② 但是！用户当前这个页面里，HTML/CSS/JS 是**在 SW 接管之前就已经加载完的**：');
const client = container._clients[0];
client.loadedAssets = ['/index.html(v1)', '/style.css(v1)', '/app.js(v1)'];
console.log('  ' + client.name + ' 本次加载到的资源：' + client.loadedAssets.join(', '));
console.log('  → 页面上的内容还是 v1。SW 换了，但这一次导航已经结束了。');
console.log('');

console.log('③ 用户再刷新一次（第二次刷新）：这次请求真的经过了新 SW 的 fetch 处理器');
{
  const cache = await caches.open('static-sw-v2');
  const res = await cache.match('/index.html');
  const text = res ? await res.text() : '(缓存里没有)';
  const m = text.match(/v(\d+)/);
  client.loadedAssets = ['/index.html(v' + (m ? m[1] : '?') + ')', '/style.css(v2)', '/app.js(v2)'];
  console.log('  ' + client.name + ' 第二次加载到的资源：' + client.loadedAssets.join(', '));
}
console.log('  → 这次才是新版本。这就是"用户要刷新两次才生效"。');
console.log('');
console.log('正确做法（工程实践）：');
console.log('  1) 不要默默期待用户刷新两次，而是在页面里监听更新，主动提示：');
console.log('       reg.addEventListener("updatefound", () => { ... });');
console.log('       newWorker.addEventListener("statechange", () => {');
console.log('         if (newWorker.state === "installed" && navigator.serviceWorker.controller) 提示用户"有新版本";');
console.log('       });');
console.log('  2) 用户点了"刷新"之后，用 postMessage 通知 SW skipWaiting，');
console.log('     并在 controllerchange 里执行 location.reload()，一次点击完成升级；');
console.log('  3) 千万不要无条件 skipWaiting：那会让"新 SW + 旧页面资源"混在一起，');
console.log('     在老版本页面里跑新逻辑，反而更容易出 bug。');

// ===========================================================================
// 第 5 部分：缓存策略决策器
// ===========================================================================

section('--- 5. 缓存策略决策器：三种策略 × 四种网络状况 ---');

const STATIC_CACHE = 'static-sw-v2';

/** 该不该拦截这个请求？（真实 SW 的 fetch 处理器第一步就在做这件事） */
function shouldIntercept(request) {
  const url = new URL(request.url);
  if (request.method !== 'GET') return { intercept: false, reason: '非 GET 请求不拦截（POST 等交给网络）' };
  if (url.origin !== ORIGIN) return { intercept: false, reason: '跨域请求不放缓存（避免缓存到别人的响应）' };
  if (url.pathname.startsWith('/api/')) return { intercept: false, reason: 'API 请求走 network-first，不进静态缓存' };
  if (url.pathname === '/sw.js') return { intercept: false, reason: 'SW 脚本自身永远走网络（浏览器强制）' };
  return { intercept: true, reason: '同源静态资源，可以拦截' };
}

/**
 * 决策器核心：给定策略与请求，返回响应，并说明结果来自哪里。
 * 返回 { response, source, ms, note }
 */
async function handleFetch(strategy, path, options = {}) {
  const url = new URL(path, ORIGIN);
  const request = new Request(url);
  const cacheName = options.cacheName || STATIC_CACHE;
  const cache = await caches.open(cacheName);
  const t0 = performance.now();
  const finish = (response, source, note) => ({ response, source, ms: performance.now() - t0, note });

  // ------------------------------------------------- ① cache-first
  if (strategy === 'cache-first') {
    const hit = await cache.match(request);
    if (hit) return finish(hit, 'cache', '缓存命中，完全不碰网络（最快）');
    try {
      const res = await networkFetch(path);
      if (res.ok) await cache.put(request, res);
      return finish(res, 'network', '缓存未命中 → 走网络 → 顺手写入缓存');
    } catch (err) {
      const fallback = await caches.match('/offline.html');
      return finish(fallback, 'offline-fallback', '网络和缓存都没有 → 返回离线兜底页（' + err.name + '）');
    }
  }

  // ------------------------------------------------- ② network-first
  if (strategy === 'network-first') {
    try {
      const res = await networkFetch(path);
      if (res.ok) await cache.put(request, res);
      return finish(res, 'network', '网络成功 → 返回最新内容并更新缓存');
    } catch {
      const hit = await cache.match(request);
      if (hit) return finish(hit, 'cache', '网络失败 → 回退到缓存（内容可能略旧，但至少能用）');
      const fallback = await caches.match('/offline.html');
      return finish(fallback, 'offline-fallback', '网络失败且无缓存 → 离线兜底页');
    }
  }

  // ------------------------------------------------- ③ stale-while-revalidate
  if (strategy === 'stale-while-revalidate') {
    const hit = await cache.match(request);
    if (hit) {
      // 后台更新：不 await，让它自己跑（真实 SW 里用 event.waitUntil 延长生命周期）
      backgroundRevalidate(cache, request, path);
      return finish(hit, 'cache(+后台更新)', '立刻给缓存里的旧内容，同时后台请求新内容刷新缓存');
    }
    try {
      const res = await networkFetch(path);
      if (res.ok) await cache.put(request, res);
      return finish(res, 'network', '缓存未命中 → 走网络并写入缓存');
    } catch {
      const fallback = await caches.match('/offline.html');
      return finish(fallback, 'offline-fallback', '网络失败且无缓存 → 离线兜底页');
    }
  }

  throw new Error('未知策略：' + strategy);
}

let backgroundCount = 0;
function backgroundRevalidate(cache, request, path) {
  backgroundCount += 1;
  const id = backgroundCount;
  // 故意不 await：模拟"后台悄悄更新"
  networkFetch(path)
    .then(async (res) => {
      if (res.ok) {
        await cache.put(request, res);
        console.log(`      （后台任务 #${id} 已把 ${path} 的新版本写入缓存，下次就拿到新的了）`);
      }
    })
    .catch(() => {
      console.log(`      （后台任务 #${id} 更新 ${path} 失败，保留旧缓存）`);
    });
}

/** 跑一组场景，打印结果 */
async function runScenario(label, path, strategyUsed) {
  const { intercept, reason } = shouldIntercept(new Request(ORIGIN + path));
  if (!intercept) {
    console.log(`  ${label} → 不拦截（${reason}）`);
    return;
  }
  const r = await handleFetch(strategyUsed, path);
  const body = r.response ? (await r.response.text()).slice(0, 34).replace(/\n/g, ' ') : '(无响应)';
  console.log(
    `  ${label.padEnd(26)} 策略=${strategyUsed.padEnd(24)} 结果来源=${String(r.source).padEnd(20)} ` +
      `${r.ms.toFixed(0).padStart(3)}ms  内容：${body}`,
  );
}

console.log('准备：先把 v2 的静态资源预热进缓存（模拟 install 阶段的 addAll）');
{
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(['/index.html', '/style.css', '/app.js']);
  await caches.open('offline-v1').then((c) => c.add('/offline.html'));
  console.log('  已缓存：' + (await cacheKeysOf(cache)).join(', ') + ' 与 offline-v1/offline.html（离线兜底页）');
}
console.log('');

for (const strategy of ['cache-first', 'network-first', 'stale-while-revalidate']) {
  console.log(`【${strategy}】`);
  await setNet('fast');
  await runScenario('在线（快）', '/style.css', strategy);
  await setNet('slow');
  await runScenario('在线（慢 300ms）', '/style.css', strategy);
  await setNet('offline');
  await runScenario('离线', '/style.css', strategy);
  await sleep(350); // 等后台任务打印完
  await setNet('fast');
  console.log('');
}

console.log('对比结论：');
console.log('  · cache-first ：在线/离线都是 0ms 左右（缓存命中），但内容可能**永远是旧的**；');
console.log('                  只有缓存里没有时才走网络。适合带哈希的静态资源。');
console.log('  · network-first：慢网络下要等网络（300ms+），离线才回退缓存。');
console.log('                  适合必须尽量新鲜的 HTML 文档。');
console.log('  · stale-while-revalidate：永远立刻返回，慢网络下也只有 0ms；');
console.log('                  代价是"这一次拿到的是旧的"，下次刷新才是新的。');
console.log('                  实际项目里最常见的折中方案。');
console.log('');

console.log('② 不该拦截的请求（决策器的第一道闸门）：');
for (const path of ['/api/now', '/sw.js']) {
  const { intercept, reason } = shouldIntercept(new Request(ORIGIN + path));
  console.log(`  ${path.padEnd(12)} intercept=${intercept}  ← ${reason}`);
}
{
  const { intercept, reason } = shouldIntercept(new Request(ORIGIN + '/x', { method: 'POST' }));
  console.log(`  POST /x      intercept=${intercept}  ← ${reason}`);
}
console.log('');

// ===========================================================================
// 第 6 部分：缓存版本管理与清理
// ===========================================================================

section('--- 6. 缓存版本管理：activate 里必须清理旧缓存 ---');

console.log('当前所有缓存：', await caches.keys());
{
  // 模拟一次版本升级：v3 上线
  container._scriptVersion = 'sw-v3';
  net.siteVersion = 3;
  const reg = registration;
  await reg.update(['/index.html', '/style.css', '/app.js', '/offline.html']);
  console.log('升级后所有缓存：', await caches.keys());
  console.log('  新版本 activate 时把 static-sw-v2 / offline-v1 都删掉了；');
  console.log('  但注意：offline-v1 被误删了 —— 真实项目里要把"当前版本需要保留的缓存"列成白名单，');
  console.log('  只删除名单之外的，否则离线兜底页会在升级后突然消失（这是很常见的线上事故）。');
  console.log('');
  console.log('推荐的写法：');
  console.log('  const KEEP = [STATIC_CACHE, RUNTIME_CACHE, OFFLINE_CACHE];  // 含版本号');
  console.log('  self.addEventListener("activate", (e) => e.waitUntil((async () => {');
  console.log('    const names = await caches.keys();');
  console.log('    await Promise.all(names.filter((n) => !KEEP.includes(n)).map((n) => caches.delete(n)));');
  console.log('    await self.clients.claim();');
  console.log('  })()));');
}
console.log('');

// ===========================================================================
// 第 7 部分：真实浏览器里的注册代码与硬性限制
// ===========================================================================

section('--- 7. 真实代码长什么样 / 什么条件下才能用 ---');

console.log('【页面里（sw-register.js）】');
console.log('  if ("serviceWorker" in navigator) {              // ① 必须特性检测');
console.log('    window.addEventListener("load", async () => {');
console.log('      try {');
console.log('        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });');
console.log('        reg.addEventListener("updatefound", () => {');
console.log('          const sw = reg.installing;');
console.log('          sw.addEventListener("statechange", () => {');
console.log('            // ② 有新版本装好、而且当前页面已被旧 SW 控制 → 提示用户刷新');
console.log('            if (sw.state === "installed" && navigator.serviceWorker.controller) {');
console.log('              显示一个"有新版本，点击刷新"的提示条;');
console.log('              用户点击后：sw.postMessage({ type: "SKIP_WAITING" });');
console.log('            }');
console.log('          });');
console.log('        });');
console.log('        // ③ 控制器换了 → 刷新一次，彻底切到新版本');
console.log('        navigator.serviceWorker.addEventListener("controllerchange", () => location.reload());');
console.log('      } catch (err) {');
console.log('        console.warn("SW 注册失败（file:// 或非 HTTPS 下是正常的）：", err.name, err.message);');
console.log('      }');
console.log('    });');
console.log('  }');
console.log('');
console.log('【SW 脚本里（sw.js）】');
console.log('  const STATIC = "static-v3";');
console.log('  self.addEventListener("install", (e) => {');
console.log('    e.waitUntil(caches.open(STATIC).then((c) => c.addAll(["/", "/index.html", "/style.css"])));');
console.log('  });');
console.log('  self.addEventListener("activate", (e) => {');
console.log('    e.waitUntil((async () => {');
console.log('      for (const n of await caches.keys()) if (n !== STATIC) await caches.delete(n);');
console.log('      await self.clients.claim();');
console.log('    })());');
console.log('  });');
console.log('  self.addEventListener("fetch", (e) => {');
console.log('    e.respondWith(handleFetch(e.request));   // 决策器挂在这里');
console.log('  });');
console.log('  self.addEventListener("message", (e) => {');
console.log('    if (e.data?.type === "SKIP_WAITING") self.skipWaiting();');
console.log('  });');
console.log('');

console.log('【硬性限制速查】');
const limits = [
  ['协议', 'HTTPS 或 http://localhost（含 127.0.0.1）', '原因：SW 能读取/改写页面的所有响应，权限太大'],
  ['file://', '**完全不可用**，navigator.serviceWorker 根本不存在', '连注册的机会都没有，页面必须做特性检测与降级'],
  ['脚本来源', '必须同源，且 Content-Type 是 JS', 'CDN 上的脚本不能直接注册，需要转发或自建'],
  ['作用域', '默认是脚本所在目录，不能更宽', '要更宽需服务端返回 Service-Worker-Allowed 响应头'],
  ['SW 里能用', 'self / caches / fetch / IndexedDB / postMessage', '能访问 self.clients 管理页面'],
  ['SW 里不能用', 'window / document / DOM / localStorage / alert', 'localStorage 在 SW 里被刻意去掉（会阻塞）'],
  ['线程模型', '独立线程，可被浏览器随时终止', '所以不能放全局状态，全部状态要放缓存或 IndexedDB'],
  ['更新检查', '导航时自动检查，且最多每 24 小时绕过 HTTP 缓存一次', '调试时用 DevTools 的 Update on reload'],
];
for (const [k, v, why] of limits) {
  console.log('· ' + k);
  console.log('    规则：' + v);
  console.log('    原因：' + why);
}
console.log('');

// ===========================================================================
// 第 8 部分：浏览器 vs Node 对照
// ===========================================================================

section('--- 8. 浏览器 vs Node：能力对照 ---');

const compare = [
  ['Service Worker', '有，页面外的后台线程，可拦截网络', '没有。Node 里的对应物是"自己写 HTTP 代理/中间件"'],
  ['Cache Storage', '有（caches 全局对象）', '没有。本文件用 Map + Response 手写了一个'],
  ['fetch / Request / Response', '有', 'Node 18+ 全局内置（与浏览器同源实现）'],
  ['HTTPS 强制', '是，http 站点注册直接报错', '不需要（本文件用 127.0.0.1 随机端口避免影响别人）'],
  ['生命周期事件', 'install / activate / fetch / message / push', '没有事件，靠进程启动与请求处理函数'],
  ['离线能力', 'SW + Cache Storage 是唯一方案', '桌面/物联网应用里可以本地直接用文件系统'],
];
for (const [ability, browser, node] of compare) {
  console.log('· ' + ability);
  console.log('    浏览器：' + browser);
  console.log('    Node  ：' + node);
}

section('小结');
console.log('1) SW 是"可编程的网络代理"：install 预缓存、fetch 拦截、activate 清理。');
console.log('2) 它的生命周期是 install → (waiting) → activating → activated，');
console.log('   waiting 状态就是"用户刷新两次才生效"的根源，要主动提示用户更新。');
console.log('3) 三种缓存策略各有取舍：静态资源 cache-first、文档 network-first、');
console.log('   其它内容 stale-while-revalidate，实践中常常按请求路径分流。');
console.log('4) 没有 HTTPS / localhost 就没有 SW；file:// 下连注册的机会都没有。');
console.log('');

// ===========================================================================
// 收尾：关掉服务器
// ===========================================================================

await new Promise((resolve) => server.close(resolve));
console.log(`本地服务器已关闭（本次演示一共真实发起了 ${net.requestCount} 次 HTTP 请求）。`);
console.log('程序结束。');
