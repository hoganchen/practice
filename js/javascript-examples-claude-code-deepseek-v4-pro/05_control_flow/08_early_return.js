/**
 * ============================================================================
 * 知识点：卫语句（guard clause）与提前返回 —— 减少嵌套层级的实践
 * ============================================================================
 *
 * 【所属分类】05_control_flow —— 流程控制
 * 【难度等级】进阶
 * 【前置知识】05_control_flow/01_if_else.js、05_control_flow/07_break_continue.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    【提前返回（early return）】在函数开头就用 return 把"不应该继续执行"的情况
 *    一个个挡回去，让主逻辑留在最外层、保持零缩进。
 *    【卫语句（guard clause）】就是这些"守卫"性质的 if 语句，
 *    它们只做一件事：判断到不满足的前置条件就立刻退出。
 *
 *      传统写法（嵌套式）              卫语句写法（扁平式）
 *      function f(x) {                 function f(x) {
 *        if (x) {                        if (!x) return null;
 *          if (x.a) {                    if (!x.a) return null;
 *            if (x.a.b) {                if (!x.a.b) return null;
 *              return doWork();          return doWork();
 *            }                           }
 *          }
 *        }
 *      }
 *
 * 2. 为什么需要
 *    人的工作记忆有限。缩进每深一层，读者就要多记住一个"当前处于什么条件下"。
 *    卫语句把"异常路径"提前处理掉，让主逻辑（happy path）平铺在最外层，
 *    代码从上往下读就像读一段自然语言，可维护性显著提升。
 *    这也是业界主流规范（如 ESLint 的 max-depth、no-else-return 规则）所鼓励的风格。
 *
 * 3. 核心语法要点
 *    【return 的两种形态】
 *      return;        返回 undefined，用于"提前结束、无返回值"的场景
 *      return 值;     返回结果，同时结束函数
 *    【什么算"卫语句"】
 *      - 参数校验：类型不对、缺失、越界 => 直接返回错误
 *      - 权限检查：没登录 / 没权限 => 直接拒绝
 *      - 快速路径：空数据、已缓存、无需处理 => 直接返回
 *    【与 else 的关系】
 *      卫语句让"主逻辑"不再需要 else。能用卫语句表达的，就不要写 else。
 *    【不写 else 的其他技巧】
 *      - 用默认值提前定好变量，减少分支
 *      - 用查表（对象/Map）代替多分支
 *      - 用三元运算符表达"二选一的值"
 *      - 用 continue / break 在循环里提前跳过（循环版的卫语句）
 *    【返回值的一致性】
 *      提前返回时要注意返回值的"形状"统一，例如都返回 { ok, data, error }，
 *      否则调用方要在多个地方做类型判断。这也叫"不返回两种形状"。
 *
 * 4. 常见陷阱
 *    - 卫语句里忘了 return，导致后面的逻辑继续执行（尤其在有副作用的函数里）。
 *    - 返回值类型不一致：有时返回 null 有时返回对象，调用方难以处理。
 *    - 把"必须执行的清理逻辑"（如关闭文件、释放锁）放在 return 之后，
 *      导致它被跳过 —— 这时应该用 try/finally，而不是依赖代码顺序。
 *    - 卫语句过多也是一种味道：如果开头连着 10 个 if，说明应该先把参数整理成
 *      一个校验函数，或改用 schema 校验（如 zod）。
 *    - 在箭头函数里写多行提前返回时别用简写形式（`x => ...`），要用带大括号的完整形式。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 05_control_flow/08_early_return.js
 *
 * 【预期输出】
 *   依次打印嵌套式写法与卫语句写法的对照、缩进深度的量化对比、
 *   参数校验 / 权限检查 / 快速路径三类卫语句示例、
 *   try/finally 保护清理逻辑的写法，以及一个完整的实战重构案例。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 嵌套式写法 vs 卫语句写法
// ---------------------------------------------------------------------------

console.log('--- 1. 两种写法对照 ---');

// 一个需要同时校验多个条件的业务函数

// ---- 写法 A：嵌套式（反面教材）----
function processOrderNested(order) {
  if (order) {
    if (order.items && order.items.length > 0) {
      if (order.user) {
        if (order.user.verified) {
          if (order.total > 0) {
            // 真正的业务逻辑被埋在 5 层缩进里
            return { ok: true, message: `订单已受理，共 ${order.items.length} 件商品` };
          } else {
            return { ok: false, message: '订单金额必须大于 0' };
          }
        } else {
          return { ok: false, message: '用户未实名认证' };
        }
      } else {
        return { ok: false, message: '缺少用户信息' };
      }
    } else {
      return { ok: false, message: '订单中没有商品' };
    }
  } else {
    return { ok: false, message: '订单不存在' };
  }
}

// ---- 写法 B：卫语句（推荐）----
function processOrderGuarded(order) {
  // ① 订单本身
  if (!order) {
    return { ok: false, message: '订单不存在' };
  }
  // ② 商品
  if (!order.items || order.items.length === 0) {
    return { ok: false, message: '订单中没有商品' };
  }
  // ③ 用户
  if (!order.user) {
    return { ok: false, message: '缺少用户信息' };
  }
  // ④ 用户认证状态
  if (!order.user.verified) {
    return { ok: false, message: '用户未实名认证' };
  }
  // ⑤ 金额
  if (!(order.total > 0)) {
    return { ok: false, message: '订单金额必须大于 0' };
  }

  // 主逻辑保持在最外层，一眼可见
  return { ok: true, message: `订单已受理，共 ${order.items.length} 件商品` };
}

// 两种写法结果完全一致
const orderCases = [
  null,
  { items: [], user: { verified: true }, total: 10 },
  { items: [1], user: null, total: 10 },
  { items: [1], user: { verified: false }, total: 10 },
  { items: [1], user: { verified: true }, total: 0 },
  { items: [1, 2], user: { verified: true }, total: 99 },
];

console.log('  两种写法的结果对比：');
let allSame = true;
for (const c of orderCases) {
  const a = processOrderNested(c);
  const b = processOrderGuarded(c);
  const same = a.ok === b.ok && a.message === b.message;
  if (!same) allSame = false;
  console.log(`    ${same ? '✔' : '✘'} ${JSON.stringify(c)}`);
  console.log(`        嵌套式: ${a.message}`);
  console.log(`        卫语句: ${b.message}`);
}
console.log('  所有用例结果一致：', allSame);

// ---------------------------------------------------------------------------
// 2. 量化：缩进深度对比
// ---------------------------------------------------------------------------

console.log('\n--- 2. 缩进深度量化 ---');

// 用一个简单的方式统计源码里 "  " 缩进的最大层数（只作示意，不做严格解析）
function maxIndentOf(fn) {
  const lines = fn.toString().split('\n');
  let max = 0;
  for (const line of lines) {
    const spaces = line.length - line.trimStart().length;
    max = Math.max(max, Math.floor(spaces / 2));
  }
  return max;
}
console.log('  processOrderNested 的最大缩进层数 =', maxIndentOf(processOrderNested));
console.log('  processOrderGuarded 的最大缩进层数 =', maxIndentOf(processOrderGuarded));
console.log('  => 逻辑完全相同，但卫语句版本浅得多，更容易阅读与修改');

// 用参数对象把"条件数量"和"缩进深度"解耦
function processOrderWithSchema(order) {
  // 把所有校验规则写成数据，而不是层层 if
  const rules = [
    { ok: Boolean(order), message: '订单不存在' },
    { ok: Boolean(order?.items?.length), message: '订单中没有商品' },
    { ok: Boolean(order?.user), message: '缺少用户信息' },
    { ok: Boolean(order?.user?.verified), message: '用户未实名认证' },
    { ok: (order?.total ?? 0) > 0, message: '订单金额必须大于 0' },
  ];
  // 找到第一条不通过的规则
  const failed = rules.find((rule) => !rule.ok);
  if (failed) {
    return { ok: false, message: failed.message };
  }
  return { ok: true, message: `订单已受理，共 ${order.items.length} 件商品` };
}
console.log('  数据驱动的校验结果：', processOrderWithSchema(orderCases[5]));
console.log('  数据驱动的校验结果：', processOrderWithSchema(orderCases[3]));

// ---------------------------------------------------------------------------
// 3. 三类典型卫语句
// ---------------------------------------------------------------------------

console.log('\n--- 3. 三类典型卫语句 ---');

// ---- 类型一：参数校验 ----
function divide(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    return { ok: false, error: '参数必须是数字' };
  }
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return { ok: false, error: '参数不能是 NaN' };
  }
  if (b === 0) {
    return { ok: false, error: '除数不能为 0' }; // 提前挡住，避免返回 Infinity
  }
  return { ok: true, value: a / b };
}
for (const [a, b] of [[10, 2], [10, 0], ['10', 2], [NaN, 2]]) {
  console.log(`  divide(${String(a)}, ${String(b)}) =`, JSON.stringify(divide(a, b)));
}

// ---- 类型二：权限 / 状态检查 ----
function deleteComment(comment, currentUser) {
  if (!currentUser) {
    return { ok: false, error: '请先登录' };
  }
  if (!comment) {
    return { ok: false, error: '评论不存在' };
  }
  if (comment.deleted) {
    return { ok: false, error: '评论已被删除' }; // 幂等：已经删过就直接返回
  }
  const isAuthor = comment.authorId === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  if (!isAuthor && !isAdmin) {
    return { ok: false, error: '无权删除他人评论' };
  }
  // 主逻辑：真正执行删除
  comment.deleted = true;
  return { ok: true, message: `评论 ${comment.id} 已删除` };
}

const comments = [
  { id: 1, authorId: 100, deleted: false },
  { id: 2, authorId: 200, deleted: false },
  { id: 3, authorId: 100, deleted: true },
];
console.log('  未登录：', JSON.stringify(deleteComment(comments[0], null)));
console.log('  作者本人：', JSON.stringify(deleteComment(comments[0], { id: 100, role: 'user' })));
console.log('  无关用户：', JSON.stringify(deleteComment(comments[1], { id: 100, role: 'user' })));
console.log('  管理员：', JSON.stringify(deleteComment(comments[1], { id: 999, role: 'admin' })));
console.log('  已删除的：', JSON.stringify(deleteComment(comments[2], { id: 100, role: 'user' })));

// ---- 类型三：快速路径（提前返回"无需处理"的情况）----
function formatUserName(user) {
  // 空值快速路径：直接给出默认值，不必进入主逻辑
  if (!user) return '匿名';
  if (!user.name) return '未命名用户';
  // 已经符合要求：直接返回，省掉后续处理
  if (user.name.length <= 10) return user.name;
  // 只有超长名字才需要截断处理
  return `${user.name.slice(0, 10)}…`;
}
for (const u of [null, {}, { name: '小明' }, { name: '这是一个特别特别长的用户名需要截断' }]) {
  console.log(`  formatUserName(${JSON.stringify(u)}) = ${formatUserName(u)}`);
}

// 快速路径在性能上也有意义：让最常见的情况走最短的代码路径

// ---------------------------------------------------------------------------
// 4. 循环里的"卫语句"：continue 与 break
// ---------------------------------------------------------------------------

console.log('\n--- 4. 循环里的卫语句 ---');

const products = [
  { name: '键盘', price: 300, stock: 5, onSale: true },
  { name: '鼠标', price: 0, stock: 10, onSale: true },
  { name: '显示器', price: 1200, stock: 0, onSale: true },
  { name: '音箱', price: 500, stock: 3, onSale: false },
  { name: '摄像头', price: 200, stock: 8, onSale: true },
];

// 嵌套式：把判断全写在一个大 if 里
function listNested(items) {
  const result = [];
  for (const item of items) {
    if (item.price > 0) {
      if (item.stock > 0) {
        if (item.onSale) {
          result.push(item.name);
        }
      }
    }
  }
  return result;
}

// 卫语句式：不满足就 continue，主逻辑在最外层
function listGuarded(items) {
  const result = [];
  for (const item of items) {
    if (item.price <= 0) continue; // 无价格，跳过
    if (item.stock <= 0) continue; // 无库存，跳过
    if (!item.onSale) continue; // 未上架，跳过
    result.push(item.name); // 主逻辑：符合条件就收集
  }
  return result;
}
console.log('  嵌套式结果：', listNested(products));
console.log('  卫语句结果：', listGuarded(products));
console.log('  两者一致：', JSON.stringify(listNested(products)) === JSON.stringify(listGuarded(products)));

// 用 filter 把"卫语句"进一步声明化
const filtered = products
  .filter((item) => item.price > 0)
  .filter((item) => item.stock > 0)
  .filter((item) => item.onSale)
  .map((item) => item.name);
console.log('  用 filter 链式表达：', filtered);

// ---------------------------------------------------------------------------
// 5. 陷阱：提前返回会跳过清理逻辑
// ---------------------------------------------------------------------------

console.log('\n--- 5. 陷阱：提前返回跳过清理 ---');

// 错误示范：清理逻辑写在 return 之后，被提前返回跳过
function badResourceHandling(shouldFail) {
  const log = [];
  log.push('打开资源');
  if (shouldFail) {
    log.push('提前返回（清理被跳过了！）');
    return { log, released: false };
  }
  log.push('正常处理');
  log.push('释放资源');
  return { log, released: true };
}
console.log('  错误示范，shouldFail = true：');
console.log('    ', badResourceHandling(true));
console.log('    => released 是 false，资源泄漏了');

// 正确写法：用 try / finally 保证清理一定执行
function goodResourceHandling(shouldFail) {
  const log = [];
  let released = false;
  log.push('打开资源');
  try {
    if (shouldFail) {
      log.push('提前返回（finally 仍会执行）');
      return { log, released: true }; // 返回值在 finally 之后生效
    }
    log.push('正常处理');
    return { log, released: true };
  } finally {
    // 无论怎么返回（甚至抛异常），这块一定会执行
    released = true;
    log.push('finally 中释放资源');
  }
}
console.log('  正确示范，shouldFail = true：');
const good = goodResourceHandling(true);
console.log('    log =', good.log);
console.log('    => finally 保证了释放动作一定发生');

// 另一个常见场景：必须执行的"收尾统计"
function processBatch(items) {
  let processed = 0;
  let skipped = 0;
  try {
    for (const item of items) {
      if (!item) {
        skipped++;
        continue; // 循环里的卫语句
      }
      processed++;
    }
    return { processed, skipped, done: true };
  } finally {
    // 这里可以写日志、上报指标等收尾逻辑，提前 return 也不会漏掉
    console.log(`    [收尾] 处理 ${processed} 条，跳过 ${skipped} 条`);
  }
}
console.log('  processBatch([1, null, 2, 3, null]) =', processBatch([1, null, 2, 3, null]));

// ---------------------------------------------------------------------------
// 6. 陷阱：返回值形状不一致
// ---------------------------------------------------------------------------

console.log('\n--- 6. 陷阱：返回值形状不一致 ---');

// 反面教材：有时返回 null，有时返回字符串，有时抛错 => 调用方要写三种判断
function findUserBad(users, id) {
  if (!id) return null; // 形状 1：null
  const hit = users.find((u) => u.id === id);
  if (!hit) return 'not found'; // 形状 2：字符串
  return hit.name; // 形状 3：字符串（但与上面含义不同）
}

// 正面示例：统一返回 { ok, data, error } 形状，调用方只需检查 ok
function findUserGood(users, id) {
  if (!id) {
    return { ok: false, data: null, error: 'id 不能为空' };
  }
  const hit = users.find((u) => u.id === id);
  if (!hit) {
    return { ok: false, data: null, error: '用户不存在' };
  }
  return { ok: true, data: hit, error: null };
}

const users = [
  { id: 1, name: '小明' },
  { id: 2, name: '小红' },
];
console.log('  形状不一致的返回值：');
for (const id of [null, 1, 99]) {
  const r = findUserBad(users, id);
  console.log(`    findUserBad(_, ${String(id)}) => ${JSON.stringify(r)} (typeof = ${typeof r})`);
}

console.log('  形状统一的返回值：');
for (const id of [null, 1, 99]) {
  const r = findUserGood(users, id);
  // 调用方只需判断 ok，错误信息直接可用
  console.log(`    findUserGood(_, ${String(id)}) => ${r.ok ? `成功：${r.data.name}` : `失败：${r.error}`}`);
}

// ---------------------------------------------------------------------------
// 7. 实战：一次完整的重构
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战重构 ---');

// 重构前：多层嵌套 + 多个 else + 副作用散落
function checkinBefore(booking, guest, now) {
  if (booking) {
    if (!booking.cancelled) {
      if (booking.guestId === guest.id) {
        if (now >= booking.checkinFrom && now <= booking.checkinTo) {
          booking.status = 'checked-in';
          return { ok: true, message: '入住成功' };
        } else {
          return { ok: false, message: '不在入住时间段内' };
        }
      } else {
        return { ok: false, message: '预订人与入住人不一致' };
      }
    } else {
      return { ok: false, message: '预订已被取消' };
    }
  } else {
    return { ok: false, message: '找不到预订记录' };
  }
}

// 重构后：卫语句 + 主逻辑平铺 + 返回形状统一
function checkinAfter(booking, guest, now) {
  if (!booking) {
    return { ok: false, message: '找不到预订记录' };
  }
  if (booking.cancelled) {
    return { ok: false, message: '预订已被取消' };
  }
  if (booking.guestId !== guest.id) {
    return { ok: false, message: '预订人与入住人不一致' };
  }
  if (now < booking.checkinFrom || now > booking.checkinTo) {
    return { ok: false, message: '不在入住时间段内' };
  }

  // 到这里所有前置条件都满足了，主逻辑只有一句话
  booking.status = 'checked-in';
  return { ok: true, message: '入住成功' };
}

const bookingCases = [
  [null, { id: 1 }, 50],
  [{ cancelled: true, guestId: 1, status: 'x' }, { id: 1 }, 50],
  [{ cancelled: false, guestId: 2, status: 'x' }, { id: 1 }, 50],
  [{ cancelled: false, guestId: 1, status: 'x', checkinFrom: 0, checkinTo: 40 }, { id: 1 }, 50],
  [{ cancelled: false, guestId: 1, status: 'x', checkinFrom: 0, checkinTo: 100 }, { id: 1 }, 50],
];

for (const [b, g, n] of bookingCases) {
  // 两个函数都会修改 booking.status，所以各自传一份独立副本，避免互相影响
  const forBefore = b === null ? null : { ...b };
  const forAfter = b === null ? null : { ...b };
  const r1 = checkinBefore(forBefore, g, n);
  const r2 = checkinAfter(forAfter, g, n);
  const same = r1.ok === r2.ok && r1.message === r2.message;
  console.log(`  ${same ? '✔' : '✘'} ${r1.message}  |  ${r2.message}`);
}

console.log('\n全部演示结束。');
