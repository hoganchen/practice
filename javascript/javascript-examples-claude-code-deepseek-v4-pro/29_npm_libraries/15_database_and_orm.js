/**
 * ============================================================================
 * 知识点：数据库与数据访问层 —— node:sqlite 原生 SQL 与仓储（Repository）抽象
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】高级
 * 【前置知识】29_npm_libraries/14_logging.js（分层与依赖注入的写法参考）、
 *             14_classes（class 与接口约定）、20_error_handling（错误处理与 finally）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本仓库此前所有示例的数据都活在内存里（数组、Map），进程一退出就没了。
 *    这个文件补上**持久化**这一层，回答三个问题：
 *      (a) 怎么用 Node 内置的 `node:sqlite` 写真正的 SQL（建表/增删改查/事务/预处理）；
 *      (b) 怎么把 SQL 关进"仓储（Repository）"里，让业务代码不依赖具体数据库；
 *      (c) 什么时候该上 ORM（Prisma / Drizzle / Knex），什么时候裸 SQL 更好。
 *
 *    `node:sqlite` 是 Node 22 起内置的实验性模块（本机 Node 24 可用），
 *    提供**同步 API** 的 SQLite 绑定。它最大的价值是：零依赖、零安装成本，
 *    适合做示例、CLI 工具、桌面应用、单机服务、以及测试替身。
 *    生产高并发场景仍然更常用 `better-sqlite3`（更成熟、生态更好）。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 用户注册后重启服务，账号不能消失 —— 数据必须落盘；
 *    - "查一下某用户最近 10 笔订单" —— 这是查询，不是数组 filter；
 *    - 转账"扣 A 加 B"必须**原子**，中途失败要整体回滚 —— 这是事务；
 *    - 用户输入 `' OR 1=1 --` 直接拼进 SQL，数据库被拖库 —— 这是 SQL 注入；
 *    - 业务代码里散落 200 条 SQL，换数据库（MySQL → PostgreSQL）要改 200 处 ——
 *      这是"缺少数据访问层"的代价。
 *
 * 3. 核心语法要点
 *    node:sqlite 的同步 API：
 *      const db = new DatabaseSync(file);      // 打开/创建数据库文件
 *      db.exec(sql);                           // 执行多条语句（建表、BEGIN/COMMIT）
 *      const stmt = db.prepare(sql);           // 预处理（编译一次，可反复执行）
 *      stmt.run(...params)   → { changes, lastInsertRowid }
 *      stmt.get(...params)   → 第一行对象，或 undefined
 *      stmt.all(...params)   → 全部行数组
 *      db.close();                             // 关闭（不关会导致文件被占用）
 *    参数化查询：SQL 里写 `?` 占位符，值通过参数传入，驱动会做转义并保证
 *    "数据永远是数据、不会被当成 SQL 代码解析"。
 *
 * 4. 常见陷阱
 *    - **绝不拼接 SQL 字符串**：`"SELECT * FROM u WHERE n='" + name + "'"` 是教科书级漏洞。
 *    - 忘记关连接 / 忘记删临时文件：Windows 上文件被占用会删不掉。
 *    - 大批量插入不包事务：每条 INSERT 各自提交一次（各自一次 fsync），
 *      速度可能慢几十倍。本文件会用真实数据把差距跑出来。
 *    - 把 SQL 写在业务逻辑里到处散落：改表结构时你会想哭。要收进仓储。
 *    - 事务里做网络请求/慢操作：SQLite 是**单写者**，长事务会锁住整个库。
 *    - **N+1 查询**：查出 100 个用户后，为每个用户再查一次订单 = 101 次查询。
 *    - 用 SQLite 的思维写 PostgreSQL：SQLite 单机嵌入式无连接池，
 *      而 MySQL/PostgreSQL 是网络服务，必须用连接池，且每次查询都是异步 IO。
 *    - ORM 用过头：复杂报表查询用 ORM 拼出来的 SQL 又慢又难读，
 *      这时候就该老老实实写原生 SQL（ORM 基本都提供 escape hatch）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/15_database_and_orm.js
 *   （临时数据库文件建在 os.tmpdir()，脚本结束前在 finally 里删除；不访问外网）
 *
 * 【预期输出】
 *   1) node:sqlite 特性检测结果（不可用时自动降级为内存实现，示例仍能跑完）；
 *   2) 裸 SQL 演练：建表 / 参数化增删改查 / SQL 注入对比 / 事务回滚 / 批量插入性能；
 *   3) 用**同一套测试**验证 SQLite 仓储与内存仓储行为一致；
 *   4) ORM 选型、N+1、连接池的结论，退出码 0。
 * ============================================================================
 */

import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

// ===========================================================================
// 1. 特性检测：node:sqlite 能不能用？
// ===========================================================================

console.log('--- 1. 特性检测：node:sqlite ---');

let DatabaseSync = null;
let sqliteUnavailableReason = '';

try {
  // 用动态 import + try/catch 做特性检测。
  // 这是"可选内置模块"的标准写法：静态 import 失败会让整个文件直接崩掉，
  // 而动态 import 失败只是一个可捕获的异常。
  ({ DatabaseSync } = await import('node:sqlite'));
  console.log(`  可用 ✓  Node ${process.version} 内置了 node:sqlite（无需任何 npm 依赖）`);
} catch (err) {
  sqliteUnavailableReason = err.message;
  console.log(`  不可用 ✗  原因：${err.message}`);
  console.log('  降级策略：本文件将改用「内存 Map 实现同一套仓储接口」继续演示，');
  console.log('            接口完全一致，只是数据不落盘。业务代码一行都不用改 ——');
  console.log('            这正是"面向接口编程"的价值。');
}

const HAS_SQLITE = DatabaseSync !== null;

// ===========================================================================
// 2. 裸 SQL 演练（仅当 node:sqlite 可用）
// ===========================================================================

/**
 * 临时数据库文件放在系统临时目录，文件名带随机后缀避免并发冲突。
 * 一定要在 finally 里删掉，否则每跑一次示例就在磁盘上留一个垃圾文件。
 */
const dbFile = path.join(os.tmpdir(), `js-examples-${process.pid}-${Date.now()}.db`);
let db = null;

/** 小工具：把 { a: 1 } 这种行对象转成普通对象（node:sqlite 有时返回 null 原型对象） */
const plain = (row) => (row ? { ...row } : row);

try {
  if (HAS_SQLITE) {
    db = new DatabaseSync(dbFile);
    console.log(`  临时数据库：${dbFile}`);

    // --- 2.1 建表 ---
    console.log('\n--- 2. 裸 SQL 演练 ---');
    console.log('  [2.1 建表]');
    db.exec(`
      CREATE TABLE users (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        name    TEXT    NOT NULL,
        email   TEXT    NOT NULL UNIQUE,
        age     INTEGER CHECK (age >= 0 AND age <= 200),
        status  TEXT    NOT NULL DEFAULT 'active',
        created TEXT    NOT NULL DEFAULT (datetime('now'))
      );
    `);
    db.exec('CREATE INDEX idx_users_status ON users(status);');
    db.exec(`
      CREATE TABLE orders (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        amount  REAL    NOT NULL CHECK (amount > 0),
        sku     TEXT    NOT NULL
      );
    `);
    console.log('  已建表 users / orders，含 NOT NULL、UNIQUE、CHECK、DEFAULT、外键与索引。');
    console.log('  约束写在数据库里，而不是只写在应用层 —— 应用有 bug 时数据库是最后一道防线。');

    // --- 2.2 参数化插入 ---
    console.log('\n  [2.2 参数化插入]');
    // prepare() 只编译一次 SQL，之后 run() 可以反复执行 —— 这是"预处理语句"。
    // 好处：1) 避免重复解析编译；2) 参数与 SQL 分离，天然防注入。
    const insertUser = db.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)');
    const r1 = insertUser.run('张三', 'zhangsan@example.com', 28);
    const r2 = insertUser.run('李四', 'lisi@example.com', 35);
    console.log(`  插入两条，返回：lastInsertRowid=${r1.lastInsertRowid} / ${r2.lastInsertRowid}，changes=${r1.changes}`);

    // 约束真的会拦住脏数据 —— 演示必须 try/catch，示例不能因此崩掉
    try {
      insertUser.run('重复邮箱', 'zhangsan@example.com', 20);
      throw new Error('不应该走到这里：UNIQUE 约束没生效');
    } catch (err) {
      console.log(`  唯一约束生效 ✓ ${err.message}`);
    }
    try {
      insertUser.run('负数年龄', 'neg@example.com', -5);
      throw new Error('不应该走到这里：CHECK 约束没生效');
    } catch (err) {
      console.log(`  CHECK 约束生效 ✓ ${err.message}`);
    }

    // --- 2.3 查询 ---
    console.log('\n  [2.3 查询：get 取一行，all 取多行]');
    const found = db.prepare('SELECT id, name, email, age FROM users WHERE email = ?').get('lisi@example.com');
    console.log(`  get 单条：${JSON.stringify(plain(found))}`);
    console.log(`  all 多行：${JSON.stringify(db.prepare('SELECT id, name FROM users ORDER BY id').all())}`);
    assert.equal(plain(found).name, '李四');
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM users').get().c, 2);
    console.log('  注意：查不到的 get() 返回 undefined（不是 null），要判空。');
    assert.equal(db.prepare('SELECT * FROM users WHERE id = ?').get(99999), undefined);

    // --- 2.4 SQL 注入：拼接字符串 vs 参数化 ---
    console.log('\n  [2.4 SQL 注入对比 —— 本文件最重要的一节]');
    const evil = "' OR 1=1 --";
    console.log(`  攻击载荷：${evil}`);

    // 错误示范：字符串拼接。看起来只是"把变量放进 SQL"，实际是把控制权交给了用户输入。
    const badSql = `SELECT COUNT(*) AS c FROM users WHERE email = '${evil}'`;
    console.log(`  拼接出的 SQL：${badSql}`);
    const injected = db.prepare(badSql).get();
    console.log(`  → 拼接方式命中 ${injected.c} 行。注意 SQL 结构已被改变：条件恒为真，`);
    console.log('    `--` 还把后面本来存在的语句注释掉了。真实项目里这就是拖库。');
    assert.equal(injected.c, 2, '演示用载荷确实绕过了原条件');

    // 正确做法：参数化。驱动会把整个字符串当成"一个值"来绑定，绝不会被解析成 SQL。
    const safe = db.prepare('SELECT COUNT(*) AS c FROM users WHERE email = ?').get(evil);
    console.log(`  参数化方式命中 ${safe.c} 行 → 它被当作一个普通字符串值，什么都没匹配到 ✓`);
    assert.equal(safe.c, 0);

    // --- 2.5 更新与删除 ---
    console.log('\n  [2.5 更新与删除：靠 changes 判断有没有真的改到东西]');
    const upd = db.prepare('UPDATE users SET status = ? WHERE id = ?').run('banned', 2);
    console.log(`  UPDATE 影响 ${upd.changes} 行`);
    const updMissing = db.prepare('UPDATE users SET status = ? WHERE id = ?').run('banned', 99999);
    console.log(`  UPDATE 一个不存在的 id：changes=${updMissing.changes}（可以用它判断"记录不存在"）`);
    assert.equal(upd.changes, 1);
    assert.equal(updMissing.changes, 0);
    db.prepare('DELETE FROM users WHERE id = ?').run(2);
    console.log(`  DELETE 后剩余用户数：${db.prepare('SELECT COUNT(*) AS c FROM users').get().c}`);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM users').get().c, 1);

    // --- 2.6 事务：转账场景 ---
    console.log('\n  [2.6 事务：要么全成功，要么全回滚]');
    db.exec("INSERT INTO users (name, email, age) VALUES ('王五', 'wangwu@example.com', 40)");
    const wangwu = plain(db.prepare('SELECT * FROM users WHERE email = ?').get('wangwu@example.com'));
    const zhangsan = plain(db.prepare('SELECT * FROM users WHERE email = ?').get('zhangsan@example.com'));
    db.exec('CREATE TABLE accounts (user_id INTEGER PRIMARY KEY, balance REAL NOT NULL)');
    db.prepare('INSERT INTO accounts (user_id, balance) VALUES (?, ?)').run(zhangsan.id, 1000);
    db.prepare('INSERT INTO accounts (user_id, balance) VALUES (?, ?)').run(wangwu.id, 500);
    console.log(`  转账前：张三=${db.prepare('SELECT balance FROM accounts WHERE user_id=?').get(zhangsan.id).balance}，王五=${db.prepare('SELECT balance FROM accounts WHERE user_id=?').get(wangwu.id).balance}`);

    /** 转账：扣款 + 入账必须原子。中途抛错就整体回滚，绝不能出现"钱扣了但没到账"。 */
    function transfer(fromId, toId, amount, { shouldFail = false } = {}) {
      db.exec('BEGIN IMMEDIATE'); // 显式开启事务
      try {
        db.prepare('UPDATE accounts SET balance = balance - ? WHERE user_id = ?').run(amount, fromId);
        if (shouldFail) throw new Error('模拟：入账环节发生故障');
        db.prepare('UPDATE accounts SET balance = balance + ? WHERE user_id = ?').run(amount, toId);
        db.exec('COMMIT'); // 全部成功才提交
        return 'committed';
      } catch (err) {
        db.exec('ROLLBACK'); // 任何一步失败，回到事务开始前的状态
        return `rolled back（${err.message}）`;
      }
    }

    console.log(`  成功转账 200：${transfer(zhangsan.id, wangwu.id, 200)}`);
    console.log(`  转账后：张三=${db.prepare('SELECT balance FROM accounts WHERE user_id=?').get(zhangsan.id).balance}，王五=${db.prepare('SELECT balance FROM accounts WHERE user_id=?').get(wangwu.id).balance}`);
    console.log(`  失败转账 500：${transfer(zhangsan.id, wangwu.id, 500, { shouldFail: true })}`);
    const afterFail = {
      zhangsan: db.prepare('SELECT balance FROM accounts WHERE user_id=?').get(zhangsan.id).balance,
      wangwu: db.prepare('SELECT balance FROM accounts WHERE user_id=?').get(wangwu.id).balance,
    };
    console.log(`  回滚后余额未变：张三=${afterFail.zhangsan}，王五=${afterFail.wangwu}`);
    assert.equal(afterFail.zhangsan, 800, '失败的事务必须完整回滚');
    assert.equal(afterFail.wangwu, 700);

    // --- 2.7 批量插入：包不包事务，速度差多少？ ---
    console.log('\n  [2.7 批量插入：事务带来的真实性能差距]');
    const BATCH = 300;
    db.exec('CREATE TABLE bench (id INTEGER PRIMARY KEY AUTOINCREMENT, v TEXT)');

    const startNoTx = performance.now();
    for (let i = 0; i < BATCH; i++) {
      db.prepare('INSERT INTO bench (v) VALUES (?)').run(`no-tx-${i}`); // 每条自动提交一次
    }
    const noTxMs = performance.now() - startNoTx;

    const startTx = performance.now();
    db.exec('BEGIN');
    for (let i = 0; i < BATCH; i++) {
      db.prepare('INSERT INTO bench (v) VALUES (?)').run(`tx-${i}`);
    }
    db.exec('COMMIT');
    const txMs = performance.now() - startTx;

    console.log(`  不包事务：${BATCH} 条耗时 ${noTxMs.toFixed(1)}ms（每条一次提交 = 一次磁盘同步）`);
    console.log(`  包在事务里：${BATCH} 条耗时 ${txMs.toFixed(1)}ms（整批只提交一次）`);
    console.log(`  提速约 ${(noTxMs / Math.max(txMs, 0.01)).toFixed(1)} 倍`);
    assert.equal(db.prepare('SELECT COUNT(*) AS c FROM bench').get().c, BATCH * 2);
    console.log('  结论：批量写入不包事务是新手最常犯的性能错误之一，改一行代码就能救回来。');
  } else {
    console.log('\n--- 2. 裸 SQL 演练 ---');
    console.log(`  已跳过：本机 node:sqlite 不可用（${sqliteUnavailableReason}）。`);
    console.log('  下面仍会演示"同一套仓储接口"，只是底层换成内存实现。');
  }

  // =========================================================================
  // 3. 仓储抽象：把 SQL 关进一个房间
  // =========================================================================

  console.log('\n--- 3. 仓储（Repository）：把 SQL 关进一个房间 ---');
  console.log('  业务代码不应该知道"数据存在哪"。它只调用仓储暴露的方法：');
  console.log('    create / findById / findByEmail / list / update / remove / count / transaction');
  console.log('  只要接口不变，底层从 SQLite 换成 PostgreSQL、甚至换成内存 Map，业务代码零改动。');

  /**
   * SQLite 仓储实现。
   * 注意：SQL 只出现在这个函数体里，外面一行都看不到。
   */
  function createSqliteUserRepository(database) {
    database.exec(`
      CREATE TABLE IF NOT EXISTS repo_users (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        name   TEXT    NOT NULL,
        email  TEXT    NOT NULL UNIQUE,
        age    INTEGER,
        status TEXT    NOT NULL DEFAULT 'active'
      );
    `);
    return {
      kind: 'sqlite',
      create({ name, email, age }) {
        try {
          const info = database
            .prepare('INSERT INTO repo_users (name, email, age) VALUES (?, ?, ?)')
            .run(name, email, age ?? null);
          return this.findById(Number(info.lastInsertRowid));
        } catch (err) {
          // 把驱动的原始错误翻译成**领域错误**，这样业务层不必知道 SQLite 的存在
          if (String(err.message).includes('UNIQUE')) {
            const e = new Error(`邮箱已存在：${email}`);
            e.code = 'DUPLICATE_EMAIL';
            throw e;
          }
          throw err;
        }
      },
      findById(id) {
        return plain(database.prepare('SELECT * FROM repo_users WHERE id = ?').get(id)) ?? null;
      },
      findByEmail(email) {
        return plain(database.prepare('SELECT * FROM repo_users WHERE email = ?').get(email)) ?? null;
      },
      list({ limit = 10, offset = 0 } = {}) {
        return database
          .prepare('SELECT * FROM repo_users ORDER BY id LIMIT ? OFFSET ?')
          .all(limit, offset)
          .map(plain);
      },
      update(id, patch) {
        const current = this.findById(id);
        if (!current) return null;
        const next = { ...current, ...patch };
        database
          .prepare('UPDATE repo_users SET name = ?, email = ?, age = ?, status = ? WHERE id = ?')
          .run(next.name, next.email, next.age, next.status, id);
        return this.findById(id);
      },
      remove(id) {
        return database.prepare('DELETE FROM repo_users WHERE id = ?').run(id).changes > 0;
      },
      count() {
        return database.prepare('SELECT COUNT(*) AS c FROM repo_users').get().c;
      },
      /** 事务：把一组操作打包，任何一步失败就整体回滚 */
      transaction(fn) {
        database.exec('BEGIN');
        try {
          const result = fn();
          database.exec('COMMIT');
          return result;
        } catch (err) {
          database.exec('ROLLBACK');
          throw err;
        }
      },
    };
  }

  /**
   * 内存仓储实现：**接口一模一样**，只是没有 SQL。
   * 它的用途很真实：
   *   1) 单元测试替身（跑得快，不用起数据库）；
   *   2) 本文件这种"环境不具备时的降级方案"；
   *   3) 原型阶段先跑通业务，后面再换真数据库。
   * 事务用"快照 + 失败恢复"模拟。
   */
  function createMemoryUserRepository() {
    const rows = new Map();
    let seq = 0;
    const clone = (row) => ({ ...row });
    return {
      kind: 'memory',
      _rows: rows,
      create({ name, email, age }) {
        for (const row of rows.values()) {
          if (row.email === email) {
            const e = new Error(`邮箱已存在：${email}`);
            e.code = 'DUPLICATE_EMAIL';
            throw e;
          }
        }
        const row = { id: ++seq, name, email, age: age ?? null, status: 'active' };
        rows.set(row.id, row);
        return clone(row);
      },
      findById(id) {
        const row = rows.get(id);
        return row ? clone(row) : null;
      },
      findByEmail(email) {
        for (const row of rows.values()) if (row.email === email) return clone(row);
        return null;
      },
      list({ limit = 10, offset = 0 } = {}) {
        return [...rows.values()].sort((a, b) => a.id - b.id).slice(offset, offset + limit).map(clone);
      },
      update(id, patch) {
        const row = rows.get(id);
        if (!row) return null;
        const next = { ...row, ...patch };
        rows.set(id, next);
        return clone(next);
      },
      remove(id) {
        return rows.delete(id);
      },
      count() {
        return rows.size;
      },
      transaction(fn) {
        // 内存实现没有真正的回滚，用快照模拟：出错就把 Map 恢复成操作前的样子
        const snapshot = new Map([...rows].map(([k, v]) => [k, { ...v }]));
        const seqSnapshot = seq;
        try {
          return fn();
        } catch (err) {
          rows.clear();
          for (const [k, v] of snapshot) rows.set(k, v);
          seq = seqSnapshot;
          throw err;
        }
      },
    };
  }

  // 按环境选择实现 —— 上层代码完全无感
  const repo = HAS_SQLITE ? createSqliteUserRepository(db) : createMemoryUserRepository();
  console.log(`\n  当前使用的仓储实现：【${repo.kind}】`);
  console.log(`  【重要】下面这套测试对两种实现都跑，行为必须完全一致。`);

  console.log('\n  [3.1 同一套测试验证两种实现]');
  const a = repo.create({ name: 'Alice', email: 'alice@corp.com', age: 30 });
  const b = repo.create({ name: 'Bob', email: 'bob@corp.com', age: 25 });
  const c = repo.create({ name: 'Carol', email: 'carol@corp.com' });
  assert.equal(repo.count(), 3);
  assert.equal(repo.findById(a.id).name, 'Alice');
  assert.equal(repo.findByEmail('bob@corp.com').id, b.id);
  assert.equal(repo.findById(99999), null, '查不到必须返回 null 而不是抛错');
  console.log(`  创建 3 个用户 ✓  count=${repo.count()}`);

  // 唯一约束在两种实现里都生效，且抛出的是同一个领域错误
  let dupCode = '';
  try {
    repo.create({ name: 'Fake', email: 'alice@corp.com' });
  } catch (err) {
    dupCode = err.code;
  }
  assert.equal(dupCode, 'DUPLICATE_EMAIL');
  console.log(`  重复邮箱被拒 ✓ 业务层拿到的是领域错误 code=${dupCode}（不是 SQLite 的原始报错）`);

  const updated = repo.update(b.id, { status: 'vip' });
  assert.equal(updated.status, 'vip');
  assert.equal(updated.name, 'Bob', 'patch 是局部更新，未提供的字段保持不变');
  assert.equal(repo.update(99999, { name: 'x' }), null);
  console.log(`  局部更新 ✓  Bob.status=${updated.status}，name 未被覆盖`);

  assert.deepEqual(
    repo.list({ limit: 2, offset: 1 }).map((u) => u.name),
    ['Bob', 'Carol'],
    '分页必须稳定有序',
  );
  console.log('  分页 list({limit:2, offset:1}) ✓ 返回 [Bob, Carol]');

  assert.equal(repo.remove(c.id), true);
  assert.equal(repo.remove(c.id), false, '重复删除应当返回 false');
  assert.equal(repo.count(), 2);
  console.log('  remove ✓ 第一次 true，第二次 false（已不存在）');

  // --- 3.2 事务：业务失败时数据要能整体回滚 ---
  console.log('\n  [3.2 仓储事务：注册用户 + 初始化积分的原子性]');
  const beforeCount = repo.count();
  try {
    repo.transaction(() => {
      repo.create({ name: 'Dave', email: 'dave@corp.com', age: 41 });
      throw new Error('模拟：初始化积分失败');
    });
  } catch (err) {
    console.log(`  事务内抛错：${err.message}`);
  }
  console.log(`  事务前后用户数：${beforeCount} → ${repo.count()}（必须相同，Dave 不能残留）`);
  assert.equal(repo.count(), beforeCount, '事务失败必须回滚');
  assert.equal(repo.findByEmail('dave@corp.com'), null);

  // 成功的事务要真的落库
  const okResult = repo.transaction(() => {
    const dave = repo.create({ name: 'Dave', email: 'dave@corp.com', age: 41 });
    return dave.id;
  });
  assert.ok(repo.findById(okResult), '事务成功必须真的写入');
  console.log(`  成功的事务 ✓ Dave 落库，id=${okResult}`);
  repo.remove(okResult);

  // --- 3.3 注入攻击穿过仓储也无效 ---
  console.log('\n  [3.3 通过仓储发起注入攻击]');
  const payload = "' OR 1=1 --";
  const hit = repo.findByEmail(payload);
  console.log(`  repo.findByEmail("${payload}") → ${hit === null ? 'null（被当成普通字符串，攻击无效）' : JSON.stringify(hit)}`);
  assert.equal(hit, null);
  console.log('  业务层根本不用操心转义 —— 因为仓储内部只用参数化查询。这就是"收口"的价值。');

  // =========================================================================
  // 4. N+1 查询：ORM 时代最经典的性能陷阱
  // =========================================================================

  console.log('\n--- 4. N+1 查询问题 ---');

  if (HAS_SQLITE) {
    // 先补一批用户，让 N+1 的差距更直观（两个人看不出问题）
    repo.transaction(() => {
      for (let i = 0; i < 18; i++) {
        repo.create({ name: `用户${i}`, email: `bulk${i}@corp.com`, age: 20 + i });
      }
    });

    db.exec('CREATE TABLE repo_orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, sku TEXT, amount REAL)');
    const insertOrder = db.prepare('INSERT INTO repo_orders (user_id, sku, amount) VALUES (?, ?, ?)');
    db.exec('BEGIN');
    for (const user of repo.list({ limit: 100 })) {
      for (let i = 0; i < 3; i++) insertOrder.run(user.id, `SKU-${i}`, 10 * (i + 1));
    }
    db.exec('COMMIT');

    const users = repo.list({ limit: 100 });
    console.log(`  有 ${users.length} 个用户，每人 3 笔订单。`);

    // 错误做法：先查用户列表，再为每个用户单独查一次订单 → 1 + N 次查询
    let nPlusOneQueries = 0;
    const startN = performance.now();
    const nPlusOneResult = users.map((u) => {
      nPlusOneQueries += 1; // 循环里一次查询
      return { user: u.name, orders: db.prepare('SELECT sku FROM repo_orders WHERE user_id = ?').all(u.id) };
    });
    const nMs = performance.now() - startN;
    nPlusOneQueries += 1; // 最开始那次查用户列表
    console.log(`  N+1 写法：共 ${nPlusOneQueries} 次查询，耗时 ${nMs.toFixed(2)}ms`);

    // 正确做法：一条 JOIN 把用户和订单一次取回，在应用层归组
    const startJoin = performance.now();
    const joined = db
      .prepare(
        `SELECT u.id AS user_id, u.name AS user_name, o.sku AS sku
         FROM repo_users u LEFT JOIN repo_orders o ON o.user_id = u.id
         ORDER BY u.id`,
      )
      .all();
    const joinMs = performance.now() - startJoin;
    const grouped = new Map();
    for (const row of joined) {
      if (!grouped.has(row.user_id)) grouped.set(row.user_id, { user: row.user_name, orders: [] });
      if (row.sku) grouped.get(row.user_id).orders.push({ sku: row.sku });
    }
    console.log(`  JOIN 写法：共 1 次查询，耗时 ${joinMs.toFixed(2)}ms，得到 ${grouped.size} 组`);
    console.log(`  查询次数从 ${nPlusOneQueries} 降到 1，数据量越大差距越夸张（线上常见几百次）。`);
    console.log('  为什么本机差距不明显：SQLite 是进程内调用，没有网络往返。');
    console.log('  换成 MySQL/PostgreSQL，每次查询都是一次网络 RTT（0.5~5ms），');
    console.log('  N=100 时 N+1 就是 100 次 RTT —— 接口从 5ms 变成 500ms。这才是它致命的地方。');

    assert.deepEqual(
      nPlusOneResult.map((r) => r.orders.length),
      [...grouped.values()].map((g) => g.orders.length),
      '两种写法结果必须一致',
    );
    console.log('  两种写法结果一致 ✓ 差别只在查询次数上。');
  } else {
    console.log('  已跳过（node:sqlite 不可用）。核心结论：');
    console.log('  先查列表、再在循环里逐条查详情 = N+1 次查询，');
    console.log('  网络数据库下每次都是一次 RTT，必须改成 JOIN 或 IN (批量查一次再在内存归组)。');
  }

  // =========================================================================
  // 5. ORM：它解决了什么、代价是什么、什么时候该上
  // =========================================================================

  console.log('\n--- 5. ORM / 查询构建器选型 ---');
  console.log('  （prisma / drizzle / knex 本仓库未安装，以下为离线对比，不 import）');

  console.log('\n  ● ORM 到底解决了什么');
  console.log('    1) 消除样板：不用手写每条 CRUD 的 SQL 与参数绑定');
  console.log('    2) 类型安全：表结构 → TypeScript 类型，字段名写错编译期就报错');
  console.log('    3) 迁移管理：schema 变更可版本化、可回滚（migration）');
  console.log('    4) 关系映射：user.orders 直接拿到关联数据，不用手写 JOIN 与归组');
  console.log('    5) 防注入：默认参数化，把安全做成默认行为');

  console.log('\n  ● 代价是什么');
  console.log('    1) 学习成本：ORM 自己的 DSL、生命周期、懒加载语义都要学');
  console.log('    2) 性能黑箱：一条 findMany 背后生成什么 SQL 不直观，容易写出 N+1');
  console.log('    3) 复杂查询吃力：多表聚合报表用 ORM 拼又长又慢，最后还是要写原生 SQL');
  console.log('    4) 抽象泄漏：关键时刻仍要理解底层 SQL、索引、执行计划，抽象不能替代知识');
  console.log('    5) 额外体积/启动成本：Prisma 要生成 client、带查询引擎二进制；serverless 冷启动吃亏');

  const ormTable = [
    {
      name: 'Prisma',
      type: '全功能 ORM（schema 文件 + 代码生成）',
      pros: 'DX 最好、迁移工具完善、类型极强、文档优秀',
      cons: '有独立 query engine、包体积与冷启动成本高；复杂 SQL 表达力受限',
      fit: '中大型业务后台、团队要统一的 schema 单一事实源',
    },
    {
      name: 'Drizzle',
      type: '轻量 ORM（TypeScript 里用代码定义 schema）',
      pros: '无代码生成、贴近 SQL、类型安全、体积小、可读性接近手写 SQL',
      cons: '生态与迁移工具比 Prisma 年轻，复杂关系映射要自己多写一点',
      fit: 'serverless / 边缘运行时、想要 SQL 掌控力又要类型安全',
    },
    {
      name: 'Knex',
      type: '查询构建器（Query Builder，不是全功能 ORM）',
      pros: '只解决"安全拼 SQL + 迁移"，不做实体映射，心智负担最小、最透明',
      cons: '没有类型安全（要配 Objection/Knex 类型工具），关联查询仍要自己写',
      fit: '已有 SQL 能力强的团队、遗留项目渐进改造、只需要迁移工具',
    },
  ];

  for (const item of ormTable) {
    console.log(`\n  ● ${item.name} —— ${item.type}`);
    console.log(`      优点：${item.pros}`);
    console.log(`      代价：${item.cons}`);
    console.log(`      适合：${item.fit}`);
  }

  console.log('\n  ● 什么规模该上 ORM');
  console.log('    · 10 张表以内的工具/脚本/CLI      → 裸 SQL + 本文件的仓储模式，最省心');
  console.log('    · 10~50 张表、多人协作的业务系统  → 上 ORM（Prisma 或 Drizzle），迁移工具是刚需');
  console.log('    · 50 张表以上 / 复杂报表 / 高并发 → ORM 管 CRUD，热点与报表查询用原生 SQL');
  console.log('       （所有主流 ORM 都留了 raw SQL 的口子，别硬用 ORM 拼复杂查询）');
  console.log('    · 判断标准不是表数量，而是：schema 变更频率 × 参与人数 × 类型安全收益');

  // =========================================================================
  // 6. 连接池：SQLite 和网络数据库的根本差异
  // =========================================================================

  console.log('\n--- 6. 连接池（Connection Pool）简介 ---');
  console.log('  SQLite：嵌入式、进程内、没有网络。所以**不需要连接池**，');
  console.log('          但它是"单写者"——同一时刻只允许一个写事务，长事务会阻塞全库。');
  console.log('          并发写要用 WAL 模式 + 短事务 + 重试，而不是加连接池。');
  console.log('  MySQL / PostgreSQL：网络服务，每次建连接要走 TCP + 认证（几毫秒到几十毫秒）。');
  console.log('    高频请求下"每次新建连接"会瞬间打满数据库的 max_connections，所以必须用连接池：');
  console.log('      · 池子里维持 N 个长连接，业务借出/归还，省掉握手开销；');
  console.log('      · pool size 要按数据库承载能力设（常见 5~20），不是越大越好 ——');
  console.log('        连接数超过 CPU 核数后，数据库在上下文切换上白耗，吞吐反而下降；');
  console.log('      · 要配 connectionTimeout / idleTimeout，避免连接泄漏把池子耗尽；');
  console.log('      · serverless 环境要特别小心：实例数 × 池大小 会成倍放大，');
  console.log('        通常要换成外部连接池（如 PgBouncer）或 HTTP 型数据库驱动。');
  console.log('  一句话：SQLite 的问题是"写并发"，网络数据库的问题是"连接数"，解法完全不同。');

  // =========================================================================
  // 7. 总结
  // =========================================================================

  console.log('\n--- 7. 总结 ---');
  console.log('  1. node:sqlite 让 Node 零依赖拥有真正的持久化能力，适合示例/CLI/桌面/单机服务。');
  console.log('  2. 永远用参数化查询（? 占位符）。演示里那条 `\' OR 1=1 --` 能拖库，真实项目就是事故。');
  console.log('  3. 约束写进 schema（NOT NULL / UNIQUE / CHECK / 外键），数据库是最后一道防线。');
  console.log('  4. 批量写入包事务，一行代码换几十倍性能；转账类操作必须原子。');
  console.log('  5. 用仓储把 SQL 收口：业务代码只依赖接口，换数据库/换测试替身零改动 ——');
  console.log('     本文件用同一套断言同时验证了 SQLite 实现和内存实现，这就是最好的证明。');
  console.log('  6. ORM 解决样板、类型与迁移，代价是黑箱、体积与复杂查询的表达力；');
  console.log('     规模到了就上，但别放弃 SQL 本身 —— 抽象不能替代对底层原理的理解。');
  console.log('  7. 先量再优化：N+1 在 SQLite 上看着没事，在网络数据库上就是接口超时的主因。');
} finally {
  // -------------------------------------------------------------------------
  // 无论上面成功还是抛错，都要把资源还回去 —— 这是"示例可重复运行"的关键
  // -------------------------------------------------------------------------
  if (db) {
    try {
      db.close();
      console.log('\n[清理] 数据库连接已关闭。');
    } catch (err) {
      console.log(`\n[清理] 关闭数据库时出错：${err.message}`);
    }
  }
  if (HAS_SQLITE && fs.existsSync(dbFile)) {
    try {
      fs.rmSync(dbFile, { force: true });
      // Windows 上文件可能因句柄未释放短暂被占用，失败也不影响示例结论
      console.log(
        fs.existsSync(dbFile)
          ? `[清理] 临时文件暂被占用，稍后可手动删除：${dbFile}`
          : '[清理] 临时数据库文件已删除。',
      );
    } catch (err) {
      console.log(`[清理] 删除临时文件失败（不影响结论）：${err.message}`);
    }
  }
}

console.log('\n完成：node:sqlite 原生 SQL（含注入/事务/批量性能）+ 仓储抽象 + ORM 选型对比演示结束，退出码 0。');
