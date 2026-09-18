/**
 * 索引生成脚本
 * ----------------------------------------------------------------------------
 * 扫描仓库中所有示例文件，从每个文件的头部注释块里提取「知识点」与「难度等级」，
 * 生成文件级的索引 INDEX.md，便于在 400+ 个示例中快速定位。
 *
 * 用法：
 *   node scripts/gen-index.js            生成 / 覆盖 INDEX.md
 *   node scripts/gen-index.js --check    只校验 INDEX.md 是否与当前内容一致（不写文件）
 *
 * 设计说明：
 *   - 索引是**生成物**，不要手工编辑 INDEX.md；改了示例后重跑本脚本即可。
 *   - 以 _ 开头的辅助模块不作为知识点条目，但会在所属目录里列出（标注为"辅助模块"）。
 *   - .html 浏览器示例同样纳入索引（它们无法被 run-all.js 运行，但同样需要导航）。
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'INDEX.md');
const CHECK_ONLY = process.argv.includes('--check');

const SKIP_DIRS = new Set(['node_modules', '.git', '.vscode', 'coverage', 'scripts']);
const DIFFICULTY_ORDER = ['入门', '进阶', '高级'];

/** 从文件头部提取某个字段的值 */
function extractField(text, label) {
  // 头部注释块有两种字段写法，都要支持：
  //   · 「知识点：xxx」            —— 冒号形式
  //   · 「【难度等级】xxx」        —— 方括号形式
  // 允许行首有 * 或空白（块注释里每行前面有 " * "）。
  const re = new RegExp(`(?:^|\\n)[\\s*]*(?:【${label}】|${label}[:：])\\s*(.+?)\\s*(?:\\*/)?\\s*(?:\\n|$)`);
  const m = text.match(re);
  if (!m) return '';
  return m[1].replace(/\s*\*\/\s*$/, '').trim();
}

/** 读取一个示例文件的知识点元信息 */
async function readMeta(file) {
  const raw = await readFile(file, 'utf8');
  // 只在前 60 行里找头部注释块，避免正文里的同名字样误匹配
  const head = raw.split('\n').slice(0, 60).join('\n');
  return {
    knowledge: extractField(head, '知识点'),
    difficulty: extractField(head, '难度等级'),
  };
}

function escapeCell(s) {
  return (s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

async function main() {
  const entries = await readdir(ROOT, { withFileTypes: true });
  const dirs = entries
    .filter((e) => e.isDirectory() && !SKIP_DIRS.has(e.name) && /^\d{2}_/.test(e.name))
    .map((e) => e.name)
    .sort();

  const sections = [];
  let totalExamples = 0;
  let totalHtml = 0;
  let totalHelpers = 0;
  const overview = [];

  for (const dir of dirs) {
    const files = (await readdir(path.join(ROOT, dir))).filter((f) => /\.(js|cjs|html)$/.test(f)).sort();

    const examples = [];
    const helpers = [];
    const diffCount = new Map(DIFFICULTY_ORDER.map((d) => [d, 0]));

    for (const f of files) {
      if (f.startsWith('_')) {
        helpers.push(f);
        totalHelpers++;
        continue;
      }
      const meta = await readMeta(path.join(ROOT, dir, f));
      const isHtml = f.endsWith('.html');
      if (isHtml) totalHtml++;
      else totalExamples++;

      // 难度分布只统计可运行示例，与上面的「可运行示例」列保持同一口径
      if (!isHtml && diffCount.has(meta.difficulty)) {
        diffCount.set(meta.difficulty, diffCount.get(meta.difficulty) + 1);
      }
      examples.push({ file: f, ...meta, isHtml });
    }

    // 目录级说明：取该目录第一个示例的「所属分类」描述作为板块名
    let blockName = '';
    const firstJs = examples.find((e) => !e.isHtml);
    if (firstJs) {
      const raw = await readFile(path.join(ROOT, dir, firstJs.file), 'utf8');
      const head = raw.split('\n').slice(0, 60).join('\n');
      const m = head.match(/【所属分类】[^—\n]*——\s*(.+?)\s*(?:\n|\*\/)/);
      if (m) blockName = m[1].replace(/\s*\*\/\s*$/, '').trim();
    }

    const diffStr = DIFFICULTY_ORDER.filter((d) => diffCount.get(d) > 0)
      .map((d) => `${d} ${diffCount.get(d)}`)
      .join(' / ');

    // 计数口径必须与 run-all.js 一致：可运行示例只数 .js / .cjs。
    // .html 是浏览器示例、不参与 run-all，单独用 "+N🌐" 标注，
    // 否则会出现「INDEX 说 28 个、run-all 说 14 个」的口径歧义。
    const runnableCount = examples.filter((e) => !e.isHtml).length;
    const htmlCount = examples.filter((e) => e.isHtml).length;

    overview.push({
      dir,
      blockName,
      count: runnableCount,
      htmlCount,
      diffStr,
    });

    const lines = [];
    // 标题只放目录名：GitHub 的锚点会保留下划线、但会吃掉 "——" 与空格，
    // 所以标题里一旦附上中文板块名，上面的目录概览就链不过来了。
    // 板块名改放正文第一行。
    lines.push(`## ${dir}`);
    lines.push('');
    if (blockName) lines.push(`**${blockName}**`);
    lines.push('');
    {
      const runnable = examples.filter((e) => !e.isHtml).length;
      const html = examples.filter((e) => e.isHtml).length;
      const parts = [`${runnable} 个可运行示例`];
      if (html) parts.push(`${html} 个浏览器示例（🌐）`);
      if (diffStr) parts.push(`难度 ${diffStr}`);
      lines.push(parts.join(' · '));
    }
    lines.push('');
    lines.push('| 文件 | 知识点 | 难度 |');
    lines.push('| --- | --- | --- |');
    for (const e of examples) {
      const name = e.isHtml ? `${e.file} 🌐` : e.file;
      lines.push(
        `| [${name}](${encodeURI(dir)}/${encodeURI(e.file)}) | ${escapeCell(e.knowledge)} | ${escapeCell(e.difficulty)} |`,
      );
    }
    if (helpers.length) {
      lines.push('');
      lines.push(
        `<sub>辅助模块（被导入，不作为独立示例）：${helpers.map((h) => `\`${h}\``).join('、')}</sub>`,
      );
    }
    lines.push('');
    sections.push(lines.join('\n'));
  }

  const header = [
    '# 示例代码索引',
    '',
    '> ⚙️ **本文件由 `npm run index` 自动生成，请勿手工编辑。**',
    '> 增删或重命名示例后，重新运行该命令即可刷新。',
    '',
    `共 **${dirs.length}** 个知识点目录、**${totalExamples}** 个可运行示例` +
      `${totalHtml ? `、**${totalHtml}** 个浏览器示例（标 🌐）` : ''}` +
      `${totalHelpers ? `，另有 ${totalHelpers} 个辅助模块` : ''}。`,
    '',
    '每个示例文件的头部注释块都写明了「知识点 / 所属分类 / 难度等级 / 前置知识 / 知识点说明 / 运行方法 / 预期输出」，' +
      '本索引只摘录其中的「知识点」与「难度等级」两栏，**具体说明请打开文件看头部注释**。',
    '',
    '---',
    '',
    '## 目录概览',
    '',
    '「可运行示例」只计 `.js` / `.cjs`（与 `npm run check` 的口径一致）；',
    '浏览器示例（`.html`）单独标为 `+N 🌐`，它们需要浏览器、不被 `run-all.js` 执行。',
    '',
    '| 目录 | 知识板块 | 可运行示例 | 浏览器示例 | 难度分布 |',
    '| --- | --- | --- | --- | --- |',
    ...overview.map(
      // 锚点保留下划线，与上面的标题一一对应
      (o) =>
        `| [\`${o.dir}\`](#${o.dir}) | ${escapeCell(o.blockName)} | ${o.count} | ` +
        `${o.htmlCount || '—'} | ${o.diffStr} |`,
    ),
    '',
    '---',
    '',
  ].join('\n');

  const content = header + sections.join('\n---\n\n');

  if (CHECK_ONLY) {
    let current = '';
    try {
      current = await readFile(OUT, 'utf8');
    } catch {
      console.log('INDEX.md 不存在，请运行 `npm run index` 生成。');
      process.exitCode = 1;
      return;
    }
    if (current === content) {
      console.log(`INDEX.md 与当前示例一致（${dirs.length} 个目录，${totalExamples} 个示例）。`);
    } else {
      console.log('INDEX.md 已过期，请运行 `npm run index` 重新生成。');
      process.exitCode = 1;
    }
    return;
  }

  await writeFile(OUT, content, 'utf8');
  console.log(
    `已生成 INDEX.md：${dirs.length} 个目录，${totalExamples} 个可运行示例，${totalHtml} 个浏览器示例。`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
