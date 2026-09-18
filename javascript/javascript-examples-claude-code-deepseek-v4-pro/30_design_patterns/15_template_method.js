/**
 * ============================================================================
 * 知识点：模板方法模式 —— 父类定骨架、子类填步骤（与策略模式的复用方式之别）
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/07_strategy.js（本节要与之对比）、14_classes/07_inheritance_extends.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    模板方法（Template Method）在父类里**定义算法的骨架**（步骤顺序、公共步骤、
 *    异常与资源处理），把其中会变化的几步声明为"抽象方法"或"钩子方法"，
 *    交给子类去填。父类控制"什么时候调用谁"，子类只提供"这一步怎么做"。
 *    两个术语必须分清：
 *      - 抽象方法（abstract method）：子类**必须**实现，父类只抛错占位；
 *      - 钩子方法（hook method）：父类**给默认实现**，子类**可选**覆盖，
 *        常用来插入"额外的时机"（beforeWrite / afterWrite / onError）。
 *    JS 没有 abstract / final 关键字，所以：
 *      - 抽象方法 = 父类方法体里 `throw new Error('子类必须实现 xxx')`；
 *      - final 方法 = 命名约定（如 `run`）+ 注释 + 代码评审，语言层面拦不住。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 数据导入/导出：打开 → 解析 → 校验 → 转换 → 写入 → 关闭，只有解析和转换因格式而异。
 *    - 测试框架：beforeEach → 测试体 → afterEach → 断言，Jest/Vitest 就是模板方法。
 *    - HTTP 请求封装：拼 URL → 加签名 → 发请求 → 解析响应 → 统一错误处理。
 *    - 构建工具的生命周期钩子：webpack 的 plugin hooks、Vue 的 beforeCreate/created。
 *    - 数据库访问模板：JdbcTemplate / MyBatis 的"打开连接 → 绑定参数 → 执行 → 映射结果 → 关连接"。
 *    判断信号：**好几个类的同一个方法，前 3 行和后 3 行完全一样，只有中间几行不同**。
 *    那段"完全一样"的部分就是模板，不同的部分就是子类要填的洞。
 *
 * 3. 核心语法要点
 *    - 父类的模板方法通常只写一次、被所有子类共用，因此它承担三件事：
 *        ① 固化步骤顺序；② 承载公共逻辑；③ 用 try/finally 保证资源释放。
 *    - 步骤的两种形态：固定步骤（父类实现，子类不该碰）+ 可变步骤（子类实现）。
 *    - 钩子方法的默认实现最好"什么都不做"或"原样返回"，
 *      这样忘记覆盖也不会出错；**默认实现里偷偷做副作用是陷阱**。
 *    - 覆盖钩子时如果要保留父类行为，必须 `super.xxx(...)`（JS 的 super 在 class 里可用）。
 *    - 好莱坞原则（Hollywood Principle）："Don't call us, we'll call you" ——
 *      子类不主动调用父类流程，而是被父类在合适时机回调。这正是"控制反转"的一种形态。
 *    - 钩子方法让"扩展点"显式化：读父类的模板方法，就能数清一个子类能影响哪些环节。
 *    - 与依赖注入配合：把"变化的那一步"做成构造函数里注入的对象，
 *      就得到"模板定骨架 + 策略填细节"的混合体（真实框架里最常见的形态，见第 6 节末尾）。
 *
 * 4. 常见陷阱
 *    - 子类覆盖了模板方法本身：骨架被破坏，其他子类的假设失效。
 *      JS 拦不住，只能靠命名（`run` / `import`）和注释标注"请勿覆盖"。
 *    - 覆盖钩子忘写 super：父类的默认行为（如统计、日志）静默丢失。
 *    - 父类里调用"子类才有的方法"：父类与子类强耦合，父类无法独立测试。
 *    - 钩子太多：父类变成一张有 12 个洞的筛子，子类实现时无所适从
 *      （经验值：一个模板方法暴露 2~4 个扩展点就够了）。
 *    - 继承层级过深：A → B → C → D，改 A 的一个钩子会波及全部后代
 *      —— 这叫"脆弱基类"问题（Fragile Base Class）。
 *    - 只有一处变化却硬套模板：直接写两个函数更清楚。
 *    - 子类削弱父类契约（钩子的返回值语义被改坏）→ 违反里氏替换，
 *      详见 18_solid_principles.js 的 LSP 一节。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/15_template_method.js
 *
 * 【预期输出】
 *   先展示三个导入器"复制粘贴同一套流程"的坏味道，再用模板方法重构，
 *   依次运行 CSV 订单导入、JSON 用户导入、损坏数据导入（验证 finally 关资源），
 *   演示钩子方法的默认实现与 super 陷阱，最后用表格对比模板方法与策略模式的
 *   复用方式（继承 vs 组合），并给出选择标准、代价与不适用场景。
 * ============================================================================
 */

// ===========================================================================
// 0. 基础设施：数据源与目标仓储（用内存对象模拟，绝不访问外网/文件）
// ===========================================================================

/** 中英混排按显示宽度对齐（与 13/14 号文件同款工具） */
function displayWidth(s) {
  return [...String(s)].reduce(
    (w, ch) => w + (/[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(ch) ? 2 : 1),
    0,
  );
}

/** 打印一张对齐的表格，第一行视为表头 */
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

/** 数据源：模拟"文件 / HTTP 响应 / 数据库游标"，只需能打开、读取、关闭 */
class MemorySource {
  constructor(name, content) {
    this.name = name;
    this.content = content;
    this.isOpen = false;
    this.closeCount = 0;
  }
  open() {
    if (this.isOpen) throw new Error(`数据源 ${this.name} 已被打开`);
    this.isOpen = true;
    return this.content;
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.closeCount += 1;
  }
}

/** 目标仓储：模拟数据库/消息队列，只提供批量写入 */
class MemoryTarget {
  constructor(name) {
    this.name = name;
    this.rows = [];
  }
  insertMany(rows) {
    this.rows.push(...rows);
    return rows.length;
  }
}

// ===========================================================================
// 1. 坏味道：三个导入器，前 5 行后 3 行完全一样
// ===========================================================================

console.log('--- 1. 坏味道：复制粘贴出来的导入流程 ---');

/**
 * CSV 订单导入（朴素版）
 * 注意它把"打开→解析→校验→转换→写入→关闭"整条流程都写在了自己身上。
 */
function importCsvOrdersNaive(source, target) {
  const raw = source.open();
  const lines = raw.trim().split(/\r?\n/);
  const cols = lines[0].split(',').map((s) => s.trim());
  const rows = lines.slice(1).filter(Boolean).map((line) => {
    const cells = line.split(',').map((s) => s.trim());
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
  });
  const valid = rows.filter((r) => /^\d+$/.test(r.amount_cents));
  const mapped = valid.map((r) => ({
    orderId: r.order_id,
    amount: Number(r.amount_cents) / 100,
    status: '待付款',
  }));
  const n = target.insertMany(mapped);
  source.close();
  return n;
}

/** JSON 用户导入（朴素版）：流程一模一样，只是中间的解析/转换换了 */
function importJsonUsersNaive(source, target) {
  const raw = source.open();
  const rows = JSON.parse(raw).users;
  const valid = rows.filter((u) => u.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(u.email));
  const mapped = valid.map((u) => ({ name: u.name.trim(), email: u.email.toLowerCase(), active: u.active ?? true }));
  const n = target.insertMany(mapped);
  source.close();
  return n;
}

const naiveCsv = `order_id,amount_cents,created_at
SO-1,29900,2026-01-15
SO-2,abc,2026-01-15
SO-3,8800,2026-01-16`;

console.log('  CSV 朴素版写入：', importCsvOrdersNaive(new MemorySource('orders.csv', naiveCsv), new MemoryTarget('db')));
console.log('  JSON 朴素版写入：', importJsonUsersNaive(
  new MemorySource('users.json', JSON.stringify({ users: [{ name: ' 张三 ', email: 'ZHANGSAN@Example.com' }] })),
  new MemoryTarget('db'),
));
console.log(`  问题清单：
    ✗ 每个格式都要重写一遍"打开/关闭"，一旦要加"计时""审计""错误上报"，
      必须改 N 个函数（漏一个就是线上事故）；
    ✗ 没有任何一处强制"关闭"：某个格式的 parse 抛错，连接就泄漏了；
    ✗ 步骤顺序（校验在转换之前？转换在校验之前？）各写各的，不同格式行为不一致；
    ✗ 想统一加一个"导入耗时统计"，无处下手。`);

// ===========================================================================
// 2. 模板方法重构：父类定骨架，子类只填两个洞
// ===========================================================================

console.log('\n--- 2. 模板方法重构：父类定骨架，子类填 parse / transform ---');

/**
 * 数据导入模板。
 * 骨架（run）里每一步都在注释里标了它是"固定步骤"还是"可变步骤"。
 */
class DataImporter {
  constructor({ source, target, logger = console }) {
    this.source = source;
    this.target = target;
    this.logger = logger;
    this.stats = { parsed: 0, valid: 0, written: 0, skipped: [] };
  }

  // -------------------------------------------------------------------------
  // ★模板方法：算法骨架，子类**不应该**覆盖它（JS 没有 final，靠约定约束）
  // -------------------------------------------------------------------------
  run() {
    const trace = [];
    const mark = (s) => {
      trace.push(s);
      this.logger.log(`      · ${s}`);
    };

    try {
      mark('open() —— 固定步骤：打开数据源');
      const raw = this.open();

      mark('parse() —— 【可变】子类实现：把原始文本变成本格式的行数组');
      const parsed = this.parse(raw);
      this.stats.parsed = parsed.length;

      mark('validate() —— 【钩子】默认全部通过，子类可过滤非法行');
      const valid = this.validate(parsed);
      this.stats.valid = valid.length;

      mark('transform() —— 【可变】子类实现：转成目标系统需要的结构');
      const rows = this.transform(valid);

      mark('beforeWrite() —— 【钩子】默认什么都不做');
      this.beforeWrite(rows);

      mark('write() —— 固定步骤：批量写入目标仓储');
      this.stats.written = this.write(rows);

      mark('afterWrite() —— 【钩子】默认什么都不做');
      this.afterWrite(rows);

      return { ok: true, stats: this.stats, trace };
    } catch (err) {
      mark(`onError() —— 【钩子】捕获异常：${err.message}`);
      this.onError(err); // 钩子：默认只记日志，子类可改成上报/写死信队列
      return { ok: false, error: err, stats: this.stats, trace };
    } finally {
      // ★把 close 放进 finally，是模板方法最实用的收益之一：
      //   无论中间哪一步抛错，资源都一定被释放，而且**子类不需要记得这件事**。
      mark('close() —— 固定步骤：放在 finally 里，保证一定执行');
      this.close();
    }
  }

  // ---------------- 固定步骤：父类实现，子类不该覆盖 ----------------

  open() {
    return this.source.open();
  }

  write(rows) {
    return this.target.insertMany(rows);
  }

  close() {
    this.source.close();
  }

  // ---------------- 可变步骤：子类必须实现 ----------------

  /** @abstract 子类必须实现 */
  parse(_raw) {
    throw new Error(`${this.constructor.name} 必须实现 parse(raw)`);
  }

  /** @abstract 子类必须实现 */
  transform(_rows) {
    throw new Error(`${this.constructor.name} 必须实现 transform(rows)`);
  }

  // ---------------- 钩子方法：父类给默认实现，子类可选覆盖 ----------------

  /** 默认：全部通过。覆盖时可用 this.stats.skipped 记录被剔除的行 */
  validate(rows) {
    return rows;
  }

  /** 默认：什么都不做 */
  beforeWrite(_rows) {}

  /** 默认：什么都不做 */
  afterWrite(_rows) {}

  /** 默认：只打印。子类覆盖时若想保留默认行为，请调用 super.onError(err) */
  onError(err) {
    this.logger.log(`      [钩子 onError 默认实现] 导入失败：${err.message}`);
  }
}

// ===========================================================================
// 3. 三个子类：只需要实现 parse / transform，必要时覆盖钩子
// ===========================================================================

console.log('\n--- 3. 子类一：CSV 订单导入 ---');

/** CSV 订单导入器 */
class CsvOrderImporter extends DataImporter {
  /** 【可变步骤】CSV 文本 -> 行对象数组 */
  parse(raw) {
    const lines = raw.trim().split(/\r?\n/);
    const cols = lines[0].split(',').map((s) => s.trim());
    return lines.slice(1).filter(Boolean).map((line) => {
      const cells = line.split(',').map((s) => s.trim());
      return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
    });
  }

  /** 【钩子】剔除金额非法的行 —— 覆盖了父类的"全部通过" */
  validate(rows) {
    return rows.filter((r) => {
      const ok = /^\d+$/.test(r.amount_cents ?? '');
      if (!ok) this.stats.skipped.push({ reason: '金额不是整数（单位：分）', row: r });
      return ok;
    });
  }

  /** 【可变步骤】行对象 -> 订单实体（分转元、补默认状态） */
  transform(rows) {
    return rows.map((r) => ({
      orderId: r.order_id,
      amount: Number(r.amount_cents) / 100,
      status: '待付款',
      createdAt: r.created_at,
    }));
  }
}

const csvSource = new MemorySource('orders.csv', naiveCsv);
const csvTarget = new MemoryTarget('orders 表');
const csvResult = new CsvOrderImporter({ source: csvSource, target: csvTarget }).run();
console.log('  导入结果：', JSON.stringify({ ok: csvResult.ok, ...csvResult.stats }));
console.log('  写入的数据：', JSON.stringify(csvTarget.rows));
console.log('  数据源已关闭：', csvSource.closeCount === 1, `（close 调用次数 ${csvSource.closeCount}）`);

console.log('\n--- 3.2 子类二：JSON 用户导入（覆盖两个钩子）---');

/** JSON 用户导入器：只多覆盖了一个 afterWrite 钩子，就多出了"发欢迎邮件"的能力 */
class JsonUserImporter extends DataImporter {
  parse(raw) {
    const data = JSON.parse(raw);
    if (!Array.isArray(data.users)) throw new TypeError('JSON 结构不对：缺少 users 数组');
    return data.users;
  }

  validate(rows) {
    return rows.filter((u) => {
      if (!u.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(u.email)) {
        this.stats.skipped.push({ reason: '邮箱缺失或格式非法', row: u });
        return false;
      }
      return true;
    });
  }

  transform(rows) {
    return rows.map((u, i) => ({
      id: `U-${String(i + 1).padStart(4, '0')}`,
      name: u.name.trim(),
      email: u.email.toLowerCase(),
      active: u.active ?? true,
    }));
  }

  /** 【钩子】写完之后做点别的事 —— 这是模板方法提供的"时机" */
  afterWrite(rows) {
    if (rows.length > 0) this.logger.log(`      [钩子 afterWrite] 已把 ${rows.length} 条记录投递到"欢迎邮件"队列`);
  }
}

const jsonSource = new MemorySource(
  'users.json',
  JSON.stringify({
    users: [
      { name: ' 张三 ', email: 'ZHANGSAN@Example.com' },
      { name: '李四', email: 'not-an-email' },
      { name: '王五', email: 'wangwu@example.com', active: false },
    ],
  }),
);
const jsonTarget = new MemoryTarget('users 表');
const jsonResult = new JsonUserImporter({ source: jsonSource, target: jsonTarget }).run();
console.log('  导入结果：', JSON.stringify({ ok: jsonResult.ok, ...jsonResult.stats }));
console.log('  写入的数据：', JSON.stringify(jsonTarget.rows, null, 0));
console.log('  被跳过的行：', JSON.stringify(jsonResult.stats.skipped));

console.log('\n--- 3.3 子类三：坏数据 —— 验证 finally 一定关资源 ---');

/** 模拟"第三方返回了损坏的 JSON"，parse 阶段就抛错 */
class BrokenImporter extends DataImporter {
  parse(raw) {
    throw new SyntaxError(`第 1 行第 12 列解析失败（原始内容前 20 字符：${raw.slice(0, 20)}）`);
  }
  transform() {
    return [];
  }
  /** 覆盖 onError：先调用 super 保留默认行为，再加上自己的处理 */
  onError(err) {
    super.onError(err); // ★不写这一行，父类的默认日志就静默消失了
    this.logger.log('      [钩子 onError 自定义部分] 已写入死信队列，等待人工修复');
  }
}

const brokenSource = new MemorySource('broken.json', '{"users": [{"name": 张三');
const brokenResult = new BrokenImporter({ source: brokenSource, target: new MemoryTarget('t') }).run();
console.log('  导入结果：', JSON.stringify({ ok: brokenResult.ok, error: brokenResult.error.message }));
console.log('  ★关键：即便 parse 抛了错，数据源仍然被关闭 ——', `close 调用次数 ${brokenSource.closeCount}`);

// ===========================================================================
// 4. 钩子的默认实现与 super 陷阱
// ===========================================================================

console.log('\n--- 4. 钩子方法：默认实现的"安全区"与 super 陷阱 ---');

console.log(`  钩子方法的设计原则：**默认实现必须是无害的**（什么都不做 / 原样返回 / 只记日志）。
  这样"子类忘了覆盖"的后果只是"少了个功能"，而不是"流程坏了"。

  反面教材：如果父类的 onError 默认实现是"把异常吞掉并返回空数组"，
  那么任何忘了覆盖它的子类，都会静默地导入 0 条数据而没人发现 —— 这是最危险的钩子。

  陷阱：覆盖钩子忘了 super —— 下面用一个"健忘的子类"对比：`);

class ForgetfulImporter extends BrokenImporter {
  onError(err) {
    // ✗ 忘了 super.onError(err)
    this.logger.log(`      [只自定义了一半] 收到了错误 ${err.message}，但父类默认日志丢了`);
  }
}

const forgetfulSource = new MemorySource('broken2.json', 'oops');
new ForgetfulImporter({ source: forgetfulSource, target: new MemoryTarget('t') }).run();
console.log(`    对比上面 BrokenImporter 的输出：少了 "[钩子 onError 默认实现]" 那一行。
    结论：覆盖钩子时，先问自己"父类在这一步做了什么？我要不要保留？"`);

console.log(`\n  另一个陷阱：子类覆盖了**模板方法本身**（run）。
    在 Java 里靠 final 关键字拦住，JS 里没有任何语言机制 ——
    所以命名约定很重要：本文件把骨架方法叫 run()，
    并在注释里写"请勿覆盖"，同时团队约定"模板方法内不做任何业务判断"。`);

// 抽象方法未实现的报错演示（必须 try/catch，不能让它冒泡出去）
console.log('\n  抽象方法的保护：子类忘了实现 parse 时会怎样？');
class HalfDoneImporter extends DataImporter {
  // 只实现了 transform，忘了 parse
  transform(rows) {
    return rows;
  }
}
// 注意：DataImporter.run 内部已经 try/catch，所以调用它**不会抛出**，
// 而是把失败降级成 { ok:false, error } 的返回值。用返回值验证：
const halfDoneSource = new MemorySource('x', 'y');
const halfDone = new HalfDoneImporter({ source: halfDoneSource, target: new MemoryTarget('t') }).run();
console.log(`    实际结果：ok=${halfDone.ok}，错误信息="${halfDone.error.message}"，close 次数=${halfDoneSource.closeCount}`);
console.log('    ✓ 由于 run() 统一兜底，子类的疏漏被优雅地降级为一条失败记录，进程不崩。');

// ===========================================================================
// 5. 好莱坞原则：控制反转的一种形态
// ===========================================================================

console.log('\n--- 5. 好莱坞原则：Don\'t call us, we\'ll call you ---');

console.log(`  在朴素版里，是**你**（导入函数）主动调用每个步骤，控制流在你手里；
  在模板方法里，是**父类**决定什么时候调用你的 parse/transform。
  控制权从子类交回父类 —— 这就是"控制反转"（IoC）的一种形态，
  也叫好莱坞原则：演员不要主动找导演，导演会叫你。

  这个反转带来两个后果，一好一坏：
    + 好处：公共逻辑（顺序、异常、资源）只写一次，且无法被子类绕过；
    - 代价：读代码时"谁调用了 parse"需要跳到父类才看得见，
            调试时调用栈里会多出父类那一层（"我怎么进到这个方法的？"）。

  同一个"反转"在别处的形态：
    - 观察者/发布订阅：不是你去问状态，是状态变了来通知你；
    - 依赖注入：不是你 new 依赖，是容器把依赖送进来（见 19_dependency_injection.js）；
    - 前端框架：不是你调用 render，是框架在合适的时机调用你的 render。`);

// ===========================================================================
// 6. 与策略模式的对比：继承式复用 vs 组合式复用
// ===========================================================================

console.log('\n--- 6. 同一个需求，用策略模式再写一遍（对比复用方式）---');

/**
 * 策略版：把"解析/校验/转换"打包成一个**策略对象**，
 * 流程骨架放在一个普通函数里，通过参数接收策略。
 */
const pipelineStrategies = {
  csvOrders: {
    parse(raw) {
      const lines = raw.trim().split(/\r?\n/);
      const cols = lines[0].split(',').map((s) => s.trim());
      return lines.slice(1).filter(Boolean).map((line) => {
        const cells = line.split(',').map((s) => s.trim());
        return Object.fromEntries(cols.map((c, i) => [c, cells[i]]));
      });
    },
    validate: (rows) => rows.filter((r) => /^\d+$/.test(r.amount_cents ?? '')),
    transform: (rows) => rows.map((r) => ({ orderId: r.order_id, amount: Number(r.amount_cents) / 100, status: '待付款' })),
  },
  jsonUsers: {
    parse: (raw) => JSON.parse(raw).users,
    validate: (rows) => rows.filter((u) => u.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(u.email)),
    transform: (rows) => rows.map((u) => ({ name: u.name.trim(), email: u.email.toLowerCase() })),
  },
};

/** 策略版骨架：注意它是**函数**，流程对调用方完全可见，且策略可以运行时替换 */
function runPipeline(strategy, { source, target, logger = console }) {
  let raw;
  try {
    raw = source.open();
    const parsed = strategy.parse(raw);
    const valid = strategy.validate(parsed);
    const rows = strategy.transform(valid);
    const n = target.insertMany(rows);
    logger.log(`      · 策略版导入完成：解析 ${parsed.length} 行，写入 ${n} 行`);
    return { ok: true, written: n, parsed: parsed.length };
  } catch (err) {
    logger.log(`      · 策略版导入失败：${err.message}`);
    return { ok: false, error: err };
  } finally {
    source.close();
  }
}

const stratSource = new MemorySource('orders.csv', naiveCsv);
const stratTarget = new MemoryTarget('orders 表');
console.log('  用策略版跑同一份 CSV：', JSON.stringify(runPipeline(pipelineStrategies.csvOrders, { source: stratSource, target: stratTarget })));
console.log('  资源已关闭：', stratSource.closeCount === 1);

console.log('\n  两种写法的对比表：\n');
const compareTable = [
  ['对比维度', '模板方法（继承式复用）', '策略模式（组合式复用）'],
  ['复用机制', '继承：子类 extends 父类，白盒复用', '组合：把算法对象传进来，黑盒复用'],
  ['子类/策略需要知道什么', '要知道父类的骨架、钩子名、调用时机', '只需要知道接口（三个方法的签名）'],
  ['何时绑定', '类定义时就绑定了（继承关系在定义时固定）', '运行时可以随意替换、甚至传一个临时对象'],
  ['能替换几步', '通常替换"几个步骤"，其余步骤复用父类实现', '通常替换"整套算法"，骨架由外部函数提供'],
  ['扩展方式', '新增子类（类数量增长，容易层级过深）', '新增一个对象字面量（最常见、也最轻）'],
  ['能否多来源组合', '不能：JS 只能单继承（混入 mixin 可缓解）', '能：多个策略可以自由拼装成新策略'],
  ['测试难度', '要造子类才能测父类，或者测父类时要造最简子类', '直接传一个假策略对象就能测骨架'],
  ['典型骨架宿主', '抽象基类的 run() 方法', '一个普通函数或一个 Context 类的构造参数'],
  ['典型真实例子', 'Jest 的 beforeEach/test/afterEach、Servlet 的 service()', '排序比较器、支付渠道、压缩算法、校验规则'],
];
printTable(compareTable);

console.log(`
  ★选择标准（一句话版）：
    变化点是"流程中的某几步、且步骤顺序固定不动"  -> 模板方法
    变化点是"整套算法、且需要运行时替换"          -> 策略模式

  为什么模板方法现在用得比十年前少？
    1) 继承是所有关系里耦合最强的一种，父类一改，全部子类受影响（脆弱基类）；
    2) 组合 + 函数是一等公民的 JS 里，一个对象字面量就能表达策略，比多一层类更轻；
    3) 现代框架把"骨架"放在库函数里（如 React 的渲染流程），把"变化点"做成 props/回调，
       本质上是"模板方法 + 策略"的合体，而不是纯粹的继承。

  ★真实项目里最常见的形态是两者结合：
    骨架由模板方法固定（保证顺序、异常、资源释放一致），
    而"可变的那一步"不是靠子类覆盖，而是构造时注入一个策略对象。
    下面 20 行就是这种混合体的最小形态（类似 Spring 的 JdbcTemplate）：`);

/** 混合体：骨架固定（模板方法），变化的一步靠注入（策略） */
class PipelineTemplate {
  /**
   * @param {object} hooks 变化点以对象形式注入 —— 不用继承，运行时还能换
   */
  constructor({ source, target, hooks, logger = console }) {
    this.source = source;
    this.target = target;
    this.hooks = hooks;
    this.logger = logger;
  }
  run() {
    try {
      const raw = this.source.open();
      const parsed = this.hooks.parse(raw); // 变化点 1（注入）
      const valid = (this.hooks.validate ?? ((r) => r))(parsed); // 变化点 2（可选钩子）
      const rows = this.hooks.transform(valid); // 变化点 3（注入）
      const n = this.target.insertMany(rows);
      this.logger.log(`      · 混合体导入完成：解析 ${parsed.length} 行，写入 ${n} 行`);
      return { ok: true, written: n };
    } catch (err) {
      this.logger.log(`      · 混合体导入失败：${err.message}`);
      return { ok: false, error: err };
    } finally {
      // 骨架归库代码所有：无论注入的 hooks 怎么写，资源释放都不可能被漏掉
      this.source.close();
    }
  }
}

const mixSource = new MemorySource('users.json', JSON.stringify({ users: [{ name: '王五', email: 'A@B.com' }] }));
const mixResult = new PipelineTemplate({
  source: mixSource,
  target: new MemoryTarget('users 表'),
  hooks: pipelineStrategies.jsonUsers,
}).run();
console.log('  混合体执行结果：', JSON.stringify(mixResult), '| close 次数：', mixSource.closeCount);

// ===========================================================================
// 7. 代价与什么时候不该用
// ===========================================================================

console.log('\n--- 7. 模板方法的代价与不适用场景 ---');

console.log(`【收益】
  1) 流程只写一次：顺序、异常、资源释放全部集中，子类无法绕过；
  2) 扩展点显式：读父类的 run() 就能数清子类能影响哪几步；
  3) 新增格式 = 新增一个子类，不改任何已有代码（开闭原则，见 18_solid_principles.js）；
  4) finally 兜底让"忘记关资源"这类 bug 从"每处都要小心"变成"结构上不可能发生"。

【代价】
  1) 继承耦合最强：父类加一个钩子、改一次顺序，所有子类都要重新验证；
  2) 控制流被反转：读子类代码看不出"什么时候被调用"，要跳回父类；
  3) 调试栈变深，日志里多一层父类帧；
  4) 单继承限制：一个类只能有一个父类，若它已经继承了别的基类就用不了；
  5) 类数量膨胀：3 个格式 = 3 个子类，10 个格式 = 10 个子类 + 10 个文件；
  6) 骨架方法在 JS 里拦不住覆盖，只能靠约定。

【什么时候不该用】
  1) 只有一个实现：那就是一个普通函数，不需要"模板 + 子类"两件套；
  2) 变化的是"整套算法"而不是"几步"：用策略模式，别用继承；
  3) 变化点在运行时才知道（用户选格式、配置驱动）：用策略 / 注入，继承做不到；
  4) 步骤顺序本身要变：模板方法的前提就是"顺序固定"，顺序可变请用责任链
     （见 12_chain_of_responsibility.js）；
  5) 团队规模小、代码量少：直接写两个函数、重复三行，比引入基类更划算
     （回到 13_pattern_selection.js 的"重复比错误的抽象便宜"）。

【决策口诀】
    "流程固定、几步可变" -> 模板方法；
    "只有一步可变、且要能运行时换" -> 直接把那一步做成参数或注入（最省事，常常是最优解）；
    "整套算法可变" -> 策略模式。`);

console.log('\n全部演示完毕。');
