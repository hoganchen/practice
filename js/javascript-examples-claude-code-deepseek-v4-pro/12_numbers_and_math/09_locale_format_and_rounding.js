/**
 * ============================================================================
 * 知识点：toLocaleString 与 Intl.NumberFormat —— 本地化格式化、性能取舍与
 *          ES2023 舍入控制（roundingMode / signDisplay / roundingPriority）
 * ============================================================================
 *
 * 【所属分类】12_numbers_and_math —— 数字与数学运算
 * 【难度等级】进阶
 * 【前置知识】12_numbers_and_math/02_rounding.js、12_numbers_and_math/07_intl_number_format.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    同一串数字在不同语言环境下写法不同：
 *       1234567.891 → 英文 "1,234,567.891"，中文 "1,234,567.891"，德文 "1.234.567,891"
 *    负责这件事的 API 有两个，它们本质是同一套能力：
 *      · num.toLocaleString(locale, options)  —— 挂在数字实例上的"便利写法"
 *      · new Intl.NumberFormat(locale, options).format(num) —— 显式构造的格式化器
 *    两者的 locale 与 options 参数完全一致（toLocaleString 内部就是转交给
 *    Intl.NumberFormat 实现的），区别在于"谁持有 formatter 实例"。
 *
 * 2. 为什么需要
 *    - 国际化产品要按用户所在地区展示金额、百分比、数量。
 *    - 服务端报表、发票、导出 CSV 都必须有确定的格式（不能随机器默认环境漂移）。
 *    - 会计/统计场景要求"银行家舍入"，ES2023 起 Intl.NumberFormat 直接支持。
 *    - 批量格式化（列表页、报表几千行）时，格式化器的构造开销会变成瓶颈。
 *
 * 3. 核心语法要点
 *    - 必须显式传 locale：'zh-CN' / 'en-US' / 'de-DE'。
 *      不传就跟随运行时的默认区域，同一份代码在不同机器上输出可能不同。
 *    - 常用 options：
 *        style: 'decimal' | 'percent' | 'currency' | 'unit'
 *        currency: 'CNY' / 'USD'（style 为 currency 时必填）
 *        minimumFractionDigits / maximumFractionDigits  小数位数
 *        minimumSignificantDigits / maximumSignificantDigits 有效数字位数
 *        useGrouping: true | false | 'always' | 'min2' | 'auto'  千分位分组
 *        notation: 'standard' | 'scientific' | 'engineering' | 'compact'  紧凑记法
 *        signDisplay: 'auto' | 'always' | 'never' | 'exceptZero'   符号显示
 *        roundingMode（ES2023）: 见下文
 *        roundingPriority（ES2023）: 'auto' | 'morePrecision' | 'lessPrecision'
 *        trailingZeroDisplay（ES2023）: 'auto' | 'stripIfInteger'
 *    - 性能结论（本文件有实测）：
 *        一次性格式化      → 用 toLocaleString，代码最短
 *        循环/批量格式化   → 把 Intl.NumberFormat 实例缓存在循环外，别在循环里 new
 *
 * 4. 常见陷阱
 *    - 在循环里反复 new Intl.NumberFormat(...)：每次都要做 locale 解析与
 *      options 校验，实测比缓存实例慢几十倍（见第 3 节）。
 *    - 忘了传 locale，本机跑得好好的，上线到别的区域就变了格式。
 *    - toLocaleString 返回的是字符串，别直接拿去做算术（'1,234.57' + 1 会拼接）。
 *    - 千分位分隔符会污染 JSON 与 CSV：能进机器的数据用原始 Number，
 *      只在最终展示层做本地化。
 *    - 老引擎不认识新的 options（roundingMode 等）：构造时往往不报错，
 *      直到第一次 format 才抛 RangeError，所以特性检测要"构造 + 实际格式化"一起做。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 12_numbers_and_math/09_locale_format_and_rounding.js
 *
 * 【预期输出】
 *   先对比不同 locale 的格式差异与两种 API 的等价性，再实测三种调用方式的性能，
 *   最后逐项演示 roundingMode / signDisplay / roundingPriority / trailingZeroDisplay。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. toLocaleString 与 Intl.NumberFormat 的分工
// ---------------------------------------------------------------------------

console.log('--- 1. 两种写法，同一套能力 ---');

// 演示用数字：既有千分位，又有小数
const sample = 1234567.891;

// 写法一：实例方法，最简短的"便利写法"
console.log('toLocaleString  zh-CN：', sample.toLocaleString('zh-CN'));
console.log('toLocaleString  en-US：', sample.toLocaleString('en-US'));
console.log('toLocaleString  de-DE：', sample.toLocaleString('de-DE'));
console.log('toLocaleString  fr-FR：', sample.toLocaleString('fr-FR'));

// 写法二：显式构造格式化器，然后再 format
// 两者的 locale 与 options 参数完全一致
const formatter = new Intl.NumberFormat('en-US');
console.log('\nIntl.NumberFormat en-US：', formatter.format(sample));

// 证明两者等价：同一组 locale + options，输出字符串完全相同
console.log('\n两种写法结果是否一致：');
const sameCases = [
  ['zh-CN', { style: 'currency', currency: 'CNY' }],
  ['en-US', { style: 'percent', maximumFractionDigits: 2 }],
  ['de-DE', { minimumFractionDigits: 3, maximumFractionDigits: 3 }],
];
for (const [locale, options] of sameCases) {
  // toLocaleString 接受与 Intl.NumberFormat 完全相同的 options
  const viaMethod = sample.toLocaleString(locale, options);
  // 等价的手工写法：先构造 formatter，再 format
  const viaIntl = new Intl.NumberFormat(locale, options).format(sample);
  console.log(`  ${locale.padEnd(7)} "${viaMethod}"  ===  "${viaIntl}"  →  ${viaMethod === viaIntl}`);
}
console.log('  ↑ 完全相同。toLocaleString 就是"内部替你 new 一个 formatter"的语法糖。');

// 从示例里能看到两个要点：
//   · 同一个数字 1234567.891 在 zh-CN 是 "1,234,567.891"，在 de-DE 是 "1.234.567,891"
//     （德语的千分位是点、小数点是逗号），这就是必须显式传 locale 的原因。
//   · style: 'percent' 时输入是"小数比例"：0.1234 会显示成 "12.34%"。

// useGrouping 控制千分位
//   true / 'always' 总是分组；false 从不分组；'auto' 由引擎按区域决定；
//   'min2' 只在"第一组至少有 2 位数字"时才分组，也就是 1234 不分、12345 才分。
console.log('\nuseGrouping 的分组控制（左列 1234，右列 1234567）：');
for (const useGrouping of [true, false, 'always', 'auto', 'min2']) {
  const small = new Intl.NumberFormat('en-US', { useGrouping }).format(1234);
  const large = new Intl.NumberFormat('en-US', { useGrouping }).format(1234567);
  console.log(`  useGrouping: ${String(useGrouping).padEnd(7)} → "${small.padEnd(9)}"  "${large}"`);
}
console.log("  ↑ 只有 'min2' 让 1234 保持原样：四位数字分组反而更难读。");

// notation 记法：'compact' 把大数缩写成 "1.23M"，仪表盘和社交计数很常用
console.log('\nnotation 记法：');
const notationCases = [
  ['standard', {}, '常规十进制'],
  ['scientific', {}, '科学计数法 E 记法'],
  ['engineering', {}, '工程记法（指数对齐到 3 的倍数）'],
  ['compact', { compactDisplay: 'short' }, '紧凑短记法'],
  ['compact', { compactDisplay: 'long' }, '紧凑长记法'],
];
for (const [notation, extra, desc] of notationCases) {
  const options = { notation, maximumFractionDigits: 2, ...extra };
  const out = new Intl.NumberFormat('en-US', options).format(sample);
  console.log(`  ${notation.padEnd(12)} ${String(extra.compactDisplay ?? '').padEnd(6)} → "${out.padEnd(16)}" ${desc}`);
}
console.log('  ↑ 紧凑记法对中文同样有效：', new Intl.NumberFormat('zh-CN', { notation: 'compact' }).format(sample));

// ---------------------------------------------------------------------------
// 2. 特性检测工具：新 options 在旧引擎上会怎样
// ---------------------------------------------------------------------------

console.log('--- 2. 特性检测 ---');

/**
 * 检测某个 Intl.NumberFormat 的 option 是否被当前引擎支持。
 * 为什么要"构造 + 实际格式化"两步：多数引擎在构造时并不校验未知的 option，
 * 只有第一次调用 format() 才会抛出 RangeError，只 try 构造会漏判。
 */
function supportsNumberFormatOption(options, probeValue = 2.5) {
  try {
    // 第一步：构造。部分引擎在这里就会抛错
    const probe = new Intl.NumberFormat('en-US', options);
    // 第二步：真正格式化一次，触发 options 的解析与校验
    probe.format(probeValue);
    return true;
  } catch {
    // 任何异常都视为"不支持"，调用方走降级分支
    return false;
  }
}

const hasRoundingMode = supportsNumberFormatOption({ roundingMode: 'halfEven' });
const hasSignDisplay = supportsNumberFormatOption({ signDisplay: 'exceptZero' });
const hasRoundingPriority = supportsNumberFormatOption({ roundingPriority: 'lessPrecision' });
const hasTrailingZeroDisplay = supportsNumberFormatOption({ trailingZeroDisplay: 'stripIfInteger' });

console.log('roundingMode        支持：', hasRoundingMode, '（ES2023，银行家舍入等）');
console.log('signDisplay         支持：', hasSignDisplay);
console.log('roundingPriority    支持：', hasRoundingPriority, '（ES2023）');
console.log('trailingZeroDisplay 支持：', hasTrailingZeroDisplay, '（ES2023）');
console.log('Node 版本：', process.version);

// ---------------------------------------------------------------------------
// 3. 性能实测：每次新建 vs 缓存实例 vs toLocaleString
// ---------------------------------------------------------------------------

console.log('\n--- 3. 性能实测 ---');

// 迭代次数取 2 万级：既能放大差异，又能让整个脚本在一秒内跑完
const ITERATIONS = 20000;
const benchValue = 1234567.891;

/**
 * 用 performance.now() 给一个函数计时。
 * performance.now() 返回毫秒数（带小数），比 Date.now() 精度更高。
 */
function measure(label, fn) {
  // 先预热一小轮，让 JIT 编译与内联缓存生效，避免把编译时间算进去
  for (let i = 0; i < 200; i++) fn(i);
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) fn(i);
  const elapsed = performance.now() - start;
  console.log(`  ${label.padEnd(34)}${elapsed.toFixed(1).padStart(8)} ms`);
  return elapsed;
}

console.log(`迭代 ${ITERATIONS} 次，格式化同一个数字：`);

// 方案 A：最差做法 —— 每次循环都重新构造 formatter
const timeNewEachTime = measure('循环内 new Intl.NumberFormat', () => {
  // 每次都要重新解析 locale、校验 options、初始化 ICU 数据绑定
  new Intl.NumberFormat('en-US').format(benchValue);
});

// 方案 B：把 formatter 缓存在循环外（推荐做法）
const cachedFormatter = new Intl.NumberFormat('en-US');
const timeCached = measure('循环外缓存 Intl.NumberFormat 实例', () => {
  // 只做纯粹的格式化，没有构造开销
  cachedFormatter.format(benchValue);
});

// 方案 C：toLocaleString 便利写法
const timeToLocaleString = measure('num.toLocaleString("en-US")', () => {
  benchValue.toLocaleString('en-US');
});

// 结论
const ratioA = timeNewEachTime / Math.max(timeCached, 0.001);
const ratioB = timeNewEachTime / Math.max(timeToLocaleString, 0.001);
console.log('\n结论：');
console.log(`  循环内 new 是"缓存实例"的约 ${ratioA.toFixed(1)} 倍耗时；`);
console.log(`  循环内 new 是"toLocaleString"的约 ${ratioB.toFixed(1)} 倍耗时。`);
console.log('  · 一次性格式化   → 用 toLocaleString，代码最短，可读性最好。');
console.log('  · 循环 / 批量    → 把 Intl.NumberFormat 实例提到循环外缓存复用。');
console.log('  · 值得注意       → 引擎对 toLocaleString 内部做了 formatter 缓存，');
console.log('                     所以它比"显式 new"快得多；但显式 new 出来的实例');
console.log('                     并不会自动享受这份缓存，必须自己缓存。');

// 让场景更真实一点：带 options（货币样式）时构造开销更大
const SMALL_ITERATIONS = 5000;
console.log(`\n带 options 的货币样式（迭代 ${SMALL_ITERATIONS} 次）：`);

const currencyOptions = { style: 'currency', currency: 'USD' };

let start = performance.now();
for (let i = 0; i < SMALL_ITERATIONS; i++) {
  new Intl.NumberFormat('en-US', currencyOptions).format(benchValue);
}
const currencyNew = performance.now() - start;

const cachedCurrency = new Intl.NumberFormat('en-US', currencyOptions);
start = performance.now();
for (let i = 0; i < SMALL_ITERATIONS; i++) {
  cachedCurrency.format(benchValue);
}
const currencyCached = performance.now() - start;

console.log(`  循环内 new （带 options）      ${currencyNew.toFixed(1).padStart(8)} ms`);
console.log(`  循环外缓存（带 options）       ${currencyCached.toFixed(1).padStart(8)} ms`);
console.log(`  → 约 ${(currencyNew / Math.max(currencyCached, 0.001)).toFixed(1)} 倍差距，options 越多差距越明显。`);
console.log(`  格式化结果示例：${cachedCurrency.format(benchValue)}`);

// 额外提醒：format 取出来单独用时要注意 this 绑定
// Intl.NumberFormat.prototype.format 是一个 getter，返回的是已绑定 this 的函数，
// 所以下面这样"脱壳"使用是安全的（常见于 [1,2].map(fmt.format)）
const detachedFormat = cachedCurrency.format;
console.log(`\n脱壳后的 format（[a,b].map(fmt.format) 可用）：${detachedFormat(benchValue)}`);

// ---------------------------------------------------------------------------
// 4. roundingMode（ES2023）：现代舍入控制
// ---------------------------------------------------------------------------

console.log('\n--- 4. roundingMode ---');

if (!hasRoundingMode) {
  console.log('当前环境不支持 roundingMode（需要 Node 20+ 或较新的浏览器），降级跳过。');
  console.log('各取值含义：ceil 向上、floor 向下、expand 远离 0、trunc 向 0、');
  console.log('halfExpand 逢五远离 0（默认）、halfTrunc 逢五向 0、halfEven 逢五取偶（银行家舍入）。');
  console.log('旧环境的替代方案：手写取整逻辑，见 12_numbers_and_math/02_rounding.js 第 6 节。');
} else {
  // roundingMode 决定"多余的那部分怎么处理"，它和 maximumFractionDigits 配合使用
  const modes = [
    ['ceil', '向 +Infinity 取整，同 Math.ceil'],
    ['floor', '向 -Infinity 取整，同 Math.floor'],
    ['expand', '远离 0 取整（绝对值变大）'],
    ['trunc', '向 0 取整（截断），同 Math.trunc'],
    ['halfExpand', '逢五远离 0（默认值）'],
    ['halfTrunc', '逢五向 0'],
    ['halfEven', '逢五取偶 = 银行家舍入（四舍六入五成双）'],
  ];

  // 为每种模式预先建好 formatter（这也是"缓存实例"的实际应用）
  const modeFormatters = modes.map(([mode, desc]) => ({
    mode,
    desc,
    fmt: new Intl.NumberFormat('en-US', { roundingMode: mode, maximumFractionDigits: 0 }),
  }));

  const values = [2.5, 2.4, 2.6, -2.5, -2.4, 0.5, 1.5];

  // 打印横向对照表
  console.log('模式        ' + values.map((v) => String(v).padStart(6)).join(''));
  for (const { mode, fmt } of modeFormatters) {
    console.log(mode.padEnd(12) + values.map((v) => fmt.format(v).padStart(6)).join(''));
  }

  console.log('\n含义：');
  for (const [mode, desc] of modes) console.log(`  ${mode.padEnd(11)} ${desc}`);

  console.log('\n四个观察重点：');
  console.log('  1) ceil/floor 只看方向，2.4 与 2.6 被推向同一侧，与 .5 无关。');
  console.log('  2) expand 与 trunc 只在负数上不同：-2.4 → expand 得 -3、trunc 得 -2。');
  console.log('  3) halfExpand 与 halfTrunc 只在"恰好 .5"时不同。');
  console.log('  4) halfEven 在 0.5 / 2.5 这类"前一位是偶数"的值上不进位，长期统计无偏差。');

  // 银行家舍入的实战意义：一批 .5 数据求和时不产生系统性偏差
  const halves = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5];
  const rawSum = halves.reduce((a, b) => a + b, 0);
  console.log(`\n一批 ${halves.length} 个 .5 数据（原值合计 ${rawSum}）在不同模式下的合计：`);
  for (const { mode, fmt } of modeFormatters) {
    const sum = halves.reduce((acc, v) => acc + Number(fmt.format(v)), 0);
    console.log(`  ${mode.padEnd(11)} 合计 ${String(sum).padStart(4)}   偏差 ${String(sum - rawSum).padStart(3)}`);
  }
  console.log('  ↑ 只有 halfEven 的偏差是 0，这就是会计与统计领域默认用它（银行家舍入）的原因。');
  console.log('  ↑ 详见 12_numbers_and_math/02_rounding.js 第 6 节。');

  // roundingMode 对小数位同样生效（不只是取整）
  console.log('\nroundingMode 配合小数位（maximumFractionDigits: 2）：');
  for (const mode of ['halfEven', 'halfExpand']) {
    const fmt = new Intl.NumberFormat('en-US', { roundingMode: mode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    console.log(`  ${mode.padEnd(11)} 1.005 → ${fmt.format(1.005)}   2.675 → ${fmt.format(2.675)}`);
  }
  console.log('  ↑ 差别出在 1.005：它的二进制真值略小于 1.005（约 1.00499999999999989），');
  console.log('    halfExpand 按"逢五进一"得到 1.01，halfEven 因"前一位 0 是偶数"不进位得到 1.00。');
  console.log('    这是"浮点误差 × 舍入规则"叠加的结果，不是 roundingMode 有问题');
  console.log('    （浮点真值详见 02_rounding.js 第 2 节）。');
}

// ---------------------------------------------------------------------------
// 5. signDisplay：符号怎么显示
// ---------------------------------------------------------------------------

console.log('\n--- 5. signDisplay ---');

if (!hasSignDisplay) {
  console.log('当前环境不支持 signDisplay，降级跳过。');
} else {
  const signModes = ['auto', 'always', 'never', 'exceptZero'];
  const signValues = [42, -42, 0, -0];

  console.log('模式        ' + signValues.map((v) => String(Object.is(v, -0) ? '-0' : v).padStart(6)).join(''));
  for (const signDisplay of signModes) {
    const fmt = new Intl.NumberFormat('en-US', { signDisplay });
    console.log(signDisplay.padEnd(12) + signValues.map((v) => fmt.format(v).padStart(6)).join(''));
  }

  console.log('\n含义与场景：');
  console.log("  auto        只有负数显示 '-'（默认）。");
  console.log("  always      正数也显示 '+'，财务报表的同比增减常用。");
  console.log("  never       永不显示符号，把负数当正数展示（仅用于明确知道符号的场合）。");
  console.log("  exceptZero  正数显示 '+'，但 0 不显示符号 —— 最贴合'涨跌看板'的直觉。");

  // 实战：同比涨跌的展示
  console.log('\n实战：同比涨跌展示（signDisplay: exceptZero）');
  const yoyFmt = new Intl.NumberFormat('zh-CN', {
    signDisplay: 'exceptZero',
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  for (const rate of [0.1234, -0.0567, 0]) {
    console.log(`  变动 ${String(rate).padEnd(9)} → ${yoyFmt.format(rate)}`);
  }
}

// ---------------------------------------------------------------------------
// 6. roundingPriority 与 trailingZeroDisplay（ES2023）
// ---------------------------------------------------------------------------

console.log('\n--- 6. roundingPriority ---');

if (!hasRoundingPriority) {
  console.log('当前环境不支持 roundingPriority，降级跳过。');
} else {
  // 当同时给了"小数位数"和"有效数字位数"两个约束、且它们互相矛盾时，
  // roundingPriority 决定听谁的：
  //   auto（默认） 由"最大有效数字位数"优先
  //   morePrecision  取两者中更精确的那个结果（保留更多位）
  //   lessPrecision  取两者中更粗糙的那个结果（保留更少位）
  const target = 1234.5678;
  console.log(`原值：${target}`);
  console.log('同时设置 maximumFractionDigits: 2 与 maximumSignificantDigits: 4：');
  for (const roundingPriority of ['auto', 'morePrecision', 'lessPrecision']) {
    const fmt = new Intl.NumberFormat('en-US', {
      roundingPriority,
      maximumFractionDigits: 2,
      maximumSignificantDigits: 4,
    });
    console.log(`  ${roundingPriority.padEnd(15)} → ${fmt.format(target)}`);
  }
  console.log('  · morePrecision → 1,234.57（2 位小数，更精确）');
  console.log('  · lessPrecision → 1,235（4 位有效数字，更粗糙但更好读）');
  console.log('  · 场景：报表里既要"最多两位小数"又要"总共不超过 4 位有效数字"时，用它决定优先级。');
}

console.log('\n--- 7. trailingZeroDisplay ---');

if (!hasTrailingZeroDisplay) {
  console.log('当前环境不支持 trailingZeroDisplay，降级跳过。');
} else {
  // trailingZeroDisplay 控制"用来补位的小数末尾零"要不要保留
  //   auto（默认）      保留，5 显示成 "5.00"
  //   stripIfInteger    如果小数部分全是 0，就整段去掉，5 显示成 "5"
  const five = 5;
  const autoFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, trailingZeroDisplay: 'auto' });
  const stripFmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, trailingZeroDisplay: 'stripIfInteger' });
  console.log(`minimumFractionDigits: 2，数字 ${five}：`);
  console.log(`  auto           → "${autoFmt.format(five)}"`);
  console.log(`  stripIfInteger → "${stripFmt.format(five)}"`);
  console.log(`  非整数时两者一致：auto "${autoFmt.format(5.5)}" / strip "${stripFmt.format(5.5)}"`);
  console.log('  场景：商品价格表里 "¥5" 比 "¥5.00" 更清爽，但 "¥5.50" 的零又必须保留。');

  // 价格表的实战对照
  console.log('\n实战：价格表（zh-CN 人民币）');
  const priceTable = new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    trailingZeroDisplay: 'stripIfInteger',
  });
  for (const price of [5, 5.5, 12.3, 100, 0.99]) {
    console.log(`  ${String(price).padEnd(8)} → ${priceTable.format(price)}`);
  }
}

// ---------------------------------------------------------------------------
// 8. 综合实战：必须显式传 locale + 缓存实例
// ---------------------------------------------------------------------------

console.log('\n--- 8. 综合实战 ---');

/**
 * 批量格式化金额（生产写法）：
 *   1. 每个 locale/style 组合只构造一次 formatter，缓存起来复用；
 *   2. locale 显式传入，绝不留空 —— 保证任何机器上输出一致；
 *   3. 只返回字符串，原始 Number 不动（本地化是"展示层"的事）。
 */
function createMoneyFormatters(locale, currency) {
  // 一个 locale 下按"是否需要符号"准备两个 formatter，仍是一次性构造
  return {
    plain: new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    signed: new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      signDisplay: 'exceptZero',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
}

// 一次性建好，之后整个批量流程复用（模拟报表导出几千行）
const money = createMoneyFormatters('zh-CN', 'CNY');
console.log('人民币（zh-CN，Chinese Yuan）：');
const transactions = [1299.5, 88, -45.6, 0, 12345.678];
for (const amount of transactions) {
  console.log(`  ${String(amount).padStart(10)} → ${money.signed.format(amount)}`);
}

// 同一批数据换成美元与德文环境，格式完全不同，但代码路径完全一样
const usd = createMoneyFormatters('en-US', 'USD');
const eur = createMoneyFormatters('de-DE', 'EUR');
console.log('\n同一笔金额 1234.5 在不同区域：');
console.log('  zh-CN/CNY →', money.plain.format(1234.5));
console.log('  en-US/USD →', usd.plain.format(1234.5));
console.log('  de-DE/EUR →', eur.plain.format(1234.5));
console.log('  ↑ 符号位置、小数点、千分位全都不同，这正是"必须显式传 locale"的意义。');

// 反例提醒：不传 locale 会跟随运行时默认区域，结果不可预期
console.log('\n反例（不推荐）：不传 locale，跟随运行时默认区域');
console.log('  (1234.5).toLocaleString() →', (1234.5).toLocaleString());
console.log('  ↑ 这行的输出取决于运行机器的区域设置，绝不能写进报表或测试断言。');

// 最后强调一次数据与展示分离
console.log('\n数据与展示分离：');
const raw = 1234.5;
const shown = money.plain.format(raw);
console.log(`  原始值 ${raw}（typeof ${typeof raw}，可直接参与运算）`);
console.log(`  展示串 "${shown}"（typeof ${typeof shown}，不要拿去算数）`);
console.log(`  如果硬要相加： '${shown}' + 1 = ${JSON.stringify(shown + 1)} ← 变成字符串拼接了`);

console.log('\n全部演示完毕。');
