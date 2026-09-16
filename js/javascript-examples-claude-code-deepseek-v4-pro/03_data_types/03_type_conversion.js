/**
 * ============================================================================
 * 知识点：显式类型转换（Number / String / Boolean）与隐式转换规则
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】入门
 * 【前置知识】03_data_types/02_typeof_operator.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 是弱类型语言：不同类型之间参与运算时，引擎会按规范里的抽象操作
 *    （ToNumber / ToString / ToBoolean / ToPrimitive）自动转换，这叫隐式转换。
 *    我们也可以主动调用 Number() / String() / Boolean() 做显式转换。
 *
 * 2. 为什么需要
 *    · 表单、URL 参数、环境变量拿到的永远是字符串，要参与算术就得转成数字。
 *    · 隐式转换规则多且有反直觉之处（'' == 0 为 true，[] == 0 为 true），
 *      显式转换是让意图明确、避免 bug 的主要手段。
 *    · 现代工程共识：宁可多写几个 Number()，也不要依赖隐式转换。
 *
 * 3. 核心语法要点
 *    【转数字 Number(x)】
 *      - 字符串：先去掉首尾空白；'' 与纯空白 → 0；能整体解析为十进制/科学计数法
 *        /十六进制(0x) → 对应数值；含非法字符（如 '12abc'）→ NaN。
 *      - null → 0；undefined → NaN；true → 1；false → 0。
 *      - bigint → 若在安全范围内则为 number，否则可能丢精度（推荐用 BigInt()）。
 *      - symbol → 直接抛 TypeError。
 *      - 对象 → 先 ToPrimitive 取原始值（默认走 valueOf 再 toString），再转数字。
 *        [] → '' → 0；[5] → '5' → 5；[1,2] → '1,2' → NaN；{} → '[object Object]' → NaN。
 *    【转字符串 String(x)】
 *      - null → 'null'，undefined → 'undefined'，true → 'true'。
 *      - 数字 → 十进制字面量（NaN → 'NaN'，Infinity → 'Infinity'）。
 *      - symbol → 特例：String(sym) 返回 "Symbol(描述)"，不抛错。
 *      - 数组 → 元素逐个转字符串再以逗号连接：String([1,[2,3]]) === '1,2,3'。
 *      - 对象 → '[object Object]'（除非自定义了 toString / Symbol.toPrimitive）。
 *    【转布尔 Boolean(x)】
 *      只有 8 个假值：false、0、-0、0n、''、null、undefined、NaN。
 *      除此之外一切都是 true —— 包括 '0'、' '、[]、{}、function(){}。
 *    【隐式转换发生的场合】
 *      - 算术运算符 - * / % ** ：两侧转数字。
 *      - + ：只要有一侧是字符串就做字符串拼接，否则做数字加法。
 *      - 比较运算符 < > <= >= ：转数字或按字符串字典序比较。
 *      - == ：按"抽象相等比较"算法做类型转换后比较（=== 不转换）。
 *      - if / while / ! / && / || / ?: ：把条件转布尔。
 *      - 模板字符串 ${x}：把 x 转字符串（注意 symbol 这里会抛错）。
 *
 * 4. 常见陷阱
 *    · Number('') 是 0 而不是 NaN，容易把"空输入"误判成 0 分。
 *      想严格解析用 Number.parseInt / Number.parseFloat + 校验。
 *    · parseInt 与 Number 行为不同：parseInt('12abc') 得到 12（能解析多少算多少），
 *      Number('12abc') 得到 NaN（必须整体合法）。
 *    · + 是唯一"既可能做加法又可能做拼接"的运算符，混用极易出错。
 *    · Symbol 不能隐式转数字/字符串：'x' + Symbol() 与 `${Symbol()}` 都会抛 TypeError。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/03_type_conversion.js
 *
 * 【预期输出】
 *   三张转换表（Number / String / Boolean）、隐式转换演示、+ 运算符分支演示，
 *   以及 symbol 转换抛错的 try/catch 捕获结果。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Number() 转换表
// ---------------------------------------------------------------------------

console.log('--- 1. 显式转数字 Number(x) ---');

const toNumberCases = [
  ['"123"', '123'],
  ['"  42  "', '  42  '],
  ['"3.14"', '3.14'],
  ['"1e3"', '1e3'],
  ['"0x1F"', '0x1F'],
  ['""（空串）', ''],
  ['"   "（纯空白）', '   '],
  ['"12abc"', '12abc'],
  ['"abc"', 'abc'],
  ['null', null],
  ['undefined', undefined],
  ['true', true],
  ['false', false],
  ['[]', []],
  ['[5]', [5]],
  ['[1,2]', [1, 2]],
  ['{}', {}],
];

for (const [label, value] of toNumberCases) {
  console.log('Number(' + label + ') =', Number(value));
}

// 严格解析的替代方案对比：
console.log('Number("12abc")        =', Number('12abc'), '（必须整体合法，否则 NaN）');
console.log('parseInt("12abc", 10)  =', parseInt('12abc', 10), '（解析到不能解析为止）');
console.log('parseFloat("3.14xyz")  =', parseFloat('3.14xyz'));

// ---------------------------------------------------------------------------
// 2. String() 转换表
// ---------------------------------------------------------------------------

console.log('--- 2. 显式转字符串 String(x) ---');

const toStringCases = [
  ['123', 123],
  ['NaN', NaN],
  ['Infinity', Infinity],
  ['true', true],
  ['null', null],
  ['undefined', undefined],
  ['[1,2,3]', [1, 2, 3]],
  ['[]', []],
  ['[{a:1}]', [{ a: 1 }]],
  ['{}', {}],
  ['函数', function foo() {}],
];

for (const [label, value] of toStringCases) {
  console.log('String(' + label + ') =', String(value));
}

// Symbol 的特例：String(sym) 不抛错，因为它有专门的重载。
const sym = Symbol('我的符号');
console.log('String(Symbol("我的符号")) =', String(sym));
console.log('sym.toString()            =', sym.toString());

// 但模板字符串走的是 ToString，对 symbol 会抛错：
try {
  console.log(`${sym}`); // 这一行会抛 TypeError
} catch (err) {
  console.log('模板字符串插入 symbol →', err.name + ':', err.message);
}

// 同理，字符串拼接也会抛错：
try {
  console.log('前缀' + sym);
} catch (err) {
  console.log('字符串 + symbol →', err.name + ':', err.message);
}

// 正确做法：先显式转换再拼接。
console.log("正确做法：'前缀' + String(sym) =", '前缀' + String(sym));

// ---------------------------------------------------------------------------
// 3. Boolean() 转换表
// ---------------------------------------------------------------------------

console.log('--- 3. 显式转布尔 Boolean(x) ---');

const toBoolCases = [
  ['false', false],
  ['0', 0],
  ['-0', -0],
  ['0n', 0n],
  ['""', ''],
  ['null', null],
  ['undefined', undefined],
  ['NaN', NaN],
];
console.log('【8 个假值】');
for (const [label, value] of toBoolCases) {
  console.log('  Boolean(' + label + ') =', Boolean(value));
}

// 注意：下面每一项都必须显式写出真实的值，不能图省事用 eval('{}') ——
// eval 会把开头的 {} 解析成"代码块"而不是"空对象字面量"，从而得到 undefined。
const trueCases = [
  ["'0'（内容为 0 的字符串）", '0'],
  ["' '（一个空格）", ' '],
  ['[]（空数组）', []],
  ['{}（空对象）', {}],
  ['function () {}（空函数）', function () {}],
  ["'false'（内容为 false 的字符串）", 'false'],
  ['Infinity', Infinity],
  ['-1', -1],
];
console.log('【真值示例】');
for (const [label, value] of trueCases) {
  console.log('  Boolean(' + label + ') =', Boolean(value));
}

// ---------------------------------------------------------------------------
// 4. 隐式转换：+ 运算符的双重人格
// ---------------------------------------------------------------------------

console.log('--- 4. 隐式转换之 + 运算符 ---');

// 规则：先对两侧做 ToPrimitive；只要有一个结果是字符串，就做字符串拼接，
// 否则两边都转数字做加法。
console.log("1 + 2       =", 1 + 2, '（都是数字 → 加法）');
console.log("'1' + 2     =", '1' + 2, '（有字符串 → 拼接）');
console.log('1 + "2"     =', 1 + '2');
console.log('1 + true    =', 1 + true, '（true → 1）');
console.log('1 + null    =', 1 + null, '（null → 0）');
console.log('1 + undefined =', 1 + undefined, '（undefined → NaN）');
console.log('[] + []     =', [] + [], '（两个空数组 → 两个空串拼接）');
console.log('[] + {}     =', [] + {}, '（"" + "[object Object]"）');
console.log('{} + []     =', String({} + []), '（注意：语句开头的 {} 会被当成代码块）');
console.log('[1,2] + [3,4] =', [1, 2] + [3, 4], '（"1,2" + "3,4"）');

// 其它算术运算符一律转数字：
console.log("'6' - 1  =", '6' - 1, '（减号只做数字，字符串被转成 6）');
console.log("'6' * '2' =", '6' * '2');
console.log("'6' / 2  =", '6' / 2);
console.log('true * 5 =', true * 5);

// ---------------------------------------------------------------------------
// 5. 隐式转换：比较运算符与 ==
// ---------------------------------------------------------------------------

console.log('--- 5. 隐式转换之比较 ---');

// 关系比较：两侧都转成"原始值"，若都是字符串则按 UTF-16 码元字典序比较，
// 否则转成数字比较。
console.log("'10' < '9'  =", '10' < '9', '（都是字符串 → 字典序，"1" < "9"）');
console.log("'10' < 9    =", '10' < 9, '（有一侧是数字 → 转数字比较）');
console.log('null < 1    =', null < 1, '（null → 0）');
console.log('null >= 1   =', null >= 1);
console.log('null == 0   =', null == 0, '（特例：null 只与 undefined 松散相等）');
console.log('undefined == 0 =', undefined == 0);

// == 的抽象相等比较关键分支：
console.log("1 == '1'      =", 1 == '1', '（字符串转数字）');
console.log("0 == ''       =", 0 == '', '（空串转成 0）');
console.log('0 == false    =', 0 == false);
console.log("' \\t\\n' == 0   =", ' \t\n' == 0, '（纯空白 → 0）');
console.log('[] == 0       =', [] == 0, '（[] → "" → 0）');
console.log('[] == false   =', [] == false);
console.log('[0] == 0      =', [0] == 0);
console.log("'0' == false  =", '0' == false, '（都转数字：0 == 0）');
console.log('null == undefined =', null == undefined, '（规范特批：true）');
console.log('NaN == NaN    =', NaN == NaN, '（NaN 与任何值都不相等）');

console.log('--- 结论：== 的转换分支太多，工程上统一用 === ---');

// ---------------------------------------------------------------------------
// 6. 实战建议：主动转换，让类型可控
// ---------------------------------------------------------------------------

console.log('--- 6. 推荐写法 ---');

const rawInput = '42';
console.log('隐式：rawInput * 1 =', rawInput * 1);
console.log('显式：Number(rawInput) =', Number(rawInput));

const rawEmpty = '';
console.log("坑：Number('') =", Number(''), '→ 空输入被当成 0，需要单独校验');
console.log("校验：rawEmpty === '' ? 视为未填写 : Number(rawEmpty) =",
  rawEmpty === '' ? '视为未填写' : Number(rawEmpty));

console.log('--- 完成：显式与隐式类型转换 ---');
