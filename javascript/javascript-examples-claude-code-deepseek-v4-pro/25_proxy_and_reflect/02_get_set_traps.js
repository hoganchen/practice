/**
 * ============================================================================
 * 知识点：get / set 陷阱详解 —— 参数含义、receiver 与 Reflect 的配合
 * ============================================================================
 *
 * 【所属分类】25_proxy_and_reflect —— 元编程：拦截对象的基本操作
 * 【难度等级】进阶
 * 【前置知识】25_proxy_and_reflect/01_proxy_basics.js，以及 09_objects 中的 getter/setter
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    get 与 set 是 Proxy 里最常用的两个陷阱，分别拦截"读属性"与"写属性"。
 *    它们的签名是：
 *      get(target, key, receiver)          -> 返回被读取的值
 *      set(target, key, value, receiver)   -> 返回布尔值，表示写入是否成功
 *    其中第三个参数 receiver 是最容易被忽略、也最关键的一个：
 *    它表示"这次操作到底作用在谁身上"，通常是**代理对象本身**，
 *    但在原型链继承的场景里可能是"继承者对象"。
 *
 * 2. 为什么需要
 *    - 读：要给不存在的属性提供默认值、要做访问日志、要做惰性求值（缓存）、
 *      要做响应式依赖收集（Vue 3 的 reactive 就是 get 陷阱里 track、set 陷阱里 trigger）。
 *    - 写：要做类型校验、只读保护、写日志、自动触发更新。
 *    这两件事是几乎所有"框架级魔法"的起点。
 *
 * 3. 核心语法要点
 *    - get 陷阱里必须**自己返回**目标值，不返回就是 undefined。
 *    - set 陷阱里必须**返回 true**，表示写入成功；返回 false 在严格模式下
 *      （ESM 默认严格模式）会让赋值语句抛 TypeError。
 *    - 默认行为的两种写法：
 *        tgt[key] = value;          // 简单，但会丢掉 receiver
 *        Reflect.set(tgt, key, value, receiver);  // 完整语义，保留 receiver
 *      读方向同理：tgt[key] vs Reflect.get(tgt, key, receiver)。
 *    - symbol 类型的键也会进陷阱（Symbol.toPrimitive、Symbol.iterator 等），
 *      日志里要转成字符串，否则字符串拼接会抛错。
 *    - 代理可以放在原型链上：const child = Object.create(proxy)，
 *      此时访问 child.x 会触发 proxy 的陷阱，且 receiver 是 child。
 *
 * 4. 常见陷阱
 *    - 忘记 return true，导致所有赋值在严格模式下抛 TypeError。
 *    - 用 tgt[key] = value 代替 Reflect.set 时，如果属性其实是原型上的 setter，
 *      setter 里的 this 会变成 target 而不是代理，后续读属性就会绕过代理 ——
 *      这正是"响应式对象里嵌套读取失效"的经典原因。
 *    - get 陷阱返回函数时，函数里的 this 也需要注意绑定。
 *    - 代理数组时要注意：length、Symbol.iterator 都是普通属性访问，同样会进陷阱，
 *      写日志时会被刷屏。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 25_proxy_and_reflect/02_get_set_traps.js
 *
 * 【预期输出】
 *   打印 get/set 陷阱的参数、receiver 的影响，以及 Reflect 与直接赋值的差异。
 * ============================================================================
 */

console.log('--- 1. get 陷阱的完整参数 ---');

const target = { name: '张三', nested: { deep: 1 } };

const inspected = new Proxy(target, {
  get(tgt, key, receiver) {
    console.log(
      `  [get] key=${String(key)}(${typeof key}) | target 是原对象吗？${tgt === target} ` +
        `| receiver 是代理吗？${receiver === inspected}`,
    );
    return tgt[key];
  },
});

const _ = inspected.name;
const __ = inspected.nested;

// 用 Reflect.get 可以把 receiver 一并传下去，语义与"没有代理时"完全一致。
const withReflect = new Proxy(target, {
  get(tgt, key, receiver) {
    return Reflect.get(tgt, key, receiver);
  },
});
console.log('Reflect 版本读取 =', withReflect.name);

console.log('--- 2. get 陷阱的返回值就是表达式的值 ---');

// 陷阱可以返回任何东西，甚至可以每次都不一样（不推荐）。
let counter = 0;
const dynamic = new Proxy(
  {},
  {
    get(_tgt, key) {
      counter += 1;
      return `${String(key)}-${counter}`;
    },
  },
);
console.log('第一次 dynamic.x =', dynamic.x);
console.log('第二次 dynamic.x =', dynamic.x, '（每次都进陷阱，值不同）');

// 常见用法：给不存在的属性提供默认值（"默认值对象"）。
const withDefault = new Proxy(
  { a: 1, b: 2 },
  {
    get(tgt, key) {
      // 用 Reflect.has 判断属性是否存在（包括原型链上的）。
      if (Reflect.has(tgt, key)) return Reflect.get(tgt, key);
      return 0; // 不存在就返回默认值 0
    },
  },
);
console.log('withDefault.a =', withDefault.a);
console.log('withDefault.c =', withDefault.c, '（默认值）');
console.log('Object.keys 仍然只列出真实存在的键 =', JSON.stringify(Object.keys(withDefault)));

console.log('--- 3. symbol 键也会进陷阱 ---');

const symProxy = new Proxy({ x: 1 }, {
  get(tgt, key, receiver) {
    // key 可能是 symbol，直接拼进字符串会抛 TypeError，必须先转成字符串。
    console.log(`  [get] 键类型 = ${typeof key}，键 = ${String(key)}`);
    return Reflect.get(tgt, key, receiver);
  },
});

// Symbol.toPrimitive 只在"把对象当原始值用"时才会被引擎读取。
console.log('String(symProxy) 的结果：');
console.log('  ', String(symProxy));
console.log('  -> 上面那行日志里的 Symbol(Symbol.toPrimitive) 就是引擎在找转换方法');

console.log('--- 4. set 陷阱的完整参数与返回值约定 ---');

const store = { count: 0 };

const storeProxy = new Proxy(store, {
  set(tgt, key, value, receiver) {
    console.log(
      `  [set] key=${String(key)} | value=${JSON.stringify(value)}(${typeof value}) ` +
        `| receiver 是代理吗？${receiver === storeProxy}`,
    );
    return Reflect.set(tgt, key, value, receiver);
  },
});

storeProxy.count = 1;
storeProxy.label = 'hello';
console.log('目标对象现在的样子 =', JSON.stringify(store));

// 返回 false 意味着"写入失败"。在严格模式下（ESM 天生严格），
// 这会让赋值语句直接抛 TypeError，而不是静默失败。
const rejecting = new Proxy(
  {},
  {
    set() {
      return false; // 声明失败
    },
  },
);

try {
  rejecting.anything = 1;
} catch (err) {
  console.log('set 返回 false：', err.constructor.name, '-', err.message);
}
console.log('  -> 想"静默丢弃"写入就返回 true 但不真正赋值（见 05 的只读代理）');

console.log('--- 5. receiver 的真正作用：原型链上的 getter ---');

// 准备一个原型，上面有一个依赖 this 的 getter。
const proto = {
  get full() {
    // 这里的 this 是谁，取决于 receiver 是谁。
    return `${this.first} ${this.last}`;
  },
};

// 目标对象通过原型链继承这个 getter。
const person = Object.create(proto);
person.first = 'San';
person.last = 'Zhang';

// 版本 A：陷阱里用 tgt[key]，丢失 receiver。
const proxyA = new Proxy(person, {
  get(tgt, key) {
    console.log(`  [A.get] ${String(key)}`);
    return tgt[key]; // 等价于 Reflect.get(tgt, key)，receiver 默认为 tgt
  },
});
console.log('proxyA.full =', proxyA.full);
console.log('  -> 日志里只有 "full" 一次：getter 里的 this 是 target 本身，');
console.log('     this.first / this.last 直接读原始对象，没有再经过代理');

// 版本 B：陷阱里用 Reflect.get(tgt, key, receiver)，保留 receiver。
const proxyB = new Proxy(person, {
  get(tgt, key, receiver) {
    console.log(`  [B.get] ${String(key)}`);
    return Reflect.get(tgt, key, receiver);
  },
});
console.log('proxyB.full =', proxyB.full);
console.log('  -> 日志里出现了 full、first、last 三次：getter 里的 this 是**代理**，');
console.log('     所以它读 first/last 时又回到了陷阱里 —— 这正是响应式依赖收集能生效的前提');

console.log('--- 6. 同样的道理适用于 set 与原型上的 setter ---');

const protoSetter = {
  set doubled(v) {
    // this 是谁，决定了 _d 被写到哪个对象上。
    this._d = v * 2;
  },
  get doubled() {
    return this._d;
  },
};

const child = Object.create(protoSetter);
const childProxy = new Proxy(child, {
  get(tgt, key, receiver) {
    return Reflect.get(tgt, key, receiver);
  },
  set(tgt, key, value, receiver) {
    // 必须传 receiver，否则 setter 里的 this 会变成 child（target），
    // 写入就会绕过代理，响应式系统会"漏掉"这次变化。
    return Reflect.set(tgt, key, value, receiver);
  },
});

childProxy.doubled = 21;
console.log('通过代理写 doubled = 21，读到 =', childProxy.doubled, '（setter 里算出了 42）');
console.log('写入落在了哪里？child._d =', child._d, ', 代理上读到的 =', childProxy._d);
console.log('  -> 因为传了 receiver，setter 里的 this 是代理，this._d = ... 也走代理的 set 陷阱');

console.log('--- 7. 对照实验：不传 receiver 会有什么不同 ---');

const child2 = Object.create(protoSetter);
const childProxy2 = new Proxy(child2, {
  get: (tgt, key) => tgt[key], // 简写：丢掉了 receiver
  set(tgt, key, value) {
    // 故意用直接赋值：setter 的 this 会变成 target
    tgt[key] = value;
    return true;
  },
});

childProxy2.doubled = 21;
console.log('不传 receiver 时读到 =', childProxy2.doubled, '（结果同样是 42）');
console.log('  但 this._d = ... 这行写入的是 target，代理的 set 陷阱看不到它');
console.log('  -> 单看结果一样，但在需要"追踪每一次写入"的场景（响应式）里就会漏事件');

console.log('--- 8. 把代理放进原型链 ---');

// 代理不一定是"被访问的那个对象"，也可以是它的原型。
const base = { kind: 'base', value: 10 };
const baseProxy = new Proxy(base, {
  get(tgt, key, receiver) {
    // receiver 此时是继承者对象，而不是代理本身！
    console.log(`  [proto.get] ${String(key)} | receiver 是继承者吗？${receiver === inheritor}`);
    return Reflect.get(tgt, key, receiver);
  },
});

const inheritor = Object.create(baseProxy);
console.log('inheritor.kind =', inheritor.kind);
console.log('  -> 代理在原型链上依然有效，陷阱会被触发');
console.log('  -> 这也说明：任何对象只要原型链上有代理，操作就会被拦截');

// 更有意思的是写入：给 inheritor 写属性时，因为 base 上没有同名属性，
// 会直接在 inheritor 自己身上创建（不会触发代理的 set）。
inheritor.value = 99;
console.log('写 inheritor.value 后：inheritor 自己有 value 吗？', Object.hasOwn(inheritor, 'value'));
console.log('  base.value 仍是 =', base.value);

console.log('--- 9. 实践：一个带日志与默认值的完整实现 ---');

// 把第 2、4 节的技巧合起来，写一个"带访问日志、未知属性返回默认值、写入有记录"的代理工厂。
function createSmartObject(initial, defaultValue = null) {
  const log = [];
  const target2 = { ...initial };
  const proxy = new Proxy(target2, {
    get(tgt, key, receiver) {
      // 忽略 symbol 键，避免日志被引擎内部探测刷屏。
      if (typeof key === 'string') log.push(`读 ${key}`);
      const value = Reflect.get(tgt, key, receiver);
      // 只有"普通数据属性缺失"时给默认值；方法等仍返回原值。
      return value === undefined ? defaultValue : value;
    },
    set(tgt, key, value, receiver) {
      if (typeof key === 'string') log.push(`写 ${key} = ${JSON.stringify(value)}`);
      return Reflect.set(tgt, key, value, receiver);
    },
  });
  return { proxy, log };
}

const { proxy: smart, log: smartLog } = createSmartObject({ a: 1 }, '默认值');
smart.a = 100;
const bValue = smart.b;
smart.c = 'hello';

console.log('smart.a =', smart.a, ', smart.b =', bValue, ', smart.c =', smart.c);
console.log('访问日志：');
for (const entry of smartLog) console.log('  ', entry);

console.log('\n全部演示完毕。');
