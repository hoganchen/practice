/**
 * ============================================================================
 * 知识点：跨上下文通信 —— postMessage / BroadcastChannel / storage 事件
 * ============================================================================
 *
 * 【所属分类】27_web_apis —— 浏览器 Web API
 * 【难度等级】高级
 * 【前置知识】27_web_apis/05_web_storage.js（localStorage）、
 *             27_web_apis/12_observer_apis.js（事件与异步回调）、
 *             23_events/01_event_emitter.js（发布订阅模式）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "上下文"（context）指的是一个独立的 JS 执行环境：一个标签页、一个 iframe、
 *    一个弹窗（window.open 打开的）、一个 Web Worker、一个 Service Worker。
 *    它们之间默认是**完全隔离**的——变量不能互访，函数不能互相调用。
 *    想通信，只能通过浏览器提供的几条"官方通道"：
 *      - postMessage：点对点，从一个窗口发给另一个窗口。（也可用于 Worker）
 *      - BroadcastChannel：广播，同一源下的所有同频道页面都能收到。
 *      - storage 事件：localStorage 被改动时，浏览器自动通知同源的其他页面。
 *
 * 2. 为什么需要（以及为什么不能"直接调用"）
 *    同源策略（Same-Origin Policy）是浏览器安全的基石：源 = 协议 + 域名 + 端口，
 *    三者完全相同才算同源。不同源的页面如果能随便读对方的 DOM、偷对方的
 *    localStorage，那你在银行页面开的另一个标签页就能偷走你的账户信息。
 *    所以浏览器只留了"消息传递"这一条窄路：你必须显式地把数据**序列化**后
 *    交给对方，对方再**反序列化**出来。这条路上的每一环都有安全约束。
 *
 * 3. 核心语法要点
 *    （1）postMessage —— 点对点
 *        // 发送方
 *        otherWindow.postMessage(message, targetOrigin, [transfer]);
 *        // 接收方
 *        window.addEventListener('message', (event) => {
 *          if (event.origin !== 'https://trusted.example.com') return; // 必须校验！
 *          console.log(event.data, event.source, event.origin);
 *        });
 *        - targetOrigin 是**必填**的，决定"只有来自这个源的文档才收得到"。
 *          写 '*' 表示不限制（会泄漏数据给对方，除非消息本身不含敏感信息）。
 *        - 接收方必须自己校验 event.origin，因为任何页面都能给你发消息。
 *
 *    （2）BroadcastChannel —— 同源广播
 *        const ch = new BroadcastChannel('login');
 *        ch.postMessage({ type: 'logout' });
 *        ch.onmessage = (e) => console.log(e.data);
 *        ch.close();
 *        - 只能同源；发送者**自己收不到**自己发的消息。
 *
 *    （3）storage 事件 —— 顺带的跨页通知
 *        window.addEventListener('storage', (e) => {
 *          e.key; e.oldValue; e.newValue; e.url; e.storageArea;
 *        });
 *        - 只通知**同源的其他**文档，发起修改的那个页面自己收不到。
 *        - 只有真的改变了值才触发；clear() 时 e.key === null。
 *
 *    （4）结构化克隆（Structured Clone）
 *        以上三条通道传输数据时用的都是"结构化克隆"算法，它不是 JSON：
 *        - 支持循环引用、Date、RegExp、Map、Set、ArrayBuffer、TypedArray、
 *          Blob、File、Error、BigInt、undefined、NaN、-0；
 *        - 不支持函数、Symbol、WeakMap/WeakSet、Promise、Proxy、DOM 节点，
 *          传这些会抛 DataCloneError；
 *        - 会丢失原型链（class 实例变成普通对象）、丢失 Symbol 属性键、
 *          丢失 getter/setter（被求值成普通属性值）。
 *        - ArrayBuffer 可以"转移所有权"（transfer），转移后原 buffer 归零，
 *          这是零拷贝传递大块二进制的方式。
 *
 * 4. 常见陷阱
 *    - 接收方不校验 event.origin = 任何人发来的消息都当命令执行（XSS 级别的漏洞）。
 *    - 发送方用 targetOrigin: '*' = 把消息广播给任意来源，可能泄漏 token。
 *    - 以为 BroadcastChannel / storage 事件会通知自己 —— 都不会，这是设计如此。
 *    - 以为 postMessage 是同步的 —— 它是异步的，消息进入接收方的事件队列。
 *    - 多标签页同时写 localStorage 是 last-write-wins，没有冲突解决；
 *      需要强一致就得靠服务端版本号 / 时间戳。
 *    - 两个不同端口（http://localhost:3000 与 :4000）**不同源**，
 *      互相之间不能读 localStorage，BroadcastChannel 也收不到。
 *
 * 【本文件在 Node 中如何演示】
 *   Node.js 里没有 window / iframe / 标签页，也没有 localStorage。
 *   本文件用三种方式把这件事讲清楚：
 *     1) **真实 API**：structuredClone 是 Node 17+ 的全局函数，与浏览器同源同实现，
 *        所以"什么能传、什么不能传"这一节是货真价实的实测，不是模拟。
 *     2) **模拟**：用 EventEmitter 思想手写一个 MessageBus，把 postMessage 的
 *        targetOrigin 校验、BroadcastChannel 的"发送者收不到"、
 *        storage 事件的"只有别人收到"这些**语义规则**完整复现出来。
 *     3) **真实 API**：Node 的 worker_threads 提供了真正的跨上下文 postMessage，
 *        本文件用 `new Worker(code, { eval: true })` 起一个真实的 Worker 线程，
 *        演示真实的跨线程消息传递、结构化克隆与 ArrayBuffer 转移。
 *        （Node 也确实有 BroadcastChannel，但它在 worker_threads 模块里，
 *         只在 Worker 之间工作，同线程的两个实例收不到彼此。）
 *
 * 【运行方法】
 *   node 27_web_apis/13_cross_context_messaging.js
 *
 * 【预期输出】
 *   五个部分：structuredClone 的能力清单实测、postMessage 的同源校验模拟、
 *   BroadcastChannel 的广播语义模拟、storage 事件的跨页通知模拟，
 *   以及一个真实的 worker_threads 跨线程通信演示。
 * ============================================================================
 */

import { EventEmitter } from 'node:events';
import { Worker } from 'node:worker_threads';

/** 分节标题 */
function section(title) {
  console.log('');
  console.log('='.repeat(74));
  console.log(title);
  console.log('='.repeat(74));
}

// ===========================================================================
// 第 1 部分：结构化克隆 —— 消息通道上到底能传什么
// ===========================================================================

section('--- 1. 结构化克隆（Structured Clone）能力实测 ---');
console.log('postMessage / BroadcastChannel 传输数据时用的都不是 JSON，而是结构化克隆。');
console.log('结构化克隆 = 把一个对象的所有"数据结构"完整复制一份，连同类型一起带走。');
console.log('下面逐项实测（Node 的 structuredClone 与浏览器是同一套算法）：');
console.log('');

/**
 * 一条测试用例：[名字, 待克隆的值, 描述函数]
 * 注意：描述函数里写 `v instanceof Date + ' / '` 是错的 ——
 * JS 里 + 的优先级高于 instanceof，会先算 `Date + ' / '`（得到字符串），
 * 再拿字符串当 instanceof 的右操作数，抛 TypeError。所以必须给 instanceof 加括号。
 */
const cloneCases = [
  ['普通对象与嵌套数组', { a: 1, b: [1, 2, { c: 3 }] }, (v) => JSON.stringify(v)],
  ['Date（保留类型，不是字符串）', new Date('2024-01-02T03:04:05Z'), (v) => (v instanceof Date) + ' / ' + v.toISOString()],
  ['RegExp（保留 flags）', /ab+c/gi, (v) => (v instanceof RegExp) + ' / ' + v.source + ' / ' + v.flags],
  ['Map（保留键值对结构）', new Map([['k', { v: 1 }]]), (v) => (v instanceof Map) + ' / size=' + v.size],
  ['Set', new Set([1, 2, 3]), (v) => (v instanceof Set) + ' / size=' + v.size],
  ['ArrayBuffer（二进制）', new ArrayBuffer(4), (v) => (v instanceof ArrayBuffer) + ' / byteLength=' + v.byteLength],
  ['Uint8Array（保留类型化数组类型）', new Uint8Array([1, 2, 3]), (v) => v.constructor.name + ' / [' + v.join(',') + ']'],
  ['Blob', new Blob(['x'], { type: 'text/plain' }), (v) => v.constructor.name + ' / size=' + v.size + ' / ' + v.type],
  ['File', new File(['x'], 'a.txt', { type: 'text/plain' }), (v) => v.constructor.name + ' / name=' + v.name],
  ['Error（连类型一起复制）', new Error('boom'), (v) => (v instanceof Error) + ' / ' + v.message],
  ['BigInt', 10n, (v) => typeof v + ' / ' + String(v)],
  ['undefined', undefined, () => 'undefined'],
  ['NaN', NaN, (v) => String(v)],
  ['-0（负零被完整保留）', -0, (v) => 'Object.is(-0) = ' + Object.is(v, -0)],
  ['Number 包装对象（保留包装类型）', new Number(5), (v) => typeof v + ' / instanceof Number = ' + (v instanceof Number)],
  ['class 实例（能克隆，但原型丢失）', new (class Point { constructor() { this.x = 1; } })(), (v) => 'constructor.name = ' + v.constructor.name + ' / 原型是 Object.prototype = ' + (Object.getPrototypeOf(v) === Object.prototype)],
];

for (const [name, value, describe] of cloneCases) {
  try {
    const cloned = structuredClone(value);
    console.log('  ✓ ' + name.padEnd(32) + ' → ' + describe(cloned));
  } catch (err) {
    console.log('  ✗ ' + name.padEnd(32) + ' → 抛错：' + err.name);
  }
}

console.log('');
console.log('下面这些**不能**克隆（浏览器里同样会抛 DataCloneError）：');
const notCloneable = [
  ['函数', () => {}],
  ['Symbol', Symbol('s')],
  ['WeakMap / WeakSet', new WeakMap()],
  ['Promise', Promise.resolve(1)],
  ['Proxy', new Proxy({}, {})],
];
for (const [name, value] of notCloneable) {
  try {
    structuredClone(value);
    console.log('  ✓ ' + name.padEnd(32) + ' → 居然克隆成功了（本环境行为不同）');
  } catch (err) {
    console.log('  ✗ ' + name.padEnd(32) + ' → ' + err.name + ': ' + err.message);
  }
}
// DOM 节点在浏览器里也属于"不可克隆"，但 Node 没有 DOM，无法实测，只能文字说明。
console.log('  ✗ ' + 'DOM 节点（浏览器中不可克隆）'.padEnd(28) + ' → DataCloneError（Node 无 DOM，无法实测）');
console.log('    所以想"把一个元素发给另一个标签页"，必须先把它序列化成 HTML 字符串。');
console.log('    同理，事件对象 event 本身也只有在同一次事件派发里有效，不能长期保存。');

console.log('');
console.log('两个"不报错但会丢东西"的坑：');
const withSymbolKey = { [Symbol('hidden')]: 'v', normal: 1 };
console.log('  · Symbol 作为属性键 → 克隆后丢失：' + JSON.stringify(structuredClone(withSymbolKey)));
const withGetter = {
  _v: 1,
  get computed() {
    return this._v * 10;
  },
};
const clonedGetter = structuredClone(withGetter);
const desc = Object.getOwnPropertyDescriptor(clonedGetter, 'computed');
console.log('  · getter → 被"求值成普通属性"，克隆后 computed =', clonedGetter.computed,
  '，是否还是 getter =', typeof desc.get === 'function');

console.log('');
console.log('循环引用：结构化克隆能正确处理，而 JSON.stringify 会直接抛错。');
const cyclic = { name: '根' };
cyclic.self = cyclic; // 指向自己
const clonedCyclic = structuredClone(cyclic);
console.log('  structuredClone 成功，且 cloned.self === cloned →', clonedCyclic.self === clonedCyclic, '（结构被忠实还原）');
try {
  JSON.stringify(cyclic);
  console.log('  JSON.stringify 居然没报错？');
} catch (err) {
  console.log('  JSON.stringify 则在循环引用上抛错：' + err.name + ': ' + err.message);
}

console.log('');
console.log('结构化克隆 vs JSON 深拷贝 对比：');
// 注意：不要用 padEnd 对齐含中文的表格 —— 中文是全角字符，终端里占 2 列，
// 而 JS 的 length / padEnd 按 UTF-16 码元计数（中文算 1），必然错位。
// 所以这里改成"每个用例占几行"的竖排格式。
const compareCases = [
  ['Date 对象', new Date('2024-01-02T03:04:05Z')],
  ['undefined 属性', { a: undefined, b: 1 }],
  ['Map', new Map([['k', 1]])],
  ['BigInt', { n: 10n }],
];
for (const [name, value] of compareCases) {
  const viaJson = (() => {
    try {
      return JSON.stringify(JSON.parse(JSON.stringify(value)));
    } catch (err) {
      return '抛错 ' + err.name;
    }
  })();
  let viaClone = '';
  try {
    const c = structuredClone(value);
    viaClone = c instanceof Date ? 'Date(' + c.toISOString() + ')'
      : c instanceof Map ? 'Map(size=' + c.size + ')'
        : JSON.stringify(c, (k, v) => (typeof v === 'bigint' ? String(v) + 'n' : v));
  } catch (err) {
    viaClone = '抛错 ' + err.name;
  }
  console.log('  · ' + name);
  console.log('      JSON.parse(JSON.stringify(x)) → ' + viaJson + (name === 'Date 对象' ? '（日期退化成字符串）' : ''));
  console.log('      structuredClone(x)           → ' + viaClone);
}

// ===========================================================================
// 第 2 部分：postMessage —— 点对点，靠 targetOrigin 约束
// ===========================================================================

section('--- 2. postMessage：点对点通信与 targetOrigin 校验 ---');

/**
 * 模拟一个"浏览上下文"（可以理解成一个标签页 / iframe / 弹窗）。
 * 真实浏览器里这是 Window 对象；这里只保留通信需要的部分：
 *   - origin：本上下文的源（协议 + 域名 + 端口）
 *   - name  ：给上下文起的名字，方便打印
 *   - 收消息时会触发 message 事件（用 EventEmitter 实现）
 */
class BrowserContext extends EventEmitter {
  /**
   * @param {string} name 上下文名字（如 '标签页A'）
   * @param {string} origin 该上下文的源，如 'https://app.example.com'
   */
  constructor(name, origin) {
    super();
    this.name = name;
    this.origin = origin;
    this.received = []; // 收到过的消息，便于最后汇总
  }

  /**
   * 发送消息给另一个上下文。对应浏览器里的 otherWindow.postMessage(...)。
   * @param {BrowserContext} target 目标上下文
   * @param {*} message 任意可结构化克隆的数据
   * @param {string} targetOrigin 只允许这个源的文档收到；'*' 表示不限制
   * @returns {boolean} 是否真的投递成功
   */
  postMessage(target, message, targetOrigin) {
    // --- 第一步：结构化克隆。克隆失败就直接抛错，消息根本发不出去 ---
    let clonedData;
    try {
      clonedData = structuredClone(message);
    } catch (err) {
      console.log(`  [${this.name}] ✗ 发送失败：消息无法被结构化克隆（${err.name}: ${err.message}）`);
      console.log('    浏览器里同样会抛 DataCloneError —— 消息通道只认结构化克隆支持的类型。');
      return false;
    }

    // --- 第二步：targetOrigin 校验 ---
    // 这是浏览器的安全闸门：如果目标上下文的源与 targetOrigin 不匹配，
    // 消息会被**静默丢弃**（不报错、也不通知发送方）。这是故意的，
    // 以免发送方通过"报错与否"探测出目标页面的真实来源。
    if (targetOrigin !== '*' && targetOrigin !== target.origin) {
      console.log(`  [${this.name}] → [${target.name}] 消息被丢弃：` +
        `targetOrigin="${targetOrigin}" 与目标源 "${target.origin}" 不匹配`);
      return false;
    }

    if (targetOrigin === '*') {
      console.log(`  [${this.name}] ⚠ 使用了 targetOrigin:"*"，任何来源都能收到这条消息 —— 生产环境不要这么写`);
    }

    // --- 第三步：异步投递。（浏览器里 postMessage 是异步的，
    //     消息会进入目标上下文的"posted message 队列"，在当前任务结束后才派发） ---
    const event = {
      type: 'message',
      data: clonedData,
      origin: this.origin, // 注意：origin 是**发送方**的源，由浏览器填，不能伪造
      source: this,
      lastEventId: '',
    };
    queueMicrotask(() => {
      target.emit('message', event);
    });
    return true;
  }

  /** 注册 message 监听（等价于 window.addEventListener('message', fn)） */
  onMessage(handler) {
    this.on('message', handler);
  }

  /** 打印一条消息的完整信息，用于演示 */
  logMessage(event) {
    const short = typeof event.data === 'object' && event.data !== null
      ? JSON.stringify(event.data, (k, v) => (v instanceof Set ? Array.from(v) : v))
      : String(event.data);
    console.log(`  [${this.name}] 收到消息：data=${short}`);
    console.log(`            event.origin=${event.origin}（发送方的源） event.source=${event.source.name}`);
    this.received.push({ data: event.data, origin: event.origin });
  }
}

// 造三个上下文：两个同源标签页 + 一个不同源的页面
const tabA = new BrowserContext('标签页A', 'https://app.example.com');
const tabB = new BrowserContext('标签页B', 'https://app.example.com');
const evil = new BrowserContext('第三方页面', 'https://evil.example.com');

// ---- 正确姿势：接收方校验 event.origin ----
tabB.onMessage((event) => {
  // 第一件事永远是校验来源！否则任何页面都能给你下命令。
  if (event.origin !== 'https://app.example.com') {
    console.log(`  [${tabB.name}] ✗ 拒绝来自 ${event.origin} 的消息（origin 校验不通过）`);
    return;
  }
  tabB.logMessage(event);
});

// ---- 反面教材：不校验 origin ----
evil.onMessage((event) => {
  console.log(`  [${evil.name}] 收到消息（这个页面根本没有校验 origin，来什么收什么）`);
  evil.logMessage(event);
});

console.log('场景：A 给 B 发消息，targetOrigin 写对了；再给 evil 发，targetOrigin 写错了。');
console.log('');

// 一个小工具：冲刷微任务，让上一条 postMessage 的消息真正派发出去
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

// ① A → B，targetOrigin 正确
console.log('① tabA.postMessage(tabB, {...}, "https://app.example.com")');
tabA.postMessage(tabB, { type: 'greeting', text: '你好 B' }, 'https://app.example.com');
await flush();

// ② A → evil，但 targetOrigin 写的是自己的源 —— 不匹配，消息被静默丢弃
console.log('');
console.log('② tabA.postMessage(evil, {...}, "https://app.example.com")  ← targetOrigin 写的是 app 的源');
tabA.postMessage(evil, { type: 'secret', token: 'abc123' }, 'https://app.example.com');
await flush();
console.log('   注意：发送方不会收到任何"失败"提示，消息就这么消失了（浏览器故意如此）。');
console.log('   因为如果"失败会报错"，第三方页面就能靠报错与否探测出目标页面的真实来源。');
console.log('   这正体现了 targetOrigin 的作用：它保护的是**接收方**不被第三方塞消息，');
console.log('   同时也让不小心用错 targetOrigin 的消息发不出去，避免泄漏。');

// ③ 用 '*' —— 谁都能收到
console.log('');
console.log('③ tabA.postMessage(evil, {...}, "*")  ← 用了通配符');
tabA.postMessage(evil, { type: 'public', text: '这条不敏感' }, '*');
await flush();
console.log('   如果这条消息里带着 token / 用户信息，就已经泄漏给第三方了。');

// ④ 发送函数（不可克隆）—— 直接失败
console.log('');
console.log('④ tabA.postMessage(tabB, { run: () => {} }, "...")  ← 消息里含函数');
tabA.postMessage(tabB, { run: () => {} }, 'https://app.example.com');
await flush();

console.log('');
console.log('小结：');
console.log('  · postMessage 的数据必须能结构化克隆 —— 函数、Symbol、DOM 节点都不行；');
console.log('  · targetOrigin 决定"消息能到达哪些源"，写错就静默丢弃；');
console.log('  · 接收方**必须**自己校验 event.origin，这是防跨站消息注入的第一道防线；');
console.log('  · event.origin / event.source 由浏览器填写，发送方无法伪造。');

// ===========================================================================
// 第 3 部分：BroadcastChannel —— 同源广播
// ===========================================================================

section('--- 3. BroadcastChannel：同源广播（发送者收不到自己的消息） ---');

/**
 * 模拟 BroadcastChannel。
 * 关键语义（与真实实现一致）：
 *   1) 按"频道名 + 源"分组，同一个频道里的所有实例都能收到消息；
 *   2) **发送者自己不会收到**自己发的消息；
 *   3) 不同源即使频道名相同也互相隔离；
 *   4) close() 之后不再接收。
 */
class FakeBroadcastChannel {
  /** 全局频道注册表：key 是 "源|频道名"，value 是订阅者集合 */
  static registry = new Map();

  /**
   * @param {string} name 频道名
   * @param {string} origin 当前上下文的源
   */
  constructor(name, origin) {
    this.name = name;
    this.origin = origin;
    this.closed = false;
    this.onmessage = null; // 与真实 API 同名：channel.onmessage = fn
    this._handler = null;
    this._key = origin + '|' + name;
    if (!FakeBroadcastChannel.registry.has(this._key)) {
      FakeBroadcastChannel.registry.set(this._key, new Set());
    }
    // 登记自己
    FakeBroadcastChannel.registry.get(this._key).add(this);
    console.log(`  [频道 ${name}] 新建 BroadcastChannel（源=${origin}），当前订阅者数 = ` +
      FakeBroadcastChannel.registry.get(this._key).size);
  }

  /** 发送消息给同源同频道的**其他**实例 */
  postMessage(message) {
    if (this.closed) {
      console.log(`  [频道 ${this.name}] 已 close()，postMessage 无效`);
      return;
    }
    let cloned;
    try {
      cloned = structuredClone(message);
    } catch (err) {
      console.log(`  [频道 ${this.name}] ✗ 消息无法结构化克隆：${err.name}`);
      return;
    }

    const subscribers = FakeBroadcastChannel.registry.get(this._key) || new Set();
    let delivered = 0;
    for (const ch of subscribers) {
      // 关键语义：发送者自己不会被回调
      if (ch === this) continue;
      if (ch.closed) continue;
      delivered += 1;
      // 异步派发（真实实现也是如此）
      queueMicrotask(() => {
        const event = { type: 'message', data: cloned, origin: this.origin };
        if (typeof ch.onmessage === 'function') ch.onmessage(event);
        if (ch._handler) ch._handler(event);
      });
    }
    if (delivered === 0) {
      console.log(`  [频道 ${this.name}] 消息已发出，但当前没有其他订阅者（发送者自己不会收到）。`);
    }
  }

  /** 等价于 addEventListener('message', fn) */
  addEventListener(type, handler) {
    if (type === 'message') this._handler = handler;
  }

  /** 关闭频道：不再接收任何消息 */
  close() {
    this.closed = true;
    const set = FakeBroadcastChannel.registry.get(this._key);
    if (set) set.delete(this);
    console.log(`  [频道 ${this.name}] 已 close()，剩余订阅者 = ${set ? set.size : 0}`);
  }
}

// 三个同源标签页 + 一个不同源页面，都用同名频道 'auth'
const chA = new FakeBroadcastChannel('auth', 'https://app.example.com');
const chB = new FakeBroadcastChannel('auth', 'https://app.example.com');
const chC = new FakeBroadcastChannel('auth', 'https://app.example.com');
const chEvil = new FakeBroadcastChannel('auth', 'https://evil.example.com');
console.log('  （注意最后一个用的是同名频道，但源不同）');
console.log('');

chA.onmessage = (e) => console.log(`  [A 收到] ${JSON.stringify(e.data)}`);
chB.onmessage = (e) => console.log(`  [B 收到] ${JSON.stringify(e.data)}`);
chC.onmessage = (e) => console.log(`  [C 收到] ${JSON.stringify(e.data)}`);
chEvil.onmessage = (e) => console.log(`  [不同源的页面收到] ${JSON.stringify(e.data)}  ← 不该出现`);

console.log('A 广播一条"用户已登出"的消息：');
chA.postMessage({ type: 'logout', at: '2024-01-02T03:04:05Z' });
await new Promise((resolve) => setTimeout(resolve, 0));

console.log('');
console.log('观察结果：B 和 C 收到了，A 自己没收到 —— 这就是 BroadcastChannel 的语义。');
console.log('『发送者收不到自己的消息』是刻意的设计：它逼你把"发送"和"处理"分开，');
console.log('  避免"自己广播、自己又响应一遍"导致的重复执行。');
console.log('  如果确实需要自己也处理，就显式地写完 postMessage 后再调用一次处理函数。');

console.log('');
console.log('C 关闭频道后再广播：');
chC.close();
chA.postMessage({ type: 'settings-changed', theme: 'dark' });
await new Promise((resolve) => setTimeout(resolve, 0));
console.log('  C 已经 close()，所以只看到 B 收到。');

console.log('');
console.log('典型用途：');
console.log('  · 多标签页同步登录/登出状态；');
console.log('  · 主题切换、语言切换在所有标签页同时生效；');
console.log('  · 通知其他标签页"数据已更新，请重新拉取"（比轮询省太多）。');
console.log('局限：只能同源；无法跨设备；页面关闭后频道就没了（没有持久化）。');

// ===========================================================================
// 第 4 部分：storage 事件 —— 顺带的跨页通知
// ===========================================================================

section('--- 4. storage 事件：localStorage 改动时的自动广播 ---');

/**
 * 模拟一个共享的 localStorage（同一个源下的所有标签页共用同一份存储）
 * + 每个上下文自己的一份"storage 事件监听器"。
 *
 * 关键语义（与真实实现一致）：
 *   1) 存储是**按源共享**的，同源的所有标签页看到同一份数据；
 *   2) 某个标签页改了数据，浏览器会给**同源的其他**标签页派发 storage 事件；
 *   3) **发起修改的那个标签页自己收不到**；
 *   4) 写入相同的值不会触发事件；
 *   5) clear() 时 event.key === null。
 */
class FakeLocalStorage {
  constructor() {
    this.data = new Map();
    this.listeners = new Map(); // origin → [handler]
  }

  /** 注册某个上下文的 storage 监听器 */
  addListener(origin, name, handler) {
    if (!this.listeners.has(origin)) this.listeners.set(origin, []);
    this.listeners.get(origin).push({ name, handler });
  }

  /**
   * 写入。
   * @param {string} origin 发起写入的上下文所在的源
   * @param {string} writerName 发起写入的上下文名字（用于演示"自己收不到"）
   */
  setItem(origin, writerName, key, value) {
    const oldValue = this.data.has(key) ? this.data.get(key) : null;
    if (oldValue === value) {
      console.log(`  [${writerName}] setItem("${key}", "${value}") → 值没变，**不触发** storage 事件`);
      return;
    }
    this.data.set(key, value);
    console.log(`  [${writerName}] setItem("${key}", "${value}") → 数据已写入共享存储`);
    this._dispatch(origin, writerName, key, oldValue, value);
  }

  removeItem(origin, writerName, key) {
    if (!this.data.has(key)) {
      console.log(`  [${writerName}] removeItem("${key}") → 本来就不存在，不触发事件`);
      return;
    }
    const oldValue = this.data.get(key);
    this.data.delete(key);
    console.log(`  [${writerName}] removeItem("${key}")`);
    this._dispatch(origin, writerName, key, oldValue, null);
  }

  clear(origin, writerName) {
    this.data.clear();
    console.log(`  [${writerName}] clear() → 清空全部`);
    // 注意：clear() 时 event.key 是 null
    this._dispatch(origin, writerName, null, null, null);
  }

  /** 派发 storage 事件：只给同源、且不是发起者的上下文 */
  _dispatch(origin, writerName, key, oldValue, newValue) {
    const handlers = this.listeners.get(origin) || [];
    let count = 0;
    for (const { name, handler } of handlers) {
      if (name === writerName) continue; // 发起者自己收不到
      count += 1;
      queueMicrotask(() => {
        handler({ key, oldValue, newValue, url: origin + '/index.html', storageArea: this });
      });
    }
    console.log(`    → 浏览器把 storage 事件派发给同源的另外 ${count} 个上下文` +
      `（发起者 ${writerName} 自己不会收到）`);
  }
}

const sharedStorage = new FakeLocalStorage();

/** 打印 storage 事件的监听结果 */
function reportStorageEvent(name) {
  return (e) => {
    console.log(`  [${name} 收到 storage 事件] key=${JSON.stringify(e.key)} ` +
      `oldValue=${JSON.stringify(e.oldValue)} newValue=${JSON.stringify(e.newValue)}`);
    if (e.key === null) {
      console.log('             key === null 是 clear() 的特征 —— 表示"存储被整个清空了"。');
    }
  };
}

sharedStorage.addListener('https://app.example.com', '标签页1', reportStorageEvent('标签页1'));
sharedStorage.addListener('https://app.example.com', '标签页2', reportStorageEvent('标签页2'));
sharedStorage.addListener('https://app.example.com', '标签页3', reportStorageEvent('标签页3'));
sharedStorage.addListener('https://other.example.com', '别的站点', reportStorageEvent('别的站点'));

console.log('场景：三个同源标签页 + 一个异源页面都监听了 storage 事件。');
console.log('');

console.log('① 标签页1 写入 token');
sharedStorage.setItem('https://app.example.com', '标签页1', 'token', 'abc123');
await new Promise((resolve) => setTimeout(resolve, 0));

console.log('');
console.log('② 标签页1 把 token 改成同样的值');
sharedStorage.setItem('https://app.example.com', '标签页1', 'token', 'abc123');
await new Promise((resolve) => setTimeout(resolve, 0));

console.log('');
console.log('③ 标签页2 写入主题');
sharedStorage.setItem('https://app.example.com', '标签页2', 'theme', 'dark');
await new Promise((resolve) => setTimeout(resolve, 0));

console.log('');
console.log('④ 标签页1 清空全部存储');
sharedStorage.clear('https://app.example.com', '标签页1');
await new Promise((resolve) => setTimeout(resolve, 0));

console.log('');
console.log('特别注意：整个过程中「别的站点」一次都没收到 —— 因为源不同，');
console.log('          浏览器根本不会把 app.example.com 的存储事件派发给它。');

console.log('');
console.log('关于 event 对象的字段：');
console.log('  key        → 变动的键名（clear() 时为 null）');
console.log('  oldValue   → 旧值（新增时为 null）');
console.log('  newValue   → 新值（删除时为 null）');
console.log('  url        → 发生变动的那个文档的 URL');
console.log('  storageArea → 就是 localStorage 对象（sessionStorage 的改动也会触发同一事件，用它区分）');

console.log('');
console.log('storage 事件 vs BroadcastChannel —— 怎么选？');
console.log('  · storage 事件：只能在 localStorage 被改时"顺带"触发，消息必须是字符串，');
console.log('    会持久化到磁盘。适合"顺带同步一下状态"。');
console.log('  · BroadcastChannel：专门为通信设计，能传结构化克隆的任意数据，不留痕迹，');
console.log('    语义清晰（有 close）。适合"就是要发消息"。');
console.log('  · 需要兼容很老的浏览器时，业界常用 localStorage + storage 事件来模拟广播频道。');

// ===========================================================================
// 第 5 部分：Node 里真实的跨上下文通信 —— worker_threads
// ===========================================================================

section('--- 5. Node 中真实的跨上下文 postMessage（worker_threads） ---');
console.log('前面几节的 postMessage / BroadcastChannel / storage 都是"按语义模拟"的。');
console.log('但 Node 其实有**真实的**跨上下文通信：worker_threads。');
console.log('每个 Worker 就是一个独立的 JS 上下文（有自己的 V8 隔离区、自己的事件循环），');
console.log('与浏览器的标签页/iframe 在"隔离 + 消息传递"这一点上完全对等。');
console.log('');

// Worker 的代码：它会在一个全新的线程里执行。
// eval: true 表示把这段字符串当脚本直接跑；默认按 CommonJS 解析，所以能用 require。
const workerCode = `
const { parentPort, workerData } = require('node:worker_threads');

// workerData 是创建 Worker 时传进来的初始数据（同样走结构化克隆）
parentPort.postMessage({ type: 'ready', got: workerData, from: 'worker' });

// 监听主线程发来的消息，原样回显并附上自己的"上下文信息"
parentPort.on('message', (msg) => {
  parentPort.postMessage({
    type: 'echo',
    echo: msg,
    receivedType: Object.prototype.toString.call(msg),
    byteLength: msg instanceof ArrayBuffer ? msg.byteLength : null,
  });
});
`;

const worker = new Worker(workerCode, {
  eval: true,
  // workerData 会把这份数据"结构化克隆"后交给 Worker，
  // 主线程与 Worker 从此各持一份独立副本，互不影响。
  workerData: { taskId: 'job-42', payload: new Uint8Array([1, 2, 3]) },
});

worker.on('error', (err) => console.log('  Worker 出错：', err.name, err.message));

/** 等 Worker 的下一条消息（带上超时保护，避免万一卡死） */
function nextMessage(workerRef, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('等待 ' + label + ' 超时')), 5000);
    workerRef.once('message', (msg) => {
      clearTimeout(timer);
      resolve(msg);
    });
  });
}

// ① 等 Worker 上报"我起来了"
const ready = await nextMessage(worker, 'ready');
console.log('① 收到 Worker 的 ready 消息：');
console.log('   type =', ready.type, '，from =', ready.from);
console.log('   workerData 原样送达：taskId =', ready.got.taskId,
  '，payload = Uint8Array[' + Array.from(ready.got.payload).join(',') + ']');
console.log('   （workerData 也走结构化克隆，所以 Uint8Array 的类型被完整保留）');

// ② 主线程发一条复杂消息过去，Worker 回显
console.log('');
const complexMessage = new Map([['user', '张三'], ['roles', new Set(['admin', 'dev'])]]);
console.log('② 主线程 postMessage 一个 Map（含 Set）给 Worker……');
worker.postMessage(complexMessage);
const echo = await nextMessage(worker, 'echo');
console.log('   Worker 回显：receivedType =', echo.receivedType);
console.log('   内容：', JSON.stringify(Array.from(echo.echo, ([k, v]) => [k, v instanceof Set ? Array.from(v) : v])));
console.log('   → 注意 Map / Set 都完整穿过了线程边界，这是结构化克隆的功劳（JSON 做不到）。');

// ③ 发一个函数：直接抛 DataCloneError
console.log('');
console.log('③ 主线程 postMessage 一个函数给 Worker……');
try {
  worker.postMessage(() => 'hello');
  console.log('   居然成功了？（本环境行为不同）');
} catch (err) {
  console.log('   ✗ ' + err.name + ': ' + err.message);
  console.log('   → 与浏览器完全一致：函数不可克隆，消息发不出去。');
}

// ④ ArrayBuffer 转移所有权（零拷贝）
console.log('');
console.log('④ ArrayBuffer 的"转移"（transfer）—— 零拷贝地把大块内存交给对方');
const buffer = new ArrayBuffer(1024);
new Uint8Array(buffer)[0] = 0xab;
console.log('   转移前：主线程这边的 byteLength =', buffer.byteLength);
worker.postMessage(buffer, [buffer]); // 第二个参数是 transferList
console.log('   转移后：主线程这边的 byteLength =', buffer.byteLength, '← 变成 0 了！');
console.log('   为什么？因为所有权已经交给 Worker 了，同一块内存不能两边同时持有，');
console.log('   所以浏览器/Node 直接把原 buffer "清零"（neutered）。');
const transferred = await nextMessage(worker, 'transferred');
console.log('   Worker 那边收到的 byteLength =', transferred.byteLength,
  '，首字节 = 0x' + new Uint8Array(transferred.echo)[0].toString(16));
console.log('   → 传 100MB 的二进制时，transfer 可以避免整块内存的复制，性能差距巨大。');

// 清理：终止 Worker
await worker.terminate();
console.log('');
console.log('已 worker.terminate() 结束 Worker 线程。');
console.log('（Worker 被强制终止时 exit code 可能是 1，这是正常现象，不是错误。）');

// ===========================================================================
// 第 6 部分：总结
// ===========================================================================

section('--- 6. 三种通道对比总结 ---');

const channels = [
  ['postMessage', '点对点（窗口 ↔ 窗口 / 主线程 ↔ Worker）', 'targetOrigin 限制可达范围；接收方必须校验 event.origin', 'iframe 通信、弹窗交互、Worker 任务'],
  ['BroadcastChannel', '同源广播（一对一频道名）', '同源 + 发送者收不到自己的消息', '多标签页状态同步、通知其他页刷新数据'],
  ['storage 事件', '同源广播（隐式，由写操作触发）', '同源 + 发送者收不到 + 值的必须真的变化', '多标签页同步登录态、主题、草稿'],
];

for (const [name, scope, rule, use] of channels) {
  console.log(`· ${name}`);
  console.log(`    通信范围：${scope}`);
  console.log(`    安全/语义约束：${rule}`);
  console.log(`    典型用途：${use}`);
}

console.log('');
console.log('三条通道的共同点：');
console.log('  1) 数据都要经过结构化克隆 —— 能传的很多（Map/Set/Date/Blob/循环引用），');
console.log('     不能传的也很明确（函数/Symbol/DOM 节点/Promise/Proxy）；');
console.log('  2) 都是异步投递，不要指望 postMessage 之后立刻在对方那里读到；');
console.log('  3) 都有"源"的边界 —— 同源策略是这一切的地基。');
console.log('');
console.log('一句话记忆：');
console.log('  postMessage 是"寄快递"（写清收件地址 targetOrigin，收件人验明发件人 origin）；');
console.log('  BroadcastChannel 是"大喇叭"（同源的人都能听见，喊的人自己听不见）；');
console.log('  storage 事件是"储物柜响了一声"（谁动了柜子，同源的其他人都会收到提醒）。');
