/**
 * ============================================================================
 * 知识点：错误对象的属性 —— message / name / stack / cause
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】入门
 * 【前置知识】20_error_handling/02_error_types.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    错误对象上最有价值的四个属性：
 *      message  人类可读的错误描述，new Error('...') 的第一个参数
 *      name     错误类型名（'Error' / 'TypeError' / 自定义类的名字），
 *               它决定了 toString() 的前缀
 *      stack    **调用栈快照**，字符串形式，第一行通常是 "TypeError: message"，
 *               之后是"at 函数名 (文件:行:列)"的若干行 —— 定位问题的关键信息
 *      cause    造成本次错误的"根因错误"，通过 new Error(msg, { cause }) 传入（ES2022）
 *    另外 Error.prototype.toString() 会返回 `${name}: ${message}`。
 *
 * 2. 为什么需要
 *    (1) message 给用户看（或写进日志），name 给程序判断，stack 给开发者定位，
 *        cause 用来串联"错误链"。
 *    (2) 只打印 message 会丢掉定位信息；只打印 stack 又太长。
 *        生产环境的常见做法是：日志里记录完整 stack，返回给用户的只有 message。
 *    (3) name 是自定义错误类能做类型识别的关键（见 05_custom_errors.js）。
 *
 * 3. 核心语法要点
 *    (1) message / stack 都是**不可枚举**的自有属性（non-enumerable），
 *        所以 for...in、Object.keys 看不到它们，JSON.stringify 也不会带上它们。
 *    (2) name 来自 Error.prototype.name（继承而来），普通 Error 实例自己并没有
 *        name 这个自有属性；自定义错误类通常把 name 覆盖成自己的类名。
 *    (3) stack 是**非标准但所有主流引擎都实现**的属性，
 *        它是"错误被创建时"的快照，而不是被抛出或捕获时的。
 *    (4) cause 只在显式传入时存在，否则是 undefined；它可以是任意值。
 *    (5) 可以给错误对象挂自定义属性（如 err.statusCode = 404），这是非常常见的做法。
 *
 * 4. 常见陷阱
 *    (1) 用 JSON.stringify(err) 记录日志，结果得到 '{}'（因为关键属性不可枚举，
 *        自定义属性倒是会带上）。请改用 err.stack 或手动拼字段。
 *    (2) 在 catch 里重新抛出时把原错误丢掉：`catch (e) { throw new Error('失败') }`
 *        会让根因消失，正确做法是传 { cause: e }（见 06）。
 *    (3) 认为 stack 一定能拿到 —— 在某些环境（如部分嵌入式 JS 引擎、
 *        关闭了堆栈采集的配置）可能是 undefined，使用前应判空。
 *    (4) 解析 stack 字符串来获取行号：格式因引擎而异，仅在开发调试时可用。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/03_error_properties.js
 *
 * 【预期输出】
 *   打印一个错误对象的 message / name / stack / cause，
 *   对比可枚举属性与不可枚举属性，并演示自定义属性的用法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 四个核心属性
// ---------------------------------------------------------------------------

console.log('--- 1. 错误对象的四个核心属性 ---');

/**
 * 制造一个带 cause 的错误，方便观察各属性
 * @returns {Error}
 */
function createError() {
  const rootCause = new Error('底层：连接被拒绝');
  const err = new Error('上层：获取用户信息失败', { cause: rootCause });
  return err;
}

const err1 = createError();

console.log('message =', err1.message);
console.log('name    =', err1.name);
console.log('cause   =', err1.cause && err1.cause.message);
console.log('toString() =', err1.toString());
console.log('');
console.log('stack（调用栈，前 4 行）：');
console.log(err1.stack.split('\n').slice(0, 4).join('\n'));

// ---------------------------------------------------------------------------
// 2. stack 是"创建时"的快照
// ---------------------------------------------------------------------------

console.log('\n--- 2. stack 记录的是创建位置，不是抛出位置 ---');

function makeErrorHere() {
  return new Error('我在 makeErrorHere 里被创建');
}

function throwErrorElsewhere() {
  const e = makeErrorHere(); // 创建点在这里
  throw e; // 抛出点在下一层
}

try {
  throwErrorElsewhere();
} catch (err) {
  // stack 的第一条业务帧会是 makeErrorHere，而不是 throwErrorElsewhere，
  // 因为 stack 是在 new Error(...) 那一刻采集的。
  const lines = err.stack.split('\n').slice(1, 4);
  console.log('stack 的顶部几帧：');
  for (const line of lines) console.log('  ' + line.trim());
  console.log('可以观察到：第一个非 Node 内部的帧是 makeErrorHere（创建点）。');
}

// ---------------------------------------------------------------------------
// 3. message / stack 是不可枚举的
// ---------------------------------------------------------------------------

console.log('\n--- 3. 可枚举性（为什么 JSON.stringify 打印出空对象） ---');

const err2 = new Error('测试可枚举性');
err2.statusCode = 500; // 自定义属性默认是可枚举的

console.log('Object.keys(err2) =', JSON.stringify(Object.keys(err2)));
console.log('JSON.stringify(err2) =', JSON.stringify(err2), '← message/stack 都没了！');
console.log('因为 message / stack 被定义为 non-enumerable，而自定义属性不是。');

// 用描述符验证
const descMessage = Object.getOwnPropertyDescriptor(err2, 'message');
const descStack = Object.getOwnPropertyDescriptor(err2, 'stack');
console.log('message 的描述符：', JSON.stringify(descMessage));
console.log('stack   的描述符：enumerable =', descStack && descStack.enumerable);

// name 是继承来的，不是自有属性
console.log('err2 有自有的 name 属性吗？', Object.hasOwn(err2, 'name'));
console.log('err2.name 来自原型链：', err2.name, '（Error.prototype.name 的值）');

// ---------------------------------------------------------------------------
// 4. 自定义属性：给错误带上结构化信息
// ---------------------------------------------------------------------------

console.log('\n--- 4. 给错误挂自定义属性 ---');

/**
 * 模拟一次 HTTP 请求失败
 * @param {string} url
 * @returns {never}
 */
function request(url) {
  const err = new Error(`请求失败：${url}`);
  err.name = 'HttpError';
  err.statusCode = 503; // 业务字段：状态码
  err.url = url; // 业务字段：请求地址
  err.retryable = true; // 业务字段：是否可重试
  throw err;
}

try {
  request('https://example.com/api/user');
} catch (err) {
  console.log('捕获到：', err.name, '-', err.message);
  console.log('  statusCode =', err.statusCode);
  console.log('  url        =', err.url);
  console.log('  retryable  =', err.retryable);
  // 有了这些结构化字段，上层就能做判断：
  if (err.retryable && err.statusCode >= 500) {
    console.log('  → 判断结果：这是服务端临时故障，可以稍后重试');
  }
}

// ---------------------------------------------------------------------------
// 5. 安全地记录日志
// ---------------------------------------------------------------------------

console.log('\n--- 5. 如何正确地记录一个错误 ---');

/**
 * 把错误整理成适合写日志的普通对象
 * @param {unknown} err
 * @returns {object}
 */
function toLogObject(err) {
  // 错误可能根本不是 Error（有人 throw 了字符串），所以要防御性取值
  if (!(err instanceof Error)) {
    return { name: 'NonError', message: String(err), stack: undefined };
  }
  return {
    name: err.name,
    message: err.message,
    // stack 可能不存在（某些环境），用可选链 + 兜底
    stack: err.stack ?? '(无堆栈信息)',
    // 自定义字段按需带上
    statusCode: err.statusCode,
  };
}

const sample = new Error('样例错误');
sample.statusCode = 404;
console.log('整理成日志对象：');
console.log(JSON.stringify(toLogObject(sample), null, 2));
console.log('（注意：返回给用户时通常只给 message，stack 只进日志）');

console.log('\n--- 6. 小结 ---');
console.log('message：给人看的描述  name：类型名（决定 toString 前缀）');
console.log('stack  ：给开发者定位问题（创建时的快照，可能不存在）');
console.log('cause  ：根因错误，串联错误链（见 06_error_cause.js）');
console.log('自定义属性：携带结构化信息，便于上层按字段做决策。');
