/**
 * ============================================================================
 * 知识点：lodash 基础 —— chunk / uniqBy / groupBy / get / set / debounce
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】入门
 * 【前置知识】08_arrays、09_objects、06_functions 中的基础内容
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    lodash 是 JavaScript 世界里最经典的工具函数库（2012 年发布，至今仍是
 *    npm 上下载量最高的包之一）。它把日常开发中反复手写的数组/对象/字符串/
 *    函数操作，封装成一批"语义明确、边界处理完善"的函数。
 *
 *    本文件覆盖最常用的六个：
 *      chunk(arr, size)      把数组按 size 切成若干小块        —— 分页、批量提交
 *      uniqBy(arr, iteratee) 按指定字段去重                     —— 列表去重
 *      groupBy(arr, iteratee) 按指定字段分组                    —— 报表聚合
 *      get(obj, path, def)   安全地按路径深层取值               —— 接口数据兜底
 *      set(obj, path, value) 按路径深层赋值（自动创建中间层）   —— 表单回填
 *      debounce(fn, wait)    防抖                               —— 搜索框输入
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    这些需求在业务代码里出现频率极高，而手写实现容易在边界上翻车：
 *      - chunk：手写循环处理"最后一组不足 size"很容易写错；
 *      - uniqBy：用 Set 只能去重基本类型，对象数组必须按字段去重；
 *      - groupBy：手写要维护一个 Map 并处理键不存在的情况；
 *      - get：`a.b.c.d` 只要中间某一层是 undefined 就抛 TypeError，
 *             而接口返回的数据经常缺字段，get 是最省事的兜底手段；
 *      - set：手写深层赋值需要逐层判断并创建对象；
 *      - debounce：手写需要处理 this、参数透传、取消、立即执行等细节。
 *    用 lodash 意味着这些细节已经被千万个项目验证过。
 *
 * 3. 核心语法要点
 *    import lodash from 'lodash';           lodash 是 CommonJS 包，
 *                                           ESM 里用默认导入最稳妥
 *    const { chunk, uniqBy } = lodash;      解构出需要的函数
 *    按需导入（推荐，能减小打包体积）：
 *      import chunk from 'lodash/chunk.js';
 *    lodash/fp 提供"数据在后、函数在前"的柯里化版本，适合函数式组合。
 *
 * 4. 常见陷阱
 *    - 整个导入 `import _ from 'lodash'` 在打包工具里会引入全部代码（约 70KB gzip），
 *      现代项目推荐 `lodash-es` + 按需导入，或用原生方法替代。
 *    - uniqBy 保留的是"第一次出现"的元素，不是最后一次 —— 去重后想保留最新记录
 *      需要先排序或反转。
 *    - get 的路径可以是字符串 'a.b[0].c' 或数组 ['a','b',0,'c']，两者行为一致，
 *      但含特殊字符（如点号）的键名必须用数组形式。
 *    - set 会直接修改传入的对象（有副作用），想保持不可变要先 cloneDeep。
 *    - debounce 返回的函数带 .cancel() 和 .flush() 方法，组件卸载时应当调用
 *      .cancel()，否则可能在组件销毁后触发回调。
 *    - lodash 的很多函数在现代 JS 里已有原生替代（Object.groupBy、structuredClone、
 *      Array.prototype.at 等），新项目应优先考虑原生，只对缺失的能力引入 lodash。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/01_lodash_basics.js
 *
 * 【预期输出】
 *   依次演示六个函数的用法与边界行为，均使用 console.log 打印结果，
 *   并在最后给出原生替代方案的对照。退出码 0。
 * ============================================================================
 */

// lodash 是 CommonJS 包。在 ESM 里用默认导入（default import）是官方推荐方式：
// import 时会得到 module.exports 这个对象，上面挂着所有工具函数。
import lodash from 'lodash';

// 解构出本文件要用的函数。注意：这只是"取属性"，不会影响打包体积
//（真正影响体积的是怎么 import 这个包本身，见文件末尾的说明）。
const { chunk, uniqBy, groupBy, get, set, debounce, uniq } = lodash;

// 确认 lodash 版本，便于排查"文档行为与本地不一致"的问题
console.log('--- 0. 环境信息 ---');
console.log(`lodash 版本：${lodash.VERSION}（VERSION 是 lodash 内置的版本号常量）`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 1. chunk：把数组切成等长的小块 ---');

// 典型场景一：分页。后端一次只接受 100 条，前端把 250 条切成 3 批提交。
const allRecords = Array.from({ length: 250 }, (_, i) => ({ id: i + 1 }));
const batches = chunk(allRecords, 100);
console.log(`总记录 ${allRecords.length} 条，按 100 条一批切分 -> ${batches.length} 批`);
console.log(`每批长度：${batches.map((b) => b.length).join(', ')}（注意最后一批不足 100）`);

// 典型场景二：把一维数组按行转成二维表格
const flatNumbers = [1, 2, 3, 4, 5, 6, 7];
const rows = chunk(flatNumbers, 3);
console.log(`[1..7] 每 3 个一行 -> ${JSON.stringify(rows)}`);
console.log('  手写这个逻辑时，最容易错的就是最后一行不足 size 时的边界处理。');

// 边界：size 大于数组长度 -> 只有一个块
console.log(`chunk([1,2], 10) -> ${JSON.stringify(chunk([1, 2], 10))}`);
// 边界：空数组 -> 空数组（不是 [[]]，这一点很重要）
console.log(`chunk([], 3) -> ${JSON.stringify(chunk([], 3))}`);
// 边界：size 为 0 或负数 -> 返回空数组
console.log(`chunk([1,2,3], 0) -> ${JSON.stringify(chunk([1, 2, 3], 0))}`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 2. uniqBy：按字段对对象数组去重 ---');

// 来自接口的用户列表，id 重复（真实场景：分页边界重复、多来源合并）
const rawUsers = [
  { id: 1, name: 'Alice', dept: '研发' },
  { id: 2, name: 'Bob', dept: '研发' },
  { id: 1, name: 'Alice（重复）', dept: '研发' },
  { id: 3, name: 'Carol', dept: '市场' },
  { id: 2, name: 'Bob（重复）', dept: '研发' },
];

// 第二个参数是 iteratee：可以是属性名，也可以是一个函数
const uniqueUsers = uniqBy(rawUsers, 'id');
console.log(`去重前 ${rawUsers.length} 条，去重后 ${uniqueUsers.length} 条：`);
console.log('  ' + uniqueUsers.map((u) => `${u.id}:${u.name}`).join(', '));
console.log('  关键行为：uniqBy 保留的是"第一次出现"的元素 —— 所以 name 是 Alice 而不是 Alice（重复）。');
console.log('  如果业务上要保留最新记录，需要先按时间排序或先 reverse()。');

// iteratee 传函数：按"部门 + 前两个字符"组合键去重
const byDeptAndInitial = uniqBy(rawUsers, (u) => `${u.dept}-${u.name.slice(0, 2)}`);
console.log(`按"部门+名字前两字"去重 -> ${byDeptAndInitial.length} 条`);

// 对比：uniq 只能用于基本类型（内部用 SameValueZero 比较，对象永远不相等）
console.log(`uniq([1,1,2,'2',2]) -> ${JSON.stringify(uniq([1, 1, 2, '2', 2]))}`);
console.log(`  uniq 对对象数组无效：uniq([{id:1},{id:1}]) -> ${JSON.stringify(uniq([{ id: 1 }, { id: 1 }]))}`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 3. groupBy：按字段分组（报表聚合的基础）---');

// 典型场景：把订单按状态分组，用于"待付款 3 单 / 已发货 5 单"这样的看板
const orders = [
  { no: 'A001', status: 'paid', amount: 120 },
  { no: 'A002', status: 'shipped', amount: 80 },
  { no: 'A003', status: 'paid', amount: 200 },
  { no: 'A004', status: 'pending', amount: 50 },
  { no: 'A005', status: 'shipped', amount: 300 },
];

const byStatus = groupBy(orders, 'status');
console.log('按状态分组（返回的是普通对象，键是分组的取值）：');
for (const [status, list] of Object.entries(byStatus)) {
  // 顺便演示最常见的后续操作：对每组求和
  const total = list.reduce((sum, o) => sum + o.amount, 0);
  console.log(`  ${status.padEnd(8)} ${list.length} 单，合计 ¥${total}`);
}

console.log(`  对象键的遍历顺序：${Object.keys(byStatus).join(' -> ')}`);
console.log('  注意：返回值是普通对象，所以键会被转成字符串（数字分组会变成字符串键）。');

// iteratee 传函数：按金额区间分组
const byAmountRange = groupBy(orders, (o) => (o.amount >= 200 ? '大额' : '小额'));
console.log(`按金额区间分组 -> 大额 ${byAmountRange['大额'].length} 单，小额 ${byAmountRange['小额'].length} 单`);

// 真实项目补充：分组后往往还要排序，把"数据最多的组"排前面
const sortedGroups = Object.entries(byStatus)
  .map(([key, list]) => ({ key, count: list.length, total: list.reduce((s, o) => s + o.amount, 0) }))
  .sort((a, b) => b.total - a.total);
console.log('按合计金额降序：', sortedGroups.map((g) => `${g.key}=¥${g.total}`).join(', '));
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 4. get：安全地按路径取深层属性 ---');

// 模拟一个字段严重缺失的接口响应（真实项目里这非常常见）
const apiResponse = {
  code: 0,
  data: {
    user: {
      profile: {
        nickname: '小明',
        // 注意：没有 avatar 字段
      },
      // 注意：没有 orders 字段
    },
  },
};

console.log('原始响应：', JSON.stringify(apiResponse));

// 不安全的写法（这里用 try/catch 演示它会抛错）：
try {
  const unsafe = apiResponse.data.user.orders.list;
  console.log('  直接访问 a.b.c.d 得到：', unsafe);
} catch (error) {
  console.log(`  直接访问 apiResponse.data.user.orders.list 抛错：${error.message}`);
}

// get 的三种用法：默认值、字符串路径、数组路径
console.log(`  get(响应, 'data.user.profile.nickname') -> ${get(apiResponse, 'data.user.profile.nickname')}`);
console.log(`  get(响应, 'data.user.profile.avatar', '默认头像.png') -> ${get(apiResponse, 'data.user.profile.avatar', '默认头像.png')}`);
console.log(`  get(响应, 'data.user.orders.list', []) -> ${JSON.stringify(get(apiResponse, 'data.user.orders.list', []))}`);
console.log(`  中间层为 null 也不会抛错：get({a: null}, 'a.b.c', '兜底') -> ${get({ a: null }, 'a.b.c', '兜底')}`);

// 路径里的数组下标
const withArray = { list: [{ name: '第一项' }, { name: '第二项' }] };
console.log(`  数组下标路径 get(obj, 'list[1].name') -> ${get(withArray, 'list[1].name')}`);
console.log(`  数组形式的路径 get(obj, ['list', 0, 'name']) -> ${get(withArray, ['list', 0, 'name'])}`);

// 重要陷阱：键名本身含点号时，必须用数组路径
const weirdKey = { 'a.b': { c: '这个键名里有小数点' } };
console.log(`  字符串路径 'a.b.c' 会被拆成 a -> b -> c，取到：${get(weirdKey, 'a.b.c', '取不到')}`);
console.log(`  数组路径 ['a.b', 'c'] 才能正确取到：${get(weirdKey, ['a.b', 'c'])}`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 5. set：按路径深层赋值（自动创建中间层）---');

// 典型场景：把后端返回的扁平数据，回填成表单需要的嵌套结构
const form = {};
set(form, 'user.profile.name', '小红');
set(form, 'user.profile.tags[0]', '新用户');
set(form, 'user.profile.tags[2]', 'VIP'); // 跳过下标 1，lodash 会用 undefined 填充
set(form, 'settings.theme', 'dark');
console.log('set 之后的表单对象：');
console.log('  ' + JSON.stringify(form));
console.log(`  数组空洞：tags[1] 是 undefined -> ${String(form.user.profile.tags[1])}`);
console.log(`  tags 长度：${form.user.profile.tags.length}`);

// set 也有函数版本：update(obj, path, updater)，基于原值计算新值
lodash.update(form, 'settings.theme', (t) => (t === 'dark' ? 'light' : 'dark'));
console.log(`  lodash.update 切换主题后 -> ${form.settings.theme}`);

// 关键陷阱：set 会直接修改原对象（有副作用）
const original = { a: { b: 1 } };
set(original, 'a.c', 2);
console.log(`  陷阱：set 直接修改了原对象，original 现在是 ${JSON.stringify(original)}`);
// 需要不可变更新时先深拷贝
const cloned = lodash.cloneDeep({ a: { b: 1 } });
set(cloned, 'a.c', 2);
console.log(`  用 cloneDeep 复制后再 set，原对象保持不变：${JSON.stringify({ a: { b: 1 } })}`);
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 6. debounce：让高频调用只执行最后一次 ---');

// 说明：为了让输出稳定可读，这里演示的是"同步可观察"的用法，
// 真正的防抖要靠定时器；最后一节会顺便验证取消功能。
// 更详细的 debounce/throttle 对比见 02_lodash_advanced.js。

/** 模拟搜索请求 */
const searchLog = [];
function doSearch(keyword) {
  searchLog.push(keyword);
  return `结果(${keyword})`;
}

const debouncedSearch = debounce(doSearch, 50);
console.log(`  debounce 返回的是一个新函数：${typeof debouncedSearch}`);
console.log(`  它带有附加方法：cancel=${typeof debouncedSearch.cancel}, flush=${typeof debouncedSearch.flush}`);

// 连续调用（模拟用户快速输入），只有最后一次会在 50ms 后真正执行
debouncedSearch('j');
debouncedSearch('ja');
debouncedSearch('jav');
debouncedSearch('java');
console.log(`  连续调用 4 次后立刻检查：searchLog = ${JSON.stringify(searchLog)}（还没有执行）`);

// 等待防抖窗口过去
await new Promise((resolve) => setTimeout(resolve, 80));
console.log(`  等待 80ms 后：searchLog = ${JSON.stringify(searchLog)}（只执行了最后一次）`);

// cancel：组件卸载时应当调用，避免回调在组件销毁后触发
debouncedSearch('this-should-be-cancelled');
debouncedSearch.cancel();
await new Promise((resolve) => setTimeout(resolve, 80));
console.log(`  调用 cancel() 后再等待：searchLog = ${JSON.stringify(searchLog)}（被取消的调用没有执行）`);

// 验证 leading 选项：第一次调用立即执行，后续等待期内的调用被忽略
const leadingLog = [];
const leadingDebounced = debounce((v) => leadingLog.push(v), 50, { leading: true, trailing: false });
leadingDebounced('first');
leadingDebounced('second');
console.log(`  leading:true 时首次调用立即执行：leadingLog = ${JSON.stringify(leadingLog)}`);
leadingDebounced.cancel(); // 清理，避免残留定时器让进程多活 50ms
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 7. 原生替代方案对照（新项目优先考虑原生）---');
// 用"lodash 方案 -> 原生方案"的逐行对照，比表格更适合中文混排的终端输出
const alternatives = [
  ['数组分块  chunk(arr, n)', '无原生替代（需手写 slice 循环）'],
  ['按字段去重 uniqBy(arr, "id")', '无原生替代（可用 Map 手写，约 5 行）'],
  ['分组      groupBy(arr, "k")', 'Object.groupBy(arr, fn)（ES2024，Node 21+）'],
  ['深层取值  get(obj, "a.b.c")', '可选链 obj?.a?.b?.c（现代项目首选）'],
  ['深层赋值  set(obj, "a.b", v)', '无原生替代（需手写递归）'],
  ['防抖      debounce(fn, ms)', '无原生替代（需手写定时器管理）'],
  ['深拷贝    cloneDeep(x)', 'structuredClone(x)（Node 17+）'],
];
for (const [lodashWay, nativeWay] of alternatives) {
  console.log(`  ${lodashWay.padEnd(32)} -> ${nativeWay}`);
}
console.log('');
console.log('  结论：get 在现代项目里基本可以被可选链（?.）替代；');
console.log('        其余几个仍值得引入 lodash，或用 lodash-es 按需导入以控制体积。');
console.log('');

// ---------------------------------------------------------------------------
// 自测：把上面的关键行为固化成断言，防止示例随版本变化而失效
// ---------------------------------------------------------------------------
import assert from 'node:assert/strict';

console.log('--- 8. 自测断言 ---');
assert.strictEqual(batches.length, 3);
assert.strictEqual(batches[2].length, 50);
assert.deepStrictEqual(chunk([], 3), []);
assert.strictEqual(uniqueUsers.length, 3);
assert.strictEqual(uniqueUsers[0].name, 'Alice', 'uniqBy 保留第一次出现的元素');
assert.strictEqual(byStatus.paid.length, 2);
assert.strictEqual(get(apiResponse, 'data.user.profile.avatar', '默认.png'), '默认.png');
assert.strictEqual(get(weirdKey, ['a.b', 'c']), '这个键名里有小数点');
assert.strictEqual(form.user.profile.name, '小红');
assert.deepStrictEqual(searchLog, ['java']);
console.log('  全部断言通过：示例行为与上文的文字说明一致。');
console.log('');
console.log('演示结束。');
