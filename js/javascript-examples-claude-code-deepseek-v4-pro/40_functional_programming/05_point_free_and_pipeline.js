/**
 * ============================================================================
 * 知识点：无参风格（point-free）与数据管道 —— 以及它的缺点
 * ============================================================================
 *
 * 【所属分类】40_functional_programming —— 函数式编程进阶
 * 【难度等级】高级
 * 【前置知识】06_functions/12_currying_and_compose.js、40_functional_programming/01_functor.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    先解释名字里的 "point"：在函数式编程的术语里，point 指的是"参数点位"，
 *    也就是 `x => f(x)` 里的那个 x。
 *      const inc = (x) => x + 1;        // 有 point，显式写出了参数 x
 *      const inc = add(1);              // 无 point（point-free），参数根本没出现
 *    当两侧的写法在语义上等价时，把多余的参数去掉的这个动作叫 eta 归约（η-reduction）。
 *    point-free 不是"函数没有参数"，而是"代码里看不到那个参数的名字"。
 *    数据管道（pipeline）：把一组一元函数用 pipe / compose 串起来，
 *    让数据像流水线一样依次经过每道工序。point-free 是让管道读起来更干净的手段之一。
 *
 * 2. 为什么需要
 *    看看同一件事的两种写法：
 *      const names = users.map((u) => u.name.trim().toUpperCase());   // 有 point
 *      const names = users.map(compose(toUpperCase, trim, prop('name'))); // point-free
 *    第二种把"做什么"（取 name、去空格、转大写）变成了一串"有名字的操作"，
 *    于是这些操作可以在别处复用、可以单独测试、也可以整条搬到另一个管道里。
 *    在数据加工密集的场景（日志清洗、报表生成、ETL）里，这种做法收益很大。
 *
 * 3. 核心语法要点
 *    (1) 前提：函数必须是"一元"的。多元函数要先柯里化（见 06_functions/12）才能进管道。
 *    (2) point-free 的常见素材函数：
 *          prop(key)          → 取属性
 *          eq(value)          → 相等判断
 *          not / complement   → 取反
 *          both / either      → 与 / 或
 *    (3) 可读性判据（很重要）：
 *          函数已经是"现成的、语义明确的" → 直接传引用更干净：arr.map(String)
 *          需要临时定义一个只在这里用的逻辑 → 老老实实写箭头函数
 *    (4) 管道本身是一元函数链，所以它天然可以和 map / filter 等方法互相嵌套。
 *
 * 4. 常见陷阱
 *    - 把"需要多个参数的函数"直接当回调传进去，多出来的参数会被当成别的含义。
 *      经典案例就是 ['1','2','3'].map(parseInt) 得到 [1, NaN, NaN]：
 *      map 会传 (元素, 索引, 数组) 三个参数，parseInt 的第二个参数是"进制"，
 *      于是 parseInt('2', 1) 和 parseInt('3', 2) 结果都错。详见第 6 节实测。
 *    - 无脑 point-free 导致调试困难：中间值没有名字，出错时不知道是哪一环。
 *    - 过度抽象：把一个只用一次的三行逻辑拆成五个通用函数，可读性反而下降。
 *    - 用 point-free 掩盖了真正的意图。`compose(Number, prop('x'))` 比
 *      `(o) => Number(o.x)` 难读，因为你要在大脑里做一次翻译。
 *    - 性能误解：原生链式 map/filter 每一步都会完整遍历一次数组，
 *      长数组上多步链式的遍历次数是成倍增长的（见第 7 节实测）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 40_functional_programming/05_point_free_and_pipeline.js
 *
 * 【预期输出】
 *   对比有参 / 无参写法，展示 point-free 的适用边界与踩坑实录，
 *   然后用一条"日志解析 → 过滤 → 聚合 → 格式化"的完整管道收尾，
 *   最后给出与数组链式写法的取舍结论。
 * ============================================================================
 */

console.log('--- 1. 先讲清楚 "point" 是什么 ---');

// "point" = 参数点位，就是形参那个名字出现的"位置"。
// 下面三个函数做的是完全一样的事，区别只是"参数有没有被写出来"。
const toUpper1 = (s) => s.toUpperCase(); // 参数 s 出现了 → 有 point
const toUpper2 = (s) => String.prototype.toUpperCase.call(s); // 也算有 point，写法更啰嗦
// 而 toUpperCase 本身就是一个"现成的"一元函数，可以直接传引用 → 无 point。
console.log('  (s) => s.toUpperCase()("abc") →', toUpper1('abc'));
console.log('  "abc".toUpperCase()          →', 'abc'.toUpperCase());
void toUpper2;

// 关键区分：point-free 说的是"不写出参数名"，不是什么"没有参数"。
// 只要两侧语义等价，去掉参数名就是合法的 eta 归约。
const isNotEmpty = (arr) => arr.length > 0;
const hasLength = (arr) => arr.length; // 有 point
// hasLength 本身就能当"真值判断"用，所以下面这个包装就是多余的：
const hasLengthRedundant = (arr) => hasLength(arr); // 有 point，但纯属多余
console.log('  isNotEmpty([1]) →', isNotEmpty([1]));
console.log('  Boolean(hasLength([1])) →', Boolean(hasLength([1])), '（所以 filter(hasLength) 就是无参写法）');
void hasLengthRedundant;

console.log('--- 2. 朴素写法：一层层箭头函数包起来 ---');

// 需求：从一组用户对象里取出"干净的显示名"（去空格 + 转大写）。
const users = [
  { name: '  alice ', age: 30 },
  { name: 'BOB', age: 22 },
  { name: '  carol', age: 41 },
];

// 写法 A：全写在回调里。优点是一眼看懂，缺点是复用性为零。
const namesA = users.map((u) => u.name.trim().toUpperCase());
console.log('  写法 A（全塞进回调）→', namesA);

// 写法 B：把每一步拆成有名字的小函数，再在回调里手动串起来。
// 这已经好多了（每步可测试），但回调里仍然重复着 "u => step3(step2(step1(u)))" 这种套娃形状。
const getName = (u) => u.name;
const trim = (s) => s.trim();
const upper = (s) => s.toUpperCase();
const namesB = users.map((u) => upper(trim(getName(u))));
console.log('  写法 B（拆成小函数再套娃）→', namesB);

// 写法 C：把"套娃"本身抽掉，只留下函数序列 —— 这就是管道。
// （pipe 在 06_functions/12 已经详细讲过，这里为了文件能独立运行再声明一次，不重复讲解。）
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);

const cleanName = pipe(getName, trim, upper);
const namesC = users.map(cleanName);
console.log('  写法 C（先造一个管道，再交给 map）→', namesC);
console.log('  三者的输出完全相同。区别在"复用性"：');
console.log('    cleanName 现在是一个独立的一元函数，既能在 map 里用，');
console.log('    也能在 filter / sort / groupBy 里用，还能单独写测试。');

console.log('--- 3. point-free 与"有参"写法的逐项对照 ---');

const comparisons = [
  ['x => x.trim()', 'trim', '方法本身刚好是一元函数'],
  ['x => Boolean(x)', 'Boolean', '构造函数当一元转换函数用'],
  ['x => String(x)', 'String', '同上，比 x => "" + x 更直白'],
  ['x => Number(x)', 'Number', '同上'],
  ['x => x.length', 'propLen', '要自己造：没有现成的 length 取值函数'],
  ['x => x?.a?.b', '(x) => x?.a?.b', '有可选链时 point-free 反而更绕'],
  ['(a, b) => a + b', 'add（需柯里化）', '多元函数要先柯里化才能进管道'],
  ['x => f(g(x))', 'compose(f, g)', '组合的本质就是去掉这个 x'],
];
console.log('  有参写法  ||  无参写法  ||  说明');
for (const [a, b, why] of comparisons) {
  console.log(`  ${a}  ||  ${b}  ||  ${why}`);
}

// 自己造两个"取长度"的函数，用来演示"没有现成函数时得自己造"，以及组合顺序的坑。
const strlen = (s) => s.length; // 字符串 → 长度
const propLen = (key) => (obj) => String(obj?.[key] ?? '').length; // 对象 → 某属性的长度

// 目标：把每个用户变成"名字长度"，即 (u) => u.name.length。
// 直觉上会写成 compose(propLen('name'), getName)，但顺序是反的 —— 会崩。
try {
  users.map(compose(propLen('name'), getName));
} catch (err) {
  console.log('  组合顺序写反的后果：', err.constructor.name, '-', err.message);
  console.log('    compose(f, g)(x) = f(g(x))：先跑 getName 得到字符串，');
  console.log('    再把字符串交给 propLen("name")，它去取字符串的 name 属性 → 自然是 undefined。');
}
// 正确顺序：先 getName（取名字），再 strlen（取长度）。
const nameLength = compose(strlen, getName);
console.log('  正确顺序 compose(strlen, getName) →', users.map(nameLength));
console.log('  但说实话，users.map((u) => u.name.length) 明显更好读。');
console.log('  这就是 point-free 的代价：组合顺序要在大脑里做一次反向翻译。');

console.log('--- 4. 什么时候 point-free 更清晰 ---');

// 场景一：函数已经是现成的、语义明确的标准函数。
const rawIds = ['1', '2', '10'];
console.log('  ["1","2","10"].map(Number) →', rawIds.map(Number), '（干净，无需解释）');
console.log('  对比显式版 .map((s) => Number(s)) →', rawIds.map((s) => Number(s)), '（也没错，就是啰嗦）');

// 场景二：把一组操作组合成"可复用的判定条件"。
const isEven = (n) => n % 2 === 0;
const isPositive = (n) => n > 0;
const both = (f, g) => (x) => f(x) && g(x);
const isPositiveEven = both(isPositive, isEven);
console.log('  [1,2,3,4,5,6].filter(both(isPositive, isEven)) →', [1, 2, 3, 4, 5, 6].filter(isPositiveEven));
console.log('  这里 point-free 的价值是"组合"：both() 造出来的条件可以命名、可以复用，');
console.log('  比每次写 (x) => x > 0 && x % 2 === 0 更容易在多个地方保持一致。');

// 场景三：同一条管道要用在多种数据上。
const pickCity = compose(trim, upper, (o) => o?.address?.city ?? '');
console.log('  pickCity({ address: { city: " beijing " } }) →', `"${pickCity({ address: { city: ' beijing ' } })}"`);

console.log('--- 5. 什么时候 point-free 反而更难读（如实讲缺点）---');

// 缺点一：需要"临时命名一个中间值"时，point-free 表达不了。
// 比如"用同一个值的两部分算结果"，就必须写出参数。
const describeUser = (u) => `${getName(u)}（${u.age} 岁）`;
console.log('  缺点一 · 需要中间值：', describeUser(users[0]), ' ← 这里必须写出参数 u，point-free 做不到');

// 缺点二：调试困难。管道里任何一步出错，堆栈里只看到一堆匿名函数。
const willCrash = pipe(getName, trim, upper, (s) => s.nonExistentMethod()); // 故意一个会崩的管道
try {
  willCrash(users[0]);
} catch (err) {
  console.log('  缺点二 · 管道内出错时报错信息很含糊：', err.message);
  console.log('          （堆栈里只能看到 pipe 内部的 reduce，看不出是第几步炸的）');
  console.log('          缓解办法：给每一步都起名字，管道里传"有名字的函数"而不是内联箭头函数；');
  console.log('          getName/trim/upper 都有名字，找问题时至少知道候选范围。');
}
// 对照：显式写法出错时，行号直接指向那一句。
try {
  const bad = (u) => u.name.trim().toUpperCase().nonExistentMethod();
  bad(users[0]);
} catch (err) {
  console.log('          对照显式写法：', err.message, '（出错位置就是这一行，一目了然）');
}

// 缺点三：不熟悉的人读不懂。这在团队协作里是真实成本。
console.log('  缺点三 · 学习成本：pipe(getName, trim, upper) 需要读者知道 pipe 是从左往右，');
console.log('          而 compose 是从右往左 —— 混用两种会让代码评审变成猜谜。');
console.log('          建议：一个项目里只用其中一种，并在 lint 规则里固定下来。');

console.log('--- 6. 踩坑实录：把"多参数函数"当一元函数传进去 ---');

// 这是 point-free 最著名的坑，没有之一。
const digits = ['1', '2', '3', '10'];
console.log('  预期：把 ["1","2","3","10"] 转成数字 → [1, 2, 3, 10]');
console.log('  实际：["1","2","3","10"].map(parseInt) →', digits.map(parseInt), ' ← 错了！');
console.log('  原因：map 传给回调的是三个参数 (元素, 索引, 数组)，');
console.log('        而 parseInt 的签名是 parseInt(string, radix) —— 第二个参数是进制！');
for (const [i, d] of digits.entries()) {
  console.log(`    parseInt("${d}", ${i}) →`, parseInt(d, i), `  （把索引 ${i} 当成了进制）`);
}
console.log('  正确写法一（point-free 且安全）：.map(Number) →', digits.map(Number));
console.log('  正确写法二（显式包一层，切断多余参数）：.map((s) => parseInt(s, 10)) →', digits.map((s) => parseInt(s, 10)));

// 同类坑二：把 console.log 当回调传。它会把索引和数组也打印出来。
console.log('  同类坑二：["a","b"].map(console.log) 会额外打印索引和数组 ——');
['a', 'b'].map(console.log);
console.log('  （上面三行就是它打印的结果，多出来的 0/1 和数组就是 map 多传的参数）');

// 同类坑三：任何"有可选第二参数"的函数都危险。
const capped = (s, max) => s.slice(0, max ?? 3);
console.log('  同类坑三：一个带可选参数的函数 s => s.slice(0, max ?? 3)');
console.log('    直接传引用 .map(capped) →', ['abcdef', 'ghijkl'].map(capped), ' ← max 拿到了索引，结果不确定');
console.log('    包一层 .map((s) => capped(s)) →', ['abcdef', 'ghijkl'].map((s) => capped(s)), ' ← 正确');

console.log('  经验法则：只有当被传的函数"确定只接收一个参数"时，才可以放心用 point-free。');
console.log('  Number / String / Boolean / trim 这类没有第二含义的，是安全的；');
console.log('  parseInt / parseFloat / console.log / 带默认值的函数，一律包一层显式箭头函数。');

console.log('--- 7. 实践：日志解析 → 过滤 → 聚合 → 格式化 ---');

// 输入：一份"从服务器上扒下来的"访问日志（文本行）。
// 需求：找出所有 /api/ 开头的请求，按路径统计次数和平均耗时。
const rawLog = [
  '2026-09-16T10:00:01Z GET /api/users 200 132',
  '2026-09-16T10:00:02Z GET /api/users 500 980',
  '2026-09-16T10:00:03Z POST /api/orders 201 240',
  '2026-09-16T10:00:04Z GET /index.html 200 12',
  '这行是坏数据，根本不是日志',
  '2026-09-16T10:00:05Z GET /api/orders 500 1500',
  '2026-09-16T10:00:06Z GET /api/users 200 118',
  '',
  '2026-09-16T10:00:07Z DELETE /api/users/7 204 88',
];

// 第 1 步：解析一行。坏的返回 null（而不是抛异常）。
// 注意这里必须写出参数，因为它要做解构和长度判断 —— 不适合 point-free。
const parseLine = (line) => {
  const parts = String(line).trim().split(/\s+/);
  if (parts.length !== 5) return null; // 坏数据 → null
  const [timestamp, method, path, status, duration] = parts;
  const statusCode = Number(status);
  const durationMs = Number(duration);
  if (Number.isNaN(statusCode) || Number.isNaN(durationMs)) return null;
  return { timestamp, method, path, status: statusCode, durationMs };
};

// 第 2 步起，每一项都是"一元、纯、可复用"的小函数 —— 这里 point-free 很合适。
const dropNulls = (arr) => arr.filter((x) => x !== null);
const isApiPath = (entry) => entry.path.startsWith('/api/');
const isFailed = (entry) => entry.status >= 400;
const getDuration = (entry) => entry.durationMs;

// 聚合：按 path 分组，统计次数、失败次数、总耗时。
// groupBy 用柯里化写成"通用工具"，这样它就能进管道。
const groupBy = (keyFn) => (arr) =>
  arr.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {});

// summarize：把"某个路径下的一组请求"变成一个统计对象。
// 这里需要多次引用同一个数组，所以必须写出参数名，point-free 不适用。
const summarize = ([path, entries]) => ({
  path,
  total: entries.length,
  failed: entries.filter(isFailed).length,
  avgMs: Math.round(entries.reduce((s, e) => s + getDuration(e), 0) / entries.length),
});

const countValues = (key) => (arr) => arr.length; // 演示用的小工具（见下）

// 格式化：一步纯变换，可以 point-free 到底。
const pad = (n, width) => String(n).padStart(width);
const formatRow = (s) => `${s.path.padEnd(18)} 请求 ${pad(s.total, 3)}  失败 ${pad(s.failed, 3)}  平均 ${pad(s.avgMs, 5)}ms`;
const formatRows = (rows) => rows.map(formatRow);

// 排序：按请求次数从多到少。
const sortByTotalDesc = (rows) => [...rows].sort((a, b) => b.total - a.total);

// 组装管道：注意每一步都是"数组 → 数组"或"分组对象 → 数组"的一元函数。
const analyzeApiLog = pipe(
  (raw) => raw.map(parseLine), // 文本行 → 条目（含 null）
  dropNulls,                    // 丢掉坏数据
  (entries) => entries.filter(isApiPath), // 只看 /api/ 前缀
  groupBy((e) => e.path),       // 按路径分组
  Object.entries,               // 分组对象 → [路径, 条目数组] 的数组
  (pairs) => pairs.map(summarize), // 每组算统计
  sortByTotalDesc,              // 排序
  formatRows,                   // 格式化成文本行
);

console.log('  输入：', rawLog.length, '行原始日志（含 1 行坏数据、1 行空行）');
console.log('  分析结果：');
for (const row of analyzeApiLog(rawLog)) {
  console.log('   ', row);
}

// 管道的价值：同一条解析前缀可以复用，只换后面的一段。
const formatFailure = (e) => `${e.status} ${e.method} ${e.path}（${e.durationMs}ms）`;
const listFailures = pipe(
  (raw) => raw.map(parseLine), // 与上面完全相同的解析步骤
  dropNulls,
  (entries) => entries.filter(isFailed), // 只换这一段过滤条件
  (entries) => entries.map(formatFailure), // 换个输出格式
);
console.log('  复用同一条解析前缀，只换过滤与格式化（只看失败请求）：');
for (const row of listFailures(rawLog)) {
  console.log('   ', row);
}
void countValues; // 演示用工具，此处不调用

console.log('--- 8. 与数组链式 map/filter/reduce 的取舍 ---');

// 先看一个"确定性"的性能事实：原生链式每一步都完整遍历一次数组。
// 我们用计数器把"元素访问次数"数出来（计数是确定的，不依赖机器快慢）。
const bigData = Array.from({ length: 100_000 }, (_, i) => ({ v: i }));

let visitsChained = 0;
const chainedResult = bigData
  .map((x) => {
    visitsChained++;
    return x.v;
  })
  .filter((v) => {
    visitsChained++;
    return v % 2 === 0;
  })
  .map((v) => {
    visitsChained++;
    return v * 2;
  })
  .filter((v) => {
    visitsChained++;
    return v % 3 === 0;
  });

let visitsSingle = 0;
const singleResult = bigData.reduce((acc, x) => {
  visitsSingle++;
  const v = x.v;
  if (v % 2 !== 0) return acc;
  const doubled = v * 2;
  if (doubled % 3 !== 0) return acc;
  acc.push(doubled);
  return acc;
}, []);

console.log('  在同一份 10 万条数据上做 4 步加工：');
console.log('    链式 map/filter：元素访问次数 =', visitsChained, '（= 10万 + 10万 + 5万 + 5万）');
console.log('      每一步都完整遍历"上一步的输出"，所以后面的步骤数据量会被 filter 缩小。');
console.log('    单个 reduce：   元素访问次数 =', visitsSingle, '（= 1 × 10万，一趟走完，中间不产生中间数组）');
console.log('    结果条数一致吗？', chainedResult.length === singleResult.length, `（都是 ${chainedResult.length} 条）`);
console.log('  顺带测一下耗时（受机器状态影响，仅供参考）：');
const t0 = performance.now();
bigData.map((x) => x.v).filter((v) => v % 2 === 0).map((v) => v * 2).filter((v) => v % 3 === 0);
const t1 = performance.now();
bigData.reduce((acc, x) => {
  const v = x.v;
  if (v % 2 !== 0) return acc;
  const doubled = v * 2;
  if (doubled % 3 !== 0) return acc;
  acc.push(doubled);
  return acc;
}, []);
const t2 = performance.now();
console.log(`    链式 ${(t1 - t0).toFixed(2)}ms  vs  reduce ${(t2 - t1).toFixed(2)}ms`);
console.log('  但请注意：在实际项目里，这段差距几乎总是可以忽略的 ——');
console.log('  只有当数组非常大（十万级以上）、且链条很长（4 步以上）时才值得优化。');

// 取舍清单：
console.log('  ┌────────────────────────┬──────────────────────────┬────────────────────────────┐');
console.log('  │ 维度                    │ 数组链式 map/filter       │ pipe 管道                   │');
console.log('  ├────────────────────────┼──────────────────────────┼────────────────────────────┤');
console.log('  │ 上手成本                │ 极低，人人会                │ 需要理解一元函数与组合          │');
console.log('  │ 中间结果可见性           │ 好，可随时 console.log      │ 差，只能看入口和出口           │');
console.log('  │ 复用性                  │ 差，逻辑写在调用点           │ 好，管道是有名字的一等公民       │');
console.log('  │ 单元测试                │ 只能测整段                  │ 每一步可单独测                │');
console.log('  │ 遍历次数                │ 每步一次，线性增长            │ 手写 reduce 可一趟走完         │');
console.log('  │ 适用数据                │ 数组                        │ 任何可遍历结构、任何一元函数链    │');
console.log('  │ TypeScript 推断         │ 优秀                        │ 长管道容易推断成 unknown       │');
console.log('  └────────────────────────┴──────────────────────────┴────────────────────────────┘');

console.log('--- 9. 一份可直接照抄的判断准则 ---');

const guidelines = [
  '默认写显式箭头函数：可读性优先，团队里大多数人也这么写。',
  '当回调只需要"调用一个现成的一元函数"时，直接传引用（.map(Number)、.filter(Boolean)）。',
  '当同一串操作要在两个以上地方重复时，把它提成 pipe 管道并命名（如 analyzeApiLog）。',
  '当函数有可选的第二参数或会把多余参数当真（parseInt、console.log）时，一律包一层箭头函数。',
  '管道控制在 3~6 步；更长的拆成几条有名字的子管道，再组合起来。',
  '管道里尽量传"有名字的函数"，别堆内联箭头函数 —— 出错时至少能定位候选范围。',
  '一个项目里 pipe 和 compose 只用一种，写进 lint 规则。',
];
for (const g of guidelines) {
  console.log('  ·', g);
}

console.log('--- 10. 小结 ---');
console.log('  point = 参数点位；point-free = 代码里看不到那个参数名（eta 归约）。');
console.log('  它的收益是复用与组合，代价是可读性和调试便利 —— 两者要平衡，不要走极端。');
console.log('  管道把"数据依次经过一组一元函数"这件事表达成数据本身，可以命名、可以复用。');
console.log('  数组链式适合一次性、短链条、需要看中间结果的数据加工；');
console.log('  管道适合需要复用、需要单测、需要跨数据结构使用的加工逻辑。');
console.log('  下一个话题（06_adt_and_pattern_matching.js）：');
console.log('  我们反复用到 { tag: "Left" } 这种"带标签的数据"，那其实是"和类型"的手工模拟。');
