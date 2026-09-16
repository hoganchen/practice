/**
 * 浏览器示例（.html）内联脚本语法校验
 * ----------------------------------------------------------------------------
 * run-all.js 会跳过 .html 文件（它们需要浏览器，无法用 node 直接运行），
 * 因此这里单独把每个 .html 里的 <script> 内联脚本抽取出来做语法检查，
 * 保证浏览器示例至少不存在语法错误。
 *
 * 用法：
 *   node scripts/check-html.js            校验全部 .html
 *   node scripts/check-html.js --verbose  打印每个文件检出的脚本块数量与类型
 *
 * 说明：
 *   - type="module" 的脚本按 ESM 检查，其余按普通脚本检查。
 *   - 带 src 属性的外链脚本会被跳过（本仓库的示例不允许外链）。
 *   - 只做语法检查，不执行代码，也不模拟 DOM。
 */

import { readdir, readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERBOSE = process.argv.includes('--verbose');
const SKIP_DIRS = new Set(['node_modules', '.git', 'scripts', '.vscode', 'coverage']);

async function collectHtml(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...(await collectHtml(full)));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

/** 抽取 <script> 块，返回 [{ code, module }] */
function extractScripts(html) {
  const blocks = [];

  // 关键：先剥掉 HTML 注释。
  // 示例文件的头部注释里经常出现 "<script>" 这样的字样（用于讲解），
  // 若不去掉，正则会把注释里的 "<script>" 和几百行之后真正的 "</script>"
  // 配成一对，从而把中间的正文散文当成 JS 来检查，产生假阳性。
  html = html.replace(/<!--[\s\S]*?-->/g, '');

  // 逐个匹配 <script ...>...</script>，捕获属性与内容
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1] || '';
    const code = m[2] || '';
    if (/\bsrc\s*=/i.test(attrs)) continue; // 外链脚本跳过
    if (!code.trim()) continue; // 空脚本跳过
    blocks.push({ code, module: /type\s*=\s*["']?module/i.test(attrs) });
  }
  return blocks;
}

async function main() {
  const files = (await collectHtml(ROOT)).sort();
  if (files.length === 0) {
    console.log('未找到任何 .html 文件。');
    return;
  }

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'html-check-'));
  const failures = [];
  let totalScripts = 0;

  try {
    for (const file of files) {
      const rel = path.relative(ROOT, file).replace(/\\/g, '/');
      const html = await readFile(file, 'utf8');
      const scripts = extractScripts(html);
      totalScripts += scripts.length;

      let fileOk = true;
      for (let i = 0; i < scripts.length; i++) {
        const { code, module } = scripts[i];
        // module 脚本用 .mjs，普通脚本用 .js 检查
        const tmp = path.join(tmpDir, `script-${i}${module ? '.mjs' : '.js'}`);
        await writeFile(tmp, code, 'utf8');
        const r = spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
        if (r.status !== 0) {
          fileOk = false;
          failures.push({
            rel,
            index: i,
            module,
            stderr: (r.stderr || '').trim(),
          });
        }
      }

      const label = `${scripts.length} 个脚本块（module: ${scripts.filter((s) => s.module).length}）`;
      console.log(`    ${fileOk ? '✓' : '✗'} ${rel}${VERBOSE ? `  — ${label}` : ''}`);
    }
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }

  console.log('\n' + '='.repeat(72));
  console.log(`HTML 文件 ${files.length} 个，内联脚本块 ${totalScripts} 个，语法错误 ${failures.length} 个`);
  console.log('='.repeat(72));

  if (failures.length > 0) {
    console.log('\n失败详情：\n');
    for (const f of failures) {
      console.log(`--- ${f.rel} 第 ${f.index + 1} 个脚本块（${f.module ? 'module' : 'classic'}）---`);
      console.log(f.stderr.split('\n').slice(0, 8).join('\n'));
      console.log();
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
