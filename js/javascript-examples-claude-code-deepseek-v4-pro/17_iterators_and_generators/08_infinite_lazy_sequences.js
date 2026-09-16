/**
 * ============================================================================
 * 知识点：惰性无限序列 —— 用生成器表达"取之不尽"的数据流
 * ============================================================================
 *
 * 【所属分类】17_iterators_and_generators —— 迭代器与生成器
 * 【难度等级】高级
 * 【前置知识】17_iterators_and_generators/06_generator_delegation.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    生成器可以包含 while (true) 这样的死循环而不卡死程序，因为它每次
 *    yield 之后就"暂停"了，控制权回到调用方。这类生成器叫无限序列/惰性序列：
 *    元素不是一次性算出来的，而是"你要一个，我才算一个"。
 *
 * 2. 为什么需要
 *    用数组表达序列必须先算完所有元素。如果序列无限，数组根本装不下；
 *    即使有限（比如一百万个素数），先全部算出来也会浪费内存和时间。
 *    惰性求值把"生产"与"消费"解耦：只算用得到的部分。
 *    另外惰性还带来可组合性——map/filter 可以链式套在无限流上，只要
 *    最终有 take(n) 这样的"止流阀"。
 *
 * 3. 核心语法要点
 *    - 无限生成器本身没问题，危险的是"无限地消费它"
 *      （如 [...infinite] 或 for...of 不加 break 会永远跑）。
 *    - take(iterable, n)：通用的"取前 n 个"函数，是止流阀。
 *    - 惰性 map/filter：返回新生成器，不立即计算。
 *    - 惰性求值 vs 及早求值（eager）：数组方法 map/filter 都是及早求值。
 *
 * 4. 常见陷阱
 *    - 对无限生成器用展开运算符或 Array.from：内存耗尽、进程卡死。
 *    - 惰性链上重复遍历：生成器是一次性的，链式结果不能被消费两次。
 *    - 以为 filter 后的长度可控：过滤会跳过元素，take 拿到的是"通过过滤的
 *      前 n 个"，而不是"前 n 个里通过过滤的"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 17_iterators_and_generators/08_infinite_lazy_sequences.js
 *
 * 【预期输出】
 *   演示自然数流、斐波那契流、惰性 map/filter 管道，以及惰性与及早求值的对比。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 工具函数：take / lazyMap / lazyFilter
// ---------------------------------------------------------------------------

console.log('--- 0. 先准备三个工具函数 ---');

/**
 * take —— 从任意可迭代对象里取前 n 个元素，返回数组。
 * 它是"止流阀"：没有它，无限序列不能直接消费。
 */
function* take(iterable, n) {
  if (n <= 0) return;
  let count = 0;
  for (const item of iterable) {
    yield item;
    count++;
    if (count >= n) return; // 取够 n 个就结束，剩下的一个都不算
  }
}

/**
 * lazyMap —— 惰性映射：返回新的生成器，不会立刻计算。
 * 注意 for...of 会驱动上游生成器，每次只走一步。
 */
function* lazyMap(iterable, fn) {
  let index = 0;
  for (const item of iterable) {
    yield fn(item, index++);
  }
}

/** lazyFilter —— 惰性过滤，同样返回生成器 */
function* lazyFilter(iterable, predicate) {
  let index = 0;
  for (const item of iterable) {
    if (predicate(item, index++)) yield item;
  }
}

console.log('take / lazyMap / lazyFilter 已就绪（它们本身都是生成器，不会立刻计算）。');

// ---------------------------------------------------------------------------
// 1. 自然数流
// ---------------------------------------------------------------------------

console.log('\n--- 1. 无限自然数流 ---');

function* naturals(start = 1) {
  let n = start;
  // 这是一个永不退出的循环，但因为有 yield，它每次都会让出控制权
  while (true) {
    yield n++;
  }
}

// 【危险示范】下面这行会耗尽内存并卡死进程，所以注释掉不执行：
// const boom = [...naturals()];

// 【正确示范】用 take 做止流阀
console.log('前 5 个自然数：', [...take(naturals(), 5)]);
console.log('从 100 开始的 3 个：', [...take(naturals(100), 3)]);

// 关键理解：take(naturals(), 5) 内部只调用了 5 次 next()，
// 第 6 个自然数根本没有被计算过。用计数器可以证明这一点。

let computedCount = 0;
function* countedNaturals() {
  let n = 1;
  while (true) {
    computedCount++; // 每产出一个数就 +1
    yield n++;
  }
}

const five = [...take(countedNaturals(), 5)];
console.log('取到：', five, '，实际计算次数：', computedCount); // 恰好 5 次

// ---------------------------------------------------------------------------
// 2. 斐波那契流
// ---------------------------------------------------------------------------

console.log('\n--- 2. 无限斐波那契数列 ---');

function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;            // 先产出当前项
    [a, b] = [b, a + b]; // 再推进到下一项（数组解构交换）
  }
}

console.log('前 10 项：', [...take(fibonacci(), 10)]);
console.log('第 20 到 25 项：', [...take(lazyFilter(fibonacci(), (_, i) => i >= 19), 6)]);

// 大数也不用担心溢出问题（JS 数字在 2^53 之后会丢精度，这里演示其边界）
console.log('第 80 项（注意精度）：', [...take(fibonacci(), 80)].at(-1));

// ---------------------------------------------------------------------------
// 3. 惰性管道：把多个操作串起来
// ---------------------------------------------------------------------------

console.log('\n--- 3. 惰性管道：无限流 + map + filter ---');

// 语义：从自然数里取出偶数，乘以 10，取前 6 个
const pipeline = take(
  lazyMap(
    lazyFilter(naturals(), (n) => n % 2 === 0), // 偶数：2, 4, 6, ...
    (n) => n * 10,                              // 乘 10：20, 40, 60, ...
  ),
  6,
);

console.log('偶数→乘10→前6个：', [...pipeline]);

// 更复杂的管道：斐波那契中的偶数，取前 5 个
console.log(
  '斐波那契中的偶数前 5 个：',
  [...take(lazyFilter(fibonacci(), (n) => n % 2 === 0), 5)],
);

// 注意：如果把 filter 放到 take 后面，含义就完全不同了：
console.log(
  '先取前 10 个斐波那契再筛偶数：',
  [...lazyFilter(take(fibonacci(), 10), (n) => n % 2 === 0)],
);
// 对比两者的元素个数，就能体会"操作顺序决定结果"。

// ---------------------------------------------------------------------------
// 4. 惰性 vs 及早求值
// ---------------------------------------------------------------------------

console.log('\n--- 4. 惰性求值 vs 及早求值 ---');

// 及早求值版本：必须先生成整个数组，再做 map/filter。
// 面对"无限"或"极其庞大"的序列，这种写法根本行不通。
function eagerMap(arr, fn) {
  const out = [];
  for (const x of arr) out.push(fn(x));
  return out;
}

// 场景：把 1..1000 每个数乘 2，再筛出能被 3 整除的，只要前 5 个。
const eagerSource = Array.from({ length: 1000 }, (_, i) => i + 1);

let eagerMapCalls = 0;
const eagerResult = eagerMap(eagerSource, (n) => {
  eagerMapCalls++;
  return n * 2;
}).filter((n) => n % 3 === 0);

console.log('及早求值：map 回调执行了', eagerMapCalls, '次（1000 个元素全部处理完才筛）');
console.log('及早求值结果前 5 个：', eagerResult.slice(0, 5));

// 惰性版本：同一个需求，但每个元素"按需"流过整条管道，
// 一旦凑够 5 个结果就立刻停止，后面的元素连算都不用算。
let lazyMapCalls = 0;
const lazyPipeline = take(
  lazyFilter(
    lazyMap(naturals(), (n) => {
      lazyMapCalls++; // 只有真正被拉取到的元素才会执行到这里
      return n * 2;
    }),
    (n) => n % 3 === 0,
  ),
  5,
);
const lazyResult = [...lazyPipeline];
console.log('惰性求值：map 回调执行了', lazyMapCalls, '次（凑够 5 个就停）');
console.log('惰性求值结果前 5 个：', lazyResult);

// 两者结果一致，但"做了多少无用功"差别巨大。
console.log(
  '结果一致吗：',
  JSON.stringify(eagerResult.slice(0, 5)) === JSON.stringify(lazyResult),
);

// ---------------------------------------------------------------------------
// 5. 实用案例：惰性分页读取
// ---------------------------------------------------------------------------

console.log('\n--- 5. 实用案例：用一个"数据源"模拟无限数据 ---');

// 这里用生成器模拟"从外部一点点取数据"的场景（真实项目里可能是分页接口）。
function* dataSource() {
  let i = 0;
  while (true) {
    i++;
    // 真实场景此处会是 await 请求下一页；本篇仍用同步生成器演示惰性
    yield { id: i, name: `用户-${i}` };
  }
}

// 消费者只关心"给我 3 个名字以 1 结尾的用户"
const wanted = [];
for (const user of dataSource()) {
  if (user.name.endsWith('1')) wanted.push(user.name);
  if (wanted.length === 3) break; // 够了就退出，不会多取一条数据
}
console.log('找到的用户：', wanted);

console.log('\n示例结束。');
