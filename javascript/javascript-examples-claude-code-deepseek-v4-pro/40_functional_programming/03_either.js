/**
 * ============================================================================
 * 知识点：Either 函子 —— 把"错误"变成数据，而不是控制流
 * ============================================================================
 *
 * 【所属分类】40_functional_programming —— 函数式编程进阶
 * 【难度等级】高级
 * 【前置知识】40_functional_programming/02_maybe.js、20_error_handling/*（异常机制）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Either 是一类"要么是错误、要么是成功"的容器，有两种状态：
 *      Left(error)  —— 装着"失败的原因"
 *      Right(value) —— 装着"成功的结果"
 *    约定俗成（称为"右偏" right-biased）：map / chain 等操作只作用于 Right，
 *    Left 会自动短路。这和 Maybe 的思路一样，区别只有一个：
 *      Maybe 的失败是"空"，没有信息；
 *      Either 的失败是"一个值"，可以带上错误码、错误信息、出错字段。
 *    Either 的主要方法：
 *      map(fn)         —— Right 时变换值；Left 原样返回
 *      chain(fn)       —— fn 返回的还是 Either 时用它串联（解决嵌套）
 *      fold(onLeft, onRight) —— 出口：两条分支都给你，必须都处理
 *      getOrElse(d)    —— 出口的简化版：Right 取值，Left 返回兜底值
 *
 * 2. 为什么需要
 *    先看清楚 try/catch 到底哪里不舒服：
 *      (1) 抛错是"控制流"不是"值"。一旦 throw，函数就从中间跳走了，
 *          你没法把错误当作普通返回值继续往下传。
 *      (2) try/catch 是"语句块"，不是表达式。它无法嵌进一条 .map().filter() 的链里，
 *          在链条中间想捕获异常，只能把整条链包进 try，粒度很粗。
 *      (3) 错误类型不可见。看函数签名 `function parse(s)` 完全看不出它会失败，
 *          调用方容易漏掉 catch。
 *      (4) 一个 try 块里做好几步，"哪一步失败的、为什么"很难精确区分。
 *    Either 的做法：把失败也做成一个值，让成功和失败走同一条管道，
 *    最后由出口处统一处理。于是：
 *      - 函数签名变成 `parse(s): Either<Error, Data>`，会不会失败一目了然；
 *      - 链条可以一路往下写，不用在中间插 try；
 *      - 错误信息可以一路携带，不会被层层丢弃。
 *
 * 3. 核心语法要点
 *    (1) Left 的 map / chain 必须原样返回 this，绝不执行回调 —— 短路的核心。
 *    (2) 用 chain（而不是 map）来串联"本身就可能失败"的下一步操作。
 *    (3) 出口用 fold(onLeft, onRight) —— 强制你同时写成功和失败两条路。
 *    (4) Either.try(fn) 是把"会抛异常的普通函数"接进 Either 世界的桥。
 *    (5) Either 依然是函子：identity 与组合律在 Left 和 Right 上都成立。
 *
 * 4. 常见陷阱
 *    - 把 Left / Right 的语义搞反。记住：Right 是"正确"，Left 是"剩下那个（错误）"。
 *    - 在 map 里做会抛异常的事，然后以为 Either 会接住 —— 不会！
 *      回调里的异常照样往外冒，想接住必须用 Either.try 包一层。
 *    - 该用 chain 时用了 map，于是得到 Right(Right(x)) 的嵌套（见 04_monad.js）。
 *    - Left 里塞的东西类型不统一（一会儿是字符串、一会儿是 Error、一会儿是对象），
 *      出口处理时会很难写。建议项目里约定一种错误形状。
 *    - 默认是"快速失败"：第一个错误就短路。如果你需要"一次收集全部错误"，
 *      Either 本身做不到，那要另一个类型（Validation / 带累积的 Applicative）。
 *    - 不要所有代码都改成 Either。和外部库 / 框架交互的边界上，try/catch 才是对的。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 40_functional_programming/03_either.js
 *
 * 【预期输出】
 *   先用一个多步数据转换展示 try/catch 的别扭之处，再实现 Left / Right，
 *   演示 map 的右偏、chain 的串联、fold 的出口，最后用一条表单校验链收尾。
 * ============================================================================
 */

console.log('--- 1. 先看痛点：try/catch 打断链式调用 ---');

// 场景：把后端返回的一串"文本形式的金额"转成可计算的数字。
// 中间有三步，每一步都可能失败：
//   1) JSON.parse —— 文本可能不是合法 JSON
//   2) 校验字段    —— 可能没有 amount 字段，或不是数字
//   3) 单位换算    —— 金额可能是负数或超出上限
//
// 朴素做法：整条流程用 try/catch 包起来，有问题就 throw。
function parseAmountNaive(text) {
  const parsed = JSON.parse(text); // 可能抛 SyntaxError
  if (parsed.amount === undefined) {
    throw new Error('缺少 amount 字段');
  }
  if (typeof parsed.amount !== 'number') {
    throw new TypeError('amount 必须是非负数');
  }
  if (parsed.amount < 0) {
    throw new RangeError('amount 不能为负数');
  }
  return parsed.amount / 100;
}

const amountInputs = ['{"amount": 1990}', '{"amount": -1}', '{"price": 10}', '不是 JSON', '{"amount": 8888}'];
for (const input of amountInputs) {
  try {
    console.log(`  ${input.padEnd(20)} →`, parseAmountNaive(input));
  } catch (err) {
    console.log(`  ${input.padEnd(20)} → 抛错：${err.constructor.name} - ${err.message}`);
  }
}
console.log('  这写法能跑，但请体会这几点不舒服：');
console.log('    1) 调用方必须记得写 try，忘了就崩；函数签名也看不出它会失败。');
console.log('    2) 三步检查靠"提前 return 不成立就 throw"，逻辑是"跳出去"的。');
console.log('    3) 想把这段接进一条 .map().filter() 的数据管道？做不到，');
console.log('       你只能把整条管道都塞进 try 块，粒度变得很粗。');
console.log('    4) 错误类型（Error/TypeError/RangeError）只能靠 catch 时再猜，');
console.log('       想把"错误码"当作数据返回给前端，还得再转换一次。');

console.log('--- 2. 朴素解法：返回一个"约定形状"的对象 ---');

// 不想抛异常，那就返回一个带标志位的对象。这是很多项目的实际做法。
function parseAmountPlain(text) {
  try {
    const parsed = JSON.parse(text);
    if (parsed.amount === undefined) return { ok: false, error: '缺少 amount 字段' };
    if (typeof parsed.amount !== 'number') return { ok: false, error: 'amount 必须是数字' };
    if (parsed.amount < 0) return { ok: false, error: 'amount 不能为负数' };
    return { ok: true, value: parsed.amount / 100 };
  } catch (err) {
    return { ok: false, error: `不是合法 JSON：${err.message}` };
  }
}
console.log('  ', parseAmountPlain('{"amount": 1990}'));
console.log('  ', parseAmountPlain('{"amount": -1}'));
console.log('  这已经比抛错好了：错误成了数据，可以返回、可以存日志、可以传给前端。');
console.log('  但它还缺一样东西：没法"顺着往下接"。因为下一步必须知道上一步的 ok 是 true 还是 false，');
console.log('  于是你又会在每个调用点写 if (r.ok) { ... } else { ... }，样板代码回来了。');
console.log('  → 我们需要的是：既能携带错误，又能像函子一样 chainable 的容器。');

console.log('--- 3. 引出抽象：Either 函子 ---');

// 先定义"失败"的容器。
class Left {
  constructor(error) {
    this.error = error;
    this.isLeft = true; // 用标签让外部能判断分支
    this.isRight = false;
  }

  // map：Left 表示"这一步没成功"，所以变换回调根本不该执行，原样返回自己。
  map() {
    return this;
  }

  // chain：同理，短路。注意 chain 存在的原因见第 5 节。
  chain() {
    return this;
  }

  // fold：出口。把两条分支的处理器都传进来，Left 走第一个。
  fold(onLeft) {
    return onLeft(this.error);
  }

  // 出口的简化版：Left 返回兜底值。
  getOrElse(fallback) {
    return typeof fallback === 'function' ? fallback(this.error) : fallback;
  }

  toString() {
    // Error 直接取 message 更好读；普通对象用 JSON 显示，避免打印出 [object Object]。
    const shown = this.error instanceof Error ? `${this.error.name}: ${this.error.message}` : this.error;
    return `Left(${typeof shown === 'string' ? shown : JSON.stringify(shown)})`;
  }
}

// 再定义"成功"的容器。
class Right {
  constructor(value) {
    this.value = value;
    this.isLeft = false;
    this.isRight = true;
  }

  // map：值是存在的，放心应用函数，再装回新的 Right。
  map(fn) {
    return new Right(fn(this.value));
  }

  // chain：fn 的返回值必须已经是 Either（通常是 Right 或 Left）。
  // 它和 map 的区别是"不额外包一层"，所以能避免 Either 套 Either（见 04_monad.js）。
  chain(fn) {
    return fn(this.value);
  }

  fold(onLeft, onRight) {
    return onRight(this.value);
  }

  getOrElse() {
    return this.value;
  }

  toString() {
    return `Right(${JSON.stringify(this.value)})`;
  }
}

// Either 命名空间：进出这个世界的门。
const Either = {
  left: (error) => new Left(error),
  right: (value) => new Right(value),
  // of 就是 right —— 函子的标准入口。
  of: (value) => new Right(value),
  // try：把"会抛异常的普通函数"接进 Either 世界的关键桥梁。
  // 注意 fn 是"惰性"的：传函数而不是传结果，这样异常才能在这里被接住。
  try: (fn) => {
    try {
      return new Right(fn());
    } catch (err) {
      return new Left(err);
    }
  },
};

console.log('  Either.right(1) →', Either.right(1).toString());
console.log('  Either.left("出错了") →', Either.left('出错了').toString());
console.log('  Either.try(() => JSON.parse("{}")) →', Either.try(() => JSON.parse('{}')).toString());
console.log('  Either.try(() => JSON.parse("坏数据")) →', Either.try(() => JSON.parse('坏数据')).toString());
console.log('  注意最后一行：异常被接住了，变成了一个装着 Error 的 Left，而不是让进程崩掉。');

console.log('--- 4. 右偏：map 只作用于 Right ---');

const double = (x) => x * 2;
console.log('  Right(21).map(double) →', Either.right(21).map(double).toString());
console.log('  Left("boom").map(double) →', Either.left('boom').map(double).toString(), ' ← 回调没执行，值原样传下去');

// 长链上的短路：一旦出现 Left，后面所有 map 全部跳过。
const chainRight = Either.right(10).map((x) => x + 5).map(double);
const chainLeft = Either.left('开头就失败了').map((x) => x + 5).map(double);
console.log('  Right 链 →', chainRight.toString());
console.log('  Left 链  →', chainLeft.toString(), ' ← 两次 map 都被跳过，值一路原样传到最后');

// 更贴近现实：从 Right 变成 Left 的典型方式是 chain 一个校验函数。
const mustBePositive = (n) => (n > 0 ? Either.right(n) : Either.left(`${n} 不是正数`));
console.log('  Right(5).chain(校验) →', Either.right(5).chain(mustBePositive).toString());
console.log('  Right(-5).chain(校验) →', Either.right(-5).chain(mustBePositive).toString());
console.log('  Right(5).chain(校验).map(double) →', Either.right(5).chain(mustBePositive).map(double).toString());
console.log('  Right(-5).chain(校验).map(double) →', Either.right(-5).chain(mustBePositive).map(double).toString(), ' ← 后面那个 map 被跳过');

console.log('--- 5. chain：串联"自己也可能失败"的操作 ---');

// 这是 Either 最实用的能力。
// 如果我们想知道"哪一步失败"，每一步都应该返回 Either（而不是在里面 throw），
// 然后用 chain 把它们串起来 —— 任何一步返回 Left，整条链立刻停在那一句。
//
//   step1: 文本 → Either<错误, 对象>     （JSON.parse 可能失败）
//   step2: 对象 → Either<错误, 数字>     （字段校验可能失败）
//   step3: 数字 → Either<错误, 数字>     （单位换算 + 范围校验可能失败）
//   step4: 数字 → Right<字符串>          （纯格式化，不可能失败，用 map 就够了）
//
// 每一步都是一个"普通的一元函数"，可以单独测试、单独复用。

// step1：把文本解析成对象。用 Either.try 兜住 JSON.parse 的异常。
const stepParse = (text) => Either.try(() => JSON.parse(text));

// step2：从对象里取 amount 字段。
const stepExtract = (obj) =>
  typeof obj?.amount === 'number'
    ? Either.right(obj.amount)
    : Either.left(`缺少数字类型的 amount 字段（实际拿到 ${JSON.stringify(obj?.amount)}）`);

// step3：换算成"元"，并校验范围（分 → 元）。
const stepToYuan = (cents) =>
  cents < 0 ? Either.left('金额不能为负数') : Either.right(cents / 100);

// step4：纯格式化，不会失败，所以用 map 而不是 chain。
const formatYuan = (yuan) => `￥${yuan.toFixed(2)}`;

// 串联：注意这里用的是 chain 而不是 map。
const parseAndFormat = (text) =>
  stepParse(text)
    .chain(stepExtract)
    .chain(stepToYuan)
    .map(formatYuan);

for (const input of amountInputs) {
  console.log(`  ${input.padEnd(20)} →`, parseAndFormat(input).toString());
}
console.log('  请对比第 1 节的 try/catch 版本：');
console.log('    · 每个错误点上都有明确的、可读的错误信息，且能精确定位是第几步。');
console.log('    · 函数签名 parseAndFormat(text) 现在明确返回 Either —— 失败是可见的。');
console.log('    · 每一步（stepParse / stepExtract / stepToYuan）都可以单独测试。');
console.log('    · 全程没有一次 throw，也没有一次 try/catch，但也没有崩溃风险。');

console.log('--- 6. fold：唯一正确的出口 ---');

// fold(onLeft, onRight)：必须同时提供两条分支的处理函数。
// 好处是编译器/代码审查都无法"忘记处理失败"。
const renderResult = (result) =>
  result.fold(
    (error) => `❌ 失败：${error instanceof Error ? error.message : error}`,
    (value) => `✅ 成功：${value}`,
  );

console.log(' ', renderResult(parseAndFormat('{"amount": 1990}')));
console.log(' ', renderResult(parseAndFormat('{"amount": -1}')));
console.log(' ', renderResult(parseAndFormat('不是 JSON')));
console.log('  对比 getOrElse：它只给成功路径，失败时你只能拿到一个兜底值，');
console.log('  错误信息在这一步被丢掉了。想要错误 → 用 fold；只想要默认值 → 用 getOrElse。');
console.log('  ', parseAndFormat('不是 JSON').getOrElse('（无）'));

console.log('--- 7. try/catch 与 Either 的正面比较 ---');

// 用同一件事做两遍：把 "1990" 这样的"分"字符串安全地转成 "￥19.90"。
// 版本 A：try/catch。注意它是"语句"，只能在链条外面包着。
function formatCentsWithTryCatch(text) {
  try {
    const n = Number(text);
    if (Number.isNaN(n)) throw new TypeError('不是数字');
    if (n < 0) throw new RangeError('不能为负');
    return { ok: true, value: `￥${(n / 100).toFixed(2)}` };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
// 版本 B：Either。每一步都是一个可以放进管道里的值。
const toNumber = (text) => Either.try(() => {
  const n = Number(text);
  if (Number.isNaN(n)) throw new TypeError(`不是数字：${text}`);
  return n;
});
const checkNonNegative = (n) => (n < 0 ? Either.left(`不能为负：${n}`) : Either.right(n));
const formatCentsWithEither = (text) =>
  toNumber(text).chain(checkNonNegative).map((n) => `￥${(n / 100).toFixed(2)}`);

for (const text of ['1990', 'abc', '-500']) {
  console.log(`  "${text}" `.padEnd(10) + ' try/catch →', formatCentsWithTryCatch(text));
  console.log(`  "${text}" `.padEnd(10) + ' Either    →', formatCentsWithEither(text).toString());
}
console.log('  对照表：');
console.log('    ┌──────────────┬──────────────────────────┬──────────────────────────────┐');
console.log('    │              │ try / catch              │ Either                       │');
console.log('    ├──────────────┼──────────────────────────┼──────────────────────────────┤');
console.log('    │ 本质         │ 控制流（跳转）            │ 值（可传递的数据）             │');
console.log('    │ 在链条中的位置│ 只能包在最外层，粒度粗     │ 每一步都能开关，粒度细          │');
console.log('    │ 失败是否可见  │ 否，看签名看不出来        │ 是，返回值类型就是 Either       │');
console.log('    │ 能否继续加工  │ 不能，catch 里只能收尾     │ 能，Left 也能被 map/chain 传递  │');
console.log('    │ 错误信息      │ 容易被层层丢弃或包装       │ 一路携带，直到出口             │');
console.log('    │ 多个失败      │ 第一个就中断              │ 同样默认快速失败（见下）        │');
console.log('    └──────────────┴──────────────────────────┴──────────────────────────────┘');
console.log('  结论：不是"Either 取代 try/catch"，而是分工不同：');
console.log('    在系统边界（读文件、调外部库、JSON.parse）用 try/catch 或 Either.try 接住；');
console.log('    在业务逻辑内部，用 Either 让失败作为值沿管道流动。');

console.log('--- 8. 真实场景：表单校验链 ---');

// 表单校验是最典型的场景：多个字段、多个规则，可能一次只报第一个错，
// 也可能需要把错误信息原封不动地回传给前端。
// 下面用 Either 写一条"注册表单"的校验链，并按顺序快速失败。

const users = [
  { email: 'alice@example.com', password: 'Str0ngPass', age: 28 },
  { email: 'bob', password: 'Str0ngPass', age: 28 },          // 邮箱不合法
  { email: 'carol@example.com', password: '123', age: 28 },   // 密码太弱
  { email: 'dave@example.com', password: 'Str0ngPass', age: 15 }, // 年龄不够
];

// 每个校验器都是 (值) => Either，可以任意组合、单独测试。
const checkEmailFormat = (form) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email ?? '')
    ? Either.right(form)
    : Either.left({ field: 'email', message: '邮箱格式不正确' });

const checkPasswordStrength = (form) =>
  (form.password ?? '').length >= 8 && /[A-Z]/.test(form.password ?? '') && /[0-9]/.test(form.password ?? '')
    ? Either.right(form)
    : Either.left({ field: 'password', message: '密码至少 8 位，且需含大写字母和数字' });

const checkAge = (form) =>
  typeof form.age === 'number' && form.age >= 18
    ? Either.right(form)
    : Either.left({ field: 'age', message: '年龄需满 18 岁' });

// 串联：注意每个校验器都接收整个 form 并返回 form，所以可以一直 chain 下去。
const validateForm = (form) =>
  checkEmailFormat(form)
    .chain(checkPasswordStrength)
    .chain(checkAge);

// 出口：把 Left 里的错误对象渲染成给前端看的字符串。
const renderValidation = (result) =>
  result.fold(
    (err) => `❌ ${err.field}：${err.message}`,
    (form) => `✅ 注册通过：${form.email}（${form.age} 岁）`,
  );

for (const form of users) {
  console.log(' ', renderValidation(validateForm(form)));
}

// 校验通过之后，接着做"多步数据转换"——链条可以无缝延长。
const toUserRecord = (form) => Either.right({
  id: form.email.split('@')[0],
  displayName: form.email.split('@')[0].toUpperCase(),
  isAdult: form.age >= 18,
});
const registerUser = (form) => validateForm(form).chain(toUserRecord);
console.log('  接上后续转换 →', registerUser(users[0]).toString());
console.log('  失败时后续转换被跳过 →', registerUser(users[3]).toString());

console.log('  诚实地说一个局限：上面是"快速失败"，只报第一个错误。');
console.log('  真实表单往往需要"一次把所有字段的错误都列出来"，');
console.log('  那需要另一种会累积错误的类型（常见叫 Validation，或叫"累积式 Applicative"），');
console.log('  Either 本身做不到 —— 因为它一遇到 Left 就短路了。');
console.log('  折中办法：把校验器逐个跑完，用数组收集所有 Left（这就退回命令式了，但更实用）。');
const collectErrors = (form) => {
  const checks = [checkEmailFormat, checkPasswordStrength, checkAge];
  const errors = [];
  let last = Either.right(form);
  for (const check of checks) {
    const r = check(form);
    if (r.isLeft) errors.push(r.error);
    else last = r;
  }
  return errors.length ? Either.left(errors) : last;
};
console.log('  累积错误版（第 2 个用户）→', JSON.stringify(collectErrors(users[1]).fold((e) => e, (v) => v)));

console.log('--- 9. 常见陷阱逐条验证 ---');

// 陷阱一：以为 Either 能接住 map 回调里的异常 —— 接不住！
console.log('  陷阱一：map 回调里抛错会怎样？');
try {
  Either.right(1).map(() => {
    throw new Error('回调里的异常');
  });
  console.log('    （没抛错）');
} catch (err) {
  console.log('    抛出来了：', err.message, '← Either 不管回调内部的异常，得用 Either.try 包住。');
}
// 正确写法：把可能抛错的计算放进 Either.try。
console.log('    改用 Either.try 包住 →', Either.try(() => {
  throw new Error('回调里的异常');
}).toString());

// 陷阱二：Left 里塞的东西类型不统一。
const messyLeft = [
  Either.left('字符串错误'),
  Either.left(new Error('Error 对象')),
  Either.left({ code: 500, message: '对象错误' }),
];
console.log('  陷阱二：Left 可以装任何东西，但下游处理会很痛：');
for (const l of messyLeft) {
  console.log('    ', l.toString(), '→ 想统一显示，得写一堆 instanceof / typeof 判断');
}
console.log('    建议：项目里约定一种错误形状，比如 { code, message, field }。');

// 陷阱三：Left/Right 语义搞反。
console.log('  陷阱三：记住 Right 是"对/成功"，Left 是"错/失败"。');
console.log('    助记：right = correct（正确）里都有 r；left 就是"剩下的那个"。');

// 陷阱四：想从 Left 里"恢复"怎么办？
// Either 不给"恢复"方法，因为恢复意味着你要处理错误。用 fold 或 chain 显式处理。
const recover = (result) => result.fold(
  () => Either.right(0), // 失败时用 0 继续
  (v) => Either.right(v),
);
console.log('  陷阱四：从 Left 恢复 →', recover(Either.left('boom')).toString(), '（显式写出恢复逻辑，不藏着）');

console.log('--- 10. 小结 ---');
console.log('  Either = Left(错误) | Right(成功)，是函子（map 右偏）。');
console.log('  chain 用来串联"下一步也可能失败"的操作，避免 Either 套 Either。');
console.log('  fold(onLeft, onRight) 是出口，强制两条分支都处理。');
console.log('  Either.try 是"会抛异常的代码"接入 Either 世界的桥。');
console.log('  与 try/catch 的关系是分工：边界处接住异常，业务内部让失败作为值流动。');
console.log('  Either 天生"快速失败"；需要累积全部错误时，要换用 Validation 类思路。');
console.log('  下一步（04_monad.js）：把 map 与 chain 的关系讲透，');
console.log('  并说明为什么"有 of 和 chain 且满足三条定律"的东西就叫单子。');
