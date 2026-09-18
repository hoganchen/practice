/**
 * 文档数字校验脚本
 * ----------------------------------------------------------------------------
 * 校验 README.md 里**手写**的统计数字是否与仓库实际状态一致。
 *
 * 【为什么需要这个脚本】
 *   仓库里的统计数字分两类，可信度完全不同：
 *     · 生成物里的数字 —— INDEX.md / GLOSSARY.md 由脚本生成，不会错，
 *       而且有 gen-index --check / glossary:check 兜底；
 *     · README 里的数字 —— 全是**手写**的，没有任何东西保证它们不过期。
 *   第二类的危险在于：过期之后**不会有任何报错**，只是安静地变成错的。
 *   本仓库真实发生过三次漂移，都是靠人肉比对才发现的：
 *     · 「辅助模块 18 个」          —— 实际 17
 *     · 「27_web_apis 里 14 个 html」—— 实际 18
 *     · 「三个文档共 3451 个链接」   —— 实际 3497
 *   所以把这些数字逐个和实际值比对，让漂移在 `npm run check:counts` 当场暴露，
 *   而不是等读者发现「README 说的对不上」。
 *
 * 【统计口径】必须与 gen-index.js / run-all.js 保持一致：
 *   · 只统计「两位数字开头」的目录（00_hello_world ~ 40_...），且不递归子目录
 *   · 只统计 .js / .cjs / .html 三种扩展名
 *   · 文件名以 _ 开头的算辅助模块，单独计数，不计入「可运行示例」
 *   改动这三条中的任何一条，三个脚本要一起改。
 *
 * 【维护提醒】
 *   下面的 RULES 是「README 里写了什么数字」的声明式清单。如果你改写了 README
 *   里某句带数字的话、让正则匹配不到了，本脚本会报「校验规则失效」而不是默默放过
 *   —— 空转的校验比没有校验更危险。这时请同步更新对应的 pattern。
 *
 * 【用法】
 *   node scripts/check-counts.js     校验 README.md，失败时退出码 1
 *   npm run check:counts
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectLinks } from './_lib/md-links.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const README = path.join(ROOT, 'README.md');
const GLOSSARY = path.join(ROOT, 'GLOSSARY.md');
// 链接总数的口径：README 里那句「三个文档共 N 个链接」指的是这三个
const LINK_DOCS = ['README.md', 'INDEX.md', 'GLOSSARY.md'];

// 与 gen-index.js / run-all.js 保持一致的扫描范围
const SKIP_DIRS = new Set(['node_modules', '.git', '.vscode', 'coverage', 'scripts']);
const DIR_RE = /^\d{2}_/;
const FILE_RE = /\.(js|cjs|html)$/;

/** 扫描仓库，得出各项实际数量 */
async function scan() {
  const entries = await readdir(ROOT, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name) && DIR_RE.test(e.name))
    .map((e) => e.name)
    .sort();

  let examples = 0;
  let html = 0;
  let helpers = 0;
  const htmlPerDir = new Map();

  for (const dir of dirs) {
    const files = (await readdir(path.join(ROOT, dir))).filter((f) => FILE_RE.test(f));
    let dirHtml = 0;
    for (const f of files) {
      if (f.startsWith('_')) {
        helpers++;
      } else if (f.endsWith('.html')) {
        html++;
        dirHtml++;
      } else {
        examples++;
      }
    }
    htmlPerDir.set(dir, dirHtml);
  }

  return { dirs: dirs.length, examples, html, helpers, htmlPerDir };
}

/**
 * 统计三个文档的链接总数。
 * 复用 check-docs.js 的解析规则（scripts/_lib/md-links.js），
 * 避免出现「check:docs 说 3497、check:counts 说 3501」这种自相矛盾。
 */
async function countDocLinks() {
  let total = 0;
  for (const name of LINK_DOCS) {
    const md = await readFile(path.join(ROOT, name), 'utf8');
    total += collectLinks(md).length;
  }
  return total;
}

/**
 * 读取 GLOSSARY.md 里它自己声明的「N 个领域、M 条术语」。
 * GLOSSARY.md 是生成物，且 glossary:check 保证它与分册同步，所以这里可以直接采信。
 */
async function readGlossaryStats() {
  const md = await readFile(GLOSSARY, 'utf8');
  const m = md.match(/共 (\d+) 个领域、(\d+) 条术语/);
  return m ? { domains: Number(m[1]), terms: Number(m[2]) } : null;
}

/**
 * 声明「README 里写了什么数字、应该等于什么」。
 *   · pattern 必须有捕获组，组里捕获的就是被校验的数字，全部组都要满足 expect
 *   · expect 为数字时要求精确相等
 *   · expect 为 { max } 时要求「文档里写的数字 <= max」—— 用于 "1100+" 这类
 *     下限写法：文档宣称的是一个下限，只要实际值不低于它就成立，
 *     所以判据是「写死的下限不得超过实际值」
 */
function buildRules(actual) {
  const { dirs, examples, html, helpers, htmlPerDir, links, glossary } = actual;
  const htmlInWebApis = htmlPerDir.get('27_web_apis');

  return [
    {
      what: '可运行示例数（"全部 N 个示例"）',
      pattern: /全部 (\d+) 个(?:Node\.js )?示例/g,
      expect: examples,
    },
    {
      what: '可运行示例数（批量校验的输出示例）',
      pattern: /开始校验 (\d+) 个示例/g,
      expect: examples,
    },
    {
      what: '可运行示例数（批量校验的通过数）',
      pattern: /通过 (\d+) \/ (\d+)，失败/g,
      expect: examples,
    },
    {
      what: '可运行示例数（检查总表第 1 行）',
      pattern: /(\d+) 个示例是否都能正常运行/g,
      expect: examples,
    },
    {
      what: '可运行示例数（示例统计表）',
      pattern: /\| Node\.js 可运行示例[^|]*\| (\d+) 个 \|/g,
      expect: examples,
    },
    {
      what: '浏览器示例数（检查总表第 2 行）',
      pattern: /(\d+) 个 `\.html` 的内联脚本语法/g,
      expect: html,
    },
    {
      what: '浏览器示例数（示例统计表）',
      pattern: /\| 浏览器示例[^|]*\| (\d+) 个 \|/g,
      expect: html,
    },
    {
      what: '辅助模块数（示例统计表）',
      pattern: /\| 被导入的辅助模块[^|]*\| (\d+) 个 \|/g,
      expect: helpers,
    },
    {
      what: '知识点目录数（示例统计表）',
      pattern: /\| 知识点目录 \| (\d+) 个/g,
      expect: dirs,
    },
    {
      what: '知识点目录数（"N 个目录中的"）',
      pattern: /(\d+) 个目录中的/g,
      expect: dirs,
    },
    {
      what: '27_web_apis 里的浏览器示例数',
      pattern: /`27_web_apis\/`（(\d+) 个）/g,
      expect: htmlInWebApis,
    },
    {
      what: '文档链接总数（三个文档）',
      pattern: /共 (\d+) 个链接/g,
      expect: links,
    },
    {
      what: '术语表领域数',
      pattern: /按 (\d+) 个领域分组/g,
      expect: glossary ? glossary.domains : 0,
    },
    {
      // README 写的是 "1100+ 条"：宣称的是下限，所以判据是「这个下限 <= 实际条数」，
      // 实际条数只许多、不许少。
      what: '术语表条数下限（"1100+"）',
      pattern: /(\d+)\+ 条 JavaScript 术语/g,
      expect: { max: glossary ? glossary.terms : 0 },
    },
  ];
}

/** 从匹配位置倒推出行号（1 起始），用于把问题定位到具体行 */
function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

function describe(expect) {
  return typeof expect === 'object' ? `不得超过 ${expect.max}` : String(expect);
}

function meets(value, expect) {
  return typeof expect === 'object' ? value <= expect.max : value === expect;
}

async function main() {
  const readme = await readFile(README, 'utf8');
  const scanResult = await scan();
  const actual = {
    ...scanResult,
    links: await countDocLinks(),
    glossary: await readGlossaryStats(),
  };

  if (!actual.glossary) {
    console.log('  ✗ GLOSSARY.md 里找不到「共 N 个领域、M 条术语」的统计行，无法校验术语数');
    process.exitCode = 1;
    return;
  }

  const rules = buildRules(actual);
  const problems = [];
  let checked = 0;

  console.log('数字声明校验（README.md）：\n');

  for (const rule of rules) {
    const matches = [...readme.matchAll(rule.pattern)];
    const ruleProblems = [];

    // 一条规则一次都没匹配上，说明 README 那句话被改写了 —— 校验已经空转，
    // 必须报错让人来更新规则，否则这里会安静地什么都不检查。
    if (matches.length === 0) {
      ruleProblems.push('README 里已找不到这句带数字的话，校验规则已失效，请同步更新 pattern');
    }

    for (const m of matches) {
      for (let g = 1; g < m.length; g++) {
        const raw = m[g];
        if (raw === undefined) continue;
        checked++;
        const value = Number(raw);
        if (!meets(value, rule.expect)) {
          ruleProblems.push(
            `第 ${lineOf(readme, m.index)} 行：写的是 ${value}，实际是 ${describe(rule.expect)}`,
          );
        }
      }
    }

    if (ruleProblems.length === 0) {
      console.log(`  ✓ ${rule.what}`);
    } else {
      console.log(`  ✗ ${rule.what}`);
      for (const p of ruleProblems) console.log(`      ${p}`);
      problems.push(...ruleProblems);
    }
  }

  console.log('\n' + '='.repeat(72));
  if (problems.length === 0) {
    console.log(`文档数字校验通过：${checked} 处数字声明全部与实际一致`);
  } else {
    console.log(`文档数字校验失败：${checked} 处数字声明中发现 ${problems.length} 处不符`);
    console.log(
      `实际值：目录 ${actual.dirs} · 可运行示例 ${actual.examples} · 浏览器示例 ${actual.html} · ` +
        `辅助模块 ${actual.helpers} · 文档链接 ${actual.links} · ` +
        `术语 ${actual.glossary.terms}（${actual.glossary.domains} 个领域）`,
    );
    process.exitCode = 1;
  }
  console.log('='.repeat(72));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
