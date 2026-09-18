/**
 * ============================================================================
 * 知识点：null 与 undefined 的区别、使用场景、?? 与 ?. 运算符
 * ============================================================================
 *
 * 【所属分类】03_data_types —— 数据类型
 * 【难度等级】入门
 * 【前置知识】03_data_types/03_type_conversion.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    null 和 undefined 都是原始类型，都表示"没有值"，但语义不同：
 *      · undefined —— "系统级的缺失"。引擎在"没给值"时自动填入。
 *      · null      —— "程序级的空值"。由开发者主动赋值，表示"这里我故意留空"。
 *    它们各自只有一个值：undefined 和 null。
 *
 * 2. 为什么需要区分
 *    区分它们能表达不同意图，也能在排查问题时快速定位来源：
 *    看到 undefined 通常意味着"忘了赋值 / 属性不存在 / 函数没写 return"，
 *    看到 null 通常意味着"业务上明确置空"（如"用户已注销头像"）。
 *    很多团队约定：只使用 undefined 表示缺失，null 只在对接 JSON 时出现。
 *
 * 3. 核心语法要点
 *    【undefined 出现的 6 种场景】
 *      1) 声明了变量但没赋初值：let x;
 *      2) 访问对象上不存在的属性：({}).nope
 *      3) 函数没有显式 return（或 return;）时的返回值
 *      4) 调用函数时省略了实参，对应形参为 undefined
 *      5) 越界访问数组元素：[1,2][9]
 *      6) 稀疏数组的空槽：new Array(3)[0]
 *    【null 出现的场景】几乎只有一个：开发者或 JSON 数据显式提供。
 *      Object.getPrototypeOf(Object.prototype) === null 是语言内部的特例。
 *    【类型表现】
 *      typeof undefined === 'undefined'；typeof null === 'object'（历史 bug）。
 *      Number(null) === 0；Number(undefined) === NaN —— 后者的破坏力更大。
 *      JSON.stringify 保留 null，丢弃 undefined 属性。
 *    【相等性】
 *      null === undefined          → false（类型不同）
 *      null == undefined           → true（规范特批的唯一一对）
 *      null == 0 / undefined == 0  → 均为 false
 *    【?? 空值合并运算符（ES2020）】
 *      左操作数为 null 或 undefined 时才取右值，保留 0、''、false。
 *      注意 ?? 不能与 && / || 直接混用不加括号，会抛 SyntaxError。
 *    【?. 可选链运算符（ES2020）】
 *      在 null / undefined 上访问属性 / 调用方法 / 取下标会短路返回 undefined，
 *      而不是抛 TypeError。可与 ?? 组合成"安全取值 + 默认值"的惯用法。
 *    【默认参数】只在实参为 undefined 时生效，传 null 不会触发默认值。
 *
 * 4. 常见陷阱
 *    · 用 || 兜底会把 0、''、false 一起吃掉，应该用 ??。
 *    · 默认参数救不了 null：function f(x = 1) {} 调用 f(null) 得到 null。
 *    · ?. 只在"访问链上"生效，不能写成 obj?.a.b —— obj 为 null 时安全，
 *      但 obj.a 为 null 时 b 仍会抛错；要写成 obj?.a?.b。
 *    · 可选链不能用于赋值左侧：obj?.a = 1 是语法错误。
 *    · JSON.parse 得到的 null 与 undefined 完全不同，跨端传输时 undefined 属性会消失。
 *    · typeof null === 'object' 导致"判空"必须用 === null 而不是 typeof。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：
 *     node 03_data_types/08_null_vs_undefined.js
 *
 * 【预期输出】
 *   打印 undefined 的六种来源、null 的场景、== 与 === 对比、
 *   ?? 与 ?. 的实战用法、默认参数对 null 失效的陷阱。全部输出确定，退出码 0。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. undefined 的六种来源
// ---------------------------------------------------------------------------

console.log('--- 1. undefined 的六种来源 ---');

// (1) 声明未赋值
let declaredOnly;
console.log('(1) let x;                 x =', declaredOnly);

// (2) 访问不存在的属性
const emptyObj = {};
console.log("(2) ({}).nope              =", emptyObj.nope);

// (3) 函数没有 return
function noReturn() {}
console.log('(3) 无 return 的函数调用    =', noReturn());

// (4) 省略实参
function withParams(a, b) {
  return [a, b];
}
console.log('(4) withParams(1)          =', withParams(1));

// (5) 数组越界
const arr = [1, 2, 3];
console.log('(5) [1,2,3][9]             =', arr[9]);

// (6) 稀疏数组的空槽
const sparse = new Array(3);
console.log('(6) new Array(3)[0]        =', sparse[0]);
console.log('    new Array(3).length    =', sparse.length, '（长度是 3，但槽是空的）');
console.log('    0 in sparse            =', 0 in sparse, '（空槽与显式 undefined 不同）');
const explicitUndefined = [undefined, undefined, undefined];
console.log('    [undefined,undefined,undefined] 的 0 in 结果 =', 0 in explicitUndefined);

// ---------------------------------------------------------------------------
// 2. null 的场景
// ---------------------------------------------------------------------------

console.log('--- 2. null 的典型场景 ---');

// 主动表示"这里有意为空"，例如用户注销后清空头像。
const user = {
  name: '小明',
  avatar: null, // 明确表示"已知没有头像"
};
console.log('user.avatar =', user.avatar, '（业务上明确为空）');
console.log('user.email  =', user.email, '（这个字段根本不存在）');

// 主动清空一个引用
let currentSession = { id: 1 };
currentSession = null; // 表示"会话已结束"
console.log('会话结束后的 currentSession =', currentSession);

// 语言内部的特例：原型链顶端
console.log('Object.getPrototypeOf(Object.prototype) =', Object.getPrototypeOf(Object.prototype));

// ---------------------------------------------------------------------------
// 3. 类型表现与转换差异
// ---------------------------------------------------------------------------

console.log('--- 3. typeof 与转换差异 ---');

console.log('typeof undefined =', typeof undefined);
console.log('typeof null      =', typeof null, '← 历史 bug，null 不是 object');
console.log('undefined instanceof Object =', undefined instanceof Object);
console.log('null instanceof Object      =', null instanceof Object);

console.log('Number(undefined) =', Number(undefined), '← NaN，参与运算会污染整个结果');
console.log('Number(null)      =', Number(null), '← 0，看起来"安全"但同样危险');
console.log('String(undefined) =', String(undefined));
console.log('String(null)      =', String(null));
console.log('Boolean(undefined) =', Boolean(undefined));
console.log('Boolean(null)      =', Boolean(null));

// 危险演示：null 参与算术会静默变成 0
console.log('null + 1     =', null + 1, '← 变成 1，bug 被掩盖');
console.log('undefined + 1 =', undefined + 1, '← NaN，容易发现');

// ---------------------------------------------------------------------------
// 4. == 与 === 的对比
// ---------------------------------------------------------------------------

console.log('--- 4. 相等性对比 ---');

console.log('null === undefined ?', null === undefined, '（类型不同）');
console.log('null == undefined  ?', null == undefined, '（规范特批的唯一一对）');
console.log('Object.is(null, undefined) =', Object.is(null, undefined));

console.log('null == 0     ?', null == 0, '（注意：不是 true！）');
console.log('null >= 0     ?', null >= 0, '（关系比较里 null 会转成 0，所以 true）');
console.log('undefined == 0 ?', undefined == 0);
console.log('undefined < 0  ?', undefined < 0, '（undefined 转成 NaN，任何比较都是 false）');

console.log("null == ''    ?", null == '');
console.log('null == false ?', null == false);
console.log('NaN == null   ?', NaN == null);

// 结论：判空用 === null 或 === undefined，或用 == null 一次覆盖两者（仅限这一处）。

// ---------------------------------------------------------------------------
// 5. ?? 空值合并运算符
// ---------------------------------------------------------------------------

console.log('--- 5. ?? 空值合并 ---');

const settings = { volume: 0, subtitle: '', theme: null };
console.log('settings.volume   =', settings.volume, "| volume || 50   =", settings.volume || 50, '← 0 被吃掉');
console.log('settings.volume   =', settings.volume, '| volume ?? 50   =', settings.volume ?? 50, '← 正确');
console.log("settings.subtitle = ''   | ?? '无字幕'  =", settings.subtitle ?? '无字幕');
console.log("settings.theme    = null | ?? '默认主题' =", settings.theme ?? '默认主题');
console.log("settings.missing  = undefined | ?? '兜底' =", settings.missing ?? '兜底');

// ?? 不能与 || / && 不加括号直接混用：那是"解析期"语法错误（SyntaxError），
// 报错发生在代码开始执行之前，所以 try/catch 根本来不及救：
//   const bad = null || undefined ?? 'x';   // SyntaxError: Unexpected token '??'
// 正确写法是加括号明确优先级：
console.log("(null || undefined) ?? 'x' =", (null || undefined) ?? 'x');
console.log("null ?? (undefined || 'y') =", null ?? (undefined || 'y'));

// ---------------------------------------------------------------------------
// 6. ?. 可选链
// ---------------------------------------------------------------------------

console.log('--- 6. ?. 可选链 ---');

const response = {
  data: {
    user: {
      profile: { nickname: '阿明' },
    },
  },
};

// 传统写法要层层判断，冗长且易漏。
const legacy = response && response.data && response.data.user && response.data.user.profile
  ? response.data.user.profile.nickname
  : undefined;
console.log('传统层层判断：', legacy);

// 可选链写法，中途遇到 null / undefined 就短路返回 undefined。
console.log('?. 写法    ：', response?.data?.user?.profile?.nickname);
console.log('链上不存在的属性：', response?.data?.user?.missing?.deep);
console.log('可选调用方法：', response?.data?.user?.profile?.getName?.());
console.log('可选取下标：', response?.data?.list?.[0]);

// 与 ?? 组合：安全取值 + 默认值，这是最常见的搭配。
const nickname = response?.data?.user?.profile?.nickname ?? '游客';
console.log('安全取值 + 默认值：', nickname);
const missingName = response?.data?.user?.nope?.name ?? '游客';
console.log('缺失时也能兜底    ：', missingName);

// 注意：可选链不能出现在赋值左侧，这是"解析期"语法错误（SyntaxError），
// 代码根本跑不起来，所以 try/catch 也拦不住：
//   response?.data = 1;   // SyntaxError: Invalid left-hand side in assignment
console.log('提示：obj?.prop = 1 属于 SyntaxError（解析期报错，无法用 try/catch 捕获）');
console.log('正确做法是先判空再赋值：');
const target = response?.data;
if (target) target.flag = true;
console.log('  target.flag =', response.data.flag);
delete response.data.flag; // 复原现场，方便对照

// ---------------------------------------------------------------------------
// 7. 默认参数只对 undefined 生效
// ---------------------------------------------------------------------------

console.log('--- 7. 默认参数与 null ---');

/** 默认参数只在不传或传 undefined 时生效，传 null 不生效 */
function greet(name = '匿名用户') {
  return '你好，' + name;
}

console.log('greet()            =', greet());
console.log('greet(undefined)   =', greet(undefined), '← 触发默认值');
console.log('greet(null)        =', greet(null), '← null 不触发默认值！');
console.log('greet("")          =', JSON.stringify(greet('')), '← 空串也不触发');

// 想同时兜住 null，需要在函数体内用 ??。
function greetSafe(name) {
  return '你好，' + (name ?? '匿名用户');
}
console.log('greetSafe(null)    =', greetSafe(null));
console.log('greetSafe(undefined) =', greetSafe(undefined));

// ---------------------------------------------------------------------------
// 8. JSON 序列化的差异
// ---------------------------------------------------------------------------

console.log('--- 8. JSON 中的表现 ---');

const payload = { a: null, b: undefined, c: 0 };
console.log('原对象           ：', payload);
console.log('JSON.stringify   ：', JSON.stringify(payload), '← undefined 属性被整条丢弃');
console.log('"b" in payload   ：', 'b' in payload, '← 但属性确实存在');
console.log('Object.keys      ：', Object.keys(payload), '← 键还在');

console.log('--- 完成：null 与 undefined 的区别与安全取值 ---');
