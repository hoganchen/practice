/**
 * ============================================================================
 * 知识点：生成器双向通信 —— next(value) 的实参成为 yield 表达式的值
 * ============================================================================
 *
 * 【所属分类】17_iterators_and_generators —— 迭代器与生成器
 * 【难度等级】高级
 * 【前置知识】17_iterators_and_generators/04_generator_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    yield 不只是一个"产出值"的语句，它还是一个"表达式"，是有返回值的。
 *    这个返回值来自"下一次 next(实参)"传进来的实参。
 *    于是：生成器向外 yield 值，外部向内 next 传值，形成双向通道。
 *
 * 2. 为什么需要
 *    单向迭代只能"生产者推、消费者收"。双向通信让消费者可以在每次收到
 *    值之后反馈信息（比如"这个数太小，再大一点"），生成器据此调整后续
 *    产出。redux-saga 就是靠这个机制把异步流程写成同步代码的。
 *
 * 3. 核心语法要点
 *    - const x = yield v; 的执行分两段：
 *        第一段：把 v 产出给调用方，函数暂停；
 *        第二段：调用方 next(arg) 后，x 被赋值为 arg，函数继续。
 *    - 第一次 next() 的实参会被**丢弃**，因为此时还没有任何 yield 在等待接收。
 *    - next() 的返回值永远是 { value, done }，其中 value 是这次 yield 的值，
 *      而不是你传进去的参数。
 *    - 传参顺序记忆口诀："你 next 的，是上一个 yield 的结果"。
 *
 * 4. 常见陷阱
 *    - 想给生成器发第一份数据，却在第一次 next(data) 时传参——数据被丢掉，
 *      正确做法是先 next() 启动，再 next(data)。
 *    - 混淆 next() 的入参与返回值：入参流向生成器内部，返回值来自 yield。
 *    - 在 done 为 true 之后再 next(值)，实参无人接收，同样被忽略。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 17_iterators_and_generators/05_generator_two_way.js
 *
 * 【预期输出】
 *   带编号的日志演示 yield/next 的往返过程，以及首次 next 传参被丢弃的陷阱。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 最小双向示例
// ---------------------------------------------------------------------------

console.log('--- 1. yield 的返回值来自下次 next() ---');

function* twoWay() {
  console.log('  [生成器] 启动');

  // 「A」把 'A' 交给调用方，然后暂停；调用方 next('B 的回礼') 后，
  // 整个 yield 表达式的值就是 'B 的回礼'，赋给 received。
  const received = yield 'A';
  console.log('  [生成器] 收到调用方传来的：', received);

  // 「C」同理：把 'C' 交出去，等下一次 next 的实参
  const second = yield 'C';
  console.log('  [生成器] 又收到：', second);

  return '结束';
}

const it1 = twoWay();

console.log('① 调用 next() 启动生成器');
// 打印顺序说明：这里先打印下面这行"next() 返回"，还是先打印生成器内部的
// "启动"？答案是先打印内部的"[生成器] 启动"——因为 next() 是同步调用，
// 它会一路同步执行到第一个 yield 才返回，所以内部日志必然在返回值打印之前。
console.log('   next() 返回：', it1.next());

console.log('② next("B 的回礼") 把值送进生成器');
console.log('   next() 返回：', it1.next('B 的回礼'));

console.log('③ 再送一个值');
console.log('   next() 返回：', it1.next('再来一次'));

// ---------------------------------------------------------------------------
// 2. 陷阱：第一次 next() 的实参被丢弃
// ---------------------------------------------------------------------------

console.log('\n--- 2. 陷阱：首次 next(值) 会被丢弃 ---');

function* echo() {
  // 这里的 first 只能由"第二次及以后"的 next() 提供
  const first = yield '启动完成';
  console.log('  [生成器] first =', first);
}

const it2 = echo();

// 第一次 next 的实参会被规范直接忽略（此时还没有 yield 在等待接收数据），
// 所以这里传的 '被丢掉的值' 永远不会出现在生成器里。
console.log('首次 next("被丢掉的值") 的返回：', it2.next('被丢掉的值'));
// 第二次 next 的实参才被接收
console.log('第二次 next("这次收到了") 的返回：', it2.next('这次收到了'));

// 正确姿势：把第一次 next() 当作"启动开关"，不带参数。

// ---------------------------------------------------------------------------
// 3. 实战形态：把生成器当状态机用
// ---------------------------------------------------------------------------

console.log('\n--- 3. 双向通信实现一个"猜数字"状态机 ---');

// 生成器内部保存状态（target、猜测次数），外部每次用 next(guess) 提交一次猜测，
// 生成器 yield 回一句反馈。外部完全不需要知道内部怎么存状态。
function* guessNumberGame(target) {
  let attempts = 0;
  let guess = yield '请给出你的第 1 个猜测：';

  while (guess !== target) {
    attempts++; // 本次猜测计入次数
    if (guess < target) {
      guess = yield `第 ${attempts} 次猜 ${guess}：小了，再试试。`;
    } else {
      guess = yield `第 ${attempts} 次猜 ${guess}：大了，再试试。`;
    }
  }

  attempts++;
  return `恭喜！第 ${attempts} 次猜中，答案是 ${target}。`;
}

const game = guessNumberGame(7);

// 第 1 步：启动，拿到提示语
let feedback = game.next().value;
console.log('提示：', feedback);

// 第 2 步：依次提交猜测，直到 done 为 true
const guesses = [3, 9, 5, 8, 7];
for (const g of guesses) {
  const step = game.next(g);
  if (step.done) {
    // done 为 true 时拿到的是 return 的结果
    console.log('结果：', step.value);
    break;
  }
  console.log('提示：', step.value);
}

// ---------------------------------------------------------------------------
// 4. 对照实验：入参与返回值流向
// ---------------------------------------------------------------------------

console.log('\n--- 4. 一张表看懂入参与返回值的流向 ---');

function* flowDemo() {
  const a = yield '产出-1';
  const b = yield `产出-2（上一轮收到 ${a}）`;
  return `产出-3（上一轮收到 ${b}）`;
}

const it4 = flowDemo();

const steps = [
  { desc: '第 1 次 next(          )', arg: undefined },
  { desc: '第 2 次 next("参数甲")', arg: '参数甲' },
  { desc: '第 3 次 next("参数乙")', arg: '参数乙' },
  { desc: '第 4 次 next("参数丙")', arg: '参数丙' },
];

for (const { desc, arg } of steps) {
  // 注意：即使实参是 undefined，为了语义清晰也显式传一次
  const r = arg === undefined ? it4.next() : it4.next(arg);
  console.log(`${desc} -> 返回 { value: ${JSON.stringify(r.value)}, done: ${r.done} }`);
}
// 观察要点：
//  - 第 1 次的实参（无）被丢弃；
//  - 第 2 次传的"参数甲"出现在第 2 个 yield 的字符串里；
//  - done 为 true 之后传的"参数丙"无人接收，同样被忽略。

console.log('\n示例结束。');
