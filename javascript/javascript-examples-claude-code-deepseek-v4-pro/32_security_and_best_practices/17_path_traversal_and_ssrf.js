/**
 * ============================================================================
 * 知识点：路径遍历与 SSRF —— 从"读任意文件"到"打内网"
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】高级
 * 【前置知识】32_security_and_best_practices/01_input_validation.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - **路径遍历（Path Traversal，也叫目录穿越）**：应用把用户提供的路径片段
 *      拼接进文件路径，用户用 `../` 跳出了原本限定的目录，从而读到/写到本不该碰的文件。
 *      典型接口：`GET /download?file=report.pdf`、`/avatar?name=x.png`、静态文件服务。
 *    - **SSRF（Server-Side Request Forgery，服务端请求伪造）**：应用把用户提供的 URL
 *      拿去由**服务端**发起请求，用户借此让服务器去访问它本来访问不到的资源 ——
 *      内网服务、云元数据接口、本机端口、其他租户的数据。
 *      一句话对比：CSRF 是"骗【用户】的浏览器发请求"，SSRF 是"骗【服务器】发请求"。
 *
 * 2. 为什么需要（真实攻击场景）
 *    (a) 路径遍历的后果：
 *        - 读到配置文件 → 拿到数据库密码、云密钥、JWT 签名密钥 → 全站接管；
 *        - 读到 `/etc/passwd`、SSH 私钥、`.env`、源码备份；
 *        - **写**型路径遍历更可怕：往 Web 目录写一个 webshell，直接拿到服务器权限；
 *        - 即使只有"读"，源码泄漏也能让攻击者找到更多漏洞。
 *    (b) SSRF 的后果（常被评为"最有价值的漏洞类型之一"）：
 *        - 探测内网：`http://10.0.0.5:6379/` 找到 Redis，配合协议走私直接写文件 / 写计划任务；
 *        - **云元数据接口**：`http://169.254.169.254/latest/meta-data/iam/security-credentials/`
 *          能拿到云主机的**临时凭证**，直接接管整个云账号（历史上多起重大泄漏事故的根因）；
 *        - 绕过边界：内网服务通常"默认信任内网"，没有鉴权，SSRF 等于帮你开了后门；
 *        - 打本机：`http://127.0.0.1:8080/admin` 访问只监听回环的管理接口。
 *      典型入口：URL 预览、图片抓取、Webhook 回调、PDF/截图生成、RSS 订阅、
 *      代理下载、在线翻译、SSO 回调校验。
 *
 * 3. 核心语法要点
 *
 *    (1) 路径处理的三个函数（Node 的 node:path）
 *        - `path.join(a, b)`：把片段拼起来并规范化，**但它不限制范围** ——
 *          `path.join('/uploads', '../../etc/passwd')` 得到 `/etc/passwd`。它是拼接工具，不是安全工具。
 *        - `path.normalize(p)`：把 `..`、`.`、多余斜杠、重复分隔符折叠掉。
 *          注意：**normalize 不是"消除危险"，它只是把路径变成规范形式**。
 *        - `path.resolve(...)`：以当前工作目录（或给定的绝对路径）为基准，解析出**绝对路径**。
 *          它是做"越界判断"的基础。
 *        - Windows 上还要注意：反斜杠 `\` 也是分隔符、盘符（`C:`）与 UNC 路径（`\\server\share`）、
 *          以及 8.3 短文件名等差异 —— 跨平台代码要格外小心。
 *
 *    (2) 防御路径遍历的正确姿势（按可靠程度排序）
 *        ① **最可靠：不要用用户输入拼路径**。用 ID 查数据库得到真实路径，
 *           或者用 `path.basename(userInput)` 只取文件名并在白名单里校验。
 *        ② 解析成绝对路径后，判断"是否仍在基准目录内"：
 *             const base = path.resolve(UPLOAD_DIR);
 *             const target = path.resolve(base, userInput);
 *             if (target !== base && !target.startsWith(base + path.sep)) reject();  // ← 注意 + path.sep
 *           **必须用 `base + path.sep` 比较，不能只用 `base`** ——
 *           否则 `/uploads-evil/x` 会被 `/uploads` 的前缀判断误放行（经典漏洞）。
 *        ③ 对已有文件用 `fs.realpath` 解析**软链接**后再检查一次
 *           （攻击者可以上传一个指向 `/etc` 的符号链接来绕过字面路径检查）。
 *        ④ 拒绝空字节：`%00` 在过去会造成"截断"，现代 Node 会直接抛错，
 *           但你自己的字符串处理逻辑未必 —— 入口处就该把 `\0` 拒掉。
 *        ⑤ 只做"一次解码"：URL 解码必须只做一次。
 *           `%252e%252e%252f` 解码一次是 `%2e%2e%2f`，再解码一次才变成 `../`。
 *           如果你的框架已经解码过一次，你**绝不能**再解一次。
 *        ⑥ 存储与执行分离：上传目录不解析脚本、不放静态服务、用独立的域名/存储桶。
 *
 *    (3) 防御 SSRF 的正确姿势（分层）
 *        ① **协议白名单**：只允许 http / https；显式禁止 `file:`、`gopher:`、`dict:`、
 *           `ftp:`、`data:` —— 这些协议可以读本地文件或与内网服务"对话"。
 *        ② **域名白名单**（最有效）：只允许访问事先批准的域名/IP。
 *           如果业务真的需要任意 URL，那就退化为 ③④⑤。
 *        ③ **解析后再校验 IP，并"钉住"这个 IP**（最关键的一点）：
 *           先 DNS 解析，判断解析结果是否落在禁止网段
 *           （环回 127/8、私有 10/8 与 172.16/12 与 192.168/16、链路本地 169.254/16、
 *             以及 IPv6 的 ::1、fc00::/7、fe80::/10、IPv4 映射地址 ::ffff:0:0/64），
 *           然后**用同一个 IP 去建立连接**。
 *           为什么必须"钉住"？因为存在 **DNS 重绑定（DNS Rebinding）**：
 *           攻击者控制的域名第一次解析返回公网 IP（通过你的检查），
 *           第二次解析返回 127.0.0.1（实际连接的目标）—— 检查与连接之间被掉了包（TOCTOU）。
 *        ④ **禁止跟随重定向**（或对每一跳重新做全套校验）：
 *           否则 `https://safe.example/redirect?to=http://169.254.169.254/` 一步就把你带进内网。
 *        ⑤ **规范化 IP 写法**：`http://2130706433/`（十进制）、`http://0x7f000001/`（十六进制）、
 *           `http://[::ffff:127.0.0.1]/`（IPv4 映射）都是 127.0.0.1 的变体。
 *           校验前必须先归一化成标准形式，否则黑名单形同虚设。
 *        ⑥ 网络层兜底：让发起请求的服务跑在**独立的网络命名空间 / 出网代理**里，
 *           由代理执行白名单，这样即使应用层漏了，也出不去内网。
 *        ⑦ 关掉不必要的响应回显（别把内网响应原样返回给用户，那是免费的探测器）。
 *
 * 4. 常见陷阱
 *    - 用 `startsWith(base)` 做前缀判断而漏掉 `path.sep` —— `/uploads-evil` 绕过。
 *    - 只在客户端（前端 JS）校验路径，服务端不校验。
 *    - 校验的是"原始输入里有没有 `..`"（黑名单），而不是"解析后的路径在不在基准目录内"（白名单）——
 *      会被 `....//`、`%2e%2e%2f`、URL 双重编码、Windows 短文件名绕过。
 *    - 只校验一次解码后的结果，但框架/中间件又解码了一次（解码次数不一致）。
 *    - 用了 `path.join(base, input)` 就以为安全了：join 会**如实地**帮你跳出目录。
 *    - SSRF 只做了"字符串黑名单"（如禁止包含 `127.0.0.1`）——
 *      十进制 IP、`localhost`、`0.0.0.0`、`[::1]`、重定向全都能绕过。
 *    - 检查了 DNS 解析结果但**连接时又重新解析了一次**（DNS 重绑定）。
 *    - 忘记禁止重定向跟随，或用了一个默认跟随重定向的 HTTP 客户端。
 *    - 相信 `Host` 头 / `X-Forwarded-Host`（它们由客户端控制）。
 *    - 把错误信息原样返回（`ECONNREFUSED 10.0.0.5:6379`）—— 直接告诉攻击者内网拓扑（见 08 篇）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/17_path_traversal_and_ssrf.js
 *
 * 【预期输出】
 *   第一部分用**内存里的模拟文件系统**演示路径遍历（不读取任何真实文件），
 *   对比"拼接"与"解析后在基准目录内判断"的差别，以及前缀比较的经典漏洞；
 *   第二部分演示 SSRF：用一个本地服务充当"内网服务"，配合**模拟 DNS**，
 *   对比无防护的抓取器与分层防御的抓取器（协议白名单 + IP 校验 + 不跟随重定向）。
 *   全程不访问外网、不读取真实系统文件、不探测真实内网，退出码 0。
 * ============================================================================
 */

import path from 'node:path';
import http from 'node:http';

// ============================================================================
// 第一部分：路径遍历
// ============================================================================
console.log('=== 第一部分：路径遍历（Path Traversal） ===');

console.log('\n--- 1. 用内存模拟文件系统（绝不读取真实文件） ---');
console.log('  说明：下面的"文件系统"只是一个 Map。所有"敏感文件"的内容都是我们自己编的假字符串，');
console.log('        演示的是"路径解析逻辑",而不是真的去读 /etc/passwd。');
console.log('');
console.log('  另外本文件统一使用 `path.posix` 而不是默认的 `path`：');
console.log('    默认的 path 模块是"跟随平台"的 —— 在 Windows 上分隔符是反斜杠、');
console.log('    `path.resolve("/a","b")` 会变成 `C:\\\\a\\\\b`，导致同一段演示在不同系统上表现不同。');
console.log('    `path.posix` 固定使用 POSIX 语义（分隔符恒为 "/"），演示结果在任何平台都一致。');
console.log('    真实项目里如果你的路径来自 URL / 配置，也应该明确"我按哪种语义解析"，');
console.log('    不要依赖平台默认行为（这也是跨平台漏洞的来源之一）。');

/** 内存模拟文件系统：绝对路径 -> 内容（内容全是编造的假数据） */
const fakeFs = new Map([
  // 允许用户访问的目录
  ['/var/www/uploads/readme.txt', '这是用户可以下载的公开文件。'],
  ['/var/www/uploads/avatar.png', '(假的 PNG 二进制占位)'],
  ['/var/www/uploads/2024/report.csv', 'id,amount\n1,100'],
  // 不该被访问的敏感文件（内容是自己编的示意数据）
  ['/var/www/secret/config.json', '{"dbPassword":"<假的示意值>","jwtSecret":"<假的示意值>"}'],
  ['/etc/passwd', 'root:x:0:0:root:/root:/bin/bash（这是演示用的假内容）'],
  ['/var/www/uploads-evil/payload.txt', '这是一个"名字以 /var/www/uploads 开头但不在该目录内"的文件'],
]);

/**
 * 从模拟文件系统读取文件。
 * @param {string} absPath
 * @returns {string}
 */
function readFakeFile(absPath) {
  return fakeFs.has(absPath) ? fakeFs.get(absPath) : '(文件不存在)';
}

const UPLOAD_DIR = '/var/www/uploads';
console.log(`  基准目录：${UPLOAD_DIR}`);
console.log(`  目录内可用文件：${[...fakeFs.keys()].filter((k) => k.startsWith(UPLOAD_DIR)).join(', ')}`);

console.log('\n--- 2. 漏洞示范：直接拼接用户输入 ---');

/**
 * 反面教材：把用户输入直接拼到基准目录后面。
 * path.resolve 会**如实**地帮你处理 `..`，它不提供任何安全保证。
 * @param {string} userInput
 * @returns {{path:string, content:string}}
 */
function vulnerableRead(userInput) {
  const target = path.posix.resolve(UPLOAD_DIR, userInput);
  return { path: target, content: readFakeFile(target) };
}

const traversalPayloads = [
  ['正常请求', 'readme.txt'],
  ['一级穿越', '../secret/config.json'],
  ['多级穿越', '../../../etc/passwd'],
  ['绝对路径直接覆盖', '/etc/passwd'],
  ['点斜杠绕过黑名单', './../secret/config.json'],
  ['多余分隔符', './/..//secret//config.json'],
];
for (const [desc, payload] of traversalPayloads) {
  const r = vulnerableRead(payload);
  const escaped = r.path !== UPLOAD_DIR && !r.path.startsWith(UPLOAD_DIR + path.posix.sep);
  console.log(`  ${escaped ? '★越界★' : ' 目录内 '} ${desc.padEnd(16)} file=${payload}`);
  console.log(`            解析为 ${r.path}`);
  console.log(`            内容：${r.content}`);
}
console.log('\n  ↑ 结论：一行 resolve 就能读走配置文件和系统文件。');

console.log('\n  顺带对比 join 与 resolve 在同样输入下的差别：');
for (const [desc, payload] of [
  ['相对穿越', '../secret/config.json'],
  ['绝对路径', '/etc/passwd'],
]) {
  console.log(`    ${desc}（${payload}）`);
  console.log(`      path.posix.join(UPLOAD_DIR, input)    -> ${path.posix.join(UPLOAD_DIR, payload)}`);
  console.log(`      path.posix.resolve(UPLOAD_DIR, input) -> ${path.posix.resolve(UPLOAD_DIR, payload)}`);
}
console.log('    说明：join 会把后面的绝对路径当作普通片段继续拼（所以反而"挡住"了绝对路径覆盖），');
console.log('          而 resolve 遇到绝对路径会直接以它为基准 —— 两者的差别很反直觉，');
console.log('          但结论一样：**无论用哪个，都必须自己做越界校验**。');

console.log('\n  关于 `....//` 这类载荷（为什么它对某些过滤器有效）：');
console.log('    字符串 "....//" 里确实"包含子串 ../"（从第 3 个字符开始），');
console.log('    所以像 `input.replace("../", "")` 这种**只做一次字符串替换**的过滤器，');
console.log('    处理 "....//" 之后会剩下 "../" —— 过滤器反而"帮"攻击者构造出了穿越序列。');
console.log('    注意：path.normalize **不会**把 "...." 折叠成 ".."（它只是一个普通文件名），');
console.log('    所以真正的问题在于"用字符串黑名单代替路径解析"这种错误做法本身。');

console.log('\n--- 3. path.normalize / resolve 到底做了什么 ---');
const pathSamples = ['/var/www/uploads/../secret/config.json', '/a/b/./c//d', '../../../etc/passwd', '....//....//etc/passwd'];
for (const s of pathSamples) {
  console.log(`  输入      : ${s}`);
  console.log(`  normalize : ${path.posix.normalize(s)}`);
  console.log(`  resolve(基于 ${UPLOAD_DIR}) : ${path.posix.resolve(UPLOAD_DIR, s)}`);
}
console.log('  → normalize 只是"把路径写成规范形式"，它不会帮你限制范围；');
console.log('  → resolve 会基于基准解析出绝对路径 —— 这才是做越界判断的基础；');
console.log('  → 但 resolve 之后**必须显式判断它是否还在基准目录内**，否则等于没用。');

console.log('\n--- 4. 经典漏洞：用 startsWith(base) 做前缀判断 ---');
const EVIL_BASE = `${UPLOAD_DIR}-evil`; // /var/www/uploads-evil
console.log(`  攻击者想读：${EVIL_BASE}/payload.txt`);
console.log(`  攻击者会传：../uploads-evil/payload.txt`);

/**
 * 反面教材：解析后只用 startsWith(base) 判断。
 * @param {string} userInput
 * @returns {{ok:boolean, reason:string}}
 */
function badPrefixCheck(userInput) {
  const base = path.posix.resolve(UPLOAD_DIR);
  const target = path.posix.resolve(base, userInput);
  if (!target.startsWith(base)) return { ok: false, reason: '越界，拒绝' };
  return { ok: true, reason: `通过（错误！实际路径 ${target}）` };
}

/**
 * 正确做法：必须比较 `base + path.sep`，或者判断相等。
 * 这样 `/var/www/uploads-evil` 就不会被 `/var/www/uploads` 的前缀匹配放行。
 * @param {string} userInput
 * @returns {{ok:boolean, reason:string}}
 */
function goodPrefixCheck(userInput) {
  const base = path.posix.resolve(UPLOAD_DIR);
  const target = path.posix.resolve(base, userInput);
  if (target !== base && !target.startsWith(base + path.posix.sep)) {
    return { ok: false, reason: `越界，拒绝（解析结果 ${target}）` };
  }
  return { ok: true, reason: `通过（${target}）` };
}

for (const [desc, input] of [
  ['正常文件', 'readme.txt'],
  ['目录遍历', '../../../etc/passwd'],
  ['相邻目录绕过（前缀漏洞）', '../uploads-evil/payload.txt'],
]) {
  console.log(`\n  输入：${input}（${desc}）`);
  console.log(`    startsWith(base) 判断        -> ${JSON.stringify(badPrefixCheck(input))}`);
  console.log(`    startsWith(base + path.sep)  -> ${JSON.stringify(goodPrefixCheck(input))}`);
}
console.log('\n  ↑ 第三行就是最有名的坑：`/var/www/uploads-evil`.startsWith(`/var/www/uploads`) === true。');
console.log('    这类"前缀匹配"漏洞不止出现在路径上 —— CSP/CORS 的 Origin 白名单（12 篇）、');
console.log('    URL 域名校验（本文件第二部分）都是同一个思维模式。**永远用"相等"或"加分隔符"比较**。');

console.log('\n--- 5. 编码绕过与空字节 ---');
const encodings = [
  ['原始', '../etc/passwd'],
  ['URL 编码一次', encodeURIComponent('../etc/passwd')],
  ['URL 编码两次', encodeURIComponent(encodeURIComponent('../etc/passwd'))],
  ['只编码点', '../etc/passwd'.replace(/\./g, '%2e')],
  ['空字节后缀', 'readme.txt%00.png'],
];
for (const [desc, raw] of encodings) {
  const decodedOnce = decodeURIComponent(raw);
  // 第二次解码 —— 这正是很多框架/中间件会做的事，也是漏洞的来源
  let decodedTwice = decodedOnce;
  try {
    decodedTwice = decodeURIComponent(decodedOnce);
  } catch {
    decodedTwice = '(第二次解码抛错)';
  }
  // 用 JSON.stringify 输出，这样不可见字符（比如空字节）会显示成 \u0000，一眼能看出来
  console.log(`  ${desc.padEnd(14)} 原始：${JSON.stringify(raw)}`);
  console.log(`  ${' '.repeat(14)} 解码 1 次：${JSON.stringify(decodedOnce)}`);
  console.log(`  ${' '.repeat(14)} 解码 2 次：${JSON.stringify(decodedTwice)}`);
}
console.log('  → 关键规则：**URL 解码只能做一次**。');
console.log('    如果你的 Web 框架已经解码过一次，业务代码再解一次，%252e%252e%252f 就变成了 ../。');
console.log('  → 空字节：`%00` 在过去会让 C 层的字符串处理"在此处截断"，');
console.log('    于是 `readme.txt%00.png` 能骗过".png 后缀校验"却实际读取 readme.txt。');
console.log('    现代 Node 的 fs 会直接抛错，但**你自己的字符串比较逻辑未必** —— 入口处就该拒绝 \\0。');

/** 入口处的净化函数：把所有已知的绕过手法一次处理掉 */
function sanitizeUserPath(userInput) {
  const raw = String(userInput);
  if (raw.includes('\0')) return { ok: false, reason: '包含空字节' };
  // 只做一次解码（假设框架已经解过一次，这里演示"自己再解一次"是危险的，故不做）
  const normalized = path.posix.normalize(raw.replace(/\\/g, '/')).replace(/^\/+/, ''); // 去掉前导分隔符，避免绝对路径覆盖
  const base = path.posix.resolve(UPLOAD_DIR);
  const target = path.posix.resolve(base, normalized);
  if (target !== base && !target.startsWith(base + path.posix.sep)) {
    return { ok: false, reason: `越界（解析结果 ${target}）` };
  }
  return { ok: true, target };
}
console.log('\n  一个可用的防御函数对上面这些载荷的结果（原始形式与"框架解码一次后"的形式都测）：');
for (const [desc, raw] of encodings) {
  let decodedOnce;
  try {
    decodedOnce = decodeURIComponent(raw);
  } catch {
    decodedOnce = raw;
  }
  console.log(`    ${desc}`);
  console.log(`      原始：${JSON.stringify(raw)} -> ${JSON.stringify(sanitizeUserPath(raw))}`);
  console.log(`      解码一次：${JSON.stringify(decodedOnce)} -> ${JSON.stringify(sanitizeUserPath(decodedOnce))}`);
}
console.log('\n  更强的做法（推荐）：');
console.log('    ① 用 `path.basename(input)` 只取文件名，再对着白名单（或"只允许 [A-Za-z0-9_.-]"）校验；');
console.log('    ② 更好的是根本不接受路径：让用户传一个 ID，由服务端查表得到真实路径；');
console.log('    ③ 上传目录与静态服务分离，禁止执行任何脚本，用独立域名（防止同源读取）。');

// ============================================================================
// 第二部分：SSRF
// ============================================================================
console.log('\n\n=== 第二部分：SSRF（服务端请求伪造） ===');

console.log('\n--- 6. 搭建"内网服务"与"模拟 DNS"（全部在 127.0.0.1 上） ---');
console.log('  说明：真实内网服务我们当然访问不到，也不该去访问。');
console.log('        这里用本地服务扮演"内网管理接口"和"云元数据接口"，');
console.log('        再用一个模拟 DNS 把内部域名映射到内网 IP，用来演示校验逻辑。');

/** 内网服务的访问记录，用来证明"请求真的到达了内网服务" */
const internalHits = [];

let internalServer;
const internalPort = await new Promise((resolve) => {
  internalServer = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    internalHits.push(url.pathname);
    if (url.pathname === '/admin/users') {
      // 假装这是"只监听内网、没有鉴权"的管理接口
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ users: ['admin', 'alice', 'bob'], note: '（演示用的假数据）' }));
    }
    if (url.pathname === '/latest/meta-data/iam/security-credentials/') {
      // 假装这是云元数据接口返回的临时凭证
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('demo-role\n{"AccessKeyId":"AKIA<假值>","SecretAccessKey":"<假值>","Token":"<假值>"}');
    }
    if (url.pathname === '/redirect-to-admin') {
      // 用于演示"跟随重定向"如何绕过前期的 URL 校验
      res.writeHead(302, { Location: `http://127.0.0.1:${internalPort}/admin/users` });
      return res.end();
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('not found');
  });
  internalServer.listen(0, '127.0.0.1', () => resolve(internalServer.address().port));
});
const internalBase = `http://127.0.0.1:${internalPort}`;
console.log(`  "内网服务"已启动：${internalBase}（模拟管理接口 / 云元数据接口）`);

/** 模拟 DNS：域名 -> IP。真实代码里这里应该是 dns.lookup。 */
const mockDns = new Map([
  ['internal.admin.local', '10.0.0.5'], // 内网管理后台
  ['metadata.internal', '169.254.169.254'], // 云元数据地址（链路本地）
  ['redis.internal', '10.0.1.7'], // 内网 Redis
  ['api.example.com', '93.184.216.34'], // 一个公网地址（示例；这是 example.com 的真实地址，但本演示不会去连它）
  ['redirector.example.com', '203.0.113.7'], // TEST-NET-3 保留段，专门用来演示"重定向绕过"
  ['127.0.0.1', '127.0.0.1'],
]);

/**
 * 模拟 DNS 解析。真实实现里必须注意"解析结果"与"实际连接目标"可能是两次解析（DNS 重绑定）。
 * @param {string} hostname
 * @returns {string|null}
 */
function mockResolve(hostname) {
  return mockDns.get(hostname) ?? null;
}

/** 归一化 IP：把十进制 / 十六进制 / IPv4 映射 IPv6 等写法统一成标准形式 */
function normalizeIp(raw) {
  const s = String(raw).trim();
  // 纯十进制（如 2130706433）与十六进制（如 0x7f000001）
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && n >= 0 && n <= 0xffffffff) {
      return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
    }
  }
  if (/^0x[0-9a-f]+$/i.test(s)) {
    const n = parseInt(s, 16);
    return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
  }
  // IPv4 映射的 IPv6 有两种写法，必须都处理：
  //   ① 点分十进制：::ffff:127.0.0.1
  //   ② 十六进制（URL 解析器会把上面的形式**自动改写成这种**）：::ffff:7f00:1
  //   实测：new URL('http://[::ffff:127.0.0.1]/').hostname === '[::ffff:7f00:1]'
  //   —— 这是非常容易被忽略的一处：你的黑名单里写着 "::ffff:127.0.0.1"，
  //      但实际拿到手的字符串根本不是那个样子。
  const mappedDotted = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mappedDotted) return mappedDotted[1];
  const mappedHex = s.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (mappedHex) {
    const hi = parseInt(mappedHex[1], 16);
    const lo = parseInt(mappedHex[2], 16);
    return [(hi >> 8) & 255, hi & 255, (lo >> 8) & 255, lo & 255].join('.');
  }
  // 缺位补全的写法（如 127.1 → 127.0.0.1）在真实解析器里也常见，这里只处理最常见的形态
  const parts = s.split('.');
  if (parts.length > 0 && parts.length < 4 && parts.every((p) => /^\d+$/.test(p))) {
    const padded = [...parts, ...Array(4 - parts.length).fill('0')];
    return padded.join('.');
  }
  return s;
}

/**
 * 判断一个 IP 是否属于"禁止访问"的网段：
 * 环回、私有、链路本地（云元数据 169.254.169.254 就在这个段）、以及 IPv6 的特殊地址。
 * 这是 SSRF 防御的核心白/黑名单逻辑。
 * @param {string} ip
 * @returns {{blocked:boolean, reason:string}}
 */
function isForbiddenIp(ip) {
  const norm = normalizeIp(ip);
  if (norm === '::1' || norm === '0:0:0:0:0:0:0:1') return { blocked: true, reason: 'IPv6 环回 ::1' };
  if (norm.startsWith('fc') || norm.startsWith('fd')) return { blocked: true, reason: 'IPv6 唯一本地地址 fc00::/7' };
  if (/^fe[89ab]/i.test(norm)) return { blocked: true, reason: 'IPv6 链路本地 fe80::/10' };
  const octets = norm.split('.').map(Number);
  if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return { blocked: false, reason: '不是标准 IPv4（本演示放行，真实实现应拒绝）' };
  }
  const [a, b] = octets;
  if (a === 127) return { blocked: true, reason: '环回地址 127.0.0.0/8' };
  if (a === 10) return { blocked: true, reason: '私有地址 10.0.0.0/8' };
  if (a === 172 && b >= 16 && b <= 31) return { blocked: true, reason: '私有地址 172.16.0.0/12' };
  if (a === 192 && b === 168) return { blocked: true, reason: '私有地址 192.168.0.0/16' };
  if (a === 169 && b === 254) return { blocked: true, reason: '链路本地 169.254.0.0/16（云元数据！）' };
  if (a === 0) return { blocked: true, reason: '0.0.0.0/8（常被解析为本机）' };
  return { blocked: false, reason: '不在禁止网段内' };
}

console.log('\n  模拟 DNS 表：');
for (const [host, ip] of mockDns) {
  const check = isForbiddenIp(ip);
  console.log(`    ${host.padEnd(20)} -> ${ip.padEnd(16)} ${check.blocked ? `【禁止：${check.reason}】` : '【允许】'}`);
}

console.log('\n--- 7. 漏洞示范：无防护的 URL 抓取器 ---');

/**
 * 反面教材：直接拿用户给的 URL 去请求，什么也不校验。
 * @param {string} userUrl
 * @returns {Promise<{ok:boolean, status?:number, body?:string, error?:string}>}
 */
async function vulnerableFetch(userUrl) {
  try {
    // 注意：即使是演示，也必须设超时 —— 否则一旦请求打到不可达地址就会长时间挂起
    const res = await fetch(userUrl, { signal: AbortSignal.timeout(3000), redirect: 'manual' });
    return { ok: true, status: res.status, body: (await res.text()).slice(0, 200) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

console.log('  攻击者提交的 URL（服务端会替他去访问）：');
const attackUrls = [
  [`${internalBase}/admin/users`, '直接打本机回环上的管理接口'],
  [`${internalBase}/latest/meta-data/iam/security-credentials/`, '读云元数据凭证（真实场景里是 169.254.169.254）'],
];
for (const [url, desc] of attackUrls) {
  const r = await vulnerableFetch(url);
  console.log(`\n    URL：${url}`);
  console.log(`    说明：${desc}`);
  console.log(`    响应：${r.ok ? `${r.status} ${r.body}` : `请求失败：${r.error}`}`);
}
console.log('\n  ↑ 无防护时，服务器成了攻击者的"内网代理"：');
console.log('    它能访问的，攻击者就都能访问 —— 而且响应还由服务端原样回显给他。');

console.log('\n--- 8. 防御实现：分层校验的 URL 抓取器 ---');
console.log('  四层防御，缺一不可：');
console.log('    ① 协议白名单（只允许 http/https）');
console.log('    ② 域名白名单（可选，最有效）');
console.log('    ③ DNS 解析后校验 IP，并**钉住解析结果**（防 DNS 重绑定）');
console.log('    ④ 禁止跟随重定向（或对每一跳重新校验）');

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
// 实践中最有效的做法是域名白名单；演示里留空表示"业务确实需要任意 URL"的退化场景
const ALLOWED_HOSTS = new Set();

/**
 * 校验一个 URL 是否可以安全地发起请求（纯逻辑，不发任何请求）。
 * 这一步是 SSRF 防御的核心：**所有判断都必须在建立连接之前完成**。
 * @param {string} urlString
 * @returns {{ok:true, pinnedUrl:string, ip:string, host:string} | {ok:false, reason:string}}
 */
function validateOutboundUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return { ok: false, reason: 'URL 格式非法' };
  }

  // ① 协议白名单
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return {
      ok: false,
      reason: `协议 ${parsed.protocol} 不在白名单内（file: / gopher: / dict: 可以读本地文件或与内网服务直接对话）`,
    };
  }

  // ② 域名白名单（若配置了就必须命中；这是最有效的一层）
  if (ALLOWED_HOSTS.size > 0 && !ALLOWED_HOSTS.has(parsed.hostname)) {
    return { ok: false, reason: `域名 ${parsed.hostname} 不在白名单内` };
  }

  // ③ 解析 DNS 并校验 IP —— 注意 hostname 可能是 IP 字面量，也可能需要解析
  const hostnameForLookup = parsed.hostname.replace(/^\[|\]$/g, ''); // 去掉 IPv6 的方括号
  const resolvedIp = mockResolve(hostnameForLookup) ?? hostnameForLookup;
  if (hostnameForLookup !== resolvedIp && !mockDns.has(hostnameForLookup)) {
    return { ok: false, reason: `无法解析域名 ${parsed.hostname}（本演示不访问外部 DNS）` };
  }
  const ipCheck = isForbiddenIp(resolvedIp);
  if (ipCheck.blocked) {
    return { ok: false, reason: `${parsed.hostname} 解析到 ${resolvedIp}：${ipCheck.reason} —— 拒绝` };
  }

  // 关键：把校验通过的 IP **钉住**，后续连接只用这个 IP。
  // 否则 HTTP 客户端会自己再解析一次域名，给 DNS 重绑定留下攻击窗口。
  const pinned = new URL(parsed.toString());
  if (hostnameForLookup !== resolvedIp) pinned.hostname = resolvedIp;

  return { ok: true, pinnedUrl: pinned.toString(), ip: resolvedIp, host: parsed.hostname };
}

/**
 * 演示用的"HTTP 客户端"。
 * 本示例承诺**绝不访问外网**，所以这里用一个纯函数模拟响应，
 * 而不是真的把请求发出去。真实实现里，responses 应该来自真正的 HTTP 调用
 * （且必须使用 validateOutboundUrl 钉住的 IP 去建连）。
 * @param {string} pinnedUrl 已把域名替换成"钉住的 IP"的 URL
 * @returns {{status:number, headers:Record<string,string>, body:string}}
 */
function demoHttpGet(pinnedUrl) {
  const u = new URL(pinnedUrl);
  if (u.hostname === '93.184.216.34') {
    return { status: 200, headers: {}, body: '{"data":"这是构造出来的「公网」假响应"}' };
  }
  if (u.hostname === '203.0.113.7') {
    // 一个"看起来人畜无害"的公网地址，却把请求 302 到云元数据接口
    return { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data/' }, body: '' };
  }
  return { status: 0, headers: {}, body: '(演示环境的模拟客户端没有这个地址的响应)' };
}

/**
 * 安全地抓取一个用户提供的 URL（分层防御的完整实现）。
 * @param {string} userUrl
 * @param {{maxRedirects?:number, httpGet?:(url:string)=>{status:number, headers:Record<string,string>, body:string}}} [opts]
 * @returns {Promise<{ok:boolean, reason?:string, status?:number, body?:string}>}
 */
async function safeFetch(userUrl, opts = {}) {
  const maxRedirects = opts.maxRedirects ?? 0; // 默认不跟随任何重定向
  const httpGet = opts.httpGet ?? demoHttpGet;
  let current = userUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const check = validateOutboundUrl(current);
    if (!check.ok) {
      return { ok: false, reason: check.reason };
    }
    if (hop === 0) {
      console.log(`      [校验] ${check.host} -> ${check.ip}（已钉住），准备请求 ${check.pinnedUrl}`);
    } else {
      console.log(`      [第 ${hop} 跳校验] ${check.host} -> ${check.ip}（已钉住）`);
    }

    const res = httpGet(check.pinnedUrl);

    // ④ 重定向：要么不接受，要么对每一跳重新跑一遍完整校验
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      if (hop === maxRedirects) {
        return {
          ok: false,
          reason: `服务端返回 ${res.status} 重定向到 ${res.headers.location}，但策略不允许跟随重定向`,
        };
      }
      console.log(`      [重定向] -> ${res.headers.location}（将对新地址重跑全部校验）`);
      current = new URL(res.headers.location, current).toString();
      continue;
    }

    return { ok: true, status: res.status, body: res.body.slice(0, 200) };
  }
  return { ok: false, reason: '重定向次数超限' };
}

console.log('\n  同样的攻击载荷，交给安全抓取器（每一层防御都能看到）：');
const safePayloads = [
  [`${internalBase}/admin/users`, '回环地址打内网管理接口'],
  [`${internalBase}/latest/meta-data/iam/security-credentials/`, '回环地址读元数据'],
  ['http://metadata.internal/latest/meta-data/', '内部域名 → 169.254.169.254（云元数据）'],
  ['http://redis.internal:6379/', '内部域名 → 10.0.1.7（内网 Redis）'],
  ['http://internal.admin.local/admin', '内部域名 → 10.0.0.5（内网后台）'],
  ['file:///etc/passwd', 'file: 协议读本地文件'],
  ['gopher://127.0.0.1:6379/_SET%20x%20y', 'gopher: 协议走私（可打 Redis/内存缓存）'],
  ['http://2130706433/admin', '十进制 IP 形式的 127.0.0.1'],
  ['http://0x7f000001/admin', '十六进制 IP 形式的 127.0.0.1'],
  ['http://[::ffff:127.0.0.1]/admin', 'IPv4 映射的 IPv6 写法'],
  ['http://api.example.com/data', '公网地址（校验通过，本演示不真的发起请求）'],
];
for (const [url, desc] of safePayloads) {
  console.log(`\n    URL：${url}`);
  console.log(`    说明：${desc}`);
  const r = await safeFetch(url);
  console.log(`    结果：${r.ok ? `放行 -> ${r.status} ${r.body}` : `拒绝 -> ${r.reason}`}`);
}
console.log('\n  ↑ 全部在"发起请求之前"就被拒绝了 —— 这才是 SSRF 防御的正确位置。');
console.log('    最后一条公网地址通过了校验（真实实现到这里才会真的发起请求），');
console.log('    但本示例承诺不访问外网，所以用模拟客户端返回了一个构造的响应。');

console.log('\n--- 9. 那些容易被忽略的绕过手法 ---');
console.log('  (a) IP 写法的花样（下列写法都指向 127.0.0.1）：');
for (const ipForm of ['127.0.0.1', '2130706433', '0x7f000001', '127.1', '::ffff:127.0.0.1', '[::1]']) {
  const withoutBrackets = ipForm.replace(/^\[|\]$/g, '');
  const norm = normalizeIp(withoutBrackets);
  const check = isForbiddenIp(withoutBrackets);
  console.log(`      ${ipForm.padEnd(18)} -> 归一化 ${norm.padEnd(16)} ${check.blocked ? `【拦截：${check.reason}】` : '【放行 —— 有漏洞！】'}`);
}
console.log('      → 必须在校验前先归一化，否则"禁止 127.0.0.1"这种字符串黑名单形同虚设。');
console.log('      → 一个实测出来的坑（上面的归一化函数也专门处理了它）：');
console.log(`         new URL('http://[::ffff:127.0.0.1]/').hostname === ${JSON.stringify(new URL('http://[::ffff:127.0.0.1]/').hostname)}`);
console.log('         URL 解析器会把 IPv4 映射的 IPv6 地址**改写成十六进制形式**，');
console.log('         所以黑名单里写 "::ffff:127.0.0.1" 是匹配不到的 —— 必须按数值归一化后再比较。');

console.log('\n  (b) 重定向绕过（真实存在且非常常见）：');
console.log('      攻击者让服务端请求一个"看起来人畜无害"的公网地址，');
console.log('      该地址返回 302 跳到内网 —— 只校验初始 URL 的实现就中招了。');
console.log('      攻击者提交的 URL：http://redirector.example.com/go（解析到公网地址 203.0.113.7，能过第一层校验）');

console.log('\n      做法 A：完全不跟随重定向（最稳）');
const redirectA = await safeFetch('http://redirector.example.com/go');
console.log(`        -> ${JSON.stringify(redirectA)}`);

console.log('\n      做法 B：允许跟随，但对每一跳重新跑全套校验');
const redirectB = await safeFetch('http://redirector.example.com/go', { maxRedirects: 2 });
console.log(`        -> ${JSON.stringify(redirectB)}`);
console.log('      → 两种做法都挡住了：第一跳的公网地址合法，但第二跳跳到 169.254.169.254 时');
console.log('        被 IP 校验拦下。**危险的是"只校验第一次"的实现**，那种会被一步带进内网。');

console.log('\n      对照：如果服务端直接抓取内网地址，连第一层都过不了：');
const redirectC = await safeFetch(`${internalBase}/redirect-to-admin`);
console.log(`        请求 ${internalBase}/redirect-to-admin -> ${JSON.stringify(redirectC)}`);

console.log('\n  (c) DNS 重绑定（TOCTOU）：');
console.log('      攻击者控制的域名 evil.example 第一次解析返回 93.184.216.34（通过你的检查），');
console.log('      紧接着你把 URL 交给 HTTP 客户端，客户端**又解析了一次**，这次返回 127.0.0.1。');
console.log('      检查和连接之间隔了一次解析 —— 这个时间差就是攻击窗口。');
console.log('      防御：把校验过的 IP **钉住**，用同一个 IP 建连（自定义 lookup / Agent / 出网代理）。');
console.log('      这类攻击的时间窗口通常只有毫秒级，但通过极短的 TTL 可以做得非常稳定。');

console.log('\n  (d) 其它常见入口与兜底：');
for (const [entry, note] of [
  ['Webhook 回调地址', '很多系统允许用户填回调 URL —— 这是 SSRF 的经典入口'],
  ['URL 预览 / 抓取标题', '聊天软件、笔记应用、CMS 的"粘贴链接自动生成预览"'],
  ['图片/PDF 生成', '让服务端去拉一张"用户提供的图片"'],
  ['在线导入（从 URL 导入数据）', '导入 CSV / RSS / 电子表格'],
  ['SSO / OAuth 的 URL 参数', '某些实现会去请求用户提供的 issuer / jwks_uri'],
]) {
  console.log(`      · ${entry.padEnd(24)} ${note}`);
}
console.log('      网络层兜底（最有效的一层）：让发起外部请求的服务跑在独立的网络命名空间里，');
console.log('      强制走一个执行白名单的出网代理 —— 这样即使应用层漏了，也根本出不去内网。');

// ============================================================================
// 小结
// ============================================================================
console.log('\n--- 10. 小结 ---');
console.log('  【路径遍历】');
console.log('    1) path.join 是拼接工具，不是安全工具；它会如实帮你跳出去。');
console.log('    2) 正确姿势：resolve 成绝对路径后，判断"是否仍在 基准目录 + path.sep 之内"。');
console.log('    3) 只用 startsWith(base) 会被 /uploads-evil 这类"相邻目录"绕过 —— 必须加分隔符。');
console.log('    4) URL 解码只能做一次；空字节、冗余分隔符、绝对路径覆盖都要在入口处拦掉。');
console.log('    5) 最可靠的方案是"不接受路径"：用 ID 查表，或只取 basename + 白名单。');
console.log('  【SSRF】');
console.log('    6) SSRF 是"骗服务器发请求"，常被打向内网服务与云元数据（169.254.169.254）。');
console.log('    7) 四层防御：协议白名单 → 域名白名单 → 解析后校验 IP 并钉住 → 不跟随重定向。');
console.log('    8) IP 校验前必须先归一化（十进制、十六进制、IPv4 映射、IPv6 都要处理）。');
console.log('    9) 报错信息不要回显内网细节，避免把服务器变成免费的端口扫描器（08 篇）。');
console.log('    10) 应用层之外再加网络层兜底（独立网络命名空间 + 出网代理），才是最稳的。');

await new Promise((r) => internalServer.close(r));
console.log('\n[清理] 本地"内网服务"演示进程已关闭。全程未读取任何真实文件、未访问外网。退出码 0。');
