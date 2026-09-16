/**
 * ============================================================================
 * 知识点：at() 方法 —— 负索引访问与 arr[arr.length - 1] 的对比
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】08_arrays/14_some_and_every.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    arr.at(index) 是 ES2022 引入的"统一索引访问"方法。它和 arr[index] 的取值规则
 *    几乎一样，唯一的区别是：**at() 接受负索引**，负数表示"从末尾往回数"：
 *
 *        arr.at(0)   === arr[0]                  第一个
 *        arr.at(-1)  === arr[arr.length - 1]     最后一个
 *        arr.at(-2)  === arr[arr.length - 2]     倒数第二个
 *
 *    注意：`arr[-1]` **不是**倒数第一个，而是"读取名为 '-1' 的属性"，
 *    数组上不存在这个属性，所以返回 undefined。这正是 at() 要解决的问题。
 *
 * 2. 为什么需要它
 *    "取最后一个元素"是极高频的操作，而 `arr[arr.length - 1]` 又长又容易写错
 *    （把 length 和 -1 写反、忘了 length 变化、在链式调用里不得不先存变量）。
 *    at(-1) 让"最后一个"变成一个有名字的概念。更妙的是，at() 可以**直接挂在链式调用后面**：
 *        arr.filter(...).map(...).at(-1)
 *    用下标写法就必须拆成两步。
 *
 * 3. 核心语法要点
 *    (1) at() 同样存在于 String.prototype 和 TypedArray.prototype 上：
 *        'hello'.at(-1) === 'o'；
 *    (2) 返回值：越界（正数 >= length 或 负数绝对值 > length）都返回 **undefined**，
 *        不报错、不修改数组；
 *    (3) 索引会被**向 0 取整**：at(1.9) 等价于 at(1)；at(-1.9) 等价于 at(-1)；
 *        但 at(NaN)、at(undefined) 会被当作 0（因为 ToIntegerOrInfinity(NaN) = 0）；
 *    (4) 越界不会改变数组的 length（区别于 arr[10] = x 的写入）；
 *    (5) 稀疏数组的空洞位置返回 undefined（和下标访问一致）。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**不修改原数组**（non-mutating），它纯读。
 *    - at() 的负索引**只对 at() 有效**：slice(-1) 返回数组（不是元素）、
 *      splice(-1) 会删除元素、indexOf 的负数参数是"起点"。同一个负数在不同方法里含义不同。
 *    - 空数组的 at(-1) 返回 undefined，不是抛错；如果后续代码直接取属性就会崩：
 *        推荐用可选链 `arr.at(-1)?.name`。
 *    - at() 不能用来赋值：`arr.at(-1) = 5` 是无效的（不是引用），只是默默失败或报错。
 *    - 老代码里很常见 `arr[arr.length - 1]`，它不是错的，只是更啰嗦；
 *      项目里要不要统一用 at() 取决于目标环境（Node 16.6+ / 现代浏览器都支持）。
 *    - `arr.at()` 不传参数等价于 at(0)；同理 `'abc'.at()` 得到 'a'。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/15_at_and_negative_index.js
 *
 * 【预期输出】
 *   依次演示 at() 的正负索引、与 arr[length-1] / arr[-1] 的对比、越界与取整行为、
 *   at() 在字符串与链式调用中的用法，最后是取首尾元素、分页边界等实战。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. at() 基础：正索引与负索引
// ---------------------------------------------------------------------------

console.log('--- 1. at() 基础 ---');

const fruits = ['苹果', '香蕉', '橙子', '葡萄'];
console.log('数组 =', JSON.stringify(fruits), '长度 =', fruits.length);

console.log('\n正索引（与下标访问一致）：');
console.log('fruits.at(0)  =', JSON.stringify(fruits.at(0)), ' 等价于 fruits[0] =', JSON.stringify(fruits[0]));
console.log('fruits.at(1)  =', JSON.stringify(fruits.at(1)));
console.log('fruits.at(3)  =', JSON.stringify(fruits.at(3)));

console.log('\n负索引（at 的独有能力）：');
console.log('fruits.at(-1) =', JSON.stringify(fruits.at(-1)), ' 等价于 fruits[length - 1] =', JSON.stringify(fruits[fruits.length - 1]));
console.log('fruits.at(-2) =', JSON.stringify(fruits.at(-2)));
console.log('fruits.at(-3) =', JSON.stringify(fruits.at(-3)));
console.log('fruits.at(-4) =', JSON.stringify(fruits.at(-4)), '（正好是第一个）');

// 换算公式：at(-n) 等价于 at(length - n)
console.log('\n换算验证：at(-2) 等价于 at(length - 2) = at(2) =', JSON.stringify(fruits.at(2)));

// ---------------------------------------------------------------------------
// 2. 对比三种"取最后一个"的写法
// ---------------------------------------------------------------------------

console.log('\n--- 2. 取最后一个的三种写法 ---');

const arr = [10, 20, 30];

// 写法一：arr[-1] —— 错误！这不是负索引
console.log('arr[-1]                 =', arr[-1], '（undefined！JS 数组不支持负下标）');

// 写法二：arr[arr.length - 1] —— 正确但啰嗦
console.log('arr[arr.length - 1]     =', arr[arr.length - 1], '（传统写法，正确）');

// 写法三：arr.at(-1) —— 推荐
console.log('arr.at(-1)              =', arr.at(-1), '（现代写法，更短、更清晰）');

// 为什么 arr[-1] 会是 undefined？
console.log('\n原理：arr[-1] 实际是"读取属性 -1"，等价于 arr["-1"]');
console.log('arr["-1"] =', arr['-1'], '（数组上只有 0、1、2 这些索引属性）');
console.log("验证：(-1) in arr =", -1 in arr, '（这个属性不存在）');
console.log('更直白的证据：给数组加个自定义属性，它不是元素 ——');
arr.foo = 'bar';
console.log("  arr.foo = 'bar' 后，length 依然是", arr.length, '，但 arr.foo =', arr.foo);

// 另一个常见错误：把 length 和 -1 写反
console.log('\n幂等性提醒：arr[arr.length - 1] 中的 length 是动态的，');
console.log('不要缓存成变量后再删元素，否则下标会指向错误的位置。');

// ---------------------------------------------------------------------------
// 3. 越界、取整与特殊参数
// ---------------------------------------------------------------------------

console.log('\n--- 3. 越界与特殊参数 ---');

const small = ['a', 'b', 'c'];

console.log('small.at(5)   =', small.at(5), '（正数越界 -> undefined，不报错）');
console.log('small.at(-5)  =', small.at(-5), '（负数越界 -> undefined）');
console.log('small.at(-3)  =', JSON.stringify(small.at(-3)), '（正好是第一个）');
console.log('small.at(-4)  =', small.at(-4), '（再往前一个就 undefined）');

console.log('\n取整行为：');
console.log('small.at(1.9)  =', JSON.stringify(small.at(1.9)), '（向 0 取整 -> at(1)）');
console.log('small.at(1.2)  =', JSON.stringify(small.at(1.2)));
console.log('small.at(-1.9) =', JSON.stringify(small.at(-1.9)), '（向 0 取整 -> at(-1)）');
console.log('small.at(-0.5) =', JSON.stringify(small.at(-0.5)), '（-> at(0)）');

console.log('\n特殊值：');
console.log('small.at(NaN)       =', JSON.stringify(small.at(NaN)), '（NaN -> 0）');
console.log('small.at(undefined) =', JSON.stringify(small.at(undefined)), '（undefined -> 0，即 at() ）');
console.log('small.at(null)      =', JSON.stringify(small.at(null)), '（null -> 0）');
console.log("small.at('2')       =", JSON.stringify(small.at('2')), '（字符串会被转成数字）');
console.log("small.at('x')       =", JSON.stringify(small.at('x')), '（转不成数字 -> NaN -> 0）');

console.log('\n空数组：');
console.log('[].at(0)  =', [].at(0));
console.log('[].at(-1) =', [].at(-1), '（不报错，返回 undefined）');

console.log('\n越界读取不会改变数组：');
const unchanged = ['x', 'y'];
unchanged.at(100);
unchanged.at(-100);
console.log('unchanged =', JSON.stringify(unchanged), '，length =', unchanged.length);

// 稀疏数组
const sparse = [1, , 3]; // eslint-disable-line no-sparse-arrays
console.log('\n稀疏数组 =', sparse);
console.log('sparse.at(-1) =', sparse.at(-1), '（最后一个有值）');
console.log('sparse.at(-2) =', sparse.at(-2), '（空洞 -> undefined）');

// 原数组未被修改
console.log('\n以上所有 at() 调用都没有修改原数组（non-mutating）。');

// ---------------------------------------------------------------------------
// 4. at() 也存在于字符串与 TypedArray 上
// ---------------------------------------------------------------------------

console.log('\n--- 4. 字符串与 TypedArray 上的 at ---');

const text = 'Hello';
console.log('字符串 =', JSON.stringify(text));
console.log('text.at(0)  =', JSON.stringify(text.at(0)));
console.log('text.at(-1) =', JSON.stringify(text.at(-1)), '（比 text[text.length-1] 清晰得多）');
console.log('text.at(-2) =', JSON.stringify(text.at(-2)));
console.log('text.at(99) =', JSON.stringify(text.at(99)));

// 字符串的负下标同样不成立
console.log("text[-1]    =", JSON.stringify(text[-1]), '（undefined，字符串也没有负下标）');

// TypedArray 也有 at
const typed = new Int8Array([5, 6, 7]);
console.log('\nInt8Array =', typed);
console.log('typed.at(-1) =', typed.at(-1));
console.log('（at 是通用方法，数组、字符串、TypedArray 都实现了它）');

// ---------------------------------------------------------------------------
// 5. at() 的最大优势：链式调用
// ---------------------------------------------------------------------------

console.log('\n--- 5. at() 与链式调用 ---');

const orders = [
  { id: 'A1', amount: 120, status: 'paid' },
  { id: 'A2', amount: 80, status: 'unpaid' },
  { id: 'A3', amount: 300, status: 'paid' },
];
console.log('订单 =', JSON.stringify(orders));

// at() 可以直接接在链条末尾
const lastPaidId = orders.filter((o) => o.status === 'paid').map((o) => o.id).at(-1);
console.log('最后一个已支付订单号 =', JSON.stringify(lastPaidId));

// 用下标写法就必须拆成两步（可读性差一些）
const paidIds = orders.filter((o) => o.status === 'paid').map((o) => o.id);
console.log('拆两步的写法 =', JSON.stringify(paidIds[paidIds.length - 1]));

// 对比 slice(-1)[0] 的旧写法
console.log('slice(-1)[0] 的旧写法 =', JSON.stringify(orders.map((o) => o.id).slice(-1)[0]));
console.log('（注意 slice(-1) 返回的是【数组】，还要再取 [0]，at(-1) 一步到位）');

// 链式调用取倒数第二个
console.log('倒数第二个订单号 =', JSON.stringify(orders.map((o) => o.id).at(-2)));

// ---------------------------------------------------------------------------
// 6. 陷阱：at() 返回 undefined 后直接取属性
// ---------------------------------------------------------------------------

console.log('\n--- 6. 陷阱：结果可能是 undefined ---');

const maybeEmpty = [];

// 危险写法：数组为空时 at(-1) 是 undefined，取 .name 会抛错
try {
  const u = maybeEmpty.at(-1);
  console.log(u.name); // TypeError
} catch (err) {
  console.log('对空数组 at(-1) 的结果取属性会抛错：', err.constructor.name, '-', err.message);
}

// 安全写法：可选链 + 空值合并
const safeName = maybeEmpty.at(-1)?.name ?? '（没有数据）';
console.log('可选链安全写法 =', safeName);

// 传统下标写法同样会抛错，所以这不是 at() 的问题，而是"取元素后要用可选链"的通用建议
try {
  const u = maybeEmpty[maybeEmpty.length - 1];
  console.log(u.name);
} catch (err) {
  console.log('传统下标写法同样会抛错：', err.constructor.name);
}

// at() 不能被赋值使用
const assignTarget = [1, 2, 3];
try {
  assignTarget.at(-1) = 99; // 非严格模式下静默失败，ESM 严格模式下抛错
} catch (err) {
  console.log('\n尝试给 at() 赋值：', err.constructor.name, '-', err.message);
}
console.log('assignTarget 依然是 =', JSON.stringify(assignTarget));
console.log('要修改最后一个元素，请用 arr[arr.length - 1] = x 或 arr.with(-1, x)（返回新数组）。');
console.log('不可变写法 arr.with(-1, 99) =', JSON.stringify(assignTarget.with(-1, 99)));

// ---------------------------------------------------------------------------
// 7. 实战
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战 ---');

// 场景一：获取"最近一条记录"
const logs = [
  { at: '09:00', msg: '启动' },
  { at: '10:00', msg: '处理' },
  { at: '11:00', msg: '完成' },
];
console.log('最近一条日志 =', JSON.stringify(logs.at(-1)));
console.log('最早一条日志 =', JSON.stringify(logs.at(0)));

// 场景二：面包屑导航的"当前页"
const breadcrumbs = ['首页', '分类', '详情'];
console.log('\n面包屑 =', JSON.stringify(breadcrumbs));
console.log('当前页 =', JSON.stringify(breadcrumbs.at(-1)));
console.log('上一级 =', JSON.stringify(breadcrumbs.at(-2)));

// 场景三：取文件名的扩展名（用字符串的 at 从后找）
const filename = 'report.final.pdf';
console.log('\n文件名 =', JSON.stringify(filename));
console.log('扩展名 =', JSON.stringify(filename.split('.').at(-1)));
console.log('主文件名 =', JSON.stringify(filename.split('.').slice(0, -1).join('.')));
console.log('最后一个字符 =', JSON.stringify(filename.at(-1)));

// 场景四：安全的"取第 N 个"
function nth(arr, n) {
  // n 从 1 开始编号（第 1 个、第 2 个……），比"从 0 开始"更贴近人类习惯
  return arr.at(n - 1);
}
const seq = ['一', '二', '三'];
console.log('\nseq =', JSON.stringify(seq));
console.log('第 1 个 =', JSON.stringify(nth(seq, 1)), '（nth 内部用 at(n-1)）');
console.log('第 3 个 =', JSON.stringify(nth(seq, 3)));
console.log('第 5 个 =', JSON.stringify(nth(seq, 5)), '（越界安全返回 undefined）');

// 场景五：循环中"取相邻元素"
const path = ['A', 'B', 'C', 'D'];
console.log('\n相邻元素对 =');
for (let i = 0; i < path.length - 1; i++) {
  console.log(`  ${path.at(i)} -> ${path.at(i + 1)}`);
}
console.log('（at(i) 与 arr[i] 在这里等价，at 只是显得统一）');

// ---------------------------------------------------------------------------
// 8. 速查与建议
// ---------------------------------------------------------------------------

console.log('\n--- 8. 速查 ---');
console.log('arr.at(i)   —— i >= 0 时与 arr[i] 完全相同；i < 0 时从末尾数');
console.log('arr.at(-1)  —— 最后一个元素，越界返回 undefined，不修改数组');
console.log('arr[-1]     —— 永远是 undefined（读取名为 "-1" 的属性）');
console.log('arr.at(1.9) —— 取整为 at(1)');
console.log('支持环境：ES2022（Node 16.6+ / 现代浏览器），本仓库 Node 24 完全支持。');
console.log('建议：新代码统一用 at(-1) 取末尾元素，比 arr[arr.length - 1] 更不易写错。');
