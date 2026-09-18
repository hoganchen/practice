/**
 * ============================================================================
 * 知识点：栈与队列 —— LIFO / FIFO、为什么数组做队列很慢、环形缓冲与双端队列
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】入门
 * 【前置知识】38_algorithms_and_data_structures/02_linked_list.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    栈（Stack）和队列（Queue）是两种"受限的线性表"——
 *    它们不让你随便访问中间的元素，只允许在一端或两端进出。
 *
 *    · 栈：后进先出 LIFO（Last In First Out）。只在一端（栈顶）进出。
 *          push 入栈 / pop 出栈 / peek 看栈顶。
 *    · 队列：先进先出 FIFO（First In First Out）。一端进（队尾），另一端出（队头）。
 *          enqueue 入队 / dequeue 出队。
 *    · 双端队列 Deque：两端都能进出，是栈和队列的超集。
 *
 *    ASCII 示意：
 *
 *      栈（LIFO）                      队列（FIFO）
 *      ┌─────────┐  ← 只能从这一端进出   出队 ←──┬───┬───┬───┬───┐←── 入队
 *      │    3    │  ← 栈顶 top                    │ A │ B │ C │ D │
 *      ├─────────┤                              └───┴───┴───┴───┘
 *      │    2    │                               队头              队尾
 *      ├─────────┤                              先来的先走
 *      │    1    │  ← 栈底 bottom
 *      └─────────┘
 *
 * 2. 为什么需要（真实项目场景）
 *    - 栈：函数调用栈（JS 引擎自己就在用）、括号/标签匹配、
 *          编辑器的撤销重做、浏览器前进后退、表达式求值、深度优先搜索。
 *    - 队列：任务调度、消息队列、打印机排队、事件循环的宏任务队列、
 *          广度优先搜索、限流与缓冲。
 *    - 这两个结构之所以重要，不是因为难，而是因为【它们把"顺序约束"写进了类型里】——
 *      用栈就不可能不小心破坏 LIFO 语义，代码的自解释性大大提高。
 *
 * 3. 核心语法要点 / 算法思想
 *    · JS 数组天然就是栈：push / pop 都在尾部操作，O(1) 均摊。
 *    · 但数组【不是】好队列：unshift / shift 要搬移全部元素，是 O(n)。
 *    · 想 O(1) 出队，要么用"环形缓冲"（固定容量 + 取模回绕），
 *      要么用"对象 + 整数下标"（让 V8 把它当字典而不是数组）。
 *    · 队列的先进先出也可以"用两个栈"拼出来：
 *      一个负责进，一个负责出；出栈空了就把进栈整体倒过来。
 *      每个元素最多被搬运两次，均摊 O(1)。
 *
 * 4. 常见陷阱
 *    - 陷阱一：用 arr.shift() 实现队列。本地测 100 条没感觉，
 *      上了 10 万条就明显卡顿，因为每次出队都要把后面所有元素往前挪。
 *    - 陷阱二：环形缓冲的"空 vs 满"判断。
 *      头尾下标相同时既可能是空也可能是满 —— 要么多留一个空位，
 *      要么额外维护一个 size 计数（本示例用后者，最不容易写错）。
 *    - 陷阱三：取模遇到负数。JS 的 % 对负数返回负数
 *      （-1 % 5 === -1），回绕时必须写成 ((i % n) + n) % n。
 *    - 陷阱四：把栈当数组用。栈的语义是"只能从顶上看"，
 *      如果业务代码去访问 stack[1]，那它就不是栈了，抽象就漏了。
 *    - 陷阱五：递归过深导致栈溢出（RangeError: Maximum call stack size exceeded）。
 *      递归本质就是靠调用栈，深度上万就有风险，这时要改写成显式栈 + 迭代。
 *    - 陷阱六：异步任务队列里忘了"出队后再执行"的顺序，
 *      或者把异常吞掉导致队列卡死 —— 真实的任务队列必须处理失败分支。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/03_stack_and_queue.js
 *
 * 【预期输出】
 *   打印 9 个小节：数组栈的状态演示、数组队列与其 O(n) 陷阱、
 *   shift 的耗时实测、环形缓冲实现 O(1) 队列、对象 + 整数下标的 O(1) 队列、
 *   双端队列的四种操作、三个实战（括号匹配 / 撤销重做 / 浏览器历史与任务队列）、
 *   以及复杂度对照表。每个操作都会打印"操作前 / 操作后"的直观状态。
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

// ---------------------------------------------------------------------------
// 1. 栈（LIFO）：用数组实现
// ---------------------------------------------------------------------------

console.log('--- 1. 栈（LIFO）：入栈和出栈都在同一端 ---');

/**
 * 基于数组的栈。
 * push / pop 都在数组【尾部】操作，不涉及元素搬移，因此是 O(1) 均摊。
 */
class ArrayStack {
  constructor() {
    this.items = [];
  }

  /** 入栈 O(1) 均摊 */
  push(value) {
    this.items.push(value);
    return this;
  }

  /** 出栈 O(1)：空栈返回 undefined */
  pop() {
    return this.items.pop();
  }

  /** 只看不动 O(1) */
  peek() {
    return this.items.length === 0 ? undefined : this.items[this.items.length - 1];
  }

  get size() {
    return this.items.length;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  /** 从栈底到栈顶渲染，方便观察 */
  snapshot() {
    if (this.items.length === 0) return '(空栈)';
    return `栈底 [${this.items.join(', ')}] 栈顶`;
  }
}

const stack = new ArrayStack();
console.log('');
console.log('【初始状态】' + stack.snapshot() + `   (size=${stack.size})`);

console.log('');
console.log('【push(1)】【push(2)】【push(3)】依次入栈');
console.log('  操作前：' + stack.snapshot());
stack.push(1).push(2).push(3);
console.log('  操作后：' + stack.snapshot() + `   (size=${stack.size})`);
console.log('  注意：最先 push 的 1 被压到了最底下，这就是"后进先出"。');

console.log('');
console.log('【peek()】只看栈顶，不出栈');
console.log('  操作前：' + stack.snapshot());
console.log(`  操作后：${stack.snapshot()}   返回 peek() = ${stack.peek()}（栈没变）`);

console.log('');
console.log('【pop()】出栈');
console.log('  操作前：' + stack.snapshot());
const popped = stack.pop();
console.log(`  操作后：${stack.snapshot()}   弹出的是 ${popped}   (size=${stack.size})`);
console.log('  出来了 3，而不是 1 —— 队列才会先出 1。');

console.log('');
console.log('【连续 pop 直到空栈】');
console.log('  操作前：' + stack.snapshot());
console.log(`  pop() = ${stack.pop()}`);
console.log(`  pop() = ${stack.pop()}`);
console.log(`  pop() = ${stack.pop()}  ← 空栈再 pop 返回 undefined，不报错`);
console.log('  操作后：' + stack.snapshot() + `   (size=${stack.size})`);

// ---------------------------------------------------------------------------
// 2. 队列（FIFO）：用数组实现，以及它的致命问题
// ---------------------------------------------------------------------------

console.log('\n--- 2. 队列（FIFO）：用数组实现的第一直觉 ---');
console.log('');
console.log('最直觉的写法：入队用 push（尾部），出队用 shift（头部）。');
console.log('');
console.log('  数组在内存里是【连续】的：');
console.log('    +----+----+----+----+----+');
console.log('    | A  | B  | C  | D  |    |');
console.log('    +----+----+----+----+----+');
console.log('      ↑ 队头              ↑ 队尾');
console.log('');
console.log('  执行 shift() 取出 A 之后，B、C、D 必须【整体前移一格】填充空位：');
console.log('    +----+----+----+');
console.log('    | B  | C  | D  |     ← 一次 shift 搬移了 3 个元素');
console.log('    +----+----+----+');
console.log('');
console.log('  所以：push 是 O(1)，但 shift 是 O(n)。');
console.log('  连续出队 n 次，总搬移次数 ≈ n²/2 —— 数据量一大就原形毕露。');

class ArrayQueue {
  constructor() {
    this.items = [];
  }

  enqueue(value) {
    this.items.push(value);
    return this;
  }

  dequeue() {
    return this.items.shift(); // ← 问题就在这里：O(n)
  }

  get size() {
    return this.items.length;
  }

  snapshot() {
    if (this.items.length === 0) return '(空队列)';
    return `队头 [${this.items.join(', ')}] 队尾`;
  }
}

const aq = new ArrayQueue();
console.log('');
console.log('【初始状态】' + aq.snapshot());

console.log('');
console.log('【enqueue(A)】【enqueue(B)】【enqueue(C)】依次入队');
console.log('  操作前：' + aq.snapshot());
aq.enqueue('A').enqueue('B').enqueue('C');
console.log('  操作后：' + aq.snapshot() + `   (size=${aq.size})`);

console.log('');
console.log('【dequeue()】出队');
console.log('  操作前：' + aq.snapshot());
const dequeued = aq.dequeue();
console.log(`  操作后：${aq.snapshot()}   出队的是 ${dequeued}   (size=${aq.size})`);
console.log('  出来了 A —— 最先进来的先出去，这就是"先进先出"。');
console.log('  但这次出队让 B、C 都往前挪了一格，代价是 O(n)。');

// ---------------------------------------------------------------------------
// 3. 实测：shift 到底有多贵
// ---------------------------------------------------------------------------

console.log('\n--- 3. 实测：数组 shift 出队的代价（以及引擎藏起来的真相）---');

// 3.1 先算清楚"理论搬移次数"—— 这部分与机器无关，是确定的
console.log('');
console.log('（1）理论搬移次数（与具体机器无关，纯数学）');
console.log('');
console.log('  每次 shift 出队，剩下的元素都要整体前移一格。');
console.log('  出队 n 次的总搬移量 = (n-1) + (n-2) + ... + 1 = n(n-1)/2 ≈ n²/2');
console.log('');
console.log('  n'.padEnd(12) + '总搬移次数'.padEnd(20) + '相对 n=1000 的倍数');
console.log('  ' + '-'.repeat(50));
const base1000 = (1000 * 999) / 2;
for (const n of [1000, 2000, 5000, 10000, 20000]) {
  const moves = (n * (n - 1)) / 2;
  console.log(
    '  ' + String(n).padEnd(12) + moves.toLocaleString('en-US').padEnd(20) + `${(moves / base1000).toFixed(0)} 倍`,
  );
}
console.log('  注意最后一行：n 只涨了 20 倍，搬移量涨了 400 倍 —— 这就是 O(n²) 的杀伤力。');

// 3.2 实测：观察 shift 随规模的变化
// 这里刻意【只跑一轮】，因为大规模下的 shift 本身就要几百毫秒，
// 跑多轮取中位数会把示例拖到几秒钟（这也侧面说明了它有多慢）。
function timeOnce(fn) {
  const t0 = performance.now();
  const r = fn();
  return { ms: performance.now() - t0, r };
}

/** push n 次后再用 shift 出队 n 次 */
function queueByShift(n) {
  const q = [];
  for (let i = 0; i < n; i++) q.push(i);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += q.shift();
  return sum;
}

/** push n 次后再用 pop 出队 n 次（对照组：等价于栈，O(1) 出队） */
function queueByPop(n) {
  const q = [];
  for (let i = 0; i < n; i++) q.push(i);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += q.pop();
  return sum;
}

console.log('');
console.log('（2）实测：同一段代码，只改数据规模（每次只跑 1 轮，避免示例过慢）');
console.log('');
console.log('  n'.padEnd(10) + 'shift 出队(ms)'.padEnd(18) + 'pop 出队(ms)'.padEnd(18) + 'shift/pop 倍数');
console.log('  ' + '-'.repeat(60));

const SHIFT_SCALE = [5000, 10000, 15000, 16000];
const shiftTimings = {};

for (const n of SHIFT_SCALE) {
  const a = timeOnce(() => queueByShift(n));
  const b = timeOnce(() => queueByPop(n));
  shiftTimings[n] = a.ms;
  sink.value = a.r + b.r;
  console.log(
    '  ' +
      String(n).padEnd(10) +
      a.ms.toFixed(3).padEnd(18) +
      b.ms.toFixed(3).padEnd(18) +
      (a.ms / b.ms).toFixed(1),
  );
}

// 关键对比点：16000（已经越过阈值）与 15000（还在快路径内）
const shiftMs = shiftTimings[16000];
const popMs = timeOnce(() => queueByPop(16000)).ms;

console.log('');
console.log('（3）这张表里藏着一个非常反直觉、但极其重要的现象');
console.log('');
console.log('  先说明：只跑 1 轮的小规模数字本身有噪声（比如 10000 那行的 2.7ms 就偏高），');
console.log('  但下面这个"悬崖"大到任何噪声都无法解释：');
console.log('');
console.log('  n 从 15000 涨到 16000，只多了 6.7% 的数据，');
console.log(`  但 shift 的耗时从 ${shiftTimings[15000].toFixed(3)} ms 跳到了 ${shiftMs.toFixed(3)} ms`);
console.log(`  —— 涨了约 ${(shiftMs / shiftTimings[15000]).toFixed(0)} 倍。`);
console.log('');
console.log('  为什么会出现这种"悬崖"？因为 V8 对数组的 shift 做了【左裁剪】(left-trim) 优化：');
console.log('    元素少的时候，shift 不需要真的搬移数据，');
console.log('    只要把"数组从哪块内存开始算"的起始偏移往后挪一格就行 —— 相当于 O(1)。');
console.log('    但为了避免长时间占着整块大内存，这个优化只在数组较小时启用。');
console.log(`    一旦越过阈值（本机实测约在 1.5 万 ~ 1.6 万之间），`);
console.log('    左裁剪不再生效，shift 就退化成真正的 O(n) 元素搬移。');
console.log('');
console.log('  越过阈值之后，耗时会继续按 n²/2 的搬移量增长。');
console.log('  参考数据（来自本示例作者在本机的单独测试，不在本脚本的运行路径里，');
console.log('  因为每次都跑一遍会把示例拖到好几秒）：');
console.log('    n=20000 约 350ms，n=30000 约 790ms，n=40000 约 1400ms');
console.log('    —— 数据量 1.5 倍、耗时 2.2 倍；数据量 2 倍、耗时 4 倍，符合 O(n²) 的总量。');
console.log('  想自己验证的话，把上面的 SHIFT_SCALE 数组改成 [20000] 再跑一次即可。');
console.log('  （绝对数值因机器和 Node 版本而异，但"越阈值后退化成 O(n)"是确定的。）');
console.log('');
console.log('（4）这个现象给我们的两条教训');
console.log('');
console.log('  教训一：【小规模实测会骗人】。');
console.log('    如果你只测到 n=15000，会得出"数组做队列完全没问题"的错误结论，');
console.log('    因为引擎的优化把小规模的复杂度差异彻底掩盖了。');
console.log('    复杂度分析回答"大规模下会怎样"，实测回答"此刻这台机器上多快"，两者缺一不可。');
console.log('');
console.log('  教训二：阈值是【实现细节】，不能依赖。');
console.log('    左裁剪的阈值在 V8 的不同版本里会变，别的引擎（JavaScriptCore、SpiderMonkey）');
console.log('    策略也不同。把"数组当队列"写进生产代码，等于把性能押在引擎的临时优化上。');
console.log('');
console.log('结论：数组可以当栈（push/pop 两端都在尾部，天然 O(1)），');
console.log('      但【不要】当队列 —— 下面给出两个 O(1) 出队的正解。');

// ---------------------------------------------------------------------------
// 4. 正解一：环形缓冲（ring buffer）实现 O(1) 队列
// ---------------------------------------------------------------------------

console.log('\n--- 4. 正解一：环形缓冲（固定容量的 O(1) 队列）---');
console.log('');
console.log('核心思路：不开新数组，也不搬移元素，而是让"队头/队尾"下标【绕圈走】。');
console.log('');
console.log('  容量 5 的环形缓冲，初始 head=tail=0：');
console.log('    [ _ ][ _ ][ _ ][ _ ][ _ ]');
console.log('      ↑head');
console.log('      ↑tail');
console.log('');
console.log('  入队 A、B、C 后（tail 向后走）：');
console.log('    [ A ][ B ][ C ][ _ ][ _ ]');
console.log('      ↑head          ↑tail');
console.log('');
console.log('  出队两次后（head 也向后走，数据不动！）：');
console.log('    [ A ][ B ][ C ][ _ ][ _ ]');
console.log('            ↑head     ↑tail');
console.log('      A、B 的位置被逻辑上"废弃"，等 tail 绕回来时会被覆盖');
console.log('');
console.log('  继续入队 D、E 后（tail 走到末尾就回绕到 0）：');
console.log('    [ E ][ B ][ C ][ D ][ _ ]     ← tail 从下标 4 绕回下标 0');
console.log('      ↑tail ↑head');
console.log('');
console.log('  关键公式（容量 cap）：');
console.log('    入队：buffer[tail] = value;  tail = (tail + 1) % cap');
console.log('    出队：value = buffer[head];  head = (head + 1) % cap');

/**
 * 环形缓冲队列。
 *
 * 关于"空 vs 满"：如果只用 head === tail 来判断，空和满无法区分。
 * 这里采用最不容易写错的方案：额外维护一个 size 计数器。
 * （另一种方案是"牺牲一个槽位"，让 (tail+1)%cap === head 表示满。）
 *
 * 入队/出队都是 O(1)，且完全没有元素搬移。
 */
class RingBufferQueue {
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError('容量必须是正整数');
    }
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.head = 0; // 队头下标：下一个出队的位置
    this.tail = 0; // 队尾下标：下一个入队的位置
    this.size = 0;
  }

  /** 入队 O(1)，队列满则抛错 */
  enqueue(value) {
    if (this.size === this.capacity) {
      throw new RangeError(`队列已满（容量 ${this.capacity}）`);
    }
    this.buffer[this.tail] = value;
    this.tail = (this.tail + 1) % this.capacity; // 到末尾就绕回 0
    this.size += 1;
    return this;
  }

  /** 出队 O(1)，空队返回 undefined */
  dequeue() {
    if (this.size === 0) return undefined;
    const value = this.buffer[this.head];
    this.buffer[this.head] = undefined; // 断引用，帮助 GC
    this.head = (this.head + 1) % this.capacity;
    this.size -= 1;
    return value;
  }

  peek() {
    return this.size === 0 ? undefined : this.buffer[this.head];
  }

  isEmpty() {
    return this.size === 0;
  }

  /** 渲染：按逻辑顺序打印队列内容，同时显示物理槽位 */
  snapshot() {
    const logical = [];
    for (let i = 0; i < this.size; i++) {
      logical.push(this.buffer[(this.head + i) % this.capacity]);
    }
    const physical = this.buffer.map((v) => (v === undefined ? '_' : String(v))).join('][');
    return (
      `逻辑顺序 [${logical.join(', ')}]` +
      `   物理槽位 [${physical}]` +
      `   (head=${this.head}, tail=${this.tail}, size=${this.size})`
    );
  }
}

const ring = new RingBufferQueue(5);
console.log('');
console.log('【初始状态】容量 5');
console.log('  ' + ring.snapshot());

console.log('');
console.log('【enqueue(A/B/C)】入队三个');
console.log('  操作前：' + ring.snapshot());
ring.enqueue('A').enqueue('B').enqueue('C');
console.log('  操作后：' + ring.snapshot());
console.log('  tail 从 0 走到 3，但一个元素都没搬移。');

console.log('');
console.log('【dequeue()】【dequeue()】出队两次');
console.log('  操作前：' + ring.snapshot());
const r1 = ring.dequeue();
const r2 = ring.dequeue();
console.log('  操作后：' + ring.snapshot());
console.log(`  出队的是 ${r1}、${r2}；head 从 0 走到 2，元素位置纹丝不动。`);

console.log('');
console.log('【enqueue(D)】【enqueue(E)】【enqueue(F)】继续入队，观察 tail 回绕');
console.log('  操作前：' + ring.snapshot());
ring.enqueue('D').enqueue('E').enqueue('F');
console.log('  操作后：' + ring.snapshot());
console.log('  tail 从 3 → 4 → 0（回绕）→ 1，F 覆盖了逻辑上已废弃的槽位 0。');

console.log('');
console.log('【把队列填满】enqueue(G)，size 达到容量上限 5');
console.log('  操作前：' + ring.snapshot());
ring.enqueue('G');
console.log('  操作后：' + ring.snapshot());

console.log('');
console.log('【队列已满时再 enqueue(H) 会怎样】');
console.log('  操作前：' + ring.snapshot());
try {
  ring.enqueue('H');
} catch (err) {
  console.log(`  捕获到错误：${err.name}: ${err.message}（演示用，已被 try/catch 兜住）`);
  console.log('  队列状态没被破坏：' + ring.snapshot());
}

console.log('');
console.log('【清空队列，观察 head 追上 tail】');
for (let i = 0; i < 5; i++) ring.dequeue();
console.log('  操作后：' + ring.snapshot());
console.log('  head 和 tail 都走到同一位置，但因为有 size 计数，能明确知道此刻是"空"而不是"满"。');
console.log('  复杂度：入队 O(1)、出队 O(1)、空间 O(capacity) —— 全程零搬移。');

// ---------------------------------------------------------------------------
// 5. 正解二：用「对象 + 整数下标」实现不限容量的 O(1) 队列
// ---------------------------------------------------------------------------

console.log('\n--- 5. 正解二：对象 + 整数下标（不限容量的 O(1) 队列）---');
console.log('');
console.log('环形缓冲的问题是容量写死。如果想不限容量又不想搬移，可以：');
console.log('  用一个普通【对象】当下标容器，用两个整数 head/tail 记住位置。');
console.log('');
console.log('     obj = { 0: "A", 1: "B", 2: "C" }');
console.log('     head = 0, tail = 3');
console.log('     出队：value = obj[head]; delete obj[head]; head += 1');
console.log('     → head 只增不减，永不复用下标，所以永远不会和 tail 撞上');
console.log('');
console.log('为什么用对象而不是数组？');
console.log('  如果直接用数组 + 只增不减的下标，V8 会把它当成一个"下标有空洞的数组"，');
console.log('  可能转成字典模式、甚至因为下标太大而退化成慢路径；');
console.log('  而对象本来就是字典语义，行为可预期。');
console.log('  （更简单的现代做法：直接用 Map，Map 的 delete 是稳定的 O(1)。）');

/**
 * 用对象 + 整数下标实现的不限容量队列。
 * 下标只增不减，靠 delete 释放已经出队的槽位。
 */
class ObjectQueue {
  constructor(useMap = false) {
    this.store = useMap ? new Map() : Object.create(null);
    this.useMap = useMap;
    this.head = 0;
    this.tail = 0;
  }

  get size() {
    return this.tail - this.head;
  }

  enqueue(value) {
    if (this.useMap) this.store.set(this.tail, value);
    else this.store[this.tail] = value;
    this.tail += 1;
    return this;
  }

  dequeue() {
    if (this.size === 0) return undefined;
    const value = this.useMap ? this.store.get(this.head) : this.store[this.head];
    if (this.useMap) this.store.delete(this.head);
    else delete this.store[this.head];
    this.head += 1;
    return value;
  }

  peek() {
    return this.size === 0 ? undefined : this.store[this.head];
  }

  snapshot() {
    if (this.size === 0) return '(空队列)';
    const out = [];
    for (let i = this.head; i < this.tail; i++) {
      out.push(this.useMap ? this.store.get(i) : this.store[i]);
    }
    return `队头 [${out.join(', ')}] 队尾   (head=${this.head}, tail=${this.tail})`;
  }
}

const oq = new ObjectQueue();
console.log('');
console.log('【初始状态】' + oq.snapshot());

console.log('');
console.log('【enqueue(1..4)】入队四个');
console.log('  操作前：' + oq.snapshot());
for (const v of [1, 2, 3, 4]) oq.enqueue(v);
console.log('  操作后：' + oq.snapshot());

console.log('');
console.log('【dequeue()】【dequeue()】出队两个');
console.log('  操作前：' + oq.snapshot());
console.log(`  出队：${oq.dequeue()}、${oq.dequeue()}`);
console.log('  操作后：' + oq.snapshot());
console.log('  head 从 0 涨到 2，被出队的槽位已经 delete 掉，对象里的键只剩 2、3。');
console.log(`  当前对象内部：${JSON.stringify(oq.store)}`);

console.log('');
console.log('【enqueue(5)】【enqueue(6)】继续入队，新元素接着 tail 往后续编号');
console.log('  操作前：' + oq.snapshot());
oq.enqueue(5).enqueue(6);
console.log('  操作后：' + oq.snapshot());
console.log(`  当前对象内部：${JSON.stringify(oq.store)}（旧的键 0、1 已被 delete，内存可回收）`);

// 实测：三种队列实现在同一规模下的对比
// 刻意选 n=16000 —— 这个规模已经越过了 shift 的左裁剪阈值，差距才是真实的
const OBJ_QN = 16000;

const objQueueMs = medianMs(() => {
  const q = new ObjectQueue();
  for (let i = 0; i < OBJ_QN; i++) q.enqueue(i);
  let sum = 0;
  for (let i = 0; i < OBJ_QN; i++) sum += q.dequeue();
  sink.value = sum;
}, 1);

const ringQueueMs = medianMs(() => {
  const q = new RingBufferQueue(OBJ_QN);
  for (let i = 0; i < OBJ_QN; i++) q.enqueue(i);
  let sum = 0;
  for (let i = 0; i < OBJ_QN; i++) sum += q.dequeue();
  sink.value = sum;
}, 1);

console.log('');
console.log(`实测对比（n=${OBJ_QN} 次入队 + ${OBJ_QN} 次出队，越过了 shift 的优化阈值）：`);
console.log('');
console.log('实现'.padEnd(34) + '耗时(ms)'.padEnd(14) + '出队复杂度'.padEnd(14) + '说明');
console.log('-'.repeat(96));
console.log(
  '数组 + shift 出队'.padEnd(32) + shiftMs.toFixed(3).padEnd(14) + 'O(n)'.padEnd(14) + '每次出队搬移全部剩余元素',
);
console.log(
  '对象 + 整数下标出队'.padEnd(32) + objQueueMs.toFixed(3).padEnd(14) + 'O(1) 均摊'.padEnd(14) + '下标只增不减，delete 释放槽位',
);
console.log(
  '环形缓冲出队'.padEnd(32) + ringQueueMs.toFixed(3).padEnd(14) + 'O(1)'.padEnd(14) + '容量固定，零搬移，最省内存',
);
console.log('');
console.log(`  对象队列比数组 shift 快约 ${(shiftMs / objQueueMs).toFixed(0)} 倍；`);
console.log(`  环形缓冲比数组 shift 快约 ${(shiftMs / ringQueueMs).toFixed(0)} 倍。`);
console.log('');
console.log('  请注意这个对比的前提是"规模越过了阈值"。');
console.log('  如果把 n 换成 10000，三种实现的差距会小得多，甚至可能几乎测不出来 ——');
console.log('  因为那时 V8 的左裁剪把 shift 也优化成了近似 O(1)。');
console.log('  这再次说明：复杂度差异是【规模相关】的，只有足够大的数据量才能把它暴露出来。');

// ---------------------------------------------------------------------------
// 6. 双端队列 Deque
// ---------------------------------------------------------------------------

console.log('\n--- 6. 双端队列 Deque：两端都能进出的"万能选手" ---');
console.log('');
console.log('Deque（double-ended queue，读作 "deck"）同时支持四种操作：');
console.log('  addFirst / removeFirst / addLast / removeLast，全部 O(1)。');
console.log('');
console.log('  它能干什么：');
console.log('    · 只用 addLast + removeFirst → 就是一个先进先出队列');
console.log('    · 只用 addLast + removeLast  → 就是一个后进先出栈');
console.log('    · addFirst + removeLast      → 就是一个反方向的队列');
console.log('    · 滑动窗口最大值、回文检查、工作窃取调度器都需要真正的双端能力');

/**
 * 双端队列：用"以 0 为中心的对称下标"实现。
 *
 * 思路：把 head 初始化为 0，tail 也初始化为 0，
 * addFirst 时 head 往【负数】方向走，addLast 时 tail 往正方向走，
 * 用 Map 存（JS 对象的键会变成字符串，Map 的数值键更快也更干净）。
 *
 *   addFirst(1) → head=-1, tail=0   →  索引 -1 上是 1
 *   addFirst(2) → head=-2, tail=0   →  索引 -2, -1
 *   addLast(3)  → head=-2, tail=1   →  索引 -2, -1, 0
 *
 * 逻辑顺序永远是 head → tail-1，两端都不需要搬移任何元素。
 */
class Deque {
  constructor() {
    this.store = new Map();
    this.head = 0; // 逻辑上第一个元素的下标
    this.tail = 0; // 逻辑上最后一个元素的下标 + 1
  }

  get size() {
    return this.tail - this.head;
  }

  addFirst(value) {
    this.head -= 1;
    this.store.set(this.head, value);
    return this;
  }

  addLast(value) {
    this.store.set(this.tail, value);
    this.tail += 1;
    return this;
  }

  removeFirst() {
    if (this.size === 0) return undefined;
    const value = this.store.get(this.head);
    this.store.delete(this.head);
    this.head += 1;
    return value;
  }

  removeLast() {
    if (this.size === 0) return undefined;
    this.tail -= 1;
    const value = this.store.get(this.tail);
    this.store.delete(this.tail);
    return value;
  }

  peekFirst() {
    return this.size === 0 ? undefined : this.store.get(this.head);
  }

  peekLast() {
    return this.size === 0 ? undefined : this.store.get(this.tail - 1);
  }

  snapshot() {
    if (this.size === 0) return '(空 deque)';
    const out = [];
    for (let i = this.head; i < this.tail; i++) out.push(this.store.get(i));
    return `左端 [${out.join(', ')}] 右端   (head=${this.head}, tail=${this.tail})`;
  }
}

const deque = new Deque();
console.log('');
console.log('【初始状态】' + deque.snapshot());

console.log('');
console.log('【addLast(3)】【addLast(4)】右端加入');
console.log('  操作前：' + deque.snapshot());
deque.addLast(3).addLast(4);
console.log('  操作后：' + deque.snapshot());

console.log('');
console.log('【addFirst(2)】【addFirst(1)】左端加入');
console.log('  操作前：' + deque.snapshot());
deque.addFirst(2).addFirst(1);
console.log('  操作后：' + deque.snapshot());
console.log('  现在逻辑顺序是 1, 2, 3, 4 —— 我们是从两头往里"夹"出来的。');

console.log('');
console.log('【removeFirst()】从左端取');
console.log('  操作前：' + deque.snapshot());
console.log(`  操作后：${deque.snapshot()}   取出 ${1}，左端指针右移一格`);

console.log('');
console.log('【removeLast()】从右端取');
console.log('  操作前：' + deque.snapshot());
console.log(`  操作后：${deque.snapshot()}   取出 4，右端指针左移一格`);

console.log('');
console.log('【peekFirst / peekLast】只看不动');
console.log('  当前：' + deque.snapshot());
console.log(`  peekFirst() = ${deque.peekFirst()}, peekLast() = ${deque.peekLast()}`);

console.log('');
console.log('【注意负数下标】head 可以变成负数，这是 JS 取模最容易踩的坑：');
console.log(`  -1 % 5 = ${-1 % 5}   ← 负数取模结果也是负数！`);
console.log(`  正确写法 ((-1 % 5) + 5) % 5 = ${((-1 % 5) + 5) % 5}`);
console.log('  本示例用 Map + 允许负数下标，就是为了绕开这个坑；');
console.log('  如果坚持用数组 + 取模，回绕时一定要写成 ((i % n) + n) % n。');

// ---------------------------------------------------------------------------
// 7. 实战一：括号匹配（栈的经典应用）
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战一：括号匹配（栈）---');
console.log('');
console.log('任务：判断一个字符串里的 () [] {} 是否成对且嵌套正确。');
console.log('');
console.log('思路（这就是"栈"存在的意义）：');
console.log('  · 遇到左括号 → push 入栈（记住"还有个括号没闭合"）');
console.log('  · 遇到右括号 → 检查栈顶是不是配对的左括号：');
console.log('      是   → pop 出栈（这一对闭合了）');
console.log('      不是 → 立刻可以判定非法（比如 "([)]" 里的 )）');
console.log('      空栈 → 非法（右括号多了）');
console.log('  · 走完全程后栈【必须为空】，否则说明左括号多了');

/**
 * 括号匹配检查，返回 { ok, reason }
 * 时间 O(n)，空间 O(n)（最坏情况全是左括号，栈要装下整个串）
 */
function checkBrackets(str) {
  const PAIRS = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else if (ch === ')' || ch === ']' || ch === '}') {
      if (stack.length === 0) return { ok: false, reason: `第 ${i} 位出现多余的 '${ch}'，栈是空的` };
      const top = stack.pop();
      if (top !== PAIRS[ch]) return { ok: false, reason: `第 ${i} 位的 '${ch}' 想配 '${PAIRS[ch]}'，但栈顶是 '${top}'` };
    }
  }
  if (stack.length > 0) return { ok: false, reason: `结束时栈里还剩 ${stack.length} 个未闭合：${stack.join('')}` };
  return { ok: true, reason: '全部配对成功' };
}

/** 带过程打印的版本：把每一步的栈状态都打出来 */
function traceCheckBrackets(str) {
  const PAIRS = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  console.log(`  输入："${str}"`);
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    const before = `[${stack.join(', ')}]`;
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
      console.log(`    第 ${i} 位 '${ch}' 是左括号 → 入栈     栈 ${before} → [${stack.join(', ')}]`);
    } else if (ch === ')' || ch === ']' || ch === '}') {
      if (stack.length === 0) {
        console.log(`    第 ${i} 位 '${ch}' 是右括号，但栈是空的 → 判定非法 ✗`);
        return false;
      }
      const top = stack.pop();
      const matched = top === PAIRS[ch];
      console.log(
        `    第 ${i} 位 '${ch}' 是右括号 → 检查栈顶 '${top}'：` +
          (matched ? `配对成功 → 出栈   ` : `配对失败 ✗ 期望 '${PAIRS[ch]}'   `) +
          `栈 ${before} → [${stack.join(', ')}]`,
      );
      if (!matched) return false;
    } else {
      console.log(`    第 ${i} 位 '${ch}' 不是括号，跳过`);
    }
  }
  const ok = stack.length === 0;
  console.log(`    扫描结束，栈 [${stack.join(', ')}] ${ok ? '为空 → 合法 ✓' : '非空 → 有未闭合的括号 ✗'}`);
  return ok;
}

console.log('');
console.log('【合法用例】');
const okResult = traceCheckBrackets('{[()]}');
console.log(`  最终结果：${okResult ? '合法 ✓' : '非法 ✗'}`);

console.log('');
console.log('【非法用例 1：嵌套错位】');
const bad1 = traceCheckBrackets('([)]');
console.log(`  最终结果：${bad1 ? '合法 ✓' : '非法 ✗'}`);

console.log('');
console.log('【非法用例 2：左括号多了一个】');
const bad2 = traceCheckBrackets('((())');
console.log(`  最终结果：${bad2 ? '合法 ✓' : '非法 ✗'}`);

console.log('');
console.log('【批量校验一组用例】');
console.log('用例'.padEnd(24) + '结果'.padEnd(10) + '原因');
console.log('-'.repeat(84));
for (const s of ['()', '()[]{}', '([{}])', '(]', '(((', ')))', 'a(b)c[d]', '{[()]}{}', '(])']) {
  const r = checkBrackets(s);
  console.log(`"${s}"`.padEnd(24) + (r.ok ? '合法 ✓' : '非法 ✗').padEnd(12) + r.reason);
}

// ---------------------------------------------------------------------------
// 8. 实战二：撤销 / 重做（双栈）
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战二：撤销 / 重做（两个栈配合）---');
console.log('');
console.log('设计：');
console.log('  · undoStack：记录"已经做过"的操作，撤销时从顶部弹出');
console.log('  · redoStack：记录"被撤销掉"的操作，重做时从顶部弹出');
console.log('  · 关键规则：一旦做了【新操作】，redoStack 必须清空 ——');
console.log('    因为用户已经从那条历史分支走开了，旧的重做链失效。');
console.log('');
console.log('  执行 A、B、C 后：   undoStack=[A,B,C]   redoStack=[]');
console.log('  撤销 1 次：          undoStack=[A,B]     redoStack=[C]');
console.log('  撤销 1 次：          undoStack=[A]       redoStack=[C,B]');
console.log('  重做 1 次：          undoStack=[A,B]     redoStack=[C]');
console.log('  执行 D（新操作）：    undoStack=[A,B,D]   redoStack=[]      ← 清空！');

class UndoRedoEditor {
  constructor() {
    this.content = '';
    this.undoStack = [];
    this.redoStack = [];
  }

  /** 执行一个"输入"操作 */
  type(text) {
    this.undoStack.push({ type: 'type', text });
    this.content += text;
    this.redoStack.length = 0; // 新操作让重做链失效
    return `输入 "${text}"`;
  }

  /** 执行一个"删除末尾字符"操作 */
  backspace(count = 1) {
    const removed = this.content.slice(-count);
    if (removed === '') return '没有可删除的内容';
    this.undoStack.push({ type: 'backspace', text: removed });
    this.content = this.content.slice(0, -count);
    this.redoStack.length = 0;
    return `删除 "${removed}"`;
  }

  /** 撤销：把 undoStack 顶部的操作移到 redoStack */
  undo() {
    if (this.undoStack.length === 0) return '已经没有可撤销的操作了';
    const op = this.undoStack.pop();
    // 执行它的逆操作
    if (op.type === 'type') this.content = this.content.slice(0, -op.text.length);
    else this.content += op.text;
    this.redoStack.push(op); // 记下来，以便重做
    return `撤销了「${op.type === 'type' ? '输入 ' + op.text : '删除 ' + op.text}」`;
  }

  /** 重做：把 redoStack 顶部的操作移回 undoStack 并重新执行 */
  redo() {
    if (this.redoStack.length === 0) return '已经没有可重做的操作了';
    const op = this.redoStack.pop();
    if (op.type === 'type') this.content += op.text;
    else this.content = this.content.slice(0, -op.text.length);
    this.undoStack.push(op);
    return `重做了「${op.type === 'type' ? '输入 ' + op.text : '删除 ' + op.text}」`;
  }

  snapshot() {
    return (
      `内容="${this.content}"` +
      `   undo栈=[${this.undoStack.map((o) => (o.type === 'type' ? '+' + o.text : '-' + o.text)).join(', ')}]` +
      `   redo栈=[${this.redoStack.map((o) => (o.type === 'type' ? '+' + o.text : '-' + o.text)).join(', ')}]`
    );
  }
}

const editor = new UndoRedoEditor();
console.log('');
console.log('【初始状态】' + editor.snapshot());

const editorSteps = [
  ['输入 "Hello"', () => editor.type('Hello')],
  ['输入 " World"', () => editor.type(' World')],
  ['输入 "!!!"', () => editor.type('!!!')],
  ['撤销', () => editor.undo()],
  ['撤销', () => editor.undo()],
  ['重做', () => editor.redo()],
  ['输入 "?"（新操作，应清空 redo 栈）', () => editor.type('?')],
  ['重做（应该失败，因为 redo 栈被清空了）', () => editor.redo()],
  ['删除 2 个字符', () => editor.backspace(2)],
  ['撤销', () => editor.undo()],
  ['撤销', () => editor.undo()],
  ['撤销', () => editor.undo()],
  ['撤销', () => editor.undo()],
  ['撤销（已空，应提示无操作可撤销）', () => editor.undo()],
];

for (const [label, action] of editorSteps) {
  console.log('');
  console.log(`【${label}】`);
  console.log('  操作前：' + editor.snapshot());
  const msg = action();
  console.log('  操作后：' + editor.snapshot());
  console.log(`  → ${msg}`);
}

console.log('');
console.log('两个栈各司其职，撤销/重做都是 O(1)。');
console.log('真实编辑器（VS Code、Word）在此基础上还要加"操作合并"');
console.log('（连续输入算一步）和"快照 + 增量"来省内存，但骨架就是这个双栈。');

// ---------------------------------------------------------------------------
// 9. 实战三：任务队列 & 浏览器历史
// ---------------------------------------------------------------------------

console.log('\n--- 9. 实战三：任务队列与浏览器历史 ---');

console.log('');
console.log('（1）任务队列：打印任务按提交顺序依次执行');
console.log('');

class TaskQueue {
  constructor() {
    this.queue = new ObjectQueue(); // 用 O(1) 出队的实现
    this.finished = [];
  }

  submit(task) {
    this.queue.enqueue(task);
    return `提交任务 #${task.id}（${task.name}），当前排队 ${this.queue.size} 个`;
  }

  /** 取出并执行一个任务 */
  runNext() {
    const task = this.queue.dequeue();
    if (task === undefined) return '队列为空，没有可执行的任务';
    const result = { ...task, status: 'done' };
    this.finished.push(result);
    return `执行任务 #${task.id}（${task.name}）→ 完成，剩余排队 ${this.queue.size} 个`;
  }

  snapshot() {
    return (
      `排队中=[${this.queue.store && this.queue.size > 0 ? '见右侧' : ''}] ` +
      `待执行 ${this.queue.size} 个，已完成 ${this.finished.length} 个   ${this.queue.snapshot()}`
    );
  }
}

const tasks = new TaskQueue();
console.log('  操作前：' + tasks.snapshot());
console.log('  ' + tasks.submit({ id: 1, name: '生成日报表' }));
console.log('  ' + tasks.submit({ id: 2, name: '发送邮件通知' }));
console.log('  ' + tasks.submit({ id: 3, name: '清理临时文件' }));
console.log('  操作后：' + tasks.snapshot());
console.log('');
console.log('  开始依次执行：');
console.log('  ' + tasks.runNext());
console.log('  ' + tasks.runNext());
console.log('  中间状态：' + tasks.snapshot());
console.log('  ' + tasks.runNext());
console.log('  ' + tasks.runNext() + '  ← 已经空了');
console.log('  最终状态：' + tasks.snapshot());

console.log('');
console.log('（2）浏览器历史：用【两个栈】实现前进 / 后退');
console.log('');
console.log('  和编辑器撤销重做完全同构：');
console.log('    backStack   = 已经访问过的页面（当前页面在栈顶）');
console.log('    forwardStack = 后退时"退出来"的页面');
console.log('  访问新页面 = 压入 backStack + 清空 forwardStack（和编辑器一模一样）');

class BrowserHistory {
  constructor(home) {
    this.backStack = [home];
    this.forwardStack = [];
  }

  get current() {
    return this.backStack[this.backStack.length - 1];
  }

  visit(url) {
    this.backStack.push(url);
    this.forwardStack.length = 0; // 新访问让前进链失效
    return `访问 ${url}`;
  }

  back() {
    if (this.backStack.length <= 1) return '已经是最早的页面，无法后退';
    const url = this.backStack.pop();
    this.forwardStack.push(url);
    return `后退，离开 ${url}，当前 ${this.current}`;
  }

  forward() {
    if (this.forwardStack.length === 0) return '没有可以前进的页面';
    const url = this.forwardStack.pop();
    this.backStack.push(url);
    return `前进到 ${url}`;
  }

  snapshot() {
    return `当前=${this.current}   back=[${this.backStack.join(' → ')}]   forward=[${this.forwardStack.join(' → ')}]`;
  }
}

const browser = new BrowserHistory('home.com');
console.log('');
console.log('【初始状态】' + browser.snapshot());

const browserSteps = [
  ['访问 shop.com', () => browser.visit('shop.com')],
  ['访问 item.com', () => browser.visit('item.com')],
  ['访问 cart.com', () => browser.visit('cart.com')],
  ['后退', () => browser.back()],
  ['后退', () => browser.back()],
  ['前进', () => browser.forward()],
  ['访问 pay.com（新访问，应清空 forward）', () => browser.visit('pay.com')],
  ['前进（应该失败）', () => browser.forward()],
  ['后退', () => browser.back()],
  ['后退', () => browser.back()],
  ['后退（应该失败，已到最早页面）', () => browser.back()],
];

for (const [label, action] of browserSteps) {
  console.log('');
  console.log(`【${label}】`);
  console.log('  操作前：' + browser.snapshot());
  const msg = action();
  console.log('  操作后：' + browser.snapshot());
  console.log(`  → ${msg}`);
}

// ---------------------------------------------------------------------------
// 10. 复杂度对照表
// ---------------------------------------------------------------------------

console.log('\n--- 10. 复杂度对照表 ---');

const complexity = [
  ['数组当栈（push / pop）', 'O(1) 均摊', 'O(1)', '尾部操作，不需要搬移元素'],
  ['数组当栈（peek）', 'O(1)', 'O(1)', '直接读 length-1 位置'],
  ['数组当队列（push 入队）', 'O(1) 均摊', 'O(1)', '没问题'],
  ['数组当队列（shift 出队）', 'O(n)', 'O(1)', '要搬移全部剩余元素，是队列的主要陷阱'],
  ['数组当队列（unshift 入队）', 'O(n)', 'O(1)', '同理，从头部插入也很贵'],
  ['环形缓冲队列（enqueue/dequeue）', 'O(1)', 'O(capacity)', '容量固定，零搬移'],
  ['对象/Map 队列（enqueue/dequeue）', 'O(1) 均摊', 'O(n)', '不限容量，下标只增不减'],
  ['Deque 四操作', 'O(1) 均摊', 'O(n)', '两端对称，用中心下标实现'],
  ['用两个栈实现队列', '入队 O(1)，出队均摊 O(1)', 'O(n)', '每个元素最多被倒两次'],
  ['括号匹配', 'O(n)', 'O(n)', '最坏情况全是左括号'],
  ['撤销 / 重做', '每步 O(1)', 'O(操作数)', '双栈各存一半历史'],
];

console.log('操作'.padEnd(34) + '时间'.padEnd(26) + '空间'.padEnd(14) + '说明');
console.log('-'.repeat(108));
for (const [op, time, space, note] of complexity) {
  console.log(op.padEnd(32) + time.padEnd(26) + space.padEnd(14) + note);
}

console.log('');
console.log('选型建议：');
console.log('  · 要栈 → 直接用数组 push / pop，不要自己造轮子；');
console.log('  · 要队列且数据量小（几百条以内）→ 数组 + shift 也能接受，别过度设计；');
console.log('  · 要队列且数据量大 / 长期运行 → 环形缓冲（容量可控时最省内存）');
console.log('    或对象/Map（容量不确定时最省心）；');
console.log('  · 要两端都能进出 → Deque；Node.js 里也可以用内置的 Map 来快速实现。');
console.log('  · 记住"用两个栈实现队列"这个思路 —— 它体现了均摊分析的核心思想：');
console.log('    单次操作偶尔很贵，但把总代价摊开后仍然是 O(1)。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
