/**
 * ============================================================================
 * 知识点：属性描述符 —— value / writable / enumerable / configurable
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】进阶
 * 【前置知识】09_objects/07_getter_setter.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 里每个属性除了"值"之外，还带着三个开关，合称属性描述符（property descriptor）：
 *      value        —— 属性的值（数据属性专有）
 *      writable     —— 能否被重新赋值
 *      enumerable   —— 是否出现在 for...in / Object.keys / 展开 / JSON.stringify 中
 *      configurable —— 能否被 delete，能否修改本属性的描述符
 *    数据属性用 { value, writable, enumerable, configurable }；
 *    访问器属性用 { get, set, enumerable, configurable }（见 07 号文件）。
 *
 * 2. 为什么需要
 *    用字面量创建属性时这四个开关全是 true（"全开"），这满足 99% 的场景。
 *    但有些时候需要收紧：
 *      (1) 定义常量：writable: false，防止被误改。
 *      (2) 隐藏内部属性：enumerable: false，让 Object.keys / JSON 序列化看不见它。
 *      (3) 锁定元数据：configurable: false，让属性不可删除、描述符不可再改。
 *      (4) 这正是标准库里很多"魔法"的实现方式，例如数组的 length、
 *          函数的 name / length 都是不可枚举、不可配置的。
 *
 * 3. 核心语法要点
 *    (1) Object.getOwnPropertyDescriptor(obj, key) 读取单个属性的描述符；
 *        Object.getOwnPropertyDescriptors(obj) 读取全部（含 Symbol 键）。
 *    (2) Object.defineProperty(obj, key, descriptor) 定义/修改单个属性，返回 obj。
 *    (3) Object.defineProperties(obj, descriptors) 批量定义。
 *    (4) 用 defineProperty **新增**属性时，描述符里没写的开关默认是 false！
 *        这与字面量的"默认全开"完全相反，是最大的坑。
 *    (5) 用 defineProperty **修改**已有属性时，只覆盖你显式写出的开关，其余保持不变。
 *    (6) enumerable: false 只影响"枚举"，不影响读取：obj.hidden 照样能拿到值。
 *    (7) configurable: false 之后：
 *        - delete 返回 false（严格模式抛 TypeError）
 *        - writable 只能从 true 改成 false，不能反过来
 *        - enumerable 完全不能再改
 *    (8) Object.defineProperty 对非对象目标会抛 TypeError，对原始值同样。
 *
 * 4. 常见陷阱
 *    (1) 忘记写 enumerable: true，结果属性"消失"了：JSON、keys、展开都看不到。
 *    (2) 忘记写 writable: true，赋值静默失败（严格模式下抛 TypeError）。
 *    (3) configurable: false 与 writable: true 的组合：值仍可改，但描述符不能再改。
 *    (4) 只读属性只在"赋值"层面生效，若值是对象，对象内部仍可改（浅层只读）。
 *    (5) Object.freeze / seal 就是批量把描述符改成受限状态的语法糖，见 09 号文件。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/08_property_descriptors.js
 *
 * 【预期输出】
 *   分 7 个小节，逐项演示四个开关的效果与 defineProperty 的默认值陷阱。
 * ============================================================================
 */

console.log('--- 1. 用字面量创建的属性：四个开关默认全为 true ---');

const literal = { a: 1 };
console.log('literal.a 的描述符 =', JSON.stringify(Object.getOwnPropertyDescriptor(literal, 'a')));

// 用 JSON.stringify 把函数等不可序列化的值过滤掉，方便打印
const showDescriptor = (obj, key) => {
  const d = Object.getOwnPropertyDescriptor(obj, key);
  const out = {};
  for (const k of ['value', 'writable', 'enumerable', 'configurable']) {
    if (k in d) out[k] = d[k];
  }
  if (d.get) out.get = '[Function]';
  if (d.set) out.set = '[Function]';
  return JSON.stringify(out);
};

console.log('美化后 =', showDescriptor(literal, 'a'));

console.log('\n--- 2. writable: false —— 不可重写的常量 ---');

const constants = {};
// 新增属性时没写的开关默认是 false！这里显式写出我们想要的。
Object.defineProperty(constants, 'PI_APPROX', {
  value: 3.14159,
  writable: false,
  enumerable: true,
  configurable: true,
});

console.log('读取没问题 =', constants.PI_APPROX, '（writable 只限制写）');

// ESM 默认严格模式，给不可写属性赋值会抛 TypeError（非严格模式下是静默失败）。
try {
  constants.PI_APPROX = 3;
} catch (err) {
  console.log('赋值失败：', err.name, '-', err.message.slice(0, 60), '...');
}
console.log('值没有被改变 =', constants.PI_APPROX);

// 注意：只读是"浅层"的，如果值是对象，对象内部还能改。
const frozenShallow = {};
Object.defineProperty(frozenShallow, 'config', {
  value: { debug: false },
  writable: false,
  enumerable: true,
  configurable: true,
});
frozenShallow.config.debug = true; // 修改的是对象内部，不是属性本身，所以允许
console.log('浅层只读：内部仍可改 =', JSON.stringify(frozenShallow.config));
try {
  frozenShallow.config = {};
} catch (err) {
  console.log('但整体替换被拒绝：', err.name);
}

console.log('\n--- 3. enumerable: false —— 隐藏属性 ---');

const withHidden = { visible: '看得见' };
Object.defineProperty(withHidden, 'hidden', {
  value: '看不见但能读到',
  writable: true,
  enumerable: false, // 关键开关
  configurable: true,
});

console.log('直接读取 hidden       =', withHidden.hidden);
console.log('Object.keys           =', JSON.stringify(Object.keys(withHidden)));
console.log('JSON.stringify        =', JSON.stringify(withHidden));
console.log('对象展开              =', JSON.stringify({ ...withHidden }));
console.log('for...in 也看不到（下面循环只输出 visible）：');
for (const k in withHidden) {
  console.log('   for...in 拿到：', k);
}

// 但 getOwnPropertyNames / getOwnPropertyDescriptors 能看到它。
console.log('getOwnPropertyNames   =', JSON.stringify(Object.getOwnPropertyNames(withHidden)));
console.log('Object.hasOwn         =', Object.hasOwn(withHidden, 'hidden'));

console.log('\n--- 4. configurable: false —— 不可删除、不可再配置 ---');

const locked = {};
Object.defineProperty(locked, 'frozenKey', {
  value: '初始值',
  writable: true, // 值还能改
  enumerable: true,
  configurable: false, // 但属性本身"定型"了
});

// 严格模式下 delete 不可配置属性会抛 TypeError（非严格模式返回 false）。
try {
  const ok = delete locked.frozenKey;
  console.log('delete 返回 =', ok);
} catch (err) {
  console.log('delete 被拒绝：', err.name, '-', err.message.slice(0, 60), '...');
}

// 值仍然可以改，因为 writable 还是 true。
locked.frozenKey = '新值';
console.log('值仍可修改 =', locked.frozenKey);

// 但不能把 writable 从 false 改回 true（单向）。
Object.defineProperty(locked, 'frozenKey', { writable: false });
console.log('writable 可以从 true 改成 false：', showDescriptor(locked, 'frozenKey'));
try {
  Object.defineProperty(locked, 'frozenKey', { writable: true });
} catch (err) {
  console.log('但改不回去：', err.name, '-', err.message.slice(0, 70), '...');
}

// enumerable 一旦 configurable: false 就彻底不能再改。
try {
  Object.defineProperty(locked, 'frozenKey', { enumerable: false });
} catch (err) {
  console.log('enumerable 也不能再改：', err.name);
}

console.log('\n--- 5. 最大的坑：defineProperty 新增属性时开关默认是 false ---');

const trap = {};
// 只写了 value，其余三个开关全部默认 false。
Object.defineProperty(trap, 'silent', { value: '我很难用' });

console.log('描述符 =', showDescriptor(trap, 'silent'));
console.log('能读到 =', trap.silent);
console.log('Object.keys 里没有 =', JSON.stringify(Object.keys(trap)));
console.log('JSON 也序列化不出来 =', JSON.stringify(trap));

// 写不进去（严格模式抛错）
try {
  trap.silent = '改一下';
} catch (err) {
  console.log('写入被拒绝：', err.name);
}

// 删不掉
try {
  delete trap.silent;
} catch (err) {
  console.log('删除被拒绝：', err.name);
}

// 对比：用 defineProperty 修改"已存在"的属性时，未写的开关保持原样。
const existing = { normal: 1 };
Object.defineProperty(existing, 'normal', { value: 2 }); // 只改 value
console.log('修改已有属性 normal 的描述符 =', showDescriptor(existing, 'normal'), '（其余开关保持不变）');

console.log('\n--- 6. 批量操作：defineProperties 与 getOwnPropertyDescriptors ---');

const batch = {};
Object.defineProperties(batch, {
  id: { value: 1, writable: false, enumerable: true, configurable: false },
  name: { value: '张三', writable: true, enumerable: true, configurable: true },
  secret: { value: '内部字段', writable: true, enumerable: false, configurable: true },
});
console.log('批量定义 batch =', JSON.stringify(batch));
console.log('全部自有属性名 =', JSON.stringify(Object.getOwnPropertyNames(batch)));

// 用描述符做"完整拷贝"：这是唯一能保留所有开关的拷贝方式。
const fullCopy = Object.defineProperties({}, Object.getOwnPropertyDescriptors(batch));
console.log('完整拷贝后 JSON =', JSON.stringify(fullCopy));
console.log('拷贝后 secret 仍不可枚举 =', JSON.stringify(Object.keys(fullCopy)));
console.log('拷贝后 id 仍不可写 =', showDescriptor(fullCopy, 'id'));

// 注意：getOwnPropertyDescriptors 会包含 Symbol 键。
const sym = Symbol('tag');
const symObj = { [sym]: 'symbol 值', a: 1 };
const symDescriptors = Object.getOwnPropertyDescriptors(symObj);
console.log('描述符里包含 Symbol 键 =', Object.getOwnPropertySymbols(symDescriptors).length > 0);
const symCopy2 = Object.defineProperties({}, symDescriptors);
console.log('Symbol 键也被完整复制 =', symCopy2[sym]);

console.log('\n--- 7. 边界情况 ---');

// 目标不是对象时抛 TypeError。
try {
  Object.defineProperty(42, 'x', { value: 1 });
} catch (err) {
  console.log('目标是数字时报错：', err.name, '-', err.message.slice(0, 60), '...');
}

// 描述符里 get 与 value 互斥。
try {
  Object.defineProperty({}, 'x', { value: 1, get: () => 2 });
} catch (err) {
  console.log('get 与 value 混用报错：', err.name, '-', err.message.slice(0, 60), '...');
}

// 对不存在的属性调用 getOwnPropertyDescriptor 返回 undefined（不抛错）。
console.log('不存在的属性描述符 =', Object.getOwnPropertyDescriptor({}, 'nope'));

// 数组的 length 就是一个特殊属性：不可枚举、不可配置，但可写。
const arr = [1, 2, 3];
console.log('数组 length 的描述符 =', showDescriptor(arr, 'length'));

// 内置对象的常见属性多数不可枚举，这是它们不出现在 for...in 里的原因。
console.log('Math.PI 的描述符 =', showDescriptor(Math, 'PI'));

console.log('\n全部演示完毕。');
