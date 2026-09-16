/**
 * ============================================================================
 * 知识点：用 Proxy 做运行时校验 —— 类型约束、未知字段拒绝、只读包装
 * ============================================================================
 *
 * 【所属分类】25_proxy_and_reflect —— 元编程：拦截对象的基本操作
 * 【难度等级】高级
 * 【前置知识】25_proxy_and_reflect/02_get_set_traps.js 与 03_has_delete_traps.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    校验代理（validation proxy）指在 set / deleteProperty / defineProperty 等陷阱里
 *    检查这次操作是否合法，不合法就抛错或记录下来。
 *    它提供了一个"数据守门人"：所有写操作都必须经过它，绕不过去。
 *
 * 2. 为什么需要
 *    JS 是动态类型语言，把字符串写进本该是数字的字段不会报错，
 *    错误往往在几百行之后才以奇怪的形式暴露。传统做法有三条路：
 *      a) 在构造函数里校验一次 —— 之后有人直接改属性就失效了；
 *      b) 每次用之前手动检查 —— 啰嗦且容易漏；
 *      c) 用 TypeScript 编译期检查 —— 运行时（比如来自 JSON 的数据）依然拦不住。
 *    Proxy 提供了第四条路：**运行时、持续、自动化**的守门能力，
 *    无论谁在什么时候赋值，都会先过一遍校验。
 *
 * 3. 核心语法要点
 *    - set 里校验失败就 throw，赋值语句会立刻抛出，错误定位在最准确的位置。
 *    - 未知字段的处理策略有两种：抛错（严格）或忽略（宽松），由参数控制。
 *    - 只读包装：set / deleteProperty / defineProperty / setPrototypeOf
 *      全部拒绝，get 正常放行。
 *    - "深只读"需要在 get 陷阱里对嵌套对象递归地再包一层代理，
 *      并且要用缓存（WeakMap）保证"同一个嵌套对象每次返回同一个代理"，
 *      否则 `obj.a === obj.a` 会变成 false，很多代码会因此出错。
 *    - 数组的元素类型校验同样在 set 陷阱里做：判断 key 是不是数组下标。
 *    - 需要"收集全部错误"而不是"遇错即抛"时，陷阱里只记录错误，
 *      最后统一交给 validate() 返回。
 *
 * 4. 常见陷阱
 *    - 陷阱里抛出的错误会打断整个表达式，所以"批量校验"要用收集模式。
 *    - 只读代理的 set 陷阱必须返回 true 才能"静默拒绝"；
 *      返回 false 会抛 TypeError，两者语义不同，要按需选择。
 *    - 深只读如果不做代理缓存，会产生大量临时代理对象（性能与身份问题）。
 *    - 校验代理只保护通过代理的写入，target 若被泄漏出去就形同虚设。
 *    - 在校验函数里做耗时操作（如正则回溯、网络请求）会拖慢每一次赋值。
 *    - 注意区分 `undefined` 与"字段不存在"：`in` 判断要用 Reflect.has。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 25_proxy_and_reflect/05_validation_proxy.js
 *
 * 【预期输出】
 *   打印通过校验与未通过校验的写入效果、只读代理的拒绝行为、深只读的层层保护。
 * ============================================================================
 */

console.log('--- 1. 最简单的类型校验代理 ---');

/**
 * 给对象套一层"字段类型"校验。
 * @param {object} target 被保护的对象
 * @param {Record<string, string>} schema 形如 { name: 'string', age: 'number' }
 * @param {{ allowUnknown?: boolean }} [options]
 */
function typed(target, schema, options = {}) {
  const { allowUnknown = false } = options;

  return new Proxy(target, {
    set(tgt, key, value, receiver) {
      // 只对字符串键做校验（symbol 键一般是引擎内部使用的）。
      if (typeof key === 'string') {
        const expected = schema[key];

        if (expected === undefined) {
          if (!allowUnknown) {
            throw new TypeError(`不允许写入未知字段 "${key}"`);
          }
        } else if (typeof value !== expected) {
          throw new TypeError(`字段 "${key}" 期望 ${expected}，实际收到 ${typeof value}`);
        }
      }
      return Reflect.set(tgt, key, value, receiver);
    },

    // delete 会让对象偏离"符合 schema"的状态，直接禁止。
    deleteProperty(tgt, key) {
      if (typeof key === 'string' && key in schema) {
        throw new TypeError(`字段 "${key}" 是 schema 的一部分，不能删除`);
      }
      return Reflect.deleteProperty(tgt, key);
    },
  });
}

const user = typed(
  { name: '张三', age: 18 },
  { name: 'string', age: 'number', active: 'boolean' },
);

console.log('构造出的对象 =', JSON.stringify(user));

// 合法写入。
user.age = 20;
user.active = true;
console.log('合法写入后 =', JSON.stringify(user));

// 非法写入：类型不符。
try {
  user.age = '20';
} catch (err) {
  console.log('类型不符：', err.constructor.name, '-', err.message);
}

// 非法写入：未知字段。
try {
  user.extra = 'x';
} catch (err) {
  console.log('未知字段：', err.constructor.name, '-', err.message);
}

// 非法删除。
try {
  delete user.name;
} catch (err) {
  console.log('非法删除：', err.constructor.name, '-', err.message);
}

// 宽松模式：未知字段只忽略、不报错。
const flexible = typed({ a: 1 }, { a: 'number' }, { allowUnknown: true });
flexible.b = '随便加';
console.log('宽松模式下可以加新字段 =', JSON.stringify(flexible));

console.log('--- 2. 更实用的校验器：断言函数 + 自定义消息 ---');

/**
 * 用"断言函数"而不是类型字符串来描述约束，表达力强得多。
 * schema 形如 { age: { test: v => v >= 0, message: '年龄不能为负' } }
 */
function constrained(target, schema) {
  return new Proxy(target, {
    set(tgt, key, value, receiver) {
      const rule = typeof key === 'string' ? schema[key] : undefined;
      if (rule) {
        // 先做类型检查，再做业务规则检查。
        if (rule.type && typeof value !== rule.type) {
          throw new TypeError(`${String(key)} 必须是 ${rule.type}（收到 ${typeof value}）`);
        }
        if (rule.test && !rule.test(value)) {
          throw new RangeError(rule.message ?? `${String(key)} 的值不合法：${value}`);
        }
      }
      return Reflect.set(tgt, key, value, receiver);
    },
  });
}

const product = constrained(
  { name: '键盘', price: 199, stock: 10 },
  {
    name: {
      type: 'string',
      test: (v) => v.trim().length > 0,
      message: '商品名不能为空',
    },
    price: {
      type: 'number',
      test: (v) => v >= 0 && Number.isFinite(v),
      message: '价格必须是非负有限数',
    },
    stock: {
      type: 'number',
      test: (v) => Number.isInteger(v) && v >= 0,
      message: '库存必须是非负整数',
    },
  },
);

product.price = 249;
console.log('正常改价 =', product.price);

try {
  product.price = -1;
} catch (err) {
  console.log('负数价格：', err.constructor.name, '-', err.message);
}
try {
  product.stock = 2.5;
} catch (err) {
  console.log('小数库存：', err.constructor.name, '-', err.message);
}
try {
  product.name = '   ';
} catch (err) {
  console.log('空白名称：', err.constructor.name, '-', err.message);
}

console.log('--- 3. 只读包装 ---');

/**
 * 只读代理：所有写操作都被拒绝。
 * @param {object} target
 * @param {boolean} silent true = 静默忽略写入；false = 抛 TypeError
 */
function readonly(target, silent = false) {
  // 拒绝时统一走这里，保证行为一致。
  const deny = (action) => {
    if (silent) return true; // 报告"成功"，但什么也没做
    throw new TypeError(`对象是只读的，不能执行：${action}`);
  };

  return new Proxy(target, {
    set(tgt, key) {
      return deny(`设置属性 ${String(key)}`);
    },
    deleteProperty(tgt, key) {
      return deny(`删除属性 ${String(key)}`);
    },
    defineProperty(tgt, key) {
      return deny(`定义属性 ${String(key)}`);
    },
    setPrototypeOf() {
      return deny('修改原型');
    },
  });
}

const config = readonly({ host: 'localhost', port: 8080 });
console.log('只读对象读取正常 =', config.host, ':', config.port);

try {
  config.port = 9090;
} catch (err) {
  console.log('写入只读对象：', err.constructor.name, '-', err.message);
}
try {
  delete config.host;
} catch (err) {
  console.log('删除只读对象属性：', err.constructor.name, '-', err.message);
}
try {
  Object.defineProperty(config, 'newKey', { value: 1 });
} catch (err) {
  console.log('在只读对象上定义属性：', err.constructor.name, '-', err.message);
}

// 静默模式：不报错，但也不生效 —— 常用于"配置覆盖"这类容错场景。
const silentConfig = readonly({ a: 1 }, true);
silentConfig.a = 999;
silentConfig.b = 2;
console.log('静默只读对象 =', JSON.stringify(silentConfig), '（写入被无声丢弃）');
console.log('  -> 静默模式更安全的地方在于：老代码里可能有大量无意写入，不会因此崩溃');

console.log('--- 4. 深只读：递归地保护嵌套对象 ---');

/**
 * 深只读：对嵌套的普通对象/数组递归地创建只读代理。
 * 关键点是用 WeakMap 缓存代理，保证 obj.a === obj.a。
 */
function deepReadonly(target, cache = new WeakMap()) {
  // 只有对象才需要代理，原始值直接返回。
  if (target === null || typeof target !== 'object') return target;

  // 已经在缓存里就直接复用 —— 这一步保证了对象身份稳定。
  if (cache.has(target)) {
    console.log(`     （命中代理缓存，复用已有代理）`);
    return cache.get(target);
  }

  const proxy = new Proxy(target, {
    get(tgt, key, receiver) {
      const value = Reflect.get(tgt, key, receiver);
      // 读到嵌套对象时，递归包一层 —— 这就是"深"的来源。
      return deepReadonly(value, cache);
    },
    set(tgt, key) {
      throw new TypeError(`深只读对象不能设置属性 "${String(key)}"`);
    },
    deleteProperty(tgt, key) {
      throw new TypeError(`深只读对象不能删除属性 "${String(key)}"`);
    },
  });

  cache.set(target, proxy);
  return proxy;
}

const deepData = {
  server: { host: 'localhost', ports: [80, 443] },
  features: { logging: true },
};

const frozenDeep = deepReadonly(deepData);
console.log('第一层读取 =', frozenDeep.server.host);

// 数组元素也被保护：ports[0] 会在 set 陷阱里被拦下。
try {
  frozenDeep.server.ports[0] = 8080;
} catch (err) {
  console.log('修改深层数组元素：', err.constructor.name, '-', err.message);
}
try {
  frozenDeep.features.logging = false;
} catch (err) {
  console.log('修改深层对象属性：', err.constructor.name, '-', err.message);
}

// 代理身份稳定：两次读取同一个嵌套对象，拿到的是同一个代理。
const s1 = frozenDeep.server;
const s2 = frozenDeep.server;
console.log('两次读取嵌套对象是同一个代理吗？', s1 === s2, ' <- WeakMap 缓存的功劳');
console.log('  如果没有缓存，每次 get 都会新建代理，s1 === s2 会变成 false，');
console.log('  而下一次读取又会产生新代理，s1.x === s2.x 也变成 false，很多代码会莫名出错');

// 与 Object.freeze 对比：Object.freeze 也是浅的。
const shallowFrozen = Object.freeze({ inner: { v: 1 } });
shallowFrozen.inner.v = 2; // 不会报错！因为 inner 本身没被冻结
console.log('Object.freeze 是浅冻结：inner.v 被改成了', shallowFrozen.inner.v);
console.log('  -> 要深冻结要么递归 freeze，要么用上面的深只读代理（代理还能"抛错"，freeze 只是静默失败）');

console.log('--- 5. 数组的元素类型约束 ---');

/**
 * 带元素类型约束的数组。
 * @param {Array} arr
 * @param {(v:any, index:number) => boolean} isValid
 * @param {string} message
 */
function typedArray(arr, isValid, message) {
  return new Proxy(arr, {
    set(tgt, key, value, receiver) {
      // 只校验"数组下标"这类键；length 以及自定义属性放行。
      const isIndex = typeof key === 'string' && /^(0|[1-9]\d*)$/.test(key);
      if (isIndex && !isValid(value, Number(key))) {
        throw new TypeError(`${message}（收到 ${JSON.stringify(value)}）`);
      }
      // 用 Reflect.set 完成默认行为；数组长度会自动更新。
      return Reflect.set(tgt, key, value, receiver);
    },
  });
}

const scores = typedArray([], (v) => typeof v === 'number' && v >= 0 && v <= 100, '分数必须是 0~100 的数字');

scores.push(90); // push 内部也是按下标写入，同样会被拦截
scores.push(85);
scores[2] = 100;
console.log('合法写入后的数组 =', JSON.stringify(scores), ', length =', scores.length);

try {
  scores.push('不及格');
} catch (err) {
  console.log('push 非法元素：', err.constructor.name, '-', err.message);
}
try {
  scores[1] = 200;
} catch (err) {
  console.log('下标写入非法值：', err.constructor.name, '-', err.message);
}
console.log('  当前数组仍然合法 =', JSON.stringify(scores));

console.log('--- 6. 收集模式：不抛错，一次性报告所有问题 ---');

/**
 * 校验代理的"温和版"：把违规记录下来，不打断执行。
 * 适合"导入外部数据后统一校验"的场景。
 */
function collecting(target, schema) {
  const errors = [];

  const proxy = new Proxy(target, {
    set(tgt, key, value, receiver) {
      const expected = typeof key === 'string' ? schema[key] : undefined;
      if (typeof key === 'string') {
        if (expected === undefined) {
          errors.push(`未知字段：${key}`);
        } else if (typeof value !== expected) {
          errors.push(`字段 ${key} 期望 ${expected}，收到 ${typeof value}`);
        }
      }
      // 无论是否合法都先写进去，方便用户看到"脏数据"再修正。
      return Reflect.set(tgt, key, value, receiver);
    },
  });

  return {
    proxy,
    validate: () => (errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors: [...errors] }),
    clear: () => errors.splice(0, errors.length),
  };
}

// 模拟从 JSON 导入的一份"脏数据"。
const imported = collecting({}, { id: 'number', title: 'string', done: 'boolean' });

imported.proxy.id = '1001'; // 类型错
imported.proxy.title = '写文档'; // 正确
imported.proxy.done = 0; // 类型错
imported.proxy.extra = '多余的'; // 未知字段

const report = imported.validate();
console.log('校验通过吗？', report.ok);
console.log('发现的问题：');
for (const e of report.errors) console.log('   -', e);

console.log('  当前数据（脏数据也被写进去了，方便排查）=', JSON.stringify(imported.proxy));
console.log('  -> 抛错模式 vs 收集模式：前者保护"数据永远不会变脏"，后者适合"先收下再修"');

console.log('--- 7. 组合：校验 + 只读的"一次性初始化"对象 ---');

/**
 * 允许写入 N 次，之后自动转为只读 —— 常用于"配置对象初始化完成后锁定"。
 */
function lockAfter(target, writes) {
  let remaining = writes;

  return new Proxy(target, {
    set(tgt, key, value, receiver) {
      if (remaining <= 0) {
        throw new TypeError(`对象已锁定，不能再修改 "${String(key)}"`);
      }
      remaining -= 1;
      console.log(`  [lock] 还可写入 ${remaining} 次`);
      return Reflect.set(tgt, key, value, receiver);
    },
  });
}

const settings = lockAfter({}, 2);
settings.theme = 'dark';
settings.fontSize = 14;
try {
  settings.locale = 'zh-CN';
} catch (err) {
  console.log('超额度写入：', err.constructor.name, '-', err.message);
}
console.log('最终配置 =', JSON.stringify(settings));

console.log('\n全部演示完毕。');
