/**
 * ============================================================================
 * 知识点：OWASP Top 10 与项目安全自查清单 —— 收口与索引
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】入门
 * 【本文件定位】本篇是收口与索引，不需要新代码演示，因此难度标为入门
 * 【前置知识】建议先读过本目录 01 ~ 18 篇中的任意几篇
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    OWASP（Open Worldwide Application Security Project）是一个非营利的安全组织，
 *    它发布的 **OWASP Top 10** 是目前最广泛引用的 Web 应用安全风险清单。
 *    需要理解它的准确定位：
 *      - 它是一份**风险意识清单**，不是标准、不是合规要求，也不是测试用例集；
 *      - 它按"**发生频率**"排序，不是按"危害大小"排序（危害极大的问题可能排在后面）；
 *      - 它的类别很宽（例如"A03 注入"覆盖 SQL、命令、模板等所有注入形态），
 *        所以看到某个分类时要顺着往下想"我这个项目里它长什么样"。
 *    本文件的作用是**收口与索引**：把 OWASP Top 10 的每个类别对应到
 *    JavaScript / Node 项目里的具体表现，并指出本仓库哪个文件讲了对应的防御。
 *
 * 2. 为什么需要
 *    (a) 安全知识是碎片化的：学了 XSS、学了 CSRF，但不知道"还差什么"。
 *        Top 10 提供了一个**覆盖面检查表**，帮你发现知识盲区。
 *    (b) 代码评审与技术方案评审需要共同的词汇表：说"A01 访问控制"比说
 *        "你这里好像没校验归属"更容易形成共识与检查项。
 *    (c) 它能把"安全"从"某个人的担心"变成"团队可执行的清单"。
 *    (d) 重要的心态提醒：**Top 10 不是全部**。真正引发事故的往往是
 *        业务逻辑漏洞、配置错误、以及本清单里排在后面的类别。
 *
 * 3. 核心要点（本文件的结构）
 *    第 1 节：Top 10:2021 总览
 *    第 2 ~ 11 节：逐条讲"在 JS / Node 里的典型表现" + "本仓库哪个文件讲了防御"
 *    第 12 节：Top 10 之外的补充要点（能覆盖到的与覆盖不到的）
 *    第 13 节：本仓库安全主题的完整索引（自动校验文件是否真实存在）
 *    第 14 节：可打印的项目安全自查清单（含代码审查要点）
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/19_owasp_checklist.js
 *
 * 【预期输出】
 *   打印 OWASP Top 10 的逐条对照说明、本仓库安全主题的交叉引用索引
 *   （索引会**实时检查被引用的文件是否真的存在**，避免文档与代码脱节），
 *   以及一份可执行的项目安全自查清单。全程只读取本仓库的文件列表，不联网，退出码 0。
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 本仓库里被引用到的所有文件相对路径（用于最后的索引自检） */
const referencedFiles = new Set();

/**
 * 登记一个交叉引用，并返回可直接打印的短标签。
 * @param {string} relPath 相对仓库根目录的路径
 * @param {string} [label] 显示用的短名
 * @returns {string}
 */
function ref(relPath, label) {
  referencedFiles.add(relPath);
  return label ?? relPath.split('/').pop();
}

// 先声明本文件会引用到的各个文件，后面正文里直接用这些常量，
// 避免"文档里写了一个根本不存在的文件名"这种最常见也最误导人的问题。
const F = {
  inputValidation: ref('32_security_and_best_practices/01_input_validation.js'),
  xss: ref('32_security_and_best_practices/02_xss_prevention.js'),
  sqlInjection: ref('32_security_and_best_practices/03_sql_injection.js'),
  prototypePollution: ref('32_security_and_best_practices/04_prototype_pollution.js'),
  evalDangers: ref('32_security_and_best_practices/05_eval_dangers.js'),
  immutability: ref('32_security_and_best_practices/06_immutability.js'),
  jsdoc: ref('32_security_and_best_practices/07_jsdoc_typing.js'),
  errorHygiene: ref('32_security_and_best_practices/08_error_message_hygiene.js'),
  secureRandom: ref('32_security_and_best_practices/09_secure_random.js'),
  codeStyle: ref('32_security_and_best_practices/10_code_style_guide.js'),
  csrf: ref('32_security_and_best_practices/11_csrf.js'),
  cors: ref('32_security_and_best_practices/12_cors_and_same_origin.js'),
  csp: ref('32_security_and_best_practices/13_csp_advanced.js'),
  supplyChain: ref('32_security_and_best_practices/14_supply_chain_security.js'),
  auth: ref('32_security_and_best_practices/15_auth_basics.js'),
  rateLimit: ref('32_security_and_best_practices/16_rate_limiting.js'),
  traversalSsrf: ref('32_security_and_best_practices/17_path_traversal_and_ssrf.js'),
  sandboxing: ref('32_security_and_best_practices/18_sandboxing.js'),
  // 跨目录的关联知识点
  cryptoDigest: ref('35_web_crypto/02_digest_hashing.js'),
  cryptoHmac: ref('35_web_crypto/03_hmac_signing.js'),
  nodeCryptoHash: ref('26_node_core/13_crypto_hash.js'),
  nodeEnv: ref('26_node_core/16_env_and_dotenv.js'),
  nodePath: ref('26_node_core/02_path_module.js'),
  nodeChildProcess: ref('26_node_core/10_child_process.js'),
  nodeHttp: ref('26_node_core/15_http_server_client.js'),
  zod: ref('29_npm_libraries/05_zod_validation.js'),
  logging: ref('29_npm_libraries/14_logging.js'),
  librarySelection: ref('29_npm_libraries/12_library_selection.js'),
  expressRest: ref('29_npm_libraries/11_express_rest_api.js'),
  customErrors: ref('20_error_handling/05_custom_errors.js'),
  errorPatterns: ref('20_error_handling/08_error_handling_patterns.js'),
  defensive: ref('20_error_handling/12_defensive_programming.js'),
  jsonReviver: ref('21_json/03_replacer_and_reviver.js'),
  jsonEdgeCases: ref('21_json/04_serialization_edge_cases.js'),
  fetchApi: ref('27_web_apis/04_fetch_api.js'),
  webStorage: ref('27_web_apis/05_web_storage.js'),
  prodErrorReporting: ref('37_debugging_and_profiling/06_production_error_reporting.js'),
  stackTraces: ref('37_debugging_and_profiling/01_stack_traces.js'),
  websocket: ref('36_realtime_and_streams/01_websocket_basics.js'),
  debounce: ref('31_performance_and_memory/01_debounce.js'),
  throttle: ref('31_performance_and_memory/02_throttle.js'),
  memoryLeak: ref('31_performance_and_memory/09_memory_leak_patterns.js'),
  validationProxy: ref('25_proxy_and_reflect/05_validation_proxy.js'),
  whyTesting: ref('28_testing/01_why_testing.js'),
  dynamicImport: ref('19_modules/09_dynamic_import.js'),
};

// ============================================================================
// 小节 1：OWASP Top 10:2021 总览
// ============================================================================
console.log('--- 1. OWASP Top 10:2021 总览 ---');
console.log('  说明：本篇采用 2021 版（当前最广泛引用的版本）。2025 版已于 2025 年发布，');
console.log('        类别划分有调整（例如新增了"软件供应链失效"独立类别），但 2021 版');
console.log('        仍然是绝大多数团队自查时使用的框架，两者思路一致。');
console.log('');

const top10 = [
  ['A01', 'Broken Access Control', '访问控制失效', '权限校验缺失或写错：越权读写他人数据'],
  ['A02', 'Cryptographic Failures', '加密机制失效', '明文存储、弱算法、密钥管理不当'],
  ['A03', 'Injection', '注入', 'SQL / 命令 / 模板 / LDAP / XSS 等一切"数据被当成代码"'],
  ['A04', 'Insecure Design', '不安全的设计', '架构阶段就没考虑对抗（缺限流、缺威胁建模）'],
  ['A05', 'Security Misconfiguration', '安全配置错误', '默认配置、多余功能、过宽的 CORS/CSP、错误信息外泄'],
  ['A06', 'Vulnerable and Outdated Components', '使用含已知漏洞的组件', '依赖过期、未修补、未审计'],
  ['A07', 'Identification and Authentication Failures', '身份识别与认证失效', '弱密码策略、会话管理不当、无防爆破'],
  ['A08', 'Software and Data Integrity Failures', '软件与数据完整性失效', '不校验来源、不安全反序列化、CI 被投毒'],
  ['A09', 'Security Logging and Monitoring Failures', '安全日志与监控失效', '没记日志、记了不看、日志里带敏感数据'],
  ['A10', 'Server-Side Request Forgery (SSRF)', '服务端请求伪造', '服务器被用来打内网 / 云元数据'],
];
for (const [id, en, zh, desc] of top10) {
  console.log(`  ${id}  ${zh}（${en}）`);
  console.log(`        ${desc}`);
}
console.log('\n  记住三句话：');
console.log('    ① 排序依据是"发生频率"，不是"危害大小"——A10 的 SSRF 造成的损失往往最大。');
console.log('    ② 类别很宽，看到分类要自己往下推："在我这个项目里它长什么样"。');
console.log('    ③ 它只是起点：业务逻辑漏洞、竞态条件、点击劫持等都不在里面。');

// ============================================================================
// 小节 2：A01 访问控制失效
// ============================================================================
console.log('\n--- 2. A01 访问控制失效（Broken Access Control）---');
console.log('  排名第一，因为它**最普遍**，而且往往只需要改一个 id 就能利用。');
console.log('');
console.log('  在 JS / Node 项目里的典型表现：');
for (const item of [
  '水平越权（IDOR）：GET /api/orders/:id 只校验"已登录"，不校验"这单是不是你的"',
  '垂直越权：普通用户能调到管理员接口（前端隐藏了按钮，后端没校验角色）',
  '把权限判断放在前端：`if (user.role === "admin")` 写在浏览器里，后端不校验',
  '依赖"前端不会传这个字段"：请求体里其实带着 role / isAdmin，被直接写进数据库',
  'GraphQL / REST 的批量接口漏校验：`/api/orders?ids=1,2,3` 里混入别人的 id',
  '多租户场景漏掉 tenantId 过滤：查询条件里少了`WHERE tenant_id = ?`',
  '静态资源可被直接访问：上传目录用同一套鉴权，或干脆是可枚举的公开路径',
  'JWT 里放了角色然后从不复查：用户被降权 / 被禁用后，旧令牌依然能用',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  对应的防御在仓库哪里：');
console.log(`    · ${F.auth}（15 篇）：认证 vs 授权的区别、越权（IDOR）的正反例实现`);
console.log(`    · ${F.traversalSsrf}（17 篇）：路径遍历也是"绕过了本该有的访问边界"`);
console.log(`    · ${F.csrf}（11 篇）：CSRF 是"用你的权限做了你没授权的操作"，属于广义访问控制问题`);
console.log('\n  代码审查时的提问：');
for (const q of [
  '拿到一个 id 之后，有没有再查一次"这条记录属于当前用户吗"？',
  '这个接口的角色要求写在哪一行？能否被普通用户直接调用？',
  '有没有一个统一的鉴权中间件，还是每个接口各写各的（后者必然有漏网的）？',
  '默认是拒绝还是放行？（必须默认拒绝）',
]) {
  console.log(`    ? ${q}`);
}

// ============================================================================
// 小节 3：A02 加密机制失效
// ============================================================================
console.log('\n--- 3. A02 加密机制失效（Cryptographic Failures）---');
console.log('  注意类别名从"敏感数据暴露"改成了"加密机制失效"——关注点从结果转向了原因。');
console.log('\n  在 JS / Node 项目里的典型表现：');
for (const item of [
  '密码明文 / MD5 / 裸 SHA 存储（见 15 篇与 09 篇）',
  '用 Math.random() 生成令牌、验证码、session id、重置链接（可预测！）',
  '自创加密算法，或"把 AES 当哈希用"',
  'AES 用了 ECB 模式 / 固定 IV / 把 IV 和密文拼在一起却不认证（缺 AEAD）',
  '密钥硬编码在代码或前端产物里（打包后照样能被搜出来）',
  'HTTP 明文传输敏感数据；Cookie 缺少 Secure 属性',
  '哈希比较用 == 而不是恒定时间比较（时序侧信道）',
  '把"加密"当成"安全"：加密了但密钥就在同一个库里',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  对应的防御在仓库哪里：');
console.log(`    · ${F.secureRandom}（09 篇）：为什么必须用 crypto.randomBytes，Math.random 到底差在哪`);
console.log(`    · ${F.auth}（15 篇）：密码存储（scrypt 加盐 + timingSafeEqual）、JWT 签名的正确实现`);
console.log(`    · ${F.cryptoDigest} / ${F.cryptoHmac}（35 目录）：摘要与 HMAC 的标准用法`);
console.log(`    · ${F.nodeCryptoHash}（26 目录）：Node 内置 crypto 的基础用法`);
console.log('\n  提醒：Node 的 crypto 是"密码学原语工具箱"，不是"安全方案生成器"。');
console.log('    用它拼出正确方案（如 scrypt 存密码、HMAC 签令牌）是你的责任；');
console.log('    拼错了它不会报错，只会安静地不安全。');

// ============================================================================
// 小节 4：A03 注入
// ============================================================================
console.log('\n--- 4. A03 注入（Injection）---');
console.log('  这一类覆盖极广：SQL、NoSQL、命令、模板、日志、HTTP 头，本质都是同一件事——');
console.log('  **把不可信的数据放进了会被解析成"代码/语法"的位置**。');
console.log('\n  在 JS / Node 项目里的典型表现：');
for (const item of [
  'SQL 字符串拼接（含 ORM 的 whereRaw / orderBy 用户输入）',
  'NoSQL 注入：把 `{ $ne: null }` 之类的操作符对象直接透传给 MongoDB 查询',
  '命令注入：exec(`convert ${userFile} out.png`) —— 文件名里有 ; rm -rf 就完了',
  '模板注入（SSTI）：用户输入被当成模板内容编译',
  'HTML 注入（XSS）：见 02 篇',
  '原型污染：`__proto__` 被 merge 进对象，污染所有实例（04 篇）',
  'eval / new Function / setTimeout(字符串)（05 篇）',
  '日志注入：用户输入里带换行，伪造出假的日志行来掩盖攻击痕迹',
  'HTTP 头注入：把用户输入放进 Set-Cookie / Location 造成响应拆分',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  对应的防御在仓库哪里：');
console.log(`    · ${F.sqlInjection}（03 篇）：参数化查询、ORM 的坑、为什么转义不如参数化`);
console.log(`    · ${F.xss}（02 篇）：按上下文输出转义、CSP`);
console.log(`    · ${F.prototypePollution}（04 篇）：原型污染的原理与 Object.create(null) 等防御`);
console.log(`    · ${F.evalDangers}（05 篇）：为什么不要 eval，以及替代写法`);
console.log(`    · ${F.inputValidation}（01 篇）：白名单校验与 schema 化（${F.zod}）`);
console.log(`    · ${F.csp}（13 篇）：CSP 作为注入的兜底防线`);
console.log('\n  一句话原则：**永远用参数化/转义，永远不要用字符串拼接构造语法**。');

// ============================================================================
// 小节 5：A04 不安全的设计
// ============================================================================
console.log('\n--- 5. A04 不安全的设计（Insecure Design）---');
console.log('  这一类最难修，因为它是"架构阶段缺了对抗思维"，改起来要动方案而不是改几行代码。');
console.log('\n  在 JS / Node 项目里的典型表现：');
for (const item of [
  '登录接口没设计限流（这是设计缺陷，不是编码 bug）',
  '密码重置用"安全问题"（母亲的姓氏？搜索引擎里就有）',
  '验证码不区分大小写、且没有尝试次数限制（等于没有）',
  '下单 / 转账流程没有幂等设计，重放请求造成重复扣款',
  '优惠券、积分没有并发控制：同一张券被并发核销多次',
  '把"导出全量数据"做成一个同步接口，一个请求就能把数据库拖垮',
  '可信边界画错：把内部服务暴露在公网，或假设"内网就是可信的"',
  '"先上线再补安全"的设计里没有任何可插入鉴权的位置',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  对应的防御在仓库哪里：');
console.log(`    · ${F.rateLimit}（16 篇）：限流与防爆破属于典型的设计级防御`);
console.log(`    · ${F.errorPatterns} / ${F.defensive}（20 目录）：防御式编程与失败安全（fail closed）`);
console.log(`    · ${F.debounce} / ${F.throttle}（31 目录）：前端侧的节流与防重复提交`);
console.log(`    · ${F.whyTesting}（28 目录）：把安全用例写成自动化测试，才能长期守住设计约束`);
console.log('\n  实践建议：做一次**威胁建模**（Threat Modeling）。最简单的版本只需四个问题：');
for (const q of [
  '我们在保护什么？（资产：账号、钱、隐私数据、可用性）',
  '谁想破坏它？（攻击者：脚本小子、黑产、内部人、竞争对手）',
  '他们会怎么做？（对照 A01~A10 逐个想）',
  '我们怎么防？（每一层写清楚"防不住时会怎样"）',
]) {
  console.log(`    · ${q}`);
}

// ============================================================================
// 小节 6：A05 安全配置错误
// ============================================================================
console.log('\n--- 6. A05 安全配置错误（Security Misconfiguration）---');
console.log('  这一类"不需要写代码就能修"，但恰恰是最常见、最容易被忽视的一类。');
console.log('\n  在 JS / Node 项目里的典型表现：');
for (const item of [
  'CORS 无脑反射 Origin + 允许凭证（等于关掉同源策略，见 12 篇）',
  'CSP 里写 unsafe-inline / unsafe-eval，或干脆没设 base-uri（见 13 篇）',
  '生产环境把 NODE_ENV 设成 development：错误堆栈、调试接口全暴露（见 08 篇）',
  '把 .env 提交进了 Git；或把密钥打包进前端产物（见 26 目录的 dotenv 篇）',
  '框架的默认账号 / 默认管理路径没改（/admin、Swagger UI 直接对外）',
  '目录列表功能没关，Nginx 直接列出文件',
  'HTTP 安全响应头没有配置（见下方补充要点）',
  'Nginx / 网关没有剥离客户端伪造的 X-Forwarded-For',
  '云存储桶权限设为公开可读（很多数据泄漏事故的直接原因）',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  对应的防御在仓库哪里：');
console.log(`    · ${F.cors}（12 篇）：CORS 错误配置的安全后果与自查清单`);
console.log(`    · ${F.csp}（13 篇）：CSP 的失效配置对照表`);
console.log(`    · ${F.errorHygiene}（08 篇）：错误信息卫生（不泄漏内部细节与堆栈）`);
console.log(`    · ${F.nodeEnv}（26 目录）：环境变量与 .env 的正确用法（含"不要提交密钥"）`);
console.log('\n  建议的 HTTP 安全响应头（本篇补充，仓库其他地方未展开）：');
for (const [header, value, why] of [
  ['Strict-Transport-Security', 'max-age=31536000; includeSubDomains', '强制 HTTPS，防降级与 Cookie 劫持'],
  ['X-Content-Type-Options', 'nosniff', '阻止浏览器猜测 MIME 类型（防把文本当脚本执行）'],
  ['Referrer-Policy', 'strict-origin-when-cross-origin', '控制 Referer 外泄的粒度'],
  ['Content-Security-Policy', "default-src 'self' ...", '见 13 篇'],
  ['X-Frame-Options / frame-ancestors', 'DENY', '防点击劫持（新标准用 CSP 的 frame-ancestors）'],
  ['Permissions-Policy', 'geolocation=(), camera=()', '按需关闭浏览器能力'],
  ['Cache-Control', 'no-store（用于含敏感数据的响应）', '防止敏感响应被中间缓存或本机缓存'],
]) {
  console.log(`    ${header}: ${value}`);
  console.log(`      └─ ${why}`);
}

// ============================================================================
// 小节 7：A06 使用含已知漏洞的组件
// ============================================================================
console.log('\n--- 7. A06 使用含已知漏洞的组件（Vulnerable and Outdated Components）---');
console.log('  在 Node 生态里这一类尤其突出：一个项目动辄几百个包，任何一个没跟进都可能出事。');
console.log('\n  在 JS / Node 项目里的典型表现：');
for (const item of [
  'lockfile 没提交，或 CI 里用 npm install 而不是 npm ci（依赖树每次都可能变）',
  '长期不升级依赖，积累几十个已知漏洞（升级一次风险巨大，于是更不敢升）',
  '用了已停止维护的包（没有补丁来源）',
  '前端 <script src="https://cdn.../lib.js"> 不带 SRI（CDN 被入侵就全站沦陷）',
  '只关注 dependencies，忽略了构建工具链（devDependencies 也能在你机器上执行代码）',
  'npm audit 告警长期被忽略（"反正没人看"）',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  对应的防御在仓库哪里：');
console.log(`    · ${F.supplyChain}（14 篇）：SRI、lockfile、npm audit 的用法与局限、postinstall 风险、`);
console.log('      typosquatting、依赖可信度评估清单（这一类的主战场）');
console.log(`    · ${F.librarySelection}（29 目录）：怎么选依赖、什么时候不该引依赖`);

// ============================================================================
// 小节 8：A07 身份识别与认证失效
// ============================================================================
console.log('\n--- 8. A07 身份识别与认证失效（Identification and Authentication Failures）---');
console.log('\n  在 JS / Node 项目里的典型表现：');
for (const item of [
  '允许弱密码、不检查是否在已泄漏密码库里（可离线比对，不需要联网）',
  '没有防暴力破解：没有失败计数、没有退避、没有验证码（见 16 篇）',
  'session id 用 Math.random 生成，或用时间戳（可预测）',
  '登录成功后不轮换 session id（会话固定攻击）',
  '登出时只清前端 token，服务端会话没作废（见 15 篇的会话 vs JWT 对比）',
  'JWT 错误：接受 alg:none、密钥是弱字典词、只 decode 不 verify、payload 放敏感信息',
  '密码重置链接长期有效 / 可重复使用 / 能被枚举',
  '"记住我"用永不过期的令牌',
  '第三方登录回调不校验 state（等于把账号交给攻击者，见 15 篇的 OAuth 小节）',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  对应的防御在仓库哪里：');
console.log(`    · ${F.auth}（15 篇）：认证 vs 授权、会话与 JWT 的取舍、JWT 五类错误、`);
console.log('      密码存储（scrypt + 盐 + 恒定时间比较）、OAuth 2.0 的定位与 state/PKCE');
console.log(`    · ${F.rateLimit}（16 篇）：限流四算法与登录防爆破的组合拳（退避 + 验证码 + 锁定）`);
console.log(`    · ${F.secureRandom}（09 篇）：令牌与会话 id 的随机性要求`);
console.log(`    · ${F.csrf}（11 篇）：Cookie 属性（HttpOnly / Secure / SameSite）与会话安全`);

// ============================================================================
// 小节 9：A08 软件与数据完整性失效
// ============================================================================
console.log('\n--- 9. A08 软件与数据完整性失效（Software and Data Integrity Failures）---');
console.log('  这一类是"你信任的东西被换了"，2021 版新加入，含供应链与反序列化。');
console.log('\n  在 JS / Node 项目里的典型表现：');
for (const item of [
  'CDN 脚本不校验 SRI（见 14 篇）',
  'CI/CD 流水线用的第三方 Action / 插件没锁版本（供应链攻击的常见入口）',
  '从不可信来源加载远程配置 / 插件并直接执行（见 18 篇的沙箱）',
  '**不安全反序列化**：把用户可控的 JSON 直接喂给会"重建对象/调用构造函数"的逻辑',
  '原型污染本质上也是"数据被当成了结构"（04 篇）',
  '自动更新机制没有签名校验（下载到什么就装什么）',
  '把 AI 生成、没有任何人复核的代码直接部署',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  在 JavaScript 里，"反序列化"这件事有一个必须记住的事实：');
console.log('    **JSON.parse 本身是安全的**——它只产生纯数据（plain object），不会执行代码、');
console.log('    不会调用构造函数、不会还原类实例。JS 不像 Java/Python 那样有');
console.log('    "反序列化即执行"的天然陷阱。真正的风险来自接下来的"加工"：');
for (const item of [
  '把解析结果喂给 protobuf / MessagePack / node-serialize 之类的反序列化器',
  '把解析结果交给 lodash.merge / 深拷贝工具 → __proto__ 污染（04 篇）',
  'JSON.parse 的 reviver 回调里做了危险操作（见 21 目录的 replacer 与 reviver）',
  '把解析结果当成类实例用（`obj instanceof User` 永远为 false，于是校验被绕过）',
  '解析超大 JSON 造成内存耗尽（拒绝服务）',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  对应的防御在仓库哪里：');
console.log(`    · ${F.supplyChain}（14 篇）：SRI、lockfile 完整性、postinstall、来源审查`);
console.log(`    · ${F.prototypePollution}（04 篇）：原型污染（JS 里最典型的"数据变结构"）`);
console.log(`    · ${F.jsonReviver} / ${F.jsonEdgeCases}（21 目录）：JSON 解析的边界与 reviver 的正确用法`);
console.log(`    · ${F.sandboxing}（18 篇）：不可信代码必须真正隔离，而不是"看起来隔离"`);

// ============================================================================
// 小节 10：A09 安全日志与监控失效
// ============================================================================
console.log('\n--- 10. A09 安全日志与监控失效（Security Logging and Monitoring Failures）---');
console.log('  这一类不会直接导致被攻破，但它决定了"被攻破之后多久才发现"——');
console.log('  业内的共识是：**平均发现时间以月计，而攻击者完成横向移动只需要几小时**。');
console.log('\n  在 JS / Node 项目里的典型表现：');
for (const item of [
  '安全事件不记日志：登录失败、越权尝试、限流命中、权限变更全都无声无息',
  '记了但不告警：日志躺在磁盘上没人看，出事时才发现三个月前就有痕迹',
  '日志里写了敏感数据：明文密码、令牌、身份证号、完整银行卡号（这本身就成了新泄漏点）',
  '日志可被注入伪造：用户输入里的换行直接写进日志（见 04 节的日志注入）',
  '没有请求 ID / 关联 ID：一次攻击的多个请求无法串起来看',
  '前端错误上报把用户隐私一起发出去（见 37 目录的生产环境错误上报）',
  '审计日志可以被应用自己删除（应该只追加、不可篡改、异地留存）',
  '限流命中不告警：攻击者正在爆破，而你完全不知道（见 16 篇）',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  应当记录并告警的安全事件（最小集合）：');
for (const item of [
  '登录成功 / 失败（含失败原因分类）、登出、密码修改',
  '权限变更、角色分配、账号创建与禁用',
  '越权访问被拒（403/404 且原因是权限）',
  '限流命中（429）与验证码触发',
  '敏感数据导出 / 批量查询',
  '配置变更与密钥轮换',
  '依赖安装 / 构建产物变更（供应链视角）',
]) {
  console.log(`    [ ] ${item}`);
}
console.log('\n  对应的防御在仓库哪里：');
console.log(`    · ${F.errorHygiene}（08 篇）：错误信息卫生——对外少说，对内说清楚`);
console.log(`    · ${F.prodErrorReporting} / ${F.stackTraces}（37 目录）：生产环境错误上报与堆栈处理`);
console.log(`    · ${F.logging}（29 目录）：日志库的基本用法`);
console.log(`    · ${F.rateLimit}（16 篇）：限流命中要打点监控`);
console.log('\n  实用提醒：日志系统本身也是攻击面——日志注入可以伪造证据、掩盖痕迹；');
console.log('    日志接口如果不限流不限长，还会被用来打日志洪水（见 13 篇的重放上报）。');

// ============================================================================
// 小节 11：A10 服务端请求伪造
// ============================================================================
console.log('\n--- 11. A10 服务端请求伪造（SSRF）---');
console.log('  它是 2021 版新加入的独立类别，虽然排在最后，但单次危害往往最大：');
console.log('  拿到云元数据的临时凭证 = 直接接管云账号。');
console.log('\n  在 JS / Node 项目里的典型表现：');
for (const item of [
  'URL 预览 / 抓取标题 / 图片代理：把用户给的 URL 交给服务端 fetch',
  'Webhook 回调地址由用户填写，服务端主动去请求它',
  '在线导入（从 URL 导入 CSV / RSS / 表格）',
  'SSO/OAuth 实现里去请求用户提供的 issuer / jwks_uri',
  '只做字符串黑名单（禁止含 127.0.0.1），被十进制 IP / 重定向 / DNS 重绑定绕过',
  '校验了 URL 但跟随了重定向（一跳就进内网）',
  '报错信息回显内网连接细节，等于免费的内网扫描器',
]) {
  console.log(`    · ${item}`);
}
console.log('\n  对应的防御在仓库哪里：');
console.log(`    · ${F.traversalSsrf}（17 篇）：SSRF 的四层防御（协议白名单、域名白名单、`);
console.log('      DNS 解析后校验并钉住 IP、禁止跟随重定向）、IP 归一化的坑、DNS 重绑定');
console.log('      同一篇还讲了路径遍历（它和 SSRF 是同一个思维模式：用户输入越过了边界）');
console.log(`    · ${F.errorHygiene}（08 篇）：不要把内部细节回显给用户`);

// ============================================================================
// 小节 12：Top 10 之外的补充要点
// ============================================================================
console.log('\n--- 12. Top 10 之外：还应该关注什么 ---');
console.log('\n  (a) 本仓库已经覆盖、但不在 Top 10 明确类别里的：');
for (const [topic, where] of [
  ['原型污染', `${F.prototypePollution}（04 篇）——Top 10 把它归入 A03/A08，独立看更清楚`],
  ['eval 与动态代码执行', `${F.evalDangers}（05 篇）`],
  ['不可变性 / 防御性拷贝', `${F.immutability}（06 篇）——防共享状态被意外改写`],
  ['错误信息与堆栈泄漏', `${F.errorHygiene}（08 篇）`],
  ['安全随机数', `${F.secureRandom}（09 篇）`],
  ['路径遍历', `${F.traversalSsrf}（17 篇）`],
  ['沙箱与资源限制', `${F.sandboxing}（18 篇）`],
  ['安全类型校验（Proxy 方式）', `${F.validationProxy}（25 目录）`],
  ['WebSocket 的安全要点（鉴权、来源校验、消息大小限制）', `${F.websocket}（36 目录）`],
  ['浏览器存储（localStorage vs Cookie 的安全属性）', `${F.webStorage}（27 目录）`],
  ['动态 import 与远程模块加载的风险', `${F.dynamicImport}（19 目录）`],
]) {
  console.log(`    · ${topic}`);
  console.log(`      → ${where}`);
}

console.log('\n  (b) 本仓库**没有覆盖**、但真实项目一定会遇到的（需要另外学习）：');
for (const [topic, note] of [
  ['点击劫持（Clickjacking）', 'CSP 的 frame-ancestors / X-Frame-Options；本仓库只在 13 篇提了一句'],
  ['竞态条件与 TOCTOU', '并发扣库存、优惠券重复核销、先检查后写入；需要事务 / 乐观锁 / 原子操作'],
  ['业务逻辑漏洞', '负数下单、0 元购、绕过支付回调、无限试用——这类问题清单里永远查不到'],
  ['文件上传安全', '类型白名单、内容检测、重命名、存储与执行分离、图片二次渲染'],
  ['邮件与短信安全', 'SPF/DKIM/DMARC、模板注入、短信轰炸（16 篇提过限流这一面）'],
  ['多租户隔离', 'tenantId 过滤、缓存键包含租户、数据库行级安全'],
  ['密钥管理与轮换', 'KMS / Secrets Manager、轮换流程、最小权限、审计'],
  ['合规与隐私', 'GDPR / 个人信息保护法、数据最小化、删除权、日志留存期限'],
  ['移动端与桌面端特有风险', '证书固定、越狱检测、本地存储加密、剪贴板泄漏'],
  ['AI / LLM 特有风险', '提示注入、模型输出被当代码执行、训练数据泄漏（与 18 篇的沙箱直接相关）'],
]) {
  console.log(`    · ${topic}`);
  console.log(`      → ${note}`);
}

// ============================================================================
// 小节 13：本仓库安全主题索引（自动校验文件存在性）
// ============================================================================
console.log('\n--- 13. 本仓库安全主题索引（并实时校验文件是否存在）---');
console.log('  下面把本文件引用到的所有文件做一次存在性检查。');
console.log('  这看起来很啰嗦，但"文档里引用了一个已经被改名/删除的文件"是知识库最常见的腐坏方式。');
console.log('');

const missing = [];
const sortedRefs = [...referencedFiles].sort();
for (const rel of sortedRefs) {
  const exists = fs.existsSync(path.join(ROOT, rel));
  if (!exists) missing.push(rel);
  console.log(`    ${exists ? '✓' : '✗'} ${rel}`);
}
console.log('');
if (missing.length === 0) {
  console.log(`  ✓ 全部 ${sortedRefs.length} 个交叉引用都指向真实存在的文件。`);
} else {
  console.log(`  ⚠ 有 ${missing.length} 个引用指向不存在的文件：`);
  for (const m of missing) console.log(`      - ${m}`);
  console.log('    请修正引用后再提交（这也是"文档与代码同步"的最小保障）。');
}

// ============================================================================
// 小节 14：项目安全自查清单（可打印）
// ============================================================================
console.log('\n--- 14. 项目安全自查清单 ---');
console.log('  用法：按类别逐项过一遍，不适用的直接标 N/A；每一条都应有明确的负责人与结论。');
console.log('        建议把它接进 PR 模板或上线检查表，而不是"想起来才看一次"。');

const checklist = [
  [
    '① 依赖与供应链',
    [
      'lockfile 已提交进版本库，且评审时关注它的 diff',
      'CI / 生产构建使用 npm ci（而非 npm install），保证可复现',
      'CI 安装依赖时禁用安装脚本（--ignore-scripts）或用受限容器',
      '安装依赖的环境里没有生产凭证（密钥注入与安装分属不同步骤）',
      'npm audit --omit=dev 已接入 CI，高危问题阻塞合并',
      '前端第三方脚本使用 SRI + crossorigin + 精确版本号',
      '所有依赖来源可解释（没有不明 registry / git 依赖）',
      '定期集中升级依赖，而不是"出事才升"',
    ],
  ],
  [
    '② 认证与会话',
    [
      '密码使用 bcrypt / scrypt / argon2 加唯一随机盐存储',
      '密码校验使用恒定时间比较（timingSafeEqual）',
      '登录接口有失败计数 + 指数退避 + 验证码 + 锁定（见 16 篇）',
      '会话 id / 令牌使用密码学安全随机数生成',
      '登录成功后轮换会话标识；登出与改密码后旧会话立即失效',
      'JWT：服务端写死算法、拒绝 alg:none、真实验签、密钥高熵、校验 exp',
      'JWT payload 中不含任何敏感信息',
      '支持 2FA 用于高价值账号与敏感操作',
      '第三方登录：校验 state、使用 PKCE、redirect_uri 精确白名单',
    ],
  ],
  [
    '③ 授权与访问控制',
    [
      '每个访问对象的接口都单独校验归属（防 IDOR）',
      '角色 / 权限校验在服务端，前端隐藏按钮只是体验优化',
      '默认拒绝：未明确允许的一律拒绝',
      '批量接口逐条校验权限，而不是只看第一个 id',
      '多租户查询条件里始终包含 tenantId',
      '有统一的鉴权中间件，而不是每个接口各写各的',
    ],
  ],
  [
    '④ 输入与输出',
    [
      '所有外部输入在边界处校验（类型 / 形状 / 范围，白名单方式）',
      'SQL 全部参数化，无字符串拼接（含 ORM 的 raw 接口）',
      '不执行 shell 拼接；必须执行时用 execFile + 参数数组',
      'HTML 输出按上下文转义；富文本用成熟库做白名单清洗',
      '不把用户输入传给 eval / new Function / 字符串形式的定时器',
      '对象合并 / 深拷贝防原型污染（拒绝 __proto__ / constructor / prototype 键）',
      '文件路径使用 resolve + 基准目录内判断（含 path.sep），不接受任意路径',
      '出网 URL 做协议白名单 + 域名白名单 + IP 校验并钉住 + 不跟随重定向',
    ],
  ],
  [
    '⑤ 数据与加密',
    [
      '敏感数据传输强制 HTTPS，并开启 HSTS',
      '敏感数据落库前加密或脱敏，密钥不与应用代码放在一起',
      '不使用自创加密算法；对称加密使用 AEAD 模式（如 GCM）且 IV 随机',
      '不在日志、错误信息、响应体中输出敏感数据',
      '备份加密且可恢复（定期做恢复演练）',
    ],
  ],
  [
    '⑥ 配置与部署',
    [
      '生产环境 NODE_ENV=production，关闭调试接口与详细堆栈',
      'CORS 白名单精确匹配，绝不反射任意 Origin，绝不禁用同源策略',
      'CSP 已配置且不含 unsafe-inline / unsafe-eval，包含 base-uri 与 object-src none',
      '安全响应头齐全（HSTS / nosniff / Referrer-Policy / Permissions-Policy）',
      'Cookie 带 HttpOnly + Secure + SameSite',
      '密钥来自环境变量或密钥管理服务，不在代码与前端产物中',
      '不信任客户端传入的 X-Forwarded-For 等代理头（由可信代理剥离后重写）',
      '云存储桶 / 数据库不对公网开放',
    ],
  ],
  [
    '⑦ 日志与监控',
    [
      '登录成败、权限变更、越权尝试、限流命中等安全事件都有日志',
      '关键事件配置了告警，并有明确的响应流程',
      '日志中不含密码、令牌、身份证号等敏感数据',
      '日志做了转义处理，防止日志注入伪造',
      '请求有统一的关联 ID，便于串起一次攻击的完整轨迹',
      '审计日志只追加、不可被应用自行删除，并异地留存',
    ],
  ],
  [
    '⑧ 代码审查要点（Reviewer 逐条问）',
    [
      '这个新接口的鉴权写在哪一行？普通用户能直接调用吗？',
      '这个参数来自用户吗？它最终流向了哪里（SQL / 文件 / 命令 / HTML / URL）？',
      '这次的错误处理会不会把内部信息暴露出去？会不会"出错就放行"？',
      '这里用了随机数吗？用的是 crypto 还是 Math.random？',
      '这次改动动了 lockfile 吗？多出来的依赖是谁引入的、可信吗？',
      '有没有"注释掉的鉴权代码"或 "TODO: add auth"？',
      '有没有前端做完校验后端就不再校验？',
      '这段代码的失败模式是什么（fail open 还是 fail closed）？',
      '新加的日志里有没有敏感数据？',
      '如果这段代码被恶意输入反复调用一千次会发生什么（资源 / 配额 / 性能）？',
    ],
  ],
];

for (const [section, items] of checklist) {
  console.log(`\n  ${section}`);
  for (const item of items) {
    console.log(`    [ ] ${item}`);
  }
}

console.log('\n  使用建议：');
for (const tip of [
  '把清单按项目实际情况裁剪（删掉不适用的、补上业务特有的）',
  '每一轮迭代只挑 1~2 个类别集中治理，比"一次全做"更容易落地',
  '把能量化的项（依赖告警数、覆盖的接口比例）做成看板，让进展可见',
  '新功能上线前用"⑧ 代码审查要点"过一遍，成本最低、收益最直接',
  '安全是持续过程：清单要随架构变化更新，而不是一次性交付物',
]) {
  console.log(`    · ${tip}`);
}

// ============================================================================
// 小节 15：小结
// ============================================================================
console.log('\n--- 15. 小结 ---');
console.log('  1) OWASP Top 10 是风险意识清单，按发生频率排序，不是标准、不是全部。');
console.log('  2) A01 访问控制失效常年第一：认证通过 ≠ 有权访问这条数据，每个对象都要单独授权。');
console.log('  3) A03 注入的本质只有一句：不可信数据被放进了会被解析成语法的位置。');
console.log('  4) A05 配置错误与 A06 组件过期是"不写代码也能修"的部分，收益往往最高。');
console.log('  5) A07 认证失效与 A09 日志监控失效是一对：前者决定会不会被攻破，后者决定多久才发现。');
console.log('  6) A10 SSRF 单次危害最大（云元数据 → 接管云账号），防御要做在网络请求之前。');
console.log('  7) Top 10 之外还有大量真实事故来源：业务逻辑、竞态、文件上传、密钥管理、合规。');
console.log('  8) 最后一条也是最重要的一条：**清单的价值在于被执行**。');
console.log('     把它接进 PR 模板、CI 门禁与上线检查表，它才有意义。');

console.log('\n[结束] 本文件是索引与清单，不含攻击演示；仅读取本仓库文件列表，未访问网络。退出码 0。');
