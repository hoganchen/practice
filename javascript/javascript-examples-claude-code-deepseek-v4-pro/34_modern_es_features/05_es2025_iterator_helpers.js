/**
 * ============================================================================
 * 知识点：ES2025 迭代器助手（Iterator Helpers）—— 惰性求值的链式迭代
 * ============================================================================
 *
 * 【所属分类】34_modern_es_features —— 现代 ES 新特性
 * 【难度等级】高级
 * 【前置知识】17_iterators_and_generators/、08_arrays/、31_performance_and_memory/
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES2025 给"迭代器"补上了一整套和数组同名的方法：map / filter / take / drop /
 *    flatMap / reduce / toArray / forEach / some / every / find，外加一个静态方法
 *    Iterator.from()。它们统称"迭代器助手（Iterator Helpers）"。
 *    关键是：这些方法**返回的还是迭代器**，整个链条是**惰性**的 ——
 *    只有最终调用 toArray()/reduce()/forEach()（或 for...of）时才真正开始消费。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 处理超大/无限数据流：读一个 10GB 日志文件、生成斐波那契数列、
 *      监听 WebSocket 消息流。数组方法必须先把所有元素装进内存（无限流直接卡死），
 *      迭代器助手则"要多少取多少"。
 *    - 提前退出省算力：`take(3)` 拿够 3 个就停，剩余元素根本不会被计算。
 *      对"逐个元素代价很高"的场景（发 HTTP 请求、解析大对象）是数量级的优化。
 *    - 统一接口：数组、Set、Map、generator、matchAll 结果、Node 的 stream
 *      （Readable 实现了 AsyncIterator）都能套同一套链式写法。
 *    - 以前怎么写：要么手写 generator 函数一层层套，要么用第三方库（如 iterare、
 *      lodash 的 chain），要么干脆先 Array.from 全量物化。
 *
 * 3. 核心语法要点
 *    - 链式调用：`Iterator.from(arr).map(f).filter(g).take(5).toArray()`
 *    - 所有"生成型"助手返回的都是 `[object Iterator Helper]`，可以继续链式调用，
 *      也可以直接用 `for...of` 遍历（助手对象自身实现了 Symbol.iterator）。
 *    - `take(n)`：最多取 n 个；`drop(n)`：跳过前 n 个。
 *    - `flatMap(f)`：f 返回可迭代对象，会被展平一层。
 *    - 终结型助手：`toArray()` / `reduce(fn, init)` / `forEach(fn)` /
 *      `some(fn)` / `every(fn)` / `find(fn)`。调用它们才会真正开始消费。
 *    - `Iterator.from(x)`：把"可迭代对象"或"迭代器"统一包成迭代器。
 *    - 回调签名是 `(value, counter)` —— 有计数器，但没有 `array` 参数。
 *    - 生成器对象（generator）自带这些方法，因为它们继承自 `Iterator.prototype`。
 *
 * 4. 常见陷阱
 *    - **只能遍历一次**：迭代器是"一次性"的，第二次 toArray() 得到空数组。
 *      这与数组方法可以反复调用完全不同，是最容易出 bug 的地方。
 *    - **不能随机访问**：没有 `length`、没有 `[i]`、没有负索引、没有 `at()`，
 *      也不能 `toReversed()`。要随机访问就必须先 `toArray()`。
 *    - **回调参数不同**：数组方法是 `(value, index, array)`，
 *      迭代器助手是 `(value, counter)` ——没有第三个参数，别指望能读到原容器。
 *    - **惰性不等于"自动省事"**：如果链子里混入了 `toArray()`，后面的助手就不再惰性。
 *    - **没有 `sort` / `groupBy`**：排序必须物化全部元素，所以迭代器上不提供。
 *    - **忘写终结调用什么都不会发生**：`it.map(f)` 只是个"待执行计划"，
 *      不调用 toArray/forEach 就是死代码（也很容易被误以为"没生效"）。
 *    - **break/return 会触发清理**：提前退出时助手会调用源迭代器的 `return()`，
 *      生成器里的 `finally` 因此会执行 —— 这是好事（资源能正确释放），
 *      但如果你在 finally 里有副作用，要意识到它会在此时被触发。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 34_modern_es_features/05_es2025_iterator_helpers.js
 *
 * 【预期输出】
 *   依次打印 7 个小节，重点演示惰性求值（无限迭代器 + take）；
 *   每个特性都标注"本机支持：是/否"，不支持时走手写等价实现。
 * ============================================================================
 */

console.log('='.repeat(70));
console.log('ES2025 迭代器助手（Iterator Helpers）演示');
console.log('当前 Node 版本：', process.version);
console.log('='.repeat(70));

// ---------------------------------------------------------------------------
console.log('\n--- 1. 全景速览：10 个助手 + Iterator.from ---');
// ---------------------------------------------------------------------------

const helperNames = ['map', 'filter', 'take', 'drop', 'flatMap', 'reduce', 'toArray', 'forEach', 'some', 'every', 'find'];
const helperSupport = {};
for (const name of helperNames) {
  helperSupport[name] = typeof Iterator?.prototype?.[name] === 'function';
}
console.log('全局 Iterator 对象存在吗：', typeof Iterator === 'function');
console.log('本机支持：' + (Object.values(helperSupport).every(Boolean) ? '是' : '否'));
console.log('  各助手支持情况：', JSON.stringify(helperSupport));
console.log('  Iterator.from 支持：', typeof Iterator?.from === 'function');
console.log('  Iterator.prototype 就是所有生成器对象的原型链上那一层：',
  Object.getPrototypeOf(Object.getPrototypeOf((function* () {})())) === Iterator.prototype);

if (typeof Iterator?.prototype?.map !== 'function') {
  console.log('\n当前 Node 版本不支持，以下是等价实现（用 generator 手写）');
  // 手写等价实现：把每个助手写成 generator 函数
  const manual = {
    map: function* (it, fn) {
      let i = 0;
      for (const v of it) yield fn(v, i++);
    },
    filter: function* (it, fn) {
      let i = 0;
      for (const v of it) if (fn(v, i++)) yield v;
    },
    take: function* (it, n) {
      if (n <= 0) return;
      let taken = 0;
      for (const v of it) {
        yield v;
        if (++taken >= n) return;
      }
    },
  };
  console.log('  等价实现 map:', [...manual.map([1, 2, 3], (x) => x * 10)]);
  console.log('  等价实现 filter:', [...manual.filter([1, 2, 3, 4], (x) => x % 2 === 0)]);
  console.log('  等价实现 take:', [...manual.take([1, 2, 3, 4], 2)]);
  console.log('  （注意：等价实现只能用在"可迭代对象"上，且需要自己保证惰性）');
}

// ---------------------------------------------------------------------------
console.log('\n--- 2. 重点：惰性求值（无限迭代器 + take）---');
// ---------------------------------------------------------------------------

// 先定义一个"永远不会结束"的生成器：自然数 0, 1, 2, 3, ...
function* naturals() {
  let i = 0;
  while (true) {
    yield i++;
  }
}
// 再定义一个"代价很高"的元素（这里用副作用计数器模拟）
let expensiveCalls = 0;
function* expensive() {
  let i = 0;
  while (true) {
    expensiveCalls++;
    yield i++;
  }
}

// --- 用数组方法处理无限流：会直接卡死（这里用注释说明，不要真的运行）---
console.log('如果用数组方法：Array.from(naturals()) 会 OOM 卡死，');
console.log('  [1,2,3].map(...).filter(...) 也总是先把所有元素算完再说。');

// --- 用迭代器助手：要多少算多少 ---
const firstFiveSquares = naturals()
  .map((x) => x * x) // 惰性：此刻一个元素都没算
  .take(5) // 惰性：此刻还是没算
  .toArray(); // 终结调用：这时候才真正开始
console.log('无限自然数流的前 5 个平方：', firstFiveSquares);

expensiveCalls = 0;
const firstThree = expensive().take(3).toArray();
console.log('取 3 个元素后，源生成器实际被推进了', expensiveCalls, '次（不是无限次）→', firstThree);

// 用"打印日志"直观展示惰性的"按需流水线"特性：每个元素走完整条链才轮到下一个
function* tracedSource() {
  for (let i = 1; i <= 5; i++) {
    console.log(`  源: 产出 ${i}`);
    yield i;
  }
}
console.log('观察"逐元素走完整条链"的顺序（拉取驱动 / pull-based）：');
const traced = tracedSource()
  .map((x) => {
    console.log(`    map: ${x} -> ${x * 2}`);
    return x * 2;
  })
  .filter((x) => {
    const keep = x > 4;
    console.log(`      filter: ${x} ${keep ? '保留' : '丢弃'}`);
    return keep;
  });
// 到这里为止，上面那些 console.log 一条都不会打印 —— 因为还没有人"拉取"
console.log('（构造链条完毕，下面才开始消费）');
const tracedResult = traced.toArray();
console.log('结果：', tracedResult);

// 提前退出：只消费前 2 个，后面的元素连源都不会推进
let advanced = 0;
function* counted() {
  for (let i = 0; i < 1000; i++) {
    advanced++;
    yield i;
  }
}
const partial = counted().take(2).toArray();
console.log('take(2) 后源只推进了', advanced, '次，结果是', partial);

// ---------------------------------------------------------------------------
console.log('\n--- 3. 各助手逐个演示 ---');
// ---------------------------------------------------------------------------

const data = [1, 2, 3, 4, 5, 6, 7, 8];

// 3.1 map：转成迭代器助手（不是数组！）
const mapped = Iterator.from(data).map((x) => x * 10);
console.log('[map] 返回值的类型标签：', Object.prototype.toString.call(mapped), '← 是迭代器助手，不是数组');
console.log('      toArray() 后才得到：', JSON.stringify(mapped.toArray()));

// 3.2 filter
console.log('[filter] 偶数：', Iterator.from(data).filter((x) => x % 2 === 0).toArray());

// 3.3 take / drop
console.log('[take] 前 3 个：', Iterator.from(data).take(3).toArray());
console.log('[drop] 丢掉前 5 个：', Iterator.from(data).drop(5).toArray());
console.log('[take] 取超过长度也不会报错：', JSON.stringify(Iterator.from(data).take(100).toArray()));
console.log('[take] take(0) 直接得到空：', Iterator.from(data).take(0).toArray());
console.log('[drop] drop 超过长度得到空：', Iterator.from(data).drop(100).toArray());

// 3.4 flatMap
console.log(
  '[flatMap] 展平一层：',
  Iterator.from([[1, 2], [3], [], [4, 5]]).flatMap((arr) => arr).toArray(),
);
// flatMap 的经典用法：一对多展开（把一个订单展开成多个明细行）
const orders = [
  { id: 'A', items: ['键盘', '鼠标'] },
  { id: 'B', items: ['显示器'] },
];
console.log(
  '[flatMap] 一对多展开：',
  Iterator.from(orders).flatMap((o) => o.items.map((it) => `${o.id}/${it}`)).toArray(),
);
// flatMap 的回调可以返回任意"可迭代对象"，不一定是数组
console.log(
  '[flatMap] 回调返回 Set：',
  Iterator.from(['ab', 'cd']).flatMap((s) => new Set(s.split(''))).toArray(),
);
console.log(
  '[flatMap] 回调返回 generator：',
  Iterator.from([2, 3])
    .flatMap(function* (n) {
      for (let i = 0; i < n; i++) yield `#${i}`;
    })
    .toArray(),
);
// 陷阱：回调**不能返回字符串原始值**！
// 规范里 flatMap 用的是 GetIteratorFlattenable(..., reject-strings)，
// 返回字符串原始值会直接抛 TypeError（防止"字符串被逐字符展开"这种常见误用）。
try {
  Iterator.from(['ab', 'cd']).flatMap((s) => s).toArray();
} catch (err) {
  console.log('[flatMap] 陷阱演示（回调返回字符串原始值）→', err.constructor.name + ':', err.message);
}

// 3.5 reduce
console.log('[reduce] 求和：', Iterator.from(data).reduce((acc, x) => acc + x, 0));
console.log('[reduce] 不传初始值（用第一个元素当初始值）：', Iterator.from(data).reduce((a, b) => a + b));
console.log('[reduce] 求最大值：', Iterator.from(data).reduce((a, b) => (a > b ? a : b)));
try {
  Iterator.from([]).reduce((a, b) => a + b); // 空迭代器且无初始值
} catch (err) {
  console.log('[reduce] 陷阱演示（空迭代器 + 无初始值）→', err.constructor.name + ':', err.message);
}

// 3.6 forEach
let sum = 0;
const forEachReturn = Iterator.from(data).forEach((x) => {
  sum += x;
});
console.log('[forEach] 累计和 =', sum, '| 返回值 =', forEachReturn, '（undefined，不能链式继续）');

// 3.7 some / every
console.log('[some] 存在大于 7 的吗：', Iterator.from(data).some((x) => x > 7));
console.log('[every] 全部大于 0 吗：', Iterator.from(data).every((x) => x > 0));
console.log('[some] 空迭代器恒为 false：', Iterator.from([]).some(() => true));
console.log('[every] 空迭代器恒为 true（空真）：', Iterator.from([]).every(() => false));

// 3.8 find
console.log('[find] 第一个大于 5 的：', Iterator.from(data).find((x) => x > 5));
console.log('[find] 找不到返回 undefined：', Iterator.from(data).find((x) => x > 999));

// 3.9 助手对象本身也是可迭代的，可以直接 for...of
const iterableHelper = Iterator.from([1, 2, 3]).map((x) => x * 2);
console.log('[可迭代性] 助手对象有 Symbol.iterator 吗：', typeof iterableHelper[Symbol.iterator] === 'function');
const collected = [];
for (const v of iterableHelper) collected.push(v);
console.log('[可迭代性] for...of 收集到：', collected, '← 所以能直接写 for...of，不必先 toArray()');

// ---------------------------------------------------------------------------
console.log('\n--- 4. 与数组方法的区别（1）：只能遍历一次 ---');
// ---------------------------------------------------------------------------

const arr = [1, 2, 3];
// 数组方法可以随便调用多少次，每次都是全新结果
console.log('数组：第一次 map ->', arr.map((x) => x * 2));
console.log('数组：第二次 map ->', arr.map((x) => x * 2), '（数组可以反复遍历）');

const iter = Iterator.from(arr);
console.log('迭代器：第一次 toArray ->', iter.map((x) => x * 2).toArray());
console.log('迭代器：第二次 toArray ->', iter.map((x) => x * 2).toArray(), '← 空了！迭代器已被消费完');

// 这个坑的真实形态：写了一个"取前 N 个"的工具函数，被调用两次就出错
function firstTwoBad(source) {
  return source.take(2).toArray(); // source 是迭代器时，第二次调用就废了
}
const sharedIter = Iterator.from([10, 20, 30, 40]);
console.log('工具函数第 1 次调用：', firstTwoBad(sharedIter));
console.log('工具函数第 2 次调用：', firstTwoBad(sharedIter), '← bug！');

// 正确做法：让函数自己从"可迭代对象"（比如数组、Set）现场创建迭代器
function firstTwoGood(iterable) {
  return Iterator.from(iterable).take(2).toArray();
}
console.log('正确做法（传可迭代对象，内部每次重建迭代器）：');
console.log('  第 1 次：', firstTwoGood([10, 20, 30, 40]), '| 第 2 次：', firstTwoGood([10, 20, 30, 40]));

// ---------------------------------------------------------------------------
console.log('\n--- 5. 与数组方法的区别（2）：没有随机访问、没有索引化 API ---');
// ---------------------------------------------------------------------------

const it2 = Iterator.from([10, 20, 30, 40]);

// 数组能做到的，迭代器助手做不到：
console.log('数组：arr.length =', [10, 20, 30, 40].length);
console.log('数组：arr[1] =', [10, 20, 30, 40][1]);
console.log('数组：arr.at(-1) =', [10, 20, 30, 40].at(-1));
console.log('数组：arr.toReversed() =', JSON.stringify([10, 20, 30, 40].toReversed()));
console.log('迭代器：没有 length / [i] / at / toReversed / toSorted —— 要这些必须先 toArray()');
console.log('迭代器：length 属性存在吗 =', it2.length, '| 下标访问 =', it2[1]);
console.log('迭代器：sort 存在吗 =', typeof it2.sort, '| reverse 存在吗 =', typeof it2.reverse);

// 回调签名也不同：数组是 (value, index, array)，迭代器是 (value, counter)
console.log('\n回调签名对比：');
[10, 20].map((v, i, a) => console.log(`  数组 map 回调：value=${v} index=${i} array=${JSON.stringify(a)}`));
Iterator.from([10, 20])
  .map((...args) => {
    console.log(`  迭代器 map 回调：收到 ${args.length} 个参数，value=${args[0]} counter=${args[1]}`);
    return args[0];
  })
  .toArray();
console.log('  ↑ 注意：只有 2 个参数，没有数组方法里的第三个 "原容器" 参数');

// 注意：迭代器助手其实**也**会传计数器，只是没有第三个 "原容器" 参数。
// 而且这个计数器是"助手自己数出来的"，与源容器的真实下标不一定一致：
console.log(
  '  drop(2) 之后计数器从 0 重新开始：',
  Iterator.from(['a', 'b', 'c', 'd'])
    .drop(2)
    .map((v, i) => `${i}:${v}`)
    .toArray(),
  '← 真实下标是 2、3，但 counter 是 0、1',
);

// ---------------------------------------------------------------------------
console.log('\n--- 6. 适配各种数据源（不止数组）---');
// ---------------------------------------------------------------------------

// 6.1 Set / Map 的迭代器
console.log('[Set] values().map ->', new Set([1, 2, 3]).values().map((x) => x * 10).toArray());
console.log(
  '[Map] entries().map ->',
  new Map([['a', 1], ['b', 2]])
    .entries()
    .map(([k, v]) => `${k}=${v}`)
    .toArray(),
);
console.log('[Map] keys().filter ->', new Map([['a', 1], ['b', 2]]).keys().filter((k) => k === 'b').toArray());

// 6.2 生成器对象自带这些方法（因为它继承自 Iterator.prototype）
function* fib() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}
console.log('[generator] 斐波那契前 10 个 ->', JSON.stringify(fib().take(10).toArray()));
console.log('[generator] 斐波那契中的偶数，取前 4 个 ->', fib().filter((x) => x % 2 === 0).take(4).toArray());
console.log('[generator] 斐波那契前 12 个里大于 50 的第一个 ->', fib().take(12).find((x) => x > 50));

// 6.3 字符串迭代器
// 注意：字符串没有 .values() 方法（那是数组/Set/Map 才有的），
// 要用 Iterator.from(str) 或者 str[Symbol.iterator]() 拿到字符迭代器。
console.log('[String] Iterator.from(str).map ->', Iterator.from('hello').map((c) => c.toUpperCase()).toArray());
console.log('[String] 用 Symbol.iterator 拿到迭代器 ->', 'hello'[Symbol.iterator]().map((c) => c.toUpperCase()).toArray());
console.log('[String] 逐字符过滤（找出元音）->', Iterator.from('hello').filter((c) => 'aeiou'.includes(c)).toArray());
console.log('[String] 陷阱演示 ->', typeof 'hello'.values, '← 字符串没有 values() 方法');

// 6.4 matchAll 的返回值是"正则匹配迭代器"，天然适合助手
const text = '订单 A1001 金额 199，订单 B2002 金额 299';
const orderPattern = /([AB]\d{4})\s*金额\s*(\d+)/g;
const orderList = Iterator.from(text.matchAll(orderPattern))
  .map((m) => ({ code: m[1], amount: Number(m[2]) }))
  .toArray();
console.log('[matchAll] 解析出的订单 ->', JSON.stringify(orderList));
console.log(
  '[matchAll] 金额总和 ->',
  Iterator.from(text.matchAll(orderPattern)).reduce((s, m) => s + Number(m[2]), 0),
);

// 6.5 自定义可迭代对象（实现了 Symbol.iterator 的东西都能用）
const customIterable = {
  *[Symbol.iterator]() {
    yield 'x';
    yield 'y';
    yield 'z';
  },
};
console.log('[自定义可迭代对象] ->', Iterator.from(customIterable).map((s) => s.toUpperCase()).toArray());

// ---------------------------------------------------------------------------
console.log('\n--- 7. 提前退出与资源清理（return / finally）---');
// ---------------------------------------------------------------------------

// 迭代器协议里有 return() 这个"可选方法"：当消费方提前退出时，
// 会调用它来通知源"我不再需要了"，源可以借此释放资源（文件句柄、连接、锁）。
// 迭代器助手会正确地传递这个信号 —— 这是它相比"自己手写循环"的一大优势。

function* fileLineReader() {
  const lines = ['第一行', '第二行', '第三行', '第四行'];
  console.log('  [源] 打开"文件"（模拟获取资源）');
  try {
    for (const line of lines) {
      yield line;
    }
  } finally {
    // 无论正常读完还是被提前中断，都会走到这里
    console.log('  [源] 关闭"文件"（模拟释放资源）');
  }
}

console.log('场景 A：只取前 2 行就停止');
const twoLines = fileLineReader().take(2).toArray();
console.log('  拿到：', twoLines, '← 注意 finally 依然执行了，资源被正确释放');

console.log('场景 B：正常读完');
const allLines = Iterator.from(fileLineReader()).toArray();
console.log('  拿到：', allLines.length, '行');

console.log('场景 C：用 for...of + break 提前退出');
for (const line of fileLineReader().map((l) => l + '!')) {
  if (line.startsWith('第三行')) break;
  console.log('  处理：', line);
}
console.log('  → 和 take 一样，break 也会触发源的 return()，进而执行 finally');

// 对比：如果是"手写 for 循环 + 自己维护索引"，很容易忘记在提前退出时清理资源。
// 这就是"用迭代器助手做管道"的核心价值之一。

// ---------------------------------------------------------------------------
console.log('\n--- 8. 实战：一条流水线完成"过滤 + 转换 + 取前 N" ---');
// ---------------------------------------------------------------------------

// 场景：从一份（可能非常大的）用户列表里，找出前 3 位"活跃 + 有邮箱"的用户，
//       并格式化成展示用的字符串。用迭代器助手可以让"前 3 位"之外的元素
//       完全不参与后续计算。
function* userStream(users) {
  for (const u of users) {
    console.log(`  [源] 读取用户 ${u.name}`);
    yield u;
  }
}

const users = [
  { name: '安琪', active: true, email: 'anqi@example.com', vip: false },
  { name: '博文', active: false, email: 'bowen@example.com', vip: false },
  { name: '晨曦', active: true, email: null, vip: true },
  { name: '丁一', active: true, email: 'dingyi@example.com', vip: true },
  { name: '尔雅', active: true, email: 'erya@example.com', vip: false },
  { name: '方舟', active: true, email: 'fangzhou@example.com', vip: false },
];

console.log('只取前 3 个满足条件的用户（注意源的读取在满足后就停了）：');
const result = userStream(users)
  .filter((u) => u.active) // 惰性
  .filter((u) => u.email !== null) // 惰性
  .take(3) // 惰性：拿够 3 个就不再继续拉
  .map((u) => `${u.vip ? '★' : ' '} ${u.name} <${u.email}>`) // 惰性
  .toArray(); // 终结调用，开始执行

console.log('结果：');
for (const line of result) console.log('   ', line);

// 对照：等价的数组写法（永远会遍历完整数组）
console.log('\n等价的数组写法（会读完整个数组，哪怕只需要 3 个）：');
const arrayResult = users
  .filter((u) => u.active)
  .filter((u) => u.email !== null)
  .slice(0, 3)
  .map((u) => `${u.vip ? '★' : ' '} ${u.name} <${u.email}>`);
console.log('  结果相同：', JSON.stringify(arrayResult) === JSON.stringify(result));

console.log('\n小结：');
console.log('  · 数据量小、需要随机访问或反复遍历 → 用数组方法');
console.log('  · 数据量大 / 无限流 / 只想取前几个 → 用迭代器助手');
console.log('  · 两者可以混用：迭代器助手 + toArray() 之后就能继续用数组方法');

console.log('\n' + '='.repeat(70));
console.log('ES2025 迭代器助手全部小节演示完毕，进程正常退出（退出码 0）');
console.log('='.repeat(70));
