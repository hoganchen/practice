/**
 * ============================================================================
 * 知识点：锁文件（lockfile）与持续集成（CI）—— 让"装出来的东西"可复现
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】进阶
 * 【前置知识】39_tooling_and_workflow/01_package_json_guide.js、03_semver.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    · **锁文件**（`package-lock.json`）：npm 在安装依赖后自动生成的"依赖树快照"，
 *      逐条记录每个包的**精确版本、下载地址、内容哈希、是否开发依赖**。
 *    · **CI**（Continuous Integration，持续集成）：每次推送代码后，
 *      由服务器自动执行"安装 → lint → 测试 → 构建"这套流水线，
 *      用机器代替人去确认"这份代码是好的"。
 *    两者的共同目标是**可复现（reproducible）**：
 *    任何时间、任何机器、任何人，装出来的依赖树完全一致，跑出来的结果也一致。
 *
 * 2. 为什么需要（真实项目场景）
 *    没有锁文件时，`package.json` 里的 `^1.2.3` 只是"允许范围"（见 03_semver.js），
 *    今天装到 1.9.0，下周上游发了 1.10.0 就可能装到 1.10.0。
 *    于是出现经典事故：**"在我机器上是好的"**——
 *      · 同事 A 的本地是 3 个月前的依赖树，测试全过；
 *      · CI 是新装的，依赖树里混进了一个破坏性变更，构建直接挂；
 *      · 生产环境又是另一棵树，事故在凌晨两点爆发。
 *    锁文件 + `npm ci` 把这个问题从"靠运气"变成"靠机制"。
 *
 * 3. 核心语法要点
 *    本文件只**读**仓库里真实的 `package-lock.json`，不修改、不联网、不装包。
 *    我们会：
 *      · 拆开锁文件的真实结构，统计 dev / optional / integrity 的分布；
 *      · 现场演示"幽灵依赖"：能 import 到、却没在 package.json 里声明；
 *      · 复刻一次 `npm ci` 的核心校验逻辑（package.json 与锁文件是否一致）；
 *      · 用 node:crypto 复算一遍 integrity 哈希，证明它是什么。
 *
 * 4. 常见陷阱
 *    - 把 `package-lock.json` 加进 `.gitignore`：等于放弃了可复现性。
 *      锁文件**必须提交**（应用项目一定；库项目也建议）。
 *    - CI 上写 `npm install` 而不是 `npm ci`：
 *      前者可能悄悄升级依赖并**改写锁文件**，让 CI 结果不可信。
 *    - 手动改 `package.json` 的依赖后忘了跑 `npm install` 更新锁文件：
 *      `npm ci` 会直接报错退出（这其实是它最有价值的保护）。
 *    - 在代码里 `import` 一个没声明在 package.json 里的"幽灵依赖"：
 *      本地能跑，一旦上游不再依赖它，你的项目立刻崩。
 *    - 让 CI 去执行 `npm install` 而没有缓存：每次都从头下载，慢且容易超时。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/07_lockfile_and_ci.js
 *
 * 【预期输出】
 *   逐节打印：锁文件的作用与真实结构统计、lockfileVersion 的差异、
 *   resolved/integrity 的含义（含哈希现场复算）、npm ci 与 npm install 的对照、
 *   幽灵依赖的真实现象与危害、可复现构建的意义、
 *   自研的迷你一致性检查器、CI 流水线的典型阶段与每步失败的含义、
 *   git hooks 与 lint-staged 的思路。
 * ============================================================================
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOCK_PATH = path.join(ROOT, 'package-lock.json');
const PKG_PATH = path.join(ROOT, 'package.json');

console.log('--- 0. 只读声明 ---');
console.log(`本文件只读取 ${path.relative(ROOT, PKG_PATH)} 与 ${path.relative(ROOT, LOCK_PATH)}，`);
console.log('不写入任何文件、不执行 npm 安装、不访问网络。');
console.log();

const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
const lock = JSON.parse(fs.readFileSync(LOCK_PATH, 'utf8'));

// ---------------------------------------------------------------------------
// 1. 锁文件是什么
// ---------------------------------------------------------------------------
console.log('--- 1. package-lock.json 是什么 ---');

const lockStat = fs.statSync(LOCK_PATH);
console.log(`文件大小：${(lockStat.size / 1024).toFixed(1)} KB`);
console.log(`package.json 大小：${(fs.statSync(PKG_PATH).size / 1024).toFixed(2)} KB`);
console.log(
  `→ 锁文件比 package.json 大了约 ${Math.round(lockStat.size / fs.statSync(PKG_PATH).size)} 倍：`,
);
console.log('  声明只有十几个直接依赖，实际装进来的是上百个包（含传递依赖）。');
console.log('  "传递依赖"就是锁文件存在的根本原因——你从来没在 package.json 里写过它们，');
console.log('  但它们每一个都可能引入破坏性变更或安全漏洞。');
console.log();

const fmt = [
  ['你（或团队）写', 'package.json', '数量少、用范围（^/~）、表达"允许什么"'],
  ['npm 自动写', 'package-lock.json', '数量多、精确到每一层、表达"确定了什么"'],
  ['npm 生成', 'node_modules/', '实际下载解压出来的文件，可以被删掉重建'],
];
for (const [who, file, note] of fmt) {
  console.log(`  ${who.padEnd(14)} → ${file.padEnd(20)} ${note}`);
}
console.log();
console.log('  记住这条规则：**只有 package.json 是人写的，另外两个都是工具产物。**');
console.log('  所以永远不要手改 package-lock.json / node_modules。');
console.log();

// ---------------------------------------------------------------------------
// 2. 结构详解（用真实数据）
// ---------------------------------------------------------------------------
console.log('--- 2. 锁文件的真实结构 ---');

console.log(`顶层字段：${Object.keys(lock).join(', ')}`);
console.log(`lockfileVersion = ${lock.lockfileVersion}`);
console.log();

const versionNotes = [
  [1, 'npm 5 时代。只有 dependencies 一个嵌套树，无法表达依赖提升（hoisting）的实际结果'],
  [2, 'npm 7+。同时提供 packages（扁平路径映射）与 dependencies（向后兼容的树）两套表示'],
  [3, 'npm 9+。只保留 packages，文件更小、结构更清晰。**本仓库就是 v3**'],
];
for (const [v, note] of versionNotes) {
  const mark = v === lock.lockfileVersion ? ' ← 本仓库' : '';
  console.log(`  v${v}  ${note}${mark}`);
}
console.log();
console.log(`  version 字段（"${lock.version}"）与 lockfileVersion（${lock.lockfileVersion}）不是一回事：`);
console.log(`    "version" 是这个项目自己的版本号（跟 package.json 的 version 一致）；`);
console.log(`    lockfileVersion 是**锁文件格式的版本**，两者只是恰好都是小数字，别混淆。`);
console.log();

// rootEntry 里的 "键" 是空字符串，代表项目自身的 package.json 快照
const rootEntry = lock.packages[''];
console.log('  packages 里的第一个条目，键是空字符串 ""，它记录**项目自己**的声明：');
console.log(`    name = ${rootEntry.name}，version = ${rootEntry.version}`);
console.log(`    dependencies 数 = ${Object.keys(rootEntry.dependencies ?? {}).length}`);
console.log(`    devDependencies 数 = ${Object.keys(rootEntry.devDependencies ?? {}).length}`);
console.log(`    engines = ${JSON.stringify(rootEntry.engines)}`);
console.log('    → 这段内容和 package.json 一一对应。npm ci 就是靠比对这两处来判断"锁文件是否过期"。');
console.log();

// 统计整个依赖树
const allEntries = Object.entries(lock.packages).filter(([k, v]) => k !== '' && v.version);
let devCount = 0;
let optionalCount = 0;
let withEngines = 0;
let withPeerDeps = 0;
const integrityAlgos = new Map();

for (const [, info] of allEntries) {
  if (info.dev) devCount++;
  if (info.optional) optionalCount++;
  if (info.engines) withEngines++;
  if (info.peerDependencies) withPeerDeps++;
  if (info.integrity) {
    const algo = info.integrity.split('-')[0];
    integrityAlgos.set(algo, (integrityAlgos.get(algo) ?? 0) + 1);
  }
}

console.log(`  依赖树统计（共 ${allEntries.length} 个包）：`);
console.log(`    标记 "dev": true 的（仅开发需要）      ${devCount} 个`);
console.log(`    标记 "optional": true 的（装不上也行） ${optionalCount} 个`);
console.log(`    声明了 engines 的                       ${withEngines} 个`);
console.log(`    声明了 peerDependencies 的              ${withPeerDeps} 个`);
console.log(`    带 integrity 哈希的                     ${[...integrityAlgos.values()].reduce((a, b) => a + b, 0)} 个`);
console.log(`    哈希算法分布：${[...integrityAlgos.entries()].map(([a, n]) => `${a} × ${n}`).join('，')}`);
console.log();
console.log('  "dev": true 的意义很大：');
console.log(`    本仓库 ${allDevOrNot(devCount, allEntries.length)}。`);
console.log('    生产环境执行 `npm install --omit=dev` 时，这 ' + devCount + ' 个包全部不会被下载。');
console.log('    这就是 01 文件里强调"运行时依赖绝不能放进 devDependencies"的原因。');
console.log();

/** 生成一句关于 dev 依赖占比的描述 */
function allDevOrNot(devCount, total) {
  const pct = ((devCount / total) * 100).toFixed(0);
  return `${devCount} / ${total}（约 ${pct}%）的包只服务于开发（eslint、vitest、vite 及其依赖树）`;
}

// 抽一个具体的包，把它的完整条目打印出来
const sampleName = 'node_modules/semver';
const sample = lock.packages[sampleName];
if (sample) {
  console.log(`  抽一个具体条目看看（${sampleName}）：`);
  console.log(JSON.stringify(sample, null, 2).split('\n').map((l) => '    ' + l).join('\n'));
  console.log();
  console.log('    resolved  → tarball 的**确切下载地址**。锁定它，换 registry 或包被删除时就能立刻发现。');
  console.log('    integrity → 内容的密码学哈希，格式 <算法>-<base64 摘要>。');
  console.log('                下载后 npm 会重新算一遍哈希，对不上就拒绝安装。');
  console.log('                这防的是"内容被篡改/中间人替换"，是供应链安全的第一道闸门。');
  console.log('    dev       → 只有开发时需要，--omit=dev 时跳过。');
  console.log('    license   → 许可证，便于做合规扫描。');
  console.log('    engines   → 这个包自己声明的运行时要求。');
  console.log();
}

// ---------------------------------------------------------------------------
// 3. 现场复算 integrity 哈希，看清楚它是什么
// ---------------------------------------------------------------------------
console.log('--- 3. integrity 哈希到底是什么（现场复算） ---');

// integrity 的字面含义就是：把"内容的字节"做 sha512，再用 base64 编码，前面加算法名。
// 我们拿一段字符串模拟一个"包的内容"，走一遍同样的流程。
const fakeContent = Buffer.from('这是一个假的包内容，用来演示 integrity 的计算方式\n', 'utf8');
const digest = crypto.createHash('sha512').update(fakeContent).digest('base64');
const fakeIntegrity = `sha512-${digest}`;
console.log(`  假想的内容长度：${fakeContent.length} 字节`);
console.log(`  算出来的 integrity：${fakeIntegrity}`);
console.log(`  真实锁文件里 semver 的 integrity：${sample?.integrity ?? '(未找到)'}`);
console.log();
console.log('  可以看到两者格式完全一致：都是 "sha512-" + base64(sha512(文件字节))。');
console.log('  这就是为什么"改一个字节"就会导致哈希完全不同、安装被拒绝。');
console.log();

// 顺手证明"改一个字节，哈希完全变样"（雪崩效应）
const tampered = Buffer.from('这是一个假的包内容，用来演示 integrity 的计算方式!\n', 'utf8');
const tamperedDigest = crypto.createHash('sha512').update(tampered).digest('base64');
console.log(`  把最后一个字从"式"换成"!"（内容长度都没变），哈希变成：`);
console.log(`  sha512-${tamperedDigest}`);
console.log(`  两者相同吗：${digest === tamperedDigest} → 完全不同。这就是"内容寻址"的可靠性来源。`);
console.log();

// ---------------------------------------------------------------------------
// 4. npm ci 与 npm install 的区别
// ---------------------------------------------------------------------------
console.log('--- 4. npm ci 与 npm install ---');

const ciVsInstall = [
  ['读什么', '只读 package-lock.json，完全不看 package.json 里的范围', '读 package.json 的范围，必要时**更新**锁文件'],
  ['node_modules', '**先整个删掉**再重新装（干净安装）', '增量更新，保留已有内容，尽量少动'],
  ['锁文件过期时', '直接**报错退出**（这是保护，不是故障）', '默默把锁文件改写成新的版本'],
  ['能否装到新版本', '不能。锁文件写的是哪个版本就装哪个', '能。范围内有新版就装新版'],
  ['速度', '更快（跳过依赖解析，直接按锁定结果下载）', '较慢（要做版本求解）'],
  ['适用场景', '**CI / 生产部署 / 任何要可复现的地方**', '本地开发时主动升级依赖'],
];
console.log(`  ${'维度'.padEnd(16)} ${'npm ci'.padEnd(52)} npm install`);
for (const [dim, ci, install] of ciVsInstall) {
  console.log(`  ${dim.padEnd(16)} ${ci.padEnd(52)} ${install}`);
}
console.log();
console.log('  一句话：`npm install` 是"我要这个范围里的某个版本"，');
console.log('          `npm ci` 是"我就要这一个版本，别的都不行"。');
console.log('  CI 上要的正是后者——因为 CI 的结论必须能被任何人复现。');
console.log();

console.log('  CI 上正确的安装步骤（离线说明，本文件不执行）：');
console.log('    # 1) 用 npm ci 而不是 npm install');
console.log('    npm ci');
console.log('    # 2) 缓存目录要按锁文件的哈希做 key，锁文件变了缓存自动失效');
console.log('    #    GitHub Actions: key: ${{ runner.os }}-node-${{ hashFiles("**/package-lock.json") }}');
console.log('    # 3) 绝对不要加 --no-package-lock 之类的参数');
console.log();

// ---------------------------------------------------------------------------
// 5. 幽灵依赖：真实现象与危害
// ---------------------------------------------------------------------------
console.log('--- 5. 幽灵依赖（phantom dependency） ---');

const declared = new Map([
  ...Object.entries(pkg.dependencies ?? {}),
  ...Object.entries(pkg.devDependencies ?? {}),
]);

console.log(`  本仓库 package.json 只声明了 ${declared.size} 个直接依赖。`);
console.log('  但 node_modules 顶层实际有大量没被声明的包——它们是传递依赖被"提升"上来的。');

// 找几个"真实可解析、但没被声明"的包作为例子
const phantomCandidates = ['rollup', 'vite', 'esbuild', 'picomatch', 'postcss', 'nanoid', 'chokidar'];
console.log();
console.log(`  ${'包名'.padEnd(14)} ${'已声明？'.padEnd(10)} ${'能否 require.resolve 到'.padEnd(26)} 说明`);
for (const name of phantomCandidates) {
  const isDeclared = declared.has(name);
  let resolvable = false;
  let resolvedTo = '';
  try {
    // require.resolve 只做路径解析，**不会加载执行**这个包，
    // 所以这里完全不需要真的 import rollup / vite / esbuild。
    resolvedTo = require.resolve(name);
    resolvable = true;
  } catch {
    resolvable = false;
  }
  const note = resolvable
    ? isDeclared
      ? '正式依赖，正常'
      : '⚠ 幽灵依赖：能解析到，但没声明'
    : '（本机没装）';
  console.log(
    `  ${name.padEnd(14)} ${(isDeclared ? '是' : '否').padEnd(10)} ${(resolvable ? '能' : '不能').padEnd(26)} ${note}`,
  );
}
console.log();
console.log('  幽灵依赖为什么危险（真实事故路径）：');
console.log('    1) 你在代码里 import 了包 X（因为"反正能 require 到"），但没写进 package.json；');
console.log('    2) 某天直接依赖 A 升级，不再依赖 X —— npm 就不再把 X 提升到顶层；');
console.log('    3) 你的代码在**没人改动它**的情况下突然报 "Cannot find module \'X\'"。');
console.log('    更糟的是：pnpm / yarn PnP 这类**严格模式**的包管理器从一开始就不允许幽灵依赖，');
console.log('    切换到 pnpm 时，所有幽灵依赖会同时暴露——这就是"换包管理器炸一屏"的原因。');
console.log();

// 统计本仓库顶层被提升上来的包数量（这些就是"可能被误用"的候选）
const topLevelNames = new Set();
for (const key of Object.keys(lock.packages)) {
  if (!key.startsWith('node_modules/')) continue;
  const rest = key.slice('node_modules/'.length);
  if (rest.includes('node_modules/')) continue; // 嵌套的（未被提升）不算顶层
  topLevelNames.add(rest);
}
const phantomNames = [...topLevelNames].filter((n) => !declared.has(n));
console.log(`  统计：node_modules 顶层共有 ${topLevelNames.size} 个包，`);
console.log(`        其中 ${phantomNames.length} 个没有在 package.json 里声明 → 全是幽灵依赖的潜在来源。`);
console.log(`        它们里的大多数永远不会被你的代码直接用到，但**在被误用时不会报错**。`);
console.log();

// ---------------------------------------------------------------------------
// 6. 复刻 npm ci 的一致性校验
// ---------------------------------------------------------------------------
console.log('--- 6. 自己实现一个迷你 "npm ci 一致性检查器" ---');

/**
 * 检查 package.json 与 package-lock.json 是否一致。
 * 真实 npm ci 校验的东西比这多（依赖树完整性、integrity、平台可选依赖等），
 * 但"声明是否与锁文件根条目一致"是它最先做、也是最能提前发现问题的检查。
 *
 * @returns {{ problems: string[], checked: number }}
 */
function checkLockConsistency(manifest, lockfile) {
  const problems = [];
  const root = lockfile.packages[''];
  if (!root) {
    problems.push('锁文件缺少根条目（packages[""]），格式可能已损坏');
    return { problems, checked: 0 };
  }

  // 逐类比对：依赖名集合必须一致，范围字符串也必须一致
  for (const field of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const inManifest = manifest[field] ?? {};
    const inLock = root[field] ?? {};

    for (const [name, range] of Object.entries(inManifest)) {
      if (!(name in inLock)) {
        problems.push(`${field} 里有 "${name}"，但锁文件根条目里没有 → npm ci 会失败`);
      } else if (inLock[name] !== range) {
        problems.push(
          `${field} 里 "${name}" 的范围是 ${range}，锁文件里是 ${inLock[name]} → npm ci 会失败`,
        );
      }
    }
    for (const name of Object.keys(inLock)) {
      if (!(name in inManifest)) {
        problems.push(`锁文件根条目里有 "${name}"，但 package.json 的 ${field} 里没有 → 锁文件过期`);
      }
    }
  }

  // 锁文件里必须能在 packages 映射中找到每一个直接依赖
  for (const name of Object.keys({ ...manifest.dependencies, ...manifest.devDependencies })) {
    if (!lockfile.packages[`node_modules/${name}`]) {
      problems.push(`直接依赖 "${name}" 在锁文件的 packages 里查不到实际安装条目`);
    }
  }

  const checked = Object.keys({ ...manifest.dependencies, ...manifest.devDependencies }).length;
  return { problems, checked };
}

const { problems, checked } = checkLockConsistency(pkg, lock);
console.log(`  检查了 ${checked} 个直接依赖 + 锁文件根条目的字段一致性。`);
if (problems.length === 0) {
  console.log('  结果：✔ 完全一致 —— 在本仓库执行 `npm ci` 不会因为"锁文件过期"而失败。');
} else {
  console.log(`  结果：✘ 发现 ${problems.length} 处不一致：`);
  for (const p of problems) console.log(`    · ${p}`);
}
console.log();
console.log('  注意：这个检查在本仓库之所以通过，是因为 package-lock.json 一直跟着');
console.log('  package.json 一起提交。如果谁手动改了 package.json 的依赖却没跑 npm install，');
console.log('  上面就会立刻列出差异——这正是 CI 想要尽早发现的问题。');
console.log();

// 顺便验证每个直接依赖的锁定版本都落在声明的范围内（跨文件引用 03_semver.js 的知识）
const semver = require('semver');
console.log('  再顺手验证：每个直接依赖的锁定版本是否落在声明范围内（用 semver，见 03_semver.js）：');
let outOfRange = 0;
for (const [name, range] of declared) {
  const entry = lock.packages[`node_modules/${name}`];
  if (!entry) {
    console.log(`    ${name.padEnd(14)} ${range.padEnd(12)} → 锁文件里没有安装条目`);
    outOfRange++;
    continue;
  }
  const ok = semver.satisfies(entry.version, range);
  if (!ok) outOfRange++;
  console.log(
    `    ${name.padEnd(14)} ${range.padEnd(12)} → ${entry.version.padEnd(10)} ${ok ? '✔' : '✘ 超出范围'}`,
  );
}
console.log(`  超出范围的依赖数：${outOfRange}`);
console.log('  → 出现"超出范围"通常意味着有人在本地用 `npm install pkg@latest` 装完没提交锁文件的对应改动，');
console.log('    或者手工编辑过锁文件。两类情况都值得在 review 里拦下来。');
console.log();

// ---------------------------------------------------------------------------
// 7. 可复现构建
// ---------------------------------------------------------------------------
console.log('--- 7. 可复现构建（reproducible build） ---');

console.log('  定义：同一个 commit，在任何机器上、任何时候，构建出来的产物**逐字节相同**。');
console.log();
console.log('  为什么难做到（真实障碍）：');
const obstacles = [
  ['依赖版本漂移', '范围 ^1.2.3 可能装到不同版本', '锁文件 + npm ci'],
  ['传递依赖不可控', '你根本没声明过的包也会变', '锁文件记录整棵树'],
  ['安装顺序/文件系统差异', '大小写敏感、路径分隔符、软链接', 'CI 与生产用同构环境（容器）'],
  ['构建时间戳/随机数被写进产物', '产物体积相同但哈希不同', '让构建工具输出确定性产物'],
  ['平台相关的可选依赖', 'macOS 装 fsevents、Linux 不装', '用容器统一平台'],
  ['环境变量影响产物', 'NODE_ENV 不同 → 产物不同', 'CI 里显式声明所有构建期变量'],
];
console.log(`  ${'障碍'.padEnd(26)} ${'为什么'.padEnd(30)} 对策`);
for (const [obstacle, why, fix] of obstacles) {
  console.log(`  ${obstacle.padEnd(26)} ${why.padEnd(30)} ${fix}`);
}
console.log();
console.log('  可复现的直接收益：');
console.log('    · 事故排查时能确定"跑的就是当时那份代码"；');
console.log('    · 缓存能安全命中（内容一样 → 哈希一样 → 缓存有效）；');
console.log('    · 合规审计能回答"这个版本到底是哪份源码构建的"。');
console.log();

// ---------------------------------------------------------------------------
// 8. CI 流水线的典型阶段
// ---------------------------------------------------------------------------
console.log('--- 8. CI 流水线的典型阶段 ---');

const stages = [
  {
    stage: '① 安装',
    cmd: 'npm ci',
    fail: '锁文件与 package.json 不一致 / 网络或 registry 不可用 / 平台可选依赖缺失',
    why: '这一步失败**几乎总是配置问题**，与业务代码无关，先修环境再谈别的',
  },
  {
    stage: '② 静态检查',
    cmd: 'npm run lint 与 npm run format:check',
    fail: '有 lint error / 代码未格式化',
    why: '最便宜的一步：几秒钟就能拦下笔误与格式问题，不要让它排到测试后面',
  },
  {
    stage: '③ 类型检查',
    cmd: 'npm run typecheck（tsc --noEmit）',
    fail: '类型不匹配',
    why: 'TS 项目里这一步能在运行时之前发现大量错误；应与 lint 并行以省时间',
  },
  {
    stage: '④ 测试',
    cmd: 'npm test（含覆盖率门槛）',
    fail: '断言失败 / 覆盖率低于阈值',
    why: '唯一能证明"行为正确"的一步；覆盖率门槛防止"测试被悄悄删掉"',
  },
  {
    stage: '⑤ 构建',
    cmd: 'npm run build',
    fail: '打包报错 / 产物超体积预算',
    why: '测试用的是源码，构建产出的是**真正发布的东西**，两者必须都验',
  },
  {
    stage: '⑥ 产物校验',
    cmd: '对产物跑一次冒烟测试 / 检查 bundle 大小',
    fail: '产物跑不起来 / 体积暴涨',
    why: '能抓到"测试全过但打包配置写错"这类只在构建后才暴露的问题',
  },
  {
    stage: '⑦ 发布',
    cmd: 'npm publish（仅在 tag 上触发）',
    fail: '版本号已存在 / 权限不足 / prepublishOnly 检查未通过',
    why: '发布是不可逆的，所以它必须排在最后一环，且只在明确打 tag 时触发',
  },
];
for (const s of stages) {
  console.log(`  ${s.stage}`);
  console.log(`      命令：    ${s.cmd}`);
  console.log(`      失败含义：${s.fail}`);
  console.log(`      为什么放这：${s.why}`);
}
console.log();
console.log('  设计原则：**快的放前面，慢的放后面；能并行的并行。**');
console.log('    安装 → (lint ∥ typecheck) → test → build → 产物校验 → publish');
console.log('    任何一步失败就立刻停（就像 02 文件里讲的 `&&` 短路），不要浪费后续算力。');
console.log();
console.log('  本仓库的对应关系：');
console.log('    ② 静态检查 ≈ `npm run check`（跑通所有示例）与 `npm run check:html`');
console.log('    ⑤ 构建      ≈ 本仓库没有构建步骤——示例直接由 Node 运行源码（见 06 的"何时不需要打包"）');
console.log('    所以本仓库的 CI 只需要两步：`npm ci` + `npm run check:all`。');
console.log();

// ---------------------------------------------------------------------------
// 9. git hooks 与 lint-staged
// ---------------------------------------------------------------------------
console.log('--- 9. 提交前拦截：git hooks 与 lint-staged ---');

console.log('  git hooks 是 git 提供的钩子，放在 .git/hooks/ 下（默认是些 .sample 文件）。');
console.log('  问题：.git/ 不进版本库，所以钩子没法被团队共享。');
console.log('  解法：用 husky / simple-git-hooks 这类工具，把钩子"安装"到 .git/hooks/ 里，');
console.log('        而钩子的内容写在仓库内、可被提交的配置里。');
console.log();

const hooks = [
  ['pre-commit', '提交前', '跑 lint / 格式化 / 单测（**只跑改动过的文件**）', '最常用；要快，超过几秒开发者就会用 --no-verify 绕过'],
  ['commit-msg', '提交信息写完时', '校验提交信息格式（如必须符合 Conventional Commits）', '配合语义化发布自动生成 CHANGELOG'],
  ['pre-push', '推送前', '跑完整测试套件', '比 pre-commit 重，但比 CI 更快发现'],
  ['post-merge / post-checkout', '合并/切换分支后', '检测 package-lock.json 变化并提示 npm ci', '防止"依赖没更新导致的诡异报错"'],
];
console.log(`  ${'钩子'.padEnd(26)} ${'触发时机'.padEnd(16)} ${'典型任务'.padEnd(44)} 注意事项`);
for (const [hook, when, task, note] of hooks) {
  console.log(`  ${hook.padEnd(26)} ${when.padEnd(16)} ${task.padEnd(44)} ${note}`);
}
console.log();

console.log('  lint-staged 解决的核心痛点：**全量 lint 太慢**。');
console.log('    一个十万行的项目跑一次全量 ESLint 可能要 30 秒以上，');
console.log('    而一次提交往往只改了 1~2 个文件。');
console.log('    lint-staged 的做法是：只把"本次 git add 过的文件"喂给工具。');
console.log();
console.log('  典型配置（package.json 或 .lintstagedrc）：');
console.log('    {');
console.log('      "lint-staged": {');
console.log('        "*.js": ["eslint --fix", "prettier --write"],');
console.log('        "*.{json,md,css}": ["prettier --write"]');
console.log('      }');
console.log('    }');
console.log('    → 注意 `--fix` 与 `--write`：这里**允许改写文件**，');
console.log('      因为暂存区会被自动更新，修改结果是"提交前就修好了"。');
console.log();
console.log('  钩子的设计原则（踩过坑的团队都会认同）：');
console.log('    1) pre-commit 必须快（目标 3 秒内）。慢钩子 = 全员 --no-verify = 等于没有钩子。');
console.log('    2) 钩子里只做"能自动修好"的事，需要人判断的留给 CI。');
console.log('    3) 钩子是**效率工具**，不是**安全边界**——CI 才是。');
console.log('       因为钩子可以被 --no-verify 绕过，也可以在新机器上没装。');
console.log('       所以 CI 上必须把同一套检查再跑一遍（不依赖钩子）。');
console.log();

// ---------------------------------------------------------------------------
// 10. 速查
// ---------------------------------------------------------------------------
console.log('--- 10. 一页速查 ---');

const cheatsheet = [
  ['package-lock.json 该提交吗', '该。这是它能起作用的前提'],
  ['CI 上用哪个安装命令', 'npm ci（绝不改锁文件、可复现、更快）'],
  ['本地升级依赖', 'npm install pkg@latest，然后**提交一起变化的锁文件**'],
  ['锁文件冲突了怎么办', '别手工合并。以一方为基准重新 npm install 生成'],
  ['怎么查传递依赖', 'npm ls <包名>（离线可用）；或直接读锁文件的 packages 映射'],
  ['怎么发现幽灵依赖', '把 node_modules 删掉重装，或用 pnpm 严格模式跑一次'],
  ['钩子没生效', '先确认 husky 的 install 步骤执行过（npm install 的 prepare 钩子）'],
  ['CI 慢', '按锁文件哈希做缓存；把 lint/typecheck 与 test 并行；用 npm ci 而非 install'],
];
console.log(`  ${'问题'.padEnd(26)} 答案`);
for (const [q, a] of cheatsheet) {
  console.log(`  ${q.padEnd(26)} ${a}`);
}
console.log();

console.log('小结：锁文件把"依赖"从"范围"变成"确定"，');
console.log('      CI 把"我觉得没问题"变成"机器验证过没问题"。');
console.log('      两者合起来 = 可复现构建。');
