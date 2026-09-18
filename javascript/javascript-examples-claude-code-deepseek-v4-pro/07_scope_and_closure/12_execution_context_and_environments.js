/**
 * ============================================================================
 * 知识点：执行上下文（Execution Context）与词法环境 / 变量环境
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】高级
 * 【前置知识】07_scope_and_closure/04_scope_chain.js、07_scope_and_closure/06_closure_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么 —— 一个把前面几章串起来的「底层模型」
 *    执行上下文（Execution Context）是规范用来描述「一段代码正在什么环境里跑」的数据结构。
 *    关键结论只有一句：**每调用一次函数，就创建一个新的执行上下文；函数返回，这个上下文就被弹出。**
 *    一个执行上下文由四样东西组成：
 *      · LexicalEnvironment  （词法环境）—— 查找标识符时**当前所处的**那一层环境记录
 *      · VariableEnvironment （变量环境）—— 登记 var 声明与函数声明的环境记录
 *      · ThisBinding         —— 本次调用里 this 指向谁（详见 15_this_and_context）
 *      · [[OuterEnv]] 引用    —— 指向上层环境记录，把各层串成「作用域链」
 *    而「环境记录（Environment Record）」就是真正存变量的容器，它是一张
 *    「名字 → 值」的表，分好几种类型（声明式 / 对象式 / 函数式 / 模块式 …）。
 *    内存里其实没有「作用域」这个对象，**作用域 = 环境记录 + 它的外层引用**。
 *
 * 2. 为什么需要 —— 它是「散装知识」的粘合剂
 *    本目录前面 11 个文件把「作用域链查找」「块级作用域」「闭包」都讲透了，
 *    02_variables 讲了提升与 TDZ，15_this_and_context 讲了 this，06/10 章讲了调用栈，
 *    但**没有任何一处解释这些现象背后的同一个模型**。补上这一层之后：
 *      · 为什么 var 不受块限制而 let/const 受？—— 因为它们被登记进**不同的环境记录**
 *        （var → 函数级的 VariableEnvironment；let/const → 块级的声明式环境记录）；
 *      · 为什么会有 TDZ？—— 因为进入块时**环境记录已经建好**，块内的 let/const
 *        已在表里登记但**尚未初始化**，读到它就是「表里有这个名字、但值还没放进去」；
 *      · 闭包到底是什么？—— 内层函数持有外层**环境记录对象本身的引用**（不是值的拷贝）；
 *      · this 从哪来？—— 它是执行上下文的一个字段，由**调用方式**决定；
 *      · 递归为什么爆栈？—— 每一层调用都压入一个执行上下文，栈有上限。
 *    一句话：把这一节读懂，前面几章的知识点就从「散装」变成「同一台机器的不同零件」。
 *
 * 3. 核心语法要点
 *    (1) 执行上下文的类型：全局执行上下文、函数执行上下文、模块执行上下文、
 *        以及 eval 执行上下文。全局的只有一个（进程级），函数的每次调用各一个。
 *    (2) 环境记录（Environment Record）是**记录**不是「对象」，它负责把标识符绑定到值：
 *        · 声明式环境记录（Declarative）：let/const/class、catch 参数、块 —— 存在内部的
 *          绑定表里，**不会**变成任何对象的属性，所以外部（例如 globalThis）看不到它们；
 *        · 对象式环境记录（Object）：用「某个对象的属性」当绑定表，最典型的就是
 *          **全局对象**，以及（历史遗留的）with 语句；
 *        · 函数式环境记录（Function）：函数调用时创建，**多带一个 this 绑定**
 *          和 new.target，外层是函数的 [[Environment]]；
 *        · 模块式环境记录（Module）：模块顶层，登记 import 绑定与顶层 var/let/function；
 *        · 全局环境记录（Global）：由「对象式（globalThis 的属性）」+
 *          「声明式（顶层 let/const）」两部分**组合**而成。
 *    (3) var 与 let/const 分属不同记录，这是本节的**核心事实**：
 *        函数执行上下文中 → VariableEnvironment 与 LexicalEnvironment 都指向函数环境记录；
 *        随后进入函数体这个「块」，如果它含 let/const/class，就**再套一层**声明式环境记录。
 *        于是同一层花括号里，`var x` 住在旧的（函数级）记录，`let y` 住在新套的那层，
 *        两者被登记的时间不同 → 一个调用开始就可用（undefined），一个要等声明语句执行。
 *    (4) 块级环境的「链式」建立：每进入一个块就压入一层新的声明式环境记录，
 *        离开块就弹出。这解释了「块内可访问块外，块外不能访问块内」。
 *    (5) 闭包：内层函数对象内部有一个 [[Environment]] 槽，指向它**定义时**所在的环境记录。
 *        外层函数返回后，被引用到的环境记录不会被销毁 —— 它从「栈上的调用上下文」
 *        变成了「堆上被函数引用着的对象」。
 *
 * 4. 常见陷阱
 *    - 把「作用域」当成一个真实存在的对象去理解 —— 它是「环境记录 + 外层引用」的链。
 *    - 以为 var 提升是「把代码挪到顶部」。真相是：**进入函数时，
 *      VariableEnvironment 里就已经为 var 名字建好了绑定，初值 undefined**，一行代码都没挪。
 *    - 以为 let 不提升。真相是：let 同样被登记了，只是**登记时是未初始化状态**（TDZ）。
 *      本节第 5 节的实验会证明：内层块的 let 甚至能**遮蔽**外层同名变量，
 *      说明名字在进入块的那一刻就已经在表里了。
 *    - 以为闭包捕获的是「值」。真相：捕获的是**环境记录这个容器**，所以外层后续修改变量，
 *      闭包看到的是新值（见第 7 节实验）。
 *    - 以为全局作用域只有一层。全局环境记录其实是「对象式 + 声明式」两层粘在一起：
 *      所以顶层 `var` 会出现在 globalThis 上，顶层 `let` 不会。
 *    - 在 ES 模块里期待 `this` 是 globalThis。模块执行上下文里 this 是 **undefined**。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 07_scope_and_closure/12_execution_context_and_environments.js
 *
 * 【预期输出】
 *   用 8 组可运行的实验，逐条验证上面的结论：
 *   调用栈帧数量随嵌套层数 +1；var 与 let 在全局层的「落点」不同；
 *   同一花括号里 var 与 let 表现迥异；内层块的 let 遮蔽外层同名变量并触发 TDZ；
 *   每次调用新建一套环境记录；两个闭包共享同一个环境记录；
 *   模块执行上下文与全局脚本执行上下文的差异。全程退出码 0，一秒内跑完。
 * ============================================================================
 */

// node:vm 用来在本进程里造一个真实的「全局脚本执行上下文」（完全离线，不联网）。
// 它是本文件唯一的外部依赖，且是 Node 内置模块。
import vm from 'node:vm';

// ---------------------------------------------------------------------------
// 0. 准备：一个用来「数栈帧」的小工具
// ---------------------------------------------------------------------------

// 规范里的「执行上下文栈」在 V8 里就是调用栈。new Error().stack 会打印当前栈帧，
// 每多一层函数调用就多一行 —— 这正是「一次调用 = 一个上下文」的可见证据。
// 注意：stack 里还含有 Node 内部帧（ModuleJob.run 等），所以绝对值没意义，
// 我们只看**相邻两层之间的差值**（恒为 1）。
function countStackFrames() {
  return new Error('probe').stack
    .split('\n')
    .filter((line) => line.trim().startsWith('at ')).length;
}

console.log('--- 1. 一次函数调用 = 一个执行上下文（用栈帧数量证明）---');

// 模块顶层本身就在一个执行上下文里（模块执行上下文），先量出基线。
const framesAtModuleTop = countStackFrames();
console.log('  模块顶层的栈帧数（基线）=', framesAtModuleTop);

function level1() {
  return countStackFrames();
}

function level2() {
  // 多调用了一层 level1，所以这里应当比模块顶层多 2 帧：level2 自己 + level1。
  return level1();
}

function level3() {
  return level2();
}

const framesAtLevel1 = level1();
const framesAtLevel2 = level2();
const framesAtLevel3 = level3();
console.log('  调用 level1() 后的栈帧数 =', framesAtLevel1, '（比基线 +' + (framesAtLevel1 - framesAtModuleTop) + '）');
console.log('  调用 level2() 后的栈帧数 =', framesAtLevel2, '（比基线 +' + (framesAtLevel2 - framesAtModuleTop) + '）');
console.log('  调用 level3() 后的栈帧数 =', framesAtLevel3, '（比基线 +' + (framesAtLevel3 - framesAtModuleTop) + '）');
console.log('  结论：每深入一层函数调用，栈上就多压入一个执行上下文；');
console.log('        函数返回时它被弹出（所以上面的数字在各自返回后立刻回落到基线）。');
console.log('        递归太深会报 RangeError: Maximum call stack size exceeded —— 就是栈被压满了。');

// ---------------------------------------------------------------------------
// 2. 一个执行上下文的四个组成部分
// ---------------------------------------------------------------------------

console.log('--- 2. 执行上下文的组成：LexicalEnvironment / VariableEnvironment / ThisBinding / outer ---');

// 规范里的结构（用伪代码的方式呈现，方便对照记忆）：
const contextShape = {
  // ① 词法环境：当前查找标识符所处的环境记录。函数体内部的块会把新的记录挂在这里。
  LexicalEnvironment: '当前环境记录（含块级 let/const/class）',
  // ② 变量环境：登记 var 声明与函数声明的环境记录。函数级，块管不着它。
  VariableEnvironment: '函数级环境记录（含 var 与函数声明）',
  // ③ this 绑定：本次调用的 this 值（由调用方式决定，见 15_this_and_context）。
  ThisBinding: '本次调用的 this（普通调用是 undefined，对象方法调用是那个对象）',
  // ④ 外层引用：指向定义时所在的环境记录，作用域链就是靠它串起来的。
  OuterReference: '[[OuterEnv]] —— 指向定义时所在的环境记录',
  // ⑤ 函数型上下文还带一个 new.target，用来区分「被 new 调用」还是普通调用。
  NewTarget: '函数上下文独有：new.target（普通调用是 undefined）',
};
console.log('  一个执行上下文的字段：');
for (const [key, desc] of Object.entries(contextShape)) {
  console.log(`    · ${key}：${desc}`);
}

// 用一段普通函数把「上下文里的 this」和「环境记录里的变量」同时体现出来。
function showContext(localArg) {
  // 本函数被调用时，引擎先创建一个新的函数执行上下文：
  //   · LexicalEnvironment / VariableEnvironment 都指向新建的函数环境记录；
  //   · 这个记录的 outer 指向 showContext 的 [[Environment]]（也就是模块环境记录）；
  //   · ThisBinding 按「调用方式」决定 —— 这里是普通调用，ESM 又是严格模式，所以是 undefined。
  // 局部变量、形参都登记在这层新的环境记录里，每次调用互不干扰。
  const localVar = `我住在本次调用的环境记录里（收到参数 ${localArg}）`;
  return { localVar, thisValue: this };
}
const contextProbe = showContext('A');
console.log('  showContext("A") 的局部变量 →', contextProbe.localVar);
console.log('  showContext("A") 里的 this →', contextProbe.thisValue, '（ESM 是严格模式，普通调用故为 undefined）');
console.log('  ^ this 是上下文的一个字段，不是环境记录里的变量，所以它不在作用域链上。');

// ---------------------------------------------------------------------------
// 3. 环境记录的类型：声明式 vs 对象式（用 node:vm 造一个真实的「全局对象」）
// ---------------------------------------------------------------------------

// 要观察「对象式环境记录」，最干净的办法是造一个真实的全局脚本环境。
// node:vm 的 runInContext 跑的是**脚本（script）**而不是模块，
// 在脚本顶层：var / 函数声明 → 挂到全局对象上（对象式记录）；
//            let / const     → 存进全局环境的声明式记录（globalThis 上看不到）。

console.log('--- 3. 环境记录的两大类型：声明式 vs 对象式 ---');

const scriptContext = vm.createContext({});
vm.runInContext('var scriptVar = 1; let scriptLet = 2; function scriptFn() {}', scriptContext);

console.log('  在全局脚本里声明了 var scriptVar、let scriptLet、function scriptFn：');
console.log('    globalThis 上能看到的自有属性 →', JSON.stringify(Object.keys(scriptContext)));
console.log('      ^ 只有 scriptVar 与 scriptFn —— 它们走的是**对象式环境记录**（就是全局对象的属性）。');
console.log('    scriptLet 在 globalThis 上是自有属性吗？', vm.runInContext("Object.hasOwn(globalThis, 'scriptLet')", scriptContext));
console.log('      ^ let 走的是**声明式环境记录**，它只存在于内部绑定表，不落到任何对象上。');
console.log('    但脚本内部依然读得到 scriptLet →', vm.runInContext('scriptLet', scriptContext));
console.log('  结论：全局环境记录 = 对象式记录（globalThis 属性）+ 声明式记录（顶层 let/const），');
console.log('        查找时先查声明式、再查对象式，两者共同构成「最外层作用域」。');

// 对象式记录的另一个可见后果：能不能被 delete。
// var 声明的全局是不可配置属性（删不掉），隐式赋值产生的全局是可配置的（删得掉）。
console.log('  同是「全局变量」，可删除性却不同（这正是「谁在对象式记录里」的直接体现）：');
console.log("    var 声明的全局，delete gv →", vm.runInContext('var gv = 1; delete gv;', scriptContext), '（不可配置）');
console.log('    隐式赋值产生的全局，delete imp →', vm.runInContext('imp = 1; delete imp;', scriptContext), '（可配置）');
console.log("      删完之后 typeof imp →", vm.runInContext('typeof imp', scriptContext), '（真的没了）');

// with 语句是对象式环境的另一个实例（只在非严格模式可用，所以用 new Function 造）。
// 它会把传入对象的属性「插入」到作用域链的最前端 —— 这正是对象式记录的定义。
const withDemo = new Function(
  'obj',
  'with (obj) { return a + b; }', // 非严格模式下，with 内的 a / b 直接取自 obj 的属性
);
console.log('  with 语句（对象式记录的活例子）：');
console.log('    withDemo({ a: 1, b: 2 }) →', withDemo({ a: 1, b: 2 }));
console.log('    ^ 自由变量 a / b 本不在任何环境记录里，是 with 把 obj 的属性变成了环境记录。');
console.log('      这解释了两件事：① 为什么 with 里的查找会变慢（属性查找多了，且无法静态分析）；');
console.log('      ② 为什么严格模式（含本仓库这种 ESM）**禁止** with —— 它让作用域变成运行时才确定。');

// ---------------------------------------------------------------------------
// 4. 核心实验一：为什么 var 不受块限制，而 let/const 受？
// ---------------------------------------------------------------------------

console.log('--- 4. 核心实验：var 与 let 住的「记录」不一样 ---');

// 同花括号里，两个声明走两个不同的环境记录。请对照输出逐行看。
{
  // 这一对花括号是一个块 → 进入时压入一层新的**声明式环境记录**。
  // 块里的 let 登记在这层新记录上；块里的 var 则登记到函数/模块级的 VariableEnvironment 上。
  var fromVar = '块里的 var（登记在函数级/模块级记录）';
  let fromLet = '块里的 let（登记在块级记录）';
  console.log('  块内读 var →', fromVar);
  console.log('  块内读 let →', fromLet);
}
// 出块：块级记录被弹出。所以 let 不见了，var 还在。
console.log('  块外读 typeof fromVar →', typeof fromVar, ' ← var 无视块，因为它压根没登记在块级记录里');
console.log('  块外读 typeof fromLet →', typeof fromLet, ' ← let 登记在块级记录里，记录弹出了，名字就没了');

// 更进一步：用「登记时机」来证明它们在两张不同的表里。
function registrationTiming() {
  // 函数被调用的那一刻，VariableEnvironment 里已经有 argVar 这个名字了，值为 undefined。
  // 而 let 声明登记在函数体这层块级记录上，登记时是**未初始化**状态。
  console.log('    读 var 声明的 argVar →', typeof argVar, '（已登记，值为 undefined，不报错）');
  try {
    // 注意：typeof 对「从未声明」的标识符是安全的，但对「TDZ 中」的会抛错 ——
    // 所以这个 ReferenceError 恰好证明了 let 名字**已经存在**，只是还没初始化。
    console.log('    读 let 声明的 argLet →', typeof argLet);
  } catch (err) {
    console.log('    读 let 声明的 argLet → 抛错', err.constructor.name, ':', err.message);
  }
  var argVar = 'var 的值';
  let argLet = 'let 的值';
  return `    声明语句执行完之后：argVar=${argVar}，argLet=${argLet}`;
}
console.log('  同一函数体里，两个 var/let 名字的「登记时机」不同：');
console.log(registrationTiming());
console.log('  ^ 如果 var 与 let 在同一张表里，它们的行为不可能一个 undefined、一个抛错。');
console.log('    「提升」不是把代码挪到顶部，而是「进入作用域时就往 VariableEnvironment 里登记好名字」。');

// ---------------------------------------------------------------------------
// 5. 核心实验二：块级环境的链式建立 → 这才能解释 TDZ
// ---------------------------------------------------------------------------

console.log('--- 5. 块级环境是「一层套一层」的链：内层 let 会遮蔽外层同名变量 ---');

// 这是本文件最关键的一个实验：
// 内层块里有一句 `let shadowed = ...`，于是**进入块的那一刻**，
// 内层块的环境记录里就已经登记了 shadowed（未初始化）。
// 它遮蔽（shadow）了外层的同名变量 —— 于是在块内读 shadowed 不会找到外层那个，
// 而是碰到内层那个「已登记、未初始化」的绑定 → 抛 ReferenceError（这就是 TDZ）。
// 反过来说：如果 let 不是「进块就登记」，这段代码本应打印出外层的值，而不是报错。
const shadowed = '外层的 shadowed';

{
  try {
    // 这一行抛错，恰恰是「内层块有自己的环境记录、且已登记 let」的铁证。
    console.log('  内层块里读 shadowed →', shadowed);
  } catch (err) {
    console.log('  内层块里读 shadowed → 抛错', err.constructor.name, ':', err.message);
    console.log('    ^ 它没有找到外层的 "外层的 shadowed"，说明内层块的环境记录挡住了外层；');
    console.log('      而内层那个 shadowed 还没执行到赋值，处于未初始化状态 → 这就是 TDZ 的本质。');
  }
  let shadowed = '内层的 shadowed';
  console.log('  声明语句执行后，同一个名字 →', shadowed);
}
console.log('  块外的 shadowed 毫发无损 →', shadowed);

// 对照组：把 let 换成 var，同样的结构却不会报错 —— 因为 var 不在块级记录里。
// （这组对照放在函数体里，是为了让「函数级 VariableEnvironment」这一层更直观；
//   顺带也避免了在模块顶层混用 const 与同名 var —— 那会触发早期的 SyntaxError。）
function varShadowControl() {
  // 这一句相当于「外层的变量」，登记在函数的 VariableEnvironment 上。
  var notShadowed = '函数级的 notShadowed（外层那个）';
  {
    // var 登记在函数的 VariableEnvironment，块级记录里根本没有它的名字，
    // 所以查找直接沿链跑到外层，拿到外层的当前值，不会遇到任何未初始化条目。
    console.log('  对照组（var）：块里读 notShadowed →', notShadowed, ' ← 找到了外层的值，不报错');
    // eslint-disable-next-line no-redeclare
    var notShadowed = '块里用 var 重新赋值';
    console.log('  对照组（var）：赋值之后 →', notShadowed);
  }
  console.log('  对照组（var）：块外读 notShadowed →', notShadowed, ' ← 改的就是外层那一个');
}
varShadowControl();
console.log('  ^ 同样的一句「块里再声明一次」，let 报 TDZ、var 直接改外层。');
console.log('    差别不在花括号，而在**名字被登记进了哪一张环境记录**。');

// ---------------------------------------------------------------------------
// 6. 每次调用都创建一套新的环境记录
// ---------------------------------------------------------------------------

console.log('--- 6. 每次函数调用都新建一套环境记录（上下文是「每次调用」的，不是「每个函数」的）---');

function trackEnvironment(label) {
  // 每次调用都会新建函数环境记录，所以这里的局部变量跟别的调用毫无关系。
  const localState = `${label} 的私有状态`;
  function readLocal() {
    // readLocal 的 [[Environment]] 指向本次调用的那层环境记录 ——
    // 这就是「闭包记住了它定义时所在的环境记录」的字面含义。
    return localState;
  }
  return readLocal;
}

const envA = trackEnvironment('调用 A');
const envB = trackEnvironment('调用 B');
console.log('  调用 A 的闭包 →', envA());
console.log('  调用 B 的闭包 →', envB());
console.log('  两者互不干扰：', envA() !== envB(), ' ← 因为它们是两次调用、两层不同的环境记录');
console.log('  ^ 函数体只有一份代码，但每次调用都产生一个执行上下文、一份环境记录。');
console.log('    「环境记录」属于调用，「代码」属于函数对象 —— 这是最容易混淆的一点。');

// 「函数式环境记录」还额外带 this 绑定，这一点和普通块级记录不同。
const methodHost = {
  tag: '我是 methodHost',
  read() {
    // 隐式绑定：obj.read() 调用时，上下文的 ThisBinding 就是 obj。
    // 环境记录负责变量（tag 要通过 this 才能拿到 —— 它不是变量，是属性）。
    return this.tag;
  },
};
console.log('  函数式环境记录额外带 this 绑定：methodHost.read() →', methodHost.read());
const detached = methodHost.read;
try {
  // 摘下来单独调用 → ThisBinding 变成 undefined → 再读 this.tag 就抛 TypeError。
  // 这个报错本身正是证据：this 属于「调用时新建的上下文」，不属于函数对象。
  console.log('  把同一个函数摘下来单独调用：detached() →', detached());
} catch (err) {
  console.log('  把同一个函数摘下来单独调用：detached() → 抛错', err.constructor.name, ':', err.message);
}
console.log('  ^ 摘下来的只是函数对象，它随身带着的是 [[Environment]]（定义处的环境记录）；');
console.log('    而 this 属于**调用时新建的**上下文，两次调用方式不同，this 就不同。见 15_this_and_context。');

// ---------------------------------------------------------------------------
// 7. 闭包 = 内层函数持有外层环境记录的「引用」（不是值拷贝）
// ---------------------------------------------------------------------------

console.log('--- 7. 闭包持有的是环境记录本身，不是值的快照 ---');

function makeSharedEnvironment() {
  // shared 这一份变量住在 makeSharedEnvironment 的环境记录里。
  let shared = 0;
  // 下面两个闭包都指向**同一个**环境记录 —— 所以它们看到的是同一份 shared。
  const increase = () => {
    shared += 1;
    return shared;
  };
  const read = () => shared;
  return { increase, read };
}
const pair = makeSharedEnvironment();
console.log('  调用 increase() →', pair.increase());
console.log('  调用 increase() →', pair.increase());
console.log('  另一个闭包读到 →', pair.read(), ' ← 两个闭包共享同一份环境记录，所以能看到对方的修改');
console.log('  ^ 如果闭包捕获的是「值的拷贝」，read() 只会看到它被创建时的 0。');

// 「后赋值、闭包读到新值」是同一个结论的另一面。
function valueIsNotSnapshotted() {
  let message = '（初始值）';
  const readMessage = () => message;
  // 先创建闭包，之后外层再改这个变量。
  message = '（外层在返回前改成了这个值）';
  return readMessage;
}
console.log('  闭包创建后、外层又改了变量，闭包读到 →', valueIsNotSnapshotted());
console.log('  ^ 又一次证明：闭包拿到的是「装变量的容器」，读的时候才去容器里取值。');

// 环境记录为何能「活过」外层函数的返回：
// 正常情况下函数返回 → 上下文弹出 → 环境记录本该销毁；
// 但只要仍有函数对象的 [[Environment]] 指向它，它就变成堆上可达的对象，不会被回收。
console.log('  生命周期：函数返回时上下文被弹出，但被闭包引用的环境记录会被「提升」到堆上保留。');
console.log('            代价是内存常驻 —— 这也正是「闭包可能造成内存泄漏」的原因。');
console.log('            细节见 07_scope_and_closure/10_closure_memory.js 与 31_performance_and_memory/10_weakref_and_gc.js。');

// ---------------------------------------------------------------------------
// 8. 全局执行上下文 vs 模块执行上下文
// ---------------------------------------------------------------------------

console.log('--- 8. 模块执行上下文与全局（脚本）执行上下文不同 ---');

// 本文件就是一个 ES 模块，此刻跑在**模块执行上下文**里。它有三处和全局脚本明显不同：
//   ① 顶层 this 是 undefined（全局脚本里是 globalThis）；
//   ② 顶层的 var 不会挂到 globalThis 上（它有自己独立的模块环境记录）；
//   ③ 顶层代码天然是严格模式。
var moduleLevelVar = '我是模块顶层的 var';
console.log('  ① 模块顶层的 this →', this, '（typeof：', typeof this, '）—— 模块顶层 this 就是 undefined');
console.log('  ② 模块顶层 var 在 globalThis 上是自有属性吗？', Object.hasOwn(globalThis, 'moduleLevelVar'));
console.log('     但模块内部当然读得到 →', moduleLevelVar);
console.log('     ^ 因为模块有**自己的**顶层环境记录，var 登记在那里，而不是全局对象上。');
console.log('  ③ 顶层代码是严格模式（本文件删不可配置属性会抛 TypeError，见 04_operators/12）。');

// 用两个 typeof 探测做对照：同名变量在脚本里「泄漏」到 globalThis，在模块里不会。
const scriptContext2 = vm.createContext({});
vm.runInContext('var sameName = "来自脚本";', scriptContext2);
console.log('  对照实验（全局脚本）→ globalThis 上有 sameName：', Object.hasOwn(scriptContext2, 'sameName'));
console.log('  这说明「顶层 var 会不会变成全局对象的属性」取决于你在哪种执行上下文里跑。');

// ---------------------------------------------------------------------------
// 9. 统一模型：把前面几章的知识点挂到同一台机器上
// ---------------------------------------------------------------------------

console.log('--- 9. 一张表串起前面几章 ---');

const unifiedModel = [
  ['调用栈（06 / 10 章）', '执行上下文栈', '每调用一次压入一个上下文，return 时弹出'],
  ['提升（02 章）', 'VariableEnvironment 的登记时机', '进入函数时就登记好 var / 函数声明的名字'],
  ['TDZ（02 章）', '声明式记录里的「未初始化」条目', '名字已登记但值未写入，读到就抛 ReferenceError'],
  ['块级作用域（07 章）', '每进一个块压入一层声明式记录', '出块弹出，所以 let/const 出不去、var 出得去'],
  ['作用域链（07 章）', '环境记录的 [[OuterEnv]] 引用', '由内向外的查找路线，由定义位置决定'],
  ['闭包（07 章）', '函数对象的 [[Environment]] 槽', '持有外层环境记录的引用，让变量活过返回'],
  ['this（15 章）', '执行上下文的 ThisBinding 字段', '由调用方式决定，与定义位置无关（箭头函数除外）'],
  ['模块顶层（19 章）', '模块环境记录', '独立顶层环境、this 是 undefined、默认严格模式'],
];
for (const [knowledge, mechanism, effect] of unifiedModel) {
  console.log(`  · ${knowledge}`);
  console.log(`      机制：${mechanism}`);
  console.log(`      现象：${effect}`);
}

console.log('--- 也见 ---');
console.log('  02_variables/04_hoisting_and_tdz.js        —— 提升与 TDZ 的现象与规则');
console.log('  07_scope_and_closure/04_scope_chain.js     —— 作用域链的查找规则与遮蔽');
console.log('  07_scope_and_closure/06_closure_basics.js  —— 闭包的形成条件与基础用法');
console.log('  15_this_and_context/01_this_rules.js       —— this 的四种绑定规则');
console.log('  31_performance_and_memory/10_weakref_and_gc.js —— 环境记录何时被回收');

console.log('\n全部演示完毕。');
