/**
 * ============================================================================
 * 知识点：可选链 ?. —— obj?.prop、obj?.[expr]、fn?.() 三种形式
 * ============================================================================
 *
 * 【所属分类】04_operators —— 运算符与表达式
 * 【难度等级】进阶
 * 【前置知识】04_operators/05_nullish_coalescing.js
 *
 * 【也见】09_objects/15_optional_chaining_object.js —— 对象视角下也完整讲了 ?. 与 ?? 的搭配。
 *        本文件是 ?. 运算符的主场（专文）；那篇侧重深层属性访问的工程场景。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    可选链运算符 ?.（Optional Chaining，ES2020）让你在"链式取值"时遇到
 *    null 或 undefined 就**立即停止并整体返回 undefined**，而不是抛 TypeError。
 *    它有三种形式：
 *      obj?.prop        访问属性（对象可能不存在）
 *      obj?.[expr]      访问动态属性（键来自变量）
 *      fn?.()           调用函数（函数可能不存在）
 *    还有第四种用法：obj?.prop 可与 new 组合成 new Ctor?.()（较少用）。
 *
 * 2. 为什么需要
 *    处理嵌套数据（接口返回、配置对象、可选回调）时，传统写法要层层用 && 防守：
 *      const city = user && user.address && user.address.city;
 *    可选链把这段压缩成：
 *      const city = user?.address?.city;
 *    语义更清晰，也不会因为漏写一层而抛错。
 *
 * 3. 核心语法要点
 *    - 短路规则：?.['左操作数'] 为 null 或 undefined 时，右侧整条链
 *      **不再求值**，整个表达式的值为 undefined。
 *    - 只对 null / undefined 生效；0、''、false、NaN 会正常继续访问。
 *    - 属性不存在（但对象存在）时，?.['对象'] 不会兜底，仍得到 undefined，
 *      例如 {a:1}?.b 是 undefined，而不是抛错——这是普通属性访问行为。
 *    - obj?.b.c 是"若 obj 为空则整体 undefined，否则继续取 .b.c"，
 *      若 obj 存在但 obj.b 是 undefined，.c 仍会抛 TypeError，需要写成 obj?.b?.c。
 *    - 常用于搭配 ?? 给默认值：user?.name ?? '匿名'。
 *    - 也可用于数组下标：arr?.[0]?.name；用于 Map/Set 方法：map?.get(key)。
 *
 * 4. 常见陷阱
 *    - 不能给"声明"加可选链：let x?. = 1 是语法错误。
 *    - 不能给"赋值目标"加可选链：obj?.a = 1 是语法错误（规范禁止）
 *      ——因为"给一个可能不存在的对象赋值"没有合理语义。
 *    - 不能用于 new 的目标之外的位置：new obj?.Ctor() 要写成 new (obj?.Ctor)()。
 *    - 不要滥用：对"本来就不该为 null"的对象到处加 ?.，会把真正的 bug 掩盖成 undefined。
 *    - 副作用注意：a?.b.c() 这种写法里，若 a 为 null，整条链（含函数调用）都不会执行。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 04_operators/06_optional_chaining.js
 *
 * 【预期输出】
 *   依次打印三种可选链形式的基本用法、短路行为验证、
 *   与 ?? 组合的默认值写法、只认 null/undefined 的边界验证，
 *   以及被禁止的写法（语法错误）的捕获演示。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. 形式一：obj?.prop
// ---------------------------------------------------------------------------

console.log('--- 1. obj?.prop ---');

// 模拟一份"可能缺少字段"的接口返回
const apiResponse = {
  code: 0,
  data: {
    user: {
      name: '小明',
      address: { city: '杭州', zip: '310000' },
    },
  },
};

// 正常路径：每一层都存在，? 只是"顺手带上"，结果和普通点号一致
console.log('response?.data?.user?.name =', apiResponse?.data?.user?.name); // '小明'
console.log('response?.data?.user?.address?.city =', apiResponse?.data?.user?.address?.city); // '杭州'

// 断链路径：data 不存在时，整条链返回 undefined，不抛错
const emptyResponse = { code: 404 };
console.log('emptyResponse?.data?.user?.name =', emptyResponse?.data?.user?.name); // undefined（若不加 ?. 会抛 TypeError）

// 对照：不加可选链会怎样
try {
  console.log(emptyResponse.data.user.name);
} catch (err) {
  console.log('不加 ?. 的写法抛出：', err.constructor.name, '-', err.message);
}

// 关键：只有"链上第一个为空"的位置才需要 ?.，但为了容错通常每一层都写
const partial = { data: {} }; // data 存在，但 data.user 不存在
console.log('partial.data?.user?.name =', partial.data?.user?.name); // undefined

// ---------------------------------------------------------------------------
// 2. 形式二：obj?.[expr] —— 键是动态的
// ---------------------------------------------------------------------------

console.log('\n--- 2. obj?.[expr] ---');

const config = {
  theme: { color: 'dark' },
  locales: ['zh-CN', 'en-US'],
};

// 键来自变量时必须用中括号，此时可选链写成 ?.[...]
const keyFromUser = 'color';
console.log("config?.theme?.['color'] =", config?.theme?.['color']); // 'dark'
console.log('config?.theme?.[keyFromUser] =', config?.theme?.[keyFromUser]); // 'dark'

// 数组下标也是动态属性访问
console.log('config?.locales?.[0] =', config?.locales?.[0]); // 'zh-CN'
console.log('config?.locales?.[9] =', config?.locales?.[9]); // undefined（越界不报错）

// 对象不存在时同样短路
const noConfig = null;
console.log('noConfig?.theme?.["color"] =', noConfig?.theme?.['color']); // undefined

// 实战：安全地从"由字符串拼出的键"里取值
const i18n = { zh: { hello: '你好' }, en: { hello: 'Hello' } };
function translate(lang, word) {
  return i18n?.[lang]?.[word] ?? `[缺少翻译: ${lang}.${word}]`;
}
console.log("translate('zh', 'hello') =", translate('zh', 'hello')); // '你好'
console.log("translate('jp', 'hello') =", translate('jp', 'hello')); // 兜底提示

// ---------------------------------------------------------------------------
// 3. 形式三：fn?.() —— 函数可能不存在
// ---------------------------------------------------------------------------

console.log('\n--- 3. fn?.() ---');

// 场景：可选回调（事件监听、插件钩子）非常常见
function runTask(task) {
  console.log('  开始执行任务：', task.name);
  // 只有传了 onProgress 才调用它
  task.onProgress?.('进度 50%');
  task.onDone?.();
  console.log('  任务结束，未因缺少回调而报错');
}

runTask({ name: '导出报表' }); // 什么都不传，安全跳过
runTask({
  name: '上传文件',
  onProgress: (msg) => console.log('    [回调]', msg),
  onDone: () => console.log('    [回调] 完成'),
});

// 对象上的方法也可能不存在
const logger = { info: (msg) => console.log('    [info]', msg) };
console.log('调用已存在的方法：');
logger.info?.('这条能打印');
console.log('调用不存在的方法：');
logger.debug?.('这条被静默跳过，不会抛 TypeError');
const noLogger = null;
noLogger?.info?.('整条链都短路，不执行');

// 对比：不加 ?. 会抛错
try {
  logger.debug('直接调用不存在的方法');
} catch (err) {
  console.log('  不加 ?. 抛出：', err.constructor.name, '-', err.message);
}

// ---------------------------------------------------------------------------
// 4. 与 ?? 配合：可选链负责"不报错"，?? 负责"给默认值"
// ---------------------------------------------------------------------------

console.log('\n--- 4. 与 ?? 配合 ---');

const users = [
  { name: '小明', profile: { nickname: '明明', bio: '' } },
  { name: '小红' },
  { name: '阿强', profile: { nickname: null, bio: '你好' } },
];

for (const u of users) {
  // 注意：?. 会把 "" 和 null 都变成 undefined 或原值，所以默认值要用 ?? 而不是 ||
  const nickname = u?.profile?.nickname ?? '（无昵称）';
  const bio = u?.profile?.bio ?? '（未填写简介）';
  console.log(`  ${u.name}：昵称=${nickname}，简介=${bio}`);
}

// 与 && 的区别：&& 在 obj 为假值（如 0、''）时也会短路，?.
// 只在 null/undefined 时短路，语义更精确
const zeroLike = { value: 0 };
console.log('zeroLike?.value =', zeroLike?.value); // 0（继续访问，返回 0）
console.log('0 这个值本身不会被 ?. 短路');

// ---------------------------------------------------------------------------
// 5. 边界：?. 只对 null / undefined 生效
// ---------------------------------------------------------------------------

console.log('\n--- 5. 边界：?. 只认 null / undefined ---');

const cases = [
  ['null', null],
  ['undefined', undefined],
  ['0', 0],
  ["''", ''],
  ['false', false],
  ['NaN', NaN],
  ['{}', {}],
];

for (const [label, value] of cases) {
  // value?.toString?.() 先判断 value 是否为空，再判断方法是否存在
  const result = value?.toString?.();
  console.log(`  ${label}?.toString?.() => ${typeof result} ${String(result)}`);
}
// 只有 null / undefined 得到 undefined，其余都会正常调用到 Object.prototype.toString

// ---------------------------------------------------------------------------
// 6. 被禁止的写法：赋值目标与声明
// ---------------------------------------------------------------------------

console.log('\n--- 6. 被禁止的写法 ---');

// 规范明确禁止在"赋值目标"上使用可选链：给一个可能不存在的对象赋值没有合理语义。
// 这里同样用 new Function 在运行期构造，捕获语法错误而不影响本文件运行。
const forbidden = [
  'let obj = {}; obj?.a = 1;', // 赋值目标
  'let obj = {}; obj?.a += 1;', // 复合赋值目标
  'let x = 1; x?.a = 2;', // 原始值上更不行
  'let obj = {}; obj?.a++;', // 自增目标
];

for (const code of forbidden) {
  try {
    new Function(code);
    console.log('没有报错（不会执行到这里）：', code);
  } catch (err) {
    console.log('语法错误 =>', err.constructor.name, '|', code);
    console.log('    信息：', err.message.split('\n')[0]);
  }
}

// 正确做法：先判断再赋值，或用 ?? 合并出可写对象
const target = null;
const safe = target ?? {};
safe.a = 1;
console.log('正确写法（用 ?? 得到可写对象）：', safe); // { a: 1 }

// 另一个细节：obj?.b.c 与 obj?.b?.c 的区别
const outer = { b: undefined };
console.log('outer?.b?.c =', outer?.b?.c); // undefined，安全
try {
  console.log(outer?.b.c); // outer 存在 => ?. 不短路 => 继续取 .c => 抛错
} catch (err) {
  console.log('outer?.b.c 抛出：', err.constructor.name, '-', err.message);
}
console.log('结论：?. 只保护"它紧挨着的那一层"，多层链要逐层写 ?.');

console.log('\n全部演示结束。');
