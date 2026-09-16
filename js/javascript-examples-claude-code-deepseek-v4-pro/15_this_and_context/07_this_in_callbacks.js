/**
 * ============================================================================
 * 知识点：回调中的 this —— setTimeout、数组方法的第二个参数、事件处理器
 * ============================================================================
 *
 * 【所属分类】15_this_and_context —— this 与执行上下文
 * 【难度等级】进阶
 * 【前置知识】15_this_and_context/06_this_priority.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    把函数作为参数传给别的代码（回调）时，this 不再由你控制，而是由
 *    "接收方怎么调用这个回调"决定。绝大多数情况下接收方会**裸调用**它
 *    （cb()），于是 this 退化为默认绑定（严格模式 undefined）。
 *
 * 2. 为什么需要
 *    - 现实代码大量依赖回调：定时器、数组方法、事件监听、Promise、流。
 *    - 提前知道每种 API 怎么处理 this，能少踩很多坑。
 *
 * 3. 核心语法要点
 *    - setTimeout / setInterval：回调被裸调用，this 通常是定时器对象
 *      （浏览器里是 window；Node.js 里是一个 Timeout 对象）。
 *      结论：不要依赖它，用箭头函数或 bind。
 *    - 数组方法 forEach / map / filter / some / every / find / flatMap：
 *      **所有**都支持可选的第二个参数 thisArg。但由于箭头函数不能绑定 this，
 *      传 thisArg 时必须用普通函数。
 *    - 事件处理器：在浏览器里，普通函数的 this 是绑定监听器的元素；
 *      箭头函数则捕获定义处的 this。Node 的 EventEmitter 是裸调用，
 *      this 是 EventEmitter 实例（除非预先 bind）。
 *    - Promise 的 then / catch 回调：由引擎裸调用，this 是 undefined。
 *    - 回调里的 this 修复手段（优先级从高到低）：
 *        ① 用箭头函数（最简洁，推荐）；
 *        ② 在定义处 bind；
 *        ③ 把 this 存到变量（const self = this）—— 老代码常见；
 *        ④ 用 thisArg 参数（仅限支持它的 API，如数组方法）。
 *
 * 4. 常见陷阱
 *    - 给箭头函数传 thisArg：完全无效，容易被误以为生效。
 *    - 在 Node 的 setTimeout 回调里用 this 访问外层对象。
 *    - 用 bind 修复后忘记保存引用，导致无法 removeEventListener / clearTimeout。
 *    - 在类的方法里直接传 this.method 给 forEach。
 *    - 误以为 Promise 的 then 回调里 this 是外层对象。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 15_this_and_context/07_this_in_callbacks.js
 *
 * 【预期输出】
 *   打印各类回调中 this 的实际值，并对比四种修复方案的效果。
 * ============================================================================
 */

console.log('--- 1. setTimeout 回调里的 this ---');

const timerHost = {
  label: '定时器宿主',
  count: 0,

  // 反例：普通函数回调，this 不受控
  useNormal() {
    setTimeout(function callback() {
      // Node.js 里 this 是 Timeout 对象；浏览器里是 window。
      // 无论哪种，都不是 timerHost。
      const desc = this === timerHost
        ? 'timerHost'
        : (typeof this === 'undefined' ? 'undefined' : (this.constructor?.name ?? typeof this));
      console.log('  普通函数回调里的 this →', desc);
    }, 0);
  },

  // 正例：箭头函数回调
  useArrow() {
    setTimeout(() => {
      this.count += 1;
      console.log('  箭头函数回调里的 this === timerHost ？', this === timerHost);
    }, 0);
  },

  // 备选：显式 bind
  useBind() {
    setTimeout(function callback() {
      this.count += 1;
      console.log('  bind 回调里的 this === timerHost ？', this === timerHost);
    }.bind(this), 0);
  },

  // 老写法：保存 this
  useSelf() {
    const self = this;
    setTimeout(function callback() {
      self.count += 10;
      console.log('  self 写法也能工作？', self === timerHost, '| count =', self.count);
    }, 0);
  },
};

timerHost.useNormal();
timerHost.useArrow();
timerHost.useBind();
timerHost.useSelf();

// 等所有 0ms 定时器回调执行完
await new Promise((resolve) => setTimeout(resolve, 20));
console.log('全部回调执行后 count =', timerHost.count);

console.log('--- 2. 数组方法的第二个参数 thisArg ---');

const analyzer = {
  threshold: 10,
  // 普通函数 + thisArg：this 生效
  filterWithNormal() {
    const data = [5, 12, 8, 20, 3];
    // forEach / map / filter / some / every / find 都支持这第二个参数
    return data.filter(function isBigEnough(value) {
      // 这里的 this 就是第二个参数传入的对象
      return value > this.threshold;
    }, this); // ← thisArg
  },
  // 箭头函数 + thisArg：thisArg 被忽略（箭头函数根本不看它）
  filterWithArrow() {
    const data = [5, 12, 8, 20, 3];
    return data.filter((value) => value > this.threshold, { threshold: 999 });
    // ↑ thisArg 传了也没用，this 仍然是 analyzer
  },
};

console.log('普通函数 + thisArg →', analyzer.filterWithNormal());
console.log('箭头函数 + thisArg（thisArg 无效）→', analyzer.filterWithArrow());

// 各数组方法都支持 thisArg，行为一致
const ctx = { min: 8 };
const nums = [1, 5, 9, 15];
console.log('map 的 thisArg：', nums.map(function double() {
  return this.min * 2 + 0;
}, ctx));
console.log('some 的 thisArg：', nums.some(function exceeds() {
  return this.min > 100;
}, ctx));
console.log('every 的 thisArg：', nums.every(function below() {
  return this.min > 0;
}, ctx));
console.log('find 的 thisArg：', nums.find(function match() {
  return this.min + 4 === 12;
}, ctx));
console.log('reduce 也支持吗？不支持 thisArg（第二个参数是初始值）：',
  nums.reduce((acc, n) => acc + n, 0));

console.log('--- 3. 数组方法里最推荐的写法：箭头函数 ---');

const stats = {
  factor: 3,
  scale(data) {
    // 箭头函数直接用外层的 this，不用传 thisArg，最简洁
    return data.map((n) => n * this.factor);
  },
};
console.log('arrow 写法：', stats.scale([1, 2, 3]));

console.log('--- 4. 事件处理器里的 this（用极简 EventEmitter 演示） ---');

// 复刻 Node 的 EventEmitter 行为：回调被裸调用
class SimpleEmitter {
  #handlers = new Map();
  on(event, handler) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, []);
    this.#handlers.get(event).push(handler);
    return this;
  }
  emit(event, ...args) {
    const results = [];
    for (const handler of this.#handlers.get(event) ?? []) {
      // 注意这里是裸调用 handler(...)，this 不会自动变成 emitter
      results.push(handler(...args));
    }
    return results;
  }
}

class Button {
  constructor(label) {
    this.label = label;
    this.state = 'idle';
  }

  // 普通方法：传出去后 this 丢失，访问 this.label 直接抛错
  onPressNormal() {
    return `普通方法：${this.label} 被按下`;
  }

  // 箭头函数字段：this 固定为实例
  onPressArrow = () => `箭头字段：${this.label} 被按下，状态 ${this.state}`;
}

const emitter = new SimpleEmitter();
const btn = new Button('提交按钮');

// 情况一：注册普通方法（未 bind）
emitter.on('press', btn.onPressNormal);
console.log('触发注册了普通方法的监听器：');
try {
  emitter.emit('press');
} catch (err) {
  console.log('  报错：', err.constructor.name, '—', err.message);
}

// 情况二：注册箭头函数字段
const emitter2 = new SimpleEmitter();
emitter2.on('press', btn.onPressArrow);
console.log('触发注册了箭头函数字段的监听器：');
console.log('  结果：', emitter2.emit('press'));

// 情况三：注册时 bind，普通方法也能正常工作
const emitter3 = new SimpleEmitter();
const boundBtn = new Button('取消按钮');
emitter3.on('press', boundBtn.onPressNormal.bind(boundBtn));
emitter3.on('press', boundBtn.onPressArrow);
console.log('触发 bind 过的普通方法 + 箭头字段：');
console.log('  结果：', emitter3.emit('press'));

console.log('--- 5. Promise 回调里的 this ---');

const promiseHost = {
  tag: 'promiseHost',
  // 反例：普通函数
  normalThen() {
    return Promise.resolve(1).then(function onFulfilled(value) {
      return { thisType: this === undefined ? 'undefined' : typeof this, value };
    });
  },
  // 正例：箭头函数
  arrowThen() {
    return Promise.resolve(1).then((value) => ({ thisIsHost: this === promiseHost, value }));
  },
};

console.log('普通函数 then 回调：', JSON.stringify(await promiseHost.normalThen()));
console.log('箭头函数 then 回调：', JSON.stringify(await promiseHost.arrowThen()));

console.log('--- 6. 修复方案的取舍 ---');

const solutions = [
  ['箭头函数', '最简洁，推荐；但会多占内存（每个实例一份）'],
  ['bind', '语义显式；但生成新函数，移除监听器时必须保存引用'],
  ['const self = this', '老代码常见，兼容性最好；可读性稍差'],
  ['thisArg 参数', '仅限数组方法等少量 API；箭头函数下无效'],
];
console.log('  方案              说明');
for (const [name, note] of solutions) {
  console.log(`  ${name.padEnd(16)}  ${note}`);
}

console.log('--- 7. 排查清单 ---');

const checklist = [
  '回调里 this 不是想要的值？先判断"谁在调用它"。',
  '框架/库文档会说清楚 this 是什么，不确定时打印一下最快。',
  '顺手把回调写成箭头函数，能避免 90% 的该类问题。',
  '必须在回调里用动态 this（如 DOM 事件委托）时，才用普通函数。',
];
for (const line of checklist) console.log('  •', line);

console.log('\n全部演示完毕。');
