/**
 * ============================================================================
 * 知识点：解构默认值 —— 仅在 undefined 时生效，以及默认值的求值时机
 * ============================================================================
 *
 * 【所属分类】10_destructuring —— 解构赋值
 * 【难度等级】进阶
 * 【前置知识】10_destructuring/01_object_destructuring.js、10_destructuring/02_array_destructuring.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    解构时可以给变量写默认值，语法是 `变量 = 表达式`：
 *      const { a = 1 } = obj;      // 对象解构默认值
 *      const [x = 1] = arr;        // 数组解构默认值
 *    触发条件是**极严格的**：只有当取到的值严格等于 undefined 时，才使用默认值。
 *
 * 2. 为什么需要
 *    解构一个"字段可能没传"的对象时，如果不用默认值，变量就是 undefined，
 *    后续计算会变成 NaN 或抛错。默认值让"兜底逻辑"写在取值的地方，
 *    比在函数体里写一堆 if 判断清晰得多。
 *
 * 3. 核心语法要点
 *    (1) 触发条件：仅 undefined。null / 0 / '' / false / NaN 都**不触发**。
 *    (2) 求值时机：默认值表达式是**惰性求值**的——只有真的需要用到它时才会执行。
 *        这一点很重要：默认值里可以写有副作用的表达式（如函数调用、new Date()），
 *        不会造成浪费。
 *    (3) 求值顺序：从左到右依次处理，所以后面的默认值可以引用前面已经解构出的变量。
 *    (4) 默认值可以是任意表达式：字面量、函数调用、对象/数组字面量、甚至解构本身。
 *    (5) 默认值表达式在"当前作用域"里求值，可以访问外层的变量。
 *    (6) 对象解构的"整层默认值"（{ a = {} }）与"深层字段默认值"（{ a: { b = 1 } = {} }）
 *        是两回事，要分清。
 *    (7) 默认值里如果抛错（比如调用了可能抛错的函数），错误会正常传播出去。
 *
 * 4. 常见陷阱
 *    (1) 以为默认值能兜住 null —— 不能，这是最大的误区。
 *        想兜住 null 要用 `?? 默认值` 或先转换。
 *    (2) 以为默认值每次解构都会求值 —— 惰性求值意味着"用不到就不执行"，
 *        所以不要指望它做初始化副作用。
 *    (3) 默认值里引用了后面才声明的变量（TDZ），会抛 ReferenceError。
 *    (4) 默认值对象是"每次求值都新建"的，不要指望两次解构拿到同一个对象。
 *    (5) 深层的默认值分不清层级：想给深层字段兜底，必须每一层都写默认值。
 *    (6) 用默认值 + 剩余元素时容易搞混顺序：rest 元素不能有默认值语法。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 10_destructuring/04_default_values.js
 *
 * 【预期输出】
 *   分 6 个小节，逐项验证"仅 undefined 触发"与"惰性求值"两大规则。
 * ============================================================================
 */

console.log('--- 1. 唯一的触发条件：严格等于 undefined ---');

// 构造一个覆盖各种"假值"的对象
const settings = {
  isUndefined: undefined,
  isNull: null,
  isZero: 0,
  isEmptyString: '',
  isFalse: false,
  isNaN: NaN,
  isEmptyArray: [],
  isEmptyObject: {},
};

const {
  isUndefined = '【触发了默认值】',
  isNull = '【触发了默认值】',
  isZero = '【触发了默认值】',
  isEmptyString = '【触发了默认值】',
  isFalse = '【触发了默认值】',
  isNaN: nanValue = '【触发了默认值】',
  isEmptyArray = '【触发了默认值】',
  isEmptyObject = '【触发了默认值】',
  notExist = '【触发了默认值】',
} = settings;

console.log('字段值        实际结果              是否触发默认值');
const rows = [
  ['undefined', isUndefined],
  ['null', isNull],
  ['0', isZero],
  ["''", isEmptyString],
  ['false', isFalse],
  ['NaN', nanValue],
  ['[]', isEmptyArray],
  ['{}', isEmptyObject],
  ['（不存在）', notExist],
];
for (const [label, value] of rows) {
  const triggered = value === '【触发了默认值】';
  const shown = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
  console.log(`   ${label.padEnd(12)} ${shown.padEnd(22)} ${triggered ? '是' : '否'}`);
}

// 用 Object.is 精确验证 NaN 的情况：解构出来的是 NaN，不是默认值。
console.log('\n用 Object.is 验证 NaN 未被替换 =', Object.is(nanValue, NaN));

console.log('\n--- 2. 想兜住 null，得用 ?? ---');

const payload = { nickname: null, count: 0, remark: undefined };

// 单纯写默认值：null 会漏过去
const { nickname = '匿名', count = 100, remark = '无备注' } = payload;
console.log('只用默认值：');
console.log('   nickname =', nickname, '（null 漏过去了）');
console.log('   count    =', count, '（0 保持，这通常是对的）');
console.log('   remark   =', remark, '（undefined 被兜住）');

// 方案一：先解构再 ?? 兜底，语义最清晰
const { nickname: rawNickname, count: rawCount, remark: rawRemark } = payload;
console.log('解构 + ?? 兜底：');
console.log('   nickname =', rawNickname ?? '匿名');
console.log('   count    =', rawCount ?? 100, '（0 被保留，正确）');
console.log('   remark   =', rawRemark ?? '无备注');

// 方案二：解构 + 立即用 ?? 兜底——写成两步，先解构再兜底，语义最清楚
const { nickname: rawN } = payload;
const nickname2 = rawN ?? '匿名';
console.log('   解构后再 ?? 的写法 =', nickname2);

// 注意下面这种"在默认值位置写 ?? "的写法是**错的**，不会生效：
const { nickname: trapNickname = payload.nickname ?? '匿名' } = payload;
console.log('   在默认值位置写 ?? 的结果 =', trapNickname, '（仍是 null，因为默认值根本没被求值）');

// 方案三：写一个"空值清洗"的小工具，把 null 统一转成 undefined 再交给默认值
const nullToUndefined = (v) => (v === null ? undefined : v);
const cleaned = { nickname: nullToUndefined(payload.nickname), count: nullToUndefined(payload.count) };
const { nickname: cleanedNickname = '匿名', count: cleanedCount = 100 } = cleaned;
console.log('   清洗后 nickname =', cleanedNickname, '，count =', cleanedCount, '（0 依然被保留）');

console.log('\n--- 3. 默认值是惰性求值：用不到就不执行 ---');

// 用一个会打印日志的函数来观察"默认值何时被求值"
let evalCount = 0;
function makeDefault(label) {
  evalCount += 1;
  console.log(`   >> 默认值表达式被求值了：${label}（第 ${evalCount} 次）`);
  return `${label}-的默认值`;
}

console.log('情况一：字段有值，默认值不应该被求值');
const hasValue = { a: '我已有值' };
const { a: lazyA = makeDefault('a') } = hasValue;
console.log('   a =', lazyA, '，此时求值次数 =', evalCount);

console.log('情况二：字段缺失，默认值被求值');
const noValue = {};
const { b: lazyB = makeDefault('b') } = noValue;
console.log('   b =', lazyB, '，此时求值次数 =', evalCount);

console.log('情况三：字段存在但值是 null，默认值同样不被求值');
const nullValue = { c: null };
const { c: lazyC = makeDefault('c') } = nullValue;
console.log('   c =', lazyC, '，此时求值次数 =', evalCount, '（说明没被求值）');

console.log('情况四：连续多个默认值，按书写顺序从左到右求值');
const { d: lazyD = makeDefault('d'), e: lazyE = makeDefault('e'), f: lazyF = makeDefault('f') } = {};
console.log('   d/e/f =', lazyD, lazyE, lazyF, '，最终求值次数 =', evalCount);

// 惰性求值的实用意义：默认值里可以放心调用开销大的操作
const heavyDefault = () => {
  console.log('   >> 执行了一个"开销较大"的初始化');
  return { items: [] };
};
const withHeavy = { config: { items: [1] } };
const { config: heavyConfig = heavyDefault() } = withHeavy;
console.log('config 已存在时不触发重初始化 =', JSON.stringify(heavyConfig));

console.log('\n--- 4. 求值顺序：后面的默认值可以引用前面的变量 ---');

const sizes = { width: 100 };

// 从左到右依次求值，所以 height 的默认值里可以用已经解构出来的 width
const { width, height = width * 2, area = (width * height) / 2 } = sizes;
console.log('width =', width, '，height =', height, '（用了前面的 width）');
console.log('area  =', area, '（用了前面的 width 和 height）');

// 数组解构同理
const [arrA = 1, arrB = arrA + 1, arrC = arrB + 1] = [];
console.log('数组解构的链式默认值 =', arrA, arrB, arrC);

// 陷阱：默认值里引用了"后面才解构"的变量，会撞上暂时性死区（TDZ）
try {
  const demo = () => {
    // p 的默认值里引用了 q，但 q 还没被初始化
    const { p = q } = {};
    // eslint-disable-next-line no-use-before-define
    const { q = 1 } = {};
    return [p, q];
  };
  console.log(demo());
} catch (err) {
  console.log('引用后面变量的默认值报错：', err.name, '-', err.message.slice(0, 50), '...');
}
console.log('（结论：默认值里只能引用"左边已经求值过"的变量，或外层作用域的变量）');

console.log('\n--- 5. 默认值求值出的对象是"每次新建"的 ---');

// 默认值是对象/数组字面量时，每次解构都会新建一个。
function makeConfig({ options = { retries: 3 }, list = [] } = {}) {
  return { options, list };
}

const run1 = makeConfig();
const run2 = makeConfig();
console.log('两次调用拿到的默认对象是同一个吗 =', run1.options === run2.options, '（不是，每次新建）');
console.log('两次调用拿到的默认数组是同一个吗 =', run1.list === run2.list, '（不是，每次新建）');
console.log('两次的内容是一样的 =', JSON.stringify(run1.options) === JSON.stringify(run2.options));

// 正向意义：不用担心"默认值被前一次调用改脏了"
run1.list.push('我被 push 了');
console.log('改 run1.list 后 run2.list =', JSON.stringify(run2.list), '（互不影响，这是好事）');

// 反向陷阱：如果默认值是"外部共享的对象"，就会共享
const sharedDefault = { retries: 3 };
function makeConfigShared({ options = sharedDefault } = {}) {
  return options;
}
const s1 = makeConfigShared();
const s2 = makeConfigShared();
console.log('把默认值写成外部变量时 =', s1 === s2, '（共享了！改一个会影响另一个）');
console.log('所以默认值推荐写成"字面量"，而不是"外部可变对象"');

console.log('\n--- 6. 深层默认值要分层写，以及 rest 与默认值的关系 ---');

const deepSource = { a: { b: { c: undefined } } };

// 只想给最深的 c 兜底：中间每一层都要写上默认值，否则中间层缺失时会抛错
const { a: { b: { c: deepC = '深层兜底' } = {} } = {} } = deepSource;
console.log('深层字段默认值 =', deepC);

// 中间层整个缺失也能扛住
const emptySource = {};
const { a: { b: { c: deepC2 = '深层兜底2' } = {} } = {} } = emptySource;
console.log('中间层全缺失时 =', deepC2);

// 陷阱：只给最内层默认值，中间层缺失会抛错
try {
  const { x: { y = 1 } } = {}; // x 是 undefined，且没有 = {}，直接炸
  console.log(y);
} catch (err) {
  console.log('只给最内层默认值时报错：', err.name, '-', err.message.slice(0, 40), '...');
}

// 数组层的默认值同理，要一层层给
const arrDefaultSource = { list: undefined };
const { list: [first = '第一项默认'] = [] } = arrDefaultSource;
console.log('\n数组层默认值 =', first);

// rest 元素不能写默认值（语法错误），但它天然是"空数组"而不是 undefined
const [head, ...rest] = [1];
console.log('rest 永远是数组 =', JSON.stringify(rest), '，isArray =', Array.isArray(rest));
const { ...restProps } = { only: 1 };
console.log('对象 rest 永远是对象 =', JSON.stringify(restProps), '，constructor =', restProps.constructor.name);

// 对比：不写 rest 时，缺失的变量是 undefined；写了 rest 就是空集合
const [noHead, noRest] = [];
console.log('\n不写 rest：缺失的变量 =', noRest);

// 实战：带默认值的配置合并（局部默认值 + 全局默认值）
const GLOBAL_DEFAULTS = { theme: 'light', lang: 'zh-CN', fontSize: 14 };
function initConfig({
  theme = GLOBAL_DEFAULTS.theme,
  lang = GLOBAL_DEFAULTS.lang,
  fontSize = GLOBAL_DEFAULTS.fontSize,
  debug = false, // 只在函数级默认值里存在的字段
} = {}) {
  return { theme, lang, fontSize, debug };
}
console.log('\n实战：全部用默认值 =', JSON.stringify(initConfig()));
console.log('实战：部分覆盖 =', JSON.stringify(initConfig({ theme: 'dark' })));
console.log('实战：传 0 与空字符串不会被覆盖 =', JSON.stringify(initConfig({ fontSize: 0, lang: '' })));

console.log('\n全部演示完毕。');
