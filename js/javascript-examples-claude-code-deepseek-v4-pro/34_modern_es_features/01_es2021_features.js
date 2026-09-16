/**
 * ============================================================================
 * 知识点：ES2021 新特性 —— 逻辑赋值、数字分隔符、replaceAll、Promise.any、WeakRef
 * ============================================================================
 *
 * 【所属分类】34_modern_es_features —— 现代 ES 新特性
 * 【难度等级】进阶
 * 【前置知识】04_operators/、11_strings/、18_async/06_promise_combinators.js、31_performance_and_memory/
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES2021（第 12 版 ECMAScript 标准，2021 年 6 月发布）带来 5 组实用改进：
 *      (1) 逻辑赋值运算符 ||= 、&&= 、??=
 *      (2) 数字分隔符 1_000_000
 *      (3) String.prototype.replaceAll()
 *      (4) Promise.any() + AggregateError
 *      (5) WeakRef / FinalizationRegistry
 *
 * 2. 为什么需要（真实项目场景）
 *    - 配置合并：`opts.timeout ||= 3000` 一行替代 `if (!opts.timeout) opts.timeout = 3000`。
 *    - 金额/文件大小常量：`1_048_576` 一眼看出是 1MiB，不用数零。
 *    - 全文替换：以前必须写 `str.replace(/foo/g, 'bar')`，遇到用户输入的字符串
 *      还得先转义正则元字符；`replaceAll('foo', 'bar')` 直接按字面量替换。
 *    - 多源竞速：从 3 个镜像里取最快返回的那个成功结果，用 `Promise.any` 一行搞定。
 *    - 缓存/大对象旁挂元数据：`WeakRef` 让"缓存条目"不阻止对象被 GC。
 *
 * 3. 核心语法要点
 *    - `a ||= b` 等价于 `a || (a = b)`：a 为假值（falsy）时赋值。
 *    - `a &&= b` 等价于 `a && (a = b)`：a 为真值（truthy）时赋值。
 *    - `a ??= b` 等价于 `a ?? (a = b)`：a 为 null/undefined 时赋值（只认这两个）。
 *    - 逻辑赋值是"短路"的：右侧表达式在不需要赋值时根本不会被求值。
 *    - `1_000_000` 中的下划线只是视觉分隔符，对运行时数值没有任何影响。
 *    - `Promise.any` 返回第一个 fulfilled；全部 rejected 才抛 AggregateError。
 *    - `WeakRef` 的 target 必须是对象；`deref()` 可能返回 undefined。

 * 4. 常见陷阱
 *    - `??=` 与 `||=` 混用：`count ||= 10` 会把合法的 0 也当成"缺失"改成 10；
 *      `count ??= 10` 才只处理 null/undefined。这是最常见的线上事故来源之一。
 *    - 逻辑赋值左侧必须是"可赋值的引用"（变量、属性访问），不能是字面量。
 *    - `replaceAll` 传正则时必须带 g 标志，否则抛 TypeError。
 *    - `Promise.any` 与 `Promise.race` 完全不同：race 是"第一个落定"，any 是"第一个成功"。
 *    - WeakRef 不是"缓存"的银弹：是否回收由 GC 决定，deref() 随时可能变 undefined，
 *      绝不能写成"先 deref 判空再用"以外的逻辑；且不能用于依赖确定性命中率的场景。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 34_modern_es_features/01_es2021_features.js
 *
 * 【预期输出】
 *   依次打印 6 个小节，展示 ES2021 五组特性；每个特性都标注"本机支持：是/否"。
 *   本机 Node v24.16.0 全部原生支持，不进入降级分支。
 * ============================================================================
 */

// 本文件所有特性均为 ES2021 内容，Node 12+/现代浏览器即已支持。
// 为了教学演示"如何做特性检测"，下面每一项仍然显式检测一次。

console.log('='.repeat(70));
console.log('ES2021 新特性演示');
console.log('当前 Node 版本：', process.version);
console.log('='.repeat(70));

// ---------------------------------------------------------------------------
console.log('\n--- 1. 逻辑赋值运算符 ||= &&= ??= ---');
// ---------------------------------------------------------------------------

// 特性检测：逻辑赋值是"语法"层面特性，无法用 typeof 检测。
// 做法是把语法放在一个函数体内，用 try/catch 包住"解析+执行"，解析失败即不支持。
// 这里用 Function 构造器在运行时尝试编译一段包含 ??= 的源码。
let logicAssignSupported = true;
try {
  // eslint-disable-next-line no-new-func
  new Function('let a = null; a ??= 1; return a;')();
} catch {
  logicAssignSupported = false;
}
console.log('本机支持：' + (logicAssignSupported ? '是' : '否'));

// --- 以前怎么写 ---
// 想在"值为空时才赋值"必须写完整的 if 或三元表达式，啰嗦且容易写错：
let options = { retries: 0, timeout: undefined, name: '' };

if (options.timeout === undefined || options.timeout === null) {
  options.timeout = 3000;
}
if (!options.name) {
  options.name = 'anonymous';
}
console.log('以前（if 写法）：', options);

// --- 现在怎么写 ---
// ??= 只在 null/undefined 时赋值；||= 在任何假值（0、''、false、NaN）时赋值。
options = { retries: 0, timeout: undefined, name: '' };
options.timeout ??= 3000; // undefined -> 3000
options.name ||= 'anonymous'; // '' -> 'anonymous'
options.retries ||= 5; //  0 -> 5  ← 注意：0 被当成"缺失"了！
console.log('现在（??= / ||= 写法）：', options);

// &&= ：只在当前值为真值时赋值，常用于"字段存在才更新"。
const session = { user: 'alice', token: null };
session.user &&= session.user.toUpperCase(); // 'alice' 为真值 -> 更新
session.token &&= session.token.toUpperCase(); // null 为假值 -> 原样保留，右侧不求值
console.log('&&= 演示：', session);

// 好处：一行、无重复的变量名、右侧是"惰性求值"的。
// 下面这个例子能证明短路：右侧函数只在真的需要赋值时才被调用。
let callCount = 0;
function expensiveDefault() {
  callCount++;
  return 'computed';
}
let alreadySet = 'value';
alreadySet ||= expensiveDefault(); // 已是真值 -> 右侧完全不会执行
let notSet = '';
notSet ||= expensiveDefault();
console.log('右侧函数被调用次数：', callCount, '（应为 1，证明短路生效）');

// ---------------------------------------------------------------------------
console.log('\n--- 2. ??= 与 ||= 的关键差异（最容易踩的坑）---');
// ---------------------------------------------------------------------------

// 用一张对照表把两者的判定条件说清楚：
const cases = [
  ['null', null],
  ['undefined', undefined],
  ['0', 0],
  ['-0', -0],
  ['NaN', NaN],
  ['"" 空字符串', ''],
  ['false', false],
  ['"abc"', 'abc'],
];

console.log('原始值'.padEnd(14), '||= 结果'.padEnd(14), '??= 结果');
console.log('-'.repeat(46));
for (const [label, raw] of cases) {
  let a = raw;
  let b = raw;
  a ||= 'FALLBACK'; // 假值就替换
  b ??= 'FALLBACK'; // 只有 null/undefined 才替换
  console.log(
    label.padEnd(14),
    String(a).padEnd(14),
    String(b),
    '',
  );
}

// 结论：
//   ||= 会把 0、''、false、NaN 这些"合法的业务值"误判为缺失；
//   ??= 只把 null / undefined 视为缺失。
// 真实场景：分页参数 page ||= 1 是安全的（页码不会是 0），
//          但 limit ||= 10 就危险了 —— 如果产品要求 limit=0 表示"不分页"，
//          这个 ||= 会把它悄悄改成 10。此时必须用 ??=。

// ---------------------------------------------------------------------------
console.log('\n--- 3. 数字分隔符 1_000_000 ---');
// ---------------------------------------------------------------------------

// 以前怎么写：长数字只能靠肉眼数位，或者写成 10 * 1000 * 1000 这种表达式。
const oldMiB = 1048576; // 这是多少？要数一数
const oldWay = 10 * 1000 * 1000; // 靠乘法分段，但可读性仍然一般

// 现在怎么写：下划线可以出现在数字的任意两位之间（不能连续、不能在开头/结尾）。
const newMiB = 1_048_576; // 1 MiB
const tenMillion = 10_000_000;
const billion = 1_000_000_000;
const bytes = 0b1010_0001; // 二进制里也能用
const hexMask = 0xff_ff_00_00; // 十六进制里也能用
const tiny = 1_000.000_1; // 小数部分也能用
const bigIntValue = 9_007_199_254_740_991n; // BigInt 同样支持

console.log('1_048_576 =', newMiB, '（等于旧的', oldMiB, '）');
console.log('10_000_000 =', tenMillion, '（等于旧的', oldWay, '）');
console.log('1_000_000_000 =', billion);
console.log('0b1010_0001 =', bytes);
console.log('0xff_ff_00_00 =', hexMask);
console.log('1_000.000_1 =', tiny);
console.log('9_007_199_254_740_991n =', bigIntValue.toString());
// 分隔符只是"装饰"：Number('1_000') 会得到 NaN，因为它不属于数字字面量之外的地方
console.log("Number('1_000') =", Number('1_000'), '← 字符串里不认这个分隔符，这是重要区别');

// ---------------------------------------------------------------------------
console.log('\n--- 4. String.prototype.replaceAll ---');
// ---------------------------------------------------------------------------

const supported_replaceAll = typeof ''.replaceAll === 'function';
console.log('本机支持：' + (supported_replaceAll ? '是' : '否'));

const template = 'Hello {name}, welcome {name}! Your role is {role}.';

// 以前怎么写：必须用带 g 标志的正则做全局替换。
// 如果待替换的内容来自用户输入（比如用户昵称里带 . * + ?），
// 还得先手工转义正则元字符，否则正则会被破坏甚至抛错。
const oldResult = template.replace(/\{name\}/g, 'Alice');
console.log('以前（正则 /g）：', oldResult);

// 现在怎么写：第一个参数是普通字符串时，按"字面量"全部替换，不需要转义。
const newResult = template.replaceAll('{name}', 'Alice');
console.log('现在（replaceAll 字符串）：', newResult);
console.log('两者结果一致：', oldResult === newResult);

// replaceAll 也接受正则，但这种情况下必须带 g 标志，否则抛 TypeError。
console.log('replaceAll + 带 g 的正则：', template.replaceAll(/\{(\w+)\}/g, '<$1>'));
try {
  template.replaceAll(/\{name\}/, 'X'); // 缺少 g 标志
} catch (err) {
  console.log('陷阱演示（正则缺 g 标志）→', err.constructor.name + ':', err.message);
}

// 第二个参数同样支持函数形式
console.log(
  'replaceAll + 回调：',
  'a1b2c3'.replaceAll(/\d/g, (m) => `[${m}]`),
);

// 真实场景对比：把用户输入里的花括号占位符替换掉
const userInput = 'a.b*c'; // 含正则元字符
// 以前：'a.b*c'.replace(/a.b*c/g, 'X') 会误匹配 'aXbXc' 之类的字符串
console.log('字面量替换（安全）：', 'xaXbXc a.b*c'.replaceAll('a.b*c', 'OK'));

// ---------------------------------------------------------------------------
console.log('\n--- 5. Promise.any + AggregateError ---');
// ---------------------------------------------------------------------------

console.log('本机支持 Promise.any：' + (typeof Promise.any === 'function' ? '是' : '否'));
console.log('本机支持 AggregateError：' + (typeof AggregateError === 'function' ? '是' : '否'));

const delay = (ms, value, shouldReject = false) =>
  new Promise((resolve, reject) =>
    setTimeout(() => (shouldReject ? reject(new Error(value)) : resolve(value)), ms),
  );

// Promise.any 的语义：第一个 fulfilled 的结果就是整个 Promise 的结果；
// 只有"全部 rejected"时才 reject 一个 AggregateError（聚合错误）。
// 与 Promise.race 的区别：race 看谁先"落定"（成功或失败都算），any 只看谁先"成功"。

if (typeof Promise.any === 'function') {
  // 5.1 至少有一个成功：拿到最快的那个成功结果
  const fastest = await Promise.any([
    delay(60, '镜像A', true), // 失败
    delay(20, '镜像B', false), // 最快成功 ← 胜出
    delay(200, '镜像C', false),
  ]);
  console.log('Promise.any 成功路径 ->', fastest, '（最快的成功者，慢的成功者被忽略）');

  // 对比 Promise.race：它会拿到最先"落定"的结果，哪怕是失败
  const raceResult = await Promise.race([
    delay(60, '镜像A', true),
    delay(20, '镜像B', false),
    delay(200, '镜像C', false),
  ]).then(
    (v) => `fulfilled: ${v}`,
    (e) => `rejected: ${e.message}`,
  );
  console.log('Promise.race 同样输入 ->', raceResult, '（谁先落定就是谁）');

  // 5.2 全部失败：抛出 AggregateError，errors 属性里按顺序放着每个失败原因
  try {
    await Promise.any([
      delay(5, '错误1', true),
      delay(10, '错误2', true),
      delay(15, '错误3', true),
    ]);
  } catch (err) {
    console.log('全部失败 →', err.constructor.name, '| message:', JSON.stringify(err.message));
    console.log('  err.errors 是数组吗：', Array.isArray(err.errors));
    console.log('  err.errors 内容：', err.errors.map((e) => e.message));
    console.log('  是 AggregateError 实例吗：', err instanceof AggregateError);
  }
} else {
  // 降级：手写等价实现
  console.log('当前 Node 版本不支持，以下是等价实现');
  const promiseAny = (iterable) =>
    new Promise((resolve, reject) => {
      const promises = [...iterable];
      if (promises.length === 0) {
        reject(new AggregateError([], 'All promises were rejected'));
        return;
      }
      let rejectedCount = 0;
      const errors = new Array(promises.length);
      promises.forEach((p, i) => {
        Promise.resolve(p).then(resolve, (e) => {
          errors[i] = e;
          if (++rejectedCount === promises.length) {
            reject(new AggregateError(errors, 'All promises were rejected'));
          }
        });
      });
    });
  console.log('手写 promiseAny 结果：', await promiseAny([delay(10, 'ok', false)]));
}

// ---------------------------------------------------------------------------
console.log('\n--- 6. WeakRef / FinalizationRegistry ---');
// ---------------------------------------------------------------------------

console.log('本机支持 WeakRef：' + (typeof WeakRef === 'function' ? '是' : '否'));
console.log('本机支持 FinalizationRegistry：' + (typeof FinalizationRegistry === 'function' ? '是' : '否'));

// 背景：普通变量/对象属性都是"强引用"，只要引用在，对象就永远不会被回收。
// 想让对象"能被回收，但活着时又能复用"，以前只能自己用 Map + 手动清理，
// 或者干脆不缓存。ES2021 引入 WeakRef 表示"弱引用"：它不阻止 GC 回收目标。

if (typeof WeakRef === 'function') {
  // 6.1 基本用法
  const target = { payload: 'big data', size: 1024 * 1024 };
  const ref = new WeakRef(target);

  console.log('deref() 能拿到原对象吗：', ref.deref() === target);
  console.log('deref() 后的内容：', ref.deref().payload);

  // 关键点：deref() 可能在任意时刻返回 undefined（只要发生了 GC）。
  // 所以正确写法永远是"取一次、判空、再用"：
  const maybe = ref.deref();
  if (maybe !== undefined) {
    console.log('安全用法：拿到对象后再访问字段 ->', maybe.size);
  } else {
    console.log('对象已被回收，需要重建');
  }
  console.log('注意：deref() 返回 undefined 不代表对象已死，只代表"本次没拿到"，反之亦然。');

  // 6.2 典型场景：不阻止回收的旁挂元数据表
  const metaRegistry = new Map(); // id -> WeakRef(对象)
  let obj = { id: 1, name: '临时对象' };
  metaRegistry.set(obj.id, new WeakRef(obj));
  console.log('注册后能查到吗：', metaRegistry.get(1).deref()?.name);
  obj = null; // 去掉唯一的强引用（GC 时机由引擎决定，本示例不强制触发）
  console.log('强引用置空后（GC 尚未必然发生）：', metaRegistry.get(1).deref()?.name ?? 'undefined');

  // 6.3 FinalizationRegistry：在对象被回收后收到一次通知
  if (typeof FinalizationRegistry === 'function') {
    const finalizer = new FinalizationRegistry((heldValue) => {
      // 注意：这个回调的执行时机完全由引擎决定，可能永远不执行，
      // 因此它只能用于"清理/日志"，绝不能用于关键业务逻辑。
      console.log('  [FinalizationRegistry] 对象已被回收，携带的信息：', heldValue);
    });
    let temp = { name: '会被回收的对象' };
    finalizer.register(temp, 'temp-object-tag');
    console.log('FinalizationRegistry 已注册（回调不一定在本进程内触发）');
    temp = null; // 只有运行在 --expose-gc 下并显式 gc() 才较可能看到回调
  }
} else {
  // 降级：手写等价实现（用 Map 持有，语义上等价于强引用）
  console.log('当前 Node 版本不支持，以下是等价实现');
  class WeakRefPolyfill {
    constructor(target) {
      this._target = target; // 注意：这是强引用，不会让对象被回收
    }
    deref() {
      return this._target;
    }
  }
  const ref = new WeakRefPolyfill({ hello: 'world' });
  console.log('等价实现 deref()：', ref.deref());
}

// 6.4 使用建议（工程经验）
//   - WeakRef 适合"大对象 + 可重建的缓存"，不适合小对象（开销大于收益）。
//   - 永远不要在 deref() 之后"假设它还在"，要当成可能为 undefined 的值处理。
//   - 不要用它做对象身份映射（那是 WeakMap 的活），WeakMap 才是正解。
//   - FinalizationRegistry 的回调不可靠（时机不确定、可能不执行），
//     只应用于可选的清理动作，例如释放外部句柄、打日志。

console.log('\n' + '='.repeat(70));
console.log('ES2021 全部小节演示完毕，进程正常退出（退出码 0）');
console.log('='.repeat(70));
