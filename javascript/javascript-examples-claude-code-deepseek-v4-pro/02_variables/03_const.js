/**
 * ============================================================================
 * 知识点：const —— 常量绑定、对象内容可变、什么时候该用 const
 * ============================================================================
 *
 * 【所属分类】02_variables —— 变量与作用域
 * 【难度等级】入门
 * 【前置知识】02_variables/02_let.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    const 与 let 一样是块级作用域、有 TDZ、不可重复声明，但它多了一条约束：
 *    **绑定不可重新赋值（no reassignment）**，而且**声明时必须初始化**。
 *    这里的"不可变"指的是"这个变量名永远指向同一个值"，而不是"这个值本身不可改变"。
 *    这个区别是理解 const 的全部关键，也是新手最容易误解的地方。
 *
 * 2. 为什么需要 / 解决什么问题
 *    程序里绝大多数变量其实"从生到死只被赋值一次"。把这些变量声明为 const：
 *    （a）给读代码的人一个强信号：这个名字不会在别处被改掉，可以放心阅读；
 *    （b）让"意外修改"变成运行时报错，而不是几公里外才发现的诡异数据；
 *    （c）给引擎更多优化空间（这个绑定不会变，可以做一些假设）。
 *    用一句话概括：const 让"不可变"成为默认值，把可变性变成需要显式声明的例外。
 *
 * 3. 核心语法要点
 *    （1）必须初始化
 *          const a;      // SyntaxError: Missing initializer in const declaration
 *          const a = 1;  // 正确
 *    （2）不能重新赋值
 *          const a = 1; a = 2;  // TypeError: Assignment to constant variable
 *    （3）但内容可以改（对对象/数组而言）
 *          const arr = [1, 2, 3];
 *          arr.push(4);      // 允许：改的是数组内容，不是 arr 这个绑定
 *          arr = [0];        // 报错：这是重新赋值
 *          要真正锁住内容，用 Object.freeze（浅冻结）。
 *    （4）块级作用域 + TDZ + 不可重复声明，与 let 完全一致。
 *    （5）for...of / for...in 里可以直接用 const 声明循环变量，
 *        因为每轮迭代都是一个新绑定，不会发生"重新赋值"。
 *    （6）顶层 const 不会成为 globalThis 的属性。
 *
 * 4. 常见陷阱与注意事项
 *    - 最大的误解：以为 const 让对象"不可变"。它只是让**绑定**不可变。
 *      const obj = {}; obj.x = 1; 完全合法。
 *    - Object.freeze 是**浅冻结**：嵌套对象的属性依然可以改。
 *      要深冻结需要递归处理（或 structuredClone 后再冻结，但那是另一回事）。
 *    - 冻结后的对象在严格模式下赋值会抛 TypeError，在非严格模式下静默失败。
 *      因为 ESM 是严格模式，所以你看到的会是抛错。
 *    - 不要把"常量"和 const 混为一谈：按照社区约定，UPPER_SNAKE_CASE 表示
 *      "配置常量"，而 const 只是"不重新赋值的绑定"。`const userList = []`
 *      里的 userList 不该写成 USER_LIST。
 *    - const 声明之前的部分处于 TDZ，访问会抛 ReferenceError（与 let 相同）。
 *    - 对于原始类型（number/string/boolean…），const 的效果确实就是"不可变"，
 *      因为原始值本身就没有"内部结构"可以改。
 *    - 本文件中所有会抛错的演示都包在 try/catch 中。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 02_variables/03_const.js
 *
 * 【预期输出】
 *   分节演示：必须初始化、不可重新赋值、对象/数组内容可改、
 *   Object.freeze 的浅冻结效果与局限、for...of 中的 const、
 *   以及何时该用 const 的实用建议。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. const 必须初始化
// ---------------------------------------------------------------------------

console.log('--- 1. const 声明时必须赋值 ---');

try {
  new Function('const notInitialized;');
} catch (err) {
  console.log('const 不初始化 →', err.constructor.name + '：' + err.message);
}
console.log('对比 let：', (() => {
  let canBeEmpty; // let 允许先声明后赋值
  canBeEmpty = '后赋值也行';
  return canBeEmpty;
})());

// ---------------------------------------------------------------------------
// 2. 不可重新赋值
// ---------------------------------------------------------------------------

console.log('\n--- 2. const 绑定不可重新赋值 ---');

const fixedNumber = 42;
console.log('初始值：', fixedNumber);

try {
  // @ts-expect-error 故意制造错误以演示
  fixedNumber = 43;
} catch (err) {
  console.log('重新赋值 →', err.constructor.name + '：' + err.message);
}
console.log('值依然是：', fixedNumber, '（赋值失败，原值未变）');

// += / ++ 等复合赋值同样是"重新赋值"，也会报错。
const counter = 0;
try {
  // @ts-expect-error 故意制造错误以演示
  counter++;
} catch (err) {
  console.log('自增 →', err.constructor.name + '：' + err.message);
}

// ---------------------------------------------------------------------------
// 3. 关键：内容可变，绑定不可变
// ---------------------------------------------------------------------------

console.log('\n--- 3. const 锁的是"绑定"，不是"内容" ---');

// const 声明的数组：可以随意修改它的元素、长度。
const numbers = [1, 2, 3];
console.log('初始数组：', numbers);
numbers.push(4); // 修改内容：允许
numbers[0] = 100; // 修改元素：允许
console.log('push 与改元素之后：', numbers);

// 但是整体替换（重新绑定）不行。
try {
  // @ts-expect-error 故意制造错误以演示
  numbers = [9, 9, 9];
} catch (err) {
  console.log('整体替换数组 →', err.constructor.name + '：' + err.message);
}

// 对象同理：可以增删改属性，不能整体替换。
const person = { name: '小明', age: 18 };
console.log('初始对象：', person);
person.age = 19; // 改属性：允许
person.city = '北京'; // 新增属性：允许
delete person.city; // 删属性：允许
console.log('增删改属性之后：', person);

try {
  // @ts-expect-error 故意制造错误以演示
  person = { name: '小红' };
} catch (err) {
  console.log('整体替换对象 →', err.constructor.name + '：' + err.message);
}

console.log('一句话记忆：const 管的是"这个变量名还能不能指向别的东西"，');
console.log('            不管"它指向的那个东西内部能不能变"。');

// 原始类型没有"内部结构"，所以对它们来说 const 就等于真的不可变。
const PI_APPROX = 3.14159;
console.log('原始类型（数字）：const 就等于完全不可变 →', PI_APPROX);

// ---------------------------------------------------------------------------
// 4. 想真正锁住内容：Object.freeze（浅冻结）
// ---------------------------------------------------------------------------

console.log('\n--- 4. Object.freeze：浅冻结 ---');

const frozenPerson = Object.freeze({ name: '小明', age: 18 });
console.log('冻结后 isFrozen：', Object.isFrozen(frozenPerson));

// 冻结后再改属性：严格模式下抛 TypeError（ESM 就是严格模式）。
try {
  // @ts-expect-error 故意制造错误以演示
  frozenPerson.age = 99;
} catch (err) {
  console.log('修改冻结对象的属性 →', err.constructor.name + '：' + err.message);
}
console.log('冻结对象的 age 依然是：', frozenPerson.age);

// 冻结对象也禁止新增和删除属性。
try {
  // @ts-expect-error 故意制造错误以演示
  frozenPerson.email = 'x@y.z';
} catch (err) {
  console.log('给冻结对象加属性 →', err.constructor.name + '：' + err.message);
}

// 删除冻结对象的属性：严格模式下同样抛 TypeError（非严格模式下才是静默返回 false）。
try {
  const deleted = delete frozenPerson.name;
  console.log('删除冻结对象属性返回：', deleted);
} catch (err) {
  console.log('删除冻结对象的属性 →', err.constructor.name + '：' + err.message);
}
console.log('name 依然在：', frozenPerson.name);

// 冻结数组同样有效。
const frozenArray = Object.freeze([1, 2, 3]);
try {
  // @ts-expect-error 故意制造错误以演示
  frozenArray.push(4);
} catch (err) {
  console.log('向冻结数组 push →', err.constructor.name + '：' + err.message);
}

// 关键局限：Object.freeze 是**浅冻结**，嵌套对象的属性仍然可以改。
const shallow = Object.freeze({ nested: { value: 1 } });
shallow.nested.value = 999; // 不报错！外层被冻结了，但 nested 指向的对象没有
console.log('浅冻结的漏洞：shallow.nested.value =', shallow.nested.value, '（被改掉了）');

// 要深冻结，得自己递归。下面给一个实用的小工具。
/**
 * 递归冻结对象及其所有嵌套对象（深度冻结）。
 *
 * @param {object} obj 要冻结的对象
 * @returns {object} 同一个对象（已深度冻结）
 */
function deepFreeze(obj) {
  // 先冻结自己
  Object.freeze(obj);
  // 再对每一层属性递归处理（只处理对象类型的属性）
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
  return obj;
}

const deep = deepFreeze({ nested: { value: 1 }, list: [1, 2] });
try {
  // @ts-expect-error 故意制造错误以演示
  deep.nested.value = 999;
} catch (err) {
  console.log('深冻结后修改嵌套属性 →', err.constructor.name + '：' + err.message);
}
console.log('深冻结后 nested.value =', deep.nested.value, '（保持原值，说明真的锁住了）');

// ---------------------------------------------------------------------------
// 5. for...of / for...in 中的 const
// ---------------------------------------------------------------------------

console.log('\n--- 5. 循环里的 const ---');

// for...of 每轮迭代都是一个**新的**绑定，所以用 const 完全没问题。
// 这也是最推荐的写法：既享受块级作用域，又表明"我不会改这个元素"。
const results = [];
for (const item of ['apple', 'banana', 'cherry']) {
  results.push(item.toUpperCase());
}
console.log('for...of + const：', results);

// for...in 遍历键名，同样可以每轮一个新绑定。
const obj = { a: 1, b: 2, c: 3 };
const keys = [];
for (const key in obj) {
  keys.push(key + '=' + obj[key]);
}
console.log('for...in + const：', keys);

// 但传统的三段式 for 循环里，循环变量需要自增（重新赋值），必须用 let。
let sum = 0;
for (let i = 0; i < 5; i++) {
  sum += i;
}
console.log('三段式 for 需要自增 → 只能用 let：sum =', sum);

// for...of 想同时拿到下标时，用 entries()。
const indexed = [];
for (const [index, value] of ['x', 'y'].entries()) {
  indexed.push(index + ':' + value);
}
console.log('for...of + entries() + const：', indexed);

// ---------------------------------------------------------------------------
// 6. 什么时候用 const
// ---------------------------------------------------------------------------

console.log('\n--- 6. 实用建议：默认 const ---');

// 建议一：默认写 const，报错了再改成 let。
// 这样每个 let 都是"不得不为之"，而不是随手写的。
const config = { retries: 3, timeout: 1000 }; // 不重新赋值 → const
config.retries = 5; // 修改内容依然合法，不需要改成 let
console.log('改内容不需要动 const 声明：', config);

// 建议二：区分两种"常量"
// （a）配置常量：值本身是约定好的固定配置，用 UPPER_SNAKE_CASE。
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT_MS = 5000;
// （b）只是"不重新赋值的普通变量"：依然用 camelCase。
const currentUser = { id: 1, name: '小明' };
const activeUsers = [currentUser];
console.log('配置常量：MAX_RETRY_COUNT =', MAX_RETRY_COUNT, '/ DEFAULT_TIMEOUT_MS =', DEFAULT_TIMEOUT_MS);
console.log('普通 const 变量：currentUser =', currentUser, '/ activeUsers.length =', activeUsers.length);
console.log('→ 不要因为用了 const 就把变量名全大写，全大写只留给"配置常量"。');

// 建议三：函数式风格里，用 const 把中间结果命名，避免深层嵌套。
const rawInput = '  Hello World  ';
const trimmed = rawInput.trim(); // 每一步都是一个 const
const lowered = trimmed.toLowerCase();
const slug = lowered.replace(/\s+/g, '-');
console.log('链式命名中间结果：', { rawInput, trimmed, lowered, slug });

// 建议四：模块导入也是 const 语义（导入的绑定不能被重新赋值）。
// 例如 `import path from 'node:path';` 之后不能再给 path 赋值。
console.log('import 进来的绑定同样不可重新赋值（ESM 规范如此）。');

console.log('\n--- 7. 小结 ---');
console.log('· const 必须初始化，不能重新赋值；块级作用域、TDZ、禁止重复声明与 let 相同。');
console.log('· const 锁"绑定"不锁"内容"：对象/数组的内容仍可增删改。');
console.log('· 要锁内容用 Object.freeze，但它是浅冻结，深冻结需要递归。');
console.log('· for...of / for...in 里可以直接用 const；三段式 for 必须用 let。');
console.log('· 默认 const，需要重新赋值时才用 let；UPPER_SNAKE_CASE 只留给配置常量。');
