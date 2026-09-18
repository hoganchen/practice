/**
 * ============================================================================
 * 知识点：原型污染（Prototype Pollution）—— 概念、危害与防御
 * ============================================================================
 *
 * 【所属分类】16_prototype —— 原型与原型链
 * 【难度等级】高级
 * 【前置知识】16_prototype/07_method_resolution_order.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    原型污染是一种攻击/事故模式：程序把用户可控的键名写进了某个对象的原型
 *    （最常见的是 Object.prototype），于是**所有对象**都凭空多出了这个属性。
 *    例如攻击者传入 `{"__proto__": {"isAdmin": true}}`，
 *    如果代码不加检查地做递归合并，`({}).isAdmin` 就会变成 true。
 *
 * 2. 为什么需要
 *    这是真实存在的高危漏洞类型（CVE 里有很多 npm 包中招）：
 *      - 权限绕过：`if (user.isAdmin)` 对任何对象都为真；
 *      - 拒绝服务：污染 toString / hasOwnProperty 让程序崩溃；
 *      - 更严重的可导致远程代码执行（配合模板引擎、child_process 等）。
 *    理解它才能写出安全的合并/解析/配置代码。
 *
 * 3. 核心语法要点
 *    污染的三种注入路径：
 *      ① 递归合并（merge / deepMerge / extend）时没有过滤键名；
 *      ② 解析 JSON 后直接把结果合并进对象；
 *      ③ 用 obj[key] = value 的方式按用户提供的路径赋值。
 *    危险的键名有三个：__proto__、constructor、prototype。
 *    - 为什么 `({"__proto__": {...}})` 这种字面量不危险？
 *      因为在**对象字面量**里写 __proto__ 是"设置原型"的语法，
 *      它设置的是这个新对象自己的原型，**不会**改 Object.prototype。
 *      真正危险的是 obj["__proto__"] = ... 这类**计算赋值**，
 *      以及 JSON.parse 出来的、带 __proto__ 自有键的对象被合并的过程。
 *    - 防御手段（本节演示前四种）：
 *        ① 合并时跳过 __proto__ / constructor / prototype 键；
 *        ② 用 Object.create(null) 存数据，从根上断开与 Object.prototype 的联系；
 *        ③ 用 Object.hasOwn 判断而不是直接读；
 *        ④ 校验键名（白名单 / 正则）；
 *        ⑤ 用 Object.freeze(Object.prototype) 冻结原型（激进但有副作用）；
 *        ⑥ 用 Map 代替普通对象存键值对。
 *
 * 4. 常见陷阱
 *    - 以为自己的代码"没用到 merge"就安全 —— JSON.parse + Object.assign 同样有风险。
 *    - 只过滤 __proto__ 而漏掉 constructor.prototype 这条路径。
 *    - 深拷贝时用 JSON.parse(JSON.stringify(x)) 看似安全，但会在合并阶段中招。
 *    - 污染是"全局且持久"的：一旦污染，同进程内所有代码都受影响，
 *      且很难定位到源头。测试时也可能互相干扰。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 16_prototype/08_prototype_pollution_intro.js
 *
 * 【预期输出】
 *   用最简例子展示污染的注入与危害，然后依次演示四种防御方案。
 *   本文件所有污染都会在演示后清理回收，不会影响其它示例。
 * ============================================================================
 */

console.log('--- 1. 先理解 __proto__ 的两种写法（关键前提） ---');

// 写法 A：对象字面量里写 __proto__ —— 这是"设置原型"的语法
const literalObj = { __proto__: { fromLiteral: '字面量原型' } };
console.log('字面量写法：literalObj.fromLiteral =', literalObj.fromLiteral);
console.log('它是自有属性吗？', Object.hasOwn(literalObj, '__proto__'), '（不是，它设置了原型）');
console.log('Object.prototype 被污染了吗？', 'fromLiteral' in {}, '（没有被污染，安全）');

// 写法 B：计算属性 / 下标赋值 —— 这才是攻击面
const computedObj = {};
// 下面这一行如果直接写 computedObj['__proto__'] = {...}，
// 结果取决于引擎与写法：下标赋值会走 [[Set]]，进而可能触发原型设置器。
// 这里用 Object.defineProperty 明确"创建自有属性"来对比：
Object.defineProperty(computedObj, '__proto__', {
  value: { fromOwn: '自有属性形态的 __proto__' },
  writable: true,
  enumerable: true,
  configurable: true,
});
console.log('用 defineProperty 造出的自有 __proto__ 属性：', computedObj.__proto__.fromOwn);
console.log('注意：它成了自有数据属性，此时 obj.__proto__ 不再指向原型');

console.log('--- 2. 一次真实的原型污染（注入） ---');

// 模拟一个"用户可控的请求体"
const userPayload = JSON.parse('{"name":"张三","__proto__":{"isAdmin":true}}');
console.log('解析出的载荷自有键：', JSON.stringify(Object.keys(userPayload)));
// 注意：JSON.parse 会把 "__proto__" 当成**普通自有属性**放进结果里！
console.log('载荷自己有 __proto__ 这个键吗？', Object.hasOwn(userPayload, '__proto__'));

// 一个有漏洞的递归合并函数（省略了键名过滤）
function vulnerableMerge(target, source) {
  for (const key of Object.keys(source)) {
    const value = source[key];
    if (value !== null && typeof value === 'object') {
      // 漏洞点：key 可能是 __proto__，此时 target[key] 拿到的是原型对象，
      // 于是后续赋值就写到了原型上。
      if (target[key] === undefined || typeof target[key] !== 'object') {
        target[key] = {};
      }
      vulnerableMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const config = { theme: 'dark' };
vulnerableMerge(config, userPayload);

console.log('合并后 config.name =', config.name);
console.log('污染是否成功？ 空对象的 isAdmin =', {}.isAdmin);
console.log('数组上也有吗？', [].isAdmin);
console.log('函数上也有吗？', (() => {}).isAdmin);
console.log('任意新建对象都有吗？', new Date().isAdmin);

console.log('--- 3. 危害：权限绕过与 DoS ---');

// 危害一：权限判断被绕过
function checkAdmin(user) {
  // 用户对象自己根本没有 isAdmin 字段，但原型链上有
  return user.isAdmin === true;
}
console.log('普通用户对象被判定为管理员吗？', checkAdmin({ name: '李四' }), '（权限被绕过！）');

// 危害二：覆盖 Object.prototype 上的关键方法会让整个程序崩
// 这里只是"演示副作用"，因此立刻恢复
const originalToString = Object.prototype.toString;
Object.prototype.toString = function pollutedToString() {
  return '我破坏了 toString';
};
console.log('被污染后 String({}) =', String({}));
// 立刻恢复
Object.prototype.toString = originalToString;
console.log('恢复后 String({}) =', String({}), '（已修复）');

// 清理前面注入的 isAdmin
delete Object.prototype.isAdmin;
console.log('清理后 {} .isAdmin =', {}.isAdmin, '（恢复干净）');

console.log('--- 4. 防御一：合并时过滤危险键名 ---');

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function safeMerge(target, source) {
  for (const key of Object.keys(source)) {
    // 第一道防线：直接跳过危险键
    if (DANGEROUS_KEYS.has(key)) continue;
    const value = source[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // 第二道防线：只在"自有属性"里取子对象，避免沿原型链写进去
      if (!Object.hasOwn(target, key) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      safeMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const safeConfig = { theme: 'dark' };
safeMerge(safeConfig, userPayload);
console.log('安全合并后 config.name =', safeConfig.name);
console.log('还有 isAdmin 污染吗？', {}.isAdmin, '（安全）');

console.log('--- 5. 防御二：用 Object.create(null) 当数据容器 ---');

// 纯净容器没有原型，即便被写入 __proto__ 也不会影响别人
const pureContainer = Object.create(null);
pureContainer.theme = 'dark';

// 用一个"只看自有属性"的合并（不再递归到原型）
function mergeIntoPure(target, source) {
  for (const key of Object.keys(source)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    const value = source[key];
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // 子对象也用纯净容器
      const child = Object.hasOwn(target, key) ? target[key] : Object.create(null);
      target[key] = child;
      mergeIntoPure(child, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

const pureResult = mergeIntoPure(Object.create(null), userPayload);
console.log('纯净容器里的键：', JSON.stringify(Object.keys(pureResult)));
console.log('它自己有 __proto__ 吗？', Object.hasOwn(pureResult, '__proto__'), '（被过滤了）');
console.log('全局原型仍然是干净的吗？', {}.isAdmin, '（干净）');

console.log('--- 6. 防御三：读属性时用 Object.hasOwn 而不是直接读 ---');

const cleanUser = { name: '王五' };
// 危险写法：直接读会沿原型链找到被污染的属性
console.log('直接读 cleanUser.isAdmin →', cleanUser.isAdmin);
// 安全写法：只看自有属性
console.log('用 Object.hasOwn 判断 →', Object.hasOwn(cleanUser, 'isAdmin'), '（正确地判定为没有）');

// 把权限判断改成"只认自有属性"
function safeCheckAdmin(user) {
  return Object.hasOwn(user, 'isAdmin') && user.isAdmin === true;
}
console.log('安全版权限判断：', safeCheckAdmin(cleanUser), '（未被绕过）');

console.log('--- 7. 防御四：白名单校验键名 ---');

// 只允许"字母数字下划线"组成的键，能一次性挡掉绝大多数注入
const SAFE_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

function whitelistMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (!SAFE_KEY_PATTERN.test(key)) continue;
    const value = source[key];
    // 这里简化处理：只做一层浅合并
    target[key] = value;
  }
  return target;
}

const whitelisted = whitelistMerge({}, userPayload);
console.log('白名单过滤后：', JSON.stringify(whitelisted));
console.log('__proto__ 被挡掉了吗？', !Object.hasOwn(whitelisted, '__proto__'));

// 白名单的局限：合法业务字段若带连字符（如 'user-name'）会被误杀，
// 所以真实项目常用"黑名单 + 自有属性检查"组合。
console.log('注意：白名单可能误杀合法键（如 "user-name"），需按业务调整。');
console.log('正则对 "user-name" 的判定：', SAFE_KEY_PATTERN.test('user-name'));

console.log('--- 8. 防御五：用 Map 代替普通对象 ---');

// Map 的键与原型完全无关，天然免疫原型污染
const mapConfig = new Map();
mapConfig.set('theme', 'dark');
// 尝试注入：这次 '__proto__' 只是 Map 里的一个普通键
mapConfig.set('__proto__', { isAdmin: true });
console.log('Map 里存了几个键？', mapConfig.size);
console.log('Map 里有 __proto__ 这个键吗？', mapConfig.has('__proto__'));
console.log('读出来是：', JSON.stringify(mapConfig.get('__proto__')));
console.log('Object.prototype 被影响了吗？', {}.isAdmin, '（完全没有）');
console.log('Map 自己受到污染了吗？', mapConfig.isAdmin, '（也没有）');

console.log('--- 9. 防御六：冻结 Object.prototype（激进方案） ---');

// 这是一把双刃剑：能彻底挡住污染，但也会让依赖"扩展原型"的库失效，
// 且第三方库可能因此报错。所以只适合在明确知道依赖情况的项目里用。
// 本示例只在**临时新建的对象**上演示冻结效果，不去真的冻结全局原型。
const frozenProto = Object.freeze({ fixed: '我是被冻结的原型' });
const frozenTest = Object.create(frozenProto);
console.log('冻结的原型可读：', frozenTest.fixed);
try {
  frozenProto.added = '试图添加';
} catch (err) {
  console.log('给冻结的原型加属性报错：', err.constructor.name, '—', err.message);
}
console.log('添加成功了吗？', 'added' in frozenProto);

console.log('--- 10. 检查运行环境里是否存在污染（实用工具） ---');

// 这个函数可以放进项目启动自检里，用来发现异常的原型扩展
function detectPollution() {
  // Object.prototype 上的"标准自有属性"清单
  const expected = new Set([
    'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
    'toLocaleString', 'toString', 'valueOf', '__defineGetter__', '__defineSetter__',
    '__lookupGetter__', '__lookupSetter__', '__proto__',
  ]);
  const found = Object.getOwnPropertyNames(Object.prototype).filter((k) => !expected.has(k));
  return found;
}

console.log('当前 Object.prototype 上的可疑属性：', JSON.stringify(detectPollution()));

// 故意污染一下，看看能否检测出来
Object.prototype.__suspicious = '这是被注入的属性';
console.log('注入后检测结果：', JSON.stringify(detectPollution()));
delete Object.prototype.__suspicious;
console.log('清理后检测结果：', JSON.stringify(detectPollution()));

console.log('--- 11. 速查清单 ---');

const checklist = [
  '所有"用户可控键名"的地方都要过滤 __proto__ / constructor / prototype。',
  '递归合并是重灾区；优先用 Object.hasOwn 判断，而不是直接读 target[key]。',
  '纯数据容器用 Object.create(null) 或 Map，从根上避免撞上原型。',
  '权限判断不要直接读属性，要配合 Object.hasOwn。',
  '引入第三方 merge / clone 库时，先确认它是否修复过原型污染漏洞。',
  '在应用启动时加一段"原型完整性自检"，能尽早发现异常。',
];
for (const line of checklist) console.log('  •', line);

console.log('\n全部演示完毕。');
