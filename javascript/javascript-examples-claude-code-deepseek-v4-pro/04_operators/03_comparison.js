/**
 * ============================================================================
 * 知识点：比较运算符 —— 大小比较、== 与 === 的强制转换规则
 * ============================================================================
 *
 * 【所属分类】04_operators —— 运算符与表达式
 * 【难度等级】入门
 * 【前置知识】04_operators/01_arithmetic.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 的比较运算符分两组：
 *      关系比较：>  <  >=  <=   （结果是布尔值）
 *      相等比较：==  !=   （宽松相等，会做隐式类型转换）
 *                === !==  （严格相等，不做类型转换）
 *    所有比较表达式的结果都是 true 或 false。
 *
 * 2. 为什么需要
 *    分支、循环、过滤、排序、断言……几乎所有"做判断"的地方都依赖比较运算。
 *    尤其是 == 与 === 的选择，直接影响程序正确性，是 JS 里最具争议的设计点之一。
 *
 * 3. 核心语法要点
 *    【关系比较 > < >= <=】
 *      - 若两个操作数都是字符串，按"字符编码顺序"逐字符比较，不按字典意义上的语言顺序。
 *        '10' < '9' 为 true，因为字符 '1' 的编码小于 '9'。
 *      - 其它情况下两侧都会被转成数字（Number()），任何与 NaN 的比较都返回 false。
 *      - null / undefined 在关系比较里会被转成 0 和 NaN，结果同样几乎总是 false。
 *
 *    【=== 严格相等】
 *      - 类型不同直接返回 false（1 === '1' 是 false）。
 *      - 类型相同再比值；对于对象，比较的是"引用"（是否同一个对象）。
 *      - NaN === NaN 是 false（唯一的自不相等值），要判断 NaN 请用 Number.isNaN()。
 *      - +0 === -0 是 true。
 *
 *    【== 宽松相等 的强制转换规则】—— 记忆口诀：
 *      1) 同类型：与 === 行为一致（但 NaN == NaN 仍为 false）。
 *      2) null == undefined 为 true，且 null/undefined 与其它任何值比较都为 false。
 *      3) 数字 vs 字符串：字符串转成数字再比较（'' 转成 0）。
 *      4) 布尔值参与比较：布尔值先转成数字（true→1，false→0）再继续。
 *      5) 对象 vs 原始值：对象调用 ToPrimitive（先 valueOf 后 toString）再比较。
 *
 * 4. 常见陷阱
 *    - 永远优先使用 === 和 !==，把 == 视为需要额外解释的"特例工具"。
 *    - 唯一值得保留的 == 用法是 `x == null`，它能同时匹配 null 和 undefined，
 *      等价于 `x === null || x === undefined`。
 *    - [] == false、'' == 0、'0' == false 都为 true，这些反直觉结果来自多条转换规则叠加。
 *    - 关系比较对字符串和数字的混用会先转数字，'10' > 9 为 true，容易误判。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 04_operators/03_comparison.js
 *
 * 【预期输出】
 *   依次打印关系比较结果、字符串比较规则、=== 的严格性、
 *   == 的强制转换对照表（含 null/undefined/NaN 的边界情况），以及推荐写法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 关系比较 > < >= <=
// ---------------------------------------------------------------------------

console.log('--- 1. 关系比较 ---');

console.log('5 > 3 =', 5 > 3); // true
console.log('5 < 3 =', 5 < 3); // false
console.log('5 >= 5 =', 5 >= 5); // true
console.log('5 <= 4 =', 5 <= 4); // false

// 字符串与数字混比：字符串会被转成数字
console.log("'10' > 9 =", '10' > 9); // true（'10' 转成数字 10）
console.log("'abc' > 9 =", 'abc' > 9); // false（Number('abc') 是 NaN，任何比较都是 false）
console.log("'abc' >= 9 =", 'abc' >= 9); // false（NaN 参与比较一律 false，>= 也不例外）

// 与 NaN 的任何关系比较都是 false，包括与它自己比
const nan = NaN;
console.log('NaN > 0 =', nan > 0, '，NaN < 0 =', nan < 0, '，NaN >= 0 =', nan >= 0); // 全 false

// null / undefined 在关系比较中会被转成 0 和 NaN
console.log('null >= 0 =', null >= 0); // true（null 转成 0）
console.log('null > 0 =', null > 0); // false
console.log('undefined > 0 =', undefined > 0); // false（undefined 转成 NaN）

// ---------------------------------------------------------------------------
// 2. 字符串比较：按字符编码逐位比，不是按"数字大小"
// ---------------------------------------------------------------------------

console.log('\n--- 2. 字符串比较 ---');

// 两侧都是字符串时，不转数字，而是从左往右逐字符比较 UTF-16 编码值
console.log("'apple' < 'banana' =", 'apple' < 'banana'); // true（'a'(97) < 'b'(98)）
console.log("'Z' < 'a' =", 'Z' < 'a'); // true（大写字母编码全部小于小写字母：90 < 97）

// 超经典陷阱：字符串比大小不看"数值含义"
console.log("'10' < '9' =", '10' < '9'); // true！因为先比第一个字符 '1' < '9'
console.log("'100' < '99' =", '100' < '99'); // true，同理

// 先按数值转换再比较，才符合直觉
console.log("Number('10') < Number('9') =", Number('10') < Number('9')); // false

// 一个字符串是另一个的前缀时，短的更小
console.log("'abc' < 'abcd' =", 'abc' < 'abcd'); // true

// 想按"人类语言顺序"比较，请用 localeCompare（返回负数/0/正数）
const words = ['banana', 'apple', 'Cherry'];
console.log(
  'localeCompare 排序结果：',
  [...words].sort((a, b) => a.localeCompare(b, 'en')),
); // ['apple', 'banana', 'Cherry']

// ---------------------------------------------------------------------------
// 3. === 严格相等：类型必须一致
// ---------------------------------------------------------------------------

console.log('\n--- 3. === 严格相等 ---');

console.log('1 === 1 =', 1 === 1); // true
console.log("1 === '1' =", 1 === '1'); // false（类型不同，直接 false）
console.log('0 === false =', 0 === false); // false（number vs boolean）
console.log("'' === false =", '' === false); // false
console.log('null === undefined =', null === undefined); // false（类型不同）

// NaN 是唯一不等于自己的值
console.log('NaN === NaN =', NaN === NaN); // false
// 判断 NaN 的正确方式
console.log('Number.isNaN(NaN) =', Number.isNaN(NaN)); // true
console.log("Number.isNaN('abc') =", Number.isNaN('abc')); // false（不会强制转换，这才是安全写法）

// 正零与负零在严格相等下被视为相同
console.log('0 === -0 =', 0 === -0); // true
// 想区分它们要用 Object.is
console.log('Object.is(0, -0) =', Object.is(0, -0)); // false
console.log('Object.is(NaN, NaN) =', Object.is(NaN, NaN)); // true

// 对象比较的是引用，不是内容
const objA = { x: 1 };
const objB = { x: 1 };
const objC = objA;
console.log('{x:1} === {x:1} =', objA === objB); // false（两个不同的对象）
console.log('objC === objA =', objC === objA); // true（指向同一个对象）

// ---------------------------------------------------------------------------
// 4. == 宽松相等：强制转换规则逐条演示
// ---------------------------------------------------------------------------

console.log('\n--- 4. == 的强制转换规则 ---');

// (1) 同类型：与 === 一致
console.log('1 == 1 =>', 1 == 1); // true
console.log("1 == '1' =>", 1 == '1'); // true（字符串转数字）

// (2) null 与 undefined：互相相等，但与其它任何值都不相等
console.log('null == undefined =>', null == undefined); // true
console.log('null == 0 =>', null == 0); // false！这是最反直觉的一条
console.log('null == false =>', null == false); // false
console.log('undefined == 0 =>', undefined == 0); // false

// (3) 数字 vs 字符串：字符串转成数字
console.log("'' == 0 =>", '' == 0); // true（空字符串转成 0）
console.log("'0' == 0 =>", '0' == 0); // true
console.log("'0.0' == 0 =>", '0.0' == 0); // true
console.log("'abc' == 0 =>", 'abc' == 0); // false（Number('abc') 是 NaN）
console.log("'  ' == 0 =>", '  ' == 0); // true（纯空白字符串转成 0）

// (4) 布尔值：先转成 1 / 0 再继续比较
console.log('true == 1 =>', true == 1); // true
console.log('false == 0 =>', false == 0); // true
console.log("true == '1' =>", true == '1'); // true → 1 == '1' → 1 == 1
console.log("false == '' =>", false == ''); // true → 0 == '' → 0 == 0
console.log("true == 'true' =>", true == 'true'); // false → 1 == 'true' → 1 == NaN

// (5) 对象 vs 原始值：对象先 ToPrimitive（默认 valueOf → toString）
console.log('[1] == 1 =>', [1] == 1); // true → '1' == 1 → 1 == 1
console.log("[1,2] == '1,2' =>", [1, 2] == '1,2'); // true → '1,2' == '1,2'
console.log('[] == 0 =>', [] == 0); // true → '' == 0 → 0 == 0
console.log('[] == false =>', [] == false); // true，两条规则叠加的结果
console.log('{} == {} =>', {} == {}); // false（两个不同的对象引用）

// ---------------------------------------------------------------------------
// 5. 实用建议：什么时候可以留一个 ==
// ---------------------------------------------------------------------------

console.log('\n--- 5. 实用建议 ---');

// 唯一被广泛接受的 == 用法：同时判断 null 和 undefined
function isAbsent(value) {
  return value == null; // 等价于 value === null || value === undefined
}
console.log('isAbsent(null) =', isAbsent(null)); // true
console.log('isAbsent(undefined) =', isAbsent(undefined)); // true
console.log("isAbsent(0) =", isAbsent(0)); // false（0 是有效值，不会被误判）
console.log("isAbsent('') =", isAbsent('')); // false

// 其余场景一律使用 ===，避免隐式转换带来的不确定性
console.log("推荐写法：'1' === 1 的结果是", '1' === 1); // false，语义明确

console.log('\n全部演示结束。');
