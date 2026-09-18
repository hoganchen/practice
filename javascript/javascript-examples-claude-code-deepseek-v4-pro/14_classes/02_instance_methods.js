/**
 * ============================================================================
 * 知识点：实例方法 —— 方法定义在原型上，被所有实例共享
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】入门
 * 【前置知识】14_classes/01_class_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    写在类体里、"方法名() {}"形式的成员叫实例方法。它不是写在每个实例身上的，
 *    而是被放在 类.prototype 这个对象上，所有实例通过原型链共享同一个函数。
 *
 * 2. 为什么需要
 *    - 省内存：一万个实例只存一万份数据，方法只有一份。
 *      如果方法挂在实例上，每个实例都要存一份函数对象，内存暴涨。
 *    - 便于统一修改：在原型上加/换方法，所有已存在的实例立刻"看得见"。
 *    - 语义正确："行为"属于类型，"数据"属于个体。
 *
 * 3. 核心语法要点
 *    - 简写形式：foo() {}，不要加 function，不要加逗号。
 *    - 计算属性名：['my' + 'Method']() {} 也是合法的，可动态生成方法名。
 *    - 生成器方法：*gen() {}；异步方法：async foo() {}；异步生成器：async *foo() {}。
 *    - 方法默认不可枚举、不可构造（没有 prototype 属性，不能用 new 调用）。
 *    - 通过 实例.方法名 调用时，this 是实例；通过 Person.prototype.方法名 调用时，
 *      this 是原型对象（这是"方法提取后 this 丢失"的根源，见 15_this_and_context/02）。
 *
 * 4. 常见陷阱
 *    - 误以为"每个实例有自己的方法"：p1.sayHi === p2.sayHi 其实为 true。
 *    - 把方法当构造函数用会报错（方法没有 [[Construct]]）。
 *    - 在方法里用箭头函数定义回调时，this 会变成词法作用域里的 this（见 15 章）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/02_instance_methods.js
 *
 * 【预期输出】
 *   用 === 比较两个实例上的同名方法，证明它们指向同一个函数对象。
 * ============================================================================
 */

console.log('--- 1. 定义带多个实例方法的类 ---');

class Counter {
  constructor(label) {
    // 每个实例独有：标签与计数
    this.label = label;
    this.count = 0;
  }

  // 实例方法：修改实例自己的数据
  increment() {
    this.count += 1;
    return this;
  }

  decrement() {
    this.count -= 1;
    return this;
  }

  // 返回字符串，不修改状态
  report() {
    return `[${this.label}] 当前计数 = ${this.count}`;
  }

  // 计算属性名：方法名可以在定义时由表达式算出来
  ['reset' + 'To'](value) {
    this.count = value;
    return this;
  }

  // 生成器方法：用 * 前缀，调用后得到迭代器
  *steps(limit) {
    for (let i = 1; i <= limit; i += 1) {
      yield `${this.label} 第 ${i} 步`;
    }
  }

  // 异步方法：用 async 前缀，调用后返回 Promise
  async delayedReport(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return this.report();
  }
}

console.log('--- 2. 两个实例共享同一个方法函数 ---');

const c1 = new Counter('甲');
const c2 = new Counter('乙');

// 关键证明：通过实例取到的方法，其实就是原型上的那一个函数。
console.log('c1.increment === c2.increment ？', c1.increment === c2.increment);
console.log('c1.report === Counter.prototype.report ？', c1.report === Counter.prototype.report);
console.log('c1.increment === Counter.prototype.increment ？', c1.increment === Counter.prototype.increment);

// 也就是说：方法只有一份，实例只是通过原型链"找到"了它。
console.log('实例自身有没有 increment 属性？', Object.hasOwn(c1, 'increment'));
console.log('原型上有 increment 属性吗？', Object.hasOwn(Counter.prototype, 'increment'));

console.log('--- 3. 但数据是每个实例独一份 ---');

c1.increment().increment().increment();
c2.increment();

// 两个实例的 count 互不影响，因为 count 挂在各自对象上。
console.log(c1.report());
console.log(c2.report());
console.log('两个实例的 count 相同吗？', c1.count === c2.count);

console.log('--- 4. 方法调用时 this 指向调用者 ---');

// 同一个函数，被谁调用，this 就是谁。
const reportFn = Counter.prototype.report;
console.log('通过 c1 调用：', c1.report());
console.log('通过 c2 调用：', c2.report());
// 下面这行如果直接 reportFn() 会因严格模式下 this 为 undefined 而抛错，
// 所以用 .call 显式指定 this（详见 15_this_and_context/04）。
console.log('用 call 把 this 绑到 c1：', reportFn.call(c1));

console.log('--- 5. 动态增加方法会影响所有已有实例 ---');

// 因为查找是运行时沿原型链进行的，往原型上加方法后，
// 早已创建好的实例也能立刻使用。
Counter.prototype.double = function double() {
  this.count *= 2;
  return this;
};

console.log('新加的方法对老实例也有效：', c1.double().report());

console.log('--- 6. 计算属性名 / 生成器方法 / 异步方法 ---');

console.log('计算属性名方法：', c1.resetTo(100).report());

// 生成器方法返回迭代器，可以用 for...of 消费
const stepsList = [];
for (const step of c2.steps(3)) {
  stepsList.push(step);
}
console.log('生成器方法产出：', stepsList.join(' | '));

console.log('--- 7. 方法不能当构造函数用（try/catch 演示） ---');

// 类方法没有 [[Construct]] 内部方法，用 new 调用会抛 TypeError。
try {
  new c1.increment();
} catch (err) {
  console.log('用 new 调用方法报错：', err.constructor.name);
  console.log('错误信息：', err.message);
}

console.log('--- 8. 方法不可枚举，不会被 for...in 扫到 ---');

const protoKeys = [];
for (const key in c1) {
  // for...in 会沿原型链遍历所有"可枚举"属性。
  // 结果里能看到：实例自己的 label / count，以及第 5 步用普通赋值
  // 加到原型上的 double（赋值产生的属性默认可枚举）。
  // 而 increment / report / steps 这些 class 方法一个都不出现 ——
  // 因为类体内定义的方法 enumerable 为 false，这是 class 的重要默认行为。
  protoKeys.push(key);
}
console.log('for...in 遍历 c1 得到的键：', protoKeys.join(', '));
console.log('其中没有 increment 吗？', !protoKeys.includes('increment'));
console.log('其中出现 double 是因为它是赋值添加的？', protoKeys.includes('double'));
console.log(
  '原型上 double 的 enumerable =',
  Object.getOwnPropertyDescriptor(Counter.prototype, 'double').enumerable,
);

console.log('--- 9. 异步方法返回 Promise ---');

const result = await c1.delayedReport(10);
console.log('异步方法结果：', result);

console.log('\n全部演示完毕。');
