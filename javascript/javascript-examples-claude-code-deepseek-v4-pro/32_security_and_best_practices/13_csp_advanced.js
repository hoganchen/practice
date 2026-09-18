/**
 * ============================================================================
 * 知识点：CSP 内容安全策略进阶 —— nonce、hash、strict-dynamic、上报与 Trusted Types
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】高级
 * 【前置知识】32_security_and_best_practices/02_xss_prevention.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    CSP（Content-Security-Policy）是一个**由服务端通过响应头下发给浏览器**的策略：
 *    "我这个页面允许加载/执行哪些来源的资源"。浏览器强制执行它，
 *    所以即使攻击者成功把 `<script>` 注入进了 HTML，只要不符合策略，浏览器也拒绝执行。
 *
 *    关键定位：CSP 是**纵深防御的最后一道网**，不是第一道。
 *    它不是"防住了 XSS"，而是"在 XSS 已经发生时限制它的威力"。
 *    输出转义（02 篇）依然是第一道防线，两者是叠加关系。
 *
 *    基础形态（02 篇已介绍）：
 *      Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'
 *    本文件讲的是**进阶**部分：当你的页面确实需要内联脚本或第三方脚本时，
 *    怎么用 nonce / hash / strict-dynamic 在"能用"和"安全"之间取平衡。
 *
 * 2. 为什么需要（真实攻击场景）
 *    现实项目里最难落地的就是 `script-src 'self'`：现代前端框架、埋点 SDK、
 *    A/B 测试、客服组件、支付 SDK 几乎都要求内联脚本或外部域名白名单。于是团队会退让：
 *      - 加 `'unsafe-inline'` → CSP 对 XSS 基本失效（攻击者注入的内联脚本照样执行）。
 *      - 加一大串 CDN 白名单 → 白名单里任何一个域名存在"能把用户输入当 JS 返回"的接口
 *        （最典型的就是 JSONP），CSP 就被绕过，这叫 **CSP 白名单绕过**。
 *    进阶机制就是为了解决这两个退让：
 *      - nonce / hash：让"我自己写的内联脚本"能执行，"攻击者注入的"不能执行。
 *      - strict-dynamic：不再依赖域名白名单，只信任"被可信脚本动态创建的脚本"。
 *
 * 3. 核心语法要点
 *
 *    (1) nonce（一次性随机数）
 *        服务端每次渲染页面时生成一个密码学随机数（至少 128 位，用 crypto.randomBytes，
 *        绝不用 Math.random —— 见 09 篇），同时：
 *          响应头：Content-Security-Policy: script-src 'nonce-rAnd0m...'
 *          页面里：<script nonce="rAnd0m..."> ... </script>
 *        攻击者注入的 `<script>` 没有这个 nonce，浏览器拒绝执行。
 *        要点：
 *          - nonce 必须**每个响应都不同**（否则攻击者猜中/复用就失效）。
 *          - nonce 不能放进 HTML 之外的地方（如 URL、Cookie），那会泄漏。
 *          - nonce 只对 `<script>` / `<style>` 这类元素生效，不是万能。
 *
 *    (2) hash（内联脚本哈希白名单）
 *        对**固定不变**的内联脚本内容算 sha256/sha384/sha512，把 base64 写进策略：
 *          script-src 'sha256-<base64>'
 *        CSP 规范允许 sha256/384/512；**不允许 md5/sha1**（那些在 09 篇里也说过已不安全）。
 *        适合"内容固定"的场景（比如一段写死的 bootstrap 代码）。
 *        不适合内容会变、或带用户数据的脚本。
 *
 *    (3) strict-dynamic
 *        `script-src 'nonce-xxx' 'strict-dynamic'`
 *        含义：**忽略域名白名单**，只信任"带正确 nonce 的脚本"以及
 *        "由这些可信脚本用 document.createElement('script') 动态创建的脚本"。
 *        好处：不必再维护一长串 CDN 白名单，也就消灭了白名单绕过（JSONP 那类）。
 *        注意：它需要支持 CSP3 的浏览器；老浏览器会忽略它并回退到白名单，
 *        所以通常写成 `'nonce-xxx' 'strict-dynamic' https: 'unsafe-inline'` 这种混合形态
 *        （新浏览器走 nonce，老浏览器走 `https:` 白名单 + `unsafe-inline`）。
 *        代价：动态注入的脚本不再受限，所以"能动态插脚本的第三方库"等于获得了完全信任。
 *
 *    (4) 违规上报：report-uri / report-to
 *        - `report-uri /csp-report`（已废弃但仍广泛支持）：浏览器把违规以 JSON POST 上报。
 *        - `report-to csp-endpoint`（新标准）：配合独立响应头
 *          `Reporting-Endpoints: csp-endpoint="https://example.com/reports"`。
 *        - `Content-Security-Policy-Report-Only`：**只上报不拦截**，
 *          上线新策略前先用它跑一段时间，这是最稳妥的落地姿势。
 *        注意：上报接口必须限流（见 16 篇），否则会成为新的攻击面（日志洪水 / DoS）。
 *
 *    (5) Trusted Types（从根上防 DOM XSS）
 *        `require-trusted-types-for 'script'`
 *        开启后，把字符串赋给 innerHTML / eval / script.src 等"危险注入点"会直接抛 TypeError，
 *        必须先用 `trustedTypes.createType('policyName', {...})` 创建策略，
 *        由策略决定"什么样的字符串能变成 TrustedHTML"。
 *        价值：DOM XSS 的收口点从"每个赋值语句都要想一遍"变成"只有一个策略函数要审"。
 *        代价：需要改代码、生态兼容性有限（主要是 Chromium 系支持）。
 *
 *    (6) 其他关键指令（最容易被漏掉的两条）
 *        - `base-uri 'none'`（或 'self'）：不加的话，攻击者注入一个
 *          `<base href="https://evil.example/">`，页面里所有**相对路径**的脚本/样式的
 *          解析基准就都变了 —— 你以为在加载自己的 /js/app.js，实际加载了 evil 的。
 *        - `object-src 'none'`：禁掉 `<object>`/`<embed>`（老式 Flash/插件入口）。
 *        - `frame-ancestors 'none'`：防点击劫持（等价于 X-Frame-Options 但更灵活）。
 *        - `form-action 'self'`：限制表单提交目标，防"注入一个表单把数据寄到攻击者服务器"。
 *        - `upgrade-insecure-requests`：把 http 子资源升级为 https。
 *
 * 4. 常见陷阱
 *    - **`'unsafe-inline'` 与 nonce/hash 同时出现时，nonce/hash 优先**：
 *      `script-src 'unsafe-inline' 'nonce-abc'` 在支持 CSP3 的浏览器里
 *      `'unsafe-inline'` 会被**忽略**，只有带 nonce 的脚本能跑。
 *      很多人以为"我加了 unsafe-inline 会更宽松"，实际是相反的效果 —— 这既是坑，也是渐进迁移的技巧。
 *    - 同一个 nonce 在多个响应间复用（比如写死在模板里）→ 等于没有 nonce。
 *    - 只靠 `script-src` 白名单，忽略了 JSONP 端点：
 *      白名单里任何一个域名暴露了 `?callback=` 这类"把输入当 JS 返回"的接口，
 *      攻击者就能用 `<script src="https://trusted.com/jsonp?callback=alert(1)">` 执行任意代码。
 *    - 忘了 `base-uri`，被 `<base>` 标签劫持；忘了 `object-src 'none'`，留下插件入口。
 *    - 直接在报告里信任 `Content-Security-Policy-Report-Only` 的"没有违规"结论：
 *      只覆盖了被触发的路径，不等于没有 XSS。
 *    - CSP 报告接口不做限流和内容校验，被用来打日志洪水或伪造上报。
 *    - 认为"我配了 CSP 所以 innerHTML 随便用"：CSP 管不住 DOM XSS 的数据流，
 *      只有 Trusted Types 才能从 API 层面收口。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/13_csp_advanced.js
 *
 * 【预期输出】
 *   启动一个本地 HTTP 服务（127.0.0.1，随机端口），真实下发含 nonce 的 CSP 响应头，
 *   打印实际响应头；用内置的"CSP 判定引擎"（按规范实现的最小模拟）逐条演示
 *   nonce / hash / strict-dynamic / unsafe-inline 优先级、JSONP 绕过、base 标签劫持；
 *   向本地上报端点发一条**模拟的**违规报告并打印。全程不访问外部网络，退出码 0。
 * ============================================================================
 */

import http from 'node:http';
import crypto from 'node:crypto';

// ============================================================================
// 小节 1：CSP 的定位与基础回顾
// ============================================================================
console.log('--- 1. CSP 的定位：最后一道网，不是第一道防线 ---');
console.log('  第一道：输出转义（02 篇）—— 让恶意内容进不了 HTML。');
console.log('  第二道：Trusted Types / 安全 API —— 让危险注入点在代码层面就用不了。');
console.log('  第三道：CSP —— 即使上面失守，让浏览器拒绝执行注入的脚本。');
console.log('  三者是叠加关系；只做 CSP 而不管转义，等于放任 XSS 去撞运气。');

console.log('\n  基础策略长这样（02 篇介绍过）：');
console.log("    default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'");
console.log('  但它有两个现实难题：');
console.log('    (a) 需要内联脚本（框架 bootstrap、埋点）→ 团队退让加 \'unsafe-inline\' → 防线归零。');
console.log('    (b) 需要第三方脚本（CDN、SDK）→ 白名单越加越长 → 白名单绕过风险。');
console.log('  本文件讲的就是解决这两个问题的进阶机制。');

// ============================================================================
// 小节 2：本地服务 —— 真实下发带 nonce 的 CSP 响应头
// ============================================================================
console.log('\n--- 2. 本地服务真实下发 CSP（含 per-response nonce） ---');

/** 模拟"页面模板里需要内联脚本"的真实场景：这段内容是我们自己写的、固定的 */
const TRUSTED_INLINE_SCRIPT = "window.__BOOT__ = { env: 'production' };";

/**
 * 为一次响应生成 nonce。
 * 必须用密码学安全随机数（见 09_secure_random.js），至少 16 字节。
 * @returns {string}
 */
function makeNonce() {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * 对一段脚本内容算 CSP hash（CSP 允许 sha256/384/512，不允许 md5/sha1）。
 * @param {string} content
 * @param {'sha256'|'sha384'|'sha512'} [algo]
 * @returns {string} 形如 'sha256-<base64>'
 */
function cspHash(content, algo = 'sha256') {
  return `${algo}-${crypto.createHash(algo).update(content, 'utf8').digest('base64')}`;
}

/** 收到的 CSP 违规报告（用于演示上报机制） */
const cspReports = [];

/**
 * 构造 CSP 响应头。
 * @param {object} o
 * @param {string} [o.nonce]
 * @param {boolean} [o.useStrictDynamic]
 * @param {boolean} [o.legacyFallback] 是否追加老浏览器回退用的 'unsafe-inline' https:
 * @param {boolean} [o.allowUnsafeInline] 是否错误地直接放开内联
 * @param {boolean} [o.trustedTypes]
 * @returns {string}
 */
function buildCsp(o = {}) {
  const scriptSrc = [];
  if (o.nonce) scriptSrc.push(`'nonce-${o.nonce}'`);
  if (o.useStrictDynamic) scriptSrc.push("'strict-dynamic'");
  if (o.legacyFallback) scriptSrc.push('https:', "'unsafe-inline'");
  if (o.allowUnsafeInline) scriptSrc.push("'unsafe-inline'");
  if (scriptSrc.length === 0) scriptSrc.push("'self'");
  const uniqueScriptSrc = [...new Set(scriptSrc)];

  const parts = [
    `default-src 'self'`,
    `script-src ${uniqueScriptSrc.join(' ')}`,
    `style-src 'self'${o.nonce ? ` 'nonce-${o.nonce}'` : ''}`,
    `img-src 'self' data:`,
    `connect-src 'self'`,
    `object-src 'none'`,
    `base-uri 'none'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
  ];
  if (o.trustedTypes) parts.push(`require-trusted-types-for 'script'`);
  parts.push('report-uri /csp-report');
  if (o.reportOnly) {
    // 仅上报模式：只改响应头的名字，策略内容不变
  }
  return parts.join('; ');
}

let server;
const port = await new Promise((resolve) => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');

    if (url.pathname === '/csp-report' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        cspReports.push(body);
        res.writeHead(204).end();
      });
      return;
    }

    // 每次请求都生成新的 nonce —— 这是 nonce 机制成立的前提
    const nonce = makeNonce();
    const csp = buildCsp({ nonce });
    const html = [
      '<!doctype html><html><head><meta charset="utf-8"><title>CSP demo</title>',
      // 注意 nonce 属性必须与响应头里的 nonce 完全一致
      `<script nonce="${nonce}">${TRUSTED_INLINE_SCRIPT}</script>`,
      '</head><body><h1>页面</h1></body></html>',
    ].join('\n');

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': csp,
      'Reporting-Endpoints': 'csp-endpoint="/csp-report"',
      'X-Demo-Nonce': nonce,
    });
    res.end(html);
  });
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const base = `http://127.0.0.1:${port}`;
console.log(`  本地服务已启动：${base}（127.0.0.1，随机端口）`);

const pageRes = await fetch(`${base}/`);
const actualCsp = pageRes.headers.get('content-security-policy');
console.log('\n  实际下发的响应头（真实取自 HTTP 响应）：');
console.log(`    Content-Security-Policy: ${actualCsp}`);
console.log(`    Reporting-Endpoints: ${pageRes.headers.get('reporting-endpoints')}`);
console.log(`    X-Demo-Nonce: ${pageRes.headers.get('x-demo-nonce')}（仅演示用，真实项目不要把 nonce 放到别的头里）`);

const firstNonce = pageRes.headers.get('x-demo-nonce');
const secondRes = await fetch(`${base}/`);
const secondNonce = secondRes.headers.get('x-demo-nonce');
console.log(`\n  nonce 每个响应都不同：第一次=${firstNonce.slice(0, 12)}... 第二次=${secondNonce.slice(0, 12)}...`);
console.log(`    ${firstNonce !== secondNonce ? '✓ 不同 —— 正确' : '✗ 相同 —— 严重错误，nonce 必须逐响应变化'}`);

// ============================================================================
// 小节 3：内置"CSP 判定引擎" —— 按规范最小实现 script-src 的决策逻辑
// ============================================================================
console.log('\n--- 3. 用内置的 CSP 判定引擎逐条验证规则 ---');
console.log('  说明：真实浏览器行为更复杂（还要考虑 preload、链式信任、元素类型差异），');
console.log('        下面是按 CSP3 规范实现的【最小可用】判定，只覆盖本文件要讲的规则。');

/**
 * 解析 CSP 文本为 {directive: [值...]}。
 * @param {string} csp
 * @returns {Record<string, string[]>}
 */
function parseCsp(csp) {
  const out = {};
  for (const part of csp.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;
    out[tokens[0].toLowerCase()] = tokens.slice(1);
  }
  return out;
}

/**
 * 判断一段 <script> 能否执行。
 * @param {string} csp
 * @param {{kind:'inline'|'external', content?:string, src?:string, nonce?:string, dynamicByTrusted?:boolean}} script
 * @returns {{allowed:boolean, reason:string}}
 */
function cspAllowsScript(csp, script) {
  const d = parseCsp(csp);
  // script-src 缺失时回退到 default-src；都没有则不受限
  const src = d['script-src'] ?? d['default-src'];
  if (!src) return { allowed: true, reason: '策略未限制脚本（既无 script-src 也无 default-src）' };
  if (src.includes("'none'")) return { allowed: false, reason: "script-src 为 'none'" };

  const nonces = src.filter((s) => s.toLowerCase().startsWith("'nonce-")).map((s) => s.slice(7, -1));
  const hashes = src.filter((s) => /^'sha(256|384|512)-/i.test(s)).map((s) => s.slice(1, -1));
  const strictDynamic = src.some((s) => s.toLowerCase() === "'strict-dynamic'");
  const unsafeInline = src.some((s) => s.toLowerCase() === "'unsafe-inline'");
  // 关键规则：只要出现了 nonce 或 hash，'unsafe-inline' 就被忽略
  const unsafeInlineEffective = unsafeInline && nonces.length === 0 && hashes.length === 0;

  const nonceOk = script.nonce && nonces.includes(script.nonce);
  const hashOk = script.content && hashes.includes(cspHash(script.content));

  if (script.kind === 'inline') {
    if (nonceOk) return { allowed: true, reason: `nonce 匹配（${script.nonce.slice(0, 10)}...）` };
    if (hashOk) return { allowed: true, reason: '内容 hash 在内联白名单里' };
    if (unsafeInlineEffective) return { allowed: true, reason: "'unsafe-inline' 生效（策略中没有 nonce/hash）" };
    if (unsafeInline && (nonces.length > 0 || hashes.length > 0)) {
      return { allowed: false, reason: "策略含 nonce/hash，'unsafe-inline' 被忽略" };
    }
    return { allowed: false, reason: '内联脚本没有 nonce，也没有匹配的 hash' };
  }

  // external
  if (nonceOk) return { allowed: true, reason: '外部脚本带正确 nonce' };
  if (strictDynamic && script.dynamicByTrusted) {
    return { allowed: true, reason: "'strict-dynamic'：由可信脚本动态创建的脚本获得信任" };
  }
  if (strictDynamic) {
    return {
      allowed: false,
      reason: "'strict-dynamic' 生效时会忽略域名白名单，且该脚本不是受信脚本动态创建的",
    };
  }
  if (script.src) {
    const u = new URL(script.src);
    const origin = `${u.protocol}//${u.host}`;
    if (src.includes("'self'") && origin === new URL(base).origin) {
      return { allowed: true, reason: "'self' 匹配" };
    }
    if (src.includes(origin)) return { allowed: true, reason: `域名白名单命中 ${origin}` };
    if (src.some((s) => s === 'https:' && u.protocol === 'https:')) {
      return { allowed: true, reason: "白名单含 'https:'，任意 https 源都放行（过于宽松）" };
    }
  }
  if (unsafeInlineEffective) {
    return { allowed: true, reason: "'unsafe-inline' 生效（注意：它也放过内联脚本）" };
  }
  return { allowed: false, reason: '不匹配任何来源' };
}

/** 打印一条判定结果 */
function judge(label, csp, script) {
  const r = cspAllowsScript(csp, script);
  console.log(`  ${r.allowed ? '执行' : '拦截'} | ${label}`);
  console.log(`       理由：${r.reason}`);
  return r;
}

console.log('\n  (a) 只用 nonce：自己的内联脚本能跑，注入的不能');
const cspNonce = buildCsp({ nonce: 'AAAA' });
judge('我们自己的内联脚本（带正确 nonce）', cspNonce, { kind: 'inline', content: TRUSTED_INLINE_SCRIPT, nonce: 'AAAA' });
judge('攻击者注入的 <script>alert(1)</script>', cspNonce, { kind: 'inline', content: 'alert(1)' });

console.log('\n  (b) 只用 hash：适合内容固定的内联脚本');
const cspHashOnly = `script-src 'self' '${cspHash(TRUSTED_INLINE_SCRIPT)}'`;
console.log(`        策略：${cspHashOnly}`);
judge('内容一字不差的内联脚本', cspHashOnly, { kind: 'inline', content: TRUSTED_INLINE_SCRIPT });
judge('内容被改过一个字符的内联脚本', cspHashOnly, { kind: 'inline', content: TRUSTED_INLINE_SCRIPT + ' ' });
judge('攻击者注入的脚本', cspHashOnly, { kind: 'inline', content: 'alert(1)' });

console.log("\n  (c) 'unsafe-inline' 与 nonce 共存：nonce 优先（不是更宽松，而是更严格）");
const cspMixed = buildCsp({ nonce: 'AAAA', allowUnsafeInline: true, legacyFallback: true });
console.log(`        策略：${cspMixed}`);
judge('带正确 nonce 的脚本', cspMixed, { kind: 'inline', content: TRUSTED_INLINE_SCRIPT, nonce: 'AAAA' });
judge('注入的无 nonce 脚本（以为 unsafe-inline 会放它）', cspMixed, { kind: 'inline', content: 'alert(1)' });

console.log('\n  (d) strict-dynamic：忽略域名白名单，只信「可信脚本动态创建」的脚本');
const cspSd = `default-src 'self'; script-src 'nonce-AAAA' 'strict-dynamic'`;
console.log(`        策略：${cspSd}`);
judge('可信脚本动态创建的 SDK 脚本', cspSd, { kind: 'external', src: 'https://cdn.partner.com/sdk.js', dynamicByTrusted: true });
judge('攻击者直接注入 <script src="https://cdn.partner.com/sdk.js">', cspSd, {
  kind: 'external',
  src: 'https://cdn.partner.com/sdk.js',
});
console.log('    → strict-dynamic 下"白名单域名"本身不再被信任，必须由可信脚本动态插入才行。');
console.log('      这也是它比"域名白名单"更能挡住 JSONP 类绕过的原因。');

// ============================================================================
// 小节 4：常见绕过与失效配置
// ============================================================================
console.log('\n--- 4. 常见绕过与失效配置 ---');

console.log('\n  (a) JSONP 端点绕过：白名单里的域名能把用户输入当 JS 返回');
const cspJsonpWhite = `default-src 'self'; script-src 'self' https://trusted-cdn.example`;
console.log(`        策略：${cspJsonpWhite}`);
const jsonpSrc = 'https://trusted-cdn.example/jsonp?callback=alert(document.cookie)';
judge(`攻击者注入 <script src="${jsonpSrc.slice(0, 60)}...">`, cspJsonpWhite, { kind: 'external', src: jsonpSrc });
console.log('        服务端返回：alert(document.cookie)({...})  ← 输入被原样当成 JS 代码执行');
console.log('        防御：改用 strict-dynamic + nonce；或彻底下线 JSONP 端点（换成 CORS 的 JSON API，见 12 篇）。');
console.log('        教训：CSP 白名单的可信度 = 该域名上"有没有把输入当代码返回"的接口。');

console.log('\n  (b) base 标签劫持：忘了 base-uri 的后果');
/** 模拟浏览器对相对 URL 的解析 */
function resolveRelative(href, baseHref) {
  return new URL(href, baseHref).href;
}
const relativeScript = '/js/app.js';
console.log(`        页面里有 <script src="${relativeScript}">`);
console.log(`        正常情况（无 <base>）：${resolveRelative(relativeScript, `${base}/page`)}`);
console.log(`        攻击者注入 <base href="https://evil.example/"> 之后：${resolveRelative(relativeScript, 'https://evil.example/')}`);
console.log('        → 相对路径的脚本被解析到了攻击者的服务器上，等于完全接管页面。');
console.log("        防御：策略里必须写 base-uri 'none'（或 'self'）。");

console.log('\n  (c) 其他失效配置对照表（策略片段 → 问题）');
const badConfigs = [
  [`script-src *`, '允许任意源的脚本，CSP 形同虚设'],
  [`script-src 'unsafe-inline' 'unsafe-eval'`, "允许内联与 eval，XSS 完全不受限（05 篇讲过 eval 的危害）"],
  [`script-src 'self' https:`, "'https:' 放行了整个互联网的 https 源，等于没白名单"],
  [`script-src 'nonce-固定值'`, 'nonce 在多个响应间复用，攻击者可以复用同一个值'],
  [`default-src 'self'（无 object-src）`, "<object>/<embed> 入口未关，老式插件攻击面仍在"],
  ['（无 base-uri）', '<base> 标签劫持，相对路径全被重定向'],
  ['（无 form-action）', '注入的表单可以把用户数据提交到攻击者的服务器'],
  ['（无 frame-ancestors）', '页面可被任意站点 iframe 嵌入，点击劫持'],
];
for (const [cfg, problem] of badConfigs) {
  console.log(`    ${cfg}`);
  console.log(`      └─ ${problem}`);
}

// ============================================================================
// 小节 5：Trusted Types —— 从 API 层面收口 DOM XSS
// ============================================================================
console.log('\n--- 5. Trusted Types：require-trusted-types-for \'script\' ---');
console.log('  开启后，把普通字符串赋给危险注入点会直接抛 TypeError：');
console.log('    element.innerHTML = userInput;              // ✗ TypeError');
console.log('    element.innerHTML = policy.createHTML(...); // ✓ 只能通过策略');
console.log('  价值：DOM XSS 的审查面从"每一处 innerHTML"收敛到"唯一的策略函数"。');

/**
 * 一个极小的 Trusted Types 模拟：只用来说明"字符串被拒绝、策略产物被接受"。
 * 真实实现由浏览器提供（window.trustedTypes），这里不修改任何全局原型。
 */
class MiniTrustedTypesPolicy {
  /**
   * @param {string} name 策略名（必须在 CSP 中声明 trusted-types <name>）
   * @param {(s: string) => string} sanitizer 清洗函数：决定什么样的字符串能通过
   */
  constructor(name, sanitizer) {
    this.name = name;
    this.sanitizer = sanitizer;
  }

  /** 等价于真实 API 的 policy.createHTML() */
  createHTML(input) {
    const cleaned = this.sanitizer(String(input));
    return { __trustedHTML: true, value: cleaned, policy: this.name };
  }
}

/** 一个"只允许纯文本"的最严策略：把标签全部转义，等价于永不产生 HTML 标签 */
const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safePolicy = new MiniTrustedTypesPolicy('default', escapeHtml);

/**
 * 模拟一个"受 Trusted Types 保护"的 DOM 注入点。
 * @param {unknown} value
 * @returns {string}
 */
function trustedInnerHtmlSink(value) {
  if (typeof value === 'string') {
    // 这正是浏览器在 require-trusted-types-for 'script' 下的行为
    return '✗ 抛出 TypeError：需要 TrustedHTML，收到字符串（这正是我们想要的效果）';
  }
  if (value && value.__trustedHTML) {
    return `✓ 接受策略 ${value.policy} 的产物：${value.value}`;
  }
  return '✗ 类型不合法';
}

for (const [label, value] of [
  ['直接赋值用户输入的字符串', "<img src=x onerror=alert(1)>"],
  ['赋值策略清洗后的产物', safePolicy.createHTML('<img src=x onerror=alert(1)>')],
]) {
  console.log(`    ${label} -> ${trustedInnerHtmlSink(value)}`);
}
console.log('  注意：Trusted Types 不是"自动转义"，它逼你**显式声明**一个清洗策略。');
console.log('        策略本身写错了照样有洞 —— 但它把风险集中到了一个可审查、可测试的位置。');

// ============================================================================
// 小节 6：违规上报（report-uri / report-to / Report-Only）
// ============================================================================
console.log('\n--- 6. 违规上报：report-uri / report-to / Report-Only ---');
console.log('  两种上报头：');
console.log("    report-uri /csp-report        —— 老写法，已废弃但兼容性最好");
console.log('    Reporting-Endpoints: csp-endpoint="..." + report-to csp-endpoint  —— 新标准');
console.log('  上线姿势：先用 Content-Security-Policy-Report-Only 只上报不拦截，观察一段时间再切换成拦截模式。');

// 构造一条符合规范的违规报告（模拟浏览器会 POST 的内容），发到我们自己的本地端点。
// 这里【只发一条】，且端点在 127.0.0.1 上 —— 真实世界的上报量会很大，所以接口必须限流。
const violationReport = {
  'csp-report': {
    'document-uri': `${base}/page`,
    referrer: '',
    'violated-directive': 'script-src',
    'effective-directive': 'script-src',
    'original-policy': actualCsp,
    disposition: 'enforce',
    'blocked-uri': 'https://evil.example/inject.js',
    'line-number': 42,
    'column-number': 7,
    'source-file': `${base}/page`,
    'status-code': 200,
    'script-sample': 'alert(1)',
  },
};

const reportRes = await fetch(`${base}/csp-report`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/csp-report' },
  body: JSON.stringify(violationReport),
});
console.log(`\n  向本地端点 POST 一条模拟违规报告 -> HTTP ${reportRes.status}`);
console.log('  服务端收到的报告（这就是浏览器会发给你的原始数据）：');
console.log(JSON.stringify(violationReport, null, 2).split('\n').map((l) => '    ' + l).join('\n'));
console.log(`  本地端点已累计收到 ${cspReports.length} 条报告。`);
console.log('  实用建议：');
console.log('    1) 报告要落盘/入监控，但**必须限流**（16 篇），否则会被刷成日志洪水。');
console.log('    2) 报告里的 script-sample 是攻击者可控的，展示时务必转义（02 篇），否则监控面板自己就成了 XSS 靶子。');
console.log('    3) 报告量突然暴增往往意味着有人在扫你的站点，也可能是新策略写错了。');

// ============================================================================
// 小节 7：渐进落地路线（从最松到最严）
// ============================================================================
console.log('\n--- 7. CSP 的渐进落地路线 ---');
const roadmap = [
  ['阶段 0', "Content-Security-Policy-Report-Only: default-src 'self'", '只上报，观察现有页面有多少违规'],
  ['阶段 1', "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'", '先开这些"不影响业务"的隔离指令'],
  ['阶段 2', "script-src 'self' 'nonce-<每次随机>'", '把内联脚本改成带 nonce，去掉 unsafe-inline'],
  ['阶段 3', "script-src 'nonce-xxx' 'strict-dynamic' https: 'unsafe-inline'", "新浏览器走 nonce，老浏览器回退（渐进迁移技巧）"],
  ['阶段 4', "script-src 'nonce-xxx' 'strict-dynamic'; require-trusted-types-for 'script'", '上 Trusted Types，收口 DOM XSS'],
  ['阶段 5', '切换到强制模式，删掉回退项，持续监控上报', '长期维护：策略变更要跟着代码评审一起走'],
];
for (const [stage, policy, note] of roadmap) {
  console.log(`  ${stage}`);
  console.log(`    策略：${policy}`);
  console.log(`    说明：${note}`);
}

// ============================================================================
// 小节 8：小结
// ============================================================================
console.log('\n--- 8. 小结 ---');
console.log('  1) CSP 是最后一道网：它限制 XSS 的威力，不替代输出转义与安全 API。');
console.log('  2) nonce 必须逐响应随机（crypto.randomBytes），不能复用，也不能放到别的地方。');
console.log("  3) 'unsafe-inline' 与 nonce/hash 共存时 nonce/hash 优先 —— 这是坑，也是迁移技巧。");
console.log('  4) strict-dynamic 让你不再维护 CDN 白名单，从而消灭 JSONP 类白名单绕过。');
console.log("  5) base-uri 'none' 与 object-src 'none' 是最容易被漏掉、又最容易被打的两条。");
console.log('  6) Trusted Types 把 DOM XSS 的审查面从"到处 innerHTML"收敛到一个策略函数。');
console.log('  7) 上报（report-uri / report-to）是落地的关键工具：先 Report-Only，再强制。');
console.log('  8) 上报接口本身也要限流 + 转义展示，否则监控面成了新的攻击面。');

await new Promise((r) => server.close(r));
console.log('\n[清理] 本地服务已关闭。示例结束，退出码 0。');
