/**
 * ============================================================================
 * 知识点：yield* 委托 —— 把迭代工作交给另一个生成器或可迭代对象
 * ============================================================================
 *
 * 【所属分类】17_iterators_and_generators —— 迭代器与生成器
 * 【难度等级】高级
 * 【前置知识】17_iterators_and_generators/05_generator_two_way.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    yield* 后面跟一个"可迭代对象"，表示"把接下来的产出全部委托给它"。
 *    它不是把迭代器对象本身 yield 出去，而是逐个把对方的元素 yield 出来，
 *    并且把外部通过 next() 传进来的值原样转发给对方。
 *
 * 2. 为什么需要
 *    复杂迭代逻辑往往要拆成多个小生成器。没有 yield* 时，你只能写
 *    for (const v of other) yield v;——这能产出值，但会丢掉两样东西：
 *      ① 子生成器 next(值) 收到的参数（单向转发会断掉）；
 *      ② 子生成器 return 的返回值。
 *    yield* 把这两种信息都完整接了过来，所以它叫"委托"而不是"拼接"。
 *
 * 3. 核心语法要点
 *    - yield* 后面可以是生成器对象、数组、字符串、Set、Map，任何可迭代对象。
 *    - yield* 表达式的求值结果 = 被委托对象的 return 值（done: true 时的 value）。
 *    - 外部的 next(v) 会先转发给当前正在运行的子生成器；
 *      子生成器结束后，再回到外层继续。
 *    - yield* 可以嵌套，形成一棵"生成器树"。
 *    - 可以递归 yield* 自己，实现树的深度优先遍历。
 *
 * 4. 常见陷阱
 *    - 写成 yield other（少了星号）：只产出"迭代器对象"一个值，不是它的元素。
 *    - 以为 yield* 会拿到子生成器 return 的返回值——其实要写
 *      const r = yield* sub; 才拿得到。
 *    - 子生成器内部 return 的值不会被 for...of 看到，只能通过 yield* 的
 *      返回值或手工 next() 获取。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 17_iterators_and_generators/06_generator_delegation.js
 *
 * 【预期输出】
 *   演示委托给数组/字符串/Map、委托给另一个生成器、拿到子生成器的返回值，
 *   以及用递归 yield* 展开树结构。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 委托给内置可迭代对象
// ---------------------------------------------------------------------------

console.log('--- 1. yield* 委托给内置可迭代对象 ---');

function* delegateBuiltins() {
  console.log('  [生成器] 准备委托给数组');
  yield* [1, 2, 3]; // 等价于依次 yield 1、2、3，但更简短

  console.log('  [生成器] 准备委托给字符串');
  yield* 'abc'; // 字符串迭代器按码点逐个产出

  console.log('  [生成器] 准备委托给 Set');
  yield* new Set(['x', 'y']);

  console.log('  [生成器] 准备委托给 Map（迭代产出 [key, value] 数组）');
  yield* new Map([['k1', 'v1'], ['k2', 'v2']]);

  console.log('  [生成器] 准备委托给另一个生成器');
  yield* (function* inner() { yield '内层-1'; yield '内层-2'; })();

  console.log('  [生成器] 全部委托完成');
}

for (const v of delegateBuiltins()) {
  console.log('  收到：', v);
}

// ---------------------------------------------------------------------------
// 2. yield（无星号）vs yield* 的差别
// ---------------------------------------------------------------------------

console.log('\n--- 2. yield 与 yield* 的差别 ---');

function* withoutStar() {
  yield [1, 2, 3]; // 产出的是"整个数组"这一个值
}

function* withStar() {
  yield* [1, 2, 3]; // 产出的是数组里的三个元素
}

console.log('yield  数组 ->', [...withoutStar()]); // [[1, 2, 3]]
console.log('yield* 数组 ->', [...withStar()]);    // [1, 2, 3]

// ---------------------------------------------------------------------------
// 3. 拿取子生成器的返回值
// ---------------------------------------------------------------------------

console.log('\n--- 3. yield* 表达式的求值结果 = 子生成器的 return 值 ---');

function* subTask() {
  yield '子-步骤1';
  yield '子-步骤2';
  return '子任务完成'; // 这个返回值 for...of 看不到
}

function* parentTask() {
  console.log('  [父] 开始委托子任务');

  // 关键：把 yield* 的结果接住，就拿到了子生成器 return 的东西
  const subResult = yield* subTask();
  console.log('  [父] 收到子任务的返回值：', subResult);

  yield '父-收尾';
  return '父任务完成';
}

// for...of 只看得到 yield 出来的值
console.log('for...of 结果：', [...parentTask()]);

// 手工跑到 done，才能看到最终的 return 值
const pit = parentTask();
let step = pit.next();
while (!step.done) {
  step = pit.next();
}
console.log('父任务最终 return 值：', step.value);

// ---------------------------------------------------------------------------
// 4. next(值) 会被转发给正在运行的子生成器
// ---------------------------------------------------------------------------

console.log('\n--- 4. 双向通信穿过 yield* ---');

function* inner() {
  const fromOuter = yield '子：请给我一个数';
  console.log('  [子] 收到：', fromOuter);
  const again = yield `子：${fromOuter} 的两倍是 ${fromOuter * 2}，再给一个？`;
  console.log('  [子] 收到：', again);
  return fromOuter + again;
}

function* outer() {
  // 外层一上来就委托，不自己先 yield 一个值。
  // 这样外部第一次 next() 负责"启动"，第二次 next(10) 传的 10 就能
  // 一路转发到 inner 里当前正在等待的那个 yield 上。
  const total = yield* inner();
  console.log('  [父] inner 的返回值是：', total);
  yield `父：合计 ${total}`;
}

const delegationIt = outer();
// 第一次 next() 只负责启动，实参会被丢弃（见 05 篇的陷阱），所以不传值
console.log('返回：', delegationIt.next());
// 这一次的 10 会穿过 yield*，直接成为 inner 里第一个 yield 的值
console.log('返回：', delegationIt.next(10));
// 这一次的 5 成为 inner 里第二个 yield 的值，随后 inner 结束并 return 10+5=15
console.log('返回：', delegationIt.next(5));
// inner 已结束，控制权回到外层，外层用 inner 的返回值继续产出
console.log('返回：', delegationIt.next());
// 外层也结束了
console.log('返回：', delegationIt.next());

// ---------------------------------------------------------------------------
// 5. 递归 yield*：深度优先遍历树
// ---------------------------------------------------------------------------

console.log('\n--- 5. 递归 yield* 遍历树 ---');

const tree = {
  name: 'root',
  children: [
    { name: 'A', children: [{ name: 'A-1', children: [] }, { name: 'A-2', children: [] }] },
    { name: 'B', children: [{ name: 'B-1', children: [{ name: 'B-1-a', children: [] }] }] },
    { name: 'C', children: [] },
  ],
};

// 这个生成器每遇到一个节点就 yield 它的名字，
// 然后用 yield* 把子节点的遍历"接力"下去，天然形成深度优先序。
function* walk(node, depth = 0) {
  yield { name: node.name, depth };
  for (const child of node.children) {
    yield* walk(child, depth + 1); // 递归委托
  }
}

console.log('深度优先遍历：');
for (const { name, depth } of walk(tree)) {
  console.log(`${'  '.repeat(depth)}- ${name}（第 ${depth} 层）`);
}

// 因为是可迭代对象，还能直接配合数组方法
console.log('只取第 2 层的节点：', [...walk(tree)].filter((n) => n.depth === 2).map((n) => n.name));

console.log('\n示例结束。');
