/**
 * ============================================================================
 * 知识点：for...in —— 遍历可枚举属性键，以及为什么不该用它遍历数组
 * ============================================================================
 *
 * 【所属分类】05_control_flow —— 流程控制
 * 【难度等级】进阶
 * 【前置知识】05_control_flow/05_for_of.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    for...in 遍历的是对象的**可枚举属性名（键）**，语法为：
 *      for (const key in 对象) { ... }
 *    注意它给出的是"键"（字符串），不是"值"，也不是"下标数字"。
 *    它沿**原型链**向上查找，凡是 `enumerable: true` 的属性都会被遍历到。
 *
 * 2. 为什么需要
 *    for...in 在 ES6 之前是遍历对象属性的唯一方式，老代码里大量存在。
 *    今天它的合理用途主要是：
 *      - 需要访问"原型链上的可枚举属性"（几乎只有调试 / 元编程场景）
 *      - 遍历"稀疏数组"时只访问真正存在元素的索引
 *      - 处理一些"意外的键"（如从 JSON 解析出来的动态字段）
 *    遍历普通对象的自家属性，**推荐用 Object.keys / values / entries + for...of**。
 *
 * 3. 核心语法要点
 *    【遍历范围】
 *      - 自有可枚举属性（字符串键）会遍历；
 *      - Symbol 类型的键**不会**被遍历（这是 for...in 与 Reflect.ownKeys 的区别）；
 *      - 原型链上的可枚举属性**会**被遍历，这是最大的坑；
 *      - 不可枚举的属性（如 Object.defineProperty 设为 enumerable: false）不会被遍历。
 *    【顺序】
 *      自身"整数键"按升序先遍历，然后"字符串键"按添加顺序，最后按添加顺序排列 Symbol
 *      （Symbol 不参与 for...in）。不要依赖这个顺序写业务逻辑。
 *    【过滤原型链】
 *      用 Object.prototype.hasOwnProperty.call(obj, key)
 *      或 Object.hasOwn(obj, key)（ES2022，更简洁）来跳过继承来的属性。
 *    【为什么不该遍历数组】
 *      ① 给出的是字符串 '0'、'1'，不是数字，做算术要先转换；
 *      ② 如果数组被扩展了自定义属性，那些属性也会被遍历到；
 *      ③ 如果有人给 Array.prototype 加了可枚举方法（老库常见），会全部污染进来；
 *      ④ 顺序不保证是数字顺序，稀疏数组的"空洞"会被跳过。
 *      遍历数组请用 for...of、forEach 或传统 for。
 *
 * 4. 常见陷阱
 *    - 忘记过滤原型链，导致遍历出 toString 之类的意外属性（当对象是被扩展过的库对象时）。
 *    - 用 for...in 遍历数组并在循环里做 i + 1 之类的算术，'0' + 1 会得到字符串 '01'。
 *    - 在 for...in 循环里删除属性，行为不可预测（虽然规范允许）。
 *    - Object.create(null) 创建的无原型对象不受原型链影响，但也没有 hasOwnProperty 方法。
 *    - JSON.parse 出来的对象也是普通对象，同样有原型链；但现代引擎里 JSON 对象没有多余可枚举属性，
 *      所以常被误以为"for...in 很安全"，遇到真实业务对象时就翻车。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 05_control_flow/06_for_in.js
 *
 * 【预期输出】
 *   依次打印基本遍历、遍历顺序、原型链污染演示、
 *   不该用 for...in 遍历数组的四个理由（含安全演示），
 *   以及推荐的替代写法（Object.keys / entries / Object.hasOwn）。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本用法：遍历的是"键"
// ---------------------------------------------------------------------------

console.log('--- 1. 基本用法 ---');

const user = {
  name: '小明',
  age: 28,
  city: '杭州',
};

// key 是字符串形式的属性名，取值要用 obj[key]
for (const key in user) {
  console.log(`  ${key} => ${user[key]}`);
}

// 强调：拿到的是字符串键，不是值
for (const key in user) {
  console.log(`  key = ${JSON.stringify(key)}，typeof key = ${typeof key}`);
}

// ---------------------------------------------------------------------------
// 2. 遍历顺序
// ---------------------------------------------------------------------------

console.log('\n--- 2. 遍历顺序 ---');

// 整数键（可作为数组下标的字符串）会被优先按"升序"排列，然后才是其它字符串键按插入顺序
const ordered = {};
ordered.zebra = 1; // 字符串键
ordered.apple = 2; // 字符串键
ordered['10'] = 3; // 整数键
ordered['2'] = 4; // 整数键
ordered.banana = 5; // 字符串键

const order = [];
for (const key in ordered) {
  order.push(key);
}
console.log('  遍历顺序 =', order);
console.log('  => 整数键 2、10 先按数值升序，再按插入顺序输出其它字符串键');
console.log('  => 业务代码不要依赖这个顺序，需要顺序就自己排序');

// 想要确定顺序，先取出键再自行排序
console.log('  手动排序后 =', Object.keys(ordered).sort());

// ---------------------------------------------------------------------------
// 3. 核心陷阱：原型链上的属性也会被遍历
// ---------------------------------------------------------------------------

console.log('\n--- 3. 陷阱：原型链污染 ---');

// 定义一个"基类"对象，带一个可枚举属性
const baseShape = { type: 'shape' }; // 这是可枚举的
const circle = Object.create(baseShape); // circle 的原型是 baseShape
circle.radius = 10;
circle.color = 'red';

console.log('  circle 的自有属性：', Object.keys(circle)); // ['radius','color']
console.log('  for...in 遍历 circle 会看到：');
for (const key in circle) {
  // 'type' 来自原型链，也被遍历到了！
  console.log(`    ${key} = ${JSON.stringify(circle[key])}`);
}

// 正确做法一：用 Object.hasOwn 过滤（ES2022，推荐）
console.log('  用 Object.hasOwn 过滤后：');
for (const key in circle) {
  if (Object.hasOwn(circle, key)) {
    console.log(`    ${key} = ${JSON.stringify(circle[key])}`);
  }
}

// 正确做法二：用 hasOwnProperty.call（兼容老环境）
console.log('  用 hasOwnProperty.call 过滤后：');
for (const key in circle) {
  if (Object.prototype.hasOwnProperty.call(circle, key)) {
    console.log(`    ${key} = ${JSON.stringify(circle[key])}`);
  }
}

// 更推荐：直接用 Object.entries + for...of，天然只遍历自有可枚举属性
console.log('  用 Object.entries + for...of（推荐）：');
for (const [key, value] of Object.entries(circle)) {
  console.log(`    ${key} = ${JSON.stringify(value)}`);
}

// 演示"给 Object.prototype 加属性"的灾难性后果（模拟老库的行为）
// 这里在一个隔离的沙箱函数里做，做完立刻删除，避免污染本文件后续代码。
function prototypePollutionDemo() {
  const probe = { a: 1 };
  // 在原型上加一个可枚举属性
  Object.prototype.__polluted__ = 'i am from prototype';
  const seen = [];
  for (const key in probe) {
    seen.push(key);
  }
  delete Object.prototype.__polluted__; // 立刻清理，否则影响全局
  return seen;
}
console.log('  给 Object.prototype 加可枚举属性后，for...in 看到 =', prototypePollutionDemo());
console.log('  => 哪怕对象只有一个属性 a，也会多出一个继承来的键');
console.log('  => 这就是"for...in 必须用 hasOwn 过滤"的根本原因');

// ---------------------------------------------------------------------------
// 4. 为什么不该用 for...in 遍历数组
// ---------------------------------------------------------------------------

console.log('\n--- 4. 为什么不该用 for...in 遍历数组 ---');

const arr = ['a', 'b', 'c'];

// 理由一：拿到的是字符串下标，做算术会变成字符串拼接
console.log('  理由一：键是字符串，不是数字');
for (const idx in arr) {
  console.log(`    typeof idx = ${typeof idx}，idx = ${JSON.stringify(idx)}`);
}
for (const idx in arr) {
  // idx 是 '0'、'1'，直接 +1 会得到 '01' 而不是 1
  console.log(`    idx + 1 = ${JSON.stringify(idx + 1)}  ← 字符串拼接，不是数值加法`);
  break; // 只演示一轮
}

// 理由二：数组上的自定义属性也会被遍历到
const arrWithProp = ['x', 'y'];
arrWithProp.customFlag = 'I am not an element';
arrWithProp.metadata = { note: 'me too' };
const inKeys = [];
for (const key in arrWithProp) {
  inKeys.push(key);
}
console.log('  理由二：自定义属性也被遍历到 =', inKeys); // ['0','1','customFlag','metadata']
console.log('  for...in 会把它们当成"元素"处理，length 却只有', arrWithProp.length);

// 对比：for...of 只看真正的元素
const ofValues = [];
for (const v of arrWithProp) {
  ofValues.push(v);
}
console.log('  for...of 只遍历真正的元素 =', ofValues); // ['x','y']

// 理由三：原型链上的属性污染
function arrayPrototypePollution() {
  const target = [10, 20];
  Array.prototype.__extra__ = 'polluted';
  const keys = [];
  for (const key in target) keys.push(key);
  delete Array.prototype.__extra__; // 清理
  return keys;
}
console.log('  理由三：Array.prototype 被污染后 =', arrayPrototypePollution());
console.log('  => 会多出一个 __extra__，而它根本不是数组元素');

// 理由四：稀疏数组的"空洞"被跳过，且顺序不一定是数值顺序
const sparse = [];
sparse[0] = 'first';
sparse[5] = 'sixth';
sparse[2] = 'third';
const sparseKeys = [];
for (const key in sparse) {
  sparseKeys.push(key);
}
console.log('  理由四：稀疏数组 for...in 得到 =', sparseKeys);
console.log('  （稀疏数组的 length =', sparse.length, '，但 for...in 只访问真实存在的索引）');
console.log('  => 与 for 循环按 0..length-1 逐个访问的语义不同，容易出 bug');

// 结论对照：正确的数组遍历方式
console.log('\n  数组遍历的推荐写法：');
console.log('    用 for...of      => ', arr.map((v) => v.toUpperCase()).join(','));
const viaForEach = [];
arr.forEach((v, i) => viaForEach.push(`${i}:${v}`));
console.log('    用 forEach       => ', viaForEach.join(' | '));
const viaFor = [];
for (let i = 0; i < arr.length; i++) viaFor.push(arr[i]);
console.log('    用传统 for + 下标 => ', viaFor.join(', '));

// ---------------------------------------------------------------------------
// 5. for...in 的合理用途
// ---------------------------------------------------------------------------

console.log('\n--- 5. for...in 的合理用途 ---');

// 用途一：遍历稀疏数组的"真实索引"，跳过空洞
const sparseData = [];
sparseData[1000] = 'rare';
sparseData[2000] = 'rare2';
let visitedCount = 0;
const visitedIndexes = [];
// 用 for 会白跑 2001 次，for...in 只跑 2 次
for (const idx in sparseData) {
  visitedCount++;
  visitedIndexes.push(Number(idx));
}
console.log(`  稀疏数组用 for...in 只访问了 ${visitedCount} 个元素，索引 =`, visitedIndexes);
let forLoopCount = 0;
for (let i = 0; i < sparseData.length; i++) {
  forLoopCount++; // 传统 for 会遍历每一个（含空洞）
}
console.log(`  同样数据用传统 for 要跑 ${forLoopCount} 次`);

// 用途二：调试时查看对象以及原型链上的全部可枚举属性
function describeAllEnumerable(obj) {
  const collected = [];
  for (const key in obj) {
    const origin = Object.hasOwn(obj, key) ? '自有' : '继承';
    collected.push(`${key}(${origin})`);
  }
  return collected;
}
console.log('  调试用：枚举 circle 的全部可枚举属性 =', describeAllEnumerable(circle));

// 用途三：把"动态键"的对象转成 Map 或做批量处理（配合过滤更安全）
function toSafeMap(obj) {
  const map = new Map();
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      map.set(key, obj[key]);
    }
  }
  return map;
}
console.log('  转成 Map =', toSafeMap(user));

// ---------------------------------------------------------------------------
// 6. 速查：三种遍历方式怎么选
// ---------------------------------------------------------------------------

console.log('\n--- 6. 选择速查 ---');

const guide = {
  数组: 'for...of（可取元素）或传统 for（需要下标 / 修改元素）',
  字符串: 'for...of（按码点，能正确处理 emoji）',
  Map: 'for...of（得到 [key, value]，可解构）',
  Set: 'for...of（得到成员）',
  普通对象: 'Object.entries + for...of（最推荐）',
  '对象（只想取键）': 'Object.keys + for...of',
  '对象（只想取值）': 'Object.values + for...of',
  '对象（需要继承属性）': 'for...in + hasOwn 过滤（很少需要）',
  '稀疏数组': 'for...in（只访问真实存在的索引）',
};
for (const [scenario, recommendation] of Object.entries(guide)) {
  console.log(`  ${scenario.padEnd(22)} => ${recommendation}`);
}

// 一个完整对比：同一个对象用四种方式遍历
const sample = { a: 1, b: 2 };
console.log('\n  四种遍历方式的输出对比：');

const results = {};
// (1) for...in
const r1 = [];
for (const k in sample) r1.push(`${k}=${sample[k]}`);
results['for...in'] = r1.join(',');

// (2) Object.keys + for...of
const r2 = [];
for (const k of Object.keys(sample)) r2.push(`${k}=${sample[k]}`);
results['Object.keys'] = r2.join(',');

// (3) Object.values
results['Object.values'] = Object.values(sample).join(',');

// (4) Object.entries
const r4 = [];
for (const [k, v] of Object.entries(sample)) r4.push(`${k}=${v}`);
results['Object.entries'] = r4.join(',');

for (const [method, output] of Object.entries(results)) {
  console.log(`    ${method.padEnd(16)} => ${output}`);
}

console.log('\n全部演示结束。');
