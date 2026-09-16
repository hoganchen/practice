/**
 * ============================================================================
 * 知识点：四种绑定规则的优先级 —— new > 显式 > 隐式 > 默认
 * ============================================================================
 *
 * 【所属分类】15_this_and_context —— this 与执行上下文
 * 【难度等级】进阶
 * 【前置知识】15_this_and_context/05_new_binding.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    一个函数被调用时，如果多种绑定条件同时成立，引擎需要按固定顺序裁决谁的 this 生效。
 *    这个顺序就是：
 *       ① new 绑定（最高）
 *       ② 显式绑定（call / apply / bind）
 *       ③ 隐式绑定（obj.fn()）
 *       ④ 默认绑定（fn()，最低）
 *    箭头函数不参与裁决，它的 this 在定义时就固定了。
 *
 * 2. 为什么需要
 *    - 实际代码里经常同时出现多种绑定条件（比如 bind 过的函数又挂到对象上、
 *      或者 new 一个 bind 过的函数），必须知道谁赢。
 *    - 记住"优先级链"能让你在 5 秒内推断出任何调用形式的 this。
 *
 * 3. 核心语法要点
 *    - 判定流程（可当作口诀）：
 *        第 1 问：是箭头函数吗？→ 是则取定义处外层的 this，结束。
 *        第 2 问：是用 new 调用的吗？→ 是则 this 是新实例，结束。
 *        第 3 问：用了 call / apply / bind 吗？→ 是则 this 是指定值，结束。
 *        第 4 问：是 obj.fn() 形式吗？→ 是则 this 是 obj，结束。
 *        第 5 问：默认绑定 —— 严格模式 undefined，非严格模式 globalThis。
 *    - 两个容易记反的组合：
 *        - new + bind：new 赢（bind 的 thisArg 被忽略，但预设参数保留）。
 *        - obj.fn() 而 fn 是 bind 过的：显式绑定赢（this 还是 bind 的目标）。
 *    - 隐式绑定与显式绑定同时存在时，永远显式赢。
 *
 * 4. 常见陷阱
 *    - 以为 "obj.fn()" 总能拿到 obj —— 如果 fn 是 bind 过的，就拿不到。
 *    - 以为 bind 能"锁死一切" —— new 仍可覆盖它。
 *    - 忘记箭头函数根本不参与优先级比较。
 *    - 用 delete 或重新赋值来改变绑定：绑定发生在"调用那一刻"，
 *      而不是函数定义那一刻（bind 除外）。
 *
 * 【运行方法】
 *
 *   在仓库根目录执行：node 15_this_and_context/06_this_priority.js
 *
 * 【预期输出】
 *   逐组打印"两种规则同时出现"时的裁决结果，覆盖全部关键组合。
 * ============================================================================
 */

console.log('--- 0. 统一的观测函数 ---');

// 一个只报告自己 this 是谁的工具函数，方便复用在所有组合里
function whoAmI() {
  return this && this.tag ? this.tag : String(this);
}

// 预先准备几个不同 tag 的对象，便于肉眼区分
const A = { tag: 'A' };
const B = { tag: 'B' };
const C = { tag: 'C' };

console.log('--- 1. 默认绑定（基线） ---');

console.log('whoAmI() 独立调用 →', whoAmI(), '（严格模式的默认绑定是 undefined）');

console.log('--- 2. 隐式绑定 vs 默认绑定：隐式赢 ---');

A.whoAmI = whoAmI;
console.log('A.whoAmI() →', A.whoAmI(), '（隐式绑定胜出，压过默认绑定）');

console.log('--- 3. 显式绑定 vs 隐式绑定：显式赢 ---');

B.whoAmI = whoAmI.bind(A); // 先绑定到 A，再挂到 B 上
console.log('B.whoAmI() 而 whoAmI 已 bind(A) →', B.whoAmI(), '（显式绑定胜出）');

// 用 call 也能覆盖隐式绑定
console.log('A.whoAmI.call(B) →', A.whoAmI.call(B), '（call 指定的 B 胜出）');
console.log('A.whoAmI.apply(C) →', A.whoAmI.apply(C), '（apply 同理）');

console.log('--- 4. new 绑定 vs 显式绑定：new 赢 ---');

function Tagger(tag) {
  // 用 new 调用时，this 是新实例；若 bind 过，bind 的目标会被忽略
  this.tag = tag;
  this.report = function report() {
    return `我自己的 tag 是 ${this.tag}`;
  };
}

const BoundToA = Tagger.bind(A);
// 普通调用：bind 生效，A.tag 被改写
BoundToA('被普通调用改写');
console.log('普通调用 bind 后的函数 → A.tag =', A.tag);

// new 调用：this 是新实例，A 不受影响
const instance = new BoundToA('新实例的 tag');
console.log('new 调用后 instance.tag =', instance.tag);
console.log('A.tag 还是旧值吗？', A.tag === '被普通调用改写');
console.log('instance instanceof Tagger =', instance instanceof Tagger);

console.log('--- 5. new 绑定 vs 隐式绑定：new 赢 ---');

const objWithCtor = {
  Tagger,
  tag: '对象自己的 tag',
};
// objWithCtor.Tagger(...) 是隐式绑定，但如果用 new 呢？
const madeByNew = new objWithCtor.Tagger('被 new 出来的');
console.log('new obj.Tagger() 的 this =', madeByNew.tag, '（是新实例，不是 objWithCtor）');
console.log('objWithCtor.tag 未被改动：', objWithCtor.tag);

console.log('--- 6. 三者同时出现：完整优先级验证 ---');

// 这个函数会被"先 bind 到 A，再挂到 B 上，最后用 new 调用"
function FullTest() {
  this.origin = 'FullTest';
}
FullTest.prototype.kind = '原型属性';

const boundToA2 = FullTest.bind(A);
B.FullTest = boundToA2;

// 组合一：隐式 + 显式（无 new）→ 显式赢
console.log('B.FullTest() （无 new）→ A.origin =', (B.FullTest(), A.origin), '（写到了 A 上）');

// 把 A.origin 改回一个可辨识的旧值，便于观察下一次调用是否影响它
A.origin = '未被 new 调用改写';

// 组合二：隐式 + 显式 + new → new 赢
const fullInstance = new B.FullTest();
console.log(
  'new B.FullTest() → 得到新实例吗？',
  fullInstance.origin === 'FullTest' && fullInstance instanceof FullTest,
);
console.log('A.origin 仍是旧值吗？', A.origin === '未被 new 调用改写', '（new 忽略了 bind 的目标）');

console.log('--- 7. 用一张表把裁决过程固化下来 ---');

// 写一个辅助函数，把"是否 new / 是否显式绑定 / 是否隐式调用"三个条件组合起来验证。
function judge({ useNew, explicitThis, host }) {
  const fn = whoAmI;
  let target = fn;
  if (explicitThis) target = target.bind(explicitThis);
  if (host) host.fn = target;
  try {
    if (useNew) {
      // whoAmI 不用 this 属性赋值，可以安全 new
      const inst = new target();
      return inst === undefined ? '(无)' : '新实例';
    }
    return host ? host.fn() : target();
  } catch (err) {
    return `${err.constructor.name}`;
  }
}

const cases = [
  { desc: '只有默认绑定', opt: { useNew: false, explicitThis: null, host: null } },
  { desc: '隐式绑定', opt: { useNew: false, explicitThis: null, host: { tag: '宿主对象' } } },
  { desc: '显式绑定', opt: { useNew: false, explicitThis: { tag: '显式目标' }, host: null } },
  { desc: '显式 + 隐式', opt: { useNew: false, explicitThis: { tag: '显式目标' }, host: { tag: '宿主对象' } } },
  { desc: 'new（最高）', opt: { useNew: true, explicitThis: { tag: '显式目标' }, host: null } },
];

console.log('  场景              结果');
for (const c of cases) {
  console.log(`  ${c.desc.padEnd(16)}  ${judge(c.opt)}`);
}

console.log('--- 8. 箭头函数不参与优先级 ---');

const arrowOwner = {
  tag: '外层对象',
  makeArrow() {
    // 箭头函数的 this 固定在"定义处"的 this（即 arrowOwner）
    return () => whoAmI.call(this);
  },
};

const arrowFn = arrowOwner.makeArrow();
console.log('箭头函数里的 this 永远是外层：', arrowFn.call(B), '（call 无法改变）');
console.log('箭头函数里再 new 也不可能：见 03 节。');

console.log('--- 9. 判定口诀 ---');

const rules = [
  '先看是不是箭头函数 —— 是就跳到"定义处的外层 this"，不参与后续裁决。',
  '再看有没有 new —— 有就是新实例。',
  '再看有没有 call/apply/bind —— 有就是指定对象。',
  '再看是不是 obj.fn() —— 是就是 obj。',
  '都不是就是默认绑定：严格模式 undefined，非严格模式 globalThis。',
];
for (const line of rules) console.log('  •', line);

console.log('\n全部演示完毕。');
