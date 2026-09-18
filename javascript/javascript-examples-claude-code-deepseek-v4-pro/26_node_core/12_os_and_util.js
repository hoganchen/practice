/**
 * ============================================================================
 * 知识点：node:os 与 node:util —— 系统信息与通用工具函数
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】入门
 * 【前置知识】26_node_core/01_process_object.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    · node:os   提供"与操作系统对话"的只读接口：CPU 型号与核数、内存总量与
 *                可用量、用户主目录、系统临时目录、换行符、系统类型与版本、
 *                网络接口、开机时长等。它不改变系统，只报告系统。
 *    · node:util 是"通用工具箱"，里面是那些不属于某个具体领域、
 *                但各处都用得上的函数：格式化字符串、打印对象、
 *                把回调函数转成 Promise、类型精确判断、命令行参数解析等。
 *
 *    两者都是纯工具模块，放在一起讲是因为它们经常同时出现在
 *    "读取运行环境信息 -> 组织并输出"这类代码里。
 *
 * 2. 为什么需要
 *    · os：同一个程序在 8 核服务器和 2 核笔记本上的最佳并发数不一样；
 *      临时文件的正确位置在 Windows、Linux、macOS 上各不相同（写死 /tmp 就错了）；
 *      生成文本文件时换行符必须与平台一致（否则 Windows 记事本会显示成一整行）。
 *      这些判断都需要 os 提供的信息。
 *    · util：console.log 打印对象时的漂亮格式其实就是 util.inspect；
 *      把老式回调 API 转成 await 风格靠 util.promisify；
 *      判断"这是不是真的 Date 对象"靠 util.types（instanceof 跨运行时不可靠）；
 *      写 CLI 时解析参数可以用 util.parseArgs 而不用装第三方库。
 *
 * 3. 核心语法要点
 *    · os 模块
 *      os.cpus()                CPU 核心数组（含型号、各状态耗时），长度即核数
 *      os.availableParallelism() 推荐的并发度（考虑容器 CPU 配额）
 *      os.totalmem() / freemem()  内存总量 / 可用量，单位字节
 *      os.homedir()            当前用户的主目录
 *      os.tmpdir()             系统临时目录（跨平台正确的写法就靠它）
 *      os.EOL                  平台换行符（Windows '\r\n'，POSIX '\n'）
 *      os.platform() / arch()  平台标识 / CPU 架构（与 process 上的同名属性一致）
 *      os.type() / release()   系统名称 / 内核版本
 *      os.hostname()           主机名
 *      os.userInfo()           当前用户信息（个别环境下可能抛异常）
 *      os.networkInterfaces()  网卡及其地址
 *      os.uptime()             系统开机时长（秒）
 *    · util 模块
 *      util.format(fmt, ...args)   类 printf 格式化：%s %d %i %f %j %o %O %%
 *      util.inspect(obj, options)  把对象转成可读字符串，参数很多
 *      util.promisify(fn)          把 (err, value) 风格的回调函数转成返回 Promise
 *      util.callbackify(fn)        反向转换（Promise 函数转回调风格）
 *      util.types.*                精确类型判断：isDate / isRegExp / isPromise …
 *      util.parseArgs({ args, options })  解析命令行参数（Node 18.3+）
 *      util.inspect.custom         自定义对象的 inspect 行为所用的 Symbol
 *      util.deprecate(fn, msg)     把一个函数标记为已废弃
 *
 * 4. 常见陷阱
 *    陷阱 1：把 os.tmpdir() 换成写死的 '/tmp'。Windows 上根本没有这个目录，
 *            而某些 Linux 发行版会给每个用户分配独立的临时目录。
 *    陷阱 2：把 '\n' 写死进文件内容。Windows 上的记事本遇到纯 '\n' 会把所有行
 *            显示成一行。要生成跨平台文本，用 os.EOL 或者显式声明用 '\n'。
 *    陷阱 3：用 instanceof 判断跨运行时的对象。不同 JS 上下文（如 vm、worker、
 *            不同 realm）里的 Date 构造函数不是同一个，instanceof 会返回 false。
 *            这就是 util.types.isDate 存在的意义。
 *    陷阱 4：util.promisify 只适用于"最后一个参数是错误优先回调"的函数。
 *            像 setTimeout 这种返回对象、回调只有一个参数的函数，
 *            直接 promisify 会得到错误的行为（要用 node:timers/promises）。
 *    陷阱 5：os.cpus() 会构造整个数组，在高频调用的地方（比如每秒几次）有开销，
 *            应该缓存结果。
 *    陷阱 6：os.userInfo() 在无登录用户的环境（某些容器、CI）里可能抛异常，
 *            用之前最好 try/catch 或改用 process.env.USERNAME / USER。
 *    陷阱 7：util.inspect 默认只递归到 2 层，深层次的对象会显示成 [Object]，
 *            排查问题时容易漏掉信息，记得按需调大 depth。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/12_os_and_util.js
 *
 * 【预期输出】
 *   打印当前机器的 CPU / 内存 / 目录 / 平台等信息，
 *   再演示 util.format / inspect / promisify / types / parseArgs 的用法。
 *   不读写任何文件，不访问网络。
 * ============================================================================
 */

import os from 'node:os';
import util from 'node:util';

// ---------------------------------------------------------------------------
// 1. CPU —— 核数与型号
// ---------------------------------------------------------------------------

console.log('--- 1. CPU 信息 ---');

// os.cpus() 返回数组，每个元素代表一个逻辑核心，
// 包含 model（型号）、speed（MHz）以及 times（各状态累计耗时毫秒数）。
const cpus = os.cpus();
console.log('逻辑核心数 =', cpus.length);
// 型号取第一个核心的即可，通常所有核心型号相同。
// 用 trim() 去掉厂商填充的多余空格。
console.log('CPU 型号   =', cpus[0].model.trim());
console.log('标称主频   =', cpus[0].speed, 'MHz');

// times 记录了 CPU 在每个状态下花掉的毫秒数，可以据此估算使用率：
// 两次采样之间 user+sys 的增量 除以 总增量，就是这段时间的占用率。
const first = cpus[0].times;
console.log('核心 0 的耗时分布：', {
  user: first.user,
  nice: first.nice,
  sys: first.sys,
  idle: first.idle,
  irq: first.irq,
});

// os.availableParallelism() 是更推荐的"该开多少并发"的答案：
// 它会考虑容器的 CPU 配额，而不只是报告宿主机有多少核。
// 做多进程/多 worker 时优先用它（见 14_worker_threads.js）。
console.log('建议并发度 availableParallelism() =', os.availableParallelism());

// 顺手算一下这台机器"最多该开几个 worker"的常见经验值。
// 注意：CPU 密集任务才这样算；I/O 密集任务可以开到核数的很多倍。
console.log('  （CPU 密集型任务的常见做法是开 = 核心数 个 worker）');

// ---------------------------------------------------------------------------
// 2. 内存 —— 总量与可用量
// ---------------------------------------------------------------------------

console.log('--- 2. 内存信息 ---');

// 注意区分这里的"系统内存"和 process.memoryUsage() 的"进程内存"：
//   os.totalmem() 是整个机器的物理内存
//   process.memoryUsage().rss 是当前 node 进程占用的部分
// 两者解决的问题完全不同，别混用。
const totalBytes = os.totalmem();
const freeBytes = os.freemem();

// 字节数直接打印没人看得懂，统一换算成 GB 展示。
// 用 1024 进制（GiB），这是内存的惯用单位。
const toGiB = (bytes) => (bytes / 1024 ** 3).toFixed(2);
console.log(`系统总内存   = ${totalBytes} 字节 (${toGiB(totalBytes)} GiB)`);
console.log(`系统可用内存 = ${freeBytes} 字节 (${toGiB(freeBytes)} GiB)`);

// 使用率要注意：Linux 的 freemem 不包含缓存（buff/cache），
// 所以它显示的"已用"通常比 free -h 看起来更高，这是正常的。
const usedPercent = ((1 - freeBytes / totalBytes) * 100).toFixed(1);
console.log(`按此计算的使用率 = ${usedPercent}%（Linux 上会偏高，因为不含文件缓存）`);

// 对比进程自身的内存占用。
const procMem = process.memoryUsage();
console.log('当前 node 进程 rss =', (procMem.rss / 1024 ** 2).toFixed(1), 'MiB');
console.log('  （rss = 常驻内存集，包含堆、栈、C++ 对象等全部占用）');

// ---------------------------------------------------------------------------
// 3. 路径相关 —— homedir 与 tmpdir
// ---------------------------------------------------------------------------

console.log('--- 3. 目录 ---');

// homedir() 是当前用户的主目录。用来存用户级配置（如 ~/.myrc）非常合适。
console.log('用户主目录 homedir() =', os.homedir());

// tmpdir() 是**跨平台正确的临时目录**。
// 本仓库所有写临时文件的示例都用它，这是唯一正确的做法。
console.log('系统临时目录 tmpdir() =', os.tmpdir());
console.log('  （Windows 上是 %TEMP%，Linux 上是 /tmp 或 $XDG_RUNTIME_DIR，macOS 是 /var/folders/...）');

// 注意：os.tmpdir() 的结果可能被环境变量覆盖（TMPDIR / TMP / TEMP）。
// 所以同一台机器上不同用户、不同服务看到的临时目录可以不同——更不该写死。
console.log('  相关环境变量 TMPDIR =', process.env.TMPDIR ?? '(未设置)');
console.log('  相关环境变量 TEMP   =', process.env.TEMP ?? '(未设置)');

// ---------------------------------------------------------------------------
// 4. 平台、换行符与系统信息
// ---------------------------------------------------------------------------

console.log('--- 4. 平台与换行符 ---');

// os.EOL 是平台换行符，这是写文本文件时最容易忽略的跨平台细节。
// 用 JSON.stringify 包一层才能把 \r\n 这类不可见字符显示出来。
console.log('换行符 os.EOL =', JSON.stringify(os.EOL));
console.log('  （Windows 是 "\\r\\n"，Linux/macOS 是 "\\n"）');

// 演示它带来的实际差异：同样的三行文本，换行符不同，字节数也不同。
const lines = ['第一行', '第二行', '第三行'];
const withEol = lines.join(os.EOL) + os.EOL;
const withLf = lines.join('\n') + '\n';
console.log('用 os.EOL 拼接的字节数 =', Buffer.byteLength(withEol, 'utf8'));
console.log('用 \\n 拼接的字节数     =', Buffer.byteLength(withLf, 'utf8'));
console.log('  => 在 Windows 上前者每行多一个字节（\\r）。');
console.log('  => 实践建议：代码仓库里的文件统一用 \\n（并由 .gitattributes 约束），');
console.log('     而生成给本机用户看的文本时用 os.EOL。');

// os.platform() 与 process.platform 是同一个值，
// 但 os.arch() 提供了 CPU 架构信息。
console.log('platform() =', os.platform(), '/ arch() =', os.arch());
console.log('type()     =', os.type(), '（操作系统名称，如 Windows_NT / Linux / Darwin）');
console.log('release()  =', os.release(), '（内核版本）');
console.log('hostname() =', os.hostname());

// uptime() 是系统开机时长（秒），不是进程运行时长。
// 进程运行时长要用 process.uptime()，两者别搞混。
const upSec = os.uptime();
console.log(`系统已运行 ${upSec} 秒（约 ${(upSec / 3600).toFixed(1)} 小时）`);
console.log(`当前进程已运行 ${process.uptime().toFixed(2)} 秒（对比一下，完全不同）`);
// 注意：上面的 process.uptime() 在本文件里刚启动不久，所以只有零点几秒。

// userInfo() 在无登录用户的容器里可能抛异常，所以必须 try/catch。
try {
  const user = os.userInfo();
  console.log('当前用户 =', user.username);
  console.log('  uid =', user.uid, '/ gid =', user.gid, '（Windows 上通常是 -1）');
  console.log('  主目录 =', user.homedir, '（与 os.homedir() 一致）');
  console.log('  shell =', JSON.stringify(user.shell), '（Windows 上是 null 或空串）');
} catch (err) {
  // 兜底：从环境变量里找用户名的替代方案。
  console.log('os.userInfo() 不可用：', err.code ?? err.message);
  console.log('  改用环境变量：', process.env.USERNAME ?? process.env.USER ?? '(未知)');
}

// ---------------------------------------------------------------------------
// 5. 网络接口
// ---------------------------------------------------------------------------

console.log('--- 5. 网络接口 ---');

// networkInterfaces() 返回 { 网卡名: [地址信息, ...] }。
// 每个地址信息含 address / netmask / family / mac / internal / cidr。
// 启动 HTTP 服务时，常需要从里面挑出"本机的局域网 IP"来打印访问地址。
const interfaces = os.networkInterfaces();
const externalIPv4 = [];

for (const [name, addresses] of Object.entries(interfaces)) {
  // 注意 addresses 在某些平台上可能是 undefined，要判空。
  for (const info of addresses ?? []) {
    // 筛选条件：
    //   family === 'IPv4'  只要 IPv4（IPv6 地址太长，通常不适合直接展示）
    //   internal === false 排除回环地址 127.0.0.1
    if (info.family === 'IPv4' && !info.internal) {
      externalIPv4.push({ name, address: info.address });
    }
  }
}

console.log('网卡数量 =', Object.keys(interfaces).length);
if (externalIPv4.length === 0) {
  console.log('未找到对外的 IPv4 地址（常见于离线环境或只有回环网卡）。');
} else {
  console.log('对外的 IPv4 地址：');
  externalIPv4.forEach((item) => console.log(`  ${item.name} -> ${item.address}`));
}
console.log('  => 这就是"服务启动后打印 http://<本机IP>:<端口>"的实现方式。');

// 打印回环地址，它是本地服务自测时用的（见 15_http_server_client.js）。
console.log("回环地址固定是 '127.0.0.1'（IPv4）或 '::1'（IPv6）。");

// ---------------------------------------------------------------------------
// 6. util.format —— 类 printf 格式化
// ---------------------------------------------------------------------------

console.log('--- 6. util.format 格式化 ---');

// console.log 内部就是先调用 util.format 再输出。
// 常用的占位符：
//   %s 字符串    %d 数字（整数）    %i 整数（会先转成数字再取整）
//   %f 浮点数    %j JSON（循环引用会变成 [Circular]）
//   %o 对象的单行表示（含不可枚举属性）  %O 对象的详细表示
//   %% 一个字面的百分号
console.log(util.format('字符串 %s / 整数 %d / 浮点 %f', '文本', 42, 3.14159));
console.log(util.format('JSON 形式 %j', { name: '张三', tags: ['a', 'b'] }));
console.log(util.format('多个占位符：%s 和 %s', '甲', '乙'));

// 注意百分号转义（写成两个百分号表示一个字面百分号）的生效条件：
// 只有当**后面还有参数**时才会做占位符替换。
// 后面没有参数时，util.format 会把第一个字符串**原样返回**，连转义也不处理。
//
// 另外提醒：console.log 自己也做同样的格式化。所以下面这些演示里，
// 标签文字中一律不写百分号，避免被 console.log 抢先替换掉，造成误读。
const noArgsFormatted = util.format('转义演示：100%%');
const withArgsFormatted = util.format('转义演示：100%%', 0);
console.log('  后面【无】参数时，结果原样保留 =', JSON.stringify(noArgsFormatted));
console.log('  后面【有】参数时，双百分号变成单百分号 =', JSON.stringify(withArgsFormatted));
console.log('  => 想让转义生效，必须保证至少再传一个参数。');

// 数字占位符拿到非数字时不会报错，而是给出 NaN——这类静默转换很容易埋雷。
console.log('  数字占位符遇到非数字字符串的结果 =', JSON.stringify(util.format('%d', 'abc')));

// 占位符数量多于参数时：多余的占位符会原样保留（不会变成 undefined）。
console.log(util.format('参数不够：%s %s %s', '只有两个'));

// 参数多于占位符时：多余的参数会用空格拼接追加在后面。
console.log(util.format('参数多余：%s', '第一个', '第二个', '第三个'));

// 第一个参数不是字符串时，所有参数会被 inspect 后空格拼接。
// 这正是 console.log 打印对象的底层行为。
console.log(util.format({ a: 1 }, [1, 2], null, undefined));

// %j 遇到循环引用不会抛异常，而是给出可读的替代：
// 它内部用 JSON.stringify，stringify 因循环引用失败时，Node 会退化成
// JSON.stringify('[Circular]')。
const circular = { name: '自引用' };
circular.self = circular;
const jResult = util.format('%j', circular);
console.log('  用 JSON 占位符处理循环引用，得到 =', JSON.stringify(jResult));
console.log('  （它退化成把字面量 [Circular] 再 JSON 序列化一次，所以带引号）');

// 对比一下对象占位符：它走的是 inspect，能完整展开循环引用（打印成 [Circular *1]）。
const oResult = util.format('%o', circular);
console.log('  用对象占位符处理循环引用，得到 =', oResult);

// ---------------------------------------------------------------------------
// 7. util.inspect —— 把对象变可读
// ---------------------------------------------------------------------------

console.log('--- 7. util.inspect 检视对象 ---');

const nested = {
  level1: {
    level2: {
      level3: {
        level4: '默认看不到这里',
      },
    },
  },
  date: new Date('2026-01-01T00:00:00Z'),
  regexp: /ab+c/gi,
  map: new Map([['k', 'v']]),
  set: new Set([1, 2, 3]),
  fn: function namedFn() {},
  big: 9007199254740993n,
  sym: Symbol('标记'),
};

// 默认只展开 2 层，深层的会显示成 [Object]。
console.log('默认 depth：', util.inspect(nested));

// depth: null 表示不限制深度，排查问题时非常有用。
// 但要注意循环引用——inspect 会自动处理，打印成 [Circular *1]。
console.log('depth: null 时能看到最深层：',
  util.inspect(nested.level1.level2.level3, { depth: null }));

// 常用选项：
//   depth        展开层数，null 为不限
//   colors       是否着色（本示例统一关掉，避免重定向到文件时出现乱码）
//   compact      是否紧凑输出（false 时每个属性一行，diff 更好读）
//   sorted       键是否排序（true 时输出稳定，便于比较两次结果）
//   maxArrayLength  数组最多显示多少项（超出显示 ... more items）
//   breakLength  超过多少字符换行
//   showHidden   是否显示不可枚举属性与 Symbol 键
console.log('compact: false + sorted: true：');
console.log(util.inspect(nested, { compact: false, sorted: true, depth: 1, colors: false }));

// maxArrayLength 控制长数组的显示长度，避免刷屏。
const longArray = Array.from({ length: 8 }, (_, i) => `项${i + 1}`);
console.log('maxArrayLength: 3 ->', util.inspect(longArray, { maxArrayLength: 3 }));

// util.inspect.custom 是一个 Symbol：在对象上定义同名方法，
// 就能自定义 console.log / util.inspect 打印出来的样子。
// 这让日志更贴合业务语义，而不是裸奔的字段列表。
class Money {
  constructor(cents, currency) {
    this.cents = cents;
    this.currency = currency;
  }

  // 自定义检视形式：显示成 "¥19.99" 而不是 { cents: 1999, currency: 'CNY' }
  [util.inspect.custom]() {
    return `Money(${this.currency} ${(this.cents / 100).toFixed(2)})`;
  }
}
console.log('自定义 inspect：', new Money(1999, 'CNY'));
console.log('  => 注意它只影响"打印时"的显示，不影响数据本身。');

// ---------------------------------------------------------------------------
// 8. util.promisify —— 回调函数转 Promise
// ---------------------------------------------------------------------------

console.log('--- 8. util.promisify ---');

// 前提条件：目标函数满足"错误优先回调"约定（见 05_fs_callback.js）：
//   · 最后一个参数是回调
//   · 回调第一个参数是错误（成功时 null）
//   · 回调其余的才是结果
// 满足这两条，promisify 就能自动包装。
function readConfig(name, callback) {
  // 模拟一个异步接口。这里用 setTimeout 走异步流程。
  setTimeout(() => {
    if (name === 'missing') {
      // 错误优先：第一个参数传错误。
      const err = new Error('配置不存在');
      err.code = 'ENOENT';
      callback(err);
      return;
    }
    // 成功时第一个参数是 null。
    callback(null, { name, value: 42 });
  }, 10);
}

// promisify 后返回一个新函数，调用它得到 Promise。
const readConfigAsync = util.promisify(readConfig);

// 现在可以用 await 了，而且能直接被 try/catch 捕获错误。
const cfg = await readConfigAsync('app');
console.log('  promisify 后 await 的结果 =', JSON.stringify(cfg));

try {
  await readConfigAsync('missing');
} catch (err) {
  console.log('  promisify 后错误也能被 try/catch 捕获：', err.code, err.message);
}

// 注意：Node 官方很多模块已经直接提供 Promise 版本了，
// 不需要再 promisify。例如：
//   node:fs/promises（见 06_fs_promises.js）
//   node:timers/promises（见 11_timers.js）
//   node:stream/promises（见 08_streams_basics.js）
// promisify 主要用于第三方库或自己写的老式回调函数。

// 自定义 promisify 结果：如果回调有多个结果值，
// 可以用 util.promisify.custom 这个 Symbol 指定返回形式。
function multiResult(callback) {
  setTimeout(() => callback(null, '第一个', '第二个'), 5);
}
// 加上这个 Symbol 属性后，promisify 会直接使用它而不用默认包装。
multiResult[util.promisify.custom] = () =>
  new Promise((resolve) => {
    multiResult((err, a, b) => resolve([a, b]));
  });
const [firstVal, secondVal] = await util.promisify(multiResult)();
console.log('  自定义 promisify 拿到多值：', firstVal, '/', secondVal);

// 反向操作：util.callbackify 把返回 Promise 的函数转成回调风格。
const waitAsync = (ms) => new Promise((resolve) => setTimeout(() => resolve(`等了 ${ms}ms`), ms));
const waitCallback = util.callbackify(waitAsync);
// 回调风格：callback(err, result)
waitCallback(10, (err, result) => {
  console.log('  callbackify 后的回调收到：', err, JSON.stringify(result));
});
// 给回调流程一点时间。
await new Promise((resolve) => setTimeout(resolve, 30));

// ---------------------------------------------------------------------------
// 9. util.types —— 精确的类型判断
// ---------------------------------------------------------------------------

console.log('--- 9. util.types 类型判断 ---');

// 为什么要用它？因为 instanceof 依赖"构造函数来自哪个 JS 上下文"。
// 在 worker、vm、不同 realm 之间传递对象时，Date 的构造函数身份不同，
// instanceof Date 会返回 false。util.types 走的是内部类型标签，不受影响。
const values = [
  ['new Date()', new Date()],
  ['/re/g', /re/g],
  ['Promise.resolve()', Promise.resolve()],
  ['new Uint8Array(1)', new Uint8Array(1)],
  ['new ArrayBuffer(1)', new ArrayBuffer(1)],
  ['new Map()', new Map()],
  ['new Error()', new Error()],
  ['{}', {}],
  ['[]', []],
  ['async () => {}', async () => {}],
  ['null', null],
];

console.log('  值'.padEnd(24), 'isDate isRegExp isPromise isTypedArray');
for (const [label, value] of values) {
  const row = [
    util.types.isDate(value),
    util.types.isRegExp(value),
    util.types.isPromise(value),
    util.types.isTypedArray(value),
  ]
    .map((b) => String(b).padEnd(9))
    .join('');
  console.log('  ' + label.padEnd(24), row);
}

// 辅助函数本身的类型也可以用 util.types 判断（注意它不是普通对象）。
console.log('  async 函数是 isAsyncFunction 吗：', util.types.isAsyncFunction(async () => {}));
console.log('  普通函数是 isAsyncFunction 吗：', util.types.isAsyncFunction(() => {}));

// 一个更实用的判断：区分"数组"与"类数组"。
console.log('  isArrayBuffer(new ArrayBuffer(8)) =', util.types.isArrayBuffer(new ArrayBuffer(8)));
console.log('  isNativeError(new Error())       =', util.types.isNativeError(new Error()));

// ---------------------------------------------------------------------------
// 10. util.parseArgs —— 内置的命令行参数解析
// ---------------------------------------------------------------------------

console.log('--- 10. util.parseArgs 解析命令行 ---');

// 以前解析命令行参数要装 yargs / commander 这类库，
// Node 18.3 起内置了 parseArgs，够用且零依赖。
// 这里把"待解析的参数"当成数组直接传进去，方便演示；
// 真实 CLI 里换成 process.argv.slice(2) 即可（见 01_process_object.js）。
const fakeArgv = ['--name', '张三', '--verbose', '--port', '8080', 'input.txt', 'output.txt'];

const parsed = util.parseArgs({
  args: fakeArgv,
  options: {
    // type: 'string' 表示这个选项必须带值（--name 张三）
    name: { type: 'string', short: 'n' },
    // type: 'boolean' 表示它是个开关（出现即为 true）
    verbose: { type: 'boolean', short: 'v', default: false },
    // type: 'string' 且带 default，能省掉调用处的兜底判断
    port: { type: 'string', default: '3000' },
  },
  // allowPositionals: true 表示允许出现"不带 -- 的裸参数"
  allowPositionals: true,
});

console.log('  values      =', parsed.values, '（带名字的选项，值都是字符串或布尔）');
console.log('  positionals =', parsed.positionals, '（裸参数，按出现顺序）');
console.log('  => port 拿到的是字符串 "8080"，要用得自己 Number() 转换（见 01 的陷阱 2）。');
console.log('  转换后的 port =', Number(parsed.values.port), '，类型：', typeof Number(parsed.values.port));

// parseArgs 的默认行为：遇到不认识的选项会抛异常，这对 CLI 是正确的
// （尽早告诉用户"你拼错了"），但也提供了 strict: false 来放宽。
try {
  util.parseArgs({
    args: ['--unknown-flag'],
    options: { name: { type: 'string' } },
  });
} catch (err) {
  console.log('  解析未知选项报错：', err.code, '（ERR_PARSE_ARGS_UNKNOWN_OPTION）');
}

// 演示短选项：parseArgs 也支持 -n 张三 这种形式。
const shortParsed = util.parseArgs({
  args: ['-n', '李四', '-v'],
  options: {
    name: { type: 'string', short: 'n' },
    verbose: { type: 'boolean', short: 'v' },
  },
});
console.log('  短选项解析结果 =', shortParsed.values);

console.log('--- 全部演示结束 ---');
