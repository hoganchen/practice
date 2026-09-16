/**
 * ============================================================================
 * 知识点：语义化版本（semver）与版本范围 —— 依赖世界的"契约语言"
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】进阶
 * 【前置知识】39_tooling_and_workflow/01_package_json_guide.js（package.json 字段）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    语义化版本（Semantic Versioning，简称 semver）规定版本号写成三段
 *    MAJOR.MINOR.PATCH，并赋予每一段**约定俗成的含义**：
 *      · MAJOR（主版本）：有不兼容的破坏性变更（breaking change）；
 *      · MINOR（次版本）：新增功能，向后兼容；
 *      · PATCH（修订号）：修 bug，向后兼容。
 *    而"版本范围"（range）则是写在 package.json 里的一种表达式，用来告诉
 *    包管理器"我能接受哪些版本"。范围是**声明意图**，不是**确定结果**。
 *
 * 2. 为什么需要（真实项目场景）
 *    一个中型前端项目有上千个传递依赖。如果每个依赖都必须锁死到唯一版本，
 *    任何一次安全补丁都要人工改上千个数字，根本不可维护。
 *    semver 让发布者承诺"这个升级不破坏你"，让使用者敢于写 `^1.2.3`
 *    自动接受修 bug 的新版本。整套 npm 生态的自动升级能力都建立在这个契约上。
 *    反过来说：**一旦发布者不守规矩**（在小版本里塞破坏性变更），
 *    整个生态的信任就崩塌——这就是著名的"left-pad 事件"之外更常见的
 *    "依赖升级炸掉线上"问题的根源。
 *
 * 3. 核心语法要点
 *    本文件用仓库里已安装的 `semver` 库（编程 API，不联网）逐条验证语义，
 *    包括最容易被误解的 `^` 与 `~` 的区别、预发布版本的特殊规则。
 *
 * 4. 常见陷阱
 *    - 以为 `^1.2.3` 是"1.2.3 以上都行"：它是 `>=1.2.3 <2.0.0`，
 *      但**上界是真的存在**的，而且对 0.x 版本有特殊规则。
 *    - 以为 `^1.2.3` 和 `~1.2.3` 差不多：差在小版本是否允许变。
 *    - 以为 `1.0.0-beta.1` 会被 `^1.0.0` 匹配到：**不会**，预发布版本
 *      是一条独立的、默认被排除的轨道。
 *    - 只看 package.json 的范围就以为知道装的哪个版本：
 *      范围是"允许"，真正生效的是 package-lock.json（见 07_lockfile_and_ci.js）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/03_semver.js
 *
 * 【预期输出】
 *   逐节打印：版本号三段含义与升位规则、范围语法全表、^ 与 ~ 的展开对照、
 *   0.x 版本的特殊规则、预发布版本的匹配规则与坑、semver 库常用 API 实测结果、
 *   以及"范围是允许、锁文件是确定"的说明。
 * ============================================================================
 */

import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// 用 createRequire 读 semver 的 package.json，这样我们演示的"版本"是真实安装版本
const require = createRequire(import.meta.url);
const semver = require('semver');

console.log('--- 0. 环境信息 ---');
console.log(`semver 库版本：${require('semver/package.json').version}`);
console.log(`它实现的 semver 规范版本：${semver.SEMVER_SPEC_VERSION}`);
console.log(`Node 版本：${process.version}`);
console.log('本文件全程使用编程 API，不执行任何联网命令。');
console.log();

// ---------------------------------------------------------------------------
// 1. 版本号的三段结构与"何时升哪一位"
// ---------------------------------------------------------------------------
console.log('--- 1. MAJOR.MINOR.PATCH 的含义 ---');

const parsed = semver.parse('2.7.13');
console.log(`把一个版本号拆开看：${parsed.raw}`);
console.log(`  major = ${parsed.major}   ← 破坏性变更时 +1，并把 minor / patch 归零`);
console.log(`  minor = ${parsed.minor}   ← 新增向后兼容的功能时 +1，并把 patch 归零`);
console.log(`  patch = ${parsed.patch}   ← 修 bug 时 +1`);
console.log(`  version（规范化字符串）= ${parsed.version}`);
console.log(`  prerelease（预发布标识）= ${JSON.stringify(parsed.prerelease)}`);
console.log(`  build（构建元数据，**不参与比较**）= ${JSON.stringify(parsed.build)}`);
console.log();

console.log('  升位规则（semver.inc 实测）：');
const incCases = [
  ['1.2.3', 'major', '有破坏性变更 → 2.0.0'],
  ['1.2.3', 'minor', '加了新功能 → 1.3.0'],
  ['1.2.3', 'patch', '修了 bug → 1.2.4'],
  ['1.2.3', 'premajor', '预发布下一主版本 → 2.0.0-0'],
  ['1.2.3', 'preminor', '预发布下一次版本 → 1.3.0-0'],
  ['1.2.3', 'prepatch', '预发布下一修订版 → 1.2.4-0'],
];
for (const [from, kind, why] of incCases) {
  console.log(`    inc('${from}', '${kind}') = ${semver.inc(from, kind).padEnd(10)} // ${why}`);
}
console.log();

console.log('  预发布标识的自增（beta 通道）：');
console.log(`    inc('1.2.3', 'prerelease', 'beta') = ${semver.inc('1.2.3', 'prerelease', 'beta')}`);
console.log(`    inc('1.2.4-beta.0', 'prerelease', 'beta') = ${semver.inc('1.2.4-beta.0', 'prerelease', 'beta')}`);
console.log();

console.log('  规则背后的判断标准（库作者必须自问）：');
console.log('    用户**不改任何代码**升级后会不会出问题？会 → 升 MAJOR。');
console.log('    用户能用到**之前没有的能力**吗？能 → 升 MINOR。');
console.log('    只是行为更正确了、接口没变？→ 升 PATCH。');
console.log('    注意：0.x.y 阶段惯例上任何变更都可以是 MAJOR（因为"1.0 之前无承诺"），');
console.log('    这直接影响 ^ 对 0.x 的展开方式，见第 3 节。');
console.log();

// ---------------------------------------------------------------------------
// 2. 版本范围语法全解
// ---------------------------------------------------------------------------
console.log('--- 2. 版本范围语法全解 ---');

// 每条范围配上人话解释。是否匹配不由我们写死，而是真的调 semver.satisfies 去算。
const rangeTable = [
  ['1.2.3', '精确匹配'],
  ['=1.2.3', '精确匹配（带 = 更明确）'],
  ['>1.2.3', '严格大于'],
  ['>=1.2.3', '大于等于'],
  ['<1.2.3', '严格小于'],
  ['<=1.2.3', '小于等于'],
  ['^1.2.3', '插入符：不改变最左非零位'],
  ['~1.2.3', '波浪号：不改变 major 与 minor'],
  ['1.2.x', 'x 通配：任意 patch'],
  ['1.x', 'x 通配：任意 minor 与 patch'],
  ['*', '任意版本'],
  ['', '空字符串等于 *'],
  ['1.2.3 - 1.5.0', '连字符区间（闭区间，两端都含）'],
  ['^1.0.0 || ^2.0.0', '|| 表示"或"，可任意拼接'],
  ['>=1.2.3 <2.0.0', '空格表示"与"，同一段内的比较符是交集'],
];

console.log('  样本版本：1.2.3 / 1.5.0 / 2.0.0');
console.log(`  ${'范围'.padEnd(20)} ${'含义'.padEnd(28)} ${'匹配 1.2.3 / 1.5.0 / 2.0.0'}`);
for (const [range, meaning] of rangeTable) {
  const hits = ['1.2.3', '1.5.0', '2.0.0'].map((v) => (semver.satisfies(v, range) ? '✔' : '✘'));
  console.log(`  ${range.padEnd(20)} ${meaning.padEnd(28)} ${hits.join('     ')}`);
}
console.log();
console.log('  （注意：范围里的空格是"与"，`||` 是"或"，两者的优先级不同——');
console.log('    先算空格(与)，再算 ||(或)。这和布尔运算一致。）');
console.log();

// ---------------------------------------------------------------------------
// 3. ^ 与 ~ ：最常被误解的一对
// ---------------------------------------------------------------------------
console.log('--- 3. ^ 与 ~ 的区别（重点） ---');

console.log('  用 validRange 把范围展开成等价的比较式，差别就一目了然了：');
const caretTilde = [
  ['^1.2.3', '~1.2.3'],
  ['^1.2.0', '~1.2.0'],
  ['^1.2', '~1.2'],
  ['^1.0.0', '~1'],
  ['^0.2.3', '~0.2.3'],
  ['^0.0.3', '~0.0.3'],
  ['^0.0', '~0.0'],
];
console.log(`  ${'^ 展开'.padEnd(46)} ${'~ 展开'}`);
for (const [caret, tilde] of caretTilde) {
  const c = String(semver.validRange(caret)).padEnd(30);
  const t = String(semver.validRange(tilde));
  console.log(`  ${caret.padEnd(8)} → ${c} ${tilde.padEnd(8)} → ${t}`);
}
console.log();

console.log('  一句话总结：');
console.log('    ^ 允许"最左边那个非零数字"以下的部分自由变；');
console.log('      ^1.2.3 的最左非零位是 1（major）→ 允许 minor/patch 变 → <2.0.0');
console.log('      ^0.2.3 的最左非零位是 2（minor）→ 只允许 patch 变 → <0.3.0');
console.log('      ^0.0.3 的最左非零位是 3（patch）→ 谁都不许变 → <0.0.4');
console.log('    ~ 只允许"最后一位"变（且至少固定两位）；');
console.log('      ~1.2.3 → 允许 patch 变 → <1.3.0');
console.log('      ~1.2   → 同上，等价于 ~1.2.0');
console.log('      ~1     → 只固定了 major，允许 minor 变 → <2.0.0');
console.log();

console.log('  所以"什么时候用哪个"的经验规则：');
console.log('    ^  ：绝大多数依赖的默认选择（npm install 默认就写 ^）。');
console.log('         适合"信任作者会守 semver"的稳定库。');
console.log('    ~  ：你只想要 bug 修复、连新功能都不想引入时用。');
console.log('         常见于"这个库历史上在小版本里干过破坏性变更"。');
console.log('    精确：供应链安全要求高（金融、生产关键路径），或该库长期不维护。');
console.log('    *：**永远不要**在生产项目里用，等于放弃了所有版本约束。');
console.log();

// ---------------------------------------------------------------------------
// 4. 预发布版本：一条被默认隔离的轨道
// ---------------------------------------------------------------------------
console.log('--- 4. 预发布版本的规则与坑 ---');

console.log('  预发布版本形如 1.0.0-beta.1，语义上它**小于** 1.0.0：');
const preOrder = ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-beta', '1.0.0-beta.2', '1.0.0-rc.1', '1.0.0'];
console.log('    排序（升序）：' + preOrder.join('  <  '));
console.log('    实测：lt("1.0.0-beta.1", "1.0.0") = ' + semver.lt('1.0.0-beta.1', '1.0.0'));
console.log();

console.log('  核心规则：**预发布版本不会被普通范围匹配到**，除非该范围里');
console.log('  显式出现了"同一 major.minor.patch 的预发布版本"。这是最容易踩的坑。');
console.log();

const preCases = [
  ['1.0.0-beta.1', '^1.0.0', '范围里没有预发布 → 不匹配'],
  ['1.0.0-beta.1', '>=1.0.0', '1.0.0-beta.1 < 1.0.0 → 不匹配'],
  ['1.0.0-beta.1', '^1.0.0-beta.0', '范围里有同版本的预发布 → 匹配'],
  ['1.0.0-beta.5', '^1.0.0-beta.0', '同 major.minor.patch 的预发布都可匹配'],
  ['1.5.0-beta.1', '^1.0.0', '版本元组不同 → 不匹配'],
  ['1.0.0', '^1.0.0-beta.0', '**正式版总能匹配**（1.0.0 > 1.0.0-beta.0）'],
  ['2.0.0-beta.1', '^1.0.0', '超出上界 → 不匹配'],
];
console.log(`  ${'版本'.padEnd(16)} ${'范围'.padEnd(18)} ${'satisfies'.padEnd(10)} 说明`);
for (const [v, r, note] of preCases) {
  const ok = String(semver.satisfies(v, r)).padEnd(10);
  console.log(`  ${v.padEnd(16)} ${r.padEnd(18)} ${ok} ${note}`);
}
console.log();

console.log('  办法一：在范围里显式写预发布（见上表第 3、4 行）。');
console.log('  办法二：传 { includePrerelease: true } 放宽边界。效果有限，实测如下：');
console.log(
  `    satisfies('1.0.0-beta.1', '^1.0.0', { includePrerelease: true }) = ` +
    semver.satisfies('1.0.0-beta.1', '^1.0.0', { includePrerelease: true }),
);
console.log('      → 仍然是 false！因为 includePrerelease 只放宽">= 比较符的边界"，');
console.log('        1.0.0-beta.1 依然小于下界 1.0.0。');
console.log(
  `    satisfies('1.5.0-beta.1', '^1.0.0', { includePrerelease: true }) = ` +
    semver.satisfies('1.5.0-beta.1', '^1.0.0', { includePrerelease: true }),
);
console.log('      → true。1.5.0-beta.1 落在 [1.0.0, 2.0.0) 内部，放宽后就被接受了。');
console.log();
console.log('  实践含义：');
console.log('    · 想让大家用上你的 beta，必须**显式**写 `^1.0.0-beta.0`，光发 tag 没用。');
console.log('    · 因此发布 beta 更稳的做法是打 dist-tag（npm publish --tag beta），');
console.log('      让使用者用 `npm i pkg@beta` 安装，而不是靠 semver 范围自动升上去。');
console.log();

// ---------------------------------------------------------------------------
// 5. semver 库常用 API 实测
// ---------------------------------------------------------------------------
console.log('--- 5. semver 库常用 API ---');

// valid / validRange：校验与规范化
console.log('  [valid] 把任意字符串解析成规范版本号，不合法返回 null');
for (const input of ['1.2.3', 'v1.2.3', '=1.2.3', '1.2', '1.2.3.4', '01.2.3', 'not-a-version']) {
  console.log(`    valid(${JSON.stringify(input).padEnd(16)}) = ${JSON.stringify(semver.valid(input))}`);
}
console.log('    → "v1.2.3" 里的 v 前缀会被容忍（历史遗留），但 "1.2" 和 "1.2.3.4" 不合法。');
console.log();

console.log('  [validRange] 校验一个范围表达式，同时会做规范化');
for (const input of ['^1.2.3', '1.x || >=2.5.0 || 3.0.0 - 3.2.0', 'not a range', '>=1.2.3 <2']) {
  console.log(`    validRange(${JSON.stringify(input).padEnd(36)}) = ${JSON.stringify(semver.validRange(input))}`);
}
console.log('    → 返回 null 表示这条范围根本没法解析。CI 里可以用它提前拦下写错的范围。');
console.log();

// satisfies
console.log('  [satisfies] 判断某版本是否落在范围内（日常最常用的一个）');
console.log(`    satisfies('1.2.3', '^1.0.0') = ${semver.satisfies('1.2.3', '^1.0.0')}`);
console.log(`    satisfies('2.0.0', '^1.0.0') = ${semver.satisfies('2.0.0', '^1.0.0')}`);
console.log();

// gt / lt / compare / sort
console.log('  [gt / lt / compare] 比较大小（注意：字符串比较会错，必须用这些函数）');
console.log(`    gt('1.2.4', '1.2.3')  = ${semver.gt('1.2.4', '1.2.3')}`);
console.log(`    lt('1.2.3', '1.10.0') = ${semver.lt('1.2.3', '1.10.0')}   ← 字符串比较会得出相反的结论`);
console.log(`    字符串比较 '1.9.0' < '1.10.0' ? ${'1.9.0' < '1.10.0'}   ← 这就是为什么不能直接用 <`);
const versionList = ['1.10.0', '1.9.0', '1.2.3', '2.0.0', '1.2.3-beta.1'];
console.log(`    sort([${versionList.join(', ')}])`);
console.log(`      = [${[...versionList].sort(semver.compare).join(', ')}]  ← 正确排序`);
console.log(`      = [${[...versionList].sort().join(', ')}]  ← 默认字典序，是错的`);
console.log();

// diff
console.log('  [diff] 判断两个版本之间是什么级别的变化（用于生成 CHANGELOG）');
for (const [a, b] of [['1.2.3', '1.2.4'], ['1.2.3', '1.3.0'], ['1.2.3', '2.0.0'], ['1.2.3', '1.2.3']]) {
  console.log(`    diff('${a}', '${b}') = ${JSON.stringify(semver.diff(a, b))}`);
}
console.log();

// coerce
console.log('  [coerce] 从一堆乱七八糟的文本里"抠"出一个版本号');
for (const input of ['v2', '1.2', 'the version is 1.2.3-beta', 'no version here']) {
  const c = semver.coerce(input);
  console.log(`    coerce(${JSON.stringify(input).padEnd(26)}) = ${c ? c.version : null}`);
}
console.log('    → coerce 会"猜"：v2 → 2.0.0，1.2 → 1.2.0。');
console.log('      **慎用**：它会把非法版本号悄悄变成合法值，掩盖上游的错误。');
console.log();

// minVersion / maxSatisfying
console.log('  [minVersion] 求范围允许的最低版本（判断"这个范围是不是太宽松"很有用）');
for (const r of ['^1.2.3', '~1.2.3', '>=1.2.3 <2.0.0', '^0.0.3', '*']) {
  const mv = semver.minVersion(r);
  console.log(`    minVersion(${JSON.stringify(r).padEnd(18)}) = ${mv ? mv.version : null}`);
}
console.log();

console.log('  [maxSatisfying] 从一批已有版本里挑出"符合范围的最高版"（包管理器选版的核心算法）');
const available = ['1.0.0', '1.2.0', '1.2.3', '1.5.0', '1.9.9', '2.0.0', '2.1.0', '1.6.0-beta.1'];
console.log(`    可选版本：${available.join(', ')}`);
for (const r of ['^1.0.0', '~1.2.0', '1.x', '>=2.0.0', '^2.0.0']) {
  const best = semver.maxSatisfying(available, r);
  console.log(`    maxSatisfying(..., ${JSON.stringify(r).padEnd(12)}) = ${best}`);
}
console.log('    → 注意 1.6.0-beta.1 虽然版本更高，但因为预发布规则不会被 ^1.0.0 选中。');
console.log();

// gtr / ltr / intersects / subset
console.log('  [gtr / ltr] 判断一个版本是否"高于/低于整个范围"（常用于安全公告）');
console.log(`    gtr('1.0.0', '^1.0.0') = ${semver.gtr('1.0.0', '^1.0.0')}  ← 1.0.0 在范围内，不算"高于"`);
console.log(`    gtr('3.0.0', '^1.0.0') = ${semver.gtr('3.0.0', '^1.0.0')}  ← 3.0.0 高于整个范围`);
console.log(`    ltr('0.9.0', '^1.0.0') = ${semver.ltr('0.9.0', '^1.0.0')}  ← 0.9.0 低于整个范围`);
console.log('    → 这正是 "本漏洞影响 <2.0.0 的所有版本" 这类公告的判定方式。');
console.log();

console.log('  [intersects / subset] 范围之间的关系（排查依赖冲突时用）');
console.log(`    intersects('^1.0.0', '~1.2.0') = ${semver.intersects('^1.0.0', '~1.2.0')}  ← 有交集`);
console.log(`    intersects('^1.0.0', '^2.0.0') = ${semver.intersects('^1.0.0', '^2.0.0')} ← 无交集，装两份`);
console.log(`    subset('^1.2.3', '^1.0.0') = ${semver.subset('^1.2.3', '^1.0.0')}  ← 前者是后者的子集`);
console.log(`    subset('^1.0.0', '^1.2.3') = ${semver.subset('^1.0.0', '^1.2.3')}`);
console.log();

// ---------------------------------------------------------------------------
// 6. 范围是"允许"，锁文件是"确定"
// ---------------------------------------------------------------------------
console.log('--- 6. 为什么还需要锁文件 ---');

console.log('  假设 package.json 写的是 "lodash": "^4.17.21"，这句话的含义是：');
console.log('    "我允许装 4.17.21 及以上、但小于 5.0.0 的任何版本。"');
console.log('  它**没有**说"就装 4.17.21"。');
console.log();

// 用一个假想的发布历史说明"范围不能保证结果"
const published = ['4.17.20', '4.17.21', '4.17.22', '4.18.0'];
console.log(`  ${'今天'.padEnd(8)}：lodash 已发布 ${published[0]} ~ ${published[2]}`);
console.log(`    → maxSatisfying 会选中 ${semver.maxSatisfying(published.slice(0, 3), '^4.17.21')}`);
console.log(`  ${'下周'.padEnd(8)}：lodash 发布了 4.18.0`);
console.log(`    → maxSatisfying 会选中 ${semver.maxSatisfying(published, '^4.17.21')}`);
console.log();
console.log('  同一份 package.json、同一台机器、只差几天，"npm install" 的结果就不同了。');
console.log('  这在团队协作里是灾难：A 同事装到 4.17.22，B 同事装到 4.18.0，');
console.log('  "在我机器上是好的"就这么诞生了。');
console.log();
console.log('  锁文件（package-lock.json）解决的就是这件事：它把"这次实际装到的');
console.log('  那棵依赖树"逐条写下来（每个包的精确版本 + tarball 地址 + 内容哈希）。');
console.log('    · package.json 的范围 → 允许什么（人写的、宽泛、长期稳定）');
console.log('    · package-lock.json   → 确定了什么（机器写的、精确、每次提交都更新）');
console.log('  CI 上用 `npm ci` 严格按锁文件安装（见 07_lockfile_and_ci.js）。');
console.log();

console.log('  一个可以立刻用上的自检：本仓库 package.json 里声明了哪些范围，');
console.log('  锁文件里实际锁到了什么版本（只读，不修改任何文件）。');
const fs = await import('node:fs/promises');
const lock = JSON.parse(await fs.readFile(path.join(ROOT, 'package-lock.json'), 'utf8'));
const repoPkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
const rootEntry = lock.packages[''];
const declared = { ...repoPkg.dependencies, ...repoPkg.devDependencies };
let checked = 0;
for (const [name, range] of Object.entries(declared)) {
  const lockedEntry = lock.packages[`node_modules/${name}`];
  if (!lockedEntry) continue;
  checked++;
  const ok = semver.satisfies(lockedEntry.version, range);
  console.log(
    `    ${name.padEnd(12)} 范围 ${range.padEnd(12)} → 锁定 ${lockedEntry.version.padEnd(10)} ${ok ? '✔ 满足' : '✘ 不满足'}`,
  );
}
console.log(`  共核对 ${checked} 个直接依赖，全部落在声明的范围内。`);
console.log(`  锁文件版本（lockfileVersion）= ${lock.lockfileVersion}`);
console.log(`  根条目记录的依赖数 = ${Object.keys(rootEntry.dependencies ?? {}).length} 生产 + ${Object.keys(rootEntry.devDependencies ?? {}).length} 开发`);
console.log();

console.log('小结：semver 是发布者与使用者之间的承诺，范围是承诺的措辞，');
console.log('      而锁文件是这份承诺在某一刻的"快照"。三者缺一不可。');
