/**
 * ============================================================================
 * 知识点：断言 —— node:assert 的 assert / strictEqual / deepStrictEqual / throws
 * ============================================================================
 *
 * 【所属分类】20_error_handling —— 错误处理
 * 【难度等级】进阶
 * 【前置知识】20_error_handling/05_custom_errors.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    断言（assertion）是"我确信这里一定成立，不成立就是有 bug"的声明式检查。
 *    Node 内置了 node:assert 模块，常用 API：
 *      assert(value, message)              真值断言，等价于 assert.ok
 *      assert.strictEqual(a, b, message)   严格相等（===）
 *      assert.deepStrictEqual(a, b, msg)   深度结构相等（递归比较）
 *      assert.throws(fn, [expected])       断言某个函数会抛错
 *      assert.rejects(promise, [expected]) 断言某个 Promise 会被拒绝
 *      assert.match(str, /re/)             断言字符串匹配正则
 *      assert.fail(message)                直接失败
 *    断言失败时抛出 AssertionError，它的 code 固定是 'ERR_ASSERTION'，
 *    并带有 actual / expected / operator 等字段。
 *
 * 2. 为什么需要
 *    (1) 测试：单元测试框架（node:test、vitest、jest）内部都用它做断言。
 *    (2) 契约检查：库的入口用断言声明前置条件，把"用错了"的调用第一时间挡回去。
 *    (3) 不可达分支：switch 的 default 里写 assert.fail，一旦出现新分支就立刻暴露。
 *    (4) 相比手写 if (!x) throw new Error(...)，断言语义更清晰、报错信息更结构化。
 *
 * 3. 核心语法要点
 *    (1) assert 模块的默认导出就是 assert 函数本身，
 *        所以 `import assert from 'node:assert'` 后可直接 assert(...)。
 *        也可以 `import { strictEqual } from 'node:assert/strict'` 用严格版本。
 *    (2) **严格模式优先**：node:assert/strict 提供的 equal / deepEqual 就是
 *        strictEqual / deepStrictEqual 的别名。老 API 里的 assert.equal 用的是 ==，
 *        会出现 assert.equal(1, '1') 通过这种反直觉情况。
 *    (3) deepStrictEqual 比较的是"结构与类型都相同"：{a:1} 与 {a:'1'} 不相等；
 *        原型不同（class 实例 vs 普通对象）也不相等。
 *    (4) assert.throws(fn, ErrorClass) 可以断言错误类型；
 *        传对象可按属性匹配，传正则可匹配 message。
 *    (5) 失败时抛出的 AssertionError 属性：err.code === 'ERR_ASSERTION'、
 *        err.actual、err.expected、err.operator、err.generatedMessage。
 *
 * 4. 常见陷阱
 *    (1) 用 assert.equal 比较对象 —— 它比的是引用，两个内容相同的对象也不相等；
 *        应该用 deepStrictEqual。
 *    (2) 断言被当成"参数校验"用在生产环境的热路径上 —— 断言失败会抛错，
 *        面向用户的输入校验应该返回友好错误，而不是断言。
 *    (3) assert(await fn())：忘了 await，断言的是一个 Promise 对象（永远为真）。
 *    (4) 断言消息写得太简略（只写"失败了"），出错时无法定位。
 *    (5) 依赖断言的具体报错文案 —— 文案会随版本变化，应依赖 code / 属性。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 20_error_handling/11_assertion.js
 *
 * 【预期输出】
 *   演示各类断言通过、失败时的捕获输出（本示例所有断言失败都被 try/catch 包住，
 *   不会让进程崩溃），以及断言在实际校验函数中的用法。
 * ============================================================================
 */

import assert from 'node:assert';
import { strictEqual, deepStrictEqual, notStrictEqual, throws, rejects, match } from 'node:assert/strict';

// ---------------------------------------------------------------------------
// 小工具：运行一个断言并报告结果
// ---------------------------------------------------------------------------

/**
 * 执行一个断言，打印它是通过还是失败
 * @param {string} label 说明
 * @param {() => void} fn 断言函数
 */
function check(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
  } catch (err) {
    // 断言失败抛出的 AssertionError
    console.log(`  ✗ ${label}`);
    console.log(`      name     = ${err.name}`);
    console.log(`      code     = ${err.code}`);
    console.log(`      operator = ${err.operator}`);
    console.log(`      actual   = ${JSON.stringify(err.actual)}`);
    console.log(`      expected = ${JSON.stringify(err.expected)}`);
    console.log(`      message  = ${String(err.message).split('\n')[0]}`);
  }
}

/**
 * 异步版本的断言检查（用于 assert.rejects 这类返回 Promise 的断言）
 * @param {string} label 说明
 * @param {() => Promise<void>} fn 断言函数
 * @returns {Promise<void>}
 */
async function checkAsync(label, fn) {
  try {
    // 关键：必须 await，否则断言失败会变成"未处理的 Promise 拒绝"，
    // 逃出 try/catch 直接把进程打挂（本文件此前就踩过这个坑）。
    await fn();
    console.log(`  ✓ ${label}`);
  } catch (err) {
    console.log(`  ✗ ${label}`);
    console.log(`      code     = ${err.code}`);
    console.log(`      operator = ${err.operator}`);
    console.log(`      message  = ${String(err.message).split('\n')[0]}`);
  }
}

// ---------------------------------------------------------------------------
// 1. 真值断言
// ---------------------------------------------------------------------------

console.log('--- 1. 真值断言 assert / assert.ok ---');

check('assert(true) 通过', () => assert(true));
check('assert(1, "非零数字为真") 通过', () => assert(1, '非零数字为真'));
check('assert(0) 应当失败', () => assert(0));
check('assert("", "空字符串是假值") 应当失败', () => assert('', '空字符串是假值'));
check('assert(null, "null 是假值") 应当失败', () => assert(null, 'null 是假值'));
// 注意：空数组、空对象都是"真值"（对象永远是 truthy）
check('assert([]) 通过（空数组也是真值）', () => assert([]));

// ---------------------------------------------------------------------------
// 2. 严格相等 vs 宽松相等
// ---------------------------------------------------------------------------

console.log('\n--- 2. strictEqual 与 equal 的区别 ---');

check('strictEqual(1, 1) 通过', () => strictEqual(1, 1));
check("strictEqual(1, '1') 应当失败（类型不同）", () => strictEqual(1, '1'));
check("assert.equal(1, '1') 会通过（宽松 == 比较）", () => assert.equal(1, '1'));
check('notStrictEqual(1, "1") 通过', () => notStrictEqual(1, '1'));

console.log('  结论：node:assert/strict 里的 equal 就是 strictEqual，');
console.log('        推荐始终使用严格版本，避免 == 带来的隐式类型转换。');

check('strictEqual(NaN, NaN) 通过（严格相等对 NaN 特判为相等）', () => strictEqual(NaN, NaN));
check('strictEqual(0, -0) 应当失败（Object.is 语义）', () => strictEqual(0, -0));

// ---------------------------------------------------------------------------
// 3. 深度比较
// ---------------------------------------------------------------------------

console.log('\n--- 3. deepStrictEqual 深度结构比较 ---');

const objA = { name: '张三', tags: ['a', 'b'], nested: { n: 1 } };
const objB = { name: '张三', tags: ['a', 'b'], nested: { n: 1 } };

check('deepStrictEqual(内容相同的两个对象) 通过', () => deepStrictEqual(objA, objB));
check('strictEqual(内容相同的两个对象) 应当失败（引用不同）', () => strictEqual(objA, objB));
check("deepStrictEqual({a:1}, {a:'1'}) 应当失败（类型不同）", () =>
  deepStrictEqual({ a: 1 }, { a: '1' }),
);
check('deepStrictEqual([1,2,3], [1,2,3]) 通过', () => deepStrictEqual([1, 2, 3], [1, 2, 3]));
check('deepStrictEqual([1,2], [2,1]) 应当失败（数组顺序不同）', () =>
  deepStrictEqual([1, 2], [2, 1]),
);

// 原型不同也不相等：class 实例与同结构的普通对象
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
check('deepStrictEqual(new Point(1,2), {x:1,y:2}) 应当失败（原型不同）', () =>
  deepStrictEqual(new Point(1, 2), { x: 1, y: 2 }),
);
check('deepStrictEqual(两个同值的 Point 实例) 通过', () =>
  deepStrictEqual(new Point(1, 2), new Point(1, 2)),
);

// ---------------------------------------------------------------------------
// 4. 断言会抛错
// ---------------------------------------------------------------------------

console.log('\n--- 4. assert.throws ---');

/**
 * 一个参数校验函数，参数非法时抛 TypeError
 * @param {unknown} value
 * @returns {number}
 */
function toPositiveInt(value) {
  if (typeof value !== 'number') {
    throw new TypeError('value 必须是数字');
  }
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError('value 必须是正整数');
  }
  return value;
}

check('throws(fn) 只断言"抛错了"', () =>
  throws(() => toPositiveInt('abc')),
);
check('throws(fn, TypeError) 断言错误类型', () =>
  throws(() => toPositiveInt('abc'), TypeError),
);
check('throws(fn, RangeError) 断言具体的错误类型', () =>
  throws(() => toPositiveInt(-1), RangeError),
);
check('throws(fn, RangeError) 在类型不符时应当失败', () =>
  throws(() => toPositiveInt('abc'), RangeError),
);
check('throws(fn, { message: "..." }) 断言消息内容', () =>
  throws(() => toPositiveInt('abc'), { message: 'value 必须是数字' }),
);
check('throws(fn, /正则/) 用正则匹配消息', () => throws(() => toPositiveInt('abc'), /必须是数字/));
check('throws(fn) 在函数没抛错时应当失败', () => throws(() => toPositiveInt(5)));

// ---------------------------------------------------------------------------
// 5. 断言 Promise 被拒绝
// ---------------------------------------------------------------------------

console.log('\n--- 5. assert.rejects ---');

/**
 * 异步版本的参数校验
 * @param {unknown} value
 * @returns {Promise<number>}
 */
async function toPositiveIntAsync(value) {
  await new Promise((r) => setTimeout(r, 1));
  return toPositiveInt(value);
}

await checkAsync('rejects(promise, TypeError) 通过', async () => {
  await rejects(() => toPositiveIntAsync('abc'), TypeError);
});

await checkAsync('rejects(promise) 在 Promise 成功时应当失败', async () => {
  await rejects(() => toPositiveIntAsync(5));
});

// ---------------------------------------------------------------------------
// 6. 其它常用断言
// ---------------------------------------------------------------------------

console.log('\n--- 6. 其它常用断言 ---');

check('match(字符串, 正则) 通过', () => match('user-123', /^user-\d+$/));
check('match 不匹配时应当失败', () => match('admin-123', /^user-\d+$/));
check('assert.fail("主动失败") 应当失败', () => assert.fail('主动失败示例'));

// 断言一个值"是某种类型"
check('typeof 检查通过', () => strictEqual(typeof 'abc', 'string'));
check('Array.isArray 检查通过', () => assert(Array.isArray([])));
check('Number.isFinite 检查通过', () => assert(Number.isFinite(3.14), '应为有限数字'));

// ---------------------------------------------------------------------------
// 7. 实战：不可达分支与内部契约
// ---------------------------------------------------------------------------

console.log('\n--- 7. 实战：switch 的穷尽性检查 ---');

/**
 * 根据状态返回文案。任何未覆盖的状态都会触发断言失败 —— 这是"穷尽性检查"。
 * @param {'pending'|'done'|'failed'} status
 * @returns {string}
 */
function describeStatus(status) {
  switch (status) {
    case 'pending':
      return '处理中';
    case 'done':
      return '已完成';
    case 'failed':
      return '已失败';
    default:
      // 正常情况下永远不该走到这里。一旦有人加了新的状态却忘了处理，
      // 断言会立刻抛出 AssertionError，而不是静默返回 undefined。
      assert.fail(`未处理的状态：${status}`);
  }
}

console.log('  describeStatus("done") =', describeStatus('done'));

try {
  // 故意传入一个未覆盖的状态，模拟"忘了处理新状态"的情形
  describeStatus('cancelled');
} catch (err) {
  console.log('  传入未覆盖状态时抛错：', err.code, '-', String(err.message).split('\n')[0]);
}

console.log('\n--- 8. 实战：函数内部的前置条件断言 ---');

/**
 * 计算数组平均值。内部契约（数组非空、元素都是数字）用断言声明。
 * 注意：断言用于"程序 bug 检查"，面向用户的输入校验请用显式的 if + throw（见 12）。
 * @param {number[]} nums
 * @returns {number}
 */
function average(nums) {
  assert(Array.isArray(nums), 'average 的参数必须是数组');
  assert(nums.length > 0, 'average 不接受空数组');
  assert(
    nums.every((n) => typeof n === 'number' && Number.isFinite(n)),
    'average 的数组元素必须都是有限数字',
  );
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

console.log('  average([1, 2, 3, 4]) =', average([1, 2, 3, 4]));

try {
  average([1, '2', 3]);
} catch (err) {
  console.log('  传入非法元素时：', err.code, '-', String(err.message).split('\n')[0]);
}

// ---------------------------------------------------------------------------
// 9. 与测试框架的关系
// ---------------------------------------------------------------------------

console.log('\n--- 9. 断言与测试框架 ---');
console.log('node:test、vitest、jest 的 expect 断言底层都是这套思路：');
console.log('  expect(a).toBe(b)         ≈ strictEqual(a, b)');
console.log('  expect(a).toEqual(b)      ≈ deepStrictEqual(a, b)');
console.log('  expect(fn).toThrow(Err)   ≈ throws(fn, Err)');
console.log('  expect(p).rejects.toThrow ≈ rejects(p, Err)');
console.log('在没有测试框架的脚本里，node:assert 就是最轻量的断言工具。');

console.log('\n--- 10. 小结 ---');
console.log('断言用于"我确信一定成立"的内部检查，失败即 bug；');
console.log('优先使用 node:assert/strict 的严格版本（strictEqual / deepStrictEqual）；');
console.log('断言失败抛出 AssertionError，err.code === "ERR_ASSERTION"；');
console.log('对外部输入请用显式的校验逻辑（12_defensive_programming.js），而不是断言。');
