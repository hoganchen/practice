/**
 * ============================================================================
 * 知识点：let —— 块级作用域、暂时性死区、不可重复声明
 * ============================================================================
 *
 * 【所属分类】02_variables —— 变量与作用域
 * 【难度等级】入门
 * 【前置知识】02_variables/01_var.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    let 是 ES2015（ES6）引入的变量声明方式，用来取代 var 中那些"设计失误"。
 *    它有三条与 var 正相反的核心特性：
 *    （a）**块级作用域**：let 的可见范围是"最近的一对花括号"，
 *        包括 if / for / while / switch / try 的块，以及裸块、函数体。
 *    （b）**暂时性死区（TDZ）**：从进入作用域到执行到声明语句之间，
 *        这个变量处于"存在但不可访问"的状态，访问它会抛 ReferenceError。
 *        也就是说 let **不会**在声明前给你 undefined，而是直接报错。
 *    （c）**不可重复声明**：同一作用域内 let 两次同名 → SyntaxError（解析期）。
 *
 * 2. 为什么需要 / 解决什么问题
 *    var 的三大问题（作用域泄漏、静默 undefined、重复声明覆盖）在大型代码里
 *    会造成非常难查的 bug。let 用"块级作用域 + TDZ + 禁止重复声明"三招，
 *    把这三种 bug 变成了"要么写不出来，要么立刻报错"。
 *    可以说 let 让 JS 的作用域规则终于和大多数主流语言对齐了。
 *
 * 3. 核心语法要点
 *    （1）块级作用域
 *          { let x = 1; }  x 只在这个块里存在。
 *          for (let i = 0; ...) 每次迭代都是一个**新的** i 绑定
 *          —— 这正是修复"循环闭包捕获同一个变量"的关键。
 *    （2）TDZ
 *          console.log(a); // ReferenceError: Cannot access 'a' before initialization
 *          let a = 1;
 *          TDZ 的范围：从块开始 到 声明语句执行完成为止。
 *    （3）typeof 在 TDZ 中也会抛错
 *          typeof a; let a = 1;  // 也抛 ReferenceError
 *          这与"对未声明的变量用 typeof 会安全返回 'undefined'"形成鲜明对比。
 *    （4）不可重复声明
 *          同一块里 let x; let x; → SyntaxError。
 *          但**外层再声明同名变量是允许的**（内层遮蔽外层），这属于遮蔽（shadowing）。
 *    （5）顶层 let 不会成为 globalThis 的属性，与 var 的行为不同。
 *    （6）let 声明的变量在初始化前不能被赋值，也不能被 delete。
 *
 * 4. 常见陷阱与注意事项
 *    - TDZ 是"作用域级别的"，不是"位置级别的"：只要在同一块里声明了 let x，
 *      这一整块里都不能在声明前使用它，即使外层有同名变量。
 *      经典场景：`let x = x;` 会抛 ReferenceError（右边的 x 处于 TDZ）。
 *    - switch 的各个 case 共享同一个块，所以在 case A 里 let x，
 *      在 case B 里再用 let x 会报错。解决：给每个 case 加花括号。
 *    - 函数参数与函数体：如果参数名与函数体内的 let 同名，也是 SyntaxError。
 *    - 声明了 let 但从不使用，同样是让代码难以理解的原因之一；
 *      用 const 表达"不打算重新赋值"的意图更好。
 *    - for 循环里的 let 有"每次迭代新建绑定"的特殊语义，这是规范特例，
 *      不要误以为"块级作用域"在所有场景下都自动帮你复制变量。
 *    - 本文件里所有会抛错的演示都包在 try/catch 中，保证文件可正常退出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 02_variables/02_let.js
 *
 * 【预期输出】
 *   分节演示：块级作用域如何阻止变量泄漏、TDZ 抛错的具体信息、
 *   重复声明的 SyntaxError、for 循环每次迭代的新绑定、遮蔽现象、
 *   以及顶层 let 与 var 的区别。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 块级作用域：花括号就是边界
// ---------------------------------------------------------------------------

console.log('--- 1. 块级作用域 ---');

{
  let inBlock = '我只在这个花括号里存在';
  const alsoInBlock = 'const 同理';
  console.log('块内部访问：', inBlock, '/', alsoInBlock);
}
// 出了块就访问不到了 —— 下面这行如果取消注释会抛 ReferenceError：
//   console.log(inBlock);

// 用 try/catch 把它演示出来：
try {
  // @ts-expect-error 故意制造错误以演示
  console.log(inBlock);
} catch (err) {
  console.log('出了块再访问 →', err.constructor.name + '：' + err.message);
}

// if 的块、for 的块都是边界。
if (true) {
  let insideIf = 'if 里的 let';
  console.log('if 内部：', insideIf);
}
try {
  // @ts-expect-error 故意制造错误以演示
  console.log(insideIf);
} catch (err) {
  console.log('出了 if 再访问 →', err.constructor.name + '：' + err.message);
}

// 对照 var：var 会泄漏出来。
function varCompare() {
  if (true) {
    var leaked = 'var 泄漏了';
  }
  return leaked; // var 版本能拿到，let 版本会抛错
}
console.log('对照 var：', varCompare());

// ---------------------------------------------------------------------------
// 2. 暂时性死区（TDZ）
// ---------------------------------------------------------------------------

console.log('\n--- 2. 暂时性死区（TDZ） ---');

// TDZ 的定义：从进入作用域开始，到声明语句被执行为止，
// 这段时间里变量处于"未初始化"状态，读取或写入都会抛 ReferenceError。
try {
  // @ts-expect-error 故意制造错误以演示
  console.log(tdzVariable);
  let tdzVariable = 'TDZ 结束后才能访问';
} catch (err) {
  console.log('在 let 声明前读取 →', err.constructor.name + '：' + err.message);
}

// 关键在于：TDZ 是"作用域级别"的，一旦该块里声明了 let x，
// 整块的最开头就已经处于 TDZ，而不会去外层找同名变量。
let shadowedAtTop = '外层的值';
{
  try {
    // @ts-expect-error 故意制造错误以演示
    console.log(shadowedAtTop);
    let shadowedAtTop = '内层的值'; // 这一行让上面的访问落入 TDZ
  } catch (err) {
    console.log('内层声明遮蔽外层时访问 →', err.constructor.name + '：' + err.message);
  }
}
console.log('外层变量本身没受影响：', shadowedAtTop);

// 经典自引用错误：let x = x;
try {
  // @ts-expect-error 故意制造错误以演示
  let selfRef = selfRef;
  console.log('selfRef =', selfRef);
} catch (err) {
  console.log('let x = x 的形式 →', err.constructor.name + '：' + err.message);
  console.log('  原因：等号右边求值时，左边的 selfRef 还在 TDZ 里。');
}

// 对比 var 的行为：var 不会进入 TDZ，而是提前给你一个 undefined。
function varNoTdz() {
  const before = typeof varValue; // var 版不抛错
  var varValue = 1;
  return before;
}
console.log('对照 var：在声明前 typeof 得到的是', varNoTdz(), '（var 不抛错，只给 undefined）');

// TDZ 还有一个容易被忽略的细节：typeof 在 TDZ 里也救不了你。
try {
  new Function("typeof notYetDeclared; let notYetDeclared = 1;")();
} catch (err) {
  console.log('TDZ 中对变量用 typeof →', err.constructor.name + '：' + err.message);
}
console.log('对照：对"完全未声明"的变量用 typeof 是安全的 →', typeof neverEverDeclared);

// ---------------------------------------------------------------------------
// 3. 不可重复声明
// ---------------------------------------------------------------------------

console.log('\n--- 3. 同一作用域内不可重复声明 ---');

try {
  new Function('let dup = 1; let dup = 2;');
} catch (err) {
  console.log('let 重复声明 →', err.constructor.name + '：' + err.message);
}

try {
  new Function('let mixed = 1; var mixed = 2;');
} catch (err) {
  console.log('let 与 var 混用同名 →', err.constructor.name + '：' + err.message);
}

// 但"内层作用域再声明同名变量"是允许的，这叫遮蔽（shadowing）。
let shadowTarget = '外层';
{
  let shadowTarget = '内层'; // 合法：这是另一个变量
  console.log('内层的 shadowTarget：', shadowTarget);
}
console.log('外层的 shadowTarget：', shadowTarget);

// 函数参数与函数体内 let 同名 → SyntaxError。
try {
  new Function('function f(value) { let value = 2; return value; }');
} catch (err) {
  console.log('参数名与函数体内 let 同名 →', err.constructor.name + '：' + err.message);
}

// switch 的坑：所有 case 共享同一个块。
try {
  new Function(`
    function f(n) {
      switch (n) {
        case 1:
          let result = 'one';
          return result;
        case 2:
          let result = 'two';   // ← 与上面同一个块，重复声明
          return result;
      }
    }
  `);
} catch (err) {
  console.log('switch 各 case 里重复 let →', err.constructor.name + '：' + err.message);
}
console.log('  修复方法：给每个 case 加一对花括号 { }，让它们各自形成独立的块。');

// ---------------------------------------------------------------------------
// 4. for 循环：每次迭代都是一个新绑定
// ---------------------------------------------------------------------------

console.log('\n--- 4. for 循环里的 let ---');

// 这是 let 最有价值的特性之一：每次循环迭代都会为循环变量创建一个**新的绑定**。
// 于是每个闭包捕获的都是自己那一轮的 i，不再互相干扰。
const handlers = [];
for (let i = 0; i < 3; i++) {
  handlers.push(() => i);
}
console.log('闭包捕获的 i：', handlers.map((fn) => fn()), '（每个闭包各有一份）');

// 循环内的 let 变量同样每轮新建。
const innerHandlers = [];
for (let i = 0; i < 3; i++) {
  let doubled = i * 2; // 每轮都是新的 doubled
  innerHandlers.push(() => doubled);
}
console.log('循环体内 let 变量：', innerHandlers.map((fn) => fn()));

// 循环变量在循环外不存在（与 var 的关键差别）。
try {
  // @ts-expect-error 故意制造错误以演示
  console.log('循环结束后访问 i：', i);
} catch (err) {
  console.log('循环结束后访问 i →', err.constructor.name + '：' + err.message);
}

// 规范细节：for (let i = ...) 的语义其实是"每轮开始时把上一轮的值复制给新的 i"，
// 但因为 for 语句末尾还有一次 i++ 写回，所以行为上等同于"每轮独立"。
// 用 for...of 观察会更清楚：
const ofHandlers = [];
for (const item of ['a', 'b', 'c']) {
  ofHandlers.push(() => item);
}
console.log('for...of + const：', ofHandlers.map((fn) => fn()), '（每轮都是新的 const 绑定）');

// ---------------------------------------------------------------------------
// 5. 顶层 let 与 var 的区别
// ---------------------------------------------------------------------------

console.log('\n--- 5. 模块顶层：let 与 var 的区别 ---');

// 本文件是 ESM 模块，模块有自己的作用域，所以顶层的 var 和 let 都**不会**
// 变成 globalThis 的属性。这一点与"普通 <script> 里的顶层声明"不同 ——
// 在浏览器普通脚本里，顶层 var 会成为 window 的属性，顶层 let 不会。
var topLevelVar = 'var';
let topLevelLet = 'let';
console.log('globalThis.topLevelVar：', globalThis.topLevelVar, '（模块作用域下 var 也不上全局）');
console.log('globalThis.topLevelLet：', globalThis.topLevelLet);
console.log('但两者都能在本模块内正常访问：', topLevelVar, '/', topLevelLet);
console.log('（关于浏览器普通脚本里的差异，见 02_variables/06_global_variables.js）');

// ---------------------------------------------------------------------------
// 6. let 与 const 的取舍
// ---------------------------------------------------------------------------

console.log('\n--- 6. let 还是 const？ ---');

// let 表达"这个变量会被重新赋值"。如果不会，就应该用 const ——
// 这样读代码的人一眼就知道"这里不会再变"。
let retryCount = 0;
retryCount += 1; // 明确需要重新赋值 → 用 let 合理
console.log('需要重新赋值的变量用 let：retryCount =', retryCount);

const fixedList = [1, 2, 3]; // 不做整体重新赋值 → 用 const 更好
fixedList.push(4); // 注意：const 只锁定"绑定"，不冻结内容，push 是允许的
console.log('不需要重新赋值的用 const：fixedList =', fixedList);

// 一个实用建议：先用 const 写，等到真的报错了再改成 let。
// 这样能保证每个 let 都是"必须的"，而不是"习惯性的"。
console.log('建议：默认写 const，确实需要重新赋值时才改成 let。');

console.log('\n--- 7. 小结 ---');
console.log('· let 是块级作用域：{ } / if / for / switch 都是边界。');
console.log('· let 有 TDZ：声明前访问直接 ReferenceError，连 typeof 也不例外。');
console.log('· let 不可重复声明：同一块里重复 → SyntaxError；跨作用域同名是遮蔽，允许。');
console.log('· for (let i...) 每轮新建绑定，从根上修掉了 var 的闭包共享陷阱。');
console.log('· 默认用 const，需要重新赋值再用 let，尽量不用 var。');
