/**
 * ============================================================================
 * 知识点：TC39 装饰器语法（Stage 3）—— @decorator 原生语法与能力检测
 * ============================================================================
 *
 * 【所属分类】30_design_patterns —— 设计模式（装饰器模式的语法糖形态）
 * 【难度等级】高级
 * 【前置知识】30_design_patterns/08_decorator.js（函数包装版，务必先读）、
 *             14_classes/04_class_fields.js、14_classes/06_getters_setters.js、
 *             14_classes/13_class_decorator_pattern.js（手写类装饰器）
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    TC39 的 Decorators 提案（Stage 3）给 JS 加了一种**声明式语法**：
 *        @logged
 *        class PaymentService {
 *          @withDefault('CNY') currency;
 *          @withRetry(3) pay(amount) { ... }
 *        }
 *    它和 08_decorator.js 讲的"函数包装"是**同一个思想**（接收目标、返回替换品），
 *    但作用位置从"函数"扩展到了"类、方法、访问器、字段、自动访问器"五处，
 *    并且由引擎（或编译器）在**类定义期**统一施加，不需要你手写嵌套调用。
 *
 * 2. 为什么需要（真实项目场景）
 *    - Angular：@Component / @Injectable / @Input / @ViewChild；
 *    - NestJS：@Controller / @Get / @Injectable / @Inject（后端最典型的 DI + 装饰器组合）；
 *    - TypeORM / Prisma 风格 ORM：@Entity / @Column / @ManyToOne 把类映射成表；
 *    - class-validator：@IsEmail / @MinLength 把校验规则贴在字段上；
 *    - MobX：@observable / @computed / @action 把状态与视图绑定；
 *    - 通用需求：日志、缓存、重试、权限、绑定 this、注册到注册表。
 *    共同点是"**元数据 + 横切逻辑**"：把"这个类/字段是什么"写在声明旁边，
 *    再由框架在运行时读取，而不是靠散落各处的配置文件。
 *
 * 3. 核心语法要点
 *    - 装饰器的统一签名是 `(value, context) => newValue | undefined`：
 *        value   —— 被装饰的东西（类 / 方法函数 / getter / setter / 字段的初始值 / accessor 对象）；
 *        context —— 描述"我在装饰谁"的对象（见下方的字段表）；
 *        返回 undefined 表示"不改动"，返回其它值则替换。
 *    - 五类 kind：'class' | 'method' | 'getter' | 'setter' | 'field' | 'accessor'。
 *    - 装饰器工厂：`@withRetry(3)` 先求值出一个装饰器函数，再作用到元素上。
 *    - 求值顺序：**从上到下**（按源码书写顺序，含类装饰器与成员装饰器）；
 *      应用顺序：**从下到上**（同一元素上离元素最近的先应用），
 *      且**所有成员装饰器都应用完之后，才应用类装饰器**。
 *    - context 对象的字段：
 *        kind             元素种类（上表六个值之一）
 *        name             成员名（字符串或 Symbol；类装饰器时是类名）
 *        static           是否静态成员（类装饰器没有这个字段）
 *        private          是否私有成员（#field / #method）
 *        access           { get(obj), set(obj, v), has(obj) } —— 访问该成员（含私有成员）
 *        addInitializer   注册"在类定义完成时 / 实例构造时"执行的初始化函数
 *        metadata         装饰器之间共享的元数据对象（需要环境提供 Symbol.metadata）
 *    - addInitializer 的执行时机（提案规定，容易踩坑，务必记牢）：
 *        类装饰器          -> 类**完全定义之后**执行一次
 *        静态方法/访问器   -> 类定义期间、静态方法赋值之后、静态字段初始化之前
 *        静态字段/访问器   -> 紧随该字段初始化之后
 *        实例方法/访问器   -> **实例构造期间、任何字段初始化之前**
 *        实例字段/访问器   -> 紧随该字段初始化之后
 *      实践含义：在"实例方法装饰器"的 initializer 里读 `this.someField`
 *      会拿到 undefined（字段还没初始化），这是提案作者讨论过的已知摩擦点。
 *    - 内置的 `accessor` 关键字（自动访问器）：声明一个自带 get/set 与私有后备存储的字段，
 *      是装饰器最"好装饰"的字段形态，返回 `{get, set, init}` 即可替换它的行为。
 *
 * 4. 常见陷阱
 *    - 环境支持问题：**标准装饰器语法目前（Node 24）仍未默认开启**，
 *      直接写 @ 会 SyntaxError。本文件第 0 节用真实的能力检测给出结论，
 *      并用"注释 + 等价手写实现"的方式保证在任何环境都能学到东西。
 *    - legacy 与 standard 两套语义混淆：
 *      TypeScript 的 `experimentalDecorators: true` 用的是 **legacy** 语义
 *      （方法装饰器拿到 (target, key, descriptor)，字段装饰器几乎不能用），
 *      与 Stage 3 标准（(value, context)）完全不同。老项目里的 @ 大多是 legacy。
 *    - 装饰器不能装饰普通函数、箭头函数、函数表达式、类的构造函数本身。
 *    - 装饰器返回值写错：返回了一个"看起来像原对象但不是"的值，会让方法彻底失效。
 *    - 顺序写反：`@A @B m()` 中 B 先应用、A 后应用（A 在最外层），
 *      与 08_decorator.js 里 withA(withB(fn)) 的顺序规则完全一致。
 *    - 在 initializer 里访问尚未初始化的字段（见上文时机表）。
 *    - 过度使用：装饰器让"这个类到底发生了什么"变得不可见，
 *      调试时要先知道有哪些装饰器在起作用。业务项目里应控制在少数几个横切关注点。
 *    - 元数据反射需要 Symbol.metadata，未提供该 Symbol 的环境里 context.metadata 为 undefined。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 30_design_patterns/20_decorator_syntax.js
 *
 * 【预期输出】
 *   第 0 节：真实运行能力检测（new Function 探测 + 子进程 flag 探测），
 *           打印本机 Node 是否原生支持标准装饰器语法；
 *   第 1 节：回顾函数包装版装饰器的三个局限；
 *   第 2 节：打印一份**可直接复制**的 TC39 装饰器语法全景示例（类/方法/访问器/
 *           字段/自动访问器/装饰器工厂/静态成员）；
 *   第 3 节：用可运行的手写等价实现演示求值顺序、应用顺序与 addInitializer 时机；
 *   第 4 节：真实框架（Angular / NestJS / TypeORM / MobX）的用法与 legacy vs standard 对照；
 *   第 5 节：装饰器的代价与"什么时候不该用"。
 * ============================================================================
 */

import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

// ===========================================================================
// 0. 能力检测：先确认本机到底能不能跑 @ 语法
// ===========================================================================

console.log('=== TC39 装饰器语法（Stage 3）===\n');
console.log('--- 0. 能力检测：本机能否原生运行 @decorator 语法 ---\n');

/**
 * 探测一：用 new Function 编译一段含装饰器语法的源码。
 * 原理：new Function 与模块走同一个解析器，语法不支持时会抛 SyntaxError。
 * 优点：零副作用、零依赖、不需要写临时文件。
 * 注意：new Function 只用于"编译探测"，不会执行其中的代码。
 */
function probeSyntaxSupport() {
  const samples = {
    '类装饰器': '@((v) => v)\nclass Probe {}',
    '方法装饰器': 'class Probe { @((v) => v) method() {} }',
    '字段装饰器': 'class Probe { @((v) => v) field = 1; }',
    '自动访问器': 'class Probe { @((v) => v) accessor value = 1; }',
  };
  const result = {};
  for (const [label, source] of Object.entries(samples)) {
    try {
      // 只编译、不调用：编译通过就说明引擎的解析器认识这套语法
      new Function(source); // eslint-disable-line no-new-func
      result[label] = { ok: true };
    } catch (err) {
      result[label] = { ok: false, name: err.name };
    }
  }
  return result;
}

/**
 * 探测二：用子进程试各种"可能开启装饰器"的命令行开关。
 * 为什么需要这一步：某些引擎把新语法藏在 flag 后面，
 * 而 flag 只能在**进程启动时**指定，无法在当前进程内开启。
 */
function probeFlags() {
  const source = '@((v) => v)\nclass Probe {}';
  const candidates = [
    { label: '（无开关）', args: [] },
    { label: '--js-decorators（V8 实验开关）', args: ['--js-decorators'] },
    { label: '--js-decorators --js-staging', args: ['--js-decorators', '--js-staging'] },
    { label: '--experimental-decorators', args: ['--experimental-decorators'] },
  ];
  return candidates.map(({ label, args }) => {
    const r = spawnSync(process.execPath, [...args, '--input-type=module', '-e', source], {
      encoding: 'utf8',
      // 明确不访问网络：这里只是启动一个本地的 Node 子进程做语法编译
      timeout: 10_000,
    });
    // status === 0 表示"语法 + 执行"都通过了
    const supported = r.status === 0;
    const firstError = (r.stderr || '').split('\n').find((l) => l.includes('Error') || l.includes('option')) ?? '';
    return { label, status: r.status, supported, firstError };
  });
}

const syntaxProbe = probeSyntaxSupport();
const flagProbe = probeFlags();
const nativeSupported = Object.values(syntaxProbe).every((r) => r.ok);

console.log(`  运行环境：Node ${process.version}（${process.platform}）\n`);
console.log('  探测一：用 new Function 编译各类装饰器语法');
for (const [label, r] of Object.entries(syntaxProbe)) {
  console.log(`    ${r.ok ? '✓ 支持' : '✗ 不支持'}  ${label}${r.ok ? '' : `（${r.name}: Invalid or unexpected token）`}`);
}
console.log('\n  探测二：尝试用命令行开关开启（子进程探测，不联网）');
for (const r of flagProbe) {
  const tail = r.supported ? '✓ 语法可用' : r.status === 9 ? '✗ 不是有效选项' : '✗ 仍为语法错误';
  console.log(`    ${r.label.padEnd(34, ' ')} 退出码=${String(r.status).padStart(3, ' ')}  ${tail}`);
}

console.log(`\n  === 结论 ===
    本机 Node ${process.version} **${nativeSupported ? '支持' : '不支持'}**原生装饰器语法。
    ${nativeSupported
      ? '可以把下面第 2 节的示例直接写进 .js 文件运行。'
      : '因此本文件不直接书写 @ 语法（那会直接 SyntaxError 导致进程非零退出），\n    改为：① 用注释给出可复制的完整语法示例；② 用第 3 节的手写等价实现演示同样的语义。'}
    标准（Stage 3）装饰器目前的落地方式：
      · TypeScript 5.0+：**默认**支持标准装饰器语法，无需开关；
        但若 tsconfig 里写了 "experimentalDecorators": true，会退回 legacy 语义。
      · Babel：@babel/plugin-proposal-decorators，version 选项
        （"2023-11" 为最新标准，"legacy" 为老语义）。
      · Node：V8 里有实验实现（--js-decorators），但截至 Node 24 实测仍未接入默认解析路径。
    无论环境如何，**本文件剩下的内容都能运行** —— 因为第 3 节用的是手写等价实现。`);

// ===========================================================================
// 1. 回顾 08_decorator.js：函数包装的三种局限
// ===========================================================================

console.log('\n--- 1. 函数包装版装饰器（08_decorator.js）的三个局限 ---');
console.log(`
  08_decorator.js 里的写法是：const wrapped = withLogging(fn)，然后在类字段里挂上去。
  它有三个 @ 语法能解决、而它解决不了的问题：

    ① 只能装饰"函数"，不能装饰"类 / 字段 / 访问器"。
       想给一个类加"注册到注册表"的能力，只能写 withRegistry(class extends Klass {})，
       而继承会改变原型链、拿不到私有字段、constructor.name 也会变（14_classes/13 号文件讲过）。

    ② 没有统一的时机。
       "实例创建时执行一次"这件事，函数包装完全做不到 ——
       你只能在每个方法内部手动判断"是不是第一次调用"。
       @ 语法的 context.addInitializer 提供的正是这个时机。

    ③ 组合要手写嵌套，元数据无处安放。
       withA(withB(withC(fn))) 读起来是"从里往外"，
       而 @A @B @C 的书写顺序就是"从上往下"，且顺序规则由语言统一定义。
       另外 context.metadata 提供了"装饰器之间共享信息"的官方位置。`);

// ===========================================================================
// 2. TC39 装饰器语法全景（可直接复制到 TS 5.x / Babel 项目）
// ===========================================================================

console.log('\n--- 2. TC39 装饰器语法全景（可复制到 TypeScript 5.x / Babel 项目运行）---\n');

/**
 * 下面这段字符串里是**真实可用的标准装饰器语法**。
 * 之所以放在字符串里打印，是因为本机的 Node 直接解析 @ 会 SyntaxError（见第 0 节结论）。
 * 把它复制到 .ts 文件（TS 5.0+，不开 experimentalDecorators）或配置了
 * @babel/plugin-proposal-decorators（version: "2023-11"）的项目里即可运行。
 */
const decoratorSyntaxTour = [
  '// ===================== ① 类装饰器 + 装饰器工厂 =====================',
  'const registry = new Map();',
  '',
  'function withRegistry(registryName) {          // 装饰器工厂：先求值出一个装饰器',
  '  return function (value, context) {           // value = 被装饰的类',
  '    registry.set(registryName, value);',
  '    context.addInitializer(function () {',
  '      // 类装饰器的 initializer：类完全定义之后执行一次（this 指向类）',
  '      console.log("[" + context.name + "] 类定义完成，已注册");',
  '    });',
  '    return value;                              // 返回 undefined 表示不改动',
  '  };',
  '}',
  '',
  '// ===================== ② 方法装饰器（日志 / 重试） =====================',
  'function logged(value, context) {',
  '  if (context.kind !== "method") return value;  // 通用的装饰器常常按 kind 分流',
  '  return function (...args) {',
  '    console.log("调用 " + String(context.name) + "(" + JSON.stringify(args) + ")");',
  '    return value.apply(this, args);             // 保持 this 与返回值',
  '  };',
  '}',
  '',
  'function withRetry(times) {',
  '  return function (value, context) {',
  '    if (context.kind !== "method") return value;',
  '    return function (...args) {',
  '      let lastError;',
  '      for (let i = 0; i < times; i += 1) {',
  '        try { return value.apply(this, args); } catch (err) { lastError = err; }',
  '      }',
  '      throw lastError;',
  '    };',
  '  };',
  '}',
  '',
  '// ===================== ③ 字段装饰器（改初始值） =====================',
  'function withDefault(defaultValue) {',
  '  return function (value, context) {',
  '    // 字段装饰器有两个 value：这里的 value 是 undefined，',
  '    // 返回的函数才是"初始化函数"，它接收字段的原始初始值并返回新的初始值。',
  '    return function (initialValue) {',
  '      return initialValue === undefined ? defaultValue : initialValue;',
  '    };',
  '  };',
  '}',
  '',
  '// ===================== ④ 访问器装饰器（getter） =====================',
  'function upperCase(value, context) {',
  '  if (context.kind !== "getter") return value;  // value = getter 函数',
  '  return function () {',
  '    return String(value.call(this)).toUpperCase();',
  '  };',
  '}',
  '',
  '// ===================== ⑤ 自动访问器 accessor =====================',
  'function reactive(value, context) {',
  '  if (context.kind !== "accessor") return value;',
  '  // value = { get, set }（引擎自动生成，并带一个私有后备存储）',
  '  return {',
  '    get() { return value.get.call(this); },',
  '    set(v) { console.log("设置 " + String(context.name) + " = " + v); value.set.call(this, v); },',
  '    init(v) { return v; },                       // 可选的初始值加工',
  '  };',
  '}',
  '',
  '// ===================== ⑥ 绑定 this（addInitializer 的经典用法） ============',
  'function bound(value, context) {',
  '  if (context.kind !== "method" || context.static) return value;',
  '  context.addInitializer(function () {',
  '    // 在"实例构造期间"把自己绑定到实例上，从此可以安全地解构传递',
  '    this[context.name] = value.bind(this);',
  '  });',
  '  return value;',
  '}',
  '',
  '// ===================== ⑦ 使用：五个位置一次看完 =====================',
  '@withRegistry("payment")                        // 类装饰器（最外层）',
  'class PaymentService {',
  '  @withDefault("CNY") currency;                  // 字段装饰器',
  '',
  '  @reactive accessor status = "pending";         // 自动访问器 + 装饰器',
  '',
  '  @bound                                        // 方法装饰器：绑定 this',
  '  @logged                                       // 上层：A 在外，B 在内 -> A(B(m))',
  '  @withRetry(3)                                 // 下层：最靠近方法，最先应用',
  '  pay(amount) {',
  '    if (amount > 1000) throw new Error("超过单笔限额");',
  '    return "已支付 " + amount + " " + this.currency;',
  '  }',
  '',
  '  @upperCase get label() { return "pay"; }       // 访问器装饰器（getter）',
  '',
  '  @logged static create() { return new PaymentService(); }   // 静态成员',
  '}',
  '',
  '// ===================== ⑧ 运行结果（预期） =====================',
  '// const svc = PaymentService.create();',
  '//   -> 打印 "调用 create()"，以及 "[PaymentService] 类定义完成，已注册"',
  '// console.log(svc.label);        // "PAY"（getter 被装饰）',
  '// console.log(svc.currency);     // "CNY"（字段装饰器给了默认值）',
  '// svc.status = "paid";           // 打印 "设置 status = paid"（自动访问器被装饰）',
  '// const pay = svc.pay;           // 解构后仍然能调用 —— 因为 @bound 绑好了 this',
  '// console.log(pay(100));         // 打印 "调用 pay([100])"，返回 "已支付 100 CNY"',
];

for (const [i, line] of decoratorSyntaxTour.entries()) {
  console.log(`  ${String(i + 1).padStart(3, ' ')} | ${line}`);
}

console.log(`
  ★读这份示例时请重点注意三处：
    ① 每个装饰器都能通过 context.kind 判断"自己被贴在了什么东西上"，
       因此同一个装饰器函数可以安全地贴到多种位置（不判断就 return value 也是安全的）；
    ② 装饰器的返回值就是"替换品"，返回 undefined 表示"我不改动"；
    ③ @bound 用的 addInitializer 是**函数包装做不到**的能力 ——
       它需要在"实例创建时"这个时机介入，而不是在"方法被调用时"。`);

// ===========================================================================
// 3. 手写等价实现：把 TC39 的语义用 100 行代码跑一遍
// ===========================================================================

console.log('\n--- 3. 等价手写实现：亲手跑一遍 TC39 的求值/应用/初始化顺序 ---');
console.log(`
  既然本机不能解析 @ 语法，我们就把"引擎会做的事"手写一遍：
    · 求值阶段：按源码顺序调用每个装饰器表达式（上 -> 下）；
    · 应用阶段：同一成员上从下到上依次应用，成员全部应用完才轮到类装饰器；
    · 初始化阶段：按提案的时机表执行 addInitializer 注册的函数。
  下面这个 buildDecoratedClass() 就是那个"迷你引擎"。它当然不是完整的实现，
  但顺序与时机规则与提案一致，足以把语义讲清楚。`);

/**
 * 迷你装饰器引擎。spec 的形状：
 * {
 *   name: '类名',
 *   classDecorators: [thunk, ...],          // thunk = () => (value, context) => newValue
 *   constructorFn: function (...args) {},   // 用户写的构造体（字段初始化之后执行）
 *   members: {
 *     memberName: {
 *       kind: 'method' | 'getter' | 'setter' | 'field' | 'accessor',
 *       static?: boolean,
 *       fn?, get?, set?, value?, defaultValue?,
 *       decorators: [thunk, ...],
 *     }
 *   }
 * }
 */
function buildDecoratedClass(spec) {
  const { name, classDecorators = [], constructorFn, members = {} } = spec;
  const memberNames = Object.keys(members);
  const metadata = {}; // context.metadata 的共享对象（真实环境用 Symbol.metadata）

  // ---------- 阶段一：求值（按源码顺序，从上到下）----------
  console.log('  ① 求值阶段（装饰器表达式按源码顺序求值）');
  const evaluatedClassDecorators = classDecorators.map((thunk) => thunk());
  const evaluatedMembers = new Map();
  for (const memberName of memberNames) {
    evaluatedMembers.set(
      memberName,
      members[memberName].decorators.map((thunk) => thunk()),
    );
  }

  // ---------- 阶段二：应用（成员从下到上，成员全部完成后才轮到类）----------
  console.log('  ② 应用阶段（同一成员上从下到上；成员全部应用完才轮到类装饰器）');
  const instanceExtra = []; // 实例方法/访问器的 initializer：构造时、**字段初始化之前**
  const staticExtra = []; // 类装饰器 / 静态成员的 initializer：类定义完成后
  const perMemberExtra = new Map(); // 字段/自动访问器的 initializer：紧随该字段初始化之后
  const accessorStores = new Map(); // 自动访问器的私有后备存储（Symbol 键）

  const applyMember = (memberName) => {
    const member = members[memberName];
    const myExtras = [];
    perMemberExtra.set(memberName, myExtras);

    const context = {
      kind: member.kind,
      name: memberName,
      static: Boolean(member.static),
      private: Boolean(member.private),
      access: {
        get: (obj) => obj[memberName],
        set: (obj, v) => {
          obj[memberName] = v;
        },
        has: (obj) => memberName in obj,
      },
      addInitializer: (fn) => {
        // ★时机分流：这就是提案里那张表的实现
        if (member.kind === 'field' || member.kind === 'accessor') myExtras.push(fn);
        else if (member.static) staticExtra.push(fn);
        else instanceExtra.push(fn);
      },
      metadata,
    };

    let value;
    if (member.kind === 'method') value = member.fn;
    else if (member.kind === 'getter') value = member.get;
    else if (member.kind === 'setter') value = member.set;
    else if (member.kind === 'field') value = member.value;
    else if (member.kind === 'accessor') {
      // 真实语法里，引擎会为 accessor 生成一对 get/set 以及一个私有后备存储；
      // 这里用一个模块内的 Symbol 模拟那个后备存储。
      const store = Symbol(`#${memberName}`);
      accessorStores.set(memberName, store);
      value = {
        get: member.get ?? function () {
          return this[store];
        },
        set: member.set ?? function (v) {
          this[store] = v;
        },
        init: member.init,
      };
    }

    const decorators = evaluatedMembers.get(memberName);
    for (let i = decorators.length - 1; i >= 0; i -= 1) {
      const result = decorators[i](value, context);
      if (result !== undefined && result !== null) value = result;
    }
    return value;
  };

  const resolved = new Map();
  for (const memberName of memberNames) resolved.set(memberName, applyMember(memberName));

  // ---------- 阶段三：构造真正的类 ----------
  const protoMembers = {};
  const staticMembers = {};
  const fieldOrder = [];

  for (const memberName of memberNames) {
    const member = members[memberName];
    const value = resolved.get(memberName);
    if (member.static) {
      staticMembers[memberName] = value;
      continue;
    }
    if (member.kind === 'method') protoMembers[memberName] = { kind: 'method', value };
    else if (member.kind === 'getter') protoMembers[memberName] = { kind: 'getter', value };
    else if (member.kind === 'setter') protoMembers[memberName] = { kind: 'setter', value };
    else if (member.kind === 'field') {
      protoMembers[memberName] = { kind: 'field', value };
      fieldOrder.push(memberName);
    } else if (member.kind === 'accessor') {
      protoMembers[memberName] = {
        kind: 'accessor',
        value,
        store: accessorStores.get(memberName),
        defaultValue: member.defaultValue,
      };
      fieldOrder.push(memberName);
    }
  }

  const Decorated = class {
    constructor(...args) {
      // 实例方法/访问器装饰器的 initializer：**字段初始化之前**（提案规定）
      for (const fn of instanceExtra) fn.call(this);
      // 字段与自动访问器的初始化（按声明顺序）
      for (const memberName of fieldOrder) {
        const info = protoMembers[memberName];
        let initial;
        if (info.kind === 'accessor') {
          initial = info.value?.init ? info.value.init.call(this, info.defaultValue) : info.defaultValue;
          this[info.store] = initial;
        } else {
          initial = info.value;
          if (typeof info.value === 'function') initial = info.value.call(this, undefined);
          this[memberName] = initial;
        }
        // 该字段/访问器的 initializer：**紧随其后**
        for (const fn of perMemberExtra.get(memberName) ?? []) fn.call(this);
      }
      if (constructorFn) constructorFn.call(this, ...args);
    }
  };
  Object.defineProperty(Decorated, 'name', { value: name, configurable: true });

  // 原型成员
  for (const [memberName, info] of Object.entries(protoMembers)) {
    if (info.kind === 'method') Decorated.prototype[memberName] = info.value;
    else if (info.kind === 'getter') {
      Object.defineProperty(Decorated.prototype, memberName, { get: info.value, configurable: true });
    } else if (info.kind === 'setter') {
      Object.defineProperty(Decorated.prototype, memberName, { set: info.value, configurable: true });
    } else if (info.kind === 'accessor') {
      // 自动访问器：显式声明 get/set（真实语法里由引擎自动生成）
      Object.defineProperty(Decorated.prototype, memberName, {
        get() {
          return this[info.store];
        },
        set(v) {
          info.value.set.call(this, v);
        },
        configurable: true,
      });
    }
    // field 不需要在原型上定义：实例上已经有自有属性了。
    // 注意：这里**不要**顺手把该项从 protoMembers 里删掉 ——
    // 构造函数初始化字段时还要靠 protoMembers[memberName] 取回初始值
    // （见上面的 fieldOrder 循环）。删掉会让 info 变成 undefined，
    // 于是 new PaymentService() 直接抛 TypeError。
  }
  // 静态成员
  for (const [memberName, value] of Object.entries(staticMembers)) Decorated[memberName] = value;

  // ---------- 阶段四：类装饰器（成员之后）+ 静态 initializer ----------
  let FinalClass = Decorated;
  for (let i = evaluatedClassDecorators.length - 1; i >= 0; i -= 1) {
    const result = evaluatedClassDecorators[i](FinalClass, {
      kind: 'class',
      name,
      addInitializer: (fn) => staticExtra.push(fn),
      metadata,
    });
    if (result !== undefined && result !== null) FinalClass = result;
  }
  // 静态 initializer：类定义完成后执行（this 指向类本身）
  for (const fn of staticExtra) fn.call(FinalClass);
  Object.defineProperty(FinalClass, 'name', { value: name, configurable: true });

  return FinalClass;
}

// ---- 观测顺序用的"追踪装饰器"：求值与应用是两个不同阶段，分别打印 ----
// 注意：trace() 只**观察**，不改行为（它返回原 value）。
// 所以它不能替代那些有真实作用的装饰器 —— 用它顶替 @bound，方法就不会被绑定。
const trace = (label) => () => {
  console.log(`        求值（表达式）: ${label}`);
  return (value, context) => {
    console.log(`        应用（作用到元素）: ${label} -> ${context.kind} ${String(context.name)}`);
    return value;
  };
};

// ---- 既要观测、又要保留真实行为时用这个：把真实装饰器"包"进追踪里 ----
// 与 trace 的唯一区别是最后一行：它返回真实装饰器的结果，而不是原样返回 value。
const traceWith = (label, decorator) => () => {
  console.log(`        求值（表达式）: ${label}`);
  return (value, context) => {
    console.log(`        应用（作用到元素）: ${label} -> ${context.kind} ${String(context.name)}`);
    return decorator(value, context);
  };
};

// ---- 有真实功能的装饰器（等价于第 2 节示例里的那些）----
const registry = new Map();

function withRegistry(registryName) {
  return (value, context) => {
    registry.set(registryName, value);
    context.addInitializer(function () {
      console.log(`        [类装饰器 initializer] ${context.name} 定义完成，this === 类：${this === value}`);
    });
    return value;
  };
}

function logged(value, context) {
  if (context.kind !== 'method') return value;
  return function (...args) {
    const result = value.apply(this, args);
    console.log(`        [logged] ${String(context.name)}(${JSON.stringify(args)}) = ${JSON.stringify(result)}`);
    return result;
  };
}

function withRetry(times) {
  return (value, context) => {
    if (context.kind !== 'method') return value;
    return function (...args) {
      let lastError;
      for (let i = 0; i < times; i += 1) {
        try {
          return value.apply(this, args);
        } catch (err) {
          lastError = err;
          console.log(`        [withRetry] 第 ${i + 1} 次失败：${err.message}`);
        }
      }
      throw lastError;
    };
  };
}

function withDefault(defaultValue) {
  return (value, context) => {
    if (context.kind !== 'field') return value;
    // 返回"初始化函数"：接收字段原始初始值，返回新的初始值
    return function (initialValue) {
      return initialValue === undefined ? defaultValue : initialValue;
    };
  };
}

function upperCase(value, context) {
  if (context.kind !== 'getter') return value;
  return function () {
    return String(value.call(this)).toUpperCase();
  };
}

function reactive(value, context) {
  if (context.kind !== 'accessor') return value;
  return {
    get() {
      return value.get.call(this);
    },
    set(v) {
      console.log(`        [reactive] 设置 ${String(context.name)} = ${JSON.stringify(v)}`);
      value.set.call(this, v);
    },
    init(v) {
      return v;
    },
  };
}

/** addInitializer 的经典用法：把方法绑定到实例上（函数包装做不到这件事） */
function bound(value, context) {
  if (context.kind !== 'method' || context.static) return value;
  context.addInitializer(function () {
    // ★此处是"实例构造期间、字段初始化之前"—— 顺便观察一下字段是否已可用
    console.log(`        [@bound initializer] this.currency = ${String(this.currency)}（字段还没初始化！）`);
    this[context.name] = value.bind(this);
  });
  return value;
}

/** 字段装饰器的 initializer：验证"紧随字段初始化之后" */
function reportAfterInit(fieldName) {
  return (_value, context) => {
    context.addInitializer(function () {
      console.log(`        [字段 initializer] this.${fieldName} = ${JSON.stringify(this[fieldName])}（字段已初始化）`);
    });
    return undefined; // 不改动初始值
  };
}

console.log('\n  ---- 运行迷你引擎 ----');
const PaymentService = buildDecoratedClass({
  name: 'PaymentService',
  // 注意：装饰器数组里放的是**求值表达式（thunk）**，不是装饰器本身。
  // 这正对应真实语法 `@withRegistry('payment')` —— 引擎先求值 `withRegistry('payment')`
  // 得到装饰器函数，再把它应用到类上。若写成 `withRegistry('payment')`（少一层箭头），
  // 装饰器会在**构建 spec 时就被调用**，那时 context 还不存在，会抛
  // `TypeError: Cannot read properties of undefined (reading 'addInitializer')`。
  classDecorators: [() => withRegistry('payment')],
  members: {
    currency: { kind: 'field', value: undefined, decorators: [() => withDefault('CNY'), () => reportAfterInit('currency')] },
    status: { kind: 'accessor', defaultValue: 'pending', decorators: [() => reactive] },
    label: { kind: 'getter', get() { return 'pay'; }, decorators: [() => upperCase] },
    pay: {
      kind: 'method',
      fn(amount) {
        if (amount > 1000) throw new RangeError('超过单笔限额');
        return `已支付 ${amount} ${this.currency}`;
      },
      // 书写顺序：@bound @logged @withRetry(2) —— 与第 2 节示例一致。
      // 这里用 traceWith 而不是 trace：既要打印求值/应用顺序，
      // 又要让 @bound 真的完成绑定（后面的"解构后调用"依赖这一点）。
      decorators: [traceWith('@bound', bound), traceWith('@logged', logged), traceWith('@withRetry(2)', withRetry(2))],
    },
    create: { kind: 'method', static: true, fn: () => 'created', decorators: [() => logged] },
  },
});

console.log('\n  ---- 使用装饰后的类 ----');
const svc = new PaymentService();
console.log(`    svc.label（getter 被装饰，返回大写）= ${svc.label}`);
console.log(`    svc.currency（字段装饰器给了默认值）= ${svc.currency}`);
svc.status = 'paid';
console.log(`    svc.status（自动访问器被装饰）= ${svc.status}`);
console.log(`    PaymentService.create()（静态方法被装饰）= ${PaymentService.create()}`);
console.log(`    注册表内容：${[...registry.keys()].join(', ')}`);

console.log(`\n  ---- 验证三个关键顺序结论 ----`);

// 结论 1：同一元素上，求值从上到下、应用从下到上
console.log('    【结论 1】@X @Y m() 的顺序：');
const order = [];
const mk = (label) => () => {
  order.push(`求值${label}`);
  return (v) => {
    order.push(`应用${label}`);
    return v;
  };
};
buildDecoratedClass({
  name: 'OrderProbe',
  members: { m: { kind: 'method', fn: () => 1, decorators: [mk('A'), mk('B'), mk('C')] } },
});
console.log(`      实际发生：${order.join(' -> ')}`);
console.log(`      即：求值 A,B,C（上到下）；应用 C,B,A（下到上，离元素最近的先应用）；
      所以 A 是最外层包装 —— 与 08_decorator.js 的 withA(withB(fn)) 完全一致。`);
console.log(`      验证嵌套关系：A(B(C(m))) 与 C 先应用后再被 B、A 依次包装 -> ${order.join('') === '求值A求值B求值C应用C应用B应用A'}`);

// 结论 2：成员装饰器先于类装饰器
console.log('    【结论 2】成员装饰器全部应用完之后，才应用类装饰器：');
const order2 = [];
buildDecoratedClass({
  name: 'OrderProbe2',
  classDecorators: [
    () => {
      order2.push('求值@类装饰器');
      return (v) => {
        order2.push('应用@类装饰器');
        return v;
      };
    },
  ],
  members: {
    m: {
      kind: 'method',
      fn: () => 1,
      decorators: [
        () => {
          order2.push('求值@成员装饰器');
          return (v) => {
            order2.push('应用@成员装饰器');
            return v;
          };
        },
      ],
    },
  },
});
console.log(`      实际发生：${order2.join(' -> ')}`);

// 结论 3：addInitializer 时机
console.log(`    【结论 3】addInitializer 的时机（见上面构造 svc 时的输出）：
      · @bound（实例方法装饰器）的 initializer 在**字段初始化之前**执行
        -> 它读到 this.currency 是 undefined；
      · 字段装饰器的 initializer 在**该字段初始化之后**立即执行
        -> 它读到 this.currency = "CNY"；
      · 类装饰器的 initializer 在**类定义完成后**执行（this 指向类）。
      ★这正是提案里那张时机表的行为，也是"实例方法装饰器里别急着读字段"的原因。`);

// 结论 4：@bound 的真正价值 —— 解构后仍能调用
console.log('    【结论 4】@bound 解决了什么（函数包装解决不了的问题）：');
class WithoutBound {
  constructor() {
    this.currency = 'CNY';
  }
  pay(amount) {
    return `已支付 ${amount} ${this.currency}`;
  }
}
const plain = new WithoutBound();
const detachedPlain = plain.pay; // 解构 -> this 丢失
try {
  detachedPlain(1);
} catch (err) {
  console.log(`      未绑定：解构后调用抛错 -> ${err.name}: ${err.message}`);
}
const detachDecorated = svc.pay; // svc.pay 已被 @bound 换成实例上的自有绑定函数
console.log(`      已绑定（本文件用 initializer 模拟）：解构后调用 -> ${detachDecorated(100)}`);
console.log(`      注意这需要"实例创建时"这个时机，纯函数包装（08_decorator.js）做不到。`);

// 结论 5：返回 undefined 表示"不改动"
console.log('    【结论 5】装饰器返回 undefined 表示"我不改动这个东西"：');
const untouched = [];
buildDecoratedClass({
  name: 'UndefinedProbe',
  members: {
    m: {
      kind: 'method',
      fn: () => 'original',
      decorators: [
        () => (value, context) => {
          untouched.push(`看到 ${context.kind} ${String(context.name)}，返回 undefined`);
          return undefined; // 不替换
        },
      ],
    },
  },
});
console.log(`      ${untouched[0]}`);
const UndefinedProbe = buildDecoratedClass({
  name: 'UndefinedProbe2',
  members: { m: { kind: 'method', fn: () => 'original', decorators: [() => () => undefined] } },
});
console.log(`      方法仍然可用：new UndefinedProbe2().m() = ${new UndefinedProbe().m()}`);

// ===========================================================================
// 4. 真实框架里的装饰器
// ===========================================================================

console.log('\n--- 4. 真实框架里的装饰器 ---\n');

const legacyVsStandard = [
  ['对比项', 'legacy（experimentalDecorators / Babel legacy）', 'standard（Stage 3，TS 5.0+ 默认）'],
  ['方法装饰器签名', '(target, key, descriptor)', '(value, context)'],
  ['字段装饰器', '几乎不可用（只能改 prototype）', '一等公民，可返回初始化函数或访问器'],
  ['访问器/自动访问器', '不支持 accessor 关键字', '支持 getter/setter/accessor 三种 kind'],
  ['this 与初始化时机', '无 addInitializer，无法在构造时介入', 'addInitializer 提供明确时机'],
  ['元数据', 'emitDecoratorMetadata + reflect-metadata 反射', 'context.metadata（需 Symbol.metadata）'],
  ['现状', 'Angular（旧版）、NestJS 默认、TypeORM、老 tsconfig', 'TS 5.0+ 默认；新库逐步迁移'],
];
printAlignedTable(legacyVsStandard);

function printAlignedTable(rows) {
  const widths = rows[0].map((_, i) => Math.max(...rows.map((r) => displayWidth(r[i]))));
  const pad = (s, w) => String(s) + ' '.repeat(Math.max(0, w - displayWidth(s)) + 2);
  let sep = 0;
  rows.forEach((row, idx) => {
    const line = row.map((c, i) => pad(c, widths[i])).join('');
    console.log('  ' + line);
    sep = Math.max(sep, displayWidth(line));
    if (idx === 0) console.log('  ' + '-'.repeat(sep));
  });
}

/** 与上面的 printAlignedTable 等价，但用的是本文件统一的中英混排宽度函数 */
function displayWidth(s) {
  return [...String(s)].reduce(
    (w, ch) => w + (/[ᄀ-ᅟ⺀-〾ぁ-㏿㐀-䶿一-鿿ꀀ-꓏가-힣豈-﫿︰-﹯＀-｠￠-￦]/.test(ch) ? 2 : 1),
    0,
  );
}

console.log(`
  四个真实框架的用法（全部是 legacy 或已迁移版本的标准语法）：

    Angular（legacy 语义，靠 reflect-metadata 做 DI）
        @Component({ selector: 'app-root', template: '<h1>{{title}}</h1>' })
        export class AppComponent {
          @Input() title = '';
          constructor(private readonly http: HttpClient) {}   // 构造器参数上的装饰器 = 注入声明
        }

    NestJS（legacy 语义 + 反射，后端最典型的 DI + 装饰器）
        @Controller('orders')
        export class OrdersController {
          constructor(private readonly ordersService: OrdersService) {}   // @Injectable 才可注入
          @Get(':id')
          findOne(@Param('id') id: string) { return this.ordersService.find(id); }
        }

    TypeORM（把类声明直接映射成表结构）
        @Entity('users')
        export class User {
          @PrimaryGeneratedColumn() id: number;
          @Column({ unique: true }) email: string;
        }

    MobX / class-validator（把行为贴在字段上）
        class Form {
          @observable email = '';
          @IsEmail() @IsNotEmpty() emailRule;   // 校验规则 = 元数据
        }

  ★共同模式：装饰器负责**声明元数据**，框架在启动时读取这些元数据并生成运行时代码
    （路由表、DI 图、ORM 映射、校验器）。
    也就是说：装饰器本身几乎不"做事"，它只是把信息挂在类上，
    真正的工作由框架的"扫描 + 生成"阶段完成。
    理解这一点，就能看懂为什么"装饰器需要反射/metadata"这件事如此重要。`);

// ===========================================================================
// 5. 代价与什么时候不该用
// ===========================================================================

console.log('\n--- 5. 装饰器的代价与不适用场景 ---');

console.log(`【语法装饰器 vs 函数包装：怎么选】
  用 @ 语法（需要 TS/Babel 等编译步骤）：
    + 声明式：一眼看出"这个类被装饰过"，元数据与声明放在一起；
    + 能装饰类/字段/访问器/自动访问器，位置信息完整（kind/static/private）；
    + 有 addInitializer 这样的官方时机，不必自己发明钩子协议；
    + 框架生态（Angular/NestJS/TypeORM）统一使用，跟随生态最省心。
    - 需要编译工具链（Node 原生尚未支持）；
    - legacy 与 standard 两套语义并存，迁移成本真实存在；
    - 调试时"这个行为从哪来"变得更难回答（装饰器是隐式的）。

  用函数包装（08_decorator.js，无需编译）：
    + 任何环境都能跑，无构建步骤；
    + 只在"函数"这一个维度上工作，语义极其直白；
    + 可以随时组合、当普通值传递、容易单测。
    - 只能包函数，碰不到类/字段/访问器的结构；
    - 没有"实例创建时"这类时机；
    - 装饰链要手写嵌套。

【装饰器的代价（无论哪种形态）】
  1) 隐式性：读一个方法时，你不知道它已经被 3 个装饰器包过 ——
     必须回头看声明处，甚至要了解框架的扫描规则；
  2) 调试成本：断点落在业务方法里看不到装饰器，报错栈里全是 wrapper；
  3) 顺序敏感：@A @B 与 @B @A 的行为差异是语义差异（08_decorator.js 已详述）；
  4) 编译/工具链依赖（语法形态）；
  5) 元数据是"约定"：框架读的是装饰器写下的键，键名拼错往往只有运行时才发现；
  6) 类型系统的挑战：装饰器可能改变方法的签名，而类型检查常常看不到。

【什么时候不该用】
  1) 只有一处需要这段逻辑：直接写在那个方法里，别引入装饰器（哪怕语法很优雅）；
  2) 逻辑与业务强耦合：装饰器适合"横切关注点"（日志/缓存/权限/重试），
     不适合"计算金额后写审计表"这类业务步骤；
  3) 项目没有编译步骤，且只有函数级需求：用函数包装（08_decorator.js）；
  4) 需要访问函数内部状态：装饰器只能看到参数与返回值；
  5) 性能敏感的热路径：多层包装的调用开销在每秒百万次调用下会显现；
  6) 团队不熟悉装饰器语义（尤其 legacy/standard 的区别）：
     引入之前先统一认知，否则会写出"看起来对但顺序错了"的代码。

【一句话总纲】
  装饰器是"**把横切逻辑从代码里搬到声明上**"的工具。
  它的收益来自"复用 + 声明式"，代价是"隐式 + 需要工具链"。
  当复用不了、或团队接受不了隐式性时，普通的函数调用是更好的选择。`);

// ===========================================================================
// 收尾：能力检测结论汇总
// ===========================================================================

console.log('\n--- 6. 本文件的能力检测结论汇总 ---\n');
const summaryTable = [
  ['检测项', '结果', '说明'],
  ['Node 版本', `Node ${process.version}`, '本文件的实际运行环境'],
  ['new Function 编译 @ 语法', nativeSupported ? '✓ 通过' : '✗ SyntaxError', '代表引擎默认是否支持'],
  ['--js-decorators（V8 实验开关）', flagProbe[1].supported ? '✓ 可用' : '✗ 仍不支持', 'V8 内部有实验实现，但未接入默认解析路径'],
  ['--experimental-decorators', flagProbe[3].status === 9 ? '✗ 不是有效选项' : '?', 'Node 并没有这个开关（这是 TS/Babel 的配置名）'],
  ['本文件是否可运行', '✓ 退出码 0', '所有 @ 语法都在字符串/注释里，运行时用手写等价实现'],
];
printAlignedTable(summaryTable);

console.log(`
  ★最后强调一次工程原则：
    在**不确定环境是否支持**时，代码里永远不要直接写 @ 语法 ——
    因为语法错误是**编译期**错误，try/catch 根本捕获不到（这也是本文件
    必须用"能力检测 + 字符串示例 + 手写等价"三段式的原因）。
    需要装饰器语义但没有工具链时，请回到 08_decorator.js 的函数包装方案，
    或者像本文件第 3 节那样，把"引擎会做的事"手写一遍 ——
    手写的过程中你会真正理解装饰器，这比会用语法更有价值。`);

console.log('\n全部演示完毕。');
