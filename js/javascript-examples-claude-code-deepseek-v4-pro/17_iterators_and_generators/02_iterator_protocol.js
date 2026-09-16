/**
 * ============================================================================
 * 知识点：迭代器协议 —— next() 返回 { value, done } 的约定
 * ============================================================================
 *
 * 【所属分类】17_iterators_and_generators —— 迭代器与生成器
 * 【难度等级】进阶
 * 【前置知识】17_iterators_and_generators/01_iterable_protocol.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    迭代器协议（iterator protocol）规定：一个"迭代器"必须是一个对象，
 *    它身上有一个 next() 方法，调用后返回一个结果对象 { value, done }。
 *      - value：本次产出的值，done 为 true 时通常可以省略。
 *      - done：布尔值，false 表示"还有下一个值"，true 表示"已经结束"。
 *    可迭代协议说的是"怎么拿到迭代器"，迭代器协议说的是"迭代器长什么样"。
 *
 * 2. 为什么需要
 *    把"取下一个值"这件事缩减成一个只有两个字段的小对象，
 *    调用方就不需要知道数据是怎么存的。数组、链表、文件流、无限序列
 *    都可以通过同一个 next() 接口被消费，for...of 才能做到通用。
 *
 * 3. 核心语法要点
 *    - 迭代器自身也可以带 [Symbol.iterator]() { return this; }，
 *      这样它同时是"可迭代的"，能直接丢给 for...of（称为 iterable iterator）。
 *    - 迭代器是一次性的：走完了再走不会重置，只会一直返回 done: true。
 *    - next() 可以传参数，但普通迭代器会忽略它；生成器才会用到（见 04、05 篇）。
 *    - done 为 true 后，value 是"返回值"，for...of 会丢弃它。
 *
 * 4. 常见陷阱
 *    - 忘记把 done 变成 true，导致 for...of 死循环。
 *    - 以为 next() 返回的是值本身，写出 const v = it.next() 然后直接用 v，
 *      结果得到的是对象 { value, done }。
 *    - 同一个迭代器被两个 for...of 共享，第二个循环什么都拿不到。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 17_iterators_and_generators/02_iterator_protocol.js
 *
 * 【预期输出】
 *   手写一个数组迭代器并逐步观察 next() 的返回值，最后演示迭代器一次性消耗。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 手写一个最小的迭代器
// ---------------------------------------------------------------------------

console.log('--- 1. 手写数组迭代器 ---');

/**
 * createArrayIterator —— 接收数组，返回一个符合迭代器协议的对象。
 * 用闭包变量 index 记录"下一个要返回的下标"。
 */
function createArrayIterator(arr) {
  let index = 0; // 闭包：只有返回对象里的 next 能访问到它

  return {
    // next() 是无参方法，返回 { value, done }
    next() {
      if (index < arr.length) {
        // 还有值：取出当前项，下标后移，done 为 false
        return { value: arr[index++], done: false };
      }
      // 结束了：value 写成 undefined，done 为 true
      return { value: undefined, done: true };
    },
  };
}

const it = createArrayIterator(['a', 'b', 'c']);

// 逐次调用，观察返回值形状。注意每次打印的都是完整的结果对象。
console.log('调用 1 次：', it.next()); // { value: 'a', done: false }
console.log('调用 2 次：', it.next()); // { value: 'b', done: false }
console.log('调用 3 次：', it.next()); // { value: 'c', done: false }
console.log('调用 4 次：', it.next()); // { value: undefined, done: true }
console.log('再调用一次：', it.next()); // 依旧 { value: undefined, done: true }

// ---------------------------------------------------------------------------
// 2. 手工用 while 消费迭代器
// ---------------------------------------------------------------------------

console.log('\n--- 2. 用 while 消费迭代器 ---');

// for...of 的本质就是下面这几行：不断 next()，直到 done 为 true
function manualForOf(iterator) {
  const result = [];
  while (true) {
    const step = iterator.next();
    if (step.done) break; // done 为 true 就跳出
    result.push(step.value); // 否则收集 value
  }
  return result;
}

console.log('manualForOf 结果：', manualForOf(createArrayIterator([1, 2, 3, 4])));

// ---------------------------------------------------------------------------
// 3. iterable iterator：同时满足两个协议
// ---------------------------------------------------------------------------

console.log('\n--- 3. 让迭代器自己也"可迭代" ---');

// 只满足迭代器协议的对象不能直接丢进 for...of，
// 因为 for...of 只认 [Symbol.iterator]。给它补上这个方法即可。
function createCountdownIterator(start) {
  let current = start;
  return {
    next() {
      if (current > 0) {
        return { value: current--, done: false };
      }
      return { value: undefined, done: true };
    },
    // 关键一行：返回 this，于是"迭代器"同时是"可迭代对象"
    // 这类对象在规范里叫 iterable iterator。
    [Symbol.iterator]() {
      return this;
    },
  };
}

const countdown = createCountdownIterator(3);

// 现在可以直接 for...of 了
for (const n of countdown) {
  console.log('倒计时：', n);
}

// 生成器对象（function* 调用后得到的对象）天生就是 iterable iterator，
// 标准迭代器也一样：数组的迭代器自带 Symbol.iterator。
const nativeIt = [1, 2][Symbol.iterator]();
console.log('原生迭代器可迭代吗：', typeof nativeIt[Symbol.iterator] === 'function');
console.log('原生迭代器 [Symbol.iterator]() === 它自己吗：', nativeIt[Symbol.iterator]() === nativeIt);

// ---------------------------------------------------------------------------
// 4. 迭代器是一次性的
// ---------------------------------------------------------------------------

console.log('\n--- 4. 迭代器是一次性消耗品 ---');

// 注意：createArrayIterator 返回的是"纯迭代器"，没有 Symbol.iterator，
// 所以不能直接 [...it]（那是可迭代协议的事）。这里用第 2 节的
// manualForOf 手工消费它，才能清楚看到"一次性"的效果。
const onceIterator = createArrayIterator([100, 200]);

console.log('第一次消费：', manualForOf(onceIterator)); // 正常拿到 [100, 200]
console.log('第二次消费：', manualForOf(onceIterator)); // []，因为已经走完了

// 对比：数组是可迭代对象，每次展开都会新建一个迭代器
console.log('数组第一次展开：', [...[100, 200]]);
console.log('数组第二次展开：', [...[100, 200]]);

// 而"可迭代对象"可以反复产生新的迭代器，每次都是全新的状态：
const reusable = [7, 8, 9];
console.log('第一次展开：', [...reusable]);
console.log('第二次展开：', [...reusable]); // 依然是 [7, 8, 9]

// ---------------------------------------------------------------------------
// 5. done 之后的 value 是"返回值"，for...of 会丢弃它
// ---------------------------------------------------------------------------

console.log('\n--- 5. done: true 时的 value 会被丢弃 ---');

const withReturnValue = createArrayIterator([1]);
withReturnValue.next(); // 消耗掉 1
// 手工调用可以看到 done: true 时 value 是 undefined
console.log('手工调用看到的收尾对象：', withReturnValue.next());

// 生成器可以给收尾对象附带一个返回值（return 语句），
// 但 for...of 看都不看它一眼——想拿到必须手工 next()。详见 04 篇。
function* g() {
  yield 1;
  return '我是返回值'; // 这个值不会出现在 for...of 里
}
console.log('for...of 得到：', [...g()]);

const git = g();
git.next(); // 先取走 1
console.log('手工 next() 才看得到 return 值：', git.next()); // { value: '我是返回值', done: true }

console.log('\n示例结束。');
