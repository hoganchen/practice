/**
 * ============================================================================
 * 知识点：some / every 逻辑判断 —— 空数组返回值陷阱与短路特性
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】08_arrays/13_reverse_and_fill.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    - arr.some(fn)：只要**有一个**元素让 fn 返回真值，就返回 true；
 *      全部不满足则返回 false。语义上等价于"存在量词 ∃"。
 *    - arr.every(fn)：必须**所有**元素都让 fn 返回真值，才返回 true；
 *      只要有一个不满足就返回 false。语义上等价于"全称量词 ∀"。
 *
 *    回调签名同样为 (element, index, array)，判断依据是**真值性**（不是 === true）。
 *
 * 2. 为什么需要它
 *    很多业务逻辑看着像"循环 + 布尔标志"：
 *        let blocked = false;
 *        for (const u of users) { if (u.banned) { blocked = true; break; } }
 *    some/every 把这类逻辑变成一句声明，既短又不容易写错，还自带**短路**：
 *    一旦结果确定就立即停止遍历，不会白跑剩下的元素。
 *
 * 3. 核心语法要点
 *    (1) 短路（short-circuit）：
 *        - some 遇到第一个真值立刻返回 true，后面的元素不再访问；
 *        - every 遇到第一个假值立刻返回 false，后面的元素不再访问。
 *        这与 forEach 形成鲜明对比 —— some/every 是**能提前终止**的遍历方法。
 *    (2) 空数组的返回值（重点，容易记反）：
 *        - [].some(fn)  === false   （一个满足的都没有）
 *        - [].every(fn) === true    （"所有元素都满足"是**空真**，vacuously true）
 *        every 对空数组返回 true 是数学上的约定，但在业务代码里往往是埋伏：
 *        "所有订单都已支付" 对空订单列表返回 true，很容易误判为"全付清了"。
 *    (3) 判断依据是真值性：fn 返回 1、'x'、{} 都算通过；返回 0、''、null 都算不通过。
 *    (4) 与 includes 的关系：`arr.some(x => x === v)` 在语义上接近 `arr.includes(v)`，
 *        但 includes 用 SameValueZero 比较（能匹配 NaN），且不接收条件函数。
 *    (5) 与 find 的关系：`arr.some(fn)` ≈ `arr.find(fn) !== undefined`（但 find 有假值问题），
 *        想拿到元素本身用 find，只想知道"有没有"用 some。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**都不修改原数组**（non-mutating），只读。
 *    - **空数组陷阱**：`[].every(...) === true`。校验类逻辑（"所有字段都填了"）
 *      必须先判断数组是否非空，否则会放过"一个都没有"的情况。
 *    - 遍历会被跳过稀疏数组的空洞，也会跳过被删除/新增元素带来的下标漂移
 *      （与 forEach 一致：长度在开始前已确定）。
 *    - some/every 不能拿到"是哪一个元素满足"，需要那个信息就用 find。
 *    - `every` 的反义不是 `some` 的反义：
 *        !arr.some(fn)  等价于  arr.every(x => !fn(x))
 *        !arr.every(fn) 等价于  arr.some(x => !fn(x))
 *    - 回调里返回"对象"会给 some 造成困扰：返回任何对象都是真值（哪怕 {} 或 []）。
 *    - 不要用 some/every 做副作用，那还是 forEach 的活。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/14_some_and_every.js
 *
 * 【预期输出】
 *   依次演示 some/every 的基本语义、短路行为（用计数器证明）、
 *   空数组的返回值陷阱及正确写法，最后是权限校验、表单校验、库存检查等实战。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. some：存在一个满足即可
// ---------------------------------------------------------------------------

console.log('--- 1. some ---');

const nums = [1, 2, 3, 4, 5];
console.log('数组 =', JSON.stringify(nums));

console.log('some(n => n > 3)  =', nums.some((n) => n > 3), '（有 4、5 满足）');
console.log('some(n => n > 10) =', nums.some((n) => n > 10), '（一个都没有）');
console.log('some(n => n === 3) =', nums.some((n) => n === 3));
console.log('原数组未被修改 =', JSON.stringify(nums));

// 回调第三参数是数组本身，第二个是下标
console.log('\n用下标做判断（是否存在下标大于 3 的元素）：');
console.log(nums.some((_, i, arr) => i >= arr.length - 1));

// 判断依据是真值性，不是 === true
console.log('\n真值性判断：');
console.log("some(() => 1)   =", [1, 2].some(() => 1), '（1 是真值）');
console.log("some(() => 'x') =", [1, 2].some(() => 'x'));
console.log('some(() => [])  =', [1, 2].some(() => []), '（空数组也是真值！）');
console.log('some(() => 0)   =', [1, 2].some(() => 0));
console.log('some(() => null)=', [1, 2].some(() => null));

// ---------------------------------------------------------------------------
// 2. every：全部满足才为真
// ---------------------------------------------------------------------------

console.log('\n--- 2. every ---');

console.log('every(n => n > 0) =', nums.every((n) => n > 0), '（全部是正数）');
console.log('every(n => n > 1) =', nums.every((n) => n > 1), '（1 不满足）');
console.log('every(n => n < 100) =', nums.every((n) => n < 100));

// 常见业务语义
const fields = ['name', 'email', 'phone'];
const form = { name: '张三', email: 'a@b.com', phone: '' };
console.log('\n表单 =', JSON.stringify(form));
console.log('所有字段都填了吗（未防空版）=', fields.every((f) => form[f]));
console.log('  -> 正确结果应该是 false，因为 phone 是空字符串。');
console.log('所有字段都填了吗（推荐写法）=', fields.every((f) => Boolean(form[f])));
console.log('等价写法（显式非空）=', fields.every((f) => form[f] !== undefined && form[f] !== ''));
console.log('有些字段没填吗（some + 取反）=', fields.some((f) => !form[f]));

// ---------------------------------------------------------------------------
// 3. 短路行为：提前终止的证明
// ---------------------------------------------------------------------------

console.log('\n--- 3. 短路（提前终止）---');

const big = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const visited = [];

big.some((n) => {
  visited.push(n);
  return n === 3; // 到 3 就返回 true
});
console.log('some 找到 3 时访问过的元素 =', JSON.stringify(visited), '（后面的 4~10 没被访问）');

const visited2 = [];
big.every((n) => {
  visited2.push(n);
  return n < 3; // 到 3 时返回 false
});
console.log('every 在 3 处失败时访问过的元素 =', JSON.stringify(visited2));

// 对比 forEach：无法提前终止
const visited3 = [];
big.forEach((n) => {
  visited3.push(n);
});
console.log('forEach 访问过的元素个数 =', visited3.length, '（总是全部）');

// 用短路做性能优化：大数组里找"有没有超标的"
const huge = Array.from({ length: 1000 }, (_, i) => i);
let checked = 0;
const hasNegative = huge.some((n) => {
  checked++;
  return n < 0; // 永远不满足，所以会检查完所有元素
});
console.log('\n"有没有负数"（没有，必须查完）=', hasNegative, '，检查次数 =', checked);

checked = 0;
const hasAbove5 = huge.some((n) => {
  checked++;
  return n > 5; // 第 7 个就满足了
});
console.log('"有没有 > 5"（第 7 个就命中）=', hasAbove5, '，检查次数 =', checked, '（短路省下了 993 次）');

// ---------------------------------------------------------------------------
// 4. 空数组的返回值陷阱（重点）
// ---------------------------------------------------------------------------

console.log('\n--- 4. 空数组陷阱 ---');

const empty = [];
console.log('空数组 =', JSON.stringify(empty));
console.log('[].some(fn)  =', empty.some(() => true), '（一个满足的都没有 -> false）');
console.log('[].some(fn)  =', empty.some(() => false));
console.log('[].every(fn) =', empty.every(() => true), '（**空真**！数学上"所有元素都满足"成立）');
console.log('[].every(fn) =', empty.every(() => false), '（注意：回调根本没有执行）');

let called = 0;
empty.every(() => {
  called++;
  return true;
});
console.log('空数组调用 every，回调执行次数 =', called, '（一次都没有）');

// 业务场景：这是真实会踩的坑
console.log('\n业务场景演示：');
function allOrdersPaid(orders) {
  return orders.every((o) => o.status === 'paid');
}
console.log('allOrdersPaid([]) =', allOrdersPaid([]), '（没有订单，却"全都已支付"！）');
console.log('allOrdersPaid([{status:"paid"}]) =', allOrdersPaid([{ status: 'paid' }]));
console.log('allOrdersPaid([{status:"unpaid"}]) =', allOrdersPaid([{ status: 'unpaid' }]));

// 正确写法：显式防空
function allOrdersPaidSafe(orders) {
  if (orders.length === 0) return false; // 或者按业务返回 null / 'empty'
  return orders.every((o) => o.status === 'paid');
}
console.log('安全版 allOrdersPaidSafe([]) =', allOrdersPaidSafe([]));
console.log('安全版 allOrdersPaidSafe([paid]) =', allOrdersPaidSafe([{ status: 'paid' }]));

// 同理，some 对空数组返回 false 通常是"对的"，但也要小心"空集合永远不满足"的语义偏差
function anyAdmin(users) {
  return users.some((u) => u.role === 'admin');
}
console.log('\nanyAdmin([]) =', anyAdmin([]), '（没有用户 -> 没有管理员，语义正确）');
console.log("（注意：这不能推出'不存在管理员'，只是'当前列表里没有'）");

// ---------------------------------------------------------------------------
// 5. 德摩根定律：some 与 every 的取反关系
// ---------------------------------------------------------------------------

console.log('\n--- 5. some / every 的取反 ---');

const values = [2, 4, 6, 8];
const isEven = (n) => n % 2 === 0;
const isOdd = (n) => n % 2 === 1;

console.log('数组 =', JSON.stringify(values));
console.log('every(isEven)            =', values.every(isEven));
console.log('some(isOdd)              =', values.some(isOdd));
console.log('!every(isEven) === some(!isEven) =', !values.every(isEven) === values.some((n) => !isEven(n)));
console.log('!some(isEven)  === every(!isEven) =', !values.some(isEven) === values.every((n) => !isEven(n)));

// 用 notAllEqual 等语义化封装
const notAllEqual = (arr) => arr.some((v) => v !== arr[0]);
console.log('\n[1,1,1].some(v => v !== 1) =', notAllEqual([1, 1, 1]));
console.log('[1,2,1].some(v => v !== 1) =', notAllEqual([1, 2, 1]));

// ---------------------------------------------------------------------------
// 6. 与 includes / find / filter 的对比
// ---------------------------------------------------------------------------

console.log('\n--- 6. 与其他方法的对比 ---');

const roles = ['user', 'editor'];

// 值查找：includes 比 some 更简洁
console.log('roles.includes("editor")          =', roles.includes('editor'));
console.log('roles.some(r => r === "editor")   =', roles.some((r) => r === 'editor'), '（等价但更啰嗦）');

// 但 some 能做 includes 做不到的事：
const users = [
  { name: '张三', dept: '研发' },
  { name: '李四', dept: '销售' },
];
console.log('\nroles.includes({...}) 找不到对象 =', roles.includes({ name: '张三' }));
console.log('users.some(u => u.dept === "研发") =', users.some((u) => u.dept === '研发'), '（按条件判断）');

// some vs find：只要布尔就用 some（更短、语义更准）
console.log('\nusers.find(u => u.dept === "研发") 返回整个对象 =', JSON.stringify(users.find((u) => u.dept === '研发')));
console.log('users.some(u => u.dept === "研发") 只返回布尔 =', users.some((u) => u.dept === '研发'));

// some vs filter：filter 会跑完整个数组并生成新数组，some 命中即停
let filterChecked = 0;
huge.filter((n) => {
  filterChecked++;
  return n > 5;
});
console.log('\nfilter 检查次数 =', filterChecked, '（全部 1000 次）');
checked = 0;
huge.some((n) => {
  checked++;
  return n > 5;
});
console.log('some 检查次数   =', checked, '（命中即停）');

// every vs findIndex === -1
console.log('\n想表达"都不满足"：');
console.log('every(n => n < 0)          =', nums.every((n) => n < 0));
console.log('findIndex(n => n >= 0) === -1 =', nums.findIndex((n) => n >= 0) === -1);

// ---------------------------------------------------------------------------
// 7. 实战：权限与校验
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战：权限与校验 ---');

// 场景一：权限判定
const userPerms = ['order:read', 'order:write'];
const requiredPerms = ['order:read', 'order:write'];
const anyPerm = ['admin'];
const impossiblePerms = ['order:read', 'system:delete'];

console.log('用户权限 =', JSON.stringify(userPerms));
console.log('拥有全部所需权限 every =', requiredPerms.every((p) => userPerms.includes(p)));
console.log('拥有任一权限 some      =', anyPerm.some((p) => userPerms.includes(p)));
console.log('缺少权限的项           =', impossiblePerms.filter((p) => !userPerms.includes(p)));
console.log('是否完全缺少权限       =', impossiblePerms.every((p) => !userPerms.includes(p)));

// 场景二：表单校验
console.log('\n表单校验：');
const formFields = [
  { key: 'username', label: '用户名', value: 'zhangsan', required: true },
  { key: 'email', label: '邮箱', value: 'zs@example.com', required: true },
  { key: 'phone', label: '手机号', value: '', required: false },
  { key: 'age', label: '年龄', value: '0', required: true },
];

const missing = formFields.filter((f) => f.required && !f.value);
console.log('缺失的必填项 =', JSON.stringify(missing.map((f) => f.label)));
console.log('校验通过 every =', formFields.every((f) => !f.required || f.value !== ''));

// 场景三：库存检查
const stockItems = [
  { sku: 'A', need: 2, stock: 10 },
  { sku: 'B', need: 5, stock: 3 },
  { sku: 'C', need: 1, stock: 1 },
];
console.log('\n购物车 =', JSON.stringify(stockItems));
console.log('全部有货 every =', stockItems.every((i) => i.stock >= i.need));
console.log('有缺货 some    =', stockItems.some((i) => i.stock < i.need));
console.log('缺货清单       =', JSON.stringify(stockItems.filter((i) => i.stock < i.need).map((i) => i.sku)));

// 场景四：数据质量检查
const records = [
  { id: 1, name: '张三', email: 'a@b.com' },
  { id: 2, name: '', email: 'c@d.com' },
  { id: 3, name: '王五', email: null },
];
console.log('\n数据质量：');
console.log('所有记录都完整 every =', records.every((r) => r.id && r.name && r.email));
console.log('存在不完整记录 some  =', records.some((r) => !r.id || !r.name || !r.email));
console.log('不完整的记录 id      =', JSON.stringify(records.filter((r) => !r.name || !r.email).map((r) => r.id)));

// ---------------------------------------------------------------------------
// 8. 实战：用 some/every 做"区间判断"
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战：区间与连续性 ---');

// 判断数组是否严格递增
function isStrictlyIncreasing(arr) {
  return arr.every((v, i) => i === 0 || v > arr[i - 1]);
}
console.log('[1,2,3,4].every 严格递增 =', isStrictlyIncreasing([1, 2, 3, 4]));
console.log('[1,3,2,4].every 严格递增 =', isStrictlyIncreasing([1, 3, 2, 4]));
console.log('[1,1,2].every 严格递增   =', isStrictlyIncreasing([1, 1, 2]));

// 空数组与单元素数组的边界（因为 every 空真，这两个都返回 true）
console.log('空数组   =', isStrictlyIncreasing([]), '（空真）');
console.log('单元素   =', isStrictlyIncreasing([5]), '（也返回 true，符合数学定义）');

// 判断是否所有元素都在某个区间内
const scores = [55, 78, 90, 43, 66];
console.log('\n成绩 =', JSON.stringify(scores));
console.log('都在 [0, 100] 内 =', scores.every((s) => s >= 0 && s <= 100));
console.log('有不及格的 =', scores.some((s) => s < 60));

// 判断"是否所有元素都唯一"（用 O(n^2) 的简单写法演示语义）
function allUnique(arr) {
  return arr.every((v, i) => arr.indexOf(v) === i);
}
console.log('\n[1,2,3].every 唯一 =', allUnique([1, 2, 3]));
console.log('[1,2,1].every 唯一 =', allUnique([1, 2, 1]));
console.log('（用 Set 更快：new Set(arr).size === arr.length ->', new Set([1, 2, 1]).size === [1, 2, 1].length, '）');

// ---------------------------------------------------------------------------
// 9. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 9. 小结 ---');
console.log('some：有一个满足就 true（∃），空数组返回 false，命中即停。');
console.log('every：全部满足才 true（∀），**空数组返回 true**，失败即停。');
console.log('两者都不修改原数组（non-mutating），都能提前终止（比 forEach 灵活）。');
console.log('防空守则：用 every 做校验前，先判断数组非空，除非你确实想要"空真"的语义。');
console.log('只想拿布尔值就用 some/every；需要元素本身用 find；需要全部满足者用 filter。');
