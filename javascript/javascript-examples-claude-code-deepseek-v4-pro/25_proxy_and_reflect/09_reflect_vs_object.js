/**
 * ============================================================================
 * 知识点：Reflect 与 Object 同名方法的差异 —— 返回值、抛错与类型强转
 * ============================================================================
 *
 * 【所属分类】25_proxy_and_reflect —— 元编程：拦截对象的基本操作
 * 【难度等级】进阶
 * 【前置知识】25_proxy_and_reflect/08_reflect_api.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Object 和 Reflect 上有一部分**同名**方法，例如 defineProperty、
 *    getOwnPropertyDescriptor、getPrototypeOf、setPrototypeOf、
 *    isExtensible、preventExtensions。
 *    名字一样，行为却有三处系统性差异：
 *      a) **失败时的表现**：Object 版本抛错，Reflect 版本返回 false；
 *         （注意 defineProperty 是个例外，两边都抛错 —— 见第 2 节）
 *      b) **类型要求**：Object 版本会先把参数强制转成对象（装箱），
 *         Reflect 版本严格要求参数必须是对象，否则抛 TypeError；
 *      c) **返回值**：Object 版本习惯返回"被操作的对象"（便于链式调用），
 *         Reflect 版本统一返回布尔值（表示成功与否）。
 *    另外两边还各自有一些"对方没有"的方法。
 *
 * 2. 为什么需要
 *    在 Proxy 陷阱里，我们需要的是"内部方法"的语义：失败返回 false，而不是抛错。
 *    因为陷阱的职责本身就是决定"这次操作的结果是什么"，
 *    如果默认行为直接抛错，我们就没法优雅地返回 false 了。
 *    反过来，在普通业务代码里，Object 版本的"抛错"更符合直觉：
 *    错误立刻暴露，而不是被静默吞掉。
 *    所以：**写陷阱用 Reflect，写业务用 Object** 是一个稳妥的经验法则。
 *
 * 3. 核心语法要点
 *    - Object.defineProperty(obj, k, d)  -> 返回 obj；失败抛 TypeError
 *      Reflect.defineProperty(obj, k, d) -> 返回 true/false；只在参数不是对象时抛
 *    - Object.getPrototypeOf(v)  会把原始值装箱（Object.getPrototypeOf(1) 得到 Number.prototype）
 *      Reflect.getPrototypeOf(v) 对原始值直接抛 TypeError
 *    - Object.setPrototypeOf(o, p) -> 返回 o，失败抛错
 *      Reflect.setPrototypeOf(o, p) -> 返回 true/false
 *    - Object.preventExtensions(o) -> 返回 o（对原始值是静默无效的 no-op）
 *      Reflect.preventExtensions(o) -> 返回 true/false（对原始值抛 TypeError）
 *    - Object.keys(o) 只给**可枚举的字符串键**；Reflect.ownKeys(o) 给全部自有键
 *    - Reflect 独有：apply、construct（"以函数语义调用"与"构造"）
 *    - Object 独有：keys / values / entries / fromEntries / assign / create /
 *      freeze / seal / isFrozen / isSealed / defineProperties 等一大票工具方法
 *
 * 4. 常见陷阱
 *    - 以为 Reflect.defineProperty 也会抛错 —— 它不会，只返回 false，
 *      所以必须检查返回值，否则会静默失败。
 *    - 以为 Reflect.has / Reflect.ownKeys 对原始值也能用 —— 它们会抛 TypeError，
 *      而 `'x' in 1` 和 Object.keys(1) 都会先装箱。
 *    - Object.freeze 和 Object.seal 在 Reflect 上没有对应方法（它们是多步操作的组合）。
 *    - 把 Reflect 的方法当构造函数 new 会报错（见上一个文件）。
 *    - 在陷阱里用 Object.defineProperty 代替 Reflect.defineProperty 做默认行为，
 *      会导致失败时抛错而不是返回 false，破坏"陷阱返回布尔值"的契约。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 25_proxy_and_reflect/09_reflect_vs_object.js
 *
 * 【预期输出】
 *   逐项对照两套 API 的返回值与报错行为，并给出"该用哪一个"的判断依据。
 * ============================================================================
 */

// 小工具：把"可能抛错"的调用包起来，统一输出结果或错误类型。
function tryIt(label, fn) {
  try {
    const result = fn();
    console.log(`  ${label.padEnd(42)} -> 返回 ${formatValue(result)}`);
  } catch (err) {
    console.log(`  ${label.padEnd(42)} -> 抛错 ${err.constructor.name}`);
  }
}

function formatValue(v) {
  if (v === undefined) return 'undefined';
  if (typeof v === 'symbol') return String(v);
  if (v === null) return 'null';
  if (typeof v === 'object') {
    // 避免打印整个对象，只给个简短的标识。
    return Array.isArray(v) ? `数组(${v.length})` : `对象(${Object.keys(v).length} 个可枚举键)`;
  }
  return JSON.stringify(v);
}

console.log('--- 1. 一句话总览 ---');
console.log('  Object  ：面向使用者的工具函数集合，参数宽松、失败抛错、返回被操作对象');
console.log('  Reflect ：引擎内部方法的镜像，参数严格、失败返回 false、返回布尔值或结果');

console.log('--- 2. defineProperty：返回值与报错行为 ---');

const target = {};

// 成功时：Object 返回被操作的对象（可链式），Reflect 返回 true。
const objResult = Object.defineProperty(target, 'a', { value: 1, enumerable: true, configurable: true });
const refResult = Reflect.defineProperty(target, 'b', { value: 2, enumerable: true, configurable: true });
console.log('成功时：');
console.log('  Object.defineProperty 返回的是 target 本身吗？', objResult === target);
console.log('  Reflect.defineProperty 返回                   =', refResult);

console.log('失败时（在不可扩展对象上新增属性）：');
const sealedObj = Object.preventExtensions({});

// Object 版本：抛 TypeError。
tryIt('Object.defineProperty(不可扩展对象, 新键)', () =>
  Object.defineProperty(sealedObj, 'x', { value: 1 }));

// Reflect 版本：安静地返回 false。
tryIt('Reflect.defineProperty(不可扩展对象, 新键)', () =>
  Reflect.defineProperty(sealedObj, 'x', { value: 1 }));

// 注意：参数不是对象时，两边都会抛错 —— 这是唯一的例外。
console.log('参数不是对象时（两边都抛错）：');
tryIt('Object.defineProperty(1, "x", {...})', () => Object.defineProperty(1, 'x', { value: 1 }));
tryIt('Reflect.defineProperty(1, "x", {...})', () => Reflect.defineProperty(1, 'x', { value: 1 }));

console.log('  -> 结论：想"知道成功与否"就用 Reflect，想"失败立刻炸"就用 Object');

console.log('--- 3. getPrototypeOf：类型强转 vs 严格校验 ---');

console.log('对普通对象（两者一致）：');
tryIt('Object.getPrototypeOf({})', () => Object.getPrototypeOf({}) === Object.prototype);
tryIt('Reflect.getPrototypeOf({})', () => Reflect.getPrototypeOf({}) === Object.prototype);

console.log('对原始值（数字 1）：');
// Object 版本会把 1 装箱成 Number 对象，再取它的原型。
tryIt('Object.getPrototypeOf(1) === Number.prototype', () => Object.getPrototypeOf(1) === Number.prototype);
// Reflect 版本要求必须是对象。
tryIt('Reflect.getPrototypeOf(1)', () => Reflect.getPrototypeOf(1));

console.log('  -> 这个差异在"处理可能是原始值的参数"时很关键：');
console.log('     Object 版本会静默装箱，Reflect 版本会立刻告诉你"参数类型不对"');

console.log('--- 4. setPrototypeOf：返回值与严格性 ---');

const protoA = { tag: 'A' };
const protoB = { tag: 'B' };

const objForProto = {};
console.log('成功时：');
console.log('  Object.setPrototypeOf(o, protoA) 返回 o 本身吗？',
  Object.setPrototypeOf(objForProto, protoA) === objForProto);
console.log('  Reflect.setPrototypeOf(o, protoB) =',
  Reflect.setPrototypeOf(objForProto, protoB), ', 现在 tag =', objForProto.tag);

console.log('失败时（给不可扩展对象换原型）：');
const nonExtensible = Object.preventExtensions({});
tryIt('Object.setPrototypeOf(不可扩展对象, {...})', () => Object.setPrototypeOf(nonExtensible, { x: 1 }));
tryIt('Reflect.setPrototypeOf(不可扩展对象, {...})', () => Reflect.setPrototypeOf(nonExtensible, { x: 1 }));

console.log('对原始值：');
// Object 版本对原始值是"静默无效"（返回原始值本身）。
tryIt('Object.setPrototypeOf(1, {})', () => Object.setPrototypeOf(1, {}));
tryIt('Reflect.setPrototypeOf(1, {})', () => Reflect.setPrototypeOf(1, {}));

console.log('--- 5. preventExtensions / isExtensible：返回值语义 ---');

const fresh = { a: 1 };
console.log('preventExtensions 的返回值：');
console.log('  Object 版本返回的是被操作的对象吗？', Object.preventExtensions(fresh) === fresh);
console.log('  该对象现在可扩展吗？', Object.isExtensible(fresh));

const fresh2 = { a: 1 };
console.log('  Reflect 版本返回                  =', Reflect.preventExtensions(fresh2), '（布尔值）');

console.log('对原始值：');
// Object 版本对原始值是 no-op，返回原始值本身。
tryIt('Object.preventExtensions(1)', () => Object.preventExtensions(1));
// Reflect 版本严格校验类型。
tryIt('Reflect.preventExtensions(1)', () => Reflect.preventExtensions(1));
// 读方向也一样。
tryIt('Object.isExtensible(1)', () => Object.isExtensible(1));
tryIt('Reflect.isExtensible(1)', () => Reflect.isExtensible(1));

console.log('  -> Object.isExtensible(1) 得到 false，是因为原始值本来就不可能是"可扩展对象"，');
console.log('     而 Reflect.isExtensible(1) 直接告诉你"这不是一个对象"');

console.log('--- 6. ownKeys vs Object.keys：覆盖面完全不同 ---');

const rich = { visible: 1 };
Object.defineProperty(rich, 'hidden', { value: 2, enumerable: false });
rich[Symbol('sym')] = 3;
Object.defineProperty(rich, 'readonly', { value: 4, enumerable: true, writable: false });

console.log('对象内容：可枚举 visible / readonly，不可枚举 hidden，另有一个 symbol 键');
tryIt('Object.keys', () => Object.keys(rich));
tryIt('Object.getOwnPropertyNames', () => Object.getOwnPropertyNames(rich));
tryIt('Object.getOwnPropertySymbols', () => Object.getOwnPropertySymbols(rich));
tryIt('Reflect.ownKeys', () => Reflect.ownKeys(rich));
tryIt('Object.keys(1)（装箱后为空）', () => Object.keys(1));
tryIt('Reflect.ownKeys(1)', () => Reflect.ownKeys(1));

console.log('  -> 需要"全部自有键"（做代理、做深拷贝、做属性克隆）时，必须用 Reflect.ownKeys；');
console.log('     只想列出"用户能看到的数据字段"时，Object.keys 更合适');

console.log('--- 7. 属性读取：运算符 / Object / Reflect 三条路 ---');

const withGetter = {
  _x: 1,
  get x() {
    return `getter 里的 this._x = ${this._x}`;
  },
};

// 路子一：运算符，会触发 getter。
console.log('  obj.x                  =', withGetter.x);
// 路子二：Object.getOwnPropertyDescriptor 拿到的是"描述符"，不触发 getter。
console.log('  Object.gOPD(obj, "x")  =',
  typeof Object.getOwnPropertyDescriptor(withGetter, 'x').get, '（拿到的是 getter 函数本身，不执行）');
// 路子三：Reflect.get 会触发 getter，且能沿原型链查找，还能指定 receiver。
console.log('  Reflect.get(obj, "x")  =', Reflect.get(withGetter, 'x'));
console.log('  Reflect.get(obj, "x", { _x: 99 }) =', Reflect.get(withGetter, 'x', { _x: 99 }));

console.log('  说明：Object 上**没有** Object.get(obj, key) 这样的方法，');
console.log('        想"带 receiver 地读属性"，只能靠 Reflect.get');

// 写在 Object 侧也没有对应方法：Object.assign 语义不同（见下）。
console.log('  写方向同理：Object 没有 Object.set，只有语义不同的 Object.assign');

console.log('--- 8. Object.assign 与"内部 Set 语义"的差别 ---');

const assignTarget = {};
const assignSource = Object.create({ inherited: '来自原型' });
assignSource.own = '自有属性';

// Object.assign 只复制**可枚举的自有**属性，不复制原型上的。
Object.assign(assignTarget, assignSource);
console.log('Object.assign 结果 =', JSON.stringify(assignTarget), '（inherited 没有被复制）');

// Object.assign 在目标上使用的是 [[Set]]，所以会触发目标的 setter。
const setterTarget = {
  _store: null,
  set value(v) {
    console.log(`  [setter] 被触发了，写入 ${v}`);
    this._store = v;
  },
};
Object.assign(setterTarget, { value: 'hello' });
console.log('  setterTarget._store =', setterTarget._store);
console.log('  -> 这一点值得警惕：Object.assign 不是"直接定义属性"，而是"逐个赋值"');

// 要"直接定义属性、绕过 setter"，可以用 Object.defineProperty 或 Object.defineProperties。
const defineTarget = {
  set value(_v) {
    console.log('  这一行不会被打印（defineProperties 直接定义属性，不走 setter）');
  },
};
Object.defineProperties(defineTarget, {
  value: { value: 'defined', enumerable: true, writable: true, configurable: true },
});
console.log('用 defineProperties 绕过了 setter，得到 =', defineTarget.value);

console.log('--- 9. 只在一边存在的方法 ---');

console.log('只在 Object 上（Reflect 没有）：');
const objectOnly = ['keys', 'values', 'entries', 'fromEntries', 'assign', 'create',
  'freeze', 'seal', 'isFrozen', 'isSealed', 'defineProperties', 'getOwnPropertyNames',
  'getOwnPropertySymbols', 'hasOwn'];
for (const name of objectOnly) {
  console.log(`  Object.${name.padEnd(24)} 存在：${typeof Object[name]} | Reflect 上没有：${Reflect[name] === undefined}`);
}

console.log('只在 Reflect 上（Object 没有）：');
const reflectOnly = ['apply', 'construct', 'ownKeys', 'has', 'deleteProperty', 'get', 'set'];
for (const name of reflectOnly) {
  // 注意这里要用 Object.hasOwn 判断"是不是 Object 自己的静态方法"。
  // 如果只写 Object[name] === undefined，apply 会误判 —— 因为 Object 本身是函数，
  // 它从 Function.prototype 上继承了 apply 方法！
  const objectHasOwn = Object.hasOwn(Object, name);
  console.log(`  Reflect.${name.padEnd(23)} 存在：${typeof Reflect[name]} | Object 自己的同名静态方法：${objectHasOwn}`);
}

console.log('  -> 交集就是那 6 个同名方法：defineProperty / getOwnPropertyDescriptor /');
console.log('     getPrototypeOf / setPrototypeOf / isExtensible / preventExtensions');

console.log('--- 10. 完整对照表 ---');

const comparison = [
  ['defineProperty 失败时', '抛 TypeError', '返回 false'],
  ['defineProperty 成功时返回', '被操作的对象（可链式）', 'true'],
  ['getPrototypeOf(原始值)', '装箱后取原型', '抛 TypeError'],
  ['setPrototypeOf 失败时', '抛 TypeError', '返回 false'],
  ['setPrototypeOf(原始值)', '静默无效，返回原值', '抛 TypeError'],
  ['preventExtensions 返回', '被操作的对象', 'true / false'],
  ['isExtensible(原始值)', 'false（不报错）', '抛 TypeError'],
  ['读取属性（含 receiver）', '无此功能', 'Reflect.get'],
  ['删除属性', 'delete 运算符（严格模式抛错）', 'Reflect.deleteProperty（返回布尔）'],
  ['列出全部自有键', '无单方法（需三者组合）', 'Reflect.ownKeys'],
  ['调用函数 / 构造对象', '无', 'Reflect.apply / Reflect.construct'],
];

console.log('场景'.padEnd(30) + 'Object'.padEnd(28) + 'Reflect');
console.log('-'.repeat(92));
for (const [scene, objWay, reflectWay] of comparison) {
  console.log(scene.padEnd(30) + objWay.padEnd(28) + reflectWay);
}

console.log('--- 11. 实践建议：什么时候用哪一个 ---');

console.log('用 Reflect 的场景：');
console.log('  · 写 Proxy 陷阱的默认行为（必须返回布尔值语义）');
console.log('  · 需要"不抛错、看返回值"的容错式属性操作');
console.log('  · 需要 receiver 精确控制 this（Reflect.get / Reflect.set）');
console.log('  · 需要一次性拿到全部自有键（含 symbol、含不可枚举）');
console.log('  · 需要函数式地传递操作（const op = Reflect.get）');

console.log('用 Object 的场景：');
console.log('  · 普通业务代码，希望错误立刻暴露');
console.log('  · 需要 keys / entries / assign / freeze 这类高层工具');
console.log('  · 需要链式调用（Object.defineProperty 返回对象）');

console.log('--- 12. 一个把两者用对地方的例子 ---');

// Proxy 陷阱里用 Reflect（失败返回 false，符合陷阱契约）。
const safeWrite = new Proxy({}, {
  set(tgt, key, value, receiver) {
    // Reflect.set 返回布尔，直接作为陷阱结果返回，语义完全正确。
    return Reflect.set(tgt, key, value, receiver);
  },
  defineProperty(tgt, key, descriptor) {
    // 这里如果用 Object.defineProperty，失败时会抛错而不是返回 false，
    // 对调用方来说行为就不再是"标准内部方法"了。
    return Reflect.defineProperty(tgt, key, descriptor);
  },
});

Object.defineProperty(safeWrite, 'viaObject', { value: 1, enumerable: true, configurable: true });
safeWrite.viaProxy = 2;
console.log('两种写法都能工作 =', JSON.stringify(safeWrite));

// 业务代码里用 Object（错误立刻暴露）。
const config = {};
Object.defineProperty(config, 'locked', {
  value: '原始值',
  writable: false,
  configurable: false,
});

// 试图改一个"不可写且不可配置"的属性：Object 版本直接抛错。
try {
  Object.defineProperty(config, 'locked', { value: '新值' });
} catch (err) {
  console.log('业务代码里用 Object 版本，失败立刻暴露：', err.constructor.name, '-', err.message);
}

// 同样的操作，Reflect 版本只是安静地返回 false。
const reflectOK = Reflect.defineProperty(config, 'locked', { value: '新值' });
console.log('同一操作用 Reflect 版本 =', reflectOK, ' <- 必须自己检查返回值，否则就是静默失败');
console.log('  值仍然是 =', config.locked);

// 顺带说明：如果描述符本身就是**非法的**（例如同时给 value 和 get），
// 那么 Reflect.defineProperty 一样会抛 TypeError —— 因为那是"参数错误"，
// 属于"内部方法"之前的参数校验，不属于"操作失败"。
try {
  Reflect.defineProperty({}, 'bad', { value: 1, get() { return 2; } });
} catch (err) {
  console.log('描述符非法时 Reflect 也会抛错：', err.constructor.name);
}

console.log('\n全部演示完毕。');
