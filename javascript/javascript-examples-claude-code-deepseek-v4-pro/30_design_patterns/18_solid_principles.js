/**
 * ============================================================================
 * 知识点：SOLID 五大设计原则 —— 违反 → 问题 → 重构 的三段式对照
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计原则（本仓库此前为 0 覆盖）
 * 【难度等级】高级
 * 【前置知识】30_design_patterns/07_strategy.js、13_pattern_selection.js、
 *             14_classes/07_inheritance_extends.js（LSP 一节要与此呼应）、
 *             14_classes/14_polymorphism.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    SOLID 是五条面向对象设计原则的首字母缩写，由 Robert C. Martin 在 2000 年代
 *    整理并命名（其中两条有更早的出处：LSP 来自 Barbara Liskov 1987 年的替换原则，
 *    ISP 来自 Martin 在 Xerox 打印机项目中遇到的"胖接口"问题）：
 *      S —— 单一职责原则 SRP：Single Responsibility Principle
 *      O —— 开闭原则 OCP：Open/Closed Principle
 *      L —— 里氏替换原则 LSP：Liskov Substitution Principle
 *      I —— 接口隔离原则 ISP：Interface Segregation Principle
 *      D —— 依赖倒置原则 DIP：Dependency Inversion Principle
 *    它们不是语法规则，也不是"必须遵守的法律"，而是**应对变化的经验总结**：
 *    每一条都在回答同一个问题 ——「当需求变化时，我改动的范围能不能小一点？」
 *
 * 2. 为什么需要（真实项目场景）
 *    代码的成本不在于"写出来"，而在于"以后每次改它"：
 *      - 一个类里混了 5 件事，改邮件模板要重新部署整个模块；
 *      - 一个 switch 处理所有类型，加一种类型就要改动已经测试通过的代码；
 *      - 子类行为与父类契约不一致，用父类写好的函数在子类上突然算错；
 *      - 一个接口有 12 个方法，实现类被迫写 9 个空方法 / 抛异常的占位；
 *      - 高层业务直接 new 底层实现，测试时根本替换不掉。
 *    这五个场景，正好对应 SOLID 的五条原则。
 *
 * 3. 核心语法要点（这里的"语法"是**判断标准**，不是 JS 语法）
 *    - SRP：一个模块应该只有**一个变化的理由**（a reason to change）。
 *      判断法不是"方法有几个"，而是"**谁会提出改这个文件的需求**"。
 *      如果"做安全的张三"和"做运营的李四"都会来改它，那它就违反了 SRP。
 *    - OCP：对扩展开放、对修改关闭。落地手段是**扩展点**：
 *      多态（子类）、策略表（注册表）、钩子（回调）。判断法：
 *      "新增一种类型时，我能不能只加新文件、不碰老文件？"
 *    - LSP：子类型必须能替换父类型而不破坏程序正确性。三条具体约束：
 *        ① 前置条件不能**加强**（父类允许的输入，子类必须也允许）；
 *        ② 后置条件不能**削弱**（父类承诺的输出/副作用，子类必须也保证）；
 *        ③ 不变量与父类的契约必须保持（如"宽高可变"、"数组长度可增长"）。
 *      最实用的判断法是"契约测试"：用父类写一段代码，换成子类跑，结果必须一样。
 *    - ISP：客户端不应该被迫依赖它用不到的方法。滥用接口（fat interface）
 *      会导致实现类里充满抛异常的占位方法 —— 那是设计味道，不是实现偷懒。
 *    - DIP：① 高层模块不依赖低层模块，两者都依赖**抽象**；
 *            ② 抽象不依赖细节，细节依赖抽象。
 *      落地手段就是依赖注入（见 19_dependency_injection.js）。
 *
 * 4. 常见陷阱
 *    - 把 SOLID 当成教条：为 3 行的函数抽出 4 个类与 2 个接口，
 *      代码量翻 5 倍，可读性反而下降（本章第 7 节专门讲这个）。
 *    - 把 SRP 理解成"一个类只能做一件事"：那所有类最后都只剩一个方法。
 *      SRP 的粒度是"变化的理由"，不是"动作的数量"。
 *    - 把 OCP 理解成"永远不许改老代码"：那将导致大量无用的扩展点。
 *      OCP 的真正要求是"**改动被限制在新增的代码里**"，而不是"老代码永不修改"。
 *    - 用 instanceof / typeof 判断子类型来特判：这恰恰是 LSP 被破坏的信号。
 *    - 用继承复用代码（is-a 关系不成立也强行继承）：LSP 的经典死法（本章 3.1）。
 *    - 在 JS 里生搬 Java 的"接口 + 实现"两套类：JS 是鸭子类型，
 *      一个测试用的假对象就够了，不需要先定义接口（第 4 节会给更轻的做法）。
 *    - 五条原则会互相拉扯：SRP 拆得越细，类越多；ISP 让接口变多；
 *      DIP 让间接层变多。它们是**权衡工具**，不是可以同时全部最大化的指标。
 *    - 只对"会变化的地方"应用原则：一次性的脚本、稳定的工具函数，
 *      任何一条原则都用不上。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/18_solid_principles.js
 *
 * 【预期输出】
 *   依次对 SRP / OCP / LSP / ISP / DIP 各做一次"违反的代码 → 问题在哪 →
 *   重构后的代码 → 行为等价性验证（重构前后输出一致）"，
 *   其中 LSP 会用契约测试现场演示"子类替换后结果变错"；
 *   最后给出五条原则的横向对照表，以及"SOLID 是指导不是教条"的过度应用清单。
 * ============================================================================
 */

import { isDeepStrictEqual } from 'node:util';

// ===========================================================================
// 0. 工具：行为等价性校验器
// ===========================================================================

function displayWidth(s) {
  return [...String(s)].reduce(
    (w, ch) => w + (/[ᄀ-ᅟ⺀-〾ぁ-㿿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(ch) ? 2 : 1),
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

/**
 * 重构前后"行为等价"是本文件的硬指标：
 * 每节都会用同一个输入分别跑"违反版"与"重构版"，断言输出完全一致。
 * 用 node:util 的 isDeepStrictEqual 做深比较（不抛异常，只返回布尔）。
 */
const verdicts = [];
function assertSame(label, before, after) {
  const same = isDeepStrictEqual(before, after);
  verdicts.push({ label, same });
  console.log(`  ${same ? '✓' : '✗'} 行为等价性：${label} -> ${same ? '重构前后输出完全一致' : '不一致（说明重构改变了行为，属于 bug）'}`);
  if (!same) {
    console.log(`      before = ${JSON.stringify(before)}`);
    console.log(`      after  = ${JSON.stringify(after)}`);
  }
  return same;
}

console.log('=== SOLID 五大设计原则 ===');
console.log(`
  本文件对每条原则都给出四段内容：
    【违反】可以运行但会腐化的代码  ->  【问题】它会带来什么真实后果
    ->  【重构】应用原则后的代码    ->  【行为等价性】用同一输入验证前后输出一致
  最后一节讲"过度应用"——这一节和前面五节同样重要。`);

// ===========================================================================
// 1. SRP —— 单一职责原则
// ===========================================================================

console.log('\n\n--- 1. SRP 单一职责原则：一个模块只有一个"变化的理由" ---\n');

console.log('【违反】把所有事塞进一个类：');
console.log(`
  class UserService {
    register(input) {
      // ① 校验规则        <- 产品/安全会来改
      // ② 密码哈希        <- 安全会来改（换算法、加盐、升级参数）
      // ③ 写数据库        <- DBA/后端会来改（换 ORM、加字段）
      // ④ 发欢迎邮件      <- 运营会来改（改文案、换模板引擎）
    }
  }
  一个类里装了 4 个"变化的理由"，4 个不同角色的人都会来改这个文件。
  下面用真实可运行的代码还原它：`);

/** 一个极简的"数据库"（内存实现，绝不访问外部资源） */
function createFakeDb() {
  return { users: [], sentMails: [], seq: 1 };
}

/** ❌ 违反 SRP：校验 + 哈希 + 持久化 + 发邮件 挤在一个类里 */
class UserServiceBad {
  constructor(db) {
    this.db = db; // 还硬编码了依赖（第 5 节会讲这也是 DIP 问题）
  }

  register(input) {
    // ① 校验规则
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email ?? '')) {
      throw new RangeError('邮箱格式不正确');
    }
    if (!input.password || input.password.length < 8) {
      throw new RangeError('密码至少 8 位');
    }
    // ② 密码哈希（这里用一个确定性的简化算法，避免引入随机盐导致输出不可复现；
    //    真实项目请用 node:crypto 的 scrypt/bcrypt，见 35_web_crypto）
    const passwordHash = `h$${[...input.password].reduce((h, c) => (h * 31 + c.codePointAt(0)) % 0xffffffff, 7).toString(16)}`;
    // ③ 持久化
    const user = { id: `U-${String(this.db.seq++).padStart(3, '0')}`, email: input.email.toLowerCase(), passwordHash, welcomeMailSent: false };
    this.db.users.push(user);
    // ④ 发欢迎邮件（模板也写在这里）
    const mail = { to: user.email, subject: '欢迎注册', body: `你好 ${user.email}，感谢注册！` };
    this.db.sentMails.push(mail);
    user.welcomeMailSent = true;

    return { id: user.id, email: user.email, passwordHash: user.passwordHash, welcomeMailSent: user.welcomeMailSent };
  }
}

const dbBad = createFakeDb();
const resultBad = new UserServiceBad(dbBad).register({ email: 'ZhangSan@Example.com', password: 's3cret-pass' });
console.log(`  违反版输出：${JSON.stringify(resultBad)}`);

console.log(`
【问题】这个类会带来的真实后果：
  1) 改邮件文案要重新跑一遍"注册 + 哈希 + 数据库"的全部测试，回归面大；
  2) 单元测试无法只测"校验规则"：测一条正则也要准备一个假的 db；
  3) 想换哈希算法（安全需求）会碰到"发邮件"的代码，容易误伤；
  4) 类名 UserService 什么都没说明 —— 它其实是一个"注册流程"，
     而"忘记密码流程"要不要放进来？没有判断标准，于是它只会越来越大；
  5) 多人并行开发时，四个人改同一个文件，合并冲突不断。

  判断 SRP 的核心问句：**"谁会提出改这个文件？"**
  如果答案不止一个人（或不止一个业务理由），那就该拆。`);

console.log('\n【重构】按"变化的理由"拆成 5 个模块：');

/** ① 只负责校验规则：唯一会改它的理由是"业务规则变了" */
class UserValidator {
  static #EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  validate(input) {
    const errors = [];
    if (!UserValidator.#EMAIL.test(input.email ?? '')) errors.push('邮箱格式不正确');
    if (!input.password || input.password.length < 8) errors.push('密码至少 8 位');
    return errors; // 返回错误列表而不是抛异常：让编排者决定怎么处理
  }
}

/** ② 只负责密码：唯一会改它的理由是"安全策略变了" */
class PasswordHasher {
  hash(plain) {
    return `h$${[...plain].reduce((h, c) => (h * 31 + c.codePointAt(0)) % 0xffffffff, 7).toString(16)}`;
  }
}

/** ③ 只负责持久化：唯一会改它的理由是"存储方式变了" */
class UserRepository {
  constructor(db) {
    this.db = db;
  }
  insert({ email, passwordHash }) {
    const user = { id: `U-${String(this.db.seq++).padStart(3, '0')}`, email, passwordHash, welcomeMailSent: false };
    this.db.users.push(user);
    return user;
  }
  markWelcomeMailSent(user) {
    user.welcomeMailSent = true;
  }
}

/** ④ 只负责欢迎邮件：唯一会改它的理由是"运营要改文案/换模板" */
class WelcomeMailer {
  constructor(db) {
    this.db = db;
  }
  send(user) {
    this.db.sentMails.push({ to: user.email, subject: '欢迎注册', body: `你好 ${user.email}，感谢注册！` });
    return true;
  }
}

/** ⑤ 编排者：它的唯一职责是"按顺序调用上面四件事"，本身不含业务规则 */
class UserService {
  constructor({ validator, hasher, repository, mailer }) {
    // 依赖以对象形式注入（第 5 节 DIP + 19_dependency_injection.js）
    this.validator = validator;
    this.hasher = hasher;
    this.repository = repository;
    this.mailer = mailer;
  }

  register(input) {
    const errors = this.validator.validate(input);
    if (errors.length > 0) throw new RangeError(errors.join('；'));

    const user = this.repository.insert({
      email: input.email.toLowerCase(),
      passwordHash: this.hasher.hash(input.password),
    });

    if (this.mailer.send(user)) this.repository.markWelcomeMailSent(user);

    return { id: user.id, email: user.email, passwordHash: user.passwordHash, welcomeMailSent: user.welcomeMailSent };
  }
}

const dbGood = createFakeDb();
const resultGood = new UserService({
  validator: new UserValidator(),
  hasher: new PasswordHasher(),
  repository: new UserRepository(dbGood),
  mailer: new WelcomeMailer(dbGood),
}).register({ email: 'ZhangSan@Example.com', password: 's3cret-pass' });
console.log(`  重构版输出：${JSON.stringify(resultGood)}`);
assertSame('SRP 重构前后', resultBad, resultGood);

console.log(`\n  拆开之后能做的事（违反版做不到）：
    · 只想测校验规则时，直接 new UserValidator() 断言错误列表，不需要数据库；
    · 想换哈希算法，只改 PasswordHasher，注册流程的测试一行不动；
    · 想加"注册后发优惠券"，在编排者里加一行，或者再注入一个 CouponSender。`);

console.log(`
【SRP 的代价与不该用】
  代价：类的数量增加（1 个变 5 个），调用方要组装更多对象，
        简单的流程被拆成需要跳 4 个文件才能读完 —— 阅读成本上升。
  不该用：
    · 一个只有 20 行的脚本：直接写在一个函数里，拆开纯属自找麻烦；
    · "变化理由"只有一个的模块：比如一个纯计算工具，它永远不会因为两个人吵架；
    · 拆到"每个类只有一个方法"：那是把 SRP 用成了教条（第 7 节）。
  判断法：如果"未来半年内不会有人因为另一个理由来改它"，就不必拆。`);

// ===========================================================================
// 2. OCP —— 开闭原则
// ===========================================================================

console.log('\n\n--- 2. OCP 开闭原则：对扩展开放、对修改关闭 ---\n');
console.log('【违反】用 switch 处理所有形状：');

/** 形状数据（违反版用普通对象 + type 字段） */
const badShapes = [
  { type: 'circle', radius: 2 },
  { type: 'rect', width: 3, height: 4 },
  { type: 'triangle', base: 6, height: 5 },
];

/** ❌ 违反 OCP：每加一种形状，都要回来改这个函数 */
function totalAreaBad(shapes) {
  let total = 0;
  for (const shape of shapes) {
    switch (shape.type) {
      case 'circle':
        total += Math.PI * shape.radius ** 2;
        break;
      case 'rect':
        total += shape.width * shape.height;
        break;
      case 'triangle':
        total += 0.5 * shape.base * shape.height;
        break;
      default:
        throw new RangeError(`未知形状：${shape.type}`);
    }
  }
  return Number(total.toFixed(6));
}

/** ❌ 同样的 switch 还要再写一遍 —— 每个"操作"都会各自长出一个 switch */
function totalPerimeterBad(shapes) {
  let total = 0;
  for (const shape of shapes) {
    switch (shape.type) {
      case 'circle':
        total += 2 * Math.PI * shape.radius;
        break;
      case 'rect':
        total += 2 * (shape.width + shape.height);
        break;
      case 'triangle': {
        // 等腰三角形近似（只为演示）
        const side = Math.hypot(shape.base / 2, shape.height);
        total += shape.base + 2 * side;
        break;
      }
      default:
        throw new RangeError(`未知形状：${shape.type}`);
    }
  }
  return Number(total.toFixed(6));
}

const areaBad = totalAreaBad(badShapes);
const perimeterBad = totalPerimeterBad(badShapes);
console.log(`  违反版：面积合计 = ${areaBad}，周长合计 = ${perimeterBad}`);

console.log(`
【问题】
  1) 新增"梯形"要改**所有**含 switch 的函数（本文件里有 2 个，真实项目里可能有 8 个）；
  2) 改动的是**已经上线、已经测过**的代码，回归风险与改动量成正比；
  3) default 分支抛异常：任何一处漏改都会在运行时才暴露；
  4) 形状的知识（数据 + 公式）被切碎到各个函数里，看一个形状的行为要翻遍全项目；
  5) 两个开发同时加两种形状，必然在同一个 switch 上冲突。

  ★注意：这不是"switch 有罪"。当分支只有 2 个、且永不变时，switch 是最清楚的写法
  （13_pattern_selection.js 反复强调过这一点）。OCP 的适用条件是
  "**类型会持续增加**" —— 形状库显然符合。`);

console.log('\n【重构】把"形状"做成多态对象，把"操作"做成统一入口：');

/** 抽象基类：定义契约（面积与周长），同时提供"统一的操作入口" */
class Shape {
  get name() {
    return this.constructor.name;
  }
  area() {
    throw new Error(`${this.name} 必须实现 area()`);
  }
  perimeter() {
    throw new Error(`${this.name} 必须实现 perimeter()`);
  }
}

class Circle extends Shape {
  constructor(radius) {
    super();
    this.radius = radius;
  }
  area() {
    return Math.PI * this.radius ** 2;
  }
  perimeter() {
    return 2 * Math.PI * this.radius;
  }
}

class Rect extends Shape {
  constructor(width, height) {
    super();
    this.width = width;
    this.height = height;
  }
  area() {
    return this.width * this.height;
  }
  perimeter() {
    return 2 * (this.width + this.height);
  }
}

class Triangle extends Shape {
  constructor(base, height) {
    super();
    this.base = base;
    this.height = height;
  }
  area() {
    return 0.5 * this.base * this.height;
  }
  perimeter() {
    const side = Math.hypot(this.base / 2, this.height);
    return this.base + 2 * side;
  }
}

/**
 * ★扩展点：操作被写成"对任意 Shape 都成立"的形式。
 * 注意这两个函数**永远不需要再修改** —— 新增形状不会碰到它们。
 */
const totalArea = (shapes) => Number(shapes.reduce((sum, s) => sum + s.area(), 0).toFixed(6));
const totalPerimeter = (shapes) => Number(shapes.reduce((sum, s) => sum + s.perimeter(), 0).toFixed(6));

const goodShapes = [new Circle(2), new Rect(3, 4), new Triangle(6, 5)];
const areaGood = totalArea(goodShapes);
const perimeterGood = totalPerimeter(goodShapes);
console.log(`  重构版：面积合计 = ${areaGood}，周长合计 = ${perimeterGood}`);
assertSame('OCP 重构前后（面积）', areaBad, areaGood);
assertSame('OCP 重构前后（周长）', perimeterBad, perimeterGood);

console.log('\n  验证"扩展开放"：新增一种梯形，只加新代码，老代码一行不动 ——');
/** ★新增的形状：不修改 Shape / Circle / Rect / Triangle / totalArea 中的任何一行 */
class Trapezoid extends Shape {
  constructor(topBase, bottomBase, height) {
    super();
    this.topBase = topBase;
    this.bottomBase = bottomBase;
    this.height = height;
  }
  area() {
    return 0.5 * (this.topBase + this.bottomBase) * this.height;
  }
  perimeter() {
    const leg = Math.hypot((this.bottomBase - this.topBase) / 2, this.height);
    return this.topBase + this.bottomBase + 2 * leg;
  }
}
const withTrapezoid = [...goodShapes, new Trapezoid(3, 7, 4)];
console.log(`  5 个形状（含梯形）的面积合计：${totalArea(withTrapezoid)}；周长合计：${totalPerimeter(withTrapezoid)}`);
console.log(`  totalArea / totalPerimeter 的源码**完全没变**，这就是"对修改关闭、对扩展开放"。`);

console.log(`
【OCP 的两种落地形态】
  ① 多态（本节的写法）：把变化点做成子类 —— 适合"类型 + 专属数据 + 专属算法"；
  ② 策略表 / 注册表（07_strategy.js）：把变化点做成表里的一条数据 ——
     适合"开放给外部扩展"的场景（插件系统），因为注册可以发生在运行时：

        const AREA_STRATEGIES = new Map([['circle', (s) => Math.PI * s.radius ** 2]]);
        const areaOf = (s) => AREA_STRATEGIES.get(s.type)(s);   // 加形状 = 往表里加一条

【代价】
  1) 类的数量增加（3 种形状 = 1 个基类 + 3 个子类）；
  2) 调用方不再能"看一眼就知道有哪些形状"（数据驱动时尤其明显）；
  3) 如果变化方向判断错了，抽象出的扩展点会全部作废（比不改更糟）。

【什么时候不该用】
  1) 类型集合是封闭的、且很少变化（性别、星期、订单状态固定几种）：
     switch 更短更直观，而且能配合 TypeScript 的穷尽检查；
  2) 只有 1~2 个操作函数：为 2 个函数建一套多态体系，纯属过度设计；
  3) 变化的是"数据"而不是"行为"：改配置就行，不需要改代码结构。

【最容易犯的错】把 OCP 理解成"老代码不许改"。
  OCP 的真正意思是：**新增功能时，改动应当集中在新增的代码里**。
  如果为了"绝不修改老文件"而预留一堆钩子，那是本末倒置（见第 7 节）。`);

// ===========================================================================
// 3. LSP —— 里氏替换原则
// ===========================================================================

console.log('\n\n--- 3. LSP 里氏替换原则：子类必须能替换父类而不破坏正确性 ---\n');
console.log(`  （本节与 14_classes/07_inheritance_extends.js 呼应：
    "继承"是语法能力，"能不能继承"是契约问题。）`);

console.log('\n【违反】经典反例：正方形继承长方形');
console.log(`
  这个例子之所以经典，是因为它在数学上"成立"（正方形是长方形），
  但在**行为契约**上不成立：长方形的契约包含"宽和高可以独立变化"。`);

class Rectangle {
  #width;
  #height;
  constructor(width, height) {
    this.#width = width;
    this.#height = height;
  }
  // 契约：width 与 height 是**互相独立**的属性，改一个不影响另一个
  get width() {
    return this.#width;
  }
  set width(v) {
    this.#width = v;
  }
  get height() {
    return this.#height;
  }
  set height(v) {
    this.#height = v;
  }
  get area() {
    return this.#width * this.#height;
  }
}

/** ❌ 违反 LSP：为了维持"正方形"的不变量，悄悄改写了父类的 setter 语义 */
class Square extends Rectangle {
  constructor(side) {
    super(side, side);
  }
  set width(v) {
    super.width = v;
    super.height = v; // ← 副作用：调用方没要求改 height，它却被改了
  }
  set height(v) {
    super.height = v;
    super.width = v;
  }
}

/**
 * 调用方基于 **Rectangle 的契约** 写好的代码：
 * "把宽设成 5、高设成 4，面积应当是 20"。
 * 这段代码对 Rectangle 永远正确 —— 对 Square 就不一定了。
 */
function resizeAndMeasure(rect) {
  rect.width = 5;
  rect.height = 4;
  return rect.area;
}

const rect = new Rectangle(2, 3);
const square = new Square(2);
const resultForRect = resizeAndMeasure(rect);
const resultForSquare = resizeAndMeasure(square);
console.log(`  对 Rectangle 执行"宽=5、高=4"：面积 = ${resultForRect}（契约成立）`);
console.log(`  对 Square    执行同样的代码：面积 = ${resultForSquare}（契约被破坏！期望 20，实际 16）`);
console.log(`  调用方没有写错任何一行代码，但它不能把 Square 当作 Rectangle 使用 —— 这就是 LSP 违反。`);
console.log(`  更糟的是：这个 bug 只在"用父类契约写好的通用函数"里出现，
  直接在 Square 上调用是看不出来的（所以极难排查）。`);

console.log(`\n  同一类死法在 JS 标准库里也有（很多人踩过）：`);
try {
  class ReadOnlyList extends Array {
    push() {
      throw new Error('只读列表不支持 push');
    }
  }
  /** 调用方基于 Array 契约写好的通用函数 */
  function fillWith(list, value, times) {
    for (let i = 0; i < times; i += 1) list.push(value);
    return list.length;
  }
  console.log(`    对普通数组：${fillWith([], 'x', 3)} 个元素（契约成立）`);
  console.log(`    对 ReadOnlyList：${fillWith(new ReadOnlyList(), 'x', 3)}`);
} catch (err) {
  console.log(`    对 ReadOnlyList：抛错 ${err.name}: ${err.message}`);
  console.log(`    ★这就是"子类加强了前置条件"（父类允许任意 push，子类不允许），LSP 明确禁止。`);
}

console.log('\n【重构】两条路：能保持契约的子类留下，不能的改用组合/独立类型');

/** ✅ 合法的子类：只**增加**能力，不改变父类契约 */
class ColoredRectangle extends Rectangle {
  constructor(width, height, color) {
    super(width, height);
    this.color = color;
  }
  // 只新增方法，width/height 的语义完全不变
  describe() {
    return `${this.color} ${this.width}×${this.height}`;
  }
}

/** ✅ 正方形不再继承长方形，而是与它并列实现同一个"形状契约"（不可变设计） */
class ImmutableSquare {
  #side;
  constructor(side) {
    this.#side = side;
  }
  get side() {
    return this.#side;
  }
  // 用"返回新的正方形"代替"修改自己" —— 没有 setter，也就没有契约冲突
  withSide(side) {
    return new ImmutableSquare(side);
  }
  get area() {
    return this.#side ** 2;
  }
}

const colored = new ColoredRectangle(2, 3, '红色');
console.log(`  ✅ 合法子类 ColoredRectangle：resizeAndMeasure = ${resizeAndMeasure(colored)}（与 Rectangle 一致）`);
console.log(`     附加能力 describe() = ${colored.describe()}，且没有改动任何父类语义。`);
console.log(`  ✅ ImmutableSquare 独立存在：面积 = ${new ImmutableSquare(4).area}，` +
  `withSide(5).area = ${new ImmutableSquare(4).withSide(5).area}（不可变，无 setter 冲突）。`);
console.log(`     代价：它**不能**传给 resizeAndMeasure —— 这恰恰是正确的，因为它本来就不是 Rectangle。`);
console.log(`     ★教训：继承表达的是"**行为契约的兼容**"，而不仅仅是"概念上属于某类"。
     is-a 在数学上成立（正方形是一种长方形）并不够，契约兼容才够。`);

console.log('\n  用"契约测试"自动守住 LSP（本文件的做法）：');
/** 契约测试：任何自称是 Rectangle 的东西，都必须通过这套断言 */
function rectangleContractTest(makeRect, label) {
  const r = makeRect();
  const before = r.area;
  r.width = 5;
  r.height = 4;
  const ok = r.area === 20 && typeof before === 'number';
  console.log(`    ${ok ? '✓' : '✗'} ${label}：${ok ? '满足契约' : '违反契约'}（要求 width/height 独立可变、面积 = 宽×高）`);
  return ok;
}
rectangleContractTest(() => new Rectangle(2, 3), 'Rectangle');
rectangleContractTest(() => new ColoredRectangle(2, 3, '蓝'), 'ColoredRectangle');
rectangleContractTest(() => new Square(2), 'Square');
console.log(`  ★把这条测试放进 CI，任何"悄悄破坏契约"的子类都会在提交时被拦下来。`);

console.log(`
【LSP 的三条硬性约束】（写子类时逐条对照）
  1) 前置条件不能**加强**：父类接受 null / 空数组 / 任意 push，子类不能拒绝；
  2) 后置条件不能**削弱**：父类承诺返回非空、承诺副作用，子类必须同样保证；
  3) 不变量必须保持：父类的"宽高独立"、"列表可增长"这类隐含约定不能改。
  违反时的症状（闻到就该怀疑 LSP）：
    · 子类方法里出现 "throw new Error('不支持')"；
    · 调用方出现 "if (x instanceof Sub)" 特判；
    · 子类里出现空实现的覆盖。

【代价】
  1) 为了满足契约，有时要放弃"看上去很自然"的继承（正方形不能继承长方形），
     概念上会让人别扭，需要写注释解释；
  2) 契约测试要额外编写与维护；
  3) 过度追求契约一致会催生大量"只增不减"的薄子类，价值有限。

【什么时候不该用（什么时候可以"违反"契约）】
  1) 内部一次性代码、子类只在一处使用且调用方明确知道它是子类：
     此时"is-a 不成立"不会造成真实伤害；
  2) 纯数据载体（DTO）：没有行为契约，就没有契约可违反；
  3) 用 TypeScript 时，把契约写进类型系统比写注释可靠得多 ——
     但仍然拦不住"语义上"的违反（setter 副作用），契约测试仍不可替代。`);

// ===========================================================================
// 4. ISP —— 接口隔离原则
// ===========================================================================

console.log('\n\n--- 4. ISP 接口隔离原则：别让实现类依赖它用不到的方法 ---\n');
console.log(`  （这一条源自 Martin 在 Xerox 打印机项目里遇到的真实问题：
    一个 Job 类同时提供 print / scan / fax / staple，
    结果只支持打印的低端设备被迫实现并抛出"不支持"的占位方法。）`);

console.log('\n【违反】一个"全能设备"接口：');

/** ❌ 胖接口：四合一 */
class MultiFunctionDevice {
  print(_doc) {
    throw new Error(`${this.constructor.name} 必须实现 print()`);
  }
  scan(_doc) {
    throw new Error(`${this.constructor.name} 必须实现 scan()`);
  }
  fax(_doc, _to) {
    throw new Error(`${this.constructor.name} 必须实现 fax()`);
  }
  staple(_doc) {
    throw new Error(`${this.constructor.name} 必须实现 staple()`);
  }
}

/** 高端一体机：四个都能做，实现起来很自然 */
class OfficePrinter extends MultiFunctionDevice {
  print(doc) {
    return `打印「${doc}」`;
  }
  scan(doc) {
    return `扫描「${doc}」得到 PDF`;
  }
  fax(doc, to) {
    return `传真「${doc}」到 ${to}`;
  }
  staple(doc) {
    return `装订「${doc}」`;
  }
}

/** ❌ 低端打印机：只支持打印，却被接口逼着实现另外三个方法 */
class CheapPrinter extends MultiFunctionDevice {
  print(doc) {
    return `打印「${doc}」`;
  }
  scan(_doc) {
    throw new Error('该设备不支持扫描');
  }
  fax(_doc, _to) {
    throw new Error('该设备不支持传真');
  }
  staple(_doc) {
    throw new Error('该设备不支持装订');
  }
}

/**
 * 调用方基于胖接口编写"归档"功能：
 * 它真的需要 scan 吗？需要。但它的参数类型写成了 MultiFunctionDevice，
 * 于是**所有**设备都被拖进了这个契约。
 */
function archiveBad(device, doc) {
  try {
    return device.scan(doc); // 廉价打印机在这里炸
  } catch (err) {
    return `归档失败：${err.message}`;
  }
}

console.log(`  一体机归档：${archiveBad(new OfficePrinter(), '合同.pdf')}`);
console.log(`  廉价机归档：${archiveBad(new CheapPrinter(), '合同.pdf')}`);
console.log(`
【问题】
  1) CheapPrinter 里 3/4 的方法是"抛异常的占位实现" —— 这是设计问题的信号，
     却被很多人当成"实现类偷懒"；
  2) 接口的任何变化（比如给 staple 加一个参数）都会波及所有实现类，包括用不到的；
  3) 调用方无法从类型/接口上看出"我到底需要哪种能力"，只能靠 try/catch 探路；
  4) 测试时要为每个假对象补齐 4 个方法，哪怕只测其中 1 个。`);

console.log('\n【重构】拆成小接口 + 用能力检测代替类型判断：');

/*
 * JS 没有 interface 关键字，所以"接口"体现为两种东西：
 *   ① 一份**文档化的方法契约**（约定方法名与签名）；
 *   ② 一个可运行的能力检测函数（typeof x.scan === 'function'）。
 * 这比 Java 的 interface 更轻：不需要为了"实现接口"而写一堆样板，
 * 但也失去了编译期检查 —— 所以要在边界处做一次显式的检测。
 */

/** 小接口 ①：只会打印 */
class SimplePrinter {
  print(doc) {
    return `打印「${doc}」`;
  }
}

/** 小接口 ②：只会扫描 */
class FlatbedScanner {
  scan(doc) {
    return `扫描「${doc}」得到 PDF`;
  }
}

/** 小接口 ③：会传真 */
class FaxMachine {
  fax(doc, to) {
    return `传真「${doc}」到 ${to}`;
  }
}

/** 组合多个能力：一体机通过**组合**把能力拼起来，而不是继承一个胖基类 */
class ComboDevice {
  constructor(parts) {
    Object.assign(this, parts); // 把各能力的方法挂上来（也可用 mixin，见 14_classes/11_mixins.js）
  }
}

/** 能力检测：把"是否支持某个能力"变成一个可测试的谓词 */
const can = {
  print: (device) => typeof device?.print === 'function',
  scan: (device) => typeof device?.scan === 'function',
  fax: (device) => typeof device?.fax === 'function',
};

/**
 * ✅ 调用方只声明它**真正需要**的能力（参数名就叫 scanner，不叫 device）。
 * 并且在边界处显式检测，给出明确的失败原因，而不是让"不支持"变成异常。
 */
function archive(scanner, doc) {
  if (!can.scan(scanner)) {
    return `归档失败：该设备（${scanner.constructor.name}）不具备扫描能力`;
  }
  return scanner.scan(doc);
}

const simplePrinter = new SimplePrinter();
const scanner = new FlatbedScanner();
const combo = new ComboDevice({ print: SimplePrinter.prototype.print, scan: FlatbedScanner.prototype.scan, fax: FaxMachine.prototype.fax });

console.log(`  一体机（组合式）归档：${archive(combo, '合同.pdf')}`);
console.log(`  独立扫描仪归档：      ${archive(scanner, '合同.pdf')}`);
console.log(`  廉价打印机归档：      ${archive(simplePrinter, '合同.pdf')}`);
console.log(`  传真能力检测：combo 支持传真 = ${can.fax(combo)}，simplePrinter 支持传真 = ${can.fax(simplePrinter)}`);

assertSame(
  'ISP 重构前后（有扫描能力的设备）',
  archiveBad(new OfficePrinter(), '合同.pdf'),
  archive(combo, '合同.pdf'),
);

console.log(`
  对比重构前后同一个需求的两种表达：
    违反版：设备被迫实现 4 个方法，不支持的用异常表示，调用方 try/catch 探路；
    重构版：能力拆成独立的小接口，调用方只依赖"扫描能力"，
            不支持的设备在**调用前**就被明确拒绝（返回原因而不是抛异常）。
  ★最大的收益是"类型约束变诚实了"：CheapPrinter 不再声称自己会扫描。`);

console.log(`
【ISP 的代价与不该用】
  代价：
    1) 接口/类数量增加（1 个胖接口 -> 3 个小接口 + 1 个组合器）；
    2) JS 里没有编译期接口检查，能力检测可能被忘记写（要在边界统一封装 can.*）；
    3) 组合出来的对象，方法来源分散，IDE 的"跳转到定义"体验略差。
  不该用：
    1) 所有实现类都能完整实现接口时（没有"被迫的占位方法"），说明接口不胖，不用拆；
    2) 只有 1~2 个实现类且短期不会增加：拆了只是多几个文件；
    3) 接口是给内部用的、且调用方本来就知道全部能力：不必为假想的扩展做隔离。
  判断信号只有一个：**实现类里有没有"抛异常/空实现的占位方法"**。
    有 -> ISP 违反，拆；没有 -> 别动。`);

// ===========================================================================
// 5. DIP —— 依赖倒置原则
// ===========================================================================

console.log('\n\n--- 5. DIP 依赖倒置原则：高层与低层都依赖抽象 ---\n');
console.log('【违反】高层业务直接 new 低层实现：');

/** 低层细节：SMTP 发信（用内存模拟，绝不访问网络） */
class SmtpEmailSender {
  constructor({ host }) {
    if (!host) throw new Error('缺少 SMTP 主机配置'); // 真实场景里这里会去连网络
    this.host = host;
  }
  send({ to, subject }) {
    return `[SMTP ${this.host}] 已发送「${subject}」给 ${to}`;
  }
}

/** ❌ 违反 DIP：高层模块自己创建低层实现，还硬编码了配置 */
class OrderNotifierBad {
  constructor() {
    // ① 高层直接依赖具体类 SmtpEmailSender（编译期就绑死了）
    // ② 配置来源也硬编码在这里，测试时无法替换
    this.sender = new SmtpEmailSender({ host: 'smtp.internal.corp' });
  }
  notify(order) {
    return this.sender.send({ to: order.email, subject: `订单 ${order.id} 已发货` });
  }
}

const order = { id: 'SO-1001', email: 'zhangsan@example.com' };

const notifierBad = new OrderNotifierBad();
// 为了对比"重构前后发送的内容是否一致"，我们只能给这个类**运行时打补丁** ——
// 这本身就说明了违反 DIP 的代码有多难测：本来"注入一个假实现"就完事了。
const badSpy = [];
const badSender = notifierBad.sender;
const originalBadSend = badSender.send.bind(badSender);
badSender.send = (message) => {
  badSpy.push(message);
  return originalBadSend(message);
};
console.log(`  ${notifierBad.notify(order)}`);
console.log(`  打补丁后才捕获到的消息：${JSON.stringify(badSpy[0])}`);
console.log(`
【问题】
  1) **无法测试**：单元测试一跑就会去连真实的 SMTP（这里被模拟成"缺 host 就抛错"），
     测试要么慢、要么需要网络、要么给生产环境发真邮件；
  2) 换渠道要改源码：要支持短信/推送，必须打开 OrderNotifierBad 改代码；
  3) 高层与低层绑死：业务逻辑的编译/加载依赖了 SMTP 客户端的可用性；
  4) 配置渗透：'smtp.internal.corp' 出现在业务类里，环境差异无法隔离。
  ★注意这不是"代码写错了"，而是**依赖的方向**错了：
    高层（订单通知的业务规则）依赖了低层（SMTP 协议细节）。`);

console.log('\n【重构】倒置依赖：高层定义抽象，低层实现抽象，注入进来');

/**
 * ✅ 抽象：由**高层**定义它需要的契约（注意这个"接口"是业务语言，不是 SMTP 语言）。
 * JS 里用一个文档化的方法契约表示；测试时可以传任何满足它的对象（鸭子类型）。
 */
class MessageSender {
  /**
   * @abstract
   * @param {{to:string, subject:string, body?:string}} message
   * @returns {string} 发送结果描述
   */
  send(_message) {
    throw new Error(`${this.constructor.name} 必须实现 send(message)`);
  }
}

/** 低层实现之一：邮件（细节依赖抽象） */
class EmailSender extends MessageSender {
  constructor({ host }) {
    super();
    this.host = host;
  }
  send({ to, subject }) {
    return `[邮件 via ${this.host}] 已发送「${subject}」给 ${to}`;
  }
}

/** 低层实现之二：短信 —— 新增渠道**不需要**改高层任何一行 */
class SmsSender extends MessageSender {
  constructor({ signName }) {
    super();
    this.signName = signName;
  }
  send({ to, subject }) {
    return `[短信 via ${this.signName}] 已发送「${subject}」给 ${to}`;
  }
}

/** 测试用假实现：只记录，不产生任何外部副作用 */
class RecordingSender extends MessageSender {
  constructor() {
    super();
    this.sent = [];
  }
  send(message) {
    this.sent.push(message);
    return `[记录器] 捕获了 ${this.sent.length} 条消息`;
  }
}

/** ✅ 重构后的高层模块：只依赖抽象 MessageSender（通过构造器注入） */
class OrderNotifier {
  constructor({ sender, template = (order) => `订单 ${order.id} 已发货` }) {
    this.sender = sender;
    this.template = template;
  }
  notify(order) {
    // 业务规则（发给谁、发什么）留在这里；怎么发交给抽象
    return this.sender.send({ to: order.email, subject: this.template(order) });
  }
}

const byEmail = new OrderNotifier({ sender: new EmailSender({ host: 'smtp.internal.corp' }) });
const bySms = new OrderNotifier({ sender: new SmsSender({ signName: '示例商城' }) });
const recorder = new RecordingSender(); // ← 注入一个假实现，零成本，不需要打补丁
const byRecorder = new OrderNotifier({ sender: recorder });

console.log(`\n  重构后（同一个业务决策 order，换三种实现）：`);
console.log(`  邮件渠道：${byEmail.notify(order)}`);
console.log(`  短信渠道：${bySms.notify(order)}`);
console.log(`  测试假实现：${byRecorder.notify(order)}`);
console.log(`  假实现捕获到的消息：${JSON.stringify(recorder.sent)}`);
console.log(`  ★注意：业务决策（发给谁、发什么）在三种实现下完全相同 ——`);
assertSame('DIP 重构前后（发送的消息内容）', badSpy[0], recorder.sent[0]);

console.log(`
  ★倒置了什么？看依赖箭头的方向：
    重构前：OrderNotifier ──依赖──> SmtpEmailSender（具体类）
    重构后：OrderNotifier ──依赖──> MessageSender（抽象）
                    SmtpEmailSender ──实现──> MessageSender
    高层的依赖箭头**倒过来**指向了抽象 —— 这就是"依赖倒置"这个名字的由来。

  ★重构后立刻多出来的三个能力：
    ① 可测试：注入 RecordingSender，测业务逻辑完全不需要 SMTP（本文件就是这么做的）；
    ② 可替换：换渠道 = 换一个注入对象，高层代码零改动；
    ③ 可组合：可以注入"先发短信、失败再发邮件"的组合发送器（组合优于继承）。`);

console.log(`
【DIP 的代价与不该用】
  代价：
    1) 多一层间接：要定义抽象、要注入、要组装，小项目里显得啰嗦；
    2) 抽象的粒度很难拿捏：抽象太粗会泄漏细节，太细会变成"每个类一个接口"的样板；
    3) 对象在哪儿创建成了新问题（答案是"在程序的入口/组合根"，
       见 19_dependency_injection.js 的容器与工厂）；
    4) 调试时多一层跳转，"到底用了哪个实现"要顺着注入链找。
  不该用：
    1) 对象没有外部依赖（纯计算、纯数据）：注入它没有意义；
    2) 依赖不会变化、也不会被测试替换（如 Math、JSON 这类标准库）：
       没人会为 Math.abs 造一个假实现；
    3) 一次性脚本 / 原型：直接在 main 里 new 就行，DIP 是为"要活很久的代码"准备的；
    4) 不要为了"以后可能换数据库"而提前抽象 —— 那是 YAGNI
       （13_pattern_selection.js）；但当**测试需要替换**时，抽象立刻就有了正当理由。
  判断信号：**"这个类能不能在不碰外部资源的情况下被单元测试？"**
    不能 -> 说明依赖方向有问题，考虑 DIP + 注入。`);

// ===========================================================================
// 6. 五条原则横向对照
// ===========================================================================

console.log('\n\n--- 6. SOLID 五条原则横向对照 ---\n');
const solidTable = [
  ['原则', '一句话', '解决什么痛', '落地手段', '违反信号', '主要代价'],
  ['SRP 单一职责', '一个模块只有一个变化的理由', '改一处动全身、多人抢同一个文件', '按"谁会来改"拆分模块', '"张三和李四都会来改这个文件"', '类变多、组装变复杂'],
  ['OCP 开闭', '扩展开放、修改关闭', '加一种类型要改 N 处已测代码', '多态 / 策略表 / 钩子', '同一个 switch 在多个函数里重复', '抽象方向猜错就白做'],
  ['LSP 里氏替换', '子类必须能替换父类', '通用函数在某个子类上算错', '契约测试 + 组合替代继承', '子类抛"不支持"、调用方 instanceof 特判', '概念上别扭、契约测试要维护'],
  ['ISP 接口隔离', '别依赖用不到的方法', '实现类充满占位方法', '小接口 + 能力检测', '实现类里有抛异常的占位方法', '接口与类数量增加'],
  ['DIP 依赖倒置', '高层与低层都依赖抽象', '业务类无法单测、换实现要改源码', '依赖注入 + 组合根', '业务类里出现 new 具体外部依赖', '多一层间接、需要容器/组装'],
];
printTable(solidTable);

// ===========================================================================
// 7. SOLID 是指导，不是教条
// ===========================================================================

console.log('\n--- 7. SOLID 是指导而非教条：过度应用会适得其反 ---');

console.log(`
  【先看一个"五条全用上"的反面教材】
    需求：把一个金额按汇率换算成另一种货币。就三行：

        function convert(amount, rate) {
          return Number((amount * rate).toFixed(2));
        }

    一个"严格遵守 SOLID"的版本可能是这样：
      · ICurrencyRateProvider 接口（DIP）
      · RateProviderImpl implements 它
      · ICurrencyConverter 接口 + CurrencyConverterImpl（ISP：再拆出 validator）
      · ConvertRequest 类 + ConvertResponse 类（DTO）
      · CurrencyConverterFactory（OCP：以后可能支持别的换算方式）
      · ConversionException 层级（3 个异常类）
      —— 一共 7 个类、200 行代码，只为了做一次乘法。

    这个例子里，SOLID 每一条"都没有用错"，但合起来的结果是：
      · 新人要读 7 个文件才知道这里在算乘法；
      · 任何改动都要动 3~4 个文件；
      · 测试从 1 行断言变成要造 4 个假对象。
    ★这不是"SOLID 错了"，而是"**把原则用在了不会变化的地方**"。

  【正确的心态】
    1) SOLID 是**应对变化的工具**，不是代码质量的评分标准。
       问自己："这里**真的会变**吗？谁会来改它？"—— 答不上来就先别抽象。
    2) 五条原则会互相冲突：
       SRP 让类变多 -> ISP 让接口变多 -> DIP 让层变多，
       而"可读性"这个真正的目标会因此受损。必须在它们之间做权衡。
    3) 原则的引入时机是**第二次痛点出现时**（Rule of Three，见 13_pattern_selection.js）：
       第一次先写朴素版，第二次重构，第三次才考虑抽象成模式。
    4) 允许有意的违反，但要**写下来**：
         // 这里故意不抽接口：只有一个实现，且已被测试覆盖（2026-01 评审）
       不写理由的违反会被后人当成疏忽，写下来的违反是一种设计决策。
    5) 语言与环境会改变最优解：
       TypeScript 的类型系统、React 的组件模型、Node 的模块系统，
       都让某些原则有了更轻的表达方式（比如 ESM 的静态导入天然就是一种依赖声明）。

  【三条实用的取舍忠告】
    ① "不要比变化更早地抽象"：YAGNI 与 OCP 并不矛盾 ——
       OCP 要求"扩展时只加代码"，而扩展点可以在**第一次变化发生时**再加。
    ② "重复两次比错误的抽象便宜"：等到第三次复制粘贴时再抽象，
       那时你才真正知道变化点在哪。
    ③ "可读性 > 优雅"：如果一个"符合 SOLID"的设计让新人在 10 分钟内读不懂，
       那它在这个团队、这个阶段就是错的 —— 哪怕它真的很优雅。`);

// ===========================================================================
// 收尾：汇总校验
// ===========================================================================

console.log('\n--- 8. 本次全部"行为等价性"校验汇总 ---\n');
const checkTable = [['#', '校验项', '结果']];
verdicts.forEach((v, i) => checkTable.push([String(i + 1), v.label, v.same ? '✓ 一致' : '✗ 不一致']));
printTable(checkTable);
const allSame = verdicts.every((v) => v.same);
console.log(`\n  共 ${verdicts.length} 项校验，全部一致：${allSame}`);
console.log(`  说明：本文件的每一次重构都**没有改变对外行为** ——
  这正是"重构"与"重写"的分界线（重构 = 行为不变，结构变好；
  重写 = 行为可能变）。SOLID 的所有收益，都必须建立在这个前提上。`);

console.log('\n全部演示完毕。');
