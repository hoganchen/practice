/**
 * ============================================================================
 * 知识点：debugger 语句与非交互式调试 —— --inspect / DevTools / node inspect
 * ============================================================================
 *
 * 【所属分类】37_debugging_and_profiling —— 调试与性能剖析
 * 【难度等级】进阶
 * 【前置知识】20_error_handling/03_error_properties.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Node.js 内置了基于 V8 Inspector 协议的调试能力，它把"进程内部的状态"
 *    通过一个 WebSocket 端口暴露出去，外部工具（Chrome DevTools、VS Code、
 *    命令行调试器 node inspect）连上来之后，就能断点、单步、看变量、改值。
 *    触发方式有两种：代码里的 debugger 语句，和命令行的 --inspect 系列开关。
 *
 * 2. 为什么需要（真实项目场景）
 *    - console.log 调试的问题：要看 10 个变量就得改 10 次代码、跑 10 遍；
 *      交互式调试器可以"停下来随便看"，还能看到完整作用域链和调用栈；
 *    - 线上问题复现：本地跑不起来的环境问题，可以通过 --inspect 连上去看现场；
 *    - 复杂异步流程：断点配合"条件断点""日志断点"，能在不打断执行的前提下
 *      观察某一次特定请求的内部状态；
 *    - 单元测试里定位失败用例：VS Code 的 "Debug Test" 直接复用同一套机制。
 *
 * 3. 核心语法要点
 *    (1) debugger 语句：一个语句级的断点。只有在"调试器已连接"时才生效；
 *        没有调试器连接时，它是一个空操作（no-op），不会报错、不会挂起。
 *    (2) node --inspect：启动调试服务器（默认 127.0.0.1:9229），
 *        程序【照常运行】，调试器随时可以连上来或者断开。
 *    (3) node --inspect-brk：同上，但【在第一行代码之前就暂停】，
 *        等着调试器连上来。适合调试"启动阶段"的代码或配置文件加载过程。
 *    (4) node inspect script.js：使用 Node 自带的命令行调试器（基于
 *        node:inspector 的 CLI 前端），无需浏览器，适合服务器/容器环境。
 *    (5) 端口语法统一为 --inspect[=host:port]，例如 --inspect=0.0.0.0:9230。
 *    (6) 进程内可以通过 node:inspector 模块查询"当前是否被调试"：
 *        inspector.url() 返回 ws:// 地址或 undefined。
 *
 * 4. 常见陷阱
 *    - 陷阱一：以为 debugger 语句会让程序卡住。没有调试器连接时它什么都不做，
 *      所以一段带 debugger 的代码在 CI 里也能正常跑完——但它确实会拖慢执行
 *      （V8 需要检查调试状态），而且容易忘记删除，所以用 ESLint 的
 *      no-debugger 规则拦住它。
 *    - 陷阱二：在生产环境开 --inspect=0.0.0.0:9229。调试协议允许
 *      【执行任意代码】，等于把一个远程代码执行后门开到公网上。
 *      必须调试时只绑 127.0.0.1，再通过 SSH 隧道转发。
 *    - 陷阱三：用 --inspect 去调"启动就崩"的脚本，结果还没来得及连上就退出了。
 *      这时要用 --inspect-brk。
 *    - 陷阱四：把 --inspect 写进 NODE_OPTIONS 的环境变量里长期生效
 *      （NODE_OPTIONS 确实允许 --inspect），后果同上，属于安全事故。
 *    - 陷阱五：在 Docker 容器里 --inspect 后连不上，因为默认只监听 127.0.0.1。
 *      需要明确写成 --inspect=0.0.0.0:9229 并把端口映射出来——同时接受
 *      "容器网络里谁都能连"的风险。
 *    - 陷阱六：以为断点一定停在"自己写的那一行"。经过转译/打包的代码里，
 *      断点位置需要 Source Map 才能对上（见 03_source_maps.js）。
 *
 * 【关于本示例的运行方式（重要）】
 *    本示例【不会真的启动调试器】，也不会执行任何 debugger 语句 ——
 *    所有需要交互式调试器的内容都以"打印命令 + 操作步骤"的形式给出，
 *    并统一标记为【需手动操作】。因此本文件用 `node 本文件` 直接运行即可，
 *    不会挂起、不会等待输入，退出码为 0。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 37_debugging_and_profiling/02_debugger_and_inspect.js
 *
 * 【预期输出】
 *   打印 8 个小节：调试能力全景、debugger 语句的真实语义、
 *   --inspect 与 --inspect-brk 的区别、如何用 Chrome DevTools 连接、
 *   VS Code 的 launch.json 配置、断点的高级用法、node inspect 命令行调试器，
 *   以及一套可运行的非交互式调试工具。最后是一份安全检查与操作清单。
 * ============================================================================
 */

import inspector from 'node:inspector';
import util from 'node:util';

const SCRIPT_START = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用小工具
// ---------------------------------------------------------------------------

function section(n, title) {
  console.log(`\n--- ${n}. ${title} ---`);
}

/** 打印一条"需要在另一个终端手动执行"的命令 */
function printManualCommand(command, why) {
  console.log(`  $ ${command}`);
  if (why) console.log(`      ↳ ${why}`);
}

/** 打印一段 JSON 配置（用于展示 launch.json 这类文件内容） */
function printJsonConfig(title, obj) {
  console.log(`${title}：`);
  console.log(
    JSON.stringify(obj, null, 2)
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n'),
  );
}

// ---------------------------------------------------------------------------
// 1. 调试能力全景：三种入口
// ---------------------------------------------------------------------------

section(1, '调试能力全景：三种入口');

console.log('Node.js 的调试能力来自 V8 Inspector，它有且只有三种入口：');
console.log('');
console.log('  入口 A：代码里的 debugger 语句（需要配合下面两种开关之一才有意义）');
console.log('  入口 B：命令行开关 --inspect / --inspect-brk（启动调试服务器）');
console.log('  入口 C：进程内的 node:inspector 模块（程序化控制调试会话）');
console.log('');
console.log('调试器前端（决定你"用什么界面"看）有四种常见选择：');
console.log('  1) Chrome / Edge DevTools：chrome://inspect → Open dedicated DevTools for Node');
console.log('  2) VS Code：内置的 JavaScript Debug Terminal 或 launch.json（最常用）');
console.log('  3) node inspect：Node 自带的命令行调试器（服务器/容器里最好用）');
console.log('  4) 第三方：JetBrains 系列、各种 APM 的调试插件');
console.log('');
console.log('它们的共同点：都是通过 WebSocket 连到那个 9229 端口，');
console.log('  所以"用哪个前端"不影响能做什么，只影响操作体验。');

// ---------------------------------------------------------------------------
// 2. debugger 语句的真实语义
// ---------------------------------------------------------------------------

section(2, 'debugger 语句：语义、生效条件与陷阱');

// 【注意】下面这一行是【字符串】，不是语句，所以它绝对不会被执行。
// 真正的 debugger 语句长这样（去掉引号即可）：
const debuggerStatementSource = 'debugger;';
console.log(`  debugger 语句的源码形式：${debuggerStatementSource}`);
console.log('');
console.log('它的语义只有一句话：');
console.log('  "如果当前进程正在被调试，就在这里暂停；否则什么都不做。"');
console.log('');
console.log('由此推出四条容易踩坑的性质：');
console.log('  (1) 没有调试器连接时它是 no-op —— 不会报错，也不会让进程挂起。');
console.log('      所以 CI 里跑带 debugger 的代码是"能跑完"的；');
console.log('  (2) 但引擎仍然要为它做调试状态检查，属于白白的开销；');
console.log('  (3) 它很容易被忘记删掉，所以主流做法是用 ESLint 的 no-debugger 规则拦住；');
console.log('      在 .eslintrc 里配置：{ "rules": { "no-debugger": "error" } }');
console.log('  (4) 在严格的内容安全策略（CSP）或某些嵌入式引擎里，');
console.log('      它可能被直接忽略，不能指望它一定生效。');
console.log('');
console.log('【需手动操作】想亲手验证"debugger 会暂停"的完整流程：');
printManualCommand(
  'node --inspect-brk 37_debugging_and_profiling/02_debugger_and_inspect.js',
  '用 --inspect-brk 启动，程序会在第一行前停住',
);
console.log('      然后打开 chrome://inspect，点击目标后面的 "inspect" 链接；');
console.log('      在 Sources 面板里给任意一行打上断点，点继续，观察它停下来。');
console.log('');
console.log('【安全提示】本示例刻意不执行 debugger 语句。');
console.log('  eval("debugger;") 或 new Function("debugger;") 会真的执行它——');
console.log('  这两种写法在真实代码里都应该避免，因为它们会让静态检查失效。');

// ---------------------------------------------------------------------------
// 3. --inspect 与 --inspect-brk 的区别
// ---------------------------------------------------------------------------

section(3, '--inspect 与 --inspect-brk：什么时候用哪个');

console.log('两者都会在 127.0.0.1:9229 上启动调试服务器，区别只在于"要不要暂停"：');
console.log('');
console.log('  参数'.padEnd(22) + '启动后是否暂停'.padEnd(18) + '适用场景');
console.log('  ' + '-'.repeat(84));
console.log('  --inspect'.padEnd(20) + '不暂停，照常运行'.padEnd(18) + '调试已经在跑的服务、随时附加上去看现状');
console.log('  --inspect-brk'.padEnd(20) + '第一行代码前暂停'.padEnd(18) + '调试启动流程、模块加载、启动即崩的脚本');
console.log('');
console.log('常用变体（host 与 port 都可以指定）：');
printManualCommand('node --inspect 37_debugging_and_profiling/02_debugger_and_inspect.js', '默认 127.0.0.1:9229');
printManualCommand('node --inspect=9230 app.js', '换端口，避免与本机其他服务冲突');
printManualCommand('node --inspect=0.0.0.0:9229 app.js', '监听所有网卡 —— 危险，见第 8 节');
printManualCommand('node --inspect-brk app.js', '启动前暂停，等调试器连接');
console.log('');
console.log('启动成功时，Node 会在【stderr】上打印类似这样的一行：');
console.log('  Debugger listening on ws://127.0.0.1:9229/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
console.log('  那一串 UUID 是本次调试会话的标识，把它粘贴到支持 WebSocket 直连的工具里也能连。');
console.log('');
console.log('【需手动操作】附加到一个"已经在运行"的进程：');
console.log('  · Linux / macOS：向进程发 SIGUSR1 信号，Node 会就地打开调试端口：');
printManualCommand('kill -USR1 <pid>', '等价于临时打开一个 --inspect 端口');
console.log('  · Windows 没有 SIGUSR1，只能从一开始就用 --inspect 启动，');
console.log('    或者用 VS Code 的 "Auto Attach"（自动附加）功能。');
console.log('');
console.log('【需手动操作】VS Code 里最省事的做法（连 launch.json 都不用写）：');
console.log('  打开命令面板 → 输入 "JavaScript Debug Terminal" → 新建终端 →');
console.log('  在这里面运行 node 命令，VS Code 会自动附加，断点直接生效。');

// ---------------------------------------------------------------------------
// 4. 用 Chrome DevTools 连接：完整步骤
// ---------------------------------------------------------------------------

section(4, '【需手动操作】用 Chrome DevTools 连接');

const devtoolsSteps = [
  '在终端里用 --inspect-brk 启动脚本（或对已运行的进程发 SIGUSR1）',
  'Chrome 地址栏输入 chrome://inspect （Edge 是 edge://inspect）',
  '页面中部会列出 "Remote Target" —— 你的 Node 进程就在里面',
  '想让所有 Node 进程共用一个调试窗口，点 "Open dedicated DevTools for Node"',
  '点目标右侧的 "inspect" 链接，DevTools 会打开并自动连上',
  '进入 Sources 面板 → 左侧 FileSystem 里点 "Add folder to workspace"，把项目根目录加进来',
  '在代码行号上单击设置断点；右键行号可以选条件断点或日志断点',
  '顶部工具栏：恢复/暂停、单步跳过、单步进入、单步跳出、重启调试会话',
  '右侧面板：Scope（作用域链）、Watch（监视表达式）、Call Stack（调用栈）、Breakpoints',
  'Console 面板里可以直接访问当前断点处的变量，也可以修改变量的值',
];
devtoolsSteps.forEach((step, i) => console.log(`  ${String(i + 1).padStart(2)}. ${step}`));

console.log('');
console.log('DevTools 里三个非常好用、但常被忽略的能力：');
console.log('  · Pause on exceptions（Sources 面板右侧的复选框）：');
console.log('    勾上之后，任何未捕获异常都会自动暂停在抛出点，');
console.log('    比"加一堆 console.log 找哪一行抛的"快一个数量级；');
console.log('  · Async 调用栈：暂停时可以勾选显示异步父帧，');
console.log('    对应第 6 节讲的 async stack traces；');
console.log('  · Live Expressions：把表达式钉在面板顶部，单步时实时刷新，');
console.log('    相当于"一次写好的 console.log"，但不需要改代码。');

// ---------------------------------------------------------------------------
// 5. VS Code 的 launch.json 配置
// ---------------------------------------------------------------------------

section(5, '【需手动操作】VS Code 的 launch.json 配置');

console.log('在项目根目录建 .vscode/launch.json，把下面的配置粘进去：');
console.log('');

printJsonConfig('launch.json', {
  version: '0.2.0',
  configurations: [
    {
      type: 'node',
      request: 'launch',
      name: '调试当前打开的文件',
      program: '${file}',
      cwd: '${workspaceFolder}',
      console: 'integratedTerminal',
      skipFiles: ['<node_internals>/**'],
      env: { NODE_ENV: 'development' },
    },
    {
      type: 'node',
      request: 'launch',
      name: '启动并停在第一行',
      program: '${file}',
      stopOnEntry: true,
      skipFiles: ['<node_internals>/**'],
    },
    {
      type: 'node',
      request: 'attach',
      name: '附加到 9229 端口',
      port: 9229,
      restart: true,
      skipFiles: ['<node_internals>/**'],
    },
  ],
});

console.log('');
console.log('字段解读：');
console.log('  type: "node"         → 使用 VS Code 内置的 Node 调试器');
console.log('  request: "launch"    → 由 VS Code 负责启动进程（它可以自己加 --inspect）');
console.log('  request: "attach"    → 附加到一个已经存在的进程上，需要你先手动 --inspect');
console.log('  program              → 入口文件，${file} 表示"当前打开的文件"');
console.log('  cwd                  → 工作目录，影响相对路径的解析（本项目必须能用根目录相对路径）');
console.log('  console: "integratedTerminal" → 输出打到集成终端里（推荐，能显示颜色和交互输入）');
console.log('  stopOnEntry: true    → 等价于 --inspect-brk，启动后立刻停在第一行');
console.log('  skipFiles            → 单步时自动跳过 Node 内部代码，不然会一头扎进 node_modules');
console.log('');
console.log('实用技巧：');
console.log('  · 选 "launch" 时【不需要】自己加 --inspect，VS Code 会挑一个随机端口并接管；');
console.log('  · 只有进程是别的东西启动的（Docker、npm run、pm2）才需要用 "attach"；');
console.log('  · "restart": true 让 attach 配置在目标进程重启后自动重新连上；');
console.log('  · 调试 npm 脚本用 "runtimeExecutable": "npm" + "runtimeArgs": ["run", "dev"]；');
console.log('  · Jest/Vitest 这类测试框架，直接在测试文件里打断点，用 "Debug Test" 更快。');

// ---------------------------------------------------------------------------
// 6. 断点的高级用法：条件断点、日志断点
// ---------------------------------------------------------------------------

section(6, '【需手动操作】断点的高级用法');

console.log('普通行断点的痛点是"停太多次"。三种高级断点解决这个问题：');
console.log('');
console.log('  (1) 条件断点（Conditional Breakpoint）');
console.log('      DevTools：右键行号 → Add conditional breakpoint → 输入条件表达式；');
console.log('      VS Code：右键行号 → Add Conditional Breakpoint；');
console.log('      典型条件：i === 999、user.id === "u_123"、items.length > 100；');
console.log('      意义：只在"出问题的那一次循环/那一个用户"上停下来。');
console.log('');
console.log('  (2) 日志断点（Logpoint）—— 最被低估的功能');
console.log('      DevTools：右键行号 → Add logpoint → 输入 `i=${i}, user=${user.name}`；');
console.log('      VS Code：右键行号 → Add Logpoint（有的版本叫 "Add Log Message"）；');
console.log('      意义：【不暂停、不改代码、不重启】地在控制台打印模板字符串，');
console.log('      相当于"临时插一行 console.log"，看够了直接删掉断点就行。');
console.log('      这是"不想污染代码、又想快速看值"时最正确的工具。');
console.log('');
console.log('  (3) 异常断点（Pause on exceptions）');
console.log('      DevTools：Sources 面板右侧勾选 "Pause on exceptions"，');
console.log('      再勾上 "Pause on caught exceptions" 可以连被 try/catch 吞掉的异常也停住；');
console.log('      VS Code：BREAKPOINTS 面板勾选 "Caught Exceptions" / "Uncaught Exceptions"；');
console.log('      意义：定位"错误被上层吞掉、日志里什么都看不到"的问题。');
console.log('');
console.log('  (4) 其他值得知道的操作');
console.log('      · Watch：把表达式加进监视列表，每步自动求值；');
console.log('      · Call Stack 面板：点任意一帧可以"跳回调用者现场"，看它的局部变量；');
console.log('      · Restart Frame：在调用栈上右键 → Restart frame，');
console.log('        可以【重放】当前这个函数，不改代码反复试，调参神器；');
console.log('      · Console 里可以直接赋值修改变量（如 obj.status = 200）再继续，');
console.log('        但注意这只改了内存，不会改磁盘上的源码。');
console.log('');
console.log('注意一个边界：条件断点/日志断点里的表达式是【每次执行到那一行都要求值的】，');
console.log('  放在每秒几万次的热点循环里会显著拖慢程序，调试完记得删掉。');

// ---------------------------------------------------------------------------
// 7. node inspect：命令行调试器
// ---------------------------------------------------------------------------

section(7, '【需手动操作】node inspect：不用浏览器的调试器');

console.log('服务器、容器、SSH 远程环境里没有图形界面，用 Node 自带的 CLI 调试器：');
printManualCommand(
  'node inspect 37_debugging_and_profiling/02_debugger_and_inspect.js',
  '启动后会停在第一行（node inspect 默认等价于 --inspect-brk）',
);
printManualCommand('node --inspect-brk=9229 app.js', '另一种启动方式（不进入 CLI）');
printManualCommand('node inspect -p <pid>', '连接到【已经运行】的进程，前提是它已用 --inspect 启动');
console.log('');
console.log('进入调试器之后，提示符是 `debug> `，常用命令如下：');
console.log('');
console.log('  命令'.padEnd(26) + '作用');
console.log('  ' + '-'.repeat(80));
const cliCommands = [
  ['cont  或 c', '继续执行，直到下一个断点'],
  ['next  或 n', '单步：跳过函数调用（step over）'],
  ['step  或 s', '单步：进入函数内部（step into）'],
  ['out   或 o', '单步：跳出当前函数（step out）'],
  ['pause', '暂停正在运行的代码'],
  ['restart', '重启被调试的进程，断点保留'],
  ['sb(12)', '在当前文件第 12 行设置断点（set breakpoint）'],
  ['sb("app.js", 30)', '在指定文件的第 30 行设置断点'],
  ['sb(12, "i === 5")', '设置条件断点（第三个参数是条件表达式）'],
  ['cb(12)', '清除第 12 行的断点（clear breakpoint）'],
  ['breakpoints', '列出当前所有断点'],
  ['watch("user.name")', '添加一个监视表达式；unwatch("user.name") 取消'],
  ['exec expr  或 p expr', '在当前上下文里求值并打印，如 p user.id'],
  ['repl', '进入交互式 REPL（Ctrl+C 退回调试模式）'],
  ['where', '打印当前调用栈（相当于"我在哪"）'],
  ['list(5)', '显示当前行前后各 5 行源码（list() 用默认行数）'],
  ['scripts', '列出已加载的所有脚本'],
  ['help', '列出全部命令'],
  ['.exit', '退出调试器（Ctrl+D 同效）'],
];
for (const [cmd, desc] of cliCommands) {
  console.log(`  ${cmd.padEnd(24)}${desc}`);
}
console.log('');
console.log('一次典型的手动调试流程（全程不需要图形界面）：');
console.log('  ① node inspect app.js              ← 停在第一行');
console.log('  ② sb("app.js", 42)                 ← 在可疑的第 42 行打断点');
console.log('  ③ cont                             ← 一直跑到第 42 行');
console.log('  ④ where                            ← 看清调用链，确认是不是这条路径');
console.log('  ⑤ watch("req.headers")             ← 盯住关键变量');
console.log('  ⑥ next / step / out                ← 一步一步走，每步都会打印 watch 的值');
console.log('  ⑦ p req.body                       ← 随时求值查看任意表达式');
console.log('  ⑧ .exit                            ← 收工');

// ---------------------------------------------------------------------------
// 8. 可运行的替代方案：进程内检测 + 非交互式调试工具
// ---------------------------------------------------------------------------

section(8, '可运行：进程内检测调试状态 + 非交互式调试工具');

// 8.1 node:inspector 提供的能力：查询当前是否被调试
const wsUrl = inspector.url();
console.log('node:inspector 模块可以在【进程内】感知调试状态：');
console.log(`  inspector.url()  = ${wsUrl ?? 'undefined'}`);
console.log(`  process.debugPort = ${process.debugPort}`);
console.log(`  process.execArgv  = ${JSON.stringify(process.execArgv)}`);
console.log('');
if (wsUrl) {
  console.log('  当前进程【正在被调试】（你应该是用 --inspect 启动的本文件）。');
  console.log(`  调试会话地址：${wsUrl}`);
} else {
  console.log('  当前进程【没有被调试】（本文件是用普通方式启动的）。');
  console.log('  如果你改用下面这条命令启动，上面的 inspector.url() 就会打印出 ws:// 地址：');
  printManualCommand(
    'node --inspect 37_debugging_and_profiling/02_debugger_and_inspect.js',
    '注意：--inspect 不会暂停程序，脚本依然会正常跑完并退出',
  );
}
console.log('');
console.log('这个 API 的实用价值：库/SDK 可以在被调试时自动切换成"啰嗦日志模式"，');
console.log('  正常情况下保持安静。例如这样一个判断就够了：');
console.log('    const IS_DEBUGGING = Boolean(inspector.url());');
console.log('  另外 node:inspector 还提供 Session 类，可以自己发 CDP 命令（如抓堆快照、');
console.log('  采集 CPU profile），属于进阶用法，本示例不展开。');

// 8.2 没有调试器时，也能高效排查的三件套
console.log('');
console.log('没有调试器可用时（比如 CI 环境），这三件套能覆盖 80% 的场景：');
console.log('');

/** 一个"穷人断点"：打印标签、自定义快照和调用栈，不改控制流 */
function debugBreak(label, snapshot = {}) {
  console.log(`  [BREAK] ${label}`);
  console.log(`    快照：${util.inspect(snapshot, { depth: 2, colors: false, compact: true })}`);
  // console.trace 会打印"当前调用栈"，等价于给这一行拍一张栈快照
  const stackLines = new Error('trace').stack.split('\n').slice(1, 4);
  console.log(`    调用栈（前 3 层）：`);
  for (const line of stackLines) console.log(`      ${line.trim()}`);
}

function computeTotal(items) {
  let total = 0;
  for (const item of items) {
    // 想在"某一个特定的 item"上停下来看现场？生产代码里就用这种条件化快照
    if (item.price < 0) {
      debugBreak('发现负数价格，打印现场', { item, totalSoFar: total, itemsCount: items.length });
    }
    total += item.price;
  }
  return total;
}

const total = computeTotal([
  { name: '键盘', price: 199 },
  { name: '鼠标', price: -1 }, // ← 故意的脏数据
  { name: '显示器', price: 1299 },
]);
console.log(`  计算结果 total = ${total}（脏数据被记录下来了，但流程没有被打断）`);
console.log('');
console.log('三件套小结：');
console.log('  ① 条件化快照：只在满足条件时打印（上面的 debugBreak 就是模板），');
console.log('     避免"打了一堆日志、有用的只有几行"；');
console.log('  ② console.trace()：打印当前调用栈，回答"这段代码是被谁调用的"；');
console.log('  ③ 进程级追踪开关（全部是命令行参数，不改代码）：');
printManualCommand('node --trace-warnings app.js', '打印每个警告的完整调用栈（定位 DeprecationWarning 的来源）');
printManualCommand('node --trace-uncaught app.js', '未捕获异常也带上调用栈信息');
printManualCommand('node --trace-exit app.js', '打印"进程为什么退出"的栈，排查意外 exit');
printManualCommand('NODE_DEBUG=net,http node app.js', '打开 Node 内部模块的调试日志');
printManualCommand('node --enable-source-maps app.js', '让栈里的行列号映射回源码（配合 Source Map，见 03）');
console.log('');
console.log('  另外 util.inspect 的常用参数也值得记住：');
console.log('    util.inspect(obj, { depth: null, colors: true, maxArrayLength: null })');
console.log('    —— depth: null 表示"不管嵌套多深都展开"，排查深层对象时必用。');
console.log(`  本示例里演示的实际调用结果：${util.inspect({ a: { b: { c: [1, 2, 3] } } }, { depth: null })}`);

// ---------------------------------------------------------------------------
// 9. 安全检查与操作清单
// ---------------------------------------------------------------------------

section(9, '安全检查与操作清单');

const checklist = [
  ['绝不在生产环境开 --inspect', '调试协议可以执行任意代码，等于远程代码执行后门'],
  ['需要调试时只绑 127.0.0.1', '--inspect=0.0.0.0:9229 会把后门开到整个网络'],
  ['远程调试用 SSH 隧道转发', 'ssh -L 9229:127.0.0.1:9229 user@host，比暴露端口安全得多'],
  ['不要把 --inspect 固化进 NODE_OPTIONS', '环境变量会长期生效，容易变成"忘了关的后门"'],
  ['容器里调试要显式写 host 与端口', '默认只监听 127.0.0.1，容器外连不上'],
  ['调试启动阶段用 --inspect-brk', '--inspect 来不及连上，进程可能已经跑完或崩了'],
  ['用 no-debugger 规则拦住 debugger 语句', '防止它被提交进主干代码'],
  ['调试完删掉条件断点/日志断点', '它们的表达式每次执行都要求值，热点路径上很慢'],
  ['CI 环境用 --trace-* 系列替代断点', '非交互环境下只有日志可用'],
  ['先想清楚"要观察什么"再动手', '带着假设去打断点，比"到处乱停"快得多'],
];

console.log('要点'.padEnd(38) + '说明');
console.log('-'.repeat(92));
for (const [item, reason] of checklist) {
  console.log(item.padEnd(36) + reason);
}

console.log('');
console.log('本示例刻意【没有】启动任何调试器，也没有执行任何 debugger 语句，');
console.log('  所有交互式操作都以命令和步骤的形式给出，需要时请照着【手动操作】。');
console.log(`\n本示例总耗时约 ${Date.now() - SCRIPT_START} ms。`);
console.log('示例结束。');
