/**
 * ============================================================================
 * 知识点：typeof 运算符的用法、全部返回值与 typeof null 的历史 bug
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】入门
 * 【前置知识】03_data_types/01_primitives_overview.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    typeof 是一元运算符（不是函数，虽然长得像），用来得到一个值的类型名称，
 *    返回值永远是下列 8 个字符串之一：
 *      'undefined' | 'object' | 'boolean' | 'number' | 'bigint'
 *      | 'string' | 'symbol' | 'function'
 *    写 typeof(x) 也能用，但那只是把它当括号表达式，本质仍是运算符。
 *
 * 2. 为什么需要
 *    因为 JS 是动态类型语言：变量的类型由运行时的值决定，同一变量可以先后
 *    装不同类型的值。typeof 让我们在运行时判断"我拿到的东西是什么"，
 *    从而做分支处理（例如参数校验、环境探测、降级兼容）。
 *
 * 3. 核心语法要点
 *    · typeof 接受一个"操作数"，不写括号也行：typeof 42。
 *    · 对未声明的变量使用 typeof 不会抛 ReferenceError，而是返回 'undefined'。
 *      这是它区别于其它运算符的最重要特性，常用来做"功能探测"。
 *      例外：如果该名字是通过 let/const 声明但尚在暂时性死区（TDZ），
 *      仍然会抛 ReferenceError。
 *    · 对函数返回 'function'，对数组 / null / 普通对象 / 正则 / Date 都返回 'object'。
 *    · 想要更精确的对象分类，用 Object.prototype.toString.call(v) 或
 *      Array.isArray / v instanceof X。
 *
 * 4. 常见陷阱
 *    · typeof null === 'object'：这是 JS 诞生第一天（1995 年）留下的 bug，
 *      原因是早期实现用"类型标签 + 值"表示变量，对象的标签为 000，
 *      而 null 被表示为全零的空指针，标签恰好也是 000，于是被误判为 object。
 *      修复它会破坏大量既有网页代码，所以规范将错就错保留至今。
 *    · typeof 不能区分数组与普通对象，也不能区分各种具体类。
 *    · typeof NaN === 'number'：NaN 的类型仍是 number（只是"不是一个数"）。
 *    · typeof 包装对象 new Number(1) 得到 'object'，而不是 'number'。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/02_typeof_operator.js
 *
 * 【预期输出】
 *   打印各种值的 typeof 结果表、未声明变量的安全探测、typeof null 的 bug 演示，
 *   以及更精确的类型判断替代方案。全部通过，退出码 0。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 每种原始类型的 typeof
// ---------------------------------------------------------------------------

console.log('--- 1. 原始值的 typeof ---');

// 注意：typeof 是运算符，typeof 42 与 typeof(42) 等价。
console.log("typeof 'abc'      =", typeof 'abc');
console.log('typeof 42         =', typeof 42);
console.log('typeof true       =', typeof true);
console.log('typeof undefined  =', typeof undefined);
console.log('typeof Symbol()   =', typeof Symbol('s'));
console.log('typeof 10n        =', typeof 10n);
console.log('typeof null       =', typeof null, '← 历史 bug，见第 4 节');

// ---------------------------------------------------------------------------
// 2. 对象与函数的 typeof
// ---------------------------------------------------------------------------

console.log('--- 2. 对象 / 函数的 typeof ---');

console.log('typeof {}                 =', typeof {});
console.log('typeof []                 =', typeof [], '（数组无法用 typeof 区分）');
console.log('typeof function () {}     =', typeof function () {});
console.log('typeof (() => {})         =', typeof (() => {}), '（箭头函数同样是 function）');
console.log('typeof new Date()         =', typeof new Date());
console.log('typeof /abc/              =', typeof /abc/);
console.log('typeof new Map()          =', typeof new Map());

// 类的本质是函数，所以 typeof 一个 class 得到 'function'。
class Demo {}
console.log('typeof class Demo {}      =', typeof Demo);

// ---------------------------------------------------------------------------
// 3. typeof 对"未声明变量"是安全的
// ---------------------------------------------------------------------------

console.log('--- 3. 安全探测未声明的标识符 ---');

// 直接读取一个从未声明过的变量会抛 ReferenceError：
try {
  // eslint-disable-next-line no-undef
  console.log(notDeclaredAnywhere);
} catch (err) {
  console.log('直接读取未声明变量 →', err.name + ':', err.message);
}

// 但 typeof 一个未声明的标识符不会抛错，只返回 'undefined'。
// 这正是各种"环境探测"代码能安全运行的原因。
console.log("typeof notDeclaredAnywhere =", typeof notDeclaredAnywhere, '（不抛错）');

// 实战用法：判断代码跑在浏览器还是 Node。
console.log("typeof window   =", typeof window, '→ 浏览器里是 object，Node 里是 undefined');
console.log("typeof document =", typeof document);
console.log("typeof process  =", typeof process, '→ Node 里是 object');

// 另一种写法：把全局对象取出来再查属性，效果类似但不会误判 TDZ。
console.log("typeof globalThis.fetch =", typeof globalThis.fetch);

// ---------------------------------------------------------------------------
// 4. typeof null === 'object' 的历史 bug
// ---------------------------------------------------------------------------

console.log('--- 4. typeof null 的 bug ---');

console.log('typeof null        =', typeof null);
console.log('null instanceof Object =', null instanceof Object, '← 这里是 false，说明 null 不是对象');
console.log('Object.prototype.toString.call(null) =', Object.prototype.toString.call(null));

// 原因回顾：
//   1995 年 JavaScript 最初版本用 32 位字表示一个值：
//     最低 3 位是"类型标签"，000 表示对象，1 表示整数，…；
//     null 被设计为"空指针"，其机器表示为全 0，
//     于是 typeof 读到最低 3 位 000，误判为对象。
//   到 ES1 规范定稿时这个行为已经被大量网页依赖，无法修正，
//   所以从 ES1 一直到 ES2024，规范都明文规定：typeof null 必须返回 'object'。
//
// 正确的判空方式是直接比较：
const maybeNull = null;
console.log('maybeNull === null ?', maybeNull === null, '← 这才是可靠的判空');

// 或者用 v === null 结合 undefined 一起判：
console.log('maybeNull == null ?', maybeNull == null, '（松散相等同时覆盖 null 与 undefined）');

// ---------------------------------------------------------------------------
// 5. 其它容易踩的类型判断
// ---------------------------------------------------------------------------

console.log('--- 5. 其它 typeof 陷阱 ---');

console.log('typeof NaN           =', typeof NaN, '（NaN 的类型也是 number）');
console.log('typeof Infinity      =', typeof Infinity);
console.log('typeof new Number(1) =', typeof new Number(1), '（包装对象是 object）');
console.log('typeof new String("") =', typeof new String(''));
console.log('typeof 1 / 0         =', typeof (1 / 0));

// ---------------------------------------------------------------------------
// 6. 更精确的类型判断手段
// ---------------------------------------------------------------------------

console.log('--- 6. 更精确的类型判断 ---');

const samples = [null, [], {}, function () {}, new Date(), /re/, 42, 'str', new Map()];

// Object.prototype.toString 会读取内部的 [[Class]] 标签，行为最稳定。
for (const v of samples) {
  console.log(
    '值：' + String(v).padEnd(22),
    'typeof =', String(typeof v).padEnd(9),
    'toString 法 =', Object.prototype.toString.call(v),
  );
}

// 实用建议：
//   判原始值类型  → typeof
//   判 null       → v === null
//   判数组        → Array.isArray(v)
//   判普通对象    → typeof v === 'object' && v !== null && !Array.isArray(v)
//   判具体类      → v instanceof MyClass 或 Object.prototype.toString.call(v)
console.log('Array.isArray([])                    =', Array.isArray([]));
console.log('Array.isArray("[]")                  =', Array.isArray('[]'));
console.log('new Date() instanceof Date           =', new Date() instanceof Date);

console.log('--- 完成：typeof 全部返回值与判空正确姿势 ---');
