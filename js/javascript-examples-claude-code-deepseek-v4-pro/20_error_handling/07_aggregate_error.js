/**
 * ============================================================================
 * 知识点：AggregateError 与 SuppressedError —— 一次报告多个错误
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】进阶
 * 【前置知识】20_error_handling/05_custom_errors.js、20_error_handling/06_error_cause.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    普通的 Error 一次只能表达"一个错误"，但现实里经常同时有多个错误：
 *      - 表单校验：用户名、邮箱、密码全都填错了；
 *      - 批量导入：100 行数据里有 7 行不合法；
 *      - Promise.any：所有候选 Promise 都失败了。
 *    为此标准提供了两个"聚合型"错误：
 *      AggregateError  把**一组错误**聚合成一个错误（ES2021）
 *      SuppressedError 在"处理错误的清理过程中又出错"时，把被压制的错误
 *                      与原错误一起保存（ES2025，配合显式资源管理 using 使用）
 *
 * 2. 为什么需要
 *    (1) 如果一次只抛第一个错误，用户就得"改一个、再提交、再发现下一个"，
 *        体验很差。AggregateError 让所有问题一次性说清楚。
 *    (2) Promise.any 需要一个"全都失败了"的表示，AggregateError 正是它的拒绝原因。
 *    (3) SuppressedError 解决的问题是：try/finally 或 using 的清理阶段抛错时，
 *        会"盖掉"原本正在传播的错误（详见 01 的陷阱）。它把两个错误都保留下来。
 *
 * 3. 核心语法要点
 *    (1) AggregateError 的签名：new AggregateError(errors, message, options)
 *        - errors：一个**可迭代对象**（通常是数组）
 *        - message：聚合错误的描述
 *        - options：同 Error，可传 { cause }
 *    (2) 实例属性 err.errors 是数组；err.name 是 'AggregateError'；
 *        它同样是 Error 的子类，instanceof Error 为 true。
 *    (3) Promise.any(promises) 全部拒绝时，抛出的就是 AggregateError，
 *        每个子错误按传入顺序放在 err.errors 里。
 *    (4) SuppressedError 的属性：err.error 是原本正在传播的错误，
 *        err.suppressed 是清理过程中新产生的错误；message 可自定义。
 *
 * 4. 常见陷阱
 *    (1) 只打印 err.message 而忘了遍历 err.errors —— 等于什么都没看到。
 *    (2) 把普通错误塞进 err.errors 之外的层级（嵌套 AggregateError），
 *        导致结构不统一，处理代码要写很多分支。
 *    (3) 认为 AggregateError 会自动把子错误的 stack 合并 —— 不会，
 *        它只保存子错误对象本身，需要你自己遍历打印。
 *    (4) SuppressedError 通常由引擎在 using/finally 场景自动产生，
 *        手写 try/catch/finally 时并不会自动出现，需要自己判断处理。
 *    (5) 环境兼容性：AggregateError 需要 Node 15+；SuppressedError 需要
 *        较新的运行时（Node 24+ 才有），老环境要自己做存在性判断。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/07_aggregate_error.js
 *
 * 【预期输出】
 *   演示手工构造 AggregateError、表单校验聚合多个错误、
 *   Promise.any 全失败时的 AggregateError，以及 SuppressedError 的结构。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 手工构造 AggregateError
// ---------------------------------------------------------------------------

console.log('--- 1. 手工构造 AggregateError ---');

const agg = new AggregateError(
  [new TypeError('字段 a 类型不对'), new RangeError('字段 b 超出范围')],
  '表单校验未通过',
);

console.log('name        =', agg.name);
console.log('message     =', agg.message);
console.log('instanceof Error ?', agg instanceof Error);
console.log('errors 是数组吗？', Array.isArray(agg.errors), '，长度 =', agg.errors.length);
agg.errors.forEach((e, i) => console.log(`  子错误 ${i + 1}: ${e.name} - ${e.message}`));

// ---------------------------------------------------------------------------
// 2. 实战：一次性收集所有校验错误
// ---------------------------------------------------------------------------

console.log('\n--- 2. 表单校验：一次报告所有问题 ---');

/** 字段校验规则 */
const rules = [
  {
    field: 'username',
    check: (v) => typeof v === 'string' && v.trim().length >= 3,
    message: '用户名至少 3 个字符',
  },
  {
    field: 'email',
    check: (v) => typeof v === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
    message: '邮箱格式不正确',
  },
  {
    field: 'age',
    check: (v) => Number.isInteger(v) && v >= 0 && v <= 150,
    message: '年龄必须是 0~150 的整数',
  },
  {
    field: 'password',
    check: (v) => typeof v === 'string' && v.length >= 8,
    message: '密码至少 8 位',
  },
];

/**
 * 校验一个表单对象，把所有错误聚合成一个 AggregateError
 * @param {Record<string, unknown>} form
 * @returns {Record<string, unknown>} 校验通过时返回原对象
 */
function validateForm(form) {
  const errors = [];
  for (const rule of rules) {
    if (!rule.check(form[rule.field])) {
      const err = new Error(rule.message);
      err.field = rule.field; // 带上出错的字段名
      errors.push(err);
    }
  }
  if (errors.length > 0) {
    throw new AggregateError(errors, `表单有 ${errors.length} 处错误`);
  }
  return form;
}

const badForms = [
  { username: 'ab', email: 'not-an-email', age: -1, password: '123' },
  { username: '张三丰', email: 'zhang@example.com', age: 30, password: 's3cret-pass' },
  { username: 'okname', email: 'a@b.c', age: 200, password: '12345678' },
];

for (const form of badForms) {
  try {
    validateForm(form);
    console.log(`  ✓ 校验通过：${form.username}`);
  } catch (err) {
    if (err instanceof AggregateError) {
      console.log(`  ✗ ${err.message}：`);
      for (const sub of err.errors) {
        console.log(`      - [${sub.field}] ${sub.message}`);
      }
    } else {
      // 非聚合错误继续抛出，不吞掉
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// 3. 循环批量处理：收集错误而不是中断
// ---------------------------------------------------------------------------

console.log('\n--- 3. 批量处理：收集错误继续跑 ---');

/**
 * 处理一批订单，遇到坏数据就记录下来，最后统一汇报
 * @param {Array<{id: number, amount: number}>} orders
 * @returns {{ processed: number, failed: number }}
 */
function processOrders(orders) {
  const errors = [];
  let processed = 0;

  for (const order of orders) {
    try {
      if (typeof order.amount !== 'number') {
        throw new TypeError(`订单金额不是数字：${order.amount}`);
      }
      if (order.amount <= 0) {
        throw new RangeError(`订单金额必须为正数：${order.amount}`);
      }
      processed += 1;
    } catch (err) {
      err.orderId = order.id;
      errors.push(err); // 收集而不是立刻抛出
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, `${errors.length} 个订单处理失败`);
  }
  return { processed, failed: errors.length };
}

const orders = [
  { id: 1, amount: 100 },
  { id: 2, amount: 'abc' },
  { id: 3, amount: -5 },
  { id: 4, amount: 250 },
];

try {
  console.log('  ', processOrders(orders));
} catch (err) {
  console.log(`  ${err.message}`);
  for (const sub of err.errors) {
    console.log(`      - 订单 ${sub.orderId}：${sub.name} - ${sub.message}`);
  }
}

// ---------------------------------------------------------------------------
// 4. Promise.any：全部失败时抛出 AggregateError
// ---------------------------------------------------------------------------

console.log('\n--- 4. Promise.any 的失败原因就是 AggregateError ---');

/**
 * 模拟一个可能失败的任务
 * @param {string} name 任务名
 * @param {boolean} ok 是否成功
 * @param {number} delay 延迟毫秒
 * @returns {Promise<string>}
 */
function task(name, ok, delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (ok) resolve(`${name} 成功`);
      else reject(new Error(`${name} 失败`));
    }, delay);
  });
}

// 全部失败
try {
  await Promise.any([task('镜像A', false, 5), task('镜像B', false, 1), task('镜像C', false, 3)]);
} catch (err) {
  console.log('捕获到：', err.name);
  console.log('message:', err.message);
  console.log('子错误数量：', err.errors.length);
  err.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e.message}`));
}

// 有成功时则返回第一个成功的（不会抛错）
const first = await Promise.any([task('镜像A', false, 5), task('镜像B', true, 2)]);
console.log('有成功者时直接返回：', first, '（不会产生 AggregateError）');

// 对比 Promise.all 的 fail-fast 行为
try {
  await Promise.all([task('任务1', false, 1), task('任务2', true, 5)]);
} catch (err) {
  console.log('\n对比 Promise.all：第一个失败就整体拒绝，', err.name, '-', err.message);
  console.log('（Promise.all 只报告第一个错误；需要"全部结果"时用 Promise.allSettled）');
}

// Promise.allSettled 一次拿到全部结果，本身不抛错
const settled = await Promise.allSettled([task('A', false, 1), task('B', true, 2)]);
console.log('Promise.allSettled 的结果：');
for (const r of settled) {
  if (r.status === 'fulfilled') console.log('  ✓', r.value);
  else console.log('  ✗', r.reason.message);
}

// ---------------------------------------------------------------------------
// 5. SuppressedError：清理过程中的错误不会覆盖原错误
// ---------------------------------------------------------------------------

console.log('\n--- 5. SuppressedError 的结构 ---');

// 检查运行时是否支持（Node 24+ 提供）
if (typeof SuppressedError === 'function') {
  // 构造签名：new SuppressedError(error, suppressed, message)
  //   error      —— 原本正在传播的错误
  //   suppressed —— 清理/释放过程中新产生的、被"压制"的错误
  const original = new Error('原始错误：业务逻辑失败');
  const duringCleanup = new Error('清理错误：关闭连接时失败');
  const se = new SuppressedError(original, duringCleanup, '关闭资源时又出错了');

  console.log('name             =', se.name);
  console.log('message          =', se.message);
  console.log('se.error         =', se.error.message, '（原本的错误）');
  console.log('se.suppressed    =', se.suppressed.message, '（被压制的错误）');
  console.log('instanceof Error ?', se instanceof Error);

  console.log('\n它解决的正是 01 里演示过的陷阱：');
  console.log('  try/finally 中，finally 抛错会盖掉 try 里的原错误；');
  console.log('  SuppressedError 把两个错误都保留下来，两个都不丢。');
  console.log('  在支持"显式资源管理"（using 声明）的运行时里，');
  console.log('  释放资源时抛错就会自动产生 SuppressedError。');
} else {
  console.log('当前运行时没有 SuppressedError（需要 Node 24+）。');
  console.log('老环境可以自己定义一个：class SuppressedError extends Error { ... }');
}

console.log('\n--- 6. 小结 ---');
console.log('AggregateError ：一次携带多个错误，err.errors 是数组，务必遍历打印；');
console.log('                 Promise.any 全部失败时的拒绝原因就是它。');
console.log('SuppressedError：清理阶段的错误与原错误同时保留（error / suppressed）；');
console.log('Promise.all 是 fail-fast，Promise.allSettled 才是"全都要"。');
