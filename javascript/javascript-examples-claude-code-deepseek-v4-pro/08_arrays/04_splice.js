/**
 * ============================================================================
 * 知识点：splice —— 数组的删除 / 插入 / 替换（修改原数组）
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】08_arrays/03_slice.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    splice(start, deleteCount, ...items) 是数组里唯一一个"既能删、又能插、还能替换"
 *    的方法。它会**直接修改原数组**（mutating），并把"被删除的元素"组成一个新数组返回。
 *
 *    参数含义：
 *      start       从哪个下标开始动手（支持负数，-1 表示最后一个元素的位置）；
 *      deleteCount 要删除几个元素（省略时 = 从 start 到末尾全删）；
 *      ...items    要插入到 start 位置的新元素（可以为 0 个或多个）。
 *
 *    三种用法由参数个数决定：
 *      删除：arr.splice(2, 2)          —— 从下标 2 开始删 2 个
 *      插入：arr.splice(2, 0, 'x')     —— deleteCount 为 0，纯插入
 *      替换：arr.splice(2, 1, 'x','y') —— 删 1 个、插 2 个（长度会变化）
 *
 * 2. 为什么需要它
 *    push/pop/shift/unshift 只能操作"两端"，无法在中间增删。要"删除第 3 条记录"、
 *    "在第 2 个位置插入一条"、"把某个元素替换掉"，就必须用 splice。
 *    它是"可变数组编辑"的瑞士军刀；在需要原地修改（如清空列表、批量删除）时，
 *    splice 比"filter 生成新数组再赋值回去"更直接、内存更省。
 *
 * 3. 核心语法要点
 *    - 返回值：总是数组，内容是**被删除的元素**（没有任何东西被删时返回空数组 []）。
 *      这一点极易与"返回新数组"的 slice 混淆：slice 返回"取到的"，splice 返回"删掉的"。
 *    - start 为负数时从末尾数：arr.splice(-2, 1) 删除倒数第 2 个。
 *    - start 超出范围时会被夹紧：正数夹到 length，负数夹到 0。
 *    - deleteCount 为负数时按 0 处理（等于纯插入）。
 *    - 想"清空整个数组"：arr.splice(0) 或 arr.splice(0, arr.length) 或 arr.length = 0。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**会修改原数组**！这是数组方法里最容易踩的坑之一，
 *      因为它和名字只差一个字母的 slice 行为完全相反。
 *    - 在 for 循环里一边遍历一边 splice 会漏掉元素（因为下标会后移）。
 *      正确做法：倒序删除，或者用 filter 生成新数组。
 *    - 返回值是被删元素的集合，容易误当成"修改后的数组"去使用。
 *    - 参数写成 arr.splice(start, end) 是错的：第二个参数是"个数"，不是"结束下标"。
 *      想按下标区间删除，要写 splice(start, end - start)。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/04_splice.js
 *
 * 【预期输出】
 *   依次演示删除、插入、替换三种用法（每次都打印"返回值 / 原数组 / 长度"），
 *   然后给出与 slice 的逐项对比，以及循环中删除元素的正确与错误写法。
 * ============================================================================
 */

function show(label, arr) {
  console.log(`${label} -> ${JSON.stringify(arr)}  (length = ${arr.length})`);
}

// ---------------------------------------------------------------------------
// 1. 删除：splice(start, deleteCount)
// ---------------------------------------------------------------------------

console.log('--- 1. 删除 ---');

const nums = [10, 20, 30, 40, 50];
show('原数组', nums);

// 从下标 1 开始删 2 个
const removed = nums.splice(1, 2);
console.log('splice(1, 2) 的返回值 =', JSON.stringify(removed), '（注意：返回的是被删掉的元素）');
show('删除后的原数组', nums);

// 省略 deleteCount：从 start 一直删到末尾
const tail = [1, 2, 3, 4, 5];
const removedTail = tail.splice(2);
console.log('\nsplice(2)（省略个数）返回值 =', JSON.stringify(removedTail));
show('删除后的原数组', tail);

// deleteCount 大于剩余长度：能删多少删多少，不报错
const small = [1, 2, 3];
const over = small.splice(1, 100);
console.log('\nsplice(1, 100) 返回值 =', JSON.stringify(over));
show('删除后的原数组', small);

// 清空整个数组的两种写法
const toClear1 = [1, 2, 3];
const c1 = toClear1.splice(0);
console.log('\nsplice(0) 清空：返回值 =', JSON.stringify(c1), '，数组 =', JSON.stringify(toClear1));
const toClear2 = [1, 2, 3];
toClear2.length = 0; // 另一种清空方式（直接改 length，见 19 号文件）
console.log('length = 0 清空：数组 =', JSON.stringify(toClear2));

// ---------------------------------------------------------------------------
// 2. 插入：deleteCount 为 0
// ---------------------------------------------------------------------------

console.log('\n--- 2. 插入（deleteCount = 0）---');

const list = ['a', 'b', 'c'];
show('原数组', list);

// 在下标 1 的位置插入（原本的 b 会被挤到后面）
const insRet = list.splice(1, 0, 'X');
console.log('splice(1, 0, "X") 的返回值 =', JSON.stringify(insRet), '（空数组，因为没删任何东西）');
show('插入后的原数组', list);

// 一次插入多个
list.splice(3, 0, 'Y', 'Z');
show('splice(3, 0, "Y", "Z") 之后', list);

// 在末尾插入 = push 的等价写法
list.splice(list.length, 0, '尾巴');
show('在末尾插入', list);
console.log('（等价于 list.push("尾巴")，但 push 更直观）');

// 在开头插入 = unshift 的等价写法
list.splice(0, 0, '脑袋');
show('在开头插入', list);

// ---------------------------------------------------------------------------
// 3. 替换：删除 + 插入
// ---------------------------------------------------------------------------

console.log('\n--- 3. 替换 ---');

const colors = ['红', '绿', '蓝', '黄'];
show('原数组', colors);

// 把下标 1 的"绿"替换成"青"
const replaced = colors.splice(1, 1, '青');
console.log('splice(1, 1, "青") 返回值 =', JSON.stringify(replaced));
show('替换后的原数组', colors);

// 替换并改变长度：删 1 插 2
colors.splice(0, 1, '深红', '浅红');
show('删 1 插 2 之后（长度 +1）', colors);

// 用 splice 原地修改对象属性（元素是对象时，改的仍是同一个对象）
const users = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
];
users.splice(1, 1, { id: 2, name: '李四（已改名）' });
console.log('替换对象元素 =', JSON.stringify(users, null, 0));

// ---------------------------------------------------------------------------
// 4. 负数 start
// ---------------------------------------------------------------------------

console.log('\n--- 4. 负数 start ---');

const neg = [1, 2, 3, 4, 5];
show('原数组', neg);

// start = -1 表示"倒数第一个元素的位置"，删除 1 个 = 删掉最后一个
const lastOne = neg.splice(-1, 1);
console.log('splice(-1, 1) 返回值 =', JSON.stringify(lastOne));
show('之后', neg);

// start = -2 表示从倒数第二个开始
const tailTwo = neg.splice(-2, 2);
console.log('splice(-2, 2) 返回值 =', JSON.stringify(tailTwo));
show('之后', neg);

// start 超出下界（比 -length 还小）会被夹紧到 0
const clamp = [1, 2, 3];
const clamped = clamp.splice(-100, 2);
console.log('splice(-100, 2) 返回值 =', JSON.stringify(clamped), '（start 被夹到 0）');
show('之后', clamp);

// start 超出上界会被夹到 length（等价于在末尾操作）
const clamp2 = [1, 2, 3];
clamp2.splice(100, 0, 'end');
show('splice(100, 0, "end")（在末尾插入）', clamp2);

// ---------------------------------------------------------------------------
// 5. 与 slice 的正面对比
// ---------------------------------------------------------------------------

console.log('\n--- 5. slice vs splice 对比 ---');

const arrSlice = [1, 2, 3, 4, 5];
const arrSplice = [1, 2, 3, 4, 5];

const r1 = arrSlice.slice(1, 4);
const r2 = arrSplice.splice(1, 4);

console.log('slice(1, 4)：');
console.log('  含义     = 取下标 [1, 4) 的元素');
console.log('  返回值   =', JSON.stringify(r1), '（取到的元素）');
console.log('  原数组   =', JSON.stringify(arrSlice), '（未修改，非 mutating）');

console.log('splice(1, 4)：');
console.log('  含义     = 从下标 1 起删除 4 个');
console.log('  返回值   =', JSON.stringify(r2), '（删掉的元素）');
console.log('  原数组   =', JSON.stringify(arrSplice), '（被修改，mutating）');

console.log('\n一句话记忆：');
console.log('  slice  —— 只读，切一段给你，原数组不动。');
console.log('  splice —— 又切又改，第二个参数是"删几个"而不是"到哪结束"。');

// ---------------------------------------------------------------------------
// 6. 陷阱：循环中删除元素
// ---------------------------------------------------------------------------

console.log('\n--- 6. 循环中删除元素的陷阱 ---');

// 错误示范：正序循环 + splice，会漏掉紧跟在被删元素后面的那个
const wrong = [1, 2, 3, 4, 5, 6];
console.log('错误示范，起始数组 =', JSON.stringify(wrong));
for (let i = 0; i < wrong.length; i++) {
  if (wrong[i] % 2 === 0) {
    wrong.splice(i, 1);
    // i 没有回退，下一个元素被跳过
  }
}
console.log('结果 =', JSON.stringify(wrong), '（6 被漏掉了，本应全删为 [1,3,5]）');

// 正确做法一：倒序循环，删除不影响尚未遍历的下标
const right1 = [1, 2, 3, 4, 5, 6];
for (let i = right1.length - 1; i >= 0; i--) {
  if (right1[i] % 2 === 0) {
    right1.splice(i, 1);
  }
}
console.log('倒序删除结果 =', JSON.stringify(right1), '（正确）');

// 正确做法二：用 filter 生成新数组（不改原数组，推荐）
const right2raw = [1, 2, 3, 4, 5, 6];
const right2 = right2raw.filter((n) => n % 2 !== 0);
console.log('filter 结果 =', JSON.stringify(right2), '，原数组未变 =', JSON.stringify(right2raw));

// 正确做法三：必须正序时，删完把 i 回退一格
const right3 = [1, 2, 3, 4, 5, 6];
for (let i = 0; i < right3.length; i++) {
  if (right3[i] % 2 === 0) {
    right3.splice(i, 1);
    i--; // 关键：回退，重新检查当前位置
  }
}
console.log('正序 + i-- 结果 =', JSON.stringify(right3), '（正确）');

// ---------------------------------------------------------------------------
// 7. 实战：用 splice 实现"移动到指定位置"
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战：数组元素移动 ---');

// 把 from 位置的元素移动到 to 位置
function move(arr, from, to) {
  // 注意：splice 会改传进来的数组，这里先浅拷贝一份以保证"不改原数组"
  const copy = arr.slice();
  const [item] = copy.splice(from, 1); // 先取出来
  copy.splice(to, 0, item); // 再插进去
  return copy;
}

const order = ['A', 'B', 'C', 'D'];
console.log('原顺序 =', JSON.stringify(order));
console.log('把下标 0 移到下标 2 =', JSON.stringify(move(order, 0, 2)));
console.log('把下标 3 移到下标 1 =', JSON.stringify(move(order, 3, 1)));
console.log('原数组依然是 =', JSON.stringify(order), '（move 内部做了拷贝）');

console.log('\n小结：splice 是数组里唯一能"原地在中间增删"的方法，威力大、破坏性也大；');
console.log('      如果你希望保持数据不可变，请改用 slice + 展开运算符或 toSpliced()（ES2023）。');

// ES2023 新增的不可变版本 toSpliced（Node 20+ 支持，本仓库 Node 24 可用）
const base = [1, 2, 3, 4];
const spliced = base.toSpliced(1, 2, 'x');
console.log('toSpliced(1, 2, "x") =', JSON.stringify(spliced), '，原数组 =', JSON.stringify(base), '（不修改原数组）');
