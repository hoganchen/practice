/**
 * ============================================================================
 * 知识点：apply / construct 陷阱 —— 拦截函数调用与 new 调用
 * ============================================================================
 *
 * 【所属分类】25_proxy_and_reflect —— 元编程：拦截对象的基本操作
 * 【难度等级】进阶
 * 【前置知识】25_proxy_and_reflect/02_get_set_traps.js 与 06_functions/ 中的 call/apply/bind
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    函数对象有两种独有的操作：**被调用**和**被 new**。Proxy 为它们准备了两类陷阱：
 *      - apply(target, thisArg, argsList)          拦截 fn(...)、fn.call(...)、fn.apply(...)
 *      - construct(target, argsList, newTarget)    拦截 new fn(...)，必须返回一个对象
 *    注意：只有 target 本身是函数时，Proxy 才具备 [[Call]] / [[Construct]]，
 *    才可能触发这两个陷阱。
 *
 * 2. 为什么需要
 *    - apply：做记忆化（缓存计算结果）、参数校验与默认值、调用日志与耗时统计、
 *      自动柯里化、绑定 this、做"限流/防抖"的包装。
 *    - construct：控制实例创建（单例、对象池）、给构造函数补默认参数、
 *      让一个普通函数表现得像一个类、拦截 new 并返回代用对象（"工厂代理"）。
 *    这两个陷阱是 AOP（面向切面编程）在 JS 里最轻量的实现方式。
 *
 * 3. 核心语法要点
 *    - apply 的三个参数：目标函数、调用时的 this、实参数组。
 *      陷阱里用 Reflect.apply(target, thisArg, argsList) 完成默认行为。
 *    - construct 的三个参数：目标构造函数、实参数组、newTarget
 *      （newTarget 是"最初被 new 的那个构造函数"，用于 new.target 判断，
 *        也用于 Reflect.construct 保留正确的原型）。
 *    - construct 陷阱**必须返回一个对象**，返回原始值会抛 TypeError。
 *    - Reflect.construct(Ctor, args, newTarget) 可以指定新对象的原型来自 newTarget。
 *    - 判断一个代理是否可被 new：只有 target 是构造函数（有 [[Construct]]）才行，
 *      箭头函数、对象方法、简写方法都不能被 new。
 *
 * 4. 常见陷阱
 *    - 忘记在 apply 陷阱里返回结果，调用方拿到的是 undefined。
 *    - apply 陷阱里用 target(...) 直接调用会丢失 this，必须用 Reflect.apply。
 *    - construct 陷阱里返回 null 或原始值 => TypeError: constructor returned non-object。
 *    - 代理函数之后，fn.length / fn.name 默认仍是原函数的（走 get 陷阱转发），
 *      但有些库依赖 Function.prototype.toString 看到源码，代理后拿到的是 native code。
 *    - 记忆化的缓存键设计不好会导致内存泄漏（长生命周期缓存），要做容量上限。
 *    - 代理会破坏"函数身份"：同一个函数代理两次得到两个不同的对象，
 *      用 Set/Map 做去重、用 === 比较时要小心。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 25_proxy_and_reflect/04_apply_construct_traps.js
 *
 * 【预期输出】
 *   打印 apply/construct 陷阱的触发与参数，以及记忆化、单例等实战效果。
 * ============================================================================
 */

console.log('--- 1. apply 陷阱：拦截函数调用 ---');

function greet(name, punctuation) {
  return `你好，${name}${punctuation}`;
}

const callLogged = new Proxy(greet, {
  /**
   * @param {Function} tgt    目标函数
   * @param {*} thisArg       调用时的 this
   * @param {Array} argsList  实参数组（是真正的数组）
   * @param {object} _proxy   被调用的代理本身（第四个参数，通常用不到）
   */
  apply(tgt, thisArg, argsList) {
    console.log(`  [apply] 收到 ${argsList.length} 个参数：${JSON.stringify(argsList)}`);
    console.log(`  [apply] thisArg = ${thisArg === undefined ? 'undefined' : typeof thisArg}`);
    // 用 Reflect.apply 完成真正的调用，才能正确传递 this。
    const result = Reflect.apply(tgt, thisArg, argsList);
    console.log(`  [apply] 返回值 = ${JSON.stringify(result)}`);
    return result;
  },
});

console.log('直接调用：');
console.log('  结果 =', callLogged('张三', '！'));

console.log('用 .call 调用（thisArg 会被传进陷阱）：');
const ctx = { tag: 'ctx' };
console.log('  结果 =', callLogged.call(ctx, '李四', '。'));

console.log('用 .apply 调用：');
console.log('  结果 =', callLogged.apply(null, ['王五', '？']));

console.log('展开运算符调用也算普通调用：');
const args = ['赵六', '~'];
console.log('  结果 =', callLogged(...args));

console.log('--- 2. 实战：记忆化（memoize） ---');

// 没有缓存的斐波那契：指数级复杂度。
function slowFib(n) {
  return n < 2 ? n : slowFib(n - 1) + slowFib(n - 2);
}

let rawCalls = 0;
function countedFib(n) {
  rawCalls += 1;
  return n < 2 ? n : countedFib(n - 1) + countedFib(n - 2);
}

console.log('无缓存计算 fib(20)，内部被调用次数统计中……');
const rawResult = countedFib(20);
console.log('  结果 =', rawResult, ', 函数体执行次数 =', rawCalls);

// 用 Proxy 包一层缓存，函数体本身完全不用改。
// 关键点：让"递归调用"也走代理，否则只能缓存最外层那一次。
// 技巧是用一个外层的可变绑定 cachedFib 来指向代理，函数体里通过它递归。
let cachedFib; // 稍后指向代理

// 这就是纯粹的、没有任何缓存逻辑的原始实现。
function rawFib(n) {
  return n < 2 ? n : cachedFib(n - 1) + cachedFib(n - 2);
}

// 缓存与统计放在代理外面，函数体内完全无感。
const fibCache = new Map();
let cacheHits = 0;

const memoFib = new Proxy(rawFib, {
  apply(tgt, thisArg, argsList) {
    const key = argsList[0]; // 单参数函数，直接拿参数当键
    if (fibCache.has(key)) {
      cacheHits += 1;
      return fibCache.get(key);
    }
    const value = Reflect.apply(tgt, thisArg, argsList);
    fibCache.set(key, value);
    return value;
  },
});

// 把递归入口接到代理上。
cachedFib = memoFib;

const t0 = Date.now();
const memoResult = memoFib(20);
const t1 = Date.now();
console.log('带缓存计算 fib(20) =', memoResult, ', 耗时 =', t1 - t0, 'ms');
console.log('  对比：无缓存版本函数体执行了', rawCalls, '次；带缓存版本只执行了', fibCache.size, '次（每个 n 一次）');
console.log('  缓存命中次数 =', cacheHits, ', 缓存条目数 =', fibCache.size);
console.log('  再算一次 fib(19)（已全部在缓存里）=');
const before = cacheHits;
memoFib(19);
console.log('    本次新增命中 =', cacheHits - before, '（递归子问题都已缓存，几乎零成本）');
console.log('  -> 函数体一行没改，只在外面套了一层代理就获得了缓存能力');

console.log('--- 3. 实战：参数校验与默认值 ---');

function createUser(name, age, role) {
  return { name, age, role };
}

const validatedCreateUser = new Proxy(createUser, {
  apply(tgt, thisArg, argsList) {
    // 复制一份再修改，避免污染调用方传进来的数组（虽然引擎每次都会新建）。
    const args = [...argsList];
    // 补默认值。
    if (args[1] === undefined) args[1] = 18;
    if (args[2] === undefined) args[2] = 'user';
    // 做校验，不合格就抛错。
    if (typeof args[0] !== 'string' || args[0].trim() === '') {
      throw new TypeError('name 必须是非空字符串');
    }
    if (!Number.isInteger(args[1]) || args[1] < 0) {
      throw new TypeError('age 必须是自然数');
    }
    return Reflect.apply(tgt, thisArg, args);
  },
});

console.log('只传 name =', JSON.stringify(validatedCreateUser('张三')));
console.log('传全参   =', JSON.stringify(validatedCreateUser('李四', 30, 'admin')));

try {
  validatedCreateUser('');
} catch (err) {
  console.log('参数非法：', err.constructor.name, '-', err.message);
}
try {
  validatedCreateUser('王五', -1);
} catch (err) {
  console.log('参数非法：', err.constructor.name, '-', err.message);
}

console.log('--- 4. 实战：调用日志与耗时统计 ---');

function heavyWork(iterations) {
  let sum = 0;
  for (let i = 0; i < iterations; i += 1) sum += i;
  return sum;
}

const profiled = new Proxy(heavyWork, {
  apply(tgt, thisArg, argsList) {
    const start = process.hrtime.bigint(); // 高精度计时，单位纳秒（BigInt）
    try {
      const result = Reflect.apply(tgt, thisArg, argsList);
      return result;
    } finally {
      // 用 finally 保证即使抛错也记录耗时。
      const costNs = Number(process.hrtime.bigint() - start);
      console.log(
        `  [profile] heavyWork(${argsList.join(',')}) 耗时 ${costNs} ns ` +
          `(约 ${(costNs / 1e6).toFixed(3)} ms)`,
      );
    }
  },
});

console.log('结果 =', profiled(1_000_000));

console.log('--- 5. construct 陷阱：拦截 new ---');

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

const PointProxy = new Proxy(Point, {
  /**
   * @param {Function} tgt       目标构造函数
   * @param {Array} argsList     传给 new 的实参
   * @param {Function} newTarget 最初被 new 的那个构造函数（这里是 PointProxy）
   */
  construct(tgt, argsList, newTarget) {
    console.log(`  [construct] 参数 = ${JSON.stringify(argsList)}`);
    console.log(`  [construct] newTarget === 代理本身吗？${newTarget === PointProxy}`);
    // Reflect.construct 会以 newTarget.prototype 作为新对象的原型。
    const instance = Reflect.construct(tgt, argsList, newTarget);
    console.log('  [construct] 实例已创建');
    return instance;
  },
  apply(tgt, thisArg, argsList) {
    // 希望"不用 new 也能创建"，就在 apply 里手动转成 construct。
    console.log('  [apply] 检测到直接调用，自动改写为 new');
    return Reflect.construct(tgt, argsList, tgt);
  },
});

const p = new PointProxy(1, 2);
console.log('new 出来的实例 =', String(p));
console.log('  p instanceof Point =', p instanceof Point, ', p instanceof PointProxy =', p instanceof PointProxy);

console.log('--- 6. construct 的返回值约束 ---');

// construct 陷阱必须返回对象，否则抛 TypeError。
const badConstructor = new Proxy(Point, {
  construct() {
    return 42; // 原始值，非法
  },
});
try {
  new badConstructor(1, 2);
} catch (err) {
  console.log('返回原始值：', err.constructor.name, '-', err.message);
}

const nullConstructor = new Proxy(Point, {
  construct() {
    return null; // null 也不行
  },
});
try {
  new nullConstructor(1, 2);
} catch (err) {
  console.log('返回 null：', err.constructor.name, '-', err.message);
}

// 返回一个完全不同的对象是允许的 —— new 的结果就是你返回的对象。
const swapConstructor = new Proxy(Point, {
  construct() {
    return { x: 0, y: 0, note: '被换成别的对象了' };
  },
});
console.log('返回自定义对象 =', JSON.stringify(new swapConstructor(9, 9)));

console.log('--- 7. 实战：单例模式的构造拦截 ---');

function makeSingleton(Ctor) {
  let instance = null;
  const proxy = new Proxy(Ctor, {
    construct(tgt, argsList, newTarget) {
      if (instance) {
        console.log('  [singleton] 已存在实例，直接复用');
        return instance;
      }
      console.log('  [singleton] 首次创建实例');
      instance = Reflect.construct(tgt, argsList, newTarget);
      return instance;
    },
  });
  // 提供一个 reset 便于演示（真实项目通常不需要）。
  proxy.reset = () => {
    instance = null;
  };
  return proxy;
}

class Database {
  constructor(url) {
    this.url = url;
    this.connectedAt = 'now';
  }
}

const SingletonDB = makeSingleton(Database);
const db1 = new SingletonDB('db://a');
const db2 = new SingletonDB('db://b');
console.log('两次 new 是同一个对象吗？', db1 === db2, ', url =', db2.url, '（第二次的参数被忽略）');
SingletonDB.reset();
const db3 = new SingletonDB('db://c');
console.log('reset 之后重新创建 =', db3.url, ', 与 db1 相同吗？', db3 === db1);

console.log('--- 8. 实战：给构造函数补默认参数 ---');

class Config {
  constructor(options) {
    this.options = options;
  }
  describe() {
    return JSON.stringify(this.options);
  }
}

const withDefaults = new Proxy(Config, {
  construct(tgt, argsList, newTarget) {
    // 把用户传的对象和默认值合并后，再交给真正的构造函数。
    const defaults = { debug: false, timeout: 3000, retries: 2 };
    const merged = { ...defaults, ...(argsList[0] ?? {}) };
    return Reflect.construct(tgt, [merged], newTarget);
  },
});

console.log('全默认  =', new withDefaults().describe());
console.log('覆盖一项=', new withDefaults({ debug: true }).describe());
console.log('  -> 使用方完全看不到这层默认值的实现，构造函数的代码也保持干净');

console.log('--- 9. 只有构造函数才能被 new 代理 ---');

// 箭头函数没有 [[Construct]]，代理后也不能被 new，此时陷阱根本不会被触发。
const arrowProxy = new Proxy(() => 1, {
  construct() {
    console.log('  这一行不会被打印：引擎在进入陷阱前就拒绝了');
    return {};
  },
});
try {
  new arrowProxy();
} catch (err) {
  console.log('new 一个箭头函数代理：', err.constructor.name, '-', err.message);
}

// 对象里的简写方法同样不是构造函数。
const obj = {
  method() {
    return 1;
  },
};
const methodProxy = new Proxy(obj.method, {});
try {
  new methodProxy();
} catch (err) {
  console.log('new 一个方法代理：', err.constructor.name, '-', err.message);
}
console.log('  -> Proxy 的 [[Construct]] 存在与否，完全取决于 target 有没有 [[Construct]]');

console.log('--- 10. 代理后函数的"身份"信息 ---');

function originalFn(a, b) {
  return a + b;
}
const identified = new Proxy(originalFn, {});

// name / length 走 get 陷阱转发，仍然能看到原信息。
console.log('identified.name =', identified.name);
console.log('identified.length =', identified.length);

// 但 Function.prototype.toString 对代理返回的是 native code，看不到源码。
console.log('原始 toString =', Function.prototype.toString.call(originalFn).replace(/\n\s*/g, ' ').slice(0, 40) + '...');
console.log('代理 toString =', Function.prototype.toString.call(identified));

// 函数身份：代理与原函数不相等，两次代理也不相等。
console.log('代理 === 原函数 ?', identified === originalFn, '（不相等，是两个不同的对象）');
console.log('同一个函数代理两次相等吗？', new Proxy(heavyWork, {}) === new Proxy(heavyWork, {}));
console.log('  -> 依赖 === 或 Set/Map 做函数去重的代码，在引入代理后要重新审视');

console.log('\n全部演示完毕。');
