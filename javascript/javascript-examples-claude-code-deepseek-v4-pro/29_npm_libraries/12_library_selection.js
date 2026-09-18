/**
 * ============================================================================
 * 知识点：如何选择第三方库 —— 包体积、维护状态、类型支持、许可证
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】进阶
 * 【前置知识】29_npm_libraries 目录下前面 11 个文件（本文件会对它们做横向对比）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    引入一个第三方库是一个**长期的技术决策**，不是一次 `npm install` 那么简单。
 *    一旦引入，你就承担了它的：安装体积、更新成本、安全漏洞、许可证义务、
 *    以及"它哪天不维护了"的风险。
 *    所以选型要有一套可复用的评估清单：
 *
 *      (a) 体积：直接体积（压缩后）+ 传递依赖数量 + 是否支持 tree-shaking
 *      (b) 维护状态：最近发布时间、提交频率、issue 响应、是否有多个维护者
 *      (c) 类型支持：是否自带 TypeScript 类型、还是需要 @types/*
 *      (d) 许可证：MIT/ISC/Apache-2.0 通常安全；GPL/AGPL 有传染性，商业项目要警惕
 *      (e) 安全性：是否有已知 CVE、是否有 npm audit 能发现的漏洞
 *      (f) 可替代性：原生 API 能否替代？换库的迁移成本有多大？
 *      (g) 生态与文档：文档质量、示例数量、社区问答的丰富程度
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    真实项目里"库选错"的代价非常高：
 *      - 引入一个 200KB 的库只为了用其中一个函数，首屏时间白白多几百毫秒；
 *      - 用了一个半年没更新的库，遇到 Node 新版本不兼容只能自己 fork；
 *      - 引入 GPL 库导致整个商业产品被要求开源（这是法律风险，不是技术问题）；
 *      - 依赖链里某个深层依赖爆出 CVE，全公司连夜升级。
 *    本文件用**本仓库真实安装的依赖**做实测，给出可复用的评估方法。
 *
 * 3. 核心语法要点（评估时实际会用的命令/工具）
 *    npm ls <pkg>                 查看依赖树
 *    npm view <pkg>               查看包信息（版本、许可证、仓库、发布时间）
 *    npm outdated                 查看哪些依赖有新版本
 *    npm audit                    检查已知漏洞
 *    npx depcheck                 找出未使用的依赖
 *    npx license-checker          列出全部依赖的许可证，用于合规审查
 *    npx size-limit / bundlephobia 估算打包后体积
 *    npx npm-check-updates        批量升级依赖版本
 *    本文件用 node:fs 直接读取 node_modules 里的 package.json 来完成同样的分析，
 *    这样既离线、又透明，你能看清"评估"背后的原始数据是什么。
 *
 * 4. 常见陷阱
 *    - 只看"包本身"的体积，忽略传递依赖：一个 5KB 的包可能拖进 40 个依赖。
 *    - 用 GitHub star 数当质量指标：star 多不代表维护活跃，
 *      更可靠的是"最近一次发布距今多久"和"issue 平均关闭时间"。
 *    - 忽略许可证：MIT 与 Apache-2.0 都宽松，但 Apache-2.0 附带专利授权条款；
 *      GPL/AGPL/SSPL 对商业闭源产品是红线。
 *    - 过度依赖：能用 10 行原生代码解决的，不要引入一个库。
 *      但反过来说，"自己写"也要算成本：写错了、要维护、要写测试。
 *    - 依赖版本用 `"*"` 或过宽的 caret 范围：某天自动升级到不兼容的版本，
 *      构建莫名其妙就挂了。生产项目应提交 package-lock.json 并锁死。
 *    - 不考虑替换成本：如果一个库只在一个文件里用了 3 个函数，
 *      自己包一层薄封装（adapter），未来换库只改一个文件。
 *    - 忽略 Node 版本要求（engines 字段）：本地能跑但 CI 上不行。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/12_library_selection.js
 *   （本文件只读取本地 node_modules 与 package.json，不访问外网，退出码 0）
 *
 * 【预期输出】
 *   打印本仓库依赖的真实评估数据：版本、许可证、直接依赖数、传递依赖闭包、
 *   安装体积、类型支持情况，然后给出一个可复用的评分与决策框架。退出码 0。
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

// 仓库根目录：本文件位于 <root>/29_npm_libraries/，所以往上两级
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NODE_MODULES = path.join(ROOT, 'node_modules');

console.log('--- 0. 评估方法说明 ---');
console.log('  本文件不联网，直接读取本地 node_modules 里的真实数据来完成评估。');
console.log('  每项指标对应的"真实世界工具"如下：');
console.log('    版本/许可证/依赖声明  -> node_modules/<pkg>/package.json');
console.log('    传递依赖闭包          -> 递归解析 dependencies（对应 npm ls）');
console.log('    安装体积              -> 递归统计目录字节数（对应 du / bundlephobia）');
console.log('    类型支持              -> 是否存在 .d.ts 文件或 types 字段');
console.log('');

// ===========================================================================
// 第 1 部分：工具函数
// ===========================================================================

/**
 * 安全地读取一个包的 package.json。
 * @param {string} pkgName 包名（如 lodash，或 @scope/name）
 * @returns {object | null}
 */
function readPackageJson(pkgName) {
  try {
    const file = path.join(NODE_MODULES, ...pkgName.split('/'), 'package.json');
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * 统计一个目录的总字节数与文件数（用于估算安装体积）。
 * 会跳过 .bin / .cache 等非代码目录，避免把无关内容算进来。
 * @param {string} dir
 * @returns {{bytes: number, files: number}}
 */
function measureDir(dir, visited = new Set()) {
  // 用 realpath 防止符号链接造成无限递归
  let real;
  try {
    real = fs.realpathSync(dir);
  } catch {
    return { bytes: 0, files: 0 };
  }
  if (visited.has(real)) return { bytes: 0, files: 0 };
  visited.add(real);

  let bytes = 0;
  let files = 0;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return { bytes: 0, files: 0 };
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = measureDir(full, visited);
      bytes += sub.bytes;
      files += sub.files;
    } else if (entry.isFile()) {
      try {
        bytes += fs.statSync(full).size;
        files += 1;
      } catch {
        // 单个文件读取失败（权限/竞态）时忽略，不影响整体评估
      }
    }
  }
  return { bytes, files };
}

/**
 * 计算一个包的传递依赖闭包（只算 dependencies，不含 devDependencies）。
 * @param {string} pkgName
 * @returns {Set<string>} 包含自己的所有依赖包名
 */
function resolveClosure(pkgName) {
  const closure = new Set();
  const queue = [pkgName];
  while (queue.length > 0) {
    const current = queue.shift();
    if (closure.has(current)) continue;
    const pkg = readPackageJson(current);
    if (!pkg) continue;
    closure.add(current);
    for (const dep of Object.keys(pkg.dependencies ?? {})) {
      // 只处理"顶层扁平安装"能找到的依赖；npm 的去重会让部分依赖被提升到顶层
      if (!closure.has(dep)) queue.push(dep);
    }
  }
  return closure;
}

/** 把字节数格式化成人类可读的形式 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * 判断一个包是否自带 TypeScript 类型。
 * 三种情况：
 *   (1) package.json 里有 types / typings 字段 -> 自带；
 *   (2) 目录里有 index.d.ts -> 自带；
 *   (3) 仓库里安装了 @types/<pkg> -> 社区维护的类型包。
 * @param {string} pkgName
 * @param {object} pkg
 */
function checkTypes(pkgName, pkg) {
  if (pkg.types || pkg.typings) return { hasTypes: true, via: pkg.types ?? pkg.typings };
  // 有些包把 d.ts 放在 exports 里，简化处理：检查常见入口文件是否存在
  const candidates = ['index.d.ts', 'dist/index.d.ts', `${pkg.main?.replace(/\.js$/, '.d.ts') ?? ''}`].filter(Boolean);
  for (const candidate of candidates) {
    const full = path.join(NODE_MODULES, ...pkgName.split('/'), candidate);
    if (fs.existsSync(full)) return { hasTypes: true, via: candidate };
  }
  // 社区类型包：@types/<name>（去 scope 前缀）
  const typesName = `@types/${pkgName.replace(/^@[^/]+\//, '')}`;
  if (fs.existsSync(path.join(NODE_MODULES, ...typesName.split('/')))) {
    return { hasTypes: true, via: `${typesName}（社区维护）`, separate: true };
  }
  return { hasTypes: false, via: null };
}

/** 许可证风险分级 */
function licenseRisk(license) {
  const normalized = String(license ?? 'UNKNOWN').toUpperCase();
  if (normalized === 'UNKNOWN') return { level: '未知', note: '无法判断，必须人工确认（可能是法律风险）' };
  // 宽松许可证：可自由用于闭源商业项目
  if (['MIT', 'ISC', 'BSD-2-CLAUSE', 'BSD-3-CLAUSE', '0BSD', 'APACHE-2.0', 'UNLICENSE', 'CC0-1.0'].includes(normalized)) {
    return { level: '宽松', note: '可用于闭源商业项目' };
  }
  // 弱 copyleft：动态链接/独立模块通常可用，但要注意修改库本身时的义务
  if (['LGPL-3.0', 'LGPL-2.1', 'MPL-2.0', 'EPL-2.0'].includes(normalized)) {
    return { level: '弱 copyleft', note: '修改库本身可能触发开源义务，需法务确认' };
  }
  // 强 copyleft：传染性强，闭源产品通常不能用
  if (['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'SSPL', 'BUSL-1.1', 'CC-BY-NC-4.0'].includes(normalized)) {
    return { level: '强 copyleft / 限制性', note: '闭源商业项目通常不可用，属红线' };
  }
  return { level: '其他', note: '不在常见白名单里，需人工审查' };
}

// ===========================================================================
// 第 2 部分：读取本仓库的全部依赖并评估
// ===========================================================================

const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const productionDeps = Object.keys(rootPkg.dependencies ?? {});
const devDeps = Object.keys(rootPkg.devDependencies ?? {});

console.log('--- 1. 本仓库的依赖清单 ---');
console.log(`  生产依赖（dependencies）    ${productionDeps.length} 个：${productionDeps.join(', ')}`);
console.log(`  开发依赖（devDependencies） ${devDeps.length} 个：${devDeps.join(', ')}`);
console.log('');
console.log('  为什么要区分这两类：');
console.log('    dependencies    会被安装到生产环境（npm install --production 会装它们）；');
console.log('    devDependencies 只在开发/构建时需要（测试框架、构建工具、类型定义）。');
console.log('    把只需要在开发时用的包放进 dependencies，会让生产镜像白白变大。');
console.log('');

/**
 * 评估单个库。
 * @param {string} name
 */
function evaluate(name) {
  const pkg = readPackageJson(name);
  if (!pkg) {
    return { name, missing: true };
  }

  // 传递依赖闭包（含自己）
  const closure = resolveClosure(name);
  // 安装体积：把闭包里所有包的目录大小加起来 —— 这是"用户装上它要多花多少磁盘"
  let totalBytes = 0;
  let ownBytes = 0;
  for (const dep of closure) {
    const size = measureDir(path.join(NODE_MODULES, ...dep.split('/')));
    totalBytes += size.bytes;
    if (dep === name) ownBytes = size.bytes;
  }

  const types = checkTypes(name, pkg);

  return {
    name,
    missing: false,
    version: pkg.version,
    license: pkg.license ?? (Array.isArray(pkg.licenses) ? pkg.licenses.map((l) => l.type).join(' / ') : 'UNKNOWN'),
    description: (pkg.description ?? '').split('\n')[0].slice(0, 60),
    directDeps: Object.keys(pkg.dependencies ?? {}).length,
    closureSize: closure.size,
    ownBytes,
    totalBytes,
    types,
    engines: pkg.engines?.node ?? '(未声明)',
    hasEsm: Boolean(pkg.module || pkg.exports),
    // 声明了 sideEffects: false 的包才能被 tree-shaking 安全地剔除未使用代码
    treeShakable: pkg.sideEffects === false || typeof pkg.exports === 'object',
  };
}

console.log('--- 2. 逐个评估（数据来自本地 node_modules 的真实文件）---');
const evaluations = productionDeps.map(evaluate);

// 打印每个库的详细信息
for (const info of evaluations) {
  if (info.missing) {
    console.log(`  ${info.name}：未安装（node_modules 里找不到）`);
    continue;
  }
  const risk = licenseRisk(info.license);
  console.log(`  ── ${info.name}@${info.version}`);
  console.log(`     说明        ${info.description}`);
  console.log(`     许可证      ${info.license}（风险等级：${risk.level} —— ${risk.note}）`);
  console.log(`     直接依赖    ${info.directDeps} 个；传递依赖闭包共 ${info.closureSize} 个包`);
  console.log(`     自身体积    ${formatBytes(info.ownBytes)}；含依赖合计 ${formatBytes(info.totalBytes)}`);
  console.log(`     TypeScript  ${info.types.hasTypes ? `自带（${info.types.via}）` : '无（需要 @types 或自己声明）'}`);
  console.log(`     ESM/exports ${info.hasEsm ? '支持' : '不支持（CommonJS）'}；tree-shaking ${info.treeShakable ? '友好' : '不友好'}`);
  console.log(`     Node 要求   ${info.engines}`);
}
console.log('');

// ===========================================================================
// 第 3 部分：对比表
// ===========================================================================

console.log('--- 3. 横向对比表 ---');
console.log('  让"体积"这个抽象概念变成可比较的数字。');
console.log('');

const header = ['库', '版本', '许可证', '直接依赖', '闭包', '自身体积', '含依赖', 'TS类型'];
// 终端里中文与英文字符宽度不同，这里用固定宽度拼接，保证表头与数据行对齐
const widths = [18, 10, 15, 10, 8, 12, 12, 12];

/** 按显示宽度（中文算 2）补齐空格 */
function padDisplay(text, width) {
  const str = String(text);
  // 用一个粗略的宽度估算：码点大于 0x2E80 的字符按 2 个宽度计算
  let displayWidth = 0;
  for (const ch of str) displayWidth += ch.codePointAt(0) > 0x2e80 ? 2 : 1;
  return str + ' '.repeat(Math.max(0, width - displayWidth));
}

console.log(`  ${header.map((h, i) => padDisplay(h, widths[i])).join('')}`);
console.log(`  ${'-'.repeat(widths.reduce((a, b) => a + b, 0))}`);
for (const info of evaluations) {
  if (info.missing) continue;
  const cells = [
    info.name,
    info.version,
    info.license,
    String(info.directDeps),
    String(info.closureSize),
    formatBytes(info.ownBytes),
    formatBytes(info.totalBytes),
    info.types.hasTypes ? (info.types.separate ? '@types' : '自带') : '无',
  ];
  console.log(`  ${cells.map((c, i) => padDisplay(c, widths[i])).join('')}`);
}
console.log('');

// 找出对比中的"极值"，这些是最有信息量的结论
const installed = evaluations.filter((e) => !e.missing);
const heaviest = [...installed].sort((a, b) => b.totalBytes - a.totalBytes)[0];
const lightest = [...installed].sort((a, b) => a.totalBytes - b.totalBytes)[0];
const mostDeps = [...installed].sort((a, b) => b.closureSize - a.closureSize)[0];

console.log('  关键发现：');
console.log(`    体积最大（含依赖）：${heaviest.name} —— ${formatBytes(heaviest.totalBytes)}，闭包 ${heaviest.closureSize} 个包`);
console.log(`    体积最小（含依赖）：${lightest.name} —— ${formatBytes(lightest.totalBytes)}，闭包 ${lightest.closureSize} 个包`);
console.log(`    依赖最多：${mostDeps.name} —— 会带进 ${mostDeps.closureSize} 个包`);
console.log(`    体积相差 ${(heaviest.totalBytes / Math.max(lightest.totalBytes, 1)).toFixed(1)} 倍 —— 这就是选型时"随手引入"的代价。`);
console.log('');
console.log('  注意：这里的体积是"磁盘安装体积"，不等于"打进前端产物的体积"。');
console.log('        前端项目应当用 bundlephobia / size-limit 看 gzip 后的实际影响。');
console.log('        后端项目更关心安装体积（影响 Docker 镜像大小与 CI 的安装耗时）。');
console.log('');

// ===========================================================================
// 第 4 部分：决策框架
// ===========================================================================

console.log('--- 4. 一个可复用的选型决策流程 ---');
console.log('');
console.log('  第 1 步：先问"能不能不引入"');
console.log('    - 原生 API 是否够用？（fetch / structuredClone / Object.groupBy / Intl）');
console.log('    - 自己写要多少行？超过 50 行且边界多，才考虑引入。');
console.log('    - 一次性脚本就别引库了，手写更省事。');
console.log('');
console.log('  第 2 步：体积评估');
console.log('    - 前端：看 gzip 后体积（bundlephobia），并确认是否支持 tree-shaking；');
console.log('    - 后端：看安装体积与传递依赖数（本文件上面的表就是这套方法）；');
console.log('    - 经验值：单功能库超过 30KB gzip 就要谨慎；核心框架超过 100KB 要权衡。');
console.log('');
console.log('  第 3 步：维护状态评估');
console.log('    - 最近一次发布距今多久？超过 1 年未更新要警惕（不是绝对的否决项）；');
console.log('    - 有没有多个活跃维护者？（单点依赖一个人的项目风险高）');
console.log('    - 是否支持当前 LTS 的 Node 版本？看 engines 字段与 CI 配置；');
console.log('    - issue 区是否有大量长期未回复的严重问题？');
console.log('');
console.log('  第 4 步：类型支持');
console.log('    - 自带 .d.ts 最好；@types/xxx 次之（版本可能滞后）；');
console.log('    - 完全没有类型且没有 @types 的库，在 TS 项目里使用成本很高。');
console.log('');
console.log('  第 5 步：许可证与安全');
console.log('    - MIT / ISC / Apache-2.0 / BSD -> 安全；');
console.log('    - LGPL / MPL -> 谨慎，需法务确认；');
console.log('    - GPL / AGPL / SSPL -> 闭源商业项目红线；');
console.log('    - 跑 `npm audit` 与 Dependabot，建立漏洞响应流程。');
console.log('');
console.log('  第 6 步：可替换性设计');
console.log('    - 用一个薄封装（adapter）把第三方库隔离在单个文件里，');
console.log('      例如把 axios 包装成 lib/http.js，将来换 fetch 只需改一处；');
console.log('    - 不要在整个代码库里到处直接 import 第三方库的内部结构。');
console.log('');

// ===========================================================================
// 第 5 部分：结合本仓库用过的库做具体分析
// ===========================================================================

console.log('--- 5. 本仓库用过的库：逐个场景分析 ---');

/** 每个库的选型点评 */
const reviews = [
  {
    name: 'lodash',
    verdict: '谨慎引入',
    reason: '功能极全，但整体引入会显著增大产物。',
    advice: '优先用原生（Object.groupBy / structuredClone / 可选链）；确实需要时用 lodash-es 并按需导入，只把用到的函数打进产物。',
  },
  {
    name: 'dayjs',
    verdict: '推荐',
    reason: '核心仅约 2KB gzip，API 与 Moment 兼容，迁移成本极低。',
    advice: '注意插件路径要写 .js 后缀；纯格式化场景可以先用原生 Intl。',
  },
  {
    name: 'axios',
    verdict: '按需',
    reason: '拦截器、超时、进度、取消等能力比 fetch 完整。',
    advice: '只发几个请求的项目用 fetch 即可；一旦需要统一鉴权头与错误处理，axios 的收益就很明显。',
  },
  {
    name: 'zod',
    verdict: '强烈推荐',
    reason: '运行时校验 + 编译期类型同源，是"边界校验"的性价比之王。',
    advice: '适合用在系统边界（接口响应、环境变量、表单）；schema 定义放模块顶层以复用。',
  },
  {
    name: 'uuid',
    verdict: '按需',
    reason: 'v4 已经有原生替代（crypto.randomUUID），但 v7 是原生没有的。',
    advice: '只用 v4 就用原生；要做数据库主键并希望写入有序，就用它的 v7。',
  },
  {
    name: 'chalk',
    verdict: '可被替代',
    reason: '功能完善但体积比同类大；Node 也内置了 util.styleText。',
    advice: '对体积敏感的 CLI 可以换 picocolors（约 1KB）；只要基础着色可以用原生。',
  },
  {
    name: 'commander',
    verdict: '推荐',
    reason: '子命令 + 自动 help + 参数校验，是 Node CLI 的事实标准，生态最成熟。',
    advice: '只是解析几个 flag 时用原生 util.parseArgs 就够了，不必引入。',
  },
  {
    name: 'dotenv',
    verdict: '按需',
    reason: 'Node 20.6+ 已内置 --env-file，纯加载场景可以零依赖。',
    advice: '需要多环境文件叠加、变量展开、与 npm scripts 集成时，dotenv 生态（dotenv-expand / dotenv-cli）仍有优势。',
  },
  {
    name: 'express',
    verdict: '推荐（但要看场景）',
    reason: '最成熟、中间件生态最庞大，团队熟悉度普遍高。',
    advice: 'express 4 不自动捕获 async 错误（需自己包装）；对性能极致敏感或只用极简功能时，可考虑 fastify / 原生 http。',
  },
];

// 用评估数据补充"它带来了多少依赖"这一客观事实
for (const review of reviews) {
  const info = installed.find((e) => e.name === review.name);
  const dependencyFact = info ? `闭包 ${info.closureSize} 个包 / 合计 ${formatBytes(info.totalBytes)}` : '（未安装，无法统计）';
  console.log(`  ── ${review.name}：${review.verdict}`);
  console.log(`     理由      ${review.reason}`);
  console.log(`     建议      ${review.advice}`);
  console.log(`     实测数据  ${dependencyFact}`);
}
console.log('');

// ===========================================================================
// 第 6 部分：团队实践
// ===========================================================================

console.log('--- 6. 团队层面的依赖治理 ---');
console.log('  1. 引入新依赖需要评审：说清楚"为什么不能用原生/已有库解决"；');
console.log('  2. 提交 package-lock.json，CI 用 npm ci 安装（保证构建可复现）；');
console.log('  3. 定期跑 npm audit、npm outdated、depcheck，纳入例行维护；');
console.log('  4. 用 license-checker 做合规扫描，把 GPL 类许可证挡在门外；');
console.log('  5. 对体积敏感的产物（前端主包、CLI 工具）设置体积预算（size-limit）；');
console.log('  6. 依赖升级按"补丁 -> 次版本 -> 主版本"分批进行，别攒到一次性大升级；');
console.log('  7. 用 Dependabot / Renovate 自动提 PR，但要有人真的看和合并。');
console.log('');

console.log('--- 7. 一张速查卡 ---');
console.log('  场景                          建议');
console.log('  ' + '-'.repeat(70));
console.log('  需要 HTTP 客户端              fetch（够用）/ axios（要拦截器与进度）');
console.log('  需要日期处理                  dayjs（要插件）或原生 Intl（只做格式化）');
console.log('  需要数据校验                  到处都要校验 -> zod；只在表单 -> 手写或 yup');
console.log('  需要唯一 ID                   只需要 v4 -> crypto.randomUUID；主键 -> uuid.v7');
console.log('  需要终端着色                  轻量 -> picocolors；功能全 -> chalk');
console.log('  需要 CLI 框架                 有子命令 -> commander；只有 flag -> util.parseArgs');
console.log('  需要读环境变量                简单 -> node --env-file；复杂 -> dotenv 生态');
console.log('  需要 Web 框架                 express（生态）/ fastify（性能）/ 原生 http（极简）');
console.log('  需要 lodash 的某个函数         先查原生有没有；没有就用 lodash-es 按需导入');
console.log('');

// ===========================================================================
// 自测断言
// ===========================================================================
console.log('--- 8. 自测断言 ---');

assert.ok(productionDeps.length >= 8, '本仓库应至少声明 8 个生产依赖');
assert.ok(installed.length === productionDeps.length, '所有生产依赖都应已安装（node_modules 完整）');

// 每个库都应能读出关键元数据
for (const info of installed) {
  assert.ok(typeof info.version === 'string' && info.version.length > 0, `${info.name} 应有版本号`);
  assert.ok(info.closureSize >= 1, `${info.name} 的闭包至少包含自己`);
  assert.ok(info.ownBytes > 0, `${info.name} 应有非零的安装体积`);
}

// 许可证检查：本仓库不应出现强 copyleft 的依赖
for (const info of installed) {
  const risk = licenseRisk(info.license);
  assert.notStrictEqual(
    risk.level,
    '强 copyleft / 限制性',
    `${info.name} 的许可证 ${info.license} 属于限制性许可证，不应出现在本仓库`,
  );
  assert.notStrictEqual(risk.level, '未知', `${info.name} 的许可证无法识别，需要人工确认`);
}

// 工具函数本身也要正确
assert.strictEqual(formatBytes(512), '512 B');
assert.strictEqual(formatBytes(2048), '2.0 KB');
assert.strictEqual(formatBytes(2 * 1024 * 1024), '2.00 MB');
assert.strictEqual(licenseRisk('MIT').level, '宽松');
assert.strictEqual(licenseRisk('ISC').level, '宽松');
assert.strictEqual(licenseRisk('Apache-2.0').level, '宽松');
assert.strictEqual(licenseRisk('GPL-3.0').level, '强 copyleft / 限制性');
assert.strictEqual(licenseRisk('AGPL-3.0').level, '强 copyleft / 限制性');
assert.strictEqual(licenseRisk(undefined).level, '未知');
assert.strictEqual(padDisplay('abc', 6), 'abc   ');
// 中文字符按 2 个宽度计算，保证终端表格对齐
assert.strictEqual(padDisplay('中文', 6), '中文  ');

// 敏感结论：闭包大小与体积的关系应当合理（含依赖 >= 自身）
for (const info of installed) {
  assert.ok(info.totalBytes >= info.ownBytes, `${info.name} 的含依赖体积不应小于自身体积`);
}

console.log(`  全部断言通过（共评估 ${installed.length} 个生产依赖）。`);
console.log('');

// 顺便算一个汇总数字，作为"这个仓库的依赖成本"
const grandTotal = installed.reduce((sum, info) => sum + info.ownBytes, 0);
const grandTotalWithDeps = installed.reduce((sum, info) => sum + info.totalBytes, 0);
console.log('--- 9. 本仓库的依赖成本汇总 ---');
console.log(`  各库自身体积之和：        ${formatBytes(grandTotal)}`);
console.log(`  各库含传递依赖之和：      ${formatBytes(grandTotalWithDeps)}（有重叠计数，仅作量级参考）`);
console.log(`  平均每个库带进依赖包数：  ${(installed.reduce((s, i) => s + i.closureSize, 0) / installed.length).toFixed(1)} 个`);
console.log('');
console.log('  记住一句话：每引入一个依赖，你得到的是一份功能，');
console.log('  承担的是一份长期的维护、安全与合规责任。');
console.log('');
console.log('演示结束。');
