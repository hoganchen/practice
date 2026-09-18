/**
 * ============================================================================
 * 知识点：数组解构 —— 默认值、剩余元素、嵌套解构与交换变量
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】进阶
 * 【前置知识】08_arrays/16_keys_values_entries.js
 *
 * 【也见】10_destructuring/02_array_destructuring.js —— 数组解构在「解构赋值」章节里另有一篇同等深度的讲解。
 *        10_destructuring/ 是解构语法体系的主场（对象解构 → 数组解构）；本文件从数组章节切入，
 *        侧重"解构依赖迭代器协议"以及与 for...of / 函数参数的配合。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    解构赋值（destructuring）是一种"按位置把数组（或可迭代对象）里的值拆出来，
 *    分别赋给变量"的语法：
 *
 *        const [a, b] = [1, 2];      // a = 1, b = 2
 *
 *    它靠的是**迭代器协议**，所以任何可迭代对象都能解构：
 *    数组、字符串、Set、Map（得到 [key, value] 对）、生成器、arguments……
 *
 *    四种常用形态：
 *        基本      const [a, b] = arr;
 *        默认值    const [a = 10] = arr;
 *        剩余      const [first, ...rest] = arr;
 *        嵌套      const [a, [b, c]] = arr;
 *
 * 2. 为什么需要它
 *    没有解构时，"取出前两个元素"要写两行下标访问，还容易把顺序搞错；
 *    交换两个变量要借第三个临时变量；函数返回多个值只能返回对象或数组再手动取。
 *    解构让这些操作"一眼可读"，而且顺序错误会立刻体现在变量命名上。
 *    在现代 JS 里，解构出现在函数参数、for...of 循环、模块导入、React hooks 等各处。
 *
 * 3. 核心语法要点
 *    (1) 按**位置**匹配，不是按名字（对象解构才按名字）。
 *    (2) 默认值只在"取到的值严格等于 undefined"时生效。null、0、'' 都不会触发默认值：
 *          const [a = 1] = [null];   // a === null
 *          const [b = 1] = [];       // b === 1
 *    (3) 剩余元素 ...rest 必须是**最后一个**，它总是得到一个**真数组**
 *        （没有剩余时是空数组 []，不是 undefined）。
 *    (4) 可以用逗号"跳过"某些位置：
 *          const [, second] = [1, 2];   // second === 2
 *    (5) 嵌套解构可以无限深入，也可以只取深层的一部分。
 *    (6) 解构可以用于：
 *          - 变量声明（const/let/var）；
 *          - 赋值给已存在的变量（必须加括号，否则会被当成块语句）；
 *          - 函数参数（最常用）；
 *          - for...of 的循环变量；
 *          - 交换变量：( [a, b] = [b, a] )。
 *    (7) 剩余元素也能用在"取除了第一个之外的全部"这类场景，非常实用。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】解构本身**不修改原数组**（non-mutating），它只是读取。
 *      但要注意：`const [a, ...rest] = arr` 得到的 rest 是**新数组**（浅拷贝），
 *      rest[0] === arr[1]（元素是同一引用）；而 `a` 直接指向原元素。
 *    - 解构一个 **null 或 undefined** 会抛 TypeError（"is not iterable"）。
 *      需要容错就写默认值：`const [a] = arr ?? []`。
 *    - 默认值不能写在"有值但为 null"的情况下，见上文第 (2) 点。
 *    - 给已声明变量解构赋值**必须用括号包起来**：`({ a } = obj)` / `[a, b] = [b, a]`。
 *      直接写 `[a, b] = [b, a];` 在语句开头会被解析成数组字面量，报语法错误。
 *    - 剩余元素必须放最后：`[...rest, last]` 是语法错误。
 *    - 对非可迭代对象（普通对象、数字、布尔）解构会抛错：
 *        const [a] = { 0: 'x' };  // TypeError（普通对象没有 Symbol.iterator）
 *    - 函数返回数组时解构，若返回的是 undefined 会抛错，要加兜底。
 *    - 解构 Map 时 `for (const [k, v] of map)` 拿到的正是 [key, value]，
 *      但直接 `const [a] = map` 会得到第一个 [key, value] 对，容易看错。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/17_array_destructuring.js
 *
 * 【预期输出】
 *   依次演示基本解构、跳过元素、默认值、剩余元素、嵌套解构、交换变量、
 *   函数参数解构、for...of 解构，以及常见错误与实战场景。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本解构
// ---------------------------------------------------------------------------

console.log('--- 1. 基本解构 ---');

const rgb = [255, 128, 0];
const [red, green, blue] = rgb;

console.log('原数组 =', JSON.stringify(rgb));
console.log(`red=${red}, green=${green}, blue=${blue}`);
console.log('原数组未被修改 =', JSON.stringify(rgb));

// 多余的变量会是 undefined（不会报错）
const [a, b, c, d] = [1, 2, 3];
console.log('\n元素不够时：[a, b, c, d] = [1, 2, 3]');
console.log(`a=${a}, b=${b}, c=${c}, d=${d}（多出来的变量是 undefined）`);

// 少的变量则丢弃多余元素
const [onlyFirst] = [10, 20, 30];
console.log('只取第一个：[onlyFirst] = [10, 20, 30] ->', onlyFirst);

// 字符串也能解构（因为字符串是可迭代的）
const [ch1, ch2, ch3] = 'abc';
console.log("\n解构字符串 'abc' =", ch1, ch2, ch3);

// Set 也能解构
const [s1, s2] = new Set([7, 8, 9]);
console.log('解构 Set([7,8,9]) =', s1, s2, '（多余元素被忽略）');

// 什么不能解构
try {
  const [fromPlainObj] = { 0: 'x' }; // 普通对象没有迭代器
  console.log(fromPlainObj);
} catch (err) {
  console.log('\n对普通对象解构会抛错：', err.constructor.name, '-', err.message);
}
console.log('（对象要用对象解构 const { a } = obj，那是按属性名匹配）');

// ---------------------------------------------------------------------------
// 2. 跳过元素与"占位"
// ---------------------------------------------------------------------------

console.log('\n--- 2. 跳过元素 ---');

const coords = [10, 20, 30, 40, 50];

// 用逗号占位，跳过不想要的元素
const [, , third] = coords;
console.log('[, , third] = coords -> third =', third, '（下标 2）');

const [, second, , fourth] = coords;
console.log('[, second, , fourth] -> second =', second, ', fourth =', fourth);

// 只要第一个和最后一个（用剩余元素技巧）
const [head, ...allRest] = coords;
const lastOne = allRest.at(-1);
console.log('\n首尾取值：head =', head, ', last =', lastOne);

// ---------------------------------------------------------------------------
// 3. 默认值（重要）
// ---------------------------------------------------------------------------

console.log('--- 3. 默认值 ---');

// 默认值只在"取到的值是 undefined"时生效
// （这里放在函数参数里解构，每次调用都是独立作用域，最不容易出错）
function showDefault([val = 1] = []) {
  return val;
}
console.log('const [v = 1] = []          -> v =', showDefault([]));
console.log('const [v = 1] = [undefined] -> v =', showDefault([undefined]));
console.log('const [v = 1] = [null]      -> v =', JSON.stringify(showDefault([null])), '（null 不触发默认值！）');
console.log('const [v = 1] = [0]         -> v =', showDefault([0]), '（0 也不触发）');
console.log("const [v = 'x'] = ['']      -> v =", JSON.stringify(showDefault([''])), '（空字符串也不触发）');
console.log("const [v = 'x'] = [NaN]     -> v =", String(showDefault([NaN])), '（NaN 也不触发）');
console.log("const [v = 'x'] = [false]   -> v =", showDefault([false]), '（false 也不触发）');

// 实用场景：函数配置项
function createConfig(input) {
  const [width = 800, height = 600, theme = 'light'] = input ?? [];
  return { width, height, theme };
}
console.log('\ncreateConfig() =', JSON.stringify(createConfig()));
console.log('createConfig([1024]) =', JSON.stringify(createConfig([1024])));
console.log('createConfig([1024, 768, "dark"]) =', JSON.stringify(createConfig([1024, 768, 'dark'])));
console.log('createConfig([null, 0, ""]) =', JSON.stringify(createConfig([null, 0, ''])), '（null/0/"" 不触发默认值）');

// 默认值可以是表达式，前面已解构的变量也能用
const [base = 10, doubled = base * 2] = [];
console.log('\n默认值可以是表达式：[base = 10, doubled = base * 2] = [] ->', base, doubled);

// 坑：默认值表达式在"需要时"才求值（惰性），有副作用时要注意
let evalCount = 0;
const withSideEffect = (defaultVal) => {
  evalCount++;
  return defaultVal;
};
const [effectVal = withSideEffect('默认值')] = ['有值'];
console.log('第一项有值时的求值次数 =', evalCount, '，effectVal =', JSON.stringify(effectVal));

const [effectVal2 = withSideEffect('默认值')] = [];
console.log('第一项为 undefined 时的求值次数 =', evalCount, '，effectVal2 =', JSON.stringify(effectVal2));
console.log('（默认值表达式是惰性的：只有真的需要兜底时才求值）');

// ---------------------------------------------------------------------------
// 4. 剩余元素（rest）
// ---------------------------------------------------------------------------

console.log('\n--- 4. 剩余元素 ---');

const nums = [1, 2, 3, 4, 5];
const [first, ...rest] = nums;
console.log('数组 =', JSON.stringify(nums));
console.log('const [first, ...rest]');
console.log('  first =', first);
console.log('  rest  =', JSON.stringify(rest), '（新数组，包含剩下的全部）');

// rest 一定是数组，且永远不是 undefined
const [only] = [1];
console.log('\n没有剩余时：[only] = [1] -> rest 呢？');
const [onlyEl, ...emptyRest] = [1];
console.log('  only =', onlyEl, '，rest =', JSON.stringify(emptyRest), '（空数组，不是 undefined）');

// rest 是浅拷贝，元素仍是同一引用
const objs = [{ n: 1 }, { n: 2 }];
const [objFirst, ...objRest] = objs;
console.log('\n元素是对象时：objFirst === objs[0] ?', objFirst === objs[0]);
console.log('  objRest[0] === objs[1] ?', objRest[0] === objs[1], '（同一个引用，浅拷贝）');
console.log('  objRest 是新数组吗？', objRest !== objs, '（是）');

// 实用场景：取"第一个 + 其余"
const [primary, ...others] = ['主管理员', '管理员A', '管理员B'];
console.log('\n主管理员 =', primary, '，其他 =', JSON.stringify(others));

// 剩余元素必须放在最后
console.log('\n注意：剩余元素必须是声明中的最后一个，[...rest, last] 是语法错误；');
console.log("      SpreadElement 出现在中间会直接让脚本报错，所以这里没法用 try/catch 演示。");

// ---------------------------------------------------------------------------
// 5. 嵌套解构
// ---------------------------------------------------------------------------

console.log('\n--- 5. 嵌套解构 ---');

const matrix = [
  [1, 2],
  [3, 4],
];

// 只取第一行
const [row1] = matrix;
console.log('第一行 =', JSON.stringify(row1));

// 取第一行的两个元素
const [[m00, m01]] = matrix;
console.log('第一行两个元素 =', m00, m01);

// 取所有四个（结构扁平展开了）
const [
  [a00, a01],
  [a10, a11],
] = matrix;
console.log('四个元素 =', a00, a01, a10, a11);

// 嵌套 + 跳过 + 默认值混合
const complex = [[1], [2, 3], []];
const [
  [p = 0, q = 0], // 第一行只有 1 个元素，q 用默认值
  [, r = 0], // 第二行跳过第一个
  [s = 99], // 第三行是空数组，s 用默认值
] = complex;
console.log('\n嵌套混合解构：p =', p, ', q =', q, ', r =', r, ', s =', s);

// 深层嵌套：从 API 响应里直接取值
const response = [
  [200, 'OK'],
  [{ id: 1, tags: ['前端', 'Node'] }],
];
const [[status, statusText], [{ id, tags }]] = response;
console.log('\n直接解构 API 响应：');
console.log('  status =', status, ', statusText =', statusText);
console.log('  id =', id, ', tags =', JSON.stringify(tags));

// 混合解构：数组里套对象（对象解构按属性名）
const mixed = [{ name: '张三', age: 20 }, 'extra'];
const [{ name: userName, age: userAge }, extra] = mixed;
console.log('\n数组套对象解构：name =', userName, ', age =', userAge, ', extra =', extra);
console.log('（[] 里的 { name: userName } 是对象解构，按属性名匹配，不看位置）');

// ---------------------------------------------------------------------------
// 6. 交换变量与重新赋值
// ---------------------------------------------------------------------------

console.log('\n--- 6. 交换变量 ---');

let x = 1;
let y = 2;
console.log('交换前：x =', x, ', y =', y);

// 数组解构交换：右边先求值成 [2, 1]，再依次赋值
[x, y] = [y, x];
console.log('交换后：x =', x, ', y =', y, '（不需要临时变量）');

// 三个变量轮换
let [l, m, n] = [1, 2, 3];
console.log('\n轮换前：l =', l, ', m =', m, ', n =', n);
[l, m, n] = [n, l, m];
console.log('轮换后：l =', l, ', m =', m, ', n =', n);

// 注意：语句开头的数组解构赋值要用括号包起来吗？
// [x, y] = [y, x]; 这一行本身是合法的（前面有表达式上下文时）。
// 但在"没有前置语句"的语句开头写数组字面量可能被误解析，加上括号最安全：
[x, y] = [y, x];
console.log('\n再次交换（这样写也是合法的）：x =', x, ', y =', y);
console.log('不过当解构赋值单独成句且以 [ 开头时，前置一个分号或用括号更保险。');

// 用分号防御 ASI 问题（本仓库统一显式分号，正是为了避免这类问题）
const prev = [0, 0];
;[x, y] = prev;
console.log('加前置分号后安全解构 =', x, y);

// 交换数组中的两个元素（数组本身被修改，注意这是 sort/交换的常见手法）
const arr = ['A', 'B', 'C'];
console.log('\n原数组 =', JSON.stringify(arr));
[arr[0], arr[2]] = [arr[2], arr[0]];
console.log('交换首尾后 =', JSON.stringify(arr), '（这里确实修改了原数组）');

// ---------------------------------------------------------------------------
// 7. 函数参数解构
// ---------------------------------------------------------------------------

console.log('\n--- 7. 函数参数解构 ---');

// 参数是数组时，直接解构
function distance([x1, y1], [x2, y2]) {
  return Math.hypot(x2 - x1, y2 - y1);
}
console.log('两点距离 =', distance([0, 0], [3, 4]));

// 参数带默认值（注意：默认值是给"整个参数"或"元素"）
function drawRect([w = 100, h = 50] = []) {
  return `矩形 ${w}x${h}`;
}
console.log('drawRect() =', drawRect(), '（整个参数默认 []，元素各自用默认值）');
console.log('drawRect([200]) =', drawRect([200]));
console.log('drawRect([200, 100]) =', drawRect([200, 100]));

// 常见模式：函数返回数组（多返回值）
function minMax(numbers) {
  return [Math.min(...numbers), Math.max(...numbers)];
}
const [min, max] = minMax([3, 1, 4, 1, 5, 9, 2, 6]);
console.log('\nminMax 返回数组，解构取值：min =', min, ', max =', max);

// 用剩余元素收集"其余参数"（也能用 rest 参数 ...args，见函数章节）
function pickFirst([head, ...tail]) {
  return { head, tail };
}
console.log('pickFirst([1,2,3]) =', JSON.stringify(pickFirst([1, 2, 3])));
console.log('pickFirst([]) =', JSON.stringify(pickFirst([])), '（head 是 undefined，tail 是空数组）');

// 数组解构 vs 对象解构的对比：数组按位置，对象按名字
console.log('\n对比：');
const point = [1, 2];
const [px, py] = point;
console.log('  数组解构 const [px, py] = [1, 2] -> 按位置：', px, py);
const pointObj = { y: 2, x: 1 };
const { x: ox, y: oy } = pointObj;
console.log('  对象解构 const { x: ox, y: oy } = {y:2, x:1} -> 按名字：', ox, oy, '（顺序无关）');

// ---------------------------------------------------------------------------
// 8. 在 for...of 中解构
// ---------------------------------------------------------------------------

console.log('\n--- 8. for...of 中解构 ---');

const pairs = [
  ['语文', 90],
  ['数学', 85],
  ['英语', 92],
];

console.log('遍历 [键, 值] 数组：');
for (const [subject, score] of pairs) {
  console.log(`  ${subject}: ${score}`);
}

// 遍历 entries()
console.log('\n遍历 entries()：');
for (const [i, [subject, score]] of pairs.entries()) {
  console.log(`  #${i} ${subject} = ${score}`);
}

// 遍历 Map
const map = new Map(pairs);
console.log('\n遍历 Map：');
for (const [k, v] of map) {
  console.log(`  ${k} -> ${v}`);
}

// 遍历 Object.entries()
const scores = { 语文: 90, 数学: 85 };
console.log('\n遍历 Object.entries()：');
for (const [k, v] of Object.entries(scores)) {
  console.log(`  ${k} -> ${v}`);
}

// 遍历的数组元素本身是数组时，可以多层解构
const records = [
  ['张三', [20, '北京']],
  ['李四', [31, '上海']],
];
console.log('\n多层解构：');
for (const [name2, [age2, city]] of records) {
  console.log(`  ${name2}，${age2} 岁，来自 ${city}`);
}

// ---------------------------------------------------------------------------
// 9. 常见错误
// ---------------------------------------------------------------------------

console.log('\n--- 9. 常见错误 ---');

// 错误 1：解构 null / undefined 会抛错
try {
  const [v1] = null;
  console.log(v1);
} catch (err) {
  console.log('解构 null 抛错：', err.constructor.name, '-', err.message);
}
try {
  const [v2] = undefined;
  console.log(v2);
} catch (err) {
  console.log('解构 undefined 抛错：', err.constructor.name, '-', err.message);
}
// 正确写法：给整个右侧兜底
const [safe1] = null ?? [];
console.log('const [x] = null ?? [] -> x =', safe1, '（安全）');

// 错误 2：期望默认值能拦住 null
const [notDefaulted = '默认'] = [null];
console.log("\n[notDefaulted = '默认'] = [null] ->", notDefaulted, '（null 不触发默认值）');
// 正确写法：用 ?? 在解构后兜底
const [nullish] = [null];
console.log('解构后 (nullish ?? "默认") =', nullish ?? '默认');

// 错误 3：以为 rest 是 undefined
const [e1, ...eRest] = [1];
console.log('\n[1] 解构出的 rest =', JSON.stringify(eRest), '（空数组，安全可以直接用 eRest.length）');
console.log('  eRest.length =', eRest.length);

// 错误 4：把对象当数组解构（前面演示过），反向也一样
try {
  const { length } = [1, 2, 3]; // 这个其实可以，数组也有 length 属性
  console.log('\n对象解构数组也能工作，因为有 length 属性：length =', length);
} catch (err) {
  console.log('对象解构数组出错：', err.message);
}
console.log('但 const { 0: first2 } = arr 这种"数字键"解构虽然能跑，可读性极差，不要写。');

// ---------------------------------------------------------------------------
// 10. 实战
// ---------------------------------------------------------------------------

console.log('\n--- 10. 实战 ---');

// 场景一：解析 CSV 行
const csvLine = '张三,20,北京';
const [csvName, csvAge, csvCity] = csvLine.split(',');
console.log('解析 CSV =', JSON.stringify({ name: csvName, age: csvAge, city: csvCity }));

// 场景二：解析版本号
const [major, minor = '0', patch = '0'] = '18.2'.split('.');
console.log('\n版本号解析 =', JSON.stringify({ major, minor, patch }));

// 场景三：从路径中取出各段
const url = '/api/v1/users/42';
const [, api, version, resource, userId] = url.split('/');
console.log('\nURL 解析 =', JSON.stringify({ api, version, resource, userId }));

// 场景四：安全的数组模式匹配
function handleResponse([ok, payload] = [false, null]) {
  if (!ok) return '请求失败';
  return `成功：${JSON.stringify(payload)}`;
}
console.log('\nhandleResponse([true, { id: 1 }]) =', handleResponse([true, { id: 1 }]));
console.log('handleResponse([false]) =', handleResponse([false]));
console.log('handleResponse() =', handleResponse(), '（整个参数用默认值兜底）');

// 场景五：分页参数
function parsePage([page = 1, size = 20] = []) {
  return { page, size, offset: (page - 1) * size };
}
console.log('\nparsePage() =', JSON.stringify(parsePage()));
console.log('parsePage([3, 10]) =', JSON.stringify(parsePage([3, 10])));

// ---------------------------------------------------------------------------
// 11. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 11. 小结 ---');
console.log('数组解构按位置匹配；对象解构按属性名匹配。');
console.log('默认值只在取到 undefined 时生效（null / 0 / "" 都不触发）。');
console.log('剩余元素必须放最后，并且总是得到真数组（没有剩余时是 []）。');
console.log('解构不修改原数组；但从中取出的 rest 是新数组、元素是浅拷贝的引用。');
console.log('解构 null / undefined 会抛错，用 `?? []` 兜底最省心。');
console.log('交换变量 [a, b] = [b, a] 是解构最优雅的应用之一。');
