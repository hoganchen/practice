/**
 * ============================================================================
 * 知识点：node:assert 断言库全览 —— strictEqual / deepStrictEqual / throws / rejects / ok / match
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试基础
 * 【难度等级】入门
 * 【前置知识】28_testing/02_node_test_runner.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:assert 是 Node 标准库里的断言库。它没有任何魔法：
 *    每个 assert.xxx 做的事情都是"检查一个条件，不满足就 throw 一个 AssertionError"。
 *    因为测试运行器（node:test）的判定标准就是"回调有没有抛错"，
 *    所以断言库和运行器天然配合。
 *
 *    两个入口：
 *      import assert from 'node:assert';        // 宽松模式：== 语义（几乎不该用）
 *      import assert from 'node:assert/strict'; // 严格模式：=== 语义（推荐）
 *    本文件统一使用 strict 入口。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    - 断言失败信息是排错的第一手资料。assert 会打印"期望 vs 实际"的 diff，
 *      比自己写的 if (!ok) console.log('错了') 有用得多。
 *    - 不同的比较场景需要不同的断言：
 *        标量比较 -> strictEqual      深比较（对象/数组）-> deepStrictEqual
 *        验证抛错 -> throws            验证 Promise 拒绝 -> rejects
 *        真值判断 -> ok                字符串/正则匹配 -> match
 *      用错断言会导致"假通过"（比如用 equal 比较两个不同对象永远是 false）。
 *
 * 3. 核心语法要点
 *    assert.ok(value, msg)                     真值断言（等同于 assert(value)）
 *    assert.strictEqual(a, b, msg)             严格相等（Object.is 语义，推荐）
 *    assert.notStrictEqual(a, b, msg)          严格不等
 *    assert.deepStrictEqual(a, b, msg)         递归深比较（含原型与类型）
 *    assert.throws(fn, [error], [msg])         同步代码必须抛错
 *    assert.doesNotThrow(fn, [msg])            同步代码不应抛错
 *    assert.rejects(asyncFn, [error], [msg])   异步代码必须 reject（返回 Promise）
 *    assert.match(str, regexp, msg)            字符串匹配正则
 *    assert.doesNotMatch(str, regexp, msg)     字符串不匹配正则
 *    assert.fail(msg)                          无条件失败（用于"不该走到这里"的分支）
 *    assert.ifError(err)                       断言 err 是 null/undefined
 *
 * 4. 常见陷阱
 *    - deepStrictEqual vs deepEqual：非 strict 版本会做隐式类型转换，
 *      assert.deepEqual({a: 1}, {a: '1'}) 竟然通过，这几乎永远不是你要的。
 *    - strictEqual 比较对象时只看引用：assert.strictEqual({a:1}, {a:1}) 必然失败。
 *    - assert.throws 的第一个参数必须是"函数"，传调用结果（assert.throws(fn())）是常见错误，
 *      因为 fn() 在传参前就已经执行并抛错了。
 *    - assert.rejects 必须 await，否则断言失败会变成未处理的 Promise 拒绝。
 *    - 断言消息（第三个参数）不要省：失败时它决定你能不能一眼看懂哪里错了。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/03_assert_module.js
 *
 * 【预期输出】
 *   依次演示每种断言的成功路径，并把"故意失败"的断言放在 try/catch 里打印错误摘要，
 *   最后打印一份断言清单小结。退出码 0。
 * ============================================================================
 */

// 只用 strict 入口。注意 npm 生态里也有一个叫 assert 的包，
// 写 'node:assert' 可以确保拿到的是 Node 内置模块而不是依赖里的同名包。
import assert from 'node:assert/strict';

console.log('--- 0. 演示辅助函数 ---');

/**
 * 演示辅助：执行 fn，打印"通过"，或捕获 AssertionError 并打印它的 message。
 * 真实测试里这个 try/catch 由测试运行器代劳，这里为了让脚本本身不中断而显式写出。
 *
 * @param {string} label 演示标题
 * @param {() => void} fn 包含断言的动作
 */
function demo(label, fn) {
  try {
    fn();
    console.log(`  PASS  ${label}`);
  } catch (error) {
    // AssertionError 的 message 已经包含了期望/实际值，直接打印即可
    console.log(`  FAIL  ${label}`);
    console.log(
      error.message
        .split('\n')
        .map((line) => `        ${line}`)
        .join('\n'),
    );
  }
}

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 1. ok / strictEqual / notStrictEqual：最常用的三个 ---');

demo('ok：真值断言（非 0、非空串、非 null 即为真）', () => {
  assert.ok(1);
  assert.ok('非空字符串');
  assert.ok([]); // 注意：空数组是对象，真值为 true（这是 JS 的坑，见下面的陷阱演示）
  assert.ok(0.1 + 0.2 - 0.3 < Number.EPSILON, '浮点误差应在 EPSILON 内');
});

demo('strictEqual：严格相等，用 === 语义，不做类型转换', () => {
  assert.strictEqual(1 + 1, 2);
  assert.strictEqual('1' + '2', '12');
  assert.strictEqual(typeof undefined, 'undefined');
  assert.strictEqual(NaN, NaN, 'strictEqual 用 Object.is 语义，所以 NaN 等于 NaN');
  assert.strictEqual(typeof null, 'object', '这是 JS 的历史遗留 bug，被写进测试里当契约');
});

demo('注意：strictEqual 用 Object.is 语义，0 与 -0 并不相等', () => {
  // 这是很多人不知道的细节：assert.strictEqual 的官方定义是 Object.is 比较，
  // 而 Object.is(0, -0) === false。所以下面这个断言会失败（这里用 throws 把它断言下来）。
  assert.throws(() => assert.strictEqual(0, -0), assert.AssertionError, '0 与 -0 在 Object.is 下不等');
  assert.strictEqual(1 / 0, Infinity);
});

demo('notStrictEqual：严格不等', () => {
  assert.notStrictEqual(1, '1', '数字 1 与字符串 "1" 严格不等');
  assert.notStrictEqual({}, {}, '两个不同的对象字面量引用不同');
});

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 2. deepStrictEqual：对象与数组的深比较 ---');

demo('deepStrictEqual：递归比较每一个属性', () => {
  // 这是测试里最有用的断言：比较"值"而不是"引用"
  assert.deepStrictEqual({ name: 'alice', tags: ['a', 'b'] }, { name: 'alice', tags: ['a', 'b'] });
  assert.deepStrictEqual([1, [2, [3]]], [1, [2, [3]]]);
  assert.deepStrictEqual(new Map([['k', 1]]), new Map([['k', 1]])); // 连 Map/Set 也能深比较
});

demo('演示陷阱：strictEqual 比较对象必然失败', () => {
  // 下面这行如果取消注释会失败，因为它比较的是内存引用：
  // assert.strictEqual({ a: 1 }, { a: 1 });
  // 正确写法是 deepStrictEqual。这里用 assert.throws 把"失败"本身断言下来。
  assert.throws(() => assert.strictEqual({ a: 1 }, { a: 1 }), assert.AssertionError);
});

demo('演示陷阱：deepStrictEqual 会检查类型，不做隐式转换', () => {
  // 严格版本下 { a: 1 } 与 { a: '1' } 不相等，这正是我们想要的行为
  assert.throws(
    () => assert.deepStrictEqual({ a: 1 }, { a: '1' }),
    assert.AssertionError,
    '数字 1 与字符串 "1" 深比较应当失败',
  );
});

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 3. throws / doesNotThrow：验证"同步抛错"这一契约 ---');

/** 被测代码：一个必须校验入参的函数 */
function divide(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('参数必须是数字');
  }
  if (b === 0) {
    throw new RangeError('除数不能为 0');
  }
  return a / b;
}

demo('throws + 构造函数：断言错误类型', () => {
  assert.throws(() => divide(1, 0), RangeError);
  assert.throws(() => divide('1', 2), TypeError);
});

demo('throws + 正则：断言错误消息（错误消息也是对外契约的一部分）', () => {
  assert.throws(() => divide(1, 0), /除数不能为 0/);
});

demo('throws + 校验函数：断言错误对象的自定义属性', () => {
  // 第三个用法是传一个函数，接收错误对象并返回布尔值，
  // 适合断言错误码、statusCode 这类结构化信息 —— 在 API 层测试里非常常用。
  assert.throws(
    () => divide(1, 0),
    (error) => {
      assert.ok(error instanceof RangeError);
      assert.strictEqual(error.name, 'RangeError');
      return true; // 返回 true 表示"这个错误符合预期"
    },
  );
});

demo('doesNotThrow：合法输入不应抛错', () => {
  assert.doesNotThrow(() => divide(10, 2));
  assert.strictEqual(divide(10, 2), 5);
});

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 4. rejects：验证"异步拒绝"这一契约 ---');

/** 模拟一个真实项目里的异步请求函数：失败时 reject 一个带 statusCode 的错误 */
async function fetchUser(id) {
  if (typeof id !== 'number') {
    const error = new TypeError('id 必须是数字');
    error.statusCode = 400;
    throw error;
  }
  if (id <= 0) {
    const error = new Error('用户不存在');
    error.statusCode = 404;
    throw error;
  }
  return { id, name: `user_${id}` };
}

console.log('  说明：assert.rejects 返回 Promise，必须 await，因此放在 async IIFE 里演示。');

// 顶层 await 在 ESM 里是可用的（本仓库 "type": "module"），所以这里可以直接 await。
// 真实项目里 node:test 的 test() 回调本身就是 async，直接在里面 await 即可。
await (async () => {
  // 成功路径：assert.doesNotReject 断言"不应拒绝"
  await assert.doesNotReject(() => fetchUser(1), '合法 id 不应拒绝');

  // 拒绝路径 1：只断言"有拒绝"
  await assert.rejects(() => fetchUser(0));

  // 拒绝路径 2：断言错误类型
  await assert.rejects(() => fetchUser('abc'), TypeError);

  // 拒绝路径 3：断言错误消息的正则
  await assert.rejects(() => fetchUser(0), /用户不存在/);

  // 拒绝路径 4：断言错误对象的自定义字段 —— REST API 测试里最实用的写法
  await assert.rejects(
    () => fetchUser(0),
    (error) => {
      assert.strictEqual(error.statusCode, 404);
      return true;
    },
  );

  console.log('  PASS  rejects：类型 / 消息 / 自定义字段四种断言方式全部符合预期');
})();

// 补充：assert.rejects 的第一个参数也可以直接传 Promise 对象。
// 但推荐传函数，因为传 Promise 时拒绝可能发生在断言注册之前，产生未处理拒绝警告。
await assert.rejects(fetchUser(-1), /用户不存在/);

// 再补一个最容易踩的坑：async 函数内部 throw 并不会同步抛出，
// 而是返回一个"已拒绝的 Promise"。所以：
//     assert.throws(() => fetchUser(0), Error);   // 错误！不会按你预期的方式生效
// 正确写法是 await assert.rejects(() => fetchUser(0), Error)。
// 这里用一段注释代替可疑的演示代码，避免产生未处理的 Promise 拒绝。
console.log('  提示：async 函数抛错 = 返回被拒绝的 Promise，必须用 rejects 而不是 throws。');

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 5. match / doesNotMatch：字符串与正则 ---');

demo('match：字符串应匹配正则或包含子串', () => {
  assert.match('2024-06-01', /^\d{4}-\d{2}-\d{2}$/);
  assert.match('订单号 ORDER-12345', /ORDER-\d+/);
  assert.match('hello@example.com', /@/, '传字符串时会被转成正则，判断"包含"');
});

demo('doesNotMatch：字符串不应匹配', () => {
  assert.doesNotMatch('纯文本内容', /\d/);
  assert.doesNotMatch('safe_name', /[^A-Za-z0-9_]/);
});

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 6. fail / ifError：两个收尾用断言 ---');

demo('fail：走到这里就是错（常用于 switch 的 default 分支）', () => {
  const status = 'unknown';
  try {
    switch (status) {
      case 'ok':
        break;
      default:
        // fail 会无条件抛出 AssertionError，附带你给的消息
        assert.fail(`不该出现的状态：${status}`);
    }
  } catch (error) {
    // 在演示里我们捕获它，并断言它确实是 AssertionError
    assert.ok(error instanceof assert.AssertionError);
    assert.match(error.message, /不该出现的状态/);
  }
});

demo('ifError：Node 回调风格的错误透传（err 必须为空）', () => {
  // Node 的 error-first 回调约定里，第一个参数是 err。
  // assert.ifError(err) 在 err 为 null/undefined 时通过，否则抛出这个 err 本身。
  const err = null;
  assert.ifError(err);
  assert.throws(() => assert.ifError(new Error('磁盘写入失败')), /磁盘写入失败/);
});

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 7. 断言选择速查表 ---');
console.log('  标量相等            -> assert.strictEqual(actual, expected)');
console.log('  对象/数组相等        -> assert.deepStrictEqual(actual, expected)');
console.log('  真值判断            -> assert.ok(value)');
console.log('  同步抛错            -> assert.throws(fn, ErrorType | /regex/ | validator)');
console.log('  异步拒绝            -> await assert.rejects(asyncFn, ...)');
console.log('  字符串匹配          -> assert.match(str, /regex/)');
console.log('  不可能到达的分支      -> assert.fail(message)');
console.log('');
console.log('演示结束：以上所有断言均已按预期通过或被断言为失败。');
