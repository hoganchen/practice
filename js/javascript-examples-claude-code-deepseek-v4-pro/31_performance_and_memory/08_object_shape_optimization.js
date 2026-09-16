/**
 * ============================================================================
 * 知识点：对象形状（隐藏类 / Hidden Class）与属性访问性能
 * ============================================================================
 *
 * 【所属分类】31_performance_and_memory —— 性能与内存
 * 【难度等级】高级
 * 【前置知识】31_performance_and_memory/05_loop_performance.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JavaScript 对象在语言层面只是一堆"键值对"，但在 V8 内部并不是哈希表。
 *    为了像静态语言那样快速访问属性，V8 给每个对象关联一个隐藏类
 *    （Hidden Class，在新版 V8 的源码里叫 Map，和 JS 的 Map 同名但完全是两回事）。
 *    隐藏类记录了"这个对象有哪些属性、每个属性在内存里的偏移量"。
 *    两个对象如果属性名和【添加顺序】完全一致，就共享同一个隐藏类
 *    （也就是"形状相同"），于是属性访问可以被内联缓存（Inline Cache）优化成
 *    一次固定偏移量的内存读取——和 C 语言读结构体字段一样快。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 数据量大的列表渲染：一个 10 万元素的数组，每个元素都是对象。
 *      如果这些对象形状一致，访问属性走的是极快的"单态（monomorphic）"路径；
 *      如果形状五花八门，就退化成"多态（polymorphic）"甚至"超多态
 *      （megamorphic）"，每次访问都要重新查找属性位置。
 *    - 反序列化后的数据归一化：从接口/JSON 拿到的对象常常缺字段，
 *      补齐字段后再交给渲染层，能显著降低属性访问的不确定性。
 *    - 避免 delete：delete 会把对象打成"字典模式"，这对 V8 是不可逆的降级。
 *
 * 3. 核心语法要点
 *    - 对象的隐藏类转换链：{} → 加 a → 加 b 会形成一条链。
 *      先加 a 再加 b，和先加 b 再加 a，会得到两个不同的隐藏类。
 *    - 内联缓存（IC）：V8 会在属性访问点缓存"上次是谁、偏移量是多少"。
 *      · 单态：只见过 1 种形状 → 最快；
 *      · 多态：见过 2~4 种形状 → 稍慢，但 V8 有多态 IC 仍然很快；
 *      · 超多态：见过 5 种以上 → V8 放弃缓存，走通用的慢速查找。
 *    - delete obj.prop 会让对象进入【字典模式（dictionary mode）】，
 *      属性存在哈希表里，访问变慢，而且【不可逆】——
 *      之后再怎么加属性也回不到快速模式。
 *    - 用 obj.prop = undefined / null 代替 delete，可以只"清空值"而不动形状。
 *    - Object.create(null) 创建的是"无原型"对象，适合当纯查找表。
 *
 * 4. 常见陷阱
 *    - 陷阱一：用 delete 删除对象属性。想"清空某个字段"应该赋 null 或 undefined；
 *      真的要删，也建议构造一个新对象（用解构/展开）而不是 delete 原对象。
 *    - 陷阱二：一开始只写部分字段，稍后再补。例如先 { name } 再 obj.age = 18，
 *      这会触发隐藏类转换，也容易让同一批对象形状不一致。
 *      推荐在构造函数/对象字面量里【一次性把字段写全】（包括暂时为 null 的字段）。
 *    - 陷阱三：过度迷信形状优化。现代 V8 对多态访问也有很好的优化，
 *      小幅度的形状差异通常测不出明显区别。**不要据此做微优化**——
 *      先测量，确认属性访问真的是瓶颈再说。
 *    - 陷阱四：把这条规则套用到"数组下标访问"上。数组有自己的元素种类
 *      （PACKED_SMI / PACKED_DOUBLE / HOLEY 等），混装不同类型的值会让
 *      数组降级；这和对象的隐藏类是两套机制。
 *    - 陷阱五：把 V8 的 Map（隐藏类）和 JS 的 Map 混淆，两者毫无关系。
 *
 * 【重要提醒】
 *   本示例会打印实测耗时，但请注意：
 *   数值因 Node 版本、机器、JIT 编译状态而异，现代引擎对多态访问也有优化，
 *   实际差距可能很小甚至测不出来。【绝对不要】根据本示例的数值去做微优化；
 *   要记住的是那些确定性的好习惯：一次性写全属性、用 null 代替 delete。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 31_performance_and_memory/08_object_shape_optimization.js
 *
 * 【预期输出】
 *   打印 6 个小节：隐藏类概念、用可观察的方式展示形状差异、
 *   形状一致与形状混乱的属性访问实测、delete 导致字典模式的影响、
 *   好习惯与坏习惯对比、以及总结与免责说明。
 * ============================================================================
 */

const scriptStart = Date.now();

// 简易计时：预热一次，再采样多轮取最小值
function bench(fn, rounds = 5) {
  fn(); // 预热，排除 JIT 编译时间
  let min = Infinity;
  for (let r = 0; r < rounds; r++) {
    const t0 = performance.now();
    fn();
    const ms = performance.now() - t0;
    if (ms < min) min = ms;
  }
  return min;
}

// ---------------------------------------------------------------------------
// 1. 概念：什么是隐藏类（Hidden Class）
// ---------------------------------------------------------------------------

console.log('--- 1. 概念：隐藏类（Hidden Class / V8 内部的 Map） ---');

console.log('JavaScript 对象在语言层面是"一堆键值对"，但 V8 内部不是哈希表。');
console.log('为了让属性访问像静态语言一样快，V8 给每个对象关联一个隐藏类：');
console.log('  · 隐藏类记录了"这个对象有哪些属性、每个属性的内存偏移量"；');
console.log('  · 属性名和【添加顺序】完全一致的对象，共享同一个隐藏类（形状相同）；');
console.log('  · 形状相同时，属性访问会被内联缓存（IC）优化成"取固定偏移量"，');
console.log('    和 C 语言读结构体字段一样快。');
console.log('');
console.log('隐藏类是随着属性添加"长"出来的转换链：');
console.log('  {}  --添加 a-->  {a}  --添加 b-->  {a,b}');
console.log('  而先加 b 再加 a 会走另一条链：');
console.log('  {}  --添加 b-->  {b}  --添加 a-->  {b,a}');
console.log('  两条链的终点虽然"内容一样"，但隐藏类不同 —— 这就是形状不同。');
console.log('');
console.log('内联缓存的三种状态（属性访问点会记住见过多少种形状）：');
console.log('  · 单态 monomorphic：只见过 1 种形状    → 最快');
console.log('  · 多态 polymorphic：见过 2~4 种形状    → 稍慢，但 V8 有专门优化');
console.log('  · 超多态 megamorphic：见过 5 种以上    → V8 放弃缓存，走通用慢速查找');

// ---------------------------------------------------------------------------
// 2. 可观察地展示"形状不同"
// ---------------------------------------------------------------------------

console.log('\n--- 2. 观察形状差异 ---');

// 属性顺序不同的两个对象：内容一样，但形状不同
const objAB = {};
objAB.a = 1;
objAB.b = 2;

const objBA = {};
objBA.b = 2;
objBA.a = 1;

// 属性顺序一致的第三个对象：和 objAB 形状相同
const objAB2 = {};
objAB2.a = 10;
objAB2.b = 20;

console.log('objAB  = {a:1, b:2}（先加 a 再加 b）');
console.log('objBA  = {b:2, a:1}（先加 b 再加 a）');
console.log('objAB2 = {a:10, b:20}（和 objAB 同样的添加顺序）');
console.log('');
console.log('它们的属性名集合完全相同，但顺序不同：');
console.log('  Object.keys(objAB)  =', JSON.stringify(Object.keys(objAB)));
console.log('  Object.keys(objBA)  =', JSON.stringify(Object.keys(objBA)));
console.log('  JSON.stringify 的顺序也随之不同：');
console.log('  objAB  →', JSON.stringify(objAB));
console.log('  objBA  →', JSON.stringify(objBA));
console.log('');
console.log('V8 里判断"形状是否相同"可以借助 --allow-natives-syntax 的 %HaveSameMap，');
console.log('但那需要额外的启动参数，示例脚本要保持 node xx.js 直接可跑，所以这里用');
console.log('"属性顺序 + 属性集合"作为可观察的代理指标：顺序和集合都一致，形状才相同。');

// 用属性描述符也能看出属性被添加的顺序
console.log('');
console.log('另外，整数风格的键会被"提前排序"，这也是一种形状特征：');
const mixed = {};
mixed.name = 'x'; // 字符串键
mixed[2] = 'two'; // 整数风格键
mixed[1] = 'one'; // 整数风格键
mixed.age = 18;
console.log('  按 name、2、1、age 的顺序赋值，Object.keys 却得到：', JSON.stringify(Object.keys(mixed)));
console.log('  规则：整数风格的键按数值升序排在前面，字符串键按插入顺序排在后面。');

// ---------------------------------------------------------------------------
// 3. 实测：形状一致 vs 形状混乱
// ---------------------------------------------------------------------------

console.log('\n--- 3. 实测：形状一致 vs 形状混乱的属性访问 ---');

const COUNT = 10_000; // 对象数量
const READS = 10; // 每个对象读几轮

// 3.1 形状一致：所有对象都用同一个字面量创建，属性顺序完全相同
const monoList = new Array(COUNT);
for (let i = 0; i < COUNT; i++) {
  monoList[i] = { x: i, y: i, z: i };
}

// 3.2 形状混乱：交替使用不同的属性顺序（模拟"由不同代码路径构造出来的对象"）
const polyList = new Array(COUNT);
for (let i = 0; i < COUNT; i++) {
  if (i % 2 === 0) {
    polyList[i] = { x: i, y: i, z: i };
  } else {
    polyList[i] = { z: i, y: i, x: i }; // 顺序不同 → 形状不同
  }
}

// 3.3 超多态：每个对象都先有 x/y/z，但之后追加的额外属性数量不同，
// 于是同一个属性访问点会见到 5 种不同的形状 —— 达到 V8 的"超多态"阈值。
// 注意 x/y/z 三个字段始终存在，这样三组数据的求和结果才可比。
const megaList = new Array(COUNT);
for (let i = 0; i < COUNT; i++) {
  const o = { x: i, y: i, z: i }; // 基础形状
  const extras = i % 5; // 0~4 个额外属性 → 一共 5 种形状
  if (extras > 0) o.w = i;
  if (extras > 1) o.v = i;
  if (extras > 2) o.u = i;
  if (extras > 3) o.t = i;
  megaList[i] = o;
}

// 访问函数：都只读 x / y / z 三个属性，逻辑完全一样
function sumXYZ(list, reads) {
  let total = 0;
  for (let r = 0; r < reads; r++) {
    for (let i = 0; i < list.length; i++) {
      const o = list[i];
      // 这三行就是"属性访问点"，V8 会在这里记录内联缓存
      total += o.x || 0;
      total += o.y || 0;
      total += o.z || 0;
    }
  }
  return total;
}

const monoMs = bench(() => sumXYZ(monoList, READS));
const polyMs = bench(() => sumXYZ(polyList, READS));
const megaMs = bench(() => sumXYZ(megaList, READS));

// 先确认三者结果一致，再比性能
const monoSum = sumXYZ(monoList, 1);
const polySum = sumXYZ(polyList, 1);
const megaSum = sumXYZ(megaList, 1);
console.log(`结果一致性（每组读 1 轮）：单态=${monoSum}，多态=${polySum}，超多态=${megaSum}`);
console.log(`三者求和结果完全相同：${monoSum === polySum && polySum === megaSum}`);

console.log(`\n每组都读 ${COUNT} 个对象 × ${READS} 轮 × 3 个属性 = ${(COUNT * READS * 3) / 10000} 万次属性访问`);
console.log('形状情况'.padEnd(34) + '最小值(ms)');
console.log('-'.repeat(50));
console.log('单态：所有对象形状一致'.padEnd(30) + monoMs.toFixed(3).padStart(8));
console.log('多态：两种属性顺序交替'.padEnd(30) + polyMs.toFixed(3).padStart(8));
console.log('超多态：每个对象形状都不一样'.padEnd(28) + megaMs.toFixed(3).padStart(8));

console.log('');
console.log('注意：以上数值因机器和 Node 版本而异，现代 V8 对多态访问也有很好的优化，');
console.log('      实际差距可能很小，甚至测不出稳定差异 —— 这很正常。');
console.log('      这里要理解的是【机制】，而不是记住某个倍数值。');

// ---------------------------------------------------------------------------
// 4. delete 的代价：对象被打成字典模式
// ---------------------------------------------------------------------------

console.log('\n--- 4. delete 的代价：字典模式 ---');

console.log('delete obj.prop 不只是"删掉一个字段"：');
console.log('  · 它会破坏隐藏类的转换链，V8 只好把对象的属性改成哈希表存储，');
console.log('    这就是【字典模式（dictionary mode）】；');
console.log('  · 字典模式下的属性访问要算哈希、查表，比固定偏移量慢；');
console.log('  · 而且这个过程【不可逆】——之后再加属性也回不到快速模式了。');

// 4.1 用 delete 清空字段
function withDelete(count) {
  const list = new Array(count);
  for (let i = 0; i < count; i++) {
    list[i] = { x: i, y: i, z: i };
  }
  // 逐个删除 y 字段
  for (let i = 0; i < count; i++) {
    delete list[i].y; // ← 危险操作：对象被打成字典模式
  }
  // 再访问剩下的字段
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += list[i].x || 0;
    total += list[i].z || 0;
  }
  return total;
}

// 4.2 用赋 null 代替 delete
function withNullAssign(count) {
  const list = new Array(count);
  for (let i = 0; i < count; i++) {
    list[i] = { x: i, y: i, z: i };
  }
  // 只是把值清空，属性还在，形状不变
  for (let i = 0; i < count; i++) {
    list[i].y = null; // ← 推荐做法
  }
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += list[i].x || 0;
    total += list[i].z || 0;
  }
  return total;
}

const DELETE_COUNT = 20_000; // 规模控制在几万级，保证示例轻量

const deleteMs = bench(() => withDelete(DELETE_COUNT));
const nullMs = bench(() => withNullAssign(DELETE_COUNT));

console.log(`\n处理 ${DELETE_COUNT} 个对象（含构造对象、清空字段、再访问字段）：`);
console.log('做法'.padEnd(34) + '最小值(ms)');
console.log('-'.repeat(50));
console.log('delete obj.y（打成字典模式）'.padEnd(30) + deleteMs.toFixed(3).padStart(8));
console.log('obj.y = null（保持形状）'.padEnd(30) + nullMs.toFixed(3).padStart(8));

const ratio = deleteMs / nullMs;
console.log(`\n本次实测 delete 版本慢约 ${ratio.toFixed(2)} 倍（因环境而异，可能很小甚至相反）。`);
console.log('除了速度，delete 还有一个更隐蔽的问题：它让对象的形状变得不可预测，');
console.log('在大型应用里会累积成"超多态"的属性访问，最终拖慢整个模块。');

// 演示：delete 之后对象仍然可以被遍历，但语义已经不同
const demo = { a: 1, b: 2, c: 3 };
console.log('\n语义对比：');
console.log('  原始对象  :', JSON.stringify(demo), ' Object.keys =', JSON.stringify(Object.keys(demo)));
const afterDelete = { a: 1, b: 2, c: 3 };
delete afterDelete.b;
console.log('  delete b  :', JSON.stringify(afterDelete), ' Object.keys =', JSON.stringify(Object.keys(afterDelete)));
const afterNull = { a: 1, b: 2, c: 3 };
afterNull.b = null;
console.log('  b = null  :', JSON.stringify(afterNull), ' Object.keys =', JSON.stringify(Object.keys(afterNull)));
console.log('  → delete 会改变"对象有哪些键"，null 只是改变了"键的值"。');
console.log('    用 Object.keys 遍历、用展开运算符做浅拷贝时，两者行为完全不同，');
console.log('    这也是"用 null 代替 delete"更安全的原因之一。');

// ---------------------------------------------------------------------------
// 5. 好习惯与坏习惯对照
// ---------------------------------------------------------------------------

console.log('\n--- 5. 好习惯与坏习惯对照 ---');

console.log('✗ 坏习惯一：先建空对象，再逐个补属性');
console.log('    const user = {};');
console.log('    user.name = "小明";');
console.log('    user.age = 18;');
console.log('    // 每次赋值都触发一次隐藏类转换，而且不同代码路径容易长出不同形状');
console.log('');
console.log('✓ 好习惯一：在字面量里一次性写全字段（暂时没有的值写 null）');
console.log('    const user = { name: "小明", age: 18, email: null, avatar: null };');
console.log('    // 形状一次成型，所有用这个字面量创建的对象都共享同一个隐藏类');
console.log('');

console.log('✗ 坏习惯二：用 delete 删除属性');
console.log('    delete user.email;   // 打成字典模式，不可逆');
console.log('');
console.log('✓ 好习惯二：用 null / undefined 表示"没有值"');
console.log('    user.email = null;   // 形状不变');
console.log('    // 真要"移除这个键"，用解构生成新对象：');
console.log('    const { email, ...rest } = user;  // rest 是一个全新的、形状干净的对象');
console.log('');

console.log('✗ 坏习惯三：同一批数据来自不同的构造路径，形状五花八门');
console.log('✓ 好习惯三：做一层"归一化"，把数据补齐成统一形状再交给下游');
console.log('    const normalize = (raw) => ({');
console.log('      id: raw.id ?? 0,');
console.log('      name: raw.name ?? "",');
console.log('      tags: raw.tags ?? [],   // 缺字段一律补默认值');
console.log('    });');

// 演示归一化的效果
const rawRecords = [
  { id: 1, name: 'a' },
  { id: 2, name: 'b', tags: ['x'] },
  { id: 3 },
  { name: 'd', tags: [] },
];

const normalize = (raw) => ({
  id: raw.id ?? 0,
  name: raw.name ?? '',
  tags: raw.tags ?? [],
});

const normalized = rawRecords.map(normalize);
console.log('');
console.log('归一化前每条记录的键：', rawRecords.map((r) => Object.keys(r).join('+')).join(' | '));
console.log('归一化后每条记录的键：', normalized.map((r) => Object.keys(r).join('+')).join(' | '));
console.log('→ 所有对象现在形状完全一致，下游访问属性时走的是同一条快速路径。');

// ---------------------------------------------------------------------------
// 6. 总结与免责说明
// ---------------------------------------------------------------------------

console.log('\n--- 6. 总结 ---');

console.log('要记住的（确定性的、低风险的好习惯）：');
console.log('  1. 对象字面量里一次性把字段写全，不要先建空的再补；');
console.log('  2. 不要用 delete，用 null/undefined，或者解构出新对象；');
console.log('  3. 从外部拿到的数据先做一层归一化，让整批对象形状一致；');
console.log('  4. 把 V8 的隐藏类（Map）和 JS 的 Map 数据结构区分开，两者无关。');
console.log('');
console.log('要警惕的（不要据此做微优化）：');
console.log('  1. 本示例打印的耗时数值因环境和 Node 版本而异；');
console.log('  2. 现代 V8 对多态访问也有优化，小幅形状差异往往测不出稳定区别；');
console.log('  3. 属性访问很少是真正的瓶颈 —— 先测量、再优化，');
console.log('     不要为了"形状漂亮"把代码写得更难读；');
console.log('  4. 数组的元素种类（PACKED/HOLEY、SMI/DOUBLE/OBJECT）是另一套机制，');
console.log('     混装不同类型的值同样会让数组降级，但那是数组的话题。');

console.log(`\n本示例总耗时约 ${Date.now() - scriptStart} ms。`);
console.log('示例结束。');
