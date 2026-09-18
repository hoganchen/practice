/**
 * ============================================================================
 * 知识点：ES2024 新特性 —— Object.groupBy、Promise.withResolvers、RegExp v 标志、
 *         ArrayBuffer resize/transfer、Atomics.waitAsync
 * ============================================================================
 *
 * 【所属分类】34_modern_es_features —— 现代 ES 新特性
 * 【难度等级】高级
 * 【前置知识】08_arrays/、13_regexp/、18_async/、24_typed_arrays/、23_collections/
 *
 * 【也见】Promise.withResolvers 另见 18_async/11_promise_static_methods.js（Promise 静态方法专场）；
 *        RegExp v 标志另见 13_regexp/14_v_flag_and_set_operations.js（v 标志专文，覆盖集合运算与 \q{...}）。
 *        本文件是"ES2024 特性综述"，每项只给最小示例，细节以那两篇专题为准。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES2024（第 15 版 ECMAScript 标准，2024 年 6 月发布）的五组重点：
 *      (1) Object.groupBy() / Map.groupBy() —— 原生分组
 *      (2) Promise.withResolvers() —— 把 resolve/reject 暴露到外部
 *      (3) 正则 v 标志（unicodeSets）—— 字符类集合运算
 *      (4) ArrayBuffer.prototype.resize / transfer —— 可伸缩与零拷贝转移
 *      (5) Atomics.waitAsync —— 不阻塞主线程的等待
 *
 * 2. 为什么需要（真实项目场景）
 *    - 分组：报表按部门/状态聚合、日志按级别归档。以前每次都要手写
 *      一段几乎一模一样的 reduce 累积器，现在一行 Object.groupBy 搞定，
 *      而且返回值是"无原型对象"，不怕键名叫 `__proto__` 时被原型污染。
 *    - Promise.withResolvers：把 resolve/reject 交给外部（事件回调、
 *      第三方库的回调风格 API、测试里手工控制 Promise 落定时机）。
 *      以前必须写 `let resolve; const p = new Promise(r => resolve = r)` 这种别扭代码。
 *    - v 标志：ES2018 的 u 标志能表达"\p{Letter}"，但没法表达
 *      "字母里去掉元音"这种集合差；v 标志补齐了并集、交集、差集，还支持
 *      `\q{...}` 多字符串匹配，是处理 Unicode 文本的一大步。
 *    - resize/transfer：处理网络包、图像缓冲区时，能动态扩容；
 *      transfer 可以在不复制内存的前提下把缓冲区"移交"给 Worker。
 *    - Atomics.waitAsync：浏览器/Node 主线程禁止用 `Atomics.wait`（会阻塞事件循环），
 *      waitAsync 返回 Promise，既保住"等待共享内存变化"的能力又不卡线程。
 *
 * 3. 核心语法要点
 *    - `Object.groupBy(items, keyFn)`：返回一个**无原型对象**，键是字符串，
 *      值是元素数组；数组顺序按"首次出现"决定。
 *    - `Map.groupBy(items, keyFn)`：返回 Map，键可以是**任意值**（对象、数字等）。
 *    - `Promise.withResolvers()`：返回 `{ promise, resolve, reject }` 三件套。
 *    - v 标志：`/[[a-z]&&[^aeiou]]/v` 交集、`/[\p{Letter}--[aeiou]]/v` 差集、
 *      `/[[a-c][x-z]]/v` 并集；还有一个 u 标志没有的 `\q{abc|def}` 多字符串匹配。
 *    - v 模式下"保留字符"必须转义：`( ) [ ] { } / - \ |`。
 *    - `new ArrayBuffer(n, { maxByteLength })` 创建可伸缩缓冲区；
 *      `buf.resize(newLen)` 原地改大小；`buf.resizable` / `buf.maxByteLength` 可查。
 *    - `buf.transfer(newLen?)`：返回新缓冲区并把原缓冲区**detach**（byteLength 变 0）；
 *      `transferToFixedLength` 则保证新缓冲区不可伸缩。
 *    - `Atomics.waitAsync(ta, index, value)`：返回 `{ async, value }`；
 *      值匹配时 async 为 true、value 是 Promise，否则 async 为 false、
 *      value 是字符串 'not-equal'。
 *
 * 4. 常见陷阱
 *    - groupBy 返回的是 null 原型对象：`result.hasOwnProperty`、`result.toString`
 *      统统不存在，要用 `Object.hasOwn(result, k)`；也别直接把它当普通对象塞给
 *      期望原型方法的库。
 *    - 分组结果是**浅拷贝的引用数组**，改分组里的对象会改到原对象。
 *    - `Promise.withResolvers` 只是语法糖，没有取消能力；忘记 reject 会导致悬挂。
 *    - v 和 u 标志**互斥**，不能同时写 `/x/uv`。
 *    - v 模式下 `[-]` 会直接抛语法错误，必须写 `[\-]` —— 从 u 迁移时这是最常见的坑。
 *    - `resize()` 只对 resizable 的缓冲区可用，否则抛 TypeError；
 *      把缓冲区调小后，超出部分的数据永久丢失。
 *    - `transfer()` 之后原缓冲区 `byteLength` 变成 0，任何视图都失效，
 *      再去读写会抛 TypeError。这是"移动语义"，不是"复制语义"。
 *    - `Atomics.waitAsync` 只在**共享**内存（SharedArrayBuffer）上可用，
 *      普通 Int32Array 会抛 TypeError；且只有 async 为 true 时才有 Promise 可 await。
 *    - 【本机实测坑，Node v24.16.0】当事件循环里"没有其它待处理任务"时，
 *      直接 `await Atomics.waitAsync(...).value` 会**永远不落定**，Node 会以
 *      "Detected unsettled top-level await" 退出（退出码 13）。
 *      因为 waitAsync 的超时回调不算"能让事件循环保持存活的句柄"。
 *      工程做法：用 `Promise.race` 加一个兜底 setTimeout，或保证还有别的任务在排队。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 34_modern_es_features/04_es2024_features.js
 *
 * 【预期输出】
 *   依次打印 5 个小节。每个特性都标注"本机支持：是/否"，
 *   不支持时自动走手写等价实现分支。本机 Node v24.16.0 全部原生支持。
 * ============================================================================
 */

console.log('='.repeat(70));
console.log('ES2024 新特性演示');
console.log('当前 Node 版本：', process.version);
console.log('='.repeat(70));

// ---------------------------------------------------------------------------
console.log('\n--- 1. Object.groupBy / Map.groupBy（含与手写 reduce 的对比）---');
// ---------------------------------------------------------------------------

console.log('本机支持 Object.groupBy：' + (typeof Object.groupBy === 'function' ? '是' : '否'));
console.log('本机支持 Map.groupBy：' + (typeof Map.groupBy === 'function' ? '是' : '否'));

// 场景：一份销售记录，按地区分组统计
const sales = [
  { region: '华东', product: '键盘', amount: 199 },
  { region: '华北', product: '鼠标', amount: 99 },
  { region: '华东', product: '显示器', amount: 1299 },
  { region: '华南', product: '键盘', amount: 199 },
  { region: '华北', product: '显示器', amount: 1299 },
  { region: '华东', product: '鼠标', amount: 99 },
];

// --- 以前怎么写：手写 reduce 累积器 ---
// 这段代码每个项目里都会重复出现，而且必须自己处理"键是否已存在"。
const groupedByReduce = sales.reduce((acc, item) => {
  if (!acc[item.region]) {
    acc[item.region] = [];
  }
  acc[item.region].push(item);
  return acc;
}, {});
console.log('以前（手写 reduce）：');
for (const [region, items] of Object.entries(groupedByReduce)) {
  console.log(`  ${region}: ${items.length} 条 -> ${items.map((i) => i.product).join('、')}`);
}

// 手写版本还有个隐患：如果分组键恰好是 '__proto__'，'acc["__proto__"]' 读到的是
// Object.prototype（真值！），于是"已存在"判断失效，后续 push 直接崩。
try {
  sales.reduce((acc, item) => {
    if (!acc['__proto__']) acc['__proto__'] = [];
    acc['__proto__'].push(item);
    return acc;
  }, {});
} catch (err) {
  console.log("  手写 reduce 的隐患：键名 '__proto__' 时 →", err.constructor.name + ':', err.message);
}
// 更隐蔽的变体：如果分组键来自用户输入，写 acc[key] = value 会造成原型污染。
// Object.groupBy 返回无原型对象，从根上杜绝了这个问题。

// --- 现在怎么写：Object.groupBy ---
if (typeof Object.groupBy === 'function') {
  const grouped = Object.groupBy(sales, (item) => item.region);
  console.log('现在（Object.groupBy）：');
  for (const [region, items] of Object.entries(grouped)) {
    console.log(`  ${region}: ${items.length} 条 -> ${items.map((i) => i.product).join('、')}`);
  }
  console.log('  结果与手写 reduce 一致：', JSON.stringify(grouped) === JSON.stringify(groupedByReduce));
  console.log('  原型是 null 吗：', Object.getPrototypeOf(grouped) === null, '← 所以不怕原型污染');
  console.log("  键名 '__proto__' 也安全：", Object.keys(Object.groupBy([{ k: '__proto__', v: 1 }], (x) => x.k)));
  // 陷阱：null 原型对象没有 hasOwnProperty
  try {
    grouped.hasOwnProperty('华东');
  } catch (err) {
    console.log('  陷阱演示（没有 hasOwnProperty）→', err.constructor.name + ':', err.message);
  }
  console.log('  正确检查方式 Object.hasOwn：', Object.hasOwn(grouped, '华东'));

  // 分组键会被转成字符串（这是 Object.groupBy 的特性）
  const byAmount = Object.groupBy(sales, (i) => i.amount);
  console.log('  数字键会被字符串化：', Object.keys(byAmount));

  // 分组后做聚合：按地区求和
  const sumByRegion = Object.fromEntries(
    Object.entries(grouped).map(([r, items]) => [r, items.reduce((s, i) => s + i.amount, 0)]),
  );
  console.log('  再聚合（按地区求和）：', sumByRegion);
} else {
  console.log('当前 Node 版本不支持，以下是等价实现');
  const objectGroupBy = (items, keyFn) =>
    Object.assign(Object.create(null), [...items].reduce((acc, item) => {
      const k = String(keyFn(item));
      (acc[k] ??= []).push(item);
      return acc;
    }, {}));
  console.log('  等价实现结果：', JSON.stringify(Object.keys(objectGroupBy(sales, (i) => i.region))));
}

// --- Map.groupBy：键可以是任意类型 ---
// 这是它相对 Object.groupBy 的核心优势：对象、数字、Symbol、布尔都能当键。
const users = [
  { name: 'A', dept: { id: 1, name: '研发' } },
  { name: 'B', dept: { id: 1, name: '研发' } },
  { name: 'C', dept: { id: 2, name: '市场' } },
];
const deptRnd = users[0].dept;
const deptMkt = users[2].dept;

if (typeof Map.groupBy === 'function') {
  // 用"对象引用"当键：只有同一个对象才归到一组
  const byDeptRef = Map.groupBy(users, (u) => u.dept);
  console.log('\nMap.groupBy 用对象引用作键，size =', byDeptRef.size);
  console.log('  查 deptRnd 组：', byDeptRef.get(deptRnd).map((u) => u.name));
  console.log('  查 deptMkt 组：', byDeptRef.get(deptMkt).map((u) => u.name));
  console.log('  新建一个内容相同的对象去查 →', byDeptRef.get({ id: 1, name: '研发' }), '← 引用不同，查不到');
  console.log('  对比：如果按 id 分组则能查到 ->', Map.groupBy(users, (u) => u.dept.id).get(1).map((u) => u.name));

  // 用布尔/数字/Symbol 作键
  const byOdd = Map.groupBy([1, 2, 3, 4, 5], (n) => n % 2 === 1);
  console.log('  布尔键分组：', JSON.stringify([...byOdd.entries()]));
} else {
  console.log('当前 Node 版本不支持，以下是等价实现');
  const mapGroupBy = (items, keyFn) =>
    [...items].reduce((m, item) => {
      const k = keyFn(item);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(item);
      return m;
    }, new Map());
  console.log('  等价实现：', JSON.stringify([...mapGroupBy([1, 2, 3], (n) => n % 2).entries()]));
}

// ---------------------------------------------------------------------------
console.log('\n--- 2. Promise.withResolvers ---');
// ---------------------------------------------------------------------------

const pwrSupported = typeof Promise.withResolvers === 'function';
console.log('本机支持：' + (pwrSupported ? '是' : '否'));

// --- 以前怎么写：必须借助"外层变量 + 执行器同步调用"这个技巧 ---
let outerResolve;
let outerReject;
const legacyPromise = new Promise((resolve, reject) => {
  outerResolve = resolve; // 执行器是同步执行的，所以这里能"偷"到 resolve
  outerReject = reject;
});
console.log('以前（外层变量偷 resolve）：', typeof outerResolve, typeof outerReject);

// --- 现在怎么写 ---
const { promise, resolve, reject } = Promise.withResolvers();
console.log('现在（Promise.withResolvers）：拿到', typeof resolve, '和', typeof reject);
// resolve/reject 可以自由地"传出去"，之后任意时刻调用
setTimeout(() => resolve('延迟 10ms 后才落定'), 10);
console.log('  await 的结果：', await promise);

// 真实场景 1：把回调风格 API 包装成 Promise（不用 promisify）
function readValueLater(callback) {
  setTimeout(() => callback(null, 42), 5);
}
const wrapped = Promise.withResolvers();
readValueLater((err, value) => (err ? wrapped.reject(err) : wrapped.resolve(value)));
console.log('  [场景] 回调转 Promise ->', await wrapped.promise);

// 真实场景 2：从多个事件里取"第一个到达的"
const race = Promise.withResolvers();
setTimeout(() => race.resolve('A 先到'), 5);
setTimeout(() => race.resolve('B 后到（会被忽略）'), 20);
console.log('  [场景] 手动控制竞速 ->', await race.promise);

// 真实场景 3：测试里手工控制落定时机
const manual = Promise.withResolvers();
manual.reject(new Error('模拟网络错误'));
try {
  await manual.promise;
} catch (err) {
  console.log('  [场景] 手工 reject ->', err.message);
}

// 等价实现（也顺便解释了它为什么能工作）
if (!pwrSupported) {
  console.log('当前 Node 版本不支持，以下是等价实现');
  Promise.withResolvers = function withResolvers() {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

// ---------------------------------------------------------------------------
console.log('\n--- 3. 正则 v 标志（unicodeSets）：字符类集合运算 ---');
// ---------------------------------------------------------------------------

let vFlagSupported = false;
try {
  vFlagSupported = new RegExp('[[a-z]&&[^aeiou]]', 'v').test('b') === true;
} catch {
  vFlagSupported = false;
}
console.log('本机支持：' + (vFlagSupported ? '是' : '否'));

// 先回顾 u 标志的能力边界：\p{...} 能表示"某一类字符"，但不能做集合运算
const uFlag = /\p{Letter}/u;
console.log('u 标志能做：\\p{Letter} 匹配字母 ->', uFlag.test('中'), uFlag.test('1'));

if (vFlagSupported) {
  // --- 3.1 交集 && ---
  // 写法 A（推荐）：两边都用方括号包起来的嵌套类
  const noVowel = /[[a-z]&&[^aeiou]]/v;
  console.log('\n交集 [[a-z]&&[^aeiou]]：');
  console.log('  "b" ->', noVowel.test('b'), '| "a" ->', noVowel.test('a'), '| "e" ->', noVowel.test('e'));
  console.log('  完整示例：找出 "hello world" 里的辅音 ->', 'hello world'.match(/[[a-z]&&[^aeiou]]/gv).join(''));

  // 交集也可以和 Unicode 属性配合
  const latinLetters = /[\p{Letter}&&\p{Script=Latin}]/v;
  console.log('  交集 \\p{Letter}&&\\p{Script=Latin}："A" ->', latinLetters.test('A'), '| "中" ->', latinLetters.test('中'));

  // --- 3.2 差集 -- ---
  const letterWithoutVowel = /[\p{Letter}--[aeiouAEIOU]]/v;
  console.log('\n差集 [\\p{Letter}--[aeiou]]："b" ->', letterWithoutVowel.test('b'), '| "i" ->', letterWithoutVowel.test('i'));

  // --- 3.3 并集（显式写出来）---
  const union = /[[a-c][x-z]]/v;
  console.log('并集 [[a-c][x-z]]："b" ->', union.test('b'), '| "y" ->', union.test('y'), '| "m" ->', union.test('m'));

  // --- 3.4 关键区别：方括号不能省 ---
  // 为什么必须写 [[a-z]&&[^aeiou]] 而不是 [a-z&&[^aeiou]]？
  // 因为规范里 && 与 -- 的操作数必须是"类集合操作数"（嵌套类 / \p{...} / 单字符），
  // 而 a-z 是一个"范围"，范围不能直接当操作数。
  try {
    new RegExp('[a-z&&[^aeiou]]', 'v');
  } catch (err) {
    console.log('\n陷阱演示（范围直接当操作数，少一层方括号）→', err.message);
  }

  // --- 3.5 v 模式的转义规则：保留字符必须转义 ---
  try {
    new RegExp('[-]', 'v');
  } catch (err) {
    console.log('陷阱演示（v 模式下 [-] 不合法）→', err.message);
  }
  console.log('  正确写法 [\\-] ->', new RegExp('[\\-]', 'v').test('-'));
  console.log('  v 模式下需转义的字符： ( ) [ ] { } / - \\ |');

  // --- 3.6 新增能力：\\q{...} 多字符串匹配 ---
  // u 标志里没法表达"匹配下面任意一个完整字符串"，v 标志用 \q 解决了。
  const keywords = /[\q{const|let|var}]/v;
  console.log('\n\\q{} 多字符串匹配：');
  console.log('  "const" ->', keywords.test('const'), '| "let" ->', keywords.test('let'), '| "con" ->', keywords.test('con'));
  console.log('  在代码里找出所有关键字 ->', 'const a = 1; let b = 2; var c = 3;'.match(/[\q{const|let|var}]/gv));
  // 注意：一定要带 v 标志！少了 v，`\q` 会被当成"转义字母 q"，方括号退化为普通字符类，
  // 于是变成"匹配 c/o/n/s/t/l/e/v/a/r 这些单个字母"，行为完全不同。
  console.log('  少了 v 标志的错误结果 ->', 'const a = 1; let b = 2; var c = 3;'.match(/[\q{const|let|var}]/g));

  // --- 3.7 实战：统计一段文本里"非元音字母"的分布 ---
  const text = 'The quick brown fox jumps over the lazy dog';
  const consonantCounts = {};
  for (const ch of text.toLowerCase().match(/[[a-z]&&[^aeiou]]/gv) ?? []) {
    consonantCounts[ch] = (consonantCounts[ch] ?? 0) + 1;
  }
  console.log('\n实战：统计辅音出现次数（前 5）->');
  console.log(' ', Object.entries(consonantCounts).sort((a, b) => b[1] - a[1]).slice(0, 5));

  console.log('\n补充：v 与 u 互斥，/x/uv 会直接抛语法错误');
  try {
    new RegExp('a', 'uv');
  } catch (err) {
    console.log('  →', err.message);
  }
} else {
  // 降级方案：用 u 标志 + 手工过滤来表达同样的语义
  console.log('当前 Node 版本不支持，以下是等价实现');
  const noVowelFallback = (str) =>
    [...str].filter((ch) => /[a-z]/.test(ch) && !/[aeiou]/.test(ch));
  console.log('  等价实现（u 标志 + 手工过滤辅音）：', noVowelFallback('hello world').join(''));
  const letterWithoutVowelFallback = (str) =>
    [...str].filter((ch) => /\p{Letter}/u.test(ch) && !/[aeiouAEIOU]/.test(ch));
  console.log('  等价实现（\\p{Letter} 差集）：', letterWithoutVowelFallback('hello 世界').join(''));
}

// ---------------------------------------------------------------------------
console.log('\n--- 4. ArrayBuffer.prototype.resize / transfer ---');
// ---------------------------------------------------------------------------

const resizeSupported = typeof ArrayBuffer.prototype.resize === 'function';
const transferSupported = typeof ArrayBuffer.prototype.transfer === 'function';
console.log('本机支持 resize：' + (resizeSupported ? '是' : '否'));
console.log('本机支持 transfer：' + (transferSupported ? '是' : '否'));

// --- 以前怎么写 ---
// 缓冲区一旦创建，容量就固定了；想"扩容"只能新建一个、把旧数据拷过去。
const oldBuf = new ArrayBuffer(4);
new Uint8Array(oldBuf).set([1, 2, 3, 4]);
const biggerBuf = new ArrayBuffer(8);
new Uint8Array(biggerBuf).set(new Uint8Array(oldBuf)); // 复制
console.log('以前（新建 + 手动复制）：旧', oldBuf.byteLength, '字节 -> 新', biggerBuf.byteLength, '字节，数据', [...new Uint8Array(biggerBuf)]);

if (resizeSupported) {
  // --- 现在怎么写 1：可伸缩缓冲区 ---
  // 第二个参数 maxByteLength 指定上限，创建时可以不立刻占满内存
  const growable = new ArrayBuffer(4, { maxByteLength: 16 });
  console.log('\n现在（可伸缩缓冲区）：');
  console.log('  byteLength =', growable.byteLength, '| maxByteLength =', growable.maxByteLength, '| resizable =', growable.resizable);

  // 先写入 4 个字节
  const view1 = new Uint8Array(growable);
  view1.set([10, 20, 30, 40]);
  console.log('  初始内容：', [...view1]);

  // 原地扩容，不需要复制，原有数据保留
  growable.resize(8);
  const view2 = new Uint8Array(growable); // 视图要重新建（旧视图长度是 4）
  console.log('  resize(8) 后：byteLength =', growable.byteLength, '| 内容（前 4 位仍是原数据）：', [...view2]);
  view2.set([50, 60, 70, 80], 4); // 填充新空间
  console.log('  填满后：', [...view2]);

  // 缩小会永久丢失超出部分的数据
  growable.resize(2);
  console.log('  resize(2) 后内容（后 6 字节已永久丢失）：', [...new Uint8Array(growable)]);
  console.log('  注意：缩小后 byteLength =', growable.byteLength);

  // 陷阱：超过 maxByteLength 会抛 RangeError
  try {
    growable.resize(999);
  } catch (err) {
    console.log('  陷阱演示（超过 maxByteLength）→', err.constructor.name + ':', err.message);
  }

  // 陷阱：对非 resizable 的缓冲区调用 resize
  try {
    new ArrayBuffer(4).resize(8);
  } catch (err) {
    console.log('  陷阱演示（普通缓冲区不能 resize）→', err.constructor.name + ':', err.message);
  }
} else {
  console.log('当前 Node 版本不支持，以下是等价实现');
  class GrowableBuffer {
    constructor(size, { maxByteLength = Infinity } = {}) {
      this._buf = new ArrayBuffer(size);
      this.maxByteLength = maxByteLength;
    }
    get byteLength() {
      return this._buf.byteLength;
    }
    get resizable() {
      return true;
    }
    resize(newLen) {
      if (newLen > this.maxByteLength) throw new RangeError('Invalid array buffer length');
      const next = new ArrayBuffer(newLen);
      new Uint8Array(next).set(new Uint8Array(this._buf).subarray(0, Math.min(newLen, this._buf.byteLength)));
      this._buf = next;
    }
  }
  const gb = new GrowableBuffer(4, { maxByteLength: 16 });
  gb.resize(8);
  console.log('  等价实现 resize 后长度：', gb.byteLength, '（注意：视图会失效，语义上有差异）');
}

if (transferSupported) {
  // --- 现在怎么写 2：transfer（移动语义，零拷贝）---
  // 把缓冲区"移交"出去，原缓冲区被 detach。
  // 典型用途：postMessage 给 Worker 时不复制内存（可转移对象）。
  const src = new ArrayBuffer(4);
  new Uint8Array(src).set([1, 2, 3, 4]);
  console.log('\ntransfer 前：源 byteLength =', src.byteLength);

  const moved = src.transfer(8); // 移交并顺便扩到 8 字节
  console.log('transfer(8) 后：');
  console.log('  新缓冲区 byteLength =', moved.byteLength, '内容前 4 位 =', [...new Uint8Array(moved).subarray(0, 4)]);
  console.log('  源缓冲区 byteLength =', src.byteLength, '| detached =', src.detached, '← 源已被"掏空"');

  // 陷阱：detach 之后原缓冲区彻底不可用
  try {
    new Uint8Array(src);
  } catch (err) {
    console.log('  陷阱演示（访问已 detach 的缓冲区）→', err.constructor.name + ':', err.message);
  }

  // transfer() 不带参数 = 等长移交
  const b = new ArrayBuffer(2);
  const b2 = b.transfer();
  console.log('  transfer() 不带参数：新长度 =', b2.byteLength, '| 源 detached =', b.detached);

  // transferToFixedLength：新缓冲区一定不可伸缩
  const resizableSrc = new ArrayBuffer(4, { maxByteLength: 8 });
  const fixed = resizableSrc.transferToFixedLength(4);
  console.log('  transferToFixedLength 后新缓冲区 resizable =', fixed.resizable, '← 强制不可伸缩');
  console.log('  对比 transfer 会保留可伸缩性：', new ArrayBuffer(4, { maxByteLength: 8 }).transfer().resizable);
} else {
  console.log('当前 Node 版本不支持，以下是等价实现');
  console.log('  用 slice(0) 复制一份后把原引用置空，语义上接近但**有内存拷贝开销**，');
  console.log('  而且无法像 transfer 那样真正把原缓冲区 detach 掉。');
}

// ---------------------------------------------------------------------------
console.log('\n--- 5. Atomics.waitAsync 简介 ---');
// ---------------------------------------------------------------------------

const waitAsyncSupported = typeof Atomics.waitAsync === 'function';
console.log('本机支持：' + (waitAsyncSupported ? '是' : '否'));

// 背景：Atomics.wait 是同步阻塞的，在浏览器主线程会直接抛错
// （"not allowed to block the main thread"）。Node 主线程同理受限。
// Atomics.waitAsync 返回一个 Promise，既不阻塞线程，又保留"等共享内存变化"的能力。
// 它作用在 SharedArrayBuffer 上，是 Worker 之间同步的标准手段。

if (waitAsyncSupported) {
  const sab = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 1);
  const shared = new Int32Array(sab);
  shared[0] = 0; // 初始值必须和 waitAsync 期望的值一致，否则立即返回 'not-equal'

  // --- 5.1 值不匹配：立即返回，不产生 Promise ---
  const notEqual = Atomics.waitAsync(shared, 0, 999);
  console.log('值不匹配时：async =', notEqual.async, '| value =', notEqual.value);

  // --- 5.2 值匹配：返回 Promise，等别人 notify 或超时 ---
  const waiter = Atomics.waitAsync(shared, 0, 0);
  console.log('值匹配时：async =', waiter.async, '| value 是 Promise 吗 =', waiter.value instanceof Promise);

  // 模拟"另一个线程"修改共享内存并唤醒等待者
  setTimeout(() => {
    console.log('  [模拟 Worker] 修改共享内存 0 -> 1，并调用 Atomics.notify');
    Atomics.store(shared, 0, 1);
    const woken = Atomics.notify(shared, 0, 1); // 唤醒 1 个等待者
    console.log('  [模拟 Worker] 被唤醒的等待者数量 =', woken);
  }, 20);

  const result = await waiter.value;
  console.log('等待结果：', result, '（"ok" 表示被 notify 唤醒）');
  console.log('  共享内存当前值：', Atomics.load(shared, 0));

  // --- 5.3 超时：即使没人 notify 也会返回 'timed-out' ---
  // ⚠️ 本机实测（Node v24.16.0）的一个坑：
  //   `await Atomics.waitAsync(...).value` 在"事件循环中没有其它待处理任务"时
  //   **永远不会落定**，进程会直接以 "Detected unsettled top-level await" 退出（退出码 13）。
  //   原因：waitAsync 的超时回调不算是能让 Node 事件循环保持存活的句柄，
  //   事件循环判定"没事做了"就退出了，超时任务根本没机会执行。
  //   解决办法有两个：① 保证还有别的待处理任务（比如一个 keep-alive 定时器）；
  //   ② 用 Promise.race 加一层兜底（工程上更推荐，见下面的写法）。
  const sab2 = new SharedArrayBuffer(4);
  const shared2 = new Int32Array(sab2);
  const timeoutWaiter = Atomics.waitAsync(shared2, 0, 0, 30); // 30ms 超时

  const t0 = Date.now();
  const timeoutResult = await Promise.race([
    timeoutWaiter.value, // 正常路径：waitAsync 自己超时
    // 兜底路径：即使 waitAsync 不落定，也能让事件循环活到这一刻并给出提示
    new Promise((res) => setTimeout(() => res('（兜底定时器触发）'), 200)),
  ]);
  console.log('超时场景：', timeoutResult, `（耗时约 ${Date.now() - t0}ms，"timed-out" 表示等超时了）`);

  // 对照验证：只要有一个"普通定时器"在等待，直接 await 也是能落定的
  const keepAlive = new Promise((res) => setTimeout(() => res('keep-alive'), 200));
  const tw2 = Atomics.waitAsync(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
  const r2 = await tw2.value; // 此时事件循环里有 keepAlive 这个待处理任务，所以能正常落定
  await keepAlive;
  console.log('有了 keep-alive 定时器后，直接 await 也能拿到：', r2);

  // --- 5.4 陷阱：普通（非共享）TypedArray 不能用 ---
  try {
    Atomics.waitAsync(new Int32Array(1), 0, 0);
  } catch (err) {
    console.log('陷阱演示（非共享内存）→', err.constructor.name + ':', err.message);
  }

  // --- 5.5 对比：在 Node 主线程直接 Atomics.wait 会怎样 ---
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 0);
    console.log('Atomics.wait 在主线程：居然没抛错（说明当前线程允许阻塞）');
  } catch (err) {
    console.log('Atomics.wait 在主线程 →', err.constructor.name + ':', err.message);
  }

  console.log('\n小结：waitAsync 的返回结构是 { async, value } 双形态，');
  console.log('      用之前必须先判断 async 是 true 还是 false，这是最容易写错的地方。');
} else {
  // 降级：用同步轮询模拟"等待共享内存变化"
  console.log('当前 Node 版本不支持，以下是等价实现');
  const sab = new SharedArrayBuffer(4);
  const shared = new Int32Array(sab);
  shared[0] = 0;
  setTimeout(() => {
    Atomics.store(shared, 0, 1);
  }, 20);
  const deadline = Date.now() + 500;
  while (Atomics.load(shared, 0) === 0 && Date.now() < deadline) {
    // 忙等：真实代码里绝不该这么写，仅用于演示"等待"语义
  }
  console.log('  等价实现（忙等轮询）结果：', Atomics.load(shared, 0), '→ 等到值变化了');
}

console.log('\n' + '='.repeat(70));
console.log('ES2024 全部小节演示完毕，进程正常退出（退出码 0）');
console.log('='.repeat(70));
