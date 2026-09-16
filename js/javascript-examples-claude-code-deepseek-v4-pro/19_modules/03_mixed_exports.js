/**
 * ============================================================================
 * 知识点：混合使用默认导出与具名导出，以及对应的导入语法
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】入门
 * 【前置知识】19_modules/01_named_exports.js、19_modules/02_default_export.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "混合导出"指同一个模块里既有默认导出（export default），又有一个或多个
 *    具名导出（export const / export function ...）。例如 _config.js：
 *      export const CONFIG_VERSION = '1.0.0';
 *      export function describeConfig() { ... }
 *      export default config;              // 主角
 *    使用方可以三种方式导入它。
 *
 * 2. 为什么需要
 *    现实中的模块往往"有一个主体 + 若干零散工具"：
 *      - 主体（配置对象、主类、主函数）用默认导出，使用方随便起名，写起来最短；
 *      - 零散常量/小工具用具名导出，按需引入，不会因为引了默认导出而顺带
 *        把无关的东西也带进来。
 *    两者互补：默认导出负责"主角"，具名导出负责"配件"。
 *
 * 3. 核心语法要点
 *    假设模块 m.js 里有：export default X; export const A; export function b() {}
 *      (1) 只要默认导出：      import X from './m.js';
 *      (2) 只要具名导出：      import { A, b } from './m.js';
 *      (3) 两者都要：          import X, { A, b } from './m.js';
 *                              ↑ 默认导入在前，且必须写在花括号**前面**
 *      (4) 全部打包：          import * as ns from './m.js';
 *                              ns.default 是默认导出，ns.A / ns.b 是具名导出
 *      (5) 只要默认并改名：    import { default as X } from './m.js';
 *
 * 4. 常见陷阱
 *    (1) 顺序写反：`import { A }, X from '...'` 是语法错误；
 *        默认导入永远排在花括号前面。
 *    (2) 混合导入时，默认导入和具名导入的名字不能重名（同一作用域两个绑定）。
 *    (3) 混用 CommonJS 的思维：CJS 里 module.exports 上挂的所有属性都"浑然一体"，
 *        而 ESM 里 default 与具名导出是**并列的兄弟**，没有包含关系。
 *    (4) 只写 `import X from './m.js'` 时，A、b 依然存在于模块里，
 *        只是本文件没引入，无法使用。
 *    (5) 重新给 default 赋值、或给具名导入赋值，都会报错（绑定只读）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/03_mixed_exports.js
 *
 * 【预期输出】
 *   演示同一种混合模块的三种导入方式及其结果对比。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 方式一：只要默认导出
// ---------------------------------------------------------------------------

import config from './_config.js';

console.log('--- 1. 只要默认导出 ---');
console.log('config =', JSON.stringify(config));
console.log('（此时本文件里没有 CONFIG_VERSION / describeConfig 这两个名字）');

// ---------------------------------------------------------------------------
// 2. 方式二：只要具名导出
// ---------------------------------------------------------------------------

import { CONFIG_VERSION, DEFAULT_LOCALE, describeConfig } from './_config.js';

console.log('\n--- 2. 只要具名导出 ---');
console.log('CONFIG_VERSION =', CONFIG_VERSION);
console.log('DEFAULT_LOCALE =', DEFAULT_LOCALE);
console.log('describeConfig() =', describeConfig());

// ---------------------------------------------------------------------------
// 3. 方式三：默认 + 具名，一起导入（推荐写法）
// ---------------------------------------------------------------------------

// 语法：import 默认导出的名字, { 具名导出... } from '路径';
// 默认导入必须写在花括号之前，用逗号分隔。
import themeConfig, { CONFIG_VERSION as VERSION_ALIAS } from './_config.js';

console.log('\n--- 3. 默认 + 具名 混合导入 ---');
console.log('themeConfig.appName =', themeConfig.appName);
console.log('VERSION_ALIAS（具名导出的别名）=', VERSION_ALIAS);
console.log('themeConfig 与第 1 节导入的 config 是同一个对象：', themeConfig === config);

// ---------------------------------------------------------------------------
// 4. 方式四：命名空间导入，一个变量装下所有导出
// ---------------------------------------------------------------------------

import * as configNs from './_config.js';

console.log('\n--- 4. 命名空间导入 ---');
console.log('命名空间里的键：', Object.keys(configNs).join(', '));
console.log('configNs.default.appName =', configNs.default.appName);
console.log('configNs.CONFIG_VERSION =', configNs.CONFIG_VERSION);
console.log('configNs.describeConfig() =', configNs.describeConfig());
console.log('注意 default 在命名空间对象里就是一个普通属性，详见 06_namespace_import.js');

// ---------------------------------------------------------------------------
// 5. 反例：这些写法会报错（只做说明，不实际执行）
// ---------------------------------------------------------------------------

console.log('\n--- 5. 常见的错误写法（仅说明，不执行） ---');
// 错误 1：默认导入加了花括号 —— 会去找名为 config 的具名导出，找不到
//   import { config } from './_config.js';        // ✗ SyntaxError
console.log('✗ import { config } from ... —— default 导出不能用花括号接');
// 错误 2：顺序写反
//   import { CONFIG_VERSION }, config from './_config.js';   // ✗ SyntaxError
console.log('✗ import { A }, X from ... —— 默认导入必须写在花括号之前');
// 错误 3：导入不存在的具名导出
//   import { notExist } from './_config.js';      // ✗ SyntaxError（链接期就失败）
console.log('✗ import { notExist } from ... —— 名字不存在会在链接阶段直接失败');

// ---------------------------------------------------------------------------
// 6. 混合导出在真实项目中的典型形态
// ---------------------------------------------------------------------------

// 一个常见的"半成品"库模块长这样：
//   export default class HttpClient { ... }   // 主角：类
//   export const DEFAULT_TIMEOUT = 5000;      // 配件：常量
//   export function createClient(opts) { ... }// 配件：工厂函数
// 使用方按需选择：
//   import HttpClient, { createClient } from './http.js';
console.log('\n--- 6. 小结 ---');
console.log('混合导出 = default（主角，最多一个）+ named（配件，任意多个）');
console.log('导入语法：import 默认名, { 具名1, 具名2 as 别名 } from "路径";');
