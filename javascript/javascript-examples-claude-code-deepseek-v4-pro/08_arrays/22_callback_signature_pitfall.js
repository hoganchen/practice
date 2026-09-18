/**
 * ============================================================================
 * 知识点：回调函数签名不匹配的陷阱 —— ['1','2','3'].map(parseInt) 为什么是 [1, NaN, NaN]
 * ============================================================================
 *
 * 【所属分类】08_arrays —— 数组
 * 【难度等级】进阶
 * 【前置知识】08_arrays/07_forEach.js、08_arrays/08_map.js、08_arrays/12_sort.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    数组的迭代方法（map / forEach / filter / find / some / every / reduce / sort …）
 *    在调用我们传入的回调函数时，**不是只传一个参数**，而是按固定顺序传三个：
 *
 *        回调(元素, 下标, 数组本身)
 *        callback(element, index, array)
 *
 *    如果你把一个"原本不是为当回调而设计的函数"直接丢进去，
 *    它的形参就会被这几个位置参数**按位置硬塞**进去。当两个函数的参数含义
 *    恰好冲突时，就会产生**不报错但结果错误**的静默 bug。
 *
 *    最经典的例子就是本文件的主角：
 *
 *        ['1', '2', '3'].map(parseInt)     // => [1, NaN, NaN]   而不是 [1, 2, 3]
 *
 *    原因只有一句话：
 *        数组方法传的第 2 个参数是"下标"，
 *        parseInt 需要 的第 2 个参数是"进制"（radix）。
 *    于是下标 0、1、2 被当成了进制：0 视为十进制、进制 1 非法、二进制里没有 3。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 这是"函数是一等公民"带来的**副作用**：把函数当值传递极其方便，
 *      但语言不会帮你检查签名，编译器/引擎也不会报错，只会给你一个错误的结果。
 *    - 真实事故场景：从后端或 CSV 拿到一批"字符串形式的数字"
 *      ['1','2','3', ...] 想转成数字，写了 `.map(parseInt)`。
 *      结果第 0 个是对的（下标 0 → 十进制），从第 1 个开始全是 NaN。
 *      更糟的是如果数组只有 1 个元素，你测试时**完全看不出问题**。
 *    - 这类 bug 的排查成本极高：不抛异常、没有堆栈、数值类型也"看起来"正常，
 *      往往要等到线上拿到 NaN 计算出的金额、评分、坐标时才暴露。
 *    - 同类陷阱遍布各处：`forEach(console.log)` 莫名多打印出下标和整个数组、
 *      `sort(parseInt)` 排出来的顺序乱七八糟、`filter(Boolean)` 却**恰好**是对的
 *      （Boolean 只关心第一个参数）—— 这正说明问题出在"签名"而非"函数本身"。
 *
 * 3. 核心语法要点
 *    (1) 数组迭代方法的统一回调签名：
 *          map(cb)        cb(element, index, array) -> 新元素
 *          forEach(cb)    cb(element, index, array) -> 忽略返回值
 *          filter(cb)     cb(element, index, array) -> 真/假（保留）
 *          find(cb)       cb(element, index, array) -> 真/假（返回第一个命中的元素）
 *          findIndex(cb)  cb(element, index, array) -> 真/假（返回下标）
 *          some(cb)       cb(element, index, array) -> 真/假（短路于第一个真）
 *          every(cb)      cb(element, index, array) -> 真/假（短路于第一个假）
 *          flatMap(cb)    cb(element, index, array) -> 新元素（再拍平一层）
 *          reduce(cb, init)   cb(累计值, element, index, array)  <- 注意第 1 个参数是累计值！
 *          sort(cb)       cb(a, b) -> 负数/0/正数   <- 只传两个元素，是唯一的例外！
 *          （reduce 的签名不一样，所以 `reduce(parseInt)` 得到的结果是另一场灾难）
 *    (2) parseInt 的签名：
 *          parseInt(string, radix)
 *          - 第 1 个参数：要解析的字符串（不是字符串也会先被转成字符串）
 *          - 第 2 个参数：进制（2~36）。**不传或传 0 时按十进制处理**（ES5 之后规定，
 *            不再像远古时代那样"0 开头当八进制"）
 *          - 进制非法（0、1、37…）或字符串里出现该进制下不存在的数字 -> 返回 NaN
 *    (3) 谁"恰好也是单参数/兼容"所以不受影响：
 *          Number / parseFloat / String / Boolean / JSON.stringify 之前的那一个参数
 *          —— 它们要么只读第一个参数，要么多余参数被忽略。
 *          所以 `['10','10','10'].map(parseFloat)` 是**正确**的，`map(parseInt)` 不是。
 *    (4) 正确写法（四选一，都推荐）：
 *          arr.map(Number);                        // 最简洁，注意它对 '' 返回 0
 *          arr.map((s) => parseInt(s, 10));        // 明确写死十进制，最稳
 *          arr.map((s, i) => parseInt(s, 10) + i); // 真的需要下标时，显式声明形参
 *          arr.map(function (s) { return parseInt(s, 10); }); // 老式写法，同样安全
 *    (5) 通用原则（本文件真正想教的东西）：
 *          **函数作为一等公民直接当回调传入时，签名必须匹配。**
 *          只要不是"天生为该场景设计"的函数，就老老实实写一个箭头函数包装，
 *          用显式的形参列表把"我要哪几个参数"说清楚。
 *          多写 15 个字符，换掉一个可能查三天的线上 bug，绝对划算。
 *
 * 4. 常见陷阱
 *    - 【不报错】这是本陷阱最致命的地方：结果错了，但没有任何异常、没有任何警告。
 *    - 【下标 0 侥幸正确】parseInt('1', 0) 是合法的（按十进制），所以首元素正常，
 *      让人误以为"代码是对的"，只是后面某个数据脏了。
 *    - 【真正的原因不是 parseInt 坏了】`['10','10','10'].map(parseFloat)`
 *      结果正确 —— 说明问题在**签名**，不在函数实现。
 *    - 【sort 的签名是 (a, b)】**不是** (元素, 下标, 数组)，
 *      这是唯一一个参数个数与含义都不同的迭代方法；比较器必须返回数字的正负。
 *    - 【reduce 的第一个参数是累计值】所以 `[1,2,3].reduce(parseInt)` 也毫无意义。
 *    - 【箭头函数不能直接传进 sort 当"少参数比较器"乱用】，但 arrow 的隐式返回
 *      很容易写出 `sort((a, b) => a - b > 0)` 这种返回布尔值的错误写法
 *      （布尔会被转成 0/1，永远不会返回负数，排序结果不稳定）。
 *    - 【别把 console.log 直接当回调】`arr.forEach(console.log)` 会打印
 *      `值 下标 整个数组` 三样东西，输出比预期多得多。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 08_arrays/22_callback_signature_pitfall.js
 *
 * 【预期输出】
 *   逐段打印：回调签名的真实参数、parseInt 的进制语义、`map(parseInt)` 的错误结果、
 *   console.table 的"元素 / 下标 / 进制 / 结果"对照表、parseFloat 与 parseInt 的对比、
 *   sort(parseInt) 的错乱结果、forEach(console.log) 的多余输出，
 *   以及 4 种正确写法及其结果。全程无异常，退出码 0。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 准备数据：一批"字符串形式的数字"，模拟从后端 / CSV / 表单拿到的原始数据
// ---------------------------------------------------------------------------

// 真实项目里，HTTP 响应体、CSV 文件、<input> 的 value、localStorage 里的内容
// 全都是字符串。所以我们非常自然地想"把它们统一转成数字"。
const rawNumbers = ['1', '2', '3'];

// 再准备一个"单个元素"的版本，用来演示"为什么本地测试时发现不了这个 bug"
const singleNumber = ['42'];

// 再准备一个更长的，用来看清下标超过 10 之后的表现（进制 10 之后结果会"看起来正常"）
const longNumbers = ['10', '10', '10', '10', '10', '10', '10', '10', '10', '10', '10', '10'];

// 打印数组的小工具：直接用 JSON.stringify 会把 NaN 变成 null（JSON 里没有 NaN），
// 那会让我们看不清"这里真的是 NaN"，所以自定义一个保留 NaN 原貌的格式化函数。
// （顺带一提：这本身就是个通用陷阱 —— 用 JSON.stringify 调试 NaN/Infinity/undefined
//   时它们统统变成 null，会让你误以为是别的问题。）
const fmt = (arr) =>
  '[' +
  arr
    .map((v) => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : JSON.stringify(v)))
    .join(', ') +
  ']';

// ---------------------------------------------------------------------------
// 1. 先确认：数组方法的回调到底收到了几个参数？
// ---------------------------------------------------------------------------

console.log('--- 1. 数组迭代方法的回调签名是 (元素, 下标, 数组) ---');

// 我们写一个"照单全收"的回调，把收到的所有参数原封不动打印出来。
// 为了证明它真的收到了 3 个参数，这里用 rest 参数把它们收集成数组。
const showAllArgs = (...args) => {
  console.log('  回调收到', args.length, '个参数：', JSON.stringify(args));
};
// 注意：JSON.stringify 会把数组本身也序列化出来，正好让我们看清第 3 个参数是啥。

console.log('map 的回调参数：');
rawNumbers.map(showAllArgs);
// map 依然返回了一个新数组（每个回调都返回 undefined），这里只是不关心它。

console.log('forEach 的回调参数：');
rawNumbers.forEach(showAllArgs);

console.log('filter 的回调参数（回调返回 undefined，属于假值，所以过滤后为空数组）：');
console.log('  filter 结果 =', JSON.stringify(rawNumbers.filter(showAllArgs)));

console.log('find 的回调参数（没有命中，返回 undefined）：');
console.log('  find 结果 =', rawNumbers.find(showAllArgs));

console.log('some 的回调参数（返回 undefined 视为假，继续遍历完所有元素）：');
console.log('  some 结果 =', rawNumbers.some(showAllArgs));

console.log('every 的回调参数（返回 undefined 视为假，在第一个元素后就短路）：');
console.log('  every 结果 =', rawNumbers.every(showAllArgs));

// sort 是个例外：它的回调只收到两个"待比较的元素"，没有下标、没有数组。
console.log('sort 的回调参数（例外！只有两个元素，没有下标）：');
rawNumbers.slice().sort((a, b) => {
  showAllArgs(a, b);
  return 0; // 返回 0 表示"顺序不变"，这里只是借用 sort 来打印，不真的排序
});

// ---------------------------------------------------------------------------
// 2. 再看 parseInt 的签名：(字符串, 进制)
// ---------------------------------------------------------------------------

console.log('--- 2. parseInt(str, radix) 的第 2 个参数是进制 ---');

// 单独调用 parseInt，第二个参数是我们主动传的进制，一切都符合直觉。
console.log("parseInt('101', 2)  =", parseInt('101', 2), '  // 二进制 101 = 5');
console.log("parseInt('101', 8)  =", parseInt('101', 8), '  // 八进制 101 = 65');
console.log("parseInt('101', 10) =", parseInt('101', 10), ' // 十进制 101 = 101');
console.log("parseInt('101', 16) =", parseInt('101', 16), '// 十六进制 101 = 257');
// 进制 0 是特例：ES5 之后明确规定"0 等价于十进制"（不再是老 IE 的八进制行为）。
console.log("parseInt('101', 0)  =", parseInt('101', 0), ' // 进制 0 -> 按十进制处理');
// 进制 1 非法：一进制没有意义，返回 NaN。
console.log("parseInt('2', 1)    =", parseInt('2', 1), '  // 进制 1 是非法的');
// 二进制里只有 0 和 1，出现 3 就无法解析，返回 NaN。
console.log("parseInt('3', 2)    =", parseInt('3', 2), '  // 二进制里没有数字 3');
// 进制必须在 2~36 之间（超出范围同样返回 NaN）。
console.log("parseInt('1', 37)   =", parseInt('1', 37), '  // 进制超过 36 也是非法的');
console.log("parseInt('1', -1)   =", parseInt('1', -1), '  // 负进制同样非法');

// 关键点：语言层面**不会检查**"你把下标当地进制传进来了"，
// 因为下标（0, 1, 2, 3…）在语法上完全是一个合法的、类型正确的数字。
// 语义错误 → 静默错误，这是本陷阱的全部杀伤力来源。

// ---------------------------------------------------------------------------
// 3. 事故现场：['1','2','3'].map(parseInt)
// ---------------------------------------------------------------------------

console.log('--- 3. 事故现场：map(parseInt) ---');

// 等价于 parseInt('1', 0)、parseInt('2', 1)、parseInt('3', 2)
const wrongResult = rawNumbers.map(parseInt);

console.log('rawNumbers               =', fmt(rawNumbers));
console.log('rawNumbers.map(parseInt) =', fmt(wrongResult));
// 期望 [1, 2, 3]，实际 [1, NaN, NaN]。
// 注意这里必须用 fmt 而不是 JSON.stringify：后者会把 NaN 显示成 null，
// 新手很容易因此误以为是"空值/未定义"，从而找错方向。

// 展开写一遍，证明"直接传 parseInt"和"手动按下标调用"完全等价：
console.log('  逐项展开（手动按下标调用，结果与上面完全一致）：');
rawNumbers.forEach((s, i) => {
  console.log(`    parseInt(${JSON.stringify(s)}, ${i}) =`, parseInt(s, i));
});

// 用 console.table 把"下标 → 进制 → 结果"的对应关系一次性摆出来，最直观。
console.log('  console.table 对照表：');
console.table(
  rawNumbers.map((element, index) => ({
    元素: element,
    被当作进制的下标: index, // 数组方法把 index 传给了 parseInt 的第 2 个形参
    相当于调用了: `parseInt('${element}', ${index})`,
    实际结果: parseInt(element, index),
    期望结果: parseInt(element, 10),
  })),
);

// 再看单个元素的版本：只有下标 0，恰好合法，结果是完全正确的。
console.log("  只有 1 个元素时 ['42'].map(parseInt) =", fmt(singleNumber.map(parseInt)));
console.log('  ^ 首元素下标是 0，而进制 0 等价于十进制，所以侥幸正确 —— 这就是本地测试发现不了的原因！');

// 长数组更明显地暴露问题：下标 0 正常、1 是 NaN、2 起是二进制/三进制…，
// 下标 10 恰好又是十进制，所以第 11 个元素（下标 10）看起来恢复正常。
console.log('  12 个 "10" 的结果：');
console.table(
  longNumbers.map((element, index) => ({
    元素: element,
    下标_即进制: index,
    实际结果: parseInt(element, index),
  })),
);
console.log('  ^ 下标 10 是合法进制（十进制），所以它又"正常"了 —— 时对时错，最难排查。');
console.log('    注意下标 >= 2 时，parseInt("10", 2) = 2，数字被"解释"成了另一个值，而不是 NaN。');

// ---------------------------------------------------------------------------
// 4. 对照组：parseFloat / Number 为什么没事？—— 因为签名匹配
// ---------------------------------------------------------------------------

console.log('--- 4. 对照组：parseFloat / Number 只关心第 1 个参数 ---');

// parseFloat 的签名是 parseFloat(string)，**没有第二个参数**（历史上曾有过
// 第二参数的提案，最终没进标准）。所以多传进来的下标会被**直接忽略**。
console.log("['10','10','10'].map(parseFloat) =", fmt(['10', '10', '10'].map(parseFloat)));
console.log('  ^ 完全正确。所以问题不在"函数好不好"，而在"签名匹不匹配"。');

// Number 作为构造函数只接收 1 个参数，多余参数同样被忽略。
console.log("['1','2','3'].map(Number)        =", fmt(rawNumbers.map(Number)));

// String、Boolean 同理：都是"只读第一个参数"的函数，可以安全直接传。
console.log('[1,2,0,0].map(Boolean)           =', fmt([1, 2, 0, 0].map(Boolean)));
console.log('  ^ 这是 Array 章节常见的"过滤掉假值"写法，因为 Boolean 只看第 1 个参数，所以安全。');

// 反例：Math.max 接收可变参数，直接传进 map 会把 (元素, 下标, 数组) 全部拿去求最大值。
console.log('  [5, 3, 9].map(Math.max) =', fmt([5, 3, 9].map(Math.max)));
console.log('  ^ 三次调用的实际参数分别是：');
console.log('      Math.max(5, 0, [5,3,9])  -> 数组被转成字符串 "5,3,9"，无法比较 -> NaN');
console.log('      Math.max(3, 1, [5,3,9])  -> 同上 -> NaN');
console.log('      Math.max(9, 2, [5,3,9])  -> 同上 -> NaN');
console.log('    所以结果是 [NaN, NaN, NaN]，而不是 [5, 3, 9]。');
console.log('  ^ 这个例子说明：只要形参个数/含义对不上，就一定会出问题，'
  + '哪怕这个函数"平时"完全正确。');

// ---------------------------------------------------------------------------
// 5. 同类陷阱：forEach(console.log) 会多打印两样东西
// ---------------------------------------------------------------------------

console.log('--- 5. 同类陷阱：forEach(console.log) ---');

console.log('  预期只打印 3 个元素，实际每个元素后面还跟着下标和整个数组（下面 3 行）：');
rawNumbers.forEach(console.log);
// 原因：forEach 依次用 (元素, 下标, 数组) 三个参数调用 console.log，
// 而 console.log 是可变参数的，于是它老老实实把三个都打印了。
console.log('  ^ 一共 3 行、每行 3 个值，而不是预期的 3 行、每行 1 个值。');
console.log('  正确写法：rawNumbers.forEach((x) => console.log(x));');

// ---------------------------------------------------------------------------
// 6. 同类陷阱：sort(parseInt) 结果错乱
// ---------------------------------------------------------------------------

console.log('--- 6. 同类陷阱：sort(parseInt) ---');

// sort 的回调签名是 (a, b)，要求返回负数/0/正数。
// parseInt(a, b) 的返回值是"把 a 当成 b 进制解析出的数字"，这个数字
// 恰好也能被 sort 当作"负数/0/正数"来解释，于是**不报错但顺序乱掉**。
const toSort = [3, 1, 2, 10, 5];
const sortedWrong = toSort.slice().sort(parseInt);
const sortedRight = toSort.slice().sort((a, b) => a - b);
console.log('  原数组            =', JSON.stringify(toSort));
console.log('  sort(parseInt)    =', JSON.stringify(sortedWrong), ' <- 结果不可靠');
console.log('  sort((a,b)=>a-b)  =', JSON.stringify(sortedRight), ' <- 正确');
console.log('  比较器实际被这样调用（a 当字符串、b 当进制）：');
console.log('    parseInt("3", 1) =', parseInt('3', 1), '// 进制 1 非法 -> NaN');
console.log('    parseInt("1", 3) =', parseInt('1', 3), '// 三进制里的 1 = 1');
console.log('  ^ 看起来"没崩"，但比较器返回的 NaN/乱值让排序结果毫无意义。');

// ---------------------------------------------------------------------------
// 7. 正确写法汇总
// ---------------------------------------------------------------------------

console.log('--- 7. 四种正确写法（结果全部一致） ---');

const fixed1 = rawNumbers.map(Number); // 最简洁
const fixed2 = rawNumbers.map((s) => parseInt(s, 10)); // 明确十进制，最稳
const fixed3 = rawNumbers.map((s, i) => parseInt(s, 10) + i); // 真的需要下标时，显式声明
const fixed4 = rawNumbers.map(function (s) {
  // 传统函数写法，同样安全：形参列表只有 s，多余参数被丢弃
  return parseInt(s, 10);
});

console.log("  map(Number)                    =", JSON.stringify(fixed1));
console.log("  map((s) => parseInt(s, 10))    =", JSON.stringify(fixed2));
console.log("  map((s, i) => parseInt(s,10)+i)=", JSON.stringify(fixed3), '// 显式使用下标');
console.log("  map(function (s) { ... })      =", JSON.stringify(fixed4));

// 顺带一提：Number 与 parseInt 的语义差异（真实项目里要按需选择）
console.log('  注意 Number 与 parseInt 的细微差别：');
console.log("    Number('')          =", Number(''), '  // 空串 -> 0（容易造成"脏数据变 0"）');
console.log("    parseInt('', 10)    =", parseInt('', 10), '   // 空串 -> NaN（更能暴露脏数据）');
console.log("    Number('12px')      =", Number('12px'), '   // 有杂字符 -> NaN');
console.log("    parseInt('12px',10) =", parseInt('12px', 10), '  // 前缀解析 -> 12');
console.log("    Number('0x10')      =", Number('0x10'), '  // 支持 0x 前缀 -> 16');
console.log("    parseInt('0x10',10) =", parseInt('0x10', 10), '   // 指定十进制后 -> 0（到 x 就停了）');

// 通用原则：需要"额外上下文"（进制、精度、单位）时，写箭头函数显式包装。
// 只有在签名完全匹配（如 Number、Boolean）时，才把函数裸传进去。

// ---------------------------------------------------------------------------
// 8. 通用原则总结
// ---------------------------------------------------------------------------

console.log('--- 8. 通用原则：函数当回调时，签名必须匹配 ---');
console.log('  1) map/forEach/filter/find/some/every/flatMap 的回调都是 (元素, 下标, 数组)');
console.log('  2) reduce 的回调是 (累计值, 元素, 下标, 数组)，第一个参数不是元素');
console.log('  3) sort 的回调是 (a, b)，必须返回数字，不要返回布尔值');
console.log('  4) 只读第 1 个参数的函数（Number/parseFloat/String/Boolean）可以裸传');
console.log('  5) 只要有一丝不确定，就用箭头函数显式声明形参 —— 多写几个字符，省几天排查');
console.log('  6) 别指望引擎报错：签名不匹配属于"语义错误"，永远静默');
console.log('  7) 单元测试要覆盖"多元素 + 不同下标"的输入，单个元素的用例会漏掉下标 0 的侥幸');

console.log('  以上演示全部执行完毕。');
