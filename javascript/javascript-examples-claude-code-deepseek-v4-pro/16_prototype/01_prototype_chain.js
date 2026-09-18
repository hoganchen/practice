/**
 * ============================================================================
 * 知识点：原型链查找机制 —— 对象 → 原型 → 原型链 → null
 * ============================================================================
 *
 * 【所属分类】16_prototype —— 原型与原型链
 * 【难度等级】入门
 * 【前置知识】09_objects/01_object_literal.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    每个对象都有一个隐藏的内部链接，指向另一个对象（或 null），这个链接叫
 *    [[Prototype]]。访问 obj.key 时，如果 obj 自己没有 key，引擎就沿着这条链
 *    一路向上找，直到找到为止；找到链的尽头（null）还没找到就返回 undefined。
 *    这条链就是"原型链"。
 *
 * 2. 为什么需要
 *    - 属性共享：方法只需在原型上存一份，所有实例共享，极大节省内存。
 *    - 动态性：往原型上加属性，所有已存在的对象立刻能"看到"。
 *    - 继承的实现基础：JS 的继承就是"把原型链接起来"。
 *
 * 3. 核心语法要点
 *    - 读取属性的查找顺序（[[Get]]）：
 *        ① 对象自有属性（含访问器 getter）→ 有就返回；
 *        ② 沿 [[Prototype]] 往上，逐个对象查找自有属性；
 *        ③ 到 null 终止 → 返回 undefined。
 *    - 写入属性（[[Set]]）则**不会**沿链查找后修改：绝大多数情况下是在
 *      接收者对象上"新建"一个自有属性（这叫属性遮蔽 shadowing）。
 *    - 几个观察工具：
 *        Object.getPrototypeOf(obj)  —— 读原型（推荐）
 *        obj.__proto__               —— 旧式读写原型的访问器（不推荐）
 *        Object.hasOwn(obj, key)     —— 只看自有属性
 *        key in obj                  —— 自有 + 原型链上是否有
 *        Object.getOwnPropertyNames / keys —— 只看自有属性
 *    - 原型链的终点：Object.prototype 的原型是 null。
 *    - 数组、函数、日期等都有自己的原型链：
 *        数组实例 → Array.prototype → Object.prototype → null
 *        函数对象 → Function.prototype → Object.prototype → null
 *
 * 4. 常见陷阱
 *    - 用 for...in 会把原型上**可枚举**的属性也遍历出来（类方法不可枚举，
 *      但自己用赋值加到原型上的属性是可枚举的）。
 *    - 用 JSON.stringify / Object.keys / 展开运算符时只取自有属性，
 *      所以原型上的数据"看不见"。
 *    - 判断属性是否存在时，`in` 与 Object.hasOwn 的语义不同，别混用。
 *    - 给原型赋值会影响所有实例（这既是特性也是风险）。
 *    - 原始值（数字/字符串）访问属性时会临时装箱成包装对象，
 *      所以 (123).toFixed 能找到 Number.prototype 上的方法。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 16_prototype/01_prototype_chain.js
 *
 * 【预期输出】
 *   打印原型链结构、逐层查找过程、属性遮蔽现象，以及多种检测方式的差异。
 * ============================================================================
 */

console.log('--- 1. 一个普通对象的原型链 ---');

const obj = { a: 1 };
console.log('obj 自身的属性：', JSON.stringify(obj));

// Object.getPrototypeOf 是读取原型的标准方式
const objProto = Object.getPrototypeOf(obj);
console.log('obj 的原型是 Object.prototype 吗？', objProto === Object.prototype);
console.log('再往上一层是 null 吗？', Object.getPrototypeOf(objProto) === null);

// 用一个循环把整条链画出来。
// 注意：这里用 "原型对象自己有没有 constructor" 来判断名字，
// 因为自定义对象字面量做原型时，它并没有自己的 constructor，
// 从它继承来的 constructor 是 Object —— 直接打印会误导人。
function protoName(protoObj) {
  if (Object.hasOwn(protoObj, 'constructor') && typeof protoObj.constructor === 'function') {
    return protoObj.constructor.name;
  }
  return '(自定义原型对象)';
}

function chainOf(value, label) {
  const parts = [];
  let cur = Object.getPrototypeOf(value);
  while (cur !== null) {
    parts.push(protoName(cur));
    cur = Object.getPrototypeOf(cur);
  }
  parts.push('null');
  console.log(`${label} 的原型链：${label} → ${parts.join(' → ')}`);
}
chainOf(obj, 'obj');

console.log('--- 2. 查找过程：逐层向上 ---');

// 造一条自定义的原型链：leaf → middle → root → Object.prototype → null
const root = { level: 'root', shared: '所有层都能看到' };
const middle = Object.create(root); // 让 middle 的原型是 root
middle.level = 'middle';
const leaf = Object.create(middle);
leaf.level = 'leaf';
leaf.own = 'leaf 自己的';

console.log('leaf.own（自有属性）→', leaf.own);
console.log('leaf.level（自有属性，遮蔽了上层）→', leaf.level);
console.log('leaf.shared（来自 root）→', leaf.shared);
console.log('leaf.notExist（整条链都没有）→', leaf.notExist);

// 把每一层的 level 打印出来，直观看到"同名属性被最近的层遮住"
console.log('沿链看同名属性：');
let cursor = leaf;
let depth = 0;
while (cursor !== null) {
  console.log(`  第 ${depth} 层 ${cursor.level ? `level = ${cursor.level}` : '(没有 level)'}`);
  cursor = Object.getPrototypeOf(cursor);
  depth += 1;
}

chainOf(leaf, 'leaf');

console.log('--- 3. 属性遮蔽（shadowing）与删除后的回退 ---');

console.log('删除前 leaf.level =', leaf.level);
console.log('删除叶子上的同名属性后回退到上一层：');
delete leaf.level;
console.log('  删除后 leaf.level =', leaf.level, '（回退到 middle）');
delete middle.level;
console.log('  再删 middle 后 =', leaf.level, '（回退到 root）');
delete root.level;
console.log('  再删 root 后 =', leaf.level, '（整条链都没有了）');

console.log('--- 4. 写入属性不会修改原型，而是新建自有属性 ---');

const proto = { color: '红' };
const child = Object.create(proto);
console.log('初始：child.color =', child.color, '| child 有自有 color 吗？', Object.hasOwn(child, 'color'));

// 赋值会在 child 上新建一个自有属性，原型不受影响
child.color = '蓝';
console.log('赋值后：child.color =', child.color, '| child 有自有 color 吗？', Object.hasOwn(child, 'color'));
console.log('原型上的 color 被改了吗？', proto.color);
console.log('原型上的 color 仍然是「红」吗？', proto.color === '红');

// 删除自有属性后又会"看到"原型的值
delete child.color;
console.log('删除自有属性后又看到：', child.color);

console.log('--- 5. 内置类型的原型链 ---');

chainOf([], '数组实例');
chainOf(function namedFn() {}, '函数');
chainOf(new Date(), 'Date 实例');
chainOf(new Map(), 'Map 实例');
chainOf('abc', '字符串原始值');
chainOf(123, '数字原始值');

// 原始值也能"找到"原型上的方法，因为访问属性时会临时装箱
console.log('(123).toFixed(2) =', (123).toFixed(2), '（来自 Number.prototype）');
console.log('"abc".toUpperCase() =', 'abc'.toUpperCase(), '（来自 String.prototype）');
console.log('数字原型上有 toFixed 吗？', Object.hasOwn(Number.prototype, 'toFixed'));

console.log('--- 6. 三种"属性是否存在"的检测方式 ---');

const probe = Object.create({ inheritedKey: 'in', inheritedMethod() {} });
probe.ownKey = 'own';

const checks = [
  ['Object.hasOwn(probe, "ownKey")', Object.hasOwn(probe, 'ownKey')],
  ['Object.hasOwn(probe, "inheritedKey")', Object.hasOwn(probe, 'inheritedKey')],
  ['"inheritedKey" in probe', 'inheritedKey' in probe],
  ['"toString" in probe', 'toString' in probe],
  ['Object.hasOwn(probe, "toString")', Object.hasOwn(probe, 'toString')],
  ["probe.hasOwnProperty('ownKey')", probe.hasOwnProperty('ownKey')],
];
for (const [expr, result] of checks) {
  console.log(`  ${expr.padEnd(38)} → ${result}`);
}
console.log('小结：in 会查整条原型链，Object.hasOwn 只看自己，'
  + '而 Object.prototype 上的键（如 toString）对任何对象都"in 为 true"。');

// 对象字面量创建的对象还有一个特殊情况：Object.create(null) 没有原型
const noProto = Object.create(null);
noProto.x = 1;
console.log('无原型对象：', JSON.stringify(noProto));
console.log('它的原型是：', Object.getPrototypeOf(noProto));
console.log('它有 toString 吗？', typeof noProto.toString, '（连 Object.prototype 的方法都没有）');

console.log('--- 7. for...in 与 Object.keys 的差别 ---');

const enumerableProto = { fromProto: '原型上的可枚举属性' };
const enumChild = Object.create(enumerableProto);
enumChild.fromChild = '自己的可枚举属性';

const keys = [];
for (const k in enumChild) keys.push(k);
console.log('for...in 遍历结果：', keys.join(', '), '（含原型上的）');
console.log('Object.keys 结果：', Object.keys(enumChild).join(', '), '（只含自有的）');
console.log('Object.getOwnPropertyNames 结果：', Object.getOwnPropertyNames(enumChild).join(', '));

console.log('\n全部演示完毕。');
