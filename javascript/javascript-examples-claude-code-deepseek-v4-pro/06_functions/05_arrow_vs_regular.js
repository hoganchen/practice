/**
 * ============================================================================
 * 知识点：箭头函数 vs 普通函数 —— this、arguments、new、prototype、hoisting 全维度对比
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】进阶
 * 【前置知识】06_functions/04_arrow_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本示例把"箭头函数"和"普通函数"放在同一套场景下逐一实测，
 *    用可运行的代码把五个维度的差异全部验证一遍：
 *      ① this 的绑定规则      ② arguments 对象
 *      ③ new 调用（构造函数）  ④ prototype 属性
 *      ⑤ 提升行为（hoisting）
 *    外加两个实用维度：能否用作对象方法、能否用作回调。
 *
 * 2. 为什么需要
 *    "什么时候该用箭头函数、什么时候必须用普通函数"是面试与实战中的高频问题。
 *    只背结论容易记混，把两个函数放在同一段代码里跑出来对比，结论才牢固。
 *
 * 3. 核心语法要点
 *    (1) this 绑定：
 *          普通函数 —— 由调用点决定（默认绑定 / 隐式绑定 / 显式绑定 / new 绑定）
 *          箭头函数 —— 由定义点决定，取外层词法作用域的 this，无法被改写
 *    (2) arguments：
 *          只有普通函数（非箭头）才有自己的 arguments 对象
 *    (3) new：
 *          普通函数有 [[Construct]]，可以 new；
 *          箭头函数没有，new 会抛 TypeError: xxx is not a constructor
 *    (4) prototype：
 *          只有普通函数（以及 ES6 class）有 prototype 属性，箭头函数没有
 *    (5) hoisting：
 *          函数声明整体提升，可以提前调用；
 *          箭头函数是"函数表达式"，遵循变量提升规则（var → undefined，let/const → TDZ）
 *
 * 4. 常见陷阱
 *    - 用箭头函数写对象方法，结果 this 指向外层而不是对象。
 *    - 用箭头函数写事件回调后又想用 arguments。
 *    - 用 var 修饰箭头函数然后提前调用（拿到 undefined）。
 *    - 在需要动态 this 的场景（如原型方法、Vue/React 的旧式类组件方法）误用箭头函数。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/05_arrow_vs_regular.js
 *
 * 【预期输出】
 *   五个维度逐一对比实测 + 最后的选型建议表。
 * ============================================================================
 */

console.log('--- 1. this 绑定：普通函数看调用点，箭头函数看定义点 ---');

// 【普通函数】this 在调用时才确定。
function regularWhoAmI() {
  // 模块顶层是严格模式，直接调用时 this 是 undefined。
  return this === undefined ? 'undefined' : this.name;
}

// 【箭头函数】定义在模块顶层，词法 this 就是模块顶层的 this（严格模式下是 undefined），
// 不管后面被谁调用、被 call/apply/bind 怎么折腾，都是这个值。
const arrowWhoAmI = () => (this === undefined ? 'undefined' : this.name);

const zhangsan = { name: '张三', fn: regularWhoAmI };
const lisi = { name: '李四', fn: regularWhoAmI };

console.log('  普通函数 张三.fn()            →', zhangsan.fn());
console.log('  普通函数 李四.fn()            →', lisi.fn());
console.log('  普通函数 李四.fn.call(张三)    →', lisi.fn.call(zhangsan), '  ← this 随调用点改变');

console.log('  箭头函数 arrowWhoAmI()        →', arrowWhoAmI());
console.log('  箭头函数 arrowWhoAmI.call(张三) →', arrowWhoAmI.call(zhangsan), '  ← call 改不了它');
console.log('  箭头函数 arrowWhoAmI.call(李四) →', arrowWhoAmI.call(lisi), '  ← 永远是这个值');

console.log('--- 2. this 的经典实战：回调里丢失 this ---');

// 场景：一个"计时器对象"，需要在回调里访问自己的 count。
const timer = {
  name: '计时器',
  count: 0,

  // 【错误示范】用普通函数作回调：setTimeout 调用它时 this 不是 timer。
  runWrong() {
    const self = this; // 老代码的标准补救手法
    // 这里用一个同步回调模拟，避免真的用定时器（保持输出确定、无需等待）。
    [1].forEach(function () {
      // 严格模式下这里的 this 是 undefined，直接访问 this.count 会抛错。
      try {
        self.count += this.count;
      } catch (err) {
        self.count += 1;
        console.log('  普通函数回调里 this 是', this === undefined ? 'undefined' : this.name, '→ 报错：', err.message);
      }
    });
    return this.count;
  },

  // 【正确示范】用箭头函数作回调：this 直接继承 runRight 的 this（也就是 timer）。
  runRight() {
    [1].forEach(() => {
      this.count += 1; // this 就是 timer
    });
    return this.count;
  },
};

console.log('  普通函数作回调的结果 →', timer.runWrong());
console.log('  箭头函数作回调的结果 →', timer.runRight());

console.log('--- 3. arguments：只有普通函数有 ---');

function regularWithArgs() {
  // 普通函数内部 arguments 自动存在。
  return Array.from(arguments);
}
const arrowWithArgs = (...args) => args; // 箭头函数只能用剩余参数
const arrowTouchingArguments = function () {
  // 在普通函数里再定义一个箭头函数：箭头函数用的 arguments 是外层这个普通函数的。
  const inner = () => Array.from(arguments);
  return inner();
};

console.log('  regularWithArgs("a","b")          →', regularWithArgs('a', 'b'));
console.log('  arrowWithArgs("a","b")            →', arrowWithArgs('a', 'b'));
console.log('  箭头函数借用外层 arguments        →', arrowTouchingArguments('a', 'b'), '  ← 继承的是外层的');
try {
  [1].forEach(() => arguments);
} catch (err) {
  console.log('  模块顶层箭头函数用 arguments       → 报错', err.constructor.name, ':', err.message);
}

console.log('--- 4. new：只有普通函数能作为构造函数 ---');

function RegularCtor(name) {
  this.name = name;
  this.kind = '普通函数构造出来的实例';
}
const ArrowCtor = (name) => ({ name, kind: '箭头函数只能用工厂函数模拟' });

const inst1 = new RegularCtor('实例A');
console.log('  new RegularCtor("实例A")        →', inst1);
console.log('  inst1 instanceof RegularCtor    →', inst1 instanceof RegularCtor);

try {
  new ArrowCtor('实例B');
} catch (err) {
  console.log('  new ArrowCtor("实例B") 报错类型 →', err.constructor.name);
  console.log('  错误信息：', err.message);
}
// 箭头函数想达到同样效果，只能当"工厂函数"：直接调用、返回对象。
console.log('  ArrowCtor("实例B")（工厂调用）   →', ArrowCtor('实例B'));

console.log('--- 5. prototype：只有普通函数有 ---');

console.log('  RegularCtor.prototype 的类型   →', typeof RegularCtor.prototype);
console.log('  RegularCtor.prototype.constructor === RegularCtor →', RegularCtor.prototype.constructor === RegularCtor);
console.log('  ArrowCtor.prototype            →', ArrowCtor.prototype);
console.log('  "prototype" in ArrowCtor       →', 'prototype' in ArrowCtor, '  ← 连属性都不存在');
// 普通函数可以在原型上挂方法，被所有实例共享。
RegularCtor.prototype.say = function () {
  return `我是 ${this.name}`;
};
console.log('  inst1.say()                    →', inst1.say());

console.log('--- 6. hoisting：函数声明 vs 箭头函数表达式 ---');

// 函数声明整体提升，提前调用没问题。
console.log('  提前调用 declaredFn() →', declaredFn());
function declaredFn() {
  return '我是函数声明，已在创建阶段被提升';
}

// 箭头函数是表达式，赋值给 const 后处于 TDZ，提前调用抛 ReferenceError。
try {
  lexicalFn();
} catch (err) {
  console.log('  提前调用 lexicalFn()  → 报错', err.constructor.name, ':', err.message);
}
const lexicalFn = () => '我是箭头函数表达式，不会被整体提升';
console.log('  定义后调用 lexicalFn() →', lexicalFn());

// 同理，普通函数"表达式"也不提升，说明问题出在"表达式"而非"箭头"本身。
try {
  regularExpr();
} catch (err) {
  console.log('  提前调用 regularExpr() → 报错', err.constructor.name, ':', err.message);
}
var regularExpr = function () {
  return '普通函数表达式同样不提升';
};
console.log('  定义后调用 regularExpr() →', regularExpr());

console.log('--- 7. 额外维度：能否作为对象方法 ---');

const obj = {
  name: '对象',
  // 方法简写：this 指向调用者，正确。
  regularMethod() {
    return `普通方法里的 this.name = ${this.name}`;
  },
  // 属性值是箭头函数：this 是定义时的外层 this（模块顶层 undefined），不是 obj。
  arrowMethod: () => `箭头方法里的 this = ${this === undefined ? 'undefined' : this.name}`,
};

console.log(' ', obj.regularMethod());
console.log(' ', obj.arrowMethod(), '  ← 拿不到 obj.name');

console.log('--- 8. 全维度对比表 ---');

const table = [
  ['this 的确定时机', '调用时（动态）', '定义时（词法）'],
  ['this 能否被 call/apply/bind 改变', '能', '不能'],
  ['是否有 arguments', '有', '没有，用 ...args'],
  ['能否 new 调用', '能', '不能（TypeError）'],
  ['是否有 prototype', '有', '没有'],
  ['能否做 generator（yield）', '能', '不能'],
  ['提升行为', '函数声明整体提升', '作为表达式，遵循变量提升/TDZ'],
  ['能否省略 return', '不能，必须显式 return', '单表达式可隐式返回'],
  ['适合做对象方法', '适合', '不适合'],
  ['适合做回调', '需要 bind 或用 self 兜底', '适合'],
  ['适合做构造函数/工厂', '适合构造函数', '只适合工厂函数'],
];
for (const [item, reg, arrow] of table) {
  console.log(`  · ${item}`);
  console.log(`      普通函数：${reg}`);
  console.log(`      箭头函数：${arrow}`);
}

console.log('--- 9. 选型建议 ---');
console.log('  1) 需要动态 this（对象方法、原型方法、构造函数）→ 用普通函数/方法简写。');
console.log('  2) 回调、数组方法、需要继承外层 this → 用箭头函数。');
console.log('  3) 需要 arguments → 用普通函数；否则优先用剩余参数，可读性更好。');
console.log('  4) 需要提前调用（互相递归的顶层函数）→ 用函数声明。');
