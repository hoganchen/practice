/**
 * ============================================================================
 * 知识点：默认参数的进阶用法 —— 默认值引用前面的参数、必填参数校验技巧
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】高级
 * 【前置知识】06_functions/02_parameters.js、06_functions/13_function_properties.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    默认参数（ES6）的完整形态是"默认值可以是一个表达式"，而不是只能是字面量。
 *    这个表达式的求值环境有讲究：
 *      - 可以引用"排在它前面"的形参；
 *      - 不能引用"排在它后面"的形参（会抛 ReferenceError）；
 *      - 每次调用、且该参数缺省时，才求值一次；
 *      - 不能访问函数体内的变量（那时函数体还没开始执行）。
 *
 * 2. 为什么需要
 *    真实项目里的参数校验往往写得很啰嗦：每个函数开头都是一堆
 *    `if (x === undefined) throw new Error(...)`。利用"默认值表达式的求值时机"
 *    和"默认值只在 undefined 时触发"这两条规则，可以把必填校验、参数联动、
 *    解构默认值都写得非常紧凑，而且校验逻辑和参数列表放在一起，不易漏。
 *
 * 3. 核心语法要点
 *    (1) 默认值可引用前面的参数：
 *          function f(width, height = width) {}      // 正方形
 *    (2) 必填参数校验的三个常用技巧：
 *          ① function required(name) { throw new Error(name + ' 是必填参数'); }
 *             function f(a = required('a')) {}
 *          ② 用解构默认值：function f({ a, b = 1 } = {}) {}
 *          ③ 用对象参数 + 默认值：function f({ a = required('a') } = {}) {}
 *    (3) 默认值表达式里可以调用函数、可以计算，甚至可以写 IIFE。
 *    (4) 默认参数会占用"参数作用域"：形参列表实际上是一个独立的作用域，
 *        函数体内声明的变量不能在默认值里访问。
 *    (5) 默认参数不影响 arguments 的长度（arguments 仍记录实参个数）。
 *
 * 4. 常见陷阱
 *    - 用 `a = a || 默认值`：0、''、false 会被误替换（应改用默认参数语法）。
 *    - 传 null 不触发默认值（只有 undefined 才触发）。
 *    - 默认值引用后面的参数 → ReferenceError（TDZ）。
 *    - 在默认值里访问函数体内的变量 → ReferenceError。
 *    - 必填校验用 throw 时，错误要能被调用方 try/catch 到（本示例全部在内部捕获）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/14_default_parameters_tricks.js
 *
 * 【预期输出】
 *   演示默认值引用前参、参数联动、必填校验的三种写法、解构默认值、
 *   默认值的求值时机，以及各种会报错的边界情况（全部在文件内捕获）。
 * ============================================================================
 */

console.log('--- 1. 默认值可以引用"前面的"参数 ---');

// height 缺省时自动等于 width —— 这是最实用的"参数联动"。
function makeRect(width, height = width) {
  return { width, height, area: width * height };
}
console.log('  makeRect(5)    →', makeRect(5), '（正方形：height 自动取 width）');
console.log('  makeRect(5, 3) →', makeRect(5, 3), '（矩形：显式传了 height）');
console.log('  makeRect(5, undefined) →', makeRect(5, undefined), '（undefined 依然触发默认值）');

// 更复杂的联动：后面的默认值基于前面的好几个参数。
function makeUrl(path, host = 'api.example.com', full = `${host}${path}`) {
  return full;
}
console.log('  makeUrl("/users")                          →', makeUrl('/users'));
console.log('  makeUrl("/users", "test.local")             →', makeUrl('/users', 'test.local'));
console.log('  makeUrl("/users", "test.local", "HTTPS://x") →', makeUrl('/users', 'test.local', 'HTTPS://x'));

console.log('--- 2. 默认值求值时机：每次调用、缺省时才求值 ---');

let evalCount = 0;
function trackEvaluation(value = (evalCount++, `第 ${evalCount} 次生成`)) {
  return value;
}
console.log('  第 1 次调用（缺省）→', trackEvaluation(), '；求值次数 =', evalCount);
console.log('  第 2 次调用（缺省）→', trackEvaluation(), '；求值次数 =', evalCount);
console.log('  第 3 次调用（传值）→', trackEvaluation('我自己带的'), '；求值次数 =', evalCount, '（没增加）');
console.log('  结论：默认值表达式不是"定义时求值一次"，而是"每次缺省时求值一次"。');
console.log('  实用推论：可以把 new Date()、数组字面量、对象字面量放进默认值，每次都得到新对象。');

// 证明"每次都是新对象"：
function pushItem(item, list = []) {
  list.push(item);
  return list;
}
console.log('  pushItem("a") →', pushItem('a'), '（新数组）');
console.log('  pushItem("b") →', pushItem('b'), '（又是新数组，不会累积）');
console.log('  对比：如果默认值写成外部的同一个数组，就会累积 —— 这正是"默认值每次求值"的意义。');

console.log('--- 3. 必填参数校验技巧一：抛出错误的辅助函数 ---');

// 关键点：默认值表达式只在"参数缺省"时求值，
// 所以把 throw 写进默认值里，就实现了"缺省即报错"。
function required(name) {
  throw new Error(`缺少必填参数：${name}`);
}

function createUser(name = required('name'), age = required('age')) {
  return { name, age };
}

// 正常调用
console.log('  createUser("小明", 18) →', createUser('小明', 18));

// 缺参数：在内部捕获，绝不让异常抛到顶层。
try {
  createUser();
} catch (err) {
  console.log('  createUser() 报错 →', err.constructor.name, ':', err.message);
}

try {
  createUser('小明');
} catch (err) {
  console.log('  createUser("小明") 报错 →', err.constructor.name, ':', err.message);
}

// 这个技巧还能校验"可选参数的类型"，把校验写进默认值里。
function assertType(value, type, name) {
  if (typeof value !== type) {
    throw new TypeError(`${name} 必须是 ${type}，实际是 ${typeof value}`);
  }
  return value;
}
function setVolume(level = assertType(level, 'number', 'level')) {
  return `音量设为 ${level}`;
}
console.log(' ', setVolume(5));
// 传了参数，所以默认值表达式根本不会被求值，assertType 也就不会执行。
console.log(' ', setVolume('大声'), '  ← 非法类型也照样通过，因为默认值没被求值');
console.log('  结论：默认值校验只适合"必填/缺省"场景；类型校验必须写在函数体里。');

console.log('--- 4. 必填参数校验技巧二：对象参数 + 解构默认值 ---');

// 这是现代 JS 最推荐的"多参数"写法：调用方用对象传参，顺序无关、可读性好。
function createServer({ host = 'localhost', port = 8080, protocol = 'http' } = {}) {
  // 末尾的 `= {}` 让"完全不传参数"也能正常工作。
  return `${protocol}://${host}:${port}`;
}
console.log('  createServer()                        →', createServer());
console.log('  createServer({})                      →', createServer({}));
console.log('  createServer({ port: 3000 })          →', createServer({ port: 3000 }));
console.log('  createServer({ host: "0.0.0.0", port: 80, protocol: "https" }) →', createServer({ host: '0.0.0.0', port: 80, protocol: 'https' }));

// 对象参数里也能用"必填校验"：直接在解构默认值里调用 required。
function createServerStrict({ host = required('host'), port = 8080 } = {}) {
  return `${host}:${port}`;
}
console.log('  createServerStrict({ host: "db.local" }) →', createServerStrict({ host: 'db.local' }));
try {
  createServerStrict({});
} catch (err) {
  console.log('  createServerStrict({}) 报错 →', err.constructor.name, ':', err.message);
}
try {
  // 注意：连对象都不传时，因为最后有 `= {}`，默认值 {} 会生效，
  // 所以 host 依然是 undefined，required 依然会触发。
  createServerStrict();
} catch (err) {
  console.log('  createServerStrict() 报错 →', err.constructor.name, ':', err.message);
}

console.log('--- 5. 必填参数校验技巧三：不依赖默认值的运行时校验 ---');

// 更通用、可读性也更好的写法：必填校验写成函数体第一行。
// 优点：可以校验 null、空字符串、类型等；缺点：多写一行。
function assertRequired(value, name) {
  // 注意这里用的是"宽松"的判断：undefined 和 null 都视为缺失。
  if (value === undefined || value === null || value === '') {
    throw new Error(`缺少必填参数：${name}`);
  }
  return value;
}
function createOrder(orderId, amount) {
  assertRequired(orderId, 'orderId');
  assertRequired(amount, 'amount');
  return { orderId, amount };
}
console.log('  createOrder("A001", 99) →', createOrder('A001', 99));
for (const args of [[], ['A001'], ['A001', 0]]) {
  try {
    console.log(`  createOrder(${args.map((a) => JSON.stringify(a)).join(', ')}) →`, createOrder(...args));
  } catch (err) {
    console.log(`  createOrder(${args.map((a) => JSON.stringify(a)).join(', ')}) → 报错：${err.message}`);
  }
}
console.log('  注意 createOrder("A001", 0)：0 是合法金额，不会被误判 —— 这就是不用 `||` 做默认值的原因。');

console.log('--- 6. 各种"会报错"的边界情况（全部在文件内捕获）---');

// 边界一：默认值引用"后面的"参数 → ReferenceError（后面的形参还在 TDZ 中）。
try {
  // 下面的函数定义是合法的，报错发生在"调用时"（要等默认值被求值）。
  const bad = (a = b, b = 2) => [a, b];
  bad();
} catch (err) {
  console.log('  默认值引用后面的参数 → 报错', err.constructor.name, ':', err.message);
}

// 边界二：默认值里访问函数体内的变量 → ReferenceError（参数作用域在函数体之外）。
try {
  const bad2 = (a = innerVar) => {
    const innerVar = 1; // 这个名字在参数作用域里看不到
    return a + innerVar;
  };
  bad2();
} catch (err) {
  console.log('  默认值访问函数体内的变量 → 报错', err.constructor.name, ':', err.message);
}

// 边界三：默认值可以引用"外层作用域"的变量（这是允许且常用的）。
const outerHost = 'api.example.com';
function useOuterScope(host = outerHost) {
  return `host = ${host}`;
}
console.log('  默认值引用外层变量 →', useOuterScope());
console.log('  显式传参覆盖      →', useOuterScope('localhost'));

// 但要注意"形参名和外层变量同名"的情况：这时参数作用域里的同名绑定会遮蔽外层，
// 而它此刻正处于 TDZ，所以会直接抛 ReferenceError。
try {
  // eslint-disable-next-line no-shadow
  const shadowDemo = (outerHost = outerHost) => outerHost;
  shadowDemo();
} catch (err) {
  console.log('  形参名与外层变量同名 → 报错', err.constructor.name, ':', err.message);
  console.log('  原因：参数作用域里 outerHost 这个名字已被形参占用且尚未初始化，遮蔽了外层的同名常量。');
}

// 边界四：给剩余参数写默认值 → 语法错误（无法运行，只能放在注释里说明）。
// function bad3(...args = []) {}
console.log('  给剩余参数写默认值是 SyntaxError（代码里注释掉了，无法运行）。');

console.log('--- 7. 综合实战：一个"配置齐全"的函数签名 ---');

// 把本节所有技巧合起来：对象参数 + 解构默认值 + 联动默认值 + 必填校验。
function createLogger({
  level = 'info',
  prefix = `[${level.toUpperCase()}]`, // 引用前面的 level
  timestamp = false, // 是否附加时间戳
  target = required('target'), // 必填
  transform = (msg) => msg, // 默认值是函数
  // 数组类型参数：每次调用得到新数组
  sinks = [],
} = {}) {
  // 函数体里再做"内容校验"，与"必填校验"分工明确。
  if (!['debug', 'info', 'warn', 'error'].includes(level)) {
    throw new RangeError(`level 取值非法：${level}`);
  }
  sinks.push('console');
  return function log(message) {
    const text = transform(`${prefix} ${message}`);
    // 注意：timestamp 为 true 时会打印当前时间，输出因此不固定。
    // 为了示例输出稳定，这里不用真实时间，而是打印一个占位说明。
    const stamp = timestamp ? '[时间戳已省略] ' : '';
    // sinks 的默认值是 []，每次调用 createLogger 都会得到一个新的空数组，
    // 所以这里的 push 不会跨调用累积。
    return `${stamp}${text}（输出到：${sinks.join('/')}）`;
  };
}

// 用例一：最简调用（只给必填项）
const log1 = createLogger({ target: 'console' });
console.log('  ', log1('服务已启动'));

// 用例二：指定级别与转换函数
const log2 = createLogger({ target: 'file', level: 'error', timestamp: true, transform: (m) => m.toUpperCase() });
console.log('  ', log2('连接失败'));

// 用例三：缺必填项
try {
  createLogger({ level: 'info' });
} catch (err) {
  console.log('  缺 target 时报错 →', err.constructor.name, ':', err.message);
}

// 用例四：非法级别
try {
  createLogger({ target: 'console', level: 'verbose' });
} catch (err) {
  console.log('  非法 level 时报错 →', err.constructor.name, ':', err.message);
}

console.log('--- 8. 技巧速查表 ---');
const tricks = [
  ['默认值引用前面的参数', 'function f(w, h = w) {}', '参数联动，如正方形/默认主机名'],
  ['必填校验（默认值里 throw）', 'function f(a = required("a")) {}', '缺参立刻报错，校验与参数写在一起'],
  ['对象参数 + 解构默认值', 'function f({ a = 1 } = {}) {}', '多参数、顺序无关、可读性最好'],
  ['整体默认值兜底', 'function f({} = {}) {}', '允许调用方完全不传参数'],
  ['运行时校验', 'assertRequired(v, "v") 写在函数体首行', '可校验 null/空串/类型，最灵活'],
  ['避免 || 做默认值', 'a === undefined ? d : a', '防止 0、""、false 被误替换'],
];
for (const [name, syntax, usage] of tricks) {
  console.log(`  · ${name}`);
  console.log(`      写法：${syntax}`);
  console.log(`      场景：${usage}`);
}
