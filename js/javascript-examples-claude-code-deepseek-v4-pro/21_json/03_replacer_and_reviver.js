/**
 * ============================================================================
 * 知识点：stringify 的 replacer 与 parse 的 reviver —— 过滤与类型恢复
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 数据格式与序列化
 * 【难度等级】进阶
 * 【前置知识】21_json/01_parse_and_stringify.js、21_json/02_json_format_rules.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JSON.stringify 的第二个参数叫 replacer（替换器），
 *    JSON.parse 的第二个参数叫 reviver（还原器）。
 *    它们是一对"钩子"，让序列化 / 反序列化不再是"照抄"，而可以按需变形：
 *      replacer 决定"哪些键要被写出去、写成什么"
 *      reviver  决定"读进来的值要不要变回别的东西"
 *
 * 2. 为什么需要
 *    因为 JSON 只有六种类型，而真实业务里的类型远不止六种：
 *    Date、Map、Set、BigInt、正则、类实例……全都装不进去。
 *    标准做法是"序列化时把类型信息编码进去，反序列化时再还原回来"，
 *    而 replacer / reviver 就是官方的挂钩点。
 *    另一个常见用途是"过滤敏感字段"（比如把 password、token 剔掉再写日志）。
 *
 * 3. 核心语法要点
 *    ---- replacer 的两种形态 ----
 *    (1) 数组形式：JSON.stringify(obj, ['a', 'b'])
 *        只有出现在这个数组里的键会被保留（对所有层级生效，按"键名"匹配）。
 *    (2) 函数形式：JSON.stringify(obj, function (key, value) {...})
 *        这个函数会被"自底向上"地对每一个键值对调用一次，返回值决定最终写出去的内容：
 *          · 返回 undefined（或什么都不返回）→ 该键被整体丢弃
 *          · 返回其他值 → 用这个值参与序列化
 *        调用顺序很重要：先处理叶子，再处理父节点。
 *        第一次调用时 key 是空字符串 ""，value 是整个根对象。
 *        ⚠ 注意：replacer 的 this 指向"当前正在被序列化的那个对象"。
 *    ---- reviver 的形态 ----
 *    一个函数，签名 (key, value)，同样自底向上对每个键值对调用一次：
 *      · 返回 undefined → 该键被删除
 *      · 返回其他值 → 用这个值取代原值
 *    根节点同样以 key = "" 调用一次。
 *
 * 4. 常见陷阱
 *    (1) 数组形式的 replacer 是按"键名"过滤的，会误伤同名但不同层级的键。
 *    (2) 函数形式的 replacer 里拿到的 value 已经是"子节点处理过"的结果，
 *        所以要判断"这是不是一个 Date"时，必须用 this[key]，因为 value 在
 *        默认情况下已经被 toJSON 转成字符串了（见 06 号文件）。
 *    (3) reviver 返回值是 undefined 会"删键"，而不是"保留原值"。
 *    (4) 忘了根节点也会被调用一次（key 为 ""），容易在 reviver 里写错判断。
 *    (5) replacer 无法阻止 JSON.stringify 对 Date 调用 toJSON —— 那个发生在更早的阶段。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/03_replacer_and_reviver.js
 *
 * 【预期输出】
 *   对比"数组 replacer / 函数 replacer / reviver"三者的行为，
 *   并实现一个"保留类型的序列化 + 还原"小工具，把 Date、Map、Set 正确往返。
 * ============================================================================
 */

console.log('--- 1. replacer 的数组形式：按"键名"白名单过滤 ---');

const order = {
  id: 'A-1001',
  amount: 199.5,
  password: 'hunter2',
  token: 'secret-token',
  customer: { name: '张三', phone: '13800138000', level: 'vip' },
};

console.log('  原始对象 =', order);
console.log('  全量序列化 =', JSON.stringify(order));

// 只保留白名单里的键（同时把 customer 也写进白名单，否则它整棵子树都不会被访问）。
const picked = JSON.stringify(order, ['id', 'amount', 'customer', 'name', 'level']);
console.log('  白名单 ["id","amount","customer","name","level"] =>', picked);
console.log('  ↑ 注意 name 与 level 在 customer 里面，但因为"键名匹配"依然被保留了；');
console.log('    数组形式是"全局按键名过滤"，不是"按路径过滤"：');
console.log('    它把每个对象里所有出现在白名单中的键都留下，无法区分"顶层的 id"和"内层的 id"。');

// 反例：只把顶层的键放进白名单，结果 customer 整棵子树都没了。
console.log('  只写顶层键 ["id","amount"] =>', JSON.stringify(order, ['id', 'amount']));
console.log('  原因：customer 自己不在白名单里，它的子节点根本不会被访问到。');

console.log('--- 2. 函数形式 replacer：逐个键值对做决策 ---');

// 常见的"脱敏"需求：把敏感字段替换成占位符。
// 逐参数解释：
//   key   —— 当前正在处理的键名（根节点时是空字符串 ""）
//   value —— 当前键对应的值（注意：子节点已经被处理过了）
const maskSecrets = (key, value) => {
  if (key === 'password' || key === 'token') return '***';
  return value; // 其余键原样返回
};

console.log('  脱敏序列化 =', JSON.stringify(order, maskSecrets));

// 如果返回 undefined，这个键会被"整个丢掉"，而不是写成 null。
const dropSecrets = (key, value) => {
  if (key === 'password' || key === 'token') return undefined;
  return value;
};
console.log('  直接删除敏感字段 =', JSON.stringify(order, dropSecrets));

console.log('--- 3. 看清 replacer 的调用顺序（自底向上） ---');

const nested = { a: 1, b: { c: 2, d: { e: 3 } }, f: [4, 5] };

console.log('  对象结构 = {"a":1,"b":{"c":2,"d":{"e":3}},"f":[4,5]}');
console.log('  回调调用顺序：');
JSON.stringify(nested, function (key, value) {
  // this 是"当前正在序列化的那个容器"，用它可以看出层级。
  const owner = this === undefined ? '(undefined)' : JSON.stringify(this);
  console.log(`    键 ${JSON.stringify(key).padEnd(6)} 值类型=${(typeof value).padEnd(7)} 所属容器=${owner.slice(0, 40)}`);
  return value;
});
console.log('  ↑ 规律：先处理最深的叶子（e、d），再回到父级（b），最后是根（""）。');
console.log('    根节点一定会以 key="" 被调用一次，这是很多人忽略的细节。');

console.log('--- 4. 用 replacer 处理"循环引用"以外的复杂场景：过滤空值 ---');

const form = {
  username: 'alice',
  nickname: '',
  bio: null,
  age: 30,
  tags: [],
  address: { city: '上海', street: '' },
};

// 需求：把空字符串、null、空数组、空对象都剔掉，只保留"真正有内容"的字段。
const dropEmpty = (key, value) => {
  if (value === '' || value === null) return undefined;
  if (Array.isArray(value) && value.length === 0) return undefined;
  // 判断"空对象"：注意这一步发生在子节点处理完之后，
  // 所以如果对象里的字段都被剔掉了，这里看到的就是一个 {}。
  if (typeof value === 'object' && value !== null && !Array.isArray(value)
      && Object.keys(value).length === 0) {
    return undefined;
  }
  return value;
};
console.log('  原始表单 =', JSON.stringify(form));
console.log('  去掉空值 =', JSON.stringify(form, dropEmpty));
console.log('  ↑ nickname（空串）、bio（null）、tags（空数组）都被剔掉了；');
console.log('    address 里的 street 是空串被剔掉，但 city 还在，所以 address 被保留下来。');
console.log('    如果 address 里的字段全部被剔光，它就会变成 {} 并被父级判定为"空对象"一起删掉 ——');
console.log('    这就是"自底向上"带来的连锁效果：父节点的判断建立在子节点处理完之后的结果上。');

console.log('--- 5. reviver：解析后的类型恢复 ---');

const dateText = '{"title":"发布","createdAt":"2026-09-16T10:20:30.000Z","updatedAt":"2026-09-17T08:00:00.000Z"}';

// 不做任何处理时，日期只是普通字符串。
const plain = JSON.parse(dateText);
console.log('  普通解析 =>', plain);
console.log('  createdAt 的类型 =', typeof plain.createdAt, ' 是 Date 吗 =', plain.createdAt instanceof Date);

// 用 reviver 把符合 ISO 8601 形状的字符串还原成 Date。
// 逐参数解释：
//   key   —— 键名
//   value —— 值（同样自底向上）
const ISO_LIKE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const reviveDates = (key, value) => {
  if (typeof value === 'string' && ISO_LIKE.test(value)) {
    return new Date(value);
  }
  return value;
};
const revived = JSON.parse(dateText, reviveDates);
console.log('  带 reviver 解析 =>', revived);
console.log('  createdAt 是 Date 吗 =', revived.createdAt instanceof Date);
console.log('  createdAt 的值 =', revived.createdAt.toISOString());
console.log('  转成本地时间 =', revived.createdAt.toLocaleString('zh-CN'));

console.log('--- 6. reviver 返回 undefined 会删除该键 ---');

const secretText = '{"user":"alice","password":"p@ss","token":"t0k3n"}';
const stripped = JSON.parse(secretText, (key, value) => {
  if (key === 'password' || key === 'token') return undefined; // 删掉
  return value;
});
console.log('  原文 =', secretText);
console.log('  解析并删掉敏感键 =', stripped);
console.log('  hasOwn(password) =', Object.hasOwn(stripped, 'password'));

console.log('--- 7. 组合实战：让 Date / Map / Set 完整往返 ---');

// 思路：序列化时把"类型标记"写进 JSON，反序列化时按标记还原。
// 逐条说明：
//   Date → { __type: 'Date', value: ISO 字符串 }
//   Map  → { __type: 'Map',  value: [[k, v], ...] }
//   Set  → { __type: 'Set',  value: [...元素] }
const TYPE_KEY = '__type';

function typedReplacer(key, value) {
  // 关键技巧：有些类型在 replacer 之前已经被处理过了，
  // 所以对于 Date，必须看 this[key]，而不能看 value。
  const raw = this?.[key];
  if (raw instanceof Date) {
    return { [TYPE_KEY]: 'Date', value: raw.toISOString() };
  }
  if (raw instanceof Map) {
    return { [TYPE_KEY]: 'Map', value: [...raw.entries()] };
  }
  if (raw instanceof Set) {
    return { [TYPE_KEY]: 'Set', value: [...raw] };
  }
  return value;
}

function typedReviver(key, value) {
  if (value && typeof value === 'object' && typeof value[TYPE_KEY] === 'string') {
    if (value[TYPE_KEY] === 'Date') return new Date(value.value);
    if (value[TYPE_KEY] === 'Map') return new Map(value.value);
    if (value[TYPE_KEY] === 'Set') return new Set(value.value);
  }
  // 这里顺手把 Map 的键值对数组还原成 Map 的条目形式（上面的分支已经处理了）
  return value;
}

const session = {
  id: 'sess-1',
  startedAt: new Date('2026-09-16T10:20:30.000Z'),
  permissions: new Set(['read', 'write']),
  counters: new Map([['views', 12], ['clicks', 3]]),
  nested: { lastSeen: new Date('2026-09-17T08:00:00.000Z') },
};

const serialized = JSON.stringify(session, typedReplacer);
console.log('  序列化结果 =', serialized);
console.log('  可读格式：');
console.log(JSON.stringify(JSON.parse(serialized), null, 2).split('\n').map((l) => '    ' + l).join('\n'));

const restored = JSON.parse(serialized, typedReviver);
console.log('  还原结果：');
console.log('    startedAt 是 Date 吗 =', restored.startedAt instanceof Date,
  '，值 =', restored.startedAt?.toISOString());
console.log('    permissions 是 Set 吗 =', restored.permissions instanceof Set,
  '，内容 =', restored.permissions instanceof Set ? [...restored.permissions] : restored.permissions);
console.log('    counters 是 Map 吗 =', restored.counters instanceof Map,
  '，views =', restored.counters instanceof Map ? restored.counters.get('views') : undefined);
console.log('    nested.lastSeen 是 Date 吗 =', restored.nested.lastSeen instanceof Date);
console.log('  ↑ 这套"类型标记 + replacer/reviver"是业界最常见的 JSON 类型扩展方案。');

console.log('--- 8. 陷阱一：replacer 里 value 已经是"处理过"的值 ---');

// Date 自带 toJSON 方法，所以传给 replacer 的 value 已经是字符串了。
JSON.stringify({ when: new Date('2026-01-01T00:00:00.000Z') }, function (key, value) {
  if (key === 'when') {
    console.log('    replacer 收到的 value 类型 =', typeof value, '，值 =', JSON.stringify(value));
    console.log('    但 this.when 的类型 =', typeof this.when, '，是 Date 吗 =', this.when instanceof Date);
  }
  return value;
});
console.log('  ↑ 结论：要判断"原始类型"，请用 this[key]；value 可能已经被 toJSON 转换过了。');

console.log('--- 9. 陷阱二：数组形式的 replacer 会误伤同名字段 ---');

const doc = {
  id: 1,
  meta: { id: 999, desc: '内层 id' },
  list: [{ id: 7 }, { id: 8 }],
};
console.log('  原始 =', JSON.stringify(doc));
console.log('  白名单 ["id"] =>', JSON.stringify(doc, ['id']));
console.log('  白名单 ["meta","desc"] =>', JSON.stringify(doc, ['meta', 'desc']));
console.log('  ↑ 数组形式无法表达"只保留顶层 id"，它按名字匹配所有层级；');
console.log('    需要精确控制时请改用函数形式，用 this 判断当前层级。');

// 函数形式的精确控制例：只保留顶层的 id。
const topLevelIdOnly = JSON.stringify(doc, function (key, value) {
  if (this === doc && key !== 'id' && key !== '') return undefined; // 顶层只留 id
  if (this !== doc && key !== '') {
    // 非顶层全部丢弃，但保留容器本身（返回 value 才能让容器继续存在）
    return typeof value === 'object' && value !== null ? value : undefined;
  }
  return value;
});
console.log('  函数形式精确控制 =>', topLevelIdOnly);

console.log('--- 10. 陷阱三：reviver 不知道"当前路径"，复杂还原要用上下文 ---');

// reviver 只有 key 和 value，没有"路径"。如果不同层级的同名键需要不同处理，
// 就得借助 this（它指向当前容器）来判断。
const ambiguous = '{"value":"1","child":{"value":"2"}}';
const withPath = JSON.parse(ambiguous, function (key, value) {
  if (key === 'value') {
    // 用 this 判断自己在哪一层：根节点的 this 就是最外层对象。
    const isRoot = Object.hasOwn(this, 'child');
    return isRoot ? `根层:${value}` : `子层:${value}`;
  }
  return value;
});
console.log('  原文 =', ambiguous);
console.log('  按层级区分处理 =>', JSON.stringify(withPath));

console.log('--- 11. 小结 ---');
console.log('· replacer 数组形式 = 按键名白名单；函数形式 = 逐个键值对决策，更精确。');
console.log('· replacer / reviver 都是"自底向上"调用，根节点一定会以 key="" 调用一次。');
console.log('· replacer 返回 undefined → 丢弃该键；reviver 返回 undefined → 删除该键。');
console.log('· 处理 Date 时要在 replacer 里用 this[key]，因为 value 已经被 toJSON 转成字符串了。');
console.log('· "类型标记 + reviver"是让 JSON 支持 Date / Map / Set 的标准做法。');
