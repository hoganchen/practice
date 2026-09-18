/**
 * ============================================================================
 * 知识点：slice —— 数组切片（不修改原数组）
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】08_arrays/02_push_pop_shift_unshift.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    slice(start, end) 从数组（或字符串）中"截取"一段，返回一个**新数组**。
 *    它只是"读"，不会动原数组，是纯函数式的操作。
 *    参数规则：
 *      - start：起始下标（包含），默认为 0；
 *      - end：结束下标（**不包含**），默认为 arr.length；
 *      - 两者都可以是负数，表示"从末尾往回数"（-1 是最后一个元素）；
 *      - 省略 end 表示"一直到末尾"；
 *      - 下标越界会被自动"夹紧"到 [0, length] 区间，不会报错。
 *
 * 2. 为什么需要它
 *    我们经常需要"取数组的一部分"：分页取前 10 条、去掉表头、取最近 7 天数据、
 *    复制一份数组再交给别人随便改……如果每次都手写 for 循环去拷，既啰嗦又易错。
 *    slice 用一个表达式就完成了"取子集"和"浅拷贝"两件事，而且是**不可变**的，
 *    在 React/Redux 这类强调不可变数据的场景里是必备工具。
 *
 * 3. 核心语法要点
 *    arr.slice()          —— 整体浅拷贝（最常用的复制技巧）
 *    arr.slice(2)         —— 从下标 2 到末尾
 *    arr.slice(1, 3)      —— 下标 1、2（不含 3）
 *    arr.slice(-2)        —— 最后两个
 *    arr.slice(1, -1)     —— 去掉第一个和最后一个
 *    arr.slice(-3, -1)    —— 倒数第三个到倒数第二个
 *    arr.slice(0, 0)      —— 空数组
 *    注意 slice 与 splice 只差一个字母：**slice 不改原数组，splice 改原数组**。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】**不修改**。这正是它与 splice 的根本区别。
 *    - 返回的是**浅拷贝**：新数组的每个元素仍然是原元素的引用。如果元素是对象，
 *      改新数组里的对象属性，原数组里的那个对象也会变。深拷贝见 18 号文件。
 *    - end 是"不含"的，这是初学者最常见的 off-by-one 来源：想取前 3 个要写 slice(0, 3)。
 *      可以记成"长度 = end - start"。
 *    - start > end 时返回空数组，不会自动交换。
 *    - slice 也可以用在字符串上：'abcde'.slice(1, 3) === 'bc'。
 *    - 对"类数组对象"（有 length 的对象）也有效，会把结果转成真数组。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/03_slice.js
 *
 * 【预期输出】
 *   依次演示正索引、负索引、省略参数、越界夹紧、空结果等切片行为，
 *   并每次打印原数组，证明它自始至终没有被修改。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本切片：正索引
// ---------------------------------------------------------------------------

console.log('--- 1. 正索引切片 ---');

const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
console.log('原数组 =', letters);

console.log('slice(0, 3) =', letters.slice(0, 3), '（下标 0,1,2，不含 3）');
console.log('slice(1, 4) =', letters.slice(1, 4), '（下标 1,2,3）');
console.log('slice(2)    =', letters.slice(2), '（省略 end，到末尾）');
console.log('slice(0, 0) =', letters.slice(0, 0), '（空数组）');

// 关键证明：原数组没变
console.log('原数组依然是 =', letters, '（slice 不修改原数组）');

// ---------------------------------------------------------------------------
// 2. 负索引：从末尾往回数
// ---------------------------------------------------------------------------

console.log('\n--- 2. 负索引 ---');

// -1 表示最后一个元素的位置，-2 是倒数第二个，以此类推。
console.log('slice(-2)     =', letters.slice(-2), '（最后 2 个）');
console.log('slice(-3)     =', letters.slice(-3), '（最后 3 个）');
console.log('slice(1, -1)  =', letters.slice(1, -1), '（去掉首尾）');
console.log('slice(-3, -1) =', letters.slice(-3, -1), '（倒数第 3 个到倒数第 2 个）');
console.log('slice(-100)   =', letters.slice(-100), '（超出左边界的负数被夹紧为 0）');
console.log('slice(0, -100)=', letters.slice(0, -100), '（超出左边界的 end 被夹紧为 0，得到空数组）');

// 换算公式：负数下标 n 实际等价于 length + n
console.log('验证：slice(-2) 等价于 slice(6 + (-2)) = slice(4) =', letters.slice(4));

// ---------------------------------------------------------------------------
// 3. 越界与边界情况：自动夹紧，不报错
// ---------------------------------------------------------------------------

console.log('\n--- 3. 越界与边界 ---');

console.log('slice(10)      =', letters.slice(10), '（start 越界 -> 空数组）');
console.log('slice(2, 100)  =', letters.slice(2, 100), '（end 越界 -> 夹紧到 length）');
console.log('slice(4, 2)    =', letters.slice(4, 2), '（start > end -> 空数组，不会自动交换）');
console.log('slice(-2, -100)=', letters.slice(-2, -100), '（夹紧后 start > end -> 空数组）');
console.log('slice(2.7, 4)  =', letters.slice(2.7, 4), '（小数会被向 0 取整）');
console.log("slice('2', 4)  =", letters.slice('2', 4), '（字符串参数会被转成数字）');

// 特殊值：undefined 表示"用默认值"，null 会被转成 0
console.log('slice(undefined, 3) =', letters.slice(undefined, 3), '（start 用默认 0）');
console.log('slice(2, undefined) =', letters.slice(2, undefined), '（end 用默认 length）');

// ---------------------------------------------------------------------------
// 4. 最常用技巧一：slice() 整体浅拷贝
// ---------------------------------------------------------------------------

console.log('\n--- 4. 用 slice() 浅拷贝 ---');

const original = [1, 2, 3];
const copy = original.slice(); // 不传参数 = 从 0 到末尾 = 完整拷贝

console.log('原数组 =', original);
console.log('拷贝   =', copy);
console.log('是同一个引用吗？', original === copy, '（false，说明是新数组）');

// 改拷贝不会影响原数组（前提是元素为原始值）
copy.push(4);
console.log('push 到拷贝后：原数组 =', original, '，拷贝 =', copy);

// 注意：这是浅拷贝！
const nested = [{ n: 1 }, { n: 2 }];
const shallow = nested.slice();
shallow[0].n = 999; // 改的是"同一个对象"
console.log('浅拷贝陷阱：原数组 =', JSON.stringify(nested), '，拷贝 =', JSON.stringify(shallow));
console.log('两个数组本身不同，但内部的元素对象是共享的。深拷贝请见 18 号文件。');

// 其他浅拷贝方式对比
const bySpread = [...original];
const byConcat = [].concat(original);
const byFrom = Array.from(original);
console.log('展开运算符 =', bySpread, '，concat =', byConcat, '，Array.from =', byFrom);

// ---------------------------------------------------------------------------
// 5. 最常用技巧二：分页/Limit
// ---------------------------------------------------------------------------

console.log('\n--- 5. 分页取数据 ---');

const allRows = Array.from({ length: 23 }, (_, i) => `第${i + 1}条`);
console.log('总数据 =', allRows.length, '条');

function page(rows, pageNum, pageSize) {
  // 第 1 页：下标 0 开始；第 n 页：(n-1) * pageSize 开始
  const start = (pageNum - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

console.log('第 1 页（每页 10 条）=', page(allRows, 1, 10));
console.log('第 2 页（每页 10 条）=', page(allRows, 2, 10));
console.log('第 3 页（每页 10 条，只剩 3 条）=', page(allRows, 3, 10));
console.log('第 99 页（越界）=', page(allRows, 99, 10), '（安全返回空数组，不用额外判断）');

// ---------------------------------------------------------------------------
// 6. 最常用技巧三：取头 / 取尾 / 去掉首尾
// ---------------------------------------------------------------------------

console.log('\n--- 6. 头尾操作 ---');

const logs = ['启动', '连接', '处理', '上报', '关闭'];
console.log('全部日志 =', logs);
console.log('第一条   =', logs.slice(0, 1)[0], '（或用 logs.at(0) / logs[0]）');
console.log('最后一条 =', logs.slice(-1)[0], '（或用 logs.at(-1)）');
console.log('去掉表头 =', logs.slice(1));
console.log('去掉末尾 =', logs.slice(0, -1));
console.log('去掉首尾 =', logs.slice(1, -1));
console.log('原数组 =', logs, '（始终没变）');

// ---------------------------------------------------------------------------
// 7. slice 用于字符串与类数组
// ---------------------------------------------------------------------------

console.log('\n--- 7. 字符串与类数组 ---');

// 字符串也有 slice，参数规则完全一样
const text = 'Hello, World';
console.log("'Hello, World'.slice(0, 5) =", JSON.stringify(text.slice(0, 5)));
console.log("'Hello, World'.slice(-5)   =", JSON.stringify(text.slice(-5)));
console.log("'Hello, World'.slice(7)    =", JSON.stringify(text.slice(7)));

// 类数组对象（有 length 和数字下标）也能被 slice
const arrayLike = { 0: 'p', 1: 'q', 2: 'r', 3: 's', length: 4 };
console.log('类数组 slice(1, 3) =', Array.prototype.slice.call(arrayLike, 1, 3));
console.log('（现代写法更推荐：Array.from(arrayLike).slice(1, 3)）');

// ---------------------------------------------------------------------------
// 8. 与 splice 的对比预览（详见 04 号文件）
// ---------------------------------------------------------------------------

console.log('\n--- 8. slice vs splice 一句话对比 ---');
const a = [1, 2, 3, 4, 5];
const b = [1, 2, 3, 4, 5];
const sliceResult = a.slice(1, 3);
const spliceResult = b.splice(1, 3);
console.log('slice(1, 3)  返回 =', sliceResult, '，原数组 a =', a, '（未修改）');
console.log('splice(1, 3) 返回 =', spliceResult, '，原数组 b =', b, '（被修改了）');
console.log('结论：slice 只读不写，splice 又读又写。');
