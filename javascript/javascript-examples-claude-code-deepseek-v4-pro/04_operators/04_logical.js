/**
 * ============================================================================
 * 知识点：逻辑运算符 —— && || ! 的短路求值与"返回操作数"特性
 * ============================================================================
 *
 * 【所属分类】04_operators —— 运算符与表达式
 * 【难度等级】入门
 * 【前置知识】04_operators/03_comparison.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 有三个逻辑运算符：
 *      &&  与（AND）
 *      ||  或（OR）
 *      !   非（NOT）
 *    它们都可作用于任意类型的值（不像某些语言只接受布尔值），
 *    并遵循"假值/真值"规则：假值只有 6 个 —— false、0、-0、0n、''、null、
 *    undefined、NaN（严格说是 8 个写法，本质是 6 类），其余一切都是真值。
 *
 * 2. 为什么需要
 *    逻辑运算符是分支与默认值的基础。更重要的是 JS 的 && 和 || 具有
 *    "短路求值"与"返回操作数本身"两大特性，这让大量惯用法成为可能：
 *      - 默认值：const name = input || 'anonymous'
 *      - 条件执行：isReady && start()
 *      - 安全取值：user && user.profile && user.profile.avatar
 *
 * 3. 核心语法要点
 *    【短路求值】
 *      a && b：a 为假值 => 直接返回 a，b 根本不会被求值
 *      a || b：a 为真值 => 直接返回 a，b 根本不会被求值
 *    【返回的是操作数，不是布尔值】
 *      a && b：a 为假值返回 a；否则返回 b
 *      a || b：a 为真值返回 a；否则返回 b
 *      所以 'a' && 'b' === 'b'，0 || 'x' === 'x'，而不是 true。
 *    【! 取反并转布尔】
 *      !x 先把 x 转成布尔再取反，结果一定是 true / false。
 *      !!x 是"转成布尔值"的常用简写，等价于 Boolean(x)。
 *    【优先级】!  >  &&  >  ||
 *
 * 4. 常见陷阱
 *    - 用 || 提供默认值时，0、''、false、NaN 都会被当成"没有值"而覆盖掉，
 *      这类场景要用 ?? （见 05_nullish_coalescing.js）。
 *    - && / || 返回的不是布尔值，所以 `if (a && b)` 里的值可能不是 true，
 *      在需要严格布尔值时用 Boolean(...) 包一层。
 *    - 短路会"跳过求值"，如果右侧表达式有副作用（如自增、函数调用），
 *      就要清楚它到底有没有执行。
 *    - ! 的优先级高于比较运算符：!a === b 实际是 (!a) === b，想表达"不等于"请写 a !== b。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 04_operators/04_logical.js
 *
 * 【预期输出】
 *   依次打印假值清单、&& 与 || 的返回值表、短路求值的副作用验证、
 *   ! 与 !! 的行为，以及短路在真实代码中的惯用写法。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 假值清单：只有这些会被当成 false
// ---------------------------------------------------------------------------

console.log('--- 1. 假值（falsy）清单 ---');

const falsyValues = [false, 0, -0, 0n, '', null, undefined, NaN];
for (const v of falsyValues) {
  // String(v) 是为了让 Symbol 之类不可直接打印的值也能安全输出
  console.log(`${String(v)} 是假值吗？`, Boolean(v) === false);
}

// 注意这些"看起来像空"的东西其实都是真值
console.log("[] 是真值吗？", Boolean([])); // true（空数组也是真值）
console.log('{} 是真值吗？', Boolean({})); // true（空对象也是真值）
console.log("'0' 是真值吗？", Boolean('0')); // true（非空字符串都是真值）
console.log("'false' 是真值吗？", Boolean('false')); // true

// ---------------------------------------------------------------------------
// 2. && 与 || 返回的是"操作数"，不是布尔值
// ---------------------------------------------------------------------------

console.log('\n--- 2. 返回值是操作数本身 ---');

// || ：左边为真值就返回左边，否则返回右边
console.log("'hello' || '默认' =", 'hello' || '默认'); // 'hello'
console.log("'' || '默认' =", '' || '默认'); // '默认'
console.log('0 || 100 =', 0 || 100); // 100
console.log('42 || 100 =', 42 || 100); // 42（不是 true！）

// && ：左边为假值就返回左边，否则返回右边
console.log("'hello' && 'world' =", 'hello' && 'world'); // 'world'
console.log("'' && 'world' =", '' && 'world'); // ''（直接返回空字符串）
console.log('0 && 100 =', 0 && 100); // 0
console.log('true && 42 =', true && 42); // 42（不是 true！）

// 用 typeof 验证类型，说明它们没做布尔转换
console.log("typeof ('a' || 'b') =", typeof ('a' || 'b')); // string
console.log("typeof (1 && 2) =", typeof (1 && 2)); // number

// 需要真正的布尔值时，包一层 Boolean
console.log("Boolean('a' || 'b') =", Boolean('a' || 'b')); // true

// ---------------------------------------------------------------------------
// 3. 短路求值：右侧可能完全不被执行
// ---------------------------------------------------------------------------

console.log('\n--- 3. 短路求值 ---');

// 用带副作用的函数来证明"右侧到底有没有被求值"
function sideEffect(label) {
  console.log(`    >>> "${label}" 被求值了`);
  return label;
}

console.log('执行：false && sideEffect("右1")');
const r1 = false && sideEffect('右1'); // 右侧不会打印
console.log('  结果 =', r1); // false

console.log('执行：true || sideEffect("右2")');
const r2 = true || sideEffect('右2'); // 右侧不会打印
console.log('  结果 =', r2); // true

console.log('执行：true && sideEffect("右3")');
const r3 = true && sideEffect('右3'); // 右侧会打印
console.log('  结果 =', r3); // '右3'

console.log('执行：false || sideEffect("右4")');
const r4 = false || sideEffect('右4'); // 右侧会打印
console.log('  结果 =', r4); // '右4'

// 短路在真实场景中的价值：用一个便宜的判断挡住一个昂贵的（或会报错的）操作
const cache = { user: null };
// 如果 cache.user 是 null，后面的 .name 就会被跳过，不会抛错
console.log('cache.user && cache.user.name =', cache.user && cache.user.name); // null

// ---------------------------------------------------------------------------
// 4. ! 与 !!：取反与转布尔
// ---------------------------------------------------------------------------

console.log('\n--- 4. ! 与 !! ---');

// ! 会把操作数转成布尔值再取反，优先级高于 && 和 ||
console.log('!true =', !true); // false
console.log("!'' =", !''); // true
console.log('!0 =', !0); // true
console.log('![] =', ![]); // false（空数组是真值）
console.log('!null =', !null); // true

// !! 就是"求布尔值"，等价于 Boolean()
console.log("!!'' =", !!''); // false
console.log("!!'x' =", !!'x'); // true
console.log('!!0 =', !!0); // false
console.log('!!42 =', !!42); // true
console.log('!!undefined =', !!undefined); // false

// 优先级陷阱：! 的优先级高于 ===，所以下面这句并不是"a 不等于 b"
const a = 0;
const b = false;
// !a === b 会被解析成 (!a) === b，即 true === false，结果是 false
console.log('!a === b 实际按 (!a) === b 解析 =>', !a === b); // false
console.log('加上括号表达同样语义：(!a) === b =>', (!a) === b); // false
// 想要"不相等"，正确写法是比较运算符 !==
console.log("a !== b 才是'不相等' =>", a !== b); // true（0 与 false 类型不同）

// ---------------------------------------------------------------------------
// 5. 真实代码中的惯用写法
// ---------------------------------------------------------------------------

console.log('\n--- 5. 惯用写法 ---');

// 写法一：默认值（注意：0 / '' / false 会被覆盖，见 05_nullish_coalescing.js）
function greet(name) {
  const finalName = name || '访客';
  return `你好，${finalName}`;
}
console.log("greet('') =", greet('')); // 你好，访客
console.log("greet('小明') =", greet('小明')); // 你好，小明

// 写法二：条件执行（只有条件成立才调用函数）
let logCount = 0;
const log = (msg) => {
  logCount += 1;
  console.log('   [日志]', msg);
};
const DEBUG = true;
DEBUG && log('调试信息会被打印'); // 条件为真 => 执行
const DEBUG_OFF = false;
DEBUG_OFF && log('这行不会打印');
console.log('   log 实际被调用了', logCount, '次'); // 1

// 写法三：链式安全取值（可选链 ?. 的老写法，新代码推荐用 ?. ）
const response = { data: { items: [] } };
const count = (response && response.data && response.data.items && response.data.items.length) || 0;
console.log('链式 && 提取嵌套属性 =', count); // 0

// 写法四：多个条件兜底，返回第一个"有值"的
function pickLabel(...candidates) {
  for (const c of candidates) {
    const v = c || null;
    if (v) return v;
  }
  return '未知';
}
console.log("pickLabel('', null, '有值', '后面忽略') =", pickLabel('', null, '有值', '后面忽略')); // '有值'

// 写法五：用逻辑运算符做"函数参数默认值"的补充（配合 ?? 更安全）
function formatPrice(price, currency) {
  const cur = currency || 'CNY';
  return `${cur} ${price}`;
}
console.log('formatPrice(19.9) =', formatPrice(19.9)); // CNY 19.9

console.log('\n全部演示结束。');
