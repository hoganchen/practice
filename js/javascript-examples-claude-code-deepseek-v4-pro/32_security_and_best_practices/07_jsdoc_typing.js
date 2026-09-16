/**
 * ============================================================================
 * 知识点：JSDoc 类型标注 —— 不引入 TypeScript 也能获得编辑器类型提示与检查
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/10_code_style_guide.js（代码风格）、06_functions（函数）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JSDoc 是一套写在注释里的标注语法（`/** ... *\/`），用来描述代码的意图：
 *    参数是什么类型、返回什么、这个对象长什么样、这函数是泛型的……
 *    它最早只是文档生成工具（生成 HTML 文档），但现在有了更实用的用途：
 *    **TypeScript 编译器与编辑器能读懂 JSDoc，从而在纯 JavaScript 文件里提供类型检查**。
 *    也就是说：你写的还是 .js（零构建步骤），但编辑器里能享受大部分类型提示。
 *    支撑这件事的三件套：
 *      - `// @ts-check`      ：文件顶部加这一行，让该文件参与类型检查
 *      - `checkJs`           ：tsconfig.json 里开启，让所有 .js 默认被检查
 *      - VS Code 的 JS 语言服务：会自动读取 JSDoc，实时给出补全、跳转、报错
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) 老项目 / 小工具 / 学习仓库不想引入构建链：加 TypeScript 意味着加编译步骤、
 *        改构建配置、处理 source map、培训团队 —— 成本高。JSDoc 是"零构建成本"的方案。
 *    (b) 编辑器补全：给一个对象参数写好 `@param {User} user`，接着写 `user.` 就会自动列出
 *        `name` / `email` 等字段；函数参数写错类型会当场划红线。
 *    (c) 团队协作：函数签名不容易被误解为"随便传什么"，不需要翻实现就知道怎么调用。
 *    (d) 渐进增强：可以先给几个核心模块写 JSDoc，而不是"全量迁移到 TS"这种大工程。
 *    (e) 类型也可以当文档：配合编辑器悬停提示，比散落在 README 里的说明更不容易过期。
 *
 * 3. 核心语法要点
 *    - `@param {类型} 参数名 描述`：描述参数。可选参数用方括号 `@param {string} [name]`，
 *      带默认值写 `@param {number} [retries=3]`。
 *    - 类型可以不写：`@param name`，此时视为 any（不推荐，等于放弃检查）。
 *    - `@returns {类型} 描述`：描述返回值。也可以用 `@return`（同义）。
 *    - 联合类型：`{string | null}`；字面量联合：`{'asc' | 'desc'}`。
 *    - 数组与对象：`{string[]}`、`{Array<number>}`、`{Record<string, number>}`、
 *      内联对象 `{{ id: number, name: string }}`、可空 `{?string}`（等价 `{string|null}`）。
 *    - `@typedef {Object} User` + `@property {number} id`：定义一个可复用的对象结构。
 *      之后就能在别处写 `@param {User} user`。
 *    - `@template T`：声明泛型参数；把 `T` 用在 `@param` / `@returns` 里。
 *      这样编辑器能推断出"传 number[] 进去，返回 number"。
 *    - `@type {类型}`：给变量、常量标注类型（尤其适合 `const MAP = {...}` 这种字面量）。
 *    - `@deprecated 说明`：标记废弃。编辑器会把调用处划上删除线并提示替代方案。
 *    - 其他常用：`@throws {TypeError}`、`@example`、`@see`、`@since`、`@file`、
 *      `@readonly`、`@private`、`@callback`、`@this`。
 *    - **关键事实：这些注释在运行时被完全忽略。** Node 不会看它们一眼，
 *      函数照常执行；写错类型也不会在运行时抛错。检查只发生在编辑器/tsc 阶段。
 *
 * 4. 常见陷阱
 *    - 忘了加 `// @ts-check` 或开 `checkJs`：于是 JSDoc 只是普通注释，毫无检查效果。
 *    - `@param` 与 `@returns` 的名字/顺序写错：编辑器认不出来，提示就消失了。
 *    - 只写类型不写描述：类型说明"是什么"，描述说明"为什么/有什么约束"，两者都要。
 *    - 把 JSDoc 当成 TS：JSDoc 表达力有限 —— 没有类型运算、没有条件类型、
 *      复杂泛型写起来极其啰嗦，重构成 TS 的成本会随着代码量上升。
 *    - 类型和实现不一致：注释说返回 `{number}`，实现却可能返回 `undefined`。
 *      这类"注释撒谎"比没有注释更危险，因为使用方会盲目相信它。
 *    - 在 .js 文件里同时有 JSDoc 和 `.d.ts`：容易冲突，二选一。
 *    - 每行都写注释：JSDoc 的成本主要在于"写错就误导"，不值得给私有小函数全部标注。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/07_jsdoc_typing.js
 *
 * 【预期输出】
 *   示范带完整 JSDoc 的函数（可选参数、联合类型、@typedef 对象、@template 泛型、
 *   @deprecated、@type），并实际调用它们验证行为正确；
 *   再证明"JSDoc 在运行时被完全忽略"：类型标注与实参不符时函数照样跑、
 *   @deprecated 的函数照样能调用；最后给出 JSDoc 与 TypeScript 的取舍清单。退出码 0。
 * ============================================================================
 */

// @ts-check
// ↑ 这一行是关键：它让编辑器/tsc 开始检查本文件的 JSDoc 类型。
//   在 VS Code 里打开这个文件，把鼠标悬停到下面任意函数上，就能看到完整的签名提示。
//   注意：这一行对 Node 运行时**毫无影响**，它只是一个普通的行注释。

// ============================================================================
// 小节 1：最基础的标注 —— @param 与 @returns
// ============================================================================
console.log('--- 1. 基础标注：@param 与 @returns ---');

/**
 * 计算两个数的和。
 * @param {number} a 第一个加数
 * @param {number} b 第二个加数
 * @returns {number} 两数之和
 */
function add(a, b) {
  return a + b;
}

/**
 * 把秒数格式化成 `时:分:秒`。
 * @param {number} totalSeconds 总秒数，必须为非负整数
 * @returns {string} 形如 `01:02:03` 的字符串
 * @throws {RangeError} 当 totalSeconds 为负数时抛出
 */
function formatDuration(totalSeconds) {
  if (totalSeconds < 0) {
    throw new RangeError('totalSeconds 不能为负数');
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  // padStart(2, '0') 把 "3" 补成 "03"
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

console.log(`  add(2, 3)                    = ${add(2, 3)}   // @param {number} @returns {number}`);
console.log(`  formatDuration(3723)         = ${formatDuration(3723)}   // @returns {string}`);
try {
  formatDuration(-1);
} catch (err) {
  console.log(`  formatDuration(-1)           -> 抛错 ${err.name}: ${err.message}   // @throws 标注的正是它`);
}

// ============================================================================
// 小节 2：可选参数、默认值与联合类型
// ============================================================================
console.log('\n--- 2. 可选参数、默认值与联合类型 ---');

/**
 * 生成一段问候语。
 * @param {string} name 用户名字
 * @param {number} [hour] 当前小时（0-23）。可选，省略时使用系统时间
 * @param {'formal' | 'casual'} [tone='casual'] 语气。字面量联合类型，写错值编辑器会报错
 * @returns {string} 问候语
 */
function greet(name, hour, tone = 'casual') {
  // 可选参数在运行时就是 undefined，用 ?? 给一个兜底值
  const h = hour ?? new Date().getHours();
  const part = h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好';
  // 三元表达式根据语气选择不同的模板
  return tone === 'formal' ? `${part}，${name} 先生/女士。` : `${part}，${name}~`;
}

console.log(`  greet('alice')                  = ${greet('alice')}`);
console.log(`  greet('alice', 9)               = ${greet('alice', 9)}`);
console.log(`  greet('alice', 9, 'formal')     = ${greet('alice', 9, 'formal')}`);
console.log(`  greet('alice', 20, 'casual')    = ${greet('alice', 20, 'casual')}`);
console.log('  JSDoc 里的 [hour] 表示可选，[tone=\'casual\'] 表示可选且有默认值；');
console.log("  'formal' | 'casual' 是字面量联合类型 —— 编辑器会在传 'xyz' 时划红线。");

/**
 * 按 id 查找用户，找不到返回 null。
 * @param {number} id 用户 id
 * @returns {{ id: number, name: string } | null} 找到则返回用户，否则返回 null
 */
function findUserById(id) {
  const table = { 1: { id: 1, name: 'alice' }, 2: { id: 2, name: 'bob' } };
  return table[id] ?? null; // ?? 只在左边是 null/undefined 时才取右边
}

console.log(`\n  findUserById(1)   = ${JSON.stringify(findUserById(1))}`);
console.log(`  findUserById(999) = ${String(findUserById(999))}   // 联合类型里有 null，调用方必须判空`);
// 演示调用方如何处理"可能为 null"：这就是类型提示想让你养成的习惯
const found = findUserById(2);
console.log(`  安全访问（先判空）: ${found ? found.name : '（未找到）'}`);
console.log(`  更简洁的可选链    : ${found?.name ?? '（未找到）'}`);

// ============================================================================
// 小节 3：@typedef + @property 定义可复用的对象结构
// ============================================================================
console.log('\n--- 3. @typedef / @property：定义对象结构 ---');

/**
 * @typedef {Object} Address 收货地址
 * @property {string} city 城市
 * @property {string} street 街道门牌
 * @property {string} [zip] 邮编（可选）
 * @property {boolean} [isDefault] 是否为默认地址
 */

/**
 * @typedef {Object} User 用户实体
 * @property {number} id 用户 id
 * @property {string} name 用户名
 * @property {string} email 邮箱
 * @property {Address} [address] 收货地址（可选，且本身是个 typedef）
 * @property {string[]} roles 角色列表
 */

/**
 * 渲染用户的收货地址。
 * @param {User} user 用户对象（结构由 @typedef User 定义）
 * @returns {string} 单行地址文本
 */
function renderAddress(user) {
  const addr = user.address;
  // 用可选链逐层判断，避免 "Cannot read properties of undefined"
  if (!addr) return '（未填写地址）';
  const zip = addr.zip ? ` (${addr.zip})` : '';
  return `${addr.city} ${addr.street}${zip}`;
}

/** @type {User} */
const userRecord = {
  id: 1,
  name: 'alice',
  email: 'alice@example.com',
  address: { city: '杭州', street: '文一西路 100 号', zip: '310000' },
  roles: ['user', 'vip'],
};

console.log(`  const userRecord = ...   // 标注为 @type {User}`);
console.log(`  renderAddress(userRecord) = ${renderAddress(userRecord)}`);
console.log(`  嵌套 typedef（User.address 是 Address）：`);
console.log(`    userRecord.address.city          = ${userRecord.address.city}`);
console.log(`    userRecord.address.zip           = ${userRecord.address.zip}`);
console.log(`  可选字段 zip 不传也能工作：`);
console.log(`    renderAddress({..., address:{city:'北京',street:'长安街 1 号'}}) = ${
  renderAddress({ id: 2, name: 'bob', email: 'b@x.com', address: { city: '北京', street: '长安街 1 号' }, roles: [] })
}`);
console.log(`    renderAddress({..., address 缺失}) = ${renderAddress({ id: 3, name: 'carol', email: 'c@x.com', roles: [] })}`);
console.log('  在 VS Code 里输入 user. 会自动补全 id/name/email/address/roles ——');
console.log('  这正是 @typedef 带来的实际收益：不用翻实现就知道对象长什么样。');

// ============================================================================
// 小节 4：@template 泛型 —— 让"输入类型"决定"输出类型"
// ============================================================================
console.log('\n--- 4. @template 泛型 ---');

/**
 * 取数组的第一个元素；空数组返回 undefined。
 * @template T
 * @param {T[]} arr 任意类型的数组
 * @returns {T | undefined} 第一个元素，空数组时为 undefined
 */
function first(arr) {
  return arr[0];
}

/**
 * 用比较函数对数组排序并返回**新数组**（不改原数组）。
 * @template T
 * @param {T[]} arr 待排序数组
 * @param {(a: T, b: T) => number} compare 比较函数，返回负数/0/正数
 * @returns {T[]} 排好序的新数组
 */
function sortedCopy(arr, compare) {
  return [...arr].sort(compare);
}

/**
 * 按字段名把数组转成 Map。
 * @template T
 * @template {keyof T} K
 * @param {T[]} items 数据数组
 * @param {K} keyField 作为键的字段名（被约束为 T 的键）
 * @returns {Map<T[K], T>} 键到元素的映射
 */
function indexBy(items, keyField) {
  const map = new Map();
  for (const item of items) {
    map.set(item[keyField], item);
  }
  return map;
}

const nums = [3, 1, 2];
const words = ['banana', 'apple', 'cherry'];
console.log(`  first([3,1,2])         = ${first(nums)}      // 编辑器推断出返回 number | undefined`);
console.log(`  first(['a','b'])       = ${first(['a', 'b'])}      // 同一函数返回 string | undefined`);
console.log(`  first([])              = ${String(first([]))}   // 空数组 -> undefined`);
console.log(`  sortedCopy([3,1,2], (a,b)=>a-b)  = ${JSON.stringify(sortedCopy(nums, (a, b) => a - b))}`);
console.log(`  原数组未被修改                    = ${JSON.stringify(nums)}`);
console.log(`  sortedCopy(words, ...localeCompare) = ${JSON.stringify(sortedCopy(words, (a, b) => a.localeCompare(b)))}`);
console.log('  泛型的好处：一个函数，编辑器能分别推断出 number[] / string[] 两种返回类型；');
console.log('  标注 @template T 时，T 在 @param 与 @returns 之间"传递"，这就是泛型的本质。');

const userList = [
  { id: 1, name: 'alice', roles: ['user'] },
  { id: 2, name: 'bob', roles: ['user', 'vip'] },
];
const byId = indexBy(userList, 'id');
console.log(`\n  indexBy(users, 'id') 得到 Map，size = ${byId.size}`);
console.log(`    get(1).name = ${byId.get(1).name}`);
console.log(`    get(2).roles = ${JSON.stringify(byId.get(2).roles)}`);
console.log('  @template {keyof T} K 把 keyField 约束为"必须是 T 的键"，');
console.log("  于是 indexBy(users, 'notAField') 会在编辑器里直接报错，而运行时不会 —— 见小节 6。");

// ============================================================================
// 小节 5：@type / @deprecated / 其他常用标签
// ============================================================================
console.log('\n--- 5. @type、@deprecated 与常用标签 ---');

/**
 * 状态到中文名的映射表。
 * @type {Record<string, string>}
 */
const STATUS_LABEL = {
  pending: '待处理',
  active: '进行中',
  done: '已完成',
};

/**
 * @deprecated 自 v2.0 起废弃，请改用 {@link formatStatusV2}。
 *             保留只是为了兼容旧调用方，新代码不要再用。
 * @param {string} status 状态码
 * @returns {string} 中文标签
 */
function formatStatus(status) {
  return STATUS_LABEL[status] ?? '未知状态';
}

/**
 * 新版本的状态格式化。
 * @param {string} status 状态码
 * @param {{ uppercase?: boolean }} [opts] 选项
 * @returns {string} 中文标签
 * @example
 * formatStatusV2('active');                    // => '进行中'
 * formatStatusV2('active', { uppercase: true }); // => '进行中'（中文无大小写，仅演示参数）
 */
function formatStatusV2(status, opts = {}) {
  const label = STATUS_LABEL[status] ?? '未知状态';
  // 演示可选选项对象：用解构 + 默认值
  const { uppercase = false } = opts;
  return uppercase ? label.toUpperCase() : label;
}

console.log(`  STATUS_LABEL 标注为 @type {Record<string, string>}，编辑器能推断 STATUS_LABEL.active 是 string`);
console.log(`  formatStatus('active')     = ${formatStatus('active')}   // 带 @deprecated，编辑器会给调用处划删除线`);
console.log(`  formatStatus('nope')       = ${formatStatus('nope')}`);
console.log(`  formatStatusV2('done')     = ${formatStatusV2('done')}`);
console.log(`  formatStatusV2('done', {uppercase:true}) = ${formatStatusV2('done', { uppercase: true })}`);
console.log('  注意：@deprecated 只是"提示"，不是"禁止" —— 上面的调用照样成功执行了。');

// ============================================================================
// 小节 6：最关键的验证 —— JSDoc 在运行时被完全忽略
// ============================================================================
console.log('\n--- 6. 关键验证：JSDoc 在运行时被完全忽略 ---');

// ① 类型标注与实参不符 —— 运行时完全不报错，照样算出（错误）结果
console.log('  ① 类型不符也照跑：');
console.log(`     函数声明是 add(a: number, b: number): number`);
console.log(`     add(2, 3)        = ${add(2, 3)}          // 类型正确`);
console.log(`     add('2', 3)      = ${JSON.stringify(add('2', 3))}       // 传了字符串，运行时照样跑出 '23'`);
console.log(`     add(undefined, 1)= ${add(undefined, 1)}          // NaN，也不报错`);
console.log('     -> 编辑器会因为 add("2", 3) 划红线，但 Node 运行时完全不知道有这回事。');

// ② @deprecated 的函数照样能调用
console.log('\n  ② @deprecated 不阻止调用：');
console.log(`     formatStatus('pending') = ${formatStatus('pending')}  // 没有任何运行时警告`);

// ③ @typedef 描述的对象结构不被校验
console.log('\n  ③ @typedef 不校验结构：');
console.log(`     renderAddress({}) = ${renderAddress({})}  // 缺字段照样调用，靠运行时判空兜住`);
console.log(`     renderAddress({address:{city:'X',street:'Y'}}) = ${renderAddress({ address: { city: 'X', street: 'Y' } })}`);

// ④ 用 Function.prototype.toString 看看"注释"其实就是源码里的文本
console.log('\n  ④ 从源码层面确认 JSDoc 只是注释：');
const source = add.toString();
console.log(`     add.toString() 的前 3 行：`);
source
  .split('\n')
  .slice(0, 3)
  .forEach((line) => console.log(`       ${line}`));
console.log(`     add.toString() 里包含 "/**" 吗？ ${source.includes('/**')}`);
console.log('     -> 答案是 false：函数源码的文本表示里**连注释都没有**。');
console.log('        注释只存在于 .js 文件里，引擎在解析阶段就把它们丢掉了，');
console.log('        运行时没有任何 API 能读到 JSDoc —— 这正是它"零运行时开销"的原因。');
console.log(`     add.length（形参个数，只数"没有默认值"的参数）= ${add.length}`);
console.log(`     greet.length（hour 没默认值、tone 有默认值）= ${greet.length}`);
console.log(`     add(2, 3, 999) 多传参数 = ${add(2, 3, 999)}  // JS 不检查参数个数，多余的被忽略`);

// ============================================================================
// 小节 7：怎么真正启用检查
// ============================================================================
console.log('\n--- 7. 怎么真正启用检查（否则 JSDoc 只是好看的注释） ---');

console.log('  【方式一】文件级开关：在文件顶部加一行');
console.log('      // @ts-check');
console.log('    本文件在头部注释之后、代码之前就写了它（在 VS Code 里打开本文件即可看到效果）。');
console.log('    想反向关闭某个文件：// @ts-nocheck');

console.log('\n  【方式二】项目级开关：tsconfig.json');
console.log('      {');
console.log('        "compilerOptions": {');
console.log('          "allowJs": true,      // 允许处理 .js 文件');
console.log('          "checkJs": true,      // 检查 .js 里的 JSDoc 类型');
console.log('          "noEmit": true,       // 只检查，不产出文件（纯做静态检查）');
console.log('          "strict": true,       // 打开严格模式（null 检查、隐式 any 检查等）');
console.log('          "target": "ES2022",');
console.log('          "module": "ESNext",');
console.log('          "moduleResolution": "Bundler"');
console.log('        },');
console.log('        "include": ["32_security_and_best_practices/**/*.js"]');
console.log('      }');
console.log('    然后执行： npx tsc --noEmit        （只做类型检查，不生成任何 JS 文件）');

console.log('\n  【方式三】编辑器内置：VS Code 对 .js 文件默认就会读取 JSDoc 做**提示**');
console.log('    但"提示"与"报错"不同：不写 @ts-check / checkJs 时，类型不符只会显得"没补全"，');
console.log('    不会明确报错。想看到红色波浪线，必须走方式一或方式二。');

console.log('\n  【验证清单】配好之后，下面几行应该都会在编辑器里报错（但运行时都不报错）：');
console.log("      add('2', 3);                        // 参数类型不符");
console.log('      greet(123);                         // 参数类型不符');
console.log("      greet('a', 1, 'xyz');               // 不在字面量联合类型里");
console.log('      const x = first([]); x.toFixed(2);  // x 可能是 undefined');
console.log("      indexBy(userList, 'notAField');     // 不是 T 的键");

// ============================================================================
// 小节 8：JSDoc 与 TypeScript 的取舍
// ============================================================================
console.log('\n--- 8. JSDoc vs TypeScript：怎么选 ---');

const comparison = [
  ['构建成本', 'JSDoc 零构建：还是 .js，Node 直接跑', 'TS 需要 tsc / esbuild / swc 等编译步骤'],
  ['运行时零开销', 'JSDoc 完全零开销（编译期就被丢弃）', 'TS 也是零运行时开销（类型在编译期擦除）'],
  ['表达力', 'JSDoc 有限：没有条件类型、映射类型、类型运算', 'TS 完整：类型系统图灵完备，能表达复杂约束'],
  ['复杂泛型', 'JSDoc 的 @template 写复杂约束非常啰嗦', 'TS 的泛型语法自然、可读性好'],
  ['重构能力', 'JSDoc 的跨文件重命名/重构支持较弱', 'TS 的 IDE 重构支持强（改名、提取、移动）'],
  ['渐进采用', 'JSDoc 可以只给几个文件加标注，改动极小', 'TS 通常需要一次性配置 + 逐步迁移 .js -> .ts'],
  ['生态与库类型', 'JSDoc 依赖 @types 包 + 手写标注，覆盖不完整', 'TS 的 DefinitelyTyped 生态最完整'],
  ['团队门槛', 'JSDoc 门槛低：会写注释就会写它', 'TS 需要团队学习类型系统'],
  ['适用场景', '教学仓库、脚本工具、老项目小步改造、原型', '中大型项目、多人协作、长期维护的核心业务'],
];
// 注：中文是双宽字符，用 padEnd 对齐会错位，所以这里用"分行列举"而不是表格
for (const [dim, jsdoc, ts] of comparison) {
  console.log(`  ● ${dim}`);
  console.log(`      JSDoc      ：${jsdoc}`);
  console.log(`      TypeScript ：${ts}`);
}

console.log('\n  实践建议：');
console.log('    1) 新项目且会长期维护 -> 直接上 TypeScript，别绕路。');
console.log('    2) 老项目/教学仓库/一次性脚本 -> 用 JSDoc + checkJs，成本最低。');
console.log('    3) 混合策略：核心数据模型用 .d.ts 或 TS，边缘脚本用 JSDoc，逐步迁移。');
console.log('    4) 无论选哪个：**类型标注必须与实现保持一致**，注释撒谎比没有注释更糟。');
console.log('    5) 本仓库（教学示例）选择 JSDoc 的原因很典型：读者 clone 下来直接 node 就能跑，');
console.log('       不需要先 npm run build 一次，学习路径最短。');

// ============================================================================
// 小节 9：小结
// ============================================================================
console.log('\n--- 9. 小结 ---');
console.log('  1) JSDoc = 写在注释里的类型标注；TypeScript 与编辑器能读懂它，Node 完全忽略它。');
console.log('  2) 核心标签：@param / @returns / @typedef + @property / @template / @type / @deprecated / @throws。');
console.log('  3) 可选参数用 [x]，默认值写 [x=1]；联合类型用 |；字面量联合（如 \'a\' | \'b\'）能约束取值。');
console.log('  4) @template 让"输入类型"传递到"输出类型"，这是泛型在 JSDoc 里的表达方式。');
console.log('  5) 想让检查真正生效，必须有 // @ts-check 或 tsconfig 的 checkJs: true，否则只是好看的注释。');
console.log('  6) 运行时零开销：本文件已实测 —— 类型不符照跑、@deprecated 照调、@typedef 不校验结构。');
console.log('  7) 取舍：JSDoc 胜在零构建成本与低门槛，TS 胜在表达力与重构能力；按项目寿命和团队规模选。');
