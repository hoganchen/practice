/**
 * ============================================================================
 * 知识点：switch 语句 —— fallthrough、break 与 case 分组
 * ============================================================================
 *
 * 【所属分类】05_control_flow —— 流程控制
 * 【难度等级】入门
 * 【前置知识】05_control_flow/01_if_else.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    switch 是"多分支等值判断"的语法结构：
 *      switch (表达式) {
 *        case 值1: 语句们; break;
 *        case 值2: 语句们; break;
 *        default:  语句们;
 *      }
 *    它把"表达式的值"依次与每个 case 后面的值比较，命中后从那里开始**顺序执行**。
 *
 * 2. 为什么需要
 *    当判断的是"同一个值等于哪几种可能"时，switch 比一长串 if / else if 更清爽，
 *    也更容易看出所有分支是否被覆盖（便于查找遗漏）。
 *    它对"状态机""命令分发""类型分派"这类场景尤其合适。
 *
 * 3. 核心语法要点
 *    【比较方式】case 的比较用的是**严格相等 `===`**，不做类型转换。
 *      所以 switch ('1') 与 case 1: 不匹配，这点和 if ('1' == 1) 不同。
 *    【fallthrough（穿透）】
 *      命中某个 case 后，如果没有 break（或 return / throw / continue），
 *      会**继续执行后面所有 case 的语句**，直到遇到 break 或 switch 结束。
 *      这是 switch 最容易踩的坑，同时也是它最有用的特性。
 *    【case 分组】
 *      利用穿透，可以把多个 case 写在一起共享同一段逻辑：
 *        case 'a':
 *        case 'b':
 *          doSomething();
 *          break;
 *    【default 的位置】
 *      default 不一定要放最后，但放最后最符合阅读习惯。
 *      注意 default 也会被穿透影响：如果 default 不在最后且没 break，同样会往下执行。
 *    【块级作用域】
 *      case 之间共享同一个作用域，所以在 case 里用 let / const 声明同名变量会报错。
 *      解决办法是用大括号把 case 的语句包起来：`case 1: { ... }`
 *    【只能用于等值判断】
 *      switch 无法直接表达"大于 5"这类范围判断，除非写成 switch (true) 这种技巧写法。
 *
 * 4. 常见陷阱
 *    - 忘记 break 导致穿透，是 switch 的头号 bug 来源。
 *    - case 后面的值必须是"字面量或常量表达式"（如 1、'a'、常量名），
 *      虽然语法上允许写表达式，但用变量或函数调用会让分支含义变得难以预测。
 *    - case 的比较是 ===，字符串 '1' 与数字 1 不匹配，数据来源类型不统一时极易出问题。
 *    - 在 case 中声明 let 而不加大括号，会因"整个 switch 共享一个作用域"而报重复声明。
 *    - switch 的匹配是自上而下的，写重复的 case 时后面的永远不会执行。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 05_control_flow/02_switch.js
 *
 * 【预期输出】
 *   依次打印基本 switch 用法、break 的作用、fallthrough 陷阱与利用、
 *   case 分组、严格相等比较规则、default 位置，以及一个状态机实战示例。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 最基本的 switch
// ---------------------------------------------------------------------------

console.log('--- 1. 基本用法 ---');

function describeDay(day) {
  let result;
  switch (day) {
    case 1:
      result = '星期一';
      break; // 必须 break，否则会继续执行 case 2
    case 2:
      result = '星期二';
      break;
    case 3:
      result = '星期三';
      break;
    case 4:
      result = '星期四';
      break;
    case 5:
      result = '星期五';
      break;
    case 6:
      result = '星期六';
      break;
    case 7:
      result = '星期日';
      break;
    default:
      // 所有 case 都不匹配时才会执行到这里
      result = '无效的星期值';
  }
  return result;
}

for (const d of [1, 3, 7, 9]) {
  console.log(`  day = ${d} => ${describeDay(d)}`);
}

// 用 return 代替 break 更简洁：命中即返回，天然不会穿透
function dayShort(day) {
  switch (day) {
    case 1:
      return '星期一';
    case 2:
      return '星期二';
    default:
      return '其它';
  }
}
console.log('  dayShort(1) =', dayShort(1), '，dayShort(5) =', dayShort(5));

// ---------------------------------------------------------------------------
// 2. 忘记 break 的后果：fallthrough（穿透）
// ---------------------------------------------------------------------------

console.log('\n--- 2. 忘记 break 会穿透 ---');

function buggy(input) {
  const lines = [];
  switch (input) {
    case 'a':
      lines.push('执行了 a');
    // 这里漏写 break！
    case 'b':
      lines.push('执行了 b');
    // 这里也漏写 break！
    case 'c':
      lines.push('执行了 c');
      break;
    default:
      lines.push('执行了 default');
  }
  return lines.join(' -> ');
}

for (const input of ['a', 'b', 'c', 'z']) {
  console.log(`  switch('${input}') 的执行轨迹：${buggy(input)}`);
}
// 结论：输入 'a' 时三个 case 的语句全被执行了，这就是未加 break 的穿透

// 对照：补上 break 之后的结果
function fixed(input) {
  const lines = [];
  switch (input) {
    case 'a':
      lines.push('执行了 a');
      break;
    case 'b':
      lines.push('执行了 b');
      break;
    case 'c':
      lines.push('执行了 c');
      break;
    default:
      lines.push('执行了 default');
  }
  return lines.join(' -> ');
}
for (const input of ['a', 'b', 'c', 'z']) {
  console.log(`  加上 break 后 switch('${input}')：${fixed(input)}`);
}

// ---------------------------------------------------------------------------
// 3. case 分组：把穿透当特性用
// ---------------------------------------------------------------------------

console.log('\n--- 3. case 分组（有意利用穿透） ---');

function classifyChar(ch) {
  switch (ch) {
    // 多个 case 叠在一起，共享同一段逻辑，这就是"case 分组"
    case 'a':
    case 'e':
    case 'i':
    case 'o':
    case 'u':
      return '元音字母';
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    case '8':
    case '9':
      return '数字';
    case ' ':
    case '\t':
      return '空白字符';
    default:
      return '辅音或其它';
  }
}
for (const ch of ['a', 'i', '5', ' ', 'z']) {
  const display = ch === ' ' ? '空格' : ch === '\t' ? '制表符' : ch;
  console.log(`  '${display}' => ${classifyChar(ch)}`);
}

// 实战：按月份返回季度（利用穿透把 3 个月归为一组）
function quarterOf(month) {
  switch (month) {
    case 1:
    case 2:
    case 3:
      return '第一季度';
    case 4:
    case 5:
    case 6:
      return '第二季度';
    case 7:
    case 8:
    case 9:
      return '第三季度';
    case 10:
    case 11:
    case 12:
      return '第四季度';
    default:
      return '月份不合法';
  }
}
for (const m of [1, 5, 9, 12, 13]) {
  console.log(`  ${m} 月 => ${quarterOf(m)}`);
}

// 实战：HTTP 状态码分类，用分组表达"这一类都做同样的事"
function statusCategory(code) {
  switch (code) {
    case 200:
    case 201:
    case 204:
      return '成功';
    case 301:
    case 302:
      return '重定向';
    case 400:
    case 401:
    case 403:
    case 404:
      return '客户端错误';
    case 500:
    case 502:
    case 503:
      return '服务端错误';
    default:
      return '其它状态码';
  }
}
for (const code of [200, 204, 301, 404, 503, 418]) {
  console.log(`  HTTP ${code} => ${statusCategory(code)}`);
}

// ---------------------------------------------------------------------------
// 4. 比较规则：严格相等 ===
// ---------------------------------------------------------------------------

console.log('\n--- 4. 匹配用的是严格相等 === ---');

function strictCheck(v) {
  switch (v) {
    case 1:
      return '匹配到数字 1';
    case '1':
      return "匹配到字符串 '1'";
    case true:
      return '匹配到 true';
    default:
      return '没有匹配（类型或值不同）';
  }
}
// 数字 1 与字符串 '1' 是两个不同的 case，不会互相匹配
console.log("  strictCheck(1) =", strictCheck(1));
console.log("  strictCheck('1') =", strictCheck('1'));
console.log('  strictCheck(true) =', strictCheck(true));

// 对比 if 的宽松比较
console.log("  对照：if (1 == '1') 是", 1 == '1', '，但 switch(1) 不会命中 case "1"'); // true

// 因为这个特性，从表单/URL 拿到的一定是字符串，需要先转换
function handleStringInput(raw) {
  const code = Number(raw); // 先统一成数字，再 switch
  switch (code) {
    case 1:
      return '选项一';
    case 2:
      return '选项二';
    default:
      return '未知选项';
  }
}
console.log("  handleStringInput('2') =", handleStringInput('2')); // '选项二'
console.log("  handleStringInput('99') =", handleStringInput('99')); // '未知选项'

// ---------------------------------------------------------------------------
// 5. default 的位置与作用域
// ---------------------------------------------------------------------------

console.log('\n--- 5. default 位置与作用域 ---');

// default 放在中间时，如果它自己被命中且没有 break，同样会往下穿透
function defaultInMiddle(v) {
  const trace = [];
  switch (v) {
    case 'x':
      trace.push('命中 x');
      break;
    default:
      trace.push('命中 default');
    // 没有 break，会继续往下执行 case 'y'
    case 'y':
      trace.push('命中 y');
      break;
  }
  return trace.join(' -> ');
}
console.log("  defaultInMiddle('x') =", defaultInMiddle('x'));
console.log("  defaultInMiddle('y') =", defaultInMiddle('y'));
console.log("  defaultInMiddle('z') =", defaultInMiddle('z'), '（default 穿透到了 y）');

// 作用域问题：所有 case 共享同一个块级作用域
// 下面这种写法会抛 SyntaxError（重复声明 message）
try {
  new Function(`
    function f(v) {
      switch (v) {
        case 1:
          let message = 'one';
          return message;
        case 2:
          let message = 'two';
          return message;
        default:
          return 'other';
      }
    }
  `);
  console.log('  没有报错（不会执行到这里）');
} catch (err) {
  console.log('  case 中重复声明 let 抛出：', err.constructor.name, '-', err.message.split('\n')[0]);
}

// 正确做法：用大括号把每个 case 的语句包成一个独立块
function scopedCase(v) {
  switch (v) {
    case 1: {
      const message = 'one'; // 这个 message 只属于本块
      return message;
    }
    case 2: {
      const message = 'two'; // 与上面的 message 互不冲突
      return message;
    }
    default:
      return 'other';
  }
}
console.log('  加大括号后：scopedCase(1) =', scopedCase(1), '，scopedCase(2) =', scopedCase(2));

// ---------------------------------------------------------------------------
// 6. 实战：一个订单状态机
// ---------------------------------------------------------------------------

console.log('\n--- 6. 实战：订单状态机 ---');

// 定义哪些动作可以从当前状态出发
const ORDER_ACTIONS = {
  created: ['pay', 'cancel'],
  paid: ['ship', 'refund'],
  shipped: ['deliver'],
  delivered: ['refund'],
  cancelled: [],
  refunded: [],
};

function nextStatus(current, action) {
  // 先做合法性校验，再进入 switch 决定新状态
  const allowed = ORDER_ACTIONS[current];
  if (!allowed || !allowed.includes(action)) {
    return { ok: false, reason: `状态 ${current} 不允许执行 ${action}` };
  }

  let next;
  switch (action) {
    case 'pay':
      next = 'paid';
      break;
    case 'ship':
      next = 'shipped';
      break;
    case 'deliver':
      next = 'delivered';
      break;
    case 'cancel':
      next = 'cancelled';
      break;
    case 'refund':
      next = 'refunded';
      break;
    default:
      // 理论上不会走到这里，因为上面已经校验过合法性
      return { ok: false, reason: `未知动作 ${action}` };
  }
  return { ok: true, from: current, action, to: next };
}

let status = 'created';
console.log('  初始状态：', status);
for (const action of ['pay', 'ship', 'deliver', 'refund', 'cancel']) {
  const r = nextStatus(status, action);
  if (r.ok) {
    console.log(`  执行 ${action}：${r.from} -> ${r.to}`);
    status = r.to;
  } else {
    console.log(`  执行 ${action} 被拒绝：${r.reason}`);
  }
}

// ---------------------------------------------------------------------------
// 7. 什么时候不该用 switch
// ---------------------------------------------------------------------------

console.log('\n--- 7. 什么时候不该用 switch ---');

// (1) 范围判断：switch 做不到，用 if / else if
function scoreLevel(score) {
  // switch 无法表达 ">= 90"，只能用 if
  if (score >= 90) return 'A';
  if (score >= 60) return 'B';
  return 'C';
}
console.log('  范围判断用 if：scoreLevel(95) =', scoreLevel(95));

// (2) 分支很多且结果是"值映射"时，用查表对象更简洁
const LEVEL_MAP = { a: '优秀', b: '良好', c: '及格', d: '不及格' };
function levelOf(key) {
  // ?? 提供默认值，一行搞定
  return LEVEL_MAP[key] ?? '未知等级';
}
for (const key of ['a', 'c', 'd', 'z']) {
  console.log(`  查表法 levelOf('${key}') = ${levelOf(key)}`);
}

// (3) 分支里有复杂逻辑时，用"函数映射表"把逻辑外提
const HANDLERS = {
  add: (x, y) => x + y,
  sub: (x, y) => x - y,
  mul: (x, y) => x * y,
};
function calc(op, x, y) {
  const handler = HANDLERS[op];
  if (!handler) throw new Error(`不支持的运算：${op}`);
  return handler(x, y);
}
console.log('  calc("add", 3, 4) =', calc('add', 3, 4)); // 7
console.log('  calc("mul", 3, 4) =', calc('mul', 3, 4)); // 12

console.log('\n全部演示结束。');
