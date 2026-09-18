/**
 * ============================================================================
 * 知识点：lodash 进阶 —— debounce / throttle / memoize / cloneDeep / merge 与原生实现对比
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】进阶
 * 【前置知识】29_npm_libraries/01_lodash_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这五个函数代表了 lodash 最有价值的一类能力：**处理"难以手写正确"的边界**。
 *      debounce(fn, wait)   ：停止触发 wait 毫秒后才执行（等待"安静下来"）
 *      throttle(fn, wait)   ：每 wait 毫秒最多执行一次（"匀速放行"）
 *      memoize(fn, resolver)：缓存函数结果，相同输入直接返回缓存
 *      cloneDeep(value)     ：深拷贝（递归复制所有层级）
 *      merge(target, ...src)：深合并（递归合并对象与数组元素）
 *
 * 2. 为什么需要（真实项目里怎么用）
 *      - debounce：搜索框输入联想、表单自动保存、窗口 resize 后重算布局。
 *        用户每敲一个字符就发一次请求，一个长词就是 10 次请求。
 *      - throttle：滚动加载更多、鼠标移动跟随的浮层、按钮防连点。
 *        它保证"无论触发多频繁，处理频率上限是 1/wait"。
 *      - memoize：把昂贵的纯计算（大数组排序/聚合、正则编译、递归斐波那契）
 *        的结果缓存起来。React 的 useMemo 就是同一思想在渲染层的实现。
 *      - cloneDeep：需要"不可变更新"时（Redux reducer、表单草稿），
 *        必须复制一份再改，否则会直接改到原状态。
 *      - merge：配置合并（默认配置 + 用户配置 + 环境变量覆盖），
 *        这是几乎所有工具库和框架启动时都要做的事。
 *
 * 3. 核心语法要点
 *    debounce(fn, wait, { leading, trailing, maxWait })
 *        默认 leading=false, trailing=true（等安静后执行一次）
 *        { leading: true } -> 首次立即执行
 *        { maxWait: 1000 } -> 无论多频繁，最长 1000ms 必执行一次（防止"永远等不到安静"）
 *        返回的函数带 .cancel() 与 .flush()
 *    throttle(fn, wait, { leading, trailing })
 *        等价于 debounce 的 { leading: true, trailing: true, maxWait: wait } 变体
 *        返回的函数同样带 .cancel()
 *    memoize(fn, resolver)
 *        默认用第一个参数作为缓存键（会被 String() 转换成字符串！）
 *        resolver 返回自定义缓存键；也可用 memoize.Cache 替换缓存实现（如 LRU）
 *    cloneDeep(value)
 *        支持循环引用、Date、RegExp、Map、Set、Buffer、TypedArray
 *    merge(object, ...sources)
 *        会直接修改第一个参数（有副作用）；数组按下标递归合并而不是替换
 *
 * 4. 常见陷阱
 *    - throttle 与 debounce 搞反：想"限流"却用了 debounce，会导致滚动过程中
 *      长时间不触发（因为一直在滚动 = 一直"不安静"）。
 *    - memoize 的默认键是字符串化后的第一个参数：
 *      memoize(fn)({id:1}) 与 memoize(fn)({id:1}) 会因为都变成 "[object Object]" 而命中同一个缓存 ——
 *      这是真实项目里非常隐蔽的 bug，必须传 resolver。
 *    - memoize 不会自动失效：数据变了缓存还在，需要自己包一层或换 LRU 缓存。
 *    - cloneDeep 不复制函数与原型链上的自定义方法（函数是共享引用），
 *      类实例深拷贝后可能丢失行为。
 *    - structuredClone 不能克隆函数、Symbol、DOM 节点，遇到会抛 DataCloneError；
 *      但 cloneDeep 能"静默"处理这些（复制成 {} 或共享引用）—— 各有取舍。
 *    - merge 合并数组时是按下标合并，[1,2,3] 与 [9] 合并得到 [9,2,3] 而不是 [9]。
 *      想整体替换数组需要自己处理。
 *    - merge 原型污染：旧版本 lodash（< 4.17.12）存在 __proto__ 注入漏洞，
 *      升级到 4.17.21 后已修复 —— 这也是"为什么必须锁版本、看安全公告"的例子。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/02_lodash_advanced.js
 *
 * 【预期输出】
 *   用受控的定时器等待演示 debounce / throttle / memoize 的实际行为差异，
 *   并打印 cloneDeep / merge 与原生实现的对比结果。退出码 0。
 * ============================================================================
 */

import lodash from 'lodash';
import assert from 'node:assert/strict';

const { debounce, throttle, memoize, cloneDeep, merge } = lodash;

/** 让代码等待 ms 毫秒的可读封装 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

console.log(`--- 0. lodash 版本：${lodash.VERSION} ---`);
console.log('');

// ===========================================================================
console.log('--- 1. debounce：等待"安静"后执行最后一次 ---');
// ===========================================================================

const debounceLog = [];
/** 被防抖包装的原始函数：记录每次真正执行的时刻与参数 */
const rawSearch = (keyword) => {
  debounceLog.push({ keyword, at: Date.now() });
  return `结果(${keyword})`;
};

const debouncedSearch = debounce(rawSearch, 60);

const t0 = Date.now();
// 模拟用户以 20ms 的间隔快速输入 5 个字符（比 60ms 的防抖窗口快得多）
for (const keyword of ['j', 'ja', 'jav', 'java', 'javas']) {
  debouncedSearch(keyword);
  await sleep(20);
}
console.log(`  连续输入 5 次（间隔 20ms，防抖窗口 60ms），已耗时 ${Date.now() - t0}ms`);
console.log(`  执行记录条数：${debounceLog.length}（此时应为 0，因为输入从未停止超过 60ms）`);

await sleep(100); // 停止输入，等过防抖窗口
console.log(`  停止输入后再等待 100ms：执行记录 = ${JSON.stringify(debounceLog.map((r) => r.keyword))}`);
console.log('  结论：5 次调用只产生了 1 次真正的执行，且参数是最后一次的 "javas"。');

// maxWait：即使一直不停地调用，也保证最长 maxWait 执行一次
const maxWaitLog = [];
const withMaxWait = debounce((n) => maxWaitLog.push(n), 100, { maxWait: 250 });
for (let i = 0; i < 10; i += 1) {
  withMaxWait(i);
  await sleep(50); // 每 50ms 调用一次，永远跨不过 100ms 的安静窗口
}
console.log(`  maxWait:250 且每 50ms 持续调用 10 次 -> 实际执行了 ${maxWaitLog.length} 次（参数 ${JSON.stringify(maxWaitLog)}）`);
console.log('  结论：maxWait 是"兜底执行"，防止高频事件导致回调永远不触发。');
withMaxWait.cancel(); // 清理残留定时器

// ===========================================================================
console.log('');
console.log('--- 2. throttle：匀速放行，每 wait 毫秒最多一次 ---');
// ===========================================================================

const throttleLog = [];
const throttledScroll = throttle((position) => throttleLog.push(position), 60);

const t1 = Date.now();
// 模拟高频滚动事件：每 15ms 触发一次，共 8 次（跨度约 105ms）
for (let i = 1; i <= 8; i += 1) {
  throttledScroll(i * 100);
  await sleep(15);
}
await sleep(80); // 等尾部那次 trailing 调用执行完
console.log(`  8 次滚动事件（间隔 15ms，节流窗口 60ms）共计执行 ${throttleLog.length} 次`);
console.log(`  执行的位置序列：${JSON.stringify(throttleLog)}`);
console.log(`  总耗时 ${Date.now() - t1}ms —— 结论：执行次数约等于 总时长 / wait，与触发次数无关。`);

// 防连点按钮：真实项目里用 throttle 是最简单可靠的做法
let submitCount = 0;
const throttledSubmit = throttle(() => {
  submitCount += 1;
}, 100);
for (let i = 0; i < 20; i += 1) throttledSubmit(); // 用户狂点 20 次
throttledSubmit.cancel();
console.log(`  疯狂点击 20 次（节流 100ms）-> 实际提交 ${submitCount} 次（首次立即执行，其余被丢弃）`);

// ===========================================================================
console.log('');
console.log('--- 3. debounce vs throttle：一张表说清区别 ---');
// ===========================================================================
console.log('  维度            debounce                      throttle');
console.log('  ' + '-'.repeat(74));
console.log('  触发时机        停止触发 wait 后执行一次        每 wait 最多执行一次');
console.log('  高频期间        完全不执行                     稳定地按 wait 间隔执行');
console.log('  适合场景        输入联想、自动保存、resize     滚动加载、拖拽、按钮防连点');
console.log('  典型误解        "限流"（其实会让中间全部丢失）  "等安静"（滚动中永远不会安静）');
console.log('  实现关系        throttle ≈ debounce + maxWait + leading');

// 同一份高频输入，两种策略的直观对比
const dLog = [];
const tLog = [];
const d = debounce((n) => dLog.push(n), 50);
const th = throttle((n) => tLog.push(n), 50);
for (let i = 0; i < 6; i += 1) {
  d(i);
  th(i);
  await sleep(15);
}
await sleep(80);
console.log(`  同样的 6 次高频调用 -> debounce 执行 ${dLog.length} 次 ${JSON.stringify(dLog)}，throttle 执行 ${tLog.length} 次 ${JSON.stringify(tLog)}`);

// ===========================================================================
console.log('');
console.log('--- 4. memoize：缓存函数结果 ---');
// ===========================================================================

let expensiveCalls = 0;
/** 模拟一个昂贵的计算：统计调用次数以验证缓存是否生效 */
const expensiveCalc = (n) => {
  expensiveCalls += 1;
  // 这里用循环代替真正的耗时计算，保证示例快速运行
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += i;
  return sum;
};

const memoizedCalc = memoize(expensiveCalc);
console.log(`  memoizedCalc(1000) = ${memoizedCalc(1000)}，累计真实计算次数 = ${expensiveCalls}`);
console.log(`  memoizedCalc(1000) = ${memoizedCalc(1000)}，累计真实计算次数 = ${expensiveCalls}（命中缓存，未重新计算）`);
console.log(`  memoizedCalc(2000) = ${memoizedCalc(2000)}，累计真实计算次数 = ${expensiveCalls}（参数不同，重新计算）`);
// 缓存内容挂在 memoizedCalc.cache 上。lodash 默认用 MapCache 实现，
// 它有一个 size 属性和 has/get/set/delete/clear 方法（不要再对 cache 用 Object.keys，
// 那会把 MapCache 内部的 __data__ 字段也列出来）。
console.log(`  缓存里现在有 ${memoizedCalc.cache.size} 条记录（1000 与 2000 两个参数各一条）`);
console.log(`  cache.has(1000) = ${memoizedCalc.cache.has(1000)}（命中），cache.has(9999) = ${memoizedCalc.cache.has(9999)}（未命中）`);
memoizedCalc.cache.clear();
console.log(`  调用 cache.clear() 后，缓存条数 = ${memoizedCalc.cache.size}`);

// 真实项目里的经典场景：递归函数的记忆化
let fibCalls = 0;
const fib = memoize((n) => {
  fibCalls += 1;
  return n <= 1 ? n : fib(n - 1) + fib(n - 2);
});
console.log(`  fib(30) = ${fib(30)}，真实计算次数 = ${fibCalls}`);
console.log('  朴素递归算 fib(30) 需要约 270 万次调用，记忆化后只需 31 次 —— 这就是 memoize 的威力。');

// --- 关键陷阱：默认缓存键是"第一个参数 String() 之后的结果" ---
const byObjectKey = memoize((query) => {
  expensiveCalls += 1;
  return `查询结果:${query.keyword}`;
});
const r1 = byObjectKey({ keyword: 'apple' });
const r2 = byObjectKey({ keyword: 'banana' });
console.log('');
console.log('  陷阱演示：默认缓存键会被 String() 转换');
console.log(`    传入 {keyword:"apple"} 得到 ${r1}`);
console.log(`    传入 {keyword:"banana"} 得到 ${r2}`);
console.log('    两次结果居然一样！因为两个对象都被 String() 成了 "[object Object]" 这个同一个键。');

// 正确做法：用 resolver 指定缓存键
const byObjectKeyFixed = memoize((query) => `查询结果:${query.keyword}`, (query) => query.keyword);
console.log(`  用 resolver 修复后：apple -> ${byObjectKeyFixed({ keyword: 'apple' })}，banana -> ${byObjectKeyFixed({ keyword: 'banana' })}`);

// ===========================================================================
console.log('');
console.log('--- 5. cloneDeep：深拷贝 ---');
// ===========================================================================

/** 构造一个包含各种复杂类型的对象，用来检验深拷贝的完整性 */
const complexSource = {
  name: '配置',
  nested: { level1: { level2: { value: 42 } } },
  list: [1, 2, { deepInArray: true }],
  createdAt: new Date('2026-01-01T00:00:00Z'),
  pattern: /^abc$/gi,
  map: new Map([['k', { v: 1 }]]),
  set: new Set([1, 2, 3]),
  buffer: Buffer.from('hello'),
  fn: () => 'shared',
};

const deepCopied = cloneDeep(complexSource);
const shallowCopied = { ...complexSource }; // 原生浅拷贝：只复制第一层

console.log('  浅拷贝（展开运算符）的问题：');
console.log(`    第一层相等？${shallowCopied.name === complexSource.name}`);
console.log(`    嵌套对象是同一个引用？${shallowCopied.nested === complexSource.nested}（修改会互相影响）`);
console.log(`    数组是同一个引用？${shallowCopied.list === complexSource.list}`);

console.log('  cloneDeep 的表现：');
console.log(`    嵌套对象是同一个引用？${deepCopied.nested === complexSource.nested}（false = 真正复制了）`);
console.log(`    Date 被复制成新对象且值相等？${deepCopied.createdAt !== complexSource.createdAt && deepCopied.createdAt.getTime() === complexSource.createdAt.getTime()}`);
console.log(`    RegExp 被复制且 flags 保留？${deepCopied.pattern.source === '^abc$' && deepCopied.pattern.flags === 'gi'}`);
console.log(`    Map 内部的值对象也被复制？${deepCopied.map.get('k') !== complexSource.map.get('k')}`);
console.log(`    Set 被复制？${deepCopied.set.size === 3 && deepCopied.set !== complexSource.set}`);
console.log(`    Buffer 被复制？${Buffer.isBuffer(deepCopied.buffer) && deepCopied.buffer !== complexSource.buffer}`);
console.log(`    函数仍然是共享引用？${deepCopied.fn === complexSource.fn}（函数不会被深拷贝，这是预期行为）`);

// 循环引用：cloneDeep 能正确处理，JSON.parse(JSON.stringify()) 会直接崩
const circular = { name: '循环引用' };
circular.self = circular;
const circularCopy = cloneDeep(circular);
console.log(`  循环引用：cloneDeep 成功复制，copy.self === copy ? ${circularCopy.self === circularCopy}`);
try {
  JSON.parse(JSON.stringify(circular));
} catch (error) {
  console.log(`  JSON 方案遇到循环引用会抛错：${error.message}`);
}

// --- 与原生 structuredClone 对比 ---
console.log('');
console.log('  structuredClone（Node 17+ 原生深拷贝）对比：');
const structured = structuredClone({ nested: complexSource.nested, createdAt: complexSource.createdAt });
console.log(`    嵌套对象已复制？${structured.nested !== complexSource.nested}`);
console.log(`    Date 已复制？${structured.createdAt instanceof Date}`);
try {
  // structuredClone 不支持函数，遇到会抛 DataCloneError
  structuredClone({ fn: () => {} });
} catch (error) {
  console.log(`    structuredClone 遇到函数会抛错：${error.name}（cloneDeep 则是共享引用）`);
}
console.log('    选择建议：纯数据结构用 structuredClone（更快、无依赖）；');
console.log('              含函数/自定义类/需要"静默容错"时用 cloneDeep。');

// ===========================================================================
console.log('');
console.log('--- 6. merge：深合并（配置合并的标准做法）---');
// ===========================================================================

/** 默认配置：真实项目里通常来自一个 config/default.js */
const defaultConfig = {
  server: { host: 'localhost', port: 3000, timeout: 5000 },
  database: { url: 'postgres://localhost/dev', pool: { min: 2, max: 10 } },
  features: { newUI: false, betaApi: false },
  plugins: ['logger', 'metrics'],
};

/** 用户配置：只覆盖关心的字段（其余沿用默认值） */
const userConfig = {
  server: { port: 8080 },
  database: { pool: { max: 50 } },
  features: { newUI: true },
};

const merged = merge({}, defaultConfig, userConfig);
console.log('  合并结果（用户配置优先，未覆盖的字段保留默认值）：');
console.log(`    server.host = ${merged.server.host}（未被覆盖，保留默认）`);
console.log(`    server.port = ${merged.server.port}（被用户配置覆盖）`);
console.log(`    server.timeout = ${merged.server.timeout}（深层字段未被误删）`);
console.log(`    database.pool.min = ${merged.database.pool.min}，max = ${merged.database.pool.max}（同层字段分别合并）`);
console.log(`    features = ${JSON.stringify(merged.features)}`);

// 第一个参数用 {} 的原因：merge 会直接修改第一个参数
console.log('');
console.log('  副作用说明：merge 会修改第一个参数');
const target = { a: 1 };
merge(target, { b: 2 });
console.log(`    merge(target, {b:2}) 之后 target = ${JSON.stringify(target)}（被就地修改了）`);
console.log('    所以"配置合并"的标准写法是 merge({}, defaultConfig, userConfig)，用一个空对象当目标。');

// --- 关键陷阱：数组是按下标合并的 ---
console.log('');
console.log('  陷阱：数组按下标合并，而不是整体替换');
const arrMerged = merge({}, { plugins: ['logger', 'metrics', 'tracing'] }, { plugins: ['audit'] });
console.log(`    merge({plugins:['logger','metrics','tracing']}, {plugins:['audit']})`);
console.log(`    得到 ${JSON.stringify(arrMerged.plugins)}（不是 ['audit']！）`);
// 想整体替换数组，用 assign 或直接在覆盖后重新赋值
const arrAssigned = lodash.assign({}, { plugins: ['logger', 'metrics', 'tracing'] }, { plugins: ['audit'] });
console.log(`    lodash.assign 是浅合并，直接替换整个数组 -> ${JSON.stringify(arrAssigned.plugins)}`);

// --- 与原生 Object.assign / 展开运算符对比 ---
console.log('');
console.log('  与原生合并对比：');
const nativeShallow = { ...defaultConfig, ...userConfig };
console.log(`    原生展开运算符是浅合并：server = ${JSON.stringify(nativeShallow.server)}`);
console.log('      （server.timeout 被整个丢掉了！因为 userConfig.server 整体替换了 defaultConfig.server）');
console.log(`    merge 的结果：server = ${JSON.stringify(merged.server)}（深层字段完整保留）`);
console.log('    结论：凡是"多层配置合并"，就必须用深合并，浅合并会静默丢字段 ——');
console.log('          这是真实项目里最难排查的一类 bug。');

// --- 原型污染的安全提醒 ---
console.log('');
console.log('  安全提醒：merge 的历史漏洞');
// 演示一个恶意的 __proto__ 载荷。lodash 4.17.21 已经做了防护：
// 它会把 __proto__ 当作普通自有属性处理，而不会真的改到 Object.prototype。
merge({}, JSON.parse('{"__proto__": {"polluted": "yes"}}'));
console.log(`    尝试合并 {"__proto__":{"polluted":"yes"}} 后，({}).polluted = ${({}).polluted}（undefined = 未被污染）`);
console.log('    旧版 lodash（< 4.17.12）存在原型污染漏洞（CVE-2019-10744），已修复。');
console.log('    这也是"锁版本 + 关注安全公告"重要性的真实案例。');

// ===========================================================================
console.log('');
console.log('--- 7. 什么时候该用原生实现 ---');
// ===========================================================================
console.log('  深拷贝：structuredClone 已是原生，纯数据场景优先用它；');
console.log('  浅合并：{...a, ...b} 和 Object.assign 足够，不需要 lodash；');
console.log('  深合并：原生没有等价物，配置合并场景仍推荐 lodash.merge；');
console.log('  防抖节流：原生没有等价物（有 AbortSignal 但语义不同），推荐保留；');
console.log('  缓存：memoize 很好用，但生产环境更推荐带容量上限的 LRU 实现')
console.log('        （如 lru-cache 包），因为 memoize 的缓存会无限增长导致内存泄漏。');

// ===========================================================================
// 自测断言
// ===========================================================================
console.log('');
console.log('--- 8. 自测断言 ---');

// debounce：高频调用只执行最后一次
assert.deepStrictEqual(debounceLog.map((r) => r.keyword), ['javas'], 'debounce 只执行最后一次');
// maxWait：持续调用时兜底执行了至少一次
assert.ok(maxWaitLog.length >= 1, 'maxWait 应当保证兜底执行');
assert.ok(maxWaitLog.length <= 4, `maxWait 应限制执行次数，实际 ${maxWaitLog.length}`);
// throttle：执行次数远小于触发次数
assert.ok(throttleLog.length < 8, `throttle 应丢弃大部分调用，实际执行 ${throttleLog.length} 次`);
assert.strictEqual(submitCount, 1, '节流后的提交只执行 1 次');
// memoize
assert.strictEqual(memoizedCalc.cache.size, 0, 'cache.clear 后缓存应为空');
assert.strictEqual(fib(30), 832040);
// cloneDeep
assert.notStrictEqual(deepCopied.nested, complexSource.nested);
assert.strictEqual(circularCopy.self, circularCopy, 'cloneDeep 应支持循环引用');
assert.ok(deepCopied.createdAt instanceof Date);
// merge
assert.strictEqual(merged.server.port, 8080);
assert.strictEqual(merged.server.timeout, 5000, '深层未覆盖字段应保留');
assert.strictEqual(merged.database.pool.max, 50);
assert.deepStrictEqual(arrMerged.plugins, ['audit', 'metrics', 'tracing'], 'merge 按下标合并数组');
assert.strictEqual(({}).polluted, undefined, '不应发生原型污染');

console.log('  全部断言通过。');
console.log('');
console.log('演示结束。');
