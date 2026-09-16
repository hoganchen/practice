/**
 * ============================================================================
 * 知识点：node:path —— 路径拼接、解析与跨平台差异
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】入门
 * 【前置知识】26_node_core/01_process_object.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:path 是 Node.js 内置的路径处理模块，提供一串**纯字符串运算**的函数：
 *    拼接路径、取目录名、取扩展名、把路径拆成对象、再拼回去……
 *    它不访问磁盘、不检查文件是否存在，只做字符串层面的规范化与拆分。
 *    因此它是所有文件操作的"前置工具"——写 fs 代码前几乎一定要先有 path。
 *
 * 2. 为什么需要
 *    路径分隔符在不同系统上不一样：Windows 用反斜杠 `\`，POSIX（Linux/macOS）用正斜杠 `/`。
 *    如果代码里手写 `'data/' + name + '.json'`，在 Windows 上虽然多数情况也能跑，
 *    但一旦涉及盘符、UNC 路径、混合分隔符就会出问题。
 *    更严重的是手写 `'..' + '/' + x` 这种拼接，很容易在输入里被注入 `../../` 造成目录穿越漏洞。
 *    path.join / path.resolve 会做规范化，把多余的 `.`、`..`、重复分隔符处理掉。
 *
 * 3. 核心语法要点
 *    - path.join(...parts)      拼接多段路径，自动用当前平台分隔符，并规范化
 *    - path.resolve(...parts)   从右往左拼，直到拼出一个**绝对路径**为止（以 cwd 兜底）
 *    - path.basename(p, ext?)   取最后一段（文件名）；给了 ext 会顺便去掉该后缀
 *    - path.dirname(p)          取目录部分
 *    - path.extname(p)          取扩展名（含点），没有则返回空串
 *    - path.parse(p)            拆成 { root, dir, base, ext, name } 五个字段
 *    - path.format(obj)         parse 的逆运算，把对象拼回字符串
 *    - path.normalize(p)        只做规范化，不拼不改
 *    - path.relative(from, to)  求相对路径
 *    - path.isAbsolute(p)       判断是否绝对路径
 *    - path.sep                 当前平台的分隔符（Windows '\'，POSIX '/'）
 *    - path.win32 / path.posix  固定平台的实现，用来做跨平台测试
 *
 * 4. 常见陷阱
 *    陷阱 1：extname 只认最后一个点。'a.tar.gz' 的 extname 是 '.gz' 而不是 '.tar.gz'。
 *    陷阱 2：extname 对"点开头的隐藏文件"返回空串。'.gitignore' 的扩展名是 ''。
 *    陷阱 3：resolve 与 join 语义完全不同。join 只是拼字符串，
 *            resolve 会一路回溯到根（或 cwd），'..' 在 resolve 里真的会往上跳。
 *    陷阱 4：把 URL 当路径用。'file:///a/b'、'https://x/y' 不是文件路径，
 *            要先用 node:url 的 fileURLToPath 转换（见 03_url_module.js）。
 *    陷阱 5：以为 path 会帮你检查文件。它不会——路径合法不代表文件存在。
 *    陷阱 6：dirname/basename 的边界。'/a/b/' 的 basename 是 'b'（末尾斜杠被忽略），
 *            而 dirname('/a') 是 '/'。
 *    陷阱 7：parse 与 format 的往返在跨平台时**不闭合**。parse 原样切片保留 '/',
 *            而 format 拼接时用平台分隔符，Windows 上会得到 '/a/b\c.txt' 这种混合路径。
 *            要稳定处理 POSIX 风格路径请显式用 path.posix。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/02_path_module.js
 *
 * 【预期输出】
 *   先演示当前平台（本机 win32）下的各项路径 API，
 *   再用 path.posix / path.win32 固定实现对比两个平台的差异，
 *   最后演示"为什么不要手工拼路径"。
 * ============================================================================
 */

// 使用 node: 前缀导入内置模块，这是 Node 官方推荐写法：
// 能明确区分"内置模块"与"node_modules 里的第三方包"，也避免被同名包劫持。
import path from 'node:path';

// 下面第 3 节会用它把 import.meta.url（URL 形式）转成真正的文件路径。
import { fileURLToPath } from 'node:url';

// path 模块默认导出就是一个对象，所有方法都挂在上面。
// 也可以按需具名导入：import { join, resolve } from 'node:path';
// 本文件统一用 path.xxx 的调用形式，好处是读代码时一眼能看出"这是 path 的函数"。

// ---------------------------------------------------------------------------
// 1. path.sep 与 path.delimiter —— 两个跨平台常量
// ---------------------------------------------------------------------------

console.log('--- 1. 平台分隔符常量 ---');

// sep = separator，路径分隔符。Windows 是反斜杠，POSIX 是正斜杠。
// 注意反斜杠在 JS 字符串里是转义字符，所以要写成 '\\' 才能表示一个反斜杠。
console.log('path.sep =', JSON.stringify(path.sep));
console.log('当前平台是 Windows 吗：', path.sep === '\\');

// delimiter 是"路径列表"的分隔符，用于 PATH / NODE_PATH 这类环境变量。
// Windows 用分号 ';'，POSIX 用冒号 ':'。
console.log('path.delimiter =', JSON.stringify(path.delimiter));

// 判断平台时更可读的写法是直接用 process.platform，
// 而不是比较 path.sep —— 后者是"用结果反推原因"，可读性差。
console.log('process.platform =', process.platform);

// ---------------------------------------------------------------------------
// 2. path.join —— 最常用的拼接
// ---------------------------------------------------------------------------

console.log('--- 2. path.join 拼接路径 ---');

// join 把传入的每一段用 sep 连起来，并做规范化：
// 去掉重复分隔符、解析 '.' 和 '..'、去掉末尾多余的分隔符。
const joined = path.join('data', 'users', 'avatar.png');
console.log("path.join('data', 'users', 'avatar.png') =", joined);

// 传入的段落里本身带分隔符也没关系，join 会正确处理。
console.log("path.join('a/b', 'c', 'd') =", path.join('a/b', 'c', 'd'));

// 重复分隔符会被压缩成一个。
console.log("path.join('a//', '//b') =", path.join('a//', '//b'));

// '..' 会被真正地"往上跳一层"，这是 join 的规范化行为。
console.log("path.join('a', 'b', '..', 'c') =", path.join('a', 'b', '..', 'c'));

//  '.' 表示当前目录，会被直接消除。
console.log("path.join('a', '.', 'b') =", path.join('a', '.', 'b'));

// 关键点：join **不保证**结果是绝对路径。它只是拼字符串。
console.log("path.join('a', 'b') 是绝对路径吗：", path.isAbsolute(path.join('a', 'b')));

// 传入非字符串会抛 TypeError，这是很多人踩过的坑。
// join 的参数必须是字符串，数字 123 也不行（不像某些库会自动转）。
try {
  path.join('a', 123);
} catch (err) {
  console.log('path.join 传数字报错：', err.constructor.name, '-', err.message);
}

// ---------------------------------------------------------------------------
// 3. path.resolve —— 拼出绝对路径
// ---------------------------------------------------------------------------

console.log('--- 3. path.resolve 解析为绝对路径 ---');

// resolve 的规则：从右往左依次处理参数，直到遇到一个绝对路径为止；
// 前面剩下的部分如果都没到绝对路径，就把 cwd 接在最前面。
// 结果一定是绝对路径（这是与 join 最本质的区别）。
console.log("path.resolve('data', 'users') =", path.resolve('data', 'users'));
console.log('（上面的前缀就是 cwd：', process.cwd(), '）');

// 一旦参数中出现绝对路径，它**左边**的所有内容都会被丢弃。
// 这是 resolve 最反直觉的地方：它像 shell 里连续 cd 的效果。
console.log("path.resolve('a', '/b', 'c') =", path.resolve('a', '/b', 'c'));
console.log("path.resolve('a', 'b', '/c', 'd') =", path.resolve('a', 'b', '/c', 'd'));

// '..' 在 resolve 里同样会真的往上跳。
console.log("path.resolve('a/b/c', '..', '..') =", path.resolve('a/b/c', '..', '..'));

// 经典用法一：把"相对 cwd 的相对路径"变成绝对路径。
const relFile = path.resolve('26_node_core', '02_path_module.js');
console.log('相对路径转绝对路径：', relFile);

// 经典用法二：在 ESM 里拿到"当前脚本所在目录"的绝对路径。
// import.meta.url 是形如 'file:///C:/Repo/.../02_path_module.js' 的 URL 字符串。
// 把它交给 path.dirname 是**错误**的，因为 URL 不是文件路径，必须先转。
// 正确做法是配合 node:url 的 fileURLToPath（文件顶部已导入）—— 这里简单演示一下。
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
console.log('本脚本所在目录（fileURLToPath + dirname）：', scriptDir);
console.log('对比 cwd：', process.cwd());
// 注意这两者并不相同：脚本在 26_node_core/ 下，而 cwd 是仓库根。
// 这正是"相对路径基准是 cwd 而非脚本目录"的直观证明——
// 如果脚本里写 fs.readFileSync('./data.json')，Node 会去仓库根找，而不是 26_node_core。
console.log('两者是否相同：', scriptDir === process.cwd());

// ---------------------------------------------------------------------------
// 4. basename / dirname / extname —— 取路径的各个部分
// ---------------------------------------------------------------------------

console.log('--- 4. basename / dirname / extname ---');

// basename 取"最后一段"，也就是文件名。
// 在 Windows 上它同时认 '\' 和 '/' 两种分隔符。
console.log("path.basename('a/b/c.txt') =", path.basename('a/b/c.txt'));

// 第二个参数可选：传入后缀，若匹配则从结果中删掉。
// 注意这个后缀是"字符串匹配"，不要求带点，也不要求是真正的扩展名。
console.log("path.basename('a/b/c.txt', '.txt') =", path.basename('a/b/c.txt', '.txt'));
console.log("path.basename('a/b/c.txt', '.md') =", path.basename('a/b/c.txt', '.md'), '（不匹配就不删）');

// 末尾的分隔符会被忽略。
console.log("path.basename('/a/b/') =", path.basename('/a/b/'));

// dirname 取目录部分。
console.log("path.dirname('a/b/c.txt') =", path.dirname('a/b/c.txt'));
console.log("path.dirname('/a/b/c.txt') =", path.dirname('/a/b/c.txt'));

// extname 取扩展名（**包含点**）。
console.log("path.extname('index.html') =", path.extname('index.html'));
console.log("path.extname('archive.tar.gz') =", path.extname('archive.tar.gz'), '（只取最后一段）');
console.log("path.extname('.gitignore') =", JSON.stringify(path.extname('.gitignore')), '（点开头的隐藏文件没有扩展名）');
console.log("path.extname('README') =", JSON.stringify(path.extname('README')), '（没有点就是空串）');

// 实战：按扩展名分派处理逻辑。这是构建工具、静态服务器里最常见的模式。
function describeFile(fileName) {
  switch (path.extname(fileName).toLowerCase()) {
    case '.js':
      return 'JavaScript 源码';
    case '.json':
      return 'JSON 数据';
    case '.md':
      return 'Markdown 文档';
    default:
      return '未知类型';
  }
}
console.log('describeFile("app.js") =', describeFile('app.js'));
console.log('describeFile("data.JSON") =', describeFile('data.JSON'), '（已 toLowerCase，大小写无关）');

// ---------------------------------------------------------------------------
// 5. parse 与 format —— 拆分与还原
// ---------------------------------------------------------------------------

console.log('--- 5. path.parse 与 path.format ---');

// parse 把路径拆成一个对象，五个字段：
//   root: 根（Windows 上是 'C:\' 或 '\\server\share\'，POSIX 上是 '/'）
//   dir:  目录部分（不含末尾分隔符）
//   base: 最后一段（= basename）
//   ext:  扩展名（含点）
//   name: 主文件名（不含扩展名）
const parsed = path.parse('/home/user/docs/report.pdf');
console.log('path.parse("/home/user/docs/report.pdf") =');
console.log(parsed);
console.log('  root =', JSON.stringify(parsed.root));
console.log('  dir  =', parsed.dir);
console.log('  base =', parsed.base);
console.log('  ext  =', parsed.ext);
console.log('  name =', parsed.name);

// 有个容易记混的等式：base === name + ext。
console.log('校验 base === name + ext ：', parsed.base === parsed.name + parsed.ext);

// format 是 parse 的逆运算，把对象拼回字符串。
// 规则：如果提供了 dir，就忽略 root；base 优先于 name+ext。
//
// 但要小心：parse 出来的 dir 是「原样切片」，而 format 重新拼接时用的是**平台分隔符**。
// 所以下面这个看起来完美的还原，在 Windows 上会变成 '/home/user/docs\report.pdf'。
const rebuilt = path.format(parsed);
console.log('path.format(parse(...)) 还原结果 =', rebuilt);
console.log('是否与原始路径逐字符一致：', rebuilt === '/home/user/docs/report.pdf');
console.log('（Windows 上 dir 与 base 之间被换成了反斜杠，见"跨平台差异"一节）');

// 要点：parse/format 的往返一致性只在"路径风格与平台一致"时成立。
// 想稳定处理 POSIX 风格路径，就显式用 path.posix —— 这样在任何平台上结果都一样。
const posixParsed = path.posix.parse('/home/user/docs/report.pdf');
console.log('path.posix.format 还原结果 =', path.posix.format(posixParsed));
console.log(
  '是否与原始路径逐字符一致：',
  path.posix.format(posixParsed) === '/home/user/docs/report.pdf',
);

// 实战：重命名文件时"换扩展名"。这是最典型的 parse + format 组合场景。
function changeExtension(filePath, newExt) {
  const p = path.parse(filePath);
  // 用 format 只覆盖 ext 字段，其余保持不变。
  // 注意 name 与 base 同时存在时以 base 为准，所以这里要同时给出 name 和 ext。
  return path.format({ ...p, base: undefined, ext: newExt });
}
console.log("changeExtension('src/app.js', '.ts') =", changeExtension('src/app.js', '.ts'));
console.log("changeExtension('a/b/c.txt', '.md') =", changeExtension('a/b/c.txt', '.md'));

// 实战：把一堆文件放到"同名子目录"里。
function toFolderVariant(filePath) {
  const p = path.parse(filePath);
  // 用 name 而不是 base，就能去掉扩展名作为目录名。
  return path.join(p.dir, p.name, p.base);
}
console.log("toFolderVariant('a/b/c.txt') =", toFolderVariant('a/b/c.txt'));

// ---------------------------------------------------------------------------
// 6. normalize / relative / isAbsolute
// ---------------------------------------------------------------------------

console.log('--- 6. normalize / relative / isAbsolute ---');

// normalize 只做规范化，不会因为结果不是绝对路径就去补 cwd。
console.log("path.normalize('a//b/./c/../d') =", path.normalize('a//b/./c/../d'));

// relative(from, to) 求"从 from 到 to 怎么走"。
// 常用于生成日志里的可读路径（相对仓库根显示）。
console.log("path.relative('/a/b', '/a/b/c/d.txt') =", path.relative('/a/b', '/a/b/c/d.txt'));
console.log("path.relative('/a/b/c', '/a/d.txt') =", path.relative('/a/b/c', '/a/d.txt'));

// 实战：把绝对路径转成相对仓库根的路径来打印，日志立刻清爽很多。
const absPath = path.resolve('26_node_core', '02_path_module.js');
console.log('绝对路径：', absPath);
console.log('相对仓库根：', path.relative(process.cwd(), absPath));

// isAbsolute 判断是否为绝对路径。
console.log("path.isAbsolute('/a/b') =", path.isAbsolute('/a/b'));
console.log("path.isAbsolute('a/b') =", path.isAbsolute('a/b'));
// Windows 上带盘符的路径也是绝对路径。
console.log("path.isAbsolute('C:\\\\Windows') =", path.isAbsolute('C:\\Windows'));

// 实战：无论用户给的是绝对还是相对路径，都统一转成绝对路径。
function toAbsolute(p) {
  return path.isAbsolute(p) ? path.normalize(p) : path.resolve(p);
}
console.log('toAbsolute("src/app.js") =', toAbsolute('src/app.js'));

// ---------------------------------------------------------------------------
// 7. 跨平台差异：path.posix 与 path.win32
// ---------------------------------------------------------------------------

console.log('--- 7. 跨平台差异对比 ---');

// path 模块导出的默认对象是"当前平台实现"，行为随运行环境变化。
// 但 path.posix 和 path.win32 两个属性始终存在，分别对应两种平台规则，
// 这让"跨平台代码的测试"变得可行：不用切系统就能验证另一平台的行为。
const posix = path.posix;
const win32 = path.win32;

// 同一个拼接，两个平台给出不同分隔符。
console.log('POSIX 拼接：', posix.join('a', 'b', 'c'));
console.log('Win32 拼接：', win32.join('a', 'b', 'c'));

// 差异一：分隔符方向。
// POSIX 只认 '/'；Win32 同时认 '\\' 和 '/'，并统一输出 '\\'。
console.log('POSIX 解析 "a/b" 的 basename：', posix.basename('a/b'));
console.log('Win32 解析 "a\\\\b" 的 basename：', win32.basename('a\\b'));

// 差异二：绝对路径的定义。
// POSIX 里以 '/' 开头即为绝对路径；
// Win32 里 '/' 开头的路径**也算**绝对路径（因为它是"当前盘符的根"）。
console.log("POSIX isAbsolute('/a/b') =", posix.isAbsolute('/a/b'));
console.log("Win32 isAbsolute('/a/b') =", win32.isAbsolute('/a/b'));
console.log("Win32 isAbsolute('C:\\\\a') =", win32.isAbsolute('C:\\a'));
// 但纯盘符相对路径 'C:a'（表示 C 盘当前目录）在 Win32 里**不是**绝对路径。
console.log("Win32 isAbsolute('C:a') =", win32.isAbsolute('C:a'), '（盘符相对路径不算绝对）');

// 差异三：parse 出来的 root 不同。
console.log('POSIX parse("/a/b.txt").root =', JSON.stringify(posix.parse('/a/b.txt').root));
console.log('Win32 parse("C:\\\\a\\\\b.txt").root =', JSON.stringify(win32.parse('C:\\a\\b.txt').root));
// Win32 还能识别 UNC 路径（网络共享），root 形如 '\\\\server\\share\\'。
console.log('Win32 parse UNC 路径的 root =', JSON.stringify(win32.parse('\\\\server\\share\\file.txt').root));

// 差异四：POSIX 里反斜杠是**合法文件名字符**，不是分隔符。
// 所以在 Linux 上创建名为 'a\b.txt' 的文件是完全合法的，
// 而这段代码在 Windows 上会被当成目录 a 下的 b.txt。跨平台代码的大坑之一。
console.log('POSIX basename("a\\\\b.txt") =', posix.basename('a\\b.txt'), '（整个当文件名）');
console.log('Win32 basename("a\\\\b.txt") =', win32.basename('a\\b.txt'), '（拆成目录 a + 文件 b.txt）');

// 差异五：resolve 的兜底基准。
// 当前平台版本用 cwd 兜底；固定平台版本若要绝对路径也需要 cwd，但分隔符永远按该平台输出。
console.log('Win32 resolve("a", "b") =', win32.resolve('a', 'b'));
console.log('POSIX resolve("a", "b") =', posix.resolve('a', 'b'));

// ---------------------------------------------------------------------------
// 8. 为什么不建议手工拼路径
// ---------------------------------------------------------------------------

console.log('--- 8. 手工拼路径的问题 ---');

// 反面教材：直接字符串相加。
// 在 Windows 上得到 'data/users/1.txt'，混用了 '/'，虽然 Node 多数场景能容忍，
// 但一旦要展示给用户、写进日志、或作为命令参数传给别的程序，就会显得不一致。
const bad = 'data' + '/' + 'users' + '/' + 1 + '.txt';
console.log('手工拼接结果：', bad, '（用了硬编码的 /）');
console.log('path.join 结果：', path.join('data', 'users', '1.txt'));

// 更危险的是"拼接用户输入"。如果用户输入里含 '..'，就能跳到上级目录。
// 这里用一个想象的场景演示：只做字符串拼接时，越界路径不会被拦下。
const userInput = '../../etc/passwd';
const naive = 'uploads/' + userInput;
console.log('用户输入：', userInput);
console.log('天真拼接：', naive, '（指向了 uploads 之外！）');

// 用 join 规范化后，能看出它确实"跳出去了"。join 本身不做安全校验，
// 它只负责把路径规范化成"真实含义"，从而让**校验**成为可能。
const normalized = path.join('uploads', userInput);
console.log('join 规范化后：', normalized);
const uploadsRoot = path.resolve('uploads');
const target = path.resolve(normalized);
// 校验思路：解析成绝对路径后，判断目标是否仍在允许的根目录之内。
// 注意要比较 '根 + 分隔符'，否则 '/uploads-evil' 会被误判为 '/uploads' 的子路径。
const isInside = target === uploadsRoot || target.startsWith(uploadsRoot + path.sep);
console.log('是否仍在 uploads 目录内：', isInside, '（这是必须做的安全校验）');

console.log('--- 全部演示结束 ---');
