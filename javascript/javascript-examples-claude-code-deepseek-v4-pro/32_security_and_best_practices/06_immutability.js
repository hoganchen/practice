/**
 * ============================================================================
 * 知识点：不可变数据 —— Object.freeze（浅冻结！）、不可变更新、深拷贝与代价
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/04_prototype_pollution.js、09_objects（对象）、08_arrays（数组）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "不可变（immutable）"的意思是：**数据一旦创建就不再被修改**。
 *    要"改"数据时，不是去改原来那个对象，而是**创建一个包含新值的新对象**，
 *    原来的对象原封不动地留着。
 *    这与直觉相反（直接赋值多方便），但它换来的是"可预测性"：
 *    你手里拿到的引用，永远指向你当初拿到的那个值，不会在背后被人改掉。
 *    相关 API 分两类：
 *      - 冻结（阻止修改）：Object.freeze（浅）、Object.seal、手写 deepFreeze（深）
 *      - 复制（产生新对象）：展开运算符 `...`、Object.assign、structuredClone、数组的
 *        toSorted / toReversed / toSpliced / with（ES2023 起提供的"不改原数组"版本）
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) 调试友好：一个值在你不知道的地方被改掉，是最难查的 bug 之一。
 *        不可变之后，"谁改的"这个问题从根上消失了 —— 因为没人能改。
 *    (b) 变化检测极便宜：因为"改"必然产生新引用，所以 `prev === next` 为 false
 *        就说明数据变了。React 的 props/state 浅比较、Redux 的 reducer、
 *        memo / PureComponent 全都建立在这个特性上。如果允许原地修改，
 *        浅比较就会漏掉变化，UI 不更新。
 *    (c) 时间旅行调试（Redux DevTools 那套）：每次状态变化都保留一份新状态，
 *        就能在历史状态之间来回切换。原地修改会让所有历史快照都指向同一份数据。
 *    (d) 并发/异步更安全：异步回调里拿到的数据不会在你 await 期间被改掉。
 *    (e) 可安全共享：多个模块可以放心地把同一个对象传来传去，不用防御性拷贝。
 *
 * 3. 核心语法要点
 *    (a) **Object.freeze 是浅冻结**：它只冻结对象**自己的**直接属性，
 *        嵌套对象、数组元素里面的属性**照样能改**。这是最容易被误解的一点。
 *        深冻结必须自己递归（或用成熟库）。
 *    (b) 冻结后的写入行为：**非严格模式下静默失败**（不报错、也不生效，最坑）；
 *        **严格模式下抛 TypeError**。ESM 模块天生是严格模式，所以本项目里会抛错。
 *        想"不抛错地探测"可以用 Reflect.set，它返回 false 表示失败。
 *    (c) `Object.freeze` 是不可逆的：没有"解冻"API。要改只能复制出新对象。
 *    (d) 不可变更新用展开运算符逐层展开：
 *        `{...state, user: {...state.user, name: 'x'}}` —— 嵌套越深，展开越啰嗦，
 *        这是不可变写法的主要使用成本。
 *    (e) 数组的不可变更新：`[...arr, x]`（追加）、`arr.filter(...)`（删除）、
 *        `arr.map(...)`（改元素）、`arr.toSorted(cmp)`（ES2023，排序且不改原数组）。
 *    (f) `structuredClone(obj)` 是平台内置的深拷贝（Node 17+ / 现代浏览器），
 *        支持 Date / Map / Set / RegExp / 循环引用，但**不能**克隆函数、
 *        DOM 节点、类原型（会退化成普通对象）。
 *    (g) `Object.assign({}, a, b)` 是"浅合并"，等价于展开运算符，但更啰嗦且易误用
 *        （`Object.assign(target, src)` 会**改** target，是常见的踩坑点）。
 *
 * 4. 常见陷阱
 *    - **以为 freeze 是深的**：`Object.freeze(obj)` 之后 `obj.nested.x = 1` 照样成功。
 *    - 以为冻结会报错：非严格模式下静默忽略，你会以为"改成功了"但其实没有。
 *    - 用 `JSON.parse(JSON.stringify(x))` 深拷贝：会丢掉 undefined、函数、Symbol、
 *        日期变字符串、Map/Set 变 {}、循环引用直接抛错。能用 structuredClone 就用它。
 *    - `Object.assign(target, src)` 忘了第一个参数要传 `{}`，结果改了 target。
 *    - 展开运算符也是**浅**拷贝：`{...obj}` 里的嵌套对象仍是同一个引用，
 *        改了它等于改了原来那份数据。
 *    - 性能误用：在几十万次的循环里每次深拷贝大对象，会把程序拖垮；
 *       不可变不等于"每个操作都深拷贝"。
 *    - 冻结第三方库返回的对象：可能让库内部后续更新失败（库通常假定对象可写）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/06_immutability.js
 *
 * 【预期输出】
 *   演示 Object.freeze 只冻一层（嵌套照样改）、冻结后写入在严格模式抛错而在
 *   Reflect 下返回 false；手写 deepFreeze 真正冻到最里层；
 *   用展开运算符与 structuredClone 做不可变更新与深拷贝；
 *   用"引用相等"演示为什么不可变让变化检测变便宜；
 *   最后跑一个几十万次的小循环量化不可变更新的开销。全程退出码 0。
 * ============================================================================
 */

// ============================================================================
// 小节 1：不可变是什么 —— 先看"可变"带来的麻烦
// ============================================================================
console.log('--- 1. 先看"可变"带来的麻烦 ---');

/**
 * 【反面示范】原地修改传入的对象。
 * @param {object} user
 * @returns {object} 同一个对象（但已被改过）
 */
function renameInPlace(user) {
  user.name = user.name.toUpperCase(); // 直接改了调用方的数据
  return user;
}

const originalUser = { name: 'alice', age: 30 };
// 注意：console.log 打印的是对象的"实时引用"，等到真正输出时可能已经被改过了。
// 所以这里先快照成字符串，才能如实展示"改之前"的样子 —— 这本身也是可变数据的一个坑。
const beforeSnapshot = JSON.stringify(originalUser);
const returnedUser = renameInPlace(originalUser);
console.log(`  调用前 originalUser = ${beforeSnapshot}`);
console.log(`  调用后 originalUser = ${JSON.stringify(originalUser)}  <- 调用方的数据被"偷偷"改了`);
console.log(`  returnedUser === originalUser ? ${returnedUser === originalUser}  <- 是同一个对象`);
console.log('  （顺带一提：如果上面用 console.log(originalUser) 打印对象而不是 JSON 字符串，');
console.log('    你看到的会是"改之后"的值 —— 因为对象是引用，打印时已经变了。）');
console.log('  问题：函数名看起来只是"改名"，却顺手改了你手里的数据。');
console.log('        当代码分散在十几个文件里时，这类"背后修改"极难排查。');

/**
 * 【正面示范】不可变：返回一个新对象，不动传入的对象。
 * @param {object} user
 * @returns {object} 新对象
 */
function renameImmutable(user) {
  // 展开运算符把 user 的自有可枚举属性拷到新对象里，再覆盖 name
  return { ...user, name: user.name.toUpperCase() };
}

const userA = { name: 'bob', age: 25 };
const userB = renameImmutable(userA);
console.log(`\n  不可变版本：`);
console.log(`    userA = ${JSON.stringify(userA)}  <- 原对象没变`);
console.log(`    userB = ${JSON.stringify(userB)}  <- 新对象带上了新值`);
console.log(`    userA === userB ? ${userA === userB}  <- 是两个不同的对象`);
console.log('    好处：函数是"纯"的，调用方拿到的原数据永远安全。');

// ============================================================================
// 小节 2：Object.freeze 是【浅】冻结 —— 最重要的一节
// ============================================================================
console.log('\n--- 2. Object.freeze 只冻一层（浅冻结）---');

const shallowFrozen = Object.freeze({
  name: 'alice',
  age: 30,
  // 注意下面这两个是"嵌套"的：对象套对象、对象套数组
  address: { city: '杭州', zip: '310000' },
  tags: ['admin'],
});

console.log(`  const obj = Object.freeze({ name, age, address: {...}, tags: [...] })`);
console.log(`  Object.isFrozen(obj)              = ${Object.isFrozen(shallowFrozen)}`);
console.log(`  Object.isFrozen(obj.address)      = ${Object.isFrozen(shallowFrozen.address)}  <- 嵌套对象没被冻结！`);
console.log(`  Object.isFrozen(obj.tags)         = ${Object.isFrozen(shallowFrozen.tags)}  <- 数组也没被冻结！`);

// 改顶层属性：失败（严格模式抛错）
console.log(`\n  尝试改顶层属性 name：`);
try {
  shallowFrozen.name = 'hacker';
  console.log(`    居然成功了？name = ${shallowFrozen.name}`);
} catch (err) {
  console.log(`    抛错: ${err.name}: ${err.message}`);
  console.log(`    （ESM 是严格模式，所以抛错；非严格模式下会"静默失败"，更坑 —— 见小节 3）`);
}
console.log(`    最终 name 依然是: ${shallowFrozen.name}`);

// 改嵌套属性：成功！
console.log(`\n  尝试改嵌套属性 address.city：`);
shallowFrozen.address.city = '黑客市';
console.log(`    成功了！address.city = ${shallowFrozen.address.city}  <-- 冻结完全没有延伸到这一层`);
console.log(`  尝试改数组元素 tags[0]：`);
shallowFrozen.tags[0] = 'superadmin';
console.log(`    成功了！tags = ${JSON.stringify(shallowFrozen.tags)}  <-- 数组内容也照样能改`);
console.log('\n  结论：Object.freeze 冻结的是"对象的直接属性"，不是"整棵对象树"。');
console.log('        顶层属性变成不可写/不可配置/不可新增，但嵌套对象/数组仍是普通对象。');

// ============================================================================
// 小节 3：冻结后的写入行为 —— 静默失败 vs 抛错
// ============================================================================
console.log('\n--- 3. 冻结后写入：静默失败 vs 抛错（这个差异很坑） ---');

const frozenThing = Object.freeze({ a: 1 });
console.log('  const t = Object.freeze({a: 1})');
console.log('  对比几种写入方式的反馈：');

// ① 直接赋值：严格模式抛 TypeError，非严格模式静默失败
try {
  frozenThing.a = 2;
  console.log('    ① 直接赋值 t.a = 2     -> 没报错（可能是静默失败，也可能是非严格模式）');
} catch (err) {
  console.log(`    ① 直接赋值 t.a = 2     -> 抛错 ${err.name}（严格模式行为）`);
}

// ② 新增属性：同上
try {
  frozenThing.b = 3;
  console.log('    ② 新增 t.b = 3         -> 没报错');
} catch (err) {
  console.log(`    ② 新增 t.b = 3         -> 抛错 ${err.name}`);
}

// ③ delete：同上
try {
  delete frozenThing.a;
  console.log('    ③ delete t.a           -> 没报错');
} catch (err) {
  console.log(`    ③ delete t.a           -> 抛错 ${err.name}`);
}

// ④ Reflect.set：不抛错，返回 false —— 适合"想探测能不能写"的场景
const setResult = Reflect.set(frozenThing, 'a', 2);
console.log(`    ④ Reflect.set(t,'a',2) -> 返回 ${setResult}（false 表示写入失败，且不抛异常）`);
console.log(`    ⑤ Object.isFrozen(t)   -> ${Object.isFrozen(frozenThing)}`);

console.log('\n  为什么这个差异重要：');
console.log('    非严格模式（老式 <script>、非严格 CommonJS）下写入**静默失败** ——');
console.log('    代码不报错，你以为改成功了，实际读到的是旧值，bug 会非常隐蔽。');
console.log('    严格模式（ESM / "use strict" / class 体 / 现代构建产物）下会立刻抛错，');
console.log('    问题暴露得早 —— 这也是"始终使用严格模式"的一个具体收益。');
console.log(`    另外可以看属性的"描述符"来确认冻结效果：`);
console.log(`      ${JSON.stringify(Object.getOwnPropertyDescriptor(frozenThing, 'a'), (k, v) => (typeof v === 'function' ? '[function]' : v))}`);

// ============================================================================
// 小节 4：深冻结 —— 手写 deepFreeze
// ============================================================================
console.log('\n--- 4. 深冻结：手写 deepFreeze ---');

/**
 * 递归冻结整棵对象树。
 * @param {unknown} obj 要冻结的目标
 * @param {WeakSet<object>} [seen] 已访问集合，用于处理循环引用，避免无限递归
 * @returns {unknown} 同一个对象（已被原地冻结）
 */
function deepFreeze(obj, seen = new WeakSet()) {
  // 只有对象/函数才需要处理；原始值（number/string/null/undefined）直接返回
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return obj;
  }
  // 已经在处理中就跳过 —— 否则遇到循环引用（a.self = a）会无限递归爆栈
  if (seen.has(obj)) return obj;
  seen.add(obj);
  // 先递归冻结所有"自有属性值"，再冻结自己。
  // 顺序很重要：如果先冻结自己，后面的 Object.freeze 依然有效（freeze 不改值），
  // 但先处理子节点语义更清晰（自底向上）。
  for (const key of Reflect.ownKeys(obj)) {
    // Reflect.ownKeys 会连 Symbol 键、不可枚举键一起拿到，比 Object.keys 更完整
    const value = obj[key];
    // 只递归处理"是对象"的值；同时用 try 兜住某些内置对象的只读属性（如数组的 length）
    try {
      deepFreeze(value, seen);
    } catch {
      // 某些宿主对象的属性访问可能抛错，忽略即可 —— 我们的目标是尽力冻结
    }
  }
  return Object.freeze(obj);
}

const deepTarget = {
  name: 'alice',
  address: { city: '杭州', geo: { lat: 30.27, lng: 120.15 } },
  tags: ['admin', 'vip'],
};
deepFreeze(deepTarget);

console.log(`  deepFreeze(obj) 之后逐层检查：`);
console.log(`    Object.isFrozen(obj)               = ${Object.isFrozen(deepTarget)}`);
console.log(`    Object.isFrozen(obj.address)       = ${Object.isFrozen(deepTarget.address)}`);
console.log(`    Object.isFrozen(obj.address.geo)   = ${Object.isFrozen(deepTarget.address.geo)}`);
console.log(`    Object.isFrozen(obj.tags)          = ${Object.isFrozen(deepTarget.tags)}`);

try {
  deepTarget.address.geo.lat = 0;
  console.log(`    改最深层 lat -> 成功了？ ${deepTarget.address.geo.lat}`);
} catch (err) {
  console.log(`    改最深层 obj.address.geo.lat -> 抛错 ${err.name}（正是我们想要的）`);
}
try {
  deepTarget.tags.push('hacked');
  console.log(`    push 到 tags -> 成功了？ ${JSON.stringify(deepTarget.tags)}`);
} catch (err) {
  console.log(`    obj.tags.push('hacked')      -> 抛错 ${err.name}（数组也被冻住了）`);
}

// 循环引用也能正确处理（WeakSet 去重）
const cyclic = { name: 'cycle' };
cyclic.self = cyclic; // 自己指向自己
deepFreeze(cyclic);
console.log(`\n  循环引用测试：deepFreeze 处理 a.self = a 没有爆栈 -> ${Object.isFrozen(cyclic)} ✔`);
console.log('  注意：deepFreeze 是"原地冻结"，会改到调用方传入的对象；');
console.log('        如果你不希望影响调用方，应先 structuredClone 一份再冻结。');

// ============================================================================
// 小节 5：不可变更新 —— 展开运算符（对象与数组）
// ============================================================================
console.log('\n--- 5. 不可变更新：展开运算符 ---');

const state = {
  user: { name: 'alice', email: 'alice@example.com' },
  todos: ['买菜', '写代码'],
  theme: 'dark',
};

// ---- 对象：改顶层字段 ----
const stateV2 = { ...state, theme: 'light' };
console.log(`  改顶层 theme：`);
console.log(`    原 state.theme  = ${state.theme}  <- 没变`);
console.log(`    新 stateV2.theme = ${stateV2.theme}`);

// ---- 对象：改嵌套字段（必须逐层展开！）----
// 这是不可变写法最需要小心的地方：只展开一层的话，嵌套对象仍是同一个引用。
const wrongUpdate = { ...state, user: state.user };
wrongUpdate.user.name = 'mallory'; // 直接改，污染了原 state！
console.log(`\n  错误示范 —— 只展开一层就改嵌套属性：`);
console.log(`    state.user.name = ${state.user.name}  <-- 原数据被改了！（因为 user 是同一个引用）`);

// 复原一下，方便后续演示（用不可变方式恢复）
state.user = { ...state.user, name: 'alice' };

const rightUpdate = {
  ...state, // 第一层：拷 theme / todos 等
  user: {
    // 第二层：重新构造 user
    ...state.user, // 先拷 user 原有字段
    name: 'mallory', // 再覆盖要改的那个
  },
};
console.log(`  正确示范 —— 逐层展开：`);
console.log(`    state.user.name     = ${state.user.name}  <- 原数据完好`);
console.log(`    rightUpdate.user.name = ${rightUpdate.user.name}  <- 新数据是新值`);
console.log(`    state.user === rightUpdate.user ? ${state.user === rightUpdate.user}  <- 引用不同，变化可被检测`);

// ---- 数组：各种不可变操作 ----
const todos = ['买菜', '写代码', '健身'];
console.log(`\n  数组不可变操作（原数组 ${JSON.stringify(todos)}）：`);

// 追加：展开 + 新元素
const added = [...todos, '遛狗'];
console.log(`    追加  [...todos, '遛狗']        -> ${JSON.stringify(added)}`);

// 删除：filter 生成新数组
const removed = todos.filter((t) => t !== '写代码');
console.log(`    删除  todos.filter(t => t !== '写代码') -> ${JSON.stringify(removed)}`);

// 修改某一项：map
const mapped = todos.map((t) => (t === '健身' ? '跑步' : t));
console.log(`    修改  todos.map(...'健身'->'跑步')      -> ${JSON.stringify(mapped)}`);

// 排序（通用写法）：先拷贝再 sort，绝不直接 sort 原数组
const sortedA = [...todos].sort();
console.log(`    排序  [...todos].sort()        -> ${JSON.stringify(sortedA)}`);
console.log(`          注意 todos.sort() 是"原地排序"，会改掉原数组 —— 必须配合展开先拷贝。`);

// ES2023 起数组提供了"不改原数组"的版本：toSorted / toReversed / toSpliced / with
// 它们是较新的 API（Node 20+），这里做一次特性检测，保证在旧版本 Node 上也能跑通。
if (typeof todos.toSorted === 'function') {
  console.log(`    排序  todos.toSorted()         -> ${JSON.stringify(todos.toSorted())}  (ES2023)`);
  console.log(`    替换  todos.with(1, '读书')     -> ${JSON.stringify(todos.with(1, '读书'))}  (ES2023)`);
} else {
  console.log('    当前 Node 版本不含 toSorted/with（ES2023），已跳过这两行演示。');
  console.log('    等价的旧写法：[...todos].sort() / todos.map((t, i) => (i === 1 ? "读书" : t))');
  console.log(`    替换  todos.map(...)           -> ${JSON.stringify(todos.map((t, i) => (i === 1 ? '读书' : t)))}`);
}

console.log(`    原数组始终是                      -> ${JSON.stringify(todos)}  <- 一次都没变`);

// ============================================================================
// 小节 6：Object.assign / structuredClone / JSON 深拷贝的取舍
// ============================================================================
console.log('\n--- 6. Object.assign、structuredClone 与 JSON 深拷贝 ---');

// ---- Object.assign：浅合并，注意第一个参数会被修改 ----
const defaults = { theme: 'dark', lang: 'zh', retries: 3 };
const userPrefs = { theme: 'light' };

// 正确用法：目标传一个空对象，谁都不受影响
const merged = Object.assign({}, defaults, userPrefs);
console.log(`  Object.assign({}, defaults, userPrefs) = ${JSON.stringify(merged)}`);
console.log(`    defaults 没变: ${JSON.stringify(defaults)}`);

// 错误用法：第一个参数被改了
const trapTarget = { theme: 'dark' };
Object.assign(trapTarget, userPrefs);
console.log(`  Object.assign(target, src) 的坑：target 被改成 ${JSON.stringify(trapTarget)}`);
console.log(`    -> 第一个参数是"写入目标"，不是"参考值"。展开运算符 {...a, ...b} 没有这个歧义，推荐用它。`);

// ---- structuredClone：真正的深拷贝 ----
const deepSource = {
  name: 'alice',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  tags: new Set(['a', 'b']),
  meta: new Map([['k', 'v']]),
  nested: { level2: { level3: [1, 2, 3] } },
};
deepSource.self = deepSource; // 循环引用

const cloned = structuredClone(deepSource);
console.log(`\n  structuredClone 深拷贝：`);
console.log(`    nested 是不同对象吗？        ${cloned.nested !== deepSource.nested}`);
console.log(`    level3 数组是新的吗？        ${cloned.nested.level2.level3 !== deepSource.nested.level2.level3}`);
console.log(`    Date 还是 Date 吗？          ${cloned.createdAt instanceof Date}（值相同：${cloned.createdAt.getTime() === deepSource.createdAt.getTime()}）`);
console.log(`    Set 还是 Set 吗？            ${cloned.tags instanceof Set} -> ${JSON.stringify([...cloned.tags])}`);
console.log(`    Map 还是 Map 吗？            ${cloned.meta instanceof Map} -> ${JSON.stringify([...cloned.meta])}`);
console.log(`    循环引用 self 指回自己了吗？  ${cloned.self === cloned}`);

// ---- JSON 深拷贝的局限 ----
const jsonHostile = {
  fn: () => 1,
  undef: undefined,
  sym: Symbol('s'),
  date: new Date('2024-01-01T00:00:00Z'),
  set: new Set([1, 2]),
  nan: NaN,
  inf: Infinity,
};
const jsonCloned = JSON.parse(JSON.stringify(jsonHostile));
console.log(`\n  JSON.parse(JSON.stringify(x)) 的问题：`);
console.log(`    原对象键: ${Object.keys(jsonHostile).join(', ')}`);
console.log(`    克隆键  : ${Object.keys(jsonCloned).join(', ')}  <- 函数/undefined/Symbol 直接消失`);
console.log(`    date    : ${jsonHostile.date instanceof Date} -> ${typeof jsonCloned.date} (${jsonCloned.date})`);
console.log(`    set     : ${jsonHostile.set instanceof Set} -> ${JSON.stringify(jsonCloned.set)}  <- Set 变成空对象`);
console.log(`    NaN/Infinity: ${jsonHostile.nan}/${jsonHostile.inf} -> ${jsonCloned.nan}/${jsonCloned.inf}  <- 变成 null`);
try {
  const c = { a: 1 };
  c.self = c;
  JSON.stringify(c);
} catch (err) {
  console.log(`    循环引用: 抛错 ${err.name}: ${err.message}`);
}
console.log('  结论：优先用 structuredClone；只有在"数据保证是纯 JSON"时才用 JSON 方案。');

// ============================================================================
// 小节 7：为什么不可变好 —— 变化检测变得极便宜
// ============================================================================
console.log('\n--- 7. 为什么不可变好：用"引用相等"代替"深度比较" ---');

/**
 * 深度比较两个对象是否相等（昂贵：要遍历所有嵌套字段）。
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

// 场景：一个稍大的状态对象
const bigState = {
  user: { name: 'alice', prefs: { theme: 'dark', lang: 'zh' } },
  items: Array.from({ length: 200 }, (_, i) => ({ id: i, name: `item-${i}`, tags: ['a', 'b'] })),
};

// 方式一：原地修改。为了能"事后知道变了没有"，你**必须**提前存一份深拷贝做对照。
const snapshotForCompare = structuredClone(bigState); // 这份拷贝本身就是成本
const sameRef = bigState; // 拿到同一个引用
bigState.items[100].name = 'changed'; // 原地改
console.log(`  【可变路线】原地修改 bigState.items[100].name`);
console.log(`    sameRef === bigState ?                 ${sameRef === bigState}  <- 引用完全没变`);
console.log(`    能靠 === 判断出变化吗？                不能（它是同一个对象）`);
console.log(`    只能靠提前存的深拷贝做深度比较：        deepEqual(snapshot, bigState) = ${deepEqual(snapshotForCompare, bigState)}`);
console.log('    也就是说：想检测变化，你得先付一次"深拷贝"的成本。');

// 方式二：不可变更新，一次 === 就知道变了，而且根本不需要提前快照
const immutableCopy = {
  ...bigState,
  items: bigState.items.map((it, i) => (i === 100 ? { ...it, name: 'changed-again' } : it)),
};
console.log(`\n  【不可变路线】新建 immutableCopy`);
console.log(`    immutableCopy === bigState ?           ${immutableCopy === bigState}  <- 一次比较就知道变了，零额外成本`);
console.log(`    未改动的元素还是同一个引用吗？          ${immutableCopy.items[0] === bigState.items[0]}  <- 是！这叫"结构共享"`);
console.log(`    只重建了"变化路径上"的对象，其余 199 个元素原样复用。`);

console.log('\n  这就是 React/Redux 浅比较能工作的原理：');
console.log('    if (prevProps !== nextProps) 重新渲染');
console.log('    只要约定"改数据必须产生新引用"，一次 === 就能替代昂贵的深度比较。');
console.log('    反过来，如果组件里直接 push/splice 改了 state 数组，引用没变，');
console.log('    浅比较认为"没变化"，UI 就不会更新 —— 这是 React 新手最常见的 bug。');
console.log('    另外，不可变还让"时间旅行调试"成为可能：每步都留一份新状态，随时回放。');

// ============================================================================
// 小节 8：代价 —— 不可变不是免费的
// ============================================================================
console.log('\n--- 8. 代价：内存、性能与"深拷贝很贵" ---');

// 一个简单但可量化的对比：原地累加 vs 每次新建对象
const ITERATIONS = 200_000; // 控制在几十万级，避免拖慢示例

/** 构造一个中等大小的状态对象。 */
function makeState(i) {
  return { id: i, name: `user-${i}`, balance: i * 2, tags: ['a', 'b', 'c'] };
}

// 方式一：原地修改（快，但不安全）
const mutableAcc = makeState(0);
let t0 = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i += 1) {
  mutableAcc.balance += i;
  mutableAcc.id = i;
}
let t1 = process.hrtime.bigint();
const mutableMs = Number(t1 - t0) / 1e6;

// 方式二：不可变更新（每次新建对象 —— 安全，但有分配开销）
let immutableAcc = makeState(0);
t0 = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i += 1) {
  immutableAcc = { ...immutableAcc, id: i, balance: immutableAcc.balance + i };
}
t1 = process.hrtime.bigint();
const immutableMs = Number(t1 - t0) / 1e6;

// 方式三：不可变更新 + 每轮深拷贝（最贵，通常是不必要的）
let cloneAcc = makeState(0);
t0 = process.hrtime.bigint();
for (let i = 0; i < ITERATIONS; i += 1) {
  const c = structuredClone(cloneAcc);
  c.id = i;
  c.balance += i;
  cloneAcc = c;
}
t1 = process.hrtime.bigint();
const cloneMs = Number(t1 - t0) / 1e6;

console.log(`  ${ITERATIONS.toLocaleString()} 次更新，三种写法的耗时对比（同一台机器，仅作量级参考）：`);
console.log(`    ① 原地修改            : ${mutableMs.toFixed(1)} ms`);
console.log(`    ② 展开运算符不可变更新 : ${immutableMs.toFixed(1)} ms`);
console.log(`    ③ 每轮 structuredClone : ${cloneMs.toFixed(1)} ms  <- 明显最贵`);
console.log(`    ② 相对 ① 的倍数       : ${(immutableMs / mutableMs).toFixed(2)}x`);
console.log(`    ③ 相对 ① 的倍数       : ${(cloneMs / mutableMs).toFixed(2)}x`);
console.log('  观察与建议：');
console.log('    - 不可变更新的开销主要来自"对象分配"，量级通常是原地的 1~3 倍，');
console.log('      在业务代码里几乎从不构成瓶颈；');
console.log('    - 真正贵的是"每轮深拷贝整个大对象"，那是不必要的 ——');
console.log('      不可变的正确姿势是"只重建变化路径上的对象"（结构共享），而不是整体深拷贝；');
console.log('    - 极端热路径（每帧几万次更新的动画/物理计算）里，可以局部使用可变写法，');
console.log('      但要在模块边界上做"进入不可变世界"的转换（拷贝一次再冻结）。');
console.log('    - 大对象深拷贝本身就贵，能在更新时复用未改动的子树就复用（上面的结构共享）。');

// ============================================================================
// 小节 9：小结
// ============================================================================
console.log('\n--- 9. 小结 ---');
console.log('  1) 不可变 = 不修改原数据，改数据就产生新对象；换来可预测性、可调试性、可安全共享。');
console.log('  2) Object.freeze 是**浅冻结**：嵌套对象与数组元素照样能改，深冻结必须自己递归。');
console.log('  3) 冻结后的写入：非严格模式静默失败（最坑），严格模式（ESM/class）抛 TypeError；');
console.log('     Reflect.set 返回 false，适合"探测式"判断。freeze 不可逆，没有解冻 API。');
console.log('  4) 不可变更新用展开运算符**逐层展开**；只展开一层就去改嵌套对象，等于原地修改。');
console.log('  5) 数组用 [...arr]、filter、map、toSorted、with；这些都不改原数组。');
console.log('  6) 深拷贝优先 structuredClone（支持 Date/Map/Set/循环引用）；');
console.log('     JSON.parse(JSON.stringify()) 会丢函数/undefined，日期变字符串，循环引用直接抛错。');
console.log('  7) 不可变的最大收益：变化检测从"深度比较"降级成"一次 ==="，撑起了 React/Redux 的渲染模型。');
console.log('  8) 代价是对象分配的开销（通常可接受）；避免"每轮整体深拷贝"这种错误姿势，用结构共享。');
