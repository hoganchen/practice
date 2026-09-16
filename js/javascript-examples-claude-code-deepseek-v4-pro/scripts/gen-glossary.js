/**
 * 术语表合并脚本
 * ----------------------------------------------------------------------------
 * 把 .glossary_parts/ 下的分册按序号合并成一个 GLOSSARY.md，
 * 并自动生成「快速导航」目录与统计信息。
 *
 * 用法：
 *   node scripts/gen-glossary.js            合并生成 GLOSSARY.md
 *   node scripts/gen-glossary.js --check    只检查 GLOSSARY.md 是否与分册一致
 *   node scripts/gen-glossary.js --stats    只打印统计，不写文件
 *
 * 为什么要拆成多个分册再合并：
 *   术语表内容量大，拆成按领域划分的多个小文件便于并行维护与增量修订；
 *   对读者而言则只看到一个完整文档。
 *
 * 注意：GLOSSARY.md 是**生成物**，不要手工编辑 —— 改分册，然后重跑本脚本。
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PARTS_DIR = path.join(ROOT, '.glossary_parts');
const OUT = path.join(ROOT, 'GLOSSARY.md');

const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes('--check');
const STATS_ONLY = argv.includes('--stats');

/** 按 GitHub 规则生成锚点 */
function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-');
}

const HEADER_INTRO = `# JavaScript 术语表

本文件收录 JavaScript 学习中会遇到的**术语**，每个术语给出**详细中文解释**，
并尽量链到本仓库中**讲解该术语的示例文件** —— 所以它既是词典，也是一张导航图。

> ⚙️ **本文件由 \`npm run glossary\` 自动生成**（源文件在 \`.glossary_parts/\`，按领域分册）。
> 不要手工编辑；改分册后重跑命令即可。

## 怎么用这份术语表

- **当词典查**：直接在本页搜索（\`Ctrl+F\` / \`Cmd+F\`），英文术语、中文译名、缩写都能搜到。
- **当导航用**：每个术语下方的 📄 链接会带你去仓库里讲它的示例文件，跟着读一遍比看解释更有效。
- **当复习清单用**：按领域通读一遍，凡是「看着眼熟但说不清」的，就是该补的地方。

关于范围：包含语言本身（语法、类型、异步、原型……）、运行时（Node.js、浏览器）、
以及实际开发会用到的工程概念（测试、构建、性能、安全）。**不包含**框架（React/Vue）与具体业务术语。

`;

/**
 * 合并分册。
 * 返回 { content, sections, termCount }
 */
async function build() {
  let files;
  try {
    files = (await readdir(PARTS_DIR)).filter((f) => f.endsWith('.md')).sort();
  } catch {
    throw new Error(`找不到分册目录 ${PARTS_DIR}，请先创建并放入分册文件。`);
  }

  if (files.length === 0) {
    throw new Error(`${PARTS_DIR} 里没有任何 .md 分册。`);
  }

  const parts = [];
  const sections = []; // { title, anchor, terms }
  let termCount = 0;

  for (const f of files) {
    const raw = (await readFile(path.join(PARTS_DIR, f), 'utf8')).trim();
    if (!raw) continue;

    // 统计本册的 ## 小节与 ### 术语
    for (const line of raw.split('\n')) {
      const h2 = line.match(/^##\s+(.+?)\s*$/);
      if (h2) {
        sections.push({ title: h2[2] ?? h2[1], anchor: slugify(h2[1]), terms: 0 });
        continue;
      }
      const h3 = line.match(/^###\s+(.+?)\s*$/);
      if (h3) {
        termCount++;
        if (sections.length) sections[sections.length - 1].terms++;
      }
    }

    parts.push(raw);
  }

  const toc = [
    '## 快速导航',
    '',
    '| 领域 | 术语数 |',
    '| --- | --- |',
    ...sections.map((s) => `| [${s.title}](#${s.anchor}) | ${s.terms} |`),
    '',
    `**共 ${sections.length} 个领域、${termCount} 条术语。**`,
    '',
    '---',
    '',
  ].join('\n');

  const content = HEADER_INTRO + toc + parts.join('\n\n---\n\n') + '\n';
  return { content, sections, termCount, partCount: files.length };
}

async function main() {
  const { content, sections, termCount, partCount } = await build();

  if (STATS_ONLY) {
    console.log(`分册 ${partCount} 个，领域 ${sections.length} 个，术语 ${termCount} 条：`);
    for (const s of sections) console.log(`  ${String(s.terms).padStart(4)}  ${s.title}`);
    return;
  }

  if (CHECK_ONLY) {
    let current = '';
    try {
      current = await readFile(OUT, 'utf8');
    } catch {
      console.log('GLOSSARY.md 不存在，请运行 `npm run glossary` 生成。');
      process.exitCode = 1;
      return;
    }
    if (current === content) {
      console.log(`GLOSSARY.md 与分册一致（${sections.length} 个领域，${termCount} 条术语）。`);
    } else {
      console.log('GLOSSARY.md 已过期，请运行 `npm run glossary` 重新生成。');
      process.exitCode = 1;
    }
    return;
  }

  await writeFile(OUT, content, 'utf8');
  console.log(
    `已生成 GLOSSARY.md：合并 ${partCount} 个分册，${sections.length} 个领域，${termCount} 条术语。`,
  );
}

main().catch((err) => {
  console.error(String(err.message || err));
  process.exitCode = 1;
});
