/**
 * ============================================================================
 * 知识点：自定义可迭代对象 —— 让自家类型能被 for...of 和解构使用
 * ============================================================================
 *
 * 【所属分类】17_iterators_and_generators —— 迭代器与生成器
 * 【难度等级】进阶
 * 【前置知识】17_iterators_and_generators/02_iterator_protocol.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    在自己的类或对象上实现 [Symbol.iterator] 方法，让它变成可迭代对象。
 *    实现后，for...of、展开运算符、解构赋值、Array.from、new Set()
 *    全都能直接作用在你自己的类型上。
 *
 * 2. 为什么需要
 *    自定义数据结构（区间、链表、矩阵、树）天生带"遍历"语义。
 *    与其暴露内部的 next 指针让使用者自己管理，不如实现可迭代协议，
 *    让使用者用统一的 for...of 语法。这也是"面向接口编程"在 JS 里的体现。
 *
 * 3. 核心语法要点
 *    - 类里写成 [Symbol.iterator]() { ... }，方法名必须用计算属性写法。
 *    - 返回对象必须含 next()，返回 { value, done }。
 *    - 最省事的写法是返回一个闭包迭代器，或者在方法内部用生成器
 *      （function* 写起来更短，见 04 篇；本篇先全部手写以看清原理）。
 *    - 每次调用 [Symbol.iterator] 都应返回一个全新的迭代器，
 *      这样同一个对象才能被反复遍历。
 *
 * 4. 常见陷阱
 *    - 把 [Symbol.iterator] 写成普通属性而不是方法，for...of 报
 *      "is not a function"。
 *    - 迭代器状态放在实例上（如 this.index），导致第二次遍历从中间开始。
 *    - 提前 return 或用 break 跳出 for...of 时，迭代器不会被"通知"，
 *      若持有外部资源要自己清理。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 17_iterators_and_generators/03_custom_iterable.js
 *
 * 【预期输出】
 *   三个自定义可迭代对象（区间 Range、链表 LinkedList、矩阵 Matrix）
 *   分别用 for...of、展开、解构消费的结果。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Range：可迭代的数值区间
// ---------------------------------------------------------------------------

console.log('--- 1. 自定义可迭代对象：Range（区间） ---');

class Range {
  /**
   * @param {number} start 起始值（含）
   * @param {number} end   结束值（含）
   * @param {number} step  步长，必须为正数
   */
  constructor(start, end, step = 1) {
    this.start = start;
    this.end = end;
    this.step = step;
  }

  // 计算长度，方便打印信息
  get length() {
    if (this.end < this.start) return 0;
    return Math.floor((this.end - this.start) / this.step) + 1;
  }

  // 关键：实现可迭代协议。注意方法名是计算属性 [Symbol.iterator]。
  [Symbol.iterator]() {
    // 状态变量写在方法内部（闭包），而不是 this 上，
    // 这样每个迭代器都有独立的游标，对象可以被反复遍历。
    let current = this.start;
    const { end, step } = this;

    return {
      next() {
        if (current <= end) {
          const value = current;
          current += step; // 先记录当前值，再推进游标
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}

const range = new Range(1, 5);

console.log('Range(1,5) 的长度：', range.length);

// 用法一：for...of
const collected = [];
for (const n of range) collected.push(n);
console.log('for...of 结果：', collected);

// 用法二：展开运算符
console.log('展开结果：', [...range]);

// 用法三：Array.from
console.log('Array.from：', Array.from(range));

// 用法四：解构
const [head, ...tail] = range;
console.log('解构首项：', head, '剩余：', tail);

// 用法五：new Set / new Map 等构造函数
console.log('new Set 去重后：', [...new Set(new Range(1, 3))]);

// 反复遍历互不干扰，因为每次 for...of 都调用一次 [Symbol.iterator] 拿新迭代器
console.log('第二次遍历：', [...range]);

// 带步长
console.log('Range(0, 10, 2)：', [...new Range(0, 10, 2)]);

// 反向区间（start > end）直接是空
console.log('Range(5, 1) 为空：', [...new Range(5, 1)]);

// ---------------------------------------------------------------------------
// 2. LinkedList：单向链表
// ---------------------------------------------------------------------------

console.log('\n--- 2. 自定义可迭代对象：LinkedList（单向链表） ---');

class LinkedList {
  constructor() {
    this.head = null; // { value, next }
    this.size = 0;
  }

  /** 在尾部追加一个值 */
  push(value) {
    const node = { value, next: null };
    if (this.head === null) {
      this.head = node;
    } else {
      // 从头走到最后一个节点
      let cur = this.head;
      while (cur.next !== null) cur = cur.next;
      cur.next = node;
    }
    this.size++;
    return this; // 返回 this 以支持链式调用
  }

  /**
   * 实现可迭代协议。
   * 链表的节点顺序是单向的，迭代器只需从头节点一路 next 到底。
   */
  [Symbol.iterator]() {
    let node = this.head; // 闭包游标：当前节点

    return {
      next() {
        if (node === null) {
          return { value: undefined, done: true };
        }
        const value = node.value;
        node = node.next; // 游标推进到下一个节点
        return { value, done: false };
      },
    };
  }
}

const list = new LinkedList();
list.push('A').push('B').push('C').push('D');

console.log('链表长度：', list.size);
console.log('for...of 遍历链表：');
for (const item of list) {
  console.log('  节点值：', item);
}

console.log('展开成数组：', [...list]);

// 有了可迭代协议，就能直接用数组方法：先转数组再操作
console.log('转数组后 filter：', [...list].filter((v) => v !== 'B'));

// 解构也可以用
const [firstNode, secondNode] = list;
console.log('前两个节点：', firstNode, secondNode);

// ---------------------------------------------------------------------------
// 3. Matrix：二维矩阵按"行优先"展开
// ---------------------------------------------------------------------------

console.log('\n--- 3. 自定义可迭代对象：Matrix（矩阵） ---');

class Matrix {
  /** @param {number[][]} rows 二维数组 */
  constructor(rows) {
    this.rows = rows;
  }

  // 矩阵迭代：按行优先（先第一行从左到右，再第二行……）铺平所有元素。
  // 这里用两个闭包变量记录行列下标，避免额外分配数组。
  [Symbol.iterator]() {
    let r = 0;
    let c = 0;
    const rows = this.rows;

    return {
      next() {
        // 跳过空的（或已经走完的）行
        while (r < rows.length && c >= rows[r].length) {
          r++;
          c = 0;
        }
        if (r >= rows.length) {
          return { value: undefined, done: true };
        }
        const value = rows[r][c];
        c++; // 列前进一步
        return { value, done: false };
      },
    };
  }
}

const matrix = new Matrix([
  [1, 2, 3],
  [4, 5],
  [],      // 空行也不会让迭代卡住
  [6, 7, 8, 9],
]);

console.log('矩阵元素个数：', [...matrix].length);
console.log('按行优先展开：', [...matrix]);
console.log('求总和：', [...matrix].reduce((a, b) => a + b, 0));

// 每一行本身也是可迭代的（数组），所以可以嵌套遍历
console.log('嵌套 for...of（外层行、内层元素）：');
for (const row of matrix.rows) {
  const line = [];
  for (const cell of row) line.push(cell);
  console.log(`  行 [${line.join(', ')}]`);
}

console.log('\n示例结束。');
