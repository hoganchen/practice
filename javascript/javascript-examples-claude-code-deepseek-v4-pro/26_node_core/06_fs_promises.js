/**
 * ============================================================================
 * 知识点：node:fs/promises —— await 风格的文件操作
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】进阶
 * 【前置知识】26_node_core/05_fs_callback.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:fs/promises 是 node:fs 的第三套 API：所有方法的返回值都是 Promise，
 *    因此可以直接 await。方法名与回调版完全相同（readFile / writeFile / mkdir …），
 *    只是不再需要传回调，成功时直接返回结果，失败时以异常形式抛出。
 *
 *        // 回调版（05_fs_callback.js）
 *        fs.readFile(p, 'utf8', (err, data) => { if (err) return; use(data); });
 *
 *        // Promise 版（本文件）
 *        const data = await fsp.readFile(p, 'utf8');
 *
 *    注意它**不是**一个独立模块，而是 node:fs 的同名子路径导出。
 *    官方推荐两种导入方式：
 *        import { readFile } from 'node:fs/promises';
 *        import fsp from 'node:fs/promises';        // 本文件采用这种，方便加 fsp. 前缀
 *    老写法 `import fs from 'node:fs'; fs.promises.readFile(...)` 仍然可用，但不够直接。
 *
 * 2. 为什么需要
 *    Promise 版同时解决了回调 API 的两个痛点：
 *      · 回调地狱：顺序操作从"层层嵌套"变成"一行接一行"
 *      · 错误处理：try/catch 能捕获 await 抛出的异常，而回调里抛的异常无法被外层捕获
 *    另外它天然支持并发组合：Promise.all / Promise.allSettled / Promise.race
 *    拿来就能用，不用再手写"完成计数器"。
 *    新代码应当默认选它——这也是 Node 官方现在的推荐。
 *
 * 3. 核心语法要点
 *    - await fsp.readFile(p, 'utf8')        读文件
 *    - await fsp.writeFile(p, data)         写文件（覆盖）
 *    - await fsp.appendFile(p, data)        追加
 *    - await fsp.mkdtemp(prefix)            创建唯一临时目录
 *    - await fsp.mkdir(p, { recursive })    建目录
 *    - await fsp.readdir(p, { recursive, withFileTypes })   列目录，recursive 递归
 *    - await fsp.stat(p)                    文件信息；不存在会抛 ENOENT
 *    - await fsp.cp(src, dest, { recursive })   复制文件或目录（Node 16.7+）
 *    - await fsp.rm(p, { recursive, force })    删除文件或目录
 *    - await fsp.rename(a, b)               移动 / 重命名
 *    - await fsp.access(p)                  只检查可访问性，不满足则抛异常
 *    - Promise.all([...])                   并发跑一批 I/O
 *    - ES 模块顶层支持 await（top-level await），不必再包一层 async 函数
 *
 * 4. 常见陷阱
 *    陷阱 1：忘记 await。拿到的是一个 Promise 对象，`data.toString()` 会得到 '[object Promise]'。
 *            这类 bug 不会报错，只会让后续逻辑莫名其妙。
 *    陷阱 2：把 await 写进 for 循环里逐个跑。那是**串行**，慢 N 倍。
 *            互不依赖的任务应当用 Promise.all 并发。
 *    陷阱 3：Promise.all 只要有一个失败就整体拒绝，其他任务的结果拿不到（也不会取消）。
 *            需要"全部结果都要"时用 Promise.allSettled。
 *    陷阱 4：try/catch 只包住 await 那一行是不够的——要用 try 把**整段依赖该结果的逻辑**
 *            包进去，否则后续出错时你不知道是读失败还是解析失败。
 *    陷阱 5：fs.promises.rm 的 force: true 只表示"路径不存在也不报错"，
 *            它**不是**"忽略所有错误"。权限不足照样会抛 EACCES。
 *    陷阱 6：readdir + recursive 返回的路径是**相对查询目录**的，要根据需要自己拼回绝对路径。
 *    陷阱 7：Node 18 起 fs.promises 的各种 API 也支持 AbortSignal，
 *            但超时取消必须自己配合 AbortController，没有内置的 timeout 选项。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/06_fs_promises.js
 *
 * 【预期输出】
 *   在 os.tmpdir() 下用 mkdtemp 建临时目录，用 await 风格完整走一遍
 *   建目录、批量并发写文件、读文件、stat、递归遍历目录树、复制目录、删除目录；
 *   演示 try/catch 捕获 ENOENT 与 Promise.all 的并发效果；
 *   最后清理临时目录。仓库目录不会被写入任何文件。
 * ============================================================================
 */

// 具名导入 vs 默认导入：
//   import { readFile } from 'node:fs/promises'  -> 直接拿到函数
//   import fsp from 'node:fs/promises'           -> 拿到整个命名空间对象
// 本文件用后者，好处是调用处统一带 fsp. 前缀，一眼能看出"这是文件操作"，
// 也不会和 node:path 的 path、node:os 的 os 等方法名混淆。
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// 顺带对比：从 node:fs 拿到的 fs 对象上有个 fs.promises 属性，
// 它指向的就是同一个模块。所以下面这行是等价的（本文件不实际使用）：
//   import fs from 'node:fs';  await fs.promises.readFile(...)
// 官方更推荐直接 import 'node:fs/promises'，意图更明确。

// ---------------------------------------------------------------------------
// 1. 顶层 await：ESM 里不必再包 async 函数
// ---------------------------------------------------------------------------

console.log('--- 1. 建临时目录（顶层 await） ---');

// 这是 ES 模块相对 CommonJS 最大的语法优势之一：顶层可以直接 await。
// 在 CJS 里必须写 (async () => { ... })() 这种立即执行函数把代码包起来。
// 注意：顶层 await 会让依赖本模块的其他模块等待它完成，所以不要在第一层模块里
// 放耗时很长的顶层 await，否则会拖慢整个应用启动。
const workDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'js-fsp-demo-'));
console.log('临时工作目录 =', workDir);

// ---------------------------------------------------------------------------
// 2. mkdir / writeFile —— 顺序执行的自然写法
// ---------------------------------------------------------------------------

console.log('--- 2. mkdir 与 writeFile ---');

// recursive: true 同时解决"父目录不存在"和"目录已存在"两个问题（幂等）。
await fsp.mkdir(path.join(workDir, 'src', 'utils'), { recursive: true });
console.log('已创建 src/utils 目录。');

// await 让顺序执行的代码像同步代码一样平铺，没有嵌套。
// 这与第 8 节 05_fs_callback.js 里那种层层缩进形成鲜明对比。
const mainFile = path.join(workDir, 'src', 'main.js');
await fsp.writeFile(mainFile, "export const hello = () => 'hi';\n", 'utf8');
console.log('已写入 src/main.js');

// appendFile 追加内容。
await fsp.appendFile(mainFile, "export const bye = () => 'bye';\n", 'utf8');

// 读回来验证。
const content = await fsp.readFile(mainFile, 'utf8');
// 注意：因为 await 已经解开了 Promise，content 是**字符串**而不是 Promise。
// 这正是陷阱 1 的反面教材——忘记 await 时这里会是一个 Promise 对象。
console.log('读回 src/main.js，内容如下：');
content
  .split('\n')
  .filter(Boolean)
  .forEach((line) => console.log('  |', line));

// 对比演示陷阱 1：不 await 会得到什么。
const notAwaited = fsp.readFile(mainFile, 'utf8');
console.log('不 await 时的类型：', notAwaited.constructor.name, '（是 Promise，不是字符串）');
console.log('  对它调用 toString() 会得到：', String(notAwaited));
// 仍然要 await 一次让这个 Promise 落地，否则会有未处理的 Promise 警告风险。
await notAwaited;
console.log('  => 忘记 await 不会报错，只会让后续逻辑用错类型。这是最隐蔽的坑之一。');

// ---------------------------------------------------------------------------
// 3. stat 与 access —— 查看信息、探测可访问性
// ---------------------------------------------------------------------------

console.log('--- 3. stat 与 access ---');

const st = await fsp.stat(mainFile);
console.log('src/main.js 的 stat：');
console.log('  size       =', st.size, '字节');
console.log('  isFile()   =', st.isFile());
console.log('  mode       =', st.mode.toString(8), '（八进制权限位）');
console.log('  mtimeMs    =', Math.round(st.mtimeMs), '（毫秒时间戳）');

// stat 对不存在的路径会抛 ENOENT，用 try/catch 捕获。
// 注意这里用的是 err.code，而不是字符串匹配 message。
try {
  await fsp.stat(path.join(workDir, 'ghost.txt'));
} catch (err) {
  console.log('stat 不存在的文件抛错：err.code =', err.code);
}

// access 只判断"能不能访问"，成功时 resolve 一个 undefined。
// 传 mode 可以检查具体权限（R_OK / W_OK / F_OK，来自 node:constants）。
try {
  await fsp.access(mainFile);
  console.log('access(mainFile) 通过（文件可访问）。');
} catch (err) {
  console.log('access 失败：', err.code);
}

try {
  await fsp.access(path.join(workDir, 'ghost.txt'));
} catch (err) {
  console.log('access(ghost.txt) 失败：err.code =', err.code, '（这就是"判断文件是否存在"的现代写法）');
}

// 实践建议：如果你接下来马上就要读/写这个文件，其实**不需要**先 access，
// 直接把读/写放进 try/catch 更可靠——中间没有时间窗，也就没有竞态。

// ---------------------------------------------------------------------------
// 4. Promise.all —— 并发跑一批 I/O
// ---------------------------------------------------------------------------

console.log('--- 4. Promise.all 并发写文件 ---');

// 准备要写的文件清单。
const files = [
  { name: 'a.txt', body: 'A 的内容\n' },
  { name: 'b.txt', body: 'B 的内容\n' },
  { name: 'c.txt', body: 'C 的内容\n' },
  { name: 'd.txt', body: 'D 的内容\n' },
];

// 常见错误写法（本文件不采用）：串行 await，一个写完再写下一个。
//   for (const f of files) await fsp.writeFile(...);
// 4 个文件就要 4 次完整的 I/O 往返，总耗时是四者之和。
//
// 正确做法：先把所有 Promise 造出来（此时 I/O 已经全部发起了），
// 再用 Promise.all 一起等。总耗时约等于最慢的那一个。
const t0 = Date.now();

// 这里的关键是 map 会产生 4 个"已经在进行中"的 Promise。
const writeTasks = files.map((f) =>
  fsp.writeFile(path.join(workDir, f.name), f.body, 'utf8'),
);

// Promise.all 接受 Promise 数组，返回一个 Promise，
// resolve 出的是"结果按输入顺序排列"的数组（与完成先后无关）。
const writeResults = await Promise.all(writeTasks);
console.log('并发写入', writeResults.length, '个文件，耗时', Date.now() - t0, 'ms');
console.log('每个任务的返回值都是 undefined（writeFile 无返回值）：', writeResults.every((r) => r === undefined));

// 读的时候同样并发：readFile 的结果有值，按输入顺序返回。
const readResults = await Promise.all(
  files.map((f) => fsp.readFile(path.join(workDir, f.name), 'utf8')),
);
console.log('并发读回的内容，按输入顺序：', readResults.map((s) => s.trim()).join(' / '));

// 陷阱 3 演示：Promise.all 是"一个失败就整体失败"。
// 第 2 个路径不存在，所以整体 reject，拿不到任何结果。
try {
  await Promise.all([
    fsp.readFile(path.join(workDir, 'a.txt'), 'utf8'),
    fsp.readFile(path.join(workDir, 'ghost.txt'), 'utf8'),
    fsp.readFile(path.join(workDir, 'c.txt'), 'utf8'),
  ]);
} catch (err) {
  console.log('Promise.all 中有一个失败，整体拒绝：err.code =', err.code);
  console.log('  => 注意：其余那 2 个读操作照旧执行完了，只是结果被丢弃了。');
}

// 需要"不管成功失败都拿到每一项结果"时，用 allSettled。
const settled = await Promise.allSettled([
  fsp.readFile(path.join(workDir, 'a.txt'), 'utf8'),
  fsp.readFile(path.join(workDir, 'ghost.txt'), 'utf8'),
  fsp.readFile(path.join(workDir, 'c.txt'), 'utf8'),
]);
console.log('Promise.allSettled 的结果（每一项都有 status）：');
settled.forEach((item, i) => {
  if (item.status === 'fulfilled') {
    console.log(`  [${i}] fulfilled ->`, JSON.stringify(item.value.trim()));
  } else {
    console.log(`  [${i}] rejected  ->`, item.reason.code);
  }
});
console.log('  => 需要"全部结果都要"时请用 allSettled，别用 all。');

// ---------------------------------------------------------------------------
// 5. 递归读取目录树
// ---------------------------------------------------------------------------

console.log('--- 5. readdir 递归遍历目录树 ---');

// 先造出一棵有层次的目录树。
await fsp.mkdir(path.join(workDir, 'src', 'components'), { recursive: true });
await fsp.mkdir(path.join(workDir, 'src', 'utils'), { recursive: true });
await fsp.mkdir(path.join(workDir, 'assets', 'img'), { recursive: true });
await Promise.all([
  fsp.writeFile(path.join(workDir, 'src', 'components', 'Button.js'), '// Button\n'),
  fsp.writeFile(path.join(workDir, 'src', 'components', 'Modal.js'), '// Modal\n'),
  fsp.writeFile(path.join(workDir, 'src', 'utils', 'format.js'), '// format\n'),
  fsp.writeFile(path.join(workDir, 'assets', 'img', 'logo.png'), 'fake-png-bytes\n'),
]);

// 方式一：只用 readdir(recursive: true)，拿到的路径是相对 workDir 的。
// 这种方式只能列名字，要区分类型还得额外 stat，所以通常配合 withFileTypes 用。
const allPaths = await fsp.readdir(workDir, { recursive: true });
console.log('递归列出的相对路径（共', allPaths.length, '项）：');
// 排序让输出稳定可读（readdir 的原始顺序依赖文件系统，不保证稳定）。
// 统一转成正斜杠，跨平台输出一致。
allPaths
  .map((p) => p.split(path.sep).join('/'))
  .sort()
  .forEach((p) => console.log('  -', p));

// 方式二：withFileTypes: true 拿到 Dirent，可直接判断类型，无需 stat。
// 配合 entry.parentPath 可以还原出绝对路径。
console.log('只看文件（过滤掉目录），并给出绝对路径：');
const dirents = await fsp.readdir(workDir, { recursive: true, withFileTypes: true });
for (const entry of dirents) {
  // parentPath 是该项所在目录的绝对路径（Node 20.12+ 提供）。
  const abs = path.join(entry.parentPath, entry.name);
  if (entry.isFile() && entry.name.endsWith('.js')) {
    const rel = path.relative(workDir, abs).split(path.sep).join('/');
    const size = (await fsp.stat(abs)).size;
    console.log(`  - ${rel}  (${size} 字节)`);
  }
}

// 方式三：手写递归遍历（不依赖 recursive 选项），
// 好处是可以在遍历过程中做剪枝（比如跳过 node_modules）、控制深度、累加统计。
console.log('手写递归遍历（模拟 du 统计各目录字节数）：');
async function walk(dir, depth = 0) {
  // readdir 返回的名字需要自己拼成完整路径。
  const names = await fsp.readdir(dir, { withFileTypes: true });
  let total = 0;
  for (const entry of names) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 递归求子目录大小
      const sub = await walk(full, depth + 1);
      total += sub;
      console.log(`  ${'  '.repeat(depth)}[目录] ${entry.name}/  合计 ${sub} 字节`);
    } else {
      const size = (await fsp.stat(full)).size;
      total += size;
      console.log(`  ${'  '.repeat(depth)}[文件] ${entry.name}  ${size} 字节`);
    }
  }
  return total;
}
const grandTotal = await walk(workDir);
console.log('整棵目录树合计', grandTotal, '字节');
// 说明：这里逐个 await stat 是"串行"的。目录很大时可以先把所有 stat 的 Promise
// 收集起来再 Promise.all，能显著提速。但要注意并发过高会耗尽文件描述符，
// 生产代码里通常会分批（例如每 50 个一批）处理。

// ---------------------------------------------------------------------------
// 6. cp 与 rm —— 复制与删除整个目录树
// ---------------------------------------------------------------------------

console.log('--- 6. cp 复制目录树 ---');

const backupDir = path.join(workDir, 'backup');
// cp 复制目录时必须加 recursive: true，否则会抛 EISDIR 之类的错误。
// force: true 表示目标已存在时可以覆盖。
await fsp.cp(path.join(workDir, 'src'), backupDir, { recursive: true, force: true });
console.log('已把 src/ 复制为 backup/');

// 验证复制结果：分别列出两边，比较文件清单是否一致。
const listFiles = async (dir) => {
  const items = await fsp.readdir(dir, { recursive: true, withFileTypes: true });
  return items
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();
};
const srcFiles = await listFiles(path.join(workDir, 'src'));
const backupFiles = await listFiles(backupDir);
console.log('src/ 里的文件：   ', srcFiles.join(', '));
console.log('backup/ 里的文件：', backupFiles.join(', '));
console.log('两边一致吗：', JSON.stringify(srcFiles) === JSON.stringify(backupFiles));

// 复制后改 backup 里的文件不会影响 src——它们是独立的物理副本。
await fsp.appendFile(path.join(backupDir, 'main.js'), '// 只在副本里追加\n', 'utf8');
const srcSize = (await fsp.stat(path.join(workDir, 'src', 'main.js'))).size;
const backupSize = (await fsp.stat(path.join(backupDir, 'main.js'))).size;
console.log(`修改副本后大小不同：src=${srcSize} backup=${backupSize}（证明是深拷贝）`);

console.log('--- 7. rm 删除目录树 ---');

await fsp.rm(backupDir, { recursive: true, force: true });
console.log('已删除 backup/');

// force: true 的作用是"路径不存在也不报错"，也就是幂等。
// 再删一次同样成功。
await fsp.rm(backupDir, { recursive: true, force: true });
console.log('重复删除也不报错（force: true 是幂等的）。');

// 陷阱 5 提醒：force 只忽略"找不到"，不忽略权限问题。
// 去掉 force 再删一个不存在的路径，就会抛 ENOENT。
try {
  await fsp.rm(path.join(workDir, 'ghost-dir'), { recursive: true });
} catch (err) {
  console.log('不加 force 删除不存在的目录：err.code =', err.code, '（ENOENT）');
}

// ---------------------------------------------------------------------------
// 8. rename 与路径安全
// ---------------------------------------------------------------------------

console.log('--- 8. rename 重命名 ---');

const oldName = path.join(workDir, 'assets', 'img', 'logo.png');
const newName = path.join(workDir, 'assets', 'img', 'brand-logo.png');
await fsp.rename(oldName, newName);
console.log('已重命名为 brand-logo.png');

// 一个常用的辅助函数：把"判断存在"封装成返回布尔值的函数。
// 这是把同步的 fs.existsSync 迁移到 Promise API 时的标准替代写法：
// access 成功即存在，抛异常即不存在，把异常吞掉换成布尔值。
async function exists(p) {
  try {
    await fsp.access(p);
    return true;
  } catch {
    return false;
  }
}
console.log('用封装的 exists() 检查旧文件 logo.png：  ', await exists(oldName), '（rename 是移动语义，旧名不再存在）');
console.log('用封装的 exists() 检查新文件 brand-logo.png：', await exists(newName));

// ---------------------------------------------------------------------------
// 9. 错误处理：try/catch 能捕获 await 的异常
// ---------------------------------------------------------------------------

console.log('--- 9. try/catch 与 await ---');

// 这是 Promise 版相对回调版最实用的改进：
// 回调里抛出的异常无法被外层 try/catch 捕获（因为 try 块早已执行完），
// 而 await 抛出的异常可以被正常的 try/catch 接住。
async function loadJson(filePath) {
  try {
    const text = await fsp.readFile(filePath, 'utf8');
    // 注意：JSON.parse 抛出的 SyntaxError 也在同一个 try 里被捕获，
    // 所以下面的 catch 需要区分"文件读不到"和"内容不是合法 JSON"两种情况。
    return JSON.parse(text);
  } catch (err) {
    // err 可能是 ENOENT（读失败），也可能是 SyntaxError（解析失败）。
    // 用 code 属性区分：只有 fs 错误才带 code。
    if (err.code === 'ENOENT') {
      console.log(`  [loadJson] 文件不存在：${path.basename(filePath)}，返回默认配置`);
      return { fallback: true };
    }
    if (err instanceof SyntaxError) {
      console.log(`  [loadJson] JSON 格式非法：${path.basename(filePath)}`);
      return { fallback: true, reason: 'invalid-json' };
    }
    // 其他未知错误继续往上抛，不要在这里吞掉。
    throw err;
  }
}

// 用一个不存在的文件触发 ENOENT 分支。
console.log('读不存在的配置：', JSON.stringify(await loadJson(path.join(workDir, 'config.json'))));

// 用一个内容非法的 JSON 文件触发 SyntaxError 分支。
const badJson = path.join(workDir, 'bad.json');
await fsp.writeFile(badJson, '{ 这不是合法 JSON }', 'utf8');
console.log('读格式非法的配置：', JSON.stringify(await loadJson(badJson)));

// 用一个合法文件走成功分支。
const goodJson = path.join(workDir, 'good.json');
await fsp.writeFile(goodJson, JSON.stringify({ name: 'demo', port: 3000 }), 'utf8');
console.log('读合法配置：    ', JSON.stringify(await loadJson(goodJson)));

// ---------------------------------------------------------------------------
// 10. 清理
// ---------------------------------------------------------------------------

console.log('--- 10. 清理临时目录 ---');

// 用 try/finally 语义保证"即使清理失败也不影响退出码"。
try {
  await fsp.rm(workDir, { recursive: true, force: true });
  console.log('已清理临时目录。');
} catch (err) {
  console.warn('清理失败（不影响程序结束）：', err.message);
}

console.log('清理后目录还存在吗：', await exists(workDir));
console.log('--- 全部演示结束 ---');
