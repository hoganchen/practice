/**
 * ============================================================================
 * 知识点：命名空间导入 import * as ns，以及命名空间对象的特性
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【难度等级】进阶
 * 【前置知识】19_modules/01_named_exports.js、19_modules/03_mixed_exports.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    命名空间导入把一个模块的**所有导出**装进一个对象：
 *      import * as ns from './_math-utils.js';
 *    之后用 ns.add(...)、ns.PI 这样访问，default 导出在 ns.default 上。
 *
 * 2. 为什么需要
 *    (1) 名字太多或压根不知道有哪些导出时，一个 ns 变量收全部，避免写一长串花括号。
 *    (2) 一个个模块当"工具箱"用时，ns.xxx 自带命名空间前缀，可读性好、不易重名。
 *    (3) 某些库提供几十个工具函数，逐个具名导入太啰嗦，ns 形式更清晰。
 *    (4) 分析用途：可以用 Object.keys(ns) 在运行时列出模块的全部导出，
 *        这对调试、写文档、做插件系统都有用。
 *
 * 3. 核心语法要点
 *    命名空间对象不是普通对象，它是"模块命名空间外来对象"（Module Namespace
 *    Exotic Object），有四条特殊规则：
 *      (1) 只读：给属性赋值会**抛 TypeError**（普通对象在非严格模式下会静默失败）。
 *      (2) 不可扩展：不能给它添加新属性，也不能删除已有属性。
 *      (3) 实时绑定：ns.count 每次访问都去读模块里的最新值，不是快照。
 *      (4) 键有序：Object.keys(ns) 返回的名字按**字典序**排列（而不是书写顺序）。
 *    另外它的 Symbol.toStringTag 是 'Module'，所以
 *    Object.prototype.toString.call(ns) === '[object Module]'。
 *
 * 4. 常见陷阱
 *    (1) 解构会**丢掉实时性**：`const { count } = ns` 拿到的是当前值的快照，
 *        之后模块内部改了 count，这个局部变量不会跟着变。
 *        要用实时值就每次都写 ns.count。这一点与静态 `import { count }` 相反。
 *    (2) 命名空间对象不能当普通对象序列化：JSON.stringify(ns) 只输出可枚举属性，
 *        函数会丢失。
 *    (3) 别把 ns 当"模块的 this"或"模块对象"，它只是导出的集合视图。
 *    (4) 浏览器/打包器场景下，`import * as ns` 会让 tree-shaking 失效，
 *        因为它可能用到任意一个导出，打包器不敢删。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 19_modules/06_namespace_import.js
 *
 * 【预期输出】
 *   演示命名空间对象的读取、键排序、只读性、实时绑定，
 *   以及"解构后失去实时性"的对比。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本用法：一个变量装下整个模块
// ---------------------------------------------------------------------------

import * as math from './_math-utils.js';

console.log('--- 1. 命名空间导入的基本用法 ---');
console.log('math.PI =', math.PI);
console.log('math.E =', math.E);
console.log('math.add(3, 4) =', math.add(3, 4));
console.log('math.MODULE_NAME =', math.MODULE_NAME);
console.log('用前缀调用，一眼能看出函数来自哪个模块，这也是它的主要价值。');

// ---------------------------------------------------------------------------
// 2. 键的枚举顺序：字典序，而不是书写顺序
// ---------------------------------------------------------------------------

import * as counter from './_counter.js';

console.log('\n--- 2. 命名空间对象的键按字典序排列 ---');
console.log('_counter.js 里的键：');
for (const key of Object.keys(counter)) {
  console.log('   -', key);
}
// _counter.js 里声明的顺序是 count、lastAction、increment、decrement、reset...
// 但 Object.keys 输出的是按字母排好序的结果，这是规范规定的行为，
// 目的是让模块的导出列表在任何实现下都有一致的顺序（便于快照测试与缓存）。

// ---------------------------------------------------------------------------
// 3. 只读：赋值会抛 TypeError
// ---------------------------------------------------------------------------

console.log('\n--- 3. 命名空间对象是只读的 ---');

try {
  counter.count = 999; // ESM 代码永远是严格模式，这里会抛错
  console.log('居然没报错？这不应该发生。');
} catch (err) {
  console.log('给 ns.count 赋值失败：', err.constructor.name, '-', err.message);
}

try {
  counter.brandNewProperty = 'x'; // 也不能新增属性
  console.log('居然新增成功了？这不应该发生。');
} catch (err) {
  console.log('给 ns 新增属性失败：', err.constructor.name, '-', err.message);
}

// 用属性描述符看看底层特征：configurable 为 false，说明不能删也不能改
const desc = Object.getOwnPropertyDescriptor(counter, 'count');
console.log('count 的属性描述符：', JSON.stringify(desc));

// ---------------------------------------------------------------------------
// 4. 实时绑定：读 ns.xxx 永远是最新值
// ---------------------------------------------------------------------------

console.log('\n--- 4. 命名空间属性是实时绑定 ---');
console.log('初始 counter.count =', counter.count);
counter.increment(5);
console.log('increment(5) 之后 counter.count =', counter.count);
counter.increment(5);
console.log('再 increment(5) 后 counter.count =', counter.count);
console.log('（每次都直接读模块内部的那个 let count，所以永远是最新值）');

// ---------------------------------------------------------------------------
// 5. 陷阱：解构会丢掉实时性
// ---------------------------------------------------------------------------

// 解构是"一次性取值"，取出来的只是那一刻的快照。
const { count: snapshotCount } = counter;

console.log('\n--- 5. 解构命名空间会失去实时性 ---');
counter.increment(100);
console.log('counter.count（实时读取） =', counter.count);
console.log('snapshotCount（解构快照） =', snapshotCount);
console.log('两者不再相等，说明解构拿到的是值拷贝。');

// 对比：静态具名导入 `import { count } from './_counter.js'` 得到的**是实时绑定**，
// 每次都反映最新值。详见 07_live_bindings.js。

// ---------------------------------------------------------------------------
// 6. 命名空间对象的其它特征
// ---------------------------------------------------------------------------

console.log('\n--- 6. 其它特征 ---');
console.log("Object.prototype.toString.call(counter) =", Object.prototype.toString.call(counter));
console.log("counter[Symbol.toStringTag] =", counter[Symbol.toStringTag]);
console.log("'increment' in counter =", 'increment' in counter);
console.log("'notExist' in counter =", 'notExist' in counter);
console.log('默认导出会出现在 default 属性上（_counter.js 没有默认导出，所以没有这个键）。');
console.log('counter.default =', counter.default);

// 命名空间对象上的所有属性都是可枚举、可 writable:true 但 [[Set]] 返回 false 的怪东西，
// 这正是"只读"与"描述符看起来可写"并存的由来。
console.log('\n--- 7. 命名空间导入 vs 具名导入 ---');
console.log('具名导入：import { add } from "./m.js";  直接调用 add()，tree-shaking 友好');
console.log('命名空间：import * as ns from "./m.js"; 调用 ns.add()，适合工具箱式模块');
