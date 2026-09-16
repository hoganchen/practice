/**
 * ============================================================================
 * 知识点：策略模式 —— 用"数据映射"消除成堆的 if-else
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/03_factory.js（映射表思想）、06_functions（函数是一等公民）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    策略模式把"一族可互换的算法"各自封装起来，让它们可以在运行时被替换。
 *    在 JS 里它几乎总是长成这个样子：
 *        const strategies = { vip: fnA, normal: fnB, newUser: fnC };
 *        const result = strategies[key](input);
 *    也就是"把 if-else 的分支条件变成查表的键，把分支体变成表里的函数"。
 *    它的本质是**把决策依据从控制流迁移到数据结构**。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 运费/折扣计算：不同会员等级、不同地区、不同活动规则各不相同。
 *    - 表单校验：不同字段类型（必填、邮箱、手机号、数字区间）各有校验规则。
 *    - 支付渠道：微信/支付宝/银联，调用参数和回调处理都不同。
 *    - 文件导出：CSV / XLSX / PDF，格式化成不同字节流。
 *    - 排序/压缩：同一接口下的多种算法实现（这也是策略模式的经典出处）。
 *
 * 3. 核心语法要点
 *    - 策略对象（策略表）：用对象字面量或 Map 把 key 映射到函数。
 *    - 上下文（Context）：持有"当前策略"并对外提供统一入口，
 *      使用方不直接调用策略函数，而是 `context.execute(input)`。
 *    - 策略的签名必须一致：都接受同样的参数、返回同样形状的结果 ——
 *      接口不一致的策略表就退化成了另一个 switch。
 *    - 策略可以是纯函数（无状态，最简单）或有状态的对象（有 setup/teardown）。
 *    - 与工厂的区别：工厂关心"创建什么对象"，策略关心"用哪种算法"。
 *      两者经常组合使用：工厂返回一个策略对象。
 *    - 开闭原则：新增策略 = 往表里加一条数据，不动任何已有分支代码。
 *
 * 4. 常见陷阱
 *    - 参数不一致：有的策略收 (order)，有的收 (order, user)，调用方又得写 if。
 *    - 策略表用普通对象时被原型链污染：'toString' / 'constructor' 这种 key
 *      会命中原型上的属性，返回一个函数但完全不是你的策略。
 *      解决：用 Map，或 Object.create(null)，或 hasOwnProperty 检查。
 *    - 丢失 this：把策略从对象上解构出来单独调用，若策略内部用了 this 就会炸。
 *    - 只有两个分支也硬套策略表：代码反而更长更难懂（见第 6 节）。
 *    - 策略里偷偷改上下文状态：策略应当尽量无副作用，否则"可互换"就成了空话。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/07_strategy.js
 *
 * 【预期输出】
 *   先用一段"充满 if-else 的运费计算"演示坏味道并逐条列出问题，
 *   再用策略模式重构（策略表 + 上下文类），接着演示校验器与可插拔排序，
 *   最后对比两者的代码量与适用边界，并列出策略模式的代价与不适用场景。
 * ============================================================================
 */

// ===========================================================================
// 1. 坏版本：充满 if-else 的运费计算
// ===========================================================================

console.log('--- 1. 坏版本：if-else 堆砌 ---');

/**
 * 反面教材：根据会员等级 + 地区计算运费。
 * 每加一个等级/地区，就要在多个 if-else 里各加一个分支。
 */
function calcShippingFeeBad(level, region, weightKg) {
  let fee;
  if (level === 'vip') {
    if (region === 'north') {
      fee = 0; // VIP 北方包邮
    } else if (region === 'south') {
      fee = 0;
    } else {
      fee = 5;
    }
  } else if (level === 'normal') {
    if (region === 'north') {
      fee = 8 + weightKg * 2;
    } else if (region === 'south') {
      fee = 10 + weightKg * 2.5;
    } else {
      fee = 15 + weightKg * 3;
    }
  } else if (level === 'newUser') {
    // 新人首单免运费（不管地区），但这是一个"例外中的例外"
    fee = 0;
  } else {
    // 未知等级要有兜底，否则 fee 是 undefined，下游计算出 NaN
    throw new RangeError(`未知会员等级：${level}`);
  }
  // 一个横切规则：超过 20kg 加收超重费
  if (weightKg > 20) fee += (weightKg - 20) * 1.5;
  return Math.round(fee * 100) / 100;
}

console.log('vip/北方/3kg   =', calcShippingFeeBad('vip', 'north', 3));
console.log('normal/南方/5kg =', calcShippingFeeBad('normal', 'south', 5));
console.log('newUser/北方/2kg =', calcShippingFeeBad('newUser', 'north', 2));
console.log('normal/北方/25kg =', calcShippingFeeBad('normal', 'north', 25));

console.log('\n坏味道清单：');
console.log(`  1) 分支爆炸：等级 3 种 × 地区 3 种 = 9 条路径，再加等级就要乘一遍。
  2) 横切规则混在一起：超重费那段和等级判断纠缠在一个函数里。
  3) 无法单测一个规则：想测"南方普通会员的算法"，只能整体调用并构造输入。
  4) 无法运行时替换：运营想临时改某个地区的规则，只能改代码重新发布。
  5) 违反开闭原则：新增等级要动这个函数，意味着所有回归测试都要重跑。
  6) 可读性差：想知道 "vip 的规则是什么"，得在嵌套 if 里一层层找。`);

// ===========================================================================
// 2. 重构：策略表 + 上下文类
// ===========================================================================

console.log('\n--- 2. 重构：策略表 + 上下文 ---');

/**
 * 第一步：把"每个等级怎么算"抽成一个独立函数。
 * 统一签名 (ctx) => fee，ctx 里带齐所有需要的数据。
 * 这样每个策略都是纯函数、可单独测试、可单独替换。
 */
const shippingStrategies = new Map([
  [
    'vip',
    // VIP：全国包邮（这是一种"策略"，不是特例代码）
    () => 0,
  ],
  [
    'normal',
    (ctx) => {
      // 普通会员：按地区查"基础价 + 每公斤单价"这张小表
      const table = {
        north: { base: 8, perKg: 2 },
        south: { base: 10, perKg: 2.5 },
        other: { base: 15, perKg: 3 },
      };
      const rate = table[ctx.region] ?? table.other;
      return rate.base + ctx.weightKg * rate.perKg;
    },
  ],
  [
    'newUser',
    // 新人：首单免运费（这里简化成"永远免"，真实项目会看 isFirstOrder）
    (ctx) => (ctx.isFirstOrder ? 0 : 12),
  ],
]);

/**
 * 上下文（Context）：持有策略表 + 横切规则，对外只暴露一个 calculate。
 * 使用方不需要知道有哪些策略，只需要传 level。
 */
class ShippingCalculator {
  #strategies;

  constructor(strategies) {
    this.#strategies = strategies;
  }

  /** 运行时替换/新增策略：这就是"可插拔" */
  register(level, strategy) {
    this.#strategies.set(level, strategy);
    return this;
  }

  /** 列出所有已注册的策略名，便于报错时提示 */
  get availableLevels() {
    return [...this.#strategies.keys()];
  }

  calculate({ level, region = 'other', weightKg = 0, isFirstOrder = false }) {
    // Map 查不到时不会命中原型上的 toString/constructor，
    // 这是用 Map 而不是普通对象的直接好处（见第 5 节陷阱）
    const strategy = this.#strategies.get(level);
    if (!strategy) {
      throw new RangeError(`未知会员等级：${level}（可用：${this.availableLevels.join(', ')}）`);
    }
    // 策略只负责"基础运费"，横切规则由上下文统一处理
    let fee = strategy({ level, region, weightKg, isFirstOrder });
    // 横切规则：超重费。它写在上下文里，所有策略自动共享，不会漏掉
    if (weightKg > 20) fee += (weightKg - 20) * 1.5;
    return Math.round(fee * 100) / 100;
  }
}

const calculator = new ShippingCalculator(shippingStrategies);

// 与坏版本逐一对照，验证结果一致
const cases = [
  { level: 'vip', region: 'north', weightKg: 3 },
  { level: 'normal', region: 'south', weightKg: 5 },
  // 注意 isFirstOrder：坏版本把"新人免运费"写死成永远免，
  // 策略版本则显式接收 isFirstOrder 参数 —— 这就是"策略把隐含假设变成了显式输入"。
  { level: 'newUser', region: 'north', weightKg: 2, isFirstOrder: true },
  { level: 'normal', region: 'north', weightKg: 25 },
];
for (const c of cases) {
  const bad = calcShippingFeeBad(c.level, c.region, c.weightKg);
  const good = calculator.calculate(c);
  console.log(
    `${c.level.padEnd(8)} ${c.region.padEnd(6)} ${String(c.weightKg).padStart(3)}kg  ->  策略模式 ${good}  |  if-else ${bad}  |  一致：${good === bad}`,
  );
}

// 运行时新增一个策略：不改任何已有代码（开闭原则的直接体现）
calculator.register('svip', (ctx) => (ctx.weightKg > 50 ? 20 : 0));
console.log('动态注册 svip 后：', calculator.calculate({ level: 'svip', weightKg: 10 }));
console.log('当前可用等级：', calculator.availableLevels.join(', '));

// 未知等级：报错信息里带上可用列表
try {
  calculator.calculate({ level: 'platinum', weightKg: 1 });
} catch (err) {
  console.log('未知等级被拦下：', err.name, '-', err.message);
}

// ===========================================================================
// 3. 策略的第二种形态：验证规则表
// ===========================================================================

console.log('\n--- 3. 策略的第二种形态：表单校验规则 ---');

/**
 * 校验是策略模式最贴合的场景之一：
 * 每个"规则"就是一个策略，规则的**名字**就是键。
 * 于是"某字段有哪些规则"变成了一份数据：[['required'], ['minLength', 6], ['email']]
 * —— 校验逻辑可以来自配置、来自后端下发的 schema，而不是写死在代码里。
 */
const validators = new Map([
  ['required', (value) => (value !== undefined && value !== null && value !== '' ? null : '不能为空')],
  ['email', (value) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : '邮箱格式不正确')],
  [
    'minLength',
    (value, len) => (String(value).length >= len ? null : `长度不能少于 ${len} 个字符`),
  ],
  [
    'maxLength',
    (value, len) => (String(value).length <= len ? null : `长度不能超过 ${len} 个字符`),
  ],
  ['numeric', (value) => (Number.isFinite(Number(value)) ? null : '必须是数字')],
  [
    'inRange',
    (value, [min, max]) =>
      Number(value) >= min && Number(value) <= max ? null : `必须在 ${min} 到 ${max} 之间`,
  ],
]);

/**
 * 用一张"字段 -> 规则列表"的配置驱动整个校验流程。
 * 注意这里没有任何 if-else —— 分支全部变成了查表。
 */
function validate(data, schema) {
  const errors = [];
  for (const [field, rules] of Object.entries(schema)) {
    for (const [ruleName, arg] of rules) {
      const rule = validators.get(ruleName);
      if (!rule) throw new RangeError(`未注册的校验规则：${ruleName}`);
      const message = rule(data[field], arg);
      if (message) {
        errors.push({ field, rule: ruleName, message });
        // 大多数表单希望"一个字段只报第一个错"，所以这里 break
        break;
      }
    }
  }
  return errors;
}

const schema = {
  username: [['required'], ['minLength', 3], ['maxLength', 12]],
  email: [['required'], ['email']],
  age: [['numeric'], ['inRange', [18, 120]]],
};

const bad = validate({ username: 'ab', email: 'not-an-email', age: '999' }, schema);
console.log('校验失败的结果：');
for (const e of bad) console.log(`  - ${e.field} [${e.rule}] ${e.message}`);

const goodData = validate({ username: 'alice', email: 'alice@example.com', age: '30' }, schema);
console.log('合法数据的错误数量：', goodData.length, '（空数组 = 全部通过）');

// ===========================================================================
// 4. 策略的第三种形态：可插拔排序
// ===========================================================================

console.log('\n--- 4. 策略的第三种形态：可插拔排序 ---');

const products = [
  { name: '键盘', price: 199, sales: 1200 },
  { name: '鼠标', price: 89, sales: 3400 },
  { name: '显示器', price: 1299, sales: 300 },
];

/** 策略表：键是"用户能看懂的名字"，值是比较函数 */
const sorters = {
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  salesDesc: (a, b) => b.sales - a.sales,
};

/** 上下文：把"用户给的排序名"翻译成比较函数，并对空值做兜底 */
function sortProducts(list, sortBy) {
  const cmp = sorters[sortBy];
  if (!cmp) {
    // 兜底策略：不认识的排序名就用默认排序，而不是崩溃
    // （注意：这里展示了"策略表 + 默认策略"是常见组合）
    return [...list].sort(sorters.salesDesc);
  }
  return [...list].sort(cmp); // 不修改入参，返回新数组
}

console.log('按销量降序（默认）：', sortProducts(products, 'unknown').map((p) => p.name).join(' > '));
console.log('按价格升序：        ', sortProducts(products, 'priceAsc').map((p) => `${p.name}(${p.price})`).join(' < '));
console.log('按价格降序：        ', sortProducts(products, 'priceDesc').map((p) => `${p.name}(${p.price})`).join(' > '));

// ===========================================================================
// 5. 陷阱：策略表用普通对象时的原型链污染
// ===========================================================================

console.log('\n--- 5. 陷阱：普通对象做策略表会被原型链污染 ---');

// 反面：用普通对象当策略表
const objStrategies = {
  vip: () => 0,
  normal: () => 10,
};
// 'toString' 不在表里，但 objStrategies['toString'] 是存在的（继承自 Object.prototype）
console.log("objStrategies['toString'] 存在吗？", typeof objStrategies['toString']);
console.log("objStrategies['constructor'] 存在吗？", typeof objStrategies['constructor']);
console.log('于是下面这行不会报错，而是"调用了一个完全不相关的函数"：');
try {
  // 这行会返回 '[object Undefined]'，而不是抛"未知策略"
  console.log("  objStrategies['toString']() =>", objStrategies['toString']());
} catch (err) {
  console.log('  （抛错了）', err.message);
}
console.log('这就是"静默的错误行为"，比直接抛错危险得多。');

// 正确做法 1：用 Map（has/get 只看自己的键）
const mapStrategies = new Map(Object.entries(objStrategies));
console.log("Map 版本查 'toString'：", mapStrategies.get('toString'));

// 正确做法 2：用 Object.create(null) 创建一个没有原型的"裸对象"
const nullProtoStrategies = Object.assign(Object.create(null), objStrategies);
console.log("Object.create(null) 版本查 'toString'：", nullProtoStrategies['toString']);

// 正确做法 3：查表时先做 own-property 检查
const hasOwn = Object.prototype.hasOwnProperty.call(objStrategies, 'toString');
console.log('hasOwnProperty 检查结果：', hasOwn, '（false = 不是自己的键，不可用）');

// ===========================================================================
// 6. 何时不该用策略模式
// ===========================================================================

console.log('\n--- 6. 策略模式 vs if-else：什么时候别用 ---');

console.log(`【坏版本的问题不在"用了 if"，而在这三点】
  1) 嵌套：等级里再嵌地区，路径数相乘；
  2) 重复：每个分支里都在写相似的表达式；
  3) 不可扩展：改一个规则要动整个函数。

【如果只有 2 个分支、且逻辑各一行，if-else 更好】
  function formatPrice(v, currency) {
    return currency === 'CNY' ? \`¥\${v}\` : \`$\${v}\`;   // 一行三目，一眼看懂
  }
  硬改成策略表会变成：
    const formatters = { CNY: v => \`¥\${v}\`, USD: v => \`$\${v}\` };
    const formatPrice = (v, c) => (formatters[c] ?? formatters.CNY)(v);
  代码更长、跳转更多、收益为零 —— 这是典型的"为了模式而模式"。

【判断标准（可操作）】
  - 分支数 >= 3，或分支里还有嵌套 -> 考虑策略表；
  - 同一个分支逻辑在多处出现（重复）-> 必须抽策略；
  - 分支需要"运行时增删/由配置驱动"-> 必须用策略表；
  - 分支只有 1~2 个、且永远不变 -> if-else / 三目 / 可选链就够；
  - 分支之间需要共享大量中间状态 -> 策略表会把状态切碎，
    此时保持一个函数反而更清楚。`);

// ===========================================================================
// 7. 代价
// ===========================================================================

console.log('\n--- 7. 策略模式的代价 ---');

console.log(`  1) 多一层间接：读代码要"跳两次"——先看调用点的 key，
     再翻到策略表里找对应函数。IDE 的跳转在动态 key 上会失效。
  2) 调试链路变长：调用栈里多一层 context 帧，出错时要先判断"用的是哪个策略"。
  3) 需要额外约定：策略签名必须统一，通常还得写一句"所有策略必须返回 number"，
     这种口头契约没有编译器保障，靠 code review 与测试。
  4) 策略表容易变成"杂物间"：什么都往里塞，最终变成一堆只有名字相关的函数。
     应按领域拆分（shippingStrategies / paymentStrategies 各自独立）。
  5) 过度抽象的诱惑：把每个 if 都改成策略是新手最常见的过度设计。
     记住：**模式是用来消除痛点的，不是用来消除 if 的。**

判断口诀：把这段代码给同事看，问他"新增一种类型要改几个文件"。
  如果答案是"1 个文件里的 1 张表"，策略表就是对的；
  如果答案是"加个 if 就行"，那原来的 if-else 就是对的。`);

console.log('\n全部演示完毕。');
