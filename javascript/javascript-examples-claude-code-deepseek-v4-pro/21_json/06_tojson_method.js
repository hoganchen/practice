/**
 * ============================================================================
 * 知识点：自定义 toJSON 方法控制序列化结果
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 数据格式与序列化
 * 【难度等级】进阶
 * 【前置知识】21_json/03_replacer_and_reviver.js、21_json/04_serialization_edge_cases.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JSON.stringify 在序列化一个对象之前，会先检查它有没有 toJSON 方法。
 *    如果有，就调用它，并用它的返回值代替原对象参与后续序列化。
 *    这是一个"钩子"（hook）：对象自己决定"我在 JSON 里长什么样"。
 *    Date 就是内置实现了 toJSON 的最好例子（所以 Date 会变成 ISO 字符串）。
 *
 * 2. 为什么需要
 *    (1) 让对象"自带序列化逻辑"，而不是把逻辑散落在每一处调用 stringify 的地方。
 *    (2) 隐藏内部字段：对象内部有很多状态，但对外只需要暴露几个。
 *    (3) 输出稳定的格式：比如金额统一输出成"元"为单位、日期统一输出成 UTC。
 *    (4) 避免循环引用：在 toJSON 里只输出必要字段，从源头切断环。
 *    (5) 让第三方库的对象（比如 Money、Decimal）能被正确序列化。
 *
 * 3. 核心语法要点
 *    (1) 方法名固定是 toJSON，它接收一个参数 key：
 *        · 当对象作为某个属性被序列化时，key 是那个属性名
 *        · 当对象是根节点时，key 是空字符串 ""
 *    (2) 三种定义位置都有效：
 *        · 实例自身属性：obj.toJSON = function () {...}
 *        · 原型方法：class X { toJSON() {...} } —— 推荐写法
 *        · 挂在 Object.prototype 上（极度不推荐，会污染所有对象）
 *    (3) toJSON 的返回值会被"继续序列化"，
 *        所以可以返回对象、数组、字符串、数字，甚至再返回一个有 toJSON 的对象。
 *    (4) 执行顺序：先调用 toJSON，再把结果交给 replacer。
 *        也就是说 replacer 收到的 value 已经是 toJSON 的产物。
 *    (5) 如果 toJSON 返回 undefined，那么该对象在结果里会像 undefined 一样被处理
 *        （对象属性里消失，数组元素变 null）。
 *    (6) 如果 toJSON 抛错，整个 stringify 会中断并抛出该错误。
 *
 * 4. 常见陷阱
 *    (1) 用箭头函数定义 toJSON 会拿不到 this（箭头函数不绑定 this）。
 *    (2) toJSON 里返回 this 不会无限递归（规范保证同一个值只调用一次 toJSON），
 *        而是"toJSON 完全失效、原属性照抄"——这种静默失效比报错更难发现。
 *    (3) 忘了 toJSON 只在序列化时生效 —— JSON.parse 不会调用任何 toJSON，
 *        所以"还原"必须靠 reviver 或工厂函数。
 *    (4) 在 toJSON 里做了耗时操作（比如查数据库），会让序列化变得很慢且难排查。
 *    (5) toJSON 的返回值最好是纯数据；如果又返回了带函数/Map 的对象，
 *        后面照样会踩 04 号文件里的坑。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/06_tojson_method.js
 *
 * 【预期输出】
 *   演示 toJSON 的基础用法、key 参数的含义、返回值被继续序列化的效果，
 *   以及"隐藏敏感字段""稳定输出格式""切断循环引用"三个实战场景。
 * ============================================================================
 */

console.log('--- 1. 最基础的 toJSON：对象自己决定输出长什么样 ---');

const plainPoint = { x: 3, y: 4 };
console.log('  没有 toJSON 时 =>', JSON.stringify(plainPoint));

const pointWithToJSON = {
  x: 3,
  y: 4,
  // 注意：这里用普通函数而不是箭头函数，因为要用到 this。
  toJSON() {
    return { x: this.x, y: this.y, distance: Math.hypot(this.x, this.y) };
  },
};
console.log('  有 toJSON 时   =>', JSON.stringify(pointWithToJSON));
console.log('  ↑ toJSON 返回的对象取代了原对象参与序列化，可以顺便计算派生字段。');

// 但直接打印对象时，toJSON 不会自动生效 —— 它只在序列化过程中被调用。
console.log('  直接打印对象（toJSON 不生效）=>', pointWithToJSON);

console.log('--- 2. key 参数：toJSON 会收到"自己所在的属性名" ---');

const observer = {
  value: '观察者',
  toJSON(key) {
    console.log(`    toJSON 被调用，key = ${JSON.stringify(key)}`);
    return `[${key || '根'}] ${this.value}`;
  },
};

console.log('  作为属性被序列化：');
JSON.stringify({ firstField: observer, secondField: observer });
console.log('  作为根节点被序列化：');
JSON.stringify(observer);
console.log('  ↑ 根节点时 key 是空字符串 ""，这是很常见的判断分支点。');

console.log('--- 3. 返回值会被"继续序列化" ---');

const layered = {
  toJSON() {
    // 返回的对象里又包含了带 toJSON 的对象，会继续被处理。
    return {
      level: 1,
      child: {
        level: 2,
        toJSON() { return { level: '二层（被自己的 toJSON 改写）' }; },
      },
      list: [1, 2],
    };
  },
};
console.log('  结果 =', JSON.stringify(layered));
console.log('  ↑ toJSON 只是"替换这个节点"，替换后的内容会照常继续递归序列化。');

console.log('--- 4. 返回 undefined 的效果 ---');

const vanishes = { toJSON() { return undefined; } };
console.log('  作为对象属性 =>', JSON.stringify({ a: 1, b: vanishes, c: 3 }));
console.log('  作为数组元素 =>', JSON.stringify([1, vanishes, 3]));
console.log('  作为根节点   =>', JSON.stringify(vanishes));
console.log('  ↑ 与直接写 undefined 的表现完全一致：对象里消失，数组里变 null，根节点整体返回 undefined。');

console.log('--- 5. 实战一：隐藏内部状态，只暴露必要字段 ---');

class UserAccount {
  constructor(id, name, passwordHash, internalNote) {
    this.id = id;
    this.name = name;
    this.#passwordHash = passwordHash;
    this.#internalNote = internalNote;
  }

  // 私有字段用 # 声明，外部完全访问不到。
  #passwordHash;
  #internalNote;

  // 密码哈希与内部备注永远不该出现在 JSON 里，
  // 与其在每个调用点写 replacer，不如让类自己负责。
  toJSON() {
    return { id: this.id, name: this.name };
  }

  // 内部方法仅供服务端逻辑使用。
  verify(passwordHash) {
    return passwordHash === this.#passwordHash;
  }
}

const account = new UserAccount('u-1', '张三', 'sha256:abcdef', '风控备注：无');
console.log('  账号对象（直接打印）=>', account);
console.log('  序列化结果 =', JSON.stringify(account));
console.log('  ↑ 敏感信息没有出现在 JSON 里，而且这个保证是"类自己提供的"，不依赖调用方记得脱敏。');
console.log('  服务端仍能正常校验密码 =', account.verify('sha256:abcdef'));

console.log('--- 6. 实战二：统一输出格式（金额与时间） ---');

class Money {
  constructor(cents, currency = 'CNY') {
    this.cents = cents;      // 内部用"分"存，避免浮点误差
    this.currency = currency;
  }

  // 对外输出"元"为单位的字符串，保留两位小数。
  toJSON() {
    return {
      currency: this.currency,
      amount: (this.cents / 100).toFixed(2),
      display: `${this.currency} ${(this.cents / 100).toFixed(2)}`,
    };
  }

  add(other) {
    if (other.currency !== this.currency) throw new Error('币种不一致');
    return new Money(this.cents + other.cents, this.currency);
  }
}

const order = {
  orderId: 'A-1001',
  total: new Money(19990),
  shipping: new Money(1200),
};
console.log('  订单序列化 =', JSON.stringify(order, null, 2).split('\n').map((l) => '    ' + l).join('\n'));
console.log('  ↑ 内部"分"的存储方式（19990）没有泄漏到接口里，对外是"199.90"。');
console.log('  业务运算仍用整数分 =', JSON.stringify(order.total.add(order.shipping)));

console.log('--- 7. 实战三：在 toJSON 里切断循环引用 ---');

class Department {
  constructor(name) {
    this.name = name;
    this.employees = [];
  }
  addEmployee(emp) {
    this.employees.push(emp);
    emp.department = this; // 员工反向引用部门 —— 形成环
    return this;
  }
  toJSON() {
    // 只输出必要字段，employee 不再回指自己，环自然断开。
    return {
      name: this.name,
      employees: this.employees.map((e) => ({ id: e.id, name: e.name })),
    };
  }
}

const engineering = new Department('工程部');
engineering.addEmployee({ id: 1, name: '张三' });
engineering.addEmployee({ id: 2, name: '李四' });

try {
  // 先验证"没有 toJSON 兜底"时确实会报错：这里用纯对象手工搭一个互相引用的结构。
  const 张三 = { id: 1, name: '张三' };
  const 工程部 = { name: '工程部', employees: [张三] };
  张三.department = 工程部; // 员工反向引用部门 → 环
  JSON.stringify(工程部);
  console.log('  不会走到这里');
} catch (err) {
  console.log('  没有 toJSON 兜底时序列化 =>', err.constructor.name + ': ' + err.message.split('\n')[0]);
}
console.log('  说明：上面的 Department 实例里 employee.department 同样指回了部门，也是环，');
console.log('        但因为 Department 自己实现了 toJSON，输出里只保留 id 与 name，环就被切断了。');
console.log('  带上 toJSON 后序列化 =>', JSON.stringify(engineering));
console.log('  ↑ 从源头（类内部）断环，比在每个调用点挂 replacer 更可靠。');

console.log('--- 8. 执行顺序：toJSON 先于 replacer ---');

const sequenced = {
  tag: '被 toJSON 改写',
  toJSON() {
    console.log('    ① toJSON 被调用');
    return { tag: 'toJSON 的产物' };
  },
};

JSON.stringify(sequenced, function (key, value) {
  if (key === 'tag') {
    console.log('    ② replacer 收到 tag，值 =', JSON.stringify(value));
    console.log('       此时 this 上已经看不到原始对象了 =', Object.keys(this).join(','));
  }
  return value;
});
console.log('  ↑ 顺序是"先 toJSON，再 replacer"，所以 replacer 拿不到原对象，');
console.log('    想在 replacer 里判断原始类型必须用 this[key]（03 号文件详细讲过）。');

console.log('--- 9. 陷阱：toJSON 返回 this 会发生什么 ---');

// 直觉上"返回自己"应该无限递归，但规范规定 toJSON 对同一个值只会调用一次，
// 所以它不会死循环 —— 而是"白白调用了 toJSON，然后照抄原来的属性"。
// 这种"看起来生效、实际完全没生效"的行为比报错更难发现。
const bad = {
  name: '递归陷阱',
  secret: '不该出现的字段',
  toJSON() { return this; },
};
console.log('  toJSON 返回 this =>', JSON.stringify(bad));
console.log('  ↑ 没有报错，但 secret 也照样被输出去了 —— toJSON 等于白写。');

// 对比：正确写法是返回一个"不含 toJSON、只含想暴露字段"的新对象。
const good = {
  name: '正确写法',
  secret: '不该出现的字段',
  toJSON() { return { name: this.name }; },
};
console.log('  返回新对象 =>', JSON.stringify(good));
console.log('  修法：在 toJSON 里"手工挑选"要暴露的字段，而不是图省事返回 this。');

console.log('--- 10. 陷阱：toJSON 里抛错会中断整个序列化 ---');

const risky = {
  toJSON() {
    throw new Error('toJSON 内部出错了');
  },
};
try {
  JSON.stringify({ ok: 1, risky });
  console.log('  不会走到这里');
} catch (err) {
  console.log('  toJSON 抛错 =>', err.constructor.name + ': ' + err.message);
}
console.log('  ↑ toJSON 里不要做可能失败的重操作（IO、网络、解析），否则会连累整次序列化。');

console.log('--- 11. 陷阱：箭头函数形式的 toJSON 拿不到 this ---');

const arrowToJSON = {
  value: 42,
  // 箭头函数没有自己的 this，this 会指向模块作用域（这里是 undefined）。
  toJSON: () => ({ value: undefined }),
};
console.log('  箭头函数实现 toJSON =>', JSON.stringify(arrowToJSON));
console.log('  ↑ 结果里 value 变成了 undefined 并被丢弃。toJSON 一定要用普通函数或类方法。');

const fixedToJSON = {
  value: 42,
  toJSON() { return { value: this.value }; },
};
console.log('  普通函数实现 toJSON =>', JSON.stringify(fixedToJSON));

console.log('--- 12. 陷阱：JSON.parse 不会调用 toJSON ---');

const text = JSON.stringify(order);
const back = JSON.parse(text);
console.log('  序列化后的文本 =', text);
console.log('  解析回来的 total =', JSON.stringify(back.total));
console.log('  它还是 Money 吗 =', back.total instanceof Money, '，有 toJSON 吗 =', typeof back.total.toJSON);
console.log('  ↑ toJSON 只管"出去"，不管"回来"。还原要靠 reviver 或"静态工厂函数"：');

// 与 toJSON 对称地提供一个 fromJSON：把 JSON 里的普通对象变回 Money 实例。
// 这是"自定义序列化"配套的标准做法 —— 出去与回来成对实现，避免信息丢失。
Money.fromJSON = (o) => new Money(Math.round(Number(o.amount) * 100), o.currency);
const restoredMoney = Money.fromJSON(back.total);
console.log('    用 Money.fromJSON 还原 => 是 Money 吗 =', restoredMoney instanceof Money,
  '，内部 cents =', restoredMoney.cents, '，格式化 =', JSON.stringify(restoredMoney));
console.log('    还原后还能参与业务运算 =>', JSON.stringify(restoredMoney.add(new Money(10))));

console.log('--- 13. 小结 ---');
console.log('· JSON.stringify 序列化任何对象前都会先看它有没有 toJSON，有就用返回值替代。');
console.log('· toJSON 接收 key 参数：作为属性时是属性名，作为根节点时是空字符串。');
console.log('· toJSON 最适合做"隐藏内部字段""统一对外格式""从源头切断循环引用"。');
console.log('· 不要用箭头函数写 toJSON；不要返回 this（等于白写）；不要在里面做重操作。');
console.log('· toJSON 只影响序列化；反序列化要用 reviver 或类自己的静态工厂函数。');
