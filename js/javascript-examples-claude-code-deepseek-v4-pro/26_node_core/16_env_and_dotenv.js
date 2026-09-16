/**
 * ============================================================================
 * 知识点：环境变量与配置管理 —— process.env、默认值策略与 NODE_ENV 约定
 * ============================================================================
 *
 * 【所属分类】26_node_core —— Node.js 核心模块
 * 【难度等级】进阶
 * 【前置知识】26_node_core/01_process_object.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    环境变量是操作系统传递给进程的一组"键 = 值"字符串，在 Node 里通过
 *    process.env 访问。它是"十二要素应用"（The Twelve-Factor App）推荐的配置方式：
 *    配置随环境（开发/测试/生产）变化，代码不随环境变化。
 *
 *    相关的两个概念要分清：
 *      · 环境变量本身：由操作系统、shell、容器编排平台（Docker/K8s）或 CI 注入
 *      · .env 文件：一个纯文本文件，用简单格式写 KEY=VALUE，**由工具读取后
 *        塞进 process.env**。Node 本身**不认识** .env 文件——它只是普通文本。
 *        dotenv 这类库的全部工作就是"读文件 + 赋值给 process.env"，
 *        没有任何魔法。本示例用一段字符串演示这个机制，因此**不依赖任何 .env 文件**。
 *
 * 2. 为什么需要
 *    · 密钥不能进代码仓库。数据库密码、API Key 放进环境变量，代码就可以公开。
 *    · 同一份代码要跑在多个环境。开发连本地数据库、生产连集群，差别只在配置。
 *    · 容器与云平台的标准做法。Docker 的 -e、K8s 的 env、CI 的 secrets
 *      全部以环境变量形式注入，这是生态的通用语言。
 *    · 快速开关行为。DEBUG=1 打开详细日志，不需要改代码重新打包。
 *
 * 3. 核心语法要点
 *    - process.env.KEY          读取；不存在时得到 undefined
 *    - 值**永远是字符串**（或 undefined），没有数字、布尔、数组
 *    - process.env.KEY = 'v'    赋值（只影响当前进程，不会写回操作系统）
 *    - delete process.env.KEY   删除
 *    - KEY ?? 'default'         空值合并：只在 undefined/null 时用默认值
 *    - KEY || 'default'         逻辑或：空字符串、'0'、'false' 也会被当成假值
 *    - 命名约定：常量风格全大写 + 下划线，如 DATABASE_URL、MAX_RETRY_COUNT
 *    - NODE_ENV 是事实标准：'development' / 'production' / 'test'
 *    - 读取时立刻转换类型：Number() / 自定义 bool 解析 / split(',') 变数组
 *    - 校验失败要"快速失败"：启动时抛错，远好于运行到一半才发现配置不对
 *
 * 4. 常见陷阱
 *    陷阱 1：以为能读到数字或布尔。process.env.PORT === 3000 永远是 false，
 *            因为它是字符串 '3000'。所有值都要显式转换。
 *    陷阱 2：三种"假值误判"要分清。
 *            · 空字符串会被 || 丢掉 -> 字符串默认值请用 ??（只判 null/undefined）
 *            · 字符串 'false' 是**真值**，if (process.env.X) 会成立 -> 必须显式比较
 *            · Number('0') 是 0（假值），`Number(x) || n` 会把合法的 0 换成 n
 *            另外注意 '0' 与 'false' 作为字符串本身是真值，不会被 || 丢弃。
 *    陷阱 3：把未校验的环境变量直接当数字用。Number(undefined) 是 NaN，
 *            一个 NaN 端口会让服务器监听失败，而错误信息往往离现场很远。
 *    陷阱 4：环境变量本质上是**非结构化文本**，无法表达嵌套对象与数组类型。
 *            复杂配置需要约定序列化格式（如 JSON 字符串）或改用配置文件。
 *    陷阱 5：把环境变量当成"安全存储"。它会被子进程继承、
 *            可能出现在日志/崩溃转储/容器 inspect 输出里。
 *            真正的密钥应该用专门的密钥管理服务。
 *    陷阱 6：把 NODE_ENV 当成业务开关。"if (NODE_ENV === 'production') 用真支付"
 *            这种代码会让本地无法测真实流程。NODE_ENV 只应影响
 *            "性能与调试相关"的行为（日志级别、缓存、错误详情）。
 *    陷阱 7：忘记 .env 必须写进 .gitignore。把密钥提交进仓库是最高频的安全事故。
 *    陷阱 8：Windows 的 PATH 键名可能是 'Path'。Windows 上环境变量键名不区分大小写，
 *            但对象属性名区分，所以 process.env.PATH 可能取不到值（见 01 的陷阱）。
 *    陷阱 9：.env 的值不要加引号（加了会被当成值的一部分）。这一点与 shell 相反。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 26_node_core/16_env_and_dotenv.js
 *   可选：先设置几个环境变量再运行，观察"已有值优先"的行为，例如
 *         PORT=8080 NODE_ENV=production node 26_node_core/16_env_and_dotenv.js
 *
 * 【预期输出】
 *   演示环境变量的读写与字符串本质、默认值策略对比、NODE_ENV 的用法，
 *   手写一个 .env 解析器验证"它就是读文本再赋给 process.env"，
 *   最后组装出一份经过校验的类型化配置对象并演示快速失败。
 *   不读写任何文件，不访问网络。
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. process.env 的本质：一个字符串字典
// ---------------------------------------------------------------------------

console.log('--- 1. 环境变量的本质 ---');

// process.env 是一个特殊对象：属性值只能是字符串或 undefined。
const nodeEnv = process.env.NODE_ENV;
console.log('  NODE_ENV 的原始值 =', JSON.stringify(nodeEnv));
console.log('  类型 =', typeof nodeEnv, '（未设置时是 undefined，不是空字符串）');

// 这是最核心的一条认知：环境变量里没有类型，只有文本。
// 演示：自己写一个进去，再读回来。
process.env.DEMO_PORT = '8080';
const rawPort = process.env.DEMO_PORT;
console.log('  写入 DEMO_PORT = "8080" 后读回：', JSON.stringify(rawPort), '类型：', typeof rawPort);
console.log('  它与数字 8080 相等吗 =', rawPort === 8080, '（false！字符串永远不等于数字）');
console.log('  转换之后 =', Number(rawPort), '类型：', typeof Number(rawPort));

// 陷阱演示：把未转换的字符串直接参与运算，会得到意外的结果。
console.log('  字符串 + 1 = ', rawPort + 1, '（字符串拼接，不是加法）');
console.log('  转换后 + 1 = ', Number(rawPort) + 1, '（这才是想要的）');

// 不存在的键返回 undefined；用 ?? 兜底是最准确的写法。
console.log('  不存在的键 =', process.env.DEMO_NOT_EXIST, '（undefined）');

// 删除环境变量（只影响当前进程）。
delete process.env.DEMO_PORT;
console.log('  删除后 =', process.env.DEMO_PORT);

// ---------------------------------------------------------------------------
// 2. 默认值策略：?? 与 || 的区别
// ---------------------------------------------------------------------------

console.log('--- 2. 默认值策略 ?? vs || ---');

// 关键区别：
//   ||  在"假值"（false、0、''、NaN、null、undefined）时回退
//   ??  只在 null / undefined 时回退，这才是"未设置"的精确语义
//
// 注意一个容易误解的点：字符串 '0' 和 'false' 都是**非空字符串**，
// 在 JS 里它们都是**真值**！所以 `process.env.X || d` 并不会丢掉它们。
// 真正会被 || 丢掉的只有**空字符串**。这引出两类不同方向的坑：

function readWithOr(key, fallback) {
  return process.env[key] || fallback;
}
function readWithNullish(key, fallback) {
  return process.env[key] ?? fallback;
}

// ---- 坑 1：空字符串被 || 丢掉 ----
process.env.DEMO_EMPTY = '';
console.log('  DEMO_EMPTY = ""（空字符串，有时表示"显式置空/禁用"）');
console.log('    用 || 读取 ->', JSON.stringify(readWithOr('DEMO_EMPTY', 'DEFAULT')), ' <-- 显式的空值被回退掉了');
console.log('    用 ?? 读取 ->', JSON.stringify(readWithNullish('DEMO_EMPTY', 'DEFAULT')), ' <-- 正确保留');
delete process.env.DEMO_EMPTY;

// ---- 坑 2：字符串 'false' 是真值，用 if 判断会出错 ----
// 这是比 || 更危险的一类坑：不是"值被丢掉"，而是"值被误判为真"。
process.env.DEMO_DEBUG = 'false';
console.log('  DEMO_DEBUG = "false"（本意是关闭调试）');
// 反面示范：非空字符串 'false' 是真值，所以这个条件会**成立**！
console.log('    if (process.env.DEMO_DEBUG) ->', Boolean(process.env.DEMO_DEBUG), ' <-- 居然是真！');
console.log('    => 千万别用 if (process.env.X) 判断开关，必须显式比较。');
// 正确做法：与 'true' 比较，或者用前面定义的 envBool 做严格解析。
console.log("    显式比较 === 'true' ->", process.env.DEMO_DEBUG === 'true', ' <-- 正确');
console.log("    envBool('DEMO_DEBUG', false) ->", envBool('DEMO_DEBUG', false), ' <-- 正确（见下一节）');
delete process.env.DEMO_DEBUG;

// ---- 坑 3：转成数字后再用 || 会把合法的 0 丢掉 ----
process.env.DEMO_RETRY = '0';
console.log('  DEMO_RETRY = "0"（重试次数为 0 是完全合法的配置）');
console.log('    Number(process.env.DEMO_RETRY) || 3 ->', Number(process.env.DEMO_RETRY) || 3, ' <-- 0 被换成了 3！');
console.log('    Number(process.env.DEMO_RETRY) ?? 3 ->', Number(process.env.DEMO_RETRY) ?? 3, ' <-- 正确保留 0');
delete process.env.DEMO_RETRY;

console.log('  => 结论：读字符串用 ??；读布尔必须显式比较；');
console.log('     "数字 + ||" 这种组合尤其危险，因为它会把合法的 0 悄悄换掉。');

// ---------------------------------------------------------------------------
// 3. 类型转换与校验：一组可复用的读取器
// ---------------------------------------------------------------------------

console.log('--- 3. 类型转换与校验 ---');

// 环境变量没有类型，所以每个项目都需要一组"读取 + 转换 + 校验"的小工具。
// 下面这套是这个模式的完整形态：读不到用默认值，读到了但格式不对就**立刻报错**。

/** 读取字符串，带默认值 */
function envStr(key, fallback) {
  const value = process.env[key];
  // 用 ?? 而非 ||：空字符串是"显式设置过"的信号。
  return value ?? fallback;
}

/** 读取整数，并校验范围 */
function envInt(key, fallback, { min = -Infinity, max = Infinity } = {}) {
  const raw = process.env[key];
  // 未设置时直接用默认值。
  if (raw === undefined) return fallback;

  // Number('') 是 0，Number('abc') 是 NaN，所以必须先排除空串。
  const value = Number(raw);
  if (raw.trim() === '' || !Number.isFinite(value)) {
    // 快速失败：配置错误应该在启动时暴露，而不是运行到一半才崩。
    throw new Error(`环境变量 ${key} 必须是数字，当前值是 ${JSON.stringify(raw)}`);
  }
  const int = Math.trunc(value);
  if (int < min || int > max) {
    throw new Error(`环境变量 ${key} 必须在 [${min}, ${max}] 范围内，当前是 ${int}`);
  }
  return int;
}

/** 读取布尔值。约定用 '1'/'true'/'yes' 表示真，'0'/'false'/'no' 表示假 */
function envBool(key, fallback) {
  const raw = process.env[key];
  if (raw === undefined) return fallback;

  // 先统一小写并去掉空白，避免 ' TRUE ' 这种写法被误判。
  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;

  // 既不真也不假 —— 明确报错，不要猜。
  throw new Error(`环境变量 ${key} 不是合法布尔值：${JSON.stringify(raw)}`);
}

/** 读取逗号分隔的列表，并去掉空白项 */
function envList(key, fallback = []) {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  // 顺便过滤掉空串，这样 'a,,b,' 也能得到干净的 ['a','b']。
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}

/** 读取枚举值，只允许白名单中的取值 */
function envEnum(key, allowed, fallback) {
  const raw = process.env[key];
  if (raw === undefined) return fallback;
  if (!allowed.includes(raw)) {
    throw new Error(`环境变量 ${key} 只能是 ${allowed.join(' / ')} 之一，当前是 ${JSON.stringify(raw)}`);
  }
  return raw;
}

// 正常路径：用默认值读出一份配置。
console.log('  用默认值读出的配置：');
console.log(`    envStr('DEMO_NAME', '匿名')            = ${JSON.stringify(envStr('DEMO_NAME', '匿名'))}`);
console.log(`    envInt('DEMO_PORT', 3000)              = ${envInt('DEMO_PORT', 3000)}`);
console.log(`    envBool('DEMO_DEBUG', false)           = ${envBool('DEMO_DEBUG', false)}`);
console.log(`    envList('DEMO_HOSTS', ['localhost'])   = ${JSON.stringify(envList('DEMO_HOSTS', ['localhost']))}`);
console.log(`    envEnum('DEMO_MODE', ['a','b'], 'a')   = ${JSON.stringify(envEnum('DEMO_MODE', ['a', 'b'], 'a'))}`);

// 各种"坏输入"演示：每个都应当抛出清晰的错误，而不是静默产出垃圾值。
console.log('  坏输入的处理（每一个都快速失败并给出可读信息）：');

// 端口写了非数字
process.env.DEMO_BAD_PORT = 'abc';
try {
  envInt('DEMO_BAD_PORT', 3000);
} catch (err) {
  console.log('    非数字端口 ->', err.message);
}
// 端口超出合法范围
process.env.DEMO_BAD_PORT = '99999';
try {
  envInt('DEMO_BAD_PORT', 3000, { min: 1, max: 65535 });
} catch (err) {
  console.log('    超范围端口 ->', err.message);
}
// 布尔值写法无法识别
process.env.DEMO_BAD_BOOL = 'maybe';
try {
  envBool('DEMO_BAD_BOOL', false);
} catch (err) {
  console.log('    非法布尔 ->', err.message);
}
// 枚举值不在白名单
process.env.DEMO_BAD_MODE = 'staging';
try {
  envEnum('DEMO_BAD_MODE', ['development', 'production', 'test'], 'development');
} catch (err) {
  console.log('    非法枚举 ->', err.message);
}

// 清理演示用的变量。
for (const key of ['DEMO_BAD_PORT', 'DEMO_BAD_BOOL', 'DEMO_BAD_MODE']) {
  delete process.env[key];
}

// 列表解析的实际效果。
process.env.DEMO_HOSTS = ' api.a.com , api.b.com ,,api.c.com ,';
console.log('  列表解析 " api.a.com , api.b.com ,,api.c.com ," =', JSON.stringify(envList('DEMO_HOSTS')));
console.log('  => 空白项被清理掉了，调用方拿到的是干净的数组。');
delete process.env.DEMO_HOSTS;

// ---------------------------------------------------------------------------
// 4. 手写一个 .env 解析器：看清 dotenv 到底在做什么
// ---------------------------------------------------------------------------

console.log('--- 4. .env 的本质 ---');

// 再次强调：Node **不认识** .env 文件，它只是一个约定俗成的文本文件。
// dotenv 这个库做的事情全部如下：把文本按行解析成键值对，再挂到 process.env 上。
// 下面用一段字符串代替文件内容，完整复现这个过程——这样既讲清了原理，
// 又不需要仓库里存在真实的 .env 文件。

const dotEnvText = `# 这是注释行，会被忽略
# 空行也会被忽略

APP_NAME=我的应用
APP_PORT=4000
APP_DEBUG=true
APP_HOSTS=db1.local,db2.local
   # 缩进的注释同样忽略

# 值里可以包含等号，只按第一个等号切分
APP_URL=postgres://user:pass@localhost:5432/db?sslmode=disable

# 加引号时，引号会被当成值的一部分（与 shell 相反，这是常见误解）
APP_QUOTED="带引号的值"
`;

/**
 * 极简版 .env 解析器。
 * @param {string} text .env 文件的文本内容
 * @returns {Record<string,string>} 解析出的键值对
 */
function parseDotEnv(text) {
  const result = {};

  // 统一换行符后按行切分（Windows 文件是 \r\n）。
  for (const rawLine of text.replace(/\r\n/g, '\n').split('\n')) {
    // 去掉首尾空白。
    const line = rawLine.trim();

    // 跳过空行与注释行。注释以 # 开头。
    if (line === '' || line.startsWith('#')) continue;

    // 只按**第一个**等号切分：这样值里就能包含等号与冒号（如数据库连接串）。
    const eqAt = line.indexOf('=');
    if (eqAt === -1) {
      // 没有等号的行是畸形数据，跳过它比抛异常更符合 .env 的宽松风格。
      continue;
    }

    const key = line.slice(0, eqAt).trim();
    // 值也需要 trim，因为人们习惯在等号两边加空格。
    const value = line.slice(eqAt + 1).trim();

    // 键为空的行无意义，跳过。
    if (key === '') continue;

    result[key] = value;
  }

  return result;
}

const parsedEnv = parseDotEnv(dotEnvText);
console.log('  解析出的键值对：');
for (const [key, value] of Object.entries(parsedEnv)) {
  console.log(`    ${key} = ${JSON.stringify(value)}`);
}
console.log('  注意 APP_QUOTED 的值里带着引号 —— .env 不会去掉引号，这是与 shell 的重要差异。');

// 关键的第二步：把这些值**只在未设置时**写入 process.env。
// 这条"已有环境变量优先"的规则非常重要：
// 它意味着"在命令行/容器里显式设置的值"能覆盖 .env，符合"具体胜过笼统"的直觉。
// 真实项目里，dotenv 就是按这个规则工作的（除非显式开启 override）。
let writtenCount = 0;
let skippedCount = 0;
for (const [key, value] of Object.entries(parsedEnv)) {
  if (process.env[key] === undefined) {
    // 未设置过 -> 采用 .env 里的值
    process.env[key] = value;
    writtenCount += 1;
  } else {
    // 已存在 -> 保持原值不变，让"显式设置"优先
    skippedCount += 1;
  }
}
console.log(`  写入 process.env：新增 ${writtenCount} 个，跳过（已存在）${skippedCount} 个。`);
console.log('  现在可以正常读取了：APP_NAME =', process.env.APP_NAME);
console.log('  APP_PORT 读出来仍是字符串：', JSON.stringify(process.env.APP_PORT));
console.log('  => 这正是 dotenv 的全部工作：读文本 -> 解析 -> 赋值给 process.env。');

// 收尾：把刚才写进去的键删掉，避免污染后面的演示。
// 真实项目里当然不会这么做（进程用完就退出），但示例是长流程，必须保持状态干净——
// 否则第 6 节读到的 APP_PORT 就会是这里的 4000，而不是预期的默认值 3000。
for (const key of Object.keys(parsedEnv)) {
  delete process.env[key];
}
console.log('  已清理上面写入的', Object.keys(parsedEnv).length, '个演示用环境变量。');

// 官方也提供了 Node 原生的等价能力（Node 20.6+）：
//   node --env-file=.env app.js
// 以及 Node 21.7+ 的 process.loadEnvFile()。它们的作用与 dotenv 相同。
// 本仓库的 package.json 里虽然装了 dotenv 依赖，但本示例刻意不依赖 .env 文件，
// 以保证任何环境下都能直接运行。

// ---------------------------------------------------------------------------
// 5. NODE_ENV 约定
// ---------------------------------------------------------------------------

console.log('--- 5. NODE_ENV 约定 ---');

// NODE_ENV 是社区事实标准（不是 Node 官方强制的），约定三个取值：
//   'development' 开发：详细日志、错误堆栈、热重载、不压缩
//   'production'  生产：只记必要日志、隐藏错误细节、启用缓存
//   'test'        测试：确定性行为、禁用随机、固定时钟
//
// 读取它的标准写法是"带默认值 + 枚举校验"。
const currentEnv = envEnum('NODE_ENV', ['development', 'production', 'test'], 'development');
console.log('  当前 NODE_ENV =', currentEnv);
console.log('  （本示例没有设置它，所以取到了默认值 development）');

// 根据环境决定"调试相关"的行为。
// 注意这里的判断只影响**性能与调试**，不涉及业务规则（陷阱 6）。
function getRuntimeOptions(env) {
  // 用查表代替 if/else 链，新增环境时只加一行。
  const presets = {
    development: { logLevel: 'debug', exposeErrorStack: true, cacheTtlMs: 0 },
    test: { logLevel: 'warn', exposeErrorStack: true, cacheTtlMs: 0 },
    production: { logLevel: 'info', exposeErrorStack: false, cacheTtlMs: 60_000 },
  };
  return presets[env];
}
const runtime = getRuntimeOptions(currentEnv);
console.log('  对应的运行时选项 =', JSON.stringify(runtime));
console.log('  => 生产环境隐藏错误堆栈是为了不泄露内部结构，这是安全考虑而非业务逻辑。');

// 反面教材：用 NODE_ENV 切换业务实现。
// 这样写会让"本地走不到生产逻辑"，缺陷只能到线上才暴露。
//   if (process.env.NODE_ENV === 'production') { useRealPayment() } else { useFakePayment() }
// 正确做法是用一个**专门的**开关，例如 PAYMENT_PROVIDER=mock|stripe|alipay。
console.log('  反例：不要用 NODE_ENV 决定"用真支付还是假支付"，');
console.log('        应该用专门的开关，如 PAYMENT_PROVIDER=mock|stripe|alipay。');

// ---------------------------------------------------------------------------
// 6. 组装一份完整的、经过校验的配置对象
// ---------------------------------------------------------------------------

console.log('--- 6. 组装类型化配置 ---');

/**
 * 从环境变量组装配置。这是每个真实项目的入口文件都会做的一件事：
 * 在程序启动的最开始，把所有配置集中读取、集中校验、集中冻结。
 */
function loadConfig() {
  const config = {
    // 运行环境
    nodeEnv: envEnum('NODE_ENV', ['development', 'production', 'test'], 'development'),

    // 服务器配置：端口用 envInt 保证一定是 [1, 65535] 内的整数
    server: {
      // 注意这里的默认值与注释：环境变量名统一带前缀有助于避免冲突。
      port: envInt('APP_PORT', 3000, { min: 1, max: 65535 }),
      // 只监听本地还是监听所有网卡，用布尔开关控制。
      listenAll: envBool('APP_LISTEN_ALL', false),
      // 请求体大小上限，用整数表达"字节数"。
      maxBodyBytes: envInt('APP_MAX_BODY_BYTES', 1024 * 1024, { min: 1024 }),
    },

    // 数据库：连接串是单个字符串，环境变量做不到"嵌套对象"，只能这样传。
    database: {
      url: envStr('DATABASE_URL', 'postgres://localhost:5432/devdb'),
      poolSize: envInt('DATABASE_POOL_SIZE', 5, { min: 1, max: 100 }),
    },

    // 上游服务列表：用逗号分隔的字符串表达数组
    upstreams: envList('UPSTREAM_HOSTS', []),

    // 日志级别：用枚举限定取值范围
    logLevel: envEnum('LOG_LEVEL', ['debug', 'info', 'warn', 'error'], 'info'),

    // 功能开关：单独一类的配置，习惯上集中放置
    features: {
      newCheckout: envBool('FEATURE_NEW_CHECKOUT', false),
    },
  };

  // 跨字段校验：单字段都合法，不代表组合起来合理。
  // 例如"生产环境不应该连接本地数据库"，这类规则只有拿到整体才能判断。
  if (config.nodeEnv === 'production' && config.database.url.includes('localhost')) {
    console.warn('  [配置警告] 生产环境却连到了 localhost 数据库，请确认 DATABASE_URL。');
  }

  // 冻结配置对象，防止运行期间被意外修改。
  // 必须递归冻结：Object.freeze 只作用于**第一层**，
  // 嵌套的 config.server 仍然可以被改写（这是个很常见的误解）。
  return deepFreeze(config);
}

/**
 * 递归冻结对象及其所有嵌套属性。
 * 对已经冻结过的对象会提前返回，因此天然不会因循环引用而无限递归。
 */
function deepFreeze(value) {
  // 基本类型无需处理，直接返回。
  if (value === null || typeof value !== 'object') return value;
  // 已经冻结说明它的子属性也处理过了（因为我们自底向上地冻结），直接跳过。
  if (Object.isFrozen(value)) return value;

  Object.freeze(value);
  // 遍历自有属性并递归冻结。
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze(value[key]);
  }
  return value;
}

const config = loadConfig();
console.log('  加载到的配置：');
// 逐行打印，避免 util.inspect 的默认深度把嵌套对象显示成 [Object]。
console.log('    nodeEnv            =', config.nodeEnv);
console.log('    server.port        =', config.server.port, '（类型', typeof config.server.port, '）');
console.log('    server.listenAll   =', config.server.listenAll, '（类型', typeof config.server.listenAll, '）');
console.log('    server.maxBodyBytes=', config.server.maxBodyBytes);
console.log('    database.url       =', config.database.url);
console.log('    database.poolSize  =', config.database.poolSize);
console.log('    upstreams          =', JSON.stringify(config.upstreams), '（类型', Array.isArray(config.upstreams) ? 'Array' : typeof config.upstreams, '）');
console.log('    logLevel           =', config.logLevel);
console.log('    features.newCheckout =', config.features.newCheckout);

// 验证深度冻结生效：试图修改**嵌套**属性也会失败。
// 注意：ESM 默认是严格模式，严格模式下对冻结对象赋值会抛 TypeError；
// 非严格模式（如 CommonJS 未加 'use strict'）下则只会静默失败，更隐蔽。
try {
  config.server.port = 9999;
} catch (err) {
  console.log('  修改冻结后的嵌套属性：', err.constructor.name, '-', err.message);
}
console.log('  再次读取 port，仍是原值 =', config.server.port, '（深度冻结生效）');

// 对比一下"浅冻结"会怎样：只冻结第一层时，嵌套对象仍可被改写。
const shallow = Object.freeze({ server: { port: 3000 } });
shallow.server.port = 9999; // 不抛异常，因为 server 这个对象本身没有被冻结
console.log('  浅冻结下嵌套属性被改成了 =', shallow.server.port, '（这就是必须深度冻结的原因）');

// ---------------------------------------------------------------------------
// 7. 配置优先级与密钥保护
// ---------------------------------------------------------------------------

console.log('--- 7. 优先级与密钥保护 ---');

// 一个成熟项目的配置优先级通常是（从高到低）：
//   1) 命令行参数      --port=8080    最具体，临时覆盖用
//   2) 环境变量        APP_PORT=8080   部署环境注入
//   3) .env 文件       APP_PORT=4000   本地开发默认值
//   4) 代码里的默认值  3000            保底
// 这条链的核心思想是"越具体的来源优先级越高"。

// 演示优先级：命令行参数胜过环境变量。
process.env.APP_PORT = '5000';
function resolvePort(cliArg, envKey, fallback) {
  // 显式传了命令行参数就用它（最高优先级）。
  if (cliArg !== undefined) return { port: Number(cliArg), from: '命令行参数' };
  // 否则看环境变量。
  if (process.env[envKey] !== undefined) return { port: envInt(envKey, fallback), from: '环境变量' };
  // 都没有才用代码里的默认值。
  return { port: fallback, from: '代码默认值' };
}
console.log('  只有环境变量时       ->', JSON.stringify(resolvePort(undefined, 'APP_PORT', 3000)));
console.log('  命令行参数也给了 9090 ->', JSON.stringify(resolvePort('9090', 'APP_PORT', 3000)));
delete process.env.APP_PORT;

// 密钥保护：日志里绝不能打印完整密钥。
// 这个辅助函数只保留头尾几个字符，既足够定位"用的是哪把钥匙"，
// 又不会把密钥泄露到日志系统里。
function maskSecret(value) {
  // 空值单独处理，避免打印出 undefined 或 null 引起误判。
  if (!value) return '(未设置)';
  const str = String(value);
  // 太短的直接全部打码，因为保留头尾就等于泄露了全部内容。
  if (str.length <= 8) return '*'.repeat(str.length);
  // 保留前 3 位与后 2 位，中间打码并标明长度。
  return `${str.slice(0, 3)}${'*'.repeat(Math.min(str.length - 5, 12))}${str.slice(-2)} (长度 ${str.length})`;
}
console.log('  打码后的密钥示例：');
console.log('    空值     ->', maskSecret(undefined));
console.log('    短密钥   ->', maskSecret('abc123'));
console.log('    长密钥   ->', maskSecret('xyz012'));
console.log('  => 排查问题时打印这个打码值就够了，永远不要打印原值。');

// 最后一个重要提醒：环境变量会被子进程继承。
// 所以往子进程传配置时，务必显式挑选要传的键，不要把整个 process.env 带过去。
console.log('  提醒：spawn 子进程时 env 是整体替换的（见 10_child_process.js），');
console.log('        传入 { ...process.env } 会把所有密钥一并继承给子进程，请按需挑选。');

console.log('--- 全部演示结束 ---');
