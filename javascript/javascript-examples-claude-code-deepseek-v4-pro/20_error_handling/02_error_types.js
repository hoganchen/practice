/**
 * ============================================================================
 * 知识点：内置错误类型 —— Error / TypeError / RangeError / SyntaxError /
 *         ReferenceError / URIError 的触发场景
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】入门
 * 【前置知识】20_error_handling/01_try_catch_finally.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 标准内置了若干错误类型，它们都继承自 Error：
 *      Error          通用错误（也可直接 new）
 *      TypeError      值不是期望的类型（读 null 的属性、调用非函数、new 非构造函数）
 *      RangeError     数值超出允许范围（数组长度非法、数字格式化参数越界）
 *      SyntaxError    语法错误（JSON.parse 失败、eval/new Function 里的代码非法）
 *      ReferenceError 引用了不存在的变量（写错变量名、TDZ 中访问 let 变量）
 *      URIError       URI 编解码失败（decodeURIComponent('%')）
 *      EvalError      历史遗留，现代 JS 已不再抛出，仅为兼容保留
 *
 * 2. 为什么需要
 *    (1) 错误类型本身就是"错误分类"，可以据此决定处理策略：
 *        TypeError/ReferenceError 通常是代码 bug（应当修代码），
 *        而 RangeError/URIError 往往来自外部输入（应当校验并提示用户）。
 *      (2) 通过 err instanceof TypeError 可以精确捕获某一类错误，
 *        其余继续向上抛，避免"一把抓"式的错误处理。
 *      (3) 看堆栈时，先看错误类型往往就能定位问题方向。
 *
 * 3. 核心语法要点
 *    (1) 所有内置错误都满足 `err instanceof Error === true`。
 *    (2) err.name 是类型名（如 'TypeError'），err.message 是描述信息，
 *        err.toString() 得到 "TypeError: xxx"。
 *    (3) SyntaxError 只在"解析代码"时出现：直接写在文件里的语法错误
 *        在加载阶段就报错，无法用 try/catch 捕获；
 *        但 JSON.parse 与 eval / new Function 里的代码是运行时解析的，可以捕获。
 *    (4) 各引擎的 message 文案不统一（不同 Node/V8 版本措辞可能变化），
 *        所以**不要用 message 文本做判断**，要用 instanceof 或 err.code。
 *
 * 4. 常见陷阱
 *    (1) 用 err.message.includes('xxx') 做分支判断 —— 换版本就失效。
 *    (2) 认为 `undefined.foo` 抛 ReferenceError —— 它抛的是 TypeError；
 *        引用**不存在的变量**才抛 ReferenceError。
 *    (3) 认为数组越界访问会抛错 —— 不会，返回 undefined（这点和很多语言不同）。
 *    (4) 把 SyntaxError（解析失败）和运行时错误混为一谈。
 *    (5) catch 里只打印 err.message 而不打印 err.name / err.stack，丢失信息。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/02_error_types.js
 *
 * 【预期输出】
 *   逐个触发并捕获六种常见内置错误，打印它们的 name / message / 继承关系，
 *   并演示按类型分流的捕获写法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 小工具：统一打印捕获到的错误
// ---------------------------------------------------------------------------

/**
 * 执行一个函数并打印它抛出的错误信息
 * @param {string} label 场景说明
 * @param {() => void} fn 会抛错的函数
 */
function demo(label, fn) {
  try {
    fn();
    console.log(`${label}\n  → 没有抛错（不符合预期）`);
  } catch (err) {
    console.log(`${label}`);
    console.log(`  → name    : ${err.name}`);
    console.log(`  → message : ${err.message}`);
    console.log(`  → 是 Error 的子类吗？${err instanceof Error}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Error —— 通用错误
// ---------------------------------------------------------------------------

console.log('--- 1. Error：通用错误 ---');

demo('1.1 手动 throw new Error("...")\n', () => {
  throw new Error('这是我自己抛的通用错误');
});

// Error 也可以直接创建但不抛出，用来承载信息
const plain = new Error('我只是被创建，没有被抛出');
console.log('1.2 未抛出的 Error 对象：');
console.log(`  → name = ${plain.name}，message = ${plain.message}`);
console.log(`  → toString() = ${plain.toString()}`);

// ---------------------------------------------------------------------------
// 2. TypeError —— 类型不符合预期
// ---------------------------------------------------------------------------

console.log('\n--- 2. TypeError：值的类型不对 ---');

demo('2.1 读 null 的属性：null.foo\n', () => {
  const obj = null;
  return obj.foo; // TypeError: Cannot read properties of null
});

demo('2.2 调用一个不是函数的东西\n', () => {
  const notAFunction = 42;
  return notAFunction(); // TypeError: notAFunction is not a function
});

demo('2.3 new 一个箭头函数（箭头函数不是构造函数）\n', () => {
  const NotConstructor = () => {};
  return new NotConstructor(); // TypeError: NotConstructor is not a constructor
});

demo('2.4 Object.defineProperty 里参数类型不对\n', () => {
  return Object.defineProperty(1, 'x', { value: 1 }); // TypeError: Object.defineProperty called on non-object
});

// ---------------------------------------------------------------------------
// 3. RangeError —— 数值或长度越界
// ---------------------------------------------------------------------------

console.log('\n--- 3. RangeError：数值超出范围 ---');

demo('3.1 用非法长度创建数组：new Array(-1)\n', () => {
  return new Array(-1); // RangeError: Invalid array length
});

demo('3.2 toFixed 的参数越界\n', () => {
  return (1.23).toFixed(101); // RangeError: toFixed() digits argument must be between 0 and 100
});

demo('3.3 递归太深导致调用栈溢出\n', () => {
  function recurse() {
    return recurse() + 1;
  }
  return recurse(); // RangeError: Maximum call stack size exceeded
});

// 注意：数组越界访问**不会**抛 RangeError，只会得到 undefined
const arr = [1, 2, 3];
console.log('3.4 数组越界访问 arr[99] =', arr[99], '（返回 undefined，不抛错）');

// ---------------------------------------------------------------------------
// 4. SyntaxError —— 语法/解析错误
// ---------------------------------------------------------------------------

console.log('\n--- 4. SyntaxError：解析失败 ---');

demo('4.1 JSON.parse 遇到非法 JSON\n', () => {
  return JSON.parse('{ 这不是 JSON }'); // SyntaxError: Unexpected token
});

demo('4.2 new Function 里传入了非法代码\n', () => {
  // new Function 会在运行时解析字符串里的代码，所以语法错误是可捕获的
  return new Function('return {{{')();
});

// 反例说明：直接写在文件里的语法错误根本无法被捕获
//   try { const = 1; } catch (e) { ... }   ← 整个文件在解析阶段就失败了
console.log('4.3 直接写在文件里的语法错误会在"加载阶段"失败，try/catch 救不了它；');
console.log('    只有运行时解析的代码（JSON.parse、eval、new Function）才能被捕获。');

// ---------------------------------------------------------------------------
// 5. ReferenceError —— 引用了不存在的变量
// ---------------------------------------------------------------------------

console.log('\n--- 5. ReferenceError：变量不存在 ---');

demo('5.1 访问未声明的变量\n', () => {
  // eslint-disable-next-line no-undef
  return notDeclaredAnywhere; // ReferenceError: notDeclaredAnywhere is not defined
});

demo('5.2 在 TDZ（暂时性死区）里访问 let 变量\n', () => {
  // 下面这行的 tdzVar 在声明之前就被访问了（块级作用域的 TDZ）
  return tdzVar;
  // eslint-disable-next-line no-unreachable
  let tdzVar = 1;
});

console.log('5.3 对比：访问不存在的**属性**不会抛 ReferenceError，只会得到 undefined');
console.log('    ({ }).notExist =', {}.notExist);

// typeof 对未声明的变量是安全的（不会抛错），这是唯一的安全探测方式
console.log('5.4 typeof notDeclaredAnywhere =', typeof notDeclaredAnywhere);

// ---------------------------------------------------------------------------
// 6. URIError —— URI 编解码失败
// ---------------------------------------------------------------------------

console.log('\n--- 6. URIError：URI 处理出错 ---');

demo('6.1 decodeURIComponent 遇到非法百分号编码\n', () => {
  return decodeURIComponent('%'); // URIError: URI malformed
});

demo('6.2 decodeURI 遇到非法序列\n', () => {
  return decodeURI('%E4%B8'); // 不完整的 UTF-8 字节序列
});

console.log('6.3 正确的用法：');
console.log('    encodeURIComponent("你好") =', encodeURIComponent('你好'));
console.log('    decodeURIComponent("%E4%BD%A0%E5%A5%BD") =', decodeURIComponent('%E4%BD%A0%E5%A5%BD'));

// ---------------------------------------------------------------------------
// 7. 按类型分流的捕获写法
// ---------------------------------------------------------------------------

console.log('\n--- 7. 按错误类型分别处理 ---');

/**
 * 一个"安全解析并计算"的函数，演示按错误类型分流
 * @param {string} jsonText JSON 文本
 * @returns {number|string} 计算结果或错误说明
 */
function compute(jsonText) {
  try {
    const obj = JSON.parse(jsonText); // 可能 SyntaxError
    if (typeof obj.n !== 'number') {
      throw new TypeError('字段 n 必须是数字'); // 主动抛 TypeError
    }
    if (obj.n < 0) {
      throw new RangeError('字段 n 不能为负数'); // 主动抛 RangeError
    }
    return obj.n * 2;
  } catch (err) {
    if (err instanceof SyntaxError) {
      return `输入不是合法 JSON：${err.message}`;
    }
    if (err instanceof TypeError) {
      return `类型不对：${err.message}`;
    }
    if (err instanceof RangeError) {
      return `范围不对：${err.message}`;
    }
    // 兜底：不是预期内的错误，重新抛出（"早抛晚捕"原则，见 08）
    throw err;
  }
}

console.log('合法输入      →', compute('{"n": 21}'));
console.log('非法 JSON     →', compute('{ n: 21 }'));
console.log('类型不对      →', compute('{"n": "21"}'));
console.log('范围不对      →', compute('{"n": -1}'));

// ---------------------------------------------------------------------------
// 8. 继承关系速查
// ---------------------------------------------------------------------------

console.log('\n--- 8. 内置错误类型的继承关系 ---');
const types = [Error, TypeError, RangeError, SyntaxError, ReferenceError, URIError, EvalError];
for (const T of types) {
  console.log(`  ${T.name.padEnd(15)} instanceof Error ? ${new T('x') instanceof Error}`);
}
console.log('它们都是 Error 的子类，所以 catch (e) 都能接住；');
console.log('判断具体类型请用 instanceof，不要依赖 message 文本。');
