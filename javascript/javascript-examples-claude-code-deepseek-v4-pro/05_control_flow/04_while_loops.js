/**
 * ============================================================================
 * 知识点：while 与 do...while —— 至少执行一次的差别
 * ============================================================================
 *
 * 【所属分类】05_control_flow —— 流程控制
 * 【难度等级】入门
 * 【前置知识】05_control_flow/03_for_loop.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    while 和 do...while 都是"条件循环"，区别只在**条件检查的时机**：
 *      while (条件) { 循环体 }
 *        先检查条件，为真值才执行循环体 —— 可能一次都不执行。
 *      do { 循环体 } while (条件);
 *        先执行一次循环体，再检查条件 —— **至少执行一次**。
 *    注意 do...while 结尾必须带分号，这是新手最常漏的符号之一。
 *
 * 2. 为什么需要
 *    - while 适合"循环次数事先未知，只知道结束条件"的场景：
 *      读取直到文件结束、玩家血量归零、队列清空、随机数命中某条件。
 *    - do...while 适合"无论如何都要先做一次，再决定要不要继续"的场景：
 *      至少要输入一次密码、至少要询问一次用户、至少要执行一次重试。
 *
 * 3. 核心语法要点
 *    【条件求值】与 if 一样，条件会被隐式转换成布尔值，只认那 8 个假值。
 *    【for 与 while 的关系】两者可以互相改写：
 *      for (初始化; 条件; 更新) {}  ≈  初始化; while (条件) { 更新; }
 *      选哪个只看"三段是否都清晰存在"。计数器齐全时 for 更紧凑，
 *      更新逻辑分散在循环体各处时 while 更自然。
 *    【跳转语句】
 *      break 立即结束整个循环；continue 跳到"条件判断"处（do...while 是跳到条件判断）。
 *    【循环体是语句】
 *      while 后可以不加大括号只跟一条语句，但强烈建议永远加大括号。
 *    【无限循环的标准写法】
 *      while (true) { ... break; } 常用于"事件循环""重试直到成功"。
 *
 * 4. 常见陷阱
 *    - 忘记在循环体内推进条件变量，导致死循环。
 *    - do...while 漏写结尾分号（虽然 ASI 通常能救回来，但语义可能改变）。
 *    - while 的条件里用了会变的值（如调用函数），每轮都会重新求值，性能与语义都要注意。
 *    - do...while 的循环体至少执行一次，如果这个"一次"有副作用，要确保它是安全的。
 *    - 在 while 中不要修改被遍历的集合（除非你非常清楚自己在做什么）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 05_control_flow/04_while_loops.js
 *
 * 【预期输出】
 *   依次打印 while 的基础用法、do...while 至少执行一次的行为对比、
 *   两者互相改写、典型业务场景（重试、分页、数字拆解、随机数），
 *   以及用计数器 break 安全演示的无限循环写法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. while 的基础用法：条件为假时一次都不执行
// ---------------------------------------------------------------------------

console.log('--- 1. while 基础 ---');

let countdown = 5;
// 条件在每轮"进入循环体之前"检查
while (countdown > 0) {
  console.log(`  倒计时 ${countdown}`);
  countdown--; // 关键：推进条件变量，否则死循环
}
console.log('  循环结束，countdown =', countdown); // 0

// 条件一开始就是假值 => 循环体一次都不执行
let neverRuns = 0;
while (false) {
  neverRuns++;
}
console.log('  条件为 false 时，循环体执行了', neverRuns, '次'); // 0

// 遍历数组：用下标 + while（等价于 for，只是把三段拆开写）
const stack = ['第一层', '第二层', '第三层'];
let depth = 0;
while (depth < stack.length) {
  console.log(`  stack[${depth}] = ${stack[depth]}`);
  depth++;
}

// ---------------------------------------------------------------------------
// 2. do...while：至少执行一次
// ---------------------------------------------------------------------------

console.log('\n--- 2. do...while 至少执行一次 ---');

// 关键对比：同样的"假条件"，while 一次都不跑，do...while 会跑一次
let whileRuns = 0;
while (false) {
  whileRuns++;
}
console.log('  while (false) 执行次数 =', whileRuns); // 0

let doWhileRuns = 0;
do {
  doWhileRuns++; // 先执行，再判断条件
} while (false);
console.log('  do { ... } while (false) 执行次数 =', doWhileRuns); // 1（这就是差别）

// 正常场景：条件在中间变化
let attempts = 0;
do {
  attempts++;
  console.log(`  尝试第 ${attempts} 次`);
} while (attempts < 3);
console.log('  共尝试了', attempts, '次');

// 注意结尾的分号：do...while 是唯一"语句以 while 结尾但需要分号"的结构
// 下面是同一个循环，省略不写分号在多数情况下也能跑，但不推荐。
let tail = 0;
do {
  tail++;
} while (tail < 2);
console.log('  循环正常结束，tail =', tail); // 2

// 与 while 对照：改成先判断的写法，次数会不同
let attempts2 = 0;
while (attempts2 < 3) {
  attempts2++;
}
console.log('  用 while 改写后同样得到', attempts2, '次（因为条件不依赖循环体）');

// ---------------------------------------------------------------------------
// 3. for 与 while 互相改写
// ---------------------------------------------------------------------------

console.log('\n--- 3. for 与 while 互相改写 ---');

// 原版：for
const forResult = [];
for (let idx = 0; idx < 3; idx++) {
  forResult.push(idx);
}
console.log('  for 版本 =', forResult); // [0,1,2]

// 改写：while（初始化提到外面，更新放到循环体末尾）
const whileResult = [];
let idx2 = 0; // ① 初始化
while (idx2 < 3) {
  // ② 条件
  whileResult.push(idx2);
  idx2++; // ③ 更新（放到循环体最后）
}
console.log('  while 版本 =', whileResult); // [0,1,2]

// 什么时候 while 更自然？当"更新"发生在循环体中间的多个分支里时
function findFirstDivisor(target) {
  let candidate = 2;
  // 更新与退出条件分散在循环体内部，写成 while 比 for 更清晰
  while (candidate < target) {
    if (target % candidate === 0) {
      break; // 找到就跳出
    }
    candidate++; // 更新在这里
  }
  return candidate < target ? candidate : null;
}
for (const t of [15, 17, 100]) {
  console.log(`  ${t} 的最小因子 = ${findFirstDivisor(t)}`);
}

// ---------------------------------------------------------------------------
// 4. 实战场景
// ---------------------------------------------------------------------------

console.log('\n--- 4. 实战场景 ---');

// 场景一：重试机制（do...while 的教科书用例：至少要试一次）
function tryOperation(maxAttempts) {
  let attempt = 0;
  let log = [];
  do {
    attempt++;
    // 模拟"前两次失败，第三次成功"
    const success = attempt >= 3;
    log.push(`第 ${attempt} 次${success ? '成功' : '失败'}`);
    if (success) {
      return { ok: true, attempts: attempt, log };
    }
  } while (attempt < maxAttempts); // 达到上限就放弃
  return { ok: false, attempts: attempt, log };
}
const retry = tryOperation(5);
console.log('  重试结果：', retry.ok ? '成功' : '失败', '，共', retry.attempts, '次');
console.log('  过程：', retry.log.join(' -> '));

// 重试达到上限的情况
const retryFail = tryOperation(2);
console.log('  上限设为 2 时：', retryFail.ok ? '成功' : '失败', '，共', retryFail.attempts, '次');

// 场景二：数字拆解（位数不定，用 while 最自然）
function digitsOf(num) {
  const digits = [];
  let rest = Math.abs(num);
  if (rest === 0) return [0]; // 特判 0
  while (rest > 0) {
    digits.unshift(rest % 10); // 取最后一位（个位）
    rest = Math.floor(rest / 10); // 去掉最后一位
  }
  return digits;
}
for (const num of [0, 7, 12345, -908]) {
  console.log(`  ${num} 的各位数字 = [${digitsOf(num).join(', ')}]`);
}

// 场景三：数字反转与回文判断
function isPalindrome(num) {
  const text = String(Math.abs(num));
  let left = 0;
  let right = text.length - 1;
  while (left < right) {
    if (text[left] !== text[right]) return false;
    left++;
    right--;
  }
  return true;
}
for (const num of [121, 12321, 1234]) {
  console.log(`  ${num} 是回文数吗？${isPalindrome(num)}`);
}

// 场景四：模拟"抽奖直到中奖"（用固定伪随机序列保证结果可复现）
function pickUntilHit(sequence, luckyNumber) {
  let cursor = 0;
  let picked = null;
  // 条件里同时检查"还有数据"和"还没抽中"
  while (cursor < sequence.length && picked !== luckyNumber) {
    picked = sequence[cursor];
    cursor++;
  }
  return { picked, tries: cursor };
}
const draw = pickUntilHit([3, 8, 1, 7, 9], 7);
console.log('  抽奖过程：抽了', draw.tries, '次，结果为', draw.picked);

// 场景五：分页拉取（模拟接口，直到没有下一页）
function fetchAllPages(pages) {
  const collected = [];
  let page = 1;
  while (true) {
    // 模拟接口返回
    const data = pages[page - 1];
    if (!data) {
      console.log('  没有更多数据，结束拉取');
      break; // 无限循环靠 break 退出
    }
    collected.push(...data);
    console.log(`  拉取第 ${page} 页，本页 ${data.length} 条`);
    page++;
  }
  return collected;
}
const allItems = fetchAllPages([['a', 'b'], ['c'], ['d', 'e']]);
console.log('  共拉到', allItems.length, '条：', allItems.join(', '));

// 场景六：安全的"无限循环"演示
// while (true) 本身是死循环写法，必须配合内部 break 才能安全结束。
// 这里用一个硬性上限保证一定会在有限步内退出。
let ticks = 0;
const HARD_LIMIT = 4;
while (true) {
  ticks++;
  if (ticks >= HARD_LIMIT) {
    console.log(`  无限循环在第 ${ticks} 次迭代后被 break 安全结束`);
    break; // 关键：没有这句，进程会永远卡住
  }
}

// ---------------------------------------------------------------------------
// 5. 陷阱
// ---------------------------------------------------------------------------

console.log('\n--- 5. 陷阱 ---');

// 陷阱一：忘记更新条件变量 => 死循环。这里用安全计数器模拟并强制退出
let guard = 0;
let percent = 0;
while (percent < 100) {
  guard++;
  if (guard >= 5) {
    console.log('  检测到条件变量未被更新（模拟死循环），已在 5 次迭代后强制退出');
    break; // 防御性 break
  }
  // 故意忘记写 percent += 20;
}

// 陷阱二：do...while 的循环体"至少执行一次"，如果它有副作用要当心
let sideEffectCount = 0;
const condition = false;
do {
  sideEffectCount++; // 即使条件为假，这次副作用也已经发生了
} while (condition);
console.log('  条件为假，但副作用已执行', sideEffectCount, '次');

// 陷阱三：浮点数作为条件变量时可能永远不精确相等
let floatValue = 0;
let steps = 0;
while (floatValue < 1) {
  floatValue += 0.1; // 累加浮点数会有误差
  steps++;
  if (steps > 100) {
    console.log('  浮点累加异常，已强制退出（避免死循环）');
    break;
  }
}
console.log(`  累加 0.1 后 floatValue = ${floatValue}，循环跑了 ${steps} 次`);
console.log('  注意：本该 10 次就达到 1，因浮点累加误差实际跑了 11 次（每次都略微偏小）');
console.log('  结论：绝不要用"浮点数精确相等（===）"作为循环的退出条件');
// 更稳妥的写法是给一个容差，或者干脆用整数计数
let tolerantSteps = 0;
let tolerantValue = 0;
while (tolerantValue < 1 - 1e-9) {
  tolerantValue += 0.1;
  tolerantSteps++;
  if (tolerantSteps > 100) break; // 兜底，防止意外死循环
}
console.log(`  加上容差 1e-9 后，循环跑了 ${tolerantSteps} 次（更接近预期）`);

// 正确的写法：用整数计数，避免浮点误差
let okSteps = 0;
for (let i = 0; i < 10; i++) okSteps++;
console.log('  用整数计数则步数确定：', okSteps); // 10

// 陷阱四：条件里调用函数，每轮都会重新求值（可能有意为之，也可能是 bug）
let callCount = 0;
function shouldContinue() {
  callCount++;
  return callCount <= 3;
}
while (shouldContinue()) {
  // 每轮都会调用 shouldContinue，共调用 4 次（第 4 次返回 false）
}
console.log('  while 条件里的函数被调用了', callCount, '次（含最后一次判断失败）');

// ---------------------------------------------------------------------------
// 6. 该选哪个？
// ---------------------------------------------------------------------------

console.log('\n--- 6. 选择建议 ---');

// 结论速查：
//   已知循环次数 / 需要计数器   => for
//   循环次数未知，只看结束条件  => while
//   至少要执行一次循环体        => do...while
//   遍历数组/字符串/Map/Set     => for...of（见 05_for_of.js）
//   遍历对象键                  => for...in（见 06_for_in.js）

// 一个综合示例：根据数据形态选择最合适的循环
function processItems(items) {
  if (items.length === 0) return '空集合';

  // 遍历一个确定长度的数组：用 for
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].value;
  }

  // 反复从头压缩相邻重复项，直到没有可合并的：用 while
  let list = [...items];
  let merged = 0;
  let hasDuplicate = true;
  while (hasDuplicate) {
    hasDuplicate = false;
    for (let i = 0; i < list.length - 1; i++) {
      if (list[i].value === list[i + 1].value) {
        list.splice(i + 1, 1);
        merged++;
        hasDuplicate = true;
        break;
      }
    }
  }
  return `总和 = ${total}，合并了 ${merged} 项，剩余 ${list.length} 项`;
}
console.log('  processItems 结果：', processItems([{ value: 1 }, { value: 2 }, { value: 2 }, { value: 3 }]));

console.log('\n全部演示结束。');
