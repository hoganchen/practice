/**
 * ============================================================================
 * 知识点：console 对象的常用方法
 * ============================================================================
 *
 * 【所属分类】00_hello_world —— 起步
 * 【难度等级】入门
 * 【前置知识】00_hello_world/01_hello_world.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    console 不是 JavaScript 语言规范（ECMAScript）的一部分，而是宿主环境
 *    （Node.js、浏览器、Deno 等）注入的全局对象。它提供了一组"输出/调试"API：
 *    log / info / warn / error / table / dir / time / timeEnd / group / groupEnd /
 *    assert / count / trace 等。因为它是宿主提供的，所以浏览器控制台的 console
 *    有面板分组、可折叠对象等 UI 能力，而 Node.js 的 console 只是往
 *    stdout / stderr 两个流里写字。
 *
 * 2. 为什么需要 / 解决什么问题
 *    程序出了问题，第一反应就是"打日志"。console 提供了从最基础的打印
 *    （log）到结构化展示（table）、性能计时（time）、条件断言（assert）等一整套
 *    轻量调试工具。掌握它们可以让调试效率提升一大截，而且不用引入任何依赖。
 *
 * 3. 核心语法要点
 *    - console.log/info   → 写入 stdout，语义上 info 表示"普通信息"
 *    - console.warn/error → 写入 stderr，语义上表示"警告 / 错误"
 *    - console.table(obj) → 把数组 / 对象渲染成表格，终端里以 ASCII 表格输出
 *    - console.dir(obj, {depth}) → 以"对象视角"打印，可控制展开层级
 *    - console.time(label) / timeEnd(label) → 计时，标签必须一一配对
 *    - console.group(label) / groupEnd() → 缩进分组，让输出有层次
 *    - console.assert(条件, 消息) → 条件为假时才打印（注意：它不会中断程序）
 *    - console.count(label) / countReset(label) → 计数
 *    - 格式化占位符：%s 字符串、%d 数字、%i 整数、%f 浮点、%o 对象、%j JSON、%c CSS
 *
 * 4. 常见陷阱与注意事项
 *    - console.log 会把对象"引用"打印出来；在某些环境下（浏览器控制台）
 *      展开对象时看到的是"当前时刻"的值，而不是打印时刻的快照，容易误判。
 *      Node.js 的终端输出则是即时快照，行为更符合直觉。
 *    - console.assert 条件为真时什么都不打印，不要让"没输出"被误解为出错。
 *    - console.time 与 timeEnd 的标签必须完全一致（区分大小写），否则会打印警告。
 *    - log/info 走 stdout，warn/error 走 stderr。在 CI 里只收集 stdout 时会"丢日志"。
 *    - console.error 不会让进程非零退出。它只是写 stderr，程序照常继续。
 *    - 占位符数量与参数数量不匹配时，多余的参数会被追加到末尾输出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 00_hello_world/02_console_methods.js
 *
 * 【预期输出】
 *   分节打印 console 各方法的效果：基础打印、格式化占位符、表格、
 *   对象展开、计时、分组、断言、计数。warn/error 会出现在 stderr 中。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. log / info / warn / error：四个级别
// ---------------------------------------------------------------------------

console.log('--- 1. 四个基础输出方法与 stdout / stderr 的区别 ---');

// console.log 与 console.info 在功能上完全等价，都写入标准输出（stdout）。
// 它们的区别只是"语义"：info 表示"这是一条普通信息"，供阅读者区分重要程度。
console.log('log：普通日志');
console.info('info：信息级日志（与 log 输出同一流）');

// console.warn 写入标准错误（stderr）。语义上表示"可能有问题，但程序还能继续"。
console.warn('warn：警告级日志（写入 stderr）');

// console.error 同样写入 stderr，语义上表示"出错了"。
// 重要：它不会中断程序，也不会让退出码变成非零，后续代码照常执行。
console.error('error：错误级日志（写入 stderr，但不会中断程序）');
console.log('上面那行 error 之后，本行依然正常执行 → 证明 error 不会终止程序');

// ---------------------------------------------------------------------------
// 2. 格式化占位符：把变量嵌进字符串
// ---------------------------------------------------------------------------

console.log('\n--- 2. 格式化占位符 ---');

const name = '小明';
const age = 18;
const score = 95.5678;

// %s → 转成字符串；%d / %i → 转成数字（整数）；%f → 浮点数
console.log('我叫 %s，今年 %d 岁，得分 %f', name, age, score);
// 注意：%f 不控制小数位；要控制位数得自己调 toFixed。
console.log('用 toFixed 保留两位小数：', score.toFixed(2));

// %o → 以"带隐藏属性和类型信息"的对象形式展开，函数会显示成 [Function: greet]。
const user = { id: 1, nick: 'alice', tags: ['admin', 'dev'], greet() {} };
console.log('%o →', user);

// %O → 与 %o 类似，但不显示隐藏属性（如数组的 length），输出更干净。
console.log('%O →', user);

// %j → 转成 JSON 字符串。遇到循环引用会输出 [Circular] 而不是抛错。
console.log('%j →', user);

// %c → CSS 样式，只在浏览器控制台有效。
// Node.js 的行为是：识别 %c 占位符、把对应的样式参数"吃掉"（不输出），
// 所以打印出来会看到 %c 消失了、只留下两边的文字。
console.log('用 %c 打印（浏览器里会变红，Node 里样式串被忽略）', 'color:red;font-size:20px');

// 参数多于占位符时，多余参数会按空格拼接追加在后面（不会报错）。
console.log('占位符只有一个 %s，但后面还跟了两个参数：', 'A', 'B', 'C');

// 反过来，占位符多于参数时，没有参数可用的占位符会原样保留在输出里。
// 这是很常见的笔误来源，看到输出里冒出一个 %s 就要检查参数个数。
console.log('这里有三个占位符 %s / %s / %s，但只给了两个参数：', '甲', '乙');

// ---------------------------------------------------------------------------
// 3. console.table：结构化数据用表格看
// ---------------------------------------------------------------------------

console.log('\n--- 3. console.table 表格输出 ---');

// 传入"对象数组"时，console.table 会以数组元素的下标为行号，
// 以对象的键作为列名，渲染成一张对齐的表格。数据一多，比 log 可读性高得多。
const students = [
  { name: '小明', age: 18, score: 92 },
  { name: '小红', age: 19, score: 88 },
  { name: '小刚', age: 17, score: 76 },
];
console.table(students);

// 第二个参数可以指定"只显示哪些列"，用来过滤掉不关心的字段。
console.table(students, ['name', 'score']);

// 传入普通对象（非数组）时，会把"键-值"按两列排成表格。
const config = { host: 'localhost', port: 8080, debug: true };
console.table(config);

// ---------------------------------------------------------------------------
// 4. console.dir：以对象视角打印，可控制深度
// ---------------------------------------------------------------------------

console.log('\n--- 4. console.dir 与展开深度 ---');

// 构造一个嵌套较深的对象，用来观察深度限制。
const deep = { l1: { l2: { l3: { l4: { l5: '到底了' } } } } };

// log 与 dir 在不传选项时，对普通对象的输出基本相同。
console.log('log 直接打印深层对象：');
console.log(deep);

console.dir(deep);
// { depth: null } 表示"无限递归展开"，会把所有层级都打出来。
console.dir(deep, { depth: null });
// { depth: 1 } 表示只展开一层，更深的层级显示为 [Object]。
console.dir(deep, { depth: 1 });

// ---------------------------------------------------------------------------
// 5. console.time / timeEnd：给代码计时
// ---------------------------------------------------------------------------

console.log('\n--- 5. console.time / console.timeEnd 计时 ---');

// time(label) 以 label 为键记录起始时间戳；timeEnd(label) 打印经过的毫秒数。
// 标签必须完全一致（区分大小写），否则 Node 会打印一个警告。
console.time('累加百万次');

let sum = 0;
for (let i = 0; i < 1_000_000; i++) {
  sum += i;
}

console.timeEnd('累加百万次'); // 输出形如：累加百万次: 4.123ms
console.log('累加结果：', sum);

// 同一个标签可以重复使用（timeEnd 之后计时器就被消耗掉了）。
console.time('字符串拼接');
let s = '';
for (let i = 0; i < 10_000; i++) {
  s += 'a';
}
console.timeEnd('字符串拼接');

// ---------------------------------------------------------------------------
// 6. console.group / groupEnd：让输出有层次
// ---------------------------------------------------------------------------

console.log('\n--- 6. console.group / console.groupEnd 分组缩进 ---');

// group 会增加一级缩进，内部所有输出都缩进，直到 groupEnd 结束。
// 浏览器控制台里这会变成一个可折叠的分组，Node 终端里则表现为缩进。
console.group('用户信息');
console.log('姓名：小明');
console.log('年龄：18');
console.group('地址信息'); // 可以嵌套，缩进再增加一级
console.log('城市：北京');
console.log('街道：中关村大街 1 号');
console.groupEnd(); // 结束"地址信息"分组
console.groupEnd(); // 结束"用户信息"分组
console.log('分组已全部结束，缩进恢复');

// ---------------------------------------------------------------------------
// 7. console.assert：条件为假时才出声
// ---------------------------------------------------------------------------

console.log('\n--- 7. console.assert 断言 ---');

// 只有当第一个参数为"假值"（falsy）时，才会打印后面的消息。
// 如果条件为真，则什么都不输出 —— 这就是"沉默即通过"。
console.assert(1 + 1 === 2, '这行不会打印，因为条件为真');
console.assert(1 + 1 === 3, '这行会打印：1 + 1 === 3 断言失败');

// 关键点：assert 失败只是"打印一条消息"，不会抛异常、不会中断程序。
console.log('assert 失败之后，程序依然继续执行 → 这正是它和 throw 的区别');

// ---------------------------------------------------------------------------
// 8. console.count / countReset：计数
// ---------------------------------------------------------------------------

console.log('\n--- 8. console.count 计数 ---');

// count(label) 每调用一次，就为该标签的计数器加一，并把当前次数打印出来。
// 标签省略时默认使用 'default'。
for (const fruit of ['苹果', '香蕉', '苹果', '苹果', '香蕉']) {
  console.count(fruit + ' 出现次数');
}
// 注意：不同标签各自独立计数，上面 "苹果 出现次数" 与 "香蕉 出现次数" 是两套计数器。

// countReset(label) 把指定标签的计数清零，下次 count 从 1 重新开始。
console.countReset('苹果 出现次数');
console.count('苹果 出现次数'); // 输出 苹果 出现次数: 1

// 不传标签时操作的是默认计数器。
console.count(); // default: 1
console.count(); // default: 2
console.countReset();
console.count(); // default: 1

// ---------------------------------------------------------------------------
// 9. 收尾
// ---------------------------------------------------------------------------

console.log('\n--- 9. 小结 ---');
console.log('本节演示完毕。请留意：warn / error 的内容出现在 stderr 里。');
console.log('若在命令行中重定向，可用 `node 文件 > out.txt 2> err.txt` 分开查看。');
