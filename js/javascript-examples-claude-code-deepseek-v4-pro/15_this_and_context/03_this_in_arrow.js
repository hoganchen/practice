/**
 * ============================================================================
 * 知识点：箭头函数的 this —— 词法捕获，没有自己的 this
 * ============================================================================
 *
 * 【所属分类】15_this_and_context —— this 与执行上下文
 * 【难度等级】入门
 * 【前置知识】15_this_and_context/02_this_in_method.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    箭头函数（=>）**没有自己的 this**。它内部的 this 在"定义时"就确定下来，
 *    等于外层作用域的 this，并且之后永远不变。这叫词法作用域（lexical this）。
 *
 * 2. 为什么需要
 *    - ES5 时代回调里想用外层 this，必须写 `const self = this;` 或
 *      `.bind(this)`，繁琐且容易漏。
 *    - 箭头函数让"回调里继续用外层 this"变成默认行为，代码更短更清晰。
 *
 * 3. 核心语法要点
 *    - 箭头函数的 this 由**定义位置的外层函数**决定，与调用方式无关：
 *        obj.arrowFn()          → this 仍是外层作用域的 this，不是 obj
 *        arrowFn.call(obj)      → this 完全不受影响
 *        new ArrowFn()          → 报错，箭头函数不能当构造函数
 *    - 箭头函数还共享外层的 arguments 与 new.target（也都没有自己的）。
 *    - 箭头函数没有 prototype 属性，也没有 [[Construct]]。
 *    - 判断 this 的技巧："从箭头函数出发，往外找最近的一个**非箭头**函数，
 *      看它被怎么调用，那个 this 就是箭头函数看到的 this。"
 *    - 如果外层就是模块顶层，那 this 在 ESM 里就是 undefined。
 *    - 对象字面量里的箭头函数拿不到对象自己（因为对象字面量不创建 this）。
 *
 * 4. 常见陷阱
 *    - 用箭头函数定义对象方法 / 类方法，指望 this 指向对象 —— 拿不到。
 *    - 在类字段里用箭头函数是对的（那时 this 已是实例），但会多占内存
 *      （每个实例一份），原型方法则共享一份。
 *    - 需要动态 this 的场景（如事件委托、借用方法）不能用箭头函数。
 *    - 嵌套多层箭头函数时，this 会一直往外穿透到最近的非箭头函数。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 15_this_and_context/03_this_in_arrow.js
 *
 * 【预期输出】
 *   对比普通函数与箭头函数在各种调用方式下的 this，并 try/catch 演示
 *   箭头函数不能 new、call 无效等特性。
 * ============================================================================
 */

console.log('--- 1. 最直观的对比：回调里的 this ---');

const timer = {
  label: '计时器',
  // 普通函数版本：作为回调被"裸调用"时 this 丢失
  runNormal() {
    const results = [];
    [1].forEach(function callback() {
      // 这里的 this 与外层 runNormal 无关，是 undefined
      results.push(typeof this === 'undefined' ? 'undefined' : '有值');
    });
    return results.join(',');
  },
  // 箭头函数版本：this 直接继承外层（timer）
  runArrow() {
    const results = [];
    [1].forEach(() => {
      // 这里的 this 就是 runNormal 里的 this，也就是 timer
      results.push(this.label);
    });
    return results.join(',');
  },
};

console.log('普通函数回调里的 this：', timer.runNormal());
console.log('箭头函数回调里的 this：', timer.runArrow());

console.log('--- 2. 箭头函数在"定义时"就锁定 this ---');

const outer = {
  name: '外层对象',
  // 用一个普通方法作为 this 的来源
  makeArrows() {
    // 定义两个箭头函数，它们的 this 都是 outer（因为外层方法被 outer.调用）
    const arrowA = () => this.name;
    const arrowB = () => this.name;
    return { arrowA, arrowB };
  },
};

const { arrowA, arrowB } = outer.makeArrows();
// 已经"脱离"了 outer，但 this 依然指向 outer
console.log('提取后调用 arrowA() =', arrowA());
console.log('提取后调用 arrowB() =', arrowB());

// 强行用 call/apply 也改不了
const other = { name: '另一个对象' };
console.log('arrowA.call(other) =', arrowA.call(other), '（call 对箭头函数无效）');
console.log('arrowA.apply(other) =', arrowA.apply(other));
console.log('arrowA.bind(other)() =', arrowA.bind(other)(), '（bind 同样无效）');

console.log('--- 3. 箭头函数的 this 与调用方式完全无关 ---');

const holder = {
  name: 'holder',
  arrow: () => (typeof this === 'undefined' ? '(模块顶层的 undefined)' : this.name),
  // 对比：普通方法
  normal() {
    return this.name;
  },
};

console.log('holder.arrow() =', holder.arrow(), '（箭头函数看不到 holder）');
console.log('holder.normal() =', holder.normal(), '（普通方法能看到 holder）');

console.log('--- 4. 逐步往外找：嵌套箭头函数的 this 来源 ---');

const nested = {
  tag: '最外层',
  level1() {
    // 这里 this = nested
    const a = () => {
      // 箭头 → 往外找 level1，this = nested
      const b = () => {
        // 依然是 nested
        const c = () => this.tag;
        return c();
      };
      return b();
    };
    return a();
  },
  level1WithNormal() {
    const self = this;
    // 中间插一个普通函数，this 就断了
    function normal() {
      return typeof this === 'undefined' ? self.tag + '（靠闭包 saved）' : this.tag;
    }
    const arrowInside = () => normal();
    return arrowInside();
  },
};

console.log('多层箭头穿透：', nested.level1());
console.log('中间夹普通函数：', nested.level1WithNormal());

console.log('--- 5. 箭头函数不能当构造函数（try/catch 演示） ---');

const ArrowCtor = () => {
  this.x = 1;
};

try {
  const inst = new ArrowCtor();
  console.log(inst);
} catch (err) {
  console.log('new 箭头函数报错：', err.constructor.name);
  console.log('  信息：', err.message);
}

// 箭头函数也没有 prototype 属性
console.log('普通函数的 prototype：', typeof function normalFn() {}.prototype);
console.log('箭头函数的 prototype：', typeof ArrowCtor.prototype);

// 也没有自己的 arguments
const argsDemo = {
  value: 'v',
  normalArgs() {
    // 普通函数有 arguments
    return `arguments.length = ${arguments.length}`;
  },
  arrowArgs() {
    // 箭头函数没有自己的 arguments，这里的 arguments 来自外层 arrowArgs
    const arrow = () => `arguments.length = ${arguments.length}`;
    return arrow();
  },
};
console.log('普通函数的 arguments：', argsDemo.normalArgs(1, 2, 3));
console.log('箭头函数借用外层的 arguments：', argsDemo.arrowArgs('a', 'b'));

console.log('--- 6. 什么时候必须用普通函数 ---');

const mustBeNormal = {
  items: ['a', 'b'],
  // 场景一：需要动态 this（这里 this 由调用方决定）
  describe() {
    return `共 ${this.items.length} 项`;
  },
  // 场景二：需要 arguments
  sumAll() {
    return Array.from(arguments).reduce((acc, n) => acc + n, 0);
  },
  // 场景三：需要能被 new（构造函数/类）
  // 场景四：需要挂到原型上被所有实例共享的方法（见 class 的普通方法）
};

// 借用 describe 到另一个对象上 —— 这要求它是普通函数
const borrowed = { items: [1, 2, 3, 4] };
console.log('借用给别的对象：', mustBeNormal.describe.call(borrowed));
console.log('arguments 求和：', mustBeNormal.sumAll(1, 2, 3, 4));

console.log('--- 7. 经典场景：防抖 / 延时里的 this ---');

const counter = {
  count: 0,
  // 用普通函数写延时回调，this 会丢
  buggyDelay() {
    setTimeout(function callback() {
      // 这里 this 是 Timeout 对象（Node 的定时器），不是 counter
      // 所以不能直接 this.count += 1
      if (typeof this?.count === 'number') {
        this.count += 1;
      } else {
        console.log('  buggyDelay 里回调的 this 不是 counter，操作被跳过');
      }
    }, 0);
  },
  // 用箭头函数写，this 正确
  fixedDelay() {
    setTimeout(() => {
      this.count += 1;
      console.log('  fixedDelay 回调里 this === counter ？', this === counter);
    }, 0);
  },
};

counter.buggyDelay();
counter.fixedDelay();
// 等待两个 setTimeout 的回调执行完，保证输出顺序清晰。
await new Promise((resolve) => setTimeout(resolve, 20));

console.log('--- 8. 对象字面量 vs class 字段：箭头函数的正确落点 ---');

// 对象字面量：箭头函数拿不到对象（对象字面量不创建 this 作用域）
const literalObj = {
  name: '字面量',
  getNameArrow: () => (typeof this === 'undefined' ? '(undefined)' : this.name),
  getNameNormal() {
    return this.name;
  },
};
console.log('字面量里的箭头 →', literalObj.getNameArrow());
console.log('字面量里的普通方法 →', literalObj.getNameNormal());

// class 字段：箭头函数在实例创建时求值，this 就是实例
class Widget {
  name = '组件';
  // 这是合法的、也很有用：字段初始化器里的 this 就是新实例
  handleClick = () => `点击了 ${this.name}`;
  // 对比：原型方法，调用时 this 由调用方式决定
  renderNormal() {
    return `渲染 ${this.name}`;
  }
}
const w = new Widget();
const handler = w.handleClick;
console.log('class 箭头字段提取后调用 →', handler());
const render = w.renderNormal;
try {
  render();
} catch (err) {
  console.log('class 原型方法提取后调用报错：', err.constructor.name);
}

console.log('--- 9. 判断 this 的三步法 ---');

const steps = [
  '第一步：这个函数是箭头函数吗？是 → 往外找最近的非箭头函数。',
  '第二步：非箭头函数的调用形式是什么？',
  '        obj.fn() → this 是 obj；fn() → 默认绑定；new Fn() → 新实例；',
  '        fn.call(x) → this 是 x。',
  '第三步：函数体是严格模式吗？决定"默认绑定"是 undefined 还是全局对象。',
];
for (const line of steps) console.log('  •', line);

console.log('\n全部演示完毕。');
