/**
 * ============================================================================
 * 知识点：可选链 ?. 与空值合并 ?? —— 对象深层属性的安全访问
 * ============================================================================
 *
 * 【所属分类】09_objects —— 对象
 * 【难度等级】进阶
 * 【前置知识】09_objects/02_property_access.js
 *
 * 【也见】?. 与 ?? 的「运算符级」讲解见 04_operators/06_optional_chaining.js 与 04_operators/05_nullish_coalescing.js。
 *        那两篇是运算符主线的主场（逐条讲语法与混用限制）；本文件是对象视角，侧重深层取值的工程场景。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    两个 ES2020 引入的运算符，常组合使用：
 *      ?.  可选链（optional chaining）：左边是 null / undefined 时，**短路**返回
 *          undefined，不再继续访问，也不抛错。
 *      ??  空值合并（nullish coalescing）：左边是 null / undefined 时取右边的值，
 *          否则取左边的值。它只认 null 和 undefined。
 *    ?. 有三种写法：
 *      obj?.prop        属性访问
 *      obj?.[expr]      方括号访问
 *      fn?.()           函数调用
 *
 * 2. 为什么需要
 *    接口返回的数据结构往往"可能缺一层"：用户可能没填地址，订单可能没有优惠券。
 *    传统写法要层层判断：
 *      const city = user && user.address && user.address.city;
 *    数据一深就变成"&& 地狱"。?. 让这个意图变得一目了然。
 *    而 ?? 解决的是另一个老问题：用 || 给默认值时，0、''、false 也会被替换掉。
 *
 * 3. 核心语法要点
 *    (1) 短路规则：?. 左边为 null / undefined 时，**整个链条的后续部分都不再求值**。
 *        所以 obj?.a.b 里，若 obj 是 null，连 .a 都不会执行。
 *    (2) 只有 null / undefined 会触发短路。0、''、false、NaN 都是"正常值"，
 *        不会被短路——这是 ?. 与 && 的重要区别。
 *    (3) ?? 只在 null / undefined 时取右边；|| 在**任何假值**时取右边。
 *    (4) ?. 与 ?? 不能和 && / || 直接混用而不加括号（语法错误），
 *        因为优先级容易让人误解。必须写成 (a ?? b) || c 或 a ?? (b || c)。
 *    (5) ?. 不能用于"赋值目标"：obj?.a = 1 是语法错误，
 *        要用的话得先判断 obj 存在。
 *    (6) ?. 与 delete 可以搭配：delete obj?.a 是合法的。
 *    (7) 新增的 ??= 运算符：仅当左边是 null/undefined 时赋值。
 *
 * 4. 常见陷阱
 *    (1) 滥用 ?. 掩盖真正的 bug：该有数据的地方没数据，应该让它报错而不是静默变 undefined。
 *    (2) 用 || 给默认值，导致 0 / '' / false 被替换（应该用 ??）。
 *    (3) 以为 ?. 能"防止所有错误"：它只防 null / undefined，
 *        对象本身不存在（未声明变量）仍会 ReferenceError。
 *    (4) fn?.() 与 fn?.() 的区别要注意：fn?.() 在 fn 为 null 时返回 undefined；
 *        而 (obj.method)?.() 里 this 绑定会丢失，需要写成 obj.method?.()。
 *    (5) 深层访问时混用 ?. 和 . 的位置很关键：a?.b.c 中若 a 存在但 a.b 不存在，
 *        依然会抛错。要在每一层"可能为空"的地方都加 ?.。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 09_objects/15_optional_chaining_object.js
 *
 * 【预期输出】
 *   分 6 个小节，演示 ?. 的三种形态、短路规则、与 ?? 的组合及常见误用。
 * ============================================================================
 */

/** 安全执行并打印结果，用于演示"会抛错"的旧写法。 */
function safe(label, fn) {
  try {
    console.log(`   ${label} ->`, fn());
  } catch (err) {
    console.log(`   ${label} -> 抛错（${err.name}）`);
  }
}

console.log('--- 1. 没有 ?. 的年代：&& 地狱 ---');

const user = {
  name: '张三',
  // 注意：没有 address 字段，模拟"用户没填地址"
};

// 旧写法一：直接访问，会抛 TypeError
safe('user.address.city', () => user.address.city);

// 旧写法二：层层 && 判断
const city1 = user && user.address && user.address.city;
console.log('   user && user.address && user.address.city ->', city1);
const zip1 = user && user.address && user.address.zip && user.address.zip.code;
console.log('   再深一层就变成 ->', zip1);
console.log('   （&& 地狱：层级越深越难读，而且中间变量也没有名字）');

// 新写法
const city2 = user?.address?.city;
console.log('   user?.address?.city ->', city2, '（一行搞定，且不抛错）');

console.log('\n--- 2. ?. 的三种形态 ---');

const order = {
  id: 'A001',
  customer: {
    name: '李四',
    // 联系方式故意留空
    contact: null,
  },
  items: [{ sku: 'X1', price: 100 }],
  // 一个可选的回调
  onDone: null,
};

// 形态一：obj?.prop
console.log('order?.id                  =', order?.id);
console.log('order?.customer?.name      =', order?.customer?.name);
console.log('order?.customer?.contact?.phone =', order?.customer?.contact?.phone, '（contact 是 null，短路了）');

// 形态二：obj?.[expr]
const fieldName = 'id';
console.log("order?.['id']              =", order?.['id']);
console.log('order?.[fieldName]         =', order?.[fieldName]);
// 数组也能用：先判断数组存在，再取下标
console.log('order.items?.[0]?.sku      =', order.items?.[0]?.sku);
console.log('order.items?.[99]?.sku     =', order.items?.[99]?.sku, '（下标越界，得到 undefined）');

// 形态三：fn?.()
console.log('order.onDone?.()           =', order.onDone?.(), '（是 null，所以不调用，返回 undefined）');
// 对比：直接调用会抛错
safe('order.onDone()', () => order.onDone());

// 给一个真实的函数
const withCallback = { onDone: () => '回调被执行了' };
console.log('withCallback.onDone?.()    =', withCallback.onDone?.());

// 方法调用时 this 的绑定很重要
const counter = {
  count: 5,
  read() {
    return this.count;
  },
};
console.log('counter.read?.()           =', counter.read?.(), '（this 正确绑定到 counter）');

console.log('\n--- 3. 只有 null / undefined 会短路 ---');

// 这些值通通"不会"触发短路
const falsyValues = [
  ['0', 0],
  ["''", ''],
  ['false', false],
  ['NaN', NaN],
];

for (const [label, value] of falsyValues) {
  const obj = { v: value };
  console.log(`   值为 ${label.padEnd(6)} 时 obj?.v = ${String(obj?.v).padEnd(6)} ，obj?.v?.toString 存在吗 = ${typeof obj?.v?.toString}`);
}

// 关键差异：&& 会被任何假值挡住，?. 只被 null/undefined 挡住。
const zero = { value: 0 };
console.log('\n对比 && 与 ?.：');
console.log('   zero && zero.value          =', zero && zero.value, '（0 是假值，但 && 左边是对象所以通过）');
console.log('   zero?.value                 =', zero?.value, '（?. 完全不管值的真假）');
const zeroItself = 0;
console.log('   zeroItself && zeroItself.toFixed(2) -> 被 0 挡住，返回 =', zeroItself && zeroItself.toFixed(2));
console.log('   zeroItself?.toFixed(2)      =', zeroItself?.toFixed(2), '（?. 不挡 0，正常调用）');

console.log('\n--- 4. ?? 空值合并：只认 null 和 undefined ---');

const settings = {
  retries: 0,
  volume: '',
  debug: false,
  timeout: null,
  // note 字段完全不存在
};

console.log('用 || 取默认值（会误伤假值）：');
console.log('   retries || 3  =', settings.retries || 3, '（0 被替换成了 3，可能是 bug）');
console.log("   volume || '50' =", settings.volume || '50', "（'' 被替换了)");
console.log('   debug || true =', settings.debug || true, '（false 被替换了）');
console.log('   timeout || 5000 =', settings.timeout || 5000, '（这个替换是合理的）');

console.log('\n用 ?? 取默认值（只认 null/undefined）：');
console.log('   retries ?? 3  =', settings.retries ?? 3, '（0 被保留，正确）');
console.log("   volume ?? '50' =", settings.volume ?? '50', "（'' 被保留，正确）");
console.log('   debug ?? true =', settings.debug ?? true, '（false 被保留，正确）');
console.log('   timeout ?? 5000 =', settings.timeout ?? 5000, '（null 被替换，正确）');
console.log('   note ?? "无备注" =', settings.note ?? '无备注', '（不存在的属性也是 undefined，被替换）');

// 与 ?. 的黄金组合：安全访问 + 只对"真缺失"给默认值
const apiResponse = { data: { user: { nickname: '', level: 0 } } };
console.log('\n?. 与 ?? 组合：');
console.log('   昵称为空字符串时保留 =', JSON.stringify(apiResponse?.data?.user?.nickname ?? '匿名'));
console.log('   等级为 0 时保留     =', apiResponse?.data?.user?.level ?? 1);
console.log('   缺失的字段给默认值   =', apiResponse?.data?.missing?.value ?? '默认值');

console.log('\n--- 5. 赋值用 ??= 与语法限制 ---');

const config = { a: null, b: 0, c: 'existing' };
// ??= 仅当左边是 null/undefined 时才赋值
config.a ??= 'a 的默认值';
config.b ??= 'b 的默认值';
config.c ??= 'c 的默认值';
console.log('??= 结果 =', JSON.stringify(config), '（只有 a 被替换）');

// 对象初始化时也常用这个模式
const state = {};
state.items ??= []; // 首次访问时初始化，避免重复创建数组
state.items.push('第一项');
console.log('state.items =', JSON.stringify(state.items));

// 语法限制一：?. 不能作为赋值目标
console.log('\n语法限制（下面这些写法会直接报语法错误，所以只做说明，不实际执行）：');
console.log('   obj?.a = 1        -> SyntaxError: Invalid left-hand side in assignment');
console.log('   obj?.() = 1       -> SyntaxError');
console.log('   正确写法：if (obj) obj.a = 1;  或  obj && (obj.a = 1);');

// 语法限制二：?? 不能与 || / && 无括号混用
console.log('   a ?? b || c       -> SyntaxError（必须写成 (a ?? b) || c 或 a ?? (b || c)）');
try {
  // 用 Function 构造器动态编译一段代码，把语法错误也演示出来（这里是运行期解析，不会中断进程）
  // eslint-disable-next-line no-new-func
  new Function('const a = 1, b = 2, c = 3; return a ?? b || c;');
} catch (err) {
  console.log('   实测编译报错：', err.name, '-', err.message);
}
// 加括号就没问题
const a = null;
const b = 2;
const c = 3;
console.log('   (a ?? b) || c =', (a ?? b) || c, '（合法）');
console.log('   a ?? (b || c) =', a ?? (b || c), '（合法）');

// delete 可以配合 ?.
const deletable = { x: 1 };
console.log('\ndelete deletable?.x =', delete deletable?.x);
console.log('delete 后再访问 =', deletable?.x);

console.log('\n--- 6. 深层访问的完整性：每一层都要加 ?. ---');

const deep = {
  level1: {
    level2: {
      level3: '最深处',
    },
  },
};

// 正确的逐层保护
console.log('deep?.level1?.level2?.level3 =', deep?.level1?.level2?.level3);

// 陷阱：只在第一层加了 ?.，后面用裸点访问
const empty = { level1: null };
safe('empty?.level1.level2.level3', () => empty?.level1.level2.level3);
console.log('   原因：empty 不是 null，所以 ?. 不短路；接着 .level1 是 null，再取 .level2 就炸了');

// 正确写法：每一层都加
console.log('   empty?.level1?.level2?.level3 =', empty?.level1?.level2?.level3);

// 表格化对比几种写法的健壮性
const cases = [
  { label: '对象完整', value: deep, path: (o) => o?.level1?.level2?.level3 },
  { label: '中间层为 null', value: { level1: null }, path: (o) => o?.level1?.level2?.level3 },
  { label: '整个对象为 null', value: null, path: (o) => o?.level1?.level2?.level3 },
  { label: '整个对象为 undefined', value: undefined, path: (o) => o?.level1?.level2?.level3 },
  { label: '中间层为空字符串', value: { level1: '' }, path: (o) => o?.level1?.level2?.level3 },
];
console.log('\n各种数据形态下 o?.level1?.level2?.level3 的结果：');
for (const item of cases) {
  let result;
  try {
    result = item.path(item.value);
  } catch (err) {
    result = `抛错(${err.name})`;
  }
  console.log(`   ${item.label.padEnd(20)} -> ${String(result)}`);
}

// 一个实战工具函数：安全地按路径取值
function getByPath(obj, path, fallback = undefined) {
  const result = path
    .split('.')
    .reduce((acc, key) => acc?.[key], obj);
  return result ?? fallback;
}
const payload = { data: { list: [{ name: '第一项' }] } };
console.log('\ngetByPath(payload, "data.list.0.name") =', getByPath(payload, 'data.list.0.name'));
console.log('getByPath(payload, "data.missing.deep") =', getByPath(payload, 'data.missing.deep', '兜底值'));
console.log('（reduce + ?. 是实现"动态路径安全取值"最简洁的写法）');

// 最后提醒：?. 只防"值不存在"，不防"变量未声明"。
console.log('\n提醒：?. 无法挽救未声明的变量；访问未声明标识符仍会 ReferenceError。');
safe('notDeclared?.anything', () => notDeclared?.anything);

console.log('\n全部演示完毕。');
