/**
 * ============================================================================
 * 知识点：类装饰器模式（手写版）—— 用函数包装类来"增强"行为
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】高级
 * 【前置知识】14_classes/11_mixins.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "装饰器"指在不修改原类源码的前提下，给它附加额外能力（日志、缓存、
 *    单例、冻结、参数校验等）。本节讲的是**不依赖任何提案语法**的纯函数实现：
 *    写一个函数，接收类，返回一个新的类（或返回被改造过的原类）。
 *
 *    （语言层面的 @decorator 语法仍处于提案阶段，不同环境行为不一致，
 *     本仓库不演示提案语法，只演示其"模式"，这样在任何 Node 版本都能跑。）
 *
 * 2. 为什么需要
 *    - 关注点分离：日志/缓存/权限这些"横切关注点"不该混在业务代码里。
 *    - 可组合：多个装饰器可以像洋葱一样层层叠加，每层只管一件事。
 *    - 可测试：装饰器是纯函数，容易单独验证。
 *
 * 3. 核心语法要点
 *    - 基本形态：unction decorate(Klass) { return class extends Klass { ... } }
 *      —— 返回子类，从而在方法外层插入逻辑（可以调用 super.method()）。
 *    - 两种包装策略：
 *        ① 返回"包装类"（class extends Klass）：适合给方法加前后钩子；
 *        ② 就地改造并返回原类：适合加静态成员、冻结、批量替换方法。
 *      包装类会改变 constructor.name 和 instanceof 的中间层，改动面更大；
 *      就地改造不改变原型链，但会污染原类。
 *    - 装饰器可以带参数：写成一个"返回装饰器"的高阶函数（工厂）。
 *          const withRetry = (times) => (Klass) => class extends Klass {...}
 *    - 方法层面也可以装饰：手写一个包装函数替换 prototype 上的方法。
 *    - 组合顺序：withA(withB(Klass)) 中，A 在最外层，
 *      调用时先进入 A 的"前置"，再进入 B 的"前置"，最后才是原方法。
 *
 * 4. 常见陷阱
 *    - 包装类不能继承原类的私有字段！因为私有字段只对"声明它的类"可见，
 *      包装类属于外部代码，无法访问 Klass 的 #field。
 *      替代方案：就地改造（替换原类原型上的方法）或改用钩子函数。
 *    - 每层包装都会多一层原型，instanceof 原类仍然成立，
 *      但 `obj.constructor.name` 会变成空字符串（匿名类）。
 *    - 装饰器返回的类如果忘写 extends，会丢掉所有原方法。
 *    - 静态成员不会被自动继承到包装类上？—— 实际会（沿类之间原型链），
 *      但包装类上同名静态成员会遮蔽父类的。
 *    - 过度装饰会让调用栈难以阅读，务必保持每层职责单一。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/13_class_decorator_pattern.js
 *
 * 【预期输出】
 *   逐步叠加日志、缓存、计时、冻结等装饰器，并展示组合顺序与私有字段限制。
 * ============================================================================
 */

console.log('--- 1. 最基础的装饰器：给所有方法加日志 ---');

// 装饰器就是一个"类进、类出"的函数。
function withLogging(Klass) {
  // 返回一个继承了 Klass 的匿名子类
  return class extends Klass {
    // 这里只演示思路：真实项目会用 Proxy 或遍历原型方法。
    // 为了简单，我们显式包一个方法。
    greet(...args) {
      console.log('    [日志] 调用 greet，参数：', args);
      // super.greet 调用原类的实现
      const result = super.greet(...args);
      console.log('    [日志] greet 返回：', result);
      return result;
    }
  };
}

class Greeter {
  greet(name) {
    return `你好，${name}`;
  }
  farewell(name) {
    return `再见，${name}`;
  }
}

const LoggedGreeter = withLogging(Greeter);
const logged = new LoggedGreeter();
console.log('调用被装饰后的 greet：');
console.log('  结果：', logged.greet('张三'));
console.log('未被装饰的方法照常工作：', logged.farewell('张三'));
console.log('instanceof 原类仍然成立：', logged instanceof Greeter);
console.log('包装类是匿名类，name 为空：', JSON.stringify(LoggedGreeter.name));

console.log('--- 2. 通用装饰器：批量包装原型上的所有方法 ---');

// 这段是"就地改造"策略：直接替换 Klass.prototype 上的方法，不新建类。
// 好处是不改变原型链、能访问私有字段（在同一作用域内的兄弟方法之间）。
function traceMethods(Klass) {
  // 遍历原型上的自有属性名
  for (const key of Object.getOwnPropertyNames(Klass.prototype)) {
    if (key === 'constructor') continue; // 跳过构造函数
    const descriptor = Object.getOwnPropertyDescriptor(Klass.prototype, key);
    // 只处理方法（函数值），跳过 getter/setter（它们没有 value）
    if (typeof descriptor.value !== 'function') continue;
    if (descriptor.writable === false) continue; // 跳过只读方法

    const original = descriptor.value;
    // 就地替换：保持"不可枚举"这个特性，用 defineProperty 重新定义
    Object.defineProperty(Klass.prototype, key, {
      ...descriptor,
      value: function traced(...args) {
        // this 仍然是调用者（因为这里用的是普通函数）
        console.log(`    [trace] → ${key}(${args.map((v) => JSON.stringify(v)).join(', ')})`);
        const out = original.apply(this, args);
        console.log(`    [trace] ← ${key} 返回 ${JSON.stringify(out)}`);
        return out;
      },
    });
  }
  return Klass; // 就地改造，返回原类
}

class Calculator {
  add(a, b) {
    return a + b;
  }
  multiply(a, b) {
    return a * b;
  }
  get version() {
    return 'v1'; // getter 不会被包装（没有 value）
  }
}

// 注意：就地改造会永久改变 Calculator，之后所有实例都带 trace
const TracedCalculator = traceMethods(Calculator);
console.log('返回的是同一个类吗？', TracedCalculator === Calculator);
const calc = new Calculator();
console.log('调用 add：');
console.log('  结果：', calc.add(2, 3));
console.log('getter 不受影响：', calc.version);

console.log('--- 3. 带参数的装饰器（工厂形式） ---');

// 带参数的装饰器：最外层接收参数，返回真正的装饰器。
function withRetry(times) {
  return function decorate(Klass) {
    return class extends Klass {
      run(...args) {
        let lastError;
        for (let attempt = 1; attempt <= times; attempt += 1) {
          try {
            console.log(`    第 ${attempt} 次尝试`);
            return super.run(...args);
          } catch (err) {
            lastError = err;
            console.log(`    第 ${attempt} 次失败：${err.message}`);
          }
        }
        throw lastError;
      }
    };
  };
}

class FlakyTask {
  #failUntilAttempt = 3;
  #calls = 0;

  run() {
    this.#calls += 1;
    if (this.#calls < this.#failUntilAttempt) {
      throw new Error(`第 ${this.#calls} 次执行失败`);
    }
    return `第 ${this.#calls} 次执行成功`;
  }
}

const RetryingTask = withRetry(5)(FlakyTask);
console.log('带重试的调用：');
console.log('  最终结果：', new RetryingTask().run());

console.log('--- 4. 装饰器组合：顺序很关键 ---');

// 两个"洋葱层"装饰器。为了看出顺序差别，让它们都加在**同一侧**（前面）。
function withTagA(Klass) {
  return class extends Klass {
    describe(...args) {
      return `[A]${super.describe(...args)}`;
    }
  };
}

function withTagB(Klass) {
  return class extends Klass {
    describe(...args) {
      return `[B]${super.describe(...args)}`;
    }
  };
}

class Text {
  describe() {
    return '正文';
  }
}

// 最外层的装饰器先执行，所以它的标记出现在最前面
const AOuterBInner = withTagA(withTagB(Text));
console.log('withTagA(withTagB(Text)) →', new AOuterBInner().describe(), '（A 在外层）');

// 交换顺序，结果就不同了 —— 这证明"包裹顺序"是有语义的
const BOuterAInner = withTagB(withTagA(Text));
console.log('withTagB(withTagA(Text)) →', new BOuterAInner().describe(), '（B 在外层）');
console.log('结论：嵌套写法里"从外到内"书写 —— 最左边的是最外层，越靠右越贴近原类，先被包裹。');

// 洋葱模型：调用时先穿过最外层的"前置"，逐层向内，返回时逐层向外。
function withLayer(name) {
  return (Klass) => class extends Klass {
    describe(...args) {
      console.log(`    → 进入 ${name}`);
      const out = super.describe(...args);
      console.log(`    ← 离开 ${name}`);
      return out;
    }
  };
}

const Layered = withLayer('外层')(withLayer('内层')(Text));
console.log('调用链轨迹：');
console.log('  结果：', new Layered().describe());

console.log('--- 5. 装饰器实现单例 ---');

function singleton(Klass) {
  // 用闭包变量保存唯一实例
  let instance = null;
  // 用一个"代理构造器"类替代原类
  return class extends Klass {
    constructor(...args) {
      if (instance !== null) {
        // 构造函数必须返回对象才能替换 new 的结果；
        // 返回已存在的实例即可实现单例。
        return instance;
      }
      super(...args);
      instance = this;
    }
  };
}

class Config {
  #data = {};
  constructor(name) {
    this.name = name;
    this.#data = { created: '第一次创建' };
  }
  snapshot() {
    return `${this.name} / ${JSON.stringify(this.#data)}`;
  }
}

const SingletonConfig = singleton(Config);
const c1 = new SingletonConfig('配置');
const c2 = new SingletonConfig('另一个名字');
console.log('c1.snapshot() =', c1.snapshot());
console.log('两次 new 是同一实例吗？', c1 === c2);
console.log('第二次传的名字被忽略了：', c2.name);
console.log('私有字段由原类自己的构造函数安装，因此一切正常。');

console.log('--- 6. 装饰器的边界：包装类访问不到原类的私有字段 ---');

class Secret {
  #token = 'secret-token';
  reveal() {
    return this.#token;
  }
}

// 想通过"返回子类"的方式访问 #token 是做不到的：
// 下面这行如果取消注释会直接是语法错误（#token 不在本类体中声明）
//
// function peek(Klass) {
//   return class extends Klass {
//     peekToken() { return this.#token; }  // SyntaxError
//   };
// }
//
// 正确的替代方案 A：就地改造原类的方法（同一类体内，能访问私有字段）
function withRevealCount(Klass) {
  const original = Klass.prototype.reveal;
  Object.defineProperty(Klass.prototype, 'reveal', {
    ...Object.getOwnPropertyDescriptor(Klass.prototype, 'reveal'),
    value: function counted(...args) {
      this.count = (this.count || 0) + 1;
      return original.apply(this, args);
    },
  });
  return Klass;
}

const CountedSecret = withRevealCount(Secret);
const secret = new CountedSecret();
secret.reveal();
secret.reveal();
console.log('reveal 调用次数 =', secret.count);
console.log('私有字段值仍可正常读出：', secret.reveal());

// 替代方案 B：原类主动暴露一个"钩子"或受保护的访问方法，供装饰器调用。

console.log('--- 7. 装饰器实现"冻结"与"只读" ---');

function immutable(Klass) {
  // 冻结原型，防止后续被改；冻结类本身防止加静态成员
  Object.freeze(Klass.prototype);
  Object.freeze(Klass);
  return Klass;
}

const FrozenPoint = immutable(class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  toString() {
    return `Point(${this.x}, ${this.y})`;
  }
});

const fp = new FrozenPoint(1, 2);
console.log('实例仍可正常创建与使用：', String(fp));
// 原型被冻结后不能再加方法（类体默认严格模式，静默失败会变成抛错）
try {
  FrozenPoint.prototype.newMethod = function newMethod() {};
} catch (err) {
  console.log('往冻结的原型上加方法报错：', err.constructor.name, '—', err.message);
}
console.log('新方法加上了吗？', typeof FrozenPoint.prototype.newMethod);

console.log('--- 8. 一个可复用的通用工具：compose 组合器 ---');

// 把多个装饰器合并成一个，方便一次性应用。
// reduce 的语义：**先列出的先被应用到原类上（最内层）**，
// 也就是 compose(A, B) === B(A(Klass))，与嵌套写法的阅读顺序刚好相反。
function compose(...decorators) {
  return (Klass) => decorators.reduce((acc, decorator) => decorator(acc), Klass);
}

class Report {
  describe() {
    return '报表内容';
  }
}

// compose 里第一个 withTagB 最贴近原类，withTagA 在外层 → [A][B]
const ComposedReport = compose(withTagB, withTagA)(Report);
console.log('compose(withTagB, withTagA) →', new ComposedReport().describe());
console.log(
  '等价于嵌套写法 withTagA(withTagB(Report)) →',
  new (withTagA(withTagB(Report)))().describe(),
);

// 反过来写，最外层的标记就变了
const ReversedReport = compose(withTagA, withTagB)(Report);
console.log('compose(withTagA, withTagB) →', new ReversedReport().describe());

console.log('\n全部演示完毕。');
