/**
 * ============================================================================
 * 知识点：push / pop / shift / unshift —— 四种增删方法与栈、队列模拟
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】08_arrays/01_create_and_access.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这是数组最基础的四个"增删"方法，它们都**直接修改原数组（mutating）**：
 *
 *      方法        作用位置        行为                        返回值
 *      ----------  --------------  --------------------------  ----------------
 *      push(x)     末尾            追加一个或多个元素          新的 length（数字）
 *      pop()       末尾            删除并取出最后一个元素      被删掉的那个元素
 *      unshift(x)  开头            在头部插入一个或多个元素    新的 length（数字）
 *      shift()     开头            删除并取出第一个元素        被删掉的那个元素
 *
 *    记忆口诀：push/pop 操作"尾部"，unshift/shift 操作"头部"。
 *    push 与 pop 是"后进先出"（LIFO），即栈（Stack）的两端；
 *    push 与 shift 配合是"先进先出"（FIFO），即队列（Queue）的两端。
 *
 * 2. 为什么需要它们
 *    数组如果不支持增删，就只能作为"定长容器"使用。有了这四个方法，数组可以当
 *    栈用（函数调用栈、撤销/重做、括号匹配）、当队列用（任务调度、消息队列、
 *    广度优先搜索的待访问列表），也可以作为普通的动态列表使用。
 *
 * 3. 核心语法要点
 *    (1) push / unshift 可以一次追加多个元素，参数顺序即插入顺序；
 *    (2) pop / shift 对空数组调用返回 undefined，不报错（常见陷阱）；
 *    (3) push / unshift 返回的是新的 length，不是数组本身 —— 所以不能链式调用
 *        arr.push(1).push(2)，第二句会报 "push is not a function"；
 *    (4) 想"链式"用数组方法，应该用返回新数组的方法（concat、slice、map、filter）。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】这四个方法**全部修改原数组**。想在不改变原数组的前提下
 *      增删，请用 arr.concat([x]) / arr.slice(1) / [...arr, x] / [x, ...arr]。
 *    - unshift / shift 的时间复杂度是 O(n)：因为要挪动后面所有元素的下标。
 *      在超长数组上频繁 shift 会很慢。此时改用"索引游标"或双端队列（Deque）更合适。
 *    - pop 的返回值容易被误解：它返回"被删除的元素"，不是新数组，也不是 length。
 *    - 对空数组 pop/shift 返回 undefined，若代码没做判断，很容易把 undefined 当成
 *      真实数据继续往下传，引发连锁错误。
 *    - 用 `arr[arr.length] = x` 追加虽然可行，但不如 push 语义清晰，且不能一次加多个。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/02_push_pop_shift_unshift.js
 *
 * 【预期输出】
 *   依次演示四个方法的返回值与原数组变化、多参数用法、空数组的边界行为，
 *   最后用它们实现栈（LIFO）与队列（FIFO）两个小例子。
 * ============================================================================
 */

// 打印辅助：同时展示"数组内容"和"长度"，便于观察修改。
function show(label, arr) {
  console.log(`${label} -> ${JSON.stringify(arr)}  (length = ${arr.length})`);
}

// ---------------------------------------------------------------------------
// 1. push：在末尾追加，返回新长度
// ---------------------------------------------------------------------------

console.log('--- 1. push：末尾追加（修改原数组）---');

const stack = ['a', 'b'];
show('初始', stack);

// push 返回新长度
const newLen = stack.push('c');
console.log('push("c") 的返回值 =', newLen, '（是新的 length，不是数组）');
show('push 之后', stack);

// 一次追加多个，按参数顺序插入
stack.push('d', 'e');
show('push("d", "e") 之后', stack);

// 常见误用：push 返回数字，不能链式调用
const bad = ['x'];
const result = bad.push('y');
try {
  result.push('z'); // result 是数字 2，没有 push 方法
} catch (err) {
  console.log('对 push 的返回值链式调用会报错：', err.constructor.name, '-', err.message);
}

// ---------------------------------------------------------------------------
// 2. pop：删除并返回末尾元素（修改原数组）
// ---------------------------------------------------------------------------

console.log('\n--- 2. pop：末尾删除（修改原数组）---');

const popped = [...stack]; // 拷贝一份，避免影响上面的 stack
show('拷贝后的数组', popped);

const last = popped.pop();
console.log('pop() 的返回值 =', JSON.stringify(last), '（是被删掉的元素）');
show('pop 之后', popped);

// 连续 pop 会依次从后往前取出
console.log('连续 pop：', popped.pop(), popped.pop(), popped.pop());
show('pop 空之后', popped);

// 边界：对空数组 pop，返回 undefined，不报错
const emptyPop = [].pop();
console.log('对空数组 pop() =', emptyPop, '（不报错，返回 undefined）');

// ---------------------------------------------------------------------------
// 3. unshift：在开头插入，返回新长度（修改原数组）
// ---------------------------------------------------------------------------

console.log('\n--- 3. unshift：头部插入（修改原数组）---');

const queue = ['b', 'c'];
show('初始', queue);

const len2 = queue.unshift('a');
console.log('unshift("a") 的返回值 =', len2);
show('unshift 之后', queue);

// 多参数：按参数顺序插到最前面（不是倒序）
queue.unshift('x', 'y');
show('unshift("x", "y") 之后', queue);
console.log('注意顺序：x 在前、y 在后，且都在原有的 a 之前');

// ---------------------------------------------------------------------------
// 4. shift：删除并返回开头元素（修改原数组）
// ---------------------------------------------------------------------------

console.log('\n--- 4. shift：头部删除（修改原数组）---');

const q2 = [...queue];
const first = q2.shift();
console.log('shift() 的返回值 =', JSON.stringify(first));
show('shift 之后', q2);

// 边界：对空数组 shift，同样返回 undefined
console.log('对空数组 shift() =', [].shift(), '（不报错，返回 undefined）');

// 用 shift 依次清空
while (q2.length > 0) {
  q2.shift();
}
show('while + shift 清空后', q2);

// ---------------------------------------------------------------------------
// 5. 综合对比表（用输出打印出来）
// ---------------------------------------------------------------------------

console.log('\n--- 5. 四个方法的对比 ---');

const demo = [1, 2, 3];
const snapshot = [...demo];

const retPush = demo.push(4);
console.log(`push(4)     -> 返回 ${retPush}（新长度），数组变为 ${JSON.stringify(demo)}`);

const retPop = demo.pop();
console.log(`pop()       -> 返回 ${retPop}（被删元素），数组变为 ${JSON.stringify(demo)}`);

const retUnshift = demo.unshift(0);
console.log(`unshift(0)  -> 返回 ${retUnshift}（新长度），数组变为 ${JSON.stringify(demo)}`);

const retShift = demo.shift();
console.log(`shift()     -> 返回 ${retShift}（被删元素），数组变为 ${JSON.stringify(demo)}`);

console.log('原快照 =', JSON.stringify(snapshot), '，最终 =', JSON.stringify(demo), '（确实被改过）');

// ---------------------------------------------------------------------------
// 6. 实战一：用 push / pop 实现"栈"（LIFO，后进先出）
// ---------------------------------------------------------------------------

console.log('\n--- 6. 栈（LIFO）---');

// 栈：只能在顶部进、顶部出。对应 push（进栈）与 pop（出栈）。
const browserHistory = [];
browserHistory.push('首页');
browserHistory.push('商品列表');
browserHistory.push('商品详情');
show('浏览历史栈', browserHistory);

console.log('点击"后退"：回到', browserHistory.pop());
console.log('再点一次"后退"：回到', browserHistory.pop());
show('剩余历史', browserHistory);

// 一个更实用的例子：检查括号是否配对
function isBalanced(str) {
  const stackArr = [];
  const pairs = { ')': '(', ']': '[', '}': '{' };
  for (const ch of str) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stackArr.push(ch);
    } else if (ch === ')' || ch === ']' || ch === '}') {
      if (stackArr.pop() !== pairs[ch]) return false;
    }
  }
  return stackArr.length === 0;
}
console.log('isBalanced("([]{})") =', isBalanced('([]{})'));
console.log('isBalanced("([)]") =', isBalanced('([)]'));
console.log('isBalanced(")(") =', isBalanced(')('));

// ---------------------------------------------------------------------------
// 7. 实战二：用 push / shift 实现"队列"（FIFO，先进先出）
// ---------------------------------------------------------------------------

console.log('\n--- 7. 队列（FIFO）---');

const taskQueue = [];
taskQueue.push('任务A');
taskQueue.push('任务B');
taskQueue.push('任务C');
show('待处理队列', taskQueue);

while (taskQueue.length > 0) {
  const task = taskQueue.shift(); // 从头取出，保证先来的先做
  console.log('处理：', task);
}
show('全部处理完', taskQueue);

// 也可以反向做：unshift 进队头 + pop 出队尾，效果同样是 FIFO。
const q3 = [];
q3.unshift('任务A');
q3.unshift('任务B');
q3.unshift('任务C');
show('用 unshift 入队的队列', q3);
console.log('pop 出队：', q3.pop(), '（先入的 A 先出，仍是 FIFO）');

// ---------------------------------------------------------------------------
// 8. 性能提示与"不可变"替代方案
// ---------------------------------------------------------------------------

console.log('\n--- 8. shift/unshift 的性能与不可变替代 ---');

const big = Array.from({ length: 5 }, (_, i) => i + 1);
console.log('原数组 =', big);

// 不可变追加：产生新数组，原数组不动
const appended = [...big, 6];
const appended2 = big.concat([6]);
console.log('不可变追加 [...big, 6] =', appended, '；big 没变 =', big);
console.log('不可变追加 big.concat([6]) =', appended2, '；big 没变 =', big);

// 不可变"删除头部"：用 slice（不修改原数组，见 03 号文件）
const withoutFirst = big.slice(1);
console.log('不可变删除头部 big.slice(1) =', withoutFirst, '；big 没变 =', big);

console.log('提示：shift()/unshift() 是 O(n)，在十万级数组上循环调用会明显变慢；');
console.log('      如果只是"从头遍历"，用一个索引变量 i 递增即可，不必真的删元素。');

// 尾调用优化式的"索引游标"写法
let cursor = 0;
const data = ['d1', 'd2', 'd3'];
while (cursor < data.length) {
  console.log('游标遍历：', data[cursor]);
  cursor++;
}
console.log('遍历结束，data 依然是完整的 =', data);
