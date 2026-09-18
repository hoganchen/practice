/**
 * ============================================================================
 * 知识点：process 全局对象 —— 进程信息、argv、env 与 nextTick
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】入门
 * 【前置知识】00_hello_world/01_hello_world.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    process 是 Node.js 注入的全局对象，代表"当前正在运行的这个 node 进程"。
 *    它不用 require/import，任何模块里都能直接访问。
 *    通过它我们能读取命令行参数、环境变量、工作目录、进程号，
 *    也能写标准输出、注册进程生命周期钩子、甚至让进程主动退出。
 *    可以说 process 是 JS 代码与操作系统之间最直接的一扇窗。
 *
 * 2. 为什么需要
 *    浏览器里的 JS 有 window / document，但没有"进程"概念。
 *    到了服务端，程序需要知道：我被谁启动的？带了什么参数？
 *    运行在什么系统上？配置文件路径在哪？——这些全靠 process。
 *    命令行工具、构建脚本、服务器程序的入口逻辑几乎都会先读 process.argv 和 process.env。
 *
 * 3. 核心语法要点
 *    - process.argv        命令行参数数组，[0] 是 node 可执行文件，[1] 是脚本路径，[2..] 才是用户参数
 *    - process.env         环境变量对象，值永远是字符串（或 undefined）
 *    - process.cwd()       当前工作目录（cwd），与脚本所在目录是两回事
 *    - process.pid         进程号；process.ppid 父进程号
 *    - process.platform    平台标识：'win32' / 'darwin' / 'linux'
 *    - process.version     Node 版本，如 'v24.16.0'；process.versions 是各组件版本
 *    - process.exitCode    设置进程退出码（推荐用法）
 *    - process.exit(code)  立即终止进程（危险，见陷阱 4）
 *    - process.nextTick(fn) 在当前操作结束后、进入事件循环下一阶段前立即执行 fn
 *    - process.stdout / process.stderr  标准输出 / 标准错误流
 *
 * 4. 常见陷阱
 *    陷阱 1：把 argv 的前两项当成用户参数。索引 0/1 固定是 node 路径和脚本路径，
 *            用户参数从索引 2 开始。正确做法是 const args = process.argv.slice(2)。
 *    陷阱 2：以为 process.env 的值是数字或布尔。它永远是字符串：
 *            环境变量 PORT=3000 读出来是 '3000' 而不是 3000，需要自己 Number() 转换。
 *    陷阱 3：以为 process.cwd() 是"脚本所在目录"。它是你敲命令时所在的目录。
 *            `node a/b/c.js` 在仓库根执行时，cwd 是仓库根，而不是 a/b。
 *    陷阱 4：在向管道写大量输出后立刻 process.exit()，输出可能被截断，
 *            因为管道写入是异步的。推荐设置 process.exitCode 后让进程自然结束。
 *    陷阱 5：process.nextTick 不是 setTimeout(fn, 0)。nextTick 的优先级更高，
 *            递归调用 nextTick 会饿死事件循环（I/O 永远排不上队）。
 *    陷阱 6：在 ESM 模块里，"nextTick 优先于 Promise"这条经典结论会反过来。
 *            因为 ESM 模块体本身是在一个 Promise 任务中求值的，
 *            本文件第 6 节有实测输出与原理说明。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/01_process_object.js
 *
 * 【预期输出】
 *   打印 Node 版本、平台、进程号、工作目录、argv、环境变量示例、
 *   标准输出/错误流的演示，以及 nextTick 与微任务、定时器的执行顺序对比。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 进程与运行时身份信息
// ---------------------------------------------------------------------------

console.log('--- 1. 进程身份信息 ---');

// process.version 是 Node.js 的版本号字符串，形如 'v24.16.0'。
console.log('Node 版本：', process.version);

// process.versions 是一个对象，列出 V8、OpenSSL、libuv 等各组件的版本。
// 排查"某个 API 在这个 Node 上行为不一致"时很有用。
console.log('V8 引擎版本：', process.versions.v8);
console.log('libuv 版本：', process.versions.uv);

// process.platform 返回编译 Node 时的目标平台。
// 常见值：'win32'（Windows）、'darwin'（macOS）、'linux'。
// 注意 Windows 是 'win32' 而不是 'windows'——这是历史遗留命名。
console.log('平台：', process.platform);

// process.arch 是 CPU 架构，常见 'x64' / 'arm64'。
console.log('CPU 架构：', process.arch);

// pid 是本进程号，ppid 是启动它的父进程号。
// 在批处理脚本里常把 pid 写进临时文件名，避免并发冲突。
console.log('本进程 PID：', process.pid);
console.log('父进程 PPID：', process.ppid);

// process.execPath 是当前 node 可执行文件的绝对路径。
// 子进程示例里要用 node 时，用它比硬编码 'node' 更可靠。
console.log('node 可执行文件：', process.execPath);

// ---------------------------------------------------------------------------
// 2. process.argv —— 命令行参数
// ---------------------------------------------------------------------------

console.log('--- 2. process.argv 命令行参数 ---');

// argv 是"argument vector"（参数向量）的缩写，是一个字符串数组。
// 无论你写多少个参数，前两个位置是固定的：
//   argv[0] = node 可执行文件路径
//   argv[1] = 正在执行的脚本文件路径
//   argv[2..] = 用户真正传入的参数
console.log('argv 长度：', process.argv.length);
console.log('argv[0]（node 可执行文件）：', process.argv[0]);
console.log('argv[1]（当前脚本路径）：', process.argv[1]);

// 所以取"用户参数"的正确写法是 slice(2)。
// 这里直接运行没有额外参数，所以得到空数组。
const userArgs = process.argv.slice(2);
console.log('用户参数 slice(2)：', userArgs);

// 想自己体会参数传递，可以这样运行：
//   node 26_node_core/01_process_object.js --name 张三 --verbose
// 那样 userArgs 就会是 [ '--name', '张三', '--verbose' ]。
console.log('提示：可用 node 26_node_core/01_process_object.js --name 张三 观察 argv 变化');

// ---------------------------------------------------------------------------
// 3. process.env —— 环境变量
// ---------------------------------------------------------------------------

console.log('--- 3. process.env 环境变量 ---');

// 环境变量是操作系统传给进程的键值对，常用于注入配置（密钥、端口、环境名）。
// 值一律是字符串；不存在的键访问得到 undefined。
//
// 注意 PATH 在 Windows 上键名可能是 'Path'（大小写不固定），
// 所以读环境变量时常用 `process.env.PATH || process.env.Path` 这种兜底写法。
const pathVar = process.env.PATH || process.env.Path || '';
console.log('PATH 是否存在：', Boolean(pathVar), '长度：', pathVar.length);

// Node 运行时会自带一些环境变量，NODE_VERSION 就是其中之一（由 node 可执行文件设置）。
// 不同 shell / 平台下并不保证都有，所以这里做存在性判断再输出，避免打印 undefined 让人困惑。
if (process.env.NODE_VERSION) {
  console.log('NODE_VERSION =', process.env.NODE_VERSION);
}

// 读环境变量的标准姿势：给出默认值。
// 因为可能是 undefined，直接参与运算会得到 NaN 或 'undefined' 字符串。
// 用 ?? （空值合并）只在 null/undefined 时回退，比 || 更精确
//（|| 会把空字符串、'0' 这类合法值也当成假值丢掉）。
const port = Number(process.env.PORT ?? 3000);
console.log('端口（未设置时默认 3000）：', port, '类型：', typeof port);

// 演示"字符串型"这个坑：自己写一个环境变量再读回来。
process.env.DEMO_FLAG = 'true';
console.log('DEMO_FLAG 的值：', JSON.stringify(process.env.DEMO_FLAG), '类型：', typeof process.env.DEMO_FLAG);
// 它不等于布尔 true，必须显式比较或转换：
console.log('是否等于布尔 true：', process.env.DEMO_FLAG === true);
console.log('显式判断是否为真：', process.env.DEMO_FLAG === 'true');

// 删除环境变量用 delete 运算符。
delete process.env.DEMO_FLAG;
console.log('删除后再次读取：', process.env.DEMO_FLAG);

// ---------------------------------------------------------------------------
// 4. process.cwd() —— 当前工作目录
// ---------------------------------------------------------------------------

console.log('--- 4. process.cwd() 与脚本目录的区别 ---');

// cwd = current working directory，即"你敲命令时所在的那个目录"。
// 它和"脚本文件所在目录"完全无关。
console.log('当前工作目录 cwd：', process.cwd());

// 从 argv[1] 拿到的脚本路径是"启动时的路径"，可能是相对路径。
// 想要脚本所在目录，通常结合 node:url 的 fileURLToPath 与 node:path 的 dirname。
// （详见 02_path_module.js 与 03_url_module.js）
console.log('argv[1] 记录的脚本路径：', process.argv[1]);

// 为什么要在意这个区别？
// 因为 fs.readFileSync('./config.json') 里的 './' 是相对 cwd 解析的，
// 而不是相对脚本文件。脚本被移到别处调用时就会找不到文件。
console.log('提示：相对路径的基准是 cwd，不是脚本目录，这是新手最常见的文件读不到的原因。');

// ---------------------------------------------------------------------------
// 5. process.stdout / process.stderr —— 两个输出流
// ---------------------------------------------------------------------------

console.log('--- 5. 标准输出与标准错误 ---');

// console.log 本质上就是往 process.stdout 写数据并换行。
// 直接调用 write 可以精确控制内容（不自动换行）。
process.stdout.write('这行由 process.stdout.write 输出');
process.stdout.write('，同一行继续追加。\n');

// stderr 用来输出"错误 / 警告"信息。
// 关键区别：重定向时可以分开处理——
//   node app.js > out.txt 2> err.txt
// 这样正常输出进 out.txt，错误进 err.txt，互不污染。
process.stderr.write('[stderr] 这行写到了标准错误流（不是程序的错误，只是演示）。\n');

// 两个流都有 isTTY 属性：为 true 表示连着终端（而不是被重定向到文件/管道）。
// 我们据此决定要不要输出彩色字符——重定向时彩色转义码只会变成乱码。
console.log('stdout 是否连接终端 isTTY：', Boolean(process.stdout.isTTY));
console.log('stderr 是否连接终端 isTTY：', Boolean(process.stderr.isTTY));

// 在脚本中尽量用 console.error 而不是 process.stderr.write，
// 前者会做格式化、自动换行，可读性更好。
console.error('[console.error] 等价于往 stderr 输出一行。');

// ---------------------------------------------------------------------------
// 6. process.nextTick —— 最高优先级的"插队"
// ---------------------------------------------------------------------------

console.log('--- 6. nextTick 与执行顺序 ---');

// 四类任务的常规优先级（从高到低）：
//   a) 同步代码
//   b) process.nextTick 回调
//   c) Promise.then / await 等微任务（microtask）
//   d) setTimeout 等宏任务（macrotask）
//
// 下面按打乱顺序注册回调，观察实际打印顺序。
// 剧透一句重要的实测结论：本仓库全部使用 ESM（package.json 里 "type": "module"），
// 在 ESM 里 nextTick 与 Promise 的先后会反过来，原因见本节末尾的专门说明。
const order = [];

setTimeout(() => {
  order.push('setTimeout（宏任务，最晚）');
  console.log('实际执行顺序：', order.join(' -> '));
}, 0);

Promise.resolve().then(() => {
  order.push('Promise.then（微任务）');
});

process.nextTick(() => {
  order.push('nextTick（插队，最早）');
});

// 注意这一行是同步代码，一定最先执行。
order.push('同步代码（第一）');
console.log('同步阶段结束，此时 order =', order.join(' -> '));

// process.nextTick 还有个带参数的写法，用于给回调传参，避免闭包捕获：
process.nextTick(
  (tag) => console.log('nextTick 带参数回调收到：', tag),
  '来自 nextTick 的参数',
);

// ---- 4) 为什么本文件里 Promise 排在 nextTick 前面？----
//
// 上面打印出来的顺序是：同步代码 -> Promise.then -> nextTick -> setTimeout，
// 这与"nextTick 优先于 Promise"的经典结论相反。原因在于本文件是 ESM 模块：
//
//   · 在 CommonJS 里，模块体是由 C++ 层"同步"调用执行的。执行完毕后，
//     Node 会先调用内部函数把 nextTick 队列排空，之后才让 V8 处理微任务队列。
//     所以顺序是：同步 -> nextTick -> Promise.then -> setTimeout。
//
//   · 在 ESM 里，模块体是在一个 Promise 任务（module job）中求值的，
//     也就是说"同步代码"本身已经身处微任务队列内部。V8 会把微任务队列
//     一口气排空，我们的 Promise.then 就在其中被执行；只有等到这一整批
//     微任务跑完、控制权回到 Node 之后，Node 才有机会去排空 nextTick 队列。
//     所以顺序变成了：同步 -> Promise.then -> nextTick -> setTimeout。
//
// 结论：不要依赖 nextTick 与 Promise 的精确先后顺序。
// 两者都属于"本轮操作结束后立刻执行"，都不应该被用来做顺序敏感的调度。
// 想验证 CJS 的相反顺序，可以写一个 .cjs 文件对比运行。

// 陷阱：递归的 nextTick 会饿死事件循环。
// 下面演示"为什么不能这么写"——只递归 3 次就停，避免真的卡死进程。
let tickCount = 0;
function recursiveTick() {
  tickCount += 1;
  if (tickCount <= 3) {
    // 每次都在"下一轮 nextTick 队列"里再插一个，事件循环永远轮不到 I/O 与定时器。
    process.nextTick(recursiveTick);
  } else {
    console.log('递归 nextTick 演示结束，共执行', tickCount, '次（真实代码中不要这样递归）。');
  }
}
recursiveTick();

// ---------------------------------------------------------------------------
// 7. 进程退出：exitCode 与 exit
// ---------------------------------------------------------------------------

console.log('--- 7. 退出码与 exit 事件 ---');

// process.exitCode 只是"记账"：设置之后进程仍然会自然跑完，
// 最后以这个码退出。这是官方推荐的写法。
process.exitCode = 0;

// process.on('exit', fn) 注册的回调在进程即将退出时执行。
// 它有个硬限制：回调里只能做同步操作——任何异步任务都不会有机会执行了。
process.on('exit', (code) => {
  // 这里只能用 console.log 这类同步输出，不能写 setTimeout / 异步 fs。
  console.log(`[exit 事件] 进程即将退出，退出码 = ${code}`);
});

// process.exit(0) 会"立刻"终止进程，跳过所有未完成的异步操作，
// 甚至可能截断还没刷新到管道的 stdout 数据，因此这里只作说明、不实际调用。
console.log('提示：process.exit(code) 会立刻终止进程，可能截断输出；优先使用 process.exitCode = 0。');

// 让脚本在最后输出一行"正常结束"的标记，方便确认没有中途崩溃。
console.log('--- 全部演示结束，进程将自然退出，退出码 0 ---');
