/**
 * ============================================================================
 * 知识点：monorepo 与 workspaces —— 多包仓库的目录约定、依赖提升与发布策略
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】高级
 * 【前置知识】39_tooling_and_workflow/01_package_json_guide.js、
 *             03_semver.js、07_lockfile_and_ci.js（幽灵依赖）、
 *             09_publishing_packages.js（发布流程）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    · **monorepo（单一仓库）**：把多个互相有关联的包放进**同一个 git 仓库**里管理，
 *      而不是一个包一个仓库。最典型的形态长这样：
 *          repo/
 *            package.json          ← 只有配置，通常 private
 *            packages/
 *              core/package.json   ← 一个包
 *              ui/package.json     ← 另一个包
 *              app/package.json    ← 再来一个
 *    · **workspaces（工作区）**：npm / yarn / pnpm 提供的机制，
 *      让你在**仓库根目录装一次依赖**，就能把 `packages/*` 下的每个子包
 *      互相连起来（node_modules 里放软链接），并且它们共享一份锁文件。
 *    这两件事经常被混着说，但它们不是一回事：monorepo 说的是**目录怎么组织**，
 *    workspaces 说的是**包管理器怎么处理这些目录**。本文件把两者分开讲。
 *
 * 2. 为什么需要（真实项目场景）
 *    假设你有一个 UI 组件库和一个用到它的后台应用。分仓的话：
 *      · 改一行组件库代码 → 要发版、升级、再改应用，本地联调必须 `npm link`（著名的坑）；
 *      · 两个仓库的 eslint / prettier / tsconfig 版本逐渐漂移，两年后完全无法统一；
 *      · 一次跨仓库的重构要开两个 PR，还要处理"先合哪个"的时序问题。
 *    monorepo 一次解决这三件事：**一次提交可以同时改库和用它的应用**，
 *    工具链只有一份，重构是一个原子操作。
 *    代价是：仓库变大、CI 变慢、以及**依赖管理变得反直觉**——
 *    本文件要讲的"依赖提升"与"幽灵依赖"，就是这份代价的主要来源。
 *
 * 3. 核心语法要点（本文件怎么演示）
 *    ⚠️ 本文件**不安装任何依赖、不联网**。
 *    它在 `os.tmpdir()` 里搭一个**真实的双包（其实三包）monorepo 目录结构**，
 *    然后**自己实现一个简化版的依赖提升算法与解析算法**，
 *    把 npm 装依赖时会形成的 node_modules 布局算出来、打印出来，
 *    再基于这个布局回答两个问题：
 *      · 从某个子包出发 `import "x"`，会解析到哪个版本？
 *      · 哪些 import 是"能跑但没声明"的**幽灵依赖**？
 *    最后演示"只发布变更过的包"（changesets 的思路）与构建拓扑排序。
 *    结束时整个临时目录被删除。
 *
 * 4. 常见陷阱
 *    - 以为"依赖提升了"就等于"我可以随便 import"：**提升是安装器的实现细节，
 *      不是你的 API**。今天能从根 node_modules 里拿到的东西，明天就可能拿不到。
 *    - 在 monorepo 里 `import` 了一个自己没声明的包：单包项目里幽灵依赖只有一两个，
 *      monorepo 里所有包的依赖都堆在同一个根 node_modules 里，
 *      **任何一个包都可能误用任何一个别人的依赖**（第 5 节会把这个"幽灵面积"算出来）。
 *    - 以为 `workspace:*` 是通用写法：它是 pnpm / Yarn Berry 的协议，
 *      **npm 至今不支持**（第 6 节有本机实测结论），用了会直接报
 *      `EUNSUPPORTEDPROTOCOL`。npm 靠的是"版本范围 + workspaces 自动软链"。
 *    - 子包各自装一份工具（eslint、typescript）：版本一漂移，
 *      "为什么 CI 报的错和我本地不一样"就有了新的来源。工具类依赖**只在根声明**。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/11_monorepo_workspaces.js
 *
 * 【预期输出】
 *   逐节打印：monorepo 与 polyrepo 的取舍、目录约定与 workspaces 字段、
 *   真实搭建出来的三包工作区、**自研依赖提升解析器的完整输出**
 *   （每层 node_modules 放什么、从哪个包解析到哪个版本）、
 *   幽灵依赖的"可达面积"矩阵、发布后幽灵依赖爆炸的现场、
 *   workspace 协议的跨包管理器对照、构建拓扑排序与循环依赖检测、
 *   根级共享配置的写法、changesets 式的"只发布变更过的包"推演、常见陷阱清单。
 * ============================================================================
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

console.log('--- 0. 本文件的做法说明 ---');
console.log('不联网、不装依赖、不修改仓库里的任何文件。');
console.log('它会在系统临时目录里搭一个真实的 monorepo 目录树，然后用自写的解析器分析它。');
console.log(`Node 版本：${process.version}`);
console.log();

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'monorepo-demo-'));
const repo = path.join(tmpRoot, 'acme-repo');
console.log(`临时 monorepo 路径：${repo}`);
console.log();

/** 一次性写一批文件到临时目录 */
function writeFiles(baseDir, files) {
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(baseDir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
}

/** 读一个子包的 package.json */
function readPkg(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
}

try {
  // -------------------------------------------------------------------------
  // 1. monorepo 与 polyrepo 的取舍
  // -------------------------------------------------------------------------
  console.log('--- 1. 一个仓库 vs 多个仓库 ---');
  const compare = [
    ['跨包改动', '一次 PR 同时改库和用它的人，原子提交', '要开两个 PR，还得处理合并顺序'],
    ['本地联调', '软链接自动生效，改完即见', 'npm link / 手动复制，最容易出玄学问题'],
    ['工具链版本', '一份 eslint / prettier / tsconfig，不可能漂移', '两年后各仓版本完全对不上'],
    ['依赖安装', '一次装完，共享一份锁文件（也更占地）', '每个仓库各装各的，互不干扰'],
    ['CI 速度', '仓库大，容易"改一个包跑全量"，需要按变更集裁剪', '天然只跑本仓库的流水线'],
    ['权限与开源', '粒度粗：要么全公开要么全私有', '粒度细，可以只开源其中一个包'],
  ];
  console.log(`    ${'维度'.padEnd(12)} ${'monorepo'.padEnd(46)} polyrepo`);
  for (const [dim, mono, poly] of compare) {
    console.log(`    ${dim.padEnd(12)} ${mono.padEnd(46)} ${poly}`);
  }
  console.log();
  console.log('  一句话取舍：**包之间"耦合紧、改动常一起发"就该用 monorepo；');
  console.log('  包之间"独立演进、甚至不同团队不同权限"就该分仓。**');
  console.log();

  // -------------------------------------------------------------------------
  // 2. 目录约定与 workspaces 字段
  // -------------------------------------------------------------------------
  console.log('--- 2. 目录约定与 workspaces 字段 ---');
  console.log();
  console.log('  根 package.json 只需要声明"哪里是包"：');
  console.log('    {');
  console.log('      "name": "acme-repo",');
  console.log('      "private": true,               ← 根包永远不发，必须 private');
  console.log('      "workspaces": ["packages/*"],  ← 支持 glob，也可以是 ["apps/*", "libs/*"]');
  console.log('      "scripts": { "test": "node scripts/run-tests.js" },');
  console.log('      "devDependencies": { "eslint": "^10.0.0" }   ← 工具类依赖只在根声明');
  console.log('    }');
  console.log();
  console.log('  常用目录约定（不是强制的，但社区高度一致）：');
  const layout = [
    ['packages/', '全部"要发布出去"的包（库）'],
    ['apps/', '应用（不发布，只是消费者），也有人统一放在 packages/ 下'],
    ['tools/ 或 scripts/', '仓库自己的构建/发布脚本，不是包'],
    ['（可选）examples/', '示例工程，通常 workspace 但不发布'],
  ];
  for (const [dir, what] of layout) console.log(`    ${dir.padEnd(22)} ${what}`);
  console.log();
  console.log('  装了 workspaces 之后，node_modules 里发生的事：');
  console.log('    · 根 node_modules/ 里出现**软链接**：node_modules/@acme/core → packages/core；');
  console.log('    · 于是 packages/app 里 `import "@acme/core"` 能直接跑，**不需要发版**；');
  console.log('    · 所有子包的依赖被"尽量"装到根 node_modules 里（依赖提升），');
  console.log('      版本冲突时才在子包自己的 node_modules 里装一份（嵌套）。');
  console.log('    这就是第 3、4 节要算清楚的东西。');
  console.log();

  // -------------------------------------------------------------------------
  // 3. 搭一个真实的三包工作区
  // -------------------------------------------------------------------------
  console.log('--- 3. 搭一个三包工作区（真实的文件系统） ---');

  const pkgs = {
    core: {
      json: {
        name: '@acme/core',
        version: '1.2.0',
        dependencies: { lodash: '^4.17.0' },
      },
      main: 'index.js',
      // 源码里实际 import 了什么（我们用这个列表来模拟"代码的需要"）
      imports: ['lodash', './util.js'],
    },
    ui: {
      json: {
        name: '@acme/ui',
        version: '1.5.0',
        dependencies: { lodash: '^3.10.0', '@acme/core': '^1.0.0' },
      },
      main: 'index.js',
      // ⚠️ 'chalk' 没写进 dependencies —— 这就是一个幽灵依赖，第 5 节见
      imports: ['@acme/core', 'lodash', 'chalk', './theme.js'],
    },
    app: {
      json: {
        name: '@acme/app',
        version: '1.0.0',
        private: true, // 应用不发布
        dependencies: { '@acme/core': '^1.0.0', '@acme/ui': '^1.5.0', chalk: '^5.0.0' },
      },
      main: 'index.js',
      imports: ['@acme/ui', '@acme/core', 'chalk'],
    },
  };

  const files = {
    'acme-repo/package.json': JSON.stringify(
      { name: 'acme-repo', private: true, version: '0.0.0', workspaces: ['packages/*'] },
      null,
      2,
    ),
  };
  for (const [dir, info] of Object.entries(pkgs)) {
    files[`acme-repo/packages/${dir}/package.json`] = JSON.stringify(info.json, null, 2);
    files[`acme-repo/packages/${dir}/${info.main}`] =
      `// ${info.json.name}\n` +
      info.imports
        .filter((s) => !s.startsWith('.'))
        .map((s) => `import ${s.replace(/[^a-zA-Z0-9]/g, '_')} from '${s}';`)
        .join('\n') +
      '\n';
    for (const rel of info.imports.filter((s) => s.startsWith('.'))) {
      files[`acme-repo/packages/${dir}/${rel.replace('./', '')}`] = `export const local = '${dir} 的内部模块';\n`;
    }
  }
  // monorepo 自己的脚本目录
  files['acme-repo/scripts/build.js'] = "// 假的构建脚本，只为让目录结构看起来真实\n";
  writeFiles(tmpRoot, files);

  console.log('  已创建：');
  console.log('    acme-repo/package.json            workspaces: ["packages/*"]');
  for (const [dir, info] of Object.entries(pkgs)) {
    const deps = Object.entries(info.json.dependencies)
      .map(([k, v]) => `${k}@${v}`)
      .join(', ');
    console.log(`    acme-repo/packages/${dir}/  ${info.json.name.padEnd(14)} 依赖：${deps}`);
  }
  console.log();

  // 读取真实的工作区列表（不是写死的 —— 真的去解析根 package.json 里的 glob）
  // 注意：这里没有用 Node 22+ 才有的 fs.globSync，而是自己展开最后一段的 `*`，
  // 因为本仓库声明支持 Node >= 18（见根 package.json 的 engines 字段）。
  function expandWorkspaces(rootDir) {
    const rootPkg = readPkg(rootDir);
    const patterns = rootPkg.workspaces ?? [];
    const dirs = [];
    for (const pattern of patterns) {
      const segments = pattern.split('/');
      const last = segments.pop();
      const baseDir = path.join(rootDir, ...segments);
      if (!fs.existsSync(baseDir)) continue;
      const candidates = last === '*' ? fs.readdirSync(baseDir) : [last];
      for (const name of candidates) {
        const rel = [...segments, name].join('/');
        if (fs.existsSync(path.join(rootDir, rel, 'package.json'))) dirs.push(rel);
      }
    }
    return dirs.sort();
  }
  const workspaceDirs = expandWorkspaces(repo);
  console.log(`  用 "packages/*" 这个 glob 扫出来的工作区：${workspaceDirs.join(', ')}`);
  console.log('  （这是真的在跑 glob 匹配，不是把三个名字写死在代码里。）');
  console.log();

  // -------------------------------------------------------------------------
  // 4. 自己实现依赖提升（hoisting）
  // -------------------------------------------------------------------------
  console.log('--- 4. 自己实现一遍依赖提升 ---');
  console.log();
  console.log('  npm 装依赖时做的事，简化之后是这样一个循环：');
  console.log('    1. 按工作区顺序，逐个处理每个包声明的依赖；');
  console.log('    2. 能放根目录就放根目录（**提升 / hoisting**）；');
  console.log('    3. 根目录已经有同名包、且版本兼容 → 直接复用，不重复安装；');
  console.log('    4. 根目录的同名包版本**不兼容** → 在这个子包自己的 node_modules 里装一份（**嵌套**）。');
  console.log();

  // 为了算出版本号，先给每个"依赖名 + 范围"配一个"registry 上会选中的版本"
  // （真实世界里这一步是 maxSatisfying，见 03_semver.js）
  const registry = {
    lodash: { '^4.17.0': '4.17.21', '^3.10.0': '3.10.1' },
    chalk: { '^5.0.0': '5.3.0' },
  };
  const pickVersion = (name, range) => {
    if (registry[name] && registry[name][range]) return registry[name][range];
    throw new Error(`示例里没有为 ${name}@${range} 准备版本数据`);
  };

  /** 安装位置的键：'node_modules' 是根，'packages/ui/node_modules' 是子包内嵌的那一层 */
  const ROOT_LEVEL = 'node_modules';
  /** 软链接的值长这样，用一个前缀就能和真实版本号区分开 */
  const LINK_PREFIX = '软链→';
  const isLink = (v) => typeof v === 'string' && v.startsWith(LINK_PREFIX);

  function simulateInstall() {
    /** 每一层 node_modules：key = 相对仓库根的路径，value = Map<包名, 版本或软链标记> */
    const layers = new Map();
    layers.set(ROOT_LEVEL, new Map());
    const actions = [];

    // 第一步：先把**所有**工作区包软链到根。
    // 这一步必须在处理依赖之前完成 —— npm 是先知道"仓库里有哪些包"，
    // 再去解析依赖的。否则先被处理的包会因为"工作区包还没软链"而去下载 registry 上的版本。
    for (const dir of workspaceDirs) {
      const info = readPkg(path.join(repo, dir));
      layers.get(ROOT_LEVEL).set(info.name, `${LINK_PREFIX}${dir}`);
      actions.push(['软链', '(工作区)', info.name, ROOT_LEVEL, `→ ${dir}（工作区之间直接引用本地目录，不发版）`]);
    }

    // 第二步：逐个包处理它声明的第三方依赖
    for (const dir of workspaceDirs) {
      const info = readPkg(path.join(repo, dir));
      const nested = `${dir}/node_modules`;
      for (const [name, range] of Object.entries(info.dependencies ?? {})) {
        const rootValue = layers.get(ROOT_LEVEL).get(name);
        // 情况一：工作区内部依赖 → 复用根上的软链
        if (isLink(rootValue)) {
          actions.push(['复用', dir, `${name}@${range}`, ROOT_LEVEL, `命中工作区软链（本地 ${rootValue.slice(LINK_PREFIX.length)}）`]);
          continue;
        }
        // 情况二：这个包自己那层已经有同名包了
        if (layers.get(nested)?.has(name)) {
          actions.push(['复用', dir, `${name}@${range}`, nested, `本包已有 ${layers.get(nested).get(name)}`]);
          continue;
        }
        const version = pickVersion(name, range);
        // 情况三：根上还没有 → 提升
        if (!rootValue) {
          layers.get(ROOT_LEVEL).set(name, version);
          actions.push(['提升', dir, `${name}@${range}`, ROOT_LEVEL, `装到根：${name}@${version}`]);
          continue;
        }
        // 情况四：根上有同名包 —— 主版本相同就当兼容，直接复用
        if (String(rootValue).split('.')[0] === version.split('.')[0]) {
          actions.push(['复用', dir, `${name}@${range}`, ROOT_LEVEL, `根上已有 ${name}@${rootValue}（主版本相同，视为兼容）`]);
          continue;
        }
        // 情况五：冲突 → 在这个子包自己的 node_modules 里装一份
        if (!layers.has(nested)) layers.set(nested, new Map());
        layers.get(nested).set(name, version);
        actions.push(['嵌套', dir, `${name}@${range}`, nested, `与根上的 ${rootValue} 大版本冲突 → 这里装 ${version}`]);
      }
    }
    return { layers, actions };
  }

  const { layers, actions } = simulateInstall();

  console.log('  [4.1] 安装动作流水（简化版 npm 的决策过程）');
  console.log();
  console.log(`    ${'动作'.padEnd(6)} ${'发起者'.padEnd(12)} ${'依赖'.padEnd(20)} ${'落在哪'.padEnd(28)} 说明`);
  for (const [act, by, dep, where, note] of actions) {
    console.log(`    ${act.padEnd(6)} ${by.padEnd(12)} ${dep.padEnd(20)} ${where.padEnd(28)} ${note}`);
  }
  console.log();

  console.log('  [4.2] 算出来的 node_modules 布局');
  console.log();
  for (const [where, map] of [...layers.entries()].sort()) {
    const label = where === ROOT_LEVEL ? 'node_modules/（根，被所有包共享）' : `${where}/`;
    console.log(`    ${label}`);
    if (map.size === 0) {
      console.log('      （空 —— 这个包的依赖全都被提升到根了）');
      continue;
    }
    for (const [name, version] of [...map.entries()].sort()) {
      console.log(`      ${name.padEnd(16)} ${version}`);
    }
  }
  console.log();

  // ---- 4.3 自己实现"从某个包出发能不能解析到某个包" ----
  console.log('  [4.3] 自己实现模块解析：模拟 Node 向上查找 node_modules 的过程');
  console.log();
  console.log('    Node 的规则很简单：**从当前文件所在目录开始，一层层往上找 node_modules**。');
  console.log('    在 monorepo 里，"往上"会经过子包自己的 node_modules，再到根的 node_modules。');
  console.log('    这个"往上找"就是幽灵依赖能跑起来的全部原因。');
  console.log();

  /** 把绝对路径转成"相对仓库根、用 / 分隔"的键 */
  const relOf = (abs) => path.relative(repo, abs).split(path.sep).join('/');

  /** 从 pkgDir 出发解析 name，返回 { version, where } 或 null */
  function resolveFrom(pkgDir, name) {
    let dir = pkgDir;
    // 一层层往上找 node_modules，直到仓库根（真实 Node 还会继续往文件系统上层找）
    for (;;) {
      const layerKey = `${relOf(dir)}/node_modules`.replace(/^\/?node_modules$/, ROOT_LEVEL);
      if (layers.has(layerKey) && layers.get(layerKey).has(name)) {
        return { version: layers.get(layerKey).get(name), where: layerKey };
      }
      if (path.resolve(dir) === path.resolve(repo)) break;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return null;
  }

  console.log(`    ${'从哪个包出发'.padEnd(22)} ${'import 的名字'.padEnd(16)} ${'解析结果'}`);
  const probeList = [
    ['packages/core', 'lodash'],
    ['packages/ui', 'lodash'],
    ['packages/app', 'lodash'],
    ['packages/ui', 'chalk'],
    ['packages/core', 'chalk'],
    ['packages/app', '@acme/core'],
    ['packages/core', '@acme/ui'],
  ];
  for (const [from, name] of probeList) {
    const r = resolveFrom(path.join(repo, from), name);
    const shown = r ? `${name} → ${r.version}（来自 ${r.where}）` : `${name} → ❌ 解析不到`;
    console.log(`    ${from.padEnd(22)} ${name.padEnd(16)} ${shown}`);
  }
  console.log();
  console.log('    最后一行也值得注意：core **没有声明** @acme/ui，但它照样 import 得到 ——');
  console.log('    因为所有工作区包都被软链到了同一个根 node_modules 里。');
  console.log('    也就是说：**工作区包之间也是互相"幽灵可达"的**，只是这种幽灵通常不会炸');
  console.log('    （它们本来就在同一个仓库里一起发版），但会让依赖关系变得不可信。');
  console.log();
  console.log('    注意第 2、3 行：**同一个 `lodash`，在不同包里解析到了不同版本**');
  console.log('      · ui 拿到 3.10.1（它自己声明的 ^3.10.0，被嵌套安装）；');
  console.log('      · core / app 拿到 4.17.21（根的提升层）。');
  console.log('    这在单包项目里不会发生，是 monorepo 特有的"同名不同版共存"。');
  console.log('    它本身不是 bug（npm 会保证每个包拿到自己声明的版本），');
  console.log('    但它意味着：**"我本地测过了"这句话在 monorepo 里的可信度更低。**');
  console.log();

  // -------------------------------------------------------------------------
  // 5. 幽灵依赖在 monorepo 里被放大
  // -------------------------------------------------------------------------
  console.log('--- 5. 幽灵依赖（phantom dependency）在 monorepo 里被放大 ---');
  console.log();
  console.log('  幽灵依赖 = **代码里 import 了，但 package.json 里没声明**的包。');
  console.log('  它为什么能跑？因为提升让那个包"恰好"出现在上层 node_modules 里。');
  console.log();

  console.log('  [5.1] 本仓库里真实存在的幽灵依赖（逐个包检查源码里的 import）');
  console.log();
  console.log(`    ${'包'.padEnd(22)} ${'import'.padEnd(16)} ${'声明了吗'.padEnd(10)} ${'能解析到吗'.padEnd(12)} 判定`);
  const phantomReport = [];
  for (const dir of workspaceDirs) {
    const info = readPkg(path.join(repo, dir));
    const declared = new Set(Object.keys(info.dependencies ?? {}));
    const pkgDir = path.join(repo, dir);
    for (const spec of pkgs[path.basename(dir)].imports) {
      if (spec.startsWith('.')) continue;
      const isDeclared = declared.has(spec);
      const resolved = resolveFrom(pkgDir, spec);
      let verdict;
      if (isDeclared && resolved) verdict = '✅ 正常';
      else if (!isDeclared && resolved) verdict = '⚠️ 幽灵依赖（现在能跑，发布后就崩）';
      else if (isDeclared && !resolved) verdict = '❌ 声明了但装不上';
      else verdict = '❌ 既没声明也解析不到';
      if (!isDeclared && resolved) phantomReport.push({ dir, spec, version: resolved.version });
      console.log(
        `    ${dir.padEnd(22)} ${spec.padEnd(16)} ${(isDeclared ? '是' : '**否**').padEnd(10)} ${(resolved ? resolved.version : '否').padEnd(12)} ${verdict}`,
      );
    }
  }
  console.log();
  console.log(`    被抓到 ${phantomReport.length} 个幽灵依赖：`);
  for (const p of phantomReport) {
    console.log(`      ${p.dir} 里的 '${p.spec}' —— 它自己没声明，靠别人提升上来的 ${p.spec}@${p.version} 活着`);
  }
  console.log();

  console.log('  [5.2] "被放大"是什么意思：算一下幽灵可达面积');
  console.log();
  console.log('    提升之后，根 node_modules 里躺着**所有包的所有依赖**。');
  console.log('    于是任意一个包，都能"顺手"import 到任意一个别人的依赖。');
  console.log('    单包项目里这种事故最多是"我误用了自己依赖的依赖"（一层）；');
  console.log('    monorepo 里是 N 个包 × 根上 M 个包，**事故面是乘出来的**。');
  console.log();
  const rootNames = [...layers.get(ROOT_LEVEL).keys()].filter((n) => !String(layers.get(ROOT_LEVEL).get(n)).startsWith('软链'));
  console.log(`    根 node_modules 里的第三方包：${rootNames.join(', ')}`);
  console.log();
  console.log(`    ${'包'.padEnd(22)} ${rootNames.map((n) => n.padEnd(10)).join('')}`);
  for (const dir of workspaceDirs) {
    const info = readPkg(path.join(repo, dir));
    const declared = new Set(Object.keys(info.dependencies ?? {}));
    const cells = rootNames.map((name) => {
      const reachable = Boolean(resolveFrom(path.join(repo, dir), name));
      if (!reachable) return '—'.padEnd(10);
      return (declared.has(name) ? '✅ 声明' : '⚠️ 幽灵').padEnd(10);
    });
    console.log(`    ${dir.padEnd(22)} ${cells.join('')}`);
  }
  console.log();
  console.log('    读法：✅ = 自己声明了（正常）；⚠️ = **没声明但现在能 import 到**（隐患）；— = 够不着。');
  console.log('    这个矩阵里每一个 ⚠️ 都是一颗定时炸弹：它的引信是"别人哪天不再依赖那个包"。');
  console.log();

  console.log('  [5.3] 炸弹爆炸的现场：把 @acme/ui 单独发布出去');
  console.log();
  console.log('    模拟一个外部用户：他的项目里只装 @acme/ui 和它**声明过的**依赖。');

  // 造一个"外部消费者"的安装树：只有 ui 声明过的依赖
  const consumerRoot = path.join(tmpRoot, 'consumer');
  writeFiles(tmpRoot, {
    'consumer/package.json': JSON.stringify(
      { name: 'consumer-app', private: true, version: '1.0.0', dependencies: { '@acme/ui': '^1.5.0' } },
      null,
      2,
    ),
    'consumer/node_modules/@acme/ui/package.json': JSON.stringify(pkgs.ui.json, null, 2),
    'consumer/node_modules/@acme/ui/index.js': '// 发布出去的 @acme/ui\n',
    // 用户装 ui 时，npm 会连它的依赖一起装：lodash@3 被嵌套在 ui 里（因为用户自己可能用 lodash@4）
    'consumer/node_modules/@acme/ui/node_modules/lodash/package.json': JSON.stringify(
      { name: 'lodash', version: '3.10.1' },
      null,
      2,
    ),
    'consumer/node_modules/@acme/core/package.json': JSON.stringify(pkgs.core.json, null, 2),
    'consumer/node_modules/@acme/core/index.js': '// 发布出去的 @acme/core\n',
    'consumer/node_modules/lodash/package.json': JSON.stringify({ name: 'lodash', version: '4.17.21' }, null, 2),
  });

  // 消费者侧的解析：只看这个独立的 node_modules 树
  const consumerLayers = new Map();
  consumerLayers.set('node_modules', new Map([['lodash', '4.17.21'], ['@acme/core', '1.2.0']]));
  consumerLayers.set('node_modules/@acme/ui/node_modules', new Map([['lodash', '3.10.1']]));

  function resolveInConsumer(pkgDir, name) {
    let dir = pkgDir;
    for (;;) {
      const rel = path.relative(consumerRoot, dir).split(path.sep).join('/');
      const layerKey = `${rel}/node_modules`.replace(/^\/?node_modules$/, 'node_modules');
      if (consumerLayers.has(layerKey) && consumerLayers.get(layerKey).has(name)) {
        return { version: consumerLayers.get(layerKey).get(name), where: layerKey };
      }
      if (path.resolve(dir) === path.resolve(consumerRoot)) break;
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
    return null;
  }

  const uiDir = path.join(consumerRoot, 'node_modules/@acme/ui');
  console.log();
  console.log(`    ${'外部用户从 @acme/ui 里 import'.padEnd(40)} 结果`);
  for (const spec of pkgs.ui.imports.filter((s) => !s.startsWith('.'))) {
    const r = resolveInConsumer(uiDir, spec);
    console.log(
      `    ${spec.padEnd(40)} ${r ? `✅ 解析到 ${spec}@${r.version}（${r.where}）` : '❌ 解析失败：MODULE_NOT_FOUND'}`,
    );
  }
  console.log();
  console.log('    → `chalk` 在 monorepo 里"能跑"，是因为它被 app 提升到了根；');
  console.log('      单独发布之后，**没有任何人再提供它**，用户的构建直接失败。');
  console.log('    → `lodash` 也值得注意：monorepo 里 ui 拿到 3.10.1，用户这边同样拿到 3.10.1，');
  console.log('      看起来很一致 —— 但根上的 lodash@4 从 ui 的角度是"看不见的"，');
  console.log('      这意味着**同一个仓库里的人在讨论 lodash 的 API 时可能说的不是同一个库**。');
  console.log();
  console.log('    防幽灵依赖的三个办法（按推荐度排序）：');
  console.log('      1. 用 eslint-plugin-import 的 `import/no-extraneous-dependencies` 规则**在 CI 里拦住**；');
  console.log('      2. 每个包发版前在"干净的临时目录"里装一次它自己，跑一遍冒烟测试；');
  console.log('      3. 用 pnpm（默认不做提升，依赖是硬链接隔离的）—— 幽灵依赖在 pnpm 下**直接跑不起来**，');
  console.log('         这既是它的优点（问题被提前暴露），也是很多人觉得"pnpm 太严"的原因。');
  console.log();

  // -------------------------------------------------------------------------
  // 6. workspace 协议
  // -------------------------------------------------------------------------
  console.log('--- 6. workspace:* 协议：一个跨包管理器的差异 ---');
  console.log();
  const workspaceProtocol = [
    ['npm', '❌ 不支持', '本机 npm 11.13.0 / npm-package-arg 13.0.2 实测：EUNSUPPORTEDPROTOCOL'],
    ['pnpm', '✅ 支持', '`"@acme/core": "workspace:*"` 是 pnpm 的标准写法'],
    ['Yarn Berry (v2+)', '✅ 支持', '支持 workspace:* / workspace:^ / workspace:~'],
    ['Yarn v1', '❌ 不支持', '只认普通版本范围'],
  ];
  console.log(`    ${'包管理器'.padEnd(18)} ${'workspace:*'.padEnd(14)} 说明`);
  for (const [pm, sup, note] of workspaceProtocol) {
    console.log(`    ${pm.padEnd(18)} ${sup.padEnd(14)} ${note}`);
  }
  console.log();
  console.log('  ⚠️ 实测结论：**npm 至今不支持 `workspace:` 协议**，用了会直接报错：');
  console.log('      npm error code EUNSUPPORTEDPROTOCOL');
  console.log('      npm error Unsupported URL Type "workspace:": workspace:*');
  console.log();
  console.log('  那 npm 怎么把一个工作区包引用成"就是本地那份"？靠两条：');
  console.log('    1. workspaces 字段让 npm 知道"这个包在仓库里"，于是装上软链接；');
  console.log('    2. 子包之间的依赖写**普通版本范围**（如 "^1.0.0"），');
  console.log('       只要本地那个包的 version 落在范围里，npm 就用本地软链接而不是去下载。');
  console.log();
  console.log('    实测含义：本地 @acme/core 的 version 是 1.2.0，ui 写 "^1.0.0" → 命中本地；');
  console.log('    如果哪天 core 升到 2.0.0 而 ui 还写 "^1.0.0" → **软链失效**，');
  console.log('    npm 会去 registry 下载一个 1.x 来装，本地改动立刻"不生效"了。');
  console.log('    这是 monorepo 里非常经典的一次"我改的代码怎么没生效"。');
  console.log();
  console.log('  跨包管理器的可移植写法是 `"@acme/core": "1.2.0"`（精确版本）或');
  console.log('  `"^1.0.0"` + 发布时用工具（changesets）统一改写版本号。');
  console.log();

  // -------------------------------------------------------------------------
  // 7. 构建拓扑顺序
  // -------------------------------------------------------------------------
  console.log('--- 7. 构建顺序：不能按字母序，要按拓扑序 ---');
  console.log();
  console.log('  app 依赖 ui，ui 依赖 core，所以构建必须 core → ui → app。');
  console.log('  按字母序会得到 app → core → ui，第一步就找不到 ui 的产物。');
  console.log();

  const depGraph = new Map(); // 包名 → 它依赖的工作区包名
  for (const dir of workspaceDirs) {
    const info = readPkg(path.join(repo, dir));
    const deps = Object.keys(info.dependencies ?? {}).filter((d) => d.startsWith('@acme/'));
    depGraph.set(info.name, deps);
  }

  /**
   * Kahn 拓扑排序：反复取出"入度为 0"的节点。
   * 这里的"入度"是**它自己还依赖着几个没构建完的包**——
   * 这个方向很容易写反：入度统计的应该是"我的依赖"，不是"依赖我的人"。
   */
  function topoSort(graph) {
    const indegree = new Map([...graph.keys()].map((n) => [n, 0]));
    const dependents = new Map([...graph.keys()].map((n) => [n, []]));
    for (const [node, deps] of graph) {
      for (const d of deps) {
        if (!graph.has(d)) continue; // 只关心工作区内部的依赖
        indegree.set(node, indegree.get(node) + 1); // node 还欠 d 一次构建
        dependents.get(d).push(node); // d 构建完之后，node 的欠账少一笔
      }
    }
    const ready = [...indegree.entries()].filter(([, deg]) => deg === 0).map(([n]) => n).sort();
    const order = [];
    while (ready.length > 0) {
      const node = ready.shift();
      order.push(node);
      for (const waiter of dependents.get(node) ?? []) {
        const next = indegree.get(waiter) - 1;
        indegree.set(waiter, next);
        if (next === 0) {
          ready.push(waiter);
          ready.sort(); // 排序只为让输出稳定，不影响正确性
        }
      }
    }
    // 入度仍 > 0 的，说明它们互相依赖成环，永远等不到"依赖都构建完"
    const cyclic = [...indegree.entries()].filter(([, deg]) => deg > 0).map(([n]) => n);
    return { order, cyclic };
  }

  console.log(`    工作区依赖图：${[...depGraph.entries()].map(([k, v]) => `${k} → [${v.join(', ')}]`).join('  ')}`);
  const { order, cyclic } = topoSort(depGraph);
  console.log(`    拓扑排序结果：${order.join(' → ')}`);
  console.log(`    按字母序（错误示范）：${[...depGraph.keys()].sort().join(' → ')}`);
  console.log(`    检测到的循环依赖：${cyclic.length === 0 ? '无 ✅' : cyclic.join(', ')}`);
  console.log();

  // 再演示一个"有环"的情况：把 core 改成依赖 ui
  const cyclicGraph = new Map(depGraph);
  cyclicGraph.set('@acme/core', ['@acme/ui']);
  const cyc = topoSort(cyclicGraph);
  console.log('    如果 core 反过来依赖 ui（core ↔ ui 成环），同一个算法会输出：');
  console.log(`      可排序的部分：${cyc.order.join(' → ') || '（一个都排不出来）'}`);
  console.log(`      排不出来的：${cyc.cyclic.join(', ')}`);
  console.log('    → 注意 app **也被卡住了**：它自己不参与环，但它依赖了环里的包，');
  console.log('      所以永远等不到"依赖都构建完"。**一个环会毒死它下游的所有包。**');
  console.log('    → 唯一的出路是**打破依赖**：抽出一个更底层的包（比如 @acme/types）');
  console.log('      让双方都依赖它，把环变成一条链。');
  console.log('    → 顺带一提：**循环依赖在工作区里是允许存在的**（软链接不介意环），');
  console.log('      所以它不会在 install 时报错，只会让构建脚本神秘地失败。');
  console.log('      这也是"install 成功"不等于"仓库健康"的一个典型例子。');
  console.log();

  console.log('    真实项目里怎么用这个顺序？');
  console.log('      · 根 scripts：`"build": "node scripts/build-all.js"`，内部按拓扑序依次执行；');
  console.log('      · 或用现成工具（turbo / nx / pnpm -r --sort），它们都内置了拓扑排序 + 缓存；');
  console.log('      · 缓存的关键是"输入哈希"：某个包的源码和它的依赖的产物都没变 → 直接跳过。');
  console.log();

  // -------------------------------------------------------------------------
  // 8. 根级共享配置
  // -------------------------------------------------------------------------
  console.log('--- 8. 根级共享配置：把工具提到根上 ---');
  console.log();
  console.log('  原则：**"每个包都需要、且必须版本一致"的东西，只在根声明一次。**');
  console.log();
  const sharedConfig = [
    ['eslint', '根 devDependencies + 根 eslint.config.js（flat config 天然支持多目录）'],
    ['prettier', '根 .prettierrc + 根 devDependencies，所有包共用一套格式'],
    ['typescript', '根 tsconfig.base.json，子包用 "extends": "../../tsconfig.base.json" 继承'],
    ['测试框架', '根声明（vitest / jest），子包只写自己的测试脚本'],
    ['构建工具', '根声明，子包共享同一份编译器版本'],
  ];
  for (const [tool, how] of sharedConfig) console.log(`    ${tool.padEnd(14)} ${how}`);
  console.log();
  console.log('  为什么必须提到根：**版本漂移**。');
  console.log('    如果每个子包各写一份 `"eslint": "^8"` / `"^9"` / `"^10"`，');
  console.log('    就会出现"同一个文件在 CI 里报错、在本地不报错" —— 因为两处跑的是不同大版本的规则。');
  console.log('    ESLint 9 抛弃了 .eslintrc 改用 flat config，正好是这类事故的教科书案例。');
  console.log();
  console.log('  本仓库自己就是这个模式的实例：根目录一个 eslint.config.js，');
  console.log('  用 files 字段把不同目录划给不同规则集（示例目录宽松、scripts/ 严格）。');
  console.log('  `node 39_tooling_and_workflow/04_eslint.js` 讲的 flat config 语法，');
  console.log('  在 monorepo 里就是"根级一份配置管所有包"的实现手段：');
  console.log();
  console.log('    // 根 eslint.config.js —— 给不同的包不同的规则集');
  console.log('    export default [');
  console.log('      { files: ["packages/core/**/*.js"], rules: { /* 库代码：严格 */ } },');
  console.log('      { files: ["packages/app/**/*.js"], rules: { /* 应用代码：宽松 */ } },');
  console.log('    ];');
  console.log();

  // -------------------------------------------------------------------------
  // 9. 只发布变更过的包
  // -------------------------------------------------------------------------
  console.log('--- 9. 只发布"变更过"的包：changesets 的思路 ---');
  console.log();
  console.log('  monorepo 发布的核心难题：改了 core 一个文件，');
  console.log('  要发的不只是 core —— **依赖 core 的 ui 和 app 也得跟着发新版本**（它们的行为变了）。');
  console.log('  手工维护这件事必然出错，所以有了 changesets / rush / lerna 这类工具。');
  console.log();
  console.log('  [9.1] changesets 的输入长这样（`.changeset/*.md`，随 PR 一起提交）：');
  console.log();
  const changeFiles = {
    '.changeset/brave-lions-sing.md': [
      '---',
      '"@acme/core": minor',
      '---',
      '',
      '新增 `parseStream()`，支持流式解析。',
    ].join('\n'),
    '.changeset/tidy-donkeys-jump.md': [
      '---',
      '"@acme/ui": patch',
      '---',
      '',
      '修复按钮在 Safari 上高度偏移 1px 的问题。',
    ].join('\n'),
  };
  writeFiles(repo, changeFiles);
  for (const [file, content] of Object.entries(changeFiles)) {
    console.log(`    ${file}`);
    for (const line of content.split('\n')) console.log(`      ${line}`);
    console.log();
  }

  console.log('  [9.2] 解析这些文件，算出"哪些包要发、各升哪一位"');
  console.log();

  /** 极简 frontmatter 解析：取出 --- 之间的 "包名": bump 行 */
  function parseChangeset(text) {
    const result = new Map();
    const lines = text.split('\n');
    if (lines[0].trim() !== '---') return result;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') break;
      const m = lines[i].match(/^"?([^"]+?)"?\s*:\s*(major|minor|patch)\s*$/);
      if (m) result.set(m[1], m[2]);
    }
    return result;
  }

  const RANK = { none: 0, patch: 1, minor: 2, major: 3 };
  const bumpOf = new Map(); // 包名 → 最大 bump 级别
  for (const [file, content] of Object.entries(changeFiles)) {
    const parsed = parseChangeset(content);
    console.log(`    解析 ${path.basename(file)} → ${[...parsed.entries()].map(([k, v]) => `${k}: ${v}`).join(', ')}`);
    for (const [name, kind] of parsed) {
      const cur = bumpOf.get(name) ?? 'none';
      bumpOf.set(name, RANK[kind] > RANK[cur] ? kind : cur);
    }
  }
  console.log();
  console.log('  [9.3] 沿依赖图**向上传播**：依赖变了，依赖者至少也要发一个 patch');
  console.log();

  const dependents = new Map(); // 包名 → 依赖它的包
  for (const [name, deps] of depGraph) {
    for (const d of deps) {
      if (!dependents.has(d)) dependents.set(d, []);
      dependents.get(d).push(name);
    }
  }
  const queue = [...bumpOf.keys()];
  const propagated = [];
  while (queue.length > 0) {
    const changed = queue.shift();
    for (const dependent of dependents.get(changed) ?? []) {
      if (bumpOf.has(dependent)) {
        continue; // 它自己已经有变更，不用再推
      }
      bumpOf.set(dependent, 'patch');
      propagated.push([dependent, changed]);
      queue.push(dependent);
    }
  }
  for (const [pkg, because] of propagated) {
    console.log(`    ${pkg} 本来没有 changeset，但它依赖的 ${because} 变了 → 也升 patch`);
  }
  if (propagated.length === 0) console.log('    （本次没有需要传播的连锁升级）');
  console.log();

  /** 按 semver 规则升一位（简化版，完整的规则见 03_semver.js 的 semver.inc） */
  function bump(version, kind) {
    const [major, minor, patch] = version.split('.').map(Number);
    if (kind === 'major') return `${major + 1}.0.0`;
    if (kind === 'minor') return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
  }

  console.log('  [9.4] 最终发布计划');
  console.log();
  console.log(`    ${'包'.padEnd(16)} ${'当前版本'.padEnd(12)} ${'升级'.padEnd(10)} ${'新版本'.padEnd(12)} 发布？`);
  const plan = [];
  for (const dir of workspaceDirs) {
    const info = readPkg(path.join(repo, dir));
    const kind = bumpOf.get(info.name);
    const isPrivate = info.private === true;
    if (!kind) {
      console.log(
        `    ${info.name.padEnd(16)} ${info.version.padEnd(12)} ${'—'.padEnd(10)} ${'—'.padEnd(12)} 不发（没有变更）`,
      );
      continue;
    }
    const next = bump(info.version, kind);
    plan.push({ name: info.name, from: info.version, to: next, kind });
    console.log(
      `    ${info.name.padEnd(16)} ${info.version.padEnd(12)} ${kind.padEnd(10)} ${next.padEnd(12)} ${isPrivate ? '不发（private）' : '✅ 发布'}`,
    );
  }
  console.log();
  console.log(`    共 ${plan.length} 个包的版本需要更新，其中真正会被 publish 的是非 private 的那些。`);
  console.log();
  console.log('  这套机制的几个关键设计（对应 changesets 的真实行为）：');
  console.log('    · **变更意图由人在 PR 里写**，工具只负责算数 —— 比"从 commit message 猜"更可靠；');
  console.log('    · 传播规则可以配置（默认是 patch），也能用 fixed/linked 组强制一组包同版本；');
  console.log('    · 发布时会自动把子包之间依赖的版本范围改写成新版本，并一起发出去；');
  console.log('    · pre-release 模式（`changeset pre enter beta`）让整组包同时进 beta 通道，');
  console.log('      发完再退出，这与 09_publishing_packages.js 讲的 dist-tag 是配套的。');
  console.log();

  // -------------------------------------------------------------------------
  // 10. 陷阱与清单
  // -------------------------------------------------------------------------
  console.log('--- 10. monorepo 常见陷阱清单 ---');
  console.log();
  const pitfalls = [
    ['幽灵依赖', 'import 了没声明的包，靠提升活着；发布后必崩。用 lint 规则拦'],
    ['版本漂移', '子包各装一份 eslint/ts，CI 与本地行为不一致。工具只在根声明'],
    ['软链失效', '子包依赖写 ^1.0.0，本地包升到 2.0.0 → 装到 registry 上的旧版'],
    ['循环依赖', 'install 不报错，构建顺序排不出来。抽出更底层的公共包来打断'],
    ['全量构建', '改一个包跑所有包的 CI，10 分钟变 40 分钟。用拓扑序 + 输入哈希缓存'],
    ['锁文件冲突', 'monorepo 只有一份锁文件，多人同时改依赖时冲突频繁。约定"改依赖单独提 PR"'],
    ['误发布', '根 package.json 忘了 private: true，被谁 publish 出去就麻烦了（见 09）'],
    ['依赖重复', '同一个库装了两三个版本，打进产物里体积翻倍。用 npm ls <pkg> 排查'],
  ];
  for (const [name, note] of pitfalls) console.log(`    ${name.padEnd(12)} ${note}`);
  console.log();
  console.log('  最后总结成一句：');
  console.log('    monorepo 用"目录约定 + 软链接 + 提升"换来了跨包改动的原子性，');
  console.log('    代价是**依赖关系从"显式声明"变成了"安装器算出来的结果"**。');
  console.log('    所以这个文件里最重要的不是那些命令，而是第 4、5 节那两段自己写的解析逻辑——');
  console.log('    看懂它们，就知道 npm 到底把你的包摆在了哪里、为什么你的 import 能跑。');
  console.log();
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
  console.log('--- 清理 ---');
  console.log(`已删除临时目录：${tmpRoot}`);
  console.log(`（它还在吗？ ${fs.existsSync(tmpRoot) ? '在（清理失败）' : '不在了 ✅'}）`);
}
