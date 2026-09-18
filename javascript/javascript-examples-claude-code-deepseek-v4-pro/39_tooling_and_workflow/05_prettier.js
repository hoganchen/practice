/**
 * ============================================================================
 * 知识点：Prettier —— 只负责格式，不管逻辑的"代码排版机"
 * ============================================================================
 *
 * 【所属分类】39_tooling_and_workflow —— 工程化工具链
 * 【难度等级】入门
 * 【前置知识】39_tooling_and_workflow/04_eslint.js（ESLint，理解两者分工）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    Prettier 是一个**固执己见（opinionated）的代码格式化器**：
 *    你把源码交给它，它按一套固定规则重新打印一遍。
 *    它**完全不理解**你的业务逻辑，也不判断对错——它只决定
 *    "这行该不该换行、缩进几个空格、用单引号还是双引号、末尾要不要逗号"。
 *    关键特征是**几乎不可配置**：能调的选项只有二十几个，而且都没有"我全都要"的档位。
 *    这种"限制"是刻意的——它的目标不是让你配出理想的风格，
 *    而是让**所有人都不再讨论风格**。
 *
 * 2. 为什么需要（真实项目场景）
 *    · 代码 review 里最没价值的部分就是"你这行怎么没换行""引号怎么不统一"。
 *      Prettier 把这些争论一次性归零：格式由工具决定，不由人决定。
 *    · 它让 diff 变得干净：没有 Prettier 时，一次重命名可能因为缩进变化
 *      导致整个文件都标红；有了 Prettier，diff 里只剩真正的逻辑改动。
 *    · 它是**多语言**的：JS/TS/JSON/CSS/SCSS/HTML/Markdown/YAML 都能格式化。
 *      一个工具管住整个仓库的排版，配置文件只有一个。
 *
 * 3. 核心语法要点
 *    编程 API 只有两个最常用：
 *      await prettier.format(code, { parser: 'babel', ...options })  → 返回格式化后的字符串
 *      await prettier.check(code, options)                          → 返回 true/false
 *    注意 Prettier 3 起所有 API 都是**异步**的（返回 Promise），
 *    旧版 `prettier.format(code, opts)` 直接返回字符串的写法已经不存在了。
 *
 * 4. 常见陷阱
 *    - 用 ESLint 管格式，又装 Prettier → 两者互相打架：
 *      ESLint 要加分号，Prettier 说不加，你改一次它报一次。
 *      正确做法：格式全部交给 Prettier，ESLint 关掉所有格式规则。
 *    - parser 写错：`.ts` 文件传 `parser: 'babel'` 会在泛型语法上直接报错。
 *    - 以为 Prettier 会顺手修 bug：它连"这个变量没定义"都不在乎。
 *    - 在 CI 上跑 `prettier --write`（会改文件却没人 review）：
 *      CI 上应该跑 `prettier --check`，让格式不合规**失败**，而不是偷偷改掉。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 39_tooling_and_workflow/05_prettier.js
 *
 * 【预期输出】
 *   逐节打印：Prettier 的定位、与 ESLint 的分工与冲突处理、
 *   同一段代码在 6 组不同配置下的真实输出差异、prettier.check 的用法、
 *   多语言 parser 对照与实测、配置文件（.prettierrc）在临时项目里被发现的验证、
 *   以及幂等性验证。
 * ============================================================================
 */

import prettier from 'prettier';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

console.log('--- 0. 环境信息 ---');
console.log(`Prettier 版本：${require('prettier/package.json').version}`);
console.log('本文件全程使用编程 API（prettier.format / prettier.check），不 spawn 命令行、不联网。');
console.log();

// ---------------------------------------------------------------------------
// 1. Prettier 的定位
// ---------------------------------------------------------------------------
console.log('--- 1. Prettier 是什么、不是什么 ---');

const positioning = [
  ['决定缩进、换行、引号、分号、逗号', '✔ 它管', '这就是它的全部工作'],
  ['决定变量有没有定义', '✘ 它不管', '那是 ESLint 的 no-undef'],
  ['决定该不该用 ===', '✘ 它不管', '那是 ESLint 的 eqeqeq'],
  ['决定这段代码有没有 bug', '✘ 它不管', '格式正确 ≠ 逻辑正确'],
  ['决定注释该不该保留', '✔ 它管（但只挪位置，不删）', '它不会删掉你的注释和代码'],
  ['决定业务逻辑怎么写', '✘ 它不管', '它甚至不"理解"你的代码'],
];
console.log(`  ${'能力'.padEnd(34)} ${'是否'.padEnd(10)} 说明`);
for (const [what, yesNo, note] of positioning) {
  console.log(`  ${what.padEnd(34)} ${yesNo.padEnd(10)} ${note}`);
}
console.log();

console.log('  一个直观证据：下面这段代码有明显的逻辑问题，Prettier 照样会把它排得整整齐齐。');
const LOGICALLY_BROKEN = "const x = 1\nx == '1' ? console.log('相等') : null\nundeclaredVar.foo()\n";
const prettified = await prettier.format(LOGICALLY_BROKEN, { parser: 'babel' });
console.log('    格式化前：');
for (const l of LOGICALLY_BROKEN.split('\n')) if (l) console.log(`      ${l}`);
console.log('    格式化后：');
for (const l of prettified.split('\n')) if (l) console.log(`      ${l}`);
console.log('    → 排版完美，但逻辑错误一个都没少。这就是"Prettier 不管逻辑"的含义。');
console.log();

// ---------------------------------------------------------------------------
// 2. 与 ESLint 的分工
// ---------------------------------------------------------------------------
console.log('--- 2. 与 ESLint 的分工：为什么不要用 ESLint 管格式 ---');

console.log('  两个工具的历史包袱：');
console.log('    ESLint 早期把"格式"当成 lint 的一部分，于是有了 indent / semi / quotes');
console.log('    这些规则。但格式规则有个致命问题：**它们之间会互相冲突**，');
console.log('    而且每条规则都要和所有其他规则协调，规则数量爆炸式增长。');
console.log();
console.log('    ESLint 官方随后做了两件事：');
console.log('      1) 在 v8.53 把 indent / semi / quotes 等纯格式规则**全部标记废弃**；');
console.log('      2) 官方文档明确建议"格式化交给 Prettier"。');
console.log();

const division = [
  ['管什么', '逻辑错误与代码质量', '排版与格式'],
  ['典型问题', '变量未定义、=== 用错、Promise 没处理', '缩进、换行、引号、分号、逗号'],
  ['能否自动修复', '部分能（另有一部分只能给建议）', '几乎全部能'],
  ['会不会误报', '会（no-undef 在没配 globals 时）', '几乎不会（它不做判断）'],
  ['配置量', '每条规则都要决策，容易吵起来', '二十几个选项，大部分项目只用 3~4 个'],
  ['运行时机', '编辑器实时 + 提交前 + CI', '保存时 + 提交前 + CI'],
];
console.log(`  ${'维度'.padEnd(14)} ${'ESLint'.padEnd(38)} Prettier`);
for (const [dim, eslintRole, prettierRole] of division) {
  console.log(`  ${dim.padEnd(14)} ${eslintRole.padEnd(38)} ${prettierRole}`);
}
console.log();

console.log('  冲突是怎么发生的（真实场景）：');
console.log('    你在 ESLint 里配了 "semi": ["error", "always"]（必须有分号），');
console.log('    Prettier 配了 semi: false（不要分号）。于是：');
console.log('      保存 → Prettier 去掉分号 → ESLint 报 "Missing semicolon" →');
console.log('      你手动加回分号 → 保存 → Prettier 又去掉 → 无限循环。');
console.log();
console.log('  标准解法（二选一）：');
console.log('    方案 A（现代推荐）：ESLint 里**不开任何格式规则**，');
console.log('       Prettier 单独跑。flat config 下本来就没有默认开启格式规则，');
console.log('       只要你自己不去配 indent / semi / quotes 就行。');
console.log('    方案 B（老项目迁移）：装 eslint-config-prettier，');
console.log('       在 flat config 最后加一层它的配置，它会一次性关掉所有与 Prettier');
console.log('       冲突的 ESLint 规则。注意它只"关规则"，不"开格式检查"。');
console.log();
console.log('    历史遗留：eslint-plugin-prettier（把 Prettier 当成一条 ESLint 规则跑）。');
console.log('       它能让编辑器只装一个插件，但性能差、报错信息难读、');
console.log('       现在官方已不推荐新项目使用。');
console.log();

// ---------------------------------------------------------------------------
// 3. 常用配置项
// ---------------------------------------------------------------------------
console.log('--- 3. 常用配置项与默认值 ---');

const info = await prettier.getSupportInfo();
const optionNames = ['printWidth', 'tabWidth', 'useTabs', 'semi', 'singleQuote', 'quoteProps', 'trailingComma', 'bracketSpacing', 'arrowParens', 'endOfLine'];
const optionDocs = {
  printWidth: '每行最大宽度。超过就换行。**注意这是"软上限"，Prettier 不会为了它强行拆开无法拆的结构。**',
  tabWidth: '一个缩进层级等于几个空格。',
  useTabs: '用制表符而不是空格缩进。社区惯例是 false。',
  semi: '语句末尾加分号。true = 加。',
  singleQuote: '用单引号。true = 单引号（但 JSON、JSX 属性仍按各自规则处理）。',
  quoteProps: '对象属性名何时加引号。"as-needed"（默认）只在必要时加。',
  trailingComma: '多行结构中最后一项后面加逗号。默认 "all"，好处是增删一项时 diff 只动一行。',
  bracketSpacing: '对象字面量花括号内侧是否留空格：{ a: 1 } vs {a: 1}。',
  arrowParens: '箭头函数单参数是否带括号。"always"（默认）带，"avoid" 不带。',
  endOfLine: '换行符："lf"（默认，跨平台统一）、"crlf"（Windows 习惯，会引发 git 全文件 diff）、"auto"（沿用文件里已有的）。',
};
for (const name of optionNames) {
  const opt = info.options.find((o) => o.name === name);
  const def = opt ? JSON.stringify(opt.default) : '(未找到)';
  console.log(`  ${name.padEnd(16)} 默认 ${def.padEnd(12)} ${optionDocs[name]}`);
}
console.log();
console.log('  「固执己见」体现在这里：Prettier 故意不提供"缩进用不缩进""换行按我的来"');
console.log('  这类自由度。它一共只有二十几个选项，而且每个选项的取值都很有限。');
console.log('  目的是：**让风格问题变得没有讨论空间**。');
console.log();

// ---------------------------------------------------------------------------
// 4. 同一段代码，不同配置
// ---------------------------------------------------------------------------
console.log('--- 4. 同一段代码，6 组配置的真实输出 ---');

// 这段代码故意写得"很挤"：单行长、无空格、多样引号混用
const MESSY_CODE = `const config={name:'demo',items:[1,2,3],nested:{a:1,b:2}}
const handler=(event)=>{return items.filter((item)=>item.active).map((item)=>({id:item.id,name:item.name}))}
function longCall(){return someVeryLongFunctionName(argumentOne,argumentTwo,argumentThree,argumentFour)}
`;

console.log('  原始输入（故意写得很挤）：');
for (const l of MESSY_CODE.split('\n')) if (l) console.log(`      ${l}`);
console.log();

const configs = [
  { label: '全部默认', options: {} },
  { label: 'printWidth: 40（窄行宽）', options: { printWidth: 40 } },
  { label: 'semi: false + singleQuote: true', options: { semi: false, singleQuote: true } },
  { label: 'arrowParens: "avoid" + trailingComma: "none"', options: { arrowParens: 'avoid', trailingComma: 'none' } },
  { label: 'tabWidth: 4 + useTabs: true', options: { tabWidth: 4, useTabs: true } },
  { label: 'endOfLine: "crlf"（Windows 换行）', options: { endOfLine: 'crlf' } },
];

for (const { label, options } of configs) {
  const out = await prettier.format(MESSY_CODE, { parser: 'babel', ...options });
  console.log(`  【${label}】`);
  for (const l of out.split('\n')) {
    if (l === '') continue;
    // 把制表符和回车可视化，否则看不出 useTabs / endOfLine 的差别
    const visible = l.replace(/\t/g, '→   ').replace(/\r$/, '⏎');
    console.log(`      ${visible}`);
  }
  console.log();
}

console.log('  从上面可以看出 Prettier 的几个"性格"：');
console.log('    1) 只要超宽，它宁可把对象拆成多行，也不会让一行超出 printWidth。');
console.log('    2) 链式调用（.filter().map()）超宽时，会**每个 .方法 各占一行**。');
console.log('    3) 箭头函数的括号、尾随逗号、分号、引号，全部一句话搞定，无需逐个文件改。');
console.log('    4) 在「arrowParens: avoid」下，`(event) =>` 变成 `event =>`——');
console.log('       但它**不会**把 `()` 空参数或 `(a, b)` 多参数也去掉括号（那会改变语义）。');
console.log();

// ---------------------------------------------------------------------------
// 5. prettier.check()：CI 上该用的那个
// ---------------------------------------------------------------------------
console.log('--- 5. prettier.check()：CI 上的正确用法 ---');

const formatted = await prettier.format(MESSY_CODE, { parser: 'babel' });
console.log(`  check(原始混乱代码)   = ${await prettier.check(MESSY_CODE, { parser: 'babel' })}`);
console.log(`  check(已格式化代码)   = ${await prettier.check(formatted, { parser: 'babel' })}`);
console.log();
console.log('  用法区别（这是 CI 上的关键决策）：');
console.log('    prettier --write  → 直接改文件。适合**本地**保存时/提交前。');
console.log('    prettier --check  → 只判断"是不是已经符合格式"，返回非零退出码。');
console.log('                        适合 **CI**：让不符合格式的代码**构建失败**，');
console.log('                        而不是在 CI 里偷偷改掉（改了没人 review，等于没发生）。');
console.log();

// ---------------------------------------------------------------------------
// 6. 幂等性：格式化两次结果一样
// ---------------------------------------------------------------------------
console.log('--- 6. 幂等性（一个必须成立的性质） ---');

const once = await prettier.format(MESSY_CODE, { parser: 'babel' });
const twice = await prettier.format(once, { parser: 'babel' });
console.log(`  对原始代码格式化一次，再对结果格式化一次，两次结果相同吗：${once === twice}`);
console.log('  → 这个性质叫幂等（idempotent）。它保证了多人协作时不会出现');
console.log('    "你格式化我的文件、我格式化你的文件"来回震荡的 diff 地狱。');
console.log('    如果发现 Prettier 不幂等（极罕见），通常是有插件或语法争议，需要上报。');
console.log();

// ---------------------------------------------------------------------------
// 7. 多语言支持与 parser 对照
// ---------------------------------------------------------------------------
console.log('--- 7. 支持的语言与 parser 对照 ---');

const wantedLangs = ['JavaScript', 'JSX', 'TypeScript', 'TSX', 'JSON', 'JSON with Comments', 'CSS', 'SCSS', 'Less', 'HTML', 'Vue', 'Markdown', 'YAML', 'GraphQL', 'Handlebars'];
console.log(`  ${'语言'.padEnd(20)} 可用 parser`);
for (const lang of wantedLangs) {
  const found = info.languages.find((l) => l.name === lang);
  console.log(`  ${lang.padEnd(20)} ${found ? found.parsers.join(', ') : '(未支持)'}`);
}
console.log();
console.log(`  Prettier ${prettier.version} 共支持 ${info.languages.length} 种语言、${info.options.length} 个配置项。`);
console.log('  注意 JavaScript 一行有 8 个 parser —— 日常只用记住三个：');
console.log('    babel   → .js / .jsx（支持所有新语法，含实验性提案）');
console.log('    typescript → .ts（**含类型语法，babel 解析不了**）');
console.log('    json    → .json；jsonc → 带注释的 JSON（如 VS Code 的 settings.json）');
console.log();

// 真机验证：同一段 JSON，用不同 parser
console.log('  实测不同 parser 处理不同语言：');
const multiLangSamples = [
  ['css', '.card{color:#fff;margin:0 8px}.card:hover{color:#000}'],
  ['markdown', '# 标题\n\n| 列 A | 列 B |\n| --- | --- |\n| 1 | 2 |\n\n- 项目一\n- 项目二\n'],
  ['json', '{"name":"demo","list":[1,2,3],"nested":{"a":1}}'],
  ['yaml', 'name: demo\nlist:\n    - 1\n    - 2\n'],
];
for (const [parser, sample] of multiLangSamples) {
  try {
    const out = await prettier.format(sample, { parser });
    console.log(`    [parser: ${parser}] 输入 ${sample.length} 字符 → 输出 ${out.length} 字符`);
    // Markdown 的空行是有语义的（分隔段落/列表），所以这里**要把空行也打出来**
    const lines = out.split('\n');
    if (lines[lines.length - 1] === '') lines.pop(); // 去掉结尾那个换行产生的空串
    for (const l of lines) console.log(l === '' ? '        (空行)' : `        ${l}`);
  } catch (err) {
    console.log(`    [parser: ${parser}] 失败：${err.message.split('\n')[0]}`);
  }
}
console.log();

// parser 选错会怎样？演示一次（自己 try/catch，不让进程退出）
console.log('  parser 选错时的报错（用 TS 语法喂给 babel）：');
try {
  await prettier.format('const x: number = 1;\n', { parser: 'babel' });
  console.log('    意外成功了');
} catch (err) {
  console.log(`    ${err.constructor.name}: ${err.message.split('\n')[0]}`);
  console.log('    → 所以 .ts 文件必须用 parser: "typescript"。');
  console.log('      CLI 上 Prettier 会按文件扩展名自动选 parser，');
  console.log('      但用编程 API 时必须自己指定——忘了传就是最常见的报错来源。');
}
console.log();

// ---------------------------------------------------------------------------
// 8. 配置文件：.prettierrc 如何被自动发现
// ---------------------------------------------------------------------------
console.log('--- 8. 配置文件与忽略文件 ---');

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'prettier-demo-'));
try {
  await fs.writeFile(path.join(tmpRoot, 'package.json'), JSON.stringify({ name: 'prettier-demo', version: '1.0.0', type: 'module' }, null, 2) + '\n', 'utf8');

  // .prettierrc.json 是最常见的配置文件形态。
  // 其他等价形态：.prettierrc（无扩展名，JSON 或 YAML）、.prettierrc.yaml、
  // .prettierrc.js / .cjs / .mjs（可编程）、或 package.json 里的 "prettier" 字段。
  const RC = {
    printWidth: 100,
    semi: false,
    singleQuote: true,
    trailingComma: 'all',
    arrowParens: 'avoid',
    endOfLine: 'lf',
  };
  await fs.writeFile(path.join(tmpRoot, '.prettierrc.json'), JSON.stringify(RC, null, 2) + '\n', 'utf8');

  // .prettierignore 的语法和 .gitignore 一样
  await fs.writeFile(path.join(tmpRoot, '.prettierignore'), 'dist/\ncoverage/\n*.min.js\npackage-lock.json\n', 'utf8');

  // Prettier 会从"被格式化的文件所在目录"向上找最近的配置文件
  const sourceFile = path.join(tmpRoot, 'src', 'app.js');
  await fs.mkdir(path.dirname(sourceFile), { recursive: true });

  const resolved = await prettier.resolveConfig(sourceFile);
  console.log(`  临时项目根目录：${tmpRoot}`);
  console.log('  .prettierrc.json 内容：' + JSON.stringify(RC));
  console.log();
  console.log('  prettier.resolveConfig("src/app.js") 解析到的配置：');
  console.log('    ' + JSON.stringify(resolved));
  console.log('    → 与 .prettierrc.json 一致，说明配置被正确发现。');
  console.log('      编辑器插件和 CLI 都用同一套解析逻辑，所以"编辑器里和 CI 上不一样"');
  console.log('      通常是因为配置文件位置不对（比如放在了仓库外）。');
  console.log();

  const ignored = await prettier.getFileInfo(path.join(tmpRoot, 'dist', 'bundle.js'), { ignorePath: path.join(tmpRoot, '.prettierignore') });
  const notIgnored = await prettier.getFileInfo(sourceFile, { ignorePath: path.join(tmpRoot, '.prettierignore') });
  console.log('  .prettierignore 的生效验证（getFileInfo）：');
  console.log(`    dist/bundle.js → ignored = ${ignored.ignored}`);
  console.log(`    src/app.js     → ignored = ${notIgnored.ignored}，推断出的 parser = "${notIgnored.inferredParser}"`);
  console.log('    → 注意 getFileInfo 还能按扩展名**推断 parser**，这正是 CLI 不用手写 parser 的原因。');
  console.log();

  // 用解析出来的配置去格式化
  const [withConfig, withoutConfig] = await Promise.all([
    prettier.format(MESSY_CODE, { parser: 'babel', ...resolved }),
    prettier.format(MESSY_CODE, { parser: 'babel' }),
  ]);
  console.log('  同一段代码：应用项目配置 vs 只用默认值');
  console.log('    [项目配置 printWidth=100, semi=false, singleQuote=true, arrowParens=avoid]');
  for (const l of withConfig.split('\n')) if (l) console.log(`      ${l}`);
  console.log('    [全部默认 printWidth=80, semi=true, singleQuote=false]');
  for (const l of withoutConfig.split('\n')) if (l) console.log(`      ${l}`);
  console.log('    → 结论：**没有配置文件的 Prettier 是无效的**。');
  console.log('      团队一定要把 .prettierrc 提交进仓库，否则每个人格式化结果都不同。');
} finally {
  await fs.rm(tmpRoot, { recursive: true, force: true });
  console.log();
  console.log(`[清理] 已删除临时目录 ${tmpRoot}`);
}

console.log();
console.log('小结：Prettier 是"格式的唯一权威"，ESLint 是"逻辑的守门人"。');
console.log('      两者分工清晰、互不越界，团队就不需要再为风格吵架。');
console.log('      下一站：06_bundlers_and_transpiling.js 讲构建与转译。');
