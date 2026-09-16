/**
 * ============================================================================
 * 知识点：计算属性名 —— 用 [表达式] 动态构建对象
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】入门
 * 【前置知识】09_objects/01_object_literal.js、09_objects/02_property_access.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    在对象字面量里，键默认是"写死的字面量"。ES2015 引入了"计算属性名"语法：
 *    用一对方括号把**任意表达式**包起来作为键，表达式在创建对象的那一刻求值：
 *      const key = 'name';
 *      const obj = { [key]: '张三' };   // 等价于 { name: '张三' }
 *
 * 2. 为什么需要
 *    现实里对象的键经常是动态的：根据用户输入的表单字段名、根据某个 id、
 *    根据循环变量批量生成。如果没有计算属性名，就只能先创建空对象再逐个赋值：
 *      const obj = {};
 *      obj[key] = value;
 *    计算属性名让"动态键"也能写在字面量里，一次成型、可读性更好。
 *
 * 3. 核心语法要点
 *    (1) 语法：[表达式]: 值，方括号内可以是任何合法表达式，包括变量、运算、
 *        模板字符串、函数调用、甚至另一个对象的属性访问。
 *    (2) 求值时机：对象字面量求值时，方括号里的表达式**按书写顺序**依次求值。
 *    (3) 结果处理：表达式的结果会被强制转换成"属性键"——
 *        字符串保持原样；数字转成字符串；Symbol 保持 Symbol；
 *        其它类型（对象、数组）会调用它的 toString()，如 [1,2] 变成 "1,2"。
 *    (4) 与简写属性、简写方法、展开运算 ... 可以在同一个字面量中混用。
 *    (5) 计算属性名和普通键可以同时存在，后面的同名键会覆盖前面的。
 *
 * 4. 常见陷阱
 *    (1) 忘了写方括号：{ key: 1 } 的键是字符串 "key"，不是变量 key 的值。
 *    (2) 对象作为键会被 toString 成 "[object Object]"，多个不同对象会撞成同一个键。
 *    (3) null / undefined 作为计算键会被转成字符串 "null" / "undefined"，
 *        它们不会报错，但几乎绝对不是你想要的。
 *    (4) 作为键的表达式若抛错，整个对象字面量的求值就中断了。
 *    (5) 用计算属性名复制对象时（{ [k]: obj[k] }）得到的仍是浅拷贝。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/03_computed_property_names.js
 *
 * 【预期输出】
 *   分 6 个小节，展示动态键的写法、求值顺序、类型转换规则以及典型应用场景。
 * ============================================================================
 */

console.log('--- 1. 基本用法：变量当键 ---');

const key = 'name';
const value = '张三';

// 没有方括号时，键就是字面量字符串 "key"。
const wrong = { key: value };
// 加上方括号，键变成变量 key 的值 'name'。
const right = { [key]: value };

console.log('wrong =', JSON.stringify(wrong), '（键是字符串 "key"）');
console.log('right =', JSON.stringify(right), '（键是变量 key 的值 "name"）');

// 现在有了 right 对象，就可以用变量去取值（与写死 'name' 等价）。
console.log("right[key]  =", right[key]);
console.log("right['name'] =", right['name']);

console.log('\n--- 2. 方括号里可以写任意表达式 ---');

const id = 7;
const dynamicObj = {
  // 模板字符串拼接
  [`user_${id}`]: '第七号用户',
  // 算术表达式
  [`level_${1 + 1}`]: '两级',
  // 三元表达式
  [id > 5 ? 'senior' : 'junior']: true,
  // 函数调用
  [String.fromCharCode(65, 66, 67)]: '字母 ABC',
  // 访问另一个对象的属性
  [right[key]]: '这是一把中文键',
  // Symbol 也能作为计算键
  [Symbol.for('tag')]: 'symbol 键',
};

console.log('user_7        =', dynamicObj.user_7);
console.log('level_2       =', dynamicObj.level_2);
console.log('senior        =', dynamicObj.senior);
console.log("键 'ABC' 的值 =", dynamicObj.ABC);
console.log('中文键        =', dynamicObj['张三']);
console.log('Symbol.for 键 =', dynamicObj[Symbol.for('tag')]);

console.log('\n--- 3. 求值顺序：按书写顺序，从左到右 ---');

// 用一个会打印日志的函数来观察"表达式何时被求值、以什么顺序"。
function track(label) {
  console.log('  求值 ->', label);
  return label;
}

console.log('开始构建对象：');
const ordered = {
  [track('第一个键')]: 1,
  plain: 2, // 普通键不产生副作用，无需记录
  [track('第二个键')]: 3,
  [track('第三个键')]: 4,
};
console.log('构建完成，键的顺序 =', Object.keys(ordered));

console.log('\n--- 4. 键的类型强制转换规则 ---');

const box = {
  // 字符串：原样使用
  ['str']: 'string key',
  // 数字：转成字符串 '123'
  [123]: 'number key',
  // 布尔：转成字符串 'true'
  [true]: 'boolean key',
  // null：转成字符串 'null'（不报错，但很危险）
  [null]: 'null key',
  // undefined：转成字符串 'undefined'
  [undefined]: 'undefined key',
  // Symbol：保持 Symbol，不会转成字符串
  [Symbol.iterator]: 'symbol key',
  // 数组：调用 toString()，[1,2] -> "1,2"
  [[1, 2]]: 'array key',
  // 普通对象：调用 toString() -> "[object Object]"
  [{}]: 'object key',
};

console.log('数字键 123 的读取 =', box[123], '/', box['123']);
console.log('布尔键 true 的读取 =', box[true], '/', box['true']);
console.log('null 键的读取      =', box[null], '/', box['null']);
console.log('数组键的读取       =', box[[1, 2]], '/', box['1,2']);
console.log('对象键的读取       =', box[{}], '/', box['[object Object]']);
console.log('全部字符串键 =', Object.keys(box));
console.log('可以看到 Symbol 键不在 Object.keys 里');

// 陷阱：两个不同的对象做键，会撞成同一个 "[object Object]"
const collision = {
  [{}]: '第一次',
  [{}]: '第二次', // 覆盖了上面那个
};
console.log('对象键碰撞后 =', JSON.stringify(collision), '（只剩一个键）');

console.log('\n--- 5. 应用场景一：根据数组批量生成对象 ---');

const fields = ['name', 'email', 'phone'];
const emptyForm = {};
for (const f of fields) {
  emptyForm[f] = ''; // 逐个赋空字符串
}
console.log('运行时逐个赋值 =', JSON.stringify(emptyForm));

// 用 Object.fromEntries 更声明式（见 05 号文件详解）。
console.log(
  'fromEntries 写法 =',
  JSON.stringify(Object.fromEntries(fields.map((f) => [f, '']))),
);

// 应用场景二：把"数组的索引"变成键
const indexed = Object.fromEntries(['a', 'b', 'c'].map((v, i) => [i, v]));
console.log('索引化对象 =', JSON.stringify(indexed));

// 应用场景三：按某个字段把数组"分组"成对象（典型的分组归并）
const people = [
  { name: '张三', dept: '研发' },
  { name: '李四', dept: '市场' },
  { name: '王五', dept: '研发' },
];
const grouped = {};
for (const p of people) {
  // 如果这个部门还没有数组，先创建一个，再 push。
  // `??=` 是逻辑空赋值运算符：仅当左边是 null/undefined 时才赋值。
  grouped[p.dept] ??= [];
  grouped[p.dept].push(p.name);
}
console.log('分组结果 =', JSON.stringify(grouped));

console.log('\n--- 6. 与展开运算、简写属性混用 ---');

const base = { a: 1, b: 2 };
const extraKey = 'c';

const merged = {
  // 简写属性
  base,
  // 展开运算符：把 base 的属性铺开
  ...base,
  // 计算属性名
  [extraKey]: 3,
  // 简写方法
  size() {
    return Object.keys(this).length;
  },
};

// 注意：JSON.stringify 会跳过方法，所以输出里看不到 size；
// 同时 base 这个键的值是对象，a/b 是被 ...base 铺开出来的平级属性。
console.log('merged =', JSON.stringify(merged));
console.log('merged.size() =', merged.size(), '（4 个属性的个数：base, a, b, c）');

// 覆盖顺序演示：同名键，后面的赢。
const first = { x: '来自 first' };
const second = { x: '来自 second' };
console.log('后展开的覆盖前展开的 =', JSON.stringify({ ...first, ...second }));
console.log('计算键放在最后也能覆盖 =', JSON.stringify({ ...first, ['x']: '来自计算键' }));

console.log('\n全部演示完毕。');
