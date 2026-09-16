/**
 * ============================================================================
 * 知识点：SQL 注入的原理与防御 —— 参数化查询是"结构与数据分离"，不是"转义字符"
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/01_input_validation.js、03_sql_injection.js 前的 02_xss_prevention.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    SQL 注入（SQL Injection）指的是：用户输入被当成了 **SQL 语句的一部分** 去解析，
 *    而不是被当作 **一个值**。攻击者因此可以改写查询的语义，例如：
 *      - 绕过登录：不知道密码也能登进管理后台；
 *      - 越权读取：把别的用户、别的表的数据一起 SELECT 出来；
 *      - 篡改/删除：UPDATE / DELETE / DROP（取决于驱动是否允许多语句）；
 *      - 盲注：通过"页面正常/异常"一点点把数据库内容猜出来。
 *    它的根因只有一句话：**把数据和代码拼在了同一个字符串里**。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) SQL 注入常年位居 OWASP Top 10，因为它后果最重（直接拖库）且最容易被写出。
 *    (b) 只要有一处"手写拼接 SQL"，整个数据库就暴露了 —— 它不像 XSS 那样受限于单个页面。
 *    (c) 用户的搜索框、排序字段、筛选条件、分页参数、报表导出条件，全是高发入口。
 *    (d) 防御成本极低（改成参数化写法只改几行），但补救成本极高（数据泄漏无法撤回）。
 *
 * 3. 核心语法要点
 *    (a) **参数化查询（Prepared Statement / 占位符）**：
 *        SQL 文本里写 `?`（或 `$1`、`@p1`），值通过数组单独传进去：
 *          db.query('SELECT * FROM users WHERE username = ? AND password = ?', [u, p])
 *        驱动会先把 SQL 文本发给数据库**编译成执行计划**（此时结构已定死），
 *        再把参数作为**纯数据**绑定进去。所以参数里无论出现什么字符，
 *        都不可能改变 SQL 的结构 —— 这就是"结构与数据分离"。
 *        注意：**它的原理不是"转义特殊字符"**。（见小节 5 的进一步说明）
 *    (b) 预编译语句还有性能收益：同一模板多次执行可复用执行计划。
 *    (c) **标识符（表名、列名、ORDER BY 的字段、ASC/DESC）不能参数化**：
 *        因为参数化绑定的是"值"，而标识符是"结构"。这类地方必须用**白名单**校验：
 *          const SORTABLE = { created_at: 'created_at', name: 'name' };
 *          const col = SORTABLE[userInput]; if (!col) throw new Error('非法排序字段');
 *    (d) ORM / Query Builder 也不免疫：它们的正常 API（Where/WhereIn）通常安全，
 *        但一旦你用了"原生 SQL 片段"接口（如 Sequelize 的 sequelize.query、
 *        TypeORM 的 query、Prisma 的 $queryRawUnsafe），拼接同样会中招。
 *    (e) 存储过程内部若用动态 SQL（EXECUTE IMMEDIATE '...' || 参数）同样可注入。
 *    (f) 配套加固（不替代参数化）：数据库账号最小权限（只给需要的表/操作）、
 *        关闭多语句、错误信息不外泄（见 08 篇）、WAF 作为补充而非依赖。
 *
 * 4. 常见陷阱
 *    - 只给"字符串参数"加引号就以为安全：`WHERE id = ${id}` 里的数字参数不加引号时，
 *      `1 OR 1=1` 直接就成立了；加了引号也仍可被 `\'` 之类的字符逃逸（视数据库与字符集）。
 *    - 自己写"转义函数"（把 ' 换成 ''）：不同数据库、不同字符集（GBK 宽字节）、
 *      不同转义模式（NO_BACKSLASH_ESCAPES）下行为不一致，早晚出事。用参数化，别用转义。
 *    - LIKE 查询里的通配符：`WHERE name LIKE '%${q}%'` 要改成
 *      `WHERE name LIKE ?` 并把 `'%' + q.replace(/[%_]/g, ...) + '%'` 作为参数传进去
 *      —— 通配符需要"转义为字面量"，而这才是唯一需要 '转义' 的地方。
 *    - IN 子句：不能写 `IN (?)` 就以为能传数组，必须按数组长度生成 `?,?,?` 占位符
 *      （占位符个数由**代码**决定，不能由用户输入决定）。
 *    - 排序/表名/列名用参数化占位符：会报语法错误（因为那是结构位置），必须白名单。
 *    - 报错信息直接返回给前端：把 SQL 语句、表结构、数据库版本全泄漏了（08 篇详述）。
 *    - 以为"输入校验"能代替参数化：校验只能挡住"你想到的坏输入"，参数化是"结构性免疫"。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/03_sql_injection.js
 *
 * 【预期输出】
 *   用一个"手写的模拟 SQL 解释器 + 内存数组假数据库"（不连任何真实数据库、
 *   不 import 任何数据库驱动）演示三类注入：经典 OR 绕过、注释截断绕过密码、
 *   以及排序字段注入；再对同样载荷跑参数化查询，输出"参数被当成纯数据"的结果对比。
 *   全程退出码 0。
 * ============================================================================
 */

// ============================================================================
// 小节 0：搭一个"内存假数据库"和一个"手写迷你 SQL 解释器"
// ============================================================================
console.log('--- 0. 准备：内存假数据库 + 手写迷你 SQL 解释器 ---');
console.log('  说明：本文件不连接任何真实数据库、不 import 任何数据库驱动。');
console.log('        下面这个 miniSql 只支持一个极小的 SQL 子集（SELECT ... WHERE 等值/比较），');
console.log('        目的只是把"用户输入进入 SQL 解析流程"这件事如实模拟出来。\n');

// 假数据库：就是几个内存数组
const FAKE_DB = {
  users: [
    { id: 1, username: 'alice', password: 'alice_pw', role: 'user', email: 'alice@example.com' },
    { id: 2, username: 'bob', password: 'bob_pw', role: 'user', email: 'bob@example.com' },
    { id: 3, username: 'admin', password: 'S3cr3t!', role: 'admin', email: 'admin@example.com' },
  ],
};
console.log(`  假数据库 users 表共 ${FAKE_DB.users.length} 行：`);
for (const u of FAKE_DB.users) {
  console.log(`    id=${u.id} username=${u.username} role=${u.role} password=${u.password}`);
}

/**
 * 模拟数据库的"注释剥离"行为：-- 之后到行尾、以及 /* ... *\/ 之间的内容都会被忽略。
 * 真实数据库确实会这么做 —— 这正是"注释截断"注入能成立的原因。
 * @param {string} sql
 * @returns {{clean: string, hadComment: boolean}}
 */
function stripComments(sql) {
  const hadComment = /--|\/\*/.test(sql);
  const clean = sql.replace(/--[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  return { clean, hadComment };
}

/**
 * 解析一个"操作数"：字符串字面量、数字字面量、或列引用。
 * @param {string} token
 * @param {object} row 当前行数据
 * @returns {{kind: 'literal'|'column'|'unknown', value: unknown}}
 */
function resolveOperand(token, row) {
  const t = token.trim();
  // 单引号字符串字面量
  if (/^'.*'$/.test(t)) return { kind: 'literal', value: t.slice(1, -1) };
  // 双引号（在部分数据库里是标识符，这里为演示简单当作字面量）
  if (/^".*"$/.test(t)) return { kind: 'literal', value: t.slice(1, -1) };
  // 数字字面量
  if (/^-?\d+(\.\d+)?$/.test(t)) return { kind: 'literal', value: Number(t) };
  // 列引用（取自当前行）
  if (/^[A-Za-z_][\w.]*$/.test(t)) {
    const key = t.includes('.') ? t.split('.').pop() : t;
    return { kind: 'column', value: row ? row[key] : undefined };
  }
  return { kind: 'unknown', value: undefined };
}

/**
 * 比较两个解析后的操作数。
 * @param {unknown} a
 * @param {unknown} b
 * @param {string} op
 * @returns {boolean}
 */
function compareOperands(a, b, op) {
  // 统一转成字符串做等值比较（简化模拟；真实数据库有更复杂的类型转换规则）
  const sa = a === undefined || a === null ? '' : String(a);
  const sb = b === undefined || b === null ? '' : String(b);
  switch (op) {
    case '=':
      return sa === sb;
    case '!=':
    case '<>':
      return sa !== sb;
    default: {
      const na = Number(a);
      const nb = Number(b);
      if (Number.isNaN(na) || Number.isNaN(nb)) return false;
      if (op === '>') return na > nb;
      if (op === '<') return na < nb;
      if (op === '>=') return na >= nb;
      if (op === '<=') return na <= nb;
      return false;
    }
  }
}

/**
 * 评估一个 WHERE 子句里的"条件项"，形如 `col = 'value'` 或 `'1'='1'`。
 * @param {string} term
 * @param {object} row
 * @returns {boolean|null} null 表示无法解析（本模拟器不支持）
 */
function evalTerm(term, row) {
  const m = term
    .trim()
    .match(/^(.+?)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/);
  if (!m) return null;
  const left = resolveOperand(m[1], row);
  const right = resolveOperand(m[3], row);
  return compareOperands(left.value, right.value, m[2]);
}

/**
 * 评估整个 WHERE 子句（支持 AND / OR，按"OR 分组、组内 AND"的简化优先级处理）。
 * @param {string} whereClause
 * @param {object} row
 * @returns {boolean|null}
 */
function evalWhere(whereClause, row) {
  // 顶层按 OR 切成若干组；组内按 AND 切
  const orGroups = whereClause.split(/\s+OR\s+/i);
  let anyUnknown = false;
  for (const group of orGroups) {
    const andTerms = group.split(/\s+AND\s+/i);
    let allTrue = true;
    for (const t of andTerms) {
      const r = evalTerm(t, row);
      if (r === null) {
        anyUnknown = true;
        allTrue = false;
        break;
      }
      if (!r) {
        allTrue = false;
        break;
      }
    }
    if (allTrue) return true; // OR 只要有一组成立，整行命中
  }
  return anyUnknown ? null : false;
}

/**
 * 迷你 SQL 解释器：解析并执行一个 SELECT 语句字符串。
 * 注意它接收的是"已经拼装完成的 SQL 字符串"——这正是漏洞的入口。
 * @param {string} sqlText
 * @returns {{ok: boolean, rows?: object[], note?: string, executed?: string}}
 */
function miniSqlRun(sqlText) {
  // 第 1 步：剥掉注释（真实数据库也这么做）
  const { clean, hadComment } = stripComments(sqlText);

  // 第 2 步：找表名
  const tableMatch = clean.match(/FROM\s+([A-Za-z_][\w]*)/i);
  if (!tableMatch) return { ok: false, note: '解析失败：找不到 FROM 子句' };
  const table = FAKE_DB[tableMatch[1]];
  if (!table) return { ok: false, note: `解析失败：表 ${tableMatch[1]} 不存在` };

  // 第 3 步：取 WHERE 子句（没有则全表返回）
  const whereMatch = clean.match(/WHERE\s+([\s\S]+)$/i);
  if (!whereMatch) {
    return { ok: true, rows: [...table], executed: clean.trim(), note: '无 WHERE，返回全表' };
  }

  const whereClause = whereMatch[1].trim();
  const rows = table.filter((row) => evalWhere(whereClause, row) === true);
  return {
    ok: true,
    rows,
    executed: clean.trim(),
    note: hadComment ? `注：原 SQL 中的注释已被数据库忽略` : '',
  };
}

// ============================================================================
// 小节 1：漏洞代码 —— 字符串拼接
// ============================================================================
console.log('\n--- 1. 漏洞代码：把用户输入拼进 SQL 字符串 ---');

/**
 * 【漏洞】登录查询：直接把用户输入拼进 SQL。
 * @param {string} username 用户输入（完全不可信）
 * @param {string} password 用户输入（完全不可信）
 * @returns {{ok: boolean, rows?: object[], executed?: string, note?: string}}
 */
function vulnerableLogin(username, password) {
  // 反面教材：模板字符串拼接 —— 用户输入变成了 SQL 语法的一部分
  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  return miniSqlRun(sql);
}

const normalUser = vulnerableLogin('alice', 'alice_pw');
console.log('  [正常请求] username=alice password=alice_pw');
console.log(`    执行的 SQL: ${normalUser.executed}`);
console.log(`    返回行数  : ${normalUser.rows.length}  -> ${normalUser.rows.map((r) => r.username).join(',')}`);

const wrongPw = vulnerableLogin('alice', 'wrong');
console.log('  [错误密码] username=alice password=wrong');
console.log(`    执行的 SQL: ${wrongPw.executed}`);
console.log(`    返回行数  : ${wrongPw.rows.length}  （正确地拒绝了）`);

// ============================================================================
// 小节 2：攻击演示 ① —— 经典的 ' OR '1'='1' -- 绕过
// ============================================================================
console.log('\n--- 2. 攻击演示 ①：\' OR \'1\'=\'1\' -- 绕过条件判断 ---');

const ATTACK_OR = "' OR '1'='1' -- ";
console.log(`  攻击者提交的 username = ${JSON.stringify(ATTACK_OR)}，password 随便填`);

const attack1 = vulnerableLogin(ATTACK_OR, 'anything');
console.log(`  实际执行的 SQL（拼接后）:`);
console.log(
  `    SELECT * FROM users WHERE username = '${ATTACK_OR}' AND password = 'anything'`
);
console.log(`  数据库真正执行的 SQL（注释被剥掉后）:`);
console.log(`    ${attack1.executed}`);
console.log(`  返回行数: ${attack1.rows.length}`);
for (const r of attack1.rows) {
  console.log(`    -> 泄漏行: id=${r.id} username=${r.username} password=${r.password} email=${r.email}`);
}
console.log('  原理拆解（这是本文件最重要的一段）：');
console.log("    拼接后 WHERE 变成: username = '' OR '1'='1' -- ' AND password = 'anything'");
console.log("    ① username = ''            —— 第一个条件为假，本该拦截；");
console.log("    ② OR '1'='1'               —— 攻击者自己加了一个恒真条件，OR 让它救活了整行；");
console.log('    ③ -- 后面全部变成注释      —— AND password = ... 被彻底抹掉，密码校验消失；');
console.log('    于是 WHERE 恒真，全表返回 —— 攻击者不知道任何密码就拿到了所有用户数据。');

// ============================================================================
// 小节 3：攻击演示 ② —— 注释截断，专打 admin
// ============================================================================
console.log('\n--- 3. 攻击演示 ②：admin\'-- 注释掉密码校验 ---');

const ATTACK_COMMENT = "admin'--";
console.log(`  攻击者提交的 username = ${JSON.stringify(ATTACK_COMMENT)}`);

const attack2 = vulnerableLogin(ATTACK_COMMENT, 'whatever');
console.log(`  实际执行的 SQL（拼接后）:`);
console.log(`    SELECT * FROM users WHERE username = '${ATTACK_COMMENT}' AND password = 'whatever'`);
console.log(`  数据库真正执行的 SQL（注释被剥掉后）:`);
console.log(`    ${attack2.executed}`);
console.log(`  返回行数: ${attack2.rows.length}`);
for (const r of attack2.rows) {
  console.log(`    -> 命中行: username=${r.username} role=${r.role} password=${r.password}`);
}
console.log('  原理：-- 之后的内容被当作注释丢弃，AND password = ' + "'whatever'" + ' 整段失效，');
console.log('        查询退化成"只要用户名是 admin 就返回"，密码校验被完全绕过。');
console.log('        危害升级：登录成功后攻击者拿到的是 admin 身份 —— 直接提权。');

// ============================================================================
// 小节 4：其他注入形态（只做说明，不实际执行危险语句）
// ============================================================================
console.log('\n--- 4. 其他常见注入形态（概念说明） ---');

const otherAttacks = [
  [
    "' UNION SELECT ... --",
    '把另一张表的数据"并"进结果集。例如让查询返回 users 表里的 password 字段，' +
      '字段个数对齐后（列数匹配），攻击者就能在正常页面上看到本不该显示的数据。',
  ],
  [
    "'; DROP TABLE users; --",
    '堆叠查询（stacked queries）。能否成功取决于驱动是否允许多语句执行；' +
      '参数化查询通常天然禁止，因为一个占位符只对应一个值，不可能变成两条语句。',
  ],
  [
    "' AND SLEEP(5) --",
    '时间盲注。页面内容没变化，但响应时间有变化 —— 攻击者用"延迟是否发生"当比特位，' +
      '一个字符一个字符地把数据猜出来。',
  ],
  [
    "' AND 1=CONVERT(int, @@version) --",
    '报错盲注。故意制造类型转换错误，从数据库返回的错误信息里读出版本号、表名。',
  ],
  [
    "' OR username LIKE 'a%' --",
    '布尔盲注 / 数据枚举。用 LIKE 配合通配符，从"是否返回结果"推断数据内容。',
  ],
];
for (const [payload, desc] of otherAttacks) {
  console.log(`  ${payload}`);
  console.log(`    ${desc}`);
}
console.log('  注意：以上语句都不会在本文件中被真实执行，只作为原理说明。');

// ============================================================================
// 小节 5：修复方案 —— 参数化查询（结构与数据分离）
// ============================================================================
console.log('\n--- 5. 修复方案：参数化查询 ---');

/**
 * 模拟"参数化查询"的执行流程。核心差异在于：
 *   ① 解析阶段面对的是**开发者写死的模板**（不含任何用户输入）；
 *   ② 用户输入只在"绑定"阶段作为**纯值**填入，永远不参与解析。
 * 真实的驱动会先 prepare（编译执行计划）再 bind（绑定参数），这里如实模拟这个两阶段。
 * @param {string} template SQL 模板，值的位置写 ?
 * @param {unknown[]} params 参数数组（可能含恶意内容，但它只是数据）
 * @returns {{ok: boolean, rows?: object[], executed?: string, bound?: unknown[], note?: string}}
 */
function miniSqlPrepared(template, params) {
  // ---- 阶段一：解析模板（注意：template 完全来自代码，不含用户输入）----
  const tableMatch = template.match(/FROM\s+([A-Za-z_][\w]*)/i);
  if (!tableMatch) return { ok: false, note: '解析失败：找不到 FROM 子句' };
  const table = FAKE_DB[tableMatch[1]];
  if (!table) return { ok: false, note: `解析失败：表 ${tableMatch[1]} 不存在` };

  const whereMatch = template.match(/WHERE\s+([\s\S]+)$/i);
  if (!whereMatch) return { ok: true, rows: [...table], executed: template };

  // 把 WHERE 解析成"结构"：每项是 { col, op, paramIndex }，而不是字符串片段
  const clause = whereMatch[1].trim();
  const structure = [];
  let paramIndex = 0;
  for (const group of clause.split(/\s+OR\s+/i)) {
    const andTerms = [];
    for (const raw of group.split(/\s+AND\s+/i)) {
      const term = raw.trim();
      // 形如 `col IN (?, ?, ?)` 的占位符条件 —— 占位符个数由模板（即代码）决定
      const inMatch = term.match(/^([A-Za-z_][\w.]*)\s+IN\s*\(\s*(\?(?:\s*,\s*\?)*)\s*\)$/i);
      if (inMatch) {
        const count = inMatch[2].split(',').length;
        const slots = [];
        for (let k = 0; k < count; k += 1) {
          slots.push(paramIndex);
          paramIndex += 1;
        }
        andTerms.push({ kind: 'in', col: inMatch[1], op: 'IN', paramIndexes: slots });
        continue;
      }
      // 形如 `col = ?` 的占位符条件 —— 结构由模板决定
      const m = term.match(/^([A-Za-z_][\w.]*)\s*(>=|<=|<>|!=|=|>|<)\s*\?$/);
      if (m) {
        andTerms.push({ kind: 'placeholder', col: m[1], op: m[2], paramIndex });
        paramIndex += 1;
        continue;
      }
      // 形如 `col = 5` 的常量条件
      const c = term.match(/^([A-Za-z_][\w.]*)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/);
      if (c) {
        andTerms.push({ kind: 'const', col: c[1], op: c[2], literal: resolveOperand(c[3], null).value });
        continue;
      }
      return { ok: false, note: `模板无法解析的条件: ${term}` };
    }
    structure.push(andTerms);
  }

  // 占位符个数与参数个数必须严格一致 —— 这也是参数化查询的一道天然防线
  if (paramIndex !== params.length) {
    return {
      ok: false,
      note: `参数个数不匹配：模板需要 ${paramIndex} 个，实际传入 ${params.length} 个`,
    };
  }

  // ---- 阶段二：绑定参数（参数只是值，不可能改变上面的 structure）----
  const rows = table.filter((row) => {
    for (const andTerms of structure) {
      let allTrue = true;
      for (const t of andTerms) {
        const left = row[t.col.includes('.') ? t.col.split('.').pop() : t.col];
        if (t.kind === 'in') {
          // IN 语义：只要命中列表里任意一个绑定值就算成立
          const hit = t.paramIndexes.some((idx) => compareOperands(left, params[idx], '='));
          if (!hit) {
            allTrue = false;
            break;
          }
          continue;
        }
        const right = t.kind === 'placeholder' ? params[t.paramIndex] : t.literal;
        if (!compareOperands(left, right, t.op)) {
          allTrue = false;
          break;
        }
      }
      if (allTrue) return true;
    }
    return false;
  });

  return {
    ok: true,
    rows,
    executed: template,
    bound: params,
    note: `模板结构: ${JSON.stringify(structure)}`,
  };
}

/**
 * 【安全】参数化登录查询。
 * @param {string} username
 * @param {string} password
 * @returns {object}
 */
function safeLogin(username, password) {
  // 关键：模板里只有 ?，用户输入走第二个参数数组
  return miniSqlPrepared('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
}

console.log('  [安全写法] miniSqlPrepared(SELECT ... WHERE username = ? AND password = ?, [u, p])');
console.log('\n  (a) 正常登录：');
const safeOk = safeLogin('alice', 'alice_pw');
console.log(`      模板: ${safeOk.executed}`);
console.log(`      绑定参数: ${JSON.stringify(safeOk.bound)}`);
console.log(`      返回行数: ${safeOk.rows.length} -> ${safeOk.rows.map((r) => r.username).join(',')}`);

console.log('\n  (b) 同样的攻击载荷，走参数化路径：');
const safeAttack1 = safeLogin(ATTACK_OR, 'anything');
console.log(`      模板: ${safeAttack1.executed}`);
console.log(`      绑定参数: ${JSON.stringify(safeAttack1.bound)}`);
console.log(`      返回行数: ${safeAttack1.rows.length}  <-- 攻击失效，因为整串只是一个用户名的值`);

const safeAttack2 = safeLogin(ATTACK_COMMENT, 'whatever');
console.log(`      载荷 ${JSON.stringify(ATTACK_COMMENT)} 绑定为参数后返回行数: ${safeAttack2.rows.length}`);

console.log('\n  [对比总结]');
console.log(`      拼接写法：' OR '1'='1' --   -> 返回 ${attack1.rows.length} 行（全表泄漏）`);
console.log(`      参数化   ：' OR '1'='1' --   -> 返回 ${safeAttack1.rows.length} 行（被当成普通字符串，查无此人）`);
console.log(`      拼接写法：admin'--           -> 返回 ${attack2.rows.length} 行（密码被绕过）`);
console.log(`      参数化   ：admin'--           -> 返回 ${safeAttack2.rows.length} 行（用户名必须真的等于 admin'--）`);

console.log('\n  【核心原理 — 请务必记住】');
console.log('    参数化查询的安全来源**不是**"把引号转义掉了"，而是**结构与数据分离**：');
console.log('      - 模板（结构）在编译阶段就被固定：有几个条件、哪些列、什么操作符，全部写死；');
console.log('      - 参数（数据）随后被绑定进已编译好的"槽位"里，它只能是一个值；');
console.log('      - 无论参数内容是什么（引号、--、UNION、分号），都不会被重新解析为语法。');
console.log('    对比"转义"方案：转义是在"字符串层面"补救，只要转义规则与数据库解析规则');
console.log('    有任何一点不一致（字符集、转义模式、宽字节），防线就崩了。');
console.log('    所以：**永远用参数化，不要用自己写的转义函数**。');

// ============================================================================
// 小节 6：标识符不能参数化 —— 必须白名单
// ============================================================================
console.log('\n--- 6. 特例：表名/列名/排序方向不能参数化，只能白名单 ---');

/**
 * 【漏洞】排序字段拼接：ORDER BY 的位置**不能**用占位符。
 * @param {string} col 用户指定的排序字段
 * @returns {string} 拼好的 SQL（仅用于观察，不执行）
 */
function vulnerableOrderBy(col) {
  return `SELECT * FROM users ORDER BY ${col} ASC`;
}

/**
 * 【安全】排序字段白名单映射：把"用户输入"映射到"代码里写死的列名"。
 * @param {string} col
 * @returns {{ok: boolean, sql?: string, reason?: string}}
 */
function safeOrderBy(col) {
  // 白名单：键是允许的输入，值是真实的列名（两者甚至可以不同，进一步解耦）
  const SORTABLE = {
    id: 'id',
    username: 'username',
    email: 'email',
  };
  if (!Object.hasOwn(SORTABLE, col)) {
    // 默认拒绝：不在白名单就直接报错，绝不"猜一个默认值"蒙混过关
    return { ok: false, reason: `不允许按 "${col}" 排序` };
  }
  // 取出的一定是代码里预定义的值，用户输入只起到了"查找键"的作用
  return { ok: true, sql: `SELECT * FROM users ORDER BY ${SORTABLE[col]} ASC` };
}

console.log(`  漏洞写法: SELECT * FROM users ORDER BY ${'id; DROP TABLE users'} ASC`);
console.log(`    用户输入 id; DROP TABLE users -> ${vulnerableOrderBy('id; DROP TABLE users')}`);
console.log('    ORDER BY 是结构位置，占位符在这里会直接报语法错误，所以只能用白名单。');
for (const c of ['username', 'id', 'password", (SELECT 1)', 'password_hash']) {
  const r = safeOrderBy(c);
  console.log(`  白名单校验 "${c}" -> ${r.ok ? r.sql : '拒绝: ' + r.reason}`);
}
console.log('  同理需要白名单的位置还有：ASC/DESC 方向、GROUP BY 字段、表名、LIMIT 的偏移与条数');

// ============================================================================
// 小节 7：ORM 也不免疫 —— 警惕"原生查询"逃生舱
// ============================================================================
console.log('\n--- 7. ORM 也不免疫：正常 API 安全，原生逃生舱危险 ---');

// 用伪代码字符串展示，不 import 任何真实 ORM
const ormExamples = [
  [
    '安全：ORM 的链式 API',
    "User.findOne({ where: { username: name } })",
    'ORM 内部用参数化绑定，name 永远是值',
  ],
  [
    '安全：Query Builder 的绑定方法',
    "knex('users').where('username', '=', name)",
    'knex 会把 name 作为绑定参数发出',
  ],
  [
    '危险：原生 SQL 逃生舱（Raw）',
    "sequelize.query(`SELECT * FROM users WHERE username = '${name}'`)",
    '只要拼接了，ORM 的保护就完全不生效',
  ],
  [
    '危险：Unsafe 变体',
    'prisma.$queryRawUnsafe(`... ${name} ...`)',
    '名字里的 Unsafe 就是字面意思；应改用 $queryRaw 模板标签（它会参数化）',
  ],
  [
    '安全：原生查询但用绑定',
    "sequelize.query('SELECT * FROM users WHERE username = ?', { replacements: [name] })",
    '即使写原生 SQL，只要走绑定就是安全的',
  ],
];
for (const [title, code, why] of ormExamples) {
  console.log(`  ${title}`);
  console.log(`    写法: ${code}`);
  console.log(`    说明: ${why}`);
}
console.log('  结论：安全性取决于"用户输入有没有进入 SQL 文本"，跟用不用 ORM 无关。');
console.log('        代码评审时应重点搜：${、+ 拼接 SQL、query(、execute(、Raw/RawUnsafe。');

// ============================================================================
// 小节 8：生成 IN 子句占位符 —— 一个实用细节
// ============================================================================
console.log('\n--- 8. 实用细节：IN 子句的占位符个数由"代码"决定 ---');

/**
 * 根据数组长度生成 IN 子句的占位符。
 * 关键：占位符个数取决于**数组长度**，而不是数组内容 —— 内容永远进不了 SQL 文本。
 * @param {unknown[]} ids
 * @returns {{template: string, params: unknown[]}}
 */
function buildInClause(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('IN 子句至少需要一个值');
  }
  // 先做一次长度上限的白名单校验，防止超长 IN 拖垮数据库
  if (ids.length > 100) throw new Error('IN 子句最多 100 个值');
  const placeholders = ids.map(() => '?').join(', ');
  return {
    template: `SELECT * FROM users WHERE id IN (${placeholders})`,
    params: ids,
  };
}

const inClause = buildInClause([1, 3, 999]);
console.log(`  输入 [1, 3, 999]`);
console.log(`  模板: ${inClause.template}`);
console.log(`  参数: ${JSON.stringify(inClause.params)}`);
const inResult = miniSqlPrepared(inClause.template, inClause.params);
console.log(
  `  执行结果(${inResult.rows.length} 行): ${inResult.rows.map((r) => r.username).join(',')}`
);
console.log('  注意：值 999 在模板里根本不存在，它只在参数数组里 —— 数据进不了结构。');

// ============================================================================
// 小节 9：小结
// ============================================================================
console.log('\n--- 9. 小结 ---');
console.log('  1) SQL 注入的根因：数据被拼进了代码字符串，用户输入成了 SQL 语法的一部分。');
console.log("  2) 典型链路：' OR '1'='1' -- 让 WHERE 恒真并注释掉密码校验 -> 全表泄漏/越权登录。");
console.log('  3) 修复方案：参数化查询（占位符 + 参数数组），性能与安全双赢。');
console.log('  4) 参数化的原理是"结构与数据分离"，不是"转义字符" —— 二者本质不同，别搞混。');
console.log('  5) 标识符（表名/列名/排序方向）无法参数化，必须用白名单映射 + 默认拒绝。');
console.log('  6) ORM 只在"正常 API"下安全，原生查询逃生舱一旦拼接就同样中招。');
console.log('  7) 配套措施：最小权限数据库账号、关闭多语句、错误信息不外泄（见 08 篇）。');
