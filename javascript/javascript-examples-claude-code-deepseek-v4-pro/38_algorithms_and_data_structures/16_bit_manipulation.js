/**
 * ============================================================================
 * 知识点：JS 位运算专题 —— 32 位有符号转换、位掩码、XOR 技巧与截断陷阱
 * ============================================================================
 *
 * 【所属分类】38_algorithms_and_data_structures —— 算法与数据结构
 * 【难度等级】高级
 * 【前置知识】38_algorithms_and_data_structures/09_searching_algorithms.js（中点的溢出坑）
 *            38_algorithms_and_data_structures/12_union_find.js（位掩码表示集合的思想）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    位运算就是直接对二进制位做操作的运算符：& | ^ ~ << >> >>> 共 7 个。
 *
 *    它在算法里的三类用途：
 *      ① 表示【集合】：一个整数的每一位代表"某个元素在不在集合里"（位掩码）；
 *      ② 当【小工具】：XOR 消成对元素、n & (n-1) 消掉最低位的 1、位运算代替乘除法；
 *      ③ 做【状态压缩】：把 DP 的状态压进一个整数（见 17_advanced_dp.js 的状压 DP）。
 *
 *    ★ 但在 JS 里用位运算之前，必须先记住一条【最反直觉的规则】：
 *
 *        【JS 的位运算会先把操作数转成 32 位有符号整数（ToInt32），算完再转回来。】
 *
 *      这条规则会带来三个后果，本示例逐一演示：
 *        · 超出 32 位的部分会被【截断】（不是报错，是静默地扔高位）；
 *        · 大于 2³¹ - 1 的数会变成【负数】；
 *        · 小数会被【截断成整数】（这正是 |0 和 ~~ 能当取整用的原因）。
 *
 *      JS 里数字本身是 64 位浮点数，能精确表示到 2⁵³ - 1，
 *      所以"JS 的数字不会溢出"这句话对加减乘除成立，对【位运算不成立】——
 *      这就是 09_searching_algorithms.js 里 (lo + hi) >> 1 会翻车的根本原因。
 *
 *    ASCII 示意（一个 32 位整数的位布局，以及 ToInt32 的两个动作）：
 *
 *      位:  31                              0
 *           ┌─┬───────────────────────────┐
 *           │S│        31 个数值位          │      S = 符号位（1 = 负数）
 *           └─┴───────────────────────────┘
 *
 *      10000000000 (10¹⁰) 的二进制有 34 位，ToInt32 要砍掉高 2 位：
 *         原值: 10 0101 0100 0000 1011 1110 0100 0000 0000   (34 位)
 *         砍掉:        0101 0100 0000 1011 1110 0100 0000 0000   (32 位) = 1410065408
 *         ↑ 高位被静默丢弃 —— 结果和你算的完全不是一回事
 *
 * 2. 为什么需要（真实项目场景）
 *    · 权限系统：Linux 的 rwx 权限（4/2/1）就是一个 3 位掩码，
 *      一个整数存下所有权限，判断/授权只要一次 & 或 |（本示例会实现一个）；
 *    · 状态压缩：8 个开关的任意组合、棋盘上"这一行放了哪些位置"……
 *      一个整数就是 32 个布尔值，状压 DP 全靠它（见 17）；
 *    · 去重与配对：找出数组里唯一出现一次的数（XOR 一行搞定，不用哈希表、不用额外空间）；
 *    · 图形与游戏：颜色打包成 0xRRGGBB、瓦片地图的位标记、碰撞层的掩码；
 *    · 底层协议：网络包头部的标志位、文件格式的魔数、编解码器的位流；
 *    · 位图（bitset）：用 1 亿个 bit 代替 1 亿个布尔值，内存直接小 8 倍以上。
 *
 * 3. 核心语法要点 / 算法思想
 *    · 七个运算符（都在 ToInt32 之后运算）：
 *        a & b    按位与：两位都是 1 才是 1        —— 取掩码、判断某位是否为 1
 *        a | b    按位或：有一位是 1 就是 1        —— 设置某位
 *        a ^ b    按位异或：两位不同才是 1          —— 翻转某位、消成对元素
 *        ~a       按位取反：0 变 1、1 变 0          —— 注意 ~x === -x - 1
 *        a << n   左移：低位补 0，等价于 ×2ⁿ（可能溢出）
 *        a >> n   有符号右移：高位补【符号位】，等价于 floor(a / 2ⁿ)
 *        a >>> n  无符号右移：高位补 0，结果总是【非负】的
 *    · 位掩码表示集合的四则运算（配合本文件的权限示例看）：
 *        全集 = (1 << n) - 1            n 个元素都在集合里
 *        加入 = mask | (1 << i)         把第 i 位设成 1
 *        移除 = mask & ~(1 << i)        把第 i 位清成 0
 *        判断 = (mask & (1 << i)) !== 0 第 i 位是不是 1
 *        翻转 = mask ^ (1 << i)
 *    · XOR 的三条性质撑起了它所有的妙用：
 *        a ^ a = 0（自己消自己）    a ^ 0 = a（不改变）    交换律 + 结合律
 *      于是"所有数 XOR 起来"就等于"把所有成对的都消掉，只剩下落单的那个"。
 *    · 两个必须记住的位技巧：
 *        n & (n - 1)  消掉最低位的那个 1（用来数 1 的个数、判断是不是 2 的幂）
 *        n & -n       取出最低位的那个 1（即 lowbit，树状数组的核心）
 *
 * 4. 常见陷阱
 *    - 陷阱一：以为位运算只对整数有效。它对小数也"有效"——先把小数截断成整数再算，
 *      所以 5.9 | 0 得到 5。这个特性被当成取整技巧用，但它【只对 32 位内的数安全】。
 *    - 陷阱二：用 |0 / ~~ 处理大数或时间戳。超过 2³¹-1 会变成负数，
 *      超过 2³² 会被截断成完全不同的数（本示例会打印出 (10¹⁰ | 0) 的真实结果）。
 *      时间戳（毫秒）现在是 1.7×10¹² 量级，用 |0 会【直接错掉】。
 *    - 陷阱三：把 >>> 当成"和 >> 一样只是无符号"。对正数它们一样，对负数完全不同：
 *      -1 >> 1 = -1（符号位补 1，永远不变成 0），-1 >>> 1 = 2147483647。
 *    - 陷阱四：~x 之后期望得到"去掉最低位"。~ 是逐位取反，不是 -1，记牢 ~x === -x - 1。
 *    - 陷阱五：用 XOR 交换两个数时，如果两个下标相同（自交换），会把自己清零。
 *      a ^= a 就是 0 —— 这个 bug 极其隐蔽，所以【生产代码不建议用 XOR 交换】。
 *    - 陷阱六：BigInt 没有 >>> 运算符，用了会抛 TypeError（本示例用 try/catch 演示）。
 *    - 陷阱七：位运算的优先级比比较运算符低。`x & 1 === 1` 会被解析成 `x & (1 === 1)`。
 *      该加括号就加括号，位运算和比较混用时括号是刚需。
 *    - 陷阱八：以为位运算一定更快。现代 JS 引擎里 x * 2 和 x << 1 的速度差异往往在噪声内，
 *      而 << 还会引入 32 位截断的风险 —— 别为了"看起来快"牺牲正确性。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 38_algorithms_and_data_structures/16_bit_manipulation.js
 *
 * 【预期输出】
 *   打印 9 个小节：7 个运算符速查、ToInt32 的三大后果、
 *   位掩码实现权限系统、XOR 的四种妙用（含实测）、
 *   常用位技巧（消最低位 1 / lowbit / 数 1 的个数，含实测）、
 *   |0 与 ~~ 取整的边界（大数翻车现场）、BigInt 的位运算、
 *   (lo+hi)>>1 溢出坑的系统解释（呼应 09），以及复杂度与用途对照表。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 0. 通用工具
// ---------------------------------------------------------------------------

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function medianMs(fn, rounds = 3) {
  fn();
  const samples = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  return median(samples);
}

const sink = { value: 0 };

/** 把数字显示成定长的 32 位二进制串（便于肉眼观察位模式） */
function bin32(x) {
  return (x >>> 0).toString(2).padStart(32, '0').replace(/(.{8})(?=.)/g, '$1 ');
}

/** 可复现的伪随机数（线性同余） */
function makeRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 48271) % 2147483647;
    return s;
  };
}

// ---------------------------------------------------------------------------
// 1. 七个运算符速查
// ---------------------------------------------------------------------------

console.log('--- 1. 七个位运算符速查（都以 ToInt32 之后的结果为准）---');
console.log('');
console.log('  a = 0b1100 (12)，b = 0b1010 (10)：');
console.log('');
console.log('    12  = ' + bin32(12));
console.log('    10  = ' + bin32(10));
console.log('    ─────────────────────────────────────────────────────────────');
console.log('    12 & 10 = ' + String(12 & 10).padEnd(3) + ' = ' + bin32(12 & 10) + '   ← 两位都是 1 才是 1');
console.log('    12 | 10 = ' + String(12 | 10).padEnd(3) + ' = ' + bin32(12 | 10) + '   ← 有一位是 1 就是 1');
console.log('    12 ^ 10 = ' + String(12 ^ 10).padEnd(3) + ' = ' + bin32(12 ^ 10) + '   ← 两位不同才是 1');
console.log('    ~12     = ' + String(~12).padEnd(3) + ' = ' + bin32(~12) + '   ← 逐位取反');
console.log('    12 << 2 = ' + String(12 << 2).padEnd(3) + ' = ' + bin32(12 << 2) + '   ← 左移 = ×2ⁿ');
console.log('    12 >> 2 = ' + String(12 >> 2).padEnd(3) + ' = ' + bin32(12 >> 2) + '   ← 有符号右移 = ÷2ⁿ');
console.log('    12 >>> 2= ' + String(12 >>> 2).padEnd(3) + ' = ' + bin32(12 >>> 2) + '  ← 无符号右移（正数时一样）');
console.log('');
console.log('  ★ ~12 = -13 而不是 -12：因为 ~x === -x - 1，这条等式请直接背下来。');
console.log(`    验证：~12 === -13 → ${~12 === -13}`);
console.log('');
console.log('  负数在二进制里是【补码】，这解释了为什么 ~x = -x - 1：');
console.log(`    -1  = ${bin32(-1)}   （32 位全 1）`);
console.log(`    -2  = ${bin32(-2)}`);
console.log(`    12  = ${bin32(12)}`);
console.log(`    ~12 = ${bin32(~12)}   （12 的每一位取反）`);
console.log('');
console.log('  ★ -1 的 32 位是"全 1"，这一点后面会反复用到：');
console.log('    它既表示 -1，也表示"所有位都是 1 的掩码"——这就是"位运算里没有纯粹的数值，只有位模式"。');

// ---------------------------------------------------------------------------
// 2. ToInt32：一条规则，三个后果
// ---------------------------------------------------------------------------

console.log('\n--- 2. ToInt32：JS 位运算最反直觉的地方 ---');
console.log('');
console.log('  规则原文：【位运算的每个操作数都先被转换成 32 位有符号整数，运算结果也是 32 位有符号整数】。');
console.log('');
console.log('  转换算法（ECMAScript 规范的 ToInt32）分三步：');
console.log('    ① 把数字截断成整数（丢掉小数部分，向零取整）；');
console.log('    ② 对 2³² 取模，得到 0 ~ 2³²-1 之间的无符号值；');
console.log('    ③ 如果结果 ≥ 2³¹，就减去 2³²（于是高位为 1 的数变成了负数）。');
console.log('');
console.log('  【后果一】超过 32 位的部分被静默截断');
console.log('');
{
  const cases = [
    [5, '小整数：原样通过'],
    [2147483647, '2³¹ - 1，32 位有符号整数的最大值'],
    [2147483648, '2³¹，刚超界 → 变成最小值（负数）'],
    [4294967295, '2³² - 1，全 1 掩码 → 变成 -1'],
    [4294967296, '2³²，正好被模掉 → 变成 0'],
    [10000000000, '10¹⁰，高位被扔掉 → 变成一个毫不相干的数'],
    [9007199254740991, '2⁵³ - 1（JS 能精确表示的最大整数）→ 也被砍'],
  ];
  console.log('    原值'.padEnd(22) + 'x | 0 的结果'.padEnd(18) + '说明');
  console.log('    ' + '-'.repeat(88));
  for (const [x, note] of cases) {
    console.log('    ' + String(x).padEnd(20) + String(x | 0).padEnd(18) + note);
  }
  console.log('');
  console.log('    ★ 10¹⁰ | 0 得到 1410065408 —— 它既不报错，也不接近原值，');
  console.log('      只是"高位被砍掉后剩下的那 32 位"。这种错误在调试时极其难发现。');
}
console.log('');
console.log('  【后果二】小数被截断成整数（这正是取整技巧的来源）');
console.log('');
{
  console.log('    表达式'.padEnd(20) + '结果'.padEnd(10) + '说明');
  console.log('    ' + '-'.repeat(74));
  for (const [expr, value, note] of [
    ['5.9 | 0', 5.9 | 0, '向零截断，丢掉小数'],
    ['-5.9 | 0', -5.9 | 0, '★ 向【零】截断，不是向下取整！'],
    ['Math.floor(-5.9)', Math.floor(-5.9), '向下取整，对负数的结果不同'],
    ['Math.trunc(-5.9)', Math.trunc(-5.9), '向零截断，和 |0 一致（但更安全）'],
    ["'42' | 0", '42' | 0, '字符串会先被转成数字'],
    ["'abc' | 0", 'abc' | 0, '转不成数字 → NaN → ToInt32 → 0（静默吞掉错误）'],
    ['NaN | 0', NaN | 0, 'NaN 变成 0'],
    ['Infinity | 0', Infinity | 0, 'Infinity 也变成 0'],
    ['null | 0', null | 0, 'null 转成 0'],
    ['undefined | 0', undefined | 0, 'undefined 转成 0'],
  ]) {
    console.log('    ' + expr.padEnd(18) + String(value).padEnd(10) + note);
  }
  console.log('');
  console.log('    ★ "静默吞掉错误"是 |0 最危险的地方：');
  console.log("      'abc' | 0 得到 0，而不是报错或 NaN —— 后续所有计算都会基于这个 0 继续跑下去。");
}
console.log('');
console.log('  【后果三】负数参与右移时，>> 和 >>> 分道扬镳');
console.log('');
{
  console.log('    表达式'.padEnd(20) + '结果'.padEnd(16) + '位的解释');
  console.log('    ' + '-'.repeat(88));
  for (const [expr, value, note] of [
    ['-1 >> 1', -1 >> 1, '符号位补 1，全 1 还是全 1 → 永远是 -1'],
    ['-1 >>> 1', -1 >>> 1, '高位补 0 → 变成最大的正数 2³¹-1'],
    ['-1 >>> 0', -1 >>> 0, '★ 常用的"转成无符号 32 位"技巧，得到 2³²-1'],
    ['-8 >> 1', -8 >> 1, '等价于 floor(-8 / 2) = -4'],
    ['-8 >>> 1', -8 >>> 1, '无符号解释下 -8 是 2³²-8，除以 2 → 2147483644'],
    ['-7 >> 1', -7 >> 1, '★ 注意是 floor(-3.5) = -4，不是 -3'],
    ['-7 / 2 | 0', (-7 / 2) | 0, '而 |0 是向零截断 → -3。两者对负数的结果不同！'],
  ]) {
    console.log('    ' + expr.padEnd(18) + String(value).padEnd(16) + note);
  }
  console.log('');
  console.log('    ★ 结论：');
  console.log('      · >> 是【向下取整】的除法（floor），对负数会往更小的方向走；');
  console.log('      · |0 是【向零截断】（trunc），对负数往零的方向走；');
  console.log('      · 想"替代 Math.floor(x / 2ⁿ)"用 >>，想"替代 Math.trunc"用 |0；');
  console.log('      · >>> 的结果一定是非负数，所以负数用它等于"先转成无符号再算"。');
  console.log('    这三个东西对正数完全一样，只有负数才会暴露区别 —— 这就是它们危险的根源。');
}

// ---------------------------------------------------------------------------
// 3. 位掩码：一个整数当集合用
// ---------------------------------------------------------------------------

console.log('\n--- 3. 位掩码：一个整数存一个集合 ---');
console.log('');
console.log('  核心思想：整数 x 的第 i 位是 1，就表示"元素 i 在集合里"。');
console.log('  于是一个 32 位整数就能表示 {0,1,…,31} 的任意子集 —— 32 个布尔值只占 4 字节。');
console.log('');
console.log('  位操作对应的集合操作（这张表值得抄下来）：');
console.log('');
console.log('    集合操作'.padEnd(26) + '位运算'.padEnd(26) + '说明');
console.log('    ' + '-'.repeat(88));
for (const [setOp, bits, note] of [
  ['空集', '0', '一个 1 都没有'],
  ['全集（n 个元素）', '(1 << n) - 1', '低 n 位全 1'],
  ['加入元素 i', 'mask | (1 << i)', '把第 i 位设成 1'],
  ['移除元素 i', 'mask & ~(1 << i)', '把第 i 位清成 0'],
  ['判断元素 i 在不在', '(mask & (1 << i)) !== 0', '结果非 0 就是在'],
  ['翻转元素 i', 'mask ^ (1 << i)', '1 变 0、0 变 1'],
  ['并集 A ∪ B', 'A | B', '任一位为 1'],
  ['交集 A ∩ B', 'A & B', '两位都为 1'],
  ['差集 A − B', 'A & ~B', 'A 里有、B 里没有'],
  ['对称差 A △ B', 'A ^ B', '只在其中一个里'],
  ['集合大小（元素个数）', '数 mask 里 1 的个数', '见第 5 节的 popcount'],
]) {
  console.log('  ' + setOp.padEnd(24) + bits.padEnd(28) + note);
}
console.log('');
console.log('  实际例子：Linux 文件权限 rwx = 4/2/1 就是一个 3 位掩码。');
console.log('');

/** Linux 风格权限位 */
const PERM = { READ: 4, WRITE: 2, EXEC: 1 };

/** 把掩码翻译成 "rwx" 字符串 */
function permToString(mask) {
  return (
    (mask & PERM.READ ? 'r' : '-') + (mask & PERM.WRITE ? 'w' : '-') + (mask & PERM.EXEC ? 'x' : '-')
  );
}

{
  const roles = [
    ['访客', PERM.READ],
    ['普通用户', PERM.READ | PERM.WRITE],
    ['管理员', PERM.READ | PERM.WRITE | PERM.EXEC],
    ['黑名单', 0],
  ];
  console.log('    角色'.padEnd(14) + '掩码(十进制)'.padEnd(16) + '二进制'.padEnd(14) + '权限字符串');
  console.log('    ' + '-'.repeat(68));
  for (const [name, mask] of roles) {
    console.log(
      '    ' + name.padEnd(12) + String(mask).padEnd(16) + mask.toString(2).padStart(3, '0').padEnd(14) + permToString(mask),
    );
  }
  console.log('');
  const userPerm = PERM.READ | PERM.WRITE;
  console.log(`    某个用户的权限掩码 = ${userPerm}（${permToString(userPerm)}）`);
  console.log(`      能读吗？(mask & READ)  !== 0  →  ${(userPerm & PERM.READ) !== 0}`);
  console.log(`      能写吗？(mask & WRITE) !== 0  →  ${(userPerm & PERM.WRITE) !== 0}`);
  console.log(`      能执行吗？(mask & EXEC) !== 0 →  ${(userPerm & PERM.EXEC) !== 0}`);
  console.log('');
  console.log('    ★ 位掩码的三大好处：');
  console.log('      ① 省内存：3 个布尔值只占 1 个整数（4 字节），不是 3 个对象；');
  console.log('      ② 快：判断权限是一次 & 和一次比较，没有数组遍历；');
  console.log('      ③ 能打包传输：一个整数就能通过 URL 或协议字段传来传去。');
  console.log('    局限也很明确：一个整数最多 32 位，超过 32 个标志就要用多个整数或 BigInt。');
  console.log('');
  console.log('    ★ 这正是 17_advanced_dp.js 里"状态压缩 DP"的基础：');
  console.log('      "哪些元素已经被选过"这种状态，用一个 0 ~ 2ⁿ-1 的整数就能表示，');
  console.log('      于是 DP 的状态从"指数多个集合"变成了"2ⁿ 个整数"，可以开数组了。');
}

console.log('');
console.log('  实测：位掩码 vs Set，判断元素存在的性能对比');
{
  const N = 32;
  const ITER = 200000;
  const rnd = makeRandom(20240916);
  const queries = [];
  for (let i = 0; i < ITER; i++) queries.push(rnd() % N);

  // 位掩码版：随机设置一半的位
  let mask = 0;
  for (let i = 0; i < N; i++) if (i % 2 === 0) mask |= 1 << i;

  // Set 版：同样的集合
  const set = new Set();
  for (let i = 0; i < N; i++) if (i % 2 === 0) set.add(i);

  const maskMs = medianMs(() => {
    let hits = 0;
    for (const q of queries) if ((mask & (1 << q)) !== 0) hits += 1;
    sink.value = hits;
  });
  const setMs = medianMs(() => {
    let hits = 0;
    for (const q of queries) if (set.has(q)) hits += 1;
    sink.value = hits;
  });

  console.log('');
  console.log(`    判断 ${ITER} 次"元素在不在集合里"（集合大小 32）：`);
  console.log('');
  console.log('    做法'.padEnd(30) + '耗时(ms)'.padEnd(14) + '内存占用（集合本身）');
  console.log('    ' + '-'.repeat(74));
  console.log('    位掩码 (mask & (1 << i))'.padEnd(26) + maskMs.toFixed(2).padEnd(14) + '4 字节');
  console.log('    Set.has(i)'.padEnd(28) + setMs.toFixed(2).padEnd(14) + '几百字节（哈希表结构）');
  console.log('');
  console.log(`    位掩码快约 ${(setMs / maskMs).toFixed(1)} 倍 —— 因为它就是一次位与，没有任何哈希计算。`);
  console.log('');
  console.log('    ★ 但这个对比【不是为了否定 Set】，而是要看清各自的适用面：');
  console.log('      · 位掩码只适合"元素是 0~31 的小整数"且"集合本身要被频繁整体操作"的场景；');
  console.log('      · Set 支持任意类型的元素、支持动态增删、能遍历元素 —— 通用性强得多；');
  console.log('      · 遇到"元素种类固定、数量 ≤ 32、还要枚举所有子集"的题，位掩码是碾压性的；');
  console.log('      · 其它情况就老实用 Set。选型的依据永远是问题结构，不是"哪个更快"。');
}

// ---------------------------------------------------------------------------
// 4. XOR 的妙用
// ---------------------------------------------------------------------------

console.log('\n--- 4. XOR 的四种妙用 ---');
console.log('');
console.log('  XOR 的全部魔力来自三条性质：');
console.log('    a ^ a = 0     自己和自己异或 = 0（成对消失）');
console.log('    a ^ 0 = a     和 0 异或 = 不变（0 是单位元）');
console.log('    交换律 + 结合律：a ^ b ^ c 可以随便换顺序、随便加括号');
console.log('');
console.log('  推论：把一堆数全部 XOR 起来，成对的会互相抵消，只剩落单的那个。');
console.log('');

console.log('  妙用①：找出唯一出现一次的数（其它数都出现两次）');
console.log('');
{
  const nums = [4, 1, 2, 1, 2, 7, 4, 9, 7];
  const xorAll = () => {
    let x = 0;
    for (const n of nums) x ^= n;
    return x;
  };
  const bySet = () => {
    const seen = new Set();
    for (const n of nums) {
      if (seen.has(n)) seen.delete(n);
      else seen.add(n);
    }
    return [...seen][0];
  };
  console.log(`    数组：[${nums.join(', ')}]`);
  console.log(`    XOR 一路异或：4^1^2^1^2^7^4^9^7 = ${xorAll()}   ← 落单的 9`);
  console.log(`    Set 抵消法：${bySet()}   → 两者一致：${xorAll() === bySet()}`);
  console.log('');
  console.log('    执行过程的"抵消"效果：');
  const trace = [];
  let acc = 0;
  for (const n of nums) {
    acc ^= n;
    trace.push(`${n}(acc=${acc})`);
  }
  console.log('      ' + trace.join('  →  '));
  console.log('');
  console.log('    ★ XOR 版本 vs Set 版本：');
  console.log('      · 复杂度都是 O(n)，但 XOR 只用 O(1) 空间，Set 要 O(n) 空间；');
  console.log('      · 更关键的是：XOR 不需要分配哈希表，不用处理哈希冲突，常数极小；');
  console.log('      · 代价是【只能处理"成对出现"这种特殊结构】，不通用。');
}
console.log('');
console.log('  妙用②：不用临时变量交换两个数');
console.log('');
{
  let a = 5;
  let b = 9;
  console.log(`    交换前：a = ${a}, b = ${b}`);
  a ^= b; // a = 5^9
  b ^= a; // b = 9^(5^9) = 5
  a ^= b; // a = (5^9)^5 = 9
  console.log(`    交换后：a = ${a}, b = ${b}`);
  console.log('');
  console.log('    为什么成立？把 a、b 用代数符号代入：');
  console.log('      ① a ^= b   →  a = A^B，       b = B');
  console.log('      ② b ^= a   →  b = B^(A^B) = A（因为 B^B=0，0^A=A）');
  console.log('      ③ a ^= b   →  a = (A^B)^A = B');
  console.log('');
  console.log('    ★★ 但这个方法有个恶名昭著的坑 —— 如果两个下标相同（自己和自己交换）：');
  let x = 7;
  const arr = [x];
  const i = 0;
  arr[i] ^= arr[i]; // 想交换 arr[0] 和 arr[0]
  arr[i] ^= arr[i];
  arr[i] ^= arr[i];
  console.log(`      对同一个元素做三次 XOR：7 ^ 7 ^ 7 = ${arr[0]}   ← 变成了 0！`);
  console.log('      原因：第一步 arr[i] ^= arr[i] 就已经把它变成 0 了（a ^ a = 0），后面全是白折腾。');
  console.log('');
  console.log('    ★ 所以：XOR 交换在算法题里很酷，但【生产代码里不要用】——');
  console.log('      现代编译器对"用临时变量交换"的优化已经足够好，可读性和安全性的收益更大。');
}
console.log('');
console.log('  妙用③：找出缺失的那个数（1~n 里少了一个）');
console.log('');
{
  const n = 10;
  const arr = [1, 2, 3, 4, 5, 6, 7, 9, 10]; // 少了 8
  let x = 0;
  for (let i = 1; i <= n; i++) x ^= i; // 1..n 全异或
  for (const v of arr) x ^= v; // 再异或掉数组里出现的
  console.log(`    数组 [${arr.join(', ')}]（1~${n} 里少一个）`);
  console.log(`    (1^2^…^${n}) ^ (数组全部) = ${x}   ← 缺失的就是 8`);
  console.log('');
  console.log('    原理：1~n 每个数都出现了两次（一次在"完整序列"里、一次在数组里），');
  console.log('    互相抵消，只剩缺失的那个出现了一次。');
  console.log('    ★ 这题也可以用"求和相减"做，但求和会【溢出】（n 很大时超出安全整数范围），');
  console.log('      XOR 没有这个问题 —— 这是它比求和更稳的地方。');
}
console.log('');
console.log('  妙用④：找出两个只出现一次的数（其余都出现两次）');
console.log('');
console.log('    这题比①难：全部 XOR 只会得到 a ^ b，而我们需要把它们分开。');
console.log('    关键一步：a ^ b 的二进制里【至少有一位是 1】（因为 a ≠ b），');
console.log('    用最低的那个 1 位当"分组依据"，就能把数组劈成两组：');
console.log('      一组在这一位上为 1，另一组为 0 —— a 和 b 必然落在不同组！');
console.log('    然后两组各做一次"妙用①"，就分别得到了 a 和 b。');
console.log('');
{
  const nums = [3, 5, 7, 5, 3, 11, 13, 13]; // 7 和 11 只出现一次
  let xorAll = 0;
  for (const n of nums) xorAll ^= n;
  const lowbit = xorAll & -xorAll; // ★ 取出最低位的 1
  let groupA = 0;
  let groupB = 0;
  for (const n of nums) {
    if ((n & lowbit) !== 0) groupA ^= n;
    else groupB ^= n;
  }
  console.log(`    数组：[${nums.join(', ')}]`);
  console.log(`    全部异或 = ${xorAll}（= 7 ^ 11 = ${7 ^ 11}）`);
  console.log(`    最低位的 1：xorAll & -xorAll = ${lowbit}  （二进制 ${xorAll.toString(2)} 的最低位 1）`);
  console.log(`    按"这一位是不是 1"分组再各自异或：`);
  console.log(`      这一位是 1 的组 → ${groupA}`);
  console.log(`      这一位是 0 的组 → ${groupB}`);
  console.log(`    结果：两个落单的数是 ${groupA} 和 ${groupB}  →  正确：${(groupA === 7 && groupB === 11) || (groupA === 11 && groupB === 7)}`);
  console.log('');
  console.log('    ★ 注意 n & -n（lowbit）这个技巧：它取出"最低位的那个 1"。');
  console.log('      原理：-n 是 n 的补码（取反加一），两者相与会把最低位的 1 单独留下来。');
  console.log(`      例：n = ${xorAll}（${xorAll.toString(2)}），-n 的二进制是 ${(-xorAll >>> 0).toString(2).slice(-8)}…，`);
  console.log(`      相与得到 ${lowbit}。这个技巧在树状数组（BIT）里是核心操作。`);
}

console.log('');
console.log('  实测：XOR 找唯一数 vs 排序 vs 哈希表');
{
  const n = 99999; // 奇数个：前 49999 对 + 1 个落单的
  const rnd = makeRandom(8888);
  const nums = [];
  for (let i = 0; i < (n - 1) / 2; i++) {
    const v = rnd() % 1000000;
    nums.push(v, v);
  }
  const lonely = 1234567;
  nums.push(lonely);
  // 打乱
  for (let i = nums.length - 1; i > 0; i--) {
    const j = rnd() % (i + 1);
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }

  const xorMs = medianMs(() => {
    let x = 0;
    for (const v of nums) x ^= v;
    sink.value = x;
  });
  const sortMs = medianMs(() => {
    const sorted = [...nums].sort((a, b) => a - b);
    let answer = sorted[0];
    for (let i = 0; i + 1 < sorted.length; i += 2) {
      if (sorted[i] !== sorted[i + 1]) {
        answer = sorted[i];
        break;
      }
    }
    sink.value = answer;
  }, 2);
  const setMs = medianMs(() => {
    const seen = new Set();
    for (const v of nums) {
      if (seen.has(v)) seen.delete(v);
      else seen.add(v);
    }
    sink.value = [...seen][0];
  }, 2);

  console.log('');
  console.log(`    数组规模 ${nums.length}（49999 对 + 1 个落单），目标值 ${lonely}`);
  console.log('');
  console.log('    做法'.padEnd(30) + '耗时(ms)'.padEnd(14) + '额外空间'.padEnd(14) + '复杂度');
  console.log('    ' + '-'.repeat(84));
  console.log('    XOR 异或到底'.padEnd(26) + xorMs.toFixed(2).padEnd(14) + 'O(1)'.padEnd(14) + 'O(n)');
  console.log('    先排序再两两比对'.padEnd(24) + sortMs.toFixed(2).padEnd(14) + 'O(n)'.padEnd(14) + 'O(n log n)');
  console.log('    Set 抵消法'.padEnd(28) + setMs.toFixed(2).padEnd(14) + 'O(n)'.padEnd(14) + 'O(n)');
  console.log('');
  console.log(`    XOR 比排序快约 ${(sortMs / xorMs).toFixed(0)} 倍，比 Set 快约 ${(setMs / xorMs).toFixed(0)} 倍。`);
  console.log('    ★ 这就是"算法层面的优化"：同样的答案，XOR 版本既不用排序也不用哈希表，');
  console.log('      时间和空间同时压到最低。前提仍然只有一条 —— 数据必须满足"其余元素成对"。');
}

// ---------------------------------------------------------------------------
// 5. 常用位技巧
// ---------------------------------------------------------------------------

console.log('\n--- 5. 常用位技巧：n & (n-1) 与 lowbit ---');
console.log('');
console.log('  技巧 A：n & (n - 1) —— 消掉最低位的那个 1');
console.log('');
{
  console.log('    表达式'.padEnd(22) + 'n 的二进制'.padEnd(22) + 'n & (n-1)'.padEnd(16) + '结果二进制');
  console.log('    ' + '-'.repeat(84));
  for (const n of [12, 10, 8, 7, 1, 0]) {
    const r = n & (n - 1);
    console.log(
      '    ' + `${n} & ${n - 1}`.padEnd(20) + n.toString(2).padStart(8, '0').padEnd(22) +
        String(r).padEnd(16) + r.toString(2).padStart(8, '0'),
    );
  }
  console.log('');
  console.log('    为什么成立？n - 1 会把"最低位的 1"变成 0，并把它右边的 0 全变成 1；');
  console.log('    再和 n 相与，那一位和右边就都被清掉了 —— 于是"最低位的 1 消失"。');
  console.log('');
  console.log('    两个直接应用：');
  console.log('      ① 数 1 的个数：反复 n = n & (n-1)，直到 n 变 0，做了几次就有几个 1；');
  console.log('         （这叫 Brian Kernighan 算法，比"逐位检查 32 次"快得多）');
  console.log('      ② 判断是不是 2 的幂：2 的幂的二进制只有一个 1，所以 n & (n-1) === 0 且 n > 0。');
  console.log('');
  const powers = [1, 2, 4, 8, 16, 1024, 65536];
  const nonPowers = [0, 3, 6, 12, 100, 1023];
  console.log('    2 的幂判断实测：');
  for (const n of powers) {
    console.log(`      ${String(n).padEnd(8)} → n & (n-1) = ${String(n & (n - 1)).padEnd(6)} ${n > 0 && (n & (n - 1)) === 0 ? '✓ 是 2 的幂' : '✗'}`);
  }
  for (const n of nonPowers) {
    console.log(`      ${String(n).padEnd(8)} → n & (n-1) = ${String(n & (n - 1)).padEnd(6)} ${n > 0 && (n & (n - 1)) === 0 ? '✓ 是 2 的幂' : '✗ 不是'}`);
  }
  console.log('');
  console.log('    ★ 注意 n = 0 要单独排除：0 & -1 === 0，光看这个条件会把它误判成 2 的幂。');
}
console.log('');
console.log('  技巧 B：n & -n —— 取出最低位的 1（lowbit）');
console.log('');
{
  console.log('    n'.padEnd(10) + 'n 的二进制'.padEnd(20) + 'n & -n'.padEnd(12) + '含义');
  console.log('    ' + '-'.repeat(72));
  for (const [n, note] of [
    [12, '12 = 1100，最低位的 1 是 4'],
    [10, '10 = 1010，最低位的 1 是 2'],
    [8, '8 = 1000，只有一个 1'],
    [7, '7 = 111，最低位就是 1'],
    [40, '40 = 101000，最低位的 1 是 8'],
  ]) {
    console.log('    ' + String(n).padEnd(10) + n.toString(2).padStart(8, '0').padEnd(20) + String(n & -n).padEnd(12) + note);
  }
  console.log('');
  console.log('    ★ lowbit 是树状数组（Fenwick Tree）的核心：');
  console.log('      树状数组的"管辖范围"就是由 lowbit 决定的（x += x & -x 往上跳，x -= x & -x 往下走）。');
  console.log('    ★ 也常用于"枚举一个集合的所有子集"和"二进制分组"（上一节妙用④用了它）。');
}
console.log('');
console.log('  实测：数 1 的个数（popcount）的三种写法');
{
  const popcountBrian = (n) => {
    let count = 0;
    while (n !== 0) {
      n &= n - 1;
      count += 1;
    }
    return count;
  };
  const popcountLoop = (n) => {
    let count = 0;
    for (let i = 0; i < 32; i++) if ((n >>> i) & 1) count += 1;
    return count;
  };

  const N = 200000;
  const rnd = makeRandom(4321);
  const nums = [];
  for (let i = 0; i < N; i++) nums.push(rnd() % 4294967296);

  // 正确性校验
  let ok = true;
  for (const n of nums.slice(0, 1000)) {
    const s = n.toString(2).split('1').length - 1;
    if (popcountBrian(n) !== s || popcountLoop(n) !== s) ok = false;
  }
  console.log('');
  console.log(`    校验（前 1000 个数与字符串统计法对比）：${ok ? '一致 ✓' : '不一致 ✗'}`);
  console.log('');

  const brianMs = medianMs(() => {
    let total = 0;
    for (const n of nums) total += popcountBrian(n);
    sink.value = total;
  });
  const loopMs = medianMs(() => {
    let total = 0;
    for (const n of nums) total += popcountLoop(n);
    sink.value = total;
  });
  console.log(`    数 ${N} 个随机 32 位整数的 1 的个数：`);
  console.log('');
  console.log('    做法'.padEnd(38) + '耗时(ms)'.padEnd(14) + '循环次数');
  console.log('    ' + '-'.repeat(78));
  console.log('    n &= n - 1（Brian Kernighan）'.padEnd(32) + brianMs.toFixed(2).padEnd(14) + '平均 16 次（1 的个数）');
  console.log('    逐位检查 32 次'.padEnd(34) + loopMs.toFixed(2).padEnd(14) + '恒定 32 次');
  console.log('');
  console.log(`    Brian Kernighan 快约 ${(loopMs / brianMs).toFixed(1)} 倍（随机数的 1 的个数平均是一半，所以省一半循环）。`);
  console.log('');
  console.log('    ★ 更快的做法是"分治法"（位并行）：用 5 次固定的位运算把 32 位同时相加，');
  console.log('      完全没有循环 —— 那种写法在 JS 里可读性太差，除非是性能热点，否则不值得。');
  console.log('      这里展示的是【可读性与性能的平衡点】：Brian Kernighan 又短又快。');
}

// ---------------------------------------------------------------------------
// 6. |0 与 ~~ 的边界：大数翻车现场
// ---------------------------------------------------------------------------

console.log('\n--- 6. |0 与 ~~ 取整：只对 32 位内的数安全 ---');
console.log('');
console.log('  |0 和 ~~ 都是"取整"的常用写法，但它们的实现是【ToInt32】，');
console.log('  所以【超出 32 位范围的数会得到完全错误的结果】。这是最容易埋雷的地方。');
console.log('');
{
  const cases = [
    [42.7, '普通小数 → 截断'],
    [-42.7, '负数 → 向零截断，不是向下取整'],
    [1.5e9, '15 亿，还在 32 位范围内 → 正确'],
    [2147483647, '2³¹-1，32 位有符号整数能表示的最大值 → 刚好安全'],
    [2147483648, '2³¹，超界了 → 变成负数！'],
    [3e9, '30 亿（比如"用户数"）→ 直接变负数'],
    [1e10, '100 亿 → 变成一个毫不相干的数'],
    [1.7e12, '★ 当前时间戳的量级（毫秒）→ 完全错掉'],
    [Number.MAX_SAFE_INTEGER, '2⁵³-1（JS 能精确表示的最大整数）→ 也被砍'],
  ];
  console.log('    数值'.padEnd(26) + '|0 的结果'.padEnd(20) + '~~ 的结果'.padEnd(20) + '说明');
  console.log('    ' + '-'.repeat(100));
  for (const [v, note] of cases) {
    console.log(
      '    ' + String(v).padEnd(24) + String(v | 0).padEnd(20) + String(~~v).padEnd(20) + note,
    );
  }
  console.log('');
  console.log('  ★ 关键结论：');
  console.log(`    · 时间戳 ${Date.now()} 用 |0 会变成 ${Date.now() | 0} —— 完全是另一个数！`);
  console.log('      这是真实项目里非常常见的 bug（有人想用 |0 去掉毫秒，结果时间直接穿越）。');
  console.log('    · 安全的取整写法，按推荐顺序：');
  console.log('        Math.trunc(x)     —— 语义清晰，对任何数都正确，推荐');
  console.log('        Math.floor(x)     —— 注意对负数是"向下"，与截断语义不同');
  console.log('        x | 0 / ~~x       —— 只在【确定 x 在 ±2³¹ 范围内】时使用');
  console.log('');
  console.log('    ★ 那什么时候该用 |0？');
  console.log('      当它出现在【刻意使用位模式】的地方时是合适的，比如：');
  console.log('        hash = (hash * 31 + c) | 0    —— 让它保持 32 位整数，模拟 C 的 int 溢出');
  console.log('        idx = i & (n - 1)             —— 当 n 是 2 的幂时，用位与代替取模');
  console.log('      也就是说：当你要的是"32 位位模式"而不是"数学上的取整"时，它才对。');
}
console.log('');
console.log('  顺带一个真实场景对照：哈希表实现里的 32 位溢出');
{
  const str = 'the quick brown fox jumps over the lazy dog';
  const h1 = (() => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; // 模拟 Java 的 int 溢出
    return h;
  })();
  const h2 = (() => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 2147483647;
    return h;
  })();
  console.log(`    Java 风格（|0 保留 32 位溢出）：${h1}`);
  console.log(`    取模风格（% 大质数）：        ${h2}`);
  console.log('');
  console.log('    ★ 两种都是合法的哈希函数，|0 的版本好处是"计算天然被限制在 32 位内、不会丢精度"——');
  console.log('      因为 h * 31 + c 的结果已经是 32 位整数，再次 |0 是安全的（没有超过 2⁵³）。');
  console.log('      这正好说明 |0 不是"不能用"，而是要保证【中间结果不超出 32 位】。');
}

// ---------------------------------------------------------------------------
// 7. BigInt 的位运算
// ---------------------------------------------------------------------------

console.log('\n--- 7. BigInt 的位运算：任意精度，但没有 >>> ---');
console.log('');
console.log('  BigInt 是 JS 的任意精度整数类型（字面量加 n 后缀，如 123n），');
console.log('  它的位运算【不会被截断到 32 位】，代价是速度慢一些。');
console.log('');
{
  const big = 12345678901234567890n;
  console.log(`    big = ${big}n`);
  console.log(`      big.toString(2) 长度 = ${big.toString(2).length} 位（远超 32 位）`);
  console.log(`      big & 0xFFn  = ${big & 0xffn}          ← 取低 8 位，正常工作`);
  console.log(`      big >> 4n    = ${big >> 4n}   ← 右移 4 位，正常工作`);
  console.log(`      big << 1n    = ${big << 1n}`);
  console.log(`      ~big         = ${~big}    ← 注意 BigInt 的 ~ 同样是 -x-1`);
  console.log(`      -big - 1n    = ${-big - 1n}   ← 验证 ~x === -x-1 在 BigInt 上也成立：${~big === -big - 1n}`);
  console.log('');
  console.log('  ★ BigInt 与 Number 的互操作规则（很容易踩坑）：');
  console.log('    · 位运算的两个操作数【必须都是 BigInt】，混用会抛 TypeError：');
  try {
    1n & 1; // 故意混用类型，演示报错
  } catch (err) {
    console.log(`        1n & 1   →  ${err.constructor.name}: ${err.message}`);
  }
  console.log('    · 算术运算（+ - * /）混用同样会抛错，因为结果精度无法保证：');
  try {
    1n + 1; // 故意混用类型，演示报错
  } catch (err) {
    console.log(`        1n + 1   →  ${err.constructor.name}: ${err.message}`);
  }
  console.log('    · 比较运算（< > == ===）可以混用（=== 要求类型也相同，所以 1n === 1 是 false）：');
  console.log(`        1n < 2        →  ${1n < 2}`);
  console.log(`        1n == 1       →  ${1n == 1}   （宽松相等会做类型转换）`);
  console.log(`        1n === 1      →  ${1n === 1}  （严格相等要求类型一致）`);
  console.log('');
  console.log('  ★★ 最重要的差异：BigInt 【没有 >>> 运算符】');
  try {
    8n >>> 1n; // 故意使用不存在的运算符，演示报错
  } catch (err) {
    console.log(`        8n >>> 1n  →  ${err.constructor.name}: ${err.message}`);
  }
  console.log('      为什么？因为 >>> 的语义依赖"固定宽度的二进制补码表示"，');
  console.log('      而 BigInt 是【任意精度】的，没有固定宽度 —— 也就不存在"高位补 0"这件事。');
  console.log('');
  console.log('  ★ BigInt 的实用工具：BigInt.asIntN / asUintN（显式指定宽度做截断）');
  console.log(`      BigInt.asUintN(8, 255n)  = ${BigInt.asUintN(8, 255n)}   ← 8 位无符号，255 放得下`);
  console.log(`      BigInt.asUintN(8, 256n)  = ${BigInt.asUintN(8, 256n)}     ← 溢出，被模掉`);
  console.log(`      BigInt.asIntN(8, 255n)   = ${BigInt.asIntN(8, 255n)}     ← 8 位有符号，255 的最高位是符号位 → -1`);
  console.log(`      BigInt.asIntN(32, 4294967295n) = ${BigInt.asIntN(32, 4294967295n)}   ← 和 Number 的 |0 行为一致`);
  console.log('');
  console.log('    ★ 这两行就是"用 BigInt 手动模拟 ToInt32"的方式 ——');
  console.log('      当你要处理超过 32 位、又需要固定宽度语义的场景（如自己实现哈希、加密算法），');
  console.log('      就用 asIntN/asUintN 把宽度说清楚，别依赖隐式截断。');
}

// ---------------------------------------------------------------------------
// 8. (lo + hi) >> 1 溢出坑的系统解释
// ---------------------------------------------------------------------------

console.log('\n--- 8. 回到 09 的那个坑：(lo + hi) >> 1 为什么会溢出 ---');
console.log('');
console.log('  09_searching_algorithms.js 里讲过二分的经典 bug：');
console.log('    错误写法：const mid = (lo + hi) >> 1;');
console.log('    正确写法：const mid = lo + ((hi - lo) >> 1);');
console.log('');
console.log('  当时给出的解释是"lo + hi 可能超过 32 位上限"。这里把机制彻底展开讲透。');
console.log('');
{
  const lo = 1500000000;
  const hi = 1500000001;
  const sum = lo + hi;
  console.log(`  取 lo = ${lo}，hi = ${hi}（两个都在 32 位内，各自完全没问题）`);
  console.log('');
  console.log(`    ① lo + hi（普通加法）= ${sum}`);
  console.log('       这一步【完全正确】—— JS 的数字是 64 位浮点数，能精确表示这个和。');
  console.log('');
  console.log(`    ② 但 >> 1 会先对操作数做 ToInt32：`);
  console.log(`       ToInt32(${sum}) —— 它 ≥ 2³¹ (${2147483648})，所以要减去 2³²：`);
  console.log(`       ${sum} - 4294967296 = ${sum - 4294967296}`);
  console.log(`       (lo + hi) >> 1 = ${sum >> 1}   ← ✗ 负数！mid 直接跑到数组外面`);
  console.log('');
  console.log(`    ③ 正确的写法：`);
  console.log(`       hi - lo = ${hi - lo}（两个数的【差】，一定比它们都小，绝不会超过 32 位）`);
  console.log(`       lo + ((hi - lo) >> 1) = ${lo + ((hi - lo) >> 1)}   ← ✓ 正确`);
  console.log(`       真正的中间值 Math.floor((lo + hi) / 2) = ${Math.floor((lo + hi) / 2)}`);
  console.log('');
  console.log('    ④ 那 (lo + hi) >>> 1 行不行？（Java 里常这么写）');
  console.log(`       ${sum} >>> 1 = ${sum >>> 1}   ← ✓ 这次对了！`);
  console.log('       因为 >>> 是【无符号】右移：它把 ToUint32 的结果当作 0 ~ 2³²-1 的正数。');
  console.log(`       而 lo + hi = ${sum} < 2³² (4294967296)，刚好落在无符号 32 位的范围内，`);
  console.log('       所以右移一位就能得到正确的中间值。');
  console.log('');
  console.log('    ⑤ 但如果 lo + hi ≥ 2³² 呢？>>> 也一样会错：');
  const lo2 = 3000000000;
  const hi2 = 3000000001;
  console.log(`       lo = ${lo2}, hi = ${hi2}，lo + hi = ${lo2 + hi2} ≥ 2³²`);
  console.log(`       (lo + hi) >>> 1 = ${(lo2 + hi2) >>> 1}   ← ✗ 也错了！`);
  console.log(`       真正的中点 = ${Math.floor((lo2 + hi2) / 2)}`);
  console.log(`       lo + ((hi - lo) >> 1) = ${lo2 + ((hi2 - lo2) >> 1)}   ← ✓ 依然正确`);
  console.log('');
  console.log('  ★ 完整结论（这就是 09 那条"统一写 lo + ((hi - lo) >> 1)"的全部理由）：');
  console.log('');
  console.log('    写法'.padEnd(32) + '安全性'.padEnd(28) + '说明');
  console.log('    ' + '-'.repeat(96));
  for (const [expr, safe, note] of [
    ['Math.floor((lo + hi) / 2)', '✓ 总是安全（JS 里）', '普通除法不经过 ToInt32，双精度足够表示'],
    ['lo + ((hi - lo) >> 1)', '✓ 总是安全 ★', '差一定更小，推荐写法'],
    ['(lo + hi) >>> 1', '△ lo+hi < 2³² 时安全', 'Java 经典写法，但 JS 里要自己确认范围'],
    ['(lo + hi) >> 1', '✗ lo+hi ≥ 2³¹ 就翻车', '会被 ToInt32 变成负数，本示例的坑'],
    ['(lo + hi) / 2 | 0', '✗ 同样翻车', '|0 也是 ToInt32，错法一模一样'],
  ]) {
    console.log('    ' + expr.padEnd(30) + safe.padEnd(30) + note);
  }
  console.log('');
  console.log('  ★ 还有一个容易被忽略的点：上面说的"溢出"在 JS 里【只对位运算发生】。');
  console.log('    纯算术的 (lo + hi) / 2 在 JS 里是安全的（因为 2⁵³ 以内都精确），');
  console.log('    所以这个 bug 在 JS 里是"被位运算【引入】的"——');
  console.log('    你想用 >> 1 提速，结果反而引入了别的语言里的经典 bug。');
  console.log('    这也解释了为什么同一段二分代码在 C/Java 里必炸、在 JS 里"有时没事"：');
  console.log('    只要 lo + hi 不超过 2³¹-1，两者结果就一样 —— 小数据下根本发现不了。');
}

// ---------------------------------------------------------------------------
// 9. 用途对照表
// ---------------------------------------------------------------------------

console.log('\n--- 9. 位运算用途对照表 ---');
console.log('');
console.log('  需求'.padEnd(42) + '写法'.padEnd(28) + '说明');
console.log('-'.repeat(100));
for (const [need, expr, note] of [
  ['第 i 位设为 1', 'x | (1 << i)', '加入集合元素'],
  ['第 i 位设为 0', 'x & ~(1 << i)', '移除集合元素'],
  ['第 i 位取反', 'x ^ (1 << i)', '翻转状态'],
  ['第 i 位是否为 1', '(x & (1 << i)) !== 0', '★ 括号不能省'],
  ['最低位的 1', 'x & -x', 'lowbit，树状数组'],
  ['消掉最低位的 1', 'x & (x - 1)', '数 1 的个数、判 2 的幂'],
  ['是不是 2 的幂', 'x > 0 && (x & (x-1)) === 0', '★ 别忘了排除 0'],
  ['对 2ⁿ 取模', 'x & (2**n - 1)', '仅当除数是 2 的幂'],
  ['乘 2ⁿ / 除 2ⁿ', 'x << n / x >> n', '负数除法要注意是 floor 语义'],
  ['取绝对值式的符号判断', 'x >> 31', '0 或 -1（全 1）'],
  ['转成无符号 32 位', 'x >>> 0', '负数会变成接近 2³² 的正数'],
  ['截断成 32 位整数', 'x | 0 / ~~x', '★ 只对 ±2³¹ 内的数安全'],
  ['任意精度位运算', '123n & 0xFFn', 'BigInt，但没有 >>>'],
]) {
  console.log('  ' + need.padEnd(40) + expr.padEnd(30) + note);
}

console.log('');
console.log('  一句话总结：');
console.log('  · JS 位运算的铁律：操作数先转 32 位有符号整数 —— 记不住这条，就会写出静默出错的代码；');
console.log('  · 位掩码的价值是"用 1 个整数表示 32 个布尔值"，它既是权限系统的基础，也是状压 DP 的基础；');
console.log('  · XOR 的 a^a=0 让它能"消掉成对元素"：找唯一数、找缺失数、二进制分组，全都是这一条推论；');
console.log('  · n & (n-1) 与 n & -n 是两个必须形成肌肉记忆的技巧；');
console.log('  · |0 和 ~~ 只适合"要 32 位位模式"的场合，做日常取整请用 Math.trunc；');
console.log('  · 最后：09 那个 (lo + hi) >> 1 的坑，根因不是"加法溢出"，而是"位运算把它截断到了 32 位"。');

console.log(`\n（防止死代码消除的汇总值 sink = ${sink.value}）`);
console.log(`本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
