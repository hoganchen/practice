/**
 * ============================================================================
 * 知识点：dotenv —— .env 文件解析、变量覆盖规则、真实项目中的用法
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】入门
 * 【前置知识】09_objects、19_modules 中的环境变量相关内容
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    dotenv 解决一个具体问题：**把配置从代码里搬到环境变量里**。
 *    它读取项目根目录的 .env 文本文件，把其中的 KEY=VALUE 行
 *    写入 process.env，于是代码里就能用 process.env.DB_HOST 取到。
 *
 *    为什么需要"环境变量"这一层？
 *      - 12-Factor App 的核心原则之一：配置与代码分离；
 *      - 同一份代码在开发/测试/生产环境跑，靠环境变量区分行为；
 *      - 密钥（数据库密码、API Key）绝不能提交到 Git，只放在 .env 里，
 *        而 .env 写进 .gitignore；仓库里只提交 .env.example 作为模板。
 *
 *    核心 API：
 *      dotenv.config()                  读取 .env 并写入 process.env
 *      dotenv.config({ path, override }) 指定路径 / 是否覆盖已存在的变量
 *      dotenv.parse(text)               把字符串解析成对象（**不碰 process.env**）
 *      dotenv.populate(target, obj, opts) 把解析结果写入指定对象
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    在项目入口的最前面调用一次（必须在其他模块读取环境变量之前）：
 *      // index.js / server.js 的第一行
 *      import 'dotenv/config';           // 最简写法，等价于 dotenv.config()
 *      // 或者
 *      import dotenv from 'dotenv';
 *      dotenv.config();
 *    之后所有模块都能直接读 process.env：
 *      const pool = new Pool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT) });
 *    典型配合：
 *      - 用 zod / envalid 在启动时校验环境变量（见 05_zod_validation.js）；
 *      - 用 dotenv-expand 支持 ${VAR} 变量引用；
 *      - 用 dotenv-cli 在 npm scripts 里注入环境变量。
 *
 * 3. 核心语法要点
 *    import dotenv from 'dotenv';
 *    dotenv.parse('A=1\nB=2')             -> { A: '1', B: '2' }
 *    解析规则：
 *      - KEY=VALUE，等号两边可以有空格，空格会被去掉；
 *      - 以 # 开头的是注释行；行内 # 只有在"值未被引号包裹"时才算是注释；
 *      - 值可以用单引号或双引号包裹（包裹后空格与 # 都保留）；
 *      - 双引号内只有 \n 与 \r 会被还原成真实换行/回车，其他转义序列原样保留；
 *      - 支持 export 前缀（`export A=1` 也能解析）；
 *      - 空行被忽略；
 *      - 没有 = 的行会被跳过（不会报错）。
 *    覆盖规则：
 *      - dotenv.config() **默认不覆盖**已存在的 process.env 变量
 *        （即"真实环境变量优先于 .env 文件"），这符合 12-Factor 的约定；
 *      - 需要覆盖时传 { override: true }。
 *
 * 4. 常见陷阱
 *    - **不要真的依赖 .env 文件存在**：CI 里、别人 clone 下来第一次跑时都可能没有。
 *      所以本文件用 dotenv.parse() 解析字符串来演示，并在临时目录里
 *      动态创建文件来演示 config()。生产代码里 config() 找不到文件不会抛错，
 *      只是返回 { error }，非常容易被静默忽略。
 *    - .env 必须写进 .gitignore。泄漏一次密钥就等于永久泄漏（Git 历史擦不掉）。
 *    - 环境变量永远是字符串：process.env.PORT 是 "3000" 而不是 3000。
 *      直接参与算术会得到意外结果（"3000" + 1 === "30001"）。必须显式转换。
 *    - 值里不要写裸的 # 和空格：`PASSWORD=abc #123` 会被解析成 "abc"
 *      （# 之后被当注释）。需要时用引号：`PASSWORD="abc #123"`。
 *    - 多行值（如私钥）用双引号 + \n 转义，或用 `KEY="..."` 加真实换行（dotenv 支持）。
 *    - .env 文件不支持嵌套结构，复杂配置应当用 JSON/YAML 配置文件。
 *    - 加载顺序很重要：如果在 import 其他模块之后才 config()，
 *      那些模块在初始化时读到的还是 undefined。
 *    - NODE_ENV 之类的变量在 npm scripts 里常常已经设置好了，
 *      此时 .env 里的同名值不会生效（因为默认不覆盖）—— 这是很多"配置不生效"的根因。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/09_dotenv.js
 *   （本文件不需要仓库里存在 .env；演示用的文件会在 os.tmpdir() 里动态创建与删除）
 *
 * 【预期输出】
 *   演示 .env 文本的解析规则、覆盖规则、临时文件加载，
 *   以及真实项目里的配置加载模式。退出码 0。
 * ============================================================================
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';

console.log('--- 0. dotenv 的能力边界（先建立一个准确的心智模型）---');
console.log('  dotenv 只做两件事：');
console.log('    1. 把 .env 文本解析成 { KEY: "VALUE" } 这样一个普通的扁平对象；');
console.log('    2. 把这些键值对写进 process.env（已存在的不覆盖）。');
console.log('  它**不做**：类型转换（全都是字符串）、嵌套结构、校验、默认值。');
console.log('  那些由你的代码或 zod/envalid 之类的库负责。');
console.log('');

// ===========================================================================
console.log('--- 1. dotenv.parse()：纯函数式解析，完全不碰 process.env ---');
// ===========================================================================

// parse 是 dotenv 里最适合"演示与测试"的 API：输入字符串，输出对象，无副作用。
const basicEnv = `
# 这是一个注释行，会被忽略
APP_NAME=my-service
PORT=3000

# 等号两边的空格会被去掉
DB_HOST = localhost
DB_PORT =  5432

# 值里的空格（未被引号包裹时）会被保留吗？见下面的对比
GREETING=hello world

# 单引号包裹：内部原样保留（包括 # 和空格）
PASSWORD='p@ss #word with spaces'

# 双引号包裹：dotenv 只把 \\n 和 \\r 还原成真实的换行/回车，其余转义原样保留
MULTILINE="line1\\nline2\\tindented"

# 行内注释：未被引号包裹时，# 之后的内容被当作注释丢弃
WITH_COMMENT=value123 # 这段是注释

# export 前缀也会被正确识别（方便直接 source .env）
export EXPORTED=exported-value

# 空值
EMPTY=

# 值里含等号（如连接串）—— 只按第一个 = 分割
DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=require

# 没有等号的行会被静默跳过
THIS_LINE_IS_INVALID

# 空行被忽略

;
`;

const parsed = dotenv.parse(basicEnv);

console.log('  解析结果（注意所有值都是字符串）：');
for (const [key, value] of Object.entries(parsed)) {
  console.log(`    ${key.padEnd(14)} = ${JSON.stringify(value)}`);
}
console.log('');
console.log('  几个值得注意的解析行为：');
console.log(`    - 注释行被忽略：解析结果里没有 "这是一个注释行" 相关键；`);
console.log(`    - DB_HOST 的空格被去掉 -> ${JSON.stringify(parsed.DB_HOST)}`);
console.log(`    - 值里的空格保留 -> ${JSON.stringify(parsed.GREETING)}`);
console.log(`    - 单引号包裹时 # 不再被当注释 -> ${JSON.stringify(parsed.PASSWORD)}`);
console.log(`    - 双引号里的 \\n 被还原成真实换行，而 \\t 原样保留（dotenv 只处理 \\n 与 \\r）-> ${JSON.stringify(parsed.MULTILINE)}`);
console.log(`    - 行内注释被丢弃 -> ${JSON.stringify(parsed.WITH_COMMENT)}`);
console.log(`    - export 前缀被识别 -> ${JSON.stringify(parsed.EXPORTED)}`);
console.log(`    - 空值解析为空字符串 -> ${JSON.stringify(parsed.EMPTY)}（不是 undefined）`);
console.log(`    - 值里可以有 = -> ${JSON.stringify(parsed.DATABASE_URL)}`);
console.log(`    - 非法行被静默跳过：解析结果共 ${Object.keys(parsed).length} 个键`);
console.log('');

// ===========================================================================
console.log('--- 2. 覆盖规则：真实环境变量优先于 .env ---');
// ===========================================================================

// 关键行为：dotenv.config() 默认**不覆盖**已经存在于 process.env 的变量。
// 这样部署平台（Docker / Kubernetes / CI）注入的环境变量能压过 .env 文件。
process.env.DEMO_EXISTING = '来自真实环境变量';

const overrideTest = dotenv.parse('DEMO_EXISTING=来自env文件\nDEMO_NEW=新变量');

// populate(target, parsed, options) 是 config() 的底层实现：
// 把解析结果写入指定的对象（不传 options 时，默认不覆盖已有键）。
dotenv.populate(process.env, overrideTest);
console.log(`  process.env.DEMO_EXISTING = ${JSON.stringify(process.env.DEMO_EXISTING)}`);
console.log('    -> 保持"来自真实环境变量"，因为默认不覆盖。');

// 需要覆盖时显式传 override: true
dotenv.populate(process.env, overrideTest, { override: true });
console.log(`  使用 { override: true } 后：${JSON.stringify(process.env.DEMO_EXISTING)}`);
console.log(`  新增的变量正常写入：process.env.DEMO_NEW = ${JSON.stringify(process.env.DEMO_NEW)}`);

// 用 dotenv.populate 写入一个独立对象（不污染 process.env），便于验证规则
const isolated = { EXISTING: '原值' };
dotenv.populate(isolated, { EXISTING: '新值', ADDED: '新增' });
console.log('');
console.log(`  populate 到自定义对象（默认不覆盖）：${JSON.stringify(isolated)}`);
dotenv.populate(isolated, { EXISTING: '新值' }, { override: true });
console.log(`  populate 到自定义对象（override: true）：${JSON.stringify(isolated)}`);
console.log('');
console.log('  这个"不覆盖"的默认值非常重要：');
console.log('    CI / Docker / Kubernetes 注入的环境变量优先级高于 .env 文件，');
console.log('    从而保证"生产环境的配置不会被误提交的 .env 覆盖"。');
console.log('    也因此，npm scripts 里设了 NODE_ENV=production 时，');
console.log('    .env 里的 NODE_ENV=development 是不会生效的 —— 这是常见困惑的来源。');
console.log('');

// 清理演示用的环境变量，避免污染后续输出
delete process.env.DEMO_EXISTING;
delete process.env.DEMO_NEW;

// ===========================================================================
console.log('--- 3. 用临时文件演示 dotenv.config() ---');
// ===========================================================================

// 真实项目里 .env 在项目根目录，config() 默认就去找它。
// 本示例为了可复现、不依赖仓库文件，把演示文件写到系统临时目录里。
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dotenv-demo-'));
const tempEnvPath = path.join(tempDir, '.env');

const envFileContent = [
  '# 演示用的 .env 文件',
  'DEMO_APP_NAME=temp-demo',
  'DEMO_PORT=8080',
  'DEMO_DEBUG=true',
  'DEMO_SECRET="s3cr3t with spaces"',
  '',
].join('\n');

fs.writeFileSync(tempEnvPath, envFileContent, 'utf8');
console.log(`  已在临时目录创建文件：${tempEnvPath}`);
console.log('  文件内容：');
for (const line of envFileContent.split('\n')) console.log(`    | ${line}`);
console.log('');

// config() 读取文件并写入 process.env。第二个返回值里的 parsed 是解析结果。
const configResult = dotenv.config({ path: tempEnvPath, quiet: true });
if (configResult.error) {
  // 文件不存在时不会抛错，而是把错误放在返回值里 —— 很容易被忽略
  console.log(`  加载失败：${configResult.error.message}`);
} else {
  console.log('  加载成功，parsed = ' + JSON.stringify(configResult.parsed));
  console.log(`  process.env.DEMO_APP_NAME = ${JSON.stringify(process.env.DEMO_APP_NAME)}`);
  console.log(`  process.env.DEMO_PORT     = ${JSON.stringify(process.env.DEMO_PORT)}（注意是字符串！）`);
  console.log(`  process.env.DEMO_SECRET   = ${JSON.stringify(process.env.DEMO_SECRET)}`);
}

// 演示"文件不存在"的行为 —— 真实项目里这会被静默忽略
console.log('');
const missingResult = dotenv.config({ path: path.join(tempDir, 'not-exist.env'), quiet: true });
console.log('  加载一个不存在的文件：');
console.log(`    返回对象里没有抛错，只有 error 字段：${missingResult.error ? missingResult.error.code : '(无错误)'}`);
console.log(`    parsed = ${JSON.stringify(missingResult.parsed)}`);
console.log('    这就是为什么"配置没生效"时很难排查 —— 一定要检查返回值！');
console.log('');

// 清理临时文件与目录
fs.rmSync(tempDir, { recursive: true, force: true });
console.log(`  已清理临时目录：${tempDir}`);
console.log('');

// ===========================================================================
console.log('--- 4. 环境变量永远是字符串：类型转换的坑 ---');
// ===========================================================================

process.env.DEMO_STRING_PORT = '3000';
process.env.DEMO_STRING_FLAG = 'false';

console.log(`  typeof process.env.DEMO_STRING_PORT = ${typeof process.env.DEMO_STRING_PORT}`);
console.log(`  process.env.DEMO_STRING_PORT + 1 = ${JSON.stringify(process.env.DEMO_STRING_PORT + 1)}（字符串拼接，不是加法！）`);
console.log(`  Number(process.env.DEMO_STRING_PORT) + 1 = ${Number(process.env.DEMO_STRING_PORT) + 1}（这才是想要的）`);
console.log('');
console.log(`  process.env.DEMO_STRING_FLAG = ${JSON.stringify(process.env.DEMO_STRING_FLAG)}`);
console.log(`  Boolean("false") = ${Boolean('false')}（任何非空字符串都是 true！）`);
console.log('    即 process.env.DEBUG 只要存在就是真，哪怕值是 "false" 或 "0"。');
console.log('    正确写法：const debug = process.env.DEBUG === "true";');

/**
 * 安全地把环境变量转成布尔值：只有明确的 "true"/"1"/"yes" 才算真。
 * @param {string | undefined} value
 * @param {boolean} [fallback=false]
 */
function toBoolean(value, fallback = false) {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

console.log('');
console.log(`  用辅助函数转换："false" -> ${toBoolean('false')}，"1" -> ${toBoolean('1')}，undefined -> ${toBoolean(undefined)}`);
delete process.env.DEMO_STRING_PORT;
delete process.env.DEMO_STRING_FLAG;
console.log('');

// ===========================================================================
console.log('--- 5. 真实项目的配置加载模式 ---');
// ===========================================================================

/**
 * 一个"配置加载器"：把 dotenv 的字符串环境变量转成带类型的配置对象。
 * 这是真实项目里最常见的封装方式 —— 业务代码只接触 config，
 * 不再直接读 process.env，类型转换与默认值都集中在一处。
 *
 * @param {Record<string, string | undefined>} env 环境变量来源（便于测试时注入）
 */
function loadConfig(env = process.env) {
  /** 读取必填变量，缺失时立刻抛错（"启动时就崩，而不是运行时才炸"） */
  const required = (key) => {
    const value = env[key];
    if (value === undefined || value === '') {
      throw new Error(`缺少必需的环境变量：${key}`);
    }
    return value;
  };
  /** 读取可选变量并提供默认值 */
  const optional = (key, fallback) => env[key] ?? fallback;

  return {
    appName: optional('APP_NAME', 'unnamed-service'),
    port: Number(optional('PORT', '3000')),
    debug: toBoolean(env.DEBUG, false),
    database: {
      host: optional('DB_HOST', 'localhost'),
      port: Number(optional('DB_PORT', '5432')),
      // 密钥类变量用 required：没有就直接拒绝启动，避免后面出现难排查的鉴权失败
      password: required('DB_PASSWORD'),
    },
    // 逗号分隔的列表也要手动转换
    allowedOrigins: optional('ALLOWED_ORIGINS', '').split(',').map((s) => s.trim()).filter(Boolean),
  };
}

// 用好消息演示配置加载
const demoEnv = dotenv.parse(`
APP_NAME=order-service
PORT=8080
DEBUG=true
DB_HOST=db.internal
DB_PASSWORD=s3cr3t
ALLOWED_ORIGINS=https://a.com, https://b.com
`);
const config = loadConfig(demoEnv);
console.log('  从环境变量加载出的配置对象：');
console.log(JSON.stringify(config, null, 4).split('\n').map((l) => `    ${l}`).join('\n'));
console.log('');
console.log(`  注意 port 已经是数字：typeof config.port = ${typeof config.port}`);
console.log(`  debug 已经是布尔：typeof config.debug = ${typeof config.debug}`);
console.log(`  allowedOrigins 已经切成数组：${JSON.stringify(config.allowedOrigins)}`);

// 演示缺必填变量时的"快速失败"
try {
  loadConfig(dotenv.parse('APP_NAME=x'));
} catch (error) {
  console.log('');
  console.log(`  缺少 DB_PASSWORD 时启动直接失败：${error.message}`);
  console.log('  这就是"配置前置校验"的价值：进程启动失败比运行到一半才失败好得多。');
}
console.log('');

// ===========================================================================
console.log('--- 6. .env 的组织方式（真实项目实践）---');
// ===========================================================================
console.log('  .env.example   提交到 Git，作为模板，只含键名与说明性占位值；');
console.log('  .env           不提交，写进 .gitignore，各人本地填写真实值；');
console.log('  .env.local     本地个人覆盖（优先级更高，也不提交）；');
console.log('  .env.test      测试环境配置（可以提交，不含真实密钥）；');
console.log('  .env.production 通常不放在仓库里，而由部署平台的 Secret 注入。');
console.log('');
console.log('  加载顺序的常见实现（后面的覆盖前面的）：');
console.log('    dotenv.config({ path: ".env" });');
console.log('    dotenv.config({ path: ".env.local", override: true });   // 本地覆盖');
console.log('  或者用 dotenv-cli：  npx dotenv -e .env.local -- node app.js');
console.log('');
console.log('  安全提醒：');
console.log('    1. .env 一旦提交，密钥就永久留在 Git 历史里，必须立即轮换密钥；');
console.log('    2. 用 gitleaks / git-secrets 之类的工具在提交前扫描泄漏；');
console.log('    3. .env.example 里只写占位值，绝不写真实密钥；');
console.log('    4. 前端项目（Vite/Next）里以 VITE_ / NEXT_PUBLIC_ 开头的变量会被打包进');
console.log('       客户端产物，任何人都能看到 —— 里面绝不能有密钥。');
console.log('');

console.log('--- 7. dotenv 的替代与补充 ---');
console.log('  - dotenv-expand：支持 ${VAR} 变量引用（如 DATABASE_URL=postgres://${DB_HOST}/app）；');
console.log('  - dotenv-cli：在命令行里注入 .env，适合 npm scripts；');
console.log('  - Node 20.6+ 内置 --env-file 参数：node --env-file=.env app.js，零依赖；');
console.log('  - envalid / zod：加载后做类型与范围校验（强烈推荐配合使用）；');
console.log('  - 云平台的原生 Secret 管理（AWS Secrets Manager / K8s Secret）：生产环境首选。');

// ===========================================================================
// 自测断言
// ===========================================================================
console.log('');
console.log('--- 8. 自测断言 ---');

assert.strictEqual(parsed.APP_NAME, 'my-service');
assert.strictEqual(parsed.DB_HOST, 'localhost', '等号两边空格应被去掉');
assert.strictEqual(parsed.GREETING, 'hello world', '未加引号的值内部空格应保留');
assert.strictEqual(parsed.PASSWORD, 'p@ss #word with spaces', '单引号内 # 不是注释');
assert.strictEqual(parsed.MULTILINE, 'line1\nline2\\tindented', '双引号内的 \\n 应被还原为换行，\\t 保持原样');
assert.strictEqual(parsed.WITH_COMMENT, 'value123', '行内注释应被丢弃');
assert.strictEqual(parsed.EXPORTED, 'exported-value', 'export 前缀应被识别');
assert.strictEqual(parsed.EMPTY, '', '空值应为空字符串');
assert.strictEqual(parsed.DATABASE_URL, 'postgres://user:pass@host:5432/db?sslmode=require');
assert.strictEqual(Object.prototype.hasOwnProperty.call(parsed, 'THIS_LINE_IS_INVALID'), false, '非法行应被跳过');
assert.strictEqual(config.port, 8080);
assert.strictEqual(typeof config.port, 'number');
assert.strictEqual(config.debug, true);
assert.deepStrictEqual(config.allowedOrigins, ['https://a.com', 'https://b.com']);
assert.strictEqual(toBoolean('false'), false, '字符串 "false" 应当被转成布尔 false');
assert.strictEqual(toBoolean('1'), true);
assert.strictEqual(toBoolean(undefined, true), true);
assert.throws(() => loadConfig({}), /缺少必需的环境变量：DB_PASSWORD/);
// 确认临时文件确实被清理了，避免污染系统临时目录
assert.strictEqual(fs.existsSync(tempDir), false, '临时目录应当已删除');
console.log('  全部断言通过。');
console.log('');
console.log('演示结束。');
