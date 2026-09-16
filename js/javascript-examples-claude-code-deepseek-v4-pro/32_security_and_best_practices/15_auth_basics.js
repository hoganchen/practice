/**
 * ============================================================================
 * 知识点：认证与授权基础 —— 会话 vs JWT、密码存储、OAuth 2.0 的定位
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/11_csrf.js、32_security_and_best_practices/09_secure_random.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *
 *    (1) 认证（Authentication，AuthN）：「你是谁」。登录、验证密码、验证 TOTP 验证码、
 *        验证指纹，都是在证明"我就是我声称的那个人"。
 *    (2) 授权（Authorization，AuthZ）：「你能做什么」。这个用户能不能删这条记录、
 *        能不能看别人的订单、是不是管理员。
 *
 *    两者是**严格的先后关系**：先认证（确定身份）→ 再授权（判断权限）。
 *    混为一谈的典型后果就是**越权访问**（IDOR）：
 *    "URL 里带了订单 id 就是我的订单吧" —— 认证过了不等于有权限访问这条数据。
 *    OWASP Top 10 里的 A01（Broken Access Control）常年排第一，根因基本都是这里。
 *
 *    还有一个常被忽略的第三层：**会话管理（Session Management）**。
 *    认证成功后，怎么"记住"这个状态？这就是会话 Cookie 与 JWT 的分野。
 *
 *    (3) 密码存储：认证里最基础也最容易做错的一环。绝对不能明文存，
 *        也不该用"快哈希"（MD5/SHA）存，必须用"慢哈希 + 随机盐"。
 *
 *    (4) OAuth 2.0：一个**授权框架**（"允许 A 应用访问我在 B 上的部分数据"），
 *        **不是认证协议**。想用它做认证（"用微信登录"）需要基于它的 **OIDC**
 *        （OpenID Connect）层才有身份信息。
 *
 * 2. 为什么需要（真实攻击场景）
 *    (a) **越权**：`GET /api/orders/1002` 只校验"已登录"，不校验"这单是不是你的"，
 *        攻击者把 id 从 1001 遍历到 9999 就能拖走全站订单。
 *    (b) **JWT 误用**：
 *        - 服务端接受 `alg: none` → 攻击者把签名去掉、把 role 改成 admin，直接通过；
 *        - 密钥是 `secret` / `123456` → 离线爆破几秒就出结果，然后就可随意伪造任意用户；
 *        - 只做 base64 解码不校验签名 → 等同于把身份写在明信片上；
 *        - 把敏感信息（身份证号、密码）塞进 payload → payload 只是 base64，**不是加密**；
 *        - 有效期设成 30 天且无法撤销 → 令牌泄漏后无法止损。
 *    (c) **密码存储不当**：数据库被拖库后，明文/弱哈希的密码会被拿去撞库其他站点；
 *        用户在其他网站的账号因此连带失守（撞库是黑产最稳定的收入来源之一）。
 *    (d) **OAuth 误用**：把 access_token 当成"身份凭证"直接信任、
 *        只用 OAuth 做认证却不校验 state（CSRF）与 PKCE（授权码拦截）。
 *
 * 3. 核心语法要点
 *
 *    (1) 会话 Cookie（有状态）
 *        服务端存 session（内存 / Redis / 数据库），Cookie 里只放一个随机 sessionId。
 *        优点：可随时撤销（删掉服务端记录即可）、能存任意多信息、对客户端透明。
 *        缺点：需要共享存储（多实例要 Redis）、每次请求都要查一次存储。
 *        要点：sessionId 必须密码学随机（见 09 篇）；Cookie 要 HttpOnly + Secure + SameSite。
 *
 *    (2) JWT（JSON Web Token，无状态）
 *        结构：`base64url(header).base64url(payload).base64url(signature)`，三段用 `.` 连接。
 *          header:  {"alg":"HS256","typ":"JWT"}
 *          payload: {"sub":"u_1","role":"user","exp":1735689600}
 *          signature: HMAC-SHA256(base64url(header) + "." + base64url(payload), secret)
 *        优点：服务端不存状态、跨服务传递方便、适合短时效的场景。
 *        缺点：**无法主动撤销**（签发出去就有效到过期）、payload 明文可读、
 *              一旦泄漏就只能等过期（所以有效期必须短 + 配 refresh token）。
 *        安全要点：
 *          - 服务端**必须指定**期望的算法（HS256 / RS256），绝不能让客户端决定 alg；
 *          - 明确拒绝 `alg: none`；
 *          - 密钥必须高熵（≥32 字节随机），绝不能是字典词；
 *          - 必须校验签名、exp、nbf、iss、aud；
 *          - payload 里只放非敏感、必要的信息（用户 id、角色、过期时间）。
 *
 *    (3) 密码存储：为什么必须"加盐 + 慢哈希"
 *        - 明文：拖库即全损，还会连带其他站点。
 *        - MD5 / SHA-256（快哈希）：现代 GPU 每秒能算几十亿次，8 位密码几小时就穷尽；
 *          更致命的是**不加盐**时，相同密码得到相同哈希 —— 一张彩虹表通杀，
 *          而且在数据库里"哪些用户用同一个密码"一目了然。
 *        - 加盐：给每个用户一个唯一的随机盐，让相同密码得到不同哈希，
 *          使彩虹表失效、让攻击者必须逐个用户单独爆破。
 *        - 慢哈希（bcrypt / scrypt / argon2）：把单次计算成本提高到毫秒级，
 *          让"每秒几十亿次"降到"每秒几百次"，把爆破成本拉到不可承受。
 *          · bcrypt：老牌、成熟、生态最广；注意它有 72 字节输入上限。
 *          · scrypt：内存硬（memory-hard），抗 GPU/ASIC；Node **内置**（node:crypto）。
 *          · argon2：密码哈希竞赛冠军，抗 GPU 能力最强，是当前的首选；Node 需装包。
 *        - 校验必须用**恒定时间比较**（crypto.timingSafeEqual），避免时序侧信道。
 *
 *    (4) OAuth 2.0 的定位
 *        角色：资源所有者（用户）、客户端（你的应用）、授权服务器、资源服务器。
 *        最常用的授权码模式（Authorization Code）流程：
 *          客户端把用户重定向到授权服务器 → 用户同意 → 带 code 回调 →
 *          客户端用 code 换 access_token → 用 token 访问资源。
 *        安全要点：
 *          - **state**：随机值，回跳时校验，防 CSRF；
 *          - **PKCE**：code_challenge / code_verifier，防授权码被拦截后冒用（公共客户端必用）；
 *          - access_token 是"授权凭证"不是"身份凭证"，要知道用户是谁请用 OIDC 的 id_token；
 *          - redirect_uri 必须严格白名单精确匹配，否则会被用来偷 code。
 *        **不要自己实现 OAuth 服务器**，用成熟库 / 成熟服务。
 *
 * 4. 常见陷阱
 *    - 「认证过了就是我的」→ 越权。**每一个访问对象的接口都要单独鉴权**。
 *    - 把 JWT 当成"安全凭证"塞进 localStorage（XSS 直接被偷，见 11 篇小节 7）。
 *    - 以为 JWT payload 是加密的（其实只是 base64，等于明文）。
 *    - 用 `jwt.decode()`（只解码不校验）做鉴权 —— 这是最常见的致命错误。
 *    - 自己实现密码哈希（如 `sha256(password + salt)`）而不加迭代/内存成本。
 *    - 盐用固定值（如用户名）或全站一个盐：前者可预测，后者无法防彩虹表批量破解。
 *    - 忘记给密码哈希设置"可升级"标记，导致算法升级时无法平滑迁移老用户。
 *    - 登录接口没有限流（见 16 篇），密码再强也挡不住在线爆破。
 *    - 错误信息区分"用户不存在"与"密码错误"→ 用户名枚举。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/15_auth_basics.js
 *
 * 【预期输出】
 *   起一个本地认证服务（127.0.0.1，随机端口），对比会话 Cookie 与 JWT 两种方案；
 *   演示 JWT 的四类错误（篡改 payload、alg:none、弱密钥爆破、过期）；
 *   用 node:crypto 的 scrypt 演示加盐哈希与恒定时间校验，并对比快哈希与慢哈希的耗时；
 *   全程只操作内存里的模拟数据，不连任何真实认证服务，退出码 0。
 * ============================================================================
 */

import http from 'node:http';
import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(crypto.scrypt);

// ============================================================================
// 小节 1：认证 vs 授权
// ============================================================================
console.log('--- 1. 认证（AuthN）vs 授权（AuthZ） ---');
for (const [term, en, question, example, fails] of [
  ['认证', 'Authentication', '你是谁？', '登录：账号 + 密码 / 验证码 / 指纹 / SSO', '未登录就能访问 → 认证失效'],
  ['授权', 'Authorization', '你能做什么？', '这个用户能不能删这条记录、是不是管理员', '登录了但不是你的数据 → 越权（IDOR）'],
  ['会话管理', 'Session Management', '认证成功后怎么记住你？', 'Session Cookie / JWT', '令牌泄漏或无法撤销 → 身份被盗用'],
]) {
  console.log(`  ${term}（${en}）`);
  console.log(`    回答的问题：${question}`);
  console.log(`    典型形态　：${example}`);
  console.log(`    做错了会　：${fails}`);
}
console.log('\n  记忆口诀：**先认证，再授权，每个对象都要单独授权**。');
console.log('  「登录了」只是一个布尔事实，它绝不蕴含「这条数据属于你」。');
console.log('  OWASP Top 10 的第一名长期是"访问控制失效"，根因就是这句话被忽略。');

/** 一个极小的权限模型，用来说明"认证 ≠ 授权" */
const fakeDb = {
  users: [
    { id: 'u_1', name: '小明', role: 'user' },
    { id: 'u_2', name: '小红', role: 'user' },
    { id: 'u_admin', name: '管理员', role: 'admin' },
  ],
  orders: [
    { id: 1001, ownerId: 'u_1', amount: 99 },
    { id: 1002, ownerId: 'u_2', amount: 199 },
  ],
};

/**
 * 反面教材：只校验"已登录"，不校验"这条订单是不是你的"。
 * @param {{id:string}} sessionUser
 * @param {number} orderId
 * @returns {{status:number, body:object}}
 */
function vulnerableGetOrder(sessionUser, orderId) {
  if (!sessionUser) return { status: 401, body: { message: '请先登录' } };
  const order = fakeDb.orders.find((o) => o.id === orderId);
  if (!order) return { status: 404, body: { message: '订单不存在' } };
  return { status: 200, body: order }; // ← 没检查 ownerId，越权
}

/**
 * 正确做法：认证之后，**针对这个对象**再判一次权限。
 * @param {{id:string, role:string}} sessionUser
 * @param {number} orderId
 * @returns {{status:number, body:object}}
 */
function safeGetOrder(sessionUser, orderId) {
  if (!sessionUser) return { status: 401, body: { message: '请先登录' } };
  const order = fakeDb.orders.find((o) => o.id === orderId);
  if (!order) return { status: 404, body: { message: '订单不存在' } };
  const isOwner = order.ownerId === sessionUser.id;
  const isAdmin = sessionUser.role === 'admin';
  if (!isOwner && !isAdmin) {
    // 注意：对"无权访问"与"不存在"都应返回 404，避免泄漏"这条记录存在"这个信息
    return { status: 404, body: { message: '订单不存在' } };
  }
  return { status: 200, body: order };
}

const attacker = fakeDb.users.find((u) => u.id === 'u_1'); // 小明已登录
console.log('\n  已登录的小明（u_1）尝试读取小红（u_2）的订单 1002：');
console.log(`    无授权的实现 -> ${vulnerableGetOrder(attacker, 1002).status} ${JSON.stringify(vulnerableGetOrder(attacker, 1002).body)}`);
console.log(`    有授权的实现 -> ${safeGetOrder(attacker, 1002).status} ${JSON.stringify(safeGetOrder(attacker, 1002).body)}`);
console.log('    ↑ 同一个"已登录"状态，两种实现的差别就是"越权"与"没越权"。');

// ============================================================================
// 小节 2：JWT 的原理 —— 手写一个最小实现（只是为了看清结构）
// ============================================================================
console.log('\n--- 2. JWT 的结构与签名原理（用 node:crypto 手写最小实现） ---');

/** base64url 编码（JWT 用的是 URL 安全变体：+ → -，/ → _，并去掉 = 填充） */
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
/** base64url 解码 */
const b64urlDecode = (str) => Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');

/**
 * 签发一个 HS256 的 JWT。
 * @param {object} payload
 * @param {string} secret
 * @param {string} [alg] 演示用，允许传入 'none' 来说明这个参数绝不能由客户端决定
 * @returns {string}
 */
function signJwt(payload, secret, alg = 'HS256') {
  const header = { alg, typ: 'JWT' };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  if (alg === 'none') return `${h}.${p}.`; // 无签名 —— 这正是漏洞所在
  const sig = b64url(crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest());
  return `${h}.${p}.${sig}`;
}

/**
 * 校验 JWT。**必须由服务端写死期望的算法**，绝不能读 header 里的 alg 来决定怎么验签。
 * @param {string} token
 * @param {string} secret
 * @param {{expectedAlg?:string}} [opts]
 * @returns {{valid:boolean, payload?:object, reason:string}}
 */
function verifyJwt(token, secret, opts = {}) {
  const expectedAlg = opts.expectedAlg ?? 'HS256';
  const parts = String(token).split('.');
  if (parts.length !== 3) return { valid: false, reason: '格式不是三段式' };
  const [h, p, sig] = parts;

  let header;
  let payload;
  try {
    header = JSON.parse(b64urlDecode(h));
    payload = JSON.parse(b64urlDecode(p));
  } catch {
    return { valid: false, reason: 'header/payload 不是合法 JSON' };
  }

  // 关键防御 1：算法必须与预期一致 —— 直接拒绝 alg:none
  if (header.alg !== expectedAlg) {
    return { valid: false, reason: `alg=${header.alg} 与预期的 ${expectedAlg} 不一致（拒绝，尤其是 alg:none）` };
  }
  // 关键防御 2：验签必须真的算一遍，并且用恒定时间比较
  const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest();
  const actual = Buffer.from(sig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return { valid: false, reason: '签名不匹配（payload 或 header 被改过）' };
  }
  // 关键防御 3：校验时间声明
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp === 'number' && now >= payload.exp) {
    return { valid: false, reason: `令牌已过期（exp=${payload.exp}，now=${now}）` };
  }

  return { valid: true, payload, reason: '签名有效' };
}

const JWT_SECRET = crypto.randomBytes(32).toString('base64url'); // 正确做法：高熵随机密钥
console.log(`  本次演示的服务端密钥（随机生成，32 字节）：${JWT_SECRET.slice(0, 12)}...`);
console.log('\n  JWT 的三段结构（用真实签发的令牌拆开看）：');
const token = signJwt(
  { sub: 'u_1', name: '小明', role: 'user', exp: Math.floor(Date.now() / 1000) + 3600 },
  JWT_SECRET
);
const [h1, p1, s1] = token.split('.');
console.log(`    header    : ${h1}`);
console.log(`    payload   : ${p1}`);
console.log(`    signature : ${s1}`);
console.log(`    header 解码 : ${b64urlDecode(h1)}`);
console.log(`    payload 解码：${b64urlDecode(p1)}`);
console.log('    ↑ 请注意：payload 只是 base64 编码，**任何人都能解开看**。它不是加密！');

// ============================================================================
// 小节 3：JWT 的五类典型错误（逐条演示）
// ============================================================================
console.log('\n--- 3. JWT 的典型错误用法 ---');

console.log('\n  (a) 篡改 payload：把 role 改成 admin');
const tamperedPayload = b64url(
  JSON.stringify({ sub: 'u_1', name: '小明', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 })
);
const tamperedToken = `${h1}.${tamperedPayload}.${s1}`;
console.log(`    篡改后的 payload 解码：${b64urlDecode(tamperedPayload)}`);
console.log(`    校验结果：${JSON.stringify(verifyJwt(tamperedToken, JWT_SECRET, { expectedAlg: 'HS256' }))}`);
console.log('    → 签名对不上，拒绝。这就是"必须验签"的价值。');

console.log('\n  (b) alg: none 攻击：把签名整段删掉，并声称"算法是 none"');
const noneToken = signJwt({ sub: 'u_1', role: 'admin' }, '', 'none');
console.log(`    token = ${noneToken}`);
console.log(`    服务端【正确实现】的校验结果：${JSON.stringify(verifyJwt(noneToken, JWT_SECRET))}`);
console.log('    → 因为服务端写死了 expectedAlg="HS256"，header 里的 alg="none" 直接不匹配就拒了。');
console.log('    反面教材（千万不要这么写）：');
console.log('      const header = JSON.parse(base64urlDecode(token.split(".")[0]));');
console.log('      if (header.alg === "none") return true;   // ← 这一行就是全站沦陷');

console.log('\n  (c) 弱密钥：攻击者拿到一个令牌后离线爆破密钥');
const weakSecret = 'secret'; // 反面教材：字典词
const weakToken = signJwt({ sub: 'u_1', role: 'user', exp: Math.floor(Date.now() / 1000) + 3600 }, weakSecret);
const dictionary = ['123456', 'password', 'secret', 'jwt', 'mykey', 'changeme', 'admin', 'test'];
console.log(`    假设服务端用了弱密钥 "${weakSecret}" 签发令牌`);
let cracked = null;
const crackStart = process.hrtime.bigint();
for (const guess of dictionary) {
  const r = verifyJwt(weakToken, guess);
  if (r.valid) {
    cracked = guess;
    break;
  }
}
const crackMs = Number(process.hrtime.bigint() - crackStart) / 1e6;
console.log(`    攻击者用一个 ${dictionary.length} 词的字典离线尝试：${cracked ? `命中密钥「${cracked}」` : '未命中'}（耗时 ${crackMs.toFixed(2)} ms）`);
console.log('    → 这只是 8 个词。真实字典是千万级，而攻击者可以完全离线、不受限流影响地跑。');
console.log('    → 密钥必须是 ≥32 字节的密码学随机值（crypto.randomBytes(32)），不是人能记住的词。');

console.log('\n  (d) 不校验签名（只 decode 不 verify）');
console.log('    常见错误代码：const payload = jwt.decode(token);  // 只解码，不验签');
const forged = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(
  JSON.stringify({ sub: 'u_admin', role: 'admin' })
)}.随便写点什么`;
console.log(`    攻击者用任意密钥签的令牌：${forged.slice(0, 70)}...`);
console.log(`    只 decode 不 verify 的结果：payload= ${b64urlDecode(forged.split('.')[1])} → 攻击者成功冒充管理员`);
console.log(`    正确做法（verify）的结果：${JSON.stringify(verifyJwt(forged, JWT_SECRET))}`);

console.log('\n  (e) 过期与撤销');
const expiredToken = signJwt(
  { sub: 'u_1', role: 'user', exp: Math.floor(Date.now() / 1000) - 10 },
  JWT_SECRET
);
console.log(`    已过期令牌的校验：${JSON.stringify(verifyJwt(expiredToken, JWT_SECRET))}`);
console.log('    → exp 必须校验。建议：access token 15 分钟，refresh token 7~30 天且可撤销。');
console.log('    → JWT 的固有问题：**签发后无法主动撤销**。缓解手段：');
console.log('      · 有效期尽量短；');
console.log('      · 维护一个"吊销名单"（jti 黑名单）—— 但这就又变成有状态了，等于放弃无状态的优点；');
console.log('      · 关键操作（改密码、转账）要求二次验证，不单纯依赖令牌；');
console.log('      · 用户改密码 / 登出时轮换签名密钥（会让所有令牌失效，代价大）。');

console.log('\n  JWT payload 里不该放什么：');
for (const bad of ['密码 / 密码哈希', '身份证号、银行卡号', '内部 IP、数据库连接串', '权限的完整列表（改名/加角色后不会同步）']) {
  console.log(`    ✗ ${bad}`);
}
console.log('  正确做法：只放 sub（用户 id）、角色、exp、jti，其余信息每次从服务端查。');

// ============================================================================
// 小节 4：会话 Cookie（有状态）vs JWT（无状态）
// ============================================================================
console.log('\n--- 4. 会话 Cookie vs JWT：一张取舍表 ---');
const compare = [
  ['状态存放', '服务端存储（内存/Redis/DB）', '客户端持有，服务端不存'],
  ['能否主动撤销', '能：删掉服务端记录即刻失效', '不能：只能等过期或维护黑名单'],
  ['横向扩展', '需要共享存储（Redis）', '天然适合多服务/多地域'],
  ['每请求开销', '查一次存储（通常很快）', '只做一次验签（CPU，很快）'],
  ['信息容量', '只放一个随机 id，信息全在服务端', 'payload 可放少量信息，但明文可读'],
  ['泄漏后果', '攻击者拿到 id 即可冒用（所以要 HttpOnly+Secure）', '同上；且因为无法撤销，止损更难'],
  ['适用场景', '传统 Web、需要即时踢人下线的后台', '微服务间传递身份、短时效 API 凭证'],
];
for (const [dim, sessionWay, jwtWay] of compare) {
  console.log(`  ${dim.padEnd(12)} | 会话：${sessionWay}`);
  console.log(`  ${' '.repeat(12)} | JWT ：${jwtWay}`);
}
console.log('\n  结论不是"谁更好"，而是：');
console.log('    · 用户登录态的默认选择仍是**服务端会话 + HttpOnly Cookie**（可撤销最重要）。');
console.log('    · JWT 更适合**服务间/短时效**的场景，或前后端分离下访问令牌放内存 + refresh token 放 Cookie。');
console.log('    · 无论哪种，都必须配 CSRF 防御（Cookie 方案）或防 XSS 偷取（内存方案）—— 见 11 篇。');

// ---- 本地服务：同时演示两种方案 ----
console.log('\n--- 4b. 本地服务实测：会话 Cookie 与 JWT 的登出行为差异 ---');

const sessions = new Map(); // sessionId -> { userId }
const users = [{ id: 'u_1', name: '小明', password: 'correct horse battery staple' }];

let server;
const port = await new Promise((resolve) => {
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
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
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };

    if (url.pathname === '/session-login') {
      const sid = crypto.randomBytes(24).toString('base64url');
      sessions.set(sid, { userId: 'u_1' });
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': `sid=${sid}; Path=/; HttpOnly; SameSite=Lax`,
      });
      return res.end(JSON.stringify({ message: '会话登录成功' }));
    }
    if (url.pathname === '/session-me') {
      const s = sessions.get(cookies.sid);
      if (!s) return send(401, { message: '未登录或会话已失效' });
      return send(200, { userId: s.userId, name: '小明' });
    }
    if (url.pathname === '/session-logout') {
      sessions.delete(cookies.sid); // 服务端删掉记录 —— 立刻失效
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Set-Cookie': 'sid=; Path=/; Max-Age=0',
      });
      return res.end(JSON.stringify({ message: '已登出' }));
    }
    if (url.pathname === '/jwt-login') {
      const t = signJwt({ sub: 'u_1', name: '小明', exp: Math.floor(Date.now() / 1000) + 3600 }, JWT_SECRET);
      return send(200, { token: t });
    }
    if (url.pathname === '/jwt-me') {
      const auth = req.headers.authorization || '';
      const r = verifyJwt(auth.replace(/^Bearer\s+/i, ''), JWT_SECRET);
      if (!r.valid) return send(401, { message: `令牌无效：${r.reason}` });
      return send(200, { userId: r.payload.sub, name: r.payload.name });
    }
    if (url.pathname === '/jwt-logout') {
      // JWT 是"自包含"的，服务端没有它的记录，所以这里什么也做不了
      return send(200, { message: '客户端把令牌丢掉即可（服务端无法让它立刻失效）' });
    }
    send(404, { message: 'not found' });
  });
  server.listen(0, '127.0.0.1', () => resolve(server.address().port));
});
const base = `http://127.0.0.1:${port}`;
console.log(`  本地认证服务已启动：${base}（127.0.0.1，随机端口，内存存储）`);

/** 极小的 cookie jar，模拟浏览器 */
const jar = new Map();
const parseSetCookie = (res) => {
  for (const raw of res.headers.getSetCookie ? res.headers.getSetCookie() : []) {
    const [pair] = raw.split(';');
    const i = pair.indexOf('=');
    jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
};
const cookieHeader = () => (jar.size ? { Cookie: [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ') } : {});

console.log('\n  【会话方案】');
const sl = await fetch(`${base}/session-login`);
parseSetCookie(sl);
console.log(`    登录：${JSON.stringify(await sl.json())}，浏览器持有 sid=${[...jar.get('sid')].slice(0, 8).join('')}...`);
const me1 = await fetch(`${base}/session-me`, { headers: cookieHeader() });
console.log(`    访问 /session-me：${me1.status} ${await me1.text()}`);
await fetch(`${base}/session-logout`, { headers: cookieHeader() }).then(parseSetCookie);
const me2 = await fetch(`${base}/session-me`, { headers: cookieHeader() });
console.log(`    登出后访问 /session-me：${me2.status} ${await me2.text()}`);
console.log('    → 会话可以在服务端被【立刻作废】，这是它最大的优势（踢人下线、改密码后失效）。');

console.log('\n  【JWT 方案】');
const jl = await fetch(`${base}/jwt-login`);
const { token: accessToken } = await jl.json();
console.log(`    登录拿到令牌：${accessToken.slice(0, 40)}...`);
const jme1 = await fetch(`${base}/jwt-me`, { headers: { Authorization: `Bearer ${accessToken}` } });
console.log(`    访问 /jwt-me：${jme1.status} ${await jme1.text()}`);
const logoutBody = await (await fetch(`${base}/jwt-logout`, { headers: { Authorization: `Bearer ${accessToken}` } })).json();
console.log(`    登出：${JSON.stringify(logoutBody)}`);
const jme2 = await fetch(`${base}/jwt-me`, { headers: { Authorization: `Bearer ${accessToken}` } });
console.log(`    "登出"后再访问 /jwt-me：${jme2.status} ${await jme2.text()}`);
console.log('    → 令牌依旧有效！这就是"无法主动撤销"：只要没过期，谁拿着它都能用。');
console.log('    → 所以 JWT 的有效期必须短，且敏感操作要额外校验（重新输密码 / TOTP）。');

// ============================================================================
// 小节 5：密码存储 —— 从错误做法到正确做法
// ============================================================================
console.log('\n--- 5. 密码存储：为什么不能明文 / MD5 / 裸 SHA ---');

const demoPassword = 'hunter2';
const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

console.log(`  同一个密码 "${demoPassword}" 用不同方式存储的结果：`);
console.log(`    明文      ：${demoPassword}     ← 拖库即全损`);
console.log(`    MD5       ：${md5(demoPassword)}`);
console.log(`    SHA-256   ：${sha256(demoPassword)}`);
console.log('    MD5 与 SHA-256 的问题不是"能不能反解"，而是：');
console.log('      1) 太快：GPU 每秒可算几十亿次，短密码瞬间穷尽；');
console.log('      2) 不加盐时确定性：相同密码 → 相同哈希。');
console.log('         看下面两个"用户"，密码相同，库里哈希也一模一样：');
console.log(`           userA 的密码 "123456" -> ${sha256('123456').slice(0, 24)}...`);
console.log(`           userB 的密码 "123456" -> ${sha256('123456').slice(0, 24)}...`);
console.log('         → 一张彩虹表通杀，而且一眼能看出"谁和谁用了同一个密码"。');

console.log('\n  加盐（salt）：给每个用户一个唯一随机盐');
console.log('    存储的是 salt + hash，校验时用同一个 salt 重算。');
console.log('    效果：相同密码 → 不同哈希；彩虹表失效；攻击者必须逐个用户单独爆破。');
console.log('    注意：盐不需要保密，但必须**每个用户唯一且随机**（不能用用户名、不能用全站固定值）。');

console.log('\n  慢哈希（scrypt）实测：');

/** 把一次 scrypt 的参数与结果打包成"单字段存储格式"（真实项目通常写成 PHC 字符串） */
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };

/**
 * 用 scrypt 加盐哈希密码。
 * @param {string} password
 * @returns {Promise<{salt:string, hash:string, stored:string}>}
 */
async function hashPasswordScrypt(password) {
  const salt = crypto.randomBytes(16); // 每用户唯一随机盐
  const derived = await scrypt(password, salt, SCRYPT_PARAMS.keylen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
  });
  // 存储格式：算法$参数$盐$哈希（把参数一起存起来，将来才能平滑升级算法）
  const stored = `scrypt$${SCRYPT_PARAMS.N}$${SCRYPT_PARAMS.r}$${SCRYPT_PARAMS.p}$${salt.toString('base64')}$${derived.toString('base64')}`;
  return { salt: salt.toString('base64'), hash: derived.toString('base64'), stored };
}

/**
 * 校验密码：按存储串里的参数重新计算，并用恒定时间比较。
 * @param {string} password
 * @param {string} stored
 * @returns {Promise<boolean>}
 */
async function verifyPasswordScrypt(password, stored) {
  const parts = stored.split('$');
  if (parts[0] !== 'scrypt') return false; // 未知算法：安全地判否
  const [, N, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const derived = await scrypt(password, salt, expected.length, { N: Number(N), r: Number(r), p: Number(p) });
  // 恒定时间比较：避免通过响应耗时逐字节猜出哈希
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

const h1s = await hashPasswordScrypt('correct horse battery staple');
const h2s = await hashPasswordScrypt('correct horse battery staple');
console.log(`    第 1 次存储：${h1s.stored.slice(0, 60)}...`);
console.log(`    第 2 次存储：${h2s.stored.slice(0, 60)}...`);
console.log(`    同一个密码两次存储是否相同：${h1s.stored === h2s.stored ? '相同（错了！）' : '不同（正确：盐是随机的）'}`);
console.log(`    校验正确密码：${await verifyPasswordScrypt('correct horse battery staple', h1s.stored)}`);
console.log(`    校验错误密码：${await verifyPasswordScrypt('Correct horse battery staple', h1s.stored)}`);

console.log('\n  快哈希 vs 慢哈希的"每秒能试多少次"对比（本机实测）：');
const count = 20000;
const t0 = process.hrtime.bigint();
for (let i = 0; i < count; i++) sha256('password' + i);
const shaMs = Number(process.hrtime.bigint() - t0) / 1e6;
const shaPerSec = Math.round((count / shaMs) * 1000);

const t1 = process.hrtime.bigint();
await hashPasswordScrypt('some password');
const scryptMs = Number(process.hrtime.bigint() - t1) / 1e6;
const scryptPerSec = Number((1000 / scryptMs).toFixed(1));

console.log(`    SHA-256 ：${count} 次耗时 ${shaMs.toFixed(1)} ms → 约 ${shaPerSec.toLocaleString('en-US')} 次/秒`);
console.log(`    scrypt  ：1 次耗时 ${scryptMs.toFixed(1)} ms → 约 ${scryptPerSec} 次/秒（单核）`);
console.log(`    差距约 ${Math.round(shaPerSec / scryptPerSec).toLocaleString('en-US')} 倍。`);
console.log('    再乘上 GPU 集群的并行度：快哈希下"8 位密码"是几小时的问题，');
console.log('    慢哈希下同样的成本只能试出极少数候选 —— 这就是"慢"的全部意义。');
console.log(`    参考：真实推荐的 scrypt 参数大致是 N=16384~131072, r=8, p=1（本演示用 N=${SCRYPT_PARAMS.N}）。`);

console.log('\n  三种主流慢哈希的定位：');
for (const [name, position, note] of [
  ['bcrypt', '老牌、生态最广、经受了时间检验', '72 字节输入上限（更长部分会被截断）；Node 需装包'],
  ['scrypt', '内存硬（memory-hard），抗 GPU/ASIC', 'Node **内置**（node:crypto），无需第三方依赖'],
  ['argon2', '密码哈希竞赛冠军，抗 GPU 能力最强', '当前新项目首选；Node 需装包（argon2 / @node-rs/argon2）'],
]) {
  console.log(`    ${name.padEnd(8)} 定位：${position}`);
  console.log(`    ${' '.repeat(8)} 注意：${note}`);
}
console.log('\n  密码存储自查清单：');
for (const item of [
  '用 bcrypt / scrypt / argon2，绝不用 MD5 / SHA / 自创算法',
  '每个用户唯一随机盐（16 字节以上，crypto.randomBytes）',
  '把算法与参数一起存进哈希串，便于将来平滑升级',
  '校验用恒定时间比较（crypto.timingSafeEqual）',
  '登录失败信息不区分"用户不存在"与"密码错误"（防用户名枚举）',
  '登录接口限流 + 失败退避 + 异常登录告警（见 16 篇）',
  '改密码后让所有旧会话/令牌失效',
  '支持 2FA（TOTP）作为高价值账号的第二因子',
]) {
  console.log(`    [ ] ${item}`);
}

// ============================================================================
// 小节 6：OAuth 2.0 的定位
// ============================================================================
console.log('\n--- 6. OAuth 2.0：它是授权框架，不是认证协议 ---');
console.log('  常见误解："我用微信登录 = 我在做 OAuth 认证"。');
console.log('  准确说法：OAuth 2.0 解决的是【授权】——「让 A 应用在限定范围内访问我在 B 上的数据」。');
console.log('  想知道"用户是谁"，需要建立在 OAuth 之上的 OIDC（OpenID Connect），它才有 id_token。');

console.log('\n  授权码模式（最常用）的流程：');
const flow = [
  '① 用户点击"用 XX 登录"',
  '② 客户端把浏览器重定向到授权服务器，带上 client_id、redirect_uri、scope、state、code_challenge',
  '③ 用户在授权服务器上登录并同意授权',
  '④ 授权服务器把浏览器重定向回 redirect_uri，并带上 code 与 state',
  '⑤ 客户端校验 state 是否与②一致（防 CSRF）；再用 code + code_verifier 换 access_token',
  '⑥ 客户端用 access_token 访问资源服务器（不是拿它当"用户身份证"）',
];
for (const step of flow) console.log(`    ${step}`);

console.log('\n  四个必须做对的安全点：');
for (const [k, v] of [
  ['state', '随机值，回跳时比对，防 CSRF（相当于 OAuth 流程里的 CSRF Token，见 11 篇）'],
  ['PKCE', 'code_challenge / code_verifier，防授权码被拦截后冒用；公共客户端（SPA/App）必用'],
  ['redirect_uri', '必须白名单**精确匹配**（不能用前缀/通配），否则 code 会被偷到攻击者的地址'],
  ['scope', '最小必要，别一上来就要全部权限；token 泄漏时影响面更小'],
]) {
  console.log(`    ${k.padEnd(12)} ${v}`);
}
console.log('\n  最后一条建议：**不要自己实现 OAuth 服务器或客户端协议细节**，');
console.log('    用成熟库（如 openid-client）或成熟服务；自己写的多半会漏掉上面某一项。');

// ============================================================================
// 小节 7：小结
// ============================================================================
console.log('\n--- 7. 小结 ---');
console.log('  1) 认证回答"你是谁"，授权回答"你能做什么"；认证通过 ≠ 有权访问这条数据。');
console.log('  2) 对象级授权必须逐个接口做（IDOR 是 OWASP 第一名），不存在"一次授权全站通用"。');
console.log('  3) 会话 Cookie 可撤销，JWT 不可撤销；登录态优先用服务端会话，JWT 适合短时效/服务间。');
console.log('  4) JWT 四道必做：服务端写死算法（拒绝 alg:none）、真实验签、高熵密钥、校验 exp。');
console.log('  5) JWT payload 只是 base64，**不是加密**，绝不放敏感信息。');
console.log('  6) 密码必须用 bcrypt / scrypt / argon2 加唯一随机盐，校验用恒定时间比较。');
console.log('  7) OAuth 是授权框架不是认证协议；state、PKCE、redirect_uri 白名单一个都不能少。');
console.log('  8) 以上所有防线都要叠加登录限流，否则密码再强也扛不住在线爆破。');

await new Promise((r) => server.close(r));
console.log('\n[清理] 本地认证服务已关闭。示例结束，退出码 0。');
