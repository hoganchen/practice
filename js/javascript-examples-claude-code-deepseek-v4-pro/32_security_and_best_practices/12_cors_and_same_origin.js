/**
 * ============================================================================
 * 知识点：同源策略与 CORS 的安全含义 —— 预检、凭证、错误配置的后果
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/11_csrf.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - 同源策略（Same-Origin Policy, SOP）：浏览器的一条**核心安全边界**。
 *      它规定：来自 A 源的文档/脚本，默认**不能读取**来自 B 源的响应内容
 *      （不能读 DOM、不能读 fetch/XHR 的响应体、不能读 localStorage 等）。
 *      注意措辞：是"不能读"，不是"不能发" —— 这一条是理解 CORS 与 CSRF 的关键。
 *    - CORS（Cross-Origin Resource Sharing）：一套**由服务端用响应头来放宽同源策略**
 *      的机制。要强调：CORS 是"放宽"机制，不是"防护"机制；
 *      **它管的是"浏览器肯不肯把响应交给 JS"，不是"服务端肯不肯处理这个请求"**。
 *
 *    同源的判定：协议 + 域名 + 端口，三者完全相同才算同源。
 *      https://a.com          vs https://a.com:443   —— 同源（默认端口可省略）
 *      http://a.com           vs https://a.com       —— 不同源（协议不同）
 *      https://a.com          vs https://api.a.com   —— 不同源（域名不同，子域也算不同）
 *      https://a.com          vs https://a.com:8443  —— 不同源（端口不同）
 *    要特别注意：**同源策略与"站点（site）"不是一回事**。Cookie 的 SameSite 用的是
 *    "可注册域（eTLD+1）"，a.com 与 api.a.com 属于同一个 site，但不同 origin。
 *    所以 SameSite Cookie 挡不住子域之间的 CSRF；而 CORS 是按 origin 判定的。
 *
 * 2. 为什么需要（真实攻击场景）
 *    如果没有任何同源限制：
 *      (a) 你在攻击者的页面里写 `fetch('https://bank.com/api/accounts')`，
 *          浏览器自动带上你的 Cookie，脚本读到你的余额、账单、身份证号 —— 这是"读取"型攻击。
 *      (b) 攻击者页面可以直接开 iframe 打开 bank.com，然后用脚本读它的 DOM
 *          （读你输入的密码框内容、点它的按钮）—— 这是"点击劫持 + 表单窃取"。
 *    同源策略把 (a)(b) 都堵死了：请求可以发出去（所以 CSRF 依然存在），但**响应读不到**。
 *
 *    CORS 出现是因为同源策略太严：前后端分离后 API 在 api.example.com，
 *    页面在 www.example.com，正常业务也需要跨源读取。于是服务端可以用响应头
 *    显式声明"我允许某某源读我"。
 *
 * 3. 核心语法要点
 *
 *    (1) 简单请求 vs 预检请求
 *        满足**全部**以下条件的是"简单请求"，浏览器直接发出：
 *          - 方法属于 GET / HEAD / POST
 *          - 请求头只包含 CORS 安全列表头（Accept、Accept-Language、
 *            Content-Language、Content-Type、Range 等）
 *          - Content-Type 只允许 application/x-www-form-urlencoded、
 *            multipart/form-data、text/plain（注意：**没有 application/json**！）
 *        不满足的（PUT/DELETE、带 X-Token 头、Content-Type: application/json）
 *        会先自动发一个 **OPTIONS 预检请求**，询问服务端是否允许，允许才发真实请求。
 *        预检请求里会带：
 *          Origin: https://www.example.com
 *          Access-Control-Request-Method: PUT
 *          Access-Control-Request-Headers: content-type, x-token
 *        服务端必须回以对应的 Access-Control-Allow-* 头，否则真实请求不会发出。
 *
 *    (2) 响应头
 *          - Access-Control-Allow-Origin（ACAO）：允许的源。可以是具体源，也可以是 `*`。
 *          - Access-Control-Allow-Credentials（ACAC）：是否允许带凭证（Cookie / HTTP 认证）。
 *            取值只有 `true`（小写）或不写。**`*` 与 `true` 不能同时用**：
 *            规范禁止，浏览器会直接拒绝。想带凭证就必须回具体源。
 *          - Access-Control-Allow-Methods：预检时声明允许的方法。
 *          - Access-Control-Allow-Headers：预检时声明允许的请求头。
 *          - Access-Control-Expose-Headers：JS 默认只能读到 CORS 安全列表响应头
 *            （Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma），
 *            想让 JS 读到 X-Total-Count 这类自定义响应头必须显式暴露。
 *          - Access-Control-Max-Age：预检结果的缓存秒数（浏览器会跳过重复预检）。
 *          - Vary: Origin：**极易被忽略但很关键**。如果 ACAO 是按 Origin 动态生成的，
 *            必须加 `Vary: Origin`，否则 CDN / 反向代理会把给 A 源的响应缓存下来发给 B 源，
 *            造成跨源数据泄漏。
 *
 *    (3) 常见错误配置与安全后果
 *        - `ACAO: *` + `ACAC: true`：浏览器直接拒绝（不生效），属于常见误配。
 *        - **动态反射 Origin**：`ACAO = 请求里的 Origin`（为了省事），
 *          一旦同时开了 `ACAC: true`，等于**把同源策略关了**：任何网站都能带着用户 Cookie
 *          读取你的接口数据。这是最危险、也最常见的 CORS 漏洞。
 *        - 白名单用前缀/子串匹配：`origin.startsWith('https://trusted.com')` 会被
 *          `https://trusted.com.evil.net` 绕过（和 17 篇的路径前缀漏洞同源思维）。
 *        - 白名单里写了 `null`：沙箱 iframe、file:// 页面、部分重定向场景的 Origin 就是 `null`，
 *          允许 `null` 等于允许任何人在沙箱里读你的数据。
 *        - 预检全放行（任何 Origin 都回 200 + 全量 Allow-Methods/Headers），
 *          再配合反射 Origin —— 攻击面彻底打开。
 *
 *    (4) CORS 不是访问控制（最重要的一条）
 *        CORS 是**浏览器的自律**。服务端该处理的请求早就处理完了，
 *        只是浏览器不把响应交给发起方的 JS 而已。
 *        证据：本文件小节 5 会演示 —— 一个被 CORS 拦下的 DELETE 请求，
 *        服务端的数据**已经被删掉了**。
 *        所以：**服务端必须自己鉴权**，绝不能依赖"反正跨源读不到"。
 *
 *    (5) 与 CSRF 的关系
 *        - 同源策略只挡"读"，不挡"发" → 所以 CSRF 才存在。
 *        - 反过来，CORS 预检能挡"发"（非简单请求根本发不出去），
 *          所以"要求自定义头"是一种 CSRF 防御（见 11 篇小节 5）。
 *        - 但如果你反射 Origin + 允许凭证，你就同时**打开了读取型攻击**和**CSRF**。
 *
 * 4. 常见陷阱
 *    - 以为"接口支持 CORS 就等于安全"：CORS 只影响浏览器，攻击者用 curl / 服务端请求
 *      完全不受约束（这也是 SSRF 的土壤，见 17 篇）。
 *    - 前后端联调时为了省事写成 `ACAO: *` 然后忘了改，上线后带着凭证的接口全裸。
 *    - 用 `*` 却发现带 Cookie 的请求失败，于是改成反射 Origin —— 从一个小问题变成大漏洞。
 *    - 只配了预检响应头（OPTIONS）却忘了给真实响应也加 ACAO。
 *    - 忘了 `Vary: Origin`，在 CDN 后面出现"张三的响应被李四拿到"。
 *    - 用 `document.domain` 或 `postMessage` 临时绕同源策略，忘了 postMessage 必须校验
 *      `event.origin` 与 `event.source`（否则任何站点都能给它发消息）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/12_cors_and_same_origin.js
 *
 * 【预期输出】
 *   起一个本地 API 服务（127.0.0.1，端口随机），用内置的"浏览器 CORS 引擎"（模拟真实浏览器
 *   的判定规则：预检、凭证、暴露头、预检缓存）逐条演示正确与错误配置的行为差异，
 *   并演示"CORS 拦下了响应，但服务端已经把数据改了"。全程不发一个外部请求，退出码 0。
 * ============================================================================
 */

import http from 'node:http';

// ============================================================================
// 小节 1：同源判定 —— 协议 + 域名 + 端口
// ============================================================================
console.log('--- 1. 同源的判定：协议 + 域名 + 端口，三者全同 ---');

/**
 * 判断两个 URL 是否同源。
 * 用 URL 解析可以自动处理"默认端口省略"的问题（https 默认 443、http 默认 80）。
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function isSameOrigin(a, b) {
  const ua = new URL(a);
  const ub = new URL(b);
  return ua.protocol === ub.protocol && ua.hostname === ub.hostname && ua.port === ub.port;
}

const originCases = [
  ['https://a.com/x', 'https://a.com/y', '同路径不同 → 同源'],
  ['https://a.com', 'https://a.com:443', '默认端口省略 → 同源'],
  ['http://a.com', 'https://a.com', '协议不同 → 不同源'],
  ['https://a.com', 'https://api.a.com', '子域也算不同源'],
  ['https://a.com', 'https://a.com:8443', '端口不同 → 不同源'],
  ['https://a.com', 'https://a.com.evil.net', '后缀欺骗 → 不同源'],
];
for (const [x, y, note] of originCases) {
  console.log(`  ${isSameOrigin(x, y) ? '同源  ' : '不同源'} | ${x} vs ${y}  (${note})`);
}

console.log('\n  容易混淆的一点：Cookie 的 SameSite 用的是"站点"（eTLD+1），不是"源"。');
console.log('    https://a.com 与 https://api.a.com → 不同源，但属于同一个 site。');
console.log('    所以 SameSite Cookie 挡不住子域之间的 CSRF，而 CORS 是按 origin 严格判定的。');

console.log('\n  同源策略到底保护什么（记住：只挡"读"，不挡"发"）：');
for (const [what, blocked] of [
  ['用 fetch/XHR 读取跨源响应体', true],
  ['读取跨源 iframe 的 DOM', true],
  ['读取跨源站点的 localStorage / IndexedDB', true],
  ['读取跨源图片的像素数据（canvas getImageData）', true],
  ['**发送**一个跨源请求（表单 / img / fetch）', false],
  ['加载跨源的图片 / 脚本 / 样式（但不给读内容）', false],
]) {
  console.log(`    ${blocked ? '被拦住' : '允许  '}：${what}`);
}

// ============================================================================
// 小节 2：简单请求 vs 预检请求的判定规则
// ============================================================================
console.log('\n--- 2. 简单请求 vs 预检请求 ---');

const CORS_SAFE_HEADERS = new Set([
  'accept',
  'accept-language',
  'content-language',
  'content-type',
  'range',
]);
const SIMPLE_CONTENT_TYPES = new Set([
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
]);

/**
 * 判断一个请求是否属于"简单请求"（不需要预检）。
 * 三个条件必须同时满足，任一不满足就要预检。
 * @param {string} method
 * @param {Record<string,string>} headers
 * @returns {{simple:boolean, reason:string}}
 */
function classifyRequest(method, headers) {
  if (!['GET', 'HEAD', 'POST'].includes(method.toUpperCase())) {
    return { simple: false, reason: `方法 ${method} 不在 GET/HEAD/POST 内` };
  }
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase();
    if (!CORS_SAFE_HEADERS.has(key)) {
      return { simple: false, reason: `请求头 ${k} 不在安全列表内` };
    }
    if (key === 'content-type' && !SIMPLE_CONTENT_TYPES.has(String(v).toLowerCase())) {
      return { simple: false, reason: `Content-Type=${v} 不是简单值` };
    }
  }
  return { simple: true, reason: '是简单请求，浏览器直接发出' };
}

for (const [method, headers] of [
  ['GET', {}],
  ['POST', { 'Content-Type': 'application/x-www-form-urlencoded' }],
  ['POST', { 'Content-Type': 'application/json' }],
  ['POST', { 'Content-Type': 'text/plain' }],
  ['PUT', { 'Content-Type': 'application/json' }],
  ['GET', { Authorization: 'Bearer xxx' }],
  ['DELETE', {}],
]) {
  const r = classifyRequest(method, headers);
  const desc = `${method} ${headers['Content-Type'] ? `Content-Type=${headers['Content-Type']} ` : ''}${headers.Authorization ? 'Authorization=...' : ''}`;
  console.log(`  ${r.simple ? '简单请求（无预检）' : '需要预检        '} | ${desc.trim()}`);
  console.log(`      ${r.reason}`);
}
console.log('  划重点：`Content-Type: application/json` 会触发预检；');
console.log('          但 `text/plain` 不会 —— 所以服务端绝不能只看有 CORS 就放心，');
console.log('          必须自己校验 Content-Type（11 篇讲过这个坑）。');

// ============================================================================
// 小节 3：本地 API 服务（每种 CORS 配置一个路由）
// ============================================================================
console.log('\n--- 3. 启动本地 API 服务（多种 CORS 配置各占一个路由） ---');

/** 服务端状态：用来证明"被 CORS 拦下的请求，服务端其实已经执行了" */
const serverState = {
  records: ['r1', 'r2', 'r3'],
  requestLog: [],
  preflightCount: 0,
  actualCount: 0,
};

const ALLOWED_ORIGINS = new Set(['https://app.example.com']);

/**
 * 按路由决定要下发哪些 CORS 响应头 —— 故意覆盖多种配置，好的坏的都有。
 * @param {string} pathname
 * @param {string|undefined} origin
 * @returns {Record<string,string>}
 */
function corsHeadersFor(pathname, origin) {
  switch (pathname) {
    // ① 公共只读接口：通配符，无凭证 —— 这是 `*` 的正确用法
    case '/api/public':
      return { 'Access-Control-Allow-Origin': '*' };

    // ② 常见误配：通配符 + 允许凭证 —— 浏览器会直接拒绝
    case '/api/bad-wildcard-credential':
      return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      };

    // ③ 最危险：无条件反射 Origin + 允许凭证（等于关闭同源策略）
    case '/api/reflect':
      return {
        'Access-Control-Allow-Origin': origin || 'null',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      };

    // ④ 正确做法：严格白名单 + 明确的方法/头 + Vary: Origin
    case '/api/proper':
      return {
        'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://app.example.com',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type, X-Token',
        'Access-Control-Max-Age': '600',
        'Vary': 'Origin',
        // 自定义响应头默认 JS 读不到，必须显式暴露
        'Access-Control-Expose-Headers': 'X-Total-Count',
        'X-Total-Count': String(serverState.records.length),
      };

    // ⑤ 前缀匹配白名单（漏洞写法）：trusted.com.evil.net 能绕过
    case '/api/prefix-whitelist': {
      const prefixOk = typeof origin === 'string' && origin.startsWith('https://trusted.com');
      return {
        'Access-Control-Allow-Origin': prefixOk ? origin : 'null',
        'Access-Control-Allow-Credentials': 'true',
      };
    }

    // ⑥ 允许 null 源（沙箱 iframe / file:// 的 Origin 就是 null）
    case '/api/allow-null':
      return {
        'Access-Control-Allow-Origin': 'null',
        'Access-Control-Allow-Credentials': 'true',
      };

    // ⑦ 真正的写操作接口：用于演示"CORS 拦下了响应，但数据已经改了"。
    //    注意这里只允许 app.example.com —— 恶意站点读不到响应。
    case '/api/records':
    case '/api/records/delete':
      return { 'Access-Control-Allow-Origin': 'https://app.example.com' };

    default:
      return {};
  }
}

let server;
const port = await new Promise((resolve) => {
  server = http.createServer((req, res) => {
    const origin = req.headers.origin;
    const url = new URL(req.url, 'http://127.0.0.1');
    const cors = corsHeadersFor(url.pathname, origin);
    const isPreflight = req.method === 'OPTIONS' && req.headers['access-control-request-method'];

    serverState.requestLog.push({
      method: req.method,
      path: url.pathname,
      origin: origin ?? '(无)',
      preflight: Boolean(isPreflight),
    });

    if (isPreflight) {
      serverState.preflightCount++;
      // 预检请求：这些头描述"真实请求想用什么方法和头"
      const wantedMethod = req.headers['access-control-request-method'];
      const wantedHeaders = req.headers['access-control-request-headers'];
      const allowedMethods = (cors['Access-Control-Allow-Methods'] || 'GET, HEAD, POST').split(',').map((s) => s.trim());
      const methodOk = allowedMethods.includes(wantedMethod) || cors['Access-Control-Allow-Methods'] === undefined;
      const headersOk =
        cors['Access-Control-Allow-Headers'] === '*' ||
        cors['Access-Control-Allow-Headers'] === undefined ||
        !wantedHeaders ||
        String(wantedHeaders)
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .every((h) =>
            String(cors['Access-Control-Allow-Headers'])
              .toLowerCase()
              .split(',')
              .map((s) => s.trim())
              .includes(h)
          );

      if (!methodOk || !headersOk) {
        // 预检不通过：真实请求根本不会被发出（这是"发"层面的拦截）
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8', Vary: 'Origin' });
        return res.end('预检被拒绝');
      }
      res.writeHead(204, cors);
      return res.end();
    }

    if (url.pathname === '/api/records/delete' && req.method === 'POST') {
      // 关键演示：服务端先无条件执行了写操作，之后才轮到浏览器做 CORS 判定。
      // 因为这是"简单请求"（text/plain 的 POST），浏览器不会预检，请求一定会发出。
      const removed = serverState.records.pop();
      serverState.actualCount++;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...cors });
      return res.end(JSON.stringify({ deleted: removed, remaining: serverState.records.length }));
    }

    if (url.pathname === '/api/records') {
      serverState.actualCount++;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...cors });
      return res.end(JSON.stringify({ records: serverState.records }));
    }

    serverState.actualCount++;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', ...cors });
    res.end(JSON.stringify({ path: url.pathname, secret: '用户隐私数据（只有同源或 CORS 放行才能读到）' }));
  });
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const apiOrigin = `http://127.0.0.1:${port}`;
console.log(`  API 服务已启动：${apiOrigin}（127.0.0.1，随机端口，不对外）`);

// ============================================================================
// 小节 4：内置一个"浏览器 CORS 引擎"，逐条模拟真实浏览器判定
// ============================================================================
console.log('\n--- 4. 用内置的"浏览器 CORS 引擎"模拟真实判定 ---');
console.log('  说明：Node 的 fetch 不做 CORS 检查（没有页面、没有 origin 概念），');
console.log('        所以下面按 Fetch 规范手写了一个最小实现，专门用来演示浏览器的判定逻辑。');

/**
 * 极小的浏览器 CORS 引擎。
 * 它实现的是**浏览器侧**的三个动作：
 *   1) 需要预检时先发 OPTIONS，并校验预检响应；
 *   2) 预检通过后才发真实请求；
 *   3) 校验真实响应的 ACAO / ACAC，决定 JS 能否读到响应体。
 * 它不做任何网络策略，只是"浏览器肯不肯把结果交给 JS"的模拟。
 * @param {object} opts
 * @param {string} opts.pageOrigin 发起请求的页面的源
 * @param {string} opts.url
 * @param {string} [opts.method]
 * @param {Record<string,string>} [opts.headers]
 * @param {boolean} [opts.credentials] 是否携带 Cookie
 * @param {Map<string, number>} [opts.preflightCache]
 * @returns {Promise<{sent:boolean, visible:boolean, status?:number, body?:string, reason:string}>}
 */
async function browserCorsFetch(opts) {
  const {
    pageOrigin,
    url,
    method = 'GET',
    headers = {},
    credentials = false,
    preflightCache = new Map(),
  } = opts;

  const { simple, reason } = classifyRequest(method, headers);

  // ---- 步骤 1：必要时先发预检 ----
  if (!simple) {
    const cacheKey = `${pageOrigin}|${method}|${url}`;
    const cached = preflightCache.get(cacheKey);
    if (cached && cached > Date.now()) {
      console.log(`    [浏览器] 预检结果命中缓存（Max-Age 还剩 ${Math.round((cached - Date.now()) / 1000)}s），跳过 OPTIONS`);
    } else {
      const preflightRes = await fetch(url, {
        method: 'OPTIONS',
        headers: {
          Origin: pageOrigin,
          'Access-Control-Request-Method': method,
          'Access-Control-Request-Headers': Object.keys(headers).join(', ').toLowerCase(),
        },
      });
      const acao = preflightRes.headers.get('access-control-allow-origin');
      const acac = preflightRes.headers.get('access-control-allow-credentials');
      const allowMethods = preflightRes.headers.get('access-control-allow-methods') ?? '';
      const maxAge = Number(preflightRes.headers.get('access-control-max-age') ?? 0);
      console.log(
        `    [浏览器] 预检 OPTIONS ${url} -> ${preflightRes.status}；` +
          `ACAO=${acao ?? '(无)'} Methods=${allowMethods || '(无)'}`
      );

      // 预检响应本身的 CORS 校验
      if (!preflightRes.ok) {
        return { sent: false, visible: false, reason: '预检未通过（服务端返回非 2xx），真实请求不会发出' };
      }
      if (!acao || (acao !== '*' && acao !== pageOrigin)) {
        return { sent: false, visible: false, reason: `预检的 ACAO=${acao ?? '(无)'} 与页面源 ${pageOrigin} 不匹配` };
      }
      if (credentials && acao === '*' && acac === 'true') {
        return { sent: false, visible: false, reason: '预检响应 `ACAO: *` 与 `ACAC: true` 同用，浏览器拒绝' };
      }
      if (credentials && acac !== 'true') {
        return { sent: false, visible: false, reason: '带凭证的请求要求预检响应包含 `ACAC: true`' };
      }
      if (!allowMethods.split(',').map((s) => s.trim()).includes(method)) {
        return { sent: false, visible: false, reason: `预检未允许方法 ${method}（Allow-Methods=${allowMethods}）` };
      }
      if (maxAge > 0) preflightCache.set(cacheKey, Date.now() + maxAge * 1000);
    }
  } else {
    console.log(`    [浏览器] ${reason}`);
  }

  // ---- 步骤 2：发真实请求（注意：这一步一定会发生，除非预检没过） ----
  const res = await fetch(url, {
    method,
    headers: { ...headers, Origin: pageOrigin },
    redirect: 'manual',
  });
  const body = await res.text();

  // ---- 步骤 3：校验真实响应的 CORS 头，决定 JS 能否读到 ----
  const acao = res.headers.get('access-control-allow-origin');
  const acac = res.headers.get('access-control-allow-credentials');

  if (!acao) {
    return { sent: true, visible: false, status: res.status, reason: '响应缺少 Access-Control-Allow-Origin，JS 读不到响应体' };
  }
  if (acao === '*' && credentials) {
    return { sent: true, visible: false, status: res.status, reason: '`ACAO: *` 不允许与凭证一起使用，浏览器拒绝把响应交给 JS' };
  }
  if (acao !== '*' && acao !== pageOrigin) {
    return { sent: true, visible: false, status: res.status, reason: `ACAO=${acao} 与页面源 ${pageOrigin} 不一致` };
  }
  if (credentials && acac !== 'true') {
    return { sent: true, visible: false, status: res.status, reason: '带了凭证但响应没有 `ACAC: true`' };
  }
  return { sent: true, visible: true, status: res.status, body, reason: 'CORS 校验通过，JS 可以读到响应' };
}

/** 打印一次 CORS 请求的结论 */
async function demo(label, opts, expect) {
  console.log(`\n  ▶ ${label}`);
  const r = await browserCorsFetch(opts);
  console.log(`    [结果] 请求是否发出=${r.sent}，JS 能否读到响应=${r.visible}`);
  console.log(`    [原因] ${r.reason}`);
  if (r.visible) console.log(`    [响应] ${r.body}`);
  if (expect) console.log(`    [预期] ${expect}`);
  return r;
}

const EVIL = 'https://evil.example.net';
const GOOD = 'https://app.example.com';

console.log('\n  ① 通配符 ACAO（无凭证）—— 这是 `*` 的正确用法');
await demo(
  `恶意站点读取 /api/public（无凭证）`,
  { pageOrigin: EVIL, url: `${apiOrigin}/api/public` },
  '放行：公共数据本来就该人人可读'
);

console.log('\n  ② 通配符 ACAO + 允许凭证 —— 浏览器直接拒绝');
await demo(
  `恶意站点携带 Cookie 读取 /api/bad-wildcard-credential`,
  { pageOrigin: EVIL, url: `${apiOrigin}/api/bad-wildcard-credential`, credentials: true },
  '拒绝：规范禁止 `*` 与 `ACAC: true` 同用'
);

console.log('\n  ③ 动态反射 Origin + 允许凭证 —— 等于关闭同源策略（最危险）');
await demo(
  `恶意站点携带 Cookie 读取 /api/reflect`,
  { pageOrigin: EVIL, url: `${apiOrigin}/api/reflect`, credentials: true },
  '放行：攻击者的站点能读到你的隐私数据 —— 这是真实存在的严重漏洞'
);

console.log('\n  ④ 正确的白名单配置');
await demo(
  `自己的应用读取 /api/proper`,
  { pageOrigin: GOOD, url: `${apiOrigin}/api/proper`, credentials: true },
  '放行'
);
await demo(
  `恶意站点尝试同一个接口`,
  { pageOrigin: EVIL, url: `${apiOrigin}/api/proper`, credentials: true },
  '拒绝：不在白名单内'
);

console.log('\n  ⑤ 前缀匹配白名单的漏洞：https://trusted.com.evil.net 能绕过');
await demo(
  `攻击者注册 trusted.com.evil.net 后读取 /api/prefix-whitelist`,
  { pageOrigin: 'https://trusted.com.evil.net', url: `${apiOrigin}/api/prefix-whitelist`, credentials: true },
  '被绕过：startsWith("https://trusted.com") 对这个源返回 true'
);
console.log('    正确写法：必须用【完整字符串相等】或用 `new URL(o).origin === o` 归一化后比较，');
console.log('    绝不能 startsWith / includes / 正则未锚定。');

console.log('\n  ⑥ 白名单里写 null 的危险');
await demo(
  `沙箱 iframe（Origin: null）读取 /api/allow-null`,
  { pageOrigin: 'null', url: `${apiOrigin}/api/allow-null`, credentials: true },
  '放行：任何攻击者只要把页面放进 sandbox iframe，Origin 就是 null'
);

// ============================================================================
// 小节 5：预检完整流程 + 预检缓存
// ============================================================================
console.log('\n--- 5. 完整预检流程（PUT + 自定义头 + application/json） ---');
const cache = new Map();
await demo(
  `带自定义头 X-Token 与 JSON 的 POST（必然触发预检）`,
  {
    pageOrigin: GOOD,
    url: `${apiOrigin}/api/proper`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Token': 'abc' },
    credentials: true,
    preflightCache: cache,
  },
  '预检 204 通过，然后真实请求发出'
);
console.log('\n  紧接着发第二次同样的请求 —— 观察预检缓存（Access-Control-Max-Age）生效：');
await demo(
  `重复同样的请求（应命中预检缓存）`,
  {
    pageOrigin: GOOD,
    url: `${apiOrigin}/api/proper`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Token': 'abc' },
    credentials: true,
    preflightCache: cache,
  },
  '不再发 OPTIONS，直接用缓存判定'
);

await demo(
  `请求一个预检未允许的方法（PUT）`,
  {
    pageOrigin: GOOD,
    url: `${apiOrigin}/api/proper`,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: true,
  },
  '预检阶段就被拒：真实请求根本不会发出（这是"发"层面的拦截）'
);

console.log('\n  自定义响应头的暴露问题：');
const exposed = await fetch(`${apiOrigin}/api/proper`, { headers: { Origin: GOOD } });
const safeListed = new Set(['cache-control', 'content-language', 'content-type', 'expires', 'last-modified', 'pragma']);
const visibleHeaders = [...exposed.headers.keys()].filter(
  (h) => safeListed.has(h) || (exposed.headers.get('access-control-expose-headers') || '').toLowerCase().includes(h)
);
console.log(`    响应实际下发的头：${[...exposed.headers.keys()].join(', ')}`);
console.log(`    JS 能读到的头    ：${visibleHeaders.join(', ')}`);
console.log('    X-Total-Count 因为被 Expose-Headers 显式声明了，所以 JS 能读；');
console.log('    若没声明，即使服务端下发了，JS 也拿不到（这也是分页信息"莫名丢失"的常见原因）。');

// ============================================================================
// 小节 6：CORS 不是访问控制 —— 被拦下的请求，服务端已经执行了
// ============================================================================
console.log('\n--- 6. 关键认知：CORS 不是访问控制，服务端该做的鉴权一样都不能少 ---');
console.log(`  删除前服务端数据：${JSON.stringify(serverState.records)}`);

const deleteResult = await demo(
  `恶意站点发起一个"简单请求"的写操作（text/plain 的 POST，【不会】触发预检）`,
  {
    pageOrigin: EVIL,
    url: `${apiOrigin}/api/records/delete`,
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
  },
  'JS 读不到响应 —— 但请看下面的服务端状态'
);

console.log(`\n  删除后服务端数据：${JSON.stringify(serverState.records)}`);
console.log(`  恶意站点发出的请求是否真的到达并执行了服务端逻辑：${deleteResult.sent ? '是' : '否'}`);
console.log('  ↑ 这就是"CORS 不是访问控制"的铁证：');
console.log('    浏览器只是不把响应交给攻击者的 JS，请求本身早已被服务端处理并落库。');
console.log('    所以服务端必须【自己鉴权】（校验会话、权限、CSRF Token），');
console.log('    绝不能依赖"跨源读不到所以安全"。');
console.log('    补充：如果写操作是"非简单请求"（如 application/json 的 PUT），');
console.log('    浏览器会先预检，预检不过时真实请求根本不会发出 —— 那种情况才算拦住了"发"。');
console.log('    但攻击者只要把请求降级成简单请求（text/plain 的 POST）就能绕过预检这道关，');
console.log('    所以预检永远不能当作唯一的写操作防线。');

console.log('\n  谁不受 CORS 约束？');
for (const s of [
  'curl / Postman / 任何非浏览器 HTTP 客户端',
  '服务端到服务端的请求（这也是 SSRF 的土壤，见 17 篇）',
  '浏览器插件、原生 App、爬虫',
  '任何直接调用 TCP 的程序',
]) {
  console.log(`    - ${s}`);
}
console.log('  → CORS 只是"浏览器自愿遵守的君子协定"，用它当安全边界是典型的误用。');

// ============================================================================
// 小节 7：与 CSRF 的关系 / 一张对照表
// ============================================================================
console.log('\n--- 7. 同源策略、CORS、CSRF 的关系 ---');
const relation = [
  ['同源策略', '浏览器阻止 A 源【读取】B 源的响应 / DOM / 存储', '它是 CSRF 存在的原因（只挡读不挡发）'],
  ['CORS', '服务端用响应头【放宽】同源策略，决定谁可以读', '配错（反射 Origin + 凭证）= 关掉同源策略，同时打开 CSRF'],
  ['预检', '非简单请求先问 OPTIONS，服务端说行才发', '可当 CSRF 防御（自定义头要求），但挡不住简单请求'],
  ['CSRF 防御', 'CSRF Token / SameSite / Origin 校验', '与 CORS 无关，必须独立实施'],
];
for (const [name, what, relationText] of relation) {
  console.log(`  ${name.padEnd(10)} 是什么：${what}`);
  console.log(`  ${' '.repeat(10)} 关系　：${relationText}`);
}

// ============================================================================
// 小节 8：CORS 配置自查清单
// ============================================================================
console.log('\n--- 8. CORS 配置自查清单 ---');
for (const item of [
  'ACAO 只用白名单精确匹配，绝不 startsWith / includes 匹配',
  '绝不无条件反射请求的 Origin；确需动态返回时必须严格比对白名单',
  'ACAO: * 时不使用 ACAC: true（规范禁止，浏览器会拒绝）',
  '一旦允许凭证，白名单必须精确到具体源，且必须带 Vary: Origin',
  '白名单里绝不能出现 null（沙箱 iframe / file:// 的源就是 null）',
  'Allow-Methods / Allow-Headers 按最小必要列举，不用 * 图省事',
  '预检响应（OPTIONS）与真实响应都要带对应的 CORS 头',
  '需要 JS 读的自定义响应头要显式写进 Access-Control-Expose-Headers',
  'Max-Age 不宜过大（配置变更后旧策略会被缓存很久）',
  '记住 CORS 不是鉴权：每个接口都要独立校验身份与权限',
]) {
  console.log(`  [ ] ${item}`);
}

// ============================================================================
// 小节 9：小结
// ============================================================================
console.log('\n--- 9. 小结 ---');
console.log('  1) 同源 = 协议 + 域名 + 端口全同；子域不同源，"站点"与"源"是两个概念。');
console.log('  2) 同源策略只挡"读"不挡"发" —— 这既是 CORS 的舞台，也是 CSRF 的根源。');
console.log('  3) 非简单请求先走 OPTIONS 预检；application/json 与自定义头都会触发预检。');
console.log('  4) `*` 与 `ACAC: true` 不可同用；要带凭证就必须回具体源 + Vary: Origin。');
console.log('  5) 最危险的配置是"无条件反射 Origin + 允许凭证" —— 等于关闭同源策略。');
console.log('  6) CORS 是浏览器的自律，不是访问控制：被拦下的请求，服务端早就执行完了。');

await new Promise((r) => server.close(r));
console.log('\n[清理] 本地 API 服务已关闭。示例结束，退出码 0。');
