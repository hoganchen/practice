/**
 * ============================================================================
 * 知识点：字符串比较 —— 字典序、localeCompare、本地化排序
 * ============================================================================
 *
 * 【所属分类】11_strings —— 字符串
 * 【难度等级】进阶
 * 【前置知识】11_strings/09_unicode_and_codepoints.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    字符串比较有两条完全不同的路径：
 *      a) 运算符比较（< > <= >=）与 ===：按 UTF-16 码元值逐位比较，与语言无关。
 *      b) localeCompare：按某个人类语言的排序规则比较，返回负数/0/正数。
 *    两者结果常常不一致，选错会得到"对程序员正确、对用户荒谬"的排序。
 *
 * 2. 为什么需要
 *    - 排序通讯录、文件列表、商品名称时，用户期望的是"字典序"而不是"编码序"
 *    - 中文按拼音排序、德语的 ä 等价于 ae、法语忽略重音 —— 这些只有 localeCompare 能处理
 *    - 排序数字字符串时希望 '10' 排在 '9' 之后，需要 localeCompare 的 numeric 选项
 *    - 大小写不敏感的排序：希望 Apple 和 apple 相邻，而不是分处字母表两端
 *
 * 3. 核心语法要点
 *    - 运算符比较规则：从左往右逐位比较码元值，先出现差异的那一位决定结果；
 *      若一方是另一方的前缀，则短的小（'ab' < 'abc'）。
 *    - 码元值顺序的后果：数字 < 大写字母 < 小写字母。
 *      '0'~'9' 是 48~57，'A'~'Z' 是 65~90，'a'~'z' 是 97~122。
 *    - str.localeCompare(other, locales, options) 返回：
 *        负数 → str 应排在 other 前面（str 较小）
 *        0    → 二者在该语言规则下视为相等
 *        正数 → str 应排在 other 后面
 *    - 常用 options：
 *        numeric: true      数字按数值大小比较（'2' < '10'）
 *        sensitivity         'base'（忽略大小写与重音）/ 'accent' / 'case' / 'variant'
 *        caseFirst          'upper' / 'lower' / 'false'（默认）
 *        ignorePunctuation  true 时忽略标点
 *    - 大量比较时应预先构造 Intl.Collator 实例并调用它的 compare 方法，
 *      它内部缓存了排序表，比每次调用 localeCompare 快得多。
 *    - 相等判断永远用 ===（或 Object.is），不要用 localeCompare(a,b) === 0
 *      来做"内容完全相同"的判断，因为它可能把不同字符串判为等价。
 *
 * 4. 常见陷阱
 *    - 'Z' < 'a' 为 true（65 < 97），而用户期望的是 A 和 a 相邻。
 *    - '10' < '9' 为 true（'1' < '9'），数字字符串排序得到 1,10,2,3... 需要 numeric。
 *    - 数组的默认 sort() 不带比较函数时，会把元素转成字符串再按码元排序，
 *      所以 [1, 2, 10].sort() 得到 [1, 10, 2]。
 *    - localeCompare 不传 locales 时使用运行环境的默认语言，跨机器结果可能不同，
 *      需要确定性时应显式指定，如 'zh-Hans-CN'。
 *    - 看起来相同的字符串可能因 Unicode 规范化形式不同而 === 失败（见 09 号文件）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 11_strings/11_string_comparison.js
 *
 * 【预期输出】
 *   对比码元序与本地化排序的差异，并演示 numeric、sensitivity、Collator 的用法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 运算符比较：UTF-16 码元序
// ---------------------------------------------------------------------------

console.log('--- 1. 码元序比较 ---');

// 同长度、同为小写字母时，码元序与字典序一致
console.log("'apple' < 'banana'：", 'apple' < 'banana'); // true
console.log("'apple' < 'apples'：", 'apple' < 'apples'); // true，短的是前缀时更小
console.log("'abc' === 'abc'：", 'abc' === 'abc'); // true
console.log("'abc' === 'ABC'：", 'abc' === 'ABC'); // false，大小写敏感

// 关键差异：大写字母的码元值小于小写字母
console.log("\n'A' 的码元：", 'A'.charCodeAt(0)); // 65
console.log("'Z' 的码元：", 'Z'.charCodeAt(0)); // 90
console.log("'a' 的码元：", 'a'.charCodeAt(0)); // 97

console.log("'Z' < 'a'：", 'Z' < 'a'); // true ← 编码上正确，感觉上别扭
console.log("'Zebra' < 'apple'：", 'Zebra' < 'apple'); // true

// 数字字符也在字母之前
console.log("'1' 的码元：", '1'.charCodeAt(0)); // 49
console.log("'9' < 'A'：", '9' < 'A'); // true

// 中文按码元（基本等于 Unicode 码点顺序，不是拼音顺序）
console.log("\n'一' 的码元：", '一'.charCodeAt(0)); // 19968
console.log("'二' 的码元：", '二'.charCodeAt(0)); // 20108
console.log("'一' < '二'：", '一' < '二'); // true（恰好如此，但不是拼音顺序）
console.log("'中' < '一'：", '中' < '一'); // false，'中' 是 20013，'一' 是 19968
// 结论：码元序排中文得到的顺序"看起来像随机的"，绝不能用来给中文排序
console.log('码元序排序：', JSON.stringify(['中', '一', '二'].sort()));

// 数字字符串的排序陷阱
const numbers = ['10', '9', '2', '1', '100'];
console.log('\n数字字符串：', JSON.stringify(numbers));
console.log('默认码元序排序：', JSON.stringify([...numbers].sort())); // 1,10,100,2,9
console.log('数值排序：', JSON.stringify([...numbers].sort((a, b) => Number(a) - Number(b))));

// ---------------------------------------------------------------------------
// 2. localeCompare 基础
// ---------------------------------------------------------------------------

console.log('--- 2. localeCompare 基础 ---');

// 返回值是负数/0/正数，表示"排在前面/相等/排在后面"
console.log("'apple'.localeCompare('banana')：", 'apple'.localeCompare('banana')); // 负数
console.log("'banana'.localeCompare('apple')：", 'banana'.localeCompare('apple')); // 正数
console.log("'apple'.localeCompare('apple')：", 'apple'.localeCompare('apple')); // 0

// 用符号函数把返回值规整成 -1 / 0 / 1，便于展示
const cmp = (a, b, locales, options) => Math.sign(a.localeCompare(b, locales, options));

// 大小写：Node 的默认敏感度是 variant，'a' 与 'A' 会被判为不同，a 排在 A 前
console.log("\ncmp('a','A')（默认敏感度 variant）：", cmp('a', 'A')); // -1
console.log("'a' < 'A'（运算符）：", 'a' < 'A'); // false（97 > 65）
console.log('注意两种方式的"大小写顺序"相反：localeCompare 让 a 在 A 前，运算符让 A 在 a 前');

// 用 sensitivity 控制敏感度
console.log("\ncmp('a','A', undefined, {sensitivity:'base'})：", cmp('a', 'A', undefined, { sensitivity: 'base' })); // 0
console.log("cmp('a','A', undefined, {sensitivity:'case'})：", cmp('a', 'A', undefined, { sensitivity: 'case' })); // 负数
console.log("cmp('a','A', undefined, {sensitivity:'accent'})：", cmp('a', 'A', undefined, { sensitivity: 'accent' })); // 0
console.log("cmp('a','A', undefined, {sensitivity:'variant'})：", cmp('a', 'A', undefined, { sensitivity: 'variant' })); // 负数

// 重音：'é' 与 'e' 在 base/accent 下的表现
console.log("\ncmp('e','é')（默认）：", cmp('e', 'é')); // 负数
console.log("cmp('e','é', undefined, {sensitivity:'base'})：", cmp('e', 'é', undefined, { sensitivity: 'base' })); // 0

// ---------------------------------------------------------------------------
// 3. numeric：数字按数值比较
// ---------------------------------------------------------------------------

console.log('--- 3. numeric 选项 ---');

const fileNames = ['file10.txt', 'file2.txt', 'file1.txt', 'file20.txt'];
console.log('原始顺序：', JSON.stringify(fileNames));
// 不带 numeric 时按字符比较，file10 会排在 file2 前面
console.log(
  'localeCompare 默认：',
  JSON.stringify([...fileNames].sort((a, b) => a.localeCompare(b))),
);
// 带 numeric 后按数值大小比较，这才是用户期望的结果
console.log(
  'localeCompare + numeric：',
  JSON.stringify([...fileNames].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))),
);

// 与纯数值排序对比
console.log(
  '纯数值排序：',
  JSON.stringify([...fileNames].sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4)))),
);

// 混合了文字与数字的版本号排序
const versions = ['v1.9.0', 'v1.10.0', 'v1.2.0'];
console.log(
  '\n版本号排序：',
  JSON.stringify([...versions].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))),
);

// ---------------------------------------------------------------------------
// 4. 中文排序
// ---------------------------------------------------------------------------

console.log('--- 4. 中文排序 ---');

const chineseNames = ['张三', '李四', '王五', '赵六', '阿七'];
console.log('原始：', JSON.stringify(chineseNames));
// 默认码元序（按 Unicode 码点，不是拼音）
console.log('码元序排序：', JSON.stringify([...chineseNames].sort()));
// 按拼音排序才是用户期望的通讯录顺序
console.log(
  '拼音排序（zh）：',
  JSON.stringify([...chineseNames].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))),
);

// sort 的默认行为等价于比较时把元素转成字符串再按码元比较
console.log('\n[1, 2, 10].sort()：', JSON.stringify([1, 2, 10].sort())); // [1,10,2] ← 陷阱
console.log('[1, 2, 10].sort(数值)：', JSON.stringify([1, 2, 10].sort((a, b) => a - b)));

// ---------------------------------------------------------------------------
// 5. Intl.Collator：批量比较的正确姿势
// ---------------------------------------------------------------------------

console.log('--- 5. Intl.Collator ---');

// Collator 把排序规则（语言、选项）预先编译好，多次比较时性能更好
const collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' });

const products = ['商品12', '商品2', '商品1', '商品21'];
console.log('原始：', JSON.stringify(products));
// 直接用 collator.compare 当排序函数
console.log('Collator 排序：', JSON.stringify([...products].sort(collator.compare)));

// 也可以直接用 resolvedOptions 查看实际生效的规则
console.log('实际生效的规则：', JSON.stringify(collator.resolvedOptions()));

// 用 Collator 做大小写不敏感的相等判断
const ciCollator = new Intl.Collator('en', { sensitivity: 'base' });
console.log("\nciCollator.compare('Hello', 'hello')：", ciCollator.compare('Hello', 'hello')); // 0
console.log("ciCollator.compare('Hello', 'world')：", ciCollator.compare('Hello', 'world')); // 负数

// 简单的大小写不敏感比较可以用 toLowerCase，但受语言影响时要用 Collator
console.log("toLowerCase 比较：", 'Hello'.toLowerCase() === 'hello'.toLowerCase()); // true

// 忽略标点
const punctCollator = new Intl.Collator('en', { ignorePunctuation: true });
console.log(
  "\n忽略标点比较 'a.b' vs 'ab'：",
  punctCollator.compare('a.b', 'ab'),
); // 0，标点被忽略

// caseFirst 控制"字母相同、只有大小写不同"时谁排在前面。
// 注意：只有当两个词的字母部分完全相同时才会用到它，
// 所以例子必须挑 'Apple' / 'apple' 这种"仅大小写不同"的配对。
const upperFirst = new Intl.Collator('en', { caseFirst: 'upper', sensitivity: 'case' });
const lowerFirst = new Intl.Collator('en', { caseFirst: 'lower', sensitivity: 'case' });
const words = ['apple', 'Apple', 'banana', 'Banana'];
console.log('\n原始：', JSON.stringify(words));
console.log('caseFirst=upper：', JSON.stringify([...words].sort(upperFirst.compare)));
console.log('caseFirst=lower：', JSON.stringify([...words].sort(lowerFirst.compare)));
console.log('默认 caseFirst=false：', JSON.stringify([...words].sort(new Intl.Collator('en').compare)));

// ---------------------------------------------------------------------------
// 6. 实战：多字段排序
// ---------------------------------------------------------------------------

console.log('--- 6. 实战：多字段排序 ---');

// 先按城市（拼音）排，城市相同再按年龄数值排
const people = [
  { name: '张三', city: 'Beijing' },
  { name: '李四', city: '上海' },
  { name: '王五', city: 'Beijing' },
  { name: '赵六', city: '上海' },
];

const cityCollator = new Intl.Collator('zh-Hans-CN');
const sorted = [...people].sort((a, b) => {
  // 第一个字段：城市，用本地化比较
  const byCity = cityCollator.compare(a.city, b.city);
  // 结果不为 0 说明已经分出胜负，直接返回
  if (byCity !== 0) return byCity;
  // 第二个字段：姓名
  return cityCollator.compare(a.name, b.name);
});
console.log('多字段排序结果：');
for (const p of sorted) {
  console.log(`  ${p.city.padEnd(10)} ${p.name}`);
}

// ---------------------------------------------------------------------------
// 7. 相等判断的正确做法
// ---------------------------------------------------------------------------

console.log('--- 7. 相等判断 ---');

// "内容完全相同"永远用 ===
console.log("'abc' === 'abc'：", 'abc' === 'abc'); // true

// 不要用 localeCompare 的结果做"完全相同"判断，因为它的"相等"是按语言规则判的
const a = 'a';
const b = 'A';
console.log(`'${a}' === '${b}'：`, a === b); // false（内容确实不同）
console.log(`忽略大小写比较 '${a}' vs '${b}'：`, ciCollator.compare(a, b) === 0); // true
// 也就是说：localeCompare === 0 表示"按当前规则视作等价"，不是"内容一模一样"

// Unicode 规范化后再比较，避免视觉相同但编码不同（详见 09 号文件）
// 'é' 有两种写法：单个码点 U+00E9（预组合），或 'e' + U+0301（组合重音）
const u1 = 'é'; // 预组合：1 个码点
const u2 = 'e\u{301}'; // 分解形式：e + 组合重音，共 2 个码点
console.log('\nu1 长度：', u1.length, '| u2 长度：', u2.length); // 1 和 2
console.log('规范化前 ===：', u1 === u2); // false ← 肉眼一样但不相等
console.log('规范化后 ===：', u1.normalize('NFC') === u2.normalize('NFC')); // true
// localeCompare 会自动处理这种差异，所以它返回 0
console.log('localeCompare：', u1.localeCompare(u2) === 0); // true

// 排序时的稳定兜底：先按语言规则比较，规则认为相等时再用码元序打破平局。
// 这样即使输入里存在"语言规则下等价"的元素，排序结果也完全确定、可复现。
function makeStableCompare(locales, options) {
  const collator = new Intl.Collator(locales, options);
  return (x, y) => {
    const r = collator.compare(x, y);
    if (r !== 0) return r;
    // 语言规则判为等价，退回码元序（'A' < 'a'）保证唯一确定的顺序
    return x < y ? -1 : x > y ? 1 : 0;
  };
}

const tie = ['a', 'B', 'A', 'b'];
// sensitivity:'base' 忽略大小写，于是 a/A 等价、b/B 等价，比较结果出现大量 0。
// 此时只靠 collator 只能得到"稳定的相对顺序"（取决于输入顺序），不够确定。
const baseOnly = new Intl.Collator('en', { sensitivity: 'base' });
console.log('\n原始顺序：', JSON.stringify(tie));
console.log('仅 base 规则：', JSON.stringify([...tie].sort(baseOnly.compare)));
console.log('加码元兜底：', JSON.stringify([...tie].sort(makeStableCompare('en', { sensitivity: 'base' }))));

console.log('\n全部演示完毕。');
