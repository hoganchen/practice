/**
 * ============================================================================
 * 知识点：commander —— 构建一个完整的命令行工具（子命令 / 选项 / 参数 / 帮助）
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】进阶
 * 【前置知识】06_functions、17_错误处理相关章节；了解 process.argv 的概念
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    commander 是 Node 生态里最流行的命令行参数解析库（npm CLI、Vue CLI、
 *    create-react-app 等都用它）。它把你的命令行程序组织成三个层次：
 *      程序（program） -> 子命令（command） -> 选项（option）与参数（argument）
 *      例如：git commit -m "msg" 里，git 是程序，commit 是子命令，
 *            -m 是选项，"msg" 是选项值。
 *
 *    它负责的事情：
 *      - 解析 process.argv（或你显式传入的数组）成结构化的选项对象；
 *      - 校验必填参数、选项类型、取值范围，并在出错时给出人类可读的提示；
 *      - 自动生成 --help 与 --version 输出；
 *      - 支持子命令、可变参数、自定义类型转换函数、选项默认值。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    几乎所有"给开发者用的工具"都是 CLI：脚手架、构建脚本、
 *    数据迁移脚本、本地开发服务器、代码生成器。
 *    commander 让你能把精力放在业务逻辑上，而不是手写
 *    `const args = process.argv.slice(2)` 和一长串 if-else 解析。
 *    典型结构：
 *      bin/cli.js        入口，定义 program
 *      commands/*.js     每个子命令一个文件，导出 register(program) 函数
 *      lib/              真正的业务逻辑（与 CLI 解耦，可单独测试）
 *
 * 3. 核心语法要点
 *    import { program, Command } from 'commander';
 *    program.name('x').description('...').version('1.0.0')
 *    program.option('-p, --port <number>', '端口', '3000')     短横线 + 长横线 + 描述 + 默认值
 *    program.requiredOption('-t, --token <value>', '必填')     缺失时直接报错
 *    program.argument('<file>', '输入文件')                    必填参数
 *    program.argument('[dest]', '目标目录', 'dist')            可选参数 + 默认值
 *    program.argument('<files...>', '多个文件')                可变参数
 *    command('add <title>').description('...').action((title, options) => {})
 *    .action((...args, command) => {})                        最后一个参数是 Command 实例
 *    .option('--no-color', '禁用颜色')                         生成默认值为 true 的 color 选项
 *    .option('-l, --level <n>', '级别', (v) => parseInt(v, 10)) 自定义类型转换
 *    .option('-t, --tag <tag>', '标签', collect, [])            可重复选项累加成数组
 *    program.parse(['node', 'cli.js', ...])                   传入固定 argv（便于测试）
 *    program.parseAsync(...)                                  有 async action 时用
 *    program.exitOverride()                                   不调用 process.exit，改为抛错
 *    program.configureOutput({ writeErr, writeOut })          自定义 help/错误的输出流
 *    program.helpInformation()                                获取 help 文本
 *
 * 4. 常见陷阱
 *    - **本文件的关键约定**：测试/示例里不要依赖真实的 process.argv，
 *      一定要传固定数组 `program.parse(['node','cli.js','add','任务'])`。
 *      否则 `node 文件.js` 无参数运行时会进入 help 或校验失败，退出码非 0。
 *    - 默认情况下 commander 在参数错误时会调用 process.exit(1)，
 *      这让"错误处理"无法被测试。用 .exitOverride() 让它改成抛错。
 *    - 选项与参数的顺序：commander 默认允许选项出现在参数之后，
 *      但如果参数带默认值又用可变参数 `.`，解析结果可能不符合直觉，要写测试确认。
 *    - `--no-xxx` 选项的默认值是 true，容易误判（例如 --no-color 不传时
 *      options.color 是 true，而不是 false）。
 *    - action 里如果用了 async，必须用 parseAsync，否则 action 的 Promise
 *      不会被等待，错误会被吞掉、进程可能提前退出。
 *    - 选项名会自动转成驼峰：`--dry-run` 对应 options.dryRun。
 *    - 子命令忘了 .action() 时不会报错，只是什么都不做 —— 静默失败很难排查。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/08_commander_cli.js
 *   （本文件用固定的模拟 argv 多次调用 parse，不读取真实的 process.argv，
 *     因此直接运行不会进入 help 或报错，退出码为 0）
 *
 * 【预期输出】
 *   依次演示 8 组命令行调用的解析结果与执行效果，
 *   最后打印一份完整的 --help 文本。退出码 0。
 * ============================================================================
 */

import { Command } from 'commander';
import assert from 'node:assert/strict';

// ===========================================================================
// 第 1 步：构建一个"任务管理 CLI"（真实项目里的业务逻辑层）
// ===========================================================================

/** 内存中的任务列表：模拟持久化存储 */
const tasks = [];
let nextId = 1;

/**
 * 添加任务。
 * @param {string} title 任务标题
 * @param {{tag?: string[], priority?: string}} options
 */
function addTask(title, options) {
  const task = {
    id: nextId,
    title,
    tags: options.tag ?? [],
    priority: options.priority ?? 'normal',
    done: false,
  };
  nextId += 1;
  tasks.push(task);
  return task;
}

/** 列出任务，可按状态与标签过滤 */
function listTasks(options) {
  let result = [...tasks];
  if (options.done === true) result = result.filter((t) => t.done);
  if (options.pending === true) result = result.filter((t) => !t.done);
  if (options.tag) result = result.filter((t) => t.tags.includes(options.tag));
  return result;
}

/** 把任务标记为完成 */
function completeTask(id) {
  const task = tasks.find((t) => t.id === Number(id));
  if (!task) {
    // 抛出一个带 exitCode 的错误，便于 CLI 层统一处理
    const error = new Error(`找不到 id 为 ${id} 的任务`);
    error.exitCode = 2;
    throw error;
  }
  task.done = true;
  return task;
}

/** 删除任务 */
function removeTask(id) {
  const index = tasks.findIndex((t) => t.id === Number(id));
  if (index === -1) {
    const error = new Error(`找不到 id 为 ${id} 的任务`);
    error.exitCode = 2;
    throw error;
  }
  return tasks.splice(index, 1)[0];
}

// ===========================================================================
// 第 2 步：定义 CLI（commander 部分）
// ===========================================================================

/**
 * 构建 CLI 程序。做成函数而不是模块级单例，
 * 这样测试里想构建多个互不干扰的 program 实例也很容易。
 *
 * @param {{onOutput?: (line: string) => void}} [config] 输出回调（默认打到 stdout）
 */
function buildCli(config = {}) {
  const out = config.onOutput ?? ((line) => console.log(line));

  // program 是整棵命令树的根。用 new Command() 而不是全局单例更适合测试。
  const program = new Command();

  program
    // 程序名会出现在 help 文本的 Usage 行
    .name('task')
    .description('一个演示用的任务管理 CLI（用于教学 commander 的各种能力）')
    .version('1.2.3', '-v, --version', '显示版本号')
    // 全局选项：对所有子命令都生效
    .option('--verbose', '输出详细日志')
    .option('--dry-run', '只演示不真正修改数据（选项名会转成驼峰 dryRun）')
    // exitOverride：把"参数错误 -> process.exit(1)"改成"抛错"，
    // 这是让 CLI 可测试的关键一步。不这么做，测试进程会被直接杀掉。
    .exitOverride()
    // configureOutput：把 help 与错误信息重定向到我们自己的输出通道，
    // 这样既能看到内容，也能在测试里捕获它们。
    .configureOutput({
      writeOut: (str) => out(str.replace(/\n$/, '')),
      writeErr: (str) => out(`[stderr] ${str.replace(/\n$/, '')}`),
      outputError: (str, write) => write(`[错误] ${str}`),
    });

  // -------------------------------------------------------------------------
  // 子命令 1：add —— 演示"必填参数 + 可重复选项 + 枚举校验"
  // -------------------------------------------------------------------------
  program
    .command('add')
    .description('添加一个任务')
    // <title> 尖括号表示必填参数；解析结果会作为 action 的第一个参数
    .argument('<title>', '任务标题')
    // 可重复选项：用自定义收集函数把多次传入的值累积成数组
    .option(
      '-t, --tag <tag>',
      '给任务打标签（可重复使用）',
      /** 收集函数：第一次调用时用初始值 []，之后不断 push */
      (value, previous) => {
        previous.push(value);
        return previous;
      },
      [],
    )
    // 自定义类型转换 + 取值校验
    .option(
      '-p, --priority <level>',
      '优先级：low | normal | high',
      (value) => {
        const allowed = ['low', 'normal', 'high'];
        if (!allowed.includes(value)) {
          // 在解析阶段就抛错，commander 会包装成友好的参数错误
          throw new Error(`优先级只能是 ${allowed.join(' / ')}，收到的是 "${value}"`);
        }
        return value;
      },
      'normal',
    )
    .action((title, options, command) => {
      // 陷阱：action 的第二个参数（options）**只包含本子命令自己的选项**，
      // 定义在 program 上的全局选项（--dry-run / --verbose）不在里面！
      // 要用 command.optsWithGlobals() 才能拿到"自己的 + 祖先的"合并结果。
      const opts = command.optsWithGlobals();

      if (opts.dryRun) {
        out(`  [dry-run] 本应添加任务：${title}`);
        return;
      }
      const task = addTask(title, opts);
      out(`  已添加任务 #${task.id}：${task.title}（优先级 ${task.priority}，标签 ${JSON.stringify(task.tags)}）`);
      if (opts.verbose) out(`  [verbose] 当前任务总数：${tasks.length}`);
    });

  // -------------------------------------------------------------------------
  // 子命令 2：list —— 演示"互斥选项 + 过滤"
  // -------------------------------------------------------------------------
  program
    .command('list')
    .description('列出任务')
    .option('--done', '只看已完成')
    .option('--pending', '只看未完成')
    .option('--tag <tag>', '只看包含指定标签的任务')
    .option('--json', '以 JSON 格式输出')
    .action((options) => {
      const result = listTasks(options);
      if (options.json) {
        out(`  ${JSON.stringify(result)}`);
        return;
      }
      if (result.length === 0) {
        out('  （没有符合条件的任务）');
        return;
      }
      for (const task of result) {
        const mark = task.done ? '✔' : '○';
        const tags = task.tags.length ? ` [${task.tags.join(',')}]` : '';
        out(`  ${mark} #${task.id} ${task.title}${tags} (${task.priority})`);
      }
    });

  // -------------------------------------------------------------------------
  // 子命令 3：done / remove —— 演示"同一个处理函数复用到两个命令"
  // -------------------------------------------------------------------------
  /**
   * 生成"按 id 操作"的子命令。
   * 真实项目里这种"命令族"很常见，抽成工厂函数可以避免重复。
   * @param {string} name
   * @param {string} description
   * @param {(id: string) => any} handler
   */
  const makeIdCommand = (name, description, handler) => {
    program
      .command(name)
      .description(description)
      .argument('<id>', '任务 id')
      .action((id, options, command) => {
        // 同样要用 optsWithGlobals() 才能看到 program 上的全局 --dry-run
        if (command.optsWithGlobals().dryRun) {
          out(`  [dry-run] 本应执行 ${name} #${id}`);
          return;
        }
        const result = handler(id);
        out(`  已${description}：#${result.id} ${result.title}`);
      });
  };
  makeIdCommand('done', '标记完成', completeTask);
  makeIdCommand('remove', '删除', removeTask);

  // -------------------------------------------------------------------------
  // 子命令 4：export —— 演示"异步 action + 可变参数"
  // -------------------------------------------------------------------------
  program
    .command('export')
    .description('导出任务到指定文件（演示异步 action）')
    // 可变参数：<files...> 会把剩余所有位置参数收集成数组
    .argument('<formats...>', '导出格式，可指定多个（如 json csv）')
    .option('-o, --output <path>', '输出路径', 'tasks.out')
    .action(async (formats, options) => {
      // 模拟一个异步操作（真实项目里可能是写文件、上传、请求接口）
      await new Promise((resolve) => setTimeout(resolve, 5));
      out(`  导出 ${tasks.length} 条任务到 ${options.output}`);
      out(`  格式：${formats.join(', ')}`);
      out(`  （这是异步 action，必须用 parseAsync 才能被正确等待）`);
    });

  // -------------------------------------------------------------------------
  // 子命令 5：config —— 演示"嵌套子命令"
  // -------------------------------------------------------------------------
  const configCmd = program.command('config').description('管理配置');
  configCmd
    .command('get')
    .description('读取配置项')
    .argument('<key>', '配置键')
    .action((key) => {
      // 用内嵌对象模拟配置文件
      const store = { theme: 'dark', lang: 'zh-CN' };
      out(`  ${key} = ${store[key] ?? '(未设置)'}`);
    });
  configCmd
    .command('set')
    .description('写入配置项')
    .argument('<key>')
    .argument('<value>')
    .action((key, value) => {
      out(`  已设置 ${key} = ${value}`);
    });

  return program;
}

// ===========================================================================
// 第 3 步：演示 —— 用固定的模拟 argv 调用
// ===========================================================================

console.log('--- 0. 说明：为什么必须传模拟 argv ---');
console.log('  真实的 CLI 会读 process.argv，但示例/测试里必须传固定数组：');
console.log("    program.parse(['node', 'task', 'add', '写文档'])");
console.log('  数组的前两个元素按约定是"运行时"和"脚本路径"，commander 会跳过它们。');
console.log('  这样 `node 08_commander_cli.js` 无参数运行时不会进入 help，也不会报错。');
console.log('');

/** 收集输出，避免直接污染 stdout，便于最后统一断言 */
let captured = [];
/**
 * 运行一次 CLI 并返回捕获到的输出行。
 * @param {string[]} argv 模拟的命令行参数（不含 node 与脚本名）
 * @returns {Promise<string[]>}
 */
async function runCli(argv) {
  captured = [];
  const program = buildCli({ onOutput: (line) => captured.push(line) });
  try {
    // parseAsync 会等待 async action 完成；同步 action 也能用
    await program.parseAsync(['node', 'task', ...argv]);
  } catch (error) {
    // exitOverride 之后，参数错误会以异常形式抛到这里。
    // commander 的错误对象带有 code 属性（如 'commander.missingArgument'）。
    captured.push(`[捕获异常] code=${error.code ?? 'n/a'} message=${error.message}`);
  }
  return captured;
}

// --- 演示 1：最基础的子命令 + 必填参数 ---
console.log('--- 1. add：子命令 + 必填参数 ---');
for (const line of await runCli(['add', '写单元测试'])) console.log(line);
console.log('  解析出的 title = "写单元测试"（<title> 是必填位置参数）。');
console.log('');

// --- 演示 2：可重复选项累加成数组 ---
console.log('--- 2. add：可重复选项 -t 累加成数组 ---');
for (const line of await runCli(['add', '修复登录 bug', '-t', 'bug', '-t', 'urgent', '--tag', 'backend'])) console.log(line);
console.log('  三种写法（-t bug / -t urgent / --tag backend）都被收集进 tags 数组。');
console.log('');

// --- 演示 3：自定义类型转换与取值校验 ---
console.log('--- 3. add：自定义类型转换 + 非法值报错 ---');
for (const line of await runCli(['add', '紧急需求', '--priority', 'high'])) console.log(line);
console.log('  传非法优先级时：');
for (const line of await runCli(['add', '紧急需求', '--priority', 'urgent'])) console.log(line);
console.log('  错误在解析阶段就被拦下，业务代码根本不会被执行 —— 这是"尽早失败"原则的体现。');
console.log('');

// --- 演示 4：全局选项 + 布尔选项 ---
console.log('--- 4. 全局选项 --dry-run / --verbose ---');
for (const line of await runCli(['add', '不应被真正添加的任务', '--dry-run'])) console.log(line);
console.log('  --dry-run 是全局选项，写在子命令后面也能被识别。');
console.log('  重要陷阱：action 的 options 参数只含"本子命令自己的选项"，');
console.log('            全局选项必须通过 command.optsWithGlobals() 获取 ——');
console.log('            否则 options.dryRun 永远是 undefined，dry-run 会静默失效。');
for (const line of await runCli(['list'])) console.log(line);
console.log('  可见刚才那条任务确实没有被加进去。');
console.log('');

// --- 演示 5：过滤与 JSON 输出 ---
console.log('--- 5. list：过滤选项 ---');
for (const line of await runCli(['list', '--pending'])) console.log(line);
console.log('  只看带 bug 标签的任务：');
for (const line of await runCli(['list', '--tag', 'bug'])) console.log(line);
console.log('  以 JSON 输出（便于脚本消费，真实 CLI 的常见能力）：');
for (const line of await runCli(['list', '--json'])) console.log(line);
console.log('');

// --- 演示 6：命令族的复用 ---
console.log('--- 6. done / remove：同一个工厂函数生成两个子命令 ---');
for (const line of await runCli(['done', '1'])) console.log(line);
for (const line of await runCli(['list', '--done'])) console.log(line);
console.log('  操作不存在的 id 时会抛业务错误：');
for (const line of await runCli(['remove', '999'])) console.log(line);
console.log('  注意：这个错误来自业务层（找不到任务），与参数解析错误是两类问题，');
console.log('        真实 CLI 里应当给出不同的退出码（参数错误 1，业务错误 2）。');
console.log('');

// --- 演示 7：可变参数 + 异步 action ---
console.log('--- 7. export：可变参数 + 异步 action ---');
for (const line of await runCli(['export', 'json', 'csv', '--output', '/tmp/tasks.out'])) console.log(line);
console.log('  <formats...> 把 json 和 csv 两个位置参数收集成了数组。');
console.log('  异步 action 必须用 parseAsync —— 用 parse 的话 Promise 不会被等待，');
console.log('  错误会被吞掉，且进程可能在导出完成前就退出了。');
console.log('');

// --- 演示 8：嵌套子命令 ---
console.log('--- 8. config：嵌套子命令（config get / config set）---');
for (const line of await runCli(['config', 'get', 'theme'])) console.log(line);
for (const line of await runCli(['config', 'set', 'theme', 'light'])) console.log(line);
console.log('  嵌套子命令适合"有一组相关操作"的场景（git remote add / git remote remove）。');
console.log('');

// --- 演示 9：参数缺失时的自动报错 ---
console.log('--- 9. 缺少必填参数时的行为 ---');
for (const line of await runCli(['add'])) console.log(line);
console.log('  commander 自动检测到缺少 <title>，给出提示并抛错（exitOverride 后不杀进程）。');
console.log('');

// --- 演示 10：--help 与 --version ---
console.log('--- 10. 自动生成的帮助信息 ---');
const helpProgram = buildCli({ onOutput: () => {} });
// helpInformation() 直接返回 help 文本，不会打印，适合在测试里断言
const helpText = helpProgram.helpInformation();
console.log(helpText);
console.log('');
console.log('  usage / 全局选项 / 命令列表 / 每个命令的说明，全部由 commander 自动生成 ——');
console.log('  你只需要写 .description() 与 .option() 的描述文本。');
console.log('');
console.log('  版本号（--version 的输出）：');
const versionProgram = buildCli({ onOutput: (line) => console.log(`    ${line}`) });
try {
  versionProgram.parse(['node', 'task', '--version']);
} catch {
  // commander 的 --version 在输出后会抛一个 code 为 'commander.version' 的错误，
  // 这是 exitOverride 模式的正常行为。
}

// 也可以用 path 维度看子命令的帮助
console.log('');
console.log('  add 子命令的帮助（helpInformation 的可选参数是"命令路径"）：');
const addHelp = helpProgram.commands.find((c) => c.name() === 'add').helpInformation();
console.log(addHelp);
console.log('');

// ===========================================================================
// 第 4 步：真实项目里的组织方式
// ===========================================================================
console.log('--- 11. 真实项目的目录结构建议 ---');
console.log('  bin/cli.js              # 入口：#!/usr/bin/env node + program.parseAsync(process.argv)');
console.log('  commands/add.js         # export function register(program) { program.command("add")... }');
console.log('  commands/list.js');
console.log('  lib/tasks.js            # 纯业务逻辑，完全不依赖 commander，可单独单元测试');
console.log('  test/cli.test.js        # 用 program.parse(["node","cli",...]) 测试，不依赖真实 argv');
console.log('');
console.log('  两条重要原则：');
console.log('    1. 业务逻辑与 CLI 解析分离 —— lib/ 里不 import commander，');
console.log('       这样业务逻辑可以用普通单元测试覆盖，不必模拟命令行；');
console.log('    2. CLI 层只做三件事：解析参数、调用业务函数、把结果/错误格式化输出。');
console.log('');

console.log('--- 12. commander 的替代方案 ---');
console.log('  - yargs：功能更全（自动生成 help、命令补全、配置合并），但 API 更重；');
console.log('  - minimist / mri：只解析参数，不做子命令与校验，适合极简场景；');
console.log('  - cac：Vite 等在用，API 现代、体积小；');
console.log('  - Node 内置 util.parseArgs（Node 18.3+）：零依赖，但不支持子命令与 help 生成。');
console.log('  选择建议：需要子命令 + 自动 help 的完整 CLI -> commander（生态最成熟）；');
console.log('            只是解析几个 flag -> util.parseArgs 就够了。');

// ===========================================================================
// 自测断言
// ===========================================================================
console.log('');
console.log('--- 13. 自测断言 ---');

const addOutput = await runCli(['add', '断言用任务', '-t', 'a', '-t', 'b', '--priority', 'low']);
assert.ok(addOutput.some((l) => l.includes('断言用任务')), 'add 应输出任务标题');
assert.ok(addOutput.some((l) => l.includes('low')), 'add 应体现优先级');

// 可重复选项被收集成数组
const tagTask = tasks.find((t) => t.title === '断言用任务');
assert.deepStrictEqual(tagTask.tags, ['a', 'b'], '可重复选项应累加成数组');

// 自定义校验：非法优先级应当抛错且不创建任务
const countBefore = tasks.length;
const invalidOutput = await runCli(['add', '不该被创建', '--priority', 'urgent']);
assert.ok(invalidOutput.some((l) => l.includes('捕获异常')), '非法优先级应被捕获为异常');
assert.strictEqual(tasks.length, countBefore, '参数非法时不应执行 action');

// 缺少必填参数
const missingOutput = await runCli(['add']);
assert.ok(missingOutput.some((l) => l.includes('捕获异常')), '缺少必填参数应抛错');

// dry-run 不修改数据
const dryCount = tasks.length;
await runCli(['add', 'dry-run 任务', '--dry-run']);
assert.strictEqual(tasks.length, dryCount, 'dry-run 不应修改数据');

// 异步 action 被等待
const exportOutput = await runCli(['export', 'json', 'csv']);
assert.ok(exportOutput.some((l) => l.includes('导出')), '异步 action 应执行完成');
assert.ok(exportOutput.some((l) => l.includes('json, csv')), '可变参数应被收集成数组');

// 嵌套子命令
const configOutput = await runCli(['config', 'get', 'theme']);
assert.ok(configOutput.some((l) => l.includes('dark')), 'config get 应返回值');

// 业务错误被捕获
const notFound = await runCli(['remove', '99999']);
assert.ok(notFound.some((l) => l.includes('找不到')), '业务错误应被捕获');

// help 文本包含关键部分
assert.ok(helpText.includes('Usage: task'), 'help 应包含 Usage 行');
assert.ok(helpText.includes('add'), 'help 应列出 add 子命令');
assert.ok(helpText.includes('--dry-run'), 'help 应列出全局选项');
assert.ok(helpText.includes('list'), 'help 应列出 list 子命令');
assert.strictEqual(addHelp.includes('<title>'), true, 'add 的帮助应包含必填参数说明');
assert.ok(addHelp.includes('--tag'), 'add 的帮助应列出 --tag 选项');

console.log(`  全部断言通过（当前内存中 ${tasks.length} 条任务）。`);
console.log('');
console.log('演示结束。');
