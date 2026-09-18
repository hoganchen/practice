/**
 * ============================================================================
 * 知识点：indexOf / lastIndexOf / includes / findIndex / find / findLast 系列查找
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】08_arrays/05_concat_and_join.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这一组方法都是在数组里"找东西"，区别在于**找什么**和**返回什么**：
 *
 *      方法                     找什么            返回什么                 比较方式
 *      -----------------------  ----------------  -----------------------  ------------------
 *      indexOf(value, from)     严格相等的值      首次出现的下标 / -1       ===（严格相等）
 *      lastIndexOf(value)       严格相等的值      最后一次出现的下标 / -1   ===（严格相等）
 *      includes(value)          严格相等的值      true / false             ===（但有例外，见下）
 *      findIndex(fn)            满足条件的元素    首次满足的下标 / -1      回调函数自己决定
 *      findIndexLast / findLastIndex(fn)  满足条件的元素  最后一次满足的下标 / -1  回调函数
 *      find(fn)                 满足条件的元素    首次满足的**元素** / undefined  回调函数
 *      findLast(fn)             满足条件的元素    最后一次满足的元素 / undefined  回调函数
 *
 *    一句话记忆：
 *      - indexOf 系列回答"在哪儿"（返回下标）；
 *      - includes 回答"有没有"（返回布尔）；
 *      - find 系列回答"是哪个"（返回元素本身），并且可以按条件找对象。
 *
 * 2. 为什么需要它们
 *    - 判断数组中是否包含某项（如权限列表里是否有 'admin'）—— includes；
 *    - 删除某个元素前先定位它的下标 —— indexOf + splice；
 *    - 在一堆对象里按 id 找到那个对象 —— find；
 *    - 找出"最后一个未读消息"或"最后一次登录记录" —— findLast。
 *
 * 3. 核心语法要点
 *    (1) indexOf / includes 用的是**严格相等（===）**，所以：
 *        [1, 2].indexOf('1') 返回 -1；[NaN].indexOf(NaN) 返回 -1（因为 NaN !== NaN）。
 *        但 [NaN].includes(NaN) 返回 **true** —— includes 内部对 NaN 做了特判。
 *        同理 [+0].includes(-0) 返回 true（=== 也认为 +0 === -0）。
 *    (2) 引用类型只比"引用"：[] 和 [] 是两个不同的对象，indexOf 找不到。
 *    (3) indexOf 的第二个参数 fromIndex 可以指定起点，负数表示从末尾数。
 *    (4) find 族的回调签名是 (element, index, array)，与 map/filter 一致。
 *        find 找不到时返回 **undefined**（不是 -1，也不是 null）。
 *    (5) findIndex 找不到时返回 **-1**。
 *    (6) findLast / findLastIndex 是 ES2023 新增，从后往前找；Node 18+ 均支持。
 *    (7) 稀疏数组的空洞：find / findIndex / findLast / findLastIndex 以及 includes
 *        都**不会跳过**空洞，会把空洞当成 undefined 来处理；
 *        而 indexOf / lastIndexOf 会**跳过**空洞。所以
 *        `[1, , 3].indexOf(undefined)` 是 -1，`[1, , 3].includes(undefined)` 却是 true
 *        （详见 19 号文件）。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】以上所有方法**都不修改原数组**（non-mutating），它们只读。
 *    - 用 indexOf 找对象往往是徒劳的：需要按属性找就得用 findIndex。
 *    - `findIndex` 返回 0 时是"找到了（第一个）"，是**假值**，
 *      写成 `if (arr.findIndex(...))` 会误判；必须写 `!== -1`。
 *    - includes 不能接收"起始下标 + 条件"，它的第二参数是 fromIndex（数值）。
 *    - 想找"全部满足条件的元素"要用 filter，find 只返回第一个。
 *    - NaN 的差异：indexOf(NaN) = -1 但 includes(NaN) = true，这是真实存在的坑。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/06_index_of_and_includes.js
 *
 * 【预期输出】
 *   依次演示各查找方法的返回值、严格相等的限制、NaN 与对象的特殊性、
 *   find 族的条件查找，最后给出综合实战与选型建议。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. indexOf：返回首次出现的下标
// ---------------------------------------------------------------------------

console.log('--- 1. indexOf ---');

const fruits = ['苹果', '香蕉', '橙子', '香蕉'];
console.log('数组 =', JSON.stringify(fruits));

console.log('indexOf("香蕉")     =', fruits.indexOf('香蕉'), '（首次出现，下标 1）');
console.log('indexOf("橙子")     =', fruits.indexOf('橙子'));
console.log('indexOf("西瓜")     =', fruits.indexOf('西瓜'), '（找不到返回 -1）');
console.log('indexOf("香蕉", 2)  =', fruits.indexOf('香蕉', 2), '（从下标 2 开始找，找到下标 3）');
console.log('indexOf("香蕉", -2) =', fruits.indexOf('香蕉', -2), '（-2 表示从倒数第 2 个开始，仍是 3）');
console.log('原数组依然 =', JSON.stringify(fruits), '（不修改原数组）');

// 0 是假值：不能用真值判断
const idx = fruits.indexOf('苹果'); // 0
console.log('\nindexOf("苹果") =', idx, '，if (idx) 会判定为', Boolean(idx), '（错误！必须用 !== -1）');
console.log('正确写法：idx !== -1 ->', idx !== -1);

// ---------------------------------------------------------------------------
// 2. lastIndexOf：返回最后一次出现的下标
// ---------------------------------------------------------------------------

console.log('\n--- 2. lastIndexOf ---');

console.log('lastIndexOf("香蕉") =', fruits.lastIndexOf('香蕉'), '（最后一次出现，下标 3）');
console.log('lastIndexOf("西瓜") =', fruits.lastIndexOf('西瓜'), '（找不到返回 -1）');
console.log('lastIndexOf("香蕉", 2) =', fruits.lastIndexOf('香蕉', 2), '（从下标 2 往前找 -> 1）');

// 实战：去掉重复项中"保留最后一个"的场景
const logins = ['u1', 'u2', 'u1', 'u3', 'u2'];
console.log('\n登录记录 =', JSON.stringify(logins));
const lastLoginOfU1 = logins.lastIndexOf('u1');
console.log('u1 最后出现在下标 =', lastLoginOfU1);

// ---------------------------------------------------------------------------
// 3. 严格相等（===）的限制
// ---------------------------------------------------------------------------

console.log('\n--- 3. 严格相等的限制 ---');

const nums = [1, 2, 3];
console.log('nums =', JSON.stringify(nums));
console.log("indexOf('1')（字符串）= ", nums.indexOf('1'), '（找不到，因为 1 !== "1"）');
console.log('indexOf(1)（数字）  =', nums.indexOf(1));
console.log('includes(true)      =', nums.includes(true), '（不会做隐式转换）');
console.log('includes(1)         =', nums.includes(1));
console.log('includes("1")       =', nums.includes('1'));

// 对象按引用比较
const obj1 = { id: 1 };
const obj2 = { id: 1 };
const objs = [obj1, { id: 2 }];
console.log('\n对象数组 = 含 obj1 与另一个 {id:2}');
console.log('indexOf(obj1)      =', objs.indexOf(obj1), '（同一引用，找得到）');
console.log('indexOf(obj2)      =', objs.indexOf(obj2), '（内容相同但是不同对象，找不到）');
console.log('includes({id: 2})  =', objs.includes({ id: 2 }), '（同样找不到）');
console.log('结论：找对象请用 find / findIndex。');

// NaN 的特殊之处
const withNaN = [1, NaN, 3];
console.log('\n数组 =', JSON.stringify(withNaN), '（注意 JSON 会把 NaN 变成 null）');
console.log('indexOf(NaN)  =', withNaN.indexOf(NaN), '（-1，因为 NaN !== NaN）');
console.log('includes(NaN) =', withNaN.includes(NaN), '（true！includes 对 NaN 做了特判）');
console.log('findIndex(Number.isNaN 写法) =', withNaN.findIndex((v) => Number.isNaN(v)));

// +0 / -0
console.log('\n[+0].includes(-0) =', [0].includes(-0), '（=== 认为 +0 === -0）');
console.log('Object.is(+0, -0) =', Object.is(0, -0), '（要区分正负零得用 Object.is）');

// ---------------------------------------------------------------------------
// 4. includes：返回布尔值
// ---------------------------------------------------------------------------

console.log('\n--- 4. includes ---');

const roles = ['user', 'editor', 'admin'];
console.log('角色列表 =', JSON.stringify(roles));
console.log("includes('admin') =", roles.includes('admin'));
console.log("includes('guest') =", roles.includes('guest'));

// 典型用法：权限判断
function canEdit(roleList) {
  return roleList.includes('admin') || roleList.includes('editor');
}
console.log("canEdit(['user']) =", canEdit(['user']));
console.log("canEdit(['editor']) =", canEdit(['editor']));

// 与 indexOf !== -1 的对比
console.log('\n两种写法结果一致：includes 更语义化，indexOf 还能拿到位置。');
console.log("roles.includes('admin')          =", roles.includes('admin'));
console.log("roles.indexOf('admin') !== -1    =", roles.indexOf('admin') !== -1);

// includes 也支持 fromIndex
console.log("\n['a','b','a'].includes('a', 1) =", ['a', 'b', 'a'].includes('a', 1));
console.log("['a','b','a'].includes('a', 3) =", ['a', 'b', 'a'].includes('a', 3), '（起点越界 -> false）');

// 字符串也有 includes（子串匹配），别和数组的混淆
console.log("\n字符串版本：'hello world'.includes('world') =", 'hello world'.includes('world'));

// ---------------------------------------------------------------------------
// 5. findIndex：按条件找下标
// ---------------------------------------------------------------------------

console.log('\n--- 5. findIndex ---');

const users = [
  { id: 101, name: '张三', age: 20, vip: false },
  { id: 102, name: '李四', age: 31, vip: true },
  { id: 103, name: '王五', age: 25, vip: false },
];
console.log('用户列表 =', JSON.stringify(users));

// 按 id 找下标
const i102 = users.findIndex((u) => u.id === 102);
console.log('id === 102 的下标 =', i102);

// 按条件找下标
const iAdult = users.findIndex((u) => u.age >= 30);
console.log('age >= 30 的第一个下标 =', iAdult, '，对应 =', JSON.stringify(users[iAdult]));

// 找不到返回 -1
const iMissing = users.findIndex((u) => u.id === 999);
console.log('id === 999 的下标 =', iMissing, '（找不到返回 -1）');

// 回调收到的三个参数
users.findIndex((u, i, arr) => {
  console.log(`  回调被调用：元素=${u.name}，下标=${i}，数组长度=${arr.length}`);
  return false; // 返回 false 就会继续找，直到遍历完返回 -1
});

// 常见陷阱：下标 0 是假值
const firstIsTarget = ['x', 'y'].findIndex((v) => v === 'x'); // 0
console.log('\nfindIndex 返回 0 时 if (idx) 判定为', Boolean(firstIsTarget), '（错误！要用 !== -1）');

// ---------------------------------------------------------------------------
// 6. find：按条件返回元素本身
// ---------------------------------------------------------------------------

console.log('\n--- 6. find ---');

const found = users.find((u) => u.vip);
console.log('第一个 VIP =', JSON.stringify(found));
console.log('找不到时返回 =', users.find((u) => u.id === 999), '（undefined，不是 null）');

// 典型：把 find 的结果安全地用起来
function findUser(id) {
  return users.find((u) => u.id === id) ?? null; // ?? 把 undefined 归一成 null
}
console.log('\nfindUser(103) =', JSON.stringify(findUser(103)));
console.log('findUser(999) =', findUser(999));

// 陷阱：直接对 find 的结果取属性，找不到就会报错
try {
  const u = users.find((x) => x.id === 999);
  console.log(u.name); // u 是 undefined，读 .name 抛错
} catch (err) {
  console.log('对 undefined 取属性会抛错：', err.constructor.name, '-', err.message);
}
// 安全写法
const safe = users.find((x) => x.id === 999)?.name ?? '（未找到）';
console.log('可选链安全取值 =', safe);

// ---------------------------------------------------------------------------
// 7. findLast / findLastIndex：从后往前找（ES2023）
// ---------------------------------------------------------------------------

console.log('\n--- 7. findLast / findLastIndex ---');

const events = [
  { type: 'login', at: '09:00' },
  { type: 'logout', at: '12:00' },
  { type: 'login', at: '13:00' },
  { type: 'logout', at: '18:00' },
];
console.log('事件流 =', JSON.stringify(events));

console.log('find(login)        =', JSON.stringify(events.find((e) => e.type === 'login')), '（第一次登录）');
console.log('findLast(login)    =', JSON.stringify(events.findLast((e) => e.type === 'login')), '（最后一次登录）');
console.log('findIndex(login)     =', events.findIndex((e) => e.type === 'login'));
console.log('findLastIndex(login) =', events.findLastIndex((e) => e.type === 'login'));

// 实战：找"最近一次错误"
const codes = [200, 200, 500, 200, 404];
console.log('\n状态码 =', JSON.stringify(codes));
console.log('最后一个非 200 的状态码 =', codes.findLast((c) => c !== 200));

// 实战：找"最后一个满足条件的元素"比"reverse + find"更省事，也不修改数组
const nums2 = [1, 5, 9, 12, 15];
console.log('nums2 =', JSON.stringify(nums2));
console.log('findLast(> 10) =', nums2.findLast((n) => n > 10));
console.log('对比 reverse + find（会改原数组）：');
const reversed = [...nums2].reverse().find((n) => n > 10);
console.log('  [...nums2].reverse().find(...) =', reversed, '，原数组 =', JSON.stringify(nums2));

// findLast 找不到也是 undefined
console.log('findLast(> 1000) =', nums2.findLast((n) => n > 1000));

// ---------------------------------------------------------------------------
// 8. 综合实战：删除列表中的某项（需要先定位再删）
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战：按 id 删除 ---');

const cart = [
  { sku: 'A1', qty: 2 },
  { sku: 'B2', qty: 1 },
  { sku: 'C3', qty: 5 },
];
console.log('购物车 =', JSON.stringify(cart));

// indexOf 在这里没用（对象比较引用），必须用 findIndex
function removeBySku(list, sku) {
  const i = list.findIndex((item) => item.sku === sku);
  if (i === -1) {
    return { ok: false, list }; // 找不到就别动
  }
  const newList = [...list]; // 不修改原数组
  newList.splice(i, 1);
  return { ok: true, list: newList };
}

console.log('删除 B2 =', JSON.stringify(removeBySku(cart, 'B2')));
console.log('删除 Z9 =', JSON.stringify(removeBySku(cart, 'Z9')));
console.log('原购物车依然 =', JSON.stringify(cart), '（我们用了拷贝，未修改原数组）');

// ---------------------------------------------------------------------------
// 9. 选型速查
// ---------------------------------------------------------------------------

console.log('\n--- 9. 选型速查 ---');
console.log('想知道"有没有"          -> includes');
console.log('想知道"在哪个位置"      -> indexOf / lastIndexOf');
console.log('想"按条件"找位置        -> findIndex / findLastIndex');
console.log('想"按条件"拿到元素      -> find / findLast');
console.log('想拿到"全部满足条件的"  -> filter（见 09 号文件）');
console.log('所有方法都不修改原数组（non-mutating）。');
