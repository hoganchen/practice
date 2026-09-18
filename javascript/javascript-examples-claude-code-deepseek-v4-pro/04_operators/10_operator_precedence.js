/**
 * ============================================================================
 * 知识点：运算符优先级与结合性 —— 用括号消除歧义
 * ============================================================================
 *
 * 【所属分类】04_operators —— 运算符与表达式
 * 【难度等级】进阶
 * 【前置知识】04_operators/03_comparison.js、04_operators/04_logical.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    【优先级（Precedence）】决定"先算谁"。例如 1 + 2 * 3 先算乘法。
 *    【结合性（Associativity）】决定"同一优先级的运算符从哪边开始算"：
 *      左结合（左到右）：+ - * / % && || ?: 之外的绝大多数
 *      右结合（右到左）：赋值 = += 等、**、三元 ?:、一元前缀、new 无参
 *    两者共同决定一个表达式的唯一解析方式（语法树形状）。
 *
 * 2. 为什么需要
 *    知道优先级不是为了背表格，而是为了两件事：
 *      (1) 能读懂别人写的紧凑表达式（如 typeof x === 'string' 为什么成立）；
 *      (2) 知道哪些地方**必须**加括号，否则实际语义与你的意图不符，
 *          这类 bug 不会报错，只会静默算错。
 *
 * 3. 核心语法要点（从高到低，只列常用层级）
 *      19  分组 ()
 *      17  成员访问 .  []      可选链 ?.
 *      16  new（带参数）
 *      15  后置自增/自减 ++ --
 *      14  一元 ! ~ + - typeof void delete await
 *      13  **  （右结合）
 *      12  * / %
 *      11  + -
 *      10  << >> >>>
 *       9  < <= > >= in instanceof
 *       8  == != === !==
 *       7  &
 *       6  ^
 *       5  |
 *       4  &&      （可以记成 "逻辑运算符低于比较，低于位运算"）
 *       3  ||  ??
 *       2  三元 ?:  （右结合）
 *       1  赋值 = += -= *= /= %= **= ??= &&= ||=（右结合）
 *       1  逗号 ,
 *
 *    几条必须记住的结论：
 *      - 算术 > 比较 > 逻辑，所以 1 + 2 > 2 && 3 < 4 不用加括号也对。
 *      - typeof / ! 是一元运算符（优先级 14），高于比较（9），
 *        所以 typeof x === 'string' 实际是 (typeof x) === 'string'，正确。
 *      - 位运算优先级**低于**比较：a & b === c 是 a & (b === c)，这里必须加括号。
 *      - ?? 与 || 同层级（3），但不能直接混用，规范强制加括号。
 *      - 赋值与逗号优先级最低，几乎总是最后执行。
 *      - ** 是右结合：2 ** 3 ** 2 === 512，与 -(2 ** 2) 需要括号的规则同源。
 *
 * 4. 常见陷阱
 *    - `a & b === c`、`a | b == c` 这类"位运算 + 比较"的错误结合。
 *    - `a ?? b || c` 直接就是 SyntaxError（必须有括号）。
 *    - typeof 与 + 连用：typeof 5 + 'x' 得到 'numberx'，
 *      因为 typeof 5 先算，再与 'x' 拼接。
 *    - `-2 ** 2` 是语法错误（一元负号与 ** 冲突）。
 *    - `1 < 2 < 3` 是 true（先算 1<2 得 true，再 true<3），
 *      而 `3 > 2 > 1` 是 false，链式比较必须用 && 拆开。
 *    - 三元与 ?? 混用：a ?? b ? c : d 是 (a ?? b) ? c : d。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 04_operators/10_operator_precedence.js
 *
 * 【预期输出】
 *   依次打印算术/比较/逻辑的优先级验证、一元与 typeof 的结合、
 *   位运算低于比较的陷阱、右结合运算符的验证、链式比较陷阱，
 *   以及"加括号提升可读性"的对照示例。
 * ============================================================================
 */

// 小工具：把"实际解析结果"和"猜测解析结果"放在一起对比
function compare(label, actual, guessed) {
  const same = Object.is(actual, guessed);
  console.log(
    `  ${label}  实际 = ${String(actual)}  |  若按人类直觉解析 = ${String(guessed)}  => ${same ? '一致' : '★ 不一致（必须加括号）'}`,
  );
}

// ---------------------------------------------------------------------------
// 1. 算术 > 比较 > 逻辑
// ---------------------------------------------------------------------------

console.log('--- 1. 算术 > 比较 > 逻辑 ---');

// 乘法先于加法
console.log('1 + 2 * 3 =', 1 + 2 * 3); // 7，不是 9
console.log('(1 + 2) * 3 =', (1 + 2) * 3); // 9

// 算术先于比较：下面是 (1 + 2) > 2，不是 1 + (2 > 2)
console.log('1 + 2 > 2 =', 1 + 2 > 2); // true
compare('1 + 2 > 2', 1 + 2 > 2, 1 + 2 > 2);

// 比较先于逻辑：下面是 (3 > 2) && (2 > 1)
console.log('3 > 2 && 2 > 1 =', 3 > 2 && 2 > 1); // true
console.log('3 > 2 && 2 > 1 的解析 = (3 > 2) && (2 > 1) =', 3 > 2 && 2 > 1);

// && 先于 ||：(true || false) && false 与 true || (false && false) 结果不同
const t = true;
const f = false;
console.log('t || f && f =', t || f && f); // true，因为 f && f 先算得 false，再 t || false = true
console.log('(t || f) && f =', (t || f) && f); // false，加括号后完全不同！

// ---------------------------------------------------------------------------
// 2. 一元运算符与 typeof 的高优先级
// ---------------------------------------------------------------------------

console.log('\n--- 2. 一元运算符与 typeof ---');

// typeof 是一元运算符，优先级高于 ===，所以这句能按直觉工作
const name = '小明';
console.log("typeof name === 'string' =", typeof name === 'string'); // true
console.log("等价写法 (typeof name) === 'string' =", (typeof name) === 'string'); // true

// 但与 + 连用就会翻车：typeof 先算完，结果再与字符串拼接
console.log("typeof 5 + 'x' =", typeof 5 + 'x'); // 'numberx'（不是 typeof (5+'x')='string'）
console.log("typeof (5 + 'x') 才是 string =", typeof (5 + 'x')); // 'string'

// ! 优先级高于 ===，前面章节已演示，这里再看一个例子
console.log('!0 === true =', !0 === true); // true，因为 !0 得 true，再 true === true

// 一元 + 优先级高于 *，所以下面不是 +(2 * 3) 而是 (+2) * 3
console.log("+'2' * 3 =", +'2' * 3); // 6
console.log("+('2' * 3) =", +('2' * 3)); // 6（恰好相同，但语义不同：前者先转数字再乘）

// 前缀 ++ 优先级高于 *，看一个容易看错的例子
let k = 2;
const prefixCase = ++k * 2; // 先 ++k 得 3，再 *2 得 6
console.log('let k = 2; ++k * 2 =', prefixCase, '，k =', k); // 6, 3

// ---------------------------------------------------------------------------
// 3. 陷阱一：位运算优先级低于比较
// ---------------------------------------------------------------------------

console.log('\n--- 3. 陷阱：位运算低于比较 ---');

const permA = 1; // 0b01
const permB = 0; // 0b00

// 期望：(permA & permB) === 0 => true
// 实际：permA & (permB === 0) => 1 & true => 1 & 1 => 1 => 真值
compare('permA & permB === 0', permA & permB === 0, (permA & permB) === 0);
console.log('  解析过程：permA & (permB === 0) = 1 & true = 1 & 1 =', permA & (permB === 0));
console.log('  正确写法 (permA & permB) === 0 =', (permA & permB) === 0);

// 同理，| 也低于 ===
compare('permA | permB === 0', permA | permB === 0, (permA | permB) === 0);
// 实际是 permA | (permB === 0) = 1 | true = 1 | 1 = 1

// 结论：位运算与比较混用时，**永远**给位运算加括号
console.log('  结论：任何"位运算 + 比较"的组合都必须给位运算加括号');

// ---------------------------------------------------------------------------
// 4. 右结合运算符
// ---------------------------------------------------------------------------

console.log('\n--- 4. 右结合运算符 ---');

// ** 右结合：从右往左算
console.log('2 ** 3 ** 2 =', 2 ** 3 ** 2, '（= 2 ** (3 ** 2) = 2 ** 9 = 512）');
// 若 ** 是左结合，2 ** 3 ** 2 就会算成 (2 ** 3) ** 2 = 64；实际得到 512，证明它是右结合
console.log('(2 ** 3) ** 2 =', (2 ** 3) ** 2, '（这才是左结合的结果，与上一行不同）');

// 赋值右结合：a = b = c 先算 b = c
let x;
let y;
let z;
x = y = z = 5;
console.log('x = y = z = 5 =>', { x, y, z }); // 全 5

// 三元右结合：a ? b : c ? d : e 解析成 a ? b : (c ? d : e)
console.log("false ? 'A' : false ? 'B' : 'C' =", false ? 'A' : false ? 'B' : 'C'); // 'C'
console.log("加括号验证：false ? 'A' : (false ? 'B' : 'C') =", false ? 'A' : (false ? 'B' : 'C')); // 'C'
// 如果不小心写成左结合，结果会完全不同
console.log("若按左结合 (false ? 'A' : false) ? 'B' : 'C' =", (false ? 'A' : false) ? 'B' : 'C'); // 'C'（恰好相同，换个条件就不同）

// 换个例子让差异显现
console.log("true ? 'A' : true ? 'B' : 'C' =", true ? 'A' : true ? 'B' : 'C'); // 'A'（右结合）
console.log("若按左结合 ((true ? 'A' : true) ? 'B' : 'C') =", (true ? 'A' : true) ? 'B' : 'C'); // 'B'（不同！）

// 复合赋值也是右结合，并且优先级低于几乎所有运算符
let total = 10;
total += 5 * 2; // 先算 5 * 2 = 10，再 total += 10
console.log('let total = 10; total += 5 * 2 =>', total); // 20

// ---------------------------------------------------------------------------
// 5. 陷阱二：链式比较
// ---------------------------------------------------------------------------

console.log('\n--- 5. 陷阱：链式比较 ---');

// JS 不支持数学里的 a < b < c 写法，它是左结合的两次比较
console.log('1 < 2 < 3 =', 1 < 2 < 3, '（看似对，其实是运气好）');
// 拆解：1 < 2 得 true，再 true < 3 => 1 < 3 => true

console.log('3 > 2 > 1 =', 3 > 2 > 1, '（数学上显然成立，JS 里却是 false）');
// 拆解：3 > 2 得 true，再 true > 1 => 1 > 1 => false

compare('3 > 2 > 1', 3 > 2 > 1, 3 > 2 && 2 > 1);
console.log('  正确写法：3 > 2 && 2 > 1 =', 3 > 2 && 2 > 1); // true

// 区间判断的正确写法
function inRange(value, min, max) {
  return value >= min && value <= max; // 必须用 && 拆开
}
console.log('  inRange(5, 1, 10) =', inRange(5, 1, 10)); // true
console.log('  inRange(50, 1, 10) =', inRange(50, 1, 10)); // false

// ---------------------------------------------------------------------------
// 6. 陷阱三：?? 与 || / && 混用
// ---------------------------------------------------------------------------

console.log('\n--- 6. 陷阱：?? 与 || 混用 ---');

// ?? 与 || 优先级相同（都是 3），但规范禁止无括号混用 => SyntaxError
try {
  new Function('return null ?? "a" || "b";');
} catch (err) {
  console.log('  null ?? "a" || "b" 抛出：', err.constructor.name, '-', err.message.split('\n')[0]);
}

// 想表达"先取空值兜底，再取真值兜底"，就要显式加括号
console.log('  (null ?? "a") || "b" =', (null ?? 'a') || 'b'); // 'a'
console.log('  null ?? ("a" || "b") =', null ?? ('a' || 'b')); // 'a'

// 这也说明：**不要**把优先级当成炫技工具，写清楚意图才是目的

// ---------------------------------------------------------------------------
// 7. 实践建议：用括号而不是记忆优先级
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实践：主动加括号 ---');

const a = 5;
const b = 3;
const c = 2;

// 版本一：依赖优先级（虽然正确，但读者需要停下来想一秒）
const noParens = a + b * c > 10 && b !== c;
// 版本二：显式加括号，意图一眼可见（推荐）
const withParens = (a + b * c > 10) && (b !== c);
console.log('  不加括号 =', noParens, '，加括号 =', withParens, '，结果一致：', noParens === withParens);

// 混合逻辑运算时尤其明显
const isAdmin = true;
const isOwner = false;
const isActive = false;
const noParens2 = isAdmin || (isOwner && isActive);
console.log('  isAdmin || (isOwner && isActive) =', noParens2); // true
console.log('  (isAdmin || isOwner) && isActive =', (isAdmin || isOwner) && isActive); // false

// 现实中的推荐规则：
//   1) 只有在"优先级广为人知且无歧义"时才省略括号（如 * 高于 +）
//   2) 逻辑运算符混用时一律加括号
//   3) 位运算与比较混用时一律加括号
//   4) 一元运算符与其它运算符混用时加括号

// 一个"用括号让代码自解释"的完整示例
function canPublish(user, draft) {
  // 一句话读出来就是规则本身，不需要读者去查优先级表
  return (user.role === 'editor' || user.role === 'admin') && (draft.status === 'ready') && !draft.locked;
}
console.log('  canPublish 测试 =', canPublish({ role: 'editor' }, { status: 'ready', locked: false })); // true
console.log('  canPublish 测试 =', canPublish({ role: 'viewer' }, { status: 'ready', locked: false })); // false

console.log('\n全部演示结束。');
