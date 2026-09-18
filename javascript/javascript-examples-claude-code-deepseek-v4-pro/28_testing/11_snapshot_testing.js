/**
 * ============================================================================
 * 知识点：快照测试 —— 首次记录、后续比对，以及"什么时候不该用快照"
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试
 * 【难度等级】进阶
 * 【前置知识】28_testing/02_node_test_runner.js、28_testing/03_assert_module.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "快照测试"（snapshot testing）把被测代码的**输出**序列化成一段文本，
 *    第一次运行时把它写进一个"快照文件"（snapshot file）；从第二次开始，
 *    每次运行都拿当前输出和快照文件里的内容逐字符比对：
 *      一样 → 通过；
 *      不一样 → 失败，并打印差异（diff）。
 *    它把"断言"从"我手写的期望值"变成了"上一次的真实输出"。
 *    常见于：序列化结果（JSON/HTML/错误对象）、React 组件的渲染树、
 *    CLI 的 --help 文本、日志格式、API 响应结构。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 输出结构又大又啰嗦：一个组件的渲染树有 200 行，手写期望值不现实。
 *    - 想捕捉"意外的变化"：你重构了内部实现，输出本不该变。
 *      快照能立刻告诉你"输出变了"，哪怕你根本没想起来要断言这个字段。
 *    - 它是"反向测试"：普通测试是"我声明我期望什么"，快照是
 *      "我没声明，但请你告诉我哪里变了"。
 *    - 排查回归时非常好用：diff 直接告诉你改了哪一行。
 *
 * 3. 核心语法要点
 *    Node 内置（Node 22.3+ 起，本机 Node 24 已可用）：
 *      t.assert.snapshot(value)              在测试里做快照断言（自动命名）
 *      t.assert.fileSnapshot(value, file)    指定快照文件路径
 *      node --test <file>                    校验模式：比对已存在的快照
 *      node --test --test-update-snapshots <file>   更新模式：写入/覆盖快照
 *      快照文件名规则：<测试文件名>.snapshot，与测试文件同目录
 *      快照文件内容格式：exports[`<测试名> 1`] = `...`;   —— 一个"可读的 CJS 字面量"
 *      注意：直接 `node file.js` 而不带 --test 时，快照功能不可用
 *            （会抛 ERR_INVALID_STATE: Cannot read snapshot file）。
 *
 *    Vitest / Jest：expect(value).toMatchSnapshot()
 *                   npx vitest run -u / npx jest -u      更新快照
 *                   快照存在 __snapshots__/<文件>.snap
 *
 * 4. 常见陷阱（重点：什么时候**不该**用快照）
 *    (a) 把快照当成"记录当前行为"的文档 —— 这是最致命的用法。
 *        如果代码本来是错的（比如金额算错了），快照会把这个错误**固化**下来，
 *        从此每次运行都"通过"，你得到的是"记录 bug 的文档"，而不是测试。
 *        判断标准：快照里出现的值，你是不是**能判断它对不对**？
 *        能判断的（金额、状态码、总数）应该写显式断言，不要用快照。
 *    (b) 无脑 -u 更新：一旦养成"红了就 -u"的习惯，快照测试就彻底失去意义了。
 *        更新前必须逐行读 diff，确认每一处变化都是**你有意为之**的。
 *    (c) 快照里含不稳定内容：时间戳、随机 ID、绝对路径、内存地址、
 *        浮点尾数 —— 会让快照每次都变，团队里天天"红了就 -u"。
 *        解法：序列化前"脱敏"（scrub），把易变字段替换成占位符。
 *    (d) 快照太大：500 行的快照没有人会去 review，等于没有断言。
 *        解法：只快照"稳定且有信息量"的那部分，或改用结构化断言。
 *    (e) 快照与实现耦合过紧：快照包含了纯内部的类名/嵌套层级，
 *        任何重构都红，团队就会开始无脑更新。
 *    (f) 在多人协作中不提交快照文件（或提交了但被 .gitignore 排除）。
 *        快照文件必须入库，否则 CI 上永远第一次运行，等于没测。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/11_snapshot_testing.js
 *
 * 【预期输出】
 *   1) 手写一个迷你快照引擎，演示"首次生成 → 再次通过 → 改动后失败（被迷你
 *      运行器捕获并打印 diff）→ -u 更新"的完整生命周期；
 *   2) 演示易变字段的脱敏（scrub）；
 *   3) 对真实 node:test 的 t.assert.snapshot 做特性检测，并另起子进程
 *      完整跑一遍"创建 → 通过 → 失败 → 更新"四步，打印真实输出；
 *   4) 打印"什么时候不该用快照"的对照表。
 *   全部用例通过，退出码 0。
 * ============================================================================
 */

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// 所有临时产物都放在系统临时目录里，脚本结束前统一删除，不污染仓库。
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'js-ex-11-snapshot-'));

after(() => {
  // node:test 的 after() 在本文件所有测试跑完后执行，此时才能安全删目录。
  fs.rmSync(WORK_DIR, { recursive: true, force: true });
});

// ===========================================================================
// 第 1 部分：手写一个迷你快照引擎（理解快照的"原理"，而不是只会调 API）
// ===========================================================================

console.log('--- 1. 快照的序列化：把任意值变成稳定文本 ---');

/**
 * 把任意 JS 值"规范化"成只含 JSON 可表达类型的结构。
 *
 * 为什么要这一步？
 *   1. JSON.stringify 对 undefined / 函数 / Symbol / Map / Set / 循环引用
 *      的处理是"丢掉"或"抛错"，会让快照变得不可预测；
 *   2. 对象键的书写顺序会影响 JSON 字符串，但"顺序不同"在语义上往往无差别，
 *      所以我们要主动对键排序，否则重构一下属性顺序就会让快照变红
 *      （这叫"假阳性"，会逼着团队无脑更新）。
 *
 * @param {unknown} value 任意值
 * @param {WeakSet<object>} seen 已访问过的对象，用于检测循环引用
 * @returns {unknown} 只含 null / boolean / number / string / 数组 / 普通对象的副本
 */
function normalize(value, seen = new WeakSet()) {
  if (value === null) return null;

  const type = typeof value;
  // 这些类型 JSON 表达不了，统一转成带方括号的"标记字符串"，一眼能看出原类型。
  if (type === 'undefined') return '[undefined]';
  if (type === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (type === 'symbol') return `[Symbol ${String(value.description)}]`;
  if (type === 'bigint') return `[BigInt ${value}]`;
  // NaN / Infinity / -Infinity 在 JSON.stringify 里会变成 null，语义丢失，这里显式标记。
  if (type === 'number') return Number.isFinite(value) ? value : `[${String(value)}]`;
  if (type !== 'object') return value;

  if (seen.has(value)) return '[Circular]'; // 循环引用，避免无限递归
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => normalize(item, seen));
  if (value instanceof Date) return `[Date ${value.toISOString()}]`;
  if (value instanceof RegExp) return `[RegExp ${value.toString()}]`;

  // Map / Set 排序后输出，保证"插入顺序不同"不会造成假阳性。
  if (value instanceof Map) {
    const entries = [...value.entries()]
      .map(([k, v]) => [normalize(k, seen), normalize(v, seen)])
      .sort((a, b) => JSON.stringify(a[0]).localeCompare(JSON.stringify(b[0])));
    return { '[Map]': entries };
  }
  if (value instanceof Set) {
    const items = [...value].map((v) => normalize(v, seen));
    items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return { '[Set]': items };
  }

  // 普通对象：**按 key 排序**后重建，这是"稳定序列化"的关键一步。
  const sorted = {};
  for (const key of Object.keys(value).sort()) {
    sorted[key] = normalize(value[key], seen);
  }
  return sorted;
}

/**
 * 把值序列化成快照文本。
 * 末尾补一个换行符，是为了让快照文件本身也是一个合法文本文件（避免 \ No newline 提示）。
 */
function serialize(value) {
  return JSON.stringify(normalize(value), null, 2) + '\n';
}

const sampleOrder = { id: 7, name: '键盘', tags: ['电子', '外设'], price: 199.5 };
const sampleReordered = { price: 199.5, tags: ['电子', '外设'], name: '键盘', id: 7 };
console.log('原始对象序列化：');
console.log(serialize(sampleOrder));
console.log(
  '键顺序被打乱后，序列化结果仍然完全一致：',
  serialize(sampleOrder) === serialize(sampleReordered),
);
console.log();

// ---------------------------------------------------------------------------
// 1.2 简单行级 diff：快照失败时，让你一眼看到"哪一行变了"
// ---------------------------------------------------------------------------

/**
 * 生成一个极简的逐行 diff（类似 git diff 的输出形式）。
 * 真实工具用 LCS 算法算最小编辑脚本，这里为了可读性做最简单的"按位置对齐"比较。
 *
 * @param {string} expected 快照文件里的内容
 * @param {string} actual 本次实际输出
 * @returns {string} 带 +/- 前缀的差异文本
 */
function diffLines(expected, actual) {
  const a = expected.split('\n');
  const b = actual.split('\n');
  const lines = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i] === b[i]) {
      // 相同的行只在差异行附近展示，避免 diff 太长
      lines.push(`   ${a[i] ?? ''}`);
    } else {
      if (a[i] !== undefined) lines.push(` - ${a[i]}`);
      if (b[i] !== undefined) lines.push(` + ${b[i]}`);
    }
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// 1.3 迷你快照存储器：对应 Jest 的 __snapshots__ 目录 / Node 的 .snapshot 文件
// ---------------------------------------------------------------------------

/**
 * 创建一个快照存储器。
 *
 * 工作原理与真实实现完全一致：
 *   - 文件不存在 → 认为所有快照都是"新的"，写入后本次**算通过**（首次运行）；
 *   - 文件存在   → 逐条比对，不一致则记为失败；
 *   - update 模式（对应 -u / --test-update-snapshots）→ 无条件用当前输出覆盖。
 *
 * @param {string} filePath 快照文件路径
 * @param {{ update?: boolean, scrub?: (value: unknown) => unknown }} [options]
 */
function createSnapshotStore(filePath, options = {}) {
  const { update = false, scrub = (v) => v } = options;
  const existedBefore = fs.existsSync(filePath);
  /** @type {Record<string, string>} 快照名 -> 快照文本 */
  const stored = existedBefore ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : {};

  return {
    /** 记录本次运行中每条快照的结果，供最后汇总打印 */
    results: [],

    /**
     * 断言一条快照。
     * @param {string} name 快照名（真实实现里是"测试名 + 序号"）
     * @param {unknown} value 要快照的值
     * @returns {{ status: 'created'|'matched'|'mismatch'|'updated', expected?: string, actual: string, diff?: string }}
     */
    match(name, value) {
      // 关键：先脱敏，再序列化。易变字段必须在序列化之前就被替换掉。
      const actual = serialize(scrub(value));
      const expected = stored[name];

      let status;
      let diff;

      if (expected === undefined) {
        // 情况一：快照文件里没有这一条 —— 首次运行，写进去，本次算通过。
        status = 'created';
        stored[name] = actual;
        this.dirty = true;
      } else if (expected === actual) {
        status = 'matched'; // 情况二：完全一致，通过
      } else if (update) {
        status = 'updated'; // 情况三：-u 更新模式，无论差异多大都直接覆盖
        stored[name] = actual;
        this.dirty = true;
        diff = diffLines(expected, actual);
      } else {
        status = 'mismatch'; // 情况四：不一致且没开更新 —— 失败，附上 diff
        diff = diffLines(expected, actual);
      }

      const result = { status, expected, actual, diff };
      this.results.push({ name, ...result });
      return result;
    },

    /** 把内存中的快照表写回磁盘 */
    save() {
      if (!existedBefore || this.dirty) {
        fs.writeFileSync(filePath, JSON.stringify(stored, null, 2) + '\n', 'utf8');
        return true;
      }
      return false;
    },

    /** 读取当前磁盘上的快照文件内容（用于打印） */
    read() {
      return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '(文件不存在)';
    },

    get filePath() {
      return filePath;
    },
  };
}

// ---------------------------------------------------------------------------
// 1.4 迷你运行器：让"失败的快照"能被演示而不让整个进程退出码变 1
// ---------------------------------------------------------------------------

/**
 * 运行一个用例，捕获断言失败后只打印、不向上抛。
 *
 * 为什么需要它？
 *   本文件要求 `node 28_testing/11_snapshot_testing.js` 的退出码必须是 0，
 *   而"演示快照失败"这件事本身天然会抛错。真实项目里你不需要它 ——
 *   `node --test` 的红色输出就是你的反馈。
 *
 * @param {string} name 用例名
 * @param {() => void} fn 用例体
 * @returns {'pass'|'fail'} 结果
 */
function miniRun(name, fn) {
  try {
    fn();
    console.log(`  ✔ ${name}`);
    return 'pass';
  } catch (err) {
    console.log(`  ✖ ${name}`);
    console.log(
      String(err.message)
        .split('\n')
        .map((l) => `      ${l}`)
        .join('\n'),
    );
    return 'fail';
  }
}

// ===========================================================================
// 第 2 部分：快照的完整生命周期
// ===========================================================================

console.log('--- 2. 快照的一生：生成 → 通过 → 失败 → 更新 ---');

// 被测代码：一个"生成商品卡片文本"的函数。
// 输出结构比较复杂（多行、嵌套），正是快照测试最典型的适用场景。
/**
 * @param {{ name: string, price: number, tags: string[], stock: number }} product
 * @returns {string} 多行卡片文本
 */
function renderProductCard(product) {
  const lines = [`【${product.name}】`, `价格：￥${product.price.toFixed(2)}`];
  if (product.tags.length > 0) lines.push(`标签：${product.tags.join(' / ')}`);
  lines.push(product.stock > 0 ? `现货：${product.stock} 件` : '缺货');
  return lines.join('\n');
}

const keyboard = { name: '机械键盘', price: 399, tags: ['电子', '外设'], stock: 12 };

const snapFile = path.join(WORK_DIR, 'product-card.snapshot.json');

// --- 第 1 次运行：快照文件还不存在 ---
console.log('第 1 次运行（快照文件不存在）：');
const store1 = createSnapshotStore(snapFile);
let r = store1.match('renderProductCard 1', renderProductCard(keyboard));
console.log(`  快照状态：${r.status}（首次运行自动记录，本次算通过）`);
console.log('  写入的内容：');
console.log(
  r.actual
    .trimEnd()
    .split('\n')
    .map((l) => `      ${l}`)
    .join('\n'),
);
store1.save();
console.log(`  快照文件已生成：${path.basename(snapFile)}`);
console.log();

// --- 第 2 次运行：快照已存在，内容一致 ---
console.log('第 2 次运行（代码没变，快照已存在）：');
const store2 = createSnapshotStore(snapFile);
let passCount = 0;
let failCount = 0;

if (
  miniRun('renderProductCard 的输出与快照一致', () => {
    const res = store2.match('renderProductCard 1', renderProductCard(keyboard));
    assert.equal(res.status, 'matched', `期望 matched，实际 ${res.status}`);
  }) === 'pass'
)
  passCount++;
else failCount++;
store2.save();
console.log();

// --- 第 3 次运行：故意改坏代码，快照应该报红 ---
console.log('第 3 次运行（引入了"包邮"这行，输出变了）：');

/**
 * 一个"被改坏"的版本：多加了一行，模拟有人在重构时无意改变了输出。
 * @param {object} product
 */
function renderProductCardWithBug(product) {
  // 假设这是某个新人顺手加的，但并没有人 review 这个变化
  return renderProductCard(product) + '\n包邮';
}

const store3 = createSnapshotStore(snapFile);
const result3 = miniRun('renderProductCard 的输出与快照一致', () => {
  const res = store3.match('renderProductCard 1', renderProductCardWithBug(keyboard));
  if (res.status !== 'matched') {
    throw new Error(
      `快照不一致（状态 ${res.status}）。差异如下：\n${res.diff}\n` +
        '提示：请逐行确认这个变化是不是你有意为之，然后才决定要不要 -u 更新。',
    );
  }
});
if (result3 === 'fail') failCount++;
store3.save(); // 失败时不应写盘 —— save() 内部只在 dirty 为真时才写，mismatch 不改内存
console.log(`  （快照文件未被修改，仍是上一次的内容）`);
console.log();

// --- 第 4 次运行：确认变化是有意的，用 -u 更新 ---
console.log('第 4 次运行（确认 "包邮" 是本次有意新增的功能，执行 -u 更新）：');
const store4 = createSnapshotStore(snapFile, { update: true });
const res4 = store4.match('renderProductCard 1', renderProductCardWithBug(keyboard));
console.log(`  快照状态：${res4.status}（-u 模式下无论如何都覆盖）`);
console.log('  被替换掉的差异：');
console.log(
  res4.diff
    .split('\n')
    .map((l) => `      ${l}`)
    .join('\n'),
);
store4.save();

// --- 第 5 次运行：更新后再次比对，应该通过 ---
console.log('第 5 次运行（更新后重新校验）：');
const store5 = createSnapshotStore(snapFile);
if (
  miniRun('更新后的快照与新输出一致', () => {
    const res = store5.match('renderProductCard 1', renderProductCardWithBug(keyboard));
    assert.equal(res.status, 'matched');
  }) === 'pass'
)
  passCount++;
else failCount++;
store5.save();
console.log();

// ===========================================================================
// 第 3 部分：易变字段的脱敏（scrub）—— 让快照不再"无缘无故变红"
// ===========================================================================

console.log('--- 3. 易变字段脱敏：时间戳 / 随机 ID / 绝对路径 ---');

// 用自增序号 + 随机串，保证每次调用产生的都是"不一样的"记录 —— 这正是现实中
// 时间戳和 requestId 的行为，也正是快照最容易被它们搞红的原因。
let logSequence = 0;

/**
 * 生成一条"看起来正常但实际上每次都不一样"的日志记录。
 * 时间戳、随机 ID、临时目录路径，都是快照的经典杀手。
 * @returns {object}
 */
function createLogEntry() {
  logSequence++;
  return {
    level: 'info',
    message: '用户登录成功',
    timestamp: new Date(Date.now() + logSequence * 1000).toISOString(),
    requestId: `req-${logSequence}-${Math.random().toString(36).slice(2, 8)}`,
    traceFile: path.join(os.tmpdir(), 'app-logs', 'trace.log'),
    userId: 42,
  };
}

const scrubFile = path.join(WORK_DIR, 'log-entry.snapshot.json');

/**
 * 脱敏函数：把"每次都不一样的字段"替换成稳定的占位符。
 *
 * 注意脱敏的原则：
 *   - 替换成固定字符串（如 '<timestamp>'），而不是删掉这个字段，
 *     因为"字段还存不存在"本身就是一个值得断言的结构信息；
 *   - 只脱敏真正易变的部分，不要顺手把业务字段也抹掉，
 *     否则快照就只剩下"骨架"，失去了捕捉意外的能力。
 *
 * @param {Record<string, unknown>} entry
 * @returns {Record<string, unknown>}
 */
function scrubLogEntry(entry) {
  return {
    ...entry,
    timestamp: '<timestamp>',
    requestId: '<requestId>',
    traceFile: path.join('<tmpdir>', path.basename(String(entry.traceFile))),
  };
}

// 第 1 次：不带脱敏 —— 每次运行结果都不同，快照永远红
const rawStore = createSnapshotStore(scrubFile);
rawStore.match('log 1', createLogEntry());
rawStore.save();

const rawA = serialize(createLogEntry());
const rawB = serialize(createLogEntry());
console.log('不做脱敏时，连续两次序列化的结果是否相同：', rawA === rawB);
console.log('  → 相同的部分是这些固定字段：level / message / userId；');
console.log('  → 不同的部分是 timestamp / requestId / traceFile（这正是"假阳性"的来源）');

const scrubA = serialize(scrubLogEntry(createLogEntry()));
const scrubB = serialize(scrubLogEntry(createLogEntry()));
console.log('脱敏后，连续两次序列化的结果是否相同：', scrubA === scrubB, '（这才是可用的快照）');

// 第 2 次：带脱敏 —— 稳定通过
const scrubbedFile = path.join(WORK_DIR, 'log-entry-scrubbed.snapshot.json');
const scStore1 = createSnapshotStore(scrubbedFile, { scrub: scrubLogEntry });
scStore1.match('log 1', createLogEntry());
scStore1.save();

const scStore2 = createSnapshotStore(scrubbedFile, { scrub: scrubLogEntry });
if (
  miniRun('脱敏后的日志快照，两次运行结果一致', () => {
    const res = scStore2.match('log 1', createLogEntry());
    assert.equal(res.status, 'matched');
  }) === 'pass'
)
  passCount++;
else failCount++;
console.log('  脱敏后的快照内容：');
console.log(
  scStore2.read()
    .trimEnd()
    .split('\n')
    .map((l) => `      ${l}`)
    .join('\n'),
);
console.log();

// ===========================================================================
// 第 4 部分：真实 node:test 快照 API 的特性检测 + 子进程完整演示
// ===========================================================================

console.log('--- 4. 真实 node:test 快照 API（t.assert.snapshot）特性检测 ---');

/**
 * 在真实测试上下文里探测快照 API 是否可用。
 *
 * 为什么要开子进程探测，而不是在本文件里直接探测？
 *   因为 node:test 的用例是**在模块顶层代码全部执行完之后**才被调度运行的。
 *   如果在本文件里写 `await new Promise(r => test('探测', t => r(...)))`，
 *   就会形成死锁：你在等测试跑完，而测试要等你 await 结束。
 *   这是使用 node:test 时一个非常容易踩的坑。
 *
 * @returns {{ available: boolean, names: string[], raw: string }}
 */
function probeSnapshotApi() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'js-ex-11-probe-'));
  const probeFile = path.join(dir, 'probe.test.mjs');
  fs.writeFileSync(
    probeFile,
    [
      "import { test } from 'node:test';",
      "test('probe', (t) => {",
      "  const names = ['snapshot', 'fileSnapshot'].filter((n) => typeof t.assert[n] === 'function');",
      "  console.log('SNAPSHOT_API_PROBE:' + names.join(','));",
      '});',
      '',
    ].join('\n'),
    'utf8',
  );

  const res = spawnSync(process.execPath, ['--test', 'probe.test.mjs'], {
    cwd: dir,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  const raw = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  fs.rmSync(dir, { recursive: true, force: true });

  const m = raw.match(/SNAPSHOT_API_PROBE:(.*)/);
  const names = m && m[1].trim() ? m[1].trim().split(',') : [];
  return { available: names.includes('snapshot'), names, raw };
}

// ---------------------------------------------------------------------------
// 注：本文件里还有一处"不能在模块顶层探测"的演示。
//   下面的 console.log 拿的是**模块命名空间上的 assert**，
//   它和测试回调里的 t.assert 不是同一个对象。
// ---------------------------------------------------------------------------
const moduleLevelAssert = (await import('node:test')).assert;
console.log(
  '模块顶层的 assert.snapshot 类型：',
  typeof moduleLevelAssert.snapshot,
  '（undefined 属正常，别在这里做判断）',
);

const probe = probeSnapshotApi();
console.log(`  探测结果：t.assert 上可用的快照方法 = ${probe.names.join(', ') || '（无）'}`);
console.log(`  原生快照可用：${probe.available ? '是' : '否'}`);
console.log();

/**
 * 在临时目录里完整跑一遍原生快照的四个阶段。
 *
 * 为什么要开子进程？
 *   1. 原生快照必须在 `node --test` 模式下运行，而本文件是用 `node xxx.js`
 *      直接执行的，没法在半途切换；
 *   2. 快照文件会写在被测文件旁边，放临时目录才不会污染仓库。
 *
 * @returns {Array<{ step: string, exitCode: number, summary: string }>}
 */
function runNativeSnapshotDemo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'js-ex-11-native-'));
  const testFile = path.join(dir, 'demo.test.mjs');
  const snapFile = `${testFile}.snapshot`;

  // 被测文件：一个 node:test 用例，对一段结构化输出做快照
  fs.writeFileSync(
    testFile,
    [
      "import { test } from 'node:test';",
      "import assert from 'node:assert/strict';",
      '',
      'function buildReport(rows) {',
      "  return rows.map((r) => `${r.name}\\t￥${r.price.toFixed(2)}\\t${r.stock > 0 ? '有货' : '缺货'}`).join('\\n');",
      '}',
      '',
      "const rows = [{ name: '机械键盘', price: 399, stock: 12 }, { name: '鼠标垫', price: 29.9, stock: 0 }];",
      '',
      "test('报表文本渲染', (t) => {",
      '  const text = buildReport(rows);',
      '  // 少量"能判断对错"的关键值，仍然用显式断言 —— 这正是快照的边界所在',
      "  assert.equal(text.split('\\n').length, 2);",
      '  // 大段结构化的输出，交给快照',
      '  t.assert.snapshot(text);',
      '});',
      '',
    ].join('\n'),
    'utf8',
  );

  /** 执行一次 node --test 并抽取出通过/失败计数 */
  const run = (args) => {
    const res = spawnSync(process.execPath, args, {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
    const out = `${res.stdout ?? ''}${res.stderr ?? ''}`;
    const pick = (label) => {
      const m = out.match(new RegExp(`# ${label} (\\d+)|ℹ ${label} (\\d+)`));
      return m ? (m[1] ?? m[2]) : '?';
    };
    return { exitCode: res.status, pass: pick('pass'), fail: pick('fail'), out };
  };

  const steps = [];
  const record = (title, r) => {
    steps.push({
      step: title,
      exitCode: r.exitCode,
      summary: `pass=${r.pass} fail=${r.fail}`,
    });
  };

  // 阶段一：快照不存在，用 --test-update-snapshots 生成（同时本阶段就通过）
  const s1 = run(['--test', '--test-update-snapshots', 'demo.test.mjs']);
  record('① --test --test-update-snapshots（生成快照）', s1);

  // 阶段二：正常校验，应当通过
  const s2 = run(['--test', 'demo.test.mjs']);
  record('② --test（校验，应当通过）', s2);

  // 阶段三：改坏被测代码 → 校验失败（这里就能看到真实的红色输出）
  const broken = fs
    .readFileSync(testFile, 'utf8')
    .replace("￥${r.price.toFixed(2)}", "￥${r.price}"); // 价格丢了两位小数
  fs.writeFileSync(testFile, broken, 'utf8');
  const s3 = run(['--test', 'demo.test.mjs']);
  record('③ 改动输出后 --test（应当失败）', s3);

  // 阶段四：确认改动是有意的，用 --test-update-snapshots 更新并恢复绿色
  const s4 = run(['--test', '--test-update-snapshots', 'demo.test.mjs']);
  record('④ --test --test-update-snapshots（更新后恢复绿色）', s4);

  const snapshotContent = fs.existsSync(snapFile) ? fs.readFileSync(snapFile, 'utf8') : '(未生成)';
  fs.rmSync(dir, { recursive: true, force: true }); // 清理临时目录
  return { steps, snapshotContent, failureOutput: s3.out };
}

const native = runNativeSnapshotDemo();
console.log('  快照文件内容长这样（Node 原生格式）：');
console.log(
  native.snapshotContent
    .trimEnd()
    .split('\n')
    .map((l) => `      ${l}`)
    .join('\n'),
);
console.log();
console.log('  四个阶段的真实退出码：');
for (const s of native.steps) {
  console.log(`    ${s.step.padEnd(46, ' ')} 退出码=${s.exitCode}  ${s.summary}`);
}
console.log();
console.log('  阶段 ③（失败）时 node --test 的真实报错片段：');
console.log(
  native.failureOutput
    .split('\n')
    .filter((l) => /snapshot|Snapshot|^\s*[+-]\s/.test(l))
    .slice(0, 12)
    .map((l) => `      ${l}`)
    .join('\n') || '      (无匹配行)',
);
console.log();

// ===========================================================================
// 第 5 部分：到底什么时候该用 / 不该用快照
// ===========================================================================

console.log('--- 5. 决策表：什么时候不该用快照 ---');

/** 判断一条断言语义该不该用快照的对照表 */
const decisionTable = [
  {
    scenario: '组件/函数的完整渲染输出（结构大、值稳定）',
    useSnapshot: true,
    why: '手工写期望值不现实，快照能捕捉"意想不到的变化"',
  },
  {
    scenario: '金额、数量、状态码、总数等"我能判断对错"的值',
    useSnapshot: false,
    why: '这些值本身就携带业务含义，必须由人写死成显式断言；用快照会把错误一并固化',
  },
  {
    scenario: 'CLI 的 --help / 错误提示文案',
    useSnapshot: true,
    why: '文案是对外契约的一部分，改动应该被显式 review',
  },
  {
    scenario: '含时间戳 / 随机 ID / 绝对路径 / 浮点尾数的输出',
    useSnapshot: false,
    why: '不脱敏就会永远变红，最终演变成"红了就 -u"，等于没有测试',
  },
  {
    scenario: '超过几百行、没人会逐行看的巨型输出',
    useSnapshot: false,
    why: '没有人 review 的断言不是断言；应缩小快照范围或改用结构化断言',
  },
  {
    scenario: '刚写好的、还没有任何显式断言的新功能',
    useSnapshot: false,
    why: '先写显式断言确认行为正确，再对"稳定的附加结构"补快照',
  },
];

console.log('  ' + '场景'.padEnd(34) + '用快照？  理由');
console.log('  ' + '-'.repeat(96));
for (const row of decisionTable) {
  console.log(`  ${row.scenario.padEnd(30)}  ${(row.useSnapshot ? '是' : '否').padEnd(8)} ${row.why}`);
}
console.log();

// ===========================================================================
// 第 6 部分：把迷你快照引擎本身也当成被测对象，跑一组真实 node:test 用例
// ===========================================================================

console.log('--- 6. 用真实 node:test 测试迷你快照引擎 ---');
// 注意：node:test 的用例是在本文件所有顶层代码跑完之后才被调度的，
// 所以下面这些 ✔ / ✖ 的输出会**排在**本脚本所有 console.log 之后，这是正常的。
console.log('（本节的用例输出会出现在本脚本所有 console.log 之后，详见代码注释）');

/**
 * 预先写好一份快照文件，模拟"上一次运行留下的快照"。
 * 不这么做的话，第一次 match() 只会返回 created 而不写盘 —— 这正是真实
 * 快照工具的行为：生成与比对是两个不同阶段。
 * @param {string} fileName 快照文件名（放在临时工作目录下）
 * @param {string} name 快照名
 * @param {unknown} value 要固化下来的值
 * @param {{ scrub?: (v: unknown) => unknown }} [options]
 * @returns {string} 快照文件的绝对路径
 */
function seedSnapshot(fileName, name, value, options = {}) {
  const file = path.join(WORK_DIR, fileName);
  const store = createSnapshotStore(file, options);
  store.match(name, value);
  store.save();
  return file;
}

test('【也是探测】在真实测试上下文里，t.assert 上挂着哪些快照方法', (t) => {
  const names = ['snapshot', 'fileSnapshot'].filter((n) => typeof t.assert[n] === 'function');
  // 按运行环境报告事实，不做"必须有"的断言（否则低版本 Node 会直接失败）
  console.log(`    → 本机 t.assert 可用快照方法：${names.join(', ') || '（无）'}`);
  assert.ok(Array.isArray(names));
});

test('首次运行时状态是 created，并且会写盘', () => {
  const f = path.join(WORK_DIR, 't-created.snapshot.json');
  const store = createSnapshotStore(f);
  const res = store.match('x 1', { a: 1 });
  assert.equal(res.status, 'created');
  assert.equal(store.save(), true);
  assert.ok(fs.existsSync(f));
});

test('第二次运行状态是 matched', () => {
  const f = seedSnapshot('t-matched.snapshot.json', 'x 1', { a: 1 });
  const res = createSnapshotStore(f).match('x 1', { a: 1 });
  assert.equal(res.status, 'matched');
});

test('值变化且未开更新时状态是 mismatch，并给出 diff', () => {
  const f = seedSnapshot('t-mismatch.snapshot.json', 'x 1', { a: 1 });
  const res = createSnapshotStore(f).match('x 1', { a: 2 });
  assert.equal(res.status, 'mismatch');
  assert.match(res.diff, /- {3}"a": 1/); // 期望值那一行，前缀是 " - "
  assert.match(res.diff, /\+ {3}"a": 2/); // 实际值那一行，前缀是 " + "
});

test('mismatch 且未开 update 时，快照文件不会被污染', () => {
  const f = seedSnapshot('t-nowrite.snapshot.json', 'x 1', { a: 1 });
  const before = fs.readFileSync(f, 'utf8');
  const store = createSnapshotStore(f);
  store.match('x 1', { a: 2 });
  assert.equal(store.save(), false); // 没有改动，save() 拒绝写盘
  assert.equal(fs.readFileSync(f, 'utf8'), before);
});

test('update 模式下 mismatch 会被覆盖成 updated，之后校验通过', () => {
  const f = seedSnapshot('t-update.snapshot.json', 'x 1', { a: 1 });
  const store = createSnapshotStore(f, { update: true });
  const res = store.match('x 1', { a: 2 });
  assert.equal(res.status, 'updated');
  store.save();
  assert.equal(createSnapshotStore(f).match('x 1', { a: 2 }).status, 'matched');
});

test('对象键顺序不影响快照稳定性（避免假阳性）', () => {
  assert.equal(serialize({ a: 1, b: 2 }), serialize({ b: 2, a: 1 }));
});

test('循环引用不会导致无限递归', () => {
  const obj = { name: 'loop' };
  obj.self = obj; // 自己引用自己
  const text = serialize(obj);
  assert.match(text, /\[Circular\]/);
});

test('Map / Set 的插入顺序不影响快照稳定性', () => {
  const m1 = serialize(new Map([['b', 2], ['a', 1]]));
  const m2 = serialize(new Map([['a', 1], ['b', 2]]));
  assert.equal(m1, m2);
});

test('易变字段脱敏后，两次不同输入产生相同快照', () => {
  const scrub = (v) => ({ ...v, timestamp: '<ts>' });
  const f = seedSnapshot('t-scrub.snapshot.json', 'log 1', { msg: 'a', timestamp: 111 }, { scrub });
  const res = createSnapshotStore(f, { scrub }).match('log 1', { msg: 'a', timestamp: 999 });
  assert.equal(res.status, 'matched', '脱敏后 timestamp 的差异不该导致快照失败');
});

test('不脱敏时，易变字段会导致快照失败（这就是"假阳性"）', () => {
  const f = seedSnapshot('t-noscrub.snapshot.json', 'log 1', { msg: 'a', timestamp: 111 });
  const res = createSnapshotStore(f).match('log 1', { msg: 'a', timestamp: 999 });
  assert.equal(res.status, 'mismatch');
});

// 汇总迷你运行器的结果（这是第 2 部分的收尾，放在最后打印更直观）
console.log();
console.log('--- 7. 迷你运行器汇总 ---');
console.log(`  通过：${passCount}，失败：${failCount}（失败是被**故意**演示出来的，已被捕获）`);
console.log(`  真实 node:test 快照 API 探测结果：${probe.available ? '可用' : '不可用'}`);
console.log('  （本机实测：t.assert.snapshot 存在，但必须配合 --test 运行，');
console.log('   直接 node file.js 会抛 ERR_INVALID_STATE）');
console.log(`  临时工作目录：${WORK_DIR}（脚本结束时自动删除）`);
