/**
 * ============================================================================
 * 知识点：CSRF 跨站请求伪造 —— 攻击原理与五种防御手段
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/02_xss_prevention.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    CSRF（Cross-Site Request Forgery，跨站请求伪造）指的是：
 *    攻击者诱导已经登录你网站的用户，在他的浏览器里、**以他的身份**、
 *    向你的网站发出一个他本人并不知情的请求。
 *
 *    一句话区分 XSS 与 CSRF：
 *      - XSS 是"偷"：攻击者的代码跑在你的页面里，它能读能写，可以偷 Cookie、偷 token。
 *      - CSRF 是"骗你替我发请求"：攻击者的代码根本跑不到你的页面里，
 *        他只是借用了浏览器"只要访问目标域名就自动带上该域名 Cookie"这个机制。
 *    两者经常被混为一谈，但防御手段完全不同：
 *      - 防 XSS 靠输出转义 + CSP（见 02 篇、13 篇）。
 *      - 防 CSRF 靠 CSRF Token + SameSite Cookie + Origin 校验（本文件）。
 *    注意两者的交叠：**XSS 可以让 CSRF 防御全部失效**（脚本能读到页面里的 token），
 *    所以"我已经有 CSRF Token 了"不能成为不修 XSS 的理由。
 *
 * 2. 为什么需要（真实攻击场景）
 *    根源只有一条：**Cookie 的自动携带机制**。
 *    浏览器访问某个域名时，会把该域名下"还没过期、且匹配路径"的 Cookie 自动塞进请求头，
 *    它不关心这个请求是"用户主动点出来的"还是"另一个网站的图片/表单/脚本带出来的"。
 *
 *    真实场景（这些操作在 10 年前几乎全军覆没）：
 *      (a) 银行转账：攻击者做一个页面，里面藏一个自动提交的表单，
 *          action 指向 bank.com/transfer?to=attacker&amount=10000，用户一打开钱就没了。
 *      (b) 修改邮箱 / 改密码：改成攻击者的邮箱，然后走"忘记密码"接管账号。
 *      (c) 发帖 / 关注 / 点赞：这就是"刷粉""刷榜"的技术底座。
 *      (d) 后台管理接口：管理员登录着后台，打开一个攻击者页面，就帮攻击者创建了一个管理员账号。
 *      (e) 更隐蔽的形态：不一定用表单。`<img src="https://bank.com/transfer?...">`
 *          这种 GET 请求连表单都不需要（所以**任何写操作都不该用 GET**）。
 *
 *    为什么近年"感觉少了"？因为两个默认行为变了：
 *      (a) 主流浏览器把 SameSite 的默认值从 None 改成了 Lax（Chrome 80+ 起），
 *          跨站的 POST 表单默认不再携带 Cookie。
 *      (b) 前后端分离后，很多接口靠 Authorization 头而不是 Cookie 鉴权，
 *          而自定义请求头无法由跨站表单/图片产生（要发自定义头必须走 CORS 预检，见 12 篇）。
 *    但**这不代表 CSRF 消失了**：显式设置了 SameSite=None 的场景（跨站 iframe 嵌入、
 *    第三方登录回调、部分老的 SDK）、以及浏览器兼容性差异，都还留着口子。
 *
 * 3. 核心语法要点 / 防御手段（五种，按推荐程度排序）
 *
 *    (1) CSRF Token —— 同步令牌模式（Synchronization Token Pattern），最经典有效。
 *        服务端在渲染表单/返回页面时，生成一个与当前会话绑定的随机 token，存进
 *        （服务端 session 或签名的 Cookie），并让页面能拿到它；表单提交或请求头里必须带上它。
 *        攻击者的页面**读不到**这个 token（同源策略挡住了跨站读取，见 12 篇），
 *        所以他伪造的请求里没有 token，服务端直接拒绝。
 *        要点：
 *          - token 必须用密码学安全随机数生成（见 09_secure_random.js）。
 *          - token 必须与**用户会话**绑定，不能是全局固定值，也不能只用时间戳。
 *          - 校验时必须用**恒定时间比较**（见 15 篇的 timingSafeEqual），避免时序侧信道。
 *          - token 要能旋转：登录成功后重新生成（防会话固定）。
 *
 *    (2) SameSite Cookie 属性 —— 成本最低的一道闸。
 *          - `SameSite=Strict`：任何跨站请求都不带 Cookie。最安全，但用户体验受损：
 *            从别的网站点链接跳过来时，会表现为"未登录"（要再刷新一次）。
 *          - `SameSite=Lax`：**默认值**。跨站的"顶级导航 GET"（点链接、地址栏输入）会带 Cookie，
 *            跨站的 POST / iframe / img / fetch 一律不带。挡住绝大多数 CSRF。
 *          - `SameSite=None`：任何情况都带，**必须同时加 `Secure`**（只在 HTTPS 下发送），
 *            否则浏览器直接丢弃这个 Cookie。用于真正需要跨站携带的场景。
 *        注意：SameSite 是"浏览器配合"的防御，同一站点的子域之间属于 same-site（可跨站内伪造），
 *        所以它不能替代 CSRF Token。
 *
 *    (3) 双重提交 Cookie（Double Submit Cookie）。
 *        在没有服务端 session 的纯前后端分离架构里的常用方案：
 *        服务端下发一个随机值到 Cookie（如 `csrf=xxx`，**不加 HttpOnly**，因为 JS 要读它），
 *        前端 JS 读到后放进请求头 `X-CSRF-Token: xxx`；服务端只校验"头里的值 == Cookie 里的值"。
 *        攻击者虽然能让浏览器带上 Cookie，但他读不到 Cookie 的值（同源策略），也伪造不出这个头。
 *        进阶：给 Cookie 加签名（"signed double submit"），防止攻击者利用子域写 Cookie 覆盖。
 *
 *    (4) 校验 Origin / Referer 头。
 *        `Origin` 头由浏览器自动附加在跨站请求上（表单 POST 一定有，同源的 GET 可能没有）。
 *        服务端检查它是否在允许列表里。缺点：依赖浏览器行为、老浏览器可能缺失、
 *        隐私模式下 Referer 可能被裁掉，所以只能作为**辅助**手段，不能当唯一防线。
 *
 *    (5) 自定义请求头（Custom Header）。
 *        要求请求必须带一个非简单头（如 `X-Requested-With: XMLHttpRequest`）。
 *        跨站表单/图片无法发自定义头；攻击者想发就得通过 CORS 预检，
 *        而预检由**你的服务端**决定放不放行，你不放行他就发不出去。
 *        本质上这是"利用 CORS 机制当 CSRF 防御"，所以必须确认你的 CORS 配置没乱反射 Origin。
 *
 *    补充：**任何写操作都不该用 GET**。GET 应该是幂等、无副作用的，
 *    否则一张 `<img>` 就能完成攻击，连表单都不用。
 *
 * 4. 常见陷阱
 *    - 只在"表单页"校验 token，却在 AJAX 接口上忘了校验 —— 攻击者当然挑没校验的那个接口打。
 *    - token 与用户会话不绑定（例如全站同一个常量），等于没有 token。
 *    - token 放在 URL 查询串里：会进浏览器历史、服务器访问日志、Referer 头，泄漏面巨大。
 *    - 双重提交 Cookie 时忘了给 Cookie 加签名，攻击者用自己控制的子域写 Cookie 就能绕过。
 *    - `SameSite=None` 不加 `Secure`，浏览器直接丢弃，于是"我配了 SameSite 啊怎么没用"。
 *    - 认为"接口用了 JSON 就安全"：`Content-Type: text/plain` 的跨站表单可以发任意 body，
 *      如果服务端不校验 Content-Type，照样被打（要严格校验 `application/json`）。
 *    - **与 XSS 的权衡**：把 token 存 localStorage 会同时暴露给 XSS；存 HttpOnly Cookie
 *      则 JS 读不到、XSS 偷不走，但又回到"浏览器自动携带"的 CSRF 问题。
 *      正确做法见本文件小节 7 —— 两者不是二选一，而是分工。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/11_csrf.js
 *
 * 【预期输出】
 *   用本地自建的"银行服务"和"攻击者站点"（都在 127.0.0.1 上）对比合法请求与伪造请求：
 *   无防护时伪造请求成功转账；加上 CSRF Token / SameSite / Origin 校验后同一发攻击被拒；
 *   打印各方案被拒时的状态码与理由。全程只在本机内存里转账，退出码 0。
 * ============================================================================
 */

import http from 'node:http';
import crypto from 'node:crypto';

// ============================================================================
// 小节 0：CSRF 与 XSS 的区别（一句话记住）
// ============================================================================
console.log('--- 0. CSRF 与 XSS 的区别 ---');
console.log('  XSS ：攻击者的代码跑在【你的页面里】 —— 是"偷"（偷 Cookie、偷 token、改页面）。');
console.log('  CSRF：攻击者的代码跑在【他自己的页面里】，只是骗你的浏览器替他发请求 —— 是"骗"。');
console.log('  关键差异：CSRF 攻击者【读不到】你的响应（同源策略挡着），他只要"请求被发出并被执行"。');
console.log('  关键联系：XSS 能让 CSRF Token 形同虚设（脚本能读到 token），所以两者必须都防。');

// ============================================================================
// 小节 1：为什么会有 CSRF —— Cookie 的自动携带机制
// ============================================================================
console.log('\n--- 1. 根源：Cookie 是"按域名自动携带"的，浏览器不区分请求来源 ---');
console.log('  用户在 bank.test 登录后，浏览器存下 Cookie: session=abc123');
console.log('  之后只要请求目标是 bank.test，浏览器就自动加上：Cookie: session=abc123');
console.log('  它【不关心】这个请求是用户点的、是 img 标签带的、还是别的网站的表单提交的。');
console.log('  攻击者要做的仅仅是：让受害者的浏览器"发出一个指向 bank.test 的请求"。');

// ---------------------------------------------------------------------------
// 【无害化说明】下面用 127.0.0.1 上的两个本地服务模拟"银行"和"攻击者站点"。
// 真实世界里这是两个不同域名；本地演示时端口不同即为不同源（见 12 篇的同源判定），
// 但 Cookie 是按【主机名】而非端口存储的，所以 127.0.0.1:PORT_A 的 Cookie
// 会被浏览器带到 127.0.0.1:PORT_B 的请求里 —— 这恰好完整复现了真实攻击链。
// 另外：Node 的 fetch 不会自动管理 Cookie（那是浏览器行为），
// 因此下面手写了一个极小的 CookieJar 来显式模拟浏览器的行为。
// 全程没有真实转账，只有内存里的一个数字在变。
// ---------------------------------------------------------------------------

/**
 * 极小的 Cookie 容器，用来模拟浏览器行为：
 * 只按 host 匹配（忽略端口、忽略 path，够用即可），并在跨站请求时也照常携带。
 */
class CookieJar {
  constructor() {
    /** @type {Map<string, string>} key = `${host}\t${name}` */
    this.store = new Map();
  }

  /** 记录服务端 Set-Cookie 下发的 Cookie */
  set(setCookieHeaders) {
    for (const raw of setCookieHeaders) {
      const [pair] = raw.split(';');
      const idx = pair.indexOf('=');
      const name = pair.slice(0, idx).trim();
      const value = pair.slice(idx + 1).trim();
      this.store.set(name, value);
    }
  }

  /** 取出应当附加到目标请求上的 Cookie 头（模拟浏览器：只看 host，不看发起方是谁） */
  headerFor(_url) {
    if (this.store.size === 0) return {};
    return { Cookie: [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join('; ') };
  }

  clear() {
    this.store.clear();
  }
}

/**
 * 模拟"浏览器发出一个请求"：自动带上 Cookie（这就是 CSRF 的物理基础）。
 * @param {string} url
 * @param {{method?: string, body?: string, headers?: Record<string,string>, jar: CookieJar}} opts
 * @returns {Promise<{status:number, body:string, headers:Record<string,string>}>}
 */
async function browserFetch(url, opts) {
  const { method = 'GET', body, headers = {}, jar } = opts;
  // 关键点：无论这个请求是从哪个站点发起的，Cookie 都会被自动带上。
  const finalHeaders = { ...jar.headerFor(url), ...headers };
  const res = await fetch(url, { method, body, headers: finalHeaders, redirect: 'manual' });
  const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  if (setCookies.length) jar.set(setCookies);
  return { status: res.status, body: await res.text(), headers: Object.fromEntries(res.headers) };
}

// ============================================================================
// 小节 2：银行服务端 —— 先看"无防护"的版本
// ============================================================================
console.log('\n--- 2. 搭建本地"银行"服务（内存账本，不涉及真实资金） ---');

/** 内存账本：只有一个账户，余额变化能直观看到攻击是否成功 */
const ledger = { balance: 10000, log: [] };

/** 会话存储（服务端 session）：sessionId -> { user, csrfToken } */
const sessions = new Map();

/**
 * 无防护的转账接口：只检查"请求里有没有有效 session Cookie"。
 * 这正是 CSRF 能成立的全部条件 —— 因为 Cookie 是浏览器自动带的，
 * 攻击者伪造的请求**天然就带上了**受害者的 session。
 * @param {http.IncomingMessage} req
 * @param {Record<string,string>} cookies 解析后的 Cookie
 * @returns {{status:number, message:string}}
 */
function vulnerableTransfer(req, cookies) {
  const sid = cookies.session;
  const session = sid ? sessions.get(sid) : null;
  if (!session) return { status: 401, message: '未登录' };
  const url = new URL(req.url, 'http://127.0.0.1');
  const to = url.searchParams.get('to');
  const amount = Number(url.searchParams.get('amount'));
  ledger.balance -= amount;
  ledger.log.push(`  [无防护] ${session.user} -> ${to} 转账 ${amount}，余额 ${ledger.balance}`);
  return { status: 200, message: `转账成功：${amount} 元已转给 ${to}` };
}

let bankServer;
let attackerServer;

/** 启动银行服务：listen(0) 让系统分配空闲端口，绝不占用固定端口 */
function startBankServer() {
  return new Promise((resolve) => {
    bankServer = http.createServer((req, res) => {
      const cookies = Object.fromEntries(
        (req.headers.cookie || '')
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => {
            const i = s.indexOf('=');
            return [s.slice(0, i), s.slice(i + 1)];
          })
      );

      if (req.url.startsWith('/login')) {
        const sid = crypto.randomBytes(16).toString('hex');
        sessions.set(sid, { user: 'victim' });
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          // SameSite 暂不设置 —— 先暴露问题，小节 5 再修
          'Set-Cookie': `session=${sid}; Path=/`,
        });
        return res.end('登录成功');
      }

      if (req.url.startsWith('/transfer')) {
        const r = vulnerableTransfer(req, cookies);
        res.writeHead(r.status, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end(r.message);
      }

      res.writeHead(404).end();
    });
    bankServer.listen(0, '127.0.0.1', () => resolve(bankServer.address().port));
  });
}

/**
 * 攻击者站点：返回一段 HTML，它会在受害者浏览器里【自动提交】一个表单到银行。
 * 这里只把 HTML 当字符串打印出来（绝不交给浏览器渲染），说明攻击是怎么发生的。
 */
function attackerPageHtml(bankOrigin) {
  return [
    '<html><body>',
    '  <h1>恭喜你中奖了！</h1>',
    '  <!-- 用户看得到的是一个"中奖页面"，看不到的是下面这个自动提交的隐藏表单 -->',
    `  <form id="f" action="${bankOrigin}/transfer?to=attacker&amount=9999" method="POST">`,
    '    <input type="hidden" name="memo" value="hacked">',
    '  </form>',
    '  <script>document.getElementById("f").submit();</script>',
    '</body></html>',
  ].join('\n');
}

function startAttackerServer(html) {
  return new Promise((resolve) => {
    attackerServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
    attackerServer.listen(0, '127.0.0.1', () => resolve(attackerServer.address().port));
  });
}

const bankPort = await startBankServer();
const bankOrigin = `http://127.0.0.1:${bankPort}`;
console.log(`  银行服务已启动：${bankOrigin}（仅监听 127.0.0.1，不对外）`);

const attackerPort = await startAttackerServer(attackerPageHtml(bankOrigin));
const attackerOrigin = `http://127.0.0.1:${attackerPort}`;
console.log(`  攻击者站点已启动：${attackerOrigin}（仅用于演示，内容是死字符串）`);
console.log('\n  攻击者站点的 HTML 长这样（只打印，不渲染）：');
console.log(attackerPageHtml(bankOrigin).split('\n').map((l) => '    ' + l).join('\n'));

const jar = new CookieJar();

// ---- 步骤 1：受害者正常登录银行 ----
console.log('\n  [步骤 1] 受害者登录银行');
const login = await browserFetch(`${bankOrigin}/login`, { jar });
console.log(`    登录响应 ${login.status}：${login.body}`);
console.log(`    浏览器现在持有 Cookie：${[...jar.store.entries()].map(([k, v]) => `${k}=${v.slice(0, 8)}...`).join(', ')}`);

// ---- 步骤 2：受害者访问攻击者页面，浏览器被诱导发出跨站请求 ----
console.log('\n  [步骤 2] 受害者打开攻击者页面，页面里的表单自动提交到银行');
console.log('    注意：这一步【没有】任何 JS 跑在银行的页面上 —— 这就是 CSRF，不是 XSS。');
const forged = await browserFetch(`${bankOrigin}/transfer?to=attacker&amount=9999`, {
  method: 'POST',
  jar, // 关键：浏览器自动带上了银行的 session Cookie
  headers: { Origin: attackerOrigin, Referer: `${attackerOrigin}/` },
});
console.log(`    伪造请求响应 ${forged.status}：${forged.body}`);
console.log(`    当前余额：${ledger.balance}`);
console.log(ledger.log.map((l) => '    ' + l).join('\n'));
console.log('    【结论】无防护时，攻击成功 —— 服务端只看到"一个带着合法 Cookie 的请求"。');

// ============================================================================
// 小节 3：防御一 —— CSRF Token（同步令牌模式）
// ============================================================================
console.log('\n--- 3. 防御一：CSRF Token（同步令牌模式） ---');

/**
 * 生成与某个 session 绑定的 CSRF token。
 * 要点：用密码学安全随机数（crypto.randomBytes），不要用 Math.random（见 09 篇）。
 * @returns {string}
 */
function issueCsrfToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * 恒定时间比较两个 token，避免通过响应耗时逐字节猜出 token（时序攻击）。
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ''), 'utf8');
  const bufB = Buffer.from(String(b ?? ''), 'utf8');
  // timingSafeEqual 要求长度一致；长度不同直接判否（长度本身不是秘密）
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** 有防护版的转账：校验 表单字段/请求头 里的 token 是否与 session 里的一致 */
function protectedTransfer(req, cookies, body) {
  const sid = cookies.session;
  const session = sid ? sessions.get(sid) : null;
  if (!session) return { status: 401, message: '未登录' };

  // 从表单字段或自定义请求头里取 token（两者都常见）
  const params = new URLSearchParams(body || '');
  const tokenFromForm = params.get('csrf_token');
  const tokenFromHeader = req.headers['x-csrf-token'];
  const provided = tokenFromHeader || tokenFromForm;

  if (!provided) {
    return { status: 403, message: 'CSRF token 缺失 —— 拒绝（攻击者的跨站表单读不到 token）' };
  }
  if (!safeEqual(provided, session.csrfToken)) {
    return { status: 403, message: 'CSRF token 不匹配 —— 拒绝' };
  }

  const url = new URL(req.url, 'http://127.0.0.1');
  const amount = Number(url.searchParams.get('amount'));
  ledger.balance -= amount;
  ledger.log.push(`  [Token] 合法请求放行，转账 ${amount}，余额 ${ledger.balance}`);
  return { status: 200, message: `转账成功：${amount}` };
}

// 让银行支持 CSRF Token：登录时下发，转账时校验
bankServer.removeAllListeners('request');
bankServer.on('request', (req, res) => {
  const cookies = Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const i = s.indexOf('=');
        return [s.slice(0, i), s.slice(i + 1)];
      })
  );

  if (req.url.startsWith('/login')) {
    const sid = crypto.randomBytes(16).toString('hex');
    const csrfToken = issueCsrfToken();
    sessions.set(sid, { user: 'victim', csrfToken });
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Set-Cookie': `session=${sid}; Path=/; HttpOnly; SameSite=Lax`,
    });
    return res.end(csrfToken); // 真实项目里是渲染进表单的隐藏字段或 <meta> 标签
  }

  if (req.url.startsWith('/transfer')) {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const r = protectedTransfer(req, cookies, body);
      res.writeHead(r.status, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(r.message);
    });
    return;
  }
  res.writeHead(404).end();
});

jar.clear();
console.log('  受害者重新登录（现在服务端会下发与 session 绑定的 token）');
const login2 = await browserFetch(`${bankOrigin}/login`, { jar });
const victimToken = login2.body;
console.log(`    登录响应 200，拿到 token：${victimToken.slice(0, 16)}...（真实场景里 token 藏在表单隐藏字段中）`);

console.log('  攻击者再次伪造同一个请求（他没变，还是那个自动提交的表单）：');
const blocked = await browserFetch(`${bankOrigin}/transfer?to=attacker&amount=9999`, {
  method: 'POST',
  jar,
  headers: { Origin: attackerOrigin, Referer: `${attackerOrigin}/` },
});
console.log(`    伪造请求响应 ${blocked.status}：${blocked.body}`);
console.log('    为什么攻击者拿不到 token？→ 同源策略：攻击者的页面【读不到】bank 页面的响应内容。');

console.log('  受害者自己带着 token 正常转账：');
const legit = await browserFetch(`${bankOrigin}/transfer?to=alice&amount=100`, {
  method: 'POST',
  jar,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: bankOrigin },
});
// 注意：这里演示的是"表单里带 token"的路径，需要把 token 拼进 body
const legitWithToken = await browserFetch(`${bankOrigin}/transfer?to=alice&amount=100`, {
  method: 'POST',
  jar,
  body: `csrf_token=${encodeURIComponent(victimToken)}`,
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: bankOrigin },
});
console.log(`    不带 token 的"自己人"请求 ${legit.status}：${legit.body}`);
console.log(`    带 token 的请求 ${legitWithToken.status}：${legitWithToken.body}`);

// ============================================================================
// 小节 4：防御二 / 三 —— SameSite Cookie 与双重提交 Cookie
// ============================================================================
console.log('\n--- 4. 防御二：SameSite Cookie 的三种取值 ---');

const sameSiteTable = [
  ['Strict', '任何跨站请求都不发送该 Cookie', '最安全；但从外站点链接跳进来时会显示"未登录"，体验有损', '后台管理、支付等高风险操作'],
  ['Lax', '跨站的顶级导航 GET 会带；跨站的 POST / iframe / img / fetch 不带', '浏览器默认值（Chrome 80+）；挡住绝大多数 CSRF，体验损失小', '绝大多数业务 Cookie（推荐默认选它）'],
  ['None', '任何情况都发送（含跨站 iframe、跨站 fetch）', '必须同时加 Secure，否则浏览器直接丢弃；等于放弃 SameSite 防护', '真正需要跨站的场景：第三方嵌入、跨站 SSO 回调'],
];
console.log('  取值      | 行为                                                | 代价与说明');
console.log('  ' + '-'.repeat(100));
for (const [v, behavior, cost, useCase] of sameSiteTable) {
  console.log(`  ${v.padEnd(9)} | ${behavior}`);
  console.log(`  ${' '.repeat(9)} |   代价：${cost}`);
  console.log(`  ${' '.repeat(9)} |   适用：${useCase}`);
  console.log('  ' + '-'.repeat(100));
}

/** 模拟浏览器对 SameSite 的判定：返回该 Cookie 是否会被附加到这次请求上 */
function sameSiteAllows(sameSite, { isCrossSite, isTopLevelNavigationGet }) {
  if (!isCrossSite) return true; // 同站请求：三种取值都带
  if (sameSite === 'Strict') return false;
  if (sameSite === 'Lax') return isTopLevelNavigationGet; // 只有顶级 GET 导航才带
  return true; // None
}

console.log('  模拟浏览器判定（crossSite = 请求由别的站点发起）：');
const scenarios = [
  ['受害者在自己站点内的正常请求', false, false],
  ['攻击者页面里的 <form method=POST> 自动提交', true, false],
  ['攻击者页面里的 <img src>（GET）', true, false],
  ['从攻击者页面点链接跳转过来的顶级 GET 导航', true, true],
];
for (const sameSite of ['Strict', 'Lax', 'None']) {
  console.log(`    SameSite=${sameSite}`);
  for (const [desc, isCrossSite, isTopLevel] of scenarios) {
    const allow = sameSiteAllows(sameSite, { isCrossSite, isTopLevelNavigationGet: isTopLevel });
    console.log(`      ${allow ? '携带 Cookie' : '不携带    '} <- ${desc}`);
  }
}

console.log('\n--- 4b. 防御三：双重提交 Cookie（无服务端 session 时的方案） ---');
console.log('  做法：服务端下发 csrf=<随机值>（【不加 HttpOnly】，因为前端 JS 要读它）');
console.log('        前端读 Cookie 后放进请求头：X-CSRF-Token: <同一个值>');
console.log('        服务端只比较"头 == Cookie"，相等就放行。');

/** 双重提交 Cookie 的服务端校验（含对 Cookie 的 HMAC 签名，防止子域覆盖攻击） */
const CSRF_SIGN_KEY = crypto.randomBytes(32);

/** 生成带签名的 csrf Cookie 值：`随机数.签名` */
function issueSignedCsrfCookie() {
  const nonce = crypto.randomBytes(16).toString('base64url');
  const sig = crypto.createHmac('sha256', CSRF_SIGN_KEY).update(nonce).digest('base64url');
  return `${nonce}.${sig}`;
}

/**
 * 校验双重提交：头里的值必须与 Cookie 里的值完全一致，且 Cookie 的签名必须有效。
 * 签名的作用：攻击者可以往你的域写 Cookie（子域 XSS、或可控的子域），
 * 但没有密钥就伪造不出合法签名。
 * @param {string} headerValue 请求头 X-CSRF-Token
 * @param {string} cookieValue Cookie csrf 的值
 * @returns {{ok:boolean, reason:string}}
 */
function checkDoubleSubmit(headerValue, cookieValue) {
  if (!headerValue || !cookieValue) return { ok: false, reason: '缺少头或 Cookie' };
  if (!safeEqual(headerValue, cookieValue)) return { ok: false, reason: '头与 Cookie 不一致' };
  const [nonce, sig] = cookieValue.split('.');
  const expect = crypto.createHmac('sha256', CSRF_SIGN_KEY).update(nonce).digest('base64url');
  if (!safeEqual(sig, expect)) return { ok: false, reason: 'Cookie 签名无效（可能被子域覆盖）' };
  return { ok: true, reason: '通过' };
}

const dsCookie = issueSignedCsrfCookie();
console.log(`  服务端下发的 Cookie：csrf=${dsCookie.slice(0, 20)}...`);
console.log(`  攻击者伪造请求只带 Cookie、伪造不出头 -> ${JSON.stringify(checkDoubleSubmit(undefined, dsCookie))}`);
console.log(`  攻击者猜一个头里的值           -> ${JSON.stringify(checkDoubleSubmit('guess', dsCookie))}`);
console.log(`  正常前端把头填对               -> ${JSON.stringify(checkDoubleSubmit(dsCookie, dsCookie))}`);
const forgedCookie = `${crypto.randomBytes(16).toString('base64url')}.${crypto.randomBytes(24).toString('base64url')}`;
console.log(`  攻击者用子域写了个假 Cookie 并原样放进头 -> ${JSON.stringify(checkDoubleSubmit(forgedCookie, forgedCookie))}`);

// ============================================================================
// 小节 5：防御四 / 五 —— Origin/Referer 校验 与 自定义请求头
// ============================================================================
console.log('\n--- 5. 防御四：校验 Origin / Referer ---');

const ALLOWED_ORIGINS = new Set([bankOrigin, bankOrigin.replace('127.0.0.1', 'localhost')]);

/**
 * 检查请求来源是否可信。
 * 注意：Origin 缺失时不能"默认放行"，也不能"一律拒绝"（同源 GET 可能没有 Origin），
 * 所以实践中它是**辅助**手段：缺失时回退到 Referer，都没有则按业务风险决定。
 * @param {Record<string,string>} headers
 * @returns {{ok:boolean, reason:string}}
 */
function checkOrigin(headers) {
  const origin = headers.origin;
  const referer = headers.referer;
  if (origin) {
    return ALLOWED_ORIGINS.has(origin)
      ? { ok: true, reason: `Origin=${origin} 在白名单内` }
      : { ok: false, reason: `Origin=${origin} 不在白名单内` };
  }
  if (referer) {
    const refOrigin = new URL(referer).origin;
    return ALLOWED_ORIGINS.has(refOrigin)
      ? { ok: true, reason: `Referer 推导出的源 ${refOrigin} 在白名单内` }
      : { ok: false, reason: `Referer 推导出的源 ${refOrigin} 不在白名单内` };
  }
  return { ok: false, reason: 'Origin 与 Referer 都缺失（按 fail closed 处理）' };
}

for (const [desc, headers] of [
  ['攻击者页面的自动提交表单', { origin: attackerOrigin, referer: `${attackerOrigin}/` }],
  ['银行自己的页面发起的 AJAX', { origin: bankOrigin }],
  ['隐私模式下的同源请求（只剩 Referer）', { referer: `${bankOrigin}/account` }],
  ['某些客户端/老浏览器（两个头都没有）', {}],
]) {
  const r = checkOrigin(headers);
  console.log(`  ${r.ok ? '放行' : '拒绝'} <- ${desc}：${r.reason}`);
}

console.log('\n--- 5b. 防御五：要求自定义请求头（借 CORS 机制挡刀） ---');
console.log('  跨站的 <form>/<img>/<script> 只能发出"简单请求"，无法附加自定义头。');
console.log('  攻击者想加 X-Requested-With，就必须发 CORS 预检（OPTIONS），');
console.log('  而预检放不放行由【你的服务端】说了算 —— 他过不了这一关。');
console.log('  前提：你的 CORS 不能乱反射 Origin（详见 12 篇的"反射 Origin 的危险"）。');

const simpleRequestHeaders = new Set(['accept', 'accept-language', 'content-language', 'content-type']);
/** 判断一个请求头集合是否触发了 CORS 预检（即"非简单请求"） */
function requiresPreflight(method, headers) {
  const simpleMethods = new Set(['GET', 'HEAD', 'POST']);
  if (!simpleMethods.has(method.toUpperCase())) return '方法不在简单方法集合内';
  for (const [k, v] of Object.entries(headers)) {
    const key = k.toLowerCase();
    if (!simpleRequestHeaders.has(key)) return `包含自定义头 ${k}`;
    if (key === 'content-type' && !['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'].includes(v)) {
      return `Content-Type=${v} 不是简单值`;
    }
  }
  return null;
}

for (const [desc, method, headers] of [
  ['攻击者表单 POST（可发出去）', 'POST', { 'Content-Type': 'application/x-www-form-urlencoded' }],
  ['攻击者想发 JSON（可发出去，但服务端应校验 Content-Type）', 'POST', { 'Content-Type': 'text/plain' }],
  ['攻击者想加自定义头（会触发预检）', 'POST', { 'X-Requested-With': 'XMLHttpRequest' }],
  ['攻击者想用 PUT（会触发预检）', 'PUT', { 'Content-Type': 'application/json' }],
]) {
  const pf = requiresPreflight(method, headers);
  console.log(`  ${pf ? '触发预检 -> 攻击者被挡' : '可发出     '} <- ${desc}${pf ? `（原因：${pf}）` : ''}`);
}
console.log('  重要提醒：预检能挡住"加自定义头"，但挡不住上面前两行 —— 所以服务端还必须校验');
console.log('  Content-Type 是否为 application/json，并叠加 CSRF Token，单靠一样都不够。');

// ============================================================================
// 小节 6：把各种防御串起来 —— 推荐组合
// ============================================================================
console.log('\n--- 6. 实践中的推荐组合（纵深防御） ---');
const defenses = [
  ['第 1 层', 'Cookie 属性', 'session Cookie 设 HttpOnly + Secure + SameSite=Lax', '成本最低，先做'],
  ['第 2 层', 'CSRF Token', '与 session 绑定、密码学随机、恒定时间比较、登录后旋转', '核心防线'],
  ['第 3 层', 'Origin 校验', '白名单比对，缺失时 fail closed 或回退 Referer', '辅助，覆盖非浏览器客户端'],
  ['第 4 层', '自定义头 / Content-Type', '要求 X-Requested-With 或严格 application/json', '前后端分离常用'],
  ['第 5 层', '语义约束', '写操作不用 GET；敏感操作二次验证（密码 / TOTP）', '降低单点失守的后果'],
];
for (const [layer, name, how, note] of defenses) {
  console.log(`  ${layer} ${name.padEnd(18)} ${how}`);
  console.log(`  ${' '.repeat(8)}└─ ${note}`);
}

// ============================================================================
// 小节 7：token 存 localStorage 还是 HttpOnly Cookie？（XSS 与 CSRF 的权衡）
// ============================================================================
console.log('\n--- 7. 抉择：token 存 localStorage 还是 HttpOnly Cookie？ ---');
const tradeoff = [
  ['存 localStorage', 'JS 可读 -> XSS 一旦发生，token 直接被偷走（而且 localStorage 没有过期控制）', '不会被浏览器自动携带 -> 天生免疫 CSRF'],
  ['存 HttpOnly Cookie', 'JS 读不到 -> XSS 偷不走它（但 XSS 仍可用它发请求，见下）', '浏览器自动携带 -> 需要 CSRF 防御（Token / SameSite）'],
  ['内存变量（只存 JS 内存）', '刷新即丢，需要 refresh token 配合；XSS 仍能读', '配合 Authorization 头使用则不受 CSRF 影响'],
];
for (const [where, xssRisk, csrfRisk] of tradeoff) {
  console.log(`  ${where}`);
  console.log(`    XSS 视角：${xssRisk}`);
  console.log(`    CSRF 视角：${csrfRisk}`);
}
console.log('  常见的两个错误结论：');
console.log('    ✗ "存 localStorage 更安全，因为不会有 CSRF" —— 它把风险换成了 XSS，而 XSS 更严重。');
console.log('    ✗ "存 HttpOnly Cookie 就万事大吉" —— XSS 依然能以你的身份发请求（它不需要读 token）。');
console.log('  业界共识（推荐做法）：');
console.log('    1) 优先：敏感凭证放 HttpOnly + Secure + SameSite 的 Cookie，同时用 CSRF Token 挡 CSRF。');
console.log('    2) 若必须用 Authorization 头（前后端分离 / 移动端同一套 API）：token 放内存，');
console.log('       refresh token 放 HttpOnly Cookie，并严格限制刷新接口的作用域。');
console.log('    3) 无论选哪种，XSS 都必须单独修 —— 它能让以上所有设计同时失效。');
console.log('    4) 不要用 localStorage 存"长期有效"的凭证：它没有 HttpOnly，也没有自动过期。');

// ============================================================================
// 小节 8：小结
// ============================================================================
console.log('\n--- 8. 小结 ---');
console.log('  1) CSRF 的物理基础只有一条：浏览器会为目标域名自动携带 Cookie。');
console.log('  2) XSS 是"偷"（代码跑在你页面里），CSRF 是"骗你替我发请求"（代码在攻击者页面里）。');
console.log('  3) 首选防御是 CSRF Token：与 session 绑定 + 密码学随机 + 恒定时间比较 + 登录后旋转。');
console.log('  4) SameSite=Lax 是低成本高收益的默认值；None 必须配 Secure，且等于放弃这道防线。');
console.log('  5) Origin/Referer 与自定义头只能算辅助层，不能当唯一防线。');
console.log('  6) 写操作绝不用 GET；服务端要严格校验 Content-Type / 方法与业务语义。');
console.log('  7) token 存哪儿是权衡题：HttpOnly Cookie 挡 XSS 但需配 CSRF 防御，localStorage 免 CSRF 但送给 XSS。');

// ============================================================================
// 收尾：关闭本地服务，确保进程能正常退出（不挂起）
// ============================================================================
await new Promise((r) => bankServer.close(r));
await new Promise((r) => attackerServer.close(r));
console.log('\n[清理] 本地演示服务已关闭（银行服务 / 攻击者站点）。示例结束，退出码 0。');
