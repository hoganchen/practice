/**
 * ============================================================================
 * 知识点：Object.keys / values / entries / fromEntries —— 对象与数组互转
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】入门
 * 【前置知识】09_objects/04_spread_merge.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Object.keys / Object.values / Object.entries 是三个"把对象拆成数组"的静态方法，
 *    Object.fromEntries 则是反方向的"把数组装回对象"。四个方法合起来构成了
 *    对象与数组之间的完整双向通道。
 *      Object.keys(o)     -> ['k1', 'k2']
 *      Object.values(o)   -> [v1, v2]
 *      Object.entries(o)  -> [['k1', v1], ['k2', v2]]
 *      Object.fromEntries([['k1', v1]]) -> { k1: v1 }
 *
 * 2. 为什么需要
 *    对象本身"不可迭代"（不能直接 for...of，不能 .map），而数组有一整套强大的
 *    遍历 / 过滤 / 映射 / 归并方法。这组 API 的价值就在于：
 *    把对象转成数组 → 用数组方法处理 → 再转回对象。
 *
 * 3. 核心语法要点
 *    (1) 三个方法都只处理"自有 + 可枚举 + 字符串键"的属性；
 *        Symbol 键不会出现，继承属性不会出现，不可枚举属性不会出现。
 *    (2) 顺序规则：先整数键（升序），再其它字符串键（插入顺序），最后 Symbol 键。
 *        详见 14_property_order.js。
 *    (3) Object.entries 返回的每一项都是 [key, value] 二元数组，天然可以解构。
 *    (4) Object.fromEntries 接收一个"可迭代对象"，每项是长度 2 的数组
 *        （实际上任何可迭代对象都行，包括 Map）。重复的键，后面的覆盖前面的。
 *    (5) 三者对应的"可枚举"语义可以通过 Object.getOwnPropertyDescriptors 观察。
 *
 * 4. 常见陷阱
 *    (1) 传入 null / undefined 会抛 TypeError（不是返回空数组）。
 *        对原始值（数字、字符串）传进去是可以的，会被装箱。
 *    (2) 数组传进去会得到下标键：Object.keys(['a','b']) -> ['0','1']。
 *    (3) Object.values 的顺序和 keys 一致，但不要依赖"插入顺序"去对齐业务语义，
 *        整数键会被提前。
 *    (4) fromEntries 会把键强制转成字符串或 Symbol，传数字键会变成字符串。
 *    (5) fromEntries 只做浅层转换，嵌套结构不会递归处理。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/05_keys_values_entries.js
 *
 * 【预期输出】
 *   分 6 个小节，演示三个"拆解"方法和一个"组装"方法的用法与配合技巧。
 * ============================================================================
 */

console.log('--- 1. Object.keys：拿到所有键 ---');

const user = { name: '张三', age: 20, city: '杭州' };

// 返回键组成的数组（字符串键，自有且可枚举）
console.log('Object.keys(user) =', JSON.stringify(Object.keys(user)));

// 有了数组就能用所有数组方法
console.log('键的个数 =', Object.keys(user).length);
console.log('键转大写 =', JSON.stringify(Object.keys(user).map((k) => k.toUpperCase())));
console.log('有没有 name 键 =', Object.keys(user).includes('name'));

// 常见用途：判断对象是否为空
const emptyObj = {};
console.log('空对象 keys 长度 =', Object.keys(emptyObj).length, '（长度为 0 说明没有自有可枚举属性）');

console.log('\n--- 2. Object.values：拿到所有值 ---');

const scores = { 语文: 88, 数学: 95, 英语: 79 };

console.log('Object.values(scores) =', JSON.stringify(Object.values(scores)));

// 求和 / 求平均 / 求最大值，直接复用数组方法
const values = Object.values(scores);
const sum = values.reduce((acc, n) => acc + n, 0);
console.log('总分 =', sum);
console.log('平均 =', (sum / values.length).toFixed(2));
console.log('最高 =', Math.max(...values));

console.log('\n--- 3. Object.entries：键值对数组 ---');

const product = { id: 101, title: '键盘', price: 299 };

// 每一项是 [key, value]，用 JSON 打印更清晰
console.log('Object.entries(product) =', JSON.stringify(Object.entries(product)));

// 因为每项都是二元数组，可以在 for...of 里直接解构，代码非常清爽
console.log('用 for...of 遍历：');
for (const [key, value] of Object.entries(product)) {
  console.log(`   ${key} => ${value}`);
}

// 也可以用数组方法加工
const pairs = Object.entries(product);
console.log('只保留值 >= 200 的项 =', JSON.stringify(pairs.filter(([, v]) => typeof v === 'number' && v >= 200)));

// 典型的"把对象拼成查询字符串"场景
const params = { q: 'javascript', page: 1, size: 10 };
const queryString = Object.entries(params)
  .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  .join('&');
console.log('查询字符串 =', queryString);

console.log('\n--- 4. Object.fromEntries：数组装回对象 ---');

// 接收一个可迭代对象，每项是长度 2 的数组 [键, 值]
const entries = [
  ['a', 1],
  ['b', 2],
  ['c', 3],
];
console.log('fromEntries =', JSON.stringify(Object.fromEntries(entries)));

// 与 Map 天然互通：Map 的每一项就是 [key, value]
const map = new Map([
  ['x', 10],
  ['y', 20],
]);
console.log('Map 转对象 =', JSON.stringify(Object.fromEntries(map)));

// 反过来，Object.entries 的结果可以直接喂给 new Map()
console.log('对象转 Map，再取回 =', Object.fromEntries(Object.entries(product)));

// 重复的键：后面的覆盖前面的
console.log(
  '重复键的覆盖 =',
  JSON.stringify(
    Object.fromEntries([
      ['k', '第一次'],
      ['k', '第二次'],
    ]),
  ),
);

// 键会被强制转成字符串
console.log('数字键 1 =', JSON.stringify(Object.fromEntries([[1, 'one']])));
const symKey = Symbol('sk');
const withSym = Object.fromEntries([[symKey, 'symbol 值']]);
console.log('Symbol 键保留 =', withSym[symKey], '，Object.keys =', JSON.stringify(Object.keys(withSym)));

console.log('\n--- 5. 组合技巧：过滤 / 映射 / 反转对象 ---');

const inventory = { 苹果: 3, 香蕉: 0, 橙子: 7, 西瓜: 1 };

// 技巧 A：过滤对象——只保留值为真的项
const inStock = Object.fromEntries(Object.entries(inventory).filter(([, n]) => n > 0));
console.log('过滤后（只留库存 > 0） =', JSON.stringify(inStock));

// 技巧 B：映射值——把数量加倍
const doubled = Object.fromEntries(Object.entries(inventory).map(([k, v]) => [k, v * 2]));
console.log('数量加倍 =', JSON.stringify(doubled));

// 技巧 C：反转键值（键值互换）
const reversed = Object.fromEntries(Object.entries(inventory).map(([k, v]) => [v, k]));
console.log('键值反转 =', JSON.stringify(reversed));

// 技巧 D：把"对象数组"按 id 建成"索引表"（前端最常见的数据规范化手法）
const list = [
  { id: 'u1', name: '张三' },
  { id: 'u2', name: '李四' },
];
const byId = Object.fromEntries(list.map((item) => [item.id, item]));
console.log('按 id 建索引 =', JSON.stringify(byId));
console.log('O(1) 查找 u2 =', byId.u2.name);

// 技巧 E：统计词频
const words = ['a', 'b', 'a', 'c', 'a', 'b'];
const freq = {};
for (const w of words) {
  // 用 ??= 保证初始化，再自增
  freq[w] ??= 0;
  freq[w] += 1;
}
console.log('词频统计 =', JSON.stringify(freq));
console.log('按次数降序 =', JSON.stringify(Object.fromEntries(Object.entries(freq).sort((a, b) => b[1] - a[1]))));

console.log('\n--- 6. 边界与陷阱 ---');

// (1) 传入 null / undefined 会抛错（不是返回空数组），这里用 try/catch 演示。
for (const bad of [null, undefined]) {
  try {
    Object.keys(bad);
  } catch (err) {
    console.log(`Object.keys(${String(bad)}) 报错：`, err.name, '-', err.message);
  }
}

// (2) 传入数组：得到的是下标字符串
console.log('Object.keys(数组) =', JSON.stringify(Object.keys(['a', 'b', 'c'])));
console.log('Object.values(数组) =', JSON.stringify(Object.values(['a', 'b', 'c'])));

// (3) 只能看到"可枚举自有"属性：继承的和不可枚举的都看不到
const proto = { inherited: 1 };
const objWithProto = Object.create(proto);
objWithProto.own = 2;
Object.defineProperty(objWithProto, 'notEnumerable', { value: 3, enumerable: false });
console.log('Object.keys(objWithProto) =', JSON.stringify(Object.keys(objWithProto)));
console.log('但 in 能看到原型上的 =', 'inherited' in objWithProto);
console.log('Object.hasOwn 看不到原型的 =', Object.hasOwn(objWithProto, 'inherited'));

// (4) 整数键会被提前排序（不能靠插入顺序）
const order = { b: 1, 2: 'two', a: 2, 1: 'one' };
console.log('原始书写顺序 b,2,a,1 → Object.keys =', JSON.stringify(Object.keys(order)));

console.log('\n全部演示完毕。');
