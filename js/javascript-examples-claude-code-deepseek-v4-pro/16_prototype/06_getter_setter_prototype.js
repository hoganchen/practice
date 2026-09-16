/**
 * ============================================================================
 * 知识点：原型上的 getter/setter 与属性遮蔽（shadowing）
 * ============================================================================
 *
 * 【所属分类】16_prototype —— 原型与原型链
 * 【难度等级】进阶
 * 【前置知识】16_prototype/05_object_create.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    访问器属性（getter/setter）也可以定义在原型上，被所有实例共享。
 *    搭配"属性遮蔽"（实例自己定义同名属性盖住原型上的），就能实现
 *    "原型提供默认值/计算逻辑，实例可以覆盖"的常见模式。
 *
 * 2. 为什么需要
 *    - 在原型上定义 getter，比在构造函数里为每个实例都计算一遍更省。
 *    - 给"老代码里的裸字段"逐步加上校验逻辑：先加原型 getter，
 *      再把存储搬到私有/内部字段，调用方无需改动。
 *    - 理解遮蔽规则，才能在调试时看懂"为什么我改的值没生效"。
 *
 * 3. 核心语法要点
 *    - 定义方式（三种等价）：
 *        ① 对象字面量：{ get x() {}, set x(v) {} }
 *        ② Object.defineProperty(proto, 'x', { get, set, enumerable, configurable })
 *        ③ class 里：get x() {} / set x(v) {}
 *    - 查找与写入的关键规则（非常重要）：
 *        · 读取 obj.x 时，若原型上找到的是 getter，会以 obj 为 this 调用它；
 *        · 写入 obj.x = v 时，若原型上的 x 是**只有 getter 的访问器**，
 *          严格模式抛 TypeError，非严格模式静默失败；
 *        · 若原型上的是**普通数据属性**，写入会在 obj 上**新建**自有属性（遮蔽）；
 *        · 若原型上的是**有 setter 的访问器**，会调用该 setter，且不新建自有属性。
 *    - 想要"实例级覆盖"又有校验，通常组合：
 *        原型 getter/setter 访问 this._x（或私有字段），实例只改 _x。
 *    - Object.getOwnPropertyDescriptor 是判断"这是数据属性还是访问器"的唯一可靠方式。
 *
 * 4. 常见陷阱
 *    - 在 setter 里写 this.x = v（而不是 this._x），导致无限递归。
 *    - 在实例上给"只有 getter 的原型访问器"赋值 —— 严格模式报错。
 *    - 以为赋值会调用原型的 setter，但实际只是新建了自有属性（当原型上是数据属性时）。
 *    - 用 Object.assign / 展开运算符复制对象时，访问器会被"求值成普通值"（见 14 章 11 节）。
 *    - 类里定义 getter 却不定义 setter，实例赋值会抛错（类体严格模式）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 16_prototype/06_getter_setter_prototype.js
 *
 * 【预期输出】
 *   演示原型访问器的读写、遮蔽规则的各种组合，以及递归陷阱。
 * ============================================================================
 */

console.log('--- 1. 在原型上定义 getter/setter ---');

const proto = {};

Object.defineProperty(proto, 'temperature', {
  // getter 里的 this 是"调用方对象"，不是 proto
  get() {
    return this._celsius;
  },
  set(value) {
    // 名义上以摄氏写入，但可以附加校验
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('温度必须是数字');
    }
    this._celsius = value;
  },
  // 访问器默认不可枚举，这里显式打开便于观察
  enumerable: true,
  configurable: true,
});

const sensor = Object.create(proto);
sensor.label = '室内';

// 写：调用原型上的 setter（不会在 sensor 上新建 temperature 属性）
sensor.temperature = 25;
console.log('sensor.temperature =', sensor.temperature);
console.log('sensor._celsius（真正存储的地方）=', sensor._celsius);
console.log('sensor 自己有 temperature 属性吗？', Object.hasOwn(sensor, 'temperature'), '（没有！）');
console.log('原型上有吗？', Object.hasOwn(proto, 'temperature'));

try {
  sensor.temperature = '很热';
} catch (err) {
  console.log('写入非法值报错：', err.constructor.name, '—', err.message);
}

console.log('--- 2. 判断是数据属性还是访问器属性 ---');

const desc = Object.getOwnPropertyDescriptor(proto, 'temperature');
console.log('描述符的键：', Object.keys(desc).join(', '));
console.log('是访问器属性吗？', typeof desc.get === 'function' && typeof desc.set === 'function');
console.log('有 value 字段吗？', 'value' in desc, '（访问器没有 value）');

const dataDesc = Object.getOwnPropertyDescriptor(sensor, '_celsius');
console.log('_celsius 的描述符键：', Object.keys(dataDesc).join(', '));
console.log('是数据属性吗？', 'value' in dataDesc);

console.log('--- 3. 遮蔽规则全景：四种组合 ---');

// 组合一：原型上是数据属性，实例赋值 → 新建自有属性（遮蔽）
const p1 = { value: '原型上的数据属性' };
const o1 = Object.create(p1);
o1.value = '实例自己的';
console.log('① 原型数据属性 + 实例赋值 → o1.value =', o1.value,
  '| 自有吗？', Object.hasOwn(o1, 'value'), '| 原型没变：', p1.value);

// 组合二：原型上是"只有 getter"的访问器，实例赋值 → 严格模式报错
const p2 = {};
Object.defineProperty(p2, 'readonly', {
  get() {
    return '只读值';
  },
  configurable: true,
});
const o2 = Object.create(p2);
console.log('② 原型只有 getter → 读取：', o2.readonly);
try {
  o2.readonly = '试图覆盖';
} catch (err) {
  console.log('   严格模式下赋值报错：', err.constructor.name, '—', err.message);
}
console.log('   值没有变化：', o2.readonly, '| 有自有属性吗？', Object.hasOwn(o2, 'readonly'));

// 组合三：原型上是有 setter 的访问器，实例赋值 → 调用 setter，不新建自有属性
const p3 = {};
Object.defineProperty(p3, 'tracked', {
  get() {
    return `[tracked] ${this._v ?? '(空)'}`;
  },
  set(v) {
    this._v = `经过 setter 处理：${v}`;
  },
  configurable: true,
});
const o3 = Object.create(p3);
o3.tracked = '原始输入';
console.log('③ 有 setter → 结果：', o3.tracked);
console.log('   有自有 tracked 属性吗？', Object.hasOwn(o3, 'tracked'), '（没有，走的是 setter）');
console.log('   真正存到了 _v 上：', o3._v);

// 组合四：实例自己用 defineProperty 定义同名属性 → 覆盖原型访问器
const o4 = Object.create(p2);
Object.defineProperty(o4, 'readonly', {
  value: '实例自己定义的',
  writable: true,
  enumerable: true,
  configurable: true,
});
console.log('④ 实例自定义同名属性 → o4.readonly =', o4.readonly, '| 自有吗？', Object.hasOwn(o4, 'readonly'));

console.log('--- 4. class 里的 getter/setter（同样是原型访问器） ---');

class Circle {
  constructor(radius) {
    // 注意：这里也走 setter，所以初始化同样受校验
    this.radius = radius;
  }

  get radius() {
    return this._radius;
  }

  set radius(value) {
    if (typeof value !== 'number' || value <= 0) {
      throw new RangeError('半径必须是正数');
    }
    this._radius = value;
  }

  // 派生只读属性：没有 setter
  get area() {
    return Number((Math.PI * this._radius ** 2).toFixed(3));
  }

  get diameter() {
    return this._radius * 2;
  }

  set diameter(value) {
    // 复用 radius 的校验逻辑，避免重复写
    this.radius = value / 2;
  }
}

const circle = new Circle(5);
console.log('radius =', circle.radius, '| area =', circle.area, '| diameter =', circle.diameter);
circle.diameter = 20;
console.log('把 diameter 设为 20 后 radius =', circle.radius, '| area =', circle.area);

// class 里的访问器也在原型上
const radiusDesc = Object.getOwnPropertyDescriptor(Circle.prototype, 'radius');
console.log('class 访问器在原型上吗？', typeof radiusDesc.get === 'function');
console.log('实例自己有 radius 吗？', Object.hasOwn(circle, 'radius'), '（没有，只有 _radius）');

try {
  circle.area = 1;
} catch (err) {
  console.log('给只读派生属性赋值报错：', err.constructor.name, '—', err.message);
}

console.log('--- 5. 递归陷阱（try/catch 演示） ---');

const brokenProto = {};
Object.defineProperty(brokenProto, 'name', {
  get() {
    return this.name; // 读自己 → 无限递归
  },
  set(v) {
    this.name = v; // 写自己 → 无限递归
  },
  configurable: true,
});
const brokenObj = Object.create(brokenProto);
try {
  brokenObj.name = '测试';
} catch (err) {
  console.log('递归报错：', err.constructor.name, '—', err.message.slice(0, 50));
}

// 正确写法：用不同名字的"后备字段"（下划线或私有字段）
const goodProto = {};
Object.defineProperty(goodProto, 'name', {
  get() {
    return this._name ?? '(未设置)';
  },
  set(v) {
    this._name = String(v).trim();
  },
  enumerable: true,
  configurable: true,
});
const goodObj = Object.create(goodProto);
goodObj.name = '  带空格的输入  ';
console.log('正确写法：', JSON.stringify(goodObj.name), '| 后备字段 =', JSON.stringify(goodObj._name));

console.log('--- 6. 遮蔽带来的调试难题 ---');

// 当同一个名字在原型和实例上都存在时，只有实例的生效
const config = {
  get retries() {
    return '原型默认值：3';
  },
  configurable: true,
};
const task = Object.create(config);
console.log('初始：', task.retries);
// 直接赋值：因为原型上是"只有 getter"的访问器，这里会失败（严格模式）
try {
  task.retries = 5;
} catch (err) {
  console.log('直接赋值失败：', err.message);
}
// 想覆盖，必须用 defineProperty 显式定义自有属性
Object.defineProperty(task, 'retries', {
  value: 5,
  writable: true,
  enumerable: true,
  configurable: true,
});
console.log('用 defineProperty 覆盖后：', task.retries);

console.log('--- 7. 遍历与拷贝的注意点 ---');

const mixed = Object.create(
  (() => {
    const p = { inheritedData: 1 };
    Object.defineProperty(p, 'inheritedGetter', {
      get() {
        return '来自原型的计算值';
      },
      enumerable: true,
    });
    return p;
  })(),
  {
    ownData: { value: 2, enumerable: true, writable: true, configurable: true },
    ownGetter: {
      get() {
        return '来自实例的计算值';
      },
      enumerable: true,
    },
  },
);

console.log('Object.keys（只看自有）=', JSON.stringify(Object.keys(mixed)));
console.log('JSON.stringify（读实例自有的可枚举属性，包括 getter）=', JSON.stringify(mixed));
console.log('展开运算符 =', JSON.stringify({ ...mixed }));
const forInKeys = [];
for (const k in mixed) forInKeys.push(k);
console.log('for...in（含原型上可枚举的）=', JSON.stringify(forInKeys));

console.log('--- 8. 实践建议 ---');

const advice = [
  'setter 里永远不要写 this.同名，要用 this._name 或私有字段 #name。',
  '判断属性性质只用 Object.getOwnPropertyDescriptor，不要靠猜。',
  '只读属性在严格模式下赋值会抛错 —— 这是好事，能尽早暴露误用。',
  '拷贝对象时留意访问器会被求值成普通值，需要保留访问器请用描述符复制。',
];
for (const line of advice) console.log('  •', line);

console.log('\n全部演示完毕。');
