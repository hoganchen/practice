/**
 * 文档链接校验脚本
 * ----------------------------------------------------------------------------
 * 校验 Markdown 文档里的内部链接是否有效：
 *   1. 锚点链接  [文字](#锚点)  —— 对应标题必须存在
 *   2. 文件链接  [文字](文件路径) —— 目标文件必须存在
 *
 * 为什么要单独做这件事：
 *   README 与 INDEX.md 里大量使用「目录跳转」锚点。锚点一旦写错，
 *   渲染出来就是个点了没反应的死链，而且**不会报任何错**，很容易长期烂在那里。
 *
 * 用法：
 *   node scripts/check-docs.js           校验 README.md 与 INDEX.md
 *   node scripts/check-docs.js --all     校验仓库里所有 .md
 *
 * 关于锚点算法：这里按 GitHub 的规则近似实现 ——
 *   转小写 → 去掉除「字母/数字/空格/连字符/下划线」以外的字符 → 空格转连字符。
 *   中文会原样保留，所以「## 配置 npm」的锚点是「配置-npm」。
 */

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectLinks } from './_lib/md-links.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ALL = process.argv.includes('--all');
const SKIP_DIRS = new Set(['node_modules', '.git', '.vscode', 'coverage', '.glossary_parts']);

/** 按 GitHub 规则把标题文本转成锚点 */
function slugify(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '') // 保留字母/数字/空格/连字符/下划线（\p{L} 含中文）
    .replace(/\s+/g, '-');
}

/** 收集文档里所有标题产生的锚点 */
function collectAnchors(md) {
  const anchors = new Set();
  const lines = md.split('\n');
  let inFence = false;
  for (const line of lines) {
    // 跳过代码块内的内容，避免把代码里的 # 当成标题
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (m) anchors.add(slugify(m[2]));
  }
  return anchors;
}

// collectLinks 定义在 scripts/_lib/md-links.js —— check-counts.js 也要用它数链接，
// 两边共用一份解析规则，避免「两个脚本对同一个文档数出不同链接数」。

async function collectMarkdown(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...(await collectMarkdown(full)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const files = CHECK_ALL
    ? (await collectMarkdown(ROOT)).sort()
    : ['README.md', 'INDEX.md', 'GLOSSARY.md'].map((f) => path.join(ROOT, f));

  let problems = 0;
  let checked = 0;

  for (const file of files) {
    let md;
    try {
      md = await readFile(file, 'utf8');
    } catch {
      console.log(`  ✗ ${path.relative(ROOT, file)} 不存在`);
      problems++;
      continue;
    }

    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const anchors = collectAnchors(md);
    const links = collectLinks(md);
    const fileProblems = [];

    for (const link of links) {
      checked++;
      const { target, line } = link;

      if (target.startsWith('#')) {
        // 锚点链接
        const slug = decodeURIComponent(target.slice(1));
        if (!anchors.has(slug)) {
          fileProblems.push(`第 ${line} 行：锚点 #${slug} 找不到对应标题`);
        }
      } else if (!/^[a-z][a-z0-9+.-]*:/i.test(target) && !target.startsWith('//')) {
        // 相对文件链接（排除 http(s):、mailto: 等协议链接）
        const targetPath = decodeURIComponent(target.split('#')[0]);
        if (!targetPath) continue;
        try {
          await readFile(path.join(path.dirname(file), targetPath));
        } catch {
          fileProblems.push(`第 ${line} 行：文件 ${targetPath} 不存在`);
        }
      }
      // 外部 http(s) 链接不校验（本脚本不联网）
    }

    if (fileProblems.length) {
      console.log(`  ✗ ${rel}`);
      for (const p of fileProblems) console.log(`      ${p}`);
      problems += fileProblems.length;
    } else {
      console.log(`  ✓ ${rel}（${links.length} 个链接）`);
    }
  }

  console.log('\n' + '='.repeat(72));
  if (problems === 0) {
    console.log(`文档链接校验通过：共检查 ${checked} 个链接，无死链`);
  } else {
    console.log(`文档链接校验失败：共检查 ${checked} 个链接，发现 ${problems} 处问题`);
    process.exitCode = 1;
  }
  console.log('='.repeat(72));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
