/**
 * ============================================================================
 * 知识点：Symbol —— 唯一性、作为属性键、Symbol.for 注册表与内置符号
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】进阶
 * 【前置知识】03_data_types/06_string_type.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Symbol 是 ES6 引入的第 6 种原始类型，表示"独一无二且不可变"的值。
 *    每调用一次 Symbol() 都会创建一个全新的、永不与其它任何值相等的值。
 *    它主要用途是"属性键"，用来给对象添加不会与字符串键冲突的成员。
 *
 * 2. 为什么需要
 *    · 避免命名冲突：不同库给同一个对象打标记时，用字符串键可能互相覆盖，
 *      用 Symbol 键则天然隔离。
 *    · 实现"半私有"成员：Symbol 属性不会被 for...in / Object.keys /
 *      JSON.stringify 看到，是一种弱封装手段。
 *    · 语言扩展点：Symbol.iterator 等内置符号让自定义对象能接入语言机制
 *      （for...of、展开运算符、隐式类型转换等），这是元编程的基础。
 *
 * 3. 核心语法要点
 *    【创建】
 *      · Symbol('描述') —— 每次都创建全新的值，描述只是给人看的。
 *      · Symbol.for('键') —— 从"全局符号注册表"里取，同一个键永远返回同一个值。
 *      · Symbol.keyFor(sym) —— 反查全局注册表里的键，只对 Symbol.for 创建的有效。
 *    【特性】
 *      · typeof Symbol() === 'symbol'。
 *      · sym.description 可读取描述；sym.toString() 得到 "Symbol(描述)"。
 *      · 不能隐式转字符串或数字：'' + sym、`${sym}`、+sym 都抛 TypeError；
 *        String(sym) 与 sym.toString() 是允许的（规范特例）。
 *      · 不能用 new Symbol()，Symbol 不是构造函数。
 *    【作为属性键】
 *      · 写法一：obj[sym] = 1；写法二：对象字面量用计算属性 [sym]: 1。
 *      · 用 Object.getOwnPropertySymbols(obj) 才能取出这些键。
 *      · 不出现在 Object.keys / Object.values / for...in / JSON.stringify 中。
 *      · 虽然"看不见"，但依然可以枚举（Reflect.ownKeys 能拿到）且可被复制
 *        （Object.assign / 展开运算符会复制 Symbol 属性）。
 *    【内置的 well-known symbol】语言自己用到的钩子：
 *      Symbol.iterator       —— 定义 for...of / 展开 的行为
 *      Symbol.asyncIterator  —— 定义 for await...of 的行为
 *      Symbol.toPrimitive    —— 定义隐式类型转换行为
 *      Symbol.toStringTag    —— 定义 Object.prototype.toString 输出的标签
 *      Symbol.hasInstance    —— 定义 instanceof 的行为
 *      Symbol.species        —— 定义派生对象的构造函数
 *      Symbol.isConcatSpreadable —— 定义数组 concat 是否展开
 *      Symbol.match / replace / search / split —— 定义字符串方法的行为
 *      Symbol.unscopables    —— 配合 with 语句（已不推荐使用）
 *
 * 4. 常见陷阱
 *    · Symbol('a') === Symbol('a') 是 false —— 描述相同并不意味着值相同。
 *    · 用 Symbol 做"真正私有"并不可靠：Reflect.ownKeys 能列出全部 Symbol 键。
 *    · JSON.stringify 会直接丢掉 Symbol 键，跨进程传输需要自己处理。
 *    · 忘记 Symbol.for 与 Symbol 的区别，导致"注册表里的键"和"新键"混用。
 *    · Symbol 不能参与算术，会把类型错误提前暴露出来（这其实是好事）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/09_symbol_type.js
 *
 * 【预期输出】
 *   打印 Symbol 的唯一性实验、作为属性键时的可见性差异、全局注册表用法、
 *   以及 Symbol.iterator / toPrimitive / toStringTag 三个内置符号的实战演示。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 唯一性
// ---------------------------------------------------------------------------

console.log('--- 1. Symbol 的唯一性 ---');

const s1 = Symbol('tag');
const s2 = Symbol('tag');
console.log('Symbol("tag") === Symbol("tag") ?', s1 === s2, '← 描述相同，值不同');
console.log('typeof s1 =', typeof s1);
console.log('s1.description =', s1.description);
console.log('String(s1)     =', String(s1));
console.log('s1.toString()  =', s1.toString());

// 用 Symbol 当"常量枚举"，天然不会重名。
const RED = Symbol('red');
const GREEN = Symbol('green');
console.log('RED === GREEN ?', RED === GREEN);
console.log('RED === Symbol("red") ?', RED === Symbol('red'), '← 依然是 false');

// 不能隐式转成字符串 / 数字，会自动抛错。
try {
  console.log('前缀' + s1);
} catch (err) {
  console.log("'前缀' + s1 →", err.name + ':', err.message);
}
try {
  console.log(`${s1}`);
} catch (err) {
  console.log('`${s1}` →', err.name + ':', err.message);
}
try {
  console.log(+s1);
} catch (err) {
  console.log('+s1 →', err.name + ':', err.message);
}
console.log('但显式转换可以：String(s1) =', String(s1));

// Symbol 不是构造函数，用 new 会抛错。
try {
  // eslint-disable-next-line no-new
  new Symbol('x');
} catch (err) {
  console.log('new Symbol("x") →', err.name + ':', err.message);
}

// ---------------------------------------------------------------------------
// 2. 作为属性键
// ---------------------------------------------------------------------------

console.log('--- 2. Symbol 作为属性键 ---');

const SECRET = Symbol('secret');

const account = {
  username: 'alice', // 普通字符串键
  balance: 100,
  [SECRET]: '内部令牌-abc123', // 计算属性名写法，键是 Symbol
};

// 用中括号读取（点号语法对 Symbol 无效，因为 Symbol 不是合法标识符）。
console.log('account.username       =', account.username);
console.log('account[SECRET]        =', account[SECRET]);
console.log('account.SECRET         =', account.SECRET, '← 点号访问的是字符串键，取不到');

// 写入也可以：
account[SECRET] = '内部令牌-xyz789';
console.log('改写后 account[SECRET] =', account[SECRET]);

// 可见性对比：常规枚举手段看不到 Symbol 键。
console.log('Object.keys(account)              =', Object.keys(account));
console.log('Object.values(account)            =', Object.values(account));
console.log('JSON.stringify(account)           =', JSON.stringify(account), '← Symbol 键直接消失');
console.log('Object.getOwnPropertyNames(account) =', Object.getOwnPropertyNames(account));

// 必须用专用 API 才能拿到 Symbol 键。
console.log('Object.getOwnPropertySymbols(account) =', Object.getOwnPropertySymbols(account));
console.log('Reflect.ownKeys(account)          =', Reflect.ownKeys(account), '← 字符串键 + Symbol 键');

// for...in 也遍历不到 Symbol 键。
const seenKeys = [];
for (const key in account) seenKeys.push(key);
console.log('for...in 遍历到的键：', seenKeys);

// 但展开运算符和 Object.assign 会复制 Symbol 属性（浅拷贝是"复制所有自有可枚举属性"）。
const copied = { ...account };
console.log('展开复制后拿得到吗？', copied[SECRET], '← 拿得到，说明它确实被复制了');
console.log('拷贝副本的 Symbol 键与原件是同一个：',
  Object.getOwnPropertySymbols(copied)[0] === SECRET);

// ---------------------------------------------------------------------------
// 3. 全局符号注册表：Symbol.for / Symbol.keyFor
// ---------------------------------------------------------------------------

console.log('--- 3. Symbol.for 全局注册表 ---');

// Symbol.for 会先查全局注册表，有就返回，没有才创建 —— 所以同键同值。
const g1 = Symbol.for('app.uid');
const g2 = Symbol.for('app.uid');
console.log('Symbol.for("app.uid") === Symbol.for("app.uid") ?', g1 === g2, '← true');
console.log('Symbol("app.uid") === Symbol.for("app.uid") ?', Symbol('app.uid') === g1, '← false');

// 反查键：只有 Symbol.for 创建的符号才能查到。
console.log('Symbol.keyFor(g1)                  =', Symbol.keyFor(g1));
console.log('Symbol.keyFor(Symbol("local"))     =', Symbol.keyFor(Symbol('local')), '← 不在注册表里');

// 实用场景：跨模块共享一个"标记"，两边都不需要 import 同一个变量。
/** 用全局符号登记"已初始化"标记，任何模块都能查到它 */
function initializeOnce(target) {
  const FLAG = Symbol.for('myLib.initialized');
  if (target[FLAG]) return '已初始化，跳过';
  target[FLAG] = true;
  return '首次初始化完成';
}
const shared = {};
console.log('第一次 initializeOnce:', initializeOnce(shared));
console.log('第二次 initializeOnce:', initializeOnce(shared));
console.log('标记是否可见于 Object.keys：', Object.keys(shared), '（不可见）');

// ---------------------------------------------------------------------------
// 4. 内置符号之一：Symbol.iterator —— 让对象可被 for...of 遍历
// ---------------------------------------------------------------------------

console.log('--- 4. Symbol.iterator ---');

/** 一个可迭代的"数字区间"对象 */
const range = {
  from: 1,
  to: 4,
  // 只要实现了 [Symbol.iterator] 方法并返回一个迭代器，就是"可迭代对象"。
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    return {
      // next() 返回 { value, done }
      next() {
        return current <= last
          ? { value: current++, done: false }
          : { value: undefined, done: true };
      },
    };
  },
};

console.log('for...of 遍历 range：');
for (const n of range) console.log('  取到', n);
console.log('展开运算符也能用：[...range] =', [...range]);
console.log('解构也能用：const [first, second] = [...range] →', [...range].slice(0, 2));
console.log('Array.from(range) =', Array.from(range));
console.log('typeof range[Symbol.iterator] =', typeof range[Symbol.iterator]);

// ---------------------------------------------------------------------------
// 5. 内置符号之二：Symbol.toPrimitive —— 自定义隐式转换
// ---------------------------------------------------------------------------

console.log('--- 5. Symbol.toPrimitive ---');

/** 带自定义类型转换行为的"金额"对象 */
const money = {
  amount: 88,
  currency: 'CNY',
  // hint 参数是 'number' | 'string' | 'default'，由引擎根据上下文传入。
  [Symbol.toPrimitive](hint) {
    console.log('  （toPrimitive 被调用，hint =', hint + '）');
    if (hint === 'number') return this.amount;
    if (hint === 'string') return `${this.amount} ${this.currency}`;
    return `${this.amount} ${this.currency}`; // default 分支
  },
};

console.log('算术上下文（number 提示）：money * 2 =', money * 2);
console.log('字符串上下文（string 提示）：String(money) =', String(money));
console.log('模板字符串（string 提示）：', `${money}`);
console.log('宽松比较（default 提示）：money == "88 CNY" →', money == '88 CNY');

// 对比：普通对象没有 Symbol.toPrimitive 时走 valueOf / toString。
const plain = { amount: 88 };
console.log('普通对象 + 0 =', plain + 0, '← 走了 toString，得到 "[object Object]0"');

// ---------------------------------------------------------------------------
// 6. 内置符号之三：Symbol.toStringTag —— 自定义类型标签
// ---------------------------------------------------------------------------

console.log('--- 6. Symbol.toStringTag ---');

class Money {
  constructor(amount) {
    this.amount = amount;
  }

  // 有了它，Object.prototype.toString 会输出 [object Money]。
  get [Symbol.toStringTag]() {
    return 'Money';
  }
}

const m = new Money(10);
console.log('Object.prototype.toString.call(new Money(10)) =', Object.prototype.toString.call(m));
console.log('对比普通对象：', Object.prototype.toString.call({}));
console.log('对比数组：    ', Object.prototype.toString.call([]));
console.log('typeof 不受影响：', typeof m, '（仍然是 object）');

// 顺带一览语言内置的 well-known symbol 有哪些名字：
const wellKnown = [
  'iterator',
  'asyncIterator',
  'toPrimitive',
  'toStringTag',
  'hasInstance',
  'species',
  'isConcatSpreadable',
  'match',
  'matchAll',
  'replace',
  'search',
  'split',
  'unscopables',
];
console.log('内置 well-known symbol 一览：');
for (const name of wellKnown) {
  console.log('  Symbol.' + name, '→', String(Symbol[name]));
}

console.log('--- 完成：Symbol 的唯一性、属性键与内置符号 ---');
