/**
 * ============================================================================
 * 知识点：剩余参数 ...args，与 arguments 的对比
 * ============================================================================
 *
 * 【所属分类】06_functions —— 函数
 * 【难度等级】入门
 * 【前置知识】06_functions/02_parameters.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    剩余参数（rest parameters）用三个点 `...` 写在形参列表的最后，
 *    把"剩下所有实参"收集进一个真正的数组。
 *      function sum(...nums) {}   // nums 是 [1, 2, 3] 这样的真数组
 *    它和"展开运算符（spread）"长得一样，但出现在形参位置叫"剩余"，
 *    出现在实参/数组字面量位置叫"展开"，方向刚好相反。
 *
 * 2. 为什么需要
 *    ES5 时代要用 arguments 处理可变参数，但 arguments 有三个硬伤：
 *      (1) 是类数组，没有 map / filter / reduce，用前必须 Array.from 转换；
 *      (2) 会包含"所有"实参，无法只收集后半段；
 *      (3) 箭头函数里没有 arguments。
 *    剩余参数一次性解决这三个问题，是处理可变参数的标准做法。
 *
 * 3. 核心语法要点
 *    (1) 必须是最后一个形参，后面不能跟别的参数。
 *    (2) 上面不能写默认值：`function f(...a = [])` 是语法错误。
 *    (3) 收集结果一定是真数组（Array.isArray 为 true），可直接用数组方法。
 *    (4) 没有多余实参时，得到的是空数组 []，而不是 undefined。
 *    (5) 可以和普通形参混用：`function f(first, ...rest) {}`，rest 只剩后面的。
 *    (6) 可用于解构：`const [a, ...b] = [1, 2, 3]` 得到 a=1, b=[2,3]。
 *
 * 4. 常见陷阱
 *    - 把剩余参数写在了中间：`function f(...a, b) {}` → SyntaxError。
 *    - 误以为是"展开"：`fn(...arr)` 是展开，"...args 写在定义处"才是收集。
 *    - 在箭头函数里找 arguments：根本没有，只能用剩余参数。
 *    - 剩余参数收集的是一个新数组，修改它不会影响 arguments，反之亦然。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 06_functions/03_rest_parameters.js
 *
 * 【预期输出】
 *   演示剩余参数的基本用法、与普通形参混用、空收集、解构中的 rest，
 *   并逐条对比 rest 与 arguments 的差异。
 * ============================================================================
 */

console.log('--- 1. 剩余参数基础：把可变实参收集成真数组 ---');

function sum(...nums) {
  // nums 是货真价实的数组，可以直接用数组方法。
  console.log('  Array.isArray(nums) →', Array.isArray(nums));
  return nums.reduce((acc, n) => acc + n, 0);
}
console.log('  sum()           →', sum());
console.log('  sum(1)          →', sum(1));
console.log('  sum(1, 2, 3)    →', sum(1, 2, 3));
console.log('  sum(1, 2, 3, 4) →', sum(1, 2, 3, 4));

console.log('--- 2. 没有多余实参时得到空数组 ---');

function maybeEmpty(...rest) {
  console.log('  rest =', rest, '；length =', rest.length);
  console.log('  rest === undefined ?', rest === undefined, '（不是 undefined，是空数组）');
}
maybeEmpty();

console.log('--- 3. 与普通形参混用：剩余参数必须在最后 ---');

// 第一个实参给 first，剩下的全部进 rest。
function pickFirst(first, ...rest) {
  console.log(`  first = ${first}；rest = [${rest.join(', ')}]`);
}
pickFirst('a', 'b', 'c', 'd');
pickFirst('only-one');

// 下面这行如果取消注释会直接导致语法错误（顶层抛错，属于绝对禁止的情况）：
// function bad(...a, b) {}

console.log('--- 4. 剩余参数不能有默认值（语法层面禁止） ---');
// function wrong(...args = []) {}
// 上面这种写法是 SyntaxError: Rest parameter may not have a default initializer。
// 需要默认值时，应在函数体内自己兜底：
function withFallback(...args) {
  const list = args.length > 0 ? args : ['默认值'];
  return list;
}
console.log('  withFallback()        →', withFallback());
console.log('  withFallback(1, 2)    →', withFallback(1, 2));

console.log('--- 5. 箭头函数也能用剩余参数（它没有 arguments，只能靠 rest） ---');

const arrowSum = (...nums) => nums.reduce((a, b) => a + b, 0);
console.log('  arrowSum(1, 2, 3, 4, 5) →', arrowSum(1, 2, 3, 4, 5));

// 箭头函数内部的 arguments 会沿着外层作用域去找，模块顶层根本没有，
// 所以这里会抛 ReferenceError —— 必须在内部捕获。
const arrowArgs = () => {
  try {
    return arguments;
  } catch (err) {
    return `捕获到 ${err.constructor.name}：箭头函数没有自己的 arguments`;
  }
};
console.log(' ', arrowArgs());

console.log('--- 6. 剩余参数在解构中的用法（rest 元素的另一半身份） ---');

// 数组解构中的 rest：把剩下的元素收集成新数组。
const [head, ...tail] = [10, 20, 30, 40];
console.log(`  数组解构：[head, ...tail] = [10,20,30,40] → head=${head}, tail=[${tail}]`);

// 对象解构中的 rest：把剩下的属性收集成新对象。
const { id, ...others } = { id: 1, name: '小明', age: 18 };
console.log(`  对象解构：{ id, ...others } → id=${id}, others=`, others);

// 函数形参位置也可以直接解构 + rest。
function showConfig({ host, port, ...rest }) {
  console.log(`  形参解构：host=${host}, port=${port}, rest=`, rest);
}
showConfig({ host: 'localhost', port: 8080, debug: true, timeout: 3000 });

console.log('--- 7. rest 与 arguments 逐条对比 ---');

// 用一个函数同时拿到两者，方便对照。
function compare(...nums) {
  const rows = [
    ['类型', Array.isArray(nums) ? '真数组' : '不是数组', Array.isArray(arguments) ? '真数组' : '类数组对象'],
    ['是否可用数组方法', '可以直接用 map/filter/reduce', '必须 Array.from 转换'],
    ['箭头函数中是否可用', '可以', '没有（会去外层找，通常是 ReferenceError）'],
    ['能否只收集部分实参', '可以（配合前置形参）', '不可以，永远包含全部实参'],
    ['未传参时的值', '空数组 []', '空类数组，length 为 0'],
    ['能否设置默认值', '不可以', '不适用'],
    ['是否受严格模式影响', '不受影响', '非严格模式下与形参双向联动'],
    ['length 属性', '不适用（length 表示元素个数）', 'length 表示实参个数'],
  ];
  for (const [k, rest, args] of rows) {
    console.log(`  · ${k}`);
    console.log(`      剩余参数 ...nums : ${rest}`);
    console.log(`      arguments       : ${args}`);
  }
  void nums;
  void arguments;
}
compare(1, 2, 3);

console.log('--- 8. 实战：只对"多出来的"实参做处理 ---');

// 常见场景：前几个参数是配置，后面的是数据。
function logWithPrefix(prefix, ...messages) {
  return messages.map((m) => `[${prefix}] ${m}`).join('\n');
}
console.log(logWithPrefix('INFO', '启动成功', '监听 3000 端口', '按 Ctrl+C 退出'));
