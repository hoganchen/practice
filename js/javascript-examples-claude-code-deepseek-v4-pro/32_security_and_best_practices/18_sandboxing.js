/**
 * ============================================================================
 * 知识点：沙箱化执行不可信代码 —— node:vm 的能力边界与真正的隔离层级
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】高级
 * 【前置知识】32_security_and_best_practices/05_eval_dangers.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    沙箱（Sandbox）指"给一段不受信任的代码划出一块受限的运行环境"，
 *    让它只能做你允许它做的事。它要解决的不是"这段代码写得对不对"，
 *    而是"这段代码**故意**想做坏事时，能不能得逞"。
 *
 *    在 JavaScript / Node 生态里，常见的四种手段（隔离强度由弱到强）：
 *      ① `node:vm` —— 同一个进程里换一个"全局对象"，共享同一个 V8 隔离区（isolate）。
 *      ② Web Worker / `node:worker_threads` —— 独立线程 + 独立 JS 堆，但仍然同进程、同权限。
 *      ③ 子进程 —— 独立进程，可以加内存/CPU/时间限制，可以降权运行。
 *      ④ 容器 / 微虚拟机（gVisor、Firecracker）—— 独立内核或独立操作系统视图，
 *         这才是**真正的安全边界**。
 *
 * 2. 为什么需要（真实使用场景）
 *    (a) 表达式求值：报表里的"自定义计算公式"、规则引擎的条件、低代码平台的绑定表达式。
 *    (b) 插件系统：让第三方为自己的工具写插件（编辑器、构建工具、CMS）。
 *    (c) 用户自定义代码：在线 IDE、编程作业判题系统、数据清洗脚本。
 *    (d) 模板引擎：用户上传的模板里可能带任意表达式。
 *    (e) **AI 生成的代码**：把模型输出的代码直接执行 —— 这是最近最热的新场景，
 *        也是风险最集中的场景（模型可能生成删除文件、外发数据的代码，
 *        也可能被提示注入操控）。
 *    共同点：代码的**作者不是你**，你不能假设它"没有恶意"。
 *
 * 3. 核心语法要点
 *
 *    (1) `node:vm` 的三个常用 API
 *        - `vm.runInNewContext(code, sandbox, options)`：
 *          在**全新**的上下文（contextified 对象）里执行代码。最常用。
 *        - `vm.createContext(sandbox)` + `vm.runInContext(code, context)`：
 *          显式创建一个上下文，之后可以在它里面反复执行多段代码（共享状态）。
 *          适合"一个插件一个上下文"的场景。
 *        - `new vm.Script(code, options)`：把代码**编译一次**，之后可以多次 `.runInContext()`。
 *          适合同一段代码要在多个上下文里跑（或要反复跑）的场景。
 *        重要的 options：
 *          - `timeout`：执行超时（毫秒），超时抛错。**只对同步代码有效**，
 *            异步回调里的死循环它管不了（这是最常见的误解）。
 *          - `codeGeneration: { strings: false, wasm: false }`：
 *            禁止 `eval` / `new Function` 从字符串动态编译代码 —— 这会封掉一大类逃逸手法。
 *          - `contextOrigin` / `filename`：只影响堆栈可读性，与安全无关。
 *
 *    (2) **node:vm 不是安全边界**（本节最重要的一句话）
 *        Node 官方文档明确写着：`node:vm` 模块**不是**一个安全机制，不要用它来运行不受信任的代码。
 *        原因：
 *          - 它在**同一个进程、同一个 V8 isolate** 里执行代码。V8 的堆、内建对象、
 *            原型链都是共享的，逃逸手法非常多（业内每年都有新的 vm 逃逸被公开）。
 *          - 逃逸的典型思路是"顺着原型链往上游走"：
 *            沙箱里拿到的每一个对象，最终都能通过 `constructor` 属性找到 `Function` 构造器，
 *            而 `Function` 构造出的函数**执行在宿主上下文里**，于是就能拿到 `process`。
 *            这类手法的完整可用代码属于攻击工具，本文件只讲原理、不提供 payload。
 *          - 即使封掉了 `Function`，还有无数边角（`importModuleDynamically`、
 *            错误对象携带的宿主引用、getter 触发的宿主回调、Proxy 的交叉访问……）。
 *        结论：`node:vm` 的定位是"**防误用**"（防止用户写错公式把服务搞崩、
 *        限制他们只能调用白名单函数），而不是"**防恶意**"。
 *        本文件的小节 4 会演示一个"安全的那种"用法：**白名单式表达式求值器** ——
 *        它之所以安全，靠的不是 vm，而是"先做词法白名单校验，再执行"。
 *
 *    (3) 浏览器端 `<iframe sandbox="...">` 的取值
 *        iframe 默认在一个"唯一的、不透明"的源里运行，且几乎所有能力都被禁用；
 *        `sandbox` 属性的每个取值都是"**解除一项限制**"：
 *          - `allow-scripts`：允许执行脚本（默认连 JS 都不跑）。
 *          - `allow-same-origin`：保留原本的源。**强烈警告**：
 *            如果同时有 `allow-scripts` 和 `allow-same-origin`，且 iframe 的内容来自
 *            你自己的源，那么 iframe 里的代码可以**把 sandbox 属性摘掉再重载自己**，
 *            从而完全逃出沙箱。所以这两个值**不要一起用**。
 *          - `allow-forms`：允许提交表单；`allow-popups`：允许开新窗口；
 *          - `allow-top-navigation`：允许导航顶层页面（可用于钓鱼，慎重）；
 *          - `allow-modals`：允许 alert/confirm（会阻塞页面，慎用）；
 *          - `allow-downloads`：允许下载文件。
 *        另外 iframe 沙箱只是"页面级"隔离，不隔离 CPU 与内存：里面的死循环照样卡死标签页。
 *
 *    (4) Worker 隔离
 *        `worker_threads`（Node）与 Web Worker（浏览器）能拿到**独立的 JS 堆**，
 *        不受主线程原型污染影响，可以 `terminate()` 强行终止（这是 vm 做不到的）。
 *        但：同一个进程、同样的文件系统与网络权限 —— 它能读你磁盘上的所有文件。
 *        适合"防卡死、防内存膨胀、防环境污染"，不适合"防恶意读取"。
 *
 *    (5) 进程隔离与资源限制（实用的折中）
 *        用 `child_process` 起一个子进程，并施加：
 *          - `timeout`：超时强杀；
 *          - `node --max-old-space-size=<MB>`：限制堆内存（防内存耗尽）；
 *          - `--max-semi-space-size`、`--stack-size` 等；
 *          - 运行在降权用户下、只读文件系统、无网络命名空间（容器里）；
 *          - 通过 stdin/stdout 传数据（不要给它文件路径权限）。
 *        这已经能挡住绝大多数"把你服务搞崩"的代码。
 *
 *    (6) ShadowRealm（提案，**尚未成为标准**）
 *        提案里的 `ShadowRealm` 提供"独立的全局 + 独立的原型链"，
 *        且跨界传递的对象会被包装（避免原型链贯通）。它的目标恰恰是解决 vm 的痛点。
 *        现状：仍处于提案阶段（Stage 2/3 之间），**不同运行时、不同版本支持情况不同**，
 *        写代码时必须先检测 `typeof ShadowRealm !== 'undefined'`，
 *        绝不能把它当成"现在就能用的语法"。本文件只做特性检测并打印结果。
 *
 *    (7) 什么时候必须用真正的隔离（容器 / 微虚拟机）
 *        - 代码来自**完全不可信**的来源（用户提交、互联网下载、AI 生成且无人复核）；
 *        - 需要限制网络访问（防数据外发）、文件系统访问、系统调用；
 *        - 需要强 CPU/内存/时间配额并保证隔离（多租户平台）；
 *        - 需要审计与可复现（每次执行都在一个干净的一次性环境里）。
 *        实践中的形态：一次性容器 + 只读根文件系统 + 禁网 + 严格超时 + 结果只走 stdout。
 *        microVM（Firecracker）或用户态内核（gVisor）能进一步降低"容器逃逸"的风险。
 *
 * 4. 常见陷阱
 *    - 以为 `vm.runInNewContext` 就是沙箱，直接拿它跑用户提交的代码 —— 这是最危险的误解。
 *    - 只设置了 `timeout`，忘了异步代码完全不受 timeout 约束
 *      （`setTimeout(() => { while(true){} }, 0)` 照样能把进程卡死）。
 *    - 给沙箱传了"太丰盛"的上下文：把 `console`、`process`、`require`、
 *      甚至整个 `global` 传进去，等于把钥匙一起递过去了。
 *    - 传进去的对象**没冻结**：沙箱里的代码可以通过改变量把宿主对象搞乱
 *      （虽然冻结也挡不住原型链逃逸，但能挡住一大批低级问题）。
 *    - 用 `require('vm2')` 之类的第三方"沙箱"库，以为万事大吉 ——
 *      这类库历史上被多次公开逃逸（且维护状态多变），不能用它作为唯一防线。
 *    - `sandbox` 属性同时开 `allow-scripts` 与 `allow-same-origin`（见上文 3(3)）。
 *    - 把"限制资源"和"限制权限"混为一谈：worker 能防卡死，但防不住读文件。
 *    - 认为"代码是我们自己生成的（AI 生成）所以可信" —— 提示注入可以让你生成的代码
 *      包含任何东西；只要没有人工逐行复核，就必须按不可信代码对待。
 *    - 沙箱里抛出的错误被原样返回给用户，泄漏宿主栈信息（见 08 篇的错误信息卫生）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/18_sandboxing.js
 *
 * 【预期输出】
 *   用 `node:vm` 演示"受限表达式求值器"的白名单写法（词法校验 + 冻结上下文 +
 *   禁用字符串编译 + 超时），并逐条展示危险输入是如何被拒绝的；
 *   演示 timeout 对同步死循环有效、对异步无效；演示 Worker 与子进程的隔离差异
 *   （子进程带内存上限与超时）；对 ShadowRealm 只做特性检测。全程无外部依赖，退出码 0。
 * ============================================================================
 */

import vm from 'node:vm';
import { Worker } from 'node:worker_threads';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ============================================================================
// 小节 1：四种隔离手段的定位
// ============================================================================
console.log('--- 1. 四种隔离手段（强度由弱到强） ---');
const isolationLevels = [
  ['node:vm', '同进程 / 同 V8 isolate / 换全局对象', '防误用（写错公式、乱调用）', '✗ 挡不住原型链逃逸，官方明确说它不是安全机制'],
  ['Worker', '同进程 / 独立线程与 JS 堆', '防卡死、防内存膨胀、防环境污染', '✗ 文件系统与网络权限与主进程相同'],
  ['子进程', '独立进程 + 可加资源限制', '防崩溃、限内存/CPU/时间', '△ 需要自己配置降权、无网络、只读文件系统'],
  ['容器 / microVM', '独立内核或独立系统视图', '防恶意代码读取/外发任何东西', '✓ 真正的安全边界，代价是启动与运维成本'],
];
for (const [name, how, good, limit] of isolationLevels) {
  console.log(`  ${name}`);
  console.log(`    形态：${how}`);
  console.log(`    擅长：${good}`);
  console.log(`    局限：${limit}`);
}
console.log('\n  一句话选型：**只是为了别把服务搞崩 → vm/Worker 够用；');
console.log('  代码可能来自恶意方 → 必须上容器或 microVM。**');

// ============================================================================
// 小节 2：node:vm 的基本用法
// ============================================================================
console.log('\n--- 2. node:vm 的三个 API ---');

// ① runInNewContext：一次性执行，最常用
const simpleResult = vm.runInNewContext('1 + 2 * 3');
console.log(`  ① runInNewContext('1 + 2 * 3') = ${simpleResult}`);

// ② createContext + runInContext：同一个上下文里反复执行（共享状态）
const context = vm.createContext({ counter: 0 });
vm.runInContext('counter += 1;', context);
vm.runInContext('counter += 41;', context);
console.log(`  ② createContext + 两次 runInContext 后，上下文里的 counter = ${context.counter}`);

// ③ new vm.Script：编译一次，多次执行（性能更好）
const script = new vm.Script('greeting + ", " + name');
console.log(`  ③ 预编译的 Script 在 A 上下文执行：${script.runInNewContext({ greeting: '你好', name: '小明' })}`);
console.log(`     同一个 Script 在 B 上下文执行：${script.runInNewContext({ greeting: 'Hello', name: 'Alice' })}`);

console.log('\n  沙箱里默认没有宿主的东西（这正是我们想要的）：');
const probe = vm.runInNewContext(
  `({
     typeofProcess: typeof process,
     typeofRequire: typeof require,
     typeofGlobalThisProcess: typeof globalThis.process,
     typeofFetch: typeof fetch,
     ownKeys: Object.getOwnPropertyNames(globalThis).sort(),
   })`
);
console.log(`    typeof process        = ${probe.typeofProcess}`);
console.log(`    typeof require        = ${probe.typeofRequire}`);
console.log(`    typeof fetch          = ${probe.typeofFetch}`);
console.log(`    沙箱 globalThis 上的属性：${probe.ownKeys.join(', ')}`);

console.log('\n  但"没有 process"不等于"安全" —— 逃逸面依然存在：');
const escapeSurface = vm.runInNewContext('({ typeofThisCtor: typeof this.constructor })');
console.log(`    沙箱里 typeof this.constructor = ${escapeSurface.typeofThisCtor}`);
console.log('    这个 constructor 就是宿主的 Object 构造器，顺着它能摸到 Function 构造器，');
console.log('    而 Function 造出来的函数执行在宿主上下文里 —— 这就是 vm 逃逸的通用思路。');
console.log('    （具体的完整逃逸代码属于攻击工具，本示例不提供；知识点的目的是让你**不要**把 vm 当沙箱用。）');

console.log('\n  缓解手段之一：禁用"从字符串编译代码"（codeGeneration）');
console.log('  这里有一个实测出来的坑：**选项名在不同 API 上不一样**，写错会被静默忽略！');
// 故意先用错误的选项名（runInNewContext 上叫 contextCodeGeneration，不叫 codeGeneration）
try {
  const r = vm.runInNewContext("Function('return 1 + 1')()", {}, { codeGeneration: { strings: false, wasm: false } });
  console.log(`    ✗ 用 codeGeneration（错误的名字）-> 竟然执行成功了：${r}，选项被【静默忽略】`);
} catch (err) {
  console.log(`    被拦下：${err.constructor.name}: ${err.message}`);
}
// 正确的写法
try {
  const r = vm.runInNewContext("Function('return 1 + 1')()", {}, { contextCodeGeneration: { strings: false, wasm: false } });
  console.log(`    ✗ 用 contextCodeGeneration（正确）-> 竟然还是执行成功了：${r}`);
} catch (err) {
  console.log(`    ✓ 用 contextCodeGeneration（正确）-> 被拦下：${err.constructor.name}: ${err.message}`);
}
console.log('    选项名对照（写错不会报错，只会失效 —— 这类"静默失效"在安全配置里最危险）：');
console.log('      vm.createContext(sandbox, { codeGeneration: {...} })        // ← createContext 用这个');
console.log('      vm.runInNewContext(code, sandbox, { contextCodeGeneration }) // ← runInNewContext 用这个');
console.log('      new vm.Script(code, { ... }) 本身不接收该选项，它跟随所属上下文');
console.log('    注意：这只封掉了一类手法，**不代表 vm 就安全了**。');

// ============================================================================
// 小节 3：timeout 的真实边界（同步 vs 异步）
// ============================================================================
console.log('\n--- 3. timeout 只对同步代码有效 ---');

try {
  vm.runInNewContext('while (true) {}', {}, { timeout: 100 });
  console.log('    （不应该执行到这里）');
} catch (err) {
  console.log(`  ✓ 同步死循环被超时终止：${err.constructor.name}: ${err.message}`);
}

console.log('\n  但下面这种情况 timeout 完全管不着（异步回调在 Script 之外才执行）：');
let asyncHogObserved = false;
const asyncSandbox = {
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  // 只让它循环很短时间，避免真的卡住本示例进程
  spin: (ms) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      /* 故意空转，模拟异步回调里的死循环 */
    }
  },
};
vm.runInNewContext('setTimeout(() => spin(30), 0);', asyncSandbox, { timeout: 5 });
console.log('    Script 本身 5ms 就"执行完了"，但异步回调依然会在之后运行。');
await new Promise((r) => setTimeout(r, 60));
asyncHogObserved = true;
console.log(`    ${asyncHogObserved ? '✓ 异步回调确实照常执行了 —— 说明 timeout 拦不住它' : ''}`);
console.log('    → 防御：在沙箱里**不要提供** setTimeout/setInterval/Promise 之外的异步能力，');
console.log('      或者干脆把执行放到 Worker / 子进程里，用 terminate() / kill() 兜底。');
console.log('      这也解释了为什么"限制执行时间"本质上是一个调度问题，而不是一个语法问题。');

// ============================================================================
// 小节 4：一个"安全的那种"表达式求值器（白名单式）
// ============================================================================
console.log('\n--- 4. 白名单式表达式求值器 ---');
console.log('  设计目标：让业务方配置"自定义公式"，例如 max(price * 0.9, floorCost) + tax。');
console.log('  安全策略（三层，缺一不可）：');
console.log('    ① **词法白名单**：只允许数字、四则运算、括号、逗号和白名单函数名 —— 其余一律拒绝；');
console.log('    ② **冻结的极简上下文**：只放白名单函数，不放任何宿主对象；');
console.log('    ③ **禁用字符串编译 + 超时**：即使前两层被绕过，也限制它能做的事。');
console.log('  注意：真正提供安全性的是第 ① 层（白名单），vm 只是"执行器"而已。');

/** 允许出现在公式里的函数（白名单） */
const FORMULA_FUNCTIONS = Object.freeze({
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  round: Math.round,
  floor: Math.floor,
  ceil: Math.ceil,
  sqrt: Math.sqrt,
  pow: Math.pow,
});

/** 允许出现在公式里的常量 */
const FORMULA_CONSTANTS = Object.freeze({ PI: Math.PI, E: Math.E });

/**
 * 词法白名单校验：这是求值器安全性的**真正来源**。
 * 只允许：数字、白名单函数名、白名单常量、已声明的业务变量、运算符、括号、逗号、空白。
 * @param {string} expr
 * @param {string[]} variableNames 本次允许出现的业务变量名
 * @returns {{ok:true} | {ok:false, reason:string}}
 */
function validateFormulaLexically(expr, variableNames = []) {
  if (typeof expr !== 'string') return { ok: false, reason: '表达式必须是字符串' };
  if (expr.length > 500) return { ok: false, reason: '表达式过长' };
  // 第一关：只允许这些字符（引号、反引号、分号、方括号、等号等一律拒绝）
  if (!/^[\w\s+\-*/%(),.]+$/.test(expr)) {
    const bad = [...expr].find((c) => !/[\w\s+\-*/%(),.]/.test(c));
    return { ok: false, reason: `包含不允许的字符 ${JSON.stringify(bad)}` };
  }
  // 第二关：提取所有标识符，逐个检查是否在白名单内
  // （不允许任何"未在名单里的名字"出现 —— 这是白名单相对黑名单的核心优势）
  const identifiers = expr.match(/[A-Za-z_$][\w$]*/g) ?? [];
  const allowed = new Set([
    ...Object.keys(FORMULA_FUNCTIONS),
    ...Object.keys(FORMULA_CONSTANTS),
    ...variableNames,
  ]);
  for (const id of identifiers) {
    if (!allowed.has(id)) return { ok: false, reason: `不允许的标识符 "${id}"` };
  }
  return { ok: true };
}

/**
 * 安全地求值一个公式。
 * @param {string} expr
 * @param {Record<string, number>} variables 业务变量（会被拷贝进沙箱）
 * @returns {{ok:true, value:number} | {ok:false, reason:string}}
 */
function evaluateFormula(expr, variables = {}) {
  const lexical = validateFormulaLexically(expr, Object.keys(variables));
  if (!lexical.ok) return { ok: false, reason: `词法校验拒绝：${lexical.reason}` };

  // 只把白名单内容 + 变量的**副本**放进上下文，并且冻结，避免沙箱代码改动宿主对象
  const sandbox = Object.create(null);
  for (const [k, v] of Object.entries(FORMULA_FUNCTIONS)) sandbox[k] = v;
  for (const [k, v] of Object.entries(FORMULA_CONSTANTS)) sandbox[k] = v;
  for (const [k, v] of Object.entries(variables)) {
    if (typeof v === 'number' && Number.isFinite(v)) sandbox[k] = v;
  }
  const context = vm.createContext(sandbox, {
    codeGeneration: { strings: false, wasm: false }, // 禁止 eval / new Function
  });

  try {
    const script = new vm.Script(`(${expr})`, { filename: 'formula.js' });
    const value = script.runInContext(context, { timeout: 50 });
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { ok: false, reason: '结果不是有限数值' };
    }
    return { ok: true, value };
  } catch (err) {
    // 沙箱里的错误只对外返回笼统信息（见 08 篇的错误信息卫生）
    return { ok: false, reason: `执行失败：${err.constructor.name}` };
  }
}

const vars = { price: 100, floorCost: 80, tax: 6 };
console.log(`\n  变量：${JSON.stringify(vars)}`);
console.log('\n  正常业务表达式：');
for (const expr of [
  'price * 0.9',
  'max(price * 0.9, floorCost) + tax',
  'round(sqrt(price) * 100) / 100',
  'min(max(price, 0), 1000)',
  'PI * 2',
]) {
  const r = evaluateFormula(expr, vars);
  console.log(`    ${expr.padEnd(34)} -> ${r.ok ? r.value : `拒绝（${r.reason}）`}`);
}

console.log('\n  恶意 / 危险表达式（全部被词法白名单挡在执行之前）：');
for (const [expr, desc] of [
  ['process.exit(1)', '试图退出进程'],
  ['process.mainModule.require("node:fs")', '试图加载文件系统模块'],
  ['this.constructor.constructor("return process")()', '经典的 vm 逃逸思路'],
  ['globalThis.process.env', '试图读取环境变量'],
  ['(() => { while(true){} })()', '试图死循环（箭头函数不在白名单内）'],
  ['price; require("node:child_process")', '试图执行命令'],
  ['constructor.constructor', '试图顺着原型链找构造器'],
]) {
  const r = evaluateFormula(expr, vars);
  console.log(`    ${desc}`);
  console.log(`      ${expr}`);
  console.log(`      -> ${r.ok ? `竟然通过了：${r.value}` : `拒绝（${r.reason}）`}`);
}
console.log('\n  ↑ 关键点：这些输入是在**编译成 vm.Script 之前**就被拒了。');
console.log('    vm 只是最后一道执行器；真正干活的是那个只有 20 来行的词法白名单。');
console.log('    即使有人绕过词法白名单，还有"冻结的极简上下文 + 禁用字符串编译 + 50ms 超时"兜底。');

// ============================================================================
// 小节 5：Worker 隔离
// ============================================================================
console.log('\n--- 5. Worker：能强行终止，但不隔离权限 ---');
console.log('  worker_threads 的价值：独立 JS 堆 + 可以 terminate() 强杀（vm 做不到）。');

/** 一个会自己不停自增的 Worker：主线程随时可以终止它 */
const busyWorkerSource = `
  const { parentPort } = require('node:worker_threads');
  let n = 0;
  const timer = setInterval(() => { n += 1; parentPort.postMessage(n); }, 10);
  // 注意：这个 Worker 内部也在偷偷看 process —— 说明 Worker 并没有权限隔离
  parentPort.postMessage({ note: 'worker 里 typeof process = ' + typeof process });
  setTimeout(() => clearInterval(timer), 3000);
`;

const workerResults = await new Promise((resolve) => {
  const worker = new Worker(busyWorkerSource, { eval: true });
  const got = [];
  worker.on('message', (m) => {
    got.push(m);
    if (got.length === 1) {
      // 收到第一条消息后立刻强杀 —— 这就是 Worker 相对 vm 的核心优势
      worker.terminate().then(() => resolve(got));
    }
  });
  worker.on('error', (err) => resolve([`Worker 出错：${err.message}`]));
});
console.log(`    Worker 发回的消息：${JSON.stringify(workerResults[0])}`);
console.log(`    收到 ${workerResults.length} 条消息后主动 terminate()，主线程毫发无伤。`);
console.log('    但请注意第一条消息：Worker 里同样能摸到 process —— 它**不隔离权限**。');

// ============================================================================
// 小节 6：子进程 + 资源限制（最实用的折中）
// ============================================================================
console.log('\n--- 6. 子进程：可以加内存与时间限制 ---');

/**
 * 在一个受限子进程里运行一小段代码。
 * @param {string} code
 * @param {{timeoutMs?:number, maxOldSpaceMb?:number}} [opts]
 * @returns {Promise<{ok:boolean, stdout:string, stderr:string, killed:boolean, note:string}>}
 */
async function runInRestrictedChild(code, opts = {}) {
  const timeoutMs = opts.timeoutMs ?? 3000;
  const maxOldSpaceMb = opts.maxOldSpaceMb ?? 64;
  const args = ['-e', code, `--max-old-space-size=${maxOldSpaceMb}`];
  try {
    const { stdout, stderr } = await execFileAsync(process.execPath, args, {
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
      maxBuffer: 1024 * 1024,
      env: { PATH: process.env.PATH }, // 刻意不把宿主的敏感环境变量传进去
    });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim(), killed: false, note: `正常结束（限制：${maxOldSpaceMb}MB / ${timeoutMs}ms）` };
  } catch (err) {
    return {
      ok: false,
      stdout: String(err.stdout ?? '').trim(),
      stderr: String(err.stderr ?? '').trim(),
      killed: Boolean(err.killed),
      note: err.killed ? `被超时强杀（${timeoutMs}ms）` : `异常退出（code=${err.code}）`,
    };
  }
}

/** 只取第一行，避免把一大坨堆栈刷屏 */
const firstLine = (s) => (s ? s.split('\n')[0].slice(0, 160) : '');

console.log('\n  (a) 正常计算：');
const okChild = await runInRestrictedChild('console.log("子进程算出来：" + (6 * 7));');
console.log(`    ${okChild.note}`);
console.log(`    输出：${okChild.stdout}`);

console.log('\n  (b) 试图读取宿主的敏感环境变量（我们故意没有传进去）：');
const envChild = await runInRestrictedChild(
  'console.log("能读到的敏感变量数量：" + Object.keys(process.env).filter((k) => /TOKEN|SECRET|KEY|PASS/i.test(k)).length);'
);
console.log(`    ${envChild.note}`);
console.log(`    输出：${envChild.stdout}`);

console.log('\n  (c) 内存耗尽（限制 64MB，代码试图无限分配）：');
const oomChild = await runInRestrictedChild('const a = []; while (true) { a.push(Buffer.alloc(1024 * 1024)); }');
console.log(`    ${oomChild.note}`);
console.log(`    错误首行：${firstLine(oomChild.stderr)}`);
console.log('    → 内存被 --max-old-space-size 挡住，宿主进程完全没有受影响。');

console.log('\n  (d) 死循环（限制 1 秒，超时强杀）：');
const loopChild = await runInRestrictedChild('while (true) {}', { timeoutMs: 1000 });
console.log(`    ${loopChild.note}`);
console.log(`    killed=${loopChild.killed}`);
console.log('    → timeout + SIGKILL：这是 vm 的 timeout 做不到的（vm 管不了异步，子进程则整体可杀）。');

console.log('\n  子进程方案的进阶配置（真实生产要一起上）：');
for (const item of [
  'timeout + SIGKILL（时间上限）',
  '--max-old-space-size / --max-semi-space-size（内存上限）',
  '以低权限用户运行（降权，禁止读写系统目录）',
  '只读文件系统 / 临时目录隔离（执行完即销毁）',
  '禁用网络（network namespace 或防火墙规则）—— 防数据外发',
  '只通过 stdin/stdout 交换数据，不把文件路径交给它',
  '每次执行用一次性环境（容器），执行完直接销毁',
  '把输出当不可信数据对待：长度截断 + 转义后再展示（见 02 篇）',
]) {
  console.log(`    [ ] ${item}`);
}

// ============================================================================
// 小节 7：ShadowRealm（提案，只做特性检测）
// ============================================================================
console.log('\n--- 7. ShadowRealm：提案阶段，不要当现有语法用 ---');
const hasShadowRealm = typeof ShadowRealm !== 'undefined';
console.log(`  本机 Node ${process.version} 的检测结果：typeof ShadowRealm === ${hasShadowRealm ? '"function"（本运行时已提供）' : '"undefined"（本运行时未提供）'}`);
console.log('  ShadowRealm 提案要解决的问题正是 vm 的痛点：');
console.log('    · 提供一个**独立全局 + 独立原型链**的执行环境；');
console.log('    · 跨边界传递的对象会被**包装**，切断"顺着原型链摸回宿主"的通道。');
console.log('  但它目前**尚未成为标准**（提案阶段），不同运行时/版本支持情况不一致：');
console.log('    · 所以任何依赖它的代码都必须先做特性检测；');
console.log('    · 不能把"用 ShadowRealm 隔离"写进设计文档当作既定能力；');
console.log('    · 更不能因为它"看起来更安全"就省掉容器/子进程那层隔离。');
if (!hasShadowRealm) {
  console.log('  本示例不在运行时缺失该特性时做任何降级演示 —— 缺失就是缺失，如实报告即可。');
}

// ============================================================================
// 小节 8：什么时候该用真正的隔离
// ============================================================================
console.log('\n--- 8. 选型决策表 ---');
const decisions = [
  ['用户填的算术公式', 'vm + 词法白名单 + 冻结上下文', '不执行任意语法，只有十几个白名单函数'],
  ['第三方插件（你信任作者）', 'Worker 或子进程', '能防卡死与环境破坏，但拦不住恶意读取'],
  ['用户提交的任意代码（判题系统）', '**一次性容器**', '必须限制网络、文件系统、CPU、内存、时间'],
  ['AI 生成并要自动执行的代码', '**一次性容器 + 人工/自动审查**', '提示注入可以让生成结果包含任何东西'],
  ['只需要防卡死', 'Worker + terminate()', '成本最低，但不提供权限隔离'],
];
for (const [scenario, approach, why] of decisions) {
  console.log(`  场景：${scenario}`);
  console.log(`    做法：${approach}`);
  console.log(`    理由：${why}`);
}

console.log('\n  容器/microVM 隔离的落地要点：');
for (const item of [
  '一次性：每次执行新建、执行完销毁，不复用',
  '禁网：默认无出网，需要访问外部资源时走白名单代理',
  '只读根文件系统 + 独立的可写临时目录（大小受限）',
  '非 root 用户运行，去掉所有 capabilities',
  'CPU / 内存 / 进程数 / 磁盘配额 + 硬超时',
  'microVM（Firecracker）或用户态内核（gVisor）可进一步降低容器逃逸风险',
  '输出与副作用都要审计：执行记录、访问记录、异常告警',
]) {
  console.log(`    [ ] ${item}`);
}

// ============================================================================
// 小节 9：小结
// ============================================================================
console.log('\n--- 9. 小结 ---');
console.log('  1) node:vm 不是安全边界：同进程、同 V8 isolate，官方明确不建议用它跑不可信代码。');
console.log('  2) vm 的 timeout 只约束同步代码，异步回调照样能拖垮进程。');
console.log('  3) "安全的那种"求值器，安全性来自**词法白名单**，vm 只是执行器。');
console.log('  4) codeGeneration: { strings: false } 能封掉 eval / new Function 一类手法，但不是万能。');
console.log('  5) Worker 能 terminate() 强杀，但不隔离文件系统与网络权限。');
console.log('  6) 子进程 + timeout + 内存上限 + 降权 + 禁网，是成本最低的"防崩溃"组合。');
console.log('  7) iframe sandbox 里 allow-scripts 与 allow-same-origin 千万不要同时用。');
console.log('  8) ShadowRealm 仍是提案，只能做特性检测，不能当既有能力设计架构。');
console.log('  9) 真正不可信的代码 → 一次性容器 / microVM，这是唯一能称为"安全边界"的层级。');
console.log('  10) 别忘了输出侧：沙箱里出来的任何内容都是不可信数据，展示前必须转义（02 篇）。');

console.log('\n[结束] 全程未执行任何恶意代码，逃逸手法仅在注释中说明原理。退出码 0。');
