/**
 * ============================================================================
 * 知识点：数组解构 —— 按位置取值、跳过元素、剩余元素、默认值
 * ============================================================================
 *
 * 【所属分类】10_destructuring —— 解构赋值
 * 【难度等级】入门
 * 【前置知识】10_destructuring/01_object_destructuring.js
 *
 * 【也见】08_arrays/17_array_destructuring.js —— 数组解构在「数组」章节里另有一篇同等深度的讲解。
 *        本文件是解构语法体系的主场（系统讲各形态与边界）；那篇从数组视角切入，
 *        侧重迭代器协议、嵌套解构与 for...of / 函数参数的配合。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    数组解构用方括号 [] 放在赋值号左边，按**位置**把数组元素取出来赋给变量：
 *      const [first, second] = [10, 20];
 *    对象解构按"名字"匹配，数组解构按"顺序"匹配，这是两者最本质的区别。
 *
 * 2. 为什么需要
 *    (1) 从函数返回多个值时，比返回对象更轻（不需要给每个值起名字）。
 *    (2) 交换变量、取首尾元素、拆分数据的写法都极其简洁。
 *    (3) 处理 CSV 行、坐标、颜色分量这类"位置有意义"的数据特别自然。
 *    (4) 配合剩余元素 ...rest 可以轻松实现"取头剩下的都归我"。
 *
 * 3. 核心语法要点
 *    (1) 按位置匹配：[a, b] = [1, 2] 中 a=1、b=2。
 *    (2) 元素多于变量：多出来的被忽略。
 *    (3) 变量多于元素：少的部分得到 undefined（除非给了默认值）。
 *    (4) 跳过元素：用连续的逗号占位，[, , third] 表示跳过前两个。
 *    (5) 剩余元素：const [head, ...tail] = arr，rest 必须放在最后，且只能是数组。
 *    (6) 默认值：[a = 1] = []，仅在取到 undefined 时生效（null / 0 / '' 不触发）。
 *    (7) 可以给已有变量赋值，这时整条语句若以 [ 开头是安全的（不会与代码块混淆），
 *        但为了一致性，很多风格指南仍建议加圆括号。
 *    (8) 交换变量：[a, b] = [b, a]。
 *
 * 4. 常见陷阱
 *    (1) 以为"变量多了会报错"——不会，只是 undefined。
 *    (2) 解构 null / undefined 会抛 TypeError（它们不可迭代）。
 *    (3) 剩余元素必须最后：const [...rest, last] = arr 是语法错误。
 *    (4) 数组解构的默认值只在 undefined 时生效，null 不触发。
 *    (5) 解析"稀疏数组"时，空位也会被当成一个位置拿成 undefined。
 *    (6) 解构一个"类数组但不可迭代"的对象（如 { length: 2 }）会抛错，
 *        因为数组解构依赖的是"可迭代协议"而不是 length（详见 07 号文件）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 10_destructuring/02_array_destructuring.js
 *
 * 【预期输出】
 *   分 7 个小节，演示数组解构的各种形态与边界行为。
 * ============================================================================
 */

console.log('--- 1. 基本用法：按位置取值 ---');

const colors = ['红', '绿', '蓝'];

// 按顺序取出，变量名随意（与对象解构不同，这里不看名字看位置）
const [c1, c2, c3] = colors;
console.log('c1, c2, c3 =', c1, c2, c3);

// 只取前两个，第三个被忽略
const [first] = colors;
console.log('只取第一个 =', first);

// 元素多于变量：多的被丢弃
const [onlyOne, onlyTwo] = [1, 2, 3, 4, 5];
console.log('元素多时 =', onlyOne, onlyTwo);

// 变量多于元素：少的得到 undefined
const [p, q, r, s] = [1, 2, 3];
console.log('变量多时 p, q, r, s =', p, q, r, s);

// 解构不修改原数组
console.log('原数组仍是 =', JSON.stringify(colors));

console.log('\n--- 2. 跳过元素：用逗号占位 ---');

const rgb = [255, 128, 0];

// 只想拿第一个和第三个，中间的用空位跳过
const [red, , blue] = rgb;
console.log('跳过后 red =', red, '，blue =', blue);

// 跳过前面：只想要第三个
const [, , third] = rgb;
console.log('只要第三个 =', third);

// 跳过多个：连续写逗号
const data = ['a', 'b', 'c', 'd', 'e'];
const [, , , , fifth] = data;
console.log('只要第五个 =', fifth);

console.log('\n--- 3. 剩余元素 ...rest ---');

const numbers = [1, 2, 3, 4, 5];

// rest 会收集"剩余所有元素"成一个新数组，必须放在最后
const [head, ...tail] = numbers;
console.log('head =', head, '，tail =', JSON.stringify(tail));
console.log('tail 是新数组，不是原数组的引用 =', tail !== numbers);

// 只剩最后一个值：rest 收集前面的，最后一个单独取。
// 注意 rest 必须写在最后，所以这里要写成 [...init, last] 是不可能的，
// 正确做法是把 last 放在普通位置，用 rest 收集前面，再取最后一项：
const init = numbers.slice(0, -1);
const last = numbers[numbers.length - 1];
console.log('init =', JSON.stringify(init), '，last =', last);
console.log('（rest 元素只能是最后一个，所以"倒数第一个单独取"要靠 slice 或 at）');
console.log('用 Array.prototype.at(-1) 也可以 =', numbers.at(-1));

// 全部收进 rest（常用于"复制数组"）
const [...copy] = numbers;
console.log('整个复制 =', JSON.stringify(copy), '，是新数组 =', copy !== numbers);

// rest 可以是空数组
const [x, ...others] = [1];
console.log('rest 为空 =', JSON.stringify(others));

// 常见用法：分离"第一个参数 + 其余参数"
const [primary, ...fallbacks] = ['#ff0000', '#00ff00', '#0000ff'];
console.log('主色 =', primary, '，备选 =', JSON.stringify(fallbacks));

// 文件路径拆分
const [root, ...parts] = ['/', 'usr', 'local', 'bin'];
console.log('root =', root, '，parts =', JSON.stringify(parts));

console.log('\n--- 4. 默认值 ---');

const partial = [1];

// 语法：[变量 = 默认值]
const [a = 10, b = 20, c = 30] = partial;
console.log('a（有值） =', a);
console.log('b（缺失，用默认值） =', b);
console.log('c（缺失，用默认值） =', c);

// 默认值只在 undefined 时生效，null / 0 / '' / false 都不触发
const tricky = [undefined, null, 0, '', false];
const [v1 = '默认1', v2 = '默认2', v3 = '默认3', v4 = '默认4', v5 = '默认5'] = tricky;
console.log('\n[undefined, null, 0, "", false] 解构带默认值：');
console.log('   undefined -> 触发默认值 =', v1);
console.log('   null      -> 不触发     =', v2);
console.log('   0         -> 不触发     =', v3);
console.log("   ''        -> 不触发     =", JSON.stringify(v4));
console.log('   false     -> 不触发     =', v5);

// 默认值可以是表达式，也可以是前面已解构出来的变量
const [base = 100, derived = base * 2, ...restOfDefaults] = [];
console.log('\n默认值是表达式 =', base, derived, JSON.stringify(restOfDefaults));

// 空位 + 默认值的组合
const [skipFirst, second = '兜底'] = [, ];
console.log('跳过第一个后第二个用默认值 =', second);

console.log('\n--- 5. 交换变量与对已有变量赋值 ---');

let m = 1;
let n = 2;

// 传统交换需要临时变量
// const tmp = m; m = n; n = tmp;

// 数组解构一步完成：右边先求值成数组 [n, m] = [2, 1]，再依次赋值
[m, n] = [n, m];
console.log('交换后 m =', m, '，n =', n);

// 三个变量轮换
let i1 = 'A';
let i2 = 'B';
let i3 = 'C';
[i1, i2, i3] = [i3, i1, i2];
console.log('轮换后 =', i1, i2, i3);

// 对已有变量部分赋值
let keep = '不动';
let change = '旧值';
[keep, change] = ['新值'];
console.log('部分赋值后 keep =', keep, '，change =', change);

// 排序时也常用
const nums = [3, 1, 2];
[nums[0], nums[2]] = [nums[2], nums[0]];
console.log('交换数组元素后 =', JSON.stringify(nums));

console.log('\n--- 6. 实际应用场景 ---');

// 场景 A：解析坐标
const points = [
  [1, 2],
  [3, 4],
  [5, 6],
];
console.log('解析坐标点：');
for (const [xCoord, yCoord] of points) {
  console.log(`   (${xCoord}, ${yCoord})`);
}

// 场景 B：拆分 CSV 行
const csvLine = '张三,20,杭州,工程师';
const [csvName, csvAge, csvCity, csvJob] = csvLine.split(',');
console.log('\n拆分 CSV =', JSON.stringify({ csvName, csvAge, csvCity, csvJob }));

// 场景 C：从 Map 的 entries 遍历（Map 的每项是 [key, value]）
const map = new Map([
  ['a', 1],
  ['b', 2],
]);
console.log('遍历 Map：');
for (const [k, v] of map) {
  console.log(`   ${k} -> ${v}`);
}

// 场景 D：取函数返回的多个值
function minMax(arr) {
  // 返回数组而不是对象，调用方可以自由命名
  return [Math.min(...arr), Math.max(...arr)];
}
const [minVal, maxVal] = minMax([5, 2, 9, 1, 7]);
console.log('\nminMax 结果 =', minVal, maxVal);

// 场景 E：忽略不关心的返回值
function parseResult() {
  return ['OK', { id: 1 }, ['警告A', '警告B']];
}
const [status, , warnings] = parseResult(); // 用空位跳过 payload
console.log('只取状态和警告 =', status, JSON.stringify(warnings));

// 场景 F：拆分首尾（如"取文件名与扩展名"）
const fileName = 'report.final.pdf';
const parts2 = fileName.split('.');
const [firstPart, ...restParts] = parts2;
console.log('\n文件名拆分 =', firstPart, JSON.stringify(restParts));
// 想"取扩展名（最后一段）+ 主名（前面所有）"：
// rest 只能在最后，所以先反转思路——用 slice 切出主名，再取最后一段。
const ext = parts2.at(-1);
const nameParts = parts2.slice(0, -1);
console.log('扩展名 =', ext, '，主名 =', nameParts.join('.'));

console.log('\n--- 7. 边界与陷阱 ---');

// (1) 解构 null / undefined 会抛错（它们不可迭代）
for (const bad of [null, undefined]) {
  try {
    const src = bad;
    const [item] = src;
    console.log(item);
  } catch (err) {
    console.log(`解构 ${String(bad)} 报错：`, err.name, '-', err.message.slice(0, 40), '...');
  }
}

// 但解构"不是可迭代对象的值"也会抛错——数组解构依赖可迭代协议，不是 length
try {
  const [item] = { 0: 'a', 1: 'b', length: 2 };
  console.log(item);
} catch (err) {
  console.log('解构类数组对象报错：', err.name, '-', err.message.slice(0, 50), '...');
}
console.log('想用类数组，得先转成真数组：Array.from / [...obj]');
console.log('Array.from 转换后 =', JSON.stringify(Array.from({ 0: 'a', 1: 'b', length: 2 })));

// (2) 稀疏数组的空位会被解构成 undefined
const sparse = [1, , 3];
const [sp1, sp2, sp3] = sparse;
console.log('\n稀疏数组解构 =', sp1, sp2, sp3);

// (3) rest 必须放最后（语法错误，仅说明）
console.log('\n语法错误示例（仅说明，不执行）：');
console.log("   const [...rest, last] = arr;  -> SyntaxError: Rest element must be last element");

// (4) 用逗号占位时容易数错，可以用格式化写法提高可读性
// 下面这种"竖着写"的方式，空位一眼就能数清：
const [
  index0,
  , // 跳过
  index2,
] = ['a', 'b', 'c'];
console.log('竖排写的解构 =', index0, index2);

console.log('\n全部演示完毕。');
