/**
 * ============================================================================
 * 知识点：用 JSON 做深拷贝的局限与适用场景
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 数据格式与序列化
 * 【难度等级】进阶
 * 【前置知识】21_json/04_serialization_edge_cases.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "深拷贝"是指复制一个对象时，把它的所有嵌套结构也一并复制成新的对象，
 *    使得新旧对象之间不存在任何共享的可变引用。
 *    JS 没有内置的深拷贝 API，但有一句流传极广的"偏方"：
 *      const copy = JSON.parse(JSON.stringify(original));
 *    它确实能深拷贝，但"只能深拷贝 JSON 装得下的东西"。
 *    ES2022 之后有了官方替代品：structuredClone()（本文件最后会对比）。
 *
 * 2. 为什么需要
 *    浅拷贝（{...obj}、Object.assign）只复制第一层，嵌套对象仍是共享引用：
 *      const a = { list: [1] };
 *      const b = { ...a };
 *      b.list.push(2);  // a.list 也变成了 [1, 2]！
 *    这在状态管理（React/Vue 的"不可变更新"）、缓存快照、撤销重做等场景里
 *    会造成难以排查的 bug。所以理解"哪种深拷贝适合哪种数据"非常实用。
 *
 * 3. 核心语法要点
 *    ---- JSON 深拷贝的能力边界 ----
 *    能正确处理：
 *      ✓ 对象、数组、字符串、数字（有限值）、布尔、null
 *      ✓ 嵌套结构（任意深度）
 *      ✓ 纯粹的"数据"结构（DTO、配置、接口返回值）
 *    不能正确处理（会静默变样或报错）：
 *      ✗ undefined / 函数 / Symbol → 对象里消失、数组里变 null
 *      ✗ Date → 变成字符串
 *      ✗ Map / Set / RegExp / Error → 变成 {}
 *      ✗ BigInt → 抛 TypeError
 *      ✗ 循环引用 → 抛 TypeError
 *      ✗ 类实例 → 变成普通对象，原型链丢失
 *      ✗ NaN / Infinity → 变成 null
 *      ✗ 稀疏数组的空位 → 变成 null
 *      ✗ 属性描述符（getter/setter、不可枚举、只读）→ 全部丢失，变成普通可写属性
 *
 * 4. 常见陷阱
 *    (1) 以为 JSON 深拷贝是"万能的" —— 它只适合纯数据，一旦有 Date/Map 就出错。
 *    (2) 拷贝后原对象被"污染"过（比如挂了一个函数属性），拷贝结果里却没有，
 *        导致后续调用 xxx.fn() 报 "not a function"。
 *    (3) 用 JSON 深拷贝做"配置合并"，结果 Date 配置项变成字符串，
 *        再传给需要 Date 的 API 就崩了。
 *    (4) 在 Vue/React 的响应式对象上做 JSON 深拷贝会丢失响应式代理的语义。
 *    (5) 性能上不要凭直觉：JSON 深拷贝多了"转字符串再解析"两步，但 V8 的 JSON
 *        实现高度优化，实测中它有时反而比 structuredClone 更快。选型要看实测数据。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/05_deep_clone_with_json.js
 *
 * 【预期输出】
 *   先用"改一个不影响另一个"的测试证明 JSON 深拷贝确实有效；
 *   再逐条列出它在各种类型上的失真表现；
 *   最后对比 structuredClone 的能力与性能差异。
 * ============================================================================
 */

console.log('--- 1. 先确认问题：浅拷贝只复制第一层 ---');

const original = { name: '配置', nested: { list: [1, 2], flag: true } };
const shallow = { ...original };

shallow.name = '改过的名字';       // 顶层属性：互不影响
shallow.nested.list.push(3);        // 嵌套属性：一起被改了！

console.log('  原对象      =', JSON.stringify(original));
console.log('  浅拷贝      =', JSON.stringify(shallow));
console.log('  原对象的 list =', JSON.stringify(original.nested.list), '← 被浅拷贝的修改带偏了');
console.log('  嵌套对象是同一个引用吗 =', original.nested === shallow.nested);

console.log('--- 2. JSON 深拷贝：切断所有嵌套引用 ---');

const deep = JSON.parse(JSON.stringify(original));
deep.nested.list.push(999);
deep.name = '深拷贝改的';

console.log('  原对象   =', JSON.stringify(original), '（没有被影响）');
console.log('  深拷贝   =', JSON.stringify(deep));
console.log('  嵌套对象还是同一个引用吗 =', original.nested === deep.nested);
console.log('  嵌套数组还是同一个引用吗 =', original.nested.list === deep.nested.list);
console.log('  ✓ 结论：对"纯数据"结构来说，JSON 深拷贝简单、可靠、无需依赖。');

console.log('--- 3. 但它是"有损"的：逐条看清失真表现 ---');

const rich = {
  str: '文本',
  num: 42,
  bool: true,
  nul: null,
  date: new Date('2026-09-16T10:20:30.000Z'),
  nan: NaN,
  inf: Infinity,
  undef: undefined,
  fn: function greet() { return 'hi'; },
  sym: Symbol('id'),
  map: new Map([['k', 'v']]),
  set: new Set([1, 2]),
  re: /abc/g,
  arr: [1, undefined, function () {}, new Date('2026-01-01T00:00:00.000Z')],
  sparse: [1, , 3],
};

const richCopy = JSON.parse(JSON.stringify(rich));

console.log('  逐字段对比（原始类型 → 拷贝后类型）：');
const keys = [...new Set([...Object.keys(rich), ...Object.keys(richCopy)])];
for (const k of keys) {
  const before = rich[k];
  const after = richCopy[k];
  const beforeType = before === undefined ? 'undefined' : before?.constructor?.name ?? typeof before;
  const afterType = after === undefined ? 'undefined（键消失）' : after?.constructor?.name ?? typeof after;
  const same = beforeType === afterType;
  console.log(`    ${k.padEnd(8)} ${String(beforeType).padEnd(12)} → ${String(afterType).padEnd(16)} ${same ? '' : '← 变了'}`);
}
console.log('  数组里的表现：', JSON.stringify(richCopy.arr));
console.log('  稀疏数组的表现：', JSON.stringify(richCopy.sparse));
console.log('  ↑ 只有 str / num / bool / nul 这四种"纯数据"完好无损。');

console.log('--- 4. 危险案例一：日期变成字符串后的连锁反应 ---');

const eventConfig = {
  name: '每日任务',
  runAt: new Date('2026-09-16T08:00:00.000Z'),
};

const clonedConfig = JSON.parse(JSON.stringify(eventConfig));
console.log('  原始 runAt 是 Date 吗 =', eventConfig.runAt instanceof Date);
console.log('  拷贝 runAt 是 Date 吗 =', clonedConfig.runAt instanceof Date);

// 连锁反应：需要 Date 的 API 拿到字符串会怎样？
try {
  const days = eventConfig.runAt.getDay();
  console.log('  原对象调用 getDay() =', days);
} catch (err) {
  console.log('  原对象调用 getDay() =>', err.constructor.name);
}
try {
  const days = clonedConfig.runAt.getDay();
  console.log('  拷贝对象调用 getDay() =', days);
} catch (err) {
  console.log('  拷贝对象调用 getDay() =>', err.constructor.name + ': ' + err.message);
}
console.log('  ↑ 这就是典型事故：拷贝"成功"了，但后续在某个深处调用崩溃。');
console.log('    修复：要么用 structuredClone，要么在拷贝后手工还原 new Date(...)。');

console.log('--- 5. 危险案例二：Map / Set 静默变成空对象 ---');

const stats = {
  byCity: new Map([['上海', 12], ['北京', 7]]),
  tags: new Set(['重要', '待办']),
};
const statsCopy = JSON.parse(JSON.stringify(stats));
console.log('  原始 byCity 是 Map 吗 =', stats.byCity instanceof Map, '，size =', stats.byCity.size);
console.log('  拷贝后 =', JSON.stringify(statsCopy));
console.log('  拷贝后 byCity 是 Map 吗 =', statsCopy.byCity instanceof Map,
  '，能调用 get 吗 =', typeof statsCopy.byCity.get);
console.log('  ↑ Map/Set 变成了 {}，数据全没了，而且 !!不报错!! —— 最难排查的一类。');

console.log('--- 6. 危险案例三：类实例退化成普通对象 ---');

class Money {
  constructor(amount, currency) {
    this.amount = amount;
    this.currency = currency;
  }
  format() {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }
}
const price = new Money(19.9, 'CNY');
const priceCopy = JSON.parse(JSON.stringify(price));
console.log('  原始 price =', price.format());
console.log('  拷贝后字段 =', JSON.stringify(priceCopy));
console.log('  拷贝后还是 Money 吗 =', priceCopy instanceof Money, '，有 format 方法吗 =', typeof priceCopy.format);
console.log('  ↑ 方法全部丢失，因为 JSON 只序列化"自身可枚举属性"。');

console.log('--- 7. 危险案例四：BigInt 与循环引用直接抛错 ---');

const withBigInt = { id: 123456789012345678901234567890n };
try {
  JSON.parse(JSON.stringify(withBigInt));
  console.log('  不会走到这里');
} catch (err) {
  console.log('  BigInt =>', err.constructor.name + ': ' + err.message);
}

const a = { name: 'a' };
const b = { name: 'b', a };
a.b = b;
try {
  JSON.parse(JSON.stringify(a));
  console.log('  不会走到这里');
} catch (err) {
  console.log('  循环引用 =>', err.constructor.name + ': ' + err.message.split('\n')[0]);
}

console.log('--- 8. 危险案例五：属性描述符也会丢 ---');

const withGetter = {
  _value: 10,
  get doubled() { return this._value * 2; },
};
Object.defineProperty(withGetter, 'readonly', {
  value: '不可改', enumerable: true, writable: false, configurable: false,
});
console.log('  原始 doubled =', withGetter.doubled, '（是 getter，动态计算）');
console.log('  原始 readonly 可写吗 =', Object.getOwnPropertyDescriptor(withGetter, 'readonly').writable);

const getterCopy = JSON.parse(JSON.stringify(withGetter));
console.log('  拷贝后的自有属性 =', Object.keys(getterCopy));
console.log('  拷贝后 doubled 是普通值 =', JSON.stringify(getterCopy.doubled), '（getter 变成了固定值）');
console.log('  拷贝后 readonly 可写吗 =', Object.getOwnPropertyDescriptor(getterCopy, 'readonly').writable);
console.log('  ↑ 所有"行为"与"约束"都变成了普通数据属性。');

console.log('--- 9. 什么时候可以放心用 JSON 深拷贝 ---');

const safeScenarios = [
  ['接口返回的 DTO', '只有字符串 / 数字 / 布尔 / null / 数组 / 对象'],
  ['JSON 配置文件读出来的对象', '本来就是从 JSON 来的，必然是纯数据'],
  ['纯粹的状态快照（无 Date/Map/类实例）', '例如待办列表、表单草稿'],
  ['需要"剥离全部方法"的场合', '序列化的"损耗"恰好是你要的效果'],
];
console.log('  适合的场景：');
for (const [scene, why] of safeScenarios) console.log(`    ✓ ${scene.padEnd(34)} ${why}`);

const unsafeScenarios = [
  ['含 Date 的对象', '改用时 structuredClone，或拷贝后手工还原'],
  ['含 Map / Set', '先转成数组再拷贝，或用 structuredClone'],
  ['含函数 / 类实例', '手写 clone() 方法（自己控制要复制什么）'],
  ['含 BigInt', '转字符串传输，或用 structuredClone'],
  ['可能有循环引用', '用带 WeakMap 的深拷贝函数，或 structuredClone'],
];
console.log('  不适合的场景：');
for (const [scene, why] of unsafeScenarios) console.log(`    ✗ ${scene.padEnd(34)} ${why}`);

console.log('--- 10. 官方替代品：structuredClone ---');

// structuredClone 是平台提供的结构化克隆算法（Node 17+ / 现代浏览器都有），
// 它支持 Date、Map、Set、RegExp、BigInt、循环引用，但依旧不支持函数与原型链。
const structured = {
  date: new Date('2026-09-16T10:20:30.000Z'),
  map: new Map([['k', 'v']]),
  set: new Set([1, 2]),
  re: /abc/g,
  big: 9007199254740993n,
};
const sCopy = structuredClone(structured);
console.log('  Date 还是 Date 吗 =', sCopy.date instanceof Date, '，值 =', sCopy.date.toISOString());
console.log('  Map 还是 Map 吗   =', sCopy.map instanceof Map, '，k =', sCopy.map.get('k'));
console.log('  Set 还是 Set 吗   =', sCopy.set instanceof Set, '，内容 =', [...sCopy.set]);
console.log('  RegExp 保住了吗   =', sCopy.re instanceof RegExp, '，source =', sCopy.re.source, 'flags =', sCopy.re.flags);
console.log('  BigInt 保住了吗   =', typeof sCopy.big, '，值 =', sCopy.big);

// 循环引用也能处理。
console.log('  循环引用 =>', structuredClone(a).b.a.name, '（structuredClone 能正确保留环）');

// 但函数依旧不行 —— 它会直接抛 DataCloneError。
try {
  structuredClone({ fn: () => 1 });
  console.log('  不会走到这里');
} catch (err) {
  console.log('  函数 =>', err.constructor.name + ': ' + err.message);
}

console.log('--- 11. 两者能力对比表 ---');

const compare = [
  ['纯数据（对象/数组/基本类型）', '✓', '✓'],
  ['Date', '✗ 变字符串', '✓'],
  ['Map / Set', '✗ 变 {}', '✓'],
  ['RegExp', '✗ 变 {}', '✓'],
  ['BigInt', '✗ 抛错', '✓'],
  ['循环引用', '✗ 抛错', '✓'],
  ['NaN / Infinity', '✗ 变 null', '✓'],
  ['函数', '✗ 丢弃', '✗ 抛错'],
  ['类实例的原型链', '✗ 丢失', '✗ 丢失'],
  ['属性描述符', '✗ 丢失', '✗ 丢失'],
];
console.log('  ' + '数据结构'.padEnd(30) + 'JSON 深拷贝'.padEnd(16) + 'structuredClone');
for (const [item, json, sc] of compare) {
  console.log('  ' + item.padEnd(30) + json.padEnd(16) + sc);
}

console.log('--- 12. 性能对比：小对象与大数组 ---');

const small = { a: 1, b: 'text', c: [1, 2, 3], d: { e: true } };
const bigArray = Array.from({ length: 20000 }, (_, i) => ({ id: i, name: `name-${i}`, ok: i % 2 === 0 }));

function bench(label, fn, iterations) {
  // 先跑一次预热，避免把 JIT 编译时间算进去。
  fn();
  const t0 = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const ms = performance.now() - t0;
  console.log(`    ${label.padEnd(38)} ${ms.toFixed(2)} ms / ${iterations} 次`);
  return ms;
}

console.log('  小对象（1 万次）：');
bench('JSON.parse(JSON.stringify(x))', () => JSON.parse(JSON.stringify(small)), 10000);
bench('structuredClone(x)', () => structuredClone(small), 10000);

console.log('  大数组 2 万个对象（10 次）：');
bench('JSON.parse(JSON.stringify(x))', () => JSON.parse(JSON.stringify(bigArray)), 10);
bench('structuredClone(x)', () => structuredClone(bigArray), 10);
console.log('  ↑ 结论要"以实测为准"：JSON 深拷贝多了"生成完整字符串 → 再解析"两步，');
console.log('    听起来更慢；但 V8 的 JSON 解析器是高度优化的 C++ 实现，');
console.log('    所以在不少数据形状上它反而比 structuredClone 更快。');
console.log('    上面这两组数字就是很好的例子 —— 不要凭直觉判断性能，跑一遍再决定。');

console.log('--- 13. 小结 ---');
console.log('· JSON 深拷贝 = JSON.parse(JSON.stringify(x))，只适合"纯数据"。');
console.log('· 它会把 Date 变字符串、Map/Set/RegExp 变 {}、NaN 变 null、函数直接丢掉。');
console.log('· 遇到 BigInt 或循环引用会抛 TypeError；类实例的原型链一定丢。');
console.log('· 需要保留类型的场景请用 structuredClone（除了函数与原型链，它几乎全能）。');
console.log('· 判断标准：数据是"从 JSON 来的"就可以用 JSON 深拷贝；否则优先 structuredClone。');
