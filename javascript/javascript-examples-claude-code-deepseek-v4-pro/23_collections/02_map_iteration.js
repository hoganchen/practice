/**
 * ============================================================================
 * 知识点：Map 的遍历 —— keys / values / entries 与数组互转
 * ============================================================================
 *
 * 【所属分类】23_collections —— 集合类型
 * 【难度等级】入门
 * 【前置知识】23_collections/01_map_basics.js、08_arrays 的迭代器基础
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Map 是**可迭代对象**（实现了 Symbol.iterator），因此可以直接用于
 *    for...of、展开运算符 ...、解构、Array.from。
 *    它提供三个遍历入口，都返回**迭代器**（不是数组）：
 *      map.keys()    -> 所有键
 *      map.values()  -> 所有值
 *      map.entries() -> 所有 [键, 值] 对
 *    而 map[Symbol.iterator] === map.entries，所以 for...of map 等价于
 *    for...of map.entries()，每次拿到一个 [key, value] 数组。
 *
 * 2. 为什么需要
 *    遍历是所有集合操作的基础：求和、过滤、转换、构建新结构。
 *    理解"迭代器 vs 数组"的差别，能避免大量 API 误用。
 *
 * 3. 核心语法要点
 *    (1) for (const [key, value] of map) { ... }  最常用，直接解构。
 *    (2) map.forEach((value, key, map) => {}) —— **注意参数顺序是 value 在前**，
 *        这与数组的 forEach((item, index, arr)) 习惯相反，是经典易错点。
 *    (3) 遍历顺序 = 插入顺序。先插入的先遍历；已存在的键被 set 覆盖时
 *        **保持原位置**，不会挪到末尾（与"重新插入"不同）。
 *    (4) 迭代器是"一次性"的：遍历完就耗尽了，要再遍历需重新调用 entries()。
 *    (5) 迭代器不是数组：没有 map/filter/reduce。要用数组方法就先
 *        [...map.entries()] 或 Array.from(map) 转成数组。
 *    (6) 与数组互转：
 *          Map -> 数组：  [...map]  或  Array.from(map)
 *          数组 -> Map：  new Map(pairs)
 *    (7) 遍历时增删键：Map 的迭代器是"活"的 —— 可以安全删除项；
 *        **新增的键会被本次遍历继续访问到**（若它排在当前位置之后）；
 *        删除尚未访问的键则它不会再出现。反复 set 已存在的键不会导致死循环。
 *
 * 4. 常见陷阱
 *    (1) map.forEach 回调写成 (key, value) —— 参数顺序反了。
 *    (2) 把 map.keys() 当数组用：它没有 .map / .length，但有 .size 吗？也没有（那是 Map 的属性）。
 *    (3) 对同一个迭代器遍历两次：第二次什么也拿不到。
 *    (4) 以为 map.entries() 返回新数组，反复调用产生大量无用对象（其实开销很小，但要注意概念）。
 *    (5) 用 JSON.stringify(map) 期望序列化内容 —— 得到 {}，要先转数组。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 23_collections/02_map_iteration.js
 *
 * 【预期输出】
 *   分 7 个小节，演示三种遍历入口、for...of 解构、forEach 的参数顺序、
 *   插入顺序的稳定性、迭代器的一次性、与数组互转，以及遍历中修改的行为。
 * ============================================================================
 */

const scores = new Map([
  ['张三', 92],
  ['李四', 78],
  ['王五', 85],
]);

console.log('--- 1. 三种遍历入口 ---');

console.log('map.keys()    ->', [...scores.keys()]);
console.log('map.values()  ->', [...scores.values()]);
console.log('map.entries() ->', JSON.stringify([...scores.entries()]));
console.log('map 本身迭代出的内容与 entries 一致：', JSON.stringify([...scores]) === JSON.stringify([...scores.entries()]));
console.log('验证：scores[Symbol.iterator] === scores.entries ->', scores[Symbol.iterator] === scores.entries);

console.log('\n--- 2. for...of + 解构：最推荐的写法 ---');

for (const [name, score] of scores) {
  console.log(`  ${name} 考了 ${score} 分`);
}

// 只要键或只要值时，可以只解构一个（另一个丢弃）。
console.log('\n只要键：');
for (const [name] of scores) console.log('  键 =', name);
console.log('只要值（解构时用逗号占位）：');
for (const [, score] of scores) console.log('  值 =', score);

console.log('\n--- 3. forEach：注意参数顺序是 (value, key, map) ---');

// 这是 Map 最容易踩的坑：与数组 forEach 的直觉相反，值是第一个参数。
scores.forEach((value, key, map) => {
  console.log(`  value=${value}  key=${key}  map.size=${map.size}`);
});

// 对照演示：如果按数组习惯写成 (key, value)，就会得到错位的输出。
console.log('\n❌ 按数组习惯写的后果：');
scores.forEach((key, value) => {
  console.log(`  误以为 key=${key}，实际它是值；误以为 value=${value}，实际它是键`);
});

console.log('\n--- 4. 遍历顺序 = 插入顺序，且覆盖不改变位置 ---');

const ordered = new Map();
ordered.set('第一', 1);
ordered.set('第二', 2);
ordered.set('第三', 3);
console.log('插入顺序   ->', [...ordered.keys()].join(' -> '));

// 覆盖已存在的键：值更新，但位置不变。
ordered.set('第一', 100);
console.log('覆盖"第一"后 ->', [...ordered.keys()].join(' -> '), '（位置没变）');
console.log('值已更新     ->', ordered.get('第一'));

// 删除后重新插入：会排到末尾。
ordered.delete('第二');
ordered.set('第二', 200);
console.log('删除后重插"第二" ->', [...ordered.keys()].join(' -> '), '（排到了末尾）');

// 数字键也是按插入顺序，而不是像普通对象那样"整数键自动排前"。
const numberKeys = new Map([[3, 'c'], [1, 'a'], [2, 'b']]);
console.log('数字键的遍历顺序 ->', [...numberKeys.keys()].join(' , '), '（普通对象会输出 1,2,3）');
console.log('对照普通对象 ->', Object.keys({ 3: 'c', 1: 'a', 2: 'b' }).join(' , '), '（整数键被自动排序）');

console.log('\n--- 5. 迭代器是一次性的 ---');

const it = scores.keys();
console.log('第一次 [...it] =', [...it]);
console.log('第二次 [...it] =', [...it], '（空了，迭代器已耗尽）');
console.log('重新调用 keys() 才拿到新的迭代器 =', [...scores.keys()]);
// 迭代器手动推进（了解即可，日常用 for...of）。
const manual = scores.entries();
console.log('手动 next() 三次：');
console.log('  ', JSON.stringify(manual.next()));
console.log('  ', JSON.stringify(manual.next()));
console.log('  ', JSON.stringify(manual.next()));
console.log('  ', JSON.stringify(manual.next()), '（done: true 表示结束）');

console.log('\n--- 6. 迭代器不是数组，要先转换 ---');

console.log('typeof scores.keys() =', typeof scores.keys(), '（object，是迭代器）');
console.log('Array.isArray(scores.keys()) =', Array.isArray(scores.keys()), '（不是数组，没有 length 下标访问）');
console.log("scores.keys()[0] =", scores.keys()[0], '（undefined，迭代器不能按下标取值）');

// 注意版本差异：ES2025 的"Iterator Helpers"给迭代器原型加上了 map/filter/take 等方法。
// Node 22+ 已经支持，此时能直接链式调用；旧环境则会抛 TypeError。
const iterHasMap = typeof scores.keys().map === 'function';
console.log('当前环境是否支持 Iterator Helpers（Iterator.prototype.map）：', iterHasMap);
if (iterHasMap) {
  // 支持时可以直接链式调用，但返回的仍是**迭代器**（惰性求值），不是数组。
  const iterResult = scores.keys().map((k) => k + '同学');
  console.log('  ✅ 迭代器链式调用（惰性）-> 需要展开才拿到值：', [...iterResult]);
  console.log('  注意：Iterator Helpers 是 ES2025 特性，旧环境不支持，写库时要谨慎使用。');
} else {
  try {
    scores.keys().map((k) => k);
  } catch (err) {
    console.log('  ❌ 旧环境对迭代器调用数组方法抛错 ->', err.constructor.name + ':', err.message);
  }
}
console.log('✅ 最通用的做法：先转数组再处理：', [...scores.keys()].map((k) => k + '同学').join('、'));
console.log('✅ Array.from 也可以：', Array.from(scores.values()).reduce((a, b) => a + b, 0), '（总分）');

console.log('\n--- 7. Map 与数组互转的实战 ---');

// Map -> 数组（元素是 [k, v] 数组）
const asArray = [...scores];
console.log('Map -> 数组 =', JSON.stringify(asArray));
// 数组 -> Map
const backToMap = new Map(asArray);
console.log('数组 -> Map 的 size =', backToMap.size, '，内容一致：', JSON.stringify([...backToMap]) === JSON.stringify(asArray));
// Map -> 数组 -> 过滤 -> Map（链式处理）
const passed = new Map([...scores].filter(([, score]) => score >= 80));
console.log('过滤出 >= 80 分的人 =', JSON.stringify([...passed]));
// 用 map 转换值（注意：Map 没有 map 方法，要借道数组）
const boosted = new Map([...scores].map(([name, score]) => [name, Math.min(100, score + 5)]));
console.log('每人加 5 分后 =', JSON.stringify([...boosted]));
// 排序：Map 本身没有 sort，先转数组排序再转回来。
const sortedByScore = new Map([...scores].sort((a, b) => b[1] - a[1]));
console.log('按分数从高到低 =', JSON.stringify([...sortedByScore]));
// 键值互换
const swapped = new Map([...scores].map(([name, score]) => [score, name]));
console.log('键值互换 =', JSON.stringify([...swapped]));

console.log('\n--- 8. 遍历过程中修改 Map 的规则 ---');

const modifiable = new Map([['a', 1], ['b', 2], ['c', 3]]);
const seen = [];
for (const [key] of modifiable) {
  seen.push(key);
  // 规则 1：删除当前项是安全的，不会打乱迭代。
  if (key === 'b') modifiable.delete('b');
  // 规则 2：新增的键会被本次遍历继续访问到（Map 迭代器是"活"的）。
  if (key === 'a') modifiable.set('d', 4);
}
console.log('遍历中看到过的键 =', seen.join(' , '), '（注意 d 也被访问到了）');
console.log('遍历结束后 Map 的内容 =', JSON.stringify([...modifiable]));

// 规则 3：删除**尚未访问**的键，它就不会再被访问。
const removable = new Map([['a', 1], ['b', 2], ['c', 3]]);
const seen2 = [];
for (const [key] of removable) {
  seen2.push(key);
  if (key === 'a') removable.delete('c'); // c 还没被访问到
}
console.log('提前删掉 c 后访问到的键 =', seen2.join(' , '));

// 规则 4：反复 set 同一个已存在的键不会造成无限循环（只更新值，不新增位置）。
const stable = new Map([['x', 0]]);
let loops = 0;
for (const [key, value] of stable) {
  loops++;
  if (value < 3) stable.set(key, value + 1);
}
console.log('对已存在的键反复 set，循环次数 =', loops, '，最终值 =', stable.get('x'), '（不会死循环）');
console.log('结论：可以安全删除；新增的键会被本次遍历访问；删除未访问的键则不再出现。');
console.log('\n本节结束。');
