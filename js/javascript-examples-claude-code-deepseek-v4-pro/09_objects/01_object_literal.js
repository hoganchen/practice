/**
 * ============================================================================
 * 知识点：对象字面量语法 —— 属性、方法、简写与尾随逗号
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】入门
 * 【前置知识】00_hello_world/01_hello_world.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    对象（Object）是 JS 中最常用的复合数据类型，用来把一组"键值对"聚合在一起。
 *    对象字面量（object literal）就是用一对花括号 {} 直接写出一个对象的语法：
 *      const user = { name: '张三', age: 20 };
 *    其中 name / age 叫"键"（key，也叫属性名），'张三' / 20 叫"值"（value）。
 *
 * 2. 为什么需要
 *    现实中的数据几乎都是"有结构的"：一个用户有姓名、年龄、邮箱；一件商品有标题、价格。
 *    如果只用一堆散装变量（name1、age1、name2、age2...），代码会迅速失控。
 *    对象把相关的数据打包成一个整体，可以整体传递、整体返回、整体序列化。
 *
 * 3. 核心语法要点
 *    (1) 键的写法：可以是标识符（不加引号）、字符串（加引号）、
 *        数字字面量（会被转成字符串"1"）、计算属性名（用 [表达式]）。
 *    (2) 值的写法：可以是任意表达式，包括另一个对象、数组、函数，甚至箭头函数。
 *    (3) 简写属性（shorthand property）：当"变量名"和"想要的键名"相同时，
 *        可以只写一次：{ name } 等价于 { name: name }。
 *    (4) 简写方法（shorthand method）：{ sayHi() {} } 等价于 { sayHi: function () {} }。
 *        注意简写方法不能当作构造函数用（没有 prototype），也没有自己的 this 绑定规则差异。
 *    (5) 尾随逗号（trailing comma）：最后一个属性后面多写一个逗号是合法的。
 *        好处是增删属性时 git diff 只变动一行，不容易出错。
 *    (6) 对象是引用类型：变量里存的是"指向对象的地址"，赋值给另一个变量不会复制内容。
 *
 * 4. 常见陷阱
 *    (1) 键如果不符合标识符规则，必须加引号：{ 'my-key': 1 } 合法，{ my-key: 1 } 是减法表达式，报错。
 *    (2) 数字键会被强制转换为字符串，obj[1] 和 obj['1'] 是同一个属性。
 *    (3) 尾随逗号在 ES5 之后对对象字面量合法，但在函数参数/调用中要 ES2017 才合法。
 *    (4) 简写属性容易让人误以为"重命名"，其实只是省写；重命名必须写全 { 新名: 旧变量 }。
 *    (5) 对象字面量每次求值都会创建一个**全新**的对象，两个长得一样的字面量并不相等。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/01_object_literal.js
 *
 * 【预期输出】
 *   分 6 个小节演示对象字面量的各种写法，并对比引用相等与结构相等。
 * ============================================================================
 */

console.log('--- 1. 最基础的对象字面量 ---');

// 声明一个对象：花括号内是 "键: 值" 列表，键值之间用冒号分隔，多个属性用逗号分隔。
// 这里的 name / age / isStudent 都是合法标识符，所以键可以不加引号。
const user = {
  name: '张三',
  age: 20,
  isStudent: true,
};

// 访问属性用"点语法"：对象.属性名。
console.log('name =', user.name);
console.log('age =', user.age);

// (2) 值的部分可以是任意表达式：数值、字符串、布尔、数组、另一个对象、函数……
//    这里 hobbies 的值是一个数组，address 的值是"嵌套对象"。
const user2 = {
  name: '李四',
  hobbies: ['读书', '游泳'],
  address: {
    city: '杭州',
    zip: '310000',
  },
};
console.log('user2.hobbies =', user2.hobbies);
console.log('user2.address.city =', user2.address.city);

// ---------------------------------------------------------------------------
console.log('--- 2. 键的合法写法：字符串键、数字键 ---');

const weird = {
  // 合法标识符：不需要引号
  normalKey: 1,
  // 含连字符的键不是合法标识符，必须用引号包起来
  'my-key': 2,
  // 含空格的键同理
  'my key': 3,
  // 数字字面量作为键：会被自动转成字符串 '4'
  4: 'four',
};

console.log("weird['my-key'] =", weird['my-key']);
console.log("weird['my key'] =", weird['my key']);

// 重要：数字键 4 实际存成了字符串 '4'，所以下面两种写法取到同一个值。
console.log('weird[4]   =', weird[4]); // 数字 4 被转成 '4'
console.log("weird['4'] =", weird['4']); // 直接给字符串 '4'
console.log('两者相等 =', weird[4] === weird['4']);

// ---------------------------------------------------------------------------
console.log('--- 3. 简写属性 shorthand property ---');

const name = '王五';
const age = 30;

// 传统写法：键和值都写一遍
const oldStyle = { name: name, age: age };

// 简写属性：变量名 == 想要的键名时，只写一次即可。
// 这两行完全是语法糖，产生的对象结构一模一样。
const newStyle = { name, age };

console.log('oldStyle =', JSON.stringify(oldStyle));
console.log('newStyle =', JSON.stringify(newStyle));
console.log('两者内容相同 =', JSON.stringify(oldStyle) === JSON.stringify(newStyle));

// 简写 + 非简写可以混用；也可以用它来"重命名"（写全 新键: 旧变量）。
const mixed = { name, age, level: 'VIP', nickname: name };
console.log('mixed =', JSON.stringify(mixed));

// 简写属性最常见的用途：把一堆局部变量打包成返回值。
const width = 100;
const height = 50;
console.log('尺寸对象 =', JSON.stringify({ width, height }));

// ---------------------------------------------------------------------------
console.log('--- 4. 简写方法与函数属性 ---');

const counter = {
  // 传统写法：值是函数表达式
  addOld: function (a, b) {
    return a + b;
  },

  // 简写方法：省掉 ": function"，直接写 方法名() {}
  // 与上面完全等价，只是更短。
  add(a, b) {
    return a + b;
  },

  // 值是箭头函数也是合法的。
  // 区别：箭头函数没有自己的 this，方法简写有；
  // 箭头函数不能作为构造函数（不能 new），普通函数和简写方法可以。
  double: (n) => n * 2,

  // 方法内部同样可以访问同对象的其它属性（通过 this）。
  describe() {
    return `我是计数器，当前值 ${this.value}`;
  },

  value: 7,
};

console.log('counter.addOld(1, 2) =', counter.addOld(1, 2));
console.log('counter.add(1, 2)    =', counter.add(1, 2));
console.log('counter.double(21)   =', counter.double(21));
console.log('counter.describe()   =', counter.describe());

// ---------------------------------------------------------------------------
console.log('--- 5. 尾随逗号 trailing comma ---');

// 最后一个属性后面带一个逗号，是完全合法的语法。
// 推荐这样做：以后在末尾追加属性时，只新增一行，不修改上一行，diff 更干净。
const withTrailingComma = {
  a: 1,
  b: 2,
  c: 3, // <- 这个逗号没问题
};
console.log('withTrailingComma =', JSON.stringify(withTrailingComma));

// 数组字面量的尾随逗号同理。
const arrTrailing = [1, 2, 3];
console.log('arrTrailing =', JSON.stringify(arrTrailing));

// 但要注意两种"看起来一样、其实不一样"的情况：
// (1) [1, 2, 3,] 长度是 3，因为尾随逗号被忽略；
console.log('[1, 2, 3,].length =', [1, 2, 3,].length);
// (2) 中间多写逗号会制造"空位"（稀疏数组），长度变成 4，第 3 个是 empty。
console.log('[1, 2, , 4].length =', [1, 2, , 4].length);
console.log('[1, 2, , 4] =', JSON.stringify([1, 2, , 4]), '（空位会变成 null）');

// ---------------------------------------------------------------------------
console.log('--- 6. 对象是引用类型：每次字面量都是新对象 ---');

const a1 = { x: 1 };
const a2 = { x: 1 };

// 内容一样，但它们是内存里两个不同的对象，所以 === 为 false。
console.log('a1 === a2 ?', a1 === a2, '（内容相同，但不是同一个对象）');

// 赋值只是复制"地址"，两个变量指向同一个对象。
const a3 = a1;
console.log('a1 === a3 ?', a1 === a3, '（指向同一个对象）');

// 通过 a3 改属性，a1 也会"跟着变"，因为本来就是同一个对象。
a3.x = 999;
console.log('改 a3.x 后，a1.x =', a1.x);

// 想比较内容是否相同，只能逐属性比较，或借助序列化（有局限，见后续章节）。
console.log('序列化后比较 =', JSON.stringify(a1) === JSON.stringify({ x: 999 }));

console.log('\n全部演示完毕。');
