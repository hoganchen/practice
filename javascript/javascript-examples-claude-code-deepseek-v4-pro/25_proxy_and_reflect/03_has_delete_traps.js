/**
 * ============================================================================
 * 知识点：has / deleteProperty / ownKeys 陷阱 —— 拦截 in、delete 与键枚举
 * ============================================================================
 *
 * 【所属分类】25_proxy_and_reflect —— 元编程：拦截对象的基本操作
 * 【难度等级】进阶
 * 【前置知识】25_proxy_and_reflect/02_get_set_traps.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    get/set 只管"读一个属性的值"和"写一个属性的值"。还有三类操作需要单独拦截：
 *      - has(target, key)             拦截 `key in obj`（以及 with 作用域查找）
 *      - deleteProperty(target, key)  拦截 `delete obj.key`，返回布尔值
 *      - ownKeys(target)              拦截"列出对象自己的键"，
 *                                     影响 Object.keys / Object.getOwnPropertyNames /
 *                                     Object.getOwnPropertySymbols / for...in / 展开运算符 /
 *                                     JSON.stringify / Object.assign 的源对象枚举
 *    注意 ownKeys 只负责"报出哪些键"，每个键"是否可枚举"是由另一个陷阱
 *    getOwnPropertyDescriptor 决定的 —— 这两者必须配合使用（见第 4 节）。
 *
 * 2. 为什么需要
 *    - has：实现"隐藏属性"（内部字段不响应 in）、大小写不敏感的配置对象、
 *      给不存在的键返回"默认存在"的语义。
 *    - deleteProperty：把删除变成"软删除"（打标记而不是真删），
 *      或者干脆禁止删除某些关键字段。
 *    - ownKeys：序列化时跳过内部字段（如以 _ 开头的私有字段）、
 *      在遍历时凭空补出计算属性。
 *    JSON.stringify 输出的内容完全由 ownKeys + getOwnPropertyDescriptor 决定，
 *    这是做"序列化脱敏"最干净的切入点。
 *
 * 3. 核心语法要点
 *    - has: (target, key) => boolean
 *    - deleteProperty: (target, key) => boolean（返回 false 且处于严格模式会抛 TypeError）
 *    - ownKeys: (target) => (string|symbol)[]，返回值必须是数组，
 *      并且**必须包含** target 上所有不可配置的自有键，否则抛 TypeError。
 *    - getOwnPropertyDescriptor: (target, key) =>
 *        ({ value, writable, enumerable, configurable } 或 { get, set, enumerable, configurable })
 *        返回 undefined 表示"没有这个属性"。
 *    - 想让 Object.keys 列出"虚拟键"，getOwnPropertyDescriptor 必须返回
 *        { enumerable: true, configurable: true }，否则会被过滤掉。
 *    - Reflect 上有同名方法可以直接完成默认行为：
 *        Reflect.has / Reflect.deleteProperty / Reflect.ownKeys /
 *        Reflect.getOwnPropertyDescriptor
 *
 * 4. 常见陷阱
 *    - 只写 ownKeys 不写 getOwnPropertyDescriptor，Object.keys 里看不到虚拟键（很迷惑）。
 *    - ownKeys 返回了重复的键：会被去重，但你期待的数量就不对了。
 *    - 目标对象被 Object.preventExtensions / freeze 之后，ownKeys 必须完全等于
 *      目标的键集合，多一个少一个都抛 TypeError。
 *    - has 陷阱不能"说谎"：不能对不可配置的自有属性返回 false。
 *    - JSON.stringify 的键顺序由 ownKeys 的返回顺序决定，但数字键会被引擎排到最前。
 *    - in 运算符会沿原型链查找，所以 has 陷阱在"代理作为原型"时也会被触发。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 25_proxy_and_reflect/03_has_delete_traps.js
 *
 * 【预期输出】
 *   打印各陷阱的触发时机与返回值，以及不变量被违反时的 TypeError。
 * ============================================================================
 */

console.log('--- 1. has 陷阱：拦截 in 运算符 ---');

const base = { name: '张三', _secret: '内部字段' };

const hasProxy = new Proxy(base, {
  has(tgt, key) {
    console.log(`  [has] 询问 "${String(key)}" 是否存在`);
    // 默认行为：Reflect.has 会沿原型链查找。
    return Reflect.has(tgt, key);
  },
});

console.log('"name" in hasProxy =', 'name' in hasProxy);
console.log('"notExist" in hasProxy =', 'notExist' in hasProxy);
console.log('  -> in 运算符本身会先触发陷阱，陷阱再决定怎么回答');

console.log('--- 2. has 的三个实用场景 ---');

// 场景 A：隐藏内部字段，让 in 看不见它们。
const hideInternal = new Proxy(base, {
  has(tgt, key) {
    if (typeof key === 'string' && key.startsWith('_')) return false; // 假装不存在
    return Reflect.has(tgt, key);
  },
});
console.log('A. "_secret" in 代理 =', '_secret' in hideInternal, '（被隐藏）');
console.log('   但直接读 still 拿得到 =', hideInternal._secret, '（has 只管 in，不管读）');

// 场景 B：大小写不敏感的配置对象。
const config = { Timeout: 30, Retries: 3 };
const caseInsensitive = new Proxy(config, {
  has(tgt, key) {
    if (typeof key !== 'string') return Reflect.has(tgt, key);
    // 先把已有键转成小写做对照。
    const lower = key.toLowerCase();
    return Object.keys(tgt).some((k) => k.toLowerCase() === lower);
  },
  get(tgt, key, receiver) {
    if (typeof key === 'string') {
      const real = Object.keys(tgt).find((k) => k.toLowerCase() === key.toLowerCase());
      if (real) return Reflect.get(tgt, real, receiver);
    }
    return Reflect.get(tgt, key, receiver);
  },
});
console.log('B. "timeout" in 代理 =', 'timeout' in caseInsensitive);
console.log('   代理.timeout =', caseInsensitive.timeout, '（get 里做了同样的匹配）');
console.log('   代理.TIMEOUT =', caseInsensitive.TIMEOUT);

// 场景 C：让所有键"看起来都存在"（常用于"可链式访问的空对象"）。
const alwaysHas = new Proxy(
  {},
  {
    has() {
      return true;
    },
  },
);
console.log('C. "任何键" in 代理 =', '任何键' in alwaysHas);
console.log('   甚至 Symbol.iterator in 代理 =', Symbol.iterator in alwaysHas);

console.log('--- 3. deleteProperty 陷阱：接管 delete ---');

const deletable = { a: 1, b: 2, locked: 3 };

const deleteProxy = new Proxy(deletable, {
  deleteProperty(tgt, key) {
    console.log(`  [deleteProperty] 请求删除 "${String(key)}"`);
    // 禁止删除 locked 字段。
    if (key === 'locked') {
      console.log('    -> 拒绝：locked 是受保护字段');
      return false;
    }
    return Reflect.deleteProperty(tgt, key);
  },
});

console.log('delete deleteProxy.a =', delete deleteProxy.a);
console.log('  删除后目标对象 =', JSON.stringify(deletable));

// 返回 false 在严格模式下会让 delete 表达式抛 TypeError。
// 用 try/catch 捕获，避免脚本非零退出。
try {
  delete deleteProxy.locked;
  console.log('delete deleteProxy.locked 没有抛错（非严格模式下会静默失败）');
} catch (err) {
  console.log('delete 被拒绝：', err.constructor.name, '-', err.message);
}
console.log('locked 还在吗？', 'locked' in deletable);

console.log('--- 4. 软删除：delete 只是打个标记 ---');

// 真实数据仍然保留，只是对外表现成"已删除"。
const softTarget = { x: 1, y: 2, z: 3 };
const deleted = new Set(); // 记录被"删除"的键

const softDelete = new Proxy(softTarget, {
  deleteProperty(tgt, key) {
    if (key in tgt) {
      deleted.add(key); // 只记账，不真删
      return true; // 报告"删除成功"
    }
    return true;
  },
  get(tgt, key, receiver) {
    // 被标记删除的键读出来是 undefined。
    if (typeof key === 'string' && deleted.has(key)) return undefined;
    return Reflect.get(tgt, key, receiver);
  },
  has(tgt, key) {
    // 被标记删除的键，in 也说"不存在"。
    if (typeof key === 'string' && deleted.has(key)) return false;
    return Reflect.has(tgt, key);
  },
});

delete softDelete.y;
console.log('删除 y 之后：');
console.log('  代理.y =', softDelete.y, '（表现为已删除）');
console.log('  "y" in 代理 =', 'y' in softDelete);
console.log('  但底层数据仍然在 =', JSON.stringify(softTarget), '（y 还在，只是被隐藏了）');
console.log('  被标记删除的键 =', JSON.stringify([...deleted]));

console.log('--- 5. ownKeys 陷阱：接管键枚举 ---');

const record = { id: 1, name: '张三', _token: 'abc123', age: 18 };

const keyProxy = new Proxy(record, {
  ownKeys(tgt) {
    console.log('  [ownKeys] 被调用');
    // 默认行为：Reflect.ownKeys 返回自有键（含 symbol，含不可枚举的）。
    return Reflect.ownKeys(tgt);
  },
});

console.log('Object.keys(keyProxy) =', JSON.stringify(Object.keys(keyProxy)));
console.log('Reflect.ownKeys(代理) =', JSON.stringify(Reflect.ownKeys(keyProxy).map(String)));

// 常见需求：枚举时隐藏下划线开头的私有字段。
const hidePrivate = new Proxy(record, {
  ownKeys(tgt) {
    // 过滤掉以下划线开头的字符串键；symbol 键保留。
    return Reflect.ownKeys(tgt).filter((k) => typeof k !== 'string' || !k.startsWith('_'));
  },
  // 注意：ownKeys 只是"报出键名"，是否可枚举由 getOwnPropertyDescriptor 决定。
  getOwnPropertyDescriptor(tgt, key) {
    return Reflect.getOwnPropertyDescriptor(tgt, key);
  },
});

console.log('隐藏私有字段后 Object.keys =', JSON.stringify(Object.keys(hidePrivate)));
console.log('for...in 结果 =', (() => {
  const keys = [];
  for (const k in hidePrivate) keys.push(k);
  return JSON.stringify(keys);
})());
console.log('JSON.stringify =', JSON.stringify(hidePrivate), ' <- 序列化脱敏的关键点');
console.log('展开运算符 {...代理} =', JSON.stringify({ ...hidePrivate }));
console.log('  -> 但直接读 hidePrivate._token 仍然拿得到 =', hidePrivate._token, '（ownKeys 不拦单个属性读取）');

console.log('--- 6. 虚拟键：凭空多出属性 ---');

// 只写 ownKeys 返回虚拟键，Object.keys 看不到它 —— 这是个很迷惑的现象。
const target6 = { real: 1 };

const virtualBad = new Proxy(target6, {
  ownKeys() {
    return ['real', 'virtual'];
  },
});
console.log('只写 ownKeys 时 Object.keys =', JSON.stringify(Object.keys(virtualBad)));
console.log('  Reflect.ownKeys 却能看到 =', JSON.stringify(Reflect.ownKeys(virtualBad).map(String)));

// 原因：Object.keys 还会为每个键调用 getOwnPropertyDescriptor，
// 拿不到描述符（或枚举值为 false）的键会被跳过。
const virtualGood = new Proxy(target6, {
  ownKeys() {
    return ['real', 'virtual'];
  },
  getOwnPropertyDescriptor(tgt, key) {
    if (key === 'virtual') {
      // 为虚拟键编一个"可枚举、可配置"的描述符。
      return { value: '我是虚拟的', writable: true, enumerable: true, configurable: true };
    }
    return Reflect.getOwnPropertyDescriptor(tgt, key);
  },
  get(tgt, key, receiver) {
    if (key === 'virtual') return '我是虚拟的';
    return Reflect.get(tgt, key, receiver);
  },
});
console.log('补上描述符后 Object.keys =', JSON.stringify(Object.keys(virtualGood)));
console.log('虚拟键的值 =', virtualGood.virtual);

console.log('--- 7. 不变量（invariant）：ownKeys 的硬约束 ---');

// 目标对象被冻结后，ownKeys 必须**完整地**报出它的键，一个都不能少。
const frozenTarget = Object.freeze({ a: 1, b: 2 });

const badOwnKeys = new Proxy(frozenTarget, {
  ownKeys() {
    return ['a']; // 少了 b，违反不变量
  },
});
try {
  Object.keys(badOwnKeys);
} catch (err) {
  console.log('缺少不可配置的键：', err.constructor.name, '-', err.message);
}

const extraOwnKeys = new Proxy(frozenTarget, {
  ownKeys() {
    return ['a', 'b', 'c']; // 多了一个不存在的键，同样违反
  },
});
try {
  Object.keys(extraOwnKeys);
} catch (err) {
  console.log('凭空多出键：', err.constructor.name, '-', err.message);
}

// 目标可扩展时，多报键是允许的（上面的 virtualGood 就是证明）。
console.log('  -> 目标可扩展（extensible）时才能"撒谎"补键；不可扩展时结果为只读契约');

// has 的不变量：不可配置的自有属性不能报告为"不存在"。
const sealedTarget = {};
Object.defineProperty(sealedTarget, 'fixed', {
  value: 1,
  configurable: false,
  enumerable: true,
});

const lyingHas = new Proxy(sealedTarget, {
  has() {
    return false; // 说谎
  },
});
try {
  console.log('"fixed" in 代理 =', 'fixed' in lyingHas);
} catch (err) {
  console.log('has 说谎：', err.constructor.name, '-', err.message);
}

console.log('--- 8. 三个陷阱在遍历中的协作顺序 ---');

// 观察一次 Object.keys 会依次碰到哪些陷阱，理解它们的调用顺序。
const order = { p: 1, q: 2 };
const orderProxy = new Proxy(order, {
  ownKeys(tgt) {
    console.log('   1) ownKeys 先被调用');
    return Reflect.ownKeys(tgt);
  },
  getOwnPropertyDescriptor(tgt, key) {
    console.log(`   2) getOwnPropertyDescriptor("${String(key)}") 判断是否可枚举`);
    return Reflect.getOwnPropertyDescriptor(tgt, key);
  },
  get(tgt, key, receiver) {
    console.log(`   3) get("${String(key)}") 取最终的值`);
    return Reflect.get(tgt, key, receiver);
  },
});

console.log('执行 Object.keys(orderProxy)：');
const keys = Object.keys(orderProxy);
console.log('   结果 =', JSON.stringify(keys));
console.log('  -> 注意 get 陷阱这里没有被触发：Object.keys 只要键，不要值');

console.log('执行 JSON.stringify(orderProxy)：');
const json = JSON.stringify(orderProxy);
console.log('   结果 =', json, '（这一步才需要真正取值，于是 get 也进来了）');

console.log('\n全部演示完毕。');
