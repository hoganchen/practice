/**
 * ============================================================================
 * 知识点：二叉搜索树（BST）—— 性质、增删查、四种遍历与退化问题
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】进阶
 * 【前置知识】38_algorithms_and_data_structures/01_big_o_and_complexity.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    二叉搜索树（Binary Search Tree，BST）是一棵二叉树，并且对【每一个】节点都满足：
 *
 *        左子树里所有节点的值  <  根节点的值  <  右子树里所有节点的值
 *
 *          ASCII 示意（每个节点左边是左子树，全部更小；右边是右子树，全部更大）：
 *
 *                            50
 *                          /    \
 *                        30      70
 *                       /  \    /  \
 *                     20   40  60   80
 *
 *    这条性质带来一个极强的推论：每比较一次，就能【砍掉一半】的候选范围 ——
 *    这正是二分查找的思想，只不过换成了树的形状，因此插入删除也不用搬移数据。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 需要"有序 + 快速查找 + 频繁插入删除"三合一的时候。
 *      哈希表查得快但无序；有序数组能二分但插入是 O(n)；BST 三者兼顾。
 *    - 范围查询：找"年龄 18~30 的用户"、"价格 100~200 的商品"。
 *      哈希表对此完全无能为力（哈希值没有大小意义），BST 只要中序遍历就能取出区间。
 *    - 找前驱/后继："比 100 大的最小价格是多少"。
 *    - 数据库索引的 B 树 / B+ 树、文件系统的目录树、编译器的语法树都是 BST 的变体。
 *    - JS 里没有内置的 BST，但 Map / Set 的底层在某些引擎里也用了树结构。
 *
 * 3. 核心语法要点 / 算法思想
 *    · 查找：从根开始，比当前节点小就往左走，大就往右走，相等就命中。
 *    · 插入：按查找的路径走到一个空位，把新节点挂上去。
 *    · 删除最麻烦，分三种情况（详见第 6 节）：
 *        ① 叶子节点 → 直接删掉；
 *        ② 只有一个孩子 → 用孩子顶替自己的位置；
 *        ③ 有两个孩子 → 找到【中序后继】（右子树里的最小值）来顶替自己，
 *           然后递归删除那个后继。
 *    · 四种遍历：
 *        前序 preorder  根 → 左 → 右    用于复制树、序列化
 *        中序 inorder   左 → 根 → 右    ★ 结果是【升序】，BST 最重要的性质
 *        后序 postorder 左 → 右 → 根    用于释放内存、计算子树聚合值
 *        层序 level     一层一层来（要用队列，属于广度优先，不是深度优先）
 *    · 树的"高度"h 决定了所有操作的代价：
 *        理想（平衡）时 h ≈ log₂n，操作 O(log n)；
 *        最坏（退化成链）时 h = n，操作 O(n)。
 *
 * 4. 常见陷阱
 *    - 陷阱一：只检查"父节点和直接子节点"的大小关系。BST 要求的是
 *      【整棵子树】都满足约束，不能只比左右孩子。
 *    - 陷阱二：以为 BST 是"自动平衡"的。它完全不保证平衡！
 *      按升序插入 1,2,3,4,5 会得到一条链表，查找退化成 O(n)。见第 7 节。
 *    - 陷阱三：删除有两个孩子的节点时，直接删掉并把左孩子提上来 ——
 *      这会破坏 BST 性质，正确做法是找中序后继（或中序前驱）。
 *    - 陷阱四：递归实现遍历时忽略调用栈深度。
 *      退化的树有 n 层，递归 n 层会栈溢出。
 *    - 陷阱五：以为"中序遍历有序"就意味着可以直接二分查找。
 *      中序遍历是 O(n) 的（要把整棵树走一遍），不是 O(log n)。
 *    - 陷阱六：BST 里通常不允许重复值，或者约定"重复值放右边/用计数表示"。
 *      本示例的实现在遇到重复值时更新计数。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/05_binary_search_tree.js
 *
 * 【预期输出】
 *   打印 8 个小节：BST 性质图解、插入过程（每次打印树的形状）、
 *   查找路径、四种遍历及其用途、中序遍历得到有序序列、
 *   删除的三种情况逐一演示、有序插入导致的退化实测，以及复杂度对照表。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用工具
// ---------------------------------------------------------------------------

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function medianMs(fn, rounds = 3) {
  fn();
  const samples = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return median(samples);
}

const sink = { value: 0 };

/** 确定性伪随机（Lehmer），保证每次运行的测试数据一致 */
function makeRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return s;
  };
}

// ---------------------------------------------------------------------------
// 1. 节点与树的基本结构
// ---------------------------------------------------------------------------

class TreeNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.count = 1; // 处理重复值：相同的值不新建节点，只把计数 +1
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
    this.size = 0; // 不同值的个数
  }

  // -------------------------------------------------------------------------
  // 插入
  // -------------------------------------------------------------------------

  /**
   * 插入一个值。平均 O(log n)，最坏 O(n)（树退化成链时）。
   *
   * 迭代写法：从根开始，小就走左、大就走右，直到遇到空位挂上去。
   * 之所以用迭代而不是递归，是为了避免退化树带来的深递归。
   */
  insert(value) {
    const newNode = new TreeNode(value);
    if (this.root === null) {
      this.root = newNode;
      this.size += 1;
      return { created: true, path: ['(空树)'] };
    }
    const path = [];
    let cur = this.root;
    while (true) {
      path.push(cur.value);
      if (value === cur.value) {
        cur.count += 1; // 重复值：只增加计数
        return { created: false, path };
      }
      if (value < cur.value) {
        if (cur.left === null) {
          cur.left = newNode;
          this.size += 1;
          return { created: true, path };
        }
        cur = cur.left;
      } else {
        if (cur.right === null) {
          cur.right = newNode;
          this.size += 1;
          return { created: true, path };
        }
        cur = cur.right;
      }
    }
  }

  // -------------------------------------------------------------------------
  // 查找
  // -------------------------------------------------------------------------

  /**
   * 查找一个值，返回 { found, path, steps }。
   * path 记录经过的节点，用来直观展示"每比较一次就砍掉一半"。
   */
  search(value) {
    const path = [];
    let cur = this.root;
    while (cur !== null) {
      path.push(cur.value);
      if (value === cur.value) return { found: true, node: cur, path, steps: path.length };
      cur = value < cur.value ? cur.left : cur.right;
    }
    return { found: false, node: null, path, steps: path.length };
  }

  has(value) {
    return this.search(value).found;
  }

  /** 最小值：一路往左走到底 */
  min(node = this.root) {
    if (node === null) return null;
    let cur = node;
    while (cur.left !== null) cur = cur.left;
    return cur;
  }

  /** 最大值：一路往右走到底 */
  max(node = this.root) {
    if (node === null) return null;
    let cur = node;
    while (cur.right !== null) cur = cur.right;
    return cur;
  }

  /** 找"比 value 大的最小节点"（中序后继） */
  successor(value) {
    let cur = this.root;
    let candidate = null;
    while (cur !== null) {
      if (value < cur.value) {
        candidate = cur; // 当前节点比目标大，先记下，再试着找更小的
        cur = cur.left;
      } else {
        cur = cur.right;
      }
    }
    return candidate;
  }

  /** 找"比 value 小的最大节点"（中序前驱） */
  predecessor(value) {
    let cur = this.root;
    let candidate = null;
    while (cur !== null) {
      if (value > cur.value) {
        candidate = cur;
        cur = cur.right;
      } else {
        cur = cur.left;
      }
    }
    return candidate;
  }

  // -------------------------------------------------------------------------
  // 删除
  // -------------------------------------------------------------------------

  /**
   * 删除一个值。分三种情况（这是 BST 最需要想清楚的地方）：
   *
   *   ① 叶子节点（没有孩子）：直接摘掉，父节点的对应指针置 null。
   *
   *         删 20:      30                30
   *                    /  \      →       /  \
   *                   20   40           (空) 40
   *
   *   ② 只有一个孩子：用这个孩子【顶替】自己的位置（整棵子树一起挪上去）。
   *
   *         删 30:      50                50
   *                    /  \      →       /  \
   *                   30   70          20    70
   *                  /                  \
   *                 20                   (20 整棵子树顶上来)
   *
   *   ③ 有两个孩子：不能随便提一个上来！必须找一个"能维持大小关系"的节点。
   *      这个节点就是【中序后继】= 右子树里的最小值（也就是比它大的里面最小的那个）。
   *
   *         删 50:        50                   60
   *                     /    \      →        /    \
   *                   30      70            30      70
   *                  /  \    /  \          /  \    /  \
   *                 20  40  60   80       20  40  (空) 80
   *                         ↑
   *                    中序后继 = 60，把它搬到 50 的位置
   *
   *      为什么是中序后继？因为它比左子树所有节点都大、又比右子树其余节点都小，
   *      正好满足"左 < 它 < 右"的约束。
   *
   * 平均 O(log n)，最坏 O(n)。
   */
  delete(value) {
    const result = { deleted: false, case: null, replacement: null };
    this.root = this._deleteNode(this.root, value, result);
    if (result.deleted) this.size -= 1;
    return result;
  }

  _deleteNode(node, value, result) {
    if (node === null) return null;

    if (value < node.value) {
      node.left = this._deleteNode(node.left, value, result);
      return node;
    }
    if (value > node.value) {
      node.right = this._deleteNode(node.right, value, result);
      return node;
    }

    // 找到了要删的节点
    if (node.count > 1) {
      // 有重复值：只把计数减一，节点本身留着
      node.count -= 1;
      result.deleted = true;
      result.case = '重复值，计数减一';
      return node;
    }

    // 情况①：叶子节点
    if (node.left === null && node.right === null) {
      result.deleted = true;
      result.case = '① 叶子节点 → 直接摘掉';
      return null;
    }

    // 情况②：只有一个孩子 → 用孩子顶替
    if (node.left === null) {
      result.deleted = true;
      result.case = '② 只有右孩子 → 右孩子顶替';
      result.replacement = node.right.value;
      return node.right;
    }
    if (node.right === null) {
      result.deleted = true;
      result.case = '② 只有左孩子 → 左孩子顶替';
      result.replacement = node.left.value;
      return node.left;
    }

    // 情况③：有两个孩子 → 找右子树的最小值（中序后继）来顶替
    const succ = this.min(node.right);
    result.deleted = true;
    result.case = `③ 有两个孩子 → 用中序后继 ${succ.value} 顶替`;
    result.replacement = succ.value;
    node.value = succ.value; // 把后继的值搬上来
    node.count = succ.count;
    // 然后把右子树里那个"已经被搬走的"后继删掉。
    // 注意：后继是右子树里的最小值，它【一定没有左孩子】，所以这里的递归最多走到情况②。
    const dummy = { deleted: false, case: null, replacement: null };
    node.right = this._deleteNode(node.right, succ.value, dummy);
    return node;
  }

  // -------------------------------------------------------------------------
  // 遍历
  // -------------------------------------------------------------------------

  /** 前序：根 → 左 → 右。用途：复制整棵树、序列化（先写根才能重建） */
  preorder(node = this.root, out = []) {
    if (node === null) return out;
    out.push(node.value);
    this.preorder(node.left, out);
    this.preorder(node.right, out);
    return out;
  }

  /** 中序：左 → 根 → 右。★ 结果一定是升序 —— BST 最有价值的性质 */
  inorder(node = this.root, out = []) {
    if (node === null) return out;
    this.inorder(node.left, out);
    out.push(node.value);
    this.inorder(node.right, out);
    return out;
  }

  /** 后序：左 → 右 → 根。用途：释放节点、自底向上计算子树聚合值 */
  postorder(node = this.root, out = []) {
    if (node === null) return out;
    this.postorder(node.left, out);
    this.postorder(node.right, out);
    out.push(node.value);
    return out;
  }

  /**
   * 层序（广度优先）：一层一层从左到右。
   * 必须借助【队列】：出队一个节点，把它的左右孩子入队。
   * 时间 O(n)，空间 O(最宽一层的节点数)。
   */
  levelOrder() {
    if (this.root === null) return [];
    const out = [];
    const queue = [this.root];
    let head = 0; // 用下标模拟出队，避免 shift 的 O(n)
    while (head < queue.length) {
      const node = queue[head];
      head += 1;
      out.push(node.value);
      if (node.left !== null) queue.push(node.left);
      if (node.right !== null) queue.push(node.right);
    }
    return out;
  }

  /** 按层分组返回，便于打印成"每层有哪些节点" */
  levels() {
    if (this.root === null) return [];
    const result = [];
    let current = [this.root];
    while (current.length > 0) {
      result.push(current.map((n) => n.value));
      const next = [];
      for (const n of current) {
        if (n.left) next.push(n.left);
        if (n.right) next.push(n.right);
      }
      current = next;
    }
    return result;
  }

  /** 树的高度（节点数最多的一条路径上有多少个节点）。空树高度为 0 */
  height(node = this.root) {
    if (node === null) return 0;
    return 1 + Math.max(this.height(node.left), this.height(node.right));
  }

  /** 理想高度：n 个节点完全平衡时应该是 log2(n+1) 向上取整 */
  idealHeight() {
    return this.size === 0 ? 0 : Math.ceil(Math.log2(this.size + 1));
  }

  // -------------------------------------------------------------------------
  // 可视化
  // -------------------------------------------------------------------------

  /**
   * 括号表示法：一眼看清树的结构。
   * 例如 50(30(20,40),70(60,80)) —— 叶子节点不加括号。
   */
  toNotation(node = this.root) {
    if (node === null) return '';
    const label = node.count > 1 ? `${node.value}×${node.count}` : String(node.value);
    if (node.left === null && node.right === null) return label;
    return `${label}(${this.toNotation(node.left)},${this.toNotation(node.right)})`;
  }

  /**
   * 横向打印整棵树（把树顺时针旋转 90° 看）：
   * 每一行是一个节点，缩进越深表示层级越深；
   * 同一个缩进下，上面的是右子树、下面的是左子树。
   */
  render(node = this.root, depth = 0, lines = []) {
    if (node === null) return lines;
    this.render(node.right, depth + 1, lines);
    const label = node.count > 1 ? `${node.value}(×${node.count})` : String(node.value);
    lines.push('    '.repeat(depth) + label);
    this.render(node.left, depth + 1, lines);
    return lines;
  }

  renderText() {
    if (this.root === null) return '    (空树)';
    return this.render().map((l) => '    ' + l).join('\n');
  }
}

// ---------------------------------------------------------------------------
// 2. 插入：观察树是怎么长出来的
// ---------------------------------------------------------------------------

console.log('--- 1. BST 的性质：一个数字看清它 ---');
console.log('');
console.log('  每个节点都必须满足：左子树全部更小，右子树全部更大。');
console.log('  注意是"整棵子树"，不是"直接孩子"：');
console.log('');
console.log('        ┌── 下面这棵树【不是】合法的 BST ──┐');
console.log('                    50');
console.log('                   /  \\');
console.log('                 30    70');
console.log('                   \\');
console.log('                    60   ← 60 在 50 的左子树里，却比 50 大 ✗');
console.log('        └──────────────────────────────────┘');
console.log('  校验 BST 的正确做法不是只比父子，而是要带着"允许的取值范围"递归下去：');
console.log('    根节点范围是 (-∞, +∞)；');
console.log('    走到左孩子，上界收紧为父节点的值；走到右孩子，下界收紧为父节点的值。');
console.log('');

/** 用"区间约束"的方法校验一棵树是否是合法的 BST */
function isValidBST(node, low = -Infinity, high = Infinity) {
  if (node === null) return true;
  if (node.value <= low || node.value >= high) return false;
  return (
    isValidBST(node.left, low, node.value) &&
    isValidBST(node.right, node.value, high)
  );
}

// 手工造一棵非法 BST 来演示上面的校验
const badTree = new TreeNode(50);
badTree.left = new TreeNode(30);
badTree.right = new TreeNode(70);
badTree.left.right = new TreeNode(60); // 违反约束
console.log(`  校验上面那棵非法树：isValidBST = ${isValidBST(badTree)}  ← 正确识别出来了`);

console.log('\n--- 2. 插入：看树是怎么一层层长出来的 ---');

const bst = new BinarySearchTree();
console.log('');
console.log('【初始状态】' + (bst.root === null ? '空树' : bst.toNotation()));

const insertSeq = [50, 30, 70, 20, 40, 60, 80];
for (const v of insertSeq) {
  console.log('');
  console.log(`【insert(${v})】`);
  console.log('  操作前：' + bst.toNotation() + `   (size=${bst.size}, 高度=${bst.height()})`);
  const r = bst.insert(v);
  console.log('  操作后：' + bst.toNotation() + `   (size=${bst.size}, 高度=${bst.height()})`);
  console.log(
    `  比较路径：${r.path.join(' → ')} → 落位` +
      `（走错 ${r.path.length} 次比较，最后挂在 ${r.path[r.path.length - 1]} 的${v < r.path[r.path.length - 1] ? '左' : '右'}边）`,
  );
}

console.log('');
console.log('【插入完成后的完整树形】');
console.log(bst.renderText());
console.log('');
console.log('  读法：缩进越深层级越深；同一缩进下，上面是右子树、下面是左子树。');

console.log('');
console.log('【insert(50)】插入一个已存在的值');
console.log('  操作前：' + bst.toNotation() + `   (size=${bst.size})`);
const dup = bst.insert(50);
console.log('  操作后：' + bst.toNotation() + `   (size=${bst.size})`);
console.log(`  created=${dup.created} → 没有新建节点，只是把 50 的计数加到了 ${bst.search(50).node.count}`);
console.log('  重复值的处理策略由实现决定：可以计数、可以忽略、也可以约定放到右边。');

// ---------------------------------------------------------------------------
// 3. 查找：路径与步数
// ---------------------------------------------------------------------------

console.log('\n--- 3. 查找：每比较一次就砍掉一半 ---');

console.log('');
console.log('当前树：' + bst.toNotation());
console.log('');
console.log('目标'.padEnd(10) + '结果'.padEnd(10) + '比较次数'.padEnd(12) + '比较路径');
console.log('-'.repeat(76));
for (const target of [50, 20, 80, 60, 45, 100, 10]) {
  const r = bst.search(target);
  console.log(
    String(target).padEnd(10) +
      (r.found ? '找到 ✓' : '未找到 ✗').padEnd(12) +
      String(r.steps).padEnd(14) +
      r.path.join(' → ') + (r.found ? '' : ' → null'),
  );
}
console.log('');
console.log(`这棵树有 ${bst.size} 个节点，高度是 ${bst.height()}。`);
console.log(`理想情况下高度应该是 ⌈log₂(${bst.size}+1)⌉ = ${bst.idealHeight()}，说明它目前是平衡的。`);
console.log('所以最多比较 3 次就能确定一个值在不在 —— 这就是 O(log n) 的直观体现。');

console.log('');
console.log('【找最小值 / 最大值】一路走到底就行');
console.log(`  min() = ${bst.min().value}  （从根一路往左走：50 → 30 → 20）`);
console.log(`  max() = ${bst.max().value}  （从根一路往右走：50 → 70 → 80）`);

console.log('');
console.log('【找中序后继 / 前驱】"比 x 大的最小节点" / "比 x 小的最大节点"');
console.log(`  successor(40)  = ${bst.successor(40).value}   （40 右边没有子树，往上找第一个"比 40 大的祖先"）`);
console.log(`  successor(50)  = ${bst.successor(50).value}   （就是右子树里的最小值）`);
console.log(`  predecessor(60) = ${bst.predecessor(60).value} （就是左子树里的最大值）`);
console.log('  这个操作是"范围查询"和"排行榜取相邻名次"的基础，时间复杂度 O(h)。');

// ---------------------------------------------------------------------------
// 4. 四种遍历
// ---------------------------------------------------------------------------

console.log('\n--- 4. 四种遍历：顺序不同，用途完全不同 ---');

console.log('');
console.log('当前树：' + bst.toNotation());
console.log('');
console.log('  前序 preorder （根→左→右）: ' + bst.preorder().join(', '));
console.log('  中序 inorder  （左→根→右）: ' + bst.inorder().join(', ') + '   ★ 升序！');
console.log('  后序 postorder（左→右→根）: ' + bst.postorder().join(', '));
console.log('  层序 level    （一层一层） : ' + bst.levelOrder().join(', '));

console.log('');
console.log('【层序的分层视图】');
const lv = bst.levels();
lv.forEach((nodes, i) => {
  console.log(`    第 ${i} 层（共 ${nodes.length} 个）: ${nodes.join(', ')}`);
});

console.log('');
console.log('每种遍历是怎么走的？以这棵树为例，把递归过程展开：');
console.log('');
console.log('        inorder(50)');
console.log('          ├─ inorder(30)');
console.log('          │    ├─ inorder(20) → 20 没有孩子，输出 20');
console.log('          │    ├─ 输出 30');
console.log('          │    └─ inorder(40) → 输出 40');
console.log('          ├─ 输出 50');
console.log('          └─ inorder(70)');
console.log('               ├─ inorder(60) → 输出 60');
console.log('               ├─ 输出 70');
console.log('               └─ inorder(80) → 输出 80');
console.log('');
console.log('  得到：20, 30, 40, 50, 60, 70, 80 —— 天然升序。');
console.log('  原因很简单：中序规定"先输出整个左子树（都更小），再输出自己，');
console.log('  最后输出整个右子树（都更大）"，这个顺序本身就是从小到大的。');

console.log('');
console.log('四种遍历的复杂度与用途：');
console.log('');
console.log('遍历'.padEnd(16) + '顺序'.padEnd(18) + '时间复杂度'.padEnd(14) + '空间复杂度'.padEnd(16) + '典型用途');
console.log('-'.repeat(100));
for (const [name, order, time, space, use] of [
  ['前序 preorder', '根 → 左 → 右', 'O(n)', 'O(h) 递归栈', '复制整棵树、序列化（先写根才能重建）'],
  ['中序 inorder', '左 → 根 → 右', 'O(n)', 'O(h) 递归栈', '得到升序序列、校验 BST、范围查询'],
  ['后序 postorder', '左 → 右 → 根', 'O(n)', 'O(h) 递归栈', '释放节点、自底向上算子树聚合值（如子树和）'],
  ['层序 level', '一层一层', 'O(n)', 'O(w) 队列', '求树高/宽度、找最短路径、按层渲染 UI'],
]) {
  console.log(name.padEnd(16) + order.padEnd(20) + time.padEnd(14) + space.padEnd(16) + use);
}
console.log('');
console.log('  注：h 是树高，w 是最宽一层的节点数。平衡时 h ≈ log n，退化成链时 h = n。');

// ---------------------------------------------------------------------------
// 5. 中序遍历 = 有序序列
// ---------------------------------------------------------------------------

console.log('\n--- 5. 中序遍历得到有序序列（BST 最有价值的性质）---');

console.log('');
console.log('推论：如果中序遍历的结果不是升序，那这棵树就不是合法的 BST。');
console.log('这也是【校验 BST】最直观的方法（但注意它要 O(n) 时间，见下面第 6 节说明）。');

// 用插入顺序打乱的一批数据建树，验证中序仍然有序
const rand = makeRandom(20240916);
const shuffledVals = [];
for (let i = 1; i <= 20; i++) shuffledVals.push(i);
for (let i = shuffledVals.length - 1; i > 0; i--) {
  const j = rand() % (i + 1);
  [shuffledVals[i], shuffledVals[j]] = [shuffledVals[j], shuffledVals[i]];
}
const bst2 = new BinarySearchTree();
for (const v of shuffledVals) bst2.insert(v);

console.log('');
console.log(`  随机打乱后的插入顺序：${shuffledVals.join(', ')}`);
console.log(`  中序遍历结果：        ${bst2.inorder().join(', ')}`);
const sorted = bst2.inorder();
let isSorted = true;
for (let i = 1; i < sorted.length; i++) if (sorted[i - 1] > sorted[i]) isSorted = false;
console.log(`  是否升序：${isSorted}  ← 无论按什么顺序插入，中序永远是升序`);
console.log(`  这棵随机插入的树高 = ${bst2.height()}，理想高度 = ${bst2.idealHeight()}（接近，说明随机插入比较平衡）`);

console.log('');
console.log('【用 BST 做范围查询】找出 [5, 12] 之间的所有值');
const inRange = [];
(function collectRange(node, lo, hi) {
  if (node === null) return;
  if (node.value > lo) collectRange(node.left, lo, hi); // 只有左边可能有更小的
  if (node.value >= lo && node.value <= hi) inRange.push(node.value);
  if (node.value < hi) collectRange(node.right, lo, hi); // 只有右边可能有更大的
})(bst2.root, 5, 12);
console.log(`  区间 [5, 12] 内的值：${inRange.join(', ')}`);
console.log('  注意：剪枝掉了大量不可能的分支，所以在 BST 上做范围查询非常高效。');
console.log('  换成哈希表就完全做不到 —— 哈希值的大小没有任何意义。');

// ---------------------------------------------------------------------------
// 6. 删除的三种情况
// ---------------------------------------------------------------------------

console.log('\n--- 6. 删除：BST 最需要想清楚的操作 ---');

console.log('');
console.log('三种情况回顾：');
console.log('  ① 叶子节点        → 直接摘掉');
console.log('  ② 只有一个孩子    → 让孩子顶替自己的位置');
console.log('  ③ 有两个孩子      → 找中序后继（右子树最小值）顶替，再删掉那个后继');

// 情况① 叶子
console.log('');
console.log('════ 情况①：删除叶子节点 20 ════');
const t1 = new BinarySearchTree();
for (const v of [50, 30, 70, 20, 40, 60, 80]) t1.insert(v);
console.log('  操作前：' + t1.toNotation());
console.log(t1.renderText());
const d1 = t1.delete(20);
console.log('  操作后：' + t1.toNotation() + `   (size=${t1.size}, 高度=${t1.height()})`);
console.log(`  删除方式：${d1.case}`);
console.log('  30 的左指针变成了 null，其它节点一个都没动。');

// 情况② 一个孩子
console.log('');
console.log('════ 情况②：删除只有一个孩子的节点 30 ════');
const t2 = new BinarySearchTree();
for (const v of [50, 30, 70, 20, 60, 80]) t2.insert(v); // 30 只有左孩子 20
console.log('  操作前：' + t2.toNotation());
console.log(t2.renderText());
const d2 = t2.delete(30);
console.log('  操作后：' + t2.toNotation() + `   (size=${t2.size}, 高度=${t2.height()})`);
console.log(`  删除方式：${d2.case}`);
console.log('  20 连同它的整棵子树一起"提"上来，直接接到 50 的左边。');
console.log('  为什么合法？因为 20 < 50，而 20 的子树本来就都小于 30、更小于 50。');

// 情况③ 两个孩子
console.log('');
console.log('════ 情况③：删除有两个孩子的节点 50（根节点）════');
const t3 = new BinarySearchTree();
for (const v of [50, 30, 70, 20, 40, 60, 80]) t3.insert(v);
console.log('  操作前：' + t3.toNotation());
console.log(t3.renderText());
const succNode = t3.min(t3.root.right);
console.log(`  右子树是 ${t3.toNotation(t3.root.right)}，其中的最小值（中序后继）= ${succNode.value}`);
const d3 = t3.delete(50);
console.log('  操作后：' + t3.toNotation() + `   (size=${t3.size}, 高度=${t3.height()})`);
console.log(`  删除方式：${d3.case}`);
console.log(t3.renderText());
console.log('  步骤拆解：');
console.log('    ① 找到中序后继 60（右子树里的最小值）；');
console.log('    ② 把 60 的值【复制】到 50 所在的节点上（节点对象不换，只换值）；');
console.log('    ③ 转到右子树里，把原来的 60 删掉。');
console.log('       因为 60 是右子树的最小值，它【一定没有左孩子】，');
console.log('       所以第 ③ 步最多只会走到"情况②"，不会无限递归。');

console.log('');
console.log('【三种删除的结果对比】用同一批数据分别删 20、30、50');
console.log('');
console.log('删除目标'.padEnd(14) + '情况'.padEnd(10) + '删除前的树'.padEnd(40) + '删除后的树');
console.log('-'.repeat(110));
for (const [target, setup] of [
  [20, [50, 30, 70, 20, 40, 60, 80]],
  [30, [50, 30, 70, 20, 60, 80]],
  [50, [50, 30, 70, 20, 40, 60, 80]],
]) {
  const t = new BinarySearchTree();
  for (const v of setup) t.insert(v);
  const before = t.toNotation();
  const r = t.delete(target);
  console.log(
    String(target).padEnd(14) + r.case.slice(0, 1).padEnd(10) + before.padEnd(40) + t.toNotation(),
  );
}

console.log('');
console.log('【删除不存在的值】');
const t4 = new BinarySearchTree();
for (const v of [50, 30, 70]) t4.insert(v);
console.log('  操作前：' + t4.toNotation());
const d4 = t4.delete(999);
console.log('  操作后：' + t4.toNotation() + `   deleted=${d4.deleted}，树没有变化`);

// ---------------------------------------------------------------------------
// 7. 退化问题：有序插入会长成一条链
// ---------------------------------------------------------------------------

console.log('\n--- 7. 致命问题：BST 不会自动平衡 ---');
console.log('');
console.log('如果按【升序】（或降序）插入数据，每个新值都会挂到当前最右下角，');
console.log('于是树退化成一条单链 —— 它变成了链表，查找退化成 O(n)。');
console.log('');
console.log('  依次插入 1, 2, 3, 4, 5, 6, 7 之后：');
console.log('');
console.log('    1');
console.log('     \\');
console.log('      2          ← 每一个节点都只有一个右孩子');
console.log('       \\');
console.log('        3        查找 7 需要比较 7 次，和线性查找一样');
console.log('         \\');
console.log('          4      树高 = 7（等于节点数），理想高度应该是 3');
console.log('           \\');
console.log('            5');
console.log('             \\');
console.log('              6');
console.log('               \\');
console.log('                7');
console.log('');

/** 用升序数据建一棵 BST */
function buildOrdered(n) {
  const t = new BinarySearchTree();
  for (let i = 1; i <= n; i++) t.insert(i);
  return t;
}

/** 用随机数据建一棵 BST */
function buildRandom(n, seed = 20240916) {
  const r = makeRandom(seed);
  const vals = [];
  for (let i = 1; i <= n; i++) vals.push(i);
  for (let i = vals.length - 1; i > 0; i--) {
    const j = r() % (i + 1);
    [vals[i], vals[j]] = [vals[j], vals[i]];
  }
  const t = new BinarySearchTree();
  for (const v of vals) t.insert(v);
  return t;
}

console.log('实测对比：同样的数据量，有序插入 vs 随机插入');
console.log('');
console.log('n'.padEnd(8) + '有序插入高度'.padEnd(16) + '随机插入高度'.padEnd(16) + '理想高度'.padEnd(12) + '有序/理想 倍数');
console.log('-'.repeat(72));
for (const n of [15, 127, 1023, 8191]) {
  const ordered = buildOrdered(n);
  const random = buildRandom(n);
  console.log(
    String(n).padEnd(8) +
      String(ordered.height()).padEnd(16) +
      String(random.height()).padEnd(16) +
      String(ordered.idealHeight()).padEnd(12) +
      `${(ordered.height() / ordered.idealHeight()).toFixed(1)}x`,
  );
}
console.log('');
console.log('结论非常刺眼：');
console.log('  · 有序插入的树高 = n，完全退化成链表；');
console.log('  · 随机插入的树高只有几十，和理想高度 log₂n 是同一量级');
console.log('    （随机 BST 的期望高度约为 4.31·ln n ≈ 3·log₂n，这就是"随机性带来的平衡"）；');
console.log('  · n=8191 时，8191 / 31 ≈ 264 —— 两者高度差了 260 多倍，');
console.log('    查找次数的差距就是这么大。');

// 实测查找耗时
const DEG_N = 4000;
const orderedTree = buildOrdered(DEG_N);
const randomTree = buildRandom(DEG_N);
const PROBES = 2000;

// 构造查询目标（一半在树里、一半不在）
const probeRand = makeRandom(777);
const orderedProbes = [];
for (let i = 0; i < PROBES; i++) {
  const v = (probeRand() % DEG_N) + 1;
  orderedProbes.push(i % 2 === 0 ? v : v + DEG_N);
}

const orderedSearchMs = medianMs(() => {
  let steps = 0;
  for (const v of orderedProbes) steps += orderedTree.search(v).steps;
  sink.value = steps;
});

const randomSearchMs = medianMs(() => {
  let steps = 0;
  for (const v of orderedProbes) steps += randomTree.search(v).steps;
  sink.value = steps;
});

// 统计平均比较次数，这个数字比耗时更能说明问题
let orderedSteps = 0;
for (const v of orderedProbes) orderedSteps += orderedTree.search(v).steps;
let randomSteps = 0;
for (const v of orderedProbes) randomSteps += randomTree.search(v).steps;

console.log('');
console.log(`实测查找（n=${DEG_N}，查询 ${PROBES} 次）：`);
console.log('');
console.log('树'.padEnd(22) + '高度'.padEnd(10) + '平均比较次数'.padEnd(16) + '耗时(ms)');
console.log('-'.repeat(70));
console.log(
  '有序插入（退化成链）'.padEnd(20) +
    String(orderedTree.height()).padEnd(10) +
    (orderedSteps / PROBES).toFixed(1).padEnd(16) +
    orderedSearchMs.toFixed(4),
);
console.log(
  '随机插入（接近平衡）'.padEnd(20) +
    String(randomTree.height()).padEnd(10) +
    (randomSteps / PROBES).toFixed(1).padEnd(16) +
    randomSearchMs.toFixed(4),
);
console.log('');
console.log(`平均比较次数相差约 ${(orderedSteps / randomSteps).toFixed(1)} 倍，耗时相差约 ${(orderedSearchMs / randomSearchMs).toFixed(1)} 倍。`);
console.log('这就是"平衡"二字值钱的地方：同样是 BST，退化后性能和链表没有区别。');

console.log('');
console.log('现实中的解决方案：使用【自平衡】的变体');
console.log('');
console.log('结构'.padEnd(22) + '平衡策略'.padEnd(40) + '保证的树高');
console.log('-'.repeat(90));
for (const [name, strategy, h] of [
  ['AVL 树', '每次插入删除后检查左右子树高度差，超过 1 就旋转', '≤ 1.44 log₂n'],
  ['红黑树', '用颜色标记 + 旋转，平衡要求比 AVL 宽松，插入删除更快', '≤ 2 log₂(n+1)'],
  ['B 树 / B+ 树', '一个节点存多个键（让树变矮变胖，减少磁盘 I/O）', '≈ log_m n'],
  ['Treap / 跳表', '引入随机性来维持平衡的期望', '期望 O(log n)'],
]) {
  console.log(name.padEnd(22) + strategy.padEnd(42) + h);
}
console.log('');
console.log('  · Java 的 TreeMap/TreeSet 用红黑树；C++ 的 std::map 用红黑树；');
console.log('  · 数据库索引基本都用 B+ 树（因为磁盘按块读取，树越矮越省 I/O）；');
console.log('  · Redis 的 zset 用跳表；');
console.log('  · 它们的共同点：都是用额外的一点维护成本，换取"树高一定是 O(log n)"的保证。');

// ---------------------------------------------------------------------------
// 8. 复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 8. 复杂度对照表 ---');

console.log('操作'.padEnd(26) + '平均'.padEnd(16) + '最坏'.padEnd(14) + '说明');
console.log('-'.repeat(96));
for (const [op, avg, worst, note] of [
  ['BST 查找 search', 'O(log n)', 'O(n)', '最坏是退化成链的情况'],
  ['BST 插入 insert', 'O(log n)', 'O(n)', '先查找位置，再改两个指针'],
  ['BST 删除 delete', 'O(log n)', 'O(n)', '两个孩子的情况要找中序后继'],
  ['BST 找最小/最大', 'O(log n)', 'O(n)', '一路向左/向右走到底'],
  ['BST 找前驱/后继', 'O(log n)', 'O(n)', '不依赖父指针也能做到 O(h)'],
  ['BST 中序遍历', 'O(n)', 'O(n)', '每个节点恰好访问一次，结果是升序'],
  ['BST 层序遍历', 'O(n)', 'O(n)', '空间是 O(最宽一层节点数)'],
  ['BST 范围查询', 'O(log n + k)', 'O(n)', 'k 是落在区间里的元素个数'],
  ['平衡树（AVL/红黑）', 'O(log n)', 'O(log n)', '"最坏也是 log n"——这才是生产可用的保证'],
  ['哈希表 查找', 'O(1)', 'O(n)', '平均更快，但无序、不支持范围查询'],
  ['有序数组 二分查找', 'O(log n)', 'O(log n)', '查询快，但插入删除是 O(n)'],
]) {
  console.log(op.padEnd(24) + avg.padEnd(16) + worst.padEnd(14) + note);
}

console.log('');
console.log('BST vs 哈希表 vs 有序数组：怎么选？');
console.log('');
console.log('需求'.padEnd(30) + '哈希表'.padEnd(14) + '有序数组'.padEnd(14) + 'BST');
console.log('-'.repeat(76));
for (const [need, hash, arr, tree] of [
  ['等值查找（是否存在）', '✓ O(1) 最快', '✓ O(log n)', '✓ O(log n)'],
  ['范围查询 [a, b]', '✗ 做不到', '✓ O(log n + k)', '✓ O(log n + k)'],
  ['有序遍历', '✗ 无序', '✓ 天然有序', '✓ 中序即有序'],
  ['插入 / 删除', '✓ O(1) 均摊', '✗ O(n) 要搬移', '✓ O(log n)（平衡树）'],
  ['找前驱 / 后继', '✗ 做不到', '✓ O(log n)', '✓ O(log n)'],
  ['内存开销', '中（有桶和指针）', '最小（紧凑）', '大（每个节点两个指针）'],
  ['实现复杂度', '低（用内置 Map）', '低', '高（自己写容易出 bug）'],
]) {
  console.log(need.padEnd(28) + hash.padEnd(14) + arr.padEnd(14) + tree);
}

console.log('');
console.log('一句话总结：');
console.log('  需要"有序 + 动态增删 + 范围查询"→ 用平衡树（生产环境别自己写 BST，用库）；');
console.log('  只需要"存不存在、等值查找"     → 用哈希表 / Map；');
console.log('  数据是静态的、只查不改           → 排序数组 + 二分查找最划算；');
console.log('  学 BST 的意义在于理解"用结构维持有序性"这个思想，');
console.log('  以及为什么工业界的树都要加自平衡机制。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
