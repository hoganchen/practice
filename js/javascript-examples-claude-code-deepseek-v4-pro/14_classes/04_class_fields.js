/**
 * ============================================================================
 * 知识点：实例字段 —— 公有字段与字段初始化顺序
 * ============================================================================
 *
 * 【所属分类】14_classes —— 类的语法与面向对象
 * 【难度等级】入门
 * 【前置知识】14_classes/03_static_members.js
 *
 * 【也见】34_modern_es_features/02_es2022_features.js —— ES2022 特性综述里也讲了类字段。
 *        本文件是类字段的主场（专文，含完整初始化顺序）；那篇只给最小示例。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    类字段（class field）是允许在类体里、方法之外直接写 "名字 = 值" 来声明
 *    实例属性的语法，ES2022 起正式标准化。等价于在构造函数里写 this.名字 = 值，
 *    但写法更集中、更容易读。
 *
 * 2. 为什么需要
 *    - 把"这个类有哪些属性"集中写在类体顶部，一眼看全，不必翻构造函数。
 *    - 保证属性一定存在：即使构造函数分支没走到，字段也已经初始化了，
 *      对象的"形状"（hidden class）更稳定，引擎优化更好。
 *    - 语法统一：静态字段、私有字段、私有方法都共享同一套写法。
 *
 * 3. 核心语法要点
 *    - 公有实例字段：name = value;  每个实例各有一份。
 *    - 无初始值：name;  等价于 name = undefined;  但属性确实被创建了。
 *    - 字段可以引用 this 以及构造函数接收不到的东西（例如另一个字段）：
 *      full = this.first + this.last   —— 但要注意初始化顺序！
 *    - 初始化顺序（非常关键）：
 *        ① 基类（最顶层父类）的字段初始化器先执行；
 *        ② 然后是基类构造函数体；
 *        ③ 然后才轮到子类字段初始化器；
 *        ④ 最后是子类构造函数体。
 *      换句话说：字段初始化器在"包含它的那个类的 super() 返回之后、
 *      该类的构造函数体之前"执行。
 *    - 字段初始化器里的 this 就是"正在构造的这个实例"。
 *    - 字段是"自有属性"，可枚举、可写、可配置（与类方法不同）。
 *    - 箭头函数字段：handler = () => {} 会绑定当前实例的 this（见 15 章）。
 *
 * 4. 常见陷阱
 *    - 顺序陷阱：子类字段初始化器在 super() 之后才跑，所以父类构造函数里
 *      访问子类字段会得到 undefined。
 *    - 用父类构造函数参数去初始化子类字段：父类还没跑完就访问子类字段行不通。
 *    - 误以为字段写在原型上：字段是每个实例自己的，不共享。
 *    - 用字段初始化器调用"子类里定义的方法"，而该方法依赖尚未初始化的字段。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 14_classes/04_class_fields.js
 *
 * 【预期输出】
 *   打印字段的创建方式、初始化顺序轨迹，以及顺序陷阱的实际表现。
 * ============================================================================
 */

console.log('--- 1. 基本写法：等价于在 constructor 里赋值 ---');

// 老写法
class OldStyle {
  constructor(name) {
    this.name = name;
    this.createdAt = '未设置';
    this.tags = [];
  }
}

// 新写法：字段写在类体里，构造函数只处理"必须靠参数才能决定"的部分
class NewStyle {
  // 有初始值的字段
  createdAt = '未设置';
  // 引用类型的字段：注意每个实例都会得到"新的一份"数组，
  // 而不是共享同一个数组（这一点和"原型上放数组"完全不同）。
  tags = [];
  // 无初始值的字段：属性会被创建，值为 undefined
  note;

  constructor(name) {
    this.name = name;
  }

  snapshot() {
    return `${this.name} | tags=${JSON.stringify(this.tags)} | note=${this.note}`;
  }
}

const os = new OldStyle('老写法');
const ns = new NewStyle('新写法');
console.log('老写法：', os.name, os.createdAt, JSON.stringify(os.tags));
console.log('新写法：', ns.snapshot());

console.log('--- 2. 字段是每个实例各自一份，不共享 ---');

const x1 = new NewStyle('甲');
const x2 = new NewStyle('乙');
x1.tags.push('x1 的标签');
// 若数组被共享，x2.tags 也会看到这个元素。事实是没有。
console.log('x1.tags =', JSON.stringify(x1.tags));
console.log('x2.tags =', JSON.stringify(x2.tags));
console.log('两个数组是同一个对象吗？', x1.tags === x2.tags);
console.log('tags 是实例自有属性吗？', Object.hasOwn(x1, 'tags'));
console.log('原型上有 tags 吗？', Object.hasOwn(NewStyle.prototype, 'tags'));
console.log('note 属性确实被创建了吗？', Object.hasOwn(x1, 'note'), '值为', x1.note);

console.log('--- 3. 字段描述符：可枚举、可写、可配置 ---');

console.log('tags 的描述符：', JSON.stringify(Object.getOwnPropertyDescriptor(x1, 'tags'), null, 0));
console.log('注意与类方法对比 —— 方法是不可枚举的：');
console.log(
  'NewStyle.prototype.snapshot 的 enumerable =',
  Object.getOwnPropertyDescriptor(NewStyle.prototype, 'snapshot').enumerable,
);

console.log('--- 4. 字段可以引用 this 与其它字段 ---');

class Rectangle {
  width = 0;
  height = 0;
  // 引用前面的字段：初始化器按书写顺序、逐个求值，所以这里能读到 width/height。
  area = this.width * this.height;
  // 引用一个方法也是允许的，方法在原型上，随时可访问。
  label = `矩形${this.describeShape()}`;

  constructor(width, height) {
    // 构造函数里重新赋值会覆盖字段初始化器的结果。
    // 顺序是：字段初始化器先全部执行 → 然后才执行构造函数体。
    this.width = width;
    this.height = height;
    // 因为上面覆盖了 width/height，area 需要重算，否则还是 0。
    this.area = this.width * this.height;
  }

  describeShape() {
    // 此时字段可能还没初始化完，所以这里不依赖字段，只用类型判断。
    return '(未知尺寸)';
  }
}

const rect = new Rectangle(4, 5);
console.log('矩形：', rect.width, '×', rect.height, '面积 =', rect.area);
console.log('label 字段 =', rect.label);

console.log('--- 5. 字段初始化顺序：基类字段 → 基类构造体 → 子类字段 → 子类构造体 ---');

// 用一个数组记录执行轨迹，把顺序可视化。
const trace = [];

class Base {
  baseField = (trace.push('① 基类字段初始化器'), 'base-field');

  constructor() {
    trace.push('② 基类 constructor 体');
    // 在基类构造函数里访问子类字段会怎样？答案是 undefined。
    // 因为子类字段初始化器尚未执行（要等 super() 返回之后）。
    this.baseSeesChild = this.childField;
  }

  show() {
    return `baseField=${this.baseField}, childField=${this.childField}`;
  }
}

class Derived extends Base {
  childField = (trace.push('③ 子类字段初始化器'), 'child-field');

  constructor() {
    trace.push('④ super() 调用前');
    super();
    trace.push('⑤ 子类 constructor 体（super 之后）');
    this.derivedSeesChild = this.childField;
  }
}

const d = new Derived();
console.log('执行顺序轨迹：');
for (const line of trace) console.log('  •', line);
console.log('基类构造时看到的 childField：', d.baseSeesChild);
console.log('子类构造时看到的 childField：', d.derivedSeesChild);
console.log('最终状态：', d.show());

console.log('--- 6. 顺序陷阱的典型表现 ---');

// 很多人想用"父类构造函数的参数"去初始化"子类的字段"，结果拿到 undefined。
const earlyCalls = [];

class Parent2 {
  constructor(value) {
    this.value = value;
    // 这里调用的是一个被子类重写的方法，而该方法依赖子类字段。
    // 此刻子类字段还没初始化 —— 于是出问题。
    this.computed = this.transform();
  }

  transform() {
    return `Parent 处理 ${this.value}`;
  }
}

class Child2 extends Parent2 {
  // 子类字段：初始化器在 super() 之后才跑
  prefix = '★';

  constructor(value) {
    super(value);
    // 现在 prefix 已经有值了，可以安全重算。
    this.computed = this.transform();
  }

  transform() {
    // 第一次被父类构造函数调用时 this.prefix 是 undefined，
    // 于是拼出 "undefined 处理 ..." 这种脏数据。这里记录下来。
    earlyCalls.push(this.prefix);
    // 用 String 兜底只是为了让程序不崩，真实项目里应当避免这种时序依赖。
    return `${String(this.prefix)} 处理 ${this.value}`;
  }
}

const c2 = new Child2('数据');
console.log('父类过早调用时，子类字段的值 =', String(earlyCalls[0]));
console.log('这就是经典的"子类字段在 super() 期间还是 undefined"陷阱。');
console.log('构造完成后的 computed =', c2.computed);

// 用一个显式的"初始化标志"来观察陷阱是否发生
class Child3 extends Parent2 {
  ready = false;
  prefix = '★';

  constructor(value) {
    super(value);
    this.ready = true;
    this.computed = this.transform();
  }

  transform() {
    if (!this.ready) {
      // 说明父类构造函数提前调用了本方法
      return '(父类过早调用，子类字段尚未就绪)';
    }
    return `${this.prefix} 处理 ${this.value}`;
  }
}

console.log('加了就绪标志后：', new Child3('数据').computed);

console.log('--- 7. 箭头函数字段：顺带把 this 绑死 ---');

class Button {
  label = '确定';
  // 箭头函数字段：每个实例一份，this 永远指向该实例，
  // 所以可以安全地把它当回调传出去（详见 15_this_and_context/08）。
  handleClick = () => {
    return `点击了「${this.label}」`;
  };

  // 对比：普通方法提取出来就丢了 this
  handleClickNormal() {
    return `点击了「${this.label}」`;
  }
}

const btn = new Button();
const callback = btn.handleClick;
console.log('提取箭头函数字段后调用：', callback());

const normalCallback = btn.handleClickNormal;
try {
  normalCallback();
} catch (err) {
  console.log('提取普通方法后调用报错：', err.constructor.name, '—', err.message);
}

console.log('\n全部演示完毕。');
