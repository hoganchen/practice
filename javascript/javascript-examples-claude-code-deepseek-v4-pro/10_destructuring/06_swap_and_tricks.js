/**
 * ============================================================================
 * 知识点：解构的实用技巧 —— 变量交换、多返回值、解构字符串与 Map
 * ============================================================================
 *
 * 【所属分类】10_destructuring —— 解构赋值
 * 【难度等级】进阶
 * 【前置知识】10_destructuring/02_array_destructuring.js、10_destructuring/05_function_parameters.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本文件收集解构在实际编码里最常用的几类技巧：
 *      (1) 不用临时变量交换两个（或多个）变量
 *      (2) 让函数"返回多个值"变得自然
 *      (3) 解构字符串（按字符/码点）
 *      (4) 解构 Map / Set / entries 的迭代结果
 *      (5) 结合数组方法与正则结果取值
 *      (6) 对象与数组之间的"来回搬运"
 *
 * 2. 为什么需要
 *    这些技巧本身都很小，但累计起来能显著减少样板代码。
 *    尤其是"多返回值"——JS 没有元组类型，用数组返回 + 解构接收是极常见的约定，
 *    理解它能读懂大量库函数的用法（如 useState 的 [value, setValue]）。
 *
 * 3. 核心语法要点
 *    (1) 交换：[a, b] = [b, a]。右侧先整体求值成一个新数组，再逐项赋值，所以安全。
 *    (2) 多返回值：函数返回数组，调用方用数组解构接收；返回对象则用对象解构接收。
 *        返回数组适合"顺序固定且短"的场景；返回对象适合"字段较多、需要自解释"的场景。
 *    (3) 解构字符串：字符串是可迭代对象，所以 const [c1, c2] = 'hi' 得到 'h'、'i'。
 *        注意得到的是"字符"（码点），不是 UTF-16 码元——对代理对（emoji）是安全的。
 *    (4) 解构 Map：Map 的迭代项是 [key, value]，所以 for (const [k, v] of map)。
 *        也可以直接解构 keys()/values()/entries() 的返回值。
 *    (5) 正则匹配结果可以解构：const [, year, month, day] = /(\d+)-(\d+)-(\d+)/.exec(s)。
 *    (6) 用对象解构模拟"具名参数"，用剩余属性做"剥离"。
 *
 * 4. 常见陷阱
 *    (1) 交换时忘记分号（ASI 陷阱）：上一行以数组字面量结尾时可能被连起来。
 *    (2) 用数组解构接"返回对象"的函数，会得到 undefined（类型不匹配）。
 *    (3) 解构字符串得到的是单个字符，想按"字节/码元"处理要另想办法。
 *    (4) exec 匹配失败时返回 null，解构 null 会抛 TypeError —— 必须先判空。
 *    (5) 解构返回的对象时，如果嵌套层级深，字段名容易和外部变量冲突。
 *    (6) 交换两个对象属性时 [obj.a, obj.b] = [obj.b, obj.a] 是可以的，
 *        但要确保求值顺序符合预期。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 10_destructuring/06_swap_and_tricks.js
 *
 * 【预期输出】
 *   分 6 个小节，逐项演示这些技巧及其边界情况。
 * ============================================================================
 */

console.log('--- 1. 变量交换：不用临时变量 ---');

let a = 1;
let b = 2;
console.log('交换前 a =', a, '，b =', b);

// 右侧 [b, a] 先被求值成新数组 [2, 1]，然后按位置赋回：
// a 拿到 2，b 拿到 1。因为右侧整体先求值，所以不需要临时变量。
[a, b] = [b, a];
console.log('交换后 a =', a, '，b =', b);

// 三个变量轮换
let x = 'X';
let y = 'Y';
let z = 'Z';
[x, y, z] = [z, x, y];
console.log('轮换后 x =', x, '，y =', y, '，z =', z);

// 原地反转：把 [1,2,3] 变成 [3,2,1]（两个元素交换的推广）
let p = 1;
let q = 2;
let r = 3;
[p, q, r] = [r, q, p];
console.log('反转后 =', p, q, r);

// 交换数组元素
const arr = [10, 20, 30];
[arr[0], arr[2]] = [arr[2], arr[0]];
console.log('交换数组首尾后 =', JSON.stringify(arr));

// 交换对象属性
const point = { lat: 30, lng: 120 };
[point.lat, point.lng] = [point.lng, point.lat];
console.log('交换对象属性后 =', JSON.stringify(point));

// 陷阱提示：ASI（自动分号插入）可能把上一行和这一行的 [ 连起来
console.log('\nASI 陷阱提示：');
console.log('   如果上一行以某个"值"结尾且没写分号，紧接着一行的 [(...)  开头的语句');
console.log('   会被解析成"索引访问"。本仓库统一显式写分号，就能避免这个问题。');

console.log('\n--- 2. 多返回值函数 ---');

// 风格 A：返回数组 —— 适合"顺序固定、含义明确、项数少"的场景
function minMaxAvg(numbers) {
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const avg = numbers.reduce((s, n) => s + n, 0) / numbers.length;
  return [min, max, avg];
}
const [minValue, maxValue, avgValue] = minMaxAvg([3, 1, 4, 1, 5, 9, 2, 6]);
console.log('返回数组：min =', minValue, '，max =', maxValue, '，avg =', avgValue.toFixed(2));

// 可以只取关心的部分
const [, onlyMax] = minMaxAvg([3, 1, 4]);
console.log('只取 max =', onlyMax);
// 也可以先接住整个数组再按需取
const stats = minMaxAvg([3, 1, 4]);
console.log('接住整个数组 =', JSON.stringify(stats), '，取平均 =', stats[2].toFixed(2));

// 风格 B：返回对象 —— 适合"字段多、需要自解释"的场景
function analyze(text) {
  return {
    length: text.length,
    words: text.split(/\s+/).filter(Boolean).length,
    hasChinese: /[一-龥]/.test(text),
  };
}
const { length: textLength, words, hasChinese } = analyze('hello 世界');
console.log('\n返回对象：length =', textLength, '，words =', words, '，hasChinese =', hasChinese);

// 风格 C：像 React 的 useState 那样的"值 + 更新函数"约定
function createStore(initial) {
  let value = initial;
  const get = () => value;
  const set = (v) => {
    value = v;
    return get();
  };
  // 返回 [值, 更新函数]，调用方自由命名，这也解释了 useState 的 [count, setCount] 写法
  return [get, set];
}
const [getCount, setCount] = createStore(0);
setCount(5);
console.log('\n[getter, setter] 约定：getCount() =', getCount());

// 类型不匹配的陷阱
function returnsArray() {
  return [1, 2];
}
function returnsObject() {
  return { a: 1, b: 2 };
}
const [fromArray] = returnsArray();
console.log('\n数组解构接数组 =', fromArray);
const { a: fromObjectWrong } = returnsArray(); // 数组没有名为 a 的属性
console.log('对象解构接数组 =', fromObjectWrong, '（数组没有这个属性名，得到 undefined）');
// 数组解构接对象：会抛错，因为普通对象不可迭代
console.log('数组解构接对象尝试：');
try {
  const result = returnsObject();
  const [bad] = result;
  console.log(bad);
} catch (err) {
  console.log('   报错：', err.name, '-', err.message.slice(0, 40), '...');
}

console.log('\n--- 3. 解构字符串 ---');

// 字符串是可迭代对象，按"码点"逐个产出
const [firstChar, secondChar, thirdChar] = '你好啊世界';
console.log('解构中文字符串 =', firstChar, secondChar, thirdChar);

// 对 emoji 也是安全的（emoji 是代理商对，占两个 UTF-16 码元，
// 但字符串迭代器按"码点"处理，所以能完整取出）
const emoji = '👋🌍🚀';
const [wave, earth, rocket] = emoji;
console.log('解构 emoji =', wave, earth, rocket);
console.log('   wave 的长度（UTF-16 码元数） =', wave.length, '（说明是完整的一个码点）');

// 对比：用下标访问会拿到"半个字符"
console.log('   emoji[0] =', JSON.stringify(emoji[0]), '（只是高位代理，不完整）');
console.log('   emoji[0] + emoji[1] =', JSON.stringify(emoji[0] + emoji[1]), '（拼起来才完整）');

// 解构字符串 + rest
const [headChar, ...restChars] = 'abcdef';
console.log('\n解构字符串 + rest =', headChar, JSON.stringify(restChars));

// 解构字符串的 length 属性（对象解构也能用于字符串，因为会被装箱）
const { length: strLen } = 'hello world';
console.log('解构字符串的 length =', strLen);

// 实用场景：取版本号的主要部分
const version = '18.17.1';
const [major, minor, patch] = version.split('.');
console.log('版本号拆解 =', { major, minor, patch });

// 实用场景：把字符串按位置分段
const idCard = '330100199001011234';
const [areaCode, birthDate, seq] = [idCard.slice(0, 6), idCard.slice(6, 14), idCard.slice(14)];
console.log('身份证分段 =', areaCode, birthDate, seq);

console.log('\n--- 4. 解构 Map 与 Set ---');

const capitals = new Map([
  ['中国', '北京'],
  ['日本', '东京'],
  ['法国', '巴黎'],
]);

// Map 的每一项是 [key, value]，所以可以直接解构
console.log('遍历 Map：');
for (const [country, capital] of capitals) {
  console.log(`   ${country} -> ${capital}`);
}

// 也可以解构 entries() 的返回值
const [[firstCountry, firstCapital]] = capitals.entries();
console.log('解构第一个 entry =', firstCountry, firstCapital);

// 解构 keys() / values() 的迭代器（注意它们是一次性的迭代器，取完就没了）
const [firstKey] = capitals.keys();
console.log('解构 keys() 第一个 =', firstKey);

// 用解构把 Map 转成对象（也可用 Object.fromEntries，见 09_objects/05）
const capitalObj = {};
for (const [k, v] of capitals) {
  capitalObj[k] = v;
}
console.log('Map 转对象 =', JSON.stringify(capitalObj));

// Set 的迭代项是单个值
const uniqueNumbers = new Set([3, 1, 4, 1, 5]);
const [firstUnique, secondUnique, ...restUnique] = uniqueNumbers;
console.log('\n解构 Set =', firstUnique, secondUnique, JSON.stringify(restUnique));
console.log('Set 会自动去重，所以元素个数 =', uniqueNumbers.size);

// 实用场景：集合运算的结果可以直接解构
const setA = new Set([1, 2, 3]);
const setB = new Set([2, 3, 4]);
const intersection = new Set([...setA].filter((n) => setB.has(n)));
const [firstCommon, ...otherCommon] = intersection;
console.log('交集第一个元素 =', firstCommon, '，其余 =', JSON.stringify(otherCommon));

console.log('\n--- 5. 解构正则匹配结果 ---');

const dateStr = '2024-06-15';
const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);

// exec 的结果是一个"类数组"：第 0 项是整体匹配，第 1..n 项是捕获组
console.log('exec 结果 =', JSON.stringify(dateMatch));

if (dateMatch) {
  // 用空位跳过第 0 项（整体匹配），依次取三个捕获组
  const [, year, month, day] = dateMatch;
  console.log('解构出年月日 =', year, month, day);
}

// 陷阱：匹配失败时 exec 返回 null，解构 null 会抛错
const failedMatch = /^(\d{4})$/.exec('不是数字');
console.log('\n匹配失败时 exec 返回 =', failedMatch);
try {
  const [, badYear] = failedMatch;
  console.log(badYear);
} catch (err) {
  console.log('直接解构 null 报错：', err.name, '-', err.message.slice(0, 40), '...');
}
// 正确做法一：先判空
if (failedMatch) {
  const [, badYear] = failedMatch;
  console.log(badYear);
} else {
  console.log('先判空，安全跳过');
}
// 正确做法二：用 ?? 兜底成空数组
const [, safeYear = '未知'] = failedMatch ?? [];
console.log('用 ?? [] 兜底 =', safeYear);

// 具名捕获组（ES2018）：groups 属性是个对象，可以用对象解构
const namedMatch = /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/.exec(dateStr);
if (namedMatch?.groups) {
  const { y: namedYear, m: namedMonth, d: namedDay } = namedMatch.groups;
  console.log('\n具名捕获组解构 =', namedYear, namedMonth, namedDay);
}

// 实用场景：解析查询字符串
const query = '?page=2&size=10&sort=desc';
const params = Object.fromEntries(
  query
    .slice(1)
    .split('&')
    .map((pair) => {
      const [key, value = ''] = pair.split('='); // 用解构 + 默认值处理没有 = 的情况
      return [key, value];
    }),
);
console.log('解析查询字符串 =', JSON.stringify(params));

console.log('\n--- 6. 其它常用小技巧 ---');

// (1) 用剩余属性"剥离"字段：把某个字段拿掉，其余原样保留
const rawUser = { id: 1, name: '张三', password: 'secret', role: 'user' };
const { password, ...safeUser } = rawUser;
console.log('剥离 password 后 =', JSON.stringify(safeUser));
console.log('（这是"对象脱敏"最常用的写法）');

// (2) 用剩余元素做"取首 + 保留其余"
const queue = ['任务1', '任务2', '任务3'];
const [currentTask, ...pendingTasks] = queue;
console.log('\n取队首 =', currentTask, '，剩余 =', JSON.stringify(pendingTasks));

// (3) 解构 + 默认值实现"可选配置"
const createLogger = ({ prefix = '[LOG]', level = 'info' } = {}) => (msg) =>
  `${prefix}(${level}) ${msg}`;
const log = createLogger({ prefix: '[APP]' });
console.log('工厂函数 =', log('启动完成'));

// (4) 数组 ↔ 对象的往返搬运
const pairs = [
  ['a', 1],
  ['b', 2],
];
const asObject = Object.fromEntries(pairs);
const backToPairs = Object.entries(asObject);
console.log('\n数组 -> 对象 -> 数组 =', JSON.stringify(backToPairs));

// (5) 解构出"数组的前 N 项并补默认值"
const configValues = [8080];
const [host2 = 'localhost', port2 = 80, protocol = 'http'] = configValues;
console.log('数组补默认值 =', protocol, host2, port2, '（注意位置对应关系）');

// (6) 用解构实现"多层兜底取第一个非空值"
function firstTruthy(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
}
console.log('\n多层兜底 =', firstTruthy(undefined, null, '', 0, 'fallback'));

// (7) 解构配合展开实现"数组去重 + 取前几个"
const withDup = [1, 2, 2, 3, 3, 3, 4];
const [firstDistinct, secondDistinct] = [...new Set(withDup)];
console.log('去重后取前两个 =', firstDistinct, secondDistinct);

// (8) 解构实现"安全的属性读取 + 重命名"，避免中间变量污染
const serverResponse = { status: 200, body: { items: [1, 2, 3] } };
const {
  status: httpStatus,
  body: { items },
} = serverResponse;
console.log('\n安全读取 + 重命名 =', httpStatus, JSON.stringify(items));

console.log('\n全部演示完毕。');
