/**
 * ============================================================================
 * 知识点：序列化陷阱 —— undefined / 函数 / Symbol 被忽略、Date 变字符串、NaN → null、循环引用报错
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 数据格式与序列化
 * 【难度等级】进阶
 * 【前置知识】21_json/02_json_format_rules.js、21_json/03_replacer_and_reviver.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JSON.stringify 是"有损"的：JS 里有那么多类型与特殊值，JSON 只装得下六种，
 *    装不下的部分不会报错，而是被"静默地"忽略、转换或简化。
 *    本文件把这些静默行为一条条跑给你看，因为它们是线上事故的常见来源：
 *    数据"明明写进去了"，读出来却少了字段。
 *
 * 2. 为什么需要
 *    序列化经常用在"存数据 / 传数据"这类关键路径上（缓存、日志、消息队列、
 *    接口响应）。如果没有意识到这些降级规则，就会出现：
 *      · 缓存里存的对象读回来少了几个字段，业务逻辑莫名出错
 *      · 日志里 NaN 全变成了 null，排查时看不出是"缺失"还是"计算失败"
 *      · 时间字段变成了字符串，比较、格式化全都不对
 *      · 一不小心传了带循环引用的对象，接口直接 500
 *
 * 3. 核心语法要点（记住这张降级表）
 *    ---- 会被"整体忽略"的值（对象里该键消失）----
 *      undefined、函数、Symbol
 *    ---- 会被写成 null ----（数组里则变成 null；对象里是忽略）
 *      NaN、Infinity、-Infinity
 *    ---- 会被转换 ----
 *      Date    → 调用它的 toJSON()，得到 ISO 8601 字符串
 *      BigInt  → 直接抛 TypeError（不是静默！）
 *      Map / Set / RegExp / Error → 序列化成 {}（自身的可枚举属性为空）
 *      类实例  → 只保留自身可枚举属性，原型上的方法丢失
 *      toJSON 方法 → 只要有，就用它的返回值代替这个对象（06 号文件详述）
 *    ---- 会直接抛错 ----
 *      循环引用（对象自己间接或直接包含自己）→ TypeError: Converting circular structure to JSON
 *      BigInt                                  → TypeError: Do not know how to serialize a BigInt
 *
 * 4. 常见陷阱
 *    (1) 数组里的 undefined / 函数 → 变成 null；对象里的 → 直接消失。规则不同！
 *    (2) 以为 JSON.stringify 会报错提醒你丢了字段 —— 它不会。
 *    (3) 循环引用非常容易在"父子互指"的树结构里出现，必须用 try/catch 兜住。
 *    (4) Map / Set 序列化成 {} 是"看起来成功但数据全丢"，最难发现。
 *    (5) BigInt 会直接抛错，这反倒是最友好的一种表现（至少它报了）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/04_serialization_edge_cases.js
 *
 * 【预期输出】
 *   按"忽略 / 变 null / 转换 / 抛错"四类逐条演示，并在每个案例旁边打印
 *   序列化前后的对比，让你看到哪些字段"悄悄消失了"。
 * ============================================================================
 */

console.log('--- 1. 会被整体忽略的值：undefined、函数、Symbol ---');

const withIgnored = {
  a: 1,
  b: undefined,               // 直接消失
  c: function () { return 1; }, // 直接消失
  d: Symbol('sym'),           // 直接消失
  e: '保留',
};

console.log('  原对象的键 =', Object.keys(withIgnored));
console.log('  序列化结果 =', JSON.stringify(withIgnored));
console.log('  反序列化后的键 =', Object.keys(JSON.parse(JSON.stringify(withIgnored))));
console.log('  ↑ b、c、d 三个键"无声无息"地不见了，没有任何警告。');

console.log('--- 2. 数组里的同一些值：规则完全不同（变成 null） ---');

// 数组不能用"删掉元素"来表达，因为那会改变长度和下标，所以统一变成 null。
const arrayWithIgnored = [1, undefined, function () {}, Symbol('s'), '保留'];
console.log('  原数组长度 =', arrayWithIgnored.length);
console.log('  序列化结果 =', JSON.stringify(arrayWithIgnored));
console.log('  ↑ 对象里是"消失"，数组里是"变成 null" —— 这两条规则一定要分清。');

console.log('--- 3. NaN / Infinity → null ---');

const numbers = {
  normal: 1.5,
  nan: NaN,
  positiveInfinity: Infinity,
  negativeInfinity: -Infinity,
  negativeZero: -0,
  verySmall: 5e-324,   // 双精度能表示的最小正数
  veryBig: 1.7976931348623157e308, // 双精度能表示的最大数
};

console.log('  原始值：NaN、Infinity、-Infinity 都是合法 JS 值');
console.log('  序列化结果 =', JSON.stringify(numbers));
console.log('  ↑ NaN / Infinity / -Infinity 全部变成 null，读回来时你无法区分');
console.log('    "原来是 null" 与 "原来是 NaN"。');

// 数组里同理。
console.log('  [NaN, Infinity] =>', JSON.stringify([NaN, Infinity]));

// 想把 NaN 区分开，可以序列化成字符串。
const keepNaN = (key, value) => {
  if (typeof value === 'number' && !Number.isFinite(value)) return `__number__:${value}`;
  return value;
};
console.log('  用 replacer 保留特殊数字 =', JSON.stringify(numbers, keepNaN));
console.log('  ↑ 代价是"类型信息也进了字符串"，反序列化时必须用 reviver 还原。');

console.log('--- 4. Date 会被转换成 ISO 字符串 ---');

const withDate = {
  title: '会议',
  startAt: new Date('2026-09-16T10:20:30.000Z'),
};
const dateSerialized = JSON.stringify(withDate);
console.log('  原始类型 =', typeof withDate.startAt, withDate.startAt instanceof Date);
console.log('  序列化结果 =', dateSerialized);
console.log('  读回来后的类型 =', typeof JSON.parse(dateSerialized).startAt);
console.log('  ↑ Date 自带 toJSON() 方法，序列化时自动被调用，得到 ISO 8601 字符串；');
console.log('    反序列化回来只是普通字符串，不会自动变回 Date。');

// 时区相关信息：ISO 字符串保留的是 UTC 时刻，格式化展示时才转本地时区。
const d = new Date('2026-09-16T10:20:30.000Z');
console.log('  ISO 字符串 =', d.toISOString());
console.log('  本地时间 =', d.toLocaleString('zh-CN'));
console.log('  时间戳 =', d.getTime());

// 无效日期会变成 null。
console.log('  new Date("不是日期") =>', new Date('不是日期').toString());
console.log('  序列化后 =>', JSON.stringify({ bad: new Date('不是日期') }));

console.log('--- 5. Map / Set / RegExp / Error：会变成空对象 ---');

const specialObjects = {
  map: new Map([['k', 'v']]),
  set: new Set([1, 2, 3]),
  re: /abc/gi,
  err: new Error('出错了'),
};

// 注意：这里不直接打印 specialObjects 本身，因为 Node 打印 Error 时会带出整段调用栈，
// 输出会非常吵。只打印它们的构造器名，足够说明问题。
console.log('  各字段的构造器 =', Object.fromEntries(
  Object.entries(specialObjects).map(([k, v]) => [k, v.constructor.name])));
console.log('  序列化结果 =', JSON.stringify(specialObjects));
console.log('  ↑ 全部变成 {}！因为 JSON 只看"自身的可枚举属性"，');
console.log('    而这些对象的数据都存在内部槽位（internal slot）里，不是普通属性。');
console.log('    这是最危险的一类陷阱：不报错、不丢键，但数据全没了。');

// 正确做法：先转成普通结构再序列化。
console.log('  Map 正确序列化 =>', JSON.stringify({ map: [...specialObjects.map.entries()] }));
console.log('  Set 正确序列化 =>', JSON.stringify({ set: [...specialObjects.set] }));
console.log('  RegExp 正确序列化 =>', JSON.stringify({ re: { source: /abc/gi.source, flags: /abc/gi.flags } }));
console.log('  Error 正确序列化 =>',
  JSON.stringify({ err: { name: specialObjects.err.name, message: specialObjects.err.message } }));

console.log('--- 6. 类实例：只保留"自身可枚举属性"，方法丢失 ---');

class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  // 定义在原型上的方法不会被序列化。
  get length() {
    return Math.hypot(this.x, this.y);
  }
  toString() {
    return `Point(${this.x}, ${this.y})`;
  }
}

const p = new Point(3, 4);
console.log('  实例 =', p.toString(), '  length =', p.length);
const pText = JSON.stringify(p);
console.log('  序列化结果 =', pText);
const pBack = JSON.parse(pText);
console.log('  还原后 =', pBack, ' 还是 Point 吗 =', pBack instanceof Point);
console.log('  还原后的 length =', pBack.length);
console.log('  ↑ 原型链彻底丢失：类名、getter、方法全没了，只剩"数据属性"。');
console.log('    想还原成类实例，请用 reviver（见 03 号文件）或手写 fromJSON 工厂函数。');

console.log('--- 7. BigInt：直接抛 TypeError（不是静默） ---');

try {
  JSON.stringify({ id: 9007199254740993n });
  console.log('  不会走到这里');
} catch (err) {
  console.log('  序列化 BigInt =>', err.constructor.name + ': ' + err.message);
}
// 处理方式：转成字符串（推荐，绝不丢精度）。
const bigId = 9007199254740993n;
console.log('  转字符串后 =>', JSON.stringify({ id: String(bigId) }));
console.log('  或加自定义标记 =>', JSON.stringify({ id: `${bigId}n` }));

console.log('--- 8. 循环引用：直接抛 TypeError ---');

const parent = { name: '父节点' };
const child = { name: '子节点', parent };
parent.child = child; // 父子互指 → 循环

try {
  JSON.stringify(parent);
  console.log('  不会走到这里');
} catch (err) {
  console.log('  序列化循环结构 =>', err.constructor.name + ': ' + err.message);
}

// 自引用也一样。
const selfRef = { name: '自己' };
selfRef.me = selfRef;
try {
  JSON.stringify(selfRef);
} catch (err) {
  console.log('  自引用 =>', err.constructor.name + ': ' + err.message);
}

// 数组里的循环也会被抓到。
const arrLoop = [1, 2];
arrLoop.push(arrLoop);
try {
  JSON.stringify(arrLoop);
} catch (err) {
  console.log('  数组自引用 =>', err.constructor.name + ': ' + err.message);
}

console.log('--- 9. 破解循环引用：用 replacer + WeakSet 记录"已访问" ---');

// 思路：用一个 WeakSet 记录本次序列化过程中"已经走出去过的对象"，
// 再次遇到同一个对象时，用占位符代替，切断环。
function makeCircularSafeReplacer() {
  const seen = new WeakSet();
  return function (key, value) {
    if (typeof value !== 'object' || value === null) return value; // 原始值直接放行
    if (seen.has(value)) return '[Circular]';                      // 重复出现 → 占位
    seen.add(value);
    return value;
  };
}

console.log('  安全序列化父子互指 =>', JSON.stringify(parent, makeCircularSafeReplacer()));
console.log('  安全序列化自引用 =>', JSON.stringify(selfRef, makeCircularSafeReplacer()));
console.log('  安全序列化数组自引用 =>', JSON.stringify(arrLoop, makeCircularSafeReplacer()));
console.log('  ↑ 输出里出现了 "[Circular]" 占位，信息量比"直接报错"更大，也便于排查。');

// 注意 WeakSet 是按"对象身份"去重的，所以有两个副作用要知道：
//   · 内容相同但确实是两个不同对象时，不会被误判成环（正确行为）
//   · 同一个对象被两处引用（DAG 结构，本身不是环）时，第二处也会被写成 [Circular]
const shared = { v: 1 };
console.log('  两个键指向同一个对象（不是环，但也会被标记）=>',
  JSON.stringify({ a: shared, b: shared }, makeCircularSafeReplacer()));
console.log('  内容相同但不同对象（不会被误判）=>',
  JSON.stringify({ a: { v: 1 }, b: { v: 1 } }, makeCircularSafeReplacer()));
console.log('  ↑ 如果你的业务需要保留"共享引用"的信息，就要把占位符换成能标识身份的编号。');

console.log('--- 10. 综合示例：一个"处处是坑"的对象 ---');

const messy = {
  name: '订单',
  amount: NaN,
  createdAt: new Date('2026-09-16T00:00:00.000Z'),
  remark: undefined,
  handler: () => {},
  tags: new Set(['a', 'b']),
  meta: new Map([['k', 'v']]),
  items: [{ id: 1, note: undefined }, { id: 2, note: 'ok' }],
};
console.log('  原始对象 =', messy);
const messyText = JSON.stringify(messy);
console.log('  序列化结果 =', messyText);
console.log('  逐字段检查读回来的结果：');
const messyBack = JSON.parse(messyText);
for (const k of Object.keys(messy)) {
  const before = messy[k];
  const after = messyBack[k];
  const changed = JSON.stringify(before) !== JSON.stringify(after) || typeof before !== typeof after;
  console.log(`    ${k.padEnd(11)} 原始类型=${(typeof before).padEnd(8)} 还原类型=${(typeof after).padEnd(8)} ${changed ? '← 发生了变化' : ''}`);
}

console.log('--- 11. 小结 ---');
console.log('· 对象里：undefined / 函数 / Symbol 会消失；数组里：它们会变成 null。');
console.log('· NaN / Infinity → null；Date → ISO 字符串；Map / Set / RegExp / Error → {}。');
console.log('· BigInt 与循环引用会直接抛 TypeError，必须 try/catch 或用 replacer 处理。');
console.log('· 序列化是"有损"的且默认不报警，关键数据请在序列化后做一次字段核对。');
