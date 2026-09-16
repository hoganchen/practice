/**
 * ============================================================================
 * 知识点：throw 的用法 —— 可以抛任何值（但不推荐）、抛出 vs 返回错误码
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】入门
 * 【前置知识】20_error_handling/01_try_catch_finally.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    throw 语句用于**主动抛出**一个异常，中断当前执行流：
 *      throw new Error('出问题了');
 *    JS 不限制抛出的类型：字符串、数字、对象、数组、null 全都能抛。
 *      throw '出错了';        // 合法，但强烈不推荐
 *      throw 404;             // 合法，但强烈不推荐
 *      throw { code: 1 };     // 合法，但同样不推荐
 *    原因：只有 Error 及其子类才带 stack 和标准的 message/name，
 *    且 `err instanceof Error` 这类判断才有意义。
 *
 * 2. 为什么需要
 *    (1) "早抛"让错误在离发生点最近的地方被发现，而不是悄悄传下去变成错误的结果。
 *    (2) 抛出 vs 返回错误码：返回错误码（如 C 语言风格 return -1）需要调用方
 *        每次都检查，忘了检查就把错误当正常值用了；throw 由运行时强制传播，
 *        不处理就一直向上，无法被忽略。
 *    (3) throw 也可以用于控制流（如"参数非法就立刻中断"），
 *        但要避免把异常当 goto 滥用。
 *
 * 3. 核心语法要点
 *    (1) throw 后面可以是任意表达式；`throw;` 单独写是非法的（除了在 catch 里
 *        的 `throw;`？—— 注意：JS 里没有裸 throw，必须跟一个表达式）。
 *    (2) throw 之后同一代码块中的语句不会再执行（除非在被 finally 之后）。
 *    (3) 抛出后，若调用栈中没有任何 try/catch 接住，进程会以非零退出码崩溃。
 *    (4) 在 catch 里可以 `throw err;` 重新抛出（rethrow），把错误交给上层处理。
 *    (5) 抛出对象如果是 Error 实例，引擎会补齐 stack；抛原始值则没有堆栈。
 *
 * 4. 常见陷阱
 *    (1) 抛字符串/数字：catch 到之后拿不到 stack，排查困难；
 *        而且 `err.message` 是 undefined，很多日志库会打印出 "undefined"。
 *    (2) 忘记 throw 是语句不是函数：`throw new Error()` 和 `throw(new Error())` 等价，
 *        但 `throw new Error();` 后面再写代码是"死代码"。
 *    (3) 在循环里抛异常却没在循环外接住，导致第一个错误就让整个循环中断
 *        （有时你其实想要的是"收集所有错误继续跑"，见 07）。
 *    (4) 用异常做正常的控制流（比如用 throw 实现"找到就跳出"），可读性差且慢。
 *    (5) 抛出后又用 catch 原样吞掉，等于白抛。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/04_throw_statement.js
 *
 * 【预期输出】
 *   演示 throw 各种值后的捕获结果、抛出的传播路径、
 *   抛出与返回错误码两种风格的对比。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. throw 的本质：中断当前执行流并向上传播
// ---------------------------------------------------------------------------

console.log('--- 1. throw 会中断执行流 ---');

try {
  console.log('  throw 之前的语句');
  throw new Error('我在这里中断了流程');
  // eslint-disable-next-line no-unreachable
  console.log('  这行永远不会执行');
} catch (err) {
  console.log('  catch 到：', err.message);
}
console.log('  try/catch 之后的语句照常执行');

// ---------------------------------------------------------------------------
// 2. 可以抛任何值（语法合法，但不推荐）
// ---------------------------------------------------------------------------

console.log('\n--- 2. 抛出各种类型的值 ---');

/**
 * 抛出一个值并捕获它，打印捕获结果的类型信息
 * @param {string} label 说明
 * @param {unknown} value 要抛出的值
 */
function throwAndCatch(label, value) {
  try {
    throw value;
  } catch (caught) {
    // 注意：这里只能靠 typeof / instanceof 判断，因为抛出的可能不是 Error
    const isError = caught instanceof Error;
    console.log(`${label}`);
    console.log(`  抛出的值        : ${JSON.stringify(caught) ?? String(caught)}`);
    console.log(`  typeof          : ${typeof caught}`);
    console.log(`  是 Error 实例吗  : ${isError}`);
    console.log(`  有 message 吗    : ${isError ? JSON.stringify(caught.message) : '（没有，是 undefined）'}`);
    console.log(`  有 stack 吗      : ${isError ? '有（可用于定位）' : '没有（无法定位）'}`);
  }
}

throwAndCatch('2.1 throw "字符串"', '出错了');
throwAndCatch('2.2 throw 404', 404);
throwAndCatch('2.3 throw { code: 1 }', { code: 1 });
throwAndCatch('2.4 throw null', null);
throwAndCatch('2.5 throw undefined', undefined);
throwAndCatch('2.6 throw new Error("标准错误")', new Error('标准错误'));

console.log('\n结论：语法上都合法，但只有 Error 实例自带 message 与 stack。');
console.log('所以规范做法是永远 throw new Error(...) 或其子类。');

// 危险的边界：抛 null / undefined 时，某些"贴心"的代码会写出
//   catch (err) { if (err.message) {...} }   → 直接 TypeError，把错误处理本身搞崩了
console.log('\n补充：抛 null 时，err.message 会直接抛 TypeError，让错误处理代码自身崩溃。');

// ---------------------------------------------------------------------------
// 3. 异常沿调用栈传播
// ---------------------------------------------------------------------------

console.log('\n--- 3. 异常沿调用栈向上传播 ---');

function level3() {
  throw new Error('来自最深处的错误');
}

function level2() {
  level3(); // 不处理，继续向上抛
}

function level1() {
  level2(); // 也不处理
}

// 在 level1 外面接住
try {
  level1();
} catch (err) {
  console.log('在最外层捕获到：', err.message);
  // 可以从 stack 里看到完整的调用链
  const frames = err.stack
    .split('\n')
    .filter((line) => line.includes('04_throw_statement.js'))
    .slice(0, 4)
    .map((l) => l.trim());
  console.log('调用栈中的业务帧（从内到外）：');
  for (const f of frames) console.log('  ' + f);
}

// 也可以在中间层"处理一部分，再重新抛出"
console.log('\n--- 3.1 中间层可以加工错误后重新抛出 ---');

function withRetryInfo(fn) {
  try {
    return fn();
  } catch (err) {
    // 补充上下文再抛：注意这里必须重新抛出，否则错误就被吞了
    err.step = '调用外部服务';
    throw err;
  }
}

try {
  withRetryInfo(() => {
    throw new Error('原始错误');
  });
} catch (err) {
  console.log('在外层看到 message =', err.message, '，附加的 step =', err.step);
}

// ---------------------------------------------------------------------------
// 4. 抛出 vs 返回错误码
// ---------------------------------------------------------------------------

console.log('\n--- 4. 抛出异常 vs 返回错误码 ---');

// 风格 A：返回错误码 / null
/**
 * 用"返回 null 表示失败"的风格解析整数
 * @param {string} text
 * @returns {number|null}
 */
function parseWithNull(text) {
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

// 风格 B：抛出异常
/**
 * 用"抛异常"的风格解析整数
 * @param {string} text
 * @returns {number}
 */
function parseWithThrow(text) {
  const n = Number(text);
  if (!Number.isFinite(n)) {
    throw new TypeError(`无法把 ${JSON.stringify(text)} 解析为数字`);
  }
  return n;
}

console.log('风格 A（返回 null）调用两次，第二次会怎样？');
const a1 = parseWithNull('42');
console.log('  parseWithNull("42") =', a1);
console.log('  但调用方常常忘记检查返回值！');
console.log('  例如：parseWithNull("abc") * 2 =', parseWithNull('abc') * 2, '← 静默产生了 NaN，错误被掩盖');

console.log('\n风格 B（抛异常）同样的调用：');
try {
  console.log('  parseWithThrow("abc") * 2 =', parseWithThrow('abc') * 2);
} catch (err) {
  console.log('  直接抛错，无法被忽略：', err.name, '-', err.message);
}

console.log('\n两种风格对比：');
console.log('  返回错误码：需要调用方自觉检查，容易被忽略；适合"失败是常态"的场景；');
console.log('  抛异常    ：由运行时强制传播，不能被忽略；适合"失败是异常情况"的场景。');

// ---------------------------------------------------------------------------
// 5. 什么时候该抛，什么时候该返回
// ---------------------------------------------------------------------------

console.log('\n--- 5. 选型建议 ---');

/**
 * 校验用户输入：非法就抛（调用方必须处理）
 * @param {{name?: string, age?: number}} user
 * @returns {{name: string, age: number}}
 */
function validateUser(user) {
  if (!user || typeof user !== 'object') {
    throw new TypeError('user 必须是对象');
  }
  if (typeof user.name !== 'string' || user.name.trim() === '') {
    throw new RangeError('user.name 必须是非空字符串');
  }
  if (!Number.isInteger(user.age) || user.age < 0 || user.age > 150) {
    throw new RangeError('user.age 必须是 0~150 的整数');
  }
  return { name: user.name.trim(), age: user.age };
}

const cases = [
  { name: '张三', age: 20 },
  { name: '', age: 20 },
  { name: '李四', age: -5 },
  { name: '王五', age: 999 },
  null,
];

console.log('批量校验（每条单独 try/catch，一条失败不影响其它条）：');
for (const c of cases) {
  try {
    const ok = validateUser(c);
    console.log('  ✓ 通过：', JSON.stringify(ok));
  } catch (err) {
    console.log(`  ✗ 失败：${err.name} - ${err.message}`);
  }
}

console.log('\n--- 6. 小结 ---');
console.log('throw 可以抛任何值，但请始终抛 Error 或其子类（才有 stack 与 message）。');
console.log('异常会沿调用栈自动向上传播，中间层可以加工后重新抛出。');
console.log('预期内的业务失败可以返回结果/错误码，意外与非法输入用 throw 更安全。');
