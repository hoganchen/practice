/**
 * ============================================================================
 * 知识点：标签模板 —— 自定义标签函数、String.raw、HTML 转义与 i18n
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】高级
 * 【前置知识】11_strings/02_template_literals.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    标签模板（Tagged Template）是在模板字符串前面写一个函数名，形成特殊调用：
 *        tagFn`Hello ${name}, you are ${age}`
 *    它并不是"先求值成字符串再传给函数"，而是把模板拆成两部分传进去：
 *        tagFn(['Hello ', ', you are ', ''], name, age)
 *      第一个参数是"字符串字面量数组"（strings），其余参数是各 ${} 的求值结果。
 *    数组上还有一个特殊的只读属性 strings.raw，保存未处理转义符的原始文本。
 *
 * 2. 为什么需要
 *    标签模板让"字符串构造过程"可以被拦截和改写，从而：
 *      - 自动转义用户输入，防止 XSS（html 标签）
 *      - 自动去缩进、把多行文本左右对齐（dedent / 类似 sql 标签）
 *      - 保留原始反斜杠（String.raw`C:\new\dir`，否则 \n 会变成换行）
 *      - 收集翻译键并替换（i18n 标签 t`Hello ${name}`）
 *    这是 GraphQL 的 gql`` 、styled-components 的 styled.div`` 的实现基础。
 *
 * 3. 核心语法要点
 *    - 标签函数的第一个参数恒为数组，且数组上带有 raw 属性。
 *    - 其余参数按 ${} 出现顺序依次传入，是一个"参数列表"而不是数组。
 *    - 用剩余参数 (...values) 收集最方便：function tag(strings, ...values)。
 *    - strings.length 总是 values.length + 1。
 *    - 可以用 String.raw 作为标签，得到转义符不被解释的结果。
 *    - 返回值完全由你决定，不一定是字符串（可以是对象、数组、React 元素等）。
 *    - 标签模板的调用点若写了 ${} 但没有对应的标签函数参数，就是普通模板字符串。
 *
 * 4. 常见陷阱
 *    - 误以为标签函数收到的是拼好的字符串，其实拿到的是数组 + 分散的参数。
 *    - 忘了 strings 数组有 length = values.length + 1 这个关系，导致拼接时下标错位。
 *    - 用普通标签（非 String.raw）时，模板里的 \n、\t 仍然会被解释，
 *      想保留字面反斜杠必须用 String.raw 或在 strings.raw 中取。
 *    - html 标签只能防"值"被注入，如果拼接的是属性名/标签名则仍需白名单校验。
 *    - 标签函数被当作普通函数调用时（tag(['a'], 1)）行为不同，别混用。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/10_tagged_templates.js
 *
 * 【预期输出】
 *   演示字符串数组与插值参数的拆解、String.raw、HTML 转义标签、i18n 标签与 dedent。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 最简单的标签函数：看清参数结构
// ---------------------------------------------------------------------------

console.log('--- 1. 标签函数的参数结构 ---');

const name = '小明';
const age = 18;

// 定义一个"只负责打印参数"的标签函数
function inspect(strings, ...values) {
  console.log('  第一个参数是数组吗：', Array.isArray(strings));
  console.log('  strings 内容：', JSON.stringify(strings));
  console.log('  strings.length：', strings.length);
  console.log('  values 内容：', JSON.stringify(values));
  console.log('  values.length：', values.length);
  console.log('  关系成立（length === values.length + 1）：', strings.length === values.length + 1);
  // 标签函数的返回值由我们自己决定，这里示范"手工拼回原样"
  return strings.reduce((acc, piece, i) => acc + piece + (i < values.length ? values[i] : ''), '');
}

const reconstructed = inspect`Hello ${name}, you are ${age} years old.`;
console.log('  标签函数返回：', JSON.stringify(reconstructed));

// 没有插值时，strings 只有一项，values 为空
console.log('\n  无插值的情况：');
inspect`just a plain template`;

// 插值在开头/结尾时，strings 会出现空字符串元素
console.log('\n  插值在边界的情况：');
inspect`${name} 和 ${age}`;

// ---------------------------------------------------------------------------
// 2. strings.raw —— 未处理转义的原始文本
// ---------------------------------------------------------------------------

console.log('--- 2. strings.raw ---');

function showRaw(strings, ...values) {
  // 普通写法：转义符已经被解释（\n 变成真换行）
  console.log('  strings[0]（已处理）：', JSON.stringify(strings[0]));
  // raw 属性里保存的是源码里的原始字符，\n 仍是两个字符
  console.log('  strings.raw[0]（原始）：', JSON.stringify(strings.raw[0]));
  return '';
}

showRaw`第一行\n第二行`;
showRaw`路径 C:\Users\test`;

// String.raw 是内置的标签函数，等价于"返回 raw 拼接结果"
console.log("String.raw`C:\\Users\\test`：", JSON.stringify(String.raw`C:\Users\test`));
console.log("普通模板 `C:\\Users\\test`：", JSON.stringify(`C:\Users\test`)); // \U 不是有效转义，反斜杠被丢弃

// String.raw 的典型用途是写 Windows 路径与正则源码，但这里有一个必须知道的坑：
// 当反斜杠紧挨在 $ 前面时，源码里的 \${ 会被解析成"转义后的美元符号"，
// 插值根本不会发生，结果里会留下字面量 ${dir}
const dir = 'projects';
console.log(
  'String.raw 的坑：',
  JSON.stringify(String.raw`C:\Users\dev\${dir}\src`), // 插值没生效！
);
// 所以"既要反斜杠又要插值"时应改用普通模板字符串，把反斜杠写成 \\
console.log(
  '普通模板 + 双反斜杠：',
  JSON.stringify(`C:\\Users\\dev\\${dir}\\src`),
);

// 正则源码里也用得上
const pattern = String.raw`\d+\.\d+`;
console.log('正则源码：', JSON.stringify(pattern));
console.log('用它构造正则：', new RegExp(pattern).test('3.14'));

// String.raw 用普通函数方式调用也合法（传一个带 raw 的对象）
console.log(
  '普通调用：',
  JSON.stringify(String.raw({ raw: ['a', 'b', 'c'] }, 1, 2)),
);

// ---------------------------------------------------------------------------
// 3. 实战：HTML 转义标签（防 XSS）
// ---------------------------------------------------------------------------

console.log('--- 3. 实战：html 转义标签 ---');

// 危险字符映射表
const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** 把单个值转成安全的 HTML 文本 */
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/**
 * html 标签：模板里的"静态部分"由开发者书写，被认为是安全的；
 * 只有 ${} 插进去的"动态值"才需要转义。
 */
function html(strings, ...values) {
  // 逐段拼接：静态片段原样保留，插值一律转义
  return strings.reduce((acc, piece, i) => {
    if (i === 0) return piece;
    return acc + escapeHtml(values[i - 1]) + piece;
  }, '');
}

const userInput = '<script>alert("xss")</script>';
const safeHtml = html`<div class="comment">${userInput}</div>`;
console.log('用户输入：', JSON.stringify(userInput));
console.log('转义结果：', JSON.stringify(safeHtml));
// 注意看：< > " 都变成了实体，脚本不会被执行
console.log('静态部分未被转义：', safeHtml.includes('<div class="comment">')); // true

// 对比：如果直接用普通模板字符串拼接，就会产生 XSS 漏洞
const unsafeHtml = `<div class="comment">${userInput}</div>`;
console.log('未转义（有漏洞）：', JSON.stringify(unsafeHtml));

// 再验证一个带引号和 & 的输入
console.log('转义 & 和引号：', JSON.stringify(html`<a title="${'Tom & "Jerry"'}"">link</a>`));
// 非字符串值也能处理
console.log('数字与布尔：', JSON.stringify(html`<i>${1 > 0}</i>`));

// ---------------------------------------------------------------------------
// 4. 实战：i18n 翻译标签
// ---------------------------------------------------------------------------

console.log('--- 4. 实战：i18n 标签 ---');

// 简易词典：键是模板的静态骨架，值是带占位符的译文
const dictionaries = {
  zh: {
    'Hello, {0}! You have {1} new messages.': '你好，{0}！你有 {1} 条新消息。',
    'Welcome back': '欢迎回来',
  },
  en: {
    'Hello, {0}! You have {1} new messages.': 'Hello, {0}! You have {1} new messages.',
    'Welcome back': 'Welcome back',
  },
};

let currentLang = 'zh';

/**
 * t 标签：把模板里"静态的骨架"当作翻译键，把 ${} 的值当作参数。
 * 这样译文可以自由调整参数顺序甚至省略参数，比字符串拼接灵活得多。
 */
function t(strings, ...values) {
  // 把静态片段 + 占位符 {0} {1} ... 拼成查找键。
  // 例如 t`Hello, ${name}! You have ${n} messages.`
  //   → 键为 "Hello, {0}! You have {1} messages."
  const skeleton = strings.reduce(
    (acc, piece, i) => acc + piece + (i < values.length ? `{${i}}` : ''),
    '',
  );
  const dict = dictionaries[currentLang] ?? dictionaries.en;
  // 词典里没有就用骨架本身兜底，保证界面永远不会空白
  const translated = dict[skeleton] ?? skeleton;
  // 最后把译文里的 {n} 换成真实值；译文里没出现的参数自然就被丢弃了
  return translated.replace(/\{(\d+)\}/g, (match, idx) =>
    Object.hasOwn(values, Number(idx)) ? String(values[Number(idx)]) : match,
  );
}

console.log('中文：', JSON.stringify(t`Hello, ${name}! You have ${3} new messages.`));
currentLang = 'en';
console.log('英文：', JSON.stringify(t`Hello, ${name}! You have ${3} new messages.`));
console.log('无插值键：', JSON.stringify(t`Welcome back`));
// 词典缺失时退回原文，保证不会显示空白
console.log('缺失键：', JSON.stringify(t`Missing key ${1}`));

// ---------------------------------------------------------------------------
// 5. 实战：dedent 标签（去掉多行文本的公共缩进）
// ---------------------------------------------------------------------------

console.log('--- 5. 实战：dedent ---');

/**
 * 标签函数的一个隐藏能力：能在"运行前"看到模板的原始缩进。
 * 用 strings.raw 或 strings 都能拿到每行开头的空格，从而自动去掉公共缩进。
 */
function dedent(strings, ...values) {
  // 先拼出完整文本
  const full = strings.reduce(
    (acc, piece, i) => acc + piece + (i < values.length ? String(values[i]) : ''),
    '',
  );
  const lines = full.split('\n');
  // 计算所有非空行的最小缩进量
  let minIndent = Infinity;
  for (const line of lines) {
    if (line.trim() === '') continue;
    const indent = line.length - line.trimStart().length;
    if (indent < minIndent) minIndent = indent;
  }
  if (!Number.isFinite(minIndent)) minIndent = 0;
  // 去掉这个公共缩进，并清掉首尾空行
  return lines.map((line) => line.slice(minIndent)).join('\n').replace(/^\n+|\s+$/g, '');
}

const rawText = dedent`
    第一行
      第二行（多两个空格）
    第三行
`;
console.log('去缩进后的文本：');
console.log(rawText);
console.log('用 JSON 看确切内容：', JSON.stringify(rawText));

// 带插值的 dedent
console.log('\n带插值：');
console.log(
  dedent`
    用户：${name}
    年龄：${age}
  `,
);

// ---------------------------------------------------------------------------
// 6. 实战：带校验的标签函数
// ---------------------------------------------------------------------------

console.log('--- 6. 实战：带校验的标签 ---');

/** 一个"安全 URL 拼接"标签：确保插值经过 encodeURIComponent */
function urlTag(strings, ...values) {
  return strings.reduce((acc, piece, i) => {
    if (i === 0) return piece;
    // 插值一律做 URL 编码，防止 ? & # 等字符破坏结构
    return acc + encodeURIComponent(String(values[i - 1])) + piece;
  }, '');
}

const keyword = 'a&b=c d';
console.log('原始关键词：', JSON.stringify(keyword));
console.log('安全 URL：', JSON.stringify(urlTag`/search?q=${keyword}&page=1`));
// 对比：不编码会破坏查询串结构
console.log('未编码：', JSON.stringify(`/search?q=${keyword}&page=1`));

/** 另一个例子：把插值统统转成大写的标签 */
function upper(strings, ...values) {
  return strings
    .map((piece, i) => (i === 0 ? piece : String(values[i - 1]).toUpperCase() + piece))
    .join('');
}
console.log('upper 标签：', JSON.stringify(upper`你好 ${'world'} 你好 ${12345}`));

// 标签函数的返回值可以不是字符串，这打开了更大的想象空间
function toArray(strings, ...values) {
  // 返回 "静态片段 + 插值" 交替的数组，方便后续交给别的渲染器
  const out = [];
  strings.forEach((piece, i) => {
    if (piece !== '') out.push(piece);
    if (i < values.length) out.push(values[i]);
  });
  return out;
}
console.log('返回数组：', JSON.stringify(toArray`订单 ${'A1'} 金额 ${99}`));

console.log('\n全部演示完毕。');
