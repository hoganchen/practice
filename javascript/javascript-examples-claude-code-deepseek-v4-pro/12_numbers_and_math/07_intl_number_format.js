/**
 * ============================================================================
 * 知识点：Intl.NumberFormat —— 货币、百分比、千分位、单位与本地化
 * ============================================================================
 *
 * 【所属分类】12_numbers_and_math —— 数字与数学运算
 * 【难度等级】进阶
 * 【前置知识】12_numbers_and_math/05_number_methods.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Intl.NumberFormat 是 ECMA-402（国际化 API）提供的数字格式化工具。
 *    它把数字按指定语言/地区的习惯渲染成字符串：
 *      new Intl.NumberFormat(locales, options).format(number)
 *    支持的 style 有四种：
 *      'decimal'（默认，小数） 'currency'（货币） 'percent'（百分比） 'unit'（计量单位）
 *    这条路径与本仓库其它示例不同：它完全依赖运行环境的 ICU 数据，
 *    不同 Node 版本/构建方式的输出可能略有差异（正常使用不受影响）。
 *
 * 2. 为什么需要
 *    - 同一个数字在不同地区的写法不同：
 *        1234567.89  中文/美式 → "1,234,567.89"
 *                    德语/西班牙语 → "1.234.567,89"（千分位与小数点互换）
 *                    印度英语 → "12,34,567.89"（分组方式是 2 位）
 *    - 货币符号位置和精度也不同：$1,234.57 / 1.234,57 € / ￥1,235（日元无小数）
 *    - 手写千分位正则容易错，还处理不了各种本地化差异，用 Intl 更可靠。
 *
 * 3. 核心语法要点
 *    - 构造：new Intl.NumberFormat(locales, options)
 *        locales 可以是字符串（'zh-CN'）或数组（['zh-CN', 'en-US']，按顺序回退）
 *        省略 locales 时使用运行环境的默认区域
 *    - 常用 options：
 *        style              'decimal' | 'currency' | 'percent' | 'unit'
 *        currency           style 为 currency 时必填，如 'CNY'、'USD'、'JPY'
 *        currencyDisplay    'symbol'（￥）| 'code'（CNY）| 'name'（人民币）
 *        minimumFractionDigits / maximumFractionDigits  小数位范围
 *        minimumIntegerDigits                           整数部分最少位数（补零）
 *        useGrouping        是否使用千分位分隔符（false 可关闭）
 *        notation           'standard' | 'scientific' | 'engineering' | 'compact'
 *        compactDisplay     notation 为 compact 时的 'short'（1.2万）或 'long'
 *        signDisplay        'auto' | 'always'（总是显示 + -）| 'never'
 *        unit               style 为 unit 时必填，如 'kilometer'、'byte'、'celsius'
 *    - 百分比的陷阱：style:'percent' 会把数字乘以 100 再显示，
 *      所以 0.25 会显示成 "25%"，传 25 会显示成 "2500%"。
 *    - 性能：同一个格式多次使用时，应复用 NumberFormat 实例（构造开销较大），
 *      或者使用 formatToParts 做更精细的拼接。
 *
 * 4. 常见陷阱
 *    - 把已经是百分数的值（25）传给 style:'percent'，得到 2500%。
 *    - 只写 'zh-CN' 而不给 currency，构造时就会抛 TypeError。
 *    - 非法货币代码（如 'RMB'）会抛 RangeError，必须用 ISO 4217 的 'CNY'。
 *    - format() 返回的是字符串，且可能包含不间断空格（U+00A0），
 *      做字符串比较或拼接时要注意，必要时用 replace(/ /g, ' ') 归一化。
 *    - 不同 Node 版本的 CLDR 数据版本不同，紧凑记法的结果可能有差别。
 *    - Intl 无法处理超出安全整数范围的精度问题，大数仍需字符串方案（见 06 号文件）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 12_numbers_and_math/07_intl_number_format.js
 *
 * 【预期输出】
 *   演示小数、货币、百分比、单位、紧凑记法、符号显示等各类格式化结果。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基础：十进制与千分位
// ---------------------------------------------------------------------------

console.log('--- 1. 基础格式化 ---');

const n = 1234567.891;

// 不传 options 时按默认区域格式化
console.log('默认区域：', new Intl.NumberFormat().format(n));
console.log('运行时默认区域是：', new Intl.NumberFormat().resolvedOptions().locale);

// 同一个数字在不同地区写法不同
const locales = ['en-US', 'de-DE', 'fr-FR', 'zh-CN', 'hi-IN', 'ar-EG'];
console.log('\n同一数字的地区差异：');
for (const locale of locales) {
  const formatted = new Intl.NumberFormat(locale).format(n);
  console.log(`  ${locale.padEnd(8)} ${formatted}`);
}
console.log('  注意 de-DE 用点做千分位、逗号做小数点；hi-IN 的分组是 2 位');

// 指定小数位数
console.log('\n小数位控制：');
console.log('  2 位：', new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n));
console.log('  0 位：', new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n));
console.log('  自动（默认最多 3 位）：', new Intl.NumberFormat('en-US').format(n));

// 关掉千分位
console.log('\n关掉千分位：', new Intl.NumberFormat('en-US', { useGrouping: false }).format(n));

// 整数部分最少位数（补零），常用于编号、时间
console.log('\n补零到 6 位整数：', new Intl.NumberFormat('en-US', { minimumIntegerDigits: 6, useGrouping: false }).format(42));

// ---------------------------------------------------------------------------
// 2. 货币
// ---------------------------------------------------------------------------

console.log('--- 2. 货币 ---');

const price = 1234.5;

// 不同货币的符号与精度
console.log('  币种   显示结果');
for (const currency of ['CNY', 'USD', 'EUR', 'JPY', 'KRW', 'VND']) {
  const formatted = new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(price);
  console.log(`  ${currency.padEnd(7)}${formatted}`);
}
console.log('  注意 JPY / KRW / VND 默认没有小数位（它们的辅币单位已不流通）');

// 货币符号的三种展示方式
console.log('\n货币符号展示方式：');
for (const currencyDisplay of ['symbol', 'code', 'name']) {
  const formatted = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'USD', currencyDisplay }).format(price);
  console.log(`  ${currencyDisplay.padEnd(8)} ${formatted}`);
}

// 强制保留两位小数（很多财务场景要求）
const twoDecimals = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
console.log('\n强制两位小数：', twoDecimals.format(100)); // ￥100.00
console.log('强制两位小数：', twoDecimals.format(99.999)); // ￥100.00

// 不同地区显示同一种货币，符号位置会变
console.log('\n同一笔美元在不同地区的显示：');
for (const locale of ['en-US', 'de-DE', 'zh-CN', 'ja-JP']) {
  console.log(`  ${locale.padEnd(8)} ${new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(price)}`);
}

// 非法货币代码：三个字母但不是合法 ISO 4217 代码时会抛 RangeError
console.log('\n非法货币代码：');
try {
  console.log('  currency: "XX" →', new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'XX' }).format(1));
} catch (err) {
  console.log('  currency: "XX" 抛出：', err.constructor.name, '-', err.message);
}
// 注意 'RMB' 是"看起来对但不符合 ISO 4217"的常见误写。
// V8 不会为它抛错，而是把它当作一个自定义代码直接显示出来 —— 这更危险，因为不会报错。
console.log('  currency: "RMB" →', new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'RMB' }).format(1));
console.log('  人民币的正确代码是 CNY：', new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(1));

// 只写 style: 'currency' 而不给 currency 也会抛错
try {
  new Intl.NumberFormat('zh-CN', { style: 'currency' }).format(1);
} catch (err) {
  console.log('  缺少 currency 抛出：', err.constructor.name, '-', err.message);
}

// ---------------------------------------------------------------------------
// 3. 百分比 —— 注意乘 100 的规则
// ---------------------------------------------------------------------------

console.log('--- 3. 百分比 ---');

const ratio = 0.2567;

// style:'percent' 会自动把数字乘以 100
console.log('0.2567 → ', new Intl.NumberFormat('zh-CN', { style: 'percent' }).format(ratio)); // 26%
console.log('0.2567 保留两位小数 → ', new Intl.NumberFormat('zh-CN', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ratio)); // 25.67%
console.log('0.5 → ', new Intl.NumberFormat('zh-CN', { style: 'percent' }).format(0.5)); // 50%
console.log('1 → ', new Intl.NumberFormat('zh-CN', { style: 'percent' }).format(1)); // 100%

// 陷阱：已经是百分数的值再传进去就会翻 100 倍
console.log('\n陷阱：把 25 当成 25% 传进去');
console.log('  25 → ', new Intl.NumberFormat('zh-CN', { style: 'percent' }).format(25)); // 2,500%
console.log('  正确做法是传 0.25：', new Intl.NumberFormat('zh-CN', { style: 'percent' }).format(0.25)); // 25%

// 有些地区的百分号位置与空格不同
console.log('\n不同地区的百分比写法：');
for (const locale of ['en-US', 'de-DE', 'fr-FR', 'tr-TR']) {
  console.log(`  ${locale.padEnd(8)} ${new Intl.NumberFormat(locale, { style: 'percent' }).format(0.2567)}`);
}

// 实战：把"百分比字符串"反解析成小数
function parsePercent(text) {
  // 去掉百分号与千分位/空格，再除以 100
  const cleaned = String(text).replace(/[^\d.,-]/g, '');
  return Number(cleaned) / 100;
}
console.log('\n反解析 "25.67%" →', parsePercent('25.67%'));

// ---------------------------------------------------------------------------
// 4. 单位（style: 'unit'）
// ---------------------------------------------------------------------------

console.log('--- 4. 计量单位 ---');

const units = ['kilometer', 'meter', 'kilogram', 'gram', 'byte', 'celsius', 'liter', 'hour'];
console.log('  单位          中文           英文');
for (const unit of units) {
  const cn = new Intl.NumberFormat('zh-CN', { style: 'unit', unit, unitDisplay: 'short' }).format(42);
  const en = new Intl.NumberFormat('en-US', { style: 'unit', unit, unitDisplay: 'short' }).format(42);
  console.log(`  ${unit.padEnd(13)}${cn.padEnd(15)}${en}`);
}

// 单位的长短写法
console.log('\nunitDisplay 的三种取值：');
for (const unitDisplay of ['short', 'narrow', 'long']) {
  console.log(`  ${unitDisplay.padEnd(8)} ${new Intl.NumberFormat('zh-CN', { style: 'unit', unit: 'kilometer', unitDisplay }).format(42)}`);
}

// 数据大小换算：把字节数格式化成可读形式
function formatBytes(bytes) {
  const unitsList = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'];
  let value = Number(bytes);
  let index = 0;
  // 每 1024 进一级，直到数值小于 1024 或已到最大单位
  while (value >= 1024 && index < unitsList.length - 1) {
    value /= 1024;
    index++;
  }
  return new Intl.NumberFormat('zh-CN', {
    style: 'unit',
    unit: unitsList[index],
    unitDisplay: 'short',
    maximumFractionDigits: 2,
  }).format(value);
}
console.log('\n文件大小：');
for (const size of [512, 1024, 1536, 1048576, 5 * 1024 ** 3]) {
  console.log(`  ${String(size).padEnd(14)} ${formatBytes(size)}`);
}

// 温度
console.log('\n温度：', new Intl.NumberFormat('zh-CN', { style: 'unit', unit: 'celsius', unitDisplay: 'long' }).format(23.5));

// ---------------------------------------------------------------------------
// 5. 紧凑记法（notation: 'compact'）
// ---------------------------------------------------------------------------

console.log('--- 5. 紧凑记法 ---');

const counts = [1234, 12345, 1234567, 1234567890, 1234567890123];
console.log('  数值              standard            compact(short)      compact(long)');
for (const c of counts) {
  const std = new Intl.NumberFormat('zh-CN').format(c);
  const shortFmt = new Intl.NumberFormat('zh-CN', { notation: 'compact', compactDisplay: 'short' }).format(c);
  const longFmt = new Intl.NumberFormat('zh-CN', { notation: 'compact', compactDisplay: 'long' }).format(c);
  console.log(`  ${String(c).padEnd(17)}${std.padEnd(20)}${shortFmt.padEnd(20)}${longFmt}`);
}
console.log('  中文的紧凑记法用"万/亿"，英文用 K/M/B —— 这正是本地化的价值');

console.log('\n英文的紧凑记法：');
for (const c of counts) {
  console.log(`  ${String(c).padEnd(17)} ${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(c)}`);
}

// 科学计数法与工程记法
console.log('\n其它记法：');
console.log('  scientific：', new Intl.NumberFormat('en-US', { notation: 'scientific' }).format(1234567));
console.log('  engineering：', new Intl.NumberFormat('en-US', { notation: 'engineering' }).format(1234567));
console.log('  standard：', new Intl.NumberFormat('en-US', { notation: 'standard' }).format(1234567));

// ---------------------------------------------------------------------------
// 6. 符号显示（signDisplay）
// ---------------------------------------------------------------------------

console.log('--- 6. 符号显示 ---');

const deltas = [5, -5, 0];
console.log('  signDisplay   +5          -5          0');
for (const signDisplay of ['auto', 'always', 'never', 'exceptZero']) {
  const fmt = new Intl.NumberFormat('zh-CN', { signDisplay, maximumFractionDigits: 0 });
  console.log(`  ${signDisplay.padEnd(13)}${fmt.format(5).padEnd(12)}${fmt.format(-5).padEnd(12)}${fmt.format(0)}`);
}
console.log('  "exceptZero" 适合展示涨跌幅：0 时不显示正负号');

// 负数在不同地区的写法
console.log('\n负数的地区差异：');
for (const locale of ['en-US', 'de-DE', 'zh-CN', 'ja-JP']) {
  console.log(`  ${locale.padEnd(8)} ${new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(-1234.5)}`);
}

// 实战：带颜色的涨跌幅文案
function formatChange(change) {
  const fmt = new Intl.NumberFormat('zh-CN', {
    signDisplay: 'exceptZero',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // 这里只是文案层面的"颜色"，实际渲染时换成 CSS 类名
  const trend = change > 0 ? '↑' : change < 0 ? '↓' : '—';
  return `${trend} ${fmt.format(change)}%`;
}
console.log('\n涨跌幅展示：');
for (const c of [1.234, -0.567, 0]) {
  console.log('  ' + formatChange(c));
}

// ---------------------------------------------------------------------------
// 7. 复用实例与 formatToParts
// ---------------------------------------------------------------------------

console.log('--- 7. 复用实例与 formatToParts ---');

// 构造 NumberFormat 的开销远大于调用 format，循环里务必复用实例
const reusing = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' });
const prices = [9.9, 19.9, 199.99, 1999];
console.log('复用实例格式化列表：');
for (const p of prices) {
  console.log(`  ${reusing.format(p)}`);
}

// 反例：每次循环都 new 一个实例
const startReuse = process.hrtime.bigint();
for (let i = 0; i < 10_000; i++) {
  reusing.format(i + 0.5);
}
const reuseMs = Number(process.hrtime.bigint() - startReuse) / 1e6;

const startCreate = process.hrtime.bigint();
for (let i = 0; i < 10_000; i++) {
  new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(i + 0.5);
}
const createMs = Number(process.hrtime.bigint() - startCreate) / 1e6;

console.log(`\n1 万次耗时：复用实例 ${reuseMs.toFixed(1)}ms，每次新建 ${createMs.toFixed(1)}ms`);
console.log(`新建实例慢了约 ${(createMs / Math.max(reuseMs, 0.001)).toFixed(1)} 倍`);

// formatToParts：把结果拆成结构化的片段，方便自定义渲染
const parts = reusing.formatToParts(1234.5);
console.log('\nformatToParts(1234.5)：');
for (const part of parts) {
  console.log(`  type=${part.type.padEnd(11)} value=${JSON.stringify(part.value)}`);
}

// 实战用法：把货币符号单独包一层 span，方便上色
function highlightCurrency(value) {
  return reusing
    .formatToParts(value)
    // 把货币符号包成自定义标记，其余部分原样保留
    .map((p) => (p.type === 'currency' ? `<span class="cur">${p.value}</span>` : p.value))
    .join('');
}
console.log('\n高亮货币符号：', highlightCurrency(1999.99));

// 处理不间断空格：某些区域会在数字与货币符号之间插入 U+00A0
const withNbsp = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(1234.5);
console.log('\n德语的欧元格式：', JSON.stringify(withNbsp));
console.log('是否含不间断空格 U+00A0：', withNbsp.includes(' '));
// 比较或入库前统一换成普通空格
console.log('归一化后：', JSON.stringify(withNbsp.replace(/ /g, ' ')));

// ---------------------------------------------------------------------------
// 8. 综合实战：数据看板的一行指标
// ---------------------------------------------------------------------------

console.log('--- 8. 综合实战 ---');

const moneyFmt = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 });
const percentFmt = new Intl.NumberFormat('zh-CN', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const compactFmt = new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 });

const dashboard = {
  gmv: 12345678.9,
  orderCount: 98765,
  refundRate: 0.0123,
  avgPrice: 125.004,
};

console.log('  指标        展示值');
console.log(`  成交额      ${moneyFmt.format(dashboard.gmv)}`);
console.log(`  订单数      ${compactFmt.format(dashboard.orderCount)}（精确值 ${dashboard.orderCount}）`);
console.log(`  退款率      ${percentFmt.format(dashboard.refundRate)}`);
console.log(`  客单价      ${moneyFmt.format(dashboard.avgPrice)}`);

// 用 resolvedOptions 查看实际生效的配置，排错时很有用
console.log('\n实际生效的配置：', JSON.stringify(new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).resolvedOptions()));

// 判断运行环境是否支持某个区域（用 supportedLocalesOf）
console.log('\n支持的区域：', JSON.stringify(Intl.NumberFormat.supportedLocalesOf(['zh-CN', 'en-US', 'xx-XX'])));

console.log('\n全部演示完毕。');
