/**
 * ============================================================================
 * 知识点：JSON.parse 的 reviver 第三参数 context.source —— 原始文本的最后一根稻草
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 的解析与序列化
 * 【难度等级】高级
 * 【前置知识】21_json/03_replacer_and_reviver.js、21_json/09_raw_json_and_big_numbers.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JSON.parse(text, reviver) 里的 reviver 现在可以接收**第三个参数** context
 *    （ES2025，Node 22+ 起提供）：
 *      JSON.parse(text, function reviver(key, value, context) { ... });
 *    其中 context 是一个对象，只有一个属性 `source`，值是**该节点在原始 JSON 文本里
 *    的那段原文**。也就是说：
 *      JSON.parse('{"n": 1.50}', (k, v, ctx) => { ctx.source; // "1.50" }))
 *    注意 value 是数字 1.5，而 source 是字符串 "1.50" —— 原文被完整保留下来了。
 *
 * 2. 为什么需要（真实项目场景）
 *    这是"大整数精度"这个老问题的**解析侧**答案。看这条链：
 *      · 原始 JSON 文本里写着 1234567890123456789（int64，后端的真实值）；
 *      · reviver 被调用时，value 已经是 Number 了 —— 也就是 1234567890123456800；
 *      · 这意味着**在 reviver 里，原文已经永久丢失**，用 String(value) 也救不回来。
 *    过去唯一的办法是"先正则给长整数加引号，再 JSON.parse"（脆弱），
 *    或者换用第三方库（体积大）。context.source 把"原文"直接递到了 reviver 手里，
 *    让"把大整数按字符串保真"第一次成为语言内建的、可靠的能力。
 *    序列化侧的对称工具是 JSON.rawJSON，见 21_json/09_raw_json_and_big_numbers.js。
 *
 * 3. 核心语法要点
 *    (1) reviver 的完整签名：(key, value, context) —— context 是**第三个**位置参数。
 *    (2) context 只有 `source` 一个自有属性；每次调用传入的是**新的对象**
 *        （不要依赖它的身份，只读它的属性）。
 *    (3) 只有**基本类型**（字符串、数字、布尔、null）才有 source；
 *        对象与数组的 context.source 是 **undefined**，
 *        因为它们的子节点可能已经被 reviver 改过了，"原文"不再可信。
 *    (4) 根节点（key === ''）的 context.source 同样是 undefined。
 *    (5) reviver 的 `this` 仍然是持有该属性的容器对象（老行为不变）。
 *    (6) 返回值决定最终结果：返回 undefined 会删除该属性，返回其它值则替换。
 *
 * 4. 常见陷阱
 *    (1) **参数位置**：老环境里 reviver 只被传 (key, value) 两个参数。
 *        如果你写 `function reviver(key, value, context)` 而不做检测，
 *        在老运行时上 context 会是 undefined，一不小心就 `undefined.source` 报错。
 *    (2) 以为 context.source 对对象也有效 —— 无效，它是 undefined。
 *    (3) 以为 source 里保留了空白 —— 不会，它是**紧凑**的那段原文（不含前后空白）。
 *    (4) 直接 `JSON.parse(JSON.stringify(x))` 式的"无损往返"仍不成立：
 *        要真正无损，reviver 里得把 source 变成 BigInt 或字符串。
 *    (5) 把 source 当成"可信数据"直接拼进 SQL / HTML —— 它来自输入文本，同样是不可信输入。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/10_parse_source_context.js
 *
 * 【预期输出】
 *   先实证"reviver 里救不回大整数"，再演示 context.source 的用法、参数兼容检测、
 *   两个完整示例（转 BigInt / 转字符串）与无损往返，最后给出不支持时的降级方案。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 特性检测：context.source 是 ES2025 的能力，必须探测
// ---------------------------------------------------------------------------

console.log('--- 0. 特性检测 ---');

/**
 * 探测当前运行时是否会给 reviver 传第三个参数 context。
 * 做法：故意用一个三参数的 reviver 解析一小段 JSON，看能不能拿到 source。
 * @returns {boolean} 是否支持
 */
function detectReviverContext() {
  let supported = false;
  try {
    JSON.parse('{"probe": 1}', function reviver(key, value, context) {
      if (key === 'probe' && context !== null && typeof context === 'object' && typeof context.source === 'string') {
        supported = true;
      }
      return value;
    });
  } catch (err) {
    supported = false;
  }
  return supported;
}

const HAS_REVIVER_CONTEXT = detectReviverContext();
console.log('本机是否支持 reviver 的 context 参数：', HAS_REVIVER_CONTEXT);
console.log('（Node 22+ 可用；老环境里 reviver 只会收到 (key, value) 两个参数。）');

// ---------------------------------------------------------------------------
// 1. 回顾：reviver 拿到的 value 已经是"解析后的值"
// ---------------------------------------------------------------------------

console.log('\n--- 1. 回顾：reviver 收到的 value 是什么 ---');
const demoText = '{"count": 3, "price": 1.50, "expo": 1e3, "big": 1234567890123456789}';
console.log('原始文本 =', demoText);
JSON.parse(demoText, function reviver(key, value, context) {
  if (key === '') return value; // 根节点，跳过
  const hasSource = context !== null && typeof context === 'object' && typeof context.source === 'string';
  console.log(
    `  key=${JSON.stringify(key).padEnd(9)} value=${String(value).padEnd(22)}`,
    hasSource ? `原文="${context.source}"` : '原文=（不可用）',
  );
  return value;
});
console.log('👆 对比 price 那一行：JS 里是 1.5，原文是 1.50 —— 数字的"写法"在解析后就没了。');
console.log('   再看 big 那一行：原文 1234567890123456789，value 已经是 1234567890123456800。');

// ---------------------------------------------------------------------------
// 2. 实证：只用 (key, value) 的 reviver 根本救不回大整数
// ---------------------------------------------------------------------------

console.log('\n--- 2. 实证：传统的两参数 reviver 为什么救不回大整数 ---');
const bigText = '{"id": 1234567890123456789}';

// ❌ 错误写法：想靠 String(value) 还原原文 —— 太晚了，value 早就被舍入过了。
JSON.parse(bigText, function reviverBad(key, value) {
  if (key === 'id' && typeof value === 'number') {
    console.log('  ❌ String(value) 得到 =', String(value), '（不是原文！末尾已经变成 800）');
    console.log('     原文其实是         = 1234567890123456789');
  }
  return value;
});
console.log('  结论：reviver 在"值已经解析完成"之后才被调用，此时原文信息**已经不存在了**。');
console.log('  这正是 context.source 被设计出来的唯一原因。');

// ---------------------------------------------------------------------------
// 3. 正确用法：用 context.source 拿到原文
// ---------------------------------------------------------------------------

console.log('\n--- 3. 用 context.source 拿回原文 ---');
if (HAS_REVIVER_CONTEXT) {
  JSON.parse(bigText, function reviverGood(key, value, context) {
    if (key === 'id') {
      console.log('  ✅ value（已被舍入）  =', value);
      console.log('  ✅ context.source（原文）=', context.source);
      console.log('     两者相等吗？', String(value) === context.source, '（不相等，这就是丢精度的证据）');
    }
    return value;
  });
} else {
  console.log('  ⚠️ 本运行时没有 context.source，无法演示；请看第 8 节的降级方案。');
}

// ---------------------------------------------------------------------------
// 4. 参数兼容检测：让同一段代码在新老环境都不报错
// ---------------------------------------------------------------------------

console.log('\n--- 4. 参数兼容检测：新老环境都能安全运行 ---');
console.log('老环境：reviver 只会被传 2 个参数 -> 第三个形参是 undefined；');
console.log('新环境：永远传 3 个参数（用 arguments.length 也能看出来）。');
console.log('所以两种写法都行，但**必须先判断再用**：');

/**
 * 从 reviver 的参数里安全地取出 source。
 * 这是本文件的核心工具函数：无论运行时支不支持 context，都不会抛错。
 * @param {object} context reviver 的第三个参数，老环境下是 undefined
 * @returns {string|undefined} 原文；不可用时返回 undefined
 */
function sourceOf(context) {
  // 写法一（推荐）：typeof 判断，最直观，也顺带挡住了 null
  if (context !== null && typeof context === 'object' && typeof context.source === 'string') {
    return context.source;
  }
  return undefined;
}

/**
 * 另一种等价的检测方式：看实参个数。
 * 注意：必须用 function 声明（箭头函数没有自己的 arguments）。
 * @returns {boolean} 本次调用是否带了 context
 */
function hasContextByArity() {
  return arguments.length >= 3 && arguments[2] !== null && typeof arguments[2] === 'object';
}

// 用同一个 reviver 分别演示两种检测
JSON.parse('{"a": 1.50, "arr": [1], "obj": {"x": 1}}', function reviver(key, value, context) {
  if (key === '') return value;
  const src = sourceOf(context);
  console.log(
    `  key=${JSON.stringify(key).padEnd(7)}`,
    `arity>=3: ${String(hasContextByArity(key, value, context)).padEnd(5)}`,
    `sourceOf(): ${src === undefined ? 'undefined' : JSON.stringify(src)}`,
  );
  return value;
});
console.log('👆 注意 arr / obj 这两行：它们是**对象和数组**，source 也是 undefined。');
console.log('   只有基本类型（数字/字符串/布尔/null）才配有原文 —— 因为对象的子节点');
console.log('   可能已经被 reviver 改过，"原文"与"解析结果"不再一一对应。');

// ---------------------------------------------------------------------------
// 5. 完整示例一：把超过安全范围的整数保真成 BigInt
// ---------------------------------------------------------------------------

console.log('\n--- 5. 完整示例一：bigint-safe 解析（返回 BigInt） ---');

/**
 * 解析 JSON，并把"原文是整数、但超出安全整数范围"的数字还原成 BigInt。
 * 不支持 context 的运行时会原样返回 Number（并在调用方可见地暴露精度问题）。
 * @param {string} text JSON 文本
 * @returns {unknown} 解析结果
 */
function parseJsonWithBigInt(text) {
  return JSON.parse(text, function reviver(key, value, context) {
    // 老环境：context 是 undefined，sourceOf 返回 undefined，直接走默认行为。
    const source = sourceOf(context);
    if (source === undefined) return value;
    // 只处理"看起来就是整数"的原文；1.5 / 1e3 / "123" 这些都不碰。
    if (typeof value === 'number' && /^-?\d+$/.test(source) && !Number.isSafeInteger(value)) {
      return BigInt(source); // 用**原文**构造 BigInt，一个比特都不丢
    }
    return value;
  });
}

const orderText = '{"id": 1234567890123456789, "qty": 2, "price": 19.99, "note": "含 1234567890123456789 字样的字符串"}';
console.log('原始文本 =', orderText);
const order = parseJsonWithBigInt(orderText);
console.log('解析结果：');
console.log('  id    =', order.id, '| typeof =', typeof order.id, '（BigInt，精确）');
console.log('  qty   =', order.qty, '| typeof =', typeof order.qty, '（在安全范围内，保持 Number）');
console.log('  price =', order.price, '| typeof =', typeof order.price, '（小数不碰）');
console.log('  note  =', JSON.stringify(order.note));
console.log('  👆 注意 note 里的那串数字**没有**被误伤 —— 因为它在字符串里，');
console.log('     而 source 对字符串节点是带引号的原文，正则 /^-?\\d+$/ 自然不匹配。');
console.log('  小数为什么不用管？因为小数本来就不精确，原文的 19.99 与 double 的含义一致。');

// ---------------------------------------------------------------------------
// 6. 完整示例二：保真成字符串（更常用的做法）
// ---------------------------------------------------------------------------

console.log('\n--- 6. 完整示例二：bigint-safe 解析（返回字符串，推荐） ---');

/**
 * 解析 JSON，并把超出安全范围的大整数保留为**字符串**。
 * 比起返回 BigInt，这个版本更实用：字符串可以直接塞进表单、放进 URL、再发回去。
 * @param {string} text JSON 文本
 * @returns {unknown} 解析结果
 */
function parseJsonKeepBigAsString(text) {
  return JSON.parse(text, function reviver(key, value, context) {
    const source = sourceOf(context);
    if (source === undefined) return value;
    // 判定条件比 BigInt 版更宽：只要位数够多就转字符串，避免"刚好卡在安全边界上"的争论
    if (typeof value === 'number' && /^-?\d+$/.test(source) && source.replace('-', '').length >= 16) {
      return source; // 直接用原文当字符串，比 String(value) 可靠
    }
    return value;
  });
}

const parsedAsString = parseJsonKeepBigAsString(orderText);
console.log('  id    =', JSON.stringify(parsedAsString.id), '| typeof =', typeof parsedAsString.id);
console.log('  qty   =', parsedAsString.qty, '| typeof =', typeof parsedAsString.qty, '（不足 16 位，保持 Number）');
console.log('  ✅ 这个 id 可以直接放回请求体，不会再被舍入：');
console.log('     JSON.stringify({ id: parsedAsString.id }) =', JSON.stringify({ id: parsedAsString.id }));
console.log('  ⚠️ 代价：线格式从 number 变成了 string，后端与所有消费方都要知情（契约变更）。');

// ---------------------------------------------------------------------------
// 7. 完整示例三：配合 JSON.rawJSON 做到"完全无损往返"
// ---------------------------------------------------------------------------

console.log('\n--- 7. 完整示例三：与 JSON.rawJSON 配合，实现无损往返 ---');
const HAS_RAW_JSON = typeof JSON.rawJSON === 'function';

if (HAS_RAW_JSON && HAS_REVIVER_CONTEXT) {
  /**
   * 无损解析：把"超出安全范围的整数"变成 JSON.rawJSON 包装。
   * 好处是**再次 stringify 时仍是裸数字**，线格式完全不变。
   * 代价是它是标记对象，不能直接参与算术 —— 适合"透传"场景。
   * @param {string} text JSON 文本
   * @returns {unknown} 解析结果
   */
  function parseLossless(text) {
    return JSON.parse(text, function reviver(key, value, context) {
      const source = sourceOf(context);
      if (source === undefined) return value;
      if (typeof value === 'number' && /^-?\d+$/.test(source) && !Number.isSafeInteger(value)) {
        return JSON.rawJSON(source);
      }
      return value;
    });
  }

  const lossless = parseLossless(bigText);
  console.log('  解析结果 id 是 rawJSON 吗？', JSON.isRawJSON(lossless.id));
  console.log('  再序列化出去 =', JSON.stringify(lossless), '（和原文一模一样，裸数字）');
  console.log('  ✅ 这就是"前端只是透传、不参与计算"场景下的最优解：');
  console.log('     进出的 JSON 文本完全一致，后端契约一个字都不用改。');
  console.log('  ⚠️ 注意 rawJSON 不能做算术、也不能 structuredClone，它不是普通数字。');
} else {
  console.log('  ⚠️ 本运行时缺少 JSON.rawJSON 或 context.source，跳过无损往返演示。');
  console.log('     JSON.rawJSON 的用法与边界见 21_json/09_raw_json_and_big_numbers.js。');
}

// ---------------------------------------------------------------------------
// 8. 降级方案：不支持 context 时怎么办
// ---------------------------------------------------------------------------

console.log('\n--- 8. 降级方案：没有 context.source 时怎么保真 ---');
console.log('① 让后端把 int64 序列化成字符串（最省事，改一次契约，一劳永逸）；');
console.log('② 换第三方库（lossless-json、json-bigint），它们自带词法分析器；');
console.log('③ 自己先"扫描文本、给长整数加引号"，再 JSON.parse —— 也就是下面的做法。');

/**
 * 给 JSON 文本中"位于字符串之外、且位数足够多"的整数加上引号。
 * ⚠️ 这是一个**教学级的启发式实现**，它做的是一次最小的词法扫描：
 *    跟踪是否在字符串内部、处理转义、只在数字完整成词时替换。
 *    生产环境请优先选 ① 或 ②，因为它仍然有边界情况（如 12345678901234567890e5）。
 * @param {string} text JSON 文本
 * @param {number} minDigits 至少多少位的整数才加引号
 * @returns {string} 处理后的 JSON 文本
 */
function quoteLongIntegers(text, minDigits = 16) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    // (a) 在字符串内部：原样复制，遇到转义符就一起吃掉两个字符
    if (ch === '"') {
      out += ch;
      i += 1;
      while (i < text.length) {
        const c = text[i];
        out += c;
        i += 1;
        if (c === '\\') {
          out += text[i] ?? '';
          i += 1;
          continue;
        }
        if (c === '"') break;
      }
      continue;
    }
    // (b) 不在字符串内部：试着匹配一个以当前位置开头的整数
    const match = /^-?\d+/.exec(text.slice(i));
    if (match !== null && match[0].replace('-', '').length >= minDigits) {
      out += `"${match[0]}"`; // 加引号，parse 出来就是字符串
      i += match[0].length;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

const quoted = quoteLongIntegers(orderText);
console.log('  处理后文本 =', quoted);
const degraded = JSON.parse(quoted);
console.log('  id   =', JSON.stringify(degraded.id), '| typeof =', typeof degraded.id);
console.log('  note =', JSON.stringify(degraded.note), '（字符串内部没被误伤）');
console.log('  ⚠️ 第 ① 步就改了类型：后端必须能接受字符串形式的 int64，否则一样白搭。');

// ---------------------------------------------------------------------------
// 9. 检查清单
// ---------------------------------------------------------------------------

console.log('\n--- 9. 检查清单 ---');
const checklist = [
  ['reviver 想读原文？只有第三参数有', 'value 已经是解析后的值，救不回来'],
  ['必须先检测 context 是否存在', '老环境里第三个形参是 undefined'],
  ['source 只对基本类型有效', '对象/数组/根节点的 source 是 undefined'],
  ['source 是紧凑片段，不含空白', '别指望用它还原格式化后的原文'],
  ['优先考虑"字符串保真"而不是 BigInt', '字符串更好传、更好存、更好序列化'],
  ['只想透传就用 JSON.rawJSON', '线格式不变，但它是标记对象'],
  ['source 也属于不可信输入', '别直接拼进 SQL / HTML / eval'],
  ['两边都写测试', '后端改契约时，前端要有用例盯着'],
];
for (const [item, why] of checklist) {
  console.log(`  ${item.padEnd(34)} -> ${why}`);
}

console.log('\n本节结束。三句话总结：');
console.log('  1) reviver 的 value 是"解析结果"，原文在那一刻已经没了；');
console.log('  2) context.source 把原文交还给 reviver，这是 ES2025 才有的能力；');
console.log('  3) 只做透传可以用 JSON.rawJSON 无损往返，需要参与业务就转成字符串。');
