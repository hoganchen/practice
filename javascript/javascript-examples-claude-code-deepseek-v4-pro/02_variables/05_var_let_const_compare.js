/**
 * ============================================================================
 * 知识点：var / let / const 三者对比
 * ============================================================================
 *
 * 【所属分类】02_variables —— 变量与作用域
 * 【难度等级】进阶
 * 【前置知识】02_variables/01_var.js、02_variables/02_let.js、
 *             02_variables/03_const.js、02_variables/04_hoisting_and_tdz.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本章前面几节分别讲了三种声明方式，这一节把它们放在一起做横向对比：
 *    同一段逻辑用 var / let / const 各写一遍，直接观察行为差异。
 *    对比的维度有九个：作用域、提升、TDZ、重复声明、重新赋值、初始化要求、
 *    顶层是否挂到全局对象、循环中的绑定、是否可删除。
 *
 * 2. 为什么需要 / 解决什么问题
 *    单独记"var 是函数作用域"很容易，但真正写代码时需要在三种选择里做决定。
 *    把差异集中到一张表 + 一组可运行实验里，才能形成"看到场景就知道该用哪个"的条件反射。
 *    同时，这些差异也是面试与实际代码评审中的高频考点。
 *
 * 3. 核心语法要点 —— 九维对比
 *    ┌──────────────┬────────────────┬──────────────────┬────────────────────┐
 *    │ 对比维度      │ var            │ let              │ const              │
 *    ├──────────────┼────────────────┼──────────────────┼────────────────────┤
 *    │ 作用域        │ 函数作用域      │ 块级作用域        │ 块级作用域          │
 *    │ 变量提升      │ 是，值为 undefined│ 是，但不初始化   │ 是，但不初始化      │
 *    │ TDZ          │ 无             │ 有               │ 有                 │
 *    │ 重复声明      │ 允许，静默覆盖   │ SyntaxError      │ SyntaxError        │
 *    │ 重新赋值      │ 允许           │ 允许             │ TypeError          │
 *    │ 必须初始化    │ 否             │ 否               │ 是                 │
 *    │ 顶层挂到全局对象│ 是（普通脚本中）│ 否               │ 否                 │
 *    │ 循环中绑定    │ 每轮共享同一个   │ 每轮新建         │ 每轮新建（for...of）│
 *    │ 可被 delete   │ 否（不可配置）   │ 否               │ 否                 │
 *    └──────────────┴────────────────┴──────────────────┴────────────────────┘
 *
 * 4. 常见陷阱与注意事项
 *    - "提升"这一行三者的差异最容易被记错：三者**都**提升，
 *      区别只在"提升后是否已完成初始化"。var 提升后是 undefined（可读），
 *      let/const 提升后是未初始化（读了就抛错，这就是 TDZ）。
 *    - const 的"不可变"只针对绑定，对象内容依然可变（见 03_const.js）。
 *    - "顶层挂到全局对象"这一行只在**浏览器普通 <script>** 里成立；
 *      在 ESM 模块里，var 也不会挂到 globalThis（见 06_global_variables.js）。
 *    - 三者在"不可删除"上是一致的：`delete 变量名` 在严格模式下都是 SyntaxError。
 *    - 本文件用 new Function 让同一段逻辑分别在"var / let / const 版本"下运行，
 *      并统一捕获异常，保证文件本身可以正常退出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 02_variables/05_var_let_const_compare.js
 *
 * 【预期输出】
 *   先输出九维对比表，再输出五组"同一逻辑、三种声明"的实测结果对照，
 *   最后给出选择建议。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 工具函数：让同一段代码在三种声明方式下分别运行
// ---------------------------------------------------------------------------

/**
 * 把代码模板里的 `{KW}` 占位符替换成指定的声明关键字后运行，并捕获异常。
 *
 * @param {string} keyword 'var' | 'let' | 'const'
 * @param {string} template 含 `{KW}` 占位符的代码模板（函数体文本）
 * @returns {string} 人类可读的运行结果
 */
function runWith(keyword, template) {
  const code = template.replaceAll('{KW}', keyword);
  try {
    const fn = new Function(code);
    return '正常返回 → ' + String(fn());
  } catch (err) {
    return '抛错 → ' + err.constructor.name + '：' + err.message;
  }
}

/** 同一段逻辑跑三遍，并排打印结果 */
function compareKeyword(title, template, results) {
  console.log('\n【' + title + '】');
  for (const keyword of ['var', 'let', 'const']) {
    const result = runWith(keyword, template);
    results.push({ 场景: title, 声明: keyword, 结果: result });
    console.log('  ' + keyword.padEnd(5) + ' | ' + result);
  }
}

// ---------------------------------------------------------------------------
// 1. 九维对比表
// ---------------------------------------------------------------------------

console.log('--- 1. var / let / const 九维对比表 ---');

const comparisonRows = [
  { 对比维度: '作用域', var: '函数作用域', let: '块级作用域', const: '块级作用域' },
  { 对比维度: '变量提升', var: '提升，值为 undefined', let: '提升，但未初始化', const: '提升，但未初始化' },
  { 对比维度: 'TDZ 暂时性死区', var: '无', let: '有', const: '有' },
  { 对比维度: '重复声明', var: '允许（静默覆盖）', let: 'SyntaxError', const: 'SyntaxError' },
  { 对比维度: '重新赋值', var: '允许', let: '允许', const: 'TypeError' },
  { 对比维度: '必须初始化', var: '否', let: '否', const: '是' },
  { 对比维度: '顶层挂到全局对象', var: '是（浏览器普通脚本）', let: '否', const: '否' },
  { 对比维度: '循环中的绑定', var: '每轮共享同一个', let: '每轮新建', const: '每轮新建' },
  { 对比维度: '可被 delete', var: '否', let: '否', const: '否' },
];
console.table(comparisonRows);

// ---------------------------------------------------------------------------
// 2. 实验一：块级作用域
// ---------------------------------------------------------------------------

console.log('--- 2. 实验一：块级作用域 ---');

const experimentResults = [];

compareKeyword(
  '在块内声明后，到块外访问',
  `
  {
    {KW} insideBlock = '值';
  }
  // 出了花括号再探测这个变量：var 版还在（函数作用域），let/const 版已经不存在
  return '块外 typeof insideBlock = ' + typeof insideBlock;
`,
  experimentResults,
);
console.log('  说明：var 版泄漏到了函数作用域，typeof 得到 string；');
console.log('        let/const 版出了块就彻底不存在了，所以 typeof 得到 undefined。');
console.log('        这里 typeof 安全返回是因为"出了块"已经等同于"从未声明过"（不是 TDZ）。');

// ---------------------------------------------------------------------------
// 3. 实验二：声明前访问（提升 vs TDZ）
// ---------------------------------------------------------------------------

console.log('\n--- 3. 实验二：声明前访问 ---');

compareKeyword(
  '在声明语句之前读取变量',
  `
  // 先在一个 IIFE 里读取 value（此时还没执行到下面的声明语句）
  const before = (function () {
    return '读到的值 = ' + String(value);
  })();
  {KW} value = '真正的值';
  return before;
`,
  experimentResults,
);
console.log('  说明：var 版读到 undefined（提升），let/const 版抛 ReferenceError（TDZ）。');
console.log('        注意 var 版和 let/const 版在这个实验里的结果差异，正是"提升"的全部含义。');

// ---------------------------------------------------------------------------
// 4. 实验三：重复声明
// ---------------------------------------------------------------------------

console.log('\n--- 4. 实验三：同一作用域重复声明 ---');

compareKeyword(
  '同一作用域声明两次同名变量',
  `
  {KW} dup = 1;
  {KW} dup = 2;
  return 'dup = ' + dup;
`,
  experimentResults,
);
console.log('  说明：var 版静默覆盖（结果 2）；let/const 版是解析期 SyntaxError。');

// ---------------------------------------------------------------------------
// 5. 实验四：重新赋值
// ---------------------------------------------------------------------------

console.log('\n--- 5. 实验四：重新赋值 ---');

compareKeyword(
  '声明后再次赋值',
  `
  {KW} target = '第一次';
  target = '第二次';
  return 'target = ' + target;
`,
  experimentResults,
);
console.log('  说明：var/let 可以重新赋值，const 抛 TypeError。');

// ---------------------------------------------------------------------------
// 6. 实验五：不初始化
// ---------------------------------------------------------------------------

console.log('\n--- 6. 实验五：声明时不初始化 ---');

compareKeyword(
  '只声明不赋值',
  `
  {KW} empty;
  return '声明成功，值为 ' + String(empty);
`,
  experimentResults,
);
console.log('  说明：var/let 允许先声明后赋值（初始为 undefined），const 必须当场初始化。');

// ---------------------------------------------------------------------------
// 7. 实验六：循环里的闭包（最实用的差异）
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实验六：循环中创建闭包 ---');

compareKeyword(
  'for 循环里创建三个闭包，再看它们读到的值',
  `
  const handlers = [];
  for ({KW} i = 0; i < 3; i++) {
    handlers.push(function () { return i; });
  }
  try {
    return JSON.stringify(handlers.map(function (fn) { return fn(); }));
  } catch (err) {
    return '调用闭包时抛错：' + err.constructor.name;
  }
`,
  experimentResults,
);
console.log('  说明：var 版三个闭包共享同一个 i，全部返回 3；let/const 版每轮新建绑定，返回 0,1,2。');
console.log('        注意：const 版能通过解析（因为 for 的初始化部分用 const 是允许的），');
console.log('        但循环变量无法自增，所以实际运行时会在 i++ 处抛 TypeError ——');
console.log('        这正是"三段式 for 的循环变量必须用 let"的原因。');

// 补充：for...of 场景下三种声明都能跑（每轮都是新绑定，不需要自增）
console.log('\n  for...of 场景（每轮新建绑定，不需要自增）：');
const forOfResults = [];
for (const keyword of ['var', 'let', 'const']) {
  const code = `
    const handlers = [];
    for (${keyword} item of ['a', 'b', 'c']) {
      handlers.push(function () { return item; });
    }
    return JSON.stringify(handlers.map(function (fn) { return fn(); }));
  `;
  try {
    forOfResults.push({ 声明: keyword, 结果: new Function(code)() });
  } catch (err) {
    forOfResults.push({ 声明: keyword, 结果: err.constructor.name + '：' + err.message });
  }
}
console.table(forOfResults);
console.log('  结果解读：只有 let / const 版拿到了 0,1,2 对应的值；');
console.log('            var 版依然是 ["c","c","c"] —— 说明 for...of 里 var 也只有一个共享绑定。');
console.log('    规范依据：for...of / for...in 只在声明是"词法的"（let/const）时，');
console.log('              才会在每轮迭代调用 CreatePerIterationEnvironment 创建新绑定；');
console.log('              var 声明属于函数/模块级，不会每轮新建。');

// ---------------------------------------------------------------------------
// 8. 汇总所有实验结果
// ---------------------------------------------------------------------------

console.log('\n--- 8. 实验汇总表 ---');
console.table(experimentResults);

// ---------------------------------------------------------------------------
// 9. 选择建议
// ---------------------------------------------------------------------------

console.log('--- 9. 该怎么选 ---');

const rules = [
  ['默认', 'const', '绝大多数变量从生到死只赋值一次，用 const 表达"不会改"。'],
  ['需要重新赋值', 'let', '计数器、累加器、循环变量、需要重新指向别的对象时。'],
  ['循环变量', 'let / const', '三段式 for 用 let；for...of / for...in 用 const。'],
  ['绝不使用', 'var', '除非维护遗留代码，否则没有任何理由再用 var。'],
  ['想要真正不可变', 'const + Object.freeze', 'const 只锁绑定；深冻结需要递归（见 03_const.js）。'],
];
console.table(
  rules.map(([场景, 选择, 理由]) => ({ 场景, 推荐选择: 选择, 理由 })),
);

console.log('\n--- 10. 小结 ---');
console.log('· 三者的核心差异只有两条主线：作用域范围（函数 vs 块）与初始化时机（有无 TDZ）。');
console.log('· var：函数作用域、提升为 undefined、可重复声明、可重新赋值。');
console.log('· let：块级作用域、TDZ、不可重复声明、可重新赋值。');
console.log('· const：在 let 的基础上再加"必须初始化 + 不可重新赋值（但内容可变）"。');
console.log('· 实用口诀：默认 const，要改用 let，永远别用 var。');
