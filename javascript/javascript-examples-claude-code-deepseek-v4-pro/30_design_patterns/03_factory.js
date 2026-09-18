/**
 * ============================================================================
 * 知识点：工厂模式 —— 简单工厂、工厂方法、参数化创建与抽象工厂
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式
 * 【难度等级】进阶
 * 【前置知识】30_design_patterns/02_singleton.js、14_classes（类的语法）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    工厂模式把"创建对象"这件事从使用方手里拿走，交给一个专门的函数/类去做。
 *    使用方只说"我要什么"，不说"怎么造出来"。按复杂度分三档：
 *      (a) 简单工厂（Simple Factory）：一个函数 + switch/映射表，根据 key 造对象。
 *          它不算 GoF 的正式模式，但 90% 的场景用它就够了。
 *      (b) 工厂方法（Factory Method）：把"造什么"下沉到子类，
 *          父类只定义流程、声明一个抽象的 create() 让子类实现。
 *      (c) 抽象工厂（Abstract Factory）：一个工厂负责造"一族"相关的对象
 *          （比如一整套 UI 控件：按钮 + 输入框 + 弹窗），保证同族产品风格一致。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 后端返回的数据带一个 type 字段，前端要根据 type 渲染不同的组件/图表/消息卡片。
 *      直接写 new 的话，新增一种 type 就要改动所有分支点。
 *    - 支付渠道接入：微信/支付宝/银行卡，创建流程（验签、组装参数）各不相同，
 *      但调用方只想拿到一个统一的 pay() 接口。
 *    - 日志器创建：开发环境输出彩色到终端，生产环境输出 JSON 到文件/上报服务。
 *    - 测试替身：测试时让工厂返回假实现，业务代码一行不用改。
 *
 * 3. 核心语法要点
 *    - 简单工厂的两种写法：if/switch 分支，或"映射表"（对象字面量把 key 映射到构造函数）。
 *      映射表更好：新增类型只加一行数据，不用改控制流（开闭原则）。
 *    - 工厂函数的返回值叫"产品"（product），产品应该实现一致的接口
 *      （同样的方法名、同样的语义），否则抽象就是假的。
 *    - 工厂方法：父类里写 template method（模板方法），把易变的部分
 *      留给子类的 createProduct() 覆写。
 *    - 参数化创建：工厂接受一个配置对象，在内部决定具体类型与初始状态。
 *    - 工厂可以配合缓存（见 10_proxy_pattern.js 的缓存代理）实现"对象池/复用"。
 *
 * 4. 常见陷阱
 *    - 产品接口不一致：有的返回 { render() }，有的返回 { draw() }，
 *      使用方还是得写 if-else，工厂白做了。
 *    - 工厂内部依赖具体类：使用方拿到的对象上还挂着具体类的私有细节，
 *      一旦类改名，外部代码就崩。
 *    - 工厂函数里塞业务逻辑：工厂只该负责"创建 + 组装"，不该负责"干活"。
 *    - 忘记处理未知 type：返回 undefined 后在使用处报 "Cannot read property of undefined"，
 *      应该在工厂里就抛一个语义明确的错误（本文件演示了这一点）。
 *    - 过度工厂化：只有一个产品、永远不会变，却硬加一层工厂 —— 纯属噪音。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/03_factory.js
 *
 * 【预期输出】
 *   依次演示：switch 版简单工厂、映射表版简单工厂、参数化工厂（按后端 type 造
 *   UI 组件）、工厂方法（不同环境的日志器）、抽象工厂（两套风格一致的 UI 控件族），
 *   最后对比直接 new 与工厂的取舍，并列出工厂的代价与不适用场景。
 * ============================================================================
 */

// ===========================================================================
// 1. 问题引入：直接 new 会带来什么
// ===========================================================================

console.log('--- 1. 问题引入：直接 new 的痛点 ---');

// 假设后端返回的通知数据长这样
const notifications = [
  { type: 'email', to: 'a@example.com', subject: '欢迎' },
  { type: 'sms', to: '13800000000', text: '验证码 1234' },
  { type: 'push', deviceId: 'dev-9', title: '新消息' },
];

// 反面写法：使用方必须知道每一种通知怎么构造、怎么发送
// 每新增一种通知类型，这段 switch 就要改一次（违反开闭原则）
function sendRaw(notification) {
  switch (notification.type) {
    case 'email':
      // 使用方被迫知道 EmailNotifier 的构造细节
      return `[raw] 发邮件到 ${notification.to}，主题《${notification.subject}》`;
    case 'sms':
      return `[raw] 发短信到 ${notification.to}：${notification.text}`;
    case 'push':
      return `[raw] 推送设备 ${notification.deviceId}：${notification.title}`;
    default:
      return `[raw] 未知类型 ${notification.type}`;
  }
}
for (const n of notifications) console.log(sendRaw(n));

// 痛点总结：使用方耦合了"有哪些类型"和"每种类型的字段名"两件事。
// 类型一旦增多，这段代码会越来越长，且每一处都要同步修改。

// ===========================================================================
// 2. 简单工厂 A：switch 分支版
// ===========================================================================

console.log('\n--- 2. 简单工厂 A：switch 分支版 ---');

/** 产品基类：所有通知器的统一接口 */
class Notifier {
  // 接口约定（JS 没有 interface，用抛错表达式来强制子类实现）
  send() {
    throw new Error('子类必须实现 send()');
  }
}

class EmailNotifier extends Notifier {
  constructor(to, subject) {
    super();
    this.to = to;
    this.subject = subject;
  }
  send() {
    return `📧 邮件 -> ${this.to}：《${this.subject}》`;
  }
}

class SmsNotifier extends Notifier {
  constructor(to, text) {
    super();
    this.to = to;
    this.text = text;
  }
  send() {
    return `📱 短信 -> ${this.to}：${this.text}`;
  }
}

class PushNotifier extends Notifier {
  constructor(deviceId, title) {
    super();
    this.deviceId = deviceId;
    this.title = title;
  }
  send() {
    return `🔔 推送 -> ${this.deviceId}：${this.title}`;
  }
}

/**
 * 简单工厂（switch 版）。
 * 使用方只需要知道"有个 create"和"产品有 send 方法"，
 * 不再需要知道每种通知器的类名和构造参数顺序。
 */
function createNotifier(raw) {
  switch (raw.type) {
    case 'email':
      return new EmailNotifier(raw.to, raw.subject);
    case 'sms':
      return new SmsNotifier(raw.to, raw.text);
    case 'push':
      return new PushNotifier(raw.deviceId, raw.title);
    default:
      // 关键：把"未知类型"这个错误在工厂里就说清楚，
      // 而不是返回 undefined 让调用方在使用时炸掉。
      throw new RangeError(`不支持的通知类型：${raw.type}`);
  }
}

for (const n of notifications) console.log(createNotifier(n).send());

// 未知类型：工厂自己抛错，我们在这里 catch，进程依然正常退出
try {
  createNotifier({ type: 'fax', number: '021-12345678' });
} catch (err) {
  console.log('未知类型被工厂拦下：', err.name, '-', err.message);
}

// ===========================================================================
// 3. 简单工厂 B：映射表版（新增类型只加数据，不改控制流）
// ===========================================================================

console.log('\n--- 3. 简单工厂 B：映射表版 ---');

/**
 * 映射表把"类型 -> 构造函数"变成一份**数据**，
 * 新增类型只是在表里加一行，不需要动任何 if/switch。
 * 这就是"把决策依据从条件判断变成数据映射"，是策略模式（07）的同一种思想。
 */
const NOTIFIER_REGISTRY = new Map([
  [
    'email',
    {
      Ctor: EmailNotifier,
      // 每种类型自带"如何从原始数据映射到构造参数"的规则
      mapArgs: (raw) => [raw.to, raw.subject],
    },
  ],
  ['sms', { Ctor: SmsNotifier, mapArgs: (raw) => [raw.to, raw.text] }],
  ['push', { Ctor: PushNotifier, mapArgs: (raw) => [raw.deviceId, raw.title] }],
]);

function createNotifierV2(raw) {
  const entry = NOTIFIER_REGISTRY.get(raw.type);
  if (!entry) {
    // 把支持的类型列出来，方便排查（比一句 "unknown type" 有用得多）
    const supported = [...NOTIFIER_REGISTRY.keys()].join(', ');
    throw new RangeError(`不支持的通知类型：${raw.type}（支持：${supported}）`);
  }
  return new entry.Ctor(...entry.mapArgs(raw)); // 展开参数构造
}

for (const n of notifications) console.log('v2:', createNotifierV2(n).send());

// 运行时注册新类型：不需要修改 createNotifierV2 的源码（开闭原则）
NOTIFIER_REGISTRY.set('webhook', {
  Ctor: class WebhookNotifier extends Notifier {
    constructor(url, payload) {
      super();
      this.url = url;
      this.payload = payload;
    }
    send() {
      return `🪝 Webhook -> ${this.url}：${JSON.stringify(this.payload)}`;
    }
  },
  mapArgs: (raw) => [raw.url, raw.payload],
});
console.log('动态注册后：', createNotifierV2({ type: 'webhook', url: 'https://api.example.com/hook', payload: { ok: true } }).send());

// ===========================================================================
// 4. 参数化工厂：按后端 type 造 UI 组件
// ===========================================================================

console.log('\n--- 4. 参数化工厂：后端 type -> UI 组件 ---');

/**
 * 这是前端最常见的工厂用法：后端返回一堆"消息卡片"数据，
 * 前端根据 type 造出对应的组件对象，然后统一 render()。
 * 注意产品的接口必须高度一致：都有 render()，都返回字符串。
 */
const CARD_BUILDERS = {
  // 每种组件的创建逻辑就是一个函数，接收原始数据，返回统一形状的产品
  text: (d) => ({
    kind: 'text',
    render: () => `<p class="card-text">${d.content}</p>`,
  }),
  image: (d) => ({
    kind: 'image',
    render: () => `<img class="card-image" src="${d.url}" alt="${d.alt ?? ''}" />`,
  }),
  link: (d) => ({
    kind: 'link',
    render: () => `<a class="card-link" href="${d.href}">${d.label}</a>`,
  }),
  // 兜底组件：未知类型统一渲染成一个提示块，而不是让整页崩掉
  __unknown: (d) => ({
    kind: 'unknown',
    render: () => `<div class="card-unknown">暂不支持的卡片类型：${d.type}</div>`,
  }),
};

/**
 * 参数化工厂：多了一个 options 参数，用来影响创建过程（这里是"未知类型怎么办"）。
 * @param {{type: string}} data
 * @param {{strict?: boolean}} [options]
 */
function createCard(data, options = {}) {
  const { strict = false } = options;
  // 优先查具体构造器，找不到时按 strict 决定"抛错"还是"用兜底"
  const builder = CARD_BUILDERS[data.type] ?? (strict ? null : CARD_BUILDERS.__unknown);
  if (!builder) throw new RangeError(`strict 模式：未知卡片类型 ${data.type}`);
  return builder(data);
}

const cards = [
  { type: 'text', content: '这是一段正文' },
  { type: 'image', url: 'https://cdn.example.com/a.png', alt: '示例图' },
  { type: 'link', href: 'https://example.com', label: '点我' },
  { type: 'video', src: 'a.mp4' }, // 未知类型
];
for (const c of cards) console.log(createCard(c).render());

try {
  createCard({ type: 'video', src: 'a.mp4' }, { strict: true });
} catch (err) {
  console.log('strict 模式下抛错：', err.name, '-', err.message);
}

// ===========================================================================
// 5. 工厂方法：把"造什么"交给子类
// ===========================================================================

console.log('\n--- 5. 工厂方法（Factory Method） ---');

/**
 * 工厂方法的核心是"模板方法 + 抽象创建步骤"：
 *   父类 LoggerFactory 定义了 log() 的完整流程（加时间戳 -> 输出），
 *   但把"创建哪种子类的 formatter"这一步交给子类的 createFormatter()。
 *   父类不需要知道具体是哪个 formatter，子类也不需要重写整个 log 流程。
 */
class BaseFormatter {
  format(level, msg) {
    throw new Error('子类必须实现 format()');
  }
}

class TextFormatter extends BaseFormatter {
  format(level, msg) {
    return `${new Date().toISOString()} [${level.toUpperCase()}] ${msg}`;
  }
}

class JsonFormatter extends BaseFormatter {
  format(level, msg) {
    // 生产环境常见：一行一个 JSON，方便日志采集系统解析
    return JSON.stringify({ ts: Date.now(), level, msg });
  }
}

/** 抽象工厂类：只定义流程，不定义"造哪种" */
class LoggerFactory {
  /** 这就是"工厂方法"，由子类实现 */
  createFormatter() {
    throw new Error('子类必须实现 createFormatter()');
  }

  /** 模板方法：流程写死在父类，易变部分委托给工厂方法 */
  log(level, msg) {
    const formatter = this.createFormatter(); // <- 唯一的变化点
    const line = formatter.format(level, msg);
    // 统一的后处理：这里给所有环境都加一个前缀
    return `[logger] ${line}`;
  }
}

class DevLoggerFactory extends LoggerFactory {
  createFormatter() {
    return new TextFormatter(); // 开发环境：人眼友好
  }
}

class ProdLoggerFactory extends LoggerFactory {
  createFormatter() {
    return new JsonFormatter(); // 生产环境：机器友好
  }
}

// 使用方只依赖 LoggerFactory 这个抽象，不知道也用不着知道具体是哪个子类
function buildLogger(env) {
  return env === 'production' ? new ProdLoggerFactory() : new DevLoggerFactory();
}
console.log('开发环境：', buildLogger('development').log('info', '服务启动'));
console.log('生产环境：', buildLogger('production').log('info', '服务启动'));

// ===========================================================================
// 6. 抽象工厂：造"一族"风格一致的产品
// ===========================================================================

console.log('\n--- 6. 抽象工厂（Abstract Factory）简述 ---');

/**
 * 抽象工厂解决的是"产品族"问题：一套 UI 需要按钮 + 输入框，二者风格必须一致。
 * 如果分别用两个简单工厂去造，很容易出现"深色按钮配浅色输入框"的错配。
 * 抽象工厂把这些成套的创建方法收进同一个工厂对象，
 * 换主题时只换工厂，整族产品自动保持一致。
 */
function createLightTheme() {
  return {
    name: 'light',
    createButton: (label) => ({ render: () => `<button class="btn-light">${label}</button>` }),
    createInput: (ph) => ({ render: () => `<input class="input-light" placeholder="${ph}" />` }),
  };
}
function createDarkTheme() {
  return {
    name: 'dark',
    createButton: (label) => ({ render: () => `<button class="btn-dark">${label}</button>` }),
    createInput: (ph) => ({ render: () => `<input class="input-dark" placeholder="${ph}" />` }),
  };
}

// 选择一个工厂 = 选择一整套风格，绝不会出现混搭
const themeFactories = { light: createLightTheme, dark: createDarkTheme };

function renderLoginForm(themeName) {
  // 注意这里有两层括号：先从映射表里取出"造工厂的那个函数"，
  // 再调用它，得到真正的"工厂对象"（带 createButton / createInput 的那个）。
  const factory = (themeFactories[themeName] ?? createLightTheme)();
  return [
    `主题：${factory.name}`,
    factory.createButton('登录').render(),
    factory.createInput('请输入用户名').render(),
  ].join('\n  ');
}
console.log('  ' + renderLoginForm('light'));
console.log('  ' + renderLoginForm('dark'));
console.log(`（三档对比：简单工厂解决"造一个"，工厂方法解决"谁来造"，
  抽象工厂解决"造一整套且风格一致"。绝大多数业务代码只需要第一档。）`);

// ===========================================================================
// 7. 工厂 vs 直接 new：收益与代价
// ===========================================================================

console.log('\n--- 7. 工厂 vs 直接 new ---');

console.log(`【工厂带来的收益】
  1) 解耦：使用方只依赖"产品的接口"，不依赖"产品的类名与构造参数顺序"。
     类改名、构造参数重排，都只改工厂一处。
  2) 集中配置：默认参数、依赖注入、缓存/池化都能收在工厂内部。
     （比如 createHttpClient() 里统一设好超时、重试、baseURL）
  3) 易于替换：测试时 createNotifier 返回假实现，业务代码零改动。
  4) 可扩展：映射表版新增类型不改控制流，符合开闭原则。

【工厂带来的代价】
  1) 多一层间接：读代码时从调用点跳不到实现，必须先去工厂里查表，
     IDE 的"跳转到定义"经常只能跳到工厂函数，而不是真正的产品类。
  2) 多一层心智负担：新人需要先理解"工厂 + 产品接口"这套约定，
     而直接 new 是所有人都懂的。
  3) 类型推导变弱：工厂返回联合类型，TS 里需要泛型或类型断言才能推准；
     简单工厂用映射表时尤其明显。
  4) 调试栈变深：出错时调用栈里多一层工厂帧，堆栈可读性下降。`);

// ===========================================================================
// 8. 什么时候不该用工厂
// ===========================================================================

console.log('\n--- 8. 什么时候不该用工厂 ---');

console.log(`不该用的信号：
  1) 只有一个产品、且短期内不会增加第二种：直接 new 更清楚。
     "为了将来可能扩展"是最常见的过度设计借口（见 13 文件的 YAGNI）。
  2) 创建逻辑就是一行 new，没有任何配置/依赖/分支：
     这层工厂只是把 new 换了个名字，纯噪音。
  3) 产品的构造参数在使用方各不相同、工厂无法统一时：
     工厂会退化成"把参数原样透传"，没有任何抽象价值。
  4) 需要精确控制生命周期（什么时候创建、什么时候销毁）时：
     工厂会把这个控制权拿走，反而碍事。此时应该注入实例，而不是注入工厂。

判断口诀：写下"如果新增一种类型，我要改几个文件？"
  答案 <= 1 且代码里没有重复的创建逻辑 —— 就不需要工厂。`);

console.log('\n全部演示完毕。');
