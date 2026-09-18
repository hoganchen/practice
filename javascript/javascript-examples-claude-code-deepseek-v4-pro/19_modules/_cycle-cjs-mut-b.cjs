/**
 * ============================================================================
 * 辅助模块：_cycle-cjs-mut-b.cjs —— CJS 循环依赖 B 侧（原地挂属性）
 * ============================================================================
 *
 * 【所属分类】19_modules —— ES Module（ESM）模块化
 * 【说明】
 *   本文件以 _ 开头，是辅助模块，批量校验脚本会跳过它。
 *
 *   这里演示 CJS 循环依赖的两种典型后果，都被本地 try/catch 接住，
 *   保证示例进程仍能以退出码 0 结束：
 *     1. 初始化阶段读 a.A_NAME  -> undefined（不报错，是半成品）
 *     2. 初始化阶段调 a.mul()   -> TypeError: a.mul is not a function（因为函数还没挂上去）
 *   而这两个属性在 A 执行完之后都会就位，所以"同样的代码晚点跑就没事" ——
 *   这正是循环依赖最坑的地方：问题只在特定的时序下出现。
 * ============================================================================
 */

const a = require('./_cycle-cjs-mut-a.cjs');

// 第 1 种后果：初始化阶段读属性 -> 静默的 undefined
const keysAtInit = Object.keys(a);
const nameAtInit = a.A_NAME;

// 第 2 种后果：初始化阶段调用尚未挂上去的函数 -> TypeError
let callResult;
try {
  callResult = `返回 ${a.mul(3, 4)}`;
} catch (err) {
  callResult = `${err.constructor.name}: ${err.message}`;
}

module.exports = {
  B_NAME: 'cjs-mut-b',
  // 下面两个是"初始化那一刻"的快照
  keysAtInit,
  nameAtInit,
  callResult,
  // 而且把引用也带出去，证明它和 main 后来拿到的是同一个对象
  aRef: a,
};

console.log('[cjs-mut-b] 初始化时 a 上的键 =', JSON.stringify(keysAtInit), '（A 还没挂任何属性）');
console.log('[cjs-mut-b] 初始化时 a.A_NAME =', nameAtInit);
console.log('[cjs-mut-b] 初始化时调用 a.mul(3, 4) ->', callResult);
