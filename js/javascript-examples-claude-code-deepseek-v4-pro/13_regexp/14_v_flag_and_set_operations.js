/**
 * ============================================================================
 * 知识点：v 标志（unicodeSets，ES2024）—— u 的正式后继、字符类集合运算与 \q{...}
 * ============================================================================
 *
 * 【所属分类】13_regexp —— 正则表达式
 * 【难度等级】高级
 * 【前置知识】13_regexp/02_character_classes.js、13_regexp/09_flags.js、11_strings/09_unicode_and_codepoints.js
 *
 * 【也见】34_modern_es_features/04_es2024_features.js —— ES2024 特性综述里也有一节讲 v 标志。
 *        本文件是 v 标志的主场（专文）；那篇只给最小示例，细节以本文为准。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES2024 给正则新增了第五个常规标志 v（代号 unicodeSets）。
 *    它是 u（unicode）标志的正式后继：把 u 的全部能力保留下来，
 *    再额外解锁"字符类集合运算"这一组全新语法。
 *      · u  → 按"码位"而不是"码元"解释模式，并允许 \p{...} 属性转义
 *      · v  → u 的全部能力 + 集合运算（并/交/差）+ 嵌套字符类
 *             + \q{...} 字符串字面量 + 属性字符串（如 \p{RGI_Emoji}）
 *
 * 2. 为什么需要
 *    很多正则需求本质是"集合运算"，用 u 只能绕：
 *      · 想要"小写字母里的非元音" → u 里只能手写 [b-df-hj-np-tv-z]，加一个字母就要重排
 *      · 想要"Unicode 字母里去掉 ASCII" → u 里根本无法表达
 *      · 想要"匹配这几个多字符词中的任意一个，且必须整体匹配" → u 里做不到原子化
 *    v 把这三件事变成了一行：
 *      [[a-z]&&[^aeiou]]          交集
 *      [\p{L}--\p{ASCII}]         差集
 *      [\q{ab|cd}]                字符串字面量（多字符原子选项）
 *    另外 emoji 场景常用 \p{RGI_Emoji} 这类"属性字符串"，也只在 v 下可用。
 *
 * 3. 核心语法要点
 *    - u 与 v 互斥：同时写 'uv' 会抛 SyntaxError。
 *    - 集合运算（写在字符类 [ ] 内部）：
 *        [A B]      并集（并列书写，和传统字符类一样）
 *        [A&&B]     交集
 *        [A--B]     差集（A 减去 B）
 *        其中 A、B 可以是嵌套类 [..]、\p{...} 属性转义，或单个字符。
 *        可以链式：[[a-z]&&[^aeiou]&&[^x]]
 *    - 嵌套字符类：[a-z] 本身可以作为一个操作数写进外层的 [ ]。
 *    - \q{...}：字符类内的"字符串字面量"，用 | 分隔多个候选，
 *        每个候选是**整体匹配**的原子串，而不是逐字符的集合。
 *        所以 [\q{ab}] 只匹配 "ab" 这两个字符连写，不匹配单独的 "a" 或 "b"。
 *    - i 标志与集合运算叠加：[[a-z]--[aeiou]] 加 i 后会按"大小写折叠"先
 *        把集合做大再做差，于是 B、Z 也被匹配，而 A、E 依旧被排除。
 *    - v 比 u 更严格：字符类里 ( ) { } / - | 等标点若想表示字面量，
 *        必须写成转义形式 \( \) \{ \} \/ \- \|，否则直接 SyntaxError。
 *        这是从 u 迁移到 v 时最容易踩的坑。
 *
 * 4. 常见陷阱
 *    - 正则字面量 /.../v 是"解析期"语法错误：在不支持 v 的引擎上，
 *      整个脚本根本加载不了，try/catch 也救不回来。
 *      所以本文件全部用 new RegExp(源串, 'v') 在"运行期"构造，
 *      配合特性检测优雅降级 —— 这是写跨版本兼容代码的关键技巧。
 *    - 同时写 uv 会抛 SyntaxError（不是 RangeError）。
 *    - v 模式里裸写的 - 不再是"字面量减号"，而是集合运算符的一部分。
 *    - \q{...} 里的候选是原子的：[\q{ab|cd}] 匹配 "ab" 或 "cd"，
 *      绝不匹配 "a"、"b"、"cd" 里的单个字符。
 *    - v 不会改变 u 已有的语义（\p{...}、码位处理等），只是更严格、更强。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 13_regexp/14_v_flag_and_set_operations.js
 *
 * 【预期输出】
 *   先做特性检测，支持则逐项演示集合运算、\q{...}、i 标志叠加与严格性差异；
 *   不支持则打印降级说明与各语法的等价写法，脚本始终以状态码 0 结束。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 特性检测 —— 必须用 new RegExp，绝不能用 /.../v 字面量
// ---------------------------------------------------------------------------

console.log('--- 0. 特性检测 ---');

// 【重要】为什么这里必须用 new RegExp 而不是正则字面量？
//   正则字面量在"解析阶段"就要确定标志是否合法。在不认识 v 的引擎上，
//   源码里出现 /abc/v 会让整个文件抛出 SyntaxError，连第一行都执行不到，
//   try/catch 完全无能为力（语法错误无法在运行期捕获）。
//   new RegExp(源串, 'v') 则是在"运行期"构造，能被 try/catch 包住。
//   写兼容代码时请一律采用后者。
const V_SUPPORTED = (() => {
  try {
    // 用一个最简单的集合运算做探针：交集
    return new RegExp('[[a-z]&&[^aeiou]]', 'v').test('b');
  } catch {
    return false;
  }
})();

console.log('本环境支持 v 标志（unicodeSets）：', V_SUPPORTED);
console.log('Node 版本：', process.version);
console.log('对比：u 标志始终可用 →', (() => {
  try {
    return new RegExp('\\p{L}', 'u').test('中');
  } catch {
    return false;
  }
})());

// 顺便探测几个 v 的细分能力，便于下面各节决定是否演示
const V_DETAIL = (() => {
  if (!V_SUPPORTED) return { setOps: false, nested: false, stringLiteral: false, propertyOfStrings: false };
  const probe = (source, flags = 'v') => {
    try {
      new RegExp(source, flags);
      return true;
    } catch {
      return false;
    }
  };
  return {
    // 集合运算：交集 / 差集
    setOps: probe('[[a-z]&&[^aeiou]]') && probe('[\\p{L}--\\p{ASCII}]'),
    // 嵌套字符类
    nested: probe('[[[a-z]&&[^aeiou]]0-9]'),
    // \q{...} 字符串字面量
    stringLiteral: probe('[\\q{ab|cd}]'),
    // 属性字符串（\p{RGI_Emoji} 这类只在 v 下可用）
    propertyOfStrings: probe('[\\p{RGI_Emoji}]'),
  };
})();
console.log('细分能力探测：', JSON.stringify(V_DETAIL));

// 若不支持 v，打印降级说明后直接结束（不抛错、状态码仍为 0）
if (!V_SUPPORTED) {
  console.log('\n当前环境不支持 v 标志，下面只打印降级说明，不做实际演示。');
  console.log('升级建议：Node 20+ / Chrome 112+ / Safari 17+ / Firefox 116+ 均已支持。');
  console.log('\n各语法的等价写法对照：');
  console.log('  [[a-z]&&[^aeiou]]       → u 下需手写排除元音，如 [b-df-hj-np-tv-z]');
  console.log('  [\\p{L}--\\p{ASCII}]     → u 下无法表达，只能拆成两段业务逻辑分别判断');
  console.log('  [\\q{ab|cd}]            → u 下用 (?:ab|cd) 并在外层手工保证整体匹配');
  console.log('  [\\p{RGI_Emoji}]        → u 下没有属性字符串，只能上第三方 emoji 库');
  console.log('\n继续阅读下方注释即可了解 v 的完整能力，本脚本正常结束。');
}

// ---------------------------------------------------------------------------
// 辅助函数：统一用 new RegExp 构造 v 模式，方便逐例对照
// ---------------------------------------------------------------------------

/**
 * 构造一个 v 模式正则。source 用普通字符串写，所以反斜杠要写两遍：
 * 想在正则里看到 \p{L}，JS 字符串就要写 '\\p{L}'。
 */
function vRe(source, extraFlags = '') {
  return new RegExp(source, extraFlags + 'v');
}

/** 安全地执行一次测试，任何异常都转成一段说明文字，绝不让脚本崩掉 */
function safeTest(regex, input) {
  try {
    return regex.test(input);
  } catch (err) {
    return `抛出 ${err.constructor.name}`;
  }
}

// ---------------------------------------------------------------------------
// 1. u 与 v 的关系：v 是超集，但两者互斥
// ---------------------------------------------------------------------------

console.log('\n--- 1. u 与 v 的关系 ---');

if (V_SUPPORTED) {
  // 【关系一】互斥：同时写 'uv' 会抛 SyntaxError
  //   原因是 u 与 v 会改变同一批语法（字符类内的解释规则），
  //   规范规定二者不能共存，避免出现"到底按哪套规则解析"的歧义。
  console.log("【互斥】同时使用 'uv'：");
  for (const flags of ['uv', 'vu']) {
    try {
      // 注意：这里同样必须用 new RegExp，'uv' 的非法性在运行期才被校验
      new RegExp('a', flags);
      console.log(`  new RegExp('a', '${flags}') → 竟然成功了（不该发生）`);
    } catch (err) {
      console.log(`  new RegExp('a', '${flags}') → ${err.constructor.name}: ${err.message}`);
    }
  }
  console.log('  ↑ 是 SyntaxError，不是 RangeError —— 说明它被当作"语法问题"处理。');

  // 【关系二】在两者都支持的语法上，v 与 u 的行为一致
  console.log('\n【一致】u 与 v 共有的语法，行为相同：');
  const sharedCases = [
    ['\\p{L} 匹配中文', '\\p{L}', '中'],
    ['\\p{L} 匹配数字', '\\p{L}', '5'],
    ['\\u{1F600} 匹配 😀', '\\u{1F600}', '😀'],
    ['\\p{Script=Han} 匹配中', '\\p{Script=Han}', '中'],
  ];
  for (const [desc, source, input] of sharedCases) {
    const inU = safeTest(new RegExp(source, 'u'), input);
    const inV = safeTest(new RegExp(source, 'v'), input);
    console.log(`  ${desc.padEnd(26)} u=${String(inU).padEnd(5)} v=${String(inV).padEnd(5)} ${inU === inV ? '一致' : '不一致 ←'}`);
  }
  console.log('  ↑ 这些是"码位解释 + 属性转义"能力，v 完整继承了 u。');

  // 【关系三】v 的超集之处：u 里根本写不出来的东西
  console.log('\n【超集】v 独有的能力（u 下要么无法表达，要么直接报错）：');
  try {
    new RegExp('[[a-z]&&[^aeiou]]', 'u');
    console.log('  u 竟然接受了集合运算（不该发生）');
  } catch (err) {
    console.log('  u 里写 [[a-z]&&[^aeiou]] →', err.constructor.name, '（u 不认识集合运算符）');
  }
  console.log('  同一个模式在 v 里正常工作：');

  // 【关系四】v 更严格：u 里合法的写法，v 里可能直接报错
  console.log('\n【更严格】同一条模式，u 通过而 v 报错：');
  const stricterCases = [
    ['[a-z--]', 'u 里末尾的 - 是字面量减号', 'v 里 -- 是差集运算符，缺少右操作数'],
    ['[(]', 'u 里裸括号是字面量', 'v 里保留标点必须转义成 \\('],
    ['[|]', 'u 里裸竖线是字面量', 'v 里 | 是保留标点，必须转义成 \\|'],
  ];
  for (const [source, uExplain, vExplain] of stricterCases) {
    let inU;
    try {
      new RegExp(source, 'u');
      inU = '通过';
    } catch (err) {
      inU = err.constructor.name;
    }
    let inV;
    try {
      new RegExp(source, 'v');
      inV = '通过';
    } catch (err) {
      inV = err.constructor.name;
    }
    console.log(`  ${source.padEnd(12)} u=${inU.padEnd(12)} v=${inV.padEnd(12)}`);
    console.log(`    u 的解读：${uExplain}`);
    console.log(`    v 的解读：${vExplain}`);
  }
  console.log('  ↑ 所以"v 是 u 的超集"要这样理解：');
  console.log('     表达能力上 v ⊇ u（v 能做 u 做的一切，还更多）；');
  console.log('     但"接受的源码集合"上 v 更窄，v 拒绝了一批 u 能接受的写法。');
  console.log('     迁移到 v 时，主要工作就是把裸标点改成转义写法。');
} else {
  console.log('环境不支持 v，跳过本节。要点：u 与 v 互斥（同时会 SyntaxError）；');
  console.log('v 在表达能力上是 u 的超集，但对源码写法要求更严格。');
}

// ---------------------------------------------------------------------------
// 2. v 的核心：字符类集合运算
// ---------------------------------------------------------------------------

console.log('\n--- 2. 字符类集合运算 ---');

if (V_SUPPORTED && V_DETAIL.setOps) {
  // 集合运算写在 [ ] 内部，三种运算符：
  //   并列  并集（和传统字符类一样）
  //   &&    交集
  //   --    差集
  console.log('三种运算（操作数可以是嵌套类 [..]、\\p{...} 或单字符）：\n');

  const setCases = [
    // [描述, v 模式源串, 应匹配的例子, 不应匹配的例子]
    ['并集 [[a-z][0-9]]       字母或数字', '[[a-z][0-9]]', ['a', 'z', '5'], ['A', '-', '中']],
    ['交集 [[a-z]&&[^aeiou]]  小写非元音辅音', '[[a-z]&&[^aeiou]]', ['b', 'z', 'q'], ['a', 'e', '5', 'B']],
    ['交集 [[a-z]&&[b-d]]     a-z 与 b-d 的交', '[[a-z]&&[b-d]]', ['b', 'c', 'd'], ['a', 'e', 'z']],
    ['差集 [\\p{L}--\\p{ASCII}] Unicode 字母减去 ASCII', '[\\p{L}--\\p{ASCII}]', ['中', 'é', 'Ω'], ['a', 'Z', '5']],
    ['差集 [\\p{ASCII}--\\p{Number}] ASCII 减去数字', '[\\p{ASCII}--\\p{Number}]', ['a', '-', '$'], ['0', '5', '中']],
    ['链式 [[a-z]&&[^aeiou]&&[^x]] 再排除 x', '[[a-z]&&[^aeiou]&&[^x]]', ['b', 'z'], ['x', 'a', '5']],
  ];

  for (const [desc, source, shouldMatch, shouldNotMatch] of setCases) {
    const re = vRe(source);
    const yes = shouldMatch.map((c) => `${c}${safeTest(re, c) === true ? '✓' : '✗'}`).join(' ');
    const no = shouldNotMatch.map((c) => `${c}${safeTest(re, c) === false ? '✓' : '✗'}`).join(' ');
    console.log(`  ${desc}`);
    console.log(`     源串：${source}`);
    console.log(`     应匹配：   ${yes}`);
    console.log(`     不应匹配： ${no}`);
  }
  console.log('  （✓ 表示行为符合预期，✗ 表示不符合）');

  // 实用案例一：把"小写字母里的非元音"一次写清
  console.log('\n实用案例一：提取字符串里的辅音字母');
  const consonantRe = vRe('[[a-z]&&[^aeiou]]', 'g');
  const word = 'the quick brown fox jumps over the lazy dog';
  const consonants = word.match(consonantRe);
  console.log(`  原文：${word}`);
  console.log(`  辅音：${consonants.join('')}`);
  console.log('  对比 u 下的老写法 [b-df-hj-np-tv-z]，v 的写法"意图"一目了然。');

  // 实用案例二：剔除中文里混入的 ASCII，只留非 ASCII 字符
  console.log('\n实用案例二：从混合文本里挑出"非 ASCII 的字母"');
  const nonAsciiLetter = vRe('[\\p{L}--\\p{ASCII}]', 'g');
  const mixedText = 'Hello 世界 café Ωmega 12345';
  console.log(`  原文：${mixedText}`);
  console.log(`  非 ASCII 字母：${mixedText.match(nonAsciiLetter).join('')}`);
  console.log('  ↑ u 模式下这个需求无法用一条正则表达，只能逐字符判断码位范围。');
} else {
  console.log('环境不支持集合运算，跳过本节。');
}

// ---------------------------------------------------------------------------
// 3. 嵌套字符类
// ---------------------------------------------------------------------------

console.log('\n--- 3. 嵌套字符类 ---');

if (V_SUPPORTED && V_DETAIL.nested) {
  // u 模式下，只有 V8 会直接拒绝 [[a-z]] 这种写法（报 Lone quantifier brackets），
  // 因为 [ 在传统字符类里只是个普通字面量，规范与实现的处理并不一致。
  // v 模式明确了语义：[a-z] 作为一个整体成为外层的"操作数"。
  console.log('嵌套类作为操作数：');
  const nestedCases = [
    ['[[[a-z]&&[^aeiou]]0-9]', 'v 模式：辅音字母（嵌套交集的结果）再并上数字'],
    ['[[a-z]0-9]', 'v 模式：[a-z] 作为一个整体，并上 0-9'],
  ];
  for (const [source, desc] of nestedCases) {
    const re = vRe(source);
    const probes = ['b', 'a', '5', 'B'].map((c) => `${c}=${safeTest(re, c)}`).join(' ');
    console.log(`  ${source.padEnd(26)} ${probes}`);
    console.log(`      ${desc}`);
  }
  console.log('  举例 [[a-z]0-9] 匹配 b 为 ' + safeTest(vRe('[[a-z]0-9]'), 'b') +
    '，因为外层的并集是"[a-z] 整体" ∪ "{0-9}"。');

  // 对比 u 模式下的同名写法
  console.log("\n对比 u 模式下的 '[[a-z]]'：");
  try {
    const uRe = new RegExp('[[a-z]]', 'u');
    console.log('  u 模式构造成功，匹配 "b" =', uRe.test('b'), '，匹配 "[" =', uRe.test('['));
  } catch (err) {
    // V8 在这里直接拒绝：它把 [[ 视为"孤立的量词括号"
    console.log('  u 模式抛出：', err.constructor.name, '-', err.message);
    console.log('  ↑ 传统字符类里 [ 只是普通字面量，写 [[a-z]] 语义不明确，V8 干脆拒绝。');
  }
  console.log('  v 模式给了 [ ] 明确的"嵌套类"含义，这就是它更强大的地方。');

  // 嵌套的实际用途：组合多个语义清晰的子集
  console.log('\n实际用途：把子集拆开定义，再用集合运算组合');
  const digits = '[0-9]';
  const hexLetters = '[[a-f]&&[^0-9]]'; // 小写十六进制字母
  const hexChar = vRe(`[${digits}${hexLetters}]`);
  console.log(`  组合模式：[${digits}${hexLetters}]（数字 ∪ 十六进制字母）`);
  for (const c of ['5', 'a', 'f', 'g', 'A']) {
    console.log(`    '${c}' → ${safeTest(hexChar, c)}`);
  }
} else {
  console.log('环境不支持嵌套字符类，跳过本节。');
}

// ---------------------------------------------------------------------------
// 4. \q{...} 字符串字面量
// ---------------------------------------------------------------------------

console.log('\n--- 4. \\q{...} 字符串字面量 ---');

if (V_SUPPORTED && V_DETAIL.stringLiteral) {
  // \q{...} 是 v 独有的语法，只能写在字符类 [ ] 内部。
  // 它的候选用 | 分隔，每个候选是"多字符的原子串"：
  //   [\q{ab|cd}]  → 匹配 "ab" 或 "cd"，不匹配单独的 "a"、"b"、"c"、"d"
  // 这是它和传统字符类的根本区别 ——
  //   传统 [abc] 是"字符集合"，一次只吃一个字符；
  //   \q{abc} 是"字符串候选"，一次吃下整个串。
  console.log('基本行为：');
  const qRe = vRe('[\\q{ab|cd}]');
  console.log(`  模式：${qRe.source}`);
  for (const input of ['ab', 'cd', 'a', 'b', 'abc', 'c', 'abcd']) {
    console.log(`    匹配 "${input}" → ${safeTest(qRe, input)}`);
  }
  console.log('  ↑ "a"、"b"、"c" 为 false：不存在等于它们的候选串。');
  console.log('    "abc"、"abcd" 为 true：test() 是**部分匹配**，"abc" 里含有子串 "ab" 就成立。');
  console.log('    这正是 \\q{...} 的价值：它把 "ab" 当成一个整体来比对，');
  console.log('    而传统写法 [ab] 会变成"a 或 b 各自匹配"，完全不是一回事。');

  // 与传统字符类对照
  console.log('\n与传统字符类 [abc] 的语义对照：');
  console.log('  [abc]     = 字符集合，一次匹配一个字符，匹配 "a" 或 "b" 或 "c"');
  console.log('  [\\q{ab}] = 字符串候选，一次匹配一个完整串 "ab"');
  for (const input of ['a', 'ab']) {
    console.log(`    '${input}'： [abc] → ${safeTest(new RegExp('[abc]', 'v'), input)}，  [\\q{ab}] → ${safeTest(qRe, input)}`);
  }

  // \q{...} 和普通字符可以混写在同一个类里
  console.log('\n\\q{...} 可与普通字符混写：');
  const mixedQ = vRe('[\\q{ab}xy]');
  for (const input of ['ab', 'x', 'y', 'a']) {
    console.log(`    [\\q{ab}xy] 匹配 "${input}" → ${safeTest(mixedQ, input)}`);
  }

  // 候选里可以用转义
  console.log('\n候选里可以写转义（\\q{a\\-b} 表示字面量 "a-b"）：');
  const escapedQ = vRe('[\\q{a\\-b}]');
  for (const input of ['a-b', 'a']) {
    console.log(`    匹配 "${input}" → ${safeTest(escapedQ, input)}`);
  }

  // 实战：匹配多种"整体词形"而不误伤子串
  console.log('\n实战：匹配单位后缀，避免把 "ms" 里的 "s" 单独算进去');
  const unitRe = vRe('\\d+[\\q{ms|s|min|h}]', 'g');
  const durations = ['100ms', '30s', '5min', '2h', '10mins'];
  for (const d of durations) {
    const m = d.match(unitRe);
    console.log(`  "${d}" → ${m ? m.join(', ') : '不匹配'}`);
  }
  console.log('  ↑ 注意 "10mins" 也匹配到了 "10min"：正则默认是"部分匹配"，');
  console.log('    若要整体匹配请加锚点 \\A...\\z 思路（JS 用 ^ 与 $ 或整体 fullmatch 判断）。');
} else {
  console.log('环境不支持 \\q{...}，跳过本节。u 模式下的等价写法是 (?:ab|cd)，');
  console.log('但那是分组而不是字符类，会消耗捕获编号，语义也不完全等价。');
}

// ---------------------------------------------------------------------------
// 5. 内置属性字符串：\p{RGI_Emoji}
// ---------------------------------------------------------------------------

console.log('\n--- 5. 属性字符串 \\p{RGI_Emoji} ---');

if (V_SUPPORTED && V_DETAIL.propertyOfStrings) {
  // \p{...} 在 u 模式下只能表示"单个码位的属性"。
  // v 额外支持"属性字符串（properties of strings）"，即一个属性对应一串字符。
  // 最典型的就是 \p{RGI_Emoji}：它能一次性匹配由多个码位组成的 emoji 序列。
  console.log('为什么需要它：带修饰符/连接符的 emoji 由多个码位组成');
  const family = '👨‍👩‍👧';
  const emojiWithModifier = '👍🏽';
  console.log(`  '${family}' 的码位长度：${Array.from(family).length}（家庭 emoji，用 ZWJ 连接）`);
  console.log(`  '${emojiWithModifier}' 的码位长度：${Array.from(emojiWithModifier).length}（肤色修饰符）`);
  console.log(`  单个码位的 \\p{Emoji} 只能匹配其中一段：`);
  const singleEmoji = new RegExp('\\p{Emoji}', 'u');
  console.log(`    /\\p{Emoji}/u 匹配 '👍🏽' 的结果：${JSON.stringify('👍🏽'.match(new RegExp('\\p{Emoji}', 'gu')))}`);
  console.log('    ↑ 把复合 emoji 拆成了多段，这正是"按码位匹配"的局限。');

  // v 的 \p{RGI_Emoji} 把整个 emoji 序列当作一个整体
  const rgiEmoji = vRe('[\\p{RGI_Emoji}]', 'g');
  console.log('\n用 v 的 \\p{RGI_Emoji} 整体匹配：');
  for (const s of ['😀', '👍🏽', family, '1️⃣']) {
    const matches = s.match(rgiEmoji);
    console.log(`  '${s}'（${Array.from(s).length} 个码位）→ 匹配到 ${matches ? matches.length : 0} 个完整 emoji`);
  }
  console.log('  ↑ 每个复合 emoji 都被当作 1 个整体，这正是我们想要的。');

  // 实战：从一段文本里数出 emoji 个数
  console.log('\n实战：统计一段文本里的 emoji 个数');
  const textWithEmoji = '今天很开心 😀 吃了 🍜 还和家人 👨‍👩‍👧 视频了 👍🏽';
  const found = textWithEmoji.match(rgiEmoji) ?? [];
  console.log(`  原文：${textWithEmoji}`);
  console.log(`  找到 ${found.length} 个：${found.join(' ')}`);
  console.log('  ↑ 用 \\p{Emoji} 会数出更多（因为它把复合 emoji 拆开数），结果不符合直觉。');
} else {
  console.log('环境不支持属性字符串（\\p{RGI_Emoji}），跳过本节。');
}

// ---------------------------------------------------------------------------
// 6. 大小写不敏感下的集合运算
// ---------------------------------------------------------------------------

console.log('\n--- 6. i 标志与集合运算叠加 ---');

if (V_SUPPORTED && V_DETAIL.setOps) {
  // 加 i 之后，集合运算会先用"简单大小写折叠"把每个集合变大，再做交/差。
  // 于是 [[a-z]--[aeiou]] 里：
  //   [a-z] 折叠成 [A-Za-z]
  //   [aeiou] 折叠成 [AEIOUaeiou]
  //   差集 = 全部辅音（含大写）
  console.log('模式 [[a-z]--[aeiou]]，对比加不加 i：');
  const noI = vRe('[[a-z]--[aeiou]]');
  const withI = vRe('[[a-z]--[aeiou]]', 'i');
  for (const c of ['b', 'Z', 'B', 'a', 'A', 'e', 'E', '5']) {
    console.log(`  '${c}' → 不加 i：${String(safeTest(noI, c)).padEnd(5)} 加 i：${safeTest(withI, c)}`);
  }
  console.log('  ↑ 不加 i 时只有小写辅音匹配；加了 i 后大写辅音（B、Z）也匹配，');
  console.log('    但元音无论大小写（a、A、e、E）仍被排除 —— 折叠是"整集合一起折叠"的。');

  // 用 Unicode 属性做大小写折叠的集合运算
  console.log('\n配合 Unicode 属性：\\p{Lowercase_Letter} 减去元音，加 i 后同样折叠');
  const foldProps = vRe('[\\p{Lowercase_Letter}--[aeiou]]', 'i');
  for (const c of ['b', 'B', 'a', 'A', '中', 'é', 'É']) {
    console.log(`  '${c}' → ${safeTest(foldProps, c)}`);
  }
  console.log('  ↑ é 与 É 属于 Unicode 字母并参与大小写折叠，中文字符不参与折叠。');

  // 重要提醒：否定集合 [^...] 与 i 叠加时的注意事项
  console.log('\n提醒：否定集合 [^...] 与 i 叠加时，补集是"折叠之后"再取补');
  const negated = vRe('[^[a-z]--[aeiou]]', 'i');
  console.log('  模式 [^[a-z]--[aeiou]]（加 i）：内部是"辅音"，取补后应得到"元音与其它字符"');
  for (const c of ['a', 'A', 'b', 'B', '5', '中']) {
    console.log(`  '${c}' → ${safeTest(negated, c)}`);
  }
  console.log('  ↑ a、A（元音）与 5、中（本来就不在集合里）都是 true，b、B 是 false，符合预期。');
  console.log('    但请记住：涉及大小写折叠的补集，推理时一定要"先折叠、再取补"，');
  console.log('    凭直觉直接想"不在 [a-z] 里"很容易算错。');
} else {
  console.log('环境不支持集合运算，跳过本节。');
}

// ---------------------------------------------------------------------------
// 7. 从 u 迁移到 v：严格性差异清单
// ---------------------------------------------------------------------------

console.log('\n--- 7. u → v 迁移检查清单 ---');

if (V_SUPPORTED) {
  // v 把一批在字符类里"可以裸写"的标点变成了保留符号，
  // 想表示字面量必须加反斜杠转义。
  const strictCases = [
    ['(', '\\(', '圆括号'],
    [')', '\\)', '圆括号'],
    ['{', '\\{', '花括号'],
    ['}', '\\}', '花括号'],
    ['/', '\\/', '斜杠'],
    ['-', '\\-', '连字符'],
    ['|', '\\|', '竖线'],
  ];

  console.log('字符类内"裸写"与"转义"的对照：');
  console.log('  字面量   裸写结果                转义后');
  for (const [raw, escaped, name] of strictCases) {
    let rawResult;
    try {
      new RegExp(`[${raw}]`, 'v');
      rawResult = '合法';
    } catch (err) {
      rawResult = err.constructor.name;
    }
    let escapedResult;
    try {
      const re = new RegExp(`[${escaped}]`, 'v');
      escapedResult = `合法，匹配 "${raw}" = ${re.test(raw)}`;
    } catch (err) {
      escapedResult = err.constructor.name;
    }
    console.log(`  ${JSON.stringify(raw).padEnd(8)} ${rawResult.padEnd(22)} ${escapedResult}   （${name}）`);
  }
  console.log('  ↑ 凡是"裸写报 SyntaxError"的，改成转义形式即可。');

  // 特别注意 -- 与 &&
  console.log('\n最容易踩的坑：-- 与 && 在 v 里是运算符');
  const operatorCases = [
    ['[a-z--]', 'u 里末尾的 - 当字面量；v 里 -- 被当成差集运算符，缺右操作数 → 报错'],
    ['[a-z\\-]', '正确写法：把字面量减号转义'],
    ['[0-9&&a-z]', 'v 里 && 的操作数必须是嵌套类 / \\p{...} / 单个字符，裸的区间 a-z 不合法'],
    ['[[0-9]&&[a-z]]', '写成嵌套类就合法了：[0-9] 与 [a-z] 没有交集 → 永不匹配'],
    ['[0-9\\&\\&]', '想匹配字面量 "&&" 要全部转义'],
  ];
  for (const [source, note] of operatorCases) {
    let result;
    try {
      const re = new RegExp(source, 'v');
      result = `构造成功`;
      // 顺手报告它对 "-" 或 "&" 的匹配情况，便于观察
      result += `，匹配 "-" = ${safeTest(re, '-')}，匹配 "&" = ${safeTest(re, '&')}`;
    } catch (err) {
      result = `${err.constructor.name}`;
    }
    console.log(`  ${source.padEnd(14)} ${result}`);
    console.log(`      ${note}`);
  }

  // 迁移口诀
  console.log('\n迁移口诀：');
  console.log('  1) 把标志从 u 换成 v（两者不能同时写）。');
  console.log('  2) 字符类里出现的 ( ) { } / - | 一律加反斜杠转义。');
  console.log('  3) 原本靠"裸 - 当字面量"的写法，全部改成 \\-。');
  console.log('  4) 顺手把能表达成集合运算的老模式重写，可读性会明显提升。');
  console.log('  5) 用正则字面量的话注意：不支持 v 的引擎会"解析期"报错，');
  console.log('     需要兼容旧环境时请改用 new RegExp(源串, "v") 并做特性检测（见本文件第 0 节）。');
} else {
  console.log('环境不支持 v，跳过本节。核心结论：u → v 迁移时，');
  console.log('字符类里裸写的 ( ) { } / - | 必须改成转义形式，否则 SyntaxError。');
}

// ---------------------------------------------------------------------------
// 8. 综合实战
// ---------------------------------------------------------------------------

console.log('\n--- 8. 综合实战 ---');

if (V_SUPPORTED && V_DETAIL.setOps) {
  // 场景：从一段混杂文本里做"精确提取"
  const rawText = '订单 A-1024 金额 ¥1,299.50；联系人 张伟（ID: 8823）；备注 emoji 🎉👍🏽';

  console.log('原文：', rawText);
  console.log('');

  // 8.1 用差集提取"非 ASCII 字母"（中文姓名）
  const hanish = vRe('[\\p{Script=Han}--\\p{ASCII}]', 'g');
  console.log('8.1 提取汉字（Unicode 汉字集合，理论上不含 ASCII）：');
  console.log('   ', (rawText.match(hanish) ?? []).join(''));

  // 8.2 用交集提取"十六进制字母"（大写 A-F，去掉数字）
  const upperHex = vRe('[[A-Z]&&[A-F]]', 'g');
  console.log('\n8.2 提取大写十六进制字母（[A-Z] ∩ [A-F]）：');
  console.log('   ', (rawText.match(upperHex) ?? []).join('') || '（无）');

  // 8.3 用链式交集提取"非数字非标点的 ASCII 可打印字符"
  const lettersOnly = vRe('[[\\p{ASCII}]&&[\\p{L}]]', 'g');
  console.log('\n8.3 提取纯 ASCII 字母（[ASCII] ∩ [字母]）：');
  console.log('   ', (rawText.match(lettersOnly) ?? []).join(''));

  // 8.4 用 \q{...} 精确匹配特定多字符 token
  if (V_DETAIL.stringLiteral) {
    const token = vRe('[\\q{ID|emoji|订单}]', 'g');
    console.log('\n8.4 用 \\q{...} 匹配特定整词（注意假阳性）：');
    console.log('   ', (rawText.match(token) ?? []).join(', '));
    console.log('    模式源串：', token.source);
  }

  // 8.5 复合 emoji 整体提取
  if (V_DETAIL.propertyOfStrings) {
    const emojiAll = vRe('[\\p{RGI_Emoji}]', 'g');
    const emojis = rawText.match(emojiAll) ?? [];
    console.log('\n8.5 提取全部 emoji（含复合序列）：');
    console.log(`    共 ${emojis.length} 个：${emojis.join(' ')}`);
  }
} else {
  console.log('环境不支持 v 的集合运算，跳过综合实战。');
}

// ---------------------------------------------------------------------------
// 9. 小结
// ---------------------------------------------------------------------------

console.log('\n--- 9. 小结 ---');

console.log('1) v（unicodeSets，ES2024）是 u 的正式后继，两者互斥，同时用会 SyntaxError。');
console.log('2) v 解锁的核心能力：字符类集合运算');
console.log('     [A B] 并集   [A&&B] 交集   [A--B] 差集，可链式、可嵌套。');
console.log('3) v 还带来：嵌套字符类、\\q{...} 字符串字面量、');
console.log('     \\p{RGI_Emoji} 这类"属性字符串"（可整体匹配复合 emoji）。');
console.log('4) i 标志叠加集合运算时，是"先把每个集合按大小写折叠，再做运算"。');
console.log('5) v 比 u 更严格：字符类里 ( ) { } / - | 作字面量必须转义。');
console.log('6) 兼容性关键：/.../v 字面量在旧引擎上是"解析期"错误，脚本根本无法加载；');
console.log('     要兼容旧环境请用 new RegExp(源串, "v") + 特性检测（本文件第 0 节）。');
console.log('7) 升级建议：Node 20+ / Chrome 112+ / Safari 17+ / Firefox 116+ 均已支持 v。');
console.log('8) 相关阅读：13_regexp/09_flags.js（各标志总览）、');
console.log('     11_strings/09_unicode_and_codepoints.js（码位与代理对基础）。');

console.log('\n全部演示完毕。');
