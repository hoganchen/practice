/**
 * ============================================================================
 * 知识点：Maybe 函子 —— 把"值可能不存在"变成容器的一种状态
 * ============================================================================
 *
 * 【所属分类】40_functional_programming —— 函数式编程进阶
 * 【难度等级】进阶
 * 【前置知识】40_functional_programming/01_functor.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Maybe 是一类"可能装着值、也可能是空的"的函子，有两种状态：
 *      Just(value) —— 有值，值是 value
 *      Nothing     —— 没值（注意：不是 null，而是一个有身份的"空容器"）
 *    对这两种状态调用 map，规则是：
 *      Just(x).map(f)  →  Just(f(x))
 *      Nothing.map(f)  →  Nothing      ← 这就是"短路"：回调根本不会被调用
 *    即：只要链上任何一环是 Nothing，后面所有 map 都自动跳过，最后安全地取默认值。
 *
 * 2. 为什么需要
 *    从后端拿到的数据经常是"层层嵌套 + 可能缺字段"的：
 *      res.data.user.profile.address.city
 *    只要中间任意一层是 undefined，这行就抛 TypeError。现实中我们得写：
 *      res && res.data && res.data.user && ...
 *    或者用可选链：
 *      res?.data?.user?.profile?.address?.city
 *    可选链解决了"读"，但没解决"读到之后还要做一串变换"：
 *      - 每一步之后想再变换，都要重新加 `?.` 与 `?? 默认值`；
 *      - `?? 默认值` 一旦写下，链就断了，后面的变换会作用在默认值上；
 *      - 更糟的是"读到 undefined"和"读到空字符串"分不清，容易悄悄用错默认值。
 *    Maybe 的价值：把"缺失"变成一种可以顺着管道流动的值，
 *    像接力棒一样一路传到最后，只在出口处统一决定怎么兜底。
 *
 * 3. 核心语法要点
 *    (1) Nothing 用单例（只有一个实例）即可，因为没有值需要区分。
 *    (2) fromNullable(x)：把"外界的不确定值"转进 Maybe 世界的标准入口。
 *    (3) map 在 Nothing 上必须直接返回 Nothing，绝不能调用回调。
 *    (4) getOrElse(default)：出口方法，取值或兜底值。
 *    (5) Maybe 仍然是函子 —— 前面讲的两条定律在 Just 和 Nothing 上都成立。
 *
 * 4. 常见陷阱
 *    - 把 Nothing 实现成 null 并直接用 Optional Chaining 代替，那就失去了
 *      "变换链"的能力，只是把老问题换了个写法。
 *    - Nothing.map(f) 里调用了 f，导致本该跳过的地方仍触发副作用（甚至抛错）。
 *    - 混淆"空值"与"假值"：Maybe.fromNullable('') 应该是 Just('')，
 *      因为空字符串是存在的值；只有 null / undefined 才算 Nothing。
 *    - 层层 Maybe 嵌套：如果回调本身返回 Maybe，就会得到 Maybe(Maybe)，见 04_monad.js。
 *    - 过度使用：只有一两层取值时，`?.` 更好读。Maybe 适合"转换链条长"的场景。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 40_functional_programming/02_maybe.js
 *
 * 【预期输出】
 *   先演示 && 与 ?. 的局限，再实现 Just / Nothing 并验证短路行为，
 *   最后用一份"字段残缺的 API 响应"对比三种写法的差异。
 * ============================================================================
 */

console.log('--- 1. 痛点：从后端拿到的数据可能缺字段 ---');

// 模拟三种真实的后端响应：完整、中途断掉、整块缺失。
const responseFull = {
  code: 0,
  data: { user: { profile: { address: { city: '杭州' } } } },
};
const responseBroken = {
  code: 0,
  data: { user: { profile: null } },
};
const responseEmpty = { code: 0 };

// 朴素写法一：直接点下去。只要有一层是 null/undefined 就炸。
function cityNaive(res) {
  return res.data.user.profile.address.city;
}
try {
  console.log('  直接点 →', cityNaive(responseFull));
  console.log('  直接点（残缺响应）→', cityNaive(responseBroken));
} catch (err) {
  console.log('  直接点（残缺响应）→ 抛出异常：', err.constructor.name, '-', err.message);
  console.log('  这行代码在生产环境就是一个定时炸弹，必须 try/catch 整个包起来。');
}

console.log('--- 2. 朴素解法 A：&& 短路 ---');

// && 的思路：逐层确认存在，不存在就整体返回 undefined。
// 这能跑，但缺点非常明显：
//   (1) 字段路径一长就变成噪音，真正的意图（取 city）被淹没了；
//   (2) 中间任何一层改成别的名字，要改整条链；
//   (3) 只在"读"的时候有用，读到以后想继续变换，还得重新判断。
function cityAndGuard(res) {
  return res && res.data && res.data.user && res.data.user.profile && res.data.user.profile.address && res.data.user.profile.address.city;
}
console.log('  && 写法（完整响应）→', cityAndGuard(responseFull));
console.log('  && 写法（残缺响应）→', cityAndGuard(responseBroken));
console.log('  && 写法（空响应）  →', cityAndGuard(responseEmpty));
console.log('  可行，但你看这行代码有多长 —— 上面的注释都比它短。');

console.log('--- 3. 朴素解法 B：可选链 ?. 与空值合并 ?? ---');

// ES2020 引入的可选链，把上面的链缩成一行，这是目前的主流写法。
function cityOptional(res) {
  return res?.data?.user?.profile?.address?.city;
}
console.log('  ?. 写法（完整响应）→', cityOptional(responseFull));
console.log('  ?. 写法（残缺响应）→', cityOptional(responseBroken));
console.log('  ?. 写法（空响应）  →', cityOptional(responseEmpty));
console.log('  ?. 已经很好用了，日常项目里首选它。但它仍有两个解决不了的问题：');

// 问题一：链式变换会断掉。
// 拿到 city 以后我们还想做两件事：去空格 + 转大写。
// 一旦在中间写了 ?? 兜底，链就"落地"成了普通字符串，后续变换作用在兜底值上。
const cityThenTransform = (res) =>
  (res?.data?.user?.profile?.address?.city ?? 'unknown city').trim().toUpperCase();
console.log('  问题一：?. 之后想接着变换（完整响应）→', cityThenTransform(responseFull));
console.log('  问题一：?. 之后想接着变换（空响应）  →', cityThenTransform(responseEmpty));
console.log('          （兜底值 "unknown city" 被后面的 toUpperCase 一起加工成了 "UNKNOWN CITY"，');
console.log('            可我们只想在缺失时原样兜底，不想让变换作用到兜底值上。）');

// 问题二：分不清"字段缺失"和"字段是空字符串"。
const resWithEmptyCity = { data: { user: { profile: { address: { city: '' } } } } };
console.log('  问题二：字段存在但值为空字符串 →', cityOptional(resWithEmptyCity), '（和"缺失"长得一模一样）');
console.log('          用 ?? 兜底也救不了，因为 ?? 只对 null/undefined 生效，空字符串会原样穿过去。');

console.log('--- 4. 引出抽象：Maybe 函子 ---');

// 关键想法：既然"有值/无值"这件事要一路带着走，那就把它做成一个容器。
// 容器有两个变体：
//   Just(value) —— 装着值的盒子
//   Nothing     —— 空的盒子（单例）
// 两者都有 map：Just 会应用函数，Nothing 直接原样返回自己。
// 于是"缺失"就像接力棒，能顺着链条一路传下去，不需要每一步都写 if。

// 空盒子：不需要多个实例，用单例即可。
const Nothing = {
  // 标记一下身份，方便外部判断（也方便我们打印）。
  isNothing: true,
  isJust: false,

  // Nothing 的 map：什么都不做，直接把"空"继续传下去。
  // 注意 fn 根本不会被调用 —— 这是 Maybe 最核心的一条规则。
  map() {
    return this; // 返回自己即可，反正是单例
  },

  // 出口：没有值，返回兜底值。
  getOrElse(fallback) {
    return typeof fallback === 'function' ? fallback() : fallback;
  },

  // 只是为了让打印好看，不参与逻辑。
  toString() {
    return 'Nothing';
  },
};

// 有值的盒子。
class Just {
  constructor(value) {
    this._value = value;
    this.isNothing = false;
    this.isJust = true;
  }

  // map：把函数作用在里面的值上，再装回一个新的 Just。
  map(fn) {
    return new Just(fn(this._value));
  }

  // 出口：有值就返回里面的值（兜底值用不上）。
  getOrElse() {
    return this._value;
  }

  toString() {
    return `Just(${JSON.stringify(this._value)})`;
  }
}

// Maybe 作为"命名空间"，提供进出这个世界的大门。
const Maybe = {
  // of：把确定存在的值装进来。
  of(value) {
    return new Just(value);
  },

  // fromNullable：把"外界的不确定值"转进来，这是最常用的入口。
  // 只有 null / undefined 才视为缺失。注意 0、''、false、NaN 都是"存在的值"。
  fromNullable(value) {
    return value === null || value === undefined ? Nothing : new Just(value);
  },
};

console.log('  Maybe.of(42) →', Maybe.of(42).toString());
console.log('  Maybe.fromNullable("杭州") →', Maybe.fromNullable('杭州').toString());
console.log('  Maybe.fromNullable(null) →', Maybe.fromNullable(null).toString());
console.log('  Maybe.fromNullable(undefined) →', Maybe.fromNullable(undefined).toString());
console.log('  Maybe.fromNullable(0) →', Maybe.fromNullable(0).toString(), ' ← 0 是存在的值，不是 Nothing');
console.log('  Maybe.fromNullable("") →', Maybe.fromNullable('').toString(), ' ← 空字符串同理，这点和"假值判断"很不一样');

console.log('--- 5. 核心行为：Nothing 短路 ---');

// 用一个会打印的副作用函数来证明：Nothing 的 map 回调根本不会执行。
const noisyDouble = (n) => {
  console.log('    （副作用函数被调用了，输入是', n, '）');
  return n * 2;
};

console.log('  Just(21).map(noisyDouble)：');
console.log('    结果 →', Maybe.of(21).map(noisyDouble).toString());
console.log('  Nothing.map(noisyDouble)：');
console.log('    结果 →', Nothing.map(noisyDouble).toString(), '（注意上面没有打印"副作用函数被调用"，说明回调被跳过了）');

// 长链上的短路：中间任何一环变 Nothing，后面全部跳过。
const chainOnJust = Maybe.of(5).map((x) => x + 1).map((x) => x * 10);
const chainOnNothing = Nothing.map((x) => x + 1).map((x) => x * 10);
console.log('  Just(5) 链 →', chainOnJust.toString());
console.log('  Nothing 链 →', chainOnNothing.toString(), '（两次 map 都没执行，但代码一个 if 也没写）');

console.log('--- 6. Maybe 仍然满足函子定律 ---');

const identity = (v) => v;
const f = (x) => x + 1;
const g = (x) => x * 3;

// 恒等律：对 Just 与 Nothing 都必须成立。
console.log('  恒等律 · Just(7).map(v => v) →', Maybe.of(7).map(identity).getOrElse('兜底'), ' 原值 →', Maybe.of(7).getOrElse('兜底'));
console.log('  恒等律 · Nothing.map(v => v).getOrElse("兜底") →', Nothing.map(identity).getOrElse('兜底'));
// 组合律：map(f).map(g) 与 map(x => g(f(x))) 等价，对 Nothing 同样成立。
console.log('  组合律 · Just(4).map(f).map(g) →', Maybe.of(4).map(f).map(g).getOrElse(0));
console.log('  组合律 · Just(4).map(x => g(f(x))) →', Maybe.of(4).map((x) => g(f(x))).getOrElse(0));
console.log('  组合律 · Nothing.map(f).map(g).getOrElse(0) →', Nothing.map(f).map(g).getOrElse(0));
console.log('  结论：Nothing 不是"违法容器"，它是一个忠实的函子 —— 只是它的值永远是"空"。');

console.log('--- 7. 真实场景：解析可能残缺的 API 响应 ---');

// 需求：从订单响应里取出收货城市，做规范化（去空格 + 大写），
//      实在拿不到就显示"未知城市"。
//
// 注意这里的变换不止一步：取值 → 判空 → trim → 转大写 → 兜底。
// 这正是 Maybe 比 ?. 更合适的地方。

// 先看一个"想当然"的写法：既然 Nothing 能短路，那每一层取字段都写成一步 map 不就行了？
// 下面这段代码会崩 —— 而且崩得很有教育意义，我们故意留着它，用 try/catch 展示。
const pickCityNaive = (res) =>
  Maybe.fromNullable(res)
    .map((r) => r.data)
    .map((d) => d.user)
    .map((u) => u.profile) // ← 这一步返回 null，被装进 Just(null)
    .map((p) => p.address) // ← 崩在这里：null.address
    .map((a) => a.city)
    .getOrElse('未知城市');

try {
  console.log('  天真的"每层一个 map"写法（完整响应）→', pickCityNaive(responseFull));
  console.log('  天真的"每层一个 map"写法（profile 为 null）→', pickCityNaive(responseBroken));
} catch (err) {
  console.log('  天真的"每层一个 map"写法（profile 为 null）→ 抛出异常：', err.constructor.name, '-', err.message);
  console.log('  ★ 关键教训：Maybe 只能短路"容器层面的空（Nothing）"，');
  console.log('    它管不住"回调内部的空"。上面的 u.profile 取出来是 null，');
  console.log('    这个 null 被老老实实装进了 Just(null)，于是下一步就炸了。');
  console.log('    换句话说：map 的语义是"这里的值一定存在，放心用"，这一步不该用 map。');
  console.log('    要"取出来的值本身可能为空"的那种算子，叫 chain / flatMap —— 见 04_monad.js。');
}

// 那现实里怎么写才既安全又清晰？
// 答案是分工：用 ?. 负责"安全地读到原始值"，用 Maybe 负责"读到之后的整条变换链 + 兜底"。
//   · ?. 是"纯读取"场景的最佳工具，不该被取代；
//   · Maybe 的价值在于读完之后还有好几步变换、以及"缺失"与"空值"要区分的时候。
// 把"每个字段一层"收进一次安全读取里，就不会出现上面那种 Just(null) 的陷阱。
const pickCity = (res) =>
  Maybe.fromNullable(res?.data?.user?.profile?.address?.city)
    .map((city) => city.trim())
    .map((city) => city.toUpperCase())
    .getOrElse('未知城市');

const cases = [
  ['完整响应', responseFull],
  ['profile 为 null', responseBroken],
  ['只有 code', responseEmpty],
  ['undefined 响应', undefined],
  ['城市是空字符串', resWithEmptyCity],
  ['城市带空格', { data: { user: { profile: { address: { city: '  shen zhen  ' } } } } }],
];

for (const [label, res] of cases) {
  const result = pickCity(res);
  const shown = result === '' ? '(空字符串)' : result;
  console.log(`  ${label.padEnd(16)} → ${String(shown).padEnd(12)} 原始值 ${JSON.stringify(res?.data?.user?.profile?.address?.city)}`);
}
console.log('  重点看最后两行：');
console.log('    "城市是空字符串" → 结果是 (空字符串)，不是"未知城市"。');
console.log('      因为 Maybe.fromNullable("") 得到的是 Just("")——空字符串是"存在的值"。');
console.log('      这恰好是我们想要的：能区分"后端没给这个字段"和"后端给了但给的是空"。');
console.log('    "城市带空格" → 空格被 trim 掉了。注意 trim 只对真正存在的值执行，');
console.log('      缺失时整条链短路，连 trim 都不会跑。');

console.log('  对比一下三种写法的可读性：');
console.log('    && 链：  一行 100+ 字符，全是重复的路径。');
console.log('    ?. 链：  一行搞定读取，但后续变换需要额外判断，且分不清"缺失"和"空串"。');
console.log('    Maybe：  ?. 负责安全读取原始值，Maybe 负责之后的变换链与统一兜底。');
console.log('  提示：如果业务上要求"空字符串也算缺失"，就把入口那行改成：');
console.log('    Maybe.fromNullable(res?.data?.user?.profile?.address?.city?.trim() || null)');
console.log('    加上 || null 之后，空字符串会被归一到 null，从而变成 Nothing。');

console.log('--- 8. 进阶用法：getOrElse 接受函数（惰性兜底）---');

// 兜底值有时候是"算出来的"（比如记录一条日志、生成一个默认对象）。
// 如果兜底值是普通值，无论需不需要都会被求值 —— 白算一次。
// 让 getOrElse 支持传函数，就能做到"只在真的缺失时才计算"。
function makeFallback() {
  console.log('    （正在计算兜底值 —— 只在需要时才会看到这行）');
  return { city: '默认城市', generatedAt: '刚刚' };
}

console.log('  有值时：', Maybe.fromNullable('上海').getOrElse(makeFallback));
console.log('  无值时：', Maybe.fromNullable(null).getOrElse(makeFallback).city);
console.log('  小结：把兜底写成函数，可以避免"有值却白算一遍兜底逻辑"的浪费。');

console.log('--- 9. 什么时候不该用 Maybe ---');

// 反面案例：只有一层取值，Maybe 反而更啰嗦。
const simpleWithMaybe = Maybe.fromNullable(responseEmpty)
  .map((r) => r.code)
  .map((c) => `code=${c}`)
  .getOrElse('code=未知');
const simpleWithOptional = `code=${responseEmpty?.code ?? '未知'}`;
console.log('  Maybe 版 →', simpleWithMaybe);
console.log('  ?. 版   →', simpleWithOptional, '（明显更短，这里选 ?.）');
console.log('  判断标准：');
console.log('    只有 1~2 层读取 + 没有后续变换 → 用 ?. 和 ??。');
console.log('    3 层以上读取，或者读完之后还有一串变换 → 用 Maybe 更清晰。');
console.log('    需要区分"缺失"与"空值"、需要惰性兜底 → 用 Maybe。');

console.log('--- 10. 小结 ---');
console.log('  Maybe = Just(有值) | Nothing(无值)，两者都是函子。');
console.log('  Nothing.map(f) 直接返回 Nothing，回调不执行 —— 缺失会自动短路。');
console.log('  fromNullable 是入口，getOrElse 是出口。');
console.log('  下一个问题：如果"失败"需要携带原因（而不只是"空"），Maybe 就不够用了，');
console.log('  这时要用 Either（03_either.js）。');
