/**
 * ============================================================================
 * 知识点：node:readline —— 逐行读取输入与交互式命令行
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】进阶
 * 【前置知识】26_node_core/08_streams_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:readline 用来"按行"处理输入流。它把字节流按换行符切成一行行文本，
 *    再通过 'line' 事件或异步迭代器交给你。
 *    它有两个入口：
 *      · node:readline           经典 API，事件 + 回调风格，rl.question(prompt, cb)
 *      · node:readline/promises   Promise 版，rl.question(prompt) 直接返回 Promise
 *    典型用途：交互式命令行工具（CLI）、逐行处理日志文件、简易 REPL、
 *    以及需要向用户提问并读取回答的脚本。
 *
 * 2. 为什么需要
 *    直接监听 process.stdin 的 'data' 事件拿到的是随机的字节块：
 *    一次可能给你半行，也可能给你三行粘在一起。要自己维护一个缓冲区、
 *    处理 '\r\n' 与 '\n' 两种换行、处理最后一行没有换行符的情况——
 *    这些琐碎但极易出错的活，readline 全帮你做了。
 *    它还会在终端模式下接管方向键、退格、历史记录（上箭头）等编辑功能，
 *    这些能力对 CLI 工具来说基本是刚需。
 *
 * 3. 核心语法要点
 *    - readline.createInterface({ input, output, terminal, historySize })
 *    - rl.on('line', (line) => {})        每读到一行触发一次
 *    - rl.on('close', () => {})           输入流结束或调用 rl.close() 时触发
 *    - rl.on('history', (history) => {})  终端模式下保存历史时的回调
 *    - for await (const line of rl)        用异步迭代器逐行消费（推荐，可读性最好）
 *    - rl.question(prompt, cb)            提问并读取一行回答（回调版）
 *    - rl.setPrompt(p) / rl.prompt()      设置并显示提示符
 *    - rl.write(text)                     向输入流"注入"文本（测试时很有用）
 *    - rl.close()                         关闭接口，释放 input 上的监听
 *    - readline/promises 版：await rl.question('提示> ')
 *    - terminal: true 时可用 Ctrl+C 触发 'SIGINT' 事件，默认会让进程退出
 *
 * 4. 常见陷阱
 *    陷阱 1：本示例**不会**真的等待键盘输入。原因有二：
 *            一是自动化校验脚本里没有终端，读 stdin 会让进程永远挂起；
 *            二是"等待用户输入"的程序无法被自动测试。
 *            正确做法是用一个内存可读流（Readable / PassThrough）模拟输入源——
 *            这正是本文件的写法，也是单元测试 CLI 的标准技巧。
 *    陷阱 2：terminal 选项要显式设置。默认值取决于 output.isTTY；
 *            用内存流模拟输入时必须写 terminal: false，否则 readline 会
 *            按终端模式处理，行为与真实管道输入不一致。
 *    陷阱 3：不调用 rl.close() 就不会触发 'close'，input 上的监听也不会释放。
 *            在做长跑程序时这是内存泄漏；在脚本里则可能让进程不退出。
 *    陷阱 4：输入流结束（'end'）会自动关闭 readline 接口，
 *            异步迭代器随之结束——所以模拟输入时必须记得把流 end() 掉。
 *    陷阱 5：for await 拿到的是字符串（不含换行符），不要再去 trim 换行；
 *            但末尾的 '\r' 在个别场景下可能残留，用 trimEnd() 更保险。
 *    陷阱 6：rl.question 只认"下一行"。如果两行数据在 question 之前就已被缓冲，
 *            前面的行会先被 'line' 事件消费掉，question 拿到的是后面的行。
 *    陷阱 7：事件监听器必须在数据到达**之前**注册。'close' 可能在最后一次
 *            write 的同一个同步流程里就被派发，事后再 on('close') 就永远收不到，
 *            await 会一直挂着（表现为进程不退出、退出码 13）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/09_readline_cli.js
 *
 * 【预期输出】
 *   用内存流模拟输入，演示逐行读取、await 提问、带校验的重试循环、
 *   一个迷你命令解释器，以及 close 事件的触发与资源释放。
 *   全程无需键盘输入，运行完立即退出。
 * ============================================================================
 */

import readline from 'node:readline';
// Promise 版单独位于 node:readline/promises，它导出的 createInterface
// 返回的 rl 对象上，question() 直接返回 Promise，不用再手写包装。
import * as readlinePromises from 'node:readline/promises';
import { Readable, PassThrough } from 'node:stream';

// ---------------------------------------------------------------------------
// 1. 用内存流模拟输入
// ---------------------------------------------------------------------------

console.log('--- 1. 逐行读取（async 迭代器） ---');

// 构造一个"假输入流"：内容是几行文本，每行以 \n 结尾。
// 真实场景里这个位置会是 fs.createReadStream('access.log') 或 process.stdin。
// Readable.from 把一个数组变成可读流（见 08_streams_basics.js）。
const fakeInput = Readable.from([
  '192.168.1.10 GET /index.html 200\n',
  '192.168.1.11 POST /api/login 401\n',
  '192.168.1.12 GET /static/app.js 200\n',
]);

// createInterface 的参数说明：
//   input:      数据来源，必须是可读流
//   output:     提示符/回显的去向；只读文件时可以不传
//   terminal:   是否按"终端"处理。传给内存流时必须是 false，
//               否则 readline 会尝试做行编辑、控制字符处理，行为会不同。
//   historySize: 终端模式下保留多少条历史（内存流场景无意义）
const rl = readline.createInterface({
  input: fakeInput,
  // 这里不传 output：我们不希望它往 stdout 写提示符，保持输出干净。
  terminal: false,
});

// 计数器，用来统计各种状态码的出现次数——这就是"逐行处理日志"的雏形。
const statusCount = {};

// for await 会一行一行地把数据交给我们，直到输入流结束。
// 用它可以避免手写 'line' 事件 + 手写结束判断，代码是线性的。
for await (const line of rl) {
  // line 已经去掉了行尾的换行符。
  // 保险起见用 trimEnd() 去掉可能残留的 '\r'（Windows 换行是 '\r\n'）。
  const clean = line.trimEnd();
  console.log('  读到一行：', clean);

  // 解析出状态码：按空格切分，取**最后一个**字段。
  // 日志格式是 'IP 方法 路径 状态码'，所以状态码在末尾。
  const parts = clean.split(' ');
  const status = parts[parts.length - 1]; // 形如 '200' / '401'
  statusCount[status] = (statusCount[status] ?? 0) + 1;
}

// 迭代结束意味着输入读完、接口已自动关闭。
console.log('  状态码统计：', JSON.stringify(statusCount));

// ---------------------------------------------------------------------------
// 2. await 提问：readline/promises 的用法
// ---------------------------------------------------------------------------

console.log('--- 2. await 提问 ---');

// 提问式交互和"逐行读取"的差别在于：数据必须在问题问出**之后**才到达，
// 否则回答会被当成普通的 'line' 事件丢掉。
// 所以这里不能用 Readable.from（它一创建就开始吐数据），
// 而要用 PassThrough —— 一个可以从外部 write 进去的管道流。
const answerStream = new PassThrough();

const askRl = readlinePromises.createInterface({
  input: answerStream,
  output: process.stdout,
  terminal: false,
});

// 预先安排好"用户会在某个时刻敲入什么"。
// 每个 setTimeout 之间的间隔很短（10~20ms），既保证到达顺序，
// 又不让脚本有明显停顿。这就是"录制回放"式的 CLI 测试思路。
setTimeout(() => answerStream.write('张三\n'), 10);
setTimeout(() => answerStream.write('30\n'), 25);
setTimeout(() => answerStream.write('北京\n'), 40);

// ask() 是最常用的封装：把 question 包一层，方便加日志或超时。
async function ask(prompt) {
  // question() 会先把 prompt 写到 output，然后等一行输入。
  // 注意这里返回的是**去掉换行**的字符串。
  const answer = await askRl.question(prompt);
  console.log(`    -> 收到回答：${JSON.stringify(answer)}`);
  return answer;
}

const name = await ask('请输入姓名：');
const age = await ask('请输入年龄：');
const city = await ask('请输入城市：');

console.log('  汇总信息：', { name, age: Number(age), city });

// ---------------------------------------------------------------------------
// 3. 带校验的重试循环
// ---------------------------------------------------------------------------

console.log('--- 3. 带校验的重试循环 ---');

// 真实的交互程序不会假设用户输入合法，必须校验并要求重填。
// 这里模拟用户先输入两个非法值、最后输入一个合法值。
const validateStream = new PassThrough();
const vRl = readlinePromises.createInterface({
  input: validateStream,
  output: process.stdout,
  terminal: false,
});

// 依次"敲入"：abc（非数字）、-5（负数）、42（合法）
setTimeout(() => validateStream.write('abc\n'), 10);
setTimeout(() => validateStream.write('-5\n'), 25);
setTimeout(() => validateStream.write('42\n'), 40);

// 这个函数会一直循环直到拿到合法输入为止。
async function askPositiveInt(prompt) {
  // 加一个上限防止"万一永远拿不到合法输入"导致无限循环；
  // 这在实际脚本里是很重要的保险。
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const raw = await vRl.question(prompt);
    // Number('') 是 0，Number('abc') 是 NaN，要一并排除空串。
    const value = Number(raw);
    if (raw.trim() !== '' && Number.isInteger(value) && value > 0) {
      console.log(`    -> 第 ${attempt} 次输入 "${raw}" 合法`);
      return value;
    }
    console.log(`    -> 第 ${attempt} 次输入 "${raw}" 不合法（需要正整数），请重试`);
  }
  // 重试次数用尽，抛出错误交给调用方决定怎么处理。
  throw new Error('输入校验失败：重试次数已用尽');
}

const port = await askPositiveInt('请输入端口号（正整数）：');
console.log('  最终拿到的端口号：', port);

// 输入流已经没有更多数据了，主动关闭两个接口。
// 关闭后会触发 'close' 事件，且 input 上的监听被移除。
askRl.close();
vRl.close();
// 别忘了把底层流也结束掉，否则 PassThrough 会一直是打开状态。
answerStream.end();
validateStream.end();
console.log('  已关闭提问用的 readline 接口。');

// ---------------------------------------------------------------------------
// 4. 一个迷你命令解释器
// ---------------------------------------------------------------------------

console.log('--- 4. 迷你命令解释器 ---');

// 这个模式是 CLI 工具的核心：读一行 -> 解析命令 -> 执行 -> 输出结果。
// 这里模拟用户依次敲入四条命令，最后用 exit 结束会话。
const commands = [
  'add 苹果',
  'add 香蕉',
  'list',
  'remove 苹果',
  'list',
  'help',
  'exit',
];

const cmdStream = new PassThrough();
const cmdRl = readline.createInterface({
  input: cmdStream,
  output: process.stdout,
  terminal: false,
});

// 关键顺序问题：'close' 监听器必须在**任何数据到达之前**注册好。
// 如果先写数据再注册监听，接口可能在监听器装上之前就已经关闭，
// 那样 await 会永远等不到——这是本文件踩过的真实坑（陷阱 7）。
const closedPromise = new Promise((resolve) => {
  cmdRl.on('close', () => {
    console.log('  [close 事件] readline 接口已关闭，input 上的监听已释放。');
    console.log('  会话结束时 running =', running, '（exit 命令把它置为 false 了）');
    resolve();
  });
});

// 把命令逐条"敲入"，每条间隔 10ms。
commands.forEach((cmd, i) => {
  setTimeout(() => cmdStream.write(`${cmd}\n`), 10 + i * 10);
});

// 全部命令写完之后再把底层流结束掉。
// 位置很讲究：既要晚于所有 write，又不能漏掉——
// 漏了它 'close' 永远不会触发，上面的 await 就会一直挂着（进程不退出）。
setTimeout(() => cmdStream.end(), 10 + commands.length * 10 + 10);

// 会话状态：一个待办清单。真实 CLI 里这可能是文件、数据库或远程 API。
const todos = new Set();

// 命令表：把命令名映射到处理函数。
// 用对象做分发比一长串 if/else 更清晰，也更容易扩展。
const handlers = {
  add(args) {
    if (!args) return '用法：add <事项>';
    if (todos.has(args)) return `"${args}" 已经在清单里了`;
    todos.add(args);
    return `已添加 "${args}"，当前共 ${todos.size} 项`;
  },
  remove(args) {
    if (!todos.has(args)) return `清单里没有 "${args}"`;
    todos.delete(args);
    return `已移除 "${args}"，当前共 ${todos.size} 项`;
  },
  list() {
    if (todos.size === 0) return '（清单为空）';
    // 用展开数组 + map 生成多行输出。
    return [...todos].map((item, i) => `  ${i + 1}. ${item}`).join('\n');
  },
  help() {
    return '可用命令：add <事项> / remove <事项> / list / help / exit';
  },
};

let running = true;

// 'line' 事件版：与 for await 等价，只是控制流更像传统事件回调。
cmdRl.on('line', (rawLine) => {
  // 先做整体 trim，忽略行首行尾的空白。
  const line = rawLine.trim();
  if (line === '') {
    console.log('  （空行已忽略）');
    return;
  }

  // 解析：命令名 + 其余全部作为参数。
  // indexOf(' ') 找到第一个空格的位置，切出命令与参数。
  const spaceAt = line.indexOf(' ');
  const cmd = spaceAt === -1 ? line : line.slice(0, spaceAt);
  // 参数要用 trim，否则 'add  苹果' 这种多空格会带出前导空格。
  const args = spaceAt === -1 ? '' : line.slice(spaceAt + 1).trim();

  console.log(`  > ${line}`);

  // exit 是特殊命令：它负责结束会话。
  if (cmd === 'exit') {
    console.log('  再见！');
    running = false;
    // close() 会触发 'close' 事件并释放 input 上的监听。
    cmdRl.close();
    return;
  }

  // 其余命令从命令表里查。用 hasOwnProperty 而不是直接调用，
  // 避免用户输入 'constructor'、'toString' 这类原型上的属性名造成意外行为。
  if (Object.hasOwn(handlers, cmd)) {
    const output = handlers[cmd](args);
    // 输出可能是多行，统一缩进显示。
    output.split('\n').forEach((l) => console.log(`    ${l}`));
  } else {
    console.log(`    未知命令 "${cmd}"，输入 help 查看可用命令`);
  }
});

// 等会话结束。closedPromise 在数据写入之前就已注册好，不会漏事件。
await closedPromise;

// ---------------------------------------------------------------------------
// 5. rl.write —— 向输入流注入文本
// ---------------------------------------------------------------------------

console.log('--- 5. rl.write 注入文本 ---');

// rl.write() 可以模拟"用户敲入了这段文字"，常用于自动化测试与自检，
// 好处是不需要自己造一个 PassThrough 流再往里面写。
// 注意：write 的内容如果没有换行符，readline 会把它留在缓冲区里等待后续输入。
const injectStream = new PassThrough();
const injectRl = readline.createInterface({
  input: injectStream,
  output: process.stdout,
  terminal: false,
});

const injected = [];

// 同样是先注册 'close' 监听（用 Promise 包成可 await 的形式），再往里写数据。
const injectClosed = new Promise((resolve) => {
  injectRl.on('close', resolve);
});

injectRl.on('line', (line) => {
  injected.push(line.trimEnd());
  // 收到两行就收工。
  if (injected.length === 2) {
    // 主动关闭接口会触发 'close'。
    injectRl.close();
  }
});

// 注入两行文本（带换行符，模拟按了回车）。
// 这两行会同步地被切分并派发 'line' 事件。
injectRl.write('自动输入的第一行\n');
injectRl.write('自动输入的第二行\n');

await injectClosed;
injectStream.end();
console.log('  注入并读回的内容：', JSON.stringify(injected));

// ---------------------------------------------------------------------------
// 6. 小结：什么时候该用哪套 API
// ---------------------------------------------------------------------------

console.log('--- 6. 选型建议 ---');

// 逐行处理大文件（日志分析、数据清洗）
//   -> for await (const line of readline.createInterface({ input: fs.createReadStream(p) }))
//      优点：内存占用与文件大小无关，天然支持背压（见 08_streams_basics.js）
//
// 需要向用户提问并拿到回答
//   -> import * as rl from 'node:readline/promises'; await rl.question('...')
//      优点：不用手写 Promise 包装，代码是线性的
//
// 需要方向键、历史记录、Tab 补全等完整终端体验
//   -> terminal: true（默认在 TTY 下开启），必要时配合 rl.setPrompt / rl.prompt
//
// 需要给 CLI 写自动化测试
//   -> 用 PassThrough 或 Readable.from 当 input，把预定的输入"回放"进去
//      这正是本文件从头到尾采用的手法，也是最重要的可测试性技巧。
//
// 最后提醒：永远不要把真实 stdin 直接写进自动化脚本里，
// 在没有终端的环境下它会永久挂起——本示例之所以能秒退，全靠模拟输入。

console.log('--- 全部演示结束 ---');
