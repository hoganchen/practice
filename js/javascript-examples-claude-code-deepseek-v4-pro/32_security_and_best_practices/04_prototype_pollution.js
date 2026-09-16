/**
 * ============================================================================
 * 知识点：原型污染（Prototype Pollution）—— __proto__ / constructor.prototype 攻击与防御
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】高级
 * 【前置知识】32_security_and_best_practices/01_input_validation.js、09_objects（对象与原型链）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 的每个普通对象都通过隐藏的 [[Prototype]] 链指向一个"原型对象"，
 *    而 `Object.prototype` 位于所有普通对象原型链的顶端。所以：
 *      **只要往 Object.prototype 上写一个属性，全进程里所有普通对象都会"拥有"这个属性。**
 *    原型污染指的是：攻击者通过一个"递归合并/按路径赋值"的入口，把 `__proto__`（或
 *    `constructor.prototype`）当作普通键名传进去，让程序的合并逻辑顺着原型链
 *    走到了 `Object.prototype` 并往上写数据。
 *    一句话：**它是"数据写入"被误导成了"给全局原型打补丁"。**
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) 触发面极广：任何"把用户提供的 JSON 深合并进配置对象"的地方都可能中招 ——
 *        合并配置项、合并查询参数、合并主题/样式覆盖、模板数据合并、i18n 文案合并、
 *        GraphQL/JSON 反序列化后的对象拷贝、某些测试工具与老版本库（lodash 的
 *        _.merge / _.defaultsDeep 历史上就修过这类问题）。
 *    (b) 后果是"全局且隐蔽"：单个请求就能污染整个 Node 进程，此后所有请求、
 *        所有用户都受影响；而且代码里根本看不到污染源，排查极其困难。
 *    (c) 常见提权路径：很多框架用 `options.isAdmin || false`、
 *        `if (user.role === 'admin')`、`if (obj.authenticated)` 这种"读属性"的方式
 *        做判断。污染后这些判断直接恒真 —— 客户端参数校验形同虚设。
 *    (d) 其他后果：DoS（污染 toString / valueOf 导致代码崩溃）、模板引擎 RCE
 *        （污染模板编译选项后注入代码）、绕过过滤（污染某个库的配置开关）。
 *
 * 3. 核心语法要点
 *    (a) `__proto__` 是一个定义在 Object.prototype 上的**访问器属性**：
 *        `obj.__proto__` 读的是 obj 的原型对象；`obj.__proto__ = x` 会改写 obj 的原型。
 *        但 `JSON.parse('{"__proto__": {...}}')` 的结果里，`__proto__` 是一个**普通的自有数据属性**
 *        （JSON.parse 规定用 CreateDataProperty 创建属性，不触发 setter）——
 *        **这就是"JSON.parse 本身安全，但 parse 出来的东西一旦被 merge 就危险"的原因。**
 *    (b) `obj.constructor.prototype` 是另一条路径：`{}` 的 constructor 是 Object，
 *        Object.prototype 就是全局原型。即使某些库屏蔽了 `__proto__` 这个键名，
 *        这条路仍然通。
 *    (c) 判定"是不是自有属性"要用 `Object.hasOwn(obj, key)`
 *        或 `Object.prototype.hasOwnProperty.call(obj, key)`；
 *        **不要写 `obj.hasOwnProperty(key)`** —— 这个属性本身也可能被污染/覆盖。
 *    (d) `Object.create(null)` 创建的对象没有原型链，是"纯净字典"，天然免疫。
 *    (e) `Map` 的键是真正的数据（可以是任意类型，不参与属性查找），同样天然免疫。
 *    (f) `Object.freeze(Object.prototype)` 可以从根上冻结 —— 但它是**全局性**操作，
 *        可能影响第三方库里某些"给原型打补丁"的写法（polyfill），上线前要评估。
 *
 * 4. 常见陷阱
 *    - 以为"我做了输入校验就没事"：`__proto__` 是合法字符串，很多校验器根本不会拒绝它。
 *    - 只屏蔽 `__proto__` 而忘了 `constructor` / `prototype`：三条路要一起堵。
 *    - 用 `for...in` 遍历源对象做合并：它会连继承来的可枚举属性一起遍历，
 *      污染后再合并就会"把污染扩散到更多对象"。
 *    - 以为"我只改了自己的对象"：`merge(target, src)` 里的 target 若是 `{}`，
 *      而 src 里有 `__proto__`，被改的是 Object.prototype，不是 target。
 *    - 用 `JSON.parse(JSON.stringify(x))` 做深拷贝：它**不会**触发污染（也不拷贝原型），
 *      但它会丢掉 undefined/函数/Date/Map，且有性能代价 —— 它"碰巧安全"不等于"正确"。
 *    - 以为前端才需要担心：Node 服务端一次污染 = 整个进程沦陷，比前端更严重。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/04_prototype_pollution.js
 *
 * 【预期输出】
 *   先演示 JSON.parse 自身是安全的；再用"有漏洞的递归 merge"分别通过
 *   __proto__ 与 constructor.prototype 两条路径污染 Object.prototype，
 *   打印污染前后的行为对比（含一个被绕过的权限判断），
 *   然后**在 try/finally 中把污染彻底清理干净**并验证恢复原状；
 *   最后演示四种防御写法确实挡住了同样的攻击载荷。全程退出码 0。
 * ============================================================================
 */

// ============================================================================
// 小节 1：原型链速览 —— 为什么"污染一个对象"等于"污染所有对象"
// ============================================================================
console.log('--- 1. 原型链速览：为什么污染是全局性的 ---');

const plain = { name: 'alice' };
console.log(`  plain = {name:'alice'} 的自身键: ${JSON.stringify(Object.keys(plain))}`);
console.log(`  Object.getPrototypeOf(plain) === Object.prototype ? ${Object.getPrototypeOf(plain) === Object.prototype}`);
console.log(`  Object.getPrototypeOf(Object.prototype) 是 null ? ${Object.getPrototypeOf(Object.prototype) === null}`);
console.log('  也就是说：plain -> Object.prototype -> null。');
console.log('  而几乎所有普通对象（包括后面 new 出来的、字面量写出来的）都挂在 Object.prototype 下面，');
console.log('  所以"往 Object.prototype 上加一个属性" = "给全进程所有普通对象加上一个属性"。');
console.log(`  证据：'toString' 从来没人定义过，但每个对象都有 -> plain.toString 是 ${typeof plain.toString}`);
console.log('  它就是继承自 Object.prototype 的 —— 污染的原理与它一模一样。');

// ============================================================================
// 小节 2：JSON.parse 本身是安全的（关键前置结论）
// ============================================================================
console.log('\n--- 2. 先确认：JSON.parse 本身不会污染原型 ---');

const maliciousJson = '{"__proto__": {"pollutedByJsonParse": true}, "normalKey": 1}';
console.log(`  恶意 JSON 字符串: ${maliciousJson}`);

const parsed = JSON.parse(maliciousJson);
console.log(`  Object.keys(parsed)          = ${JSON.stringify(Object.keys(parsed))}`);
console.log(`  含自有键 "__proto__" ?        = ${Object.hasOwn(parsed, '__proto__')}`);
console.log(`  parsed 的原型被换掉了吗？      = ${Object.getPrototypeOf(parsed) !== Object.prototype ? '是（危险）' : '否（安全）'}`);
console.log(`  新建对象能看到该属性吗？       = ${({}).pollutedByJsonParse === undefined ? '看不到（安全）' : '看得到（已被污染）'}`);
console.log('  结论：JSON.parse 用"创建自有数据属性"的方式处理 __proto__，不会触发原型 setter，');
console.log('        所以**解析这一步是安全的**。真正的危险发生在"解析之后你怎么用它" ——');
console.log('        只要你把这个对象丢进一个"递归 merge / 按路径赋值"的函数，污染就发生了。');

// ============================================================================
// 小节 3：漏洞代码 —— 一个有缺陷的递归 merge
// ============================================================================
console.log('\n--- 3. 漏洞代码：有缺陷的递归 merge ---');

/**
 * 【漏洞】递归深合并。这是"配置合并"最常见的写法，也是原型污染最经典的载体。
 * 缺陷在于：它把源对象的**所有键**都当作"普通数据键"处理，
 * 完全没有意识到 `__proto__` / `constructor` / `prototype` 是"能改变原型链的特殊键"。
 * @param {object} target 目标对象
 * @param {object} source 源对象（可能来自用户输入）
 * @returns {object} 合并后的 target
 */
function vulnerableMerge(target, source) {
  // 用 Object.keys 只取自有可枚举键（比 for...in 更收敛，但依然挡不住 __proto__）
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    // 如果两边都是"对象"，就递归下去做深合并
    if (srcVal !== null && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      // 如果 target 上没有这个键，先补一个空对象
      if (target[key] === undefined || target[key] === null) {
        target[key] = {};
      }
      // 递归合并 —— 问题就出在这一行：如果 key 是 '__proto__'，
      // target[key] 取到的是 **Object.prototype**，于是下一步就是往全局原型上写数据。
      vulnerableMerge(target[key], srcVal);
    } else {
      // 原始值直接赋值
      target[key] = srcVal;
    }
  }
  return target;
}

console.log('  漏洞点在于：');
console.log('    if (target[key] === undefined) target[key] = {}');
console.log('    vulnerableMerge(target[key], srcVal)');
console.log("    当 key === '__proto__' 时，target['__proto__'] 取到的是 Object.prototype（它不为 undefined），");
console.log('    于是递归直接"落"在 Object.prototype 上，接下来的赋值就写进了全局原型。');

// ============================================================================
// 小节 4：攻击演示 ① —— 通过 __proto__ 污染 Object.prototype
// ============================================================================
console.log('\n--- 4. 攻击演示 ①：__proto__ 路径污染 Object.prototype ---');

// 攻击载荷：一个"看起来人畜无害"的配置对象
const attackPayloadProto = '{"__proto__": {"isAdmin": true, "pollutedAt": "2024-01-01"}}';

/**
 * 模拟业务里的对象，用来观察污染前后的差别。
 * @param {string} name
 * @returns {object}
 */
function makeUser(name) {
  return { name }; // 注意：它自己**没有** isAdmin 属性
}

/**
 * 模拟一个基于"属性读取"的权限判断（现实中大量存在这种写法）。
 * @param {object} user
 * @returns {boolean}
 */
function isAdminBad(user) {
  // 反面教材：直接读属性，读到 undefined 当 false。
  // 只要原型上被污染出 isAdmin=true，这里就恒真。
  return user.isAdmin === true;
}

try {
  // ---- 污染前 ----
  console.log('  【污染前】');
  console.log(`    Object.prototype.isAdmin          = ${Object.prototype.isAdmin}`);
  console.log(`    ({}).isAdmin                      = ${({}).isAdmin}`);
  console.log(`    makeUser('alice').isAdmin         = ${makeUser('alice').isAdmin}`);
  console.log(`    isAdminBad(makeUser('alice'))     = ${isAdminBad(makeUser('alice'))}  <- 正确地拒绝`);
  console.log(`    JSON.parse('{}').isAdmin          = ${JSON.parse('{}').isAdmin}`);

  // ---- 发动攻击（纯内存操作，不访问网络、不读写文件）----
  const attackerInput = JSON.parse(attackPayloadProto);
  const myConfig = {}; // 受害者：一个全新的空配置对象
  vulnerableMerge(myConfig, attackerInput);

  // ---- 污染后 ----
  console.log('  【污染后】攻击者只做了一次"普通的配置合并"');
  console.log(`    Object.prototype.isAdmin          = ${Object.prototype.isAdmin}   <-- 全局原型被写入！`);
  console.log(`    一个"刚写出来的空对象"({})         = ${({}).isAdmin}   <-- 它跟本次合并毫无关系，却也中了`);
  console.log(`    makeUser('bob').isAdmin           = ${makeUser('bob').isAdmin}   <-- bob 从没被赋过这个属性`);
  console.log(`    isAdminBad(makeUser('bob'))       = ${isAdminBad(makeUser('bob'))}  <-- 越权成功！`);
  console.log(`    连用户的配置合并结果 myConfig 也"看起来"有该属性: ${myConfig.isAdmin}`);
  console.log(`    for...in 能枚举到这个属性吗？      ${(() => { for (const k in {}) { if (k === 'isAdmin') return '能（污染还会扩散到遍历逻辑）'; } return '不能'; })()}`);
} catch (err) {
  // 污染演示过程中的任何意外都被兜住，绝不冒泡到顶层
  console.log(`  [演示中捕获到异常，已安全处理] ${err.name}: ${err.message}`);
} finally {
  // ---- 必须清理！否则会污染后续小节，甚至影响 Node 进程的其它行为 ----
  delete Object.prototype.isAdmin;
  delete Object.prototype.pollutedAt;
  console.log('  【清理】已 delete Object.prototype.isAdmin / pollutedAt');
  console.log(`    清理后 ({}).isAdmin               = ${({}).isAdmin}  <- 恢复 undefined`);
  console.log(`    清理后 isAdminBad(makeUser('x'))  = ${isAdminBad(makeUser('x'))}  <- 恢复拒绝`);
  console.log(`    清理后 Object.prototype 自有键数   = ${Object.getOwnPropertyNames(Object.prototype).length}`);
}

// ============================================================================
// 小节 5：攻击演示 ② —— 绕过 __proto__ 屏蔽，走 constructor.prototype
// ============================================================================
console.log('\n--- 5. 攻击演示 ②：constructor.prototype 路径 ---');

// 很多团队意识到 __proto__ 危险后就加了个"键名黑名单"，只屏蔽 __proto__。
// 但还有第二条路：constructor -> prototype。
const attackPayloadCtor = '{"constructor": {"prototype": {"canDelete": true}}}';

/**
 * 模拟一个只屏蔽了 __proto__ 的"半吊子防御"，用来证明它不够。
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function vulnerableMergeBlockingProto(target, source) {
  for (const key of Object.keys(source)) {
    // 半吊子防御：只挡住了 __proto__ 这一个键名
    if (key === '__proto__') continue;
    const srcVal = source[key];
    if (srcVal !== null && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      if (target[key] === undefined || target[key] === null) target[key] = {};
      vulnerableMergeBlockingProto(target[key], srcVal);
    } else {
      target[key] = srcVal;
    }
  }
  return target;
}

/**
 * 模拟一个"删除操作"的权限判断。
 * @param {object} req
 * @returns {boolean}
 */
function canDeleteBad(req) {
  return req.canDelete === true;
}

try {
  console.log('  【污染前】');
  console.log(`    ({}).canDelete               = ${({}).canDelete}`);
  console.log(`    canDeleteBad({user:'alice'}) = ${canDeleteBad({ user: 'alice' })}  <- 正确地拒绝`);

  console.log('  【攻击】载荷 = ' + attackPayloadCtor);
  console.log('    注意其中**没有** __proto__ 这个键，所以"屏蔽 __proto__"的防御完全失效。');
  console.log('    路径拆解：');
  console.log("      ① target['constructor'] 取到的是 Object 构造函数本身（继承来的，不是 undefined）；");
  console.log("      ② 它不为 undefined，于是不新建对象，直接递归进去；");
  console.log("      ③ 递归到下一层 key='prototype'，target['prototype'] 就是 Object.prototype；");
  console.log('      ④ 继续递归，赋值落在 Object.prototype 上 —— 污染完成。');

  const attackerInput2 = JSON.parse(attackPayloadCtor);
  vulnerableMergeBlockingProto({}, attackerInput2);

  console.log('  【污染后】');
  console.log(`    Object.prototype.canDelete      = ${Object.prototype.canDelete}   <-- 又被打穿了`);
  console.log(`    ({}).canDelete                  = ${({}).canDelete}`);
  console.log(`    canDeleteBad({user:'alice'})    = ${canDeleteBad({ user: 'alice' })}  <-- 越权成功`);
} catch (err) {
  console.log(`  [演示中捕获到异常，已安全处理] ${err.name}: ${err.message}`);
} finally {
  delete Object.prototype.canDelete;
  console.log('  【清理】已 delete Object.prototype.canDelete');
  console.log(`    清理后 ({}).canDelete           = ${({}).canDelete}  <- 恢复 undefined`);
  console.log(`    清理后 canDeleteBad({})         = ${canDeleteBad({})}  <- 恢复拒绝`);
}

// ---- 最后再做一次全局自检，确保 Object.prototype 干净 ----
console.log('\n  【全局自检】确认 Object.prototype 没有残留污染：');
const SUSPECT_KEYS = ['isAdmin', 'canDelete', 'pollutedAt', 'polluted', 'isVerified', 'role'];
const leftovers = SUSPECT_KEYS.filter((k) => Object.hasOwn(Object.prototype, k));
console.log(`    检查 ${SUSPECT_KEYS.join(', ')} -> ${leftovers.length === 0 ? '全部干净 ✔' : '仍有残留: ' + leftovers.join(', ')}`);

// ============================================================================
// 小节 6：防御 ① —— 拒绝危险键名（把三条路一起堵）
// ============================================================================
console.log('\n--- 6. 防御 ①：拒绝危险键名 ---');

// 三条通往原型的路径，必须一起堵。
// 注意用 Set 而不是数组：查询更清晰，也避免"数组里再放一个数组"造成的困惑。
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * 判断一个键名是否可以安全地参与合并。
 * @param {string} key
 * @returns {boolean}
 */
function isSafeKey(key) {
  // 白名单思路的变体：这里用"危险键黑名单"，但它是**收敛的**（就这 3 个），
  // 且配套了 Object.hasOwn 检查与 Object.create(null)，属于纵深防御的一层。
  return !DANGEROUS_KEYS.has(key);
}

/**
 * 【安全】拒绝危险键名的深合并。
 * @param {object} target
 * @param {object} source
 * @returns {object}
 */
function safeMergeByKeyFilter(target, source) {
  for (const key of Object.keys(source)) {
    // 第 1 道：拒绝 __proto__ / constructor / prototype
    if (!isSafeKey(key)) continue;
    const srcVal = source[key];
    if (srcVal !== null && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
      // 第 2 道：只在"自有属性"的基础上递归，绝不顺着原型链往下走
      if (!Object.hasOwn(target, key) || typeof target[key] !== 'object' || target[key] === null) {
        target[key] = {};
      }
      safeMergeByKeyFilter(target[key], srcVal);
    } else {
      target[key] = srcVal;
    }
  }
  return target;
}

console.log('  危险键名集合: ' + [...DANGEROUS_KEYS].join(', '));
for (const [p, watch, expect] of [
  [attackPayloadProto, 'isAdmin', 'true'],
  [attackPayloadCtor, 'canDelete', 'true'],
]) {
  safeMergeByKeyFilter({}, JSON.parse(p));
  console.log(`  载荷 ${p}`);
  console.log(`    合并结果: ${JSON.stringify(safeMergeByKeyFilter({}, JSON.parse(p)))}（危险键被丢弃，所以是空对象）`);
  console.log(
    `    Object.prototype.${watch} 仍是 ${Object.prototype[watch]}，` +
      `没有变成 ${expect} —— 未被污染 ✔`
  );
  // 保险起见再清一遍（正常路径下根本没写进去）
  delete Object.prototype.isAdmin;
  delete Object.prototype.canDelete;
}

// ============================================================================
// 小节 7：防御 ② —— Object.create(null) 与 Map
// ============================================================================
console.log('\n--- 7. 防御 ②：Object.create(null) 与 Map ---');

// Object.create(null) 得到的对象没有原型，__proto__ 只是它自己的一个普通属性
const nullProtoDict = Object.create(null);
console.log(`  const d = Object.create(null);`);
console.log(`    Object.getPrototypeOf(d) === null ? ${Object.getPrototypeOf(nullProtoDict) === null}`);
console.log(`    d.toString 存在吗？ ${typeof nullProtoDict.toString}  <- 没有原型，也就没有继承来的方法`);
console.log(`    'toString' in d ? ${'toString' in nullProtoDict}  <- in 运算符也不会误报`);

// 把攻击载荷合并进一个无原型对象：__proto__ 变成了一个普通的自有键，改不了任何原型
const safeTarget = Object.create(null);
safeMergeByKeyFilter(safeTarget, JSON.parse(attackPayloadProto));
console.log(`  即使不做键名过滤，往无原型对象上合并也不会污染全局；`);
console.log(`    合并后 Object.prototype.isAdmin = ${Object.prototype.isAdmin}  <- 依然是 undefined ✔`);

// Map：键是纯数据，与属性查找完全无关
const configMap = new Map();
configMap.set('__proto__', { isAdmin: true });
configMap.set('theme', 'dark');
console.log(`  Map 版本：`);
console.log(`    configMap.get('__proto__') = ${JSON.stringify(configMap.get('__proto__'))}`);
console.log(`    configMap.size             = ${configMap.size}`);
console.log(`    Object.prototype.isAdmin   = ${Object.prototype.isAdmin}  <- 完全不受影响 ✔`);
console.log(`    ({}).isAdmin               = ${({}).isAdmin}  <- 依然干净 ✔`);
console.log('  结论：处理"用户可控键名"的字典结构时，Object.create(null) 或 Map 是首选。');

// ============================================================================
// 小节 8：防御 ③ —— 正确的属性存在性判断
// ============================================================================
console.log('\n--- 8. 防御 ③：用 Object.hasOwn 而不是 obj.hasOwnProperty ---');

const sample = { a: 1 };
console.log(`  Object.hasOwn(sample, 'a')                       = ${Object.hasOwn(sample, 'a')}`);
console.log(`  Object.hasOwn(sample, 'toString')                = ${Object.hasOwn(sample, 'toString')}  <- 继承来的，不算自有`);
console.log(`  Object.prototype.hasOwnProperty.call(sample,'a') = ${Object.prototype.hasOwnProperty.call(sample, 'a')}`);
console.log('  为什么不用 sample.hasOwnProperty("a")？');
console.log('    因为 hasOwnProperty 本身就是从原型上继承来的 —— 如果它被覆盖/污染，你的判断就失效了。');
console.log('    （老代码里更常见的是 Object.create(null) 的对象根本没有 hasOwnProperty 方法，直接报错。）');
try {
  const dict = Object.create(null);
  // 演示：无原型对象上调用继承方法会抛错
  // eslint-disable-next-line no-unused-expressions
  dict.hasOwnProperty('x');
} catch (err) {
  console.log(`    实测 Object.create(null).hasOwnProperty('x') -> ${err.name}: ${err.message}`);
}
console.log(`    改用 Object.hasOwn(Object.create(null), 'x')  -> ${Object.hasOwn(Object.create(null), 'x')}  <- 安全返回 false`);

// ============================================================================
// 小节 9：防御 ④ —— Object.freeze(Object.prototype)
// ============================================================================
console.log('\n--- 9. 防御 ④：冻结原型 ---');

// 说明：真正的用法是 Object.freeze(Object.prototype)。但它是**不可撤销的全局操作**，
// 会影响本进程后续所有代码，因此这里在一个"模拟原型"上演示同样的机制，
// 避免破坏教学环境本身（这也是写安全演示时应有的自觉）。
const simulatedProto = { greet() { return 'hello'; } };
const simulatedChild = Object.create(simulatedProto);
console.log(`  模拟对象: child = Object.create(proto)，proto 上有 greet()`);
console.log(`    child.greet() = ${simulatedChild.greet()}`);

// 先看未冻结时能否写入
simulatedProto.hacked = 'yes';
console.log(`  未冻结时 proto.hacked = ${simulatedProto.hacked}  <- 写进去了，child.hacked = ${simulatedChild.hacked}`);

// 冻结后
Object.freeze(simulatedProto);
console.log(`  Object.freeze(proto) 之后：`);
console.log(`    Object.isFrozen(proto)         = ${Object.isFrozen(simulatedProto)}`);
// ESM 模块代码始终运行在严格模式下，所以这里"静默失败"会变成"抛异常"——
// 这正好也是一个知识点：严格模式下写冻结对象会抛 TypeError，非严格模式才静默忽略。
try {
  simulatedProto.hacked2 = 'no';
  console.log(`    写入 proto.hacked2 居然成功了？ ${simulatedProto.hacked2}`);
} catch (err) {
  console.log(`    写入 proto.hacked2 -> 抛错: ${err.name}: ${err.message}`);
  console.log(`    （本项目是 ESM，代码天然处于严格模式，所以是"抛错"而不是"静默忽略"；`);
  console.log(`      在非严格模式 / 老式 CommonJS 脚本里，这会静默失败、毫无提示。）`);
}
console.log('  真实用法与代价：');
console.log('    Object.freeze(Object.prototype); // 一劳永逸，但属于全局副作用');
console.log('    代价：第三方库若依赖"给原型打补丁"（老式 polyfill、某些 monkey-patch），会直接报错。');
console.log('    建议：作为纵深防御的一层，而不是唯一手段；上线前充分回归。');

// ============================================================================
// 小节 10：一张防御清单 + 小结
// ============================================================================
console.log('\n--- 10. 防御清单与小结 ---');

const defenseChecklist = [
  ['拒绝危险键', "合并/赋值前检查 key 是否属于 {__proto__, constructor, prototype}，命中即丢弃或报错"],
  ['拒绝对原型链赋值', '只在 Object.hasOwn(target, key) 为真时递归；否则新建普通对象，绝不顺着原型走'],
  ['用无原型对象', 'Object.create(null) 作为"用户可控键名"的字典容器，天然免疫'],
  ['用 Map', '键是纯数据、与属性查找无关；还可以是任意类型，不担心字符串碰撞'],
  ['安全的存在性判断', 'Object.hasOwn(obj, k) / Object.prototype.hasOwnProperty.call(obj, k)，不要写 obj.hasOwnProperty(k)'],
  ['冻结原型', 'Object.freeze(Object.prototype) 作为兜底；注意全局副作用与回归成本'],
  ['冻结/密封数据对象', '对配置对象用 Object.freeze，让"后续写入"直接失败'],
  ['输入校验', '整体上用 01 篇的 schema 白名单：只取出声明过的字段，未知键一律丢弃'],
  ['依赖与供应链', '及时升级 lodash / 模板引擎等库；历史上有多个原型污染 CVE'],
  ['上线前扫描', '用 `npm audit`、SAST 工具、以及针对 __proto__ 的代码搜索做例行检查'],
];
for (const [name, how] of defenseChecklist) {
  console.log(`  - ${name}：${how}`);
}

console.log('\n  小结：');
console.log('  1) 原型污染的根因：递归合并时顺着 __proto__ / constructor.prototype 走到了全局原型。');
console.log('  2) JSON.parse 本身安全（它创建的是自有数据属性），危险的是解析之后的合并动作。');
console.log('  3) 后果是全局的：一次请求可以污染整个 Node 进程，导致越权、DoS、RCE。');
console.log('  4) 只屏蔽 __proto__ 不够，constructor / prototype 是等价入口，必须一起堵。');
console.log('  5) 最省事的免疫方案：用 Object.create(null) 或 Map 承载"用户可控键名"的数据。');
console.log('  6) 演示污染之后一定要清理（delete 掉污染属性），这是安全演示的基本素养。');
