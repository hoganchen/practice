/**
 * ============================================================================
 * 知识点：循环依赖 —— ESM 的实时绑定与 TDZ vs CJS 的值快照与半成品
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】高级
 * 【前置知识】19_modules/07_live_bindings.js、19_modules/08_module_scope.js、
 *             19_modules/11_cjs_require.cjs、19_modules/12_esm_vs_cjs.cjs
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    循环依赖（circular dependency）指模块图里出现环：A 依赖 B，B 又依赖 A
 *    （可以是直接互相依赖，也可以是多跳的 A -> B -> C -> A）。
 *    语言本身并不禁止它，但"求值时对方还没准备好"这件事必须有确定的语义。
 *    ESM 与 CJS 对这一点的处理**完全不同**：
 *      · ESM：先建立绑定再执行代码，读到未初始化的绑定会抛 ReferenceError（TDZ）。
 *      · CJS：边执行边填 exports，读到还没填的属性只会得到 undefined（无任何提示）。
 *
 * 2. 为什么需要专门讲（真实项目场景）
 *    (1) 这是启动期最难 debug 的报错之一。报错位置常常在"被依赖的那个文件的最后一行"，
 *        而真正的元凶在另一个文件的顶层代码里，错误栈看起来完全不讲道理。
 *    (2) 它常常是"偶发"的：能不能复现取决于模块的求值顺序，
 *        而顺序又会被"谁先被 import"、"打包器怎么重排"、"测试文件导入了哪个模块"改变。
 *        于是经常出现"本地好好的，CI 上炸了""加一行 import 就好了"这种玄学现象。
 *    (3) 类型上也有坑：TypeScript 能编译通过，运行时才炸；
 *        有些静态检查工具（ESLint 的 import/no-cycle）能提前发现，但默认不开。
 *
 * 3. 核心语法要点
 *    (1) ESM 的导入是**实时绑定**：`import { x } from './m.js'` 建立的是指向
 *        m.js 内部绑定的只读视图，不是值的拷贝。循环中只要"不提前读"，就一定安全。
 *    (2) ESM 的求值顺序是**深度优先、后序**：先把依赖全部求值完，再求值自己。
 *        因此在环里，**最后被 import 的那个模块反而是最先执行完的**。
 *    (3) 函数声明（function foo）在模块里是**提升**的，所以在循环里它"看起来可用"，
 *        但函数体内部读别的 const 依然会 TDZ。这是最迷惑人的形态。
 *    (4) CJS 的 require 是**同步执行 + 返回 module.exports 的当前值**：
 *        环里拿到的是"半成品"；如果用 `module.exports = {...}` 整体替换，
 *        对方手里的旧引用就**永远**停在半成品状态。
 *    (5) 如果改用 `module.exports.x = ...` 原地挂属性，对方手里的引用是同一个对象，
 *        于是会"后来突然有值了" —— 结果取决于读的时机，更加隐蔽。
 *
 * 4. 常见陷阱
 *    (1) 在模块顶层做"立刻要用到对方"的事：创建实例、注册路由、写常量表、
 *        调用对方的函数。这些都要求对方已经初始化完毕。
 *    (2) 用"值快照"的思维理解 ESM：`const copy = imported;` 在顶层执行时读的就是
 *        那一刻的值；循环下它会读到 TDZ 报错或旧值，而不是永远跟随。
 *    (3) 以为 CJS 里的 undefined 是"配置没读到"，跑去查配置文件，
 *        实际上是被循环依赖截断了。
 *    (4) 靠"调整 import 顺序"来掩盖问题：这只是把环挪了个位置，
 *        换个入口文件或换个打包器就又炸了。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/15_circular_dependencies.js
 *
 * 【预期输出】
 *   分 8 个小节，分别演示"安全的 ESM 循环""ESM 的 TDZ 崩溃""函数提升造成的假象"
 *   "CJS 的快照与半成品""CJS 原地挂属性的假象"，并给出原理对比与预防清单。
 *   所有故意触发的错误都被 try/catch 接住后打印，进程退出码为 0。
 *
 * 【关于本目录下的辅助文件】
 *   本文件依赖 10 个以 _ 开头的辅助模块（_cycle-*.js / _cycle-*.cjs）。
 *   它们两两互相 import/require，构成真实的循环依赖。
 *   批量校验脚本会跳过 _ 开头的文件，所以它们不会被单独运行。
 * ============================================================================
 */

import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------
// 静态导入：这 3 个辅助模块在 main 的代码开始执行之前就已经求值完毕
// ---------------------------------------------------------------------------
// 注意这里特意**只**静态导入"安全的"那两个环。
// "会炸的"那个环必须用动态 import，否则 main 自己都会启动失败（见第 3 节）。

import { KIND, bNameSeenFromA, whoAmI, describeA } from './_cycle-good-a.js';
import { A_CONST, A_RESULT, B_PROBE } from './_cycle-hoist-a.js';

// createRequire 让 ESM 文件也能用 CJS 的 require —— 这样才能演示 CJS 的循环。
const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// 1. 为什么循环依赖是最难 debug 的启动报错之一
// ---------------------------------------------------------------------------

console.log('--- 1. 循环依赖为什么难 debug ---');
console.log('循环依赖本身不违法，A->B->A 只要"谁都不在顶层急着用对方"，就一点事都没有。');
console.log('问题在于它把"求值顺序"变成了程序的隐式依赖：');
console.log('  ① 报错位置具有欺骗性：错误往往抛在"被依赖方"，而元凶在"依赖方的顶层代码"；');
console.log('  ② 结果不稳定：换个入口文件、加一行 import、换个打包器，求值顺序就变了；');
console.log('  ③ 两种语言的症状完全不同：ESM 大声抛 ReferenceError，CJS 静静给 undefined。');
console.log('下面把这两类症状都跑一遍，全部基于真实文件，不是伪代码。');

// ---------------------------------------------------------------------------
// 2. ESM 循环依赖：安全的写法（结果：一切正常）
// ---------------------------------------------------------------------------

console.log('\n--- 2. ESM 循环：安全写法（_cycle-good-a.js <-> _cycle-good-b.js） ---');
console.log('模块图：main -> good-a -> good-b -> good-a（环）');
console.log('求值顺序：深度优先后序，所以 **good-b 先执行完**，good-a 才开始执行。');
console.log('  good-a 的 KIND          =', KIND);
console.log('  good-a 顶层读到的 B_NAME =', bNameSeenFromA, '（B 先执行完，所以能读到）');
console.log('  good-a 的 whoAmI()      =', whoAmI());
console.log('  good-b 通过实时绑定读 A  =', describeA());
console.log('✅ 安全的关键：good-b 只在**函数体**里引用 A 的绑定，从不在顶层读。');
console.log('   函数被调用时 A 早就初始化完了，实时绑定自然有值。');

// ---------------------------------------------------------------------------
// 3. ESM 循环依赖：顶层读取 -> TDZ 崩溃
// ---------------------------------------------------------------------------
// 必须用动态 import：静态 import 会在 main 开始执行前就求值这个环，
// 模块求值失败会直接把 main 一起带崩（进程非零退出）。
// 动态 import 返回 Promise，失败时可以 catch 到。

console.log('\n--- 3. ESM 循环：顶层读取 -> TDZ 崩溃（_cycle-tdz-a.js <-> _cycle-tdz-b.js） ---');
console.log('这个环和上面一模一样，只有一处不同：good-b 里对 A 的读取搬到了**顶层**。');

/**
 * 动态导入一个模块并把结果归一化成"好读的字符串"。
 * @param {string} spec 模块说明符
 * @returns {Promise<string>} 成功或失败的描述
 */
async function probeImport(spec) {
  try {
    const ns = await import(spec);
    return `✅ 导入成功，导出的键 = ${JSON.stringify(Object.keys(ns))}`;
  } catch (err) {
    return `❌ ${err.constructor.name}: ${err.message}`;
  }
}

console.log('  第一次尝试：', await probeImport('./_cycle-tdz-a.js'));
console.log('  第二次尝试：', await probeImport('./_cycle-tdz-a.js'));
console.log('👆 两次结果完全一样 —— ESM 会**缓存求值失败**的模块。');
console.log('   模块一旦进入 errored 状态，之后任何 import 它（或导入它的上层）都会');
// 关于这类报错栈为什么看起来"少了几层帧"，见 37_debugging_and_profiling/01_stack_traces.js
console.log('   立刻以同一个错误被拒绝。这也解释了为什么"重启就好了"是不成立的。');
console.log('✅ 这条 ReferenceError 正是 ESM 的良心：它宁可大声报错，也不给你一个 undefined。');

// ---------------------------------------------------------------------------
// 4. ESM 循环依赖：函数声明提升造成的"假象"
// ---------------------------------------------------------------------------

console.log('\n--- 4. ESM 循环：函数提升的假象（_cycle-hoist-a.js <-> _cycle-hoist-b.js） ---');
console.log('这一节把"能调用"和"不能读值"这两件事拆开看，它是循环依赖最迷惑的形态。');
console.log('  A 的导出 A_CONST  =', A_CONST);
console.log('  B 在初始化阶段调用 A 的函数 ->', B_PROBE);
console.log('  A 在初始化阶段调用同一个函数 ->', A_RESULT);
console.log('👆 同一个 aFn()、同一次进程启动，两次调用结果不同：');
console.log('   第一次（good-hoist-b 初始化时）：aFn 本身因**函数声明提升**可用，');
console.log('     但函数体里的 A_CONST 还没初始化 -> ReferenceError（TDZ）。');
console.log('   第二次（good-hoist-a 初始化时）：A_CONST 已经就位 -> 正常返回。');
console.log('✅ 结论：函数提升只解决"函数本身存不存在"，不解决"函数体里读到什么"。');

// ---------------------------------------------------------------------------
// 5. CJS 循环依赖：值快照与半成品模块（整体替换 module.exports）
// ---------------------------------------------------------------------------

console.log('\n--- 5. CJS 循环：值快照（_cycle-cjs-a.cjs <-> _cycle-cjs-b.cjs） ---');
console.log('CJS 没有 TDZ 检查，环里拿到的是"半成品"，而且**不报错**。');
console.log('（下面两行日志是辅助文件在被 require 时打印的，我先把它们调出来。）\n');

const cjsA = require('./_cycle-cjs-a.cjs');
const cjsB = require('./_cycle-cjs-b.cjs');

console.log('\n  main 稍后读到的 cjsA.A_NAME       =', cjsA.A_NAME, '（A 最终确实导出了这个值）');
console.log('  main 稍后读到的 cjsA.sawB         =', cjsA.sawB, '（A 说：我看到了 B）');
console.log('  B 在初始化时快照的 a.A_NAME       =', cjsB.aAtInit, '（永远是 undefined）');
console.log('  B 在初始化时快照的键列表          =', JSON.stringify(cjsB.keysAtInit), '（永远是空）');
console.log('  B 那个旧引用此刻仍读不到 A_NAME   =', cjsB.aObjectAtInit.A_NAME, '（还是 undefined）');
console.log('👆 原因：A 用 `module.exports = {...}` **整体替换**了导出对象。');
console.log('   B 手里攥着的是替换前那个空对象，A 之后再怎么改都跟它无关。');
console.log('✅ 这是"值快照"最硬的形态：快照的不是值，而是**那一刻的那个对象**。');
console.log('');
console.log('📣 顺带一提：运行时你会在 stderr 看到这样的警告（可能穿插在上面的输出之间）——');
console.log('   (node:12345) Warning: Accessing non-existent property "A_NAME" of module exports inside circular dependency');
console.log('   这是 Node 给 module.exports 套了一层 Proxy 后**主动**发出的提示，专门用于循环依赖。');
console.log('   它只报"你在环里访问了不存在的属性"，并不报"你绕过了环" ——');
console.log('   所以：见到这个警告，说明你的模块图里确实有环，值得用 madge 之类的工具查一遍。');
console.log('   想看到警告的完整调用栈，可以加 --trace-warnings 运行本文件。');

// ---------------------------------------------------------------------------
// 6. CJS 循环依赖：原地挂属性 -> 会"长出来"的假象
// ---------------------------------------------------------------------------

console.log('\n--- 6. CJS 循环：原地挂属性 -> 会"长出来"的假象（_cycle-cjs-mut-*.cjs） ---');

const cjsMutA = require('./_cycle-cjs-mut-a.cjs');
const cjsMutB = require('./_cycle-cjs-mut-b.cjs');

console.log('\n  B 初始化时看到的键            =', JSON.stringify(cjsMutB.keysAtInit), '（那时 A 还没挂属性）');
console.log('  B 初始化时读 a.A_NAME         =', cjsMutB.nameAtInit, '（undefined）');
console.log('  B 初始化时调用 a.mul(3, 4)    =', cjsMutB.callResult);
console.log('  B 手里的 aRef 与 main 的 cjsMutA 是同一个对象吗 ->', cjsMutB.aRef === cjsMutA);
console.log('  现在再读 aRef.A_NAME          =', cjsMutB.aRef.A_NAME, '（"长出来"了！）');
console.log('  现在再调用 cjsMutA.mul(3, 4)  =', cjsMutA.mul(3, 4), '（函数也"长出来"了）');
console.log('👆 因为这里用的是 `module.exports.x = ...` 原地挂属性，');
console.log('   所以 B 手里的引用和 A 最终导出的是**同一个对象**，会被后续赋值同步看到。');
console.log('✅ 结论：CJS 循环依赖的结果取决于"你什么时候读它" —— 这比报错难查得多。');

// ---------------------------------------------------------------------------
// 7. 原理对比：为什么两者行为不同
// ---------------------------------------------------------------------------

console.log('\n--- 7. 原理对比：ESM 与 CJS 的三阶段差异 ---');
console.log('ESM 的模块生命周期是严格三段的：');
console.log('  ① 解析（Parse）  ：读语法，找出所有 import/export；');
console.log('  ② 链接（Link）   ：为每个导出建立"绑定槽位"，把 import 连到对方的槽位上 ——');
console.log('                     此时**还没有任何值**，槽位里是"未初始化"标记；');
console.log('  ③ 求值（Evaluate）：深度优先后序地执行模块体，逐个给槽位赋值。');
console.log('  读到"未初始化"的槽位 = 暂时性死区（TDZ）= ReferenceError。');
console.log('');
console.log('CJS 只有一个阶段：**边执行边填 exports**。');
console.log('  require 遇到环时直接把当前的 module.exports 返回（可能是空对象），');
console.log('  没有"未初始化"这个概念，所以读不到的属性就是普通的 undefined。');
console.log('');
console.log('一句话记忆：**ESM 先连线后通电，CJS 边通电边接线。**');
console.log('这就是为什么同一个环，一边抛 ReferenceError，另一边给 undefined。');

// ---------------------------------------------------------------------------
// 8. 预防与排查清单
// ---------------------------------------------------------------------------

console.log('\n--- 8. 预防与排查清单 ---');
const rules = [
  ['顶层只做"声明"，不做"使用"', '构造实例、注册路由、调对方函数都推迟到函数里'],
  ['把共享的东西抽到第三方模块', 'A 和 B 都依赖 C，环就断了（最常见也最有效的解法）'],
  ['用动态 import 打破环', 'await import() 把求值推迟到调用时，天然无 TDZ'],
  ['用类型导入代替值导入', "import type / import { type X } 不产生运行时依赖"],
  ['CJS 里别整体替换 module.exports', '改用它挂属性，至少行为可预测一点'],
  ['把"值快照"改成"取值函数"', '导出 getState() 而不是 export const state'],
  ['开静态检查', 'ESLint 的 import/no-cycle、madge --circular、dependency-cruiser'],
  ['别靠调 import 顺序掩盖', '换个入口就复发，问题只是被挪走了'],
];
for (const [rule, why] of rules) {
  console.log(`  ${rule.padEnd(32)} -> ${why}`);
}

console.log('\n本节结束。记住两条底线：');
console.log('  1) ESM 里绝不在模块顶层读取循环对方的绑定（函数体里读是安全的）；');
console.log('  2) CJS 里绝不在模块顶层使用循环对方的导出（undefined 会一路静默传播）。');
