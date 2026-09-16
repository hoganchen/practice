/**
 * ============================================================================
 * 知识点：全局作用域 —— globalThis、全局变量污染
 * ============================================================================
 *
 * 【所属分类】07_scope_and_closure —— 作用域与闭包
 * 【难度等级】入门
 * 【前置知识】00_hello_world/01_hello_world.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    作用域（scope）是"变量能被访问到的范围"。最外层的那一圈就是全局作用域：
 *    任何地方都能读写的变量，就活在全局作用域里。
 *    在浏览器里这个全局对象是 window；在 Node.js 里是 global；
 *    从 ES2020 起，标准给出了统一的访问方式：globalThis。
 *    globalThis 的意思是"不管在哪个运行环境，都指向当前的全局对象"。
 *
 * 2. 为什么需要
 *    全局变量用起来最方便（到处都能用），但也是最危险的：
 *      (1) 命名冲突：多人/多个库同时往全局挂东西，容易重名覆盖；
 *      (2) 难以追踪：任何一处代码都可能改掉它，出 bug 时排查面极大；
 *      (3) 阻碍回收：全局变量的生命周期和程序一样长，一直占内存。
 *    所以工程上的共识是："尽量不往全局放东西"。
 *
 * 3. 核心语法要点
 *    (1) 真正的"全局变量"只有两种造法：
 *          ① 用 var 声明在"脚本（script）"的顶层（注意：模块不是脚本，见下）；
 *          ② 显式挂到全局对象上：globalThis.xxx = 值。
 *    (2) 本仓库的文件都是 ESM 模块。模块有自己独立的作用域，
 *        顶层写 var / let / const 都只是"模块级变量"，不会变成全局属性。
 *    (3) 严格模式（模块天然是严格模式）下，给未声明的变量赋值会直接抛
 *        ReferenceError，而不是偷偷创建一个全局变量。
 *    (4) 非严格模式（普通 script 脚本）下，`x = 1` 会隐式创建一个全局变量，
 *        这是"全局污染"最常见的来源。
 *
 * 4. 常见陷阱
 *    - 以为模块顶层写的 var 会挂到 globalThis 上（不会）。
 *    - 忘了写声明关键字，在非严格模式下悄悄制造全局变量。
 *    - 用 `if (globalVar)` 之类的写法判断"某个库有没有加载"，在模块化环境下不可靠。
 *    - 全局变量被不同模块互相改写，导致难以复现的 bug。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 07_scope_and_closure/01_global_scope.js
 *
 * 【预期输出】
 *   演示 globalThis 的基本用法、显式全局变量的创建与检查、
 *   模块作用域与全局作用域的区别，以及隐式全局在严格模式下的报错行为。
 * ============================================================================
 */

console.log('--- 1. globalThis：跨环境的全局对象 ---');

// globalThis 在任何环境下都指向全局对象：
//   浏览器 → window；Node.js → global；Web Worker → self。
console.log('  typeof globalThis →', typeof globalThis);
console.log('  globalThis 上已经有这些常见全局 API：');
console.log('    typeof console  →', typeof globalThis.console);
console.log('    typeof Math     →', typeof globalThis.Math);
console.log('    typeof JSON      →', typeof globalThis.JSON);
console.log('    typeof setTimeout →', typeof globalThis.setTimeout);
console.log('  在 Node 里，globalThis === global 吗？', globalThis === global);

console.log('--- 2. 显式创建全局变量（唯一可控的方式）---');

// 直接给全局对象挂属性 —— 这才是真正的"全局变量"。
globalThis.myGlobalConfig = { appName: '示例应用', version: '1.0.0' };

// 任何地方都能访问它，无需 import。
console.log('  读回来 →', globalThis.myGlobalConfig);
console.log('  "myGlobalConfig" in globalThis →', 'myGlobalConfig' in globalThis);

// 也可以不写 globalThis 前缀直接访问（全局对象上的属性会自动成为"全局变量"）。
console.log('  不带前缀直接访问 →', myGlobalConfig.appName);
// 注意：这种"隐式前缀"的写法会让阅读者搞不清变量从哪来，不推荐。

// 用完清理掉，避免真的污染全局（好的示范）。
delete globalThis.myGlobalConfig;
console.log('  删除后 "myGlobalConfig" in globalThis →', 'myGlobalConfig' in globalThis);

console.log('--- 3. 模块顶层声明的变量：不是全局变量 ---');

// 下面这些是本文件的"模块级变量"，模块内的任何代码都能用，但它们不在全局对象上。
var moduleLevelVar = '我是模块顶层的 var';
let moduleLevelLet = '我是模块顶层的 let';
const moduleLevelConst = '我是模块顶层的 const';

console.log('  模块内访问 var   →', moduleLevelVar);
console.log('  模块内访问 let   →', moduleLevelLet);
console.log('  模块内访问 const →', moduleLevelConst);
console.log('  它们挂到 globalThis 上了吗？');
console.log('    "moduleLevelVar"   in globalThis →', 'moduleLevelVar' in globalThis);
console.log('    "moduleLevelLet"   in globalThis →', 'moduleLevelLet' in globalThis);
console.log('    "moduleLevelConst" in globalThis →', 'moduleLevelConst' in globalThis);
console.log('  结论：ESM 模块有自己独立的作用域，顶层变量既不是全局变量，也不会互相冲突');
console.log('        （这正是"模块"存在的意义之一：当年用 IIFE 手动隔离，现在语言直接提供了）。');

console.log('--- 4. 全局污染的历史套路：隐式全局变量 ---');

// 非严格模式下，给一个从未声明过的变量赋值会自动创建一个全局变量。
// 本文件是 ESM（严格模式），所以这行代码会直接抛错 —— 这正是我们希望的结果。
try {
  // eslint-disable-next-line no-undef
  implicitGlobal = '我是偷偷创建的全局变量';
  console.log('  不该走到这里');
} catch (err) {
  console.log('  给未声明的变量赋值 → 报错', err.constructor.name, ':', err.message);
  console.log('  好处：严格模式帮你把"手滑漏写声明"变成了立即可见的错误。');
}

// 换一种方式看同一个问题：读一个不存在的变量也会报错（而不是得到 undefined）。
try {
  console.log(notDefinedAnywhere);
} catch (err) {
  console.log('  读取不存在的变量 → 报错', err.constructor.name, ':', err.message);
}
// 但 typeof 是特例：它对不存在的标识符不报错，返回字符串 "undefined"。
console.log('  typeof notDefinedAnywhere →', typeof notDefinedAnywhere, '（typeof 是安全的探测手段）');

console.log('--- 5. 全局变量污染的真实危害演示 ---');

// 模拟"两个库都往全局挂同名变量"的经典事故。
globalThis.sharedName = '库 A 的实现';
console.log('  库 A 挂上 sharedName →', globalThis.sharedName);

// 库 B 也用了同一个名字，直接覆盖。
globalThis.sharedName = '库 B 的实现';
console.log('  库 B 覆盖 sharedName →', globalThis.sharedName);
console.log('  后果：库 A 之后再读到这个名字，拿到的就是库 B 的东西了 —— 这就是命名冲突。');

// 正确做法一：用唯一的命名空间包一层。
globalThis.myCompany = { libA: { sharedName: '库 A 的实现' }, libB: { sharedName: '库 B 的实现' } };
console.log('  命名空间隔离 →', globalThis.myCompany.libA.sharedName, '/', globalThis.myCompany.libB.sharedName);

// 正确做法二（现代首选）：根本别挂全局，用模块导出。
const exportableValue = '我用 ESM 的 export 对外暴露，不碰全局';
console.log('  模块导出（不污染全局）→', exportableValue);

// 清理测试数据。
delete globalThis.sharedName;
delete globalThis.myCompany;
console.log('  已清理测试用的全局变量。');

console.log('--- 6. 全局作用域 vs 模块作用域 vs 函数作用域 ---');

// 函数作用域：函数内部声明的变量，外面看不到。
function inner() {
  const functionScoped = '我在函数里';
  console.log('  函数内部可以访问 模块变量 吗？', typeof moduleLevelVar !== 'undefined');
  console.log('  函数内部可以访问 全局变量 吗？', typeof globalThis.console !== 'undefined');
  return functionScoped;
}
inner();
console.log('  函数外部访问 functionScoped →', typeof functionScoped, '（拿不到）');

console.log('--- 7. 小结：全局变量的使用建议 ---');
const advice = [
  ['必须共享的少量内容（如应用配置、环境标记）', '挂到 globalThis 的一个唯一命名空间下，例如 globalThis.__APP__'],
  ['普通业务数据、工具函数', '用 ESM 的 export / import，完全不碰全局'],
  ['临时调试', '可以用 globalThis.xxx 挂一下，但调试完要删掉'],
  ['绝对避免', '不写声明关键字直接赋值（严格模式会报错，非严格模式会污染全局）'],
];
for (const [scene, how] of advice) {
  console.log(`  · ${scene}`);
  console.log(`      → ${how}`);
}
