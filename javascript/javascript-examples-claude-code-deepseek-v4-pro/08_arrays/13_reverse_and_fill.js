/**
 * ============================================================================
 * 知识点：reverse / fill / copyWithin —— 三个就地修改数组的方法
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】进阶
 * 【前置知识】08_arrays/12_sort.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    这三个方法的共同点是：**都在原数组上就地修改，都返回被修改后的原数组本身**
 *    （不是新数组）。它们是数组方法里"破坏性"最强的一类。
 *
 *      reverse()                     反转整个数组的元素顺序
 *      fill(value, start, end)       用同一个值填充 [start, end) 区间
 *      copyWithin(target, start, end) 把 [start, end) 的元素复制到 target 位置（原地覆盖）
 *
 * 2. 为什么需要它
 *    - reverse：排行榜倒序展示、"最近一条在最前"、栈/队列的变换；
 *    - fill：初始化定长数组（`Array(5).fill(0)`）、把一段时间标记为"已读"、
 *      重置棋盘/画布缓冲区；
 *    - copyWithin：性能敏感的数据搬运（TypedArray 场景常用），
 *      例如滑动窗口里"整体左移一格"。
 *
 * 3. 核心语法要点
 *    (1) reverse()：不需要参数。首尾两两交换，所以是 O(n) 的原地操作。
 *    (2) fill(value, start, end)：
 *        - start 默认 0，end 默认 arr.length；
 *        - start/end 支持负数（从末尾数）；
 *        - 区间是 [start, end)，**不含 end**；
 *        - 返回原数组本身；
 *        - value 是引用类型时，所有位置会指向**同一个对象**（经典陷阱，见第 4 节）。
 *    (3) copyWithin(target, start, end)：
 *        - 把 [start, end) 的**元素值**复制到从 target 开始的位置；
 *        - 三个参数都支持负数，都会先按"从末尾数"换算，再夹紧到 [0, length]；
 *        - 复制是"先取出快照再写入"语义（内部用 memmove 般的处理），
 *          所以源区间和目标区间重叠也不会出问题；
 *        - 不改变数组长度，超出部分被截断；
 *        - 返回原数组本身。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**三个方法都会修改原数组**（mutating），
 *      并且返回值就是原数组（`arr.reverse() === arr` 为 true）。
 *      想不动原数组：
 *        reverse  -> [...arr].reverse() 或 arr.toReversed()（ES2023）
 *        fill     -> [...arr].fill(...) 或 arr.with(i, v)（ES2023，单点替换）
 *      copyWithin 没有直接的"不可变版本"，需要自己手动拼。
 *    - **fill 传对象会共享引用**：`Array(3).fill({})` 得到的是三个指向同一对象的元素，
 *      改其中一个，三个都变。要独立对象得用 `Array.from({length: 3}, () => ({}))`。
 *    - `new Array(3).fill(0)` 与 `[0, 0, 0]` 等价，但 `new Array(3)` 是稀疏的、
 *      并没有元素 —— 忘了 fill 就会在 map 时踩到空洞。
 *    - fill 不传 start/end 时是"整个数组填满"，会**覆盖掉所有原数据**。
 *    - reverse 之后原数组的引用没变，如果别处还持有这个数组，它看到的内容也变了。
 *    - fill 只接受"一个值"，要按规则填（如 1,2,3,4）得用 map 或 Array.from。
 *    - copyWithin 的名字容易误解：第一个参数是"目标位置"，第二个是"数据来源开始位置"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/13_reverse_and_fill.js
 *
 * 【预期输出】
 *   依次演示 reverse 的原地反转与不可变替代、fill 的区间/负数参数/对象引用陷阱、
 *   copyWithin 的搬运规则，最后给出成绩单、画布缓冲、滑动窗口等实战例子。
 * ============================================================================
 */

function show(label, arr) {
  console.log(`${label} -> ${JSON.stringify(arr)}  (length = ${arr.length})`);
}

// ---------------------------------------------------------------------------
// 1. reverse：原地反转
// ---------------------------------------------------------------------------

console.log('--- 1. reverse ---');

const letters = ['a', 'b', 'c', 'd'];
show('原数组', letters);

const revResult = letters.reverse();
console.log('reverse() 的返回值 =', JSON.stringify(revResult));
console.log('返回值是原数组吗？', revResult === letters, '（true，同一个引用）');
show('reverse 之后', letters);

// 再 reverse 一次就回到原样（说明它是"自己"在被改）
letters.reverse();
show('再 reverse 一次', letters);

// 不修改原数组的三种写法
const keep = [1, 2, 3];
console.log('\n不修改原数组的写法：');
console.log('1) [...keep].reverse()  =', JSON.stringify([...keep].reverse()));
console.log('2) keep.slice().reverse() =', JSON.stringify(keep.slice().reverse()));
console.log('3) keep.toReversed()    =', JSON.stringify(keep.toReversed()), '（ES2023，返回新数组）');
show('keep 始终没变', keep);

// 用 reverse 做"倒序遍历"
const nums = [1, 2, 3];
console.log('\n倒序遍历（不改数组的写法）：');
for (let i = nums.length - 1; i >= 0; i--) {
  process.stdout.write(`  ${nums[i]}`);
}
console.log();
console.log('不拷贝直接 reverse 再遍历（会改数组）：');
const numsCopy = nums.slice();
for (const n of numsCopy.reverse()) {
  process.stdout.write(`  ${n}`);
}
console.log();

// 字符串反转（字符串没有 reverse，要借数组中转）
const word = 'hello';
const reversedWord = [...word].reverse().join('');
console.log('\n字符串反转 =', JSON.stringify(word), '->', JSON.stringify(reversedWord));
console.log('（注意 emoji：\'a😀b\' 反转 =', JSON.stringify([...'a😀b'].reverse().join('')), '，用展开运算符才安全）');

// ---------------------------------------------------------------------------
// 2. 实战：reverse 的常见处理
// ---------------------------------------------------------------------------

console.log('\n--- 2. reverse 实战 ---');

// 消息列表：最新的排最前
const messages = [
  { id: 1, text: '第一条', at: '09:00' },
  { id: 2, text: '第二条', at: '10:00' },
  { id: 3, text: '第三条', at: '11:00' },
];
console.log('按时间正序 =', JSON.stringify(messages.map((m) => m.text)));
const newestFirst = messages.toReversed();
console.log('最新在前   =', JSON.stringify(newestFirst.map((m) => m.text)));
console.log('原数组未变 =', JSON.stringify(messages.map((m) => m.text)));

// 注意：如果只要"最后一条"，别用 reverse，直接 at(-1) 更省
console.log('最后一条 =', JSON.stringify(messages.at(-1).text), '（O(1)，不用反转整个数组）');

// ---------------------------------------------------------------------------
// 3. fill：用固定值填充
// ---------------------------------------------------------------------------

console.log('\n--- 3. fill 基础 ---');

const filled = new Array(5);
console.log('new Array(5) =', filled, '（稀疏的，5 个空洞）');

const zeroed = new Array(5).fill(0);
show('new Array(5).fill(0)', zeroed);

// fill 的返回值是原数组
const target = [1, 2, 3];
const fillRet = target.fill(9);
console.log('\nfill(9) 返回值 =', JSON.stringify(fillRet), '，是原数组吗？', fillRet === target);
show('整个填满之后', target);
console.log('注意：不传 start/end 会把原数据全部覆盖掉！');

// 带区间的填充
const partial = [1, 2, 3, 4, 5];
show('\n原数组', partial);
const p2 = [...partial];
p2.fill(0, 1, 3); // 把下标 [1, 3) 填成 0
show('fill(0, 1, 3)（下标 1、2）', p2);

const p3 = [...partial];
p3.fill(0, 3); // 从下标 3 到末尾
show('fill(0, 3)（下标 3 到末尾）', p3);

const p4 = [...partial];
p4.fill(0, -2); // 负索引：从倒数第 2 个到末尾
show('fill(0, -2)（负数索引）', p4);

const p5 = [...partial];
p5.fill(0, -4, -2); // 负数区间
show('fill(0, -4, -2)', p5);

const p6 = [...partial];
p6.fill(0, 10, 20); // 越界：什么都不做
show('fill(0, 10, 20)（越界，无变化）', p6);

const p7 = [...partial];
p7.fill(0, 3, 1); // start > end：什么都不做
show('fill(0, 3, 1)（start > end，无变化）', p7);

show('\n原 partial 始终没变', partial);

// ---------------------------------------------------------------------------
// 4. 陷阱：fill 传对象会共享引用
// ---------------------------------------------------------------------------

console.log('\n--- 4. 陷阱：fill 与引用类型 ---');

// 危险：三个位置指向同一个对象
const shared = new Array(3).fill({ done: false });
console.log('new Array(3).fill({ done: false }) =', JSON.stringify(shared));
shared[0].done = true;
console.log('改 shared[0].done 之后 =', JSON.stringify(shared), '（三个全变了！）');
console.log('它们是同一个对象吗？', shared[0] === shared[1], '（true）');

// 正确：用 Array.from 的映射函数为每个位置创建独立对象
const independent = Array.from({ length: 3 }, () => ({ done: false }));
independent[0].done = true;
console.log('\nArray.from({length: 3}, () => ({done: false})) =', JSON.stringify(independent), '（只改了一个）');
console.log('是同一个对象吗？', independent[0] === independent[1], '（false）');

// 二维数组的同类陷阱
const gridWrong = new Array(3).fill(new Array(3).fill(0));
gridWrong[0][0] = 9;
console.log('\n二维数组的错误初始化 =', JSON.stringify(gridWrong), '（每一行都被改了，因为是同一个数组）');

const gridRight = Array.from({ length: 3 }, () => new Array(3).fill(0));
gridRight[0][0] = 9;
console.log('二维数组的正确初始化 =', JSON.stringify(gridRight));

// 用 map 生成递增序列（fill 做不到，因为只有一个值）
const seq = new Array(5).fill(0).map((_, i) => i + 1);
console.log('\nfill + map 生成 1..5 =', JSON.stringify(seq));
console.log('Array.from 一步生成  =', JSON.stringify(Array.from({ length: 5 }, (_, i) => i + 1)));

// ---------------------------------------------------------------------------
// 5. copyWithin：原地复制搬运
// ---------------------------------------------------------------------------

console.log('\n--- 5. copyWithin ---');

// copyWithin(target, start, end)：把 [start, end) 的值拷到 target 开始的位置
const src = [1, 2, 3, 4, 5];
show('\n原数组', src);

const c1 = [...src];
c1.copyWithin(0, 3); // 把下标 3 起（4,5）复制到下标 0 起
show('copyWithin(0, 3)（把后两个搬到前面）', c1);

const c2 = [...src];
c2.copyWithin(0, 3, 5); // 明确写 end
show('copyWithin(0, 3, 5)（同上，更明确）', c2);

const c3 = [...src];
c3.copyWithin(2, 0, 2); // 把前两个复制到下标 2 起
show('copyWithin(2, 0, 2)（把前两个搬到中间）', c3);

const c4 = [...src];
c4.copyWithin(-2, 0, 2); // target 用负数：从倒数第 2 个开始写
show('copyWithin(-2, 0, 2)', c4);

const c5 = [...src];
c5.copyWithin(0, -2); // start 用负数：复制最后两个
show('copyWithin(0, -2)', c5);

// 长度不变，超出部分被丢弃
const c6 = [1, 2, 3, 4, 5];
c6.copyWithin(3, 0, 3); // 把 [1,2,3] 写到下标 3 开始的位置：只能写下标 3、4
show('\ncopyWithin(3, 0, 3)（长度不变，多的被截断）', c6);

// 重叠区间也没问题（内部先取快照）
const overlap = [1, 2, 3, 4, 5];
overlap.copyWithin(1, 0, 4); // 复制 [1,2,3,4] 到下标 1 起，源和目标重叠
show('重叠区间 copyWithin(1, 0, 4)', overlap);

// 返回值同样是原数组
const retCheck = [1, 2, 3];
console.log('\ncopyWithin 的返回值是原数组吗？', retCheck.copyWithin(0, 1) === retCheck);
show('返回值内容', retCheck);

show('\n原 src 始终没变', src);

// ---------------------------------------------------------------------------
// 6. 实战：滑动窗口左移
// ---------------------------------------------------------------------------

console.log('\n--- 6. 实战：滑动窗口左移 ---');

// 场景：固定长度的采样缓冲区，每来一个新样本就整体左移一格，新样本放末尾。
const buffer = [10, 20, 30, 40, 50];
show('初始缓冲区', buffer);

function pushSample(buf, sample) {
  // 把 [1, length) 复制到下标 0 起 —— 相当于整体左移一格
  buf.copyWithin(0, 1);
  buf[buf.length - 1] = sample;
  return buf;
}

pushSample(buffer, 60);
show('加入 60 之后', buffer);
pushSample(buffer, 70);
show('加入 70 之后', buffer);
console.log('（这就是"环形缓冲区"的最简实现方式之一）');

// ---------------------------------------------------------------------------
// 7. 实战：标记区间
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战：批量标记 ---');

// 场景：把已读的邮件区间标记为已读
const mailStates = new Array(8).fill('未读');
console.log('初始 =', JSON.stringify(mailStates));
mailStates.fill('已读', 2, 5); // 下标 2,3,4 标为已读
console.log('fill("已读", 2, 5) =', JSON.stringify(mailStates));

// 场景：棋盘初始化
const board = Array.from({ length: 4 }, () => new Array(4).fill('·'));
board[1][1] = 'X';
board[2][2] = 'O';
console.log('\n棋盘 =');
board.forEach((row) => console.log('  ' + row.join(' ')));

// ---------------------------------------------------------------------------
// 8. 三方法速查
// ---------------------------------------------------------------------------

console.log('\n--- 8. 速查 ---');

const demo1 = [1, 2, 3];
console.log('reverse()               原数组 =', JSON.stringify([1, 2, 3].reverse()), '（修改原数组）');
console.log('fill(x, s, e)           原数组 =', JSON.stringify([1, 2, 3, 4].fill(0, 1, 3)), '（修改原数组）');
console.log('copyWithin(t, s, e)     原数组 =', JSON.stringify([1, 2, 3, 4].copyWithin(0, 2)), '（修改原数组）');

console.log('\n不可变替代：');
console.log('arr.reverse()   -> arr.toReversed()  或 [...arr].reverse()');
console.log('arr.fill(...)   -> [...arr].fill(...) 或 arr.with(i, v)（单点替换）');
console.log('arr.copyWithin  -> 无直接替代，需手动组合 slice + 展开');

// toReversed / with 演示
const originalArr = [1, 2, 3];
console.log('\n[1,2,3].toReversed() =', JSON.stringify(originalArr.toReversed()));
console.log('[1,2,3].with(1, 99)  =', JSON.stringify(originalArr.with(1, 99)), '（单点替换，返回新数组）');
console.log('原数组 =', JSON.stringify(originalArr), '（前两个方法都没碰它）');

console.log('\n共同点：reverse / fill / copyWithin 都是 **mutating（修改原数组）** 并返回原数组本身；');
console.log('       ES2023 的 toReversed / toSorted / toSpliced / with 是它们的不可变版本。');
