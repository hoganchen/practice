/**
 * ============================================================================
 * 知识点：链表 —— 单向链表、双向链表，以及和数组的取舍
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】入门
 * 【前置知识】38_algorithms_and_data_structures/01_big_o_and_complexity.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    链表（linked list）是由一组【节点】串起来的线性结构。
 *    每个节点存两样东西：自己的值，以及"下一个节点在哪里"的引用（指针）。
 *    最后一个节点的 next 是 null，表示链到头了。
 *
 *    · 单向链表（singly linked list）：每个节点只有 next，只能从头往尾走；
 *    · 双向链表（doubly linked list）：每个节点同时有 next 和 prev，
 *      可以两头走，代价是每个节点多存一个指针。
 *
 * 2. 为什么需要（真实项目场景）
 *    - LRU 缓存：浏览器的缓存、Redis 的淘汰策略、HTTP 中间件的缓存，
 *      核心都是"哈希表 + 双向链表"，靠链表实现 O(1) 的淘汰与移动。
 *    - 函数调用栈 / 撤销重做栈：本质是链表式的后进先出结构。
 *    - 大文件数据流处理：事先不知道有多少条数据，无法一次性开数组；
 *      链表可以边读边接，天然支持"流式追加"。
 *    - React 的 Fiber 树、虚拟 DOM 的兄弟节点串联，用的就是链表思想
 *      （可以在遍历中途暂停、恢复，因为它不依赖连续内存）。
 *    - 队列 / 双端队列 / 哈希表的桶（拉链法），底层都常用链表。
 *
 * 3. 核心语法要点 / 算法思想
 *    · 链表的"访问"必须从头一个一个走 —— 这叫【顺序访问】；
 *    · 数组按下标一步到位 —— 这叫【随机访问】；
 *    · 链表插入/删除只需要改几个指针，不需要搬移其它元素；
 *    · 数组插入/删除要把后面所有元素往后挪或往前挪。
 *
 *    一句话记法：
 *      「数组擅长读，链表擅长改（改的代价与数据量无关，只与"你有没有那个节点"有关）」
 *
 * 4. 常见陷阱
 *    - 陷阱一：丢链。改指针的顺序反了，后面的节点就再也找不到了
 *      （比如反转链表时必须先用 tmp 存住 next）。
 *    - 陷阱二：头节点特判。插入/删除头节点时没有前置节点，
 *      要么单独写一段逻辑，要么用【哨兵节点 dummy】统一处理。
 *    - 陷阱三：忘记维护 size / tail。prepend 到空链表时 tail 也要更新，
 *      否则 append 就接错地方了。
 *    - 陷阱四：以为"链表插入是 O(1)"就无脑用链表。
 *      如果还要先 find 找到位置，那整体还是 O(n)；
 *      数组虽然插入是 O(n)，但常数极小、内存连续、缓存友好，
 *      在中小规模下实测往往【比链表更快】。
 *    - 陷阱五：内存开销。每个节点都是一个独立对象，V8 需要额外的对象头和指针，
 *      同样是 1 万个数字，链表的实际内存占用比数组大好几倍。
 *    - 陷阱六：无法用下标访问、无法二分查找、无法用缓存友好的批量操作
 *      （map/filter/reduce 都要重新遍历成数组）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/02_linked_list.js
 *
 * 【预期输出】
 *   打印 8 个小节：内存布局图解、单向链表完整实现与逐操作状态演示、
 *   链表反转（迭代 + 递归）、双向链表的 O(1) 删除、链表 vs 数组取舍表、
 *   用双向链表 + 哈希表实现 LRU 缓存、以及随机访问/头部插入的实测对比。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用计时工具
// ---------------------------------------------------------------------------

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function medianMs(fn, rounds = 3) {
  fn(); // 预热
  const samples = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return median(samples);
}

const sink = { value: 0 };

// ---------------------------------------------------------------------------
// 1. 内存布局：数组 vs 链表（这是理解一切差异的根源）
// ---------------------------------------------------------------------------

console.log('--- 1. 内存布局图解：一切的差异都来自这里 ---');
console.log('');
console.log('数组 [10, 20, 30, 40]：一整块【连续】内存，长度固定可见');
console.log('');
console.log('   索引:    [0]     [1]     [2]     [3]');
console.log('          +-------+-------+-------+-------+');
console.log('   内存:  |  10   |  20   |  30   |  40   |     ← 连续排列，地址 = 起始地址 + 索引 × 元素大小');
console.log('          +-------+-------+-------+-------+');
console.log('            ↑ 想取 arr[2]？一次乘加运算就定位到，O(1) 随机访问');
console.log('');
console.log('链表 10 -> 20 -> 30 -> 40：节点散落在内存各处，靠引用串起来');
console.log('');
console.log('   head');
console.log('    ↓');
console.log('   +------+------+     +------+------+     +------+------+     +------+------+');
console.log('   | 10   | next-|---->| 20   | next-|---->| 30   | next-|---->| 40   | null |');
console.log('   +------+------+     +------+------+     +------+------+     +------+------+');
console.log('   地址 0x1a         地址 0x7f         地址 0x2c         地址 0xa3');
console.log('                     ↑ 想取第 3 个？必须从 head 开始跳 3 次，O(n) 顺序访问');
console.log('');
console.log('由此推出三条铁律：');
console.log('  1. 数组按下标访问 O(1)，链表按下标访问 O(n)；');
console.log('  2. 链表改指针就能插入/删除，数组必须搬移后续元素；');
console.log('  3. 数组连续内存对 CPU 缓存友好（一次载入缓存行能命中相邻好几个元素），');
console.log('     链表每个节点都可能 cache miss —— 这让链表在实测中往往比理论更慢。');

// ---------------------------------------------------------------------------
// 2. 单向链表的完整实现
// ---------------------------------------------------------------------------

/** 链表节点：值 + 指向下一个节点的引用 */
class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

/**
 * 单向链表
 *
 * 内部状态：head（头）、tail（尾）、size（长度）
 * 维护 tail 的好处：append 从 O(n) 降到 O(1)。
 */
class SinglyLinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  /** 尾部追加 O(1)（因为维护了 tail 指针） */
  append(value) {
    const node = new Node(value);
    if (this.head === null) {
      // 空链表：头和尾是同一个节点
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node; // 别忘记更新 tail，否则下次 append 会接到旧尾巴上
    }
    this.size += 1;
    return this;
  }

  /** 头部插入 O(1) */
  prepend(value) {
    const node = new Node(value);
    node.next = this.head;
    this.head = node;
    if (this.tail === null) this.tail = node; // 插入前是空链表，尾也要指向它
    this.size += 1;
    return this;
  }

  /** 按下标读取 O(n)：必须从头一步步走过去 */
  get(index) {
    if (index < 0 || index >= this.size) return undefined;
    let cur = this.head;
    for (let i = 0; i < index; i++) cur = cur.next;
    return cur.value;
  }

  /**
   * 在下标 index 处插入 O(n)（查找位置 O(n) + 改指针 O(1)）。
   * 链表插入的 O(1) 说的是"已经拿到那个位置的节点时"，
   * 如果要按下标找位置，整体仍然是 O(n)。
   */
  insert(index, value) {
    if (index < 0 || index > this.size) throw new RangeError(`下标越界：${index}`);
    if (index === 0) return this.prepend(value);
    if (index === this.size) return this.append(value);

    let prev = this.head;
    for (let i = 0; i < index - 1; i++) prev = prev.next;
    const node = new Node(value);
    node.next = prev.next; // 顺序很重要：先接上后半个链
    prev.next = node; // 再断开前半个链，两步顺序反了就会丢链
    this.size += 1;
    return this;
  }

  /** 按下标删除 O(n)，返回被删的值 */
  removeAt(index) {
    if (index < 0 || index >= this.size) return undefined;
    let removed;
    if (index === 0) {
      removed = this.head;
      this.head = this.head.next;
      if (this.head === null) this.tail = null; // 删空了，tail 也要清
    } else {
      let prev = this.head;
      for (let i = 0; i < index - 1; i++) prev = prev.next;
      removed = prev.next;
      prev.next = removed.next;
      if (removed === this.tail) this.tail = prev; // 删的是尾巴，tail 要回退
    }
    removed.next = null; // 断开引用，帮助 GC
    this.size -= 1;
    return removed.value;
  }

  /** 按值查找，返回下标，找不到返回 -1。O(n) */
  indexOf(value) {
    let cur = this.head;
    let i = 0;
    while (cur !== null) {
      if (cur.value === value) return i;
      cur = cur.next;
      i += 1;
    }
    return -1;
  }

  /** 按值删除第一个匹配项，返回是否删除成功 */
  remove(value) {
    const i = this.indexOf(value);
    if (i === -1) return false;
    this.removeAt(i);
    return true;
  }

  /**
   * 反转链表（迭代版）
   *
   * 核心思路：三指针滑动
   *
   *   初始：  prev=null   cur=10 -> 20 -> 30 -> null
   *   第 1 步：把 cur.next 指向 prev，于是 10 指回 null；
   *            三个指针一起右移：prev=10, cur=20
   *
   *   null <- 10    20 -> 30 -> null
   *           ↑      ↑
   *          prev   cur
   *
   *   第 2 步：20 指回 10，指针再右移
   *   null <- 10 <- 20    30 -> null
   *                  ↑      ↑
   *                 prev   cur
   *
   *   第 3 步：30 指回 20，指针右移，cur 变成 null，循环结束
   *   null <- 10 <- 20 <- 30
   *                       ↑
   *                      prev  ← 它就是新的 head
   *
   * 时间复杂度 O(n)，空间复杂度 O(1)（只用了三个指针变量）。
   */
  reverse() {
    let prev = null;
    let cur = this.head;
    this.tail = this.head; // 反转后原来的头变成尾（务必在改动前记录）
    while (cur !== null) {
      const nextTmp = cur.next; // ① 先存住下一个节点，否则改完指针就找不到它了
      cur.next = prev; // ② 把当前节点的指针掉头
      prev = cur; // ③ prev 前进
      cur = nextTmp; // ④ cur 前进
    }
    this.head = prev; // 循环结束时 prev 停在原来的尾巴上
    return this;
  }

  /** 转成数组，便于观察和调试 */
  toArray() {
    const out = [];
    let cur = this.head;
    while (cur !== null) {
      out.push(cur.value);
      cur = cur.next;
    }
    return out;
  }

  /** 渲染成 "10 -> 20 -> 30 -> null" 的样子，用于打印操作前/后的状态 */
  snapshot() {
    if (this.head === null) return '(空链表)';
    const parts = [];
    let cur = this.head;
    while (cur !== null) {
      parts.push(String(cur.value));
      cur = cur.next;
    }
    parts.push('null');
    return parts.join(' -> ');
  }

  /** 从数组批量构建 O(n) */
  static from(values) {
    const list = new SinglyLinkedList();
    for (const v of values) list.append(v);
    return list;
  }
}

// ---------------------------------------------------------------------------
// 2. 单向链表的逐操作演示
// ---------------------------------------------------------------------------

console.log('\n--- 2. 单向链表：每个操作都打印「操作前 / 操作后」---');

const list = new SinglyLinkedList();

console.log('');
console.log('【初始状态】' + list.snapshot());

console.log('');
console.log('【append(10)】尾部追加');
console.log('  操作前：' + list.snapshot());
list.append(10);
console.log('  操作后：' + list.snapshot() + `   (head=${list.head.value}, tail=${list.tail.value}, size=${list.size})`);

console.log('');
console.log('【append(20)】【append(30)】继续追加');
console.log('  操作前：' + list.snapshot());
list.append(20).append(30);
console.log('  操作后：' + list.snapshot() + `   (head=${list.head.value}, tail=${list.tail.value}, size=${list.size})`);

console.log('');
console.log('【prepend(5)】头部插入 O(1)：只需让新节点指向旧 head，再改 head');
console.log('  操作前：' + list.snapshot());
list.prepend(5);
console.log('  操作后：' + list.snapshot() + `   (head=${list.head.value}, tail=${list.tail.value}, size=${list.size})`);

console.log('');
console.log('【insert(2, 15)】在下标 2 处插入 O(n)：先走到下标 1 的节点，再改两个指针');
console.log('  操作前：' + list.snapshot());
list.insert(2, 15);
console.log('  操作后：' + list.snapshot() + `   (size=${list.size})`);

console.log('');
console.log('【get(3)】按下标读取 O(n)：从头走 3 步');
console.log('  当前链表：' + list.snapshot());
console.log(`  get(3) = ${list.get(3)}`);

console.log('');
console.log('【indexOf(30)】按值查找 O(n)');
console.log('  当前链表：' + list.snapshot());
console.log(`  indexOf(30) = ${list.indexOf(30)}，indexOf(999) = ${list.indexOf(999)}（找不到返回 -1）`);

console.log('');
console.log('【removeAt(0)】删除头节点 O(1)（已经知道位置是 0）');
console.log('  操作前：' + list.snapshot() + `   (head=${list.head.value})`);
const removedHead = list.removeAt(0);
console.log(`  操作后：${list.snapshot()}   (删掉的是 ${removedHead}，新 head=${list.head.value}, size=${list.size})`);

console.log('');
console.log('【remove(30)】按值删除 O(n)：先找到 30 在下标 2，再删');
console.log('  操作前：' + list.snapshot());
const ok = list.remove(30);
console.log(`  操作后：${list.snapshot()}   (删除成功=${ok}, tail=${list.tail.value}, size=${list.size})`);

console.log('');
console.log('【removeAt(size-1)】删除尾节点 O(n)：链表找"倒数第一个的前一个"必须从头走');
console.log('  操作前：' + list.snapshot() + `   (tail=${list.tail.value})`);
const removedTail = list.removeAt(list.size - 1);
console.log(`  操作后：${list.snapshot()}   (删掉的是 ${removedTail}，新 tail=${list.tail.value}, size=${list.size})`);

console.log('');
console.log('【边界情况】空链表上的操作');
const empty = new SinglyLinkedList();
console.log('  空链表 get(0)       = ' + empty.get(0));
console.log('  空链表 removeAt(0)  = ' + empty.removeAt(0));
console.log('  空链表 indexOf(1)   = ' + empty.indexOf(1));
console.log('  try/catch 演示越界插入：');
try {
  empty.insert(5, 1); // 空链表 size=0，插入位置只能是 0
} catch (err) {
  console.log(`    捕获到错误：${err.name}: ${err.message}（演示用，已被 try/catch 兜住）`);
}

// ---------------------------------------------------------------------------
// 3. 反转链表
// ---------------------------------------------------------------------------

console.log('\n--- 3. 反转链表：迭代版与递归版 ---');

const toReverse = SinglyLinkedList.from([1, 2, 3, 4, 5]);
console.log('');
console.log('操作前：' + toReverse.snapshot() + `   (head=${toReverse.head.value}, tail=${toReverse.tail.value})`);
toReverse.reverse();
console.log('迭代反转后：' + toReverse.snapshot() + `   (head=${toReverse.head.value}, tail=${toReverse.tail.value})`);
console.log('注意 head 和 tail 正好互换了位置 —— 反转只要改指针方向，节点本身一个都没动。');
console.log('复杂度：时间 O(n)，空间 O(1)（只用了 prev / cur / nextTmp 三个变量）。');

/**
 * 递归版反转
 *
 * 思路：先递归到最后一个节点，把"最后一个节点"作为新 head 一层层传回来，
 *       然后让【后一个节点】的 next 指回自己，并把自己的 next 断开。
 *
 *   reverseRec(1 -> 2 -> 3 -> null)
 *     └─ reverseRec(2 -> 3 -> null)
 *          └─ reverseRec(3 -> null)
 *               └─ 返回 3（新头）
 *          回到 2 这一层：3.next = 2；2.next = null   →  3 -> 2 -> null
 *     回到 1 这一层：2.next = 1；1.next = null        →  3 -> 2 -> 1 -> null
 *
 * 复杂度：时间 O(n)，空间 O(n) —— 递归调用栈的深度就是 n。
 * 对比迭代版的 O(1) 空间，这是"递归往往更简洁但更费内存"的典型案例。
 */
function reverseRecursive(node) {
  if (node === null || node.next === null) return node; // 空链表或只剩一个节点，直接返回
  const newHead = reverseRecursive(node.next); // 先处理后面的部分
  node.next.next = node; // 让后一个节点指回自己
  node.next = null; // 断开自己的正向指针，防止成环
  return newHead; // 新 head 一层层原样传回去
}

const recList = SinglyLinkedList.from([1, 2, 3, 4, 5]);
console.log('');
console.log('递归反转前：' + recList.snapshot());
recList.head = reverseRecursive(recList.head);
console.log('递归反转后：' + recList.snapshot());
console.log('两种写法结果一致：' + (JSON.stringify(recList.toArray()) === JSON.stringify(toReverse.toArray())));

// ---------------------------------------------------------------------------
// 4. 双向链表：为什么它值钱
// ---------------------------------------------------------------------------

/** 双向链表节点 */
class DoublyNode {
  constructor(value) {
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

/**
 * 双向链表
 *
 * 关键能力：拿到一个节点引用后，可以在 O(1) 时间内把它从链表中【摘除】，
 *           因为 prev 指针让你不必再从头找它的前驱。
 * 这正是 LRU 缓存能做到 O(1) 淘汰的原因。
 *
 * 这里用【哨兵节点】（dummy head/tail）简化边界处理：
 *
 *   dummyHead <-> 节点1 <-> 节点2 <-> dummyTail
 *
 * 有了哨兵，任何位置插入/删除都变成"改四个指针"，
 * 不用再为"空链表""删头""删尾"写特判分支。
 */
class DoublyLinkedList {
  constructor() {
    this.dummyHead = new DoublyNode(null);
    this.dummyTail = new DoublyNode(null);
    this.dummyHead.next = this.dummyTail;
    this.dummyTail.prev = this.dummyHead;
    this.size = 0;
  }

  /** 把节点挂到链表最前面（哨兵之后） */
  addFirst(node) {
    node.prev = this.dummyHead;
    node.next = this.dummyHead.next;
    this.dummyHead.next.prev = node;
    this.dummyHead.next = node;
    this.size += 1;
    return node;
  }

  /** 把节点挂到链表最后面（哨兵之前） */
  addLast(node) {
    node.next = this.dummyTail;
    node.prev = this.dummyTail.prev;
    this.dummyTail.prev.next = node;
    this.dummyTail.prev = node;
    this.size += 1;
    return node;
  }

  /**
   * 把已在链表中的节点移到最前面 —— O(1)
   * 这就是"LRU 里被访问过的键要变成最新"的操作。
   */
  moveToFront(node) {
    if (this.dummyHead.next === node) return node; // 已经在最前了，不用动
    this.remove(node);
    this.addFirst(node);
    return node;
  }

  /** 摘除任意位置的节点 —— O(1)！这是单向链表做不到的 */
  remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
    node.prev = null;
    node.next = null;
    this.size -= 1;
    return node;
  }

  /** 链表最前面的节点（即最旧/最少使用的） */
  get first() {
    return this.dummyHead.next === this.dummyTail ? null : this.dummyHead.next;
  }

  /** 链表最后面的节点（即最新/最近使用的） */
  get last() {
    return this.dummyTail.prev === this.dummyHead ? null : this.dummyTail.prev;
  }

  /** 按值查找 O(n)，返回节点引用 */
  find(value) {
    let cur = this.dummyHead.next;
    while (cur !== this.dummyTail) {
      if (cur.value === value) return cur;
      cur = cur.next;
    }
    return null;
  }

  /** 从前往后渲染 */
  snapshot() {
    if (this.size === 0) return '(空链表)';
    const fwd = [];
    let cur = this.dummyHead.next;
    while (cur !== this.dummyTail) {
      fwd.push(String(cur.value));
      cur = cur.next;
    }
    return 'null <- ' + fwd.join(' <-> ') + ' -> null';
  }
}

console.log('\n--- 4. 双向链表：O(1) 删除任意节点 ---');

const dll = new DoublyLinkedList();
console.log('');
console.log('【初始状态】' + dll.snapshot() + '   （内部是两个哨兵节点相连，对外表现为空）');

console.log('');
console.log('【addLast】依次追加 A、B、C、D');
console.log('  操作前：' + dll.snapshot());
const nodeA = dll.addLast(new DoublyNode('A'));
dll.addLast(new DoublyNode('B'));
dll.addLast(new DoublyNode('C'));
dll.addLast(new DoublyNode('D'));
console.log('  操作后：' + dll.snapshot() + `   (size=${dll.size})`);

console.log('');
console.log('【addFirst】把 X 插到最前面');
console.log('  操作前：' + dll.snapshot());
dll.addFirst(new DoublyNode('X'));
console.log('  操作后：' + dll.snapshot() + `   (size=${dll.size})`);

console.log('');
console.log('【moveToFront(B)】把中间的 B 移到最前 —— O(1)，因为不用从头找它的前驱');
console.log('  操作前：' + dll.snapshot());
const nodeB = dll.find('B'); // 这里为了拿到节点引用做了一次 O(n) 查找
dll.moveToFront(nodeB); // 这一步本身是 O(1)
console.log('  操作后：' + dll.snapshot() + `   (size=${dll.size})`);
console.log('  说明：find 是 O(n)，但 moveToFront 是 O(1)。');
console.log('        LRU 缓存之所以能做到 O(1)，是因为哈希表帮它【直接拿到节点引用】，');
console.log('        省掉了这次查找。');

console.log('');
console.log('【remove(A)】O(1) 摘除中间的 A —— 单向链表这时必须从头走一遍');
console.log('  操作前：' + dll.snapshot());
dll.remove(nodeA); // nodeA 是之前 addLast 时保存下来的引用，直接用
console.log('  操作后：' + dll.snapshot() + `   (size=${dll.size})`);
console.log('  first=' + dll.first.value + ', last=' + dll.last.value);

// ---------------------------------------------------------------------------
// 5. 链表 vs 数组 取舍表
// ---------------------------------------------------------------------------

console.log('\n--- 5. 链表 vs 数组：取舍表 ---');

const tradeoff = [
  ['按下标随机访问 arr[i]', 'O(1)', 'O(n)', '数组完胜。链表必须从头数过去'],
  ['查找某个值是否存在', 'O(n)', 'O(n)', '打平。但数组内存连续，实测通常更快'],
  ['已知节点位置时插入', 'O(n)', 'O(1)', '链表赢。数组要把后面元素整体后移'],
  ['按下标插入（要先找到位置）', 'O(n)', 'O(n)', '打平。链表省下的搬移被查找抵消了'],
  ['头部插入 / 删除', 'O(n)', 'O(1)', '链表赢。数组的 unshift/shift 要搬移全部元素'],
  ['尾部插入 / 删除', 'O(1) 均摊', 'O(1)', '打平。数组末尾 push 是均摊 O(1)'],
  ['内存布局', '连续', '分散', '数组对 CPU 缓存友好，链表容易 cache miss'],
  ['每个元素的内存开销', '极小（紧凑）', '大（对象头 + 指针）', '同样数据量，链表占用内存可能是数组的数倍'],
  ['能否二分查找', '能（前提是有序）', '不能', '链表无法 O(1) 跳转到中点'],
  ['扩容', '需要重新分配 + 拷贝', '天然增长，无需扩容', '链表没有"容量"概念'],
  ['实现复杂度', '语言内置，零成本', '要自己写，容易写出丢链 bug', '工程上能不用链表就不用'],
  ['能否被 GC 及时回收', '整块回收', '节点分散，回收压力更大', '大量短命链表会给 GC 添麻烦'],
];

console.log('操作 / 特性'.padEnd(28) + '数组'.padEnd(16) + '链表'.padEnd(16) + '说明');
console.log('-'.repeat(104));
for (const [op, arr, linked, note] of tradeoff) {
  console.log(op.padEnd(26) + arr.padEnd(16) + linked.padEnd(16) + note);
}

console.log('');
console.log('选型口诀：');
console.log('  · 要"按下标读"、"批量遍历"、"二分查找" → 用数组（99% 的业务场景）；');
console.log('  · 要"频繁在已知位置插入删除"、"实现 LRU / 队列" → 考虑链表；');
console.log('  · 拿不准就用数组 —— 链表在真实机器上常常比理论慢，');
console.log('    因为 CPU 缓存和内存分配器的实际行为会吃掉理论优势。');

// ---------------------------------------------------------------------------
// 6. 实战：用「哈希表 + 双向链表」实现 LRU 缓存
// ---------------------------------------------------------------------------

console.log('\n--- 6. 实战：LRU 缓存 = 哈希表 + 双向链表 ---');
console.log('');
console.log('LRU（Least Recently Used，最近最少使用）淘汰策略：');
console.log('  缓存满了要腾位置时，淘汰"最久没被访问过"的那一条。');
console.log('');
console.log('为什么必须两个结构配合？');
console.log('  · 哈希表 Map：O(1) 判断"这个键在不在缓存里"，并直接拿到节点引用；');
console.log('  · 双向链表  ：O(1) 把节点移到"最新"位置 / O(1) 摘除最旧节点。');
console.log('  缺一不可：只用哈希表，找"谁最旧"要 O(n)；只用链表，找"键在不在"要 O(n)。');
console.log('');
console.log('  链表结构（下面按 旧→新 的顺序书写，淘汰时删最左边）：');
console.log('    [最旧] <-> [ ... ] <-> [最新]');
console.log('      ↑淘汰时删这个        ↑访问过的键移到这里');
console.log('  内部物理顺序是反的（新节点用 addFirst 挂到头部），所以代码里"最旧"取的是尾端节点。');

class LRUCache {
  constructor(capacity) {
    if (capacity < 1) throw new RangeError('容量必须大于 0');
    this.capacity = capacity;
    this.map = new Map(); // key -> DoublyNode（节点的 value 存 { key, value }）
    this.list = new DoublyLinkedList();
  }

  get(key) {
    const node = this.map.get(key);
    if (node === undefined) return undefined; // 未命中
    this.list.moveToFront(node); // 命中 → 标记为"最近使用"
    return node.value.value;
  }

  put(key, value) {
    const existing = this.map.get(key);
    if (existing !== undefined) {
      // 键已存在：更新值并标记为最近使用
      existing.value.value = value;
      this.list.moveToFront(existing);
      return 'updated';
    }
    // 键不存在：新建节点插到最前
    const node = new DoublyNode({ key, value });
    this.map.set(key, node);
    this.list.addFirst(node);

    if (this.map.size > this.capacity) {
      // 超出容量：淘汰链表里【最旧】的节点。
      // 注意：addFirst 把新节点挂在头部，所以链表是「头新尾旧」：
      //   dummyHead <-> [最新] <-> ... <-> [最旧] <-> dummyTail
      // 因此"最旧"是 list.last（尾端），而不是 list.first。这是实现 LRU 最容易搞反的一步。
      const oldest = this.list.last;
      this.list.remove(oldest);
      this.map.delete(oldest.value.key);
      return `evicted:${oldest.value.key}`;
    }
    return 'inserted';
  }

  /**
   * 打印内部状态：链表（按 旧→新 顺序）+ 哈希表里现存的键。
   * 链表物理顺序是「头新尾旧」，所以这里从尾巴往前走，打印出来才是 旧→新。
   */
  dump() {
    const keys = [];
    let cur = this.list.dummyTail.prev; // 从最旧的一端开始
    while (cur !== this.list.dummyHead) {
      keys.push(cur.value.key);
      cur = cur.prev;
    }
    return `链表(旧→新): [${keys.join(', ')}]   Map键: [${[...this.map.keys()].join(', ')}]`;
  }
}

const lru = new LRUCache(3);
console.log('');
console.log('创建一个容量为 3 的 LRU 缓存：' + lru.dump());

const steps = [
  ['put(1, "A")', () => lru.put(1, 'A')],
  ['put(2, "B")', () => lru.put(2, 'B')],
  ['put(3, "C")', () => lru.put(3, 'C')],
  ['get(1)  → 命中，1 变成最新', () => lru.get(1)],
  ['put(4, "D") → 容量满，淘汰最旧的 2', () => lru.put(4, 'D')],
  ['get(2)  → 未命中（已被淘汰）', () => lru.get(2)],
  ['put(3, "C2") → 3 已存在，更新并变成最新', () => lru.put(3, 'C2')],
  ['get(4)  → 命中', () => lru.get(4)],
  ['put(5, "E") → 淘汰最旧的 1', () => lru.put(5, 'E')],
];

for (const [label, action] of steps) {
  console.log('');
  console.log(`【${label}】`);
  console.log('  操作前：' + lru.dump());
  const result = action();
  console.log('  操作后：' + lru.dump());
  if (result !== undefined) console.log(`  返回值：${result}`);
}

console.log('');
console.log('LRU 复杂度：get O(1)，put O(1)，空间 O(capacity)。');
console.log('把哈希表和双向链表组合起来换取 O(1)，是"用空间换时间 + 组合两个结构"的经典范例。');
console.log('（Node.js 里可以直接用 new Map() 实现 LRU：Map 会保持插入顺序，');
console.log('  把访问过的键先 delete 再 set 就等同于"移到最新"，详见 23_collections/01_map_basics.js。）');

// ---------------------------------------------------------------------------
// 7. 实测：理论差异在真实机器上是什么样
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实测：随机访问 vs 头部插入 ---');

const N = 5000;
const ACCESS = 2000;

// 准备数据
const arrayData = new Array(N);
for (let i = 0; i < N; i++) arrayData[i] = i;
const listData = SinglyLinkedList.from(arrayData);

// 7.1 按下标随机访问：arr[i] O(1) vs list.get(i) O(n)
const accessIdx = [];
let seed = 20240916;
for (let i = 0; i < ACCESS; i++) {
  seed = (seed * 48271) % 2147483647;
  accessIdx.push(seed % N);
}

const arrAccessMs = medianMs(() => {
  let acc = 0;
  for (let i = 0; i < ACCESS; i++) acc += arrayData[accessIdx[i]];
  sink.value = acc;
});

const listAccessMs = medianMs(() => {
  let acc = 0;
  for (let i = 0; i < ACCESS; i++) acc += listData.get(accessIdx[i]);
  sink.value = acc;
});

console.log('');
console.log(`规模 n = ${N}，随机访问 ${ACCESS} 次（下标在 0~${N - 1} 之间随机）：`);
console.log('  ' + '数组 arr[i]（O(1)）'.padEnd(28) + `${arrAccessMs.toFixed(4)} ms`);
console.log('  ' + '链表 get(i)（O(n)）'.padEnd(28) + `${listAccessMs.toFixed(4)} ms`);
console.log(`  链表慢约 ${(listAccessMs / arrAccessMs).toFixed(1)} 倍`);
console.log('  原因：数组一次乘加就定位，链表平均要走 n/2 步，且每一步都可能 cache miss。');

// 7.2 头部插入：arr.unshift O(n) vs list.prepend O(1)
const HEAD_N = 4000;

const unshiftMs = medianMs(() => {
  const a = [];
  for (let i = 0; i < HEAD_N; i++) a.unshift(i);
  sink.value = a.length;
});

const prependMs = medianMs(() => {
  const l = new SinglyLinkedList();
  for (let i = 0; i < HEAD_N; i++) l.prepend(i);
  sink.value = l.size;
});

console.log('');
console.log(`在【头部】插入 ${HEAD_N} 个元素：`);
console.log('  ' + '数组 unshift（O(n) 每次）'.padEnd(28) + `${unshiftMs.toFixed(4)} ms`);
console.log('  ' + '链表 prepend（O(1) 每次）'.padEnd(28) + `${prependMs.toFixed(4)} ms`);
console.log(`  链表快约 ${(unshiftMs / prependMs).toFixed(1)} 倍`);
console.log('  原因：数组每次 unshift 都要把已有元素整体后移一格，总共搬移约 n²/2 次；');
console.log('        链表每次只改两个指针，且 V8 为每个新建节点付出的分配成本是常数。');

// 7.3 尾部追加：数组 push 也是 O(1) 均摊，所以差距应该很小
const TAIL_N = 20000;

const pushMs = medianMs(() => {
  const a = [];
  for (let i = 0; i < TAIL_N; i++) a.push(i);
  sink.value = a.length;
});

const appendMs = medianMs(() => {
  const l = new SinglyLinkedList();
  for (let i = 0; i < TAIL_N; i++) l.append(i);
  sink.value = l.size;
});

console.log('');
console.log(`在【尾部】追加 ${TAIL_N} 个元素（这次两者都是 O(1)）：`);
console.log('  ' + '数组 push（均摊 O(1)）'.padEnd(28) + `${pushMs.toFixed(4)} ms`);
console.log('  ' + '链表 append（O(1)）'.padEnd(28) + `${appendMs.toFixed(4)} ms`);
console.log(`  数组快约 ${(appendMs / pushMs).toFixed(1)} 倍`);
console.log('  原因：复杂度相同，但数组 push 只是写一块连续内存的下一格，');
console.log('        链表每次都要 new 一个节点对象，分配成本 + 指针跳转都更贵。');
console.log('        这生动说明了：复杂度相同的两个实现，常数因子可能差好几倍。');

// 7.4 内存占用：按 V8 的对象布局【估算】，而不是硬测
console.log('');
console.log(`内存占用估算（存 ${TAIL_N} 个数字，按 64 位 V8 的常见布局推算）：`);
console.log('');
console.log('  数组方式：一个连续的元素槽数组');
console.log('    · 数组头（长度、元素类型等元信息）      ≈ 16 字节');
console.log('    · 每个元素槽（指向数字的指针）          ≈ 8 字节 × n');
console.log(`    · 合计                                 ≈ ${((16 + TAIL_N * 8) / 1024).toFixed(1)} KB`);
console.log('');
console.log('  链表方式：每个节点都是一个独立对象');
console.log('    · 每个节点对象头（map 指针 + 属性槽）   ≈ 16 字节');
console.log('    · value 槽                              ≈ 8 字节');
console.log('    · next 指针                             ≈ 8 字节');
console.log('    · 每个节点小计                          ≈ 32 字节');
console.log(`    · 合计                                 ≈ ${((TAIL_N * 32) / 1024).toFixed(1)} KB`);
console.log('');
console.log(`  估算结论：链表的内存占用约为数组的 ${(32 / 8).toFixed(0)} 倍量级。`);
console.log('  为什么用"估算"而不是"实测"？');
console.log('    process.memoryUsage().heapUsed 受 GC 时机影响极大，');
console.log('    在这么短的脚本里前后两次读数经常出现负数或几百 KB 的抖动，');
console.log('    测出来的数字比结论本身还不可信（这正是 31_performance_and_memory/');
console.log('    09_memory_leak_patterns.js 强调的"内存测量要看趋势而非瞬时值"）。');
console.log('  但结论是确定的：链表每个节点都要多存一个指针 + 一个独立对象头，');
console.log('  这是【结构性开销】，不随机器和实现变化。');

// ---------------------------------------------------------------------------
// 8. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 8. 小结 ---');
console.log('');
console.log('链表要记住的三件事：');
console.log('  1. 链表换掉的是「按下标随机访问」，换来的是「已知位置的 O(1) 插入删除」；');
console.log('  2. 这个交换在真实机器上常常不划算 —— 数组的连续内存 + 缓存友好太强了；');
console.log('  3. 链表真正无可替代的场景是"边流边接"和"配合哈希表做 LRU"，');
console.log('     而不是拿来替代日常的数组遍历。');
console.log('');
console.log('反向指针（双链表）的价值：让"删除某个节点"从 O(n) 变成 O(1)，');
console.log('这一点是 LRU、LFU、有序链表等一票结构的基础。');

console.log(`\n（防止死代码消除的汇总值 sink = ${JSON.stringify(sink.value)}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
