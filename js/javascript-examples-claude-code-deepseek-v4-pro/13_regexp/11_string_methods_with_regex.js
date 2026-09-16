/**
 * ============================================================================
 * 知识点：字符串方法配合正则 —— match / matchAll / search / split / replace
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】进阶
 * 【前置知识】13_regexp/05_groups_and_alternation.js、13_regexp/09_flags.js、
 *             13_regexp/10_replace_with_function.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    正则不会自己做事，真正干活的是"宿主方法"。除了 RegExp 自己的 test / exec，
 *    字符串上还有五个方法接受正则参数：
 *      str.match(re)        查找匹配，返回形态随 g 标志而变
 *      str.matchAll(re)     返回所有匹配的迭代器（必须带 g）
 *      str.search(re)       返回第一个匹配的下标（找不到返回 -1），忽略 g
 *      str.split(re)        用匹配作为分隔符切分字符串
 *      str.replace(re, ...) 替换（10 号文件已详述）
 *
 * 2. 为什么需要
 *    知道"用哪个方法"比"会写正则"更能决定代码是否简洁。
 *    同一个需求用错方法，往往会写出多余的循环，或者悄悄丢掉捕获组。
 *
 * 3. 核心语法要点
 *    ---- match 的两种形态（最容易记混） ----
 *    无 g：返回与 exec 相同结构的数组（含 index / input / length / groups），
 *          找不到返回 null。
 *    有 g：返回"所有整体匹配文本"的普通数组，**没有 index、没有捕获组**；
 *          找不到返回 null（注意不是空数组）。
 *    ---- matchAll ----
 *    必须带 g，否则抛 TypeError。返回迭代器，每个元素都是 exec 那样的完整结果
 *    （含 index 与捕获组）。因为它返回迭代器，所以可以直接 for...of。
 *    ---- search ----
 *    只返回下标，永远忽略 g 与 lastIndex，也不会重置 lastIndex。
 *    ---- split ----
 *    参数是正则时按"匹配到的内容"切分；如果正则里含捕获组，
 *    捕获到的分隔符本身也会被插入结果数组（这是很多人第一次见会惊讶的行为）。
 *    另可传第二个参数 limit 限制结果个数。
 *
 * 4. 常见陷阱
 *    (1) 用带 g 的 match 却想读 index 或分组 —— 拿不到，必须换 matchAll / exec。
 *    (2) 忘记给 matchAll 加 g，直接抛 TypeError。
 *    (3) 用 split 切分时，正则里的括号会把分隔符塞回结果里。
 *    (4) split('') 与 split(//u) 对 emoji 的结果不同：前者按码元切，后者按码点切。
 *    (5) search 与 indexOf 的区别：search 支持正则，但只能给一个模式，
 *        且无法指定起始位置。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/11_string_methods_with_regex.js
 *
 * 【预期输出】
 *   逐个方法对比"有 g / 无 g"的返回形态差异，并打印 split 的捕获组行为、
 *   matchAll 的完整迭代结果，以及 emoji 切分的对照实验。
 * ============================================================================
 */

console.log('--- 1. match 无 g：返回 exec 风格的完整结果 ---');

const log = 'INFO: ok | ERROR: disk full | WARN: slow';
const noG = log.match(/(\w+): ([^|]+)/);

console.log('  结果 =', JSON.stringify(noG));
console.log('  是数组吗 =', Array.isArray(noG), ' 有 index 吗 =', noG.index !== undefined);
console.log('  [0] 整体匹配 =', JSON.stringify(noG[0]));
console.log('  [1] 组 1 =', JSON.stringify(noG[1]));
console.log('  [2] 组 2 =', JSON.stringify(noG[2]));
console.log('  index =', noG.index, ' input 长度 =', noG.input.length);

console.log('--- 2. match 有 g：只剩整体匹配文本 ---');

const withG = log.match(/(\w+): ([^|]+)/g);
console.log('  结果 =', JSON.stringify(withG));
console.log('  [0] =', JSON.stringify(withG[0]), '  （这是"整体匹配"，不是组 1）');
console.log('  有 index 吗 =', withG.index !== undefined, ' 有 groups 吗 =', withG.groups !== undefined);
console.log('  ↑ 带 g 的 match 会丢掉 index 与所有捕获组，这是最典型的"用错方法"。');

// 找不到时的返回：两种形态都是 null，不是空数组。
console.log('  无 g 且找不到 =>', JSON.stringify(log.match(/NOPE/)));
console.log('  有 g 且找不到 =>', JSON.stringify(log.match(/NOPE/g)));
console.log('  ↑ 都是 null。所以 `if (str.match(re))` 这种写法是安全的，');
console.log('    但 `if (str.match(re).length)` 会直接抛错。');

console.log('--- 3. matchAll：既要全部匹配，又要 index 与分组 ---');

// matchAll 必须带 g，否则抛 TypeError（用 try/catch 演示）。
try {
  const bad = log.matchAll(/(\w+): ([^|]+)/);
  // 注意：报错发生在"调用 matchAll"的瞬间，而不是遍历时。
  console.log('  不该走到这里：', bad);
} catch (err) {
  console.log('  忘带 g 的 matchAll =>', err.constructor.name + ': ' + err.message);
}

console.log('  正确的 matchAll：');
for (const m of log.matchAll(/(\w+): ([^|\s][^|]*)/g)) {
  console.log(`    级别=${JSON.stringify(m[1]).padEnd(9)} 内容=${JSON.stringify(m[2].trim()).padEnd(14)} 位置=${m.index}`);
}

// matchAll 返回的是迭代器，可以转成数组、也可以用展开运算符。
const arr = [...log.matchAll(/(\w+):/g)];
console.log('  展开成数组后长度 =', arr.length, '，还可以 map：', arr.map((m) => m[1]));

console.log('--- 4. search：只要第一个匹配的下标 ---');

const path = '/api/v1/users/42/profile';

// 逐符号解释 /\/v\d+\// ：
//   \/     字面的斜杠（斜杠是分隔符，必须转义）
//   v      字面字母 v
//   \d+    一个或多个数字
//   \/     字面的斜杠
console.log('  search(/\\/v\\d+\\//) =', path.search(/\/v\d+\//));
console.log('  对照 indexOf("v1") =', path.indexOf('v1'));
console.log('  一个是 4、一个是 5：search 返回"整个模式"的起点（斜杠的位置），');
console.log('  indexOf 返回"子串"的位置 —— 模式比子串多包了一层斜杠，所以差 1。');

// search 忽略 g，也不会改动 lastIndex。
const gRe = /users/g;
gRe.lastIndex = 5;
console.log('  调用 search 前 lastIndex =', gRe.lastIndex);
console.log('  path.search(gRe) =', path.search(gRe));
console.log('  调用 search 后 lastIndex =', gRe.lastIndex, '（search 不碰 lastIndex）');

// 找不到返回 -1，与 indexOf 一致。
console.log('  找不到时 =>', path.search(/NOPE/));

console.log('--- 5. split：用正则当分隔符 ---');

const csv = 'a, b ,c,d , e';
// 只按逗号切会留下空格，用正则一次解决。
console.log('  朴素 split(",") =', JSON.stringify(csv.split(',')));
console.log('  split(/\\s*,\\s*/) =', JSON.stringify(csv.split(/\s*,\s*/)));

// 更复杂的分隔符：逗号、分号、竖线、空白都算。
console.log('  split(/[;,|\\s]+/) =', JSON.stringify('a,b;c|d e'.split(/[;,|\s]+/)));

// 陷阱：正则里有捕获组时，分隔符本身会被塞进结果数组。
console.log('  split(/,/) 无捕获组 =', JSON.stringify('a,b,c'.split(/,/)));
console.log('  split(/(,)/) 有捕获组 =', JSON.stringify('a,b,c'.split(/(,)/)));
console.log('  ↑ 捕获组的内容被"夹"在结果里，这个行为有时很有用，有时是 bug 来源。');

// 第二个参数 limit：只要前 n 段。
console.log('  split(/,/, 2) =', JSON.stringify('a,b,c,d'.split(/,/, 2)));

console.log('--- 6. split 与 Unicode：emoji 的坑 ---');

const family = '👨👩👧';
console.log('  字符串 =', family, ' .length =', family.length);
console.log('  split("") 按 UTF-16 码元切 =', JSON.stringify(family.split('')));
console.log('  split(/(?:)/u) 按码点切 =', JSON.stringify(family.split(/(?:)/u)));
console.log('  用展开运算符 [...str] 也能按码点拆 =', JSON.stringify([...family]));
console.log('  ↑ 处理 emoji 时优先用 /u + 展开运算符，别用 split("")。');

console.log('--- 7. replace：回顾字符串替换串的 $ 语法 ---');

const raw = '2026-09-16';
// 替换串里的特殊符号：$& 整体匹配、$` 匹配前的部分、$' 匹配后的部分、$$ 一个字面美元符。
console.log('  "$&"    =>', raw.replace(/(\d{4})/, '[$&]'));
console.log('  "$`"    =>', JSON.stringify(raw.replace(/\d{4}/, '[$`]')));
console.log("  \"$'\"    =>", JSON.stringify(raw.replace(/\d{4}/, "[$']")));
console.log('  "$1"    =>', raw.replace(/(\d{4})-(\d{2})/, '$2/$1'));
console.log('  "$$1"   =>', raw.replace(/(\d{4})/, '$$1'), '（$$ 变字面 $，后面的 1 保持原样）');
console.log('  "$$&"   =>', raw.replace(/(\d{4})/, '$$&'), '（$$ 变字面 $，& 保持原样）');

console.log('--- 8. replaceAll 与正则 ---');

const repeated = 'a-b-c-d';
// replaceAll 传字符串时必须全部替换；传正则时则强制要求带 g，否则抛 TypeError。
console.log('  replaceAll("-", "+") =', repeated.replaceAll('-', '+'));
try {
  const bad = repeated.replaceAll(/-/, '+');
  console.log('  不带 g 的正则传给 replaceAll =>', bad);
} catch (err) {
  console.log('  不带 g 的正则传给 replaceAll =>', err.constructor.name + ': ' + err.message);
}
console.log('  带 g 的正则传给 replaceAll =>', repeated.replaceAll(/-/g, '+'));

console.log('--- 9. 方法选择速查表 ---');

const text = 'k1=v1; k2=v2; k3=v3';
console.log('  文本 =', text);
console.log('  · 只问"有没有"            → /\\w+=\\w+/.test(text)      =>', /\w+=\w+/.test(text));
console.log('  · 要第一处的位置          → text.search(/k\\d/)          =>', text.search(/k\d/));
console.log('  · 要第一处的分组          → text.match(/(\\w+)=(\\w+)/)   => 返回数组含 [1][2]');
console.log('  · 要全部匹配+分组+位置    → [...text.matchAll(/(\\w+)=(\\w+)/g)]');
console.log('  · 只要全部匹配文本        → text.match(/\\w+=\\w+/g)       =>', JSON.stringify(text.match(/\w+=\w+/g)));
console.log('  · 按分隔符切              → text.split(/;\\s*/)           =>', JSON.stringify(text.split(/;\s*/)));
console.log('  · 替换内容依赖匹配本身    → text.replace(/(\\w+)=(\\w+)/g, fn)');

// 把"全部匹配+分组+位置"完整跑一遍，作为本文件的收尾。
const records = [...text.matchAll(/(?<key>\w+)=(?<val>\w+)/g)]
  .map((m) => ({ key: m.groups.key, val: m.groups.val, at: m.index }));
console.log('  最终抽取结果 =', JSON.stringify(records));

console.log('--- 10. 小结 ---');
console.log('· match 无 g 给"完整结果"，有 g 只给"匹配文本数组"，两者找不到都返回 null。');
console.log('· 要 index/分组又想拿全部，只有 matchAll 或 while + exec。');
console.log('· search 只给下标；split 遇到捕获组会把分隔符塞回结果里。');
console.log('· replace 的替换串支持 $&、$1、$<name> 等；replaceAll 配正则时必须带 g。');
