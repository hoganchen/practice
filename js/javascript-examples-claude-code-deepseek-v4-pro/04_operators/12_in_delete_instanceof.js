/**
 * ============================================================================
 * 知识点：in / delete / instanceof —— 三个「与对象内部结构打交道」的运算符
 * ============================================================================
 *
 * 【所属分类】04_operators —— 运算符
 * 【难度等级】进阶
 * 【前置知识】04_operators/03_comparison.js、09_objects/02_property_access.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本目录对每个运算符族都给了独立文件（算术/赋值/比较/逻辑/??/?. /位/三元逗号/
 *    展开剩余/优先级/void），唯独这三个没被单独讲过，它们的语义此前散落在
 *    09_objects/02 与 14_classes/09 里各一两句。它们共同的特点是：
 *    **都不看「值」是什么，而是看「对象的内部结构」——属性键、属性描述符、原型链。**
 *
 *      in          → 左侧的「键」是否存在于右侧对象**或其原型链**上（返回布尔）
 *      delete      → 试图移除某个属性，返回「是否删除成功」（不是「属性还在不在」）
 *      instanceof  → 右侧构造函数的 prototype 是否在左侧对象的**原型链**上
 *
 * 2. 为什么需要 / 各自的核心结论
 *    (1) in：走原型链，所以 `'toString' in {}` 是 true。
 *        和只看自有属性的 Object.hasOwn(obj, key)（ES2022）正好互补。
 *        **对数组用 in 查的是下标，不是值** —— 这是本文件最容易踩的坑。
 *        对原始类型（数字/字符串/布尔/null/undefined）用 in 会抛 TypeError。
 *    (2) delete：返回值语义很反直觉 ——
 *        「删掉了」返回 true，「属性本来就不存在」也返回 true，
 *        只有「属性存在但不可配置」才返回 false（严格模式下直接抛 TypeError）。
 *        删数组元素会**留下空洞**（length 不变、下标存在性消失、遍历会跳过）。
 *        不能删变量/函数声明（严格模式下是语法错误）。
 *        会让对象「形状退化」而变慢 —— 见 31_performance_and_memory/08。
 *    (3) instanceof：查的是**原型链归属**，而不是「谁创建的」。
 *        所以 Object.create(C.prototype) 造出来的对象也 instanceof C。
 *        可以用 Symbol.hasInstance 彻底改写它；
 *        跨 realm（iframe / worker / node:vm 的另一个上下文）会失效，
 *        因为两边的 Array / Object 构造函数不是同一个对象。
 *
 * 3. 核心语法要点
 *    (1) `key in obj`：左侧会被 ToPropertyKey（数字→字符串、Symbol 原样保留），
 *        右侧必须能被 ToObject（对象、数组、函数都行）。
 *    (2) `'length' in []` 是 true —— length 是数组的自有、不可枚举属性。
 *        `Symbol.iterator in []` 也是 true —— in 对 Symbol 键同样有效。
 *    (3) `delete obj.k` 删的是**自有属性**。原型上的同名属性删不掉（也不该删），
 *        `delete obj.toString` 返回 true，但 `'toString' in obj` 依然是 true。
 *    (4) `delete arr[i]` 与 `arr.splice(i, 1)` 完全不同：前者留洞、长度不变，
 *        后者真正移除元素并让 length 减一。
 *    (5) `obj instanceof C` 的判定算法大致是：
 *        取 C.prototype，沿着 obj 的原型链逐层找，找到就 true，走到 null 就 false。
 *        右侧若不是可调用对象（且没有 Symbol.hasInstance）→ TypeError。
 *    (6) 原始值 instanceof 任何东西都是 false（包括 `123 instanceof Number`），
 *        但 `new Number(123) instanceof Number` 是 true。
 *
 * 4. 常见陷阱
 *    - 【in 查数组查的是下标】`0 in [1, 2]` 为 true 是因为**下标 0 存在**，
 *      跟「值 0 在不在数组里」毫无关系；`2 in [1, 2]` 为 false 也不代表值 2 不存在。
 *      想查值要用 arr.includes(value) / arr.indexOf(value)。
 *    - 【用 in 判断属性会穿透原型】判断「是不是自有属性」要用 Object.hasOwn。
 *    - 【`!key in obj` 的优先级陷阱】`!` 先作用于 key，再整体作为 in 的左侧：
 *      `!'a' in { false: 1, a: 2 }` 会先算出 false，再判断 `'false' in obj`，
 *      结果与 `!('a' in obj)` 恰好相反 —— 且**不报错**，极难排查。
 *    - 【把 delete 的返回值当「属性还在不在」】删不存在的属性返回 true，
 *      所以 `if (delete obj.x)` 完全不能用来判断删除是否发生。
 *    - 【用 delete 清空字段】设成 undefined 或构造新对象更好，
 *      delete 会让 V8 把对象降级成字典模式，不可逆地变慢。
 *    - 【用 instanceof 做跨 iframe 判断】必须改用 Array.isArray /
 *      Object.prototype.toString.call / 鸭子类型 / 品牌字段。
 *    - 【原始值不能删】`delete 123` 之类写法没有意义；对非引用值 delete 一律返回 true。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 04_operators/12_in_delete_instanceof.js
 *
 * 【预期输出】
 *   分三大节、若干小节，逐一验证上面的结论：
 *   in 的原型链穿透 / 数组下标语义 / 原始类型报错；delete 的三种返回值、
 *   数组空洞、不可配置属性、不能删变量；instanceof 的原型链归属、
 *   Symbol.hasInstance、跨 realm 失效，最后给出类型判断的选型对照表。
 *   全程退出码 0（演示报错处一律 try/catch）。
 * ============================================================================
 */

// node:vm 用来在本进程里造一个「另一个 realm」（完全离线，不联网）。
// 它是本文件唯一的外部依赖，且是 Node 内置模块。
import vm from 'node:vm';

// ---------------------------------------------------------------------------
// 第一部分：in 运算符
// ---------------------------------------------------------------------------

console.log('--- 1. in 的基本语义：左侧是「键」，右侧是对象 ---');

const user = { name: '小明', age: 18 };

// in 只看「这个键在不在」，不看值是什么。
console.log("  'name' in user      =", 'name' in user);
console.log("  'age'  in user      =", 'age' in user);
console.log("  'email' in user     =", 'email' in user);
// 注意：属性存在但值是 undefined 时，in 依然返回 true（这正是 in 优于 `obj.k !== undefined` 的地方）。
const withUndefined = { maybe: undefined };
console.log("  'maybe' in withUndefined =", 'maybe' in withUndefined, ' ← 值虽然是 undefined，但键存在');
console.log('  withUndefined.maybe === undefined =', withUndefined.maybe === undefined);
console.log('  ^ 所以「判断属性是否存在」必须用 in 或 Object.hasOwn，不能用「值是不是 undefined」。');

// 左侧会被转成属性键：数字会变成字符串，Symbol 原样保留。
console.log("  1 in { 1: 'a' }      =", 1 in { 1: 'a' }, '（数字 1 被转成字符串 "1"）');
const symbolKey = Symbol('secret');
const symbolHolder = { [symbolKey]: 'symbol 键的值' };
console.log('  symbolKey in symbolHolder =', symbolKey in symbolHolder, '（Symbol 键同样能用 in 查）');

console.log('--- 2. in 会沿原型链查找（这是它与 Object.hasOwn 的根本区别） ---');

// 空对象没有自有属性，但它的原型链上有 Object.prototype。
console.log("  'toString' in {}                 =", 'toString' in {});
console.log("  Object.hasOwn({}, 'toString')    =", Object.hasOwn({}, 'toString'), ' ← 只看自有属性');
console.log("  'constructor' in {}              =", 'constructor' in {});
console.log("  'hasOwnProperty' in {}           =", 'hasOwnProperty' in {});

// 数组也一样：数组自己的原型链上有 Array.prototype 与 Object.prototype。
console.log("  'length' in []                   =", 'length' in [], '（length 是数组的自有属性）');
console.log("  'push' in []                     =", 'push' in [], '（push 来自 Array.prototype）');
console.log("  Symbol.iterator in []            =", Symbol.iterator in [], '（来自 Array.prototype 上的迭代器）');
console.log("  'toString' in []                 =", 'toString' in [], '（一路找到 Object.prototype）');

// 用 Object.create 手工造一条原型链，把「沿链查找」看得更清楚。
const grandParent = { fromGrandParent: '爷爷的属性' };
const parent = Object.create(grandParent);
parent.fromParent = '爸爸的属性';
const child = Object.create(parent);
child.ownKey = '自己的属性';
console.log('  child 上的三层查找：');
console.log("    'ownKey'         in child =", 'ownKey' in child, '（自有）');
console.log("    'fromParent'     in child =", 'fromParent' in child, '（来自原型 parent）');
console.log("    'fromGrandParent' in child =", 'fromGrandParent' in child, '（来自原型的原型）');
console.log("    'notExist'       in child =", 'notExist' in child, '（链上都没有 → false）');
console.log('  ^ in 相当于「沿原型链一路找」，Object.hasOwn 只检查最上面那一层。');

console.log('--- 3. 头号陷阱：对数组用 in 查的是「下标」而不是「值」 ---');

const nums = [1, 2]; // 合法的下标只有 0 和 1
console.log('  数组 nums =', JSON.stringify(nums));
console.log('    0 in nums =', 0 in nums, ' ← true，因为**下标 0 存在**（值是 1）');
console.log('    1 in nums =', 1 in nums, ' ← true，因为**下标 1 存在**（值是 2）');
console.log('    2 in nums =', 2 in nums, ' ← false，因为下标 2 不存在');
console.log('  ^ 这里的 0 / 1 / 2 全是「下标」，与数组元素的值毫无关系。');
console.log('    想要「数组里有没有这个值」，必须换工具：');
console.log('      nums.includes(2) =', nums.includes(2), ' ← 这才是查「值」');
console.log('      nums.includes(9) =', nums.includes(9));
console.log('      nums.indexOf(2)  =', nums.indexOf(2), '（返回下标，找不到是 -1）');
console.log('    in 查非整数键也照样按「键」处理：1.5 in [1, 2] =', 1.5 in [1, 2], '、-1 in [1, 2] =', -1 in [1, 2]);

// 稀疏数组：in 是检测「空洞」的标准手段。
const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
console.log('  稀疏数组 [1, , 3]：length =', sparse.length, '，但 1 in sparse =', 1 in sparse, ' ← 下标 1 是空洞');
console.log('  ^ 空洞与「值为 undefined」不同：直接用 in 就能区分二者，这也解释了')
console.log('    为什么 forEach / map 会跳过空洞而 for 循环不会。');

console.log('--- 4. 用 in 做特征检测（真实项目里最常见的用途） ---');

// 检测运行环境是否提供某个 API，是 in 最正当的用法：不触发取值、不会因 undefined 误判。
console.log("  'fetch' in globalThis        =", 'fetch' in globalThis);
console.log("  'document' in globalThis     =", 'document' in globalThis, '（Node 里没有 DOM）');
console.log("  'setTimeout' in globalThis   =", 'setTimeout' in globalThis);
console.log('  ^ 本仓库 27_web_apis 与 26_node_core 里的「能力探测」都用这种写法。');

console.log('--- 5. 对原始类型用 in 会抛 TypeError ---');

// in 的右侧必须能被转成对象。原始类型里 null / undefined 转不了，
// 数字、字符串、布尔虽然能装箱，但规范明确规定 in 的右操作数不能是原始值 —— 一律 TypeError。
const primitiveCases = [
  ["'a' in 'abc'", () => 'a' in 'abc'],
  ['0 in 123', () => 0 in 123],
  ["'x' in null", () => 'x' in null],
  ["'x' in undefined", () => 'x' in undefined],
  ["'x' in true", () => 'x' in true],
];
for (const [label, run] of primitiveCases) {
  try {
    console.log(`  ${label.padEnd(18)} → ${run()}`);
  } catch (err) {
    console.log(`  ${label.padEnd(18)} → 抛错 ${err.constructor.name}: ${err.message}`);
  }
}
console.log("  ^ 字符串也不能用 in 查字符 —— 想查子串请用 'abc'.includes('a')。");

console.log('--- 6. 优先级陷阱：!key in obj 与 !(key in obj) 完全不同 ---');

// ! 是一元运算符，优先级高于关系运算符 in，所以 !'a' in obj 会解析成 (!'a') in obj。
// 更糟的是它**不报错**，只是给出错误答案 —— 这类 bug 极难排查。
const precedenceObj = { false: '键名是字符串 "false"', a: '键名是 a' };
// eslint-disable-next-line no-unsafe-negation -- 这里故意写错，用于演示陷阱
const wrong = !'a' in precedenceObj;
const right = !('a' in precedenceObj);
console.log("  !'a' in { false: ..., a: ... }   =", wrong, '（解析成 (!"a") in obj → "false" in obj → true）');
console.log("  !('a' in { false: ..., a: ... }) =", right, '（先做 in，再取反 → false）');
console.log('  ^ 两者结果相反，但都不报错。eslint 的 no-unsafe-negation 规则专门拦这个手误。');
console.log('    保险写法：永远给 in 表达式加括号，或者写成 (key in obj) === false。');

// ---------------------------------------------------------------------------
// 第二部分：delete 运算符
// ---------------------------------------------------------------------------

console.log('--- 7. delete 的返回值语义（三种情况） ---');

const config = { host: 'localhost', port: 8080 };
console.log('  情况一：属性存在且可配置 →', delete config.host, '（真的删掉了）');
console.log('    删完之后 config =', JSON.stringify(config));
console.log('  情况二：属性本来就不存在 →', delete config.port2, '（照样返回 true！）');
console.log('  ^ 所以「返回 true」只代表「删除动作没有失败」，不代表「属性原来在、现在没了」。');
console.log('    把返回值当「属性是否存在过」用，是 delete 的头号误解。');

// 情况三：属性存在但不可配置 —— 结果取决于是否严格模式。
const sealed = Object.seal({ a: 1 }); // seal 之后属性不可配置但可写
try {
  console.log('  情况三（严格模式）：delete sealed.a →', delete sealed.a);
} catch (err) {
  console.log('  情况三（严格模式）：delete sealed.a → 抛错', err.constructor.name, ':', err.message);
}
// 非严格模式下不抛错，只是静默失败返回 false。用 new Function 造一个非严格函数来对比。
const sloppyDelete = new Function('obj', 'return delete obj.a;');
console.log('  情况三（非严格模式）：delete sealed.a →', sloppyDelete(sealed), '（静默失败）');
console.log('    删完之后 sealed =', JSON.stringify(sealed), '← 属性还在，delete 失败了');
console.log('  ^ 本仓库是 ESM，永远处于严格模式，所以上面那行会抛 TypeError；');
console.log('    非严格模式只在老脚本里出现，它连失败都是静默的，更危险。');

console.log('--- 8. delete 数组元素会留下「空洞」，length 不变 ---');

const holey = [1, 2, 3];
console.log('  原始数组 →', JSON.stringify(holey), '，length =', holey.length);
console.log('  delete holey[1] →', delete holey[1]);
console.log('  删除后 →', JSON.stringify(holey), '，length =', holey.length, ' ← 长度没变');
console.log('  下标 1 还存在吗？1 in holey =', 1 in holey, ' ← 变成了空洞，不是 undefined');
// 空洞在各种遍历里的表现：不同方法对空洞的处理并不一致，这正是坑所在。
const visitedByForEach = [];
holey.forEach((v, i) => visitedByForEach.push(`${i}:${v}`));
console.log('    forEach 访问到的元素 →', JSON.stringify(visitedByForEach), '← 跳过了空洞');
console.log('    map 的结果           →', JSON.stringify(holey.map((x) => x * 2)), '← 空洞被保留成空洞（JSON 里显示 null）');
console.log('    Object.keys          →', JSON.stringify(Object.keys(holey)), '← 空洞没有键');
console.log('  正确做法：想真正移除元素并让 length 变短，用 splice。');
const spliced = [1, 2, 3];
spliced.splice(1, 1);
console.log('    spliced.splice(1, 1) 之后 →', JSON.stringify(spliced), '，length =', spliced.length);

console.log('--- 9. delete 只删自有属性，删不动原型链 ---');

const inheritor = { own: 1 };
console.log("  'toString' in inheritor =", 'toString' in inheritor, '（继承来的）');
console.log('  delete inheritor.toString →', delete inheritor.toString, '（返回 true，因为本来就没有这个自有属性）');
console.log("  删完之后 'toString' in inheritor =", 'toString' in inheritor, ' ← 原型上的还在，删不掉');
console.log('  ^ delete 的作用域只有「自有属性」这一层；原型是所有实例共享的，不该也不可能被实例删掉。');

// Symbol 键与普通字符串键在 delete 面前完全平等。
const symbolOwner = { [symbolKey]: '值', normal: '值' };
console.log('  delete symbolOwner[Symbol 键] →', delete symbolOwner[symbolKey], '，剩下', JSON.stringify(Object.keys(symbolOwner)));

console.log('--- 10. delete 不能删变量和函数声明 ---');

// 在严格模式（ESM 就是严格模式）下，delete 一个「未限定的标识符」是**语法错误**，
// 整个文件根本无法解析 —— 所以这里必须用 new Function 把代码推迟到运行时观察。
function tryParse(label, source) {
  try {
    new Function(source);
    console.log(`  ${label.padEnd(30)} → 解析通过`);
  } catch (err) {
    console.log(`  ${label.padEnd(30)} → ${err.constructor.name}: ${err.message}`);
  }
}
console.log('  严格模式（本仓库的默认模式）：');
tryParse('delete someVariable', '"use strict"; var someVariable = 1; return delete someVariable;');
tryParse('delete someFunction', '"use strict"; function someFunction() {} return delete someFunction;');
console.log('  非严格模式（老脚本）：');
const sloppyVarDelete = new Function('var someVariable = 1; return delete someVariable;');
const sloppyFnDelete = new Function('function someFunction() {} return delete someFunction;');
console.log('    delete 变量      →', sloppyVarDelete(), '（不报错，但删除失败，静默返回 false）');
console.log('    delete 函数声明  →', sloppyFnDelete(), '（同上）');
console.log('  ^ 结论：变量与函数声明不是「属性」，delete 对它们无效；');
console.log('    严格模式干脆把它当成语法错误，让你在写代码时就发现。');

// 但「全局变量」有一半例外：脚本顶层用 var 声明会成为全局对象的**不可配置**属性（删不掉），
// 而「隐式赋值的全局」（未声明就赋值）是可配置的（删得掉）。这是 07 章讲的环境记录差异。
const globalish = { implicit: '模拟隐式全局' };
console.log('  （全局变量的可删除性差异见 07_scope_and_closure/12_execution_context_and_environments.js）');
console.log("  delete globalish.implicit →", delete globalish.implicit, '（普通可配置属性，删得掉）');

console.log('--- 11. delete 的代价：让对象「形状退化」 ---');

// V8 用「隐藏类」把属性访问优化成固定偏移量的内存读取。
// delete 会把这个对象打成「字典模式」（属性存进哈希表），而且**不可逆**。
const shaped = { a: 1, b: 2, c: 3 };
console.log('  改之前：', JSON.stringify(shaped), '（形状规整，属性访问走快速路径）');
delete shaped.b;
console.log('  删掉 b 之后：', JSON.stringify(shaped), '（内容看着没问题，但内部已降级为字典模式）');
console.log('  ^ 一旦对象上有过 delete，后续所有属性访问都会变慢，且加回属性也回不到快速模式。');
console.log('    清空字段的正确做法是赋 undefined / null，或构造一个新对象：');
const { b: _removed, ...withoutB } = { a: 1, b: 2, c: 3 }; // eslint-disable-line no-unused-vars
console.log('    用解构 + 剩余运算符「删掉」b →', JSON.stringify(withoutB));
console.log('    想真正删除并保留语义，也可以用 Map（有 map.delete(key)，且不涉及隐藏类）。');
const map = new Map([
  ['a', 1],
  ['b', 2],
]);
map.delete('b');
console.log('    Map.prototype.delete →', JSON.stringify([...map]));
console.log('  深入原理见 31_performance_and_memory/08_object_shape_optimization.js。');

// ---------------------------------------------------------------------------
// 第三部分：instanceof 运算符
// ---------------------------------------------------------------------------

console.log('--- 12. instanceof 查的是「原型链归属」，不是「谁创建的」 ---');

class Animal {}
class Dog extends Animal {}

console.log('  new Dog() instanceof Dog    =', new Dog() instanceof Dog);
console.log('  new Dog() instanceof Animal =', new Dog() instanceof Animal, '（Dog.prototype 的链上有 Animal.prototype）');
console.log('  new Animal() instanceof Dog =', new Animal() instanceof Dog, '（反方向不成立）');

// 关键点：判定只看原型链，所以「手工造」的对象同样会通过检测。
const fakeDog = Object.create(Dog.prototype);
console.log('  Object.create(Dog.prototype) instanceof Dog =', fakeDog instanceof Dog);
console.log('  ^ 它一行业务代码都没继承，只是原型对上了。所以 instanceof 表达的是');
console.log('    「你的原型链里有没有我」，而不是「你是不是我 new 出来的」。');
// 显式改写原型也会改变判定结果。
const protoSwapped = { __proto__: Dog.prototype };
console.log('  { __proto__: Dog.prototype } instanceof Dog =', protoSwapped instanceof Dog);
// 换掉构造函数的 prototype 会让**已经创建**的实例「失忆」。
function Legacy() {}
const legacyInstance = new Legacy();
console.log('  换 prototype 之前：legacyInstance instanceof Legacy =', legacyInstance instanceof Legacy);
Legacy.prototype = {}; // 换成一个全新的对象
console.log('  换 prototype 之后：legacyInstance instanceof Legacy =', legacyInstance instanceof Legacy, ' ← 判定跟着 prototype 走');

console.log('--- 13. 原始值一律 false，null / undefined 不报错 ---');

console.log('  123 instanceof Number          =', 123 instanceof Number, '（原始值不是对象）');
console.log("  'abc' instanceof String        =", 'abc' instanceof String);
console.log('  new Number(123) instanceof Number =', new Number(123) instanceof Number, '（包装对象才是对象）');
console.log('  null instanceof Object         =', null instanceof Object, '（不报错，直接 false）');
console.log('  undefined instanceof Object    =', undefined instanceof Object);
console.log('  ^ 正因为「原始值恒为 false、null 也不报错」，instanceof 不能用来做通用类型判断。');

console.log('--- 14. 右侧必须可调用；Symbol.hasInstance 是唯一的例外 ---');

try {
  // 右侧不是函数 → TypeError（规范要求 GetMethod(C, @@hasInstance) 为 undefined 时，C 必须可调用）
  console.log('  ({}) instanceof {} =', {} instanceof {});
} catch (err) {
  console.log('  ({}) instanceof {} → 抛错', err.constructor.name, ':', err.message);
}

// 只要一个对象带 Symbol.hasInstance 方法，它就能放在 instanceof 右边，即使它不是函数。
// 这等于把「类型判断」变成了可以由你自定义的逻辑。
const EvenNumber = {
  [Symbol.hasInstance](value) {
    // 自定义语义：偶数就算「是」。
    return typeof value === 'number' && value % 2 === 0;
  },
};
console.log('  自定义 Symbol.hasInstance 的对象：');
console.log('    4 instanceof EvenNumber  =', 4 instanceof EvenNumber);
console.log('    3 instanceof EvenNumber  =', 3 instanceof EvenNumber);
console.log("    'x' instanceof EvenNumber =", 'x' instanceof EvenNumber);
console.log('  ^ 自定义钩子会彻底打破直觉，库作者要慎用；类的静态方法也可以用来定义它。');
console.log('    更多用法（业务语义类型守卫、品牌检测）见 14_classes/09_instanceof_and_brands.js。');

console.log('--- 15. 跨 realm 失效：instanceof 的硬伤 ---');

// realm（领域）= 一套独立的全局环境，带自己的 Array / Object 等构造函数。
// iframe、Web Worker、node:vm 的另一个上下文，都是不同的 realm。
// 本文件用 node:vm 造出第二个 realm（完全离线），直接复现这个经典问题。
const otherRealm = vm.createContext({});
const foreignArray = vm.runInContext('[1, 2, 3]', otherRealm);
console.log('  从另一个 realm 拿到的数组：[1, 2, 3]');
console.log('    foreignArray instanceof Array =', foreignArray instanceof Array, ' ← 明明是数组，却判为 false');
console.log('    foreignArray instanceof Object =', foreignArray instanceof Object, ' ← 连 Object 也不认');
console.log('    Array.isArray(foreignArray)   =', Array.isArray(foreignArray), ' ← 正确');
console.log('    Object.prototype.toString.call(foreignArray) =', Object.prototype.toString.call(foreignArray), ' ← 也正确');
console.log('    foreignArray.constructor.name =', foreignArray.constructor.name, ' ← 名字对，但不是本地那个构造函数');
console.log('  ^ 原因：判定要比较「原型链上有没有**这一个** Array.prototype」，');
console.log('    而另一个 realm 的 Array.prototype 是**另一个对象**，永远不会相等。');

console.log('--- 16. 类型判断的选型对照表 ---');

const typeToolbox = [
  ['typeof x', '原始类型（string / number / boolean / undefined / symbol / bigint / function）', 'null 也返回 "object"；数组、Date 都返回 "object"'],
  ['Array.isArray(x)', '判断是不是数组（含跨 realm）', '唯一可靠的数组判断方式'],
  ['x instanceof C', '判断原型链归属（同类库/同 realm 内）', '跨 realm 失效；可被 Symbol.hasInstance 改写'],
  ['Object.prototype.toString.call(x)', '取内部标签，如 [object Date] / [object Array]', '可被 Symbol.toStringTag 改写，但跨 realm 仍可用'],
  ['Object.hasOwn(x, k)', '判断自有属性（不看原型链）', '不要用 in 代替它，in 会穿透原型'],
  ['鸭子类型（看有没有某个方法）', '跨 realm、跨实现的结构化判断', '要显式判空，且可能与真实类型无关'],
  ['#私有字段品牌检查', '类内部的强品牌检测', '只能在类内部用，跨 realm 也有效'],
];
console.log('  ┌─ 工具 ───────────────────────────────┬─ 适用场景');
for (const [tool, usage, caveat] of typeToolbox) {
  console.log(`  · ${tool}`);
  console.log(`      用途：${usage}`);
  console.log(`      注意：${caveat}`);
}
console.log('  ^ 经验法则：能不用 instanceof 就不用；判断数组一律 Array.isArray。');

console.log('--- 也见 ---');
console.log('  09_objects/02_property_access.js   —— 属性访问、in 与 hasOwnProperty 的基础用法');
console.log('  14_classes/09_instanceof_and_brands.js —— 原型链、Symbol.hasInstance 与品牌检测');
console.log('  31_performance_and_memory/08_object_shape_optimization.js —— delete 为何让对象变慢');
console.log('  04_operators/11_void_operator.js   —— 同为「一元运算符」的 void 与 delete 对比');

console.log('\n全部演示完毕。');
