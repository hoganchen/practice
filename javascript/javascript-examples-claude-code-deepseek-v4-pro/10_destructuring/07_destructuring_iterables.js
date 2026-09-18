/**
 * ============================================================================
 * 知识点：解构可迭代对象 —— 不只是数组，Set、生成器与自定义可迭代对象
 * ============================================================================
 *
 * 【所属分类】10_destructuring —— 解构赋值
 * 【难度等级】高级
 * 【前置知识】10_destructuring/02_array_destructuring.js、10_destructuring/06_swap_and_tricks.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "数组解构"这个名字其实不够准确：它真正依赖的是**可迭代协议**
 *    （Iteration Protocol），而不是"数组"这个类型。
 *    任何实现了 `Symbol.iterator` 方法的对象，都能被方括号解构：
 *      - 数组、字符串、TypedArray
 *      - Map、Set
 *      - 生成器函数的返回值（Generator 对象）
 *      - 自定义的可迭代对象
 *      - arguments、NodeList 等"可迭代的类数组"
 *    而对象解构依赖的是**属性访问**（内部 [[Get]]），与可迭代无关。
 *
 * 2. 为什么需要
 *    理解了协议，就能解释很多现象：
 *      - 为什么 [...map] 能拿到 [key, value] 数组？
 *      - 为什么解构 { length: 2 } 会报错，而解构 arguments 不会？
 *      - 为什么可以把 generator 当成"可解构的数据源"？
 *    也让"自定义可迭代对象"这个能力变得可用：你可以让任何对象支持解构、
 *    for...of、展开运算，只要实现一个 Symbol.iterator 方法。
 *
 * 3. 核心语法要点
 *    (1) 可迭代协议：对象需要一个 `[Symbol.iterator]` 方法，该方法返回一个
 *        "迭代器对象"。迭代器对象需要一个 `next()` 方法，返回 { value, done }。
 *    (2) 数组解构的实质：按顺序调用迭代器的 next()，把 value 依次赋给变量，
 *        遇到 done: true 就停止（后面的变量得到 undefined，除非有默认值）。
 *    (3) 【重要】解构是"惰性"的：只取需要的个数，不会把整个可迭代对象跑完。
 *        对无限生成器也能安全地解构前 N 项！
 *    (4) 展开运算 ... 与数组解构用的是同一套协议。
 *    (5) 对象解构不需要可迭代，任何对象都行（甚至原始值会被装箱）。
 *    (6) 数组解构时，如果变量比元素多，且迭代器是"无限"的，也不会卡死——
 *        因为解构只在需要时调用 next()。
 *    (7) generator 函数天然返回可迭代对象，所以可以直接解构。
 *
 * 4. 常见陷阱
 *    (1) 把"可迭代"和"类数组"混为一谈：{ length: 2, 0: 'a', 1: 'b' } 能被
 *        Array.from 转换（靠 length + 下标），但不能被直接解构（没有 Symbol.iterator）。
 *    (2) 解构会消耗迭代器：已经取过的元素不会再来一遍。对同一个迭代器重复解构拿不到东西。
 *    (3) 解构一个生成器时会"部分消费"它，后续再用它会从剩余部分继续。
 *    (4) 自定义可迭代对象时，Symbol.iterator 必须返回一个"带 next() 的对象"，
 *        直接写 generator 方法最省事，但要注意每次调用都要返回**新的**迭代器，
 *        否则多次解构会互相干扰。
 *    (5) 解构时若迭代器的 next() 抛错，错误会直接冒泡出来。
 *    (6) 不要把"无限可迭代对象"整份展开（[...infinite] 会死循环），
 *        但可以安全地解构前几项。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 10_destructuring/07_destructuring_iterables.js
 *
 * 【预期输出】
 *   分 6 个小节，从"协议原理"到"自定义可迭代对象"逐层演示。
 * ============================================================================
 */

console.log('--- 1. 数组解构的本质：可迭代协议 ---');

// 数组自带 Symbol.iterator，所以能解构
const arr = [1, 2, 3];
console.log('数组有 Symbol.iterator =', typeof arr[Symbol.iterator]);
const [a1, a2] = arr;
console.log('解构数组 =', a1, a2);

// 字符串也是可迭代的
const str = 'abc';
console.log('字符串有 Symbol.iterator =', typeof str[Symbol.iterator]);
const [s1, s2] = str;
console.log('解构字符串 =', s1, s2);

// 手动走一遍协议，看清"解构到底做了什么"
const manual = [10, 20, 30];
const iterator = manual[Symbol.iterator]();
console.log('\n手动调用迭代器：');
console.log('   第 1 次 next() =', JSON.stringify(iterator.next()));
console.log('   第 2 次 next() =', JSON.stringify(iterator.next()));
console.log('   第 3 次 next() =', JSON.stringify(iterator.next()));
console.log('   第 4 次 next() =', JSON.stringify(iterator.next()), '（done: true 表示结束）');

// 这就是 const [x, y, z] = manual 内部做的事。
// 写一个函数模拟解构过程，帮助理解：
function manualDestructure(iterable, count) {
  const it = iterable[Symbol.iterator]();
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const { value, done } = it.next();
    out.push(done ? undefined : value);
  }
  return out;
}
console.log('\n手动模拟 const [x, y, z, w] = [10, 20, 30] =', JSON.stringify(manualDestructure(manual, 4)));

// 什么不能解构：没有 Symbol.iterator 的对象
const arrayLike = { 0: 'a', 1: 'b', length: 2 };
console.log('\n类数组对象的 Symbol.iterator =', typeof arrayLike[Symbol.iterator], '（没有）');
try {
  const [x] = arrayLike;
  console.log(x);
} catch (err) {
  console.log('直接解构报错：', err.name, '-', err.message.slice(0, 40), '...');
}
console.log('但 Array.from 能转换它（因为它看的是 length + 下标） =', JSON.stringify(Array.from(arrayLike)));
console.log('也可以手动转成可迭代的：', JSON.stringify([...{ ...arrayLike, [Symbol.iterator]: Array.prototype[Symbol.iterator] }]));

console.log('\n--- 2. 解构 Set ---');

const uniqueTags = new Set(['js', 'node', 'js', 'esm']); // 重复的 js 会被去重

// Set 的迭代项是"单个值"
const [tag1, tag2, tag3] = uniqueTags;
console.log('解构 Set =', tag1, tag2, tag3);
console.log('Set 实际元素个数 =', uniqueTags.size, '（去重了）');

// 解构 + rest
const [mainTag, ...otherTags] = uniqueTags;
console.log('主标签 =', mainTag, '，其它 =', JSON.stringify(otherTags));

// Set 的 values() 也是可迭代的
const [firstValue] = uniqueTags.values();
console.log('解构 values() =', firstValue);

// 实用：Set 的"取第一个"（不需要转数组）
const [onlyFirst] = new Set([100, 200, 300]);
console.log('Set 取第一个 =', onlyFirst);

console.log('\n--- 3. 解构 Map 与 TypedArray ---');

const map = new Map([
  ['key1', 'value1'],
  ['key2', 'value2'],
]);

// Map 的迭代项是 [key, value]，所以解构要多一层
const [[firstKey, firstVal], [secondKey, secondVal]] = map;
console.log('解构 Map 的两个 entry =', firstKey, firstVal, '|', secondKey, secondVal);

// 也可以只解构第一个 entry 的第一项
const [[onlyKey]] = map;
console.log('只取第一个 key =', onlyKey);

// TypedArray 也是可迭代的
const bytes = new Uint8Array([10, 20, 30, 40]);
const [b1, b2, ...restBytes] = bytes;
console.log('\n解构 TypedArray =', b1, b2, JSON.stringify(restBytes));
console.log('   restBytes 是普通数组 =', Array.isArray(restBytes), '，而原对象是 =', bytes.constructor.name);

// arguments（普通函数内）也是可迭代的
function sumFirstTwo() {
  const [first, second = 0] = arguments;
  return first + second;
}
console.log('解构 arguments =', sumFirstTwo(3, 4));

console.log('\n--- 4. 解构生成器：按需取值，可以"无限" ---');

// 生成器函数返回的是一个"惰性"的可迭代对象
function* naturalNumbers() {
  let n = 1;
  // 无限循环！但因为是惰性的，不取就不会执行
  while (true) {
    yield n;
    n += 1;
  }
}

const [n1, n2, n3] = naturalNumbers();
console.log('从无限生成器取前三个 =', n1, n2, n3);
console.log('（没有死循环，因为解构只在需要时才调用 next()）');

// 对比：整份展开无限生成器会死循环（所以这里只是说明，不执行）
// console.log([...naturalNumbers()]); // 千万别这么写！

// 有结束条件的生成器
function* take(iterable, count) {
  let taken = 0;
  for (const item of iterable) {
    if (taken >= count) return;
    taken += 1;
    yield item;
  }
}
const [t1, t2, t3, t4] = take(naturalNumbers(), 4);
console.log('用 take 取前四个 =', t1, t2, t3, t4);

// 生成器可以产出任意值，包括对象
function* userStream() {
  yield { id: 1, name: '张三' };
  yield { id: 2, name: '李四' };
}
const [{ name: nameA }, { name: nameB }] = userStream();
console.log('解构生成器产出的对象 =', nameA, nameB);

// 重要：解构会"部分消费"生成器
const gen = naturalNumbers();
const [g1, g2] = gen;
console.log('\n第一次解构拿到 =', g1, g2);
const [g3, g4] = gen; // 继续从剩余部分取，不是从 1 重新开始
console.log('同一个生成器第二次解构拿到 =', g3, g4, '（说明迭代器被消耗了）');

console.log('\n--- 5. 自定义可迭代对象 ---');

// 只要实现 Symbol.iterator，任何对象都能被解构 / for...of / 展开
const range = {
  from: 1,
  to: 5,
  // Symbol.iterator 是一个方法，返回"迭代器对象"
  [Symbol.iterator]() {
    let current = this.from;
    const last = this.to;
    // 返回一个带 next() 的对象
    return {
      next() {
        if (current <= last) {
          const value = current;
          current += 1;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  },
};

const [r1, r2, r3] = range;
console.log('解构自定义 range =', r1, r2, r3);
console.log('也可以展开成数组 =', JSON.stringify([...range]));
const collected = [];
for (const v of range) collected.push(v);
console.log('也可以 for...of =', JSON.stringify(collected));
console.log('注意：每次迭代都会调用 [Symbol.iterator] 得到"新的"迭代器，所以可以重复遍历');

// 用 generator 写 Symbol.iterator 更简洁
const fib = {
  limit: 8,
  *[Symbol.iterator]() {
    let [prev, curr] = [0, 1];
    for (let i = 0; i < this.limit; i += 1) {
      yield prev;
      [prev, curr] = [curr, prev + curr]; // 这里又用到了数组解构交换
    }
  },
};

const [f1, f2, f3, ...restFib] = fib;
console.log('\n用生成器实现的自定义可迭代对象 =', f1, f2, f3, JSON.stringify(restFib));

// 让"类数组对象"变得可解构
const arrayLike2 = { 0: 'x', 1: 'y', 2: 'z', length: 3 };
const iterableArrayLike = {
  ...arrayLike2,
  // 借用 Array.prototype 上的迭代器，让"下标 + length"的结构变成可迭代的
  [Symbol.iterator]: Array.prototype[Symbol.iterator],
};
const [al1, al2] = iterableArrayLike;
console.log('\n给类数组对象加上迭代器后 =', al1, al2);
console.log('（注意：这样得到的迭代器依赖 length 和下标，与真实数组语义一致）');

// 一个更实用的例子：把对象的 entries 变成可解构的
const obj = { a: 1, b: 2, c: 3 };

// 普通对象没有 Symbol.iterator，所以不能用方括号解构（必须用花括号对象解构）
console.log('\n普通对象的 Symbol.iterator =', typeof obj[Symbol.iterator], '（没有）');
try {
  const [e1, e2] = obj;
  console.log(e1, e2);
} catch (err) {
  console.log('用方括号解构普通对象报错：', err.name, '-', err.message.slice(0, 40), '...');
}

// 正确做法：先转成可迭代的
const [entry1, entry2] = Object.entries(obj);
console.log('用 Object.entries 转换后 =', JSON.stringify(entry1), JSON.stringify(entry2));

console.log('\n--- 6. 边界与陷阱 ---');

// (1) 迭代器是一次性的：手动创建的迭代器解构后就没用了
const reusableIterable = [1, 2, 3];
const it = reusableIterable[Symbol.iterator]();
const [i1, i2] = it;
console.log('从迭代器解构 =', i1, i2);
const [i3, i4] = it; // 同一个迭代器继续取
console.log('同一个迭代器再解构 =', i3, i4);
const [j1, j2] = reusableIterable; // 但可迭代对象本身可以反复使用
console.log('可迭代对象本身可重复使用 =', j1, j2);

// (2) 解构时迭代器抛错会冒泡出来
const brokenIterable = {
  [Symbol.iterator]() {
    let count = 0;
    return {
      next() {
        count += 1;
        if (count > 1) throw new Error('迭代器坏了');
        return { value: 'ok', done: false };
      },
    };
  },
};
try {
  const [ok, boom] = brokenIterable;
  console.log('解构结果 =', ok, boom);
} catch (err) {
  console.log('迭代器抛错：', err.name, '-', err.message);
}

// (3) 缺少 next() 会报错
const badIterable = {
  [Symbol.iterator]() {
    return {}; // 没有 next 方法
  },
};
try {
  const [x] = badIterable;
  console.log(x);
} catch (err) {
  console.log('迭代器没有 next() 时报错：', err.name, '-', err.message.slice(0, 50), '...');
}

// (4) 迭代状态必须存在"迭代器"内部，不能存在可迭代对象上，否则会出现共享状态的 bug
let sharedState = 0; // 错误示范：状态放在了可迭代对象外面的闭包里
const sharedIterable = {
  [Symbol.iterator]() {
    return {
      next() {
        sharedState += 1;
        return sharedState <= 3
          ? { value: sharedState, done: false }
          : { value: undefined, done: true };
      },
    };
  },
};
const [p1] = sharedIterable;
const [p2] = sharedIterable;
console.log('\n状态写在外部时：两次解构得到 =', p1, p2, '（第二次没有从头开始，说明状态被共享了——这是 bug）');

// 正确写法：把状态放在 [Symbol.iterator] 内部的局部变量里，每次调用都是一份新状态
const freshIterable = {
  [Symbol.iterator]() {
    let localState = 0; // 每次调用本方法都会新建一个局部变量
    return {
      next() {
        localState += 1;
        return localState <= 3
          ? { value: localState, done: false }
          : { value: undefined, done: true };
      },
    };
  },
};
const [q1] = freshIterable;
const [q2] = freshIterable;
console.log('状态写在迭代器内部时：两次解构得到 =', q1, q2, '（都从头开始，这才是正确的可迭代对象）');

// 用生成器方法写 [Symbol.iterator] 天然就是正确的——每次调用都会创建一个新的生成器
const generatorIterable = {
  *[Symbol.iterator]() {
    yield 1;
    yield 2;
    yield 3;
  },
};
const [gg1] = generatorIterable;
const [gg2] = generatorIterable;
console.log('用生成器方法实现时 =', gg1, gg2, '（同样各自从头开始，且写法最简洁）');

// (5) 对象解构不需要可迭代 —— 用同一个对象试试
const plainObject = { a: 1, b: 2 };
const { a: objA } = plainObject;
console.log('对象解构不需要迭代器 =', objA);

// (6) 用解构实现"取可迭代对象的前 N 项"的通用工具
function takeFirst(iterable, n) {
  const out = [];
  const iterator2 = iterable[Symbol.iterator]();
  for (let i = 0; i < n; i += 1) {
    const { value, done } = iterator2.next();
    if (done) break;
    out.push(value);
  }
  return out;
}
console.log('\ntakeFirst(无限自然数, 5) =', JSON.stringify(takeFirst(naturalNumbers(), 5)));
console.log('takeFirst(range, 3) =', JSON.stringify(takeFirst(range, 3)));

// (7) 还有一个相关工具：迭代器对象的 return() 方法（提前退出时被调用，用于资源清理）
function* withCleanup() {
  try {
    yield 1;
    yield 2;
  } finally {
    console.log('   >> withCleanup 的 finally 块被执行了（资源清理）');
  }
}
const cleanupIter = withCleanup();
cleanupIter.next(); // 取一个值
cleanupIter.return(); // 提前结束，触发 finally
console.log('用 return() 提前结束迭代器会触发 finally（上面那行日志就是）');

console.log('\n全部演示完毕。');
