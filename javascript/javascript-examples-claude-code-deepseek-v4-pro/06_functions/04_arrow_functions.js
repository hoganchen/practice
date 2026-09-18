/**
 * ============================================================================
 * 知识点：箭头函数语法、简写形式、与普通函数的差异清单
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】入门
 * 【前置知识】06_functions/01_declaration_vs_expression.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    箭头函数（arrow function）是 ES6 引入的更简短的函数写法：
 *      const add = (a, b) => a + b;
 *    它不只是"少写几个字符"的语法糖，而是语义上也变了一个函数：
 *    它没有自己的 this、没有 arguments、没有 prototype，也不能被 new。
 *
 * 2. 为什么需要
 *    传统函数里 this 由"谁调用"决定，在回调场景里经常丢失（比如 setTimeout、
 *    数组方法里的回调）。开发者不得不用 `const self = this` 或 `.bind(this)` 兜底。
 *    箭头函数把 this 直接"锁定"为外层作用域的 this，从根上消灭了这类问题，
 *    同时让函数式写法（map/filter/reduce 的回调）更短更好读。
 *
 * 3. 核心语法要点
 *    (1) 各种简写形态：
 *          () => {}           无参
 *          x => {}            单参可省括号（但为了统一，很多风格强制保留括号）
 *          (a, b) => {}       多参必须加括号
 *          (a, b) => a + b    单表达式可省 {} 和 return（"隐式返回"）
 *          () => ({ a: 1 })   返回对象字面量必须用圆括号包住
 *    (2) 箭头函数是"表达式"，必须赋值给变量或用掉，不能直接 `arrow() {}` 声明。
 *    (3) 没有 this：函数体内的 this 就是定义时外层作用域的 this，且永不改变
 *        （call/apply/bind 都改不了它）。
 *    (4) 没有 arguments；需要可变参数请用剩余参数 `...args`。
 *    (5) 没有 prototype，不能用 new 调用。
 *    (6) 不能用 yield，因此不能做 generator。
 *
 * 4. 常见陷阱
 *    - 直接返回对象字面量忘了加括号：`() => { name: 'x' }` 被当成函数体，
 *      结果返回 undefined。
 *    - 把箭头函数当成对象方法：里面的 this 不是那个对象。
 *    - 用箭头函数写构造函数。
 *    - 多行隐式返回写了换行导致 ASI 出问题（应在 => 后紧跟表达式）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/04_arrow_functions.js
 *
 * 【预期输出】
 *   演示箭头函数的 6 种简写形态、隐式返回、返回对象的坑，
 *   以及"没有 this / arguments / prototype / 不能 new"四条差异。
 * ============================================================================
 */

console.log('--- 1. 箭头函数的各种简写形态 ---');

// 形态 1：完整写法，最啰嗦，但结构最清晰。
const form1 = (a, b) => {
  return a + b;
};

// 形态 2：单表达式省略 return（隐式返回）。
// 注意：省略的是 {} 和 return，两者必须同时省略。
const form2 = (a, b) => a + b;

// 形态 3：只有一个参数时可以省略参数括号。
// 很多团队（如 Airbnb 风格）仍要求保留括号，因为后续加参数时 diff 更小。
const form3 = (x) => x * 2;
const form3NoParen = (x) => x * 2; // 这里都写括号，风格更稳妥

// 形态 4：没有参数时必须写空括号。
const form4 = () => '我没有参数';

// 形态 5：要写多行逻辑时，必须回到 {} + return。
const form5 = (n) => {
  const doubled = n * 2;
  const squared = doubled ** 2;
  return squared;
};

// 形态 6：返回对象字面量必须用圆括号包住整个字面量。
const form6Good = (name) => ({ name, type: '对象字面量' });

console.log('  form1(1, 2)        →', form1(1, 2));
console.log('  form2(1, 2)        →', form2(1, 2));
console.log('  form3(21)          →', form3(21));
console.log('  form3NoParen(21)   →', form3NoParen(21));
console.log('  form4()            →', form4());
console.log('  form5(3)           →', form5(3), '（(3*2)^2 = 36）');
console.log('  form6Good("小明")  →', form6Good('小明'));

console.log('--- 2. 返回对象字面量的经典陷阱 ---');

// 不加圆括号时，引擎把 {} 当成"函数体代码块"，
// 而 `name, type` 这种被当作标签语句/逗号表达式，函数没有 return → undefined。
const form6Bad = (name) => {
  name;
};
console.log('  不加括号 →', form6Bad('小明'), '（返回 undefined，不是对象）');
console.log('  加了括号 →', form6Good('小明'), '（正确返回对象）');

console.log('--- 3. 差异一：箭头函数没有自己的 this ---');

// 普通函数：this 由"调用方式"决定，同一个函数换个调用者，this 就变了。
function regularThis() {
  return this === undefined ? 'undefined（严格模式下直接调用）' : this.tag;
}

// 箭头函数：this 在"定义那一刻"就固定为外层作用域的 this，之后永不改变。
const arrowThis = () => (this === undefined ? 'undefined（模块顶层就是 undefined）' : this.tag);

const hostA = { tag: 'A', fn: regularThis };
const hostB = { tag: 'B', fn: regularThis };
console.log('  hostA.fn()          →', hostA.fn(), '  ← 普通函数：this 指向 hostA');
console.log('  hostB.fn()          →', hostB.fn(), '  ← 普通函数：this 指向 hostB');

// 把普通函数"借"给另一个对象，this 又变了一次。
console.log('  hostB.fn.call(hostA) →', hostB.fn.call(hostA), '  ← this 被 call 改成了 hostA');

// 箭头函数的 this 改不动：call/apply/bind 对它无效（它们只能改参数，改不了 this）。
console.log('  arrowThis()          →', arrowThis());
console.log('  arrowThis.call(hostA) →', arrowThis.call(hostA), '  ← call 无法改变它的 this');

console.log('--- 4. 差异二：箭头函数没有 arguments ---');

function regularArgs() {
  return arguments.length;
}
const arrowArgs = (...args) => args.length; // 只能用剩余参数替代
const arrowArgsBroken = () => {
  try {
    return arguments.length; // 会去外层作用域找 arguments
  } catch (err) {
    return `捕获 ${err.constructor.name}：模块顶层没有 arguments`;
  }
};
console.log('  regularArgs(1,2,3)     →', regularArgs(1, 2, 3));
console.log('  arrowArgs(1,2,3)       →', arrowArgs(1, 2, 3), '（用 ...args 实现同样效果）');
console.log('  arrowArgsBroken(1,2,3) →', arrowArgsBroken(1, 2, 3));

console.log('--- 5. 差异三：没有 prototype 属性 ---');

console.log('  regularThis.prototype →', typeof regularThis.prototype, '（普通函数有 prototype 对象）');
console.log('  arrowThis.prototype   →', arrowThis.prototype, '（箭头函数是 undefined）');
console.log('  普通函数原型上的 constructor 指向自己吗？', regularThis.prototype.constructor === regularThis);

console.log('--- 6. 差异四：不能用 new 调用 ---');

try {
  // 箭头函数没有 [[Construct]] 内部方法，new 会直接抛 TypeError。
  const instance = new arrowThis();
  console.log('  不应该走到这里：', instance);
} catch (err) {
  console.log('  new arrowThis() 报错类型：', err.constructor.name);
  console.log('  错误信息：', err.message);
}

// 普通函数可以正常 new。
function Person(name) {
  this.name = name;
}
const p = new Person('小明');
console.log('  new Person("小明") →', p, '（普通函数可以当构造函数）');

console.log('--- 7. 差异五：不能用作 generator ---');

// 下面这种写法是语法错误（不能取消注释运行）：
// const gen = () => { yield 1; };

// 正确做法：函数表达式（或函数声明）才能带 * 变成生成器。
const gen = function* () {
  yield 1;
  yield 2;
};
console.log('  普通生成器取值 →', [...gen()], '（箭头函数做不到这一点）');

console.log('--- 8. 差异清单汇总 ---');

const diffTable = [
  ['有自己的 this', '有，随调用方式变化', '没有，锁定为外层 this'],
  ['能被 call/apply/bind 改 this', '能', '不能'],
  ['有 arguments 对象', '有', '没有（用 ...args）'],
  ['有 prototype 属性', '有', '没有（undefined）'],
  ['能作为构造函数 new', '能', '不能（TypeError）'],
  ['能用作 generator(yield)', '能', '不能'],
  ['提升行为', '函数声明会整体提升', '是表达式，遵循变量提升规则'],
  ['适合作为对象方法', '适合', '不适合（this 不对）'],
  ['适合作为回调', '一般', '非常适合（不丢 this）'],
];
console.log('  对比项'.padEnd(6), '| 普通函数 | 箭头函数');
for (const [item, reg, arrow] of diffTable) {
  console.log(`  ${item}：普通函数 → ${reg}；箭头函数 → ${arrow}`);
}
