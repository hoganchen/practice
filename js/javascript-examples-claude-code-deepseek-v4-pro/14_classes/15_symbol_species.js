/**
 * ============================================================================
 * 知识点：Symbol.species —— 内置方法返回值类型的"出厂设置"与子类泄漏
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】高级
 * 【前置知识】14_classes/08_extends_builtins.js、14_classes/03_static_members.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Symbol.species 是一个静态的 getter，写在**构造函数**上，用来回答一个问题：
 *      "当你调用我的某个方法（map/filter/slice/concat...）而产生一个新对象时，
 *        这个新对象应该用哪个构造函数来造？"
 *    规范里这个询问过程叫 SpeciesConstructor(O, defaultConstructor)：
 *      1. 读 O.constructor 拿到构造器 C；
 *      2. 若 C 是 undefined → 用默认构造器（比如 Array）；
 *      3. 读 C[Symbol.species]，若为 null 或 undefined → 用默认构造器；
 *      4. 否则用 C[Symbol.species]，并校验它必须是可调用的构造器。
 *
 *    对内置类型来说，默认的 species 就是它自己：
 *      Array[Symbol.species] === Array
 *      Uint8Array[Symbol.species] === Uint8Array
 *      Promise[Symbol.species] === Promise
 *    所以 `sub.map(...)` 会去问 `sub.constructor[Symbol.species]`，
 *    而子类的 constructor 是子类自己 → 于是返回值也变成了子类。
 *    这个现象俗称**子类泄漏（subclass leakage）**。
 *
 * 2. 为什么需要
 *    · 只想要一点额外功能，不想让返回值"变味"：
 *        class SafeArray extends Array { 加几个校验方法 }
 *        SafeArray.from([1,2,3]).map(x => x * 2)
 *        // map 返回的却是 SafeArray，而调用者按普通数组用，处处意外
 *      覆写 species 返回 Array，就能"继承能力但不继承身份"。
 *    · 库作者尤其需要关心：把子类暴露给用户后，用户拿到的每个 map/filter 结果
 *      都是你的子类，可能触发你自定义的构造函数逻辑（甚至报错）。
 *    · extends Promise 是最经典的真实故障：
 *        class HttpClient extends Promise { constructor(executor, config) {...} }
 *        HttpClient.resolve(url).then(...)
 *        // then() 内部用 species 造新 promise → new HttpClient(executor)，
 *        // 你的 constructor 期待第二个参数 → 拿到 undefined → 静默出错或崩溃
 *    · 反过来，有时你就是**想要**子类泄漏：chainable 的集合包装类靠它实现链式调用。
 *
 * 3. 核心语法要点
 *    - 覆写方式（必须是静态 getter）：
 *        class MyArray extends Array {
 *          static get [Symbol.species]() { return Array; }
 *        }
 *    - 返回值可以是：另一个构造器（回退用）、null / undefined（表示"用默认构造器"）。
 *    - 读取是**动态**的：每次调用方法都会重新读一遍 species getter，不是缓存的。
 *    - 只读**构造函数上的** species，不读实例上的：obj[Symbol.species] 会被忽略。
 *    - species 构造器收到的参数只有**一个数字长度**（new C(len)），
 *      所以子类构造函数如果需要额外参数，拿到的一定是 undefined。
 *    - 哪些内置方法会用 species（记这四类就够）：
 *        Array：      concat / filter / flat / flatMap / map / slice / splice
 *        TypedArray： map / filter / slice / subarray
 *        Promise：    then / catch / finally
 *        RegExp：     [Symbol.split]（内部用于创建拆分器）
 *      **不**用 species 的：in-place 方法（push/pop/sort/reverse/fill/copyWithin）
 *      返回的是 this 本身；ES2023 的复制方法（toReversed/toSorted/toSpliced/with）
 *      一律返回**普通 Array**，刻意避开了 species 机制。
 *
 * 4. 常见陷阱
 *    - 写成实例 getter（`get [Symbol.species]()`）不生效，必须是 `static get`。
 *    - 以为 species 能影响 in-place 方法：sort() 返回的就是 this，与 species 无关。
 *    - species 返回不可调用的值（如 42）→ TypeError:
 *      "object.constructor[Symbol.species] is not a constructor"。
 *    - 继承 TypedArray 时 species 必须返回 TypedArray 类型，
 *      返回普通 Array 会 TypeError（方法内部要写回二进制缓冲区）。
 *    - Map / Set **定义**了 Symbol.species，但当前规范里没有任何内置方法读它，
 *      覆写它不会有任何效果（属于历史遗留的预留槽位）。
 *    - 子类泄漏的另一种修法是 ES5 时代的 `MyArray.prototype.constructor = Array`，
 *      但那是靠"篡改 constructor"实现的，语义更脏，还会影响 instanceof 相关的判断。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 14_classes/15_symbol_species.js
 *
 * 【预期输出】
 *   先复现子类泄漏现象，再用 species 修好；随后逐类演示 Array / TypedArray /
 *   Promise / RegExp / Map / Set / Buffer 的实际表现与各自的坑。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 默认的 species 就是"自己"
// ---------------------------------------------------------------------------

console.log('--- 0. 内置类型的默认 species ---');

// 逐个确认：内置构造器的 species 都指向它自身
const builtinSpecies = [
  ['Array', Array],
  ['Uint8Array', Uint8Array],
  ['ArrayBuffer', ArrayBuffer],
  ['Promise', Promise],
  ['RegExp', RegExp],
  ['Map', Map],
  ['Set', Set],
];
for (const [name, ctor] of builtinSpecies) {
  console.log(`  ${name.padEnd(12)} [Symbol.species] === 自身 → ${ctor[Symbol.species] === ctor}`);
}
console.log('  ↑ 正因为"默认返回自己"，继承之后 constructor 变成了子类，');
console.log('    于是所有走 species 的方法都会造出子类实例 —— 这就是子类泄漏的根源。');

console.log('\nSymbol.species 是一个 well-known symbol：', String(Symbol.species));
console.log('  它是"静态 getter"，必须写在构造函数上，不能写在实例上。');

// ---------------------------------------------------------------------------
// 1. 问题现场：继承 Array 之后 map 返回了什么
// ---------------------------------------------------------------------------

console.log('\n--- 1. 问题现场：子类泄漏 ---');

/** 一个只想加点小功能的数据容器 */
class MyArray extends Array {
  /** 额外能力：求和 */
  sum() {
    return this.reduce((a, b) => a + b, 0);
  }
}

const myArr = MyArray.from([1, 2, 3, 4]);

console.log('myArr 的类型：', myArr.constructor.name, '| instanceof MyArray：', myArr instanceof MyArray);
console.log('额外能力可用：myArr.sum() =', myArr.sum());

// 【关键现象】调用继承来的方法，返回值依然是 MyArray
console.log('\n继承来的方法返回什么类型：');
const methodResults = [
  ['map', myArr.map((x) => x * 2)],
  ['filter', myArr.filter((x) => x > 2)],
  ['slice', myArr.slice(0, 2)],
  ['concat', myArr.concat([5])],
  ['flat', myArr.flat()],
  ['flatMap', myArr.flatMap((x) => [x, x])],
];
for (const [name, result] of methodResults) {
  console.log(`  ${name.padEnd(9)} → ${result.constructor.name.padEnd(9)} instanceof MyArray：${result instanceof MyArray}`);
}
console.log('  ↑ 全都变成了 MyArray。这就是"子类泄漏"：');
console.log('    调用者以为拿到的是普通数组，实际上是带着自定义构造逻辑的子类实例。');

// 为什么这是"问题"？看下面这个更需要参数的子类
console.log('\n为什么这是问题 —— 换个需要构造参数的子类：');
/** 一个需要在构造时拿到"单位"的数组子类 */
class MeasuredArray extends Array {
  constructor(items, unit) {
    // 如果 items 是可迭代对象就展开它，否则当作长度
    super(...(Array.isArray(items) ? items : []));
    // 注意：species 调用时只传一个数字长度，unit 必然是 undefined
    this.unit = unit;
  }
  describe() {
    return `${this.length} 个元素，单位 = ${this.unit}`;
  }
}

const measured = new MeasuredArray([1, 2, 3], 'kg');
console.log('  手动构造：', measured.describe());

// 调用 map：species 造新对象时只传一个长度参数，unit 变成 undefined
const mapped = measured.map((x) => x * 2);
console.log('  map 之后：', mapped.describe(), '← unit 丢了！');
console.log('  ↑ 因为 SpeciesCreate 内部执行的是 new MeasuredArray(length)，');
console.log('    只有一个数字参数，第二个参数 unit 自然是 undefined。');
console.log('    如果构造函数里对 unit 做了非空校验，这里就会直接抛错 —— 线上事故的常见形态。');

// ---------------------------------------------------------------------------
// 2. 修法一：覆写 Symbol.species
// ---------------------------------------------------------------------------

console.log('\n--- 2. 修法一：覆写 Symbol.species ---');

/** 加了 species 覆写的数据容器：对外表现就是普通数组 */
class SafeArray extends Array {
  static get [Symbol.species]() {
    // 关键一行：让"派生新对象"时用 Array，而不是 SafeArray
    return Array;
  }
  sum() {
    return this.reduce((a, b) => a + b, 0);
  }
}

const safeArr = SafeArray.from([1, 2, 3, 4]);
console.log('safeArr 自己仍然是 SafeArray：', safeArr.constructor.name, '|', safeArr instanceof SafeArray);
console.log('但它自己的 sum() 依然可用：', safeArr.sum());

console.log('\n覆写 species 之后，各方法的返回值类型：');
for (const [name, result] of [
  ['map', safeArr.map((x) => x * 2)],
  ['filter', safeArr.filter((x) => x > 2)],
  ['slice', safeArr.slice(0, 2)],
  ['concat', safeArr.concat([5])],
  ['flat', safeArr.flat()],
  ['flatMap', safeArr.flatMap((x) => [x, x])],
]) {
  console.log(`  ${name.padEnd(9)} → ${result.constructor.name.padEnd(9)} instanceof SafeArray：${result instanceof SafeArray}`);
}
console.log('  ↑ 全部变回普通 Array。这正是"继承能力，但不继承身份"的效果。');

// 对照实验：不覆写 vs 覆写
console.log('\n对照实验：');
console.log('  不覆写：MyArray.from([1]).map(x=>x) 是', MyArray.from([1]).map((x) => x).constructor.name);
console.log('  覆写后：SafeArray.from([1]).map(x=>x) 是', SafeArray.from([1]).map((x) => x).constructor.name);

// ---------------------------------------------------------------------------
// 3. species 的取值规则
// ---------------------------------------------------------------------------

console.log('\n--- 3. species 的取值规则 ---');

// 规则：species 可以是构造器、null、undefined 或干脆不写。
// 除了"另一个构造器"，null / undefined 都表示"用默认构造器"。

/** 明确返回 null：表示"别用我，用默认的" */
class NullSpeciesArray extends Array {
  static get [Symbol.species]() {
    return null;
  }
}
/** 明确返回 undefined：同上 */
class UndefSpeciesArray extends Array {
  static get [Symbol.species]() {
    return undefined;
  }
}
/** 返回另一个构造器：结果会用那个构造器来造 */
class OtherBase extends Array {}
class RedirectArray extends Array {
  static get [Symbol.species]() {
    return OtherBase;
  }
}
/** 返回不可调用的值：应当报错 */
class BadSpeciesArray extends Array {
  static get [Symbol.species]() {
    return 42;
  }
}

console.log('各种返回值的实际效果：');
console.log('  返回 null      → map 得到', NullSpeciesArray.from([1]).map((x) => x).constructor.name);
console.log('  返回 undefined → map 得到', UndefSpeciesArray.from([1]).map((x) => x).constructor.name);
console.log('  返回 OtherBase → map 得到', RedirectArray.from([1]).map((x) => x).constructor.name);
try {
  console.log('  返回 42        → map 得到', BadSpeciesArray.from([1]).map((x) => x).constructor.name);
} catch (err) {
  console.log('  返回 42        → 抛出：', err.constructor.name, '-', err.message);
}
console.log('  ↑ null / undefined 都退化成"默认构造器"，');
console.log('    返回别的构造器则会让新对象变成那个类型（可以把返回值"重定向"）。');

// ---------------------------------------------------------------------------
// 4. 必须写成静态 getter，且每次都会重新读取
// ---------------------------------------------------------------------------

console.log('\n--- 4. 静态 getter 与"动态读取" ---');

// 用 defineProperty 也能挂 species（本质上就是一个普通的访问器属性）
class ViaDefineProperty extends Array {}
Object.defineProperty(ViaDefineProperty, Symbol.species, {
  get() {
    return Array;
  },
  configurable: true,
});
console.log('用 Object.defineProperty 覆写：', ViaDefineProperty.from([1]).map((x) => x).constructor.name);

// 验证"每次调用都重新读"，而不是一次性缓存
let speciesReadCount = 0;
class CountingArray extends Array {
  static get [Symbol.species]() {
    // 每次被读取就计数
    speciesReadCount++;
    return Array;
  }
}
console.log('\nspecies getter 读取次数：');
const countedArr = CountingArray.from([1, 2, 3]);
console.log('  构造出实例后：', speciesReadCount, '次（Array.from 用的是 this，不读 species）');
countedArr.map((x) => x);
console.log('  调用 map 之后：', speciesReadCount, '次');
countedArr.filter(() => true);
console.log('  再调用 filter 之后：', speciesReadCount, '次');
countedArr.slice();
console.log('  再调用 slice 之后：', speciesReadCount, '次');
console.log('  ↑ 每次都重新读。所以 species 可以做成"根据运行期状态动态决定返回值"的。');

// 动态 species：根据条件切换返回类型
let useStrictMode = false;
class AdaptiveArray extends Array {
  static get [Symbol.species]() {
    // 按运行期开关决定返回哪一类
    return useStrictMode ? Array : AdaptiveArray;
  }
}
const adaptive = AdaptiveArray.from([1, 2]);
console.log('\n动态 species：');
console.log('  开关为 false 时 →', adaptive.map((x) => x).constructor.name);
useStrictMode = true;
console.log('  开关改为 true 后 →', adaptive.map((x) => x).constructor.name);
console.log('  ↑ 同一个方法、同一个实例，返回值类型随开关变化 —— 证明读取是动态的。');

// 提醒：只读构造器上的 species，实例上的会被忽略
console.log('\n实例上挂 Symbol.species 是无效的：');
const instanceWithSpecies = MyArray.from([1]);
instanceWithSpecies[Symbol.species] = Array; // 挂在实例上
console.log('  实例上设了 species 后，map 依然返回：', instanceWithSpecies.map((x) => x).constructor.name);
console.log('  ↑ 因为 SpeciesConstructor 读的是 O.constructor[Symbol.species]，不是 O[Symbol.species]。');

// ---------------------------------------------------------------------------
// 5. 哪些方法走 species，哪些不走
// ---------------------------------------------------------------------------

console.log('\n--- 5. 哪些方法走 species ---');

const probe = MyArray.from([3, 1, 2]);

console.log('走 species 的方法（返回"新对象"）：');
for (const [name, getResult] of [
  ['map', () => probe.map((x) => x)],
  ['filter', () => probe.filter(() => true)],
  ['slice', () => probe.slice()],
  ['concat', () => probe.concat([])],
  ['flat', () => probe.flat()],
  ['flatMap', () => probe.flatMap((x) => [x])],
  ['splice', () => probe.splice(0, 0)],
]) {
  const r = getResult();
  console.log(`  ${name.padEnd(9)} → ${r.constructor.name.padEnd(9)} 是新对象：${r !== probe}`);
}

console.log('\n不走 species 的方法：');
// in-place 方法返回的是 this 自身，类型当然还是 MyArray，但这与 species 无关
for (const [name, getResult] of [
  ['sort', () => probe.sort()],
  ['reverse', () => probe.reverse()],
  ['fill', () => probe.fill(0)],
  ['copyWithin', () => probe.copyWithin(0, 1)],
]) {
  const r = getResult();
  console.log(`  ${name.padEnd(22)} 返回的是 this 自身：${r === probe}`);
}
// 注意 push / unshift 是特例：它们虽然也原地修改，但返回值是"新长度"这个数字
console.log(`  ${'push'.padEnd(22)} 返回的是新长度：${probe.push(4)}（数字，不是数组）`);
console.log('  ↑ sort / reverse / fill / copyWithin 返回 this，与 species 无关；');
console.log('    push / unshift 原地修改但返回数字长度，更不会新建对象。');

console.log('\nES2023 的复制方法（刻意不走 species，一律返回普通 Array）：');
const probe2 = MyArray.from([3, 1, 2]);
for (const [name, r] of [
  ['toReversed', probe2.toReversed()],
  ['toSorted', probe2.toSorted()],
  ['toSpliced', probe2.toSpliced(0, 0)],
  ['with', probe2.with(0, 9)],
]) {
  console.log(`  ${name.padEnd(11)} → ${r.constructor.name}`);
}
console.log('  ↑ 这是 TC39 有意为之：新方法设计时吸取了"子类泄漏"的教训，');
console.log('    明确返回普通 Array，不再走 species 机制。');
console.log('    所以同一个子类上，map 返回子类而 toReversed 返回普通数组，行为并不一致。');

// ---------------------------------------------------------------------------
// 6. TypedArray：species 必须返回 TypedArray
// ---------------------------------------------------------------------------

console.log('\n--- 6. TypedArray 上的 species ---');

class MyUint8 extends Uint8Array {}

const myU8 = MyUint8.from([1, 2, 3]);
console.log('Uint8Array 子类的各方法返回值：');
for (const [name, r] of [
  ['map', myU8.map((x) => x)],
  ['filter', myU8.filter(() => true)],
  ['slice', myU8.slice(0, 1)],
  ['subarray', myU8.subarray(0, 1)],
]) {
  console.log(`  ${name.padEnd(9)} → ${r.constructor.name.padEnd(11)} instanceof MyUint8：${r instanceof MyUint8}`);
}
console.log('  ↑ 和 Array 一样会泄漏。注意 subarray 只在 TypedArray 上存在，它也走 species。');

// ES2023 的复制方法对 TypedArray 同样不走 species
console.log('\nTypedArray 的复制方法：');
console.log('  toReversed →', myU8.toReversed().constructor.name, '← 返回基类 Uint8Array');

// 修法：species 指向基类
class SafeUint8 extends Uint8Array {
  static get [Symbol.species]() {
    return Uint8Array;
  }
}
console.log('\n覆写 species 后：');
const safeU8 = SafeUint8.from([1, 2, 3]);
for (const [name, r] of [
  ['map', safeU8.map((x) => x)],
  ['filter', safeU8.filter(() => true)],
  ['slice', safeU8.slice(0, 1)],
  ['subarray', safeU8.subarray(0, 1)],
]) {
  console.log(`  ${name.padEnd(9)} → ${r.constructor.name}`);
}

// 踩坑：species 返回普通 Array
console.log('\n踩坑：species 返回普通 Array');
class BadTypedSpecies extends Uint8Array {
  static get [Symbol.species]() {
    return Array;
  }
}
try {
  console.log('  map 结果：', BadTypedSpecies.from([1, 2]).map((x) => x));
} catch (err) {
  console.log('  抛出：', err.constructor.name, '-', err.message);
}
console.log('  ↑ TypedArray 的方法内部需要往"二进制缓冲区"里写数据，');
console.log('    而普通 Array 没有这个能力，所以直接报"不兼容的接收者"。');

// 换成另一个 TypedArray 类型则是允许的
class CrossTypedSpecies extends Uint8Array {
  static get [Symbol.species]() {
    return Uint16Array;
  }
}
console.log('\n换成另一个 TypedArray 类型（Uint16Array）是允许的：');
console.log('  map 结果类型：', CrossTypedSpecies.from([1, 2]).map((x) => x).constructor.name);
console.log('  ↑ 只要还是 TypedArray 家族就行，规范只要求"是个 TypedArray 构造器"。');

// BigInt 与 Number 的 TypedArray 不能混
class BigIntCrossSpecies extends BigInt64Array {
  static get [Symbol.species]() {
    return Uint8Array;
  }
}
try {
  console.log('\nBigInt64Array 的 species 指向 Uint8Array：', BigIntCrossSpecies.from([1n]).map((x) => x));
} catch (err) {
  console.log('\nBigInt64Array 的 species 指向 Uint8Array → 抛出：', err.constructor.name);
}
console.log('  ↑ BigInt 与 Number 的 TypedArray 之间不能互转，即使同属 TypedArray 家族。');

// ---------------------------------------------------------------------------
// 7. Promise：真实世界的经典故障
// ---------------------------------------------------------------------------

console.log('\n--- 7. Promise：最经典的真实故障 ---');

/**
 * 一个"带上下文"的 Promise 子类。
 * 场景：想在链式调用中一路携带配置（超时、重试次数、请求 id）。
 */
class ContextPromise extends Promise {
  constructor(executor, context) {
    super(executor);
    // 这里假设 context 是必填的
    this.context = context ?? { warn: 'context 丢失了' };
  }
}

// 正常构造时 context 是我们给的
const withContext = new ContextPromise((resolve) => resolve(1), { id: 'req-001' });
console.log('手动构造：context =', withContext.context);

// 但 then() 内部会用 species 造新 promise，且只传 executor
const chained = ContextPromise.resolve(1).then((v) => v + 1);
console.log('then() 返回的类型：', chained.constructor.name, '| context =', chained.context);
console.log('  ↑ then() 返回的居然是 ContextPromise，这就是子类泄漏；');
console.log('    而且它是 species 造出来的，第二个参数 context 拿到的是 undefined。');
console.log('    如果构造函数里对 context 做了强校验（比如 context.id 会抛错），');
console.log('    那么任何一次 .then() 都会炸 —— 这就是线上常见的事故形态。');

// 修法：把 species 指回 Promise
console.log('\n修法：覆写 species 让 then() 返回普通 Promise');
class SafeContextPromise extends Promise {
  static get [Symbol.species]() {
    // 关键：链式派生时用原生 Promise，不再携带子类身份
    return Promise;
  }
  constructor(executor, context) {
    super(executor);
    this.context = context;
  }
}
const safeChained = SafeContextPromise.resolve(1).then((v) => v + 1);
console.log('  then() 返回的类型：', safeChained.constructor.name);
console.log('  instanceof SafeContextPromise：', safeChained instanceof SafeContextPromise, '← 已经是普通 Promise');
// 而自己手动构造的实例仍然带着 context
const stillContextual = new SafeContextPromise((resolve) => resolve(1), { id: 'req-002' });
console.log('  手动构造的实例仍然是 SafeContextPromise：', stillContextual.constructor.name, '| context =', JSON.stringify(stillContextual.context));
console.log('  ↑ 效果：自己 new 出来的实例保留子类身份与附加数据，');
console.log('    链式派生出来的中间对象回归普通 Promise，避免下游踩到你的构造逻辑。');

// 验证一个常见误解：resolve / reject / all 这些静态方法用的是 this，不是 species
console.log('\n常见误解：静态方法用的是 this，不是 species');
class StaticProbe extends Promise {}
console.log('  StaticProbe.resolve(1) 的类型：', StaticProbe.resolve(1).constructor.name);
console.log('  （它用的是 this=StaticProbe，与 species 无关）');
console.log('  所以覆写 species 不会影响 resolve/all/race 的返回类型，只影响 then/catch/finally 的派生。');
console.log('  实测：SafeContextPromise.resolve(1).constructor.name =',
  SafeContextPromise.resolve(1).constructor.name, '← 它由 this 决定，没走 species');
console.log('        同一个类的 .then() 返回的却是 Promise ← 由 species 决定');

// ---------------------------------------------------------------------------
// 8. RegExp：species 在这里也有用
// ---------------------------------------------------------------------------

console.log('\n--- 8. RegExp 上的 species ---');

// 规范里 RegExp.prototype[Symbol.split] 内部用 SpeciesConstructor 创建拆分器。
class MyRegExp extends RegExp {}
const myRe = new MyRegExp(',');
console.log('RegExp 子类：', myRe.constructor.name, '| 匹配 "a,b" 结果类型仍是数组：', Array.isArray('a,b'.split(myRe)));
console.log('  split 的返回永远是数组，species 影响的是"内部用来扫描的拆分器对象"。');

class SafeRegExp extends RegExp {
  static get [Symbol.species]() {
    return RegExp;
  }
}
console.log('覆写 species 为 RegExp 后 split 依然正常：', JSON.stringify('a,b,c'.split(new SafeRegExp(','))));
console.log('  ↑ RegExp 的 species 只影响内部实现，日常几乎观察不到差异；');
console.log('    但如果你继承了 RegExp 并自定义了构造函数逻辑，就需要注意它会被 split 触发。');

// 触发验证：给子类构造函数加副作用，看 split 是否真的会用 species 造对象
console.log('\n验证 split 确实会经过 species：');
let regExpSpeciesHits = 0;
class LoudRegExp extends RegExp {
  static get [Symbol.species]() {
    regExpSpeciesHits++;
    return RegExp;
  }
}
'a,b,c'.split(new LoudRegExp(','));
console.log('  split 过程中 species 被读取了', regExpSpeciesHits, '次 → 说明确实走了 SpeciesConstructor。');

// ---------------------------------------------------------------------------
// 9. Map / Set：定义了 species，但没人用
// ---------------------------------------------------------------------------

console.log('\n--- 9. Map / Set：定义了但没人读 ---');

console.log('Map[Symbol.species] === Map：', Map[Symbol.species] === Map);
console.log('Set[Symbol.species] === Set：', Set[Symbol.species] === Set);
console.log('  ↑ 规范确实在 Map / Set 上定义了 Symbol.species，');
console.log('    但**目前没有任何内置方法读取它** —— 属于历史遗留的预留槽位。');

// 实证：覆写 species 后行为完全不变
class MyMap extends Map {
  static get [Symbol.species]() {
    return Map;
  }
}
const mm = new MyMap([['a', 1]]);
console.log('\n覆写 Map 的 species 后：');
console.log('  new MyMap(...) 仍然是 MyMap：', mm.constructor.name);
console.log('  Map 的方法（get/set/keys/entries）都返回已有对象或迭代器，不新建 Map 实例，');
console.log('    所以 species 在这里没有可以发挥作用的调用点。');
console.log('  结论：Map / Set 的 species 覆写是无效操作，不要在它们身上浪费时间。');

// 真正需要"不泄漏"的集合子类，得手写返回基类的方法
console.log('\n如果确实需要"集合子类的方法返回基类"，只能手写：');
class SafeSet extends Set {
  /** 手写一个"派生但不泄漏"的方法 */
  doubled() {
    // 显式返回普通 Set，而不是依赖 species
    const out = new Set();
    for (const v of this) out.add(v * 2);
    return out;
  }
}
const safeSet = new SafeSet([1, 2, 3]);
console.log('  SafeSet.doubled() 返回：', safeSet.doubled().constructor.name, JSON.stringify([...safeSet.doubled()]));

// ---------------------------------------------------------------------------
// 10. Buffer 上的实际表现
// ---------------------------------------------------------------------------

console.log('\n--- 10. Buffer 上的实际表现 ---');

console.log('Buffer 继承自 Uint8Array：', Object.getPrototypeOf(Buffer) === Uint8Array);
console.log('Buffer[Symbol.species] 存在：', typeof Buffer[Symbol.species] === 'function');
console.log('Buffer[Symbol.species].name =', Buffer[Symbol.species].name, '← 注意它不是 Buffer 自己！');
console.log('Buffer[Symbol.species] === Buffer：', Buffer[Symbol.species] === Buffer);
console.log('但两者的 prototype 是同一个：', Buffer.prototype === Buffer[Symbol.species].prototype);
console.log('  ↑ 这是 Node 的实现细节：species 指向内部的 FastBuffer，');
console.log('    两个函数对象不同，但共享同一个 prototype，所以 instanceof Buffer 仍然成立。');

const buf = Buffer.from([1, 2, 3, 4]);
console.log('\nBuffer 各方法的返回值：');
for (const [name, r] of [
  ['map', buf.map((x) => x * 2)],
  ['filter', buf.filter((x) => x > 1)],
  ['slice', buf.slice(0, 2)],
  ['subarray', buf.subarray(0, 2)],
]) {
  console.log(`  ${name.padEnd(9)} → ${r.constructor.name.padEnd(11)} instanceof Buffer：${r instanceof Buffer} | instanceof Uint8Array：${r instanceof Uint8Array}`);
}
console.log('  ↑ 全都返回 Buffer（不是普通 Uint8Array），因为 species 指向的 FastBuffer');
console.log('    与 Buffer 共享 prototype，instanceof Buffer 判定为 true。');

// 重要提醒：Buffer 的构造函数是废弃的，而且继承它没有实际意义
console.log('\n⚠️ 重要提醒：不要继承 Buffer');
// 语法上确实可以定义子类（不会报错），但行为不符合预期
class MyBuffer extends Buffer {}
console.log('  class MyBuffer extends Buffer {} 定义成功（语法上允许）');
// 但 Buffer 的静态工厂是"硬编码返回 Buffer"的，不认子类
const fromSubclass = MyBuffer.from([1, 2, 3]);
console.log('  MyBuffer.from([1,2,3]) 的 constructor：', fromSubclass.constructor.name);
console.log('  instanceof MyBuffer：', fromSubclass instanceof MyBuffer, '| instanceof Buffer：', fromSubclass instanceof Buffer);
console.log('  ↑ 明明是从子类上调用，拿到的却是普通 Buffer —— 子类身份直接丢了。');
console.log('    因为这些静态工厂在实现里写死了 Buffer，不走 this / species 那一套。');
console.log('  另外 new Buffer(...) 已被废弃，运行时会打印 DeprecationWarning，绝不要再用。');
console.log('  正确做法：需要二进制数据时用 Buffer.from(...) / Buffer.alloc(...)；');
console.log('    真要做"自定义的二进制容器子类"，请继承 Uint8Array 并自己管理缓冲区。');

// 自己继承 Uint8Array 是可行且推荐的
console.log('\n推荐做法：继承 Uint8Array 并配合 species');
class SafeBufferLike extends Uint8Array {
  static get [Symbol.species]() {
    return Uint8Array;
  }
  /** 自定义的十六进制展示 */
  toHex() {
    return Array.from(this, (b) => b.toString(16).padStart(2, '0')).join('');
  }
}
const sb = SafeBufferLike.from([0xde, 0xad, 0xbe, 0xef]);
console.log('  sb.toHex() =', sb.toHex());
console.log('  sb.map(x=>x).constructor.name =', sb.map((x) => x).constructor.name, '← 不泄漏');
console.log('  自己仍是子类：', sb.constructor.name, '|', sb instanceof SafeBufferLike);

// ---------------------------------------------------------------------------
// 11. 另一种修法（不推荐）：篡改 prototype.constructor
// ---------------------------------------------------------------------------

console.log('\n--- 11. 另一种修法：篡改 prototype.constructor ---');

// SpeciesConstructor 的第一步是读 O.constructor，
// 所以把子类的 prototype.constructor 改成 Array，也能达到同样效果。
class LegacyArray extends Array {}
LegacyArray.prototype.constructor = Array; // ES5 时代的老套路

const legacy = LegacyArray.from([1, 2, 3]);
console.log('改 prototype.constructor 之后：');
console.log('  legacy.constructor.name =', legacy.constructor.name, '← 实例上看已经不是 LegacyArray');
console.log('  legacy instanceof LegacyArray =', legacy instanceof LegacyArray, '← 但原型链没变，instanceof 依然是 true');
console.log('  legacy.map(...).constructor.name =', legacy.map((x) => x).constructor.name);

console.log('\n两种修法对比：');
console.log('  · 篡改 prototype.constructor：能阻止泄漏，但会破坏"实例的 constructor 指向"这一不变量，');
console.log('    instanceof 与 constructor 的判断结果互相矛盾，调试时非常迷惑。');
console.log('  · 覆写 static get [Symbol.species]()：语义清晰、只影响物种派生，其余行为不动。✅ 推荐');

// ---------------------------------------------------------------------------
// 12. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 12. 小结 ---');

console.log('1) Symbol.species 是构造函数上的静态 getter，回答"派生新对象时用哪个构造器"。');
console.log('2) 默认返回自身（Array[Symbol.species] === Array），');
console.log('     所以继承内置类型后，map/filter/slice 等会返回子类实例 —— 子类泄漏。');
console.log('3) 修法：class X extends Array { static get [Symbol.species]() { return Array; } }');
console.log('     返回 null / undefined 同样表示"用默认构造器"。');
console.log('4) species 构造器只收到**一个数字长度参数**，子类的其它构造参数必为 undefined。');
console.log('5) 读取是动态的：每次调用方法都会重新读 species getter，可用来做运行期动态切换。');
console.log('6) 只读构造器上的 species，实例上挂 Symbol.species 无效。');
console.log('7) 走 species 的内置方法：');
console.log('     Array      → concat / filter / flat / flatMap / map / slice / splice');
console.log('     TypedArray → map / filter / slice / subarray');
console.log('     Promise    → then / catch / finally');
console.log('     RegExp     → [Symbol.split]');
console.log('     不走 species：in-place 方法（push/sort/reverse/fill/copyWithin，返回 this）；');
console.log('     ES2023 复制方法（toReversed/toSorted/toSpliced/with）一律返回普通 Array。');
console.log('8) TypedArray 的 species 必须返回 TypedArray 家族（且不能 BigInt/Number 混用），');
console.log('     返回普通 Array 会 TypeError。');
console.log('9) Promise 是最容易踩坑的场景：extends Promise 后 then() 会派生你的子类，');
console.log('     构造参数校验一严就会连环报错；覆写 species 返回 Promise 即可止血。');
console.log('10) Map / Set 定义了 species 但没有任何内置方法读它，覆写无效。');
console.log('11) Buffer 的 species 指向内部的 FastBuffer（与 Buffer 共享 prototype），');
console.log('     所以 map/filter/slice/subarray 都返回 Buffer 且 instanceof Buffer 为 true；');
console.log('     但 Buffer 的静态工厂写死了返回 Buffer，子类化没有意义，也不该用 new Buffer()。');
console.log('12) 相关阅读：14_classes/08_extends_builtins.js（继承内置类型的通用问题）。');

console.log('\n全部演示完毕。');
