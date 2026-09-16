/**
 * ============================================================================
 * 知识点：变量提升（hoisting）与暂时性死区（TDZ）详解
 * ============================================================================
 *
 * 【所属分类】02_variables —— 变量与作用域
 * 【难度等级】进阶
 * 【前置知识】02_variables/01_var.js、02_variables/02_let.js、02_variables/03_const.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这两件事是同一枚硬币的两面，描述的都是"代码在书写顺序上还没跑到声明，
 *    但引擎在解析阶段已经先处理了它"这一现象：
 *    - 变量提升（hoisting）：**声明部分**被提升到所在作用域顶部。
 *    - 暂时性死区（TDZ, Temporal Dead Zone）：用 let/const/class 声明的绑定，
 *      从进入作用域到声明语句执行完成为止的这段时间，处于"已创建但未初始化"状态，
 *      任何读写都会抛 ReferenceError。
 *    一句话对比：var 提升后给你 undefined；let/const 提升后给你一颗地雷。
 *
 * 2. 为什么需要 / 解决什么问题
 *    绝大多数"诡异 bug"都源于此：变量莫名是 undefined（var 提升）、
 *    函数在定义前调用却能工作（函数声明提升）、同一段代码搬个位置就报错（TDZ）。
 *    把这两套规则搞清楚，才能准确预测一段代码到底会打出什么。
 *
 * 3. 核心语法要点 —— 四类声明的提升行为对照
 *    ┌──────────────────────┬────────────┬──────────────────┬──────────────────────┐
 *    │ 声明形式              │ 是否提升    │ 提升后能否读写     │ 声明前访问的结果       │
 *    ├──────────────────────┼────────────┼──────────────────┼──────────────────────┤
 *    │ var x                │ 是          │ 能读能写（undefined）│ undefined（不报错）   │
 *    │ let x / const x      │ 是（但未初始化）│ 不能           │ ReferenceError（TDZ）│
 *    │ function f() {}      │ 是（完整提升）│ 能，且能调用       │ 正常调用             │
 *    │ class C {}           │ 是（但未初始化）│ 不能           │ ReferenceError（TDZ）│
 *    │ function 表达式 / 箭头 │ 按 var/let/const 的规则 │ 同上        │ 同上                  │
 *    └──────────────────────┴────────────┴──────────────────┴──────────────────────┘
 *
 *    补充要点：
 *    （a）提升发生在**作用域级别**。函数内部声明的变量只提升到函数顶部，
 *        不会跑到函数外面去。
 *    （b）函数声明提升的优先级高于 var：同名时函数声明先占据这个名字。
 *        但随后的赋值会覆盖它。
 *    （c）TDZ 的边界是"块"。只要同一块里出现 let x，从块的第一个字符起就进入 TDZ。
 *    （d）typeof 对 TDZ 中的变量同样抛错，但对"从未声明"的变量安全返回 'undefined'。
 *    （e）函数参数默认值也有自己的 TDZ 规则（后面的参数不能引用后面的参数）。
 *
 * 4. 常见陷阱与注意事项
 *    - 依赖"函数声明提升"在文件顶部调用一堆函数，会让模块的依赖关系变得混乱。
 *      主流风格仍然建议：先定义、后使用。
 *    - `let x = x;` 是自引用，右边的 x 在 TDZ 中 → ReferenceError。
 *    - 在 if 块里用 var 声明后，即使那个分支没被执行，变量依然被提升为 undefined。
 *    - 循环里 `for (var i...)` 与 `for (let i...)` 的差异，本质就是"提升 + 作用域"
 *      两套规则共同作用的结果。
 *    - 用 new Function / eval 动态构造的代码也会有自己的提升规则；
 *      本文件用它们来隔离演示代码，保证本文件可以正常退出。
 *    - 记住实用结论：**不要依赖提升**。先声明、后使用，代码可读性最好。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 02_variables/04_hoisting_and_tdz.js
 *
 * 【预期输出】
 *   分节演示：var 提升成 undefined、函数声明完整提升、let/const/class 的 TDZ 报错、
 *   typeof 的行为差异、块内未执行分支的 var、以及提升与作用域的联合效果。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. var 提升：得到 undefined，不报错
// ---------------------------------------------------------------------------

console.log('--- 1. var 提升：声明提前，赋值不动 ---');

console.log('在声明前读取 var 变量：', hoistedVar, '（不是报错，是 undefined）');
var hoistedVar = '真正的赋值在这里';
console.log('赋值之后：', hoistedVar);

// 用 new Function 打印"引擎眼里的等价代码"，让提升这件事可视化。
const varDesugared = new Function(`
  // 引擎实际看到的顺序：
  var a;                        // ① 声明被提到函数体最顶部，自动 = undefined
  const firstRead = a;          // ② 此时读到 undefined
  a = 'assign';                 // ③ 赋值留在原来的书写位置
  return { firstRead, thenRead: a };
`);
console.log('提升后的等价形式：', varDesugared());

// 提升发生在"作用域级别"：函数内部的 var 只提升到函数顶部，不会跑到外面。
function scopedHoisting() {
  const before = typeof onlyInside; // 提升到本函数顶部 → 'undefined'
  var onlyInside = 'inside';
  return { before, after: onlyInside };
}
console.log('函数内部 hoisting：', scopedHoisting());
console.log('函数内的 var 不会泄漏到模块作用域：typeof onlyInside =', typeof onlyInside);
console.log('  这里 typeof 安全返回了字符串 "undefined"，因为模块作用域里从未声明过 onlyInside，');
console.log('  而 typeof 对「完全未声明」的标识符是安全的（对「TDZ 中」的则不安全，见第 4 节）。');

// ---------------------------------------------------------------------------
// 2. 函数声明提升：连函数体一起提升
// ---------------------------------------------------------------------------

console.log('\n--- 2. 函数声明被完整提升 ---');

// 函数声明可以在定义之前调用 —— 因为"函数对象"在解析阶段就被创建好了。
console.log('在定义之前调用函数声明：', declaredFunction());
function declaredFunction() {
  return '函数声明被完整提升，调用没问题';
}

// 但"函数表达式"只是把值赋给变量，遵循变量的提升规则：
// 用 var 时 → 提升为 undefined，调用会报 "is not a function"
const funcExprWithVar = new Function(`
  try {
    return earlyCall();
  } catch (err) {
    return err.constructor.name + '：' + err.message;
  }
  var earlyCall = function () { return 'hi'; };
`);
console.log('var + 函数表达式，提前调用 →', funcExprWithVar());

// 用 let/const 时 → 落入 TDZ，报 "Cannot access before initialization"
const funcExprWithLet = new Function(`
  try {
    return earlyCall();
  } catch (err) {
    return err.constructor.name + '：' + err.message;
  }
  const earlyCall = () => 'hi';
`);
console.log('const + 箭头函数，提前调用 →', funcExprWithLet());

// 函数声明与 var 同名时：函数声明先占位，var 的"声明部分"被忽略。
const sameName = new Function(`
  var result = typeof mixed;
  function mixed() { return 'function'; }
  var mixed;                       // 这条 var 声明被忽略（已有同名声明）
  return result + ' → 声明存在时，名字上是函数';
`);
console.log('函数声明 vs var 同名：', sameName());

// 但如果后面又赋值了，赋值会覆盖函数。
const overwritten = new Function(`
  function target() { return '我原本是函数'; }
  var target = '现在我是字符串';
  return typeof target + ' / 值：' + target;
`);
console.log('同名后再赋值：', overwritten());

// 函数声明在块里（非严格模式下）的行为是历史包袱，这里只做提示不做演示：
console.log('提示：在块语句里写函数声明（如 if 内）属于"块级函数声明"，');
console.log('      不同引擎的历史行为不一致，严格模式（含 ESM）下它会像 let 一样块级化。');

// ---------------------------------------------------------------------------
// 3. let / const / class：TDZ 的三种表现
// ---------------------------------------------------------------------------

console.log('\n--- 3. TDZ：let / const / class ---');

// （a）let 的 TDZ
try {
  // @ts-expect-error 故意制造错误以演示
  console.log(tdzLet);
  let tdzLet = 1;
} catch (err) {
  console.log('let 在声明前读取 →', err.constructor.name + '：' + err.message);
}

// （b）const 的 TDZ
try {
  // @ts-expect-error 故意制造错误以演示
  console.log(tdzConst);
  const tdzConst = 1;
} catch (err) {
  console.log('const 在声明前读取 →', err.constructor.name + '：' + err.message);
}

// （c）class 的 TDZ —— 很多人不知道类声明也有 TDZ
try {
  // @ts-expect-error 故意制造错误以演示
  console.log(new TdzClass());
  class TdzClass {
    constructor() {
      this.tag = 'class';
    }
  }
} catch (err) {
  console.log('class 在声明前使用 →', err.constructor.name + '：' + err.message);
}

// TDZ 内的**写入**同样会抛错（不只是读取）。
try {
  // @ts-expect-error 故意制造错误以演示
  tdzWrite = '试图提前赋值';
  let tdzWrite;
} catch (err) {
  console.log('在 let 声明前写入 →', err.constructor.name + '：' + err.message);
}

// TDZ 的边界是"块"：同一块里一出现 let，从块的第一行起就进入 TDZ。
let outerName = '外层名字';
{
  try {
    // @ts-expect-error 故意制造错误以演示
    console.log(outerName);
    let outerName = '内层名字'; // 这行让整个块都处于 TDZ（遮蔽了外层的同名变量）
  } catch (err) {
    console.log('内层声明遮蔽外层 →', err.constructor.name + '：' + err.message);
  }
}
console.log('外层的 outerName 未被影响：', outerName);

// TDZ 随块结束而结束；出了块就是"未声明"，typeof 又变回安全。
console.log('出了块之后，typeof outerName =', typeof outerName, '（外层那个仍在）');

// ---------------------------------------------------------------------------
// 4. typeof 的两种命运
// ---------------------------------------------------------------------------

console.log('\n--- 4. typeof 在 TDZ 与"未声明"之间的差异 ---');

// 情况一：完全未声明 → typeof 安全返回 'undefined'（这是它唯一"防错"的用处）
console.log("typeof 一个从未声明过的变量：", typeof completelyUnknown);
console.log('  这是唯一可以安全探测「它是否存在」的写法。');

// 情况二：在同一块里声明了 let，但还没执行到声明 → typeof 抛错
try {
  new Function("const t = typeof pending; let pending = 1; return t;")();
} catch (err) {
  console.log('typeof 一个处于 TDZ 的变量 →', err.constructor.name + '：' + err.message);
}
console.log('  所以"用 typeof 就安全了"是错觉：TDZ 面前 typeof 也救不了你。');

// ---------------------------------------------------------------------------
// 5. 提升 + 作用域 的联合效果：循环里的经典陷阱
// ---------------------------------------------------------------------------

console.log('\n--- 5. 提升与作用域联合作用 ---');

// for (var i...) 的 i 被提升到函数/模块顶部，且是**一个**变量：
// 循环中创建的所有闭包共享它，所以打印出的是最终值。
const varClosures = [];
for (var i = 0; i < 3; i++) {
  varClosures.push(() => i);
}
console.log('var 版闭包：', varClosures.map((fn) => fn()), '← 全部是 3');

// for (let i...) 的 i 是"每轮新建的绑定"，所以每个闭包各拿一份。
const letClosures = [];
for (let j = 0; j < 3; j++) {
  letClosures.push(() => j);
}
console.log('let 版闭包：', letClosures.map((fn) => fn()), '← 0 1 2');

// 循环结束后：var 的 i 依然存在（提升到函数作用域），let 的 j 已销毁。
console.log('循环结束后 var 的 i =', i, '（依然存在，因为它是函数级变量）');
try {
  // @ts-expect-error 故意制造错误以演示
  console.log('循环结束后 let 的 j =', j);
} catch (err) {
  console.log('循环结束后访问 let 的 j →', err.constructor.name + '：' + err.message);
}

// 分支未执行时，var 依然被提升（值仍是 undefined），而 let 完全不存在。
function neverExecuted(varIsHoisted) {
  if (varIsHoisted) {
    var createdOnlyHere = '只有在分支为真时才赋值';
  }
  // 即使分支为假，createdOnlyHere 也已存在，值为 undefined。
  return typeof createdOnlyHere + ' / 值：' + createdOnlyHere;
}
console.log('分支为假时的 var：', neverExecuted(false));
console.log('分支为真时的 var：', neverExecuted(true));

// ---------------------------------------------------------------------------
// 6. 实用建议
// ---------------------------------------------------------------------------

console.log('\n--- 6. 怎么避免踩这些坑 ---');

const advice = [
  '先声明后使用：不依赖任何提升行为，代码顺序即执行顺序。',
  '默认 const，需要重新赋值时用 let，不用 var —— 减少一半的坑。',
  '不要在函数内部用与外部同名的 let 去"遮蔽"（容易误读），换个名字更清楚。',
  '把长函数拆小：作用域越小，提升带来的意外越少。',
  '看到 undefined 时，第一反应先想"是不是提升了"，而不是"数据是不是没传进来"。',
];
for (const [index, text] of advice.entries()) {
  console.log('  ' + (index + 1) + '. ' + text);
}

// 一个"反例 → 正例"的对照：
// 反例（依赖提升，可读性差）：
//   console.log(compute()); function compute() { return 1; }
// 正例（顺序清晰）：
function compute() {
  return 1;
}
console.log('按"先定义后使用"的顺序书写：', compute());

console.log('\n--- 7. 小结 ---');
console.log('· var 提升 → 声明提前、自动 undefined；读写都不报错。');
console.log('· let/const/class 提升 → 声明提前但未初始化，处于 TDZ，读写都抛 ReferenceError。');
console.log('· function 声明完整提升，可以在定义前调用；函数表达式按变量规则处理。');
console.log('· typeof 对"未声明"安全，对"TDZ 中"仍抛错，不能当万能探测器用。');
console.log('· 最省心的策略：先声明后使用，默认 const，彻底不依赖提升。');
