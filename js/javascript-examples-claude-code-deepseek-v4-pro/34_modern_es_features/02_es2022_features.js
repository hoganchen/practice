/**
 * ============================================================================
 * 知识点：ES2022 新特性 —— .at()、Object.hasOwn、error.cause、类字段与静态块、d 标志、顶层 await
 * ============================================================================
 *
 * 【所属分类】34_modern_es_features —— 现代 ES 新特性
 * 【难度等级】进阶
 * 【前置知识】08_arrays/、11_strings/、14_classes/、20_error_handling/、19_modules/
 *
 * 【也见】类字段 / 私有字段 / 静态块另见 14_classes/04_class_fields.js、05_private_fields.js、03_static_members.js。
 *        那三个文件是「类成员系统」的主场（专文逐项讲，含完整初始化顺序与继承细节）；
 *        本文件是"ES2022 特性综述"，类字段只占其中一节。想看细节请以 14_classes/ 为准。
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    ES2022（第 13 版 ECMAScript 标准，2022 年 6 月发布）是内容非常丰富的一版：
 *      (1) Array.prototype.at / String.prototype.at —— 支持负索引
 *      (2) Object.hasOwn() —— 替代 Object.prototype.hasOwnProperty.call
 *      (3) Error 的 cause 选项 —— 错误链
 *      (4) 类实例公有字段 / 私有字段（#x）
 *      (5) 私有方法与私有访问器
 *      (6) 静态初始化块 static { }
 *      (7) 正则 d 标志（匹配索引 indices）
 *      (8) 模块顶层 await（ESM only）
 *
 * 2. 为什么需要（真实项目场景）
 *    - 取最后一个元素：以前 `arr[arr.length - 1]` 又长又容易写错，现在 `arr.at(-1)`。
 *    - 遍历对象自身属性：`Object.keys(obj).includes(k)` 会漏掉不可枚举属性，
 *      且从原型链上 fork 出来的对象容易误判；`Object.hasOwn` 才是正确且安全的写法。
 *    - 错误链：底层抛"连接超时"，上层包一层"加载用户失败"，用 cause 保留原始错误，
 *      排查时可一路 print 下去，不用把堆栈塞进 message 字符串。
 *    - 类字段：React/Vue 组件、DTO、状态机里大量使用，省掉 constructor 里的样板赋值。
 *    - 私有字段 #：真正的"硬私有"（语言级），外部访问是语法错误，而不是靠 _ 下划线约定。
 *    - 静态块：类里需要一次性计算的静态配置、需要 try/catch 的静态初始化。
 *    - d 标志：需要拿到"捕获组在原文中的起止下标"时（语法高亮、模板引擎、日志脱敏）。
 *    - 顶层 await：模块初始化时读配置、连数据库，不用再包一层 async IIFE。
 *
 * 3. 核心语法要点
 *    - `arr.at(i)`：i 为负数时从末尾数，`-1` 是最后一个；越界返回 undefined（不抛错）。
 *    - `Object.hasOwn(obj, key)`：只查自身属性，不查原型链，等价于
 *      `Object.prototype.hasOwnProperty.call(obj, key)`，但对 `Object.create(null)` 也安全。
 *    - `new Error(message, { cause })`：cause 可以是任意值，错误的 cause 属性保存它。
 *    - 实例字段：`class A { x = 1; #y = 2; }`，每个实例独立初始化，在构造函数体之前执行。
 *    - 私有成员语法：`#name`，只能在类体内访问；`#m(){}` 是私有方法；
 *      `static #s` 是私有静态字段；还可用 `in` 运算符做存在性检测：`#x in obj`。
 *    - `static { ... }`：类定义求值时按书写顺序执行一次，可访问私有静态成员。
 *    - `/(?<y>\d{4})/d`：匹配结果多出 `indices` 属性，`indices[0]` 是整体匹配的 [start, end]。
 *    - 顶层 await：只在 ESM 中可用，让模块的求值"等待"一个 Promise。
 *
 * 4. 常见陷阱
 *    - `.at(-1)` 对空数组返回 undefined，不是抛错；而 `arr[-1]` 永远是 undefined，
 *      两者都不该直接拿去调方法。
 *    - `Object.hasOwn` 只检查"自身"，继承来的属性返回 false；
 *      `in` 运算符会查原型链，二者语义不同，别混用。
 *    - cause 不会自动出现在 stack 里，需要自己打印 `err.cause`。
 *    - 类字段是在 constructor 的 super() 之后、constructor 体之前按序初始化；
 *      箭头函数字段因此可以自动绑定 this。
 *    - 私有字段必须"先声明后使用"：访问未声明的 `this.#x` 是语法错误，
 *      而不是运行时 undefined。
 *    - static 块的执行时机是"类定义被求值时"，早于任何实例创建。
 *    - d 标志不影响匹配行为，只是额外提供 indices；未参与匹配的组，
 *      其 indices 位置是 undefined。
 *    - 顶层 await 会让整个模块变成异步模块，导入方也会被"拖住"，
 *      滥用会拖慢启动、甚至造成循环依赖死锁。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 34_modern_es_features/02_es2022_features.js
 *
 * 【预期输出】
 *   依次打印 8 个小节，覆盖 ES2022 的 8 组特性；每个特性都标注"本机支持：是/否"。
 *   本机 Node v24.16.0 全部原生支持。
 * ============================================================================
 */

console.log('='.repeat(70));
console.log('ES2022 新特性演示');
console.log('当前 Node 版本：', process.version);
console.log('='.repeat(70));

// ---------------------------------------------------------------------------
console.log('\n--- 1. Array/String.prototype.at()：负索引取值 ---');
// ---------------------------------------------------------------------------

const atSupported = typeof [].at === 'function' && typeof ''.at === 'function';
console.log('本机支持：' + (atSupported ? '是' : '否'));

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 以前怎么写：想取最后一个元素必须算长度
const oldLast = weekdays[weekdays.length - 1];
// 倒数第二个就更啰嗦了
const oldSecondLast = weekdays[weekdays.length - 2];
console.log('以前（arr[arr.length - 1]）：', oldLast, '/', oldSecondLast);

// 现在怎么写：负索引直接表示"从末尾数"
console.log('现在（arr.at(-1)）：', weekdays.at(-1));
console.log('现在（arr.at(-2)）：', weekdays.at(-2));
console.log('正索引行为与 [] 一致：arr.at(0) =', weekdays.at(0), '，arr[0] =', weekdays[0]);
console.log('越界返回 undefined（不抛错）：arr.at(99) =', weekdays.at(99));

// String.prototype.at 同理，而且对含 emoji 的字符串更友好（按 UTF-16 码元取）
const greeting = 'Hello, 世界';
console.log('字符串 at(0)：', greeting.at(0), '| at(-1)：', greeting.at(-1), '| at(-2)：', greeting.at(-2));

// 为什么 [] 不行？因为 JS 的 [] 本质是属性访问，'-1' 会被当成字符串键名：
console.log("arr['-1'] 拿不到东西：", weekdays[-1], '（undefined，因为键名是字符串 "-1"）');

// 实用场景：取路径最后一段
const filePath = 'src/components/Button/index.js';
console.log('路径最后一段：', filePath.split('/').at(-1), '（以前要写 .slice(-1)[0]）');

// ---------------------------------------------------------------------------
console.log('\n--- 2. Object.hasOwn：安全地判断"自身属性" ---');
// ---------------------------------------------------------------------------

const hasOwnSupported = typeof Object.hasOwn === 'function';
console.log('本机支持：' + (hasOwnSupported ? '是' : '否'));

const config = { port: 8080, host: undefined };

// 以前怎么写（有坑）：
//   'toString' in config  -> true，因为原型链上有 toString，误判为"有"
console.log("陷阱：'toString' in config =", 'toString' in config, '← in 会查原型链');
//   主流老写法是借助 Object.prototype.hasOwnProperty.call(...)
const oldWay = Object.prototype.hasOwnProperty.call(config, 'port');
console.log('以前（hasOwnProperty.call）：', oldWay);

// 现在怎么写：
console.log("现在（Object.hasOwn）：'port' →", Object.hasOwn(config, 'port'));
console.log("现在（Object.hasOwn）：'host' →", Object.hasOwn(config, 'host'), '← 值为 undefined，但键存在，所以是 true');
console.log("现在（Object.hasOwn）：'toString' →", Object.hasOwn(config, 'toString'), '← 正确排除原型链');

// 为什么不用 obj.hasOwnProperty(k) 直接调用？
// 因为对象可能自身就覆盖了 hasOwnProperty，或者根本没有原型：
const evil = Object.create(null);
evil.hasOwnProperty = 'not a function';
try {
  // evil.hasOwnProperty('hasOwnProperty') 会抛 TypeError
  evil.hasOwnProperty('x');
} catch (err) {
  console.log('陷阱演示（对象覆盖了 hasOwnProperty）→', err.constructor.name + ':', err.message);
}
console.log('Object.hasOwn 对无原型对象也安全：', Object.hasOwn(evil, 'hasOwnProperty'));

// 与 Object.keys 的关系：keys 已经只返回自身可枚举属性，二者的典型配合写法
const ownKeys = Object.keys(config).filter((k) => Object.hasOwn(config, k));
console.log('Object.keys 本身就只含自身可枚举属性：', ownKeys);

// ---------------------------------------------------------------------------
console.log('\n--- 3. error.cause：错误链（error chaining）---');
// ---------------------------------------------------------------------------

// 特性检测：Error 构造器的 options 参数是 ES2022 新增的
let causeSupported = false;
try {
  const probe = new Error('probe', { cause: 'x' });
  causeSupported = probe.cause === 'x';
} catch {
  causeSupported = false;
}
console.log('本机支持：' + (causeSupported ? '是' : '否'));

// 模拟三层调用：数据库层 -> 仓储层 -> 应用层
function queryDatabase() {
  // 底层错误：真正的根因
  throw new Error('ECONNREFUSED 127.0.0.1:5432');
}

function loadUser(id) {
  try {
    queryDatabase();
  } catch (err) {
    // 以前怎么写：把原始信息拍扁塞进 message，或者自定义一个 .originalError 属性
    // throw new Error(`加载用户 ${id} 失败: ${err.message}`);
    // 坏处：丢失了原始堆栈，且 message 一旦要结构化就变成字符串拼接地狱。
    throw new Error(`加载用户 #${id} 失败`, { cause: err });
  }
}

try {
  loadUser(42);
} catch (err) {
  console.log('最外层捕获：', err.message);
  console.log('  err.cause 是 Error 吗：', err.cause instanceof Error);
  console.log('  根因 message：', err.cause.message);
  // 沿着 cause 链一路向下遍历，是所有日志框架/APM 的标准做法
  let depth = 0;
  let cur = err;
  while (cur) {
    console.log(`  链[${depth}] ${cur.message}`);
    cur = cur.cause;
    depth++;
  }
  console.log('  链总长度：', depth);
}

// cause 可以是任意值（不限于 Error）
console.log('cause 可以是字符串：', new Error('包装', { cause: '原始字符串' }).cause);
console.log('cause 可以是对象：', JSON.stringify(new Error('包装', { cause: { code: 500 } }).cause));

// 工程实践：上层抛出业务错误、保留技术根因，是最推荐的错误处理姿势
//   throw new BizError('支付失败，请稍后重试', { cause: technicalErr });
// 这样前端展示语文文案、后端日志保留技术细节，两不耽误。

// ---------------------------------------------------------------------------
console.log('\n--- 4. 类公有/私有实例字段 ---');
// ---------------------------------------------------------------------------

let classFieldsSupported = false;
try {
  // eslint-disable-next-line no-new-func
  classFieldsSupported = new Function('class A { x = 1; } return new A().x;')() === 1;
} catch {
  classFieldsSupported = false;
}
console.log('本机支持：' + (classFieldsSupported ? '是' : '否'));

// --- 以前怎么写：所有实例属性都要在 constructor 里逐个 this.xxx = xxx ---
class OldCounter {
  constructor(start) {
    this.count = start;
    this.history = []; // 每个实例各自一份
    // 想在构造时调个方法，还得注意顺序
  }
  increment() {
    this.count++;
    this.history.push(this.count);
    return this.count;
  }
}
console.log('以前（constructor 赋值）：', new OldCounter(0).increment());

// --- 现在怎么写：字段声明直接写在类体里 ---
class Counter {
  // 公有实例字段：每个实例创建时独立初始化，等于把 constructor 里的赋值提出来
  count = 0;
  history = [];
  // 字段也可以用其他字段/构造参数以外的表达式初始化
  createdAt = Date.now();
  // 箭头函数字段：自动绑定 this，非常适合做回调传出去
  incrementArrow = () => {
    this.count++;
    this.history.push(this.count);
    return this.count;
  };

  // 私有字段：以 # 开头，类外部访问会直接语法报错
  #secret = 'internal-only';

  constructor(start = 0) {
    // 注意：字段初始化发生在 constructor 体之前（有 extends 时在 super() 之后）
    this.count = start;
  }

  // 公有方法：在原型上，所有实例共享同一份
  increment() {
    this.count++;
    this.history.push(this.count);
    return this.count;
  }

  getSecret() {
    return this.#secret;
  }
}

const c1 = new Counter(10);
const c2 = new Counter(10);
c1.increment();
c1.history.push(999);
console.log('c1.history：', c1.history, '| c2.history：', c2.history, '← 每个实例的字段互相独立');
console.log('箭头函数字段可安全解构传递：');
const loose = c1.incrementArrow;
loose(); // 如果 increment 是普通方法，这样调用 this 会丢
console.log('  c1.count 变为：', c1.count);
const looseNormal = c1.increment;
try {
  looseNormal(); // 普通方法脱离对象调用，this 是 undefined（严格模式）
} catch (err) {
  console.log('  普通方法脱离对象调用 →', err.constructor.name + ':', err.message);
}

console.log('私有字段只能通过类内方法访问：', c1.getSecret());
console.log('外部直接读 c1.#secret 会怎样？');
// 下面是语法错误，注释掉以免整个文件无法运行：
// console.log(c1.#secret);  // SyntaxError: Private field '#secret' must be declared in an enclosing class

// ---------------------------------------------------------------------------
console.log('\n--- 5. 私有方法与私有访问器 ---');
// ---------------------------------------------------------------------------

// 私有方法用 #method(){} 声明；私有访问器用 get #x() / set #x(v)
// 私有成员最大的价值：可以"改名重构"而不用担心外部有人依赖它，
// 因为外部根本写不出访问它的代码（连 eval/字符串索引都拿不到）。

class BankAccount {
  #balance;
  #pin;
  #auditLog = [];

  constructor(balance, pin) {
    this.#balance = balance;
    this.#pin = pin;
  }

  // 私有方法：内部校验逻辑
  #verify(pin) {
    return pin === this.#pin;
  }

  // 私有 getter：内部只读派生值
  get #balanceInCents() {
    return Math.round(this.#balance * 100);
  }

  // 私有 setter：内部带校验的赋值
  set #safeBalance(v) {
    if (v < 0) throw new RangeError('余额不能为负');
    this.#balance = v;
  }

  #record(action) {
    this.#auditLog.push(action);
  }

  // 公有 API 只是私有实现的"薄壳"
  withdraw(pin, amount) {
    if (!this.#verify(pin)) {
      this.#record('withdraw: 密码错误');
      throw new Error('密码错误');
    }
    try {
      this.#safeBalance = this.#balance - amount; // 走私有 setter 校验
      this.#record(`withdraw: ${amount}`);
      return this.#balance;
    } catch (err) {
      this.#record(`withdraw: 失败(${err.message})`);
      throw err;
    }
  }

  getStatement() {
    return {
      balance: this.#balance,
      cents: this.#balanceInCents, // 走私有 getter
      log: [...this.#auditLog],
    };
  }
}

const acct = new BankAccount(100, '1234');
console.log('正确密码取款后余额：', acct.withdraw('1234', 30));
try {
  acct.withdraw('0000', 10);
} catch (err) {
  console.log('错误密码 →', err.message);
}
try {
  acct.withdraw('1234', 9999);
} catch (err) {
  console.log('超额取款 →', err.constructor.name + ':', err.message);
}
console.log('对账单：', acct.getStatement());

// 私有成员无法被"反射"出来：Object.keys / JSON.stringify / Object.getOwnPropertyNames 都看不到 # 字段
console.log('Object.keys(实例)：', Object.keys(acct), '← 完全看不到 # 私有字段');
console.log('JSON.stringify(实例)：', JSON.stringify(acct), '← 同上');
console.log('私有方法不在原型上：', Object.getOwnPropertyNames(BankAccount.prototype));

// ---------------------------------------------------------------------------
console.log('\n--- 6. 静态块 static { } ---');
// ---------------------------------------------------------------------------

// 静态块在"类定义被求值"时执行一次，可以访问私有静态成员，
// 且允许 try/catch —— 这是静态字段初始化表达式做不到的。

const staticBlockOrder = [];

class AppConfig {
  // 静态公有字段
  static VERSION = '1.0.0';
  // 静态私有字段
  static #env = process.env.NODE_ENV ?? 'development';
  static #secrets = {};

  // 静态块：可以做流程控制、try/catch、循环，比纯表达式灵活得多
  static {
    staticBlockOrder.push('static block #1 执行');
    // 根据环境挑不同的配置
    if (AppConfig.#env === 'production') {
      AppConfig.#secrets = { apiBase: 'https://api.example.com' };
    } else {
      AppConfig.#secrets = { apiBase: 'http://localhost:3000' };
    }
  }

  static {
    staticBlockOrder.push('static block #2 执行');
    // 静态块里能写 try/catch —— 这是字段初始化表达式做不到的
    try {
      AppConfig.TIMEOUT = Number(process.env.APP_TIMEOUT ?? '3000');
      if (Number.isNaN(AppConfig.TIMEOUT)) throw new TypeError('APP_TIMEOUT 不是数字');
    } catch (err) {
      console.log('  静态块内部兜底：', err.message, '→ 使用默认值 3000');
      AppConfig.TIMEOUT = 3000;
    }
  }

  static get env() {
    return AppConfig.#env;
  }
  static get apiBase() {
    return AppConfig.#secrets.apiBase;
  }
}

console.log('静态块按书写顺序执行：', staticBlockOrder);
console.log('静态字段可读：VERSION =', AppConfig.VERSION, '| env =', AppConfig.env);
console.log('静态块里算出的配置：apiBase =', AppConfig.apiBase, '| TIMEOUT =', AppConfig.TIMEOUT);
console.log('静态块在实例创建之前就执行完了，所以天然适合做"类级"的初始化。');

// ---------------------------------------------------------------------------
console.log('\n--- 7. 正则 d 标志：match indices（匹配下标）---');
// ---------------------------------------------------------------------------

let dFlagSupported = false;
try {
  dFlagSupported = new RegExp('a', 'd').hasIndices === true;
} catch {
  dFlagSupported = false;
}
console.log('本机支持：' + (dFlagSupported ? '是' : '否'));

// --- 以前怎么写：想知道捕获组在原文中的位置，只能靠 exec 返回的 index + 手工算偏移 ---
const datePattern = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
const logLine = 'user=alice login_at=2024-03-15 status=ok';
const oldMatch = datePattern.exec(logLine);
// 手工算：整体匹配从 oldMatch.index 开始，但某个捕获组在哪儿？只能再 indexOf 找一遍
const yearText = oldMatch.groups.year;
const manualIndex = logLine.indexOf(yearText, oldMatch.index);
console.log('以前（exec + indexOf 手工定位）：', yearText, '位置约', manualIndex);

// --- 现在怎么写：加 d 标志，结果多出 indices ---
const dPattern = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/d;
const m = dPattern.exec(logLine);
console.log('现在（d 标志）：', m[0]);
console.log('  m.indices[0]（整体匹配的 [start, end)）：', m.indices[0]);
console.log('  按组名取位置：m.indices.groups.year =', m.indices.groups.year);
console.log('  按序号取位置：m.indices[1] =', m.indices[1]);
console.log('  用下标切出原文验证：', logLine.slice(...m.indices.groups.year));

// 未参与匹配的组，其 indices 是 undefined（不是 [0,0]）
const optionalPattern = /(?<num>\d+)?(?<tail>[a-z]+)/d;
const m2 = optionalPattern.exec('abc');
console.log('未参与匹配的组：m2.indices.groups.num =', m2.indices.groups.num, '（undefined）');
console.log('已参与匹配的组：m2.indices.groups.tail =', m2.indices.groups.tail);

// 真实场景 1：语法高亮 —— 需要知道每个 token 的起止位置
const code = 'const x = 42;';
const tokenPattern = /(?<kw>\b(?:const|let|var)\b)|(?<num>\b\d+\b)/gd;
const tokens = [];
for (const tm of code.matchAll(tokenPattern)) {
  const kind = tm.groups.kw ? 'keyword' : 'number';
  tokens.push({ text: tm[0], kind, range: tm.indices[0] });
}
console.log('语法高亮 token：', JSON.stringify(tokens));

// 真实场景 2：日志脱敏时替换指定区间
console.log('日志脱敏：', logLine.slice(0, m.indices.groups.day[0]) + '[已脱敏]');

// ---------------------------------------------------------------------------
console.log('\n--- 8. 顶层 await（top-level await）简介 ---');
// ---------------------------------------------------------------------------

// 顶层 await 只能在 ESM（ES Module）中使用。本仓库 package.json 里 "type": "module"，
// 所以本文件就是 ESM，可以直接在最外层写 await，不需要包 async IIFE。
console.log('本示例能运行到这一行，本身就证明顶层 await 生效了（本机支持：是）');

// --- 以前怎么写（CommonJS 时代 / 或不想用 TLA 时）---
// (async () => {
//   const cfg = await loadConfig();
//   main(cfg);
// })();
// 缺点：① 多一层缩进；② 外部无法知道"模块何时初始化完成"，
//       容易出现"配置还没读完，别处已经开始用了"的竞态。

// --- 现在怎么写：直接 await ---
const delay = (ms, value) => new Promise((r) => setTimeout(() => r(value), ms));

// 模拟"模块初始化时读远程配置"，其它模块 import 本模块时会自动等待这一步完成
const remoteConfig = await delay(10, { feature: 'top-level-await', enabled: true });
console.log('顶层 await 拿到的配置：', remoteConfig);

// 顶层 await + try/catch：注意失败时要自己处理，否则整个模块加载失败
let dbReady = false;
try {
  await delay(10, null);
  dbReady = true;
} catch {
  dbReady = false;
}
console.log('初始化成功标记：', dbReady);

// 典型用法：并行初始化多个资源，再一起等
const [a, b] = await Promise.all([delay(5, 'A 就绪'), delay(10, 'B 就绪')]);
console.log('并行初始化：', a, '/', b);

console.log('\n' + '='.repeat(70));
console.log('ES2022 全部小节演示完毕，进程正常退出（退出码 0）');
console.log('='.repeat(70));
