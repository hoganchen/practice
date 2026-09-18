/**
 * ============================================================================
 * 知识点：孤立代理项（lone surrogate）与 JSON 序列化
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 的解析与序列化
 * 【难度等级】高级
 * 【前置知识】11_strings/09_unicode_and_codepoints.js、21_json/04_serialization_edge_cases.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 的字符串是 UTF-16 编码的**码元序列**。U+10000 以上的字符（emoji、生僻汉字）
 *    要用一对码元表示：高位代理项（0xD800~0xDBFF）+ 低位代理项（0xDC00~0xDFFF）。
 *    如果一个高位代理项后面没有跟着低位代理项，或者低位代理项单独出现，
 *    这个码元就叫**孤立代理项（lone surrogate）**。
 *    JS 允许字符串里存在孤立代理项（"它就是两个码元，我不检查"），
 *    但**它们无法被编码成合法的 UTF-8** —— 这就是一切麻烦的源头。
 *
 * 2. JSON.stringify 的行为（本节的第一个反直觉点）
 *      JSON.stringify('\uD800')   // => "\ud800"（8 个字符：引号 + \ u d 8 0 0 + 引号）
 *    它不是原样输出，也不是抛错，而是**转义成 \udXXX**。这是规范要求：
 *    JSON 文本最终要编码成 UTF-8 字节流传出去，而孤立代理项编不出来，
 *    所以序列化时必须用转义写法把它"藏"进 ASCII 里。
 *    这带来一个很好的结果：**JSON 这条路上，孤立代理项是可以无损往返的**
 *    （JSON.parse(JSON.stringify(s)) === s 成立），因为 \ud800 是合法转义。
 *    反过来说，一旦你绕过 JSON.stringify 自己拼 JSON 字符串、
 *    或者直接把字符串做 UTF-8 编码，孤立代理项就会变成 U+FFFD（�）且**不可逆**。
 *
 * 3. 为什么需要（真实项目场景）
 *    (1) 按长度截断字符串：`title.slice(0, 20)` 可能正好把 emoji 的高低位切开，
 *        留下一个孤立代理项。此后长度、比较、正则全部开始"漂移"。
 *    (2) 数据库写不进去：PostgreSQL 的 UTF-8 列会直接报
 *        "invalid byte sequence for encoding UTF8"。
 *    (3) 前端把字符串发给后端时，某些 HTTP 客户端/网关会把 U+FFFD 落库，
 *        于是"用户昵称里的 emoji 变成了问号"这类 bug 就出现了。
 *    (4) 从二进制数据（Buffer / Uint8Array）解码文本时，
 *        截断在字符中间同样会产生孤立代理项或替换字符。
 *    所以"能识别、能检测、能修复"这三件事必须会。
 *
 * 4. 核心语法要点
 *    (1) 检测：`str.isWellFormed()`（ES2024）—— 没有任何孤立代理项时返回 true。
 *    (2) 修复：`str.toWellFormed()`（ES2024）—— 把孤立代理项替换成 U+FFFD，返回**新串**。
 *    (3) JSON 侧：`JSON.stringify` 会把孤立代理项转义成 `\udXXX`（ES2019 起），
 *        使得输出永远是合法 UTF-8；`JSON.parse` 又能把 `\udXXX` 还原成孤立代理项。
 *    (4) 编码侧：`Buffer.from(s, 'utf8')` / `TextEncoder` 会把孤立代理项换成 U+FFFD（EF BF BD）。
 *    (5) 对照：`encodeURIComponent('\uD800')` 直接抛 URIError —— 它更严格。
 *
 * 5. 常见陷阱
 *    (1) 以为 JSON.stringify 会原样输出孤立代理项 —— 不会，它会转义；
 *        于是"我在日志里看到 \ud800，以为是数据坏了"，其实只是转义显示。
 *    (2) 以为 JSON 往返能解决一切 —— 只在 JSON 这条路上成立；
 *        字符串一旦经过 UTF-8 字节（写文件、发二进制、存数据库原始字节），就回不来了。
 *    (3) 用 `str.length` 当"字符数"：`'😀'.length === 2`，按 length 切片必然有风险。
 *    (4) 用 `Array.from(s)` / 展开运算符切分是安全的（按码点），但
 *        `s.split('')` 是**不安全**的（按码元）。
 *    (5) 忘了做特性检测：isWellFormed/toWellFormed 是 ES2024，老环境没有。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/11_lone_surrogates.js
 *
 * 【预期输出】
 *   构造畸形字符串 -> 观察 stringify 的转义 -> 实证三种"往返不相等"的场景 ->
 *   用 isWellFormed / toWellFormed 检测与修复（含降级实现）-> 给出工程建议。
 *   关于"良构字符串"更完整的讨论见 11_strings/13_well_formed_unicode.js。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 特性检测
// ---------------------------------------------------------------------------

console.log('--- 0. 特性检测 ---');
const HAS_WELL_FORMED = typeof ''.isWellFormed === 'function' && typeof ''.toWellFormed === 'function';
console.log("typeof ''.isWellFormed  =", typeof ''.isWellFormed);
console.log("typeof ''.toWellFormed  =", typeof ''.toWellFormed);
console.log('=> 是否支持 isWellFormed / toWellFormed：', HAS_WELL_FORMED ? '支持' : '不支持（走降级实现）');
console.log('（ES2024 能力，Node 20+ / Chrome 111+ / Safari 16.4+ 可用。）');

// ---------------------------------------------------------------------------
// 1. 构造几种字符串：良构的、带孤立代理项的
// ---------------------------------------------------------------------------

console.log('\n--- 1. 认识代理项：良构 vs 孤立 ---');

/**
 * 把字符串渲染成"码元十六进制序列 + 转义形式"，方便肉眼观察。
 * 直接 console.log 孤立代理项会在终端上显示成乱码或空白，所以必须转义后再看。
 * @param {string} s 待观察的字符串
 * @returns {string} 形如 "[d83d dc00]  \"\\ud83d\\udc00\"" 的描述
 */
function inspect(s) {
  const units = [];
  for (let i = 0; i < s.length; i++) units.push(s.charCodeAt(i).toString(16).padStart(4, '0'));
  return `[${units.join(' ')}]  ${JSON.stringify(s)}`;
}

const emoji = '\u{1F600}'; // 😀 一个完整的代理对：d83d de00
const loneHigh = '\uD800'; // 孤立高位代理项
const loneLow = '\uDC00'; // 孤立低位代理项
const truncated = emoji.slice(0, 1); // 把 emoji 切成一半 —— 最常见的人为制造方式

console.log('完整的 emoji 😀   :', inspect(emoji), '| length =', emoji.length);
console.log('孤立高位代理项    :', inspect(loneHigh), '| length =', loneHigh.length);
console.log('孤立低位代理项    :', inspect(loneLow), '| length =', loneLow.length);
console.log('被切一半的 emoji  :', inspect(truncated), '| length =', truncated.length);
console.log('👆 注意 length 都是"码元个数"，不是"字符个数"：😀 的 length 是 2。');
console.log('   而 truncated 其实是 emoji 的高位代理项 —— 一个典型的孤立代理项。');

// ---------------------------------------------------------------------------
// 2. JSON.stringify 的转义行为（规范要求，不是 bug）
// ---------------------------------------------------------------------------

console.log('\n--- 2. JSON.stringify 会把孤立代理项转义 ---');
console.log('JSON.stringify("\\uD800")        =', JSON.stringify(loneHigh));
console.log('  原始长度 =', loneHigh.length, '| 序列化后长度 =', JSON.stringify(loneHigh).length);
console.log('  逐字符看：', [...JSON.stringify(loneHigh)].map((c) => c === '\\' ? '\\\\' : c).join(' '));
console.log('  👆 结果是 8 个字符：一个双引号 + 反斜杠 u d 8 0 0 + 一个双引号。');
console.log('     也就是说，孤立代理项被"降级"成了一段纯 ASCII 转义 —— 这是规范要求的。');
console.log('');
console.log('嵌在对象里也一样：', JSON.stringify({ nickname: '用户' + loneHigh + '名', ok: true }));
console.log('嵌在数组里也一样：', JSON.stringify([loneHigh, emoji]));
console.log('');
console.log('为什么必须这样做？因为 JSON 文本最终要变成 UTF-8 字节流：');
const rawBytes = Buffer.from(loneHigh, 'utf8');
console.log('  Buffer.from("\\uD800", "utf8") 的字节 =', rawBytes.toString('hex'), '（EF BF BD = U+FFFD 替换字符）');
console.log('  👆 只有 3 个字节，对应 U+FFFD —— 原始的那个代理项信息**彻底丢了**。');
console.log('  而 JSON.stringify 先把它变成 6 个 ASCII 字符，字节流里就不会出现非法序列。');

// ---------------------------------------------------------------------------
// 3. 实证：三种"往返不相等"的场景
// ---------------------------------------------------------------------------

console.log('\n--- 3. 实证：什么时候 JSON.parse(JSON.stringify(s)) !== s ---');
console.log('先澄清一个常见误解：**孤立代理项本身是能通过 JSON 往返的**。');
console.log('  因为 stringify 转义、parse 解转义，一来一回是精确对称的：');
console.log('  JSON.parse(JSON.stringify("\\uD800")) === "\\uD800"  ->', JSON.parse(JSON.stringify(loneHigh)) === loneHigh);
console.log('  JSON.parse(JSON.stringify(被切一半的 emoji)) === 原串 ->', JSON.parse(JSON.stringify(truncated)) === truncated);
console.log('  ✅ 这条路是安全的，这正是 ES2019 那次规范修订要保证的事情。');
console.log('');
console.log('真正的"不相等"出现在**绕开 JSON.stringify**或**经过 UTF-8 字节**的时候：');

// 场景 1：手写拼接 JSON 文本（没有经过 stringify 的转义），再走 UTF-8 字节
const handBuilt = '"' + loneHigh + '"'; // 手工拼一段 JSON，值就是那个孤立代理项
const handBytes = Buffer.from(handBuilt, 'utf8'); // 编码成 UTF-8 字节
const handBack = JSON.parse(handBytes.toString('utf8')); // 再解码并解析
console.log('');
console.log('  场景 1：手写拼接 + UTF-8 字节往返');
console.log('    原始字符串          :', inspect(loneHigh));
console.log('    手工拼出的 JSON 文本的字节 :', handBytes.toString('hex'), '（22 EF BF BD 22）');
console.log('    JSON.parse 回来     :', inspect(handBack));
console.log('    相等吗？             :', handBack === loneHigh, '  ❌ 不相等 —— 变成了 U+FFFD');
console.log('    👆 这就是"自己拼 JSON"最危险的地方：跳过了转义这层保护。');

// 场景 2：直接对字符串做 UTF-8 编码（写文件、发二进制、存 BLOB）
const encoded = Buffer.from(loneHigh, 'utf8');
const decoded = encoded.toString('utf8');
console.log('');
console.log('  场景 2：字符串直接做 UTF-8 编码（不经 JSON）');
console.log('    原始        :', inspect(loneHigh));
console.log('    编码后解码   :', inspect(decoded));
console.log('    相等吗？     :', decoded === loneHigh, '  ❌ 不相等');
console.log('    👆 这就是"写进数据库报 invalid byte sequence"的根因。');

// 场景 3：按 length 切分导致代理对被劈开
const pair = 'A' + emoji + 'B';
const naiveCut = pair.slice(0, 2); // 想取"A + 一个字符"，结果切出了 A + 高位代理项
const safeCut = Array.from(pair).slice(0, 2).join(''); // 按码点切，安全
console.log('');
console.log('  场景 3：按 length 切字符串');
console.log('    原串        :', inspect(pair), '| length =', pair.length);
console.log('    pair.slice(0, 2)          :', inspect(naiveCut), '❌ 切出了孤立代理项');
console.log('    Array.from(pair).slice(0,2):', inspect(safeCut), '✅ 按码点切，保住了 emoji');
console.log('    👆 用 length / slice 处理含 emoji 的文本，是孤立代理项最大的制造机。');

// 场景 4：其他编码 API 的对照
console.log('');
console.log('  场景 4：其他 API 对孤立代理项的态度');
try {
  encodeURIComponent(loneHigh);
} catch (err) {
  console.log('    encodeURIComponent("\\uD800") ->', `${err.constructor.name}: ${err.message}`, '（最严格，直接抛）');
}
const textEncoderOut = new TextEncoder().encode(loneHigh);
console.log('    new TextEncoder().encode("\\uD800") ->', [...textEncoderOut].map((b) => b.toString(16)).join(' '), '（和 Buffer 一样变 U+FFFD）');
console.log('    JSON.stringify                          ->', JSON.stringify(loneHigh), '（唯一能无损带走的写法）');

// ---------------------------------------------------------------------------
// 4. 检测与修复：isWellFormed / toWellFormed
// ---------------------------------------------------------------------------

console.log('\n--- 4. 检测与修复：isWellFormed / toWellFormed ---');

/**
 * 降级实现：检测字符串是否良构（不含孤立代理项）。
 * 逻辑与规范一致：高位代理项后面必须紧跟低位代理项；低位代理项不能单独出现。
 * @param {string} str 待检测的字符串
 * @returns {boolean} 良构返回 true
 */
function isWellFormedFallback(str) {
  for (let i = 0; i < str.length; i++) {
    const unit = str.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = str.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false; // 高位后面不是低位 -> 孤立
      i += 1; // 配对的低位代理项跳过
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return false; // 低位代理项单独出现 -> 孤立
    }
  }
  return true;
}

/**
 * 降级实现：把孤立代理项替换成 U+FFFD，返回新字符串。
 * @param {string} str 待修复的字符串
 * @returns {string} 良构的新字符串
 */
function toWellFormedFallback(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const unit = str.charCodeAt(i);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += str[i] + str[i + 1];
        i += 1;
      } else {
        out += '�';
      }
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      out += '�';
    } else {
      out += str[i];
    }
  }
  return out;
}

// 统一入口：优先用原生方法，没有就用降级实现
const isWellFormed = HAS_WELL_FORMED ? (s) => s.isWellFormed() : isWellFormedFallback;
const toWellFormed = HAS_WELL_FORMED ? (s) => s.toWellFormed() : toWellFormedFallback;

const samples = [
  ['普通文本', '你好，世界'],
  ['完整 emoji', emoji],
  ['普通文本 + 完整 emoji', 'A' + emoji + 'B'],
  ['孤立高位代理项', loneHigh],
  ['孤立低位代理项', loneLow],
  ['被切一半的 emoji', truncated],
  ['两个孤立代理项拼在一起', loneHigh + loneLow],
];

console.log('  字符串                    length   良构？  修复后（已转义显示）');
for (const [label, value] of samples) {
  const fixed = toWellFormed(value);
  console.log(
    `  ${label.padEnd(24)} ${String(value.length).padEnd(8)} ${String(isWellFormed(value)).padEnd(7)} ${JSON.stringify(fixed)}`,
  );
}
console.log('  👆 注意最后一行：孤立的高位 + 孤立的低位拼在一起，恰好构成了一个合法代理对，');
console.log('     所以它其实是良构的 —— 判断标准是"配对"，不是"来源"。');
console.log('  👆 另外注意 toWellFormed 返回的是**新字符串**，原字符串不会被修改（字符串不可变）。');

// ---------------------------------------------------------------------------
// 5. 真实工作流：检测 -> 修复 -> 落库/发送
// ---------------------------------------------------------------------------

console.log('\n--- 5. 真实工作流：把不可信的文本洗成可安全存储的文本 ---');

/**
 * 把用户输入洗成"可以安全写进 UTF-8 存储 / 安全放进 URL / 安全 JSON 化"的字符串。
 * @param {string} input 原始输入
 * @returns {{ text: string, repaired: boolean, changed: boolean }} 处理结果
 */
function sanitizeForStorage(input) {
  const text = typeof input === 'string' ? input : String(input);
  const wasWellFormed = isWellFormed(text);
  const safe = wasWellFormed ? text : toWellFormed(text);
  return { text: safe, repaired: !wasWellFormed, changed: safe !== text };
}

const userInputs = [
  '可爱的猫' + emoji,
  '可爱的猫' + emoji.slice(0, 1), // 上游截断留下的残骸
  '正常文本',
];
for (const input of userInputs) {
  const result = sanitizeForStorage(input);
  console.log('  输入 :', inspect(input));
  console.log('  输出 :', inspect(result.text), '| 触发修复 =', result.repaired, '| 内容有变化 =', result.changed);
}
console.log('');
console.log('  ⚠️ 关键提醒：上面的"修复"做的是"把孤立代理项换成 U+FFFD"。');
console.log('     而 Buffer.from / TextEncoder 在你**没有检测**的时候也在做同一件事 ——');
console.log('     区别只在于：一个是你知情、显式的；另一个是静默发生在编码那一瞬间的。');
console.log('     对比一下"直接编码"与"先检测再编码"：');
for (const input of userInputs) {
  const silent = Buffer.from(input, 'utf8'); // 静默替换
  const checked = Buffer.from(sanitizeForStorage(input).text, 'utf8'); // 显式替换
  console.log(`    ${inspect(input).padEnd(34)} -> 直接编码 ${silent.toString('hex')} / 检测后 ${checked.toString('hex')}`);
}
console.log('  👆 两种字节**完全一样** —— 说明不论你检测与否，孤立代理项都进不了 UTF-8。');
console.log('     检测的真正价值不是"能存进去"，而是让你**在那一刻有机会做选择**：');
console.log('     是抛错拒绝、记一条告警、还是静默替换。不检测，你就只能被动接受替换。');

/**
 * 严格模式：遇到孤立代理项直接抛错（"快速失败"策略）。
 * 适合"这条数据必须精确"的场景，例如加密前的明文、需要与后端逐字节核对的内容。
 * @param {string} input 原始输入
 * @returns {string} 良构的字符串
 * @throws {TypeError} 输入含孤立代理项时抛出
 */
function requireWellFormed(input) {
  const text = typeof input === 'string' ? input : String(input);
  if (!isWellFormed(text)) {
    throw new TypeError('输入包含孤立代理项，拒绝写入');
  }
  return text;
}

console.log('');
console.log('  严格模式演示（宁可报错，也不静默改数据）：');
for (const input of userInputs) {
  try {
    requireWellFormed(input);
    console.log('    ✅ 通过：', inspect(input));
  } catch (err) {
    console.log('    💥 拒绝：', inspect(input), '->', `${err.constructor.name}: ${err.message}`);
  }
}
console.log('  👆 两种策略没有绝对优劣：面向用户的内容用"替换"更友好（别让一个 emoji 毁掉整次提交），');
console.log('     涉及对账、加密、主键的内容用"拒绝"更安全。重点是**由你来选**，不是让运行时替你选。');

// ---------------------------------------------------------------------------
// 6. 工程建议
// ---------------------------------------------------------------------------

console.log('\n--- 6. 工程建议 ---');
const advice = [
  ['永远用 JSON.stringify，别手拼 JSON', '手拼会跳过转义，孤立代理项直接变 U+FFFD'],
  ['别用 length / slice 切用户文本', '按码点切：Array.from(s) 或 [...s]'],
  ['入库前统一过一遍 toWellFormed', '在边界处修一次，比到处补漏省事'],
  ['日志里打印转义形式', 'JSON.stringify(s) 或逐码元打十六进制'],
  ['正则用 u 标志', '/^.$/u 才按码点匹配，不带 u 会按码元'],
  ['警惕"二进制转文本"的截断', 'Buffer 切片要在字符边界上，否则必然产生替换字符'],
  ['前后端约定 Unicode 处理策略', '是报错、还是静默替换，双方必须一致'],
  ['写测试用例', '把 emoji、"\\uD800"、被切一半的 emoji 都放进测试数据'],
];
for (const [item, why] of advice) {
  console.log(`  ${item.padEnd(30)} -> ${why}`);
}

console.log('\n--- 7. 小结 ---');
console.log('  1) 孤立代理项是"两个码元但配不成对"，JS 允许存在，UTF-8 编不出来；');
console.log('  2) JSON.stringify 会把它们转义成 \\udXXX（ES2019 起），所以 JSON 这条路是无损的；');
console.log('  3) JSON.parse(JSON.stringify(s)) !== s 真正发生的地方，是"手拼 JSON"和"经过 UTF-8 字节"；');
console.log('  4) 用 isWellFormed() 检测、toWellFormed() 修复（老环境用本文件的降级实现）；');
console.log('  5) 关于良构字符串更系统的讨论，见 11_strings/13_well_formed_unicode.js。');
