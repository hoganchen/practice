/**
 * ============================================================================
 * 知识点：Object.create —— 显式指定原型与无原型对象
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】进阶
 * 【前置知识】09_objects/02_property_access.js、09_objects/08_property_descriptors.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Object.create(proto, propertiesObject) 创建一个新对象，并显式指定它的**原型**。
 *      - 第一个参数是新对象的原型（可以是对象，也可以是 null）。
 *      - 第二个参数可选，是属性描述符集合，格式与 Object.defineProperties 相同。
 *    它返回新对象。
 *
 * 2. 为什么需要
 *    (1) 原型式继承：JS 的继承本质是"原型链"。Object.create 是最直接的
 *        "我要一个以某对象为原型的对象"的表达方式，比 new 构造函数更贴近本质。
 *    (2) 无原型对象：Object.create(null) 得到一个没有 Object.prototype 的"纯净字典"。
 *        用它可以安全地做"哈希表"——不会因为 key 叫 'toString' 而撞到内置方法。
 *    (3) 想控制原型而不想定义构造函数时，Object.create 比 class 更轻量。
 *
 * 3. 核心语法要点
 *    (1) 属性查找规则：先在自有属性里找，找不到就顺着 __proto__ 链向上找，
 *        直到原型为 null 才停止，返回 undefined。
 *    (2) hasOwnProperty / Object.hasOwn 只检查自有；in 会查整条原型链。
 *    (3) Object.getPrototypeOf(obj) 读原型；Object.setPrototypeOf(obj, proto) 改原型
 *        （性能差，不推荐；应该在创建时就确定）。
 *    (4) 第二个参数里的属性描述符默认值全为 false（与 defineProperty 一致），
 *        所以通常要显式写 enumerable: true / writable: true。
 *    (5) `obj.__proto__` 是历史遗留的属性访问器，标准做法是用 Object.getPrototypeOf。
 *    (6) 所有普通对象的原型链顶端都是 Object.prototype，再往上是 null。
 *
 * 4. 常见陷阱
 *    (1) Object.create(null) 的对象没有 toString / hasOwnProperty / valueOf，
 *        直接调用会 TypeError；打印、字符串拼接、JSON.stringify 都要注意。
 *    (2) 原型上的属性是"共享"的：如果原型上有数组/对象属性，所有实例会共用同一份。
 *    (3) 给实例属性赋值时，如果原型上已有同名属性，会在实例上"遮蔽"它，而不是修改它。
 *    (4) 忘了第二个参数的描述符默认不可枚举，导致属性在 JSON 里消失。
 *    (5) Object.create 不执行任何构造函数，所以没有"初始化逻辑"这一步。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/10_object_create.js
 *
 * 【预期输出】
 *   分 6 个小节，演示原型指定、原型链查找、原型式继承与无原型字典。
 * ============================================================================
 */

console.log('--- 1. 创建一个以指定对象为原型的对象 ---');

const animal = {
  type: '动物',
  describe() {
    return `我是一只${this.type}`;
  },
};

// animal 成为 dog 的原型
const dog = Object.create(animal);
// 这是在 dog 自身上新增属性
dog.type = '狗';
dog.name = '旺财';

console.log('dog.name（自有）        =', dog.name);
console.log('dog.type（自有，遮蔽了原型上的 type） =', dog.type);
console.log('dog.describe()（来自原型） =', dog.describe());

console.log('Object.hasOwn(dog, "name")       =', Object.hasOwn(dog, 'name'));
console.log('Object.hasOwn(dog, "describe")   =', Object.hasOwn(dog, 'describe'), '（方法在原型上）');
console.log("'describe' in dog                =", 'describe' in dog, '（in 会查原型链）');

// 原型链：dog -> animal -> Object.prototype -> null
console.log('getPrototypeOf(dog) === animal      =', Object.getPrototypeOf(dog) === animal);
console.log(
  'getPrototypeOf(animal) === Object.prototype =',
  Object.getPrototypeOf(animal) === Object.prototype,
);
console.log('getPrototypeOf(Object.prototype)    =', Object.getPrototypeOf(Object.prototype));

console.log('\n--- 2. 原型上的属性是共享的 ---');

const sharedProto = {
  // 危险示范：原型上放一个引用类型的属性
  list: [],
  count: 0,
};

const a = Object.create(sharedProto);
const b = Object.create(sharedProto);

// 因为 a 和 b 都没有自有的 list，读取时都拿到原型上那个同一个数组。
a.list.push('来自 a');
console.log('a.list =', JSON.stringify(a.list));
console.log('b.list =', JSON.stringify(b.list), '（被连累了！）');
console.log('两者是同一个数组 =', a.list === b.list);

// 但原始值属性的"赋值"会在实例上新建一个自有属性，遮蔽掉原型上的。
a.count = 1;
console.log('a.count =', a.count, '，b.count =', b.count, '（原始值互不影响）');
console.log('a 现在有自有 count 了吗 =', Object.hasOwn(a, 'count'));
console.log('b 现在有自有 count 了吗 =', Object.hasOwn(b, 'count'));

console.log('\n--- 3. 第二个参数：属性描述符（默认不可枚举） ---');

const described = Object.create(Object.prototype, {
  // 只写 value 时，其余开关默认 false
  invisible: { value: '我不可枚举' },
  // 显式打开才能被遍历 / 序列化
  visible: { value: '我可以被枚举', enumerable: true, writable: true, configurable: true },
  // 访问器属性也可以
  computed: {
    get() {
      return '每次访问都重新计算';
    },
    enumerable: true,
    configurable: true,
  },
});

console.log('读取 invisible =', described.invisible);
console.log('Object.keys    =', JSON.stringify(Object.keys(described)));
console.log('JSON.stringify =', JSON.stringify(described));
console.log('getOwnPropertyNames =', JSON.stringify(Object.getOwnPropertyNames(described)));
console.log('computed =', described.computed);

console.log('\n--- 4. 原型式继承：不用 class 也能"继承" ---');

// 定义一个"基类"（其实是原型对象）
const shape = {
  describe() {
    return `${this.name} 的面积是 ${this.area()}`;
  },
  area() {
    return 0;
  },
};

// 用 Object.create 派生出子类型，并覆写 area
const rectProto = Object.create(shape, {
  area: {
    value: function () {
      return this.w * this.h;
    },
    enumerable: false,
    writable: true,
    configurable: true,
  },
});

// 创建一个真正的"矩形实例"
const rect = Object.create(rectProto);
rect.name = '矩形';
rect.w = 3;
rect.h = 4;

console.log('rect.describe() =', rect.describe());

// 检查属性到底在链条的哪一层
const ownerOf = (obj, key) => {
  let cur = obj;
  let level = 0;
  while (cur !== null) {
    if (Object.hasOwn(cur, key)) return `第 ${level} 层`;
    cur = Object.getPrototypeOf(cur);
    level++;
  }
  return '找不到';
};
console.log('name  在', ownerOf(rect, 'name'));
console.log('area  在', ownerOf(rect, 'area'));
console.log('describe 在', ownerOf(rect, 'describe'));

console.log('\n--- 5. Object.create(null)：无原型对象 ---');

// 这个对象没有原型，原型链只有一个节点。
const pureDict = Object.create(null);
pureDict.name = '张三';
pureDict.age = 20;

console.log('Object.getPrototypeOf(pureDict) =', Object.getPrototypeOf(pureDict));
console.log('内容 =', JSON.stringify(pureDict));
console.log('读取 name =', pureDict.name);

// 关键区别：没有继承来的内置方法
console.log('有 toString 吗 =', Object.hasOwn(pureDict, 'toString'), '（没有）');
console.log("'toString' in pureDict =", 'toString' in pureDict, '（in 也说没有）');
try {
  pureDict.toString();
} catch (err) {
  console.log('直接调用 toString 报错：', err.name, '-', err.message.slice(0, 50), '...');
}

// 对比普通对象：'toString' in {} 是 true，因为继承自 Object.prototype。
console.log("对比：'toString' in {} =", 'toString' in {});

// 为什么需要它？——安全地当作"字典/映射"使用。
// 下面演示普通对象作为字典的经典 bug：
const normalDict = {};
// 假设键来自用户输入，用户正好输入了 "constructor"
const userKey = 'constructor';
console.log('普通对象上 normalDict[userKey] =', typeof normalDict[userKey], '（拿到的是继承来的函数！）');
console.log('用 in 判断会误判 =', userKey in normalDict);

const safeDict = Object.create(null);
console.log('无原型对象上 safeDict[userKey] =', safeDict[userKey], '（干净的 undefined）');

// 补充：更现代的替代方案是 Map，它连字符串键的坑都没有。
const m = new Map();
m.set('constructor', '安全的值');
console.log('用 Map 也可以 =', m.get('constructor'));

// 无原型对象的注意事项：
console.log('typeof 仍是 object =', typeof pureDict);
console.log('JSON.stringify 正常 =', JSON.stringify(pureDict));
console.log('Object.keys 正常 =', JSON.stringify(Object.keys(pureDict)));

// 但字符串拼接会因为没有 toString 而报错
try {
  console.log('拼接结果：' + pureDict);
} catch (err) {
  console.log('字符串拼接报错：', err.name, '-', err.message.slice(0, 60), '...');
}

console.log('\n--- 6. 相关 API 与常见边界 ---');

// getPrototypeOf(null) 会抛 TypeError（null 不是对象）
try {
  Object.getPrototypeOf(null);
} catch (err) {
  console.log('getPrototypeOf(null) 报错：', err.name);
}

// Object.create 的第一个参数只能是对象或 null，其它类型抛 TypeError。
try {
  Object.create(42);
} catch (err) {
  console.log('Object.create(42) 报错：', err.name, '-', err.message.slice(0, 50), '...');
}

// setPrototypeOf 可以改原型，但性能代价大且会让 V8 去优化，不推荐在热路径使用。
const mutable = { a: 1 };
const newProto = { helper() { return '来自新原型'; } };
Object.setPrototypeOf(mutable, newProto);
console.log('改原型后 mutable.helper() =', mutable.helper());
console.log('但自有属性 a 还在 =', mutable.a);

// isPrototypeOf：判断"我是否在你原型链上"
console.log('animal.isPrototypeOf(dog) =', animal.isPrototypeOf(dog));

// 用 Object.getPrototypeOf 模拟 instanceOf：instanceof 检查的就是原型链。
class Base {}
class Sub extends Base {}
const sub = new Sub();
console.log('sub instanceof Base =', sub instanceof Base);
console.log('Base.prototype 在 sub 的原型链上 =', Base.prototype.isPrototypeOf(sub));

console.log('\n全部演示完毕。');
