/**
 * ============================================================================
 * 知识点：命令行参数解析与进程信号 —— parseArgs 与优雅关闭
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】进阶
 * 【前置知识】26_node_core/01_process_object.js、26_node_core/10_child_process.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    本文件讲命令行程序的两件"门面"功夫：
 *
 *    (1) 参数解析：程序被调用时，用户敲的那串东西（`--port 3000 -v file.txt`）
 *        怎么变成代码里能用的变量。手写解析能跑，但很快就会失控；
 *        Node 内置的 `node:util` 提供了 `parseArgs`，把这件事标准化。
 *
 *    (2) 进程信号：操作系统给进程发的"异步通知"。最典型的就是 Ctrl+C。
 *        进程收到信号后不该立刻死掉，而应该"优雅关闭"：
 *        停止接受新请求 -> 清理资源（关数据库连接、刷日志、删临时文件）-> 退出。
 *        同时必须准备一个"兜底强制退出"，防止清理过程本身卡死。
 *
 * 2. 为什么需要
 *    · 参数解析：任何 CLI 工具、构建脚本、服务启动器都要读参数。
 *      手写解析的代码看似简单，但"短选项分组""--key=value""--""缺值报错"
 *      "重复出现的选项"这些边角情况极多，几乎每个项目都会重复踩一遍。
 *      `util.parseArgs` 是官方提供的零依赖标准答案（Node 18.3 起可用）。
 *
 *    · 进程信号：服务器上线后最常做的事就是"重新部署"。
 *      部署脚本会发 SIGTERM 让旧进程退出。如果你的程序直接死掉，
 *      正在处理的请求会被掐断、写了一半的文件会损坏、数据库连接会泄漏。
 *      正确实现优雅关闭是"生产可用"与"玩具"之间最明显的一条分界线。
 *
 * 3. 核心语法要点
 *    - parseArgs({ args, options, allowPositionals, strict, tokens })
 *        · args              要解析的字符串数组，默认为 process.argv.slice(2)
 *        · options           选项声明表，形如 { name: { type, short, default, multiple } }
 *        · type              'string' | 'boolean'，必填（这里没有隐式推断）
 *        · short             单字符短别名，如 { name: { type:'string', short:'n' } }
 *        · default           未提供时的默认值
 *        · multiple          true 表示可重复出现，结果收集为数组
 *        · allowPositionals  是否允许位置参数（非选项参数）
 *        · strict            true（默认）时对未知选项/缺值/多余位置参数直接抛错
 *        · tokens            true 时额外返回解析过程的原始记录数组
 *     返回值：{ values, positionals, tokens? }
 *
 *    - 进程信号
 *        · process.on('SIGINT', handler)      Ctrl+C（跨平台可用）
 *        · process.on('SIGTERM', handler)     礼貌的终止请求（Windows 上不生效，见第 9 节）
 *        · process.on('SIGBREAK', handler)    仅 Windows，Ctrl+Break
 *        · process.kill(pid, signal)          给任意进程发信号（当前进程也可以）
 *        · child.kill(signal)                 给子进程发信号
 *        · process.exitCode = n               设置退出码后让进程自然结束（推荐）
 *        · process.exit(n)                    立刻终止（会跳过未完成的异步操作）
 *        · os.constants.signals               当前平台支持的信号名 -> 编号映射表
 *
 * 4. 常见陷阱
 *    陷阱 1：parseArgs 默认会读 process.argv.slice(2)，但在测试里你几乎总是想手动传
 *            args。注意它是"替换"而不是"追加"。
 *    陷阱 2：parseArgs 不会做类型转换。type:'string' 的选项读到的是字符串，
 *            `--port 3000` 得到的是 '3000' 而不是 3000，必须自己 Number()。
 *    陷阱 3：parseArgs 返回的 values 是**无原型对象**（Object.getPrototypeOf(values) === null）。
 *            JSON.stringify 和展开运算符都正常，但 values.hasOwnProperty(...) 会直接报错，
 *            要用 Object.hasOwn(values, 'x') 代替。
 *    陷阱 4：strict 模式下三类错误是**抛异常**的：未知选项、选项缺值、多余的位置参数。
 *            不 try/catch 就会让程序带着一段堆栈崩掉——CLI 工具应当捕获后打印友好的用法提示。
 *    陷阱 5：Windows 没有真正的 POSIX 信号。child.kill('SIGTERM') 走的是
 *            TerminateProcess：进程被**无条件杀死**，注册的 SIGTERM 处理器根本不会执行。
 *            （本文件第 10 节有实测输出。）跨平台可靠的变通是 process.emit('SIGTERM')。
 *    陷阱 6：在 SIGINT 处理器里调用 process.exit() 会跳过所有未完成的异步清理。
 *            正确做法是让清理函数自己决定何时 exit，并设置一个"兜底超时"。
 *    陷阱 7：兜底超时的那个定时器要用 .unref()，否则它自己会撑住事件循环，
 *            让本该退出的进程多活一会儿。
 *    陷阱 8：不要用 SIGKILL。它的编号是 9，无法被捕获、无法被忽略，
 *            进程没有任何机会做清理。它只应该作为"最后手段"由人工或
 *            容器运行时（docker kill、kubectl delete）使用。
 *    陷阱 9：注册多个同名信号处理器时，Node 会**全部**调用它们（不是覆盖）。
 *            想在两个模块里共享关闭逻辑，要注意幂等。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/18_cli_args_and_signals.js
 *
 * 【预期输出】
 *   1) 手写 argv 解析 vs util.parseArgs 的对比（同样的输入，行数与健壮性差距）；
 *   2) parseArgs 的类型、默认值、multiple、positionals、strict 报错、tokens；
 *   3) 当前平台支持的信号表，以及退出码 128+n 的约定；
 *   4) 通过 spawn 子进程演示四种关闭场景：
 *        给子进程发真实 SIGTERM（展示 Windows 与 POSIX 的行为差异）
 *        子进程优雅关闭成功（退出码 0）
 *        清理卡住时兜底强制退出（退出码 1）
 *        关闭期间再来一次信号则立刻退出（退出码 130）
 *   父进程本身不接收任何信号，全程正常结束，退出码 0。
 * ============================================================================
 */

import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
import os from 'node:os';

// ---------------------------------------------------------------------------
// 1. 手写 process.argv 解析：从 5 行膨胀到 40 行
// ---------------------------------------------------------------------------

console.log('--- 1. 手写 argv 解析 ---');

// 假装用户敲了这样一条命令：
//   node tool.js --name 张三 -v --tag a --tag b --output=out.txt input.txt
const RAW_ARGS = ['--name', '张三', '-v', '--tag', 'a', '--tag', 'b', '--output=out.txt', 'input.txt'];
console.log('  待解析的 argv =', JSON.stringify(RAW_ARGS));

/**
 * 一个"看起来还行"的手写解析器。
 * 它已经处理了：长选项、短选项、--key=value、可重复选项、位置参数。
 * 但注意它有多长——而这还远没有覆盖真实世界的情况。
 */
function manualParse(args) {
  // 需要三张手工维护的表：别名、字符串型、布尔型。
  // 每加一个选项，三张表都可能要改，非常容易漏。
  const aliases = { n: 'name', v: 'verbose' };
  const stringOpts = new Set(['name', 'tag', 'output']);
  const booleanOpts = new Set(['verbose']);

  const values = {};
  const positionals = [];

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];

    if (!token.startsWith('-') || token === '-') {
      // 不以 - 开头（或就是单独的 '-'，通常表示 stdin）-> 位置参数
      positionals.push(token);
      continue;
    }

    // 拆出名字与可能的内联值：--output=out.txt -> name='output', inline='out.txt'
    let name = token.replace(/^--?/, '');
    let inline = null;
    const eq = name.indexOf('=');
    if (eq !== -1) {
      inline = name.slice(eq + 1);
      name = name.slice(0, eq);
    }
    name = aliases[name] ?? name;

    if (booleanOpts.has(name)) {
      values[name] = true;
      continue;
    }

    if (stringOpts.has(name)) {
      // 内联值优先；否则吃掉下一个 token 当值。
      const value = inline ?? args[i + 1];
      if (value === undefined) {
        // 缺值只能自己想办法报错——这里连错误类型都没法定，只能抛字符串。
        throw new Error(`选项 --${name} 缺少值`);
      }
      if (inline === null) i += 1; // 手动推进循环下标，很容易写错
      if (name === 'tag') {
        // 可重复选项要自己判断"第一次出现"并初始化数组
        values.tag = values.tag ?? [];
        values.tag.push(value);
      } else {
        values[name] = value;
      }
      continue;
    }

    // 未知选项：是报错、忽略、还是当成位置参数？手写代码里这里往往是"随便处理"。
    throw new Error(`未知选项 ${token}`);
  }

  return { values, positionals };
}

const manual = manualParse(RAW_ARGS);
console.log('  手写解析结果 values      =', JSON.stringify(manual.values));
console.log('  手写解析结果 positionals =', JSON.stringify(manual.positionals));
console.log('  手写版存在的问题：');
console.log('    · 别名/类型/布尔三张表要手工维护，加选项容易漏改');
console.log('    · 不支持短选项分组（-abc 展开成 -a -b -c）');
console.log('    · 不支持 -- 终止符（其后的 -xxx 应被当作位置参数）');
console.log('    · 错误只能抛裸 Error，没法给出统一的、带用法的友好提示');
console.log('    · 想加 --help 自动生成、类型校验、负数支持，全都要自己写');
console.log(`    · 代价：${manualParse.toString().split('\n').length} 行代码只解决了 80% 的问题`);

// ---------------------------------------------------------------------------
// 2. util.parseArgs：同样的需求，声明式搞定
// ---------------------------------------------------------------------------

console.log('--- 2. util.parseArgs 基础用法 ---');

// options 是"声明表"：你只描述有哪些选项、什么类型、有没有短名，
// 解析规则全部由 Node 负责。声明即文档，也不会出现"表忘记改"的问题。
const parsed = parseArgs({
  // args 默认就是 process.argv.slice(2)，但显式传入才能被测试和演示复用。
  args: RAW_ARGS,
  options: {
    // type 是必填的：parseArgs 刻意不做"看下一个 token 猜类型"这种隐式推断，
    // 因为那正是手写解析最容易出错的地方。
    name: { type: 'string', short: 'n' },
    // boolean 选项不消耗值：--verbose 或 -v 都只表示"出现过"。
    verbose: { type: 'boolean', short: 'v', default: false },
    // multiple: true 表示可以重复出现，结果收集成数组。
    tag: { type: 'string', multiple: true },
    // --key=value 这种内联写法也会被正确识别（手写版要自己写 indexOf('=')）。
    output: { type: 'string' },
  },
  // 允许"不挂任何选项的裸参数"。不打开的话，遇到 input.txt 会直接报错。
  allowPositionals: true,
});

console.log('  values      =', JSON.stringify(parsed.values));
console.log('  positionals =', JSON.stringify(parsed.positionals));
console.log('  => 与手写版结果一致，但没有任何一张手工维护的表。');

// ---------------------------------------------------------------------------
// 3. 类型与默认值
// ---------------------------------------------------------------------------

console.log('--- 3. 类型、默认值与"不做类型转换" ---');

const withDefaults = parseArgs({
  args: [],
  options: {
    port: { type: 'string', default: '3000' }, // 字符串型默认值
    verbose: { type: 'boolean', default: false }, // 布尔型默认值
    config: { type: 'string' }, // 没给默认值 -> 未出现时该键**不存在**
    tag: { type: 'string', multiple: true }, // multiple 且无默认值 -> 键也不存在
  },
});
console.log('  全空参数时的 values =', JSON.stringify(withDefaults.values));
console.log('  config 键是否存在 =', Object.hasOwn(withDefaults.values, 'config'), '（没有默认值就不会出现）');
console.log('  tag 键是否存在    =', Object.hasOwn(withDefaults.values, 'tag'), '（multiple 无默认值同样不出现）');
console.log('  => 取值的正确姿势：const port = Number(values.port ?? 3000)');

// 陷阱 2：类型转换必须自己做。
console.log('  port 的值 =', JSON.stringify(withDefaults.values.port), '，typeof =', typeof withDefaults.values.port);
console.log('  => 环境变量和命令行参数一样，永远是字符串。"3000" 不等于 3000。');

// 陷阱 3：values 是无原型对象。
console.log('  Object.getPrototypeOf(values) =', Object.getPrototypeOf(withDefaults.values));
console.log('  typeof values.hasOwnProperty   =', typeof withDefaults.values.hasOwnProperty, '（所以不能直接调用它！）');
console.log('  正确的存在性判断：Object.hasOwn(values, "port") =', Object.hasOwn(withDefaults.values, 'port'));
console.log('  展开 / JSON 都正常：{...values} =', JSON.stringify({ ...withDefaults.values }));

// ---------------------------------------------------------------------------
// 4. multiple：可重复出现的选项
// ---------------------------------------------------------------------------

console.log('--- 4. multiple 可重复选项 ---');

const multi = parseArgs({
  args: ['--tag', 'red', '--tag', 'green', '--tag=blue', '--watch', '--watch'],
  options: {
    tag: { type: 'string', multiple: true },
    watch: { type: 'boolean', multiple: true },
  },
});
console.log('  输入：--tag red --tag green --tag=blue --watch --watch');
console.log('  values =', JSON.stringify(multi.values));
console.log('  => multiple 的 string 收集成字符串数组，boolean 收集成 true 数组（出现几次就有几个）。');

// multiple 与 default 一起用时，default 必须是数组，否则会报错。
const multiDefault = parseArgs({
  args: [],
  options: { tag: { type: 'string', multiple: true, default: ['none'] } },
});
console.log('  multiple + default:["none"] 且没传参数时 =', JSON.stringify(multiDefault.values));

// ---------------------------------------------------------------------------
// 5. positionals 与短选项分组
// ---------------------------------------------------------------------------

console.log('--- 5. positionals 与短选项分组 ---');

// 位置参数是"不挂名字的参数"，通常表示要处理的文件/目标。
// 默认情况下 parseArgs 不允许出现位置参数（strict 模式下的设计选择：
// 强制你在声明表里明确写出"我接受裸参数"，避免拼错选项名被静默吞掉）。
const withPositionals = parseArgs({
  args: ['build', 'src/index.js', '--minify'],
  options: { minify: { type: 'boolean', short: 'm' } },
  allowPositionals: true,
});
console.log('  values =', JSON.stringify(withPositionals.values));
console.log('  positionals =', JSON.stringify(withPositionals.positionals), '（顺序保留）');

// 短选项分组：-abc 等价于 -a -b -c，这是 Unix 的传统写法。
// 注意：分组的每一项都必须是 boolean 选项；其中一项需要值时会取其后的 token。
const grouped = parseArgs({
  args: ['-xvf', 'out.tar'],
  options: {
    x: { type: 'boolean', short: 'x' },
    v: { type: 'boolean', short: 'v' },
    f: { type: 'string', short: 'f' },
  },
});
console.log('  输入 -xvf out.tar ->', JSON.stringify(grouped.values), '（f 作为 string 吃掉了后面的 token）');

// ---------------------------------------------------------------------------
// 6. strict 模式的三类报错
// ---------------------------------------------------------------------------

console.log('--- 6. strict 模式的报错 —— CLI 必须捕获它们 ---');

// strict 默认为 true。三种情况会抛带有明确 code 的错误，
// 这些 code 是稳定的，可以据此生成友好的中文提示。
const errorCases = [
  { label: '未知选项', args: ['--nope'], options: { ok: { type: 'boolean' } }, allowPositionals: true },
  { label: '选项缺值', args: ['--name'], options: { name: { type: 'string' } }, allowPositionals: true },
  { label: '多余的位置参数', args: ['extra'], options: { ok: { type: 'boolean' } }, allowPositionals: false },
];

for (const { label, ...opts } of errorCases) {
  try {
    parseArgs(opts);
    console.log(`  ${label}：没有抛错（不符合预期）`);
  } catch (err) {
    console.log(`  ${label}：抛出 ${err.code}`);
    console.log(`    原始信息：${err.message}`);
  }
}

// 一个最小可用的 CLI 入口骨架：把 parseArgs 的报错翻译成人话。
// 生产项目里应该在这里打印 --help 并 process.exit(2)（2 是"用法错误"的惯例退出码）。
function friendlyParse(argv) {
  try {
    return parseArgs({
      args: argv,
      options: { name: { type: 'string', short: 'n' }, verbose: { type: 'boolean', short: 'v' } },
      allowPositionals: true,
    });
  } catch (err) {
    const hints = {
      ERR_PARSE_ARGS_UNKNOWN_OPTION: '有不认识的选项，用 --help 查看全部可用选项',
      ERR_PARSE_ARGS_INVALID_OPTION_VALUE: '某个选项缺少值，或值不合法',
      ERR_PARSE_ARGS_UNEXPECTED_POSITIONAL: '多出来一个位置参数，请检查是否写错了选项名',
    };
    console.log('  友好提示：', hints[err.code] ?? `参数解析失败（${err.code}）`);
    return null;
  }
}
console.log('  模拟一次真实调用 friendlyParse(["--nmae", "张三"])（注意拼错的名字）：');
friendlyParse(['--nmae', '张三']);

// ---------------------------------------------------------------------------
// 7. tokens: true —— 把解析过程摊开
// ---------------------------------------------------------------------------

console.log('--- 7. tokens：拿到解析过程的原始记录 ---');

// tokens 会返回一份"解析日志"：每个 token 被判定成了什么（选项/位置参数/终止符）。
// 用途：写自定义的配置覆盖逻辑、实现类似 git 的复杂子命令、做参数来源追踪。
// kind 有四种：'option' | 'positional' | 'option-terminator'
const tokenized = parseArgs({
  args: ['--a=1', '-b', 'val', '--', '--not-a-flag', 'plain'],
  options: { a: { type: 'string' }, b: { type: 'string' } },
  allowPositionals: true,
  tokens: true,
});
console.log('  values      =', JSON.stringify(tokenized.values));
console.log('  positionals =', JSON.stringify(tokenized.positionals));
console.log('  tokens:');
for (const t of tokenized.tokens) {
  console.log(`    kind=${t.kind.padEnd(17)} index=${t.index}`, JSON.stringify(t));
}
console.log('  => 注意 "option-terminator"：-- 之后的 "--not-a-flag" 被当成普通位置参数，');
console.log('     这正是"把用户输入安全地传给另一个程序"所需要的语义。');

// ---------------------------------------------------------------------------
// 8. 什么时候不该用 parseArgs
// ---------------------------------------------------------------------------

console.log('--- 8. 选型：parseArgs 还是 commander / yargs ---');
console.log('  util.parseArgs：零依赖、内置、行为可预测。适合参数不多的工具脚本。');
console.log('  第三方库（commander / yargs）：自动 --help、子命令、参数校验、');
console.log('                                 shell 补全、交互式提示。适合真正的产品级 CLI。');
console.log('  经验法则：选项少于 10 个、不需要子命令 -> parseArgs；');
console.log('            需要 `git remote add` 这种多级子命令 -> 上 commander。');
console.log('  （本仓库根目录的 package.json 里就装了 commander，可另行参考。）');

// ---------------------------------------------------------------------------
// 9. 进程信号基础
// ---------------------------------------------------------------------------

console.log('--- 9. 进程信号基础 ---');

// 信号是操作系统发给进程的"异步通知"。它只有一个编号，没有参数，
// 不能携带任何数据——所以"通过信号传配置"这种事是不存在的。
console.log('  当前平台：', process.platform);
console.log('  当前平台支持的信号表（os.constants.signals）：');
for (const [name, num] of Object.entries(os.constants.signals)) {
  console.log(`    ${name.padEnd(10)} = ${num}`);
}
console.log('  => 注意 Windows 上只有这一小撮；Linux/macOS 上还会有 SIGUSR1、SIGUSR2、');
console.log('     SIGALRM、SIGCHLD 等一大堆。写跨平台程序时不要假设它们存在。');

console.log('  常用信号的含义：');
console.log('    SIGINT   (2)  Ctrl+C。最常用的"请停下"。（跨平台）');
console.log('    SIGTERM  (15) 礼貌的终止请求。docker stop、kubectl delete、pm2 stop 默认发它。');
console.log('    SIGKILL  (9)  内核直接处决，**无法捕获、无法忽略**。只能作为最后手段。');
console.log('    SIGHUP   (1)  终端断开。守护进程常借它表示"重新加载配置"。');
console.log('    SIGBREAK (21) 仅 Windows：Ctrl+Break。');
console.log('    SIGWINCH (28) 终端窗口大小变化。TUI 程序靠它重绘。');

// 退出码约定：128 + 信号编号 = "被信号杀死"。
// 于是 shell 里 $? 为 130 表示 SIGINT（128+2），143 表示 SIGTERM（128+15）。
console.log('  退出码约定：被信号杀死时，shell 的 $? = 128 + 信号编号');
console.log('    SIGINT  -> 128 + 2  = 130');
console.log('    SIGTERM -> 128 + 15 = 143');
console.log('  => 所以优雅关闭收到 SIGINT 时"主动 exit(130)"是符合惯例的做法。');

// 信号 0 是一个特例：它不发送任何信号，只用来"探测进程是否存在 / 有没有权限"。
// 在 Windows 上它同样有效（libuv 用 OpenProcess 实现）。
try {
  process.kill(process.pid, 0);
  console.log('  用信号 0 探测本进程是否存在：存在（没有抛错）');
} catch (err) {
  console.log('  用信号 0 探测本进程：抛错', err.code);
}

console.log('  Windows 的关键差异（本文件第 10 节会实测）：');
console.log('    Windows 没有真正的 POSIX 信号。libuv 把 SIGINT/SIGTERM/SIGKILL');
console.log('    一律映射成 TerminateProcess —— 进程被**无条件杀死**，');
console.log('    注册的处理器根本不会执行。');
console.log('    所以 "child.kill(SIGTERM) 后子进程能优雅关闭" 这件事在 Windows 上不成立。');

// ---------------------------------------------------------------------------
// 10~13. 用子进程演示信号与优雅关闭
// ---------------------------------------------------------------------------

// 说明：本文件**绝不会**给当前进程发信号。
// 所有信号演示都发生在一个由本文件 spawn 出来的子进程里，
// 父进程只是"发号施令 + 观察结果"，然后正常结束。

console.log('--- 10. 子进程优雅关闭的完整实现 ---');

// 下面这段代码会作为 `node -e "<这里的内容>" <mode>` 跑在子进程里。
// 它实现了一个标准的优雅关闭流程，包含：
//   1) 停止接受新工作
//   2) 清理资源（可配置为"卡住"，用来演示兜底）
//   3) 正常退出
//   4) 兜底超时后强制退出
//   5) 关闭期间收到第二次信号则立刻退出
const CHILD_SCRIPT = `
  // 子进程通过 argv[1] 拿到模式：graceful | hang
  // 注意 node -e 的形式下，argv[0] 是 node 路径，argv[1] 就是第一个自定义参数。
  const MODE = process.argv[1];

  console.log('[child] 启动，PID = ' + process.pid + '，模式 = ' + MODE);

  let shuttingDown = false;

  function gracefulShutdown(signal) {
    // 幂等保护：关闭期间重复收到信号，说明用户不耐烦了（连按两次 Ctrl+C），
    // 这时应当立刻放弃清理直接退出，退出码用 128 + 2 = 130。
    if (shuttingDown) {
      console.log('[child] 关闭已在进行了，又收到 ' + signal + ' -> 立刻退出');
      process.exit(130);
    }
    shuttingDown = true;
    console.log('[child] 收到 ' + signal + '，开始优雅关闭');

    // 第 1 步：停止接受新工作。
    // 真实项目里是 server.close()：不再接受新连接，但让进行中的请求跑完。
    console.log('[child]   步骤 1/3：停止接受新请求');

    // 第 2 步：清理资源。
    // 真实项目里是关闭数据库连接池、flush 日志缓冲、删除临时文件、注销服务发现。
    if (MODE === 'hang') {
      // 演示用：故意让清理永远完不成，好让下面的兜底逻辑有机会出场。
      console.log('[child]   步骤 2/3：清理卡住了（本演示故意如此）…');
    } else {
      setTimeout(() => {
        console.log('[child]   步骤 2/3：资源清理完成');
        console.log('[child]   步骤 3/3：优雅关闭完成，退出码 0');
        process.exit(0);
      }, 60);
    }

    // 第 3 步（关键）：兜底强制退出。
    // 无论清理有没有完成，最多等 250ms 就强制退出。
    // unref() 不能忘：它让这个定时器**不**撑住事件循环，
    // 这样如果前面已经正常退出，它不会拖住进程。
    setTimeout(() => {
      console.log('[child]   兜底超时：清理未在 250ms 内完成，强制退出（退出码 1）');
      process.exit(1);
    }, 250).unref();
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // 触发方式：父进程从 stdin 发来一个信号名。
  // 为什么要这条通路？因为 Windows 上没法从外部触发子进程的处理器（见陷阱 5），
  // 所以这里用 stdin 当"控制通道"，让演示在两种平台上都能确定地跑出结果。
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    const name = chunk.trim();
    if (name !== 'SIGTERM' && name !== 'SIGINT') return;
    if (process.platform === 'win32') {
      // Windows：没有真正的 POSIX 信号，process.kill(自身) 也会被 TerminateProcess。
      // 官方文档给出的变通做法是直接 emit 同名事件，从而走完全一样的那条处理路径。
      console.log('[child] 触发方式：Windows 变通 process.emit("' + name + '")');
      process.emit(name);
    } else {
      // POSIX：发一个**真的**信号给自己。因为已经注册了处理器，进程不会死。
      console.log('[child] 触发方式：POSIX 真信号 process.kill(process.pid, "' + name + '")');
      process.kill(process.pid, name);
    }
  });

  console.log('[child] 已注册 SIGINT / SIGTERM 处理器，等待信号…');
`;

/**
 * 启动一个受控子进程。
 * stdio 全部走管道：stdout/stderr 用来观察，stdin 用来当控制通道。
 */
function spawnChild(mode) {
  const state = { out: '', exited: false };
  const child = spawn(process.execPath, ['-e', CHILD_SCRIPT, mode], {
    stdio: ['pipe', 'pipe', 'pipe'],
    // windowsHide: true 避免在 Windows 上闪出黑框（见 10_child_process.js 陷阱 8）。
    windowsHide: true,
  });

  // 子进程的输出是流，边产边读——这里简单累加成字符串方便断言。
  child.stdout.on('data', (d) => {
    state.out += d;
  });
  child.stderr.on('data', (d) => {
    state.out += d;
  });

  // 'close' 比 'exit' 更晚，它保证标准输出流也读完了。
  // signal 非 null 表示"被信号杀死的"，code 为 null。
  const closed = new Promise((resolve) => {
    child.once('close', (code, signal) => {
      state.exited = true;
      resolve({ code, signal });
    });
  });

  return { child, state, closed };
}

/**
 * 轮询等待子进程输出里出现某个标记。
 * 为什么不直接 setTimeout(200) 了事？因为那种写法在不同机器上会随机失败
 * （Node 冷启动时间受杀毒软件、磁盘缓存影响，可能 40ms 也可能 300ms）。
 * 等待"确定的事实"比等待"估计的时间"可靠得多。
 * 返回 boolean 而不是 reject，避免教学脚本因为一个超时崩掉。
 */
function waitForText(state, marker, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const timer = setInterval(() => {
      if (state.out.includes(marker)) {
        clearInterval(timer);
        resolve(true);
      } else if (Date.now() > deadline) {
        clearInterval(timer);
        resolve(false);
      }
    }, 5);
  });
}

const READY_MARKER = '等待信号…';

function printChildOutput(state) {
  for (const line of state.out.trimEnd().split('\n')) {
    console.log('    |', line);
  }
}

// ---- 10.1 真实信号：给子进程发 SIGTERM ----
// 这一节展示的是"教科书上的做法"，同时把 Windows 上的真实行为如实打印出来。
console.log('  [10.1] 给子进程发一个**真实**的 SIGTERM：');
{
  const { child, state, closed } = spawnChild('graceful');
  const ready = await waitForText(state, READY_MARKER);
  console.log('    子进程是否已就绪 =', ready);

  // child.kill(signal) 只是"投递一个信号"，它不等对方退出，返回值表示投递是否成功。
  const delivered = child.kill('SIGTERM');
  console.log('    child.kill("SIGTERM") 返回 =', delivered, '（true 表示信号投递成功）');

  const { code, signal } = await closed;
  console.log(`    子进程结束：退出码 code = ${code}，信号 signal = ${JSON.stringify(signal)}`);
  console.log('    子进程的完整输出：');
  printChildOutput(state);

  if (process.platform === 'win32') {
    console.log('    => 实测结论（Windows）：子进程**没有**打印任何"优雅关闭"的日志。');
    console.log('       code 为 null、signal 为 "SIGTERM"，说明它是被强制终止的。');
    console.log('       node -e 里的 process.on("SIGTERM") 处理器从未执行。');
    console.log('       Windows 上没有 POSIX 信号，libuv 只能退化成 TerminateProcess。');
  } else {
    console.log('    => 实测结论（POSIX）：子进程执行了 SIGTERM 处理器并优雅退出，code 为 0。');
    console.log('       这就是为什么"优雅关闭"能在 Linux 服务器上正常工作的原因。');
  }
  console.log('    => 跨平台的工程结论：不要依赖"子进程能收到信号"这件事。');
  console.log('       需要跨平台时，用 IPC 消息 / stdin 命令 / HTTP 内部端点来传达"请关闭"。');
}

// ---- 10.2 跨平台确定可验证的优雅关闭 ----
console.log('  [10.2] 用 stdin 控制通道触发同一条优雅关闭路径：');
{
  const { child, state, closed } = spawnChild('graceful');
  await waitForText(state, READY_MARKER);

  child.stdin.write('SIGTERM\n');
  const { code, signal } = await closed;

  console.log(`    子进程结束：退出码 code = ${code}，信号 signal = ${JSON.stringify(signal)}`);
  console.log('    子进程的完整输出：');
  printChildOutput(state);
  console.log('    => 三步走完了：停止接受新工作 -> 清理资源 -> 以退出码 0 正常结束。');
  console.log('       这就是一个"生产可用"的服务在收到停止请求时该有的样子。');
}

// ---- 10.3 兜底强制退出：清理卡住了怎么办 ----
console.log('  [10.3] 清理卡住时的兜底强制退出：');
{
  const { child, state, closed } = spawnChild('hang');
  await waitForText(state, READY_MARKER);

  // 记一下耗时，验证兜底真的是在 250ms 左右触发的。
  const started = Date.now();
  child.stdin.write('SIGTERM\n');
  const { code } = await closed;
  const elapsed = Date.now() - started;

  console.log(`    子进程结束：退出码 code = ${code}，从发指令到退出耗时 ${elapsed}ms`);
  console.log('    子进程的完整输出：');
  printChildOutput(state);
  console.log('    => 清理没能在 250ms 内完成，兜底定时器接管并强制退出（退出码 1）。');
  console.log('       没有这层兜底，进程会永远挂在那里：健康检查失败、端口不释放、');
  console.log('       编排系统最后只能上 SIGKILL —— 那样连日志都来不及刷。');
  console.log('       （非零退出码是有意为之：它告诉运维"这次关闭不正常"。）');
}

// ---- 10.4 重复信号：第二次立刻退出 ----
console.log('  [10.4] 关闭期间再收到一次信号（等价于连按两次 Ctrl+C）：');
{
  const { child, state, closed } = spawnChild('graceful');
  await waitForText(state, READY_MARKER);

  child.stdin.write('SIGTERM\n');
  // 等第一条关闭日志出现，再补第二刀——模拟"用户等不及了"。
  await waitForText(state, '开始优雅关闭');
  child.stdin.write('SIGTERM\n');

  const { code } = await closed;
  console.log(`    子进程结束：退出码 code = ${code}`);
  console.log('    子进程的完整输出：');
  printChildOutput(state);
  console.log('    => 退出码 130 = 128 + 2（SIGINT），是被信号中断的惯例写法。');
  console.log('       现实里这个分支非常有用：数据库连接池卡住时，用户按第二次 Ctrl+C');
  console.log('       就能立刻脱身，而不是对着一个"正在关闭…"的提示干等。');
}

// ---------------------------------------------------------------------------
// 14. 最佳实践清单
// ---------------------------------------------------------------------------

console.log('--- 14. 最佳实践清单 ---');
console.log('  参数解析：');
console.log('    1. 用 util.parseArgs 声明选项，别手写 argv 循环；options 表本身就是文档。');
console.log('    2. strict 保持默认开启，把抛出的 err.code 翻译成友好的中文提示；');
console.log('       用法错误按惯例应以退出码 2 结束（区别于运行失败的 1）。');
console.log('    3. 记得自己做类型转换：命令行参数和环境变量一样，永远是字符串。');
console.log('    4. 用 Object.hasOwn(values, k) 判断选项是否存在（values 是无原型对象）。');
console.log('  优雅关闭：');
console.log('    5. 只处理 SIGINT 与 SIGTERM。SIGKILL 捕获不了，别白费力气。');
console.log('    6. 关闭流程固定三步：停止接受新工作 -> 清理资源 -> 退出。');
console.log('    7. 关闭函数写成幂等的；重复信号直接 exit(128 + signum) 立刻走人。');
console.log('    8. 一定加兜底超时，并且记得 .unref()，避免它反过来拖住进程。');
console.log('    9. 关闭期间用 process.exitCode 而不是在处理器开头就 process.exit()，');
console.log('       否则清理逻辑根本没有机会跑。');
console.log('   10. 跨平台时别指望子进程能收到信号——Windows 上处理器不会执行；');
console.log('       改用 IPC 消息、stdin 命令或内部 HTTP 端点来传达关闭意图。');

console.log('--- 全部演示结束，父进程未接收任何信号，正常退出 ---');
