/**
 * ============================================================================
 * 知识点：代数数据类型（积类型 / 和类型）与模式匹配的手工模拟
 * ============================================================================
 *
 * 【所属分类】40_functional_programming —— 函数式编程进阶
 * 【难度等级】高级
 * 【前置知识】40_functional_programming/03_either.js、10_destructuring/*、34_modern_es_features/*
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    代数数据类型（Algebraic Data Type, ADT）是"用类型来表达数据形状"的一类做法，
 *    最常见的两种构造方式：
 *      · 积类型（product type）—— "同时具备 A 和 B"，组合数是各部分的乘积。
 *        对象 { name, age }、元组 [x, y] 都是积类型。
 *      · 和类型（sum type）—— "要么是 A，要么是 B"，组合数是各部分的和。
 *        也叫标签联合（tagged union）、可辨识联合（discriminated union）、变体（variant）。
 *    模式匹配（pattern matching）：按"数据的形状"分支处理，并且能同时把数据拆开。
 *    它可以近似理解为"加强版的 switch + 解构"，但关键在于它支持穷尽性检查。
 *
 * 2. 为什么需要
 *    现实中大量状态天然是"和类型"：
 *      · 网络请求：加载中 / 成功（带数据）/ 失败（带错误）—— 三选一。
 *      · 支付结果：成功（带流水号）/ 失败（带原因）/ 处理中（带预计时间）—— 三选一。
 *      · 订单状态：待付款 / 已付款 / 已发货 / 已完成 / 已取消 —— 五选一。
 *    用普通对象建模时，这些状态会退化成"一堆布尔字段"，于是"非法状态"可以被写出来：
 *      { isLoading: true, data: [...], error: new Error() }   ← 同时加载中又成功又失败
 *    这种对象一旦出现，bug 会散落到每个读取它的地方。和类型则从结构上让它写不出来。
 *
 * 3. 核心语法要点
 *    (1) 用 { tag: 'Ok', value } 这种"带标签的对象"模拟和类型，
 *        tag 就是"可辨识字段"（discriminant）。
 *    (2) 用 Object.freeze 冻结，避免有人偷偷改掉 tag 让状态失效。
 *    (3) 手写 match(value, handlers)：按 value.tag 去 handlers 里找对应函数并调用。
 *    (4) 穷尽性检查：把"这个和类型有哪些 tag"记录下来，
 *        在分派前/后检查是否每个 tag 都有处理器，缺了就报错。
 *    (5) TypeScript 的 discriminated union 是原生支持这件事的：
 *        switch (value.tag) 会收窄类型，配合 never 可以做编译期穷尽性检查。
 *
 * 4. 常见陷阱
 *    - 用一堆布尔字段建模和类型，导致非法状态可表示（本节第 2 节有实测）。
 *    - tag 字符串手写容易拼错（'ok' vs 'Ok'），建议定义为常量集中管理。
 *    - 忘记处理某个分支，运行时才发现 —— 所以穷尽性检查是必需的，不是可选的。
 *    - 以为 JavaScript 已经有原生模式匹配。**没有**。目前只有 TC39 的提案，
 *      且尚未定案，不要在生产代码里使用提案语法（见第 8 节）。
 *    - 把 match 写成"万能 if 链"：如果分支里还嵌套分支，说明该拆类型了。
 *    - 忘了和类型是可以递归的（比如 JSON、表达式树），这时 match 天然适合递归下降解析。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 40_functional_programming/06_adt_and_pattern_matching.js
 *
 * 【预期输出】
 *   先对比积类型与和类型，再实测"布尔字段建模"会怎样产生非法状态，
 *   然后用 { tag } 手工模拟和类型、实现 match 与穷尽性检查，
 *   最后说明 TS 的 discriminated union 强在哪，以及 JS 原生模式匹配的现状。
 * ============================================================================
 */

console.log('--- 1. 积类型：同时具备多个字段（AND）---');

// 积类型的"积"字来自组合数：一个类型的可能取值个数，是各字段可能取值个数的乘积。
// 例：{ isVip: boolean, hasCoupon: boolean } 的组合数是 2 × 2 = 4。
// 注意：这 4 种组合里，有些是合法的（比如"是 VIP 且有券"），有些业务上可能没意义，
// 但类型系统管不了 —— 这是积类型的固有局限。
const vipCombos = [];
for (const isVip of [true, false]) {
  for (const hasCoupon of [true, false]) {
    vipCombos.push({ isVip, hasCoupon });
  }
}
console.log('  { isVip: boolean, hasCoupon: boolean } 的 2 × 2 = 4 种组合：');
for (const c of vipCombos) {
  console.log('    isVip=', c.isVip, ' hasCoupon=', c.hasCoupon);
}

// 元组也是积类型：[number, number] 表示"一个横坐标 AND 一个纵坐标"。
const point = [3, 4];
console.log('  元组 [3, 4] 也是积类型（横坐标 AND 纵坐标）→', point);

console.log('--- 2. 和类型：在这些里选一个（OR）---');

// 和类型的组合数是"和"：'Ok' 或 'Err'，就是 1 + 1 = 2 种可能。
// 它的关键特征是：**同一时刻只处于其中一种状态**。
// 现实里最典型的和类型就是"网络请求状态"：加载中 / 成功 / 失败，三选一。

// 先看看用"布尔字段 + 可选字段"建模会出什么问题。
function makeRequestStateBool() {
  return { isLoading: false, data: null, error: null };
}
// 正常流转：没问题。
const s1 = makeRequestStateBool();
s1.isLoading = true;
s1.isLoading = false;
s1.data = [{ id: 1 }];
console.log('  正常状态 →', s1);

// 但下面这些"非法状态"在类型上完全合法，JS 也不会拦你 —— 它们就是 bug 的温床。
const illegalStates = [
  { isLoading: true, data: [{ id: 1 }], error: null },        // 既在加载又已经有数据
  { isLoading: true, data: null, error: new Error('超时') },   // 既在加载又已经失败
  { isLoading: false, data: null, error: null },              // 加载完了，但没有数据也没有错误
  { isLoading: false, data: [{ id: 1 }], error: new Error('超时') }, // 同时成功和失败
];
console.log('  用布尔字段建模时，下面这些"非法状态"都能被写出来：');
for (const s of illegalStates) {
  console.log(`    isLoading=${String(s.isLoading).padEnd(5)} data=${s.data === null ? 'null' : '有值'} error=${s.error === null ? 'null' : '有值'}`);
}
console.log('  ★ 问题不在"有人不小心写错"，而在于"这种写法允许写错"。');
console.log('    读取方必须每次都写一堆 if 去猜当下到底是哪种状态，一旦漏判就出 bug。');
console.log('  ★ 这就是和类型要解决的核心问题：让非法状态从结构上无法表达。');

console.log('--- 3. 朴素解法 A：用 null 判断代替状态 ---');

// 常见的土办法：只看哪个字段非空。
function describeStateNaive(state) {
  if (state.error) return `失败：${state.error.message}`;
  if (state.data) return `成功：${state.data.length} 条`;
  return '加载中';
}
console.log('  ', describeStateNaive({ isLoading: true, data: null, error: null }));
console.log('  ', describeStateNaive({ isLoading: false, data: [{ id: 1 }], error: null }));
console.log('  问题一：判断顺序会影响结果（如果 error 和 data 同时有值，永远只报失败）。');
console.log('  问题二：靠"真值/假值"判断状态，一旦业务数据本身可以是假值就会误判。');
console.log('          注意 [] 和 0 的情况不一样：[] 是真值，0 是假值。');
console.log('  ', describeStateNaive({ isLoading: false, data: [], error: null }), ' ← [] 是真值，这个碰巧对了');
console.log('  ', describeStateNaive({ isLoading: false, data: 0, error: null }), ' ← data 是 0，被当成"没有数据"而误判成加载中！');
console.log('          同理 data 是空字符串 "" 或 false 时也会误判。这依赖数据取值，非常脆弱。');

console.log('--- 4. 朴素解法 B：用类继承 + instanceof ---');

// 另一种做法：每个状态一个类，用 instanceof 区分。
// 这在 Java / C# 里很常见，在 JS 里能用，但有几个明显缺点。
class LoadingState {
  constructor() {
    this.name = 'Loading';
  }
}
class SuccessState {
  constructor(data) {
    this.name = 'Success';
    this.data = data;
  }
}
class FailureState {
  constructor(error) {
    this.name = 'Failure';
    this.error = error;
  }
}
function describeStateByClass(state) {
  if (state instanceof FailureState) return `失败：${state.error.message}`;
  if (state instanceof SuccessState) return `成功：${state.data.length} 条`;
  if (state instanceof LoadingState) return '加载中';
  return '未知状态'; // 必须兜底，否则漏了分支会静默返回 undefined
}
console.log('  ', describeStateByClass(new LoadingState()));
console.log('  ', describeStateByClass(new SuccessState([{ id: 1 }, { id: 2 }])));
console.log('  缺点一：类一旦定义就不能随意共享（跨 iframe / 跨模块副本时 instanceof 会失效）。');
console.log('  缺点二：想序列化成 JSON 再传回前端，类信息会丢失，反序列化后 instanceof 判断全部失效。');
console.log("  缺点三：没有穷尽性检查，漏了某个分支时编译器/运行时不报警，只能靠 return '未知状态' 兜底。");
console.log('  缺点四：每个状态都要写一个类，样板代码多。');

console.log('--- 5. 引出抽象：用 { tag } 手工模拟和类型 ---');

// 核心想法非常简单：用一个字符串字段（通常叫 tag / type / kind）来标识"这是哪一种"。
// 这个字段叫"可辨识字段"（discriminant），有了它，剩下的就是普通的对象。
const Ok = (value) => Object.freeze({ tag: 'Ok', value });
const Err = (error) => Object.freeze({ tag: 'Err', error });

console.log('  Ok([1, 2]) →', Ok([1, 2]));
console.log('  Err("超时") →', Err('超时'));
console.log('  Object.freeze 的意义：如果有人写 result.tag = "Err"，在严格模式下会直接报错，');
console.log('  而不是悄悄地把一个"成功"变成"失败"。');
try {
  const frozen = Ok(1);
  frozen.tag = 'Err';
  console.log('    赋值没有生效，tag 仍是', frozen.tag);
} catch (err) {
  console.log('    赋值被拒绝：', err.message);
}

// 更进一步：把请求状态建模成三选一的和类型。
const Loading = () => Object.freeze({ tag: 'Loading' });
const Success = (data) => Object.freeze({ tag: 'Success', data });
const Failure = (error) => Object.freeze({ tag: 'Failure', error });

// 观察一下：现在"非法状态"根本无法构造出来。
// 因为每个构造函数只接受它那一支需要的字段，你连"同时有 data 和 error"都写不出来。
console.log('  Loading()            →', Loading());
console.log('  Success([1,2])       →', Success([1, 2]));
console.log('  Success([])          →', Success([]), ' ← 空数组也是"成功"，不再被误判！');
console.log('  Failure("超时")      →', Failure('超时'));
console.log('  ★ 注意 Success([]) 和上面的布尔字段版本对比：这里 [] 明确是"成功且有 0 条数据"，');
console.log('    不存在任何歧义 —— 因为"成功"这个信息写在 tag 里，不依赖 data 是否非空。');

console.log('--- 6. 手写 match：按标签分派 ---');

// match 做的事：拿 value.tag 当键，去 handlers 里找对应的处理函数并调用。
// 它相当于把"按状态分支"这件事从 if/else 链里抽出来，变成一个可以复用的工具。
function match(value, handlers) {
  // 先做基本校验，让错用时的报错尽量清晰。
  if (value === null || typeof value !== 'object' || typeof value.tag !== 'string') {
    throw new TypeError('match 需要接收一个带字符串 tag 字段的对象');
  }
  const handler = handlers[value.tag];
  if (typeof handler !== 'function') {
    // 这里就是"穷尽性检查"的运行期版本：漏了分支立刻报错，而不是静默返回 undefined。
    const known = Object.keys(handlers).join(', ');
    throw new Error(`match 缺少对 tag "${value.tag}" 的处理；已提供的处理器有：[${known}]`);
  }
  // 把整个 value 传给处理器，让它自己解构需要的字段。
  return handler(value);
}

const describeState = (state) =>
  match(state, {
    Loading: () => '加载中…',
    Success: ({ data }) => `成功：${data.length} 条`,
    Failure: ({ error }) => `失败：${error}`,
  });

console.log('  ', describeState(Loading()));
console.log('  ', describeState(Success([{ id: 1 }, { id: 2 }])));
console.log('  ', describeState(Success([])), ' ← 空数组依然是成功，歧义消失');
console.log('  ', describeState(Failure('网络超时')));

// 演示"漏了分支"会发生什么 —— 这正是穷尽性检查的价值。
console.log('  故意漏掉 Failure 分支：');
try {
  const incompleteMatch = (state) =>
    match(state, {
      Loading: () => '加载中…',
      Success: ({ data }) => `成功：${data.length} 条`,
      // 故意不写 Failure
    });
  console.log('    ', incompleteMatch(Success([1])), '（这个分支有处理，正常）');
  console.log('    ', incompleteMatch(Failure('超时')));
} catch (err) {
  console.log('    抛出异常：', err.message);
  console.log('    ★ 对比第 4 节的类版本：那里漏了分支只会静默返回 undefined 或兜底字符串，');
  console.log('      这里则在第一时间、带着"缺哪个 tag"的信息报错。');
}

console.log('--- 7. 更完整的穷尽性检查工具 ---');

// 运行期报错还不够早 —— 最好在"定义 handlers 的时候"就检查出来。
// 思路：把"这个和类型有哪些 tag"显式记录下来，然后比对。
const ResultTags = ['Ok', 'Err'];
const RequestTags = ['Loading', 'Success', 'Failure'];

function defineUnion(tags) {
  return {
    tags,
    // 检查 handlers 是否覆盖了全部 tag，并报告缺失与多余的键。
    check(handlers, unionName = 'union') {
      const provided = Object.keys(handlers);
      const missing = tags.filter((t) => !provided.includes(t));
      const extra = provided.filter((p) => !tags.includes(p));
      return { ok: missing.length === 0 && extra.length === 0, missing, extra, unionName };
    },
    // 用检查结果生成一个"安全版" match：定义时就把问题暴露出来。
    match(handlers, unionName) {
      const report = this.check(handlers, unionName);
      if (!report.ok) {
        const parts = [];
        if (report.missing.length) parts.push(`缺少 [${report.missing.join(', ')}]`);
        if (report.extra.length) parts.push(`多出 [${report.extra.join(', ')}]`);
        // 定义阶段就抛错，比运行到某个分支才炸要早得多。
        throw new Error(`和类型 ${unionName} 的处理器不完整：${parts.join('；')}`);
      }
      return (value) => match(value, handlers);
    },
  };
}

const Result = defineUnion(ResultTags);
const safeMatchResult = Result.match(
  {
    Ok: ({ value }) => `✅ ${value}`,
    Err: ({ error }) => `❌ ${error}`,
  },
  'Result',
);
console.log('  完整定义 →', safeMatchResult(Ok('订单已创建')));
console.log('  完整定义 →', safeMatchResult(Err('库存不足')));

console.log('  当处理器写漏一个时：');
try {
  Result.match({ Ok: ({ value }) => value }, 'Result');
} catch (err) {
  console.log('    ', err.message);
}
console.log('  当处理器写多一个（拼错 tag）时：');
try {
  Result.match(
    {
      Ok: () => 'ok',
      Err: () => 'err',
      Oks: () => '拼错的 tag', // 典型的拼写错误
    },
    'Result',
  );
} catch (err) {
  console.log('    ', err.message);
}
console.log('  ★ "多出"检查能抓住拼写错误（Ok vs Oks），这是很多人没想到的收益。');

// 把同一个工具用在请求状态上。
const Request = defineUnion(RequestTags);
const describeRequest = Request.match(
  {
    Loading: () => '⏳ 加载中',
    Success: ({ data }) => `✅ 成功，${data.length} 条`,
    Failure: ({ error }) => `❌ 失败：${error}`,
  },
  'Request',
);
console.log('  换一个和类型，同一个工具照样能用：');
for (const state of [Loading(), Success([]), Failure('超时')]) {
  console.log('    ', describeRequest(state));
}

console.log('--- 8. 真实场景：把"支付结果"建模成和类型 ---');

// 需求：支付接口可能返回三种结果，每种结果带的信息完全不同：
//   Paid    —— 成功，带流水号、实付金额、支付时间
//   Failed  —— 失败，带错误码、错误信息、是否可以重试
//   Pending —— 处理中，带预计完成时间、轮询间隔
// 用和类型建模后，处理逻辑可以写得非常清楚，而且漏了哪种情况会立刻被发现。
const PaidTags = ['Paid', 'Failed', 'Pending'];
const Payment = defineUnion(PaidTags);
const Paid = (tradeNo, amount, paidAt) => Object.freeze({ tag: 'Paid', tradeNo, amount, paidAt });
const Failed = (code, message, retryable) => Object.freeze({ tag: 'Failed', code, message, retryable });
const Pending = (etaSeconds, pollIntervalMs) => Object.freeze({ tag: 'Pending', etaSeconds, pollIntervalMs });

const renderPayment = Payment.match(
  {
    Paid: ({ tradeNo, amount, paidAt }) => `已支付 ${(amount / 100).toFixed(2)} 元，流水号 ${tradeNo}，时间 ${paidAt}`,
    Failed: ({ code, message, retryable }) => `支付失败（${code}）：${message}${retryable ? '，可重试' : '，请更换支付方式'}`,
    Pending: ({ etaSeconds, pollIntervalMs }) => `处理中，预计 ${etaSeconds} 秒内完成，建议每 ${pollIntervalMs}ms 轮询一次`,
  },
  'Payment',
);

const payments = [
  Paid('T20260916001', 19900, '2026-09-16 10:00:03'),
  Failed('BALANCE_NOT_ENOUGH', '余额不足', true),
  Pending(30, 2000),
];
for (const p of payments) {
  console.log('  ', renderPayment(p));
}

// 和类型 + match 的另一个好处：可以放心地做"每个分支各自为政"的逻辑，
// 不需要在函数开头写一堆"先判断是不是 A，再判断是不是 B"的防御性代码。
const needsPolling = (p) => match(p, {
  Paid: () => false,
  Failed: () => false,
  Pending: () => true,
});
console.log('  需要轮询吗？', payments.map((p) => `${p.tag}=${needsPolling(p)}`).join('  '));

console.log('--- 9. 为什么 TypeScript 的 discriminated union 更强 ---');

// TypeScript 里，只要每个成员都有一个字面量类型的 tag 字段，
// 编译器就能在分支里自动把类型"收窄"到那一种，而且能做编译期穷尽性检查。
// 下面这段是 TypeScript 代码，本仓库是纯 JS 项目，所以只作为文本展示，不执行。
const tsSample = `
// ---- TypeScript：编译期穷尽性检查 ----
type Result<T, E> =
  | { readonly tag: 'Ok'; readonly value: T }
  | { readonly tag: 'Err'; readonly error: E };

function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  switch (r.tag) {
    case 'Ok':
      return r.value;        // 这里 r 已被收窄为 { tag: 'Ok'; value: T }
    case 'Err':
      return fallback;       // 这里 r 已被收窄为 { tag: 'Err'; error: E }
    default: {
      // 关键技巧：走到这里 r 的类型是 never（不可能存在），
      // 一旦你将来给 Result 加了第三个成员而忘了在这里处理，
      // 下面这行的类型检查就会失败，编译不过。
      const _exhaustive: never = r;
      return _exhaustive;
    }
  }
}

// 改一下类型定义，加上 Pending 成员：
//   | { readonly tag: 'Pending' }
// 但忘了改 unwrapOr —— 编译立刻报错：
//   Type 'Pending' is not assignable to type 'never'.
// 这就是"编译期穷尽性检查"：错误在写代码时就被抓住，而不是等线上出问题。
`;
console.log(tsSample);
console.log('  和本节手写的运行期检查相比，TS 的差别在于"什么时候发现问题"：');
console.log('    手写 match：运行时才发现漏了分支（但至少不静默）。');
console.log('    TS 联合类型：编码阶段（编译时）就报错，且编辑器能自动补全 tag 名字。');
console.log('    另外 TS 还会在你写 r.valu 时提示"Err 上没有 value 属性"，');
console.log('    因为它知道在当前分支里 r 只能是 Ok —— 这个能力叫"类型收窄"。');
console.log('  这也是为什么"用 { tag } 建模状态"在 TS 项目里几乎是默认做法。');

console.log('--- 10. JavaScript 原生模式匹配的现状（重要，别搞错）---');

console.log('  ★ JavaScript 目前没有原生的模式匹配语法。');
console.log('    可用的近似手段只有：switch + 解构、if/else、以及本节手写的 match 函数。');
console.log('');
console.log('  TC39（制定 JavaScript 标准的委员会）有一个"模式匹配"提案，');
console.log('  大致想法是这样（下面的语法尚未定案，仅作了解，不要在任何项目里使用）：');
console.log('');
console.log('    // ⚠️ 以下为提案草案语法，当前 JavaScript 引擎不认，写了会直接语法错误');
console.log('    match (response) {');
console.log("      when { status: 200, body } if (body.length > 0): body[0],");
console.log('      when { status: 404 }: null,');
console.log("      when { status } if (status >= 500): throw new Error('服务端错误'),");
console.log('      when _: undefined,');
console.log('    }');
console.log('');
console.log('  该提案的现状：长期停留在早期阶段（Stage 1），尚未定案，');
console.log('  语法细节仍可能大幅变动。具体进度请以 TC39 官方提案仓库与 MDN 为准，');
console.log('  不要依据二手资料下结论。');
console.log('');
console.log('  在你现在的项目里，务实的替代方案是：');
console.log('    1) 用 switch + 解构（可行，但需要自己写 default 抛错来做穷尽性检查）；');
console.log('    2) 用本节实现的 defineUnion + match（推荐，检查更完整）；');
console.log('    3) 如果项目用 TypeScript，直接用 discriminated union，让编译器帮你检查；');
console.log('    4) 用 Babel / SWC 插件或编译器把提案语法编译成普通 JS —— 但这会把');
console.log('       项目绑在某个工具链上，升级时要承担语法变更的成本。');

// 用 switch + 解构实现一次，直观对比：能做到分派，但穷尽性检查得自己加。
function describeBySwitch(state) {
  switch (state.tag) {
    case 'Ok':
      return `✅ ${state.value}`;
    case 'Err':
      return `❌ ${state.error}`;
    default:
      // 穷尽性检查：理论上 default 永远不会被执行到。
      // 一旦类型加了新成员而这里没处理，这一行就会在运行时抛出来。
      throw new Error(`未处理的 tag：${state.tag}（这是不该发生的情况）`);
  }
}
console.log('  switch 版 →', describeBySwitch(Ok('完成')), '|', describeBySwitch(Err('失败')));
console.log('  switch 版也能用，缺点是：tag 字符串要手写（拼错不会报错）、');
console.log('  穷尽性检查只能靠一个永远不该被执行的 default 分支兜底。');

console.log('--- 11. 小结 ---');
console.log('  积类型（AND）= 对象 / 元组，组合数是乘积。');
console.log('  和类型（OR）= 带 tag 的对象，组合数是加和，同一时刻只处于一种状态。');
console.log('  用 { tag: "Ok", value } 这种"可辨识字段"来模拟和类型，能消除非法状态。');
console.log('  match(value, handlers) 实现按标签分派；');
console.log('  defineUnion(tags).match(handlers) 加上穷尽性检查，能在定义阶段就发现漏分支和拼写错误。');
console.log('  TypeScript 的 discriminated union 把这一切做到了编译期，是 JS 项目里最实用的替代品。');
console.log('  JavaScript 没有原生模式匹配；TC39 有提案但未定案，不要当成已有语法使用。');
console.log('');
console.log('  至此讲完了"理论线"。回顾一下整条脉络：');
console.log('    01 函子      —— 把 map 抽象出来，值可以在"容器"里被变换而不破坏结构。');
console.log('    02 Maybe     —— 容器多了一种状态："可能没有值"，缺失会自动短路。');
console.log('    03 Either    —— 容器再进一步：失败本身也是一个值，可以带着信息流动。');
console.log('    04 Monad     —— 当变换函数自己也返回容器时，用 chain 拍平。');
console.log('    05 point-free—— 这些抽象在实际项目里如何组织成可复用的管道（以及代价）。');
console.log('    06 ADT       —— 回头看，这些容器其实都是"和类型"，match 就是它的解构工具。');
console.log('');
console.log('  理论之后还有"落地线"（07~10），讲这些概念在真实项目里怎么用：');
console.log('    07 transducer —— 05 留下的性能问题的正解：把 map/filter 合成单个 reducer。');
console.log('    08 IO 与副作用—— 把副作用包成惰性描述，只在最外层执行一次。');
console.log('    09 不可变更新 —— 结构共享让"改一个字段"不必复制整棵树。');
console.log('    10 蹦床       —— JS 没有尾调用优化，深递归要靠蹦床而不是尾递归。');
