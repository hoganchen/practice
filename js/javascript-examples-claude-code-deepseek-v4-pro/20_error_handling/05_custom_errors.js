/**
 * ============================================================================
 * 知识点：自定义错误类 —— extends Error、修正 name、instanceof 判断、捕获特定错误
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】进阶
 * 【前置知识】20_error_handling/02_error_types.js、14_classes/01_class_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    通过 class XxxError extends Error 定义自己的错误类型：
 *      class ValidationError extends Error {
 *        constructor(message, field) {
 *          super(message);          // 必须最先调用 super
 *          this.name = 'ValidationError';  // 修正 name，否则 toString 仍是 "Error: ..."
 *          this.field = field;      // 自定义字段
 *        }
 *      }
 *    之后就能用 `err instanceof ValidationError` 精确识别它。
 *
 * 2. 为什么需要
 *    (1) 内置错误类型太笼统：`new Error('用户不存在')` 和 `new Error('数据库连接失败')`
 *        在类型上毫无区别，上层无法据此决定"重试 / 提示用户 / 报警"。
 *    (2) 自定义类型让错误具备**语义**：NotFoundError 可以直接映射成 HTTP 404，
 *        ValidationError 映射成 400，RetryableError 触发重试逻辑。
 *    (3) 便于分层：领域错误、基础设施错误、编程错误各自成类，边界清晰。
 *    (4) instanceof 判断不依赖 message 文案，不怕改文案、不怕换语言。
 *
 * 3. 核心语法要点
 *    (1) 必须在构造函数里先调用 super(message)，否则访问 this 会报错。
 *    (2) 必须手动设置 this.name = 'XxxError'，否则 name 继承自 Error.prototype，
 *        仍是 'Error'，日志里会显示成 "Error: xxx"，无法区分。
 *    (3) 自定义字段（如 field、statusCode、code）直接在构造函数里赋值即可，
 *        它们默认是可枚举的，会被 JSON.stringify 带上。
 *    (4) 用 Error.captureStackTrace(err, ConstructorFn) 可以让堆栈从"抛出的地方"
 *        开始，而不是从构造函数内部开始，日志更干净（V8 提供，非标准）。
 *    (5) 继承链可以多级：ValidationError 之下还能有 RequiredFieldError，
 *        此时 instanceof ValidationError 依然成立（原型链）。
 *
 * 4. 常见陷阱
 *    (1) 忘了写 this.name —— 最常见的问题，导致所有自定义错误看起来都叫 Error。
 *    (2) 忘了 super() 或 super 之前用了 this。
 *    (3) 用 ES5 转译（Babel 把 class 转成 function + 原型链）时，
 *        继承内置 Error 会丢失原型链，需要 Object.setPrototypeOf(this, XxxError.prototype) 修补；
 *        现代 Node/浏览器直接支持 class 继承，不需要这一步（本文件会演示判断方法）。
 *    (4) 把 catch 写成 `catch (e) { if (e instanceof XxxError) ... }` 却没有 else 分支
 *        重新抛出，导致其它错误被静默吞掉。
 *    (5) 自定义错误类不要写得太细碎（几十个类），否则维护成本大于收益。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/05_custom_errors.js
 *
 * 【预期输出】
 *   定义三种自定义错误并演示：name 是否正确、instanceof 是否生效、
 *   如何按类型分流捕获，以及 captureStackTrace 的效果。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 定义一个基础的自定义错误类
// ---------------------------------------------------------------------------

console.log('--- 1. 自定义错误类的基本写法 ---');

/**
 * 应用级错误基类：所有业务错误的父类。
 * 加上 baseCode 便于统一识别"这是我们自己的错误"。
 */
class AppError extends Error {
  /**
   * @param {string} message 错误描述
   * @param {{ code?: string, statusCode?: number, cause?: unknown }} [options]
   */
  constructor(message, options = {}) {
    // super 必须第一个调用，它会设置 message 并采集堆栈
    super(message, { cause: options.cause });
    // 关键一步：修正 name，否则 name 会继承为 'Error'
    this.name = this.constructor.name; // 用 constructor.name 让子类自动获得正确的名字
    // 错误码：字符串形式，便于程序判断（类似 Node 的 err.code）
    this.code = options.code ?? 'APP_ERROR';
    // 建议的 HTTP 状态码，便于 Web 层直接使用
    this.statusCode = options.statusCode ?? 500;
    // 让堆栈从"真正抛出的位置"开始，隐藏构造函数内部的帧（V8 提供）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/** 输入校验失败 */
class ValidationError extends AppError {
  /**
   * @param {string} message
   * @param {string} field 出错的字段名
   */
  constructor(message, field) {
    super(message, { code: 'VALIDATION_ERROR', statusCode: 400 });
    this.field = field;
  }
}

/** 资源不存在 */
class NotFoundError extends AppError {
  /**
   * @param {string} resource 资源类型
   * @param {string|number} id 资源标识
   */
  constructor(resource, id) {
    super(`${resource} 不存在：${id}`, { code: 'NOT_FOUND', statusCode: 404 });
    this.resource = resource;
    this.resourceId = id;
  }
}

/** 可重试的临时故障 */
class RetryableError extends AppError {
  /**
   * @param {string} message
   * @param {number} retryAfterMs 建议的重试间隔
   */
  constructor(message, retryAfterMs = 100) {
    super(message, { code: 'RETRYABLE', statusCode: 503 });
    this.retryAfterMs = retryAfterMs;
  }
}

const base = new AppError('通用应用错误');
const vErr = new ValidationError('邮箱格式不正确', 'email');
const nErr = new NotFoundError('User', 42);
const rErr = new RetryableError('下游服务繁忙', 200);

console.log('base.name =', base.name, '| toString() =', base.toString());
console.log('vErr.name =', vErr.name, '| message =', vErr.message, '| field =', vErr.field);
console.log('nErr.name =', nErr.name, '| message =', nErr.message);
console.log('rErr.name =', rErr.name, '| retryAfterMs =', rErr.retryAfterMs);

// ---------------------------------------------------------------------------
// 2. name 修正的必要性：对比"忘了写 name"的情况
// ---------------------------------------------------------------------------

console.log('\n--- 2. 忘记修正 name 会怎样 ---');

/** 一个"写漏了 this.name"的错误类 */
class BadError extends Error {
  constructor(message) {
    super(message);
    // 故意不写 this.name = 'BadError'
  }
}

const bad = new BadError('我忘了设置 name');
console.log('bad.name =', bad.name, '← 依然是 "Error"，日志里根本区分不出来');
console.log('bad.toString() =', bad.toString(), '← 看不出这是哪一个自定义错误');
console.log('虽然 instanceof BadError 依然成立：', bad instanceof BadError);

// ---------------------------------------------------------------------------
// 3. instanceof 判断与继承链
// ---------------------------------------------------------------------------

console.log('\n--- 3. instanceof 与继承链 ---');

const checks = [
  ['vErr instanceof ValidationError', vErr instanceof ValidationError],
  ['vErr instanceof AppError      ', vErr instanceof AppError],
  ['vErr instanceof Error         ', vErr instanceof Error],
  ['vErr instanceof RetryableError', vErr instanceof RetryableError],
  ['nErr instanceof ValidationError', nErr instanceof ValidationError],
  ['bad  instanceof BadError      ', bad instanceof BadError],
];

for (const [label, value] of checks) {
  console.log(`  ${label.padEnd(32)} → ${value}`);
}
console.log('自定义错误既属于自己，也属于父类与 Error（原型链自然成立）。');
console.log('现代 Node/浏览器直接用 class extends Error 即可，不需要 ES5 时代的');
console.log('Object.setPrototypeOf(this, XxxError.prototype) 修补（那是对转译产物的补救）。');

// ---------------------------------------------------------------------------
// 4. 按错误类型分流处理
// ---------------------------------------------------------------------------

console.log('\n--- 4. 按错误类型分流处理 ---');

/**
 * 模拟一个用户查询接口，会根据 id 抛出不同的自定义错误
 * @param {unknown} id
 * @returns {{ id: number, name: string }}
 */
function getUser(id) {
  if (typeof id !== 'number' || Number.isNaN(id)) {
    throw new ValidationError('id 必须是数字', 'id');
  }
  if (id === 503) {
    throw new RetryableError('用户服务暂时不可用', 150);
  }
  if (id !== 1) {
    throw new NotFoundError('User', id);
  }
  return { id: 1, name: '张三' };
}

/**
 * Web 层统一错误处理器：把不同错误映射成 HTTP 响应
 * @param {unknown} id
 * @returns {{ status: number, body: object }}
 */
function handleRequest(id) {
  try {
    const user = getUser(id);
    return { status: 200, body: user };
  } catch (err) {
    if (err instanceof ValidationError) {
      return { status: 400, body: { error: err.message, field: err.field, code: err.code } };
    }
    if (err instanceof NotFoundError) {
      return { status: 404, body: { error: err.message, resource: err.resource } };
    }
    if (err instanceof RetryableError) {
      return {
        status: 503,
        body: { error: err.message, retryAfterMs: err.retryAfterMs },
      };
    }
    if (err instanceof AppError) {
      // 兜底：其它应用错误统一按 500 处理
      return { status: 500, body: { error: err.message, code: err.code } };
    }
    // 关键：不是我们认识的错误，重新抛出交给全局兜底（不要吞掉！）
    throw err;
  }
}

for (const id of [1, 999, 'abc', 503]) {
  const res = handleRequest(id);
  console.log(`请求 id=${String(id).padEnd(5)} → HTTP ${res.status} ${JSON.stringify(res.body)}`);
}

console.log('\n注意：最后那个 `throw err` 非常重要 —— 未知错误必须继续向上抛，');
console.log('      否则真正的 bug 会被"看起来很正常"的 500 返回值掩盖掉。');

// ---------------------------------------------------------------------------
// 5. captureStackTrace：让堆栈更干净
// ---------------------------------------------------------------------------

console.log('\n--- 5. Error.captureStackTrace 的效果 ---');

// 典型使用场景：错误由"工厂函数"创建（比如统一的 errFactory）。
// 默认情况下，工厂函数那一帧会出现在堆栈里，干扰定位；
// Error.captureStackTrace(err, fn) 可以让堆栈从 fn 的**调用者**开始，
// 也就是把 fn 及其以上的帧全部剪掉。

/** 没有裁剪堆栈的类 */
class NoisyError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NoisyError';
  }
}

/** 裁剪掉工厂函数那一帧的类 */
class TrimmedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TrimmedError';
    if (Error.captureStackTrace) {
      // 第二个参数是"从此函数开始截断"，这里传创建它的工厂函数
      Error.captureStackTrace(this, createTrimmedError);
    }
  }
}

/**
 * 工厂函数：统一创建 NoisyError
 * @param {string} m
 * @returns {Error}
 */
function createNoisyError(m) {
  return new NoisyError(m);
}

/**
 * 工厂函数：统一创建 TrimmedError
 * @param {string} m
 * @returns {Error}
 */
function createTrimmedError(m) {
  return new TrimmedError(m);
}

/** 实际业务函数（我们希望堆栈的第一帧是它） */
function businessLogicNoisy() {
  throw createNoisyError('从业务逻辑抛出');
}

/** 实际业务函数（裁剪版本） */
function businessLogicTrimmed() {
  throw createTrimmedError('从业务逻辑抛出');
}

/**
 * 取堆栈里属于本文件的帧
 * @param {Error} err
 * @returns {string[]}
 */
function ownFrames(err) {
  return err.stack
    .split('\n')
    .filter((line) => line.includes('05_custom_errors.js'))
    .slice(0, 3)
    .map((l) => l.trim());
}

try {
  businessLogicNoisy();
} catch (err) {
  console.log('未裁剪的堆栈（前几帧）：');
  for (const line of ownFrames(err)) console.log('  ' + line);
}

try {
  businessLogicTrimmed();
} catch (err) {
  console.log('用 captureStackTrace 裁剪后的堆栈（前几帧）：');
  for (const line of ownFrames(err)) console.log('  ' + line);
}

console.log('对比可见：未裁剪时堆栈第一帧是工厂函数 createNoisyError，');
console.log('裁剪后第一帧直接是业务函数 businessLogicTrimmed，定位更快。');

// ---------------------------------------------------------------------------
// 6. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 6. 自定义错误类检查清单 ---');
console.log('1) class XxxError extends Error，构造函数第一行 super(message, { cause })');
console.log('2) 立刻写 this.name = this.constructor.name（或硬编码类名）');
console.log('3) 把结构化信息挂成自有属性（code / statusCode / field ...）');
console.log('4) 用 instanceof 做分流，未知错误一定要重新抛出');
console.log('5) 可选：Error.captureStackTrace(this, fn) 让堆栈更干净');
console.log('   传 this.constructor 隐藏构造函数那一帧；传工厂函数则可隐藏整条创建链。');
