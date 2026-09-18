/**
 * ============================================================================
 * 知识点：Object.create —— 直接指定原型，简洁的原型继承
 * ============================================================================
 *
 * 【所属分类】16_prototype —— 原型与原型链
 * 【难度等级】入门
 * 【前置知识】16_prototype/04_inheritance_es5.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Object.create(proto, propertiesObject) 创建一个新对象，并把它的
 *    [[Prototype]] 直接设为 proto。它把"设置原型"这件事变成一步完成的构造，
 *    不需要先创建再改。
 *
 * 2. 为什么需要
 *    - 只做原型继承，不执行任何构造函数逻辑 —— 比 `new Parent()` 干净。
 *    - 想要"没有原型"的纯净字典（Object.create(null)），避免原型上的键干扰。
 *    - 属性描述符可以通过第二个参数一次性定义，适合需要精细控制的场景。
 *    - 这就是 ES5 里实现继承时"设置原型链"的标准写法（见 04 节）。
 *
 * 3. 核心语法要点
 *    - 参数：proto 必须是对象或 null，否则抛 TypeError。
 *        Object.create(null) → 完全没有原型的对象（连 toString 都没有）
 *        Object.create({})   → 原型是一个空对象
 *    - 第二个参数与 Object.defineProperties 格式一致：
 *        { key: { value, writable, enumerable, configurable } }
 *      注意：用它定义的属性默认**不可写、不可枚举、不可配置**，
 *      这一点与普通赋值相反，非常容易踩坑。
 *    - 与其它创建方式的对比：
 *        {} / new Object()          → 原型是 Object.prototype
 *        Object.create(proto)       → 原型是 proto，不执行任何构造函数
 *        new Fn()                   → 建对象 + 挂 Fn.prototype + 执行 Fn 函数体
 *        class 的实例               → 同 new Fn()
 *    - Object.create 常用于"经典原型式继承"：
 *        function inherit(proto) { return Object.create(proto); }
 *    - 也可以用 Object.setPrototypeOf 事后改原型，但性能更差，尽量用 create。
 *
 * 4. 常见陷阱
 *    - 第二个参数里忘写 writable: true，导致属性无法修改（严格模式报错）。
 *    - 第二个参数里忘写 enumerable: true，导致 Object.keys / JSON.stringify 看不到。
 *    - 把 proto 传成原始值（数字、字符串）→ TypeError。
 *    - Object.create(null) 得到的对象没有 hasOwnProperty，
 *      用 obj.hasOwnProperty(x) 会报错，应改成 Object.hasOwn(obj, x)。
 *    - 用 Object.create 创建的对象不是任何构造函数的实例（instanceof 为 false）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 16_prototype/05_object_create.js
 *
 * 【预期输出】
 *   演示 Object.create 的各种用法、参数细节、与其它创建方式的差异。
 * ============================================================================
 */

console.log('--- 1. 最基础用法：指定原型 ---');

const base = {
  kind: '基础对象',
  describe() {
    return `我是 ${this.name ?? '(未命名)'}，来自「${this.kind}」`;
  },
};

const derived = Object.create(base);
// 自有属性
derived.name = '派生对象';

console.log('derived.name（自有）→', derived.name);
console.log('derived.kind（继承）→', derived.kind);
console.log('derived.describe() →', derived.describe());
console.log('原型指向正确吗？', Object.getPrototypeOf(derived) === base);
console.log('派生对象是 base 的实例吗？', base.isPrototypeOf(derived));

// 两者是不同的对象，互不影响
console.log('derived 有自有 kind 吗？', Object.hasOwn(derived, 'kind'), '（没有，是继承的）');
console.log('Object.keys(derived) =', JSON.stringify(Object.keys(derived)), '（只有自有的）');

console.log('--- 2. Object.create(null)：纯净的字典 ---');

// 这种对象没有原型，适合做"哈希表 / 缓存"，不会撞上 Object.prototype 的键
const pureDict = Object.create(null);
pureDict.toString = '我是一条数据，不是方法';
pureDict.hasOwnProperty = '同理，我可以安全地使用这些名字';

console.log('原型是：', Object.getPrototypeOf(pureDict));
console.log('能读到 toString 吗？', pureDict.toString);
console.log('typeof pureDict.toString =', typeof pureDict.toString, '（是字符串，不是函数）');

// 对比普通对象：同名键会和方法冲突
const normalDict = {};
normalDict.toString = '覆盖了原型上的 toString';
console.log('普通对象也能覆盖，但它的原型上还藏着很多键：', typeof normalDict.hasOwnProperty);

// 经典陷阱：用普通对象做缓存时，'toString' 这样的键会永远"存在"
const cache = {};
const pureCache = Object.create(null);
console.log("普通对象 cache['toString'] 存在吗？", 'toString' in cache, '（永远为 true，危险）');
console.log("纯净字典 pureCache['toString'] 存在吗？", 'toString' in pureCache, '（干净）');

// 但纯净字典没有 hasOwnProperty
try {
  pureDict.hasOwnProperty('toString');
} catch (err) {
  console.log('纯净字典调用 hasOwnProperty 报错：', err.constructor.name, '—', err.message);
}
console.log('应当改用 Object.hasOwn：', Object.hasOwn(pureDict, 'toString'));

console.log('--- 3. 第二个参数：属性描述符 ---');

// 注意默认值：不可写、不可枚举、不可配置
const withDescriptors = Object.create(base, {
  id: {
    value: 42,
    // 这里显式开启可枚举与可写
    writable: true,
    enumerable: true,
    configurable: true,
  },
  // 不写 writable/enumerable，就是默认的"三不"属性
  sealedValue: {
    value: '我不可写、不可枚举',
  },
  // 也可以定义访问器
  doubled: {
    get() {
      return this.id * 2;
    },
    enumerable: true,
  },
});

console.log('id =', withDescriptors.id);
console.log('doubled（访问器）=', withDescriptors.doubled);
console.log('Object.keys =', JSON.stringify(Object.keys(withDescriptors)), '（sealedValue 不可枚举，看不到）');
console.log('所有自有属性名 =', JSON.stringify(Object.getOwnPropertyNames(withDescriptors)));
console.log('sealedValue 的描述符 =', JSON.stringify(
  Object.getOwnPropertyDescriptor(withDescriptors, 'sealedValue'),
));

// 不可写属性在严格模式下赋值会抛错
try {
  withDescriptors.sealedValue = '试图修改';
} catch (err) {
  console.log('给不可写属性赋值报错：', err.constructor.name, '—', err.message);
}
// 可写属性正常
withDescriptors.id = 100;
console.log('修改 id 后 doubled =', withDescriptors.doubled);

console.log('--- 4. 与其它创建方式的对比 ---');

function Ctor() {
  this.own = '构造函数里设置的';
}
Ctor.prototype.fromProto = '原型上的';

const byLiteral = { own: '字面量' };
const byNew = new Ctor();
const byCreate = Object.create(Ctor.prototype);
byCreate.own = 'Object.create 设置的';

const comparison = [
  ['字面量 {}', byLiteral],
  ['new Ctor()', byNew],
  ['Object.create(Ctor.prototype)', byCreate],
];
console.log('  方式                            原型                      执行了构造函数吗   instanceof Ctor');
for (const [label, value] of comparison) {
  const protoName = Object.getPrototypeOf(value) === Object.prototype
    ? 'Object.prototype'
    : (Object.getPrototypeOf(value) === Ctor.prototype ? 'Ctor.prototype' : '其它');
  const ranCtor = Object.hasOwn(value, 'own') && value.own === '构造函数里设置的';
  console.log(
    `  ${label.padEnd(30)} ${protoName.padEnd(24)} ${String(ranCtor).padEnd(16)} ${value instanceof Ctor}`,
  );
}
console.log('小结：Object.create 只设原型，不执行构造函数，所以不会带上构造函数里的属性。');

console.log('--- 5. 用 Object.create 实现"原型式继承" ---');

// 这是 ES5 里非常常见的封装
function inheritFrom(proto, ownProps = {}) {
  const obj = Object.create(proto);
  Object.assign(obj, ownProps);
  return obj;
}

const vehicle = {
  wheels: 4,
  describe() {
    return `${this.brand} 有 ${this.wheels} 个轮子`;
  },
};

const car = inheritFrom(vehicle, { brand: '某品牌' });
const bike = inheritFrom(vehicle, { brand: '某自行车', wheels: 2 });
console.log(car.describe());
console.log(bike.describe());
console.log('car 有自有 wheels 吗？', Object.hasOwn(car, 'wheels'), '（没有，用的是继承来的 4）');
console.log('bike 有自有 wheels 吗？', Object.hasOwn(bike, 'wheels'), '（有，自己覆盖成了 2）');

// 共享同一个原型，所以方法只有一份
console.log('两个对象共享 describe 吗？', car.describe === bike.describe);

console.log('--- 6. Object.create 与 class 继承的关系 ---');

// 04 节里讲过：class 的 extends 底层就是在做这件事
class ParentClass {
  greet() {
    return '父类问候';
  }
}
// 手工用 Object.create 复现一个"继承自 ParentClass 的对象"
const manualChild = Object.create(ParentClass.prototype);
console.log('手工造的对象 instanceof ParentClass 吗？', manualChild instanceof ParentClass);
console.log('能用父类方法吗？', manualChild.greet(), '（可以，原型链是通的）');
console.log('但它的 constructor 是：', manualChild.constructor.name, '（这点与真正的子类实例相同）');

console.log('--- 7. 性能建议 ---');

const perf = [
  '创建时就确定原型 → 用 Object.create（快）。',
  '创建后再改原型 → Object.setPrototypeOf（慢，会破坏引擎优化，尽量避免）。',
  '需要执行初始化逻辑 → 用 new / class。',
  '需要纯净字典 → Object.create(null)（同时要改用 Object.hasOwn 判断键）。',
];
for (const line of perf) console.log('  •', line);

console.log('--- 8. 参数校验（try/catch 演示） ---');

// proto 必须是对象或 null，传原始值（除了 null）都会抛 TypeError
for (const bad of [undefined, 1, 'abc', true]) {
  try {
    Object.create(bad);
    console.log(`  Object.create(${JSON.stringify(bad)}) → 成功（意外）`);
  } catch (err) {
    console.log(`  Object.create(${JSON.stringify(bad)}) → ${err.constructor.name}：${err.message}`);
  }
}
// null 是合法且常用的 proto 值（表示"没有原型"）
try {
  const pure = Object.create(null);
  console.log('  Object.create(null) → 成功，原型 =', Object.getPrototypeOf(pure));
} catch (err) {
  console.log('  Object.create(null) → 意外报错：', err.message);
}
console.log('注意：null 是合法的 proto（表示没有原型），undefined 才报错。');

console.log('\n全部演示完毕。');
