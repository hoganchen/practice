/**
 * ============================================================================
 * 知识点：生成器基础 —— function*、yield、next() 与惰性执行
 * ============================================================================
 *
 * 【所属分类】17_iterators_and_generators —— 迭代器与生成器
 * 【难度等级】进阶
 * 【前置知识】17_iterators_and_generators/02_iterator_protocol.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    生成器（generator）是用 function* 声明的特殊函数。调用它不会执行
 *    函数体，而是立刻返回一个"生成器对象"。函数体内的 yield 表达式
 *    像"暂停按钮"，每调用一次生成器对象的 next()，函数体就从上次暂停处
 *    继续跑，直到下一个 yield 或函数结束。
 *
 * 2. 为什么需要
 *    手写迭代器要自己维护游标、自己构造 { value, done }，很啰嗦。
 *    生成器让"暂停/恢复执行"变成语言级能力：用同步的写法表达
 *    逐步产出的过程。它还是 async/await 的历史前身——await 本质
 *    就是"暂停函数，等 Promise 完成再恢复"。
 *
 * 3. 核心语法要点
 *    - 声明形式：function* name() {}，星号位置无所谓，惯例贴在 function 后。
 *    - yield 只能写在生成器函数内部，否则是语法错误。
 *    - 生成器对象同时是"迭代器"（有 next()）和"可迭代对象"（有 Symbol.iterator），
 *      所以能直接 for...of。
 *    - yield 表达式的值 = 下一次 next(参数) 传入的参数（详见 05 篇）。
 *    - return 会提前结束生成器，返回值出现在最后一个 { value, done: true } 里。
 *    - 生成器函数不能用 new 调用，也不是构造函数。
 *
 * 4. 常见陷阱
 *    - 以为调用生成器函数就会执行函数体：实际什么都不做，只拿到对象。
 *    - 以为 return 的值能被 for...of 拿到：for...of 只看 done，丢弃 value。
 *    - 忘了生成器是一次性的，走完后再 next() 只会一直得到 done: true。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 17_iterators_and_generators/04_generator_basics.js
 *
 * 【预期输出】
 *   演示生成器的惰性启动、逐次 next()、return 收尾、for...of 消费与限制。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 调用生成器函数不会执行函数体
// ---------------------------------------------------------------------------

console.log('--- 1. 惰性启动：调用时不执行函数体 ---');

function* simpleGenerator() {
  // 这一行在第一次 next() 之前不会打印，这就是"惰性"
  console.log('  [函数体] 开始执行');
  yield '第一个值';
  console.log('  [函数体] 恢复执行，准备产出第二个值');
  yield '第二个值';
  console.log('  [函数体] 恢复执行，函数即将结束');
}

console.log('准备调用 simpleGenerator()');
const gen = simpleGenerator();
console.log('调用完成，得到的是：', gen);
console.log('此刻函数体还没有跑过任何一行。');

// ---------------------------------------------------------------------------
// 2. 用 next() 一步步推进
// ---------------------------------------------------------------------------

console.log('\n--- 2. 逐次 next() 推进 ---');

// 注意：返回值形状和普通迭代器完全一致，就是 { value, done }
console.log('第 1 次 next()：', gen.next()); // 触发函数体开始执行，停在第一个 yield
console.log('第 2 次 next()：', gen.next());
// 第 3 次 next() 让函数体跑到结尾，done 变成 true，value 是 undefined
console.log('第 3 次 next()：', gen.next());
// 已经结束的生成器不会重启，永远返回 { value: undefined, done: true }
console.log('第 4 次 next()：', gen.next());

// ---------------------------------------------------------------------------
// 3. 生成器对象的两副面孔
// ---------------------------------------------------------------------------

console.log('\n--- 3. 生成器对象既是迭代器也是可迭代对象 ---');

const g2 = simpleGenerator();

// 有 next()，符合迭代器协议
console.log('有 next 方法吗：', typeof g2.next === 'function');
// 有 [Symbol.iterator]，符合可迭代协议
console.log('有 Symbol.iterator 吗：', typeof g2[Symbol.iterator] === 'function');
// 而且 [Symbol.iterator]() 返回的就是它自己
console.log('Symbol.iterator() 返回自身吗：', g2[Symbol.iterator]() === g2);

// 所以生成器对象可以直接丢给 for...of。注意看输出：函数体里的
// console.log 和 yield 交替出现，说明"取一个值 → 暂停 → 再取"是真的。
console.log('for...of 直接消费生成器：');
for (const v of simpleGenerator()) {
  console.log('  for...of 收到：', v);
}

// 也可以展开
console.log('展开成数组：', [...simpleGenerator()]);

// ---------------------------------------------------------------------------
// 4. return 提前结束 + 返回值的去向
// ---------------------------------------------------------------------------

console.log('\n--- 4. return 提前结束生成器 ---');

function* withEarlyReturn() {
  yield 'A';
  yield 'B';
  return '我是 return 的值'; // 这里结束后，后面的 yield 永远不会执行
  // eslint-disable-next-line no-unreachable
  yield 'C';
}

const g3 = withEarlyReturn();
console.log('next() ->', g3.next()); // { value: 'A', done: false }
// done 变 true 的同时，value 带着 return 的返回值
console.log('next() ->', g3.next()); // { value: 'B', done: false }
console.log('next() ->', g3.next()); // { value: '我是 return 的值', done: true }

// 但对 for...of 来说，done: true 的那次 value 会被丢弃
console.log('for...of 只看得到 A、B：', [...withEarlyReturn()]);

// 想拿返回值，就得手工 next() 到 done 为 true 的那一次
function collectWithReturnValue(genObj) {
  const values = [];
  let step = genObj.next();
  while (!step.done) {
    values.push(step.value);
    step = genObj.next();
  }
  return { values, returnValue: step.value }; // 收尾那次的 value 才是返回值
}
console.log('手工收集（含返回值）：', collectWithReturnValue(withEarlyReturn()));

// 自然结束（没有 return）时，收尾 value 是 undefined
function* noReturn() {
  yield 1;
}
console.log('自然结束的收尾对象：', collectWithReturnValue(noReturn()));

// ---------------------------------------------------------------------------
// 5. 生成器替代手写迭代器
// ---------------------------------------------------------------------------

console.log('\n--- 5. 用生成器重写 03 篇的 Range ---');

// 对比 03_custom_iterable.js 里 20 行的手写迭代器，这里只要 4 行，
// 因为"暂停/恢复 + 构造 { value, done }"由语言替我们做了。
const rangeIterable = {
  from: 1,
  to: 4,
  *[Symbol.iterator]() {
    for (let i = this.from; i <= this.to; i++) {
      yield i;
    }
  },
};

console.log('for...of：', [...rangeIterable]);
console.log('解构：', (() => {
  const [a, b, ...rest] = rangeIterable;
  return { a, b, rest };
})());

// ---------------------------------------------------------------------------
// 6. 陷阱：生成器不是构造函数
// ---------------------------------------------------------------------------

console.log('\n--- 6. 陷阱：不能用 new 调用生成器函数 ---');

function* notAConstructor() {
  yield 1;
}

try {
  // new 一个生成器函数会抛 TypeError，示例里捕获后打印，避免进程非零退出
  const bad = new notAConstructor();
  console.log('不该走到这里：', bad);
} catch (err) {
  console.log('错误类型：', err.constructor.name);
  console.log('错误信息：', err.message);
}

// 顺带一提：yield 也不能出现在普通函数里，
// 下面这行如果取消注释就是 SyntaxError（语法错误在解析阶段就被发现）：
// function normal() { yield 1; }

console.log('\n示例结束。');
