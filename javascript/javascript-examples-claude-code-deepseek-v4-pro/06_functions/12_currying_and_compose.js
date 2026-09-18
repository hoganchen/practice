/**
 * ============================================================================
 * 知识点：柯里化与函数组合（compose / pipe）
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】高级
 * 【前置知识】06_functions/07_call_apply_bind.js、06_functions/08_higher_order_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    柯里化（currying，以逻辑学家 Haskell Curry 命名）：把一个接收 n 个参数的函数，
 *    改造成"一次只收一个参数、收齐了才执行"的函数链。
 *      add(1, 2, 3)  →  add(1)(2)(3)
 *    注意区分"部分应用（partial application）"：柯里化是"每次都只传一个"，
 *    部分应用是"先传一部分，剩下的以后再传"（bind 就是部分应用）。
 *    实际工程里两者经常混用，统称"柯里化"。
 *
 *    函数组合（composition）：把多个一元函数串成一条流水线，
 *    前一个的输出作为后一个的输入：
 *      compose(f, g)(x) 等价于 f(g(x))      —— 从右往左（数学写法）
 *      pipe(f, g)(x)    等价于 g(f(x))      —— 从左往右（更符合阅读顺序）
 *
 * 2. 为什么需要
 *    柯里化把"通用函数"变成"专用函数工厂"，让函数可以被当作积木反复拼装：
 *    `const isAdult = isOlderThan(18)` 比每次都写 `isOlderThan(18, x)` 更容易复用。
 *    组合则是把复杂逻辑拆成一组只做一件小事的纯函数，再像管道一样拼起来——
 *    这正是 Ramda / lodash/fp、Redux 的中间件、以及各种数据管道库的核心思想。
 *
 * 3. 核心语法要点
 *    (1) 柯里化的两种实现：
 *          - 手写：靠闭包一层层收集参数（最直观，推荐理解用）。
 *          - 通用 curry 函数：用 fn.length 判断"还需要几个参数"。
 *    (2) 注意 fn.length 只统计"第一个默认值/剩余参数之前"的形参个数。
 *    (3) compose 从右往左，pipe 从左往右；两者内部都用 reduce 实现。
 *    (4) 组合的前提是"每个函数都接收上一个的输出"——所以组合的函数
 *        通常是"一元函数"（只收一个参数），多元函数要先柯里化再组合。
 *
 * 4. 常见陷阱
 *    - 把柯里化和部分应用混为一谈（面试常考）。
 *    - 组合顺序记反：compose 是从右往左执行（像数学的 f(g(x))）。
 *    - 用函数做参数时忘了"提前把参数准备好"，导致柯里化链永远不触发。
 *    - 过度柯里化：简单的两参数函数硬拆成两层，可读性反而下降。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/12_currying_and_compose.js
 *
 * 【预期输出】
 *   演示手写柯里化、通用 curry 实现、偏应用、compose 与 pipe 的实现与差异，
 *   最后用一条完整的数据处理管道把两者串起来。
 * ============================================================================
 */

console.log('--- 1. 手写柯里化：一次只收一个参数 ---');

// 普通版本：一次要传三个参数，少一个都不行。
function addNormal(a, b, c) {
  return a + b + c;
}
console.log('  addNormal(1, 2, 3) →', addNormal(1, 2, 3));

// 柯里化版本：每一层返回一个新函数，靠闭包记住上一层收到的参数。
function addCurried(a) {
  return function (b) {
    return function (c) {
      return a + b + c; // 最内层才真正计算，a、b 来自闭包
    };
  };
}
console.log('  addCurried(1)(2)(3) →', addCurried(1)(2)(3));
// 可以分步骤保存中间结果，这是柯里化最实用的地方。
const add1 = addCurried(1);
const add1and2 = add1(2);
console.log('  addCurried(1) 得到 →', typeof add1, '（一个还没算完的函数）');
console.log('  add1(2) 得到       →', typeof add1and2, '（还是函数）');
console.log('  add1and2(3) 得到   →', add1and2(3));
console.log('  add1and2(100) 得到 →', add1and2(100), '  ← 中间结果可以反复复用');

// 箭头函数写法更紧凑。
const addCurriedArrow = (a) => (b) => (c) => a + b + c;
console.log('  箭头版 addCurriedArrow(1)(2)(3) →', addCurriedArrow(1)(2)(3));

console.log('--- 2. 柯里化的通用实现 ---');

// 思路：收集参数，直到数量够了（>= fn.length）才真正调用。
function curry(fn) {
  return function curried(...args) {
    // fn.length 是函数"声明的形参个数"（不含默认值与剩余参数之后的）。
    if (args.length >= fn.length) {
      return fn.apply(this, args); // 参数够了，执行
    }
    // 参数还不够，返回一个新函数继续收集。
    return function (...rest) {
      return curried.apply(this, [...args, ...rest]);
    };
  };
}

function multiply(a, b, c) {
  return a * b * c;
}
const curriedMultiply = curry(multiply);
console.log('  curry(multiply)(2)(3)(4)   →', curriedMultiply(2)(3)(4), '（一次一个）');
console.log('  curry(multiply)(2, 3)(4)   →', curriedMultiply(2, 3)(4), '（也可以一次多个）');
console.log('  curry(multiply)(2)(3, 4)   →', curriedMultiply(2)(3, 4));
console.log('  curry(multiply)(2, 3, 4)   →', curriedMultiply(2, 3, 4), '（一次给全就直接执行）');

// 通用 curry 的一个注意点：fn.length 会被默认参数"截断"。
function withDefault(a, b = 10, c) {}
const curriedWithDefault = curry(withDefault);
console.log('  function withDefault(a, b = 10, c) 的 fn.length →', withDefault.length, '（从默认值开始就不计入了）');
console.log('  curry 后只需要 1 个参数就会执行 →', curriedWithDefault(1), '（因为 length 是 1）');
console.log('  结论：通用 curry 只适合"所有形参都没有默认值/剩余参数"的场景。');

console.log('--- 3. 柯里化的实战价值：制造专用函数 ---');

// 通用函数：判断某个数是否大于阈值。
const isGreaterThan = (threshold) => (value) => value > threshold;

// 造出一批"专用判断函数"。
const isAdult = isGreaterThan(18);
const isSenior = isGreaterThan(60);

const ages = [12, 25, 63, 17, 45, 70];
console.log('  年龄列表 →', ages);
console.log('  成年人（>18）→', ages.filter(isAdult));
console.log('  老年人（>60）→', ages.filter(isSenior));
console.log('  注意：filter 传进去的 isAdult 是"已经配好阈值"的函数，代码非常干净。');

// 对比：不柯里化时得写成箭头函数包裹，啰嗦一些。
console.log('  不柯里化的等价写法 →', ages.filter((age) => age > 18));

console.log('--- 4. 柯里化 vs 部分应用（partial application）---');

// 柯里化：严格的一次一个参数。
const curriedStyle = (a) => (b) => (c) => `柯里化: ${a}-${b}-${c}`;
// 部分应用：先把一部分参数固定住，得到的新函数再接收剩下的（不要求一次一个）。
function partial(fn, ...preset) {
  return function (...rest) {
    return fn(...preset, ...rest);
  };
}
function greetStyle(greeting, target, punctuation) {
  return `${greeting}，${target}${punctuation}`;
}
const sayHello = partial(greetStyle, '你好');
console.log('  ', curriedStyle('柯里化')(1)(2));
console.log('  ', sayHello('小明', '！'));
console.log('  ', partial(greetStyle, '你好', '小红')('？'));
console.log('  区别小结：');
console.log('    柯里化   —— 固定"一次一个参数"的形式，可以完全不用参数就产生专用函数。');
console.log('    部分应用 —— 只固定前若干个，剩下的可以一次性补全，更灵活。');
console.log('    工程上常把两者混用，笼统地都叫"柯里化"。');

console.log('--- 5. 函数组合：compose（从右往左）---');

// 组合若干个"一元函数"，返回一个新函数。
// 数学写法：compose(f, g)(x) === f(g(x))
function compose(...fns) {
  // 没有函数时返回一个恒等函数，避免调用方拿到 undefined。
  if (fns.length === 0) return (x) => x;
  // reduceRight 从右往左折叠：最右边的函数最先执行。
  return function (x) {
    return fns.reduceRight((acc, fn) => fn(acc), x);
  };
}

const trim = (s) => s.trim();
const toLowerCase = (s) => s.toLowerCase();
const replaceSpace = (s) => s.replace(/\s+/g, '-');

// 从右往左：先 replaceSpace，再 toLowerCase，最后 trim。
const slugify = compose(trim, toLowerCase, replaceSpace);
console.log('  compose(trim, toLowerCase, replaceSpace)("  Hello World JS  ")');
console.log('  →', slugify('  Hello World JS  '));
console.log('  等价于 trim(toLowerCase(replaceSpace("  Hello World JS  "))) →', trim(toLowerCase(replaceSpace('  Hello World JS  '))));
console.log('  注意结果首尾各有一个 "-"：因为 trim 排在最后执行，此时空格早被替换成 "-" 了，');
console.log('  所以顺序很重要 —— 把 trim 放到最右边（最先执行）才符合预期：');
const slugifyFixed = compose(toLowerCase, replaceSpace, trim); // trim 最先执行
console.log('  compose(toLowerCase, replaceSpace, trim)("  Hello World JS  ") →', slugifyFixed('  Hello World JS  '));

console.log('--- 6. 函数组合：pipe（从左往右）---');

// pipe 与 compose 的唯一区别是执行顺序，更符合"从上往下读"的直觉。
function pipe(...fns) {
  if (fns.length === 0) return (x) => x;
  return function (x) {
    // reduce 从左往右折叠：最左边的函数最先执行。
    return fns.reduce((acc, fn) => fn(acc), x);
  };
}

// 从左往右读，trim 最先执行，结果更符合预期。
const slugifyPipe = pipe(trim, replaceSpace, toLowerCase);
console.log('  pipe(trim, replaceSpace, toLowerCase)("  Hello World JS  ")');
console.log('  →', slugifyPipe('  Hello World JS  '));
console.log('  两者结果一致，只是书写顺序和执行顺序的对应关系不同：');
console.log('    compose(a, b, c)(x) === a(b(c(x)))');
console.log('    pipe(a, b, c)(x)    === c(b(a(x)))');

console.log('--- 7. 组合的前提：函数最好是"一元"的 ---');

// 组合只把"一个值"传下去，所以多元函数必须先柯里化才能组合。
const addPrefix = (prefix) => (s) => `${prefix}${s}`;
const addSuffix = (suffix) => (s) => `${s}${suffix}`;
const repeat = (times) => (s) => s.repeat(times);

// 先把多元函数柯里化成工厂，再造出具体的一元函数。
const withAt = addPrefix('@');
const withExcl = addSuffix('!');

const shout = pipe(withAt, withExcl, repeat(2));
console.log('  pipe(withAt, withExcl, repeat(2))("hi") →', shout('hi'));
console.log('  分步看：withAt("hi") =', withAt('hi'), ' → withExcl(...) =', withExcl(withAt('hi')), ' → repeat(2)(...) =', shout('hi'));

console.log('--- 8. 综合实战：一条完整的数据处理管道 ---');

const rawUsers = [
  { name: '  alice ', age: 17, tags: ['js', 'css'] },
  { name: 'BOB', age: 32, tags: [] },
  { name: '  Carol', age: 25, tags: ['go'] },
  { name: 'dave ', age: 70, tags: ['js'] },
  { name: 'Eve', age: 15, tags: [] },
];

// 一组只做一件小事的纯函数（都是一元函数，方便组合）。
const normalizeName = (user) => ({ ...user, name: user.name.trim() });
const capitalize = (user) => ({ ...user, name: user.name[0].toUpperCase() + user.name.slice(1).toLowerCase() });
const keepAdults = (users) => users.filter((u) => u.age >= 18);
const dropEmptyTags = (users) => users.map((u) => ({ ...u, tags: u.tags.length ? u.tags : ['未分类'] }));
const sortByAgeDesc = (users) => [...users].sort((a, b) => b.age - a.age);

// 单条用户：先规范化名字（用 compose 表达"先归一化再首字母大写"）。
const cleanUser = compose(capitalize, normalizeName);
console.log('  单个用户处理：cleanUser({ name: "  alICE ", age: 20 }) →', cleanUser({ name: '  alICE ', age: 20 }));

// 列表处理：用 pipe 串起整条流水线（注意列表函数接收的是数组）。
const processUsers = pipe(keepAdults, dropEmptyTags, sortByAgeDesc, (users) => users.map(cleanUser));
const processed = processUsers(rawUsers);
console.log('  处理结果：');
for (const u of processed) {
  console.log(`    ${u.name.padEnd(8)} 年龄 ${String(u.age).padEnd(3)} 标签 [${u.tags.join(', ')}]`);
}
console.log('  原始数据是否被修改？', rawUsers[0].name === '  alice ', '（没被修改，全程都是纯函数 + 新对象）');

console.log('--- 9. 什么时候该用、什么时候不该用 ---');

// 值得用：把一组纯函数拼成可复用的数据管道。
const formatPrice = pipe(
  (n) => n.toFixed(2),
  addPrefix('￥'),
);
console.log('  formatPrice(1234.5) →', formatPrice(1234.5), '（小工具用组合很舒服）');

// 不值得用：只有一步、或者需要复杂中间状态的逻辑，硬套柯里化只会更难读。
const badExample = (a) => (b) => (c) => (d) => (e) => a + b + c + d + e;
console.log('  badExample(1)(2)(3)(4)(5) →', badExample(1)(2)(3)(4)(5), '（能跑，但五层柯里化已经很难读了）');
console.log('  建议：柯里化控制在 2~3 层；组合的函数控制在 3~5 个；');
console.log('        组合链太长时，拆成几条有名字的子管道，可读性更好。');
