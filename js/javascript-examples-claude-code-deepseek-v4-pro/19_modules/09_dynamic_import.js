/**
 * ============================================================================
 * 知识点：动态 import() —— 返回 Promise、按需加载、条件加载
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】进阶
 * 【前置知识】19_modules/01_named_exports.js、19_modules/06_namespace_import.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    除了写在顶层的静态 `import ... from '...'`，ESM 还提供了一种"函数式"的
 *    导入方式：`import(说明符)`。它不是语句而是**运算符/函数调用**：
 *      const ns = await import('./_math-utils.js');   // 返回 Promise
 *      ns.add(1, 2);
 *    它返回一个 Promise，resolve 的结果是该模块的**命名空间对象**，
 *    所以要用 .then() 或 await 接收，并用 ns.xxx 访问导出。
 *
 * 2. 为什么需要
 *    (1) 按需加载（懒加载）：像"点击按钮才打开的重型图表库"，
 *        没必要在首屏就下载它。动态 import 让模块只在真正需要时才被请求和求值。
 *    (2) 条件加载：路径可以是变量，可以写在 if / 循环 / 事件回调里，
 *        这是静态 import 做不到的。
 *      import(`./locales/${lang}.js`)   // 运行时才决定加载哪个语言包
 *    (3) 打破循环依赖：把其中一方的导入推迟到运行时。
 *    (4) 顶层 await 配合：动态 import 可以在模块顶层 await，
 *        从而让模块的初始化流程依赖另一个异步加载的模块。
 *
 * 3. 核心语法要点
 *    (1) 返回值一定是 Promise：`import(x).then(ns => ...)` 或 `const ns = await import(x)`。
 *    (2) 拿到的是命名空间对象：默认导出在 ns.default，具名导出在 ns.xxx；
 *        也可以解构：`const { add } = await import('./m.js')`（注意会丢掉实时性）。
 *    (3) 路径可以是任意表达式（变量、模板字符串），但必须能被解析成 URL/路径；
 *        相对路径以**当前模块**为基准解析。
 *    (4) 同一个模块被动态 import 多次，模块也只求值一次，
 *        每次拿到的是同一个命名空间对象（模块缓存）。
 *    (5) 加载失败（文件不存在、语法错误、导出名不匹配）时 Promise 会 reject，
 *        因此可以用 try/catch 捕获——这是静态 import 做不到的。
 *
 * 4. 常见陷阱
 *    (1) 忘了 await / .then()：拿到的是 Promise 而不是模块，
 *        打印出来是 Promise { <pending> }，访问 ns.add 会报 undefined。
 *    (2) 用变量拼路径会让打包工具无法静态分析，产物里可能缺少该模块
 *        （需要配置动态导入的 glob 规则或魔法注释）。
 *    (3) 在循环里对同一模块反复动态 import 虽然不会重复求值，
 *        但每次都产生 Promise 与微任务开销，建议缓存起来。
 *    (4) 动态 import 的路径不做"扩展名自动补全"，仍然要写全（除非用打包器）。
 *    (5) 试图在 CJS 里用动态 import 是可行的（返回 Promise），
 *        但 CJS 没有顶层 await，只能放进 async 函数或用 .then()。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/09_dynamic_import.js
 *
 * 【预期输出】
 *   演示 await import() 的返回值、条件加载、按需缓存、
 *   失败时的 reject，以及路径由变量决定的用法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本用法：await import() 返回命名空间对象
// ---------------------------------------------------------------------------

console.log('--- 1. await import() 的基本用法 ---');

// 注意这里用的是"调用"语法，不是 import 声明。
// 它返回 Promise<命名空间对象>，所以可以直接 await。
const math = await import('./_math-utils.js');

console.log('返回值的类型：', Object.prototype.toString.call(math));
console.log('math.add(2, 3) =', math.add(2, 3));
console.log('math.PI =', math.PI);
console.log('默认导出在 math.default 上（_math-utils.js 没有默认导出）：', math.default);

// 也可以解构（注意：解构出来的是快照，见 06/07 的说明）
const { multiply, Vector2 } = await import('./_math-utils.js');
console.log('解构后直接调用 multiply(3, 4) =', multiply(3, 4));
console.log('解构后 new Vector2(1, 1).length() =', new Vector2(1, 1).length().toFixed(4));

// 不用 await 的话，拿到的是 Promise，这一点最容易踩坑：
const maybePromise = import('./_config.js');
console.log('\n不 await 时拿到的是：', maybePromise.constructor.name);
console.log('它是一个 thenable，需要 .then() 或 await 才能取到模块：');
const cfg = await maybePromise;
console.log('await 之后：cfg.appName =', cfg.default.appName);

// ---------------------------------------------------------------------------
// 2. 模块缓存：动态 import 也只会求值一次
// ---------------------------------------------------------------------------

console.log('\n--- 2. 动态 import 的缓存行为 ---');

const first = await import('./_counter.js');
const second = await import('./_counter.js');

console.log('两次 import 是同一个命名空间对象吗？', first === second);
first.increment(7);
console.log('通过 first 改成：', first.count);
console.log('通过 second 读出来：', second.count, '（同一份模块状态）');

// 小技巧：如果确实要"重新加载"（比如热重载、测试隔离），
// 可以在 URL 后面加查询串强制产生一个新的模块实例：
const fresh = await import('./_counter.js?fresh=1');
console.log('加上查询串 ?fresh=1 后是新的实例：', fresh !== first);
console.log('新实例里的 count 从 0 开始：', fresh.count);
console.log('（注意：这只在 Node/浏览器能按 URL 解析的开发场景下有意识使用）');

// ---------------------------------------------------------------------------
// 3. 条件加载：根据运行时状态决定加载谁
// ---------------------------------------------------------------------------

console.log('\n--- 3. 条件加载 ---');

/**
 * 一个常见的需求：根据用户配置决定加载哪个"后端实现"。
 * 静态 import 无法做到这一点（因为 import 声明只能写在顶层且路径是字面量）。
 * @param {string} kind 实现类型
 * @returns {Promise<object>} 模块命名空间对象
 */
async function loadBackend(kind) {
  if (kind === 'math') {
    return import('./_math-utils.js');
  }
  if (kind === 'counter') {
    return import('./_counter.js');
  }
  throw new Error(`未知的后端类型：${kind}`);
}

const backendA = await loadBackend('math');
console.log('加载 math 后端：add(10, 20) =', backendA.add(10, 20));

const backendB = await loadBackend('counter');
console.log('加载 counter 后端：getHistorySize() =', backendB.getHistorySize());

// 用一个映射表把"名字 → 路径"存起来，是很实用的动态加载模式
const registry = {
  config: './_config.js',
  math: './_math-utils.js',
};

console.log('\n通过映射表按需加载：');
for (const [name, specifier] of Object.entries(registry)) {
  const mod = await import(specifier);
  console.log(`  ${name.padEnd(7)} → 导出的键：${Object.keys(mod).join(', ')}`);
}

// ---------------------------------------------------------------------------
// 4. 加载失败时 Promise 会 reject，可以 try/catch
// ---------------------------------------------------------------------------

console.log('\n--- 4. 动态 import 失败的捕获 ---');

// 静态 import 一个不存在的文件会在"链接阶段"直接让程序崩溃，无法捕获；
// 动态 import 则是返回一个 reject 的 Promise，可以优雅处理。
try {
  await import('./_not-exist-module.js');
  console.log('这行不会被执行');
} catch (err) {
  console.log('捕获到加载失败：', err.constructor.name);
  console.log('错误码 err.code =', err.code);
  console.log('错误信息首行：', String(err.message).split('\n')[0]);
}

// 这个特性非常适合"可选依赖"：装了就用，没装就降级。
try {
  await import('./_optional-plugin.js');
  console.log('可选插件已加载');
} catch {
  console.log('可选插件不存在，走降级分支（这在真实项目里很常见）。');
}

// ---------------------------------------------------------------------------
// 5. 懒加载：把耗时的初始化推迟到真正需要时
// ---------------------------------------------------------------------------

console.log('\n--- 5. 懒加载模式 ---');

/**
 * 一个"懒加载单例"：第一次调用时才真正 import，之后复用缓存。
 * 这是前端里"点击才加载编辑器/图表库"的标准写法。
 */
function createLazyLoader(specifier) {
  let cached = null; // 缓存已经加载好的模块
  return async function load() {
    if (cached) {
      console.log('   （命中缓存，不再重新加载）');
      return cached;
    }
    console.log('   （首次加载，执行 import）');
    cached = await import(specifier);
    return cached;
  };
}

const loadMathLazy = createLazyLoader('./_math-utils.js');
console.log('第一次调用懒加载器：');
const lazy1 = await loadMathLazy();
console.log('第二次调用懒加载器：');
const lazy2 = await loadMathLazy();
console.log('两次拿到同一个模块：', lazy1 === lazy2, '，lazy1.add(1, 1) =', lazy1.add(1, 1));

// ---------------------------------------------------------------------------
// 6. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 6. 静态 import 与动态 import 对比 ---');
console.log('静态 import： 顶层、字面量路径、编译期确定、不能 try/catch、tree-shaking 友好');
console.log('动态 import()：任意位置、路径可为变量、返回 Promise、可 try/catch、按需加载');
console.log('两者共享同一份模块缓存：同一路径只求值一次。');
