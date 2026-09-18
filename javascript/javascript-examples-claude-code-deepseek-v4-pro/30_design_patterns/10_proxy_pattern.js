/**
 * ============================================================================
 * 知识点：代理模式 —— 缓存代理 / 虚拟代理 / 保护代理 / 远程代理 + ES6 Proxy
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/09_adapter.js（务必对比看，代理与适配器极易混淆）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    代理（Proxy）为另一个对象提供一个"替身"或"占位符"，由替身控制对原对象的访问。
 *    关键约束：**代理与原对象实现同一个接口**（所以调用方无感），
 *    区别只在于代理在"转发调用"的前后插入了额外控制。
 *    这与适配器形成鲜明对比：
 *        适配器：接口不同 -> 改成一样（解决"不兼容"）
 *        代理  ：接口相同 -> 加上控制（解决"访问方式"）
 *        装饰器：接口相同 -> 加上功能（解决"功能增强"）
 *    代理与装饰器的差别很微妙：装饰器是"给调用方加功能"，
 *    代理是"替原对象管理访问"（原对象可能根本还没被创建，比如虚拟代理）。
 *    最实用的区分标准：**代理通常自己创建/持有真实对象，装饰器由外部传入。**
 *
 * 2. 为什么需要（真实项目场景）
 *    - 缓存代理：昂贵计算/网络请求的结果缓存（同一参数不重复请求）。
 *    - 虚拟代理（懒加载）：图片位置先占位，滚动到可视区才真正加载；
 *      大型对象延迟到第一次使用时才构造。
 *    - 保护代理：权限检查（没权限就不转发），很像装饰器里的 withAuth。
 *    - 远程代理：本地对象代表远程对象（RPC 客户端、gRPC stub），
 *      调用方像调本地方法一样调远程服务。
 *    - 智能引用：引用计数、写时复制、访问日志 —— 都是"转发 + 附加动作"。
 *
 * 3. 核心语法要点
 *    - 手工代理：写一个同接口的对象/类，内部持有 target，方法里转发。
 *    - 缓存代理的键：要能唯一标识一次调用，参数序列化是常见做法（有坑，见第 5 节）。
 *    - 虚拟代理的"占位符"：先用一个轻量对象顶上，真正需要时才创建重量级对象。
 *    - **ES6 Proxy（语言级）**：
 *        const p = new Proxy(target, handler);
 *      其中 handler 里可以定义"陷阱"（traps）：get / set / has / deleteProperty /
 *      ownKeys / apply / construct 等。它拦截的是**语言层面的操作**
 *      （读属性、写属性、in 运算符、for...in、函数调用……），
 *      能力远大于手工代理，而且不需要为每个方法写一遍转发代码。
 *    - Reflect：陷阱里几乎总是配合 Reflect 使用
 *      （Reflect.get(target, key, receiver) 等），
 *      它提供了"默认行为"的标准实现，避免手工写 target[key] 时丢掉 receiver。
 *    - receiver：第三个参数，用于正确处理 getter/setter 里的 this 指向，
 *      漏掉它会让继承场景下的 getter 读到错误的 this。
 *
 * 4. 常见陷阱
 *    - 代理与目标接口不一致：调用方调了代理上没有的方法 -> "代理漏方法" 是手工代理最常见 bug。
 *      （用 ES6 Proxy 就不会漏，因为它会自动转发未拦截的操作。）
 *    - 缓存 key 碰撞：JSON.stringify({a:1,b:2}) 与 JSON.stringify({b:2,a:1}) 不同，
 *      会导致"同样语义的参数被当成两次调用"；反之用简单拼接又可能把
 *      ['a','b'] 与 'a,b' 混为一谈。
 *    - 缓存了可变对象：返回的是同一个对象引用，调用方改了它，缓存就被污染了。
 *      必要时返回深拷贝或冻结。
 *    - ES6 Proxy 的性能：每次属性访问都要经过陷阱，热路径上比直接访问慢
 *      （通常在数倍量级）。不要无脑给所有对象套 Proxy。
 *    - ES6 Proxy 无法代理"私有字段"：代理的是属性访问，类的 #private 字段
 *      访问不经过陷阱（它不是属性），在代理对象上调用方法时 this 指向代理，
 *      可能触发 "#field must be declared" 类型错误。
 *    - 代理不改变原对象的其他引用：别人直接拿着 target 就绕过了代理。
 *      （"代理只能防君子"—— 想真正限制访问，就不要把 target 暴露出去。）
 *    - Proxy 不能撤销（除非用 Proxy.revocable），也没有"自动失效"机制。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/10_proxy_pattern.js
 *
 * 【预期输出】
 *   依次实现缓存代理、虚拟代理（图片懒加载）、保护代理，说明远程代理概念，
 *   然后专门用一大节演示 ES6 Proxy（数组负索引、默认值 + 警告、读写拦截、
 *   函数调用拦截、与手工代理的对照表），最后给出代理的代价与不适用场景。
 * ============================================================================
 */

// ===========================================================================
// 1. 缓存代理
// ===========================================================================

console.log('--- 1. 缓存代理：昂贵函数的结果复用 ---');

/** 真实对象：一个"昂贵"的计算（故意做 20 万次循环，1 秒内可完成） */
function realExpensiveCalc(n) {
  let acc = 0;
  for (let i = 0; i < 200_000; i += 1) acc += (i * n) % 13;
  return `${n}:${acc % 100000}`;
}

/**
 * 缓存代理：与真实函数**同名同签名**（这就是"同一接口"的要求）。
 * 手工代理在这里的写法就是"包装函数"，和装饰器的写法几乎一样 ——
 * 区别在意图：装饰器是"加日志/计时"，代理是"代替真实对象响应（命中缓存就不转发）"。
 */
function createCacheProxy(fn) {
  const cache = new Map();
  let hits = 0;
  let misses = 0;

  const proxy = function (...args) {
    const key = args.map((a) => JSON.stringify(a)).join('|');
    if (cache.has(key)) {
      hits += 1;
      return cache.get(key);
    }
    misses += 1;
    const value = fn.apply(this, args);
    cache.set(key, value);
    return value;
  };

  proxy.stats = () => ({ hits, misses, size: cache.size });
  proxy.clear = () => cache.clear();
  return proxy;
}

const cachedCalc = createCacheProxy(realExpensiveCalc);

const t0 = performance.now();
cachedCalc(7);
const t1 = performance.now();
cachedCalc(7); // 命中缓存：代理自己返回，不转发给真实对象
cachedCalc(7);
cachedCalc(9);
const t2 = performance.now();
console.log(`首次（未命中）：${(t1 - t0).toFixed(2)}ms`);
console.log(`后续两次同参数 + 一次新参数共耗时：${(t2 - t1).toFixed(3)}ms`);
console.log('代理统计：', cachedCalc.stats());
cachedCalc.clear();
console.log('clear 之后：', cachedCalc.stats());

// ===========================================================================
// 2. 虚拟代理（懒加载）
// ===========================================================================

console.log('\n--- 2. 虚拟代理：延迟创建昂贵对象 ---');

/** 重量级对象：构造代价高（这里用一段同步循环模拟），且占用大量内存 */
class HeavyImage {
  #pixels;

  constructor(url) {
    // 模拟"解码图片"的昂贵过程
    this.#pixels = new Array(50_000).fill(0).map((_, i) => i % 251);
    this.url = url;
    this.loadedAt = '真实加载完成';
  }

  /** 真实对象才有的昂贵方法 */
  render() {
    return `<img src="${this.url}" data-pixels="${this.#pixels.length}" />`;
  }
}

/**
 * 虚拟代理：一开始只是一个"占位符"，完全不创建 HeavyImage。
 * 直到第一次 render() 时才真正构造 —— 这就是图片懒加载的原理。
 */
class ImageProxy {
  #real = null; // 虚拟代理自己持有真实对象（这是它区别于装饰器的标志）
  #creationCount;

  constructor(url, creationCounter) {
    this.url = url;
    this.#creationCount = creationCounter;
    this.placeholder = `<img src="placeholder.png" data-real="${url}" />`; // 占位图
  }

  /** 第一次调用时才创建真实对象，之后复用 */
  #getReal() {
    if (this.#real === null) {
      this.#creationCount.count += 1;
      this.#real = new HeavyImage(this.url);
      console.log(`    （虚拟代理此刻才真正创建 HeavyImage：${this.url}）`);
    }
    return this.#real;
  }

  /** 与真实对象同名同签名的方法：转发给真实对象 */
  render() {
    return this.#getReal().render();
  }

  /** 代理可以额外暴露"是否已加载"，方便调试（不算破坏接口） */
  get isLoaded() {
    return this.#real !== null;
  }
}

const creationCounter = { count: 0 };
const images = [
  new ImageProxy('a.jpg', creationCounter),
  new ImageProxy('b.jpg', creationCounter),
  new ImageProxy('c.jpg', creationCounter),
];

console.log('刚创建 3 个图片代理，真实对象创建次数：', creationCounter.count, '（一个都没创建）');
console.log('占位符内容：', images[0].placeholder);
console.log('isLoaded 状态：', images.map((i) => i.isLoaded).join(', '));

console.log('现在"滚动"到第 2 张图：');
console.log('  ' + images[1].render());
console.log('真实对象创建次数：', creationCounter.count);
console.log('第 2 张再渲染一次（复用，不再创建）：');
images[1].render();
console.log('真实对象创建次数仍为：', creationCounter.count);
console.log(`结论：懒加载省下的是"从未被看到的那部分"的构造开销与内存。
  在长列表（1000 张图）里，这个差别是决定性的。`);

// ===========================================================================
// 3. 保护代理
// ===========================================================================

console.log('\n--- 3. 保护代理：访问控制 ---');

/** 真实对象：一个敏感的数据库接口 */
class UserRepository {
  #rows = [
    { id: 1, name: '张三', salary: 30000, ssn: '110-xx' },
    { id: 2, name: '李四', salary: 45000, ssn: '310-xx' },
  ];

  findAll() {
    return this.#rows.map((r) => ({ ...r }));
  }

  findById(id) {
    const row = this.#rows.find((r) => r.id === id);
    return row ? { ...row } : null;
  }
}

/**
 * 保护代理：与真实对象同一接口，但在转发前做权限判断。
 * 关键设计：**敏感字段的脱敏也放在代理里**，
 * 这样即使未来有人直接调用真实对象的方法，脱敏逻辑也集中在一处便于审查。
 */
class SecureUserRepositoryProxy {
  #real;
  #getCurrentUser;

  constructor(real, getCurrentUser) {
    this.#real = real; // 代理持有真实对象
    this.#getCurrentUser = getCurrentUser;
  }

  /** 脱敏：把敏感字段替换成掩码 */
  #mask(row) {
    return { ...row, salary: '***', ssn: '***' };
  }

  findAll() {
    const user = this.#getCurrentUser();
    if (!user) throw new Error('未登录，禁止访问用户列表');
    const rows = this.#real.findAll();
    // 只有有权限的角色才能看到明文
    return user.roles.includes('hr') ? rows : rows.map((r) => this.#mask(r));
  }

  findById(id) {
    const user = this.#getCurrentUser();
    if (!user) throw new Error('未登录，禁止查询用户');
    // 保护代理可以做"更细粒度"的判断：普通用户只能查自己
    if (!user.roles.includes('hr') && user.id !== id) {
      throw new Error(`用户 ${user.id} 无权查看用户 ${id} 的信息`);
    }
    const row = this.#real.findById(id);
    return row && !user.roles.includes('hr') ? this.#mask(row) : row;
  }
}

const repo = new UserRepository();
let currentUser = null;
const secureRepo = new SecureUserRepositoryProxy(repo, () => currentUser);

try {
  secureRepo.findAll();
} catch (err) {
  console.log('  未登录被保护代理拦下：', err.message);
}

currentUser = { id: 1, name: '张三', roles: ['employee'] };
console.log('  普通员工看到的列表（已脱敏）：', JSON.stringify(secureRepo.findAll()));
console.log('  普通员工查自己：', JSON.stringify(secureRepo.findById(1)));
try {
  secureRepo.findById(2);
} catch (err) {
  console.log('  普通员工查别人被拦下：', err.message);
}

currentUser = { id: 99, name: 'HR', roles: ['hr'] };
console.log('  HR 看到的列表（明文）：', JSON.stringify(secureRepo.findAll()));
console.log(`  注意：真实对象的 findAll() 依然返回明文 —— 代理只能防"通过代理的访问"。
  想彻底防住，就不要把 repo 暴露出去（这是"代理只能防君子"的含义）。`);

// ===========================================================================
// 4. 远程代理（概念说明 + 极简模拟）
// ===========================================================================

console.log('\n--- 4. 远程代理（概念） ---');

console.log(`远程代理：本地对象是远程对象的"替身"，调用方以为自己在调本地方法。
    调用方 ──> 本地代理对象 ──(序列化 + 网络)──> 远程服务
                         <──(反序列化)──────────

  真实例子：
    - gRPC / Thrift 生成的客户端 stub：client.getUser(id) 看起来是本地调用；
    - Java 的 RMI、前端的 GraphQL 客户端、微服务间的 REST SDK 封装；
    - Web Worker 的封装：主线程调用 workerProxy.compute(x)，
      实际是 postMessage 到 worker 里执行。

  它要额外处理（这也是"远程"带来的独有成本）：
    - 序列化/反序列化（不能传函数、循环引用、Date 会变字符串）；
    - 网络失败与超时（本地调用不会失败，远程调用会）；
    - 重试与幂等（重试必须保证"重复执行不出错"）；
    - 延迟：本地调用是纳秒级，远程是毫秒级，接口设计必须考虑批量与并发。`);

// 极简模拟：一个"返回 Promise 的远程代理"
const remoteBackend = {
  // 假装这是远程服务，同步返回数据
  _data: { 1: { id: 1, name: '远程用户一' } },
  fetchUser(id) {
    return this._data[id] ?? null;
  },
};

/** 远程代理：把同步的远程调用包装成异步（真实网络必然异步），并统一错误 */
class UserServiceRemoteProxy {
  #transport;
  constructor(transport) {
    this.#transport = transport;
  }
  async getUser(id) {
    // 真实场景这里是 await fetch(...)
    if (!Number.isInteger(id)) {
      // 远程代理必须把"客户端参数错误"与"服务端错误"分开处理
      throw new TypeError('id 必须是整数');
    }
    const raw = this.#transport.fetchUser(id);
    if (!raw) throw new Error(`远程服务返回 404：用户 ${id} 不存在`);
    return raw;
  }
}

const userService = new UserServiceRemoteProxy(remoteBackend);
console.log('  远程代理(成功)：', await userService.getUser(1));
try {
  await userService.getUser(404);
} catch (err) {
  console.log('  远程代理(失败)：', err.message);
}

// ===========================================================================
// 5. ES6 Proxy：语言级元编程（与经典代理模式的关系）
// ===========================================================================

console.log('\n--- 5. ES6 Proxy 与经典代理模式的关系 ---');

console.log(`【关系】思想完全一致，手段完全不同。
  经典代理模式：手写一个同接口的对象，方法里逐个转发 —— 是"应用层"的做法。
  ES6 Proxy  ：new Proxy(target, handler) 拦截的是"语言层面的操作" ——
               读属性、写属性、in、delete、for...in、函数调用、new……
               是"语言层"的做法，不需要你为每个方法写转发代码。

  所以：
    - ES6 Proxy 能自动转发未拦截的操作（不会"漏方法"）；
    - ES6 Proxy 能拦截的属性访问，手写代理根本拦截不到
      （比如 obj.foo 这种普通属性读取，你没法用方法包装它）；
    - 但 ES6 Proxy 有性能开销，且无法拦截类的 #私有字段。

  一句话：ES6 Proxy 是"把代理模式做进了语言里"，是同一思想的最强形态。`);

// --------------------------------------------------------------------------
// 5.1 可运行的 ES6 Proxy 示例 A：读不存在的属性时返回默认值并警告
// --------------------------------------------------------------------------

console.log('\n-- 5.1 示例 A：属性默认值 + 未定义属性警告 --');

/**
 * 用 get 陷阱实现"配置对象缺省值 + 拼错属性名报警"。
 * 这是 ES6 Proxy 最实用的场景之一：把"静默的 undefined"变成"看得见的警告"。
 */
function createSafeConfig(defaults) {
  const store = { ...defaults };
  const accessed = new Set();

  return new Proxy(store, {
    /**
     * get 陷阱：拦截 obj.foo 读取。
     * @param target 目标对象
     * @param key 属性名
     * @param receiver 代理对象本身（用于正确传递 this，见 5.4 的说明）
     */
    get(target, key, receiver) {
      // 用 Reflect.get 执行"默认行为"，并把 receiver 传下去。
      // 不要写 target[key] —— 那样在继承/getter 场景下 this 会指向 target 而不是 receiver。
      const value = Reflect.get(target, key, receiver);

      // 只对"字符串键且不是内部符号"做检查
      if (typeof key === 'string' && !(key in target)) {
        console.log(`  ⚠ 配置项 "${key}" 未定义，已返回 undefined（是不是拼错了？）`);
        return undefined;
      }

      if (typeof key === 'string') accessed.add(key);
      // 如果值本身是对象，可以递归包一层（这里为了简短不展开）
      return value;
    },

    /** set 陷阱：拦截 obj.foo = 1 写入，可以做校验 */
    set(target, key, value, receiver) {
      if (typeof key === 'string' && key.startsWith('_')) {
        console.log(`  ⛔ 拒绝写入内部字段 "${key}"`);
        return false; // 返回 false 表示写入失败（严格模式下抛 TypeError）
      }
      return Reflect.set(target, key, value, receiver);
    },

    /** has 陷阱：拦截 'foo' in obj */
    has(target, key) {
      console.log(`  （in 运算符被拦截：检查 "${String(key)}"）`);
      return Reflect.has(target, key);
    },

    /** ownKeys 陷阱：拦截 Object.keys / for...in */
    ownKeys(target) {
      // 可以在这里过滤掉私有键（这里演示：返回全部）
      return Reflect.ownKeys(target);
    },
  });
}

const cfg = createSafeConfig({ host: 'localhost', port: 8080 });
console.log('  正常读取 port：', cfg.port);
console.log('  读取拼错的 hots：', cfg.hots);
console.log("  'host' in cfg：", 'host' in cfg);
cfg.timeout = 3000;
console.log('  写入 timeout 成功，值为：', cfg.timeout);
// 注意：set 陷阱返回 false 时，在**严格模式**下（ESM 顶层就是严格模式）
// 赋值语句会抛 TypeError —— 这是规范行为，不是 bug。所以这里必须 try/catch。
try {
  cfg._secret = 'x';
} catch (err) {
  console.log('  写入内部字段被拒绝：', err.name, '-', err.message);
}
console.log('  _secret 是否写入成功：', '_secret' in cfg, '（set 陷阱返回 false 被拦下）');

// --------------------------------------------------------------------------
// 5.2 可运行的 ES6 Proxy 示例 B：数组负索引
// --------------------------------------------------------------------------

console.log('\n-- 5.2 示例 B：数组负索引访问 --');

/**
 * JS 数组不支持 arr[-1]，用 Proxy 的 get 陷阱把负索引翻译成正索引。
 * 这正是"代理模式"的教科书用途：接口不变（还是 arr[i]），行为被增强。
 */
function createNegativeIndexArray(initial = []) {
  return new Proxy(initial, {
    get(target, key, receiver) {
      // 只处理"-1"、"-2" 这类整数字符串
      if (typeof key === 'string' && /^-\d+$/.test(key)) {
        const idx = Number(key);
        const realIndex = target.length + idx; // -1 -> length-1
        if (realIndex < 0) {
          console.log(`  ⚠ 索引 ${key} 越界（数组长度 ${target.length}）`);
          return undefined;
        }
        return target[realIndex];
      }
      return Reflect.get(target, key, receiver);
    },
  });
}

const arr = createNegativeIndexArray(['a', 'b', 'c', 'd']);
console.log('  arr[0]   =', arr[0]);
console.log('  arr[-1]  =', arr[-1], '（最后一个）');
console.log('  arr[-2]  =', arr[-2]);
console.log('  arr[-9]  =', arr[-9]);
console.log('  arr.length =', arr.length, '（length 走默认行为）');
console.log('  数组方法照常可用：', arr.slice(0, 2).join(','));

// --------------------------------------------------------------------------
// 5.3 函数代理：apply 陷阱
// --------------------------------------------------------------------------

console.log('\n-- 5.3 示例 C：用 apply 陷阱拦截函数调用 --');

/**
 * Proxy 的 target 也可以是函数，此时可以拦截调用（apply）
 * 与 new（construct）。这是实现"函数级切面"的另一种方式。
 */
function createAuditedFunction(fn) {
  const log = [];
  return new Proxy(fn, {
    /** apply 陷阱：(目标函数, thisArg, 参数数组) */
    apply(target, thisArg, args) {
      const started = performance.now();
      try {
        // 用 Reflect.apply 执行默认行为，把 thisArg 传下去（保持 this）
        const result = Reflect.apply(target, thisArg, args);
        log.push({ args, result, ms: performance.now() - started, ok: true });
        return result;
      } catch (err) {
        log.push({ args, error: err.message, ms: performance.now() - started, ok: false });
        throw err; // 不吞掉业务错误
      }
    },
    /** construct 陷阱：拦截 new fn() */
    construct(target, args, newTarget) {
      console.log('  （construct 陷阱：有人用 new 调用了这个函数）');
      return Reflect.construct(target, args, newTarget);
    },
    /** 访问自定义属性：把审计日志挂上去 */
    get(target, key, receiver) {
      if (key === '__log') return [...log];
      return Reflect.get(target, key, receiver);
    },
  });
}

function divideWithThis(a, b) {
  if (b === 0) throw new RangeError('除数不能为 0');
  // 依赖 this 的场景：这里 this 可能被 apply 传递进来
  const factor = this?.factor ?? 1;
  return (a / b) * factor;
}

const audited = createAuditedFunction(divideWithThis);
console.log('  audited(10, 2) =', audited(10, 2));
console.log('  带 this 调用：audited.call({ factor: 100 }, 10, 2) =', audited.call({ factor: 100 }, 10, 2));
try {
  audited(1, 0);
} catch (err) {
  console.log('  抛错也被记录：', err.message);
}
console.log('  审计日志条数：', audited.__log.length);
console.log('  日志内容：', audited.__log.map((l) => (l.ok ? `ok=${l.result}` : `err=${l.error}`)).join(' | '));

// new 也会被拦截
class Point3D {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
const ProxiedPoint = new Proxy(Point3D, {
  construct(target, args) {
    console.log('  （construct 陷阱：拦截 new，参数', args, '）');
    // 在构造真实对象之前可以改参数、做校验、甚至返回别的对象
    const [x, y] = args;
    if (x < 0 || y < 0) throw new RangeError('坐标不能为负');
    return Reflect.construct(target, [x, y]);
  },
});
console.log('  new ProxiedPoint(3, 4) =>', JSON.stringify(new ProxiedPoint(3, 4)));
try {
  new ProxiedPoint(-1, 4);
} catch (err) {
  console.log('  非法构造被拦下：', err.message);
}

// --------------------------------------------------------------------------
// 5.4 手工代理 vs ES6 Proxy：对照表
// --------------------------------------------------------------------------

console.log('\n-- 5.4 手工代理 vs ES6 Proxy --');

const rows = [
  ['维度', '手工代理（经典模式）', 'ES6 Proxy（语言级）'],
  ['实现方式', '写一个同接口的对象/类', 'new Proxy(target, handler)'],
  ['能拦截什么', '只能拦截你写过的方法调用', '读/写/删除/in/遍历/调用/构造 等语言操作'],
  ['是否漏方法', '会漏（新增方法要同步加）', '不会（未拦截的操作自动转发）'],
  ['属性访问', '拦截不到 obj.x', '可以拦截'],
  ['性能', '几乎无额外开销（就是一次调用）', '有明显开销（每次操作过陷阱）'],
  ['私有字段', '无影响', '无法拦截 #private 访问'],
  ['典型用途', '缓存/懒加载/权限/RPC', '响应式系统、沙箱、ORM 惰性加载、Mock'],
];
const dw = (s) =>
  [...String(s)].reduce((w, ch) => w + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1), 0);
const ws = [0, 1, 2].map((i) => Math.max(...rows.map((r) => dw(r[i]))));
const padTo = (s, w) => String(s) + ' '.repeat(w - dw(s) + 2);
for (const [idx, row] of rows.entries()) {
  console.log(row.map((c, i) => padTo(c, ws[i])).join(''));
  if (idx === 0) console.log('-'.repeat(ws.reduce((a, w) => a + w + 2, 0)));
}

// 微型性能对比：直接访问 vs 通过 Proxy 访问（循环次数控制在几十万级）
const plain = { value: 1 };
const proxied = new Proxy(plain, {
  get(t, k, r) {
    return Reflect.get(t, k, r);
  },
});
const N = 300_000;
let tA = performance.now();
for (let i = 0; i < N; i += 1) {
  // eslint-disable-next-line no-unused-expressions
  plain.value;
}
let tB = performance.now();
for (let i = 0; i < N; i += 1) {
  // eslint-disable-next-line no-unused-expressions
  proxied.value;
}
let tC = performance.now();
console.log(`\n  ${N} 次属性读取：直接访问 ${(tB - tA).toFixed(2)}ms，经 Proxy ${(tC - tB).toFixed(2)}ms`);
console.log(`  慢约 ${((tC - tB) / Math.max(tB - tA, 0.001)).toFixed(1)} 倍 —— 单次开销极小，但热路径上会累积。
  所以：Proxy 适合"访问频率不高的边界"（配置、ORM 实体、组件 props），
  不适合每秒百万次的内层循环。`);

// ===========================================================================
// 6. 代价与什么时候不该用
// ===========================================================================

console.log('\n--- 6. 代理模式的代价与不适用场景 ---');

console.log(`【代价】
  1) 多一层间接：调用栈 +1，IDE "跳转到定义"常常停在代理上而不是真实实现。
  2) 手工代理容易漏方法：真实对象加了新方法，代理没同步加，
     调用方就拿到 "is not a function"。ES6 Proxy 能避免这个问题，但有性能代价。
  3) 语义漂移：代理"看起来一样"，但行为可能不同 ——
     缓存代理可能返回旧数据，保护代理可能抛错。调用方若不知道有代理，
     会出现"这个函数明明没有副作用，为什么第二次不执行了"的困惑。
     → 建议：代理对调用方**最好是透明的**，或在命名上体现（cachedFetch / lazyImage）。
  4) 调试困难：日志/断点看到的是代理帧，真实对象的行为被遮住。
     可以在代理里加一个 debug 开关，或提供 unwrap() 拿回真实对象。
  5) 生命周期复杂：虚拟代理"什么时候创建真实对象""什么时候释放"，
     缓存代理"缓存多大""何时失效"，这些都是额外的状态管理成本。
  6) 安全边界容易被绕过：只要真实对象还能被拿到，代理就形同虚设。

【什么时候不该用】
  1) 只是想加个日志/计时：那是装饰器的活（08 文件），
     而如果连装饰器都不需要（只有一处），直接写在那行代码旁边。
  2) 接口不兼容：那是适配器的活（09 文件）。代理的前提是"接口相同"。
  3) 数据量小、计算便宜：缓存代理的 Map 查找 + 序列化可能比直接算还慢。
     先测量，再优化。
  4) 需要的是"真正的数据一致性"：缓存代理会带来陈旧数据问题，
     如果业务不能容忍，就该用带失效策略的缓存层（Redis 等），而不是内存代理。
  5) 想让对象"绝对不可访问"：JS 里没有真正的访问控制，
     代理只能防"通过代理的访问"。真正的秘密应该留在服务端。
  6) 热路径上的高频属性访问：见 5.4 的性能数据，Proxy 的常数开销会累积。

判断口诀：问自己"我是在改变接口，还是在控制访问？"
  改变接口 -> 适配器；增加功能 -> 装饰器；控制访问/延迟/缓存 -> 代理。
  再问"真实对象会不会被别处直接拿到？" 会 -> 这个代理的保护作用是有限的，别指望它。`);

console.log('\n全部演示完毕。');
