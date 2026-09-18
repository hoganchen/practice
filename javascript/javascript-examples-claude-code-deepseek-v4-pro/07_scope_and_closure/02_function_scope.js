/**
 * ============================================================================
 * 知识点：函数作用域、局部变量
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】入门
 * 【前置知识】07_scope_and_closure/01_global_scope.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    函数作用域指的是：在函数内部声明的变量（含形参），只在这个函数的
 *    内部可见，函数外部访问不到。这些变量就叫"局部变量"。
 *    JS 在 ES6 之前只有两种作用域：全局作用域 和 函数作用域
 *    （块级作用域是 ES6 才有的，见下一个示例）。
 *
 * 2. 为什么需要
 *    函数作用域是"封装"的最小单位：
 *      - 函数内部的临时变量不会泄漏到外面，不会和别的代码撞名字；
 *      - 每次函数调用都会创建一套全新的局部变量，互不干扰
 *        （这正是递归能正常工作的前提——每一层递归有自己的 n）；
 *      - 局部变量在函数执行完后即可回收，比全局变量省内存。
 *
 * 3. 核心语法要点
 *    (1) 函数内部用 var / let / const / function 声明的一切，都只属于该函数。
 *    (2) 形参也是局部变量，作用范围就是函数体。
 *    (3) 内层函数可以访问外层的变量（沿作用域链向外找），
 *        外层函数不能访问内层的变量。
 *    (4) 每次调用都创建一套新的局部变量 —— 同名变量在不同调用之间毫无关系。
 *    (5) var 的"函数作用域"很特殊：它在函数内、块外依然可见
 *        （也就是 var 不认 {} 块），但依然出不了函数。
 *
 * 4. 常见陷阱
 *    - 以为 var 写在 if / for 的 {} 里就只能在块内用（其实整个函数都能用）。
 *    - 在函数内声明了和外层同名的变量，以为改的是外层那个（其实是遮蔽）。
 *    - 误以为"函数执行完局部变量立即消失"，然后依赖它不存在
 *      （闭包会让它活下去，见后面的闭包示例）。
 *    - 用函数名当变量名（函数声明本身也占据函数作用域）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 07_scope_and_closure/02_function_scope.js
 *
 * 【预期输出】
 *   演示局部变量的可见范围、形参的局部性、内层访问外层、
 *   每次调用独立、以及 var 的函数作用域特性。
 * ============================================================================
 */

console.log('--- 1. 局部变量：函数外面拿不到 ---');

function withLocal() {
  // 这三个都是局部变量，只属于 withLocal 这次调用。
  var localVar = '我是局部 var';
  let localLet = '我是局部 let';
  const localConst = '我是局部 const';
  function localFn() {
    return '我是局部函数';
  }
  return { localVar, localLet, localConst, localFn: localFn() };
}

console.log('  函数内部使用它们 →', withLocal());
console.log('  函数外部 typeof localVar   →', typeof localVar);
console.log('  函数外部 typeof localLet   →', typeof localLet);
console.log('  函数外部 typeof localConst →', typeof localConst);
console.log('  函数外部 typeof localFn    →', typeof localFn);
console.log('  结论：局部变量的"生命"只存在于函数作用域内，外部连名字都不存在。');

console.log('--- 2. 形参也是局部变量 ---');

function greet(name) {
  // 形参 name 就是一个局部变量，可以在函数体里随意读写。
  const original = name;
  name = name.toUpperCase(); // 改的是这份局部副本，不影响调用方
  return `收到 ${original}，转为大写 ${name}`;
}
const callerValue = 'alice';
console.log(' ', greet(callerValue));
console.log('  调用方的变量变了吗？callerValue =', callerValue, '（没变）');
console.log('  函数外部 typeof name →', typeof name, '（形参在外面不存在）');

console.log('--- 3. 内层可以访问外层，外层访问不到内层 ---');

const moduleLevel = '模块层的变量';

function outer() {
  // outer 的局部变量
  const outerLocal = 'outer 的局部变量';

  function inner() {
    // 只属于 inner 的局部变量
    const innerLocal = 'inner 的局部变量';
    // 内层函数可以访问：自己的变量 → 外层的变量 → 模块顶层的变量 → 全局
    console.log('  内层访问自己的变量   →', innerLocal);
    console.log('  内层访问外层的变量   →', outerLocal);
    console.log('  内层访问模块层的变量 →', moduleLevel);
  }

  inner();
  // 外层访问内层：不行，innerLocal 是 inner 的局部变量。
  console.log('  外层 typeof innerLocal →', typeof innerLocal, '（拿不到）');
}
outer();
console.log('  模块层 typeof outerLocal →', typeof outerLocal, '（每个函数只对自己内部负责）');

console.log('--- 4. 每次调用都是一套全新的局部变量 ---');

// 用一个"打印并自增"的函数来证明：每次调用的 count 都是新的。
function freshCounter() {
  let count = 0; // 每次调用都会重新执行这一行，创建一份新的 count
  count += 1;
  return `本次调用的 count = ${count}`;
}
console.log('  第 1 次调用 →', freshCounter());
console.log('  第 2 次调用 →', freshCounter());
console.log('  第 3 次调用 →', freshCounter());
console.log('  结论：局部变量的"状态"不跨调用保留 —— 想保留就要用闭包（后面的示例）。');

// 递归能工作的前提也在这里：每一层调用有自己的 n。
function factorial(n) {
  if (n <= 1) return 1;
  // 每层递归的 n 都是独立的局部变量，互不干扰。
  return n * factorial(n - 1);
}
console.log('  factorial(5) →', factorial(5), '（五层调用各有各的 n）');

console.log('--- 5. var 的"函数作用域"特性：不认块，但认函数 ---');

function varScopeDemo() {
  if (true) {
    // var 声明在块里，但它属于整个函数。
    var fromBlock = '我在 if 块里用 var 声明';
    let fromBlockLet = '我在 if 块里用 let 声明';
    console.log('  块内访问 var  →', fromBlock);
    console.log('  块内访问 let  →', fromBlockLet);
  }
  // 块外依然能访问 var —— 这就是 var 最反直觉的地方。
  console.log('  块外访问 var  →', fromBlock, '  ← 竟然还能用！');
  console.log('  块外访问 let  →', typeof fromBlockLet, '（let 有块级作用域）');

  for (var i = 0; i < 3; i++) {
    // 循环体里的 var 同样属于函数。
  }
  console.log('  for 循环结束后 i →', i, '（var 的 i 泄漏到了整个函数）');
}
varScopeDemo();
console.log('  函数外 typeof fromBlock →', typeof fromBlock, '（var 终究出不了函数）');

console.log('--- 6. 遮蔽（shadowing）：内外同名变量 ---');

const color = '外层的蓝色';

function shadowExample() {
  // 这行声明创建了一个"新的"局部变量，把外层的 color 遮住了。
  const color = '内层的红色';
  return `函数内部看到的是：${color}`;
}
console.log(' ', shadowExample());
console.log('  函数外部看到的还是：', color, '（内外是两个完全不同的变量）');

// 一个更隐蔽的遮蔽：内层声明在"使用之后"，由于 let 的 TDZ，会直接报错。
const level = '模块层的 level';
function tdzShadow() {
  try {
    // 这一行看似能读到模块层的 level（值就在外面），
    // 但因为函数体后面写了 `let level`，整个函数体里的 level 都指向那个局部变量，
    // 而此刻它还没初始化 —— 于是抛 ReferenceError，而不是去外层找。
    return level;
  } catch (err) {
    console.log('  遮蔽 + TDZ → 报错', err.constructor.name, ':', err.message);
  }
  // 真正的局部声明写在使用之后（合法语法，但行为如上）。
  let level = '函数内部的 level';
  return `函数最后返回 ${level}`;
}
console.log(' ', tdzShadow());
console.log('  提醒：函数内只要声明了同名变量，整个函数体内它都会遮蔽外层——这是高频踩坑点。');

console.log('--- 7. 局部变量的释放：函数执行完就"没人引用"了 ---');

function makeBigTemp() {
  // 这个数组在函数执行期间一直存在。
  const bigArray = new Array(1000).fill('临时数据');
  return `本次调用创建了 ${bigArray.length} 条临时数据，函数返回后它们就可以被回收`;
}
console.log(' ', makeBigTemp());
console.log('  ↑ 函数返回时，bigArray 不再被任何地方引用，垃圾回收器可以回收它。');
console.log('  但注意：如果存在闭包引用了它，它就会一直活下去 —— 详见 10_closure_memory.js。');

console.log('--- 8. 小结 ---');
console.log('  函数作用域 = 函数内部的一切都是"私有的"，外部只看得到返回值。');
console.log('  好处：不污染外部、每次调用状态独立、用完即可回收。');
console.log('  var 的坑：它属于函数而不是块，块内的 var 会"泄漏"到整个函数。');
console.log('  下一步：ES6 的块级作用域（let/const）把作用域的粒度从"函数"细化到了"任意 {} 块"。');
