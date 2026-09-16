/**
 * ============================================================================
 * 知识点：Node.js 错误码（ENOENT / EACCES / EEXIST ...）与 err.code 判断
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】进阶
 * 【前置知识】20_error_handling/05_custom_errors.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Node.js 在系统调用失败时，会给错误对象加上一组结构化字段：
 *      err.code    字符串错误码，如 'ENOENT'、'EACCES'、'EEXIST'（最常用）
 *      err.errno   操作系统返回的负数字错误号（跨平台不一致，少用）
 *      err.syscall 出错的系统调用名，如 'open'、'mkdir'、'read'
 *      err.path    相关的文件路径（部分错误才有，可能是字符串或数组）
 *      err.dest    目标路径（如 rename 的第二个参数）
 *    这些字段是"可编程判断"的基础，比解析 message 文本可靠得多。
 *
 * 2. 为什么需要
 *    (1) 同一种操作可能以不同方式失败，处理方式完全不同：
 *          ENOENT  → 文件不存在，可以创建默认文件
 *          EACCES  → 权限不足，应该报错提示用户
 *          EEXIST  → 已经存在，可以忽略或改名
 *          EMFILE  → 打开的文件太多，稍后重试
 *    (2) message 文本会随 Node 版本、语言环境变化，code 是稳定的契约。
 *    (3) 日志里带上 code，运维一眼就能看出是磁盘满（ENOSPC）还是路径写错（ENOENT）。
 *
 * 3. 核心语法要点
 *    (1) 统一用 try/catch 捕获，然后读 err.code。
 *    (2) 常见的 POSIX 风格错误码：
 *          ENOENT  文件或目录不存在
 *          EACCES  权限不足
 *          EEXIST  文件/目录已存在
 *          EISDIR  期望文件却是目录
 *          ENOTDIR 期望目录却是文件
 *          ENOTEMPTY 目录非空（删除时）
 *          EPERM   操作不被允许
 *          EMFILE / ENFILE 文件描述符耗尽
 *          ENOSPC  磁盘空间不足
 *          ECONNREFUSED / ETIMEDOUT / ENOTFOUND 网络类
 *    (3) 除了 POSIX 码，Node 自己还有以 ERR_ 开头的错误码：
 *          ERR_INVALID_ARG_TYPE、ERR_ASSERTION、ERR_MODULE_NOT_FOUND、
 *          ERR_IMPORT_ATTRIBUTE_MISSING、ERR_REQUIRE_ESM 等。
 *    (4) 用 fs.constants 里的 F_OK / R_OK / W_OK 配合 fs.access 做"存在性/权限"预检，
 *        但更推荐"直接操作 + 捕获错误"（避免 TOCTOU 竞态）。
 *
 * 4. 常见陷阱
 *    (1) 用 err.message.includes('ENOENT') 判断 —— 应该直接用 err.code。
 *    (2) 用 fs.existsSync 预检再读取 —— 两次系统调用之间文件可能变化（TOCTOU），
 *        正确姿势是直接 try 操作，捕获 ENOENT。
 *    (3) 认为 err.code 一定存在 —— 自己 new Error() 时没有这个字段，
 *        取值前要判空（err.code === 'ENOENT' 对 undefined 是安全的比较）。
 *    (4) EACCES 在 Windows 上表现与 Linux 不同（比如只读文件不一定报 EACCES），
 *        跨平台代码不要把权限错误的触发条件写死。
 *    (5) 把 errno 写进业务逻辑 —— 它在不同操作系统上数值不同。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/10_node_error_codes.js
 *
 * 【预期输出】
 *   实测 ENOENT / EISDIR / EEXIST 三种错误码（临时文件都在 os.tmpdir() 下，不污染仓库），
 *   演示按 code 分流的写法与错误码速查表。
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ---------------------------------------------------------------------------
// 1. ENOENT：文件不存在（最常见的错误码）
// ---------------------------------------------------------------------------

console.log('--- 1. ENOENT：文件不存在 ---');

// 用一个几乎不可能存在的路径（写在系统临时目录下）
const missingPath = path.join(os.tmpdir(), `definitely-not-exist-${process.pid}-${Date.now()}.txt`);

try {
  fs.readFileSync(missingPath, 'utf8');
  console.log('居然读到了？不应该发生。');
} catch (err) {
  console.log('捕获到文件读取错误：');
  console.log('  err.code    =', err.code);
  console.log('  err.errno   =', err.errno, '（操作系统错误号，跨平台不一致，别用它做判断）');
  console.log('  err.syscall =', err.syscall);
  console.log('  err.path    =', err.path);
  console.log('  err.name    =', err.name, '（fs 错误通常是 Error，不是自定义类型）');
  console.log('  message 首行 =', err.message.split('\n')[0]);
}

// ---------------------------------------------------------------------------
// 2. EISDIR：期望文件，实际是目录
// ---------------------------------------------------------------------------

console.log('\n--- 2. EISDIR：把目录当文件读 ---');

try {
  fs.readFileSync(os.tmpdir(), 'utf8'); // 临时目录本身是个目录
  console.log('居然读到了？不应该发生。');
} catch (err) {
  console.log('  err.code    =', err.code);
  console.log('  err.syscall =', err.syscall);
  console.log('  message 首行 =', err.message.split('\n')[0]);
}

// ---------------------------------------------------------------------------
// 3. EEXIST：已经存在
// ---------------------------------------------------------------------------

console.log('\n--- 3. EEXIST：重复创建目录 ---');

const tmpDir = path.join(os.tmpdir(), `demo_err_code_${process.pid}`);
try {
  fs.mkdirSync(tmpDir); // 第一次成功
  console.log('  第一次 mkdirSync 成功：', tmpDir);

  try {
    fs.mkdirSync(tmpDir); // 第二次失败
  } catch (err) {
    console.log('  第二次 mkdirSync 失败：');
    console.log('    err.code =', err.code);
    console.log('    err.path =', err.path);
    console.log('    处理方式：如果目录已存在正是我们想要的，可以直接忽略这个错误。');
    if (err.code !== 'EEXIST') throw err; // 只忽略 EEXIST，其它错误继续抛
    console.log('    → 已按预期忽略 EEXIST');
  }

  // 也可以换一种写法：用 recursive 选项让 Node 自己处理"已存在"的情况
  fs.mkdirSync(tmpDir, { recursive: true });
  console.log('  用 { recursive: true } 重复创建不会报错（内部已处理 EEXIST）');
} finally {
  // 清理：删除演示用的临时目录（在系统临时目录里，不影响仓库）
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log('  已清理临时目录。');
}

// ---------------------------------------------------------------------------
// 4. 按错误码分流的实战写法
// ---------------------------------------------------------------------------

console.log('\n--- 4. 按 code 分流的实战写法 ---');

/**
 * 安全地读取一个配置文件：不存在就返回默认值，权限不足则明确报错
 * @param {string} filePath 文件路径
 * @param {object} defaults 文件不存在时使用的默认配置
 * @returns {object} 配置对象
 */
function readConfigSafe(filePath, defaults) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(text);
  } catch (err) {
    switch (err.code) {
      case 'ENOENT':
        // 文件不存在：这是可预期的，返回默认值（属于降级，不是异常）
        console.log(`  [ENOENT] ${path.basename(filePath)} 不存在，使用默认配置`);
        return defaults;
      case 'EACCES':
      case 'EPERM':
        // 权限问题：属于环境配置错误，必须让上层知道
        console.log(`  [EACCES] 没有权限读取 ${filePath}`);
        throw err;
      case 'EISDIR':
        console.log(`  [EISDIR] ${filePath} 是一个目录，不是文件`);
        throw err;
      default:
        // 不是预期的错误码（例如 JSON.parse 的 SyntaxError 没有 code）：
        // 重新抛出，绝不静默吞掉
        console.log(`  [未知] 错误码为 ${err.code ?? '(无)'}，向上抛出`);
        throw err;
    }
  }
}

const defaultConfig = { theme: 'light' };
console.log('读取不存在的文件：');
console.log('  结果：', JSON.stringify(readConfigSafe(missingPath, defaultConfig)));

console.log('\n读取一个内容非法的文件（先创建再读）：');
const badJsonPath = path.join(os.tmpdir(), `demo_bad_${process.pid}.json`);
fs.writeFileSync(badJsonPath, '{ 这不是 JSON }', 'utf8');
try {
  readConfigSafe(badJsonPath, defaultConfig);
} catch (err) {
  console.log('  上层收到：', err.name, '-', err.message.split('\n')[0]);
  console.log('  注意：JSON 语法错误没有 err.code，所以要判断 err.code ?? "(无)"');
} finally {
  fs.rmSync(badJsonPath, { force: true });
  console.log('  已清理临时文件。');
}

// ---------------------------------------------------------------------------
// 5. 其它常见的 Node 内置错误码（非文件系统）
// ---------------------------------------------------------------------------

console.log('\n--- 5. 其它常见的 Node 内置错误码 ---');

// ERR_INVALID_ARG_TYPE / ERR_INVALID_ARG_VALUE：参数类型不对
try {
  // 第三个参数（options）期望是对象或字符串，传数字会报错
  fs.readFileSync(missingPath, { encoding: 123 });
} catch (err) {
  console.log('  传错参数类型：', err.code, '-', err.message.split('\n')[0]);
}

// ERR_MODULE_NOT_FOUND：动态 import 找不到模块
try {
  await import('./_完全不存在的模块.js');
} catch (err) {
  console.log('  动态 import 找不到模块：', err.code);
}

// ERR_ASSERTION：断言失败（详见 11_assertion.js）
const assert = (await import('node:assert')).default;
try {
  assert.strictEqual(1, 2, '断言失败示例');
} catch (err) {
  console.log('  断言失败：', err.code, '（err.name =', err.name + '）');
}

// ---------------------------------------------------------------------------
// 6. 错误码速查表
// ---------------------------------------------------------------------------

console.log('\n--- 6. 常见错误码速查 ---');
const table = [
  ['ENOENT', '文件/目录不存在', '可预期，常降级处理'],
  ['EACCES', '权限不足', '环境问题，通常直接报错'],
  ['EPERM', '操作不被允许', '环境问题'],
  ['EEXIST', '已存在', '可忽略，或改用 recursive 选项'],
  ['EISDIR', '期望文件却是目录', '多半是路径写错'],
  ['ENOTDIR', '期望目录却是文件', '多半是路径写错'],
  ['ENOTEMPTY', '目录非空', '删除前先清空，或用 force'],
  ['EMFILE', '打开的文件过多', '资源泄漏信号，应检查是否忘记关闭'],
  ['ENOSPC', '磁盘空间不足', '严重问题，需告警'],
  ['ECONNREFUSED', '连接被拒绝', '服务未启动，可重试'],
  ['ETIMEDOUT', '连接超时', '网络问题，可重试'],
  ['ENOTFOUND', 'DNS 解析失败', '域名错误或网络问题'],
];
for (const [code, meaning, advice] of table) {
  console.log(`  ${code.padEnd(14)} ${meaning.padEnd(16)} → ${advice}`);
}

console.log('\n--- 7. 小结 ---');
console.log('判断错误请用 err.code，不要解析 message 文本；');
console.log('switch (err.code) 时一定要有 default 分支重新抛出；');
console.log('"直接操作 + 捕获错误" 优于 "先 existsSync 再操作"（避免 TOCTOU 竞态）。');
