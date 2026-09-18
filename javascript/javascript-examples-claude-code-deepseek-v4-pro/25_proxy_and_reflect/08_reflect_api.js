/**
 * ============================================================================
 * 知识点：Reflect 全部静态方法 —— 与 Proxy 陷阱的一一对应
 * ============================================================================
 *
 * 【所属分类】25_proxy_and_reflect —— 元编程：拦截对象的基本操作
 * 【难度等级】进阶
 * 【前置知识】25_proxy_and_reflect/02_get_set_traps.js 与 04_apply_construct_traps.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Reflect 是 ES2015 引入的一个**普通对象**（不是构造函数，不能 new），
 *    它把 JS 引擎内部才有的那些"对象基本操作"（内部方法）暴露成了 13 个静态函数：
 *      get / set / has / deleteProperty / ownKeys / getOwnPropertyDescriptor /
 *      defineProperty / getPrototypeOf / setPrototypeOf / isExtensible /
 *      preventExtensions / apply / construct
 *    这 13 个名字和 Proxy 的陷阱名**完全一致**，这不是巧合：
 *    Reflect 就是"Proxy 陷阱的默认行为"的官方实现。
 *
 * 2. 为什么需要
 *    在 Reflect 之前，同样的事情要做只能靠 Object 上的同名方法或运算符，
 *    但它们和"引擎内部的真实语义"并不一致：
 *      - 想触发 getter，只能写 obj[key] —— 但那无法指定 receiver；
 *      - 想给原型设值，delete obj.x 返回值在不同模式下行为不同；
 *      - Object.defineProperty 失败会抛错，而内部方法只返回 false；
 *      - 没有统一的方式"用函数调用语义去调用一个函数并指定 this"。
 *    Reflect 提供了三条关键价值：
 *      a) **语义完全等于引擎内部行为**（含 receiver、含原型链、含正确返回值）；
 *      b) **所有方法都返回布尔值或结果，绝不抛错**（除了参数类型错误）；
 *      c) **函数式风格**：可以把它当一等函数传递，例如 `const op = Reflect.get`。
 *
 * 3. 核心语法要点
 *    - Reflect 不可被 new，也没有 prototype，不能当构造函数用。
 *    - Reflect.ownKeys 返回所有自有键（含 symbol、含不可枚举），顺序固定：
 *      整数下标（升序）-> 字符串（插入序）-> symbol（插入序）。
 *    - Reflect.set 返回布尔值；失败返回 false 而不是抛错。
 *    - Reflect.get 支持第三个参数 receiver，能把 getter 里的 this 指到别处。
 *    - Reflect.construct(Ctor, args, newTarget) 的第三个参数决定新对象的原型来源。
 *    - 在 Proxy 陷阱里，用 Reflect 完成默认行为是最标准的写法。
 *
 * 4. 常见陷阱
 *    - Reflect 的方法名和 Object 的同名方法**语义不同**（详见下一个文件 09）：
 *      Object.defineProperty 返回被操作的对象，Reflect.defineProperty 返回布尔值。
 *    - Object 上一部分方法是"静态工具"（keys/values/assign），
 *      Reflect 上**没有**这些，别记混。
 *    - Reflect.set 在"目标不可写"时返回 false 而不是抛错，
 *      所以调用方必须自己检查返回值，否则会静默失败。
 *    - 陷阱里忘记 return Reflect.xxx(...) 的返回值，会导致 set 陷阱返回 undefined
 *      （等价于 false），进而在严格模式下抛 TypeError。
 *    - Reflect.ownKeys 返回的 symbol 键不能直接拼进字符串（要 String() 转换）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 25_proxy_and_reflect/08_reflect_api.js
 *
 * 【预期输出】
 *   逐个打印 13 个 Reflect 方法的调用方式与返回值，并给出与陷阱的对应表。
 * ============================================================================
 */

console.log('--- 1. Reflect 是一个普通对象，不是构造函数 ---');

console.log('typeof Reflect      =', typeof Reflect);
console.log('Reflect.prototype   =', Reflect.prototype, '（没有 prototype，不能 new）');
console.log('Reflect 是函数吗？  =', typeof Reflect === 'function');

try {
  new Reflect();
} catch (err) {
  console.log('new Reflect() 报错：', err.constructor.name, '-', err.message);
}

// 它的所有方法都是**不可被 new 的普通函数**。
try {
  new Reflect.get({}, 'a');
} catch (err) {
  console.log('new Reflect.get() 报错：', err.constructor.name, '-', err.message);
}

console.log('--- 2. 13 个方法与 Proxy 陷阱的对应表 ---');

const table = [
  ['Reflect.get(target, key, receiver)', 'get(target, key, receiver)'],
  ['Reflect.set(target, key, value, receiver)', 'set(target, key, value, receiver)'],
  ['Reflect.has(target, key)', 'has(target, key)'],
  ['Reflect.deleteProperty(target, key)', 'deleteProperty(target, key)'],
  ['Reflect.ownKeys(target)', 'ownKeys(target)'],
  ['Reflect.getOwnPropertyDescriptor(target, key)', 'getOwnPropertyDescriptor(target, key)'],
  ['Reflect.defineProperty(target, key, desc)', 'defineProperty(target, key, desc)'],
  ['Reflect.getPrototypeOf(target)', 'getPrototypeOf(target)'],
  ['Reflect.setPrototypeOf(target, proto)', 'setPrototypeOf(target, proto)'],
  ['Reflect.isExtensible(target)', 'isExtensible(target)'],
  ['Reflect.preventExtensions(target)', 'preventExtensions(target)'],
  ['Reflect.apply(target, thisArg, args)', 'apply(target, thisArg, args)'],
  ['Reflect.construct(target, args, newTarget)', 'construct(target, args, newTarget)'],
];

console.log('Reflect 方法'.padEnd(48) + '对应的 Proxy 陷阱');
console.log('-'.repeat(90));
for (const [reflectSig, trapSig] of table) {
  console.log(reflectSig.padEnd(48) + trapSig);
}
console.log('  参数顺序、语义完全一致 —— 陷阱里直接 return Reflect.同名方法(...args) 就是默认行为');

console.log('--- 3. get / set：读写属性（含 receiver） ---');

const obj = { a: 1 };

console.log('Reflect.get(obj, "a")        =', Reflect.get(obj, 'a'));
console.log('Reflect.get(obj, "missing")  =', Reflect.get(obj, 'missing'), '（不存在就是 undefined，不报错）');

// receiver 的作用：影响 getter 里的 this。
// 这里 Object 的写法无法指定 receiver，但 Reflect 可以。
const source = { _internal: 'raw' };
const receiver = {
  _internal: 'from-receiver',
};
Object.defineProperty(source, 'value', {
  get() {
    return `this._internal = ${this._internal}`;
  },
  configurable: true,
});

console.log('默认 receiver（this = source）  =', Reflect.get(source, 'value'));
console.log('指定 receiver（this = receiver）=', Reflect.get(source, 'value', receiver));

// set 返回布尔值，成功为 true。
console.log('Reflect.set(obj, "b", 2)     =', Reflect.set(obj, 'b', 2));
console.log('  写入后 obj =', JSON.stringify(obj));
console.log('Reflect.set(obj, "a", 100)   =', Reflect.set(obj, 'a', 100), ', a =', obj.a);

// 在不可写属性上写入：返回 false，不抛错。
const frozen = Object.freeze({ locked: 1 });
console.log('对冻结对象 set                =', Reflect.set(frozen, 'locked', 2), '（返回 false，不抛错）');
console.log('  值仍然是                     =', frozen.locked);
console.log('  -> 对比：frozen.locked = 2 在严格模式下会抛 TypeError');
try {
  frozen.locked = 2;
} catch (err) {
  console.log('  直接赋值确实抛错了：', err.constructor.name);
}

// receiver 在 set 里同样有意义：可以写到"另一个对象"上。
const target = {};
const otherReceiver = {};
Reflect.set(target, 'x', 42, otherReceiver); // 属性会落到 receiver 上
console.log('用 receiver 做 set：target =', JSON.stringify(target), ', receiver =', JSON.stringify(otherReceiver));

console.log('--- 4. has / deleteProperty ---');

const bag = { fruit: 'apple' };
console.log('Reflect.has(bag, "fruit")   =', Reflect.has(bag, 'fruit'), '（等价于 "fruit" in bag）');
console.log('Reflect.has(bag, "veggie")  =', Reflect.has(bag, 'veggie'));
console.log('Reflect.has(bag, "toString")=', Reflect.has(bag, 'toString'), '（会沿原型链查找）');

console.log('Reflect.deleteProperty(bag, "fruit") =', Reflect.deleteProperty(bag, 'fruit'));
console.log('  删除后 bag =', JSON.stringify(bag));

// 删除不可配置属性：返回 false，不抛错。
const sealed = {};
Object.defineProperty(sealed, 'k', { value: 1, configurable: false });
console.log('删除不可配置属性            =', Reflect.deleteProperty(sealed, 'k'), '（返回 false）');
console.log('  对比：delete sealed.k 在严格模式下会抛 TypeError');

console.log('--- 5. ownKeys / getOwnPropertyDescriptor / defineProperty ---');

const mixed = { b: 2, a: 1 };
Object.defineProperty(mixed, 'hidden', { value: 3, enumerable: false });
mixed[Symbol('sym')] = 4;

// ownKeys 返回全部自有键：字符串 + symbol，包含不可枚举的。
const allKeys = Reflect.ownKeys(mixed);
console.log('Reflect.ownKeys =', JSON.stringify(allKeys.map(String)));
console.log('  对比 Object.keys        =', JSON.stringify(Object.keys(mixed)), '（只有可枚举的字符串键）');
console.log('  对比 getOwnPropertyNames=', JSON.stringify(Object.getOwnPropertyNames(mixed)), '（可枚举+不可枚举，不含 symbol）');

// 键的顺序规则：整数键升序 -> 字符串键插入序 -> symbol 键插入序。
const ordered = {};
ordered.zebra = 1;
ordered['10'] = 2;
ordered.apple = 3;
ordered['2'] = 4;
console.log('键顺序 =', JSON.stringify(Reflect.ownKeys(ordered)));
console.log('  -> 数字键被排到最前并按数值升序，其余按插入顺序 —— 这与 for...in 的顺序一致');

// getOwnPropertyDescriptor 返回描述符对象（或 undefined）。
console.log('Reflect.getOwnPropertyDescriptor(mixed, "hidden") =');
console.log('  ', JSON.stringify(Reflect.getOwnPropertyDescriptor(mixed, 'hidden')));
console.log('Reflect.getOwnPropertyDescriptor(mixed, "nope")   =', Reflect.getOwnPropertyDescriptor(mixed, 'nope'));

// defineProperty 返回布尔值。
console.log('Reflect.defineProperty(新属性)  =', Reflect.defineProperty(mixed, 'created', {
  value: 'yes',
  writable: true,
  enumerable: true,
  configurable: true,
}));
console.log('  created =', mixed.created);

// 定义失败示例：在不可扩展对象上新增属性。
const nonExtensible = Object.preventExtensions({});
console.log('对不可扩展对象 defineProperty =', Reflect.defineProperty(nonExtensible, 'x', { value: 1 }));
console.log('  -> 返回 false，而不是抛错 —— 这就是"内部方法"的语义');

console.log('--- 6. getPrototypeOf / setPrototypeOf ---');

const animal = { legs: 4 };
const dog = Object.create(animal);

console.log('Reflect.getPrototypeOf(dog) === animal ?', Reflect.getPrototypeOf(dog) === animal);
console.log('Reflect.getPrototypeOf(Object.prototype) =', Reflect.getPrototypeOf(Object.prototype), '（原型链的终点是 null）');

const cat = { sound: 'meow' };
console.log('Reflect.setPrototypeOf(cat, animal) =', Reflect.setPrototypeOf(cat, animal));
console.log('  设置后 cat.legs =', cat.legs, '（继承到了）');

// 用 null 作为原型可以创建"没有原型链"的纯字典对象。
const dict = Object.create(null);
console.log('Reflect.getPrototypeOf(Object.create(null)) =', Reflect.getPrototypeOf(dict));

// 设置原型失败会返回 false（例如把不可扩展对象的原型换掉）。
const lockedProto = Object.preventExtensions({});
console.log('给不可扩展对象换原型 =', Reflect.setPrototypeOf(lockedProto, { x: 1 }), '（返回 false）');

console.log('--- 7. isExtensible / preventExtensions ---');

const fresh = {};
console.log('Reflect.isExtensible(新对象) =', Reflect.isExtensible(fresh));
console.log('Reflect.preventExtensions 返回 =', Reflect.preventExtensions(fresh));
console.log('  之后 isExtensible =', Reflect.isExtensible(fresh));
console.log('  新增属性还能成功吗？Reflect.set =', Reflect.set(fresh, 'x', 1), '（false）');

// 与 Object.freeze 的关系：freeze 相当于"设为不可配置 + 不可写 + 不可扩展"。
const freezeMe = { a: 1 };
Reflect.preventExtensions(freezeMe);
freezeMe.a = 2; // 可扩展性没了，但已有属性仍然可写
console.log('只 preventExtensions 时已有属性仍可写：a =', freezeMe.a);
console.log('  -> 想彻底锁死要用 Object.freeze，或者手动把每个属性设成不可写不可配置');

console.log('--- 8. apply / construct：函数调用与构造 ---');

function add(a, b) {
  // 验证 this 是否被正确传入。
  return `${this?.tag ?? 'no-this'}: ${a + b}`;
}

console.log('Reflect.apply(add, undefined, [1, 2]) =', Reflect.apply(add, undefined, [1, 2]));
console.log('Reflect.apply(add, { tag: "ctx" }, [3, 4]) =', Reflect.apply(add, { tag: 'ctx' }, [3, 4]));
console.log('  等价于 add.apply({tag:"ctx"}, [3, 4]) =', add.apply({ tag: 'ctx' }, [3, 4]));

class Base {
  constructor(x) {
    this.x = x;
  }
  describe() {
    return `Base(${this.x})`;
  }
}
class Derived extends Base {}

// 用 newTarget 控制"新对象的原型来自哪里"。
const viaBase = Reflect.construct(Base, [1], Base);
const viaDerived = Reflect.construct(Base, [2], Derived);

console.log('newTarget = Base     -> 原型是 Base.prototype 吗？', Object.getPrototypeOf(viaBase) === Base.prototype);
console.log('newTarget = Derived  -> 原型是 Derived.prototype 吗？', Object.getPrototypeOf(viaDerived) === Derived.prototype);
console.log('  所以 viaDerived instanceof Derived =', viaDerived instanceof Derived);
console.log('  即使实现代码写在 Base 里，new.target 决定了"我是谁造出来的"');

console.log('--- 9. 实战：一个"全陷阱透传"的日志代理 ---');

/**
 * 这是最标准、最推荐的代理写法：
 * 每个陷阱都先做自己的事（打印日志），再用 Reflect 完成默认行为。
 * 这样代理对使用方完全透明 —— 行为与不代理时一模一样。
 */
function trace(target, label) {
  const log = [];
  const handler = {};

  // 陷阱名与 Reflect 方法名一一对应，所以可以用循环批量生成。
  const trapNames = [
    'get',
    'set',
    'has',
    'deleteProperty',
    'ownKeys',
    'getOwnPropertyDescriptor',
    'defineProperty',
    'getPrototypeOf',
    'setPrototypeOf',
    'isExtensible',
    'preventExtensions',
  ];

  // 安全地把参数转成可读文本。
  // 注意：这里绝对不能对参数调用 JSON.stringify！
  // 因为参数里可能有"代理自己"（target / receiver），而 JSON.stringify
  // 序列化任何对象时都会先读它的 toJSON 属性 —— 这一读就又进了本陷阱，
  // 于是无限递归直到爆栈。所以这里完全不用 JSON.stringify，只做类型判断。
  const describe = (v) => {
    if (typeof v === 'symbol') return String(v);
    if (typeof v === 'function') return '[函数]';
    if (v !== null && typeof v === 'object') return '[对象]';
    if (typeof v === 'bigint') return `${v}n`;
    if (typeof v === 'string') return `"${v}"`;
    return String(v);
  };

  for (const name of trapNames) {
    handler[name] = (...args) => {
      // args[0] 是 target，args[1] 起是具体参数。
      const shown = args.slice(1).map(describe);
      log.push(`${name}(${shown.join(', ')})`);
      // 关键：用同名 Reflect 方法完成默认行为，语义与"没有代理"完全一致。
      return Reflect[name](...args);
    };
  }

  // apply / construct 只对函数目标有意义，单独处理。
  if (typeof target === 'function') {
    handler.apply = (tgt, thisArg, argsList) => {
      log.push(`apply(${argsList.length} 个参数)`);
      return Reflect.apply(tgt, thisArg, argsList);
    };
    handler.construct = (tgt, argsList, newTarget) => {
      log.push(`construct(${argsList.length} 个参数)`);
      return Reflect.construct(tgt, argsList, newTarget);
    };
  }

  const proxy = new Proxy(target, handler);
  return { proxy, log, label };
}

const tracedObj = trace({ name: '张三', age: 18 }, 'user');
const t = tracedObj.proxy;

console.log('读 name        =', t.name);
console.log('写 age         =', (t.age = 19));
console.log('in 检查        =', 'name' in t);
t.newKey = 'x';
console.log('Object.keys    =', JSON.stringify(Object.keys(t)));
console.log('删除 newKey    =', delete t.newKey);
console.log('Object.isExtensible =', Object.isExtensible(t));
console.log('原型是 Object.prototype 吗？', Object.getPrototypeOf(t) === Object.prototype);

console.log('\n捕获到的陷阱调用：');
for (const entry of tracedObj.log) console.log('   ', entry);

// 代理函数：apply 与 construct 陷阱。
const tracedFn = trace(function multiply(a, b) {
  return a * b;
}, 'multiply');
console.log('\n调用代理函数 =', tracedFn.proxy(6, 7));
console.log('捕获到的陷阱调用：', JSON.stringify(tracedFn.log));

class TracedClass {
  constructor(v) {
    this.v = v;
  }
}
const tracedCtor = trace(TracedClass, 'TracedClass');
const instance = new tracedCtor.proxy(5);
console.log('\nnew 代理类得到的实例 =', JSON.stringify(instance), ', instanceof =', instance instanceof TracedClass);
console.log('捕获到的陷阱调用：', JSON.stringify(tracedCtor.log));

console.log('--- 10. 小结：为什么陷阱里要用 Reflect 而不是手动重写 ---');

// 手动重写默认行为很容易漏掉细节，比如 set 的返回值语义。
const wrongWay = new Proxy({ a: 1 }, {
  set(tgt, key, value) {
    tgt[key] = value;
    // 忘记 return true，陷阱返回 undefined（等价于 false）
  },
});

try {
  wrongWay.b = 2; // 严格模式下抛 TypeError
} catch (err) {
  console.log('漏写 return 的 set 陷阱：', err.constructor.name, '-', err.message);
}

// 正确写法：把 Reflect 的返回值直接透出去。
const rightWay = new Proxy({ a: 1 }, {
  set(tgt, key, value, receiver) {
    console.log(`  [set] ${String(key)} = ${JSON.stringify(value)}`);
    return Reflect.set(tgt, key, value, receiver); // 返回值语义与原生完全一致
  },
});
console.log('正确写法写入结果 =', (rightWay.b = 2), ', 对象 =', JSON.stringify(rightWay));

console.log('\n全部演示完毕。');
