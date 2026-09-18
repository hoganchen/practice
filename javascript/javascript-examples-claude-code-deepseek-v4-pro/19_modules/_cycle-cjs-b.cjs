/**
 * ============================================================================
 * 辅助模块：_cycle-cjs-b.cjs —— CommonJS 循环依赖 B 侧（整体替换 exports）
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【说明】
 *   本文件以 _ 开头，是辅助模块，批量校验脚本会跳过它。
 *
 *   B 在 require A 的时候，A 正处于"执行到一半"的状态：
 *   A 的 module.exports 还是初始的空对象。CJS 不像 ESM 那样有 TDZ 检查，
 *   它**不报错**，直接把这个空对象交给你 —— 麻烦就此埋下。
 *
 *   所以这里能观察到：
 *     · a.A_NAME       -> undefined（不是报错，是静默的 undefined）
 *     · Object.keys(a) -> []（连键都没有）
 *     这也是为什么 CJS 的循环依赖问题往往在很远的地方才暴露出来。
 * ============================================================================
 */

// A 正在执行中，这里拿到的是它的"半成品"导出对象。
const a = require('./_cycle-cjs-a.cjs');

// 主动做一次"值快照"：把初始化这一刻看到的 A 记下来，供主文件日后对照。
const aAtInit = a.A_NAME;
const keysAtInit = Object.keys(a);

module.exports = {
  B_NAME: 'cjs-b',
  // 快照：永远是 undefined
  aAtInit,
  // 快照那一刻的键列表：永远是空数组
  keysAtInit,
  // 把 A 的对象引用也带出去，方便主文件证明"它一直没变"
  aObjectAtInit: a,
};

console.log('[cjs-b] 初始化时 a.A_NAME =', a.A_NAME, '（undefined = 半成品模块）');
console.log('[cjs-b] 初始化时 a 上的键 =', JSON.stringify(keysAtInit), '（空对象）');
