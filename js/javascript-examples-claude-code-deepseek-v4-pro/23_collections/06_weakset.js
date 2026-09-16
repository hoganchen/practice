/**
 * ============================================================================
 * 知识点：WeakSet —— 给对象打"临时标记"的弱引用集合
 * ============================================================================
 *
 * 【所属分类】23_collections —— 集合类型
 * 【难度等级】进阶
 * 【前置知识】23_collections/03_set_basics.js、05_weakmap.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    WeakSet 是"弱引用"版的 Set，与 WeakMap 是一对孪生兄弟：
 *      - 元素**只能是对象**（原始值会抛 TypeError）
 *      - **不可枚举**：没有 size、不能遍历、没有 forEach
 *      - 元素是**弱引用**：对象没有别的引用时，标记随之自动消失
 *    API 只有三个方法：add / has / delete。
 *    （对比记忆：Map 的弱化版是 WeakMap，Set 的弱化版是 WeakSet。）
 *
 * 2. 为什么需要
 *    WeakSet 的唯一语义是"**这个对象有没有被打过标记**"。
 *    典型场景：
 *      (1) 标记"已处理/已访问"：遍历图时避免重复访问，且不阻碍节点被回收；
 *      (2) 标记"不可信对象"：如"这个来源的对象已经过校验/已被列入黑名单"；
 *      (3) 给 DOM 节点打标记：标记随节点移除而消失，不会泄漏。
 *    如果只需要"存一批对象"而需要遍历/计数，就应该用 Set，不是 WeakSet。
 *
 * 3. 核心语法要点
 *    (1) new WeakSet()  /  new WeakSet(可迭代对象)（元素必须都是对象，否则抛错）
 *    (2) ws.add(obj)      返回 WeakSet 本身，可链式；重复添加是幂等的
 *    (3) ws.has(obj)      返回布尔值，按引用比较
 *    (4) ws.delete(obj)   返回布尔值
 *    (5) 没有 size、clear、forEach、keys、values、entries
 *    (6) 未注册的 Symbol 也能作为元素（与 WeakMap 的键规则一致）
 *
 * 4. 常见陷阱
 *    (1) 想读 ws.size 或遍历它 —— 都不存在。
 *    (2) 想存原始值 —— 立即抛 TypeError。
 *    (3) 想用它"去重一个对象数组" —— 内容相同的对象是不同元素，做不到；
 *        而且结果集合不可枚举，拿不到去重后的列表。
 *    (4) 以为"标记消失"的时刻可以观测 —— GC 时机不可预测。
 *    (5) 忘了解构本质：WeakSet 只能回答"有没有"，不能回答"有哪些"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 23_collections/06_weakset.js
 *
 * 【预期输出】
 *   分 7 个小节，演示基本 API、只能对象、不可枚举、与 Set 的全面对比、
 *   图遍历去重、对象"校验标记"，以及用普通对象模拟 DOM 节点的标记场景。
 *   输出固定，不依赖 GC 时机。
 * ============================================================================
 */

console.log('--- 1. WeakSet 的基本 API ---');

const ws = new WeakSet();
const nodeA = { id: 'A' };
const nodeB = { id: 'B' };

// add 返回 WeakSet 本身，可链式。
const chained = ws.add(nodeA);
console.log('add 返回的是 WeakSet 本身吗：', chained === ws);
ws.add(nodeB);
// 重复添加是幂等的，不会报错也（逻辑上）不会新增。
ws.add(nodeA);
console.log('重复 add 同一个对象不会报错，也没有任何提示');

console.log('has(nodeA)      =', ws.has(nodeA));
console.log('has(nodeB)      =', ws.has(nodeB));
console.log('has({ id: "A" }) =', ws.has({ id: 'A' }), '（undefined/ false —— 不是同一个引用）');
console.log('delete(nodeB)   =', ws.delete(nodeB));
console.log('再 has(nodeB)   =', ws.has(nodeB));
console.log('delete(没加过的对象) =', ws.delete({ id: 'C' }), '（返回 false）');
console.log('可用的成员只有 add / has / delete 三个。');

console.log('\n--- 2. 只能放对象：原始值会抛 TypeError ---');
const primitives = ['字符串', 42, true, null, undefined, Symbol.for('已注册')];
for (const p of primitives) {
  try {
    ws.add(p);
    console.log('  竟然接受了：', String(p));
  } catch (err) {
    console.log(`  ❌ add(${typeof p === 'symbol' ? 'Symbol.for(...)' : String(p)}) -> ${err.constructor.name}: ${err.message}`);
  }
}
// 数组、函数、日期等对象都可以。
const objLike = [[], function () {}, new Date(0), Symbol('未注册的 Symbol')];
console.log('对象类型的元素都合法：');
for (const o of objLike) {
  ws.add(o);
  console.log(`  ${Object.prototype.toString.call(o).padEnd(16)} -> has =`, ws.has(o));
}

console.log('\n--- 3. 不可枚举：没有 size，也没有遍历 ---');
console.log('typeof WeakSet.prototype.forEach =', typeof WeakSet.prototype.forEach, '（不存在）');
console.log('typeof WeakSet.prototype.clear   =', typeof WeakSet.prototype.clear, '（不存在）');
console.log('"size" in new WeakSet()          =', 'size' in new WeakSet(), '（false）');
try {
  for (const x of new WeakSet()) void x;
} catch (err) {
  console.log('❌ 遍历 WeakSet 抛错 ->', err.constructor.name + ':', err.message);
}
// 初始化时传数组里有非对象也会抛错。
try {
  new WeakSet([{ ok: 1 }, 123]);
} catch (err) {
  console.log('❌ new WeakSet([对象, 123]) 抛错 ->', err.constructor.name + ':', err.message);
}

console.log('\n--- 4. WeakSet 与 Set 的全面对比 ---');

const comparison = [
  ['元素类型', '任意类型', '只能是对象'],
  ['size 属性', '有', '没有'],
  ['forEach', '有', '没有'],
  ['keys/values/entries', '有', '没有'],
  ['clear()', '有', '没有'],
  ['能否遍历', '能', '不能'],
  ['元素引用强度', '强引用（阻碍回收）', '弱引用（不阻碍回收）'],
  ['典型用途', '去重、判存、集合运算', '给对象打标记且不阻碍回收'],
];
console.log('  ' + '对比项'.padEnd(22) + 'Set'.padEnd(24) + 'WeakSet');
console.log('  ' + '-'.repeat(70));
for (const [item, setDesc, weakDesc] of comparison) {
  console.log('  ' + item.padEnd(20) + setDesc.padEnd(22) + weakDesc);
}
console.log('\n一句话区分：要"列出有哪些"就用 Set；只回答"这个对象有没有被标记"就用 WeakSet。');

console.log('\n--- 5. 场景一：图遍历时标记"已访问"（用普通对象模拟图） ---');

// 图的邻接表：节点是对象，边指向其他节点对象。
const alice = { name: 'Alice' };
const bob = { name: 'Bob' };
const carol = { name: 'Carol' };
const dave = { name: 'Dave' };
const graph = new Map([
  [alice, [bob, carol]],
  [bob, [alice, dave]],
  [carol, [alice]],
  [dave, [bob]],
]);

/**
 * 广度优先搜索，返回访问顺序。用 WeakSet 记录已访问节点。
 * @param {object} start 起点节点
 * @returns {string[]} 访问到的节点名
 */
function bfs(start) {
  const visited = new WeakSet(); // 标记随节点对象一起被回收，不需要手动清理
  const queue = [start];
  const order = [];
  visited.add(start);
  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node.name);
    for (const next of graph.get(node) ?? []) {
      // 只回答"有没有访问过"，不需要列举所有已访问节点
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return order;
}
console.log('从 Alice 出发的 BFS 访问顺序 =', bfs(alice).join(' -> '));
console.log('从 Dave 出发的 BFS 访问顺序 =', bfs(dave).join(' -> '));
console.log('✅ 用 Set 也能实现，但 WeakSet 不阻碍节点被回收，更适合长时间运行的程序。');

// 对比：如果这里用数组做"已访问"判断，会退化成 O(n) 查找。
/**
 * 用数组记录已访问的反面教材（仅用于说明复杂度）。
 * @param {object} start 起点
 * @returns {string[]} 访问顺序
 */
function bfsWithArray(start) {
  const visited = [start]; // ❌ 用数组
  const queue = [start];
  const order = [];
  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node.name);
    for (const next of graph.get(node) ?? []) {
      if (!visited.includes(next)) { // O(n) 查找，节点多时越来越慢
        visited.push(next);
        queue.push(next);
      }
    }
  }
  return order;
}
console.log('用数组实现的等价结果 =', bfsWithArray(alice).join(' -> '), '（结果一样，但复杂度差一档）');

console.log('\n--- 6. 场景二：标记"已校验"的对象 ---');

const verified = new WeakSet();

/**
 * 校验数据对象，通过则打上"已校验"标记。
 * @param {object} record 待校验的记录
 * @returns {boolean} 是否校验通过
 */
function verify(record) {
  const ok = typeof record.id === 'number' && typeof record.name === 'string';
  if (ok) verified.add(record);
  return ok;
}
/**
 * 只有被校验过的对象才允许写入（防止绕过校验）。
 * @param {object} record 记录
 * @returns {string} 处理结果
 */
function save(record) {
  if (!verified.has(record)) {
    return `❌ 拒绝保存 ${JSON.stringify(record)}：该对象未经校验`;
  }
  return `✅ 已保存 ${record.name}`;
}

const goodRecord = { id: 1, name: '合法记录' };
const badRecord = { id: 'not-a-number', name: '非法记录' };
const sneakyRecord = { id: 2, name: '偷偷构造的记录' };
console.log('verify(goodRecord)     =', verify(goodRecord));
console.log('verify(badRecord)      =', verify(badRecord));
console.log(save(goodRecord));
console.log(save(badRecord));
console.log(save(sneakyRecord), '（没走校验流程，被拦截）');
console.log('✅ 标记存在 WeakSet 里，外部无法伪造（拿不到那个 WeakSet 的引用）。');

console.log('\n--- 7. 场景三：模拟 DOM 节点的"已处理"标记 ---');

// 用普通对象模拟 DOM 节点（Node 环境没有 DOM）。
const fakeNodes = [
  { tagName: 'DIV', id: 'app' },
  { tagName: 'SPAN', id: 'label' },
  { tagName: 'BUTTON', id: 'submit' },
];
const processedNodes = new WeakSet();

/**
 * 模拟"初始化节点"：只处理还没处理过的节点。
 * @param {object} node 节点对象
 * @returns {string} 处理结果描述
 */
function initNode(node) {
  if (processedNodes.has(node)) return `${node.id} 已初始化过，跳过`;
  processedNodes.add(node);
  return `${node.id} 初始化完成`;
}
console.log('第一轮初始化：');
for (const n of fakeNodes) console.log('  ', initNode(n));
console.log('第二轮初始化：');
for (const n of fakeNodes) console.log('  ', initNode(n));

// 模拟节点被移除：从数组里删掉引用后，WeakSet 中的标记就"可被回收"了。
const removed = fakeNodes.pop();
console.log(`\n移除节点 ${removed.id}（模拟 DOM 节点被删除）`);
console.log('它的标记会随对象一起被 GC 回收，我们既不需要手动 delete，也无法（不需要）确认。');
console.log('剩下的节点依然被正确标记：');
for (const n of fakeNodes) console.log('  ', initNode(n));

console.log('\n--- 8. 什么时候不用 WeakSet ---');
console.log('❌ 需要对一批对象去重并拿到结果列表 -> 用 Set（结果可枚举）');
console.log('❌ 需要知道"标记了多少个" -> 用 Set 的 size，或自己维护计数器');
console.log('❌ 需要存原始值（数字、字符串） -> 用 Set');
console.log('❌ 需要遍历所有已标记对象 -> 用 Set 或 Map');
console.log('✅ 只需要回答"这个对象被打过标记吗" -> 用 WeakSet');
console.log('\n本节结束。');
