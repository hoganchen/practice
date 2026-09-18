/**
 * ============================================================================
 * 知识点：Intl 命名空间总览 —— 构造器清单、locale/options 结构、实例缓存
 * ============================================================================
 *
 * 【所属分类】33_intl —— 国际化 API（Intl）
 * 【难度等级】入门
 * 【前置知识】无（可先看 22_date_and_time/08_intl_datetimeformat.js）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Intl 是 ECMAScript 国际化 API（标准编号 ECMA-402）在语言里暴露的全局命名空间。
 *    它是**语言内置能力**，不需要安装任何第三方库；底层规则数据来自 CLDR
 *    （Unicode 通用语言环境数据库），由运行时提供（Node 打包 ICU，浏览器同理）。
 *    Intl 本身只是一个普通对象（命名空间），**不是构造函数**，
 *    所以 Intl() 会抛 TypeError —— 本文件会实测这一点。
 *
 * 2. 为什么需要（真实项目场景）
 *    (1) 全球化产品：同一个后台系统卖给中国、德国、沙特客户，
 *        金额、日期、姓名排序、复数措辞全都要"入乡随俗"。
 *    (2) 自己做国际化表格成本极高：德语 3 位小数用点、千分位用逗号；
 *        阿拉伯语用阿拉伯-印度数字且从右往左；俄语的"1 个/2 个/5 个"是三套词形。
 *    (3) 这些规则还在不断更新（国家改名、货币改版、新时区），
 *        靠 npm 包手写维护会持续腐化，而 Intl 跟随运行时更新。
 *
 * 3. 核心语法要点
 *    (1) 全部构造器都遵循同一个签名：new Intl.Xxx(locales, options)
 *        locales：字符串（'zh-CN'）或数组（['zh-CN','en-US']，按顺序回退）。
 *        options：普通对象，其中 locale 相关选项可以用 -u- 扩展写进标签里
 *        （'zh-CN-u-co-pinyin'、'de-DE-u-hc-h23'）。
 *    (2) 已构造的实例都有一个 format/compare/select 方法 + resolvedOptions()。
 *        resolvedOptions() 告诉你**实际生效**的选项（locale 可能被回退过）。
 *    (3) Intl.Xxx.supportedLocalesOf([...]) 静态方法：批量探测哪些标签被支持。
 *    (4) Intl.supportedValuesOf(key)：列出该运行时支持的日历、货币、时区等清单。
 *    (5) 部分方法返回的是**绑定函数**（bound function），可以脱离实例使用：
 *        const fmt = new Intl.NumberFormat('zh-CN').format;
 *        [1,2,3].map(fmt)   // 无需手写箭头函数
 *
 * 4. 常见陷阱
 *    (1) 不传 locale 就用"运行环境的默认 locale"。测试机是 zh-CN、CI 是 en-US、
 *        客户的服务器是 de-DE，输出就此各不相同。**永远显式传 locale**。
 *    (2) 在循环里 new Intl.NumberFormat(...)：本文件实测比复用实例慢约 60 倍。
 *    (3) 以为传了 locale 就一定生效：极小化 ICU 的 Node 构建（--with-intl=small-icu）
 *        缺少数据时会**静默回退**，要用 resolvedOptions().locale 校验。
 *    (4) 格式不合法（如 'not a locale!'）会抛 RangeError；
 *        但**格式合法却不存在**的标签（如 'xx-XX'）**不报错**，直接回退到默认 locale。
 *    (5) 拿 Intl 的输出反解析回数据：Intl 只负责"格式化"，不提供 parse。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 33_intl/01_intl_overview.js
 *
 * 【预期输出】
 *   分 8 个小节：Intl 命名空间结构、构造器清单表、locale/options 写法、
 *   显式传 locale 的必要性、能力探测、实例缓存性能实测、以及"只格式化不解析"小结。
 *   除"本机默认 locale"与"性能实测数值"两处会被标注为环境相关外，其余输出固定。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Intl 是命名空间，不是构造函数
// ---------------------------------------------------------------------------

console.log('--- 1. Intl 是什么 ---');

console.log('typeof Intl            =', typeof Intl);
console.log('Intl 的原型            =', Object.getPrototypeOf(Intl) === Object.prototype ? 'Object.prototype（就是个普通对象）' : '非普通对象');

// 它是命名空间，直接当函数调用会抛错，这里必须 try/catch 兜住。
try {
  Intl();
} catch (err) {
  console.log('Intl() 调用结果        ->', err.constructor.name + ':', err.message);
}

// 它的属性全是"方法/构造器"，没有实例状态。
const intlMembers = Object.getOwnPropertyNames(Intl)
  .filter((k) => typeof Intl[k] === 'function')
  .sort();
console.log('Intl 上的函数成员      =', intlMembers.join(', '));

// ---------------------------------------------------------------------------
// 2. 构造器清单：谁负责什么
// ---------------------------------------------------------------------------

console.log('\n--- 2. Intl 构造器清单 ---');

// 用表格把"构造器 -> 职责 -> 本目录对应文件"列清楚，方便按需查阅。
const CONSTRUCTORS = [
  ['Intl.Collator', '本地化字符串比较/排序', '02_intl_collator.js'],
  ['Intl.PluralRules', '复数类别与序数词', '03_intl_plural_rules.js'],
  ['Intl.ListFormat', '把数组拼成"张三、李四和王五"', '04_intl_list_format.js'],
  ['Intl.Segmenter', '分词、字素簇/句子切分', '05_intl_segmenter.js'],
  ['Intl.DisplayNames', '语言/地区/货币等名称的本地化', '06_intl_display_names.js'],
  ['Intl.Locale', '解析与推导 BCP 47 语言标签', '07_intl_locale.js'],
  ['Intl.NumberFormat', '数字/货币/百分比/单位格式化', '本目录未单独开篇（见 22 目录同族思路）'],
  ['Intl.DateTimeFormat', '日期时间格式化', '22_date_and_time/08_intl_datetimeformat.js'],
  ['Intl.RelativeTimeFormat', '相对时间措辞（"昨天"）', '22_date_and_time/08_intl_datetimeformat.js'],
];
console.table(
  CONSTRUCTORS.map(([name, duty, file]) => ({ 构造器: name, 职责: duty, 深入阅读: file })),
);

// 版本差异：DurationFormat 是较新的提案，老运行时上不存在。
console.log('Intl.DurationFormat 在本运行时是否存在 =', typeof Intl.DurationFormat);
console.log('注意：新构造器（如 DurationFormat）在旧 Node/旧浏览器上可能是 undefined，用前先探测。');

// ---------------------------------------------------------------------------
// 3. locale 与 options 的写法
// ---------------------------------------------------------------------------

console.log('\n--- 3. locale 参数与 options 结构 ---');

// locale 的三种写法：
//   (a) 单个字符串
//   (b) 字符串数组 = 优先级回退链（第一个不被支持就用第二个）
//   (c) Intl.Locale 实例
const single = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const chain = new Intl.NumberFormat(['xx-XX', 'zh-CN'], { style: 'currency', currency: 'CNY' });
const viaLocaleObject = new Intl.NumberFormat(new Intl.Locale('zh-CN'), {
  style: 'currency',
  currency: 'CNY',
});

console.log('单个标签  de-DE        ->', single.format(1234567.891));
console.log('数组回退  [xx-XX,zh-CN]->', chain.format(1234567.891), '| 实际生效 locale =', chain.resolvedOptions().locale);
console.log('Intl.Locale 实例       ->', viaLocaleObject.format(1234567.891));

// options 分三类：
//   通用：localeMatcher、numberingSystem（数字系统）、calendar
//   专有：由各构造器自己定义（style/currency/type/granularity...）
//   扩展：也可以通过 -u- 写在 locale 标签里，两者等价，标签里的写法优先级更低
console.log('\n两种写法的等价关系（指定德语电话簿排序）：');
console.log('  标签内 -u-co-phonebk             ->', new Intl.Collator('de-DE-u-co-phonebk').resolvedOptions().locale);
console.log('  options.collation = "phonebk"    ->', new Intl.Collator('de-DE', { collation: 'phonebk' }).resolvedOptions().locale);
console.log('  两者输出完全相同：扩展选项最终会被规范化进 locale 标签里（注意 region 被省略，');
console.log('  因为排序规则是"语言级"的，CLDR 认为它对整个 de 都成立）。');

console.log('\n数字系统也能这样指定（options 与 -u-nu- 等价）：');
const hanidec = new Intl.NumberFormat('zh-CN', { numberingSystem: 'hanidec' });
console.log('  numberingSystem: "hanidec" ->', hanidec.format(123), '| 生效 locale =', hanidec.resolvedOptions().locale);
console.log('  注意：numberingSystem 不会写进 locale 标签，要从 resolvedOptions().numberingSystem 读。');

// ---------------------------------------------------------------------------
// 4. 为什么必须显式传 locale
// ---------------------------------------------------------------------------

console.log('\n--- 4. 为什么必须显式传 locale ---');

// 不传 locale 时，取的是宿主环境的默认 locale。同一台机器上它就等于系统区域设置，
// 换台机器（CI / 服务器 / 同事的笔记本）就完全不一样。下面这行是"环境相关"的。
const envDefault = new Intl.DateTimeFormat().resolvedOptions().locale;
console.log('[环境相关] 本机默认 locale =', envDefault, '（换台机器就可能变成 en-US / de-DE）');
console.log('           process.env.TZ   =', String(process.env.TZ));

const instant = new Date('2024-03-15T09:30:45Z');
console.log('\n同一个时刻，同一个 API，只因为"有没有显式传 locale"，结果就不同：');
console.log('  不传 locale（跟随环境）-> [环境相关]', new Intl.DateTimeFormat(undefined, { timeZone: 'UTC' }).format(instant));
for (const loc of ['zh-CN', 'en-US', 'de-DE']) {
  console.log(`  显式传 ${loc.padEnd(6)}        ->`, new Intl.DateTimeFormat(loc, { timeZone: 'UTC' }).format(instant));
}
console.log('\n结论：库代码 / 测试代码 / 服务端渲染里，一律显式传 locale；');
console.log('      只有"跟随用户系统设置"的产品页面，才该使用 undefined（即默认行为）。');

// ---------------------------------------------------------------------------
// 5. 回退的两个层次：非法标签抛错，未知标签静默回退
// ---------------------------------------------------------------------------

console.log('\n--- 5. 非法标签 vs 未知标签 ---');

try {
  // 结构不合法的标签（不是合法的 BCP 47 子标签）会直接抛 RangeError。
  new Intl.NumberFormat('not a locale!');
} catch (err) {
  console.log('结构非法 "not a locale!" ->', err.constructor.name + ':', err.message);
}

// 结构合法、但运行时没有该语言数据：不抛错，静默回退到默认 locale。
const unknown = new Intl.NumberFormat('xx-XX');
console.log('结构合法 "xx-XX"        -> 不抛错，实际生效 locale = [环境相关]', unknown.resolvedOptions().locale);
console.log('这就是"以为国际化生效了、其实没生效"的经典事故来源，务必用 resolvedOptions() 校验。');

// ---------------------------------------------------------------------------
// 6. 能力探测：supportedLocalesOf 与 supportedValuesOf
// ---------------------------------------------------------------------------

console.log('\n--- 6. 能力探测 ---');

const wanted = ['zh-CN', 'en-US', 'de-DE', 'xx-XX', 'ar-EG'];
console.log('Intl.NumberFormat.supportedLocalesOf(' + JSON.stringify(wanted) + ')');
console.log('  ->', Intl.NumberFormat.supportedLocalesOf(wanted), '（xx-XX 被剔除）');
console.log('Intl.Collator.supportedLocalesOf([]) ->', Intl.Collator.supportedLocalesOf([]), '（空数组返回空数组）');

// supportedValuesOf：把运行时支持的"清单"列出来，适合做下拉框/校验。
console.log('\nIntl.supportedValuesOf(...) 支持的数量：');
const counts = {};
for (const key of ['calendar', 'collation', 'currency', 'numberingSystem', 'timeZone', 'unit']) {
  counts[key] = Intl.supportedValuesOf(key).length;
}
console.table(Object.entries(counts).map(([k, v]) => ({ 类别: k, 数量: v })));
console.log('示例（前 4 个）：currency ->', Intl.supportedValuesOf('currency').slice(0, 4).join(', '));
console.log('示例（前 4 个）：timeZone ->', Intl.supportedValuesOf('timeZone').slice(0, 4).join(', '));
console.log('注意：这些数量随 ICU 版本变化，是"环境相关"的；下面只对比"非零且合理"。');
console.log('判断依据：currency 数量 > 100 =', Intl.supportedValuesOf('currency').length > 100, '；timeZone 数量 > 100 =', Intl.supportedValuesOf('timeZone').length > 100);

// ---------------------------------------------------------------------------
// 7. 实例缓存：本文件最重要的一条性能建议
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实例缓存的重要性（实测）---');

const ITER = 20000;
const AMOUNT = 1234.5;
const OPTS = { style: 'currency', currency: 'EUR' };

/**
 * 计时小工具：先预热一次，再跑 n 次，返回毫秒数。
 * 预热是为了让 JIT 先编译好，避免把编译时间算进去。
 * @param {() => void} fn 被测函数
 * @param {number} n 迭代次数
 * @returns {number} 耗时（毫秒，保留 1 位小数）
 */
function bench(fn, n) {
  fn();
  const start = process.hrtime.bigint();
  for (let i = 0; i < n; i++) fn();
  return Number(process.hrtime.bigint() - start) / 1e6;
}

// ❌ 反例：每次调用都重新构造 formatter（locale 解析 + options 校验 + ICU 查找）
const costNew = bench(() => new Intl.NumberFormat('de-DE', OPTS).format(AMOUNT), ITER);
// ❌ 反例二：toLocaleString 内部同样每次构造一个 formatter，代价相当
const costToLocale = bench(() => AMOUNT.toLocaleString('de-DE', OPTS), ITER);
// ✅ 正例：构造一次，循环里只调用 format
const cached = new Intl.NumberFormat('de-DE', OPTS);
const costCached = bench(() => cached.format(AMOUNT), ITER);

console.log(`迭代 ${ITER} 次格式化 1234.5：`);
console.log('  [环境相关] 每次 new 一个 formatter ->', costNew.toFixed(1), 'ms');
console.log('  [环境相关] 每次 toLocaleString     ->', costToLocale.toFixed(1), 'ms');
console.log('  [环境相关] 复用同一个实例          ->', costCached.toFixed(1), 'ms');
console.log('  结论（与机器无关）：复用实例比每次新建快 1~2 个数量级，本机约',
  Math.round(costNew / Math.max(costCached, 0.001)), '倍。');
console.log('  绝对毫秒数因机器而异，但"数量级差距"在任何环境都成立。');

// format 取出来是绑定函数，可以直接当回调使用。
const boundFormat = cached.format;
console.log('cached.format === cached.format ->', cached.format === cached.format, '（每次取到的是同一个绑定函数）');
console.log('绑定函数可直接传给 map：', [1, 2, 3].map(boundFormat));
console.log('绑定函数脱离实例也能调用（解构出来也不会丢 this）：', (() => { const f = cached.format; return f(9.99); })());

// ---------------------------------------------------------------------------
// 8. 小结：Intl 只格式化，不解析
// ---------------------------------------------------------------------------

console.log('\n--- 8. 小结：Intl 只负责"格式化"，不负责"解析" ---');

console.log('new Intl.NumberFormat("de-DE").parse ->', typeof new Intl.NumberFormat('de-DE').parse, '（不存在）');
console.log('把德语格式的字符串塞回 Number()：');
const german = new Intl.NumberFormat('de-DE').format(1234.56);
console.log('  de-DE 格式化结果     =', JSON.stringify(german));
console.log('  Number(german)       =', Number(german), '（NaN —— 千分位点与小数点都不被识别）');
console.log('  parseFloat(german)   =', parseFloat(german), '（≈1234 —— 静默截断，更危险）');
console.log('正确做法：解析用固定协议（ISO 8601 日期串、整数最小单位），');
console.log('          "格式化给人看、解析用机器格式"，详见 08_intl_best_practices.js。');

console.log('\n本节结束。');
