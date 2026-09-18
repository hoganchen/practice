/**
 * 示例代码批量校验脚本
 * ----------------------------------------------------------------------------
 * 递归扫描仓库中所有示例代码并逐个运行，验证它们都能正常退出（退出码 0）。
 *
 * 用法：
 *   node scripts/run-all.js              运行全部示例并输出汇总
 *   node scripts/run-all.js --list       只列出会被运行的示例文件
 *   node scripts/run-all.js --only 05    只运行路径中包含 "05" 的示例
 *   node scripts/run-all.js --verbose    打印每个示例的完整输出
 *   node scripts/run-all.js --timeout 30000   单个示例超时时间（毫秒）
 *
 * 约定：
 *   1. 所有 .js / .cjs 示例必须能独立运行并以退出码 0 结束。
 *   2. 需要演示"抛错"的示例，必须在示例内部自行 try/catch，不得让进程非零退出。
 *   3. 以 _ 开头的文件 / _lib 目录内的文件被视为辅助模块，跳过不运行。
 *   4. .html 文件是浏览器示例，本脚本跳过（需手动用浏览器打开）。
 */

import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 不扫描的目录
const SKIP_DIRS = new Set(['node_modules', '.git', 'scripts', '.vscode', 'coverage']);
// 跳过的文件后缀
const SKIP_EXT = new Set(['.html', '.md', '.json', '.txt']);
// 单个示例的超时时间，超时视为失败
const DEFAULT_TIMEOUT = 30_000;

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const LIST_ONLY = flag('--list');
const VERBOSE = flag('--verbose');
const ONLY = opt('--only', null);
const TIMEOUT = Number(opt('--timeout', DEFAULT_TIMEOUT));

/** 递归收集所有示例文件 */
async function collect(dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...(await collect(full)));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (SKIP_EXT.has(ext)) continue;
      // 以 _ 开头的文件是辅助模块，不作为独立示例运行
      if (entry.name.startsWith('_')) continue;
      // 只运行 .js 和 .cjs
      if (ext !== '.js' && ext !== '.cjs') continue;
      out.push(full);
    }
  }
  return out;
}

/** 运行单个示例，返回 { ok, code, stdout, stderr, timedOut } */
function runOne(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [file], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, TIMEOUT);

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ ok: false, code: -1, stdout, stderr: String(err), timedOut: false });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0 && !timedOut, code, stdout, stderr, timedOut });
    });
  });
}

async function main() {
  // 只收集「序号_名称」目录下的文件。
  // 不加这层过滤的话，仓库根目录的配置文件（eslint.config.js、将来的
  // prettier.config.js / vitest.config.js 等）也会被当成示例收集进来 ——
  // 它们恰好没有副作用才"跑得通"，一旦有副作用就会在校验时真的被执行。
  const inTopicDir = (f) => /[\\/]\d{2}_[^\\/]+[\\/]/.test(f);

  const files = (await collect(ROOT))
    .filter(inTopicDir)
    .filter((f) => !ONLY || f.includes(ONLY))
    .sort();

  if (files.length === 0) {
    console.log('未找到任何示例文件。');
    return;
  }

  if (LIST_ONLY) {
    for (const f of files) console.log(path.relative(ROOT, f).replace(/\\/g, '/'));
    console.log(`\n共 ${files.length} 个示例文件。`);
    return;
  }

  console.log(`开始校验 ${files.length} 个示例（超时 ${TIMEOUT}ms）...\n`);

  const failures = [];
  let passed = 0;
  let currentDir = '';

  for (const file of files) {
    const rel = path.relative(ROOT, file).replace(/\\/g, '/');
    const dir = path.dirname(rel);
    if (dir !== currentDir) {
      currentDir = dir;
      console.log(`\n  ${dir}/`);
    }

    const result = await runOne(file);
    if (result.ok) {
      passed++;
      console.log(`    ✓ ${path.basename(rel)}`);
    } else {
      failures.push({ rel, ...result });
      console.log(`    ✗ ${path.basename(rel)}  (退出码 ${result.code}${result.timedOut ? ', 超时' : ''})`);
    }

    if (VERBOSE && result.stdout.trim()) {
      console.log(
        result.stdout
          .trimEnd()
          .split('\n')
          .map((l) => `        | ${l}`)
          .join('\n'),
      );
    }
  }

  console.log('\n' + '='.repeat(72));
  console.log(`通过 ${passed} / ${files.length}，失败 ${failures.length}`);
  console.log('='.repeat(72));

  if (failures.length > 0) {
    console.log('\n失败详情：\n');
    for (const f of failures) {
      console.log(`--- ${f.rel} (退出码 ${f.code}${f.timedOut ? ', 超时' : ''}) ---`);
      const err = f.stderr.trim();
      const out = f.stdout.trim();
      if (out) console.log(`[stdout]\n${out}\n`);
      if (err) console.log(`[stderr]\n${err}\n`);
      console.log();
    }
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
