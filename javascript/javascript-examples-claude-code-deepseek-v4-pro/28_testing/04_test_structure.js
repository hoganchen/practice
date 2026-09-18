/**
 * ============================================================================
 * 知识点：测试结构 —— describe/it 风格、setup/teardown、beforeEach
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试基础
 * 【难度等级】入门
 * 【前置知识】28_testing/02_node_test_runner.js、28_testing/03_assert_module.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    node:test 提供两套书写风格，它们可以混用：
 *      (a) 扁平风格：test('名字', fn)             —— 每个用例一行，最简单
 *      (b) 套件风格：describe('分组', () => { it('用例', fn) })
 *          describe/it 是 BDD（行为驱动开发）风格的词汇，来自 Mocha / Jasmine，
 *          后来被 Jest / Vitest / node:test 一致沿用，是前端与 Node 社区最通用的写法。
 *    两者能力等价：describe 只是"给一组用例加个名字和执行上下文"。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    - 分组让测试报告可读："用户模块 > 注册 > 邮箱重复时应返回 409"比
 *      "注册邮箱重复"这种扁平名字清晰得多，失败时一眼知道是哪个功能坏了。
 *    - 分组带来钩子（hook）作用域：某个分组里的每个用例都需要一份"干净的数据"，
 *      这正是 beforeEach 的用武之地。
 *    - 真实项目里最常见的四个钩子：
 *        before      整个分组开始前执行一次   —— 建立昂贵资源（数据库连接、HTTP 服务器）
 *        after       整个分组结束后执行一次   —— 释放资源（关闭连接、清理临时文件）
 *        beforeEach  每个用例前执行          —— 重置状态（清空内存表、还原 mock）
 *        afterEach   每个用例后执行          —— 清理副作用（删除临时文件、恢复环境变量）
 *
 * 3. 核心语法要点
 *    import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
 *    describe(name, fn) / it(name, fn)        定义分组与用例
 *    it 内部同样可以 await、可以有 t 上下文、可以用 t.test 定义子测试
 *    describe 可以嵌套，钩子按"由外到内 / 由内到外"的顺序执行
 *    多个 beforeEach 的执行顺序：外层 describe 的 beforeEach 先跑，内层后跑；
 *    多个 afterEach 则相反：内层先跑，外层后跑（与进入的栈顺序对称）。
 *    钩子里抛错会让该分组的所有用例失败 —— 这通常意味着环境准备失败。
 *
 * 4. 常见陷阱
 *    - 用 before 准备"会被修改的数据"：数据被第一个用例改脏，后续用例互相污染。
 *      可变状态必须放 beforeEach。
 *    - 忘记 afterEach 清理：临时文件、全局变量、定时器泄漏到别的用例，导致偶发失败。
 *    - 在 describe 回调里直接跑异步逻辑：describe 的回调是同步收集阶段，
 *      需要异步准备就放到 before 钩子里并 await。
 *    - 依赖用例执行顺序：node:test 默认串行执行同一文件内的用例，
 *      但用例之间必须完全独立，否则并发运行（--test-concurrency）时会崩。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/04_test_structure.js
 *
 * 【预期输出】
 *   打印 TAP 结果，包含分组嵌套、钩子执行顺序日志（✔ 前缀）与全部通过的汇总。
 *   退出码 0。
 * ============================================================================
 */

import { describe, it, test, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// 被测代码：一个内存版用户仓库（真实项目里这就是 DAO / Repository 层）
// ---------------------------------------------------------------------------

class UserRepository {
  constructor() {
    /** @type {Map<number, {id: number, email: string, name: string}>} */
    this.users = new Map();
    /** 自增主键，模拟数据库的 AUTO_INCREMENT */
    this.nextId = 1;
  }

  /**
   * 新增用户，邮箱重复时抛错（模拟数据库的唯一索引冲突）。
   * @param {{email: string, name: string}} input
   */
  create(input) {
    for (const user of this.users.values()) {
      if (user.email === input.email) {
        const error = new Error('邮箱已存在');
        error.statusCode = 409; // 409 Conflict，REST API 里的标准状态码
        throw error;
      }
    }
    const user = { id: this.nextId, email: input.email, name: input.name };
    this.nextId += 1;
    this.users.set(user.id, user);
    return user;
  }

  /** 按 id 查询，找不到返回 undefined */
  findById(id) {
    return this.users.get(id);
  }

  /** 返回全部用户（数组形式） */
  findAll() {
    return [...this.users.values()];
  }

  /** 按 id 删除，返回是否删除了记录 */
  remove(id) {
    return this.users.delete(id);
  }

  /** 当前用户数量 */
  get size() {
    return this.users.size;
  }
}

// ---------------------------------------------------------------------------
// 演示：钩子执行顺序日志
// ---------------------------------------------------------------------------

// 这个数组用来记录钩子的执行顺序，最后一次性打印出来，
// 让"由外到内进入、由内到外退出"的规则看得见。真实项目里不需要这东西。
const hookLog = [];

console.log('--- 1. 分组用例开始（TAP 结果由 node:test 输出）---');
console.log('说明：describe 的回调是"同步收集阶段"，用例会在收集完成后才真正执行。');
console.log('');

// describe 定义分组。可以看作"测试报告里的一级标题"。
describe('UserRepository（内存用户仓库）', () => {
  /** @type {UserRepository} */
  let repo;

  // before：整个分组开始前执行一次。
  // 适合放"昂贵且只读/可复用"的准备动作。这里没有昂贵资源，
  // 但真实项目里常常是 new ConnectionPool()、await startTestServer() 这类。
  before(() => {
    hookLog.push('before    [外层] 分组开始（真实项目里：建立数据库连接/启动测试服务器）');
  });

  // after：整个分组结束后执行一次，用来释放资源。
  // 必须和 before 成对出现，否则进程可能因为句柄未关闭而无法退出。
  after(() => {
    hookLog.push('after     [外层] 分组结束（真实项目里：关闭连接/释放临时目录）');
  });

  // beforeEach：每个用例之前执行。这里是"重置状态"的典型场景 ——
  // 每个用例都拿到一个全新的、空的仓库，用例之间零污染。
  beforeEach(() => {
    repo = new UserRepository();
    hookLog.push('beforeEach[外层] 重置 repo（保证每个用例从空仓库开始）');
  });

  // afterEach：每个用例之后执行。
  afterEach(() => {
    hookLog.push('afterEach [外层] 清理 repo 引用');
    repo = null; // 主动断开引用，避免下一个用例误用上一个用例的数据
  });

  // ---------------------------------------------------------------
  // 嵌套分组：描述"创建用户"这一族行为
  // ---------------------------------------------------------------
  describe('create()', () => {
    beforeEach(() => {
      hookLog.push('  beforeEach[内层] 预置一条基础数据 admin@example.com');
      // 注意：这里可以安全地预置数据，因为外层 beforeEach 已经先跑过、repo 已被重置
      repo.create({ email: 'admin@example.com', name: '管理员' });
    });

    afterEach(() => {
      hookLog.push('  afterEach [内层] 内层清理');
    });

    it('能创建用户并分配自增 id', () => {
      const user = repo.create({ email: 'alice@example.com', name: 'Alice' });
      // 因为内层 beforeEach 预置了一条，所以这条的 id 是 2
      assert.strictEqual(user.id, 2);
      assert.strictEqual(user.email, 'alice@example.com');
      assert.strictEqual(repo.size, 2);
    });

    it('邮箱重复时抛出 409 错误', () => {
      // 用内层 beforeEach 预置的那条数据来触发冲突
      assert.throws(
        () => repo.create({ email: 'admin@example.com', name: '另一个管理员' }),
        (error) => {
          assert.strictEqual(error.statusCode, 409);
          return true;
        },
      );
      // 断言"创建失败没有污染数据"：数量仍然是 1
      assert.strictEqual(repo.size, 1);
    });

    it('用例之间相互独立：前两个用例的数据不会残留到这里', () => {
      // 如果 beforeEach 写错成 before，这里就会失败 —— 这条用例就是"守护 beforeEach"的哨兵
      assert.strictEqual(repo.size, 1, '每个用例都应从"只有一条预置数据"开始');
      assert.deepStrictEqual(
        repo.findAll().map((u) => u.email),
        ['admin@example.com'],
      );
    });
  });

  // ---------------------------------------------------------------
  // 嵌套分组：描述"查询与删除"
  // ---------------------------------------------------------------
  describe('findById() / findAll() / remove()', () => {
    it('findById 命中时返回用户对象', () => {
      const created = repo.create({ email: 'bob@example.com', name: 'Bob' });
      // deepStrictEqual 是断言返回值的正确方式：比较内容而不是引用
      assert.deepStrictEqual(repo.findById(created.id), {
        id: created.id,
        email: 'bob@example.com',
        name: 'Bob',
      });
    });

    it('findById 未命中时返回 undefined', () => {
      assert.strictEqual(repo.findById(9999), undefined);
    });

    it('findAll 返回全部用户，顺序为插入顺序', () => {
      repo.create({ email: 'u1@example.com', name: 'U1' });
      repo.create({ email: 'u2@example.com', name: 'U2' });
      assert.deepStrictEqual(
        repo.findAll().map((u) => u.email),
        ['u1@example.com', 'u2@example.com'],
      );
    });

    it('remove 删除成功返回 true，重复删除返回 false', () => {
      const created = repo.create({ email: 'gone@example.com', name: 'Gone' });
      assert.strictEqual(repo.remove(created.id), true);
      assert.strictEqual(repo.remove(created.id), false, '第二次删除应返回 false');
      assert.strictEqual(repo.size, 0);
    });
  });
});

// ---------------------------------------------------------------------------
// 最后一个用例：把钩子执行顺序打印出来
// ---------------------------------------------------------------------------
// 它是一个放在所有 describe 之后的顶层 test，因此会在前面的套件跑完后执行。
// 真实的 node:test 运行器保证同一文件内的用例按注册顺序串行执行。
test('附：钩子执行顺序观察', () => {
  const lines = ['观察到的钩子调用顺序（外层 -> 内层，退出时反向）：', ...hookLog.map((l) => `  ${l}`)];
  // 交给 t.diagnostic 打印，这样它出现在 TAP 输出里而不会被 TAP 解析器当成干扰
  console.log('');
  console.log('--- 2. 钩子执行顺序 ---');
  console.log(lines.join('\n'));
  console.log('');
  console.log('规律总结：');
  console.log('  进入顺序：before(外) -> beforeEach(外) -> beforeEach(内) -> 用例体');
  console.log('  退出顺序：afterEach(内) -> afterEach(外) -> ... -> after(外)');
  console.log('  可复用的只读资源用 before；会被修改的状态一律放 beforeEach。');

  // 断言日志确实记录到了东西，避免这个"观察用例"本身不产生任何验证
  assert.ok(hookLog.length > 0, '钩子应当被调用过');
  assert.ok(hookLog.some((l) => l.includes('beforeEach[内层]')), '内层 beforeEach 应当执行过');
});

console.log('--- 3. 说明 ---');
console.log('上面的 describe/it 结构会被 node:test 收集，并在收集完成后串行执行。');
console.log('顶层 test() 与 describe/it 可以混用，它们共享同一个运行器。');
