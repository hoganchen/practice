/**
 * ============================================================================
 * 知识点：覆盖率概念 —— 语句 / 分支 / 函数 / 行覆盖
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试基础
 * 【难度等级】进阶
 * 【前置知识】28_testing/07_testing_pure_functions.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "覆盖率"衡量的是：跑完测试后，代码里有多大比例被执行到了。
 *    它回答的问题不是"代码对不对"，而是"代码有没有被测过"。
 *    四个核心指标：
 *
 *      语句覆盖率（Statements）：有多少条语句被执行过。
 *      分支覆盖率（Branches）  ：if/else、三元、短路运算符的每个分支是否都走过。
 *                                通常显著低于语句覆盖率 —— 因为你常常只测了 if 的 true 分支。
 *      函数覆盖率（Functions） ：有多少个函数至少被调用过一次。
 *      行覆盖率（Lines）       ：有多少行源码被执行过（与语句覆盖率高度重合，
 *                                区别在于一行里可能有多条语句）。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    - 找出"完全没测的代码"：函数覆盖率为 0 的文件 / 函数是最危险的，
 *      它们通常是匆忙上线、无人维护的角落。
 *    - 找出"只测了一半的分支"：分支覆盖率是四个指标里最有价值的，
 *      因为 bug 几乎全在"没走到的那个分支"里。
 *    - 作为团队质量门禁：CI 里设置 thresholds（如 branches >= 80%），
 *      低于就拦下合并。注意它应该"防倒退"而不是"冲高分"。
 *    - 识别死代码：覆盖率长期为 0 的代码可以直接删掉。
 *
 * 3. 核心语法要点
 *    工具（c8 / Istanbul / Vitest coverage）的工作原理：
 *      (a) 加载源码时对 AST 做插桩（instrumentation），在每个语句/分支/函数前
 *          插入一个计数器；
 *      (b) 跑测试，计数器累加；
 *      (c) 测试结束后把计数映射回源码位置，生成报告。
 *    常用命令：
 *      node --experimental-test-coverage --test     Node 内置覆盖率（实验特性）
 *      npx c8 node 你的脚本.js                       基于 V8 的覆盖工具
 *      npx vitest run --coverage                    Vitest 自带覆盖率
 *    报告里常见的数字：
 *      % Stmts / % Branch / % Funcs / % Lines，加一列 Uncovered Line #s 指出未覆盖行号。
 *
 * 4. 常见陷阱
 *    - 把覆盖率当 KPI：为了凑数字写"只调用不断言"的测试，覆盖率上去了，
 *      质量没变。这种行为叫"覆盖率高但断言为零"（assertion-free coverage）。
 *    - 覆盖率 100% ≠ 没有 bug：覆盖率只说明代码被执行过，
 *      不说明所有输入组合都被验证过（组合爆炸不可能全测）。
 *    - 忽略分支覆盖：只跑通了 happy path，语句覆盖率能到 90%，
 *      但分支覆盖率可能只有 50%。
 *    - 统计了测试代码自己：coverage 配置要正确排除 node_modules、测试文件、构建产物。
 *    - 把"未覆盖"当成必须消灭的敌人：有些防御性分支（如 `if (!shouldNeverHappen)`）
 *      就是不该被覆盖，强行覆盖会引入无意义的测试。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/08_test_coverage_concept.js
 *
 * 【预期输出】
 *   手工模拟插桩与统计，打印两份 istanbul 风格的覆盖率报告：
 *   第一份来自"测试不全"的测试集，第二份来自补充边界测试后的完整测试集，
 *   最后打印覆盖率高低的对比结论。退出码 0。
 * ============================================================================
 */

import { test, describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ===========================================================================
// 第一部分：手工实现一个"插桩 + 统计"的迷你覆盖率工具
// ===========================================================================

/**
 * 覆盖率收集器：模拟 Istanbul 的全局计数器对象。
 * 真实工具会在编译阶段往源码里插入 `cov.s[3]++` 这样的语句，
 * 这里我们手工在代码里写探针（probe），效果完全一样。
 */
const coverage = {
  /** 语句计数器：key 是语句编号，value 是执行次数 */
  statements: new Map(),
  /** 分支计数器：key 是 "分支组编号-分支序号" */
  branches: new Map(),
  /** 函数计数器：key 是函数名 */
  functions: new Map(),
  /** 每个编号对应的源码行号（真实工具从 source map 得到，这里手工登记） */
  locations: new Map(),

  /** 登记一条语句的位置 */
  registerStatement(id, line) {
    this.statements.set(id, 0);
    this.locations.set(id, line);
  },
  /** 登记一个分支组（一个 if 有 2 个分支，一个 switch 有 N 个） */
  registerBranch(groupId, count, line) {
    for (let i = 0; i < count; i += 1) {
      // 用 "组号.分支序号" 作为复合键，避免不同组的同名分支互相覆盖
      this.branches.set(`${groupId}.${i}`, 0);
    }
    this.locations.set(`branch:${groupId}`, line);
  },
  /** 登记一个函数 */
  registerFunction(name, line) {
    this.functions.set(name, 0);
    this.locations.set(`fn:${name}`, line);
  },

  /** 探针：语句执行时调用 */
  hitStatement(id) {
    this.statements.set(id, (this.statements.get(id) ?? 0) + 1);
  },
  /** 探针：分支执行时调用 */
  hitBranch(groupId, index) {
    const key = `${groupId}.${index}`;
    this.branches.set(key, (this.branches.get(key) ?? 0) + 1);
  },
  /** 探针：函数被调用时调用 */
  hitFunction(name) {
    this.functions.set(name, (this.functions.get(name) ?? 0) + 1);
  },

  /** 计算并返回统计结果 */
  summary() {
    const count = (map) => {
      let total = 0;
      let covered = 0;
      for (const hits of map.values()) {
        total += 1;
        if (hits > 0) covered += 1;
      }
      return { total, covered, pct: total === 0 ? 100 : (covered / total) * 100 };
    };
    return {
      statements: count(this.statements),
      branches: count(this.branches),
      functions: count(this.functions),
      // 行覆盖率：把"被覆盖的语句"映射到行号后去重，得到被覆盖的行数
      lines: (() => {
        const allLines = new Set();
        const coveredLines = new Set();
        for (const [id, hits] of this.statements) {
          const line = this.locations.get(id);
          if (line === undefined) continue;
          allLines.add(line);
          if (hits > 0) coveredLines.add(line);
        }
        const total = allLines.size;
        const covered = [...coveredLines].filter((l) => allLines.has(l)).length;
        return { total, covered, pct: total === 0 ? 100 : (covered / total) * 100 };
      })(),
    };
  },

  /** 列出未被覆盖的语句行号（真实报告里的 Uncovered Line #s 列） */
  uncoveredLines() {
    const result = [];
    for (const [id, hits] of this.statements) {
      if (hits === 0) result.push(this.locations.get(id));
    }
    return [...new Set(result)].sort((a, b) => a - b);
  },

  /** 重置所有计数器（模拟"换一批测试重新跑一次"） */
  reset() {
    for (const key of this.statements.keys()) this.statements.set(key, 0);
    for (const key of this.branches.keys()) this.branches.set(key, 0);
    for (const key of this.functions.keys()) this.functions.set(key, 0);
  },
};

// ---------------------------------------------------------------------------
// 被测模块：一个"插桩版"的折扣计算器
// 真实源码里没有这些 coverage.hitXxx 调用，它们是工具自动插入的。
// 为了教学，我们手工写出来，并保持行号与下面的报告一致。
// ---------------------------------------------------------------------------

// 先登记所有"可覆盖单元"的位置信息（真实工具在插桩阶段完成）
const L = {
  calcDiscount: 196,
  isVip: 197,
  branchLevel: 202,
  branchVip: 206,
  branchAmount: 210,
  fnCalcDiscount: 194,
  fnNormalizeUser: 224,
  fnFormatPrice: 240,
};

coverage.registerFunction('calcDiscount', L.fnCalcDiscount);
coverage.registerStatement('s1', L.calcDiscount); // if (!user) 的语句
coverage.registerStatement('s2', L.isVip); // const vip = ...
coverage.registerStatement('s3', 203); // return 0.3
coverage.registerStatement('s4', 204); // return 0.1
coverage.registerStatement('s5', 207); // return vip ? 0.2 : 0.05
coverage.registerStatement('s6', 211); // return vip ? 0.1 : 0.02
coverage.registerStatement('s7', 213); // return vip ? 0.05 : 0
coverage.registerBranch('b1', 2, 202); // if (!user) 的真/假
coverage.registerBranch('b2', 2, 206); // amount >= 1000 的真/假
coverage.registerBranch('b3', 2, 210); // amount >= 500 的真/假
coverage.registerBranch('b4', 2, 207); // vip ? : 的三元分支
coverage.registerBranch('b5', 2, 211); // vip ? : 的三元分支
coverage.registerBranch('b6', 2, 213); // vip ? : 的三元分支

coverage.registerFunction('normalizeUser', L.fnNormalizeUser);
coverage.registerStatement('s8', L.fnNormalizeUser);
coverage.registerStatement('s9', 228); // email.toLowerCase()
coverage.registerStatement('s10', 232); // name.trim() 兜底
coverage.registerBranch('b7', 2, 231); // name 是否为空

coverage.registerFunction('formatPrice', L.fnFormatPrice);
coverage.registerStatement('s11', L.fnFormatPrice);
coverage.registerStatement('s12', 246); // toFixed
coverage.registerStatement('s13', 248); // 货币符号拼接

/**
 * 计算折扣率（0 ~ 0.3）。
 * 业务规则：
 *   - 未登录用户（user 为空）不打折，返回 0
 *   - 普通用户：满 1000 打 9 折…不，见下面分支
 *   - VIP 用户折扣更高
 *
 * @param {{isVip?: boolean} | null} user
 * @param {number} amount
 * @returns {number} 折扣率
 */
function calcDiscount(user, amount) {
  coverage.hitFunction('calcDiscount');
  coverage.hitStatement('s1');
  coverage.hitBranch('b1', user ? 1 : 0); // 分支探针：0 = falsy，1 = truthy
  if (!user) {
    return 0; // 未登录不打折
  }
  coverage.hitStatement('s2');
  const vip = Boolean(user.isVip);

  coverage.hitBranch('b2', amount >= 1000 ? 1 : 0);
  if (amount >= 1000) {
    coverage.hitStatement('s3');
    coverage.hitStatement('s4'); // 三元的两条语句都算"语句"，但分支单独统计
    coverage.hitBranch('b3', 0);
    return vip ? 0.3 : 0.1;
  }
  coverage.hitBranch('b3', 1);
  if (amount >= 500) {
    coverage.hitStatement('s5');
    coverage.hitBranch('b4', vip ? 1 : 0);
    return vip ? 0.2 : 0.05;
  }
  coverage.hitStatement('s6');
  coverage.hitBranch('b5', vip ? 1 : 0);
  coverage.hitStatement('s7');
  coverage.hitBranch('b6', vip ? 1 : 0);
  return vip ? 0.05 : 0;
}

/**
 * 规范化用户对象：邮箱统一小写，名字去空格并兜底。
 * @param {{email: string, name?: string}} raw
 */
function normalizeUser(raw) {
  coverage.hitFunction('normalizeUser');
  coverage.hitStatement('s8');
  coverage.hitStatement('s9');
  const email = raw.email.toLowerCase();

  coverage.hitStatement('s10');
  coverage.hitBranch('b7', raw.name ? 1 : 0);
  const name = raw.name ? raw.name.trim() : '匿名用户'; // 空名字时的兜底分支
  return { email, name };
}

/**
 * 格式化价格：分转元并加货币符号。
 * @param {number} cents 金额（分）
 * @param {string} [currency='¥']
 */
function formatPrice(cents, currency = '¥') {
  coverage.hitFunction('formatPrice');
  coverage.hitStatement('s11');
  coverage.hitStatement('s12');
  const yuan = (cents / 100).toFixed(2);
  coverage.hitStatement('s13');
  return `${currency}${yuan}`;
}

// ---------------------------------------------------------------------------
console.log('--- 1. 第一轮：只有 happy path 的测试集 ---');

// 这是一份"典型的、写得不走心"的测试：只测正常情况，边界一个不碰。
const happyPathTests = [
  { name: 'VIP 大额订单打 3 折', fn: () => assert.strictEqual(calcDiscount({ isVip: true }, 2000), 0.3) },
  { name: '普通用户中额订单打 5%', fn: () => assert.strictEqual(calcDiscount({ isVip: false }, 600), 0.05) },
  { name: '邮箱规范化', fn: () => assert.strictEqual(normalizeUser({ email: 'A@B.COM', name: '  Alice  ' }).email, 'a@b.com') },
  { name: '价格格式化', fn: () => assert.strictEqual(formatPrice(12345), '¥123.45') },
];

/**
 * 运行一批测试并返回 通过/失败 计数。
 * @param {Array<{name: string, fn: () => void}>} tests
 */
function runSuite(tests) {
  let passed = 0;
  const failures = [];
  for (const t of tests) {
    try {
      t.fn();
      passed += 1;
    } catch (error) {
      failures.push({ name: t.name, message: error.message });
    }
  }
  return { passed, failed: failures.length, total: tests.length, failures };
}

const round1 = runSuite(happyPathTests);
console.log(`测试结果：${round1.passed}/${round1.total} 通过`);

const summary1 = coverage.summary();
const uncovered1 = coverage.uncoveredLines();

/**
 * 打印 istanbul 风格的覆盖率报告表格。
 * @param {string} title 报告标题
 * @param {ReturnType<typeof coverage.summary>} s 统计结果
 * @param {number[]} uncovered 未覆盖行号
 */
function printCoverageReport(title, s, uncovered) {
  /** 把百分比格式化成固定宽度，并对低覆盖率加上提示标记 */
  const pctCell = (pct) => {
    const text = `${pct.toFixed(2)}%`;
    if (pct >= 90) return text.padStart(8);
    if (pct >= 60) return `${text.padStart(8)} *`; // 一星：偏低
    return `${text.padStart(8)} **`; // 两星：严重不足
  };

  const row = (label, item) => `  ${label.padEnd(28)}${pctCell(item.pct)}   (${item.covered}/${item.total})`;

  console.log('');
  console.log(`  ${title}`);
  console.log(`  ${'-'.repeat(58)}`);
  console.log(`  ${'指标'.padEnd(26)}${'覆盖率'.padStart(10)}   ${'已覆盖/总数'}`);
  console.log(`  ${'-'.repeat(58)}`);
  console.log(row('语句覆盖率 Statements', s.statements));
  console.log(row('分支覆盖率 Branches', s.branches));
  console.log(row('函数覆盖率 Functions', s.functions));
  console.log(row('行覆盖率   Lines', s.lines));
  console.log(`  ${'-'.repeat(58)}`);
  console.log(`  未覆盖行号 Uncovered Line #s：${uncovered.length ? uncovered.join(',') : '无'}`);
  console.log('  标注：* 覆盖率偏低   ** 覆盖率严重不足');
}

printCoverageReport('覆盖率报告（第一轮：只有 happy path）', summary1, uncovered1);

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 2. 第一轮报告解读：为什么分支覆盖率远低于语句覆盖率 ---');
console.log(`  语句覆盖率 ${summary1.statements.pct.toFixed(1)}% 看着还行，`);
console.log(`  但分支覆盖率只有 ${summary1.branches.pct.toFixed(1)}% —— `);
console.log('  因为 `if (!user)` 只走了"user 存在"这一条路，');
console.log('  `vip ? 0.3 : 0.1` 这类三元也只走了 truthy 一侧。');
console.log('  真实 bug 恰恰藏在没走到的那一侧里。');
console.log(`  函数覆盖率 ${summary1.functions.pct.toFixed(1)}% 是四个指标里最容易达标的，`);
console.log('  也正因如此它最有用的场景是"找出一个函数都没被调用过的文件"。');

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 3. 第二轮：补齐边界与异常等价类后重跑 ---');

coverage.reset(); // 清零计数器，重新统计

const fullTests = [
  // 第一轮的 happy path 用例全部保留（回归测试的含义：新增用例不能取代原有用例）
  ...happyPathTests,
  // --- 补齐 calcDiscount 的所有分支 ---
  { name: '未登录用户不打折（补 if 的 falsy 分支）', fn: () => assert.strictEqual(calcDiscount(null, 2000), 0) },
  { name: 'VIP 中额订单打 20%（补 amount>=500 的 true + vip 的 true）', fn: () => assert.strictEqual(calcDiscount({ isVip: true }, 600), 0.2) },
  { name: '普通用户大额订单打 10%（补 amount>=1000 的 false-vip）', fn: () => assert.strictEqual(calcDiscount({ isVip: false }, 2000), 0.1) },
  { name: 'VIP 小额订单打 5%（补 amount<500 的 true）', fn: () => assert.strictEqual(calcDiscount({ isVip: true }, 100), 0.05) },
  { name: '普通用户小额订单不打折（补 amount<500 的 false）', fn: () => assert.strictEqual(calcDiscount({ isVip: false }, 100), 0) },
  // --- 补齐 normalizeUser 的两个分支 ---
  { name: '姓名缺失时兜底为匿名用户（补 name 的 falsy 分支）', fn: () => assert.strictEqual(normalizeUser({ email: 'a@b.com' }).name, '匿名用户') },
  { name: '姓名存在时去空格（补 name 的 truthy 分支）', fn: () => assert.strictEqual(normalizeUser({ email: 'a@b.com', name: ' Bob ' }).name, 'Bob') },
  // --- 补齐 formatPrice 的参数分支 ---
  { name: '默认货币符号为 ¥', fn: () => assert.strictEqual(formatPrice(100), '¥1.00') },
  { name: '可自定义货币符号 $', fn: () => assert.strictEqual(formatPrice(100, '$'), '$1.00') },
  { name: '0 分的格式化', fn: () => assert.strictEqual(formatPrice(0), '¥0.00') },
  { name: '负数金额（退款场景）', fn: () => assert.strictEqual(formatPrice(-500), '¥-5.00') },
];

const round2 = runSuite(fullTests);
console.log(`测试结果：${round2.passed}/${round2.total} 通过`);
if (round2.failed > 0) {
  for (const f of round2.failures) console.log(`  FAIL ${f.name}: ${f.message}`);
}

const summary2 = coverage.summary();
const uncovered2 = coverage.uncoveredLines();
printCoverageReport('覆盖率报告（第二轮：补齐边界与异常等价类）', summary2, uncovered2);

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 4. 两轮对比 ---');

/**
 * 打印两轮指标的差值，直观展示"多写 8 个边界用例"带来的收益。
 * @param {string} label
 * @param {{pct: number}} before
 * @param {{pct: number}} after
 */
function compare(label, before, after) {
  const delta = after.pct - before.pct;
  const arrow = delta > 0 ? '↑' : delta < 0 ? '↓' : '=';
  console.log(
    `  ${label.padEnd(26)} ${before.pct.toFixed(1).padStart(6)}%  ->  ${after.pct.toFixed(1).padStart(6)}%  ${arrow} ${delta.toFixed(1)} 个百分点`,
  );
}

console.log(`  ${'指标'.padEnd(24)} ${'第一轮'.padStart(9)}      ${'第二轮'.padStart(9)}`);
console.log(`  ${'-'.repeat(62)}`);
compare('语句覆盖率 Statements', summary1.statements, summary2.statements);
compare('分支覆盖率 Branches', summary1.branches, summary2.branches);
compare('函数覆盖率 Functions', summary1.functions, summary2.functions);
compare('行覆盖率   Lines', summary1.lines, summary2.lines);

// ---------------------------------------------------------------------------
console.log('');
console.log('--- 5. 覆盖率报告怎么读 ---');
console.log('  1. 分支覆盖率优先看：它低说明有分支从没被执行过，风险最高的地方；');
console.log('  2. 函数覆盖率用来看"有没有整个文件/函数完全没被测试"；');
console.log('  3. Uncovered Line #s 是最有价值的输出 —— 直接告诉你该补哪个用例；');
console.log('  4. 覆盖率是"下限保障"，不是"质量证明"：');
console.log('     一行被跑到 ≠ 一行是对的。断言的质量永远比覆盖率数字更重要；');
console.log('  5. CI 里设阈值应当"防止倒退"（比如分支覆盖率不得低于上次），');
console.log('     而不是逼着团队为了数字写无意义的测试。');

// ---------------------------------------------------------------------------
// 用 node:test 把"覆盖率工具本身"也测一遍 —— 工具也要有测试，这是良好的工程习惯
// ---------------------------------------------------------------------------
describe('覆盖率收集器自身的测试', () => {
  it('summary 的统计口径正确', () => {
    // 用展开运算符复制一份收集器，只替换数据部分，方法仍然指向原实现。
    // 这样就能在不污染真实统计结果的前提下验证统计逻辑本身。
    const fresh = {
      ...coverage,
      statements: new Map([['a', 1], ['b', 0], ['c', 3]]),
      branches: new Map([['x', 0], ['y', 2]]),
      functions: new Map([['f', 1]]),
      locations: new Map([['a', 10], ['b', 11], ['c', 10]]),
    };
    const s = fresh.summary();

    assert.strictEqual(s.statements.total, 3);
    assert.strictEqual(s.statements.covered, 2);
    assert.strictEqual(s.branches.covered, 1);
    assert.strictEqual(s.functions.pct, 100);
    // 行覆盖率要去重：a 和 c 在同一行（第 10 行），所以只算 2 行，覆盖了 1 行
    assert.strictEqual(s.lines.total, 2);
    assert.strictEqual(s.lines.covered, 1);
  });

  it('两轮测试后分支覆盖率应当提升到 100%', () => {
    // 这条断言把"补了边界用例就应当覆盖所有分支"这个结论固化下来
    assert.strictEqual(summary2.branches.pct, 100, '第二轮应覆盖全部分支');
    assert.strictEqual(summary2.functions.pct, 100, '第二轮应覆盖全部函数');
    assert.ok(
      summary2.branches.pct > summary1.branches.pct,
      '补齐边界用例后分支覆盖率必须提升',
    );
  });
});

console.log('');
console.log('演示结束。');
