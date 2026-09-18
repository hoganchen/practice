/**
 * ============================================================================
 * 知识点：ES2023 新特性 —— findLast、非破坏性数组方法、Hashbang、Symbol 作 WeakMap 键
 * ============================================================================
 *
 * 【所属分类】34_modern_es_features —— 现代 ES 新特性
 * 【难度等级】进阶
 * 【前置知识】08_arrays/、23_collections/、31_performance_and_memory/
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES2023（第 14 版 ECMAScript 标准，2023 年 6 月发布）主要包含四组内容：
 *      (1) Array.prototype.findLast / findLastIndex（以及 TypedArray 上的同名方法）
 *      (2) 非破坏性（non-mutating）数组方法：
 *          toSorted / toReversed / toSpliced / with
 *      (3) Hashbang 语法 `#!` 正式写入语言标准
 *      (4) Symbol 可以作为 WeakMap / WeakSet / WeakRef 的键
 *
 * 2. 为什么需要（真实项目场景）
 *    - 找"最后一个"满足条件的元素：以前只能 reverse() 后再 find()，
 *      但 reverse() 会**修改原数组**——副作用极强，是典型的隐蔽 bug 来源。
 *    - 非破坏性方法：React / Redux / Vue 的状态管理要求"不可变更新"，
 *      以前必须写 `[...arr].sort()` 或 `arr.slice().reverse()`，
 *      现在 `arr.toSorted()` 一步到位，且语义清晰（调用方一眼看出不会改原数组）。
 *    - Hashbang：让 .js 文件可以像 shell 脚本一样直接 `./tool.js` 执行，
 *      不用再写 `node tool.js`。
 *    - Symbol 作 WeakMap 键：以前只能给对象挂弱引用元数据；
 *      现在可以给"符号"也挂，符号常被当作全局唯一的键令牌使用。
 *
 * 3. 核心语法要点
 *    - `arr.findLast(pred)` / `arr.findLastIndex(pred)`：从尾部往前找，
 *      返回第一个匹配的元素 / 下标；找不到时分别返回 undefined / -1。
 *    - `arr.toSorted(cmp)`：返回排序后的**新数组**，原数组不动。
 *    - `arr.toReversed()`：返回反转后的**新数组**。
 *    - `arr.toSpliced(start, deleteCount, ...items)`：返回"拼接后"的新数组。
 *    - `arr.with(index, value)`：返回"某一位被替换"的新数组，**支持负索引**。
 *    - `#!` 必须是文件的第一个字符；后面跟解释器路径，例如 `#!/usr/bin/env node`。
 *    - `WeakMap` 的键可以是对象，或（ES2023 起）**非注册符号**（Symbol()）。
 *
 * 4. 常见陷阱
 *    - 非破坏性方法返回的是**浅拷贝**：数组里的对象引用与原数组共享，
 *      改 `newArr[0].x` 依然会影响原数组。
 *    - 名字容易和破坏性版本混：sort/splice/reverse 改原数组，
 *      toSorted/toSpliced/toReversed 不改。千万不要靠"我记得它好像不改"来写代码。
 *    - `toSpliced` 没有 `toSplice` 这个名字，也没有对应 `toPush`/`toPop`。
 *    - `with` 越界会抛 RangeError（不像 `.at()` 返回 undefined）。
 *    - Hashbang 只在 Node 直接执行文件时生效；通过 `--eval`、REPL 或
 *      被 import 时，它只是一行注释。
 *    - **注册符号**（`Symbol.for('x')`）不能做 WeakMap 键，会抛 TypeError，
 *      因为它永久存在于全局符号注册表里，永远不会被回收，弱引用没有意义。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 34_modern_es_features/03_es2023_features.js
 *
 * 【预期输出】
 *   依次打印 5 个小节。Hashbang 一节会自己写一个临时脚本并用子进程执行，
 *   以真实验证 `#!` 语法（本示例不会访问网络，临时文件用完即删）。
 * ============================================================================
 */

import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

console.log('='.repeat(70));
console.log('ES2023 新特性演示');
console.log('当前 Node 版本：', process.version);
console.log('='.repeat(70));

// ---------------------------------------------------------------------------
console.log('\n--- 1. findLast / findLastIndex ---');
// ---------------------------------------------------------------------------

const findLastSupported = typeof [].findLast === 'function';
const findLastIndexSupported = typeof [].findLastIndex === 'function';
console.log('本机支持 findLast：' + (findLastSupported ? '是' : '否'));
console.log('本机支持 findLastIndex：' + (findLastIndexSupported ? '是' : '否'));

// 场景：一串按时间顺序排列的日志，要找出"最近一次错误"
const events = [
  { id: 1, level: 'info', msg: '服务启动' },
  { id: 2, level: 'error', msg: '数据库连接失败' },
  { id: 3, level: 'info', msg: '重试成功' },
  { id: 4, level: 'warn', msg: '响应变慢' },
  { id: 5, level: 'error', msg: '支付回调超时' },
  { id: 6, level: 'info', msg: '健康检查通过' },
];

// --- 以前怎么写（两种都有问题）---
// 写法 A：先 reverse 再 find —— 副作用！原数组被就地反转了
const lastErrorOld = [...events].reverse().find((e) => e.level === 'error');
console.log('以前（拷贝 + reverse + find）：', lastErrorOld.msg);
// 如果不小心忘了拷贝：
const dangerous = [...events];
dangerous.reverse();
console.log('  忘了拷贝的后果：原数组顺序被破坏，第 0 项变成了', dangerous[0].msg);

// 写法 B：手写 for 循环从后往前 —— 啰嗦
let lastErrorLoop;
for (let i = events.length - 1; i >= 0; i--) {
  if (events[i].level === 'error') {
    lastErrorLoop = events[i];
    break;
  }
}
console.log('以前（for 倒序循环）：', lastErrorLoop.msg);

// --- 现在怎么写 ---
console.log('现在（findLast）：', events.findLast((e) => e.level === 'error').msg);
console.log('现在（findLastIndex）：', events.findLastIndex((e) => e.level === 'error'));
console.log('对照 find（从头找）：', events.find((e) => e.level === 'error').msg);
console.log('对照 findIndex：', events.findIndex((e) => e.level === 'error'));
console.log('原数组未被修改，第 0 项仍是：', events[0].msg);

// 找不到时的返回值
console.log('找不到时 findLast →', events.findLast((e) => e.level === 'fatal'));
console.log('找不到时 findLastIndex →', events.findLastIndex((e) => e.level === 'fatal'));

// TypedArray 也有
const ta = new Int8Array([1, 2, 3, 4, 5]);
console.log('TypedArray 上的 findLast：', ta.findLast((v) => v % 2 === 1));

// ---------------------------------------------------------------------------
console.log('\n--- 2. 非破坏性数组方法 toSorted / toReversed / toSpliced / with ---');
// ---------------------------------------------------------------------------

const nonMutatingSupported =
  typeof [].toSorted === 'function' &&
  typeof [].toReversed === 'function' &&
  typeof [].toSpliced === 'function' &&
  typeof [].with === 'function';
console.log('本机支持：' + (nonMutatingSupported ? '是' : '否'));

const original = [3, 1, 4, 1, 5, 9, 2, 6];
console.log('原始数组：', JSON.stringify(original));

// --- 2.1 sort/reverse 是破坏性的（老写法）---
const destructive = [...original];
destructive.sort((a, b) => a - b);
console.log('\n[老写法] arr.sort() 之后，原数组变成了：', JSON.stringify(destructive), '← 被就地修改');

// --- 2.2 toSorted / toReversed ---
const sortedNew = original.toSorted((a, b) => a - b);
const reversedNew = original.toReversed();
console.log('[新写法] original.toSorted(...) =', JSON.stringify(sortedNew));
console.log('[新写法] original.toReversed() =', JSON.stringify(reversedNew));
console.log('         原数组纹丝不动：', JSON.stringify(original), '← 关键优势');

// 对比"老写法的正确版本"：必须先自己拷贝
console.log("老写法的不可变版本要写 [...arr].sort()：", JSON.stringify([...original].sort((a, b) => a - b)));

// --- 2.3 toSpliced：等价于"拷贝后再 splice" ---
// 目标：把下标 2 开始的 3 个元素替换成 'X'、'Y'
const splicedOld = [...original];
splicedOld.splice(2, 3, 'X', 'Y'); // 破坏性
const splicedNew = original.toSpliced(2, 3, 'X', 'Y'); // 非破坏性
console.log('\ntoSpliced(2, 3, "X", "Y") 新数组：', JSON.stringify(splicedNew));
console.log('  与"拷贝 + splice"结果一致：', JSON.stringify(splicedNew) === JSON.stringify(splicedOld));
console.log('  原数组：', JSON.stringify(original));

// toSpliced 的几种形态（与 splice 的参数规则一致）
console.log('  纯删除 toSpliced(0, 2)：', JSON.stringify(original.toSpliced(0, 2)));
console.log('  纯插入 toSpliced(1, 0, 99)：', JSON.stringify(original.toSpliced(1, 0, 99)));
console.log('  负起点 toSpliced(-2, 2)：', JSON.stringify(original.toSpliced(-2, 2)));

// --- 2.4 with(index, value)：替换单个位置 ---
// 等价于 arr.map((v, i) => i === idx ? value : v)，但更直观、性能更好
console.log('\nwith(0, 100)：', JSON.stringify(original.with(0, 100)));
console.log('with(-1, 100)：', JSON.stringify(original.with(-1, 100)), '← 支持负索引，改的是最后一位');
console.log('等价的手写 map 写法：', JSON.stringify(original.map((v, i) => (i === 0 ? 100 : v))));
console.log('  原数组：', JSON.stringify(original));
try {
  original.with(999, 1); // 越界
} catch (err) {
  console.log('陷阱演示（with 越界）→', err.constructor.name + ':', err.message);
}

// --- 2.5 真实的不可变状态更新场景 ---
console.log('\n[场景] 不可变地更新购物车：把 id=2 的商品数量改成 3');
const cart = [
  { id: 1, name: '键盘', qty: 1 },
  { id: 2, name: '鼠标', qty: 2 },
  { id: 3, name: '显示器', qty: 1 },
];
const targetIndex = cart.findIndex((it) => it.id === 2);
const nextCart = cart.with(targetIndex, { ...cart[targetIndex], qty: 3 });
console.log('  新购物车：', JSON.stringify(nextCart));
console.log('  原购物车：', JSON.stringify(cart), '← 没变，React 的 shouldComponentUpdate 能正确检测到');

// --- 2.6 陷阱：浅拷贝 ---
const nested = [{ n: 1 }, { n: 2 }];
const nestedSorted = nested.toSorted((a, b) => b.n - a.n);
nestedSorted[0].n = 999; // 改的是同一个对象！
console.log('\n陷阱演示：toSorted 是浅拷贝');
console.log('  改新数组里的对象后，原数组也变了：', JSON.stringify(nested));

// 手写等价实现（用于理解 / 降级）
if (!nonMutatingSupported) {
  console.log('\n当前 Node 版本不支持，以下是等价实现');
  Array.prototype.toSorted = function (cmp) {
    return [...this].sort(cmp);
  };
  Array.prototype.toReversed = function () {
    return [...this].reverse();
  };
  Array.prototype.toSpliced = function (start, deleteCount, ...items) {
    const copy = [...this];
    copy.splice(start, deleteCount, ...items);
    return copy;
  };
  Array.prototype.with = function (index, value) {
    const copy = [...this];
    const i = index < 0 ? copy.length + index : index;
    if (i < 0 || i >= copy.length) throw new RangeError('Invalid index');
    copy[i] = value;
    return copy;
  };
  console.log('  等价实现 toSorted：', [3, 1, 2].toSorted());
}

// ---------------------------------------------------------------------------
console.log('\n--- 3. Hashbang 语法 #! ---');
// ---------------------------------------------------------------------------

// Hashbang（也叫 shebang）是 *nix 系统"让文件自己知道用什么解释器执行"的约定：
//   文件第一行写  #!/usr/bin/env node
//   chmod +x tool.js 之后就能直接 ./tool.js
// 以前这**不是** JS 语言的一部分，只是 Node/浏览器"顺手容忍"了它。
// ES2023 把它正式写进标准：Hashbang 必须是文件的第一个字符，后面到行尾都是注释。

// 注意：Hashbang 只能出现在"文件的第一行"，所以本文件里没法直接演示它——
// 我们动态生成一个带 Hashbang 的临时脚本，用子进程真实执行它来验证。

const tmpDir = mkdtempSync(path.join(tmpdir(), 'es2023-hashbang-'));
const hashbangFile = path.join(tmpDir, 'hashbang-demo.mjs');
const hashbangSource = [
  '#!/usr/bin/env node',
  '// ↑ 这一行就是 Hashbang：告诉系统用 node 来跑这个文件',
  "console.log('   [子进程] Hashbang 脚本被执行了，argv[1] 结尾是：', process.argv[1].split(/[\\\\/]/).pop());",
  "console.log('   [子进程] 这说明 #! 行被当作注释正确跳过了');",
].join('\n');
writeFileSync(hashbangFile, hashbangSource, 'utf8');

console.log('临时脚本内容：');
console.log(hashbangSource.split('\n').map((l) => '    ' + l).join('\n'));

// 用子进程执行：node <文件>。这能验证 Node 的解析器确实把 #! 当注释处理。
const child = spawnSync(process.execPath, [hashbangFile], { encoding: 'utf8' });
console.log('子进程退出码：', child.status);
if (child.stdout) process.stdout.write(child.stdout);
if (child.stderr) process.stdout.write('[stderr] ' + child.stderr);

// 反面验证：把 #! 放到第二行，就会变成语法错误（因为 # 在 JS 中不合法）
const badFile = path.join(tmpDir, 'bad-hashbang.mjs');
writeFileSync(badFile, "// 注释占用了第一行\n#!/usr/bin/env node\nconsole.log('never');\n", 'utf8');
const badChild = spawnSync(process.execPath, [badFile], { encoding: 'utf8' });
console.log('把 #! 放到第二行的结果 → 退出码', badChild.status);
console.log('  错误摘要：', (badChild.stderr.split('\n').find((l) => l.includes('SyntaxError')) ?? '').trim());

// 清理临时文件
rmSync(tmpDir, { recursive: true, force: true });
console.log('临时文件已清理，还存在吗：', existsSync(tmpDir));

// 补充：package.json 里的 "bin" 字段 + 文件首行 Hashbang，
// 是发布 CLI 工具（npm i -g 后可直接用命令名调用）的标准组合。
// 另外注意：Windows 上不认 Hashbang，仍然要靠 `node tool.js` 或 npm 生成的 .cmd 包装。

// ---------------------------------------------------------------------------
console.log('\n--- 4. Symbol 作为 WeakMap 键 ---');
// ---------------------------------------------------------------------------

// 背景：WeakMap 的键必须是"弱引用可达"的，这样键对象被回收时条目会自动清除。
// ES2023 之前，Symbol 一律不能当 WeakMap 键（哪怕是非注册符号）。
// ES2023 起放开了"非注册符号"（Symbol() 创建的），但仍然禁止"注册符号"（Symbol.for）。

let symbolAsWeakKeySupported = false;
try {
  const wm = new WeakMap();
  wm.set(Symbol('probe'), 1);
  symbolAsWeakKeySupported = true;
} catch {
  symbolAsWeakKeySupported = false;
}
console.log('本机支持（非注册 Symbol 作 WeakMap 键）：' + (symbolAsWeakKeySupported ? '是' : '否'));

// --- 4.1 非注册 Symbol：可以 ---
const symA = Symbol('token-a');
const symB = Symbol('token-b');
const symbolMeta = new WeakMap();
symbolMeta.set(symA, { description: '第一个令牌的元数据' });
symbolMeta.set(symB, { description: '第二个令牌的元数据' });
console.log('用 Symbol 作键写入并读回：', symbolMeta.get(symA).description);
console.log('另一个键互不干扰：', symbolMeta.get(symB).description);
console.log('不存在的键：', symbolMeta.get(Symbol('token-a')), '← 每次 Symbol() 都是全新的唯一值');
console.log('has 检查：', symbolMeta.has(symA), '/', symbolMeta.has(Symbol('token-a')));

// --- 4.2 注册 Symbol（Symbol.for）：不允许，会抛错 ---
try {
  const wm = new WeakMap();
  wm.set(Symbol.for('global-token'), 1);
} catch (err) {
  console.log('陷阱演示（Symbol.for 作 WeakMap 键）→', err.constructor.name + ':', err.message);
}
// 原因：注册符号存放在全局符号注册表里，只要程序还活着就永远可达，
// 永远不会被 GC 回收，所以"弱引用"对它没有任何意义，标准直接禁止。

// --- 4.3 对比：普通对象也有同样的限制吗？---
const wmObj = new WeakMap();
const keyObj = { id: 1 };
wmObj.set(keyObj, 'ok');
console.log('对象作键当然可以：', wmObj.get(keyObj));

// --- 4.4 真实场景：给 fetch 请求打标签 / 给符号令牌挂元数据 ---
console.log('\n[场景] 用 Symbol 做"唯一令牌"，用 WeakMap 挂不可枚举的元数据');
const REQUEST_ID = Symbol('request-id');
const requestMeta = new WeakMap();
requestMeta.set(REQUEST_ID, { createdAt: Date.now(), traceId: 'trace-abc-123' });
console.log('  令牌本身：', REQUEST_ID.toString());
console.log('  元数据（外部完全看不到，也不污染对象）：', requestMeta.get(REQUEST_ID));
console.log('  对象序列化时不会带上它：', JSON.stringify({ [REQUEST_ID]: 1 }), '← Symbol 键会被 JSON 忽略');

// --- 4.5 WeakSet 同理 ---
let symbolWeakSetSupported = false;
try {
  new WeakSet().add(Symbol('x'));
  symbolWeakSetSupported = true;
} catch {
  symbolWeakSetSupported = false;
}
console.log('WeakSet 也接受非注册 Symbol：' + (symbolWeakSetSupported ? '是' : '否'));

// --- 4.6 降级实现 ---
if (!symbolAsWeakKeySupported) {
  console.log('当前 Node 版本不支持，以下是等价实现（退化为普通 Map，注意会阻止回收）');
  const mapFallback = new Map();
  mapFallback.set(Symbol('probe'), 1);
  console.log('  等价实现读回：', mapFallback.get([...mapFallback.keys()][0]), '（副作用：Symbol 永不被回收）');
}

console.log('\n' + '='.repeat(70));
console.log('ES2023 全部小节演示完毕，进程正常退出（退出码 0）');
console.log('='.repeat(70));
