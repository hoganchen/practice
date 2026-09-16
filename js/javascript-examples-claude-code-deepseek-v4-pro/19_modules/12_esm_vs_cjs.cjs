/**
 * ============================================================================
 * 知识点：ESM 与 CommonJS 全面对比 —— 加载时机、静态 vs 动态、互操作性、适用场景
 * ============================================================================
 *
 * 【所属分类】19_modules —— 模块化（ESM / CommonJS）
 * 【难度等级】进阶
 * 【前置知识】19_modules/11_cjs_require.cjs、19_modules/09_dynamic_import.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 有两大模块体系：
 *      - CommonJS（CJS）：require / module.exports，2009 年为 Node.js 设计，
 *        是"同步的函数调用"。
 *      - ES Module（ESM）：import / export，2015 年进入语言标准，
 *        是"编译期确定的静态语法"。
 *    两者不是语法糖的差别，而是**加载模型**的根本不同。
 *
 * 2. 为什么需要对比
 *    今天的 Node 项目常常两种模块混用：自己的新代码用 ESM，
 *    依赖里却躺着大量 CJS 包。理解两者的差异与互操作规则，
 *    才能解释"为什么这个包 import 进来要 .default"这类问题。
 *
 * 3. 核心差异一览
 *    ┌────────────┬──────────────────────────┬──────────────────────────┐
 *    │ 维度       │ CommonJS                 │ ES Module                │
 *    ├────────────┼──────────────────────────┼──────────────────────────┤
 *    │ 关键字     │ require / module.exports │ import / export          │
 *    │ 加载时机   │ 运行时（执行到那一行才加载）│ 编译/链接期先建好依赖图  │
 *    │ 同步/异步  │ 同步，直接返回导出值     │ 静态 import 同步，         │
 *    │            │                          │ 动态 import() 返回 Promise│
 *    │ 静态分析   │ 难（路径可以是变量）     │ 容易（可 tree-shaking）  │
 *    │ 绑定语义   │ 导出的是值的快照/对象    │ 实时绑定（live binding）  │
 *    │ 顶层 await │ 不支持                   │ 支持                     │
 *    │ 严格模式   │ 默认非严格，需 'use strict'│ 永远是严格模式          │
 *    │ this(顶层) │ module.exports           │ undefined                │
 *    │ 循环依赖   │ 拿到"不完整的对象"       │ 拿到绑定，访问未初始化会 TDZ 报错 │
 *    │ 文件扩展名 │ .cjs（或 type 非 module 的 .js）│ .mjs（或 type=module 的 .js）│
 *    └────────────┴──────────────────────────┴──────────────────────────┘
 *
 * 4. 互操作性（本文件会实测）
 *    (1) CJS → ESM：Node 22.12+ 支持 require(esm)，直接返回命名空间对象；
 *        更早版本会抛 ERR_REQUIRE_ESM，必须改用动态 import()。
 *    (2) ESM → CJS：完全支持。import cjs from './x.cjs' 时，
 *        default 就是 module.exports 那个对象；
 *        Node 还会用 cjs-module-lexer 静态分析出 CJS 的具名导出，
 *        所以 import { toolName } from './x.cjs' 往往也能用。
 *    (3) 两种写法加载同一个文件时，得到的是**同一个模块实例**（缓存是共享的）。
 *
 * 5. 各自的适用场景
 *    用 ESM：新项目、浏览器、库的现代发布形态、需要 tree-shaking 的前端工程。
 *    用 CJS：维护老项目、需要同步条件加载的场景（如按配置动态加载插件）、
 *            某些只支持 CJS 的工具链（老版 webpack/Jest 配置等）。
 *    现状：Node 生态正在全面转向 ESM，新代码优先 ESM。
 *
 * 6. 常见陷阱
 *    (1) 在 .cjs 里写 import / 在 ESM 里写 require：直接语法错误
 *        （ESM 里可以用 createRequire 造一个 require 出来）。
 *    (2) 用 ESM 导入 CJS 包时忘了 default 这一层：
 *        import pkg from 'cjs-pkg' 拿到的是 module.exports 整体；
 *        如果那个包写的是 module.exports = { default: ... }，就会出现 pkg.default.default。
 *    (3) 在 "type": "module" 的仓库里把 CJS 代码写成 .js —— 会被当成 ESM 解析，
 *        报 "require is not defined"。请改用 .cjs。
 *    (4) 混用两套缓存时想当然地认为是两份实例（其实共享同一份）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/12_esm_vs_cjs.cjs
 *
 * 【预期输出】
 *   实测 ESM ↔ CJS 的互操作结果、二者的缓存共享、
 *   以及严格模式与顶层 await 的差异说明。
 * ============================================================================
 */

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// ---------------------------------------------------------------------------
// 1. 本文件是 CJS，所以只能用 require 和动态 import()
// ---------------------------------------------------------------------------

console.log('--- 1. 本文件是 CommonJS ---');
console.log('可以用 require：', typeof require);
console.log('不能用 import 声明（写在这里会直接 SyntaxError），');
console.log('但可以用动态 import()，它返回 Promise，本文件用 async 函数包起来。');

// ---------------------------------------------------------------------------
// 2. 互操作一：CJS 加载 ESM
// ---------------------------------------------------------------------------

/**
 * 演示在 CJS 中加载 ESM 模块的两种方式
 */
async function cjsLoadingEsm() {
  console.log('\n--- 2. CJS → ESM ---');

  // 方式 A：require(esm)，Node 22.12+ 支持
  try {
    const mathNs = require('./_math-utils.js');
    console.log('方式 A：require("./_math-utils.js") 成功');
    console.log('  typeof mathNs =', typeof mathNs, '，mathNs.add(1, 2) =', mathNs.add(1, 2));
    console.log('  注意：返回的是命名空间对象，所以默认导出会挂在 mathNs.default 上');
    console.log('  mathNs.default =', mathNs.default, '（该模块没有默认导出）');
  } catch (err) {
    console.log('方式 A 失败（Node < 22.12）：', err.code || err.name);
  }

  // 方式 B：动态 import()，任何支持 ESM 的 Node 版本都可用
  const cfgNs = await import('./_config.js');
  console.log('方式 B：await import("./_config.js") 成功');
  console.log('  默认导出在 .default 上：cfgNs.default.appName =', cfgNs.default.appName);
  console.log('  具名导出平铺在对象上：cfgNs.CONFIG_VERSION =', cfgNs.CONFIG_VERSION);

  return cfgNs;
}

// ---------------------------------------------------------------------------
// 3. 互操作二：ESM 视角下的 CJS 模块（用动态 import 模拟）
// ---------------------------------------------------------------------------

/**
 * 演示 ESM 侧如何"看见"一个 CJS 模块
 */
async function esmSeesCjs() {
  console.log('\n--- 3. ESM 视角下的 CJS 模块 ---');

  // 用动态 import() 加载一个 .cjs 文件，等价于 ESM 里的
  //   import legacy, { toolName } from './_legacy-lib.cjs';
  const ns = await import('./_legacy-lib.cjs');

  console.log('命名空间对象上的键：', Object.keys(ns).join(', '));
  console.log('  ns.default 就是 module 的 exports 对象：', typeof ns.default);
  console.log('  ns.default.toolName =', ns.default.toolName);
  console.log('  ns.toolName（具名导出）=', ns.toolName);
  console.log('  ns.default === require 出来的对象吗？见下一节验证');
  console.log('  ↑ 键里那个奇怪的 "module.exports" 也是具名导出之一：', typeof ns['module.exports']);
  console.log('    它的值恰好就是 module 的 exports 对象。这是 cjs-module-lexer 的副产物：');
  console.log('    它是**纯文本扫描**，只要源码（哪怕是注释）里出现 module.exports 这样的');
  console.log('    字样，就可能生造出一个同名导出。可见"具名导出识别"只是启发式，不可尽信。');
  console.log('说明：Node 用 cjs-module-lexer 静态分析 CJS 源码里的 exports.x 赋值，');
  console.log('      把它们当作具名导出暴露给 ESM，所以 { toolName } 这种写法通常可用。');
  console.log('      但如果你写的是 module 的整体赋值（module 点 exports = {...}），');
  console.log('      静态分析往往识别不出具名导出，此时只能走 default。');

  return ns;
}

// ---------------------------------------------------------------------------
// 4. 缓存共享：同一个文件只加载一次
// ---------------------------------------------------------------------------

/**
 * 验证 CJS 的 require 与 ESM 的 import 命中的是同一份模块实例
 */
function sharedCache() {
  console.log('\n--- 4. 两种加载方式共享同一份缓存 ---');
  const viaRequire = require('./_legacy-lib.cjs');
  return viaRequire;
}

// ---------------------------------------------------------------------------
// 5. 加载时机：CJS 是"走到哪执行到哪"
// ---------------------------------------------------------------------------

/**
 * 用临时模块证明 require 是顺序执行的运行时调用
 */
function sequencingDemo() {
  console.log('\n--- 5. CJS 的顺序执行 ---');

  const tmpFile = path.join(os.tmpdir(), `demo_order_${process.pid}.cjs`);
  try {
    fs.writeFileSync(tmpFile, "console.log('      【临时模块的顶层代码被执行了】');\n", 'utf8');
    console.log('  准备 require 一个带副作用的临时模块……');
    require(tmpFile); // 只有执行到这一行，临时模块的顶层代码才会跑
    console.log('  require 之后的日志（说明模块体是在这一行被执行的）');
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      /* 忽略清理失败 */
    }
  }

  console.log('对比 ESM：静态 import 的模块会在本模块体执行**之前**全部求值完，');
  console.log('      也就是说 import 语句的位置不影响它的执行时机（会被提升）。');
  console.log('      而动态 import() 和 require 一样，是"执行到那里才加载"。');
}

// ---------------------------------------------------------------------------
// 6. 严格模式差异
// ---------------------------------------------------------------------------

function strictModeDemo() {
  console.log('\n--- 6. 严格模式 ---');

  // 本文件顶部写了 'use strict'，所以下面这行会抛错（作为对照，用 try 包住）。
  try {
    // eslint-disable-next-line no-undef
    undeclaredInStrict = 1;
  } catch (err) {
    console.log('严格模式下给未声明变量赋值：', err.constructor.name, '-', err.message);
  }

  // 用 Function 构造出来的函数默认是**非严格**的（除非函数体自己写 'use strict'）
  const sloppy = new Function('sloppyGlobal = 42; return typeof sloppyGlobal;');
  console.log('非严格模式下给未声明变量赋值：', sloppy(), '（并悄悄创建了全局变量）');
  console.log('globalThis.sloppyGlobal =', globalThis.sloppyGlobal);
  delete globalThis.sloppyGlobal; // 清理掉，避免污染

  console.log('ESM 的代码**永远**是严格模式，不需要也不允许用 "use strict" 关闭；');
  console.log('CJS 默认是非严格模式，要显式写 "use strict"。');
}

// ---------------------------------------------------------------------------
// 7. 顶层 await
// ---------------------------------------------------------------------------

function topLevelAwaitNote() {
  console.log('\n--- 7. 顶层 await ---');
  console.log('本文件是 CJS，顶层写 await 会直接 SyntaxError，所以所有 await 都包在 async 函数里。');
  console.log('ESM 支持顶层 await（见 09_dynamic_import.js），但它会让模块变成"异步模块"，');
  console.log('被依赖方需要等待它求值完成，循环依赖 + 顶层 await 可能造成死锁。');
}

// ---------------------------------------------------------------------------
// 8. 文件扩展名与 type 字段的规则
// ---------------------------------------------------------------------------

function extensionRules() {
  console.log('\n--- 8. 扩展名与 package.json 的 type 字段 ---');
  console.log('.mjs  → 永远是 ESM');
  console.log('.cjs  → 永远是 CommonJS');
  console.log('.js   → 看最近的 package.json 的 "type" 字段：');
  console.log('        "type": "module" 当 ESM；"type": "commonjs" 或没写 当 CJS');
  console.log('本仓库 package.json 设了 "type": "module"，');
  console.log('所以 12_esm_vs_cjs.cjs 这个文件必须用 .cjs 才能写 CommonJS。');
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

async function main() {
  await cjsLoadingEsm();
  const esmView = await esmSeesCjs();
  const viaRequire = sharedCache();

  console.log('  ns.default === require("./_legacy-lib.cjs") ?', esmView.default === viaRequire);
  console.log('  → 无论是 require 还是 import，同一个文件只加载一次，实例是共享的。');

  sequencingDemo();
  strictModeDemo();
  topLevelAwaitNote();
  extensionRules();

  console.log('\n--- 9. 选型建议 ---');
  console.log('新项目 / 浏览器 / 库：优先 ESM（静态分析、tree-shaking、顶层 await、实时绑定）');
  console.log('老项目 / 依赖 CJS 的工具链：继续用 CJS，或逐步迁移（先从 .cjs 双轨开始）');
  console.log('两者可以互操作：CJS 用 await import()，ESM 直接 import CJS（default 即 module.exports）。');
}

// CJS 没有顶层 await，所以用 then 收尾。
// 这里在最后统一捕获未处理异常，保证进程以退出码 0 结束（示例要求）。
main().catch((err) => {
  console.error('示例执行出现意外错误：', err);
  process.exitCode = 1;
});
