/**
 * ============================================================================
 * 知识点：展开运算符 ... 与剩余参数 ... —— 同一个语法的两面
 * ============================================================================
 *
 * 【所属分类】04_operators —— 运算符与表达式
 * 【难度等级】进阶
 * 【前置知识】04_operators/02_assignment.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    三个点 `...` 在 JS 里承担两种相反的角色，写法相同、位置不同、含义相反：
 *      【展开（Spread）】把"可迭代对象 / 对象"摊开成一个个元素，
 *        出现在**值的位置**：函数实参、数组字面量、对象字面量。
 *          fn(...arr)      /  [...arr]      /  {...obj}
 *      【剩余（Rest）】把"零散的东西"收集成一个数组或对象，
 *        出现在**绑定的位置**：函数形参、解构模式。
 *          function f(...args) {}  /  const [a, ...rest] = arr
 *
 * 2. 为什么需要
 *    - 展开让"复制、合并、追加"变得极简，且都是**浅拷贝**，不再需要 concat / Object.assign。
 *    - 剩余参数让函数能接收不定数量的实参，并且拿到的是**真正的数组**
 *      （不像老的 arguments 只是类数组，不能直接调 map/filter）。
 *    - 两者配合可以实现"提取一部分 + 保留其余"这种非常常见的模式。
 *
 * 3. 核心语法要点
 *    【展开】
 *      - 数组展开作用于任何"可迭代对象"：数组、字符串、Set、Map、TypedArray、
 *        以及自定义了 [Symbol.iterator] 的对象。普通对象不可迭代，所以 [...{a:1}] 会抛错。
 *      - 对象展开只复制**自有可枚举属性**（含 Symbol 键），并遵循"后者覆盖前者"，
 *        所以 {...defaults, ...options} 是经典的重载式配置合并。
 *      - 展开是浅拷贝：嵌套对象仍然共享同一个引用。
 *      - 字符串展开会按"码点"拆分（能正确处理 emoji 等代理对），比 split('') 更安全。
 *    【剩余】
 *      - 函数参数中 ...rest 必须是**最后一个形参**，否则是语法错误。
 *      - 解构中 ...rest 也必须在最后，且会把"剩余所有元素/属性"收集成数组/对象。
 *      - 剩余参数与"arguments 对象"的区别：arguments 是类数组且含所有实参；
 *        rest 是真数组，且不含已具名接收的参数。
 *
 * 4. 常见陷阱
 *    - 展开 null / undefined：对象展开 {...null} 得到 {}（安全）；但数组展开
 *      [...null] 会抛 TypeError，因为 null 不可迭代。
 *    - 展开不会深拷贝：const b = [...a] 之后修改 b[0].x 仍会影响 a[0].x。
 *    - 展开大数组或作为实参传入时要注意"参数个数上限"（引擎限制，约 6 万多个元素），
 *      超大数组应改用循环或 push。
 *    - 在对象解构里 {a, ...rest} 时，rest 是"新对象"，不含原型链上的属性。
 *    - 别把剩余参数写成中间形参：function f(...a, b) {} 是语法错误。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 04_operators/09_spread_rest.js
 *
 * 【预期输出】
 *   依次打印数组展开、函数实参展开、对象展开与覆盖规则、字符串与 Set 展开、
 *   以及剩余参数、解构剩余、深浅拷贝对比的演示结果。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 数组展开：复制、合并、追加
// ---------------------------------------------------------------------------

console.log('--- 1. 数组展开 ---');

const base = [1, 2, 3];

// 复制数组（浅拷贝）：[...arr] 是 ES6 之后最常用的复制写法
const copy = [...base];
console.log('[...base] =', copy, '，是同一个数组吗？', copy === base); // false

// 合并多个数组
const merged = [...base, ...[4, 5], ...[6]];
console.log('合并后 =', merged); // [1,2,3,4,5,6]

// 在任意位置插入元素
const withHead = [0, ...base];
const withTail = [...base, 4];
const withMiddle = [base[0], 99, ...base.slice(1)];
console.log('头部插入 =', withHead); // [0,1,2,3]
console.log('尾部插入 =', withTail); // [1,2,3,4]
console.log('中间插入 =', withMiddle); // [1,99,2,3]

// 等价的老写法：concat —— 对比后可见展开更直观
console.log('concat 老写法 =', base.concat([4, 5])); // [1,2,3,4,5]

// 展开能让 Math 这类"只接受多个实参"的函数直接吃数组
const numbers = [5, 3, 9, 1, 7];
console.log('Math.max(...numbers) =', Math.max(...numbers)); // 9
console.log('Math.min(...numbers) =', Math.min(...numbers)); // 1

// 把类数组（如 arguments、NodeList）转成真数组
function toArray() {
  return [...arguments]; // arguments 是可迭代的类数组，可以直接展开
}
console.log('把 arguments 转成数组 =', toArray('a', 'b', 'c')); // ['a','b','c']

// 字符串也可以展开，且按码点拆分
const str = 'abc';
console.log('[...str] =', [...str]); // ['a','b','c']

// ---------------------------------------------------------------------------
// 2. 函数实参位置的展开
// ---------------------------------------------------------------------------

console.log('\n--- 2. 函数实参展开 ---');

function introduce(greeting, name, punct) {
  return `${greeting}，${name}${punct}`;
}

// 用展开把数组"喂"给固定参数的函数
const args = ['你好', '小明', '！'];
console.log('introduce(...args) =', introduce(...args)); // 你好，小明！

// 展开可以与其他实参混用
console.log('introduce("早上好", ...["小红", "～"]) =', introduce('早上好', ...['小红', '～']));

// 经典用法：数组拼接后一次性传参
function sumAll(...nums) {
  return nums.reduce((acc, cur) => acc + cur, 0);
}
const partA = [1, 2];
const partB = [3, 4];
console.log('sumAll(...partA, ...partB) =', sumAll(...partA, ...partB)); // 10

// ---------------------------------------------------------------------------
// 3. 对象展开：复制与合并
// ---------------------------------------------------------------------------

console.log('\n--- 3. 对象展开 ---');

const defaults = { host: 'localhost', port: 8080, secure: true };
const overrides = { port: 3000 };

// 后者覆盖前者：这是"配置合并"的标准写法，从左到右优先级递增
const mergedConfig = { ...defaults, ...overrides };
console.log('{ ...defaults, ...overrides } =', mergedConfig); // port 被覆盖成 3000

// 只覆盖部分字段并追加新字段
const extended = { ...defaults, port: 443, extra: 'x' };
console.log('追加与覆盖混合 =', extended);

// 显式属性可以放在展开的后面（覆盖展开值），也可以放在前面（被展开值覆盖）
console.log('属性在展开之后 =', { ...defaults, port: 9000 }.port); // 9000
console.log('属性在展开之前 =', { port: 9000, ...defaults }.port); // 8080（被 defaults 覆盖）

// 复制对象（浅拷贝）
const original = { a: 1, b: 2 };
const cloned = { ...original };
console.log('克隆对象 =', cloned, '，是同一个引用吗？', cloned === original); // false

// 展开 null / undefined 是安全的（得到空对象）
console.log('{ ...null } =', { ...null }); // {}
console.log('{ ...undefined } =', { ...undefined }); // {}
// 这让"可选的配置对象"可以放心展开
const maybeOptions = null;
console.log('{ ...defaults, ...maybeOptions } =', { ...defaults, ...maybeOptions });

// 但与数组展开不同： {...null} 安全，[...null] 会抛错
try {
  [...null];
} catch (err) {
  console.log('[...null] 抛出：', err.constructor.name, '-', err.message);
}

// 实战：从对象中排除某些键（配合解构剩余）
const user = { id: 1, name: '小明', password: 'secret', token: 'abc' };
const { password, token, ...safeUser } = user;
console.log('剔除敏感字段后 =', safeUser); // { id: 1, name: '小明' }

// 实战：对象数组的"更新某一项"
const todos = [
  { id: 1, text: '写代码', done: false },
  { id: 2, text: '写测试', done: false },
];
const updatedTodos = todos.map((t) => (t.id === 2 ? { ...t, done: true } : t));
console.log('更新 id=2 后 =', updatedTodos);

// ---------------------------------------------------------------------------
// 4. 其它可迭代对象的展开
// ---------------------------------------------------------------------------

console.log('\n--- 4. 其它可迭代对象 ---');

// Set 展开成数组：天然去重
const set = new Set([1, 2, 2, 3, 3, 3]);
console.log('new Set([1,2,2,3,3,3]) 展开 =', [...set]); // [1,2,3]

// 一行代码完成"数组去重"
const dup = [1, 1, 2, 3, 3];
console.log('一行去重 =', [...new Set(dup)]); // [1,2,3]

// Map 展开成 [key, value] 数组的数组
const map = new Map([
  ['a', 1],
  ['b', 2],
]);
console.log('[...map] =', [...map]); // [['a',1], ['b',2]]
console.log('[...map.keys()] =', [...map.keys()]); // ['a','b']
console.log('[...map.values()] =', [...map.values()]); // [1,2]

// 生成器函数返回的迭代器也能展开
function* countTo(n) {
  for (let i = 1; i <= n; i++) yield i;
}
console.log('[...countTo(5)] =', [...countTo(5)]); // [1,2,3,4,5]

// 字符串按码点拆分，比 split('') 更安全
const emoji = '👨‍👩‍👧';
console.log("'👨‍👩‍👧'.split('') 长度 =", emoji.split('').length, '（被拆坏了）');
console.log("[...'👨‍👩‍👧'].length =", [...emoji].length, '（按码点拆分，更合理）');

// ---------------------------------------------------------------------------
// 5. 剩余参数：把实参收集成数组
// ---------------------------------------------------------------------------

console.log('\n--- 5. 剩余参数 ---');

// rest 必须放在形参列表最后，它会收集"剩下的所有实参"
function logWithPrefix(prefix, ...messages) {
  console.log(`  [${prefix}]`, messages.join(' | '));
  console.log('    messages 是数组吗？', Array.isArray(messages), '，长度 =', messages.length);
}
logWithPrefix('INFO'); // 没有剩余实参 => 空数组
logWithPrefix('WARN', '磁盘空间不足');
logWithPrefix('ERROR', '连接失败', '重试中', '已放弃');

// 与 arguments 的对比：rest 是"真数组"，可以直接用数组方法
function oldStyle() {
  // arguments 是类数组：没有 map/filter，必须先转换
  console.log('  arguments 是数组吗？', Array.isArray(arguments)); // false
  console.log('  arguments 能用 map 吗？', typeof arguments.map); // 'undefined'
  return Array.prototype.slice.call(arguments).join('-');
}
function newStyle(...args) {
  console.log('  rest 是数组吗？', Array.isArray(args)); // true
  return args.map((v) => v * 2).join('-'); // 直接使用数组方法
}
console.log('  老写法结果 =', oldStyle(1, 2, 3));
console.log('  新写法结果 =', newStyle(1, 2, 3));

// rest 与普通形参混用：普通形参按位置取，剩下的归 rest
function pickFirstTag(tag, ...restTags) {
  return { primary: tag, others: restTags };
}
console.log('  pickFirstTag("a","b","c") =', pickFirstTag('a', 'b', 'c'));

// 实战：把不定参数透传给另一个函数（转发实参）
function throttleWrapper(fn) {
  return (...fnArgs) => {
    console.log('    >> 调用被包装的函数，参数：', fnArgs);
    return fn(...fnArgs);
  };
}
const wrappedAdd = throttleWrapper((x, y) => x + y);
console.log('  wrappedAdd(3, 4) =', wrappedAdd(3, 4)); // 7

// ---------------------------------------------------------------------------
// 6. 解构中的剩余：数组与对象
// ---------------------------------------------------------------------------

console.log('\n--- 6. 解构中的剩余 ---');

// 数组解构剩余
const [head, second, ...tail] = [1, 2, 3, 4, 5];
console.log('  [head, second, ...tail] =>', { head, second, tail }); // 1, 2, [3,4,5]

const [onlyFirst, ...leftovers] = ['x'];
console.log('  只有一个元素时：[onlyFirst, ...leftovers] =>', { onlyFirst, leftovers }); // 'x', []

// 对象解构剩余（前面已用过，这里再演示一次更复杂的场景）
const request = {
  method: 'GET',
  url: '/api/users',
  headers: { auth: 'token' },
  timeout: 5000,
};
const { method, url, ...restOptions } = request;
console.log('  提取 method/url 后剩余 =', restOptions);

// 实战：函数只关心部分字段，其余原样透传
function normalizeRequest({ url, method = 'GET', ...rest }) {
  return { url: url.trim(), method: method.toUpperCase(), meta: rest };
}
console.log('  normalizeRequest(...) =', normalizeRequest({ url: '  /a  ', post: true }));

// ---------------------------------------------------------------------------
// 7. 陷阱：展开是浅拷贝
// ---------------------------------------------------------------------------

console.log('\n--- 7. 陷阱：浅拷贝 ---');

const nested = { inner: { count: 0 }, label: 'origin' };
const shallow = { ...nested };

// 修改浅拷贝的顶层属性：互不影响
shallow.label = 'changed';
console.log('  改顶层属性：原对象 label =', nested.label, '，拷贝 label =', shallow.label);

// 修改浅拷贝的嵌套属性：两边一起变！因为它们指向同一个 inner 对象
shallow.inner.count = 99;
console.log('  改嵌套属性：原对象 inner.count =', nested.inner.count, '（被意外改动了）');

// 需要深拷贝时可以用 structuredClone（Node 17+ 内置）
const deep = structuredClone(nested);
deep.inner.count = 1;
console.log('  用 structuredClone 深拷贝后：原对象 inner.count =', nested.inner.count, '（不受影响）');

// 数组同理
const arrNested = [{ id: 1 }];
const arrShallow = [...arrNested];
arrShallow[0].id = 2;
console.log('  数组浅拷贝改元素属性：原数组 =', arrNested[0].id, '（同样被改动）');

console.log('\n全部演示结束。');
