/**
 * ============================================================================
 * 知识点：输入校验 —— 白名单优于黑名单，以及手写一个 zod 风格的 schema 校验器
 * ============================================================================
 *
 * 【所属分类】32_security_and_best_practices —— 安全与最佳实践
 * 【难度等级】进阶
 * 【前置知识】32_security_and_best_practices/01_input_validation.js（本文件为分类首篇，可视为"无"）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    输入校验（input validation）指的是：在数据进入系统的那一刻，检查它"长得对不对"。
 *    它回答三个问题：
 *      (1) 类型对不对？（该是字符串的，是不是传了对象/数组/数字？）
 *      (2) 形状对不对？（必填字段在不在？不该有的字段有没有多出来？）
 *      (3) 取值范围对不对？（长度、数值区间、是否符合某个正则模式？）
 *    校验有两条根本路线：
 *      - 黑名单（blacklist / denylist）：列出"坏的"，见到就拒绝。例如"包含 <script> 就拒绝"。
 *      - 白名单（whitelist / allowlist）：列出"好的"，不在名单里就拒绝。例如"用户名只能匹配 /^[a-zA-Z0-9_]{3,20}$/"。
 *    本文件的核心结论：**永远优先白名单**。黑名单在理论上就无法穷举，白名单则是"定义清楚合法集合"。
 *
 * 2. 为什么需要（真实项目场景）
 *    (a) 所有安全问题（XSS、SQL 注入、命令注入、路径穿越）的入口都是"没校验的输入"。
 *        校验是第一道门，转义/参数化是第二道门，两道都要有（纵深防御）。
 *    (b) 用户输入同时也是"脏数据"来源：前端传了 age: "18" 而不是 18，后端直接参与算术，
 *        就会出现 "18" + 1 === "181" 这种诡异结果，线上排查极痛苦。
 *    (c) 前端校验只是为了体验（快速反馈），**服务端校验才是安全边界**。
 *        攻击者可以完全绕过浏览器，用 curl / Postman 直接打你的 API。
 *        所以：前端校验一遍（体验）+ 服务端再校验一遍（安全），"永远不要信任客户端输入"。
 *    (d) 校验要尽早（fail fast，在边界处）：在 HTTP 路由入口、消息队列消费入口、
 *        命令行参数解析入口就把脏数据挡掉，这样业务代码内部可以假设"数据是干净的"，
 *        省掉满地的 if 判断。
 *
 * 3. 核心语法要点
 *    - 白名单: `/^[a-zA-Z0-9_]{3,20}$/` 这种"全字符锚定"的正则（^ 与 $ 不可省）。
 *    - 类型判断: `typeof`（原始类型）、`Array.isArray`（数组）、`Number.isInteger`（整数），
 *      注意 `typeof null === 'object'` 这个历史坑。
 *    - 数值边界: `Number.isFinite` 排除 NaN / Infinity；用 `>=` `<=` 而不是 `>` `<` 时要想清楚开闭区间。
 *    - 长度限制: 字符串用 `str.length`（注意是 UTF-16 码元数，emoji 会算 2），
 *      数组用 `arr.length`，对象用 `Object.keys(obj).length`。
 *    - 失败要"默认拒绝"（fail closed）：任何异常、任何不认识的情况，都判定为不合法。
 *      绝不要写"如果不符合某条件就放行"这种反向逻辑。
 *    - schema 模式：把"数据长什么样"写成一份可复用的数据结构（schema 对象），
 *      再用一个通用函数去校验。zod / Joi / Yup / ajv 都是这个思路，本文件手写一个精简版。
 *
 * 4. 常见陷阱
 *    - 黑名单被绕过：大小写（<SCRIPT>）、HTML 实体（&#60;script&#62;）、
 *      URL 编码（%3Cscript%3E）、嵌套（<scr<script>ipt>）、Unicode 同形字、空字节（\0）、
 *      新标签新事件（<img onerror>、<svg onload>）……黑名单永远在打补丁。
 *    - 只校验前端：安全上等于没校验。
 *    - 漏掉"多余字段"：用户往 body 里塞 `{"role":"admin"}`，如果直接展开合并进对象，
 *      就成了提权漏洞。所以白名单校验要**只取出声明过的字段**（strip unknown）。
 *    - 用 `==` 做类型校验：`0 == ""`、`null == undefined` 都成立，会被绕过。
 *    - 把校验和业务逻辑混在一起：校验函数应该是纯函数，便于单测和复用。
 *    - 忘记限制长度：不限制长度的字符串 = 内存/存储 DoS 的入口。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 32_security_and_best_practices/01_input_validation.js
 *
 * 【预期输出】
 *   打印黑名单被各种编码绕过 vs 白名单统一拒绝的对比；
 *   再用手写 schema 校验器对 4 组数据做 safeParse，
 *   输出 success 时的规整数据、failure 时的逐字段错误列表，全程退出码 0。
 * ============================================================================
 */

// ============================================================================
// 小节 1：黑名单 vs 白名单 —— 先在直觉上感受差别
// ============================================================================
console.log('--- 1. 黑名单 vs 白名单：直觉对比 ---');

/**
 * 典型的"黑名单"写法：把危险的字符串片段硬编码进去。
 * 这种写法在真实项目里非常常见，也几乎必然被绕过。
 * @param {string} input 待检查的输入
 * @returns {boolean} true 表示"认为是安全的"
 */
function blacklistCheck(input) {
  // 只挡住小写的 <script> 和 javascript: 这两个"最出名"的片段。
  // 注意这里没有做 toLowerCase —— 这是现实中非常常见的"朴素黑名单"写法。
  const BLOCKED = ['<script>', 'javascript:'];
  const text = String(input);
  return !BLOCKED.some((bad) => text.includes(bad));
}

/**
 * 白名单写法：只允许"普通文本"里出现的字符集合。
 * 这里假设场景是"用户昵称"，业务上根本不需要尖括号、引号、百分号等字符。
 * @param {string} input 待检查的输入
 * @returns {boolean} true 表示"合法"
 */
function whitelistCheck(input) {
  // ^ 与 $ 锚定整个字符串；\p{L} 允许任意语言的字母（含中文），\p{N} 允许数字
  // u 标志让 \p{...} 生效（Unicode 属性转义）
  return /^[\p{L}\p{N}_\-. ]{1,32}$/u.test(input);
}

// 攻击者尝试的输入（都只是字符串，本文件不会真的渲染或执行它们）
const attackSamples = [
  { label: '原始小写', value: '<script>alert(1)</script>' },
  { label: '大写绕过', value: '<SCRIPT>alert(1)</SCRIPT>' },
  { label: '嵌套绕过', value: '<scr<script>ipt>alert(1)</scr</script>ipt>' },
  { label: 'HTML 实体', value: '&#60;script&#62;alert(1)&#60;/script&#62;' },
  { label: 'URL 编码', value: '%3Cscript%3Ealert(1)%3C/script%3E' },
  { label: '空字节截断', value: '<scr\u0000ipt>alert(1)</scr\u0000ipt>' },
  { label: '换行/制表符', value: '<scr\nipt>alert(1)</scr\nipt>' },
  { label: '新事件属性', value: '<img src=x onerror=alert(1)>' },
  { label: 'SVG 事件', value: '<svg onload=alert(1)>' },
  { label: '协议绕过', value: 'JaVaScRiPt:alert(1)' },
];

let blacklistMissed = 0;
let whitelistMissed = 0;
for (const { label, value } of attackSamples) {
  const byBlacklist = blacklistCheck(value);
  const byWhitelist = whitelistCheck(value);
  if (byBlacklist) blacklistMissed++;
  if (byWhitelist) whitelistMissed++;
  console.log(
    `  样本[${label}] 黑名单判定=${byBlacklist ? '放行(危险!)' : '拦截'}  ` +
      `白名单判定=${byWhitelist ? '放行' : '拦截(安全)'}`
  );
}
console.log(
  `  统计：共 ${attackSamples.length} 个攻击样本，黑名单漏过 ${blacklistMissed} 个，` +
    `白名单漏过 ${whitelistMissed} 个。`
);
console.log(
  '  结论：黑名单只能追上它"见过"的写法；白名单一个不漏，' +
    '因为它压根不关心"攻击长什么样"，只关心"合法长什么样"。'
);

// ============================================================================
// 小节 2：黑名单为什么永远会漏 —— 归类总结
// ============================================================================
console.log('\n--- 2. 黑名单为什么永远会漏（五类绕过手法） ---');

const bypassCategories = [
  [
    '大小写与混合编码',
    'HTML/SQL/JS 关键字在多数语境下大小写不敏感；再叠加 URL 编码、HTML 实体、Unicode 转义，' +
      '同一个字符有无数种写法，黑名单要穷举所有写法。',
  ],
  [
    '嵌套与拼接',
    '<scr<script>ipt> 这类"过滤器删掉中间部分后反而拼出危险串"的输入，' +
      '说明黑名单的"删除-再检查"流程本身可以被反向利用。',
  ],
  [
    '上下文差异',
    '同一个字符在 HTML 文本、HTML 属性、URL、JS 字符串、CSS 里含义完全不同。' +
      '黑名单若只按一种上下文写，换个位置就失效。',
  ],
  [
    '解析器特性',
    '空字节 \\0、畸形 UTF-8、超长输入、浏览器容错解析（浏览器会"猜"你想写什么），' +
      '都可能导致"过滤器看到的"和"浏览器/数据库看到的"不是同一个东西。',
  ],
  [
    '新漏洞与新标签',
    '今天没被列入黑名单的 API，明天可能被发现是危险的（历史上 <svg onload>、' +
      '各种 on* 事件属性都是后来的事）。黑名单是"永远追在攻击者后面打补丁"。',
  ],
];
for (const [name, reason] of bypassCategories) {
  console.log(`  - ${name}：${reason}`);
}

// ============================================================================
// 小节 3：白名单校验的常规写法 —— 类型、范围、长度、格式
// ============================================================================
console.log('\n--- 3. 白名单校验的常规写法 ---');

/**
 * 校验"用户注册表单"中的单个字段（不含 schema 框架的朴素写法）。
 * @param {string} field 字段名
 * @param {unknown} value 字段值
 * @returns {{ok: boolean, error?: string}}
 */
function validateFieldRaw(field, value) {
  // 【默认拒绝】从这里开始，只有通过所有检查才会 return { ok: true }
  switch (field) {
    case 'username': {
      // 1) 类型必须严格是 string（用 typeof，不要用 == 做宽松比较）
      if (typeof value !== 'string') return { ok: false, error: '必须是字符串' };
      // 2) 长度限制：既防太短（业务要求），也防太长（防内存/存储滥用）
      if (value.length < 3 || value.length > 20) {
        return { ok: false, error: '长度必须为 3~20 个字符' };
      }
      // 3) 格式白名单：只允许字母数字下划线
      if (!/^[A-Za-z0-9_]+$/.test(value)) {
        return { ok: false, error: '只允许字母、数字和下划线' };
      }
      return { ok: true };
    }
    case 'age': {
      if (typeof value !== 'number') return { ok: false, error: '必须是数字类型' };
      // Number.isFinite 同时排除 NaN 与 ±Infinity（NaN 与任何数比较都是 false，很危险）
      if (!Number.isFinite(value)) return { ok: false, error: '必须是有限数字' };
      if (!Number.isInteger(value)) return { ok: false, error: '必须是整数' };
      if (value < 0 || value > 150) return { ok: false, error: '年龄必须在 0~150 之间' };
      return { ok: true };
    }
    case 'email': {
      if (typeof value !== 'string') return { ok: false, error: '必须是字符串' };
      if (value.length > 254) return { ok: false, error: '邮箱过长' }; // RFC 上限
      // 注意：邮箱的"完整正确"正则极其复杂，实践中够用即可，真正的验证是"发确认邮件"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        return { ok: false, error: '邮箱格式不正确' };
      }
      return { ok: true };
    }
    default:
      // 未知字段一律拒绝 —— 这就是白名单思维在字段层面的体现
      return { ok: false, error: `未知字段 ${field}` };
  }
}

const rawCases = [
  ['username', 'alice_01'],
  ['username', 'a'], // 太短
  ['username', 'alice<script>'], // 非法字符
  ['username', 12345], // 类型错
  ['age', 30],
  ['age', '30'], // 字符串数字被严格拒绝
  ['age', NaN], // NaN 陷阱
  ['age', 999],
  ['email', 'alice@example.com'],
  ['email', 'not-an-email'],
  ['role', 'admin'], // 未知字段
];
/**
 * 便于打印的取值描述（JSON.stringify(NaN) 会输出 "null"，容易误导读者）。
 * @param {unknown} v
 * @returns {string}
 */
function showValue(v) {
  if (typeof v === 'number' && Number.isNaN(v)) return 'NaN';
  return JSON.stringify(v);
}

for (const [field, value] of rawCases) {
  const r = validateFieldRaw(field, value);
  console.log(`  ${field}=${showValue(value)} -> ${r.ok ? '通过' : '拒绝: ' + r.error}`);
}

// ============================================================================
// 小节 4：手写一个 zod 风格的 schema 校验器
// ============================================================================
console.log('\n--- 4. 手写 schema 校验器（zod 风格） ---');

/**
 * schema 构造器集合。每个方法返回一个"描述对象"，只描述约束，不含逻辑。
 * 这种"数据描述 + 通用执行器"的分离，就是 zod/Joi 等库的核心设计。
 */
const S = {
  /**
   * 字符串 schema。
   * @param {{min?: number, max?: number, regex?: RegExp, optional?: boolean, default?: string}} [opts]
   */
  string(opts = {}) {
    return { kind: 'string', ...opts };
  },
  /**
   * 数字 schema。
   * @param {{min?: number, max?: number, int?: boolean, optional?: boolean, default?: number}} [opts]
   */
  number(opts = {}) {
    return { kind: 'number', ...opts };
  },
  /**
   * 布尔 schema。
   * @param {{optional?: boolean, default?: boolean}} [opts]
   */
  boolean(opts = {}) {
    return { kind: 'boolean', ...opts };
  },
  /**
   * 对象 schema。shape 描述每个字段，strict 控制"未知键"的处理方式。
   * @param {Record<string, object>} shape 字段定义
   * @param {{strict?: boolean}} [opts] strict 为 true 时遇到未知键报错，否则丢弃（默认丢弃）
   */
  object(shape, opts = {}) {
    return { kind: 'object', shape, strict: opts.strict === true };
  },
};

/**
 * 校验单个值。返回 { value, errors }。
 * 校验通过时 value 是"清洗后"的值（例如应用了 default、丢弃了未知键）。
 * @param {unknown} value 待校验的值
 * @param {object} schema schema 描述对象
 * @param {string} path 当前路径（用于拼出 a.b.c 这样的错误位置）
 * @returns {{value: unknown, errors: string[]}}
 */
function validate(value, schema, path) {
  const errors = [];
  const here = path || '(root)';

  // 先处理 undefined：区分"可选"与"必填"
  if (value === undefined) {
    if (schema.optional) {
      // 可选且给了默认值 -> 用默认值补上
      if (Object.hasOwn(schema, 'default')) {
        return { value: schema.default, errors };
      }
      return { value: undefined, errors };
    }
    errors.push(`${here}: 是必填项（收到了 undefined）`);
    return { value: undefined, errors };
  }

  switch (schema.kind) {
    case 'string': {
      // 【类型检查】typeof 只能识别原始字符串；new String('x') 会被拒绝（这是好事）
      if (typeof value !== 'string') {
        errors.push(`${here}: 期望 string，实际是 ${describeType(value)}`);
        return { value, errors };
      }
      if (schema.min !== undefined && value.length < schema.min) {
        errors.push(`${here}: 长度不能小于 ${schema.min}（当前 ${value.length}）`);
      }
      if (schema.max !== undefined && value.length > schema.max) {
        errors.push(`${here}: 长度不能大于 ${schema.max}（当前 ${value.length}）`);
      }
      if (schema.regex && !schema.regex.test(value)) {
        errors.push(`${here}: 不匹配模式 ${schema.regex}`);
      }
      return { value, errors };
    }
    case 'number': {
      if (typeof value !== 'number') {
        errors.push(`${here}: 期望 number，实际是 ${describeType(value)}`);
        return { value, errors };
      }
      // NaN 是 number 类型但不是有效数字，必须单独排除
      if (!Number.isFinite(value)) {
        errors.push(`${here}: 必须是有限数字（收到 ${value}）`);
        return { value, errors };
      }
      if (schema.int && !Number.isInteger(value)) {
        errors.push(`${here}: 必须是整数（收到 ${value}）`);
      }
      if (schema.min !== undefined && value < schema.min) {
        errors.push(`${here}: 不能小于 ${schema.min}（收到 ${value}）`);
      }
      if (schema.max !== undefined && value > schema.max) {
        errors.push(`${here}: 不能大于 ${schema.max}（收到 ${value}）`);
      }
      return { value, errors };
    }
    case 'boolean': {
      if (typeof value !== 'boolean') {
        errors.push(`${here}: 期望 boolean，实际是 ${describeType(value)}`);
        return { value, errors };
      }
      return { value, errors };
    }
    case 'object': {
      // 数组是 object 的子类型，必须显式排除，否则数组会"通过"对象校验
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        errors.push(`${here}: 期望普通对象，实际是 ${describeType(value)}`);
        return { value, errors };
      }
      const out = {};
      const shapeKeys = Object.keys(schema.shape);
      // 遍历 schema 声明过的字段 —— 这就是"白名单"：只认识声明过的键
      for (const key of shapeKeys) {
        const child = validate(value[key], schema.shape[key], `${path ? path + '.' : ''}${key}`);
        errors.push(...child.errors);
        if (child.value !== undefined) out[key] = child.value;
      }
      // 处理 schema 未声明的键
      for (const key of Object.keys(value)) {
        if (shapeKeys.includes(key)) continue;
        if (schema.strict) {
          errors.push(`${here}: 存在未知字段 "${key}"（strict 模式拒绝）`);
        }
        // 非 strict 模式下静默丢弃：这挡住了"偷偷塞 role: admin"这类越权参数
      }
      // 原型污染防线：绝不把 __proto__ 这类键拷进新对象（详见 04 篇）
      return { value: out, errors };
    }
    default:
      errors.push(`${here}: 未知的 schema 类型 ${schema.kind}`);
      return { value, errors };
  }
}

/**
 * 把值转成便于阅读的类型名（typeof null 的老坑在这里被修正）。
 * @param {unknown} v
 * @returns {string}
 */
function describeType(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

/**
 * zod 风格的 safeParse：永远不抛异常，返回 { success, data } 或 { success, errors }。
 * 之所以叫 safe，是相对于"校验失败就 throw"的 parse 而言 —— 不抛异常更容易在
 * 边界层统一处理（不用写 try/catch，也不会意外中断流程）。
 * @param {object} schema
 * @param {unknown} input
 * @returns {{success: true, data: unknown} | {success: false, errors: string[]}}
 */
function safeParse(schema, input) {
  const { value, errors } = validate(input, schema, '');
  if (errors.length > 0) return { success: false, errors };
  return { success: true, data: value };
}

// 定义一份"用户资料"schema，包含嵌套对象、可选字段、默认值、正则、范围
const userProfileSchema = S.object({
  // 用户名：3~20 位，只允许字母数字下划线
  username: S.string({ min: 3, max: 20, regex: /^[A-Za-z0-9_]+$/ }),
  // 年龄：整数，0~150
  age: S.number({ int: true, min: 0, max: 150 }),
  // 昵称：可选，最多 32 字
  nickname: S.string({ max: 32, optional: true }),
  // 是否订阅：可选，默认 false（可选 + 默认值是配置类字段的常见组合）
  subscribed: S.boolean({ optional: true, default: false }),
  // 嵌套对象：地址
  address: S.object({
    city: S.string({ min: 1, max: 50 }),
    // 邮编：6 位数字
    zip: S.string({ regex: /^\d{6}$/ }),
    // 备注可选
    note: S.string({ max: 100, optional: true }),
  }),
});

console.log('  已定义 schema：username / age / nickname? / subscribed?(默认 false) / address{city, zip, note?}');

// ============================================================================
// 小节 5：safeParse 演示 —— 成功、失败、以及"多余字段"被丢弃
// ============================================================================
console.log('\n--- 5. safeParse 实测：成功 / 失败 / 被丢弃的越权字段 ---');

const parseCases = [
  {
    title: '完全合法（可选字段缺省，默认值生效）',
    input: {
      username: 'alice_01',
      age: 30,
      address: { city: '杭州', zip: '310000' },
    },
  },
  {
    title: '多个字段同时非法（一次性报出全部错误）',
    input: {
      username: 'a', // 太短
      age: 3.14, // 非整数
      address: { city: '', zip: 'abc' }, // 空城市 + 邮编格式错
    },
  },
  {
    title: '嵌套字段缺失 + 类型完全错乱',
    input: {
      username: 42, // 类型错
      age: '30', // 字符串数字被拒绝
      address: [1, 2, 3], // 用数组冒充对象
    },
  },
  {
    title: '攻击者偷偷塞入越权字段 role / address.extra（应被静默丢弃）',
    input: {
      username: 'bob',
      age: 25,
      role: 'admin', // 不在 schema 里
      address: { city: '北京', zip: '100000', extra: 'x' }, // 嵌套未知字段
    },
  },
];

parseCases.forEach(({ title, input }, i) => {
  console.log(`\n  [用例 ${i + 1}] ${title}`);
  const result = safeParse(userProfileSchema, input);
  if (result.success) {
    console.log(`    success = true`);
    console.log(`    data    = ${JSON.stringify(result.data)}`);
    // 重点观察：role 消失了 —— 白名单校验天然具备"参数收敛"能力
    console.log(`    含 role 字段？${Object.hasOwn(result.data, 'role')}`);
  } else {
    console.log(`    success = false，共 ${result.errors.length} 条错误：`);
    result.errors.forEach((e) => console.log(`      - ${e}`));
  }
});

// ============================================================================
// 小节 6：默认拒绝（fail closed）—— 校验器的兜底设计
// ============================================================================
console.log('\n--- 6. 默认拒绝：fail closed 而不是 fail open ---');

/**
 * 反面示范：fail open（出错就放行）。看起来很"健壮"，实则是最危险的写法。
 * 本函数只做演示，不会在校验链路里使用。
 * @param {string} raw
 * @returns {boolean}
 */
function failOpenCheck(raw) {
  try {
    const parsed = JSON.parse(raw);
    // 注意：这里只是演示逻辑，不涉及任何危险操作
    return typeof parsed.username === 'string';
  } catch {
    // 解析失败？那就……放行吧（这就是漏洞）
    return true;
  }
}

/**
 * 正面示范：fail closed（任何异常都视为不合法）。
 * @param {string} raw
 * @returns {{ok: boolean, reason?: string}}
 */
function failClosedCheck(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') {
      return { ok: false, reason: '解析结果不是对象' };
    }
    const r = safeParse(userProfileSchema, parsed);
    return r.success ? { ok: true } : { ok: false, reason: r.errors.join('; ') };
  } catch (err) {
    // 解析异常 = 数据不合法，直接拒绝，绝不"放行兜底"
    return { ok: false, reason: `解析失败：${err.message}` };
  }
}

const failCases = ['这不是 JSON', '{"username":"ok_user","age":20,"address":{"city":"上海","zip":"200000"}}'];
for (const raw of failCases) {
  console.log(`  输入=${raw}`);
  console.log(`    fail open  -> ${failOpenCheck(raw) ? '放行' : '拒绝'}`);
  const closed = failClosedCheck(raw);
  console.log(`    fail closed-> ${closed.ok ? '放行' : '拒绝: ' + closed.reason}`);
}

// ============================================================================
// 小节 7：永远不要信任客户端 —— 服务端必须重复校验
// ============================================================================
console.log('\n--- 7. 客户端校验只是体验，服务端校验才是安全边界 ---');

/**
 * 模拟"服务端"的注册处理函数。可以看到：即使前端已经校验过，
 * 服务端依然把同样的 schema 再跑一遍。
 * @param {unknown} body 请求体（完全不可信）
 * @returns {{status: number, body: object}}
 */
function handleRegister(body) {
  // 第 1 步：边界处校验，尽早失败
  const parsed = safeParse(userProfileSchema, body);
  if (!parsed.success) {
    // 对外只返回笼统的字段错误（不泄漏内部细节，详见 08 篇）
    return { status: 400, body: { message: '参数不合法', fields: parsed.errors } };
  }
  // 第 2 步：从这里开始，业务代码可以认为 data 是干净的
  const user = { id: 'u_1001', ...parsed.data };
  return { status: 201, body: { message: '注册成功', user } };
}

// 攻击者绕过浏览器，直接构造请求体
const attackerPayload = {
  username: 'evil',
  age: 20,
  address: { city: '深圳', zip: '518000' },
  role: 'admin', // 试图提权
  isVerified: true, // 试图伪造
};
const response = handleRegister(attackerPayload);
console.log(`  攻击者请求体: ${JSON.stringify(attackerPayload)}`);
console.log(`  服务端响应状态: ${response.status}`);
console.log(`  服务端返回用户: ${JSON.stringify(response.body.user)}`);
console.log(
  `  越权字段是否被带入: role=${JSON.stringify(response.body.user.role)} ` +
    `isVerified=${JSON.stringify(response.body.user.isVerified)}`
);
console.log(
  '  要点：前端校验（体验）与服务端校验（安全）必须各做一遍；' +
    '数据库写入前、命令执行前也都应假设"上游可能被绕过"。'
);

// ============================================================================
// 小节 8：小结
// ============================================================================
console.log('\n--- 8. 小结 ---');
console.log('  1) 白名单定义"合法集合"，黑名单只能追着已知攻击打补丁 —— 永远选白名单。');
console.log('  2) 校验三要素：类型（typeof / Number.isFinite）、形状（必填/未知字段）、范围（长度/数值/正则）。');
console.log('  3) 默认拒绝（fail closed）：异常与未知情况一律判为不合法；绝不写"出错就放行"。');
console.log('  4) schema 化 + safeParse：让校验从"散落的 if"变成"可复用、可测试、不抛异常"的一份声明。');
console.log('  5) 校验要尽早（边界处）且服务端必做：永远不要信任客户端输入。');
console.log('  6) 校验不是万能：它和转义（02 篇）、参数化（03 篇）是叠加关系，不是替代关系。');
