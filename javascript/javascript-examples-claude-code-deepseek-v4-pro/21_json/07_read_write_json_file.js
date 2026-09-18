/**
 * ============================================================================
 * 知识点：用 node:fs 读写 JSON 文件 —— 美化输出与原子写入
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 数据格式与序列化
 * 【难度等级】进阶
 * 【前置知识】21_json/01_parse_and_stringify.js、21_json/02_json_format_rules.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JSON 最常见的落盘形式就是"一个 .json 文件"。在 Node.js 里读写它需要两件事：
 *      · JSON 的两个方法（序列化 / 反序列化）
 *      · node:fs 模块（文件读写）
 *    本文件演示一套"工程上靠得住"的读写函数：带编码、带错误处理、
 *    带美化输出，以及最关键的 —— 原子写入。
 *
 * 2. 为什么需要
 *    直接 writeFile 写 JSON 有一个隐蔽但致命的缺陷：
 *    如果写到一半进程崩了 / 机器断电了，磁盘上就会留下一个"被截断的 JSON"，
 *    下次启动读它时直接解析失败，配置文件彻底损坏。
 *    解决办法是"原子写入"：先写到一个临时文件，写成功后再 rename 覆盖目标文件。
 *    在同一个文件系统内，rename 是原子操作 —— 要么看到旧文件，要么看到新文件，
 *    绝不会看到"写了一半"的状态。
 *
 * 3. 核心语法要点
 *    ---- 读 ----
 *    readFileSync(path, 'utf8')  同步读取，返回字符串
 *    两个必须处理的点：
 *      · 文件不存在 → 会抛 ENOENT 错误（用 try/catch 或先 existsSync 判断）
 *      · 内容不是合法 JSON → JSON.parse 抛 SyntaxError（错误信息带位置，很有用）
 *    ---- 写 ----
 *    writeFileSync(path, text, 'utf8')
 *    text 用 JSON.stringify(value, null, 2) 生成，人读起来才舒服
 *    末尾建议补一个换行，符合 POSIX 文本文件习惯，Git diff 也更干净
 *    ---- 原子写入三步 ----
 *    ① 写到同目录下的临时文件（同一文件系统才能保证 rename 是原子的）
 *    ② fsync / 关闭文件（本文件用同步 API，写入返回即已落盘到内核缓冲区）
 *    ③ rename 覆盖目标文件
 *    ---- 其他实用选项 ----
 *    mkdirSync(dir, { recursive: true })  目录不存在时自动创建
 *    existsSync / statSync                判断存在性与大小
 *
 * 4. 常见陷阱
 *    (1) 忘记传 'utf8'：readFileSync 不传编码会返回 Buffer，
 *        JSON.parse(Buffer) 会先把 Buffer 转成字符串，中文一般没事，
 *        但显式写 'utf8' 才是正确习惯。
 *    (2) 直接把不可序列化的值（含循环引用、BigInt）写盘 —— stringify 会抛错，
 *        必须在写之前就处理好（见 04 号文件）。
 *    (3) 用 fs.writeFile 直接覆盖目标文件 —— 存在"写一半"的窗口期。
 *    (4) 临时文件放到别的目录（比如系统临时目录）—— rename 跨设备会失败（EXDEV）。
 *    (5) 忘记写"\n"结尾，导致文件末尾没有换行，某些工具会报警告。
 *    (6) 生产环境频繁同步读写大文件会阻塞事件循环，本文件为教学用同步 API，
 *        真实服务里大文件请用 fs/promises 的异步版本。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/07_read_write_json_file.js
 *
 * 【注意】本示例只在操作系统的临时目录（os.tmpdir()）里创建与删除文件，
 *        不会改动仓库里的任何文件，也不会访问网络。
 *
 * 【预期输出】
 *   依次演示：写入美化 JSON、读取并解析、错误处理（文件不存在 / 内容非法）、
 *   原子写入的前后对比，最后清理掉本次创建的临时目录。
 * ============================================================================
 */

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

console.log('--- 0. 准备一个隔离的临时目录 ---');

// os.tmpdir() 是操作系统的临时目录；mkdtempSync 会在其中创建一个"唯一名字"的子目录，
// 这样多次运行本示例不会互相干扰，也不会污染仓库目录。
const workDir = mkdtempSync(path.join(os.tmpdir(), 'json-demo-'));
console.log('  临时工作目录 =', workDir);
console.log('  它位于系统临时目录下，本示例结束时会把它整个删掉。');

const configPath = path.join(workDir, 'config.json');

console.log('--- 1. 写入 JSON 文件（美化输出） ---');

const config = {
  name: '示例应用',
  version: '1.2.3',
  port: 3000,
  features: {
    darkMode: true,
    betaFeatures: false,
    allowedOrigins: ['https://a.example.com', 'https://b.example.com'],
  },
  updatedAt: new Date('2026-09-16T10:20:30.000Z'), // 注意：序列化后会变成字符串
  retries: undefined,                              // 注意：会被静默丢弃
};

/** 把值写成一个"好看的"JSON 文件 */
function writeJsonPretty(filePath, value, space = 2) {
  // 第三个参数是缩进，让文件对人可读；末尾补换行，符合文本文件惯例。
  const text = JSON.stringify(value, null, space) + '\n';
  writeFileSync(filePath, text, 'utf8');
  return text;
}

const written = writeJsonPretty(configPath, config);
console.log('  写入的文件 =', configPath);
console.log('  文件内容：');
console.log(written.split('\n').map((l) => '    | ' + l).join('\n'));
console.log('  ↑ updatedAt 已变成 ISO 字符串，retries 因为值是 undefined 被整个丢掉了。');

console.log('--- 2. 读取并解析 JSON 文件 ---');

/** 读取一个 JSON 文件并解析，失败时抛出带上下文的错误 */
function readJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`文件不存在：${filePath}`);
  }
  const text = readFileSync(filePath, 'utf8'); // 一定要传 'utf8'，否则拿到的是 Buffer
  try {
    return JSON.parse(text);
  } catch (err) {
    // 把"哪个文件、第几行"补进错误信息里，排查时非常省事。
    throw new Error(`解析 JSON 失败（${filePath}）：${err.message}`);
  }
}

const loaded = readJson(configPath);
console.log('  读到的 name =', loaded.name);
console.log('  features.darkMode =', loaded.features.darkMode);
console.log('  allowedOrigins 长度 =', loaded.features.allowedOrigins.length);
console.log('  updatedAt 的类型 =', typeof loaded.updatedAt, '，值 =', loaded.updatedAt);

// 文件大小、编码等元信息也能顺便看一眼。
const info = statSync(configPath);
console.log('  文件字节数 =', info.size, '，是否是普通文件 =', info.isFile());

console.log('--- 3. 错误处理：文件不存在 ---');

try {
  readJson(path.join(workDir, 'not-exists.json'));
  console.log('  不会走到这里');
} catch (err) {
  console.log('  读取不存在的文件 =>', err.message);
}

// 不用 existsSync 也可以直接捕获 fs 的 ENOENT 错误码。
try {
  readFileSync(path.join(workDir, 'not-exists.json'), 'utf8');
} catch (err) {
  console.log('  直接 readFileSync 的报错 =>', err.code, '-', err.message);
}
console.log('  ↑ err.code 是 ' + "'ENOENT'" + '，在程序里按 code 分支比按消息文本匹配更可靠。');

console.log('--- 4. 错误处理：文件内容不是合法 JSON ---');

const brokenPath = path.join(workDir, 'broken.json');
writeFileSync(brokenPath, '{\n  "name": "缺了右花括号"\n', 'utf8');
console.log('  写入了一个残缺的 JSON：');
console.log(readFileSync(brokenPath, 'utf8').split('\n').map((l) => '    | ' + l).join('\n'));
try {
  readJson(brokenPath);
  console.log('  不会走到这里');
} catch (err) {
  console.log('  解析报错 =>', err.message);
}
console.log('  ↑ 报错信息里带"第几行第几列"，定位残缺位置非常直接。');

// 手工修好之后就能正常读取了。
writeFileSync(brokenPath, '{\n  "name": "补上右花括号"\n}\n', 'utf8');
console.log('  修好后读取 =>', JSON.stringify(readJson(brokenPath)));

console.log('--- 5. 目录不存在时先创建 ---');

const nestedDir = path.join(workDir, 'a', 'b', 'c');
const nestedPath = path.join(nestedDir, 'data.json');
console.log('  目标路径 =', nestedPath);
console.log('  创建前目录存在吗 =', existsSync(nestedDir));

try {
  writeFileSync(nestedPath, '{}', 'utf8');
  console.log('  不会走到这里');
} catch (err) {
  console.log('  直接写到不存在的目录 =>', err.code, '-', err.message);
}

// recursive: true 会一次性创建所有缺失的中间目录（类似 mkdir -p）。
mkdirSync(nestedDir, { recursive: true });
console.log('  创建后目录存在吗 =', existsSync(nestedDir));
writeJsonPretty(nestedPath, { ok: true, level: 3 });
console.log('  现在写入成功，内容 =', readFileSync(nestedPath, 'utf8').trim());

console.log('--- 6. 原子写入：先写临时文件，再 rename ---');

/**
 * 原子地把 value 写成 JSON 文件。
 * 关键点：
 *   1. 临时文件必须与目标文件"同目录" —— rename 只有在同一个文件系统内才是原子的。
 *      如果放到系统临时目录，跨设备时会报 EXDEV。
 *   2. rename 是覆盖式的：目标已存在也会被整体替换，不会出现"半个文件"。
 *   3. 临时文件名加进程号，避免多个进程同时写时互相踩踏。
 */
function writeJsonAtomic(filePath, value, space = 2) {
  const dir = path.dirname(filePath);
  mkdirSync(dir, { recursive: true }); // 保证目录存在
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.tmp`);
  const text = JSON.stringify(value, null, space) + '\n';

  writeFileSync(tmpPath, text, 'utf8'); // ① 先完整写到临时文件
  renameSync(tmpPath, filePath);        // ② 原子地替换目标文件
  return { tmpPath, text };
}

const atomicPath = path.join(workDir, 'atomic.json');
writeJsonPretty(atomicPath, { version: 1, data: '旧内容' });
console.log('  初始内容 =', readFileSync(atomicPath, 'utf8').trim());

const { tmpPath } = writeJsonAtomic(atomicPath, { version: 2, data: '新内容' });
console.log('  原子写入后的内容 =', readFileSync(atomicPath, 'utf8').trim());
console.log('  临时文件还在吗 =', existsSync(tmpPath), '（rename 之后它就不存在了）');
console.log('  ↑ 整个过程中，atomic.json 要么是"完整的旧内容"，要么是"完整的新内容"，');
console.log('    任何时刻读到"半截 JSON"的可能性都被排除了。');

console.log('--- 7. 原子写入的实际价值：对比"非原子"的失败场景 ---');

// 模拟一次"写到一半就崩了"：直接 writeFileSync 只写了一半的内容。
const riskyPath = path.join(workDir, 'risky.json');
writeJsonPretty(riskyPath, { a: 1, b: 2 });
console.log('  正常内容 =', readFileSync(riskyPath, 'utf8').replace(/\n/g, '\\n'));

// 直接覆盖写，但只写了一半（模拟进程被杀）：
writeFileSync(riskyPath, '{"a":1,"b":', 'utf8');
try {
  readJson(riskyPath);
  console.log('  不会走到这里');
} catch (err) {
  console.log('  半截文件读取 =>', err.message);
}
console.log('  ↑ 这就是"非原子写入"最真实的后果：文件被写坏了，而且无法自动恢复。');
console.log('    换成原子写入时，被中断只会留下一个 .tmp 文件，原文件完好无损。');

console.log('--- 8. 一个更完整的读写封装（带默认值与校验） ---');

/**
 * 带默认值的读取：文件不存在时返回默认值并顺手落盘，
 * 这是配置文件管理里最常用的模式。
 */
function loadConfigWithDefaults(filePath, defaults) {
  if (!existsSync(filePath)) {
    writeJsonAtomic(filePath, defaults);
    return { value: defaults, created: true };
  }
  const value = readJson(filePath);
  // 用默认值补齐缺失的顶层键（浅合并，够用且直观）。
  const merged = { ...defaults, ...value };
  return { value: merged, created: false };
}

const freshPath = path.join(workDir, 'fresh.json');
const first = loadConfigWithDefaults(freshPath, { theme: 'light', fontSize: 14 });
console.log('  第一次调用（文件不存在）=> created =', first.created, '，值 =', JSON.stringify(first.value));
const second = loadConfigWithDefaults(freshPath, { theme: 'light', fontSize: 14, extra: 'x' });
console.log('  第二次调用（文件已存在）=> created =', second.created,
  '，值 =', JSON.stringify(second.value), '（缺失的 extra 被默认值补上）');

console.log('--- 9. 小结 ---');

// 收尾：删除整个临时目录，不留垃圾。
rmSync(workDir, { recursive: true, force: true });
console.log('  已清理临时目录 =', workDir, '，还存在吗 =', existsSync(workDir));

console.log('· 读：readFileSync(path, "utf8") + JSON.parse，务必处理 ENOENT 与 SyntaxError。');
console.log('· 写：JSON.stringify(value, null, 2) + "\\n"，美化输出让人能读。');
console.log('· 原子写入三步：写临时文件 → rename 覆盖 → 保证任何时刻文件都是完整的。');
console.log('· 临时文件必须与目标同目录，否则 rename 可能因跨设备而失败。');
console.log('· 需要注释的配置请用 JSONC / YAML；纯 .json 文件里不能有注释。');
