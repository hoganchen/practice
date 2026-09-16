/**
 * ============================================================================
 * 知识点：Monad（单子）—— chain/flatMap 与单子三定律
 * ============================================================================
 *
 * 【所属分类】40_functional_programming —— 函数式编程进阶
 * 【难度等级】高级
 * 【前置知识】40_functional_programming/01_functor.js、02_maybe.js、03_either.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Monad（单子）不是什么魔法，它就是一个满足下面三个条件的对象（容器）：
 *      (1) 有一个 of 方法：把普通值装进容器 —— M.of(x)
 *      (2) 有一个 chain 方法（也叫 flatMap / bind / >>=）：
 *          接收一个"返回同类型容器"的函数，返回容器（而不是容器的容器）
 *      (3) 满足三条定律：左单位律、右单位律、结合律
 *    一句话概括：Monad = 函子（有 map）+ 能把嵌套的容器拍平（有 chain）。
 *
 * 2. 为什么需要
 *    函子的 map 有一条硬限制：回调必须返回"普通值"。
 *    可现实中，很多函数的返回值天然就是容器：
 *      getUserById(id)  → Maybe<User>   （用户可能不存在）
 *      getAddress(user) → Maybe<Address>（地址可能没填）
 *    这时用 map 就会出事：
 *      Maybe.of(user).map(getAddress)  →  Maybe(Maybe(Address))   ← 套了两层
 *    每多一层 map 就多套一层，取值时要 fold 两次、三次……完全没法用。
 *    我们真正想要的是"如果这层有值，就用回调返回的容器替换掉这层"，
 *    而不是"把回调的返回值再装一层"。这个操作就是 chain（拍平 + 变换）。
 *
 * 3. 核心语法要点
 *    (1) chain 的等价定义：chain(f) === map(f) 之后再 join（join 就是"拍平一层"）。
 *    (2) 各语言/库里的同一个东西的不同名字：
 *           chain / flatMap / bind / then / andThen / >>= / SelectMany
 *        看到这些名字，想到的都是"容器里的值 → 返回容器的函数 → 拍平"。
 *    (3) 单子三定律（f、g 都是"返回容器的函数"）：
 *          左单位律：M.of(a).chain(f)        ≡ f(a)
 *          右单位律：m.chain(M.of)           ≡ m
 *          结合律：  m.chain(f).chain(g)     ≡ m.chain(x => f(x).chain(g))
 *        白话理解：of 是"什么都不做的包装"，chain 的顺序可以任意结合 ——
 *        和加法里 a+0=a、0+a=a、(a+b)+c=a+(b+c) 是同一类性质。
 *    (4) 定律的实际价值：它们保证"反复重构不会改变行为"，也是
 *        async/await（本质是 do 记法）能安全脱糖成 .then 链的依据。
 *    (5) Promise 就是 Monad：Promise.resolve 是 of，p.then(f) 就是 chain，
 *        而且 then 会自动拍平 —— 回调返回 Promise 时不会得到"Promise 套 Promise"。
 *
 * 4. 常见陷阱
 *    - 该 chain 时用了 map，得到两层嵌套，然后在出口处手动多 fold 几次。
 *    - 该 map 时用了 chain，回调返回了普通值，于是整个容器结构塌掉（Promise 里表现为
 *      拿到一个非 Promise 的值，链路就"断"了）。
 *    - 以为 Promise 的 then 是 map：其实它两者都干 —— 回调返回 Promise 就拍平（chain），
 *      返回普通值就包装（map）。这种"自动判断"是 Promise 特有的便利，不是通例。
 *    - 忘记 Promise 的 of 是 Promise.resolve，而不是 new Promise(executor)。
 *      new Promise() 不能用来把普通值装箱（里面没有 resolve 就永远 pending）。
 *    - 以为 monad 能让异步变同步。它只是让"容器套容器"能被优雅地串联，
 *      不改变任何时序。
 *    - 过度抽象：只有一两次嵌套时，直接 if 判断更好读。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 40_functional_programming/04_monad.js
 *
 * 【预期输出】
 *   先复现"map 导致容器套容器"的问题，再用 chain 解决；
 *   用代码逐条验证单子三定律（对 Maybe、Either、Promise 都验一遍）；
 *   最后说明 async/await 与 then 链的等价关系。
 * ============================================================================
 */

console.log('--- 1. 问题重现：map 撞上"返回容器的函数" ---');

// 最小复现：Box 的 map，回调返回的本身就是一个 Box。
// （这里用一个极简的 Box，避免和 01 节的完整实现混在一起。）
class Box {
  constructor(value) {
    this._value = value;
  }
  static of(value) {
    return new Box(value);
  }
  map(fn) {
    return new Box(fn(this._value));
  }
  // chain：接收"返回容器"的函数，直接返回它，因此不会多包一层。
  chain(fn) {
    return fn(this._value);
  }
  // join：把"盒子套盒子"拍平成一层。这是引出 chain 的关键算子。
  join() {
    return this._value; // 前提：里面装的确实还是同类型容器
  }
  fold(fn) {
    return fn(this._value);
  }
  inspect() {
    return `Box(${this._value instanceof Box ? this._value.inspect() : JSON.stringify(this._value)})`;
  }
}

const nested = Box.of(3).map((x) => Box.of(x + 1));
console.log('  Box.of(3).map(x => Box.of(x + 1)) →', nested.inspect());
console.log('  想拿到里面的数字，只能一层层 fold：', nested.fold((inner) => inner.fold((v) => v)));
console.log('  如果链上有三步都返回容器，就会是 Box(Box(Box(...)))，这是不可接受的。');

// 换成真实场景，问题更明显：用户 → 地址 → 城市，每一步都可能"查不到"。
// 这两个函数的返回值本身就是容器（Maybe），而不是普通值。
// 下面用最小版 Maybe（02_maybe.js 讲过，这里加上 chain）。
const Nothing = {
  isNothing: true,
  isJust: false,
  map() {
    return this;
  },
  chain() {
    return this; // Nothing 短路：回调不执行
  },
  getOrElse(fallback) {
    return typeof fallback === 'function' ? fallback() : fallback;
  },
  toString() {
    return 'Nothing';
  },
};
class Just {
  constructor(value) {
    this._value = value;
    this.isNothing = false;
    this.isJust = true;
  }
  map(fn) {
    return new Just(fn(this._value));
  }
  // chain = map + 拍平。回调返回的已经是 Maybe，直接返回它，不再多包一层。
  chain(fn) {
    return fn(this._value);
  }
  getOrElse() {
    return this._value;
  }
  toString() {
    return `Just(${JSON.stringify(this._value)})`;
  }
}
const Maybe = {
  of: (v) => new Just(v),
  fromNullable: (v) => (v === null || v === undefined ? Nothing : new Just(v)),
};

// 模拟一张"用户 → 地址"的查询表，查不到就返回 Nothing。
const addressBook = {
  alice: { city: ' 杭州 ', zip: '310000' },
  bob: null, // Bob 存在，但没填地址
};
const getUser = (name) => Maybe.fromNullable(addressBook[name]); // 可能查不到
const getCity = (addr) => Maybe.fromNullable(addr?.city); // 地址里可能没城市

// 错误示范：用 map 串联这两个"返回 Maybe 的函数"，一步一步看清楚发生了什么。
console.log('  用 map 串联 Maybe.of("alice").map(getUser).map(getCity)，分步拆开看：');
const stepA = Maybe.of('alice');
const stepB = stepA.map(getUser); // getUser 返回 Just(...)，被 map 又包了一层
const stepC = stepB.map(getCity); // 灾难发生在这里
console.log('    第 0 步 Maybe.of("alice")     →', stepA.toString());
console.log('    第 1 步 .map(getUser)         →', `Just(Just(${JSON.stringify(addressBook.alice)}))`, ' ← 容器套容器');
console.log('    第 2 步 .map(getCity)         →', stepC.toString());
console.log('    ★ 为什么第 2 步结果这么怪？因为 map 只拆一层：');
console.log('      getCity 收到的是"内层的 Just 对象"，而不是地址对象 {city, zip}。');
console.log('      Just 对象身上没有 city 属性，于是查询失败返回 Nothing，');
console.log('      再被外层 map 包一层，就成了 Just(Nothing) —— 既套娃，数据还丢了。');

// 另一个更隐蔽的后果：短路失效。
// "Bob 存在但没填地址"，我们希望整条链变成 Nothing；但在 map 版本里，外层永远是 Just。
const bobWithMap = Maybe.of('bob').map(getUser).map(getCity);
console.log('    Bob（地址为 null）：用 map →', bobWithMap.toString(), ' ← 外层仍是 Just，短路根本没发生');

// 正确示范：用 chain 串联。每一步返回的都是 Maybe，chain 会"拍平"。
const right = Maybe.of('alice').chain(getUser).chain(getCity);
console.log('  改用 chain 串联：Maybe.of("alice").chain(getUser).chain(getCity) →', right.toString());
console.log('    Bob 的地址是 null：', Maybe.of('bob').chain(getUser).chain(getCity).toString(), ' ← 正确短路');
console.log('    陌生人：', Maybe.of('zoe').chain(getUser).chain(getCity).toString(), ' ← 也短路');
console.log('  一句话总结：回调返回的是普通值 → 用 map；回调返回的是同类型容器 → 用 chain。');

console.log('--- 2. chain 的本质：map + join ---');

// 前面提过 chain(f) 等价于 map(f) 之后再 join。代码验证一下：
// （Box 的场景里回调返回 Box，拍照即可）
const viaMapJoin = Box.of(3).map((x) => Box.of(x + 1)).join();
const viaChain = Box.of(3).chain((x) => Box.of(x + 1));
console.log('  map 后 join →', viaMapJoin.inspect());
console.log('  chain 一步到位 →', viaChain.inspect());
console.log('  两者结果一致吗？', viaMapJoin.inspect() === viaChain.inspect());
console.log('  记住这个等价关系：chain(f) === join(map(f))。');
console.log('  很多函数式库里的 flatMap，就是"map + flatten"的缩写，说的是同一件事。');

console.log('  再确认一次：Box.of(3).chain(x => Box.of(x + 1)) →', viaChain.inspect(), '（只有一层）');

console.log('--- 3. 各语言里同一个东西的不同名字 ---');

const nameTable = [
  ['chain', 'fantasy-land / Ramda / 本文档写法'],
  ['flatMap', 'Scala、Rust(Result 的 and_then 之外还有 flat_map)、Java Stream、Kotlin'],
  ['bind', 'Haskell 的 >>= 读作 bind；C# 的 SelectMany 也是它'],
  ['then', 'JavaScript 的 Promise'],
  ['andThen', 'Rust 的 Result / Option；Java 的 Optional.flatMap'],
  ['>>=', 'Haskell 运算符形式'],
];
console.log('  看见这些名字，都指向同一件事：容器里的值 → 返回容器的函数 → 拍平。');
for (const [name, where] of nameTable) {
  console.log(`    ${name.padEnd(10)} ${where}`);
}
console.log('  我们这里统一叫 chain，因为它是 fantasy-land 规范里的名字（JS 生态约定）。');

console.log('--- 4. 单子定律总览 ---');

// 三条定律，用 f、g 表示"返回容器的函数"：
//   左单位律：M.of(a).chain(f)      ≡ f(a)
//   右单位律：m.chain(M.of)         ≡ m
//   结合律：  m.chain(f).chain(g)   ≡ m.chain(x => f(x).chain(g))
//
// 直观理解：
//   左单位律 = "of 不会多做事"：先用 of 装进去再 chain，等于直接调用 f。
//   右单位律 = "of 不会少做事"：用 of 收尾，等于什么都没做。
//   结合律   = "chain 可以随便分组"：分两步写和嵌套写结果一样。
//
// 这三条和下面的算术性质是一一对应的：
//   0 + a = a（左单位），a + 0 = a（右单位），(a+b)+c = a+(b+c)（结合）
// 也就是说：of 扮演"加法里的 0"（单位元），chain 扮演"加法"。

console.log('--- 5. 逐条验证：Maybe 满足三定律 ---');

// 比较两个 Maybe 是否"等价"（比较标签和内部值）。
const eqMaybe = (a, b) => a.toString() === b.toString();

// 准备几个"返回 Maybe 的函数"。
const halfIfEven = (n) => (n % 2 === 0 ? Maybe.of(n / 2) : Nothing);
const toPositive = (n) => (n > 0 ? Maybe.of(n) : Nothing);

// 定律 1：左单位律  M.of(a).chain(f) ≡ f(a)
const law1Samples = [4, 5, 8];
let law1Ok = true;
for (const a of law1Samples) {
  const lhs = Maybe.of(a).chain(halfIfEven);
  const rhs = halfIfEven(a);
  const ok = eqMaybe(lhs, rhs);
  law1Ok = law1Ok && ok;
  console.log(`  左单位律 · a=${a}  M.of(a).chain(f) → ${lhs}   f(a) → ${rhs}   相等 ${ok}`);
}
console.log('  左单位律成立吗？', law1Ok);

// 定律 2：右单位律  m.chain(M.of) ≡ m
const law2Samples = [Maybe.of(7), Nothing];
let law2Ok = true;
for (const m of law2Samples) {
  const lhs = m.chain(Maybe.of);
  const ok = eqMaybe(lhs, m);
  law2Ok = law2Ok && ok;
  console.log(`  右单位律 · m=${m}  m.chain(of) → ${lhs}   m → ${m}   相等 ${ok}`);
}
console.log('  右单位律成立吗？', law2Ok);

// 定律 3：结合律  m.chain(f).chain(g) ≡ m.chain(x => f(x).chain(g))
const law3Samples = [8, 7, 16];
let law3Ok = true;
for (const a of law3Samples) {
  const m = Maybe.of(a);
  const lhs = m.chain(halfIfEven).chain(toPositive);
  const rhs = m.chain((x) => halfIfEven(x).chain(toPositive));
  const ok = eqMaybe(lhs, rhs);
  law3Ok = law3Ok && ok;
  console.log(`  结合律 · a=${a}  分两步 → ${lhs}   嵌套写 → ${rhs}   相等 ${ok}`);
}
console.log('  结合律成立吗？', law3Ok);
console.log('  注意 a=7 的情况（奇数被短路成 Nothing）：定律在"失败路径"上同样成立，');
console.log('  这很重要 —— 定律必须对容器的所有状态都成立，而不只是成功的那条路。');

console.log('--- 6. 逐条验证：Either 也满足三定律 ---');

// 复用 03_either.js 的极简版：Left / Right + chain。
class ELeft {
  constructor(error) {
    this.error = error;
    this.isLeft = true;
  }
  map() {
    return this;
  }
  chain() {
    return this;
  }
  getOrElse(f) {
    return typeof f === 'function' ? f(this.error) : f;
  }
  toString() {
    return `Left(${this.error})`;
  }
}
class ERight {
  constructor(value) {
    this.value = value;
    this.isLeft = false;
  }
  map(fn) {
    return new ERight(fn(this.value));
  }
  chain(fn) {
    return fn(this.value);
  }
  getOrElse() {
    return this.value;
  }
  toString() {
    return `Right(${JSON.stringify(this.value)})`;
  }
}
const E = {
  of: (v) => new ERight(v),
  right: (v) => new ERight(v),
  left: (e) => new ELeft(e),
};

const eqEither = (a, b) => a.toString() === b.toString();

// 两个"返回 Either 的函数"：先确保是数字，再确保非负。
const ensureNumber = (x) =>
  typeof x === 'number' && !Number.isNaN(x) ? E.right(x) : E.left(`不是数字：${JSON.stringify(x)}`);
const ensureNonNegative = (n) => (n >= 0 ? E.right(n) : E.left(`${n} 是负数`));

const eitherSamples = [5, -5, 'abc'];
let eLaw1 = true;
let eLaw2 = true;
let eLaw3 = true;
for (const a of eitherSamples) {
  // 左单位律
  const l1ok = eqEither(E.of(a).chain(ensureNumber), ensureNumber(a));
  // 右单位律
  const l2ok = eqEither(E.of(a).chain(E.of), E.of(a));
  // 结合律
  const m = E.of(a);
  const l3ok = eqEither(
    m.chain(ensureNumber).chain(ensureNonNegative),
    m.chain((x) => ensureNumber(x).chain(ensureNonNegative)),
  );
  eLaw1 = eLaw1 && l1ok;
  eLaw2 = eLaw2 && l2ok;
  eLaw3 = eLaw3 && l3ok;
  console.log(`  a=${String(a).padEnd(5)} 左单位 ${l1ok}   右单位 ${l2ok}   结合律 ${l3ok}`);
}
console.log('  左单位律成立吗？', eLaw1, ' 右单位律成立吗？', eLaw2, ' 结合律成立吗？', eLaw3);
console.log('  结论：Maybe 和 Either 都是合法的 Monad。Left 短路并不破坏定律 ——');
console.log('  因为定律比较的是"整个容器的最终结果"，Left 在两边都是 Left，自然相等。');

console.log('--- 7. Promise 就是 Monad：then 就是 chain ---');

// Promise 的三要素：
//   of    → Promise.resolve(x)
//   chain → p.then(f)   （f 返回 Promise 时自动拍平，不会得到 Promise<Promise>）
//   map   → p.then(f)   （f 返回普通值时自动包装）
// 注意 Promise 的 then 是"两用"的：它看回调返回什么，自动决定包一层还是拍平。
// 这是 Promise 的便利设计，不是所有 Monad 都这样。

async function promiseMonadDemo() {
  // 演示"拍平"：then 的回调返回 Promise，结果不会嵌套。
  const flattened = await Promise.resolve(1).then((x) => Promise.resolve(x + 1));
  console.log('  await Promise.resolve(1).then(x => Promise.resolve(x + 1)) →', flattened);
  console.log('    （不是 Promise { <pending> }，也没有嵌套，说明 then 自动拍平了）');

  // 演示"包装"：回调返回普通值，then 会包成 Promise。
  const wrapped = await Promise.resolve(1).then((x) => x + 1);
  console.log('  await Promise.resolve(1).then(x => x + 1) →', wrapped, '（普通值被自动包了一层）');

  // 单子定律验证：用 Promise 版本的函数。
  // 注意 Promise 是异步的、且每次 then 产生新对象，没法用 === 比较，
  // 所以定律要"在 await 之后比较值"。
  const f = (x) => Promise.resolve(x * 2); // 返回 Promise 的函数
  const g = (x) => Promise.resolve(x + 3);

  // 左单位律：Promise.resolve(a).then(f) ≡ f(a)
  const l1lhs = await Promise.resolve(5).then(f);
  const l1rhs = await f(5);
  console.log('  左单位律 · then(f) →', l1lhs, ' f(a) →', l1rhs, ' 相等', l1lhs === l1rhs);

  // 右单位律：p.then(of) ≡ p。这里 of 就是 Promise.resolve。
  //
  // 但先踩一个真实的坑：直接把 Promise.resolve 当回调传进去会报错！
  // 原因是 then 调用回调时 this 是 undefined，而 Promise.resolve 是静态方法，
  // 它要求 this 是一个构造函数对象，于是抛 "PromiseResolve called on non-object"。
  const p = Promise.resolve(9);
  try {
    await p.then(Promise.resolve);
    console.log('  p.then(Promise.resolve) 没报错');
  } catch (err) {
    console.log('  坑：p.then(Promise.resolve) →', err.constructor.name, '-', err.message);
    console.log('    （then 调用回调时 this 是 undefined，静态方法 Promise.resolve 不能用这种方式当回调。）');
    console.log('    正确写法：包一层箭头函数 p.then((x) => Promise.resolve(x))。');
  }

  const l2lhs = await p.then((x) => Promise.resolve(x));
  const l2rhs = await p;
  console.log('  右单位律 · p.then(x => Promise.resolve(x)) →', l2lhs, ' p →', l2rhs, ' 相等', l2lhs === l2rhs);

  // 结合律：p.then(f).then(g) ≡ p.then(x => f(x).then(g))
  const l3lhs = await Promise.resolve(4).then(f).then(g); // (4*2)+3 = 11
  const l3rhs = await Promise.resolve(4).then((x) => f(x).then(g));
  console.log('  结合律 · then(f).then(g) →', l3lhs, ' then(x => f(x).then(g)) →', l3rhs, ' 相等', l3lhs === l3rhs);
  console.log('  结论：Promise 满足单子三定律，所以它是 Monad。');
}
await promiseMonadDemo();

console.log('--- 8. 为什么 async/await 是"单子的语法糖" ---');

// 结合律是 async/await 能成立的理论基础：
// 下面三段的执行结果完全一样，只是写法不同。
const step1 = (n) => Promise.resolve(n + 1);
const step2 = (n) => Promise.resolve(n * 10);
const step3 = (n) => Promise.resolve(`结果=${n}`);

// 写法 A：then 链
const wayA = Promise.resolve(1).then(step1).then(step2).then(step3);
// 写法 B：嵌套 then（结合律说的就是它和 A 等价）
const wayB = Promise.resolve(1).then((x) => step1(x).then((y) => step2(y).then(step3)));
// 写法 C：async/await —— 读起来像同步代码，本质是 A 的脱糖
async function wayC() {
  const x = await Promise.resolve(1);
  const y = await step1(x);
  const z = await step2(y);
  return await step3(z);
}

console.log('  写法 A（then 链）  →', await wayA);
console.log('  写法 B（嵌套 then）→', await wayB);
console.log('  写法 C（async/await）→', await wayC());
console.log('  三者结果一致。async/await 里每次 await 相当于一次 chain，');
console.log('  所以你能"用看起来同步的代码"处理上层容器 —— 这正是单子存在的意义。');
console.log('  这也解释了一件事：await 一个 Promise<Promise<T>> 会自动拿到 T，');
console.log('  因为这本来就是 chain 的拍平语义。');

console.log('--- 9. 平铺对比：map 与 chain 到底什么时候用哪个 ---');

const scenarios = [
  ['回调返回普通值（如 x => x + 1）', 'map', '不会引入嵌套'],
  ['回调返回同类型容器（如 x => Maybe.of(x)）', 'chain', '必须拍平，否则越套越深'],
  ['回调返回 Promise（在 then 链里）', 'then', 'then 会自动判断，map/chain 二合一'],
  ['一堆独立的变换要串起来', 'map 和 chain 混用', '纯变换用 map，可能失败的下一步用 chain'],
];
console.log('  场景 | 该用谁 | 原因');
console.log('  ' + '-'.repeat(60));
for (const [scene, method, reason] of scenarios) {
  // 中文字符在终端里是双宽，padEnd 对不齐，所以直接用一个明确的分隔符更清楚。
  console.log(`  ${scene}  ||  ${method}  ||  ${reason}`);
}

// 一个真实例子：把"解析订单 → 取用户 → 取地址 → 取城市 → 规范化"整条链写出来。
// 哪些步骤该 map、哪些该 chain，一眼就能分辨。
const cityBook = { 杭州: 'HZ', 北京: 'BJ' };
const lookupCode = (city) => Maybe.fromNullable(cityBook[city]); // 可能查不到 → chain

const order = { user: { address: { city: '杭州' } } };
const cityCode = Maybe.of(order)
  .chain((o) => Maybe.fromNullable(o.user)) // 可能没有 user → chain
  .chain((u) => Maybe.fromNullable(u.address)) // 可能没有 address → chain
  .chain((a) => Maybe.fromNullable(a.city)) // 可能没有 city → chain
  .chain(lookupCode) // 可能查不到编码 → chain
  .map((code) => code.toLowerCase()); // 纯变换，不会失败 → map
console.log('  订单城市编码 →', cityCode.toString());
const brokenOrder = { user: { address: null } };
console.log('  地址为 null 的订单 →', Maybe.of(brokenOrder).chain((o) => Maybe.fromNullable(o.user)).chain((u) => Maybe.fromNullable(u.address)).chain((a) => Maybe.fromNullable(a.city)).chain(lookupCode).map((c) => c.toLowerCase()).toString());

console.log('--- 10. 什么时候不该用 Monad ---');

// 反面案例一：只有一次判空，用 chain 是杀鸡用牛刀。
const simple = Maybe.fromNullable(addressBook.alice?.city).getOrElse('无');
const simplePlain = addressBook.alice?.city ?? '无';
console.log('  Monad 版 →', simple, '   ?. 版 →', simplePlain, '（这里选 ?.）');

// 反面案例二：链条太长会难以阅读和调试（出错时不知道是哪一步）。
console.log('  反面案例二：一条 8 步的 chain 链，中间断了很难定位是哪步返回了 Nothing。');
console.log('    折中方案：把链拆成几个有名字的函数，每步单独测试；');
console.log('    或者在每一步 chain 里加日志（有副作用，但调试期可接受）。');

console.log('--- 11. 小结 ---');
console.log('  Monad = 有 of + 有 chain + 满足三条定律的容器。没有别的神秘之处。');
console.log('  chain 解决的问题：map 撞上"返回容器的函数"时会套娃。');
console.log('  chain(f) === join(map(f))，它就是"变换 + 拍平"。');
console.log('  三条定律：左单位 M.of(a).chain(f) ≡ f(a)');
console.log('            右单位 m.chain(M.of) ≡ m');
console.log('            结合律 m.chain(f).chain(g) ≡ m.chain(x => f(x).chain(g))');
console.log('  已知的 Monad：Maybe、Either、Promise（以及数组在某些库里的实现）。');
console.log('  实用建议：日常写 JavaScript 时，?.（Maybe 的简化版）、?? 、async/await');
console.log('  已经覆盖了 90% 的场景。理解 Monad 的真正价值在于：');
console.log('    当你要自己设计一个"带语境的容器"（比如带日志、带状态、带配置的返回值）时，');
console.log('    你知道该给它配上 of 和 chain，并且用三条定律检验它是否自洽。');
