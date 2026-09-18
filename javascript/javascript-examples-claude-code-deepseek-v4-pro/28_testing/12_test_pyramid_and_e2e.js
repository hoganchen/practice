/**
 * ============================================================================
 * 知识点：测试金字塔与端到端测试 —— 单元 / 集成 / E2E 三层的取舍
 * ============================================================================
 *
 * 【所属分类】28_testing —— 测试
 * 【难度等级】进阶
 * 【前置知识】28_testing/01_why_testing.js、28_testing/04_test_structure.js
 *
 * 【知识点说明】
 *
 * 1. 是什么
 *    "测试金字塔"（Test Pyramid，Mike Cohn 提出）把自动化测试按**范围**分成三层：
 *
 *      ┌──────────────┐
 *      │  E2E / UI    │  少（~5%）  慢（秒级）  贵  脆
 *      ├──────────────┤
 *      │   集成       │  中（~15%） 较快（几十~几百 ms） 中  较稳
 *      ├──────────────┤
 *      │   单元       │  多（~80%） 极快（<1ms）  便宜  稳
 *      └──────────────┘
 *
 *    这不是"哪个更高级"的排名，而是**性价比**的分布：
 *    越往上，单条测试能覆盖的集成问题越多，但每条的成本和不确定性也越高。
 *    金字塔形状的意思是：用大量的廉价单元测试守住逻辑，用少量 E2E 守住
 *    "整条链路真的能跑通"这件事。
 *
 * 2. 为什么需要（真实项目场景）
 *    - 只有单元测试：每个零件都对，装起来却不通（接口对不上、字段拼错、
 *      事务没提交）—— 典型的"单元测试全绿，上线就炸"。
 *    - 只有 E2E 测试：套件跑 40 分钟，随机挂 3 条，没人知道是代码坏了还是
 *      环境抖了；改一行文案要等 40 分钟才知道有没有问题。
 *    - 金字塔型：日常改动几百毫秒内得到反馈；合并前跑集成 + 少量 E2E 兜底。
 *
 * 3. 核心语法要点（本文件用可运行的方式演示）
 *    - 三层测试各自的"范围边界"：
 *        单元：一个函数 / 一个类，没有 IO，依赖全部是替身或纯内存。
 *        集成：几个真实模块连起来（服务 + 仓储 + 序列化），但不含 UI / 浏览器。
 *        E2E ：从最外层入口驱动（HTTP 请求 / 浏览器点击），跑完整条链路。
 *    - E2E 工具定位：
 *        Playwright / Cypress / Selenium —— 驱动**真实浏览器**，
 *        验证"用户能点、能看到、能提交"。代价：需要下载浏览器内核、
 *        启动慢、CI 上要装依赖、DOM 选择器一变就红。
 *        服务端场景下，"E2E"常常退化成"打真实 HTTP 端口的黑盒 API 测试"
 *        （本文件演示的就是这种，用 node:http + fetch 实现，无外部依赖）。
 *    - 判定一个逻辑该写在哪一层，看三个问题：
 *        (a) 它是不是纯逻辑（没有 IO、时间、随机）？→ 单元
 *        (b) 它是不是"模块之间的接线"（谁调谁、字段名对不对、事务边界）？→ 集成
 *        (c) 它是不是"用户能感知的整条路径"（登录→下单→支付→收到通知）？→ E2E
 *
 * 4. 常见陷阱
 *    - 冰淇淋筒（Ice Cream Cone）反模式：大量手工 E2E + 少量单元测试，
 *      形状倒过来。症状：套件越来越慢、越来越不稳定，最后团队集体忽略红灯。
 *    - 用 E2E 测纯逻辑：为了验证"满 300 减 50"去启动浏览器点 5 次，
 *      成本是单元测试的几千倍，收益是零。
 *    - 用单元测试测集成：写 50 个 mock 来"模拟"整个调用链，
 *      结果测的是"我对调用链的假设"，而不是真实调用链。
 *    - 拿 E2E 当"覆盖率工具"：E2E 覆盖率看着高（它确实走了很多代码），
 *      但它不验证分支组合，出问题时定位成本极高。
 *    - 忽略"测试执行时间"这个指标：单元测试超过 10 秒、E2E 超过 10 分钟，
 *      开发者就会开始不跑它们。速度是测试能不能活下来的前提。
 *    - 把"稳定"当成理所当然：E2E 的失败里通常有一半是环境/时序问题。
 *      必须能区分"真失败"和"抖动"，否则红灯会失去意义。
 *
 * 【运行方法】
 *   在仓库根目录执行：node 28_testing/12_test_pyramid_and_e2e.js
 *
 * 【预期输出】
 *   1) 用真实的 node:http 服务 + fetch 搭出一个三层的小应用；
 *   2) 分别在单元 / 集成 / E2E 三层跑一遍测试并**实测耗时**，打印对比表；
 *   3) 注入三种不同层次的缺陷，打印"哪一层抓到了哪个 bug"的矩阵；
 *   4) 模拟"冰淇淋筒"反模式下的耗时爆炸；
 *   5) 模拟 E2E 的抖动（用确定性伪随机，可复现），打印稳定性数据；
 *   6) 最后用真实 node:test 跑一组用例，全部通过，退出码 0。
 * ============================================================================
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

// ===========================================================================
// 第 1 部分：被三层测试共享的"应用"
// ===========================================================================

// ---------------------------------------------------------------------------
// 1.1 领域逻辑层：纯函数。没有 IO、没有时间、没有随机 —— 单元测试的完美对象。
// ---------------------------------------------------------------------------

/**
 * 计算应付金额。
 * 业务规则：满 300 减 50；会员在此基础上再打 95 折（先满减，后打折）。
 *
 * 注意这里的 `>=` 是一个**边界**：total 恰好等于 300 时应该减 50。
 * 这种边界正是单元测试最擅长、也最应该覆盖的地方。
 *
 * @param {number} total 订单原始总价
 * @param {boolean} isMember 是否会员
 * @returns {number} 应付金额，保留两位小数
 */
function calcDiscount(total, isMember) {
  let payable = total;
  if (total >= 300) payable -= 50;
  if (isMember) payable *= 0.95;
  return Math.round(payable * 100) / 100;
}

/**
 * 校验订单结构。返回错误信息数组（空数组表示合法）。
 * @param {{ items?: Array<{ sku: string, qty: number, price: number }> }} order
 * @returns {string[]}
 */
function validateOrder(order) {
  const errors = [];
  const items = order?.items;
  if (!Array.isArray(items) || items.length === 0) {
    errors.push('订单至少需要一件商品');
    return errors;
  }
  for (const item of items) {
    if (!(item.qty > 0)) errors.push(`商品 ${item.sku} 的数量必须大于 0`);
    if (!(item.price >= 0)) errors.push(`商品 ${item.sku} 的价格不能为负`);
  }
  return errors;
}

/**
 * 累加订单总价。
 * @param {Array<{ price: number, qty: number }>} items
 * @returns {number}
 */
function calcTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// ---------------------------------------------------------------------------
// 1.2 仓储层：把"数据存哪"这件事隔离出来，测试时可以换成内存实现。
// ---------------------------------------------------------------------------

/**
 * 内存订单仓储（测试与本地演示用；生产环境会是 MySQL / Redis 的客户端）。
 * @returns {object} 包含 save / findById / count 的异步接口
 */
function createInMemoryOrderRepo() {
  /** @type {Map<string, object>} */
  const rows = new Map();
  return {
    async save(order) {
      rows.set(order.id, { ...order });
    },
    async findById(id) {
      return rows.get(id) ?? null;
    },
    async count() {
      return rows.size;
    },
  };
}

// ---------------------------------------------------------------------------
// 1.3 服务层：编排逻辑。它自己不"做"IO，而是把依赖作为参数拿进来 —— 依赖注入。
// ---------------------------------------------------------------------------

/**
 * 创建下单服务。
 *
 * 三个依赖全部从外面注入，这是整个文件里最关键的设计决定：
 *   - 测试时用内存仓储（快、稳、可断言"到底存进去了没有"）；
 *   - 时间用假时钟（否则 createdAt 每次都不同，断言无从写起）；
 *   - ID 用递增计数器（否则每次都是新 UUID）。
 *
 * @param {object} deps
 * @param {{ save: Function, findById: Function }} deps.repo 仓储
 * @param {() => string} deps.clock 取当前时间（ISO 字符串）
 * @param {() => string} deps.idgen 生成订单 ID
 * @param {(msg: string) => void} deps.logger 日志
 * @param {(total: number, isMember: boolean) => number} [deps.calc] 折扣计算实现
 * @param {boolean} [deps.skipSave] 仅用于演示缺陷：跳过落库这一步
 */
function createOrderService(deps) {
  const { repo, clock, idgen, logger, skipSave = false, calc = calcDiscount } = deps;

  return {
    /**
     * 下单。
     * @param {{ items: Array<{ sku: string, qty: number, price: number }> }} rawOrder
     * @param {{ isMember?: boolean }} [options]
     * @returns {Promise<object>} 创建好的订单
     */
    async placeOrder(rawOrder, options = {}) {
      const errors = validateOrder(rawOrder);
      if (errors.length > 0) {
        const err = new Error(errors.join('；'));
        err.code = 'VALIDATION';
        err.statusCode = 400;
        throw err;
      }

      const total = calcTotal(rawOrder.items);
      const payable = calc(total, options.isMember === true);
      const order = {
        id: idgen(),
        items: rawOrder.items,
        total,
        payable,
        isMember: options.isMember === true,
        createdAt: clock(),
        status: 'created',
      };

      // 缺陷注入点：skipSave 为真时"忘记"落库。
      // 注意这个 bug 在单元层是**看不见的**，因为单元测试根本不碰仓储。
      if (!skipSave) await repo.save(order);
      logger(`订单 ${order.id} 已创建，应付 ￥${payable}`);
      return order;
    },

    /**
     * 查询订单。
     * @param {string} id
     * @returns {Promise<object|null>}
     */
    async getOrder(id) {
      return repo.findById(id);
    },
  };
}

// ---------------------------------------------------------------------------
// 1.4 HTTP 层：把服务暴露成 REST 接口。
// ---------------------------------------------------------------------------

/**
 * 创建 HTTP 服务（用 node:http，零外部依赖）。
 *
 * 路由：
 *   POST /orders       创建订单，成功返回 201 + 订单 JSON；校验失败返回 400
 *   GET  /orders/:id   查询订单，找不到返回 404
 *   GET  /health       健康检查，返回 200 { ok: true }
 *
 * @param {object} deps
 * @param {object} deps.service 下单服务
 * @param {number} [deps.createStatusCode] 仅用于演示缺陷：创建成功的状态码
 * @returns {import('node:http').Server}
 */
function createHttpServer({ service, createStatusCode = 201 }) {
  return http.createServer(async (req, res) => {
    /** 统一以 JSON 响应 */
    const sendJson = (status, body) => {
      const payload = JSON.stringify(body);
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload),
        'X-Powered-By': 'js-examples',
      });
      res.end(payload);
    };

    const url = new URL(req.url, 'http://localhost');

    try {
      if (req.method === 'GET' && url.pathname === '/health') {
        return sendJson(200, { ok: true });
      }

      if (req.method === 'POST' && url.pathname === '/orders') {
        const raw = await readBody(req);
        let body;
        try {
          body = JSON.parse(raw || '{}');
        } catch {
          return sendJson(400, { error: 'INVALID_JSON' });
        }
        const order = await service.placeOrder(body, { isMember: body.isMember === true });
        return sendJson(createStatusCode, order);
      }

      const m = url.pathname.match(/^\/orders\/([^/]+)$/);
      if (req.method === 'GET' && m) {
        const order = await service.getOrder(decodeURIComponent(m[1]));
        if (!order) return sendJson(404, { error: 'NOT_FOUND' });
        return sendJson(200, order);
      }

      return sendJson(404, { error: 'NO_ROUTE' });
    } catch (err) {
      // 服务层抛出的业务错误 → 400；其它一律 500
      return sendJson(err.statusCode ?? 500, { error: err.code ?? 'INTERNAL', message: err.message });
    }
  });
}

/**
 * 读取请求体（node:http 的 IncomingMessage 是流，需要自己拼）。
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

/**
 * 组装一个完整的应用实例。
 *
 * 三个可选参数就是三个"缺陷注入点"，分别位于三层 —— 这正是后面缺陷矩阵的基础。
 * 之所以能这么轻松地注入，是因为每一层的依赖都是**从外面传进来的**：
 * 如果 createOrderService 内部直接 `import { calcDiscount }`，
 * 你就只能去改源码才能模拟"算错折扣"这个场景。
 *
 * @param {object} [opts]
 * @param {(total: number, isMember: boolean) => number} [opts.calc] 折扣实现（领域层）
 * @param {boolean} [opts.skipSave] 是否跳过落库（服务层）
 * @param {number} [opts.createStatusCode] 创建成功的状态码（HTTP 层）
 * @returns {{ server: import('node:http').Server, service: object, repo: object }}
 */
function buildApp(opts = {}) {
  const repo = createInMemoryOrderRepo();
  let seq = 0;

  const service = createOrderService({
    repo,
    clock: () => '2026-01-01T00:00:00.000Z', // 假时钟：时间固定，断言才写得出来
    idgen: () => `order-${++seq}`, // 递增 ID：可预测
    logger: () => {}, // 测试里不需要日志噪音
    calc: opts.calc ?? calcDiscount,
    skipSave: opts.skipSave ?? false,
  });

  const server = createHttpServer({
    service,
    createStatusCode: opts.createStatusCode ?? 201,
  });

  return { server, service, repo };
}

// ===========================================================================
// 第 2 部分：迷你测试运行器（带实测计时）
// ===========================================================================

/** 各层的实测结果收集器 */
const layerStats = {
  unit: { pass: 0, fail: 0, ms: 0, files: new Set() },
  integration: { pass: 0, fail: 0, ms: 0, files: new Set() },
  e2e: { pass: 0, fail: 0, ms: 0, files: new Set() },
};

/**
 * 运行一组用例并统计耗时。
 *
 * 设计要点（本身就是测试最佳实践的演示）：
 *   - setup / teardown 每条用例各执行一次，对应 node:test 的 beforeEach / afterEach。
 *     每条用例拿到**全新的**上下文，是最好的隔离方式：
 *     如果所有用例共用一个内存仓储，第一条用例造的数据就会污染后面的断言
 *     （本文件最初就是这么写的，结果"失败的订单不该落库"这条断言被前序用例污染而误报）。
 *   - 计时的范围包含 setup + 用例体 + teardown，因为在真实项目里
 *     "起环境"的时间是必须付出的成本 —— 这正是 E2E 昂贵的原因之一。
 *
 * @param {'unit'|'integration'|'e2e'} layer 所属层
 * @param {string} suiteName 套件名
 * @param {Array<{ name: string, fn: (ctx: any) => unknown | Promise<unknown> }>} cases
 * @param {{ setup?: () => any | Promise<any>, teardown?: (ctx: any) => any | Promise<any> }} [hooks]
 * @param {boolean} [quiet] 只统计不打印明细
 * @returns {Promise<{ pass: number, fail: number, ms: number, failures: string[] }>}
 */
async function runSuite(layer, suiteName, cases, hooks = {}, quiet = false) {
  const started = process.hrtime.bigint();
  let pass = 0;
  let fail = 0;
  const failures = [];

  if (!quiet) console.log(`  ${suiteName}（${layer}）：`);

  for (const c of cases) {
    const t0 = process.hrtime.bigint();
    let ctx;
    try {
      ctx = hooks.setup ? await hooks.setup() : {};
      await c.fn(ctx);
      pass++;
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      if (!quiet) console.log(`    ✔ ${c.name}  (${ms.toFixed(2)}ms)`);
    } catch (err) {
      fail++;
      failures.push(c.name);
      if (!quiet) console.log(`    ✖ ${c.name}  → ${String(err.message).split('\n')[0]}`);
    } finally {
      // 无论成功失败都要清场：否则失败的用例会留下没关掉的服务器，让进程挂住
      if (hooks.teardown && ctx !== undefined) {
        try {
          await hooks.teardown(ctx);
        } catch {
          /* 清场失败不影响结论 */
        }
      }
    }
  }

  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  layerStats[layer].pass += pass;
  layerStats[layer].fail += fail;
  layerStats[layer].ms += ms;
  layerStats[layer].files.add(suiteName);

  if (!quiet) console.log(`    → 通过 ${pass}，失败 ${fail}，耗时 ${ms.toFixed(2)}ms\n`);
  return { pass, fail, ms, failures };
}

/** 启动服务器并返回它的基地址（监听 0 端口，由系统分配空闲端口，避免冲突） */
function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

/** 关闭服务器 */
function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

// ===========================================================================
// 第 3 部分：三层测试长什么样
// ===========================================================================

console.log('--- 1. 三层的定义与性价比 ---');
/** 金字塔三层的静态对比表 */
const pyramid = [
  {
    layer: '单元（Unit）',
    share: '~80%',
    scope: '一个函数 / 一个类',
    speed: '< 1ms',
    deps: '无 IO，依赖全用替身',
    good: '分支、边界、算法、数据转换',
    bad: '模块间接线、事务、序列化',
  },
  {
    layer: '集成（Integration）',
    share: '~15%',
    scope: '几个真实模块连起来',
    speed: '几十 ~ 几百 ms',
    deps: '可用真仓储（内存/容器）/ 假时钟',
    good: '接线、字段名、事务边界、错误传播',
    bad: '用户视角的完整流程、真实网络',
  },
  {
    layer: 'E2E / UI',
    share: '~5%',
    scope: '从最外层入口驱动整条链路',
    speed: '秒级（浏览器）/ 几十 ms（HTTP）',
    deps: '全部真实（含浏览器、数据库、网络）',
    good: '"这条关键路径真的能跑通"',
    bad: '分支细节、边界值、定位问题',
  },
];

console.log(
  '  ' +
    '层次'.padEnd(20) +
    '占比'.padEnd(8) +
    '范围'.padEnd(26) +
    '速度'.padEnd(24) +
    '擅长'.padEnd(30) +
    '不擅长',
);
console.log('  ' + '-'.repeat(130));
for (const row of pyramid) {
  console.log(
    '  ' +
      row.layer.padEnd(18) +
      row.share.padEnd(6) +
      row.scope.padEnd(24) +
      row.speed.padEnd(22) +
      row.good.padEnd(28) +
      row.bad,
  );
}
console.log();

// ---------------------------------------------------------------------------
// 3.1 单元层
// ---------------------------------------------------------------------------

console.log('--- 2. 单元层：纯逻辑、边界、零 IO ---');

/** @type {Array<{name: string, fn: Function}>} */
const unitCases = [
  {
    name: '满 300 减 50：恰好 300 也要减（边界）',
    fn: () => assert.equal(calcDiscount(300, false), 250),
  },
  { name: '不满 300 不减', fn: () => assert.equal(calcDiscount(299.99, false), 299.99) },
  { name: '会员先满减后打折', fn: () => assert.equal(calcDiscount(300, true), 237.5) },
  { name: '非会员不打折', fn: () => assert.equal(calcDiscount(100, false), 100) },
  { name: '金额保留两位小数（避免浮点尾数）', fn: () => assert.equal(calcDiscount(333.33, true), 269.16) },
  { name: '空订单被拒绝', fn: () => assert.deepEqual(validateOrder({ items: [] }), ['订单至少需要一件商品']) },
  {
    name: '数量必须大于 0',
    fn: () =>
      assert.deepEqual(validateOrder({ items: [{ sku: 'A', qty: 0, price: 10 }] }), [
        '商品 A 的数量必须大于 0',
      ]),
  },
  {
    name: '价格为负被拒绝',
    fn: () =>
      assert.deepEqual(validateOrder({ items: [{ sku: 'B', qty: 1, price: -1 }] }), [
        '商品 B 的价格不能为负',
      ]),
  },
  { name: '合法订单没有错误', fn: () => assert.deepEqual(validateOrder({ items: [{ sku: 'C', qty: 2, price: 5 }] }), []) },
  { name: '总价累加', fn: () => assert.equal(calcTotal([{ price: 10, qty: 3 }, { price: 2.5, qty: 4 }]), 40) },
];

await runSuite('unit', 'calcDiscount / validateOrder 的单元测试', unitCases);

// ---------------------------------------------------------------------------
// 3.2 集成层：真实的服务 + 真实的仓储（内存实现），但不经过 HTTP
// ---------------------------------------------------------------------------

console.log('--- 3. 集成层：把真实模块接起来 ---');

/**
 * 为集成测试搭一套"干净"的依赖：内存仓储 + 假时钟 + 递增 ID。
 * 这就是依赖注入的价值 —— 不需要任何 mock 框架，传参即可。
 */
function makeIntegrationCtx() {
  const repo = createInMemoryOrderRepo();
  let seq = 0;
  const service = createOrderService({
    repo,
    clock: () => '2026-01-01T00:00:00.000Z',
    idgen: () => `order-${++seq}`,
    logger: () => {},
  });
  return { repo, service };
}

const integrationCases = [
  {
    name: '下单后，订单真的被写进了仓储（接线验证）',
    fn: async ({ service, repo }) => {
      const order = await service.placeOrder({ items: [{ sku: 'KBD', qty: 1, price: 399 }] });
      const saved = await repo.findById(order.id);
      assert.ok(saved, '仓储里应该能查到这张订单');
      assert.equal(saved.id, order.id);
    },
  },
  {
    name: '仓储里保存的字段与服务返回一致（字段名对得上）',
    fn: async ({ service, repo }) => {
      const order = await service.placeOrder({ items: [{ sku: 'KBD', qty: 1, price: 399 }] });
      const saved = await repo.findById(order.id);
      assert.deepEqual(saved, order);
    },
  },
  {
    name: '应付金额落库正确（服务 + 领域逻辑串起来）',
    fn: async ({ service, repo }) => {
      const order = await service.placeOrder(
        { items: [{ sku: 'KBD', qty: 1, price: 300 }] },
        { isMember: true },
      );
      const saved = await repo.findById(order.id);
      assert.equal(saved.payable, 237.5);
    },
  },
  {
    name: '校验失败时抛错，且**不产生**任何副作用（事务语义）',
    fn: async ({ service, repo }) => {
      await assert.rejects(
        () => service.placeOrder({ items: [{ sku: 'X', qty: 0, price: 1 }] }),
        (err) => err.code === 'VALIDATION',
      );
      assert.equal(await repo.count(), 0, '失败的订单不该落库');
    },
  },
  {
    name: '查不到的订单返回 null 而不是抛错',
    fn: async ({ service }) => {
      assert.equal(await service.getOrder('nope'), null);
    },
  },
  {
    name: '时间字段来自注入的时钟（可预测）',
    fn: async ({ service }) => {
      const order = await service.placeOrder({ items: [{ sku: 'KBD', qty: 1, price: 399 }] });
      assert.equal(order.createdAt, '2026-01-01T00:00:00.000Z');
    },
  },
];

await runSuite('integration', '下单服务 + 内存仓储的集成测试', integrationCases, {
  setup: makeIntegrationCtx, // 每条用例一套全新的内存仓储，互不污染
});

// ---------------------------------------------------------------------------
// 3.3 E2E 层：真实 HTTP 端口 + 真实 fetch
//   真实项目里这一层通常由 Playwright 驱动浏览器；服务端的等价物就是"打真实端口"。
// ---------------------------------------------------------------------------

console.log('--- 4. E2E 层：真实 HTTP 端口 + fetch（服务端场景；浏览器场景由 Playwright 承担）---');

/**
 * 创建 E2E 上下文：启动一个真实服务器。
 * 端口用 0 让系统分配，用完必须 close，否则进程不会退出（这是最常见的"挂起"原因）。
 */
async function makeE2eCtx() {
  const { server } = buildApp();
  const baseUrl = await listen(server);
  return { server, baseUrl };
}

const e2eCases = [
  {
    name: 'GET /health 返回 200',
    fn: async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), { ok: true });
    },
  },
  {
    name: 'POST /orders 返回 201 与订单体',
    fn: async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ sku: 'KBD', qty: 1, price: 399 }] }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.payable, 349);
      assert.equal(body.status, 'created');
    },
  },
  {
    name: '创建成功响应带 Content-Type: application/json',
    fn: async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ sku: 'KBD', qty: 1, price: 100 }] }),
      });
      assert.match(res.headers.get('content-type'), /application\/json/);
    },
  },
  {
    name: '端到端：创建后能立刻查到（HTTP → 服务 → 仓储 → 回到 HTTP）',
    fn: async ({ baseUrl }) => {
      const created = await (
        await fetch(`${baseUrl}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: [{ sku: 'KBD', qty: 2, price: 199 }] }),
        })
      ).json();
      const res = await fetch(`${baseUrl}/orders/${created.id}`);
      assert.equal(res.status, 200);
      assert.equal((await res.json()).id, created.id);
    },
  },
  {
    name: '校验失败返回 400 与错误码（错误路径同样要测）',
    fn: async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [] }),
      });
      assert.equal(res.status, 400);
      assert.equal((await res.json()).error, 'VALIDATION');
    },
  },
  {
    name: '非法 JSON 返回 400 而不是 500',
    fn: async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ not json',
      });
      assert.equal(res.status, 400);
      assert.equal((await res.json()).error, 'INVALID_JSON');
    },
  },
  {
    name: '不存在的订单返回 404',
    fn: async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/orders/does-not-exist`);
      assert.equal(res.status, 404);
    },
  },
  {
    name: '未知路由返回 404',
    fn: async ({ baseUrl }) => {
      const res = await fetch(`${baseUrl}/nope`);
      assert.equal(res.status, 404);
    },
  },
];

await runSuite('e2e', '真实 HTTP 端口的端到端测试', e2eCases, {
  setup: makeE2eCtx,
  teardown: (ctx) => close(ctx.server), // 用完一定关掉，否则 node 进程会挂住不退出
});

// ---------------------------------------------------------------------------
// 3.4 三层横向对比
// ---------------------------------------------------------------------------

console.log('--- 5. 三层横向对比（本机实测）---');
const totalTests = layerStats.unit.pass + layerStats.integration.pass + layerStats.e2e.pass;
const totalMs = layerStats.unit.ms + layerStats.integration.ms + layerStats.e2e.ms;

console.log('  ' + '层次'.padEnd(14) + '用例数'.padEnd(10) + '总耗时'.padEnd(14) + '平均每条'.padEnd(14) + '占比');
console.log('  ' + '-'.repeat(70));
for (const [layer, s] of Object.entries(layerStats)) {
  const count = s.pass + s.fail;
  const avg = count ? s.ms / count : 0;
  console.log(
    '  ' +
      layer.padEnd(12) +
      String(count).padEnd(8) +
      `${s.ms.toFixed(2)}ms`.padEnd(12) +
      `${avg.toFixed(3)}ms`.padEnd(12) +
      `${((count / totalTests) * 100).toFixed(1)}%`,
  );
}
console.log(
  `  合计 ${totalTests} 条，共 ${totalMs.toFixed(2)}ms。` +
    `（注意：本文件的 E2E 是"同进程内的本地 HTTP"，比真实浏览器 E2E 快 2~3 个数量级，` +
    `真实 Playwright 单条通常 1~5 秒）`,
);
console.log();

// ===========================================================================
// 第 4 部分：缺陷矩阵 —— 哪一层能抓到哪种 bug
// ===========================================================================

console.log('--- 6. 缺陷矩阵：把 bug 放在不同层，看哪层能抓到 ---');

/** 写错边界的折扣实现（缺陷 1：>= 写成 >） */
function calcDiscountBuggy(total, isMember) {
  let payable = total;
  if (total > 300) payable -= 50; // 少了 "="，恰好 300 时不减
  if (isMember) payable *= 0.95;
  return Math.round(payable * 100) / 100;
}

/**
 * 缺陷清单。每一条都对应**一层**，并且三层测试都会跑一遍。
 *
 * 每层探针的共同点：都在验证同一件事（"下单 300 元应付 250，且事后能查到"），
 * 只是驱动的起点不同 —— 这才能公平地比较"哪层抓得到"。
 */
const defects = [
  {
    label: '（无缺陷的基线）',
    where: '—',
    app: {},
    unit: () => calcDiscount(300, false),
    // 集成探针：从服务层进入，断言金额 + 断言真的落库
    integration: async (service, repo) => {
      const order = await service.placeOrder({ items: [{ sku: 'K', qty: 1, price: 300 }] });
      assert.equal(order.payable, 250);
      assert.ok(await repo.findById(order.id));
    },
    // E2E 探针：从 HTTP 进入，断言状态码 + 金额 + "创建后可查到"
    e2e: async (baseUrl) => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ sku: 'K', qty: 1, price: 300 }] }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.payable, 250);
      assert.equal((await fetch(`${baseUrl}/orders/${body.id}`)).status, 200);
    },
  },
  {
    label: '满减边界写错：>= 写成 >',
    where: '领域逻辑层（纯函数）',
    app: { calc: calcDiscountBuggy },
    unit: () => calcDiscountBuggy(300, false),
    integration: async (service, repo) => {
      const order = await service.placeOrder({ items: [{ sku: 'K', qty: 1, price: 300 }] });
      assert.equal(order.payable, 250);
      assert.ok(await repo.findById(order.id));
    },
    e2e: async (baseUrl) => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ sku: 'K', qty: 1, price: 300 }] }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.payable, 250);
    },
  },
  {
    label: '服务层忘记把订单落库',
    where: '服务层（模块接线）',
    app: { skipSave: true },
    // 单元探针：纯函数算得完全正确 —— 这个 bug 与它无关，必然"漏掉"
    unit: () => calcDiscount(300, false),
    integration: async (service, repo) => {
      const order = await service.placeOrder({ items: [{ sku: 'K', qty: 1, price: 300 }] });
      assert.equal(order.payable, 250);
      assert.ok(await repo.findById(order.id), '订单应该落库');
    },
    e2e: async (baseUrl) => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ sku: 'K', qty: 1, price: 300 }] }),
      });
      const body = await res.json();
      assert.equal(body.payable, 250);
      assert.equal((await fetch(`${baseUrl}/orders/${body.id}`)).status, 200, '创建后应能查到');
    },
  },
  {
    label: '创建成功却返回 200 而不是 201',
    where: 'HTTP 层（协议契约）',
    app: { createStatusCode: 200 },
    unit: () => calcDiscount(300, false),
    integration: async (service, repo) => {
      const order = await service.placeOrder({ items: [{ sku: 'K', qty: 1, price: 300 }] });
      assert.equal(order.payable, 250);
      assert.ok(await repo.findById(order.id));
    },
    e2e: async (baseUrl) => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [{ sku: 'K', qty: 1, price: 300 }] }),
      });
      assert.equal(res.status, 201, '创建成功应返回 201');
    },
  },
];

console.log('  ' + '缺陷'.padEnd(34) + '所在的层'.padEnd(24) + '单元'.padEnd(8) + '集成'.padEnd(8) + 'E2E');
console.log('  ' + '-'.repeat(88));

/** 跑一个同步/异步探针，返回"是否失败" */
async function probeFailed(fn) {
  try {
    await fn();
    return false; // 没失败 → 这一层没抓到
  } catch {
    return true; // 抛错 → 这一层抓到了
  }
}

for (const defect of defects) {
  // 单元层：直接调函数，不碰任何依赖
  const unitCaught = await probeFailed(defect.unit);

  // 集成层：真实服务 + 真实内存仓储（没有 HTTP）
  const { service, repo } = buildApp(defect.app);
  const integrationCaught = await probeFailed(() => defect.integration(service, repo));

  // E2E 层：真实 HTTP 端口 + fetch
  const e2eApp = buildApp(defect.app);
  const baseUrl = await listen(e2eApp.server);
  let e2eCaught;
  try {
    e2eCaught = await probeFailed(() => defect.e2e(baseUrl));
  } finally {
    await close(e2eApp.server);
  }

  // 基线那一行，三层都不该"抓到"，显示成 '—'
  const cell = (caught) => (defect.label.startsWith('（无缺陷') ? '—' : caught ? '抓到' : '漏掉');

  console.log(
    '  ' +
      defect.label.padEnd(32) +
      defect.where.padEnd(22) +
      cell(unitCaught).padEnd(6) +
      cell(integrationCaught).padEnd(6) +
      cell(e2eCaught),
  );
}
console.log();
console.log('  结论（这正是金字塔形状存在的理由）：');
console.log('    - 纯逻辑缺陷 → 单元层就抓到，且定位成本最低（直接指出函数与边界值）。');
console.log('    - 接线缺陷（忘了落库、字段名写错）→ 单元层完全看不见，必须靠集成层。');
console.log('    - 协议/契约缺陷（状态码、响应头）→ 只有走真实入口的 E2E 层能抓到。');
console.log('    - 所以三层不是"重复劳动"，而是各自守住一类缺陷。');
console.log();

// ===========================================================================
// 第 5 部分：冰淇淋筒反模式
// ===========================================================================

console.log('--- 7. 冰淇淋筒反模式：把同样的验证量倒过来放 ---');

/**
 * 模拟不同测试分布下的套件总耗时。
 *
 * 用"实测的单条平均耗时"作为单价，乘上不同分布下的用例条数。
 * 真实项目里 E2E 的单价远高于本文件的本地 HTTP 测量值，
 * 所以真实差距会比这里打印出来的还要夸张。
 *
 * @param {number} unitCount
 * @param {number} integrationCount
 * @param {number} e2eCount
 * @returns {{ total: number, detail: string }}
 */
function estimateSuiteCost(unitCount, integrationCount, e2eCount) {
  const price = {
    unit: layerStats.unit.ms / (layerStats.unit.pass + layerStats.unit.fail),
    integration: layerStats.integration.ms / (layerStats.integration.pass + layerStats.integration.fail),
    e2e: layerStats.e2e.ms / (layerStats.e2e.pass + layerStats.e2e.fail),
  };
  const total = unitCount * price.unit + integrationCount * price.integration + e2eCount * price.e2e;
  return {
    total,
    price,
    detail: `单元 ${unitCount}×${price.unit.toFixed(3)}ms + 集成 ${integrationCount}×${price.integration.toFixed(3)}ms + E2E ${e2eCount}×${price.e2e.toFixed(3)}ms`,
  };
}

const VERIFICATIONS = 200; // 假设我们对这个系统有 200 个"要验证的点"

/** 金字塔：80 / 15 / 5 */
const pyramidCost = estimateSuiteCost(
  Math.round(VERIFICATIONS * 0.8),
  Math.round(VERIFICATIONS * 0.15),
  Math.round(VERIFICATIONS * 0.05),
);
/** 冰淇淋筒：5 / 15 / 80 */
const coneCost = estimateSuiteCost(
  Math.round(VERIFICATIONS * 0.05),
  Math.round(VERIFICATIONS * 0.15),
  Math.round(VERIFICATIONS * 0.8),
);

console.log(`  同样 ${VERIFICATIONS} 个验证点，两种分布：`);
console.log(`    金字塔 80/15/5：${pyramidCost.detail}`);
console.log(`      → 预计总耗时 ${pyramidCost.total.toFixed(1)}ms（本机单进程实测单价）`);
console.log(`    冰淇淋筒 5/15/80：${coneCost.detail}`);
console.log(`      → 预计总耗时 ${coneCost.total.toFixed(1)}ms，是金字塔的 ${(coneCost.total / pyramidCost.total).toFixed(1)} 倍`);
console.log();
console.log('  更要命的不是慢，而是这一层的三个副作用：');
console.log('    1) 稳定性：E2E 失败原因里混着环境/时序问题，"红灯"逐渐失去可信度；');
console.log('    2) 定位成本：一条 E2E 红了，你只知道"整条链路不对"，不知道是哪个函数；');
console.log('    3) 反馈速度：一次改动要等几分钟才知道结果，开发者会开始跳过测试。');
console.log();

// ===========================================================================
// 第 6 部分：E2E 的稳定性问题（可复现的伪随机模拟）
// ===========================================================================

console.log('--- 8. E2E 的稳定性：为什么"抖动"是 E2E 的固有属性 ---');

/**
 * 确定性伪随机数生成器（mulberry32）。
 * 用固定种子，保证每次运行结果完全一致 —— 演示代码不该自己制造不确定性。
 * @param {number} seed
 * @returns {() => number} 返回 [0,1) 区间的伪随机数
 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 模拟一次"带抖动的断言"。
 *
 * 模型：被测操作耗时服从某个分布（本地很快，CI 上偶尔变慢），
 * 测试里写了一个超时阈值；耗时超过阈值就判失败 —— 但代码其实没坏。
 *
 * @param {() => number} rnd 伪随机源
 * @param {number} baseMs 基准耗时
 * @param {number} spreadMs 抖动幅度
 * @param {number} timeoutMs 测试里设定的超时阈值
 * @returns {{ ms: number, passed: boolean }}
 */
function flakyAssertion(rnd, baseMs, spreadMs, timeoutMs) {
  // 长尾分布：多数很快，偶尔很慢（CI 上邻居进程抢 CPU、GC、网络重试……）
  const slowTail = rnd() > 0.85 ? spreadMs * 4 : 0;
  const ms = baseMs + rnd() * spreadMs + slowTail;
  return { ms, passed: ms <= timeoutMs };
}

const ROUNDS = 200;
const flakyRnd = mulberry32(20260101);

let unitFlaky = 0;
let integrationFlaky = 0;
let e2eFlaky = 0;

for (let i = 0; i < ROUNDS; i++) {
  // 单元测试：本地纯计算，几乎不可能超时（阈值给得很宽）
  if (!flakyAssertion(flakyRnd, 0.2, 0.05, 50).passed) unitFlaky++;
  // 集成测试：本地内存仓储，稍慢但可控
  if (!flakyAssertion(flakyRnd, 5, 3, 200).passed) integrationFlaky++;
  // E2E：真实浏览器/网络，抖动大，且超时阈值必须收紧（否则失败定位更慢）
  if (!flakyAssertion(flakyRnd, 1500, 400, 2000).passed) e2eFlaky++;
}

console.log(`  模拟各层跑 ${ROUNDS} 轮（固定随机种子，结果可复现）：`);
console.log(`    单元层  假失败 ${unitFlaky} 次  → 假失败率 ${((unitFlaky / ROUNDS) * 100).toFixed(1)}%`);
console.log(`    集成层  假失败 ${integrationFlaky} 次  → 假失败率 ${((integrationFlaky / ROUNDS) * 100).toFixed(1)}%`);
console.log(`    E2E 层  假失败 ${e2eFlaky} 次  → 假失败率 ${((e2eFlaky / ROUNDS) * 100).toFixed(1)}%`);
console.log();
console.log('  注意：这里所有"失败"都不是代码坏了，只是耗时抖动越过了阈值。');
console.log('  这就是为什么 E2E 必须做到：');
console.log('    - 对易抖动的断言用"重试"（Playwright 的 expect 自带自动重试）；');
console.log('    - 用显式的"等待条件"而不是固定 sleep；');
console.log('    - 把不稳定的用例隔离出来单独跟踪，而不是让整个套件常年带红。');
console.log();

// ===========================================================================
// 第 7 部分：决策指南
// ===========================================================================

console.log('--- 9. 一条新逻辑该写在哪一层？---');
/** 决策清单：问题 → 该去哪一层 */
const decisionGuide = [
  ['这段逻辑是纯计算吗（输入→输出，无 IO / 无时间 / 无随机）？', '单元层'],
  ['这里有边界值吗（>= / >、空数组、0、负数、超长字符串）？', '单元层（每条边界一个用例）'],
  ['这里涉及"谁调用谁"、字段名、事务边界、错误如何向上传播？', '集成层'],
  ['这里涉及真实 SQL / 文件 / 队列 / 第三方 SDK 的语义？', '集成层（用真容器或内存实现）'],
  ['用户说"点这里应该能下单成功"，这是核心收入路径吗？', 'E2E（但只写一条 happy path + 一条关键错误路径）'],
  ['这是浏览器渲染 / 文件上传 / 支付跳转等"只有真环境才能验证"的事？', 'E2E（Playwright）'],
  ['这是"内部实现细节"（私有函数、重构后可能消失的东西）？', '不要直接测，让上层测试覆盖它'],
];
console.log('  ' + '问题'.padEnd(66) + '落点');
console.log('  ' + '-'.repeat(96));
for (const [q, a] of decisionGuide) console.log('  ' + q.padEnd(64) + a);
console.log();
console.log('  经验法则：');
console.log('    - 先用单元测试把逻辑覆盖住（快、稳、定位准）；');
console.log('    - 再用集成测试把"接线"钉死（这是单元测试的盲区）；');
console.log('    - 最后用个位数的 E2E 守住"关键路径真的通"，而不是用它来测逻辑。');
console.log();

// ===========================================================================
// 第 8 部分：真实 node:test 用例（保证本文件本身是被测试过的）
// ===========================================================================

test('【单元】calcDiscount 的边界：恰好 300 应该减 50', () => {
  assert.equal(calcDiscount(300, false), 250);
  assert.equal(calcDiscount(300, true), 237.5);
});

test('【集成】下单后订单真的落进了仓储', async () => {
  const { service, repo } = makeIntegrationCtx();
  const order = await service.placeOrder({ items: [{ sku: 'KBD', qty: 1, price: 399 }] });
  assert.ok(await repo.findById(order.id));
});

test('【E2E】真实 HTTP 端口上创建订单返回 201', async () => {
  const ctx = await makeE2eCtx();
  try {
    const res = await fetch(`${ctx.baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ sku: 'KBD', qty: 1, price: 399 }] }),
    });
    assert.equal(res.status, 201);
    assert.equal((await res.json()).payable, 349);
  } finally {
    await close(ctx.server); // 一定要关，否则测试进程挂住
  }
});
