/**
 * ============================================================================
 * 知识点：Object.freeze / seal / preventExtensions —— 三种"锁定"程度与浅冻结陷阱
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】进阶
 * 【前置知识】09_objects/08_property_descriptors.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 提供三个逐级收紧的"锁定对象"方法，本质都是批量修改属性描述符：
 *      Object.preventExtensions(obj) —— 不能**新增**属性，但可改可删已有属性。
 *      Object.seal(obj)              —— 在上一级基础上，还不能**删除**属性，
 *                                       且所有属性变成 configurable: false。
 *                                       （值的可写性保持原样）
 *      Object.freeze(obj)            —— 在上一级基础上，所有数据属性变成
 *                                       writable: false，即完全只读。
 *    三者的"严厉程度"：preventExtensions < seal < freeze。
 *
 * 2. 为什么需要
 *    (1) 表达意图：这个对象是配置常量 / 枚举 / 缓存键，不该被改。
 *      (2) 提前暴露 bug：在严格模式下，误改会立刻抛错，而不是静默产生错误数据。
 *      (3) 性能优化（历史上）：V8 曾对冻结对象做隐藏类优化，虽然现在收益有限，
 *          但"不变量"带来的可维护性收益一直存在。
 *
 * 3. 核心语法要点
 *    (1) 三个方法都**返回传入的那个对象本身**（不是新对象），并且都只作用于"浅层"。
 *    (2) 对应的判断方法：Object.isExtensible / isSealed / isFrozen。
 *        注意 isSealed 与 isFrozen 对"空对象"都返回 true（因为空对象没有属性可破坏）。
 *    (3) 冻结对象上：
 *        - 修改已有属性 -> 严格模式抛 TypeError，非严格模式静默失败
 *        - 新增属性     -> 严格模式抛 TypeError
 *        - 删除属性     -> 严格模式抛 TypeError
 *    (4) 冻结是"降级不可逆"的：一旦 freeze，无法再 thaw 回可写状态。
 *    (5) freeze 会跳过访问器属性：有 setter 的属性在冻结后 setter 依然会被调用
 *        （因为 freeze 只把数据属性设为不可写，访问器属性没有 writable 这个开关）。
 *    (6) 数组也能冻结：冻结后 push / pop / 改下标都失败，但数组方法内部的
 *        length 写入也会失败，所以整个操作抛 TypeError。
 *
 * 4. 常见陷阱
 *    (1) 【最大的坑】浅冻结：Object.freeze(obj) 只冻结第一层。
 *        嵌套对象的属性照样能改——必须手动递归（下面给了实现）。
 *    (2) 冻结后 Object.isFrozen(嵌套对象) 是 false，容易误判。
 *    (3) 只想禁止新增、保留可改性时用错成 freeze，导致后续逻辑全炸。
 *    (4) ESM 是严格模式，所以本文件里所有"非法操作"都会抛错，必须 try/catch 包住。
 *    (5) 冻结不能阻止"原型被改"：如果对象的可写属性指向另一个对象，那个对象未被冻结。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/09_freeze_seal.js
 *
 * 【预期输出】
 *   分 6 个小节，对比三档锁定能力，并演示浅冻结陷阱与递归深冻结方案。
 * ============================================================================
 */

// 全程处于严格模式（ESM 模块默认严格模式），所以下面所有非法写入都会抛 TypeError。
// 为了让示例完整跑完，全部用 try/catch 包住并在 catch 里打印说明。

/** 尝试执行一个操作，把可能抛出的错误打印出来，方便演示"被拒绝"的效果。 */
function attempt(label, fn) {
  try {
    fn();
    console.log(`   ${label} -> 成功`);
  } catch (err) {
    console.log(`   ${label} -> 被拒绝（${err.name}）`);
  }
}

console.log('--- 1. preventExtensions：只禁止新增 ---');

const prevent = { a: 1 };
console.log('操作前 isExtensible =', Object.isExtensible(prevent));
Object.preventExtensions(prevent);
console.log('之后 isExtensible   =', Object.isExtensible(prevent));

// 修改已有属性：允许
prevent.a = 100;
console.log('修改已有属性 a =', prevent.a, '（允许）');

// 删除已有属性：允许
attempt('删除属性', () => delete prevent.a);
console.log('删除后 =', JSON.stringify(prevent));

// 新增属性：禁止
attempt("新增属性 b", () => {
  prevent.b = 2;
});
console.log('新增失败后 =', JSON.stringify(prevent));

console.log('\n--- 2. seal：禁止新增 + 禁止删除 ---');

const sealed = { x: 1, y: 2 };
Object.seal(sealed);
console.log('isSealed  =', Object.isSealed(sealed));
console.log('isFrozen  =', Object.isFrozen(sealed), '（seal 不等于 freeze）');

// 修改已有属性：仍然允许，因为 seal 不改变 writable
sealed.x = 99;
console.log('修改 x =', sealed.x, '（seal 允许改值）');

// 新增 / 删除：禁止
attempt('新增属性 z', () => {
  sealed.z = 3;
});
attempt('删除属性 x', () => delete sealed.x);

// seal 的本质：把所有属性的 configurable 变成 false
console.log('seal 后 x 的描述符 =', JSON.stringify(Object.getOwnPropertyDescriptor(sealed, 'x')));

// 也因此，把 x 改成不可写是允许的（configurable: false 时 writable 只能 true -> false），
// 但改回去就不行了。
Object.defineProperty(sealed, 'x', { writable: false });
console.log('手动把 x 改为不可写后 =', JSON.stringify(Object.getOwnPropertyDescriptor(sealed, 'x')));
attempt('把 writable 改回 true', () => Object.defineProperty(sealed, 'x', { writable: true }));

console.log('\n--- 3. freeze：完全只读 ---');

const frozen = { name: '张三', age: 20 };
Object.freeze(frozen);
console.log('isFrozen =', Object.isFrozen(frozen));
console.log('描述符   =', JSON.stringify(Object.getOwnPropertyDescriptor(frozen, 'name')));

console.log('读取正常 =', frozen.name);
attempt('修改 name', () => {
  frozen.name = '李四';
});
attempt('新增 email', () => {
  frozen.email = 'a@b.c';
});
attempt('删除 age', () => delete frozen.age);

console.log('三次非法操作后对象仍是 =', JSON.stringify(frozen));

console.log('\n--- 4. 三档锁定能力对照表 ---');

const capabilities = [
  { name: 'preventExtensions', apply: Object.preventExtensions },
  { name: 'seal', apply: Object.seal },
  { name: 'freeze', apply: Object.freeze },
];

for (const { name, apply } of capabilities) {
  const o = { v: 1 };
  apply(o);

  // 用返回值判断每个操作是否成功：这里用 "非严格模式下" 的思路——
  // Object.defineProperty 返回对象，但我们要的是"是否生效"，所以直接看结果。
  let canWrite = true;
  let canAdd = true;
  let canDelete = true;

  try {
    o.v = 2;
    canWrite = o.v === 2;
  } catch {
    canWrite = false;
  }
  try {
    o.added = 1;
    canAdd = 'added' in o;
  } catch {
    canAdd = false;
  }
  try {
    delete o.v;
    canDelete = !Object.hasOwn(o, 'v');
  } catch {
    canDelete = false;
  }

  console.log(`   ${name.padEnd(20)} 改值: ${canWrite ? '✓' : '✗'}   新增: ${canAdd ? '✓' : '✗'}   删除: ${canDelete ? '✓' : '✗'}`);
}

// 空对象的特例：没有任何属性，所以 isSealed / isFrozen 都为 true。
const emptyObj = Object.preventExtensions({});
console.log('空对象（仅 preventExtensions）isSealed =', Object.isSealed(emptyObj));
console.log('空对象（仅 preventExtensions）isFrozen =', Object.isFrozen(emptyObj));
console.log('这是规范定义的：没有属性可"破坏"，就视为已密封/已冻结。');

console.log('\n--- 5. 最大的陷阱：浅冻结 ---');

const appConfig = Object.freeze({
  name: '我的应用',
  // 下面两个值是对象/数组，属于"嵌套层"
  theme: { color: 'blue', fontSize: 14 },
  features: ['登录', '注册'],
});

console.log('顶层只读：尝试改 name');
attempt('修改 appConfig.name', () => {
  appConfig.name = '别的名字';
});

// 但嵌套对象的属性照样能改！
console.log('嵌套层仍可修改：');
appConfig.theme.color = 'red';
appConfig.features.push('支付');
console.log('   theme.color =', appConfig.theme.color, '（被改掉了！）');
console.log('   features    =', JSON.stringify(appConfig.features), '（被改掉了！）');

// 用 isFrozen 检查嵌套层，会发现它们根本没被冻结。
console.log('Object.isFrozen(appConfig)       =', Object.isFrozen(appConfig));
console.log('Object.isFrozen(appConfig.theme) =', Object.isFrozen(appConfig.theme));
console.log('Object.isFrozen(appConfig.features) =', Object.isFrozen(appConfig.features));

console.log('\n--- 6. 递归深冻结（deepFreeze）实现 ---');

/**
 * 递归冻结对象的所有层级。
 * 要点：
 *   1. 先递归处理属性值，再冻结自身（顺序其实无所谓，但先子后父更直观）。
 *   2. 用 WeakSet 记录访问过的对象，避免循环引用导致无限递归。
 *   3. 只处理对象类型，跳过 null（typeof null === 'object'，必须单独判断）。
 *   4. 不处理 Map / Set 内部数据，也不处理不可枚举属性（它们本来也改不动外部行为）。
 */
function deepFreeze(obj, seen = new WeakSet()) {
  // 只处理"对象"，原始值和 null 直接返回
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return obj;
  }
  // 循环引用保护：已经处理过的对象不再重复处理
  if (seen.has(obj)) return obj;
  seen.add(obj);

  // 先取出所有自有属性名（含不可枚举的），逐个递归
  for (const key of Object.getOwnPropertyNames(obj)) {
    deepFreeze(obj[key], seen);
  }
  // Symbol 键也别漏掉
  for (const sym of Object.getOwnPropertySymbols(obj)) {
    deepFreeze(obj[sym], seen);
  }

  return Object.freeze(obj);
}

// 用一个新的（未被污染的）配置对象来演示深冻结。
const deepConfig = deepFreeze({
  name: '我的应用',
  theme: { color: 'blue', nested: { fontSize: 14 } },
  features: ['登录', '注册'],
});

console.log('深冻结后各层状态：');
console.log('   isFrozen(顶层)        =', Object.isFrozen(deepConfig));
console.log('   isFrozen(theme)       =', Object.isFrozen(deepConfig.theme));
console.log('   isFrozen(theme.nested)=', Object.isFrozen(deepConfig.theme.nested));
console.log('   isFrozen(features)    =', Object.isFrozen(deepConfig.features));

attempt('修改深层 theme.nested.fontSize', () => {
  deepConfig.theme.nested.fontSize = 20;
});
attempt('push 到 features', () => {
  deepConfig.features.push('支付');
});
attempt('修改 features[0]', () => {
  deepConfig.features[0] = '改了';
});

console.log('全部失败后仍是 =', JSON.stringify(deepConfig));

// 循环引用也能安全处理。
const circular = { name: '自己' };
circular.self = circular;
try {
  deepFreeze(circular);
  console.log('循环引用对象深冻结成功，isFrozen =', Object.isFrozen(circular));
} catch (err) {
  console.log('循环引用出错：', err.message);
}

// 补充：freeze 不影响访问器属性上的 setter。freeze 只把"数据属性"设为不可写，
// 访问器属性没有 writable 开关，所以 setter 依然会被调用。
let backing = 0;
const withAccessor = {
  get value() {
    return backing;
  },
  set value(v) {
    backing = v;
    console.log('   （setter 仍然被调用了，参数 =', v, '）');
  },
};
Object.freeze(withAccessor);
console.log('freeze 后 isFrozen =', Object.isFrozen(withAccessor));
attempt('给访问器属性赋值 value = 5', () => {
  withAccessor.value = 5;
});
console.log('backing 变成了 =', backing, '（freeze 挡不住 setter）');

console.log('\n全部演示完毕。');
