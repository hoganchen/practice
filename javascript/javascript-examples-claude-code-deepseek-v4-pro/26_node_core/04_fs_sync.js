/**
 * ============================================================================
 * 知识点：node:fs 同步 API —— readFileSync / writeFileSync / mkdirSync 等
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】入门
 * 【前置知识】26_node_core/02_path_module.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:fs（file system）是 Node.js 的文件系统模块，提供读写文件、创建目录、
 *    遍历目录、查看文件信息、删除等能力。
 *    它同时提供三套 API：
 *      · 同步 API    —— 方法名带 Sync 后缀，如 readFileSync，直接返回结果
 *      · 回调 API    —— 如 readFile(path, cb)，结果通过回调给出（见 05_fs_callback.js）
 *      · Promise API —— 从 'node:fs/promises' 导入，配 await 使用（见 06_fs_promises.js）
 *    本文件只讲第一套：同步 API。
 *
 * 2. 为什么需要
 *    Node 的核心卖点是"非阻塞 I/O"，官方也主推异步 API。
 *    但同步 API 并没有被废弃，它在这些场景里反而更合适：
 *      · 程序启动时读配置：反正后续逻辑必须等配置读完，异步化没有收益，只会让代码更啰嗦
 *      · 构建脚本 / 一次性工具：没有并发压力，同步写法可读性最高
 *      · 模块初始化阶段：ESM 的顶层代码里用同步读文件是最直接的方案
 *    关键是要知道它的代价：同步 API 会**阻塞整个事件循环**，
 *    在此期间服务器无法处理任何请求——所以绝不要在请求处理函数里用。
 *
 * 3. 核心语法要点
 *    - fs.readFileSync(path, encoding?)    读文件。给 encoding 返回字符串，不给返回 Buffer
 *    - fs.writeFileSync(path, data)        写文件（**覆盖**已有内容）
 *    - fs.appendFileSync(path, data)       追加内容
 *    - fs.existsSync(path)                 判断路径是否存在（返回布尔值）
 *    - fs.statSync(path)                   取文件信息（大小、类型、时间戳）
 *    - fs.mkdirSync(path, { recursive })   创建目录；recursive: true 可创建多级、且已存在不报错
 *    - fs.readdirSync(path, { withFileTypes })  列出目录内容
 *    - fs.rmSync(path, { recursive, force })    删除文件或目录（Node 14.14+ 推荐用 rm）
 *    - fs.unlinkSync(path)                 删除文件（rm 的底层，不推荐直接用）
 *    - fs.copyFileSync(src, dest)          复制文件
 *    - fs.renameSync(oldPath, newPath)     移动 / 重命名
 *
 * 4. 常见陷阱
 *    陷阱 1：所有同步 API 都会阻塞事件循环。放在 HTTP 请求处理里 = 服务器卡死。
 *    陷阱 2：writeFileSync 是**整体覆盖**，不是追加。想追加必须用 appendFileSync。
 *    陷阱 3：mkdirSync 默认 recursive: false。父目录不存在会抛 ENOENT，
 *            目录已存在会抛 EEXIST。加上 { recursive: true } 两个问题一起解决。
 *    陷阱 4：不给 encoding 时 readFileSync 返回的是 Buffer 而不是字符串，
 *            直接当字符串用（比如 + 拼接）会得到奇怪的结果。
 *    陷阱 5：所有错误都以**异常**形式抛出，必须 try/catch，否则进程非零退出。
 *            错误对象上的 err.code（'ENOENT' / 'EACCES' / 'EEXIST'）才是判断依据，
 *            不要用 err.message 做字符串匹配（不同平台文案不同）。
 *    陷阱 6：existsSync 已被官方标记为 "legacy"，不推荐使用。
 *            原因是它返回的是"某一瞬间"的答案，紧接着去打开文件仍可能失败（TOCTOU）。
 *            更稳的写法是直接 try/catch 你真正要做的那个操作。
 *    陷阱 7：删除目录时 unlinkSync 会报错，必须用 rmSync(..., { recursive: true })。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/04_fs_sync.js
 *
 * 【预期输出】
 *   在系统临时目录（os.tmpdir()）下建一个临时工作目录，
 *   依次演示目录创建、写入、追加、读取、列目录、stat、复制、重命名、删除，
 *   并在最后清理掉全部临时文件。仓库目录不会被写入任何文件。
 * ============================================================================
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ---------------------------------------------------------------------------
// 0. 准备临时工作目录
// ---------------------------------------------------------------------------

console.log('--- 0. 准备临时目录 ---');

// 重要约定：示例程序不要在仓库目录里写文件，一律用系统临时目录。
// os.tmpdir() 在 Windows 上通常是 C:\Users\<用户>\AppData\Local\Temp，
// 在 Linux 上是 /tmp，macOS 上是 /var/folders/... 。
console.log('os.tmpdir() =', os.tmpdir());

// mkdtempSync 会创建一个"名字唯一"的目录：把 prefix 加上 6 个随机字符。
// 这样多个示例同时运行也不会互相覆盖。
// 注意 prefix 里不要带路径分隔符，直接拼字符即可。
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'js-ex-demo-'));
console.log('临时工作目录 =', workDir);

// 用 try/finally 包住全部演示，保证即使中途出错也能清理临时文件。
// 注意：ESM 支持顶层 await，但顶层 try/finally 同样合法（这里的代码全是同步的）。
let cleaned = false;

/** 清理临时目录：recursive 删除整个目录树，force 让"不存在"也不报错 */
function cleanup() {
  if (cleaned) return;
  try {
    fs.rmSync(workDir, { recursive: true, force: true });
    cleaned = true;
    console.log('已清理临时目录。');
  } catch (err) {
    // 清理失败不该让程序崩溃，打印警告即可。
    console.warn('清理临时目录失败：', err.message);
  }
}

try {
  // -------------------------------------------------------------------------
  // 1. mkdirSync —— 创建目录
  // -------------------------------------------------------------------------

  console.log('--- 1. mkdirSync 创建目录 ---');

  const subDir = path.join(workDir, 'docs', 'guides');

  // 反面演示：默认 recursive: false，父目录不存在时会抛 ENOENT。
  try {
    fs.mkdirSync(subDir);
  } catch (err) {
    console.log('不加 recursive 创建多级目录失败：');
    console.log('  err.code =', err.code, '（ENOENT = 父目录不存在）');
    console.log('  err.message =', err.message.split('\n')[0]);
  }

  // 正确做法：{ recursive: true } 会自动创建所有缺失的父目录，
  // 并且如果目录已经存在，也**不会**报错（相当于 mkdir -p）。
  fs.mkdirSync(subDir, { recursive: true });
  console.log('加 recursive: true 后创建成功：', path.relative(workDir, subDir));

  // 再调用一次验证"已存在也不报错"。
  fs.mkdirSync(subDir, { recursive: true });
  console.log('重复调用 mkdirSync 也没报错（recursive 幂等）。');

  // -------------------------------------------------------------------------
  // 2. writeFileSync —— 写文件
  // -------------------------------------------------------------------------

  console.log('--- 2. writeFileSync 写文件 ---');

  const readmePath = path.join(workDir, 'README.md');

  // 第二个参数可以是字符串，也可以是 Buffer / TypedArray。
  // 第三个参数可以传 encoding 字符串，或传一个 options 对象。
  fs.writeFileSync(readmePath, '# 示例标题\n第一行内容\n', 'utf8');
  console.log('已写入 README.md，大小 =', fs.statSync(readmePath).size, '字节');

  // 关键点：writeFileSync 是**覆盖**写。再次写入会把原内容全部替换掉。
  fs.writeFileSync(readmePath, '被覆盖的新内容\n', 'utf8');
  console.log('覆盖写入后内容 =', JSON.stringify(fs.readFileSync(readmePath, 'utf8')));

  // options 对象写法：可以指定 encoding 和 mode（文件权限，POSIX 下有效）。
  const withOptions = path.join(workDir, 'options.txt');
  fs.writeFileSync(withOptions, '带 options 写入\n', { encoding: 'utf8' });
  console.log('用 options 对象写入成功，内容 =', JSON.stringify(fs.readFileSync(withOptions, 'utf8')));

  // 陷阱演示：不指定 encoding 时读回来是 Buffer。
  const asBuffer = fs.readFileSync(withOptions);
  console.log('不传 encoding 读回来是 Buffer 吗：', Buffer.isBuffer(asBuffer));
  console.log('  Buffer 本身：', asBuffer);
  console.log('  用 toString() 转成字符串：', JSON.stringify(asBuffer.toString('utf8')));

  // -------------------------------------------------------------------------
  // 3. appendFileSync —— 追加内容
  // -------------------------------------------------------------------------

  console.log('--- 3. appendFileSync 追加 ---');

  const logPath = path.join(workDir, 'app.log');

  // 追加写：文件不存在会自动创建，存在则在末尾续写。
  fs.appendFileSync(logPath, '第 1 条日志\n', 'utf8');
  fs.appendFileSync(logPath, '第 2 条日志\n', 'utf8');
  fs.appendFileSync(logPath, '第 3 条日志\n', 'utf8');

  // split 后去掉末尾空串，方便数行数。
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  console.log('日志共', lines.length, '行：');
  lines.forEach((line, i) => console.log(`  ${i + 1}. ${line}`));

  // -------------------------------------------------------------------------
  // 4. existsSync 与 statSync —— 判断存在、读取信息
  // -------------------------------------------------------------------------

  console.log('--- 4. existsSync 与 statSync ---');

  console.log('workDir 存在吗：   ', fs.existsSync(workDir));
  console.log('不存在的路径存在吗：', fs.existsSync(path.join(workDir, 'nope.txt')));

  // 再次提醒：existsSync 被标记为 legacy。它返回的是"查询那一刻"的答案，
  // 而你紧接着用它做决定时，文件状态可能已经变了（先检查后使用的经典竞态）。
  // 更稳的写法是直接把操作放进 try/catch：
  try {
    fs.readFileSync(path.join(workDir, 'nope.txt'), 'utf8');
  } catch (err) {
    console.log('直接读不存在的文件：err.code =', err.code, '（ENOENT）');
    console.log('  这就是"用 try/catch 代替 existsSync"的推荐写法。');
  }

  // statSync 返回一个 Stats 对象，包含大小、时间、类型判断方法。
  const st = fs.statSync(readmePath);
  console.log('statSync(README.md) 的关键字段：');
  console.log('  size        =', st.size, '（字节数）');
  console.log('  mtime       =', st.mtime.toISOString(), '（最后修改时间）');
  console.log('  isFile()    =', st.isFile());
  console.log('  isDirectory() =', st.isDirectory());

  // 对目录做 stat 会看到 isDirectory() 为 true。
  console.log('目录的 isDirectory() =', fs.statSync(subDir).isDirectory());

  // 陷阱：对不存在的路径 statSync 会抛 ENOENT。想"不存在时返回 null"要用
  // fs.statSync(p, { throwIfNoEntry: false })，这样拿到 undefined 而不抛异常。
  const missing = fs.statSync(path.join(workDir, 'nope.txt'), { throwIfNoEntry: false });
  console.log('throwIfNoEntry: false 时不存在返回：', missing, '（不抛异常，方便做判断）');

  // -------------------------------------------------------------------------
  // 5. readdirSync —— 列目录
  // -------------------------------------------------------------------------

  console.log('--- 5. readdirSync 列目录 ---');

  // 先造几个文件，让目录里内容丰富一点。
  for (const name of ['a.txt', 'b.txt', 'c.txt']) {
    fs.writeFileSync(path.join(workDir, name), `${name} 的内容`, 'utf8');
  }

  // 默认只返回名字（字符串数组），不告诉你哪个是目录、哪个是文件。
  const names = fs.readdirSync(workDir);
  console.log('readdirSync（只要名字）：');
  names.forEach((n) => console.log('  -', n));

  // 加 withFileTypes: true 会返回 Dirent 对象，自带类型判断方法。
  // 好处是**不需要**对每一项再 statSync 一次，对包含很多文件的目录效率高得多。
  const entries = fs.readdirSync(workDir, { withFileTypes: true });
  console.log('readdirSync（withFileTypes: true）：');
  for (const entry of entries) {
    const kind = entry.isDirectory() ? '目录' : entry.isFile() ? '文件' : '其他';
    console.log(`  - ${entry.name}  [${kind}]`);
  }

  // 递归列出所有内容需要 Node 18.17+ 的 recursive 选项。
  // 注意：开启后返回的是**相对 workDir** 的路径，而不是只有文件名。
  const all = fs.readdirSync(workDir, { recursive: true, withFileTypes: true });
  console.log('递归列出（相对路径）：');
  for (const entry of all) {
    // entry.parentPath 给出每一项所在的目录（Node 20.12+ 提供）。
    const rel = path.relative(workDir, path.join(entry.parentPath, entry.name));
    const kind = entry.isDirectory() ? '目录' : '文件';
    // 统一转成正斜杠显示，输出在任何平台上都一致，便于比对。
    console.log(`  - ${rel.split(path.sep).join('/')}  [${kind}]`);
  }

  // -------------------------------------------------------------------------
  // 6. copyFileSync / renameSync —— 复制与移动
  // -------------------------------------------------------------------------

  console.log('--- 6. copyFileSync 与 renameSync ---');

  const srcFile = path.join(workDir, 'a.txt');
  const copyTarget = path.join(workDir, 'a.copy.txt');

  // copyFileSync(src, dest)：dest 会被**覆盖**，不会因为已存在而报错。
  fs.copyFileSync(srcFile, copyTarget);
  console.log('复制后两个文件内容相同吗：',
    fs.readFileSync(srcFile, 'utf8') === fs.readFileSync(copyTarget, 'utf8'));

  // renameSync 在同一分区内是"移动 + 重命名"，是原子操作。
  const movedTarget = path.join(subDir, 'a-renamed.txt');
  fs.renameSync(copyTarget, movedTarget);
  console.log('移动后原位置还在吗：', fs.existsSync(copyTarget));
  console.log('移动后新位置存在吗：', fs.existsSync(movedTarget));
  console.log('新位置的相对路径：', path.relative(workDir, movedTarget).split(path.sep).join('/'));

  // -------------------------------------------------------------------------
  // 7. 删除文件与目录
  // -------------------------------------------------------------------------

  console.log('--- 7. 删除 ---');

  // unlinkSync 只能删**文件**，删目录会抛 EISDIR / EPERM。
  try {
    fs.unlinkSync(subDir);
  } catch (err) {
    console.log('unlinkSync 删目录失败：err.code =', err.code, '（目录要用 rmSync）');
  }

  // rmSync 是统一入口：recursive 删目录树，force 让"路径不存在"静默通过。
  const trashDir = path.join(workDir, 'trash');
  fs.mkdirSync(path.join(trashDir, 'deep', 'deeper'), { recursive: true });
  fs.writeFileSync(path.join(trashDir, 'deep', 'deeper', 'x.txt'), 'x', 'utf8');
  console.log('trash 目录树已创建，deep/deeper 下文件数 =',
    fs.readdirSync(path.join(trashDir, 'deep', 'deeper')).length);

  fs.rmSync(trashDir, { recursive: true, force: true });
  console.log('rmSync 后 trash 还存在吗：', fs.existsSync(trashDir));

  // force: true 的效果：删一个本来就不存在的路径也不报错（幂等）。
  fs.rmSync(trashDir, { recursive: true, force: true });
  console.log('force: true 让重复删除也安全（幂等）。');

  // -------------------------------------------------------------------------
  // 8. 阻塞的本质
  // -------------------------------------------------------------------------

  console.log('--- 8. 同步 API 会阻塞事件循环 ---');

  // 用一个"本该在 10ms 后执行"的定时器来观察阻塞。
  // 定时器回调只有在当前同步代码全部执行完之后才有机会运行。
  const t0 = Date.now();
  const timer = setTimeout(() => {
    console.log(`setTimeout 回调执行，距注册时刻 ${Date.now() - t0}ms`);
    console.log('（这正说明：同步代码不跑完，事件循环一步都动不了）');
  }, 10);

  // 下面这段同步忙等约 60ms，用来模拟"同步 I/O 花掉的时间"。
  // 真实代码里当然不该这样写——这里只是为了观察阻塞现象。
  while (Date.now() - t0 < 60) {
    // 空转，故意占住 CPU
  }
  console.log(`同步忙等结束，耗时 ${Date.now() - t0}ms；此时定时器还一次都没执行。`);

  // 记住结论：同步 API 的耗时 = 事件循环被卡住的时长。
  // 服务器进程里用同步读文件读一个 500MB 的文件，等于服务停摆几秒。
  // 定时器由 Node 的事件循环驱动，会在同步代码结束后自然触发，不需要额外清理。
  void timer;
} finally {
  // 无论上面是否抛异常，都执行清理。
  cleanup();
}

// 清理之后，临时目录已经不存在了。
console.log('清理后 workDir 还存在吗：', fs.existsSync(workDir));

console.log('--- 全部演示结束 ---');
