/**
 * ============================================================================
 * 知识点：结构型模式补充 —— 外观 Facade、组合 Composite、享元 Flyweight
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/02_singleton.js、09_adapter.js、
 *             14_classes/07_inheritance_extends.js、23_collections（Map 与内存意识）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    结构型模式解决的是"**对象之间怎么组合**"，本文件补齐 GoF 中此前没讲的三个：
 *      - 外观 Facade：为一组复杂子系统提供一个**统一的简单入口**。
 *        关键词是"简化调用方"：调用方不再需要知道子系统的顺序、名字与依赖关系。
 *      - 组合 Composite：把对象组织成**树**，让"单个对象"和"一组对象"被同样对待。
 *        关键词是"部分-整体一致"：客户端不需要写 `if (是文件夹) ... else ...`。
 *      - 享元 Flyweight：**共享**大量细粒度对象中"相同的部分"，以降低内存占用。
 *        关键词是"内外状态分离"：内在状态（共享、不可变）放在享元里，
 *        外在状态（每个实例不同）由使用方自己保存并传入。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 外观：启动一个应用要按顺序初始化配置/日志/连接池/缓存/HTTP 服务；
 *      前端里"一次提交表单要调 5 个接口"；SDK 把 20 个底层调用包成 3 个方法。
 *    - 组合：文件系统、组织架构（部门-员工）、UI 组件树、富文本节点树、
 *      **DOM 与虚拟 DOM 的底层思想就是它**（Element 与 Text 都是 Node，
 *      都能 append 到父节点上、都能被统一遍历）。
 *    - 享元：文本编辑器里 20 万个字符共享 5 个样式对象；
 *      地图上 1 万个图标共享 20 张图片资源；游戏里成千上万的子弹/树木；
 *      字符串常量池、Java 的 Integer 缓存也是同一思想。
 *
 * 3. 核心语法要点
 *    - 外观：把"顺序 + 名字映射 + 失败回滚"集中到一个方法里。
 *      外观**不新增功能**，它只是重新组织调用；子系统仍然可以被直接使用。
 *    - 组合：叶子与容器实现**同一套接口**（同样的属性名与方法名），
 *      容器额外提供 add/remove。关键技巧是让叶子也实现"遍历/子节点"相关接口
 *      （如 children 返回空数组），这样递归代码里一个类型判断都不需要。
 *    - 享元：需要一个"池"（Map/对象）做 intern（驻留）：
 *         key = 由内在状态算出的字符串 -> 已存在的共享对象
 *      共享对象必须**不可变**（Object.freeze），否则一处修改会污染所有使用者。
 *    - 享元的"外在状态"通常存成**小整数 id** 而不是对象引用，进一步省内存
 *      （更进一步的极端做法是存成 TypedArray，见 24_typed_arrays）。
 *    - 三者可以叠加：外观里聚合组合树、组合树的节点共享享元样式，都是常见组合。
 *
 * 4. 常见陷阱
 *    - 外观变成上帝对象：把业务逻辑也塞进门面，门面就成了第二个"什么都管"的类。
 *      外观应当只做"编排"，不承载业务规则；子系统数量增长到 20 个时要考虑拆成多个门面。
 *    - 外观掩盖了必要的灵活性：调用方想只启动其中两步时，门面必须提供细粒度入口。
 *    - 组合的父引用：为了"向上查找"存 parent 会让树变成双向图，
 *      `JSON.stringify` 直接抛 TypeError（循环引用），克隆/序列化都要额外处理。
 *    - 组合让类型约束变弱：统一接口意味着"往文件夹里塞一个流对象"编译期查不出来，
 *      需要运行时的 add() 校验。
 *    - 组合的递归深度：超深的树会栈溢出，要考虑显式栈的迭代写法。
 *    - 享元的共享对象被意外修改：必须冻结；
 *      一旦共享对象含可变字段，"共享"就会变成"串味"。
 *    - 键的计算成本超过收益：如果算 key 比新建对象还贵，享元就是负优化。
 *    - 把享元当缓存用：享元省的是**内存**（共享同一对象），
 *      缓存省的是**时间**（避免重复计算），两者目标不同，别混为一谈。
 *    - 对象不多时用享元：少于几千个对象，池的维护成本大于收益，纯属增加复杂度。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/16_structural_patterns.js
 *
 * 【预期输出】
 *   第 1 部分：演示"手动按顺序启动 6 个子系统"的坏味道，再用外观重构，
 *             并验证启动失败时的逆序回滚；
 *   第 2 部分：用文件系统树演示组合模式（统一递归、树形打印、统一查询、
 *             循环引用陷阱），并说明 DOM / 虚拟 DOM 与它的关系；
 *   第 3 部分：用文本编辑器的字符样式演示享元（对象数与堆内存对比、
 *             改样式的 O(N) vs O(1)），并讲清共享对象的不可变性前提。
 * ============================================================================
 */

// ===========================================================================
// 0. 工具
// ===========================================================================

function displayWidth(s) {
  return [...String(s)].reduce(
    (w, ch) => w + (/[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(ch) ? 2 : 1),
    0,
  );
}

function printTable(rows) {
  const cols = rows[0].length;
  const widths = Array.from({ length: cols }, (_, i) => Math.max(...rows.map((r) => displayWidth(r[i]))));
  const pad = (s, w) => String(s) + ' '.repeat(Math.max(0, w - displayWidth(s)) + 2);
  let sepWidth = 0;
  for (const [idx, row] of rows.entries()) {
    const line = row.map((c, i) => pad(c, widths[i])).join('');
    console.log('  ' + line);
    sepWidth = Math.max(sepWidth, displayWidth(line));
    if (idx === 0) console.log('  ' + '-'.repeat(sepWidth));
  }
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// ===========================================================================
// 第一部分：外观模式 Facade —— 把复杂子系统包装成一个简单接口
// ===========================================================================

console.log('=== 第一部分：外观模式 Facade ===\n');
console.log('--- 1.1 坏味道：调用方必须知道"先启动谁、后启动谁" ---');

// ---- 六个子系统：注意它们的方法名各不相同，这是真实世界的样子 ----
class ConfigLoader {
  load() {
    this.loaded = true;
    return { port: 8080, dbUrl: 'postgres://localhost/app' };
  }
  dispose() {
    this.loaded = false;
  }
}
class LoggerSetup {
  setup() {
    this.ready = true;
  }
  teardown() {
    this.ready = false;
  }
}
class DatabasePool {
  connect(url) {
    if (!url) throw new Error('缺少数据库连接串');
    this.url = url;
    this.connected = true;
  }
  drain() {
    this.connected = false;
  }
}
class CacheWarmer {
  warm() {
    this.warmed = true;
    return { keys: 128 };
  }
  clear() {
    this.warmed = false;
  }
}
class HttpServer {
  constructor({ failToBind = false } = {}) {
    this.failToBind = failToBind;
  }
  listen(port) {
    if (this.failToBind) throw new Error(`端口 ${port} 已被占用`);
    this.port = port;
    this.listening = true;
  }
  shutdown() {
    this.listening = false;
  }
}
class MetricsRegistry {
  register() {
    this.registered = true;
  }
  flush() {
    this.registered = false;
  }
}

/** 朴素版：调用方（这里是 main 函数）自己编排全部子系统 */
function naiveBootstrap({ log }) {
  const config = new ConfigLoader();
  const logger = new LoggerSetup();
  const db = new DatabasePool();
  const cache = new CacheWarmer();
  const http = new HttpServer();
  const metrics = new MetricsRegistry();

  // ✗ 这 6 行顺序、参数、依赖关系全部由调用方负责，而且每个服务都要重写一遍
  const cfg = config.load();
  logger.setup();
  log('  日志就绪');
  db.connect(cfg.dbUrl);
  log('  数据库已连接');
  cache.warm();
  log('  缓存已预热');
  metrics.register();
  log('  指标已注册');
  http.listen(cfg.port);
  log(`  HTTP 服务监听 ${cfg.port}`);
  return { config, logger, db, cache, http, metrics };
}

const naiveApp = naiveBootstrap({ log: console.log });
console.log(`  朴素版启动完成，但注意：

    ✗ 6 个子系统的启动顺序写死在调用方，第二处启动（比如测试、CLI 工具、
      第二个入口文件）必须再抄一遍；
    ✗ 子系统方法名五花八门（load/setup/connect/warm/register/listen），
      调用方要记住 6 套命名；
    ✗ 如果 http.listen 抛错（端口占用），前面 5 个已经启动的子系统
      **不会有人去关闭** —— 连接泄漏、端口占着不放，进程还退不出去；
    ✗ 想做"启动耗时打点""灰度开关"这类横切逻辑，只能到处插代码。`);

console.log('\n--- 1.2 外观重构：一个 start() 包住全部编排 ---');

/**
 * 应用启动门面。
 * 它做三件事，且只做这三件事：
 *   ① 把"子系统的方法名"翻译成统一的 up/down；
 *   ② 固化启动顺序（关闭时自动逆序）；
 *   ③ 失败时回滚已启动的部分。
 * 它**不包含任何业务逻辑** —— 这是外观与"上帝对象"的分界线。
 */
class ApplicationFacade {
  constructor({ log = console.log, failToBind = false } = {}) {
    this.log = log;
    // 子系统实例由门面持有，但外部仍可通过 app.subsystems.xxx 直接访问
    this.subsystems = {
      config: new ConfigLoader(),
      logger: new LoggerSetup(),
      db: new DatabasePool(),
      cache: new CacheWarmer(),
      http: new HttpServer({ failToBind }),
      metrics: new MetricsRegistry(),
    };

    // ★外观的核心价值：把异构的方法名与依赖关系集中描述成一张"启动清单"
    // 启动顺序 = 数组顺序；关闭时自动逆序。
    // ctx 是一个在步骤之间传递数据的"启动上下文"（配置等产物写在里面）。
    this.steps = [
      { name: '配置加载', up: (s, ctx) => { ctx.config = s.config.load(); }, down: (s) => s.config.dispose() },
      { name: '日志初始化', up: (s) => s.logger.setup(), down: (s) => s.logger.teardown() },
      {
        name: '数据库连接池',
        up: (s, ctx) => s.db.connect(ctx.config.dbUrl),
        down: (s) => s.db.drain(),
      },
      { name: '缓存预热', up: (s) => s.cache.warm(), down: (s) => s.cache.clear() },
      { name: '指标注册', up: (s) => s.metrics.register(), down: (s) => s.metrics.flush() },
      {
        // HTTP 放最后：它一旦开始监听，就应该"最后启动、最先关闭"
        name: 'HTTP 服务',
        up: (s, ctx) => s.http.listen(ctx.config.port),
        down: (s) => s.http.shutdown(),
      },
    ];
    this.started = [];
  }

  /** 一键启动：调用方不需要知道有 6 个子系统 */
  start() {
    const t0 = Date.now();
    this.started = [];
    const ctx = {}; // 启动上下文：步骤之间的数据传递
    try {
      for (const step of this.steps) {
        step.up(this.subsystems, ctx);
        this.started.push(step);
        this.log(`    ✓ ${step.name} 启动完成`);
      }
      this.log(`  应用启动完成，耗时 ${Date.now() - t0}ms（共 ${this.started.length} 个子系统）`);
      return { ok: true, started: this.started.map((s) => s.name) };
    } catch (err) {
      // ★回滚：已启动的**逆序**关闭，这是外观模式最实在的收益之一
      this.log(`    ✗ ${err.message} -> 开始回滚已启动的子系统`);
      for (const step of [...this.started].reverse()) {
        step.down(this.subsystems);
        this.log(`      ↺ ${step.name} 已回滚`);
      }
      return { ok: false, error: err, rolledBack: this.started.length };
    }
  }

  /** 一键停止：逆序关闭，保证依赖方先走 */
  stop() {
    for (const step of [...this.steps].reverse()) {
      step.down(this.subsystems);
      this.log(`    ↓ ${step.name} 已关闭`);
    }
  }

  /** 细粒度入口：外观不阻止你精确控制（否则它就变成了"挡路的包装"） */
  onlyCacheWarm() {
    return this.subsystems.cache.warm();
  }
}

console.log('  启动成功的情况：');
const facade = new ApplicationFacade();
facade.start();

console.log('\n  启动失败的情况（端口被占用）：');
const failingFacade = new ApplicationFacade({ failToBind: true });
const failed = failingFacade.start();
console.log(`  结果：ok=${failed.ok}，回滚了 ${failed.rolledBack} 个子系统`);
console.log(`  验证回滚效果：db.connected=${failingFacade.subsystems.db.connected}，` +
  `cache.warmed=${failingFacade.subsystems.cache.warmed}，` +
  `metrics.registered=${failingFacade.subsystems.metrics.registered}`);
console.log(`  端口 8080 是否仍被占用：${Boolean(failingFacade.subsystems.http.listening)}`);

console.log('\n--- 1.3 外观的代价与什么时候不该用 ---');
console.log(`【收益】
  1) 调用方只需记住 1 个方法（start），而不是 6 个方法名 + 1 套顺序；
  2) 顺序与回滚只写一次，所有入口（Web/CLI/测试）共用，不会漂移；
  3) 子系统可以自由重构（改方法名、拆类），只要门面同步即可，调用方不受影响；
  4) 天然的横切逻辑挂载点：在门面里加耗时打点、开关、审计最省事。

【代价】
  1) 多一层间接：出问题时要多跳一次才能找到真正的子系统；
  2) 门面容易膨胀成上帝对象（第 21 号文件会讲分层，门面只该负责"编排"这一层职责）；
  3) 门面与子系统的耦合集中在一处，子系统改动时门面**必须**跟着改（这是耦合的代价换来了调用方的解耦）；
  4) 掩盖灵活性：如果调用方经常需要"只启动其中两步"，门面就会退化成 6 个薄封装，得不偿失。

【什么时候不该用】
  1) 子系统只有一个、或调用点只有一个：直接调，别包；
  2) 调用方本来就需要精细控制每一步的参数与顺序（框架内核、构建工具）：
     门面会挡路，此时应提供"细粒度 API + 可选的一键 API"两套；
  3) 门面里的逻辑开始包含"业务判断"（比如"生产环境不启动缓存"）：
     那是配置/策略的职责，应该注入进来，而不是写死在门面里。

【与适配器 / 中介者的区别】
  外观 vs 适配器：适配器改变**接口形状**（对方接口我改不了）；
                  外观**简化**多个接口（我方主动提供便利入口）。
  外观 vs 中介者：外观是"调用方 -> 子系统"的单向简化（调用方不知道子系统内部）；
                  中介者是"子系统 <-> 子系统"的多对多收敛（见 17 号文件）。`);

// ===========================================================================
// 第二部分：组合模式 Composite —— 树形结构的统一处理
// ===========================================================================

console.log('\n\n=== 第二部分：组合模式 Composite ===\n');
console.log('--- 2.1 文件系统：让"文件"和"文件夹"长得一样 ---');

/**
 * 节点基类。关键设计：
 *   ① 叶子与容器共用同一套属性/方法名（name / size / children / isDirectory）；
 *   ② 叶子也提供 children（返回空数组）—— 这样递归函数里**一个类型判断都不需要**；
 *   ③ size 在叶子上是数据、在容器上是"子节点之和"，但对使用者完全同构。
 */
class FsNode {
  constructor(name) {
    this.name = name;
    this.parent = null; // 便于向上查找；代价见 2.4 的循环引用陷阱
  }
  get isDirectory() {
    return false;
  }
  /** 叶子没有子节点，返回空数组让递归代码不必判断类型 */
  get children() {
    return [];
  }
  get size() {
    throw new Error(`${this.constructor.name} 必须实现 size`);
  }
  get path() {
    return this.parent ? `${this.parent.path}/${this.name}` : this.name;
  }
}

/** 叶子：文件 */
class FsFile extends FsNode {
  #size;
  constructor(name, size, kind = 'text') {
    super(name);
    this.#size = size;
    this.kind = kind; // 扩展名分类：text/image/video...
  }
  get size() {
    return this.#size;
  }
}

/** 容器：文件夹 */
class FsDirectory extends FsNode {
  #children = [];
  constructor(name) {
    super(name);
  }
  get isDirectory() {
    return true;
  }
  get children() {
    return [...this.#children];
  }
  /** 容器的 size = 所有子节点 size 之和（递归，但写法与叶子一致） */
  get size() {
    return this.#children.reduce((sum, child) => sum + child.size, 0);
  }
  add(...nodes) {
    for (const node of nodes) {
      // 组合模式的代价之一：类型约束变弱，需要在运行时自己守门
      if (!(node instanceof FsNode)) throw new TypeError('只能把 FsNode 加进目录');
      node.parent = this;
      this.#children.push(node);
    }
    return this;
  }
  remove(node) {
    const i = this.#children.indexOf(node);
    if (i === -1) return false;
    this.#children.splice(i, 1);
    node.parent = null;
    return true;
  }
}

// ---- 搭一棵真实的项目目录树 ----
const root = new FsDirectory('my-app');
const src = new FsDirectory('src');
const components = new FsDirectory('components');
components.add(
  new FsFile('Button.jsx', 4_200, 'text'),
  new FsFile('Modal.jsx', 6_800, 'text'),
  new FsFile('logo.svg', 12_000, 'image'),
);
src.add(new FsFile('index.js', 1_500, 'text'), new FsFile('app.js', 9_400, 'text'), components);
const assets = new FsDirectory('assets');
assets.add(new FsFile('hero.png', 480_000, 'image'), new FsFile('demo.mp4', 5_600_000, 'video'));
root.add(
  new FsFile('package.json', 1_100, 'text'),
  new FsFile('README.md', 3_300, 'text'),
  src,
  assets,
  new FsDirectory('empty-cache'), // 空目录也是合法的容器
);

console.log('  目录树已建立（下面用同一段递归代码处理文件与文件夹）：');

/** 统一递归：打印树。注意函数体里**没有任何 instanceof / isDirectory 分支决定是否递归** */
function printTree(node, prefix = null, isLast = true) {
  const isRoot = prefix === null;
  const connector = isRoot ? '' : isLast ? '└── ' : '├── ';
  const suffix = node.isDirectory ? '/' : `  (${node.size} B, ${node.kind})`;
  console.log(`    ${isRoot ? '' : prefix}${connector}${node.name}${suffix}`);
  // 关键：叶子与容器都走这一行 —— 叶子的 children 是空数组，循环自然不执行
  const childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
  node.children.forEach((child, i) => printTree(child, childPrefix, i === node.children.length - 1));
}
printTree(root);

console.log(`\n  整棵树总大小：${root.size} B（= 所有叶子 size 之和，容器自己不占空间）`);
console.log(`  单个文件的总大小：${root.children[0].size} B（同一行代码 node.size，叶子容器通用）`);

/** 统一递归：按条件查找，返回所有匹配的节点 —— 一段代码同时适用于文件和目录 */
function findAll(node, predicate, out = []) {
  if (predicate(node)) out.push(node);
  for (const child of node.children) findAll(child, predicate, out);
  return out;
}

const bigFiles = findAll(root, (n) => !n.isDirectory && n.size > 10_000);
const images = findAll(root, (n) => !n.isDirectory && n.kind === 'image');
const dirs = findAll(root, (n) => n.isDirectory);
console.log('\n  统一查询（同一段 findAll 代码）：');
console.log(`    大于 10KB 的文件：${bigFiles.map((f) => `${f.name}(${f.size}B)`).join('、')}`);
console.log(`    所有图片：${images.map((f) => f.path).join('、')}`);
console.log(`    所有目录（含空目录）：${dirs.map((d) => `${d.path}[${d.children.length}]`).join('、')}`);

/** 统一递归：统计 —— 展示"容器与叶子被同样对待"的另一个例子 */
function summarize(node) {
  if (!node.isDirectory) return { files: 1, dirs: 0, bytes: node.size, byKind: { [node.kind]: 1 } };
  const acc = { files: 0, dirs: 1, bytes: 0, byKind: {} };
  for (const child of node.children) {
    const sub = summarize(child);
    acc.files += sub.files;
    acc.dirs += sub.dirs;
    acc.bytes += sub.bytes;
    for (const [k, v] of Object.entries(sub.byKind)) acc.byKind[k] = (acc.byKind[k] ?? 0) + v;
  }
  return acc;
}
const summary = summarize(root);
console.log(`\n  统一统计：${summary.files} 个文件、${summary.dirs} 个目录、共 ${mb(summary.bytes)}`);
console.log(`  按类型：${Object.entries(summary.byKind).map(([k, v]) => `${k}=${v}`).join(', ')}`);
console.log(`  验证等价性：summarize(root).bytes === root.size -> ${summary.bytes === root.size}（两种写法必然一致）`);

console.log('\n--- 2.2 组合模式与 DOM / 虚拟 DOM 的关系 ---');

console.log(`  浏览器 DOM 的接口定义（简化）：
      Node（基类）             <- 所有节点都能 appendChild / childNodes / textContent
        ├── Text              <- 叶子：只有文本，childNodes 为空
        └── Element           <- 容器：还可以再挂任意 Node
              ├── HTMLDivElement
              └── HTMLSpanElement

    "组合模式"体现在三点，全部能在 DOM 里对上号：
      ① 统一的接口：element.appendChild(textNode) 与 element.appendChild(div) 是同一个方法；
      ② 统一的遍历：document.querySelectorAll('*') 把整棵树当成"一组节点"处理，
         不需要先问"这是元素还是文本"（Text 节点也在 childNodes 里）；
      ③ 递归的结构：任何一个节点都可以被当成"一棵子树"来处理
         （element.cloneNode(true) 就是递归复制）。

    虚拟 DOM（React / Vue）把同一套结构搬到了普通对象上：
      React.createElement('div', null, [ createElement('span', null, 'hi'), 'text' ])
        -> { type:'div', props:{}, children:[ {type:'span',...}, 'text' ] }
    这样"树"就是纯数据：可以 diff、可以序列化（SSR）、可以缓存、可以跑在非浏览器环境。
    React 的 diff 算法（同层比较、key 复用）之所以能工作，前提正是
    这棵树满足组合模式：**同一层的节点是异构的（元素/文本/组件），
    但都遵循同一套 children 约定**。`);

console.log('\n--- 2.3 陷阱：父引用、序列化与"悄悄断掉的树" ---');

const readme = root.children[1]; // 一个真实的子节点：它有 parent 指向 root
console.log(`  陷阱甲：序列化整棵树会安静地失败（最危险的失败方式）
    JSON.stringify(root) = ${JSON.stringify(root)}
    → 只得到 {"name":"my-app","parent":null} —— 因为 #children 是私有字段，
      JSON.stringify **看不见它，也不会报错**，只是把整棵树丢掉了。
      同类陷阱：把树发给后端接口、写进 localStorage、打日志时，
      如果 children 存在私有字段/Map 里，你会得到一份"看起来正常但内容为空"的数据。
      解法：序列化前用 toJSON() 显式导出结构（这里不展开，重点是知道有这回事）。`);

console.log(`  陷阱乙：把 parent 和 children 都放在**可枚举字段**上（很多人的写法），
    树立刻变成双向图，JSON.stringify 直接抛错：`);
class CyclicNode {
  constructor(name) {
    this.name = name;
    this.children = [];
    this.parent = null;
  }
  add(child) {
    child.parent = this;
    this.children.push(child);
    return this;
  }
}
const cyclicRoot = new CyclicNode('root');
cyclicRoot.add(new CyclicNode('child'));
try {
  JSON.stringify(cyclicRoot);
} catch (err) {
  console.log(`      ✗ ${err.name}: ${err.message}`);
  console.log(`      原因：child.parent === parent，而 parent.children 里又有 child，形成环。`);
}
console.log(`    三种解法：
      ① 序列化时用自定义 replacer 跳过 parent 字段；
      ② 把 parent 定义成**不可枚举**属性（Object.defineProperty enumerable:false）；
      ③ 干脆不存 parent，需要向上查找时改为"遍历时把父路径作为参数传下去"。`);
const safeJson = JSON.stringify(cyclicRoot, (key, value) => (key === 'parent' ? undefined : value));
console.log(`    解法①验证：${safeJson}`);
Object.defineProperty(cyclicRoot.children[0], 'parent', { enumerable: false, value: cyclicRoot, configurable: true });
console.log(`    解法②验证：Object.keys(child) = ${JSON.stringify(Object.keys(cyclicRoot.children[0]))}，` +
  `但 child.parent 依然可用：${cyclicRoot.children[0].parent.name}（向上查找能力没有丢）`);

console.log(`  补充：需要深拷贝时，structuredClone 是**支持循环引用**的（JSON 不支持）。
    用一个"parent 仍可枚举"的小对象验证（上面的 child.parent 已被改成不可枚举，
    而 structuredClone 只复制可枚举属性）：`);
const cyc = { name: 'root', children: [] };
cyc.children.push({ name: 'child', parent: cyc });
const cloned = structuredClone(cyc);
console.log(`    structuredClone 成功：cloned.children[0].parent === cloned -> ${cloned.children[0].parent === cloned}`);
console.log(`    代价：原型会丢失（类实例被降级成普通对象），方法不会被复制。`);
console.log(`    回到本节的树：readme.parent.name = ${readme.parent?.name}（父引用依然可用）；` +
  `但注意 Object.keys 里看不到它，序列化时也不会出现在 JSON 里。`);

console.log('\n--- 2.4 组合模式的代价与什么时候不该用 ---');
console.log(`【收益】
  1) 客户端代码不需要区分"单个对象"与"一组对象"，递归代码短且不易错；
  2) 新增节点类型（比如 FsSymlink）只要实现同一接口，所有已有递归代码立即可用；
  3) 天然表达"层次结构"，且"整体"的聚合值（size/数量）可以递归计算。

【代价】
  1) 类型约束变弱：统一接口意味着"不该放在一起的东西"也能放进去，
     必须靠运行时校验（add() 里的 instanceof）；
  2) 接口被"取并集"：为了让所有节点可被统一处理，叶子也被迫实现 children/add 之类
     对自己没意义的成员 —— 接口被污染（这正是接口隔离原则 ISP 讨论的问题）；
  3) 父引用带来的循环结构，序列化、克隆、比较都要特殊处理；
  4) 深递归可能栈溢出；超深树要改成显式栈的迭代写法。

【什么时候不该用】
  1) 结构天然是扁平的（用户列表、订单行）：数组就够了，树形接口是多余的抽象；
  2) 只需要"偶尔遍历一次"：一个普通的递归函数就能解决，不必造节点类；
  3) 层次之间差异极大（比如"文件夹"与"数据库表"要被塞进同一个树）：
     强行统一接口会让每个方法里都充满类型判断，得不偿失。

【与装饰器 / 责任链的关系】
  组合的树 + 装饰器的包装 + 责任链的向上传递，三者组合起来正是 DOM 事件系统：
  捕获阶段（从根往下传）、目标阶段、冒泡阶段（往上冒），
  而事件对象的 currentTarget 就是组合树里"当前那一层"。`);

// ===========================================================================
// 第三部分：享元模式 Flyweight —— 共享细粒度对象以降低内存
// ===========================================================================

console.log('\n\n=== 第三部分：享元模式 Flyweight ===\n');
console.log('--- 3.1 场景与坏味道：文本编辑器里每个字符都带一份完整样式 ---');

/** 一份"角色 -> 样式"的规则：真实的富文本编辑器里就是 CSS 类 / 标记语言的作用 */
const BASE_STYLE = { fontFamily: 'Source Han Sans', fontSize: 14, color: '#333333', bold: false, italic: false };

function styleRule(ch) {
  if (/\s/.test(ch)) return { ...BASE_STYLE, role: '空白' };
  if (/[0-9]/.test(ch)) return { ...BASE_STYLE, color: '#0a7d5a', bold: true, role: '数字' };
  if (/[A-Za-z]/.test(ch)) return { ...BASE_STYLE, fontFamily: 'monospace', role: '拉丁字母' };
  if (/[一-鿿]/.test(ch)) return { ...BASE_STYLE, color: '#1a1a1a', role: '汉字' };
  return { ...BASE_STYLE, color: '#888888', role: '标点' };
}

// 造一份有 20 万个字符的文档（重复一段真实感的业务文本，绝不访问外部资源）
const N_CHARS = 200_000;
const SAMPLE = '订单 SO-20260115-0001 已于 2026-01-15 发货，金额 299.00 元，请联系客服 400-800-1234。\n';
let SOURCE_TEXT = '';
while (SOURCE_TEXT.length < N_CHARS) SOURCE_TEXT += SAMPLE;
SOURCE_TEXT = SOURCE_TEXT.slice(0, N_CHARS);

/**
 * ❌ 朴素写法：每个字符都新建一个样式对象。
 * 内存 = N 个字符对象 + N 个样式对象，而其中样式只有 5 种不同取值。
 */
function buildNaiveChars(text) {
  return [...text].map((ch) => ({
    ch,
    style: { ...styleRule(ch) }, // ← 每次都是新对象，这就是浪费的根源
  }));
}

/**
 * ✅ 享元写法：样式对象进"池"（intern），字符只保存一个**小整数 id**。
 *   - 内在状态（intrinsic）：字体、字号、颜色 —— 放进享元，全局共享、不可变；
 *   - 外在状态（extrinsic）：这个字符具体是哪个字 —— 由使用者（字符对象）自己存。
 */
class StylePool {
  #styles = []; // id -> 共享的样式对象（数组下标即 id，比 Map 省一层索引）
  #index = new Map(); // 样式指纹 -> id
  #internCalls = 0;
  #created = 0;

  /** 驻留：同样的样式只保留一份，返回它的 id */
  intern(style) {
    this.#internCalls += 1;
    const key = `${style.fontFamily}|${style.fontSize}|${style.color}|${style.bold}|${style.italic}|${style.role}`;
    const found = this.#index.get(key);
    if (found !== undefined) return found;
    // ★共享对象必须冻结：否则一处修改会污染所有引用它的字符
    const id = this.#styles.length;
    this.#styles.push(Object.freeze({ ...style, id }));
    this.#index.set(key, id);
    this.#created += 1;
    return id;
  }

  get(id) {
    return this.#styles[id];
  }
  get size() {
    return this.#styles.length;
  }
  get stats() {
    return { 驻留调用次数: this.#internCalls, 真正新建的样式对象: this.#created, 池大小: this.#styles.length };
  }
  /** 全部共享样式一览（用于打印） */
  list() {
    return this.#styles.map((s) => `#${s.id} ${s.role}(${s.fontSize}px ${s.color})`);
  }
  /**
   * ★享元的杀手锏：改"某一种角色"的样式，是 O(1) 的。
   * 因为所有该角色的字符都指向同一个 id，改池里的那一项，全体立即生效，
   * **一个字符对象都不用动**。
   */
  patch(id, changes) {
    this.#styles[id] = Object.freeze({ ...this.#styles[id], ...changes });
    return this.#styles[id];
  }
}

const stylePool = new StylePool();

/** ✅ 享元写法：字符对象只存 字符 + 样式 id */
function buildFlyweightChars(text, pool) {
  return [...text].map((ch) => ({ ch, styleId: pool.intern(styleRule(ch)) }));
}

console.log(`  文档长度：${N_CHARS.toLocaleString('en-US')} 个字符\n`);

console.log('--- 3.2 内存与对象数对比 ---');
console.log(`  说明：先构造享元版、再在其之上构造朴素版，用两次堆增量做对比。
  两版持有的**字符对象数量完全相同**，所以增量差异全部来自"样式对象"。\n`);

const baseHeap = process.memoryUsage().heapUsed;
const flyChars = buildFlyweightChars(SOURCE_TEXT, stylePool);
const afterFlyHeap = process.memoryUsage().heapUsed;
const naiveChars = buildNaiveChars(SOURCE_TEXT);
const afterNaiveHeap = process.memoryUsage().heapUsed;

const flyIncrement = afterFlyHeap - baseHeap;
const naiveIncrement = afterNaiveHeap - afterFlyHeap;

console.log(`  享元版：${N_CHARS.toLocaleString('en-US')} 个字符对象 + ${stylePool.size} 个共享样式对象`);
console.log(`          堆增量 ≈ ${mb(flyIncrement)}`);
console.log(`  朴素版：${N_CHARS.toLocaleString('en-US')} 个字符对象 + ${N_CHARS.toLocaleString('en-US')} 个样式对象`);
console.log(`          堆增量 ≈ ${mb(naiveIncrement)}`);
console.log(`  差额 ≈ ${mb(naiveIncrement - flyIncrement)}，也就是"重复的样式对象"白占的内存。`);
console.log(`  （堆增量是近似值：受 V8 分代与 GC 时机影响，用 node --expose-gc 会更稳，
    但对象数量是确定值 —— 5 个 vs 20 万个，这个差距在任何环境下都存在。）`);

const memTable = [
  ['指标', '朴素版', '享元版', '倍数'],
  ['字符对象数', N_CHARS.toLocaleString('en-US'), N_CHARS.toLocaleString('en-US'), '1x（相同）'],
  ['样式对象数', N_CHARS.toLocaleString('en-US'), String(stylePool.size), `${Math.round(N_CHARS / stylePool.size)}x`],
  ['样式对象开销(近似)', mb(naiveIncrement - flyIncrement), '≈ 0（已被上面的字符对象包含）', '—'],
];
printTable(memTable);

console.log(`\n  享元池的统计：${JSON.stringify(stylePool.stats)}`);
console.log(`  池里的共享样式：${stylePool.list().join('、')}`);
console.log(`  intern 了 ${stylePool.stats.驻留调用次数.toLocaleString('en-US')} 次，只真正 new 了 ${stylePool.stats.真正新建的样式对象} 次 —— 这就是"享元"。`);

console.log('\n--- 3.3 享元的杀手锏：改样式的复杂度从 O(N) 降到 O(1) ---');

/** 朴素版：要把所有字符的样式改一遍，必须逐个对象改（N 次写操作） */
function naiveSetFontSize(chars, size) {
  let touched = 0;
  for (const c of chars) {
    // 朴素版里每个字符有自己的样式对象，只能一个个改（或者重建整份列表）
    c.style = { ...c.style, fontSize: size };
    touched += 1;
  }
  return touched;
}

const naiveChangeStart = performance.now();
const touched = naiveSetFontSize(naiveChars, 16);
const naiveChangeMs = performance.now() - naiveChangeStart;

// 享元版：找到"汉字"那个共享样式，改它 —— 全部汉字立即跟着变
const cjkStyleId = stylePool.intern(styleRule('字'));
const flyChangeStart = performance.now();
const patched = stylePool.patch(cjkStyleId, { fontSize: 16 });
const flyChangeMs = performance.now() - flyChangeStart;

console.log(`  朴素版改字号：触碰了 ${touched.toLocaleString('en-US')} 个样式对象，耗时 ${naiveChangeMs.toFixed(1)}ms`);
console.log(`  享元版改字号：触碰了 1 个共享样式对象，耗时 ${flyChangeMs.toFixed(4)}ms，新样式 = ${JSON.stringify(patched)}`);
console.log(`  验证"全体生效"：随便挑 3 个汉字字符，它们的 styleId 都指向同一个对象 ->`);
const cjkSamples = flyChars.filter((c) => /[一-鿿]/.test(c.ch)).slice(0, 3);
console.log(`    字符 ${cjkSamples.map((c) => c.ch).join('/')} 的样式字号 = ${cjkSamples.map((c) => stylePool.get(c.styleId).fontSize).join('/')}（都变成了 16）`);

// ⚠ 顺手暴露一个真实存在的陷阱：patch 会让 #index 里的指纹过期
const afterPatchId = stylePool.intern({ ...styleRule('字'), fontSize: 16 });
console.log(`  ⚠ 陷阱：patch 之后 #index 里的指纹（含 fontSize）已经过期 ——
    再 intern 一个"字号 16 的汉字样式"时，它找不到已存在的那一项，
    于是新建了 #${afterPatchId}，池大小变成 ${stylePool.size}。
    ★教训：**可变的那部分不能进 key**。真实实现要么让 key 只包含"身份"
    （如 role / CSS 类名），要么在 patch 时同步重建索引。`);

console.log(`\n  但请注意上面朴素版那个循环里的隐患：它给每个字符**新建**了一个样式对象，
  于是 CSS 意义上"同一种样式"在内存中变成了 N 份互不相干的副本 ——
  这就是"样式不一致"类 bug 的温床（改了 99% 的字符，漏了 1% 就变成花屏）。`);

console.log('\n--- 3.4 享元的前提、陷阱与不适用场景 ---');

console.log(`【享元成立的三个前提】（缺一个就不划算）
  1) 对象数量足够大（经验值：上万级别才值得考虑）；
  2) 对象中有大量**重复且不可变**的部分（本节的样式只有 5 种）；
  3) 能算出一个便宜且唯一的 key 来做驻留（本节的样式指纹字符串）。

【必须守住的原则】
  - 共享对象一定要 Object.freeze：
    否则任何一处 "style.color = 'red'" 会改掉"所有汉字"的颜色，这是极难排查的 bug。
  - 能存 id 就不要存对象引用：id 是小整数，在 V8 里是立即数，
    不占额外内存也没有指针追踪成本；对象引用会拖慢 GC。
  - 外在状态（每个字符自己的字）必须由使用者保存，**不要塞进享元**，
    否则享元的 key 会退化成"每个对象都不同"，池就失效了。

【常见陷阱】
  1) 把享元当缓存用：享元省**内存**（同一对象被多处引用），缓存省**时间**（避免重复计算）。
     一个 memoize 缓存 20 万个不同结果，恰恰是**内存杀手**，与享元的目标相反。
  2) key 的计算成本过高：如果拼接 key 比直接 new 一个对象还慢，就是负优化
     （本节的 6 字段拼接足够便宜；如果对象有 30 个字段就要重新评估）。
  3) 池没有上限：如果 key 的取值会无限增长（比如用户自定义颜色），
     池本身就成了内存泄漏。此时需要 LRU 上限或改用别的方案。
  4) 过早优化：几百个对象时引入池，只是让代码更难懂，内存收益为 0。

【什么时候不该用】
  1) 对象数量少于几千：收益不可测量，复杂度却是实打实的；
  2) 对象状态经常变化：频繁变化意味着 key 经常失效，池会不停增长；
  3) 对象很大且各不相同（如用户会话、数据库连接）：没有可共享的内在状态；
  4) 内存并不紧张时：现代 JS 引擎的对象分配已经很快，
     可读性优先 —— 先测量（process.memoryUsage / Chrome 的 Memory 面板）再优化。`);

// ===========================================================================
// 小结：三个结构型模式对照
// ===========================================================================

console.log('\n--- 小结：外观 / 组合 / 享元 三个模式对照 ---\n');
const summaryTable = [
  ['模式', '一句话解决什么', '结构关键词', '典型信号', '主要代价'],
  ['外观 Facade', '把多个子系统的复杂调用包成一个简单入口', '一对多、单向简化', '启动流程、SDK 封装、多个接口要一起调', '多一层间接、易膨胀成上帝对象'],
  ['组合 Composite', '让单个对象和一组对象被同样对待', '树、部分-整体一致', '目录树、组织架构、UI/DOM 树', '类型约束变弱、接口被取并集、父引用成环'],
  ['享元 Flyweight', '共享重复的细粒度对象以省内存', '内外状态分离、对象池', '大量同构对象、内存吃紧、样式/图标复用', '共享对象必须冻结、key 计算成本、池无上限'],
];
printTable(summaryTable);

console.log(`
  三者可以叠加使用，真实项目里的典型形态是：
    一个"应用启动门面"（Facade）
      -> 内部装载一个"插件树"（Composite）
        -> 树上的几千个节点共享同一批"图标与样式对象"（Flyweight）。

  最后提醒一句（延续 13_pattern_selection.js 的主题）：
  结构型模式的共同点是"**多了一层**"。这一层只有在
  "调用方确实变简单了 / 递归代码确实不用判断类型了 / 内存确实降下来了"时才值得存在。
  加之前先量一下：调用点有几个？对象有几万个？内存占多少？
  量不出来收益的抽象，就是负债。`);

console.log('\n全部演示完毕。');
