/**
 * ============================================================================
 * 知识点：if / else if / else —— 条件表达式求值规则
 * ============================================================================
 *
 * 【所属分类】05_control_flow —— 流程控制
 * 【难度等级】入门
 * 【前置知识】04_operators/03_comparison.js、04_operators/04_logical.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    if 是 JS 最基本的分支语句，有三种形态：
 *      if (条件) { ... }
 *      if (条件) { ... } else { ... }
 *      if (条件1) { ... } else if (条件2) { ... } else { ... }
 *    括号里的"条件"可以是任意表达式，不要求是布尔值。
 *
 * 2. 为什么需要
 *    程序之所以有用，是因为它能根据不同的输入做出不同反应。
 *    if 就是这台"决策机器"最基础的零件，所有校验、权限判断、业务分支都建立在它之上。
 *
 * 3. 核心语法要点
 *    【条件求值规则】括号里的表达式会先求值，然后**隐式转换成布尔值**（ToBoolean）：
 *      - 只有 8 个"假值"（falsy）：false、0、-0、0n、''、null、undefined、NaN
 *      - 其余一切值都是"真值"（truthy），包括 '0'、'false'、[]、{}、function(){}、
 *        new Boolean(false)（这是个对象，永远是真值！）
 *    【代码块与单语句】
 *      if 后面可以跟一个语句而不加大括号，但强烈建议永远写 {}：
 *        一是防止后续加行时出错，二是避免"悬挂 else"问题。
 *    【else if 的本质】
 *      JS 并没有 else if 这个语法结构，它是 `else` 后面接一个 `if` 语句的简写。
 *      所以整条链是**从上到下依次判断，命中第一个真值条件后，后面全部跳过**。
 *    【可以省略 else】
 *      如果两个分支里有一个是"什么都不做"，省略 else 往往更清晰（见 08_early_return.js）。
 *
 * 4. 常见陷阱
 *    - 悬挂 else：不加大括号时，else 会绑定到**最近的** if。
 *    - 赋值当比较：if (x = 5) 恒为真值（5 是真值），且会污染 x。
 *    - 用 == 比较导致隐式转换：'0' == false 为 true，判断时请用 ===。
 *    - 顺序错误：把宽松条件写在前面会让后面的精确条件永远无法命中。
 *    - 忘记 NaN：value === NaN 永远是 false，要用 Number.isNaN(value)。
 *    - 空对象与空数组是真值，判断"有没有内容"要用 Object.keys(o).length 或 o.length。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 05_control_flow/01_if_else.js
 *
 * 【预期输出】
 *   依次打印 if/else if/else 的基本分支、条件求值的真值规则、
 *   悬挂 else 陷阱、条件顺序陷阱，以及若干实战校验示例。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 最基础的三种形态
// ---------------------------------------------------------------------------

console.log('--- 1. 基本形态 ---');

const temperature = 32;

// 形态一：只有 if
if (temperature > 30) {
  console.log(`温度 ${temperature}℃，很热，记得开空调`);
}

// 形态二：if / else
if (temperature >= 25) {
  console.log('体感：舒适偏热');
} else {
  console.log('体感：偏凉');
}

// 形态三：if / else if / else（从上往下依次判断，命中第一个就停）
function describeTemperature(t) {
  if (t >= 35) {
    return '酷热';
  } else if (t >= 28) {
    return '炎热';
  } else if (t >= 18) {
    return '舒适';
  } else if (t >= 5) {
    return '凉爽';
  } else {
    return '寒冷';
  }
}

for (const t of [40, 30, 22, 10, -5]) {
  console.log(`  ${t}℃ => ${describeTemperature(t)}`);
}

// else if 的本质：它就是"else 后面接一个 if 语句"，大括号可以省略到看起来很平
function tierOf(score) {
  if (score >= 90) return 'A';
  else if (score >= 80) return 'B';
  else if (score >= 60) return 'C';
  else return 'D';
}
console.log('tierOf(85) =', tierOf(85)); // 'B'
console.log('tierOf(59) =', tierOf(59)); // 'D'

// ---------------------------------------------------------------------------
// 2. 条件求值规则：只有 8 个假值
// ---------------------------------------------------------------------------

console.log('\n--- 2. 条件求值规则（truthy / falsy） ---');

// 用 [标签, 值] 的形式，避免 0 / -0 / 0n 打印出来长得一样而看不清
const falsyList = [
  ['false', false],
  ['0', 0],
  ['-0', -0],
  ['0n（BigInt 零）', 0n],
  ['""（空字符串）', ''],
  ['null', null],
  ['undefined', undefined],
  ['NaN', NaN],
];
console.log('  下面这 8 个是假值（走 else 分支）：');
for (const [label, v] of falsyList) {
  console.log(`    ${label.padEnd(18)} => ${v ? '真值（不应该出现）' : '假值 ✔'}`);
}

console.log('\n  下面是常被误认为假值、其实是真值的值：');
const truthySurprises = [
  ["'0'", '0'],
  ["'false'", 'false'],
  ['[]', []],
  ['{}', {}],
  ['function(){}', () => {}],
  ['new Boolean(false)', new Boolean(false)],
  ['Infinity', Infinity],
  ["' '（空格串）", ' '],
];
for (const [label, v] of truthySurprises) {
  console.log(`    ${label} => ${v ? '真值 ✔' : '假值'}`);
}

// 特别注意这一条：包装对象永远是真值，这是 JS 最著名的反直觉点之一
const wrappedFalse = new Boolean(false);
console.log('  new Boolean(false) 的值是', wrappedFalse.valueOf(), '，但它在 if 里永远是真值');
if (wrappedFalse) {
  console.log('  => 因为它是一个对象，而对象永远是 truthy，所以这行会执行');
}

// 条件可以是任意表达式，不一定是比较
const items = [1, 2, 3];
if (items.length) {
  console.log('  items.length =', items.length, '为真值 => 数组非空');
}

const config = { debug: true };
if (config && config.debug) {
  console.log('  链式条件 config && config.debug 也合法');
}

// 判断"空对象 / 空数组"的正确方式
const emptyObj = {};
const emptyArr = [];
console.log('  Boolean({}) =', Boolean(emptyObj), 'Boolean([]) =', Boolean(emptyArr));
console.log('  正确的空对象判断：Object.keys(emptyObj).length === 0 =>', Object.keys(emptyObj).length === 0);
console.log('  正确的空数组判断：emptyArr.length === 0 =>', emptyArr.length === 0);

// ---------------------------------------------------------------------------
// 3. 陷阱一：悬挂 else
// ---------------------------------------------------------------------------

console.log('\n--- 3. 陷阱：悬挂 else ---');

// 不加大括号时，else 会绑定到"最近的" if，而不是看起来对齐的那个
function danglingElse(a, b) {
  if (a > 0)
    if (b > 0) console.log('    a>0 且 b>0');
    else console.log('    else 绑定到了内层 if（即 b<=0），而不是外层！');
  // 外层 if 没有 else
}
console.log('  调用 danglingElse(1, -1)：');
danglingElse(1, -1);
console.log('  调用 danglingElse(-1, 1)（a<=0，整个 if 都不进入）：');
danglingElse(-1, 1);

// 加上大括号，意图立刻明确
function explicitElse(a, b) {
  if (a > 0) {
    if (b > 0) {
      console.log('    a>0 且 b>0');
    }
  } else {
    console.log('    a<=0（这才是外层 else，与上面的行为完全不同）');
  }
}
console.log('  调用 explicitElse(1, -1)：');
explicitElse(1, -1);
console.log('  调用 explicitElse(-1, 1)：');
explicitElse(-1, 1);

// ---------------------------------------------------------------------------
// 4. 陷阱二：条件顺序
// ---------------------------------------------------------------------------

console.log('\n--- 4. 陷阱：条件顺序 ---');

// 错误示范：把宽松条件写在前面，后面的精确条件永远不会命中
function badGrade(score) {
  if (score >= 60) return '及格';
  else if (score >= 90) return '优秀'; // 永远到不了这里，因为 >=90 一定 >=60
  else return '不及格';
}
console.log('  顺序错误：badGrade(95) =', badGrade(95), '（本该是"优秀"）');

// 正确示范：从严格到宽松排列
function goodGrade(score) {
  if (score >= 90) return '优秀';
  else if (score >= 60) return '及格';
  else return '不及格';
}
console.log('  顺序正确：goodGrade(95) =', goodGrade(95)); // '优秀'

// ---------------------------------------------------------------------------
// 5. 陷阱三：赋值当比较、NaN、== 的隐式转换
// ---------------------------------------------------------------------------

console.log('\n--- 5. 其它常见陷阱 ---');

// 陷阱 A：写 = 而不是 ===
let count = 100;
if ((count = 0)) {
  console.log('  不会执行');
} else {
  console.log('  if (count = 0) 恒为假值，且 count 被改成了', count);
}

// 陷阱 B：用 === 判断 NaN 永远失败
const notANumber = Number('abc');
if (notANumber === NaN) {
  console.log('  永远不会执行');
} else {
  console.log('  NaN === NaN 是 false，所以走了 else；正确写法是 Number.isNaN()');
}
console.log('  Number.isNaN(Number("abc")) =', Number.isNaN(notANumber)); // true

// 陷阱 C：== 的隐式转换让条件意外为真
const userInput = '0';
if (userInput == false) {
  console.log("  '0' == false 为 true（都转成了 0），这就是误判的根源");
}
if (userInput.length > 0) {
  console.log("  改用长度判断：'0' 确实是有内容的输入");
}

// 陷阱 D：null 与 undefined 的判断
function getValue() {
  return undefined;
}
const got = getValue();
// 想同时覆盖两种"空"，用 == null 是最简洁且被社区接受的写法
if (got == null) {
  console.log('  got == null 同时覆盖 null 与 undefined');
}

// ---------------------------------------------------------------------------
// 6. 实战：表单校验
// ---------------------------------------------------------------------------

console.log('\n--- 6. 实战：表单校验 ---');

function validateUser(input) {
  // 校验顺序体现"从最重要的检查开始"的业务逻辑
  if (!input || typeof input !== 'object') {
    return { ok: false, reason: '输入不是有效对象' };
  }
  if (!input.name || input.name.trim() === '') {
    return { ok: false, reason: '姓名不能为空' };
  }
  if (input.name.trim().length < 2) {
    return { ok: false, reason: '姓名至少 2 个字符' };
  }
  if (typeof input.age !== 'number' || Number.isNaN(input.age)) {
    return { ok: false, reason: '年龄必须是数字' };
  }
  if (input.age < 0 || input.age > 150) {
    return { ok: false, reason: '年龄超出合理范围' };
  }
  if (!input.email || !input.email.includes('@')) {
    return { ok: false, reason: '邮箱格式不正确' };
  }
  return { ok: true, reason: '校验通过' };
}

const testInputs = [
  null,
  { name: '', age: 20, email: 'a@b.com' },
  { name: '王', age: 20, email: 'a@b.com' },
  { name: '小明', age: '20', email: 'a@b.com' },
  { name: '小明', age: 200, email: 'a@b.com' },
  { name: '小明', age: 20, email: 'bad-email' },
  { name: '小明', age: 20, email: 'a@b.com' },
];
for (const input of testInputs) {
  const r = validateUser(input);
  console.log(`  ${JSON.stringify(input)} => ${r.ok ? '✔' : '✘'} ${r.reason}`);
}

// ---------------------------------------------------------------------------
// 7. 实战：三态判断（既不是真也不是假）
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战：三态判断 ---');

// 有些业务需要区分"是 / 否 / 未知"三种状态，别用布尔值硬塞
function checkPermission(user) {
  if (user === null || user === undefined) {
    return 'unknown'; // 未登录，权限未知
  }
  if (user.role === 'admin') {
    return 'granted';
  }
  return 'denied'; // 已登录但无权限
}

console.log('  checkPermission(null) =', checkPermission(null)); // unknown
console.log("  checkPermission({ role: 'admin' }) =", checkPermission({ role: 'admin' })); // granted
console.log("  checkPermission({ role: 'user' }) =", checkPermission({ role: 'user' })); // denied

console.log('\n全部演示结束。');
