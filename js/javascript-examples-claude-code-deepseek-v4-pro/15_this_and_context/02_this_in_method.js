/**
 * ============================================================================
 * 知识点：隐式绑定 —— 对象方法调用，以及方法"提取"后 this 丢失
 * ============================================================================
 *
 * 【所属分类】15_this_and_context —— this 与执行上下文
 * 【难度等级】入门
 * 【前置知识】15_this_and_context/01_this_rules.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    当函数作为对象的属性被调用时（obj.method()），this 自动绑定到
 *    那个"点号前面的对象"。这叫隐式绑定。
 *
 * 2. 为什么需要
 *    - 绝大多数面向对象代码都依赖隐式绑定：方法里用 this 访问实例数据。
 *    - 一旦把方法"提取"出来（赋值给变量、当参数传递、放进数组），
 *      隐式绑定就消失了，this 退化为默认绑定 —— 这是 JS 最常见的 bug 之一。
 *
 * 3. 核心语法要点
 *    - 关键看"调用表达式"而不是"定义位置"：obj.fn() 中 this 是 obj。
 *    - 只看**最后一个点**：
 *        a.b.c.fn()      → this 是 a.b.c
 *        const f = a.b.c.fn; f()  → this 是 undefined（严格模式）
 *    - 链式上有多层也没用，只有紧挨着调用括号的那个对象才算数。
 *    - 隐式绑定可以被"借用"：Array.prototype.join.call(arrayLike, '-')。
 *    - 对象里的方法简写 fn() {} 与 fn: function () {} 在 this 行为上完全一致。
 *    - 嵌套对象中的 this 只认最近一层：
 *        outer.inner.fn()  → this 是 outer.inner，不是 outer。
 *
 * 4. 常见陷阱
 *    - 方法提取后调用：this 丢失，报 "Cannot read properties of undefined"。
 *    - 把方法当回调传给 setTimeout / forEach（见 07 节）。
 *    - 用解构赋值取方法：const { fn } = obj; fn(); 同样是提取。
 *    - 在方法内部再定义普通函数并调用，内层函数的 this 会重新绑定。
 *    - 返回 this 实现链式调用时，如果中途 this 丢了，链就断了。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 15_this_and_context/02_this_in_method.js
 *
 * 【预期输出】
 *   打印各种调用形式下的 this 指向，并用 try/catch 演示 this 丢失的具体报错。
 * ============================================================================
 */

console.log('--- 1. 最基本的隐式绑定 ---');

const user = {
  name: '张三',
  age: 28,
  // 方法简写（推荐写法）
  introduce() {
    return `我是 ${this.name}，今年 ${this.age} 岁`;
  },
};

// 点号前面的对象就是 this
console.log('user.introduce() =', user.introduce());

// 换一个对象来"借用"同一个方法（这是 this 动态绑定的直接证据）
const another = { name: '李四', age: 30, introduce: user.introduce };
console.log('another.introduce() =', another.introduce());

console.log('--- 2. 只看最后一个点号 ---');

const company = {
  name: '某公司',
  department: {
    name: '研发部',
    describe() {
      // 这里的 this 是 department，不是 company
      return `部门名：${this.name}`;
    },
  },
};

console.log('company.department.describe() =', company.department.describe());

// 验证：把方法挂到顶层，再调用，this 就变了
company.describeDept = company.department.describe;
console.log('company.describeDept() 的 this 换成 company =', company.describeDept());

console.log('--- 3. 方法提取后 this 丢失（try/catch 演示） ---');

const account = {
  owner: '王五',
  balance: 1000,
  showBalance() {
    // 一旦 this 是 undefined，访问 this.balance 就会抛错
    return `${this.owner} 的余额：${this.balance}`;
  },
};

// 正常调用
console.log('正常调用：', account.showBalance());

// 提取成变量：这只是拿到了函数本身，与 account 的关联被"切断"了
const extracted = account.showBalance;
try {
  console.log(extracted());
} catch (err) {
  console.log('提取后调用报错：', err.constructor.name);
  console.log('  信息：', err.message);
}

// 解构赋值也是提取
const { showBalance } = account;
try {
  showBalance();
} catch (err) {
  console.log('解构后调用报错：', err.constructor.name, '—', err.message);
}

// 一个容易误判的情况：把方法放进数组后 fns[0]() 调用。
// fns[0]() 其实**仍然是隐式绑定**，只不过 this 变成了数组 fns！
// 因为"点号（下标）前面的对象"是 fns。所以它不会抛错，而是得到 undefined 值。
const fns = [account.showBalance];
console.log('fns[0]() 的结果：', fns[0](), '（this 变成了数组，不是丢成 undefined）');
console.log('对比：Array.isArray(fns) =', Array.isArray(fns));

// 想真正"提取"，要先把它从数组里取出来放到普通变量里
const fromArray = fns[0];
try {
  fromArray();
} catch (err) {
  console.log('从数组取出后再调用报错：', err.constructor.name, '—', err.message);
}

// 当作参数传递，进入函数后就是独立变量，同样丢失绑定
function invoke(fn) {
  return fn();
}
try {
  invoke(account.showBalance);
} catch (err) {
  console.log('当参数传入后被调用报错：', err.constructor.name, '—', err.message);
}

console.log('--- 4. 修复方案一览 ---');

// 方案 A：调用时保持 "点号调用" 的形式
console.log('方案 A（保持点号调用）：', account.showBalance());

// 方案 B：用 bind 显式绑定（详见 04 节）
const boundShow = account.showBalance.bind(account);
console.log('方案 B（bind 绑定）：', boundShow());

// 方案 C：包装一层箭头函数，箭头函数没有自己的 this，会捕获外层的
const wrappedShow = () => account.showBalance();
console.log('方案 C（箭头函数包装）：', wrappedShow());

// 方案 D：把方法定义成箭头函数"字段"，在创建时就固定 this。
// 注意：箭头函数捕获的是**定义处作用域**的 this，而不是"所属对象"，
// 所以在普通对象字面量里写箭头函数是拿不到这个对象的：
const badArrowObj = {
  owner: '赵六',
  balance: 2000,
  // 这里的 this 来自模块顶层（undefined），而不是 badArrowObj 自己
  showBalance: () => `this 是 ${typeof this}`,
};
console.log('方案 D 反例：', badArrowObj.showBalance(), '（对象字面量里的箭头函数拿不到对象自己）');

// 箭头函数字段的正确用武之地是 class 的实例字段（见 15_this_and_context/08）：
class Account {
  owner = '钱七';
  balance = 3000;
  // 箭头函数字段：初始化时 this 就是新实例，之后怎么传递都不会丢
  showBalance = () => `${this.owner} 的余额：${this.balance}`;
}
const acc = new Account();
const detached = acc.showBalance; // 提取出来
console.log('方案 D 在 class 中的正确用法：', detached(), '（提取后依然正常）');

console.log('--- 5. 借用方法：隐式绑定可以"搬运" ---');

// 类数组对象没有数组的方法，但可以借用
const arrayLike = { 0: 'a', 1: 'b', 2: 'c', length: 3 };
const joined = Array.prototype.join.call(arrayLike, '-');
console.log('借用 Array.prototype.join：', joined);

// 借用字符串的方法
const sliced = String.prototype.slice.call('hello world', 0, 5);
console.log('借用 String.prototype.slice：', sliced);

// 借用数组的 slice 把类数组转成真数组
const realArray = Array.prototype.slice.call(arrayLike);
console.log('类数组转真数组：', JSON.stringify(realArray), '| Array.isArray =', Array.isArray(realArray));

console.log('--- 6. 链式调用：靠 return this 串起来 ---');

const chain = {
  steps: [],
  add(step) {
    this.steps.push(step);
    return this; // 返回 this 才能继续点下去
  },
  reset() {
    this.steps = [];
    return this;
  },
  result() {
    return this.steps.join(' → ');
  },
};

console.log('链式调用：', chain.add('打开').add('输入').add('提交').result());
chain.reset().add('重新开始');
console.log('重置后再用：', chain.result());

// 如果中途 this 丢了，链就断了 —— 这也是为什么"提取后调用"很危险
const addStep = chain.add;
try {
  addStep('这一步会失败');
} catch (err) {
  console.log('提取 add 后调用报错：', err.constructor.name, '—', err.message);
}

console.log('--- 7. 方法内部的嵌套函数会重新绑定 this ---');

const nested = {
  label: '外层对象',
  outer() {
    // 这里的 this 是 nested
    const insideNormal = function () {
      // 普通函数的 this 与外层无关，独立调用时是 undefined
      return this;
    };
    const insideArrow = () => {
      // 箭头函数没有自己的 this，直接用外层的（nested）
      return this;
    };
    return {
      outerThisLabel: this.label,
      normalThis: insideNormal(),
      arrowThisLabel: insideArrow().label,
    };
  },
};

const nestedResult = nested.outer();
console.log('外层方法 this.label =', nestedResult.outerThisLabel);
console.log('内层普通函数的 this =', nestedResult.normalThis, '（丢失了）');
console.log('内层箭头函数的 this.label =', nestedResult.arrowThisLabel, '（继承外层）');

console.log('--- 8. 排查清单 ---');

const checklist = [
  '看到 undefined 报错，先看调用形式是不是 "函数名()" 而不是 "obj.函数名()"。',
  '确认方法有没有被赋值给变量、解构、当参数传递或放进数组。',
  '修复优先用 bind 或箭头函数包装，避免到处写 .call(this)。',
  '设计 API 时，若方法需要独立传递，就直接定义成箭头函数字段。',
];
for (const line of checklist) console.log('  •', line);

console.log('\n全部演示完毕。');
