/**
 * ============================================================================
 * 知识点：== 、=== 、Object.is 的区别与 SameValueZero
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】进阶
 * 【前置知识】03_data_types/10_truthy_falsy.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JS 规范里其实有 4 套"相等"判定算法：
 *      · 抽象相等比较（==）  —— 会做类型转换，规则最复杂。
 *      · 严格相等比较（===） —— 不做类型转换；NaN !== NaN，+0 === -0。
 *      · SameValue（Object.is）—— 与 === 几乎相同，但 NaN 等于 NaN、
 *        +0 不等于 -0。用于属性描述符内部比较、不可变数据结构等场景。
 *      · SameValueZero —— 与 Object.is 相同，但 +0 等于 -0。
 *        它是"实际开发中最常用的隐式规则"：Map、Set、Array.prototype.includes
 *        全部使用 SameValueZero。
 *
 * 2. 为什么需要
 *    三个坑直接决定了你得选对运算符：
 *      · NaN === NaN 是 false → 想判断"是不是 NaN"必须用 Object.is 或 Number.isNaN。
 *      · +0 === -0 是 true → 想区分正负零只能用 Object.is。
 *      · == 的隐式转换有十条分支 → 工程上默认禁用 ==（唯一例外是 == null）。
 *    而 Map/Set 的键比较用的是 SameValueZero，所以 NaN 可以当 Map 键，
 *    这在缓存场景里非常有用。
 *
 * 3. 核心语法要点
 *    【== 的判定顺序】
 *      1) 类型相同 → 退化为 ===；
 *      2) null == undefined → true（规范特批，与其它任何值都不相等）；
 *      3) number 与 string → 字符串转成数字；
 *      4) bigint 与 string → 字符串按 BigInt 解析后比较；
 *      5) boolean 参与 → 先转成数字再比；
 *      6) object 与原始值 → 对象走 ToPrimitive 再比；
 *      7) 其它类型组合 → false。
 *    【=== 的规则】
 *      · 类型不同 → 直接 false，绝不转换。
 *      · 都是对象 → 比较引用是否同一个。
 *      · NaN === NaN → false。
 *      · +0 === -0 → true。
 *    【Object.is(a, b) 的规则】
 *      与 === 完全一致，只有两处不同：
 *        Object.is(NaN, NaN) → true
 *        Object.is(0, -0)    → false
 *    【SameValueZero(a, b) 的规则】
 *      与 Object.is 完全一致，只有一处不同：
 *        SameValueZero(0, -0) → true
 *      它没有直接暴露的全局函数，但可以通过
 *        arr.includes(x)  /  new Set().has(x)  /  new Map().has(x)
 *      间接观察。
 *
 * 4. 常见陷阱
 *    · [] === [] 是 false（两个不同引用），{} === {} 也是 false。
 *    · NaN 作为 Map 的键是可行的（SameValueZero），但用 indexOf 找不到它。
 *    · Set 里同时 add(0) 与 add(-0) 只会保留一个元素，且保留的是先插入的那个。
 *    · -0 作为属性键会被转成字符串 "0"，与 0 冲突。
 *    · Object.is 不能拿来做"深度相等"，它只比较一层，对象仍比引用。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/12_equality_samevalue.js
 *
 * 【预期输出】
 *   打印 == / === / Object.is 三者在同一批测试用例上的结果对照表、
 *   SameValueZero 在 Map / Set / includes 中的实际表现，以及选型建议。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 三者的结果对照表
// ---------------------------------------------------------------------------

console.log('--- 1. == / === / Object.is 对照表 ---');

// 每一项：[左值, 右值, 说明]
const cases = [
  [1, '1', '数字与字符串'],
  [0, '', '零与空串'],
  [0, false, '零与布尔假'],
  [null, undefined, 'null 与 undefined'],
  [null, 0, 'null 与零'],
  [undefined, 0, 'undefined 与零'],
  [NaN, NaN, 'NaN 与自己'],
  [0, -0, '正零与负零'],
  [1n, 1, 'BigInt 与 number'],
  ['abc', 'abc', '相同字符串'],
  [{}, {}, '两个不同的对象字面量'],
];

/** 把一个值渲染成带类型信息的短标签，避免"0 与 0"这种看不出区别的显示 */
function label(v) {
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'bigint') return v + 'n';
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return 'NaN';
    if (Object.is(v, -0)) return '-0'; // 用 Object.is 才能认出负零
    return String(v);
  }
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'object') return Array.isArray(v) ? '[]' : '{}';
  return String(v);
}

console.log('左值'.padEnd(12), '右值'.padEnd(12), '==', ' ', '===', ' ', 'Object.is', ' 说明');
console.log('-'.repeat(76));
for (const [a, b, desc] of cases) {
  console.log(
    label(a).padEnd(12),
    label(b).padEnd(12),
    String(a == b).padEnd(5),
    String(a === b).padEnd(6),
    String(Object.is(a, b)).padEnd(10),
    desc,
  );
}

// 同一对象引用时三者一致：
const shared = { v: 1 };
const sameRef = shared;
console.log('同一引用：shared == sameRef', shared == sameRef,
  '| ===', shared === sameRef,
  '| Object.is', Object.is(shared, sameRef));

// ---------------------------------------------------------------------------
// 2. 把三者实现成函数，直观理解差异
// ---------------------------------------------------------------------------

console.log('--- 2. 手写三种判定 ---');

/**
 * 严格相等（===）的等价实现。
 * 关键点：NaN 与任何值都不等；+0 与 -0 相等。
 */
function strictEqual(a, b) {
  if (typeof a !== typeof b) return false; // 类型不同直接 false
  if (typeof a === 'number') {
    if (Number.isNaN(a) || Number.isNaN(b)) return false; // NaN 恒不等
    return a === b; // 此时 +0 === -0 为 true，符合 === 语义
  }
  return a === b;
}

/**
 * Object.is 的等价实现。
 * 与 === 的差别只有两处：NaN 等于 NaN；+0 不等于 -0。
 */
function sameValue(a, b) {
  if (typeof a !== typeof b) return false;
  if (typeof a === 'number') {
    // 两个都是 NaN → 相等
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    // 一个为 +0 一个为 -0 → 不相等
    if (a === 0 && b === 0) return 1 / a === 1 / b;
    return a === b;
  }
  return a === b;
}

/**
 * SameValueZero 的等价实现。
 * 与 Object.is 的差别只有一处：+0 与 -0 相等。
 */
function sameValueZero(a, b) {
  if (typeof a !== typeof b) return false;
  if (typeof a === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    return a === b; // === 本身就让 +0 === -0 成立
  }
  return a === b;
}

const checkCases = [
  [NaN, NaN],
  [0, -0],
  [-0, 0],
  [1, 1],
  ['a', 'a'],
];
console.log('测试用例'.padEnd(18), 'strictEqual', 'sameValue(Object.is)', 'sameValueZero');
console.log('-'.repeat(72));
for (const [a, b] of checkCases) {
  // 复用上面定义的 label()，这样 -0 不会被显示成 0，NaN 也不会被显示成 undefined。
  const pair = `${label(a)} 与 ${label(b)}`;
  console.log(
    pair.padEnd(18),
    String(strictEqual(a, b)).padEnd(12),
    String(sameValue(a, b)).padEnd(21),
    String(sameValueZero(a, b)),
  );
}
// 与内置结果核对：
console.log('与内置实现核对（应全为 true）：');
console.log('  strictEqual(NaN, NaN) === (NaN === NaN)          →', strictEqual(NaN, NaN) === (NaN === NaN));
console.log('  sameValue(0, -0) === Object.is(0, -0)            →', sameValue(0, -0) === Object.is(0, -0));
console.log('  sameValueZero(0, -0) === (0 === -0)              →', sameValueZero(0, -0) === (0 === -0));

// ---------------------------------------------------------------------------
// 3. SameValueZero 在 Set 中的表现
// ---------------------------------------------------------------------------

console.log('--- 3. Set 使用 SameValueZero ---');

// NaN 在 Set 里只会存在一个 —— 因为 SameValueZero(NaN, NaN) 为 true。
const nanSet = new Set([NaN, NaN, NaN]);
console.log('new Set([NaN, NaN, NaN]).size =', nanSet.size, '← 只保留一个');
console.log('nanSet.has(NaN) =', nanSet.has(NaN), '← 能命中');

// 正负零在 Set 里也被视为同一个键。注意：Set.add 在插入时就会把 -0 规范化成 +0，
// 所以不论先插哪个，最终留下的都是 +0。
const zeroSet = new Set([0, -0]);
console.log('new Set([0, -0]).size =', zeroSet.size, '← 合并成一个');
console.log('保留下来的是：', Object.is([...zeroSet][0], -0) ? '-0' : '+0');

const negZeroFirst = new Set([-0, 0]);
console.log('先插入 -0 时保留的仍是：', Object.is([...negZeroFirst][0], -0) ? '-0' : '+0');
console.log('（规范规定 Set.prototype.add 会把 -0 统一存成 +0）');

// 对象做键时仍然比较引用，不是比较内容。
const keyA = { id: 1 };
const keyB = { id: 1 };
const objSet = new Set([keyA, keyB]);
console.log('内容相同但引用不同的两个对象做 Set 元素 → size =', objSet.size, '← 两个都进来了');
console.log('objSet.has({ id: 1 }) =', objSet.has({ id: 1 }), '← 新对象引用，找不到');
console.log('objSet.has(keyA)      =', objSet.has(keyA), '← 原引用才找得到');

// ---------------------------------------------------------------------------
// 4. SameValueZero 在 Map 中的表现
// ---------------------------------------------------------------------------

console.log('--- 4. Map 使用 SameValueZero ---');

// 用 NaN 当 Map 键是完全可行的，这在"缓存未命中的计算结果"时很有用。
const memo = new Map();
memo.set(NaN, '这是 NaN 对应的值');
memo.set(0, '这是 +0 对应的值');
console.log('memo.get(NaN) =', memo.get(NaN), '← 能取到');
console.log('memo.has(NaN) =', memo.has(NaN));
console.log('memo.size     =', memo.size, '← NaN 与 0 是两个不同的键');
console.log('memo.get(-0)  =', memo.get(-0), '← -0 命中 0 的条目（SameValueZero）');

// 对比：用普通对象做缓存时，所有键都会被强制转成字符串。
const plainCache = {};
plainCache[NaN] = 'NaN 键';
plainCache[-0] = '负零键';
plainCache[0] = '零键';
console.log('普通对象的键：', Object.keys(plainCache), '← NaN 与 -0 都被转成了字符串');
console.log('  -0 与 0 无法区分，后者覆盖前者：', plainCache[0]);
console.log('  NaN 变成了字符串键 "NaN"：', plainCache[NaN]);
console.log('  Map 则能区分 NaN 与 0、并保留 -0 的归一化语义 ← 这就是 Map 的优势');

// ---------------------------------------------------------------------------
// 5. includes 与 indexOf 的差异（SameValueZero vs ===）
// ---------------------------------------------------------------------------

console.log('--- 5. includes 与 indexOf ---');

const arr = [1, NaN, 0];
console.log('arr =', arr);
console.log('arr.includes(NaN) =', arr.includes(NaN), '← includes 用 SameValueZero，能找到');
console.log('arr.indexOf(NaN)  =', arr.indexOf(NaN), '← indexOf 用 ===，找不到');
console.log('arr.includes(-0)  =', arr.includes(-0), '← -0 命中元素 0');
console.log('arr.indexOf(-0)   =', arr.indexOf(-0), '← indexOf 也能命中，因为 0 === -0');
console.log('arr.includes("1") =', arr.includes('1'), '← 不做类型转换');
console.log('arr.includes(1)   =', arr.includes(1));

// 字符串的 includes 是子串查找，规则完全不同，注意区分。
console.log("'hello'.includes('ell') =", 'hello'.includes('ell'), '← 这是子串查找，不是相等比较');

// ---------------------------------------------------------------------------
// 6. 何时用哪一个：选型建议
// ---------------------------------------------------------------------------

console.log('--- 6. 选型建议 ---');

console.log('1) 绝大多数场景：用 ===（不做隐式转换，行为可预测）');
console.log("   例如：if (user.role === 'admin')");
console.log('2) 只在"判空"时用 == null（同时覆盖 null 与 undefined）：');
const maybe = null;
console.log('   maybe == null →', maybe == null, '（等价于 v === null || v === undefined）');
console.log('3) 判断 NaN：用 Number.isNaN 或 Object.is(v, NaN)');
console.log('   Object.is(NaN, NaN) →', Object.is(NaN, NaN));
console.log('4) 需要区分 +0 与 -0（如计算符号、图形学）：用 Object.is');
console.log('   Object.is(0, -0) →', Object.is(0, -0));
console.log('5) 查集合成员、去重：默认就是 SameValueZero，无需额外处理');
console.log('   new Set([NaN, NaN]).size →', new Set([NaN, NaN]).size);

// 一个综合小例子：用 Map 做带 NaN 安全的记忆化缓存。
console.log('--- 综合例子：NaN 安全的记忆化缓存 ---');
const cache = new Map();
/** 简单的记忆化：用参数本身作为键，依赖 SameValueZero 保证 NaN 也能命中 */
function memoize(fn) {
  return function memoized(arg) {
    if (cache.has(arg)) {
      console.log('  （缓存命中：' + String(arg) + '）');
      return cache.get(arg);
    }
    const value = fn(arg);
    cache.set(arg, value);
    return value;
  };
}
const slowSquare = memoize((x) => x * x);
console.log('slowSquare(4)   =', slowSquare(4));
console.log('slowSquare(4)   =', slowSquare(4));
console.log('slowSquare(NaN) =', slowSquare(NaN));
console.log('slowSquare(NaN) =', slowSquare(NaN), '← NaN 也能命中缓存');
console.log('缓存条目数 =', cache.size);

console.log('--- 完成：四种相等判定的区别与选型 ---');
