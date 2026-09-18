/**
 * ============================================================================
 * 知识点：chalk —— 终端彩色输出、样式组合、嵌套样式、level 检测
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】入门
 * 【前置知识】21_json 或任意"字符串处理"章节
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    chalk 是一个终端字符串着色库。它在字符串前后插入 ANSI 转义序列
 *    （形如 Escape[31m 表示前景色变红，Escape[39m 表示恢复默认前景色，
 *      其中 Escape 是 ASCII 码 27 的控制字符，在 JS 里写作 ''），
 *    从而使终端以指定的颜色/样式显示文本。
 *
 *    三个关键概念：
 *      (a) 模板标签调用：chalk.red('文本') 直接返回着色后的字符串；
 *      (b) 链式组合：chalk.bold.red.bgWhite('文本') 可以叠加多种样式；
 *      (c) 嵌套：在一个着色字符串里再插入另一个着色字符串时，
 *          chalk 会正确地"恢复"外层样式（这是它比手写转义序列强的地方）。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    - CLI 工具：让成功/失败/警告一眼可辨（构建工具、脚手架、lint 报告）；
 *    - 日志系统：错误红色、警告黄色、调试灰色，大幅提升扫读效率；
 *    - 测试报告：通过的用例绿色、失败的红色、跳过的黄色；
 *    - 开发体验：给配置项、路径、变量名加色，让长文本更易读。
 *
 * 3. 核心语法要点
 *    import chalk, { Chalk } from 'chalk';   // 默认导出是实例，Chalk 是类
 *    chalk.red('x') / chalk.green('x') / chalk.blue('x') ...
 *    chalk.bold / chalk.dim / chalk.italic / chalk.underline / chalk.strikethrough / chalk.inverse
 *    chalk.bgRed('x') / chalk.bgHex('#ff8800')('x')
 *    chalk.hex('#88ff00')('x') / chalk.rgb(255, 136, 0)('x')   真彩色（需要 level >= 2）
 *    chalk.bold.red.underline('x')                              链式组合（顺序无关）
 *    chalk.level                                                当前支持的色彩级别
 *    new Chalk({ level: 3 })                                    强制指定级别的独立实例
 *    chalk.supportsColor                                        当前环境是否支持颜色
 *
 *    颜色级别（level）的含义：
 *      0 = 不支持颜色（输出纯文本，自动去掉转义序列）
 *      1 = 基础 16 色
 *      2 = 256 色
 *      3 = 真彩色（1600 万色）
 *    chalk 会自动检测：TTY、CI 环境、TERM 变量、NO_COLOR / FORCE_COLOR 环境变量。
 *
 * 4. 常见陷阱
 *    - **设置 NO_COLOR=1 时 chalk.level 会变成 0，所有着色都会被静默去掉。**
 *      这不是 bug，是设计：遵守 no-color.org 约定，让用户能关掉颜色。
 *      但写测试或生成报告文件时很容易被这个坑到（本文件因此同时打印纯文本对照）。
 *    - 把带颜色的字符串写进文件/数据库：ANSI 转义序列是可见的垃圾字符。
 *      需要落盘时用 chalk.level = 0，或直接存纯文本、只在展示时着色。
 *    - 字符串长度计算错误：加了颜色后 str.length 变大了（转义序列也占位），
 *      做终端表格对齐时必须先补空格再着色，或先去掉转义序列再算长度
 *      （chalk 本身不导出 stripAnsi，需要自己写正则或用 strip-ansi 包）。
 *    - 在浏览器控制台里 chalk 不起作用（它是 Node 库）；
 *      浏览器里用 CSS 的 %c 占位符。
 *    - 过度使用颜色：全屏五颜六色反而降低可读性。建议只给"关键差异"着色。
 *    - 真彩色在部分终端（尤其是旧版 Windows cmd）不支持，会降级或显示乱码，
 *      所以重要的信息不能只靠颜色传达（要考虑色盲用户和灰度终端）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/07_chalk_terminal_colors.js
 *
 * 【预期输出】
 *   打印 chalk 的各种颜色与样式。注意：本仓库的校验脚本会设置 NO_COLOR=1，
 *   此时 chalk.level 为 0，输出为纯文本；在普通终端里直接运行则能看到真实颜色。
 *   本文件同时打印"原始转义序列"和"level 信息"，保证任何环境下都有信息量。
 *   退出码 0。
 * ============================================================================
 */

// chalk 的默认导出是一个已经创建好的实例（可直接用）；
// 同时它也导出了 Chalk 类，用来创建"自定义 level"的独立实例。
import chalk, { Chalk } from 'chalk';
import assert from 'node:assert/strict';

console.log('--- 0. 环境检测：chalk 是怎么判断能不能用颜色的 ---');
console.log(`  chalk.level        = ${chalk.level}  (0=无色 1=16色 2=256色 3=真彩色)`);
console.log(`  NO_COLOR 环境变量   = ${JSON.stringify(process.env.NO_COLOR ?? null)}`);
console.log(`  FORCE_COLOR 环境变量= ${JSON.stringify(process.env.FORCE_COLOR ?? null)}`);
console.log(`  TERM 环境变量       = ${JSON.stringify(process.env.TERM ?? null)}`);
console.log(`  stdout 是 TTY 吗？  = ${process.stdout.isTTY === true}`);
console.log(`  supportsColor      = ${chalk.supportsColor ? JSON.stringify({ level: chalk.supportsColor.level, hasBasic: chalk.supportsColor.hasBasic }) : 'false'}`);
console.log('');
console.log('  检测顺序（简化版）：');
console.log('    1. 如果有 NO_COLOR 环境变量（且非空）-> level = 0，强制无色');
console.log('    2. 如果有 FORCE_COLOR -> 按其值设定级别');
console.log('    3. 如果 stdout 不是 TTY（比如重定向到文件、被管道接走）-> level = 0');
console.log('    4. 否则根据 TERM / CI 环境变量推断级别');
console.log('');
console.log('  本仓库的 scripts/run-all.js 会设置 NO_COLOR=1 与 FORCE_COLOR=0，');
console.log('  目的是让所有示例的输出易于比对。因此在自动化校验时，');
console.log('  下面所有 chalk.xxx() 的输出都会是纯文本 —— 这是预期行为。');
console.log('');

// 构造一个"无论如何都能看到颜色"的实例，用来演示真实的着色效果。
// new Chalk({ level: 3 }) 会绕过自动检测，强制使用真彩色。
const forceColor = new Chalk({ level: 3 });
// 同时准备一个"强制无色"的实例，说明同一份代码可以在两种模式下运行
const forcePlain = new Chalk({ level: 0 });

console.log('--- 1. 前景色（基础 8 色 + 亮色 8 色）---');
// 提示：终端里直接运行才能看到颜色，这里同时展示"转义序列"以便理解原理
const namedColors = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
console.log('  标准色：');
for (const color of namedColors) {
  console.log(`    ${forceColor[color](color.padEnd(10))} <- chalk.${color}('...')`);
}
console.log('  亮色（bright 前缀）：');
for (const color of namedColors) {
  const name = `b${color}`; // 简化 key：如 bred / bgreen，对应 chalk.bred / chalk.bgreen
  if (typeof forceColor[name] === 'function') {
    console.log(`    ${forceColor[name](name.padEnd(10))} <- chalk.${name}('...')`);
  }
}
console.log('  （bblack ~ bwhite 是 chalk 提供的亮色简写，等价于 chalk.blackBright 等。）');
console.log('');

console.log('--- 2. 背景色 ---');
for (const color of ['bgRed', 'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan']) {
  console.log(`    ${forceColor[color](` ${color} `.padEnd(12))} <- chalk.${color}('...')`);
}
console.log('');

console.log('--- 3. 文本样式 ---');
console.log(`  加粗      ${forceColor.bold('chalk.bold')}`);
console.log(`  变暗      ${forceColor.dim('chalk.dim')}`);
console.log(`  斜体      ${forceColor.italic('chalk.italic')}（部分终端不支持）`);
console.log(`  下划线    ${forceColor.underline('chalk.underline')}`);
console.log(`  删除线    ${forceColor.strikethrough('chalk.strikethrough')}`);
console.log(`  反色      ${forceColor.inverse('chalk.inverse')}（前景背景互换）`);
console.log(`  隐藏      ${forceColor.hidden('chalk.hidden')}（通常看不见，少数终端显示为空白）`);
console.log(`  重置      ${forceColor.reset('chalk.reset')}`);
console.log('');

console.log('--- 4. 链式组合：多个样式叠加 ---');
// 链式调用与顺序无关，chalk 内部会按固定顺序拼装转义序列
console.log(`  ${forceColor.bold.red('chalk.bold.red')}          粗体红字`);
console.log(`  ${forceColor.bold.underline.blue('chalk.bold.underline.blue')}  粗体下划线蓝字`);
console.log(`  ${forceColor.white.bgRed.bold(' chalk.white.bgRed.bold ')}  白字红底加粗`);
console.log(`  ${forceColor.black.bgYellow(' 警告 ')}  ${forceColor.white.bgRed(' 错误 ')}  ${forceColor.black.bgGreen(' 成功 ')}`);
console.log('  注意：chalk.red.bold 与 chalk.bold.red 的**视觉效果**完全相同，');
console.log('  但转义序列的排列顺序不同（一个是先红后粗，一个是先粗后红）。');
console.log('  所以不要把不同顺序的链式结果做字符串相等比较 —— 那会失败。');
console.log('');

console.log('--- 5. 嵌套样式：chalk 最见功力的地方 ---');
// 外层设定一种样式，内层插入另一种样式后，内层结束时应当"恢复"外层样式。
// 手写 ANSI 转义序列时这一步极容易写错（内层的 reset 会把外层的颜色也清掉）。
const nested = forceColor.red(`这是一段红字，里面有 ${forceColor.bold.green('加粗的绿字')}，后面应该继续是红字`);
console.log(`  ${nested}`);
console.log('');
console.log('  观察：内层绿字结束后，后面的文字仍然是红色 —— ');
console.log('  chalk 会在内层样式结束时重新插入外层的转义序列，而不是简单地 reset。');
console.log('');
console.log('  用原始字节验证这一点（把不可见的转义序列显式打印出来）：');
const rawNested = forceColor.bold.blue(`外层蓝 ${forceColor.yellow('内层黄')} 回到蓝`);
console.log(`    原始字符串：${JSON.stringify(rawNested)}`);
console.log('    \\u001b[1m\\u001b[34m  = 加粗 + 蓝色（外层开始）');
console.log('    \\u001b[33m          = 黄色（内层开始）');
console.log('    \\u001b[39m          = 恢复默认前景色（内层结束）');
console.log('    \\u001b[34m          = 重新应用蓝色（恢复外层）');
console.log('    \\u001b[22m\\u001b[39m = 关闭加粗、恢复默认色（外层结束）');
console.log('');

console.log('--- 6. 真彩色与十六进制颜色（需要 level >= 2）---');
console.log(`  ${forceColor.hex('#ff8800')('chalk.hex("#ff8800")')}  十六进制指定前景色`);
console.log(`  ${forceColor.bgHex('#0055ff').white(' chalk.bgHex("#0055ff") ')}  十六进制背景色`);
console.log(`  ${forceColor.rgb(0, 200, 150)('chalk.rgb(0, 200, 150)')}  RGB 三元组`);
console.log(`  ${forceColor.ansi256(196)('chalk.ansi256(196)')}  256 色索引`);
console.log('');
console.log('  重要：这些颜色只在 level >= 2 时生效。若终端只支持 16 色（level = 1），');
console.log('  chalk 会降级到最接近的基础色；若 level = 0，则完全不着色。');
console.log('  它们的可见效果在不同终端上差异很大，所以不要用它传达关键信息。');
console.log('');

console.log('--- 7. level 对输出的实际影响（本文件最重要的部分）---');

const demoText = '同一段文本，三种 level';

// level 3：真彩色
const atLevel3 = new Chalk({ level: 3 }).hex('#ff8800').bold(demoText);
// level 1：基础色
const atLevel1 = new Chalk({ level: 1 }).red.bold(demoText);
// level 0：无色（纯文本）
const atLevel0 = new Chalk({ level: 0 }).hex('#ff8800').bold(demoText);

console.log(`  level 3（真彩色）原始输出：${JSON.stringify(atLevel3)}`);
console.log(`  level 1（16 色） 原始输出：${JSON.stringify(atLevel1)}`);
console.log(`  level 0（无色）  原始输出：${JSON.stringify(atLevel0)}`);
console.log('');
console.log(`  level 3 的字符串长度：${atLevel3.length}`);
console.log(`  level 1 的字符串长度：${atLevel1.length}`);
console.log(`  level 0 的字符串长度：${atLevel0.length}（等于纯文本长度 ${demoText.length}）`);
console.log('  结论：level 只影响"是否插入转义序列"，文本内容本身完全不变。');
console.log('        所以 level 0 时 str.length 才是"肉眼看到的字符数"。');
console.log('');

console.log('  真实渲染效果（当前环境 level = ' + chalk.level + '）：');
console.log(`    ${forceColor.hex('#ff8800').bold(demoText)} <- 强制 level 3`);
console.log(`    ${forceColor.red.bold(demoText)} <- 强制 level 1`);
console.log(`    ${forcePlain.hex('#ff8800').bold(demoText)} <- 强制 level 0（纯文本）`);
console.log('');

console.log('--- 8. 实战：一个彩色日志函数 ---');

/**
 * 彩色日志工具。
 * 真实项目里通常还会加上时间戳、请求 ID、日志级别过滤等。
 * @param {'info'|'warn'|'error'|'success'|'debug'} level
 * @param {string} message
 */
function log(level, message) {
  // 用查表代替 if-else，新增级别只需加一行
  const styles = {
    info: forceColor.blue,
    warn: forceColor.yellow,
    error: forceColor.red,
    success: forceColor.green,
    debug: forceColor.dim,
  };
  const labels = {
    info: 'INFO ',
    warn: 'WARN ',
    error: 'ERROR',
    success: 'OK   ',
    debug: 'DEBUG',
  };
  const style = styles[level] ?? forceColor.white;
  // 用背景色 + 固定宽度做"徽章"，让日志级别对齐
  console.log(`${style.inverse(` ${labels[level]} `)} ${message}`);
}

log('info', '服务启动，监听端口 3000');
log('success', '数据库连接成功');
log('warn', '缓存未命中，回退到数据库查询（耗时 120ms）');
log('error', '调用支付网关失败：连接超时');
log('debug', '请求体：{"userId": 42, "action": "checkout"}');
console.log('');

console.log('--- 9. 实战：终端表格对齐（颜色会破坏长度计算）---');

/** 表格数据 */
const tableRows = [
  { name: '构建', status: 'ok', ms: 1234 },
  { name: '单元测试', status: 'fail', ms: 567 },
  { name: '端到端测试', status: 'skip', ms: 0 },
];

/**
 * 按状态返回对应的着色函数（注意返回的是"函数"而不是"已经着色的字符串"）。
 * 这样调用方可以先补空格再着色，长度计算才准确。
 * @param {string} status
 */
const statusStyle = (status) => {
  const map = { ok: forceColor.green, fail: forceColor.red, skip: forceColor.yellow };
  return map[status] ?? forceColor.white;
};

console.log('  错误示范：先着色再 padEnd，表格会错位');
for (const row of tableRows) {
  // 带颜色的字符串长度 = 可见长度 + 转义序列长度，padEnd 会算错，导致列对不齐
  console.log(`    ${row.name.padEnd(12)} ${statusStyle(row.status)(row.status).padEnd(10)} ${row.ms}ms`);
}

console.log('');
console.log('  正确示范：先按可见长度补空格，最后再着色');
for (const row of tableRows) {
  const paddedName = row.name.padEnd(14, ' ');
  // 先补空格再着色 —— 长度计算基于可见字符，表格自然对齐
  console.log(`    ${paddedName} ${statusStyle(row.status)(row.status.padEnd(6))} ${String(row.ms).padStart(6)}ms`);
}
console.log('');
console.log('  另一个办法：写一个 stripAnsi 把转义序列去掉再算长度。');
console.log('  注意：chalk 本身**没有**导出 stripAnsi（截至本文件使用的 5.6.2 版本），');
console.log('        需要自己写正则，或安装独立的 strip-ansi 包。');

/**
 * 去掉字符串里的 ANSI 转义序列，得到"肉眼可见"的纯文本。
 * 正则含义：ESC [ 后面跟若干"参数字节"（数字与分号），最后以一个字母结尾。
 * @param {string} text
 */
function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\[[0-9;]*[A-Za-z]/g, '');
}

const coloredText = forceColor.red.bold('彩色文本');
console.log(`    带颜色的字符串长度：${coloredText.length}`);
console.log(`    去掉转义序列后长度：${stripAnsi(coloredText).length}（这才是肉眼看到的字符数：${stripAnsi(coloredText)}）`);
console.log(`    用 stripAnsi 对表格重新对齐：`);
for (const row of tableRows) {
  const visible = stripAnsi(statusStyle(row.status)(row.status));
  console.log(`      ${row.name.padEnd(14)} ${visible.padEnd(6)} ${String(row.ms).padStart(6)}ms`);
}
console.log('');

console.log('--- 10. 什么时候不该用颜色 ---');
console.log('  1. 写入文件 / 数据库 / 日志收集系统 —— ANSI 序列会成为垃圾字符；');
console.log('     解法：用 level 0 的实例，或只在"输出到终端"时才着色；');
console.log('  2. 需要精确对齐的表格 —— 必须先算可见长度；');
console.log('  3. 只靠颜色传达信息 —— 色盲用户与灰度终端会丢失信息；');
console.log('     解法：颜色 + 符号双重编码（如 ✓ / ✖ 与颜色同时使用）；');
console.log('  4. 面向用户的正式报告 —— 用户可能复制粘贴到别处。');
console.log('');

console.log('--- 11. 替代方案 ---');
console.log('  - picocolors：体积小到约 1KB（chalk 约 5KB），API 更简单，生态里很流行；');
console.log('  - ansi-colors / kleur：同类轻量替代；');
console.log('  - Node 内置 util.styleText()（Node 20.12+）：零依赖实现基础着色；');
console.log('  - 原生 ANSI 转义序列：完全不需要依赖，但要自己处理嵌套恢复（容易写错）。');

// 顺便演示一下 Node 内置的着色能力，作为零依赖方案
import { styleText } from 'node:util';
if (typeof styleText === 'function') {
  console.log('');
  console.log('  Node 内置方案演示：');
  console.log(`    ${styleText('red', 'util.styleText("red", ...)')}`);
  console.log(`    ${styleText(['bold', 'green'], 'util.styleText(["bold","green"], ...)')}`);
  console.log('    （Node 20.12+ 提供，不需要任何第三方依赖。）');
}
console.log('');

// ---------------------------------------------------------------------------
// 自测断言
// ---------------------------------------------------------------------------
console.log('--- 12. 自测断言 ---');

// level 0 时不着色
assert.strictEqual(atLevel0, demoText, 'level 0 应输出纯文本');
assert.strictEqual(atLevel0.length, demoText.length);
// level 3 时应当插入转义序列
assert.ok(atLevel3.length > demoText.length, 'level 3 应插入转义序列');
assert.ok(atLevel3.includes('\u001b['), 'level 3 输出应包含 ANSI 转义序列');
// 文本内容不受着色影响：去掉转义序列后应当还原
assert.strictEqual(stripAnsi(atLevel3), demoText);
assert.strictEqual(stripAnsi(atLevel1), demoText);
// 嵌套时内层结束后应重新应用外层颜色
assert.ok(rawNested.includes('\u001b[34m'), '嵌套应重新应用外层的蓝色');
assert.strictEqual(stripAnsi(rawNested), '外层蓝 内层黄 回到蓝');
// 链式组合：视觉结果相同，但转义序列的排列顺序不同
const combo1 = forceColor.bold.red('x');
const combo2 = forceColor.red.bold('x');
assert.notStrictEqual(combo1, combo2, '链式顺序会改变转义序列的排列');
assert.strictEqual(stripAnsi(combo1), 'x');
assert.strictEqual(stripAnsi(combo2), 'x');
assert.strictEqual(stripAnsi(combo1), stripAnsi(combo2), '去掉转义序列后视觉内容一致');
// 强制实例的 level 固定
assert.strictEqual(forcePlain.level, 0);
assert.strictEqual(forceColor.level, 3);
console.log(`  全部断言通过（当前环境 chalk.level = ${chalk.level}）。`);
console.log('');
console.log('  提示：在普通终端里直接运行 `node 29_npm_libraries/07_chalk_terminal_colors.js`');
console.log('        就能看到真实的颜色效果；通过校验脚本运行时会被强制为纯文本。');
console.log('');
console.log('演示结束。');
