/**
 * ============================================================================
 * 知识点：错误信息安全 —— 内部日志与用户响应两条通道、错误分类、脱敏与 traceId
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/03_sql_injection.js、32_security_and_best_practices/01_input_validation.js
 *
 * 【也见】37_debugging_and_profiling/06_production_error_reporting.js —— 分级 logger + 脱敏 + traceId
 *        这套手写实现，在「调试与性能剖析」章节里也完整写了一遍。本文件是**安全视角**的主场
 *        （信息泄漏、用户枚举、日志反噬）；那篇是**生产上报流水线**视角（兜底→去重→限流→告警）。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "错误信息"其实是两个完全不同的东西，只是很多人把它们混成了一个：
 *      (a) **内部诊断信息**：堆栈、文件路径与行号、SQL 语句、内部服务名与主机名、
 *          依赖库版本、配置项、请求上下文…… 这些是给开发和运维看的。
 *      (b) **对外响应信息**：给终端用户或外部调用方看的一句话 + 一个可追踪的编号。
 *    错误信息安全的核心主张就是：**这两者必须是两条通道，绝不能混用。**
 *    对外只说"操作失败，请稍后重试（追踪号：abc-123）"，详细的留在服务器日志里。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) 信息泄漏（Information Disclosure）本身就是一类漏洞（OWASP 里长期占位）。
 *        一个完整的堆栈能告诉攻击者：你的框架与版本（-> 查已知 CVE）、
 *        目录结构（-> 猜文件路径、做路径穿越）、数据库类型与表名（-> 优化注入语句）、
 *        内网服务名与端口（-> 横向移动）。
 *    (b) 用户枚举（User Enumeration）：如果"用户不存在"和"密码错误"返回不同提示，
 *        攻击者就能用一份邮箱列表批量筛出"哪些账号真实存在"，
 *        为后续撞库、钓鱼、社工提供精准目标。注册、找回密码、登录三处都要注意。
 *    (c) 日志反噬：日志本身也是敏感数据。把 password / token / 身份证 / 银行卡写进日志，
 *        等于把凭证复制到了另一个（通常权限更宽、留存更久、备份更多）的地方。
 *    (d) 可观测性需求：对外模糊化之后，必须有 traceId 把"用户看到的那句话"与
 *        "服务器上的那条日志"关联起来，否则客服拿着用户截图根本查不到原因。
 *
 * 3. 核心语法要点
 *    - **错误分类**：
 *        · 可预期的业务错误（用户没填对、余额不足、无权限）—— 可以给用户看明确原因，
 *          这类用自定义错误类（AppError）承载，带 statusCode 与对外可展示的 code。
 *        · 不可预期的系统错误（数据库宕机、代码 bug、第三方超时）—— 对外一律模糊化，
 *          只留 traceId；细节全部进内部日志。
 *    - **AppError 类**：继承 Error，附加 `statusCode`、`code`（机器可读，如 'INVALID_INPUT'）、
 *      `isOperational`（是否属于"可预期"）、`expose`（是否允许对外展示 message）。
 *      注意：继承内置 Error 时要修正 `this.name`，并且现代 JS 里 `instanceof` 已能正确工作。
 *    - **logger**：分层级（debug/info/warn/error）、结构化（对象而非拼接字符串）、
 *      带 traceId 与时间戳。生产上用 pino / winston，本文件手写一个精简版以便看清结构。
 *    - **sanitize（脱敏）**：递归遍历对象，把 password / token / secret / authorization /
 *      cookie / idCard 之类的键替换成 `[REDACTED]`；截断超长字符串；
 *      对邮箱、手机号做部分掩码。**必须在写日志之前调用。**
 *    - **traceId**：每个请求生成一个唯一 id（如 crypto.randomUUID()），
 *      放进响应体、响应头（X-Trace-Id）和每一条日志里，实现"用户报障 -> 日志定位"。
 *    - **绝不吞掉错误**：`catch {}` 什么都不做是重罪。至少要记录；要么处理，要么往上抛。
 *
 * 4. 常见陷阱
 *    - 直接把 `err.stack` 或 `err.message` 原样返回给前端（尤其是 `error.message` 里
 *      常含 SQL、文件路径、第三方返回的原始报文）。
 *    - 用 `throw err.message`（抛字符串而不是 Error）：丢掉堆栈，无法定位；
 *      而且 String 上没有任何错误元数据。
 *    - 吞掉错误：空的 catch 块、或 `catch (e) { return null; }` 让调用方以为"成功但没数据"。
 *    - 只在最外层 catch，内部全都不记录：导致"到底是哪一层失败的"无从判断。
 *    - 日志里拼接整个 request body（里面有密码、token）。
 *    - 错误码设计成"看起来很有用"的字符串：`'USER_NOT_FOUND'` 直接暴露给前端，
 *      等于把用户枚举的答案写在了响应里。
 *    - 环境判断失误：开发环境想看详细堆栈（合理），上线时忘记关掉 `NODE_ENV` 判断，
 *      把堆栈泄漏给了生产用户。
 *    - 把内部错误包装成 500 但对外返回 200：监控告警全都失灵（这也是反模式）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/08_error_message_hygiene.js
 *
 * 【预期输出】
 *   先演示"泄漏版"错误处理把堆栈/SQL/路径直接吐给用户；
 *   再用 AppError + logger + sanitize + traceId 重做一遍，展示同一次故障在
 *   "内部日志（详细）"与"用户响应（模糊）"两条通道里的不同样子；
 *   接着演示用户枚举的对比、空 catch 的危害、以及日志脱敏的效果。全程退出码 0。
 * ============================================================================
 */

import { randomUUID } from 'node:crypto';

// ============================================================================
// 小节 1：反面示范 —— 把内部细节直接返回给用户
// ============================================================================
console.log('--- 1. 反面示范：泄漏版错误处理 ---');
console.log('  下面这些字符串，就是"不该出现在响应体里"的典型内容。');
console.log('  本小节只是把真实的错误消息和堆栈**打印到控制台**（模拟"被返回给了用户"），');
console.log('  不涉及任何网络请求或真实数据库。\n');

/**
 * 【反面示范】模拟"查询订单"时数据库出错，然后把原始错误直接返回。
 * 这里人为构造一个带有丰富内部细节的错误对象，用来展示"泄漏长什么样"。
 * @param {string} orderId
 * @returns {{status: number, body: object}}
 */
function leakyHandler(orderId) {
  try {
    // 人为触发一个错误，模拟底层的失败
    throw new Error(
      `Query failed: SELECT o.id, o.total FROM orders o JOIN users u ON u.id = o.user_id ` +
        `WHERE o.order_id = '${orderId}' -- connection to db-prod-03.internal:5432 refused`
    );
  } catch (err) {
    // 反面教材：把 err.message 和 err.stack 原样吐出去
    return {
      status: 500,
      body: {
        success: false,
        // 这一行会泄漏：完整 SQL、表名、内网主机名与端口
        message: err.message,
        // 这一行会泄漏：文件路径、依赖库内部实现、Node 版本相关细节
        stack: err.stack,
        // 更糟的是有些项目连环境变量一起返回
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
      },
    };
  }
}

const leaky = leakyHandler('ORD-1001');
console.log(`  [泄漏版] 用户收到的响应：`);
console.log(`    status = ${leaky.status}`);
console.log(`    body.message = ${leaky.body.message}`);
console.log(`    body.stack   =`);
String(leaky.body.stack)
  .split('\n')
  .slice(0, 4)
  .forEach((line) => console.log(`      ${line}`));
console.log(`    body.cwd     = ${leaky.body.cwd}`);

console.log('\n  攻击者能从这里得到什么：');
const leakedIntel = [
  ['数据库类型与技术栈', 'SQL 语法、JOIN 写法、表名 orders/users、列名 user_id'],
  ['内网拓扑', 'db-prod-03.internal:5432 —— 这是一台内网数据库主机与端口'],
  ['代码结构与路径', 'stack 里的文件路径揭示了项目目录结构（可用于路径穿越/猜测）'],
  ['运行环境', `Node ${leaky.body.nodeVersion} / ${leaky.body.platform} —— 可用来匹配已知漏洞`],
  ['业务规则', '从表名能推断出业务模型（有 orders、users，那很可能还有 payments）'],
];
for (const [what, detail] of leakedIntel) {
  console.log(`    - ${what}：${detail}`);
}
console.log('  这些信息单独看都不致命，组合起来就是一份"攻击前的侦察报告"。');

// ============================================================================
// 小节 2：错误分类 —— 可预期的业务错误 vs 不可预期的系统错误
// ============================================================================
console.log('\n--- 2. 错误分类：这是决定"能不能给用户看"的前提 ---');

/**
 * 应用级错误：用来表示"我们主动抛出的、有明确语义的错误"。
 * 关键字段：
 *   - statusCode   : HTTP 状态码
 *   - code         : 机器可读的错误码（前端可据此做分支，不要靠匹配 message 文本）
 *   - isOperational: 是否属于"可预期的运行期错误"（true）还是"程序 bug / 环境故障"（false）
 *   - expose       : 是否允许把 message 展示给最终用户
 */
class AppError extends Error {
  /**
   * @param {string} message 错误描述（expose 为 true 时会被用户看到，注意措辞）
   * @param {object} [options]
   * @param {number} [options.statusCode=500] HTTP 状态码
   * @param {string} [options.code='INTERNAL_ERROR'] 机器可读错误码
   * @param {boolean} [options.isOperational=true] 是否为可预期的业务错误
   * @param {boolean} [options.expose=false] 是否允许对外展示 message
   * @param {Error} [options.cause] 原始错误（便于日志里保留因果链）
   */
  constructor(message, options = {}) {
    // 把 options 里的 cause 传给 Error 构造器，现代 Node 会自动挂到 err.cause 上
    super(message, options.cause ? { cause: options.cause } : undefined);
    // 继承内置 Error 时要手动修正 name，否则打印出来是 "Error"
    this.name = 'AppError';
    this.statusCode = options.statusCode ?? 500;
    this.code = options.code ?? 'INTERNAL_ERROR';
    this.isOperational = options.isOperational ?? true;
    this.expose = options.expose ?? false;
    // 剔除构造器自身在堆栈里的那一帧，让堆栈从"抛出点"开始，更干净
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// 预定义的业务错误（可预期 + 可以给用户看明确原因）
const BusinessErrors = {
  invalidInput: (detail) =>
    new AppError(`参数不合法：${detail}`, {
      statusCode: 400,
      code: 'INVALID_INPUT',
      isOperational: true,
      expose: true, // 这条消息可以给用户看
    }),
  insufficientBalance: () =>
    new AppError('账户余额不足，请先充值', {
      statusCode: 409,
      code: 'INSUFFICIENT_BALANCE',
      isOperational: true,
      expose: true,
    }),
  // 注意这条：登录失败对外统一模糊化（原因见小节 5 的用户枚举）
  loginFailed: () =>
    new AppError('用户名或密码不正确', {
      statusCode: 401,
      code: 'AUTH_FAILED',
      isOperational: true,
      expose: true,
    }),
};

// 系统性错误（不可预期，对用户一律模糊化）
/**
 * 把任意未知错误包装成"对外安全"的 AppError。
 * @param {unknown} err 原始错误（可能是 Error，也可能是任意被 throw 的值）
 * @returns {AppError}
 */
function wrapUnknownError(err) {
  // 已经是 AppError 的就原样返回，避免重复包装丢失语义
  if (err instanceof AppError) return err;
  // 其他一切（含 throw 'string'、throw {code:1} 这种不规范写法）都归为系统错误
  return new AppError('服务器内部错误', {
    statusCode: 500,
    code: 'INTERNAL_ERROR',
    isOperational: false,
    expose: false, // 关键：不允许把内部细节展示出去
    cause: err instanceof Error ? err : undefined,
  });
}

console.log('  分类规则（记住这张表）：');
const classification = [
  ['可预期的业务错误', '用户没填对、余额不足、权限不够、资源不存在', '可以给用户看明确原因（expose: true）', 'HTTP 4xx'],
  ['不可预期的系统错误', '数据库宕机、空指针 bug、第三方超时、OOM', '对外只给模糊提示 + traceId（expose: false）', 'HTTP 5xx'],
];
for (const [kind, examples, policy, http] of classification) {
  console.log(`    ● ${kind}`);
  console.log(`        例子：${examples}`);
  console.log(`        策略：${policy}（${http}）`);
}

// 验证 instanceof 与 cause 链
const demoErr = BusinessErrors.insufficientBalance();
console.log(`\n  new AppError 实例检查：`);
console.log(`    err instanceof AppError ? ${demoErr instanceof AppError}`);
console.log(`    err instanceof Error   ? ${demoErr instanceof Error}   // 继承链正确`);
console.log(`    err.name               = ${demoErr.name}   // 手动修正过，不是 'Error'`);
console.log(`    err.statusCode/code    = ${demoErr.statusCode} / ${demoErr.code}`);
console.log(`    err.expose             = ${demoErr.expose}`);

const rootCause = new Error('connect ECONNREFUSED 10.0.3.7:5432');
const wrapped = new AppError('数据库暂时不可用', { code: 'DB_UNAVAILABLE', expose: false, cause: rootCause });
console.log(`\n  因果链（cause）保留：`);
console.log(`    wrapped.message  = ${wrapped.message}      // 对外可展示的部分`);
console.log(`    wrapped.cause    = ${wrapped.cause?.message}   // 内部细节，只进日志`);

// ============================================================================
// 小节 3：脱敏函数 —— 日志里也不该有密码与令牌
// ============================================================================
console.log('\n--- 3. sanitize：写日志之前必须脱敏 ---');

// 需要脱敏的键名（大小写不敏感匹配；用 includes 做"包含式"匹配以覆盖 accessToken 之类）
const SENSITIVE_KEY_PATTERNS = [
  'password',
  'passwd',
  'pwd',
  'token',
  'secret',
  'apikey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'creditcard',
  'cardnumber',
  'cvv',
  'idcard',
  'id_card',
  'ssn',
  'privatekey',
];

/**
 * 判断一个键名是否敏感。
 * @param {string} key
 * @returns {boolean}
 */
function isSensitiveKey(key) {
  const lower = String(key).toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((p) => lower.includes(p));
}

/**
 * 对邮箱做部分掩码：alice@example.com -> a***e@example.com
 * @param {string} email
 * @returns {string}
 */
function maskEmail(email) {
  const at = email.indexOf('@');
  if (at <= 0) return '[INVALID_EMAIL]';
  const name = email.slice(0, at);
  const domain = email.slice(at);
  // 名字只有 1~2 个字符时全部掩码，避免"掩了等于没掩"
  if (name.length <= 2) return `***${domain}`;
  return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 5))}${name[name.length - 1]}${domain}`;
}

/**
 * 对手机号做部分掩码：13812345678 -> 138****5678
 * @param {string} phone
 * @returns {string}
 */
function maskPhone(phone) {
  const s = String(phone);
  if (s.length < 7) return '[MASKED]';
  return `${s.slice(0, 3)}****${s.slice(-4)}`;
}

/**
 * 递归脱敏任意值，返回一个"可以安全写进日志"的新结构。
 * 注意：它**不修改**原对象（不可变思路，见 06 篇），而是生成副本。
 * @param {unknown} value 待脱敏的值
 * @param {WeakSet<object>} [seen] 处理循环引用
 * @param {number} [depth] 当前深度，用于限制递归层数
 * @returns {unknown}
 */
function sanitize(value, seen = new WeakSet(), depth = 0) {
  // 深度上限：避免超深对象把日志撑爆
  if (depth > 6) return '[MAX_DEPTH]';
  // 原始类型直接返回（但字符串要截断）
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'string' && value.length > 200) {
      return `${value.slice(0, 200)}...[TRUNCATED ${value.length} chars]`;
    }
    return value;
  }
  // 循环引用保护
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);

  // 数组：逐项处理
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => sanitize(v, seen, depth + 1));
  }
  // Map / Set：先转成普通结构再处理
  if (value instanceof Map) {
    return sanitize(Object.fromEntries(value), seen, depth + 1);
  }
  if (value instanceof Set) {
    return sanitize([...value], seen, depth + 1);
  }
  // Date 保留原样（日志里时间很重要）
  if (value instanceof Date) {
    return value.toISOString();
  }

  const out = {};
  for (const key of Object.keys(value)) {
    // ① 敏感键：整体替换
    if (isSensitiveKey(key)) {
      out[key] = '[REDACTED]';
      continue;
    }
    // ② 诊断字段（stack / cause）：保留完整内容，不截断也不掩码。
    //    原因：这两个字段是排查问题的核心价值所在，截断了日志就白记了。
    //    真实项目里通常由日志库统一限制单条日志的总长度，而不是在这里截断。
    if ((key === 'stack' || key === 'cause') && typeof value[key] === 'string') {
      out[key] = value[key];
      continue;
    }
    // ② 特定业务字段：部分掩码（保留可辨识度，便于排查"是哪个用户"）
    const raw = value[key];
    if (typeof raw === 'string') {
      if (/email/i.test(key)) {
        out[key] = maskEmail(raw);
        continue;
      }
      if (/phone|mobile|tel/i.test(key)) {
        out[key] = maskPhone(raw);
        continue;
      }
    }
    // ③ 其余递归处理
    out[key] = sanitize(raw, seen, depth + 1);
  }
  return out;
}

const rawLogPayload = {
  traceId: 'demo-trace',
  userId: 42,
  email: 'alice@example.com',
  phone: '13812345678',
  password: 'SuperSecret123!',
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature',
  nested: {
    user: { id: 42, apiKey: 'sk-live-abcdef123456', ssn: '110101199001011234' },
    cookies: { sessionId: 'sess-abc-123' },
  },
  // 触发循环引用保护
  longText: 'x'.repeat(300),
};
rawLogPayload.self = rawLogPayload;

console.log('  原始对象（**绝不能**这样写进日志）：');
console.log(`    password   = ${rawLogPayload.password}`);
console.log(`    accessToken= ${rawLogPayload.accessToken.slice(0, 30)}...`);
console.log(`    email      = ${rawLogPayload.email}`);
console.log(`    phone      = ${rawLogPayload.phone}`);

const sanitized = sanitize(rawLogPayload);
console.log('\n  脱敏后（可以安全写进日志）：');
console.log(`    email        = ${sanitized.email}`);
console.log(`    phone        = ${sanitized.phone}`);
console.log(`    password     = ${sanitized.password}`);
console.log(`    accessToken  = ${sanitized.accessToken}`);
console.log(`    nested.user.apiKey = ${sanitized.nested.user.apiKey}`);
console.log(`    nested.user.ssn    = ${sanitized.nested.user.ssn}`);
console.log(`    nested.cookies     = ${JSON.stringify(sanitized.nested.cookies)}`);
console.log(`    longText     = ${sanitized.longText.slice(0, 60)}`);
console.log(`    self（循环引用）= ${sanitized.self}`);
console.log(`    userId（保留）  = ${sanitized.userId}  <- 非敏感字段原样保留，排查才用得上`);
console.log('  注意掩码 vs 替换的分工：');
console.log('    密码/令牌 -> [REDACTED]（完全不可见，连部分都不该留）');
console.log('    邮箱/手机 -> 部分掩码（保留"是哪个用户"的可辨识度，便于排查）');

// ============================================================================
// 小节 4：logger —— 结构化、分级、带 traceId
// ============================================================================
console.log('\n--- 4. logger：把内部细节收拢到一条可控的通道里 ---');

/**
 * 极简 logger。真实项目请用 pino / winston（它们有采样、异步写入、多目标等能力）。
 * 这里的重点不是"日志库怎么写"，而是"哪些内容进日志、哪些内容进响应"。
 */
const logger = {
  /**
   * 统一的输出方法。
   * @param {'debug'|'info'|'warn'|'error'} level 级别
   * @param {string} message 简短描述（不要在这里塞敏感数据）
   * @param {object} [context] 上下文对象，会被自动脱敏
   */
  log(level, message, context = {}) {
    // 关键一步：**任何进日志的上下文都先过脱敏**
    const safeContext = sanitize(context);
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      ...safeContext,
    };
    // 用 JSON 单行输出，便于日志系统采集与检索
    console.log(`      [LOG ${level.toUpperCase()}] ${JSON.stringify(entry)}`);
  },
  debug(msg, ctx) {
    // 生产环境通常不开 debug
    if (process.env.LOG_LEVEL === 'debug') this.log('debug', msg, ctx);
  },
  info(msg, ctx) {
    this.log('info', msg, ctx);
  },
  warn(msg, ctx) {
    this.log('warn', msg, ctx);
  },
  error(msg, ctx) {
    this.log('error', msg, ctx);
  },
};

console.log('  logger 已就绪（本示例直接打印到控制台，真实项目写入文件/日志服务）。');

// ============================================================================
// 小节 5：两条通道的完整对比 —— 同一次故障，两种呈现
// ============================================================================
console.log('\n--- 5. 核心对比：同一次故障，内部日志 vs 用户响应 ---');

/**
 * 【安全版】统一的请求处理器：内部详细记录，对外模糊响应。
 * @param {{userId: number, email: string, password: string, orderId: string}} req 模拟的请求对象
 * @returns {{status: number, body: object, headers: object}} 模拟的响应
 */
function safeHandler(req) {
  // ① 为每个请求生成唯一 traceId —— 连接"用户看到的"与"日志里的"的桥梁
  const traceId = randomUUID();

  // ② 请求进来时先记一条（注意：整个 req 会过脱敏，密码不会落盘）
  logger.info('收到下单请求', { traceId, path: '/api/orders', req });

  try {
    // 模拟业务校验：参数不合法 -> 抛可预期的业务错误
    if (!req.orderId || !req.orderId.startsWith('ORD-')) {
      throw BusinessErrors.invalidInput('orderId 必须以 ORD- 开头');
    }
    // 模拟一个"不可预期的系统故障"（真实的例子：连接池耗尽、下游超时）
    throw new Error(
      `Query failed: SELECT * FROM orders WHERE order_id='${req.orderId}' ` +
        `-- ECONNREFUSED db-prod-03.internal:5432 (pool exhausted, active=20/20)`
    );
  } catch (rawErr) {
    // ③ 分类：即使 rawErr 是系统错误，也要包装成对外安全的形状
    const appErr = wrapUnknownError(rawErr);

    // ④ 内部通道：完整信息 + 堆栈 + 上下文，全部进日志
    logger.error('下单失败', {
      traceId,
      code: appErr.code,
      statusCode: appErr.statusCode,
      isOperational: appErr.isOperational,
      // 堆栈只进日志，绝不进响应
      stack: appErr.stack,
      // 原始错误的因果链（含 SQL）也只进日志
      cause: appErr.cause?.message,
      req, // 会被 sanitize 自动脱敏
    });

    // ⑤ 外部通道：模糊提示 + traceId，绝不包含任何内部细节
    const exposeMessage = appErr.expose ? appErr.message : '操作失败，请稍后重试';
    return {
      status: appErr.statusCode,
      body: {
        success: false,
        message: exposeMessage,
        code: appErr.expose ? appErr.code : undefined, // 系统错误连错误码都不给
        traceId, // 用户报障时报这个编号，客服即可定位到上面的日志
      },
      headers: { 'X-Trace-Id': traceId },
    };
  }
}

const userVisibleErr = [];
userVisibleErr.push(safeHandler({ userId: 42, email: 'alice@example.com', password: 'SuperSecret123!', orderId: 'bad-id' }));
userVisibleErr.push(safeHandler({ userId: 42, email: 'alice@example.com', password: 'SuperSecret123!', orderId: 'ORD-1001' }));

console.log('\n  ===== 以下是"用户能看到的响应"（注意有多干净） =====');
for (const r of userVisibleErr) {
  console.log(`    status ${r.status}  X-Trace-Id: ${r.headers['X-Trace-Id']}`);
  console.log(`    body   ${JSON.stringify(r.body)}`);
}
console.log('  ===== 以上是用户能看到的全部内容 =====');
console.log('\n  对比小结：');
const comparison = [
  ['堆栈 stack', '✓ 完整写入日志', '✗ 响应里完全没有'],
  ['SQL 语句与表名', '✓ 写在 cause 里，供排查', '✗ 响应里完全没有'],
  ['内网主机名/端口', '✓ 日志里可见', '✗ 响应里完全没有'],
  ['用户密码/令牌', '✗ 已被 sanitize 脱敏成 [REDACTED]', '✗ 不会出现'],
  ['具体失败原因', '✓ 详细', '✗ 只有"操作失败，请稍后重试"'],
  ['业务错误原因', '✓ 详细', '✓ 可展示（如"参数不合法：orderId 必须以 ORD- 开头"）'],
  ['可追踪性', '✓ traceId 贯穿全部日志', '✓ traceId 在响应体与响应头里'],
];
// 注：中文是双宽字符，用 padEnd 做表格会错位，这里用分行列举
for (const [item, logSide, resSide] of comparison) {
  console.log(`    ● ${item}`);
  console.log(`        内部日志：${logSide}`);
  console.log(`        用户响应：${resSide}`);
}
console.log(`\n  关键点：用户看到"操作失败，请稍后重试"时觉得信息不足 —— 这正是设计目标。`);
console.log(`          他手上的 traceId 让开发者能在日志里看到"那条完整信息"。`);
console.log(`          鱼与熊掌兼得：对外不泄漏，对内可排查。`);

// ============================================================================
// 小节 6：用户枚举 —— 登录错误信息为什么要模糊
// ============================================================================
console.log('\n--- 6. 用户枚举：登录失败提示不能区分"用户不存在"与"密码错误" ---');

// 模拟的用户表（内存数组；真实项目里这里会是一次数据库查询）
const USERS = [
  { email: 'alice@example.com', password: 'alice_pw' },
  { email: 'bob@example.com', password: 'bob_pw' },
];

/**
 * 【反面示范】登录接口返回了"可以区分"的错误信息。
 * @param {string} email
 * @param {string} password
 * @returns {{status: number, message: string}}
 */
function leakyLogin(email, password) {
  const user = USERS.find((u) => u.email === email);
  if (!user) {
    // 泄漏点：明确告诉对方"这个邮箱没注册过"
    return { status: 404, message: '该邮箱尚未注册，请先注册账号' };
  }
  if (user.password !== password) {
    return { status: 401, message: '密码错误，请重试' };
  }
  return { status: 200, message: '登录成功' };
}

/**
 * 【安全版】登录接口对外只用一条统一提示。
 * @param {string} email
 * @param {string} password
 * @returns {{status: number, message: string}}
 */
function safeLogin(email, password) {
  const user = USERS.find((u) => u.email === email);
  // 关键：无论是"用户不存在"还是"密码错误"，对外都是同一个 401 与同一句话
  if (!user || user.password !== password) {
    return { status: 401, message: '用户名或密码不正确' };
  }
  return { status: 200, message: '登录成功' };
}

console.log('  攻击者用一份邮箱列表批量探测：');
const probeEmails = ['alice@example.com', 'bob@example.com', 'hr@example.com', 'ceo@example.com', 'notexist@example.com'];
console.log('    邮箱                       | 泄漏版响应                        | 安全版响应');
for (const email of probeEmails) {
  const l = leakyLogin(email, 'wrong-password');
  const s = safeLogin(email, 'wrong-password');
  console.log(`    ${email.padEnd(26)} | ${(l.status + ' ' + l.message).padEnd(33)} | ${s.status} ${s.message}`);
}
console.log('\n  泄漏版的后果：攻击者只看状态码/文案就能筛出"哪些邮箱在本站注册过"，');
console.log('    404 = 没注册，401 = 注册了（只是密码不对）。这份名单可以拿去撞库或钓鱼。');
console.log('  安全版：所有失败都返回 401 + 同一句话，攻击者得不到任何区分信息。');

console.log('\n  同样的原则适用于另外两处：');
const otherEnumerations = [
  ['注册接口', '不要提示"该邮箱已被注册"，改为"我们已发送确认邮件，请查收"'],
  ['找回密码', '无论邮箱是否存在，都提示"如果该邮箱存在，我们已发送重置链接"'],
  ['登录接口', '统一返回"用户名或密码不正确"；并配合限流/验证码防爆破'],
  ['响应时间', '注意时序侧信道：如果"用户不存在"立刻返回、"密码错误"要等一次哈希计算，' +
    '攻击者能靠**响应耗时**区分。安全做法是对不存在的用户也做一次假哈希计算（恒定时间）。'],
];
for (const [scene, advice] of otherEnumerations) {
  console.log(`    - ${scene}：${advice}`);
}

// ============================================================================
// 小节 7：不要吞掉错误 —— 空 catch 是最贵的"省事"
// ============================================================================
console.log('\n--- 7. 不要吞掉错误：空 catch 块的反面教材 ---');

/**
 * 【反面示范】catch 之后什么都不做 —— 错误被静默吞掉。
 * @param {string} raw
 * @returns {object|null}
 */
function swallowError(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    // 反面教材：什么都不做。调用方以为"成功但返回 null"，实际是解析失败了。
    return null;
  }
}

/**
 * 【正面示范】要么处理，要么带着上下文往上抛。
 * @param {string} raw
 * @param {string} traceId
 * @returns {object}
 */
function handleErrorProperly(raw, traceId) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    // 记录：带上"是什么输入、哪个 traceId"的上下文
    logger.warn('JSON 解析失败', { traceId, inputPreview: raw, errMessage: err.message });
    // 抛出有语义的业务错误，让上层的统一处理去决定"响应什么"
    throw BusinessErrors.invalidInput('请求体不是合法的 JSON');
  }
}

console.log('  ① 空 catch 的实际后果：');
const swallowed = swallowError('{ bad json');
console.log(`     swallowError('{ bad json') = ${swallowed}`);
console.log('     调用方拿到 null，会以为"没有数据"，而不是"出错了" ——');
console.log('     于是它继续往下走，在某个更远的地方炸出 TypeError，');
console.log('     而真正的根因（JSON 解析失败）早已被丢掉，排查时间成倍增加。');

console.log('\n  ② 正确做法：记录 + 抛语义化错误：');
try {
  handleErrorProperly('{ bad json', 'trace-abc-123');
} catch (err) {
  console.log(`     捕获到：${err.name} / ${err.code} / ${err.message}`);
  console.log('     同时日志里已经留下了输入预览与 traceId，根因不会丢。');
}

console.log('\n  ③ 关于"抛字符串"的坏习惯：');
/**
 * 【反面示范】抛出字符串而不是 Error。
 * @returns {never}
 */
function throwStringBad() {
  // 反面教材：抛出字符串
  throw '出错了'; // eslint-disable-line no-throw-literal
}
try {
  throwStringBad();
} catch (err) {
  console.log(`     catch 到的是 ${typeof err}，值是 "${err}"`);
  console.log(`     它有 stack 吗？ ${err instanceof Error ? '有' : '没有（连堆栈都没有，无法定位）'}`);
  console.log('     结论：永远 throw new Error(...) / new AppError(...)，不要 throw 字符串或普通对象。');
}

// ============================================================================
// 小节 8：全局兜底 —— 一个 place 统一决定"什么能出去"
// ============================================================================
console.log('\n--- 8. 全局兜底处理器：把策略集中在一个地方 ---');

/**
 * 模拟 Web 框架的"全局错误处理中间件"。
 * 所有未捕获的错误最终都会到这里，由它统一决定"响应什么"。
 * @param {unknown} err 任意错误
 * @param {{path?: string, method?: string, userId?: number}} [reqInfo] 请求上下文
 * @returns {{status: number, body: object, headers: object}}
 */
function globalErrorHandler(err, reqInfo = {}) {
  const traceId = randomUUID();
  const appErr = wrapUnknownError(err);

  // 内部：全部细节进日志
  logger.error('未处理的请求错误', {
    traceId,
    path: reqInfo.path,
    method: reqInfo.method,
    userId: reqInfo.userId,
    code: appErr.code,
    isOperational: appErr.isOperational,
    stack: appErr.stack,
    cause: appErr.cause?.message,
  });

  // 外部：只有 expose 为 true 的错误才展示原始 message
  return {
    status: appErr.statusCode,
    body: {
      success: false,
      message: appErr.expose ? appErr.message : '服务暂时不可用，请稍后重试',
      code: appErr.expose ? appErr.code : undefined,
      traceId,
    },
    headers: { 'X-Trace-Id': traceId },
  };
}

console.log('  场景 A：业务错误（可预期，可以告诉用户原因）');
const resA = globalErrorHandler(BusinessErrors.insufficientBalance(), { path: '/api/pay', method: 'POST', userId: 42 });
console.log(`    响应: ${resA.status} ${JSON.stringify(resA.body)}`);

console.log('\n  场景 B：系统错误（不可预期，对外必须模糊）');
const dbDown = new Error("connect ETIMEDOUT 10.0.3.7:5432 (relation 'payment_records' does not exist)");
const resB = globalErrorHandler(dbDown, { path: '/api/pay', method: 'POST', userId: 42 });
console.log(`    响应: ${resB.status} ${JSON.stringify(resB.body)}`);
console.log('    注意：relation/表名/内网 IP 全部只出现在上面的 LOG 行里，响应体里一个字都没有。');

console.log('\n  场景 C：被 throw 的原始值（非 Error）也兜得住');
const resC = globalErrorHandler('some random thrown value', { path: '/api/x' });
console.log(`    响应: ${resC.status} ${JSON.stringify(resC.body)}`);

console.log('\n  环境差异的正确处理：');
console.log('    开发环境想看堆栈是合理的，但要通过 NODE_ENV 判断，且**默认值必须是"不暴露"**：');
console.log("      const isDev = process.env.NODE_ENV === 'development';");
console.log("      const body = { message: appErr.expose ? appErr.message : '服务暂时不可用', traceId };");
console.log("      if (isDev) body.debug = { message: appErr.message, stack: appErr.stack };");
console.log(`    当前 NODE_ENV = ${process.env.NODE_ENV ?? '(未设置)'} -> 按生产处理（不暴露细节）`);
console.log('    常见的翻车方式：写成 if (!isProd) 暴露细节，结果 NODE_ENV 没设，');
console.log('    判断成立 -> 直接把堆栈泄给了线上用户。默认安全（fail closed）是关键。');

// ============================================================================
// 小节 9：检查清单与小结
// ============================================================================
console.log('\n--- 9. 上线前检查清单 ---');
const checklist = [
  '响应体里不出现 stack / cause / 原始 err.message',
  '响应体里不出现 SQL 语句、表名、文件路径、内网主机名与端口',
  '响应体里不出现依赖库与运行时版本号（除非确有必要）',
  '系统错误统一返回 5xx + 模糊文案；业务错误可返回明确的 4xx 原因',
  '每个错误响应都带 traceId，且 traceId 出现在全部相关日志里',
  '日志写入前统一过 sanitize：password/token/cookie/身份证等一律 [REDACTED]',
  '邮箱/手机等标识做部分掩码，日志不记录完整请求体',
  '登录/注册/找回密码三处都不泄漏"用户是否存在"',
  '没有空 catch 块；每个 catch 要么记录、要么带上下文重抛',
  '只用 throw new Error / new AppError，不 throw 字符串或普通对象',
  '开发环境的详细堆栈通过 NODE_ENV === "development" 显式开启（默认关闭）',
];
for (const item of checklist) {
  console.log(`  [ ] ${item}`);
}

console.log('\n--- 10. 小结 ---');
console.log('  1) 错误信息必须分两条通道：内部日志详尽，对外响应模糊 —— 绝不能混用。');
console.log('  2) 泄漏的代价：完整的堆栈 + SQL + 内网主机名 = 一份给攻击者的侦察报告。');
console.log('  3) 错误先分类：可预期的业务错误可以说明原因；不可预期的系统错误一律模糊化。');
console.log('  4) 用 AppError 承载 statusCode / code / isOperational / expose，让"能不能给用户看"成为显式决策。');
console.log('  5) traceId 是"对外模糊"的前提：没有它，模糊化就等于"放弃了可排查性"。');
console.log('  6) 日志也要脱敏：sanitize 把密码/token 替换成 [REDACTED]，邮箱手机做掩码。');
console.log('  7) 绝不吞掉错误：空 catch、throw 字符串都是重罪；记录 + 上下文 + 重抛才对。');
console.log('  8) 用户枚举：登录/注册/找回密码对外只给统一提示；连响应耗时都要注意。');
console.log('  9) 默认安全（fail closed）：环境判断写成"显式开启才暴露"，而不是"没配置就暴露"。');
