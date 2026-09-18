/**
 * ============================================================================
 * 知识点：适配器模式 —— 把不兼容的第三方接口统一成自己的接口
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/08_decorator.js、14_classes（类的语法）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    适配器（Adapter）把一个类的接口转换成客户端期望的另一个接口。
 *    现实类比就是电源转换插头：墙上的插座是"已有的接口"，你的笔记本是"客户端"，
 *    中间那个转换头就是适配器 —— 它不改变电，只改变"形状"。
 *    代码里的公式是：
 *        class XxxAdapter { constructor(adaptee) { this.adaptee = adaptee; }
 *                            request(...) { return this.adaptee.someOtherMethod(...); } }
 *    适配器**不改被适配者**（第三方库你也改不了），只在外面包一层翻译。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 更换第三方 SDK：从旧的日志库换到新的，业务代码不想全改。
 *    - 多供应商接入：微信支付、支付宝、银联的参数与返回格式各不相同，
 *      但订单服务只想调 `pay(order)`。
 *    - 兼容老代码：老模块返回的字段名是 `user_name`，新代码期望 `userName`。
 *    - 数据源适配：本地存储、远程 API、内存 Mock 三者接口不同，
 *      但上层业务希望用同一套 CRUD 调用（这也是测试替身的基础）。
 *    - 浏览器/Node 兼容：用适配器把 fs 与 localStorage 统一成同一个"存储"接口。
 *
 * 3. 核心语法要点
 *    - 适配器实现"目标接口"（target），内部持有"被适配者"（adaptee）。
 *    - 转换三件事：方法名、参数形状、返回值形状。缺一不可。
 *    - 用类还是用闭包都行：类更直观（能看出实现了什么接口），
 *      闭包更轻量（尤其在只需要包一个函数时）。
 *    - 错误也要适配：第三方抛的是 Error('ERR_1001')，
 *      业务层期待的是 { code: 'TIMEOUT' }，这个转换必须写在适配器里。
 *    - 适配器是"一次性"的：一旦业务全部迁到新接口，适配器就该删掉，
 *      否则它会永远留在代码里成为"历史包袱"。
 *
 * 4. 常见陷阱（以及与三个易混模式的区别，第 5 节用表格详述）
 *    - 只适配了方法名，忘了适配**参数形状与返回值形状**：第三方返回
 *      `{ code: 0, data }`，你适配后仍原样透出，业务层照样得写两套分支。
 *      适配器必须把三件事都翻译掉：方法名、参数、返回值（含错误）。
 *    - 在适配器里**夹带业务逻辑**：适配器只做"翻译"，一旦开始算折扣、
 *      发通知，它就变成了业务类，复用性与可测性一起消失。
 *    - 泄漏第三方类型：适配器的方法签名里出现第三方的类或枚举，
 *      等于没适配 —— 换库时业务层还是要改。适配器的接口必须只用
 *      自己定义的类型。
 *    - 永远不删：迁移完毕后适配器应立刻删除。留下来的适配器会成为
 *      "历史包袱"，让后来人以为这套接口是必要的。
 *    - 用适配器掩盖"本该统一"的设计：如果两个模块都是自家代码，
 *      应该直接改源码统一接口，而不是加一层适配器。适配器的适用前提是
 *      **被适配者不可修改**（第三方、遗留代码、跨团队）。
 *
 *    以下是三个最易混淆的模式与适配器的分界：
 *    - 适配器 vs 外观（Facade）：适配器是"转换接口以匹配期望"（因为不兼容）；
 *      外观是"简化接口以降低复杂度"（因为太复杂）。适配器通常包 1 个对象，
 *      外观通常包 N 个子系统。适配器的接口是**别人（客户端）定好的**，
 *      外观的接口是**你自己设计的**。
 *    - 适配器 vs 装饰器（Decorator）：适配器改变接口、不增加功能；
 *      装饰器保持接口、增加功能。装饰器可以无限层叠，适配器通常只有一层。
 *    - 适配器 vs 代理（Proxy）：适配器解决"接口不匹配"，
 *      代理解决"访问控制/延迟/缓存"（接口相同，见 10 文件）。
 *      一句话：**代理和装饰器保持同一接口，适配器改变接口。**
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/09_adapter.js
 *
 * 【预期输出】
 *   先演示两个日志库、两个支付网关因为接口不同而导致的业务代码分裂，
 *   再写适配器把它们统一到同一个接口，用同一段业务代码跑通全部供应商；
 *   最后打印适配器 / 外观 / 装饰器 / 代理的对照表，并列出适配器的代价
 *   与"什么时候不该用"（比如能改源码就别适配）。
 * ============================================================================
 */

// ===========================================================================
// 1. 问题引入：两个"长得不一样"的第三方日志库
// ===========================================================================

console.log('--- 1. 问题引入：接口不一致的第三方库 ---');

/**
 * 旧日志库（legacy）：方法名 logMessage，签名是 (level, msg)，字符串拼接。
 * 它是第三方代码，我们**不能修改**（改了下次升级就被覆盖）。
 */
class LegacyLogger {
  constructor(prefix) {
    this.prefix = prefix;
  }
  // 注意参数顺序：(level, msg)，返回拼接好的字符串
  logMessage(level, msg) {
    return `[${this.prefix}][${level.toUpperCase()}] ${msg}`;
  }
}

/**
 * 新日志库（next）：方法名 write，签名是 ({ level, message })，结构化。
 * 同样是第三方，也不能改。
 */
class NextLogger {
  write({ level, message, tags = [] }) {
    const tagPart = tags.length ? ` (${tags.join(',')})` : '';
    return `{ "lvl": "${level}", "msg": "${message}"${tagPart ? `, "tags": ${JSON.stringify(tags)}` : ''} }`;
  }
}

// 业务方期望的接口（"目标接口"）：统一叫 log(level, message, meta)
// 没有适配器时，业务代码只能被迫写分支：
function businessLogWithoutAdapter(lib, level, message) {
  // ↓ 这段 if-else 就是"接口不兼容"的代价
  if (lib instanceof LegacyLogger) {
    return lib.logMessage(level, message);
  } else if (lib instanceof NextLogger) {
    return lib.write({ level, message });
  }
  throw new TypeError('不认识的日志库');
}

const legacy = new LegacyLogger('订单服务');
const next = new NextLogger();
console.log('无适配器，业务日志：');
console.log('  ' + businessLogWithoutAdapter(legacy, 'info', '订单创建成功'));
console.log('  ' + businessLogWithoutAdapter(next, 'info', '订单创建成功'));
console.log(`问题：每接一个新库就要改 businessLogWithoutAdapter；
  而且业务代码里出现了 instanceof —— 业务不应该知道"库的类名"。`);

// ===========================================================================
// 2. 日志适配器：把两个库统一成同一个接口
// ===========================================================================

console.log('\n--- 2. 日志适配器 ---');

/**
 * 目标接口（Target）：业务代码只认这个形状 —— log(level, message, meta)。
 * JS 没有 interface，这里用一个"文档化的基类 + 运行时校验"来表达约定。
 */
class Logger {
  // eslint-disable-next-line no-unused-vars
  log(level, message, meta) {
    throw new Error('适配器必须实现 log(level, message, meta)');
  }
}

/** 适配器 1：包装旧库。方法名、参数顺序、返回值三层转换都在这里完成 */
class LegacyLoggerAdapter extends Logger {
  #adaptee; // 被适配者（adaptee）：第三方库实例

  constructor(adaptee) {
    super();
    this.#adaptee = adaptee;
  }

  log(level, message, meta = {}) {
    // ① 参数形状转换：对象参数 -> 两个位置参数，并调整顺序
    // ② 方法名转换：log -> logMessage
    let line = this.#adaptee.logMessage(level, message);
    // ③ 返回值形状转换：旧库不认识 meta，我们在这里补上（适配器可以"加料"，
    //    但注意加料若涉及"功能增强"就偏向装饰器了；这里只是格式统一）
    if (meta.requestId) line += ` (req=${meta.requestId})`;
    return line;
  }
}

/** 适配器 2：包装新库。参数要"打散重构"，返回值保持业务期望的字符串 */
class NextLoggerAdapter extends Logger {
  #adaptee;

  constructor(adaptee) {
    super();
    this.#adaptee = adaptee;
  }

  log(level, message, meta = {}) {
    // 把业务的 (level, message, meta) 翻译成新库的 { level, message, tags }
    const tags = [];
    if (meta.requestId) tags.push(`req=${meta.requestId}`);
    if (meta.module) tags.push(`mod=${meta.module}`);
    // 新库返回的是一行 JSON，如果我们想让业务"完全无感"，
    // 可以在这里把它再转回字符串（也可以原样返回 —— 这是设计选择）
    return this.#adaptee.write({ level, message, tags });
  }
}

// 业务代码只依赖 Logger 这个抽象，对具体库一无所知
function businessLog(logger, level, message, meta) {
  // 无论是哪个库，调用方式完全一样
  return logger.log(level, message, meta);
}

const adapters = [
  new LegacyLoggerAdapter(legacy),
  new NextLoggerAdapter(next),
];
console.log('适配器统一之后，同一段业务代码跑两个库：');
for (const adapter of adapters) {
  console.log('  ' + businessLog(adapter, 'warn', '库存不足', { requestId: 'r-1', module: 'stock' }));
}

// 新增第三个库？只要再写一个适配器，业务代码零改动
class JsonLinesLogger {
  constructor(service) {
    this.service = service;
  }
  emit(record) {
    // 第三个库：方法名 emit，参数是数组 [level, msg]
    return `${this.service}|${record.join('|')}`;
  }
}

class JsonLinesAdapter extends Logger {
  #adaptee;
  constructor(adaptee) {
    super();
    this.#adaptee = adaptee;
  }
  log(level, message, meta = {}) {
    return this.#adaptee.emit([level, message, meta.module ?? '-']);
  }
}
console.log('  新增第三个库，业务代码一行未改：');
console.log('  ' + businessLog(new JsonLinesAdapter(new JsonLinesLogger('SVC')), 'error', '支付失败', { module: 'pay' }));

// ===========================================================================
// 3. 支付网关适配器：参数与返回值都不同
// ===========================================================================

console.log('\n--- 3. 支付网关适配器 ---');

/**
 * 场景：订单服务只想调 pay(order) 拿到 { success, transactionId, raw }。
 * 但三家网关的入参、出参、错误码都不一样。
 */

/** 网关 A：微信风格 —— 参数是下划线命名，返回 { return_code, transaction_id } */
class WechatGateway {
  createPayment({ out_trade_no, total_fee, body }) {
    // 金额单位是"分"，所以适配器要负责元->分的换算
    return {
      return_code: 'SUCCESS',
      transaction_id: `wx_${out_trade_no}_${total_fee}`,
      body,
    };
  }
}

/** 网关 B：支付宝风格 —— 参数是驼峰命名，返回 { code, tradeNo }，抛错用字符串码 */
class AlipayGateway {
  tradeCreate({ outTradeNo, amountYuan, subject }) {
    if (amountYuan <= 0) {
      // 注意：它抛的错带一个业务码，适配器要把它翻译成统一错误
      const err = new Error('金额必须大于 0');
      err.bizCode = 'ACQ.INVALID_AMOUNT';
      throw err;
    }
    return { code: '10000', tradeNo: `ali_${outTradeNo}`, subject };
  }
}

/** 网关 C：一个"老式"网关，返回 Promise（异步），且成功时返回字符串 */
class LegacyBankGateway {
  async submitOrder(amountCents, orderNo) {
    // 模拟异步 IO（这里用 Promise.resolve 而不是定时器，避免引入延时）
    return Promise.resolve(`BANK-OK-${orderNo}-${amountCents}`);
  }
}

/**
 * 统一目标接口：PaymentGateway.pay(order) -> { success, transactionId, gateway }
 * 三个适配器都要保证：
 *   ① 金额单位统一（这里统一用"元"，由适配器各自换算）；
 *   ② 返回统一形状；
 *   ③ 错误统一成 { success: false, errorCode, message } 而不是抛出各家的错误。
 */
class PaymentGateway {
  // eslint-disable-next-line no-unused-vars
  async pay(order) {
    throw new Error('适配器必须实现 pay(order)');
  }
}

class WechatAdapter extends PaymentGateway {
  #adaptee;
  constructor(adaptee) {
    super();
    this.#adaptee = adaptee;
  }

  async pay(order) {
    // 元 -> 分：注意浮点误差，先四舍五入再取整
    const totalFee = Math.round(order.amountYuan * 100);
    const res = this.#adaptee.createPayment({
      out_trade_no: order.orderNo, // 命名风格转换：orderNo -> out_trade_no
      total_fee: totalFee,
      body: order.subject,
    });
    // 返回值形状转换：return_code -> success，transaction_id -> transactionId
    return {
      success: res.return_code === 'SUCCESS',
      transactionId: res.transaction_id,
      gateway: 'wechat',
    };
  }
}

class AlipayAdapter extends PaymentGateway {
  #adaptee;
  constructor(adaptee) {
    super();
    this.#adaptee = adaptee;
  }

  async pay(order) {
    try {
      const res = this.#adaptee.tradeCreate({
        outTradeNo: order.orderNo,
        amountYuan: order.amountYuan,
        subject: order.subject,
      });
      return { success: res.code === '10000', transactionId: res.tradeNo, gateway: 'alipay' };
    } catch (err) {
      // 错误适配：把第三方错误翻译成统一形状，而不是让它冒泡出去污染业务层
      // （业务层不应该认识 'ACQ.INVALID_AMOUNT' 这种专有码）
      return { success: false, transactionId: null, gateway: 'alipay', errorCode: 'INVALID_AMOUNT', message: err.message };
    }
  }
}

class LegacyBankAdapter extends PaymentGateway {
  #adaptee;
  constructor(adaptee) {
    super();
    this.#adaptee = adaptee;
  }

  async pay(order) {
    const amountCents = Math.round(order.amountYuan * 100);
    const result = await this.#adaptee.submitOrder(amountCents, order.orderNo); // 异步 -> 用 await 对齐
    // 返回值是一个字符串，要解析出结构化结果
    const ok = result.startsWith('BANK-OK-');
    return { success: ok, transactionId: ok ? result : null, gateway: 'legacyBank' };
  }
}

// ---- 业务代码：完全不知道有几种网关 ----
async function checkout(gateway, order) {
  const result = await gateway.pay(order); // 统一入口
  if (result.success) {
    return `✅ [${result.gateway}] 支付成功，流水号 ${result.transactionId}`;
  }
  return `❌ [${result.gateway}] 支付失败：${result.errorCode ?? 'UNKNOWN'} ${result.message ?? ''}`;
}

const gateways = {
  微信: new WechatAdapter(new WechatGateway()),
  支付宝: new AlipayAdapter(new AlipayGateway()),
  银行: new LegacyBankAdapter(new LegacyBankGateway()),
};

for (const [name, gw] of Object.entries(gateways)) {
  console.log(`  ${name}: ${await checkout(gw, { orderNo: 'ORD-1001', amountYuan: 99.9, subject: '会员年费' })}`);
}

// 错误路径：支付宝额度非法 -> 被适配器翻译成统一错误码，业务代码不用 try/catch
console.log('  支付宝(金额非法):', await checkout(gateways['支付宝'], { orderNo: 'ORD-1002', amountYuan: 0, subject: '测试' }));

// ---- 多供应商路由：因为接口统一了，切换网关只需要换一个变量 ----
console.log('\n  运行时切换网关（同一段业务代码）：');
for (const [name, gw] of Object.entries(gateways)) {
  const r = await gw.pay({ orderNo: 'ORD-2000', amountYuan: 1, subject: '切换测试' });
  console.log(`    切到 ${name}：success=${r.success}`);
}

// ===========================================================================
// 4. 适配器的另一种形态：闭包版（只包一个函数）
// ===========================================================================

console.log('\n--- 4. 闭包版适配器（轻量场景） ---');

/**
 * 如果只需要适配"一个函数"，用类就显得重了。
 * 闭包版更短，而且天然是单例（不需要 new）。
 */
const legacyLog = (level, msg) => `LEGACY<${level}> ${msg}`; // 第三方函数

/** 闭包适配器：把 (msg, level) 的顺序调换并补默认值 */
const logAdapter = (msg, level = 'info') => legacyLog(level, msg);

console.log('  原接口调用：', legacyLog('error', '磁盘快满'));
console.log('  适配后调用：', logAdapter('磁盘快满', 'error'));
console.log('  适配后省略 level：', logAdapter('仅一行消息'));
console.log(`  选择依据：类版适合"要适配多个方法 + 需要保存状态"；
  闭包版适合"只包一个函数"。不要为了形式统一而给单函数套一个类。`);

// ===========================================================================
// 5. 适配器 vs 外观 vs 装饰器 vs 代理
// ===========================================================================

console.log('\n--- 5. 四个易混模式的区别 ---');

const rows = [
  ['模式', '接口是否改变', '包几个对象', '解决什么问题'],
  ['适配器 Adapter', '改变（转成客户端期望的）', '通常 1 个', '接口不兼容'],
  ['外观 Facade', '简化（提供更少更粗的方法）', '通常 N 个子系统', '子系统太复杂'],
  ['装饰器 Decorator', '不变（保持同一接口）', '1 个，可叠多层', '需要动态增强功能'],
  ['代理 Proxy', '不变（同一个接口）', '1 个', '控制访问/延迟/缓存'],
];
const dw = (s) =>
  [...String(s)].reduce((w, ch) => w + (/[ᄀ-ᅟ⺀-꓏가-힣豈-﫿︰-﹏＀-｠￠-￦]/.test(ch) ? 2 : 1), 0);
const ws = [0, 1, 2, 3].map((i) => Math.max(...rows.map((r) => dw(r[i]))));
const padTo = (s, w) => String(s) + ' '.repeat(w - dw(s) + 2);
for (const [idx, row] of rows.entries()) {
  console.log(row.map((c, i) => padTo(c, ws[i])).join(''));
  if (idx === 0) console.log('-'.repeat(ws.reduce((a, w) => a + w + 2, 0)));
}

// 用"同一件事的四种包装"把区别落到代码上：都是在包一个 doWork()
console.log('\n同一段代码，四种包装，意图完全不同：');

function doWork(x) {
  return x * 2;
}

// 适配器：调用方给的参数是字符串，我们转成数字（改变接口）
const adaptedWork = (strX) => doWork(Number(strX));
console.log('  适配器：adapt("21") =>', adaptedWork('21'), '（把 string 接口转成 number 接口）');

// 外观：把三个步骤合成一个粗粒度入口（简化接口）
const facadeWork = {
  run(x) {
    const step1 = doWork(x);
    const step2 = step1 + 1;
    return `结果=${step2}`;
  },
};
console.log('  外观：facade.run(3) =>', facadeWork.run(3), '（对外只暴露一个 run）');

// 装饰器：接口不变，额外打印一行（增强功能）
const decoratedWork = (x) => {
  const r = doWork(x);
  console.log('  （装饰器记录了一次调用）');
  return r;
};
console.log('  装饰器：decorated(5) =>', decoratedWork(5), '（签名与返回值都不变）');

// 代理：接口不变，但加了缓存（控制访问）
const cache = new Map();
const proxiedWork = (x) => {
  if (cache.has(x)) return cache.get(x);
  const r = doWork(x);
  cache.set(x, r);
  return r;
};
proxiedWork(7);
console.log('  代理：proxied(7) 第二次 =>', proxiedWork(7), '（命中缓存，接口没变）');

// ===========================================================================
// 6. 代价与什么时候不该用
// ===========================================================================

console.log('\n--- 6. 适配器的代价与不适用场景 ---');

console.log(`【代价】
  1) 多一层间接：调用栈、IDE 跳转、错误堆栈都多一跳；
     出错时堆栈里先出现适配器，再看真正的第三方方法，定位慢一点。
  2) 转换逻辑会漏：字段改名、单位换算、错误码映射 ——
     只要漏掉一个（比如日元没有小数位、某网关金额单位是分），
     就会产生"金额差 100 倍"这种极其严重且难查的 bug。适配器必须配单测。
  3) 信息损失：第三方接口的能力通常比你的目标接口更丰富，
     适配器只暴露你用到的那部分，其余能力被隐藏（有时是好事，有时是损失）。
  4) 会变成永久包袱：业务迁走后适配器常常没人敢删（"万一还有人用呢"）。
     建议：写清废弃计划，用 @deprecated 标注，配合调用统计决定删除时机。
  5) 数量膨胀：N 个库 × M 个接口 = N×M 个适配器。
     这时应考虑先统一自己的"目标接口"设计，减少组合数。

【什么时候不该用】
  1) 你能改源码：如果那个不兼容的类是你自己的代码，
     直接把接口改成期望的形状，比加适配器干净得多。
     **适配器的正当理由只有一个：你改不了对方。**
  2) 只用一次、且不会再换供应商：多一层包装只有成本没有收益。
  3) 目标接口本身还没稳定：接口会变时，适配器要跟着反复改，
     此时应该先把目标接口定下来（先做接口设计，再做适配）。
  4) 差异大到无法映射：如果两个接口的语义根本不同
     （比如一个是"流式推送"、一个是"请求-响应"），
     硬套适配器会写出一个极其复杂的转换层 —— 这种情况应该重新选型，
     而不是写一个"翻译一切"的上帝适配器。
  5) 只是"少写几个参数"：那叫默认值/default options，不叫适配器。

判断口诀：写下"如果不加适配器，我要改多少处调用点？"
  只有 1~2 处且不会再增加 -> 直接改调用点。
  有 5 处以上、或这是第三方库 -> 适配器值得。`);

console.log('\n全部演示完毕。');
