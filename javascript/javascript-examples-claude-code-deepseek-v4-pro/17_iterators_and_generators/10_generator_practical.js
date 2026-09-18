/**
 * ============================================================================
 * 知识点：生成器实战 —— 分页器、ID 生成器、树遍历与生成器驱动的异步流程
 * ============================================================================
 *
 * 【所属分类】17_iterators_and_generators —— 迭代器与生成器
 * 【难度等级】高级
 * 【前置知识】17_iterators_and_generators/09_async_iterator.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本篇把生成器放进四个真实场景：
 *      (1) 分页器：把"第几页、有没有下一页"这些游标状态藏进生成器闭包；
 *      (2) ID 生成器：每次调用产出一个自增且带前缀的唯一 ID；
 *      (3) 树遍历：用递归 yield* 做深度优先/广度优先遍历；
 *      (4) 生成器驱动的异步流程（类 co 库）：yield 一个 Promise，
 *          由外部驱动器 await 后把结果送回生成器。
 *
 * 2. 为什么需要
 *    这些场景的共同点是"状态机 + 反复推进"。用普通写法要显式维护
 *    一堆游标变量、循环边界、回调嵌套；用生成器可以把"推进节奏"
 *    交给调用方（for...of / 驱动器），自己只描述"状态怎么变、值怎么产"。
 *    第 (4) 项尤其重要：async/await 就是把这种驱动逻辑做进了语言里。
 *
 * 3. 核心语法要点
 *    - 生成器里的局部变量天然就是"私有状态"，外部无法篡改。
 *    - 递归 yield* 让树遍历的代码和递归函数一样直观。
 *    - 驱动器模式：驱动器负责"拿到 yield 的值 -> 处理 -> 用 next(结果) 送回去"，
 *      生成器负责用同步写法描述流程。
 *
 * 4. 常见陷阱
 *    - 把状态存在实例属性上（如 this.page），多个人同时遍历会互相干扰；
 *      正确做法是把状态放进生成器函数的局部变量。
 *    - 无限 ID 生成器被误用成"可重置"的对象；需要重置就再调用一次生成器函数。
 *    - 驱动器里忘记用 try/catch 调 it.throw()，导致 Promise 拒绝后生成器
 *      内部的 catch 永远不会执行。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 17_iterators_and_generators/10_generator_practical.js
 *
 * 【预期输出】
 *   四个实战场景的运行结果；延时全部在 40ms 以内。
 * ============================================================================
 */

const delay = (ms, value) => new Promise((resolve) => setTimeout(() => resolve(value), ms));

// 延时后"失败"的版本。
// 注意：这里必须在定时器回调里才 reject，不能写成
//   delay(10, Promise.reject(new Error('...')))
// ——那样创建的拒绝 Promise 在当前这一轮微任务里没人处理，
// Node 会把它判定为"未处理的 Promise 拒绝"并让进程崩溃。
const delayReject = (ms, message) =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));

// ---------------------------------------------------------------------------
// 1. 分页器
// ---------------------------------------------------------------------------

console.log('--- 1. 分页器：把游标状态藏进生成器 ---');

/**
 * paginate —— 把一个数组按 pageSize 切片，逐页产出。
 * 状态（page、index）都是函数局部变量，每个生成器实例各有一份，
 * 互不干扰；外部只负责"要不要下一页"。
 */
function* paginate(items, pageSize = 3) {
  const totalPages = Math.ceil(items.length / pageSize);
  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * pageSize;
    const slice = items.slice(start, start + pageSize);
    yield {
      page,
      totalPages,
      hasNext: page < totalPages,
      items: slice,
    };
  }
}

const allUsers = Array.from({ length: 8 }, (_, i) => `用户${i + 1}`);

// 逐页消费
for (const pageData of paginate(allUsers, 3)) {
  console.log(
    `第 ${pageData.page}/${pageData.totalPages} 页（hasNext=${pageData.hasNext}）：`,
    pageData.items.join('、'),
  );
}

// 只取第一页：生成器不会多算后面几页
const firstPageOnly = paginate(allUsers, 3).next().value;
console.log('只取第一页：', firstPageOnly.items);

// 展开成"页数组"（有限序列，可以安全展开）
console.log('共几页：', [...paginate(allUsers, 3)].length);

// 也可以用一个通用的 flatten 把分页结果摊平成条目流
function* flattenPages(pages) {
  for (const page of pages) {
    // 这里用 yield* 直接委托给页内数组
    yield* page.items;
  }
}
console.log('摊平后前 5 条：', [...flattenPages(paginate(allUsers, 3))].slice(0, 5));

// ---------------------------------------------------------------------------
// 2. ID 生成器
// ---------------------------------------------------------------------------

console.log('\n--- 2. ID 生成器：自增、带前缀、可多实例 ---');

function* idGenerator(prefix = 'id', start = 1) {
  let n = start;
  while (true) {
    yield `${prefix}_${String(n).padStart(4, '0')}`; // 补零到 4 位，便于排序
    n++;
  }
}

const userIds = idGenerator('user');
console.log('连续取 3 个 ID：', userIds.next().value, userIds.next().value, userIds.next().value);

const orderIds = idGenerator('order', 100);
console.log('另一个生成器互不干扰：', orderIds.next().value, orderIds.next().value);

// 想要"重置"，不是去改生成器，而是重新调用一次函数拿新的生成器
const freshUserIds = idGenerator('user');
console.log('重新调用即可从 1 开始：', freshUserIds.next().value);

// 实用变体：只产出指定数量的 ID，用完自动结束
function* limitedIds(prefix, count) {
  const gen = idGenerator(prefix);
  for (let i = 0; i < count; i++) {
    yield gen.next().value;
  }
}
console.log('限量 3 个 ID：', [...limitedIds('tmp', 3)]);

// 配合解构：把生成器当"多值返回"用
function* minMaxIndex(arr) {
  yield Math.min(...arr);
  yield Math.max(...arr);
}
const [minVal, maxVal, extra] = minMaxIndex([5, 2, 9, 1]);
console.log('解构拿到 min/max：', { minVal, maxVal, extra });

// ---------------------------------------------------------------------------
// 3. 树遍历
// ---------------------------------------------------------------------------

console.log('\n--- 3. 树遍历：深度优先与广度优先 ---');

const categoryTree = {
  name: '全部商品',
  children: [
    { name: '图书', children: [{ name: '小说', children: [] }, { name: '技术书', children: [] }] },
    { name: '数码', children: [{ name: '手机', children: [{ name: '配件', children: [] }] }] },
    { name: '服饰', children: [] },
  ],
};

/** 深度优先（DFS）：先自己、再递归子节点，用 yield* 接力 */
function* dfs(node, depth = 0, path = []) {
  const currentPath = [...path, node.name];
  yield { name: node.name, depth, path: currentPath };
  for (const child of node.children) {
    yield* dfs(child, depth + 1, currentPath);
  }
}

/** 广度优先（BFS）：用显式队列，逐层推进 */
function* bfs(root) {
  // 队列里放 [节点, 深度, 路径]
  const queue = [[root, 0, [root.name]]];
  while (queue.length > 0) {
    const [node, depth, path] = queue.shift(); // 从队首取出
    yield { name: node.name, depth, path };
    for (const child of node.children) {
      queue.push([child, depth + 1, [...path, child.name]]); // 子节点排到队尾
    }
  }
}

console.log('深度优先（DFS）：');
for (const { name, depth, path } of dfs(categoryTree)) {
  console.log(`  ${'  '.repeat(depth)}${name}  [路径: ${path.join(' > ')}]`);
}

console.log('广度优先（BFS）：');
for (const { name, depth } of bfs(categoryTree)) {
  console.log(`  第 ${depth} 层：${name}`);
}

// 遍历结果是可迭代对象，可以配合数组方法做统计
const allNodes = [...dfs(categoryTree)];
console.log('节点总数：', allNodes.length);
console.log('叶子节点：', allNodes.filter((n) => n.depth === 3).map((n) => n.name));
console.log('名字超过 2 个字的：', allNodes.filter((n) => n.name.length > 2).map((n) => n.name));

// ---------------------------------------------------------------------------
// 4. 生成器驱动的异步流程（async/await 的前身）
// ---------------------------------------------------------------------------

console.log('\n--- 4. 生成器驱动异步：手写一个迷你 co ---');

/**
 * run —— 驱动器。它接收一个生成器函数，然后：
 *   1. 调用生成器函数拿到迭代器；
 *   2. 不断 next()，把生成器 yield 出来的 Promise await 掉；
 *   3. 把 await 的结果通过 next(结果) 送回生成器内部；
 *   4. 如果 Promise 被拒绝，就用 it.throw(err) 把错误注入生成器，
 *      这样生成器里就能用 try/catch 捕获（下一节 18_async 会看到
 *      async/await 就是把这个机制做进了语言）。
 */
function run(genFn) {
  return new Promise((resolve, reject) => {
    const it = genFn();

    function step(method, arg) {
      let result;
      try {
        result = it[method](arg); // method 是 'next' 或 'throw'
      } catch (err) {
        // 生成器内部没接住的错误，直接让整个 Promise 拒绝
        return reject(err);
      }

      if (result.done) {
        // 生成器跑完了，它的 return 值就是整个流程的结果
        return resolve(result.value);
      }

      // 把 yield 出来的值当成 Promise 处理（普通值会被 Promise.resolve 包装）
      Promise.resolve(result.value).then(
        (v) => step('next', v),
        (e) => step('throw', e),
      );
    }

    step('next'); // 启动
  });
}

// 用生成器写"看起来同步"的异步流程：每个 yield 后面跟一个 Promise。
// 注意这里没有 async/await，全靠上面的 run 驱动器。
function* orderFlow() {
  console.log('  [流程] 1. 创建订单');
  const order = yield delay(10, { id: 'ORD-1', amount: 99 });

  console.log('  [流程] 2. 扣减库存，订单号', order.id);
  const stockOk = yield delay(10, true);

  if (!stockOk) {
    throw new Error('库存不足'); // 驱动器会把错误变成 Promise 的拒绝
  }

  console.log('  [流程] 3. 发起支付');
  // 故意演示错误注入：生成器内部用 try/catch 接住驱动器送回来的错误
  try {
    yield delayReject(10, '支付网关超时');
  } catch (err) {
    console.log('  [流程] 3.1 捕获到支付错误：', err.message, '—— 改为重试');
  }

  console.log('  [流程] 4. 支付成功，流程结束');
  return `订单 ${order.id} 已完成`;
}

// run 返回 Promise，用 then 打印结果（避免顶层 await 与前面的同步日志顺序纠缠）
run(orderFlow)
  .then((result) => {
    console.log('  [驱动器] 最终结果：', result);
  })
  .catch((err) => {
    // 生成器内部没接住的错误会走到这里
    console.log('  [驱动器] 流程失败：', err.message);
  })
  .then(() => {
    console.log('\n示例结束。');
  });
