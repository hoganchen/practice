/**
 * ============================================================================
 * 知识点：模板字符串 —— 插值、多行文本、嵌套、表达式求值
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】入门
 * 【前置知识】11_strings/01_creation_and_immutability.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    模板字符串（Template Literals）是 ES2015 引入的用反引号 ` 包裹的字符串字面量。
 *    它在普通字符串之上增加了三项能力：
 *      a) 插值：${表达式} 会被求值并转成字符串后嵌入
 *      b) 多行：直接换行即可，不需要 \n
 *      c) 标签模板：前面可以加一个函数名，形成"标签模板调用"（见 10 号文件）
 *
 * 2. 为什么需要
 *    在模板字符串出现之前，拼接变量只能用 + ，可读性极差：
 *      'Hello, ' + name + '! You have ' + count + ' messages.'
 *    有了模板字符串：
 *      `Hello, ${name}! You have ${count} messages.`
 *    多行 HTML 片段、SQL 语句、日志格式尤其受益。
 *
 * 3. 核心语法要点
 *    - 反引号包裹；内部可以出现单引号、双引号而无需转义。
 *    - ${} 内可以是任意表达式：变量、运算、三元、函数调用、甚至另一个模板字符串。
 *    - ${} 的结果会经过 ToString 转换，null → 'null'，undefined → 'undefined'，
 *      对象 → '[object Object]'，数组 → 逗号连接。
 *    - 多行字符串的缩进会被原样保留（包括行首空格），这是最常见的格式问题来源。
 *    - ${} 内不能写语句（如 if、for），只能是表达式。要用三元或先算好再插。
 *
 * 4. 常见陷阱
 *    - 想输出字面量 ${ 必须转义为 \${，否则会被当作插值起始。
 *    - 反引号内部的缩进会被算进字符串长度，导致 === 比较失败。
 *    - 插值 null/undefined 会得到字符串 'null'/'undefined'，通常要用 ?? 兜底。
 *    - 不要用模板字符串拼 SQL —— 会产生 SQL 注入，应该用参数化查询。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/02_template_literals.js
 *
 * 【预期输出】
 *   演示插值、类型转换、多行、嵌套、转义与常见陷阱的各类结果。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 基本插值
// ---------------------------------------------------------------------------

console.log('--- 1. 基本插值 ---');

const name = '小明';
const count = 3;

// 对比：传统 + 拼接
const byConcat = 'Hello, ' + name + '! You have ' + count + ' messages.';
// 模板字符串写法，明显更清晰
const byTemplate = `Hello, ${name}! You have ${count} messages.`;

console.log('加号拼接：', JSON.stringify(byConcat));
console.log('模板字符串：', JSON.stringify(byTemplate));
console.log('两者内容相同：', byConcat === byTemplate);

// 模板字符串同样是一个原始 string 值
console.log('typeof 模板字符串：', typeof byTemplate);

// ---------------------------------------------------------------------------
// 2. ${} 里可以放任意表达式
// ---------------------------------------------------------------------------

console.log('--- 2. 表达式求值 ---');

const price = 19.9;
const qty = 3;

// 算术表达式
console.log('算术：', `总价 = ${price * qty}`);
// 三元表达式（因为不能写 if 语句）
console.log('三元：', `状态：${qty > 0 ? '有货' : '缺货'}`);
// 方法调用
console.log('方法调用：', `大写名字：${name.toUpperCase()}`);
// 函数调用
console.log('函数调用：', `随机数取整：${Math.floor(1.9)}`);
// 嵌套另一个模板字符串
console.log('嵌套模板：', `外层[${`内层-${qty}`}]`);

// ---------------------------------------------------------------------------
// 3. 插值的类型转换规则（ToString）
// ---------------------------------------------------------------------------

console.log('--- 3. 插值的类型转换 ---');

// ${} 内部会按照 ToString 规则转字符串，和 String() 的行为一致
console.log('数字：', `[${42}]`);
console.log('布尔：', `[${true}]`);
console.log('null：', `[${null}]`); // 得到字符串 "null"
console.log('undefined：', `[${undefined}]`); // 得到字符串 "undefined"
console.log('数组：', `[${[1, 2, 3]}]`); // 数组用逗号连接 → "1,2,3"
console.log('对象：', `[${{ a: 1 }}]`); // → "[object Object]"

// 陷阱演示：后端字段缺失时直接插值会显示 "undefined"
const user = { nickname: undefined };
console.log('未兜底：', `昵称：${user.nickname}`);
// 用 ?? 提供默认值（?? 只在 null/undefined 时生效，不会误伤 0 和 ''）
console.log('用 ?? 兜底：', `昵称：${user.nickname ?? '匿名用户'}`);
// 用 JSON.stringify 表达"我要看到确切内容"，避免歧义
console.log('调试用：', `user = ${JSON.stringify(user)}`);

// ---------------------------------------------------------------------------
// 4. 多行字符串
// ---------------------------------------------------------------------------

console.log('--- 4. 多行字符串 ---');

// 反引号内直接换行即可，换行符会被原样保留
const multiline = `第一行
第二行
第三行`;

console.log('多行内容：', JSON.stringify(multiline));
// 换行符 \n 共 2 个，说明有 3 行
console.log('换行符数量：', (multiline.match(/\n/g) || []).length);

// 对比传统写法：必须显式写 \n，且长文本非常难读
const legacyMultiline = '第一行\n第二行\n第三行';
console.log('与 \\n 写法等值：', multiline === legacyMultiline);

// 陷阱：缩进会被算进字符串内容
const indented = `行一
    行二`;
console.log('含缩进的多行：', JSON.stringify(indented));

// 常见解法：用 trim() 去掉首尾空白，或把缩进放在 ${} 里
const cleaned = `
    <div>
      <span>hi</span>
    </div>
  `.trim();
console.log('trim 之后：', JSON.stringify(cleaned));

// ---------------------------------------------------------------------------
// 5. 转义与字面量 ${
// ---------------------------------------------------------------------------

console.log('--- 5. 转义 ---');

// \$ 让 ${ 失去插值含义，输出字面量 ${name}
console.log('转义后输出字面量：', `这里不会插值：\${name}`);
// 反引号本身需要 \` 转义
console.log('输出反引号：', `这是反引号 \` 字符`);
// 反斜杠仍然需要转义
console.log('输出反斜杠：', `C:\\Users\\test`);

// ---------------------------------------------------------------------------
// 6. 实战：拼 HTML 片段与日志
// ---------------------------------------------------------------------------

console.log('--- 6. 实战场景 ---');

const items = [
  { title: '苹果', price: 5 },
  { title: '香蕉', price: 3 },
];

// 用 map + join 拼接 HTML 列表（这是模板字符串最典型的用法之一）
const html = `<ul>
${items.map((it) => `  <li>${it.title} - ￥${it.price}</li>`).join('\n')}
</ul>`;
console.log('生成的 HTML：\n' + html);

// 对齐的日志格式：用 padStart 让编号等宽（padStart 见 05 号文件）
const logLine = `[${String(1).padStart(3, '0')}] 处理完成 item=apple`;
console.log('日志行：', JSON.stringify(logLine));

// 金额格式化：toFixed 保留两位小数（注意 toFixed 的坑见 12_numbers_and_math/05）
console.log('金额展示：', `合计：￥${(price * qty).toFixed(2)}`);

console.log('\n全部演示完毕。');
