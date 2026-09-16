/**
 * ============================================================================
 * 知识点：zod —— schema 定义、parse/safeParse、类型推断、嵌套对象、自定义校验、错误格式化
 * ============================================================================
 *
 * 【所属分类】29_npm_libraries —— 常用第三方库
 * 【难度等级】进阶
 * 【前置知识】09_objects、17_错误处理相关章节
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    zod 是一个"以 TypeScript 优先"的运行时校验库。它的核心思想是：
 *    **schema 即类型**。你写一份 schema，它同时提供两种能力：
 *      (a) 运行时校验：parse() 检查数据是否符合结构，不符合就抛错；
 *      (b) 编译期类型：z.infer<typeof Schema> 自动推导出 TypeScript 类型。
 *    这样"校验规则"与"类型定义"就不再是两份需要手动同步的东西 —— 改一处即可。
 *
 *    本仓库是纯 JavaScript 示例，所以类型推断部分只能"讲"不能"演示"，
 *    但校验能力是纯 JS 的，可以完整运行。
 *
 * 2. 为什么需要（真实项目里怎么用）
 *    JavaScript 是动态类型语言，最大的风险之一是"外部数据不可信"：
 *      - 后端接口字段改了名（userName -> username），前端静默拿到 undefined；
 *      - 配置文件的数字写成了字符串（port: "3000" 而不是 3000）；
 *      - 环境变量永远是字符串，PORT=abc 直到连数据库时才炸；
 *      - 用户提交的表单数据没校验就入库，导致脏数据。
 *    zod 让"边界处校验"变成一件低成本的事：
 *      - API 响应解析：const user = UserSchema.parse(res.data)
 *      - 环境变量：const env = EnvSchema.parse(process.env)
 *      - 表单校验：const result = FormSchema.safeParse(formValues)
 *      - 命令行参数、WebSocket 消息、JSON 配置文件、localStorage 读取……
 *    原则：**在系统的边界上校验，内部就当作类型是可信的**。
 *
 * 3. 核心语法要点
 *    import { z } from 'zod';
 *    z.string() / z.number() / z.boolean() / z.date() / z.unknown() / z.any()
 *    z.object({ ... }) / z.array(schema) / z.record(k, v) / z.tuple([...])
 *    .min() .max() .length() .email() .url() .regex() .int() .positive()
 *    .optional() .nullable() .default(v) .nullish()
 *    z.enum(['a','b']) / z.union([...]) / z.discriminatedUnion('type', [...])
 *    z.literal('x') / z.nativeEnum(SomeEnum)
 *    .refine(fn, message)       自定义校验（不改变类型）
 *    .transform(fn)             校验后转换（会改变类型）
 *    .superRefine((val, ctx) => { ctx.addIssue({...}) })  多字段联合校验
 *    .strict()                  禁止多余字段
 *    schema.parse(data)          失败时抛 ZodError
 *    schema.safeParse(data)      失败时返回 { success: false, error }
 *    error.errors                问题列表（每个有 path / message / code）
 *    error.flatten()             按字段分组 { formErrors, fieldErrors }
 *    z.infer<typeof Schema>      TypeScript 类型推断
 *
 * 4. 常见陷阱
 *    - parse 会抛错，在"用户输入"这种可预期的场景里应该用 safeParse，
 *      否则要用 try/catch 包住，很容易忘记。
 *    - 对象默认会"剥掉"多余字段（strip 行为）。想保留用 .passthrough()，
 *      想报错用 .strict()。默认行为常让新人误以为校验没生效。
 *    - optional() 与 default() 的区别：optional 允许 undefined 且不填默认值；
 *      default 在 undefined 时会填入默认值（输出里一定有值）。
 *    - z.number() 不接受数字字符串（"3000" 会失败）。环境变量场景要用
 *      z.coerce.number() 强制转换 —— 这是最常见的坑。
 *    - refine 不改变类型，transform 改变类型；两者串联时顺序很重要
 *      （先 refine 后 transform，还是反过来，行为不同）。
 *    - 校验失败时不要直接把 error.errors 暴露给用户：
 *      它包含内部结构信息（path/code），应该映射成用户能读懂的消息。
 *    - schema 定义要放在模块顶层而不是函数内部，否则每次调用都会重建，
 *      白白损失性能（zod 的 schema 是可复用的）。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 29_npm_libraries/05_zod_validation.js
 *
 * 【预期输出】
 *   演示基础类型、嵌套对象、数组、枚举、自定义校验、转换、
 *   以及 safeParse 的错误格式化输出。退出码 0。
 * ============================================================================
 */

import { z } from 'zod';
import assert from 'node:assert/strict';

console.log('--- 0. 基础类型校验 ---');

/** 把 safeParse 的结果打印成可读的一行 */
function describeResult(label, result) {
  if (result.success) {
    console.log(`  ✔ ${label} -> 通过：${JSON.stringify(result.data)}`);
  } else {
    // 失败时每个 issue 都带 path（出错字段的路径）和 message
    const issues = result.error.errors.map((e) => `${e.path.join('.') || '(根)'}: ${e.message}`);
    console.log(`  ✖ ${label} -> 失败：${issues.join('；')}`);
  }
}

const nameSchema = z.string().min(2, '名字至少 2 个字符').max(20, '名字最多 20 个字符');
describeResult('nameSchema.parse("Alice")', nameSchema.safeParse('Alice'));
describeResult('nameSchema.safeParse("A")', nameSchema.safeParse('A'));
describeResult('nameSchema.safeParse(123)', nameSchema.safeParse(123));

const ageSchema = z.number().int('年龄必须是整数').min(0, '年龄不能为负').max(150, '年龄不合理');
describeResult('ageSchema.safeParse(30)', ageSchema.safeParse(30));
describeResult('ageSchema.safeParse(30.5)', ageSchema.safeParse(30.5));
describeResult('ageSchema.safeParse(-1)', ageSchema.safeParse(-1));
describeResult('ageSchema.safeParse("30")', ageSchema.safeParse('30'));
console.log('  注意最后两条：zod 不会做隐式类型转换，"30" 是字符串，直接失败。');
console.log('  环境变量场景必须用 z.coerce.number()（见第 7 节）。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 1. 常用字符串格式校验 ---');

const contactSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  website: z.string().url('必须是合法的 URL').optional(),
  phone: z.string().regex(/^1[3-9]\d{9}$/, '手机号格式不正确'),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
});

describeResult(
  '合法联系方式',
  contactSchema.safeParse({
    email: 'alice@example.com',
    website: 'https://example.com',
    phone: '13800138000',
    birthday: '1990-01-01',
  }),
);
describeResult(
  '非法联系方式',
  contactSchema.safeParse({
    email: 'not-an-email',
    website: 'not-a-url',
    phone: '12345',
    birthday: '1990/01/01',
  }),
);
console.log('  一次调用就能拿到全部字段的校验结果 —— 这是"对象级校验"相比逐个字段 if 判断的优势。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 2. 嵌套对象与数组 ---');

// 真实场景：一个订单包含用户信息、多个商品、以及可选的优惠券
const AddressSchema = z.object({
  province: z.string().min(1, '省份必填'),
  city: z.string().min(1, '城市必填'),
  detail: z.string().min(1, '详细地址必填'),
  zipCode: z.string().regex(/^\d{6}$/, '邮编应为 6 位数字').optional(),
});

const OrderItemSchema = z.object({
  sku: z.string().min(1, 'SKU 必填'),
  name: z.string().min(1, '商品名必填'),
  price: z.number().positive('价格必须大于 0'),
  qty: z.number().int('数量必须是整数').positive('数量必须大于 0'),
});

const OrderSchema = z.object({
  orderNo: z.string().regex(/^ORD-\d{8}$/, '订单号格式应为 ORD-12345678'),
  // 嵌套对象：可以递归嵌套任意层
  address: AddressSchema,
  // 数组：z.array(元素 schema)，还可以加 .min(1) 要求非空
  items: z.array(OrderItemSchema).min(1, '订单至少要有 1 件商品'),
  // 可选字段
  remark: z.string().max(200, '备注最多 200 字').optional(),
  // 带默认值的字段：输入 undefined 时会填上默认值
  channel: z.enum(['app', 'web', 'mini-program']).default('web'),
});

const validOrder = {
  orderNo: 'ORD-20260916',
  address: { province: '浙江省', city: '杭州市', detail: '西湖区某某路 1 号', zipCode: '310000' },
  items: [
    { sku: 'SKU-001', name: '键盘', price: 299, qty: 1 },
    { sku: 'SKU-002', name: '鼠标', price: 99.5, qty: 2 },
  ],
  // 注意：没有传 channel，会使用默认值
};

const orderResult = OrderSchema.safeParse(validOrder);
describeResult('合法订单', orderResult);
console.log(`  channel 未传时自动填入默认值 -> ${orderResult.data.channel}`);

// 深层嵌套错误的定位能力：path 会精确指出是第几个商品的哪个字段出错
const invalidOrder = {
  orderNo: 'BAD-ORDER',
  address: { province: '浙江省', city: '', detail: '某路' },
  items: [
    { sku: 'SKU-001', name: '键盘', price: 299, qty: 1 },
    { sku: '', name: '鼠标', price: -10, qty: 0 },
  ],
};
const invalidResult = OrderSchema.safeParse(invalidOrder);
describeResult('多层嵌套的错误订单', invalidResult);
console.log('  注意 path 的写法：items.1.price 表示"第 2 个商品的 price 字段" —— ');
console.log('  这种精确定位让前端可以直接把错误标在对应表单项上。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 3. 联合类型与可辨识联合 ---');

// 场景：不同支付方式的字段完全不同
const PaymentSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('credit-card'),
    cardNumber: z.string().regex(/^\d{16}$/, '卡号应为 16 位数字'),
    cvv: z.string().regex(/^\d{3}$/, 'CVV 应为 3 位数字'),
  }),
  z.object({
    method: z.literal('alipay'),
    alipayAccount: z.string().email('支付宝账号应为邮箱'),
  }),
  z.object({
    method: z.literal('cash'),
    // 现金支付不需要额外字段
  }),
]);

describeResult('信用卡支付', PaymentSchema.safeParse({ method: 'credit-card', cardNumber: '1234567812345678', cvv: '123' }));
describeResult('支付宝支付', PaymentSchema.safeParse({ method: 'alipay', alipayAccount: 'a@b.com' }));
describeResult('信用卡支付但缺 CVV', PaymentSchema.safeParse({ method: 'credit-card', cardNumber: '1234567812345678' }));
describeResult('未知支付方式', PaymentSchema.safeParse({ method: 'bitcoin', address: 'xxx' }));
console.log('  discriminatedUnion 比 union 更好用：它根据鉴别字段（method）只校验对应的那个分支，');
console.log('  错误信息也更准确，并且支持 TypeScript 的穷尽性检查。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 4. 自定义校验：refine 与 superRefine ---');

// refine：单字段或整体校验，不改变类型
const passwordSchema = z
  .string()
  .min(8, '密码至少 8 位')
  .refine((pwd) => /[A-Z]/.test(pwd), '密码必须包含至少一个大写字母')
  .refine((pwd) => /\d/.test(pwd), '密码必须包含至少一个数字');

describeResult('密码 "abc"', passwordSchema.safeParse('abc'));
describeResult('密码 "abcdefgh"', passwordSchema.safeParse('abcdefgh'));
describeResult('密码 "Abcdefg1"', passwordSchema.safeParse('Abcdefg1'));
console.log('  多个 refine 会串联执行，且可以给出各自的错误消息（用户一次只看到一个，逐个修）。');
console.log('');

// superRefine：跨字段校验，可以一次添加多个 issue
const registerSchema = z
  .object({
    username: z.string().min(3, '用户名至少 3 位'),
    password: z.string().min(8, '密码至少 8 位'),
    confirmPassword: z.string(),
    age: z.number().int().min(0),
  })
  // superRefine 能访问整个对象，因此可以做"两次密码是否一致"这类跨字段校验
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      // 把错误挂在 confirmPassword 字段上，前端就能把这个错误标在对应输入框
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: '两次输入的密码不一致',
      });
    }
    if (data.age < 18) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['age'],
        message: '注册需要年满 18 周岁',
      });
    }
  });

describeResult(
  '密码不一致 + 未成年',
  registerSchema.safeParse({
    username: 'alice',
    password: 'Abcdefg1',
    confirmPassword: 'Abcdefg2',
    age: 16,
  }),
);
describeResult(
  '完全合法',
  registerSchema.safeParse({
    username: 'alice',
    password: 'Abcdefg1',
    confirmPassword: 'Abcdefg1',
    age: 20,
  }),
);
console.log('  一次校验就能收集到全部问题，而不是"改一个再报一个" —— 用户体验的明显差别。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 5. transform：校验后转换数据 ---');

// 典型的"接口数据 -> 前端模型"转换：字段改名、字符串转日期、金额分转元
const ApiUserSchema = z
  .object({
    user_name: z.string(), // 后端下划线命名
    created_at: z.string().datetime({ offset: true }).or(z.string()), // ISO 字符串
    balance_cents: z.number().int().nonnegative(), // 后端用"分"
    tags: z.array(z.string()).default([]),
  })
  .transform((raw) => ({
    // 转成前端习惯的驼峰命名与直观单位
    userName: raw.user_name,
    createdAt: new Date(raw.created_at),
    balanceYuan: raw.balance_cents / 100,
    tags: raw.tags,
  }));

const apiRaw = {
  user_name: 'Alice',
  created_at: '2026-09-16T10:00:00.000Z',
  balance_cents: 123456,
};
const transformed = ApiUserSchema.parse(apiRaw);
console.log('  原始数据：', JSON.stringify(apiRaw));
console.log('  转换结果：');
console.log(`    userName    = ${transformed.userName}`);
console.log(`    createdAt   = ${transformed.createdAt.toISOString()}（已是 Date 对象：${transformed.createdAt instanceof Date}）`);
console.log(`    balanceYuan = ${transformed.balanceYuan}（123456 分 -> 1234.56 元）`);
console.log('  transform 是"校验 + 数据整形"一步到位，避免在校验之后再写一堆 map 代码。');

// coerce：强制类型转换。环境变量场景的救命稻草
const EnvSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEBUG: z.coerce.boolean().default(false),
  DATABASE_URL: z.string().url(),
});

const envResult = EnvSchema.safeParse({
  PORT: '3000', // 环境变量永远是字符串！
  NODE_ENV: 'production',
  DEBUG: 'true',
  DATABASE_URL: 'postgres://localhost:5432/app',
});
console.log('');
console.log('  z.coerce.number() 把字符串 "3000" 转成了数字：');
console.log(`    PORT = ${envResult.data.PORT}（类型：${typeof envResult.data.PORT}）`);
console.log(`    DEBUG = ${envResult.data.DEBUG}（"true" 被转成布尔 true）`);
console.log(`    NODE_ENV = ${envResult.data.NODE_ENV}`);
console.log('  这是启动时校验环境变量的标准做法：配置错了立刻崩，而不是等到运行时才发现。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 6. 错误格式化：三种输出形态 ---');

const badInput = {
  email: 'bad',
  phone: '123',
  birthday: '1990/01/01',
  extraField: '这个字段 schema 里没有',
};

const badResult = contactSchema.safeParse(badInput);
console.log('  原始错误列表（error.errors）：');
for (const issue of badResult.error.errors) {
  console.log(`    path=${JSON.stringify(issue.path)} code=${issue.code} message="${issue.message}"`);
}

// 形态一：flatten() —— 按"表单字段 / 整体错误"分组，最适合渲染到表单
const flattened = badResult.error.flatten();
console.log('');
console.log('  flatten() 的结果（最常用于表单渲染）：');
console.log(`    fieldErrors = ${JSON.stringify(flattened.fieldErrors)}`);
console.log(`    formErrors  = ${JSON.stringify(flattened.formErrors)}`);

// 形态二：format() —— 嵌套结构，适合深层嵌套的表单
const formatted = badResult.error.format();
console.log('');
console.log('  format() 的结果（嵌套结构，键与 schema 对应）：');
console.log(`    email = ${JSON.stringify(formatted.email)}`);
console.log(`    _errors = ${JSON.stringify(formatted._errors)}`);

// 形态三：转成 { 字段: 第一条消息 } 的简单映射 —— 真实项目里用得最多
/**
 * 把 ZodError 压成 { 字段路径: 消息 } 的扁平映射，便于直接绑定到表单。
 * @param {z.ZodError} error
 */
function toFieldMessages(error) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const issue of error.errors) {
    const key = issue.path.join('.') || '_form';
    // 同一字段有多条错误时保留第一条（用户一次修一个更友好）
    if (map[key] === undefined) map[key] = issue.message;
  }
  return map;
}

console.log('');
console.log('  转成 {字段: 消息} 映射（实际项目最常用）：');
console.log('   ', JSON.stringify(toFieldMessages(badResult.error), null, 2).replace(/\n/g, '\n    '));
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 7. 对象字段策略：strip / passthrough / strict ---');

// 默认行为是 strip：多余字段会被静默丢弃
const stripped = contactSchema.parse({
  email: 'a@b.com',
  phone: '13800138000',
  birthday: '1990-01-01',
  extra: '多余字段',
});
console.log(`  默认（strip）：多余字段被丢弃 -> ${JSON.stringify(stripped)}`);

// passthrough：保留多余字段
const passed = contactSchema.passthrough().parse({
  email: 'a@b.com',
  phone: '13800138000',
  birthday: '1990-01-01',
  extra: '多余字段',
});
console.log(`  passthrough()：保留多余字段 -> ${JSON.stringify(passed)}`);

// strict：多余字段直接报错
const strictResult = contactSchema.strict().safeParse({
  email: 'a@b.com',
  phone: '13800138000',
  birthday: '1990-01-01',
  extra: '多余字段',
});
describeResult('strict() 遇到多余字段', strictResult);
console.log('  选型建议：校验"自己完全掌控的数据"（内部模块间）用默认 strip；');
console.log('            校验"用户提交的数据"（表单、API 入参）用 strict，防止意外字段混入。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 8. 真实项目场景：接口响应校验 ---');

/** 后端接口的响应 schema */
const ApiResponseSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z
    .object({
      users: z.array(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(1),
          email: z.string().email(),
        }),
      ),
      page: z.number().int().min(1),
      total: z.number().int().nonnegative(),
    })
    .nullable(), // 出错时 data 可能是 null
});

/**
 * 安全地解析接口响应。这是真实项目网络层里的标准写法。
 * @param {unknown} raw 原始响应
 */
function parseApiResponse(raw) {
  const result = ApiResponseSchema.safeParse(raw);
  if (!result.success) {
    // 关键点：不要直接把 zod 的错误抛给用户 —— 记录日志、返回友好错误
    return {
      ok: false,
      // 把技术细节写进日志，便于排查"后端改了字段名"
      log: `接口响应结构不符合预期：${result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')}`,
      message: '服务返回数据异常，请稍后重试',
    };
  }
  return { ok: true, payload: result.data };
}

const goodResponse = {
  code: 0,
  message: 'ok',
  data: {
    users: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ],
    page: 1,
    total: 2,
  },
};
// 后端悄悄把 id 改成了字符串，前端会立刻发现
const badResponse = {
  code: 0,
  message: 'ok',
  data: {
    users: [{ id: '1', name: 'Alice', email: 'alice@example.com' }],
    page: 1,
    total: 1,
  },
};

const good = parseApiResponse(goodResponse);
console.log(`  正常响应：ok=${good.ok}，解析出 ${good.payload.data.users.length} 个用户`);
const bad = parseApiResponse(badResponse);
console.log(`  字段类型变化：ok=${bad.ok}`);
console.log(`    日志（给开发看）：${bad.log}`);
console.log(`    提示（给用户看）：${bad.message}`);
console.log('  这就是"边界校验"的价值：把静默的 undefined 变成明确的报错。');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 9. 没有 TypeScript 时，类型推断意味着什么 ---');
console.log('  在 TypeScript 项目里，zod 的最大卖点是这一行：');
console.log('    type User = z.infer<typeof UserSchema>;');
console.log('  它会自动推出 { id: number; name: string; email: string }，');
console.log('  改 schema 就等于改类型，永远不会不一致。');
console.log('');
console.log('  在本仓库的纯 JS 环境下，我们能拿到的等价信息是"运行时的结构描述"。');
console.log('  下面用一段代码把 schema 的"形状"打印出来，帮助你理解 infer 会推出什么：');
console.log('    OrderSchema 的字段：', JSON.stringify(Object.keys(OrderSchema.shape)));
console.log('    OrderSchema.items 的元素字段：', JSON.stringify(Object.keys(OrderSchema.shape.items.element.shape)));
console.log('    OrderSchema.address 的字段：', JSON.stringify(Object.keys(OrderSchema.shape.address.shape)));
console.log('  （真实的 z.infer 是编译期的，不会产生运行时开销。）');
console.log('');

// ---------------------------------------------------------------------------
console.log('--- 10. zod 的替代方案 ---');
console.log('  - Joi：老牌校验库，功能全但体积大、TypeScript 支持较弱；');
console.log('  - Yup：表单场景流行（Formik 默认搭档），但类型推断不如 zod 精确；');
console.log('  - ajv：基于 JSON Schema 标准，速度最快，适合"schema 由外部提供"的场景；');
console.log('  - valibot / arktype：更轻量或更类型原生的新选择。');
console.log('  选择建议：项目已经是 TypeScript 且希望类型与校验同源 -> zod；');
console.log('            需要校验 JSON Schema（如 OpenAPI）-> ajv；');
console.log('            追求极致包体积 -> valibot。');

// ---------------------------------------------------------------------------
// 自测断言
// ---------------------------------------------------------------------------
console.log('');
console.log('--- 11. 自测断言 ---');

assert.strictEqual(nameSchema.safeParse('Alice').success, true);
assert.strictEqual(nameSchema.safeParse('A').success, false);
assert.strictEqual(ageSchema.safeParse('30').success, false, 'zod 不做隐式类型转换');
assert.strictEqual(contactSchema.safeParse({ email: 'a@b.com', phone: '13800138000', birthday: '1990-01-01' }).success, true);
assert.strictEqual(orderResult.success, true);
assert.strictEqual(orderResult.data.channel, 'web', '缺省字段应填默认值');
assert.strictEqual(invalidResult.success, false);
// 校验错误路径能精确定位到嵌套数组元素
assert.ok(
  invalidResult.error.errors.some((e) => e.path.join('.') === 'items.1.qty'),
  '应能定位到 items[1].qty',
);
assert.strictEqual(PaymentSchema.safeParse({ method: 'alipay', alipayAccount: 'a@b.com' }).success, true);
assert.strictEqual(PaymentSchema.safeParse({ method: 'bitcoin' }).success, false);
assert.strictEqual(passwordSchema.safeParse('Abcdefg1').success, true);
assert.strictEqual(passwordSchema.safeParse('abcdefg1').success, false);
assert.strictEqual(registerSchema.safeParse({ username: 'alice', password: 'Abcdefg1', confirmPassword: 'x', age: 20 }).success, false);
assert.strictEqual(transformed.balanceYuan, 1234.56);
assert.strictEqual(typeof envResult.data.PORT, 'number');
assert.strictEqual(envResult.data.DEBUG, true);
assert.strictEqual(badResult.error.errors.length >= 3, true);
assert.strictEqual(toFieldMessages(badResult.error).email, '邮箱格式不正确');
assert.strictEqual(stripped.extra, undefined, '默认 strip 行为应丢弃多余字段');
assert.strictEqual(passed.extra, '多余字段', 'passthrough 应保留多余字段');
assert.strictEqual(strictResult.success, false, 'strict 应对多余字段报错');
assert.strictEqual(good.ok, true);
assert.strictEqual(bad.ok, false);
console.log('  全部断言通过。');
console.log('');
console.log('演示结束。');
