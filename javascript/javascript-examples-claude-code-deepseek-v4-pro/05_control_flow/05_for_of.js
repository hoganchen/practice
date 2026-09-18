/**
 * ============================================================================
 * 知识点：for...of —— 遍历可迭代对象（数组 / 字符串 / Map / Set）
 * ============================================================================
 *
 * 【所属分类】05_control_flow —— 流程控制
 * 【难度等级】入门
 * 【前置知识】05_control_flow/03_for_loop.js、04_operators/09_spread_rest.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    for...of 是 ES6 引入的"迭代器循环"，语法为：
 *      for (const 元素 of 可迭代对象) { ... }
 *    它直接给你**元素的值**，而不是下标或键。
 *    能用在 for...of 背后的对象必须是"可迭代对象"（实现了 Symbol.iterator 方法），
 *    包括：Array、String、Map、Set、TypedArray、arguments、NodeList、生成器对象，
 *    以及任何自定义了 Symbol.iterator 的对象。
 *
 * 2. 为什么需要
 *    用传统 for 遍历数组要写三段、要处理下标、容易差一错误；
 *    forEach 又无法用 break / continue / return 控制流程。
 *    for...of 兼顾了两者：语法最短，又能 break / continue。
 *    它也是"可读性最好的遍历方式"——读代码时你只关心"每个元素是什么"。
 *
 * 3. 核心语法要点
 *    【遍历内容】
 *      - 数组：得到每个元素
 *      - 字符串：得到每个**码点字符**（能正确处理 emoji，比 split('') 好）
 *      - Map：得到 [key, value] 数组，配合解构写 `for (const [k, v] of map)`
 *      - Set：得到每个成员
 *      - 生成器：得到 yield 出来的每个值
 *    【与解构结合】
 *      for (const [index, value] of arr.entries()) 可以同时拿到下标和值
 *      for (const [key, value] of Object.entries(obj)) 是遍历对象的标准写法
 *    【可以跳出】
 *      支持 break（提前结束）、continue（跳过本轮）、return（在函数中直接返回）、
 *      以及配套的标签（label）跳转。
 *    【异步迭代】
 *      for await (const x of asyncIterable) 可以自动 await 每个值，属于异步章节的内容。
 *
 * 4. 常见陷阱
 *    - 不能直接遍历普通对象：for...of 一个 {} 会抛 TypeError: obj is not iterable，
 *      要先用 Object.keys / values / entries 转成数组。
 *    - 遍历时拿到的是"值的引用（对象）或值的拷贝（原始值）"：
 *        改原始值不影响原数组（arr 里的值不会被改）；
 *        改对象属性会影响原数组（因为指向同一个对象）。
 *    - 遍历过程中增删元素，行为由迭代器实现决定（数组会"看到"新增项，可能死循环），
 *      想边遍历边删除请先复制一份，或改用倒序 for。
 *    - for...of 只能顺序遍历，没法像 for 那样跳着走或倒着走（除非自己收集成数组再反转）。
 *    - 性能上 for...of 依赖迭代器协议，比传统 for 略慢，但对绝大多数场景可忽略。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 05_control_flow/05_for_of.js
 *
 * 【预期输出】
 *   依次打印数组、字符串、Map、Set、生成器、类数组的遍历结果，
 *   配合解构与 entries 的用法，控制流（break / continue / label）演示，
 *   以及"改值 vs 改属性"与"不可迭代对象报错"的陷阱说明。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 遍历数组：得到元素本身
// ---------------------------------------------------------------------------

console.log('--- 1. 遍历数组 ---');

const fruits = ['苹果', '香蕉', '橙子'];

// 只关心元素本身时，这是最简洁的写法
for (const fruit of fruits) {
  console.log('  ' + fruit);
}

// 与 forEach 的对比：for...of 可以用 break / continue / return
console.log('  用 break 提前结束：');
for (const fruit of fruits) {
  if (fruit === '香蕉') {
    console.log('    遇到香蕉，提前结束循环');
    break;
  }
  console.log('    处理：' + fruit);
}

// 与 forEach 对比：forEach 里的 break 会直接报 SyntaxError
try {
  new Function("['a'].forEach(x => { break; });");
} catch (err) {
  console.log('  forEach 里写 break 抛出：', err.constructor.name, '-', err.message.split('\n')[0]);
}
console.log('  => 这是 forEach 的硬伤：它只能靠 return 跳过本轮，无法真正中断');

// 同时需要下标时，用 entries()
console.log('  用 entries() 同时拿到下标和值：');
for (const [index, fruit] of fruits.entries()) {
  console.log(`    [${index}] ${fruit}`);
}

// 或者先用 keys()
for (const index of fruits.keys()) {
  console.log(`    keys() 遍历下标 ${index} => ${fruits[index]}`);
}

// ---------------------------------------------------------------------------
// 2. 遍历字符串：按码点拆分
// ---------------------------------------------------------------------------

console.log('\n--- 2. 遍历字符串 ---');

const word = 'JavaScript';
for (const ch of word) {
  process.stdout.write(ch + ' '); // 不换行输出，方便看效果
}
console.log();

// 统计字符出现次数
const letterCount = {};
for (const ch of word.toLowerCase()) {
  letterCount[ch] = (letterCount[ch] ?? 0) + 1;
}
console.log('  字符统计：', letterCount);

// 与 split('') 的差别：for...of 按"码点"遍历，不会把代理对拆坏
const emoji = '😀';
console.log(`  '😀'.split('').length = ${emoji.split('').length}（被拆成两半）`);
console.log(`  [...'😀'].length = ${[...emoji].length}（正确的字符个数）`);
console.log('  for...of 遍历结果：');
for (const ch of emoji) {
  console.log(`    字符：${ch}，码点：${ch.codePointAt(0).toString(16)}`);
}

// 反转字符串时，先展开成数组再反转才安全
console.log("  用 [...str].reverse().join('') 反转 'abc' =", [...'abc'].reverse().join(''));

// ---------------------------------------------------------------------------
// 3. 遍历 Map：得到 [key, value]
// ---------------------------------------------------------------------------

console.log('\n--- 3. 遍历 Map ---');

const userRoles = new Map([
  ['alice', 'admin'],
  ['bob', 'editor'],
  ['carol', 'viewer'],
]);

// Map 默认的迭代器返回 [key, value]，配合数组解构非常自然
for (const [name, role] of userRoles) {
  console.log(`  ${name} 的角色是 ${role}`);
}

// 只遍历键 / 只遍历值
for (const name of userRoles.keys()) {
  console.log(`  keys() => ${name}`);
}
for (const role of userRoles.values()) {
  console.log(`  values() => ${role}`);
}

// Map 的遍历顺序就是插入顺序，这是它相对普通对象的优势之一
const insertionOrder = [];
for (const [k] of userRoles) insertionOrder.push(k);
console.log('  插入顺序被保留：', insertionOrder.join(' -> '));

// 遍历时修改 Map 是安全的（Map 的迭代器有明确的"已访问"语义）
const mutableMap = new Map([['a', 1], ['b', 2]]);
for (const [k, v] of mutableMap) {
  if (k === 'a') mutableMap.set('c', 3); // 新增的 'c' 也会被遍历到
  console.log(`  遍历中：${k} = ${v}`);
}
console.log('  遍历结束后 Map 大小 =', mutableMap.size); // 3

// ---------------------------------------------------------------------------
// 4. 遍历 Set：得到成员
// ---------------------------------------------------------------------------

console.log('\n--- 4. 遍历 Set ---');

const tags = new Set(['js', 'node', 'js', 'esm']); // 重复的 'js' 自动去重
console.log('  Set 大小 =', tags.size); // 3
for (const tag of tags) {
  console.log('  标签：' + tag);
}

// 实战：用 Set + for...of 求两个数组的交集与差集
const listA = [1, 2, 3, 4];
const listB = [3, 4, 5, 6];
const setB = new Set(listB);

const intersection = [];
const difference = [];
for (const item of listA) {
  if (setB.has(item)) {
    intersection.push(item); // 两边都有 => 交集
  } else {
    difference.push(item); // 只在 A 里 => 差集
  }
}
console.log('  交集 =', intersection); // [3,4]
console.log('  A 相对 B 的差集 =', difference); // [1,2]

// ---------------------------------------------------------------------------
// 5. 遍历生成器与其它可迭代对象
// ---------------------------------------------------------------------------

console.log('\n--- 5. 生成器与其它可迭代对象 ---');

// 生成器函数返回的就是可迭代对象，天然适合 for...of
function* fibonacci(limit) {
  let [prev, curr] = [0, 1];
  for (let i = 0; i < limit; i++) {
    yield curr; // 每次迭代"产出"一个值
    [prev, curr] = [curr, prev + curr];
  }
}
const fibs = [];
for (const n of fibonacci(8)) {
  fibs.push(n);
}
console.log('  前 8 个斐波那契数 =', fibs.join(', '));

// 生成器也是惰性的：可以表达"无限序列"，由使用方决定取多少
function* naturals() {
  let n = 1;
  while (true) {
    yield n++; // 无限产出（但因为没有真的循环到底，不会卡住）
  }
}
const firstFive = [];
for (const n of naturals()) {
  firstFive.push(n);
  if (n >= 5) break; // 使用方用 break 决定何时停止，这就是惰性求值的价值
}
console.log('  自然数序列的前 5 个 =', firstFive.join(', '));

// 自定义可迭代对象：只要实现 [Symbol.iterator] 就能被 for...of 使用
const range = {
  from: 1,
  to: 5,
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    // 返回一个"迭代器"：必须有 next() 方法，返回 { value, done }
    return {
      next() {
        if (current <= last) {
          return { value: current++, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  },
};
const rangeValues = [];
for (const v of range) {
  rangeValues.push(v);
}
console.log('  自定义可迭代对象的遍历结果 =', rangeValues); // [1,2,3,4,5]
// 正因为实现了迭代协议，它也能被展开运算符使用
console.log('  同样支持展开运算符：[...range] =', [...range]);

// 类数组对象：arguments
function sumArguments() {
  let total = 0;
  for (const v of arguments) {
    total += v;
  }
  return total;
}
console.log('  arguments 也可被 for...of 遍历：sumArguments(1,2,3) =', sumArguments(1, 2, 3));

// ---------------------------------------------------------------------------
// 6. 遍历对象：for...of 的正确姿势
// ---------------------------------------------------------------------------

console.log('\n--- 6. 遍历普通对象 ---');

const config = { host: 'localhost', port: 3000, debug: false };

// 错误示范：对象不是可迭代的，直接 for...of 会抛错
try {
  // eslint-disable-next-line no-unused-vars
  for (const v of config) {
    console.log(v);
  }
} catch (err) {
  console.log('  for...of 直接遍历对象抛出：', err.constructor.name, '-', err.message);
}

// 正确姿势一：Object.entries（同时拿到键值，最常用）
for (const [key, value] of Object.entries(config)) {
  console.log(`  entries: ${key} = ${JSON.stringify(value)}`);
}

// 正确姿势二：Object.keys（只要键）
for (const key of Object.keys(config)) {
  console.log(`  keys: ${key}`);
}

// 正确姿势三：Object.values（只要值）
for (const value of Object.values(config)) {
  console.log(`  values: ${JSON.stringify(value)}`);
}

// ---------------------------------------------------------------------------
// 7. 陷阱：改"值"与改"属性"的区别
// ---------------------------------------------------------------------------

console.log('\n--- 7. 陷阱：改值 vs 改属性 ---');

// 原始值：for...of 拿到的是值的拷贝，改它不会影响原数组
const numbers = [1, 2, 3];
for (const n of numbers) {
  // 这里改 n 只是改了这个局部变量
  const doubled = n * 2; // 正确做法：把结果写进新数组
  void doubled;
}
console.log('  遍历原始值时原数组不变：', numbers); // [1,2,3]

// 想修改原数组，请用传统 for + 下标
for (let i = 0; i < numbers.length; i++) {
  numbers[i] = numbers[i] * 2;
}
console.log('  用下标 for 修改后：', numbers); // [2,4,6]

// 对象元素：for...of 拿到的是对象的引用，改属性会影响原数组
const users = [
  { name: 'alice', active: false },
  { name: 'bob', active: false },
];
for (const user of users) {
  user.active = true; // 改的是同一个对象的属性，所以生效了
}
console.log('  遍历对象元素时改属性生效：', users);

// 但如果给 user 变量重新赋值一个"新对象"，数组里那一项不会变，
// 因为 for...of 的 const user 只是数组元素值的一份拷贝（对对象而言是引用的拷贝）。
// 想替换整个元素，必须用下标赋值。
for (let i = 0; i < users.length; i++) {
  if (users[i].name === 'bob') {
    users[i] = { name: 'bob', active: true, vip: true }; // 用下标替换整项才会生效
  }
}
console.log('  用下标替换整项才生效：', users);

// 陷阱：边遍历边 push 会导致循环停不下来。这里用安全计数器演示并在必要时强制退出
const growing = [1];
let iterations = 0;
const SAFE_LIMIT = 5;
for (const item of growing) {
  iterations++;
  if (item < 5) {
    growing.push(item + 1); // 数组在变长，数组迭代器会"看到"新加入的元素
  }
  if (iterations >= SAFE_LIMIT) {
    console.log(`  检测到边遍历边增长可能导致无限循环，已在 ${iterations} 次迭代后强制退出`);
    break; // 必须跳出，否则数组会一直变长，循环永远不结束
  }
}
console.log('  最终数组 =', growing, '，迭代次数 =', iterations);

// 想安全地"边遍历边收集"，请遍历原始数组的快照
const source = [1, 2, 3];
const output = [];
for (const item of [...source]) {
  // 用展开复制一份快照，遍历的是快照，修改源数组不会影响循环
  output.push(item * 10);
}
console.log('  用快照遍历的结果 =', output);

console.log('\n全部演示结束。');
