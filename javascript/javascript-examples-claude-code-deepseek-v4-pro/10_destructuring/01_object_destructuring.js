/**
 * ============================================================================
 * 知识点：对象解构 —— 基本用法、重命名、默认值、函数参数解构
 * ============================================================================
 *
 * 【所属分类】10_destructuring —— 解构赋值
 * 【难度等级】入门
 * 【前置知识】09_objects/01_object_literal.js、09_objects/02_property_access.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    解构（destructuring）是一种"从对象或数组里把值取出来赋给变量"的语法糖。
 *    对象解构的写法是把对象字面量放在赋值号左边：
 *      const { name, age } = user;
 *    它等价于：
 *      const name = user.name;
 *      const age = user.age;
 *    注意：解构的"花括号在左边"是赋值目标，不是对象字面量；要小心与代码块混淆。
 *
 * 2. 为什么需要
 *    (1) 少写重复的对象名：user.name、user.age、user.email 变成一次 { name, age, email }。
 *    (2) 让"我要用哪些字段"一目了然，代码自带文档性。
 *    (3) 天然支持重命名和默认值，非常适合处理"可选字段"。
 *    (4) 函数参数解构让 options 对象模式变得极其干净（见本文件第 5 节）。
 *
 * 3. 核心语法要点
 *    (1) 基本形式：const { 属性名 } = 源对象；变量名与属性名相同。
 *    (2) 重命名：const { 属性名: 新变量名 } = 源对象；冒号左边是"键"，右边是"变量"。
 *    (3) 默认值：const { 属性名 = 默认值 } = 源对象；仅在取到 undefined 时生效。
 *    (4) 重命名 + 默认值：const { 属性名: 新名 = 默认值 } = 源对象。
 *    (5) 可以只取需要的字段，其余字段自然"被忽略"。
 *    (6) 解构可以声明新变量（const/let），也可以给已有变量赋值（需要整体加括号）。
 *    (7) 支持计算属性名：const { [key]: value } = obj。
 *    (8) 支持剩余属性：const { a, ...rest } = obj（见 06 号文件）。
 *
 * 4. 常见陷阱
 *    (1) 给"已声明的变量"解构时必须加圆括号：({ a } = obj)，否则 { 会被当成代码块。
 *    (2) 解构 null / undefined 会抛 TypeError，因为要在它上面取属性。
 *    (3) 默认值只在 undefined 时生效：值为 null、0、'' 时默认值不生效。
 *    (4) 解构是"浅"的：只取一层，深层的对象仍是引用。
 *    (5) 解构不会触发"属性不存在"的错误，只是拿到 undefined（与访问不存在的属性一致）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 10_destructuring/01_object_destructuring.js
 *
 * 【预期输出】
 *   分 6 个小节，演示对象解构的几种形态与实际用法。
 * ============================================================================
 */

console.log('--- 1. 基本用法：按属性名取值 ---');

const user = { name: '张三', age: 20, city: '杭州' };

// 传统写法：每个字段都要写一遍对象名
const oldName = user.name;
const oldAge = user.age;
console.log('传统写法 =', oldName, oldAge);

// 解构写法：一次取出多个，变量名必须与属性名一致
const { name, age } = user;
console.log('解构写法 =', name, age);

// 只取需要的一部分，其余字段被忽略（不会报错）
const { city } = user;
console.log('只取 city =', city);

// 解构不改变原对象
console.log('原对象仍然是 =', JSON.stringify(user));

// 可以同时声明多个 const / let；也可以在一条语句里混用解构和普通声明
const { name: n2 } = user; // 重命名（下一节详解）
let { age: a2 } = user;
a2 = a2 + 1;
console.log('混用 let 解构并修改 =', n2, a2);

console.log('\n--- 2. 重命名：属性名与变量名不同 ---');

const apiUser = { id: 101, user_name: '李四', user_email: 'li@example.com' };

// 语法：{ 属性名: 新变量名 }
// 冒号左边是"要取的键"，右边是"新变量名"。读作"把 user_name 取出来命名为 userName"。
const { user_name: userName, user_email: userEmail } = apiUser;
console.log('重命名后 userName =', userName);
console.log('重命名后 userEmail =', userEmail);
// 原来的名字没有被创建
console.log('user_name 变量存在吗 =', typeof user_name === 'undefined' ? '不存在（会 ReferenceError，所以用 typeof 探测）' : '存在');

// 重命名 + 默认值：一起写
const { user_phone: userPhone = '未提供' } = apiUser;
console.log('重命名 + 默认值 =', userPhone);

// 重命名常用于：接口字段是下划线风格，本地想用驼峰
const snake = { first_name: '王', last_name: '五' };
const { first_name: firstName, last_name: lastName } = snake;
console.log('转驼峰后 =', firstName + lastName);

// 计算属性名 + 重命名
const key = 'id';
const { [key]: userId } = apiUser;
console.log('计算属性名重命名 =', userId);

console.log('\n--- 3. 默认值：只在 undefined 时生效 ---');

const settings = {
  theme: 'dark',
  fontSize: undefined, // 显式写了 undefined
  timeout: null, // 显式写了 null
  retries: 0, // 显式写了 0
};

// 默认值语法：{ 属性名 = 默认值 }
const { theme = 'light', fontSize = 14, timeout = 5000, retries = 3, missing = '兜底' } = settings;

console.log("theme   实际值 'dark'，默认 'light' -> ", theme, '（有值，用实际值）');
console.log('fontSize 实际值是 undefined，默认 14 -> ', fontSize, '（触发默认值）');
console.log('timeout  实际值是 null，默认 5000 -> ', timeout, '（null 不触发默认值！）');
console.log('retries  实际值是 0，默认 3 -> ', retries, '（0 不触发默认值！）');
console.log("missing  属性不存在，默认 '兜底' -> ", missing, '（undefined 触发默认值）');

// 结论：默认值只在"取到 undefined"时生效。
// 想连 null 一起兜底，要额外处理：
const { timeout: safeTimeout } = settings;
const finalTimeout = safeTimeout ?? 5000; // 用 ?? 兜住 null 和 undefined
console.log('用 ?? 兜住 null =', finalTimeout);

// 默认值是表达式时，只在需要时才求值（详见 04 号文件）
console.log('\n--- 4. 对已有变量赋值：必须加圆括号 ---');

let x = 1;
let y = 2;
const point = { x: 100, y: 200 };

// 错误写法（会被当成代码块，SyntaxError），所以注释掉：
// { x, y } = point;

// 正确写法：整体用圆括号包起来，告诉引擎"这是表达式而不是语句块"
({ x, y } = point);
console.log('对已有变量解构后 x =', x, '，y =', y);

// 如果不加圆括号又想达到目的，只能写 const { x: x1 } = point 声明新变量。
// 实际项目中更常见的形式：在函数里对参数/已有变量解构，或用 let 重新声明。

// 也可以只给一部分变量赋值，其它用默认值占位
let onlyX;
({ x: onlyX } = point);
console.log('只取 x 赋给已有变量 =', onlyX);

console.log('\n--- 5. 函数参数解构：options 对象模式 ---');

// 传统写法：函数接收一个配置对象，函数体内逐个取
function createUserOld(options) {
  const o = options || {};
  const name = o.name === undefined ? '匿名' : o.name;
  const age = o.age === undefined ? 0 : o.age;
  const role = o.role === undefined ? 'user' : o.role;
  return { name, age, role };
}
console.log('传统写法 =', JSON.stringify(createUserOld({ name: '张三' })));

// 解构写法：直接在形参位置解构，配合默认值，函数体极其干净
function createUser({ name = '匿名', age = 0, role = 'user' } = {}) {
  // 注意末尾的 = {} —— 这是"整个参数对象的默认值"，
  // 用于支持 createUser() 这种不传参的调用。
  return { name, age, role };
}

console.log('解构写法（只传 name） =', JSON.stringify(createUser({ name: '李四' })));
console.log('解构写法（不传参）     =', JSON.stringify(createUser()));
console.log('解构写法（全传）       =', JSON.stringify(createUser({ name: '王五', age: 30, role: 'admin' })));

// 如果没有那个 = {}，不传参会抛错，这里演示一下：
function createUserStrict({ name = '匿名' }) {
  return { name };
}
try {
  createUserStrict();
} catch (err) {
  console.log('少了 = {} 时不传参报错：', err.name, '-', err.message.slice(0, 40), '...');
}
console.log('传了参数就正常：', JSON.stringify(createUserStrict({ name: '赵六' })));

// 参数解构 + 重命名：把下划线的接口字段直接转成驼峰
function renderCard({ title: cardTitle, subtitle: cardSubtitle = '暂无副标题' }) {
  return `[${cardTitle}] ${cardSubtitle}`;
}
console.log('参数解构 + 重命名 =', renderCard({ title: '公告' }));
console.log('参数解构 + 重命名 =', renderCard({ title: '公告', subtitle: '今天放假' }));

console.log('\n--- 6. 边界与陷阱 ---');

// (1) 解构 null / undefined 会抛错
const { anything } = { anything: 1 };
console.log('正常解构 =', anything);
for (const bad of [null, undefined]) {
  try {
    // 用变量间接解构，避免语法层面的优化干扰
    const src = bad;
    const { a } = src;
    console.log(a);
  } catch (err) {
    console.log(`解构 ${String(bad)} 报错：`, err.name, '-', err.message.slice(0, 50), '...');
  }
}

// (1b) 嵌套解构的默认值只对 undefined 生效，对 null 无效——这是个高频误区。
const nullSource = { inner: null };
try {
  const { inner: { deep } = {} } = nullSource; // inner 是 null，默认值 {} 不生效 -> 抛错
  console.log(deep);
} catch (err) {
  console.log('内层为 null 时报错：', err.name, '-', err.message.slice(0, 45), '...');
}
// 内层为 undefined 时，默认值才会救场：
const undefinedSource = { inner: undefined };
const { inner: { deep: rescued } = {} } = undefinedSource;
console.log('内层为 undefined 时默认值生效 =', rescued);
// 想同时兜住 null，需要显式写成 ?? {}：
const { inner: rawInner } = nullSource;
const { deep: safeDeep } = rawInner ?? {};
console.log('用 ?? {} 兜住 null =', safeDeep);

// (2) 解构是浅拷贝：嵌套对象仍是同一个引用
const nestedSource = { profile: { nickname: '小明' } };
const { profile } = nestedSource;
profile.nickname = '改了';
console.log('解构出来的嵌套对象是同一个引用 =', nestedSource.profile.nickname);

// (3) 解构函数时要注意 this 绑定：解构出来的方法会丢失 this
const counter = {
  value: 42,
  read() {
    return this.value;
  },
};
const { read } = counter;
try {
  console.log(read());
} catch (err) {
  console.log('解构出的方法丢失 this：', err.name, '-', err.message.slice(0, 40), '...');
}
console.log('正确做法一：不解构，用 counter.read() =', counter.read());
console.log('正确做法二：绑定 this，read.call(counter) =', read.call(counter));

// (4) 解构原生的字符串包装对象也可以（字符串会被装箱）
const { length } = 'hello';
console.log("解构字符串得到 length =", length);

console.log('\n全部演示完毕。');
