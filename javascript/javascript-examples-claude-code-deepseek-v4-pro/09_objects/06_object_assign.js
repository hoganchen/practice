/**
 * ============================================================================
 * 知识点：Object.assign —— 合并、拷贝及其浅拷贝与 getter 陷阱
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】入门
 * 【前置知识】09_objects/04_spread_merge.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Object.assign(target, ...sources) 把后面所有源对象的"自有 + 可枚举"属性
 *    复制到 target 上，并返回 target 本身（注意不是新对象）。
 *    它是 ES2015 提供的"对象合并"标准方法，也是对象展开 ... 的语义原型。
 *
 * 2. 为什么需要
 *    (1) 在还没有对象展开语法的年代，这是唯一的"对象合并/浅拷贝"手段。
 *    (2) 它的返回值是 target，所以可以在表达式里链式使用。
 *    (3) 它会触发 target 上已有的 setter，这一点与展开运算符不同，
 *        有时这是"特性"（想要走 setter 逻辑），有时是"陷阱"。
 *
 * 3. 核心语法要点
 *    (1) 参数顺序决定优先级：后面的覆盖前面的，同名键"后写赢"。
 *    (2) 复制来源：只复制"自有 + 可枚举"属性，包括 Symbol 键；
 *        继承属性和不可枚举属性不会被复制。
 *    (3) 复制的是"值"：源上的 getter 会被**求值**成值再写入目标，
 *        因此 getter 的行为不会被带过去。
 *    (4) 目标对象上的 setter 会被调用（因为本质是 obj[key] = value 的批量执行）。
 *    (5) 返回 target 本身，所以 Object.assign(a, b) 改变了 a，也返回 a。
 *    (6) null / undefined 作为源会被忽略，不报错；但作为 target 会抛 TypeError。
 *    (7) 它只能用于"复制自有属性"，无法复制属性描述符
 *        （writable/enumerable 等全部变成默认的 true/true）。
 *
 * 4. 常见陷阱
 *    (1) 是浅拷贝：嵌套对象仍然是共享引用。
 *    (2) 忘记它修改了 target：Object.assign(a, b) 后 a 已经变了，
 *        想要新对象必须传空对象 {} 作为 target。
 *    (3) 原始值作为 target 会被装箱成对象，结果丢失（且严格模式下抛错），
 *        所以千万别写 Object.assign('abc', ...)。
 *    (4) 与展开运算符的差异：展开不触发 target 上的 setter，且展开总是在
 *        一个全新的对象字面量里；Object.assign 会把属性写进已有对象。
 *    (5) 对于"只想拷贝可枚举属性"以外的需求（如 getter/setter、不可枚举属性），
 *        应该用 Object.getOwnPropertyDescriptors + Object.defineProperties。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/06_object_assign.js
 *
 * 【预期输出】
 *   分 6 个小节，演示 assign 的合并、返回值、浅拷贝、setter/getter 行为差异。
 * ============================================================================
 */

console.log('--- 1. 基本用法：合并与覆盖 ---');

const target = { a: 1, b: 2 };
const source = { b: 20, c: 30 };

// 把 source 的属性复制到 target。返回的就是 target 本身。
const returned = Object.assign(target, source);
console.log('target   =', JSON.stringify(target));
console.log('source   =', JSON.stringify(source), '（源对象不会被修改）');
console.log('返回值就是 target 本身 =', returned === target);

// 同名键：后面的源覆盖前面的源，也覆盖 target 原有的值。
const merged = Object.assign({}, { x: 1, y: 1 }, { y: 2 }, { z: 3 });
console.log('多个源合并 =', JSON.stringify(merged));

// 常见配置合并模式：默认值 + 用户配置
const defaults = { host: 'localhost', port: 8080, https: false };
const userConfig = { port: 3000 };
console.log('配置合并 =', JSON.stringify(Object.assign({}, defaults, userConfig)));
console.log('defaults 未被污染 =', JSON.stringify(defaults));

console.log('\n--- 2. 用作浅拷贝 ---');

const original = { name: '张三', tags: ['a', 'b'], info: { age: 20 } };

// 传一个空对象作为 target，就得到了原对象的浅拷贝。
const copy = Object.assign({}, original);
console.log('original =', JSON.stringify(original));
console.log('copy     =', JSON.stringify(copy));
console.log('不是同一个对象 =', copy !== original);

// 顶层属性独立
copy.name = '李四';
console.log('改顶层后 original.name =', original.name);

// 嵌套属性共享——浅拷贝的本质
copy.tags.push('c');
copy.info.age = 99;
console.log('改嵌套后 original.tags =', JSON.stringify(original.tags));
console.log('改嵌套后 original.info.age =', original.info.age);
console.log('证明嵌套引用相同 =', copy.info === original.info, copy.tags === original.tags);

console.log('\n--- 3. 忘记传空对象的后果 ---');

const stateA = { count: 1 };
const patch = { count: 2 };
Object.assign(stateA, patch); // 没有传 {}，stateA 被就地修改了！
console.log('stateA 被就地修改 =', JSON.stringify(stateA));

// 想要"新对象"的两种正确写法：
const immutable1 = Object.assign({}, stateA, patch);
const immutable2 = { ...stateA, ...patch };
console.log('正确写法 1（空对象当 target） =', JSON.stringify(immutable1));
console.log('正确写法 2（对象展开，等价）  =', JSON.stringify(immutable2));

console.log('\n--- 4. getter 陷阱：源上的 getter 会被求值 ---');

const counterSource = { n: 0 };
// 在源对象上定义一个 getter 属性 double
Object.defineProperty(counterSource, 'double', {
  get() {
    console.log('   （getter 被调用了！）');
    return counterSource.n * 2;
  },
  enumerable: true,
  configurable: true,
});

counterSource.n = 5;
console.log('直接读 source.double =', counterSource.double, '（getter 现场计算）');

// Object.assign 在复制时**读取**了 getter，得到当时的快照值。
const assigned = Object.assign({}, counterSource);
console.log('assign 后的对象 =', JSON.stringify(assigned));

// 改了源对象的 n，目标对象的 double 不会跟着变——它已经是普通数据属性了。
counterSource.n = 100;
console.log('源 n 改成 100 后：');
console.log('   source.double   =', counterSource.double, '（重新计算）');
console.log('   assigned.double =', assigned.double, '（还是复制时的旧值）');

// 验证目标上 double 已经从 getter 变成了普通数据属性
console.log('assign 结果上 double 的描述符 =', JSON.stringify(Object.getOwnPropertyDescriptor(assigned, 'double')));

console.log('\n--- 5. 目标对象上的 setter 会被触发 ---');

const targetWithSetter = {
  _value: 0,
  // 定义一个 setter：写入 value 时同时更新 _value
  set value(v) {
    console.log('   （setter 被调用，参数是', v, '）');
    this._value = v * 10;
  },
  get value() {
    return this._value;
  },
};

// Object.assign 的赋值过程会走 setter，因此 _value 也被更新了。
Object.assign(targetWithSetter, { value: 7 });
console.log('targetWithSetter._value =', targetWithSetter._value, '（setter 生效了）');

// 对比：对象展开不会触发目标上的 setter，因为它是在全新字面量上定义属性。
const spreadResult = { ...targetWithSetter };
console.log('展开复制后 spreadResult._value =', spreadResult._value, '（只是照搬了自有属性 _value）');

console.log('\n--- 6. 属性范围与边界情况 ---');

const proto = { inheritedProp: '来自原型' };
const child = Object.create(proto);
child.ownProp = '自有属性';
Object.defineProperty(child, 'hiddenProp', { value: '不可枚举', enumerable: false });

// 继承属性 / 不可枚举属性都不会被 assign 复制
const copied = Object.assign({}, child);
console.log('copied =', JSON.stringify(copied));
console.log("复制后 'inheritedProp' in copied =", 'inheritedProp' in copied);
console.log("复制后 'hiddenProp' in copied    =", 'hiddenProp' in copied);

// Symbol 键只要可枚举就会被复制
const sym = Symbol('tag');
const withSym = { [sym]: 'symbol 值', normal: 1 };
const symCopy = Object.assign({}, withSym);
console.log('Symbol 键被复制 =', symCopy[sym] === 'symbol 值');

// 源是 null / undefined：会被跳过，不报错
console.log('源为 null =', JSON.stringify(Object.assign({ a: 1 }, null)));
console.log('源为 undefined =', JSON.stringify(Object.assign({ a: 1 }, undefined)));

// 源是原始值：字符串会展开成字符索引；数字/布尔没有自有枚举属性
console.log("源为字符串 'ab' =", JSON.stringify(Object.assign({}, 'ab')));

// target 是 null / undefined：抛 TypeError（这里 try/catch 演示）
try {
  Object.assign(null, { a: 1 });
} catch (err) {
  console.log('target 为 null 时报错：', err.name, '-', err.message);
}

// 进阶：想连同 getter/setter 和描述符一起复制，用这一组 API
const descriptors = Object.getOwnPropertyDescriptors(counterSource);
const viaDescriptors = Object.defineProperties({}, descriptors);
console.log('用描述符复制后 =', JSON.stringify(viaDescriptors));

console.log('\n全部演示完毕。');
