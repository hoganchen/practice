/**
 * ============================================================================
 * 知识点：建造者模式 —— 分步构建复杂对象（链式调用 + build 校验）
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/03_factory.js、09_objects（对象字面量）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    建造者（Builder）把"创建复杂对象"拆成若干步：每一步只设置一个维度，
 *    每步返回 this 以支持链式调用，最后用 build() 一次性产出成品。
 *        new QueryBuilder().select('id').from('users').where('age > 18').limit(10).build()
 *    它和工厂的区别：工厂关心"造哪种"，建造者关心"怎么一步步拼出来"。
 *
 * 2. 为什么需要（真实项目场景）
 *    - SQL 查询构造器：where / orderBy / limit / offset / join 组合爆炸，
 *      用参数列表根本表达不了"可选、可重复、有顺序"的约束。
 *    - 配置对象：HTTP 客户端、打包工具（webpack/vite）、测试框架的配置项
 *      动辄几十个，且大部分是可选的。
 *    - 测试数据构造（Test Data Builder）：造一个"完整的用户对象"，
 *      测试只关心其中一两个字段，其余用默认值填充。
 *    - 分步流程：先选类型、再选配件、最后确认 —— 每一步都可能失败，
 *      建造者让校验集中在 build() 一处。
 *
 * 3. 核心语法要点
 *    - 每个 setter 方法返回 this，这是链式调用的全部秘密。
 *    - build() 里做"跨字段校验"：单个字段合法不代表组合合法
 *      （比如 limit 有值就必须有 orderBy，否则分页不稳定）。
 *    - 区分必填与可选：必填在构造函数里收（少一个就报错），
 *      可选通过链式方法给默认值。
 *    - 不可变式建造者：每个方法返回**新的**建造者对象而不是 this，
 *      适合需要并发安全/可复用的场景（代价是对象更多）。
 *    - 建造者可以内置"防重复"逻辑：同名方法调用两次时是覆盖还是累加，要明确。
 *
 * 4. 常见陷阱
 *    - 忘记 return this，链式调用在第二步就断掉（报 undefined 没有该方法）。
 *    - build() 不做校验，把非法对象交出去，错误在使用时才爆发，难定位。
 *    - 把该参数化的东西拼进 SQL 字符串 —— SQL 注入！本文件的查询构造器
 *      只是教学演示，真实项目必须用参数化查询（见第 5 节说明）。
 *    - 建造者与产品互相引用：产品里又拿着建造者，造成循环依赖与内存泄漏。
 *    - 状态泄漏：建造者被复用（第二次 build）时残留上一次的条件。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/04_builder.js
 *
 * 【预期输出】
 *   先演示"参数过多的构造函数"如何失控，再用 SQL 查询构造器演示链式构建、
 *   防注入说明与 build 校验，然后用配置对象建造者演示必填/可选的区分，
 *   最后给出建造者的代价与不适用场景。
 * ============================================================================
 */

// ===========================================================================
// 1. 问题引入：构造函数参数过多（telescoping constructor）
// ===========================================================================

console.log('--- 1. 问题引入：参数爆炸的构造函数 ---');

/**
 * 反面教材：用位置参数表达一个"HTTP 请求"的配置。
 * 调用方必须记住第几个参数是什么，且所有可选参数都得占位。
 */
class BadRequestConfig {
  constructor(method, url, timeout, retries, headers, body, followRedirect, keepAlive) {
    // 8 个参数，读到这里已经不知道谁是谁了
    Object.assign(this, { method, url, timeout, retries, headers, body, followRedirect, keepAlive });
  }
}

// 调用点：这一行是"只想要超时 5 秒"，却被迫写了 6 个 undefined
const bad = new BadRequestConfig('GET', '/api/users', 5000, undefined, undefined, undefined, undefined, undefined);
console.log('位置参数写法（可读性极差）：', { method: bad.method, url: bad.url, timeout: bad.timeout });
console.log('问题：参数顺序记错 = 静默的 bug；新增一个参数要改所有调用点；');

// 折中方案：配置对象（options bag）。它已经解决了 80% 的问题。
const good = { method: 'GET', url: '/api/users', timeout: 5000 };
console.log('配置对象写法（推荐先考虑这个）：', good);
console.log('那么何时还需要"建造者"？—— 当创建过程有"步骤约束、跨字段校验、');
console.log('或需要在构建中累积状态（比如 where 条件可以加很多次）"的时候。');

// ===========================================================================
// 2. 建造者实例 A：SQL 查询构造器（链式调用 + build 校验）
// ===========================================================================

console.log('\n--- 2. 建造者实例 A：SQL 查询构造器 ---');

/**
 * 一个极简的 SELECT 语句建造者。
 *
 * ⚠️ 重要声明：本类为了演示建造者模式，把条件**直接拼进 SQL 字符串**，
 *    这在真实项目里是**严重的安全漏洞**（SQL 注入）。
 *    正确做法是生成占位符 + 参数数组：SELECT * FROM t WHERE id = ?，params = [id]。
 *    本文件第 5 节演示了带参数化支持的写法。
 */
class QueryBuilder {
  // 用 # 私有字段，防止外部绕过校验直接改内部状态
  #table = null;
  #columns = ['*'];
  #conditions = []; // 支持多次 where，累积成 AND 列表
  #orderBy = null;
  #limitValue = null;
  #offsetValue = null;

  /** 必填参数放构造函数：不给就立刻报错，而不是等到 build */
  constructor(table) {
    if (!table || typeof table !== 'string') {
      throw new TypeError('必须指定表名');
    }
    this.#table = table;
  }

  /** 选列。不写则默认 *。多次调用则覆盖（语义明确：最后一次生效） */
  select(...cols) {
    if (cols.length > 0) this.#columns = cols.flat();
    return this; // ← 返回 this 是链式调用的全部秘密
  }

  /**
   * 加一个 WHERE 条件。
   * 注意这里是**累加**而不是覆盖 —— 因为"多加一个条件"是自然的语义。
   * 同一个方法名是覆盖还是累加，必须在文档里说清楚（这是设计决策）。
   */
  where(condition) {
    if (typeof condition !== 'string' || condition.trim() === '') {
      throw new TypeError('where 条件必须是非空字符串');
    }
    this.#conditions.push(condition);
    return this;
  }

  orderBy(column, direction = 'ASC') {
    const dir = direction.toUpperCase();
    if (dir !== 'ASC' && dir !== 'DESC') {
      throw new RangeError(`排序方向只能是 ASC 或 DESC，收到 ${direction}`);
    }
    this.#orderBy = `${column} ${dir}`;
    return this;
  }

  limit(n) {
    if (!Number.isInteger(n) || n <= 0) {
      throw new RangeError('limit 必须是正整数');
    }
    this.#limitValue = n;
    return this;
  }

  offset(n) {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError('offset 必须是非负整数');
    }
    this.#offsetValue = n;
    return this;
  }

  /** 让建造者可以被复用：清空所有可选状态，保留必填的表名 */
  reset() {
    this.#columns = ['*'];
    this.#conditions = [];
    this.#orderBy = null;
    this.#limitValue = null;
    this.#offsetValue = null;
    return this;
  }

  /** 只读快照，方便在 build 前后检查状态（不暴露内部引用） */
  get state() {
    return {
      table: this.#table,
      columns: [...this.#columns],
      conditions: [...this.#conditions],
      orderBy: this.#orderBy,
      limit: this.#limitValue,
      offset: this.#offsetValue,
    };
  }

  /**
   * build()：一次性做跨字段校验并产出成品。
   * 校验集中在这里的好处是 —— 使用方只要有一步不合法，
   * 都能在"产出前"拿到语义清晰的错误，而不是拼出一句语法错误的 SQL。
   */
  build() {
    const errors = [];

    // 跨字段规则 1：offset 必须伴随 limit（否则 SQL 里 OFFSET 无意义）
    if (this.#offsetValue !== null && this.#limitValue === null) {
      errors.push('使用 offset 时必须同时指定 limit');
    }
    // 跨字段规则 2：分页（limit）应当配合 orderBy，否则顺序不稳定
    if (this.#limitValue !== null && this.#orderBy === null) {
      errors.push('使用 limit 分页时建议指定 orderBy，以保证结果顺序稳定');
    }

    // 这里把"建议"当成错误演示一次；真实项目可以改成分级（error / warn）
    if (errors.length > 0) {
      throw new Error(`查询构建失败：\n    - ${errors.join('\n    - ')}`);
    }

    // ---- 拼装 ----
    let sql = `SELECT ${this.#columns.join(', ')} FROM ${this.#table}`;
    if (this.#conditions.length > 0) {
      sql += ` WHERE ${this.#conditions.join(' AND ')}`;
    }
    if (this.#orderBy) sql += ` ORDER BY ${this.#orderBy}`;
    if (this.#limitValue !== null) sql += ` LIMIT ${this.#limitValue}`;
    if (this.#offsetValue !== null) sql += ` OFFSET ${this.#offsetValue}`;
    return sql;
  }

  toString() {
    return this.build();
  }
}

// 链式构建：读起来几乎就是 SQL 本身
const sql1 = new QueryBuilder('users')
  .select('id', 'name', 'email')
  .where('age > 18')
  .where("status = 'active'")
  .orderBy('created_at', 'desc')
  .limit(10)
  .offset(20)
  .build();
console.log('构建结果：\n  ' + sql1);

// 最简形式：只有必填项
console.log('最简：', new QueryBuilder('logs').build());

// 同一个建造者复用（reset 之后）：验证状态没有残留
const reusable = new QueryBuilder('orders').select('id').where('paid = 1');
console.log('第一次：', reusable.build());
console.log('reset 后：', reusable.reset().build(), '（之前 select/where 的痕迹已清除）');

// build 校验失败：在 try/catch 里演示
try {
  new QueryBuilder('users').limit(10).build(); // 有 limit 没 orderBy
} catch (err) {
  console.log('build 校验拦截：\n  ' + err.message.split('\n').join('\n  '));
}
try {
  new QueryBuilder('users').select('id').offset(5).build(); // 有 offset 没 limit
} catch (err) {
  console.log('build 校验拦截：\n  ' + err.message.split('\n').join('\n  '));
}
try {
  new QueryBuilder(''); // 必填项缺失，构造函数直接拦下
} catch (err) {
  console.log('构造期校验拦截：', err.name, '-', err.message);
}
try {
  new QueryBuilder('users').orderBy('id', 'sideways');
} catch (err) {
  console.log('单字段校验拦截：', err.name, '-', err.message);
}

// ===========================================================================
// 3. 建造者实例 B：配置对象构建
// ===========================================================================

console.log('\n--- 3. 建造者实例 B：配置对象构建 ---');

/**
 * 用建造者造一个"HTTP 客户端配置"。
 * 分工：
 *   - 构造函数收必填项（baseURL）；
 *   - 链式方法给可选项设默认值或覆盖；
 *   - build() 做校验并冻结成不可变对象（冻结后配置不会被运行时改坏）。
 */
class HttpClientConfigBuilder {
  #baseURL;
  #timeoutMs = 3000; // 默认值写在字段初始值里，一眼可见
  #retries = 0;
  #headers = { 'Content-Type': 'application/json' };
  #interceptors = []; // 可累加
  #logLevel = 'warn';
  // 只在调用 retry() 时才会被赋值：不写初始值的私有字段初值为 undefined，
  // build() 里正是用这一点来判断"用户到底有没有提供退避策略"。
  #backoffMs;

  constructor(baseURL) {
    this.#baseURL = baseURL;
  }

  timeout(ms) {
    if (!Number.isInteger(ms) || ms <= 0) throw new RangeError('timeout 必须是正整数毫秒');
    this.#timeoutMs = ms;
    return this;
  }

  retry(times, { backoffMs = 100 } = {}) {
    if (!Number.isInteger(times) || times < 0) throw new RangeError('重试次数必须是非负整数');
    this.#retries = times;
    this.#backoffMs = backoffMs; // 只在 retry 时才有意义的附带配置
    return this;
  }

  /** 合并请求头：同名覆盖，不同名累加 —— 这是"覆盖 vs 累加"的另一种设计选择 */
  header(name, value) {
    this.#headers[name] = value;
    return this;
  }

  /** 拦截器是"可多次添加"的典型：用数组累加，顺序即执行顺序 */
  use(interceptor) {
    if (typeof interceptor !== 'function') throw new TypeError('拦截器必须是函数');
    this.#interceptors.push(interceptor);
    return this;
  }

  logLevel(level) {
    const allowed = ['silent', 'error', 'warn', 'info', 'debug'];
    if (!allowed.includes(level)) throw new RangeError(`logLevel 必须是 ${allowed.join(' / ')} 之一`);
    this.#logLevel = level;
    return this;
  }

  build() {
    // 校验：URL 必须像样，否则后面所有请求都会失败
    if (!/^https?:\/\//.test(this.#baseURL)) {
      throw new Error(`baseURL 必须以 http:// 或 https:// 开头，收到：${this.#baseURL}`);
    }
    // 跨字段校验：配置了重试就必须给出退避策略，否则会疯狂重试打爆服务端
    if (this.#retries > 0 && this.#backoffMs === undefined) {
      throw new Error('配置重试时必须提供 backoffMs');
    }

    // 产出不可变对象：防止使用方在运行时偷偷改配置，导致行为不一致
    return Object.freeze({
      baseURL: this.#baseURL,
      timeoutMs: this.#timeoutMs,
      retries: this.#retries,
      backoffMs: this.#backoffMs ?? null,
      headers: Object.freeze({ ...this.#headers }),
      interceptors: Object.freeze([...this.#interceptors]),
      logLevel: this.#logLevel,
    });
  }
}

const clientConfig = new HttpClientConfigBuilder('https://api.example.com/v1')
  .timeout(8000)
  .retry(3, { backoffMs: 200 })
  .header('X-App-Version', '1.2.3')
  .use((req) => ({ ...req, traced: true })) // 拦截器 1
  .use((req) => ({ ...req, timestamp: 0 })) // 拦截器 2
  .logLevel('debug')
  .build();

console.log('构建出的配置：');
console.log('  baseURL      :', clientConfig.baseURL);
console.log('  timeoutMs    :', clientConfig.timeoutMs);
console.log('  retries      :', clientConfig.retries, '/ backoffMs:', clientConfig.backoffMs);
console.log('  headers      :', clientConfig.headers);
console.log('  interceptors :', clientConfig.interceptors.length, '个，顺序即执行顺序');
console.log('  logLevel     :', clientConfig.logLevel);

// 不可变验证：修改会静默失败（严格模式下抛 TypeError，这里用 try/catch 演示）
try {
  // 注意：ESM 顶层是严格模式，对冻结对象赋值会抛 TypeError
  clientConfig.timeoutMs = 1;
} catch (err) {
  console.log('冻结的配置不可被运行时篡改：', err.name, '-', err.message);
}
console.log('再次读取 timeoutMs，仍是：', clientConfig.timeoutMs);

// build 校验失败演示
try {
  new HttpClientConfigBuilder('ftp://files.example.com').build();
} catch (err) {
  console.log('URL 校验拦截：', err.message);
}

// ===========================================================================
// 4. 可选参数 vs 必填参数：三种处理策略
// ===========================================================================

console.log('\n--- 4. 必填 / 可选参数的处理策略 ---');

console.log(`【策略 1】必填放构造函数，可选放链式方法 —— 最常用。
    优点：类型/参数错误在"离调用点最近"的地方爆炸；
    缺点：必填项多了以后构造函数又会变长（但通常会稳定在 1~3 个）。

【策略 2】全部可选，build() 时统一校验。
    优点：build 里能把所有错误一次性收集起来返回（本文件的 QueryBuilder 就是这种）；
    缺点：错误发现得晚，调用链长了以后定位成本高。

【策略 3】默认值兜底 + 只在必要时覆盖。
    优点：调用方最省事，代码最短；
    缺点：默认值一旦不合理，会静默产生错误行为（比如 timeout 默认 3 秒太短）。
    任何默认值都应当在文档里写明，并且允许被显式覆盖。`);

// ===========================================================================
// 5. 安全性补充：真实项目请用参数化查询
// ===========================================================================

console.log('\n--- 5. 安全性补充：参数化查询 ---');

/**
 * 上面 QueryBuilder 直接拼接字符串，若把用户输入拼进去就是 SQL 注入。
 * 真实做法：SQL 里放占位符，值单独放进参数数组交给驱动。
 */
class SafeQueryBuilder {
  #table;
  #conditions = [];
  #params = []; // 参数与占位符一一对应

  constructor(table) {
    this.#table = table;
  }

  whereEq(column, value) {
    // 列名是"标识符"，不能参数化，所以要白名单校验（只允许字母数字下划线）
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(column)) {
      throw new Error(`非法列名：${column}`);
    }
    // 值一律走占位符
    this.#conditions.push(`${column} = ?`);
    this.#params.push(value);
    return this;
  }

  build() {
    const sql = `SELECT * FROM ${this.#table}${this.#conditions.length ? ` WHERE ${this.#conditions.join(' AND ')}` : ''}`;
    return { sql, params: [...this.#params] };
  }
}

const malicious = "1 OR 1=1; DROP TABLE users; --";
const safe = new SafeQueryBuilder('users').whereEq('name', malicious).build();
console.log('恶意输入：', malicious);
console.log('生成的 SQL（值不在其中）：', safe.sql);
console.log('参数数组（驱动会做转义）：', safe.params);
console.log('结论：恶意串只是"一个普通的参数值"，无法改变 SQL 结构。');

// ===========================================================================
// 6. 建造者的代价与不适用场景
// ===========================================================================

console.log('\n--- 6. 建造者的代价与什么时候不该用 ---');

console.log(`【代价】
  1) 比字面量啰嗦：{ url: '/api' } 一行搞定的事，建造者要写 5 行。
     简单配置用对象字面量 + 默认值（或解构默认参数）就够了。
  2) 多一个类 + 一套状态：建造者本身是有状态的，用完不 reset 会串味，
     在多次构建之间共享一个建造者实例是常见 bug 来源。
  3) 链式调用破坏调试体验：断点打在链中间时，各步的中间状态不容易观察
     （所以本文件提供了 state 快照的 getter）。
  4) 与"不可变"的权衡：返回 this 是可变建造者，链式过程共享一个对象；
     若要并发安全需要每步返回新对象，代价是对象数量线性增长。

【什么时候不该用】
  1) 对象只有 2~3 个字段：直接对象字面量，别上建造者。
  2) 没有"跨字段校验"和"多步累加"需求：配置对象 + 默认值已经足够。
  3) 参数之间没有顺序/依赖关系：可以用"选项对象 + 解构默认值"：
       function create({ a = 1, b = 2 } = {}) { ... }
     这是 90% 场景下的最优解，比建造者短得多。
  4) 只需要一次构建且调用点唯一：写死字面量最清楚。

判断口诀：如果 build() 里没有任何校验、也没有任何字段是"累加"的，
  那就不需要建造者，用选项对象。`);

console.log('\n全部演示完毕。');
