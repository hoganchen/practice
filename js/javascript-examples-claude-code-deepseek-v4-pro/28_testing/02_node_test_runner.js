/**
 * ============================================================================
 * 知识点：Node 内置测试运行器 node:test —— test()、断言、子测试
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试基础
 * 【难度等级】入门
 * 【前置知识】28_testing/01_why_testing.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    从 Node.js 18 开始，标准库内置了测试运行器（模块名 node:test），
 *    以及配套的断言库 node:assert。这意味着：写单元测试不再必须安装 Jest / Mocha，
 *    一个 node 命令就够了。
 *
 *    它的两个组成部分：
 *      - node:test  —— 测试运行器：负责组织用例（test / describe / it）、
 *                      执行钩子（before / beforeEach / after / afterEach）、
 *                      汇总结果、决定进程退出码。
 *      - node:assert —— 断言库：负责"比较 + 不满足就抛错"。
 *    运行器本身不做比较，它只负责"执行函数并看它有没有抛错"。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    - 零依赖：CI 里不需要装 300MB 的 node_modules 就能跑测试，启动极快；
 *    - 零配置：不需要 jest.config.js / vitest.config.ts，开箱即用；
 *    - 标准输出 TAP：Test Anything Protocol，是通用的测试结果格式，
 *      CI 系统（GitLab CI、Jenkins）能直接解析；
 *    - 对"想学测试但不想先学一堆工具链"的人极其友好。
 *    真实项目里的取舍：node:test 适合库、脚本、后端服务；前端组件测试
 *    仍然更常用 Vitest / Jest（因为需要 DOM 环境和丰富的快照/覆盖率能力）。
 *
 * 3. 核心语法要点
 *    import { test } from 'node:test';
 *    test(name, options, fn)      定义一个测试用例
 *    test(name, async (t) => {})  回调参数 t 是测试上下文（TestContext）
 *    t.test(name, fn)             定义子测试（subtest），可嵌套、可 await
 *    t.diagnostic(msg)            输出诊断信息（不参与断言，只打印）
 *    options.timeout              单用例超时（毫秒），超时视为失败
 *    options.skip / options.todo  跳过 / 标记为待办
 *    退出码规则：全部通过 -> 0；任何一个失败 -> 1。
 *
 * 4. 常见陷阱
 *    - 忘记 await 异步断言：test 回调里返回 Promise 才会被等待，
 *      写成 fire-and-forget 的形式会让测试"假通过"。
 *    - 子测试不 await：t.test() 返回 Promise，不 await 的话父测试可能先结束。
 *    - 在 test 回调外做断言：抛出在回调外的异常可能不被运行器捕获。
 *    - 误以为需要 --test 参数：用 `node --test` 会让运行器扫描目录，
 *      而 `node 文件.js` 是直接执行该文件（本仓库用后者，便于逐个演示）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/02_node_test_runner.js
 *   （也可以用：node --test 28_testing/02_node_test_runner.js，效果等价）
 *
 * 【预期输出】
 *   打印 TAP 格式的测试结果（TAP version 13 / ok 1 / ... / # pass 5 / # fail 0），
 *   进程退出码为 0。
 * ============================================================================
 */

// node: 前缀表示"Node 内置模块"，不需要安装。加前缀能避免与同名 npm 包混淆
import { test } from 'node:test';
// 注意路径是 'node:assert/strict'：strict 版本用 === 语义比较，且 deepEqual 也更严格。
// 生产代码里几乎总是用 strict，避免 '1' == 1 这种隐式转换带来的假通过。
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// 被测代码：一个用户名校验与格式化模块
// ---------------------------------------------------------------------------

/** 用户名允许的字符：字母、数字、下划线，长度 3~16 */
const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,16}$/;

/**
 * 校验用户名是否合法。
 * @param {string} name
 * @returns {boolean}
 */
function isValidUsername(name) {
  // typeof 检查放在最前面：避免传入 null/undefined 时正则的隐式转换把 null 变成 "null"
  if (typeof name !== 'string') return false;
  return USERNAME_PATTERN.test(name);
}

/**
 * 把用户名规范化为"显示名"：首字母大写，其余小写。
 * @param {string} name
 * @returns {string}
 */
function toDisplayName(name) {
  if (!isValidUsername(name)) {
    // 校验失败抛错，而不是返回空串 —— 让调用方必须显式处理异常
    throw new TypeError(`非法用户名：${String(name)}`);
  }
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

console.log('--- 1. 最简单的测试用例 ---');

// test(name, fn) 注册一个用例。
// 运行器会执行 fn：不抛错就记为通过（ok），抛错就记为失败（not ok）。
test('isValidUsername 接受普通用户名', () => {
  // assert.equal 在 strict 模式下就是 Object.is 语义的严格比较
  assert.equal(isValidUsername('alice'), true);
});

console.log('--- 2. 断言失败会怎样：用 assert.throws 反过来验证"报错逻辑" ---');

test('toDisplayName 对非法输入抛出 TypeError', () => {
  // 演示"被测代码会抛错"时，测试本身不应该崩，而应该用 assert.throws 主动接住它。
  // 第一个参数可以传构造函数（校验错误类型），也可以传正则或校验函数。
  assert.throws(
    () => toDisplayName('a'), // 'a' 只有 1 位，不符合 3~16 位规则
    TypeError,
    '长度不足应当抛出 TypeError',
  );

  // 也可以传正则来匹配错误信息，确保错误消息本身也是契约的一部分
  assert.throws(
    () => toDisplayName('has space'),
    /非法用户名/,
    '错误信息应当包含"非法用户名"',
  );
});

console.log('--- 3. 子测试：把一个大功能拆成一组相关的用例 ---');

// 子测试让"一个主题下的多个断言"拥有独立的结果行和独立的失败隔离。
// 父测试通过 await 等待所有子测试完成，任何子测试失败都会向父测试冒泡。
test('用户名规范化的行为分组', async (t) => {
  // t 是 TestContext，由运行器注入。
  // t.diagnostic 打印的文本会出现在 TAP 输出里，但不会影响通过/失败判定。
  t.diagnostic('以下子测试覆盖大小写转换、长度边界与类型防御');

  await t.test('首字母大写、其余小写', () => {
    assert.equal(toDisplayName('ALICE'), 'Alice');
    assert.equal(toDisplayName('bOb'), 'Bob');
  });

  await t.test('长度边界：3 位通过、2 位抛错、16 位通过、17 位抛错', () => {
    assert.equal(toDisplayName('abc'), 'Abc'); // 最小合法长度
    assert.throws(() => toDisplayName('ab'), TypeError);
    assert.equal(toDisplayName('a'.repeat(16)).length, 16); // 最大合法长度
    assert.throws(() => toDisplayName('a'.repeat(17)), TypeError);
  });

  await t.test('非字符串输入不会误判为合法', () => {
    // 这是典型的"防御性测试"：确认边界输入不会让正则产生意外匹配
    assert.equal(isValidUsername(null), false);
    assert.equal(isValidUsername(undefined), false);
    assert.equal(isValidUsername(123), false);
    assert.equal(isValidUsername({}), false);
  });

  await t.test('下划线允许，连字符与中文不允许', () => {
    assert.equal(isValidUsername('user_name'), true);
    assert.equal(isValidUsername('user-name'), false);
    assert.equal(isValidUsername('用户名'), false);
  });
});

console.log('--- 4. 选项：跳过与待办 ---');

test('这个用例被跳过（skip）', { skip: '示例：功能尚未实现时先占位' }, () => {
  // skip 的用例会显示为 # SKIP，不计入失败，因此不影响退出码
  assert.equal(1, 2); // 永远不会执行到这里
});

test('这个用例标记为待办（todo）', { todo: '示例：已知未完成的行为' }, () => {
  // todo 表示"这个行为我知道还没做对"。它即使断言失败，也只显示为 ⚠ 和 # TODO，
  // 汇总里计入 todo 计数而不计入 fail，因此不会让进程退出码变成 1。
  // 你可以把下面的断言改成 assert.equal(isValidUsername('x'), true) 试试：
  // 会看到一条 todo 失败记录，但退出码依然是 0 —— 这正是它和普通失败的区别。
  assert.equal(isValidUsername('x'), false); // 2 位长度，当前实现判定为不合法
});

console.log('--- 5. 超时控制 ---');

test('慢操作也能被测试：设置 500ms 超时', { timeout: 500 }, async () => {
  // options.timeout 是这个用例的"最长存活时间"，超时会直接判定失败并抛出。
  // 真实项目里，一个没有超时的测试可能因为网络卡死而挂住整个 CI。
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(isValidUsername('bob_2024'), true);
});

console.log('--- 6. 运行说明 ---');
console.log('上面每个 test() 的 TAP 结果由 node:test 自动打印。');
console.log('全部通过时进程退出码为 0；任何一个失败则退出码为 1。');
console.log('这就是 CI 里"测试挂了就拦住合并"的实现原理。');
