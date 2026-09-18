/**
 * ============================================================================
 * 知识点：七种原始类型总览与值语义 / 引用语义
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】入门
 * 【前置知识】00_hello_world/01_hello_world.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 规范把值分成两大类：
 *      · 原始值（Primitive Value）：共 7 种 —— string、number、boolean、
 *        null、undefined、symbol、bigint。它们是"不可再分"的最小值。
 *      · 对象（Object）：除上述 7 种之外的一切 —— 普通对象、数组、函数、
 *        Date、RegExp、Map、Set、Promise……以及包装对象。
 *    注意：数组和函数在语言层面都是 object，不是独立类型。
 *
 * 2. 为什么需要区分
 *    因为两者的"存储与赋值行为"根本不同：
 *      · 原始值按"值"存储与传递 —— 复制的是值本身，两份数据互不影响，
 *        称为"值语义"。
 *      · 对象按"引用"存储与传递 —— 变量里存的是指向堆内存的地址，
 *        复制的是地址，两个变量指向同一个对象，改一个另一个也跟着变，
 *        称为"引用语义"。
 *    不理解这一点，就会写出"改了副本却把原对象也改了"这类 bug。
 *
 * 3. 核心语法要点
 *    · 栈（stack）与堆（heap）是 V8 引擎的内存划分模型（概念模型，便于理解）：
 *        - 原始值小、定长，通常直接内联在栈上或变量槽里。
 *        - 对象体积不定，实际数据放在堆上，变量里只保存一个"地址"。
 *    · typeof 可以判断类型，但有两个出名的例外：typeof null === 'object'，
 *      以及 typeof function 得到 'function'。
 *    · 原始值本身没有属性。写 'abc'.length 之所以能跑通，是因为引擎临时
 *      把它包装成 String 对象（装箱/自动装箱），取完属性立刻丢弃。
 *    · 严格相等 === 比较原始值比的是"值"，比较对象比的是"是不是同一个引用"。
 *
 * 4. 常见陷阱
 *    · const 只锁住"绑定"（变量不能重新赋值），不锁住对象内容。
 *    · 用 === 比较两个内容相同的对象会得到 false（它们是两个不同引用）。
 *    · null 与 undefined 是两种不同的原始值，不能互换使用（详见第 08 个示例）。
 *    · number 只能精确表示 -2^53+1 ~ 2^53-1 之间的整数，超出要用 bigint。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/01_primitives_overview.js
 *
 * 【预期输出】
 *   依次打印 7 种原始值与其 typeof 结果、object 的 typeof、装箱现象、
 *   值语义与引用语义的对比实验。全部输出均为可预测的确定值。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 七种原始值逐个点名
// ---------------------------------------------------------------------------

console.log('--- 1. 七种原始类型 ---');

// 声明 7 个原始值，覆盖全部原始类型。
const pString = '文本'; // string：字符串，UTF-16 编码的字符序列
const pNumber = 42; // number：双精度 64 位浮点数（整数和小数共用这一种）
const pBoolean = true; // boolean：布尔值，只有 true / false
const pNull = null; // null：表示"有意的空值"，由程序员主动赋值
let pUndefined; // undefined：声明了但没赋值，引擎自动给的初始值
const pSymbol = Symbol('描述'); // symbol：独一无二的标识符，ES6 引入
const pBigint = 9007199254740993n; // bigint：任意精度整数，字面量加 n 后缀

// 用 typeof 打印每个值的类型名称。typeof 永远返回小写字符串。
console.log('string   ->', typeof pString, '| 值：', pString);
console.log('number   ->', typeof pNumber, '| 值：', pNumber);
console.log('boolean  ->', typeof pBoolean, '| 值：', pBoolean);
console.log('null     ->', typeof pNull, '| 值：', pNull, '（注意：这里是历史遗留 bug）');
console.log('undefined->', typeof pUndefined, '| 值：', pUndefined);
console.log('symbol   ->', typeof pSymbol, '| 值：', String(pSymbol));
console.log('bigint   ->', typeof pBigint, '| 值：', pBigint);

// ---------------------------------------------------------------------------
// 2. 对象：第 8 类值，但属于"引用类型"
// ---------------------------------------------------------------------------

console.log('--- 2. 对象与它的具体形态 ---');

// 下面这些写法不同，但 typeof 全都是 'object'（函数除外）。
const oPlain = { name: '普通对象' };
const oArray = [1, 2, 3];
const oDate = new Date(0);
const oMap = new Map();
const oFn = function fn() {};

console.log('普通对象 ->', typeof oPlain);
console.log('数组     ->', typeof oArray, '（数组也是 object）');
console.log('Date     ->', typeof oDate);
console.log('Map      ->', typeof oMap);
console.log('函数     ->', typeof oFn, '（函数是唯一能返回 function 的类型）');

// 想精确区分对象的具体形态，用 Object.prototype.toString 或 Array.isArray。
console.log('精确类型（切片法）:', Object.prototype.toString.call(oArray));
console.log('Array.isArray(oArray):', Array.isArray(oArray));

// ---------------------------------------------------------------------------
// 3. 自动装箱：原始值为什么能"点"出属性
// ---------------------------------------------------------------------------

console.log('--- 3. 自动装箱（boxing）---');

// 字符串是原始值，但它能访问方法。原因是引擎在执行到点号的一瞬间，
// 创建了一个临时的 String 包装对象，调用完后立刻销毁。
console.log("'abc'.length =", 'abc'.length);
console.log("'abc'.toUpperCase() =", 'abc'.toUpperCase());

// 显式装箱会得到真正的对象，typeof 也变成 'object'。
const boxed = new String('abc');
console.log('typeof new String("abc") =', typeof boxed);
console.log('typeof "abc"             =', typeof 'abc');

// 包装对象在布尔判断里是"真值"，这点很坑：
// new Boolean(false) 是一个对象，对象永远是真值。
console.log('Boolean(new Boolean(false)) =', Boolean(new Boolean(false)), '（坑！）');

// ---------------------------------------------------------------------------
// 4. 值语义：原始值复制后互不影响
// ---------------------------------------------------------------------------

console.log('--- 4. 值语义（原始值）---');

let a = 100;
let b = a; // 把 a 的值"拷贝"一份给 b

b = 999; // 修改 b
console.log('a =', a, ' b =', b, '→ 改 b 不影响 a');

// 字符串同理：所有"修改字符串"的操作其实都是产生了一个新字符串。
let s1 = 'hello';
let s2 = s1;
s2 = s2 + ' world'; // 拼接产生新字符串
console.log('s1 =', s1, ' s2 =', s2, '→ s1 依然是原值');

// ---------------------------------------------------------------------------
// 5. 引用语义：对象复制的是地址
// ---------------------------------------------------------------------------

console.log('--- 5. 引用语义（对象）---');

const objA = { count: 1 };
const objB = objA; // 拷贝的是"地址"，objA 和 objB 指向堆上同一个对象

objB.count = 2;
console.log('objA.count =', objA.count, ' objB.count =', objB.count, '→ 改一个两个都变');

// 证明它们是同一个对象：用 === 比较，比的是引用是否相同。
console.log('objA === objB ?', objA === objB, '（同一引用）');

// 内容相同但引用不同的两个对象，=== 为 false。
const twin1 = { v: 1 };
const twin2 = { v: 1 };
console.log('内容相同的两个对象 === ?', twin1 === twin2, '（不同引用）');

// 原始值则相反：只要值相同，=== 就是 true。
console.log('内容相同的两个字符串 === ?', 'abc' === 'abc', '（值相同即为 true）');

// ---------------------------------------------------------------------------
// 6. 栈 / 堆 的概念模型
// ---------------------------------------------------------------------------

console.log('--- 6. 栈与堆（概念模型）---');

// 下面用文字表格说明内存布局。它描述的是引擎的"概念模型"，
// 真实 V8 有逃逸分析、内联缓存等优化，未必逐字对应。
console.log('变量声明               | 栈上（变量槽）保存的内容   | 堆上保存的内容');
console.log('let n = 42             | 数值 42 本身               | 无');
console.log('let s = "hi"           | 字符串值（内联或指向常量池）| 无');
console.log('let o = {a:1}          | 一个地址（引用）            | {a:1} 这个对象');

// 由此可以推断出一个结论：把对象传来传去很"便宜"（只传地址），
// 但也因此容易被意外修改；把大字符串传来传去则可能真的复制数据。

// ---------------------------------------------------------------------------
// 7. const 锁的是绑定，不是内容
// ---------------------------------------------------------------------------

console.log('--- 7. const 与可变性 ---');

const frozenRef = { n: 1 };
frozenRef.n = 100; // 合法！const 不允许重新赋值变量本身，但允许修改对象内容
console.log('修改 const 对象的属性后：', frozenRef.n);

// frozenRef = {}; // 若取消注释会抛 TypeError: Assignment to constant variable.

// 想真正冻结内容，用 Object.freeze（浅冻结）。
// 注意：ESM 模块始终运行在严格模式下，给冻结对象的属性赋值会抛 TypeError，
// 所以这里必须用 try/catch 包住，避免错误冒泡到顶层。
const reallyFrozen = Object.freeze({ n: 1 });
try {
  reallyFrozen.n = 100;
} catch (err) {
  console.log('冻结后赋值 →', err.name + ':', err.message);
}
console.log('冻结后读取：', reallyFrozen.n, '（仍是 1，未被改动）');
console.log('Object.isFrozen(reallyFrozen) =', Object.isFrozen(reallyFrozen));

console.log('--- 完成：七种原始类型 + 对象总览结束 ---');
