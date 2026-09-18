/**
 * ============================================================================
 * 知识点：默认导出与默认导入（export default / import 任意命名 / default 的本质）
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】入门
 * 【前置知识】19_modules/01_named_exports.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    默认导出（default export）是模块对外暴露的"唯一的主角"，写法是：
 *      export default 表达式;
 *    导入方不需要知道它的名字，可以自己起名：
 *      import config from './_config.js';
 *      import 随便什么名字 from './_config.js';   // 合法
 *      import cfg2 from './_config.js';           // 五个模块里各叫各的，互不影响
 *
 * 2. 为什么需要
 *    很多模块天然只导出"一样东西"：一个类（如 React 组件）、一个配置对象、
 *    一个主函数。这时让使用方去记一个具体的导出名是多余的负担，
 *    默认导出让"一个模块 === 一个东西"这种最常见的形态写起来最自然。
 *    同时它也解决了 CommonJS 迁移问题：CJS 的 module.exports 整体就是一个值，
 *    默认导出正好与之对应（互操作时 CJS 的 module.exports 就是 default）。
 *
 * 3. 核心语法要点
 *    (1) export default 后面跟的是**表达式/值**，不是声明语句：
 *          export default 42;                 // 值
 *          export default { a: 1 };           // 对象字面量
 *          export default function () {}      // 函数表达式（可具名也可匿名）
 *          export default class Foo {}        // 类
 *        不能写 export default const x = 1;（语法错误）。
 *    (2) 一个模块最多只能有一个默认导出（写两个直接 SyntaxError）。
 *    (3) 导入默认导出时**不要写花括号**：import cfg from '...' 对，
 *        import { cfg } from '...' 错（那是找名叫 cfg 的具名导出）。
 *    (4) 具名导出和默认导出可以同时存在，但导入语法必须分开写，见 03。
 *    (5) default 本质：它就是一个名叫 "default" 的具名导出。因此
 *          import x from './m.js' 等价于 import { default as x } from './m.js'
 *        ——本文件的第 5 节会验证这一点。
 *
 * 4. 常见陷阱
 *    (1) 忘了花括号 vs 多写了花括号，是 ESM 报错最多的一类。
 *    (2) 默认导出对象字面量时，`export default { a }` 导出的对象是"值快照"式绑定，
 *        但重新给整个 default 赋值是不允许的（default 本身也是只读绑定）。
 *    (3) `export default function foo() {}` 里的 foo 只是模块内的局部名字，
 *        导入方**不能**用 foo 导入，只能 `import bar from ...`。
 *    (4) 用 `export default` 导出匿名函数时，调试栈里函数名会显示为 default，
 *        对排错不友好，建议给函数起个名字。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/02_default_export.js
 *
 * 【预期输出】
 *   打印从 _config.js 导入的默认导出对象，演示任意命名、
 *   与 `{ default as x }` 写法等价、以及匿名默认导出的写法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本语法：默认导入，不要花括号
// ---------------------------------------------------------------------------

// _config.js 里写的是 `export default config;`
// 这里我把它叫做 config —— 名字是我自己起的，与模块内部叫什么无关。
import config from './_config.js';

console.log('--- 1. 默认导入的基本用法 ---');
console.log('应用名 =', config.appName);
console.log('版本   =', config.version);
console.log('语言   =', config.locale);

// ---------------------------------------------------------------------------
// 2. 同一个默认导出，可以在不同文件里叫不同名字
// ---------------------------------------------------------------------------

// 再导入一次，这次叫 appConfig。
// 两次导入拿到的是**同一个对象**（同一个模块实例），只是本地名字不同。
import appConfig from './_config.js';

console.log('\n--- 2. 默认导出可以任意命名 ---');
console.log('config === appConfig ?', config === appConfig);
appConfig.debug = false; // 修改属性会影响 config，因为它们是同一个对象
console.log('改 appConfig.debug 之后，config.debug =', config.debug);

// 注意：上面改的是"对象的属性"，这是允许的。
// 不允许的是给导入进来的绑定本身重新赋值，例如 appConfig = {}，那会直接报错。

// ---------------------------------------------------------------------------
// 3. 同一文件里重复导入同一模块是合法的（会自动去重）
// ---------------------------------------------------------------------------

// ESM 规范允许多次写 import 同一路径，模块只会被求值一次，拿到的是同一实例。
// 这不算错误写法，但真实项目里通常会把它们合并成一行，方便阅读。
import { CONFIG_VERSION } from './_config.js';
console.log('\n--- 3. 重复导入同一模块 ---');
console.log('CONFIG_VERSION =', CONFIG_VERSION, '（同一模块的具名导出，见 03）');

// ---------------------------------------------------------------------------
// 4. export default 的语法形态
// ---------------------------------------------------------------------------

// 下面这些都是合法写法（此处只做展示，不真的导出）：
//   export default 42;                       // 直接一个值
//   export default 'hello';                  // 字符串
//   export default { name: 'x' };            // 对象字面量
//   export default function () {}            // 匿名函数表达式
//   export default function namedFn() {}     // 具名函数表达式
//   export default class {}                  // 匿名类
//   export default class MyClass {}          // 具名类
//
// 而下面这些是**语法错误**（因为后面必须是表达式，不能是声明语句）：
//   export default const a = 1;              // ✗
//   export default function f() {};          // 注意：末尾不要写分号，虽然多数情况能跑

console.log('\n--- 4. export default 可以用在各种表达式上 ---');

// ---------------------------------------------------------------------------
// 5. default 的本质：它只是一个名为 "default" 的具名导出
// ---------------------------------------------------------------------------

// 用动态 import() 拿到模块的"命名空间对象"，可以看到它身上有一个 key 叫 default。
const ns = await import('./_config.js');
console.log('\n--- 5. default 的本质是名为 default 的导出 ---');
console.log('命名空间对象的键：', Object.keys(ns).join(', '));
console.log('ns.default === config ?', ns.default === config);

// 因为 default 只是普通导出名，所以下面这种写法与 `import config from ...` 完全等价：
import { default as configAgain } from './_config.js';
console.log('import { default as configAgain } 拿到的还是同一个对象：', configAgain === config);
console.log('注意 default 是 JS 的保留字，作为变量名使用需要借助 as 改名。');

// ---------------------------------------------------------------------------
// 6. 默认导出的模块长什么样（示意，不实际执行）
// ---------------------------------------------------------------------------

// 若把 _config.js 简化成最小形态，它等价于：
//   const config = { appName: 'javascript-examples', ... };
//   export default config;
//
// 使用方：
//   import config from './_config.js';        // 默认导入
//   import anything from './_config.js';      // 名字随便起
//   import { default as x } from './_config.js'; // 完整写法

console.log('\n--- 6. 小结 ---');
console.log('默认导出：一个模块最多一个，导出的是"值"；导入时不要花括号，名字随便起。');
console.log('default 本质上是名为 default 的具名导出，所以可以和具名导出混合（见 03）。');
