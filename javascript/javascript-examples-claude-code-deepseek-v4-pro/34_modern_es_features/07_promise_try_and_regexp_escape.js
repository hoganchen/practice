/**
 * ============================================================================
 * 知识点：ES2025 三件套 —— Promise.try、RegExp.escape、Array.fromAsync
 * ============================================================================
 *
 * 【所属分类】34_modern_es_features —— 现代 ES 新特性
 * 【难度等级】进阶
 * 【前置知识】18_async/06_promise_combinators.js、13_regexp/、17_iterators_and_generators/
 *
 * 【也见】18_async/11_promise_static_methods.js —— Promise.try 在「Promise 静态方法」专场里也完整讲过。
 *        那篇按方法逐个讲语义，本文件从"ES2025 新特性"视角讲它与 Promise.resolve().then 的时机差异。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这三个都是 ES2025 新增的静态方法，分别解决"异步错误处理 / 正则转义 /
 *    异步集合转换"三个长期存在的痛点：
 *      (1) Promise.try(fn)      —— 把"可能同步抛错、也可能返回 Promise"的调用统一成 Promise
 *      (2) RegExp.escape(str)   —— 把任意字符串转义成"可以安全放进正则的字面量"
 *      (3) Array.fromAsync(x)   —— 把"异步可迭代对象 / 含 Promise 的可迭代对象"转成数组
 *
 * 2. 为什么需要（真实项目场景）
 *    - Promise.try：这是最典型的"混合错误源"问题。一个函数可能
 *        · 参数校验失败 → 同步 throw
 *        · 网络请求失败 → 返回 rejected promise
 *      用 `try { await fn() } catch` 当然可以，但如果你想**返回**一个 Promise
 *      （而不是立刻 await），以前就没有优雅的写法：
 *        `new Promise(r => r(fn()))` 不能捕获 fn() 的同步抛错；
 *        `Promise.resolve().then(fn)` 能捕获，但会让 fn 延后一个微任务执行。
 *      Promise.try 两全其美：**同步执行** fn，同时把同步抛错也变成 rejection。
 *    - RegExp.escape：把用户输入（搜索关键词、文件名、标签）当字面量拼进正则时，
 *      必须转义 `.` `*` `(` 等元字符，否则轻则匹配错误，重则抛语法异常，
 *      更糟的是可能造成 ReDoS（灾难性回溯）。以前每个项目都自己抄一份
 *      `escapeRegExp` 工具函数，写法五花八门，最容易漏掉 `-`、`/` 或忘记处理
 *      开头是字母数字的情况。现在有了标准实现。
 *    - Array.fromAsync：处理"分页拉取所有数据""逐个读流"这类异步集合时，
 *      以前必须写 `const out = []; for await (const x of src) out.push(x);`，
 *      或者 `await Promise.all([...src])`（后者对异步迭代器不生效）。
 *
 * 3. 核心语法要点
 *    - `Promise.try(fn, ...args)`：**同步**调用 fn（参数透传），返回 Promise。
 *      fn 抛错 → 返回 rejected promise；fn 返回普通值 → 返回 fulfilled promise；
 *      fn 返回 Promise → 直接采用它的结果。
 *    - `RegExp.escape(str)`：返回转义后的字符串，可直接拼进正则源码。
 *      会转义所有正则语法字符；开头若是 ASCII 字母/数字，会转成 `\x61` 形式的十六进制转义；
 *      空格、`-`、`,`、`/` 等也会被转义（保证在任何位置、任何标志下都安全）。
 *    - `Array.fromAsync(items, mapFn?, thisArg?)`：返回 Promise<Array>。
 *      接受：异步可迭代对象、同步可迭代对象、类数组对象。
 *      对每个元素都会 `await`（同步迭代器里的 Promise 也会被等待）。
 *
 * 4. 常见陷阱
 *    - `Promise.try` 与 `Promise.resolve().then(fn)` 的**执行时机不同**：
 *      前者在**当前同步代码块内**立刻执行 fn，后者要等一轮微任务。
 *      依赖"副作用在 await 之前完成"的代码，只能选 Promise.try。
 *    - `Promise.try` 的额外参数是**透传**给 fn 的（`Promise.try(f, a, b)` ≡ `f(a, b)`），
 *      它不像 `.then` 那样会把结果传下去。
 *    - RegExp.escape **不是**"把字符串变成合法正则文本"的通用工具：
 *      它只保证"作为字面量匹配"，如果你想用它拼 `\d` 之类的语法，那会被转义掉。
 *    - 不要自己再叠加一层转义（双重转义会导致匹配失败）。
 *    - `Array.fromAsync` 是**串行**的（一个元素处理完才处理下一个），
 *      对"互相独立的异步任务"来说比 `Promise.all` 慢；
 *      它的优势是顺序确定、并发可控、不会瞬间打爆下游。
 *    - `Array.fromAsync` 对"既不可迭代、也没有 length 的对象"返回空数组
 *      （与 Array.from 行为一致），不会抛错，别指望它帮你报错。
 *    - `Array.fromAsync` 出错时会**整体 reject**，已经处理完的部分不会返回。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 34_modern_es_features/07_promise_try_and_regexp_escape.js
 *
 * 【预期输出】
 *   依次打印 3 个大节（Promise.try / RegExp.escape / Array.fromAsync）。
 *   每个特性都标注"本机支持：是/否"，不支持时自动走手写等价实现分支。
 * ============================================================================
 */

console.log('='.repeat(70));
console.log('ES2025：Promise.try / RegExp.escape / Array.fromAsync');
console.log('当前 Node 版本：', process.version);
console.log('='.repeat(70));

// ===========================================================================
// 一、Promise.try
// ===========================================================================
console.log('\n========== 一、Promise.try ==========');

const promiseTrySupported = typeof Promise.try === 'function';
console.log('本机支持：' + (promiseTrySupported ? '是' : '否'));

// --- 1.1 它要解决的问题：同一个函数，可能同步抛错，也可能返回 rejected promise ---

// 这是一个"混合错误源"的典型函数
function parseOrFetch(mode) {
  if (mode === 'bad-argument') {
    // 同步抛出：参数校验失败
    throw new TypeError('mode 参数非法');
  }
  if (mode === 'network') {
    // 异步失败：返回一个 rejected promise
    return Promise.reject(new Error('网络请求失败'));
  }
  return Promise.resolve({ mode, ok: true });
}

// 【以前写法 A】直接调用 fn —— 同步抛错会炸在调用处，你**根本拿不到 Promise**
try {
  const p = parseOrFetch('bad-argument'); // 这一行就抛了，p 根本没被赋值
  await p;
} catch (err) {
  console.log('[以前写法A] const p = fn() → 同步抛错炸在调用处，而不是变成 rejection:', err.message);
}
console.log('  ↑ 问题在于：调用方被迫用 try/catch 包住"调用"这件事，而不是用 .catch 处理"结果"');

// 【以前写法 B】new Promise(resolve => resolve(fn())) —— 能兜住同步抛错，但很晦涩
// 原理：Promise 构造器会把"执行器内部抛出的错误"转成 rejection。
// 所以这个写法其实是**可行**的，只是可读性差、容易被误写回写法 A。
const oldWayB = await new Promise((resolve) => resolve(parseOrFetch('bad-argument'))).then(
  () => '成功',
  (err) => '失败: ' + err.message,
);
console.log('[以前写法B] new Promise(r => r(fn())) →', oldWayB, '（可行，但没人愿意写这个）');

// 【以前写法 C】Promise.resolve().then(() => fn()) —— 能兜住，但 fn 会被推迟到下一个微任务
let executeOrder = [];
Promise.resolve().then(() => {
  executeOrder.push('Promise.resolve().then 里的 fn 执行了');
});
executeOrder.push('同步代码继续执行');
await Promise.resolve();
await Promise.resolve();
console.log('[以前写法C] Promise.resolve().then 的执行顺序：', executeOrder.join(' → '));
console.log('  ↑ fn 被推迟了：如果后面的同步代码依赖 fn 已经产生的副作用，这里就会出 bug');

// 【现在写法】Promise.try —— 同步执行 + 统一捕获
let tryOrder = [];
Promise.try(() => {
  tryOrder.push('Promise.try 里的 fn 执行了（同步！）');
});
tryOrder.push('同步代码继续执行');
console.log('[现在写法] Promise.try 的执行顺序：', tryOrder.join(' → '), '← fn 是同步执行的');

// --- 1.2 三种返回值形态都能正确处理 ---
console.log('\n[1.2] Promise.try 的三种输入形态：');

if (promiseTrySupported) {
  // 形态 1：返回普通值 → fulfilled
  console.log('  返回普通值 42 →', await Promise.try(() => 42));

  // 形态 2：同步抛错 → rejected
  try {
    await Promise.try(() => {
      throw new Error('同步抛出的错误');
    });
  } catch (err) {
    console.log('  同步抛错 → 变成 rejection:', err.constructor.name + ':', err.message);
  }

  // 形态 3：返回 Promise → 直接采用其结果
  console.log(' 返回 resolved promise →', await Promise.try(() => Promise.resolve('异步成功')));
  try {
    await Promise.try(() => Promise.reject(new Error('异步失败')));
  } catch (err) {
    console.log('  返回 rejected promise → 正常冒泡:', err.message);
  }

  // 三种形态可以用同一段 catch 统一处理 —— 这正是它最大的价值
  console.log('\n[1.3] 统一处理混合错误源（同一段 catch 覆盖同步/异步）：');
  for (const mode of ['ok', 'bad-argument', 'network']) {
    try {
      const result = await Promise.try(() => parseOrFetch(mode));
      console.log(`  模式 ${mode.padEnd(12)} → 成功: ${JSON.stringify(result)}`);
    } catch (err) {
      console.log(`  模式 ${mode.padEnd(12)} → 失败: ${err.message}`);
    }
  }

  // 参数透传
  console.log('\n[1.4] 额外参数会透传给 fn（等价于 f(a, b)）：');
  console.log('  Promise.try(函数, 2, 3) →', await Promise.try((a, b) => a + b, 2, 3));
  console.log('  → 注意：参数是"透传"给 fn，而不是像 .then 那样传上一步结果');
} else {
  console.log('当前 Node 版本不支持，以下是等价实现');
  // 等价实现：用同步执行 + try/catch 包一层
  Promise.try = function promiseTry(fn, ...args) {
    return new Promise((resolve) => {
      // 关键点：在 Promise 构造器内部**同步**调用 fn，
      // 这样 fn 的同步抛错会被 Promise 构造器捕获并变成 rejection。
      resolve(fn(...args));
    });
  };
  console.log('  等价实现：返回普通值 →', await Promise.try(() => 42));
  try {
    await Promise.try(() => {
      throw new Error('同步抛出的错误');
    });
  } catch (err) {
    console.log('  等价实现：同步抛错 →', err.message);
  }
}

// --- 1.5 实战：把"可能同步抛错的校验"和"异步 IO"统一成一个 Promise 管道 ---
console.log('\n[1.5] 实战：统一校验 + 异步查询的错误处理管道');

const USERS = { 1: { id: 1, name: '安琪' }, 2: { id: 2, name: '博文' } };

function findUser(id) {
  // 同步校验：id 必须是正整数，否则同步抛错
  if (!Number.isInteger(id) || id <= 0) {
    throw new RangeError(`id 必须是正整数，收到 ${id}`);
  }
  // 异步查询：模拟数据库
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = USERS[id];
      user ? resolve(user) : reject(new Error(`用户 ${id} 不存在`));
    }, 5);
  });
}

for (const input of [1, 'abc', 999, -1]) {
  const outcome = await Promise.try(() => findUser(input)).then(
    (user) => `成功 → ${user.name}`,
    (err) => `失败 → ${err.constructor.name}: ${err.message}`,
  );
  console.log(`  findUser(${JSON.stringify(input)})：${outcome}`);
}
console.log('  ↑ 同步校验错误和异步查询错误，用同一个 .then(onRejected) 就全处理了');

// ===========================================================================
// 二、RegExp.escape
// ===========================================================================
console.log('\n========== 二、RegExp.escape ==========');

const regexpEscapeSupported = typeof RegExp.escape === 'function';
console.log('本机支持：' + (regexpEscapeSupported ? '是' : '否'));

// --- 2.1 它要解决的问题：把用户输入当字面量拼进正则 ---
const userInput = '价格是 9.9 元（含税）*重要*';
console.log('\n用户输入：', JSON.stringify(userInput));

// 【以前写法】手写转义函数（每个项目里都有一份，且很容易写漏）
function legacyEscapeRegExp(str) {
  // 常见版本 1：只转义了这些，漏了 - / 和开头的字母数字等情况
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
const legacySource = legacyEscapeRegExp(userInput);
console.log('[以前写法] 手写转义后的正则源码：', JSON.stringify(legacySource));

// 不转义会怎样？直接拼接会抛语法错误或匹配错误
try {
  new RegExp('（' + userInput + '）');
} catch (err) {
  console.log('[以前写法] 不转义的后果 →', err.constructor.name + ':', err.message);
}

// 【现在写法】RegExp.escape
if (regexpEscapeSupported) {
  const escaped = RegExp.escape(userInput);
  console.log('[现在写法] RegExp.escape 的结果：', JSON.stringify(escaped));

  const re = new RegExp(escaped);
  console.log('  用转义结果建正则，匹配原文：', re.test(userInput), '（必须为 true）');
  console.log('  匹配替换掉「.」之后的串：', re.test('价格是 9x9 元（含税）*重要*'), '（必须为 false）');

  // 在替换场景里安全使用
  const logs = [
    '用户输入：价格是 9.9 元（含税）*重要*',
    '用户输入：价格是 9X9 元（含税）*重要*',
  ];
  console.log('  在日志里精确查找这一条：');
  for (const line of logs) {
    console.log(`    ${line} → ${re.test(line) ? '命中' : '未命中'}`);
  }
} else {
  console.log('当前 Node 版本不支持，以下是等价实现');
}

// --- 2.2 标准实现的转义规则细节 ---
console.log('\n[2.2] RegExp.escape 的转义规则细节：');
if (regexpEscapeSupported) {
  const samples = [
    ['正则元字符', 'a.b*c+?'],
    ['字符类相关', '[abc]{1,2}'],
    ['分组与或', '(a|b)^$'],
    ['斜杠与短横线', 'a/b-c'],
    ['空格与制表符', 'a b\tc'],
    ['开头是字母', 'abc'],
    ['开头是数字', '123'],
    ['开头是符号', '.abc'],
    ['中文（无需转义）', '你好世界'],
    ['空字符串', ''],
  ];
  for (const [label, raw] of samples) {
    console.log(`  ${label.padEnd(10)} ${JSON.stringify(raw).padEnd(16)} → ${JSON.stringify(RegExp.escape(raw))}`);
  }
  console.log('  观察：开头若是 ASCII 字母/数字，会被转成 \\x61 这样的十六进制转义；');
  console.log('       空格、-、,、/ 也会被转义 —— 这样在任何位置、任何标志下都绝对安全。');

  // 关键性质：转义后必定只按字面量匹配
  console.log('\n[2.3] 关键性质验证：f(RegExp.escape(s)) 精确匹配 s，且不匹配任何"近似串"');
  const tricky = ['1+1=2', 'a.b', 'aXb', 'file.txt', 'filextxt', 'c++', 'c--'];
  const target = 'a.b';
  const safeRe = new RegExp(RegExp.escape(target));
  for (const s of tricky) {
    console.log(`    匹配 ${JSON.stringify(s).padEnd(12)} → ${safeRe.test(s)}${s === target ? '  ← 只有它应该为 true' : ''}`);
  }

  // 与标志位组合使用
  console.log('\n[2.4] 与标志位组合：');
  const text = 'Apple apple APPLE';
  const caseInsensitive = new RegExp(RegExp.escape('apple'), 'gi');
  console.log('    不区分大小写全局查找 apple →', text.match(caseInsensitive));

  // 与 u / v 标志一起也是安全的
  const unicodeSafe = new RegExp(RegExp.escape('a.b'), 'u');
  console.log('    配合 u 标志 →', unicodeSafe.test('a.b'), '(u 模式下 . 的行为不同，所以必须转义)');
} else {
  // 手写等价实现（这是业界流传最广的版本，注意它把 - , / 空格 也一起处理了）
  const escapeRegExp = (str) => {
    const specials = '\\^$.*+?()[]{}|/-,'; // 常见元字符 + 在 v 模式下也危险的字符
    let out = '';
    for (const ch of String(str)) {
      out += specials.includes(ch) ? '\\' + ch : ch;
    }
    // 开头若是 ASCII 字母/数字，用十六进制转义，避免被当作量词/标识符的一部分
    if (/^[0-9A-Za-z]/.test(String(str))) {
      out = '\\x' + String(str).codePointAt(0).toString(16).padStart(2, '0') + out.slice(1);
    }
    return out;
  };
  console.log('    等价实现：', JSON.stringify(escapeRegExp(userInput)));
  console.log('    匹配验证：', new RegExp(escapeRegExp(userInput)).test(userInput));
}

// --- 2.5 陷阱 ---
console.log('\n[2.5] 陷阱提醒：');
console.log('  · RegExp.escape 只保证"按字面量匹配"，不能用来拼装正则语法（\\d 也会被转义）');
console.log('  · 不要再对它二次转义，否则会匹配到多余的斜杠');
console.log('  · 它处理的是"字符串"，传非字符串会先被 String() 转换');

// ===========================================================================
// 三、Array.fromAsync
// ===========================================================================
console.log('\n========== 三、Array.fromAsync ==========');

const fromAsyncSupported = typeof Array.fromAsync === 'function';
console.log('本机支持：' + (fromAsyncSupported ? '是' : '否'));

// --- 3.1 它要解决的问题：把"异步数据源"收集成数组 ---
async function* fetchPages() {
  // 模拟分页接口：共 3 页
  for (let page = 1; page <= 3; page++) {
    await new Promise((r) => setTimeout(r, 5)); // 模拟网络往返
    yield { page, items: [`第${page}页-数据A`, `第${page}页-数据B`] };
  }
}

// 【以前写法】手写 for await 循环
const collectedOld = [];
for await (const chunk of fetchPages()) {
  collectedOld.push(chunk);
}
console.log('[以前写法] for await 手写循环 → 收集到', collectedOld.length, '页');

// 另一个"以前写法"：Promise.all —— 但它对异步迭代器不管用
// const bad = await Promise.all(fetchPages());  // TypeError: fetchPages() is not iterable
try {
  await Promise.all(fetchPages());
} catch (err) {
  console.log('[以前写法] Promise.all 的问题 →', err.constructor.name + ':', err.message, '（异步迭代器不能直接给 Promise.all）');
}

// 【现在写法】Array.fromAsync
if (fromAsyncSupported) {
  const pages = await Array.fromAsync(fetchPages());
  console.log('[现在写法] Array.fromAsync →', JSON.stringify(pages));

  // 3.2 也接受"同步可迭代对象"，并且会 await 里面的 Promise
  console.log('\n[3.2] 同步可迭代对象 + 内含 Promise（Array.from 做不到）：');
  const mixed = [1, Promise.resolve(2), Promise.resolve(3), 4];
  console.log('    Array.from 的结果：', Array.from(mixed), '← Promise 原样保留');
  console.log('    Array.fromAsync 的结果：', await Array.fromAsync(mixed), '← Promise 被等待');

  // 3.3 mapFn
  console.log('\n[3.3] 第二个参数 mapFn（可以是 async 函数）：');
  console.log('    同步 mapFn →', await Array.fromAsync([1, 2, 3], (x) => x * 10));
  console.log('    异步 mapFn →', await Array.fromAsync([1, 2, 3], async (x) => x * 100));

  // 3.4 类数组对象
  console.log('\n[3.4] 类数组对象（有 length 和下标，但不可迭代）：');
  const arrayLike = { length: 3, 0: 'a', 1: Promise.resolve('b'), 2: 'c' };
  console.log('    →', await Array.fromAsync(arrayLike));

  // 3.5 其他数据源
  console.log('\n[3.5] 其他数据源：');
  console.log('    Set →', await Array.fromAsync(new Set(['x', 'y'])));
  console.log('    字符串 →', await Array.fromAsync('abc'));
  console.log('    数组（无异步元素）→', await Array.fromAsync([1, 2, 3]));
  console.log('    既不可迭代也没有 length →', await Array.fromAsync({ a: 1 }), '（空数组，不报错）');

  // 3.6 关键行为：串行处理（顺序确定、并发可控）
  const timeline = [];
  async function* sequentialSource() {
    for (let i = 1; i <= 3; i++) {
      timeline.push(`开始 ${i}`);
      await new Promise((r) => setTimeout(r, 5));
      timeline.push(`结束 ${i}`);
      yield i;
    }
  }
  await Array.fromAsync(sequentialSource());
  console.log('\n[3.6] 串行验证（时间线）→', timeline.join(' , '));
  console.log('    可以看到是"处理完一个才开始下一个"，不是并发 —— 顺序确定、不会打爆下游');
  console.log('    对照：如果每个元素是独立的慢请求，想并发就该用 Promise.all(...)');

  // 3.7 错误处理：整体 reject
  console.log('\n[3.7] 错误处理：');
  async function* failingSource() {
    yield 1;
    yield 2;
    throw new Error('第 3 个元素读取失败');
  }
  try {
    await Array.fromAsync(failingSource());
  } catch (err) {
    console.log('    数据源抛错 →', err.constructor.name + ':', err.message, '（已收集的部分不会返回）');
  }
  try {
    await Array.fromAsync([1, 2, 3], (x) => {
      if (x === 2) throw new Error('mapFn 抛错');
      return x;
    });
  } catch (err) {
    console.log('    mapFn 抛错 →', err.constructor.name + ':', err.message);
  }

  // 3.8 实战：分页拉全量 + 展平 + 过滤
  console.log('\n[3.8] 实战：分页拉取全部数据并展平成扁平列表');
  const flat = (await Array.fromAsync(fetchPages())).flatMap((p) => p.items);
  console.log('    展平后：', JSON.stringify(flat));
  const flatThenFilter = (await Array.fromAsync(fetchPages(), (p) => p.items[0])).filter(Boolean);
  console.log('    用 mapFn 取每页第一条：', JSON.stringify(flatThenFilter));
} else {
  console.log('当前 Node 版本不支持，以下是等价实现');
  const arrayFromAsync = async (items, mapFn, thisArg) => {
    const out = [];
    if (items != null && typeof items[Symbol.asyncIterator] === 'function') {
      let i = 0;
      for await (const v of items) {
        out.push(mapFn ? await mapFn.call(thisArg, v, i++) : await v);
      }
    } else if (items != null && typeof items[Symbol.iterator] === 'function') {
      let i = 0;
      for (const v of items) {
        out.push(mapFn ? await mapFn.call(thisArg, v, i++) : await v);
      }
    } else if (items != null && typeof items.length === 'number') {
      for (let i = 0; i < items.length; i++) {
        out.push(mapFn ? await mapFn.call(thisArg, items[i], i) : await items[i]);
      }
    }
    return out;
  };
  console.log('    等价实现（同步数组）→', await arrayFromAsync([1, Promise.resolve(2), 3]));
  console.log('    等价实现（异步迭代器）→', (await arrayFromAsync(fetchPages())).length, '页');
}

console.log('\n' + '='.repeat(70));
console.log('ES2025 三件套全部小节演示完毕，进程正常退出（退出码 0）');
console.log('='.repeat(70));
