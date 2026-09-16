/**
 * ============================================================================
 * 知识点：方法解析顺序（MRO）—— 遮蔽、删除实例属性后回退到原型
 * ============================================================================
 *
 * 【所属分类】16_prototype —— 原型与原型链
 * 【难度等级】进阶
 * 【前置知识】16_prototype/06_getter_setter_prototype.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    方法解析顺序（Method Resolution Order）指的是：调用 obj.m() 时，
 *    引擎沿着原型链从哪里、按什么次序找到那个 m。
 *    JavaScript 采用**深度优先、最近的优先**的单链查找规则（与 Python 的
 *    多继承 MRO 不同，JS 只有一条链，所以规则简单得多）。
 *
 * 2. 为什么需要
 *    - 排错："我明明定义了方法却调用到了别人" 的根因就在这里。
 *    - 理解为什么删除实例属性后行为会"变回去"。
 *    - 设计可覆盖的默认实现（模板方法、插件系统）。
 *
 * 3. 核心语法要点
 *    - 查找规则（方法调用 obj.m()）：
 *        ① 从 obj 自己的属性里找 m；找到且是函数 → 用它（this = obj）；
 *        ② 沿 [[Prototype]] 一路向上，找到**第一个**名为 m 的属性；
 *        ③ 到 null 还没找到 → TypeError: obj.m is not a function。
 *    - 关键：**"最近的"决定一切**。哪怕更上层还有同名方法，也不会被选中。
 *    - 删除实例自有属性（delete obj.m）后，查找会自然回退到原型上的版本。
 *    - "遮蔽"不影响原型本身：原型上的方法对其它对象仍然可用。
 *    - 完整的查找顺序示例：
 *        instance → Child.prototype → Parent.prototype → ... → Object.prototype → null
 *    - 用 Object.hasOwn / in / 逐层遍历可以把这个过程可视化出来
 *      （本节提供了一个 traceMethod 工具函数）。
 *
 * 4. 常见陷阱
 *    - 给实例赋值同名属性会"永久"遮蔽原型方法（直到 delete 掉）。
 *    - delete 只能删除**自有可配置**属性，删不掉原型上的，也删不掉
 *      configurable: false 的属性。
 *    - 用 delete 删除数组元素（delete arr[0]）不会改变 length，
 *      会留下一个"空洞"（empty slot），这是另一类坑。
 *    - 类的方法是不可枚举的，但"用赋值加到原型上"的方法可枚举，
 *      会影响 for...in 的结果（见 03 节）。
 *    - 调试时用 console.log(obj) 只看到自有属性，
 *      想看原型上的东西要用 Object.getPrototypeOf 逐层看。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 16_prototype/07_method_resolution_order.js
 *
 * 【预期输出】
 *   逐层打印方法解析过程、遮蔽与回退、delete 的效果，以及多层继承的查找轨迹。
 * ============================================================================
 */

console.log('--- 0. 一个可视化查找过程的工具 ---');

// 模拟引擎的查找过程，把每一层都打印出来，方便理解
function traceMethod(obj, name) {
  const trail = [];
  let cur = obj;
  let level = 0;
  while (cur !== null) {
    const label = cur === obj
      ? '实例自己'
      : (Object.hasOwn(cur, 'constructor') && typeof cur.constructor === 'function'
        ? `${cur.constructor.name}.prototype`
        : '(自定义原型对象)');
    if (Object.hasOwn(cur, name)) {
      trail.push(`${label} ✅ 找到 ${name}`);
      // 找到就停下 —— 这正是引擎的行为
      return { trail, foundAt: label, stop: true };
    }
    trail.push(`${label} ❌ 没有 ${name}`);
    cur = Object.getPrototypeOf(cur);
    level += 1;
    if (level > 20) break; // 防御性上限
  }
  trail.push('null → 查找失败');
  return { trail, foundAt: null, stop: false };
}

console.log('--- 1. 最基础的解析：实例 → 原型 ---');

class Vehicle {
  constructor(brand) {
    this.brand = brand;
  }
  start() {
    return `${this.brand} 启动了（父类实现）`;
  }
  honk() {
    return '叭叭！';
  }
}

class Car extends Vehicle {
  start() {
    return `${this.brand} 启动了（子类实现）`;
  }
  openTrunk() {
    return '后备箱打开了';
  }
}

const car = new Car('某品牌');

console.log('查找 start 的过程：');
for (const line of traceMethod(car, 'start').trail) console.log('  ', line);
console.log('car.start() =', car.start(), '→ 用的是最近的（子类）版本');

console.log('查找 honk 的过程：');
for (const line of traceMethod(car, 'honk').trail) console.log('  ', line);
console.log('car.honk() =', car.honk(), '→ 子类没有，回退到父类');

console.log('查找一个不存在的方法：');
for (const line of traceMethod(car, 'fly').trail) console.log('  ', line);
try {
  car.fly();
} catch (err) {
  console.log('调用不存在的方法报错：', err.constructor.name, '—', err.message);
}

console.log('--- 2. 遮蔽：实例属性盖住原型方法 ---');

// 直接在实例上放一个同名属性
car.start = function customStart() {
  return `${this.brand} 启动了（实例上的临时实现）`;
};
console.log('遮蔽后 car.start() =', car.start());
console.log('这个 start 是自有属性吗？', Object.hasOwn(car, 'start'));

// 其它实例不受影响 —— 遮蔽只作用于这一个对象
const anotherCar = new Car('另一个品牌');
console.log('另一个实例仍然用子类版本：', anotherCar.start());

// 原型上的方法也没被改
console.log('Car.prototype.start 还在吗？',
  typeof Car.prototype.start === 'function',
  '| 它的效果：', Car.prototype.start.call(car));

console.log('--- 3. 删除实例属性后"回退"到原型 ---');

console.log('删除前：', car.start());
delete car.start;
console.log('删除后：', car.start(), '（回退到 Car.prototype 的版本）');
console.log('再删就回退到更上一层吗？我们来试：');
// 注意：Car.prototype 上的是类方法，configurable 为 true，可以删
delete Car.prototype.start;
console.log('  删掉 Car.prototype.start 后：', car.start(), '（回退到 Vehicle.prototype）');
// 恢复现场，避免影响后面的演示
Car.prototype.start = function start() {
  return `${this.brand} 启动了（子类实现）`;
};
console.log('  恢复后：', car.start());

console.log('--- 4. 哪些属性删不掉 ---');

const obj = {};
// 用普通赋值创建 → configurable: true，可以删
obj.deletable = 1;
// 用 defineProperty 且 configurable: false → 删不掉
Object.defineProperty(obj, 'permanent', {
  value: 2,
  configurable: false,
});
console.log('删除 deletable 成功吗？', delete obj.deletable,
  '| 现在还存在于 own 里吗？', Object.hasOwn(obj, 'deletable'));

// 删除不可配置属性在严格模式下会直接抛 TypeError，所以要包起来
try {
  delete obj.permanent;
  console.log('删除 permanent 成功（意外）');
} catch (err) {
  console.log('删除 permanent 报错：', err.constructor.name, '—', err.message);
}
console.log('permanent 还在吗？', Object.hasOwn(obj, 'permanent'), '| 值 =', obj.permanent);

// 原型上的属性不是"自有属性"，delete 自然删不掉
class Base {}
Base.prototype.hello = function hello() {
  return 'hi';
};
const derived = new Base();
console.log('尝试 delete derived.hello →', delete derived.hello);
console.log('仍然可以调用：', derived.hello(), '（delete 只影响自有属性）');

console.log('--- 5. 多层继承的完整解析链 ---');

class A {
  whoAmI() {
    return 'A';
  }
  onlyA() {
    return '只有 A 有';
  }
}
class B extends A {
  whoAmI() {
    return 'B';
  }
  onlyB() {
    return '只有 B 有';
  }
}
class C extends B {
  whoAmI() {
    return 'C';
  }
  onlyC() {
    return '只有 C 有';
  }
}

const inst = new C();
const cases = ['whoAmI', 'onlyC', 'onlyB', 'onlyA', 'toString', 'notExist'];
console.log('  方法名       在哪一层找到');
for (const name of cases) {
  const result = traceMethod(inst, name);
  console.log(`  ${name.padEnd(12)} ${result.foundAt ?? '（未找到）'}`);
}
console.log('调用结果：');
console.log('  inst.whoAmI() =', inst.whoAmI(), '（C 赢了）');
console.log('  inst.onlyB() =', inst.onlyB());
console.log('  inst.onlyA() =', inst.onlyA());
console.log('  inst.toString() =', typeof inst.toString, '（来自 Object.prototype）');

console.log('--- 6. 用"实例遮蔽"实现对象级定制 ---');

// 这是很实用的模式：同一批对象，个别对象需要特殊行为时临时覆盖
class ApiClient {
  request(path) {
    return `GET ${path}（真实网络请求）`;
  }
  timeout() {
    return 5000;
  }
}

const client = new ApiClient();
const testClient = new ApiClient();
// 只给测试客户端打补丁，不影响生产实例
testClient.request = function stubRequest(path) {
  return `GET ${path}（测试替身，不发网络请求）`;
};
console.log('真实客户端：', client.request('/users'));
console.log('测试客户端：', testClient.request('/users'));
console.log('两者共享同一个类方法吗？',
  Object.getPrototypeOf(client).request === Object.getPrototypeOf(testClient).request);

console.log('--- 7. 数组方法的解析链顺带一提 ---');

const arr = [1, 2, 3];
const arrayCases = ['push', 'map', 'filter', 'at'];
console.log('  方法名     属于哪一层');
for (const name of arrayCases) {
  const onInstance = Object.hasOwn(arr, name);
  const onArrayProto = Object.hasOwn(Array.prototype, name);
  const onObjectProto = Object.hasOwn(Object.prototype, name);
  const where = onInstance
    ? '实例自己'
    : (onArrayProto ? 'Array.prototype' : (onObjectProto ? 'Object.prototype' : '未找到'));
  console.log(`  ${name.padEnd(10)} ${where}`);
}
// 数组实例自己只有索引与 length
console.log('数组实例的自有属性：', Object.getOwnPropertyNames(arr).join(', '));

console.log('--- 8. 排查清单 ---');

const checklist = [
  '调用到了意料之外的方法？用 Object.hasOwn 检查是否是实例自己的属性。',
  '方法丢失？看看是不是被同名实例属性遮蔽了（可能是赋错值）。',
  '想恢复原型行为？delete 掉实例上的那个自有属性。',
  '不确定方法在哪一层？用 Object.getPrototypeOf 逐层打印。',
  '给对象打补丁做测试很方便，但记得用完 delete 掉，避免污染。',
];
for (const line of checklist) console.log('  •', line);

console.log('\n全部演示完毕。');
