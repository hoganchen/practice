/**
 * ============================================================================
 * 知识点：break / continue 与带标签的语句（label）
 * ============================================================================
 *
 * 【所属分类】05_control_flow —— 流程控制
 * 【难度等级】进阶
 * 【前置知识】05_control_flow/03_for_loop.js、05_control_flow/04_while_loops.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    break 和 continue 是控制循环流程的两个跳转语句：
 *      break    —— 立即**终止**当前循环（或 switch），跳到循环之后的语句继续执行
 *      continue —— **跳过本轮剩余代码**，直接进入下一轮（for 会先执行更新段）
 *    标签（label）是在语句前写的一个标识符加冒号：`outer:`，
 *    配合 `break outer;` / `continue outer;` 就能控制**多层嵌套**循环中的外层循环。
 *
 * 2. 为什么需要
 *    循环常常要"找到一个就停"（break）或"跳过不符合条件的数据"（continue），
 *    没有它们就得靠复杂的状态变量和额外 if 去模拟。
 *    标签虽然用得少，但处理二维网格、矩阵查找、嵌套循环退出时，
 *    它是最直接、最不容易写错的工具（比用标志位变量清晰得多）。
 *
 * 3. 核心语法要点
 *    【break 的作用范围】
 *      - 在循环中：终止整个循环
 *      - 在 switch 中：终止 switch（防止 fallthrough）
 *      - 带标签时：终止**指定的**那个带标签的语句
 *    【continue 的细节】
 *      - 在 for 中，continue 会执行"更新表达式"再判断条件（所以计数器不会漏加）
 *      - 在 while 中，continue 会直接回到条件判断（如果更新在循环体后面，就会漏加！）
 *      - continue 不能用在 switch 中"跳过剩余 case"（它只能作用于循环）
 *    【标签的语法】
 *      标签可以贴在任意语句前面，但只对循环（和 switch）的 break / continue 有意义：
 *        outer: for (...) { for (...) { break outer; } }
 *      标签名可以是任何合法标识符，建议用有意义的词（outer、rows、matrix），不要用 l1/l2。
 *    【与 return 的关系】
 *      在函数内部，return 比 break 更直接（一次跳出所有层）。所以能封装成函数时，
 *      优先用"函数 + return"而不是多层 break（见 08_early_return.js）。
 *
 * 4. 常见陷阱
 *    - 在 while 中把"更新"写在 continue 之后，会让计数器不被推进而变成死循环。
 *    - 标签名与变量名重名不会报错但会让人困惑，建议加 distinct 前缀。
 *    - 忘记 break 会导致循环跑完所有轮次，性能浪费（尤其在大数据上）。
 *    - 用 break 只能跳出**一层**，嵌套循环里只写 break 常常不是你要的效果。
 *    - continue 用在非循环的块里是语法错误（如 if 块中）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 05_control_flow/07_break_continue.js
 *
 * 【预期输出】
 *   依次打印 break 与 continue 的基础用法、两者的对照轨迹、
 *   while 中 continue 的陷阱、嵌套循环里"只跳一层"的问题、
 *   标签语句的正确用法，以及用标志变量替代标签的写法对比。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. break 的基础用法：找到一个就停
// ---------------------------------------------------------------------------

console.log('--- 1. break 基础 ---');

const numbers = [3, 8, 15, 22, 7, 30];

// 找到第一个大于 10 的数就停止
for (const n of numbers) {
  console.log(`  检查 ${n}`);
  if (n > 10) {
    console.log(`  => 找到第一个大于 10 的数：${n}，立即 break`);
    break; // 跳出整个循环，后面的 22、7、30 都不再检查
  }
}
console.log('  循环已结束');

// 在 switch 里 break 的作用是"阻止穿透"（见 02_switch.js），这里再给一个对照
function switchWithoutBreak(v) {
  const hits = [];
  switch (v) {
    case 1:
      hits.push('case 1');
    case 2:
      hits.push('case 2');
      break; // 从这里跳出 switch
    case 3:
      hits.push('case 3');
  }
  return hits;
}
console.log('  switch(1) 命中 =', switchWithoutBreak(1)); // ['case 1','case 2']
console.log('  switch(3) 命中 =', switchWithoutBreak(3)); // ['case 3']

// ---------------------------------------------------------------------------
// 2. continue 的基础用法：跳过不符合条件的
// ---------------------------------------------------------------------------

console.log('\n--- 2. continue 基础 ---');

// 只处理偶数，奇数直接跳过
for (let i = 1; i <= 6; i++) {
  if (i % 2 !== 0) {
    console.log(`  ${i} 是奇数，continue 跳过`);
    continue; // 跳过本轮剩下的语句，直接进入下一轮
  }
  console.log(`  处理偶数 ${i}`);
}

// continue 等价于"用 if 包住剩余逻辑"，但能减少嵌套层级
console.log('  用 if 包装的等价写法：');
for (let i = 1; i <= 6; i++) {
  if (i % 2 === 0) {
    console.log(`    处理偶数 ${i}`);
  }
}
console.log('  => 两种写法的结果一致，continue 版本在大段逻辑前更易读');

// 实战：过滤并处理数据
const records = [
  { id: 1, valid: true, value: 100 },
  { id: 2, valid: false, value: 200 },
  { id: 3, valid: true, value: 300 },
  { id: 4, valid: false, value: 400 },
];
let sum = 0;
const processedIds = [];
for (const record of records) {
  if (!record.valid) {
    continue; // 无效数据直接跳过，不用把主逻辑包在 if 里
  }
  sum += record.value;
  processedIds.push(record.id);
}
console.log('  有效记录 id =', processedIds, '，合计 =', sum); // [1,3], 400

// ---------------------------------------------------------------------------
// 3. break 与 continue 的轨迹对照
// ---------------------------------------------------------------------------

console.log('\n--- 3. 轨迹对照 ---');

// break：直接结束循环
function traceBreak() {
  const trace = [];
  for (let i = 0; i < 5; i++) {
    if (i === 2) {
      trace.push('break：立即结束循环');
      break;
    }
    trace.push(`处理 i=${i}`);
  }
  return trace;
}
console.log('  break 的轨迹：', traceBreak().join(' -> '));

// continue：跳过本轮，继续下一轮
function traceContinue() {
  const trace = [];
  for (let i = 0; i < 5; i++) {
    if (i === 2) {
      trace.push('continue：跳过 i=2');
      continue;
    }
    trace.push(`处理 i=${i}`);
  }
  return trace;
}
console.log('  continue 的轨迹：', traceContinue().join(' -> '));

// 同样的代码，把 break 换成 continue，循环次数完全不同

// ---------------------------------------------------------------------------
// 4. 陷阱：while 中 continue 会跳过"更新"语句
// ---------------------------------------------------------------------------

console.log('\n--- 4. 陷阱：while 里的 continue ---');

// for 循环：continue 之后会执行 i++，所以计数器不会漏加
const forTrace = [];
for (let i = 0; i < 5; i++) {
  if (i % 2 === 0) continue; // continue 后仍然会执行 i++
  forTrace.push(i);
}
console.log('  for 中 continue 的结果 =', forTrace); // [1,3]（正常）

// while 循环：如果更新写在 continue 之后，就会漏加 => 死循环
// 下面用一个安全计数器演示这个 bug 并强制退出
let i = 0;
let guard = 0;
const whileTrace = [];
const SAFE_LIMIT = 6;
while (i < 5) {
  guard++;
  if (guard > SAFE_LIMIT) {
    console.log(`  检测到死循环（i 一直是 ${i}），已在 ${guard} 次迭代后强制退出`);
    break; // 必须跳出
  }
  if (i % 2 === 0) {
    // 错误示范：更新语句在 continue 后面，被跳过了，i 永远不变
    continue;
  }
  whileTrace.push(i);
  i++; // 这行永远轮不到执行
}
console.log('  while 中错误用法的结果 =', whileTrace);

// 正确写法：把更新放在最前面，或者用 for 循环
let j = 0;
const fixedTrace = [];
while (j < 5) {
  const current = j;
  j++; // 先推进计数器，再处理逻辑，continue 也不会漏加
  if (current % 2 === 0) continue;
  fixedTrace.push(current);
}
console.log('  while 中正确用法的结果 =', fixedTrace); // [1,3]

// ---------------------------------------------------------------------------
// 5. 陷阱：嵌套循环里 break 只跳一层
// ---------------------------------------------------------------------------

console.log('\n--- 5. break 只跳一层 ---');

const matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
];

// 想找 5 并完全停止。内层 break 只能跳出内层循环，外层还会继续！
function findWithoutLabel(target) {
  const visited = [];
  for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      visited.push(`(${row},${col})`);
      if (matrix[row][col] === target) {
        visited.push('内层 break');
        break; // 只跳出内层的 col 循环，外层的 row 循环继续
      }
    }
    // 外层循环没有被终止，于是继续遍历后面的行
  }
  return visited;
}
console.log('  只用 break 的访问轨迹：');
console.log('    ' + findWithoutLabel(5).join(' '));
console.log('  => 找到 5 之后内层虽然停了，但外层还继续跑完了第 2 行，做了无用功');

// 方案一：用标志变量（老办法，能用但啰嗦）
function findWithFlag(target) {
  const visited = [];
  let found = false; // 需要一个额外变量
  for (let row = 0; row < matrix.length; row++) {
    if (found) break; // 每层都要检查一次
    for (let col = 0; col < matrix[row].length; col++) {
      visited.push(`(${row},${col})`);
      if (matrix[row][col] === target) {
        found = true;
        break;
      }
    }
  }
  return visited;
}
console.log('  用标志变量的访问轨迹：');
console.log('    ' + findWithFlag(5).join(' '));
console.log('  => 找到了就停，不再做无用功');

// 方案二：用带标签的 break（推荐，最直接）
function findWithLabel(target) {
  const visited = [];
  // 标签贴在"外层 for"前面，名字叫 searchRows
  searchRows: for (let row = 0; row < matrix.length; row++) {
    for (let col = 0; col < matrix[row].length; col++) {
      visited.push(`(${row},${col})`);
      if (matrix[row][col] === target) {
        visited.push('break searchRows');
        break searchRows; // 直接跳出被标记的那层循环（外层）
      }
    }
  }
  return visited;
}
console.log('  用标签 break 的访问轨迹：');
console.log('    ' + findWithLabel(5).join(' '));
console.log('  => 与标志变量效果一致，但不需要额外变量、也不需要每层都判断');

// 方案三：封装成函数 + return（最推荐，见 08_early_return.js）
function findWithReturn(target) {
  const visited = [];
  function search() {
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        visited.push(`(${row},${col})`);
        if (matrix[row][col] === target) {
          return { row, col }; // 一次跳出所有层
        }
      }
    }
    return null;
  }
  const hit = search();
  return { visited, hit };
}
const withReturn = findWithReturn(5);
console.log('  用函数 return 的访问轨迹：');
console.log('    ' + withReturn.visited.join(' '));
console.log('    返回值 =', withReturn.hit);

// ---------------------------------------------------------------------------
// 6. 标签 + continue：跳到外层循环的下一轮
// ---------------------------------------------------------------------------

console.log('\n--- 6. 标签 continue ---');

// continue 带标签：跳过外层循环的剩余部分，直接进入外层的下一轮
const pairs = [
  [1, 'keep'],
  [2, 'skip-rest-of-row'],
  [3, 'keep'],
];

console.log('  用 continue outer 跳过整行剩余元素：');
rowLoop: for (const [num, tag] of pairs) {
  for (const ch of tag) {
    if (ch === '-') {
      console.log(`    行 ${num} 遇到分隔符，continue rowLoop（跳到下一行）`);
      continue rowLoop; // 跳到外层循环的下一轮
    }
    process.stdout.write(`    行 ${num} 处理字符 '${ch}'\n`);
  }
}

// 一个更实用的例子：二维数组里"按行求和，遇到负数就跳过整行"
const table = [
  [1, 2, 3],
  [4, -1, 6],
  [7, 8, 9],
];

console.log('  按行求和（负数行整行跳过）：');
rows: for (let row = 0; row < table.length; row++) {
  let rowSum = 0;
  for (const value of table[row]) {
    if (value < 0) {
      console.log(`    第 ${row} 行含负数 ${value}，continue rows 跳过整行`);
      continue rows; // 不需要再算这一行，直接进入下一行
    }
    rowSum += value;
  }
  console.log(`    第 ${row} 行求和 = ${rowSum}`);
}

// ---------------------------------------------------------------------------
// 7. 标签也可以用在代码块上
// ---------------------------------------------------------------------------

console.log('\n--- 7. 标签用在代码块上 ---');

// 标签可以贴在任意语句前，配合 break 可以用来"跳出任意块"
// 不过这种写法可读性一般，仅在需要从深层嵌套里退出时使用
function findInBlock(data, target) {
  let result = 'not found';
  searchBlock: {
    for (const item of data) {
      if (item === target) {
        result = `found: ${item}`;
        break searchBlock; // 跳出被标记的整个代码块
      }
    }
    result = '循环跑完了也没找到';
  }
  return result;
}
console.log('  findInBlock([1,2,3], 2) =', findInBlock([1, 2, 3], 2)); // found: 2
console.log('  findInBlock([1,2,3], 9) =', findInBlock([1, 2, 3], 9)); // 循环跑完了也没找到

// 注意：continue 不能用于带标签的非循环语句（会抛 SyntaxError）
try {
  new Function('blk: { continue blk; }');
  console.log('  没有报错（不会执行到这里）');
} catch (err) {
  console.log('  continue 用在非循环块上抛出：', err.constructor.name, '-', err.message.split('\n')[0]);
}

// ---------------------------------------------------------------------------
// 8. 实战：批次处理与短路搜索
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实战 ---');

// 实战一：批量处理，遇到"致命错误"就停止，遇到"可跳过错误"就继续
const tasks = [
  { name: '任务A', result: 'ok' },
  { name: '任务B', result: 'warn' },
  { name: '任务C', result: 'fatal' },
  { name: '任务D', result: 'ok' },
];
const logs = [];
for (const task of tasks) {
  if (task.result === 'warn') {
    logs.push(`${task.name}：警告，跳过`);
    continue; // 跳过当前任务，继续后面的
  }
  if (task.result === 'fatal') {
    logs.push(`${task.name}：致命错误，终止整个批次`);
    break; // 终止整个批次
  }
  logs.push(`${task.name}：处理成功`);
}
console.log('  批次处理日志：');
for (const line of logs) console.log('    ' + line);

// 实战二：跳过已处理过的项（配合 Set 做去重）
const seen = new Set();
const rawEvents = [
  { id: 'e1', type: 'click' },
  { id: 'e2', type: 'view' },
  { id: 'e1', type: 'click' }, // 重复事件
  { id: 'e3', type: 'scroll' },
];
const uniqueEvents = [];
for (const event of rawEvents) {
  if (seen.has(event.id)) {
    console.log(`  事件 ${event.id} 已处理过，continue 跳过`);
    continue;
  }
  seen.add(event.id);
  uniqueEvents.push(event);
}
console.log('  去重后的事件数 =', uniqueEvents.length); // 3

// 实战三：带标签的二维搜索（在一个"座位表"里找第一个空位）
const seats = [
  ['taken', 'taken', 'taken'],
  ['taken', 'free', 'taken'],
  ['free', 'free', 'taken'],
];
let seatFound = null;
findSeat: for (let row = 0; row < seats.length; row++) {
  for (let col = 0; col < seats[row].length; col++) {
    if (seats[row][col] === 'free') {
      seatFound = { row, col };
      break findSeat; // 找到第一个空位就整体退出
    }
  }
}
console.log('  第一个空位 =', seatFound); // { row: 1, col: 1 }

console.log('\n全部演示结束。');
