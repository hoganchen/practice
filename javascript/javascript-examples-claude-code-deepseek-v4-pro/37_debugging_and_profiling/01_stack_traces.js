/**
 * ============================================================================
 * 知识点：调用栈追踪 —— Error.stack 的格式、截断控制与异步栈
 * ============================================================================
 *
 * 【所属分类】37_debugging_and_profiling —— 调试与性能剖析
 * 【难度等级】进阶
 * 【前置知识】20_error_handling/03_error_properties.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    调用栈（call stack）是"当前正在执行的函数，是被谁调用的、那个调用者又是
 *    被谁调用的……"这一条链。JS 引擎在【创建 Error 对象的那一刻】把这条链
 *    拍成快照，格式化成字符串放在 err.stack 上。
 *    err.stack 不是语言标准的一部分，但 V8（Node / Chrome）、SpiderMonkey、
 *    JavaScriptCore 都实现了它，格式也高度一致，所以它是排错的第一手资料。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 线上报警里只有一句 "Cannot read properties of undefined"，
 *      没有 stack 就完全不知道是哪个文件哪一行；
 *    - 日志系统/APM（Sentry、Datadog 之类）都是解析 stack 得到
 *      "文件 + 行 + 列 + 函数名" 然后做聚合、去重、告警的；
 *    - 自己写的自定义错误类、包装函数、SDK 会往栈里塞进一堆无用的中间帧，
 *      学会裁剪栈才能让日志干净；
 *    - 默认只保留 10 层帧，深层递归/长调用链会被截断，看到"栈不完整"时
 *      要知道是配置问题而不是代码问题。
 *
 * 3. 核心语法要点
 *    (1) err.stack 的格式：第 1 行是 "Name: message"，
 *        后面每行一个帧，形如 "    at 函数名 (文件:行:列)"。
 *        帧里的信息是"错误被【创建】时"的位置，不是被抛出/被捕获时。
 *    (2) Error.captureStackTrace(targetObject, constructorOpt)：
 *        V8 私有 API，把栈快照直接挂到任意对象上，并可以指定"从哪一层开始算"，
 *        常用来把自定义错误类的构造函数这一帧从栈里抹掉。
 *    (3) Error.stackTraceLimit：V8 的全局配置，默认 10，
 *        控制"最多收集多少层帧"；也可以启动时用 --stack-trace-limit=N 指定。
 *    (4) Error.prepareStackTrace：V8 的钩子，可以自定义 stack 的生成方式，
 *        把字符串换成结构化对象数组（CallSite），常用于自定义格式化。
 *    (5) 异步栈追踪（async stack traces）：V8 从 Node 12 起默认开启，
 *        它能在 Promise / async-await 链上把"跨 await 的调用者"也接回栈里，
 *        补上一个 Error 对象本身无法知道的上下文。
 *
 * 4. 常见陷阱
 *    - 陷阱一：以为 stack 能告诉你"谁抛的"。它只记录"在哪创建的"。
 *      很多库会在 A 处 new Error 却在 B 处 throw，看到的位置会迷惑你。
 *    - 陷阱二：异步底层 API（setTimeout / 事件回调 / I/O 回调）会打断调用栈。
 *      回调里抛错时，你看到的是定时器内部帧，看不到"是谁调度了这个定时器"。
 *    - 陷阱三：以为 async/await 也会断栈。其实不会——V8 的异步栈追踪会接回去，
 *      但只在 await/Promise 链上有用，对 setTimeout 这种"事件回调"无能为力。
 *    - 陷阱四：拿 stack 字符串去做程序逻辑（比如判断错误类型 / 提取行号）。
 *      栈格式因引擎和版本而异，只在开发调试期临时使用，别写进业务分支。
 *    - 陷阱五：把 Error.stackTraceLimit 设成 Infinity 用在生产环境。
 *      深递归时会产生巨大的字符串，既慢又占内存。
 *    - 陷阱六：捕获错误后重新抛出时丢掉了原 stack。
 *      `catch (e) { throw new Error(e.message) }` 会生成一个全新的栈，
 *      把真正的出错位置抹掉。正确做法是传 { cause: e } 或直接把原错误抛出去。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 37_debugging_and_profiling/01_stack_traces.js
 *
 * 【预期输出】
 *   打印 7 个小节：栈的整体结构、帧的六种形态、captureStackTrace 裁剪栈起点、
 *   stackTraceLimit 的截断效果、setTimeout 断栈的实证、async/await 的异步栈、
 *   以及用 prepareStackTrace 拿结构化帧。所有栈里的绝对路径都会被压成相对路径，
 *   打印出来的行号因本文件内容而异，属正常现象。
 * ============================================================================
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(FILE), '..');
const SCRIPT_START = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用小工具
// ---------------------------------------------------------------------------

/**
 * 把绝对路径压成相对仓库根目录的路径，让打印出来的栈更好读。
 * 栈里出现的是 "file:///C:/xxx/yyy.js" 这样的 URL，所以先转成文件路径。
 */
function shortenPath(filePath) {
  const rel = path.relative(ROOT, filePath);
  // 不在仓库内的文件（比如 Node 内部模块映射出来的路径）保持原样
  return rel.startsWith('..') ? filePath : rel.split(path.sep).join('/');
}

/**
 * CallSite.getFileName() 在 ESM 里返回的是 "file:///C:/..." 这样的 URL，
 * 在 CommonJS 里返回的是普通路径。统一转成相对仓库根目录的短路径。
 */
function toLocalPath(fileName) {
  if (!fileName) return '(无文件)';
  if (fileName.startsWith('file://')) {
    try {
      return shortenPath(fileURLToPath(fileName));
    } catch {
      return fileName;
    }
  }
  return shortenPath(fileName);
}

/** 把 stack 字符串里所有 file:/// 开头的 URL 换成相对路径 */
function readableStack(stack) {
  if (!stack) return '(这个错误对象没有 stack 属性)';
  return stack.replace(/file:\/\/\/[^\s)]+/g, (url) => {
    try {
      return shortenPath(fileURLToPath(url));
    } catch {
      return url;
    }
  });
}

/** 打印一个 stack，并给每一行标上行号，方便逐行解读 */
function printStackWithLineNumbers(stack, label) {
  console.log(`${label}：`);
  const lines = readableStack(stack).split('\n');
  lines.forEach((line, i) => {
    console.log(`  [${String(i).padStart(2)}] ${line}`);
  });
  return lines;
}

/** 小节标题 */
function section(n, title) {
  console.log(`\n--- ${n}. ${title} ---`);
}

// ---------------------------------------------------------------------------
// 1. stack 的整体结构：一行头部 + 若干帧
// ---------------------------------------------------------------------------

section(1, 'stack 的整体结构');

// 制造一条 3 层深的调用链：levelA → levelB → levelC
function levelC() {
  // 错误对象在这里被【创建】，所以栈的快照就是此刻的调用链
  return new Error('这是一个演示用的错误');
}
function levelB() {
  return levelC();
}
function levelA() {
  return levelB();
}

const demoError = levelA();
const demoLines = printStackWithLineNumbers(demoError.stack, '一个 3 层调用链产生的 stack');

console.log('');
console.log('逐部分拆解：');
console.log(`  第 [0] 行是头部，格式固定为 "错误类型: 错误信息"，本例是 "${demoLines[0]}"。`);
console.log('  从第 [1] 行开始，每一行是一个"栈帧"，代表调用链上的一层。');
console.log('  帧的书写顺序是【从内到外】：最上面的是最近的一次调用，最下面的是最外层。');
console.log('  所以读栈的正确姿势是【从上往下读】：出错点在上，调用者依次向下。');
console.log('');
console.log('还有一个常被忽略的细节：');
console.log('  stack 记录的是"Error 对象被创建"时的位置，而不是"被 throw"的位置。');
console.log('  有些库会在底层 new Error(...) 保存现场，再在上层统一 throw，');
console.log('  这时 stack 指向的是 new 的那一行——这往往是排查中的关键线索。');

// ---------------------------------------------------------------------------
// 2. 帧的六种形态：读懂每一行长什么样
// ---------------------------------------------------------------------------

section(2, '帧的六种形态');

// 2.1 普通具名函数：at 函数名 (文件:行:列)
function namedFrameDemo() {
  return namedFrameDemoInner();
}
function namedFrameDemoInner() {
  return new Error('具名函数');
}

// 2.2 对象方法：at Object.方法名 (...) 或 at 类名.方法名 (...)
const frameObj = {
  methodDemo() {
    return new Error('对象方法');
  },
};

// 2.3 构造函数：at new 类名 (...)
class FrameDemoClass {
  constructor() {
    this.err = new Error('构造函数');
  }
}

// 2.4 匿名函数：赋值给变量时，V8 会用变量名兜底；完全匿名时只剩位置
const anonymousArrow = () => new Error('箭头函数（有变量名可用）');
const bareAnonymous = [
  function () {
    return new Error('完全匿名的函数表达式');
  },
][0];

// 2.5 顶层模块代码：没有函数名，只有文件位置
//     （本文件最底部那几行 console.log 就在顶层执行）

const frameSamples = [
  ['普通具名函数', namedFrameDemo().stack],
  ['箭头函数（有变量名）', anonymousArrow().stack],
  ['完全匿名的函数表达式', bareAnonymous().stack],
  ['对象方法', frameObj.methodDemo().stack],
  ['构造函数', new FrameDemoClass().err.stack],
  ['模块顶层代码（下面这个错误直接在顶层创建）', new Error('顶层').stack],
];

for (const [label, stack] of frameSamples) {
  const frames = readableStack(stack).split('\n');
  // 只取第一帧（最内层）来对比形态
  console.log(`${label.padEnd(22)} → 第一帧：${frames[1] ?? '(无)'}`);
}

console.log('');
console.log('归纳一下你会见到的几种帧写法：');
console.log('  at 函数名 (文件:行:列)          —— 最常见，函数名来自函数声明或变量名');
console.log('  at Object.方法名 (文件:行:列)   —— 对象字面量/模块导出的方法');
console.log('  at 类名.方法名 (文件:行:列)     —— 类的方法（含静态方法）');
console.log('  at new 类名 (文件:行:列)        —— 通过 new 调用的构造函数');
console.log('  at file:行:列 或 at 文件:行:列  —— 匿名函数、模块顶层，没有可用名字');
console.log('  at async 函数名 (文件:行:列)    —— 异步函数的帧，见第 6 节');
console.log('  at node:internal/xxx:行:列      —— Node 内部实现，不是你的代码');
console.log('');
console.log('小技巧：读栈时先【跳过】所有 node:internal/ 开头的帧和 node_modules 里的帧，');
console.log('  第一个属于你自己项目的帧，通常就是真正要改的地方。');

// ---------------------------------------------------------------------------
// 3. Error.captureStackTrace：自定义栈的起点
// ---------------------------------------------------------------------------

section(3, 'Error.captureStackTrace：把无用的帧裁掉');

// 3.1 先在"函数式自定义错误"（ES5 风格）上看问题：
//     这种写法必须手动调用 captureStackTrace，否则连 stack 都没有；
//     而手动调用时如果不传 constructorOpt，构造函数自己会占据第一帧。
function LegacyError(message) {
  this.message = message;
  this.name = 'LegacyError';
  // 只传一个参数：从当前这一层开始采集，所以第一帧就是 LegacyError 自己
  Error.captureStackTrace(this);
}

function TrimmedError(message) {
  this.message = message;
  this.name = 'TrimmedError';
  // 第二个参数 constructorOpt：V8 会从栈顶开始丢弃帧，
  // 一直丢到（并包含）这个函数为止。传自己，就正好把自己这一帧去掉。
  Error.captureStackTrace(this, TrimmedError);
}

// 一个普通的调用者，用来观察"错误的第一帧到底是谁"
function callerOf(ErrorCtor) {
  return new ErrorCtor('演示用的错误');
}

console.log('不传 constructorOpt 时（注意第一帧就是构造函数自己）：');
printStackWithLineNumbers(callerOf(LegacyError).stack, '  LegacyError');

console.log('');
console.log('传了 constructorOpt 时（构造函数这一帧被丢掉了）：');
printStackWithLineNumbers(callerOf(TrimmedError).stack, '  TrimmedError');

console.log('');
console.log('语义要点：constructorOpt 不是"从这一层开始采集"，而是');
console.log('  "从栈顶往下丢，丢到并包含这一层为止"。');
console.log('  所以它的正确用法永远是"把当前正在创建错误的那个包装函数传进去"，');
console.log('  让栈的第一帧成为真正有意义的调用方。');

// 3.2 那 class 风格的自定义错误要不要写？
class ClassError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClassError';
    // 这里【故意没有】调用 Error.captureStackTrace
  }
}

console.log('');
const classLines = printStackWithLineNumbers(callerOf(ClassError).stack, '  ClassError（未显式裁剪）');
console.log('');
console.log('实测结论（很重要，和很多老文章的写法不一样）：');
console.log(`  ClassError 的第一帧是 "${(classLines[1] ?? '').trim()}"，`);
console.log('  构造函数这一帧【本来就没有出现】——因为用 class extends Error 时，');
console.log('  V8 在 Error 构造函数内部已经用 new.target 把派生构造函数自己裁掉了。');
console.log('');
console.log('  所以对 class 风格来说，再写一遍 Error.captureStackTrace(this, ClassError)');
console.log('  通常只是"没有副作用的好习惯"：语义更明确、对旧引擎/其他实现更保险。');
console.log('  真正必须写的场合是：函数式自定义错误、以及自己封装的错误工厂函数。');

// 3.3 captureStackTrace 的另一半能力：挂到任意对象上（不一定是 Error）
//     它创建出来的 stack 是一个"惰性 getter"：不访问就不格式化。
const lazySite = {};
function captureSite() {
  Error.captureStackTrace(lazySite, captureSite);
}
captureSite();
const desc = Object.getOwnPropertyDescriptor(lazySite, 'stack');
console.log('');
console.log('captureStackTrace 也可以挂到任意普通对象上（不限于 Error）：');
console.log(`  它是普通对象吗？${!(lazySite instanceof Error)}`);
console.log(`  头部显示的类型名是什么？（取自对象自身的 name/message）"${readableStack(lazySite.stack).split('\n')[0]}"`);
console.log(`  stack 是不是"访问时才计算"的 getter？${typeof desc?.get === 'function'}`);
console.log('');
console.log('这个特性很有用：日志量很大时，可以把"昂贵的栈格式化"推迟到');
console.log('  真正需要输出的那一刻（比如命中采样率才去取 .stack），');
console.log('  而不是为每一条日志都付一次采集与格式化成本。');
console.log(`  对比帧数量级：普通对象这次共 ${readableStack(lazySite.stack).split('\n').length} 行（含 1 行头部）。`);

// ---------------------------------------------------------------------------
// 4. Error.stackTraceLimit：栈的截断与恢复
// ---------------------------------------------------------------------------

section(4, 'Error.stackTraceLimit：栈的截断');

/** 造一条深度为 depth 的递归调用链，返回最内层创建的 Error */
function deepChain(depth) {
  if (depth <= 0) return new Error('递归到底了');
  return deepChain(depth - 1);
}

const DEPTH = 50;
const originalLimit = Error.stackTraceLimit; // 默认值 10
console.log(`当前 Error.stackTraceLimit = ${originalLimit}（V8 默认值）`);

/** 统计一个 stack 里的帧数（总行数减去头部那一行） */
const frameCount = (stack) => readableStack(stack).split('\n').length - 1;

try {
  // 4.1 默认设置下的深层递归
  const defaultStack = deepChain(DEPTH).stack;
  console.log(`递归 ${DEPTH} 层，默认限制下栈里有 ${frameCount(defaultStack)} 帧 —— 被截断了。`);
  console.log('  注意栈的最后一行，它不是你代码里的函数，而是采集停止的边界。');

  // 4.2 调大限制（本示例用 30，够用且不会产生巨型字符串）
  Error.stackTraceLimit = 30;
  const enlarged = frameCount(deepChain(DEPTH).stack);
  console.log(`把 stackTraceLimit 改成 30 之后，同样的递归拿到 ${enlarged} 帧。`);

  // 4.3 设成 0：连头部都不生成完整信息
  Error.stackTraceLimit = 0;
  const zeroStack = deepChain(5).stack;
  console.log(`把 stackTraceLimit 设成 0 之后，stack 长度只剩 ${readableStack(zeroStack).split('\n').length} 行（只剩头部）。`);
  console.log('  —— 这是"我要错误类型和消息，但不要采集开销"的极端配置。');

  // 4.4 设成 1：只保留最内层一帧
  Error.stackTraceLimit = 1;
  const oneStack = readableStack(deepChain(5).stack).split('\n');
  console.log(`设成 1 时，只剩最内层那一个帧：${oneStack[1] ?? '(无)'}`);
} finally {
  // 4.5 一定要恢复！Error.stackTraceLimit 是【全局设置】，
  //     改了它会影响整个进程后续创建的所有 Error。
  Error.stackTraceLimit = originalLimit;
}
console.log(`已恢复为 ${Error.stackTraceLimit}。`);

console.log('');
console.log('使用建议：');
console.log('  · Error.stackTraceLimit 是全局的，属于"改了必须还"的配置，用 try/finally 包住；');
console.log('  · 也可以在启动时用命令行指定，避免改代码：');
console.log('      node --stack-trace-limit=50 37_debugging_and_profiling/01_stack_traces.js');
console.log('  · 生产环境不要设成 Infinity：深递归 + 高 QPS 时，');
console.log('    每次建栈都要遍历调用链并做字符串格式化，是实打实的开销；');
console.log('  · 记录日志时如果嫌栈太长，裁剪的更好位置是【日志格式化那一步】，');
console.log('    而不是把全局限制调小——后者会让所有错误都丢失上下文。');

// ---------------------------------------------------------------------------
// 5. 异步边界断栈：setTimeout / 事件回调
// ---------------------------------------------------------------------------

section(5, '异步边界会打断调用栈（setTimeout 实证）');

/** 这个函数负责"调度"一个定时器 —— 我们想知道回调抛错时能否看到它 */
function scheduleWork() {
  setTimeout(function onTimeout() {
    // 回调里创建错误：此刻的调用链已经和 scheduleWork 无关了
    const err = new Error('定时器回调里发生的错误');
    console.log('setTimeout 回调中捕获到的 stack：');
    const lines = printStackWithLineNumbers(err.stack, '  setTimeout 回调');
    const joined = lines.join('\n');
    console.log('');
    console.log(`  栈里能看到调度者 scheduleWork 吗？ ${joined.includes('scheduleWork')}`);
    console.log(`  栈里能看到定时器内部实现吗？   ${joined.includes('node:internal/timers')}`);
    console.log('');
    console.log('这就是"异步断栈"：回调函数是由事件循环在未来的某个时刻调用的，');
    console.log('  它和当初调用 scheduleWork 的那条调用链之间【没有任何栈上的关联】。');
    console.log('  栈只能告诉你"错误发生在 onTimeout 里"，不能告诉你"是谁安排的"。');

    finish();
  }, 0);
}

// 用 Promise 把异步流程接回顶层，保证脚本"不提前结束"也"不挂起"
let finish;
const allDone = new Promise((resolve) => {
  finish = resolve;
});

scheduleWork();
await allDone;

console.log('');
console.log('常见受影响的异步来源（都会断栈）：');
console.log('  setTimeout / setInterval / setImmediate、事件监听器、');
console.log('  文件与网络 I/O 的回调、process 上的信号处理、数据库驱动的回调。');
console.log('');
console.log('应对办法（无需调试器）：');
console.log('  1) 在"调度点"就把上下文记下来：');
console.log('     const err = new Error("..."); 或者直接记录 requestId；');
console.log('  2) 用 AsyncLocalStorage（见 06_production_error_reporting.js）');
console.log('     把 requestId 之类的上下文自动带过异步边界；');
console.log('  3) 用 Node 的 async_hooks / AsyncResource 追踪异步资源的因果链；');
console.log('  4) 在回调入口处调用 console.trace() 打印"当前栈"，');
console.log('     确认回调确实是在一个全新的栈上执行的。');

// ---------------------------------------------------------------------------
// 6. async / await 与异步栈追踪
// ---------------------------------------------------------------------------

section(6, 'async/await 不会断栈：async stack traces');

// 6.1 反面写法：中间层直接 return 一个 Promise（没有 await）
async function innerReturn() {
  await null; // 让出一次，制造一个真正的"跨 await"场景
  return new Error('【写法一】中间层直接 return Promise');
}
async function midReturn() {
  return innerReturn(); // ← 注意：没有 await
}
async function outerReturn() {
  return midReturn(); // ← 注意：没有 await
}

// 6.2 正面写法：中间层用 await 真正等待子 Promise
async function innerAwait() {
  await null;
  return new Error('【写法二】中间层 return await Promise');
}
async function midAwait() {
  return await innerAwait(); // ← 有 await
}
async function outerAwait() {
  return await midAwait(); // ← 有 await
}

const returnStyleErr = await outerReturn();
console.log('写法一（中间层没有 await）的 stack：');
printStackWithLineNumbers(returnStyleErr.stack, '  return innerReturn()');

const awaitStyleErr = await outerAwait();
console.log('');
console.log('写法二（中间层 return await）的 stack：');
const awaitLines = printStackWithLineNumbers(awaitStyleErr.stack, '  return await innerAwait()');

const returnJoined = readableStack(returnStyleErr.stack);
const awaitJoined = awaitLines.join('\n');
console.log('');
console.log(`  写法一的栈里能看到 midReturn / outerReturn 吗？ ${returnJoined.includes('midReturn') || returnJoined.includes('outerReturn')}`);
console.log(`  写法二的栈里能看到 midAwait / outerAwait 吗？   ${awaitJoined.includes('midAwait') && awaitJoined.includes('outerAwait')}`);
console.log('');
console.log('关键差异：');
console.log('  · setTimeout 的回调【完全】看不到调度者（异步资源不是 Promise）；');
console.log('  · async/await 链上，V8 会把异步函数的帧接回来，');
console.log('    帧的形式是 "at async 函数名 (文件:行:列)" ——注意多了 async 前缀；');
console.log('  · 但前提是调用链上真的【await】过这个 Promise。');
console.log('    `return innerPromise` 只是把 Promise 往上传，中间没有发生等待，');
console.log('    V8 就没有机会把这一层挂到异步因果链上，帧就丢了。');
console.log('');
console.log('这也解释了那条常被争论的规则："到底要不要写 return await？"');
console.log('  · 一般情况下 `return promise` 更简洁，多写一个 await 只会多绕一个微任务；');
console.log('  · 但在 try/catch 里、以及你希望【保留异步调用栈】时，');
console.log('    `return await promise` 是有实际价值的——本示例就是实证。');
console.log('');
console.log('它的原理：每个 async 函数的 Promise 会记住"创建它的那个栈"，');
console.log('  当这个 Promise 被 await 时，V8 把那段"异步父帧"拼接进栈里。');
console.log('  所以它是靠 Promise 的因果链实现的，不是靠引擎魔法。');
console.log('');
console.log('对应的开关（Node 12 起默认开启，一般不用管）：');
console.log('  开启：node --async-stack-traces 37_debugging_and_profiling/01_stack_traces.js');
console.log('  关闭：node --no-async-stack-traces 37_debugging_and_profiling/01_stack_traces.js');
console.log('  可以自己对比两次输出，关闭后 "at async midAwait" 那几帧就消失了。');

// ---------------------------------------------------------------------------
// 7. 进阶：用 Error.prepareStackTrace 拿结构化帧
// ---------------------------------------------------------------------------

section(7, 'Error.prepareStackTrace：把栈变成结构化数据');

// Error.prepareStackTrace 是 V8 的钩子函数：
// 设置之后，访问任何 Error 的 .stack 时都会走这个函数，返回值就是 .stack 的值。
// 参数中的 structuredStackTrace 是一个 CallSite 对象数组，每个对象代表一个帧，
// 可以拿到函数名、文件名、行号、列号、是否 native、是否 async 等结构化信息。
// 注意：它同样是【全局设置】，且会屏蔽掉引擎默认的格式化行为，用完必须还原。
const originalPrepare = Error.prepareStackTrace;

/** 把 CallSite 数组变成我们自己的结构 */
function collectFrames(err) {
  const sites = err.stack; // 此时 .stack 已经是 CallSite 数组（因为我们装了钩子）
  return sites.map((site) => ({
    fn: site.getFunctionName() ?? site.getMethodName() ?? '(匿名)',
    file: toLocalPath(site.getFileName()),
    line: site.getLineNumber(),
    column: site.getColumnNumber(),
    isAsync: site.isAsync(),
    isNative: site.isNative(),
    isEval: site.isEval(),
  }));
}

let frames = [];
try {
  Error.prepareStackTrace = (_err, structuredStackTrace) => structuredStackTrace;
  frames = collectFrames(asyncErrRecreate());
} finally {
  // 一定要还原，否则本进程内所有库拿到的 .stack 都会变成数组
  Error.prepareStackTrace = originalPrepare;
}

// 上面这一句里故意放了一个"创建一个全新的错误"的调用，让帧更丰富
function asyncErrRecreate() {
  return new Error('结构化帧演示');
}

console.log('开启 prepareStackTrace 钩子后，可以逐帧读到结构化的字段：');
console.log(
  '  序号'.padEnd(6) + '函数名'.padEnd(26) + '文件'.padEnd(42) + '行'.padEnd(6) + '列'.padEnd(6) + 'async',
);
console.log('-'.repeat(94));
frames.slice(0, 6).forEach((f, i) => {
  console.log(
    String(i).padEnd(6) +
      String(f.fn).slice(0, 24).padEnd(26) +
      String(f.file).slice(0, 40).padEnd(42) +
      String(f.line).padEnd(6) +
      String(f.column).padEnd(6) +
      String(f.isAsync),
  );
});
console.log('');
console.log(`  本次共拿到 ${frames.length} 个结构化帧（默认 limit 下最多 ${Error.stackTraceLimit} 个）。`);

// 还原之后，.stack 又变回普通字符串了
const afterRestore = readableStack(new Error('还原之后').stack).split('\n')[1];
console.log('');
console.log('还原钩子之后，.stack 又回到字符串格式：');
console.log(`  ${afterRestore}`);
console.log('');
console.log('几个要点：');
console.log('  · 结构化帧是"自己解析栈"的正规做法，不要用正则去啃 stack 字符串；');
console.log('  · 但 Error.prepareStackTrace 是 V8 私有 API，浏览器/引擎兼容性有限，');
console.log('    库作者用它时要做好降级（拿不到 CallSite 就退回解析字符串）；');
console.log('  · 它是全局的，装上之后所有 Error 的 .stack 都会变，用完必须还原；');
console.log('  · APM 库（Sentry 那种）内部就是这么干的：装钩子、抓帧、脱敏、上报。');
console.log('  · 本示例的路径压缩只处理仓库内的文件，');
console.log('    真实项目里通常还会把 node_modules 的帧整体丢弃。');

// ---------------------------------------------------------------------------
// 8. 排查清单
// ---------------------------------------------------------------------------

section(8, '栈相关排查清单');

const checklist = [
  ['日志里永远带上 err.stack', '只记录 message 等于放弃定位能力'],
  ['异步回调里的错误要补上下文', '栈在异步边界断掉，靠 requestId 等字段补'],
  ['函数式自定义错误要手动 captureStackTrace', '否则要么没有栈，要么栈顶是构造函数自己'],
  ['改动 Error.stackTraceLimit 必须还原', '它是全局设置，会影响进程内所有 Error'],
  ['生产环境不要设 stackTraceLimit=Infinity', '深递归时字符串巨大，既慢又占内存'],
  ['不要用解析 stack 的结果做业务判断', '格式因引擎/版本而异，只能在调试期用'],
  ['重新抛出时保留原因', 'throw new Error(msg, { cause: e })，别丢掉原栈'],
  ['优先读栈顶第一个"自己的"帧', '跳过 node:internal 与 node_modules'],
];

console.log('要点'.padEnd(42) + '说明');
console.log('-'.repeat(94));
for (const [item, reason] of checklist) {
  console.log(item.padEnd(40) + reason);
}

console.log('');
console.log('一句话总结：栈是"错误被创建那一刻的调用链快照"，');
console.log('  它最强的能力是定位，最大的盲区是异步边界。');

console.log(`\n本示例总耗时约 ${Date.now() - SCRIPT_START} ms。`);
console.log('示例结束。');
