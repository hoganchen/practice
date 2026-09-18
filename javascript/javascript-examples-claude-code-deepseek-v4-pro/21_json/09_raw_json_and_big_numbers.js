/**
 * ============================================================================
 * 知识点：JSON.rawJSON / JSON.isRawJSON —— 大整数不丢精度的序列化（ES2025）
 * ============================================================================
 *
 * 【所属分类】21_json —— JSON 的解析与序列化
 * 【难度等级】高级
 * 【前置知识】21_json/03_replacer_and_reviver.js、21_json/04_serialization_edge_cases.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    JSON.rawJSON(text) 是 ES2025 新增的静态方法。它把一段**未经转义、原样输出**的
 *    JSON 文本包装成一个特殊对象，交给 JSON.stringify 时会**原样嵌入结果**，
 *    既不解析成 Number，也不加引号：
 *      JSON.stringify({ id: JSON.rawJSON('1234567890123456789') })
 *      // => '{"id":1234567890123456789}'   ← 一个字符都没丢
 *    JSON.isRawJSON(value) 则是配套的校验函数，用来判断某个值是不是 rawJSON 包装。
 *
 * 2. 为什么需要（真实项目场景）
 *    JS 的 Number 是 IEEE 754 双精度浮点数，只能精确表示 53 位二进制整数，
 *    也就是绝对值不超过 2^53 - 1 = 9007199254740991 的整数（Number.MAX_SAFE_INTEGER）。
 *    但后端的 int64 / long 能到 ±9223372036854775807 —— 足足 63 位。
 *    于是就有了一条经典的线上事故链：
 *      · 后端是 Java/Go/Rust，订单号、雪花算法 ID、数据库自增主键都是 int64；
 *      · 后端 JSON.stringify 出 {"id":1234567890123456789}（它那边不丢精度）；
 *      · 前端 JSON.parse 一跑 -> id 变成 1234567890123456800；
 *      · 拿这个 id 去请求详情 -> 404；去做增删改 -> 改到了别的记录上。
 *    更糟的是**反方向**同样会丢：前端要把这个 id 发回给后端时，
 *    `JSON.stringify({id})` 发出的也是一个被四舍五入过的数字。
 *    rawJSON 就是官方给的"在 JSON 里精确搬运标量"的正规通道。
 *    注意：它是 **stringify 侧**的工具；parse 侧要保留原文，用的是 reviver 的
 *    context.source 参数，见 21_json/10_parse_source_context.js。
 *
 * 3. 核心语法要点
 *    (1) JSON.rawJSON(text) —— text 必须是**字符串**，且必须是**一个合法的 JSON 标量**：
 *        数字、字符串、true、false、null。传对象 '{...}' 或数组 '[...]' 会抛 SyntaxError。
 *    (2) 返回值是一个**原型为 null、被冻结**的对象，只有一个自有属性 rawJSON。
 *        它不是字符串，别拿它当字符串用（不能 .length、不能拼串）。
 *    (3) JSON.stringify 遇到它时：**跳过所有转义和数字转换，把 rawJSON 里的文本原样写出去**。
 *        带缩进（第三个参数）时同样有效。
 *    (4) reviver（stringify 的 replacer、以及 toJSON() 的返回值）返回 rawJSON 对象时，
 *        同样会被尊重 —— 这三个入口都能用。
 *    (5) JSON.isRawJSON(v) 只对真正的 rawJSON 对象返回 true；
 *        形如 { rawJSON: '1' } 的普通对象返回 false。
 *
 * 4. 常见陷阱
 *    (1) 以为 rawJSON 能包对象/数组 —— 不能，只支持标量（见 3.1）。
 *    (2) 以为它对 JSON.parse 也有用 —— 它只影响 stringify；
 *        用 rawJSON 精确序列化出来的文本，**再 parse 回 JS 依然是丢精度的 Number**。
 *    (3) 把用户输入喂给 JSON.rawJSON —— 那等于让用户直接往你的 JSON 里插文本，
 *        虽然标量限制挡住了结构性注入，但仍然是危险习惯。
 *    (4) 想用 structuredClone 复制它 —— 会抛 DataCloneError（它是个特殊内部对象）。
 *    (5) 忘了做特性检测 —— 老运行时上 JSON.rawJSON 是 undefined，调用即 TypeError。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 21_json/09_raw_json_and_big_numbers.js
 *
 * 【预期输出】
 *   先实证"丢精度"如何发生（parse 侧与 stringify 侧各一次），再演示 rawJSON 的
 *   完整用法、边界与错误，最后给出"运行时不支持 rawJSON"时的降级方案（含可运行代码）。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 0. 特性检测：新特性一律先探测再用
// ---------------------------------------------------------------------------

console.log('--- 0. 特性检测 ---');
const HAS_RAW_JSON = typeof JSON.rawJSON === 'function' && typeof JSON.isRawJSON === 'function';
console.log('本机 typeof JSON.rawJSON   =', typeof JSON.rawJSON);
console.log('本机 typeof JSON.isRawJSON =', typeof JSON.isRawJSON);
console.log('=> 是否支持 rawJSON：', HAS_RAW_JSON ? '支持（下面走完整演示）' : '不支持（下面走降级演示）');
console.log('（rawJSON 属于 ES2025，Node 22+ / Chrome 119+ / Safari 17.4+ 可用。）');

// ---------------------------------------------------------------------------
// 1. 问题：超过 2^53 的整数在 JS 里根本存不下
// ---------------------------------------------------------------------------

console.log('\n--- 1. 精度上限：Number.MAX_SAFE_INTEGER ---');
console.log('2^53 - 1        =', Number.MAX_SAFE_INTEGER);
console.log('2^53            =', 2 ** 53, '（从这里开始，相邻整数不再唯一可表示）');
console.log('int64 最大值     =', String(9223372036854775807n), '（用 BigInt 才写得出来）');
console.log('两者的差距       = 大约 1.02 × 10^16 倍，不是"差一点"，是量级差异。');

console.log('\n源码字面量本身就已经丢了精度（这一步最容易忽略）：');
// 下面这个字面量在**词法分析阶段**就被转成 double 了，写多少位都没用。
const literal = 9007199254740993;
console.log('  写 9007199254740993  ->  实际得到', literal);
console.log('  和 2^53 相等吗？', literal === 2 ** 53, '（9007199254740993 与 9007199254740992 落进了同一个 double）');
console.log('  Number.isSafeInteger(9007199254740993) =', Number.isSafeInteger(literal));

// ---------------------------------------------------------------------------
// 2. 实证：parse 侧丢精度
// ---------------------------------------------------------------------------

console.log('\n--- 2. parse 侧：JSON.parse 会把大整数悄悄改掉 ---');
// 注意这里的 JSON 文本是**字符串**，本身是精确的；丢精度发生在 parse 这一步。
const bigText = '{"id":1234567890123456789,"name":"订单"}';
console.log('原始 JSON 文本 =', bigText);
const parsed = JSON.parse(bigText);
console.log('JSON.parse 之后 id =', parsed.id);
console.log('  末几位从 ...789 变成了 ...800 —— 这就是 double 的舍入结果。');
console.log('  Number.isSafeInteger(parsed.id) =', Number.isSafeInteger(parsed.id));
console.log('  连"这个 id 曾经被改过"这件事都不会有任何报错或警告。');

// ---------------------------------------------------------------------------
// 3. 实证：stringify 侧同样丢精度
// ---------------------------------------------------------------------------

console.log('\n--- 3. stringify 侧：回传给后端时又丢一次 ---');
// 假设来自某个来源的 id 用字符串保存着（这是常见做法），要发回给后端。
const idAsString = '1234567890123456789';
const naive = JSON.stringify({ id: Number(idAsString), name: '订单' });
console.log('朴素写法（先 Number 再 stringify） =', naive);
console.log('  后端契约要求 int64，所以不能加引号；但一转 Number 就丢精度。');
console.log('  这是"前端→后端"方向上的经典事故，比 parse 侧更难发现。');

// ---------------------------------------------------------------------------
// 4. 老办法的代价
// ---------------------------------------------------------------------------

console.log('\n--- 4. rawJSON 之前，大家是怎么凑合的 ---');
console.log('① 后端把 int64 序列化成字符串，前端拿 string 原样回传。');
console.log('   代表案例：Twitter/X API 的 id_str 字段。可靠，但要改后端契约，');
console.log('   而且改完之后所有 SDK、所有消费方都得跟着改类型。');
console.log('② 前端用 BigInt + 自定义 replacer。问题是 JSON.stringify 遇到 BigInt 会直接抛错：');
try {
  JSON.stringify({ id: 1234567890123456789n });
} catch (err) {
  console.log(`   💥 ${err.constructor.name}: ${err.message}`);
}
console.log('   所以必须把 BigInt 换成别的东西再拼回去 —— 就回到下面第 ③ 条的套路。');
console.log('③ "哨兵占位 + 字符串替换"的土办法（下面有可运行实现）。');
console.log('   能用，但脆：哨兵串可能和真实数据撞车、正则可能误伤、无法嵌套。');
console.log('④ 上第三方库：json-bigint、lossless-json —— 各自带一套解析器，体积不小。');

/**
 * 老套路：先用哨兵字符串把 BigInt 保护起来，stringify 之后再替换回裸数字。
 * 这是 JSON.rawJSON 出现之前最常见的"土办法"，仅用于对比教学。
 * @param {unknown} value 任意待序列化的值
 * @param {string} sentinel 哨兵串，必须足够独特
 * @returns {string} JSON 文本
 */
function stringifyWithBigIntHack(value, sentinel) {
  const text = JSON.stringify(value, (key, val) => (typeof val === 'bigint' ? sentinel + val.toString() + sentinel : val));
  // 把 "___BIG___123___BIG___" 这种"带引号的哨兵串"还原成裸数字
  return text.replace(new RegExp(`"${sentinel}(-?\\d+)${sentinel}"`, 'g'), '$1');
}

const HACK_SENTINEL = '__BIG_' + Math.random().toString(36).slice(2) + '_BIG__';
console.log('   土办法演示：', stringifyWithBigIntHack({ id: 1234567890123456789n, ok: true }, HACK_SENTINEL));
console.log('   可以看到数字确实保住了，但想想这三点：哨兵撞车怎么办？');
console.log('   用户数据里正好出现这个哨兵串怎么办？换个人忘了传 sentinel 参数怎么办？');

// ---------------------------------------------------------------------------
// 5. 正规解法：JSON.rawJSON（ES2025）
// ---------------------------------------------------------------------------

console.log('\n--- 5. JSON.rawJSON：让 stringify 原样嵌入 ---');

if (HAS_RAW_JSON) {
  const raw = JSON.rawJSON('1234567890123456789');

  console.log('JSON.rawJSON("1234567890123456789") 返回的是：');
  console.log('  typeof          =', typeof raw);
  console.log('  自有属性        =', JSON.stringify(Object.getOwnPropertyNames(raw)));
  console.log('  原型是 null 吗？ =', Object.getPrototypeOf(raw) === null);
  console.log('  被冻结了吗？     =', Object.isFrozen(raw));
  console.log('  isRawJSON 判定   =', JSON.isRawJSON(raw));
  console.log('  👆 它是一个"标记对象"，不是数字也不是字符串，唯一作用是告诉 stringify：');
  console.log('     把 rawJSON 里那段文本**原样**写出去。');

  const out = JSON.stringify({ id: raw, name: '订单' });
  console.log('\n序列化结果 =', out);
  console.log('与朴素写法对比 =', naive);
  // 两者长度完全一样（都是 19 位数字），差别只在末尾几位 —— 这正是它隐蔽的原因。
  console.log('字符数：rawJSON 版', out.length, ' vs  朴素版', naive.length, '（长度一模一样！）');
  console.log('差别只在末位：', out.slice(7, 26), ' vs ', naive.slice(7, 26));

  console.log('\n带缩进（第三个参数）也同样有效：');
  console.log(JSON.stringify({ orderId: raw, amount: 99.5 }, null, 2).split('\n').map((l) => '  ' + l).join('\n'));

  console.log('\n--- 6. 三种入口都能用 rawJSON ---');
  console.log('① 直接放在对象/数组里：', JSON.stringify({ list: [JSON.rawJSON('9007199254740993'), 2] }));
  console.log('② 作为 replacer 的返回值：',
    JSON.stringify({ id: 'x' }, (key, val) => (key === 'id' ? JSON.rawJSON('1234567890123456789') : val)));
  console.log('③ 作为 toJSON() 的返回值：',
    JSON.stringify({ toJSON: () => JSON.rawJSON('1234567890123456789') }));
  console.log('顶层直接 stringify 一个 rawJSON 也行：', JSON.stringify(JSON.rawJSON('1234567890123456789')));
  console.log('④ 配合 BigInt —— 这是把 BigInt 塞进 JSON 的正规手段：');
  console.log('   ', JSON.stringify({ id: JSON.rawJSON(String(1234567890123456789n)) }));

  console.log('\n--- 7. 边界与错误：rawJSON 只接受"单个 JSON 标量" ---');
  /**
   * 试一下某个文本能不能被 JSON.rawJSON 接受。
   * @param {string} text 待测试的文本
   * @returns {string} 结果描述
   */
  function tryRaw(text) {
    try {
      return `✅ 可接受 -> stringify 得到 ${JSON.stringify(JSON.rawJSON(text))}`;
    } catch (err) {
      return `❌ ${err.constructor.name}（不可接受）`;
    }
  }
  const rawCases = ['1234567890123456789', '-0', '1.0', '1.5e10', '"字符串也行"', 'true', 'null', '[1,2]', '{"a":1}', '007', '+1', 'NaN', '1,2'];
  for (const text of rawCases) {
    console.log(`  JSON.rawJSON(${JSON.stringify(text).padEnd(24)}) ${tryRaw(text)}`);
  }
  console.log('  👆 规律：数字、字符串、true/false/null 这些**标量**可以；');
  console.log('     对象和数组一律 SyntaxError —— rawJSON 是给"标量精确搬运"用的，');
  console.log('     不是给"整段 JSON 片段注入"用的。');

  console.log('\n--- 8. isRawJSON 的判别能力 ---');
  console.log('  JSON.isRawJSON(JSON.rawJSON("1"))        =', JSON.isRawJSON(JSON.rawJSON('1')));
  console.log('  JSON.isRawJSON({ rawJSON: "1" })         =', JSON.isRawJSON({ rawJSON: '1' }), '（普通对象，冒充不了）');
  console.log('  JSON.isRawJSON("1")                      =', JSON.isRawJSON('1'));
  console.log('  JSON.isRawJSON(1)                        =', JSON.isRawJSON(1));
  console.log('  JSON.isRawJSON(null)                     =', JSON.isRawJSON(null));
  console.log('  JSON.isRawJSON(undefined)                =', JSON.isRawJSON(undefined));

  console.log('\n--- 9. 重要限制：rawJSON 只帮 stringify，不帮 parse ---');
  const roundTrip = JSON.stringify({ id: JSON.rawJSON('1234567890123456789') });
  console.log('  精确序列化出来的文本 =', roundTrip);
  console.log('  再 JSON.parse 回来     =', JSON.parse(roundTrip).id, '（又丢了！）');
  console.log('  原因：parse 的结果是 JS 值，而 JS 的 Number 装不下这个整数。');
  console.log('  想在 parse 侧也保住原文，靠的是 reviver 的第三个参数 context.source，');
  console.log('  见 21_json/10_parse_source_context.js（那里有完整的"字符串保真"示例）。');
} else {
  console.log('⚠️ 本运行时没有 JSON.rawJSON，跳过第 5~8 节的演示。');
  console.log('   降级方案：用第 4 节的哨兵替换法，或让后端把 int64 输出成字符串。');
}

// ---------------------------------------------------------------------------
// 10. 降级方案：不支持 rawJSON 时怎么写
// ---------------------------------------------------------------------------

console.log('\n--- 10. 降级方案（任何环境都能跑） ---');

/**
 * 与 JSON.stringify 签名兼容、但不支持 rawJSON 时的替代实现。
 * 策略：BigInt 一律序列化成**字符串**，由接收方按契约转回整数。
 * 这是最保守也最可移植的做法 —— 代价是改变了线格式（数字变字符串）。
 * @param {unknown} value 待序列化的值
 * @returns {string} JSON 文本
 */
function stringifySafe(value) {
  return JSON.stringify(value, (key, val) => (typeof val === 'bigint' ? val.toString() : val));
}

console.log('  统一转字符串：', stringifySafe({ id: 1234567890123456789n, name: '订单' }));
console.log('  ✅ 任何环境都支持、绝不丢精度、不需要哨兵。');
console.log('  ❌ 线格式从 int 变成了 string，后端要能接受（这是"契约变更"，需要双方约定）。');
console.log('');
console.log('  如果既不能改后端契约、运行时不支持 rawJSON、又不能上第三方库，');
console.log('  最后的手段才是第 4 节的哨兵替换法，并且务必：');
console.log('    · 用加密随机数生成哨兵，别用固定字符串；');
console.log('    · 在校验过的、结构可控的数据上使用，不要直接作用于用户输入；');
console.log('    · 序列化后立刻 JSON.parse 自检一次，确认结构没被破坏。');

// ---------------------------------------------------------------------------
// 11. 检查清单
// ---------------------------------------------------------------------------

console.log('\n--- 11. 检查清单 ---');
const checklist = [
  ['接口里有没有超过 2^53 的整数', '有的话必须走 rawJSON 或字符串方案'],
  ['parse 侧也要保真吗', '那就用 reviver 的 context.source（见 10）'],
  ['rawJSON 只包标量', '对象/数组会抛 SyntaxError'],
  ['永远先做特性检测', "typeof JSON.rawJSON === 'function'"],
  ['rawJSON 文本绝不能来自用户输入', '它会被原样写进输出'],
  ['不要 structuredClone 它', '会抛 DataCloneError'],
  ['跨端契约写清楚', '是 number 还是 string，前后端各写一遍测试'],
  ['用 Number.isSafeInteger 做断言', '在数据入口处 fail fast'],
];
for (const [item, why] of checklist) {
  console.log(`  ${item.padEnd(30)} -> ${why}`);
}

console.log('\n本节结束。一句话总结：');
console.log('  JSON.rawJSON 是**序列化侧**的"精确通道"，专治 int64 丢精度；');
console.log('  解析侧的对称工具是 reviver 的 context.source，两个配合才是完整方案。');
