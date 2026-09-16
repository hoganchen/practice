/**
 * ============================================================================
 * 知识点：标识符规则、命名约定与保留字
 * ============================================================================
 *
 * 【所属分类】01_syntax_basics —— 语法基础
 * 【难度等级】入门
 * 【前置知识】01_syntax_basics/01_statements_and_expressions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    标识符（Identifier）是我们给变量、函数、类、属性起的名字。
 *    JS 对"什么能当标识符"有硬性的语法规则（不满足就是 SyntaxError），
 *    社区对"应该怎么起名"有软性的风格约定（不满足也能跑，但会被同事吐槽）。
 *
 * 2. 为什么需要 / 解决什么问题
 *    命名是编程里出现频率最高、影响最持久的决策。规则部分决定代码能不能跑；
 *    约定部分决定代码能不能被别人（包括三个月后的自己）读懂。
 *    此外，"保留字"决定了哪些名字你根本不能用 —— 不查清楚就会写出
 *    莫名其妙的语法错误。
 *
 * 3. 核心语法要点
 *    （1）标识符的构成规则（硬性）
 *        - 第一个字符：字母（a-z / A-Z）、下划线 `_`、美元符 `$`，
 *          或者 Unicode 中属于 ID_Start 的字符（中文、日文、希腊字母都可以）。
 *        - 后续字符：以上这些 + 数字 0-9 + 部分连接符（如 U+200C/U+200D）。
 *        - **不能**包含连字符 `-`、空格、`!`、`@`、`#`（除了类私有字段的 `#` 前缀）、
 *          emoji 等。
 *        - 不能以数字开头。
 *    （2）大小写敏感
 *        `name`、`Name`、`NAME` 是三个完全不同的标识符。
 *    （3）保留字（不能用作标识符）
 *        - 关键字：break case catch class const continue debugger default delete
 *          do else export extends finally for function if import in instanceof
 *          new return super switch this throw try typeof var void while with yield
 *        - 未来保留字：enum
 *        - 严格模式下的额外保留字：implements interface let package private
 *          protected public static yield
 *        - 字面量（也不能用作标识符）：null true false
 *    （4）命名约定（软性，但极其重要）
 *        - camelCase（小驼峰）：变量、函数、方法、对象属性。例：userName、getUserById
 *        - PascalCase（大驼峰）：类、构造函数、React 组件、类型名。例：UserService
 *        - UPPER_SNAKE_CASE：模块级常量、枚举值。例：MAX_RETRY_COUNT
 *        - 前缀 `is` / `has` / `can` / `should`：布尔值。例：isActive、hasChildren
 *        - 前缀 `_`：约定俗成的"内部使用"（语言层面无强制力）
 *        - 前缀 `#`：真正的私有字段（ES2022 起语言层面强制）
 *        - 动词开头：函数名说明"做什么"（getX / setX / fetchX / handleX）
 *    （5）其它实用约定
 *        - 不用拼音、不用无意义缩写（`usr` 尚可，`u1` 不行）。
 *        - 拼写要正确：`lenght` 之类的错误会一直传染下去。
 *        - 同一概念在全项目里用同一个词（不要同时出现 user / member / account）。
 *
 * 4. 常见陷阱与注意事项
 *    - `undefined`、`NaN`、`Infinity` **不是保留字**，语法上可以用作变量名，
 *      但它们已经是全局属性，覆盖它们会造成灾难，永远不要这么做。
 *    - `let` 在非严格模式下可作为标识符（历史遗留），在严格模式（含 ESM）下
 *      是保留字。所以 `let let = 1` 在某些老代码里居然能跑。
 *    - 用保留字做对象**属性名**是合法的：`obj.class`、`obj.new` 都没问题，
 *      因为属性名走的是另一套语法（IdentifierName），比标识符宽松。
 *    - 字母 `$` 常被库用作简写（jQuery 的 `$`），但业务代码里滥用 `$` 会降低可读性。
 *    - 中文标识符语法上完全合法，但在协作项目里通常还是用英文。
 *    - 常量"全大写"的约定只适用于"模块级、不可变配置"，不必给每个 const 都大写。
 *    - 本文件演示非法标识符时，全部用 new Function 构造并 try/catch，
 *      保证本文件本身依然能正常运行、正常退出。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 01_syntax_basics/05_identifiers_and_naming.js
 *
 * 【预期输出】
 *   分节演示：合法标识符一览、大小写敏感、Unicode 标识符、非法标识符的报错信息、
 *   保留字清单与属性名例外、各种命名约定的实际代码与输出。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 合法的标识符：把所有允许的形态都试一遍
// ---------------------------------------------------------------------------

console.log('--- 1. 合法标识符的形态 ---');

// 字母开头（最常规的写法）
const userName = '字母开头';
// 下划线开头
const _internalCache = '下划线开头（约定表示内部使用）';
// 美元符开头（jQuery 等库的经典用法）
const $element = '美元符开头';
// 字母 + 数字混合（但数字不能在第一位）
const utf8Bytes = 1024;
const base64String = 'aGVsbG8=';
// 下划线与美元符出现在中间也可以
const user_name_v2 = '带下划线的老式写法';
// 中文标识符：语法完全合法，因为中文属于 Unicode ID_Start
const 学生数量 = 42;
// 其它 Unicode：希腊字母、日文、甚至 emoji 之外的符号
const π = Math.PI;
const こんにちは = '你好';

console.log('userName =', userName);
console.log('_internalCache =', _internalCache);
console.log('$element =', $element);
console.log('utf8Bytes =', utf8Bytes, '/ base64String =', base64String);
console.log('user_name_v2 =', user_name_v2);
console.log('学生数量 =', 学生数量, '（中文标识符合法，但不推荐在协作项目中使用）');
console.log('π =', π, '/ こんにちは =', こんにちは);

// ---------------------------------------------------------------------------
// 2. 大小写敏感
// ---------------------------------------------------------------------------

console.log('\n--- 2. JS 严格区分大小写 ---');

const value = '小写 value';
const Value = '大写 Value';
const VALUE = '全大写 VALUE';

console.log('value =', value);
console.log('Value =', Value);
console.log('VALUE =', VALUE);
console.log('三者互不影响，证明标识符大小写敏感。');

// 内置对象同理：console 与 Console 是两个东西，后者在 Node 中根本不存在。
console.log('typeof console =', typeof console);
console.log('typeof Console =', typeof Console, '（大写 C 的不是内置对象）');

// 常见的"大小写笔误"事故：JSON 写成 Json、Math 写成 math。
console.log('typeof JSON =', typeof JSON, '/ typeof Json =', typeof Json);
console.log('typeof Math =', typeof Math, '/ typeof math =', typeof math, '← 写错大小写就会变成 undefined');

// ---------------------------------------------------------------------------
// 3. 非法标识符：逐个触发报错，看清错误信息
// ---------------------------------------------------------------------------

console.log('\n--- 3. 非法标识符的报错信息 ---');

/**
 * 用 new Function 尝试"解析"一段代码，捕获解析期错误并打印，避免影响本文件运行。
 *
 * @param {string} label 这组测试的说明
 * @param {string} code 要尝试解析的代码
 */
function tryParse(label, code) {
  try {
    new Function(code); // 只构造、不调用：能构造成功就说明语法合法
    console.log('  ✗ ' + label + '：居然通过了（不符合预期）');
  } catch (err) {
    console.log('  ✓ ' + label + ' → ' + err.constructor.name + '：' + err.message);
  }
}

tryParse('数字开头 const 1st = 1', 'const 1st = 1;');
tryParse('含连字符 const my-var = 1', 'const my-var = 1;');
tryParse('含空格 const my var = 1', 'const my var = 1;');
tryParse('含 @ 符号 const user@name = 1', 'const user@name = 1;');
tryParse('含点号 const a.b = 1', 'const a.b = 1;');
tryParse('关键字作变量名 const class = 1', 'const class = 1;');
tryParse('未来保留字 const enum = 1', 'const enum = 1;');
tryParse('字面量作变量名 const true = 1', 'const true = 1;');
tryParse('严格模式保留字 const interface = 1', `'use strict'; const interface = 1;`);
tryParse('emoji 标识符 const 🚀 = 1', 'const 🚀 = 1;');

// ---------------------------------------------------------------------------
// 4. 保留字清单（程序化展示）
// ---------------------------------------------------------------------------

console.log('\n--- 4. 保留字清单 ---');

// 把规范里的保留字分组列出来，并用一张表说明"能不能用作变量名 / 属性名"。
const reservedGroups = [
  { 分组: '关键字', 单词: 'break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof new return super switch this throw try typeof var void while with yield' },
  { 分组: '未来保留字', 单词: 'enum' },
  { 分组: '严格模式保留字', 单词: 'implements interface let package private protected public static yield' },
  { 分组: '字面量（也不能用）', 单词: 'null true false' },
  { 分组: '不是保留字但千万别覆盖', 单词: 'undefined NaN Infinity arguments eval' },
];

for (const { 分组, 单词 } of reservedGroups) {
  // split(' ') 把长字符串切成单词数组，length 就是这一组的个数
  const list = 单词.split(' ');
  console.log(分组 + '（' + list.length + ' 个）：' + list.join('、'));
}

// 逐个验证：这些词到底能不能作为"变量名"。
// 注意 let 只在严格模式下才是保留字，所以这里用严格模式来测。
console.log('\n  逐个验证（严格模式下）能不能当变量名：');
const wordsToTest = ['class', 'enum', 'let', 'interface', 'null', 'undefined', 'eval', 'arguments', 'await', 'async', 'of', 'get'];
console.table(
  wordsToTest.map((w) => {
    let asVariable;
    try {
      new Function(`'use strict'; const ${w} = 1;`);
      asVariable = '可以';
    } catch {
      asVariable = 'SyntaxError';
    }
    let asProperty;
    try {
      new Function(`'use strict'; const o = { ${w}: 1 }; return o;`);
      asProperty = '可以';
    } catch {
      asProperty = 'SyntaxError';
    }
    return { 单词: w, 作变量名: asVariable, 作属性名: asProperty };
  }),
);

console.log('  关键结论：保留字不能当"变量名"，但**可以**当"属性名"。');
console.log('  原因：属性名的语法规则是 IdentifierName（更宽松），变量名是 Identifier（更严格）。');

// 两个值得注意的细节：
// 1) await 在普通函数体里可以当变量名，但在 ES 模块顶层、以及 async 函数里
//    它是保留字（会直接 SyntaxError）。这类"随上下文变化的保留字"还有 yield、
//    let、static 等，遇到"同一个词有时能跑有时报错"时，先想想是不是上下文变了。
// 2) 前面的报错信息里，"const my-var = 1" 报的是 Missing initializer in const declaration，
//    而不是"非法标识符"。因为解析器先把 my 当成变量名、再把 - var 当成别的东西，
//    最后才在某处发现语法不成立。看到这类"文不对题"的报错，要优先怀疑拼写与符号。

// 实测：用保留字当属性名完全没问题
const config = { class: 'A', new: 'B', default: 'C', in: 'D' };
console.log('  config.class =', config.class, '/ config.new =', config.new, '/ config.default =', config.default);
console.log('  但访问时建议用方括号：config["in"] =', config['in'], '（因为 config.in 里的 in 容易读错）');

// ---------------------------------------------------------------------------
// 5. 命名约定：在真实代码里对照着看
// ---------------------------------------------------------------------------

console.log('\n--- 5. 命名约定实际演示 ---');

// （1）UPPER_SNAKE_CASE：模块级常量，语义是"配置值，写死不变"。
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com/v1';
const DEFAULT_TIMEOUT_MS = 5000;
console.log('常量（UPPER_SNAKE_CASE）：MAX_RETRY_COUNT =', MAX_RETRY_COUNT, '/ API_BASE_URL =', API_BASE_URL);

// （2）camelCase：变量与函数。函数用"动词开头"，一眼看出它会做事。
let currentRetryCount = 0; // 变量：名词短语
function buildRequestUrl(baseUrl, path) {
  // 函数：动词 build + 名词 RequestUrl
  return baseUrl.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
}
console.log('camelCase 函数：buildRequestUrl(API_BASE_URL, "/users") =', buildRequestUrl(API_BASE_URL, '/users'));

// （3）布尔值用 is / has / can / should 开头，读起来就像一句判断。
const isLoggedIn = false;
const hasPermission = true;
const canRetry = currentRetryCount < MAX_RETRY_COUNT;
const shouldShowBanner = !isLoggedIn && hasPermission;
console.log('布尔命名：isLoggedIn =', isLoggedIn, '/ hasPermission =', hasPermission, '/ canRetry =', canRetry, '/ shouldShowBanner =', shouldShowBanner);
console.log('  → 这种命名的好处：写成 if (canRetry) 时，代码本身就是一句可读的英语。');

// （4）PascalCase：类 / 构造函数。
class UserProfileService {
  constructor(user) {
    this.user = user;
  }
  getDisplayName() {
    return this.user.nickname || this.user.name;
  }
}
console.log('PascalCase 类：new UserProfileService({name:"小明"}).getDisplayName() =', new UserProfileService({ name: '小明' }).getDisplayName());

// （5）下划线前缀：纯粹的"团队约定"，语言层面没有任何强制力。
const _cache = new Map(); // 约定：外部不要去碰它
_cache.set('k', 'v');
console.log('下划线前缀 _cache：只是一个约定，外部依然能访问 →', _cache.get('k'));

// （6）# 前缀：语言层面真正的私有字段（ES2022）。外部访问会直接报语法错误。
class BankAccount {
  #balance = 0; // 真私有字段，只能在类体内部访问
  deposit(amount) {
    this.#balance += amount;
    return this.#balance;
  }
  get balance() {
    return this.#balance;
  }
}
const account = new BankAccount();
account.deposit(100);
console.log('# 私有字段：account.balance =', account.balance);
console.log('  account.#balance 在类外访问会被解析器直接拒绝（SyntaxError），这才是"真私有"。');

// ---------------------------------------------------------------------------
// 6. 好名字 vs 坏名字：一组对照
// ---------------------------------------------------------------------------

console.log('\n--- 6. 坏名字的常见形态 ---');

// 坏例子（这里只作为字符串展示，不实际定义，避免真的把坏名字引入代码库）
const badExamples = [
  ['const d = new Date();', '单字母、无含义 → 应写成 createdAt / createdDate'],
  ['const lenght = 10;', '拼写错误 → length 一旦写错，全项目都会跟着错'],
  ['const usrPwdStr1 = "";', '缩写过度 + 数字后缀 → 应写成 userPassword'],
  ['const data2 = [];', '数字后缀毫无信息 → 应写成 activeUsers'],
  ['const flag = true;', 'flag 不说清是什么的 flag → 应写成 isEmailVerified'],
  ['const 用户 = {};', '语法合法，但混用语言会破坏工具链与检索 → 团队应统一英文'],
];

for (const [code, why] of badExamples) {
  console.log('  ' + code.padEnd(28) + ' → ' + why);
}

console.log('\n--- 7. 小结 ---');
console.log('· 标识符不能以数字开头，不能含 - 空格 @ 等符号；字母/下划线/美元符/Unicode 可以开头。');
console.log('· 大小写敏感，写错一个字母就是另一个变量。');
console.log('· 保留字不能作变量名，但可以作属性名（IdentifierName 比 Identifier 宽松）。');
console.log('· camelCase 变量与函数、PascalCase 类、UPPER_SNAKE_CASE 常量、is/has 前缀布尔。');
console.log('· 命名是免费的文档：好名字省下的时间，远超多想几秒钟的成本。');
console.log('· undefined / NaN / Infinity / arguments / eval 不是保留字，但绝对不要覆盖它们。');
