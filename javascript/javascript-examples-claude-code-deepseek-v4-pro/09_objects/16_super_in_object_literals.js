/**
 * ============================================================================
 * 知识点：对象字面量中的 super —— __proto__ 原型继承、home object 与 super 的 this 绑定
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】高级
 * 【前置知识】09_objects/10_object_create.js、09_objects/13_object_methods.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    super 是"沿原型链向上找一步"的关键字。它有两个用法：
 *      super.属性名        读原型上的属性（走 getter 时 this 仍是当前对象）
 *      super.方法名(...)   调用原型上的方法（this 绑定到当前对象，不是原型）
 *    在对象字面量里，它必须配合 __proto__（或之后 Object.setPrototypeOf）使用：
 *      const child = {
 *        __proto__: parent,               // 设置原型
 *        greet() { return super.greet(); } // 方法简写里用 super 调父方法
 *      };
 *    这里的 greet() {...} 是"方法简写"（method shorthand）语法，
 *    这是对象字面量里能用 super 的唯一位置。
 *
 * 2. 为什么需要
 *    · 用对象而不是 class 组织代码时（配置对象、插件对象、策略对象），
 *      super 是唯一能"沿原型链调用同名的父实现"的干净写法。
 *    · 想在子实现里"扩展"而不是"替换"父行为：
 *        const logPlugin = { log(msg) { console.log('[LOG]', msg); } };
 *        const timestampPlugin = {
 *          __proto__: logPlugin,
 *          log(msg) { super.log(`[${new Date().toISOString()}] ${msg}`); },
 *        };
 *      没有 super 就只能写 parent.log.call(this, msg)，又长又容易忘记 .call(this)。
 *    · mixin（混入）场景：多个小对象组合能力时，super 让它们能形成一条链。
 *
 * 3. 核心语法要点
 *    - home object（家对象）：super 解析的起点不是 this，而是**方法被定义时所在的那个对象**。
 *      也就是说，super.x 等价于 Object.getPrototypeOf(HomeObject).x。
 *      这个"定义时绑定"是理解 super 一切行为的钥匙。
 *    - super.f() 里的 this 是**调用时的 this**，即 child.f() 中的 child；
 *      而 super.x 的属性读取也会把 this 传进 getter。
 *    - super 的查找是**动态**的：方法定义之后再 Object.setPrototypeOf 换原型，
 *      super 会跟着新原型走（因为 home object 没变，只是它的原型变了）。
 *    - `__proto__: parent` 写在对象字面量里是设置原型的标准方式；
 *      它和 `Object.create(parent)` 的区别是前者还能同时写自己的属性。
 *    - 只有"方法简写"才能用 super。写成 `greet: function () {...}` 或箭头函数属性
 *      `greet: () => {...}` 都是**语法错误**（解析期就报错，无法 try/catch）。
 *    - 箭头函数本身不能"定义" super，但它会**继承**外层方法简写的 super。
 *
 * 4. 常见陷阱
 *    - 【最大陷阱】用 Object.assign 把带 super 的方法拷到另一个对象上：
 *      home object 仍然是**原来的对象字面量**，不会变成新目标，
 *      于是 super 去找的是"原来那个对象的原型"，通常直接报错。
 *      这是用 Object.assign 做 mixin 时最典型的翻车方式。
 *    - 方法一旦被"脱壳"（const f = obj.m）再调用，this 会丢（严格模式下是 undefined），
 *      但 super 依然按 home object 解析 —— 于是出现"super 找得到、this 却是 undefined"的怪现象。
 *    - super 找不到属性时返回 undefined（而不是报错），继续调用才报 TypeError。
 *    - 别把 super 当成 this 的父级：super.x !== Object.getPrototypeOf(this).x
 *      （当方法被借用到别的对象上、或 home object 与 this 不一致时，两者结果不同）。
 *    - class 里的 super 语义**基本一致**（同样是 home object 驱动），
 *      但 class 额外支持 super() 调用父构造器，对象字面量里写 super() 是语法错误。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/16_super_in_object_literals.js
 *
 * 【预期输出】
 *   从基本用法讲起，逐步演示 home object、this 绑定、动态原型、
 *   方法简写的语法限制（用 new Function 在运行期演示）与 mixin 的正确/错误写法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本用法：__proto__ + 方法简写里的 super
// ---------------------------------------------------------------------------

console.log('--- 1. 基本用法 ---');

/** 父对象：提供默认实现 */
const baseGreeter = {
  // 方法简写：greet() {...}，注意没有 function 关键字
  greet() {
    // this 指向调用者
    return `你好，我是 ${this.name}`;
  },
  name: '（未命名）',
};

/** 子对象：用 __proto__ 指定原型，在方法简写里用 super 调用父实现 */
const politeGreeter = {
  // __proto__ 写在对象字面量里，等价于 Object.setPrototypeOf(这个对象, baseGreeter)
  __proto__: baseGreeter,
  // 自己的属性会遮蔽原型的同名属性
  name: '小明',
  greet() {
    // super.greet() → 调用"原型上的 greet"，但 this 仍然是 politeGreeter
    return `${super.greet()}，很高兴认识你`;
  },
};

console.log('父对象调用：', baseGreeter.greet());
console.log('子对象调用：', politeGreeter.greet());
console.log('原型链验证：', Object.getPrototypeOf(politeGreeter) === baseGreeter);
console.log('子对象自己的 name 遮蔽了原型：', politeGreeter.name, '/', baseGreeter.name);

// 用 __proto__ 与 Object.create 写法的等价对照
console.log('\n两种设置原型的写法：');
// 写法一：对象字面量 + __proto__
const viaLiteral = { __proto__: baseGreeter, name: '字面量写法' };
// 写法二：Object.create + 后续赋值
const viaCreate = Object.create(baseGreeter);
viaCreate.name = 'Object.create 写法';
console.log('  viaLiteral.greet() =', viaLiteral.greet());
console.log('  viaCreate.greet()  =', viaCreate.greet());
console.log('  ↑ 效果一样。但只有"字面量内部的方法简写"才允许写 super；');
console.log('    viaCreate 是在外部赋值，那个函数体里写 super 会直接语法错误。');

// ---------------------------------------------------------------------------
// 2. home object：理解 super 的钥匙
// ---------------------------------------------------------------------------

console.log('\n--- 2. home object ---');

// home object = 方法被"写下来"时所在的那个对象。
// super.x 的精确语义是：Object.getPrototypeOf(HomeObject).x
// 注意取值起点是 HomeObject 的原型，而"this"是另一回事（下面第 4 节细讲）。

const grandParent = { describe() { return 'grandParent'; } };
const parentObj = {
  __proto__: grandParent,
  describe() { return `parentObj → ${super.describe()}`; }, // home object = parentObj
};
const childObj = {
  __proto__: parentObj,
  describe() { return `childObj → ${super.describe()}`; }, // home object = childObj
};

console.log('逐层 super 调用：');
console.log('  grandParent.describe() =', grandParent.describe());
console.log('  parentObj.describe()   =', parentObj.describe());
console.log('  childObj.describe()    =', childObj.describe());
console.log('  ↑ super 每层只向上走"一步"，所以每一层都要写自己的 super 调用，');
console.log('    链才会一直传下去 —— 这正是"装饰器链"的行为。');

// 直接验证 super.x === Object.getPrototypeOf(homeObject).x
console.log('\n用 getPrototypeOf 手动验证 super.x 的取值来源：');
const readDemo = {
  __proto__: { value: '来自原型' },
  value: '来自自己',
  readViaSuper() {
    return super.value;
  },
  readViaPrototype() {
    // 手写等价形式：取 home object（就是这个字面量）的原型上的 value
    return Object.getPrototypeOf(readDemo).value;
  },
};
console.log('  自己身上的 value：', readDemo.value);
console.log('  super.value：       ', readDemo.readViaSuper());
console.log('  手动 getPrototypeOf：', readDemo.readViaPrototype());
console.log('  ↑ 两者一致。注意 super.value 拿到的是"原型的值"，不会被自己的同名属性遮蔽。');

// 找不到时不报错，返回 undefined
const noSuchProp = {
  __proto__: { a: 1 },
  read() {
    return super.nope;
  },
};
console.log('\nsuper 找不到属性时返回：', noSuchProp.read(), '（不报错，继续调用才会 TypeError）');

// ---------------------------------------------------------------------------
// 3. 为什么 super 只在方法简写里合法
// ---------------------------------------------------------------------------

console.log('\n--- 3. 为什么 super 只在方法简写里合法 ---');

// 原因：super 需要 home object 才能解析，而 home object 是一个"静态"信息 ——
// 它由方法**写在哪个对象字面量里**决定，引擎在解析时就把它绑好。
// 因此只有"方法简写"这种语法才携带 home object 信息。
//
// 反过来说，普通函数表达式 `greet: function () {}` 只是"一个函数被赋给了属性"，
// 引擎在解析这个函数体时根本不知道它将来会挂到哪个对象上，
// 所以不允许在它内部使用 super —— 这是**语法错误（SyntaxError）**。
//
// 【重要】语法错误发生在"解析期"，try/catch 完全抓不到。
// 所以下面不能用 try { eval('...') } 之外的常规方式演示。
// 这里采用「注释说明 + new Function 在运行期构造」的方案：
// new Function 的最后一个参数是函数体字符串，它在**调用 new Function 的那一刻**
// 才被解析，于是 SyntaxError 变成了可以在运行期 catch 的异常。

console.log('演示：普通函数属性里写 super 会报什么错');
// 写法一：用 new Function 构造一个"对象字面量"，其中 super 出现在 function 表达式里
try {
  // 注意整段都是字符串，不写在这里就不会影响本脚本自身的解析
  new Function('return { greet: function () { return super.x; } };');
  console.log('  function 表达式里的 super：竟然没报错（不该发生）');
} catch (err) {
  console.log('  function 表达式里的 super →', err.constructor.name, ':', err.message);
}

// 对照：同样用 new Function，但改成"方法简写"，就完全合法
try {
  const makeObject = new Function(
    'return { __proto__: { x: 42 }, greet() { return super.x; } };',
  );
  const made = makeObject();
  console.log('  方法简写里的 super → 合法，运行结果 =', made.greet());
} catch (err) {
  console.log('  方法简写竟然报错了：', err.constructor.name, ':', err.message);
}

// 再对照：嵌套在方法内部的"普通函数"里写 super 也是语法错误
try {
  new Function(
    'return { __proto__: { x: 1 }, m() { function inner() { return super.x; } return inner(); } };',
  );
  console.log('  嵌套普通函数里的 super：竟然没报错（不该发生）');
} catch (err) {
  console.log('  嵌套普通函数里的 super →', err.constructor.name, ':', err.message);
}
console.log('  ↑ 规律：super 必须"直接"出现在方法简写的函数体里（或其内部的箭头函数里），');
console.log('    一旦被包进另一个普通函数，就失去了 home object 的语境。');

// 箭头函数是例外：它没有自己的 super，但会继承外层的
console.log('\n例外：箭头函数会继承外层的 super');
const arrowSuperDemo = {
  __proto__: { hi() { return '祖传 hi'; } },
  hi() {
    // 箭头函数内部没有自己的 this / super，直接用外层的
    const call = () => super.hi();
    return `箭头函数转发 → ${call()}`;
  },
};
console.log('  ', arrowSuperDemo.hi());
console.log('  ↑ 因为箭头函数不建立新的 home object，super 继续用外层方法简写的。');

// 顺带演示：对象字面量里写 super()（构造器调用）也是语法错误
console.log('\n对比 class：super() 这类"调父构造器"语法只在 class 里存在');
try {
  new Function('return { __proto__: {}, m() { super(); } };');
  console.log('  对象字面量里的 super()：竟然没报错（不该发生）');
} catch (err) {
  console.log('  对象字面量里的 super() →', err.constructor.name, ':', err.message);
}
try {
  new Function('class A {}; class B extends A { constructor() { super(); } }');
  console.log('  class 里的 super() → 合法');
} catch (err) {
  console.log('  class 里的 super() 报错了：', err.constructor.name);
}

// ---------------------------------------------------------------------------
// 4. 取属性 vs 调方法：this 绑定的差异
// ---------------------------------------------------------------------------

console.log('\n--- 4. super.x 与 super.f() 的 this 绑定 ---');

// 共同点：this 都是"调用时的 this"（即当前对象），不是原型对象。
// 差别在于"怎么用"：
//   super.f()  → 拿到函数后立即以 this 调用，this 自然正确
//   super.x    → 只是读属性；若 x 是 getter，getter 里的 this 也是当前对象
//   若把 super.f 取出来存到变量再调用，就退化成普通调用，this 丢失

const thisCheckBase = {
  whoIsThis() {
    return this;
  },
  get ownerName() {
    // getter 里的 this 同样由"调用方"决定
    return `getter 看到的 this.name = ${this.name}`;
  },
};

const thisCheckChild = {
  __proto__: thisCheckBase,
  name: '子对象',
  // 用 super 调用：this 是 thisCheckChild
  callViaSuper() {
    return super.whoIsThis() === thisChildRef;
  },
  // 对比：先把方法取出来再调用，this 就丢了
  callViaCopy() {
    const fn = Object.getPrototypeOf(this).whoIsThis;
    // 注意这里是普通调用，没有接收者对象
    return fn();
  },
  readGetter() {
    // super.ownerName 触发原型上的 getter，this 仍然是 thisCheckChild
    return super.ownerName;
  },
};

// 需要一个引用来做 === 判断（对象字面量内部无法直接引用自身）
const thisChildRef = thisCheckChild;

console.log('super.whoIsThis() 里的 this 就是当前对象吗：', thisCheckChild.callViaSuper());
console.log('super.ownerName 触发 getter：', thisCheckChild.readGetter());
console.log('  ↑ getter 里的 this.name 读到了子对象的 name，说明 this 确实绑定到子对象。');

// 对比：脱壳调用会让 this 丢失（ESM 是严格模式，所以是 undefined）
try {
  console.log('\n脱壳调用 Object.getPrototypeOf(this).whoIsThis()：');
  console.log('  结果：', thisCheckChild.callViaCopy());
} catch (err) {
  console.log('  抛出：', err.constructor.name, '-', err.message);
}
console.log('  ↑ this 变成了 undefined。这正是"必须有 super"的原因：');
console.log('    super.f() 会自动带上正确的 this，省掉了手写 .call(this) 的麻烦。');

// 再补一个"方法被提取到别处调用"的场景
const detachDemo = {
  __proto__: { value: '原型上的值' },
  readViaSuper() {
    return `super.value = ${super.value}, this = ${this === undefined ? 'undefined' : '有值'}`;
  },
};
console.log('\n把方法提取出来单独调用：');
const detached = detachDemo.readViaSuper;
try {
  console.log('  ', detached());
} catch (err) {
  console.log('  抛出：', err.constructor.name, '-', err.message);
}
console.log('  ↑ 关键现象：super 依然能找对原型（home object 没变），');
console.log('    但 this 已经丢了 —— 说明 super 与 this 是两条独立的解析路径。');

// 属性读取 vs 方法调用的写法对照（用同一组对象演示）
console.log('\n写法对照表：');
console.log('  super.f()        → 调用原型上的 f，this = 当前对象   ✅ 推荐');
console.log('  super.f          → 只读出函数本身，不调用；再调用会丢 this');
console.log('  super.x          → 读原型上的属性（含 getter），this = 当前对象');
console.log('  Object.getPrototypeOf(this).f()  → 用的是 this 的原型，不等价！');

// ---------------------------------------------------------------------------
// 5. super 的查找是动态的
// ---------------------------------------------------------------------------

console.log('\n--- 5. super 的查找是动态的 ---');

// home object 是固定的，但 home object 的**原型**可以随时改，
// 于是 super 解析出来的结果也跟着变。

const strategyA = { render() { return '策略 A 的渲染'; } };
const strategyB = { render() { return '策略 B 的渲染'; } };

const switcher = {
  __proto__: strategyA,
  render() {
    return `切换器 → ${super.render()}`;
  },
};

console.log('初始原型是 strategyA：', switcher.render());

// 运行期换原型（home object 没变，但它的原型变了）
Object.setPrototypeOf(switcher, strategyB);
console.log('setPrototypeOf 换成 strategyB 后：', switcher.render());
console.log('  ↑ 同一个方法、同一处 super 代码，结果随原型而变。');
console.log('    这就是"策略模式"用对象字面量实现时，能运行时热替换的原理。');

// 有趣推论：先定义对象、再设置原型，super 依然有效（只要方法简写存在）
console.log('\n先写字面量、再设置原型（home object 已经确定，依然可用）：');
const lateProto = {
  // 这里暂时不写 __proto__，默认原型是 Object.prototype
  describe() {
    return `lateProto → ${super.describe ? super.describe() : '（原型上没有 describe）'}`;
  },
};
console.log('  设置原型之前：', lateProto.describe());
Object.setPrototypeOf(lateProto, { describe() { return '后来设置的原型'; } });
console.log('  设置原型之后：', lateProto.describe());
console.log('  ↑ 再次验证：super 依赖的是 home object 的当前原型，而不是定义时的快照。');

// 默认情况下 home object 的原型是 Object.prototype，所以能调 toString 之类
const defaultProto = {
  stringify() {
    return `super.toString() = ${super.toString()}`;
  },
};
console.log('\n默认情况下 home object 的原型是 Object.prototype：');
console.log('  ', defaultProto.stringify());

// ---------------------------------------------------------------------------
// 6. 继承一个对象：getter / setter 也能用 super
// ---------------------------------------------------------------------------

console.log('\n--- 6. getter / setter 中的 super ---');

const configBase = {
  _timeout: 1000,
  get timeout() {
    return this._timeout;
  },
  set timeout(value) {
    // 父级 setter 做基础校验
    if (typeof value !== 'number' || value < 0) {
      throw new TypeError('timeout 必须是非负数字');
    }
    this._timeout = value;
  },
  describe() {
    return `timeout=${this.timeout}ms`;
  },
};

const configChild = {
  __proto__: configBase,
  // 子级 getter 在父级基础上做加工
  get timeout() {
    // super.timeout 触发父级 getter，this 仍是 configChild
    return super.timeout * 2;
  },
  set timeout(value) {
    // super.timeout = value 触发父级 setter（做校验 + 写入）
    super.timeout = value;
  },
  describe() {
    // 既复用父级描述，又加上自己的补充
    return `${super.describe()}（子级视角：显示为 ${this.timeout}ms）`;
  },
};

console.log('初始状态：', configChild.describe());
console.log('  说明：_timeout 是 1000（存在 configChild 上，因为 this 是 configChild），');
console.log('        子 getter 返回 1000*2 = 2000。');

configChild.timeout = 500;
console.log('设置 timeout = 500 之后：');
console.log('  实际存储的 _timeout：', configChild._timeout);
console.log('  子级读到的 timeout：', configChild.timeout);
console.log('  父级读到的 timeout：', configBase.timeout);
console.log('  ↑ setter 里的 this 也是 configChild，所以值写到了子对象自己身上。');

try {
  configChild.timeout = -1;
} catch (err) {
  console.log('设置非法值 -1 →', err.constructor.name, ':', err.message);
}
console.log('  ↑ 校验逻辑写在父级 setter 里，子级通过 super 复用了它，没有重复代码。');

// ---------------------------------------------------------------------------
// 7. 对象式继承与 mixin 的正统写法
// ---------------------------------------------------------------------------

console.log('\n--- 7. 对象式继承与 mixin ---');

// 【先说陷阱】用 Object.assign 把带 super 的方法拷到别的对象上会坏掉。
// 原因：Object.assign 只拷贝"函数值"，home object 仍然是原来那个字面量。
const loggingMixin = {
  log(msg) {
    return `[LOG] ${msg}`;
  },
  // 这里 super 的 home object 是 loggingMixin，其原型是 Object.prototype
  process(msg) {
    return `mixin.process → ${super.log ? super.log(msg) : '（原型上没有 log）'}`;
  },
};

console.log('陷阱演示：mixin 对象自身的原型是 Object.prototype');
console.log('  Object.getPrototypeOf(loggingMixin) === Object.prototype：',
  Object.getPrototypeOf(loggingMixin) === Object.prototype);

// 错误写法：Object.assign 把 process 拷到原型为 loggingMixin 的新对象上
const badTarget = Object.assign(Object.create(loggingMixin), { name: '错误写法' });
console.log('\n错误写法 Object.assign 拷贝：');
console.log('  badTarget 的原型确实是 loggingMixin：', Object.getPrototypeOf(badTarget) === loggingMixin);
try {
  // 这里会失败：process 的 home object 仍是 loggingMixin，而它的原型上没有 log
  console.log('  badTarget.process("hi") =', badTarget.process('hi'));
} catch (err) {
  console.log('  抛出：', err.constructor.name, '-', err.message);
}
console.log('  ↑ 明明 badTarget 的原型上有 log，super.log 却找不到 ——');
console.log('    因为 super 看的是"home object 的原型"，而 home object 是 loggingMixin 自己。');
console.log('    这是用 Object.assign 做 mixin 时最典型的翻车方式。');

// 正确写法一：把 super 方法写在目标字面量里
console.log('\n正确写法一：super 方法写在目标对象字面量内');
const goodTarget = {
  __proto__: loggingMixin,
  name: '正确写法',
  // 方法简写写在 goodTarget 里 → home object 就是 goodTarget
  process(msg) {
    return `goodTarget.process → ${super.log(msg)}`;
  },
};
console.log('  ', goodTarget.process('hi'));
console.log('  ↑ 只有把方法简写写在目标对象内部，home object 才指向目标对象。');

// 正确写法二：不用 super，显式用 apply/call（mixin 场景的通用解）
console.log('\n正确写法二：mixin 里不用 super，改用显式的 apply（可被 Object.assign 安全拷贝）');
/**
 * 一个"可安全混入"的方法集合。
 * 约定：需要调用宿主能力时，通过 this 上的方法名去调，而不是 super。
 * 这样无论被 assign 到哪个对象上，行为都正确。
 */
const safeMixin = {
  /** 需要宿主提供 this.log 方法 */
  process(msg) {
    // 用 this.log 而不是 super.log：不依赖 home object
    return `safeMixin.process → ${typeof this.log === 'function' ? this.log(msg) : `（宿主没有 log）${msg}`}`;
  },
};

// 混入到目标对象：目标是"以 loggingMixin 为原型 + safeMixin 的方法"
const mixedTarget = Object.assign(Object.create(loggingMixin), safeMixin, { name: '混入结果' });
console.log('  mixedTarget.process("hi") =', mixedTarget.process('hi'));
console.log('  ↑ 用 this 分发，Object.assign 拷贝后依然正确 —— 这是 mixin 的通用写法。');
console.log('    代价是失去了"沿原型链只走一步"的语义，需要靠命名约定避免递归。');

// 正确写法三：Object.create + 描述符（适合需要精细控制的场景）
console.log('\n正确写法三：Object.create + 属性描述符');
const descriptorTarget = Object.create(loggingMixin, {
  name: { value: '描述符写法', writable: true, enumerable: true, configurable: true },
  process: {
    // 注意：这里也只能放普通函数，不能放带 super 的方法简写
    value(msg) {
      // 借用父实现的写法：从原型上取方法并 call
      return `descriptorTarget → ${Object.getPrototypeOf(this).log.call(this, msg)}`;
    },
    writable: true,
    enumerable: true,
    configurable: true,
  },
});
console.log('  ', descriptorTarget.process('hi'));
console.log('  ↑ Object.create 的属性值只能是普通函数，所以这里用 getPrototypeOf(this).log.call(this, ...)');
console.log('    这是"没有 super 时的等价写法"，能用但啰嗦，也容易忘记 .call(this)。');

// 完整的多层 mixin 链示例
console.log('\n完整示例：三层 mixin 链（每层都扩展一点行为）');
const layer1 = {
  handle(input) {
    return `L1(${input})`;
  },
};
const layer2 = {
  __proto__: layer1,
  handle(input) {
    // 每层都调用上一层，形成链
    return `L2→${super.handle(input)}`;
  },
};
const layer3 = {
  __proto__: layer2,
  handle(input) {
    return `L3→${super.handle(input)}`;
  },
};
console.log('  layer3.handle("data") =', layer3.handle('data'));
console.log('  ↑ 输出顺序 L3→L2→L1，这就是对象字面量版的"责任链"模式。');
console.log('    每一层的方法简写都有自己的 home object，所以 super 每层都只走一步。');

// ---------------------------------------------------------------------------
// 8. 与 class 中 super 的语义差异
// ---------------------------------------------------------------------------

console.log('\n--- 8. 与 class 中 super 的语义差异 ---');

// 相同点：两者都是 home-object 驱动的，"super 看的是方法定义处所在对象的原型"。
// 不同点主要集中在三点：

class ClassBase {
  constructor(name) {
    // class 的构造器里可以访问 this
    this.name = name;
  }
  greet() {
    return `class base: ${this.name}`;
  }
  // 静态方法：挂在 ClassBase 这个函数对象上，而不是 prototype 上
  static describeKind() {
    return 'ClassBase 是个基类';
  }
}

class ClassChild extends ClassBase {
  constructor(name, level) {
    // ① class 独有：super() 调用父构造器，且必须先调用它才能用 this
    super(name);
    this.level = level;
  }
  greet() {
    // ② 这里的 super 指向 ClassBase.prototype（也就是 home object 的原型）
    return `class child(L${this.level}) → ${super.greet()}`;
  }
  // 静态方法：这里的 home object 是 ClassChild 这个"构造器函数对象"本身，
  // 所以 super 解析的是 Object.getPrototypeOf(ClassChild)，也就是 ClassBase
  static describeKind() {
    return `class child → ${super.describeKind()}`;
  }
}

console.log('class 版本：', new ClassChild('小明', 3).greet());
console.log('class 静态方法：', ClassChild.describeKind());
console.log('  home object 验证：Object.getPrototypeOf(ClassChild) === ClassBase →',
  Object.getPrototypeOf(ClassChild) === ClassBase);
console.log('  ↑ 方法里的 super 看 prototype，静态方法里的 super 看构造器本身 ——');
console.log('    对象字面量没有"静态"这一层，所以只能在普通属性上模拟，但拿不到这条构造器链。');

console.log('\n三点差异对照：');
console.log('  ① super() 调父构造器：class 有，对象字面量里写 super() 是 SyntaxError。');
console.log('  ② 静态方法里的 super：class 有（见上面 ClassChild.describeKind()），');
console.log('     对象字面量没有"静态方法"概念，同名能力只能用普通属性承载。');
console.log('  ③ 严格模式：class 的方法体**永远**是严格模式；');
console.log('     对象字面量方法的严格性取决于所在代码 —— 本仓库是 ESM，也是严格模式。');
console.log('       验证：本文件内 (function(){ return this; })() === undefined →',
  (function () { return this; })() === undefined);

console.log('\n共同点：两者都遵循同一个 home object 规则。');
console.log('  · class child 的 greet 里 super → Object.getPrototypeOf(ClassChild.prototype) === ClassBase.prototype');
console.log('    实测：', Object.getPrototypeOf(ClassChild.prototype) === ClassBase.prototype);
console.log('  · 对象字面量 childObj 的 super → Object.getPrototypeOf(childObj) === parentObj');
console.log('    实测：', Object.getPrototypeOf(childObj) === parentObj);
console.log('  ↑ 所以说 class 的 super 只是"把 home object 定在 prototype 对象上"的特例。');

// 一个能说明"用同一个心智模型理解两者"的实验：
// 把 class 的方法挪到普通对象上，行为一致
const classMethodAsObject = {
  __proto__: { greet: ClassBase.prototype.greet },
  // 提供 this.name，否则父实现里的 this.name 会是 undefined
  name: '普通对象冒充的实例',
  greet() {
    return `对象版 → ${super.greet()}`;
  },
};
console.log('\n把 class 的原型方法借到对象字面量里，super 同样工作：');
console.log('  ', classMethodAsObject.greet());
console.log('  ↑ 甚至不需要 new、不需要 instanceof，只要 this 上有父实现需要的属性就能跑。');
console.log('  ↑ 说明 super 的规则是统一的，class 只是语法糖 + 额外的构造器规则。');

// ---------------------------------------------------------------------------
// 9. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 9. 小结 ---');

console.log('1) 对象字面量里的 super 需要配合 __proto__（或后续 setPrototypeOf）使用。');
console.log('2) home object = 方法被定义时所在的对象；super.x ≡ Object.getPrototypeOf(HomeObject).x。');
console.log('3) super.f() 的 this 是"调用时的 this"，不是原型对象；');
console.log('     super.x 触发 getter 时，getter 里的 this 同样是当前对象。');
console.log('4) super 只在"方法简写"里合法；');
console.log('     function 表达式 / 嵌套普通函数里的 super 是**解析期** SyntaxError，try/catch 抓不到；');
console.log('     用 new Function 在运行期构造代码才能捕获并演示它。');
console.log('5) 箭头函数不建立 home object，会继承外层的 super（和 this）。');
console.log('6) super 的查找是动态的：home object 固定，但它当前的原型决定 super 找到什么，');
console.log('     所以 setPrototypeOf 换原型后 super 立刻跟着变（策略模式的基础）。');
console.log('7) 最大陷阱：Object.assign 拷贝带 super 的方法，home object 不会跟着变，');
console.log('     于是 super 去找"原来那个对象"的原型，通常直接报错。');
console.log('     mixin 的通用解是"用 this 分发"或"把方法简写写在目标对象内部"。');
console.log('8) 与 class 的差异：class 额外有 super() 调父构造器、静态方法里的 super、');
console.log('     且 class 方法体永远是严格模式；但 super 的解析规则（home object）完全一致。');
console.log('9) 相关阅读：09_objects/10_object_create.js（原型与 Object.create）、');
console.log('     16_prototype 目录（原型链基础）、14_classes/07_inheritance_extends.js（class 继承）。');

console.log('\n全部演示完毕。');
