/**
 * ============================================================================
 * 知识点：forEach 遍历 —— 无法 break，以及与 for...of 的取舍
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】入门
 * 【前置知识】08_arrays/06_index_of_and_includes.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    arr.forEach(callback) 是最基础的数组遍历方法：对数组的每个元素执行一次回调。
 *    回调签名是 (element, index, array)，第三个参数是数组本身（很少用到）。
 *
 *    forEach 的设计目的非常明确 —— **执行副作用**：
 *    打印、累加外部变量、发请求、写数据库、改 DOM。它不产出结果，所以
 *    **返回值永远是 undefined**，这一点常被误解成"返回一个新数组"。
 *
 * 2. 为什么需要它
 *    它比 for 循环更声明式："对每个元素做这件事"一句话就表达清楚了，
 *    不用手写 i 的初始化、边界判断和自增，也就不会写出 i <= arr.length 这种越界 bug。
 *    同时它把作用域限制在回调里，避免循环变量污染外层。
 *
 * 3. 核心语法要点
 *    (1) 回调参数：element（当前元素）、index（下标）、array（原数组）。
 *    (2) 回调**总是返回 undefined**，forEach 也返回 undefined —— 不能链式调用。
 *    (3) 不能使用 break / continue：
 *        - break 会直接语法报错（因为它不是循环语句，是方法调用）；
 *        - continue 也没有对应语法，只能用 return 跳过"本次回调的剩余代码"
 *          （注意：return 只结束当前这一次回调，等价于 continue，不是 break）。
 *    (4) 想提前终止，办法有三种：
 *        - 换成 for...of（可以用 break / continue）；
 *        - 换成 some()/every()（返回 true/false 即可终止，见 14 号文件）；
 *        - 换成 find()/findIndex()（找到就停）。
 *    (5) 遍历范围在**第一次调用回调之前**就已确定：遍历中新增的元素不会被访问，
 *        被删除的元素会被跳过。
 *    (6) 会跳过稀疏数组的空洞，但对显式 undefined 元素仍然会调用回调。
 *
 * 4. 常见陷阱
 *    - 【是否修改原数组】forEach 本身**不修改原数组**，但它把 index 和 array
 *      交给回调，你在回调里调 arr.push/splice 就会改。规范地说：
 *      `forEach` 是 non-mutating 的遍历方法，不改数组；但回调的副作用可能改。
 *    - forEach 不是"函数式"方法：它没有返回值，无法参与链式调用。
 *      要"转换"用 map，要"过滤"用 filter，要"归约"用 reduce。
 *    - await 在 forEach 回调里**不会**被等待：forEach 会同步跑完所有回调，
 *      回调里的 await 只是各自起了一个并行的 Promise，循环并不会依次等待。
 *      需要串行等待请用 for...await 或 for...of + await。
 *    - 回调里的 `this` 默认是 undefined（严格模式 / ESM），需要 this 就传第二参数。
 *    - 在回调里对同一个数组做 push 会导致遍历长度变化，容易写出事故。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/07_forEach.js
 *
 * 【预期输出】
 *   依次演示 forEach 的三个参数、返回值是 undefined、无法 break 的演示（用 try/catch
 *   包住语法层面无法实现的部分，这里用运行期等价演示）、return 等价 continue、
 *   稀疏数组的跳过行为，以及 for / for...of / forEach 的对比与选型。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本用法与三个回调参数
// ---------------------------------------------------------------------------

console.log('--- 1. 基本用法与参数 ---');

const fruits = ['苹果', '香蕉', '橙子'];

// 最简形式：只用第一个参数
fruits.forEach((item) => {
  console.log('  元素：', item);
});

console.log('\n完整参数：');
fruits.forEach((element, index, array) => {
  console.log(`  下标 ${index} 的元素是 ${element}，整个数组长度 ${array.length}`);
});

// 用三个参数做"带分隔符打印"的经典技巧
console.log('\n用 index 控制分隔符：');
let line = '';
fruits.forEach((item, i, arr) => {
  line += item;
  if (i < arr.length - 1) line += ' -> ';
});
console.log('  ' + line);

// ---------------------------------------------------------------------------
// 2. 返回值永远是 undefined
// ---------------------------------------------------------------------------

console.log('\n--- 2. 返回值是 undefined ---');

const nums = [1, 2, 3];

// 即使回调里写了 return，forEach 本身也还是返回 undefined
const forEachReturn = nums.forEach((n) => n * 2);
console.log('nums.forEach(n => n * 2) 的返回值 =', forEachReturn);
console.log('原数组 =', JSON.stringify(nums), '（没有被改成 [2,4,6]，因为 forEach 不管返回值）');

// 想得到"每个元素乘 2 的新数组"，必须用 map
const doubled = nums.map((n) => n * 2);
console.log('nums.map(n => n * 2) =', JSON.stringify(doubled), '（这才是正确用法，见 08 号文件）');

// 常见误用：把 forEach 的结果当成数组继续用
try {
  nums.forEach((n) => n).push(4);
} catch (err) {
  console.log('对 forEach 的返回值调用 push 会报错：', err.constructor.name, '-', err.message);
}

// 链式调用也会断掉
console.log('所以 forEach 不能出现在链式调用的中间，它只能是链条的末端。');

// ---------------------------------------------------------------------------
// 3. 无法 break：为什么、以及怎么办
// ---------------------------------------------------------------------------

console.log('\n--- 3. forEach 无法 break ---');

// break 在 forEach 的回调里是语法错误，整个文件都跑不起来；
// 这里用 try/catch 无法捕获语法错误，所以改用"运行期可触发的"等价演示。
// 演示：想在找到 3 时提前结束，用 forEach 是做不到的（只能"跳过"不能"终止"）。
const data = [1, 2, 3, 4, 5];
const visited = [];
data.forEach((n) => {
  visited.push(n);
  if (n === 3) {
    return; // 这只是"跳过本次回调的剩余语句"，等价于 continue
  }
  // 下面的代码在 n === 3 时不会执行
  console.log('  处理中：', n);
});
console.log('  forEach 实际遍历过的元素 =', JSON.stringify(visited), '（到 5 为止，没有提前结束）');

// 想要真正 break，用 for...of
console.log('\n用 for...of 可以真的 break：');
const visited2 = [];
for (const n of data) {
  visited2.push(n);
  if (n === 3) break; // 真的终止循环
  console.log('  处理中：', n);
}
console.log('  for...of 实际遍历过的元素 =', JSON.stringify(visited2), '（到 3 就停了）');

// 用 some 也能实现提前终止（返回 true 即停）
console.log('\n用 some 提前终止：');
const visited3 = [];
data.some((n) => {
  visited3.push(n);
  if (n === 3) return true; // 返回 true -> some 立即停止
  console.log('  处理中：', n);
  return false;
});
console.log('  some 实际遍历过的元素 =', JSON.stringify(visited3));

// 用 findIndex 找到就停
console.log('\n用 findIndex 找到就停（返回下标）：');
const foundIndex = data.findIndex((n) => {
  console.log('  检查：', n);
  return n === 3;
});
console.log('  找到下标 =', foundIndex, '（找到后立即停止检查）');

// 用 try/catch + throw 强制跳出（能用但属于"邪道"，可读性差）
console.log('\n用异常强制跳出（不推荐，仅演示原理）：');
const visited4 = [];
try {
  data.forEach((n) => {
    visited4.push(n);
    if (n === 3) throw new Error('__BREAK__');
    console.log('  处理中：', n);
  });
} catch (err) {
  if (err.message === '__BREAK__') {
    console.log('  已强制跳出，遍历过 =', JSON.stringify(visited4));
  } else {
    throw err; // 其它异常照常抛出（本文件不会走到这里）
  }
}
console.log('  （这种写法把控制流藏在异常里，团队协作时应避免）');

// ---------------------------------------------------------------------------
// 4. return 在 forEach 中等价于 continue
// ---------------------------------------------------------------------------

console.log('\n--- 4. return 等价于 continue ---');

const values = [1, 2, 3, 4, 5, 6];
const evens = [];
values.forEach((n) => {
  if (n % 2 !== 0) return; // 跳过奇数，等价于 continue
  evens.push(n);
});
console.log('只收集偶数 =', JSON.stringify(evens));

// 对照 for...of 的 continue
const evens2 = [];
for (const n of values) {
  if (n % 2 !== 0) continue;
  evens2.push(n);
}
console.log('for...of + continue =', JSON.stringify(evens2));

// ---------------------------------------------------------------------------
// 5. 遍历范围与稀疏数组
// ---------------------------------------------------------------------------

console.log('\n--- 5. 遍历范围与稀疏数组 ---');

// (1) 遍历中 push：新加的元素不会被访问（长度在开始前已缓存）
const growing = ['a', 'b'];
const seen = [];
growing.forEach((v, i, arr) => {
  seen.push(v);
  if (i === 0) arr.push('c'); // 遍历中追加
});
console.log('遍历中 push 后：实际访问过的 =', JSON.stringify(seen), '，最终数组 =', JSON.stringify(growing));

// (2) 遍历中删除：被删的元素就跳过了
const shrinking = ['a', 'b', 'c', 'd'];
const seen2 = [];
shrinking.forEach((v, i, arr) => {
  seen2.push(v);
  if (v === 'a') arr.splice(2, 1); // 删掉 'c'，下标 2 之后整体前移
});
console.log('遍历中 splice 后：实际访问过的 =', JSON.stringify(seen2), '（c 被跳过了）');

// (3) 稀疏数组：空洞被跳过，显式 undefined 不跳过
const sparse = [, , 'x']; // 前两个位置是"空洞"
const visitedSparse = [];
sparse.forEach((v, i) => visitedSparse.push(`${i}:${String(v)}`));
console.log('稀疏数组 =', sparse, '，forEach 访问到 =', JSON.stringify(visitedSparse));

const explicitUndefined = [undefined, undefined, 'x'];
const visitedExplicit = [];
explicitUndefined.forEach((v, i) => visitedExplicit.push(`${i}:${String(v)}`));
console.log('显式 undefined 数组 forEach 访问到 =', JSON.stringify(visitedExplicit), '（都会访问）');

// ---------------------------------------------------------------------------
// 6. forEach 与 object 的配合：Object.entries / Object.keys
// ---------------------------------------------------------------------------

console.log('\n--- 6. 遍历对象（不算数组，但很常用） ---');

const scores = { 语文: 90, 数学: 85, 英语: 92 };

// 遍历对象要用 Object.keys / values / entries，不能直接对对象用 forEach
Object.entries(scores).forEach(([subject, score]) => {
  console.log(`  ${subject}: ${score}`);
});

// 顺带：forEach 遍历 Map / Set 也是可以的（它们自身有 forEach）
const scoreMap = new Map(Object.entries(scores));
scoreMap.forEach((value, key) => console.log(`  Map 遍历 -> ${key}: ${value}`));

const scoreSet = new Set([1, 2, 2, 3]);
scoreSet.forEach((v) => console.log('  Set 遍历 ->', v, '（自动去重）'));

// ---------------------------------------------------------------------------
// 7. forEach 的 thisArg 参数
// ---------------------------------------------------------------------------

console.log('\n--- 7. 第二个参数 thisArg ---');

const counter = {
  total: 0,
  add(n) {
    this.total += n;
  },
};

// 把 counter 作为 thisArg 传进去（普通函数才能拿到 this，箭头函数不行）
[1, 2, 3, 4].forEach(function (n) {
  this.add(n);
}, counter);
console.log('用 thisArg 累加结果 =', counter.total);

// 现代写法一般用箭头函数 + 外部变量，更清晰
let total = 0;
[1, 2, 3, 4].forEach((n) => {
  total += n;
});
console.log('用闭包变量累加结果 =', total);

// 其实"求和"应该用 reduce（见 10 号文件）
console.log('reduce 求和 =', [1, 2, 3, 4].reduce((s, n) => s + n, 0));

// ---------------------------------------------------------------------------
// 8. forEach 与异步：不要期望它串行等待
// ---------------------------------------------------------------------------

console.log('\n--- 8. forEach 与 async ---');

// forEach 会同步地把所有回调"启动"完，不会等待里面 await 的结果。
// 下面这段的输出顺序会证明：先打印"循环结束"，再打印各个 await 的结果。
const tasks = [1, 2, 3];
const pending = [];
tasks.forEach(async (n) => {
  // 模拟异步操作（这里用 Promise.resolve 代替真实 I/O）
  await Promise.resolve();
  console.log('  [async forEach] 完成项', n);
});
console.log('  [主流程] forEach 调用已返回！上面那些"完成项"其实还没打印。');

// 等所有异步任务结束，再看看总顺序（用 top-level await，ESM 支持）
await new Promise((resolve) => setTimeout(resolve, 0));
console.log('  [主流程] 异步任务都排空了。');

// 正确姿势一：for...of + await（串行）
console.log('\n串行处理（for...of + await）：');
for (const n of tasks) {
  await Promise.resolve();
  console.log('  串行完成项', n);
}

// 正确姿势二：并行 + Promise.all
console.log('\n并行处理（Promise.all + map）：');
const results = await Promise.all(tasks.map(async (n) => {
  await Promise.resolve();
  return n * 10;
}));
console.log('  Promise.all 结果 =', JSON.stringify(results));

// ---------------------------------------------------------------------------
// 9. for / for...of / forEach 选型对比
// ---------------------------------------------------------------------------

console.log('\n--- 9. 三种遍历方式对比 ---');

const demo = [10, 20, 30];

let sum1 = 0;
for (let i = 0; i < demo.length; i++) {
  sum1 += demo[i];
}
console.log('普通 for     ：能 break/continue，能拿到下标，能倒序，性能最好，但代码最啰嗦。sum =', sum1);

let sum2 = 0;
for (const v of demo) {
  sum2 += v;
}
console.log('for...of     ：能 break/continue，语法简洁，但不能直接拿到下标（可用 entries()）。sum =', sum2);

let sum3 = 0;
demo.forEach((v) => {
  sum3 += v;
});
console.log('forEach      ：最简洁，自带下标，但不能 break，不能 await 串行，无返回值。sum =', sum3);

console.log('\n选型建议：');
console.log('  需要提前退出 / 需要 await 串行  -> for...of');
console.log('  需要精确控制下标（如倒序、步长）-> 普通 for');
console.log('  只是想"对每一项做点事"          -> forEach');
console.log('  想产出新数组 / 过滤 / 汇总       -> map / filter / reduce');
