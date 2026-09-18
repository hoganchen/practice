/**
 * ============================================================================
 * 知识点：赋值运算符 —— 复合赋值、链式赋值与逻辑赋值
 * ============================================================================
 *
 * 【所属分类】04_operators —— 运算符与表达式
 * 【难度等级】入门
 * 【前置知识】04_operators/01_arithmetic.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    赋值运算符用于"把右边的值写进左边的变量"，分为三类：
 *      - 基本赋值：=  （注意：它不是数学里的"等于"，而是"赋值"）
 *      - 算术复合赋值：+=  -=  *=  /=  %=  **=（以及位运算的 &= |= ^= <<= >>= >>>=）
 *      - 逻辑赋值（ES2021）：||=  &&=  ??=
 *
 * 2. 为什么需要
 *    - 复合赋值让 a = a + 1 可以简写成 a += 1，少写一次变量名，也少一次出错机会
 *      （尤其是左边是 obj.deep.list[i] 这种长表达式时）。
 *    - 逻辑赋值把"先判断再赋值"的常见模式压缩成一个运算符，
 *      例如"配置项为空时才填默认值"：config.timeout ??= 3000。
 *    - 链式赋值可以一次性给多个变量赋同一个初值。
 *
 * 3. 核心语法要点
 *    - 所有赋值运算符都是"右结合"的：a = b = c 等价于 a = (b = c)。
 *      赋值表达式的"值"就是被赋的那个值，所以链式赋值才成立。
 *    - 复合赋值的语义是：x op= y  等价于  x = x op y，但左操作数只求值一次。
 *    - += 遇到字符串仍然是拼接：s += '!' 就是 s = s + '!'。
 *    - 逻辑赋值只在"需要写回"时才真正赋值，短路时连赋值动作都不会发生：
 *        a ||= b  等价于  a || (a = b)      —— a 为真值时，a 保持不变
 *        a &&= b  等价于  a && (a = b)      —— a 为假值时，a 保持不变
 *        a ??= b  等价于  a ?? (a = b)      —— a 不是 null/undefined 时，a 保持不变
 *    - 赋值运算符优先级极低，几乎总是最后执行，所以 a = b + c 不需要括号。
 *
 * 4. 常见陷阱
 *    - 把 = 当成比较：if (x = 0) 永远为假，且会把 x 悄悄改成 0。
 *      条件里要写 x === 0。（若确实想赋值再判断，应显式写成 if ((x = f()) !== 0)）
 *    - const 声明的变量不能再次赋值，a += 1 会抛 TypeError。
 *      但 const 对象的"属性"可以改：obj.n++ 是合法的。
 *    - ??= 与 ||= 的差别在 0、''、false 这些"假值但有效"的数据上会暴露出来，
 *      配置项允许设为 0 时必须用 ??=。
 *    - 逻辑赋值也是"表达式"，能参与更大表达式，滥用会让代码难以阅读。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 04_operators/02_assignment.js
 *
 * 【预期输出】
 *   依次打印基本与复合赋值、链式赋值、||= / &&= / ??= 的行为差异，
 *   以及"用 = 代替 ==" 陷阱的演示结果。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本赋值与复合赋值
// ---------------------------------------------------------------------------

console.log('--- 1. 基本与复合赋值 ---');

let n = 10;
// n += 5 完全等价于 n = n + 5，但左边的 n 只"求值"一次，写起来也更短
n += 5;
console.log('let n = 10; n += 5  =>', n); // 15

n -= 3;
console.log('n -= 3  =>', n); // 12

n *= 2;
console.log('n *= 2  =>', n); // 24

n /= 4;
console.log('n /= 4  =>', n); // 6

n %= 4;
console.log('n %= 4  =>', n); // 2

n **= 5;
console.log('n **= 5  =>', n); // 32

// 复合赋值同样会做隐式类型转换
let s = '总价：';
s += 100; // 等价于 s = s + 100，加号遇到字符串变成拼接
console.log("let s = '总价：'; s += 100  =>", s); // '总价：100'

let v = '10';
v *= 2; // 乘号没有"拼接"语义，'10' 会被转成数字 10
console.log("let v = '10'; v *= 2  =>", v, '，类型仍是', typeof v); // 20 'number'

// ---------------------------------------------------------------------------
// 2. 链式赋值与赋值表达式的值
// ---------------------------------------------------------------------------

console.log('\n--- 2. 链式赋值 ---');

// 赋值是"表达式"而不是"语句"，它本身有一个值，这个值就是刚赋进去的东西。
// 又因为赋值是右结合的，a = b = c 会先算 b = c，再把结果给 a。
let p, q, r;
p = q = r = 7;
console.log('p = q = r = 7  =>', { p, q, r }); // { p: 7, q: 7, r: 7 }

// 用括号可以看出赋值表达式的返回值
const assigned = (p = 99);
console.log('(p = 99) 这个表达式的值 =', assigned, '，此时 p =', p); // 99, 99

// 实用场景：交换两个变量。下面用的是"数组解构赋值"，不依赖链式赋值，
// 是 ES6 之后交换变量的标准写法（老写法需要一个临时变量 temp）。
let m = 1;
let k = 2;
[m, k] = [k, m];
console.log('交换后 m =', m, '，k =', k); // 2, 1

// ---------------------------------------------------------------------------
// 3. 逻辑赋值：||=、&&=、??=
// ---------------------------------------------------------------------------

console.log('\n--- 3. 逻辑赋值 ---');

// ||= ：左边"假值"（'' / 0 / false / null / undefined / NaN）时才写入
let nickname = '';
nickname ||= '匿名用户'; // '' 是假值 => 写入默认值
console.log("let nickname = ''; nickname ||= '匿名用户'  =>", nickname); // '匿名用户'

let nickname2 = '小明';
nickname2 ||= '匿名用户'; // '小明' 是真值 => 保持原值，不赋值
console.log("let nickname2 = '小明'; nickname2 ||= '匿名用户'  =>", nickname2); // '小明'

// &&= ：左边"真值"时才写入，常用于"对象存在才更新字段"
let user = { name: '阿强', loggedIn: true };
user.loggedIn &&= false;
console.log('let user = { loggedIn: true }; user.loggedIn &&= false  =>', user.loggedIn); // false

let maybeUser = null;
maybeUser &&= { name: '不会执行' }; // 左边是假值，右边完全不求值
console.log('let maybeUser = null; maybeUser &&= {...}  =>', maybeUser); // null

// ??= ：只有 null / undefined 才写入（0、''、false 都算"有效值"，会被保留）
let config = { timeout: 0, retries: undefined };
config.timeout ??= 3000; // 0 不是 null/undefined => 保留 0
config.retries ??= 3; // undefined => 写入 3
console.log('config.timeout ??= 3000 后 =', config.timeout, '（0 被保留）'); // 0
console.log('config.retries ??= 3 后 =', config.retries); // 3

// 对比：同样的场景若用 ||= 就会把合法的 0 覆盖掉，这是真实项目里的高频 bug
const configWithOr = { timeout: 0 };
configWithOr.timeout ||= 3000; // 0 是假值 => 被错误地覆盖
console.log('若写成 configWithOr.timeout ||= 3000 则 =', configWithOr.timeout, '（0 被吃掉了）'); // 3000

// 实用场景：带默认值的选项合并
function createServerOptions(options = {}) {
  const opts = { ...options };
  opts.host ??= '127.0.0.1';
  opts.port ??= 8080;
  opts.verbose ??= false;
  return opts;
}
console.log('createServerOptions({ port: 0 }) =', createServerOptions({ port: 0 }));
// port 保留 0，说明 ??= 没有误伤

// ---------------------------------------------------------------------------
// 4. 陷阱一：把 = 写成 == 的条件判断
// ---------------------------------------------------------------------------

console.log('\n--- 4. 陷阱：条件里写 = ---');

// if (x = 0) 不会报错，而是"先把 0 赋给 x，再用 0 当条件"，0 是假值所以永远不进入分支
let flag = 5;
if ((flag = 0)) {
  console.log('这行不会执行');
} else {
  console.log('if (flag = 0) 走了 else 分支，并且 flag 被悄悄改成了', flag); // 0
}

// 如果需要"赋值并判断"，标准写法是加一层括号并明确比较
let input;
const readValue = () => 42;
if ((input = readValue()) !== undefined) {
  console.log('显式括号写法：(input = readValue()) !== undefined 成立，input =', input); // 42
}

// ---------------------------------------------------------------------------
// 5. 陷阱二：const 与"不可重新赋值"
// ---------------------------------------------------------------------------

console.log('\n--- 5. 陷阱：const 不能被 reassign ---');

const fixed = 10;
try {
  // 对 const 变量使用复合赋值，运行时会抛 TypeError
  // 这里包在 eval 中以捕获异常，避免整个文件崩溃
  eval('fixed += 1;');
  console.log('没有报错（不会执行到这里）');
} catch (err) {
  console.log('对 const 做 fixed += 1 抛出：', err.constructor.name, '-', err.message);
}

// 但 const 只限制"变量本身重新指向"，不限制对象内部属性的修改
const box = { count: 0 };
box.count += 1; // 合法：改的是对象的属性，不是 box 这个绑定
box.count += 1;
console.log('const box = { count: 0 }; box.count += 1 两次后 =', box.count); // 2

console.log('\n全部演示结束。');
