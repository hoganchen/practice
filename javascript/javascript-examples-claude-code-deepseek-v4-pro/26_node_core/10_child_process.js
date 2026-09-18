/**
 * ============================================================================
 * 知识点：node:child_process —— spawn / exec / execFile 的区别
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】进阶
 * 【前置知识】26_node_core/08_streams_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:child_process 让 Node 能够启动**别的进程**并与之通信。
 *    它提供四个主要方法，恰好构成一张"要不要 shell / 要不要等结果"的二维表：
 *
 *      方法          走 shell吗   输出形式        阻塞吗   适用场景
 *      spawn         否          流（边产边读）   否      大输出、长跑进程、实时日志
 *      exec          是          整个缓冲成字符串  否      短命令、需要管道/通配符等 shell 特性
 *      execFile      否          整个缓冲成字符串  否      短命令且不需要 shell（最安全）
 *      spawnSync     否          Buffer           **是**  脚本里的同步调用
 *      （另有 execSync / execFileSync，同理）
 *
 *    共同的父类型是 ChildProcess（继承自 EventEmitter，见 07），
 *    所以子进程的输出是**流**（child.stdout / child.stderr），
 *    生命周期事件是 'spawn' / 'exit' / 'close' / 'error'。
 *
 * 2. 为什么需要
 *    有些活自己实现不如调用现成程序：调用 git 取版本号、调用 ffmpeg 转码、
 *    调用 python 跑数据脚本、调用 npm 装依赖。
 *    更重要的是**隔离**：子进程崩溃不会带走主进程，且能享受多核——
 *    Node 主线程只有一个，要真正并行跑 CPU 密集任务，开子进程是最直接的办法
 *    （更进一步的是 worker_threads，见 14_worker_threads.js）。
 *
 * 3. 核心语法要点
 *    - spawn(command, args?, options?)         args 是数组，**不经过 shell**
 *    - exec(command, options?, cb)             command 是完整 shell 命令行
 *    - execFile(file, args?, options?, cb)     不经过 shell 的 exec
 *    - spawnSync / execSync / execFileSync     同步版本，返回结果对象而不是子进程
 *    - 通用 options：cwd / env / stdio / shell / timeout / maxBuffer / windowsHide
 *    - child.stdout / child.stderr             可读流；stdio 为 'inherit' 时是 null
 *    - child.stdin                             可写流，可以喂数据给子进程
 *    - child.pid / child.killed / child.exitCode / child.signalCode
 *    - child.on('close', (code, signal) => {}) 标准输出流已关闭且进程已退出
 *    - child.on('exit', (code, signal) => {})  进程退出（流可能还没关完）
 *    - child.kill(signal?)                     给子进程发信号
 *    - 同步版返回 { pid, output, stdout, stderr, status, signal, error }
 *
 * 4. 常见陷阱
 *    陷阱 1：spawn 第一个参数是**可执行文件**，不是整条命令。
 *            spawn('node -e "1"') 会失败——那样会被当成一个文件名。
 *            要传整条命令请用 exec，或者把参数拆成数组交给 spawn。
 *    陷阱 2：shell 注入。exec/execSync 会把字符串原样交给 shell 解释，
 *            若其中拼进了用户输入，`; rm -rf /` 之类的注入就能生效。
 *            能不用 shell 就别用——execFile 是更安全的选择。
 *    陷阱 3：exec 会**缓冲全部输出**，默认上限 maxBuffer 为 1MB。
 *            超过就报 ERR_CHILD_PROCESS_STDIO_MAXBUFFER。大输出一定用 spawn。
 *    陷阱 4：子进程以非零码退出时，spawn **不会**抛异常或报错，
 *            只把 code 传给你，必须自己判断。而 exec 会把非零退出当成 error。
 *    陷阱 5：'exit' 与 'close' 不是一回事。'exit' 只表示进程结束了，
 *            此时 stdout 的数据可能还没读完；'close' 才表示流也关了。
 *            想拿完整输出，等 'close'。
 *    陷阱 6：子进程不会因为父进程退出而自动死掉（除非用 detached + 特殊处理），
 *            忘了 kill 就会留下僵尸进程。setTimeout 里跑长命令尤其要注意。
 *    陷阱 7：在 Windows 上命令名要带后缀。系统命令如 dir 是 cmd 内置的，
 *            只能通过 shell 调用（exec），用 spawn 会报 ENOENT。
 *    陷阱 8：windowsHide 默认 false，会闪出黑框。做 GUI 程序时记得设 true。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/10_child_process.js
 *
 * 【预期输出】
 *   全程只用 `node -e "..."` 这类无害命令，演示：
 *   spawn 的流式输出与参数传递、exec 的 shell 能力与 maxBuffer 限制、
 *   execFile 与 spawn 的安全性差异、非零退出码的处理、
 *   环境变量与工作目录的传递、以及主动 kill 一个长跑子进程。
 * ============================================================================
 */

import { spawn, exec, execFile, spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';

// 用 process.execPath 而不是裸的 'node'：
// 它一定是"当前正在运行的这个 node 可执行文件"的绝对路径，
// 不依赖 PATH，也不会因为机器上装了多个 Node 版本而选错。
const NODE = process.execPath;
console.log('将使用这个 node 可执行文件启动子进程：', NODE);

// ---------------------------------------------------------------------------
// 0. 一个把 spawn 包成 Promise 的小工具
// ---------------------------------------------------------------------------

console.log('--- 0. 封装 spawn ---');

// spawn 是事件式的，直接用会让后面每个例子都写一遍样板代码。
// 这里先用一个 Promise 封装，让后续演示专注于方法之间的差异。
// （生产项目里可以直接用 util.promisify，或者 node:child_process 的 Promise 版 API）
function runSpawn(args, options = {}) {
  return new Promise((resolve, reject) => {
    // spawn(可执行文件, 参数数组, 选项)
    const child = spawn(NODE, args, options);

    // spawn 只负责启动；输出要通过流来收集。
    // 这里用字符串累加，真实的大输出场景应该直接 pipe 到文件或下游流。
    let stdout = '';
    let stderr = '';

    // child.stdout 是可读流：子进程写什么，这里就能读到什么。
    // 注意 stdio 设为 'inherit' 时它是 null，那时数据直接进了父进程的终端。
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    // 'error' 事件表示"连启动都没成功"（比如文件不存在、权限不足）。
    // 它与"启动成功但退出码非零"是两回事——后者走 'close'。
    child.on('error', reject);

    // 'close' 比 'exit' 更晚，它保证标准输出流也读完了。
    // 参数 signature 是 (code, signal)：
    //   code   正常退出时的退出码（0 表示成功）
    //   signal 被信号杀死时的信号名（如 'SIGTERM'），正常退出时为 null
    child.on('close', (code, signal) => {
      resolve({ code, signal, stdout, stderr });
    });
  });
}

// ---------------------------------------------------------------------------
// 1. spawn 的基本用法：参数是数组，不经过 shell
// ---------------------------------------------------------------------------

console.log('--- 1. spawn 基本用法 ---');

// 关键点：命令与参数**分开**传。
// 这里把一段脚本作为 -e 的参数传给 node，完全不需要考虑引号转义。
const r1 = await runSpawn(['-e', 'console.log("来自 spawn 子进程");']);
console.log('  退出码 =', r1.code, '（0 表示成功）');
console.log('  信号   =', r1.signal, '（正常退出时为 null）');
console.log('  stdout =', JSON.stringify(r1.stdout));

// 子进程里同样可以读 process.argv，看看参数是怎么传进去的。
// 注意这里用 '--' 分隔：node -e "..." 之后的内容会成为 process.argv[1] 起的内容，
// 加 '--' 是让 node 明确知道"后面都是给脚本的参数"。
const r2 = await runSpawn(['-e', 'console.log(process.argv.slice(1).join(" | "))', '--', '甲', '乙', '丙']);
console.log('  子进程收到的参数 =', JSON.stringify(r2.stdout.trim()));

// 传入环境变量：env 是**整体替换**，所以要手动把父进程的 env 展开进去，
// 否则子进程里连 PATH 都没有（陷阱：只写 env: { FOO: 'x' } 会让子进程环境极简）。
const r3 = await runSpawn(['-e', 'console.log("你好，" + process.env.GREET_NAME);'], {
  env: { ...process.env, GREET_NAME: '子进程' },
});
console.log('  子进程读到环境变量输出 =', JSON.stringify(r3.stdout.trim()));

// 指定工作目录：cwd 只影响子进程的"当前目录"，与脚本文件无关。
// 这里用系统临时目录，确保不会在仓库里留下任何东西。
const r4 = await runSpawn(['-e', 'console.log(process.cwd());'], { cwd: os.tmpdir() });
console.log('  子进程的 cwd =', r4.stdout.trim());
console.log('  父进程的 cwd =', process.cwd(), '（两者独立）');

// 陷阱 1 演示：把整条命令当成可执行文件名，会启动失败。
try {
  await runSpawn(['-e']);
  // 上面这行是合法的（脚本内容为空），这里换个真正会失败的形式：
  await new Promise((resolve, reject) => {
    const bad = spawn('node -e "console.log(1)"'); // 注意：这是一个整体字符串
    bad.on('error', reject);
    bad.on('close', resolve);
  });
} catch (err) {
  console.log('  把整条命令当作文件名：err.code =', err.code, '（ENOENT = 找不到这个文件）');
  console.log('  => spawn 的第一个参数是可执行文件路径，参数要拆成数组。');
}

// ---------------------------------------------------------------------------
// 2. spawn 的流式特性：边产边读
// ---------------------------------------------------------------------------

console.log('--- 2. spawn 流式输出 ---');

// 让子进程分几次、带间隔地输出，观察父进程是"边到边收"的。
const streamArgs = [
  '-e',
  // 子进程脚本：每 30ms 输出一行，共三行。
  // 用 \\n 是因为这段脚本本身要经过一层 JS 字符串转义。
  'const lines=["第一块","第二块","第三块"];' +
    'let i=0;' +
    'const t=setInterval(()=>{' +
    '  process.stdout.write(lines[i]+"\\n");' +
    '  if(++i===lines.length){clearInterval(t);}' +
    '},30);',
];

const streamChild = spawn(NODE, streamArgs);
const arrival = [];
const startAt = Date.now();

// 每次 'data' 事件就是一个 chunk 到达的时刻。
// 这就是 spawn 与 exec 最本质的区别：
// exec 要等子进程**全部结束**才一次性给你输出，spawn 是流式的，立刻就能处理。
streamChild.stdout.on('data', (chunk) => {
  arrival.push(`${Date.now() - startAt}ms`);
  // 直接打印，不需要累积。
  process.stdout.write(`  [实时] ${chunk.toString().trimEnd()}\n`);
});

// 等它结束。
await once(streamChild, 'close');
console.log('  各块数据到达父进程的时刻：', arrival.join(', '));
console.log('  => 时间点分散，说明数据是分多次送来的，不是结束后一次性给的。');

// ---------------------------------------------------------------------------
// 3. exec —— 经过 shell，输出被缓冲成字符串
// ---------------------------------------------------------------------------

console.log('--- 3. exec 的 shell 能力 ---');

// exec 接受的是**一整条 shell 命令行**，所以能使用 shell 的特性。
// 这里用 '&&' 串联两条命令——这是 shell 的语法，spawn 直接传字符串是做不到的。
function runExec(command, options = {}) {
  return new Promise((resolve) => {
    exec(command, options, (error, stdout, stderr) => {
      // 与 spawn 不同：非零退出码会体现在 error 上，不需要自己判断 code。
      resolve({ error, stdout, stderr });
    });
  });
}

// 注意引号：外层用单引号包住整条命令，命令内部用双引号包住脚本。
// 这样在 Windows 的 cmd 和 POSIX 的 sh 下都能正常工作。
// 这种"跨 shell 的引号地狱"本身就是应该少用 exec 的理由之一。
const shellCmd = `${JSON.stringify(NODE)} -e "console.log('第一条')" && ${JSON.stringify(NODE)} -e "console.log('第二条')"`;
const e1 = await runExec(shellCmd);
console.log('  使用 && 串联两条命令的输出：');
e1.stdout
  .trimEnd()
  .split('\n')
  .forEach((l) => console.log('    |', l));
console.log('  error =', e1.error, '（成功时为 null）');

// 非零退出码：exec 会给出一个带 code 属性的 Error。
const e2 = await runExec(`${JSON.stringify(NODE)} -e "process.exit(3)"`);
console.log('  子进程强制以退出码 3 结束时：');
console.log('    error 是 Error 实例吗 =', e2.error instanceof Error);
console.log('    error.code =', e2.error.code, '（就是子进程的退出码）');
console.log('    error.killed =', e2.error.killed, '/ error.signal =', e2.error.signal);
console.log('    stdout =', JSON.stringify(e2.stdout), '（没输出就是空串）');

// 陷阱 3：exec 的 maxBuffer。默认 1MB，超过就报错。
// 这里故意把上限压到 50 字节，用很小的输出就能触发。
const e3 = await runExec(`${JSON.stringify(NODE)} -e "process.stdout.write('x'.repeat(500))"`, {
  maxBuffer: 50,
});
console.log('  maxBuffer 设成 50 字节却要输出 500 字节：');
console.log('    error.code =', e3.error?.code, '（ERR_CHILD_PROCESS_STDIO_MAXBUFFER）');
console.log('    => 大输出的场景必须用 spawn，它的流式读取不受 maxBuffer 限制。');

// ---------------------------------------------------------------------------
// 4. execFile —— 不走 shell 的 exec
// ---------------------------------------------------------------------------

console.log('--- 4. execFile 不经过 shell ---');

// execFile 的参数也是数组，所以同样没有 shell 注入的风险，
// 但它又像 exec 一样把输出缓冲成字符串，用起来比 spawn 省事。
function runExecFile(args, options = {}) {
  return new Promise((resolve) => {
    execFile(NODE, args, options, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });
  });
}

const ef1 = await runExecFile(['-e', 'console.log("execFile 不需要考虑引号转义")']);
console.log('  输出 =', JSON.stringify(ef1.stdout.trim()));

// 最能说明问题的一点：把"看起来像 shell 语法"的字符当成普通参数传进去，
// execFile 会原样交给子进程，而 exec 会把它当 shell 语法解释。
// 这里刻意用纯 ASCII 文本，避免不同系统控制台编码（Windows 的 cmd 默认是 GBK）
// 把多字节字符显示成乱码，影响观察。
const trickyArg = 'a && echo INJECTED';
// 用 execFile（数组参数）：整个字符串被当作**一个**参数原样传递。
const ef2 = await runExecFile(['-e', 'console.log(process.argv[1])', '--', trickyArg]);
console.log('  execFile 传危险字符串的结果 =', JSON.stringify(ef2.stdout.trim()));
console.log('  => 它就只是一个普通参数，"&&" 没有被解释成分隔符。');

// 对比 exec（走 shell）：同样的字符串如果拼进命令行，就会被 shell 解释。
// 为了安全，这里用 echo 这种无害命令代替 rm 之类的危险示例。
const injected = await runExec(`echo hello ${trickyArg}`);
// 注意 cmd 的 echo 会输出 '\r\n'，用 replace 把回车去掉再展示。
console.log('  exec 拼进同样的字符串的结果 =', JSON.stringify(injected.stdout.replace(/\r/g, '').trim()));
console.log('  => 输出里多出了一个 INJECTED，说明 "&&" 后面的命令真的被执行了。');
console.log('  => 这就是命令注入（command injection）。用户输入一定要走 execFile + 数组参数。');

// ---------------------------------------------------------------------------
// 5. spawnSync —— 同步版本
// ---------------------------------------------------------------------------

console.log('--- 5. spawnSync 同步调用 ---');

// spawnSync 会**阻塞**当前进程直到子进程结束，然后直接返回结果对象。
// 适合脚本/构建工具里"必须拿到结果才能继续"的场景；
// 绝不要在 HTTP 请求处理里用，那会把整个服务的并发能力打回同步模型。
const syncResult = spawnSync(NODE, ['-e', 'console.log("同步子进程输出");'], {
  // encoding 让 stdout/stderr 直接是字符串而不是 Buffer。
  encoding: 'utf8',
  // 加个 timeout 防止意外卡死（这里是 5 秒，远超需要的时间）。
  timeout: 5000,
});
console.log('  status  =', syncResult.status, '（退出码，等价于异步版的 code）');
console.log('  signal  =', syncResult.signal);
console.log('  stdout  =', JSON.stringify(syncResult.stdout));
console.log('  error   =', syncResult.error, '（成功时为 undefined）');
// 注意字段名差异：同步版用 status，异步版用 code。
console.log('  => 同步版字段叫 status，异步版叫 code，别记混。');

// 同步版的非零退出：不抛异常，只体现在 status 上。
const syncFail = spawnSync(NODE, ['-e', 'process.exit(7)'], { encoding: 'utf8' });
console.log('  非零退出的 status =', syncFail.status, '（同样不会抛异常）');

// ---------------------------------------------------------------------------
// 6. 主动结束一个长跑子进程
// ---------------------------------------------------------------------------

console.log('--- 6. kill 长跑子进程 ---');

// 启动一个"要跑 5 秒"的子进程——如果不主动结束它，脚本就会多花 5 秒。
// 这正是陷阱 6 提醒的场景：忘了 kill，脚本就会一直挂着。
const sleeper = spawn(NODE, ['-e', 'setTimeout(() => console.log("你本不该看到这行"), 5000);']);
console.log('  已启动长跑子进程，pid =', sleeper.pid);
console.log('  sleeper.killed（初始）=', sleeper.killed, '（false 表示还没被 kill 过）');

// 先注册 'close' 监听，再 kill —— 顺序很重要，避免错过事件（见 09 的陷阱 7）。
const sleepyClosed = once(sleeper, 'close');

// 100ms 后把它杀掉，脚本总耗时只多 100ms。
setTimeout(() => {
  // kill() 默认发送 SIGTERM。
  // 在 Windows 上没有真正的信号机制，Node 会用 TerminateProcess 直接结束进程，
  // 但 'close' 事件里报告的 signal 仍然是 'SIGTERM'。
  const sent = sleeper.kill();
  console.log('  kill() 返回值 =', sent, '（true 表示信号发送成功）');
  console.log('  sleeper.killed（kill 之后）=', sleeper.killed);
}, 100);

const [sleepyCode, sleepySignal] = await sleepyClosed;
console.log('  子进程结束：code =', sleepyCode, '，signal =', sleepySignal);
console.log('  （被信号杀死时 code 为 null，真正的信息在 signal 上）');

// 顺带说明一个更彻底的办法：把子进程交给系统去杀。
// 如果只是"最多允许跑 2 秒"，可以在 spawn 时直接传 timeout 选项：
const timedOut = await runSpawn(['-e', 'setTimeout(() => {}, 5000);'], { timeout: 200 });
console.log('  用 spawn 的 timeout: 200 选项：code =', timedOut.code, '，signal =', timedOut.signal);
console.log('  => 到时自动击杀，比手写 setTimeout + kill 更省事，也不容易漏。');

// ---------------------------------------------------------------------------
// 7. 选型总结
// ---------------------------------------------------------------------------

console.log('--- 7. 选型总结 ---');
console.log('  需要实时处理输出 / 输出很大        -> spawn');
console.log('  需要 shell 特性（管道、通配符、&&）-> exec（但要当心命令注入）');
console.log('  短命令 + 不需要 shell              -> execFile（最安全，首选）');
console.log('  脚本里必须同步等结果                -> spawnSync / execFileSync');
console.log('  要真正并行跑 CPU 密集任务           -> child_process 或 worker_threads');

console.log('--- 全部演示结束 ---');
