/**
 * ============================================================================
 * 知识点：Proxy 的局限 —— 性能开销、内部槽、私有字段与透明性陷阱
 * ============================================================================
 *
 * 【所属分类】25_proxy_and_reflect —— 元编程：拦截对象的基本操作
 * 【难度等级】高级
 * 【前置知识】25_proxy_and_reflect/01 ~ 09 全部内容
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Proxy 很强，但不是"万能透明包装"。它有四类硬性局限：
 *      a) **性能开销**：每次属性访问都要经过陷阱函数，热路径上代价显著；
 *      b) **内部槽（internal slots）**：Map / Set / Date / RegExp / Promise /
 *         定型数组 / ArrayBuffer 这些对象的内部状态不在属性里，
 *         代理只是"转发属性访问"，拿不到内部槽，方法一调用就抛
 *         "incompatible receiver"；
 *      c) **私有字段（#field）**：私有字段的可见性检查认的是"是不是声明的那个类"，
 *         代理对象不是，所以一读就抛；
 *      d) **透明性漏洞**：代理无法完全伪装成目标对象 ——
 *         proxy !== target、structuredClone 会失败、
 *         Node 的 util.types.isProxy 可以直接识别出来。
 *
 * 2. 为什么需要搞清楚这些
 *    "给整个对象套一层 Proxy 就能加日志/校验/响应式"是个危险的直觉。
 *    一旦对象里有 Map、Date、类实例、私有字段，代理就会当场炸掉，
 *    而且报错信息（incompatible receiver）往往指向库内部，极难排查。
 *    知道边界在哪里，才能在"该用代理"和"该用普通包装函数"之间做正确选择。
 *
 * 3. 核心语法要点
 *    - 内部槽的判据叫"品牌检查（brand check）"：
 *      方法内部会检查 this 是不是真的拥有那个内部槽。代理对象没有，所以失败。
 *    - 解决办法之一：在 get 陷阱里把方法"绑回原始对象"：
 *        get(tgt, key) { const v = Reflect.get(tgt, key, tgt); return typeof v === 'function' ? v.bind(tgt) : v; }
 *      代价是每次读方法都创建一个新的绑定函数（又会带来新的身份问题）。
 *    - 解决办法之二（更推荐）：不要代理这些对象，改成"手写一个包装类"，
 *      显式转发你需要的少数几个方法。
 *    - util.types.isProxy 是 Node 专有的检测手段（浏览器里没有）。
 *    - 代理会持有 target 的强引用；只要代理活着，target 就不会被回收。
 *
 * 4. 常见陷阱
 *    - 以为"代理一个数组"就万事大吉：Array.isArray 会返回 true，
 *      JSON.stringify 也正常，但 structuredClone 会抛 DataCloneError。
 *    - 以为代理可以隐藏身份：Node 的 util.types.isProxy 一眼看穿，
 *      而你自己也没法在浏览器里做通用检测（这正是它"不可检测"的另一面）。
 *    - 用 bind 修好方法调用后，忘记"每次 get 都返回新函数"这件事 ——
 *      `proxy.fn === proxy.fn` 会变成 false，依赖引用比较的代码会失效。
 *    - 代理套代理（多层）会让性能成倍恶化，而且每层的 receiver 语义都可能打架。
 *    - 陷阱里做重活（正则、JSON 序列化、深比较）会把开销放大到不可接受。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 25_proxy_and_reflect/10_proxy_limitations.js
 *
 * 【预期输出】
 *   打印性能对比、各类内置对象被代理后的报错、私有字段失败与解决办法，
 *   以及"代理无法完全透明"的几处证据。
 * ============================================================================
 */

import { types as utilTypes } from 'node:util';

// 统一的"安全调用"工具：把可能抛错的表达式包起来，打印结果或错误。
function attempt(label, fn) {
  try {
    console.log(`  ${label.padEnd(38)} -> ${String(fn())}`);
  } catch (err) {
    console.log(`  ${label.padEnd(38)} -> ${err.constructor.name}: ${err.message}`);
  }
}

console.log('--- 1. 局限一：性能开销 ---');

// 先用一个"最朴素"的陷阱测一下：什么都不做，只转发。
const plainTarget = { a: 1, b: 2, c: 3 };

let trapCalls = 0;
const transparentProxy = new Proxy(plainTarget, {
  get(tgt, key, receiver) {
    trapCalls += 1; // 哪怕只多这一行，开销就已经上去了
    return Reflect.get(tgt, key, receiver);
  },
});

// 完全空的陷阱，连计数都不做。
const emptyProxy = new Proxy(plainTarget, {
  get(tgt, key, receiver) {
    return Reflect.get(tgt, key, receiver);
  },
});

const ITERATIONS = 5_000_000;

function bench(label, fn) {
  // 注意：fn 内部已经包含了完整的循环，所以这里**只能调用一次**。
  // 如果写成"先跑一小段预热"，就会把整个循环重复执行很多遍，直接把脚本跑到超时。
  // 现代引擎会在循环执行过程中自然完成 JIT 优化，测量结果足够说明数量级差异。
  const start = process.hrtime.bigint();
  fn();
  const ns = Number(process.hrtime.bigint() - start);
  console.log(`  ${label.padEnd(28)} ${String(ns).padStart(12)} ns  （每次约 ${(ns / ITERATIONS).toFixed(1)} ns）`);
  return ns;
}

console.log(`循环 ${ITERATIONS.toLocaleString()} 次属性读取：`);
const rawNs = bench('原生对象', () => {
  let sum = 0;
  for (let i = 0; i < ITERATIONS; i += 1) sum += plainTarget.a;
  return sum;
});

const emptyNs = bench('空陷阱的代理', () => {
  let sum = 0;
  for (let i = 0; i < ITERATIONS; i += 1) sum += emptyProxy.a;
  return sum;
});

trapCalls = 0;
const trapNs = bench('带计数的代理', () => {
  let sum = 0;
  for (let i = 0; i < ITERATIONS; i += 1) sum += transparentProxy.a;
  return sum;
});

console.log('  倍数关系：空陷阱 =', (emptyNs / rawNs).toFixed(1), '倍，带计数 =', (trapNs / rawNs).toFixed(1), '倍');
console.log('  -> 代理不是"几乎免费"的语法糖，热路径（每帧渲染、逐像素处理、循环内）要慎用');
console.log('  -> 缓解手段：把代理"局部化"（只在边界处代理一次），不要在循环里反复创建');
console.log('     也尽量别在陷阱里做正则匹配、JSON 序列化这类重活');

console.log('--- 2. 局限二：内部槽（internal slots）---');

console.log('Map：');
const map = new Map([['a', 1]]);
const mapProxy = new Proxy(map, {});

// 读 Map 自己的属性（自定义属性）没问题 —— 因为那走的是普通属性访问。
map.customProp = 'hello';
console.log('  普通属性读取 customProp =', mapProxy.customProp, '（走 get 陷阱转发，正常）');

// 但 Map 的方法和 size 依赖 [[MapData]] 这个内部槽，代理对象没有。
attempt('mapProxy.get("a")', () => mapProxy.get('a'));
attempt('mapProxy.size', () => mapProxy.size);
attempt('mapProxy.has("a")', () => mapProxy.has('a'));
attempt('原始 map.get("a")', () => map.get('a'));
console.log('  原因：Map.prototype.get 内部做品牌检查 —— "this 必须真的拥有一块 Map 数据"');
console.log('        代理对象只是一个"转发属性访问的外壳"，本身没有那块数据，所以检查失败');

console.log('Date：');
const date = new Date('2024-01-01T00:00:00Z');
const dateProxy = new Proxy(date, {});
attempt('dateProxy.getTime()', () => dateProxy.getTime());
attempt('dateProxy.getFullYear()', () => dateProxy.getFullYear());
attempt('+dateProxy（隐式 valueOf）', () => +dateProxy);
attempt('dateProxy instanceof Date', () => dateProxy instanceof Date);
console.log('  -> instanceof 竟然是 true（它看的是原型链），但方法调用全失败：');
console.log('     "看起来是 Date，却不能用" —— 这是最迷惑的一类错误');

console.log('定型数组与其它内置对象：');
const typed = new Uint8Array([1, 2, 3]);
const typedProxy = new Proxy(typed, {});
attempt('typedProxy[0]（下标读取）', () => typedProxy[0]);
attempt('typedProxy.length', () => typedProxy.length);
attempt('typedProxy.subarray(0, 2)', () => typedProxy.subarray(0, 2));
attempt('typedProxy.slice(0, 2)', () => typedProxy.slice(0, 2));

const regexpProxy = new Proxy(/abc/g, {});
attempt('regexpProxy.test("abc")', () => regexpProxy.test('abc'));
attempt('regexpProxy.source', () => regexpProxy.source);

const arrayBufferProxy = new Proxy(new ArrayBuffer(8), {});
attempt('arrayBufferProxy.byteLength', () => arrayBufferProxy.byteLength);
attempt('new DataView(arrayBufferProxy)', () => new DataView(arrayBufferProxy).byteLength);

const promiseProxy = new Proxy(Promise.resolve(1), {});
attempt('Promise 代理的 then 是函数吗', () => typeof promiseProxy.then);
attempt('Promise 代理能正常 then 吗', () => typeof promiseProxy.then(() => {}));

console.log('--- 3. 内部槽的两种解决办法 ---');

// 办法一：在 get 陷阱里把方法绑回原始对象（"方法绑定代理"）。
function bindMethods(target, label) {
  return new Proxy(target, {
    get(tgt, key, receiver) {
      // 关键：用 tgt 作为 receiver 取值，保证拿到的方法内部 this 正确。
      const value = Reflect.get(tgt, key, tgt);
      if (typeof value === 'function') {
        // 绑定到原始对象，这样品牌检查就能通过了。
        const bound = value.bind(tgt);
        console.log(`    [${label}] 把方法 ${String(key)} 绑定到原始对象`);
        return bound;
      }
      return value;
    },
  });
}

const boundMap = bindMethods(map, 'map');
console.log('用绑定方案访问 Map：');
attempt('boundMap.get("a")', () => boundMap.get('a'));
attempt('boundMap.has("a")', () => boundMap.has('a'));
attempt('直接读 boundMap.size', () => boundMap.size, '（size 是访问器属性，不是函数，仍然失败）');

// 身份问题：每次读取都产生一个新的绑定函数。
console.log('  副作用：boundMap.get === boundMap.get 吗？', boundMap.get === boundMap.get, '（每次都是新函数！）');

// 办法二（推荐）：不代理内置对象，手写一个只转发所需方法的包装类。
class SafeMap {
  // 用私有字段保存真实数据，外部拿不到原始 Map，无法绕过包装。
  #inner;

  constructor(entries) {
    this.#inner = new Map(entries);
  }

  get(key) {
    return this.#inner.get(key);
  }

  set(key, value) {
    console.log(`    [SafeMap] set(${String(key)})`);
    this.#inner.set(key, value);
    return this;
  }

  has(key) {
    return this.#inner.has(key);
  }

  get size() {
    return this.#inner.size;
  }

  [Symbol.iterator]() {
    return this.#inner[Symbol.iterator]();
  }
}

const safeMap = new SafeMap([['x', 10]]);
console.log('用包装类方案：');
console.log('  safeMap.get("x") =', safeMap.get('x'));
safeMap.set('y', 20);
console.log('  safeMap.size =', safeMap.size, ', 展开 =', JSON.stringify([...safeMap]));
console.log('  -> 虽然要多写几行，但行为完全可预测，没有品牌检查、没有身份问题、性能也更好');
console.log('  -> 通用经验：**内置对象用包装类，普通对象才用 Proxy**');

console.log('--- 4. 局限三：私有字段（#field）无法穿过代理 ---');

class Counter {
  // 私有字段：外部完全无法访问，只能通过类自己的方法读写。
  #count = 0;

  increment() {
    this.#count += 1;
    return this.#count;
  }

  get value() {
    return this.#count;
  }
}

const counter = new Counter();
console.log('直接调用 increment() =', counter.increment());

const counterProxy = new Proxy(counter, {});
attempt('counterProxy.increment()', () => counterProxy.increment());
attempt('counterProxy.value', () => counterProxy.value);
console.log('  原因：私有字段的可见性检查是"这个词法作用域声明的类"，');
console.log('        this 必须是该类的真实实例。代理对象不是，于是直接抛错。');

// 绑定方案能救回方法调用，但读不了私有字段的访问器属性。
const boundCounter = new Proxy(counter, {
  get(tgt, key, receiver) {
    const value = Reflect.get(tgt, key, tgt); // 注意 receiver 用 tgt
    return typeof value === 'function' ? value.bind(tgt) : value;
  },
});
attempt('绑定代理 increment()', () => boundCounter.increment());
attempt('绑定代理 value', () => boundCounter.value);
console.log('  -> 方法能用了，但访问器属性（getter）里的 this 仍会被换成 receiver，');
console.log('     所以最稳妥的做法依然是：**不要代理有私有字段的类实例**');

console.log('--- 5. 局限四：透明性漏洞 ---');

const arr = [1, 2, 3];
const arrProxy = new Proxy(arr, {});

console.log('这些看起来"完全透明"：');
console.log('  Array.isArray(arrProxy)      =', Array.isArray(arrProxy), '（内部会看目标对象，所以为 true）');
console.log('  arrProxy instanceof Array    =', arrProxy instanceof Array);
console.log('  JSON.stringify(arrProxy)     =', JSON.stringify(arrProxy));
console.log('  arrProxy.length              =', arrProxy.length);
console.log('  Object.prototype.toString    =', Object.prototype.toString.call(arrProxy));

console.log('但这些地方立刻露馅：');
attempt('structuredClone(arrProxy)', () => JSON.stringify(structuredClone(arrProxy)));
console.log('  arrProxy === arr             =', arrProxy === arr, '（永远不相等）');
console.log('  用 util.types.isProxy 检测    =', utilTypes.isProxy(arrProxy), '（Node 专有，浏览器没有）');
console.log('  检测普通数组                  =', utilTypes.isProxy(arr));

// 用代理"假装"成另一个对象也是徒劳的：原型链、内部槽都无法完整伪造。
const fakeArray = new Proxy({}, {
  get(tgt, key) {
    if (key === 'length') return 3;
    return tgt[key];
  },
});
console.log('  伪装成数组的普通对象：Array.isArray =', Array.isArray(fakeArray), '（一眼看穿）');

console.log('--- 6. 代理无法摆脱的"身份差异" ---');

// 代理和被代理对象是两个不同的对象，这在一些场景会造成真实问题。
const original = { id: 1 };
const shadow = new Proxy(original, {});

const registry = new Set([original]);
console.log('Set 里存了 original，contains(shadow) =', registry.has(shadow), '（认不出来）');

const mapByObject = new Map();
mapByObject.set(original, 'value');
console.log('以 original 为键的 Map，用 shadow 取值 =', mapByObject.get(shadow), '（取不到）');
console.log('  -> 用对象做 Map 键 / Set 成员 / WeakMap 键时，代理与被代理对象是两把不同的钥匙');
console.log('     这也是响应式框架里必须用 toRaw() 把代理还原成原始对象的原因');

console.log('--- 7. 不变量带来的"不能撒谎"限制 ---');

// 目标对象一旦被冻结，代理就不能在 get 陷阱里返回别的值（见 01 文件）。
const frozen = Object.freeze({ value: '真实值' });
const fibbingProxy = new Proxy(frozen, {
  get() {
    return '我想给你别的值';
  },
});
attempt('对冻结对象撒谎的 get', () => fibbingProxy.value);

// 同理，不可扩展的目标对象上，ownKeys 也不能多报键。
const sealed = Object.preventExtensions({ a: 1 });
const extraKeyProxy = new Proxy(sealed, {
  ownKeys() {
    return ['a', 'b'];
  },
});
attempt('对不可扩展对象多报键', () => Object.keys(extraKeyProxy));
console.log('  -> 不变量保证了"代理不会破坏 JS 的对象模型"，');
console.log('     代价是代理无法完全自由地伪装 —— 这是设计取舍，不是 bug');

console.log('--- 8. 代理链：多层代理会成倍变慢 ---');

const baseObj = { x: 1 };
const layer1 = new Proxy(baseObj, { get: (t, k, r) => Reflect.get(t, k, r) });
const layer2 = new Proxy(layer1, { get: (t, k, r) => Reflect.get(t, k, r) });
const layer3 = new Proxy(layer2, { get: (t, k, r) => Reflect.get(t, k, r) });

console.log('三层代理的读取结果 =', layer3.x, '（结果正确，但每次读取要穿过 3 个陷阱）');

const CHAIN_N = 2_000_000;
function timeRead(obj) {
  const start = process.hrtime.bigint();
  let sum = 0;
  for (let i = 0; i < CHAIN_N; i += 1) sum += obj.x;
  return Number(process.hrtime.bigint() - start);
}

console.log(`  ${CHAIN_N.toLocaleString()} 次读取：原生 ${timeRead(baseObj)} ns / 一层 ${timeRead(layer1)} ns / 三层 ${timeRead(layer3)} ns`);
console.log('  -> 层数越多越慢，而且每层的 receiver 语义可能互相干扰，调试成本也成倍上升');
console.log('     实践中应尽量避免"代理的代理"，一个对象最多包一层');

console.log('--- 9. 什么时候不该用 Proxy ---');

const checklist = [
  ['对象里有 Map / Set / Date / RegExp / Promise / 定型数组', '改用包装类，或只代理外围的普通对象'],
  ['类里用了 # 私有字段', '不要代理实例，改为在类方法内部做日志/校验'],
  ['每秒被访问几十万次的热点数据', '不要代理，改用显式的函数调用'],
  ['需要被 JSON / 结构化克隆 / 跨线程传递', '不要代理，代理无法被序列化'],
  ['需要用对象本身作 Map/Set 的键', '不要代理，身份会变'],
  ['只是想"包装几个方法"', '直接写子类或包装类，更简单也更快'],
];

console.log('场景'.padEnd(44) + ' | 建议');
console.log('-'.repeat(100));
for (const [scene, advice] of checklist) {
  // 用固定分隔符，避免因为中英文字符宽度不一致导致列对不齐。
  console.log(scene.padEnd(44) + ' | ' + advice);
}

console.log('\n--- 10. 一句话总结 ---');
console.log('Proxy 擅长的是"普通数据对象的属性访问语义"（读、写、删、遍历）；');
console.log('它不擅长替代"对象本身的身份与内部状态"。');
console.log('用得对，它是响应式与 AOP 的利器；用错了，就是一堆 incompatible receiver 报错。');

console.log('\n全部演示完毕。');
