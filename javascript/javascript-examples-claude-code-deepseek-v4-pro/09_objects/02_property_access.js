/**
 * ============================================================================
 * 知识点：属性访问 —— 点访问 vs 方括号访问、in 与 hasOwnProperty
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】入门
 * 【前置知识】09_objects/01_object_literal.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 提供两种读取 / 写入对象属性的语法：
 *      (1) 点访问（dot notation）：obj.name
 *      (2) 方括号访问（bracket notation）：obj['name'] 或 obj[expr]
 *    两者都能读写属性，差别在于：方括号里可以放"任意表达式"，点后面只能跟"固定标识符"。
 *
 * 2. 为什么需要
 *    属性名在写代码时往往并不确定：可能来自用户输入、配置文件、循环变量。
 *    这时只能使用方括号访问：obj[key]，其中 key 是运行时才确定的字符串。
 *
 * 3. 核心语法要点
 *    (1) 点访问：键必须是合法标识符，且写死在源码里。可读性最好，优先使用。
 *    (2) 方括号访问：[] 内可以是任意表达式，会先求值再转成字符串作为键。
 *    (3) 访问不存在的属性不会报错，返回 undefined。这是"静默失败"，容易埋 bug。
 *    (4) in 运算符：'key' in obj，检查属性是否存在于该对象**或其原型链**上。
 *    (5) Object.prototype.hasOwnProperty.call(obj, 'key')：只检查"自有属性"（旧写法）。
 *        Object.hasOwn(obj, 'key') 是新写法（ES2022），语义相同但更安全，见 11 号文件。
 *    (6) 删除属性用 delete obj.key，成功返回 true；删除不存在的属性也返回 true。
 *    (7) 属性名可以是 Symbol，Symbol 键只能用方括号访问。
 *
 * 4. 常见陷阱
 *    (1) obj.1abc 是语法错误，点后面不能以数字开头；必须写 obj['1abc']。
 *    (2) 方括号里如果不加引号，会被当成变量：obj[name] 取的是变量 name 的值，
 *        而不是字面量 'name'。这是初学者最常见的错误。
 *    (3) 用 in 判断会"穿透到原型"：'toString' in {} 是 true，因为继承自 Object.prototype。
 *    (4) 遍历时用 for...in 也会枚举原型上的可枚举属性（本例不展开，见 14 号文件）。
 *    (5) null / undefined 上取属性会抛 TypeError（Cannot read properties of null）。
 *        可用可选链 ?. 规避，见 15 号文件。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/02_property_access.js
 *
 * 【预期输出】
 *   分 6 个小节演示两种访问语法的差异，以及三种"属性是否存在"的判断方式。
 * ============================================================================
 */

console.log('--- 1. 点访问 vs 方括号访问：等价的写法 ---');

const user = {
  name: '张三',
  age: 20,
  'my-key': '带连字符的键',
};

// 对于合法的标识符键，两种写法完全等价。
console.log('user.name      =', user.name);
console.log("user['name']   =", user['name']);
console.log('两者相等       =', user.name === user['name']);

// 但含连字符 / 空格 / 数字开头的键，只能用方括号。
console.log("user['my-key'] =", user['my-key']);
// 下面这样写是语法错误（会被解析成 user.my 减去 key），所以注释掉：
// console.log(user.my-key);

console.log('\n--- 2. 动态键：方括号里放表达式 ---');

const field = 'age'; // 键名存在变量里

// 方括号会先求值 field 得到 'age'，再以它为键去取值。
// 点访问做不到这件事：user.field 取的是名为 "field" 的属性（不存在）。
console.log("user[field]  =", user[field], '（动态键，取到了 age）');
console.log('user.field   =', user.field, '（点访问不会求值变量，所以是 undefined）');

// 方括号里可以放任意表达式
const prefix = 'na';
console.log("user[prefix + 'me'] =", user[prefix + 'me']);

// 数字键：方括号里给数字，会被自动转成字符串。
const byIndex = { 0: 'zero', 1: 'one' };
console.log('byIndex[0]    =', byIndex[0]);
console.log("byIndex['0']  =", byIndex['0']);
console.log('两者相等      =', byIndex[0] === byIndex['0']);

console.log('\n--- 3. 写入与删除 ---');

// 两种语法都能写属性；属性不存在就是"新增"，存在就是"覆盖"。
const config = { debug: false };
config.debug = true; // 点访问写
config['level'] = 'info'; // 方括号写
config[`ts_${Date.now() > 0 ? 'now' : 'x'}`] = '动态键写入';
console.log('config =', JSON.stringify(config));

// 删除属性用 delete 运算符，返回布尔值表示"删除动作是否成功"。
console.log('delete config.debug =', delete config.debug);
console.log('删除后 config =', JSON.stringify(config));

// 注意：删除一个本来就不存在的属性，也返回 true（因为"删除后它确实不存在"）。
console.log("delete config.notExist =", delete config.notExist);

console.log('\n--- 4. 访问不存在的属性：返回 undefined，不报错 ---');

const empty = {};
console.log('empty.anything        =', empty.anything);
console.log("empty['whatever']     =", empty['whatever']);
console.log('typeof 结果是         =', typeof empty.anything);

// 危险之处：把 undefined 继续当对象用就会炸。这里用 try/catch 演示。
try {
  // empty.a 是 undefined，再取 .b 就会抛 TypeError
  console.log(empty.a.b);
} catch (err) {
  console.log('报错信息：', err.name, '-', err.message);
}

// 正确做法一：先判断再取。
if (empty.a !== undefined) {
  console.log(empty.a.b);
} else {
  console.log('先判断 empty.a !== undefined，安全地跳过了');
}

// 正确做法二：用可选链（后续 15 号文件详解）。
console.log('用可选链 empty.a?.b =', empty.a?.b);

console.log('\n--- 5. in 运算符 vs hasOwnProperty vs Object.hasOwn ---');

const child = { own: 1 }; // 只有自有属性 own
// 用一个"继承链"上的属性做对比：toString 来自 Object.prototype，不是自有属性。
const target = Object.create(child);
target.mine = 2;

// (1) in：会沿着原型链查找。只要自身或原型上有，就返回 true。
console.log("'mine' in target        =", 'mine' in target, '（自有属性）');
console.log("'own' in target         =", 'own' in target, '（原型上的属性，in 也能找到）');
console.log("'toString' in target    =", 'toString' in target, '（来自 Object.prototype）');
console.log("'nope' in target        =", 'nope' in target);

// (2) hasOwnProperty：只看自有属性，不看原型。但它是 Object.prototype 上的方法，
//     如果对象自己定义了一个叫 hasOwnProperty 的属性，或对象没有原型，就会出问题。
console.log("target.hasOwnProperty('mine')  =", target.hasOwnProperty('mine'));
console.log("target.hasOwnProperty('own')   =", target.hasOwnProperty('own'), '（原型上的，不算自有）');
console.log("target.hasOwnProperty('toString') =", target.hasOwnProperty('toString'));

// hasOwnProperty 的坑一：对象上有个同名属性，就把方法"遮住"了。
const shadowed = { hasOwnProperty: '我把它覆盖了' };
try {
  // 这里会抛 TypeError：shadowed.hasOwnProperty 是字符串，不是函数
  console.log(shadowed.hasOwnProperty('x'));
} catch (err) {
  console.log('被遮蔽时报错：', err.name, '-', err.message);
}

// 规避方式（旧写法）：借用 Object.prototype 上的原始方法，用 .call 指定 this。
console.log(
  "Object.prototype.hasOwnProperty.call(shadowed, 'hasOwnProperty') =",
  Object.prototype.hasOwnProperty.call(shadowed, 'hasOwnProperty'),
);

// (3) 最推荐的现代写法：Object.hasOwn(obj, key)（ES2022，Node 16.9+ 提供）。
//     它不受遮蔽影响，也不要求对象有原型。
console.log("Object.hasOwn(shadowed, 'hasOwnProperty') =", Object.hasOwn(shadowed, 'hasOwnProperty'));
console.log("Object.hasOwn(target, 'own')              =", Object.hasOwn(target, 'own'));
console.log("Object.hasOwn(target, 'toString')         =", Object.hasOwn(target, 'toString'));

console.log('\n--- 6. Symbol 键只能用方括号访问 ---');

const secret = Symbol('secret');
const withSymbol = {
  visible: '看得见',
  [secret]: '只有拿到 Symbol 才能访问',
};

// 点语法无法表达 Symbol 键，必须用方括号。
console.log('withSymbol[secret] =', withSymbol[secret]);
// Symbol 键不会出现在 Object.keys / JSON.stringify 里。
console.log('Object.keys      =', JSON.stringify(Object.keys(withSymbol)));
console.log('JSON.stringify   =', JSON.stringify(withSymbol));

console.log('\n全部演示完毕。');
