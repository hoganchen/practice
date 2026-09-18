/**
 * ============================================================================
 * 知识点：代码风格与最佳实践清单 —— 命名、单一职责、早返回、隐式转换、const、可选链
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】入门
 * 【前置知识】32_security_and_best_practices/01_input_validation.js（输入校验，与"避免隐式转换"相关）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    代码风格不是"审美问题"，而是**沟通问题**：代码被阅读的次数远多于被编写的次数。
 *    一份好的风格约定，目标是让"读代码的人"花更少的时间理解"这段代码在干什么、
 *    为什么这么干"。本文件把最常用、收益最高的十条约定整理成一份清单：
 *      (1) 命名：camelCase / PascalCase / UPPER_SNAKE，见名知意，避免缩写与单字母
 *      (2) 函数长度：单一职责，超过约 30 行就该考虑拆
 *      (3) 早返回（guard clause）：消除嵌套金字塔
 *      (4) 避免隐式转换：=== 而非 ==、小心 + 号歧义、布尔陷阱、Number.isNaN
 *      (5) const 优先 > let > 永不 var
 *      (6) 可选链 ?. 与空值合并 ??
 *      (7) 避免魔法数字：提取具名常量
 *      (8) 注释写"为什么"，而不是"是什么"
 *      (9) 风格一致性比风格本身更重要
 *     (10) 用 ESLint / Prettier 自动化，而不是靠人肉 review
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) 调试成本：一个叫 `d` 的变量、一个 200 行的函数、一个五层嵌套的 if，
 *        会让排查线上问题的时间成倍增加。
 *    (b) 协作成本：代码评审里一半的争论都源于"这段为什么这么写"，
 *        而其中很多分歧本可以由一条统一约定消解掉。
 *    (c) 事故预防：隐式转换、可变作用域、少判一个 null —— 这些"风格问题"
 *        实际上是最常见的一类 bug 来源（而不是"不够优雅"这种小事）。
 *    (d) 重构前提：只有代码结构清晰、职责单一，安全地做改动才有可能。
 *
 * 3. 核心语法要点
 *    (a) 命名惯例（社区约定俗成，不是语言强制）：
 *        · camelCase 变量与函数：`userName`、`fetchOrders`
 *        · PascalCase 类与构造函数：`OrderService`、`class User {}`
 *        · UPPER_SNAKE_CASE 真正的常量：`MAX_RETRY_COUNT`、`API_BASE_URL`
 *        · 下划线前缀通常留给 Python 风格的"私有"，JS 里用 `#field` 或闭包表达私有
 *        · 布尔变量用 is/has/can/should 开头：`isActive`、`hasPermission`
 *        · 函数名用动词开头：`getUser`、`parseInput`；返回布尔的用 `isValid(x)`
 *    (b) 早返回（guard clause）：把"异常情况"提前 return 掉，让主干路径保持在最外层。
 *    (c) 严格相等 `===` / `!==` 不做类型转换；`==` 会做一堆令人意外的转换。
 *    (d) `+` 号既做加法又做字符串拼接：只要有一边是字符串，结果就是字符串。
 *    (e) 假值（falsy）只有 8 个：false、0、-0、0n、''、null、undefined、NaN。
 *        注意 `[]` 和 `{}` 都是真值（truthy）—— `if ([])` 会进分支。
 *    (f) `isNaN('abc')` 是 true（它先转数字），`Number.isNaN('abc')` 是 false
 *        （只在参数真的是 NaN 时才 true）。判断"是不是 NaN"用后者。
 *    (g) `const` 只约束"绑定不能被重新赋值"，**不**代表值不可变（对象仍可改，见 06 篇）。
 *    (h) `?.` 在左侧为 null/undefined 时短路返回 undefined；`??` 只在左侧为
 *        null/undefined 时取右侧（所以 `0 ?? 5` 是 0，而 `0 || 5` 是 5）。
 *    (i) 魔法数字：代码里直接出现的 `86400`、`3`、`0.8` 这类数字，应提成具名常量。
 *
 * 4. 常见陷阱
 *    - `==` 的经典翻车：`'' == 0` 为 true、`null == undefined` 为 true、
 *      `[] == false` 为 true —— 用 `===` 可以一次性避开这一整类问题。
 *    - 用 `if (arr.length)` 判断数组非空没问题，但用 `if (obj)` 判断对象非空**是错的**：
 *      `{}` 是真值，空对象也会进分支。要用 `Object.keys(obj).length > 0`。
 *    - `if (count)` 在 count 为 0 时判为假 —— "数量为 0"和"没设置数量"被混为一谈。
 *    - 用 `||` 提供默认值时把合法的 0 / '' / false 一起干掉了（该用 `??`）。
 *    - 过度早返回变成"散弹式返回"：一个函数有十几个 return 点也难读，
 *      关键是"减少嵌套 + 主干凸出"，而不是"return 越多越好"。
 *    - 注释写"是什么"：`i++; // i 加 1` 毫无价值，还容易过期；
 *      有价值的是"为什么"：`// 这里必须 +1，因为协议规定序号从 1 开始`。
 *    - 把风格当信仰：团队为"2 空格还是 4 空格"吵一周 —— 那就交给 Prettier 决定，
 *      人的时间应该花在"为什么"上。
 *    - 只靠人肉 review 守风格：约定会疲劳、会被遗忘；让工具去守，人才有余力看逻辑。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/10_code_style_guide.js
 *
 * 【预期输出】
 *   每个小节都用"坏例子（只在注释里）+ 好例子（真实运行）+ 打印输出"的方式对照演示：
 *   变量命名、函数拆分、早返回与嵌套金字塔、隐式转换的各种坑、
 *   const/let 的作用域差异、可选链与空值合并的取值差别、魔法数字提取、注释的价值。
 *   全程退出码 0。
 * ============================================================================
 */

// ============================================================================
// 小节 1：命名 —— 名字是最便宜的文档
// ============================================================================
console.log('--- 1. 命名规范：名字是最便宜的文档 ---');

// 坏例子（只写在这里，不实际使用）：
//   const d = new Date();                    // d 是什么？日期？数据？距离？
//   const u = users.filter(x => x.a);         // u / x / a 全无信息
//   function calc(a, b) { return a * b; }     // 计算什么？a 和 b 是什么？
//   const list = [];                          // list 装的是什么？

// 好例子：同样的逻辑，名字自带说明
/** 用户状态到展示文案的映射。 */
const USER_STATUS_LABEL = {
  active: '启用',
  disabled: '已禁用',
};

/**
 * 计算含税总价。
 * @param {number} unitPrice 单价（不含税）
 * @param {number} quantity 数量
 * @param {number} taxRate 税率（如 0.13 表示 13%）
 * @returns {number} 含税总价
 */
function calculateTotalWithTax(unitPrice, quantity, taxRate) {
  return unitPrice * quantity * (1 + taxRate);
}

console.log('  命名惯例速查表：');
const namingRules = [
  ['camelCase', '变量、函数', 'userName、fetchOrders、calculateTotalWithTax'],
  ['PascalCase', '类、构造函数、类型', 'OrderService、class User、AppError'],
  ['UPPER_SNAKE_CASE', '真正的常量（配置、上限、枚举值）', 'MAX_RETRY_COUNT、API_BASE_URL'],
  ['is/has/can/should 开头', '布尔值变量', 'isActive、hasPermission、canDelete'],
  ['动词开头', '函数名', 'getUser、parseInput、calculateTotalWithTax'],
];
for (const [pattern, usage, examples] of namingRules) {
  console.log(`    ${pattern.padEnd(22)} 用于 ${usage.padEnd(26)} 例如 ${examples}`);
}

console.log(`\n  对比：`);
console.log(`    坏名字 calc(a, b)   -> 猜不出参数含义，只能去读实现`);
console.log(`    好名字 calculateTotalWithTax(unitPrice, quantity, taxRate)`);
console.log(`      调用效果: calculateTotalWithTax(100, 3, 0.13) = ${calculateTotalWithTax(100, 3, 0.13)}`);
console.log(`      （末尾的 9999994 是 IEEE 754 浮点数的经典表现，涉及金额时应以"分"为单位用整数运算，`);
console.log(`        或使用专门的十进制库 —— 这是另一个话题，但它同样是"看起来没问题"的坑。）`);
console.log(`    好名字 USER_STATUS_LABEL.active = ${USER_STATUS_LABEL.active}`);
console.log('  关于缩写与单字母：唯一被广泛接受的例外是循环下标 i / j / k，');
console.log('    以及约定俗成的 id、url、api。除此之外，缩写只会增加理解成本。');

// ============================================================================
// 小节 2：函数长度与单一职责
// ============================================================================
console.log('\n--- 2. 函数长度：超过约 30 行就该考虑拆 ---');

// 坏例子（只在注释里展示）：一个函数同时做"校验 + 计算 + 格式化 + 打印"
//   function processOrder(order) {
//     if (!order) { return null; }                       // 校验
//     if (order.items.length === 0) { return null; }      // 校验
//     let total = 0;
//     for (const item of order.items) { total += item.price * item.qty; }  // 计算
//     if (order.coupon) { total = total * 0.8; }          // 计算
//     const text = '￥' + total.toFixed(2);               // 格式化
//     console.log('订单金额: ' + text);                    // 输出
//     return { total, text };
//   }
//   问题：四个职责混在一起；想单独测试"计算"必须构造完整的 order；
//         想复用"计算"就得连打印一起带走。

// 好例子：拆成三个各司其职的小函数，每个都能单独测试与复用
/**
 * 校验订单是否可处理。
 * @param {{items?: Array<{price: number, qty: number}>, coupon?: string}} order
 * @returns {{ok: true} | {ok: false, reason: string}}
 */
function validateOrder(order) {
  if (order === null || typeof order !== 'object') {
    return { ok: false, reason: '订单必须是对象' };
  }
  if (!Array.isArray(order.items) || order.items.length === 0) {
    return { ok: false, reason: '订单不能为空' };
  }
  return { ok: true };
}

/** 优惠券折扣率表（提取成常量，见小节 7 的"魔法数字"）。 */
const COUPON_DISCOUNT = { SAVE20: 0.8 };

/**
 * 计算订单总价（纯函数：只依赖入参，不产生副作用）。
 * @param {{items: Array<{price: number, qty: number}>, coupon?: string}} order
 * @returns {number} 折后总价
 */
function calculateOrderTotal(order) {
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  // 用 ?? 而不是 ||：折扣率理论上不会是 0，但用 ?? 表达"只有缺失才用默认值"更准确
  const discount = COUPON_DISCOUNT[order.coupon] ?? 1;
  return subtotal * discount;
}

/**
 * 把金额格式化成"￥12.34"。
 * @param {number} amount
 * @returns {string}
 */
function formatCurrency(amount) {
  return `￥${amount.toFixed(2)}`;
}

console.log('  坏例子：一个 processOrder 函数同时负责校验、计算、格式化、打印（约 10 行就有 4 个职责）');
console.log('  好例子：拆成 validateOrder / calculateOrderTotal / formatCurrency 三个小函数');
const sampleOrder = { items: [{ price: 100, qty: 2 }, { price: 50, qty: 1 }], coupon: 'SAVE20' };
const validation = validateOrder(sampleOrder);
console.log(`    validateOrder(order)        = ${JSON.stringify(validation)}`);
const orderTotal = calculateOrderTotal(sampleOrder);
console.log(`    calculateOrderTotal(order)  = ${orderTotal}   // (100*2 + 50*1) * 0.8`);
console.log(`    formatCurrency(...)         = ${formatCurrency(orderTotal)}`);
console.log('  拆分带来的好处：');
console.log('    - calculateOrderTotal 是纯函数，测试时不用构造完整订单，也不用 mock 控制台；');
console.log('    - formatCurrency 可以在别处复用（发票、报表、导出）；');
console.log('    - 每个函数都能一眼看完，不需要滚动屏幕。');
console.log('  "约 30 行"不是硬性红线，判断标准是：**能不能用一句话说清它做了什么**。');
console.log('  说清不了，就说明它有多个职责，该拆了。');

// ============================================================================
// 小节 3：早返回（guard clause）—— 消除嵌套金字塔
// ============================================================================
console.log('\n--- 3. 早返回：把嵌套金字塔拉直 ---');

/**
 * 【坏例子】多层嵌套：主干逻辑被推到最深处，读代码时要在脑子里维护一堆条件。
 * 保留它只是为了对比输出，说明"同样的逻辑，嵌套版本有多难读"。
 * @param {object} user
 * @returns {string}
 */
function getDiscountNested(user) {
  if (user) {
    // 第 1 层
    if (user.isActive) {
      // 第 2 层
      if (user.membership) {
        // 第 3 层
        if (user.membership.level === 'gold') {
          // 第 4 层
          return '8 折';
        } else {
          return '9 折';
        }
      } else {
        return '无折扣';
      }
    } else {
      return '账号已停用';
    }
  } else {
    return '无用户';
  }
}

/**
 * 【好例子】早返回：异常情况提前退场，主干路径留在最外层。
 * @param {object} user
 * @returns {string}
 */
function getDiscountFlat(user) {
  // 守卫 1：没有用户 -> 直接返回
  if (!user) return '无用户';
  // 守卫 2：账号停用 -> 直接返回
  if (!user.isActive) return '账号已停用';
  // 守卫 3：没会员信息 -> 直接返回
  if (!user.membership) return '无折扣';

  // 走到这里，前提条件全部成立 —— 主干逻辑不再需要任何缩进
  if (user.membership.level === 'gold') return '8 折';
  return '9 折';
}

const discountCases = [
  ['无用户', null],
  ['账号停用', { isActive: false }],
  ['无会员信息', { isActive: true }],
  ['金卡会员', { isActive: true, membership: { level: 'gold' } }],
  ['普通会员', { isActive: true, membership: { level: 'silver' } }],
];
console.log('  两种写法输出完全一致（说明重构没有改变行为）：');
console.log(`    场景              | 嵌套版        | 早返回版`);
for (const [label, user] of discountCases) {
  const a = getDiscountNested(user);
  const b = getDiscountFlat(user);
  const same = a === b ? '✓' : '✗';
  console.log(`    ${label.padEnd(16)} | ${a.padEnd(12)} | ${b.padEnd(12)} ${same}`);
}
console.log('\n  可读性对比：');
console.log(`    嵌套版：最大缩进 4 层，5 个 return 分散在金字塔的各层里，`);
console.log(`            第 4 层的 '8 折' 才是主干逻辑，却被推到了屏幕最右`);
console.log(`    早返回：最大缩进 1 层，3 个守卫把异常情况一次说完，`);
console.log(`            剩下的代码"默认前提都成立"，可以直接读`);
console.log('  经验值：超过 2~3 层嵌套就该考虑用早返回拉平。');
console.log('  注意别走极端：一个函数几十个 return 点同样难读 ——');
console.log('    目标是"减少嵌套、让主干凸出"，而不是"return 越多越好"。');

// ============================================================================
// 小节 4：避免隐式转换 —— 这一节能消灭一整类 bug
// ============================================================================
console.log('\n--- 4. 避免隐式转换：== vs ===、+ 号歧义、布尔陷阱、NaN ---');

// ---- 4.1 == 与 === ----
console.log('  [4.1] == 与 ===（=== 不做类型转换，== 会）');
const equalityCases = [
  ["'1' == 1", '1' == 1, "'1' === 1", '1' === 1],
  ["'' == 0", '' == 0, "'' === 0", '' === 0],
  ['null == undefined', null == undefined, 'null === undefined', null === undefined],
  ['[] == false', [] == false, '[] === false', [] === false],
  ["'0' == false", '0' == false, "'0' === false", '0' === false],
];
console.log(`    表达式                | == 结果 | === 结果`);
for (const [exprLoose, loose, exprStrict, strict] of equalityCases) {
  console.log(`    ${exprLoose.padEnd(22)} | ${String(loose).padEnd(7)} | ${strict}`);
}
console.log('  结论：== 的转换规则记不住也没关系 —— 用 === 就不用记了。');
console.log('  唯一常见的例外是 `x == null`（同时判断 null 和 undefined），');
console.log('  但这个场景用 `x == null` 之外，也可以写 `x === null || x === undefined`，更直白。');

// ---- 4.2 + 号的歧义 ----
console.log('\n  [4.2] + 号既是加法又是字符串拼接');
const plusCases = [
  ["'2' + 1", '2' + 1],
  ["'2' - 1", '2' - 1],
  ["2 + 1 + '3'", 2 + 1 + '3'],
  ["'1' + 2 + 3", '1' + 2 + 3],
  ['1 + true', 1 + true],
  ["1 + 'true'", 1 + 'true'],
];
for (const [expr, result] of plusCases) {
  console.log(`    ${expr.padEnd(16)} = ${JSON.stringify(result).padEnd(10)} (${typeof result})`);
}
console.log(`  注意最后两行：1 + true = 2（true 变 1），但 1 + 'true' = '1true'（变成拼接）。`);
console.log('  规则：只要任意一边是字符串，+ 就是拼接；否则是数值加法（会触发 ToNumber 转换）。');
console.log('  实践建议：算术前先把字符串显式转成数字（Number(x) / parseInt(x, 10)），');
console.log('            拼接时用模板字符串，别用 + —— 意图清晰，也不会被转换规则坑到。');

// ---- 4.3 布尔转换陷阱 ----
console.log('\n  [4.3] 真值 / 假值（falsy）陷阱');
const falsyValues = [false, 0, -0, 0n, '', null, undefined, NaN];
console.log(`    JS 里只有 ${falsyValues.length} 个假值：`);
console.log('      false、0、-0、0n（BigInt 零）、""（空字符串）、null、undefined、NaN');
console.log('    注意：直接把它们拼成字符串会分不清 —— String(-0) 是 "0"，String(0n) 也是 "0"，');
console.log('          所以这里用文字逐个列出来，而不是靠打印值去分辨。');
const truthyTraps = [
  ['Boolean([])', Boolean([]), '空数组是**真值**！'],
  ['Boolean({})', Boolean({}), '空对象是**真值**！'],
  ['Boolean("0")', Boolean('0'), '非空字符串就是真值，哪怕内容是 "0"'],
  ['Boolean(" ")', Boolean(' '), '空格字符串也是真值'],
  ['Boolean("false")', Boolean('false'), '字符串 "false" 是真值'],
  ['Boolean(0)', Boolean(0), '数字 0 才是假值'],
];
for (const [expr, result, note] of truthyTraps) {
  console.log(`    ${expr.padEnd(18)} = ${String(result).padEnd(6)} // ${note}`);
}
console.log('  踩坑现场：');
/**
 * 【坏例子】用 if (obj) 判断"对象非空"。
 * @param {object} obj
 * @returns {string}
 */
function checkNonEmptyBad(obj) {
  // 空对象 {} 是真值，所以这个判断对空对象依然会"通过"
  return obj ? '有内容' : '空';
}
/**
 * 【好例子】用 Object.keys().length 判断，或者干脆不做这种判断。
 * @param {object} obj
 * @returns {string}
 */
function checkNonEmptyGood(obj) {
  if (obj === null || typeof obj !== 'object') return '不是对象';
  return Object.keys(obj).length > 0 ? '有内容' : '空';
}
console.log(`    checkNonEmptyBad({})  = ${checkNonEmptyBad({})}   <- 空对象被判成"有内容"，错了`);
console.log(`    checkNonEmptyGood({}) = ${checkNonEmptyGood({})}   <- 正确`);
console.log(`    checkNonEmptyGood({a:1}) = ${checkNonEmptyGood({ a: 1 })}`);
console.log('  另一个经典坑：`if (count)` 在 count 为 0 时进不去分支 ——');
console.log('    "数量为 0" 和 "没设置数量" 是两件事，要分开判断（用 === undefined 或 ??）。');

// ---- 4.4 NaN 判断 ----
console.log('\n  [4.4] NaN 的判断：用 Number.isNaN，不要用 isNaN');
console.log(`    NaN === NaN              = ${NaN === NaN}  <- NaN 不等于自己，所以不能用 === 判断`);
console.log(`    isNaN('abc')             = ${isNaN('abc')}  <- 全局 isNaN 会先把参数转数字，'abc' 转成 NaN 所以是 true`);
console.log(`    Number.isNaN('abc')      = ${Number.isNaN('abc')}  <- 正确：'abc' 本身不是 NaN 值`);
console.log(`    Number.isNaN(NaN)        = ${Number.isNaN(NaN)}`);
console.log(`    Number.isNaN(0 / 0)      = ${Number.isNaN(0 / 0)}`);
console.log('  用法：想判断"这个数是不是 NaN（比如除零、parseInt 失败）" -> Number.isNaN；');
console.log('        想判断"这个值能不能当数字用" -> Number.isFinite（它同时排除 NaN 和 ±Infinity）。');
console.log(`    例如 Number.isFinite(Number('abc')) = ${Number.isFinite(Number('abc'))}，`);
console.log(`         Number.isFinite(Number('12'))  = ${Number.isFinite(Number('12'))}`);

// ============================================================================
// 小节 5：const 优先 > let > 永不 var
// ============================================================================
console.log('\n--- 5. const 优先 > let > 永不 var ---');

// const：绑定不可重新赋值 —— 默认选择，读代码时"不用怀疑它会不会变"
const TAX_RATE = 0.13;

// let：确实需要重新赋值时才用（累加器、循环变量、状态机）
let runningTotal = 0;
for (const item of [10, 20, 30]) {
  runningTotal += item;
}

console.log(`  const TAX_RATE = ${TAX_RATE}          // 不会变 -> 用 const`);
console.log(`  let runningTotal = 0; ...            // 需要累加 -> 用 let，结果 = ${runningTotal}`);

// var 的三个问题（用注释演示，不实际写 var）：
//   ① 函数作用域而非块作用域：
//        if (true) { var x = 1; }  console.log(x);  // 1 —— 泄漏到块外面了！
//        if (true) { let y = 1; }  console.log(y);  // ReferenceError —— 符合直觉
//   ② 变量提升（hoisting）：`console.log(z); var z = 1;` 输出 undefined 而不是报错，
//      让"用了未初始化的变量"这种 bug 静默通过。
//   ③ 允许重复声明：`var a = 1; var a = 2;` 不报错，会悄悄覆盖前者。

console.log('\n  var 的问题（用注释展示，本文件不写 var）：');
console.log('    ① 函数作用域：if 块里 var 声明的变量会"泄漏"到块外 —— 不符合直觉；');
console.log('    ② 变量提升：先用后声明得到 undefined 而不是报错，bug 静默通过；');
console.log('    ③ 允许重复声明：var a = 1; var a = 2; 不报错，覆盖得很隐蔽。');
console.log('  let / const 都是块级作用域 + 有暂时性死区（TDZ），先用后声明会直接报错。');

// 重要澄清：const 不等于"值不可变"
const config = { theme: 'dark' };
config.theme = 'light'; // 这是允许的！const 只约束"绑定"，不约束"对象内容"
console.log(`\n  重要澄清：const 只保证"绑定不能重新赋值"，不保证"值不可变"`);
console.log(`    const config = {theme:'dark'};`);
console.log(`    config.theme = 'light';   // 合法！现在 config.theme = ${config.theme}`);
try {
  // 演示"重新赋值绑定"会抛错（ESM 是严格模式，所以是抛错而不是静默失败）
  // eslint-disable-next-line no-const-assign
  eval('config = {}');
} catch (err) {
  console.log(`    config = {};              // 抛错 ${err.name}（绑定不可重新赋值）`);
}
console.log('  想要"值也不可变"，用 Object.freeze（注意它是浅冻结，见 06 篇）。');

// ============================================================================
// 小节 6：可选链 ?. 与空值合并 ??
// ============================================================================
console.log('\n--- 6. 可选链 ?. 与空值合并 ?? ---');

const apiResponse = {
  data: {
    user: {
      profile: { nickname: 'alice' },
      // 注意：settings 故意缺失，用来演示"深层取值"
    },
  },
};
const emptyResponse = { data: null };

console.log('  场景：从深层嵌套的接口响应里取值，中间某一层可能缺失。');

// 坏例子（注释展示）：层层判断，啰嗦且容易漏
//   let nickname;
//   if (apiResponse && apiResponse.data && apiResponse.data.user &&
//       apiResponse.data.user.profile) {
//     nickname = apiResponse.data.user.profile.nickname;
//   }

// 好例子：可选链一行搞定，任一环为 null/undefined 就整体短路为 undefined
const nickname = apiResponse?.data?.user?.profile?.nickname;
const missingNick = emptyResponse?.data?.user?.profile?.nickname;
console.log(`    apiResponse?.data?.user?.profile?.nickname = ${JSON.stringify(nickname)}`);
console.log(`    emptyResponse?.data?.user?.profile?.nickname = ${JSON.stringify(missingNick)}  <- 中间断了就返回 undefined，不抛错`);
console.log('    对比老写法：需要 4 层 && 判断，漏一层就是 "Cannot read properties of undefined"。');

// 可选链的其他形式
const users = [{ name: 'alice' }];
console.log(`\n    可选链还能用在方法调用与下标访问上：`);
console.log(`      users?.[0]?.name        = ${JSON.stringify(users?.[0]?.name)}`);
console.log(`      空数组 users?.[9]?.name = ${JSON.stringify(users?.[9]?.name)}`);
const noArray = null;
console.log(`      noArray?.[0]            = ${JSON.stringify(noArray?.[0])}`);
const objWithoutMethod = {};
console.log(`      obj.unknownMethod?.()   = ${JSON.stringify(objWithoutMethod.unknownMethod?.())}  <- 方法不存在也不会抛错`);

// ?? 与 || 的关键区别
console.log('\n  ?? 与 || 的关键区别（这是最容易踩的坑）：');
const defaultCases = [
  ['undefined || 5', String(undefined || 5), 'undefined ?? 5', String(undefined ?? 5)],
  ['null || 5', String(null || 5), 'null ?? 5', String(null ?? 5)],
  ['0 || 5', String(0 || 5), '0 ?? 5', String(0 ?? 5)],
  ["'' || '默认'", JSON.stringify('' || '默认'), "'' ?? '默认'", JSON.stringify('' ?? '默认')],
  ['false || true', String(false || true), 'false ?? true', String(false ?? true)],
  ['NaN || 1', String(NaN || 1), 'NaN ?? 1', String(NaN ?? 1)],
];
console.log(`    表达式            | || 结果 | 表达式             | ?? 结果`);
for (const [exprA, resA, exprB, resB] of defaultCases) {
  console.log(`    ${exprA.padEnd(17)} | ${resA.padEnd(7)} | ${exprB.padEnd(18)} | ${resB}`);
}
console.log('  结论：|| 把"所有假值"都当成"没值"，?? 只把 null/undefined 当成"没值"。');
console.log('  所以"给 0 / 空字符串 / false 保留原值"的场景，必须用 ??：');
/**
 * 【坏例子】用 || 提供默认值，把合法的 0 干掉了。
 * @param {number|undefined} limit
 * @returns {number}
 */
function getLimitBad(limit) {
  return limit || 100; // limit 传 0 时会变成 100 —— 0 是合法值却丢了
}
/**
 * 【好例子】用 ?? 只处理"没传"的情况。
 * @param {number|undefined} limit
 * @returns {number}
 */
function getLimitGood(limit) {
  return limit ?? 100; // 传 0 就保留 0
}
console.log(`    getLimitBad(0)  = ${getLimitBad(0)}    <- 想限制 0 条，结果变成 100，逻辑错了`);
console.log(`    getLimitGood(0) = ${getLimitGood(0)}      <- 正确保留 0`);
console.log(`    getLimitGood(undefined) = ${getLimitGood(undefined)}  <- 只有真的没传才用默认值`);

// ============================================================================
// 小节 7：避免魔法数字
// ============================================================================
console.log('\n--- 7. 避免魔法数字：把意图写进名字里 ---');

// 坏例子（注释展示）：数字直接出现在逻辑里，读者只能靠猜
//   if (retryCount > 3) { ... }                     // 3 是什么？为什么是 3？
//   setTimeout(fn, 86400000);                        // 86400000 是多久？
//   if (amount > 50000) { needApproval = true; }     // 50000 又是哪来的？

// 好例子：每个数字都有名字，改动只需改一处
/** 网络请求最大重试次数。 */
const MAX_RETRY_COUNT = 3;
/** 数据缓存有效期：24 小时（毫秒）。 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** 需要人工审批的金额门槛：5 万元。 */
const APPROVAL_THRESHOLD = 50_000;
/** 分页默认每页条数。 */
const DEFAULT_PAGE_SIZE = 20;

/**
 * 判断是否需要人工审批。
 * @param {number} amount 金额
 * @returns {boolean}
 */
function needsApproval(amount) {
  return amount > APPROVAL_THRESHOLD;
}

console.log('  对比：');
console.log(`    坏例子  if (amount > 50000)             // 50000 是什么？无从得知`);
console.log(`    好例子  if (amount > APPROVAL_THRESHOLD) // 名字就是文档`);
console.log(`\n  具名常量的实际效果：`);
console.log(`    MAX_RETRY_COUNT    = ${MAX_RETRY_COUNT}`);
console.log(`    CACHE_TTL_MS       = ${CACHE_TTL_MS}  （写成 24*60*60*1000，比 86400000 好读得多）`);
console.log(`    APPROVAL_THRESHOLD = ${APPROVAL_THRESHOLD}  （数字分隔符 _ 让 50000 更好读）`);
console.log(`    DEFAULT_PAGE_SIZE  = ${DEFAULT_PAGE_SIZE}`);
console.log(`    needsApproval(49999) = ${needsApproval(49_999)}`);
console.log(`    needsApproval(50001) = ${needsApproval(50_001)}`);
console.log('  提取常量的三个收益：');
console.log('    ① 可读：名字说明了"这个数字代表什么业务含义"；');
console.log('    ② 可维护：规则变了只改一处，不会漏改某个散落的分支；');
console.log('    ③ 可搜索：搜 MAX_RETRY_COUNT 就能找到所有用到它的地方。');
console.log('  什么时候不必提常量？只用一次、且含义自明的场合，例如 `arr.slice(0, 1)`。');
console.log('  判断标准：**如果别人需要停下来想"这个数字是干嘛的"，就该给它起个名字**。');

// ============================================================================
// 小节 8：注释写"为什么"，而不是"是什么"
// ============================================================================
console.log('\n--- 8. 注释：写"为什么"，不写"是什么" ---');

// 坏例子（注释展示）：把代码翻译一遍，毫无信息增量，还会随代码变动而撒谎
//   i++;                              // i 自增 1
//   const total = price * qty;        // total 等于 price 乘以 qty
//   return null;                      // 返回 null

// 好例子：解释"为什么这么写"、有什么约束、有什么历史包袱
/**
 * 计算会员等级。
 *
 * 为什么用 >= 而不是 >：产品规定"生日当天即升级"，所以边界值要包含在内。
 * 为什么阈值是硬编码的常量：等级规则由运营每季度调整，改这里即可，勿改成配置下发
 * （历史原因：曾因配置中心延迟导致大面积等级误判，见 INC-2231）。
 *
 * @param {number} points 累计积分
 * @returns {'bronze'|'silver'|'gold'} 会员等级
 */
function getMembershipLevel(points) {
  if (points >= 10_000) return 'gold';
  if (points >= 3_000) return 'silver';
  return 'bronze';
}

console.log('  坏注释：');
console.log('    i++;                       // i 自增 1           <- 代码已经说了，注释是废话');
console.log('    return null;               // 返回 null          <- 同上');
console.log('  好注释（本文件里的真实例子）：');
console.log('    上面 getMembershipLevel 的 JSDoc 解释了：');
console.log('      · 为什么用 >= 而不是 >（产品规则的边界语义）');
console.log('      · 为什么阈值不放到配置中心（有历史事故 INC-2231）');
console.log('  这些信息**代码本身表达不出来**，必须靠注释传递。');
console.log(`\n  实际调用：getMembershipLevel(10000) = ${getMembershipLevel(10_000)}`);
console.log(`            getMembershipLevel(9999)  = ${getMembershipLevel(9_999)}`);
console.log('  判断标准：如果注释只是把代码翻译了一遍，就删掉它；');
console.log('            如果它解释了"为什么"、"有什么坑"、"和谁有约定"，就留下。');
console.log('  另一个技巧：注释里写"为什么不是另一种写法"往往最有价值 ——');
console.log('            它能阻止后来者把这段代码"优化"回坑里。');

// ============================================================================
// 小节 9：风格一致性 > 风格本身 + 工具自动化
// ============================================================================
console.log('\n--- 9. 一致性比风格本身更重要，且应该交给工具 ---');

console.log('  一个思想实验：团队 A 统一用 2 空格缩进，团队 B 同一份代码里混用 2 空格与 Tab。');
console.log('    两者"哪个缩进更好"其实无所谓，但 B 的 diff 会充满无意义的空白变更，');
console.log('    review 时的注意力被消耗在格式上，真正的逻辑问题反而被漏看。');
console.log('  所以：**先选一个，写进配置，交给工具执行** —— 然后忘了它。\n');

console.log('  推荐的工具组合：');
const tools = [
  ['Prettier', '格式化（缩进、引号、分号、换行、行宽）', '完全不管风格争议，保存即格式化'],
  ['ESLint', '代码质量与潜在 bug（未使用变量、== 用法、eval、Promise 未处理）', '能发现"风格问题"背后的真实缺陷'],
  ['eslint-config-prettier', '关掉所有与 Prettier 冲突的 ESLint 格式规则', '让两个工具各司其职，不打架'],
  ['EditorConfig', '跨编辑器的统一约定（缩进、换行符、编码、末尾换行）', '团队里混用 VS Code / Vim / WebStorm 时的底线'],
  ['husky + lint-staged', '提交前只对改动文件跑 lint 与格式化', '把约定变成"提交即强制执行"'],
  ['CI 里跑 lint', '在流水线上再检查一次', '挡住本地跳过钩子的提交（--no-verify）'],
];
console.log(`    工具                    | 负责什么                                   | 说明`);
for (const [name, duty, note] of tools) {
  console.log(`    ${name.padEnd(23)} | ${duty.padEnd(42)} | ${note}`);
}

console.log('\n  常用 ESLint 规则举例（能防住本文件讲到的多数问题）：');
const eslintRules = [
  ["'no-var': 'error'", '禁止 var'],
  ["'prefer-const': 'error'", '不会被重新赋值的 let 提示改成 const'],
  ["'eqeqeq': ['error', 'always']", '强制 === / !=='],
  ["'no-implicit-coercion': 'error'", '禁止 !!x、+x、x + \'\' 这类隐式转换技巧'],
  ["'no-magic-numbers': 'warn'", '提醒魔法数字（通常对测试文件放宽）'],
  ["'no-unused-vars': 'error'", '未使用的变量/参数'],
  ["'no-else-return': 'error'", 'else 里只有 return 时，提示改成早返回'],
  ["'complexity': ['warn', 10]", '圈复杂度过高时提醒拆分函数'],
  ["'max-lines-per-function': ['warn', 50]", '函数过长时提醒'],
  ["'no-eval': 'error'", '禁止 eval（见 05 篇）'],
];
for (const [rule, note] of eslintRules) {
  console.log(`    ${rule.padEnd(36)} ${note}`);
}
console.log('\n  还有一条最省事的：**让 Prettier 接管所有格式争论**。');
console.log('  团队为"要不要分号"吵起来时，正确答案是"Prettier 配什么就用什么，别再讨论"。');
console.log('  人的时间应该花在"这段逻辑为什么这么设计"上，而不是空格数量上。');

// ============================================================================
// 小节 10：一页速查清单 + 小结
// ============================================================================
console.log('\n--- 10. 速查清单 ---');
const checklist = [
  ['命名', 'camelCase 变量/函数、PascalCase 类、UPPER_SNAKE 常量；布尔用 is/has 开头；函数用动词开头'],
  ['函数长度', '一句话说不清职责就拆；超过约 30~50 行开始警惕'],
  ['早返回', '异常情况提前 return，嵌套不超过 2~3 层，让主干路径留在最外层'],
  ['相等判断', '一律用 === / !==；判断 null 或 undefined 时才考虑 x == null'],
  ['避免隐式转换', '算术前显式 Number() / parseInt(x, 10)；拼接用模板字符串而不是 +'],
  ['布尔判断', '记住 8 个假值；空数组/空对象是真值；数量为 0 与"未设置"要分开判断'],
  ['NaN', '用 Number.isNaN（判断是不是 NaN）或 Number.isFinite（判断能不能当数字用）'],
  ['声明', 'const 优先，需要重赋值才用 let，永不 var；记住 const 不保证值不可变'],
  ['取值', '?. 处理"中间层可能缺失"；?? 只在 null/undefined 时取默认值，别用 ||'],
  ['魔法数字', '需要停下来想"这是什么"的数字，就该提取成具名常量'],
  ['注释', '写为什么、有什么约束、为什么不用另一种写法；不要翻译代码'],
  ['一致性', '风格统一比选哪种风格更重要；用 Prettier + ESLint + CI 强制执行'],
];
for (const [topic, advice] of checklist) {
  console.log(`  ● ${topic}`);
  console.log(`      ${advice}`);
}

console.log('\n--- 11. 小结 ---');
console.log('  1) 代码风格的本质是沟通成本：代码被读的次数远多于被写的次数。');
console.log('  2) 命名是最便宜的文档：见名知意，避免缩写；单字母只留给循环下标。');
console.log('  3) 单一职责 + 早返回：函数一句话说得清、嵌套不超过 2~3 层、主干路径凸出。');
console.log('  4) 隐式转换是一整类 bug 的来源：=== 、显式 Number()、Number.isNaN、小心假值。');
console.log('  5) const 优先 > let > 永不 var；但 const 只锁绑定，不锁值（要值不可变得 freeze）。');
console.log('  6) ?. 解决"中间层缺失"，?? 解决"默认值"，注意 ?? 与 || 在 0 / \'\' / false 上的差别。');
console.log('  7) 魔法数字提取成常量：可读、可维护、可搜索。');
console.log('  8) 注释写"为什么"，不写"是什么"；写"为什么不用另一种写法"最有价值。');
console.log('  9) 风格一致性比风格本身更重要，且应该由工具（Prettier + ESLint + CI）来守。');
console.log(' 10) 本清单里的每一条，都是"降低未来某次排查/评审成本"的投资。');
