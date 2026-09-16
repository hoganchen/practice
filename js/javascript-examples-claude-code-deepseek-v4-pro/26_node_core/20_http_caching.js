/**
 * ============================================================================
 * 知识点：HTTP 缓存 —— 强缓存、协商缓存与 Vary
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】高级
 * 【前置知识】26_node_core/15_http_server_client.js、26_node_core/13_crypto_hash.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    HTTP 缓存是一套由**响应头驱动**的规则：服务端用响应头声明"这个响应能存多久、
 *    什么条件下能复用"，客户端（浏览器）与中间节点（CDN / 反向代理）按同一套规则
 *    决定"下次要不要再问服务端"。注意 HTTP 只规定**怎么描述**与**怎么验证**，
 *    缓存本身是各家的实现；Node 的 fetch 与 http 模块都**不会自动缓存**，
 *    这反而方便我们把规则一条条手工跑出来看。
 *
 *    两套机制，顺序固定：先看强缓存，不新鲜了才走协商缓存。
 *      · 强缓存（freshness，新鲜度）：在新鲜期内**连请求都不发**，直接用本地副本。
 *        由 Cache-Control 的 max-age / s-maxage / immutable，或 Expires 描述。
 *      · 协商缓存（validation，验证）：本地副本不新鲜时，发一个**条件请求**
 *        （带上 If-None-Match / If-Modified-Since）；服务端比对后回
 *        304 Not Modified（**没有响应体**）表示"内容没变，继续用你本地的"，
 *        回 200 则表示"内容变了，这是新的"。
 *
 *    谁来决定？缓存做三件事：
 *      ① 判断响应可不可存（no-store 不许存；private 只有浏览器能存）；
 *      ② 判断副本新不新鲜（max-age / Expires 算出来）；
 *      ③ 不新鲜时发条件请求去验证（ETag / Last-Modified）。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 首屏速度：一次页面加载动辄上百个请求，静态资源只要走强缓存，
 *      第二次访问就是"零网络"；这是前端性能优化里**性价比最高**的一条。
 *    - 带宽与成本：CDN 回源流量、按流量计费的云服务，缓存命中率直接等于钱。
 *    - 上线事故：`Cache-Control` 配错会让用户长时间拿到旧页面——"我明明发布了，
 *      为什么用户看不到"，或者反过来，缓存形同虚设导致服务被打爆。
 *    - 排查问题的基本功：DevTools 的 Network 面板里，Size 列的 `(memory cache)`、
 *      `(disk cache)`、`304` 分别对应强缓存命中、强缓存命中、协商缓存命中，
 *      看不懂这三个就没法判断"到底是谁在缓存"。
 *
 * 3. 核心语法要点（本示例全部实跑验证）
 *    - Cache-Control 的常用指令（可组合，逗号分隔）：
 *        max-age=N          新鲜期 N 秒（相对时间，客户端自己计时）——最常用
 *        s-maxage=N         只对**共享缓存**（CDN/代理）生效，优先级高于 max-age
 *        no-cache           **可以缓存**，但每次复用前必须向服务端验证 —— 最常被讲错
 *        no-store           任何部分都不许存（含请求体），用于含敏感信息的响应
 *        private            只允许浏览器这类**私有缓存**存，CDN 不许存
 *        public             即使默认不可缓存（如带 Authorization 的请求）也允许存
 *        immutable          在新鲜期内**连用户刷新都不验证**（非 RFC 标准，见下）
 *        must-revalidate    一旦过期就必须验证，不许用过期副本（离线时宁愿报错）
 *        stale-while-revalidate=N  过期后 N 秒内先用旧副本，同时后台去验证
 *    - 新鲜度计算的两种写法：
 *        Expires: <绝对时间>    HTTP/1.0 的写法，靠"两个钟对表"，有时钟依赖问题
 *        Cache-Control: max-age HTTP/1.1 的写法，**相对时长**，不受时钟偏差影响
 *        两者同时出现时，max-age 优先，Expires 被忽略
 *    - 条件请求头 / 响应头配对：
 *        ETag            -> If-None-Match          （内容指纹，精确）
 *        Last-Modified   -> If-Modified-Since      （最后修改时间，只到秒）
 *        RFC 9110：请求里同时有 If-None-Match 时，**必须忽略** If-Modified-Since
 *    - 304 响应：**没有响应体**，也没有 Content-Length；但会带上 ETag、
 *      Cache-Control、Expires、Vary 等"刷新缓存元数据"用的头
 *    - 弱 ETag：`W/"abc"` 表示"**语义等价**但不是逐字节相同"（弱比较）；
 *      不带 W/ 的是强 ETag，逐字节相同（强比较）。范围请求必须用强验证器
 *    - Vary: 声明"缓存键还要包含哪些请求头"。Vary: Accept-Encoding 表示
 *      压缩与不压缩是两个不同的副本；漏写就会把 A 变体发给 B 客户端（串缓存事故）
 *    - Age: 响应头，表示这个副本在共享缓存里已经待了多少秒
 *
 * 4. 常见陷阱
 *    陷阱 1：把 no-cache 当成"不缓存"。**错了**：no-cache 是"可以存，但每次要验证"，
 *            结果通常是 304 命中（省下的是响应体，不是请求）；真正"不缓存"的是
 *            no-store（连存都不许存）。
 *    陷阱 2：以为 `max-age=0` 等于不缓存。它等价于"每次都要重新验证"，
 *            跟 no-cache 效果接近，但语义上仍是可以缓存。
 *    陷阱 3：认为 Node 的 fetch / axios 会自己做 HTTP 缓存。**不会**。
 *            服务端与 Node 客户端都不缓存，只有浏览器和 CDN 才实现这套规则。
 *    陷阱 4：只看 Last-Modified 不看 ETag。它的精度只到秒，同一秒内改了两次内容，
 *            服务端会错误地回 304，用户拿到旧内容（本示例 "Last-Modified 的硬伤" 一节实测）。
 *    陷阱 5：服务器时区/时间不对，Expires 直接失效（绝对时间最怕钟不准）。
 *    陷阱 6：给 HTML 入口文件配了长 max-age。资源换了文件名，HTML 却还是旧的，
 *            用户永远加载不到新版 —— 入口 HTML 必须 no-cache 或极短 max-age。
 *    陷阱 7：跨域/压缩场景漏写 Vary，导致串缓存事故（本示例 "Vary" 一节实测）。
 *    陷阱 8：给 304 写响应体。规范禁止，客户端会直接报协议错误或忽略响应体。
 *    陷阱 9：no-store 用在图片等静态资源上，等于关掉了全部缓存，白烧带宽。
 *    陷阱 10：以为缓存能"主动清除"。绝大多数情况下只能靠 URL 变化（内容哈希）
 *             或 Cache-Control 的超时来间接失效，`Ctrl+F5` 只能影响你自己的浏览器。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/20_http_caching.js
 *   本示例在 127.0.0.1 上用 listen(0) 自建服务端，并在**同一个文件内**手写了一个
 *   "会自己算新鲜度"的最小缓存客户端，实跑完整的缓存往返；
 *   **不访问外网**，所有连接用完即关，进程自然退出、不会挂起。
 *
 * 【预期输出】
 *   依次打印：强缓存命中（零网络）/ no-cache 与 no-store 的对照实验 /
 *   immutable / Expires 的时钟依赖 / ETag 的完整 304 往返（含原始头）/
 *   Last-Modified 的秒级精度陷阱 / 弱 ETag / Vary 串缓存事故 /
 *   Cache-Control 指令组合 / 内容哈希失效策略 / HTTP/2 一句话 / 服务器统计。
 *   所有请求都在本机回环完成，数值与端口每次运行都可能不同。
 * ============================================================================
 */

import http from 'node:http';
import crypto from 'node:crypto';
import { once } from 'node:events';

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用小工具
// ---------------------------------------------------------------------------

/**
 * 解析 Cache-Control 响应头成对象。
 * 值形如 'public, max-age=60, stale-while-revalidate=30'，
 * 拆成 { public: true, 'max-age': '60', ... }；没有值的指令（如 no-store）取 true。
 */
function parseCacheControl(value) {
  const out = {};
  if (!value) return out;
  for (const part of String(value).split(',')) {
    const token = part.trim();
    if (!token) continue;
    const eq = token.indexOf('=');
    if (eq === -1) {
      out[token.toLowerCase()] = true;
    } else {
      // 去掉可能存在的引号：max-age="60" 也是合法的
      out[token.slice(0, eq).trim().toLowerCase()] = token.slice(eq + 1).trim().replace(/^"|"$/g, '');
    }
  }
  return out;
}

/**
 * 生成 ETag：对内容做 sha1 取前 12 位十六进制，再用双引号包起来。
 * 关键点：ETag 是**内容的指纹**——内容变则 ETag 必变，与时间无关。
 * 括号里的双引号是规范要求的，格式形如 "3f2a1c9b7d4e"。
 */
function computeEtag(body) {
  const hash = crypto.createHash('sha1').update(body, 'utf8').digest('hex').slice(0, 12);
  return `"${hash}"`;
}

/**
 * 判断客户端的 If-None-Match 是否能匹配上当前的 ETag。
 * 规则：① 可以是用逗号分隔的多个值；② `*` 匹配任何内容；
 *      ③ 用**弱比较**——即忽略 `W/` 前缀（RFC 9110 规定 If-None-Match 用弱比较）。
 */
function etagMatches(ifNoneMatch, etag) {
  const strip = (v) => v.trim().replace(/^W\//, '');
  return ifNoneMatch
    .split(',')
    .map((v) => v.trim())
    .some((v) => v === '*' || strip(v) === strip(etag));
}

/** HTTP-date 只精确到秒，这里把毫秒截断掉，模拟真实的时间精度 */
const toWholeSecond = (ms) => Math.floor(ms / 1000) * 1000;

/**
 * 用 node:http 发一个"原样"请求，并把原始响应头也带回来。
 *
 * 为什么不用 fetch？两个原因：
 *   ① 我们要把**发出去的请求头**（If-None-Match / If-Modified-Since）原样打印出来，
 *      http.request 能给出最直接的控制与观测；
 *   ② fetch（undici）默认开启 keep-alive 连接池，脚本结束时必须调
 *      closeAllConnections()，否则连接不复用也不关闭，进程会挂住。
 *      这里用 `agent: false`（每个请求新建一次性连接、响应后即关），
 *      从根上避免挂起问题，也就不需要再操心连接池。
 */
function rawRequest(port, { path, method = 'GET', headers = {} }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      // host 固定回环地址：请求不出网卡，不访问任何外网
      { host: '127.0.0.1', port, path, method, headers, agent: false },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers, // 键名全是小写
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

/** 按行打印一组响应头，用来让读者亲眼看 304 到底长什么样 */
function printHeaders(headers, indent = '      ') {
  for (const [name, value] of Object.entries(headers)) {
    console.log(`${indent}${name}: ${Array.isArray(value) ? value.join(', ') : value}`);
  }
}

/**
 * 把请求头的键名统一成小写。
 * HTTP 头名**不区分大小写**（Accept-Encoding 与 accept-encoding 是同一个头），
 * 所以缓存键在比对 Vary 声明的头时，必须先把两边都归一化，否则会得出
 * "两个不同变体是同一个"的错误结论 —— 这正是串缓存事故的一个真实成因。
 */
function lowerKeys(headers) {
  const out = {};
  for (const [name, value] of Object.entries(headers)) out[name.toLowerCase()] = value;
  return out;
}

// ---------------------------------------------------------------------------
// 1. 一个"会缓存"的服务端：每条路由演示一种缓存策略
// ---------------------------------------------------------------------------

console.log('--- 1. 创建服务端（每种缓存策略一条路由）---');

/** 每个路径被真实请求了多少次（这是判断"缓存到底有没有生效"的唯一硬证据） */
const serverHitCount = new Map();

/**
 * 服务端状态：一个"内容会变"的文档，用来演示协商缓存。
 * 注意 modifiedMs 被**故意截断到秒**——这正是 Last-Modified 的精度上限，
 * 后面"Last-Modified 的硬伤"一节会利用这一点复现"同一秒内改两次，服务端错误地回 304"的经典 Bug。
 */
const doc = {
  version: 1,
  body: '第一版内容：Hello Cache',
  modifiedMs: toWholeSecond(Date.now()),
};

/** 服务端当前时间（用于 Expires 演示，基准是服务端的钟） */
const SERVER_NOW = Date.now();

/** 计算"某个资源"的响应体（内容哈希文件名演示用） */
const APP_JS_V1 = 'console.log("app v1");';
const LOGO_PNG = 'PNG\x00fake-image-bytes';

/**
 * 缓存策略表：一个路径 -> 一份响应规格。
 * 真实的静态文件服务器（nginx、Express 的 static）内部就是一张这样的表。
 */
const ROUTES = {
  // ---- 强缓存：普通静态资源，60 秒内不再回源 ----
  '/img/logo.png': {
    type: 'image/png',
    body: () => LOGO_PNG,
    cacheControl: 'max-age=60',
    etag: true,
  },

  // ---- 强缓存：内容哈希文件名 + 一年 + immutable（静态资源的最终形态）----
  // 文件名里带内容哈希，内容一变文件名就变，所以 URL 可以放心缓存到"永远"。
  [`/static/app.${computeEtag(APP_JS_V1).replace(/"/g, '')}.js`]: {
    type: 'text/javascript; charset=utf-8',
    body: () => APP_JS_V1,
    cacheControl: 'public, max-age=31536000, immutable',
    etag: true,
  },

  // ---- no-cache：可以缓存，但每次必须验证（入口 HTML 的标准做法）----
  '/index.html': {
    type: 'text/html; charset=utf-8',
    body: () => '<html><body>入口页面 v1</body></html>',
    cacheControl: 'no-cache',
    etag: true,
  },

  // ---- no-cache：接口也可以这么用，省下的是响应体而不是请求 ----
  '/api/profile': {
    type: 'application/json; charset=utf-8',
    body: () => JSON.stringify({ user: '张三', level: 7 }, null, 2),
    cacheControl: 'no-cache',
    etag: true,
  },

  // ---- no-store：含敏感数据，任何缓存都不许存 ----
  '/api/token': {
    type: 'application/json; charset=utf-8',
    body: () => JSON.stringify({ token: 'secret-abcdef', expiresIn: 3600 }, null, 2),
    cacheControl: 'no-store',
    etag: true, // 故意也带上 ETag —— no-store 时它毫无意义，因为根本没人存
  },

  // ---- Expires：HTTP/1.0 的绝对时间写法（见后面 Expires 一节）----
  '/legacy/old.css': {
    type: 'text/css; charset=utf-8',
    body: () => 'body { color: red; }',
    // 注意：这里是"服务端当前时间 + 60 秒"的绝对时刻，不是时长
    expires: new Date(SERVER_NOW + 60_000).toUTCString(),
    etag: false,
  },

  // ---- 共享缓存 vs 私有缓存：s-maxage 对 CDN 生效，max-age 对浏览器生效 ----
  '/shared/widget.js': {
    type: 'text/javascript; charset=utf-8',
    body: () => 'window.WIDGET = 1;',
    cacheControl: 'public, max-age=600, s-maxage=1',
    etag: true,
  },

  // ---- private：只有浏览器能存，CDN 必须放行回源 ----
  '/admin/panel': {
    type: 'text/html; charset=utf-8',
    body: () => '<html>管理后台（与用户身份相关，不能进 CDN）</html>',
    cacheControl: 'private, max-age=300',
    etag: true,
  },

  // ---- stale-while-revalidate：过期后仍可先用旧副本，同时后台验证 ----
  '/api/feed': {
    type: 'application/json; charset=utf-8',
    body: () => JSON.stringify({ items: ['a', 'b', 'c'] }),
    cacheControl: 'max-age=1, stale-while-revalidate=30',
    etag: true,
  },

  // ---- 弱 ETag：语义等价而非逐字节相同 ----
  '/api/weak': {
    type: 'application/json; charset=utf-8',
    body: () => JSON.stringify({ greeting: '你好', note: '弱 ETag 演示' }),
    cacheControl: 'no-cache',
    weakEtag: true,
  },

  // ---- Vary 演示：同一个 URL，按 Accept-Encoding 返回不同变体 ----
  '/api/vary-encoding': {
    type: 'application/json; charset=utf-8',
    body: (req) => {
      // 真实世界里这里是"压缩过 / 没压缩"的同一份内容；
      // 为了在终端里看得见差异，我们用不同的 body 代表不同的变体。
      const enc = req.headers['accept-encoding'] ?? '(未发送)';
      return JSON.stringify({ variant: enc, note: '这是为你这个 Accept-Encoding 生成的副本' }, null, 2);
    },
    cacheControl: 'max-age=600',
    etag: true,
    vary: 'Accept-Encoding',
  },

  // ---- Vary 演示：CORS 场景，漏写 Vary: Origin 会把 A 站的 CORS 头发给 B 站 ----
  '/api/vary-origin': {
    type: 'application/json; charset=utf-8',
    body: (req) => {
      const origin = req.headers.origin ?? '(无 Origin)';
      return JSON.stringify({ allowOrigin: origin }, null, 2);
    },
    cacheControl: 'public, max-age=600',
    etag: true,
    vary: 'Origin',
  },
};

/**
 * 统一的资源响应函数：**服务端侧的缓存逻辑全在这里**。
 * 它做三件事：算 ETag / Last-Modified -> 判定条件请求 -> 回 200 或 304。
 */
function serveResource(req, res, path, spec) {
  const body = spec.body(req);

  // ① 生成验证器。ETag 由内容算出（内容变则变）；弱 ETag 加 W/ 前缀。
  const etag = spec.weakEtag ? `W/${computeEtag(body)}` : spec.etag ? computeEtag(body) : null;
  // ② Last-Modified 由"资源的最后修改时间"给出，精确到秒。
  const lastModified = spec.lastModifiedMs ? new Date(spec.lastModifiedMs).toUTCString() : null;

  // ③ 条件请求判定 —— 这是协商缓存的服务端核心。
  const ifNoneMatch = req.headers['if-none-match'];
  const ifModifiedSince = req.headers['if-modified-since'];
  let notModified = false;
  let judge = '无条件请求，直接回 200';

  if (ifNoneMatch && etag) {
    // 有 If-None-Match 时**只看 ETag**，If-Modified-Since 一律忽略（RFC 9110）。
    if (etagMatches(ifNoneMatch, etag)) {
      notModified = true;
      judge = `If-None-Match(${ifNoneMatch}) 与 ETag(${etag}) 匹配 -> 304`;
    } else {
      judge = `If-None-Match(${ifNoneMatch}) 与 ETag(${etag}) 不匹配 -> 200（内容变了）`;
    }
  } else if (!ifNoneMatch && ifModifiedSince && lastModified) {
    // 只有拿不到 ETag 时才退而求其次用时间比较。
    // 比较的是"资源最后修改时间 <= 客户端手上的时间"，就是这里埋着秒级精度的雷。
    if (Date.parse(lastModified) <= Date.parse(ifModifiedSince)) {
      notModified = true;
      judge = `Last-Modified(${lastModified}) <= If-Modified-Since(${ifModifiedSince}) -> 304`;
    } else {
      judge = `Last-Modified(${lastModified}) > If-Modified-Since(${ifModifiedSince}) -> 200`;
    }
  }

  // 记录一行服务端日志：这是"缓存到底有没有省掉网络往返"的唯一证据。
  console.log(`      [服务器] ${path}  ${judge}`);

  // 304 响应要带的头：告诉客户端"你的副本还能继续用，顺便更新一下元数据"。
  // 注意 304 **绝不能带响应体**，也不该带 Content-Length。
  const cacheHeaders = {};
  if (spec.cacheControl) cacheHeaders['Cache-Control'] = spec.cacheControl;
  if (spec.expires) cacheHeaders.Expires = spec.expires;
  if (etag) cacheHeaders.ETag = etag;
  if (lastModified) cacheHeaders['Last-Modified'] = lastModified;
  if (spec.vary) cacheHeaders.Vary = spec.vary;

  if (notModified) {
    res.writeHead(304, cacheHeaders);
    res.end(); // 只结束响应，不写任何字节
    return;
  }

  res.writeHead(200, {
    'Content-Type': spec.type,
    'Content-Length': Buffer.byteLength(body, 'utf8'),
    ...cacheHeaders,
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const path = url.pathname;

  // 统计每个路径真实收到的请求数
  serverHitCount.set(path, (serverHitCount.get(path) ?? 0) + 1);

  try {
    // ---- 演示辅助路由：改文档内容（模拟"线上内容更新"）----
    if (path === '/__doc/edit') {
      doc.version += 1;
      doc.body = `第 ${doc.version} 版内容：Hello Cache`;
      // 关键：这里**故意不更新 modifiedMs**，模拟"同一秒内又改了一次"
      // （真实场景里两次发布/两次写入落在同一秒，就会触发后面演示的那个 Bug）
      const payload = JSON.stringify({ version: doc.version, modified: new Date(doc.modifiedMs).toISOString() });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(payload);
      console.log(`      [服务器] /__doc/edit -> 内容已改为第 ${doc.version} 版（Last-Modified 仍是 ${new Date(doc.modifiedMs).toUTCString()}）`);
      return;
    }

    // ---- 演示辅助路由：把文档的 Last-Modified 推进到下一整秒 ----
    if (path === '/__doc/touch') {
      doc.modifiedMs = toWholeSecond(Date.now()) + 1000;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ modified: new Date(doc.modifiedMs).toISOString() }));
      return;
    }

    // ---- 协商缓存主角：会变的文档，同时带 ETag 和 Last-Modified ----
    if (path === '/api/doc') {
      serveResource(req, res, path, {
        type: 'application/json; charset=utf-8',
        body: () => JSON.stringify({ version: doc.version, content: doc.body }, null, 2),
        cacheControl: 'no-cache',
        etag: true,
        lastModifiedMs: doc.modifiedMs,
      });
      return;
    }

    // ---- 普通策略路由 ----
    const spec = ROUTES[path];
    if (spec) {
      serveResource(req, res, path, spec);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'NOT_FOUND', path }));
  } catch (err) {
    console.error('      [服务器] 出错：', err.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'INTERNAL_ERROR' }));
    } else {
      res.end();
    }
  }
});

// listen(0)：让系统分配空闲端口，避免端口冲突（见 15_http_server_client.js）
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const PORT = server.address().port;
console.log(`  服务器已启动：http://127.0.0.1:${PORT}（端口由系统分配，每次运行都不同）`);

// 动态路由的路径（带内容哈希的那个静态资源）
const HASHED_APP_PATH = Object.keys(ROUTES).find((p) => p.startsWith('/static/app.'));

// ---------------------------------------------------------------------------
// 2. 客户端：一个会自己算新鲜度的最小缓存（模拟浏览器）
// ---------------------------------------------------------------------------

/**
 * MiniCache —— 把浏览器 HTTP 缓存的决策逻辑浓缩成一个小类。
 *
 * 真实浏览器不会把决策暴露给你，所以这里手写一遍。它实现的就是标准的四步：
 *   ① 查缓存（键 = URL + Vary 里声明的请求头）
 *   ② 判断新鲜度（max-age 用**相对时长**；Expires 用**绝对时刻**）
 *   ③ 不新鲜 -> 带上条件请求头去验证（有 ETag 用 If-None-Match，
 *      否则退回 If-Modified-Since）
 *   ④ 200 就替换副本；304 就更新元数据并继续用旧副本
 */
class MiniCache {
  /**
   * @param {string} label  名字，打印用
   * @param {{shared?: boolean}} [options] shared=true 表示 CDN/反向代理这类**共享缓存**
   */
  constructor(label, { shared = false } = {}) {
    this.label = label;
    this.shared = shared;
    this.entries = new Map(); // 存储：key = path|序号
    this.seq = 0;
    this.networkCount = 0; // 真正发出去的请求数
    this.hitCount = 0; // 强缓存命中（零网络）
    this.revalidateCount = 0; // 发出条件请求的次数
    this.notModifiedCount = 0; // 其中被回 304 的次数
    this.storedCount = 0; // 存入副本的次数
    this.lastRequestHeaders = null; // 最近一次真正发出的请求头（用于打印证据）
  }

  /** 按响应头算出"能不能存、存多久"，即缓存策略解析 */
  _policy(headers) {
    const cc = parseCacheControl(headers['cache-control']);

    // ① no-store：任何部分都不许存 —— 这才是真正的"不缓存"
    if ('no-store' in cc) return { storable: false, note: 'no-store 不许存' };

    // ② private：共享缓存（CDN）不能存，私有缓存（浏览器）可以
    if (this.shared && 'private' in cc) return { storable: false, note: 'private 只允许浏览器存' };

    // ③ 新鲜期来源，优先级：s-maxage（共享缓存专用）> max-age > Expires
    //    max-age 是**相对时长**；Expires 是**绝对时刻**，两者的区别是后面 Expires 一节的主角。
    let lifetimeMs = null;
    let absoluteExpiresMs = null;
    let note;
    if (this.shared && cc['s-maxage'] !== undefined) {
      lifetimeMs = Number(cc['s-maxage']) * 1000;
      note = `s-maxage=${cc['s-maxage']}（共享缓存优先）`;
    } else if (cc['max-age'] !== undefined) {
      lifetimeMs = Number(cc['max-age']) * 1000;
      note = `max-age=${cc['max-age']}`;
    } else if (headers.expires) {
      absoluteExpiresMs = Date.parse(headers.expires);
      note = `Expires=${headers.expires}`;
    } else {
      // 没有任何新鲜期信息：规范允许"启发式缓存"，但保守实现一律当作已过期
      lifetimeMs = 0;
      note = '无新鲜期信息 -> 每次都视为已过期';
    }

    // ④ no-cache：**可以存**，但每次复用前必须验证 —— 所以新鲜期视为 0
    const mustRevalidate = 'no-cache' in cc;
    if (mustRevalidate) {
      lifetimeMs = 0;
      absoluteExpiresMs = null;
      note += ' + no-cache（每次都要验证）';
    }

    // ⑤ Vary：缓存键必须包含这些请求头，否则不同变体会互相顶掉（见本文件后面的 Vary 一节）
    const varyHeader = headers.vary ?? '';
    const vary =
      varyHeader.trim() === '*'
        ? ['*'] // Vary: * 表示"永远不可复用"
        : varyHeader
            .split(',')
            .map((h) => h.trim().toLowerCase())
            .filter(Boolean);

    return {
      storable: true,
      lifetimeMs,
      absoluteExpiresMs,
      immutable: 'immutable' in cc,
      mustRevalidate,
      vary,
      note,
    };
  }

  /** 判断副本是否新鲜 —— 强缓存的全部逻辑就是这一行 */
  _isFresh(entry, nowClient) {
    // immutable：新鲜期内连"用户刷新"都不再验证（Chrome/Firefox 支持，非 RFC 标准）
    if (entry.immutable) return true;
    // max-age：**相对时长**，用客户端自己流逝的时间去比 —— 不受时钟偏差影响
    if (entry.lifetimeMs !== null) return nowClient - entry.storedAt < entry.lifetimeMs;
    // Expires：**绝对时刻**，只能拿"我现在的钟"去比 —— 时钟偏差会直接改变结论
    return nowClient < entry.absoluteExpiresMs;
  }

  /** 查找匹配的副本；ignoreVary=true 时故意忽略 Vary（复现串缓存事故） */
  _lookup(path, reqHeaders, ignoreVary) {
    const req = lowerKeys(reqHeaders);
    for (const entry of this.entries.values()) {
      if (entry.path !== path) continue;
      if (ignoreVary || entry.vary.length === 0) return entry;
      if (entry.vary[0] === '*') continue;
      // Vary 声明的每个请求头都必须逐一同值，才算同一个变体
      const same = entry.vary.every((h) => (entry.varyValues[h] ?? '') === (req[h] ?? ''));
      if (same) return entry;
    }
    return null;
  }

  /** 把 200 响应存成副本 */
  _store(path, reqHeaders, res, policy, nowClient) {
    const req = lowerKeys(reqHeaders);
    // 同一个变体上的旧副本先删掉（等价于"替换"）
    for (const [key, entry] of this.entries) {
      if (entry.path !== path) continue;
      const sameVariant = policy.vary.every((h) => (entry.varyValues[h] ?? '') === (req[h] ?? ''));
      if (sameVariant) this.entries.delete(key);
    }
    this.entries.set(`${path}|${this.seq++}`, {
      path,
      status: res.status,
      headers: res.headers,
      body: res.body, // 真实浏览器会把响应体写到磁盘/内存；这里放内存
      storedAt: nowClient,
      etag: res.headers.etag ?? null,
      lastModified: res.headers['last-modified'] ?? null,
      vary: policy.vary,
      varyValues: Object.fromEntries(policy.vary.map((h) => [h, req[h] ?? ''])),
      lifetimeMs: policy.lifetimeMs,
      absoluteExpiresMs: policy.absoluteExpiresMs,
      immutable: policy.immutable,
    });
    this.storedCount += 1;
  }

  /**
   * 直接往缓存里塞一个副本（不走网络）。
   * 教学用途：有些实验需要"手上已经有副本"的初始状态，用它可以省掉一次请求。
   */
  seed(path, { status = 200, headers, body, etag = null, lastModified = null, lifetimeMs = 0, staleSince = 0 }) {
    this.entries.set(`${path}|${this.seq++}`, {
      path,
      status,
      headers,
      body,
      // staleSince > 0 表示"这份副本是 staleSince 毫秒之前存下来的"，即已经不新鲜
      storedAt: Date.now() - staleSince,
      etag,
      lastModified,
      vary: [],
      varyValues: {},
      lifetimeMs,
      absoluteExpiresMs: null,
      immutable: false,
    });
    return this;
  }

  /**
   * 把时间往后拨 deltaMs，检查某个路径上的副本是否还新鲜。
   * 对 max-age 来说，deltaMs 等价于"本地时间流逝了这么久"；
   * 对 Expires 来说，deltaMs 等价于"客户端的钟比服务端快了这么多"。
   */
  peekFreshness(path, deltaMs) {
    const entry = this._lookup(path, {}, true);
    if (!entry) return null;
    return this._isFresh(entry, Date.now() + deltaMs);
  }

  /**
   * 发一次"带缓存的请求"。
   *
   * @param {number} port
   * @param {string} path
   * @param {object} [options]
   * @param {object}  [options.reqHeaders={}]    原始请求头（Vary 与 Accept-Encoding 演示用）
   * @param {number}  [options.clockOffsetMs=0]  客户端时钟相对服务端的偏移（Expires 演示用）
   * @param {boolean} [options.ignoreVary=false] 故意忽略 Vary（串缓存演示用）
   * @param {boolean} [options.forceReload=false] 模拟用户按 Ctrl+R（跳过强缓存，仍带条件请求）
   * @returns {Promise<{status:number, body:string, headers:object, source:string, requestHeaders:object|null}>}
   */
  async request(port, path, { reqHeaders = {}, clockOffsetMs = 0, ignoreVary = false, forceReload = false } = {}) {
    const nowClient = Date.now() + clockOffsetMs;
    const entry = this._lookup(path, reqHeaders, ignoreVary);

    // ---- 第一步：强缓存 —— 新鲜就直接用，一个字节都不发出去 ----
    if (entry && !forceReload && this._isFresh(entry, nowClient)) {
      this.hitCount += 1;
      return {
        status: entry.status, // 交付给业务代码的状态码
        wireStatus: 0, // 0 表示"没有任何 HTTP 往返"
        body: entry.body,
        headers: entry.headers,
        source: 'hit',
        requestHeaders: null,
      };
    }

    // ---- 第二步：协商缓存 —— 带上条件请求头去问服务端 ----
    const headers = { ...reqHeaders };
    if (entry) {
      this.revalidateCount += 1;
      if (entry.etag) {
        // 有 ETag 就用它（更精确）；服务端看到 If-None-Match 会忽略 If-Modified-Since
        headers['If-None-Match'] = entry.etag;
      } else if (entry.lastModified) {
        headers['If-Modified-Since'] = entry.lastModified;
      }
    }

    this.networkCount += 1;
    this.lastRequestHeaders = headers;
    const res = await rawRequest(port, { path, headers });

    // ---- 第三步：处理 304 —— 没有响应体，只有元数据 ----
    if (res.status === 304 && entry) {
      this.notModifiedCount += 1;
      // 304 可以携带新的 Cache-Control / Expires，用来刷新副本的元数据
      const merged = { ...entry.headers, ...res.headers };
      const policy = this._policy(merged);
      Object.assign(entry, {
        headers: merged,
        storedAt: nowClient, // 验证通过 -> 新鲜期重新开始计时
        etag: merged.etag ?? entry.etag,
        lastModified: merged['last-modified'] ?? entry.lastModified,
        lifetimeMs: policy.lifetimeMs,
        absoluteExpiresMs: policy.absoluteExpiresMs,
        immutable: policy.immutable,
      });
      return {
        status: entry.status, // 交付给业务代码的仍是原来的 200
        wireStatus: 304, // 但网络上真正收到的是 304
        body: entry.body,
        headers: res.headers,
        source: '304',
        requestHeaders: headers,
      };
    }

    // ---- 第四步：200 —— 用新副本替换旧的 ----
    if (res.status === 200) {
      const policy = this._policy(res.headers);
      if (policy.storable) this._store(path, reqHeaders, res, policy, nowClient);
    }
    return {
      status: res.status,
      wireStatus: res.status,
      body: res.body,
      headers: res.headers,
      source: 'network',
      requestHeaders: headers,
    };
  }
}

/** 把一次请求的结果打印成人能看懂的一行 */
const SOURCE_TEXT = {
  hit: '强缓存命中（零网络）',
  '304': '协商缓存命中（304，无响应体）',
  network: '走网络（200，完整响应体）',
};

function report(result, extra = '') {
  const from = SOURCE_TEXT[result.source] ?? result.source;
  // wireStatus 是"网络上真实收到的状态码"，0 表示根本没发请求；
  // 而 result.status 是"最终交付给业务代码的状态码"（304 时会沿用副本里的 200）。
  const wire = result.wireStatus === 0 ? '没有任何 HTTP 往返' : `网络上的状态码 = ${result.wireStatus}`;
  console.log(`    => ${from}（${wire}）${extra}`);
}

// ---------------------------------------------------------------------------
// 3. 强缓存：max-age 命中后，连请求都不会发出去
// ---------------------------------------------------------------------------

console.log('\n--- 2. 强缓存：max-age=60 ---');

const browser = new MiniCache('浏览器（私有缓存）');
const logoPath = '/img/logo.png';

console.log('  第 1 次请求 /img/logo.png（缓存里什么都没有）：');
let r = await browser.request(PORT, logoPath);
report(r, `  Cache-Control = ${r.headers['cache-control']}`);
console.log(`      （服务端这个路径累计收到 ${serverHitCount.get(logoPath)} 次请求）`);

console.log('  第 2 次请求同一个 URL（应该完全不走网络）：');
r = await browser.request(PORT, logoPath);
report(r, `  body = ${JSON.stringify(r.body)}`);
console.log(`      （服务端这个路径累计收到 ${serverHitCount.get(logoPath)} 次请求 —— 没有增加，证明网络往返被省掉了）`);

console.log('  服务器上还能看到第 2 次请求的日志吗？看不到。这就是强缓存的价值。');
console.log(`  缓存统计：网络请求 ${browser.networkCount} 次，强缓存命中 ${browser.hitCount} 次。`);

// ---------------------------------------------------------------------------
// 4. no-cache vs no-store：最常被讲错的一对
// ---------------------------------------------------------------------------

console.log('\n--- 3. no-cache 与 no-store 的对照实验（本节是本示例的重点）---');

console.log('  先记住结论：');
console.log('    · no-store = 不 许 存          （连副本都不落盘，每次都回源拿完整的 200）');
console.log('    · no-cache = 可以存，但每次都要验证（走条件请求，命中时省下的是**响应体**）');

const noCacheCache = new MiniCache('浏览器');
console.log('\n  【实验 A】/api/profile 带 Cache-Control: no-cache');
for (let i = 1; i <= 2; i++) {
  const before = serverHitCount.get('/api/profile') ?? 0;
  const res = await noCacheCache.request(PORT, '/api/profile');
  const after = serverHitCount.get('/api/profile') ?? 0;
  console.log(`    第 ${i} 次：服务端收到的请求数 ${before} -> ${after}${after > before ? '（确实走了网络）' : '（没走网络）'}`);
  report(res, `  交付给业务代码的响应体 = ${JSON.stringify(res.body.slice(0, 24))}...`);
}
console.log('    解读：no-cache **确实把副本存下来了**（所以第二次能发 If-None-Match），');
console.log('          但它每次都要求验证，所以第二次仍然产生了一次网络往返 —— 只是响应体从');
console.log('          "完整的 JSON" 变成了"空无一物的 304"，省的是带宽不是延迟。');
console.log('          副本存了没？看缓存统计就知道：');
console.log(`          存了 ${noCacheCache.storedCount} 个副本，发出 ${noCacheCache.revalidateCount} 次条件请求，其中 ${noCacheCache.notModifiedCount} 次收到 304。`);

const noStoreCache = new MiniCache('浏览器');
console.log('\n  【实验 B】/api/token 带 Cache-Control: no-store');
for (let i = 1; i <= 2; i++) {
  const before = serverHitCount.get('/api/token') ?? 0;
  const res = await noStoreCache.request(PORT, '/api/token');
  const after = serverHitCount.get('/api/token') ?? 0;
  console.log(`    第 ${i} 次：服务端收到的请求数 ${before} -> ${after}${after > before ? '（确实走了网络）' : '（没走网络）'}`);
  report(res, `  交付给业务代码的响应体 = ${JSON.stringify(res.body.slice(0, 24))}...`);
}
console.log('    解读：no-store 下**副本数为 0**，第二次没有任何条件请求可发，');
console.log('          只能老老实实拿一份完整的 200 —— 它连"能不能存"都禁止了。');
console.log(`          存了 ${noStoreCache.storedCount} 个副本（应为 0），发出 ${noStoreCache.revalidateCount} 次条件请求（应为 0）。`);
console.log('\n  一句话对比：no-cache 是"存起来但每次对答案"，no-store 是"根本不给存"。');
console.log('  所以：含 token/身份证/一次性验证码的响应必须用 no-store；');
console.log('        入口 HTML 这种"内容随时可能变、但响应体很小"的用 no-cache。');

// ---------------------------------------------------------------------------
// 5. immutable：连用户刷新都不再验证
// ---------------------------------------------------------------------------

console.log('\n--- 4. immutable：刷新也不验证 ---');

const immCache = new MiniCache('浏览器');
console.log('  先请求两次带内容哈希的静态资源：');
await immCache.request(PORT, HASHED_APP_PATH);
console.log(`    第 1 次：${immCache.networkCount} 次网络请求`);
await immCache.request(PORT, HASHED_APP_PATH);
console.log(`    第 2 次：仍然是 ${immCache.networkCount} 次网络请求（强缓存命中，没有增加）`);
console.log('  现在模拟用户按下 Ctrl+R（普通刷新）—— 普通刷新会跳过强缓存，去问服务端"变了没"：');
const reload = await immCache.request(PORT, HASHED_APP_PATH, { forceReload: true });
report(reload, `  服务端这个路径累计收到 ${serverHitCount.get(HASHED_APP_PATH)} 次请求`);
console.log('    解读：普通刷新时浏览器仍然**不会**重新下载 body（否则每次刷新都重下几百 KB），');
console.log('          但会带条件请求头去确认一次。而 immutable 的作用是进一步省掉这次确认 ——');
console.log('          在 Chrome/Firefox 里，immutable 资源在刷新时直接从缓存读，连 304 往返都没有。');
console.log('          它成立的前提是：URL 里带内容哈希，内容一变 URL 就变（见后面"缓存失效策略"一节）。');
console.log('          注意：immutable 不是 RFC 标准指令（RFC 9111 里没有它），');
console.log('          它是被浏览器广泛实现的扩展，其他客户端可能不认识、直接忽略它。');

// ---------------------------------------------------------------------------
// 6. Expires：HTTP/1.0 的写法与它的时钟依赖
// ---------------------------------------------------------------------------

console.log('\n--- 5. Expires：绝对时间与"钟要准"的代价 ---');

const expiresCache = new MiniCache('浏览器');
console.log('  /legacy/old.css 用的是 HTTP/1.0 的写法：');
console.log('    Expires: <服务端当前时间 + 60 秒>   —— 一个**绝对时刻**，没有 max-age');
const legacyRes = await expiresCache.request(PORT, '/legacy/old.css');
console.log(`    收到的响应头：Expires = ${legacyRes.headers.expires}`);
console.log(`                 Date    = ${legacyRes.headers.date}（Node 自动加的）`);
console.log(`    服务端与客户端的钟一致时："还要 60 秒才过期"，缓存正常生效。`);
console.log(`      现在时钟一致 -> 新鲜吗？${expiresCache.peekFreshness('/legacy/old.css', 0)}`);

console.log('\n  现在让客户端的钟"不准"，看看会发生什么（这是 Expires 的致命伤）：');
// 客户端慢 10 分钟：它以为现在离过期还早得很
const slowFresh = expiresCache.peekFreshness('/legacy/old.css', -600_000);
// 客户端快 1 小时：它以为这份副本早就过期了
const fastFresh = expiresCache.peekFreshness('/legacy/old.css', 3_600_000);
console.log(`    客户端钟慢 10 分钟 -> 副本还新鲜吗？${slowFresh}   <- 它以为还能用很久，实际早已过期`);
console.log(`    客户端钟快 1 小时  -> 副本还新鲜吗？${fastFresh}   <- 每次都要回源，缓存形同虚设`);
console.log('    解读：Expires 让"能不能用"依赖两台机器的钟是否一致。NTP 校准、用户手动改时间、');
console.log('          虚拟机休眠后时间跳变……都可能让缓存行为突然改变。');
console.log('    对比 max-age：它是"相对时长"，客户端自己计时，');
console.log('          钟是快是慢都不影响判断 —— 这正是 RFC 9111 建议优先用 max-age 的原因。');
console.log('          （RFC 9111 §5.3：响应里同时有 max-age 和 Expires 时，**必须忽略 Expires**。）');
console.log('    另一个坑：如果 Expires 给的是过去的时间（比如服务器时间配错），副本一存下来就是过期的；');
console.log('    如果给的是 0 或非法值，同样会被当作"已经过期"。');

// ---------------------------------------------------------------------------
// 7. 协商缓存：一次完整的 304 往返
// ---------------------------------------------------------------------------

console.log('\n--- 6. 协商缓存：ETag + If-None-Match 的完整 304 往返 ---');

const docCache = new MiniCache('浏览器');
console.log('  /api/doc 是一个"内容会变"的资源，服务端同时给了 ETag 和 Last-Modified。');
console.log('  第 1 次请求（没有副本，无条件请求）：');
let docRes = await docCache.request(PORT, '/api/doc');
console.log('    发出去的请求头：', JSON.stringify(docRes.requestHeaders));
console.log(`    收到的响应（网络上状态码 = ${docRes.wireStatus}，带完整响应体）：`);
printHeaders(docRes.headers);
console.log(`    交付给业务代码：status=${docRes.status}，body=${JSON.stringify(docRes.body)}`);

console.log('\n  第 2 次请求（有副本，会带上 If-None-Match）：');
docRes = await docCache.request(PORT, '/api/doc');
console.log('    发出去的请求头：', JSON.stringify(docRes.requestHeaders), ' <- 注意这个条件头');
console.log(`    收到的响应（网络上状态码 = ${docRes.wireStatus}）：`);
printHeaders(docRes.headers);
console.log(`    交付给业务代码：status=${docRes.status}（沿用副本里的状态码），body=${JSON.stringify(docRes.body)}`);
report(docRes);
console.log('    注意 304 响应里**没有 Content-Length、也没有任何响应体字节**，');
console.log('    它只是一个"确认信封"：内容没变，你继续用本地的。');

console.log('\n  现在改一下服务端的内容（模拟一次发布），再看第 3 次请求：');
await rawRequest(PORT, { path: '/__doc/edit' }).then((x) => console.log(`    服务器：${x.body}`));
docRes = await docCache.request(PORT, '/api/doc');
console.log('    发出去的请求头：', JSON.stringify(docRes.requestHeaders));
console.log(`    服务端回了 ${docRes.wireStatus}，新响应体 = ${JSON.stringify(docRes.body)}`);
console.log('    解读：ETag 对不上 -> 服务端必须回 200 + 新内容，缓存随即被替换。');
console.log('          整个过程客户端一次都没有"猜"——它每次都在问，而服务端用最便宜的方式回答。');

console.log('\n  优先级规则：请求里同时有 If-None-Match 和 If-Modified-Since 时，');
console.log('          RFC 9110 规定服务端**必须忽略** If-Modified-Since，只看 ETag。');
const bothRes = await rawRequest(PORT, {
  path: '/api/doc',
  // 故意给一个"看起来很久以前"的 If-Modified-Since，ETag 却是对的
  headers: {
    'If-None-Match': computeEtag(JSON.stringify({ version: doc.version, content: doc.body }, null, 2)),
    'If-Modified-Since': new Date(0).toUTCString(),
  },
});
console.log(`    实测：ETag 匹配 + If-Modified-Since 很旧 -> 服务端回 ${bothRes.status}（304，按 ETag 判定）`);

// ---------------------------------------------------------------------------
// 8. Last-Modified 的两个硬伤
// ---------------------------------------------------------------------------

console.log('\n--- 7. Last-Modified 的硬伤：只到秒，"最后修改"也不等于"内容变化" ---');

console.log('  硬伤一：HTTP-date 的精度只到**秒**。');
console.log('  硬伤二：语义是"资源最后被修改的时间"，而不是"内容变了"——');
console.log('          重新部署一次（文件被重写、内容没变）就会让时间变新，白跑一次 200；');
console.log('          反过来，同一秒内改了两次内容，时间不变，服务端就会错误地说"没变"。');
console.log('  下面把"同一秒内改两次"这个 Bug 实跑出来：');
console.log('    （服务端的 /__doc/edit 故意不更新 Last-Modified，模拟两次改动落在同一秒）');

// 造一个"服务端没给 ETag、只给了 Last-Modified"的场景。
// 用 seed() 直接塞一份已经过期的副本进去，省掉一次真实请求（副本内容取自真实响应）。
const lmOnlyCache = new MiniCache('浏览器（只认 Last-Modified）');
const firstDoc = await rawRequest(PORT, { path: '/api/doc' });
lmOnlyCache.seed('/api/doc', {
  headers: firstDoc.headers,
  body: firstDoc.body,
  etag: null, // 关键：没有 ETag，只能退回用时间比较
  lastModified: firstDoc.headers['last-modified'],
  lifetimeMs: 0, // 已过期，逼它去验证
  staleSince: 60_000,
});

console.log(`  服务端文档当前的 Last-Modified = ${firstDoc.headers['last-modified']}`);
console.log(`  客户端手上那份副本的内容 = ${JSON.stringify(firstDoc.body)}`);

// 改内容。注意 /__doc/edit 故意**不更新** Last-Modified，模拟两次改动落在同一秒。
await rawRequest(PORT, { path: '/__doc/edit' });
const lmRes = await lmOnlyCache.request(PORT, '/api/doc');
console.log('  客户端带着 If-Modified-Since 去验证：');
console.log('    发出去的请求头：', JSON.stringify(lmRes.requestHeaders));
console.log(
  `    服务端回了 ${lmRes.wireStatus}${lmRes.wireStatus === 304 ? '  <- 错误！内容其实已经变了，却告诉客户端"没变"' : ''}`,
);
console.log(`    客户端最终交付给业务代码的内容 = ${JSON.stringify(lmRes.body)}  <- 旧内容`);

// 对照实验：带 ETag 的客户端在同一时刻做同一件事
const etagRes = await docCache.request(PORT, '/api/doc');
console.log('  同一个时刻，带 ETag 的客户端：');
console.log('    发出去的请求头：', JSON.stringify(etagRes.requestHeaders));
console.log(`    服务端回了 ${etagRes.wireStatus}，拿到的新内容 = ${JSON.stringify(etagRes.body)}  <- 新内容`);
console.log('  结论：ETag 精确（内容指纹，内容变则必变），Last-Modified 只到秒且语义是"时间"。');
console.log('        只要条件允许就**用 ETag**；Last-Modified 可以作为兼容旧客户端的补充，');
console.log('        但绝不能作为唯一验证器。很多静态服务器（含 nginx 默认配置）两者都给，正是这个道理。');
console.log('  （顺带一提：Last-Modified 也有它的用处——它对"资源根本没变"的判定成本极低，');
console.log('    不用读文件内容、不用算哈希，只比一个时间戳。）');

// ---------------------------------------------------------------------------
// 9. 弱 ETag
// ---------------------------------------------------------------------------

console.log('\n--- 8. 弱 ETag：W/ 表示"语义等价"，不是逐字节相同 ---');

const weakCache = new MiniCache('浏览器');
const weakRes = await weakCache.request(PORT, '/api/weak');
console.log(`  服务端给的 ETag = ${weakRes.headers.etag}   <- 前缀 W/ 就是"弱验证器"`);
const weakRes2 = await weakCache.request(PORT, '/api/weak');
console.log(`  再请求一次：发出 ${JSON.stringify(weakRes2.requestHeaders)}，网络上收到的状态码 = ${weakRes2.wireStatus}`);
console.log('  解读：弱比较会忽略 W/ 前缀，所以 W/"abc" 与 "abc" 被认为是同一个版本 ——');
console.log('        这正是我们想要的：内容"语义相同"就够了，不要求逐字节一致。');
console.log('  什么时候该用弱 ETag？当内容可能因为 gzip、空白字符、字段顺序等**无意义差异**');
console.log('  而字节不同，但语义等价时。反过来说，弱验证器**不能**用于范围请求（断点续传/');
console.log('  分片下载）—— 那要求每个字节都可寻址，必须用强验证器（不带 W/ 的 ETag）。');
console.log('  重要细节：If-None-Match 使用**弱比较**（忽略 W/），但 If-Range 与');
console.log('  If-Match 使用**强比较**。同一个 ETag 在两个头里的比较规则不同，这是常见误区。');

// ---------------------------------------------------------------------------
// 10. Vary：串缓存事故的实测
// ---------------------------------------------------------------------------

console.log('\n--- 9. Vary：漏写它就会发生串缓存事故 ---');

console.log('  场景：同一个 URL，服务端按 Accept-Encoding 返回不同变体（真实世界里是"压缩/未压缩"）。');
console.log('  正确做法：响应头写 Vary: Accept-Encoding，缓存键 = URL + Accept-Encoding 的值。');
console.log('  错误做法：缓存只看 URL —— 于是第二个客户端会拿到为第一个客户端生成的副本。');

const gzipClient = { 'Accept-Encoding': 'gzip' };
const identityClient = { 'Accept-Encoding': 'identity' };
const oneLine = (body) => body.replace(/\s+/g, ' ');

console.log('\n  【正确实现】缓存键包含 Vary 声明的请求头：');
const goodCache = new MiniCache('正规 CDN');
const g1 = await goodCache.request(PORT, '/api/vary-encoding', { reqHeaders: gzipClient });
console.log(`    客户端 A（Accept-Encoding: gzip）第 1 次 -> 网络上状态码 = ${g1.wireStatus}，拿到：${oneLine(g1.body)}`);
const i1 = await goodCache.request(PORT, '/api/vary-encoding', { reqHeaders: identityClient });
console.log(`    客户端 B（Accept-Encoding: identity）第 1 次 -> 网络上状态码 = ${i1.wireStatus}，拿到：${oneLine(i1.body)}`);
const g2 = await goodCache.request(PORT, '/api/vary-encoding', { reqHeaders: gzipClient });
console.log(`    客户端 A 第 2 次 -> ${SOURCE_TEXT[g2.source]}，拿到：${oneLine(g2.body)}`);
console.log(`    两个客户端各自命中属于自己的副本（回源 ${goodCache.networkCount} 次，强缓存命中 ${goodCache.hitCount} 次）。`);

console.log('\n  【错误实现】缓存键只看 URL，忽略了 Vary：');
const badCache = new MiniCache('漏写 Vary 的缓存');
await badCache.request(PORT, '/api/vary-encoding', { reqHeaders: gzipClient, ignoreVary: true });
console.log('    客户端 A（gzip）第 1 次 -> 回源 200，副本被存下来');
const badHit = await badCache.request(PORT, '/api/vary-encoding', { reqHeaders: identityClient, ignoreVary: true });
console.log(`    客户端 B（identity）第 1 次 -> ${SOURCE_TEXT[badHit.source]}（网络上状态码 = ${badHit.wireStatus}）`);
console.log(`    但 B 拿到的内容却是：${oneLine(badHit.body)}`);
console.log('    => 事故：B 拿到的是"为 gzip 客户端生成"的副本。真实世界里这可能是');
console.log('       一个它解不开的压缩体、一份属于别人的 CORS 头、或者一种它不认识的图片格式。');
console.log('       症状往往是"偶发、只对部分用户、刷新又好了"，极难排查。');

console.log('\n  同一类事故的第二个形态：CORS 漏写 Vary: Origin');
const corsCache = new MiniCache('漏写 Vary 的 CDN');
await corsCache.request(PORT, '/api/vary-origin', { reqHeaders: { Origin: 'https://a.example' }, ignoreVary: true });
const corsHit = await corsCache.request(PORT, '/api/vary-origin', { reqHeaders: { Origin: 'https://b.example' }, ignoreVary: true });
console.log(`    a.example 先访问，b.example 随后${corsHit.source === 'hit' ? '直接命中同一个副本' : '走网络'}，拿到的内容 = ${oneLine(corsHit.body)}`);
console.log('    => 如果服务端在这个响应里下发 `Access-Control-Allow-Origin: https://a.example`，');
console.log('       b.example 就会因为 CORS 校验失败而请求被浏览器拦下（或者更糟：CDN 缓存了');
console.log('       Allow-Origin: * 之外的宽泛值）。凡是响应内容依赖某个**请求头**，就必须 Vary 它。');
console.log('\n  该 Vary 哪些头？看"响应里哪些内容依赖它"：Accept-Encoding（压缩）、Origin（CORS）、');
console.log('  Accept-Language（多语言）、Cookie / Authorization（登录态）、User-Agent（极少见）。');
console.log('  注意 Vary: * 表示"永远不可复用"，等于关掉缓存；也不要 Vary 那些取值极多的头');
console.log('  （如 User-Agent），那会让缓存碎片化、命中率暴跌。');

// ---------------------------------------------------------------------------
// 11. Cache-Control 指令的组合语义
// ---------------------------------------------------------------------------

console.log('\n--- 10. Cache-Control 指令的组合语义 ---');

/** 直接向服务端要一份响应头，用真实的响应来做解析演示 */
async function fetchHeaders(path) {
  const res = await rawRequest(PORT, { path });
  return { cc: res.headers['cache-control'] ?? '(无)', headers: res.headers };
}

const directiveTable = [
  ['max-age=60', '新鲜期 60 秒（相对客户端自己的时钟）；与 s-maxage 同时出现时对浏览器生效'],
  ['s-maxage=1', '只对共享缓存（CDN/代理）生效，且优先级高于 max-age'],
  ['no-cache', '可以存，但每次复用前必须验证（≠ 不缓存！）'],
  ['no-store', '任何部分都不许存 —— 这才是真正的"不缓存"'],
  ['private', '只允许浏览器这类私有缓存存；CDN 必须回源'],
  ['public', '即使默认不可缓存（如带 Authorization 的请求）也允许存'],
  ['immutable', '新鲜期内连用户刷新都不验证（浏览器扩展，非 RFC 标准）'],
  ['must-revalidate', '一旦过期就必须验证，禁止使用过期副本（离线时宁愿报错）'],
  ['stale-while-revalidate=30', '过期后 30 秒内先返回旧副本，同时后台发起验证'],
  ['stale-if-error=600', '回源失败时 600 秒内可以继续用旧副本兜底'],
];

console.log('  指令'.padEnd(28) + '含义');
console.log('  ' + '-'.repeat(96));
for (const [name, meaning] of directiveTable) {
  console.log('  ' + name.padEnd(26) + meaning);
}

console.log('\n  用真实响应验证几条组合规则：');
const profile = await fetchHeaders('/api/profile');
console.log(`    /api/profile            Cache-Control: ${profile.cc}`);
const widget = await fetchHeaders('/shared/widget.js');
console.log(`    /shared/widget.js       Cache-Control: ${widget.cc}`);
const panel = await fetchHeaders('/admin/panel');
console.log(`    /admin/panel            Cache-Control: ${panel.cc}`);
const feed = await fetchHeaders('/api/feed');
console.log(`    /api/feed               Cache-Control: ${feed.cc}`);

console.log('\n  同一个 /shared/widget.js 在两种缓存里的新鲜期完全不同（s-maxage 优先于 max-age）：');
const cdnCache = new MiniCache('CDN（共享缓存）', { shared: true });
const browserCache = new MiniCache('浏览器（私有缓存）');
await cdnCache.request(PORT, '/shared/widget.js');
await browserCache.request(PORT, '/shared/widget.js');
// 用"时间往后拨 5 秒"来检查新鲜度
console.log(`    CDN 侧（s-maxage=1）    ：5 秒后还新鲜吗？${cdnCache.peekFreshness('/shared/widget.js', 5000)}  <- 已过期，必须回源验证`);
console.log(`    浏览器侧（max-age=600）：5 秒后还新鲜吗？${browserCache.peekFreshness('/shared/widget.js', 5000)}  <- 仍然新鲜`);
console.log('    这正是分层的意义：CDN 上过期快（内容更新能及时扩散到所有用户），');
console.log('    浏览器上有效期长（用户重复访问同一个站点时零网络）。');

console.log('\n  private 的效果（CDN 不许存）：');
const cdnPrivate = new MiniCache('CDN（共享缓存）', { shared: true });
const privRes1 = await cdnPrivate.request(PORT, '/admin/panel');
const privRes2 = await cdnPrivate.request(PORT, '/admin/panel');
console.log(`    CDN 第一次：${SOURCE_TEXT[privRes1.source]}；第二次：${SOURCE_TEXT[privRes2.source]}`);
console.log(`    副本数 = ${cdnPrivate.storedCount}（应为 0）—— private 让 CDN 完全不能存，每次都回源。`);
console.log('    如果这个页面是带权限的（比如管理员列表），漏写 private 就可能把 A 的数据缓存给 B。');

console.log('\n  stale-while-revalidate 的语义（用响应头说明，不模拟时间流逝）：');
console.log(`    /api/feed 的头是 "${feed.cc}"：`);
console.log('      0 ~ 1 秒    ：新鲜期，直接用副本，不发请求；');
console.log('      1 秒 ~ 31 秒：**已经过期但可以先用**——立刻返回旧副本给用户，');
console.log('                    同时在后台发起验证请求，下一次访问就是新的了；');
console.log('      31 秒之后   ：必须同步验证，用户要等这一次往返。');
console.log('    它把"过期"从"用户必须等"变成了"用户先用旧的、系统自己更新"，');
console.log('    非常适合不那么讲究实时性、但很怕慢的接口（列表页、推荐位、配置下发）。');
console.log('    注意：它牺牲的是**一致性**——用户可能看到 30 秒前的数据，业务上能否接受要先想清楚。');

// ---------------------------------------------------------------------------
// 12. 缓存失效：内容哈希文件名为什么最可靠
// ---------------------------------------------------------------------------

console.log('\n--- 11. 缓存失效策略：让 URL 跟着内容变 ---');

console.log('  难处在于：缓存一旦存下来，服务端就**没有**可靠的"主动清除"手段。');
console.log('  几个常见策略，从最差到最好：');
console.log('    ① 靠短 max-age 自己过期 —— 简单，但用户长年累月反复回源（拿不准就配 5 分钟）');
console.log('       · 换来的代价：任何一次改动最长要等 max-age 才生效');
console.log('    ② 手动改文件名（app.js -> app_v2.js）—— 有效，但靠人肉维护，必然会漏');
console.log('    ③ 查询串版本号（app.js?v=2）—— 有效，但有些 CDN / 代理会**刻意忽略**查询串，');
console.log('       而且每次发布都要改所有引用它 HTML 的地方（HTML 本身又必须不被缓存）');
console.log('    ④ **内容哈希文件名**（app.3f2a1c9b7d4e.js）—— 最可靠，本示例采用的做法');
console.log(`    本示例的静态资源路径就是内容哈希：${HASHED_APP_PATH}`);
console.log('      好处 1：URL 与内容**一一对应**，内容变 -> 哈希变 -> URL 变 -> 必然是新请求，');
console.log('              永远不会"用户拿到旧版本"；');
console.log('      好处 2：既然 URL 变了，旧 URL 上的内容永远不会再变，就可以给它配');
console.log('              `max-age=31536000, immutable`（一年，连刷新都不验证），缓存效率拉满；');
console.log('      好处 3：发布时旧文件与新文件可以共存，回滚只要换 HTML 里的引用即可。');
console.log('    这个策略的关键前提：**入口 HTML 必须不能被长时间缓存**（no-cache 或很短的 max-age），');
console.log('    否则 HTML 一直指着旧的哈希文件名，用户就永远看不到新版本 ——');
console.log('    这也是"HTML 用 no-cache，静态资源用哈希名 + 一年 immutable"成为行业标准的原因。');

// ---------------------------------------------------------------------------
// 13. HTTP/1.1 的队头阻塞与 HTTP/2 的多路复用
// ---------------------------------------------------------------------------

console.log('\n--- 12. 一句话说清 HTTP/1.1 队头阻塞与 HTTP/2 多路复用 ---');
console.log('  HTTP/1.1 在一条 TCP 连接上**同一时刻只能有一个请求在飞**：前一个响应没回来，');
console.log('  后面排队的请求只能干等（这就是队头阻塞，Head-of-Line Blocking），');
console.log('  浏览器只好对同一域名开出约 6 条并发连接来缓解 —— 但连接数本身又是新瓶颈，');
console.log('  且每个连接都要重复握手、各自做一遍拥塞控制。');
console.log('  HTTP/2 把一条连接切成多个**流（stream）**，给每个请求/响应分帧、交错发送，');
console.log('  于是几十上百个请求可以真正并行跑在一条连接上，不再互相堵；');
console.log('  顺带还有头部压缩（HPACK）与服务器推送（已废弃但值得知道）。');
console.log('  但 HTTP/2 仍在 TCP 之上：一旦底层**丢包**，TCP 保证顺序的机制会让所有流一起等，');
console.log('  这叫 TCP 层队头阻塞 —— 它由 QUIC / HTTP/3 用"每条流独立重传"来根治。');
console.log('  缓存视角的补充：HTTP/2 与 HTTP/3 **不改变**缓存语义，本文讲的每一条规则照旧适用。');

// ---------------------------------------------------------------------------
// 14. 收尾：服务器统计 + 关闭
// ---------------------------------------------------------------------------

console.log('\n--- 13. 服务端统计与关闭 ---');

console.log('  服务端实际收到的请求数（按路径）：');
for (const [path, count] of [...serverHitCount.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(count).padStart(3)} 次  ${path}`);
}
console.log('  自己数一数就能对上：缓存命中的那几次，这里根本没有记录 —— 这就是"省掉网络往返"的硬证据。');

// 关闭：close() 只是不再接受新连接，closeAllConnections() 断开已有连接。
// 本示例的客户端用的是 `agent: false`（一次性连接），所以理论上不会有残留 socket；
// 但服务端侧仍可能有一两个连接处于关闭流程中，两个都调上最稳妥（见 15_http_server_client.js 的陷阱 7）。
server.close();
server.closeAllConnections();

const closed = await Promise.race([
  once(server, 'close').then(() => 'closed'),
  new Promise((resolve) => setTimeout(() => resolve('timeout'), 500)),
]);
console.log(
  closed === 'closed'
    ? "  收到 'close' 事件，服务器已完全关闭，端口已释放。"
    : '  等待 close 事件超时（连接释放较慢），但监听套接字已关闭。',
);

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
