/**
 * ============================================================================
 * 知识点：不可变更新与结构共享 —— FP 在 JavaScript 里真正落地的那一环
 * ============================================================================
 *
 * 【所属分类】40_functional_programming —— 函数式编程进阶
 * 【难度等级】高级
 * 【前置知识】09_objects/*（展开语法）、08_arrays/*（数组方法）、34_modern_es_features/03_es2023_features.js、25_proxy_and_reflect/02_get_set_traps.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    不可变更新：要"改"一个值，就基于原值造一个新值，原值一动不动。
 *    结构共享（structural sharing）：造新值时**只复制从根到被改动节点的那条路径**，
 *    没碰过的子树直接复用原对象（同一个引用，不复制、不占新内存）。
 *    两者是一对：不可变更新负责"不破坏旧值"，结构共享负责"让这件事不贵"。
 *    没有结构共享的不可变更新就是全量深拷贝 —— 正确但昂贵；
 *    有了结构共享，一次修改的代价从 O(节点总数) 降到 O(路径长度)。
 *
 * 2. 为什么需要
 *    先看不可变更新的朴素写法（展开语法）在深层嵌套下的样子：
 *      { ...state, user: { ...state.user, settings: { ...state.user.settings, theme: 'dark' } } }
 *    三层就要写三行展开，五层就要五层。它有两个真实的问题：
 *      (1) 容易漏：少展开一层，改的就是原对象（第 1 节有事故现场）；
 *      (2) 容易错：键名要重复抄写，抄错了编译器不报错，运行时才发现。
 *    于是有人改用 structuredClone 全量深拷贝：写法简单、绝对安全，
 *    但每改一个字段就要复制整棵对象树（第 2 节实测：2047 个节点全部复制一遍）。
 *    结构共享就是在"展开地狱"和"全量拷贝"之间给出的第三条路。
 *
 * 3. 核心语法要点
 *    (1) 手写路径复制就是几行递归：复制当前层（[...arr] 或 {...obj}），
 *        把下一层的递归结果塞回去，其余字段借着浅拷贝自动"共享"过去。
 *    (2) 数组的非破坏性方法（ES2023）：toSorted / toReversed / toSpliced / with，
 *        对应会就地修改的 sort / reverse / splice 和下标赋值。
 *    (3) 引用相等是判断"变没变"的最快方式：Object.is(next, prev) 为 true
 *        就说明整棵子树都没动 —— 这是 React / Redux 性能优化的地基。
 *    (4) 浅比较（shallow equal）：只比较第一层的每个字段引用。
 *        有了结构共享，改动会沿路径向上"冒泡"成新的引用，
 *        所以浅比较既能发现变化，代价又只有 O(字段数)。
 *    (5) 库的做法：Immer 用 Proxy 造一个"草稿"，让开发者用可变写法改草稿，
 *        内部记录变更、最后按路径复制产出新对象（第 5 节手写一个 mini 版）；
 *        Immutable.js 则用持久化数据结构（HAMT、RRB-Tree）把路径复制做到 O(log n)。
 *    (6) Object.freeze 是**浅冻结**，只冻第一层；它的价值是开发期让"偷偷改"
 *        直接抛错（严格模式），而不是提供不可变性。
 *
 * 4. 常见陷阱
 *    - 少展开一层 → 直接改到了原对象。而且往往"看起来是对的"，直到界面上
 *      两处数据一起变了才被发现（第 1 节）。
 *    - 以为展开语法是深拷贝：`{...obj}`、`[...arr]`、`arr.toSorted()` 全是**浅**拷贝，
 *      里面的对象元素仍然是共享引用；改 `copy[0].x` 会同时改到原数组。
 *    - 以为 toSorted 只是 sort 的别名：原代码如果**依赖**就地修改
 *      （后续代码读同一个数组），换成 toSorted 行为就变了。
 *    - 只改了深层对象却没沿路径换引用 → 浅比较认为"没变" → React 不重渲染
 *      （最著名的 Redux bug，见第 6 节复现）。
 *    - 把不可变等同于"性能差"。真正贵的是全量深拷贝（structuredClone / JSON 往返），
 *      结构共享的代价是 O(路径长度)，通常只有几个节点。
 *    - 忘了 Object.freeze 只是浅冻结，误以为 frozen 对象整个都不可变了。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 40_functional_programming/09_immutability_and_structural_sharing.js
 *
 * 【预期输出】
 *   先复现嵌套展开写法的痛点与一次真实事故（漏展开一层）；
 *   再用计数器对比三种做法的"复制节点数"：全量深拷贝 vs 路径复制 vs 引用共享；
 *   接着讲数组的非破坏性方法与"就地修改导致界面不更新"的经典问题；
 *   然后手写一个 Immer 式 mini produce（Proxy 草稿 + 变更记录 + 路径复制）；
 *   最后串起那条因果链：不可变 → 引用相等 → 浅比较 → React / Redux 为什么依赖它。
 * ============================================================================
 */

console.log('--- 1. 问题：嵌套对象的不可变更新，展开会一路套下去 ---');

// 一份典型的前端应用状态：用户 → 设置 → 主题，三层嵌套，外加一个列表。
const appState = {
  user: {
    name: 'Alice',
    settings: { theme: 'light', fontSize: 14 },
  },
  todos: [
    { id: 1, text: '写文档', done: false },
    { id: 2, text: '修 bug', done: true },
  ],
};

// 目标：把 theme 改成 'dark'，其他一切不变。
// 朴素写法：从最外层一路展开到目标那一层。每一层都要手写一次。
const next1 = {
  ...appState,
  user: {
    ...appState.user,
    settings: { ...appState.user.settings, theme: 'dark' },
  },
};
console.log('  三层嵌套的展开写法（三行，路径上每一层都要重复一次键名）：');
console.log('    appState.user.settings.theme →', appState.user.settings.theme, '（原状态不变）');
console.log('    next1.user.settings.theme    →', next1.user.settings.theme, '（新状态已改）');
console.log('  问题一：层数越多抄得越多。五层嵌套就要写五行，每行的键名还得自己保证一致。');
console.log('  问题二：漏掉一层就会直接改到原对象。下面是一次真实事故的复现：');

// ★ 事故现场：只想改 name，于是"只展开最外层"，然后顺手改了 user 上的字段。
const buggy = { ...appState }; // 只浅拷贝了根，user 仍然是同一个对象
buggy.user.name = 'Bob'; // ← 这行改的是 appState 里那个 user！
console.log('    buggy.user.name →', buggy.user.name);
console.log('    appState.user.name →', appState.user.name, '← 原状态被污染了！');
console.log('    而且这个 bug 很隐蔽：上面那行代码看起来和"不可变更新"长得一模一样。');
// 复原，免得影响后面的演示
appState.user.name = 'Alice';

console.log('--- 2. 朴素解法：全量深拷贝 structuredClone ---');

// 既然手写路径容易漏，那把整棵树都复制一遍 —— 简单、可靠、绝对安全。
// structuredClone 是内置的深拷贝：支持对象/数组/Map/Set/Date/循环引用，
// 但不能克隆函数、DOM 节点和原型链（也见 GLOSSARY 的深拷贝词条）。
const cloned = structuredClone(appState);
cloned.user.settings.theme = 'dark';
console.log('  structuredClone 后改 theme：');
console.log('    新对象 →', cloned.user.settings.theme, ' 原对象 →', appState.user.settings.theme, '（安全）');

// 但它的代价是 O(节点总数)：改一个叶子，你要把整棵树上所有节点都复制一遍。
// 下面用一棵"节点数已知"的完全二叉树来把这件事量化。
// 每层有两个孩子，深度 d 的节点数是 2^(d+1) - 1。
const TREE_DEPTH = 10;
const makeTree = (depth, path) => ({
  name: path,
  value: depth,
  children: depth === 0 ? [] : [makeTree(depth - 1, `${path}.l`), makeTree(depth - 1, `${path}.r`)],
});
const countNodes = (node) => node.children.reduce((sum, child) => sum + countNodes(child), 1);

const tree = makeTree(TREE_DEPTH, 'root');
const totalNodes = countNodes(tree);
console.log(`  样本：一棵深度 ${TREE_DEPTH} 的二叉树，共 ${totalNodes} 个节点。`);

// 数一数 structuredClone 到底复制了多少个节点：克隆体里有多少节点，就是复制了多少个。
const fullCloneCopied = countNodes(structuredClone(tree));
console.log('  全量深拷贝复制节点数 →', fullCloneCopied, '（等于节点总数：一个都没省）');

console.log('--- 3. 结构共享：只复制路径上的节点 ---');

// 关键洞察：修改操作只影响"从根到目标叶子"这一条路径。
// 路径之外的所有子树，在新旧两个版本里可以**完全一样** —— 那就没必要复制它们，
// 直接让新对象和旧对象指向同一块内存即可。这就是结构共享。
//
// 手写实现只有一个递归：
//   1) 复制当前这一层（浅拷贝，其余字段自动共享过去）；
//   2) 把"下一层的递归结果"塞回被改的那个键上；
//   3) 路径走完了（path 为空）就直接返回新值。
const assocIn = (obj, path, value, counter) => {
  if (path.length === 0) return value; // 到站：用新值替换
  const [key, ...rest] = path;
  const copy = Array.isArray(obj) ? obj.slice() : { ...obj }; // 只复制这一层
  counter.copied++;
  copy[key] = assocIn(obj[key], rest, value, counter); // 只有这一条分支被递归
  return copy;
};

// 构造一条"一路走最左边"的路径：root → children[0] → children[0] → ... → value
const deepPath = [];
for (let i = 0; i < TREE_DEPTH; i++) deepPath.push('children', 0);
deepPath.push('value');

const counter = { copied: 0 };
const treeNext = assocIn(tree, deepPath, 999, counter);
console.log('  路径复制复制节点数 →', counter.copied, `（路径长度 ${deepPath.length}，只复制路径上的节点）`);
console.log(`  差距：${fullCloneCopied} vs ${counter.copied} —— 相差约 ${Math.round(fullCloneCopied / counter.copied)} 倍。`);
console.log('  改一个叶子，却复制了整棵树 —— 全量深拷贝的浪费就在这里。');

// 验证"其余子树真的是同一个对象"：引用相等是最硬的证据。
console.log('  结构共享的证据（用 === 比较引用）：');
console.log('    treeNext.children[1] === tree.children[1]（没碰的右子树）→', treeNext.children[1] === tree.children[1]);
console.log('    treeNext.children[0].children[1] === tree.children[0].children[1]（路径外的兄弟）→',
  treeNext.children[0].children[1] === tree.children[0].children[1]);
console.log('    treeNext.children[0] === tree.children[0]（路径上，被复制了）→', treeNext.children[0] === tree.children[0]);
console.log('    treeNext.value →', treeNext.value, '  tree.value →', tree.value, '（原树完好无损）');
console.log('  ★ 一句话：路径上换新引用，路径外复用旧引用 —— 这就是结构共享的全部内容。');

// 顺带测一下耗时（受机器状态影响，仅供参考，量级比绝对值更重要）。
// 注意：为了不让本文件跑太久，迭代次数取得很小。
const ITER = 100;
const t0 = performance.now();
for (let i = 0; i < ITER; i++) structuredClone(tree);
const t1 = performance.now();
for (let i = 0; i < ITER; i++) assocIn(tree, deepPath, i, { copied: 0 });
const t2 = performance.now();
console.log(`  ${ITER} 次操作耗时：全量深拷贝 ${(t1 - t0).toFixed(1)}ms  vs  路径复制 ${(t2 - t1).toFixed(1)}ms`);
console.log('    两者都是"正确的不可变更新"，差别只在代价 —— 数据越大、改动越深，差距越明显。');

console.log('--- 4. 数组：非破坏性方法（ES2023） ---');

// 数组有四个"就地修改"的方法，是引用比较体系里最常见的破功点：
//   sort / reverse / splice / 下标赋值 —— 它们改的是原数组，引用却没换。
const nums = [3, 1, 2];
const sorted = nums.sort((a, b) => a - b); // 就地排序
console.log('  nums.sort() →', JSON.stringify(sorted), ' 原数组 nums →', JSON.stringify(nums), ' 同一个引用？', sorted === nums);
console.log('  ★ 这就是"改了数据但引用没变"的典型：依赖引用比较的框架会认为什么都没发生。');
console.log('  旧的绕法：arr.slice().sort(...) 或 [...arr].sort(...) —— 先复制再就地改。');

// ES2023 补上了非破坏性版本，名字都带 to 前缀：返回新数组，绝不碰原数组。
const nums2 = [3, 1, 2];
console.log('  nums2.toSorted((a,b) => a-b) →', JSON.stringify(nums2.toSorted((a, b) => a - b)));
console.log('  原数组 nums2 →', JSON.stringify(nums2), '（没动）');
console.log('  [1,2,3].toReversed() →', JSON.stringify([1, 2, 3].toReversed()));
console.log('  [1,2,3].toSpliced(1, 1, "x") →', JSON.stringify([1, 2, 3].toSpliced(1, 1, 'x')), '（对应 splice）');
console.log('  [1,2,3].with(-1, 99) →', JSON.stringify([1, 2, 3].with(-1, 99)), '（对应 arr[i] = v，支持负索引）');
try {
  [1, 2, 3].with(5, 99);
} catch (err) {
  console.log('  with 越界会抛错：', err.constructor.name, '-', err.message, '（第 1 个参数是下标，5 超出范围）');
}

// 两个必须记住的细节。
console.log('  细节一：这些方法都是**浅**拷贝 —— 元素里的对象仍然是共享引用。');
const list = [{ n: 1 }, { n: 2 }];
const listCopy = list.toSorted((a, b) => a.n - b.n);
listCopy[0].n = 100; // 改的是那个共享的对象
console.log('    listCopy[0].n = 100 之后，list[0].n →', list[0].n, '← 原数组里的对象也被改了！');
list[0].n = 1; // 复原

console.log('  细节二：toSorted 不是 sort 的"别名"。旧代码如果依赖就地修改，换了会出 bug。');
const queue = [3, 1, 2];
queue.sort((a, b) => a - b); // 旧代码：后面直接读 queue，依赖它被就地排序了
console.log('    就地 sort 后直接读 queue →', JSON.stringify(queue));
const queue2 = [3, 1, 2];
queue2.toSorted((a, b) => a - b); // 换成 toSorted 之后……
console.log('    换成 toSorted 后直接读 queue2 →', JSON.stringify(queue2), '← 顺序没变，依赖它的后续代码就错了');
console.log('    正确改法是把返回值接住：queue2 = queue2.toSorted(...) —— 但那就得改成 let 了。');

console.log('--- 5. 手写一个 mini produce（Immer 式：可写草稿 + 变更记录） ---');

// 到这里，前面的写法有个共同的痛点：
//   展开语法 —— 写起来啰嗦、容易漏；
//   路径复制 —— 自己写 assocIn 还得手拼路径数组；
//   全量拷贝 —— 太贵。
// Immer 的思路很聪明：给你一个"看起来可写"的草稿（draft），你随便改；
// 它用 Proxy 记录下所有变更，最后在**出口处**按路径复制产出新对象。
// 于是开发者写的是可变风格（好写、好读），拿到的却是不可变结果（好比较、好回滚）。
//
// 本节的 mini 版只支持普通对象与数组，够用来看清原理。
// Proxy 的基础用法见 25_proxy_and_reflect/02_get_set_traps.js，这里只讲用得上的三个陷阱。

const DRAFT_STATE = Symbol('draftState'); // 代理身上的"内部账本"入口
const isDraftable = (v) =>
  v !== null && typeof v === 'object' && (Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype);
const isDraft = (v) => v !== null && typeof v === 'object' && v[DRAFT_STATE] !== undefined;
const draftStateOf = (v) => v[DRAFT_STATE];

// 创建草稿代理：每一层对象/数组都是"用到了才创建"的惰性子代理。
const createDraft = (base, counters) => {
  const local = new Map(); // 本层被写过的键 → 新值
  const deleted = new Set(); // 本层被 delete 掉的键
  const childCache = new Map(); // 键 → 子代理（同一个子对象只代理一次）

  // 判断"这层或它下面的任何一层被改过没有" —— 递归往上传播变更。
  const hasChanges = () => {
    if (local.size > 0 || deleted.size > 0) return true;
    for (const child of childCache.values()) {
      if (draftStateOf(child).hasChanges()) return true;
    }
    return false;
  };

  const state = { base, local, deleted, childCache, counters, hasChanges };

  const proxy = new Proxy(base, {
    // 读：优先读"改过的值"，其次才是原值；遇到对象/数组就换成子代理，实现"读时才代理"。
    get(target, key, receiver) {
      if (key === DRAFT_STATE) return state; // 内部账本，走这里取
      if (local.has(key)) return local.get(key);
      if (deleted.has(key)) return undefined;
      const value = Reflect.get(target, key, receiver);
      if (!isDraftable(value)) return value; // 基本类型/函数：原样返回
      if (!childCache.has(key)) childCache.set(key, createDraft(value, counters));
      return childCache.get(key);
    },
    // 写：**不写进原对象**，只记在账本上。这是"原数据永不被改"的关键。
    set(target, key, value) {
      local.set(key, value);
      deleted.delete(key);
      return true;
    },
    // 删：同样只记账。
    deleteProperty(target, key) {
      local.delete(key);
      deleted.add(key);
      return true;
    },
  });
  return proxy;
};

// 收官：把账本变成新对象。没改过的地方直接复用原引用（结构共享），改过的地方才复制。
const finalize = (state) => {
  if (!state.hasChanges()) return state.base; // ★ 一行都没改 → 原样返回，引用相等
  state.counters.copied++; // 复制一个节点
  const result = Array.isArray(state.base) ? state.base.slice() : { ...state.base };
  for (const [key, value] of state.local) {
    result[key] = isDraft(value) ? finalize(draftStateOf(value)) : value;
  }
  for (const key of state.deleted) delete result[key]; // 注意：数组上 delete 会留下空洞
  for (const [key, child] of state.childCache) {
    if (draftStateOf(child).hasChanges()) result[key] = finalize(draftStateOf(child));
  }
  return result;
};

// 对外只暴露 produce：接收原状态和一个"改草稿"的函数，返回新状态。
const produceStats = { copied: 0 };
const produce = (base, recipe) => {
  const counters = { copied: 0 };
  const draft = createDraft(base, counters);
  recipe(draft); // ← 这里写的是"可变风格"的代码
  const result = finalize(draftStateOf(draft));
  produceStats.copied = counters.copied;
  return result;
};

const state = {
  user: { name: 'Alice', settings: { theme: 'light', fontSize: 14 } },
  todos: [
    { id: 1, text: '写文档', done: false },
    { id: 2, text: '修 bug', done: true },
  ],
  cache: { hits: 0 },
};

// 用法：想怎么改就怎么改，改的是草稿，原状态毫发无损。
const nextState = produce(state, (draft) => {
  draft.user.settings.theme = 'dark'; // 深层赋值，不用写任何展开
  draft.todos.push({ id: 3, text: '发版本', done: false }); // 数组随便改
});
console.log('  用 produce 改深层字段 + push 一个待办：');
console.log('    新状态 theme        →', nextState.user.settings.theme);
console.log('    原状态 theme        →', state.user.settings.theme, '（原状态没被改）');
console.log('    新状态 todos 长度    →', nextState.todos.length, ' 原状态 →', state.todos.length);
console.log('    复制了几个节点      →', produceStats.copied, '（todos 数组 + settings + user + 根 = 4 个）');
console.log('  结构共享验证：');
console.log('    nextState.cache === state.cache（没碰过的分支）→', nextState.cache === state.cache, '← 引用完全复用');
console.log('    nextState.todos === state.todos →', nextState.todos === state.todos);
console.log('    nextState.user === state.user   →', nextState.user === state.user);

// Immer 有一个很重要的性质：什么都没改就返回原引用（不是"内容相等的新对象"）。
const untouched = produce(state, (draft) => {
  void draft.user.name; // 只读，不改
});
console.log('  只读不改时：produce 返回的 === 原状态？', untouched === state, '（返回原引用，下游可以直接跳过更新）');
console.log('  ★ 这个性质是 React 性能优化的关键：没变就是同一个对象，浅比较一秒判定。');

console.log('  ── 三种不可变更新的写法对比 ──');
console.log('    写法          可读性   复制节点数        代表');
console.log('    展开语法      差（层数=行数） 仅路径（手写，容易漏） 原生 JS');
console.log('    structuredClone  好    全部（O(n)）     原生 JS');
console.log('    produce/Immer 好（可变风格） 仅路径（自动、可靠）  Immer 库');
console.log('  ★ 注意：本文件手写的 mini produce 只用于讲原理，生产项目直接用 Immer。');
console.log('    真实 Immer 还要处理 Map/Set、循环引用、自动 freeze、patch 生成等，');
console.log('    而且它的实现同样基于结构共享 —— 你在这里看到的就是它的核心思路。');

console.log('--- 6. 因果链：不可变 → 引用相等 → 浅比较 → React / Redux ---');

// 为什么前端框架这么在乎"新旧对象是不是同一个引用"？
// 因为比较两棵大对象树是否"内容相同"很贵，而比较两个引用是否相同只要一次指针比较。
// 整条推理链是这样的：
//   ① 用不可变更新 → 变了就一定是个新引用，没变就一定是同一个引用；
//   ② 所以 Object.is(next, prev) 可以当作"变没变"的最快判据；
//   ③ 但顶层引用变了，不代表每个字段都变了 —— 逐层深比较又太贵；
//   ④ 于是折中成"浅比较"：只看第一层的每个字段引用是否相同；
//   ⑤ 结构共享保证了"改动会沿路径向上冒泡成新引用"，
//      所以浅比较在每个层级上都能正确发现变化，代价只有 O(字段数)。

const shallowEqual = (a, b) => {
  if (Object.is(a, b)) return true; // 引用相同 → 一定相等
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((k) => Object.is(a[k], b[k]));
};

console.log('  ① 引用相等是最快的判据：');
console.log('    Object.is(state, state) →', Object.is(state, state));
console.log('    Object.is({ a: 1 }, { a: 1 }) →', Object.is({ a: 1 }, { a: 1 }), '（内容相同但不是同一个对象）');

console.log('  ② 浅比较只看第一层：');
console.log('    shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }) →', shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), '（值相同即相等）');
console.log('    shallowEqual({ a: { x: 1 } }, { a: { x: 1 } }) →', shallowEqual({ a: { x: 1 } }, { a: { x: 1 } }),
  '（内层对象引用不同 → 判定为不等，哪怕内容一样）');

console.log('  ③ 正确的不可变更新，浅比较能正确发现变化：');
const s1 = { user: { name: 'Alice' }, todos: [1, 2], cache: { hits: 0 } };
const s2 = produce(s1, (d) => {
  d.user.name = 'Bob';
});
console.log('    shallowEqual(s1, s2) →', shallowEqual(s1, s2), '（user 换了新引用 → 判定为变了，该重渲染）');
console.log('    shallowEqual(s2.user, s1.user) →', shallowEqual(s2.user, s1.user), '（改动层也换了引用）');
console.log('    shallowEqual(s2.todos, s1.todos) →', shallowEqual(s2.todos, s1.todos), '（没碰的分支引用不变 → 跳过）');

console.log('  ④ 事故：只改了深层、没换引用 → 浅比较说"没变"（经典 Redux bug）：');
const bugS1 = { user: { name: 'Alice' }, todos: [1, 2] };
const bugS2 = { ...bugS1 }; // 浅拷贝根：user 仍是同一个对象
bugS2.user.name = 'Bob'; // 直接改共享的子对象
console.log('    bugS1.user.name →', bugS1.user.name, '← 原状态被改了（这是 bug 本身）');
console.log('    shallowEqual(bugS1, bugS2) →', shallowEqual(bugS1, bugS2), '← 而且浅比较完全没发现');
console.log('    ★ 一次错误操作同时造成两个后果：状态被污染，且框架不会重渲染。');
console.log('      修复方式正是本文件第 3、5 节讲的：改动必须沿路径复制出新引用。');
bugS1.user.name = 'Alice'; // 复原

console.log('  ⑤ 这套机制的落地位置：');
console.log('    · React.memo / PureComponent：props 浅比较，没变就跳过重渲染；');
console.log('    · useMemo / useEffect 的依赖数组：按引用比较决定要不要重算/重跑；');
console.log('    · Redux：reducer 必须返回新对象，React-Redux 用浅比较决定组件要不要更新；');
console.log('    · 状态库（Zustand / Jotai / Pinia）：同样依赖"引用变了 = 值变了"这条约定。');
console.log('    · 其他收益：时间旅行调试（每次变更都是一个完整快照）、');
console.log('      撤销/重做、并发渲染里安全地比较前后两个版本。');

console.log('--- 7. 实践建议 ---');

console.log('  1) 平面状态优先：能拍平就拍平，嵌套越浅，不可变更新的成本越低（也越好读）。');
console.log('  2) 一层改动用展开语法就够了：{ ...obj, key: value } 是最清晰的写法，别上库。');
console.log('  3) 深层嵌套 + 频繁更新：用 Immer 这类库（得到可写风格 + 结构共享）；');
console.log('     数据量极大且需要 O(log n) 的持久化结构（比如十万级列表频繁插入删除），');
console.log('     才考虑 Immutable.js / Mori。');
console.log('  4) 数组一律用 toSorted / toReversed / toSpliced / with，或在状态库里让 Immer 接管；');
console.log('     千万不要在 React state / Redux state 上直接调用 sort / reverse / splice。');
console.log('  5) 搞清楚 Object.is 与 === 的差别：Object.is 把 NaN 当相等、把 +0/-0 当不等，');
console.log('     浅比较通常用 Object.is（React 内部就是）。');
console.log('  6) 需要防止意外修改时用 Object.freeze 兜底，但要记住它只冻第一层。');

console.log('--- 8. 小结 ---');
console.log('  不可变更新的朴素写法（层层展开）容易漏、容易错；全量深拷贝安全但贵（O(n) 复制）。');
console.log('  结构共享只复制"从根到改动点"的路径，其余子树复用原引用 → 代价 O(路径长度)。');
console.log('  引用相等是"没变"的最快证据，也是 React / Redux 性能优化的地基。');
console.log('  数组用 ES2023 的 toSorted / toReversed / toSpliced / with，别再就地改（它们是浅拷贝）。');
console.log('  Immer 式 produce：可写草稿 + 变更记录 + 出口处路径复制；没改动时返回原引用。');
console.log('  因果链：不可变 → 新引用 → 引用相等/浅比较 → 框架能廉价地判断"要不要更新"。');
console.log('  也见：');
console.log('    40_functional_programming/05_point_free_and_pipeline.js —— 管道里传的都是不可变的值；');
console.log('    40_functional_programming/08_io_and_effects.js —— 状态进了容器，就更不能被就地改；');
console.log('    25_proxy_and_reflect/02_get_set_traps.js —— mini produce 用到的 Proxy 陷阱；');
console.log('    34_modern_es_features/03_es2023_features.js —— toSorted / with 等新方法；');
console.log('    GLOSSARY 的 Immutability / Structural Sharing / Shallow Copy 词条。');
console.log('  下一个话题（10_trampoline_and_recursion.js）：');
console.log('  函数式的另一块基石是递归（fold、树、JSON 都能用递归优雅地表达），');
console.log('  可 JavaScript 偏偏没有尾调用优化 —— 递归写深一点就直接爆栈。怎么破？');
