/**
 * ============================================================================
 * 知识点：访问器属性 —— get / set 与 Object.defineProperty
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】进阶
 * 【前置知识】09_objects/01_object_literal.js、09_objects/06_object_assign.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    对象的属性分两类：
 *      (1) 数据属性（data property）：直接存一个值，就是我们平常写的 { a: 1 }。
 *      (2) 访问器属性（accessor property）：不存值，而是提供一对函数，
 *          读取时调用 getter，写入时调用 setter。
 *    JS 用 get / set 关键字声明访问器：
 *      const obj = {
 *        get full() { return '...'; },
 *        set full(v) { ... },
 *      };
 *
 * 2. 为什么需要
 *    (1) 派生值：fullName 由 firstName + lastName 算出，不必单独存储、不会不同步。
 *    (2) 校验与副作用：写入 age 时检查范围；写入时同步更新其它字段、打日志、发通知。
 *    (3) 封装：对外暴露一个"看起来是属性"的接口，内部实现可以随时改。
 *    (4) 兼容旧代码：把原来直接存值的字段改成 getter/setter，调用方代码不用改。
 *
 * 3. 核心语法要点
 *    (1) 对象字面量里用 get 名字() {} / set 名字(v) {}；不能给访问器赋值，也不能用
 *        data property 的写法同时存在（同一个键只能二选一）。
 *    (2) Object.defineProperty(obj, key, descriptor) 可以在已存在的对象上精确定义属性。
 *        descriptor 里 get/set 与 value/writable 是互斥的，写混会抛 TypeError。
 *    (3) 只给了 getter 没给 setter 时，该属性是"只读"的：
 *        严格模式（ESM 模块默认严格模式）下赋值会抛 TypeError，非严格模式静默失败。
 *    (4) getter / setter 中的 this 指向"调用时的接收者对象"，而不是定义位置。
 *    (5) 访问器属性也有 enumerable / configurable，可以控制是否出现在遍历结果里。
 *    (6) setter 可以返回任何东西，但返回值会被忽略（赋值表达式的值永远是右侧的值）。
 *
 * 4. 常见陷阱
 *    (1) 自引用死循环：getter 里写 this.name，而属性名就是 name，会无限递归爆栈。
 *    (2) 访问器属性不参与展开复制：{ ...obj } 会把 getter 求值成普通数据属性。
 *        Object.assign 同理（见 06 号文件）。
 *    (3) getter 有副作用会让人意外：JSON.stringify 也会触发 getter。
 *    (4) 只写 setter 不写 getter，读取会得到 undefined。
 *    (5) class 里的 get/set 定义在 prototype 上，属于继承属性，
 *        所以 Object.keys(实例) 看不到它们（见 04 号文件的原型陷阱）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/07_getter_setter.js
 *
 * 【预期输出】
 *   分 6 个小节，演示派生 getter、带校验的 setter、defineProperty 写法与死循环陷阱。
 * ============================================================================
 */

console.log('--- 1. 入门：getter 提供派生值 ---');

const person = {
  firstName: '三',
  lastName: '张',

  // get 关键字声明一个"读取时被调用"的属性。
  // 注意：调用时不用加括号，写 person.fullName 而不是 person.fullName()。
  get fullName() {
    console.log('   （fullName 的 getter 被调用了）');
    return this.lastName + this.firstName;
  },
};

console.log('person.fullName =', person.fullName);
// 因为是每次现算，改了 firstName 之后，fullName 自动跟着变，永远不会不同步。
person.firstName = '四';
console.log('改了 firstName 之后 person.fullName =', person.fullName);

console.log('\n--- 2. setter：写入时执行校验与副作用 ---');

const account = {
  _balance: 0, // 约定：下划线开头表示"内部字段，不建议外部直接用"

  get balance() {
    return this._balance;
  },

  set balance(value) {
    // 校验：只接受数字，且不能为负
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new TypeError('余额必须是数字');
    }
    if (value < 0) {
      throw new RangeError('余额不能为负数');
    }
    console.log('   （setter 接受了一个合法值：', value, '）');
    this._balance = value;
  },
};

// 使用方看起来就像在读写一个普通属性，完全不知道背后有校验逻辑。
account.balance = 100;
console.log('account.balance =', account.balance);

// 非法值会被拦住，这里用 try/catch 演示（不要让异常抛到顶层）。
try {
  account.balance = -50;
} catch (err) {
  console.log('非法赋值被拒绝：', err.name, '-', err.message);
}
console.log('拒绝之后 balance 仍是 =', account.balance);

// 注意：赋值表达式的值永远是右侧的值，setter 的返回值被忽略。
const result = (account.balance = 200);
console.log('(account.balance = 200) 这个表达式的值 =', result);

console.log('\n--- 3. 只给 getter：只读属性 ---');

const config = {
  _name: 'app',
  get name() {
    return this._name;
  },
  // 故意不提供 setter
};

console.log('config.name =', config.name);

// ESM 模块默认处于严格模式，给只有 getter 的属性赋值会抛 TypeError。
try {
  config.name = '新名字';
} catch (err) {
  console.log('赋值给只读属性报错：', err.name, '-', err.message);
}
console.log('config.name 未被改变 =', config.name);

// 只给 setter 不给 getter：读取得到 undefined。
const writeOnly = {
  _v: 0,
  set v(x) {
    this._v = x;
  },
};
writeOnly.v = 42;
console.log('只写不读：writeOnly.v =', writeOnly.v, '，但 writeOnly._v =', writeOnly._v);

console.log('\n--- 4. Object.defineProperty：在已有对象上定义访问器 ---');

// 有时候对象已经创建好了，或者属性名要动态决定，这时用 defineProperty。
const temperature = { celsius: 25 };

Object.defineProperty(temperature, 'fahrenheit', {
  // get/set 是函数，与 value/writable 互斥
  get() {
    return this.celsius * 1.8 + 32;
  },
  set(f) {
    // 写入华氏度时反算出摄氏度存起来
    this.celsius = (f - 32) / 1.8;
  },
  // enumerable: false 的属性不会出现在 Object.keys / for...in 中
  enumerable: true,
  // configurable: false 表示之后不能再修改这个属性的描述符、也不能删除它
  configurable: true,
});

console.log('25°C =', temperature.fahrenheit.toFixed(1), '°F');
temperature.fahrenheit = 212; // 写入华氏 212 度
console.log('写入 212°F 后，celsius =', temperature.celsius);
console.log('Object.keys 能看到 fahrenheit =', JSON.stringify(Object.keys(temperature)));

// 用同样的 API 也能定义普通数据属性（见 08 号文件详解）
Object.defineProperty(temperature, 'label', { value: '温度', enumerable: true, writable: false });
console.log('defineProperty 定义的数据属性 label =', temperature.label);

// 描述符里 get/value 混用会抛 TypeError，这里演示一下。
try {
  Object.defineProperty({}, 'bad', { value: 1, get() { return 2; } });
} catch (err) {
  console.log('get 与 value 混用报错：', err.name, '-', err.message);
}

console.log('\n--- 5. 陷阱一：getter 里的自引用死循环 ---');

const looping = {
  _name: '张三',
  // 错误示范：属性名就叫 name，getter 里又读 this.name。
  // 读 this.name 会再次触发这个 getter，无限递归。
  get name() {
    return this._name;
  },
};

// 上面这种写法（读的是 _name）是安全的，输出正常：
console.log('正确写法 looping.name =', looping.name);

const infinite = {
  get name() {
    // 读 this.name 会再次调用自己 -> 栈溢出
    return this.name;
  },
};
try {
  void infinite.name;
} catch (err) {
  console.log('自引用 getter 报错：', err.name, '-', err.message.slice(0, 40), '...');
}

console.log('\n--- 6. 陷阱二：访问器在拷贝 / 序列化时会被求值 ---');

const source = {
  first: '张',
  last: '三',
  get full() {
    console.log('   （full 的 getter 被调用）');
    return this.last + this.first;
  },
};

console.log('1) JSON.stringify 会触发 getter：');
console.log('   ', JSON.stringify(source));

console.log('2) 对象展开会把 getter 变成普通数据属性：');
const spread = { ...source };
console.log('   ', JSON.stringify(spread));
console.log('   展开结果上 full 的描述符 =', JSON.stringify(Object.getOwnPropertyDescriptor(spread, 'full')));

console.log('3) 之后改 first，spread.full 不会跟着变：');
spread.first = '李';
console.log('   source.full =', source.full);
console.log('   spread.full =', spread.full);

console.log('4) class 里的 get/set 定义在原型上，实例的 Object.keys 看不到：');
class Circle {
  constructor(r) {
    this.r = r;
  }
  get area() {
    return Math.PI * this.r ** 2;
  }
  set diameter(d) {
    this.r = d / 2;
  }
}
const c = new Circle(1);
console.log('   Object.keys(c) =', JSON.stringify(Object.keys(c)), '（只有 r）');
console.log('   但 c.area 可用 =', c.area.toFixed(4));
c.diameter = 10;
console.log('   设置直径 10 后 c.r =', c.r, '，面积 =', c.area.toFixed(4));
// 用 getOwnPropertyDescriptor 在实例上找不到，要去原型上找。
console.log('   实例上有 area 吗 =', Object.hasOwn(c, 'area'));
console.log('   原型上有 area 吗 =', Object.hasOwn(Object.getPrototypeOf(c), 'area'));

console.log('\n全部演示完毕。');
