/**
 * ============================================================================
 * 知识点：函子（Functor）—— map 的通用含义与函子定律
 * ============================================================================
 *
 * 【所属分类】40_functional_programming —— 函数式编程进阶
 * 【难度等级】进阶
 * 【前置知识】06_functions/12_currying_and_compose.js、06_functions/11_pure_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    函子（Functor）是"可以被 map 的东西"。准确地说，它是一个"容器"，
 *    满足两条规则：
 *      (1) 它提供 of 方法，能把任意值 x 放进容器：F.of(x);
 *      (2) 它提供 map 方法，接收一个函数 f，返回"同样结构的新容器"：
 *          F.of(x).map(f) 的结果仍然是一个 F，里面装着 f(x)。
 *    注意：map 不改变容器的"形状"，只改变容器里装的值。
 *
 * 2. 为什么需要
 *    在真实项目里，"一个值 + 一些额外语境"的组合随处可见：
 *      - 数组：  值 + "可能有 0 个或多个"
 *      - Promise：值 + "将来才会到"或"可能失败"
 *      - 空值：  值 + "可能不存在"（这就是下一节的 Maybe）
 *    这些语境在朴素代码里各自需要一套 if / 循环 / then 来穿透。
 *    函子把这层"穿透"抽象成统一的一个方法名 —— map，
 *    于是同一个概念（值变换）在所有语境下写法一致。
 *
 * 3. 核心语法要点
 *    (1) 最小实现：一个持有 value 的对象 + map 方法（返回新的同类容器）+ of 静态方法。
 *    (2) 函子定律（Functor Laws）：
 *          恒等律：F.of(x).map(v => v)  ≡  F.of(x)
 *          组合律：F.of(x).map(f).map(g) ≡ F.of(x).map(v => g(f(v)))
 *    (3) Array 就是函子：Array.of(x) 是 of，arr.map(f) 是 map。
 *    (4) Promise 也是函子：Promise.resolve(x) 是 of，p.then(f) 是 map。
 *    (5) 定律的意义：只要满足定律，你就可以放心地把一串 map 合并、
 *        或者在不改变结果的前提下重构代码，而不用去关心里面怎么实现。
 *
 * 4. 常见陷阱
 *    - map 回调里返回的还是个容器（如 x => Box(y)），结果变成 Box(Box(y))，
 *      嵌套层数越滚越多 —— 这就是下一节 Monad 要解决的问题。
 *    - 在 map 里做副作用。函子的意义正是"纯变换"，副作用会让定律失效。
 *    - 把 map 当成"遍历"来理解（那是数组的特例）。函子的 map 只关心"变换值"。
 *    - 恒等律在"值本身是可变对象"时容易被破坏：如果 map 直接改了原对象，
 *      定律验证会意外通过/失败。所以函子内部要保证不修改原值。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 40_functional_programming/01_functor.js
 *
 * 【预期输出】
 *   从数组 map 的疑问出发，实现 Box 函子，用代码逐条验证恒等律与组合律，
 *   最后展示 Array 与 Promise 的 map 用法并说明它们也是函子。
 * ============================================================================
 */

console.log('--- 1. 先从一个疑问开始：为什么数组可以这样写？ ---');

// 数组带 map，所以我们能写出很干净的链式变换。
const prices = [100, 250, 30];
const withTax = prices.map((p) => Math.round(p * 1.06 * 100) / 100);
console.log('  价格 →', prices);
console.log('  含税 →', withTax);

// 问题来了：map 到底做了什么？
// 一句朴素但很关键的描述：map 把"装在数组里的每个值"拿出来，做变换，再装回数组。
console.log('  朴素描述：map = 把容器里的值拿出来 → 变换 → 再装回同样的容器。');

// 如果上面的描述是对的，那么"能装值的东西"都该能 map，不只是数组。
// 下面我们就自己造一个最小容器，验证这个想法。

console.log('--- 2. 朴素解法：用一个普通的"包装对象" ---');

// 需求：我们想给一个值加上"这是用户的显示名"这层语境，
// 并且希望以后能像数组一样 .map 地做变换。
//
// 朴素做法：写个函数把值包起来，再手写一个变换函数。
function wrap(value) {
  return { value };
}
function transformName(wrapper) {
  return { value: wrapper.value.trim().toUpperCase() };
}

const rawName = wrap('  alice  ');
console.log('  包装后 →', rawName);
console.log('  变换后 →', transformName(rawName));
console.log('  问题：每换一种容器（包装形状不同），就要重写一套 transformXxx，重复且容易写错。');

console.log('--- 3. 引出抽象：盒子（Box）函子 ---');

// 抽象的关键：把"取出来 → 变换 → 装回去"这个动作固化成一个方法 map。
// 这样无论容器里装什么、变换是什么，调用方只需要记住 map 这个名字。
//
// Box 是最简单的一类容器：它只装一个值，没有"缺失""错误"之类的额外语义。
class Box {
  // 构造函数不直接暴露给业务代码使用，我们用静态的 of 作为"入口"。
  constructor(value) {
    this._value = value;
  }

  // of：把任意值放进盒子的标准入口（函子的第一要素）。
  static of(value) {
    return new Box(value);
  }

  // map：接收一个函数，作用在盒子里的值上，返回一个新的同类型盒子。
  // 注意三点：
  //   (1) 返回的是 new Box(...)，而不是修改 this —— 保持不可变、可重复调用；
  //   (2) 不改变盒子的"形状"，只是换掉里面的值；
  //   (3) 回调只拿到"值"，拿不到盒子本身 —— 这保证了 map 的纯粹性。
  map(fn) {
    return new Box(fn(this._value));
  }

  // 一个"拆开盒子"的方法，用于最终取值（不叫 map，因为它是出口不是变换）。
  // 真实库常叫 fold / getOrElse / value。
  fold(fn) {
    return fn(this._value);
  }

  // 方便打印观察。
  inspect() {
    return `Box(${JSON.stringify(this._value)})`;
  }
}

const boxed = Box.of(2);
console.log('  Box.of(2) →', boxed.inspect());
console.log('  .map(x => x + 1) →', boxed.map((x) => x + 1).inspect());
console.log('  .map(x => x * 10).map(x => x - 5) →', boxed.map((x) => x * 10).map((x) => x - 5).inspect());
console.log('  原来的盒子变了吗？', boxed.inspect(), '（没变，map 返回新盒子）');

// 用真实一点的数据演示：用户对象在盒子里被逐步加工。
const userBox = Box.of({ name: '  bob ', age: 31 });
const label = userBox
  .map((u) => ({ ...u, name: u.name.trim() }))
  .map((u) => `${u.name.toUpperCase()}（${u.age} 岁）`)
  .fold((s) => s);
console.log('  用户名加工 →', label);

console.log('--- 4. 函子定律之一：恒等律 ---');

// 恒等律：F.of(x).map(v => v) 必须等价于 F.of(x)。
// 白话：map 一个"什么都不做"的函数，不应该产生任何影响。
//
// 为什么工程上在乎它？因为很多优化/重构依赖这条：
// 如果框架发现某个 map 的回调是恒等函数，就可以安全地把它删掉。
const identity = (v) => v;

const left = Box.of('hello');
const right = Box.of('hello').map(identity);

// 比较两个盒子要用"里面的值"比，因为它们是两个不同的对象实例。
console.log('  Box.of("hello")                →', left.inspect());
console.log('  Box.of("hello").map(v => v)    →', right.inspect());
console.log('  两者内部值相等吗？', left.fold(identity) === right.fold(identity));

// 换个值、换个类型再验证一次，定律必须对"任意值"成立。
const nums = [0, 1, -5, 3.14, NaN, '', null];
const identityLawHolds = nums.every((n) => {
  const a = Box.of(n);
  const b = Box.of(n).map(identity);
  // 用 Object.is 而不是 ===，这样 NaN 也能正确比较。
  return Object.is(a.fold(identity), b.fold(identity));
});
console.log('  对 [0, 1, -5, 3.14, NaN, "", null] 全部成立吗？', identityLawHolds);

console.log('--- 5. 函子定律之二：组合律 ---');

// 组合律：F.of(x).map(f).map(g) 等价于 F.of(x).map(v => g(f(v)))。
// 白话：连着 map 两次，等于"先把两个函数组合起来，再 map 一次"。
//
// 为什么工程上在乎它？因为这意味着你可以把多次 map 合并成一次
// （减少遍历/减少中间对象），性能优化不会改变语义。
const f = (x) => x + 1;
const g = (x) => x * 3;

const twoMaps = Box.of(5).map(f).map(g);       // (5+1)*3 = 18
const oneMap = Box.of(5).map((x) => g(f(x)));  // 同上，但只过一次 map
console.log('  Box.of(5).map(f).map(g)         →', twoMaps.inspect());
console.log('  Box.of(5).map(x => g(f(x)))     →', oneMap.inspect());
console.log('  结果相等吗？', twoMaps.fold(identity) === oneMap.fold(identity));

// 用一条批量数据验证组合律普遍成立。
const compositionLawHolds = [1, 2, 3, 7, 100].every((n) => {
  const a = Box.of(n).map(f).map(g);
  const b = Box.of(n).map((x) => g(f(x)));
  return a.fold(identity) === b.fold(identity);
});
console.log('  对 [1, 2, 3, 7, 100] 全部成立吗？', compositionLawHolds);

// 组合律还有个更实用的推论：可以随时把链条拆开重构。
const step1 = Box.of(7).map(f);       // 先算一半
const step2 = step1.map(g);           // 再接着算
const allAtOnce = Box.of(7).map((x) => g(f(x)));
console.log('  拆成两步 →', step2.inspect(), ' 一次算完 →', allAtOnce.inspect(), ' 相等 →', step2.fold(identity) === allAtOnce.fold(identity));

console.log('--- 6. 真实场景：把"可能缺失"之外的语境也塞进盒子 ---');

// 场景：后端返回的金额单位是"分"，前端要格式化成人民币字符串。
// 用普通的命令式写法是这样：
function formatCentsNaive(cents, currencySymbol = '￥') {
  if (typeof cents !== 'number' || Number.isNaN(cents)) {
    throw new TypeError('金额必须是数字'); // 命令式的做法：抛错
  }
  return `${currencySymbol}${(cents / 100).toFixed(2)}`;
}
try {
  console.log('  朴素写法 →', formatCentsNaive(123456));
} catch (err) {
  console.log('  朴素写法出错 →', err.message);
}

// 用盒子把"金额的单位换算"表达成一组纯变换。
// 好处：所有变换都是无名的一元函数，可以像积木一样复用、单独测试。
const centsToYuan = (cents) => cents / 100;
const toTwoDecimals = (n) => n.toFixed(2);
const prefixYuan = (s) => `￥${s}`;

const formatted = Box.of(123456).map(centsToYuan).map(toTwoDecimals).map(prefixYuan).fold(identity);
console.log('  盒子写法 →', formatted);
// 组合律让我们把这三次 map 合并成一次，语义完全一致：
const formattedMerged = Box.of(123456)
  .map((cents) => prefixYuan(toTwoDecimals(centsToYuan(cents))))
  .fold(identity);
console.log('  合并成一次 map →', formattedMerged, ' 相等 →', formatted === formattedMerged);

console.log('--- 7. 惊喜：Array 早就是函子 ---');

// 回头看第 1 节的数组，它满足函子的两个条件：
//   of  → Array.of
//   map → arr.map
console.log('  Array.of(1, 2, 3) →', Array.of(1, 2, 3));

// 恒等律：arr.map(v => v) 与 arr 内容一致。
const arr = [1, 2, 3];
console.log('  [1,2,3].map(v => v) 内容一致吗？', JSON.stringify(arr.map(identity)) === JSON.stringify(arr));

// 组合律：arr.map(f).map(g) 与 arr.map(x => g(f(x))) 一致。
console.log('  [1,2,3].map(f).map(g) →', JSON.stringify(arr.map(f).map(g)));
console.log('  [1,2,3].map(x => g(f(x))) →', JSON.stringify(arr.map((x) => g(f(x)))));
console.log('  结论：Array 是函子。它比 Box 多一层含义 —— "0 个或多个值"。');

console.log('--- 8. 惊喜之二：Promise 也是函子 ---');

//   of  → Promise.resolve
//   map → p.then
// 恒等律：Promise.resolve(x).then(v => v) 与 Promise.resolve(x) 等价。
// 组合律：p.then(f).then(g) 与 p.then(v => g(f(v))) 等价。
async function demoPromiseFunctor() {
  const p = Promise.resolve(5);
  const identityLaw = await p.then(identity);
  const compositionLaw = await Promise.resolve(5).then(f).then(g);
  const compositionLawFlat = await Promise.resolve(5).then((x) => g(f(x)));

  console.log('  Promise.resolve(5).then(v => v) →', identityLaw, '（恒等律）');
  console.log('  Promise.resolve(5).then(f).then(g) →', compositionLaw);
  console.log('  Promise.resolve(5).then(x => g(f(x))) →', compositionLawFlat);
  console.log('  组合律成立吗？', compositionLaw === compositionLawFlat);
  console.log('  结论：Promise 是函子。它比 Box 多一层含义 —— "值会晚一点到"。');
}

await demoPromiseFunctor();

console.log('--- 9. 一个必须点明的坑：map 里又返回容器 ---');

// 如果 map 的回调返回的本身就是一个盒子，我们就得到了"盒子里套盒子"。
// 这没违反定律（它仍是个合法的 Box），但结构变得难用了。
const nested = Box.of(3).map((x) => Box.of(x + 1));
console.log('  Box.of(3).map(x => Box.of(x + 1)) →', nested.inspect());
console.log('  嵌套后想再取到里面的数字，得连着 fold 两次：');
console.log('    nested.fold(inner => inner.fold(v => v)) →', nested.fold((inner) => inner.fold((v) => v)));
console.log('  每加一层 map 就多一层嵌套，这就是下一步要解决的"Monad 问题"。');
console.log('  剧透：把 map 换成 chain/flatMap（返回容器时自动拍平），就得到 Monad。');

console.log('--- 10. 小结 ---');
console.log('  函子 = of + map + 满足两条定律的容器。');
console.log('  map 的含义：只变换容器里的值，不破坏容器结构。');
console.log('  恒等律：map(v => v) 什么也不做。');
console.log('  组合律：map(f).map(g) === map(x => g(f(x)))。');
console.log('  已知的函子：Array、Promise、以及我们自己写的 Box。');
console.log('  接下来：当容器还要表达"可能不存在"时，就是 Maybe 函子（02_maybe.js）。');
