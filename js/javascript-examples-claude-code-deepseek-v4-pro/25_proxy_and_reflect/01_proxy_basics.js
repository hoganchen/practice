/**
 * ============================================================================
 * 知识点：Proxy 基础 —— new Proxy(target, handler) 与最基本的 get / set 拦截
 * ============================================================================
 *
 * 【所属分类】25_proxy_and_reflect —— 元编程：拦截对象的基本操作
 * 【难度等级】进阶
 * 【前置知识】09_objects/ 中的属性描述符与属性访问机制
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Proxy 是 ES2015 引入的"代理"对象。它把一个**目标对象（target）**包起来，
 *    在这层包装上放一个**处理器（handler）**，处理器里可以定义一系列**陷阱（trap）**。
 *    之后所有对代理对象的操作（读属性、写属性、判断属性是否存在、遍历键……）
 *    都会先撞进对应的陷阱函数，由你决定"是转发给目标对象，还是做点别的"。
 *
 *    一句话：Proxy 让 JS 里"访问一个属性"这种最基本的动作变得可以编程。
 *
 * 2. 为什么需要
 *    在 Proxy 之前，想拦截属性读写只能靠 Object.defineProperty 重定义属性，
 *    它有几个明显短板：
 *      - 要为每个属性单独定义，新增属性拦不住；
 *      - 拦不住 delete、in、Object.keys、for...in；
 *      - 拦不住函数调用与 new（可以靠重写函数，但很别扭）。
 *    Proxy 一次性解决了全部问题，它是 Vue 3 响应式、MobX、
 *    各种校验库/ORM/测试 mock 框架的底层基石。
 *
 * 3. 核心语法要点
 *    - const p = new Proxy(target, handler)
 *        target ：被代理的对象（可以是普通对象、数组、函数、类……）
 *        handler：对象，属性名就是陷阱名（get、set、has、deleteProperty……）
 *    - 陷阱名与"对象内部方法"一一对应（见第 6 节列表）。
 *    - 陷阱不存在时，操作会**原样转发**给 target，这叫做"默认行为"。
 *    - 陷阱函数里通常用 Reflect 上的同名方法来完成默认行为（下一个文件详讲）。
 *    - Proxy.revocable(target, handler) 可以创建"可撤销"的代理。
 *    - Proxy 是**不可检测**的：没有任何内置方式能判断一个对象是不是代理。
 *
 * 4. 常见陷阱
 *    - Proxy 不改变 target，只是提供了一个"入口"。直接操作 target 会绕过全部拦截。
 *    - proxy !== target（它们是两个不同的对象），但 typeof 结果与 target 一致。
 *    - 代理一个对象的操作**不会**自动代理它内部嵌套的对象（浅代理）。
 *    - 陷阱函数的 this 不是 target，而是 handler —— 所以要用箭头函数或显式绑定。
 *    - 陷阱必须遵守**不变量（invariant）**：比如目标对象不可写不可配置的属性，
 *      陷阱不能报告一个不同的值，否则会抛 TypeError（见第 8 节）。
 *    - 某些操作在引擎内部不走 Proxy 陷阱（如 Array.isArray），造成"透明性漏洞"。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 25_proxy_and_reflect/01_proxy_basics.js
 *
 * 【预期输出】
 *   打印 handler 为空时的"透传"行为，以及 get/set 陷阱的实际拦截日志。
 * ============================================================================
 */

console.log('--- 1. 没有陷阱的 Proxy：完全透传 ---');

const target = { name: '张三', age: 18 };

// handler 是空对象 => 任何一个陷阱都不存在 => 所有操作原样转发给 target。
// 这样的代理和 target 在使用上几乎没有区别。
const transparent = new Proxy(target, {});

console.log('transparent.name =', transparent.name);
transparent.age = 20;
console.log('写入后 target.age =', target.age, '（改动落到 target 上）');
console.log('transparent === target ?', transparent === target, '（是两个不同的对象）');
console.log('typeof transparent =', typeof transparent, '（与 target 一样是 object）');

// 但 target 与 proxy 共享同一份数据：从 proxy 读到的一定是 target 上的值。
target.name = '李四';
console.log('改 target 后 transparent.name =', transparent.name);

console.log('--- 2. 第一个真正的陷阱：get ---');

const withLog = new Proxy(target, {
  /**
   * get 陷阱：每次读属性都会调用。
   * @param {object} tgt   被代理的目标对象（这里的 tgt 就是 target）
   * @param {string|symbol} key 被读取的属性名
   * @param {object} receiver 代理对象本身（通常就是 withLog）
   * @returns {*} 返回什么，表达式就得到什么
   */
  get(tgt, key, receiver) {
    console.log(`  [get] 读取属性 "${String(key)}"`);
    // 必须自己把值取出来返回，否则结果永远是 undefined。
    return tgt[key];
  },
});

// 注意：每次读属性都会打印一行日志。
console.log('withLog.name =', withLog.name);
console.log('withLog.age =', withLog.age);

// 读一个不存在的属性也会进陷阱。
console.log('withLog.notExist =', withLog.notExist);

console.log('--- 3. set 陷阱：写属性也会被拦 ---');

const withSetGuard = new Proxy(
  { count: 0 },
  {
    /**
     * set 陷阱：每次写属性都会调用。
     * @param {object} tgt   目标对象
     * @param {string|symbol} key 属性名
     * @param {*} value      要写入的值
     * @param {object} receiver 代理对象本身
     * @returns {boolean} 必须返回 true，否则严格模式下会抛 TypeError
     */
    set(tgt, key, value, receiver) {
      console.log(`  [set] 写入 "${String(key)}" = ${JSON.stringify(value)}`);
      tgt[key] = value; // 完成默认行为
      return true; // 声明"写入成功"
    },
  },
);

withSetGuard.count = 1;
withSetGuard.newField = 'hello';
console.log('写入后的对象 =', JSON.stringify(withSetGuard));

// 陷阱里不转发就是"拦截"：写入被悄悄丢弃。
const readonly = new Proxy(
  { secret: 'abc' },
  {
    set() {
      console.log('  [set] 拒绝写入（只读代理）');
      return true; // 返回 true 表示"成功"，但实际什么也没做
    },
  },
);
readonly.secret = 'hacked';
console.log('只读代理的 secret 仍然是 =', readonly.secret);

console.log('--- 4. 一次完整的拦截记录：既有 get 也有 set ---');

const history = [];

const tracked = new Proxy(
  { score: 100, level: 3 },
  {
    get(tgt, key) {
      // symbol 类型的键（如 Symbol.toPrimitive）也走 get 陷阱，日志里要转成字符串。
      history.push({ op: 'get', key: String(key) });
      return tgt[key];
    },
    set(tgt, key, value) {
      history.push({ op: 'set', key: String(key), value });
      tgt[key] = value;
      return true;
    },
  },
);

// 下面每一行都会产生一条记录。
const total = tracked.score + tracked.level;
tracked.bonus = total;
tracked.level = 4;

console.log('操作记录：');
for (const h of history) {
  console.log('  ', JSON.stringify(h));
}

console.log('--- 5. 陷阱里可以完全改写语义 ---');

// 这是一个"假的"对象：它的属性值是现算出来的，target 上根本没有这些字段。
const computed = new Proxy(
  {},
  {
    get(_tgt, key) {
      // 把任意属性名当作数学函数名，返回一个可调用的函数。
      if (key === 'double') return (x) => x * 2;
      if (key === 'square') return (x) => x ** 2;
      // 未定义的属性返回一个提示字符串，而不是 undefined。
      return `不存在的属性：${String(key)}`;
    },
    has() {
      // 让 in 运算符永远返回 true —— 这样连不存在的属性都"看起来存在"。
      return true;
    },
  },
);

console.log('computed.double(21) =', computed.double(21));
console.log('computed.square(7) =', computed.square(7));
console.log('computed.whatever =', computed.whatever);
console.log('"随便什么" in computed =', '随便什么' in computed, '（has 陷阱永远返回 true）');
console.log('  -> 但 Object.keys(computed) 仍是空数组，因为没定义 ownKeys 陷阱');

console.log('--- 6. Proxy 能拦截的全部操作一览 ---');

// 这些陷阱名与对象的"内部方法"一一对应，本目录后续文件会逐个展开。
const trapList = [
  ['get', '读属性：obj.key、obj[key]、解构、展开'],
  ['set', '写属性：obj.key = v'],
  ['has', 'in 运算符：key in obj'],
  ['deleteProperty', 'delete obj.key'],
  ['ownKeys', 'Object.keys / Object.getOwnPropertyNames / for...in / 展开'],
  ['getOwnPropertyDescriptor', 'Object.getOwnPropertyDescriptor / for...in 的枚举判定'],
  ['defineProperty', 'Object.defineProperty'],
  ['preventExtensions', 'Object.preventExtensions'],
  ['isExtensible', 'Object.isExtensible'],
  ['getPrototypeOf', 'Object.getPrototypeOf / instanceof'],
  ['setPrototypeOf', 'Object.setPrototypeOf'],
  ['apply', '函数调用：fn()、fn.call()、fn.apply()'],
  ['construct', 'new fn()'],
];

console.log('共', trapList.length, '个陷阱：');
for (const [name, desc] of trapList) {
  console.log(`  ${name.padEnd(26)} ${desc}`);
}

console.log('--- 7. 代理函数与类 ---');

// 代理函数的写法完全一样，只是 target 是个函数。
function greet(name) {
  return `你好，${name}`;
}

const fnProxy = new Proxy(greet, {
  get(tgt, key) {
    // 读取函数自身的属性（如 name、length）也走 get 陷阱。
    console.log(`  [get] 函数属性 "${String(key)}"`);
    return tgt[key];
  },
});
console.log('fnProxy.name =', fnProxy.name);
console.log('typeof fnProxy =', typeof fnProxy, '（仍是 function）');

// 代理一个类同样可行：类是函数，实例化会走 construct 陷阱（见 04）。
class Counter {
  constructor(start) {
    this.value = start;
  }
}
const CounterProxy = new Proxy(Counter, {});
const c = new CounterProxy(5);
console.log('代理类构造出的实例 =', JSON.stringify(c), ', c instanceof Counter =', c instanceof Counter);

console.log('--- 8. 不变量（invariant）：陷阱不能胡来 ---');

// 不可写且不可配置的属性，get 陷阱必须返回它原本的值，否则抛 TypeError。
const frozen = {};
Object.defineProperty(frozen, 'locked', {
  value: 'original',
  writable: false,
  configurable: false,
  enumerable: true,
});

const liar = new Proxy(frozen, {
  get() {
    return '我偏要给你别的值'; // 违反不变量
  },
});

try {
  console.log(liar.locked);
} catch (err) {
  console.log('违反不变量：', err.constructor.name, '-', err.message);
}

// 正确做法是老老实实反映目标对象的真实状态。
const honest = new Proxy(frozen, {
  get(tgt, key) {
    return tgt[key];
  },
});
console.log('诚实代理读到 =', honest.locked);

console.log('--- 9. 可撤销代理 Proxy.revocable ---');

// revocable 返回 { proxy, revoke }，调用 revoke 之后代理彻底失效。
const { proxy: tempProxy, revoke } = Proxy.revocable({ data: '临时数据' }, {});
console.log('撤销前 tempProxy.data =', tempProxy.data);

revoke(); // 撤销

try {
  console.log(tempProxy.data);
} catch (err) {
  console.log('撤销后访问：', err.constructor.name, '-', err.message);
}
console.log('  -> 这是"临时授权"场景的天然实现：用完即废，无法再次访问');

console.log('--- 10. 代理是浅层的，而且无法被检测 ---');

const nested = { inner: { value: 1 } };
const shallowProxy = new Proxy(nested, {
  get(tgt, key) {
    console.log(`  [get] ${String(key)}`);
    return tgt[key];
  },
});

// 只有访问 proxy 自身的属性才会触发陷阱。
console.log('访问 shallowProxy.inner.value：');
console.log('  结果 =', shallowProxy.inner.value);
console.log('  -> 只有 "inner" 这一层进了陷阱，".value" 是直接读原始对象的，完全没被拦');

// 没有任何内置手段能识别出代理。
console.log('Object.prototype.toString.call(proxy) =', Object.prototype.toString.call(shallowProxy));
console.log('Object.keys(proxy) =', JSON.stringify(Object.keys(shallowProxy)));
console.log('  -> 看起来和普通对象一模一样，所以库作者很难判断"这个对象已被代理过"');

console.log('--- 11. 绕过代理：直接操作 target ---');

const data = { count: 0 };
const guarded = new Proxy(data, {
  set(tgt, key, value) {
    console.log('  [set] 被拦截');
    tgt[key] = value;
    return true;
  },
});

guarded.count = 1; // 走代理，会打印日志
data.count = 2; // 直接改 target，完全绕过代理
console.log('绕过代理后 guarded.count =', guarded.count, '（陷阱看不到这次改动）');
console.log('  -> 想要真正封闭，代理创建后就不应该再暴露 target 的引用');

console.log('\n全部演示完毕。');
