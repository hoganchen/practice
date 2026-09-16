/**
 * ============================================================================
 * 知识点：ESLint —— 在代码跑起来之前，先把问题找出来
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】进阶
 * 【前置知识】39_tooling_and_workflow/01_package_json_guide.js、03_semver.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ESLint 是一个**静态分析工具**：它不执行你的代码，而是把源码解析成
 *    抽象语法树（AST），再让一条条"规则"去检查这棵树。
 *    每条规则可以报三个等级的严重度（off / warn / error），
 *    部分规则还能**自动修复**（--fix 或编程 API 的 fix 选项）。
 *    它解决的是"JS 这门语言本身允许，但几乎一定是写错了"的那类问题：
 *    拼错的变量名、忘了 await 的 Promise、`==` 带来的隐式类型转换、
 *    声明了却从没用过的变量……
 *
 * 2. 为什么需要（真实项目场景）
 *    · 一个人写代码时，"变量名拼错"会在运行到那一行时才炸；
 *      团队里代码互相 review 时，reviewer 有一半时间在挑格式和笔误。
 *      ESLint 把这些"机器能判断的"全部前置到编辑器和 CI 里。
 *    · 它还是团队共识的载体：`eqeqeq: 'error'` 这一行代码，
 *      等于把"本项目禁止用 =="这条口头约定写成了可执行、可强制的规则。
 *    · 新同学入职第一天，编辑器里就会亮起和全组一样的黄线——
 *      不用等人提醒，规则自己会说话。
 *
 * 3. 核心语法要点
 *    现代 ESLint（v9 起的默认形态）使用 **flat config**：
 *    一个 `eslint.config.js`，默认导出一个**数组**，
 *    数组里的每个对象是一层配置，后面的层覆盖前面的层。
 *    这与旧的 `.eslintrc.*`（继承式、靠 extends 拼字符串）完全不同。
 *
 * 4. 常见陷阱
 *    - 照抄网上 v8 时代的 `.eslintrc.json`，在新版 ESLint 里**根本不会被读取**。
 *    - 以为规则名前面的插件前缀可以省略：内置规则才没有前缀，
 *      插件规则必须写全 `plugin名/规则名`（如 `react/jsx-key`）。
 *    - 以为 `--fix` 能修一切：它只能修"有唯一正确写法"的问题，
 *      逻辑类问题（如未使用的变量该删还是该用）它不会替你决定。
 *    - 在 Node 项目里直接开 `no-undef`：Node 的全局变量（process、__dirname）
 *      会被误报，必须显式声明 globals。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/04_eslint.js
 *
 * 【预期输出】
 *   逐节打印：ESLint 的定位、flat config 的完整结构说明、
 *   与旧版 .eslintrc 的对照表、严重度三档、
 *   对一个"故意写坏的代码字符串"的真实 lint 结果（含行号/规则名/严重度/消息）、
 *   --fix 能修与不能修的对比、自定义插件与规则的完整实现、
 *   以及一个真实的 eslint.config.js 在临时项目里被发现并生效的验证。
 * ============================================================================
 */

import { ESLint } from 'eslint';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('--- 0. 环境信息 ---');
console.log(`ESLint 版本：${require('eslint/package.json').version}`);
console.log(`本仓库是否有 eslint.config.js：${(await hasRepoConfig()) ? '有' : '没有（本文件全部用编程 API 内联配置）'}`);
console.log('本文件全程使用编程 API，不 spawn 命令行、不联网。');
console.log();

/** 检查仓库根目录有没有 ESLint 配置文件 */
async function hasRepoConfig() {
  for (const name of ['eslint.config.js', 'eslint.config.mjs', '.eslintrc', '.eslintrc.json']) {
    try {
      await fs.access(path.join(ROOT, name));
      return true;
    } catch {
      // 不存在就继续找下一个
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 1. ESLint 解决什么问题
// ---------------------------------------------------------------------------
console.log('--- 1. ESLint 解决什么问题 ---');

const problems = [
  ['拼写错误的变量名', '不小心写成 cosnole.log(...)', '运行时才炸，且报错位置可能离真正原因很远'],
  ['隐式类型转换', 'if (a == b) / 1 + "1"', 'JS 允许，但几乎总是想写 ==='],
  ['未使用的变量', 'const result = compute();（result 从未被读）', '可能是重构残留，也可能暴露漏写了后续逻辑'],
  ['未定义的全局量', 'foo() 但 foo 从未声明', '严格模式下运行时直接 ReferenceError'],
  ['意外的全局变量', '函数里写 total = 0（漏了 let）', '污染全局，在浏览器里会挂到 window 上'],
  ['忘了处理 Promise', 'saveUser();（没有 await / catch）', '错误被静默吞掉，是线上事故的常见来源'],
  ['风格不一致', '单人用双引号，另一人用单引号', 'review 里反复争论，浪费团队时间'],
];
console.log(`  ${'问题类型'.padEnd(16)} ${'长什么样'.padEnd(38)} 为什么危险`);
for (const [kind, sample, why] of problems) {
  console.log(`  ${kind.padEnd(16)} ${sample.padEnd(38)} ${why}`);
}
console.log();
console.log('  注意最后一行：ESLint **可以做格式规则，但不该做**。');
console.log('  格式交给 Prettier（见 05_prettier.js），ESLint 专注"逻辑与潜在错误"。');
console.log('  这是 2024 年之后社区的共识：ESLint 官方已经废弃了所有纯格式规则。');
console.log();

// ---------------------------------------------------------------------------
// 2. flat config 的结构
// ---------------------------------------------------------------------------
console.log('--- 2. eslint.config.js（flat config）的结构 ---');

console.log('  文件本体就是一个数组（或用 defineConfig 包一层），每个元素是一层配置：');
console.log();
console.log('    // eslint.config.js');
console.log('    export default [');
console.log('      // 第 1 层：全局忽略（注意：这是"独立的一层"，不是配置项）');
console.log('      { ignores: ["dist/**", "coverage/**"] },');
console.log();
console.log('      // 第 2 层：对这一批文件生效的规则');
console.log('      {');
console.log('        files: ["**/*.js"],            // 作用范围，glob 数组');
console.log('        ignores: ["**/*.test.js"],     // 在本层里再排除（与顶层 ignores 含义略有不同）');
console.log('        languageOptions: {             // 语言与解析相关');
console.log('          ecmaVersion: 2024,           // 语法版本，决定能解析到多新的语法');
console.log('          sourceType: "module",        // "module" = ESM，"script" = 传统脚本');
console.log('          globals: { myGlobal: "readonly" },  // 声明外部注入的全局变量');
console.log('          parserOptions: { ecmaFeatures: { jsx: true } },');
console.log('        },');
console.log('        linterOptions: {');
console.log('          reportUnusedDisableDirectives: "warn",  // 无用的 eslint-disable 也报警');
console.log('        },');
console.log('        plugins: { myPlugin },         // 插件：普通对象，key 就是规则前缀');
console.log('        rules: {');
console.log('          "no-unused-vars": "warn",');
console.log('          "eqeqeq": ["error", "always"],  // 数组第二项是规则的选项');
console.log('        },');
console.log('      },');
console.log('    ];');
console.log();
console.log('  数组语义：**从前往后逐层合并/覆盖**。后面的层可以关掉前面开的规则：');
console.log('    [{ rules: { "no-console": "error" } },');
console.log('     { files: ["scripts/**"], rules: { "no-console": "off" } }]');
console.log('    → 全局禁 console，但 scripts/ 目录下允许（CLI 脚本本来就要打印）。');
console.log();

const configParts = [
  ['files', '这一层配置作用于哪些文件，glob 数组。省略表示"所有被 lint 的文件"'],
  ['ignores', '排除哪些文件。**顶层单独一个只有 ignores 的对象**表示全局忽略'],
  ['languageOptions', 'ecmaVersion / sourceType / globals / parserOptions，决定"怎么解析"'],
  ['linterOptions', 'lint 过程本身的行为，如 reportUnusedDisableDirectives'],
  ['plugins', '对象，key 是规则前缀，value 是插件对象（含 rules）'],
  ['rules', '规则表，key 是规则名，value 是严重度或 [严重度, 选项]'],
  ['settings', '给插件共享的配置（如 react 的 version、import 的 resolver）'],
  ['processor', '预处理器，用于 lint 非 JS 内容（如 Markdown 里的代码块）'],
];
for (const [key, desc] of configParts) {
  console.log(`  ${key.padEnd(18)} ${desc}`);
}
console.log();

// ---------------------------------------------------------------------------
// 3. flat config 与旧 .eslintrc 的差别
// ---------------------------------------------------------------------------
console.log('--- 3. 与旧 .eslintrc 的差别（为什么网上老教程抄不过来） ---');

const migration = [
  ['.eslintrc.json / .eslintrc.js / .eslintrc.yml', 'eslint.config.js（唯一，必须叫这个名字）'],
  ['一个对象，靠 extends 继承', '一个数组，靠数组成员顺序覆盖'],
  ['extends: ["eslint:recommended", "plugin:react/recommended"]', '直接 import 插件包并展开成配置对象'],
  ['plugins: ["react"]（字符串数组，靠命名约定加载）', 'plugins: { react }（必须是**真的对象**，显式 import）'],
  ['parser: "@typescript-eslint/parser"（字符串，有模块解析黑魔法）', 'languageOptions.parser（真实对象）'],
  ['env: { browser: true, node: true }（内置环境名）', 'languageOptions.globals（显式对象；或用 globals 包）'],
  ['overrides: [{ files, excludedFiles }]', '写多个数组元素，各自带 files / ignores'],
  ['默认忽略 dotfiles，.eslintignore 单独配置', '统一用 ignores 字段，dotfiles 默认**不再自动忽略**'],
  ['配置文件自身不会被 lint', 'eslint.config.js 也会被 lint（除非显式 ignores）'],
];
console.log(`  ${'旧 .eslintrc'.padEnd(58)} flat config`);
for (const [oldWay, newWay] of migration) {
  console.log(`  ${oldWay.padEnd(58)} ${newWay}`);
}
console.log();
console.log('  本仓库安装的是 ESLint 10，**只支持 flat config**。');
console.log('  所以在仓库里写 .eslintrc.json 完全不会生效，工具也不会给任何提示——');
console.log('  这是升级 ESLint 时最常见的"为什么我的规则没生效"。');
console.log();

// ---------------------------------------------------------------------------
// 4. 严重度三档
// ---------------------------------------------------------------------------
console.log('--- 4. 规则严重度三档 ---');

const severities = [
  ['"off"', 0, '关闭规则', '历史规则太多、先关掉一批'],
  ['"warn"', 1, '编辑器里画黄线，退出码**不变**', '渐进式引入新规则时的过渡档'],
  ['"error"', 2, '编辑器里画红线，退出码变成 1', 'CI 里必须通过的硬性要求'],
];
console.log(`  ${'写法'.padEnd(10)} ${'数字'.padEnd(6)} ${'效果'.padEnd(34)} 典型用途`);
for (const [str, num, effect, use] of severities) {
  console.log(`  ${str.padEnd(10)} ${String(num).padEnd(6)} ${effect.padEnd(34)} ${use}`);
}
console.log();
console.log('  两种写法完全等价，数字形式是历史遗留（未来可能移除），新项目一律用字符串。');
console.log('  想在 CI 里"warn 也当错误"，用 `eslint --max-warnings 0`，而不是把规则改 error。');
console.log('  这样本地开发是黄线不烦人，CI 上却一步不放——这是最实用的组合拳。');
console.log();

console.log('  带选项的写法（数组形式）：');
console.log('    "no-unused-vars": ["error", { args: "after-used", varsIgnorePattern: "^_" }]');
console.log('      → 参数里最后一个被使用的之后的未使用参数才报（前面的允许占位）');
console.log('      → 以 _ 开头的变量名视为"故意不用"，不报');
const severitySamples = [
  ['"eqeqeq": "error"', '字符串：只设严重度'],
  ['"eqeqeq": ["error", "always"]', '数组：严重度 + 选项'],
  ['"eqeqeq": ["error", "always", { null: "ignore" }]', '多选项时用对象'],
];
for (const [form, note] of severitySamples) {
  console.log(`    ${form.padEnd(52)} // ${note}`);
}
console.log();

// ---------------------------------------------------------------------------
// 5. 实战：lint 一段故意写坏的代码
// ---------------------------------------------------------------------------
console.log('--- 5. 实战：lint 一段故意写坏的代码 ---');

// 这段代码是**故意**写坏的，用来触发各种规则。
// 它以字符串形式传给 lintText()，不会在仓库里生成任何真实文件。
const BAD_CODE = `// 一段故意写坏的代码，用来演示 ESLint 能发现什么
var total = 0;

function addItem(list, item) {
  var unusedLocal = '我声明了但从没用过';
  if (list.length == 0) {
    total = total + 1;
  }
  return list.push(item);
}

function main() {
  let items = [];
  addItem(items, 'a');
  const result = addItem(items, 'b');
  console.log('结果：', result, '总数：', total);
}

main();
`;

console.log('  被检查的代码（字符串常量，不落盘）：');
BAD_CODE.split('\n').forEach((line, i) => {
  if (line !== '') console.log(`    ${String(i + 1).padStart(3)} | ${line}`);
});
console.log();

// 关键：overrideConfigFile: true 表示"不要去磁盘上找配置文件"，
// 直接使用我们内联传入的 overrideConfig。
// 本仓库没有 eslint.config.js，不传这个选项 ESLint 会直接报 "Could not find config file"。
//
// 另一个关键：ESLint 10 的 lintText 的第二参数**只接受 filePath 和 warnIgnored**，
// 不再接受 fix —— 自动修复必须在构造 ESLint 实例时用 fix: true 打开。
const linter = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    {
      languageOptions: { ecmaVersion: 2024, sourceType: 'module' },
      rules: {
        'no-unused-vars': 'warn',
        'no-var': 'error',
        eqeqeq: 'error',
        'prefer-const': 'warn',
        'no-undef': 'error',
        'no-implicit-globals': 'error',
      },
    },
  ],
});

const [result] = await linter.lintText(BAD_CODE, { filePath: 'bad-example.js' });

console.log('  lint 结果（按出现顺序）：');
console.log(`  ${'行:列'.padEnd(8)} ${'严重度'.padEnd(8)} ${'规则'.padEnd(20)} 消息`);
for (const m of result.messages) {
  const level = m.severity === 2 ? 'error' : 'warn';
  const pos = `${m.line}:${m.column}`;
  // ruleId 为 null 表示这不是某条规则报的，而是解析阶段的致命错误
  const rule = m.ruleId ?? '(解析错误)';
  console.log(`  ${pos.padEnd(8)} ${level.padEnd(8)} ${rule.padEnd(20)} ${m.message}`);
}
console.log();
console.log(`  汇总：error ${result.errorCount} 个，warn ${result.warningCount} 个，`);
console.log(`        可自动修复的：${result.fixableErrorCount} 个 error + ${result.fixableWarningCount} 个 warn。`);
console.log();

console.log('  几条值得单独解释的规则：');
const ruleNotes = [
  ['no-unused-vars', '声明了却没读过。常是重构残留，但也可能是漏写了使用逻辑——所以只给 warn。'],
  ['no-var', 'var 是函数作用域 + 变量提升，容易在循环闭包里出意外。现代代码一律 let/const。'],
  ['eqeqeq', '== 会做隐式类型转换，[] == false、"" == 0 都是 true。只有与 null 比较时 == 才合理。'],
  ['no-undef', '用了未声明的标识符。**上表里 console 被报错就是这个规则的"误报"**：我们没在 languageOptions.globals 里声明 console，ESLint 就当成未定义。Node 项目里必须把 process / __dirname / console 等加进 globals（这正是很多"ESLint 一上来报几百个错"的原因）。'],
  ['no-implicit-globals', '在 script 作用域里给未声明的名字赋值会创建全局变量，等于污染 window。'],
  ['prefer-const', '用 let 声明但从未重新赋值。改成 const 能表达"这个绑定不会变"的意图。'],
  ['no-floating-promises', '（本仓库未演示）Promise 被创建却没被 await/catch/return，错误会被静默吞掉。它需要类型信息，属于 typescript-eslint 项目，不在 ESLint 内置规则里。'],
];
for (const [rule, note] of ruleNotes) {
  console.log(`    ${rule.padEnd(22)} ${note}`);
}
console.log();

// ---------------------------------------------------------------------------
// 6. --fix：能修什么，不能修什么
// ---------------------------------------------------------------------------
console.log('--- 6. 自动修复（fix）能做什么、不能做什么 ---');

// 打开 fix 后，ESLint 会把能修的修好放在 result.output 里（注意不是改文件，
// 因为我们是 lintText；lintFiles 时才会配合 ESLint.outputFixes 写回磁盘）。
const fixingLinter = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    {
      languageOptions: { ecmaVersion: 2024, sourceType: 'module' },
      rules: { 'no-unused-vars': 'warn', 'no-var': 'error', eqeqeq: 'error', 'prefer-const': 'warn' },
    },
  ],
  fix: true, // ← 必须在构造函数里打开（ESLint 10 的 lintText 不再接受 fix 选项）
});

const FIXABLE_CODE = `var greeting = 'hi';
let count = 0;
if (greeting == 'hi') {
  count = count + 1;
  console.log(count);
}
`;
console.log('  修复前：');
for (const line of FIXABLE_CODE.split('\n')) if (line) console.log(`      ${line}`);
const [fixedResult] = await fixingLinter.lintText(FIXABLE_CODE, { filePath: 'fixable.js' });
console.log('  修复后（result.output）：');
for (const line of (fixedResult.output ?? '').split('\n')) if (line) console.log(`      ${line}`);
console.log(`  剩余未被修复的问题：${fixedResult.messages.length} 条`);
for (const m of fixedResult.messages) {
  console.log(`      ${m.line}:${m.column}  ${m.ruleId}  ${m.message}`);
}
console.log();
console.log('  修复过程中发生的两件事：');
console.log('    1) var greeting 先被 no-var 改成 let，同一轮里又被 prefer-const 改成 const。');
console.log('       ESLint 的修复是**多轮迭代**的（默认最多 10 轮），一轮的产物会成为下一轮的输入。');
console.log('    2) if (greeting == "hi") **没有**被修掉——因为 eqeqeq 不提供自动修复。');
console.log();

// 单独把 eqeqeq 的"建议（suggestion）"打出来：
// suggestion 和 fix 不同，它不会被 --fix 应用，必须由人在编辑器里点一下确认。
const [eqeqeqMsg] = fixedResult.messages.filter((m) => m.ruleId === 'eqeqeq');
if (eqeqeqMsg?.suggestions?.length) {
  console.log('  eqeqeq 给出的不是 fix 而是 suggestion：');
  for (const s of eqeqeqMsg.suggestions) {
    console.log(`    desc: ${s.desc}`);
    console.log(`    它想把代码改成：${JSON.stringify(s.fix.text)}（替换第 ${s.fix.range[0]}~${s.fix.range[1]} 个字符）`);
  }
  console.log('    → suggestion 不会被 --fix 自动应用，因为"改哪个操作数"可能有多种合理选择，');
  console.log('      编辑器会提示人工确认。这一点常被误解为"eslint --fix 没生效"。');
}
console.log();

console.log('  fix / suggestion / 都不行 —— 三种情况要分清：');
const fixKinds = [
  ['有 fix', 'no-var、prefer-const、quotes、semi', '唯一正确写法', 'eslint --fix 直接改'],
  ['只有 suggestion', 'eqeqeq（把 a == b 改成 a === b 只是"建议")', '有多种合理改法', '编辑器里人工点确认'],
  ['都没有', 'no-unused-vars、no-undef、no-implicit-globals', '需要人做判断', '只能人工处理'],
];
console.log(`    ${'类别'.padEnd(16)} ${'典型规则'.padEnd(46)} ${'为什么'.padEnd(16)} 怎么处理`);
for (const [kind, rules, why, how] of fixKinds) {
  console.log(`    ${kind.padEnd(16)} ${rules.padEnd(46)} ${why.padEnd(16)} ${how}`);
}
console.log();
console.log('  所以正确的工作流是：先 --fix 自动搞定一批，再从剩下的报告里挑出');
console.log('  suggestion 逐个人工确认，最后处理纯人工项。');
console.log('  危险提示：--fix 会真的改文件。第一次对老项目跑之前，**先提交或备份**。');
console.log();

// ---------------------------------------------------------------------------
// 7. 自定义插件与规则
// ---------------------------------------------------------------------------
console.log('--- 7. 写一条自己的规则（自定义插件） ---');

// 规则本质上就是"访问 AST 节点的回调"，用 ctx.report 报告问题。
// AST 节点的类型名见 ESTree 规范：Program / VariableDeclaration / CallExpression ...
const noTodoCommentRule = {
  meta: {
    type: 'suggestion',
    docs: { description: '禁止在代码里遗留 TODO 注释，要求拆成 issue' },
    schema: [], // 规则选项的 JSON Schema，空数组表示不接受选项
    messages: {
      found: '不要留下 TODO 注释（{{text}}），请改为开一个 issue',
    },
    fixable: null, // 这条规则不提供自动修复
  },
  create(context) {
    return {
      // Program 是根节点，在这里遍历全部注释最省事
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.value.includes('TODO')) {
            context.report({
              loc: comment.loc.start,
              messageId: 'found',
              // 把捕获到的注释文本填进消息模板的 {{text}} 占位符
              data: { text: comment.value.trim().slice(0, 30) },
            });
          }
        }
      },
    };
  },
};

const customPluginLinter = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [
    {
      languageOptions: { ecmaVersion: 2024, sourceType: 'module' },
      // plugins 是一个普通对象：key 就是规则前缀，value 是插件本体
      plugins: { team: { rules: { 'no-todo-comment': noTodoCommentRule } } },
      rules: { 'team/no-todo-comment': 'error' },
    },
  ],
});

const TODO_CODE = `// TODO: 这里的重试逻辑是临时写的，上线前要换掉
export function retry(fn) {
  return fn(); // 正常注释，不该被报
}
`;
const [todoResult] = await customPluginLinter.lintText(TODO_CODE, { filePath: 'todo.js' });
console.log('  被检查的代码里有 1 条 TODO 注释 + 1 条普通注释：');
for (const m of todoResult.messages) {
  console.log(`    ${m.line}:${m.column}  [${m.ruleId}]  ${m.message}`);
}
console.log(`  共报出 ${todoResult.messages.length} 条 → 普通注释没有被误报。`);
console.log();
console.log('  自定义规则的价值：把**你们团队特有的约定**变成可执行的检查。');
console.log('  例如"禁止直接调用 moment()"、"必须在 API 调用外层包 try/catch"、');
console.log('  "i18n 文案不许硬编码中文"——这些没有现成规则，但都可以自己写。');
console.log();

// ---------------------------------------------------------------------------
// 8. 解析错误：lint 也会抓语法错误
// ---------------------------------------------------------------------------
console.log('--- 8. 解析错误（fatal）也是一种 lint 结果 ---');

const SYNTAX_ERROR_CODE = 'const = 1;\n';
const plainLinter = new ESLint({
  overrideConfigFile: true,
  overrideConfig: [{ languageOptions: { ecmaVersion: 2024, sourceType: 'module' } }],
});
const [syntaxResult] = await plainLinter.lintText(SYNTAX_ERROR_CODE, { filePath: 'syntax.js' });
for (const m of syntaxResult.messages) {
  console.log(`    ${m.line}:${m.column}  ruleId=${m.ruleId}  message="${m.message}"`);
  if (m.fatal) {
    console.log('    → 这条消息带了 fatal: true，说明连 AST 都没解析出来，后续规则无从执行。');
  }
}
console.log(`    errorCount = ${syntaxResult.errorCount}`);
console.log('    注意：eslint 报解析错误时，**格式问题会被一起跳过**——');
console.log('    所以"lint 突然报了一堆错"时，第一件事是先往下翻，看有没有解析错误。');
console.log();

// ---------------------------------------------------------------------------
// 9. 一个真实的 eslint.config.js 被 ESLint 发现并生效
// ---------------------------------------------------------------------------
console.log('--- 9. 真实 config 文件的发现与生效（临时项目） ---');

// 前面的例子都用 overrideConfigFile: true 内联配置。
// 真实项目里配置是**写在文件里**的。我们在临时目录建一个小项目验证：
// ESLint 会从 cwd 向上找 eslint.config.js，找到后自动加载。
const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'eslint-demo-'));

try {
  await fs.writeFile(
    path.join(tmpRoot, 'package.json'),
    JSON.stringify({ name: 'eslint-config-demo', version: '1.0.0', type: 'module' }, null, 2) + '\n',
    'utf8',
  );

  const CONFIG_CONTENT = `// eslint.config.js —— flat config：默认导出一个数组
//
// 进阶写法：可以 import { defineConfig, globalIgnores } from 'eslint/config'
// 拿到 defineConfig（只为类型提示）与 globalIgnores（声明全局忽略的官方 helper）。
// 本示例的临时目录里没有 node_modules，裸模块名 import 会失败，
// 所以这里只用**不依赖任何 import 的纯对象写法**——它同样完全有效。

export default [
  // 第 1 层：全局忽略。只含 ignores 的对象不参与"合并"，是全局忽略声明。
  { ignores: ['dist/**', 'coverage/**'] },

  // 第 2 层：源码文件
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { console: 'readonly' },
    },
    linterOptions: { reportUnusedDisableDirectives: 'warn' },
    rules: {
      eqeqeq: ['error', 'always'],
      'no-unused-vars': 'warn',
      'no-var': 'error',
    },
  },

  // 第 3 层：测试文件放宽限制（允许 console、允许未使用变量）
  {
    files: ['**/*.test.js'],
    rules: { 'no-unused-vars': 'off' },
  },
];
`;

  await fs.mkdir(path.join(tmpRoot, 'src'), { recursive: true });
  await fs.writeFile(path.join(tmpRoot, 'eslint.config.js'), CONFIG_CONTENT, 'utf8');
  await fs.writeFile(
    path.join(tmpRoot, 'src', 'app.js'),
    "let unusedThing = 1;\nif (unusedThing == 1) {\n  console.log('hit');\n}\nvar legacy = 2;\nconsole.log(legacy);\n",
    'utf8',
  );

  console.log('  临时项目结构：');
  console.log('    eslint-demo/');
  console.log('      package.json');
  console.log('      eslint.config.js');
  console.log('      src/app.js   （故意写了 ==、var、未使用变量）');
  console.log();

  // 只传 cwd，不传 overrideConfigFile，让 ESLint 自己去磁盘找配置
  const projectLinter = new ESLint({ cwd: tmpRoot });
  const results = await projectLinter.lintFiles(['**/*.js']);

  console.log('  ESLint 实际扫描到的文件与问题：');
  for (const r of results) {
    const rel = path.relative(tmpRoot, r.filePath).replace(/\\/g, '/');
    console.log(`    ${rel}  →  error ${r.errorCount} / warn ${r.warningCount}`);
    for (const m of r.messages) {
      const level = m.severity === 2 ? 'error' : 'warn';
      console.log(`        ${m.line}:${m.column}  ${level}  ${m.ruleId}  ${m.message}`);
    }
  }
  console.log();
  console.log('  两个值得注意的细节：');
  console.log('    1) eslint.config.js **自己也被 lint 了**（结果是 0 个问题）。');
  console.log('       旧版 .eslintrc 时代配置文件不会被检查，flat config 时代它就是一个普通文件。');
  console.log('       不想检查它就加一条 { ignores: ["eslint.config.js"] }。');
  console.log('    2) globals 里显式声明了 console，所以没有 no-undef 误报。');
  console.log('       真实项目用 `globals` 这个包来拿现成的环境变量表，避免手抄。');
  console.log();

  // calculateConfigForFile 可以查"某个文件最终生效的配置是什么"
  const resolved = await projectLinter.calculateConfigForFile('src/app.js');
  console.log('  calculateConfigForFile("src/app.js") 的解析结果：');
  console.log(`    languageOptions.ecmaVersion = ${resolved.languageOptions.ecmaVersion}`);
  console.log(`    languageOptions.sourceType  = ${resolved.languageOptions.sourceType}`);
  console.log(`    生效的规则（${Object.keys(resolved.rules).length} 条）：`);
  for (const [name, level] of Object.entries(resolved.rules)) {
    const label = level === 2 || (Array.isArray(level) && level[0] === 2) ? 'error' : 'warn';
    console.log(`      ${name} = ${label}`);
  }
  console.log('    → 当"我明明配了规则却没生效"时，用这个方法（CLI 是 --print-config）');
  console.log('      看最终生效值，比盯着源码猜快得多。');
} finally {
  await fs.rm(tmpRoot, { recursive: true, force: true });
  console.log();
  console.log(`[清理] 已删除临时目录 ${tmpRoot}`);
}

console.log();
console.log('小结：ESLint = AST + 规则 + 严重度 + 可选的自动修复。');
console.log('      flat config 是"数组逐层覆盖"，配置即代码，插件是真实对象。');
console.log('      它的定位是"抓逻辑与潜在错误"，格式交给 05_prettier.js。');
