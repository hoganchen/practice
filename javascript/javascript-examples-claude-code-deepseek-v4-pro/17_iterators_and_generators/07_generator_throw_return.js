/**
 * ============================================================================
 * 知识点：generator.throw() 与 generator.return() —— 向生成器内部注入错误与终止
 * ============================================================================
 *
 * 【所属分类】17_iterators_and_generators —— 迭代器与生成器
 * 【难度等级】高级
 * 【前置知识】17_iterators_and_generators/05_generator_two_way.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    除了 next()，生成器对象还有两个方法：
 *      - generator.throw(err)：在生成器"当前暂停的那个 yield 处"抛出一个错误。
 *        如果生成器内部有 try/catch 包住了这个 yield，错误会被内部捕获，
 *        生成器可以继续往下跑；如果没人捕获，错误会从 throw() 调用处抛给调用方，
 *        生成器随即结束。
 *      - generator.return(value)：在暂停处模拟一个 return 语句，让生成器立即结束，
 *        返回值是 { value, done: true }。若生成器内部有 try/finally，
 *        finally 块会被执行（这正是"清理资源"的钩子）。
 *
 * 2. 为什么需要
 *    生成器把"一段会暂停的计算"变成了可以被外部控制的协程。
 *    既然是协程，外部就需要能"取消"它（return）以及"通知它出错了"（throw）。
 *    async/await 的底层实现正是用这两个方法把 Promise 的拒绝与取消
 *    注入到暂停的函数里。
 *
 * 3. 核心语法要点
 *    - throw() 和 next() 一样返回 { value, done }，因为捕获后生成器可能继续产出。
 *    - 未被捕获的错误会让生成器进入"已完成"状态，之后再 next() 只会得到 done: true。
 *    - return() 会触发 finally；如果 finally 里还有 yield，return() 会返回那个
 *      yield 的值且 done 为 false，需要再 next() 一次才真正结束（进阶细节）。
 *    - 已被 for...of 消费到一半时 break，引擎会自动调用 return()，
 *      于是 finally 得以执行——这是"提前退出也能清理资源"的关键。
 *
 * 4. 常见陷阱
 *    - 以为 throw() 一定会在生成器内部抛出：只有"暂停中的 yield 被 try 包住"才行。
 *    - 忘记未捕获的 throw() 会让错误冒到调用方，示例里必须自己 try/catch。
 *    - 以为 finally 里的 yield 会被忽略：实际上它会把结束流程再暂停一次。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 17_iterators_and_generators/07_generator_throw_return.js
 *
 * 【预期输出】
 *   演示 throw 被内部捕获 / 未被捕获两种路径、return 触发 finally、
 *   以及 for...of break 时自动调用 return。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. throw() 被生成器内部捕获
// ---------------------------------------------------------------------------

console.log('--- 1. throw() 被内部 try/catch 捕获 ---');

function* catchesError() {
  // 注意：try 必须"包住 yield"，因为错误是在 yield 暂停处注入的
  try {
    const v = yield '第一步';
    console.log('  [生成器] 正常收到：', v);

    const v2 = yield '第二步'; // 错误将从这里注入
    console.log('  [生成器] 这一行不会执行，因为上一步被注入了错误');
    return v2;
  } catch (err) {
    // 捕获后生成器并没有死，还可以继续 yield
    console.log('  [生成器] 捕获到错误：', err.message);
    yield '发生错误后仍然能继续产出的值';
    return 'catch 分支的返回值';
  } finally {
    // 无论是正常结束、throw 被捕获后结束，还是被 return 终止，finally 都会跑
    console.log('  [生成器] finally 执行了（做清理）');
  }
}

const it1 = catchesError();
console.log('next() ->', it1.next());       // 停在 "第一步"
console.log('next("正常值") ->', it1.next('正常值')); // 停在 "第二步"

// 关键：throw() 让 "第二步" 这个 yield 表达式抛出 err
console.log('throw() ->', it1.throw(new Error('外部注入的错误')));
// 上一步返回的是 catch 里 yield 的值，生成器还活着
console.log('next() ->', it1.next());
// 已经结束
console.log('next() ->', it1.next());

// ---------------------------------------------------------------------------
// 2. throw() 没有被捕获
// ---------------------------------------------------------------------------

console.log('\n--- 2. throw() 没有被捕获，错误冒到调用方 ---');

function* noCatch() {
  yield '开始';
  yield '中间'; // 错误从这里注入，但外面没有 try/catch
  yield '结束';
}

const it2 = noCatch();
console.log('next() ->', it2.next());

// throw() 会把错误抛给调用方，所以这里必须自己 try/catch，
// 否则示例进程会以非零退出码结束。
try {
  it2.throw(new Error('没有人接住我'));
} catch (err) {
  console.log('调用方捕获到：', err.message);
}

// 生成器已经被这次未捕获的 throw 终结
console.log('之后再 next() ->', it2.next());

// ---------------------------------------------------------------------------
// 3. return() 提前终止，并触发 finally
// ---------------------------------------------------------------------------

console.log('\n--- 3. return() 提前终止并执行 finally ---');

function* withCleanup() {
  try {
    yield '资源已打开';
    yield '正在使用资源';
    yield '这条永远不会被产出';
  } finally {
    // 不管是自然结束、被 return() 终止还是被未捕获的 throw 终结，
    // finally 都是"保证执行的清理现场"。
    console.log('  [生成器] 关闭资源（finally）');
  }
}

const it3 = withCleanup();
console.log('next() ->', it3.next());
console.log('next() ->', it3.next());

// return('终止原因') 相当于在暂停处插入 return '终止原因'
console.log('return("提前收工") ->', it3.return('提前收工'));

// 已经 done: true，再 next 也拿不到东西
console.log('再 next() ->', it3.next());

// 顺带一提：对一个从未启动的生成器调用 return()，函数体一行都不会跑，
// 因此也不会执行 finally（因为 try 从未进入）。
const neverStarted = withCleanup();
console.log('未启动就 return() ->', neverStarted.return('没启动'));
console.log('此时函数体与 finally 都没有执行（对比上面的输出即可确认）。');

// ---------------------------------------------------------------------------
// 4. 进阶：finally 里也有 yield 时，return() 会被"再暂停"一次
// ---------------------------------------------------------------------------

console.log('\n--- 4. finally 中还有 yield 的进阶行为 ---');

function* cleanupWithYield() {
  try {
    yield '工作-1';
    yield '工作-2';
  } finally {
    // finally 里允许 yield：它会打断"结束流程"，让生成器再暂停一次
    yield '清理-1';
    yield '清理-2';
  }
}

const it4 = cleanupWithYield();
console.log('next() ->', it4.next()); // '工作-1'
console.log('next() ->', it4.next()); // '工作-2'

// 调用 return('正式返回值')：生成器进入 finally，遇到第一个 yield 就暂停，
// 于是 return() 返回的是 { value: '清理-1', done: false }，而不是 done: true。
console.log('return("正式返回值") ->', it4.return('正式返回值'));
console.log('next() ->', it4.next()); // 走到 finally 的第二个 yield
// 再 next()，finally 走完，本次才真正以 return 传入的值收尾
console.log('next() ->', it4.next());

// ---------------------------------------------------------------------------
// 5. for...of 中途 break 会自动调用 return()
// ---------------------------------------------------------------------------

console.log('\n--- 5. break 让引擎自动调用 return() ---');

function* resourceStream() {
  try {
    let n = 1;
    while (true) {
      yield `数据块 ${n++}`;
    }
  } finally {
    console.log('  [生成器] 流被关闭（因为外部提前 break）');
  }
}

// 这是一个无限生成器。如果不 break，for...of 会永远跑下去。
// 但因为有了 break，引擎在退出循环时会自动调用迭代器的 return()，
// 于是 finally 得以执行——这就是"提前退出也能安全释放资源"的机制。
for (const chunk of resourceStream()) {
  console.log('消费：', chunk);
  if (chunk === '数据块 3') {
    console.log('  够了，break 退出循环');
    break;
  }
}

// 如果不 break 而是一直跑到自然结束呢？那 finally 同样会执行。
// 区别只在于"谁触发了结束"。

console.log('\n示例结束。');
