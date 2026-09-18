/**
 * ============================================================================
 * 知识点：模块级 mock —— 为什么打不到内部 import，以及依赖注入这个正解
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试
 * 【难度等级】高级
 * 【前置知识】28_testing/05_mocking_basics.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "模块级 mock"指：让被测模块在 import 某个依赖时，拿到的是一个假的模块。
 *    它是所有 mock 手段里最"重"的一种，因为要动手改的是**模块解析**这件事，
 *    而不是某个函数或某个对象。
 *
 *    与之相对的"对象级 mock"（mock.method(obj, 'x', fake)）要轻得多，
 *    因为它只需要替换一个对象上的一个属性。
 *
 * 2. 为什么需要（真实项目场景）
 *    真实代码里，依赖常常是这样进来的：
 *        import { sendEmail } from './email-client.js';   // 模块顶层静态导入
 *    于是测试时你想"让发邮件失败"，会发现无从下手 —— 这是几乎所有
 *    从 Jest（CJS）迁移到 ESM 的团队都会撞上的第一堵墙。
 *    原因不是工具不行，而是**语言层面的规则**：ESM 的 import 是静态绑定。
 *
 * 3. 核心语法要点
 *    - ESM 的 `import { x } from './m.js'` 在模块**加载阶段**就完成了绑定，
 *      得到的是一个"活的、只读的"绑定（live binding）。
 *    - 模块命名空间对象（`import * as ns`）是一个 **module namespace exotic object**：
 *      它的属性描述符写着 writable: true，但对它赋值会抛
 *      `TypeError: Cannot assign to read only property 'x' of object '[object Module]'`。
 *      因为它没有 [[Set]] 内部方法 —— 这是规范刻意设计的，保证绑定不可被篡改。
 *    - 因此 `mock.method(ns, 'x', fake)` 也会抛 `TypeError: Cannot redefine property: x`。
 *    - node:test 的 `mock.module(specifier, { exports })` 是**官方**的模块级 mock，
 *      需要 `--experimental-test-module-mocks` 标志（Node 22.3+）。
 *      它替换的是"模块注册表里的一项"，因此只对**此后才被加载**的模块生效。
 *    - 反过来：如果依赖是在**调用时通过一个对象**取到的（`deps.smtp.send(...)`），
 *      那么替换 `deps.smtp.send` 就是一个普通的属性赋值 —— 完全可行。
 *    - 最省事的方案其实是**依赖注入**：把依赖作为参数传进来，测试时传个假的。
 *      不需要任何 mock API，不需要实验标志，跑得还更快。
 *
 * 4. 常见陷阱
 *    - 以为 `mock.fn()` 能拦住模块内部的 import：`mock.fn` 造的是一个新函数，
 *      只有当你把它**传进**被测代码时才有意义，它管不到模块内部的绑定。
 *    - 在 ESM 里尝试 `ns.fn = fake` 或 `obj.fn = fake` 打桩后没恢复，
 *      污染后续用例。
 *    - 用 `--experimental-test-module-mocks` 时忘了它是实验特性，
 *      CI 上换个 Node 小版本就可能行为不同。
 *    - 先 import 再 mock.module：模块已在注册表里，mock 对已加载的图无效。
 *    - 把"为了让代码可测"当成可选项：可测性不是测试工程师的事，
 *      它是**生产代码的设计属性**。本文件第 4 节的对比会让你直观看到差异。
 *    - 过度使用模块 mock：一旦你 mock 掉了被测模块的五个依赖，
 *      你测的其实是"我对这些依赖的假设"，而不是真实行为。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/13_module_mocking.js
 *
 * 【预期输出】
 *   1) 三个真实实验：直接 import 的函数打不进去、命名空间对象不可写、
 *      但"通过对象访问的依赖"可以打桩；
 *   2) 对 mock.module 做特性检测，并另起子进程跑一次真实演示，
 *      打印"静态导入不受影响、动态导入拿到假模块"的真实输出；
 *   3) "难测的写法"与"易测的写法"的实测对比（含耗时）；
 *   4) 真实 node:test 用例全部通过，退出码 0。
 * ============================================================================
 */

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// 所有实验用的模块都写在系统临时目录里，结束后统一删除。
const WORK_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'js-ex-13-modmock-'));

after(() => {
  fs.rmSync(WORK_DIR, { recursive: true, force: true });
});

/** 写一个模块文件到临时工作目录，返回它的 file:// URL（供 import() 使用） */
function writeModule(fileName, source) {
  const file = path.join(WORK_DIR, fileName);
  fs.writeFileSync(file, source, 'utf8');
  return pathToFileURL(file).href;
}

/** 承诺的 sleep，用于模拟真实 IO 的耗时 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ===========================================================================
// 第 1 部分：实验 —— 为什么"打不进"被测模块内部的 import
// ===========================================================================

console.log('--- 1. 三个实验：弄清 mock 到底能打到什么 ---');

// --- 实验 A：模块直接导出函数，外部打不进去 ---
const depA = writeModule(
  'dep-a.mjs',
  [
    '/** 模拟一个真实的外部依赖（发短信、查汇率、调支付……） */',
    'export function send(phone, text) {',
    "  return { ok: true, channel: 'real-sms', phone, text };",
    '}',
    '',
  ].join('\n'),
);

// --- 实验 B：模块导出一个对象，对象上的方法可以被替换 ---
const depB = writeModule(
  'dep-b.mjs',
  [
    '/** 同样的依赖，但包装成一个对象导出 */',
    'export const smsClient = {',
    '  send(phone, text) {',
    "    return { ok: true, channel: 'real-sms', phone, text };",
    '  },',
    '};',
    '',
  ].join('\n'),
);

// --- 被测模块 1：直接 import 函数（"难打桩"的写法）---
const svcHard = writeModule(
  'svc-hard.mjs',
  [
    "import { send } from './dep-a.mjs';",
    '',
    '/** 下单成功后发短信。依赖是模块顶层静态导入的。 */',
    'export function notifyOrderCreated(phone) {',
    "  return send(phone, '您的订单已创建');",
    '}',
    '',
  ].join('\n'),
);

// --- 被测模块 2：通过对象调用（"好打桩"的写法）---
const svcObject = writeModule(
  'svc-object.mjs',
  [
    "import { smsClient } from './dep-b.mjs';",
    '',
    '/** 同样的逻辑，但依赖是通过对象在**调用时**取到的。 */',
    'export function notifyOrderCreated(phone) {',
    "  return smsClient.send(phone, '您的订单已创建');",
    '}',
    '',
  ].join('\n'),
);

const depANs = await import(depA);
const depBNs = await import(depB);
const svcHardNs = await import(svcHard);
const svcObjectNs = await import(svcObject);

console.log('实验 A：尝试篡改模块导出的函数（这是很多人第一反应会做的事）');
// 先确认一下原始属性描述符：它写着 writable: true，这会骗到不少人
const descA = Object.getOwnPropertyDescriptor(depANs, 'send');
console.log('  Object.getOwnPropertyDescriptor(ns, "send").writable =', descA.writable);
console.log('  但赋值时依然会抛错，因为模块命名空间对象没有 [[Set]] 内部方法：');
try {
  depANs.send = () => ({ ok: true, channel: 'FAKE' });
  console.log('  赋值成功（不该发生）');
} catch (err) {
  console.log(`  → ${err.constructor.name}: ${err.message}`);
}
try {
  const { mock } = await import('node:test');
  mock.method(depANs, 'send', () => ({ ok: true, channel: 'FAKE' }));
  console.log('  mock.method 成功（不该发生）');
} catch (err) {
  console.log(`  → mock.method 抛出 ${err.constructor.name}: ${err.message}`);
}
console.log(`  结果：notifyOrderCreated("138") = ${JSON.stringify(svcHardNs.notifyOrderCreated('138'))}`);
console.log('  → 结论：静态 import 出来的函数绑定，外部**无法**替换。');
console.log();

console.log('实验 B：依赖换成"对象上的方法"，同样的篡改就成立了');
const originalSend = depBNs.smsClient.send;
depBNs.smsClient.send = () => ({ ok: true, channel: 'FAKE-SMS' }); // 普通属性赋值
console.log(`  → 赋值成功，notifyOrderCreated("138") = ${JSON.stringify(svcObjectNs.notifyOrderCreated('138'))}`);
console.log('  关键差别：');
console.log('    - 实验 A 里，被测模块拿到的是**函数的绑定本身**，导入那一刻就固定了；');
console.log('    - 实验 B 里，被测模块拿到的是**对象的绑定**，对象是同一个引用，');
console.log('      改它上面的属性，调用点就能看到 —— 这正是一切对象级 mock 的基础。');
console.log(`  （记得还原：send = ${originalSend ? '原函数' : '?'}）`);
depBNs.smsClient.send = originalSend; // 打桩必须还原，否则污染后续用例
console.log(`  还原后：notifyOrderCreated("138") = ${JSON.stringify(svcObjectNs.notifyOrderCreated('138'))}`);
console.log();

console.log('实验 C：既然不能改绑定，那"改文件内容"行不行？');
const before = svcHardNs.notifyOrderCreated('138');
// 把依赖文件的内容整个换掉
fs.writeFileSync(
  path.join(WORK_DIR, 'dep-a.mjs'),
  "export function send() { return { ok: true, channel: 'FAKE-AFTER-REWRITE' }; }\n",
  'utf8',
);
const afterRewrite = svcHardNs.notifyOrderCreated('138');
console.log(`  改写依赖文件前：${JSON.stringify(before)}`);
console.log(`  改写依赖文件后：${JSON.stringify(afterRewrite)}`);
console.log(
  `  → 结果是否变化：${JSON.stringify(before) !== JSON.stringify(afterRewrite)}`,
  '（模块已进缓存，改文件对已加载的模块无效）',
);
console.log();

// ===========================================================================
// 第 2 部分：node:test 的 mock.module —— 特性检测 + 子进程真实演示
// ===========================================================================

console.log('--- 2. node:test 的 mock.module（实验特性，必须特性检测）---');

/**
 * 特性检测：mock.module 是否存在。
 *
 * 注意用 `node -e` 而不是在当前进程里检测 —— 因为标志必须**在启动时**给，
 * 已经跑起来的进程没法再打开它。这也是"实验特性"在工程上的典型麻烦。
 *
 * @returns {{ available: boolean, requiredFlag: string }}
 */
function probeModuleMockSupport() {
  const requiredFlag = '--experimental-test-module-mocks';
  const script = "import('node:test').then((t) => console.log('HAS_MOCK_MODULE:' + (typeof t.mock.module)))";

  // 不带标志
  const withoutFlag = spawnSync(process.execPath, ['-e', script], { encoding: 'utf8' });
  // 带标志
  const withFlag = spawnSync(process.execPath, [requiredFlag, '-e', script], { encoding: 'utf8' });

  const parse = (r) => {
    const m = `${r.stdout ?? ''}${r.stderr ?? ''}`.match(/HAS_MOCK_MODULE:(\w+)/);
    return m ? m[1] : 'unknown';
  };

  return {
    withoutFlag: parse(withoutFlag),
    withFlag: parse(withFlag),
    available: parse(withFlag) === 'function',
    requiredFlag,
  };
}

const support = probeModuleMockSupport();
console.log(`  不带标志时 typeof mock.module = ${support.withoutFlag}`);
console.log(`  带 ${support.requiredFlag} 时 typeof mock.module = ${support.withFlag}`);
console.log(`  → 本机是否可用：${support.available ? '可用' : '不可用'}`);
console.log();

/**
 * 在临时目录里跑一次真实的 mock.module 演示。
 *
 * 演示要回答一个关键问题：mock.module() 到底能影响到谁？
 * 结论（见下方真实输出）：
 *   - **测试文件顶部静态导入**进来的绑定：不受影响（导入发生在 mock 之前）；
 *   - mock 之后用 `await import()` 动态加载的模块：拿到假实现。
 * 这解释了为什么在 Vitest 里 `vi.mock()` 必须"提升到文件顶部" ——
 * Vitest 是在**模块图构建阶段**做拦截的，而不是运行时打补丁。
 *
 * @returns {{ output: string, exitCode: number }}
 */
function runMockModuleDemo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'js-ex-13-demo-'));

  fs.writeFileSync(
    path.join(dir, 'dep.mjs'),
    [
      'export function greet(name) { return `REAL:${name}`; }',
      'export default function version() { return "REAL-DEFAULT"; }',
      '',
    ].join('\n'),
    'utf8',
  );

  fs.writeFileSync(
    path.join(dir, 'demo.test.mjs'),
    [
      "import { test, mock } from 'node:test';",
      "import { greet } from './dep.mjs'; // ← 静态导入：模块在此刻就已经加载并绑定",
      '',
      "test('mock.module 能影响谁', async () => {",
      '  // 注意：Node 目前把 options.namedExports 标记为废弃，推荐用 exports',
      "  mock.module('./dep.mjs', {",
      "    exports: { greet: (n) => `FAKE:${n}`, default: () => 'FAKE-DEFAULT' },",
      '  });',
      '',
      "  console.log('① 静态导入的 greet（测试文件顶部 import 的）：', greet('张三'));",
      '',
      "  const fresh = await import('./dep.mjs'); // ← 动态导入：走模块注册表，拿到被 mock 的版本",
      "  console.log('② mock 之后动态 import 的 greet：', fresh.greet('张三'));",
      "  console.log('③ mock 之后动态 import 的 default：', fresh.default());",
      '});',
      '',
    ].join('\n'),
    'utf8',
  );

  const res = spawnSync(
    process.execPath,
    [support.requiredFlag, 'demo.test.mjs'],
    { cwd: dir, encoding: 'utf8', env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' } },
  );

  const output = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  fs.rmSync(dir, { recursive: true, force: true });
  return { output, exitCode: res.status };
}

if (support.available) {
  const demo = runMockModuleDemo();
  console.log('  子进程真实输出（已过滤掉实验特性警告）：');
  console.log(
    demo.output
      .split('\n')
      .filter((l) => l.trim() && !/Warning|trace-warnings|^\(node:/.test(l))
      .map((l) => `      ${l.trim()}`)
      .join('\n'),
  );
  console.log(`  子进程退出码：${demo.exitCode}`);
} else {
  console.log('  本机不支持 mock.module，跳过演示（用法保持不变，只是拿不到 API）。');
}
console.log();

// ===========================================================================
// 第 3 部分：Vitest 的 vi.mock() 思路
// ===========================================================================

console.log('--- 3. Vitest 的 vi.mock()：在模块图构建阶段拦截 ---');

console.log('  写法：');
console.log("    import { vi } from 'vitest';");
console.log("    vi.mock('./email-client.js', () => ({");
console.log("      sendEmail: vi.fn(async () => ({ ok: true })),");
console.log('    }));');
console.log("    import { sendEmail } from './email-client.js'; // 注意：这行写在 vi.mock 之后，");
console.log('                                                    // 但实际生效顺序被 Vitest 反转了');
console.log();
console.log('  关键点（和 Node 的差别）：');
console.log('    1) vi.mock 的调用会被**提升**（hoist）到文件最顶部，先于所有 import 执行；');
console.log('    2) Vitest 自己实现了模块加载（Vite 的 module graph），');
console.log('       它在做转换时就把 "./email-client.js" 这个说明符换成了你的工厂函数返回值；');
console.log('    3) 于是**被测模块内部的 import 也被一并替换** —— 这是 Node 的运行时');
console.log('       mock.module 做不到的部分，也是为什么"想在 ESM 里 mock 模块"');
console.log('       这件事在不同工具里行为不一致。');
console.log();
console.log('  代价：你需要接受一个自定义的模块加载器（Vite 的 transform pipeline）。');
console.log('  如果你的项目已经在用 Vite / Vitest，这几乎无感；');
console.log('  如果你只想跑 node:test，那第 4 节的依赖注入才是更划算的选择。');
console.log();

// ===========================================================================
// 第 4 部分：依赖注入 —— 更可测的替代方案
// ===========================================================================

console.log('--- 4. 难测的写法 vs 易测的写法（实测对比）---');

// --- 4.1 "难测"的写法：模块内部静态导入真实依赖 ---
const realSmtpUrl = writeModule(
  'real-smtp.mjs',
  [
    '// 模拟一个真实的第三方 SDK：慢、且你无法在测试里控制它成不成功',
    'export async function send(phone, text) {',
    '  await new Promise((r) => setTimeout(r, 120)); // 真实网络往返',
    "  return { ok: true, provider: 'real-smtp', phone, text };",
    '}',
    '',
  ].join('\n'),
);

const hardNotifierUrl = writeModule(
  'notifier-hard.mjs',
  [
    "import { send } from './real-smtp.mjs'; // ← 写死的依赖",
    '',
    'export async function notify(phone) {',
    "  return send(phone, '您的订单已创建');",
    '}',
    '',
  ].join('\n'),
);

// --- 4.2 "易测"的写法：依赖从参数进来 ---
const easyNotifierUrl = writeModule(
  'notifier-easy.mjs',
  [
    '// 依赖作为参数注入。注意这个模块自己**不 import 任何东西**。',
    '// 业务规则：发短信失败不能让下单失败（降级），但要记录一条警告。',
    'export function createNotifier({ send, logger = () => {} }) {',
    '  return {',
    '    async notify(phone) {',
    '      try {',
    "        const res = await send(phone, '您的订单已创建');",
    "        logger('info', '短信已发送');",
    '        return { notified: true, res };',
    '      } catch (err) {',
    "        logger('warn', '短信发送失败，已降级：' + err.message);",
    '        return { notified: false, error: err.message }; // 降级：不抛错',
    '      }',
    '    },',
    '  };',
    '}',
    '',
  ].join('\n'),
);

const realSmtp = await import(realSmtpUrl);
const hardNotifier = await import(hardNotifierUrl);
const easyNotifier = await import(easyNotifierUrl);

// --- 4.3 先证明"难测"版本真的难测 ---
console.log('难测的写法（notifier-hard.mjs）：');
console.log('  ① 想测"短信服务挂了"这个分支，唯一的办法是让真实依赖失败 ——');
console.log('     而它的成功/失败由第三方决定，测试里根本控制不了。试试看能不能打桩：');
try {
  const ns = await import(realSmtpUrl);
  ns.send = async () => {
    throw new Error('boom');
  };
  console.log('     （不该发生）打桩成功了');
} catch (err) {
  console.log(`     → ${err.constructor.name}: ${err.message}`);
}

const hardT0 = process.hrtime.bigint();
const hardOk = await hardNotifier.notify('138');
const hardMs = Number(process.hrtime.bigint() - hardT0) / 1e6;
console.log(`  ② 于是你只能测 happy path：notify() = ${JSON.stringify(hardOk)}`);
console.log(`  ③ 而且它真的慢：单条用例耗时 ${hardMs.toFixed(1)}ms（真实网络只会更慢）`);
console.log('  ④ 覆盖率上限也被锁死：catch 分支永远走不到。');
console.log();

// --- 4.4 "易测"版本：注入假依赖，所有分支都能测 ---
console.log('易测的写法（notifier-easy.mjs，依赖注入）：');
const diT0 = process.hrtime.bigint();

/** 记录日志用的假 logger */
const logs = [];
const fakeLogger = (level, msg) => logs.push([level, msg]);

const notifierHappy = easyNotifier.createNotifier({
  send: async () => ({ ok: true, provider: 'fake' }), // 假依赖：瞬间返回
  logger: fakeLogger,
});

const notifierSad = easyNotifier.createNotifier({
  send: async () => {
    throw new Error('provider timeout');
  },
  logger: fakeLogger,
});

// 场景一：短信成功
const r1 = await notifierHappy.notify('138');
console.log(`  ✔ 短信成功：${JSON.stringify(r1)}`);

// 场景二：短信失败（降级）—— 难测版本永远测不到这个分支
const r2 = await notifierSad.notify('138');
console.log(`  ✔ 短信失败并降级：${JSON.stringify(r2)}`);

const diMs = Number(process.hrtime.bigint() - diT0) / 1e6;
console.log(`  两条关键场景加起来耗时 ${diMs.toFixed(2)}ms（对比难测版本的 ${hardMs.toFixed(1)}ms）`);
console.log();

// --- 4.5 对比表 ---
console.log('  可测性对比：');
const compare = [
  ['能否让依赖失败（测降级分支）', '不能，除非改源码', '能，传个会抛错的假实现'],
  ['单条用例耗时', `约 ${hardMs.toFixed(0)}ms（真实网络更慢）`, `约 ${(diMs / 2).toFixed(2)}ms`],
  ['是否依赖网络/第三方可用性', '是（CI 上会偶发失败）', '否'],
  ['需要 mock 框架 / 实验标志吗', '需要（而且不一定打得进去）', '完全不需要'],
  ['分支覆盖率上限', '只有 happy path', '全部分支可达'],
  ['对生产代码的侵入性', '看起来"更自然"', '多了一个参数，但显式暴露了依赖'],
];
console.log('  ' + '维度'.padEnd(34) + '难测的写法'.padEnd(30) + '依赖注入');
console.log('  ' + '-'.repeat(96));
for (const [dim, hard, easy] of compare) {
  console.log('  ' + dim.padEnd(32) + hard.padEnd(28) + easy);
}
console.log();
console.log('  一句话总结：');
console.log('    模块级 mock 是"事后补救"，依赖注入是"事前设计"。');
console.log('    能用后者解决的，不要用前者 —— 少一个实验特性，少一堆 CI 玄学。');
console.log();

// ===========================================================================
// 第 5 部分：真实 node:test 用例
// ===========================================================================

test('【难测版本】只能测 happy path（这也是它唯一的用例）', async () => {
  const res = await hardNotifier.notify('138');
  assert.equal(res.ok, true);
  assert.equal(res.provider, 'real-smtp');
});

test('【易测版本】短信成功时 notified 为 true，且记了 info 日志', async () => {
  const logs2 = [];
  const notifier = easyNotifier.createNotifier({
    send: async () => ({ ok: true }),
    logger: (level, msg) => logs2.push([level, msg]),
  });
  const res = await notifier.notify('138');
  assert.equal(res.notified, true);
  assert.deepEqual(logs2, [['info', '短信已发送']]);
});

test('【易测版本】短信失败时降级：notified 为 false 但不抛错', async () => {
  const logs2 = [];
  const notifier = easyNotifier.createNotifier({
    send: async () => {
      throw new Error('provider timeout');
    },
    logger: (level, msg) => logs2.push([level, msg]),
  });
  const res = await notifier.notify('138');
  assert.equal(res.notified, false);
  assert.equal(res.error, 'provider timeout');
  assert.equal(logs2.length, 1);
  assert.equal(logs2[0][0], 'warn');
});

test('【易测版本】可以断言"依赖被调用了几次、参数是什么"（spy 场景）', async () => {
  const calls = [];
  const notifier = easyNotifier.createNotifier({
    send: async (phone, text) => {
      calls.push({ phone, text });
      return { ok: true };
    },
  });
  await notifier.notify('139');
  assert.deepEqual(calls, [{ phone: '139', text: '您的订单已创建' }]);
});

test('【语言事实】ESM 模块命名空间对象上的属性无法被重新赋值', async () => {
  const ns = await import(realSmtpUrl);
  assert.throws(
    () => {
      ns.send = () => {};
    },
    (err) => err instanceof TypeError && /read only property/.test(err.message),
  );
});
