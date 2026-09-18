/**
 * ============================================================================
 * 知识点：质量工作流收口 —— 把工具串成一条流水线
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】进阶
 * 【前置知识】本目录 01 ~ 07 全部文件（本文件是索引与串联）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    前面 7 个文件各自讲透了一个工具：package.json、npm scripts、semver、
 *    ESLint、Prettier、打包转译、锁文件与 CI。但**工具堆在一起不等于工程化**。
 *    真正的工程化是让它们各就各位，形成一条**从写代码到发布**的流水线：
 *
 *      ① 写代码        人在编辑器里写
 *      ② 保存时格式化   Prettier 自动排版（毫秒级，无感）
 *      ③ 保存时修复     ESLint --fix 修掉能自动修的问题（毫秒级）
 *      ④ 提交前拦截     git pre-commit 钩子：对**改动过的文件**跑 lint + format + 单测（秒级）
 *      ⑤ CI 全量校验    npm ci → lint → typecheck → test → build（分钟级）
 *      ⑥ 发布           打 tag 触发 npm publish / 部署
 *
 *    每一环的**耗时量级不同、严格程度不同、失败代价也不同**。
 *    设计得好，问题会在最便宜的那一环被拦下；设计得差，
 *    笔误要等到线上才暴露。
 *
 * 2. 为什么需要（真实项目场景）
 *    一个典型的"配置堆砌"项目长这样：装了 ESLint、装了 Prettier、
 *    也有 CI，但——
 *      · ESLint 和 Prettier 规则冲突，开发者每周都要手动"反格式化"一次；
 *      · pre-commit 跑了全量 lint，一次提交卡 40 秒，于是人人 --no-verify；
 *      · CI 用 npm install，某天悄悄升级了依赖，构建挂了却没人改过代码；
 *      · 规则一次开了 300 条，老代码爆出 5000 个 error，团队干脆把 lint 从 CI 里删了。
 *    这些问题的共同点是：**不是工具选错了，而是它们没有被串起来**。
 *    本文件就是讲"怎么串"。
 *
 * 3. 核心语法要点
 *    本文件是收口与索引，内容以**结构化对照表 + 一份可打印的清单**为主，
 *    同时做一次真实的端到端演示：在临时项目里搭一套最小质量闸门，
 *    用编程 API 跑一遍 Prettier 检查 + ESLint 检查，输出 CI 风格报告。
 *
 * 4. 常见陷阱
 *    - 一次性把所有规则开成 error：老项目直接爆红，最后整包被注释掉。
 *    - 编辑器、钩子、CI 三处各配一份规则：改一处忘两处，行为不一致。
 *    - 把"能自动修"和"需人判断"的检查混在同一个环节：
 *      结果要么太慢，要么太松。
 *    - 以为装了工具就等于有了质量：**没有强制执行的规则等于没有规则**。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/08_code_quality_workflow.js
 *
 * 【预期输出】
 *   逐节打印：六个环节的完整分工表、"同一份配置喂三个消费者"的原则、
 *   团队协作的渐进式引入策略、本仓库自身的质量组织方式（含真实统计）、
 *   一次端到端的最小质量闸门演示（Prettier + ESLint 编程 API）、
 *   以及一份可直接抄走的新项目工程化配置清单。
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { ESLint } from 'eslint';
import prettier from 'prettier';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('--- 0. 环境信息 ---');
console.log(`Node ${process.version}  |  ESLint ${require('eslint/package.json').version}  |  Prettier ${prettier.version}`);
console.log('本文件是 39_tooling_and_workflow 的收口篇：把前面 7 个文件串成一条流水线。');
console.log();

// ---------------------------------------------------------------------------
// 1. 六个环节
// ---------------------------------------------------------------------------
console.log('--- 1. 完整链路：六个环节 ---');

const pipeline = [
  {
    step: '① 写代码',
    where: '编辑器 / IDE',
    tools: '编辑器插件（ESLint、Prettier 插件）',
    duty: '实时把问题画成黄线红线，让你在写的时候就看见',
    speed: '即时',
    fix: '无（只提示）',
  },
  {
    step: '② 保存时格式化',
    where: '编辑器（formatOnSave）',
    tools: 'Prettier',
    duty: '排版。缩进、换行、引号、分号、尾随逗号全部自动化',
    speed: '毫秒级',
    fix: '全部自动改写',
  },
  {
    step: '③ 保存时修复',
    where: '编辑器（codeActionsOnSave）',
    tools: 'ESLint（--fix 等价的自动修复）',
    duty: '修掉"有唯一正确写法"的问题：var→let、多余的 import、可简化的表达式',
    speed: '毫秒级（单文件）',
    fix: '部分自动改写',
  },
  {
    step: '④ 提交前拦截',
    where: 'git pre-commit 钩子',
    tools: 'husky / simple-git-hooks + lint-staged',
    duty: '对**本次改动的文件**跑 lint + 格式化 + 相关单测。挡住"忘跑检查"的提交',
    speed: '秒级',
    fix: '允许改写（修好后自动加入本次提交）',
  },
  {
    step: '⑤ CI 全量校验',
    where: 'CI 服务器',
    tools: 'npm ci → lint → typecheck → test → build',
    duty: '在干净环境里对**整个仓库**做一次权威判定。这是唯一的"真相来源"',
    speed: '分钟级',
    fix: '绝不改写。只报告成功/失败',
  },
  {
    step: '⑥ 发布',
    where: 'CI（仅 tag / release 触发）',
    tools: 'npm publish / 部署流水线',
    duty: '产出并交付最终产物。不可逆，所以放最后且需要显式触发',
    speed: '分钟级',
    fix: '—（发布后只能发新版本修正）',
  },
];

for (const p of pipeline) {
  console.log(`  ${p.step}`);
  console.log(`      在哪：  ${p.where}`);
  console.log(`      用什么：${p.tools}`);
  console.log(`      负责：  ${p.duty}`);
  console.log(`      耗时：  ${p.speed}`);
  console.log(`      改不改代码：${p.fix}`);
  console.log();
}

console.log('  这条链路最重要的设计原则：**越靠前的环节越快、越宽松；越靠后的越慢、越严格。**');
console.log('    编辑器：只提示，不阻塞任何人（毫秒级，不能烦人）');
console.log('    钩子：  只挡改动过的文件（秒级，必须快，否则会被 --no-verify 绕过）');
console.log('    CI：    全量、干净环境、一步不放（分钟级，是唯一的权威判定）');
console.log('    发布：  不可逆，必须人工显式触发');
console.log();

// ---------------------------------------------------------------------------
// 2. 谁管什么：职责边界表
// ---------------------------------------------------------------------------
console.log('--- 2. 职责边界：同一件事只让一个工具管 ---');

const responsibilities = [
  ['代码好不好看', 'Prettier', '—', '—', 'Prettier 是格式的唯一权威'],
  ['代码有没有明显错误', 'ESLint', 'ESLint', 'ESLint', '编辑器只提示，CI 一票否决'],
  ['类型对不对', 'TS 语言服务', '—', 'tsc --noEmit', '耗时较长，不适合放钩子'],
  ['行为对不对', '—', '相关单测', '全量测试 + 覆盖率', '测试慢，钩子里只跑改动的部分'],
  ['能不能装出一样的依赖', '—', '—', 'npm ci', '只有干净环境才能验证'],
  ['产物能不能跑', '—', '—', 'build + 冒烟测试', '测试跑源码，构建跑产物，两者不同'],
];
console.log(`  ${'检查什么'.padEnd(24)} ${'编辑器'.padEnd(14)} ${'提交钩子'.padEnd(16)} ${'CI'.padEnd(22)} 说明`);
for (const row of responsibilities) {
  const [what, editor, hook, ci, note] = row;
  console.log(`  ${what.padEnd(24)} ${editor.padEnd(14)} ${hook.padEnd(16)} ${ci.padEnd(22)} ${note}`);
}
console.log();
console.log('  注意表格里那些"—"：**没有工具负责那一格，是刻意的。**');
console.log('    格式不需要在 CI 里检查逻辑（Prettier 不做逻辑判断），');
console.log('    测试不需要在编辑器里实时跑（慢），');
console.log('    依赖一致性没法在本地验证（本地环境已经被污染了）。');
console.log();

console.log('  如何避免"三处各配一份"：单一事实来源（Single Source of Truth）');
const ssoT = [
  ['格式化规则', '.prettierrc.json', '编辑器插件、prettier CLI、lint-staged 都读它', '改一处，三处同时生效'],
  ['lint 规则', 'eslint.config.js', '编辑器插件、eslint CLI、lint-staged 都读它', '同上'],
  ['跑什么命令', 'package.json 的 scripts', '本地手动跑、钩子、CI 全部调 `npm run xxx`', 'CI 不写裸命令，只调脚本'],
  ['装什么版本', 'package-lock.json', '本地、钩子、CI 都用 `npm ci`', '见 07 文件'],
  ['忽略哪些文件', '.prettierignore / eslint.config.js 的 ignores / .gitignore', '三套忽略规则**语义不同**，不能互相代替', '但要注意保持同步'],
];
console.log(`  ${'配置什么'.padEnd(16)} ${'唯一的家'.padEnd(46)} ${'谁读它'.padEnd(42)} 好处`);
for (const [what, home, readers, benefit] of ssoT) {
  console.log(`  ${what.padEnd(16)} ${home.padEnd(46)} ${readers.padEnd(42)} ${benefit}`);
}
console.log();
console.log('  这条原则的最实用落地方式：**CI 里只写 `npm run xxx`，绝不写长串命令。**');
console.log('  这样"CI 跑什么"和"我本地跑什么"永远是同一个东西。');
console.log();

// ---------------------------------------------------------------------------
// 3. 团队协作中的取舍
// ---------------------------------------------------------------------------
console.log('--- 3. 团队协作中的取舍 ---');

console.log('  [3.1] 严格 vs 宽松：规则该开多严？');
const strictness = [
  ['格式类（Prettier 管）', '一律最严', '格式没有"更正确"的答案，统一比精确重要'],
  ['潜在错误类（no-undef / no-unused-vars / eqeqeq）', '一律 error', '这些几乎总是真 bug，误报可通过配置消除'],
  ['风格偏好类（命名规范 / 函数最大行数）', '先 warn，稳定后再 error', '偏好类规则容易引起争议，硬性推开会激化矛盾'],
  ['过时写法类（no-var / prefer-const）', 'error（新项目）/ warn（老项目）', '老项目里一次改完不现实，分阶段推进'],
  ['重构提示类（复杂度 / 圈复杂度）', '通常只 warn 或不开', '这类指标机器判断不准，容易变成噪音'],
];
console.log(`    ${'规则类别'.padEnd(48)} ${'建议档位'.padEnd(28)} 理由`);
for (const [kind, level, why] of strictness) {
  console.log(`    ${kind.padEnd(48)} ${level.padEnd(28)} ${why}`);
}
console.log();

console.log('  [3.2] 渐进式引入：给老项目上工程化三步走');
const gradual = [
  ['第 1 周', '只上 Prettier + 全量格式化一次', '一次性提交，之后所有人自动统一', '格式改动巨大但零逻辑风险'],
  ['第 2 周', 'ESLint 只开"确定是 bug"的几条规则（no-undef / no-unused-vars / eqeqeq）', '其余全部 off', '让团队先尝到"它真能抓 bug"的甜头'],
  ['第 3~4 周', '存量问题用 eslint-disable-next-line 局部压制，新增代码一律不许压制', '配 --max-warnings 0 防新增', '存量与增量分开治理，这是关键'],
  ['第 2 月', '逐步把 warn 升成 error，同时给存量代码建"整改清单"', '每周清一批', '规则严格度随代码质量一起上升'],
  ['持续', '把规则变更写进 code review checklist', '新规则由团队讨论后合入', '规则是团队共识，不是个人偏好'],
];
console.log(`    ${'阶段'.padEnd(10)} ${'做什么'.padEnd(56)} ${'怎么做'.padEnd(30)} 关键点`);
for (const [phase, what, how, key] of gradual) {
  console.log(`    ${phase.padEnd(10)} ${what.padEnd(56)} ${how.padEnd(30)} ${key}`);
}
console.log();
console.log('  **最重要的一条**：不要让"存量问题"成为引入 lint 的阻碍。');
console.log('    正确姿势是"新代码严格、老代码逐步"，而不是"等代码全部改好了再上 lint"——');
console.log('    后者永远不会发生。');
console.log();

console.log('  [3.3] 允许例外：规则必须给人留后路');
const escapes = [
  ['// eslint-disable-next-line no-console', '单行豁免', 'CLI 工具里必须打印时用，review 时能看见'],
  ['/* eslint-disable no-unused-vars */（文件级）', '文件豁免', '老文件可整体豁免，但要在整改清单里登记'],
  ['// prettier-ignore', '让 Prettier 跳过下一段', '手写对齐的表格、ASCII 图'],
  ['.prettierignore / ignores', '路径豁免', '构建产物、自动生成的代码'],
];
console.log(`    ${'写法'.padEnd(48)} ${'粒度'.padEnd(12)} 使用建议`);
for (const [form, scope, advice] of escapes) {
  console.log(`    ${form.padEnd(48)} ${scope.padEnd(12)} ${advice}`);
}
console.log('    一个经验值：如果某个文件里 eslint-disable 超过 3 处，');
console.log('    要么规则配错了，要么该文件该被列入"待重构清单"。');
console.log();

// ---------------------------------------------------------------------------
// 4. 本仓库是怎么组织的
// ---------------------------------------------------------------------------
console.log('--- 4. 本仓库自己的质量组织方式 ---');

const repoPkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
console.log('  本仓库 package.json 的 scripts：');
for (const [name, cmd] of Object.entries(repoPkg.scripts)) {
  console.log(`    ${name.padEnd(12)} ${cmd}`);
}
console.log();

console.log('  设计解读（对照第 1 节的六个环节）：');
console.log('    本仓库**没有 ①②③ 环**：它是一套"教学示例集"，不是产品代码，');
console.log('      所以不需要编辑器实时 lint（示例本身就是讲解载体，风格由作者保证）。');
console.log('    本仓库**也没有配置 ESLint / Prettier 文件**：');
console.log('      这正是 04/05 两个文件能"用编程 API 内联配置"来演示的原因。');
// .editorconfig 是本仓库唯一存在的"格式类"配置文件，读出来展示一下
try {
  const ec = await fs.readFile(path.join(ROOT, '.editorconfig'), 'utf8');
  console.log('    本仓库有 .editorconfig（编辑器层面的格式约定）：');
  for (const line of ec.trimEnd().split('\n')) console.log(`        ${line}`);
  console.log('      .editorconfig 管的范围比 Prettier 小（只管缩进/换行/字符集这类"编辑器行为"），');
  console.log('      但它是**零依赖**的：几乎所有编辑器都原生支持，不需要装任何包。');
  console.log('      所以它是"渐进式引入工程化"的第 1 步（见第 6 节的清单）。');
} catch {
  console.log('    本仓库没有 .editorconfig。');
}
console.log('    本仓库的"测试"就是 ④⑤ 环的合体：');
console.log('      `npm run check`      = 把每个示例跑一遍，验证"文档说的输出真的能跑出来"');
console.log('      `npm run check:html` = HTML 示例无法在 Node 里跑，改用静态检查');
console.log('      `npm run check:all`  = `check && check:html`（02 文件讲的 && 短路）');
console.log();
console.log('  这套设计的巧妙之处：');
console.log('    · 它把"示例必须能运行且退出码为 0"这条**约定**变成了可执行的检查；');
console.log('    · 约定写在 scripts/run-all.js 的文件头注释里（见该文件第 13~17 行），');
console.log('      而检查由代码强制——**文档与执行合一**，不会脱节；');
console.log('    · 任何新示例只要放进目录就会被自动纳入检查（递归扫描），无需注册。');
console.log();

// 真实跑一次仓库自己的检查器（--list 模式，只列出会被检查的文件，不执行它们）
console.log('  真实跑一次仓库的检查器（--list 模式，只列出、不执行）：');
// 注意跨平台细节（见 02 文件）：
// process.execPath 在 Windows 上通常是 "C:\\Program Files\\nodejs\\node.exe"，
// 带空格。用 shell: true + 字符串命令时**必须自己加引号**，否则会被拆成两段。
// 更省心的做法是 shell: false + 参数数组：
// Node 会直接执行这个 .exe（.exe 不受"禁止 spawn .cmd"那条安全限制影响）。
const listRun = spawnSync(process.execPath, ['scripts/run-all.js', '--list'], {
  cwd: ROOT,
  encoding: 'utf8',
  shell: false,
  timeout: 30_000,
});
const listedFiles = listRun.stdout.trim().split('\n').filter((l) => l.includes('/'));
console.log(`    退出码 = ${listRun.status}`);
console.log(`    输出最后一行：${listRun.stdout.trim().split('\n').pop()}`);

// 按目录归类统计，让"自动纳入"这件事看得见
const byDir = new Map();
for (const f of listedFiles) {
  const dir = f.includes('/') ? f.split('/')[0] : '(根目录)';
  byDir.set(dir, (byDir.get(dir) ?? 0) + 1);
}
console.log(`    共扫到 ${listedFiles.length} 个示例，分布在 ${byDir.size} 个知识点目录中。`);
const myDir = '39_tooling_and_workflow';
console.log(`    其中本目录 ${myDir} 被自动纳入 ${byDir.get(myDir) ?? 0} 个文件。`);
console.log('    → 不需要在任何清单里登记，放进目录就自动被检查。这就是"约定优于配置"。');
console.log();
console.log('  提交前会怎么用它（本仓库的"钩子等价物"）：');
console.log('    没有配 git 钩子（本仓库不是产品项目），但人工/CI 的做法就是');
console.log('    "改完示例后跑一次 npm run check:all"。');
console.log('    真实产品项目里，这一步应该由 pre-commit 钩子自动完成——');
console.log('    否则它就会像所有"靠自觉"的约定一样，慢慢被忘掉。');
console.log();

// ---------------------------------------------------------------------------
// 5. 端到端演示：搭一套最小质量闸门
// ---------------------------------------------------------------------------
console.log('--- 5. 端到端演示：一套最小质量闸门 ---');

// 在临时目录里搭一个"有 package.json、有配置、有源码"的小项目，
// 然后按 CI 的顺序跑一遍检查。这是第 04/05 两个文件讲过的 API 的合体应用。
const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'quality-gate-'));

try {
  const PRE = (s) => s.split('\n').map((l) => '      ' + l).join('\n');

  // --- 项目脚手架
  await fs.writeFile(
    path.join(tmpRoot, 'package.json'),
    JSON.stringify(
      {
        name: 'quality-gate-demo',
        version: '1.0.0',
        type: 'module',
        scripts: {
          lint: 'eslint .',
          'format:check': 'prettier --check .',
          test: 'node --test',
          verify: 'npm run format:check && npm run lint && npm test',
        },
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );

  await fs.writeFile(
    path.join(tmpRoot, 'eslint.config.js'),
    `// 只保留"确定是 bug"的规则，避免一上来就吵风格
export default [
  { ignores: ['node_modules/**', 'coverage/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { console: 'readonly' } },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': 'error',
      eqeqeq: 'error',
      'no-var': 'error',
    },
  },
];
`,
    'utf8',
  );

  await fs.writeFile(
    path.join(tmpRoot, '.prettierrc.json'),
    JSON.stringify({ semi: true, singleQuote: true, printWidth: 80, trailingComma: 'all' }, null, 2) + '\n',
    'utf8',
  );

  // 故意准备两个文件：一个干净，一个有问题
  await fs.mkdir(path.join(tmpRoot, 'src'), { recursive: true });
  const cleanSource = `export function add(a, b) {\n  return a + b;\n}\n\nexport function formatName(first, last) {\n  return \`\${first} \${last}\`;\n}\n`;
  await fs.writeFile(path.join(tmpRoot, 'src', 'clean.js'), cleanSource, 'utf8');
  const dirtySource = `export function multiply(a,b){var result=a*b\nif(result==0){console.log('zero')}\nreturn result}\n`;
  await fs.writeFile(path.join(tmpRoot, 'src', 'dirty.js'), dirtySource, 'utf8');

  console.log('  临时项目结构：');
  console.log('    quality-gate-demo/');
  console.log('      package.json          （scripts: lint / format:check / test / verify）');
  console.log('      eslint.config.js      （只开 4 条"确定是 bug"的规则）');
  console.log('      .prettierrc.json      （semi / singleQuote / printWidth）');
  console.log('      src/clean.js          （格式正确、逻辑干净）');
  console.log('      src/dirty.js          （格式混乱 + var + == 两个问题）');
  console.log();

  // --- 环节 A：Prettier 格式检查（等价于 CI 上的 npm run format:check）
  console.log('  [环节 A] 格式检查（Prettier，等价于 `prettier --check .`）');
  const dirtyText = await fs.readFile(path.join(tmpRoot, 'src', 'dirty.js'), 'utf8');
  const cleanText = await fs.readFile(path.join(tmpRoot, 'src', 'clean.js'), 'utf8');
  const dirtyOk = await prettier.check(dirtyText, { parser: 'babel' });
  const cleanOk = await prettier.check(cleanText, { parser: 'babel' });
  console.log(`      src/clean.js → ${cleanOk ? '✔ 已符合格式' : '✘ 需要格式化'}`);
  console.log(`      src/dirty.js → ${dirtyOk ? '✔ 已符合格式' : '✘ 需要格式化'}`);
  const formattedDirty = await prettier.format(dirtyText, { parser: 'babel' });
  console.log('      dirty.js 被 Prettier 排好之后的样子：');
  console.log(PRE(formattedDirty.trimEnd()));
  console.log('      → 格式问题**全部自动消失**，一行都不用人工改。');
  console.log();

  // --- 环节 B：ESLint 检查（等价于 CI 上的 npm run lint）
  console.log('  [环节 B] 静态检查（ESLint，等价于 `eslint .`）');
  // 注意这里传的是"已经 Prettier 格式化过"的代码——
  // 这模拟了真实链路里"先格式化、再 lint"的顺序（也叫 lint-staged 的顺序）。
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: [{
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { console: 'readonly' } },
    rules: { 'no-undef': 'error', 'no-unused-vars': 'error', eqeqeq: 'error', 'no-var': 'error' },
  }] });

  let totalErrors = 0;
  for (const [label, code] of [['src/clean.js', cleanText], ['src/dirty.js', formattedDirty]]) {
    const [r] = await eslint.lintText(code, { filePath: label });
    totalErrors += r.errorCount;
    console.log(`      ${label} → error ${r.errorCount} / warn ${r.warningCount}`);
    for (const m of r.messages) {
      const level = m.severity === 2 ? 'error' : 'warn';
      console.log(`          ${m.line}:${m.column}  ${level}  ${m.ruleId}  ${m.message}`);
    }
  }
  console.log(`      合计 error：${totalErrors}`);
  console.log('      → 格式化解决不了的"逻辑类问题"，在第二步被抓住了：');
  console.log('        var 是老写法、== 是隐式类型转换的坑。这两个 Prettier 都不管。');
  console.log();

  // --- 环节 C：修复后再验一次（模拟开发者本地改完重新提交）
  console.log('  [环节 C] 修好之后重新跑一遍（模拟开发者本地修复后再次提交）');
  const fixedSource = formattedDirty
    .replace(/\bvar\b/g, 'const')
    .replace(/result == 0/g, 'result === 0');
  const fixerLinter = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: { console: 'readonly' } },
      rules: { 'no-undef': 'error', 'no-unused-vars': 'error', eqeqeq: 'error', 'no-var': 'error' },
    }],
    fix: true,
  });
  const [fixResult] = await fixerLinter.lintText(fixedSource, { filePath: 'src/dirty.js' });
  const finalText = fixResult.output ?? fixedSource;
  const [finalCheck] = await eslint.lintText(finalText, { filePath: 'src/dirty.js' });
  const finalFormatOk = await prettier.check(finalText, { parser: 'babel' });
  console.log(`      修复后的 src/dirty.js：`);
  console.log(PRE(finalText.trimEnd()));
  console.log(`      格式检查：${finalFormatOk ? '✔ 通过' : '✘ 未通过'}    静态检查：${finalCheck.errorCount === 0 ? '✔ 通过（0 error）' : `✘ 仍有 ${finalCheck.errorCount} 个 error`}`);
  console.log('      → 全部通过，这一环的闸门就放行了。');
  console.log();

  // --- 环节 D：演示"闸门拒绝"
  console.log('  [环节 D] 闸门拒绝一次（模拟 CI 报告失败）');
  const gateReport = [
    { step: '1. 安装依赖 (npm ci)', ok: true, detail: '锁文件与 package.json 一致' },
    { step: '2. 格式检查 (prettier --check)', ok: cleanOk && dirtyOk, detail: dirtyOk ? '全部符合' : 'src/dirty.js 未格式化' },
    { step: '3. 静态检查 (eslint)', ok: totalErrors === 0, detail: totalErrors === 0 ? '0 error' : `${totalErrors} 个 error` },
    { step: '4. 测试 (node --test)', ok: true, detail: '（本示例无测试文件，跳过）' },
    { step: '5. 构建', ok: true, detail: '（本示例无构建步骤，见 06 文件）' },
  ];
  console.log('      CI 报告（对"未修复前"的代码）：');
  for (const g of gateReport) {
    console.log(`        ${g.ok ? '✔' : '✘'} ${g.step.padEnd(34)} ${g.detail}`);
  }
  const failed = gateReport.filter((g) => !g.ok).length;
  console.log();
  console.log(`      结果：${failed === 0 ? '全部通过' : `${failed} 步失败 → CI 红灯，PR 不许合并`}`);
  console.log('      → 关键点：失败信息**具体到文件**（src/dirty.js），');
  console.log('        开发者看一眼就知道要改什么。这是好的 CI 报告的标准。');
  console.log();

  // --- 环节 E：单一事实来源的验证
  console.log('  [环节 E] 验证"单一事实来源"：改一处配置，所有消费者都跟着变');
  const rc = JSON.parse(await fs.readFile(path.join(tmpRoot, '.prettierrc.json'), 'utf8'));
  const resolved = await prettier.resolveConfig(path.join(tmpRoot, 'src', 'clean.js'));
  console.log(`      .prettierrc.json 里写的是：${JSON.stringify(rc)}`);
  console.log(`      prettier.resolveConfig 解析到：${JSON.stringify(resolved)}`);
  console.log(`      两者一致吗：${JSON.stringify(rc) === JSON.stringify(resolved)}`);
  console.log('      → 编辑器插件、prettier CLI、lint-staged 读的都是这**同一个文件**。');
  console.log('        改一处、三处生效——这就是"避免重复配置"的落地方式。');
} finally {
  await fs.rm(tmpRoot, { recursive: true, force: true });
  console.log();
  console.log(`[清理] 已删除临时目录 ${tmpRoot}`);
}

// ---------------------------------------------------------------------------
// 6. 新项目工程化配置清单（可打印）
// ---------------------------------------------------------------------------
console.log();
console.log('--- 6. 新项目工程化配置清单（可直接抄走） ---');

console.log('  【第一步：package.json 基础字段】');
const pkgChecklist = [
    ['name / version / description / license', '必填', '见 01 文件'],
    ['type: "module"', '强烈建议', '决定 .js 按 ESM 解析'],
    ['private: true', '不开源就写', '防止误 publish'],
    ['engines', '建议', '声明支持的 Node 版本，便于 CI 与团队对齐'],
    ['scripts', '必填', '至少提供 dev / lint / format / test / build 五个入口'],
];
for (const [item, level, note] of pkgChecklist) {
  console.log(`    ${item.padEnd(42)} ${level.padEnd(10)} ${note}`);
}
console.log();

console.log('  【第二步：确定质量工具分工】');
const toolChecklist = [
    ['.prettierrc.json', 'Prettier', '格式：printWidth / semi / singleQuote / trailingComma'],
    ['.prettierignore', 'Prettier', '忽略构建产物；语法同 .gitignore'],
    ['eslint.config.js', 'ESLint', 'flat config 数组；只开"确定是 bug"的规则，别开格式规则'],
    ['（不装）eslint-config-prettier', 'ESLint', '只有在老项目里已经开了格式规则时才需要'],
    ['tsconfig.json', 'TypeScript（可选）', '用了 TS 才需要；target 与 package.json 的 engines 保持一致'],
];
for (const [file, owner, usage] of toolChecklist) {
  console.log(`    ${file.padEnd(28)} ${owner.padEnd(22)} ${usage}`);
}
console.log();

console.log('  【第三步：npm scripts 命名约定】');
const scriptChecklist = [
    ['dev', '本地开发服务器 / 监听模式', '开发者每天用最多的入口'],
    ['lint', 'eslint .', 'CI 与钩子共用'],
    ['lint:fix', 'eslint . --fix', '本地修问题用'],
    ['format', 'prettier --write .', '本地格式化用'],
    ['format:check', 'prettier --check .', '**CI 上用这个**，绝不能在 CI 里 --write'],
    ['typecheck', 'tsc --noEmit', 'TS 项目必加；与 lint 并行跑'],
    ['test', 'vitest run / node --test', '**CI 上用非 watch 模式**，否则会挂起'],
    ['test:watch', 'vitest', '本地开发用'],
    ['build', 'vite build / rollup -c', '产出发布物'],
    ['verify', 'format:check && lint && typecheck && test && build', '一条命令跑完整闸门'],
];
for (const [name, cmd, note] of scriptChecklist) {
  console.log(`    ${name.padEnd(14)} ${cmd.padEnd(52)} ${note}`);
}
console.log('    注意 `verify` 这一条：**把闸门封装成一个脚本**，CI 只需要调它。');
console.log('    这样本地和 CI 跑的是完全相同的命令序列（第 2 节的单一事实来源）。');
console.log();

console.log('  【第四步：仓库里必须提交的文件】');
const commitChecklist = [
    ['package.json', '是', '声明依赖与脚本'],
    ['package-lock.json', '是', '可复现性的前提（见 07 文件）'],
    ['.prettierrc.json / .prettierignore', '是', '团队共享格式规则'],
    ['eslint.config.js', '是', '团队共享 lint 规则'],
    ['.editorconfig', '建议', '让编辑器统一缩进/换行/字符集'],
    ['.gitignore', '是', '至少忽略 node_modules / dist / coverage'],
    ['node_modules/', '否', '绝不提交（体积巨大且平台相关）'],
    ['dist/ / build/', '通常否', '构建产物一般由 CI 生成'],
];
console.log(`    ${'文件'.padEnd(42)} ${'提交？'.padEnd(8)} 说明`);
for (const [file, commit, note] of commitChecklist) {
  console.log(`    ${file.padEnd(42)} ${commit.padEnd(8)} ${note}`);
}
console.log();

console.log('  【第五步：渐进式引入的顺序】');
const order = [
    '1. Prettier（立刻见效、零争议）',
    '2. .editorconfig（零成本，统一缩进与换行）',
    '3. ESLint 只开 no-undef / no-unused-vars / eqeqeq / no-var 四条',
    '4. pre-commit 钩子 + lint-staged（只跑改动过的文件）',
    '5. CI：npm ci → npm run verify',
    '6. 视团队情况逐步增加规则，每次只加一小批，并同步清理存量',
];
for (const o of order) console.log(`    ${o}`);
console.log();

console.log('  【第六步：CI 流水线骨架（伪 YAML，仅为说明结构）】');
const ciSkeleton = [
    'jobs:',
    '  verify:',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: actions/setup-node@v4',
    '        with: { node-version: 20, cache: npm }   # cache: npm 会按锁文件哈希做缓存',
    '      - run: npm ci                                # ★ 必须是 ci，不是 install',
    '      - run: npm run format:check                  # 快，先跑',
    '      - run: npm run lint                          # 快，与上一步可并行',
    '      - run: npm run typecheck                     # 中速，与上两步可并行',
    '      - run: npm test                              # 慢',
    '      - run: npm run build                         # 慢，但必须验',
].map((l) => '    ' + l);
console.log(ciSkeleton.join('\n'));
console.log();

console.log('  最简版（如果上面太长，只记这一句）：');
console.log('    **Prettier 管格式，ESLint 管逻辑，锁文件管版本，CI 管最后的判定。**');
console.log('    用一份配置喂所有消费者，把闸门封装成一个 `npm run verify`。');
console.log();

// ---------------------------------------------------------------------------
// 7. 结语：本目录的知识地图
// ---------------------------------------------------------------------------
console.log('--- 7. 本目录知识地图（回头看的索引） ---');

const map = [
  ['01_package_json_guide.js', '项目的"身份证 + 说明书"：字段含义、三类依赖的取舍、type: module 的运行时效果'],
  ['02_npm_scripts_and_lifecycle.js', '命令行入口表：pre/post 钩子、PATH 注入、跨平台陷阱、本仓库 scripts 的设计'],
  ['03_semver.js', '依赖世界的契约语言：范围语法、^ 与 ~ 的区别、预发布版本的坑'],
  ['04_eslint.js', '静态分析：flat config 结构、严重度三档、fix 与 suggestion 的区别、自定义规则'],
  ['05_prettier.js', '格式的唯一权威：与 ESLint 的分工、配置项、多语言 parser、幂等性'],
  ['06_bundlers_and_transpiling.js', '构建与转译：为什么打包、tree-shaking 的三个前提、target 与 polyfill'],
  ['07_lockfile_and_ci.js', '可复现性：锁文件结构、npm ci 与 npm install、幽灵依赖、CI 阶段与 git hooks'],
  ['08_code_quality_workflow.js', '（本文件）把上面七个串成一条从写代码到发布的流水线'],
];
console.log('  按学习顺序阅读效果最好；如果只有 30 分钟，读 01 → 04 → 05 → 07 这四篇。');
console.log();
for (const [file, desc] of map) {
  console.log(`    ${file}`);
  console.log(`        ${desc}`);
}
console.log();

console.log('  回到最开头那个问题：33+ 个知识点目录，为什么工程化一直是零？');
console.log('    因为工程化的知识**不成体系地散落在每个项目的配置文件里**，');
console.log('    而它又恰恰是"从会写 JS"到"能交付 JS 项目"之间那道最容易被跳过的坎。');
console.log('    补齐它之后，这个仓库才算真正走完了从 console.log 到 CI 的全程。');
