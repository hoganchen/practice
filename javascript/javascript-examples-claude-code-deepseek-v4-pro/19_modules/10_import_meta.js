/**
 * ============================================================================
 * 知识点：import.meta.url 与 import.meta.dirname / filename，以及与 __dirname 的对比
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】进阶
 * 【前置知识】19_modules/08_module_scope.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    import.meta 是 ESM 提供的"当前模块的元信息对象"，宿主环境往里面放信息：
 *      import.meta.url      当前模块的完整 URL，例如 file:///C:/repo/19_modules/10_import_meta.js
 *      import.meta.dirname  当前模块所在目录（Node 20.11+ / 21.2+ 提供）
 *      import.meta.filename 当前模块的完整路径（Node 20.11+ / 21.2+ 提供）
 *      import.meta.resolve(specifier) 以当前模块为基准解析路径（Node 20.6+ 提供）
 *    而 CommonJS 里对应的是三个"注入"的变量：__filename、__dirname、require。
 *
 * 2. 为什么需要
 *    (1) 读文件、拼路径时必须以"文件自身位置"为基准，而不是 process.cwd()。
 *        用户可能在任意目录启动程序，用 cwd 拼路径就会找不到文件。
 *    (2) ESM 里没有 __dirname / __filename 这两个"魔法变量"
 *        （它们是 CJS 包装函数的参数，ESM 没有这层包装），
 *        所以必须换成 import.meta 系列。
 *    (3) import.meta 是"可扩展"的：打包器/框架常在它上面挂自己的字段
 *        （如 Vite 的 import.meta.env、import.meta.hot），这是它的设计意图。
 *
 * 3. 核心语法要点
 *    (1) import.meta 只能在模块里用；在 CJS 里写 import.meta 会直接报语法错误。
 *    (2) import.meta.url 是一个 **URL 字符串**（file:// 开头），不是普通路径。
 *        要传给 fs 用，必须先转换：
 *          import { fileURLToPath } from 'node:url';
 *          const filePath = fileURLToPath(import.meta.url);
 *    (3) Node 20.11+ 直接提供了 import.meta.filename / import.meta.dirname，
 *        省去了上面的转换（本仓库要求 Node >= 18，18.x 上这两个字段是 undefined，
 *        所以下面的演示里做了兼容判断）。
 *    (4) 在 CJS 里想拿到 ESM 的元信息，或反过来，可以用
 *        createRequire(import.meta.url) / module.createRequire(__filename) 互通。
 *
 * 4. 常见陷阱
 *    (1) 直接把 import.meta.url 传给 fs.readFile —— 会得到
 *        "ENOENT: no such file or directory, open 'file:///...'"，
 *        因为 fs 要的是文件系统路径，不是 URL。要么转换，要么用 fs 的 URL 支持
 *        （Node 的 fs 函数其实接受 URL 对象：new URL(import.meta.url)，但不能接受字符串）。
 *    (2) Windows 上路径分隔符是 \，而 URL 里永远是 /，混用容易出错；
 *        统一用 path.join / fileURLToPath 处理。
 *    (3) 打包后 import.meta.url 可能被改写成产物路径，动态 import 相对路径会失效。
 *    (4) 以为 import.meta 是"每个模块一份的可写对象"随便挂东西：
 *        虽然规范允许宿主扩展，但在浏览器里它是冻结语义的，不要依赖写入。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/10_import_meta.js
 *
 * 【预期输出】
 *   打印当前模块的 url / dirname / filename，演示 URL 与路径的转换，
 *   用 __dirname 对比说明 ESM 里它为何不存在，并用 import.meta.dirname 读一个文件。
 * ============================================================================
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

// ---------------------------------------------------------------------------
// 1. import.meta 的三个常用字段
// ---------------------------------------------------------------------------

console.log('--- 1. import.meta 的常用字段 ---');
console.log('import.meta.url      =', import.meta.url);
console.log('import.meta.filename =', import.meta.filename);
console.log('import.meta.dirname  =', import.meta.dirname);
console.log('（在 Node 18 上后两个是 undefined，需要用 fileURLToPath 自己算）');

// 用 url 自己算一遍，保证在 Node 18 上也能用
const selfPath = fileURLToPath(import.meta.url);
const selfDir = path.dirname(selfPath);
console.log('\n用 fileURLToPath 手工换算出来的路径：');
console.log('  fileURLToPath(import.meta.url) =', selfPath);
console.log('  path.dirname(...)              =', selfDir);
console.log('与 import.meta.filename / dirname 一致吗？',
  selfPath === import.meta.filename && selfDir === import.meta.dirname);

// 还可以反向转换：路径 → file URL
console.log('  pathToFileURL(selfPath).href   =', pathToFileURL(selfPath).href);

// ---------------------------------------------------------------------------
// 2. 为什么不能用 process.cwd()
// ---------------------------------------------------------------------------

console.log('\n--- 2. cwd 与模块目录的区别 ---');
console.log('process.cwd()（进程启动目录） =', process.cwd());
console.log('import.meta.dirname（本文件所在目录） =', import.meta.dirname);
console.log('本示例是被 `node 19_modules/10_import_meta.js` 从仓库根目录启动的，');
console.log('所以 cwd 是仓库根目录，而模块目录是 19_modules/，两者不同。');
console.log('读"与代码放一起的数据文件"时必须用模块目录，否则换个目录启动就崩。');

// ---------------------------------------------------------------------------
// 3. 用 import.meta 定位并读取同目录下的文件
// ---------------------------------------------------------------------------

console.log('\n--- 3. 用 import.meta 定位文件 ---');

// 把 import.meta.url 转成 URL 对象后，可以直接做相对解析，非常方便
const jsonUrl = new URL('./_data.json', import.meta.url);
console.log('数据文件 URL =', jsonUrl.href);

// Node 的 fs 既接受路径字符串，也接受 file:// URL 对象（注意是对象，不是字符串）
const rawText = fs.readFileSync(jsonUrl, 'utf8');
console.log('读到的字节数 =', rawText.length);
console.log('用 path 拼出来的等价路径 =', path.join(import.meta.dirname, '_data.json'));
console.log('两种方式指向同一个文件：',
  fs.existsSync(path.join(import.meta.dirname, '_data.json')));

// ---------------------------------------------------------------------------
// 4. __dirname / __filename 在 ESM 里不存在
// ---------------------------------------------------------------------------

console.log('\n--- 4. __dirname 在 ESM 里为何不可用 ---');

// 在 CommonJS 里，Node 会把每个文件包进一个函数：
//   (function (exports, require, module, __filename, __dirname) { ...你的代码... })
// __dirname 就是这个包装函数的参数，所以随处可用。
// ESM 没有这层包装，因此这两个名字**根本没有被定义**。
console.log('typeof __dirname  =', typeof __dirname);
console.log('typeof __filename =', typeof __filename);
console.log('直接写 __dirname 会抛 ReferenceError: __dirname is not defined');

// 实测一下这个 ReferenceError（用 try/catch 接住，避免进程崩溃）
try {
  // eslint-disable-next-line no-undef
  console.log('__dirname =', __dirname);
} catch (err) {
  console.log('捕获到：', err.constructor.name, '-', err.message);
}

// 想用旧写法只有两条路：
//   1) 用 fileURLToPath(import.meta.url) 自己算（推荐）
//   2) 用 createRequire 造一个 require，再拿 require('node:path') 等
const esmDirname = path.dirname(fileURLToPath(import.meta.url));
console.log('手工补出来的 __dirname 等价物 =', esmDirname);

// ---------------------------------------------------------------------------
// 5. import.meta.resolve：以当前模块为基准解析路径
// ---------------------------------------------------------------------------

console.log('\n--- 5. import.meta.resolve ---');

if (typeof import.meta.resolve === 'function') {
  // 解析相对路径：得到的是绝对 URL，而不是去加载模块
  console.log('import.meta.resolve("./_math-utils.js") =', import.meta.resolve('./_math-utils.js'));
  console.log('解析内置模块："node:path" →', import.meta.resolve('node:path'));
} else {
  console.log("当前 Node 版本没有 import.meta.resolve，可用 new URL('./x.js', import.meta.url) 代替");
}

// 手动等价写法（任何版本都能用）：
console.log('等价的手工写法 new URL("./_math-utils.js", import.meta.url).href =',
  new URL('./_math-utils.js', import.meta.url).href);

// ---------------------------------------------------------------------------
// 6. 小结对照表
// ---------------------------------------------------------------------------

console.log('\n--- 6. ESM 与 CJS 的路径元信息对照 ---');
console.log('功能            CommonJS                ESM');
console.log('当前文件路径    __filename              import.meta.filename / fileURLToPath(import.meta.url)');
console.log('当前目录        __dirname               import.meta.dirname / path.dirname(...)');
console.log("加载模块        require('./x.js')       import('./x.js') / import x from ...");
console.log('模块元信息对象  module                  import.meta');
console.log('注意：import.meta.url 是 URL 字符串，传给 fs 前要用 fileURLToPath 转成路径。');
