/**
 * ============================================================================
 * 知识点：字符串拼接性能 —— + / 模板字符串 / 数组 join 与 V8 的 Rope 结构
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】进阶
 * 【前置知识】31_performance_and_memory/05_loop_performance.js
 *
 * 【也见】31_performance_and_memory/17_data_structure_performance.js §5 —— 综合横评里也有一节做同样的对比。
 *        本文件是字符串拼接专题的主场（含 Rope/ConsString 结构解剖）；那篇是横评视角，只做横向选型。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    字符串拼接是日常代码里出现频率最高的操作之一。本示例对比三种主流写法：
 *    · 用 + / += 累加
 *    · 用模板字符串 `${}` 累加
 *    · 把片段推进数组，最后用 join('') 拼起来（俗称"字符串构建器"）
 *    并解释 V8 内部的 Rope / ConsString 结构，说明为什么"+= 很慢"这个结论
 *    在现代引擎里基本已经过时。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 生成 HTML 片段、拼接 SQL、导出 CSV、拼装日志行、构造大 JSON 字符串。
 *    - 面试与代码评审中的经典争论："循环里 += 是不是 O(n²)？"
 *      本示例给出可运行的实测答案，而不是背结论。
 *    - 知道字符串是不可变值类型，才能理解为什么"每次 += 都要复制整个字符串"
 *      这个直觉在 V8 里其实被 Rope 结构绕过了。
 *
 * 3. 核心语法要点
 *    - 字符串是【不可变（immutable）】的：任何"修改"都是产生一个新字符串，
 *      这也是"拼接多了会慢"这一直觉的来源。
 *    - V8 的 Rope / ConsString：当两个字符串拼接的结果长度超过一定阈值时，
 *      V8 不会真的复制字符，而是创建一个 ConsString 节点，只记录
 *      "左半是 A、右半是 B"。于是 a + b 是 O(1) 而不是 O(n)，
 *      整条拼接链变成一棵二叉树（这就是 Rope 名字的由来）。
 *    - 扁平化（flatten）：只有当需要真正读取字符时（如 charCodeAt、
 *      toUpperCase、正则匹配、传给某些原生 API），V8 才会把 Rope 一次性
 *      展平成一个连续的扁平字符串，开销是 O(总长度)。
 *    - 模板字符串：`${a}${b}` 在引擎内部同样走字符串拼接路径，
 *      额外好处是不用写一堆 + 号，可读性更好。
 *    - join：数组 join 只需要一次遍历 + 一次分配，当片段很多、
 *      且需要分隔符时，它是最自然的选择。
 *
 * 4. 常见陷阱
 *    - 陷阱一：【循环里读字符串】会毁掉 Rope 的优化。
 *      在 += 之后调用 s.charCodeAt(0) / s.length 之外的真实读取操作，
 *      会强制每次都扁平化，于是退化成真正的 O(n²)。
 *      本示例第 4 节会实测这个"性能悬崖"。
 *    - 陷阱二：把"字符串构建器"当成必备套路。在 IE 时代 + 确实很慢，
 *      但在现代 V8 上，+= 和数组 join 的差距通常很小，
 *      选择应当取决于可读性，而不是性能焦虑。
 *    - 陷阱三：大片段的 join 也不总是赢——join 需要一次性分配
 *      最终长度的内存，而 += 的 Rope 是惰性的，内存占用峰值可能更低。
 *    - 陷阱四：在循环里做 `s = prefix + s`（向前拼接）虽然也是 O(1) Rope，
 *      但会让字符顺序在树上反着长，某些操作下扁平化效率更差。
 *    - 陷阱五：用 += 拼数字时忘记类型转换。'1' + 2 会得到 '12' 而不是 3，
 *      这是运算优先级与类型转换的坑，不是性能问题但同样常见。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/06_string_concatenation.js
 *
 * 【预期输出】
 *   打印 6 个小节：三种拼接写法介绍、10 万次拼接实测对比、
 *   Rope/ConsString 与字符串构建器的说明、强制扁平化导致的性能悬崖实测、
 *   带分隔符场景的 join 对比、以及工程结论。
 * ============================================================================
 */

const scriptStart = Date.now();

// ---------------------------------------------------------------------------
// 1. 三种写法与计时工具
// ---------------------------------------------------------------------------

console.log('--- 1. 三种主流拼接写法 ---');

const N = 100_000; // 拼接次数：10 万次

// 待拼接的片段：用一个小对象模拟真实数据
const record = { id: 42, name: 'node', level: 'info' };

console.log(`准备做 ${N} 次拼接，每次拼一段形如 "id=42&name=node&level=info;" 的内容。`);

// 简易计时：先预热一次，再采样多轮取最小值
function bench(fn, rounds = 3) {
  fn(); // 预热，排除 JIT 编译时间
  let min = Infinity;
  const all = [];
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    const ms = performance.now() - t0;
    all.push(ms);
    if (ms < min) min = ms;
  }
  return { min, all };
}

const fmtMs = (ms) => ms.toFixed(3).padStart(10);

// 校验结果是否一致：所有写法必须产出完全相同的字符串
const expectedHead = 'id=42&name=node&level=info;'.repeat(2);

// ---------------------------------------------------------------------------
// 2. 实测：10 万次拼接
// ---------------------------------------------------------------------------

console.log('\n--- 2. 实测对比：10 万次拼接 ---');

// 2.1 用 + / += 累加
function buildWithPlus(fragment, times) {
  let s = ''; // 从空字符串开始
  for (let i = 0; i < times; i++) {
    // 每次 += 在 V8 里通常只是新建一个 ConsString 节点，而不是复制全部字符
    s += fragment;
  }
  return s;
}

// 2.2 用模板字符串累加
function buildWithTemplate(fragment, times) {
  let s = '';
  for (let i = 0; i < times; i++) {
    // 模板字符串在引擎内部同样走字符串拼接路径，只是语法更清晰
    s = `${s}${fragment}`;
  }
  return s;
}

// 2.3 数组 push + join（经典的"字符串构建器"）
function buildWithJoin(fragment, times) {
  const parts = []; // 先把片段存进数组，数组的 push 是均摊 O(1)
  for (let i = 0; i < times; i++) {
    parts.push(fragment);
  }
  return parts.join(''); // 最后一次遍历 + 一次分配，把整段拼起来
}

const fragment = `id=${record.id}&name=${record.name}&level=${record.level};`;

// 关键：三种写法都必须【真正使用】最终字符串，否则比较不公平。
// 因为 += 产生的是惰性的 Rope 结构，如果只是返回它、从不读取，
// 引擎根本不需要把它展平成连续内存 —— 那等于少做了一大块工作。
// consume() 强制读一个字符并取长度，相当于"把字符串交给下一个环节使用"。
function consume(s) {
  return s.charCodeAt(0) + s.length;
}

const plusResult = bench(() => consume(buildWithPlus(fragment, N)));
const templateResult = bench(() => consume(buildWithTemplate(fragment, N)));
const joinResult = bench(() => consume(buildWithJoin(fragment, N)));

console.log('写法'.padEnd(24) + '最小值(ms)'.padEnd(14) + '各轮耗时(ms)');
console.log('-'.repeat(70));
console.log('+ / += 累加'.padEnd(22) + fmtMs(plusResult.min) + '  ' + plusResult.all.map((t) => t.toFixed(2)).join(', '));
console.log('模板字符串累加'.padEnd(21) + fmtMs(templateResult.min) + '  ' + templateResult.all.map((t) => t.toFixed(2)).join(', '));
console.log('数组 push + join'.padEnd(20) + fmtMs(joinResult.min) + '  ' + joinResult.all.map((t) => t.toFixed(2)).join(', '));

// 校验三种写法的产出完全一致（性能比较的前提是结果等价）
const s1 = buildWithPlus(fragment, 100);
const s2 = buildWithTemplate(fragment, 100);
const s3 = buildWithJoin(fragment, 100);
console.log(`\n三种写法产出的字符串是否完全相同：${s1 === s2 && s2 === s3}（前 30 个字符：${s1.slice(0, 30)}...）`);

const times = [plusResult.min, templateResult.min, joinResult.min];
const fastest = Math.min(...times);
const slowest = Math.max(...times);
console.log(`本次实测最快 ${fastest.toFixed(3)} ms，最慢 ${slowest.toFixed(3)} ms，差距约 ${(slowest / fastest).toFixed(2)} 倍。`);
console.log('注意两点：');
console.log('  1) 绝对耗时都在几毫秒以内 —— 10 万次拼接只要几毫秒，');
console.log('     在真实业务里这是可以忽略的量级，不值得为它牺牲可读性。');
console.log('  2) 这个差距只在"循环体只是拼接"的极端场景下才看得出来；');
console.log('     具体数值受机器、Node 版本、字符串长度影响，甚至可能相反。');

// ---------------------------------------------------------------------------
// 3. 为什么 += 不慢：Rope / ConsString 与"字符串构建器"的历史
// ---------------------------------------------------------------------------

console.log('\n--- 3. 原理：V8 的 Rope / ConsString 结构 ---');

console.log('字符串是【不可变】的：s += x 不会修改原来的 s，而是产生一个新字符串。');
console.log('如果每次拼接都真的复制一遍全部字符，10 万次拼接就是 O(n²)——');
console.log('这正是老引擎（IE / 早期 SpiderMonkey）里真实发生的事，');
console.log('所以那个年代才需要"字符串构建器"（push 到数组再 join）这个套路。');
console.log('');
console.log('现代 V8 的做法是 Rope（绳子）结构：');
console.log('  · 拼接两个字符串时，如果总长度超过阈值，V8 不复制字符，');
console.log('    而是创建一个 ConsString 节点，只记录"左边是谁、右边是谁"。');
console.log('    于是 a + b 变成了 O(1) 的操作。');
console.log('  · 连续拼接会形成一棵二叉树，形状像一根由多股编成的绳子，');
console.log('    所以叫 Rope；读取时按中序遍历就能还原完整字符串。');
console.log('  · 这就是为什么现代引擎里 += 并不慢：它拼的不是字符，而是树节点。');
console.log('');
console.log('"字符串构建器"模式在旧引擎里才必要：');
console.log('  · 老引擎没有 Rope，每次 += 都老老实实复制整个字符串；');
console.log('  · 数组 push 是均摊 O(1)，join 只做一次分配，所以能救场。');
console.log('  · 现在两者的差距通常很小，选哪个主要看可读性：');
console.log('    需要分隔符时 join 更自然（不用每次手动补分隔符、不用处理尾部分隔符）。');

// ---------------------------------------------------------------------------
// 4. 性能悬崖：在循环里读取字符串会强制扁平化
// ---------------------------------------------------------------------------

console.log('\n--- 4. 性能悬崖：循环里读字符串 = 强制扁平化 ---');

// 4.1 只拼接，从不读取中间结果 → Rope 一直保持"惰性"，很快
function appendOnly(times) {
  let s = '';
  for (let i = 0; i < times; i++) {
    s += 'abcdefghij';
  }
  return s.length; // 只读 length：length 不需要扁平化，是 O(1) 的元数据
}

// 4.2 每轮都读取一个真实字符 → 必须先把 Rope 展平成连续字符串
function appendAndRead(times) {
  let s = '';
  let acc = 0;
  for (let i = 0; i < times; i++) {
    s += 'abcdefghij';
    // charCodeAt 需要"第 0 个字符"到底是谁 —— 这要求整棵树被展平
    // 展平是 O(当前总长度)，于是整个循环退化成 O(n²)
    acc += s.charCodeAt(0);
  }
  return acc;
}

// 扁平化是 O(n²)，所以这里必须用更小的规模，否则示例会超出时间预算
const TRAP_N = 10_000;

appendOnly(1000);
appendAndRead(1000); // 预热

const appendOnlyResult = bench(() => appendOnly(TRAP_N), 3);
const appendAndReadResult = bench(() => appendAndRead(TRAP_N), 3);

console.log(`同样拼接 ${TRAP_N} 次，唯一的区别是后者每轮多读一个字符：`);
console.log('写法'.padEnd(34) + '最小值(ms)');
console.log('-'.repeat(50));
console.log('只 += （Rope 保持惰性）'.padEnd(30) + fmtMs(appendOnlyResult.min));
console.log('+= 后 charCodeAt(0)（强制扁平化）'.padEnd(30) + fmtMs(appendAndReadResult.min));

const trapRatio = appendAndReadResult.min / appendOnlyResult.min;
console.log(`\n差距约 ${trapRatio.toFixed(1)} 倍（因机器而异，重点是数量级）。`);
console.log('为什么会这样：每次 charCodeAt 都要求字符串是"扁平的连续内存"，');
console.log('V8 只好把整棵 Rope 展平；展平后下一次 += 又长出新的节点，');
console.log('下一轮再展平……于是每轮都要复制约 i 个字符，总计 O(n²)。');
console.log('');
console.log('工程启示：');
console.log('  · 循环里不要反复读取正在增长的字符串（charCodeAt / slice / 正则 /');
console.log('    toUpperCase / 传给原生 API 等都会触发扁平化）。');
console.log('  · 如果确实需要边拼边处理，就改用数组 push + join，语义更清晰也更稳。');
console.log('  · 把"读取"推迟到循环结束后一次性做，就能保住 Rope 的优势。');

// ---------------------------------------------------------------------------
// 5. 需要分隔符时：join 更自然
// ---------------------------------------------------------------------------

console.log('\n--- 5. 带分隔符的场景：join 更自然 ---');

const words = ['apple', 'banana', 'cherry', 'date', 'elderberry'];

// 写法 A：用 += 手工处理分隔符 —— 要么加个 if 判断，要么拼接后再切掉多余的尾部分隔符
function joinManual(list) {
  let s = '';
  for (let i = 0; i < list.length; i++) {
    if (i > 0) s += ', '; // 必须判断"是不是第一个"，代码噪音大
    s += list[i];
  }
  return s;
}

// 写法 B：join —— 分隔符由 join 自己处理，不用关心首尾
function joinNative(list) {
  return list.join(', ');
}

console.log('手工拼接：', joinManual(words));
console.log('join 拼接：', joinNative(words));
console.log(`结果是否一致：${joinManual(words) === joinNative(words)}`);
console.log('');
console.log('可读性上 join 明显更胜一筹（不用处理"第一个元素不加分隔符"这种边界）；');
console.log('性能上 join 只需要一次遍历 + 一次内存分配，在大数组下通常是稳的。');
console.log('所以"需要分隔符"就是选择 join 的最强理由——理由是语义，不只是性能。');

// 顺带演示一个常见错误：拼接时忘了分隔符导致数据粘连
console.log('\n顺带一个常见 bug：');
const badParts = ['a', 'b', 'c'];
let bad = '';
for (const p of badParts) bad += p; // 忘了分隔符
console.log(`  忘记分隔符的结果："${bad}"（三个词粘成一个了）`);
console.log(`  正确结果：       "${badParts.join(',')}"`);

// ---------------------------------------------------------------------------
// 6. 工程结论
// ---------------------------------------------------------------------------

console.log('\n--- 6. 工程结论 ---');

console.log('1. 现代引擎里 += 与数组 join 的差异【通常很小】，不要为了性能把');
console.log('   清晰的代码改复杂。选择依据应该是可读性和语义。');
console.log('2. 需要分隔符、或者片段数量很大且要一次性组装 → 用 join，更自然。');
console.log('3. 只是简单地累加几段文本 → 用 + 或模板字符串，最直观。');
console.log('4. 真正要避免的是"在循环里反复读取正在增长的长字符串"，');
console.log('   那会让引擎无法利用 Rope 结构，退化成 O(n²)。');
console.log('5. 永远以实测为准：本示例的绝对数值因机器和 Node 版本而异，');
console.log('   关键是理解"为什么"，而不是记住"谁更快"。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
