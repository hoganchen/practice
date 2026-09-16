/**
 * ============================================================================
 * 知识点：try / catch / finally 基础，finally 的执行时机与返回值覆盖陷阱
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】入门
 * 【前置知识】06_functions/01_function_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    try / catch / finally 是 JavaScript 捕获并处理运行时错误的语法结构：
 *      try {
 *        // 可能出错的代码
 *      } catch (err) {
 *        // 出错后跳到这里，err 是抛出的错误对象
 *      } finally {
 *        // 无论是否出错、无论是否 return，这里**总会**执行
 *      }
 *
 * 2. 为什么需要
 *    错误如果没有被捕获，会沿着调用栈一路向上抛，最终让整个进程崩溃
 *    （浏览器里表现为控制台报错、脚本中断）。try/catch 让我们能够：
 *      - 把"可能失败的操作"和"失败后怎么办"写在一起；
 *      - 让程序在局部失败后继续运行，而不是整体崩掉；
 *      - finally 保证清理工作（关闭文件、释放锁、恢复状态）一定被执行。
 *
 * 3. 核心语法要点
 *    (1) catch 的参数可以省略：`try { ... } catch { ... }`（ES2019+），
 *        当你根本不关心错误内容时很实用。
 *    (2) finally 可以单独和 try 搭配，不写 catch：`try { ... } finally { ... }`，
 *        此时错误依然会向上抛，但 finally 一定会先执行。
 *    (3) finally 里的 return / throw 会**覆盖** try（或 catch）里的 return / throw。
 *        这是本文件重点演示的陷阱。
 *    (4) 只有"运行时错误"能被捕获。**语法错误**（SyntaxError）在代码解析阶段就失败，
 *        try/catch 根本来不及生效（除非用 eval / new Function 动态执行代码）。
 *    (5) try/catch 是语句，不是表达式，不能直接 `const x = try { ... }`。
 *
 * 4. 常见陷阱
 *    (1) 在 finally 里写 return：会吞掉 try 的返回值和异常，非常隐蔽。
 *    (2) 把整个程序包在一个巨大的 try 里：错误定位困难，无法区分可恢复错误与 bug。
 *    (3) 空 catch：`catch (e) {}` 把错误"吃掉"了，出问题时毫无线索。
 *    (4) 以为 catch 能捕获异步回调里抛出的错误 —— 不能，那是另一个调用栈，
 *        详见 09_async_error_handling.js。
 *    (5) 以为 finally 一定是最先执行的"清理"步骤 —— 若 try 里 return 了一个
 *        会抛错的表达式，求值顺序会影响结果。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/01_try_catch_finally.js
 *
 * 【预期输出】
 *   依次打印：基本捕获、省略 catch 参数、finally 的执行时机、
 *   finally 覆盖 return 的陷阱，以及 finally 中抛错的情况。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本结构：try / catch
// ---------------------------------------------------------------------------

console.log('--- 1. 最基本的 try / catch ---');

try {
  // JSON.parse 遇到非法 JSON 会抛出 SyntaxError
  JSON.parse('这不是合法 JSON');
  console.log('这行不会被执行，因为上一行已经抛错了');
} catch (err) {
  // err 是捕获到的错误对象
  console.log('捕获到错误：');
  console.log('  name    =', err.name);
  console.log('  message =', err.message);
  console.log('程序没有崩溃，继续往下执行。');
}

console.log('try/catch 之后的代码照常执行。');

// ---------------------------------------------------------------------------
// 2. catch 的参数可以省略
// ---------------------------------------------------------------------------

console.log('\n--- 2. 省略 catch 参数（ES2019+） ---');

try {
  null.foo; // 读 null 的属性 → TypeError
} catch {
  // 不关心具体错误时，可以不写参数。注意：这里无法访问错误对象，也就无法记日志，
  // 所以真实项目里更推荐写上参数并记录它。
  console.log('出错了（但这里拿不到错误对象，因为省略了 catch 参数）');
}

// ---------------------------------------------------------------------------
// 3. finally 的执行时机
// ---------------------------------------------------------------------------

console.log('\n--- 3. finally 总会执行 ---');

/**
 * 演示三种路径下 finally 都会执行：正常结束、抛错、中途 return
 * @param {string} mode 模式：ok / throw / return
 * @returns {string} 结果描述
 */
function finallyTiming(mode) {
  try {
    if (mode === 'throw') {
      throw new Error('故意抛一个错误');
    }
    if (mode === 'return') {
      return 'try 里的 return';
    }
    return 'try 正常结束';
  } catch (err) {
    return `catch 接住了：${err.message}`;
  } finally {
    // 不管上面走的是哪条路径，这一行都会打印
    console.log(`  [finally] mode=${mode} 的清理逻辑执行了`);
  }
}

console.log('mode = ok：', finallyTiming('ok'));
console.log('mode = throw：', finallyTiming('throw'));
console.log('mode = return：', finallyTiming('return'));

// 只有 try 不写 catch 时，错误照样向上抛，但 finally 依然先执行
console.log('\n只有 try + finally 的情况：');
function tryFinallyOnly() {
  try {
    console.log('  [try] 准备抛错');
    throw new Error('这个错误会被继续向上抛');
  } finally {
    console.log('  [finally] 清理执行完了，然后错误继续向上传播');
  }
}

try {
  tryFinallyOnly();
} catch (err) {
  console.log('外层捕获到：', err.message);
}

// ---------------------------------------------------------------------------
// 4. 陷阱一：finally 里的 return 会覆盖 try 的返回值
// ---------------------------------------------------------------------------

console.log('\n--- 4. 陷阱：finally 中 return 覆盖返回值 ---');

function badFinally() {
  try {
    return 'try 的返回值';
  } finally {
    // 这行 return 会覆盖 try 的返回值，函数结果是 'finally 的返回值'
    // 同时它还"吞掉"了 try 里可能抛出的异常！
    return 'finally 的返回值';
  }
}

console.log('badFinally() =', badFinally(), '← try 的返回值被覆盖了');

// 更危险的是：finally 的 return 会把异常也一起吞掉
function swallowError() {
  try {
    throw new Error('这个错误本该被上层看到');
  } finally {
    return '异常被 finally 的 return 吃掉了';
  }
}

console.log('swallowError() =', swallowError(), '（注意：没有任何异常抛出！）');

// 正确写法：finally 只做清理，不要 return，也不要在里面抛错
function goodFinally() {
  let result;
  try {
    result = 'try 计算出来的结果';
    return result;
  } finally {
    // 只做清理，不改动返回值，也不吞异常
    console.log('  [goodFinally] 这里只做清理，不 return');
  }
}
console.log('goodFinally() =', goodFinally());

// ---------------------------------------------------------------------------
// 5. 陷阱二：finally 中的抛出会替换原来的错误
// ---------------------------------------------------------------------------

console.log('\n--- 5. 陷阱：finally 中抛错会替换原错误 ---');

function finallyThrows() {
  try {
    throw new Error('原始错误：数据库连接失败');
  } finally {
    // 如果清理逻辑本身也可能失败，就会把原始错误"挤掉"，
    // 导致排查问题时看到的是清理错误，而不是真正的根因。
    throw new Error('清理时又出错了');
  }
}

try {
  finallyThrows();
} catch (err) {
  console.log('捕获到的其实是：', err.message);
  console.log('（原始错误被覆盖了！真实项目里应该在 finally 内部再包一层 try/catch）');
}

// 稳健的写法：清理逻辑自己吞掉自己的异常，或把它记录下来但不覆盖原错误
function safeCleanup() {
  try {
    throw new Error('原始错误');
  } finally {
    try {
      throw new Error('清理错误');
    } catch (cleanupErr) {
      // 记录清理错误，但不让它覆盖原始错误
      console.log('  [清理] 清理过程出错（已记录，不影响主流程）：', cleanupErr.message);
    }
  }
}

try {
  safeCleanup();
} catch (err) {
  console.log('这样原始错误就保住了：', err.message);
}

// ---------------------------------------------------------------------------
// 6. 变量作用域：try 里声明的变量外面看不到
// ---------------------------------------------------------------------------

console.log('\n--- 6. 作用域提醒 ---');

// try 块有独立的作用域，里面用 let/const 声明的变量在外面不可见。
// 想在外部使用，要在 try 之前声明。
let parsed = null;
try {
  parsed = JSON.parse('{"ok": true}');
} catch {
  parsed = null;
}
console.log('parsed =', parsed, '（在 try 外面声明的变量才能留存结果）');

console.log('\n--- 7. 小结 ---');
console.log('try    ：放可能出错的代码');
console.log('catch  ：出错后怎么处理（参数可省略）');
console.log('finally：无论如何都要执行的清理，**不要**在里面 return 或抛错');
