/**
 * ============================================================================
 * 知识点：函数参数解构 —— options 对象模式、与默认值和剩余参数的组合
 * ============================================================================
 *
 * 【所属分类】10_destructuring —— 解构赋值
 * 【难度等级】进阶
 * 【前置知识】10_destructuring/01_object_destructuring.js、10_destructuring/04_default_values.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    解构可以直接写在函数的形参位置，让"从传入的对象里取字段"这一步在函数开始前完成：
 *      function draw({ x, y, color = 'black' }) { ... }
 *    对象参数解构、数组参数解构、以及它们的混合嵌套都支持。
 *
 * 2. 为什么需要
 *    (1) 消除"位置参数"的可读性问题：createUser(true, false, 20) 完全不知道参数含义，
 *        改成 createUser({ isAdmin: true, isActive: false, age: 20 }) 一目了然。
 *    (2) 参数可以省略、可以乱序、可以只传关心的字段。
 *    (3) 默认值直接写在形参里，函数体只剩下真正的业务逻辑，"防御式代码"大幅减少。
 *    (4) 参数自带文档性：签名本身就是一份接口说明。
 *
 * 3. 核心语法要点
 *    (1) 对象参数解构：function f({ a, b }) {}；调用时必须传对象 f({ a: 1 })。
 *    (2) 支持重命名：function f({ a: localA }) {}。
 *    (3) 支持默认值：function f({ a = 1 }) {}。
 *    (4) 【关键】整参数的默认值：function f({ a } = {}) {}
 *        末尾的 = {} 让"完全不传参"也能工作。没有它，f() 会抛 TypeError。
 *    (5) 参数解构 + 剩余参数：function f({ a, ...rest }, ...args) {}
 *        - { a, ...rest } 是"对象参数的剩余属性"（rest 是对象）
 *        - ...args 是"剩余的位置参数"（args 是数组）
 *        两者可以同时出现，注意别混淆。
 *    (6) 数组参数解构：function f([x, y]) {}；配合默认值 function f([x = 0, y = 0] = []) {}。
 *    (7) 箭头函数同样支持：const f = ({ a }) => a; 注意箭头函数参数解构要加括号。
 *    (8) 解构出的参数和普通参数可以混用：function f(id, { name } = {}) {}。
 *
 * 4. 常见陷阱
 *    (1) 忘了 = {}：调用方不传参时直接 TypeError。
 *    (2) 以为传 null 也能被 = {} 兜住 —— 不能，null 不会触发默认值，要用 ?? 处理。
 *    (3) 解构参数会丢失 this：把方法当回调传出去时要注意（见 01 号文件的陷阱）。
 *    (4) 参数解构 + arguments 对象的关系：箭头函数没有 arguments；普通函数有，
 *        但解构后 arguments 仍是原始的参数列表，不受解构影响。
 *    (5) 嵌套参数解构写太深，签名会变得难以阅读。
 *    (6) 传了"位置参数"给"解构参数"的函数，或反过来，都会得到奇怪的结果——不是报错。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 10_destructuring/05_function_parameters.js
 *
 * 【预期输出】
 *   分 6 个小节，演示参数解构的各种组合与常见误用。
 * ============================================================================
 */

console.log('--- 1. 为什么要用：位置参数 vs 对象参数 ---');

// 位置参数版本：调用时完全看不出每个参数是什么
function createUserV1(isAdmin, isActive, age, city) {
  return { isAdmin, isActive, age, city };
}
console.log('位置参数调用 createUserV1(true, false, 20, "杭州")');
console.log('   ->', JSON.stringify(createUserV1(true, false, 20, '杭州')));
console.log('   问题：想只指定 city，必须先把前面的都补上，且顺序不能错');

// 对象参数版本：自解释、可乱序、可只传部分
function createUserV2({ isAdmin = false, isActive = true, age = 0, city = '未知' } = {}) {
  return { isAdmin, isActive, age, city };
}
console.log('\n对象参数调用 createUserV2({ city: "杭州" })');
console.log('   ->', JSON.stringify(createUserV2({ city: '杭州' })));
console.log('   -> 完全不传参：', JSON.stringify(createUserV2()));

console.log('\n--- 2. 对象参数解构的基本形态 ---');

// 最简单的形式
function greet({ name, greeting }) {
  return `${greeting}，${name}！`;
}
console.log('greet({ name: "张三", greeting: "你好" }) =', greet({ name: '张三', greeting: '你好' }));
// 顺序可以调换
console.log('乱序传参也一样 =', greet({ greeting: '早上好', name: '李四' }));

// 重命名：接口字段是下划线风格
function renderUserCard({ user_name: name, user_age: age = 0 }) {
  return `${name}（${age} 岁）`;
}
console.log('重命名参数 =', renderUserCard({ user_name: '王五', user_age: 30 }));

// 嵌套解构写在参数里
function renderOrder({
  orderNo,
  customer: { name: customerName, vip = false },
  items: [firstItem = {}],
}) {
  return `${orderNo} | 客户 ${customerName}${vip ? '（VIP）' : ''} | 首件 ${firstItem.sku ?? '无'}`;
}
console.log(
  '嵌套参数解构 =',
  renderOrder({
    orderNo: 'A-001',
    customer: { name: '赵六', vip: true },
    items: [{ sku: 'SKU-9' }],
  }),
);

// 数组参数解构
function distance([x1, y1], [x2, y2]) {
  return Math.hypot(x2 - x1, y2 - y1).toFixed(4);
}
console.log('数组参数解构 distance([0,0], [3,4]) =', distance([0, 0], [3, 4]));

console.log('\n--- 3. 那个关键的 = {}：整参数的默认值 ---');

// 没有 = {} 的版本
function withoutFallback({ a = 1, b = 2 }) {
  return a + b;
}
console.log('传了对象 =', withoutFallback({ a: 10 }));
try {
  withoutFallback(); // 不传参 -> 解构 undefined -> TypeError
} catch (err) {
  console.log('不传参时报错：', err.name, '-', err.message.slice(0, 55), '...');
}

// 有 = {} 的版本
function withFallback({ a = 1, b = 2 } = {}) {
  return a + b;
}
console.log('有 = {} 时不传参 =', withFallback(), '（用默认值 1 + 2）');
console.log('有 = {} 时传部分 =', withFallback({ a: 10 }));

// 注意：= {} 的求值顺序是"先看整个参数是不是 undefined，再解构"
// 所以它能救 undefined，但救不了 null
function withFallbackStrict({ a = 1 } = {}) {
  return a;
}
console.log('传 undefined =', withFallbackStrict(undefined), '（= {} 生效）');
try {
  console.log('传 null =', withFallbackStrict(null), '（null 不触发 = {}）');
} catch (err) {
  console.log('传 null 时报错：', err.name, '-', err.message.slice(0, 45), '...');
}
// 想同时容忍 null 的写法：
function tolerant(options = {}) {
  const { a = 1 } = options ?? {};
  return a;
}
try {
  console.log('用 options ?? {} 容忍 null =', tolerant(null));
} catch (err) {
  console.log('仍然报错：', err.name);
}

console.log('\n--- 4. 参数解构 + 剩余参数：两个 rest 的区别 ---');

// 位置参数混用：第一个参数是必填的 id，第二个是选项对象
function updateUser(id, { name = '未改名', email = '未提供' } = {}) {
  return { id, name, email };
}
console.log('混合参数 updateUser(101, { name: "张三" }) =', JSON.stringify(updateUser(101, { name: '张三' })));
console.log('混合参数 updateUser(101) =', JSON.stringify(updateUser(101)));

// 两个 rest 同时出现：注意它们类型不同
function collect({ first, ...restOfObject }, ...restOfArgs) {
  return {
    第一个属性: first,
    对象剩余属性: restOfObject,
    剩余位置参数: restOfArgs,
    位置参数个数: restOfArgs.length,
  };
}
const collected = collect({ first: 'A', second: 'B', third: 'C' }, 'x', 'y', 'z');
console.log('\n双 rest 收集 =', JSON.stringify(collected));
console.log('   注意：{ ...rest } 得到的是对象，...args 得到的是数组，别混淆');

// 常见模式：把"已知字段"和"透传字段"分开
function createButton({ label, onClick, ...htmlAttributes }) {
  // htmlAttributes 可以整体透传给底层组件
  return { label, hasHandler: typeof onClick === 'function', 透传属性: htmlAttributes };
}
console.log('\n透传模式 =', JSON.stringify(createButton({ label: '提交', onClick: () => {}, type: 'submit', disabled: false })));

console.log('\n--- 5. 箭头函数与各种组合 ---');

// 箭头函数的参数解构：整个参数列表需要用圆括号包起来（本来就是必须的）
const getUserName = ({ name }) => name;
console.log('箭头函数解构 =', getUserName({ name: '张三' }));

// 解构 + 默认值 + rest 一起用
const summarize = ({ title = '无标题', tags = [], ...extra } = {}) => ({
  title,
  tagCount: tags.length,
  extraKeys: Object.keys(extra),
});
console.log('组合用法（不传参） =', JSON.stringify(summarize()));
console.log('组合用法（全传）   =', JSON.stringify(summarize({ title: '文章', tags: ['js'], author: '张三', date: '2024' })));

// 高阶函数：返回一个"配置好了的"函数
const makeMultiplier = ({ factor = 1, offset = 0 } = {}) => (n) => n * factor + offset;
const double = makeMultiplier({ factor: 2 });
const plusTen = makeMultiplier({ factor: 1, offset: 10 });
console.log('\n闭包 + 参数解构：double(5) =', double(5), '，plusTen(5) =', plusTen(5));

// 回调函数里的参数解构（数组方法最常见）
const users = [
  { name: '张三', age: 20 },
  { name: '李四', age: 30 },
];
console.log('map + 参数解构 =', JSON.stringify(users.map(({ name }) => name)));
console.log(
  'filter + 参数解构 =',
  JSON.stringify(users.filter(({ age }) => age >= 30).map(({ name }) => name)),
);
console.log(
  'reduce + 参数解构 =',
  users.reduce((sum, { age }) => sum + age, 0),
);
// 数组方法的第二个参数是 index，用空位跳过
console.log(
  '带 index 的 map（用空位跳过 item 的其它字段） =',
  JSON.stringify(users.map(({ name }, index) => `${index}:${name}`)),
);
// entries 解构
for (const [index, { name }] of users.entries()) {
  console.log(`   entries 解构 -> 第 ${index} 项：${name}`);
}
// Object.entries 解构
const scores = { 数学: 90, 语文: 85 };
for (const [subject, score] of Object.entries(scores)) {
  console.log(`   Object.entries 解构 -> ${subject}: ${score}`);
}

console.log('\n--- 6. 陷阱与边界 ---');

// (1) 传位置参数给解构函数：不会报错，但会得到奇怪结果
function expectsObject({ a = '默认' } = {}) {
  return a;
}
try {
  console.log('传数字 5 =', expectsObject(5), '（数字被装箱，没有 a 属性，所以用默认值）');
} catch (err) {
  console.log('传数字报错：', err.name);
}
console.log("传字符串 'abc' =", expectsObject('abc'), '（同理）');
try {
  console.log('传数组 [1,2] =', expectsObject([1, 2]));
} catch (err) {
  console.log('传数组报错：', err.name);
}

// (2) 解构参数会丢掉 this —— 把方法直接当回调传出去时要注意
const counter = {
  value: 10,
  add({ amount = 1 } = {}) {
    return this.value + amount; // 依赖 this
  },
};
console.log('\n直接调用 counter.add() =', counter.add());
const { add } = counter;
try {
  add();
} catch (err) {
  console.log('解构出来后调用报错：', err.name, '-', err.message.slice(0, 40), '...');
}
console.log('绑定后可用 =', add.call(counter));

// (3) 参数解构不影响 arguments（普通函数有 arguments，箭头函数没有）
function checkArguments({ a } = {}) {
  // arguments 里存的仍是"原始传入的参数"，与解构无关
  return { a, argumentsLength: arguments.length, firstArg: arguments[0] };
}
console.log('\narguments 不受解构影响 =', JSON.stringify(checkArguments({ a: 1 })));
console.log('不传参时 arguments.length =', checkArguments().argumentsLength);

// (4) 参数默认值也会形成"独立的函数作用域"，且在函数体作用域之外
//     所以函数体里不能再声明同名变量。
const scopeDemo = ({ a = 1 } = {}) => {
  // const a = 2; // 这一行会报 SyntaxError: Identifier 'a' has already been declared
  return a;
};
console.log('\n参数默认值形成独立作用域 =', scopeDemo());

// (5) 冻结的配置对象传给解构函数完全没问题（解构只读不写）
const frozenConfig = Object.freeze({ theme: 'dark' });
console.log('传冻结对象 =', (({ theme = 'light' } = {}) => theme)(frozenConfig));

// (6) 传对象时要注意"引用"：参数解构不会拷贝嵌套对象
const original = { nested: { v: 1 } };
function mutate({ nested }) {
  nested.v = 999; // 改的是原对象里的那个嵌套对象
}
mutate(original);
console.log('\n参数解构不拷贝嵌套对象 =', original.nested.v);

console.log('\n全部演示完毕。');
