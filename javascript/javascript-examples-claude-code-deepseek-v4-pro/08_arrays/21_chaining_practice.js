/**
 * ============================================================================
 * 知识点：链式调用实战 —— 用 map / filter / reduce / sort 完成一组订单统计
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】高级
 * 【前置知识】08_arrays/20_grouping.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本文件是 08_arrays 章节的综合实战：把前面 20 个文件里学到的数组方法
 *    串成一条"数据处理流水线"，对一个真实的订单数据集完成典型的数据分析任务。
 *
 *    链式调用的本质：**每个非破坏性方法都返回数组（或值），所以可以一个接一个地点下去**。
 *        orders
 *          .filter(o => o.status === 'paid')     // 返回数组
 *          .map(o => o.amount)                   // 返回数组
 *          .reduce((s, n) => s + n, 0);          // 返回数值（链条终点）
 *
 * 2. 为什么需要它
 *    真实业务几乎不会只做一次 map 或一次 filter。一份数据要经过
 *    "清洗 -> 筛选 -> 派生字段 -> 分组 -> 排序 -> 取前 N -> 汇总"多道工序。
 *    链式调用让这些工序以"接近自然语言"的顺序排列，读起来就是业务逻辑本身，
 *    而且每一步都是纯函数，没有中间的临时变量，天然便于测试和局部替换。
 *
 * 3. 核心语法要点
 *    (1) 哪些方法能出现在链条中间（返回数组）：
 *          map / filter / slice / concat / flat / flatMap / toSorted / toReversed /
 *          splice 的返回值（被删元素）也算数组，但语义上不该这么用
 *          Array.from / Object.keys / Object.values / Object.entries
 *          [...arr] 展开运算符
 *    (2) 哪些方法是链条的终点（返回非数组）：
 *          reduce / forEach / some / every / find / findIndex / indexOf / includes /
 *          join / at / length
 *    (3) 哪些方法是"破坏性"的，不该混进链条：
 *          push / pop / shift / unshift / splice / sort / reverse / fill / copyWithin
 *          它们会改原数组，混在链里会让"原数据被改坏"（想用排序请用 toSorted）。
 *    (4) 优化经验：
 *          先 filter 后 map（少处理元素）；
 *          能一次遍历完成的别拆成两次（但优先保证可读性，除非真的是性能瓶颈）；
 *          链条超过 4~5 步就考虑抽成命名函数，或者拆成几个中间变量并起名。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】链式调用里混入 sort / reverse / splice 会**修改原数组**，
 *      这是最隐蔽的污染源。原则：**链条里只用非破坏性方法**。
 *    - 链条中间不要忘了返回：`map(x => { x * 2 })` 会得到一堆 undefined，
 *      后续的 filter/reduce 就会出错或得到 NaN。
 *    - 排序放在链条末尾：`toSorted` 每次调用都要 O(n log n)，放在前面会白排很多次。
 *    - 每一步都生成新数组，超长链条 + 大数据量时内存压力大；
 *      必要时合并为一次 reduce（可读性与性能的权衡）。
 *    - `filter(...).length` 与 `length` 的类型不同（前者是数字，别混淆成数组）。
 *    - 空数组参与链条时，注意 every 的"空真"与 reduce 不传初始值的报错（见 10、14 号文件）。
 *    - 链条里的可选链只在"对象可能为空"时用，数组方法本身在数组上不会返回 null。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/21_chaining_practice.js
 *
 * 【预期输出】
 *   围绕同一份订单数据（含商品明细、状态、地区、时间）依次完成：
 *   基础统计、按状态/地区/月份分组汇总、Top N 排行、客单价与复购率、
 *   以及"一条链条完成多个指标"的综合示例。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 准备数据集（模拟真实订单：一个订单含多个商品明细）
// ---------------------------------------------------------------------------

console.log('--- 0. 数据集 ---');

const orders = [
  {
    id: 'ORD-1001',
    userId: 'U01',
    status: 'paid',
    region: '华东',
    createdAt: '2024-03-02',
    items: [
      { sku: 'BOOK-1', name: 'JavaScript 高级程序设计', category: '图书', price: 99, qty: 1 },
      { sku: 'BOOK-2', name: '深入理解计算机系统', category: '图书', price: 139, qty: 1 },
    ],
  },
  {
    id: 'ORD-1002',
    userId: 'U02',
    status: 'paid',
    region: '华北',
    createdAt: '2024-03-05',
    items: [{ sku: 'TECH-1', name: '机械键盘', category: '数码', price: 499, qty: 1 }],
  },
  {
    id: 'ORD-1003',
    userId: 'U01',
    status: 'unpaid',
    region: '华东',
    createdAt: '2024-03-09',
    items: [
      { sku: 'TECH-2', name: '人体工学椅', category: '家居', price: 1299, qty: 1 },
      { sku: 'BOOK-1', name: 'JavaScript 高级程序设计', category: '图书', price: 99, qty: 2 },
    ],
  },
  {
    id: 'ORD-1004',
    userId: 'U03',
    status: 'paid',
    region: '华南',
    createdAt: '2024-03-15',
    items: [
      { sku: 'BOOK-3', name: '算法导论', category: '图书', price: 128, qty: 1 },
      { sku: 'HOME-1', name: '台灯', category: '家居', price: 199, qty: 2 },
    ],
  },
  {
    id: 'ORD-1005',
    userId: 'U02',
    status: 'refunded',
    region: '华北',
    createdAt: '2024-03-18',
    items: [{ sku: 'TECH-3', name: '显示器', category: '数码', price: 1599, qty: 1 }],
  },
  {
    id: 'ORD-1006',
    userId: 'U04',
    status: 'paid',
    region: '华东',
    createdAt: '2024-04-01',
    items: [
      { sku: 'BOOK-2', name: '深入理解计算机系统', category: '图书', price: 139, qty: 1 },
      { sku: 'TECH-1', name: '机械键盘', category: '数码', price: 499, qty: 2 },
    ],
  },
  {
    id: 'ORD-1007',
    userId: 'U03',
    status: 'paid',
    region: '华南',
    createdAt: '2024-04-07',
    items: [{ sku: 'HOME-1', name: '台灯', category: '家居', price: 199, qty: 1 }],
  },
  {
    id: 'ORD-1008',
    userId: 'U05',
    status: 'unpaid',
    region: '西南',
    createdAt: '2024-04-11',
    items: [{ sku: 'TECH-2', name: '人体工学椅', category: '家居', price: 1299, qty: 1 }],
  },
];

const paidStatuses = ['paid'];

/** 计算订单总额：明细求和小工具（后面会被反复复用） */
function orderTotal(order) {
  return order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/** 计算订单商品总件数 */
function orderQty(order) {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}

console.log('订单总数 =', orders.length);
console.log('示例订单 =', JSON.stringify(orders[0]));
console.log('ORD-1001 的总额 =', orderTotal(orders[0]), '，件数 =', orderQty(orders[0]));
console.log('（注意：orders 在后面的所有操作中都不应该被修改）');

// ---------------------------------------------------------------------------
// 1. 派生字段：给每个订单加上金额与件数（map）
// ---------------------------------------------------------------------------

console.log('\n--- 1. 派生字段（map）---');

// map 不修改原数组，返回一个"增强版"的新数组
const enriched = orders.map((order) => ({
  ...order, // 浅拷贝原订单（保留 items 引用，因为不打算改它）
  total: orderTotal(order),
  qty: orderQty(order),
  month: order.createdAt.slice(0, 7), // '2024-03'
  itemNames: order.items.map((i) => i.name),
}));

console.log('前 3 条增强后的订单：');
enriched.slice(0, 3).forEach((o) => {
  console.log(`  ${o.id} | ${o.status} | ${o.region} | ${o.month} | 金额 ${o.total} | ${o.qty} 件`);
});
console.log('\n原 orders[0] 有 total 字段吗？', 'total' in orders[0], '（没有，原数组是干净的）');

// ---------------------------------------------------------------------------
// 2. 基础统计：filter + reduce
// ---------------------------------------------------------------------------

console.log('\n--- 2. 基础统计 ---');

const paidOrders = enriched.filter((o) => paidStatuses.includes(o.status));
const unpaidOrders = enriched.filter((o) => o.status === 'unpaid');
const refundedOrders = enriched.filter((o) => o.status === 'refunded');

console.log('已支付订单数 =', paidOrders.length, '：', paidOrders.map((o) => o.id).join(','));
console.log('未支付订单数 =', unpaidOrders.length, '：', unpaidOrders.map((o) => o.id).join(','));
console.log('已退款订单数 =', refundedOrders.length, '：', refundedOrders.map((o) => o.id).join(','));

const paidAmount = paidOrders.reduce((sum, o) => sum + o.total, 0);
console.log('\n已支付总额 =', paidAmount);
console.log('已支付总件数 =', paidOrders.reduce((sum, o) => sum + o.qty, 0));
console.log('客单价（已支付） =', (paidAmount / paidOrders.length).toFixed(2));

// 全量统计（含未支付）用 reduce 一次遍历拿到多个指标
const overview = enriched.reduce(
  (acc, o) => {
    acc.count++;
    acc.amount += o.total;
    acc.qty += o.qty;
    if (o.status === 'paid') {
      acc.paidCount++;
      acc.paidAmount += o.total;
    } else if (o.status === 'unpaid') {
      acc.unpaidAmount += o.total;
    } else {
      acc.refundedAmount += o.total;
    }
    acc.maxOrder = o.total > acc.maxOrder.total ? o : acc.maxOrder;
    return acc;
  },
  {
    count: 0, amount: 0, qty: 0,
    paidCount: 0, paidAmount: 0, unpaidAmount: 0, refundedAmount: 0,
    maxOrder: { id: '', total: -Infinity },
  },
);

console.log('\n一次遍历得到的全量概览：');
console.log('  订单数 =', overview.count, '，商品件数 =', overview.qty, '，总金额 =', overview.amount);
console.log('  已支付金额 =', overview.paidAmount, '，待支付金额 =', overview.unpaidAmount, '，已退款金额 =', overview.refundedAmount);
console.log('  最大单笔订单 =', overview.maxOrder.id, '金额', overview.maxOrder.total);

// 状态分布（分组 + 计数）
const statusDistribution = enriched.reduce((acc, o) => {
  acc[o.status] = (acc[o.status] ?? 0) + 1;
  return acc;
}, {});
console.log('\n状态分布 =', JSON.stringify(statusDistribution));

// 也可以用 Object.groupBy（Node 21+）
if (typeof Object.groupBy === 'function') {
  const groupedByStatus = Object.groupBy(enriched, (o) => o.status);
  console.log('Object.groupBy 版本 =', Object.entries(groupedByStatus).map(([s, l]) => `${s}:${l.length}`).join(' '));
}

// ---------------------------------------------------------------------------
// 3. 按地区汇总：分组 + 聚合 + 排序
// ---------------------------------------------------------------------------

console.log('\n--- 3. 按地区汇总 ---');

const byRegion = paidOrders.reduce((acc, o) => {
  const region = o.region;
  acc[region] ??= { region, orders: 0, amount: 0, qty: 0, orderIds: [] };
  acc[region].orders += 1;
  acc[region].amount += o.total;
  acc[region].qty += o.qty;
  acc[region].orderIds.push(o.id);
  return acc;
}, {});

// 转成数组 + 排序（注意用 toSorted 而不是 sort，避免改到我们自己造的中间数组倒还好，
// 但统一用非破坏性写法更安全）
const regionRanking = Object.values(byRegion)
  .map((r) => ({ ...r, avgOrder: Number((r.amount / r.orders).toFixed(2)) }))
  .toSorted((a, b) => b.amount - a.amount);

console.log('地区销售排行（按金额降序）：');
regionRanking.forEach((r, i) => {
  console.log(`  #${i + 1} ${r.region.padEnd(3)} 订单 ${r.orders} 笔，金额 ${r.amount}，件数 ${r.qty}，客单价 ${r.avgOrder}`);
});

const topRegion = regionRanking.at(0);
console.log('\n冠军地区 =', topRegion.region, '，金额', topRegion.amount);

// 占比
const totalPaid = regionRanking.reduce((s, r) => s + r.amount, 0);
console.log('\n各地区金额占比：');
regionRanking.forEach((r) => {
  const pct = ((r.amount / totalPaid) * 100).toFixed(1);
  console.log(`  ${r.region}: ${pct}%  ${'#'.repeat(Math.round(Number(pct) / 5))}`);
});

// ---------------------------------------------------------------------------
// 4. 按月份汇总：时间序列
// ---------------------------------------------------------------------------

console.log('\n--- 4. 按月份汇总 ---');

const byMonth = paidOrders.reduce((acc, o) => {
  acc[o.month] ??= { month: o.month, amount: 0, orders: 0 };
  acc[o.month].amount += o.total;
  acc[o.month].orders += 1;
  return acc;
}, {});

const monthSeries = Object.values(byMonth).toSorted((a, b) => a.month.localeCompare(b.month));
console.log('月度趋势（已支付）：');
monthSeries.forEach((m) => {
  console.log(`  ${m.month}  ${String(m.amount).padStart(6)} 元  (${m.orders} 笔)`);
});

// 环比增长率
console.log('\n环比增长：');
monthSeries.forEach((m, i) => {
  if (i === 0) {
    console.log(`  ${m.month}: 基期`);
    return;
  }
  const prev = monthSeries[i - 1].amount;
  const growth = (((m.amount - prev) / prev) * 100).toFixed(1);
  console.log(`  ${m.month}: ${growth}%（上期 ${prev} -> 本期 ${m.amount}）`);
});

// ---------------------------------------------------------------------------
// 5. Top N：商品排行（flatMap + 分组 + 排序 + slice）
// ---------------------------------------------------------------------------

console.log('\n--- 5. 商品销售排行 ---');

// 先只保留已支付订单的明细，并"摊平"成一行行明细
const paidLines = paidOrders.flatMap((o) =>
  o.items.map((item) => ({
    orderId: o.id,
    sku: item.sku,
    name: item.name,
    category: item.category,
    price: item.price,
    qty: item.qty,
    subtotal: item.price * item.qty,
  })),
);
console.log('已支付明细行数 =', paidLines.length);
console.log('前 3 行 =', JSON.stringify(paidLines.slice(0, 3)));

// 按 SKU 汇总
const bySku = paidLines.reduce((acc, line) => {
  acc[line.sku] ??= { sku: line.sku, name: line.name, category: line.category, qty: 0, amount: 0 };
  acc[line.sku].qty += line.qty;
  acc[line.sku].amount += line.subtotal;
  return acc;
}, {});

// 排行：先按销量降序，销量相同再按金额降序
const skuRanking = Object.values(bySku).toSorted(
  (a, b) => b.qty - a.qty || b.amount - a.amount,
);

console.log('\n商品销量榜（前 5）：');
skuRanking.slice(0, 5).forEach((s, i) => {
  console.log(`  #${i + 1} ${s.name}（${s.sku}）  销量 ${s.qty}  金额 ${s.amount}`);
});

console.log('\n完整榜单：');
skuRanking.forEach((s) => console.log(`  ${s.name.padEnd(22)} ${s.qty} 件 / ${s.amount} 元`));

// 销售额 Top 1
const bestSeller = skuRanking.reduce((best, s) => (s.amount > best.amount ? s : best), skuRanking[0]);
console.log('\n销售额冠军 =', bestSeller.name, '（', bestSeller.amount, '元）');

// ---------------------------------------------------------------------------
// 6. 按品类汇总：分组 + 占比
// ---------------------------------------------------------------------------

console.log('\n--- 6. 品类汇总 ---');

const byCategory = paidLines.reduce((acc, line) => {
  acc[line.category] ??= { category: line.category, qty: 0, amount: 0, skus: new Set() };
  acc[line.category].qty += line.qty;
  acc[line.category].amount += line.subtotal;
  acc[line.category].skus.add(line.sku);
  return acc;
}, {});

const categorySummary = Object.values(byCategory)
  .map((c) => ({ ...c, skuCount: c.skus.size, skuList: [...c.skus] }))
  .toSorted((a, b) => b.amount - a.amount);

console.log('品类汇总：');
categorySummary.forEach((c) => {
  console.log(`  ${c.category}: ${c.qty} 件，${c.amount} 元，涵盖 ${c.skuCount} 个 SKU（${c.skuList.join('/')}）`);
});

// 品类金额占比（用 reduce 算总额，再 map 出占比）
const categoryTotal = categorySummary.reduce((s, c) => s + c.amount, 0);
console.log('\n品类占比：');
categorySummary
  .map((c) => ({ category: c.category, pct: Number(((c.amount / categoryTotal) * 100).toFixed(1)) }))
  .forEach((c) => console.log(`  ${c.category}: ${c.pct}%`));

// 也可以直接返回对象形式方便前端用
const categoryPie = Object.fromEntries(categorySummary.map((c) => [c.category, c.amount]));
console.log('\n便于前端绘图的对象 =', JSON.stringify(categoryPie));

// ---------------------------------------------------------------------------
// 7. 用户维度：复购率与消费排行
// ---------------------------------------------------------------------------

console.log('\n--- 7. 用户维度 ---');

const byUser = paidOrders.reduce((acc, o) => {
  acc[o.userId] ??= { userId: o.userId, orders: 0, amount: 0, orderIds: [] };
  acc[o.userId].orders += 1;
  acc[o.userId].amount += o.total;
  acc[o.userId].orderIds.push(o.id);
  return acc;
}, {});

const userRanking = Object.values(byUser)
  .map((u) => ({ ...u, avgOrder: Number((u.amount / u.orders).toFixed(2)), isRepeat: u.orders > 1 }))
  .toSorted((a, b) => b.amount - a.amount || a.userId.localeCompare(b.userId));

console.log('用户消费排行：');
userRanking.forEach((u, i) => {
  console.log(`  #${i + 1} ${u.userId}  下单 ${u.orders} 次，金额 ${u.amount}，客单价 ${u.avgOrder}${u.isRepeat ? '  [复购]' : ''}`);
});

const repeatUsers = userRanking.filter((u) => u.isRepeat);
console.log('\n复购用户数 =', repeatUsers.length, '/', userRanking.length);
console.log('复购率 =', ((repeatUsers.length / userRanking.length) * 100).toFixed(1) + '%');

// 用 some / every 做整体判断
const hasBigSpender = userRanking.some((u) => u.amount >= 1000);
const allHaveOrders = userRanking.length > 0 && userRanking.every((u) => u.orders >= 1);
console.log('有消费满 1000 的用户吗？', hasBigSpender);
console.log('所有用户都至少下过一单吗？', allHaveOrders);
console.log('（注意 every 在空数组上返回 true，所以先判断了 length > 0，见 14 号文件）');

// ---------------------------------------------------------------------------
// 8. 综合：一条链条算出多个指标
// ---------------------------------------------------------------------------

console.log('\n--- 8. 一条链条算出多个指标 ---');

// 需求：找出"华东地区 2024 年 4 月已支付订单"，
//       计算金额合计、件数合计、最高单笔、以及每笔的平均值
const report = enriched
  .filter((o) => o.status === 'paid')
  .filter((o) => o.region === '华东')
  .filter((o) => o.month === '2024-04')
  .map((o) => ({ id: o.id, total: o.total, qty: o.qty }));

console.log('筛选结果 =', JSON.stringify(report));

const reportStats = report.reduce(
  (acc, o) => {
    acc.sum += o.total;
    acc.qty += o.qty;
    acc.max = Math.max(acc.max, o.total);
    acc.min = Math.min(acc.min, o.total);
    return acc;
  },
  { sum: 0, qty: 0, max: -Infinity, min: Infinity },
);
reportStats.avg = report.length ? Number((reportStats.sum / report.length).toFixed(2)) : 0;

console.log('\n报表：');
console.log('  订单数 =', report.length);
console.log('  金额合计 =', reportStats.sum);
console.log('  件数合计 =', reportStats.qty);
console.log('  最高单笔 =', reportStats.max, '，最低单笔 =', reportStats.min);
console.log('  平均单笔 =', reportStats.avg);

// ---------------------------------------------------------------------------
// 9. 把链条抽成可复用的管道
// ---------------------------------------------------------------------------

console.log('\n--- 9. 抽成可复用的管道 ---');

/** 简单的管道工具：把一组 (数组 => 数组) 的函数串起来 */
const pipe = (...fns) => (input) => fns.reduce((acc, fn) => fn(acc), input);

// 每个步骤都是"数组 -> 数组"的纯函数，可以自由组合与复用
const onlyPaid = (arr) => arr.filter((o) => o.status === 'paid');
const inRegion = (region) => (arr) => arr.filter((o) => o.region === region);
const withTotal = (arr) => arr.map((o) => ({ ...o, total: orderTotal(o) }));
const sortByTotalDesc = (arr) => arr.toSorted((a, b) => b.total - a.total);
const topN = (n) => (arr) => arr.slice(0, n);

const topPaidInEast = pipe(onlyPaid, withTotal, inRegion('华东'), sortByTotalDesc, topN(3));

console.log('华东地区已支付 Top 3：');
topPaidInEast(orders).forEach((o, i) => {
  console.log(`  #${i + 1} ${o.id}  ${o.total} 元`);
});

// 换个地区参数就能复用同一条管道
const topPaidInSouth = pipe(onlyPaid, withTotal, inRegion('华南'), sortByTotalDesc, topN(3));
console.log('\n华南地区已支付 Top 3：');
topPaidInSouth(orders).forEach((o, i) => {
  console.log(`  #${i + 1} ${o.id}  ${o.total} 元`);
});

// 管道里全部是非破坏性方法，所以 orders 依然干净
console.log('\n原 orders 依然没有 total 字段吗？', !('total' in orders[0]), '（管道没有污染源数据）');

// ---------------------------------------------------------------------------
// 10. 陷阱复盘：破坏性方法混进链条
// ---------------------------------------------------------------------------

console.log('\n--- 10. 陷阱复盘 ---');

// 错误示范：链条里用了 sort（破坏性）
const risky = orders.map((o) => ({ ...o, total: orderTotal(o) }));
console.log('排序前 risky[0] =', risky[0].id, '，total =', risky[0].total);
const sortedWrong = risky.sort((a, b) => b.total - a.total); // sort 会改 risky！
console.log('用 sort 排序后 risky[0] =', risky[0].id, '（risky 自己被改了，因为它就是那个被排序的数组）');
console.log('sortedWrong === risky ?', sortedWrong === risky, '（true，返回的是同一个数组）');
console.log('如果 risky 是"共享给别处的数据"，这里就已经把别人的数据顺序改掉了。');

// 正确示范：用 toSorted
const risky2 = orders.map((o) => ({ ...o, total: orderTotal(o) }));
const originalFirst = risky2[0].id;
const sortedRight = risky2.toSorted((a, b) => b.total - a.total);
console.log('\n用 toSorted 排序后：原数组第一个还是', risky2[0].id, '（', risky2[0].id === originalFirst, '未变）');
console.log('排序结果第一个 =', sortedRight[0].id);

// 另一个陷阱：map 里忘了 return
const forgotReturn = orders
  .map((o) => {
    orderTotal(o); // 没有 return
  })
  .filter((x) => x > 0);
console.log('\nmap 里忘 return 的后果：filter 拿到的全是 undefined，结果 =', JSON.stringify(forgotReturn), '（空数组，静默出错）');

// ---------------------------------------------------------------------------
// 11. 方法选择速查（链式调用版）
// ---------------------------------------------------------------------------

console.log('\n--- 11. 速查 ---');

const cheatsheet = [
  ['取需要的行', 'filter'],
  ['派生/变换每行的字段', 'map'],
  ['把嵌套结构摊平', 'flat / flatMap'],
  ['把多行合并成一个值（求和/计数/建表）', 'reduce'],
  ['排序（不改原数组）', 'toSorted'],
  ['反转（不改原数组）', 'toReversed'],
  ['取前 N 个', 'slice(0, n)'],
  ['去重', '[...new Set(arr)]'],
  ['分组', 'Object.groupBy / Map.groupBy / reduce'],
  ['只要有/全都满足', 'some / every'],
  ['找第一个匹配', 'find / findIndex'],
];
cheatsheet.forEach(([task, method]) => console.log(`  ${task.padEnd(28, '·')} ${method}`));

console.log('\n三条守则：');
console.log('  1. 链条里只用非破坏性方法（map/filter/reduce/flatMap/toSorted/slice/concat）；');
console.log('  2. 先 filter 缩小集合，再 map 变换，最后 reduce 汇总；');
console.log('  3. 链条超过 4~5 步就抽成命名函数或中间变量，可读性优先于"一行流"。');

// 收尾：确认原数据依然干净
console.log('\n最终检查：orders 长度 =', orders.length, '，orders[0] 的键 =', Object.keys(orders[0]).join(','));
console.log('全程没有修改原始数据集。');
