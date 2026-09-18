/**
 * ============================================================================
 * 知识点：filter 过滤 —— 真值过滤技巧与常见陷阱
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】08_arrays/08_map.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    arr.filter(callback) 对每个元素调用回调，把回调返回**真值（truthy）**的元素
 *    收集起来，组成一个**新数组**返回。回调签名 (element, index, array)。
 *
 *    与 map 的关键区别：
 *      map    —— 长度不变，元素被"变换"（原数组 3 个 -> 新数组也是 3 个）；
 *      filter —— 长度变短或不变，元素被"挑选"（原数组 3 个 -> 新数组 0~3 个）。
 *
 * 2. 为什么需要它
 *    真实数据里永远混着"不想要的"：未支付的订单、已删除的用户、停用的配置、
 *    空字符串、null 占位。filter 让"筛选条件"变成一个可读、可复用、可组合的纯函数。
 *    它和 map、reduce 一起构成数据处理的主干：**filter 决定要哪些，map 决定变成什么，
 *    reduce 决定合成什么**。
 *
 * 3. 核心语法要点
 *    (1) 判断依据是"真值性"，不是 === true：
 *        返回 1、'a'、{}、[] 都算通过；返回 0、''、null、undefined、NaN 都被丢弃。
 *    (2) **真值过滤技巧**：直接把函数当回调传，可以一行过滤掉所有假值：
 *          arr.filter(Boolean)
 *        —— 去掉 0、''、null、undefined、NaN、false，常用于清洗表单输入。
 *        注意它会**连数字 0 一起去掉**，如果 0 是有效数据，请用
 *          arr.filter(x => x !== null && x !== undefined)
 *    (3) filter 可以复用命名函数：arr.filter(isAdult)。
 *    (4) 返回的新数组元素与原数组元素是**同一引用**（浅拷贝），改新数组里的对象
 *        会影响到原数组（见第 5 节）。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**不修改原数组**（non-mutating）。它只读原数组，
 *      返回新数组。这一点与 push/splice/sort/reverse 这些 mutating 方法相反。
 *    - 元素是对象时，filter 只是"挑出引用"，不会复制对象。
 *    - filter(Boolean) 会误杀 0 和 ''，遇到"0 是合法值"的场景要小心。
 *    - filter 找不到任何匹配时返回 **空数组 []**，不是 undefined、不是 null。
 *      所以 `if (result.length === 0)` 才是"没找到"的判断方式。
 *    - filter 无法提前终止：想"找到第一个就停"请用 find。
 *    - filter 里写了花括号却忘记 return，会返回空数组（回调返回 undefined = 假值）。
 *    - 想"过滤 + 变换"同时做，写成 filter().map() 需要遍历两遍；
 *      数据量大时可以先 filter 再 map（通常更清晰），或用 reduce/flatMap 一次搞定。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/09_filter.js
 *
 * 【预期输出】
 *   依次演示基础过滤、条件函数复用、真值过滤技巧与它的坑、对象数组过滤、
 *   与 map/reduce 的链式配合，以及"过滤 + 去重"的常见组合。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基础过滤
// ---------------------------------------------------------------------------

console.log('--- 1. 基础过滤 ---');

const nums = [1, 2, 3, 4, 5, 6, 7, 8];
const evens = nums.filter((n) => n % 2 === 0);

console.log('原数组 =', JSON.stringify(nums));
console.log('偶数 =', JSON.stringify(evens));
console.log('长度：', nums.length, '->', evens.length, '（filter 会变短或不变）');
console.log('原数组未被修改 =', JSON.stringify(nums));

// 回调的三个参数
console.log('\n带下标的过滤（取偶数下标）:');
console.log(['a', 'b', 'c', 'd'].filter((_, i) => i % 2 === 0));

// 各种条件
console.log('\n大于 3 =', JSON.stringify(nums.filter((n) => n > 3)));
console.log('在 [2, 6] 之间 =', JSON.stringify(nums.filter((n) => n >= 2 && n <= 6)));
console.log('等于 4 =', JSON.stringify(nums.filter((n) => n === 4)));
console.log('都不满足 =', JSON.stringify(nums.filter((n) => n > 100)));
console.log('都不满足时返回的是 =', Object.prototype.toString.call(nums.filter((n) => n > 100)), '（空数组，不是 undefined）');

// ---------------------------------------------------------------------------
// 2. 判断依据是"真值性"，不是 === true
// ---------------------------------------------------------------------------

console.log('\n--- 2. 真值性判断 ---');

console.log('回调返回 1 通过   =', JSON.stringify([1, 2, 3].filter(() => 1)));
console.log("回调返回 'a' 通过 =", JSON.stringify([1, 2].filter(() => 'a')));
console.log('回调返回 [] 通过  =', JSON.stringify([1, 2].filter(() => []), '（空数组也是真值！）'));
console.log('回调返回 0 丢弃   =', JSON.stringify([1, 2].filter(() => 0)));
console.log('回调返回 "" 丢弃  =', JSON.stringify([1, 2].filter(() => '')));
console.log('回调返回 null 丢弃=', JSON.stringify([1, 2].filter(() => null)));

// 记住 JS 的 8 个假值
console.log('\nJS 的假值（falsy）只有 8 个：');
const falsyValues = [false, 0, -0, 0n, '', null, undefined, NaN];
for (const v of falsyValues) {
  console.log(`  ${String(v).padEnd(10)} -> Boolean(v) = ${Boolean(v)}`);
}
console.log('除此之外一切都是真值，包括 [] 和 {} 和 "0" 和 "false"。');

// ---------------------------------------------------------------------------
// 3. 真值过滤技巧：filter(Boolean)
// ---------------------------------------------------------------------------

console.log('\n--- 3. filter(Boolean) 技巧 ---');

// 因为 JSON.stringify 会把 undefined 变成 null、把 NaN 变成 null、把函数丢掉，
// 这里先写一个小工具，把这些"看不见"的值显式打印出来，便于观察。
function fmt(arr) {
  return (
    '[' +
    arr
      .map((v) => {
        if (v === undefined) return 'undefined';
        if (typeof v === 'number' && Number.isNaN(v)) return 'NaN';
        return JSON.stringify(v);
      })
      .join(', ') +
    ']'
  );
}

// Boolean 作为回调，正好接收 (element, index, array) 的第一个参数
const dirty = [0, 1, '', 'hello', null, undefined, NaN, false, [], {}, '0'];
console.log('原始数据 =', fmt(dirty));

const cleaned = dirty.filter(Boolean);
console.log('filter(Boolean) =', fmt(cleaned));
console.log('（被去掉的：0、空字符串、false、null、undefined、NaN）');
console.log('（被保留的：1、"hello"、[]、{}、"0" —— 空数组和空对象都是真值！）');
console.log('特别提醒：数字 0 也被去掉了！如果 0 是有效数据，这就是 bug。');

// 只想去掉 null 和 undefined 的安全版本
const safeCleaned = dirty.filter((v) => v !== null && v !== undefined);
console.log('\n只去掉 null/undefined =', fmt(safeCleaned));
console.log('（0、空字符串、NaN、false、[]、{} 都被保留了）');

// 实用场景一：清洗用户输入的多选标签
const rawTags = ['前端', '', '  ', 'Node', null, '数据库', undefined];
console.log('\n原始标签 =', fmt(rawTags));
console.log('去掉空项 =', JSON.stringify(rawTags.filter(Boolean)));
console.log('进一步去掉纯空白 =', JSON.stringify(rawTags.filter((t) => t && t.trim() !== '')));
console.log('再 trim =', JSON.stringify(rawTags.filter((t) => t && t.trim() !== '').map((t) => t.trim())));

// 实用场景二：把可能不存在的配置项过滤掉
const config = { a: 1, b: 0, c: null, d: 2 };
console.log('\n配置对象值过滤 =', JSON.stringify(Object.values(config).filter(Boolean)), '（b=0 也被过滤了）');
console.log('安全的过滤 =', JSON.stringify(Object.values(config).filter((v) => v != null)));

// 实用场景三：过滤出"有值的"参数再拼 URL
const params = { q: 'js', page: 0, size: null, sort: undefined, tag: 'array' };
const validEntries = Object.entries(params).filter(([, v]) => v != null);
console.log('\n有效参数 =', JSON.stringify(validEntries));
console.log('拼成查询串 =', validEntries.map(([k, v]) => `${k}=${v}`).join('&'));

// ---------------------------------------------------------------------------
// 4. 复用命名函数条件
// ---------------------------------------------------------------------------

console.log('\n--- 4. 复用条件函数 ---');

const ages = [12, 18, 25, 17, 30, 65];

const isAdult = (age) => age >= 18;
const isSenior = (age) => age >= 60;

console.log('年龄段 =', JSON.stringify(ages));
console.log('成年人 =', JSON.stringify(ages.filter(isAdult)));
console.log('老年人 =', JSON.stringify(ages.filter(isSenior)));
console.log('未成年人 =', JSON.stringify(ages.filter((a) => !isAdult(a))));

// 条件函数可以组合
const inRange = (min, max) => (n) => n >= min && n <= max;
console.log('18~30 之间 =', JSON.stringify(ages.filter(inRange(18, 30))));
console.log('（这种返回函数的写法叫"柯里化"，很适合做可配置的过滤器）');

// ---------------------------------------------------------------------------
// 5. 对象数组的过滤与浅拷贝陷阱
// ---------------------------------------------------------------------------

console.log('\n--- 5. 对象数组过滤 ---');

const users = [
  { id: 1, name: '张三', age: 17, active: true },
  { id: 2, name: '李四', age: 25, active: false },
  { id: 3, name: '王五', age: 30, active: true },
  { id: 4, name: '赵六', age: 16, active: true },
];
console.log('用户 =', JSON.stringify(users));

const activeAdults = users.filter((u) => u.active && u.age >= 18);
console.log('已激活的成年人 =', JSON.stringify(activeAdults));
console.log('原数组长度 =', users.length, '，过滤后长度 =', activeAdults.length);

// 陷阱：filter 只挑引用，元素是同一个对象
console.log('\n元素是同一引用吗？', activeAdults[0] === users[1], '（true）');
activeAdults[0].name = '（被改了）';
console.log('改过滤结果的元素后，原数组 =', JSON.stringify(users));
console.log('结论：filter 是浅拷贝，元素仍共享；要独立副本请配合 map 生成新对象。');

// 生成独立副本的正确写法
const independent = users.filter((u) => u.active).map((u) => ({ ...u }));
independent[0].name = '独立副本';
console.log('\n带 map 深一层拷贝后改副本，原数组 =', JSON.stringify(users), '（不受影响）');

// ---------------------------------------------------------------------------
// 6. 与 map / reduce 链式配合
// ---------------------------------------------------------------------------

console.log('\n--- 6. 与 map / reduce 配合 ---');

const orders = [
  { id: 'A1', amount: 120, status: 'paid', category: 'book' },
  { id: 'A2', amount: 80, status: 'unpaid', category: 'food' },
  { id: 'A3', amount: 300, status: 'paid', category: 'book' },
  { id: 'A4', amount: 50, status: 'paid', category: 'food' },
  { id: 'A5', amount: 999, status: 'refunded', category: 'book' },
];

// filter -> map -> reduce 三件套
const paidBookTotal = orders
  .filter((o) => o.status === 'paid') // 只要已支付
  .filter((o) => o.category === 'book') // 且是图书类
  .map((o) => o.amount) // 取出金额
  .reduce((sum, n) => sum + n, 0); // 求和

console.log('已支付图书类订单金额合计 =', paidBookTotal);

// 分解展示每一步
console.log('\n分步展示：');
console.log('  1) 全部订单 =', orders.length, '条');
console.log('  2) 已支付 =', JSON.stringify(orders.filter((o) => o.status === 'paid').map((o) => o.id)));
console.log('  3) 图书类 =', JSON.stringify(orders.filter((o) => o.category === 'book').map((o) => o.id)));
console.log('  4) 金额 =', JSON.stringify(orders.filter((o) => o.status === 'paid' && o.category === 'book').map((o) => o.amount)));
console.log('  5) 合计 =', paidBookTotal);

// 顺序很重要：先 filter 再 map，能少处理很多元素
console.log('\n性能提示：先 filter（缩小集合）再 map（变换），比先 map 再 filter 更省。');

// ---------------------------------------------------------------------------
// 7. 常见组合：过滤 + 去重
// ---------------------------------------------------------------------------

console.log('\n--- 7. 过滤 + 去重 ---');

const raw = ['a', 'b', 'a', '', 'c', 'b', null];
console.log('原始 =', JSON.stringify(raw));
console.log('去空 + 去重 =', JSON.stringify([...new Set(raw.filter(Boolean))]));

// 对象数组按字段去重
const dupUsers = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 1, name: '张三（重复）' },
];
console.log('\n重复用户 =', JSON.stringify(dupUsers));
const seenIds = new Set();
const uniqueUsers = dupUsers.filter((u) => {
  if (seenIds.has(u.id)) return false;
  seenIds.add(u.id);
  return true;
});
console.log('按 id 去重（保留第一条）=', JSON.stringify(uniqueUsers));

// ---------------------------------------------------------------------------
// 8. 常见错误写法
// ---------------------------------------------------------------------------

console.log('\n--- 8. 常见错误写法 ---');

// 错误 1：花括号里忘写 return
const wrong1 = [1, 2, 3, 4].filter((n) => {
  n > 2; // 没有 return，回调返回 undefined -> 全被丢弃
});
console.log('忘写 return =', JSON.stringify(wrong1), '（得到空数组）');
console.log('正确 =', JSON.stringify([1, 2, 3, 4].filter((n) => n > 2)));

// 错误 2：用 filter 返回"元素本身"，把 0 当真值问题
const wrong2 = [0, 1, 2].filter((n) => n); // 想"保留所有"，但 0 被丢了
console.log('\nfilter(n => n) =', JSON.stringify(wrong2), '（0 被误删；要保留全部就用原数组）');

// 错误 3：用 filter 找"第一个"，多做了无用功
const bigArray = Array.from({ length: 5 }, (_, i) => i + 1);
const viaFilter = bigArray.filter((n) => n > 2)[0];
const viaFind = bigArray.find((n) => n > 2);
console.log('\nfilter(...)[0] =', viaFilter, '  vs  find(...) =', viaFind, '（结果相同，find 更高效也更语义化）');

// ---------------------------------------------------------------------------
// 9. 实战：多条件筛选器
// ---------------------------------------------------------------------------

console.log('\n--- 9. 实战：多条件筛选 ---');

const products = [
  { name: '键盘', price: 199, stock: 12, tags: ['数码'] },
  { name: '鼠标', price: 89, stock: 0, tags: ['数码'] },
  { name: '笔记本', price: 5999, stock: 3, tags: ['数码', '办公'] },
  { name: '台灯', price: 129, stock: 8, tags: ['家居'] },
  { name: '水杯', price: 39, stock: 0, tags: ['家居'] },
];

// 把筛选条件写成"条件数组"，全部满足才通过（AND 逻辑）
function applyFilters(list, conditions) {
  return conditions.reduce((acc, cond) => acc.filter(cond), list);
}

const conditions = [
  (p) => p.stock > 0, // 有货
  (p) => p.price >= 50 && p.price <= 1000, // 价格区间
];
const filtered = applyFilters(products, conditions);
console.log('有货且价格 50~1000 =', JSON.stringify(filtered));

// OR 逻辑：用 some
const orFiltered = products.filter((p) => p.price < 100 || p.stock === 0);
console.log('价格 <100 或 无货 =', JSON.stringify(orFiltered.map((p) => p.name)));

// 按标签筛选（数组字段）
const homeItems = products.filter((p) => p.tags.includes('家居'));
console.log('家居类 =', JSON.stringify(homeItems.map((p) => p.name)));

// ---------------------------------------------------------------------------
// 10. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 10. 小结 ---');
console.log('filter：挑出满足条件的元素，返回**新数组**，**不修改原数组**。');
console.log('长度：0 <= 新长度 <= 原长度。');
console.log('真值过滤：arr.filter(Boolean) 很爽，但要记得它会连 0 一起去掉。');
console.log('拿第一个匹配请用 find，判断"有没有"请用 some，别用 filter 再取 [0]。');
