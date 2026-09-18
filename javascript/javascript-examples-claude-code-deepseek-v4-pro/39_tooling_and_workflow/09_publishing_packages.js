/**
 * ============================================================================
 * 知识点：把一个 npm 包真正发布出去 —— 提版本、预览产物、dist-tag 与"不可逆"
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】进阶
 * 【前置知识】39_tooling_and_workflow/01_package_json_guide.js（package.json 字段）、
 *             03_semver.js（版本号与范围）、07_lockfile_and_ci.js（CI 与可复现）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本仓库 39 目录前面的 01~08 讲的是"代码怎么在本机被开发、检查、构建出来"，
 *    也就是**本地的开发链路**；而"发布（publish）"是这条链路的**终点**：
 *    把你的产物打成 tarball、上传到 registry，让全世界 `npm install` 得到它。
 *    发布和构建是两件不同的事，很多人把它们混为一谈：
 *      · 构建（build）失败 → 你本机的目录里少一个文件，重跑即可，**可以撤销**；
 *      · 发布（publish）失败或做错 → registry 上多了一个**别人已经装走**的版本，
 *        **几乎无法撤销**（见第 9 节）。
 *    所以发布流程里最重要的不是"怎么敲命令"，而是"发之前怎么确认没发错"。
 *
 * 2. 为什么需要（真实项目场景）
 *    发布会出事，而且出的事都很贵。三个真实高频事故：
 *      · **把不该发的文件发出去了**：`.env`、测试夹具、几十 MB 的设计稿、
 *        甚至 `node_modules`。包体积从 50KB 变成 30MB，所有下游的安装都变慢；
 *        如果发的是密钥，那就是安全事故，而不只是工程问题。
 *      · **提错版本号**：该升 major 的破坏性变更只升了 patch，
 *        于是所有人 `npm update` 之后线上炸掉（对应 03_semver.js 讲的契约）。
 *      · **发出去才发现入口文件没打包进去**：用户 `import` 报错，
 *        而你只能再发一个补丁版本，还要面对已经装上有问题版本的机器。
 *    这三件事有个共同点：**都能在发布前用一条命令看出来**。
 *    本文件教的就是"怎么在发之前把它们看出来"。
 *
 * 3. 核心语法要点（本文件怎么演示）
 *    ⚠️ 本文件**不执行任何 npm 命令、不访问网络**（连 `npm pack` 都不跑）。
 *    取而代之，我们自己实现一个**发布前检查器**：
 *      · 读本仓库真实的 package.json 与 .gitignore；
 *      · 按 npm 的打包规则（npm-packlist 的规则，简化版）**模拟算出**
 *        "如果现在 `npm publish`，哪些文件会被装进 tarball"；
 *      · 打印清单 + 体积统计 + 风险提示。
 *    因为规则是"算"出来的而不是"跑"出来的，我们还能顺便做**反事实实验**：
 *    换一份假设的 package.json（只存在于内存里，绝不写盘），
 *    立刻看到"加了 files 字段之后会少发多少文件"。
 *
 * 4. 常见陷阱
 *    - 以为 `.gitignore` 会保护你：npm **只在没有 .npmignore 时**才回退用 .gitignore，
 *      而且一旦写了 `files` 字段，`.gitignore` 在根目录就**完全不生效**了。
 *    - 以为"我本地测试过了"就够了：本地是用源码目录跑的，
 *      用户拿到的是 tarball，**两者包含的文件集不一样**。
 *    - 以为 `npm version` 只是改个数字：它还会**自动 git commit + 打 git tag**，
 *      在脏工作区下会直接失败，在 CI 里还可能触发一次意外的推送。
 *    - 以为发布错了可以删：24 小时、72 小时的规则各有说法，
 *      但真正重要的是"**已经有别人装走了**"这件事无法撤回。
 *    - 以为 dist-tag 是版本号的一部分：`latest` 只是一个**指针**，可以随时改指。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/09_publishing_packages.js
 *
 * 【预期输出】
 *   逐节打印：发布到底发生了什么、提版本的三种方式与 git tag、CHANGELOG 的作用、
 *   npm pack / --dry-run 预览的是什么、**自研发布前检查器的完整输出**
 *   （当前仓库的模拟产物清单 + 体积 + 风险报告 + 反事实对照）、
 *   files 与 .npmignore 的优先级表、scoped 包与 --access、
 *   dist-tag 的用法与"发 beta → 提升为 latest"的流程、2FA 与 CI 的 NODE_AUTH_TOKEN、
 *   provenance 简介、"发布不可逆"的真实规则与 deprecate 替代方案、发布前检查清单。
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PKG_PATH = path.join(ROOT, 'package.json');

console.log('--- 0. 本文件的只读声明 ---');
console.log('本文件不会执行 npm publish / npm pack / npm install 或任何联网命令，');
console.log('也不会修改仓库里的任何文件（所有"反事实实验"只在内存中构造对象）。');
console.log(`它只读取：${path.relative(ROOT, PKG_PATH)}、.gitignore、.npmignore（若存在）`);
console.log('以及各示例文件的体积信息，用来模拟 npm 的打包文件清单。');
console.log();

const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));

// ---------------------------------------------------------------------------
// 1. npm publish 到底发生了什么
// ---------------------------------------------------------------------------
console.log('--- 1. `npm publish` 背后的五个步骤 ---');

const publishSteps = [
  ['① 读取元数据', '读 package.json：name / version / files / main / bin / dependencies…'],
  ['② 打包', '按 npm-packlist 规则挑出该进 tarball 的文件，压成 name-version.tgz'],
  ['③ 组装清单', '生成 tarball 的 integrity（sha512）与 "shasum"，写进随包上传的元数据'],
  ['④ 上传', 'PUT 到 registry（默认 registry.npmjs.org），带 Authorization 头（token / 2FA）'],
  ['⑤ 打标签', '在 registry 上把 dist-tag（默认 latest）指向这个新版本号'],
];
for (const [step, what] of publishSteps) console.log(`  ${step.padEnd(12)} ${what}`);
console.log();
console.log('  三个立刻能推出的结论：');
console.log('    · 第 ② 步决定"用户拿到什么"，是**唯一由本机决定**的一步，也是事故高发区；');
console.log('    · 第 ④ 步需要凭据，所以 CI 里要注入 token（见第 8 节）；');
console.log('    · 第 ⑤ 步叫"打标签"而不是"设置最新版"——`latest` 只是一个可改的指针（见第 7 节）。');
console.log();
console.log('  另外注意：registry 上的一个版本号一旦存在，**内容就不能再改**。');
console.log('  即使你重新 publish 同一个版本号，大多数 registry 也会直接拒绝（403）。');
console.log('  这是"发布不可逆"的技术根源：不是道德约束，是**内容寻址**的设计。');
console.log();

// ---------------------------------------------------------------------------
// 2. 提版本：三种方式与 git tag
// ---------------------------------------------------------------------------
console.log('--- 2. 提版本（version bump）的三种方式 ---');

console.log('  【方式 A】npm version —— 一条命令干三件事');
console.log('    npm version patch   # 1.0.0 → 1.0.1   修 bug');
console.log('    npm version minor   # 1.0.0 → 1.1.0   加功能');
console.log('    npm version major   # 1.0.0 → 2.0.0   破坏性变更');
console.log('    它实际做的是：改 package.json 的 version → git commit → **打一个 git tag**。');
console.log('    所以 `git push --follow-tags` 才是完整的推送姿势（少了 --follow-tags，tag 不会上传）。');
console.log('    ⚠️ 工作区脏（有未提交的改动）时它**直接失败**，这是刻意的保护：');
console.log('       "版本号 + 代码"必须原子地一起进版本库，否则 tag 指向的代码不是发出去的那份。');
console.log();
console.log('    预发布版本是另一种用法：');
console.log('    npm version prerelease --preid=beta   # 1.0.0 → 1.0.1-beta.0');
console.log('    npm version prerelease --preid=beta   # 再跑一次 → 1.0.1-beta.1');
console.log('    配合 03_semver.js 的结论：预发布版本**不会被 ^1.0.0 匹配到**，');
console.log('    所以发 beta 必须靠 dist-tag 而不是靠版本范围传播（见第 7 节）。');
console.log();
console.log('  【方式 B】手动改 package.json 的 version 字段');
console.log('    等价于 A 的前半步，但**没有 git tag**。适合"我就是不想被 git 绑架"的场景，');
console.log('    代价是版本与 commit 的对应关系从此只能靠人记。');
console.log();
console.log('  【方式 C】交给工具（semantic-release / changesets）');
console.log('    从 commit message（如 `feat:` / `fix:` / `BREAKING CHANGE:`）或变更描述文件里');
console.log('    自动推断该升哪一位，再自动打 tag、写 CHANGELOG、发版。');
console.log('    代价是流程变重、对 commit 规范的要求变严。见 11_monorepo_workspaces.js 里的演示。');
console.log();

console.log('  本仓库当前的版本信息（只读）：');
console.log(`    name    = ${pkg.name}`);
console.log(`    version = ${pkg.version}`);
console.log(`    private = ${pkg.private === true}   ← 这一条会直接决定 publish 能否成功（见第 5 节）`);
console.log();

// ---------------------------------------------------------------------------
// 3. CHANGELOG：给"人"看的版本说明
// ---------------------------------------------------------------------------
console.log('--- 3. CHANGELOG 写什么 ---');

console.log('  semver 是给**机器**看的（决定要不要自动升级），');
console.log('  CHANGELOG 是给**人**看的（决定要不要人工介入）。两者缺一不可。');
console.log();
console.log('  业界事实标准是 "Keep a Changelog" 的格式，长这样：');
console.log();
const changelogSample = [
  '# Changelog',
  '',
  '本文件记录所有值得注意的变更。格式参考 https://keepachangelog.com/zh-CN/1.1.0/ ，',
  '版本号遵循语义化版本（Semantic Versioning）。',
  '',
  '## [Unreleased]',
  '',
  '## [2.0.0] - 2025-03-14',
  '',
  '### Added',
  '- 新增 `parseStream()`，支持流式解析（#142）',
  '',
  '### Changed',
  '- **BREAKING**：`parse()` 的第二个参数从布尔值改为选项对象（#155）',
  '  迁移方式：`parse(src, true)` → `parse(src, { strict: true })`',
  '',
  '### Fixed',
  '- 修复空输入时抛出 TypeError 而非返回 null（#151）',
  '',
  '## [1.4.2] - 2025-02-01',
  '',
  '### Security',
  '- 升级 `foo` 到 3.2.1，修复 CVE-2025-XXXX',
  '',
  '[Unreleased]: https://github.com/acme/parser/compare/v2.0.0...HEAD',
  '[2.0.0]: https://github.com/acme/parser/compare/v1.4.2...v2.0.0',
];
for (const line of changelogSample) console.log(`    ${line}`);
console.log();
console.log('  三条实践要点：');
console.log('    1. 破坏性变更要写成"**怎么改**"，而不是"改了什么"。用户只关心迁移成本。');
console.log('    2. 有 CVE 的条目要单独列 Security 段，方便下游判断紧急程度。');
console.log('    3. CHANGELOG.md 通常会被打进 tarball（它不是 npm 的"强制包含"文件，');
console.log('       只是没人会去忽略它），而它是用户手上唯一的离线线索——');
console.log('       用户不会为了看你的变更说明专门去翻 GitHub。');
console.log();

// ---------------------------------------------------------------------------
// 4. npm pack：发布前的"预览"
// ---------------------------------------------------------------------------
console.log('--- 4. 预览：npm pack 与 npm publish --dry-run ---');

const previewCmds = [
  ['npm pack --dry-run', '只打印"会被打进 tarball 的文件清单 + 体积"，**不写文件、不上传**'],
  ['npm pack', '真的生成一个 name-version.tgz 放在当前目录，可以解开来看个够'],
  ['npm publish --dry-run', '走完 publish 的全部本地流程（含打包与元数据组装）但**跳过上传**'],
  ['npm pack --json', '把清单输出成 JSON，适合在 CI 里做体积回归（比如"超过 500KB 就失败"）'],
];
for (const [cmd, what] of previewCmds) console.log(`  ${cmd.padEnd(26)} ${what}`);
console.log();
console.log('  tarball 的命名规则：`name-version.tgz`；scoped 包会把 @ 与 / 换掉：');
console.log('    @acme/parser@2.0.0 → acme-parser-2.0.0.tgz');
console.log();
console.log('  ⚠️ 本文件**不执行**上面这几条命令（它们会读 .npmignore/.gitignore，');
console.log('     某些 npm 版本还会顺手查 registry 上的版本号，属于联网边缘）。');
console.log('     下面我们自己把"清单是怎么算出来的"完整实现一遍。');
console.log();

// ---------------------------------------------------------------------------
// 5. 自研发布前检查器 —— 本文件的核心
// ---------------------------------------------------------------------------
console.log('--- 5. 自研发布前检查器：模拟 npm 会打包哪些文件 ---');
console.log();

// ---- 5.1 npm 打包规则速查 ----
console.log('  [5.1] 规则速查（来自 npm-packlist 的行为，这里是简化实现）');
console.log();

const ruleTable = [
  ['永远包含', 'package.json / README* / LICENSE* / LICENCE* / COPYING*',
    '即使被 ignore 规则命中也会被塞回去（这部分不受你控制）'],
  ['永远包含', 'main / browser / bin 指向的文件，以及 files 里指向具体文件的条目',
    'main 被忽略时 npm 会照发并给出警告——这是"包能装但跑不起来"的经典来源'],
  ['永远忽略', 'node_modules、package-lock.json、yarn.lock、pnpm-lock.yaml、bun.lockb',
    '锁文件一律不进包：用户装你的包时会自己解析依赖，带一份别人的锁文件只会添乱'],
  ['永远忽略', '.git/.svn/.hg/CVS、.npmrc、.npmignore、.gitignore、npm-debug.log、',
    '.lock-wscript、build/config.gypi、.DS_Store、._*、*.orig、.*.swp'],
  ['优先级 1', 'package.json 的 files 字段（白名单）', '存在时，根目录的 .npmignore/.gitignore 全部失效'],
  ['优先级 2', '.npmignore（根目录）', '存在时，.gitignore 完全不参与'],
  ['优先级 3', '.gitignore（根目录）', '**仅当**没有 files、也没有 .npmignore 时才用它兜底'],
  ['优先级 4', '子目录里的 .npmignore / .gitignore', '在自己那一层生效（子目录可以有自己的规则）'],
  ['优先级 5', 'npm 的默认忽略规则（上表"永远忽略"）', '无论怎么配置都生效，是最后一道防线'],
];
console.log('    （上表来自 npm 自带的 npm-packlist 源码 lib/index.js，本机 npm 11.13.0 实测核对过。）');
console.log();
console.log('    两个容易被误传的点：');
console.log('      · **CHANGELOG 和 NOTICE 并不在"永远包含"清单里**（很多文章说有）。');
console.log('        真正强制包含的只有 package.json / README / LICENSE / LICENCE / COPYING / main / browser / bin。');
console.log('        CHANGELOG 之所以通常还是会被发出去，只是因为它没被任何忽略规则命中而已。');
console.log('      · package-lock.json 被忽略，但 **npm-shrinkwrap.json 不会被忽略**——');
console.log('        这是 npm 留给"我就是要连依赖树一起发"的逃生舱（只在确实需要时用）。');
for (const [level, pattern, note] of ruleTable) {
  console.log(`    ${level.padEnd(9)} ${pattern}`);
  console.log(`    ${' '.repeat(9)} └─ ${note}`);
}
console.log();
console.log('  ⚠️ 最反直觉的一条：**没有 files、也没有 .npmignore 时，npm 会拿 .gitignore 当忽略清单**。');
console.log('     这是"我明明没配过发布，怎么把仓库全发出去了"的根源，也是本仓库当前的状态。');
console.log();
console.log('  📌 而且 npm 在回退到 .gitignore 时会**主动打印一条警告**（npm 11 实测的原文）：');
console.log();
console.log('       npm warn gitignore-fallback No .npmignore file found, using .gitignore');
console.log('       for file exclusion. Consider creating a .npmignore file to explicitly');
console.log('       control published files.');
console.log();
console.log('     这条警告就是 npm 在提醒你："你正在用一个**为 git 写的**清单来决定**发布什么**。"');
console.log('     两者的目标并不一样：');
console.log('       · .gitignore 关心的是"哪些文件不该进版本库"（构建产物、依赖、密钥）；');
console.log('       · 发布关心的是"用户需要哪些文件"（入口、类型声明、README）。');
console.log('     它们碰巧有 90% 重合，剩下 10% 就是事故。');
console.log('     **如果你 publish 时见过这条 warn，就该去补一个 files 字段或 .npmignore 了。**');
console.log();

// ---- 5.2 实现：忽略规则解析 ----
console.log('  [5.2] 实现忽略规则解析（.gitignore / .npmignore 的语法子集）');

/** 把 glob 片段编译成正则。支持 * ? ** 三种通配。 */
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++;
        // `**/` 匹配"任意层级（含零层）"，单独的 `**` 匹配任意字符
        if (glob[i + 1] === '/') {
          i++;
          re += '(?:.*/)?';
        } else {
          re += '.*';
        }
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if ('\\^$+.()|{}[]'.includes(c)) {
      re += `\\${c}`;
    } else {
      re += c;
    }
  }
  return new RegExp(`^${re}$`);
}

/**
 * 解析 .gitignore / .npmignore 文本，返回规则数组。
 * 支持的语法子集：注释、空行、`!` 取反、结尾 `/` 表示只匹配目录、
 * 中间的 `/` 表示锚定到该文件所在目录、`*` `?` `**` 通配。
 */
function parseIgnoreFile(text, sourceName) {
  const rules = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (!line || line.startsWith('#')) continue;
    let pattern = line;
    let negate = false;
    if (pattern.startsWith('!')) {
      negate = true;
      pattern = pattern.slice(1);
    }
    let dirOnly = false;
    if (pattern.endsWith('/')) {
      dirOnly = true;
      pattern = pattern.slice(0, -1);
    }
    // 含 `/`（且不在结尾）的规则锚定到根；否则匹配任意层级的同名项
    const anchored = pattern.includes('/');
    if (pattern.startsWith('/')) pattern = pattern.slice(1);
    rules.push({ sourceName, negate, dirOnly, anchored, raw: line, regex: globToRegExp(pattern) });
  }
  return rules;
}

/** 一条规则是否命中某个相对路径（路径用 / 分隔） */
function ruleHits(rule, relPath) {
  if (rule.anchored) return rule.regex.test(relPath);
  // 非锚定规则：路径里任意一段匹配即可（git 的语义更细，这里够用）
  return relPath.split('/').some((seg) => rule.regex.test(seg));
}

/** 按 git 语义求解：最后一条命中的规则说了算（取反规则可以把东西捞回来） */
function isIgnored(rules, relPath) {
  let ignored = false;
  for (const rule of rules) {
    if (ruleHits(rule, relPath)) ignored = !rule.negate;
  }
  return ignored;
}
console.log('    已实现：globToRegExp / parseIgnoreFile / ruleHits / isIgnored');
console.log('    语义要点：**最后一条命中的规则说了算**，所以 `!` 取反必须写在后面才有效。');
console.log();

// ---- 5.3 npm 的默认忽略与永远包含 ----
// 这一组常量照抄 npm 自带 npm-packlist 的 defaults / strict 规则（见上面那张表的来源）
const NPM_ALWAYS_IGNORED_NAMES = new Set([
  '.git',
  '.svn',
  '.hg',
  'CVS',
  'node_modules',
  '.npmrc',
  '.npmignore',
  '.gitignore',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'npm-debug.log',
  '.lock-wscript',
  '.DS_Store',
  'archived-packages',
]);
const NPM_ALWAYS_IGNORED_GLOBS = [/^\._/, /\.orig$/, /^\..*\.swp$/, /^\.wafpickle-/];
/** README / LICENSE / LICENCE / COPYING / package.json 这类"永远包含"的文件名（取扩展名之前的部分） */
const NPM_ALWAYS_INCLUDED_STEMS = new Set(['package', 'readme', 'license', 'licence', 'copying']);

const isDefaultIgnored = (name) =>
  NPM_ALWAYS_IGNORED_NAMES.has(name) || NPM_ALWAYS_IGNORED_GLOBS.some((re) => re.test(name));

/** 名字是不是"永远包含"的那一类（package.json / README.md / LICENSE …） */
function isAlwaysIncludedName(name) {
  const lower = name.toLowerCase();
  if (lower === 'package.json') return true;
  const stem = lower.split('.')[0];
  return NPM_ALWAYS_INCLUDED_STEMS.has(stem);
}

// ---- 5.4 files 白名单匹配 ----
/** files 字段里的一条目是否覆盖某个相对路径（简化的 npm-packlist 语义） */
function filesEntryCovers(entry, relPath) {
  if (entry.startsWith('!')) return false; // `!` 取反不在跨包管理器可移植的子集里，这里忽略
  const clean = entry.replace(/^\.\//, '').replace(/\/+$/, '');
  if (!clean) return false;
  if (!/[*?[\]]/.test(clean)) {
    // 无通配：既匹配文件本身，也匹配它作为目录时的全部后代
    return relPath === clean || relPath.startsWith(`${clean}/`);
  }
  if (globToRegExp(clean).test(relPath)) return true;
  // `dist/**` 这类写法要能覆盖 dist/a/b.js
  const m = clean.match(/^(.*?)\/\*\*?$/);
  if (m && (relPath === m[1] || relPath.startsWith(`${m[1]}/`))) return true;
  return false;
}

/**
 * 判断是否值得为了某条 files 白名单继续往这个目录里走。
 * 这一步不能省：`files: ["dist/a.js"]` 时，如果因为 dist 目录"本身不匹配"
 * 就跳过整个目录，a.js 永远也找不到。
 */
function entryMayCoverDir(entry, dirRel) {
  const clean = entry.replace(/^\.\//, '').replace(/\/+$/, '');
  if (!clean) return false;
  // 通配符之前的那一段就是"可能命中"的最长确定前缀
  const prefix = (/[*?[\]]/.test(clean) ? clean.split(/[*?[\]]/)[0] : clean).replace(/\/+$/, '');
  return dirRel === prefix || dirRel.startsWith(`${prefix}/`) || prefix.startsWith(`${dirRel}/`);
}

// ---- 5.5 主流程：算出一份"会被发布"的文件清单 ----
/**
 * 模拟 npm 的打包文件清单。
 * @param {object} opts
 * @param {object} opts.pkgJson     用来判定的 package.json 内容（可以是内存里的假想对象）
 * @param {string|null} opts.npmignoreText 假想的 .npmignore 内容；undefined 表示"按磁盘真实情况"
 */
async function simulatePackList({ pkgJson, npmignoreText }) {
  const filesField = Array.isArray(pkgJson.files) && pkgJson.files.length > 0 ? pkgJson.files : null;

  const npmignorePath = path.join(ROOT, '.npmignore');
  const gitignorePath = path.join(ROOT, '.gitignore');

  let effectiveIgnoreText = npmignoreText;
  let ignoreSource;
  if (filesField) {
    ignoreSource = '不使用（files 白名单优先）';
    effectiveIgnoreText = '';
  } else if (effectiveIgnoreText !== undefined) {
    ignoreSource = '.npmignore（假想）';
  } else if (fs.existsSync(npmignorePath)) {
    effectiveIgnoreText = fs.readFileSync(npmignorePath, 'utf8');
    ignoreSource = '.npmignore';
  } else if (fs.existsSync(gitignorePath)) {
    effectiveIgnoreText = fs.readFileSync(gitignorePath, 'utf8');
    ignoreSource = '.gitignore（回退！）';
  } else {
    effectiveIgnoreText = '';
    ignoreSource = '无（连 .gitignore 都没有）';
  }

  const rules = parseIgnoreFile(effectiveIgnoreText, ignoreSource);
  const included = [];
  let scanned = 0;

  // main / browser / bin 指向的文件属于"永远包含"，先记下来
  // （注意：`module` 字段**不在** npm 的强制包含清单里，它只是打包器的约定，见 10 号文件）
  const forced = new Set();
  for (const key of ['main', 'browser']) {
    if (typeof pkgJson[key] === 'string') forced.add(pkgJson[key].replace(/^\.\//, ''));
  }
  if (typeof pkgJson.bin === 'string') forced.add(pkgJson.bin.replace(/^\.\//, ''));
  else if (pkgJson.bin && typeof pkgJson.bin === 'object') {
    for (const v of Object.values(pkgJson.bin)) forced.add(String(v).replace(/^\.\//, ''));
  }

  async function walk(dir, rel) {
    let entries;
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;

      // 第一道：npm 的默认忽略（永远生效，任何配置都覆盖不了）
      if (isDefaultIgnored(entry.name)) {
        scanned++;
        continue;
      }

      if (entry.isDirectory()) {
        // 第二道：files 白名单（目录必须有可能被某条白名单覆盖才值得往下走）
        if (filesField && !filesField.some((e) => entryMayCoverDir(e, childRel))) {
          scanned++;
          continue;
        }
        // 第三道：忽略规则
        if (!filesField && isIgnored(rules, childRel)) {
          scanned++;
          continue;
        }
        await walk(path.join(dir, entry.name), childRel);
        continue;
      }

      if (!entry.isFile()) continue;
      scanned++;
      const full = path.join(dir, entry.name);
      const size = fs.statSync(full).size;

      // 永远包含的名字：无论规则怎么写都进包
      if (isAlwaysIncludedName(entry.name)) {
        included.push({ rel: childRel, size, why: '永远包含' });
        continue;
      }
      if (forced.has(childRel)) {
        included.push({ rel: childRel, size, why: 'main/browser/bin 指向' });
        continue;
      }
      if (filesField) {
        if (filesField.some((e) => filesEntryCovers(e, childRel))) {
          included.push({ rel: childRel, size, why: 'files 白名单' });
        }
        continue;
      }
      if (!isIgnored(rules, childRel)) {
        included.push({ rel: childRel, size, why: '忽略规则没排除' });
      }
    }
  }

  await walk(ROOT, '');
  return { included, scanned, ignoreSource, filesField };
}

// ---- 5.6 敏感文件启发式扫描 ----
const SENSITIVE_PATTERNS = [
  [/^\.env/, '.env 环境变量文件（几乎肯定含密钥）'],
  [/\.pem$|\.key$|\.p12$|\.pfx$/, '私钥 / 证书文件'],
  [/^id_rsa|^id_ed25519|^\.ssh/, 'SSH 私钥'],
  [/credential|secret|password/i, '文件名里出现凭据相关词'],
  [/\.sqlite$|\.db$/, '本地数据库文件'],
  [/\.npmrc$/, '.npmrc（可能含 authToken）'],
  [/\.log$/, '日志文件（可能含用户数据）'],
  [/\.(heapsnapshot|cpuprofile|heapprofile)$/, '性能剖析产物（体积巨大）'],
  [/\.test\.js$|\.spec\.js$|^__tests__$|^tests?$/, '测试代码（用户不需要）'],
];
function scanSensitive(list) {
  const hits = [];
  for (const item of list) {
    for (const [re, label] of SENSITIVE_PATTERNS) {
      if (re.test(item.rel) || re.test(path.basename(item.rel))) {
        hits.push({ ...item, label });
        break;
      }
    }
  }
  return hits;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * 估算 tarball 体积。
 * npm 上传的是 gzip 压缩后的 tarball，所以"源码目录 11 MB"和"用户要下载 11 MB"
 * 是两回事。这里对每个文件单独做一次 gzip 再求和，是一个**偏保守（偏大）**的估算：
 * 真实的 tar+gzip 会把所有文件放在一个流里压，跨文件还能共享一部分字典，通常会再小一些。
 */
function estimateTarball(included) {
  let gz = 0;
  for (const item of included) {
    try {
      gz += zlib.gzipSync(fs.readFileSync(path.join(ROOT, item.rel)), { level: 9 }).length;
    } catch {
      // 读不到就跳过（例如符号链接），不影响结论
    }
  }
  return gz;
}

/** 把一次模拟的结果打印出来 */
async function report(tag, title, opts) {
  console.log(`  [${tag}] ${title}`);
  const result = await simulatePackList(opts);
  const total = result.included.reduce((s, x) => s + x.size, 0);
  const biggest = [...result.included].sort((a, b) => b.size - a.size).slice(0, 5);
  const tarball = estimateTarball(result.included);

  console.log(`    忽略清单来源：${result.ignoreSource}`);
  console.log(`    files 字段  ：${result.filesField ? JSON.stringify(result.filesField) : '（没有）'}`);
  console.log(`    扫描过的条目：${result.scanned} 个（含目录与“永远忽略”的项）`);
  console.log(`    会被发布    ：${result.included.length} 个文件，原始体积合计 ${formatBytes(total)}`);
  console.log(`    tarball 估算：约 ${formatBytes(tarball)}（gzip 后，用户实际下载的大小）`);
  console.log(`    体积最大的 5 个：`);
  for (const f of biggest) {
    console.log(`      ${formatBytes(f.size).padStart(9)}  ${f.rel}   (${f.why})`);
  }
  const hasReadme = result.included.some((x) => /^readme(\.|$)/i.test(x.rel));
  console.log(`    README 是否进包：${hasReadme ? '是 ✅' : '否'}（"永远包含"规则，不受忽略规则影响）`);
  const sensitive = scanSensitive(result.included);
  console.log(`    敏感文件扫描：${sensitive.length === 0 ? '✅ 无命中' : `⚠️ 命中 ${sensitive.length} 个`}`);
  for (const s of sensitive.slice(0, 8)) {
    console.log(`      ⚠️ ${s.rel}  ← ${s.label}`);
  }
  console.log();
  return { ...result, total, tarball, sensitive, biggest };
}

// ---- 5.7 反事实实验一：现状 ----
console.log('  [5.7] 实验一：**本仓库的现状**（无 files、无 .npmignore、有 .gitignore）');
console.log('       这就是"随手写了个库、什么都没配"的真实状态。');
console.log();
const current = await report('5.7', '当前 package.json 的模拟发布产物', { pkgJson: pkg });

// ---- 5.8 反事实实验二：加 files 白名单 ----
console.log('  [5.8] 实验二：**如果给这份 package.json 加上 files 白名单**（只在内存里改，不写盘）');
console.log('       假设这个仓库真的要做成一个库去发布，最小的白名单示意：');
console.log('         "files": ["package.json", "README.md", "39_tooling_and_workflow/09_publishing_packages.js"]');
console.log('       真实项目里通常写成 ["dist", "README.md"] —— 注意目录名等价于"整个目录全要"。');
console.log();
const hypothetical = {
  ...pkg,
  files: ['package.json', 'README.md', '39_tooling_and_workflow/09_publishing_packages.js'],
};
const withFiles = await report('5.8', '加了 files 白名单之后的模拟产物', { pkgJson: hypothetical });

// ---- 5.9 反事实实验三：.npmignore 覆盖 .gitignore ----
console.log('  [5.9] 实验三：**如果加了 .npmignore（内容是"忽略所有 .md"）**');
console.log('       用来验证两件事：① 有 .npmignore 时 .gitignore 是否还起作用；');
console.log('       ② README.md 明明被 *.md 命中，却依然进包 —— 因为"永远包含"规则优先级更高。');
console.log();
const npmignoreHypo = ['# 假想的 .npmignore：忽略所有 markdown', '*.md'].join('\n');
const withNpmignore = await report('5.9', '.npmignore 生效时的模拟产物（假想内容：*.md）', {
  pkgJson: pkg,
  npmignoreText: npmignoreHypo,
});

// ---- 5.10 结论与风险报告 ----
console.log('  [5.10] 三次实验的对照与风险报告');
console.log();
console.log(`    ${'场景'.padEnd(28)} ${'文件数'.padEnd(8)} ${'原始体积'.padEnd(12)} ${'tarball'.padEnd(12)} 一句话`);
const compareRows = [
  ['现状（无 files/.npmignore）', current, '整个仓库＋术语表全发出去'],
  ['加 files 白名单', withFiles, '只发白名单里的东西'],
  ['加 .npmignore（忽略 *.md）', withNpmignore, '.gitignore 被顶替，规则重写了一遍'],
];
for (const [label, r, note] of compareRows) {
  console.log(
    `    ${label.padEnd(28)} ${String(r.included.length).padEnd(8)} ${formatBytes(r.total).padEnd(12)} ${formatBytes(r.tarball).padEnd(12)} ${note}`,
  );
}
console.log();
console.log(
  `    数字说明一切：**"什么都没配"和"配了白名单"之间差了 ${Math.round(current.included.length / withFiles.included.length)} 倍的文件数、${Math.round(current.total / withFiles.total)} 倍的体积。**`,
);
console.log('    而且注意 tarball 那一列：gzip 之后体积会小很多，但**文件个数不会变小**，');
console.log('    用户的安装时间、磁盘占用、以及"包里有没有不该有的东西"的风险都不会变小。');
console.log();
console.log('    对当前仓库逐条体检（这些正是发布前检查清单要问的问题）：');

const hasLicenseFile = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE'].some((f) =>
  fs.existsSync(path.join(ROOT, f)),
);
const hasFilesOrNpmignore = Boolean(pkg.files) || fs.existsSync(path.join(ROOT, '.npmignore'));
const biggestShare = ((current.biggest[0].size / current.total) * 100).toFixed(0);
const checklist = [
  [
    'private 字段',
    pkg.private === true ? 'ok' : 'warn',
    pkg.private === true
      ? 'private: true —— publish 会被 registry 直接拒绝，这是本仓库的保护伞'
      : '未设置 private —— 任何 clone 下来的人都能把它 publish 到这个名字下',
  ],
  [
    'files/.npmignore',
    hasFilesOrNpmignore ? 'ok' : 'warn',
    hasFilesOrNpmignore
      ? '已配置'
      : `两个都没有 → 只能靠 .gitignore 兜底，结果仍然发布了 ${current.included.length} 个文件`,
  ],
  [
    'LICENSE 文件',
    hasLicenseFile ? 'ok' : 'warn',
    hasLicenseFile ? '存在' : '没有 LICENSE —— npm publish 会打印 warning，法务上也等于"未授权使用"',
  ],
  [
    'license 字段',
    typeof pkg.license === 'string' ? 'ok' : 'warn',
    typeof pkg.license === 'string' ? pkg.license : 'package.json 里没有 license 字段（npm publish 会打印 warning）',
  ],
  [
    'README',
    fs.existsSync(path.join(ROOT, 'README.md')) ? 'ok' : 'warn',
    'README.md 存在，会被"永远包含"规则打包',
  ],
  [
    'repository',
    pkg.repository ? 'ok' : 'warn',
    '没有 repository 字段 —— 用户在 npm 页面上找不到源码地址，provenance 也无从关联',
  ],
  [
    '版本号',
    pkg.version === '1.0.0' ? 'ok' : 'info',
    `version = ${pkg.version}：1.0.0 之前 semver 的承诺很轻，破坏性变更的代价最低`,
  ],
  [
    '大体积文件',
    current.biggest[0].size < 200 * 1024 ? 'ok' : 'warn',
    `最大单文件 ${current.biggest[0].rel} = ${formatBytes(current.biggest[0].size)}，占总体积 ${biggestShare}%`,
  ],
  [
    '敏感文件',
    current.sensitive.length === 0 ? 'ok' : 'warn',
    current.sensitive.length === 0
      ? '.env / node_modules 被 .gitignore 挡住了（但这是"顺手挡住的"，不是设计出来的）'
      : `命中 ${current.sensitive.length} 个，逐个确认`,
  ],
];
const markOf = { ok: '✅', warn: '⚠️ ', info: 'ℹ️ ' };
for (const [item, state, note] of checklist) {
  console.log(`      ${markOf[state]} ${item.padEnd(18)} ${note}`);
}
console.log();
console.log('    最重要的一条结论：**本仓库是 private: true 的示例仓库，永远不该被发布。**');
console.log('    但"private 挡住了"和"配置是对的"完全是两回事：');
console.log('    把 private 去掉的那一刻，上面这些文件就会连同仓库一起被发出去。');
console.log();

// ---------------------------------------------------------------------------
// 6. files 与 .npmignore 的优先级（决策树）
// ---------------------------------------------------------------------------
console.log('--- 6. files 与 .npmignore：到底谁说了算 ---');
console.log();
console.log('    npm 判断一个文件是否进包的顺序（从高到低）：');
console.log('      1. 是不是"永远忽略"？（.git / node_modules / package-lock.json …）→ 是就出局，无商量');
console.log('      2. 是不是"永远包含"？（package.json / README / LICENSE / COPYING / main / browser / bin）→ 是就进包，无商量');
console.log('      3. package.json 有 files 字段吗？');
console.log('           有 → 只发 files 覆盖到的文件，**根目录的 .npmignore/.gitignore 全部作废**');
console.log('           无 → 看 4');
console.log('      4. 根目录有 .npmignore 吗？');
console.log('           有 → 按它的规则来（.gitignore 完全不参与）');
console.log('           无 → 按根目录的 .gitignore 来');
console.log('      5. 子目录里自己的 .npmignore / .gitignore 在那一层生效（三层规则里的"局部规则"）');
console.log();
console.log('  三条容易踩反的推论：');
console.log('    · 写了 files 之后，`.gitignore` 里那些"忽略 dist/ 里的测试文件"之类的规则**不再保护你**；');
console.log('      要排除就用"把东西挪进子目录 + 子目录里放 .npmignore"这个组合。');
console.log('    · files 里写目录名（如 "dist"）等价于"整个目录全要"，写单文件则只发那一个；');
console.log('    · files 里的 `!` 取反**不在可移植子集里**（npm 官方文档没有承诺，pnpm 支持）。');
console.log('      想排除某个具体文件，最稳的做法是把它移到一个不被 files 覆盖的位置。');
console.log();
console.log('  一个被广泛推荐的保守写法：**宁可白名单，不要黑名单**。');
console.log('    "files": ["dist", "README.md", "LICENSE", "CHANGELOG.md"]');
console.log('    这样新增的临时文件、测试夹具、编辑器配置**默认不会被发出去**——');
console.log('    安全默认值应该是"不发"，而不是"发了再补规则"。');
console.log();

// ---------------------------------------------------------------------------
// 7. scoped 包、dist-tag 与发布通道
// ---------------------------------------------------------------------------
console.log('--- 7. scoped 包与 dist-tag ---');
console.log();
console.log('  【scoped 包】@acme/parser 这种带 @scope 的名字，默认按"私有"处理：');
console.log('    npm publish                  # 私有包需要付费账号，否则报 402 Payment Required');
console.log('    npm publish --access public  # 显式声明"公开"，人人可装（免费）');
console.log('  也可以在 package.json 里写死，省得每次敲：');
console.log('    "publishConfig": { "access": "public", "registry": "https://registry.npmjs.org/" }');
console.log('  这个字段的另一半用处是**锁定 registry**：防止本机 .npmrc 里的私有源把它发到错误的地方。');
console.log();
console.log('  【dist-tag】发布通道。核心认知：**dist-tag 是"指向某个版本的指针"，不是版本的一部分。**');
console.log();
const distTags = [
  ['latest', '默认通道。`npm i pkg` 装的就是它指向的版本', 'npm publish（不写 --tag 时）'],
  ['beta', '公测通道，给人试用但不影响普通用户', 'npm publish --tag beta'],
  ['next', '下一个大版本的预览通道（next 常被大厂用来发 vN+1 的早期版本）', 'npm publish --tag next'],
  ['legacy / v1', '给老旧分支留一条安装通道（`npm i pkg@legacy`）', 'npm dist-tag add pkg@1.9.9 legacy'],
];
for (const [tag, use, how] of distTags) {
  console.log(`    ${tag.padEnd(12)} ${use}`);
  console.log(`    ${' '.repeat(12)} 怎么打上：${how}`);
}
console.log();
console.log('  常用命令：');
console.log('    npm dist-tag ls pkg                 # 列出所有 tag 指向哪');
console.log('    npm dist-tag add pkg@1.2.0 latest   # 把 latest 挪到 1.2.0（**不重新发布**）');
console.log('    npm dist-tag rm pkg next            # 删掉一个 tag');
console.log();
console.log('  于是"发 beta 再转正"有两条完全不同的路：');
console.log('    路 A（推荐）：npm publish --tag beta → 用 npm dist-tag add pkg@1.2.0 latest 转正');
console.log('                  优点：tarball 是**同一个**，用户装 beta 时验过的就是最终的东西；');
console.log('    路 B（危险）：直接 npm publish（latest），发现有问题再发一个补丁版本。');
console.log('                  问题：如果你手快发了两个版本，用户可能已经装上了坏的那个。');
console.log('    还有一条路 C 要避开：重发同一个版本号去"覆盖"错误版本 —— **registry 会拒绝**。');
console.log();
console.log('  ⚠️ `npm publish --tag beta` 之后，`latest` 仍指向旧版本，这是刻意的：');
console.log('     beta 用户用 `npm i pkg@beta` 装，普通用户不受影响。');
console.log('     这也解释了 03_semver.js 的结论：**beta 靠 tag 传播，不靠版本范围传播**。');
console.log();

// ---------------------------------------------------------------------------
// 8. 凭据：2FA 与 CI 里的 NODE_AUTH_TOKEN
// ---------------------------------------------------------------------------
console.log('--- 8. 认证：2FA、NODE_AUTH_TOKEN 与 provenance ---');
console.log();
console.log('  【本机】npm login 之后，token 被写进 ~/.npmrc（或系统钥匙串）。');
console.log('    开了 2FA（强烈建议）之后，publish 会要求输入一次性验证码。');
console.log('    自动化场景可以用"Granular Access Token"，可以限定它只能发布特定 scope 的包。');
console.log();
console.log('  【CI】绝不要把 token 写进仓库。标准做法是**环境变量 + .npmrc 插值**：');
console.log();
const ciNpmrc = [
  '# .npmrc —— 注意：这个文件应该被 .gitignore 忽略，绝不能提交',
  '//registry.npmjs.org/:_authToken=${NPM_TOKEN}',
  'registry=https://registry.npmjs.org/',
  '',
  '# CI 里更省事的替代：直接用环境变量注入（见下面的 workflow）',
  '# npm 会把所有 npm_config_* 环境变量当作配置项（见 12_npmrc_and_registry.js）',
];
for (const line of ciNpmrc) console.log(`    ${line}`);
console.log();
console.log('  `${NPM_TOKEN}` 是 npm 自己支持的**变量插值**：读取同名环境变量。');
console.log('  所以 CI 里不需要任何写文件的步骤，只要：');
console.log('    env: { NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} }');
console.log('  然后用 `npm publish` —— 注意 npm 读的是 **NODE_AUTH_TOKEN** 这个约定名，');
console.log('  而 .npmrc 里插值写的是 `${NPM_TOKEN}`，**两个名字对应的是不同的机制**：');
console.log('    · NODE_AUTH_TOKEN → 由 setup-node 之类的 action 写进临时的 .npmrc；');
console.log('    · ${NPM_TOKEN}    → npm 自己读环境变量做插值。');
console.log('  混用是最常见的"CI 里 401 但本地能发"的根因（排查顺序见 12_npmrc_and_registry.js）。');
console.log();
const workflow = [
  '# .github/workflows/publish.yml —— GitHub Actions 的标准发版流水线',
  'name: Publish',
  'on:',
  '  release:',
  '    types: [published]        # 只有"发布 Release"这个动作才触发，避免误发',
  'jobs:',
  '  publish:',
  '    runs-on: ubuntu-latest',
  '    permissions:',
  '      contents: read',
  '      id-token: write         # ← 用 OIDC trusted publishing / provenance 必须开这个',
  '    steps:',
  '      - uses: actions/checkout@v4',
  '      - uses: actions/setup-node@v4',
  '        with:',
  '          node-version: 20',
  '          registry-url: https://registry.npmjs.org/',
  '      - run: npm ci            # CI 一律用 ci 而不是 install（见 07_lockfile_and_ci.js）',
  '      - run: npm test',
  '      - run: npm publish --provenance --access public',
  '        env:',
  '          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}',
];
for (const line of workflow) console.log(`    ${line}`);
console.log();
console.log('  【provenance（来源证明）】`npm publish --provenance` 会让 npm 用 Sigstore 把');
console.log('  "这个 tarball 由哪个仓库、哪个 commit、哪条流水线构建出来"签成一份**可验证的凭据**，');
console.log('  附在包上。用户在 npm 页面能看到一个"Built and signed on GitHub Actions"的绿标。');
console.log('  它解决的是供应链问题：**"我装到的这个包，真的来自那个 GitHub 仓库吗？"**');
console.log('  前提条件是"在支持 OIDC 的 CI 里发布"，本机 publish 生成不了。');
console.log();

// ---------------------------------------------------------------------------
// 9. 发布不可逆
// ---------------------------------------------------------------------------
console.log('--- 9. 为什么说"发布是不可逆的" ---');
console.log();
console.log('  先记住最重要的一句：**你能删掉 registry 上的版本，但删不掉别人已经装走的副本。**');
console.log();
const unpublishRules = [
  ['72 小时内', '可以自助 unpublish 单个版本（npm 现行规则；很多文章至今仍写"24 小时"，那是旧规则）'],
  ['72 小时后', '自助通道关闭，只能联系 npm support 申请，成功率很低'],
  ['被依赖时', '只要有任何已发布包依赖它，或近一周下载量超过阈值，unpublish 会被拒绝'],
  ['整包 unpublish', '还要满足"近一周下载量 < 300、无依赖者"，否则一律拒绝'],
  ['镜像', 'npmmirror / Artifactory / 公司内网私服等镜像，**不会**因为你 unpublish 而回滚'],
];
for (const [when, what] of unpublishRules) console.log(`    ${when.padEnd(14)} ${what}`);
console.log();
console.log('  所以正确的处置顺序是：');
console.log('    1. **deprecate，而不是 unpublish**。`npm deprecate pkg@1.2.0 "存在 XSS，请升级到 1.3.0"`');
console.log('       它不会删掉任何东西，而是让所有安装者看到一条刺眼的警告，并且');
console.log('       `npm i` 时也会有提示。这是"既承认错误、又不破坏别人的构建"的唯一解。');
console.log('    2. 立刻发一个修复版本，并在 CHANGELOG 里写清楚受影响范围和迁移方式。');
console.log('    3. 如果确实泄漏了密钥：**先轮换密钥**，再考虑包的处理。');
console.log('       包的版本号可以删，泄漏出去的 token 不能"删"，只能吊销。');
console.log();
console.log('  一个连带的教训：**这也是为什么"发布前预览"值得花 10 秒钟。**');
console.log('  撤销的代价是"联系官方 + 发公告 + 轮换密钥"，预览的代价是敲一次 --dry-run。');
console.log();

// ---------------------------------------------------------------------------
// 10. 发布前检查清单
// ---------------------------------------------------------------------------
console.log('--- 10. 发布前检查清单（建议抄进 PR 模板） ---');
console.log();
const finalChecklist = [
  ['产物', 'npm pack --dry-run 的清单**逐行看过**了吗？有没有测试 / 密钥 / 大文件？'],
  ['产物', 'package.json / README / LICENSE 三个"永远包含"的文件都在吗？'],
  ['产物', 'tarball 体积有没有突然变大（对比上一个版本）？'],
  ['入口', 'tarball 里的入口文件路径与 main / exports / types 字段对得上吗？'],
  ['版本', '这次改动按 semver 该升哪一位？有没有人依赖了旧行为？'],
  ['版本', 'package.json 的 version 与 git tag 一致吗？'],
  ['文档', 'CHANGELOG 写了吗？破坏性变更写清楚"怎么迁移"了吗？'],
  ['文档', 'README 里的示例代码还能跑吗（很多包死在过期的示例上）？'],
  ['测试', 'CI 全绿吗？是在**和生产一致的 Node 版本**上跑的吗？'],
  ['依赖', '新增的 dependencies 真的需要吗？它们会不会拖进一堆传递依赖？'],
  ['依赖', 'peerDependencies 的版本范围写对了吗？（宽了不管用，窄了装不上）'],
  ['通道', '这是正式版还是 beta？--tag 写对了吗？'],
  ['权限', '这次发布的凭据有权限发这个 scope 吗？2FA 准备好了吗？'],
  ['回滚', '万一发错了，第一反应该是 npm deprecate，命令想好了吗？'],
];
let idx = 0;
for (const [group, item] of finalChecklist) {
  idx++;
  console.log(`    ${String(idx).padStart(2)}. [${group}] ${item}`);
}
console.log();
console.log('  最后回到本文件的主线：');
console.log('    发布的本质是"把一个不可变的文件集，绑定到一个不可变的版本号上"。');
console.log('    既然两边都不可变，那**所有能做的事只能在发布之前做完**。');
console.log('    第 5 节那个自己写的检查器，就是把"发布前能做的事"变成可执行代码的样子。');
console.log();
