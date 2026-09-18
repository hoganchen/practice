/**
 * ============================================================================
 * 知识点：error.cause 链接根因，多层错误包装
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】进阶
 * 【前置知识】20_error_handling/05_custom_errors.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES2022 给 Error 增加了 cause 选项，用来表达"这个错误是由哪个更底层的错误引起的"：
 *      try {
 *        await connectDb();
 *      } catch (err) {
 *        throw new Error('初始化服务失败', { cause: err });
 *      }
 *    这样上层既能得到"业务语义"（初始化服务失败），又能顺藤摸瓜找到"技术根因"
 *    （数据库连接被拒绝）。cause 可以是任意值，最常见的是另一个 Error。
 *
 * 2. 为什么需要
 *    分层架构里，每一层都希望把错误"翻译"成自己这一层的语义：
 *      数据访问层：ECONNREFUSED
 *      服务层    ：获取用户失败
 *      接口层    ：请求处理失败（HTTP 500）
 *    如果每层都 new Error('...') 而不带 cause，栈底的真实原因就丢了；
 *    如果每层都原样抛出，上层又看不懂。cause 让"包装"与"保留根因"两全其美。
 *    Node 内置也用它：比如 fetch 失败时会用 cause 挂上底层网络错误。
 *
 * 3. 核心语法要点
 *    (1) 语法：new Error(message, { cause: anyValue })，第二个参数是选项对象。
 *        同时也能写 new Error(message, { cause })（简写）。
 *    (2) 只有显式传了 cause，err.cause 才有值；否则是 undefined。
 *    (3) cause 可以嵌套成链：err.cause.cause.cause ... 一直到没有 cause 为止。
 *    (4) 自定义错误类里要用 super(message, { cause }) 把 cause 透传给父类。
 *    (5) 打印日志时要**递归**输出整条 cause 链，否则还是看不到根因。
 *
 * 4. 常见陷阱
 *    (1) 包装时写成 `catch (e) { throw new Error('失败') }`，把 e 丢了 —— 根因消失。
 *    (2) 直接在循环里对同一个错误层层包装，产生几十层 cause 链（要设置上限）。
 *    (3) 用 err.cause.message 直接取，而 cause 可能是字符串/undefined —— 要判类型。
 *    (4) 以为 console.log(err) 会自动打印 cause 链 —— Node 会在 inspect 时
 *        显示 cause，但自己拼接的日志字符串往往不会，需要手动递归。
 *    (5) 同一个错误对象既被包装又继续被使用，造成"一错多用"，语义混乱。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/06_error_cause.js
 *
 * 【预期输出】
 *   演示单层 cause、多层 cause 链、自定义错误类携带 cause，
 *   以及如何递归地把整条链打印出来。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 最简单的用法：包装时带上 cause
// ---------------------------------------------------------------------------

console.log('--- 1. 最简单的 cause ---');

try {
  try {
    // 假装这里发生了底层错误
    JSON.parse('{ 坏掉的 JSON');
  } catch (lowLevelErr) {
    // 包装成上层语义错误，并把底层错误挂在 cause 上
    throw new Error('解析用户配置失败', { cause: lowLevelErr });
  }
} catch (err) {
  console.log('上层错误 message :', err.message);
  console.log('底层根因 name    :', err.cause.name);
  console.log('底层根因 message :', err.cause.message);
  console.log('cause 就是原来的错误对象：', err.cause instanceof SyntaxError);
}

// ---------------------------------------------------------------------------
// 2. 多层包装形成错误链
// ---------------------------------------------------------------------------

console.log('\n--- 2. 多层错误链 ---');

/**
 * 数据访问层：模拟数据库连接失败
 * @returns {never}
 */
function dbQuery() {
  const err = new Error('connect ECONNREFUSED 127.0.0.1:5432');
  err.code = 'ECONNREFUSED'; // 模仿 Node 的风格带上错误码
  throw err;
}

/**
 * 仓储层：把数据库错误翻译成"查询用户失败"
 * @param {number} id
 * @returns {never}
 */
function userRepository(id) {
  try {
    return dbQuery();
  } catch (cause) {
    throw new Error(`查询用户 ${id} 失败`, { cause });
  }
}

/**
 * 服务层：翻译成业务语义
 * @param {number} id
 * @returns {never}
 */
function userService(id) {
  try {
    return userRepository(id);
  } catch (cause) {
    throw new Error('无法加载用户资料', { cause });
  }
}

/**
 * 接口层：最终对外返回
 * @param {number} id
 * @returns {never}
 */
function apiHandler(id) {
  try {
    return userService(id);
  } catch (cause) {
    throw new Error('请求处理失败', { cause });
  }
}

/**
 * 把错误链拉平成数组，从最外层到最内层
 * @param {unknown} err 任意错误值
 * @returns {Array<{name: string, message: string, code?: string}>}
 */
function flattenCauses(err) {
  const chain = [];
  let current = err;
  let guard = 0; // 防止 cause 成环导致死循环
  while (current !== undefined && current !== null && guard < 20) {
    if (current instanceof Error) {
      chain.push({ name: current.name, message: current.message, code: current.code });
    } else {
      // cause 可以是任意值，不一定是 Error
      chain.push({ name: typeof current, message: String(current) });
    }
    current = current instanceof Error ? current.cause : undefined;
    guard += 1;
  }
  return chain;
}

try {
  apiHandler(42);
} catch (err) {
  console.log('错误链（从外到内）：');
  const chain = flattenCauses(err);
  chain.forEach((item, i) => {
    const indent = '  '.repeat(i);
    const code = item.code ? ` [${item.code}]` : '';
    console.log(`${indent}${i + 1}. ${item.name}: ${item.message}${code}`);
  });
  console.log(`共 ${chain.length} 层。`);
}

// ---------------------------------------------------------------------------
// 3. 自定义错误类里透传 cause
// ---------------------------------------------------------------------------

console.log('\n--- 3. 自定义错误类携带 cause ---');

/** 业务错误基类 */
class ServiceError extends Error {
  /**
   * @param {string} message
   * @param {{ cause?: unknown, statusCode?: number }} [options]
   */
  constructor(message, options = {}) {
    super(message, { cause: options.cause }); // 把 cause 交给父类保存
    this.name = this.constructor.name;
    this.statusCode = options.statusCode ?? 500;
  }
}

/** 具体的业务错误 */
class UserLoadError extends ServiceError {
  /**
   * @param {number} id
   * @param {unknown} cause
   */
  constructor(id, cause) {
    super(`加载用户 ${id} 失败`, { cause, statusCode: 502 });
    this.userId = id;
  }
}

try {
  try {
    dbQuery();
  } catch (dbErr) {
    throw new UserLoadError(7, dbErr);
  }
} catch (err) {
  console.log('name        =', err.name);
  console.log('message     =', err.message);
  console.log('statusCode  =', err.statusCode);
  console.log('userId      =', err.userId);
  console.log('cause.code  =', err.cause && err.cause.code);
  console.log('instanceof ServiceError ?', err instanceof ServiceError);
}

// ---------------------------------------------------------------------------
// 4. 用 cause 判断"是否值得重试"
// ---------------------------------------------------------------------------

console.log('\n--- 4. 依据根因做决策 ---');

/**
 * 在错误链中查找带有指定 code 的错误
 * @param {unknown} err
 * @param {string} code
 * @returns {boolean}
 */
function hasCodeInChain(err, code) {
  let current = err;
  let guard = 0;
  while (current && guard < 20) {
    if (current.code === code) return true;
    current = current instanceof Error ? current.cause : undefined;
    guard += 1;
  }
  return false;
}

// 把连接拒绝的 code 换成"网络超时"，判断逻辑完全一样
try {
  try {
    const timeoutErr = new Error('connect ETIMEDOUT');
    timeoutErr.code = 'ETIMEDOUT';
    throw timeoutErr;
  } catch (cause) {
    throw new Error('同步用户数据失败', { cause });
  }
} catch (err) {
  const retryable = hasCodeInChain(err, 'ETIMEDOUT') || hasCodeInChain(err, 'ECONNREFUSED');
  console.log('错误链里含有可重试的根因吗？', retryable);
  console.log('决策：', retryable ? '稍后自动重试' : '直接报错给用户');
}

// ---------------------------------------------------------------------------
// 5. 打印完整错误链的推荐做法
// ---------------------------------------------------------------------------

console.log('\n--- 5. 打印完整错误链 ---');

/**
 * 把错误链格式化成多行字符串（适合写日志）
 * @param {unknown} err
 * @returns {string}
 */
function formatErrorChain(err) {
  const lines = [];
  let current = err;
  let depth = 0;
  while (current != null && depth < 20) {
    const prefix = depth === 0 ? '错误' : `根因(${depth})`;
    if (current instanceof Error) {
      lines.push(`${prefix}: ${current.name}: ${current.message}`);
      // 只对最外层打印 stack，避免日志爆炸
      if (depth === 0 && current.stack) {
        lines.push(current.stack.split('\n').slice(1, 3).map((l) => '    ' + l.trim()).join('\n'));
      }
    } else {
      lines.push(`${prefix}: (非 Error 值) ${String(current)}`);
    }
    current = current instanceof Error ? current.cause : undefined;
    depth += 1;
  }
  return lines.join('\n');
}

try {
  apiHandler(99);
} catch (err) {
  console.log(formatErrorChain(err));
}

// ---------------------------------------------------------------------------
// 6. cause 也可以是任意值
// ---------------------------------------------------------------------------

console.log('\n--- 6. cause 不一定是 Error ---');

const errWithStringCause = new Error('配置读取失败', { cause: '文件不存在' });
console.log('cause 的类型：', typeof errWithStringCause.cause, '→', errWithStringCause.cause);

const errWithObjectCause = new Error('支付失败', { cause: { gateway: 'alipay', code: 'BALANCE' } });
console.log('cause 是对象：', JSON.stringify(errWithObjectCause.cause));

const errWithoutCause = new Error('没有 cause');
console.log('未传 cause 时，err.cause =', errWithoutCause.cause);
console.log('所以取 cause 前一定要判空：err.cause && err.cause.message');

console.log('\n--- 7. 小结 ---');
console.log('包装错误时永远带上 { cause: 原错误 }，否则根因会永久丢失；');
console.log('打印日志要递归遍历 cause 链，并设置层数上限防止爆炸；');
console.log('判断错误性质时，可以顺着 cause 链查找底层错误码。');
