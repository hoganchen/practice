/**
 * ============================================================================
 * 知识点：导入 JSON 数据 —— import ... with { type: 'json' } 与 fs 读取两种方式
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】进阶
 * 【前置知识】19_modules/02_default_export.js、19_modules/10_import_meta.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    在 ESM 里读取一个 .json 文件，主要有三种方式：
 *      (1) 导入属性（import attributes）：
 *          import data from './_data.json' with { type: 'json' };
 *          让引擎在**加载阶段**就把 JSON 解析成对象，并纳入模块图与缓存。
 *      (2) createRequire + require：
 *          const require = createRequire(import.meta.url);
 *          const data = require('./_data.json');   // CommonJS 的老办法，同步解析
 *      (3) 手动读文件再解析：
 *          const text = fs.readFileSync(path, 'utf8');
 *          const data = JSON.parse(text);
 *
 * 2. 为什么需要
 *    (1) 配置、i18n 文案、mock 数据天然是 JSON。用 import 的方式读，
 *        路径可以被静态分析，打包器能把它内联进产物，浏览器里也能直接 import。
 *      (2) with { type: 'json' } 是**显式声明**：告诉引擎"这个文件当 JSON 解析"，
 *        避免 .json 被误当作 JS 执行（早期没有这个声明时，有人用 .json 放 JS 代码，
 *        造成过安全问题）。
 *      (3) fs 手动读取则更灵活：可以在运行时决定路径、可以读大文件、可以捕获错误、
 *        可以读到"文件当前的最新内容"而不受模块缓存影响。
 *
 * 3. 核心语法要点
 *    (1) 静态导入 JSON 必须写导入属性 `with { type: 'json' }`，
 *        漏写会报 ERR_IMPORT_ATTRIBUTE_MISSING。
 *    (2) JSON 模块**只提供默认导出**（default），没有具名导出。
 *        所以 `import { name } from './x.json'` 会报
 *        "does not provide an export named 'name'"。
 *    (3) 动态导入同样要带属性：
 *        const ns = await import('./x.json', { with: { type: 'json' } });
 *        然后 ns.default 才是数据。
 *    (4) 语法演进：早期是 `assert { type: 'json' }`（import assertions），
 *        后来语言标准改为 `with { type: 'json' }`（import attributes）。
 *        Node 20.10+ 支持 with 形式；assert 形式已被废弃并最终移除。
 *    (5) JSON 模块的默认导出是**冻结语义之外的对象**：它就是一个普通对象，
 *        可以改，但改的是模块缓存里的那一份，不会写回文件。
 *
 * 4. 常见陷阱
 *    (1) 忘了 with { type: 'json' } —— 报 ERR_IMPORT_ATTRIBUTE_MISSING。
 *    (2) 以为可以具名导入 JSON 的字段 —— 不行，只能 `import data from`。
 *    (3) 用 fs 读文件时忘记指定 'utf8'，拿到的是 Buffer，JSON.parse 会失败。
 *    (4) 用 fs 时忘记用 import.meta.dirname 拼路径，换目录启动就找不到文件。
 *    (5) 以为改了 import 进来的对象会写回文件 —— 不会，要写文件请用 fs.writeFileSync。
 *    (6) JSON 不支持注释、单引号、尾随逗号、undefined/NaN，这些都会让 JSON.parse 抛错。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/13_json_import.js
 *
 * 【预期输出】
 *   分别用导入属性、createRequire、fs 三种方式读取 _data.json，
 *   对比它们的结果、缓存行为与错误处理差异。
 * ============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// ---------------------------------------------------------------------------
// 1. 方式一：静态导入 + 导入属性 with { type: 'json' }
// ---------------------------------------------------------------------------

// 关键点：必须写 with { type: 'json' }，否则会报 ERR_IMPORT_ATTRIBUTE_MISSING。
// 得到的是 JSON 文件里的顶层值（这里是对象），直接赋给 data 这个默认导入名。
import data from './_data.json' with { type: 'json' };

console.log('--- 1. import ... with { type: \'json\' } ---');
console.log('data.name =', data.name);
console.log('data.version =', data.version);
console.log('data.keywords =', JSON.stringify(data.keywords));
console.log('data.author.name =', data.author.name);
console.log('data.features.length =', data.features.length);
console.log('data.meta（JSON 里的 null 会变成 JS 的 null） =', data.meta);
console.log('可以直接点出嵌套字段：data.features[0].title =', data.features[0].title);

// ---------------------------------------------------------------------------
// 2. JSON 模块只有默认导出，没有具名导出
// ---------------------------------------------------------------------------

console.log('\n--- 2. JSON 模块只有 default ---');

// 用命名空间导入可以看到它身上到底有什么：
import * as dataNs from './_data.json' with { type: 'json' };
console.log('命名空间的键：', Object.keys(dataNs), '（只有 default）');
console.log('dataNs.default === data ?', dataNs.default === data);

// 下面这种写法会报错（只是演示，不要取消注释）：
//   import { name } from './_data.json' with { type: 'json' };
//   → SyntaxError: The requested module './_data.json' does not provide
//     an export named 'name'
console.log('所以只能 `import data from "./x.json"`，不能 `import { name } from "./x.json"`。');

// ---------------------------------------------------------------------------
// 3. 动态导入 JSON 也要带属性
// ---------------------------------------------------------------------------

console.log('\n--- 3. 动态导入 JSON ---');

// 第二个参数是"选项对象"，里面的 with 就是导入属性。
const dynamicNs = await import('./_data.json', { with: { type: 'json' } });
console.log('dynamicNs.default.name =', dynamicNs.default.name);
console.log('与静态导入拿到的是同一个对象吗？', dynamicNs.default === data, '（模块缓存生效）');

// 反例：漏掉属性会怎样？这里用 try/catch 实测一下。
try {
  await import('./_data.json');
  console.log('没报错？这不应该发生。');
} catch (err) {
  console.log('漏写导入属性时的报错：', err.code || err.name);
  console.log('  ', String(err.message).split('\n')[0]);
}

// ---------------------------------------------------------------------------
// 4. 方式二：createRequire + require（CommonJS 风格）
// ---------------------------------------------------------------------------

console.log('\n--- 4. createRequire 读取 JSON ---');

// createRequire(import.meta.url) 造出一个以当前模块为基准的 require。
// CommonJS 的 require 遇到 .json 会自动读文件并 JSON.parse，不需要任何属性声明。
const require = createRequire(import.meta.url);
const dataViaRequire = require('./_data.json');

console.log('dataViaRequire.name =', dataViaRequire.name);
console.log('与 import 拿到的是同一个对象吗？', dataViaRequire === data);
console.log('（Node 对同一个路径的 require 与 import 共享缓存，所以是同一个对象）');
console.log('注意：若在这里修改 dataViaRequire.features，data 也会跟着变：');
dataViaRequire.features.push({ id: 4, title: '（这是运行时加进去的）', done: false });
console.log('  修改后 data.features.length =', data.features.length);
console.log('  但这只是改了内存里的对象，文件本身没变（见下一节验证）。');

// ---------------------------------------------------------------------------
// 5. 方式三：fs 读文件 + JSON.parse（最灵活）
// ---------------------------------------------------------------------------

console.log('\n--- 5. fs + JSON.parse ---');

// 用 import.meta.dirname 定位到本文件所在目录，再拼出 JSON 路径。
// 这样无论从哪个目录启动 node，都能找到文件。
const jsonPath = path.join(import.meta.dirname, '_data.json');
console.log('文件路径 =', jsonPath);

const rawText = fs.readFileSync(jsonPath, 'utf8'); // 一定要写 'utf8'
const dataViaFs = JSON.parse(rawText);

console.log('dataViaFs.name =', dataViaFs.name);
console.log('dataViaFs.features.length =', dataViaFs.features.length, '← 文件里的原始值（没有被上面的修改影响）');
console.log('说明：fs 读的是磁盘上的最新内容，和模块缓存无关；');
console.log('      而 import/require 读的是**进程内缓存的那一份对象**。');

// fs 方式可以自己控制错误处理
try {
  const missing = path.join(import.meta.dirname, '_not-exist.json');
  JSON.parse(fs.readFileSync(missing, 'utf8'));
} catch (err) {
  console.log('读取不存在的 JSON 文件时：', err.code, '-', err.constructor.name);
}

// JSON.parse 对格式要求很严格，这些都会抛 SyntaxError：
const badCases = ['{ a: 1 }', "{ 'a': 1 }", '{ "a": 1, }', '{ "a": undefined }'];
console.log('\nJSON.parse 的严格性实测：');
for (const bad of badCases) {
  try {
    JSON.parse(bad);
    console.log(`  ${bad.padEnd(20)} → 居然解析成功`);
  } catch (err) {
    console.log(`  ${bad.padEnd(20)} → ${err.constructor.name}`);
  }
}
console.log('（JSON 不允许无引号键、单引号、尾随逗号、undefined，这些是 JS 语法而非 JSON 语法）');

// ---------------------------------------------------------------------------
// 6. 三种方式对比与选型
// ---------------------------------------------------------------------------

console.log('\n--- 6. 三种方式对比 ---');
console.log('import ... with { type: "json" }  静态、可被打包器内联、缓存到模块图、只能 default 导入');
console.log('createRequire + require           同步、CJS 风格、在 ESM 里也能用、同样走模块缓存');
console.log('fs.readFileSync + JSON.parse      最灵活、能读最新内容、能 try/catch、需要自己拼路径');
console.log('建议：构建期固定的配置用 import；运行时可变的文件用 fs。');

// ---------------------------------------------------------------------------
// 7. 顺便一提：写回 JSON 文件
// ---------------------------------------------------------------------------

console.log('\n--- 7. 写 JSON 文件（演示后即删除，不污染仓库） ---');
// 需要写临时文件时，请一律放到 os.tmpdir() 下，不要写进仓库目录。
import os from 'node:os';

const tmpJson = path.join(os.tmpdir(), `demo_write_${process.pid}.json`);
fs.writeFileSync(tmpJson, JSON.stringify({ hello: '世界', n: 1 }, null, 2), 'utf8');
console.log('写入临时文件：', tmpJson);
console.log('读回来：', fs.readFileSync(tmpJson, 'utf8').replace(/\n/g, ' '));
fs.unlinkSync(tmpJson); // 用完即删
console.log('已删除临时文件。');
